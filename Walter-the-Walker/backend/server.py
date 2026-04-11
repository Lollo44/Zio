from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import os
import uuid
import json
import httpx
import random
import asyncpg
import requests as req_lib
from oauthlib.oauth2 import WebApplicationClient
from dotenv import load_dotenv

load_dotenv()

def get_allowed_origins():
    origins_str = os.environ.get("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001")
    return [origin.strip() for origin in origins_str.split(",")]

app = FastAPI(title="Walter the Walker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.environ.get("DATABASE_URL")
db_pool = None

# Google OAuth config
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_OAUTH_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET", "")
GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"
REPLIT_DEV_DOMAIN = os.environ.get("REPLIT_DEV_DOMAIN", "localhost:8000")
GOOGLE_REDIRECT_URI = f"https://{REPLIT_DEV_DOMAIN}/api/auth/google/callback"
google_oauth_client = WebApplicationClient(GOOGLE_CLIENT_ID) if GOOGLE_CLIENT_ID else None

if GOOGLE_CLIENT_ID:
    print(f"[Google OAuth] Callback URL: {GOOGLE_REDIRECT_URI}")
    print(f"[Google OAuth] Add this URL to your Google Cloud Console authorized redirect URIs")

@app.on_event("startup")
async def startup():
    global db_pool
    db_pool = await asyncpg.create_pool(DATABASE_URL)
    await init_db()

@app.on_event("shutdown")
async def shutdown():
    global db_pool
    if db_pool:
        await db_pool.close()

async def init_db():
    async with db_pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                data JSONB NOT NULL DEFAULT '{}'
            )
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                session_token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                expires_at TIMESTAMPTZ NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS walks (
                walk_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                data JSONB NOT NULL DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS circuits (
                circuit_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                data JSONB NOT NULL DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS exercises (
                exercise_id TEXT PRIMARY KEY,
                data JSONB NOT NULL DEFAULT '{}'
            )
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS plans (
                plan_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                data JSONB NOT NULL DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS sfide (
                sfida_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                data JSONB NOT NULL DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

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
    async with db_pool.acquire() as conn:
        session = await conn.fetchrow(
            "SELECT * FROM user_sessions WHERE session_token = $1", session_token
        )
        if not session:
            raise HTTPException(status_code=401, detail="Sessione non valida")
        if session["expires_at"] < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Sessione scaduta")
        user = await conn.fetchrow("SELECT * FROM users WHERE user_id = $1", session["user_id"])
        if not user:
            raise HTTPException(status_code=401, detail="Utente non trovato")
        return json.loads(user["data"])

# ===== AUTH ENDPOINTS =====

@app.post("/api/auth/guest")
async def create_guest_session(request: Request, response: Response):
    """Create or resume an anonymous guest session using a persistent guest_id cookie."""
    now = datetime.now(timezone.utc)
    guest_id = request.cookies.get("guest_id")

    async with db_pool.acquire() as conn:
        # Try to find existing user by guest_id
        existing = None
        if guest_id:
            existing = await conn.fetchrow(
                "SELECT user_id, data FROM users WHERE user_id = $1", guest_id
            )

        if existing:
            user_id = existing["user_id"]
            user_data = json.loads(existing["data"])
        else:
            # Create new anonymous user
            user_id = f"guest_{uuid.uuid4().hex[:12]}"
            user_data = {
                "user_id": user_id,
                "email": f"{user_id}@guest.local",
                "name": "Ospite",
                "picture": "",
                "profile_complete": False,
                "created_at": now.isoformat(),
            }
            await conn.execute(
                "INSERT INTO users (user_id, email, data) VALUES ($1, $2, $3)",
                user_id, user_data["email"], json.dumps(user_data)
            )

        # Create new session token
        session_token = str(uuid.uuid4())
        expires_at = now + timedelta(days=30)
        await conn.execute(
            "INSERT INTO user_sessions (session_token, user_id, expires_at) VALUES ($1, $2, $3)",
            session_token, user_id, expires_at
        )
        user = await conn.fetchrow("SELECT data FROM users WHERE user_id = $1", user_id)

    # Set both guest_id (persistent) and session_token cookies
    response.set_cookie(
        key="guest_id", value=user_id, httponly=True,
        secure=True, samesite="none", path="/", max_age=365*24*3600
    )
    response.set_cookie(
        key="session_token", value=session_token, httponly=True,
        secure=True, samesite="none", path="/", max_age=30*24*3600
    )
    return json.loads(user["data"])

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
    now = datetime.now(timezone.utc)
    async with db_pool.acquire() as conn:
        existing = await conn.fetchrow("SELECT user_id, data FROM users WHERE email = $1", email)
        if existing:
            user_id = existing["user_id"]
            user_data = json.loads(existing["data"])
            user_data.update({"name": name, "picture": picture, "updated_at": now.isoformat()})
            await conn.execute(
                "UPDATE users SET data = $1 WHERE user_id = $2",
                json.dumps(user_data), user_id
            )
        else:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            user_data = {
                "user_id": user_id, "email": email, "name": name, "picture": picture,
                "profile_complete": False, "created_at": now.isoformat()
            }
            await conn.execute(
                "INSERT INTO users (user_id, email, data) VALUES ($1, $2, $3)",
                user_id, email, json.dumps(user_data)
            )
        expires_at = now + timedelta(days=7)
        await conn.execute(
            "INSERT INTO user_sessions (session_token, user_id, expires_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
            session_token, user_id, expires_at
        )
        user = await conn.fetchrow("SELECT data FROM users WHERE user_id = $1", user_id)
    response.set_cookie(
        key="session_token", value=session_token, httponly=True,
        secure=True, samesite="none", path="/", max_age=7*24*3600
    )
    return json.loads(user["data"])

@app.get("/api/auth/me")
async def auth_me(request: Request):
    return await get_current_user(request)

@app.post("/api/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        async with db_pool.acquire() as conn:
            await conn.execute("DELETE FROM user_sessions WHERE session_token = $1", session_token)
    response.delete_cookie(key="session_token", path="/", samesite="none", secure=True)
    return {"message": "Logout effettuato"}

@app.get("/api/auth/google/login")
async def google_login():
    """Redirect user to Google OAuth consent screen."""
    if not google_oauth_client or not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google OAuth non configurato")
    try:
        google_cfg = req_lib.get(GOOGLE_DISCOVERY_URL, timeout=5).json()
        authorization_endpoint = google_cfg["authorization_endpoint"]
        request_uri = google_oauth_client.prepare_request_uri(
            authorization_endpoint,
            redirect_uri=GOOGLE_REDIRECT_URI,
            scope=["openid", "email", "profile"],
        )
        return RedirectResponse(url=request_uri)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore OAuth: {str(e)}")

@app.get("/api/auth/google/callback")
async def google_callback(request: Request, response: Response):
    """Handle Google OAuth callback, create/update user, set session."""
    if not google_oauth_client or not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google OAuth non configurato")
    code = request.query_params.get("code")
    if not code:
        return RedirectResponse(url="/?error=oauth_failed")
    try:
        google_cfg = req_lib.get(GOOGLE_DISCOVERY_URL, timeout=5).json()
        token_endpoint = google_cfg["token_endpoint"]
        callback_url = str(request.url).replace("http://", "https://")
        token_url, headers, body = google_oauth_client.prepare_token_request(
            token_endpoint,
            authorization_response=callback_url,
            redirect_url=GOOGLE_REDIRECT_URI,
            code=code,
        )
        token_response = req_lib.post(
            token_url, headers=headers, data=body,
            auth=(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET), timeout=10
        )
        google_oauth_client.parse_request_body_response(json.dumps(token_response.json()))
        userinfo_endpoint = google_cfg["userinfo_endpoint"]
        uri, headers, body = google_oauth_client.add_token(userinfo_endpoint)
        userinfo = req_lib.get(uri, headers=headers, data=body, timeout=10).json()
        if not userinfo.get("email_verified"):
            return RedirectResponse(url="/?error=email_not_verified")
        email = userinfo["email"]
        name = userinfo.get("name", "")
        picture = userinfo.get("picture", "")
        now = datetime.now(timezone.utc)
        session_token = str(uuid.uuid4())
        async with db_pool.acquire() as conn:
            existing = await conn.fetchrow("SELECT user_id, data FROM users WHERE email = $1", email)
            if existing:
                user_id = existing["user_id"]
                user_data = json.loads(existing["data"])
                user_data.update({"name": name, "picture": picture, "updated_at": now.isoformat()})
                await conn.execute(
                    "UPDATE users SET data = $1 WHERE user_id = $2",
                    json.dumps(user_data), user_id
                )
            else:
                user_id = f"user_{uuid.uuid4().hex[:12]}"
                user_data = {
                    "user_id": user_id, "email": email, "name": name, "picture": picture,
                    "google_id": userinfo.get("sub"),
                    "profile_complete": False, "created_at": now.isoformat()
                }
                await conn.execute(
                    "INSERT INTO users (user_id, email, data) VALUES ($1, $2, $3)",
                    user_id, email, json.dumps(user_data)
                )
            expires_at = now + timedelta(days=30)
            await conn.execute(
                "INSERT INTO user_sessions (session_token, user_id, expires_at) VALUES ($1, $2, $3)",
                session_token, user_id, expires_at
            )
        redir = RedirectResponse(url="/")
        redir.set_cookie(
            key="session_token", value=session_token, httponly=True,
            secure=True, samesite="none", path="/", max_age=30*24*3600
        )
        return redir
    except Exception as e:
        print(f"Google OAuth callback error: {e}")
        return RedirectResponse(url=f"/?error=oauth_error")

# ===== PROFILE =====

@app.get("/api/profile")
async def get_profile(request: Request):
    return await get_current_user(request)

@app.put("/api/profile")
async def update_profile(request: Request, profile: ProfileSetup):
    user = await get_current_user(request)
    now = datetime.now(timezone.utc)
    user.update({
        "nome": profile.nome, "eta": profile.eta, "peso": profile.peso,
        "altezza": profile.altezza, "livello": profile.livello, "obiettivo": profile.obiettivo,
        "giorni_disponibili": profile.giorni_disponibili, "profile_complete": True,
        "updated_at": now.isoformat(),
    })
    async with db_pool.acquire() as conn:
        await conn.execute(
            "UPDATE users SET data = $1 WHERE user_id = $2",
            json.dumps(user), user["user_id"]
        )
        row = await conn.fetchrow("SELECT data FROM users WHERE user_id = $1", user["user_id"])
    return json.loads(row["data"])

# ===== WALKS =====

@app.get("/api/walks")
async def get_walks(request: Request):
    user = await get_current_user(request)
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT data FROM walks WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100",
            user["user_id"]
        )
    return [json.loads(r["data"]) for r in rows]

@app.post("/api/walks")
async def create_walk(request: Request, walk: WalkSession):
    user = await get_current_user(request)
    now = datetime.now(timezone.utc)
    walk_id = f"walk_{uuid.uuid4().hex[:12]}"
    walk_doc = {
        "walk_id": walk_id, "user_id": user["user_id"],
        "distanza_km": walk.distanza_km, "tempo_secondi": walk.tempo_secondi,
        "passi": walk.passi, "velocita_media_kmh": walk.velocita_media_kmh,
        "percorso": walk.percorso or [], "note": walk.note,
        "data": now.isoformat(),
    }
    async with db_pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO walks (walk_id, user_id, data) VALUES ($1, $2, $3)",
            walk_id, user["user_id"], json.dumps(walk_doc)
        )
    return walk_doc

# ===== CIRCUITS =====

@app.get("/api/circuits")
async def get_circuits(request: Request):
    user = await get_current_user(request)
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT data FROM circuits WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100",
            user["user_id"]
        )
    return [json.loads(r["data"]) for r in rows]

@app.post("/api/circuits")
async def create_circuit(request: Request, circuit: CircuitSession):
    user = await get_current_user(request)
    now = datetime.now(timezone.utc)
    esercizi_data = []
    for e in circuit.esercizi:
        sets_data = [s.dict() for s in e.sets]
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
    circuit_id = f"circuit_{uuid.uuid4().hex[:12]}"
    circuit_doc = {
        "circuit_id": circuit_id, "user_id": user["user_id"],
        "durata_minuti": circuit.durata_minuti, "esercizi": esercizi_data,
        "note": circuit.note, "data": now.isoformat(),
    }
    async with db_pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO circuits (circuit_id, user_id, data) VALUES ($1, $2, $3)",
            circuit_id, user["user_id"], json.dumps(circuit_doc)
        )
    return circuit_doc

# ===== EXERCISES =====

from exercises_database import ESERCIZI_DATABASE, ELASTICI_KG_MAPPING, CATEGORIE

async def seed_exercises_if_needed(conn):
    count = await conn.fetchval("SELECT COUNT(*) FROM exercises")
    if count == 0:
        for ex in ESERCIZI_DATABASE:
            await conn.execute(
                "INSERT INTO exercises (exercise_id, data) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                ex["exercise_id"], json.dumps(ex)
            )

@app.get("/api/exercises")
async def get_exercises(request: Request, categoria: Optional[str] = None):
    await get_current_user(request)
    async with db_pool.acquire() as conn:
        await seed_exercises_if_needed(conn)
        if categoria:
            rows = await conn.fetch(
                "SELECT data FROM exercises WHERE data->>'categoria' = $1 LIMIT 100", categoria
            )
        else:
            rows = await conn.fetch("SELECT data FROM exercises LIMIT 100")
    return [json.loads(r["data"]) for r in rows]

@app.get("/api/exercises/categories")
async def get_exercise_categories(request: Request):
    await get_current_user(request)
    return {"categorie": CATEGORIE}

@app.get("/api/exercises/{exercise_id}")
async def get_exercise_detail(request: Request, exercise_id: str):
    await get_current_user(request)
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow("SELECT data FROM exercises WHERE exercise_id = $1", exercise_id)
    if not row:
        raise HTTPException(status_code=404, detail="Esercizio non trovato")
    return json.loads(row["data"])

@app.get("/api/exercises/{exercise_id}/alternatives")
async def get_exercise_alternatives(request: Request, exercise_id: str):
    await get_current_user(request)
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow("SELECT data FROM exercises WHERE exercise_id = $1", exercise_id)
        if not row:
            raise HTTPException(status_code=404, detail="Esercizio non trovato")
        exercise = json.loads(row["data"])
        categoria = exercise.get("categoria")
        alt_rows = await conn.fetch(
            "SELECT data FROM exercises WHERE data->>'categoria' = $1 AND exercise_id != $2 LIMIT 5",
            categoria, exercise_id
        )
    return {"esercizio_originale": exercise, "alternative": [json.loads(r["data"]) for r in alt_rows]}

@app.get("/api/elastici")
async def get_elastici_mapping(request: Request):
    await get_current_user(request)
    return ELASTICI_KG_MAPPING

# ===== PLANS =====

@app.get("/api/plans")
async def get_plans(request: Request):
    user = await get_current_user(request)
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT data FROM plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
            user["user_id"]
        )
    return [json.loads(r["data"]) for r in rows]

@app.post("/api/plans")
async def create_plan(request: Request, plan: PlanCreate):
    user = await get_current_user(request)
    now = datetime.now(timezone.utc)
    plan_id = f"plan_{uuid.uuid4().hex[:12]}"
    plan_doc = {
        "plan_id": plan_id, "user_id": user["user_id"],
        "nome": plan.nome, "tipo": plan.tipo, "giorni": plan.giorni, "attivo": True,
        "created_at": now.isoformat(),
    }
    async with db_pool.acquire() as conn:
        # Deactivate other plans
        rows = await conn.fetch("SELECT plan_id, data FROM plans WHERE user_id = $1", user["user_id"])
        for r in rows:
            d = json.loads(r["data"])
            d["attivo"] = False
            await conn.execute("UPDATE plans SET data = $1 WHERE plan_id = $2", json.dumps(d), r["plan_id"])
        await conn.execute(
            "INSERT INTO plans (plan_id, user_id, data) VALUES ($1, $2, $3)",
            plan_id, user["user_id"], json.dumps(plan_doc)
        )
    return plan_doc

class WorkoutGeneratorInput(BaseModel):
    energia: int = 5
    focus_muscolare: Optional[List[str]] = None
    dolori_articolari: Optional[List[str]] = None

@app.post("/api/plans/generate")
async def generate_plan(request: Request, inputs: Optional[WorkoutGeneratorInput] = None):
    user = await get_current_user(request)
    livello = user.get("livello", "Principiante")
    giorni = user.get("giorni_disponibili", ["Lunedì", "Mercoledì", "Venerdì"])
    eta = user.get("eta", 72)
    now = datetime.now(timezone.utc)

    async with db_pool.acquire() as conn:
        await seed_exercises_if_needed(conn)
        rows = await conn.fetch("SELECT data FROM exercises LIMIT 100")
    exercises = [json.loads(r["data"]) for r in rows]

    energia = inputs.energia if inputs else 5
    serie_mod = -1 if energia < 4 else (1 if energia > 7 else 0)
    focus = inputs.focus_muscolare if inputs else None
    dolori = inputs.dolori_articolari if inputs and inputs.dolori_articolari else []

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
            dur = 25 if energia < 4 else (35 if energia > 7 else 30)
            if livello != "Principiante":
                dur += 10
            dist = round(dur * 0.08, 1)
            plan_giorni.append({
                "giorno": giorno, "tipo": "camminata",
                "attivita": [{"nome": "Camminata", "durata_minuti": dur, "distanza_km": dist, "note": "Passo moderato"}],
            })
        else:
            if focus:
                available = [e for e in exercises
                           if e.get("categoria") in focus
                           and e.get("exercise_id") not in avoid_exercises]
            else:
                categorie_rotazione = ["Gambe", "Core", "Braccia", "Spalle", "Petto", "Schiena"]
                cat_oggi = categorie_rotazione[(i // 2) % len(categorie_rotazione)]
                cat_secondaria = categorie_rotazione[((i // 2) + 1) % len(categorie_rotazione)]
                available = [e for e in exercises
                           if e.get("categoria") in [cat_oggi, cat_secondaria, "Cardio"]
                           and e.get("exercise_id") not in avoid_exercises]
            num_esercizi = 4 if livello == "Principiante" else 6
            selected = available[:num_esercizi] if len(available) >= num_esercizi else available
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

    plan_id = f"plan_{uuid.uuid4().hex[:12]}"
    plan_doc = {
        "plan_id": plan_id, "user_id": user["user_id"],
        "nome": f"Piano Auto - Fascia {eta}", "tipo": "automatico",
        "giorni": plan_giorni, "attivo": True,
        "created_at": now.isoformat(),
    }
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("SELECT plan_id, data FROM plans WHERE user_id = $1", user["user_id"])
        for r in rows:
            d = json.loads(r["data"])
            d["attivo"] = False
            await conn.execute("UPDATE plans SET data = $1 WHERE plan_id = $2", json.dumps(d), r["plan_id"])
        await conn.execute(
            "INSERT INTO plans (plan_id, user_id, data) VALUES ($1, $2, $3)",
            plan_id, user["user_id"], json.dumps(plan_doc)
        )
    return plan_doc

@app.put("/api/plans/{plan_id}/exercise")
async def update_plan_exercise(request: Request, plan_id: str, update: PlanExerciseUpdate):
    user = await get_current_user(request)
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT data FROM plans WHERE plan_id = $1 AND user_id = $2",
            plan_id, user["user_id"]
        )
        if not row:
            raise HTTPException(status_code=404, detail="Piano non trovato")
        plan = json.loads(row["data"])
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
        plan["giorni"] = giorni
        await conn.execute("UPDATE plans SET data = $1 WHERE plan_id = $2", json.dumps(plan), plan_id)
        row2 = await conn.fetchrow("SELECT data FROM plans WHERE plan_id = $1", plan_id)
    return json.loads(row2["data"])

# ===== STATS =====

@app.get("/api/stats")
async def get_stats(request: Request):
    user = await get_current_user(request)
    uid = user["user_id"]
    async with db_pool.acquire() as conn:
        walk_rows = await conn.fetch(
            "SELECT data FROM walks WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1000", uid
        )
        circuit_rows = await conn.fetch(
            "SELECT data FROM circuits WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1000", uid
        )
    walks = [json.loads(r["data"]) for r in walk_rows]
    circuits = [json.loads(r["data"]) for r in circuit_rows]

    now = datetime.now(timezone.utc)
    week_ago = (now - timedelta(days=7)).isoformat()
    month_ago = (now - timedelta(days=30)).isoformat()

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
            if not ex.get("sets"):
                vol = ex.get("serie", 0) * ex.get("ripetizioni", 0) * ex.get("peso_kg", 0)
                total_volume += vol
                eid = ex.get("exercise_id", ex.get("nome", ""))
                exercise_volumes[eid] = exercise_volumes.get(eid, 0) + vol

    ww = [w for w in walks if w.get("data", "") >= week_ago]
    wc = [c for c in circuits if c.get("data", "") >= week_ago]
    weekly_km = sum(w.get("distanza_km", 0) for w in ww)
    weekly_passi = sum(w.get("passi", 0) for w in ww)

    mw = [w for w in walks if w.get("data", "") >= month_ago]
    mc = [c for c in circuits if c.get("data", "") >= month_ago]
    monthly_km = sum(w.get("distanza_km", 0) for w in mw)

    best_km = max((w.get("distanza_km", 0) for w in walks), default=0)
    best_passi = max((w.get("passi", 0) for w in walks), default=0)
    best_velocita = max((w.get("velocita_media_kmh", 0) for w in walks), default=0)
    longest_walk_sec = max((w.get("tempo_secondi", 0) for w in walks), default=0)

    avg_km_per_walk = round(total_km / max(len(walks), 1), 2)
    avg_speed = round(sum(w.get("velocita_media_kmh", 0) for w in walks) / max(len(walks), 1), 1)
    avg_circuit_time = round(total_circuit_time / max(total_circuits, 1), 1)
    total_calories_walk = round(total_km * 60)
    total_calories_circuit = round(total_circuit_time * 5)
    total_calories = total_calories_walk + total_calories_circuit
    total_active_days = len(set([w.get("data", "")[:10] for w in walks] + [c.get("data", "")[:10] for c in circuits]))
    streak = 0
    for i in range(30):
        day = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        if any(w.get("data", "")[:10] == day for w in walks) or any(c.get("data", "")[:10] == day for c in circuits):
            streak += 1
        else:
            break

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
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT data FROM sfide WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
            user["user_id"]
        )
    return [json.loads(r["data"]) for r in rows]

@app.post("/api/sfide/generate")
async def generate_sfide(request: Request):
    user = await get_current_user(request)
    now = datetime.now(timezone.utc)
    livello = user.get("livello", "Principiante")
    diff = "facile" if livello == "Principiante" else "medio" if livello == "Intermedio" else "difficile"
    selected = random.sample(SFIDE_TEMPLATES, min(3, len(SFIDE_TEMPLATES)))
    new_sfide = []
    async with db_pool.acquire() as conn:
        for tmpl in selected:
            target = tmpl["targets"][diff]
            sfida_id = f"sfida_{uuid.uuid4().hex[:12]}"
            sfida = {
                "sfida_id": sfida_id, "user_id": user["user_id"],
                "nome": tmpl["nome"],
                "descrizione": tmpl["descrizione"].format(target=target),
                "tipo": tmpl["tipo"], "target_field": tmpl["target_field"],
                "target_value": target, "current_value": 0, "completata": False,
                "icona": tmpl["icona"], "durata_giorni": tmpl["durata_giorni"],
                "created_at": now.isoformat(),
                "scadenza": (now + timedelta(days=tmpl["durata_giorni"])).isoformat(),
            }
            await conn.execute(
                "INSERT INTO sfide (sfida_id, user_id, data) VALUES ($1, $2, $3)",
                sfida_id, user["user_id"], json.dumps(sfida)
            )
            new_sfide.append(sfida)
    return new_sfide

@app.post("/api/sfide/check-progress")
async def check_sfide_progress(request: Request):
    user = await get_current_user(request)
    uid = user["user_id"]
    now = datetime.now(timezone.utc)
    week_ago = (now - timedelta(days=7)).isoformat()

    async with db_pool.acquire() as conn:
        sfide_rows = await conn.fetch(
            "SELECT sfida_id, data FROM sfide WHERE user_id = $1", uid
        )
        walk_rows = await conn.fetch(
            "SELECT data FROM walks WHERE user_id = $1 AND data->>'data' >= $2", uid, week_ago
        )
        circuit_rows = await conn.fetch(
            "SELECT data FROM circuits WHERE user_id = $1 AND data->>'data' >= $2", uid, week_ago
        )

    sfide = [(r["sfida_id"], json.loads(r["data"])) for r in sfide_rows if not json.loads(r["data"]).get("completata")]
    walks = [json.loads(r["data"]) for r in walk_rows]
    circuits = [json.loads(r["data"]) for r in circuit_rows]

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
    streak = 0
    all_walks_rows = []
    all_circuits_rows = []
    async with db_pool.acquire() as conn:
        aw = await conn.fetch("SELECT data FROM walks WHERE user_id = $1", uid)
        ac = await conn.fetch("SELECT data FROM circuits WHERE user_id = $1", uid)
    all_walks_rows = [json.loads(r["data"]) for r in aw]
    all_circuits_rows = [json.loads(r["data"]) for r in ac]
    for i in range(30):
        day = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        if any(w.get("data", "")[:10] == day for w in all_walks_rows) or any(c.get("data", "")[:10] == day for c in all_circuits_rows):
            streak += 1
        else:
            break

    field_map = {"km": weekly_km, "passi": weekly_passi, "circuiti": weekly_circuits, "volume": weekly_volume, "streak": streak, "velocita": best_speed, "calorie": weekly_cal}
    updated = []
    async with db_pool.acquire() as conn:
        for sfida_id, s in sfide:
            if s.get("scadenza", "") < now.isoformat():
                s["scaduta"] = True
                await conn.execute("UPDATE sfide SET data = $1 WHERE sfida_id = $2", json.dumps(s), sfida_id)
                continue
            cv = field_map.get(s.get("target_field", ""), 0)
            completata = cv >= s.get("target_value", 0)
            s["current_value"] = round(cv, 1)
            s["completata"] = completata
            await conn.execute("UPDATE sfide SET data = $1 WHERE sfida_id = $2", json.dumps(s), sfida_id)
            updated.append(s)
    return updated

@app.get("/api/health")
async def health():
    return {"status": "ok", "app": "Walt the GOAT"}

# Serve React static files in production
FRONTEND_BUILD_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "build")
if os.path.exists(FRONTEND_BUILD_DIR):
    app.mount("/static", StaticFiles(directory=os.path.join(FRONTEND_BUILD_DIR, "static")), name="static")

    @app.get("/{full_path:path}")
    async def serve_react(full_path: str):
        index_path = os.path.join(FRONTEND_BUILD_DIR, "index.html")
        return FileResponse(index_path)
