# Walt the GOAT - PRD

## Problem Statement
App fitness PWA mobile-first "Walt the GOAT" per la fascia di età 70-75. Conversione da Android "Nonno Workout" (Kotlin/Jetpack Compose) a web app React+FastAPI+MongoDB. Tema scuro elegante, mascotte "Walt the Goat" ariete animato SVG, login Google, interfaccia italiana. Sfide Goat, statistiche avanzate, tracking GPS, circuito pesi con deviazioni dal piano.

## Architecture
- **Frontend**: React 18 + Tailwind CSS v3 + Recharts + Leaflet + Lucide Icons
- **Backend**: FastAPI + MongoDB (motor async driver)
- **Auth**: Emergent Google OAuth
- **Design**: Dark elegant theme (#09090b bg, amber/emerald accents), mobile-first

## User Personas
- Italiani 70-75 anni, attivi e motivati
- Usano smartphone, cercano tracking fitness semplice e motivante

## What's Been Implemented (2026-02-13)

### Backend
- Auth: Google OAuth session, /api/auth/session, /me, /logout
- Profile: GET/PUT con onboarding multi-step
- Walks: GET/POST con dati GPS (percorso lat/lng)
- Circuits: GET/POST con tracking per-SET, deviazioni dal piano
- Exercises: 8 esercizi seed (bicipiti, tricipiti, petto, spalle, schiena, addome, gambe, cardio)
- Plans: GET/POST, generate auto, PUT update singolo esercizio
- Stats ENHANCED: totale, settimanale, mensile, medie, streak, record, volume_per_esercizio, record_esercizi, grafici_giornalieri, calorie stimate
- Sfide Goat: generate (3 sfide random), check-progress, GET all

### Frontend
- LoginPage: "Walt the GOAT" con mascotte + Google login
- OnboardingPage: 5 step (nome, dati, livello, obiettivo, giorni)
- HomePage: saluto, piano di oggi (rigenerabile), stats settimanali, sfide attive, record, streak
- WalkPage: timer, GPS reale (Geolocation API), distanza/velocità/passi stimati/calorie, mappa Leaflet dark tiles per percorsi, cronologia
- CircuitPage: tracking per-SET con completamento individuale, aggiunta/rimozione serie, modifica piano pre-esecuzione, badge deviazioni (+/- verde/rosso), riepilogo vs piano
- StatsPage: 4 tab (Panoramica/Camminate/Circuiti/Trend), Radar chart profilo fitness, Pie chart volume muscolare, Area/Bar/Line charts, streak, calorie, record per esercizio
- SfidePage: sfide attive con progress bar, sfide completate con badge, generazione nuove sfide
- WaltTheGoat SVG: ariete dettagliato con corna curve, occhi con blink, barba, guance rosa, 3 stati animati (idle float, walking legs+arms, flexing bicep curl con manubri + gocce sudore)
- BottomNav: 5 tab (Home, Camminata, Circuito, Stats, Sfide)
- Profilo accessibile da icona in Home header

### Testing
- Backend: 16/16 API test PASSED (100%)
- Frontend: Visivamente verificato con screenshot (Home, Walk, Circuit, Stats, Sfide)

## Backlog
### P1
- Mappa route display per camminate storiche (clic su camminata > mostra mappa)
- Push notification per promemoria allenamento
- Piani custom creabili dall'utente
- Offline mode con service worker

### P2
- Export dati CSV/PDF
- Condivisione social risultati
- Integrazione meteo
- Input manuale frequenza cardiaca
