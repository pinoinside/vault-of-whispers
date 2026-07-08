# Archivio dei Sussurri

Un motore per storie interattive horror/psicologiche raccontate tramite un terminale che comunica per simboli cifrati. Ogni partita pesca a caso una storia dal manifest e ne rimescola i cifrari a ogni messaggio.

## Struttura del progetto

```
archivio-dei-sussurri/
├── index.html          struttura della pagina
├── css/
│   └── style.css       aspetto grafico (terminale, effetti, layout mobile)
├── js/
│   ├── loader.js       carica manifest.json e sceglie una storia a caso
│   └── game.js         motore di gioco (cifrario, decodifica, finali)
└── stories/
    ├── manifest.json   elenco delle storie disponibili
    ├── inquilino.json  storia "L'Inquilino" (8 tappe)
    └── il-faro.json    storia "Il Faro" (3 tappe)
```

## Come avviarlo

I browser bloccano il caricamento di file JSON locali quando una pagina HTML viene aperta con un doppio clic (protocollo `file://`). Per questo motivo, prima di aprire `index.html`, avvia un piccolo server locale nella cartella del progetto:

**Con Python (di solito già installato):**
```
cd archivio-dei-sussurri
python3 -m http.server 8000
```
poi apri `http://localhost:8000` nel browser.

**Con Node.js:**
```
cd archivio-dei-sussurri
npx serve
```
e apri l'indirizzo che viene mostrato in console.

Se il file viene invece caricato tramite un vero hosting web (anche gratuito, es. GitHub Pages, Netlify), funziona senza alcun accorgimento.

## Aggiungere una nuova storia

1. Crea un nuovo file in `stories/`, ad esempio `stories/nuova-storia.json`, seguendo la struttura degli altri due file (title, tagline, totalStages, startNode, corruptNode, symbols, nodes).
2. Aggiungi una riga in `stories/manifest.json`:
   ```json
   { "file": "nuova-storia.json" }
   ```
3. La storia entrera' automaticamente nella rotazione casuale.
