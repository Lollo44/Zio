# La Progressione Dolce - Algoritmo di Progressione Allenamento
# Da implementare come fase finale per rendere l'app più intelligente

## Concetto Base
L'algoritmo "La Progressione Dolce" è progettato per guidare utenti over 70 
attraverso una progressione sicura e graduale nel resistance training.

## Le 3 Fasi della Progressione

### FASE 1: Adattamento Anatomico (Settimane 1-4)
- **Obiettivo**: Abituare tendini, legamenti e muscoli al carico
- **Caratteristiche**:
  - Ripetizioni: 15-20
  - Serie: 2-3
  - Peso: Leggero (30-40% del massimale stimato)
  - Recupero: 60-90 secondi
  - Focus: Tecnica perfetta, movimento controllato
- **Incrementi**: 
  - Solo dopo aver completato tutte le ripetizioni con forma perfetta
  - +1-2 ripetizioni alla volta, mai peso
  - Se completato 20 reps per 2 sessioni consecutive → passa a Fase 2

### FASE 2: Ipertrofia Funzionale (Settimane 5-10)
- **Obiettivo**: Costruire forza muscolare di base
- **Caratteristiche**:
  - Ripetizioni: 10-15
  - Serie: 3
  - Peso: Moderato (50-60% del massimale stimato)
  - Recupero: 60-90 secondi
  - Focus: Volume e resistenza muscolare
- **Incrementi**:
  - Quando si completano 15 reps per 2 sessioni → aumenta peso 5-10%
  - Riduce automaticamente le reps a 10-12 dopo aumento peso
  - Se impossibile completare 10 reps → torna al peso precedente

### FASE 3: Forza Relativa (Settimane 11+)
- **Obiettivo**: Forza funzionale per attività quotidiane
- **Caratteristiche**:
  - Ripetizioni: 8-12
  - Serie: 3-4
  - Peso: Impegnativo ma sicuro (60-70% del massimale stimato)
  - Recupero: 90-120 secondi
  - Focus: Qualità del movimento e progressione
- **Incrementi**:
  - Completate 12 reps per 3 sessioni → microaumento peso (+0.5-1kg)
  - Mai sacrificare la forma per completare ripetizioni

## Logica di Regressione Automatica
- 2 sessioni consecutive con <80% completamento → regredisce alla fase precedente
- Segnalazione dolore articolare → pausa esercizio specifico, proponi alternativa
- Interruzione >2 settimane → ricomincia dalla Fase 1 (con carichi ridotti 20%)

## Adattamenti per Livello Energia (Input Utente)
- **Bassa (1-3)**: Riduci serie (-1), riduci peso (-10%), aumenta recupero
- **Media (4-6)**: Parametri standard della fase attuale
- **Alta (7-10)**: Aggiungi 1 serie opzionale, mantieni tecnica

## Adattamenti per Dolore Articolare (Input Utente)
- **Ginocchia**: Evita squat profondi, preferisci leg press, step ridotti
- **Spalle**: Evita alzate sopra la testa, preferisci movimenti frontali bassi
- **Schiena**: Evita flessioni in avanti caricate, preferisci movimenti supportati
- **Polsi**: Usa impugnature neutre, elastici invece di manubri

## Smart Swap - Logica di Sostituzione
Quando l'utente chiede di sostituire un esercizio:
1. Identifica il gruppo muscolare target
2. Proponi 3 alternative dello stesso gruppo
3. Considera gli attrezzi disponibili dell'utente
4. Adatta il carico alla nuova meccanica

## Tracking Volume
Volume = Serie × Ripetizioni × Peso (o kg equivalente elastico)
- Obiettivo settimanale per gruppo muscolare
- Grafico di progressione volume nel tempo
- Alert se volume cala >15% per 2 settimane

## Implementazione Suggerita

```python
class ProgressioneDolce:
    def __init__(self, user_id):
        self.user_id = user_id
        self.fase_attuale = 1
        self.settimana = 1
        
    def calcola_parametri(self, esercizio, energia, dolori):
        base = self.get_parametri_fase()
        # Adatta per energia
        if energia < 4:
            base['serie'] -= 1
            base['peso'] *= 0.9
        elif energia > 7:
            base['serie_bonus'] = 1
        # Adatta per dolori
        if self.ha_dolore_rilevante(esercizio, dolori):
            return self.trova_alternativa(esercizio, dolori)
        return base
    
    def valuta_sessione(self, risultati):
        completamento = self.calcola_completamento(risultati)
        if completamento >= 0.95 and self.sessioni_complete >= 2:
            return self.proponi_avanzamento()
        elif completamento < 0.8:
            return self.valuta_regressione()
```

## Note per Implementazione
- Salvare fase_attuale e settimana nel profilo utente
- Creare collection 'progressioni' per storico
- UI: mostrare chiaramente la fase attuale e i prossimi obiettivi
- Feedback visivo quando si avanza di fase (celebrazione con Walt!)
