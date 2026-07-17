// Sistema minimo di caricamento testi dell'interfaccia, pensato per un futuro multilingue.
// Uso: I18N.load('lang/it.json', 'LANG_IT_FALLBACK').then(() => { ... });
//      I18N.get('intro.cancelBtn')
//      I18N.get('game.progressLabel', { n: 2, total: 7 })
window.I18N = (function(){
  let strings = null;

  function resolve(key){
    if(!strings) return undefined;
    return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), strings);
  }

  function get(key, vars){
    const value = resolve(key);
    if(typeof value !== 'string'){
      // Nessuna traduzione trovata: mostra la chiave stessa, così l'errore è visibile e non silenzioso.
      return value === undefined ? key : value;
    }
    if(!vars) return value;
    return value.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? vars[name] : match));
  }

  // Come get(), ma per array di stringhe (es. paragrafi multipli).
  function getArray(key){
    const value = resolve(key);
    return Array.isArray(value) ? value : [];
  }

  async function load(path, fallbackGlobalName){
    try{
      const res = await fetch(path);
      if(!res.ok) throw new Error('http ' + res.status);
      strings = await res.json();
    } catch(err){
      if(fallbackGlobalName && window[fallbackGlobalName]){
        strings = window[fallbackGlobalName];
      } else {
        throw err;
      }
    }
    return strings;
  }

  return { load, get, getArray };
})();
