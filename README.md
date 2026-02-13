# Walter the Walker (Fit Tracker)

App per monitorare camminate, circuito pesi e statistiche per persone senior.
Disponibile in due versioni: **Android** e **Webapp**.

## Moduli principali
- Camminata con GPS e contapassi (timer, distanza, velocità, passi)
- Circuito pesi con registrazione serie/ripetizioni/peso (8 esercizi)
- Piani di allenamento automatici e personalizzati
- Statistiche per periodo (settimana/mese/totale)

## Versione Android
Apri il progetto in Android Studio, sincronizza Gradle e avvia su un dispositivo Android.
- Kotlin + Jetpack Compose + Material 3
- Room database per persistenza locale
- GPS e sensore contapassi

## Versione Webapp (PWA)
Apri `webapp/index.html` in un browser o servi la cartella con un server locale:
```bash
cd webapp && python3 -m http.server 8080
```
Poi visita http://localhost:8080
- HTML/CSS/JS puro, nessuna dipendenza esterna
- Progressive Web App installabile su mobile
- Funziona anche offline grazie al Service Worker
- localStorage per persistenza dati
