# Walter the Walker - PRD

## Problem Statement
Conversione dell'app Android "Nonno Workout" (Kotlin/Jetpack Compose) in una Progressive Web App chiamata "Walter the Walker". L'app è un fitness tracker per la fascia di età 70-75, con tema scuro elegante, mascotte "Walt the Goat" (ariete animato), login Google, e interfaccia in italiano.

## Architecture
- **Frontend**: React 18 + Tailwind CSS v3 + Recharts + Lucide Icons
- **Backend**: FastAPI + MongoDB (motor async driver)
- **Auth**: Emergent Google OAuth
- **Design**: Dark elegant theme, mobile-first PWA (max-w-md centered)

## User Personas
- Seniors 70-75 years old, Italian speaking
- Tech-comfortable, use smartphones
- Want to track walking and light weight training
- Motivated by stats and progress tracking

## Core Requirements
- [x] Google Auth login (Emergent OAuth)
- [x] Onboarding multi-step (nome, età, peso, altezza, livello, obiettivi, giorni)
- [x] Home dashboard with daily plan, stats, mascot
- [x] Walking tracker (timer, distance, steps, speed simulation)
- [x] Circuit training (8 exercises, log series/reps/weight)
- [x] Auto-generated plans for 70-75 age group
- [x] Statistics with charts (Recharts: line + bar charts)
- [x] Profile management
- [x] Mascotte "Walt the Goat" SVG con 3 stati: idle, walking, flexing
- [x] Dark elegant theme (amber/emerald on zinc)
- [x] Italian language interface
- [x] Bottom navigation bar

## What's Been Implemented (2026-02-13)
### Backend (FastAPI)
- Auth endpoints: /api/auth/session, /api/auth/me, /api/auth/logout
- Profile: GET/PUT /api/profile
- Walks: GET/POST /api/walks
- Circuits: GET/POST /api/circuits
- Exercises: GET /api/exercises (8 seeded exercises)
- Plans: GET/POST /api/plans, POST /api/plans/generate
- Stats: GET /api/stats (aggregated + chart data)

### Frontend (React)
- LoginPage with Walt mascot + Google login
- AuthCallback for OAuth flow
- OnboardingPage (5-step wizard)
- HomePage (greeting, daily plan, weekly stats, records)
- WalkPage (timer, start/pause/stop/save, history)
- CircuitPage (exercise accordion, log sets/reps/weight, history)
- StatsPage (4 charts: distance, steps, volume, duration)
- ProfilePage (view/edit profile, logout)
- BottomNav (5 tabs)
- WaltTheGoat SVG mascot component (3 animation states)

## Testing Status
- Backend: 15/15 tests passed (100%)
- Frontend: All core functionality working (98%)

## Prioritized Backlog
### P0 (Critical)
- None (all core features implemented)

### P1 (Important)
- GPS real-time tracking integration (Geolocation API)
- Real step counting (DeviceMotion API)
- Custom plan creation/editing
- Push notifications for workout reminders

### P2 (Nice to have)
- Offline mode with service worker
- Walking route map (Leaflet/react-leaflet)
- Export data (CSV/PDF)
- Social features (share achievements)
- Weather API integration
- Heart rate manual input
- Hydration reminders

## Next Tasks
1. Add GPS geolocation for real distance tracking
2. Implement custom plan creation
3. Add more Walt the Goat animation states
4. Service worker for offline support
