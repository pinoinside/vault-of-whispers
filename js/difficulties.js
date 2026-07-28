// Registro dei livelli di difficolta', condiviso tra gioco ed editor (anteprima).
// N = story.totalStages (numero di tappe della storia).
// maxPerMessage = errori massimi sullo stesso messaggio prima della riscrittura.
// totalFormula(n) = errori massimi totali prima del game over.
// vowelHelp = le vocali risultano gia' decodificate fin dall'inizio di ogni messaggio.
window.DIFFICULTIES = {
  baby:      { maxPerMessage: 15, vowelHelp: true,  totalFormula: function(n){ return n * 10; } },
  normale:   { maxPerMessage: 10, vowelHelp: false, totalFormula: function(n){ return Math.round(n * 5); } },
  serio:     { maxPerMessage: 5,  vowelHelp: false, totalFormula: function(n){ return Math.round((n / 2) * 7); } },
  demoniaco: { maxPerMessage: 3,  vowelHelp: false, totalFormula: function(n){ return Math.round(n * 1); } }
};

// Ordine di visualizzazione nei selettori (dal piu' facile al piu' difficile).
window.DIFFICULTY_ORDER = ['baby', 'normale', 'serio', 'demoniaco'];
