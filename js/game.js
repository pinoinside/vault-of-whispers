(function(){

  const LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];

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
  const introCancel = document.getElementById('introCancel');
  const introStoryName = document.getElementById('introStoryName');
  const introError = document.getElementById('introError');
  const introMenu = document.getElementById('introMenu');
  const storyFileInput = document.getElementById('storyFileInput');
  const introTitleEl = document.getElementById('introTitle');
  const introSummaryEl = document.getElementById('introSummary');
  const introExplanationEl = document.getElementById('introExplanation');
  const introCreditsBoxEl = document.getElementById('introCreditsBox');

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

  function resetGame(){
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
    mistakeCounterEl.textContent = t('game.totalMistakes', {count: mistakes});
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
    msgMistakeCounterEl.textContent = t('game.messageMistakes', {count: messageMistakes});
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
    if(mistakes <= 5) return t('ending.flavorLow', {count: mistakes});
    if(mistakes <= 19) return t('ending.flavorMid', {count: mistakes});
    if(mistakes <= 39) return t('ending.flavorHigh', {count: mistakes});
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

    function selectFile(file, btnEl){
      disableAll();
      btnEl.classList.add('selected');
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
      btn.addEventListener('click', ()=> selectFile(entry.file, btn));
      wrap.appendChild(btn);
    });

    const randomBtn = document.createElement('button');
    randomBtn.className = 'story-menu-btn story-menu-random';
    randomBtn.innerHTML =
      '<span class="story-menu-title">' + t('storyMenu.randomTitle') + '</span>' +
      '<span class="story-menu-tagline">' + t('storyMenu.randomTagline') + '</span>';
    randomBtn.addEventListener('click', ()=>{
      const pick = MANIFEST.stories[Math.floor(Math.random()*MANIFEST.stories.length)];
      selectFile(pick.file, randomBtn);
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
        if(!story || !story.nodes || !story.startNode || !story.symbols || !story.title){
          showLoadError(new Error(t('errors.invalidStructure')), 'story');
          resetLoadBtn();
          return;
        }
        STORY = story;
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
    buildStoryMenu(introMenu, onIntroStorySelected);
  }

  function onIntroStorySelected(story){
    pendingStory = story;
    introStoryName.textContent = t('intro.storyChosen', {title: story.title});
    document.title = t('common.pageTitleWithStory', {title: story.title});
    introStart.disabled = false;
    introStart.textContent = t('intro.startBtnReady');
    introCancel.disabled = false;
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
    choiceArea.appendChild(fixedTop);

    const scrollWrap = document.createElement('div');
    scrollWrap.className = 'ending-scroll no-scrollbar';
    choiceArea.appendChild(scrollWrap);
    renderEndMenu(scrollWrap);
  }

  function renderGameOver(){
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
    stat.textContent = t('ending.gameOverStat', {count: mistakes});

    fixedTop.appendChild(title);
    fixedTop.appendChild(text);
    fixedTop.appendChild(stat);
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
    renderMessage(currentText);
    hintEl.style.display = 'block';
    renderDecodePanel(currentText);
  }

  // ---------- Avvio: carica prima le stringhe dell'interfaccia, poi il manifest ----------
  window.I18N.load('lang/it.json', 'LANG_IT_FALLBACK').then(()=>{
    applyStaticText();
  }).catch(()=>{
    // Se anche il fallback incorporato manca, si procede comunque:
    // I18N.get restituisce la chiave stessa, quindi l'interfaccia resta usabile ma poco leggibile.
  }).finally(()=>{
    initIntroMenu();
  });

})();
