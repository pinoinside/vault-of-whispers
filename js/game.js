(function(){

  const LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
  const VOWELS = ['A','E','I','O','U'];

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
  let currentDifficulty = 'normale';
  let maxTotalMistakes = 50;
  let maxMessageMistakes = 10;
  let vowelHelpActive = false;
  let currentStoryKey = '';

  const CODEX_STORAGE_KEY = 'vaultOfWhispers.codex';
  const SAVE_STORAGE_KEY = 'vaultOfWhispers.save';

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
  const introCancel = document.getElementById('introCancel');
  const introStoryName = document.getElementById('introStoryName');
  const introError = document.getElementById('introError');
  const introMenu = document.getElementById('introMenu');
  const storyFileInput = document.getElementById('storyFileInput');
  const introTitleEl = document.getElementById('introTitle');
  const introSummaryEl = document.getElementById('introSummary');
  const introExplanationEl = document.getElementById('introExplanation');
  const introCreditsBoxEl = document.getElementById('introCreditsBox');
  const resumeBanner = document.getElementById('resumeBanner');
  const resumeBannerText = document.getElementById('resumeBannerText');
  const btnResumeGame = document.getElementById('btnResumeGame');
  const btnDeleteSave = document.getElementById('btnDeleteSave');
  const btnOpenCodexIntro = document.getElementById('btnOpenCodexIntro');
  const codexModal = document.getElementById('codexModal');
  const codexTitleEl = document.getElementById('codexTitle');
  const codexProgressEl = document.getElementById('codexProgress');
  const codexListEl = document.getElementById('codexList');
  const btnCloseCodex = document.getElementById('btnCloseCodex');

  function t(key, vars){ return window.I18N ? window.I18N.get(key, vars) : key; }

  function applyStaticText(){
    document.title = t('common.pageTitleGame');
    introTitleEl.textContent = t('common.appTitle');
    introSummaryEl.textContent = t('intro.howItWorksSummary');
    introExplanationEl.innerHTML = window.I18N.getArray('intro.explanationHtml').map(p => '<p>' + p + '</p>').join('');
    const credits = window.I18N.getArray('intro.credits');
    if(credits.length){
      introCreditsBoxEl.innerHTML = credits.map(line => '<div>' + line + '</div>').join('');
    }
    hintEl.textContent = t('game.hint');
    statusLabelEl.textContent = t('common.statusLabelFallback');
    sessionIdEl.textContent = t('common.sessionIdFallback');
    btnOpenCodexIntro.textContent = t('codex.buttonLabel');
    btnResumeGame.textContent = t('resume.resumeBtn');
    btnDeleteSave.textContent = t('resume.deleteBtn');
    renderDifficultyPicker(document.getElementById('difficultyPickerIntro'));
  }

  // Selettore di difficolta' riutilizzabile: usato sia nella schermata
  // iniziale sia nella schermata di fine partita (per la storia successiva).
  function renderDifficultyPicker(container){
    if(!container) return;
    container.innerHTML = '';
    const order = window.DIFFICULTY_ORDER || Object.keys(window.DIFFICULTIES || {normale:true});

    const wrap = document.createElement('div');
    wrap.className = 'difficulty-picker';

    const label = document.createElement('div');
    label.className = 'difficulty-label';
    label.textContent = t('difficulty.label');
    wrap.appendChild(label);

    const optionsRow = document.createElement('div');
    optionsRow.className = 'difficulty-options';
    order.forEach(key=>{
      const btn = document.createElement('button');
      btn.className = 'difficulty-btn' + (key === currentDifficulty ? ' active' : '');
      btn.textContent = t('difficulty.' + key);
      btn.title = t('difficulty.' + key + 'Hint');
      btn.addEventListener('click', ()=>{
        currentDifficulty = key;
        optionsRow.querySelectorAll('.difficulty-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
      });
      optionsRow.appendChild(btn);
    });
    wrap.appendChild(optionsRow);
    container.appendChild(wrap);
  }

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

  // Simboli di riserva usati solo se il registro js/symbol-sets.js
  // non fosse disponibile per qualche motivo (rete di sicurezza).
  const FALLBACK_SYMBOLS = ["☠","☣","☢","☯","⚛","⚗","⚜","⚓","⚔","⚖","⚙","⚠","☮","☤","⚕","⚰","⚱","⛧","⚹","⚥","☍","☄","☾","☉","⛓","⛏","⚒","⚑","⚘","☊"];

  // Decide quali simboli e quale font usare per una storia:
  // 1) se la storia ha un array "symbols" esplicito, ha sempre la precedenza (compatibilita').
  // 2) altrimenti si usa il set indicato in "symbolSet", se esiste nel registro.
  // 3) altrimenti si usa il set marcato come predefinito nel registro.
  // 4) in mancanza di tutto, usa un set di riserva incorporato qui.
  function resolveSymbolSet(story){
    if(story.symbols && story.symbols.length){
      return { symbols: story.symbols, fontFamily: "'Noto Sans Symbols', sans-serif" };
    }
    const sets = window.SYMBOL_SETS || {};
    const names = Object.keys(sets);
    let chosen = (story.symbolSet && sets[story.symbolSet]) || null;
    if(!chosen){
      chosen = names.map(k=>sets[k]).find(s=>s.default) || sets[names[0]];
    }
    if(!chosen) return { symbols: FALLBACK_SYMBOLS, fontFamily: "'Noto Sans Symbols', sans-serif" };
    return { symbols: chosen.symbols, fontFamily: chosen.fontFamily || "'Noto Sans Symbols', sans-serif" };
  }

  function applySymbolSet(story){
    const resolved = resolveSymbolSet(story);
    story.symbols = resolved.symbols;
    document.documentElement.style.setProperty('--glyph-font', resolved.fontFamily);
  }

  function applyDifficulty(story){
    const n = story.totalStages || 5;
    const registry = window.DIFFICULTIES || {};
    const diff = registry[currentDifficulty] || registry.normale || { maxPerMessage: 10, vowelHelp: false, totalFormula: n2 => n2 * 5 };
    maxMessageMistakes = diff.maxPerMessage;
    maxTotalMistakes = Math.max(1, diff.totalFormula(n));
    vowelHelpActive = diff.vowelHelp;
  }

  function resetGame(){
    applySymbolSet(STORY);
    applyDifficulty(STORY);
    stability = 70;
    mistakes = 0;
    messageMistakes = 0;
    currentNodeId = STORY.startNode || 'root';
    depth = 0;
    terminalEl.classList.remove('gameover','tier1','tier2','tier3','unstable','critical','aggressive');
    sessionIdEl.textContent = t('common.sessionIdFallback').replace(/\d+$/, '') + String(Math.floor(Math.random()*900)+100);
    statusLabelEl.textContent = STORY.title + ' // ' + (STORY.tagline || t('common.statusLabelFallback'));
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
    mistakeCounterEl.textContent = t('game.totalMistakes', {count: mistakes, max: maxTotalMistakes});
    mistakeCounterEl.classList.remove('tier1','tier2','tier3');
    terminalEl.classList.remove('tier1','tier2','tier3');
    let tier = null;
    if(mistakes >= maxTotalMistakes * 0.8) tier = 'tier3';
    else if(mistakes >= maxTotalMistakes * 0.6) tier = 'tier2';
    else if(mistakes >= maxTotalMistakes * 0.4) tier = 'tier1';
    if(tier){
      mistakeCounterEl.classList.add(tier);
      terminalEl.classList.add(tier);
    }
  }

  function updateMessageMistakeUI(){
    msgMistakeCounterEl.textContent = t('game.messageMistakes', {count: messageMistakes, max: maxMessageMistakes});
    msgMistakeCounterEl.classList.remove('tier1','tier2','tier3');
    let tier = null;
    if(messageMistakes >= maxMessageMistakes * 0.8) tier = 'tier3';
    else if(messageMistakes >= maxMessageMistakes * 0.6) tier = 'tier2';
    else if(messageMistakes >= maxMessageMistakes * 0.4) tier = 'tier1';
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
          span.dataset.symbol = letterToSymbol[ch];
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

  function highlightSymbolOccurrences(symbol){
    messageEl.querySelectorAll('.glyph').forEach(span=>{
      span.classList.toggle('symbol-highlight', symbol !== null && span.dataset.symbol === symbol);
    });
  }

  function renderDecodePanel(text){
    decodeArea.innerHTML = '';
    activeSymbol = null;
    highlightSymbolOccurrences(null);

    if(isFullyDecoded(text)) return;

    const panel = document.createElement('div');
    panel.className = 'decode-panel';

    const label = document.createElement('div');
    label.className = 'decode-label';
    label.textContent = t('game.decodeLabel');
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
        highlightSymbolOccurrences(sym);
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
    notice.textContent = t('game.rewriteNotice');
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

    LETTERS.filter(letter => !revealed.has(letter)).forEach(letter=>{
      const btn = document.createElement('button');
      btn.className = 'letter-btn';
      btn.textContent = letter;
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
          saveProgress();
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

          if(mistakes >= maxTotalMistakes){
            clearSavedProgress();
            setTimeout(()=>{ renderGameOver(); }, 300);
            return;
          }
          if(messageMistakes >= maxMessageMistakes){
            setTimeout(()=>{ triggerRewrite(); }, 300);
            return;
          }
          saveProgress();
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
      btn.innerHTML = '<span class="tag">' + t('game.choiceTag') + '</span>' + choice.label;
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
    if(mistakes === 0) return t('ending.flavorZero');
    if(mistakes <= maxTotalMistakes * 0.1) return t('ending.flavorLow', {count: mistakes});
    if(mistakes <= maxTotalMistakes * 0.38) return t('ending.flavorMid', {count: mistakes});
    if(mistakes <= maxTotalMistakes * 0.78) return t('ending.flavorHigh', {count: mistakes});
    return t('ending.flavorExtreme', {count: mistakes});
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
        currentStoryKey = file;
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
      const metaParts = [];
      if(entry.language) metaParts.push(entry.language.toUpperCase());
      if(entry.author) metaParts.push(entry.author);
      btn.innerHTML =
        '<span class="story-menu-title">' + entry.title + '</span>' +
        (entry.tagline ? '<span class="story-menu-tagline">' + entry.tagline + '</span>' : '') +
        (metaParts.length ? '<span class="story-menu-meta">' + metaParts.join(' · ') + '</span>' : '');
      btn.addEventListener('click', ()=> selectFile(entry.file, btn, t('storyMenu.loadingLabel')));
      wrap.appendChild(btn);
    });

    const randomBtn = document.createElement('button');
    randomBtn.className = 'story-menu-btn story-menu-random';
    randomBtn.innerHTML =
      '<span class="story-menu-title">' + t('storyMenu.randomTitle') + '</span>' +
      '<span class="story-menu-tagline">' + t('storyMenu.randomTagline') + '</span>';
    randomBtn.addEventListener('click', ()=>{
      const pick = MANIFEST.stories[Math.floor(Math.random()*MANIFEST.stories.length)];
      selectFile(pick.file, randomBtn, t('storyMenu.loadingLabel'));
    });
    wrap.appendChild(randomBtn);

    const loadBtn = document.createElement('button');
    loadBtn.className = 'story-menu-btn story-menu-load';
    loadBtn.innerHTML =
      '<span class="story-menu-title">' + t('storyMenu.loadTitle') + '</span>' +
      '<span class="story-menu-tagline">' + t('storyMenu.loadTagline') + '</span>';
    loadBtn.addEventListener('click', ()=>{
      storyFileInput.value = '';
      storyFileInput.click();
    });
    wrap.appendChild(loadBtn);

    storyFileInput.onchange = (e)=>{
      const file = e.target.files && e.target.files[0];
      if(!file) return;
      disableAll();
      loadBtn.classList.add('selected');
      loadBtn.querySelector('.story-menu-title').textContent = t('storyMenu.loadingLabel');

      const resetLoadBtn = ()=>{
        wrap.querySelectorAll('.story-menu-btn').forEach(b=> b.disabled = false);
        loadBtn.classList.remove('selected');
        loadBtn.querySelector('.story-menu-title').textContent = t('storyMenu.loadTitle');
      };

      const reader = new FileReader();
      reader.onload = ()=>{
        let story;
        try{
          story = JSON.parse(reader.result);
        } catch(err){
          showLoadError(new Error(t('errors.invalidJson')), 'story');
          resetLoadBtn();
          return;
        }
        if(!story || !story.nodes || !story.startNode || !story.title){
          showLoadError(new Error(t('errors.invalidStructure')), 'story');
          resetLoadBtn();
          return;
        }
        STORY = story;
        currentStoryKey = 'custom:' + file.name;
        onStoryReady(story);
      };
      reader.onerror = ()=>{
        showLoadError(new Error(t('errors.readFailed')), 'story');
        resetLoadBtn();
      };
      reader.readAsText(file);
    };

    container.appendChild(wrap);
  }

  function showLoadError(err, kind){
    const msg = kind === 'manifest'
      ? t('errors.manifestPrefix', {message: err.message})
      : t('errors.storyPrefix', {message: err.message});
    introError.textContent = msg + t('errors.serverHint');
  }

  // --- Schermata introduttiva ---

  let pendingStory = null;

  function resetIntroSelection(){
    pendingStory = null;
    introStoryName.textContent = t('intro.storyPrompt');
    introStart.disabled = true;
    introStart.textContent = t('intro.startBtnIdle');
    introCancel.disabled = true;
    btnOpenCodexIntro.disabled = true;
    buildStoryMenu(introMenu, onIntroStorySelected);
  }

  function onIntroStorySelected(story){
    pendingStory = story;
    introStoryName.textContent = t('intro.storyChosen', {title: story.title});
    document.title = t('common.pageTitleWithStory', {title: story.title});
    introStart.disabled = false;
    introStart.textContent = t('intro.startBtnReady');
    introCancel.disabled = false;
    btnOpenCodexIntro.disabled = false;
  }

  function initIntroMenu(){
    loadManifest().then(manifest=>{
      MANIFEST = manifest;
      buildStoryMenu(introMenu, onIntroStorySelected);
    }).catch(err=>{
      showLoadError(err, 'manifest');
    });
  }

  introStart.addEventListener('click', ()=>{
    if(!pendingStory) return;
    STORY = pendingStory;
    introModal.style.display = 'none';
    resetGame();
  });

  introCancel.addEventListener('click', ()=>{
    resetIntroSelection();
  });

  // --- Fine partita: stesso menu per scegliere cosa fare dopo ---

  function renderEndMenu(container){
    const label = document.createElement('div');
    label.className = 'ending-menu-label';
    label.textContent = t('storyMenu.endMenuLabel');
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
    recordEndingDiscovered(currentStoryKey, currentNodeId);
    clearSavedProgress();
    messageEl.parentElement.style.display = 'none';
    decodeArea.innerHTML = '';
    hintEl.style.display = 'none';
    progressTrail.textContent = '';

    choiceArea.innerHTML = '';

    const fixedTop = document.createElement('div');
    fixedTop.className = 'ending-fixed-top';

    const title = document.createElement('div');
    title.className = 'ending-title';
    title.textContent = t('ending.titlePrefix', {title: node.title});

    const text = document.createElement('div');
    text.className = 'ending-text';
    text.textContent = node.text;

    const stat = document.createElement('div');
    stat.className = 'ending-stat';
    stat.textContent = mistakeFlavor();

    fixedTop.appendChild(title);
    fixedTop.appendChild(text);
    fixedTop.appendChild(stat);

    const codexBtn = document.createElement('button');
    codexBtn.className = 'codex-open-btn';
    codexBtn.textContent = t('codex.buttonLabel');
    codexBtn.addEventListener('click', ()=> openCodex(STORY, currentStoryKey));
    fixedTop.appendChild(codexBtn);

    const diffHost = document.createElement('div');
    fixedTop.appendChild(diffHost);
    renderDifficultyPicker(diffHost);

    choiceArea.appendChild(fixedTop);

    const scrollWrap = document.createElement('div');
    scrollWrap.className = 'ending-scroll no-scrollbar';
    choiceArea.appendChild(scrollWrap);
    renderEndMenu(scrollWrap);
  }

  function renderGameOver(){
    clearSavedProgress();
    messageEl.parentElement.style.display = 'none';
    decodeArea.innerHTML = '';
    hintEl.style.display = 'none';
    progressTrail.textContent = '';
    terminalEl.classList.add('gameover');

    choiceArea.innerHTML = '';

    const fixedTop = document.createElement('div');
    fixedTop.className = 'ending-fixed-top';

    const title = document.createElement('div');
    title.className = 'ending-title gameover-title';
    title.textContent = t('ending.gameOverTitle');

    const text = document.createElement('div');
    text.className = 'ending-text';
    text.textContent = t('ending.gameOverText');

    const stat = document.createElement('div');
    stat.className = 'ending-stat';
    stat.textContent = t('ending.gameOverStat', {count: mistakes, max: maxTotalMistakes});

    fixedTop.appendChild(title);
    fixedTop.appendChild(text);
    fixedTop.appendChild(stat);

    const codexBtn = document.createElement('button');
    codexBtn.className = 'codex-open-btn';
    codexBtn.textContent = t('codex.buttonLabel');
    codexBtn.addEventListener('click', ()=> openCodex(STORY, currentStoryKey));
    fixedTop.appendChild(codexBtn);

    const diffHost = document.createElement('div');
    fixedTop.appendChild(diffHost);
    renderDifficultyPicker(diffHost);

    choiceArea.appendChild(fixedTop);

    const scrollWrap = document.createElement('div');
    scrollWrap.className = 'ending-scroll no-scrollbar';
    choiceArea.appendChild(scrollWrap);
    renderEndMenu(scrollWrap);
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
    progressTrail.textContent = node.progressLabel ? node.progressLabel : t('game.progressLabel', {n: depth+1, total: totalStages});
    currentText = pickVariant(node);
    initCipherForMessage();
    if(vowelHelpActive){
      VOWELS.forEach(v => revealed.add(v));
    }
    renderMessage(currentText);
    hintEl.style.display = 'block';
    renderDecodePanel(currentText);
    saveProgress();
  }

  // ================= CODEX DEI FINALI =================

  function loadCodexData(){
    try{ return JSON.parse(localStorage.getItem(CODEX_STORAGE_KEY)) || {}; }
    catch(e){ return {}; }
  }
  function saveCodexData(data){
    try{ localStorage.setItem(CODEX_STORAGE_KEY, JSON.stringify(data)); }
    catch(e){ /* localStorage non disponibile: il codex semplicemente non persiste */ }
  }
  function recordEndingDiscovered(storyKey, nodeId){
    if(!storyKey) return;
    const data = loadCodexData();
    if(!data[storyKey]) data[storyKey] = [];
    if(!data[storyKey].includes(nodeId)){
      data[storyKey].push(nodeId);
      saveCodexData(data);
    }
  }
  function getDiscoveredSet(storyKey){
    const data = loadCodexData();
    return new Set(data[storyKey] || []);
  }

  function openCodex(story, storyKey){
    if(!story) return;
    const discovered = getDiscoveredSet(storyKey);
    const endingIds = Object.keys(story.nodes).filter(id => story.nodes[id].isEnding);
    const total = endingIds.length;
    const found = endingIds.filter(id => discovered.has(id)).length;
    const percent = total ? Math.round((found / total) * 100) : 0;

    codexTitleEl.textContent = t('codex.titleFor', {title: story.title});
    codexProgressEl.textContent = t('codex.progress', {found, total, percent});

    codexListEl.innerHTML = '';
    endingIds.forEach(id=>{
      const node = story.nodes[id];
      const isFound = discovered.has(id);
      const entry = document.createElement('div');
      entry.className = 'codex-entry' + (isFound ? ' found' : ' locked');
      if(isFound){
        entry.innerHTML =
          '<div class="codex-entry-title">' + node.title + '</div>' +
          '<div class="codex-entry-text">' + node.text + '</div>';
      } else {
        entry.innerHTML = '<div class="codex-entry-title">' + t('codex.locked') + '</div>';
      }
      codexListEl.appendChild(entry);
    });

    codexModal.style.display = 'flex';
  }

  btnCloseCodex.addEventListener('click', ()=>{ codexModal.style.display = 'none'; });
  btnOpenCodexIntro.addEventListener('click', ()=>{
    if(pendingStory) openCodex(pendingStory, currentStoryKey);
  });

  // ================= SALVATAGGIO / RIPRESA =================

  function saveProgress(){
    if(!STORY || !currentNodeId) return;
    const node = STORY.nodes[currentNodeId];
    if(!node || node.isEnding) return;
    const data = {
      storyKey: currentStoryKey,
      storyData: STORY,
      currentNodeId,
      currentText,
      depth,
      stability,
      mistakes,
      messageMistakes,
      difficulty: currentDifficulty,
      revealed: Array.from(revealed),
      letterToSymbol,
      savedAt: Date.now()
    };
    try{ localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(data)); }
    catch(e){ /* localStorage non disponibile: si continua senza autosalvataggio */ }
  }

  function clearSavedProgress(){
    try{ localStorage.removeItem(SAVE_STORAGE_KEY); }
    catch(e){ /* niente da fare */ }
  }

  function loadSavedProgress(){
    try{
      const raw = localStorage.getItem(SAVE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch(e){ return null; }
  }

  function resumeFromSave(save){
    STORY = save.storyData;
    currentStoryKey = save.storyKey;
    currentDifficulty = save.difficulty || 'normale';
    applySymbolSet(STORY);
    applyDifficulty(STORY);

    stability = save.stability;
    mistakes = save.mistakes;
    messageMistakes = save.messageMistakes;
    currentNodeId = save.currentNodeId;
    depth = save.depth;
    currentText = save.currentText;
    letterToSymbol = save.letterToSymbol;
    symbolToLetter = {};
    Object.keys(letterToSymbol).forEach(l => { symbolToLetter[letterToSymbol[l]] = l; });
    revealed = new Set(save.revealed);

    terminalEl.classList.remove('gameover','tier1','tier2','tier3','unstable','critical','aggressive');
    sessionIdEl.textContent = t('common.sessionIdFallback').replace(/\d+$/, '') + String(Math.floor(Math.random()*900)+100);
    statusLabelEl.textContent = STORY.title + ' // ' + (STORY.tagline || t('common.statusLabelFallback'));
    updateStabilityUI();
    updateMistakeUI();
    updateMessageMistakeUI();

    const node = STORY.nodes[currentNodeId];
    choiceArea.innerHTML = '';
    terminalEl.classList.toggle('aggressive', !!node.aggressive);
    const totalStages = STORY.totalStages || 8;
    progressTrail.textContent = node.progressLabel ? node.progressLabel : t('game.progressLabel', {n: depth+1, total: totalStages});
    showGameUI();
    renderMessage(currentText);
    renderDecodePanel(currentText);

    introModal.style.display = 'none';
  }

  function renderResumeBanner(){
    const save = loadSavedProgress();
    if(!save || !save.storyData){
      resumeBanner.style.display = 'none';
      return;
    }
    const node = save.storyData.nodes[save.currentNodeId];
    const totalStages = save.storyData.totalStages || 8;
    resumeBannerText.textContent = t('resume.banner', {
      title: save.storyData.title,
      n: (save.depth || 0) + 1,
      total: totalStages
    });
    resumeBanner.style.display = 'block';
  }

  btnResumeGame.addEventListener('click', ()=>{
    const save = loadSavedProgress();
    if(save) resumeFromSave(save);
  });
  btnDeleteSave.addEventListener('click', ()=>{
    clearSavedProgress();
    renderResumeBanner();
  });

  // ---------- Avvio: carica prima le stringhe dell'interfaccia, poi il manifest ----------
  window.I18N.load('lang/it.json', 'LANG_IT_FALLBACK').then(()=>{
    applyStaticText();
    renderResumeBanner();
  }).catch(()=>{
    // Se anche il fallback incorporato manca, si procede comunque:
    // I18N.get restituisce la chiave stessa, quindi l'interfaccia resta usabile ma poco leggibile.
  }).finally(()=>{
    initIntroMenu();
  });

})();
