# Walt the GOAT - PRD

## Problem Statement
App fitness PWA mobile-first "Walt the GOAT" per la fascia di età 70-75. Web app React+FastAPI+MongoDB con tema scuro elegante, mascotte "Walt the Goat" ariete. Interfaccia italiana.

**Ultimo aggiornamento**: 26 Febbraio 2026
**Modifica recente**: Eliminato accesso Google, abilitato accesso libero (AUTH_DISABLED=true)

## Architecture
- **Frontend**: React 18 + Tailwind CSS v3 + Recharts + Leaflet + Lucide Icons
- **Backend**: FastAPI + MongoDB (motor async driver)
- **Auth**: DISABILITATA - Accesso libero con utente demo
- **Design**: Dark elegant theme (#09090b bg, amber/emerald accents), mobile-first

## User Personas
- Italiani 70-75 anni, attivi e motivati
- Usano smartphone, cercano tracking fitness semplice e motivante

## What's Been Implemented

### Auth System - AGGIORNATO 26/02/2026
- **Accesso libero**: AUTH_DISABLED=true in backend/.env e frontend/.env
- **Utente demo**: user_demo creato automaticamente
- **Nessun login Google**: rimosso completamente, redirect diretto a /home

### Backend Features
- **Profile**: GET/PUT con onboarding multi-step
- **Walks**: GET/POST con dati GPS (percorso lat/lng)
- **Circuits**: GET/POST con tracking per-SET, deviazioni dal piano
- **Exercises**: 26 esercizi completi in 7 categorie con descrizioni, note sicurezza, varianti
- **Plans**: GET/POST, generate con energia, focus muscolare, dolori articolari
- **Stats ENHANCED**: totale, settimanale, mensile, medie, streak, record, volume_per_esercizio
- **Sfide Goat**: generate (3 sfide random), check-progress

### Frontend Features
- **HomePage**: saluto personalizzato, piano di oggi (rigenerabile), stats settimanali, sfide attive, streak
- **WalkPage**: Timer GPS reale con filtro movimento, mappa Leaflet dark tiles
- **CircuitPage**: Tracking per-SET, Smart Swap, Info Modal con descrizioni esercizi
- **StatsPage**: 4 tab (Panoramica/Camminate/Circuiti/Trend), grafici
- **SfidePage**: sfide attive con progress bar, completate con badge
- **BottomNav**: 5 tab (Home, Camminata, Circuito, Stats, Sfide)

### Testing (26/02/2026)
- Backend: 16/16 API test PASSED (100%)
- Frontend: 100% features verified
- Accesso libero verificato

## Files di Riferimento
- `/app/backend/exercises_database.py` - Database 26 esercizi
- `/app/backend/progressione_dolce_spec.md` - Specifiche algoritmo futuro
- `/app/frontend/src/assets/walt-logo.png` - Logo mascotte

## Backlog

### P0 - Prossimo Sprint
- [ ] Bodyweight tracker con grafico storico
- [ ] 4 immagini PNG Walt per diverse pose (utente dice che sono nel repo)

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
