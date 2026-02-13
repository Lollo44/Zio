# Walt the GOAT - PRD

## Problem Statement
App fitness PWA mobile-first "Walt the GOAT" per la fascia di età 70-75. Web app React+FastAPI+MongoDB con tema scuro elegante, mascotte "Walt the Goat" ariete, login Google. Interfaccia italiana.

## Architecture
- **Frontend**: React 18 + Tailwind CSS v3 + Recharts + Leaflet + Lucide Icons
- **Backend**: FastAPI + MongoDB (motor async driver)
- **Auth**: Emergent Google OAuth
- **Design**: Dark elegant theme (#09090b bg, amber/emerald accents), mobile-first

## User Personas
- Italiani 70-75 anni, attivi e motivati
- Usano smartphone, cercano tracking fitness semplice e motivante

## What's Been Implemented

### Backend (2026-02-13)
- **Auth**: Google OAuth session, /api/auth/session, /me, /logout
- **Profile**: GET/PUT con onboarding multi-step
- **Walks**: GET/POST con dati GPS (percorso lat/lng)
- **Circuits**: GET/POST con tracking per-SET, deviazioni dal piano
- **Exercises**: 26 esercizi completi in 7 categorie con:
  - Descrizioni tecniche dettagliate
  - Note di sicurezza
  - Varianti (facile/medio/difficile)
  - Gruppi muscolari e attrezzi
- **Exercise APIs**:
  - GET /api/exercises (con filtro categoria)
  - GET /api/exercises/categories (7 categorie)
  - GET /api/exercises/{id} (dettaglio completo)
  - GET /api/exercises/{id}/alternatives (Smart Swap)
  - GET /api/elastici (mappatura colori-kg)
- **Plans**: GET/POST, generate con input:
  - Energia (1-10)
  - Focus muscolare
  - Dolori articolari (filtra esercizi)
- **Stats ENHANCED**: totale, settimanale, mensile, medie, streak, record, volume_per_esercizio, record_esercizi, grafici_giornalieri, calorie
- **Sfide Goat**: generate (3 sfide random), check-progress, GET all

### Frontend (2026-02-13)
- **LoginPage**: Immagine Walt PNG (logo con scritta)
- **OnboardingPage**: 5 step (nome, dati, livello, obiettivo, giorni)
- **HomePage**: saluto, piano di oggi (rigenerabile), stats settimanali, sfide attive, record, streak
- **WalkPage**: 
  - Timer GPS reale con filtro movimento stazionario (>5m, 0.5-15 km/h)
  - Distanza/velocità/passi/calorie
  - Mappa Leaflet dark tiles per percorsi storici
- **CircuitPage**: 
  - Tracking per-SET con completamento individuale
  - Visualizzazione categoria esercizio
  - **Smart Swap**: bottone "Sostituisci" per scambiare esercizi
  - **Info Modal**: descrizione, muscoli target, attrezzi, sicurezza, varianti
  - Badge deviazioni (+/- verde/rosso)
- **StatsPage**: 4 tab (Panoramica/Camminate/Circuiti/Trend), Radar chart, Pie chart, grafici
- **SfidePage**: sfide attive con progress bar, completate con badge
- **WaltTheGoat SVG**: ariete animato con 3 stati (idle, walking, flexing)
- **BottomNav**: 5 tab (Home, Camminata, Circuito, Stats, Sfide)

### Database Esercizi (26 esercizi)
**Categorie**:
- Gambe: Squat Sedia, Affondi, Calf Raises, Leg Extension, Step Up
- Core: Crunch, Plank Ginocchia, Rotazioni Busto, Ponte Glutei, Dead Bug
- Braccia: Curl Bicipiti (manubri/elastico), Dips Sedia, Estensioni Tricipiti
- Spalle: Alzate Laterali, Alzate Frontali, Shoulder Press
- Petto: Push Up Muro, Chest Press Elastico, Fly Manubri
- Schiena: Rematore, Tirate Elastico, Superman, Strette Scapolari
- Cardio: Marcia sul Posto, Jumping Jacks Soft

### Testing (2026-02-13)
- Backend: 18/18 API test PASSED (100%)
- Frontend: 100% features verified
- Bug corretto: null check per dolori_articolari in plan generation

## Files di Riferimento
- `/app/backend/exercises_database.py` - Database 26 esercizi
- `/app/backend/progressione_dolce_spec.md` - Specifiche algoritmo futuro
- `/app/frontend/src/assets/walt-logo.png` - Logo mascotte

## Backlog

### P0 - Prossimo Sprint
- [ ] 4 immagini PNG Walt per diverse pose (l'utente dice che sono nel repo)
- [ ] Bodyweight tracker con grafico storico

### P1 - Alta Priorità
- [ ] Google Maps su camminate storiche (Leaflet già implementato)
- [ ] Generatore allenamenti UI con modal energia/focus/dolori
- [ ] Push notification per promemoria allenamento

### P2 - Media Priorità  
- [ ] Piani custom creabili dall'utente
- [ ] Export dati CSV/PDF
- [ ] Condivisione social risultati

### P3 - Backlog Futuro
- [ ] "La Progressione Dolce" - algoritmo 3 fasi (salvato in progressione_dolce_spec.md)
- [ ] Leaderboard utenti
- [ ] Integrazione meteo
- [ ] Offline mode con service worker
