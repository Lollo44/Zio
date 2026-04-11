# Walter the Walker (Walt the GOAT)

A fitness tracking app designed for seniors, featuring walks tracking, circuit training, personalized plans, and statistics.

## Tech Stack

- **Frontend**: React (Create React App) with Tailwind CSS, Framer Motion, React Router, Leaflet maps, Recharts
- **Backend**: FastAPI (Python) with asyncpg for PostgreSQL
- **Database**: PostgreSQL (Replit built-in)
- **Auth**: Google OAuth via demobackend.emergentagent.com

## Architecture

- Frontend runs on port 5000 (served via CRA dev server)
- Backend runs on port 8000 (FastAPI/uvicorn) on localhost
- Frontend proxies API calls to backend via CRA proxy (`"proxy": "http://localhost:8000"`)
- `REACT_APP_BACKEND_URL` is set to `""` so all API calls use relative paths

## Project Structure

```
frontend/        - React app (CRA)
backend/         - FastAPI server
  server.py      - Main API (PostgreSQL version, adapted from MongoDB)
  exercises_database.py - Static exercise data
app/             - Android app (Kotlin/Jetpack Compose) - not run in Replit
webapp/          - Legacy PWA (vanilla JS) - not run in Replit
```

## Running

The `start.sh` script starts both services:
1. Backend: `cd backend && uvicorn server:app --host localhost --port 8000`
2. Frontend: `cd frontend && PORT=5000 HOST=0.0.0.0 npm start`

## Key Notes

- Original backend used MongoDB (Motor); adapted to PostgreSQL (asyncpg) with JSONB columns
- Data is stored as JSONB in PostgreSQL tables for flexible schema
- Backend tables: users, user_sessions, walks, circuits, exercises, plans, sfide
