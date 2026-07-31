# Vault of Whispers

Un motore per storie interattive horror/psicologiche raccontate tramite un terminale che comunica per simboli cifrati. Ogni partita pesca (o fa scegliere) una storia dall'archivio, ricifra i simboli a ogni messaggio e tiene traccia di errori, difficoltà e finali scoperti.

An engine for interactive horror/psychological stories told through a terminal that communicates using encrypted symbols. Each playthrough either randomly selects (or lets the player choose) a story from the archive, re-encrypts the symbols for every message and keeps track of mistakes, difficulty settings, and discovered endings.


## Struttura del progetto - Project Structure

```
archivio-dei-sussurri/
├── index.html              gioco principale - main game
├── editor.html             editor/lettore di storie (strumento per gli autori) - story editor/viewer (tool for authors)
├── css/
│   ├── style.css           aspetto grafico (terminale, effetti, layout mobile) - visual style (terminal, effects, mobile layout)
│   └── editor.css          stili aggiuntivi solo per l'editor - additional styles used only by the editor
├── js/
│   ├── i18n.js             caricatore condiviso dei testi dell'interfaccia - shared UI text loader
│   ├── lang-it-fallback.js copia di riserva incorporata di lang/it.json - built-in fallback copy of lang/it.json
│   ├── symbol-sets.js      registro dei set di simboli (≥30 ciascuno) - registry of symbol sets (30+ symbols each)
│   ├── difficulties.js     registro dei livelli di difficoltà - registry of difficulty levels
│   ├── loader.js           carica manifest.json e le singole storie - loads manifest.json and individual stories
│   ├── game.js             motore di gioco - game engine
│   └── editor.js           logica dell'editor (form, validazione, anteprima) - editor logic (forms, validation, preview)
├── lang/
│   └── it.json             tutti i testi dell'interfaccia, pronti per un multilingue - all UI text, ready for localization
└── stories/
    ├── manifest.json       elenco delle storie disponibili - list of available stories
    └── ...
```


## Come avviarlo - Getting Started

I browser bloccano il caricamento di file JSON locali quando una pagina HTML viene aperta con un doppio clic (protocollo `file://`). Prima di aprire `index.html` (o `editor.html`), avvia un piccolo server locale nella cartella del progetto:

**Con Python (di solito già installato):**
```
cd vault-of-whispers
python3 -m http.server 8000
```
poi apri `http://localhost:8000` (o `http://localhost:8000/editor.html`) nel browser.

**Con Node.js:**
```
cd vault-of-whispers
npx serve
```
e apri l'indirizzo mostrato in console.

Se il progetto viene invece pubblicato su un vero hosting web (anche gratuito, es. GitHub Pages, Netlify), funziona senza alcun accorgimento. L'editor (`editor.html`), da solo, funziona anche a doppio clic: non scarica nulla in automatico, legge solo i file che gli dai tu.


Browsers block loading local JSON files when an HTML page is opened directly with a double-click (`file://` protocol). Before opening `index.html` (or `editor.html`), start a small local web server from the project's root folder.

**Using Python (usually already installed):**
```
cd vault-of-whispers
python3 -m http.server 8000
```
Then open `http://localhost:8000` (or `http://localhost:8000/editor.html`) in your browser.

**Using Node.js:**
```
cd vault-of-whispers
npx serve
```

Then open the address displayed in the terminal.

If the project is published on any standard web host (including free services such as GitHub Pages or Netlify), everything works without any additional setup.

The editor (`editor.html`) can also be opened directly with a double-click. It does not automatically download anything, it only reads the story files that you manually provide.

## Funzionalita' principali - Main Features

- **Cifrario a simboli**: ogni messaggio dell'entità usa un cifrario diverso, generato al momento; le lettere già decifrate restano visibili, le altre no.
- **Difficolta'** (schermata iniziale e fine partita): Baby (vocali già svelate), Normale, Serio, Demoniaco — cambiano quanti errori sono concessi per messaggio e in totale, in base al numero di tappe della storia.
- **Ramo aggressivo**: troppi errori sullo stesso messaggio fanno "impazzire" la conversazione, con un tono più ostile e finali esclusivi.
- **Codex dei finali**: accessibile sia dalla schermata iniziale (una volta scelta una storia) sia a fine partita, mostra quali finali hai già trovato per quella storia e quali restano ancora da svelare.
- **Salvataggio automatico**: la partita si salva da sola a ogni tentativo; alla riapertura della pagina puoi riprendere esattamente dal messaggio a metà, comprese le lettere già indovinate.
- **Menu di scelta storia**: elenco dal manifest, opzione "Casuale", e "Carica un file..." per giocare un file `.json` dal proprio dispositivo, anche non registrato nel manifest.
- **Editor integrato** (`editor.html`): crea o modifica storie con un'interfaccia guidata (impostazioni, nodi, convalida automatica dei riferimenti rotti/irraggiungibili, anteprima giocabile identica al motore reale).
- **Predisposto per il multilingue**: tutti i testi dell'interfaccia vivono in `lang/it.json`; aggiungere una lingua significa creare `lang/en.json` (stessa struttura) e aggiornare il percorso caricato in `game.js`/`editor.js`.

- **Symbol Cipher**: every message from the entity uses a newly generated substitution cipher. Letters that have already been deciphered remain visible, while the others stay hidden.
- **Difficulty Levels**: choose between Baby, Normal, Serious, and Demonic. Difficulty affects how many mistakes are allowed both per message and throughout the entire story, based on the number of story stages.
- **Corrupted Route**: making too many mistakes on the same message causes the conversation to spiral into a hostile version, unlocking exclusive endings.
- **Ending Codex**: available both from the main menu (after selecting a story) and after finishing a playthrough. It shows which endings have already been discovered for the selected story and which ones are still hidden.
- **Automatic Saving**: progress is automatically saved after every attempt. Reopening the page resumes exactly where you left off, including partially deciphered messages.
- **Story Selection Menu**: choose a story from the manifest, pick a random one, or load any `.json` story file directly from your device—even if it is not listed in the manifest.
- **Built-in Story Editor** (editor.html): create or edit stories through a guided interface featuring automatic validation (broken or unreachable references) and a playable preview that uses the exact same engine as the game.
- **Ready for Localization**: all interface text lives inside `lang/it.json`. Adding another language only requires creating a matching file (for example `lang/en.json`) with the same structure and updating the path loaded by `game.js` and `editor.js`.

## Aggiungere una nuova storia - Adding a New Story

1. Usa `editor.html` per crearla (consigliato: validazione e anteprima incluse), oppure scrivi a mano un nuovo file in `stories/`, seguendo la struttura degli altri (title, tagline, language, author, totalStages, startNode, corruptNode, symbolSet o symbols, nodes).
2. Aggiungi una riga in `stories/manifest.json`:
   ```json
   { 
        "file": "nuova-storia.json",
        "title": "Titolo Visualizzato",
        "tagline": "riga sotto il titolo",
        "language": "it",
        "author": "Il tuo nome"
    }
   ```
3. La storia entrerà automaticamente nella rotazione del menu (compresa l'opzione "Casuale").

1. Create it with `editor.html` (recommended, since it includes validation and a playable preview), or manually create a new JSON file inside the `stories/` folder following the structure of the existing ones (title, tagline, language, author, totalStages, startNode, corruptNode, symbolSet or symbols, nodes).
2. Add a new entry to `stories/manifest.json`:
   ```json
    {
        "file": "new-story.json",
        "title": "Displayed Title",
        "tagline": "Subtitle shown below the title",
        "language": "en",
        "author": "Your Name"
    }
    ```
3. The story will automatically appear in the selection menu, including the Random option.

## Dati salvati nel browser - Data Stored in the Browser

Il gioco usa `localStorage` del browser per due cose, entrambe legate al dispositivo/browser in uso (non c'è alcun server o account):

- `vaultOfWhispers.save` — l'unica partita in sospeso (si sovrascrive iniziandone una nuova).
- `vaultOfWhispers.codex` — i finali già scoperti, per storia.

Nessuno di questi dati lascia il dispositivo del giocatore.

.
The game uses the browser's `localStorage` for two things. Both are tied to the current browser and device only: there is no server or user account.

`vaultOfWhispers.save` — the current suspended playthrough (starting a new game replaces the previous save).
`vaultOfWhispers.codex` — the endings already discovered for each story.

None of this data ever leaves the player's device.