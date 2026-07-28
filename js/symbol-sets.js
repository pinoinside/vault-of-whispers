// Registro dei set di simboli disponibili a livello di motore.
// Una storia puo' indicare quale usare col campo "symbolSet" (per nome).
// Se il campo manca, o il nome non corrisponde a nessun set qui sotto,
// si usa il set marcato "default": true. Se una storia fornisce comunque
// un proprio array "symbols" esplicito, quello ha sempre la precedenza
// (compatibilita' con le storie gia' esistenti).
window.SYMBOL_SETS = {
  "occulto": {
    "label": "Occulto",
    "default": true,
    "fontFamily": "'Noto Sans Symbols', sans-serif",
    "symbols": [
      "☠",
      "☣",
      "☢",
      "☯",
      "⚛",
      "⚗",
      "⚜",
      "⚓",
      "⚔",
      "⚖",
      "⚙",
      "⚠",
      "☮",
      "☤",
      "⚕",
      "⚰",
      "⚱",
      "⛧",
      "⚹",
      "⚥",
      "☍",
      "☄",
      "☾",
      "☉",
      "⛓",
      "⛏",
      "⚒",
      "⚑",
      "⚘",
      "☊"
    ]
  },
  "braille": {
    "label": "Braille",
    "fontFamily": "'Noto Sans Symbols', sans-serif",
    "symbols": [
      "⠃",
      "⠋",
      "⠓",
      "⠛",
      "⠣",
      "⠫",
      "⠳",
      "⠻",
      "⡃",
      "⡋",
      "⡓",
      "⡛",
      "⡣",
      "⡫",
      "⡳",
      "⡻",
      "⢃",
      "⢋",
      "⢓",
      "⢛",
      "⢣",
      "⢫",
      "⢳",
      "⢻",
      "⣃",
      "⣋",
      "⣓",
      "⣛",
      "⣣",
      "⣫"
    ]
  }
};
