(function(){

  const DEFAULT_SYMBOLS = ["☠","☣","☢","☯","⚛","⚗","⚜","⚓","⚔","⚖","⚙","⚠","☮","☤","⚕","⚰","⚱","⛧","⚹","⚥","☍","☄","☾","☉","⛓","⛏","⚒","⚑","⚘","☊"];
  const LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];

  function blankStory(){
    return {
      title: "NUOVA STORIA",
      tagline: "una breve riga d'atmosfera",
      totalStages: 5,
      startNode: "root",
      corruptNode: "CORRUPT1",
      symbols: DEFAULT_SYMBOLS.slice(),
      nodes: {
        root: {
          variants: [
            "SCRIVI QUI LA PRIMA VARIANTE DEL MESSAGGIO INIZIALE.",
            "SCRIVI QUI LA SECONDA VARIANTE, STESSO SIGNIFICATO.",
            "SCRIVI QUI LA TERZA VARIANTE."
          ],
          choices: [
            { label: "Prima scelta", next: "E1", delta: 0 },
            { label: "Seconda scelta", next: "E2", delta: 0 },
            { label: "Terza scelta", next: "E3", delta: 0 }
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
  const fStages = document.getElementById('fStages');
  const fStartNode = document.getElementById('fStartNode');
  const fCorruptNode = document.getElementById('fCorruptNode');
  const fSymbols = document.getElementById('fSymbols');
  const symbolsCount = document.getElementById('symbolsCount');
  const symbolsPreview = document.getElementById('symbolsPreview');
  const nodeList = document.getElementById('nodeList');
  const nodeEditor = document.getElementById('nodeEditor');
  const validationOutput = document.getElementById('validationOutput');
  const fileInput = document.getElementById('fileInput');

  // ---------- Tabs ----------
  document.querySelectorAll('.ed-tab').forEach(tab=>{
    tab.addEventListener('click', ()=>{
      document.querySelectorAll('.ed-tab').forEach(t=>t.classList.remove('active'));
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
      emptyOpt.textContent = '— nessuno —';
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

  function renderSettingsForm(){
    fTitle.value = story.title || '';
    fTagline.value = story.tagline || '';
    fStages.value = story.totalStages || 1;
    fSymbols.value = story.symbols.join(' ');
    refreshNodeSelects();
    renderSymbolsPreview();
  }

  function renderSymbolsPreview(){
    const syms = story.symbols;
    symbolsPreview.innerHTML = '';
    syms.forEach(s=>{
      const span = document.createElement('span');
      span.textContent = s;
      symbolsPreview.appendChild(span);
    });
    symbolsCount.textContent = syms.length + ' simboli (' + LETTERS.length + ' lettere richieste come minimo)';
    symbolsCount.classList.toggle('warn', syms.length < LETTERS.length);
  }

  fTitle.addEventListener('input', ()=>{ story.title = fTitle.value; });
  fTagline.addEventListener('input', ()=>{ story.tagline = fTagline.value; });
  fStages.addEventListener('input', ()=>{ story.totalStages = parseInt(fStages.value, 10) || 1; });
  fStartNode.addEventListener('change', ()=>{ story.startNode = fStartNode.value; renderNodeList(); });
  fCorruptNode.addEventListener('change', ()=>{ story.corruptNode = fCorruptNode.value; renderNodeList(); });
  fSymbols.addEventListener('input', ()=>{
    story.symbols = fSymbols.value.split(/[,\s]+/).map(s=>s.trim()).filter(Boolean);
    renderSymbolsPreview();
  });
  document.getElementById('btnDefaultSymbols').addEventListener('click', ()=>{
    story.symbols = DEFAULT_SYMBOLS.slice();
    fSymbols.value = story.symbols.join(' ');
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
        if(id === story.startNode) badges += '<span class="node-badge">start</span>';
        if(id === story.corruptNode) badges += '<span class="node-badge badge-danger">corrupt</span>';
        if(story.nodes[id].aggressive) badges += '<span class="node-badge badge-danger">aggr</span>';
        item.innerHTML = '<span class="node-id">' + id + '</span><span>' + badges + '</span>';
        item.title = reach.has(id) ? '' : 'Nodo irraggiungibile da startNode/corruptNode';
        item.addEventListener('click', ()=>{ currentNodeId = id; renderNodeList(); renderNodeEditor(); });
        nodeList.appendChild(item);
      });
    }
    addGroup('Nodi di storia', storyIds);
    addGroup('Finali', endingIds);

    const addBtn = document.createElement('button');
    addBtn.className = 'ed-btn ed-btn-block';
    addBtn.textContent = '+ Nuovo nodo';
    addBtn.addEventListener('click', addNewNode);
    nodeList.appendChild(addBtn);
  }

  function addNewNode(){
    let id = prompt('ID del nuovo nodo (senza spazi, es. P1):');
    if(!id) return;
    id = id.trim();
    if(!id || story.nodes[id]){ alert('ID mancante o gia\' esistente.'); return; }
    const isEnding = confirm('E\' un nodo finale?\nOK = finale · Annulla = nodo di storia');
    if(isEnding){
      story.nodes[id] = { isEnding: true, title: "NUOVO FINALE", text: "Testo del finale." };
    } else {
      story.nodes[id] = {
        variants: ["PRIMA VARIANTE.", "SECONDA VARIANTE.", "TERZA VARIANTE."],
        choices: [
          { label: "Scelta 1", next: story.startNode || id, delta: 0 },
          { label: "Scelta 2", next: story.startNode || id, delta: 0 },
          { label: "Scelta 3", next: story.startNode || id, delta: 0 }
        ]
      };
    }
    currentNodeId = id;
    refreshNodeSelects();
    renderNodeList();
    renderNodeEditor();
  }

  function renameNode(oldId){
    let newId = prompt('Nuovo ID per il nodo:', oldId);
    if(!newId) return;
    newId = newId.trim();
    if(!newId || newId === oldId) return;
    if(story.nodes[newId]){ alert('Esiste gia\' un nodo con questo ID.'); return; }
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
    if(!confirm('Eliminare il nodo "' + id + '"? Le scelte che puntano qui resteranno rotte finche\' non le correggi.')) return;
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
      nodeEditor.innerHTML = '<div class="node-editor-empty">Seleziona un nodo dalla lista, oppure creane uno nuovo.</div>';
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
        '<button class="ed-btn ed-btn-small" id="btnRename">Rinomina</button> ' +
        '<button class="ed-btn ed-btn-small ed-btn-danger" id="btnDelete">Elimina nodo</button>' +
      '</span>';
    nodeEditor.appendChild(head);
    head.querySelector('#btnRename').addEventListener('click', ()=> renameNode(id));
    head.querySelector('#btnDelete').addEventListener('click', ()=> deleteNode(id));

    const typeRow = document.createElement('div');
    typeRow.className = 'ed-checkbox-row';
    typeRow.innerHTML =
      '<input type="checkbox" id="cbIsEnding" ' + (node.isEnding ? 'checked' : '') + '> ' +
      '<label for="cbIsEnding">Questo e\' un nodo finale (mostra testo in chiaro e termina la partita)</label>';
    nodeEditor.appendChild(typeRow);
    typeRow.querySelector('#cbIsEnding').addEventListener('change', (e)=>{
      if(e.target.checked){
        node.isEnding = true;
        if(!node.title) node.title = 'NUOVO FINALE';
        if(!node.text) node.text = '';
      } else {
        delete node.isEnding;
        if(!node.variants) node.variants = ["PRIMA VARIANTE.", "SECONDA VARIANTE.", "TERZA VARIANTE."];
        if(!node.choices) node.choices = [{label:"Scelta 1", next:id, delta:0}];
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
      '<div class="ed-field"><label class="ed-label">Titolo del finale</label>' +
      '<input type="text" class="ed-input" id="edTitle" value="' + escapeHtmlAttr(node.title || '') + '"></div>' +
      '<div class="ed-field"><label class="ed-label">Testo del finale (in chiaro, nessuna restrizione di lettere)</label>' +
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
      '<label for="cbAggressive">Nodo aggressivo (usato tipicamente per corruptNode: tono visivo piu\' ostile)</label>';
    wrap.appendChild(aggRow);
    aggRow.querySelector('#cbAggressive').addEventListener('change', (e)=>{
      if(e.target.checked) node.aggressive = true; else delete node.aggressive;
    });

    const plField = document.createElement('div');
    plField.className = 'ed-field';
    plField.innerHTML =
      '<label class="ed-label">Etichetta di avanzamento personalizzata (progressLabel, opzionale)</label>' +
      '<input type="text" class="ed-input" id="edProgressLabel" value="' + escapeHtmlAttr(node.progressLabel || '') + '" placeholder="es. INTERFERENZA CRITICA — ...">';
    wrap.appendChild(plField);
    plField.querySelector('#edProgressLabel').addEventListener('input', (e)=>{
      node.progressLabel = e.target.value || undefined;
      if(!node.progressLabel) delete node.progressLabel;
    });

    // Varianti
    const variantsField = document.createElement('div');
    variantsField.className = 'ed-field';
    variantsField.innerHTML = '<label class="ed-label">Varianti del messaggio (in MAIUSCOLO)</label>';
    const variantsHost = document.createElement('div');
    variantsField.appendChild(variantsHost);
    const addVariantBtn = document.createElement('button');
    addVariantBtn.className = 'ed-btn ed-btn-small';
    addVariantBtn.textContent = '+ variante';
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
          (node.variants.length > 1 ? '<button class="row-remove-btn" style="margin-top:6px;">Rimuovi variante</button>' : '');
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
    choicesField.innerHTML = '<label class="ed-label">Scelte del giocatore</label>';
    const choicesHost = document.createElement('div');
    choicesField.appendChild(choicesHost);
    const addChoiceBtn = document.createElement('button');
    addChoiceBtn.className = 'ed-btn ed-btn-small';
    addChoiceBtn.textContent = '+ scelta';
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
          '<input type="text" class="ed-input choice-label" placeholder="testo del pulsante" value="' + escapeHtmlAttr(c.label || '') + '">' +
          '<select class="ed-select choice-next">' + nodeOptionsHtml(c.next) + '</select>' +
          '<input type="number" class="ed-input choice-delta" value="' + (c.delta || 0) + '" title="delta stabilita\'">' +
          (node.choices.length > 1 ? '<button class="row-remove-btn">Rimuovi</button>' : '');
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
    // reverse graph BFS a partire da tutti i finali
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

    if(!story.title || !story.title.trim()) add('err', 'Manca il titolo della storia.');
    if(!story.symbols || story.symbols.length < LETTERS.length){
      add('err', 'Servono almeno ' + LETTERS.length + ' simboli diversi (attuali: ' + (story.symbols ? story.symbols.length : 0) + ').');
    } else if(new Set(story.symbols).size !== story.symbols.length){
      add('warn', 'Ci sono simboli duplicati nella lista.');
    }
    if(!story.startNode || !story.nodes[story.startNode]){
      add('err', 'startNode non e\' impostato o non esiste tra i nodi.');
    }
    if(story.corruptNode){
      if(!story.nodes[story.corruptNode]) add('err', 'corruptNode punta a un nodo inesistente ("' + story.corruptNode + '").');
      else if(story.nodes[story.corruptNode].isEnding) add('err', 'corruptNode punta a un finale: deve essere un nodo di storia giocabile.');
    } else {
      add('warn', 'Nessun corruptNode impostato: il ramo per troppi errori sullo stesso messaggio non e\' configurato.');
    }

    const reach = computeReachability();
    const canReachEnding = computeCanReachEnding();

    Object.entries(story.nodes).forEach(([id, n])=>{
      if(n.isEnding){
        if(!n.title || !n.title.trim()) add('warn', 'Il finale "' + id + '" non ha un titolo.');
        if(!n.text || !n.text.trim()) add('warn', 'Il finale "' + id + '" non ha testo.');
      } else {
        if(!n.variants || !n.variants.length) add('err', 'Il nodo "' + id + '" non ha varianti di testo.');
        else if(n.variants.length !== 3) add('warn', 'Il nodo "' + id + '" ha ' + n.variants.length + ' variante/i invece di 3 (funziona comunque).');
        if(n.variants) n.variants.forEach((v,i)=>{ if(!v || !v.trim()) add('warn', 'Il nodo "' + id + '" ha la variante #' + (i+1) + ' vuota.'); });

        if(!n.choices || !n.choices.length) add('err', 'Il nodo "' + id + '" non ha scelte: e\' un vicolo cieco.');
        else {
          if(n.choices.length !== 3) add('warn', 'Il nodo "' + id + '" ha ' + n.choices.length + ' scelta/e invece di 3 (funziona comunque).');
          n.choices.forEach((c, i)=>{
            if(!c.label || !c.label.trim()) add('warn', 'Il nodo "' + id + '", scelta #' + (i+1) + ', non ha testo sul pulsante.');
            if(!c.next) add('err', 'Il nodo "' + id + '", scelta #' + (i+1) + ', non punta a nessun nodo.');
            else if(!story.nodes[c.next]) add('err', 'Il nodo "' + id + '", scelta #' + (i+1) + ', punta a un nodo inesistente ("' + c.next + '").');
          });
        }
      }
      if(!reach.has(id)) add('warn', 'Il nodo "' + id + '" non e\' raggiungibile ne\' da startNode ne\' da corruptNode.');
      else if(!n.isEnding && !canReachEnding.has(id)) add('err', 'Il nodo "' + id + '" e\' raggiungibile ma nessuna delle sue scelte porta mai a un finale (vicolo cieco o ciclo chiuso).');
    });

    if(items.length === 0) add('ok', 'Nessun problema rilevato. La storia sembra pronta.');

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
    if(!confirm('Creare una nuova storia vuota? Il lavoro non salvato andra\' perso.')) return;
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
        if(!story.symbols) story.symbols = DEFAULT_SYMBOLS.slice();
        currentNodeId = story.startNode && story.nodes[story.startNode] ? story.startNode : Object.keys(story.nodes)[0] || null;
        renderSettingsForm();
        renderNodeList();
        renderNodeEditor();
      } catch(err){
        alert('Impossibile leggere il file: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('btnExport').addEventListener('click', ()=>{
    const ok = runValidation();
    document.querySelectorAll('.ed-tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.editor-panel').forEach(p=>p.style.display='none');
    document.querySelector('.ed-tab[data-tab="validation"]').classList.add('active');
    document.getElementById('tab-validation').style.display='block';
    if(!ok && !confirm('La convalida ha trovato errori bloccanti. Esportare comunque il JSON?')) return;

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
    const shuffled = pvShuffle(story.symbols.length ? story.symbols : DEFAULT_SYMBOLS);
    pvLetterToSymbol = {}; pvSymbolToLetter = {};
    LETTERS.forEach((l,i)=>{
      pvLetterToSymbol[l] = shuffled[i % shuffled.length];
      pvSymbolToLetter[shuffled[i % shuffled.length]] = l;
    });
    pvRevealed = new Set();
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
    pvMistakeCounter.textContent = 'TOTALI: ' + pvMistakes + '/50';
    pvMistakeCounter.classList.remove('tier1','tier2','tier3');
    pvTerminal.classList.remove('tier1','tier2','tier3');
    let tier = null;
    if(pvMistakes >= 40) tier = 'tier3'; else if(pvMistakes >= 30) tier = 'tier2'; else if(pvMistakes >= 20) tier = 'tier1';
    if(tier){ pvMistakeCounter.classList.add(tier); pvTerminal.classList.add(tier); }
  }
  function pvUpdateMsgMistakeUI(){
    pvMessageMistakeCounter.textContent = 'MESSAGGIO: ' + pvMessageMistakes + '/10';
    pvMessageMistakeCounter.classList.remove('tier1','tier2','tier3');
    let tier = null;
    if(pvMessageMistakes >= 8) tier = 'tier3'; else if(pvMessageMistakes >= 6) tier = 'tier2'; else if(pvMessageMistakes >= 4) tier = 'tier1';
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
    label.textContent = 'Simboli non decifrati';
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
    notice.textContent = "IL MESSAGGIO SI DISSOLVE...";
    pvDecodeArea.appendChild(notice);
    pvMessageText.classList.add('rewriting');
    let ticks = 0;
    const iv = setInterval(()=>{
      pvMessageText.querySelectorAll('span').forEach(span=>{
        if(span.classList.contains('glyph') || span.classList.contains('letter-solved') || span.classList.contains('scrambling')){
          span.textContent = story.symbols[Math.floor(Math.random()*story.symbols.length)];
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
          if(pvMistakes >= 50){ setTimeout(pvRenderGameOver, 250); return; }
          if(pvMessageMistakes >= 10){ setTimeout(pvTriggerRewrite, 250); return; }
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
      btn.innerHTML = '<span class="tag">></span>' + escapeHtml(choice.label || '(scelta senza testo)');
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
    title.textContent = 'FINE // ' + (node.title || pvCurrentNodeId);
    const text = document.createElement('div');
    text.className = 'ending-text';
    text.textContent = node.text || '(testo del finale mancante)';
    const restart = document.createElement('button');
    restart.className = 'restart-btn';
    restart.textContent = 'Riavvia anteprima';
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
    title.textContent = 'SEGNALE PERSO (anteprima: 50 errori totali)';
    const restart = document.createElement('button');
    restart.className = 'restart-btn';
    restart.textContent = 'Riavvia anteprima';
    restart.addEventListener('click', pvReset);
    pvChoiceArea.appendChild(title);
    pvChoiceArea.appendChild(restart);
  }
  function pvRenderNode(){
    previewNodeLabel.textContent = 'nodo corrente: ' + pvCurrentNodeId;
    const node = story.nodes[pvCurrentNodeId];
    if(!node){
      pvChoiceArea.innerHTML = '<div class="ending-text">Riferimento rotto: il nodo "' + pvCurrentNodeId + '" non esiste.</div>';
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
    pvProgressTrail.textContent = node.progressLabel ? node.progressLabel : ('Intrusione ' + (pvDepth+1) + ' di ' + (story.totalStages || 5));
    pvCurrentText = pvPickVariant(node);
    pvInitCipher();
    pvMessageText.parentElement.style.display = 'flex';
    pvRenderMessage(pvCurrentText);
    pvHint.style.display = 'block';
    pvRenderDecodePanel(pvCurrentText);
  }
  function pvReset(){
    pvStability = 70; pvMistakes = 0; pvMessageMistakes = 0; pvDepth = 0;
    pvCurrentNodeId = story.startNode;
    pvTerminal.classList.remove('gameover','tier1','tier2','tier3','unstable','critical','aggressive');
    pvStatusLabel.textContent = (story.title || 'ANTEPRIMA') + ' // ' + (story.tagline || '');
    pvUpdateStability(); pvUpdateMistakeUI(); pvUpdateMsgMistakeUI();
    pvRenderNode();
  }

  document.getElementById('btnPreview').addEventListener('click', ()=>{
    if(!story.startNode || !story.nodes[story.startNode]){
      alert('Imposta un startNode valido prima di avviare l\'anteprima.');
      return;
    }
    previewModal.style.display = 'flex';
    pvReset();
  });
  document.getElementById('btnClosePreview').addEventListener('click', ()=>{
    previewModal.style.display = 'none';
  });

  // ---------- Avvio ----------
  renderSettingsForm();
  renderNodeList();
  renderNodeEditor();

})();
