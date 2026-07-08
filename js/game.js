(function(){

  const LETTERS = ['A','B','C','D','E','F','G','H','I','L','M','N','O','P','Q','R','S','T','U','V','Z'];

  let MANIFEST = null;
  let STORY = null;
  let letterToSymbol = {};
  let symbolToLetter = {};
  let revealed = new Set();
  let currentText = '';
  let stability = 70;
  let mistakes = 0;
  let messageMistakes = 0;
  let currentNodeId = '';
  let activeSymbol = null;
  let depth = 0;

  const terminalEl = document.getElementById('terminal');
  const messageEl = document.getElementById('messageText');
  const decodeArea = document.getElementById('decodeArea');
  const choiceArea = document.getElementById('choiceArea');
  const stabilityFill = document.getElementById('stabilityFill');
  const sessionIdEl = document.getElementById('sessionId');
  const mistakeCounterEl = document.getElementById('mistakeCounter');
  const msgMistakeCounterEl = document.getElementById('messageMistakeCounter');
  const hintEl = document.getElementById('hint');
  const progressTrail = document.getElementById('progressTrail');
  const flashOverlay = document.getElementById('flashOverlay');
  const statusLabelEl = document.getElementById('statusLabel');
  const introModal = document.getElementById('introModal');
  const introStart = document.getElementById('introStart');
  const introStoryName = document.getElementById('introStoryName');
  const introError = document.getElementById('introError');
  const introMenu = document.getElementById('introMenu');

  function shuffle(arr){
    const a = arr.slice();
    for(let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }

  function pickVariant(node){
    if(node.variants) return node.variants[Math.floor(Math.random()*node.variants.length)];
    return node.text;
  }

  function initCipherForMessage(){
    const shuffled = shuffle(STORY.symbols);
    letterToSymbol = {};
    symbolToLetter = {};
    LETTERS.forEach((l,i)=>{
      letterToSymbol[l] = shuffled[i % shuffled.length];
      symbolToLetter[shuffled[i % shuffled.length]] = l;
    });
    revealed = new Set();
  }

  function resetGame(){
    stability = 70;
    mistakes = 0;
    messageMistakes = 0;
    currentNodeId = STORY.startNode || 'root';
    depth = 0;
    terminalEl.classList.remove('gameover','tier1','tier2','tier3','unstable','critical','aggressive');
    sessionIdEl.textContent = 'SIG. ' + String(Math.floor(Math.random()*900)+100);
    statusLabelEl.textContent = STORY.title + ' // ' + (STORY.tagline || 'segnale non autorizzato');
    updateStabilityUI();
    updateMistakeUI();
    updateMessageMistakeUI();
    renderNode();
  }

  function showGameUI(){
    messageEl.parentElement.style.display = 'flex';
    hintEl.style.display = 'block';
  }

  function updateStabilityUI(){
    stability = Math.max(0, Math.min(100, stability));
    stabilityFill.style.width = stability + '%';
    stabilityFill.classList.remove('mid','low');
    terminalEl.classList.remove('unstable','critical');
    if(stability <= 30){
      stabilityFill.classList.add('low');
      terminalEl.classList.add('critical');
    } else if(stability <= 60){
      stabilityFill.classList.add('mid');
      terminalEl.classList.add('unstable');
    }
  }

  function updateMistakeUI(){
    mistakeCounterEl.textContent = 'TOTALI: ' + mistakes + '/50';
    mistakeCounterEl.classList.remove('tier1','tier2','tier3');
    terminalEl.classList.remove('tier1','tier2','tier3');
    let tier = null;
    if(mistakes >= 40) tier = 'tier3';
    else if(mistakes >= 30) tier = 'tier2';
    else if(mistakes >= 20) tier = 'tier1';
    if(tier){
      mistakeCounterEl.classList.add(tier);
      terminalEl.classList.add(tier);
    }
  }

  function updateMessageMistakeUI(){
    msgMistakeCounterEl.textContent = 'MESSAGGIO: ' + messageMistakes + '/10';
    msgMistakeCounterEl.classList.remove('tier1','tier2','tier3');
    let tier = null;
    if(messageMistakes >= 8) tier = 'tier3';
    else if(messageMistakes >= 6) tier = 'tier2';
    else if(messageMistakes >= 4) tier = 'tier1';
    if(tier) msgMistakeCounterEl.classList.add(tier);
  }

  function messageLettersOf(text){
    return text.split('').filter(ch => LETTERS.includes(ch));
  }

  function isFullyDecoded(text){
    return messageLettersOf(text).every(ch => revealed.has(ch));
  }

  function renderMessage(text){
    messageEl.innerHTML = '';
    text.split('').forEach(ch=>{
      const span = document.createElement('span');
      if(LETTERS.includes(ch)){
        if(revealed.has(ch)){
          span.textContent = ch;
          span.className = 'letter-solved';
        } else {
          span.textContent = letterToSymbol[ch];
          span.className = 'glyph';
        }
      } else {
        span.textContent = ch;
      }
      messageEl.appendChild(span);
    });
    if(!isFullyDecoded(text)){
      const cursor = document.createElement('span');
      cursor.className = 'cursor-blink';
      cursor.textContent = '█';
      messageEl.appendChild(cursor);
    }
  }

  function renderDecodePanel(text){
    decodeArea.innerHTML = '';
    activeSymbol = null;

    if(isFullyDecoded(text)) return;

    const panel = document.createElement('div');
    panel.className = 'decode-panel';

    const label = document.createElement('div');
    label.className = 'decode-label';
    label.textContent = 'Simboli non decifrati — cifrario valido solo per questo messaggio';
    panel.appendChild(label);

    const chipRow = document.createElement('div');
    chipRow.className = 'chip-row';

    const uniqueSymbols = [...new Set(
      messageLettersOf(text).filter(ch=>!revealed.has(ch)).map(ch=>letterToSymbol[ch])
    )];

    const letterRowContainer = document.createElement('div');

    uniqueSymbols.forEach(sym=>{
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.textContent = sym;
      chip.addEventListener('click', ()=>{
        activeSymbol = sym;
        chipRow.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
        chip.classList.add('active');
        renderLetterRow(letterRowContainer, sym, text);
      });
      chipRow.appendChild(chip);
    });

    panel.appendChild(chipRow);
    panel.appendChild(letterRowContainer);
    decodeArea.appendChild(panel);
  }

  function triggerFlash(){
    flashOverlay.classList.remove('hit');
    void flashOverlay.offsetWidth;
    flashOverlay.classList.add('hit');
  }

  function triggerRewrite(){
    messageMistakes = 0;
    updateMessageMistakeUI();
    decodeArea.innerHTML = '';
    const notice = document.createElement('div');
    notice.className = 'rewrite-notice';
    notice.textContent = "IL MESSAGGIO SI DISSOLVE... QUALCOSA DI TERRIBILE STA SCRIVENDO...";
    decodeArea.appendChild(notice);
    messageEl.classList.add('rewriting');

    let ticks = 0;
    const scrambleInterval = setInterval(()=>{
      messageEl.querySelectorAll('span').forEach(span=>{
        if(span.classList.contains('glyph') || span.classList.contains('letter-solved') || span.classList.contains('scrambling')){
          span.textContent = STORY.symbols[Math.floor(Math.random()*STORY.symbols.length)];
          span.className = 'glyph scrambling';
        }
      });
      ticks++;
      if(ticks >= 8){
        clearInterval(scrambleInterval);
        messageEl.classList.remove('rewriting');
        currentNodeId = STORY.corruptNode;
        renderNode();
      }
    }, 90);
  }

  function renderLetterRow(container, symbol, text){
    container.innerHTML = '';
    const row = document.createElement('div');
    row.className = 'letter-row';

    LETTERS.forEach(letter=>{
      const btn = document.createElement('button');
      btn.className = 'letter-btn';
      btn.textContent = letter;
      if(revealed.has(letter)) btn.disabled = true;
      btn.addEventListener('click', ()=>{
        if(symbolToLetter[symbol] === letter){
          revealed.add(letter);
          renderMessage(text);
          if(isFullyDecoded(text)){
            decodeArea.innerHTML = '';
            hintEl.style.display = 'none';
            setTimeout(()=>renderChoices(), 400);
          } else {
            renderDecodePanel(text);
          }
        } else {
          mistakes += 1;
          messageMistakes += 1;
          stability -= 1;
          updateMistakeUI();
          updateMessageMistakeUI();
          updateStabilityUI();
          triggerFlash();
          btn.classList.add('wrong');
          const chipEls = container.parentElement.querySelectorAll('.chip.active');
          chipEls.forEach(c=>c.classList.add('wrong'));
          setTimeout(()=>{
            btn.classList.remove('wrong');
            chipEls.forEach(c=>c.classList.remove('wrong'));
          }, 300);

          if(mistakes >= 50){
            setTimeout(()=>{ renderGameOver(); }, 300);
            return;
          }
          if(messageMistakes >= 10){
            setTimeout(()=>{ triggerRewrite(); }, 300);
            return;
          }
        }
      });
      row.appendChild(btn);
    });
    container.appendChild(row);
  }

  function renderChoices(){
    const node = STORY.nodes[currentNodeId];
    choiceArea.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'choices';

    node.choices.forEach((choice)=>{
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.innerHTML = '<span class="tag">></span>' + choice.label;
      btn.addEventListener('click', ()=>{
        stability += choice.delta;
        updateStabilityUI();
        currentNodeId = choice.next;
        depth += 1;
        renderNode();
      });
      wrap.appendChild(btn);
    });
    choiceArea.appendChild(wrap);
  }

  function mistakeFlavor(){
    if(mistakes === 0) return "Non hai sbagliato nemmeno un simbolo. Forse ricordi tutto fin troppo bene.";
    if(mistakes <= 5) return "Frammenti persi: " + mistakes + ". Piccole crepe, ma le crepe in questa storia crescono sempre.";
    if(mistakes <= 19) return "Frammenti persi: " + mistakes + ". Qualcosa, dentro di te, si è arreso molto prima della fine.";
    if(mistakes <= 39) return "Frammenti persi: " + mistakes + ". Non sei più del tutto sicuro di quale versione di te abbia risposto per ultima.";
    return "Frammenti persi: " + mistakes + ". Sei arrivato alla fine per il rotto della cuffia e qualcosa dentro di te lo sa.";
  }

  // --- Menu di scelta storia (usato sia nella schermata iniziale sia a fine partita) ---

  function buildStoryMenu(container, onStoryReady){
    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'story-menu';

    function disableAll(){
      wrap.querySelectorAll('.story-menu-btn').forEach(b=> b.disabled = true);
    }

    function selectFile(file, btnEl, labelWhileLoading){
      disableAll();
      btnEl.classList.add('selected');
      btnEl.querySelector('.story-menu-title').textContent = labelWhileLoading;
      loadStoryFile(file).then(story=>{
        STORY = story;
        onStoryReady(story);
      }).catch(err=>{
        showLoadError(err, 'story');
        wrap.querySelectorAll('.story-menu-btn').forEach(b=> b.disabled = false);
        btnEl.classList.remove('selected');
      });
    }

    MANIFEST.stories.forEach(entry=>{
      const btn = document.createElement('button');
      btn.className = 'story-menu-btn';
      btn.innerHTML =
        '<span class="story-menu-title">' + entry.title + '</span>' +
        (entry.tagline ? '<span class="story-menu-tagline">' + entry.tagline + '</span>' : '');
      btn.addEventListener('click', ()=> selectFile(entry.file, btn, 'Loading...'));
      wrap.appendChild(btn);
    });

    const randomBtn = document.createElement('button');
    randomBtn.className = 'story-menu-btn story-menu-random';
    randomBtn.innerHTML =
      '<span class="story-menu-title">🎲 Casuale</span>' +
      '<span class="story-menu-tagline">lascia che sia l\'archivio a scegliere per te</span>';
    randomBtn.addEventListener('click', ()=>{
      const pick = MANIFEST.stories[Math.floor(Math.random()*MANIFEST.stories.length)];
      selectFile(pick.file, randomBtn, 'Loading...');
    });
    wrap.appendChild(randomBtn);

    container.appendChild(wrap);
  }

  function showLoadError(err, kind){
    const msg = kind === 'manifest'
      ? "Impossibile caricare l'elenco delle storie (" + err.message + ")."
      : "Impossibile caricare la storia scelta (" + err.message + ").";
    const extra = " Se hai aperto questo file direttamente nel browser (doppio clic), le regole di sicurezza bloccano il caricamento locale dei file JSON. Avvia un piccolo server locale nella cartella del progetto (per esempio 'python3 -m http.server' oppure 'npx serve') e riapri la pagina da http://localhost.";
    introError.textContent = msg + extra;
  }

  // --- Schermata introduttiva ---

  function initIntroMenu(){
    loadManifest().then(manifest=>{
      MANIFEST = manifest;
      buildStoryMenu(introMenu, (story)=>{
        introStoryName.textContent = 'Stanotte: ' + story.title;
        document.title = 'The Vault of Whispers — ' + story.title;
        introStart.disabled = false;
        introStart.textContent = 'Start';
        resetGame();
      });
    }).catch(err=>{
      showLoadError(err, 'manifest');
    });
  }

  introStart.addEventListener('click', ()=>{
    if(!STORY) return;
    introModal.style.display = 'none';
  });

  // --- Fine partita: stesso menu per scegliere cosa fare dopo ---

  function renderEndMenu(container){
    const label = document.createElement('div');
    label.className = 'ending-menu-label';
    label.textContent = 'Cosa vuoi fare adesso?';
    container.appendChild(label);

    const menuHost = document.createElement('div');
    container.appendChild(menuHost);

    buildStoryMenu(menuHost, ()=>{
      showGameUI();
      resetGame();
    });
  }

  function renderEnding(){
    const node = STORY.nodes[currentNodeId];
    messageEl.parentElement.style.display = 'none';
    decodeArea.innerHTML = '';
    hintEl.style.display = 'none';
    progressTrail.textContent = '';

    choiceArea.innerHTML = '';
    const title = document.createElement('div');
    title.className = 'ending-title';
    title.textContent = 'FINE // ' + node.title;

    const text = document.createElement('div');
    text.className = 'ending-text';
    text.textContent = node.text;

    const stat = document.createElement('div');
    stat.className = 'ending-stat';
    stat.textContent = mistakeFlavor();

    choiceArea.appendChild(title);
    choiceArea.appendChild(text);
    choiceArea.appendChild(stat);
    renderEndMenu(choiceArea);
  }

  function renderGameOver(){
    messageEl.parentElement.style.display = 'none';
    decodeArea.innerHTML = '';
    hintEl.style.display = 'none';
    progressTrail.textContent = '';
    terminalEl.classList.add('gameover');

    choiceArea.innerHTML = '';
    const title = document.createElement('div');
    title.className = 'ending-title gameover-title';
    title.textContent = 'SEGNALE PERSO // TI HA RISCRITTO';

    const text = document.createElement('div');
    text.className = 'ending-text';
    text.textContent = "Hai sbagliato troppe volte e ogni errore era un'altra crepa che qualcosa ha usato per inserirsi più a fondo. Il terminale smette di fare domande, perché non ne ha più bisogno: la voce che risponde adesso, correggendo ogni tuo errore uno per uno, non è più la tua. Lo schermo resta acceso, in attesa del prossimo che si siederà.";

    const stat = document.createElement('div');
    stat.className = 'ending-stat';
    stat.textContent = "Frammenti persi: " + mistakes + " su 50. Il segnale non ti arriva più.";

    choiceArea.appendChild(title);
    choiceArea.appendChild(text);
    choiceArea.appendChild(stat);
    renderEndMenu(choiceArea);
  }

  function renderNode(){
    const node = STORY.nodes[currentNodeId];
    choiceArea.innerHTML = '';
    messageMistakes = 0;
    updateMessageMistakeUI();

    if(node.isEnding){
      terminalEl.classList.remove('aggressive');
      renderEnding();
      return;
    }

    terminalEl.classList.toggle('aggressive', !!node.aggressive);
    const totalStages = STORY.totalStages || 8;
    progressTrail.textContent = node.progressLabel ? node.progressLabel : ('Intrusione ' + (depth+1) + ' di ' + totalStages);
    currentText = pickVariant(node);
    initCipherForMessage();
    renderMessage(currentText);
    hintEl.style.display = 'block';
    renderDecodePanel(currentText);
  }

  initIntroMenu();

})();
