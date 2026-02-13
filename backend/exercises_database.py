# Database completo degli esercizi per Walt the GOAT
# Categorie: Gambe, Core, Braccia, Spalle, Petto, Schiena
# Include descrizioni tecniche, attrezzi, e modifiche per diversi livelli

ESERCIZI_DATABASE = [
    # === GAMBE ===
    {
        "exercise_id": "ex_squat_sedia",
        "nome": "Squat con Sedia",
        "categoria": "Gambe",
        "gruppo_muscolare": ["quadricipiti", "glutei"],
        "attrezzi": ["sedia"],
        "descrizione_tecnica": "In piedi davanti a una sedia, scendi lentamente come per sederti, sfiora la sedia e risali. Mantieni la schiena dritta e le ginocchia allineate ai piedi.",
        "serie_default": 3,
        "ripetizioni_default": 12,
        "peso_default": 0,
        "livello": "Principiante",
        "varianti": {
            "facile": "Usa le braccia per aiutarti ad alzarti",
            "medio": "Aggiungi una pausa di 2 secondi in basso",
            "difficile": "Tieni un peso al petto"
        },
        "note_sicurezza": "Non lasciare che le ginocchia superino le punte dei piedi"
    },
    {
        "exercise_id": "ex_affondi_supporto",
        "nome": "Affondi con Supporto",
        "categoria": "Gambe",
        "gruppo_muscolare": ["quadricipiti", "glutei", "femorali"],
        "attrezzi": ["sedia", "muro"],
        "descrizione_tecnica": "Tenendoti a una sedia o al muro, fai un passo avanti e scendi piegando entrambe le ginocchia a 90°. Torna in posizione e alterna le gambe.",
        "serie_default": 3,
        "ripetizioni_default": 10,
        "peso_default": 0,
        "livello": "Principiante",
        "varianti": {
            "facile": "Affondi più corti con supporto stabile",
            "medio": "Riduci l'uso del supporto",
            "difficile": "Senza supporto con manubri"
        },
        "note_sicurezza": "Mantieni il busto eretto durante tutto il movimento"
    },
    {
        "exercise_id": "ex_calf_raises",
        "nome": "Sollevamenti Polpacci",
        "categoria": "Gambe",
        "gruppo_muscolare": ["polpacci"],
        "attrezzi": ["sedia", "gradino"],
        "descrizione_tecnica": "In piedi con supporto, solleva i talloni il più possibile contraendo i polpacci. Mantieni 1 secondo in alto, poi scendi lentamente.",
        "serie_default": 3,
        "ripetizioni_default": 15,
        "peso_default": 0,
        "livello": "Principiante",
        "varianti": {
            "facile": "Entrambi i piedi insieme",
            "medio": "Su un gradino per maggiore range",
            "difficile": "Un piede alla volta"
        },
        "note_sicurezza": "Usa sempre un supporto per l'equilibrio"
    },
    {
        "exercise_id": "ex_leg_extension_elastico",
        "nome": "Leg Extension con Elastico",
        "categoria": "Gambe",
        "gruppo_muscolare": ["quadricipiti"],
        "attrezzi": ["elastico", "sedia"],
        "descrizione_tecnica": "Seduto su una sedia con l'elastico legato alla caviglia e fissato alla gamba della sedia, estendi la gamba completamente. Mantieni 2 secondi e torna controllato.",
        "serie_default": 3,
        "ripetizioni_default": 12,
        "peso_default": 0,
        "livello": "Principiante",
        "elastico_colore": "giallo",
        "varianti": {
            "facile": "Elastico giallo (leggero)",
            "medio": "Elastico rosso (medio)",
            "difficile": "Elastico blu (forte)"
        },
        "note_sicurezza": "Non iperestendere il ginocchio"
    },
    {
        "exercise_id": "ex_step_up",
        "nome": "Step Up",
        "categoria": "Gambe",
        "gruppo_muscolare": ["quadricipiti", "glutei"],
        "attrezzi": ["gradino", "step"],
        "descrizione_tecnica": "Sali su un gradino o step con un piede, porta l'altro piede in alto, poi scendi controllato. Alterna le gambe.",
        "serie_default": 3,
        "ripetizioni_default": 10,
        "peso_default": 0,
        "livello": "Intermedio",
        "varianti": {
            "facile": "Gradino basso con supporto",
            "medio": "Gradino medio",
            "difficile": "Gradino alto con manubri"
        },
        "note_sicurezza": "Assicurati che il gradino sia stabile"
    },

    # === CORE ===
    {
        "exercise_id": "ex_crunch_sedia",
        "nome": "Crunch con Supporto Sedia",
        "categoria": "Core",
        "gruppo_muscolare": ["addominali"],
        "attrezzi": ["sedia", "tappetino"],
        "descrizione_tecnica": "Sdraiato con i polpacci appoggiati sulla sedia, solleva le spalle verso le ginocchia contraendo gli addominali. Non tirare il collo.",
        "serie_default": 3,
        "ripetizioni_default": 12,
        "peso_default": 0,
        "livello": "Principiante",
        "varianti": {
            "facile": "Movimento piccolo, mani lungo i fianchi",
            "medio": "Mani dietro la testa (senza tirare)",
            "difficile": "Pausa di 2 sec in alto"
        },
        "note_sicurezza": "Non tirare il collo con le mani"
    },
    {
        "exercise_id": "ex_plank_ginocchia",
        "nome": "Plank sulle Ginocchia",
        "categoria": "Core",
        "gruppo_muscolare": ["addominali", "stabilizzatori"],
        "attrezzi": ["tappetino"],
        "descrizione_tecnica": "In posizione prona, solleva il corpo sugli avambracci e sulle ginocchia. Mantieni la schiena dritta e gli addominali contratti.",
        "serie_default": 3,
        "ripetizioni_default": 1,
        "tempo_secondi": 20,
        "peso_default": 0,
        "livello": "Principiante",
        "varianti": {
            "facile": "15 secondi",
            "medio": "30 secondi",
            "difficile": "45 secondi o plank completo"
        },
        "note_sicurezza": "Non lasciare che i fianchi si abbassino"
    },
    {
        "exercise_id": "ex_rotazioni_busto",
        "nome": "Rotazioni del Busto",
        "categoria": "Core",
        "gruppo_muscolare": ["obliqui", "core"],
        "attrezzi": ["bastone", "nessuno"],
        "descrizione_tecnica": "Seduto o in piedi, tieni un bastone sulle spalle o le braccia incrociate al petto. Ruota lentamente il busto a sinistra, poi a destra.",
        "serie_default": 3,
        "ripetizioni_default": 15,
        "peso_default": 0,
        "livello": "Principiante",
        "varianti": {
            "facile": "Movimento lento senza peso",
            "medio": "Con bastone",
            "difficile": "Con peso leggero"
        },
        "note_sicurezza": "Ruota solo il busto, mantieni i fianchi fermi"
    },
    {
        "exercise_id": "ex_ponte_glutei",
        "nome": "Ponte per Glutei",
        "categoria": "Core",
        "gruppo_muscolare": ["glutei", "lombari"],
        "attrezzi": ["tappetino"],
        "descrizione_tecnica": "Sdraiato sulla schiena, ginocchia piegate e piedi a terra. Solleva i fianchi contraendo i glutei fino a formare una linea retta dalle spalle alle ginocchia.",
        "serie_default": 3,
        "ripetizioni_default": 12,
        "peso_default": 0,
        "livello": "Principiante",
        "varianti": {
            "facile": "Ponte base",
            "medio": "Pausa 3 sec in alto",
            "difficile": "Un piede sollevato"
        },
        "note_sicurezza": "Non inarcare eccessivamente la schiena"
    },
    {
        "exercise_id": "ex_dead_bug",
        "nome": "Dead Bug",
        "categoria": "Core",
        "gruppo_muscolare": ["addominali", "stabilizzatori"],
        "attrezzi": ["tappetino"],
        "descrizione_tecnica": "Sdraiato, braccia verso il soffitto, ginocchia piegate a 90°. Abbassa lentamente un braccio e la gamba opposta verso il pavimento, poi torna e alterna.",
        "serie_default": 3,
        "ripetizioni_default": 10,
        "peso_default": 0,
        "livello": "Intermedio",
        "varianti": {
            "facile": "Solo gambe",
            "medio": "Braccio e gamba opposti",
            "difficile": "Movimento più lento"
        },
        "note_sicurezza": "Mantieni la schiena premuta contro il pavimento"
    },

    # === BRACCIA ===
    {
        "exercise_id": "ex_bicipiti_manubri",
        "nome": "Curl Bicipiti con Manubri",
        "categoria": "Braccia",
        "gruppo_muscolare": ["bicipiti"],
        "attrezzi": ["manubri"],
        "descrizione_tecnica": "In piedi o seduto, braccia lungo i fianchi con manubri. Piega i gomiti portando i pesi verso le spalle, contrai i bicipiti, poi scendi lentamente.",
        "serie_default": 3,
        "ripetizioni_default": 12,
        "peso_default": 2.0,
        "livello": "Principiante",
        "varianti": {
            "facile": "1-2 kg",
            "medio": "3-4 kg",
            "difficile": "5+ kg"
        },
        "note_sicurezza": "Non oscillare il corpo per aiutarti"
    },
    {
        "exercise_id": "ex_bicipiti_elastico",
        "nome": "Curl Bicipiti con Elastico",
        "categoria": "Braccia",
        "gruppo_muscolare": ["bicipiti"],
        "attrezzi": ["elastico"],
        "descrizione_tecnica": "In piedi sull'elastico, impugna le estremità e piega i gomiti portando le mani verso le spalle. Mantieni i gomiti fermi.",
        "serie_default": 3,
        "ripetizioni_default": 15,
        "peso_default": 0,
        "livello": "Principiante",
        "elastico_colore": "rosso",
        "varianti": {
            "facile": "Elastico giallo",
            "medio": "Elastico rosso",
            "difficile": "Elastico blu"
        },
        "note_sicurezza": "Assicurati che l'elastico sia ben fissato sotto i piedi"
    },
    {
        "exercise_id": "ex_tricipiti_sedia",
        "nome": "Dips su Sedia",
        "categoria": "Braccia",
        "gruppo_muscolare": ["tricipiti"],
        "attrezzi": ["sedia"],
        "descrizione_tecnica": "Seduto sul bordo di una sedia stabile, mani ai lati. Solleva il corpo dalla sedia e scendi piegando i gomiti a 90°, poi spingi per risalire.",
        "serie_default": 3,
        "ripetizioni_default": 10,
        "peso_default": 0,
        "livello": "Intermedio",
        "varianti": {
            "facile": "Piedi vicini, movimento piccolo",
            "medio": "Piedi lontani, movimento completo",
            "difficile": "Una gamba sollevata"
        },
        "note_sicurezza": "Usa una sedia molto stabile che non scivoli"
    },
    {
        "exercise_id": "ex_tricipiti_estensioni",
        "nome": "Estensioni Tricipiti",
        "categoria": "Braccia",
        "gruppo_muscolare": ["tricipiti"],
        "attrezzi": ["manubrio"],
        "descrizione_tecnica": "Seduto o in piedi, tieni un manubrio con entrambe le mani sopra la testa. Piega i gomiti portando il peso dietro la testa, poi estendi le braccia.",
        "serie_default": 3,
        "ripetizioni_default": 12,
        "peso_default": 2.0,
        "livello": "Principiante",
        "varianti": {
            "facile": "1-2 kg",
            "medio": "3-4 kg",
            "difficile": "5+ kg"
        },
        "note_sicurezza": "Mantieni i gomiti vicini alla testa"
    },

    # === SPALLE ===
    {
        "exercise_id": "ex_alzate_laterali",
        "nome": "Alzate Laterali",
        "categoria": "Spalle",
        "gruppo_muscolare": ["deltoidi laterali"],
        "attrezzi": ["manubri"],
        "descrizione_tecnica": "In piedi, braccia lungo i fianchi con manubri leggeri. Solleva le braccia lateralmente fino all'altezza delle spalle, poi abbassa lentamente.",
        "serie_default": 3,
        "ripetizioni_default": 12,
        "peso_default": 1.5,
        "livello": "Principiante",
        "varianti": {
            "facile": "0.5-1 kg",
            "medio": "1.5-2 kg",
            "difficile": "2.5-3 kg"
        },
        "note_sicurezza": "Non alzare oltre l'altezza delle spalle"
    },
    {
        "exercise_id": "ex_alzate_frontali",
        "nome": "Alzate Frontali",
        "categoria": "Spalle",
        "gruppo_muscolare": ["deltoidi anteriori"],
        "attrezzi": ["manubri"],
        "descrizione_tecnica": "In piedi, braccia davanti alle cosce con manubri. Solleva un braccio alla volta frontalmente fino all'altezza delle spalle.",
        "serie_default": 3,
        "ripetizioni_default": 10,
        "peso_default": 1.5,
        "livello": "Principiante",
        "varianti": {
            "facile": "0.5-1 kg, alternato",
            "medio": "1.5-2 kg",
            "difficile": "2.5 kg, entrambe le braccia insieme"
        },
        "note_sicurezza": "Non usare slancio"
    },
    {
        "exercise_id": "ex_shoulder_press",
        "nome": "Shoulder Press Seduto",
        "categoria": "Spalle",
        "gruppo_muscolare": ["deltoidi", "tricipiti"],
        "attrezzi": ["manubri", "sedia"],
        "descrizione_tecnica": "Seduto con schiena supportata, manubri all'altezza delle spalle. Spingi i pesi verso l'alto fino a estendere le braccia, poi scendi lentamente.",
        "serie_default": 3,
        "ripetizioni_default": 10,
        "peso_default": 2.0,
        "livello": "Intermedio",
        "varianti": {
            "facile": "1-2 kg",
            "medio": "2-3 kg",
            "difficile": "4+ kg"
        },
        "note_sicurezza": "Mantieni la schiena ben appoggiata"
    },

    # === PETTO ===
    {
        "exercise_id": "ex_push_up_muro",
        "nome": "Push Up al Muro",
        "categoria": "Petto",
        "gruppo_muscolare": ["pettorali", "tricipiti", "spalle"],
        "attrezzi": ["muro"],
        "descrizione_tecnica": "In piedi di fronte al muro a circa un braccio di distanza. Mani sul muro, larghezza spalle. Piega i gomiti portando il petto verso il muro, poi spingi per tornare.",
        "serie_default": 3,
        "ripetizioni_default": 12,
        "peso_default": 0,
        "livello": "Principiante",
        "varianti": {
            "facile": "Vicino al muro",
            "medio": "Un passo dal muro",
            "difficile": "Due passi dal muro"
        },
        "note_sicurezza": "Mantieni il corpo dritto come una tavola"
    },
    {
        "exercise_id": "ex_chest_press_elastico",
        "nome": "Chest Press con Elastico",
        "categoria": "Petto",
        "gruppo_muscolare": ["pettorali", "tricipiti"],
        "attrezzi": ["elastico"],
        "descrizione_tecnica": "L'elastico passa dietro la schiena, impugna le estremità. Spingi in avanti come se facessi un pugno, poi torna lentamente.",
        "serie_default": 3,
        "ripetizioni_default": 12,
        "peso_default": 0,
        "livello": "Principiante",
        "elastico_colore": "rosso",
        "varianti": {
            "facile": "Elastico giallo",
            "medio": "Elastico rosso",
            "difficile": "Elastico blu"
        },
        "note_sicurezza": "Controlla il movimento di ritorno"
    },
    {
        "exercise_id": "ex_fly_manubri",
        "nome": "Fly con Manubri",
        "categoria": "Petto",
        "gruppo_muscolare": ["pettorali"],
        "attrezzi": ["manubri", "panca", "tappetino"],
        "descrizione_tecnica": "Sdraiato sulla schiena, braccia estese verso l'alto con manubri. Apri le braccia lateralmente mantenendo i gomiti leggermente piegati, poi richiudi.",
        "serie_default": 3,
        "ripetizioni_default": 10,
        "peso_default": 2.0,
        "livello": "Intermedio",
        "varianti": {
            "facile": "1-2 kg, movimento ridotto",
            "medio": "2-3 kg",
            "difficile": "4+ kg"
        },
        "note_sicurezza": "Non scendere troppo per proteggere le spalle"
    },

    # === SCHIENA ===
    {
        "exercise_id": "ex_rematore_manubri",
        "nome": "Rematore con Manubri",
        "categoria": "Schiena",
        "gruppo_muscolare": ["dorsali", "romboidi", "bicipiti"],
        "attrezzi": ["manubri", "sedia"],
        "descrizione_tecnica": "Piegato in avanti con una mano su una sedia per supporto. L'altra mano tiene il manubrio. Tira il peso verso il fianco, poi abbassa lentamente.",
        "serie_default": 3,
        "ripetizioni_default": 10,
        "peso_default": 3.0,
        "livello": "Principiante",
        "varianti": {
            "facile": "2 kg",
            "medio": "3-4 kg",
            "difficile": "5+ kg"
        },
        "note_sicurezza": "Mantieni la schiena dritta, non ruotare il busto"
    },
    {
        "exercise_id": "ex_pull_elastico",
        "nome": "Tirate con Elastico",
        "categoria": "Schiena",
        "gruppo_muscolare": ["dorsali", "romboidi"],
        "attrezzi": ["elastico", "porta"],
        "descrizione_tecnica": "Elastico fissato a una porta all'altezza del petto. Impugna le estremità e tira verso di te, stringendo le scapole. Torna lentamente.",
        "serie_default": 3,
        "ripetizioni_default": 12,
        "peso_default": 0,
        "livello": "Principiante",
        "elastico_colore": "rosso",
        "varianti": {
            "facile": "Elastico giallo",
            "medio": "Elastico rosso",
            "difficile": "Elastico blu o doppio"
        },
        "note_sicurezza": "Assicurati che l'elastico sia ben fissato"
    },
    {
        "exercise_id": "ex_superman",
        "nome": "Superman",
        "categoria": "Schiena",
        "gruppo_muscolare": ["lombari", "glutei"],
        "attrezzi": ["tappetino"],
        "descrizione_tecnica": "Sdraiato a pancia in giù, braccia distese in avanti. Solleva contemporaneamente braccia e gambe mantenendo la posizione 2-3 secondi.",
        "serie_default": 3,
        "ripetizioni_default": 10,
        "peso_default": 0,
        "livello": "Principiante",
        "varianti": {
            "facile": "Solo braccia o solo gambe",
            "medio": "Braccia e gambe insieme",
            "difficile": "Tenuta più lunga"
        },
        "note_sicurezza": "Non inarcare eccessivamente la schiena"
    },
    {
        "exercise_id": "ex_scapole_strette",
        "nome": "Strette Scapolari",
        "categoria": "Schiena",
        "gruppo_muscolare": ["romboidi", "trapezio"],
        "attrezzi": ["nessuno"],
        "descrizione_tecnica": "In piedi o seduto, stringi le scapole insieme come se volessi tenere una matita tra di esse. Mantieni 3-5 secondi, rilascia e ripeti.",
        "serie_default": 3,
        "ripetizioni_default": 15,
        "peso_default": 0,
        "livello": "Principiante",
        "varianti": {
            "facile": "Tenuta 2 sec",
            "medio": "Tenuta 5 sec",
            "difficile": "Con elastico leggero"
        },
        "note_sicurezza": "Non sollevare le spalle verso le orecchie"
    },

    # === CARDIO / MOBILITÀ ===
    {
        "exercise_id": "ex_marcia_posto",
        "nome": "Marcia sul Posto",
        "categoria": "Cardio",
        "gruppo_muscolare": ["cardio", "gambe"],
        "attrezzi": ["nessuno"],
        "descrizione_tecnica": "Solleva le ginocchia alternandole come se camminassi sul posto. Aumenta gradualmente la velocità. Usa le braccia in modo coordinato.",
        "serie_default": 1,
        "ripetizioni_default": 1,
        "tempo_secondi": 60,
        "peso_default": 0,
        "livello": "Principiante",
        "varianti": {
            "facile": "Lento, 30 secondi",
            "medio": "Moderato, 60 secondi",
            "difficile": "Veloce, 90 secondi"
        },
        "note_sicurezza": "Indossa scarpe comode"
    },
    {
        "exercise_id": "ex_jumping_jacks_soft",
        "nome": "Jumping Jacks Soft",
        "categoria": "Cardio",
        "gruppo_muscolare": ["cardio", "spalle"],
        "attrezzi": ["nessuno"],
        "descrizione_tecnica": "Versione soft: invece di saltare, allarga un piede alla volta mentre alzi le braccia lateralmente. Movimenti fluidi e controllati.",
        "serie_default": 3,
        "ripetizioni_default": 15,
        "peso_default": 0,
        "livello": "Principiante",
        "varianti": {
            "facile": "Movimento lento, un piede alla volta",
            "medio": "Movimento più fluido",
            "difficile": "Con piccolo salto"
        },
        "note_sicurezza": "Evita movimenti bruschi"
    }
]

# Mappatura colori elastici -> kg equivalenti
ELASTICI_KG_MAPPING = {
    "giallo": {"kg_equivalente": 1.5, "descrizione": "Leggero - Principianti"},
    "rosso": {"kg_equivalente": 3.0, "descrizione": "Medio - Intermedi"},
    "verde": {"kg_equivalente": 4.5, "descrizione": "Medio-Forte"},
    "blu": {"kg_equivalente": 6.0, "descrizione": "Forte - Avanzati"},
    "nero": {"kg_equivalente": 8.0, "descrizione": "Molto Forte - Esperti"}
}

# Funzione helper per ottenere esercizi per categoria
def get_exercises_by_category(categoria: str) -> list:
    return [ex for ex in ESERCIZI_DATABASE if ex.get("categoria") == categoria]

# Funzione helper per ottenere esercizi per gruppo muscolare
def get_exercises_by_muscle_group(gruppo: str) -> list:
    return [ex for ex in ESERCIZI_DATABASE 
            if gruppo in ex.get("gruppo_muscolare", [])]

# Categorie disponibili
CATEGORIE = ["Gambe", "Core", "Braccia", "Spalle", "Petto", "Schiena", "Cardio"]
