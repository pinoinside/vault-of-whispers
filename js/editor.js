(function(){

  const DEFAULT_SYMBOLS = ["☠","☣","☢","☯","⚛","⚗","⚜","⚓","⚔","⚖","⚙","⚠","☮","☤","⚕","⚰","⚱","⛧","⚹","⚥","☍","☄","☾","☉","⛓","⛏","⚒","⚑","⚘","☊"];
  const LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];

  function t(key, vars){ return window.I18N ? window.I18N.get(key, vars) : key; }

  function applyI18n(){
    document.title = t('editor.pageTitle');
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el=>{
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
      el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
  }

  function blankStory(){
    return {
      title: "NUOVA STORIA",
      tagline: "una breve riga d'atmosfera",
      language: "it",
      author: "",
      totalStages: 5,
      startNode: "root",
      corruptNode: "CORRUPT1",
      symbolSet: (window.SYMBOL_SETS && Object.keys(window.SYMBOL_SETS)[0]) || "occulto",
      nodes: {
        root: {
          variants: [
            "SCRIVI QUI LA PRIMA VARIANTE DEL MESSAGGIO INIZIALE.",
            "SCRIVI QUI LA SECONDA VARIANTE, STESSO SIGNIFICATO.",
            "SCRIVI QUI LA TERZA VARIANTE."
          ],
          choices: [
            { label: t('editor.nodes.defaultChoiceLabel', {n: 1}), next: "E1", delta: 0 },
            { label: t('editor.nodes.defaultChoiceLabel', {n: 2}), next: "E2", delta: 0 },
            { label: t('editor.nodes.defaultChoiceLabel', {n: 3}), next: "E3", delta: 0 }
          ]
        },
        E1: { isEnding: true, title: "PRIMO FINALE", text: "Scrivi qui il testo del primo finale, in chiaro, senza restrizioni di lettere." },
        E2: { isEnding: true, title: "SECONDO FINALE", text: "Scrivi qui il testo del secondo finale." },
        E3: { isEnding: true, title: "TERZO FINALE", text: "Scrivi qui il testo del terzo finale." },
        CORRUPT1: {
          aggressive: true,
          progressLabel: "INTERFERENZA CRITICA",
          variants: [
            "BASTA COSI'. NON C'E' PIU' PAZIENZA PER ALTRI ERRORI.",
            "NON C'E' PIU' PAZIENZA. HAI SBAGLIATO TROPPE VOLTE.",
            "BASTA ERRORI. LA PAZIENZA E' FINITA DA UN PEZZO."
          ],
          choices: [
            { label: "Mi fermero'.", next: "G1", delta: -10 },
            { label: "Non mi fai paura.", next: "G2", delta: 20 },
            { label: "Fammi ricominciare.", next: "G3", delta: -5 }
          ]
        },
        G1: { isEnding: true, title: "FINALE AGGRESSIVO 1", text: "Testo del primo finale esclusivo del ramo aggressivo." },
        G2: { isEnding: true, title: "FINALE AGGRESSIVO 2", text: "Testo del secondo finale esclusivo del ramo aggressivo." },
        G3: { isEnding: true, title: "FINALE AGGRESSIVO 3", text: "Testo del terzo finale esclusivo del ramo aggressivo." }
      }
    };
  }

  let story = blankStory();
  let currentNodeId = null;

  // ---------- Elementi DOM ----------
  const fTitle = document.getElementById('fTitle');
  const fTagline = document.getElementById('fTagline');
  const fLanguage = document.getElementById('fLanguage');
  const fAuthor = document.getElementById('fAuthor');
  const fStages = document.getElementById('fStages');
  const fStartNode = document.getElementById('fStartNode');
  const fCorruptNode = document.getElementById('fCorruptNode');
  const fSymbolSource = document.getElementById('fSymbolSource');
  const fSymbolsField = document.getElementById('fSymbolsField');
  const fSymbols = document.getElementById('fSymbols');
  const symbolsCount = document.getElementById('symbolsCount');
  const symbolsPreview = document.getElementById('symbolsPreview');
  const nodeList = document.getElementById('nodeList');
  const nodeEditor = document.getElementById('nodeEditor');
  const validationOutput = document.getElementById('validationOutput');
  const fileInput = document.getElementById('fileInput');

  // Restituisce i simboli effettivamente usati dalla storia in questo momento,
  // applicando la stessa logica di risoluzione del motore di gioco
  // (symbols espliciti > symbolSet nominato > set predefinito del registro > riserva).
  function getEffectiveSymbols(){
    if(story.symbols && story.symbols.length) return story.symbols;
    const sets = window.SYMBOL_SETS || {};
    const names = Object.keys(sets);
    let chosen = (story.symbolSet && sets[story.symbolSet]) || null;
    if(!chosen) chosen = names.map(k=>sets[k]).find(s=>s.default) || sets[names[0]];
    return chosen ? chosen.symbols : DEFAULT_SYMBOLS.slice();
  }

  // ---------- Tabs ----------
  document.querySelectorAll('.ed-tab').forEach(tab=>{
    tab.addEventListener('click', ()=>{
      document.querySelectorAll('.ed-tab').forEach(tb=>tb.classList.remove('active'));
      document.querySelectorAll('.editor-panel').forEach(p=>p.style.display='none');
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).style.display='block';
      if(tab.dataset.tab === 'validation') runValidation();
    });
  });

  // ---------- Impostazioni globali ----------
  function refreshNodeSelects(){
    const ids = Object.keys(story.nodes);
    [fStartNode, fCorruptNode].forEach(sel=>{
      const current = sel.value;
      sel.innerHTML = '';
      const emptyOpt = document.createElement('option');
      emptyOpt.value = '';
      emptyOpt.textContent = t('editor.settings.noneOption');
      if(sel === fStartNode) emptyOpt.disabled = true;
      sel.appendChild(emptyOpt);
      ids.forEach(id=>{
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = id + (story.nodes[id].isEnding ? '  (finale)' : '');
        sel.appendChild(opt);
      });
      sel.value = ids.includes(current) ? current : '';
    });
    fStartNode.value = story.startNode || '';
    fCorruptNode.value = story.corruptNode || '';
  }

  function populateSymbolSourceOptions(){
    fSymbolSource.innerHTML = '';
    const sets = window.SYMBOL_SETS || {};
    Object.keys(sets).forEach(key=>{
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = sets[key].label + (sets[key].default ? ' ★' : '');
      fSymbolSource.appendChild(opt);
    });
    const customOpt = document.createElement('option');
    customOpt.value = '';
    customOpt.textContent = t('editor.settings.symbolSourceCustomOption');
    fSymbolSource.appendChild(customOpt);
  }

  function updateSymbolFieldMode(){
    const isCustom = !story.symbolSet;
    fSymbols.disabled = !isCustom;
    fSymbolsField.style.opacity = isCustom ? '1' : '0.6';
    fSymbols.value = getEffectiveSymbols().join(' ');
  }

  function renderSettingsForm(){
    fTitle.value = story.title || '';
    fTagline.value = story.tagline || '';
    fLanguage.value = story.language || '';
    fAuthor.value = story.author || '';
    fStages.value = story.totalStages || 1;
    populateSymbolSourceOptions();
    fSymbolSource.value = story.symbolSet || '';
    updateSymbolFieldMode();
    refreshNodeSelects();
    renderSymbolsPreview();
  }

  function renderSymbolsPreview(){
    const syms = getEffectiveSymbols();
    symbolsPreview.innerHTML = '';
    syms.forEach(s=>{
      const span = document.createElement('span');
      span.textContent = s;
      symbolsPreview.appendChild(span);
    });
    symbolsCount.textContent = t('editor.settings.symbolsCount', {count: syms.length, required: LETTERS.length});
    symbolsCount.classList.toggle('warn', syms.length < LETTERS.length);
  }

  fTitle.addEventListener('input', ()=>{ story.title = fTitle.value; });
  fTagline.addEventListener('input', ()=>{ story.tagline = fTagline.value; });
  fLanguage.addEventListener('input', ()=>{ story.language = fLanguage.value; });
  fAuthor.addEventListener('input', ()=>{ story.author = fAuthor.value; });
  fStages.addEventListener('input', ()=>{ story.totalStages = parseInt(fStages.value, 10) || 1; });
  fStartNode.addEventListener('change', ()=>{ story.startNode = fStartNode.value; renderNodeList(); });
  fCorruptNode.addEventListener('change', ()=>{ story.corruptNode = fCorruptNode.value; renderNodeList(); });

  fSymbolSource.addEventListener('change', ()=>{
    if(fSymbolSource.value){
      story.symbolSet = fSymbolSource.value;
      delete story.symbols;
    } else {
      delete story.symbolSet;
      if(!story.symbols || !story.symbols.length) story.symbols = DEFAULT_SYMBOLS.slice();
    }
    updateSymbolFieldMode();
    renderSymbolsPreview();
  });
  fSymbols.addEventListener('input', ()=>{
    story.symbols = fSymbols.value.split(/[,\s]+/).map(s=>s.trim()).filter(Boolean);
    renderSymbolsPreview();
  });
  document.getElementById('btnDefaultSymbols').addEventListener('click', ()=>{
    fSymbolSource.value = '';
    delete story.symbolSet;
    story.symbols = DEFAULT_SYMBOLS.slice();
    updateSymbolFieldMode();
    renderSymbolsPreview();
  });

  // ---------- Lista nodi ----------
  function renderNodeList(){
    nodeList.innerHTML = '';
    const reach = computeReachability();
    const ids = Object.keys(story.nodes);
    const storyIds = ids.filter(id => !story.nodes[id].isEnding);
    const endingIds = ids.filter(id => story.nodes[id].isEnding);

    function addGroup(label, arr){
      const h = document.createElement('div');
      h.className = 'node-group-label';
      h.textContent = label + ' (' + arr.length + ')';
      nodeList.appendChild(h);
      arr.forEach(id=>{
        const item = document.createElement('button');
        item.className = 'node-list-item' + (id === currentNodeId ? ' active' : '') + (!reach.has(id) ? ' unreachable' : '');
        let badges = '';
        if(id === story.startNode) badges += '<span class="node-badge">' + t('editor.nodes.badgeStart') + '</span>';
        if(id === story.corruptNode) badges += '<span class="node-badge badge-danger">' + t('editor.nodes.badgeCorrupt') + '</span>';
        if(story.nodes[id].aggressive) badges += '<span class="node-badge badge-danger">' + t('editor.nodes.badgeAggressive') + '</span>';
        item.innerHTML = '<span class="node-id">' + id + '</span><span>' + badges + '</span>';
        item.title = reach.has(id) ? '' : t('editor.nodes.unreachableTitle');
        item.addEventListener('click', ()=>{ currentNodeId = id; renderNodeList(); renderNodeEditor(); });
        nodeList.appendChild(item);
      });
    }
    addGroup(t('editor.nodes.groupStory'), storyIds);
    addGroup(t('editor.nodes.groupEndings'), endingIds);

    const addBtn = document.createElement('button');
    addBtn.className = 'ed-btn ed-btn-block';
    addBtn.textContent = t('editor.nodes.addNode');
    addBtn.addEventListener('click', addNewNode);
    nodeList.appendChild(addBtn);
  }

  function addNewNode(){
    let id = prompt(t('editor.prompt.newNodeId'));
    if(!id) return;
    id = id.trim();
    if(!id || story.nodes[id]){ alert(t('editor.alert.badNodeId')); return; }
    const isEnding = confirm(t('editor.confirm.isEnding'));
    if(isEnding){
      story.nodes[id] = { isEnding: true, title: t('editor.nodes.defaultNewEndingTitle'), text: t('editor.nodes.defaultNewEndingText') };
    } else {
      story.nodes[id] = {
        variants: [t('editor.nodes.defaultVariant1'), t('editor.nodes.defaultVariant2'), t('editor.nodes.defaultVariant3')],
        choices: [
          { label: t('editor.nodes.defaultChoiceLabel', {n: 1}), next: story.startNode || id, delta: 0 },
          { label: t('editor.nodes.defaultChoiceLabel', {n: 2}), next: story.startNode || id, delta: 0 },
          { label: t('editor.nodes.defaultChoiceLabel', {n: 3}), next: story.startNode || id, delta: 0 }
        ]
      };
    }
    currentNodeId = id;
    refreshNodeSelects();
    renderNodeList();
    renderNodeEditor();
  }

  function renameNode(oldId){
    let newId = prompt(t('editor.prompt.renameNode'), oldId);
    if(!newId) return;
    newId = newId.trim();
    if(!newId || newId === oldId) return;
    if(story.nodes[newId]){ alert(t('editor.alert.duplicateId')); return; }
    story.nodes[newId] = story.nodes[oldId];
    delete story.nodes[oldId];
    Object.values(story.nodes).forEach(n=>{
      if(n.choices) n.choices.forEach(c=>{ if(c.next === oldId) c.next = newId; });
    });
    if(story.startNode === oldId) story.startNode = newId;
    if(story.corruptNode === oldId) story.corruptNode = newId;
    currentNodeId = newId;
    refreshNodeSelects();
    renderNodeList();
    renderNodeEditor();
  }

  function deleteNode(id){
    if(!confirm(t('editor.confirm.deleteNode', {id}))) return;
    delete story.nodes[id];
    if(currentNodeId === id) currentNodeId = null;
    refreshNodeSelects();
    renderNodeList();
    renderNodeEditor();
  }

  // ---------- Editor del nodo selezionato ----------
  function nodeOptionsHtml(selected){
    return Object.keys(story.nodes).map(id=>
      '<option value="' + id + '"' + (id === selected ? ' selected' : '') + '>' + id + (story.nodes[id].isEnding ? ' (finale)' : '') + '</option>'
    ).join('');
  }

  function renderNodeEditor(){
    if(!currentNodeId || !story.nodes[currentNodeId]){
      nodeEditor.innerHTML = '<div class="node-editor-empty">' + t('editor.nodes.emptyState') + '</div>';
      return;
    }
    const id = currentNodeId;
    const node = story.nodes[id];
    nodeEditor.innerHTML = '';

    const head = document.createElement('div');
    head.className = 'node-editor-head';
    head.innerHTML =
      '<span class="node-editor-id">' + id + '</span>' +
      '<span>' +
        '<button class="ed-btn ed-btn-small" id="btnRename">' + t('editor.nodes.rename') + '</button> ' +
        '<button class="ed-btn ed-btn-small ed-btn-danger" id="btnDelete">' + t('editor.nodes.delete') + '</button>' +
      '</span>';
    nodeEditor.appendChild(head);
    head.querySelector('#btnRename').addEventListener('click', ()=> renameNode(id));
    head.querySelector('#btnDelete').addEventListener('click', ()=> deleteNode(id));

    const typeRow = document.createElement('div');
    typeRow.className = 'ed-checkbox-row';
    typeRow.innerHTML =
      '<input type="checkbox" id="cbIsEnding" ' + (node.isEnding ? 'checked' : '') + '> ' +
      '<label for="cbIsEnding">' + t('editor.nodes.isEndingLabel') + '</label>';
    nodeEditor.appendChild(typeRow);
    typeRow.querySelector('#cbIsEnding').addEventListener('change', (e)=>{
      if(e.target.checked){
        node.isEnding = true;
        if(!node.title) node.title = t('editor.nodes.defaultNewEndingTitle');
        if(!node.text) node.text = '';
      } else {
        delete node.isEnding;
        if(!node.variants) node.variants = [t('editor.nodes.defaultVariant1'), t('editor.nodes.defaultVariant2'), t('editor.nodes.defaultVariant3')];
        if(!node.choices) node.choices = [{label: t('editor.nodes.defaultChoiceLabel', {n: 1}), next:id, delta:0}];
      }
      renderNodeList();
      renderNodeEditor();
    });

    if(node.isEnding){
      renderEndingForm(node);
    } else {
      renderStoryNodeForm(node, id);
    }
  }

  function renderEndingForm(node){
    const wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="ed-field"><label class="ed-label">' + t('editor.nodes.endingTitleLabel') + '</label>' +
      '<input type="text" class="ed-input" id="edTitle" value="' + escapeHtmlAttr(node.title || '') + '"></div>' +
      '<div class="ed-field"><label class="ed-label">' + t('editor.nodes.endingTextLabel') + '</label>' +
      '<textarea class="ed-textarea" id="edText" rows="6">' + escapeHtml(node.text || '') + '</textarea></div>';
    nodeEditor.appendChild(wrap);
    wrap.querySelector('#edTitle').addEventListener('input', (e)=>{ node.title = e.target.value; renderNodeList(); });
    wrap.querySelector('#edText').addEventListener('input', (e)=>{ node.text = e.target.value; });
  }

  function renderStoryNodeForm(node, id){
    const wrap = document.createElement('div');

    const aggRow = document.createElement('div');
    aggRow.className = 'ed-checkbox-row';
    aggRow.innerHTML =
      '<input type="checkbox" id="cbAggressive" ' + (node.aggressive ? 'checked' : '') + '> ' +
      '<label for="cbAggressive">' + t('editor.nodes.aggressiveLabel') + '</label>';
    wrap.appendChild(aggRow);
    aggRow.querySelector('#cbAggressive').addEventListener('change', (e)=>{
      if(e.target.checked) node.aggressive = true; else delete node.aggressive;
    });

    const plField = document.createElement('div');
    plField.className = 'ed-field';
    plField.innerHTML =
      '<label class="ed-label">' + t('editor.nodes.progressLabelLabel') + '</label>' +
      '<input type="text" class="ed-input" id="edProgressLabel" value="' + escapeHtmlAttr(node.progressLabel || '') + '" placeholder="' + escapeHtmlAttr(t('editor.nodes.progressLabelPlaceholder')) + '">';
    wrap.appendChild(plField);
    plField.querySelector('#edProgressLabel').addEventListener('input', (e)=>{
      node.progressLabel = e.target.value || undefined;
      if(!node.progressLabel) delete node.progressLabel;
    });

    // Varianti
    const variantsField = document.createElement('div');
    variantsField.className = 'ed-field';
    variantsField.innerHTML = '<label class="ed-label">' + t('editor.nodes.variantsLabel') + '</label>';
    const variantsHost = document.createElement('div');
    variantsField.appendChild(variantsHost);
    const addVariantBtn = document.createElement('button');
    addVariantBtn.className = 'ed-btn ed-btn-small';
    addVariantBtn.textContent = t('editor.nodes.addVariant');
    addVariantBtn.addEventListener('click', ()=>{
      node.variants.push('');
      renderVariants();
    });
    variantsField.appendChild(addVariantBtn);
    wrap.appendChild(variantsField);

    function renderVariants(){
      variantsHost.innerHTML = '';
      node.variants.forEach((v, i)=>{
        const row = document.createElement('div');
        row.className = 'variant-row';
        row.innerHTML =
          '<textarea class="ed-textarea" rows="2">' + escapeHtml(v) + '</textarea>' +
          (node.variants.length > 1 ? '<button class="row-remove-btn" style="margin-top:6px;">' + t('editor.nodes.removeVariant') + '</button>' : '');
        row.querySelector('textarea').addEventListener('input', (e)=>{ node.variants[i] = e.target.value; });
        const rm = row.querySelector('.row-remove-btn');
        if(rm) rm.addEventListener('click', ()=>{ node.variants.splice(i,1); renderVariants(); });
        variantsHost.appendChild(row);
      });
    }
    renderVariants();

    // Scelte
    const choicesField = document.createElement('div');
    choicesField.className = 'ed-field';
    choicesField.innerHTML = '<label class="ed-label">' + t('editor.nodes.choicesLabel') + '</label>';
    const choicesHost = document.createElement('div');
    choicesField.appendChild(choicesHost);
    const addChoiceBtn = document.createElement('button');
    addChoiceBtn.className = 'ed-btn ed-btn-small';
    addChoiceBtn.textContent = t('editor.nodes.addChoice');
    addChoiceBtn.addEventListener('click', ()=>{
      node.choices.push({ label: '', next: story.startNode || id, delta: 0 });
      renderChoices();
    });
    choicesField.appendChild(addChoiceBtn);
    wrap.appendChild(choicesField);

    function renderChoices(){
      choicesHost.innerHTML = '';
      node.choices.forEach((c, i)=>{
        const row = document.createElement('div');
        row.className = 'choice-row';
        row.innerHTML =
          '<input type="text" class="ed-input choice-label" placeholder="' + escapeHtmlAttr(t('editor.nodes.choiceLabelPlaceholder')) + '" value="' + escapeHtmlAttr(c.label || '') + '">' +
          '<select class="ed-select choice-next">' + nodeOptionsHtml(c.next) + '</select>' +
          '<input type="number" class="ed-input choice-delta" value="' + (c.delta || 0) + '" title="' + escapeHtmlAttr(t('editor.nodes.choiceDeltaTitle')) + '">' +
          (node.choices.length > 1 ? '<button class="row-remove-btn">' + t('editor.nodes.removeChoice') + '</button>' : '');
        row.querySelector('.choice-label').addEventListener('input', (e)=>{ c.label = e.target.value; });
        row.querySelector('.choice-next').addEventListener('change', (e)=>{ c.next = e.target.value; renderNodeList(); });
        row.querySelector('.choice-delta').addEventListener('input', (e)=>{ c.delta = parseInt(e.target.value, 10) || 0; });
        const rm = row.querySelector('.row-remove-btn');
        if(rm) rm.addEventListener('click', ()=>{ node.choices.splice(i,1); renderChoices(); });
        choicesHost.appendChild(row);
      });
    }
    renderChoices();

    nodeEditor.appendChild(wrap);
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  }
  function escapeHtmlAttr(s){
    return escapeHtml(s).replace(/"/g, '&quot;');
  }

  // ---------- Validazione ----------
  function computeReachability(){
    const reached = new Set();
    function bft(startId){
      if(!startId || !story.nodes[startId]) return;
      const queue = [startId];
      while(queue.length){
        const id = queue.shift();
        if(reached.has(id) || !story.nodes[id]) continue;
        reached.add(id);
        const n = story.nodes[id];
        if(n.choices) n.choices.forEach(c=>{ if(c.next) queue.push(c.next); });
      }
    }
    bft(story.startNode);
    bft(story.corruptNode);
    return reached;
  }

  function computeCanReachEnding(){
    const canReach = new Set();
    const reverse = {};
    Object.keys(story.nodes).forEach(id=>{ reverse[id] = []; });
    Object.entries(story.nodes).forEach(([id, n])=>{
      if(n.choices) n.choices.forEach(c=>{
        if(reverse[c.next]) reverse[c.next].push(id);
      });
    });
    const queue = Object.keys(story.nodes).filter(id => story.nodes[id].isEnding);
    queue.forEach(id => canReach.add(id));
    while(queue.length){
      const id = queue.shift();
      (reverse[id] || []).forEach(pred=>{
        if(!canReach.has(pred)){ canReach.add(pred); queue.push(pred); }
      });
    }
    return canReach;
  }

  function runValidation(){
    const items = [];
    const add = (type, msg) => items.push({type, msg});

    if(!story.title || !story.title.trim()) add('err', t('editor.validation.missingTitle'));
    const effectiveSymbols = getEffectiveSymbols();
    if(!effectiveSymbols || effectiveSymbols.length < LETTERS.length){
      add('err', t('editor.validation.notEnoughSymbols', {required: LETTERS.length, count: effectiveSymbols ? effectiveSymbols.length : 0}));
    } else if(new Set(effectiveSymbols).size !== effectiveSymbols.length){
      add('warn', t('editor.validation.duplicateSymbols'));
    }
    if(!story.startNode || !story.nodes[story.startNode]){
      add('err', t('editor.validation.badStartNode'));
    }
    if(story.corruptNode){
      if(!story.nodes[story.corruptNode]) add('err', t('editor.validation.corruptNodeMissing', {id: story.corruptNode}));
      else if(story.nodes[story.corruptNode].isEnding) add('err', t('editor.validation.corruptNodeIsEnding'));
    } else {
      add('warn', t('editor.validation.noCorruptNode'));
    }

    const reach = computeReachability();
    const canReachEnding = computeCanReachEnding();

    Object.entries(story.nodes).forEach(([id, n])=>{
      if(n.isEnding){
        if(!n.title || !n.title.trim()) add('warn', t('editor.validation.endingNoTitle', {id}));
        if(!n.text || !n.text.trim()) add('warn', t('editor.validation.endingNoText', {id}));
      } else {
        if(!n.variants || !n.variants.length) add('err', t('editor.validation.nodeNoVariants', {id}));
        else if(n.variants.length !== 3) add('warn', t('editor.validation.variantCountWarn', {id, count: n.variants.length}));
        if(n.variants) n.variants.forEach((v,i)=>{ if(!v || !v.trim()) add('warn', t('editor.validation.emptyVariant', {id, index: i+1})); });

        if(!n.choices || !n.choices.length) add('err', t('editor.validation.noChoices', {id}));
        else {
          if(n.choices.length !== 3) add('warn', t('editor.validation.choiceCountWarn', {id, count: n.choices.length}));
          n.choices.forEach((c, i)=>{
            if(!c.label || !c.label.trim()) add('warn', t('editor.validation.emptyChoiceLabel', {id, index: i+1}));
            if(!c.next) add('err', t('editor.validation.choiceNoTarget', {id, index: i+1}));
            else if(!story.nodes[c.next]) add('err', t('editor.validation.choiceBadTarget', {id, index: i+1, target: c.next}));
          });
        }
      }
      if(!reach.has(id)) add('warn', t('editor.validation.unreachable', {id}));
      else if(!n.isEnding && !canReachEnding.has(id)) add('err', t('editor.validation.deadEnd', {id}));
    });

    if(items.length === 0) add('ok', t('editor.validation.allOk'));

    validationOutput.innerHTML = '';
    items.forEach(it=>{
      const li = document.createElement('li');
      li.className = 'validation-item ' + it.type;
      li.textContent = it.msg;
      validationOutput.appendChild(li);
    });
    return items.filter(i=>i.type==='err').length === 0;
  }

  document.getElementById('btnValidate').addEventListener('click', ()=>{
    document.querySelectorAll('.ed-tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.editor-panel').forEach(p=>p.style.display='none');
    document.querySelector('.ed-tab[data-tab="validation"]').classList.add('active');
    document.getElementById('tab-validation').style.display='block';
    runValidation();
  });

  // ---------- Nuova storia / carica / esporta ----------
  document.getElementById('btnNewStory').addEventListener('click', ()=>{
    if(!confirm(t('editor.confirm.newStory'))) return;
    story = blankStory();
    currentNodeId = null;
    renderSettingsForm();
    renderNodeList();
    renderNodeEditor();
  });

  document.getElementById('btnLoadStory').addEventListener('click', ()=>{
    fileInput.value = '';
    fileInput.click();
  });
  fileInput.addEventListener('change', (e)=>{
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const loaded = JSON.parse(reader.result);
        if(!loaded.nodes) throw new Error('manca il campo "nodes"');
        story = loaded;
        currentNodeId = story.startNode && story.nodes[story.startNode] ? story.startNode : Object.keys(story.nodes)[0] || null;
        renderSettingsForm();
        renderNodeList();
        renderNodeEditor();
      } catch(err){
        alert(t('editor.alert.readError', {message: err.message}));
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('btnExport').addEventListener('click', ()=>{
    const ok = runValidation();
    document.querySelectorAll('.ed-tab').forEach(tb=>tb.classList.remove('active'));
    document.querySelectorAll('.editor-panel').forEach(p=>p.style.display='none');
    document.querySelector('.ed-tab[data-tab="validation"]').classList.add('active');
    document.getElementById('tab-validation').style.display='block';
    if(!ok && !confirm(t('editor.confirm.exportWithErrors'))) return;

    const blob = new Blob([JSON.stringify(story, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (story.title || 'storia').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || 'storia';
    a.download = safeName + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // ================= ANTEPRIMA GIOCABILE =================

  const pvTerminal = document.getElementById('pvTerminal');
  const pvMessageText = document.getElementById('pvMessageText');
  const pvDecodeArea = document.getElementById('pvDecodeArea');
  const pvChoiceArea = document.getElementById('pvChoiceArea');
  const pvStabilityFill = document.getElementById('pvStabilityFill');
  const pvMistakeCounter = document.getElementById('pvMistakeCounter');
  const pvMessageMistakeCounter = document.getElementById('pvMessageMistakeCounter');
  const pvHint = document.getElementById('pvHint');
  const pvProgressTrail = document.getElementById('pvProgressTrail');
  const pvFlashOverlay = document.getElementById('pvFlashOverlay');
  const pvStatusLabel = document.getElementById('pvStatusLabel');
  const previewNodeLabel = document.getElementById('previewNodeLabel');
  const previewModal = document.getElementById('previewModal');

  let pvLetterToSymbol = {}, pvSymbolToLetter = {}, pvRevealed = new Set();
  let pvCurrentText = '', pvStability = 70, pvMistakes = 0, pvMessageMistakes = 0, pvCurrentNodeId = '', pvDepth = 0;
  let pvDifficulty = 'normale';
  let pvMaxTotalMistakes = 50, pvMaxMessageMistakes = 10, pvVowelHelp = false;
  const VOWELS = ['A','E','I','O','U'];

  function pvApplyDifficulty(){
    const n = story.totalStages || 5;
    const registry = window.DIFFICULTIES || {};
    const diff = registry[pvDifficulty] || registry.normale || { maxPerMessage: 10, vowelHelp: false, totalFormula: n2 => n2 * 5 };
    pvMaxMessageMistakes = diff.maxPerMessage;
    pvMaxTotalMistakes = Math.max(1, diff.totalFormula(n));
    pvVowelHelp = diff.vowelHelp;
  }

  function renderPvDifficultyPicker(container){
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
      btn.className = 'difficulty-btn' + (key === pvDifficulty ? ' active' : '');
      btn.textContent = t('difficulty.' + key);
      btn.title = t('difficulty.' + key + 'Hint');
      btn.addEventListener('click', ()=>{
        pvDifficulty = key;
        optionsRow.querySelectorAll('.difficulty-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        pvReset();
      });
      optionsRow.appendChild(btn);
    });
    wrap.appendChild(optionsRow);
    container.appendChild(wrap);
  }

  function pvShuffle(arr){
    const a = arr.slice();
    for(let i=a.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  }
  function pvPickVariant(node){
    if(node.variants && node.variants.length) return node.variants[Math.floor(Math.random()*node.variants.length)];
    return node.text || '';
  }
  function pvInitCipher(){
    const effective = getEffectiveSymbols();
    const shuffled = pvShuffle(effective.length ? effective : DEFAULT_SYMBOLS);
    pvLetterToSymbol = {}; pvSymbolToLetter = {};
    LETTERS.forEach((l,i)=>{
      pvLetterToSymbol[l] = shuffled[i % shuffled.length];
      pvSymbolToLetter[shuffled[i % shuffled.length]] = l;
    });
    pvRevealed = new Set();
    if(pvVowelHelp){
      VOWELS.forEach(v => pvRevealed.add(v));
    }
    const sets = window.SYMBOL_SETS || {};
    const activeSet = story.symbolSet && sets[story.symbolSet];
    document.documentElement.style.setProperty('--glyph-font', (activeSet && activeSet.fontFamily) || "'Noto Sans Symbols', sans-serif");
  }
  function pvUpdateStability(){
    pvStability = Math.max(0, Math.min(100, pvStability));
    pvStabilityFill.style.width = pvStability + '%';
    pvStabilityFill.classList.remove('mid','low');
    pvTerminal.classList.remove('unstable','critical');
    if(pvStability <= 30){ pvStabilityFill.classList.add('low'); pvTerminal.classList.add('critical'); }
    else if(pvStability <= 60){ pvStabilityFill.classList.add('mid'); pvTerminal.classList.add('unstable'); }
  }
  function pvUpdateMistakeUI(){
    pvMistakeCounter.textContent = t('game.totalMistakes', {count: pvMistakes, max: pvMaxTotalMistakes});
    pvMistakeCounter.classList.remove('tier1','tier2','tier3');
    pvTerminal.classList.remove('tier1','tier2','tier3');
    let tier = null;
    if(pvMistakes >= pvMaxTotalMistakes * 0.8) tier = 'tier3'; else if(pvMistakes >= pvMaxTotalMistakes * 0.6) tier = 'tier2'; else if(pvMistakes >= pvMaxTotalMistakes * 0.4) tier = 'tier1';
    if(tier){ pvMistakeCounter.classList.add(tier); pvTerminal.classList.add(tier); }
  }
  function pvUpdateMsgMistakeUI(){
    pvMessageMistakeCounter.textContent = t('game.messageMistakes', {count: pvMessageMistakes, max: pvMaxMessageMistakes});
    pvMessageMistakeCounter.classList.remove('tier1','tier2','tier3');
    let tier = null;
    if(pvMessageMistakes >= pvMaxMessageMistakes * 0.8) tier = 'tier3'; else if(pvMessageMistakes >= pvMaxMessageMistakes * 0.6) tier = 'tier2'; else if(pvMessageMistakes >= pvMaxMessageMistakes * 0.4) tier = 'tier1';
    if(tier) pvMessageMistakeCounter.classList.add(tier);
  }
  function pvLettersOf(text){ return text.split('').filter(ch => LETTERS.includes(ch)); }
  function pvIsDecoded(text){ return pvLettersOf(text).every(ch => pvRevealed.has(ch)); }

  function pvRenderMessage(text){
    pvMessageText.innerHTML = '';
    text.split('').forEach(ch=>{
      const span = document.createElement('span');
      if(LETTERS.includes(ch)){
        if(pvRevealed.has(ch)){ span.textContent = ch; span.className = 'letter-solved'; }
        else { span.textContent = pvLetterToSymbol[ch]; span.className = 'glyph'; span.dataset.symbol = pvLetterToSymbol[ch]; }
      } else { span.textContent = ch; }
      pvMessageText.appendChild(span);
    });
    if(!pvIsDecoded(text)){
      const cursor = document.createElement('span');
      cursor.className = 'cursor-blink';
      cursor.textContent = '█';
      pvMessageText.appendChild(cursor);
    }
  }
  function pvHighlight(symbol){
    pvMessageText.querySelectorAll('.glyph').forEach(s=>{
      s.classList.toggle('symbol-highlight', symbol !== null && s.dataset.symbol === symbol);
    });
  }
  function pvRenderDecodePanel(text){
    pvDecodeArea.innerHTML = '';
    if(pvIsDecoded(text)) return;
    const panel = document.createElement('div');
    panel.className = 'decode-panel';
    const label = document.createElement('div');
    label.className = 'decode-label';
    label.textContent = t('game.decodeLabel');
    panel.appendChild(label);
    const chipRow = document.createElement('div');
    chipRow.className = 'chip-row';
    const uniqueSymbols = [...new Set(pvLettersOf(text).filter(ch=>!pvRevealed.has(ch)).map(ch=>pvLetterToSymbol[ch]))];
    const letterRowHost = document.createElement('div');
    uniqueSymbols.forEach(sym=>{
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.textContent = sym;
      chip.addEventListener('click', ()=>{
        chipRow.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
        chip.classList.add('active');
        pvHighlight(sym);
        pvRenderLetterRow(letterRowHost, sym, text);
      });
      chipRow.appendChild(chip);
    });
    panel.appendChild(chipRow);
    panel.appendChild(letterRowHost);
    pvDecodeArea.appendChild(panel);
  }
  function pvTriggerFlash(){
    pvFlashOverlay.classList.remove('hit');
    void pvFlashOverlay.offsetWidth;
    pvFlashOverlay.classList.add('hit');
  }
  function pvTriggerRewrite(){
    pvMessageMistakes = 0;
    pvUpdateMsgMistakeUI();
    pvDecodeArea.innerHTML = '';
    const notice = document.createElement('div');
    notice.className = 'rewrite-notice';
    notice.textContent = t('game.rewriteNotice');
    pvDecodeArea.appendChild(notice);
    pvMessageText.classList.add('rewriting');
    let ticks = 0;
    const iv = setInterval(()=>{
      pvMessageText.querySelectorAll('span').forEach(span=>{
        if(span.classList.contains('glyph') || span.classList.contains('letter-solved') || span.classList.contains('scrambling')){
          const effSyms = getEffectiveSymbols();
          span.textContent = effSyms[Math.floor(Math.random()*effSyms.length)];
          span.className = 'glyph scrambling';
        }
      });
      ticks++;
      if(ticks >= 8){
        clearInterval(iv);
        pvMessageText.classList.remove('rewriting');
        if(story.corruptNode && story.nodes[story.corruptNode]){
          pvCurrentNodeId = story.corruptNode;
          pvRenderNode();
        } else {
          pvRenderNode();
        }
      }
    }, 90);
  }
  function pvRenderLetterRow(container, symbol, text){
    container.innerHTML = '';
    const row = document.createElement('div');
    row.className = 'letter-row';
    LETTERS.filter(l => !pvRevealed.has(l)).forEach(letter=>{
      const btn = document.createElement('button');
      btn.className = 'letter-btn';
      btn.textContent = letter;
      btn.addEventListener('click', ()=>{
        if(pvSymbolToLetter[symbol] === letter){
          pvRevealed.add(letter);
          pvRenderMessage(text);
          if(pvIsDecoded(text)){ pvDecodeArea.innerHTML=''; pvHint.style.display='none'; setTimeout(pvRenderChoices, 300); }
          else pvRenderDecodePanel(text);
        } else {
          pvMistakes++; pvMessageMistakes++; pvStability--;
          pvUpdateMistakeUI(); pvUpdateMsgMistakeUI(); pvUpdateStability(); pvTriggerFlash();
          if(pvMistakes >= pvMaxTotalMistakes){ setTimeout(pvRenderGameOver, 250); return; }
          if(pvMessageMistakes >= pvMaxMessageMistakes){ setTimeout(pvTriggerRewrite, 250); return; }
        }
      });
      row.appendChild(btn);
    });
    container.appendChild(row);
  }
  function pvRenderChoices(){
    const node = story.nodes[pvCurrentNodeId];
    pvChoiceArea.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'choices';
    (node.choices || []).forEach(choice=>{
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.innerHTML = '<span class="tag">' + t('game.choiceTag') + '</span>' + escapeHtml(choice.label || t('editor.preview.emptyChoiceLabel'));
      btn.addEventListener('click', ()=>{
        pvStability += (choice.delta || 0);
        pvUpdateStability();
        pvCurrentNodeId = choice.next;
        pvDepth++;
        pvRenderNode();
      });
      wrap.appendChild(btn);
    });
    pvChoiceArea.appendChild(wrap);
  }
  function pvRenderEnding(){
    const node = story.nodes[pvCurrentNodeId];
    pvMessageText.parentElement.style.display = 'none';
    pvDecodeArea.innerHTML = ''; pvHint.style.display = 'none'; pvProgressTrail.textContent = '';
    pvChoiceArea.innerHTML = '';
    const title = document.createElement('div');
    title.className = 'ending-title';
    title.textContent = t('ending.titlePrefix', {title: node.title || pvCurrentNodeId});
    const text = document.createElement('div');
    text.className = 'ending-text';
    text.textContent = node.text || t('editor.preview.missingEndingText');
    const restart = document.createElement('button');
    restart.className = 'restart-btn';
    restart.textContent = t('editor.preview.restart');
    restart.addEventListener('click', pvReset);
    pvChoiceArea.appendChild(title);
    pvChoiceArea.appendChild(text);
    pvChoiceArea.appendChild(restart);
  }
  function pvRenderGameOver(){
    pvMessageText.parentElement.style.display = 'none';
    pvDecodeArea.innerHTML = ''; pvHint.style.display = 'none'; pvProgressTrail.textContent = '';
    pvTerminal.classList.add('gameover');
    pvChoiceArea.innerHTML = '';
    const title = document.createElement('div');
    title.className = 'ending-title gameover-title';
    title.textContent = t('editor.preview.gameOverTitle');
    const restart = document.createElement('button');
    restart.className = 'restart-btn';
    restart.textContent = t('editor.preview.restart');
    restart.addEventListener('click', pvReset);
    pvChoiceArea.appendChild(title);
    pvChoiceArea.appendChild(restart);
  }
  function pvRenderNode(){
    previewNodeLabel.textContent = t('editor.preview.nodeLabel', {id: pvCurrentNodeId});
    const node = story.nodes[pvCurrentNodeId];
    if(!node){
      pvChoiceArea.innerHTML = '<div class="ending-text">' + t('editor.preview.brokenRef', {id: pvCurrentNodeId}) + '</div>';
      pvMessageText.parentElement.style.display = 'none';
      pvDecodeArea.innerHTML = '';
      return;
    }
    pvChoiceArea.innerHTML = '';
    pvMessageMistakes = 0;
    pvUpdateMsgMistakeUI();
    if(node.isEnding){
      pvTerminal.classList.remove('aggressive');
      pvRenderEnding();
      return;
    }
    pvTerminal.classList.toggle('aggressive', !!node.aggressive);
    pvProgressTrail.textContent = node.progressLabel ? node.progressLabel : t('game.progressLabel', {n: pvDepth+1, total: (story.totalStages || 5)});
    pvCurrentText = pvPickVariant(node);
    pvInitCipher();
    pvMessageText.parentElement.style.display = 'flex';
    pvRenderMessage(pvCurrentText);
    pvHint.style.display = 'block';
    pvRenderDecodePanel(pvCurrentText);
  }
  function pvReset(){
    pvApplyDifficulty();
    pvStability = 70; pvMistakes = 0; pvMessageMistakes = 0; pvDepth = 0;
    pvCurrentNodeId = story.startNode;
    pvTerminal.classList.remove('gameover','tier1','tier2','tier3','unstable','critical','aggressive');
    pvStatusLabel.textContent = (story.title || t('editor.preview.statusLabel')) + ' // ' + (story.tagline || '');
    pvUpdateStability(); pvUpdateMistakeUI(); pvUpdateMsgMistakeUI();
    pvRenderNode();
  }

  document.getElementById('btnPreview').addEventListener('click', ()=>{
    if(!story.startNode || !story.nodes[story.startNode]){
      alert(t('editor.alert.needStartNode'));
      return;
    }
    previewModal.style.display = 'flex';
    renderPvDifficultyPicker(document.getElementById('pvDifficultyPicker'));
    pvReset();
  });
  document.getElementById('btnClosePreview').addEventListener('click', ()=>{
    previewModal.style.display = 'none';
  });

  // ---------- Avvio: carica prima le stringhe dell'interfaccia ----------
  window.I18N.load('lang/it.json', 'LANG_IT_FALLBACK').then(()=>{
    applyI18n();
    story = blankStory();
  }).catch(()=>{
    // procede comunque: I18N.get restituisce la chiave se non trova traduzioni
  }).finally(()=>{
    renderSettingsForm();
    renderNodeList();
    renderNodeEditor();
  });

})();
