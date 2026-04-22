/**
 * MoodWeaver — Emotionally-adaptive generative art & poetry engine.
 * Creates synesthetic compositions that blend visual patterns with mood-driven text.
 * @module MoodWeaver
 */

// === Seeded PRNG (Mulberry32) ===
/**
 * Create a seeded pseudo-random number generator for reproducible creativity.
 * @param {number} seed - Integer seed value
 * @returns {{ next: Function, pick: Function, shuffle: Function }}
 * @example
 *   var r = rng(42);
 *   r.next()       // 0.0..1.0
 *   r.pick(['a','b','c'])  // deterministic pick
 */
function rng(seed) {
  var s = seed | 0;
  function next() {
    s = (s + 0x6D2B79F5) | 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function pick(arr) { return arr[(next() * arr.length) | 0]; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = (next() * (i + 1)) | 0;
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }
  return { next: next, pick: pick, shuffle: shuffle };
}

// === Emotion Lexicon ===
var emotions = {
  joy: {
    words: ['radiant','laughter','bloom','dance','sunlit','golden','warmth','delight','shimmer','glow','jubilant','bright','sparkling','elated','serene'],
    symbols: ['☀','✦','✿','♫','⚘'],
    palette: ['█','▓','░','·','°'],
    patterns: ['rise','wave','spiral']
  },
  melancholy: {
    words: ['shadow','whisper','fading','drift','mist','grey','hollow','ache','distant','rain','solitude','echo','dusk','wither','silence'],
    symbols: ['☁','◌','∘','⋯','▫'],
    palette: ['▓','░','·','∘',' '],
    patterns: ['fall','scatter','fade']
  },
  wonder: {
    words: ['infinite','cosmos','crystalline','aurora','nebula','stardust','vast','luminous','ethereal','dream','enigma','fractal','transcend','aether','celestial'],
    symbols: ['★','◇','✧','∞','⊹'],
    palette: ['★','✧','·','∘',' '],
    patterns: ['expand','orbit','shimmer']
  },
  fury: {
    words: ['blaze','shatter','storm','thunder','crimson','fierce','ignite','roar','clash','eruption','tempest','searing','surge','turmoil','volcanic'],
    symbols: ['⚡','✕','▲','◆','⬡'],
    palette: ['█','▓','▲','✕','·'],
    patterns: ['burst','zigzag','pulse']
  }
};

// === Pattern Art Generator ===
/**
 * Generate mood-driven ASCII pattern art — visual representation of an emotion.
 * @param {string} mood - One of: joy, melancholy, wonder, fury
 * @param {Object} [opts] - Options
 * @param {number} [opts.width=40] - Pattern width
 * @param {number} [opts.height=12] - Pattern height
 * @param {number} [opts.seed=1] - PRNG seed
 * @returns {{ mood: string, pattern: string, description: string }}
 * @example
 *   patternArt('wonder', { width: 30, height: 8, seed: 7 })
 */
function patternArt(mood, opts) {
  opts = opts || {};
  var w = opts.width || 40;
  var h = opts.height || 12;
  var r = rng(opts.seed || 1);
  var emo = emotions[mood] || emotions.joy;
  var pal = emo.palette;
  var rows = [];
  var patType = r.pick(emo.patterns);

  for (var y = 0; y < h; y++) {
    var row = '';
    for (var x = 0; x < w; x++) {
      var val = 0;
      if (patType === 'rise') val = (y + x * 0.3 + r.next() * 2) / h;
      else if (patType === 'wave') val = (0.5 + 0.5 * Math.sin((x + y * 0.5) * 0.4 + r.next())) ;
      else if (patType === 'spiral') { var cx = x - w/2, cy = y - h/2; val = ((Math.atan2(cy, cx) / 3.14 + 1) / 2 + (cx*cx+cy*cy)*0.003) % 1; }
      else if (patType === 'fall') val = 1 - (y + r.next() * 3) / (h + 3);
      else if (patType === 'scatter') val = r.next();
      else if (patType === 'fade') val = 1 - y / h + r.next() * 0.2;
      else if (patType === 'expand') { var dx = x - w/2, dy = y - h/2; val = 1 - Math.sqrt(dx*dx + dy*dy) / (w * 0.6); }
      else if (patType === 'orbit') { var ox = x - w/2, oy = y - h/2; val = (Math.sin(ox * 0.3) * Math.cos(oy * 0.5) + 1) / 2; }
      else if (patType === 'shimmer') val = (r.next() + Math.sin(x * 0.5) * 0.3 + 0.5);
      else if (patType === 'burst') { var bx = x - w/2, by = y - h/2; val = Math.max(0, 1 - Math.sqrt(bx*bx+by*by)/(w*0.4)) + r.next()*0.3; }
      else if (patType === 'zigzag') val = ((x + (y % 2 === 0 ? y : -y) * 0.5 + r.next()) % w) / w;
      else if (patType === 'pulse') val = (Math.sin(x * 0.4 + y * 0.4) + 1) / 2;
      val = Math.max(0, Math.min(1, val));
      var idx = (val * (pal.length - 1) + 0.5) | 0;
      if (r.next() < 0.03) row += r.pick(emo.symbols);
      else row += pal[idx];
    }
    rows.push(row);
  }
  var frame = emo.symbols[0] + '─'.repeat(w) + emo.symbols[0];
  var desc = 'A ' + patType + ' pattern expressing ' + mood + ' through ' + w + 'x' + h + ' ASCII art';
  return { mood: mood, pattern: frame + '\n' + rows.join('\n') + '\n' + frame, description: desc };
}

// === Mood-Driven Poem Generator ===
/**
 * Generate an emotionally-coherent poem adapted to the given mood.
 * @param {string} mood - Emotion: joy, melancholy, wonder, fury
 * @param {Object} [opts] - Options
 * @param {number} [opts.stanzas=2] - Number of stanzas
 * @param {number} [opts.linesPerStanza=4] - Lines per stanza
 * @param {number} [opts.seed=1] - PRNG seed
 * @returns {{ mood: string, title: string, text: string, formatted: string }}
 * @example
 *   moodPoem('melancholy', { stanzas: 3, seed: 99 })
 */
function moodPoem(mood, opts) {
  opts = opts || {};
  var stanzas = opts.stanzas || 2;
  var lps = opts.linesPerStanza || 4;
  var r = rng(opts.seed || 1);
  var emo = emotions[mood] || emotions.joy;
  var w = emo.words;

  var templates = [
    function() { return 'The ' + r.pick(w) + ' ' + r.pick(w) + ' of ' + r.pick(w); },
    function() { return 'Where ' + r.pick(w) + ' meets the ' + r.pick(w); },
    function() { return 'I ' + r.pick(['feel','see','hear','taste','breathe']) + ' the ' + r.pick(w); },
    function() { return 'A ' + r.pick(w) + ' ' + r.pick(['moment','breath','heartbeat','thought','vision']); },
    function() { return 'Through ' + r.pick(w) + ' and ' + r.pick(w); },
    function() { return 'Like ' + r.pick(w) + ' upon the ' + r.pick(w); },
    function() { return r.pick(['Beneath','Beyond','Within','Against']) + ' the ' + r.pick(w) + ' sky'; },
    function() { return 'And ' + r.pick(w) + ' ' + r.pick(['remains','dissolves','transforms','awakens']); }
  ];

  var titleTemplates = [
    function() { return r.pick(w).charAt(0).toUpperCase() + r.pick(w).slice(1) + ' ' + r.pick(['Elegy','Ode','Nocturne','Hymn','Reverie','Psalm','Lament','Sonata']); },
    function() { return 'The ' + r.pick(w).charAt(0).toUpperCase() + r.pick(w).slice(1) + ' Within'; }
  ];

  var title = r.pick(titleTemplates)();
  var body = [];
  for (var s = 0; s < stanzas; s++) {
    var lines = [];
    for (var l = 0; l < lps; l++) {
      lines.push(r.pick(templates)());
    }
    body.push(lines.join('\n'));
  }
  var text = body.join('\n\n');
  var formatted = '  ' + title + '\n  ' + '═'.repeat(title.length) + '\n\n' + text;
  return { mood: mood, title: title, text: text, formatted: formatted };
}

// === Haiku Generator ===
/**
 * Generate a mood-themed haiku (5-7-5 syllable structure approximated).
 * @param {string} mood - Emotion theme
 * @param {number} [seed=1] - PRNG seed
 * @returns {{ mood: string, lines: string[], formatted: string }}
 * @example
 *   haiku('fury', 77)
 */
function haiku(mood, seed) {
  var r = rng(seed || 1);
  var emo = emotions[mood] || emotions.joy;
  var w = emo.words;
  var templates = [
    [function(){return r.pick(w)+' '+r.pick(w);}, function(){return 'the '+r.pick(w)+' '+r.pick(w)+' calls';}, function(){return r.pick(w)+' '+r.pick(['remains','awaits']);}],
    [function(){return 'a '+r.pick(w)+' '+r.pick(['dawn','dusk']);}, function(){return r.pick(w)+' and '+r.pick(w)+' entwine';}, function(){return r.pick(['silence','stillness'])+' '+r.pick(['falls','grows']);}],
    [function(){return r.pick(w)+' in the '+r.pick(['air','night']);}, function(){return r.pick(w)+' whispers to the '+r.pick(['void','wind','dark']);}, function(){return 'a '+r.pick(w)+' '+r.pick(['fades','blooms']);}]
  ];
  var t = r.pick(templates);
  var lines = [t[0](), t[1](), t[2]()];
  return { mood: mood, lines: lines, formatted: lines.join('\n') };
}

// === Synesthetic Composition ===
/**
 * Create a full synesthetic composition: pattern art + haiku + poem unified by mood.
 * @param {Object} [opts] - Options
 * @param {string} [opts.mood=joy] - Emotional theme
 * @param {number} [opts.seed=42] - PRNG seed
 * @returns {{ mood: string, art: Object, haiku: Object, poem: Object, formatted: string }}
 * @example
 *   compose({ mood: 'wonder', seed: 7 })
 */
function compose(opts) {
  opts = opts || {};
  var mood = opts.mood || 'joy';
  var seed = opts.seed || 42;
  var art = patternArt(mood, { width: 36, height: 8, seed: seed });
  var hk = haiku(mood, seed + 10);
  var pm = moodPoem(mood, { stanzas: 2, linesPerStanza: 3, seed: seed + 20 });
  var emo = emotions[mood] || emotions.joy;
  var divider = emo.symbols.join(' '.repeat(5));

  var parts = [
    '╔══════════════════════════════════════╗',
    '║  MoodWeaver: ' + mood.toUpperCase() + ' Composition' + ' '.repeat(Math.max(0, 22 - mood.length)) + '║',
    '╚══════════════════════════════════════╝',
    '',
    art.pattern,
    '',
    divider,
    '',
    hk.formatted,
    '',
    divider,
    '',
    pm.formatted
  ];
  return { mood: mood, art: art, haiku: hk, poem: pm, formatted: parts.join('\n') };
}

// === Mood Blend ===
/**
 * Blend two moods together to create a transitional composition showing emotional shift.
 * @param {string} moodA - Starting mood
 * @param {string} moodB - Ending mood
 * @param {number} [seed=1] - PRNG seed
 * @returns {{ from: string, to: string, haiku: Object, poemA: Object, poemB: Object, formatted: string }}
 * @example
 *   blend('joy', 'melancholy', 33)
 */
function blend(moodA, moodB, seed) {
  var r = rng(seed || 1);
  var hk = haiku(moodA, seed);
  var pa = moodPoem(moodA, { stanzas: 1, linesPerStanza: 3, seed: seed });
  var pb = moodPoem(moodB, { stanzas: 1, linesPerStanza: 3, seed: seed + 50 });
  var emoA = emotions[moodA] || emotions.joy;
  var emoB = emotions[moodB] || emotions.joy;
  var transition = emoA.symbols[0] + ' → ' + emoB.symbols[0];
  var formatted = '[ ' + moodA.toUpperCase() + ' ]\n\n' + pa.formatted + '\n\n  ' + transition + ' transitioning ' + transition + '\n\n[ ' + moodB.toUpperCase() + ' ]\n\n' + pb.formatted;
  return { from: moodA, to: moodB, haiku: hk, poemA: pa, poemB: pb, formatted: formatted };
}

// === Showcase ===
var comp = compose({ mood: 'wonder', seed: 42 });
console.log(comp.formatted);
console.log('\n');
var b = blend('joy', 'melancholy', 7);
console.log(b.formatted);

module.exports = { rng: rng, emotions: emotions, patternArt: patternArt, moodPoem: moodPoem, haiku: haiku, compose: compose, blend: blend };
