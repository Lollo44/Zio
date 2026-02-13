from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import os
import uuid
import httpx
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Walter the Walker API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB
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
    note: Optional[str] = None

class CircuitExerciseLog(BaseModel):
    exercise_id: str
    nome: str
    serie: int
    ripetizioni: int
    peso_kg: float

class CircuitSession(BaseModel):
    durata_minuti: int
    esercizi: List[CircuitExerciseLog]
    note: Optional[str] = None

class PlanCreate(BaseModel):
    nome: str
    tipo: str  # "automatico" or "custom"
    giorni: List[dict]

# ===== AUTH HELPERS =====

async def get_current_user(request: Request):
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    if not session_token:
        raise HTTPException(status_code=401, detail="Non autenticato")

    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token}, {"_id": 0}
    )
    if not session_doc:
        raise HTTPException(status_code=401, detail="Sessione non valida")

    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Sessione scaduta")

    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]}, {"_id": 0}
    )
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
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "picture": picture, "updated_at": datetime.now(timezone.utc)}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "profile_complete": False,
            "created_at": datetime.now(timezone.utc),
        })

    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc),
    })

    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 3600,
    )

    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user_doc

@app.get("/api/auth/me")
async def auth_me(request: Request):
    user = await get_current_user(request)
    return user

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
    user = await get_current_user(request)
    return user

@app.put("/api/profile")
async def update_profile(request: Request, profile: ProfileSetup):
    user = await get_current_user(request)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "nome": profile.nome,
            "eta": profile.eta,
            "peso": profile.peso,
            "altezza": profile.altezza,
            "livello": profile.livello,
            "obiettivo": profile.obiettivo,
            "giorni_disponibili": profile.giorni_disponibili,
            "profile_complete": True,
            "updated_at": datetime.now(timezone.utc),
        }}
    )
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated

# ===== WALKS =====

@app.get("/api/walks")
async def get_walks(request: Request):
    user = await get_current_user(request)
    walks = await db.walks.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("data", -1).to_list(100)
    return walks

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
    circuits = await db.circuits.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("data", -1).to_list(100)
    return circuits

@app.post("/api/circuits")
async def create_circuit(request: Request, circuit: CircuitSession):
    user = await get_current_user(request)
    circuit_doc = {
        "circuit_id": f"circuit_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "durata_minuti": circuit.durata_minuti,
        "esercizi": [e.dict() for e in circuit.esercizi],
        "note": circuit.note,
        "data": datetime.now(timezone.utc).isoformat(),
    }
    await db.circuits.insert_one(circuit_doc)
    circuit_doc.pop("_id", None)
    return circuit_doc

# ===== EXERCISES (seed data) =====

DEFAULT_EXERCISES = [
    {"exercise_id": "ex_bicipiti", "nome": "Bicipiti", "tipo": "pesi", "gruppo_muscolare": "braccia", "descrizione": "Curl con manubri", "serie_default": 3, "ripetizioni_default": 12, "peso_default": 2.0},
    {"exercise_id": "ex_tricipiti", "nome": "Tricipiti", "tipo": "pesi", "gruppo_muscolare": "braccia", "descrizione": "Estensioni tricipiti", "serie_default": 3, "ripetizioni_default": 12, "peso_default": 2.0},
    {"exercise_id": "ex_petto", "nome": "Petto", "tipo": "pesi", "gruppo_muscolare": "petto", "descrizione": "Chest press leggero", "serie_default": 3, "ripetizioni_default": 10, "peso_default": 3.0},
    {"exercise_id": "ex_spalle", "nome": "Spalle", "tipo": "pesi", "gruppo_muscolare": "spalle", "descrizione": "Alzate laterali", "serie_default": 3, "ripetizioni_default": 12, "peso_default": 1.5},
    {"exercise_id": "ex_schiena", "nome": "Schiena", "tipo": "pesi", "gruppo_muscolare": "schiena", "descrizione": "Rematore con manubri", "serie_default": 3, "ripetizioni_default": 10, "peso_default": 3.0},
    {"exercise_id": "ex_addome", "nome": "Addome", "tipo": "corpo_libero", "gruppo_muscolare": "core", "descrizione": "Crunch leggeri", "serie_default": 2, "ripetizioni_default": 15, "peso_default": 0},
    {"exercise_id": "ex_gambe", "nome": "Gambe", "tipo": "pesi", "gruppo_muscolare": "gambe", "descrizione": "Squat assistito", "serie_default": 3, "ripetizioni_default": 10, "peso_default": 0},
    {"exercise_id": "ex_cardio", "nome": "Cardio leggero", "tipo": "cardio", "gruppo_muscolare": "cardio", "descrizione": "Cyclette o camminata veloce", "serie_default": 1, "ripetizioni_default": 1, "peso_default": 0},
]

@app.get("/api/exercises")
async def get_exercises(request: Request):
    await get_current_user(request)
    exercises = await db.exercises.find({}, {"_id": 0}).to_list(100)
    if not exercises:
        for ex in DEFAULT_EXERCISES:
            await db.exercises.insert_one(ex.copy())
        exercises = await db.exercises.find({}, {"_id": 0}).to_list(100)
    return exercises

# ===== PLANS =====

@app.get("/api/plans")
async def get_plans(request: Request):
    user = await get_current_user(request)
    plans = await db.plans.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return plans

@app.post("/api/plans")
async def create_plan(request: Request, plan: PlanCreate):
    user = await get_current_user(request)
    plan_doc = {
        "plan_id": f"plan_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "nome": plan.nome,
        "tipo": plan.tipo,
        "giorni": plan.giorni,
        "attivo": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    # Deactivate other plans
    await db.plans.update_many(
        {"user_id": user["user_id"]}, {"$set": {"attivo": False}}
    )
    await db.plans.insert_one(plan_doc)
    plan_doc.pop("_id", None)
    return plan_doc

@app.post("/api/plans/generate")
async def generate_plan(request: Request):
    user = await get_current_user(request)
    livello = user.get("livello", "principiante")
    giorni = user.get("giorni_disponibili", ["Lunedì", "Mercoledì", "Venerdì"])
    eta = user.get("eta", 72)

    # Generate age-appropriate plan for 70-75
    plan_giorni = []
    exercises = await db.exercises.find({}, {"_id": 0}).to_list(100)
    if not exercises:
        for ex in DEFAULT_EXERCISES:
            await db.exercises.insert_one(ex.copy())
        exercises = await db.exercises.find({}, {"_id": 0}).to_list(100)

    for i, giorno in enumerate(giorni):
        if i % 2 == 0:
            # Walking day
            plan_giorni.append({
                "giorno": giorno,
                "tipo": "camminata",
                "attivita": [{
                    "nome": "Camminata",
                    "durata_minuti": 30 if livello == "principiante" else 45,
                    "distanza_km": 2.0 if livello == "principiante" else 3.5,
                    "note": "Passo moderato, con pause se necessario"
                }]
            })
        else:
            # Circuit day - select 4 exercises appropriate for 70-75
            selected = exercises[:4] if len(exercises) >= 4 else exercises
            serie_mult = 2 if livello == "principiante" else 3
            plan_giorni.append({
                "giorno": giorno,
                "tipo": "circuito",
                "attivita": [{
                    "exercise_id": ex["exercise_id"],
                    "nome": ex["nome"],
                    "serie": min(serie_mult, ex.get("serie_default", 2)),
                    "ripetizioni": min(10, ex.get("ripetizioni_default", 10)),
                    "peso_kg": ex.get("peso_default", 1.0),
                    "note": ex.get("descrizione", "")
                } for ex in selected]
            })

    plan_doc = {
        "plan_id": f"plan_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "nome": f"Piano Automatico - Fascia {eta}",
        "tipo": "automatico",
        "giorni": plan_giorni,
        "attivo": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.plans.update_many(
        {"user_id": user["user_id"]}, {"$set": {"attivo": False}}
    )
    await db.plans.insert_one(plan_doc)
    plan_doc.pop("_id", None)
    return plan_doc

# ===== STATS =====

@app.get("/api/stats")
async def get_stats(request: Request):
    user = await get_current_user(request)
    uid = user["user_id"]

    walks = await db.walks.find({"user_id": uid}, {"_id": 0}).sort("data", -1).to_list(1000)
    circuits = await db.circuits.find({"user_id": uid}, {"_id": 0}).sort("data", -1).to_list(1000)

    total_km = sum(w.get("distanza_km", 0) for w in walks)
    total_passi = sum(w.get("passi", 0) for w in walks)
    total_walk_time = sum(w.get("tempo_secondi", 0) for w in walks)
    total_circuits = len(circuits)
    total_circuit_time = sum(c.get("durata_minuti", 0) for c in circuits)

    # Weekly stats (last 7 days)
    now = datetime.now(timezone.utc)
    week_ago = (now - timedelta(days=7)).isoformat()
    weekly_walks = [w for w in walks if w.get("data", "") >= week_ago]
    weekly_circuits = [c for c in circuits if c.get("data", "") >= week_ago]
    weekly_km = sum(w.get("distanza_km", 0) for w in weekly_walks)
    weekly_passi = sum(w.get("passi", 0) for w in weekly_walks)

    # Volume totale circuiti (serie * rip * peso)
    total_volume = 0
    for c in circuits:
        for ex in c.get("esercizi", []):
            total_volume += ex.get("serie", 0) * ex.get("ripetizioni", 0) * ex.get("peso_kg", 0)

    # Best records
    best_km = max((w.get("distanza_km", 0) for w in walks), default=0)
    best_passi = max((w.get("passi", 0) for w in walks), default=0)

    # Chart data - last 30 days walking
    chart_walks = []
    for w in walks[:30]:
        chart_walks.append({
            "data": w.get("data", "")[:10],
            "km": w.get("distanza_km", 0),
            "passi": w.get("passi", 0),
        })

    chart_circuits = []
    for c in circuits[:30]:
        vol = sum(e.get("serie", 0) * e.get("ripetizioni", 0) * e.get("peso_kg", 0) for e in c.get("esercizi", []))
        chart_circuits.append({
            "data": c.get("data", "")[:10],
            "volume": vol,
            "durata": c.get("durata_minuti", 0),
        })

    return {
        "totale": {
            "km": round(total_km, 1),
            "passi": total_passi,
            "tempo_camminata_min": round(total_walk_time / 60, 1),
            "allenamenti_circuito": total_circuits,
            "tempo_circuito_min": total_circuit_time,
            "volume_totale_kg": round(total_volume, 1),
        },
        "settimanale": {
            "km": round(weekly_km, 1),
            "passi": weekly_passi,
            "camminate": len(weekly_walks),
            "circuiti": len(weekly_circuits),
        },
        "record": {
            "best_km": round(best_km, 1),
            "best_passi": best_passi,
        },
        "grafici_camminate": list(reversed(chart_walks)),
        "grafici_circuiti": list(reversed(chart_circuits)),
    }

# ===== HEALTH CHECK =====

@app.get("/api/health")
async def health():
    return {"status": "ok", "app": "Walter the Walker"}
