// Copia di riserva del file lang/it.json, usata quando fetch() non e' disponibile
// (es. pagina aperta con doppio clic, senza un server locale).
window.LANG_IT_FALLBACK = {
    "common": {
    "pageTitleGame": "Vault of Whispers",
    "pageTitleWithStory": "Vault of Whispers — {title}",
    "statusLabelFallback": "VAULT OF WHISPERS",
    "sessionIdFallback": "SIG. 000",
    "appTitle": "Vault of Whispers"
  },
  "intro": {
    "storyPrompt": "Scegli quale storia seguire stanotte.",
    "storyChosen": "Stanotte: {title}",
    "howItWorksSummary": "Come funziona",
    "explanationHtml": [
      "Un'entità ha iniziato a comunicare con te. I suoi messaggi arrivano <strong>cifrati</strong>: ogni simbolo corrisponde sempre alla stessa lettera, ma solo <strong>all'interno del messaggio che stai leggendo</strong>: il cifrario cambia a ogni nuovo messaggio.",
      "Tocca un simbolo, poi una lettera, per tentare di decifrarlo. Il messaggio si riscrive man mano che indovini.",
      "Ogni errore viene contato, sia nel messaggio corrente che nel totale della partita, sempre visibile in alto a destra. Dopo <strong>10 errori sullo stesso messaggio</strong> qualcosa di più ostile prende il controllo della conversazione. Dopo <span class=\"warn\">50 errori totali</span>, la partita è persa."
    ],
    "startBtnIdle": "Scegli una storia",
    "startBtnLoading": "Caricamento...",
    "startBtnReady": "Comincia",
    "cancelBtn": "Annulla",
    "credits": [
      "&copy 2026 - Pino Inside",
      "Storie: Andrea Pinucci",
      ""
    ]
  },
  "storyMenu": {
    "randomTitle": "🎲 Casuale",
    "randomTagline": "lascia che sia l'archivio a scegliere per te",
    "loadTitle": "📂 Carica un file...",
    "loadTagline": "gioca una storia dal tuo dispositivo",
    "loadingLabel": "Caricamento...",
    "endMenuLabel": "Cosa vuoi fare adesso?"
  },
  "errors": {
    "manifestPrefix": "Impossibile caricare l'elenco delle storie ({message}).",
    "storyPrefix": "Impossibile caricare la storia scelta ({message}).",
    "serverHint": " Se hai aperto questo file direttamente nel browser (doppio clic), le regole di sicurezza bloccano il caricamento locale dei file JSON. Avvia un piccolo server locale nella cartella del progetto (per esempio 'python3 -m http.server' oppure 'npx serve') e riapri la pagina da http://localhost.",
    "invalidJson": "il file non e' un JSON valido",
    "invalidStructure": "il file non ha la struttura attesa di una storia",
    "readFailed": "lettura del file fallita"
  },
  "game": {
    "decodeLabel": "Simboli non decifrati — cifrario valido solo per questo sussurro",
    "rewriteNotice": "IL MESSAGGIO SI DISSOLVE... QUALCOSA DI PIU' OSTILE STA SCRIVENDO...",
    "progressLabel": "Intrusione {n} di {total}",
    "choiceTag": "›",
    "hint": "Ogni simbolo nasconde una lettera. Il cifrario muta a ogni sussurro: non fidarti di ciò che credi di aver già imparato.",
    "totalMistakes": "TOTALI: {count}/50",
    "messageMistakes": "MESSAGGIO: {count}/10"
  },
  "ending": {
    "titlePrefix": "FINE // {title}",
    "restartBtn": "Riavvia il segnale",
    "flavorZero": "Non hai sbagliato nemmeno un simbolo. Forse ricordi tutto fin troppo bene.",
    "flavorLow": "Frammenti persi: {count}. Piccole crepe, ma le crepe in questa storia crescono sempre.",
    "flavorMid": "Frammenti persi: {count}. Qualcosa, dentro di te, si è arreso molto prima della fine.",
    "flavorHigh": "Frammenti persi: {count}. Non sei più del tutto sicuro di quale versione di te abbia risposto per ultima.",
    "flavorExtreme": "Frammenti persi: {count}. Sei arrivato alla fine per il rotto della cuffia e qualcosa dentro di te lo sa.",
    "gameOverTitle": "SEGNALE PERSO // TI HA RISCRITTO",
    "gameOverText": "Hai sbagliato troppe volte e ogni errore era un'altra crepa che qualcosa ha usato per infilarsi più a fondo. Il terminale smette di fare domande, perché non ne ha più bisogno: la voce che risponde adesso, correggendo ogni tuo errore uno per uno, non è più la tua. Lo schermo resta acceso, in attesa del prossimo che si siederà qui a decifrarlo.",
    "gameOverStat": "Frammenti persi: {count} su 50. Il segnale non ti appartiene più."
  },
  "editor": {
    "pageTitle": "Editor Storie — Vault of Whispers",
    "title": "Editor Storie",
    "subtitle": "Vault of Whispers — leggi, modifica, crea file .json compatibili col motore di gioco",
    "toolbar": {
      "newStory": "Nuova storia vuota",
      "loadStory": "Carica JSON esistente",
      "validate": "Convalida",
      "export": "Scarica JSON",
      "preview": "▶ Prova la storia"
    },
    "tabs": {
      "settings": "Impostazioni",
      "nodes": "Nodi",
      "validation": "Convalida",
      "guide": "Guida rapida"
    },
    "settings": {
      "titleLabel": "Titolo della storia",
      "titlePlaceholder": "es. L'INQUILINO",
      "taglineLabel": "Tagline",
      "taglinePlaceholder": "riga d'atmosfera sotto il titolo",
      "stagesLabel": "Tappe totali (totalStages)",
      "startNodeLabel": "Nodo iniziale (startNode)",
      "corruptNodeLabel": "Nodo del ramo aggressivo (corruptNode)",
      "corruptNodeHint": "Attivato dopo 10 errori sullo stesso messaggio. Deve esistere ed essere un nodo di storia, non un finale.",
      "symbolsLabel": "Simboli del cifrario",
      "symbolsPlaceholder": "incolla o scrivi i simboli separati da spazio o virgola",
      "defaultSymbolsBtn": "Usa set predefinito (30 simboli distinguibili)",
      "symbolsCount": "{count} simboli ({required} lettere richieste come minimo)",
      "noneOption": "— nessuno —"
    },
    "nodes": {
      "emptyState": "Seleziona un nodo dalla lista, oppure creane uno nuovo.",
      "groupStory": "Nodi di storia",
      "groupEndings": "Finali",
      "addNode": "+ Nuovo nodo",
      "badgeStart": "start",
      "badgeCorrupt": "corrupt",
      "badgeAggressive": "aggr",
      "unreachableTitle": "Nodo irraggiungibile da startNode/corruptNode",
      "rename": "Rinomina",
      "delete": "Elimina nodo",
      "isEndingLabel": "Questo e' un nodo finale (mostra testo in chiaro e termina la partita)",
      "endingTitleLabel": "Titolo del finale",
      "endingTextLabel": "Testo del finale (in chiaro, nessuna restrizione di lettere)",
      "aggressiveLabel": "Nodo aggressivo (usato tipicamente per corruptNode: tono visivo piu' ostile)",
      "progressLabelLabel": "Etichetta di avanzamento personalizzata (progressLabel, opzionale)",
      "progressLabelPlaceholder": "es. INTERFERENZA CRITICA — ...",
      "variantsLabel": "Varianti del messaggio (in MAIUSCOLO)",
      "addVariant": "+ variante",
      "removeVariant": "Rimuovi variante",
      "choicesLabel": "Scelte del giocatore",
      "addChoice": "+ scelta",
      "choiceLabelPlaceholder": "testo del pulsante",
      "removeChoice": "Rimuovi",
      "choiceDeltaTitle": "delta stabilita'",
      "defaultNewEndingTitle": "NUOVO FINALE",
      "defaultNewEndingText": "Testo del finale.",
      "defaultVariant1": "PRIMA VARIANTE.",
      "defaultVariant2": "SECONDA VARIANTE.",
      "defaultVariant3": "TERZA VARIANTE.",
      "defaultChoiceLabel": "Scelta {n}"
    },
    "guide": {
      "h1": "Struttura di un nodo di storia",
      "p1": "Un nodo di storia ha <code>variants</code> (3 frasi equivalenti, in MAIUSCOLO, che il motore sceglie a caso) e <code>choices</code> (3 risposte, ognuna con un'etichetta, il nodo successivo e un valore <code>delta</code> che sposta la \"stabilita'\" verso il calmo o l'ostile).",
      "h2": "Struttura di un nodo finale",
      "p2": "Un nodo finale ha <code>title</code> e <code>text</code>, mostrati in chiaro (mai cifrati) quando la partita finisce li'.",
      "h3": "Il cifrario",
      "p3": "Il motore cifra le 26 lettere A-Z (le lettere accentate passano in chiaro). Serve almeno un simbolo per lettera: usa il pulsante \"set predefinito\" se non hai preferenze particolari.",
      "h4": "Il ramo aggressivo",
      "p4": "Se il giocatore sbaglia 10 volte lo stesso messaggio, viene reindirizzato al nodo <code>corruptNode</code>, di solito con toni piu' ostili, che porta a 2-3 finali esclusivi di quel ramo.",
      "h5": "Convalida",
      "p5": "Usa il pulsante \"Convalida\" per controllare riferimenti rotti, nodi irraggiungibili e altri problemi comuni prima di esportare.",
      "p6": "Per una guida completa con esempi, vedi il file <code>GUIDA-CREAZIONE-STORIE.md</code> incluso nel progetto."
    },
    "preview": {
      "nodeLabel": "nodo corrente: {id}",
      "nodeLabelEmpty": "nodo corrente: —",
      "close": "Chiudi anteprima",
      "statusLabel": "ANTEPRIMA",
      "hint": "Anteprima dal vivo: gioca la storia esattamente come farebbe chi la scarica.",
      "brokenRef": "Riferimento rotto: il nodo \"{id}\" non esiste.",
      "restart": "Riavvia anteprima",
      "missingEndingText": "(testo del finale mancante)",
      "emptyChoiceLabel": "(scelta senza testo)",
      "gameOverTitle": "SEGNALE PERSO (anteprima: 50 errori totali)"
    },
    "confirm": {
      "newStory": "Creare una nuova storia vuota? Il lavoro non salvato andra' perso.",
      "isEnding": "E' un nodo finale?\nOK = finale · Annulla = nodo di storia",
      "deleteNode": "Eliminare il nodo \"{id}\"? Le scelte che puntano qui resteranno rotte finche' non le correggi.",
      "exportWithErrors": "La convalida ha trovato errori bloccanti. Esportare comunque il JSON?"
    },
    "prompt": {
      "newNodeId": "ID del nuovo nodo (senza spazi, es. P1):",
      "renameNode": "Nuovo ID per il nodo:"
    },
    "alert": {
      "badNodeId": "ID mancante o gia' esistente.",
      "duplicateId": "Esiste gia' un nodo con questo ID.",
      "readError": "Impossibile leggere il file: {message}",
      "needStartNode": "Imposta un startNode valido prima di avviare l'anteprima."
    },
    "validation": {
      "missingTitle": "Manca il titolo della storia.",
      "notEnoughSymbols": "Servono almeno {required} simboli diversi (attuali: {count}).",
      "duplicateSymbols": "Ci sono simboli duplicati nella lista.",
      "badStartNode": "startNode non e' impostato o non esiste tra i nodi.",
      "corruptNodeMissing": "corruptNode punta a un nodo inesistente (\"{id}\").",
      "corruptNodeIsEnding": "corruptNode punta a un finale: deve essere un nodo di storia giocabile.",
      "noCorruptNode": "Nessun corruptNode impostato: il ramo per troppi errori sullo stesso messaggio non e' configurato.",
      "endingNoTitle": "Il finale \"{id}\" non ha un titolo.",
      "endingNoText": "Il finale \"{id}\" non ha testo.",
      "nodeNoVariants": "Il nodo \"{id}\" non ha varianti di testo.",
      "variantCountWarn": "Il nodo \"{id}\" ha {count} variante/i invece di 3 (funziona comunque).",
      "emptyVariant": "Il nodo \"{id}\" ha la variante #{index} vuota.",
      "noChoices": "Il nodo \"{id}\" non ha scelte: e' un vicolo cieco.",
      "choiceCountWarn": "Il nodo \"{id}\" ha {count} scelta/e invece di 3 (funziona comunque).",
      "emptyChoiceLabel": "Il nodo \"{id}\", scelta #{index}, non ha testo sul pulsante.",
      "choiceNoTarget": "Il nodo \"{id}\", scelta #{index}, non punta a nessun nodo.",
      "choiceBadTarget": "Il nodo \"{id}\", scelta #{index}, punta a un nodo inesistente (\"{target}\").",
      "unreachable": "Il nodo \"{id}\" non e' raggiungibile ne' da startNode ne' da corruptNode.",
      "deadEnd": "Il nodo \"{id}\" e' raggiungibile ma nessuna delle sue scelte porta mai a un finale (vicolo cieco o ciclo chiuso).",
      "allOk": "Nessun problema rilevato. La storia sembra pronta."
    }
  }
};
