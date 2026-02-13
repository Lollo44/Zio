from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import os
import uuid
import httpx
import random
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Walter the Walker API")

# Get allowed origins from environment or use default localhost origins
allowed_origins = os.environ.get("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# ===== MODELS =====

class ProfileSetup(BaseModel):
    nome: str
    eta: int
    peso: float
    altezza: float
    livello: str
    obiettivo: str
    giorni_disponibili: List[str]

class WalkSession(BaseModel):
    distanza_km: float
    tempo_secondi: int
    passi: int
    velocita_media_kmh: float
    percorso: Optional[List[dict]] = None
    note: Optional[str] = None

class SetLog(BaseModel):
    set_number: int
    ripetizioni: int
    peso_kg: float
    completato: bool = False

class CircuitExerciseLog(BaseModel):
    exercise_id: str
    nome: str
    sets: List[SetLog]
    piano_serie: Optional[int] = None
    piano_ripetizioni: Optional[int] = None
    piano_peso_kg: Optional[float] = None

class CircuitSession(BaseModel):
    durata_minuti: int
    esercizi: List[CircuitExerciseLog]
    note: Optional[str] = None

class PlanCreate(BaseModel):
    nome: str
    tipo: str
    giorni: List[dict]

class PlanExerciseUpdate(BaseModel):
    giorno_index: int
    exercise_index: int
    serie: Optional[int] = None
    ripetizioni: Optional[int] = None
    peso_kg: Optional[float] = None
    nome: Optional[str] = None
    note: Optional[str] = None

# ===== AUTH HELPERS =====

async def get_current_user(request: Request):
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    if not session_token:
        raise HTTPException(status_code=401, detail="Non autenticato")
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Sessione non valida")
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Sessione scaduta")
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Utente non trovato")
    return user_doc

# ===== AUTH ENDPOINTS =====

@app.post("/api/auth/session")
async def create_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id mancante")
    async with httpx.AsyncClient() as http_client:
        resp = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Sessione Google non valida")
        data = resp.json()
    email = data["email"]
    name = data.get("name", "")
    picture = data.get("picture", "")
    session_token = data.get("session_token", str(uuid.uuid4()))
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one({"email": email}, {"$set": {"name": name, "picture": picture, "updated_at": datetime.now(timezone.utc)}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({"user_id": user_id, "email": email, "name": name, "picture": picture, "profile_complete": False, "created_at": datetime.now(timezone.utc)})
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({"user_id": user_id, "session_token": session_token, "expires_at": expires_at, "created_at": datetime.now(timezone.utc)})
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7*24*3600)
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user_doc

@app.get("/api/auth/me")
async def auth_me(request: Request):
    return await get_current_user(request)

@app.post("/api/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/", samesite="none", secure=True)
    return {"message": "Logout effettuato"}

# ===== PROFILE =====

@app.get("/api/profile")
async def get_profile(request: Request):
    return await get_current_user(request)

@app.put("/api/profile")
async def update_profile(request: Request, profile: ProfileSetup):
    user = await get_current_user(request)
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {
        "nome": profile.nome, "eta": profile.eta, "peso": profile.peso,
        "altezza": profile.altezza, "livello": profile.livello, "obiettivo": profile.obiettivo,
        "giorni_disponibili": profile.giorni_disponibili, "profile_complete": True,
        "updated_at": datetime.now(timezone.utc),
    }})
    return await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})

# ===== WALKS =====

@app.get("/api/walks")
async def get_walks(request: Request):
    user = await get_current_user(request)
    return await db.walks.find({"user_id": user["user_id"]}, {"_id": 0}).sort("data", -1).to_list(100)

@app.post("/api/walks")
async def create_walk(request: Request, walk: WalkSession):
    user = await get_current_user(request)
    walk_doc = {
        "walk_id": f"walk_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "distanza_km": walk.distanza_km,
        "tempo_secondi": walk.tempo_secondi,
        "passi": walk.passi,
        "velocita_media_kmh": walk.velocita_media_kmh,
        "percorso": walk.percorso or [],
        "note": walk.note,
        "data": datetime.now(timezone.utc).isoformat(),
    }
    await db.walks.insert_one(walk_doc)
    walk_doc.pop("_id", None)
    return walk_doc

# ===== CIRCUITS =====

@app.get("/api/circuits")
async def get_circuits(request: Request):
    user = await get_current_user(request)
    return await db.circuits.find({"user_id": user["user_id"]}, {"_id": 0}).sort("data", -1).to_list(100)

@app.post("/api/circuits")
async def create_circuit(request: Request, circuit: CircuitSession):
    user = await get_current_user(request)
    esercizi_data = []
    for e in circuit.esercizi:
        sets_data = [s.dict() for s in e.sets]
        # Calculate deviations from plan
        total_reps_done = sum(s["ripetizioni"] for s in sets_data if s["completato"])
        total_sets_done = sum(1 for s in sets_data if s["completato"])
        avg_weight = sum(s["peso_kg"] for s in sets_data if s["completato"]) / max(total_sets_done, 1)
        piano_reps_tot = (e.piano_serie or 0) * (e.piano_ripetizioni or 0)
        piano_peso = e.piano_peso_kg or 0
        dev_reps = total_reps_done - piano_reps_tot if piano_reps_tot > 0 else 0
        dev_peso = round(avg_weight - piano_peso, 1) if piano_peso > 0 else 0
        dev_serie = total_sets_done - (e.piano_serie or 0) if e.piano_serie else 0
        esercizi_data.append({
            "exercise_id": e.exercise_id, "nome": e.nome, "sets": sets_data,
            "piano_serie": e.piano_serie, "piano_ripetizioni": e.piano_ripetizioni,
            "piano_peso_kg": e.piano_peso_kg,
            "deviazioni": {"reps": dev_reps, "peso_kg": dev_peso, "serie": dev_serie},
        })
    circuit_doc = {
        "circuit_id": f"circuit_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "durata_minuti": circuit.durata_minuti,
        "esercizi": esercizi_data,
        "note": circuit.note,
        "data": datetime.now(timezone.utc).isoformat(),
    }
    await db.circuits.insert_one(circuit_doc)
    circuit_doc.pop("_id", None)
    return circuit_doc

# ===== EXERCISES =====

from exercises_database import ESERCIZI_DATABASE, ELASTICI_KG_MAPPING, CATEGORIE

@app.get("/api/exercises")
async def get_exercises(request: Request, categoria: Optional[str] = None):
    await get_current_user(request)
    # Seed database if empty
    count = await db.exercises.count_documents({})
    if count == 0:
        for ex in ESERCIZI_DATABASE:
            await db.exercises.insert_one(ex.copy())
    # Query with optional category filter
    query = {"categoria": categoria} if categoria else {}
    exercises = await db.exercises.find(query, {"_id": 0}).to_list(100)
    return exercises

@app.get("/api/exercises/categories")
async def get_exercise_categories(request: Request):
    await get_current_user(request)
    return {"categorie": CATEGORIE}

@app.get("/api/exercises/{exercise_id}")
async def get_exercise_detail(request: Request, exercise_id: str):
    await get_current_user(request)
    exercise = await db.exercises.find_one({"exercise_id": exercise_id}, {"_id": 0})
    if not exercise:
        raise HTTPException(status_code=404, detail="Esercizio non trovato")
    return exercise

@app.get("/api/exercises/{exercise_id}/alternatives")
async def get_exercise_alternatives(request: Request, exercise_id: str):
    """Get alternative exercises for smart swap"""
    await get_current_user(request)
    exercise = await db.exercises.find_one({"exercise_id": exercise_id}, {"_id": 0})
    if not exercise:
        raise HTTPException(status_code=404, detail="Esercizio non trovato")
    # Find alternatives in same category, excluding current exercise
    categoria = exercise.get("categoria")
    alternatives = await db.exercises.find(
        {"categoria": categoria, "exercise_id": {"$ne": exercise_id}},
        {"_id": 0}
    ).to_list(5)
    return {"esercizio_originale": exercise, "alternative": alternatives}

@app.get("/api/elastici")
async def get_elastici_mapping(request: Request):
    await get_current_user(request)
    return ELASTICI_KG_MAPPING

# ===== PLANS =====

@app.get("/api/plans")
async def get_plans(request: Request):
    user = await get_current_user(request)
    return await db.plans.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)

@app.post("/api/plans")
async def create_plan(request: Request, plan: PlanCreate):
    user = await get_current_user(request)
    plan_doc = {
        "plan_id": f"plan_{uuid.uuid4().hex[:12]}", "user_id": user["user_id"],
        "nome": plan.nome, "tipo": plan.tipo, "giorni": plan.giorni, "attivo": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.plans.update_many({"user_id": user["user_id"]}, {"$set": {"attivo": False}})
    await db.plans.insert_one(plan_doc)
    plan_doc.pop("_id", None)
    return plan_doc

class WorkoutGeneratorInput(BaseModel):
    energia: int = 5  # 1-10
    focus_muscolare: Optional[List[str]] = None  # e.g., ["Gambe", "Core"]
    dolori_articolari: Optional[List[str]] = None  # e.g., ["ginocchia", "spalle"]

@app.post("/api/plans/generate")
async def generate_plan(request: Request, inputs: Optional[WorkoutGeneratorInput] = None):
    user = await get_current_user(request)
    livello = user.get("livello", "Principiante")
    giorni = user.get("giorni_disponibili", ["Lunedì", "Mercoledì", "Venerdì"])
    eta = user.get("eta", 72)
    
    # Seed exercises if needed
    count = await db.exercises.count_documents({})
    if count == 0:
        for ex in ESERCIZI_DATABASE:
            await db.exercises.insert_one(ex.copy())
    
    exercises = await db.exercises.find({}, {"_id": 0}).to_list(100)
    
    # Apply energy level adjustments
    energia = inputs.energia if inputs else 5
    serie_mod = -1 if energia < 4 else (1 if energia > 7 else 0)
    
    # Filter by focus if specified
    focus = inputs.focus_muscolare if inputs else None
    dolori = inputs.dolori_articolari if inputs and inputs.dolori_articolari else []
    
    # Exercises to avoid based on joint pain
    avoid_exercises = set()
    if "ginocchia" in dolori:
        avoid_exercises.update(["ex_squat_sedia", "ex_affondi_supporto", "ex_step_up"])
    if "spalle" in dolori:
        avoid_exercises.update(["ex_shoulder_press", "ex_alzate_laterali", "ex_alzate_frontali"])
    if "schiena" in dolori:
        avoid_exercises.update(["ex_rematore_manubri", "ex_superman"])
    
    plan_giorni = []
    for i, giorno in enumerate(giorni):
        if i % 2 == 0:
            # Walking day
            dur = 25 if energia < 4 else (35 if energia > 7 else 30)
            if livello != "Principiante":
                dur += 10
            dist = round(dur * 0.08, 1)  # ~5 km/h average
            plan_giorni.append({
                "giorno": giorno, "tipo": "camminata",
                "attivita": [{"nome": "Camminata", "durata_minuti": dur, "distanza_km": dist, "note": "Passo moderato"}],
            })
        else:
            # Circuit day - select exercises by category rotation
            if focus:
                available = [e for e in exercises 
                           if e.get("categoria") in focus 
                           and e.get("exercise_id") not in avoid_exercises]
            else:
                # Default rotation through categories
                categorie_rotazione = ["Gambe", "Core", "Braccia", "Spalle", "Petto", "Schiena"]
                cat_oggi = categorie_rotazione[(i // 2) % len(categorie_rotazione)]
                cat_secondaria = categorie_rotazione[((i // 2) + 1) % len(categorie_rotazione)]
                available = [e for e in exercises 
                           if e.get("categoria") in [cat_oggi, cat_secondaria, "Cardio"]
                           and e.get("exercise_id") not in avoid_exercises]
            
            # Select exercises based on level
            num_esercizi = 4 if livello == "Principiante" else 6
            selected = available[:num_esercizi] if len(available) >= num_esercizi else available
            
            # Adjust series based on level and energy
            base_serie = 2 if livello == "Principiante" else 3
            serie_finale = max(1, base_serie + serie_mod)
            
            plan_giorni.append({
                "giorno": giorno, "tipo": "circuito",
                "attivita": [{
                    "exercise_id": ex["exercise_id"], 
                    "nome": ex["nome"],
                    "categoria": ex.get("categoria", ""),
                    "serie": min(serie_finale, ex.get("serie_default", 3)),
                    "ripetizioni": ex.get("ripetizioni_default", 12),
                    "peso_kg": ex.get("peso_default", 0),
                    "descrizione": ex.get("descrizione_tecnica", ""),
                    "note": ex.get("note_sicurezza", ""),
                    "varianti": ex.get("varianti", {}),
                } for ex in selected],
            })
    plan_doc = {
        "plan_id": f"plan_{uuid.uuid4().hex[:12]}", "user_id": user["user_id"],
        "nome": f"Piano Auto - Fascia {eta}", "tipo": "automatico",
        "giorni": plan_giorni, "attivo": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.plans.update_many({"user_id": user["user_id"]}, {"$set": {"attivo": False}})
    await db.plans.insert_one(plan_doc)
    plan_doc.pop("_id", None)
    return plan_doc

@app.put("/api/plans/{plan_id}/exercise")
async def update_plan_exercise(request: Request, plan_id: str, update: PlanExerciseUpdate):
    user = await get_current_user(request)
    plan = await db.plans.find_one({"plan_id": plan_id, "user_id": user["user_id"]}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Piano non trovato")
    giorni = plan.get("giorni", [])
    if update.giorno_index < 0 or update.giorno_index >= len(giorni):
        raise HTTPException(status_code=400, detail="Indice giorno non valido")
    attivita = giorni[update.giorno_index].get("attivita", [])
    if update.exercise_index < 0 or update.exercise_index >= len(attivita):
        raise HTTPException(status_code=400, detail="Indice esercizio non valido")
    ex = attivita[update.exercise_index]
    if update.serie is not None: ex["serie"] = update.serie
    if update.ripetizioni is not None: ex["ripetizioni"] = update.ripetizioni
    if update.peso_kg is not None: ex["peso_kg"] = update.peso_kg
    if update.nome is not None: ex["nome"] = update.nome
    if update.note is not None: ex["note"] = update.note
    await db.plans.update_one({"plan_id": plan_id}, {"$set": {"giorni": giorni}})
    updated_plan = await db.plans.find_one({"plan_id": plan_id}, {"_id": 0})
    return updated_plan

# ===== STATS (ENHANCED) =====

@app.get("/api/stats")
async def get_stats(request: Request):
    user = await get_current_user(request)
    uid = user["user_id"]
    walks = await db.walks.find({"user_id": uid}, {"_id": 0}).sort("data", -1).to_list(1000)
    circuits = await db.circuits.find({"user_id": uid}, {"_id": 0}).sort("data", -1).to_list(1000)

    now = datetime.now(timezone.utc)
    week_ago = (now - timedelta(days=7)).isoformat()
    month_ago = (now - timedelta(days=30)).isoformat()

    # Totals
    total_km = sum(w.get("distanza_km", 0) for w in walks)
    total_passi = sum(w.get("passi", 0) for w in walks)
    total_walk_time = sum(w.get("tempo_secondi", 0) for w in walks)
    total_circuits = len(circuits)
    total_circuit_time = sum(c.get("durata_minuti", 0) for c in circuits)
    total_volume = 0
    exercise_volumes = {}
    for c in circuits:
        for ex in c.get("esercizi", []):
            for s in ex.get("sets", []):
                if s.get("completato", False):
                    vol = s.get("ripetizioni", 0) * s.get("peso_kg", 0)
                    total_volume += vol
                    eid = ex.get("exercise_id", ex.get("nome", ""))
                    exercise_volumes[eid] = exercise_volumes.get(eid, 0) + vol
            # Legacy support
            if not ex.get("sets"):
                legacy_s = ex.get("serie", 0)
                legacy_r = ex.get("ripetizioni", 0)
                legacy_p = ex.get("peso_kg", 0)
                vol = legacy_s * legacy_r * legacy_p
                total_volume += vol
                eid = ex.get("exercise_id", ex.get("nome", ""))
                exercise_volumes[eid] = exercise_volumes.get(eid, 0) + vol

    # Weekly
    ww = [w for w in walks if w.get("data", "") >= week_ago]
    wc = [c for c in circuits if c.get("data", "") >= week_ago]
    weekly_km = sum(w.get("distanza_km", 0) for w in ww)
    weekly_passi = sum(w.get("passi", 0) for w in ww)

    # Monthly
    mw = [w for w in walks if w.get("data", "") >= month_ago]
    mc = [c for c in circuits if c.get("data", "") >= month_ago]
    monthly_km = sum(w.get("distanza_km", 0) for w in mw)

    # Records
    best_km = max((w.get("distanza_km", 0) for w in walks), default=0)
    best_passi = max((w.get("passi", 0) for w in walks), default=0)
    best_velocita = max((w.get("velocita_media_kmh", 0) for w in walks), default=0)
    longest_walk_sec = max((w.get("tempo_secondi", 0) for w in walks), default=0)

    # Derived Stats
    avg_km_per_walk = round(total_km / max(len(walks), 1), 2)
    avg_speed = round(sum(w.get("velocita_media_kmh", 0) for w in walks) / max(len(walks), 1), 1)
    avg_circuit_time = round(total_circuit_time / max(total_circuits, 1), 1)
    total_calories_walk = round(total_km * 60)  # ~60 cal/km for seniors
    total_calories_circuit = round(total_circuit_time * 5)  # ~5 cal/min
    total_calories = total_calories_walk + total_calories_circuit
    total_active_days = len(set([w.get("data", "")[:10] for w in walks] + [c.get("data", "")[:10] for c in circuits]))
    streak = 0
    for i in range(30):
        day = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        day_walks = [w for w in walks if w.get("data", "")[:10] == day]
        day_circuits = [c for c in circuits if c.get("data", "")[:10] == day]
        if day_walks or day_circuits:
            streak += 1
        else:
            break

    # Per-exercise best
    ex_bests = {}
    for c in circuits:
        for ex in c.get("esercizi", []):
            eid = ex.get("exercise_id", ex.get("nome", ""))
            for s in ex.get("sets", []):
                if s.get("completato"):
                    curr = ex_bests.get(eid, {"max_peso": 0, "max_reps": 0})
                    curr["max_peso"] = max(curr["max_peso"], s.get("peso_kg", 0))
                    curr["max_reps"] = max(curr["max_reps"], s.get("ripetizioni", 0))
                    ex_bests[eid] = curr

    # Chart data
    chart_walks = [{"data": w.get("data", "")[:10], "km": w.get("distanza_km", 0), "passi": w.get("passi", 0), "velocita": w.get("velocita_media_kmh", 0), "tempo_min": round(w.get("tempo_secondi", 0) / 60, 1)} for w in walks[:30]]
    chart_circuits = []
    for c in circuits[:30]:
        vol = 0
        for ex in c.get("esercizi", []):
            for s in ex.get("sets", []):
                if s.get("completato"):
                    vol += s.get("ripetizioni", 0) * s.get("peso_kg", 0)
            if not ex.get("sets"):
                vol += ex.get("serie", 0) * ex.get("ripetizioni", 0) * ex.get("peso_kg", 0)
        chart_circuits.append({"data": c.get("data", "")[:10], "volume": round(vol, 1), "durata": c.get("durata_minuti", 0), "esercizi_completati": len(c.get("esercizi", []))})

    # Daily aggregation for last 14 days
    daily_data = []
    for i in range(14):
        day = (now - timedelta(days=13-i)).strftime("%Y-%m-%d")
        dw = [w for w in walks if w.get("data", "")[:10] == day]
        dc = [c for c in circuits if c.get("data", "")[:10] == day]
        daily_data.append({
            "data": day,
            "km": round(sum(w.get("distanza_km", 0) for w in dw), 2),
            "passi": sum(w.get("passi", 0) for w in dw),
            "circuiti": len(dc),
            "calorie": round(sum(w.get("distanza_km", 0) for w in dw) * 60 + sum(c.get("durata_minuti", 0) for c in dc) * 5),
        })

    return {
        "totale": {
            "km": round(total_km, 1), "passi": total_passi,
            "tempo_camminata_min": round(total_walk_time / 60, 1),
            "allenamenti_circuito": total_circuits, "tempo_circuito_min": total_circuit_time,
            "volume_totale_kg": round(total_volume, 1), "calorie_stimate": total_calories,
            "giorni_attivi": total_active_days, "camminate_totali": len(walks),
        },
        "settimanale": {
            "km": round(weekly_km, 1), "passi": weekly_passi,
            "camminate": len(ww), "circuiti": len(wc),
        },
        "mensile": {"km": round(monthly_km, 1), "camminate": len(mw), "circuiti": len(mc)},
        "record": {
            "best_km": round(best_km, 1), "best_passi": best_passi,
            "best_velocita": round(best_velocita, 1),
            "camminata_piu_lunga_min": round(longest_walk_sec / 60, 1),
        },
        "medie": {
            "km_per_camminata": avg_km_per_walk, "velocita_media": avg_speed,
            "durata_circuito_media": avg_circuit_time,
        },
        "streak": streak,
        "volume_per_esercizio": exercise_volumes,
        "record_esercizi": ex_bests,
        "grafici_camminate": list(reversed(chart_walks)),
        "grafici_circuiti": list(reversed(chart_circuits)),
        "grafici_giornalieri": daily_data,
    }

# ===== SFIDE GOAT =====

SFIDE_TEMPLATES = [
    {"tipo": "camminata", "nome": "Maratoneta della settimana", "descrizione": "Cammina {target} km in 7 giorni", "target_field": "km", "targets": {"facile": 5, "medio": 10, "difficile": 15}, "durata_giorni": 7, "icona": "footprints"},
    {"tipo": "camminata", "nome": "Contapassi d'oro", "descrizione": "Raggiungi {target} passi in una settimana", "target_field": "passi", "targets": {"facile": 20000, "medio": 40000, "difficile": 70000}, "durata_giorni": 7, "icona": "shoe"},
    {"tipo": "circuito", "nome": "Re del ferro", "descrizione": "Completa {target} circuiti in 7 giorni", "target_field": "circuiti", "targets": {"facile": 2, "medio": 3, "difficile": 5}, "durata_giorni": 7, "icona": "dumbbell"},
    {"tipo": "circuito", "nome": "Volume monster", "descrizione": "Solleva un volume di {target} kg in una settimana", "target_field": "volume", "targets": {"facile": 200, "medio": 500, "difficile": 1000}, "durata_giorni": 7, "icona": "weight"},
    {"tipo": "costanza", "nome": "Streak di fuoco", "descrizione": "Allenati per {target} giorni consecutivi", "target_field": "streak", "targets": {"facile": 3, "medio": 5, "difficile": 7}, "durata_giorni": 7, "icona": "flame"},
    {"tipo": "velocita", "nome": "Razzo Walt", "descrizione": "Raggiungi una velocità media di {target} km/h in una camminata", "target_field": "velocita", "targets": {"facile": 3.0, "medio": 4.0, "difficile": 5.0}, "durata_giorni": 7, "icona": "zap"},
    {"tipo": "calorie", "nome": "Brucia-calorie GOAT", "descrizione": "Brucia {target} calorie in una settimana", "target_field": "calorie", "targets": {"facile": 300, "medio": 600, "difficile": 1000}, "durata_giorni": 7, "icona": "flame"},
]

@app.get("/api/sfide")
async def get_sfide(request: Request):
    user = await get_current_user(request)
    sfide = await db.sfide.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return sfide

@app.post("/api/sfide/generate")
async def generate_sfide(request: Request):
    user = await get_current_user(request)
    livello = user.get("livello", "Principiante")
    diff = "facile" if livello == "Principiante" else "medio" if livello == "Intermedio" else "difficile"
    # Generate 3 random challenges
    selected = random.sample(SFIDE_TEMPLATES, min(3, len(SFIDE_TEMPLATES)))
    new_sfide = []
    for tmpl in selected:
        target = tmpl["targets"][diff]
        sfida = {
            "sfida_id": f"sfida_{uuid.uuid4().hex[:12]}",
            "user_id": user["user_id"],
            "nome": tmpl["nome"],
            "descrizione": tmpl["descrizione"].format(target=target),
            "tipo": tmpl["tipo"],
            "target_field": tmpl["target_field"],
            "target_value": target,
            "current_value": 0,
            "completata": False,
            "icona": tmpl["icona"],
            "durata_giorni": tmpl["durata_giorni"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "scadenza": (datetime.now(timezone.utc) + timedelta(days=tmpl["durata_giorni"])).isoformat(),
        }
        await db.sfide.insert_one(sfida.copy())
        sfida.pop("_id", None)
        new_sfide.append(sfida)
    return new_sfide

@app.post("/api/sfide/check-progress")
async def check_sfide_progress(request: Request):
    user = await get_current_user(request)
    uid = user["user_id"]
    now = datetime.now(timezone.utc)
    sfide = await db.sfide.find({"user_id": uid, "completata": False}, {"_id": 0}).to_list(50)
    week_ago = (now - timedelta(days=7)).isoformat()
    walks = await db.walks.find({"user_id": uid, "data": {"$gte": week_ago}}, {"_id": 0}).to_list(100)
    circuits = await db.circuits.find({"user_id": uid, "data": {"$gte": week_ago}}, {"_id": 0}).to_list(100)
    weekly_km = sum(w.get("distanza_km", 0) for w in walks)
    weekly_passi = sum(w.get("passi", 0) for w in walks)
    weekly_circuits = len(circuits)
    weekly_volume = 0
    for c in circuits:
        for ex in c.get("esercizi", []):
            for s in ex.get("sets", []):
                if s.get("completato"): weekly_volume += s.get("ripetizioni", 0) * s.get("peso_kg", 0)
            if not ex.get("sets"):
                weekly_volume += ex.get("serie", 0) * ex.get("ripetizioni", 0) * ex.get("peso_kg", 0)
    best_speed = max((w.get("velocita_media_kmh", 0) for w in walks), default=0)
    weekly_cal = round(weekly_km * 60 + sum(c.get("durata_minuti", 0) for c in circuits) * 5)
    # Streak
    streak = 0
    for i in range(30):
        day = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        if any(w.get("data", "")[:10] == day for w in walks) or any(c.get("data", "")[:10] == day for c in circuits):
            streak += 1
        else: break
    field_map = {"km": weekly_km, "passi": weekly_passi, "circuiti": weekly_circuits, "volume": weekly_volume, "streak": streak, "velocita": best_speed, "calorie": weekly_cal}
    updated = []
    for s in sfide:
        if s.get("scadenza", "") < now.isoformat():
            await db.sfide.update_one({"sfida_id": s["sfida_id"]}, {"$set": {"scaduta": True}})
            continue
        cv = field_map.get(s.get("target_field", ""), 0)
        completata = cv >= s.get("target_value", 0)
        await db.sfide.update_one({"sfida_id": s["sfida_id"]}, {"$set": {"current_value": round(cv, 1), "completata": completata}})
        s["current_value"] = round(cv, 1)
        s["completata"] = completata
        updated.append(s)
    return updated

@app.get("/api/health")
async def health():
    return {"status": "ok", "app": "Walt the GOAT"}
