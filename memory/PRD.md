# Walt the GOAT - PRD (Product Requirements Document)

## Problem Statement
App fitness "Walter the Walker" per anziani con tracking camminata, circuiti di allenamento e sfide. Due problemi principali:
1. Il percorso GPS calcolato non veniva mostrato sulla mappa per approvazione utente
2. Le GIF della mascotte Walt (ariete muscoloso) erano errate - servivano animazioni corrette

## Architecture
- **Frontend**: React 18 + Tailwind CSS + Leaflet (mappe)
- **Backend**: FastAPI + MongoDB (Motor async)
- **Maps**: Leaflet + CartoDBN dark tiles
- **Routing**: OSRM public API (gratuito, no API key)
- **Geocoding**: Nominatim / OpenStreetMap (gratuito)

## User Personas
- Anziani attivi (65+) che vogliono tracciare le camminate
- Utenti che fanno circuiti di pesi leggeri
- Utenti motivati dalle sfide settimanali

## Core Requirements (Static)
- Tracking GPS camminate con mappa
- Circuiti di allenamento con pesi
- Sfide settimanali ("Sfide GOAT")
- Mascotte "Walt the GOAT" animata
- Piani di allenamento automatici

## What's Been Implemented

### Session 1 (11 Apr 2026)
- Fix GPS route display: MapPreview ora si mostra quando la camminata è terminata (status='done')
- Fix MapPreview reusability (percorsoKey per re-rendering)
- Nuove GIF animate per Walt (2 frame)
- idle.png aggiornato con walt1.png

### Session 2 (11 Apr 2026)
- **Pianificazione Percorso**: Due modalità Libera / Percorso
  - Libera: tracking GPS come prima
  - Percorso: slider km (1-25), circolare o lineare
  - Geocoding indirizzi via Nominatim
  - Generazione percorsi via OSRM con algoritmo adattivo
  - Anteprima mappa con percorso, partenza/arrivo
  - Mappa live durante camminata con posizione in tempo reale
- **GIF migliorate**: 4-6 frame per animazione fluida
  - Sollevamento pesi (6 frame: su-giù ciclico)
  - Camminata McGregor swagger (4 frame)
  - Trofeo alzato (6 frame: raccolta-sollevamento-esultanza)
- Backend: POST /api/routes/generate, GET /api/routes/geocode
- idle.png ripristinato all'originale

## Prioritized Backlog

### P0 (Critico)
- Nessuno

### P1 (Importante)
- Navigazione passo-passo durante percorso pianificato
- Notifiche vocali durante camminata (es. "Gira a destra")

### P2 (Nice to have)
- Condivisione percorsi con altri utenti
- Classifica sfide tra amici
- Progressione peso negli esercizi con grafico storico
- Integrazione con dispositivi wearable

## Next Tasks
- Test su dispositivo mobile reale per GPS
- Migliorare stile slider km con thumb personalizzato
- Aggiungere indicazione distanza rimanente durante percorso pianificato
