/* Vamos (published first as Frase 1.0) - Spanish sentence practice for Chinese speakers (plain JS, no dependencies). Made from Juzi Online 2.10.
   The internal names (FraseBridge, storage keys frase-*, app: 'frase' in the progress) stay, so backups and the update from Frase 1.0 keep working.
   The Chinese sentence is shown, the learner writes it in Spanish. Menus in English, the content in Chinese.
   Data: window.SENTENCE_DATA (built from sentences/*.json). Checking: window.Check (check.js).
   Storage: the Android shell (file in app storage) through window.FraseBridge (online.js), localStorage otherwise.
   The same files make the web app for the iPhone (1.3: ios/ + tools/build_web.py): no Java shell there, progress in the
   browser's storage, backups through the share menu, words and sentences read by the phone's own Spanish voice. */
(function () {
  'use strict';
  var Check = window.Check;
  /* maps keyed by words or names need no prototype: "constructor" is a Spanish word, and {}['constructor'] is a function */
  function dict(o) { var d = Object.create(null); if (o) for (var k in o) d[k] = o[k]; return d; }
  var BUILTIN = (window.SENTENCE_DATA && window.SENTENCE_DATA.sentences) || [];
  var INTERVALS = [1, 5, 10, 15, 20, 30, 60, 90];      // "show again in N days" choices
  var SESSION_SIZE = 10;
  var VERSION = '1.3.2';
  var KEY = 'frase-state-v1';
  var Native = window.FraseBridge || window.AndroidBridge || null;
  /* where it runs: the Android app (Java shell) or a browser / the web app on the Home Screen of an iPhone */
  var UA = navigator.userAgent || '';
  var WEB = !window.AndroidBridge;
  var IPAD = /iPad/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var IOS = IPAD || /iPhone|iPod/.test(UA);
  var DEVICE = IOS ? (IPAD ? 'iPad' : 'iPhone') : /Android/.test(UA) ? 'phone' : 'computer';
  function standalone() { try { return navigator.standalone === true || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches; } catch (e) { return false; } }
  var DAY = 86400000;
  var HAN = /[㐀-鿿]/;
  var ACCENTS = ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ', '¿', '¡'];
  var TOPIC_ORDER = ['Time & Daily Routine', 'Plans & Socializing', 'Food & Drinks', 'Restaurant', 'Shopping & Belongings',
    'School & Languages', 'Home & Chores', 'Directions & Transport', 'Travel', 'Weather', 'People & Family', 'Animals & Pets', 'Work & Office',
    'Health & Advice', 'Opinions & Values', 'Leisure & Outdoors', 'Goals & Resolutions', 'Communication', 'Everyday Phrases'];
  var TOPIC_ICON = dict({ 'Time & Daily Routine': '⏰', 'Plans & Socializing': '🎉', 'Food & Drinks': '🍜', 'Restaurant': '🍽️',
    'Shopping & Belongings': '🛍️', 'School & Languages': '📚', 'Home & Chores': '🏠', 'Directions & Transport': '🚕', 'Travel': '✈️',
    'Weather': '🌦️', 'People & Family': '👪', 'Work & Office': '💼', 'Health & Advice': '🩺', 'Opinions & Values': '💭',
    'Leisure & Outdoors': '🎧', 'Goals & Resolutions': '🎯', 'Everyday Phrases': '💬', 'Animals & Pets': '🐾', 'Communication': '🗣️', 'My sentences': '✏️' });

  function ic(inner, filled) {
    return '<svg viewBox="0 0 24 24" ' + (filled ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"') + '>' + inner + '</svg>';
  }
  /* the cat in boots of the launcher icon (tools/icon.svg), for the tile next to the name */
  var LOGO = '<svg viewBox="33 13.5 54 78" aria-hidden="true"><path d="M68 80 C 82 79 86 66 81 57 C 79 53 75 54 76.5 57.5 C 79.5 64 77.5 72 67 74 Z" fill="#FFF4E6"/> <path d="M54 50 C 42 50 37.5 62 38.5 73 C 39.5 83 45.5 87 54 87 C 62.5 87 68.5 83 69.5 73 C 70.5 62 66 50 54 50 Z" fill="#FFF4E6"/> <ellipse cx="54" cy="71" rx="8" ry="11" fill="#FFE3C6"/> <path d="M41 74 H 52.5 V 86 Q 52.5 90 48.5 90 H 38 Q 35 90 35 87.3 Q 35 84.8 38 84.5 L 41 84 Z" fill="#5B3220"/> <path d="M67 74 H 55.5 V 86 Q 55.5 90 59.5 90 H 70 Q 73 90 73 87.3 Q 73 84.8 70 84.5 L 67 84 Z" fill="#5B3220"/> <rect x="39.5" y="70.5" width="14.5" height="6" rx="2.2" fill="#9A5C36"/> <rect x="54" y="70.5" width="14.5" height="6" rx="2.2" fill="#9A5C36"/> <path d="M35.1 88 Q 36 90 38 90 H 48.5 Q 51.5 90 52.3 88 Z" fill="#3A1E12"/> <path d="M72.9 88 Q 72 90 70 90 H 59.5 Q 56.5 90 55.7 88 Z" fill="#3A1E12"/> <path d="M40.8 37 L 42.2 21.5 L 51.5 28.5 Z" fill="#FFF4E6"/> <path d="M67.2 37 L 65.8 21.5 L 56.5 28.5 Z" fill="#FFF4E6"/> <circle cx="54" cy="40" r="14.5" fill="#FFF4E6"/> <path d="M43.4 31.5 L 44.1 25 L 48.7 28.6 Z" fill="#FFB1A3"/> <path d="M64.6 31.5 L 63.9 25 L 59.3 28.6 Z" fill="#FFB1A3"/> <ellipse cx="45.6" cy="45.2" rx="2.6" ry="1.6" fill="#FFC2B5" opacity="0.8"/> <ellipse cx="62.4" cy="45.2" rx="2.6" ry="1.6" fill="#FFC2B5" opacity="0.8"/> <ellipse cx="48.6" cy="40.2" rx="2.3" ry="3" fill="#2A1F3D"/> <ellipse cx="59.4" cy="40.2" rx="2.3" ry="3" fill="#2A1F3D"/> <circle cx="49.4" cy="39.1" r="0.85" fill="#fff"/> <circle cx="60.2" cy="39.1" r="0.85" fill="#fff"/> <path d="M52.6 44.6 H 55.4 L 54 46.1 Z" fill="#E9787A"/> <path d="M54 46.1 Q 53 47.9 51.6 47.2 M 54 46.1 Q 55 47.9 56.4 47.2" fill="none" stroke="#7A4A40" stroke-width="0.75" stroke-linecap="round"/> <path d="M46 46.6 L 39 45.4 M 46 47.8 L 39.4 48.8 M 62 46.6 L 69 45.4 M 62 47.8 L 68.6 48.8" stroke="#C7A08F" stroke-width="0.6" stroke-linecap="round"/> <path d="M60 21 C 64 16.5 70 15.2 76.5 18.5 C 72 18.6 68.8 20.4 66.3 22.8 C 64.4 24.6 61.4 24.2 60 21 Z" fill="#FFD36E"/> <path d="M62 21.6 C 65.5 18.6 70 17.4 75 18.3" fill="none" stroke="#D99A2B" stroke-width="0.7" stroke-linecap="round"/> <path d="M46.5 26.5 Q 46.5 15.5 54 15.5 Q 61.5 15.5 61.5 25 Q 54 23 46.5 26.5 Z" fill="#4A2A86"/> <path d="M46.9 24.2 Q 54 21 61.3 22.8 L 61.4 25 Q 54 23 46.6 26.4 Z" fill="#F2B53A"/> <path d="M42.5 27.5 Q 54 22.5 65.5 27.5 Q 66 29.5 63.5 29.5 Q 54 26 44.5 29.5 Q 42 29.5 42.5 27.5 Z" fill="#3B2070"/></svg>';
  var STAR = '<path d="M12 2.8l2.85 5.78 6.38.93-4.62 4.5 1.09 6.35L12 17.36l-5.7 3 1.09-6.35-4.62-4.5 6.38-.93z"/>';
  var IC = {
    close: ic('<path d="M5 5l14 14M19 5L5 19"/>'), check: ic('<path d="M20 6L9 17l-5-5"/>'), star: ic(STAR), starFill: ic(STAR, true),
    chev: ic('<path d="M6 9l6 6 6-6"/>'), search: ic('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
    book: ic('<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>'),
    dumbbell: ic('<rect x="1.5" y="9" width="3" height="6" rx="1"/><rect x="5" y="5.5" width="3.4" height="13" rx="1.2"/><rect x="15.6" y="5.5" width="3.4" height="13" rx="1.2"/><rect x="19.5" y="9" width="3" height="6" rx="1"/><rect x="8" y="10.8" width="8" height="2.4"/>', true),
    archive: ic('<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>'),
    repeat: ic('<path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'),
    cap: ic('<path d="M12 4L1.5 9.2 12 14.4l10.5-5.2z"/><path d="M5.5 12.6v4.1c0 1.5 2.9 3 6.5 3s6.5-1.5 6.5-3v-4.1L12 15.9z"/><rect x="20.7" y="9.4" width="1.6" height="6.4" rx=".8"/>', true),
    flame: ic('<path d="M12.2 2c.6 3 2.3 4.6 4 6.3 1.8 1.8 2.8 3.6 2.8 6A7 7 0 0 1 5 14.3c0-1.5.5-2.8 1.3-3.8.3 1.5 1.3 2.5 2.7 2.5 0-4 .7-7.300 3.2-11z"/>', true),
    plus: ic('<path d="M12 5v14M5 12h14"/>'), file: ic('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>'),
    retry: ic('<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>'), edit: ic('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
    spark: ic('<path d="M12 2.5l2.1 6.1 6.4 2.4-6.4 2.4L12 19.5l-2.1-6.1L3.5 11l6.4-2.4z"/><path d="M19 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>', true),
    eye: ic('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    cloud: ic('<path d="M7 18.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 10.5a4 4 0 0 1 0 8z"/><path d="M12 16.5v-4.5M9.8 13.8L12 11.6l2.2 2.2"/>'),
    sound: ic('<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.3 6.3a8 8 0 0 1 0 11.4"/>'),
    gear: ic('<circle cx="12" cy="12" r="3.2"/><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.5-2-3.5-2.4 1a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A7.6 7.6 0 0 0 7 6.500l-2.400-1-2 3.500 2 1.500a7.600 7.600 0 0 0 0 3l-2 1.500 2 3.500 2.400-1a7.600 7.600 0 0 0 2.600 1.500l.400 2.500h4l.400-2.500a7.600 7.600 0 0 0 2.600-1.500l2.400 1 2-3.500z"/>'),
    cards: ic('<rect x="3" y="7" width="13" height="14" rx="2.5"/><path d="M8 3.5h10.5A2.5 2.5 0 0 1 21 6v11"/><path d="M7 14.5h5M9.5 11.5v6"/>'),
    down: ic('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>'), up: ic('<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>'), play: ic('<path d="M7 4.5v15l13-7.5z"/>', true),
    save: ic('<path d="M5 3h11l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 1-2z"/><path d="M8 3v5h7V3M8 21v-6.5h8V21"/>'),
    share: ic('<path d="M12 3v12M8 7l4-4 4 4"/><path d="M8 11H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-2"/>'),
    theme: ic('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
    info: ic('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'), voice: ic('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>')
  };

  function $(sel, el) { return (el || document).querySelector(sel); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function today() { var d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function days(n) { return n + (n === 1 ? ' day' : ' days'); }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }

  /* ---------------- state ---------------- */
  function blank() { return { v: 1, app: 'frase', cards: {}, custom: [], alts: {}, fc: { cards: [] }, streak: { n: 0, last: null }, totals: { answered: 0, correct: 0, sessions: 0 } }; }
  function parseState(raw) {
    try {
      var s = raw ? JSON.parse(raw) : null;
      if (!s || typeof s.cards !== 'object' || !s.cards || s.app !== 'frase') return null;      // (a Juzi backup has no "app")
      var b = blank();
      b.cards = s.cards; b.custom = Array.isArray(s.custom) ? s.custom.filter(function (x) { return x && x.id && x.zh && x.es; }) : [];
      b.alts = s.alts && typeof s.alts === 'object' ? s.alts : {};             // answers the user added with "I was right"
      b.fc = fcParse(s.fc);                                                   // starred flash cards
      if (s.streak) b.streak = { n: +s.streak.n || 0, last: s.streak.last == null ? null : +s.streak.last };
      if (s.totals) b.totals = { answered: +s.totals.answered || 0, correct: +s.totals.correct || 0, sessions: +s.totals.sessions || 0 };
      return b;
    } catch (e) { return null; }
  }
  function load() {
    var raw = null;
    try { if (Native) raw = Native.loadState(); } catch (e) { }
    if (!raw) { try { raw = localStorage.getItem(KEY); } catch (e) { } }
    return parseState(raw) || blank();
  }
  function save() {
    var raw = JSON.stringify(state);
    try { localStorage.setItem(KEY, raw); } catch (e) { }
    try { if (Native) Native.saveState(raw); } catch (e) { }
  }
  var state = load(), all = [], byId = {};
  function reindex() { all = BUILTIN.concat(state.custom); byId = {}; all.forEach(function (s) { byId[s.id] = s; }); }
  reindex();

  function peek(id) { return state.cards[id] || {}; }
  function card(id) { return state.cards[id] || (state.cards[id] = {}); }
  function isArch(s) { return !!peek(s.id).arch; }
  function isStar(s) { return !!peek(s.id).star; }
  function isNew(s) { return !peek(s.id).seen; }
  function isDue(s) { var c = peek(s.id); return !!c.seen && (c.due || 0) <= today(); }
  function isFail(s) { var c = peek(s.id); return !!c.fail && !c.arch; }      // last answer was wrong (cleared by a correct answer)
  function userAlts(id) { return state.alts[id] || []; }
  function effective(s) { var u = userAlts(s.id); return u.length ? { id: s.id, zh: s.zh, es: s.es, alt: (s.alt || []).concat(u) } : s; }
  function addUserAlt(id, text) {
    text = Check.plain(text);
    var s = byId[id]; if (!s || !Check.hasSpanish(text) || Check.matches(text, effective(s))) return null;
    (state.alts[id] || (state.alts[id] = [])).push(text); save(); return text;
  }
  function removeUserAlt(id, text) {
    var a = state.alts[id], i = a ? a.indexOf(text) : -1;
    if (i < 0) return; a.splice(i, 1); if (!a.length) delete state.alts[id]; save();
  }
  function badge(s) {
    var c = peek(s.id);
    if (c.arch) return '<span class="badge arch">archived</span>';
    if (!c.seen) return '<span class="badge new">new</span>';
    var d = (c.due || 0) - today();
    return d <= 0 ? '<span class="badge due">due</span>' : '<span class="badge">in ' + d + 'd</span>';
  }
  function counts() {
    var r = { due: 0, fresh: 0, learned: 0, starred: 0, archived: 0, failed: 0, total: all.length };
    all.forEach(function (s) {
      var c = peek(s.id);
      if (c.star) r.starred++;
      if (c.seen) r.learned++;
      if (c.arch) { r.archived++; return; }
      if (c.fail) r.failed++;
      if (!c.seen) r.fresh++; else if ((c.due || 0) <= today()) r.due++;
    });
    r.ready = r.due + r.fresh;
    r.streak = state.streak.last != null && state.streak.last >= today() - 1 ? state.streak.n : 0;
    r.acc = state.totals.answered ? Math.round(100 * state.totals.correct / state.totals.answered) : null;
    return r;
  }

  /* ---------------- Spanish voice (sentences; words use their recordings first, in the Android app) ---------------- */
  var VOICE_KEY = 'frase-voice';
  function voicePref() { try { return localStorage.getItem(VOICE_KEY) === 'es-ES' ? 'es-ES' : 'es-US'; } catch (e) { return 'es-US'; } }
  function setVoicePref(v) {
    try { localStorage.setItem(VOICE_KEY, v); } catch (e) { }
    try { if (Native && Native.ttsSetVoice) Native.ttsSetVoice(v); } catch (e) { }
    voiceCache = null;
  }
  try { if (Native && Native.ttsSetVoice) Native.ttsSetVoice(voicePref()); } catch (e) { }
  /* light / dark (1.3.1): Preferences → Appearance. 'auto' follows the phone. Kept in this device's storage, not in the progress. */
  var THEME_KEY = 'vamos-theme', darkMq = null;
  try { darkMq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null; } catch (e) { }
  function themePref() { try { var t = localStorage.getItem(THEME_KEY); return t === 'light' || t === 'auto' ? t : 'dark'; } catch (e) { return 'dark'; } }
  function applyTheme() {
    var t = themePref(), light = t === 'light' || (t === 'auto' && !!darkMq && !darkMq.matches);
    document.documentElement.classList.toggle('light', light);
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', light ? '#f5f3fa' : '#12111a');
    m = document.querySelector('meta[name="color-scheme"]'); if (m) m.setAttribute('content', light ? 'light' : 'dark');
  }
  applyTheme();
  if (darkMq) { try { darkMq.addEventListener('change', applyTheme); } catch (e) { try { darkMq.addListener(applyTheme); } catch (x) { } } }
  /* where to add a Spanish voice when there is none */
  function noVoiceText() {
    return IOS ? 'No Spanish voice found. Add one on the ' + DEVICE + ': Settings → Accessibility → Read & Speak → Voices → Spanish.' :
      WEB ? 'No Spanish voice found. Add a Spanish voice in the speech settings of this device.' :
      'No Spanish voice on this phone. Add one in Settings → Text-to-speech output (e.g. Google: Spanish).';
  }
  /* the browser's voices (the web app): the best Spanish one for the chosen variety. Premium and Enhanced voices before the
     compact ones; never the novelty voices of the iPhone (Eddy, Flo, Grandma, Rocko …), which read Spanish badly. */
  var NOVELTY = /^(Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley|Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox)\b/i;
  var voiceCache = null;
  function voiceList() { try { return window.speechSynthesis ? speechSynthesis.getVoices() || [] : []; } catch (e) { return []; } }
  function voiceScore(v, pref) {
    var lang = String(v.lang || '').replace('_', '-'), id = (v.name || '') + ' ' + (v.voiceURI || '');
    if (!/^es(-|$)/i.test(lang)) return -1;
    if (NOVELTY.test(v.name || '') || /eloquence/i.test(id)) return 10;           // only when there is no other Spanish voice
    var region = lang.slice(3).toUpperCase(), s;
    if (pref === 'es-ES') s = region === 'ES' ? 300 : 100;
    else s = region === 'MX' ? 300 : region === 'US' ? 290 : region === '419' ? 280 : region === 'ES' ? 100 : region ? 250 : 200;
    return s + (/premium/i.test(id) ? 30 : /enhanced|neural|natural/i.test(id) ? 20 : 0) + (v.localService ? 4 : 0) + (v.default ? 1 : 0);
  }
  function bestVoice() {
    var pref = voicePref();
    if (voiceCache && voiceCache.pref === pref) return voiceCache.v;
    var list = voiceList(), best = null, top = -1;
    list.forEach(function (v) { var s = voiceScore(v, pref); if (s > top) { top = s; best = v; } });
    if (list.length) voiceCache = { pref: pref, v: best };          // (the list can be empty until the browser has loaded it)
    return best;
  }
  try { if (window.speechSynthesis && speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', function () { voiceCache = null; if (ui.sheet === 'prefs') prefsSheet(); }); } catch (e) { }
  var voiceFail = null;
  /* the iPhone's sound (1.3.1): the web voice alone is muted by the silent switch, and an audio session set to 'playback'
     with nothing playing can leave the voice silent altogether (WebKit uses that session only while a media element plays).
     So inside the tap the session is set to 'playback' and a silent clip plays in a loop while the voice speaks; it stops
     1.5 s after the voice ends. */
  var keeper = null, keeperTimer = 0;
  function silentWav() {        // 0.5 s of silence, 8 kHz 8-bit mono
    var n = 4000, b = new Uint8Array(44 + n), d = new DataView(b.buffer), i, str = '';
    function tag(o, t) { for (var j = 0; j < 4; j++) b[o + j] = t.charCodeAt(j); }
    tag(0, 'RIFF'); d.setUint32(4, 36 + n, true); tag(8, 'WAVE'); tag(12, 'fmt '); d.setUint32(16, 16, true); d.setUint16(20, 1, true);
    d.setUint16(22, 1, true); d.setUint32(24, 8000, true); d.setUint32(28, 8000, true); d.setUint16(32, 1, true); d.setUint16(34, 8, true);
    tag(36, 'data'); d.setUint32(40, n, true);
    for (i = 44; i < b.length; i++) b[i] = 128;
    for (i = 0; i < b.length; i++) str += String.fromCharCode(b[i]);
    return 'data:audio/wav;base64,' + btoa(str);
  }
  function keeperOn() {
    if (!IOS) return;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { }
    try {
      if (!keeper) { keeper = new Audio(silentWav()); keeper.loop = true; keeper.setAttribute('playsinline', ''); }
      clearTimeout(keeperTimer); keeperTimer = setTimeout(keeperOff, 60000);           // (if the voice never says it has ended)
      if (keeper.paused) { var p = keeper.play(); if (p && p.catch) p.catch(function () { }); }
    } catch (e) { }
  }
  function keeperOff(later) {
    clearTimeout(keeperTimer);
    if (later) { keeperTimer = setTimeout(keeperOff, later); return; }
    try { if (keeper && !keeper.paused) keeper.pause(); } catch (e) { }
  }
  /* reads Spanish text aloud with the device's voice; onFail when there is no Spanish voice */
  var utter = null, sayWatch = 0;
  function speak(text, onFail) {
    text = String(text || '').trim(); if (!text) return;
    try { if (FC.audio) FC.audio.pause(); } catch (e) { }
    var token = FC.sayToken = (FC.sayToken || 0) + 1;
    voiceFail = onFail || null;
    var clip = sayClip(text);
    if (clip) { stopVoice(); return fcPlay(clip, token, function () { speakVoice(text); }); }    // (no file, offline: the voice)
    speakVoice(text);
  }
  /* the recording of a sentence of the app (web app 1.3.2: data/say/<id>.m4a, made with Piper; window.SAY_AUDIO set by web.js).
     Your own sentences, and a sentence whose Spanish you changed, are read by the voice. */
  var sayById = null;
  function sayClip(text) {
    var a = window.SAY_AUDIO; if (!a) return null;
    if (!sayById) { sayById = Object.create(null); BUILTIN.forEach(function (s) { if (s && s.es && s.id) sayById[s.es.trim()] = s.id; }); }
    var id = sayById[text]; return id ? a.dir + id + '.' + a.ext : null;
  }
  var SAY_CREDIT = (window.SAY_AUDIO && window.SAY_AUDIO.credit) || '';
  function stopVoice() {
    clearTimeout(sayWatch); utter = null; keeperOff();
    try { if (window.speechSynthesis && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel(); } catch (e) { }
  }
  function speakVoice(text) {
    try { if (Native && Native.ttsSpeak) { Native.ttsSpeak(text); return; } } catch (e) { }
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return window.__ttsFailed();
    var v = bestVoice();
    if (!v && voiceList().length) return window.__ttsFailed();      // voices, but not one for Spanish
    keeperOn();
    sayOnce(text, v, 0);
  }
  /* try 0: the chosen voice. Try 1, when the first one has not started after 2.5 s or failed: the language only (a voice
     that is listed but not on the phone stays silent), after a cancel. Still nothing: a hint about what to check. */
  function sayOnce(text, v, n) {
    var started = false, u, ss = window.speechSynthesis;
    clearTimeout(sayWatch);
    try {
      if (ss.speaking || ss.pending) ss.cancel();        // only then (Safari can drop the next utterance after a cancel())
      if (ss.paused) ss.resume();                        // (the iPhone can leave it paused after the app was in the background)
      u = utter = new SpeechSynthesisUtterance(text);    // (kept in a variable: an utterance that is dropped can go silent)
      if (v && !n) { u.voice = v; u.lang = v.lang; } else u.lang = v ? String(v.lang).replace('_', '-') : voicePref() === 'es-ES' ? 'es-ES' : IOS ? 'es-MX' : 'es-US';
      u.rate = .9;
      u.onstart = u.onboundary = function () { started = true; };
      u.onend = function () { started = true; if (u === utter) keeperOff(1500); };
      u.onerror = function (e) {
        if (u !== utter || (e && (e.error === 'interrupted' || e.error === 'canceled'))) return;    // (another word was tapped)
        clearTimeout(sayWatch);
        if (!n && !started) return retry();
        keeperOff(); window.__ttsFailed();
      };
      ss.speak(u);
    } catch (e) { keeperOff(); return window.__ttsFailed(); }
    function retry() { try { ss.cancel(); } catch (x) { } setTimeout(function () { if (u === utter) sayOnce(text, v, 1); }, 80); }
    sayWatch = setTimeout(function () {
      if (u !== utter || started) return;
      if (!n) return retry();
      toast(IOS ? 'No sound? Turn the volume up, and check that a Spanish voice is downloaded: Settings → Accessibility → Read & Speak → Voices → Spanish.' :
        'No sound? Turn the volume up, and check that this device has a Spanish voice.');
    }, n ? 3000 : 2500);
  }
  window.__ttsFailed = function () {
    var f = voiceFail; voiceFail = null;
    if (f) f(); else toast(noVoiceText());
  };
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'hidden' || !WEB) return;
    stopVoice(); try { if (FC.audio) FC.audio.pause(); } catch (e) { }
  });
  /* the voice in use (web app), for Preferences */
  function voiceName() { var v = bestVoice(); return v ? v.name.replace(/\s*\((Enhanced|Premium|Mejorada|Prémium)\)/i, '') + ' · ' + String(v.lang).replace('_', '-') + (/premium/i.test(v.name + v.voiceURI) ? ' · premium' : /enhanced/i.test(v.name + v.voiceURI) ? ' · enhanced' : '') : ''; }
  function sayBtn(text, cls) { return '<button class="say-btn' + (cls ? ' ' + cls : '') + '" data-act="say" data-t="' + esc(text) + '" aria-label="Listen">' + IC.sound + '</button>'; }

  /* ---------------- choosing the sentences of a session ---------------- */
  // mixed: random sentences that are due for review plus random new ones (about half / half)
  // review / new: only one kind.  free: any sentences of the pool (starred, a topic), due and new ones first
  function pickSession(mode, pool) {
    var avail = (pool || all).filter(function (s) { return !isArch(s); });
    var due = shuffle(avail.filter(isDue)), fresh = shuffle(avail.filter(isNew)), pick;
    if (mode === 'review') pick = due.slice(0, SESSION_SIZE);
    else if (mode === 'new') pick = fresh.slice(0, SESSION_SIZE);
    else if (mode === 'free') {
      var later = shuffle(avail.filter(function (s) { return !isNew(s) && !isDue(s); }));
      pick = shuffle(due.concat(fresh)).concat(later).slice(0, SESSION_SIZE);
    } else {
      var nDue = Math.min(due.length, Math.max(SESSION_SIZE / 2, SESSION_SIZE - fresh.length));
      pick = due.slice(0, nDue).concat(fresh.slice(0, SESSION_SIZE - nDue));
    }
    return shuffle(pick);
  }
  /* suggested "show again in": wrong -> 1 day. Right -> by how many times in a row it was right (card.run):
     1st time 5, 2nd 10, 3rd 15, then 20, 30, 60, 90 - but never less than one step above a longer interval the user picked last time */
  function suggestInterval(s, ok) {
    if (!ok) return INTERVALS[0];
    var c = peek(s.id), ladder = INTERVALS.slice(1), run = (c.run || 0) + 1, prev = c.ivl || 0;
    var byRun = ladder[Math.min(run, ladder.length) - 1], above = ladder[ladder.length - 1];
    for (var i = 0; i < ladder.length; i++) if (ladder[i] > prev) { above = ladder[i]; break; }
    return prev >= INTERVALS[1] ? Math.max(byRun, above) : byRun;
  }

  /* ---------------- views ---------------- */
  var ui = { view: 'tabs', tab: 'practice', lib: { q: '', filter: 'all', open: dict() }, sess: null, sheet: null };

  function render() {
    var app = $('#app'), keep = $('#scroll') ? $('#scroll').scrollTop : 0, sameTab = app.dataset.tab === ui.tab;
    document.body.dataset.view = ui.view;
    if (ui.view === 'session') { app.innerHTML = sessionHTML(); app.dataset.tab = ''; afterSessionRender(); return; }
    if (ui.view === 'summary') { app.innerHTML = summaryHTML(); app.dataset.tab = ''; return; }
    if (ui.view === 'fc' || ui.view === 'fcsum') { app.innerHTML = ui.view === 'fc' ? fcSessionHTML() : fcSummaryHTML(); app.dataset.tab = ''; return; }
    var body = ui.tab === 'cards' && FC.has ? fcTabHTML() : ui.tab === 'starred' ? starredHTML() : ui.tab === 'failed' ? failedHTML() : ui.tab === 'library' ? libraryHTML() : practiceHTML();
    app.innerHTML = '<div class="tab-scroll" id="scroll">' + body + '</div>' + navHTML();
    app.dataset.tab = ui.tab;
    if (sameTab) $('#scroll').scrollTop = keep;
  }
  function navHTML() {
    function b(tab, icon, label, n) {
      return '<button data-act="tab" data-tab="' + tab + '" class="' + (ui.tab === tab ? 'on' : '') + '"><span class="ni">' + icon + (n ? '<em>' + (n > 99 ? '99+' : n) + '</em>' : '') + '</span><span>' + label + '</span></button>';
    }
    return '<nav class="nav' + (FC.has ? ' n5' : '') + '">' + b('practice', IC.dumbbell, 'Practice') + b('failed', IC.retry, 'Failed', counts().failed) +
      b('starred', ui.tab === 'starred' ? IC.starFill : IC.star, 'Starred') + (FC.has ? b('cards', IC.cards, 'Cards') : '') + b('library', IC.book, 'Library') + '</nav>';
  }

  var TRAIL = '<svg class="trail" viewBox="0 0 320 560" aria-hidden="true"><defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#5e2a1e"/><stop offset=".3" stop-color="#4a2a3c"/><stop offset="1" stop-color="#2b2447"/></linearGradient></defs>' +
    '<path d="M215 -20C215 20 160 22 160 62C160 120 215 140 215 200C215 290 198 300 198 392C198 455 100 442 100 505C100 550 210 548 250 600" fill="none" stroke="url(#tg)" stroke-width="46" stroke-linecap="round"/></svg>';

  function practiceHTML() {
    var c = counts();
    return '<div class="top"><div class="brand"><i>' + LOGO + '</i>Vamos</div><div class="pills">' +
      '<div class="pill" title="Day streak"><span class="flame' + (c.streak ? ' lit' : '') + '">' + IC.flame + '</span>' + c.streak + '</div>' +
      '<button class="pill" data-act="tab" data-tab="starred"><span class="coin">' + IC.starFill + '</span>' + c.starred + '</button>' +
      '<button class="pill gear" data-act="prefs" aria-label="Preferences" title="Preferences">' + IC.gear + '</button></div></div>' +
      installHTML() + restoreHintHTML() + bkBannerHTML() +
      '<div class="path">' + TRAIL +
      '<button class="orb yellow' + (c.due ? '' : ' off') + '" style="left:160px;top:62px;width:92px;height:92px" data-act="start" data-mode="review" aria-label="Review only">' + IC.repeat + '</button>' +
      '<div class="orb-label right" style="left:222px;top:62px"><b>Review</b><span>' + c.due + ' due</span></div>' +
      '<div class="tiles" lang="zh-CN"><span>学</span><span>西</span><span>语</span></div>' +
      '<div class="banner">Sentence practice<small><span lang="zh-CN">中文</span> → Español · ' + SESSION_SIZE + ' per session</small><div class="tag">' + c.ready + ' ready</div></div>' +
      '<div class="start-tag" style="left:198px;top:292px">START</div>' +
      '<button class="orb" style="left:198px;top:392px;width:124px;height:124px" data-act="start" data-mode="mixed" aria-label="Start practice">' + IC.cap + '</button>' +
      '<button class="orb' + (c.fresh ? '' : ' off') + '" style="left:100px;top:505px;width:92px;height:92px" data-act="start" data-mode="new" aria-label="New sentences only">' + IC.dumbbell + '</button>' +
      '<div class="orb-label right" style="left:162px;top:512px"><b>New only</b><span>' + c.fresh + ' unseen</span></div>' +
      '</div>' +
      '<div class="stats"><div class="stat"><b>' + c.learned + '<small style="font-size:13px;color:var(--muted)"> / ' + c.total + '</small></b><span>practiced</span></div>' +
      '<div class="stat"><b>' + c.due + '</b><span>due for review</span></div>' +
      '<div class="stat"><b>' + (c.acc == null ? '–' : c.acc + '%') + '</b><span>correct</span></div></div>';
  }

  /* a sentence in a list: the Chinese, then (unless hidden) the Spanish answer */
  function rowHTML(s, cls, hideAnswer) {
    return '<div class="row ' + (cls || '') + (isArch(s) ? ' arch' : '') + '" data-act="detail" data-id="' + esc(s.id) + '"><div class="row-main">' +
      '<div class="row-q" lang="zh-CN">' + esc(s.zh) + '</div>' + (hideAnswer ? '' : '<div class="row-a" lang="es">' + esc(s.es) + '</div>') + '</div>' +
      '<div class="row-side"><button class="star-btn' + (isStar(s) ? ' on' : '') + '" data-act="star" data-id="' + esc(s.id) + '" aria-label="Star">' + IC.star + '</button>' + badge(s) + '</div></div>';
  }
  function starredHTML() {
    var list = all.filter(isStar);
    var h = '<div class="head-row"><div><h2 class="title">Starred</h2><p class="sub">' + (list.length === 1 ? '1 sentence' : list.length + ' sentences') + '</p></div>' +
      (list.length ? '<button class="btn small" data-act="start" data-mode="starred" style="margin-bottom:18px">' + IC.play + 'Practice</button>' : '') + '</div>';
    if (!list.length) return h + '<div class="empty"><div class="big">⭐</div>No starred sentences yet.<br>Tap the star after answering a sentence, or in the Library, to collect the ones you want to find again.</div>';
    return h + list.map(function (s) { return rowHTML(s, 'card'); }).join('');
  }
  function failedHTML() {
    var list = all.filter(isFail);
    var h = '<div class="head-row"><div><h2 class="title">Failed</h2><p class="sub">' + (list.length === 1 ? '1 sentence' : list.length + ' sentences') + ' to get right</p></div>' +
      (list.length ? '<button class="btn small" data-act="start" data-mode="failed" style="margin-bottom:18px">' + IC.play + 'Practice</button>' : '') + '</div>';
    if (!list.length) return h + '<div class="empty"><div class="big">🎯</div>Nothing to fix.<br>Sentences you get wrong are collected here and leave the list as soon as you answer them correctly.</div>';
    return h + '<div class="filters"><button class="chip' + (ui.failShow ? ' on' : '') + '" data-act="fail-show">' + (ui.failShow ? 'Hide answers' : 'Show answers') + '</button></div>' +
      list.map(function (s) { return rowHTML(s, 'card', !ui.failShow); }).join('');
  }
  function topicsOf(list) {
    var map = dict(), names = [];
    list.forEach(function (s) { var t = s.topic || 'Other'; if (!map[t]) { map[t] = []; names.push(t); } map[t].push(s); });
    names.sort(function (a, b) { var ia = TOPIC_ORDER.indexOf(a), ib = TOPIC_ORDER.indexOf(b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b); });
    return names.map(function (n) { return { name: n, items: map[n] }; });
  }
  function libraryMatches() {
    var q = ui.lib.q.trim(), f = ui.lib.filter, ql = Check.strip(q.toLowerCase()), qh = q.replace(/[^㐀-鿿]/g, '');
    return all.filter(function (s) {
      var c = peek(s.id);
      if (f === 'new' && (c.seen || c.arch)) return false;
      if (f === 'practiced' && (!c.seen || c.arch)) return false;
      if (f === 'archived' && !c.arch) return false;
      if (!q) return true;
      if (qh) return s.zh.indexOf(qh) >= 0;
      return Check.strip(Check.searchText(effective(s)).toLowerCase()).indexOf(ql) >= 0;
    });
  }
  function libraryListHTML() {
    var list = libraryMatches(), searching = !!ui.lib.q.trim();
    if (!list.length) return '<div class="empty"><div class="big">🔎</div>No sentences match.</div>';
    return topicsOf(list).map(function (t) {
      var open = searching || ui.lib.open[t.name], done = t.items.filter(function (s) { return peek(s.id).seen; }).length;
      return '<button class="topic' + (open ? ' open' : '') + '" data-act="topic" data-topic="' + esc(t.name) + '"><span class="ico">' + (TOPIC_ICON[t.name] || '📝') + '</span>' +
        '<span class="name">' + esc(t.name) + '<small>' + t.items.length + (t.items.length === 1 ? ' sentence' : ' sentences') + ' · ' + done + ' practiced</small></span><span class="chev">' + IC.chev + '</span></button>' +
        (open ? '<div class="topic-body">' + (searching ? '' : '<button class="btn small ghost" data-act="start" data-mode="topic" data-topic="' + esc(t.name) + '" style="margin:2px 0 6px 6px">' + IC.play + 'Practice this topic</button>') +
          t.items.map(function (s) { return rowHTML(s); }).join('') + '</div>' : '');
    }).join('');
  }
  function libraryHTML() {
    var c = counts(), f = ui.lib.filter;
    function chip(id, label) { return '<button class="chip' + (f === id ? ' on' : '') + '" data-act="filter" data-filter="' + id + '">' + label + '</button>'; }
    return '<div class="head-row"><div><h2 class="title">Library</h2><p class="sub">' + c.total + ' sentences by topic</p></div>' +
      '<div style="display:flex;gap:8px;margin-bottom:18px"><button class="btn small ghost icon-only" data-act="prefs" aria-label="Preferences" title="Preferences">' + IC.gear + '</button>' +
      '<button class="btn small ghost" data-act="manage">' + IC.plus + 'Add</button></div></div>' +
      '<div class="search">' + IC.search + '<input id="q" type="search" placeholder="Search 中文 or español" value="' + esc(ui.lib.q) + '" autocomplete="off" autocorrect="off" spellcheck="false"></div>' +
      '<div class="filters">' + chip('all', 'All') + chip('new', 'New · ' + c.fresh) + chip('practiced', 'Practiced') + chip('archived', 'Archived · ' + c.archived) + '</div>' +
      '<div id="lib-list">' + libraryListHTML() + '</div>';
  }

  /* ---------------- session ---------------- */
  function startSession(list) {
    if (!list.length) return;
    ui.sess = { items: list, i: 0, results: [], phase: 'input' };
    ui.view = 'session'; closeSheet(); $('#toast').classList.remove('show'); render();
  }
  function start(mode, topic) {
    var list, c = counts();
    ui.last = { mode: mode === 'anyway' ? 'mixed' : mode, topic: topic };
    if (mode === 'failed') {
      list = pickSession('free', all.filter(isFail));
      if (!list.length) { if (ui.view !== 'tabs') { ui.view = 'tabs'; ui.tab = 'failed'; ui.sess = null; render(); } return toast('No failed sentences left 🎉'); }
    }
    else if (mode === 'starred') list = pickSession('free', all.filter(isStar));
    else if (mode === 'topic') list = pickSession('free', all.filter(function (s) { return s.topic === topic; }));
    else if (mode === 'anyway') list = pickSession('free');
    else list = pickSession(mode);
    if (list.length) return startSession(list);
    if (mode === 'review') return toast(c.learned ? 'No reviews are due right now.' : 'Nothing to review yet — start a session first.');
    if (mode === 'new') return toast('You have already seen every sentence.');
    if (mode === 'starred' || mode === 'topic') return toast('All of these sentences are archived.');
    var next = null;
    all.forEach(function (s) { var k = peek(s.id); if (!k.arch && k.seen && (next == null || k.due < next)) next = k.due; });
    if (next == null) return toast('There are no sentences to practice.');
    openSheet('<h3>All caught up 🎉</h3><p>Nothing is due right now. The next sentence comes back in ' + days(Math.max(1, next - today())) +
      '. You can still practice sentences ahead of schedule.</p><div class="actions"><button class="btn ghost" data-act="close-sheet">Later</button><button class="btn" data-act="start" data-mode="anyway">Practice anyway</button></div>');
  }
  function cur() { return ui.sess.items[ui.sess.i]; }
  function sessionHTML() {
    var sess = ui.sess, s = cur();
    return '<div class="session"><div class="s-top"><button class="icon-btn" data-act="quit" aria-label="Close">' + IC.close + '</button>' +
      '<div class="bar"><i style="width:' + Math.round(100 * sess.i / sess.items.length) + '%"></i></div><span class="count">' + (sess.i + 1) + '/' + sess.items.length + '</span></div>' +
      '<div class="s-body"><h1>Translate this sentence into Spanish</h1><p class="s-q" lang="zh-CN">' + esc(s.zh) + '</p>' +
      '<textarea id="answer" lang="es" rows="2" placeholder="Type in Spanish" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false" enterkeyhint="done"></textarea>' +
      accentBar('acc-bar', 'answer') +
      '<div class="hint" id="hint"></div></div>' +
      '<div class="s-foot" id="foot"><button class="link" data-act="giveup">I don\'t know</button><button class="btn-check" id="check" data-act="check" disabled>CHECK</button></div>' +
      '<div class="result" id="result"></div></div>';
  }
  function afterSessionRender() {
    var ta = $('#answer');
    function grow() { ta.style.height = 'auto'; ta.style.height = Math.max(92, ta.scrollHeight) + 'px'; }
    ta.addEventListener('input', function () { $('#check').disabled = !ta.value.trim(); $('#hint').textContent = ''; grow(); });
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); doCheck(false); } });
    ta.addEventListener('beforeinput', function (e) { if (e.inputType === 'insertLineBreak') { e.preventDefault(); doCheck(false); } });
    ta.addEventListener('input', draftSoon);
    var bar = $('#acc-bar');                      // accent keys: accentBar() / accentInsert()
    if (ui.restoredText != null) { ta.value = ui.restoredText; ui.restoredText = null; $('#check').disabled = !ta.value.trim(); grow(); }
    if (ui.sess.phase === 'result') { ta.readOnly = true; $('#foot').style.visibility = 'hidden'; bar.style.visibility = 'hidden'; showResult(false); return; }
    if (IOS) { try { ta.focus(); } catch (e) { } }      // iPhone: the keyboard opens only for a focus inside the tap (Start, Continue)
    setTimeout(function () { try { ta.focus(); } catch (e) { } }, 60);
  }
  function doCheck(giveUp) {
    var sess = ui.sess, ta = $('#answer');
    if (!sess || sess.phase !== 'input' || !ta) return;
    if (!giveUp && !ta.value.trim()) return;
    ta.blur();                                    // commits any pending composition and hides the keyboard
    setTimeout(function () {
      if (sess.phase !== 'input') return;
      var s = cur(), res = giveUp ? { ok: false, user: '', gaveUp: true } : Check.evaluate(ta.value, effective(s));
      res.raw = giveUp ? '' : ta.value;
      if (res.empty) {
        $('#hint').textContent = res.han ? 'Write the answer in Spanish, not in Chinese characters.' : 'Please write the sentence in Spanish.';
        ta.classList.remove('shake'); void ta.offsetWidth; ta.classList.add('shake'); ta.focus(); return;
      }
      sess.phase = 'result'; sess.res = res; sess.ok = res.ok; sess.pick = suggestInterval(s, res.ok);
      ta.readOnly = true; $('#foot').style.visibility = 'hidden'; $('#acc-bar').style.visibility = 'hidden';
      showResult(true); draftSave();
    }, giveUp ? 0 : 50);
  }
  function markedWords(list, tag) {
    return (list || []).map(function (x) { return x.bad ? '<' + tag + '>' + esc(x.w) + '</' + tag + '>' : esc(x.w); }).join(' ');
  }
  function accentHTML(marks) {
    return (marks || []).map(function (w) { return w.map(function (p) { return p.bad ? '<b class="acc">' + esc(p.t) + '</b>' : esc(p.t); }).join(''); }).join(' ');
  }
  function altListHTML(s, res, ok) {
    var pats = (s.alt || []).filter(function (a) { return !(ok && !Check.isPattern(a) && a === res.match); }), mine = userAlts(s.id);
    if (!pats.length && !mine.length) return '';
    return '<details class="r-alts"' + (ui.sess.altsOpen ? ' open' : '') + '><summary>Also accepted (' + (pats.length + mine.length) + ')</summary>' +
      pats.map(function (a) { return '<div class="pat" lang="es">' + Check.render(a) + '</div>'; }).join('') +
      mine.map(function (a, i) { return userAltHTML(s.id, a, i, 'result'); }).join('') +
      (pats.some(Check.isPattern) ? '<p class="pat-note">a / b = either word · (…) = may be left out</p>' : '') + '</details>';
  }
  function showResult(animate) {
    var sess = ui.sess, s = cur(), res = sess.res, c = peek(s.id), el = $('#result'), keep = el.scrollTop;
    var head = sess.ok ? (res.overridden ? 'Counted as correct' : res.accent ? 'Correct – check the accents' : 'Correct!') : (res.gaveUp ? 'Here is the answer' : 'Not quite');
    var h = '<div class="r-head"><span class="ic">' + (sess.ok ? IC.check : IC.close) + '</span>' + head + '</div>';
    if (res.overridden) h += '<div class="r-label">Your answer</div><div class="r-yours" lang="es">' + esc(res.user) + '</div><div class="r-label">Correct answer</div>';
    else if (!sess.ok && !res.gaveUp) {
      h += '<div class="r-label">Your answer</div><div class="r-yours" lang="es">' + markedWords(res.marks && res.marks.a, 'u') + '</div>';
      if (res.closest && res.closest !== s.es) h += '<div class="r-label">Closest correct answer</div><div class="r-close" lang="es">' + markedWords(res.marks && res.marks.b, 'b') + '</div>';
      h += '<div class="r-label">Correct answer</div>';
    } else if (!sess.ok) h += '<div class="r-label">Correct answer</div>';
    else if (res.accent) {
      h += '<div class="r-label">Your answer</div><div class="r-yours" lang="es">' + esc(res.user) + '</div>' +
        '<div class="r-label">With the right accents</div><div class="r-close" lang="es">' + accentHTML(res.accentMarks) + '</div>' + (res.match !== s.es ? '<div class="r-label">Model answer</div>' : '');
    } else if (res.match !== s.es) h += '<div class="r-label">Your answer</div><div class="r-yours" lang="es">' + esc(res.user) + '</div><div class="r-label">Model answer</div>';
    if (!(res.accent && !res.overridden && sess.ok && res.match === s.es)) h += '<div class="r-es-row"><div class="r-es" lang="es">' + wordsHTML(s.es) + '</div>' + sayBtn(s.es) + '</div>' + lookupHint();
    else h += '<div class="r-es-row r-es-say">' + sayBtn(s.es) + '<span>Listen</span></div>';
    if (res.overridden) h += '<div class="r-note">' + (sess.addedAlt ? 'Your answer is now an accepted answer for this sentence. Check it below — you can edit or remove it.' : 'Counted as correct this time.') + '</div>';
    h += altListHTML(s, res, sess.ok);
    h += '<div id="ai-box">' + aiBoxHTML() + '</div>';
    h += '<div class="r-tools"><button class="tool star' + (c.star ? ' on' : '') + '" data-act="r-star">' + IC.star + (c.star ? 'Starred' : 'Star') + '</button>' +
      '<button class="tool' + (c.arch ? ' on' : '') + '" data-act="r-arch">' + IC.archive + (c.arch ? 'Archived' : 'Archive') + '</button>' +
      (!res.gaveUp && (!sess.ok || res.overridden) ? '<button class="tool" data-act="override">' + (res.overridden ? IC.close + 'Undo' : IC.check + 'I was right') + '</button>' : '') + '</div>';
    h += '<div class="r-days-cap"><div class="r-label">Show again in … days</div>' + (c.arch ? '<span>archived – will not come back</span>' : '') + '</div><div class="days' + (c.arch ? ' off' : '') + '">' +
      INTERVALS.map(function (d) { return '<button data-act="ivl" data-d="' + d + '" class="' + (sess.pick === d ? 'on' : '') + '">' + d + '</button>'; }).join('') + '</div>';
    h += '<button class="btn-continue" data-act="next">' + (sess.i + 1 >= sess.items.length ? 'FINISH' : 'CONTINUE') + '</button>';
    el.className = 'result ' + (sess.ok ? 'ok' : 'bad') + (animate ? '' : ' show');
    el.innerHTML = h; el.scrollTop = keep;
    if (animate) requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('show'); }); });
  }
  function userAltHTML(id, text, i, from) {
    return '<div class="ua" lang="es"><span>' + esc(text) + '</span><button class="mini" data-act="alt-edit" data-id="' + esc(id) + '" data-i="' + i + '" data-from="' + from + '" aria-label="Edit this answer">' + IC.edit + '</button></div>';
  }
  function commitAnswer() {
    var sess = ui.sess; if (!sess || sess.phase !== 'result') return;
    aiStop(); sess.ai = null;
    var s = cur(), c = card(s.id), t = today();
    c.seen = (c.seen || 0) + 1;
    if (sess.ok) { c.ok = (c.ok || 0) + 1; delete c.fail; } else { c.bad = (c.bad || 0) + 1; c.fail = 1; }   // failed list
    c.run = sess.ok ? (c.run || 0) + 1 : 0;                                     // right in a row (for the suggested interval)
    c.ivl = sess.pick; c.due = t + sess.pick; c.last = t;
    state.totals.answered++; if (sess.ok) state.totals.correct++;
    if (state.streak.last !== t) { state.streak.n = state.streak.last === t - 1 ? state.streak.n + 1 : 1; state.streak.last = t; }
    sess.results.push({ id: s.id, ok: sess.ok, ivl: sess.pick });
    sess.i++; sess.phase = 'input'; sess.res = null; sess.altsOpen = false; sess.addedAlt = null;
    var finished = sess.i >= sess.items.length;
    if (finished) { state.totals.sessions++; ui.view = 'summary'; }
    save(); render();
    if (finished) syncPush();                     // session complete: save into the Drive backup file
  }
  function summaryHTML() {
    var r = ui.sess.results, ok = r.filter(function (x) { return x.ok; }).length, pct = r.length ? Math.round(100 * ok / r.length) : 0;
    var msg = pct === 100 ? 'Perfect session!' : pct >= 70 ? 'Nice work!' : pct >= 40 ? 'Good practice — keep going.' : 'Tough round. These will come back soon.';
    return '<div class="summary"><div class="sum-scroll"><div class="ring" style="background:conic-gradient(var(--green) ' + pct + '%, var(--track) 0)"><div>' + ok + '/' + r.length + '</div></div>' +
      '<h1>Session complete</h1><p class="lead">' + msg + '</p>' + bkBannerHTML() +
      r.map(function (x) {
        var s = byId[x.id], a = peek(x.id).arch;
        return '<div class="sum-row ' + (x.ok ? 'ok' : 'bad') + '"><span class="dot">' + (x.ok ? IC.check : IC.close) + '</span><div class="row-main"><div class="row-q" lang="zh-CN">' + esc(s.zh) + '</div>' +
          '<div class="row-a" lang="es">' + esc(s.es) + '</div><div class="when">' + (a ? 'archived' : 'again in ' + days(x.ivl)) + '</div></div>' +
          '<button class="star-btn' + (isStar(s) ? ' on' : '') + '" data-act="star" data-id="' + esc(s.id) + '" aria-label="Star">' + IC.star + '</button></div>';
      }).join('') + '</div><div class="sum-foot"><button class="btn ghost" data-act="home">Done</button><button class="btn" data-act="again">Practice again</button></div></div>';
  }

  /* ---------------- AI tutor: DeepSeek online (online.js), explains in Chinese ---------------- */
  var AI = { has: false };
  try { AI.has = !!(Native && Native.llmAvailable && Native.llmAvailable()); } catch (e) { }
  function aiName() { try { return Native.llmName(); } catch (e) { return 'DeepSeek'; } }
  function aiReady() { try { return JSON.parse(Native.llmStatus()).state === 'ready'; } catch (e) { return false; } }
  /* the question for DeepSeek: system + user message, in Chinese, so that it answers in Chinese */
  function aiPrompt(s, res) {
    var clean = function (t) { return String(t || '').replace(/\s+/g, ' ').trim(); };
    var others = [];
    (s.alt || []).concat(userAlts(s.id)).forEach(function (p) { if (others.length < 6) Check.expand(p, 3).slice(0, 2).forEach(function (x) { if (others.length < 6 && x !== s.es) others.push(x); }); });
    var sys = '你是一位简洁、友好的西班牙语老师，学生的母语是中文。学生把一个中文句子翻译成了西班牙语，答案被判为错误。' +
      '请比较学生的答案和正确答案，用简体中文解释错在哪里：指出具体不同的西班牙语单词，并说明原因（用词错误、缺少或多余的词、词序、动词变位、时态、性数一致、冠词、介词、拼写或重音符号等），以及正确的形式是什么意思。' +
      '西班牙语单词和句子保持西班牙语原文。用2到4个简短的要点，总共不超过150个汉字（西班牙语单词不计）。如果学生的答案其实也是正确的翻译，请直接说明。不要问候，也不要总结。必须用中文回答。';
    var user = '中文句子：' + clean(s.zh) + '\n正确答案：' + clean(s.es) + (others.length ? '\n其他可以接受的答案：' + others.map(clean).join(' / ') : '') +
      '\n学生的答案：' + clean(res.raw) + '\n\n请用中文解释：学生的答案为什么不对？';
    return JSON.stringify([{ role: 'system', content: sys }, { role: 'user', content: user }]);
  }
  function aiFormat(t) {
    t = String(t || '').replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<think>[\s\S]*$/, '').trim();
    if (!t) return '';
    return esc(t).replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>').replace(/^#{1,4}\s*/gm, '').replace(/^\s*[-*•]\s+/gm, '• ').replace(/\n{2,}/g, '\n').replace(/\n/g, '<br>');
  }
  function aiBoxHTML() {
    var sess = ui.sess, ai = sess.ai, res = sess.res, name = aiName();
    if (!AI.has || sess.ok || res.gaveUp) return '';
    if (!ai) return '<button class="ai-ask" data-act="ai-ask">' + IC.spark + 'Ask ' + name + ' why my answer is wrong</button>';
    var body = aiFormat(ai.text), run = ai.state === 'run';
    return '<div class="ai-card"><div class="ai-head">' + IC.spark + '<span>' + name + '</span><button class="ai-btn" data-act="' + (run ? 'ai-stop">Stop' : 'ai-ask">Ask again') + '</button></div>' +
      (body ? '<div class="ai-text" lang="zh-CN">' + body + (run ? '<span class="caret"></span>' : '') + '</div>' : '') +
      (run && !body ? '<div class="ai-wait"><span class="dots"><i></i><i></i><i></i></span>' + (ai.stage === 'reading' || ai.stage === 'writing' ? name + ' is reading your answer…' : 'Connecting to ' + name + '…') + '</div>' : '') +
      (ai.state === 'error' ? '<div class="ai-err">' + esc(ai.error || 'Something went wrong.') + '</div>' : '') +
      (ai.state === 'done' && !body ? '<div class="ai-err">' + name + ' gave no answer. Try again.</div>' : '') +
      (ai.state === 'done' && body ? '<div class="ai-foot">Written by ' + name + ' (online). It can be wrong — the correct answer above is the reference.</div>' : '') + '</div>';
  }
  function aiPaint() { var box = $('#ai-box'); if (box && ui.sess && ui.sess.phase === 'result') box.innerHTML = aiBoxHTML(); }
  function aiStop() { var ai = ui.sess && ui.sess.ai; if (ai && ai.state === 'run') { try { Native.llmStop(); } catch (e) { } } }
  function aiAsk() {
    var sess = ui.sess; if (!AI.has || !sess || sess.phase !== 'result' || sess.ok) return;
    if (!aiReady()) return aiSheet();
    aiStop();
    var id = 'q' + Date.now() + Math.floor(Math.random() * 1000);
    sess.ai = { id: id, state: 'run', stage: 'loading', text: '' };
    try { Native.llmAsk(id, aiPrompt(cur(), sess.res), 600); } catch (e) { sess.ai.state = 'error'; sess.ai.error = 'Could not reach the AI tutor.'; }
    aiPaint();
    var box = $('#ai-box'); if (box && box.scrollIntoView) box.scrollIntoView({ block: 'nearest' });
  }
  window.__llm = {
    onEvent: function (ev) {
      var ai = ui.sess && ui.sess.ai; if (!ai || !ev || ai.id !== ev.id) return;
      if (ev.type === 'stage') ai.stage = ev.stage;
      else if (ev.type === 'text') { ai.text += ev.text; ai.stage = 'writing'; }
      else if (ev.type === 'done') { ai.state = 'done'; }
      else if (ev.type === 'stopped') { if (ai.text) ai.state = 'done'; else ui.sess.ai = null; }
      else if (ev.type === 'error') { ai.state = 'error'; ai.error = ev.message; }
      aiPaint();
    }
  };
  /* set-up sheet: the DeepSeek API key (comes from online.js, which keeps the key) */
  function aiSheet() {
    if (!Native || !Native.llmSheetHTML) return toast('The AI tutor is not available here.');
    if (ui.sheet !== 'ai' && Native.llmSheetOpened) Native.llmSheetOpened();
    var h = Native.llmSheetHTML();
    if (ui.sheet === 'ai' && $('.sheet')) $('.sheet').innerHTML = '<div class="grip"></div>' + h; else openSheet(h, 'ai');
  }

  /* ---------------- backup file in Google Drive (Android side: Sync.java) ----------------
     One file, chosen once with Android's file screen. It is a normal backup plus  sync: { id, at, device }.
     Vamos saves into it after a session and when the app is left, and looks at it when the app is opened.
     The id ("stamp") tells whether another device saved in between: then nothing is overwritten without asking. */
  var SYNC = { has: false, manual: false, remote: null };
  try { SYNC.has = !!(Native && Native.syncAvailable && Native.syncAvailable()); } catch (e) { }
  var SYNC_FILE = 'vamos-progress.json';
  function syncStatus() { try { return JSON.parse(Native.syncStatus()); } catch (e) { return { linked: false, dirty: false, stamp: '', name: '', lastSaved: 0, error: '', device: '' }; } }
  function syncStamp() { return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8); }
  function syncContent(stamp, device) { var o = JSON.parse(JSON.stringify(state)); o.sync = { id: stamp, at: Date.now(), device: device || '' }; return JSON.stringify(o); }
  function syncWhen(ms) {
    if (!ms) return 'never';
    var d = new Date(ms), n = new Date(), hm = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    var day = Math.round((new Date(n.getFullYear(), n.getMonth(), n.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
    if (day === 0) return 'today at ' + hm;
    if (day === 1) return 'yesterday at ' + hm;
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + ' at ' + hm;
  }
  /* what a backup file contains: null when it is not a Vamos (or Frase) backup */
  function syncParse(text) {
    text = String(text || '').replace(/^﻿/, '');
    var s = parseState(text); if (!s) return null;
    var m = null; try { m = JSON.parse(text).sync; } catch (e) { }
    m = m && typeof m === 'object' ? m : {};
    return { state: s, id: m.id ? String(m.id) : '', at: +m.at || 0, device: m.device ? String(m.device) : '', n: Object.keys(s.cards).filter(function (k) { return s.cards[k] && s.cards[k].seen; }).length };
  }
  function syncDescribe(r) { return r.n + (r.n === 1 ? ' practiced sentence' : ' practiced sentences') + (r.at ? ', saved ' + syncWhen(r.at) + (r.device ? ' from ' + esc(r.device) : '') : ''); }
  /* save into the file: only when something changed, unless the user asked (manual) or decided to overwrite (force) */
  function syncPush(opt) {
    opt = opt || {};
    if (!SYNC.has) return;
    var st = syncStatus(); if (!st.linked) return;
    if (!st.dirty && !opt.manual && !opt.force) return;
    if ((opt.manual || opt.force) && !opt.quiet) SYNC.manual = true;
    var stamp = syncStamp();
    try { Native.syncPush(syncContent(stamp, st.device), stamp, opt.force ? '*' : opt.manual ? '+' : ''); } catch (e) { }
  }
  function syncCheck() { if (!SYNC.has || !syncStatus().linked) return; try { Native.syncRead('check'); } catch (e) { } }
  /* take over the progress of the file */
  function syncAdopt(r, quiet) {
    state = r.state; reindex(); save();
    try { Native.syncAdopt(r.id || '?'); } catch (e) { }
    SYNC.remote = null;
    if (ui.sheet === 'sync' || ui.sheet === 'sync-ask') closeSheet();
    if (ui.view !== 'tabs') { ui.view = 'tabs'; ui.sess = null; FC.sess = null; }
    render();
    if (!r.id) syncPush({ force: true, quiet: true });        // a plain backup file without a stamp: stamp it now
    toast(quiet ? 'Newer progress loaded from the backup file.' : 'Progress loaded from the backup file.');
  }
  function syncBusyElsewhere(strict) { return (strict ? ui.view !== 'tabs' : ui.view === 'session' || ui.view === 'fc') || !!(ui.sheet && ui.sheet !== 'sync' && ui.sheet !== 'sync-ask'); }
  /* the file and this device both have something the other lacks, or the file was just linked: the user decides */
  function syncAsk(r, why) {
    SYNC.remote = r;
    var head, body;
    if (why === 'linked') {
      head = 'This file already has progress';
      body = 'The file contains ' + syncDescribe(r) + '. This device has ' + counts().learned + ' practiced.<br><br><b>Load the file</b> replaces the progress on this device. <b>Overwrite the file</b> replaces what is in the file with this device\'s progress.';
    } else if (why === 'foreign') {
      head = 'This is not a Vamos backup';
      body = 'The file contains something else. Overwrite it with the progress of this device?';
    } else {
      head = 'Progress was saved from another device';
      body = 'The backup file was changed' + (r && r.at ? ' ' + syncWhen(r.at) : '') + (r && r.device ? ' from ' + esc(r.device) : '') + (r ? ' (' + r.n + ' practiced)' : '') +
        ', and this device has changes that are not in the file (' + counts().learned + ' practiced). Only one can be kept.<br><br><b>Load the file</b> drops this device\'s changes since its last save. <b>Overwrite the file</b> drops what the other device saved.';
    }
    openSheet('<h3>' + head + '</h3><p>' + body + '</p><div class="actions">' +
      '<button class="btn ghost" data-act="sync-overwrite">Overwrite the file</button>' + (r ? '<button class="btn" data-act="sync-take">Load the file</button>' : '<button class="btn" data-act="sync-sheet">Cancel</button>') + '</div>', 'sync-ask');
  }
  function syncSheet() {
    var st = syncStatus(), h = '<h3>Backup file in Google Drive</h3>';
    if (!st.linked) {
      h += '<p>Keep your progress in one file in your Google Drive. Vamos saves into it after every session, and another phone or tablet with Vamos can load the progress from the same file.</p>' +
        '<p>A file screen opens next: tap <b>☰</b> (or "Browse") there, choose <b>Drive</b> and your Google account, then pick the folder. The Google Drive app must be installed and signed in.</p>' +
        (SYNC.linkError ? '<p class="ai-err">' + esc(SYNC.linkError) + '</p>' : '') +
        '<div class="actions"><button class="btn ghost" data-act="sync-open">Use an existing file</button><button class="btn" data-act="sync-create">Create the file</button></div>' +
        '<p class="ai-credit">First device: "Create the file". Other devices: "Use an existing file" and pick the same file.</p>';
    } else {
      h += '<p><b>' + esc(st.name) + '</b><br>' + (st.lastSaved ? 'Last saved from this device ' + syncWhen(st.lastSaved) + '.' : 'Not saved from this device yet.') +
        (st.dirty ? ' There are changes waiting to be saved.' : ' Everything is saved.') + '</p>' +
        (st.error ? '<p class="ai-err">' + esc(st.error) + '</p>' : '') +
        '<p>Vamos saves after each session and when you leave the app, and checks the file when you open the app. Google Drive uploads it when the phone is online.</p>' +
        '<div class="actions"><button class="btn ghost" data-act="sync-load">Load from the file</button><button class="btn" data-act="sync-save">Save now</button></div>' +
        '<div class="actions"><button class="btn danger" data-act="sync-unlink">Disconnect the file</button></div>';
    }
    if (ui.sheet === 'sync' && $('.sheet')) $('.sheet').innerHTML = '<div class="grip"></div>' + h; else openSheet(h, 'sync');
  }
  window.__sync = {
    onEvent: function (ev) {
      if (!ev) return;
      var st = syncStatus(), r;
      if (ev.type === 'linked') {
        SYNC.linkError = ev.ok ? '' : (ev.error || '');
        if (!ev.ok) { if (ui.sheet === 'sync') syncSheet(); if (ev.error) toast(ev.error); return; }
        if (ev.mode === 'create') { toast('Backup file created and saved.'); if (ui.sheet === 'sync') syncSheet(); return; }
        if (!String(ev.text || '').trim()) return syncPush({ force: true });           // an empty file: just fill it
        r = syncParse(ev.text);
        syncAsk(r, r ? 'linked' : 'foreign');
      } else if (ev.type === 'pushed') {
        var manual = SYNC.manual; SYNC.manual = false;
        if (ev.ok) { if (manual) toast('Saved to the backup file.'); if (ui.sheet === 'sync') syncSheet(); return; }
        if (ev.conflict) { if (manual || !syncBusyElsewhere()) { r = syncParse(ev.text); syncAsk(r, !r ? 'foreign' : st.stamp === '?' ? 'linked' : 'conflict'); } return; }
        if (ui.sheet === 'sync') syncSheet();
        if (manual || ui.view !== 'session') toast(ev.error || 'The backup file was not saved.');
      } else if (ev.type === 'read') {
        var load = ev.tag === 'load';
        if (!ev.ok) { if (load) toast(ev.error || 'Could not read the backup file.'); return; }
        if (!String(ev.text || '').trim()) { if (load) toast('The backup file is empty.'); return; }
        r = syncParse(ev.text);
        if (!r) { if (load) toast('That file is not a Vamos backup.'); return; }
        if (load) {
          SYNC.remote = r;
          return openSheet('<h3>Load from the backup file?</h3><p>The file contains ' + syncDescribe(r) + '. The progress on this device (' + counts().learned + ' practiced) will be replaced.</p>' +
            '<div class="actions"><button class="btn ghost" data-act="sync-sheet">Cancel</button><button class="btn" data-act="sync-take">Load</button></div>', 'sync-ask');
        }
        if (!st.linked || r.id === st.stamp || syncBusyElsewhere(true)) return;                 // nothing new, or not a good moment (asked again later)
        if (!st.dirty && st.stamp !== '?') return syncAdopt(r, true);                       // only the other device changed: take it
        syncAsk(r, st.stamp === '?' ? 'linked' : 'conflict');
      }
    },
    onBackground: function () { syncPush(); },
    onForeground: function () { syncCheck(); }
  };

  /* ---------------- flash cards: Spanish words with their meanings in Chinese ----------------
     Dictionary: data/dict.js (about 5,100 words, most common first; tools/build_dict.py from dict/es_zh.txt), loaded the
     first time it is needed. Rows: word, part of speech, gender / feminine, meanings, forms, conjugation (verbs).
     A starred card is a copy (word, part of speech, gender, meanings) kept in the progress, so studying needs no
     dictionary, the backup file carries the cards, and a card can be edited or written by hand.
     k = "word|pos" for a dictionary word, "" for a card written by the user.
     Sound: the word's own recording (data/words/<n>.ogg from Lingua Libre, index data/words.js), else the phone's Spanish voice. */
  var FC = { has: true, db: null, by: null, forms: null, state: 'none', wait: [], q: '', sess: null, audio: null,
    reveal: false,       // the starred list shows the meanings blurred until "Tap to unblur" (blurred again each time the tab opens)
    clearAfter: false }; // a card was starred from the search: the search is emptied when its sheet closes
  var FC_LIMIT = 60, FC_FRONT_KEY = 'frase-fc-front', LOOKUP_KEY = 'frase-lookup-used';
  var FC_POS = { n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb', pron: 'pronoun', det: 'determiner', num: 'number', prep: 'preposition',
    conj: 'conjunction', interj: 'interjection', art: 'article', contr: 'contraction', prop: 'name' };
  var FC_CLITIC = /(me|te|se|nos|os|lo|la|los|las|le|les)$/;
  /* feminine nouns that take "el" (stressed a- / ha-) */
  var FC_EL = dict({ agua: 1, aula: 1, alma: 1, arma: 1, hambre: 1, hacha: 1, ala: 1, ama: 1, ancla: 1, arpa: 1, asma: 1, ave: 1, habla: 1, hada: 1, haba: 1, hampa: 1, asa: 1, aspa: 1, alba: 1, acta: 1, ansia: 1, 'área': 1, 'águila': 1, 'álgebra': 1 });
  var FC_TENSES = [['Present', '现在时'], ['Preterite', '简单过去时'], ['Imperfect', '过去未完成时'], ['Future', '将来时'], ['Conditional', '条件式'], ['Present subjunctive', '虚拟式现在时']];
  var FC_PERS = ['yo', 'tú', 'él · ella · usted', 'nosotros', 'vosotros', 'ellos · ustedes'];
  var FC_IMP = ['tú', 'usted', 'nosotros', 'vosotros', 'ustedes'];
  /* which side of a card comes first: 'es' the Spanish word, 'zh' the Chinese meaning. Kept in the progress (state.fc.front,
     saved through the Java shell); 1.0 and 1.1 kept it in localStorage only. */
  function fcFront() {
    var f = state.fc.front;
    if (!f) { try { f = localStorage.getItem(FC_FRONT_KEY); } catch (e) { } }
    return f === 'zh' ? 'zh' : 'es';
  }
  function fcList(a) { return (Array.isArray(a) ? a : []).map(function (x) { return String(x == null ? '' : x).trim(); }).filter(Boolean); }
  function fcParse(f) {
    var out = { cards: [] }, seen = {};
    if (f && Array.isArray(f.cards)) f.cards.forEach(function (k) {
      if (!k || typeof k.w !== 'string' || !k.w.trim() || !k.id || seen[k.id]) return;
      seen[k.id] = 1;
      var c = { id: String(k.id), w: k.w.trim(), pos: String(k.pos || ''), info: String(k.info || ''), m: fcList(k.m), note: String(k.note || '').trim(), k: String(k.k || ''),
        seen: +k.seen || 0, ok: +k.ok || 0, bad: +k.bad || 0, last: +k.last || 0 };
      var sel = (Array.isArray(k.sel) ? k.sel : []).map(Number).filter(function (n, i, a) { return n >= 0 && n < c.m.length && n % 1 === 0 && a.indexOf(n) === i; }).sort(function (a, b) { return a - b; });
      if (sel.length && sel.length < c.m.length) c.sel = sel;                 // starred meanings; no sel = all of them
      out.cards.push(c);
    });
    if (f && (f.front === 'es' || f.front === 'zh')) out.front = f.front;
    return out;
  }
  function fcCards() { return state.fc.cards; }
  function fcById(id) { var a = fcCards(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function fcByKey(k) { var a = fcCards(); for (var i = 0; i < a.length; i++) if (a[i].k === k) return a[i]; return null; }
  function fcNewId() { var id; do { id = 'f' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36); } while (fcById(id)); return id; }
  function fcSel(k) { return k.sel && k.sel.length ? k.sel : k.m.map(function (x, i) { return i; }); }
  function fcOn(k) { return fcSel(k).map(function (i) { return k.m[i]; }); }
  function fcSetSel(k, sel) { sel = sel.slice().sort(function (a, b) { return a - b; }); if (sel.length >= k.m.length) delete k.sel; else k.sel = sel; }
  function fcRemove(id) { state.fc.cards = fcCards().filter(function (k) { return k.id !== id; }); save(); }
  function fcEntryKey(e) { return e.w + '|' + e.pos; }

  /* words: loose keys (no accents, lower case), gender, plural, feminine */
  function fcKey(s) { return Check.strip(String(s == null ? '' : s).toLowerCase()).trim(); }
  function fcKinds(o) { return String(o.pos || '').split(',').filter(Boolean); }
  /* joven -> jóven: the stressed vowel of a word stressed on the second-last syllable gets its accent mark */
  function fcAccentPenult(w) {
    var groups = [], cur = [], i;
    for (i = 0; i < w.length; i++) {
      var c = w[i];
      if ('aeiouü'.indexOf(c) >= 0 && !(c === 'u' && i && 'qg'.indexOf(w[i - 1]) >= 0)) {
        if (cur.length && 'aeo'.indexOf(c) >= 0 && 'aeo'.indexOf(w[cur[cur.length - 1]]) >= 0) { groups.push(cur); cur = [i]; } else cur.push(i);
      } else if (cur.length) { groups.push(cur); cur = []; }
    }
    if (cur.length) groups.push(cur);
    if (groups.length < 2) return null;
    var g = groups[groups.length - 2], strong = g.filter(function (k) { return 'aeo'.indexOf(w[k]) >= 0; }), at = strong.length ? strong[0] : g[g.length - 1];
    return w.slice(0, at) + 'áéíóú'['aeiou'.indexOf(w[at])] + w.slice(at + 1);
  }
  function fcPlural(w) {
    var s = Check.strip(w);
    if (/[aeiouáéó]$/.test(w)) return w + 's';
    if (/[íú]$/.test(w)) return w + 'es';
    if (/z$/.test(w)) return w.slice(0, -1) + 'ces';
    if (/[aeiou]s$/.test(w) && s === w && w.length > 4) return w;                  // lunes, crisis
    var m = w.match(/([áéíóú])([nsl])$/);
    if (m) return /[íú]/.test(m[1]) && /[aeiou]$/.test(w.slice(0, -2)) ? w + 'es'  // país -> países
      : w.slice(0, -2) + Check.strip(m[1]) + m[2] + 'es';                          // canción -> canciones
    if (s === w && /[^aeiou][eo]n$/.test(w)) { var a = fcAccentPenult(w); if (a) return a + 'es'; }   // joven -> jóvenes
    return w + 'es';
  }
  function fcFem(w) {
    if (/o$/.test(w)) return w.slice(0, -1) + 'a';
    if (/or$/.test(w)) return w + 'a';
    if (/(ón|án|és|ín)$/.test(w)) return Check.strip(w) + 'a';
    return null;
  }
  /* noun: { art, g (label), other (the other gender), pl } from info "m" "f" "mf" "m;f=amiga" "f;m" */
  function fcNoun(o) {
    var p = String(o.info || '').split(';'), g = p[0], w = o.w, fe = '', pl = '', g2 = '', r = null;
    p.slice(1).forEach(function (x) { if (/^f=/.test(x)) fe = x.slice(2); else if (/^pl=/.test(x)) pl = x.slice(3); else if (x === 'm' || x === 'f') g2 = x; });
    var plw = pl || fcPlural(w);
    if (g === 'm') r = { art: 'el', g: 'masculine', pl: 'los ' + plw };
    else if (g === 'f') r = { art: FC_EL[w] || /^h?[áÁ]/.test(w) ? 'el' : 'la', g: 'feminine', pl: 'las ' + plw };
    else if (g === 'mf') r = { art: 'el/la', g: 'masculine or feminine', pl: 'los/las ' + plw };
    if (!r) return null;
    if (fe) { r.other = 'la ' + fe; r.pl += ' · las ' + fcPlural(fe); r.g = 'masculine · feminine: ' + fe; }
    if (g2) { r.g = (g === 'f' ? 'feminine' : 'masculine') + ' or ' + (g2 === 'f' ? 'feminine' : 'masculine') + ' (the meaning changes)'; r.pl = (g === 'f' ? 'las/los ' : 'los/las ') + plw; }
    if (FC_EL[w]) r.g += ' (el ' + w + ', but las ' + plw + ')';
    return r;
  }
  /* adjective: masculine, feminine, plurals */
  function fcAdj(o) {
    var m = String(o.info || '').match(/f=([^;,\s]+)/), w = o.w, f = m ? m[1] : fcFem(w);
    if (!f || f === w) return [w, fcPlural(w)];
    return [w, f, fcPlural(w), fcPlural(f)];
  }
  /* what the card shows as the word: "la casa", "el/la estudiante", "comer" */
  function fcDisplay(o) {
    var k = fcKinds(o);
    if (k[0] === 'n') { var n = fcNoun(o); if (n) return n.art + ' ' + o.w; }
    return o.w;
  }
  function fcPosText(o) {
    var k = fcKinds(o); if (!k.length) return '';
    var t = k.map(function (x) { return FC_POS[x] || x; }).join(' / ');
    if (k[0] === 'n') { var n = fcNoun(o); if (n) t += ' · ' + n.g; }
    return t;
  }
  /* the part of speech without any Spanish form (the front of a card that shows the Chinese meaning) */
  function fcPosHint(o) {
    var k = fcKinds(o); if (!k.length) return '';
    var t = k.map(function (x) { return FC_POS[x] || x; }).join(' / '), p = String(o.info || '').split(';');
    var G = { m: 'masculine', f: 'feminine', mf: 'masculine or feminine' };
    if (k[0] === 'n' && G[p[0]]) t += ' · ' + G[p[0]] + (p[1] === 'm' || p[1] === 'f' ? ' or ' + G[p[1]] : '');
    return t;
  }
  /* the Spanish word inside its own Chinese meanings ("tener que 必须") is hidden on a card that shows the meaning first */
  function fcMaskWord(text, k) {
    var keys = dict();
    String(k.w).split(/\s+/).concat([k.w]).forEach(function (x) { keys[fcKey(x)] = 1; });
    var e = fcEntryOf(k); if (e) fcForms(e).forEach(function (x) { keys[fcKey(x)] = 1; });
    return String(text).split(/([A-Za-zÀ-ÖØ-öø-ÿ]+)/).map(function (t, i) { return i % 2 && keys[fcKey(t)] ? '～' : t; }).join('');
  }
  function fcPosShort(o) { var k = fcKinds(o); return k.length ? FC_POS[k[0]] || k[0] : ''; }

  /* dictionary */
  function fcForms(e) {
    var out = e.fm.slice();
    if (e.cj) e.cj.split(/[|;,]/).forEach(function (x) { x.split(/[\s()]+/).forEach(function (t) { if (t && !/^(me|te|se|nos|os)$/.test(t)) out.push(t); }); });
    return out;
  }
  function fcLoad(cb) {
    if (FC.db) { if (cb) cb(); return; }
    if (cb) FC.wait.push(cb);
    if (FC.state === 'loading') return;
    FC.state = 'loading';
    var s = document.createElement('script');
    s.src = 'data/dict.js';
    s.onload = function () {
      var d = window.DICT_DATA; window.DICT_DATA = null;
      if (!d || !d.rows) return s.onerror();
      var by = dict(), forms = dict();
      FC.db = d.rows.split('\n').map(function (line, i) {
        var f = line.split('\t'), e = { i: i, w: f[0], pos: f[1] || '', info: f[2] || '', m: f[3] ? f[3].split('¦') : [], fm: f[4] ? f[4].split(',') : [], cj: f[5] || '' };
        e.key = fcKey(e.w);
        (by[e.key] || (by[e.key] = [])).push(e);
        return e;
      });
      var enc = dict();
      FC.db.forEach(function (e) {
        fcForms(e).forEach(function (x) { var k = fcKey(x); if (k && k !== e.key) { var a = forms[k] || (forms[k] = []); if (a.indexOf(e) < 0) a.push(e); } });
        fcEncForms(e).forEach(function (x) { x.e = e; (enc[x.k] || (enc[x.k] = [])).push(x); });
      });
      FC.by = by; FC.forms = forms; FC.enc = enc; FC.state = 'ready';
      var w = FC.wait; FC.wait = []; w.forEach(function (fn) { fn(); });
    };
    s.onerror = function () { FC.state = 'error'; FC.wait = []; var el = $('#fc-list'); if (el) el.innerHTML = fcListHTML(); };
    document.head.appendChild(s);
  }
  function fcIsWord(k) { return !!(FC.by && (FC.by[k] || FC.forms[k])); }
  /* the forms of a verb that pronouns are attached to: infinitive, gerund, affirmative imperative
     (siéntate = sienta + te, dímelo = di + me + lo, vámonos = vamos + nos, sentaos = sentad + os) */
  function fcEncForms(e) {
    var c = fcConj(e); if (!c || /se$/.test(e.w)) return [];
    var out = [{ k: e.key, l: 'infinitive', p: 'inf' }];
    if (c.ger) out.push({ k: fcKey(c.ger), l: 'gerund', p: 'ger' });
    c.imp.forEach(function (f, n) {
      if (!f) return;
      var k = fcKey(f), p = FC_IMP[n], l = 'imperative · ' + p;
      out.push({ k: k, l: l, p: p });
      if ((p === 'nosotros' && /mos$/.test(k)) || (p === 'vosotros' && /d$/.test(k))) out.push({ k: k.slice(0, -1), l: l, p: p, cut: 1 });
    });
    return out;
  }
  /* may these pronouns follow that form? siéntate (tú + te) yes, but not usted + te; vámonos only without the s */
  function fcEncOk(y, cl) {
    var first = cl[0];
    if (y.cut) return first === (y.p === 'nosotros' ? 'nos' : 'os');
    if ((y.p === 'nosotros' && first === 'nos') || (y.p === 'vosotros' && first === 'os')) return false;
    if ((y.p === 'usted' || y.p === 'ustedes') && (first === 'te' || first === 'os')) return false;
    if (y.p === 'tú' && (first === 'os' || (first === 'se' && cl.length === 1))) return false;
    return true;
  }
  /* a word with pronouns at the end: [{ k: what is left, cl: the pronouns }], one pronoun taken off, then two */
  function fcStrip(key) {
    var out = [], k = key, cl = [], m;
    while (cl.length < 2 && (m = k.match(FC_CLITIC)) && k.length - m[1].length >= 2) {
      k = k.slice(0, -m[1].length); cl.unshift(m[1]);
      out.push({ k: k, cl: cl.slice() });
    }
    return out;
  }
  /* a word as written in a sentence -> dictionary entries: the word itself, a form of a word (tengo -> tener),
     a verb with pronouns attached (dímelo -> decir, siéntate -> sentar) */
  function fcLookup(word) {
    var low = String(word || '').toLowerCase().trim(), key = fcKey(low), out = [], seen = {};
    function add(e) { if (e && !seen[e.i]) { seen[e.i] = 1; out.push(e); } }
    if (!key || !FC.db) return out;
    (FC.by[key] || []).filter(function (e) { return e.w.toLowerCase() === low; }).forEach(add);
    (FC.by[key] || []).forEach(add);
    (FC.forms[key] || []).forEach(add);
    if (!out.length && /^[a-z]+$/.test(key)) fcStrip(key).some(function (x) { (FC.enc[x.k] || []).forEach(function (y) { if (fcEncOk(y, x.cl)) add(y.e); }); return out.length > 0; });
    return out;
  }
  /* "tengo" in tener -> "present · yo" (verbs only) */
  function fcFormNote(e, word) {
    var key = fcKey(word); if (!key || key === e.key) return '';
    var c = fcConj(e);
    if (c) {
      for (var t = 0; t < c.t.length; t++) for (var p = 0; p < c.t[t].length; p++) if (c.t[t][p] && c.t[t][p].split(/[\s()]+/).map(fcKey).indexOf(key) >= 0) return FC_TENSES[t][0].toLowerCase() + ' · ' + FC_PERS[p];
      for (p = 0; p < c.imp.length; p++) if (fcKey(c.imp[p]) === key) return 'imperative · ' + FC_IMP[p];
      if (fcKey(c.ger) === key) return 'gerund';
      if (fcKey(c.par) === key) return 'participle';
      var hit = '', enc = fcEncForms(e);
      fcStrip(key).some(function (x) { var f = enc.filter(function (y) { return y.k === x.k && fcEncOk(y, x.cl); })[0]; if (f) hit = f.l + ' + ' + x.cl.join(' + '); return !!hit; });
      return hit;
    }
    return e.fm.map(fcKey).indexOf(key) >= 0 ? 'form of ' + e.w : '';
  }
  /* search: Spanish (the word, its forms, words starting with it) or Chinese (the meanings) */
  function fcSearch(q) {
    q = String(q || '').trim();
    if (!q || !FC.db) return [];
    var out = [], seen = {}, db = FC.db, i;
    function add(e) { if (!seen[e.i]) { seen[e.i] = 1; out.push(e); } }
    var hz = q.replace(/[^㐀-鿿]/g, '');
    if (hz) {
      var bare = function (x) { return x.replace(/（[^）]*）/g, '').split(/[，、；\s]+/); };
      for (i = 0; i < db.length; i++) if (db[i].m.some(function (x) { return bare(x).indexOf(hz) >= 0; })) add(db[i]);      // a meaning that is exactly it
      for (i = 0; i < db.length && out.length < 2 * FC_LIMIT; i++) if (db[i].m.join('；').indexOf(hz) >= 0) add(db[i]);    // meanings with it
      return out;
    }
    var low = q.toLowerCase().replace(/[¿?¡!.,;:"«»]/g, ' ').replace(/^\s*(el|la|los|las|un|una|unos|unas)\s+/, '').trim(), key = fcKey(low);
    if (!key) return [];
    fcLookup(low).forEach(function (e) { e.via = fcFormNote(e, low); add(e); });
    var exact = out.length;
    if (key.length >= 2) for (i = 0; i < db.length && out.length < exact + FC_LIMIT; i++) if (db[i].key.indexOf(key) === 0) { db[i].via = ''; add(db[i]); }
    return out;
  }

  /* starring */
  function fcStarEntry(e, sense) {       // sense == null: the whole word; else: switch one meaning of it on or off
    var key = fcEntryKey(e), k = fcByKey(key);
    if (sense == null) {
      if (k) { fcRemove(k.id); return false; }
    } else if (k) {
      var sel = fcSel(k).slice(), at = sel.indexOf(sense);
      if (at >= 0) sel.splice(at, 1); else sel.push(sense);
      if (!sel.length) { fcRemove(k.id); return false; }
      fcSetSel(k, sel); save(); return at < 0;
    }
    k = { id: fcNewId(), w: e.w, pos: e.pos, info: e.info, m: e.m.slice(), note: '', k: key, seen: 0, ok: 0, bad: 0, last: 0 };
    if (sense != null && e.m.length > 1) k.sel = [sense];
    fcCards().push(k); save(); return true;
  }
  /* the dictionary entry of a card (or the entry itself) */
  function fcEntryOf(o) {
    if (!o || !FC.by) return null;
    if (o.cj !== undefined && o.fm) return o;
    if (!o.k) return null;
    return (FC.by[fcKey(o.w)] || []).filter(function (e) { return fcEntryKey(e) === o.k; })[0] || null;
  }
  function fcConj(e) {
    if (!e || !e.cj) return null;
    var p = e.cj.split(';'), g = p[0].split('|').map(function (x) { return x.split(','); });
    return { t: g.slice(0, 6), imp: g[6] || [], ger: p[1] || '', par: p[2] || '' };
  }

  /* sentences of the pack that use a word ("In your sentences") */
  function fcTokens(text) { return String(text || '').match(/[A-Za-zÀ-ÖØ-öø-ÿ]+/g) || []; }
  function fcTokenKeys(t) {          // the word; a verb with pronouns attached also as "+" and the verb form (cómprame -> +compra)
    var k = fcKey(t), list = [k];
    if (!fcIsWord(k) && FC.enc) fcStrip(k).some(function (x) {
      var ok = (FC.enc[x.k] || []).filter(function (y) { return fcEncOk(y, x.cl); });
      ok.forEach(function (y) { list.push('+' + x.k + '/' + y.p); });
      return ok.length > 0;
    });
    return list;
  }
  function fcSentIndex() {
    var sig = all.length + ':' + state.custom.length + ':' + (state.custom.length ? state.custom[state.custom.length - 1].id : '');
    if (FC.sx && FC.sxSig === sig) return FC.sx;
    var ix = dict();
    all.forEach(function (s) {
      var seen = dict();
      fcTokens(s.es).forEach(function (t) { fcTokenKeys(t).forEach(function (k) { if (!seen[k]) { seen[k] = 1; (ix[k] || (ix[k] = [])).push(s); } }); });
    });
    FC.sx = ix; FC.sxSig = sig; return ix;
  }
  function fcWordKeys(o, e) {
    var keys = dict();
    if (e) { keys[e.key] = 1; fcForms(e).forEach(function (x) { keys[fcKey(x)] = 1; }); fcEncForms(e).forEach(function (x) { keys['+' + x.k + '/' + x.p] = 1; }); }
    else if (o.w && !/\s/.test(o.w.trim())) keys[fcKey(o.w)] = 1;
    return keys;
  }
  function fcMark(text, keys) {
    return String(text).split(/([A-Za-zÀ-ÖØ-öø-ÿ]+)/).map(function (t, i) {
      if (i % 2 === 0) return esc(t);
      return fcTokenKeys(t).some(function (k) { return keys[k]; }) ? '<b>' + esc(t) + '</b>' : esc(t);
    }).join('');
  }
  function fcExamplesHTML(o, e, max) {
    if (!FC.db) return '';
    var keys = fcWordKeys(o, e); if (!Object.keys(keys).length) return '';
    var ix = fcSentIndex(), found = [], seen = {};
    Object.keys(keys).forEach(function (k) { (ix[k] || []).forEach(function (s) { if (!seen[s.id]) { seen[s.id] = 1; found.push(s); } }); });
    if (!found.length) return '';
    found.sort(function (a, b) { return a.es.length - b.es.length || (a.id < b.id ? -1 : 1); });
    return '<div class="r-label">In your sentences' + (found.length > max ? ' · ' + max + ' of ' + found.length : '') + '</div>' + found.slice(0, max).map(function (s) {
      return '<div class="fc-ex"><div class="fc-ex-es" lang="es">' + fcMark(s.es, keys) + '</div><div class="fc-ex-zh" lang="zh-CN">' + esc(s.zh) + '</div></div>';
    }).join('');
  }
  /* Spanish text with every word tappable (result panel, sentence details): opens the word in the dictionary */
  function wordsHTML(text) {
    return String(text).split(/([A-Za-zÀ-ÖØ-öø-ÿ]+)/).map(function (t, i) {
      return i % 2 ? '<span class="lw" data-act="lookup" data-w="' + esc(t) + '">' + esc(t) + '</span>' : esc(t);
    }).join('');
  }
  function lookupHint() { var used = false; try { used = !!localStorage.getItem(LOOKUP_KEY); } catch (e) { } return used ? '' : '<div class="lw-hint">Tap a word to see what it means</div>'; }
  function lookupWord(w) {
    try { localStorage.setItem(LOOKUP_KEY, '1'); } catch (e) { }
    var hint = $('.lw-hint'); if (hint) hint.remove();
    fcLoad(function () {
      var r = fcLookup(w);
      if (!r.length) return toast('“' + w + '” is not in the dictionary.');
      fcEntrySheet(r[0].i, r.slice(1), w);
    });
  }

  /* sound: the recording of the word, else the phone's Spanish voice. The web app (1.3.2) plays the same recordings as AAC
     (window.AUDIO_EXT = 'm4a', set by web.js: Safari cannot play Ogg); they are heard in silent mode too, unlike the voice.
     words.js is loaded at the start there, so the recording starts inside the tap (Safari needs that). */
  function fcWordAudio(cb) {
    if (window.WORD_AUDIO_OFF) { FC.words = null; return cb(null); }
    if (FC.words !== undefined) return cb(FC.words);
    if (FC.wordWait) return FC.wordWait.push(cb);
    FC.wordWait = [cb];
    var s = document.createElement('script'), done = function () {
      FC.words = window.WORD_AUDIO ? dict(window.WORD_AUDIO) : null; window.WORD_AUDIO = null; FC.credits = window.WORD_CREDITS || ''; window.WORD_CREDITS = null;
      var w = FC.wordWait; FC.wordWait = null; w.forEach(function (f) { f(FC.words); });
    };
    s.src = 'data/words.js'; s.onload = done; s.onerror = done; document.head.appendChild(s);
  }
  if (WEB && window.AUDIO_EXT) setTimeout(function () { fcWordAudio(function () { }); }, 0);
  function fcSay(w) {
    w = String(w || '').trim(); if (!w) return;
    var token = FC.sayToken = (FC.sayToken || 0) + 1;
    try { if (FC.audio) FC.audio.pause(); } catch (e) { }
    fcWordAudio(function (idx) {
      if (token !== FC.sayToken) return;
      var n = idx ? (idx[w] != null ? idx[w] : idx[w.toLowerCase()]) : null;
      var voice = function () { speak(w, function () { toast(idx ? 'No recording of this word, and the phone has no Spanish voice. Add one in Settings → Text-to-speech output.' : noVoiceText()); }); };
      if (n != null) fcPlay('data/words/' + n + '.' + (window.AUDIO_EXT || 'ogg'), token, voice); else voice();
    });
  }
  function fcPlay(url, token, onFail) {
    var a = FC.audio || (FC.audio = new Audio()), started = false;
    var fail = function () { if (!started && token === FC.sayToken) { started = true; onFail(); } };
    a.onerror = fail;
    a.onplaying = function () { started = true; };
    a.src = url;
    try { if (IOS && navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { }
    var pr = a.play(); if (pr && pr.catch) pr.catch(function (e) { if (e && e.name === 'NotAllowedError') toast('The sound could not be played.'); else fail(); });
  }

  /* cards tab */
  function fcCountText(n) { return n === 1 ? '1 starred word' : n + ' starred words'; }
  function fcSayBtn(w, cls) { return w ? '<button class="fc-say' + (cls ? ' ' + cls : '') + '" data-act="fc-say" data-w="' + esc(w) + '" aria-label="Listen">' + IC.sound + '</button>' : ''; }
  function fcRowHTML(o) {      // o: { w, pos, text, act, id, star, on, tag, say }
    return '<div class="fc-row" data-act="' + o.act + '" data-id="' + esc(o.id) + '"><div class="row-main">' +
      '<div class="fc-row-w"><span lang="es">' + esc(o.w) + '</span>' + (o.pos ? '<em>' + esc(o.pos) + '</em>' : '') + (o.tag ? '<span class="badge new">' + esc(o.tag) + '</span>' : '') + '</div>' +
      '<div class="fc-row-m" lang="zh-CN">' + esc(o.text) + '</div></div>' + fcSayBtn(o.say) +
      '<button class="star-btn' + (o.on ? ' on' : '') + '" data-act="' + o.star + '" data-id="' + esc(o.id) + '" aria-label="Star">' + IC.star + '</button></div>';
  }
  function fcListHTML() {
    var q = FC.q.trim(), cards = fcCards();
    if (!q) {
      if (!cards.length) return '<div class="empty"><div class="big">ñ</div>No starred words yet.<br>Search a Spanish word (<i>casa</i>, <i>tengo</i>) or a meaning in Chinese (<span lang="zh-CN">朋友</span>), and tap the star to collect it.</div>';
      return '<button class="fc-unblur" data-act="fc-unblur">' + IC.eye + (FC.reveal ? 'Blur again' : 'Tap to unblur') + '</button>' +
        '<div class="fc-starred' + (fcFront() === 'zh' ? ' front-zh' : '') + (FC.reveal ? '' : ' blur') + '">' + cards.slice().reverse().map(function (k) {
          return fcRowHTML({ w: fcDisplay(k), pos: fcPosShort(k), text: fcOn(k).slice(0, 3).join('；'), act: 'fc-card', id: k.id, star: 'fc-unstar', on: true, say: k.w,
            tag: !k.k ? 'mine' : k.sel ? k.sel.length + ' of ' + k.m.length + ' meanings' : '' });
        }).join('') + '</div>';
    }
    if (FC.state === 'error') return '<div class="empty"><div class="big">⚠️</div>The dictionary could not be loaded.</div>';
    if (!FC.db) { fcLoad(function () { var el = $('#fc-list'); if (el) el.innerHTML = fcListHTML(); }); return '<div class="empty">Loading the dictionary…</div>'; }
    var res = fcSearch(q);
    if (!res.length) return '<div class="empty"><div class="big">🔎</div>Nothing found for “' + esc(q) + '”.<br><button class="link-inline" data-act="fc-new" style="display:inline">Write this card yourself</button></div>';
    return res.slice(0, FC_LIMIT).map(function (e) {
      return fcRowHTML({ w: fcDisplay(e), pos: fcPosShort(e), text: e.m.slice(0, 3).join('；'), act: 'fc-open', id: e.i, star: 'fc-star', on: !!fcByKey(fcEntryKey(e)), say: e.w, tag: e.via || '' });
    }).join('') + (res.length > FC_LIMIT ? '<p class="fc-more">Showing the ' + FC_LIMIT + ' most common of ' + res.length + '. Type more to narrow it down.</p>' : '');
  }
  function fcTabHTML() {
    var n = fcCards().length, f = fcFront();
    return '<div class="head-row"><div><h2 class="title">Flash cards</h2><p class="sub">' + fcCountText(n) + '</p></div>' +
      (n ? '<button class="btn small" data-act="fc-study" style="margin-bottom:18px">' + IC.play + 'Study' + (n > 1 ? ' all ' + n : '') + '</button>' : '') + '</div>' +
      '<div class="search">' + IC.search + '<input id="fq" type="search" lang="es" placeholder="Search español or 中文" value="' + esc(FC.q) + '" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></div>' +
      (n && !FC.q.trim() ? '<div class="filters fc-front-pick"><span>Show first</span><button class="chip' + (f === 'es' ? ' on' : '') + '" data-act="fc-front" data-f="es">Spanish word</button>' +
        '<button class="chip' + (f === 'zh' ? ' on' : '') + '" data-act="fc-front" data-f="zh">Chinese meaning</button></div>' : '') +
      '<div id="fc-list">' + fcListHTML() + '</div>' +
      (FC.q.trim() ? '' : '<button class="link-inline" data-act="fc-new" style="margin:6px 4px 0">+ Write a card yourself</button>');
  }

  /* what is shown about a word: in the sheets and on the back of a card */
  function fcConjTable(rows, labels) {
    return '<table class="fc-conj">' + rows.map(function (f, n) {
      return f ? '<tr' + (labels[n] === 'vosotros' ? ' class="vos"' : '') + '><th>' + esc(labels[n]) + '</th><td lang="es">' + esc(f) + '</td></tr>' : '';
    }).join('') + '</table>';
  }
  function fcConjHTML(c) {
    var lab = function (n) { return '<div class="r-label">' + FC_TENSES[n][0] + ' · <span lang="zh-CN">' + FC_TENSES[n][1] + '</span></div>'; };
    var more = c.t.slice(1).map(function (rows, n) { return rows.some(Boolean) ? lab(n + 1) + fcConjTable(rows, FC_PERS) : ''; }).join('') +
      (c.imp.some(Boolean) ? '<div class="r-label">Imperative · <span lang="zh-CN">命令式</span></div>' + fcConjTable(c.imp, FC_IMP) : '') +
      '<div class="fc-vf"><span>Gerund <b lang="es">' + esc(c.ger) + '</b></span><span>Participle <b lang="es">' + esc(c.par) + '</b></span></div>' +
      '<p class="fc-tip">vosotros: used in Spain. Latin America uses ustedes.</p>';
    return lab(0) + fcConjTable(c.t[0], FC_PERS) + '<details class="fc-tenses"><summary>More tenses</summary>' + more + '</details>';
  }
  function fcFormsHTML(o, e) {
    var k = fcKinds(o), c = fcConj(e);
    if (k[0] === 'v' && c) return fcConjHTML(c);
    if (k[0] === 'n') { var n = fcNoun(o); return n ? '<div class="r-label">Forms</div><div class="fc-forms" lang="es">' + esc(fcDisplay(o)) + (n.other ? ' · ' + esc(n.other) : '') + ' · ' + esc(n.pl) + '</div>' : ''; }
    if (k.indexOf('adj') >= 0) return '<div class="r-label">Forms</div><div class="fc-forms" lang="es">' + esc(fcAdj(o).join(' · ')) + '</div>';
    if (c) return fcConjHTML(c);
    return '';
  }
  /* o: a card or a dictionary entry { w, pos, info, m, sel, note }   sel = indexes of the starred meanings (none given = all)
     stars: null = no stars | { act, id, on(n) }   split: starred meanings first, the others under "Not starred meanings" */
  function fcBodyHTML(o, stars, split, inStudy) {
    var h = '', sel = o.sel && o.sel.length ? o.sel : null, isOn = function (n) { return !sel || sel.indexOf(n) >= 0; };
    function list(idx, cls) {
      return '<ol class="fc-senses' + (idx.length === 1 && !stars ? ' one' : '') + (cls || '') + '" lang="zh-CN">' + idx.map(function (n) {
        return '<li><span>' + esc(o.m[n]) + '</span>' + (stars ? '<button class="star-btn sm' + (stars.on(n) ? ' on' : '') + '" data-act="' + stars.act + '" data-id="' + esc(stars.id) + '" data-s="' + n + '" aria-label="Star this meaning">' + IC.star + '</button>' : '') + '</li>';
      }).join('') + '</ol>';
    }
    var every = o.m.map(function (x, i) { return i; }), on = split ? every.filter(isOn) : every, off = split ? every.filter(function (n) { return !isOn(n); }) : [];
    if (on.length) h += '<div class="r-label">Meaning</div>' + list(on);
    if (off.length) h += '<div class="r-label">Not starred meanings</div>' + list(off, ' off');
    if (o.note) h += '<div class="r-label">Note</div><div class="fc-note">' + esc(o.note) + '</div>';
    var e = fcEntryOf(o);
    h += fcFormsHTML(o, e) + fcExamplesHTML(o, e, inStudy ? 2 : 4);
    return h;
  }
  function fcHeadHTML(o, right) {
    var pos = fcPosText(o);
    return '<div class="fc-head"><div class="fc-head-main">' + (pos ? '<div class="fc-pos">' + esc(pos) + '</div>' : '') + '<div class="fc-big" lang="es">' + esc(fcDisplay(o)) + '</div></div>' +
      '<div class="fc-head-btns">' + fcSayBtn(o.w, 'lg') + right + '</div></div>';
  }
  function fcEntrySheet(i, others, via) {
    var e = FC.db && FC.db[i]; if (!e) return;
    var card = fcByKey(fcEntryKey(e)), on = !!card, note = via ? fcFormNote(e, via) : '';
    others = others || [];
    var h = (note ? '<div class="fc-via"><b lang="es">' + esc(via) + '</b> → <b lang="es">' + esc(e.w) + '</b> · ' + esc(note) + '</div>' : '') +
      fcHeadHTML(e, '<button class="star-btn lg' + (on ? ' on' : '') + '" data-act="fc-star" data-id="' + e.i + '" data-sheet="1" aria-label="Star">' + IC.star + '</button>') +
      fcBodyHTML(e, e.m.length > 1 ? { act: 'fc-star-sense', id: e.i, on: function (n) { return !!card && fcSel(card).indexOf(n) >= 0; } } : null) +
      (others.length ? '<div class="r-label">Other words' + (via ? ' for “' + esc(via) + '”' : '') + '</div>' + others.map(function (x) {
        return '<button class="fc-other" data-act="fc-open" data-id="' + x.i + '"><b lang="es">' + esc(fcDisplay(x)) + '</b><span lang="zh-CN">' + esc(x.m.slice(0, 2).join('；')) + '</span></button>';
      }).join('') : '') +
      '<p class="fc-tip">' + IC.starFill + ' The big star adds the word to your flash cards.' + (e.m.length > 1 ? ' The small stars choose single meanings: only those are practised and shown in your list.' : '') + '</p>';
    ui.fcEntry = { i: i, others: others, via: via || '' };
    if (ui.sheet === 'fc-entry' && $('.sheet')) { var sc = $('.sheet').scrollTop; $('.sheet').innerHTML = '<div class="grip"></div>' + h; $('.sheet').scrollTop = sc; }
    else openSheet(h, 'fc-entry');
  }
  function fcCardSheet(id) {
    var k = fcById(id); if (!k) return;
    if (!FC.db && k.k) fcLoad(function () { if (ui.sheet === 'fc-card') fcCardSheet(id); });      // forms, conjugation, examples
    var meta = k.seen ? 'Studied ' + k.seen + '× · remembered ' + k.ok + '× · forgot ' + k.bad + '×' : 'Not studied yet';
    var stars = k.m.length > 1 ? { act: 'fc-card-sense', id: id, on: function (n) { return fcSel(k).indexOf(n) >= 0; } } : null;
    var h = fcHeadHTML(k, '') + fcBodyHTML(k, stars, true) + '<div class="d-meta">' + meta + '</div>' +
      (stars ? '<p class="fc-tip">' + IC.starFill + ' Tap a star to choose which meanings you practise. Only the starred ones show in your list.</p>' : '') +
      '<div class="actions"><button class="btn danger" data-act="fc-unstar" data-id="' + esc(id) + '" data-sheet="1">Remove this card</button></div>' +
      '<button class="link-inline" data-act="fc-edit" data-id="' + esc(id) + '" style="text-align:center;margin-top:8px">Edit the text of this card</button>';
    if (ui.sheet === 'fc-card' && $('.sheet')) { var sc = $('.sheet').scrollTop; $('.sheet').innerHTML = '<div class="grip"></div>' + h; $('.sheet').scrollTop = sc; } else openSheet(h, 'fc-card');
  }
  function fcEditSheet(id) {
    var k = id ? fcById(id) : null, q = FC.q.trim();
    if (id && !k) return;
    ui.fcEdit = id || '';
    var w = k ? k.w : (/[㐀-鿿]/.test(q) ? '' : q), m = k ? k.m.join('\n') : (/[㐀-鿿]/.test(q) ? q : ''), lab = function (t) { return '<label class="fc-lab">' + t + '</label>'; };
    openSheet('<h3>' + (k ? 'Edit card' : 'Write a card yourself') + '</h3>' +
      lab('Spanish word or phrase') + '<input class="fc-in" id="fc-w" lang="es" value="' + esc(w) + '" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">' +
      lab('Meaning in Chinese – one per line') + '<textarea class="paste fc-ta" id="fc-m" lang="zh-CN" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">' + esc(m) + '</textarea>' +
      lab('Note (optional) – gender, an irregular form, an example') + '<input class="fc-in" id="fc-note" lang="es" value="' + esc(k ? k.note : '') + '" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">' +
      '<div class="actions"><button class="btn ghost" data-act="' + (k ? 'fc-card' : 'close-sheet') + '" data-id="' + esc(id || '') + '">Cancel</button><button class="btn" data-act="fc-save">Save</button></div>', 'fc-edit');
  }
  function fcSaveEdit() {
    var k = ui.fcEdit ? fcById(ui.fcEdit) : null, lines = function (sel) { return $(sel).value.split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean); };
    var w = $('#fc-w').value.replace(/\s+/g, ' ').trim(), m = lines('#fc-m'), note = $('#fc-note').value.replace(/\s+/g, ' ').trim();
    if (!/[A-Za-zÀ-ÿ]/.test(w) || /[㐀-鿿]/.test(w)) return toast('Write the Spanish word first.');
    if (!m.length) return toast('Add at least one meaning.');
    if (k) {
      if (k.w !== w) { k.k = ''; k.pos = ''; k.info = ''; }                       // no longer the dictionary word
      if (m.join('\n') !== k.m.join('\n')) delete k.sel;                         // the meanings changed: all starred again
      k.w = w; k.m = m; k.note = note;
    } else {
      k = { id: fcNewId(), w: w, pos: '', info: '', m: m, note: note, k: '', seen: 0, ok: 0, bad: 0, last: 0 };
      fcCards().push(k);
    }
    save(); closeSheet(); FC.q = ''; render(); toast(ui.fcEdit ? 'Card saved.' : 'Card added to your starred words.');
    ui.fcEdit = null;
  }

  /* study session: every starred card once, in random order; a forgotten card comes back until it is remembered */
  function fcStart() {
    var ids = shuffle(fcCards().map(function (k) { return k.id; }));
    if (!ids.length) return toast('Star some words first.');
    FC.sess = { queue: ids, total: ids.length, done: 0, shown: false, first: {}, order: ids.slice(), drop: {}, front: fcFront() };
    ui.view = 'fc'; closeSheet(); $('#toast').classList.remove('show'); render();
    fcLoad(function () { if (ui.view === 'fc' && FC.sess && FC.sess.shown) render(); });      // forms and examples on the back
  }
  function fcCur() { return FC.sess && fcById(FC.sess.queue[0]); }
  /* several starred cards with the same word: the front says which one is asked */
  function fcHint(k) {
    var same = fcCards().filter(function (x) { return fcKey(x.w) === fcKey(k.w); });
    return same.length > 1 ? esc(fcPosText(k) || 'card ' + (same.indexOf(k) + 1) + ' of ' + same.length) : '';
  }
  function fcSessionHTML() {
    var s = FC.sess, k = fcCur();
    var top = '<div class="s-top fc-top"><button class="icon-btn" data-act="fc-quit" aria-label="Close">' + IC.close + '</button><div class="fc-count">' + Math.min(s.done + 1, s.total) + '/' + s.total + '</div><span class="icon-btn"></span></div>';
    var foot = '<div class="s-foot"><button class="btn-check fc-show" data-act="fc-show">SHOW ANSWER</button></div></div>';
    if (!s.shown && s.front === 'zh') return '<div class="session fc">' + top + '<div class="fc-front zh">' + (fcPosShort(k) ? '<div class="fc-pos">' + esc(fcPosHint(k)) + '</div>' : '') +
      '<ol class="fc-senses fc-front-m' + (fcOn(k).length === 1 ? ' one' : '') + '" lang="zh-CN">' + fcOn(k).map(function (x) { return '<li><span>' + esc(fcMaskWord(x, k)) + '</span></li>'; }).join('') + '</ol></div>' +
      '<p class="fc-ask">How do you say this in Spanish?</p>' + foot;
    if (!s.shown) return '<div class="session fc">' + top + '<div class="fc-front"><div class="fc-word' + (fcDisplay(k).length > 13 ? ' long' : '') + '" lang="es">' + esc(fcDisplay(k)) + '</div><div class="fc-hint">' + fcHint(k) + '</div>' + fcSayBtn(k.w, 'xl') + '</div>' +
      '<p class="fc-ask">What does this ' + (/\s/.test(k.w) ? 'phrase' : 'word') + ' mean?</p>' + foot;
    return '<div class="session fc">' + top + '<div class="s-body fc-back">' +
      fcHeadHTML(k, '<button class="star-btn lg' + (s.drop[k.id] ? '' : ' on') + '" data-act="fc-sess-star" aria-label="Starred">' + IC.star + '</button>') +
      (s.drop[k.id] ? '<div class="r-note">Unstarred – this card leaves your list when you go on.</div>' : '') + fcBodyHTML(k, null, true, true) + '</div>' +
      '<div class="fc-judge"><button class="forgot" data-act="fc-forgot">' + IC.close + '<span>Forgot</span></button><i></i><button class="remember" data-act="fc-remember">' + IC.check + '<span>Remember</span></button></div></div>';
  }
  function fcAnswer(ok) {
    var s = FC.sess, k = fcCur(); if (!s || !s.shown || !k) return;
    var id = k.id, first = !(id in s.first);
    if (first) { s.first[id] = ok; k.seen++; if (ok) k.ok++; else k.bad++; k.last = today(); }
    s.queue.shift(); s.shown = false;
    if (s.drop[id]) state.fc.cards = fcCards().filter(function (x) { return x.id !== id; });
    else if (!ok) s.queue.splice(Math.min(s.queue.length, 3 + Math.floor(Math.random() * 3)), 0, id);      // comes back a few cards later
    if (ok || s.drop[id]) s.done++;
    if (!s.queue.length) { ui.view = 'fcsum'; }
    save(); render();
    if (ui.view === 'fcsum') syncPush();
  }
  function fcSummaryHTML() {
    var s = FC.sess, ids = s.order.filter(function (id) { return id in s.first && fcById(id); }), ok = ids.filter(function (id) { return s.first[id]; }).length, pct = ids.length ? Math.round(100 * ok / ids.length) : 0;
    return '<div class="summary"><div class="sum-scroll"><div class="ring" style="background:conic-gradient(var(--green) ' + pct + '%, var(--track) 0)"><div>' + ok + '/' + ids.length + '</div></div>' +
      '<h1>Flash cards done</h1><p class="lead">' + (ok === ids.length ? 'You remembered every card.' : 'Remembered at the first try: ' + ok + ' of ' + ids.length + '.') + '</p>' +
      ids.map(function (id) {
        var k = fcById(id); if (!k) return '';
        return '<div class="sum-row ' + (s.first[id] ? 'ok' : 'bad') + '"><span class="dot">' + (s.first[id] ? IC.check : IC.close) + '</span><div class="row-main"><div class="row-a" lang="es" style="margin-top:0">' + esc(fcDisplay(k)) + '</div>' +
          '<div class="row-q sm" lang="zh-CN">' + esc(fcOn(k).slice(0, 3).join('；')) + '</div></div></div>';
      }).join('') + '</div><div class="sum-foot"><button class="btn ghost" data-act="fc-home">Done</button><button class="btn" data-act="fc-study">Study again</button></div></div>';
  }
  function fcHome() { ui.view = 'tabs'; ui.tab = 'cards'; FC.sess = null; FC.reveal = false; closeSheet(); render(); syncPush(); }
  function fcListRefresh() { var l = $('#fc-list'); if (l) l.innerHTML = fcListHTML(); var sub = $('.tab-scroll .sub'); if (sub && ui.tab === 'cards') sub.textContent = fcCountText(fcCards().length); }
  var FC_ACT = {
    'fc-say': function (el) { fcSay(el.dataset.w); },
    'fc-open': function (el) { var o = ui.sheet === 'fc-entry' && ui.fcEntry; fcEntrySheet(+el.dataset.id, o ? o.others.filter(function (x) { return x.i !== +el.dataset.id; }).concat(o.i !== +el.dataset.id ? [FC.db[o.i]] : []) : null, o ? o.via : ''); },
    'fc-star': function (el) {
      var e = FC.db && FC.db[+el.dataset.id]; if (!e) return;
      var on = fcStarEntry(e);
      if (on && !el.dataset.sheet && !ui.sheet) { FC.q = ''; render(); }           // added from the search list: empty the search
      else { if (el.dataset.sheet && on) FC.clearAfter = true; el.classList.toggle('on', on); if (ui.view === 'tabs' && ui.tab === 'cards') fcListRefresh(); }
      toast(on ? 'Starred: ' + e.w : 'Removed from your starred words.');
    },
    'fc-star-sense': function (el) {
      var e = FC.db && FC.db[+el.dataset.id]; if (!e) return;
      var on = fcStarEntry(e, +el.dataset.s), k = fcByKey(fcEntryKey(e)), o = ui.fcEntry || {};
      if (on) FC.clearAfter = true;
      fcEntrySheet(e.i, o.others, o.via);
      if (ui.view === 'tabs' && ui.tab === 'cards') fcListRefresh();
      toast(on ? 'Starred: ' + e.w + ' – ' + e.m[+el.dataset.s] : k ? 'Meaning unstarred.' : 'Removed from your starred words.');
    },
    'fc-card-sense': function (el) {
      var k = fcById(el.dataset.id), n = +el.dataset.s; if (!k) return;
      var sel = fcSel(k).slice(), at = sel.indexOf(n);
      if (at >= 0 && sel.length === 1) return toast('Keep at least one meaning starred – or remove the card.');
      if (at >= 0) sel.splice(at, 1); else sel.push(n);
      fcSetSel(k, sel); save(); fcCardSheet(k.id);
      if (!FC.q.trim()) fcListRefresh();
    },
    'fc-card': function (el) {
      if (!FC.reveal && el.classList.contains('fc-row') && el.closest('.fc-starred')) return FC_ACT['fc-unblur']();   // blurred: the first tap only unblurs
      fcCardSheet(el.dataset.id);
    },
    'fc-unblur': function () { FC.reveal = !FC.reveal; var l = $('#fc-list'); if (l) l.innerHTML = fcListHTML(); },
    'fc-unstar': function (el) { fcRemove(el.dataset.id); if (el.dataset.sheet) closeSheet(); render(); toast('Removed from your starred words.'); },
    'fc-edit': function (el) { fcEditSheet(el.dataset.id); },
    'fc-new': function () { fcEditSheet(''); },
    'fc-save': fcSaveEdit,
    'fc-study': fcStart,
    'fc-front': function (el) {
      var f = el.dataset.f === 'zh' ? 'zh' : 'es';
      state.fc.front = f; save(); FC.reveal = false; render();
      toast(f === 'zh' ? 'Cards now show the Chinese meaning first – you say the Spanish word.' : 'Cards now show the Spanish word first – you say what it means.');
    },
    'fc-show': function () { if (FC.sess && !FC.sess.shown) { FC.sess.shown = true; render(); var b = $('.fc-back'); if (b) b.scrollTop = 0; } },
    'fc-forgot': function () { fcAnswer(false); },
    'fc-remember': function () { fcAnswer(true); },
    'fc-sess-star': function () { var s = FC.sess, k = fcCur(); if (!k) return; if (s.drop[k.id]) delete s.drop[k.id]; else s.drop[k.id] = 1; render(); },
    'fc-quit': fcHome,
    'fc-home': fcHome,
    lookup: function (el) { lookupWord(el.dataset.w); }
  };
  document.addEventListener('keydown', function (e) {       // desktop: Space/Enter = show, ← or 1 = forgot, → or 2 = remember, S = sound
    if (ui.view !== 'fc' || ui.sheet || !FC.sess || e.ctrlKey || e.altKey || e.metaKey) return;
    var k = e.key, c = fcCur(); if (!c) return;
    if (k === 's' || k === 'S') { fcSay(c.w); e.preventDefault(); }
    else if (!FC.sess.shown) { if (k === ' ' || k === 'Enter') { FC_ACT['fc-show'](); e.preventDefault(); } }
    else if (k === 'ArrowLeft' || k === '1') { fcAnswer(false); e.preventDefault(); }
    else if (k === 'ArrowRight' || k === '2') { fcAnswer(true); e.preventDefault(); }
  });

  /* ---------------- sheets, toast ---------------- */
  function openSheet(html, name) {
    ui.sheet = name || 'sheet';
    $('#sheet-root').innerHTML = '<div class="backdrop" data-act="backdrop"><div class="sheet"><div class="grip"></div>' + html + '</div></div>';
  }
  function closeSheet() {
    ui.sheet = null; $('#sheet-root').innerHTML = '';
    if (FC.clearAfter) { FC.clearAfter = false; if (FC.q && ui.view === 'tabs' && ui.tab === 'cards') { FC.q = ''; render(); } }   // a card was starred from the search
  }
  var toastTimer;
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600); }

  /* the accent keys under a text field (á é í ó ú ü ñ ¿ ¡): insert where the cursor is, the keyboard stays open */
  function accentBar(id, target) { return '<div class="acc-bar"' + (id ? ' id="' + id + '"' : '') + ' data-for="' + target + '">' + ACCENTS.map(function (a) { return '<button type="button" data-ins="' + a + '" tabindex="-1">' + a + '</button>'; }).join('') + '</div>'; }
  function accentInsert(e) {
    var b = e.target.closest && e.target.closest('.acc-bar [data-ins]'); if (!b) return;
    var ta = document.getElementById(b.parentNode.dataset.for);
    if (!ta || ta.readOnly) return;
    e.preventDefault();
    var a = ta.selectionStart == null ? ta.value.length : ta.selectionStart, z = ta.selectionEnd == null ? a : ta.selectionEnd, t = b.dataset.ins;
    ta.value = ta.value.slice(0, a) + t + ta.value.slice(z);
    try { ta.focus(); ta.setSelectionRange(a + t.length, a + t.length); } catch (x) { }
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }
  document.addEventListener('mousedown', function (e) { if (e.target.closest && e.target.closest('.acc-bar')) e.preventDefault(); });
  document.addEventListener('touchstart', accentInsert, { passive: false });     // (preventDefault: no click follows)
  document.addEventListener('click', accentInsert);

  function detailSheet(id) {
    var s = byId[id]; if (!s) return;
    var c = peek(id), meta = [esc(s.topic || 'Other')], pats = s.alt || [];
    if (c.seen) { meta.push('practiced ' + c.seen + '× (' + (c.ok || 0) + ' correct)'); if (!c.arch) meta.push((c.due || 0) <= today() ? 'due for review now' : 'next review in ' + days(c.due - today())); }
    else meta.push('not practiced yet');
    if (c.arch) meta.push('archived');
    openSheet('<div class="d-zh" lang="zh-CN">' + esc(s.zh) + '</div>' +
      '<div class="d-es-row"><div class="d-es" lang="es">' + wordsHTML(s.es) + '</div>' + sayBtn(s.es) + '</div>' + lookupHint() +
      (pats.length ? '<div class="d-alt"><div class="r-label">Also accepted</div>' + pats.map(function (a) { return '<div class="pat" lang="es">' + Check.render(a) + '</div>'; }).join('') +
        (pats.some(Check.isPattern) ? '<p class="pat-note">a / b = either word · (…) = may be left out</p>' : '') + '</div>' : '') +
      '<div class="d-alt">' + (userAlts(id).length ? '<div class="r-label">Accepted answers you added</div>' + userAlts(id).map(function (a, i) { return userAltHTML(id, a, i, 'detail'); }).join('') : '') +
      '<button class="link-inline" data-act="alt-add" data-id="' + esc(id) + '">+ Add an accepted answer</button></div>' +
      '<div class="d-meta">' + meta.join(' · ') + '</div><div class="actions">' +
      '<button class="btn ghost" data-act="d-star" data-id="' + esc(id) + '">' + (c.star ? IC.starFill + 'Unstar' : IC.star + 'Star') + '</button>' +
      '<button class="btn ghost" data-act="d-arch" data-id="' + esc(id) + '">' + IC.archive + (c.arch ? 'Unarchive' : 'Archive') + '</button>' +
      (c.seen ? '<button class="btn ghost" data-act="d-reset" data-id="' + esc(id) + '">' + IC.repeat + 'Reset progress</button>' : '') +
      (s.custom ? '<button class="btn danger" data-act="d-delete" data-id="' + esc(id) + '">Delete</button>' : '') + '</div>', 'detail');
  }
  /* add / edit / remove an accepted answer of the user (from the result panel or the sentence details) */
  function altSheet(id, i, from) {
    var s = byId[id]; if (!s) return;
    ui.altEdit = { id: id, i: i, from: from };
    openSheet('<h3>' + (i >= 0 ? 'Edit accepted answer' : 'Add an accepted answer') + '</h3><p><span lang="zh-CN" class="alt-zh">' + esc(s.zh) + '</span><br><span lang="es">' + esc(s.es) + '</span></p>' +
      '<textarea class="paste short" id="alt-text" lang="es" placeholder="Another correct translation, in Spanish" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false">' + esc(i >= 0 ? userAlts(id)[i] : '') + '</textarea>' +
      accentBar('', 'alt-text') +
      '<div class="actions">' + (i >= 0 ? '<button class="btn danger" data-act="alt-remove">Remove</button>' : '<button class="btn ghost" data-act="alt-done">Cancel</button>') + '<button class="btn" data-act="alt-save">Save</button></div>', 'alt');
  }
  function altDone() {
    var e = ui.altEdit; ui.altEdit = null; closeSheet();
    if (!e) return;
    if (e.from === 'result' && ui.view === 'session' && ui.sess && ui.sess.phase === 'result') showResult(false); else if (e.from === 'detail') detailSheet(e.id);
  }
  function altSave() {
    var e = ui.altEdit; if (!e) return;
    var text = Check.plain($('#alt-text').value).replace(/\s+/g, ' ').trim(), s = byId[e.id], list = userAlts(e.id), old = e.i >= 0 ? list[e.i] : null;
    if (HAN.test(text) || !Check.hasSpanish(text)) return toast('Write the answer in Spanish.');
    if (text !== old) {
      var others = { id: s.id, zh: s.zh, es: s.es, alt: (s.alt || []).concat(list.filter(function (a, k) { return k !== e.i; })) };
      if (Check.matches(text, others)) return toast('That answer is already accepted.');
      if (e.i >= 0) list[e.i] = text; else (state.alts[e.id] || (state.alts[e.id] = [])).push(text);
      if (ui.sess && ui.sess.addedAlt === old && old != null) ui.sess.addedAlt = text;
      save();
    }
    altDone();
  }
  function manageSheet() {
    openSheet('<h3>Add sentences</h3>' +
      '<button class="menu-item" data-act="paste-sheet">' + IC.plus + '<span>Add sentences<small>Type or paste them, one per line</small></span></button>' +
      '<button class="menu-item" data-act="import-file">' + IC.file + '<span>Import sentences from a file<small>.txt / .csv (中文 | español | topic) or .json</small></span></button>', 'manage');
  }
  /* backup, voice, AI tutor, backup file in Drive (Android), credits: reached with the gear on the Practice and Library tabs */
  function prefsSheet() {
    var v = voicePref(), bk = bkStatus(), vn = WEB ? voiceName() : '', h = '<h3>Preferences</h3>' +
      '<button class="menu-item" data-act="backup">' + IC.save + '<span>Backup<small' + (bk.due || (!bk.at && !bkEmpty()) ? ' class="warn"' : '') + '>' + esc(bk.line) + '</small></span></button>' +
      '<div class="pref-row"><div class="pref-label">' + IC.voice + '<span>Spanish voice<small>' +
      (!WEB ? 'Reads the sentences, and words without a recording' : vn ? 'For your own sentences: ' + esc(vn) : 'Reads your own sentences with the Spanish voice of this ' + DEVICE) + '</small></span></div>' +
      '<div class="filters pref-chips"><button class="chip' + (v === 'es-US' ? ' on' : '') + '" data-act="voice" data-v="es-US">Latin America</button>' +
      '<button class="chip' + (v === 'es-ES' ? ' on' : '') + '" data-act="voice" data-v="es-ES">Spain</button></div>' +
      (WEB && IOS ? '<p class="pref-tip">The words and the sentences of the app play from recordings, heard in silent mode too. This voice reads your own sentences and words without a recording; the silent switch mutes it. A clearer voice: Settings → Accessibility → Read &amp; Speak → Voices → Spanish → download an <b>Enhanced</b> or <b>Premium</b> voice (for example Paulina for Latin America, Mónica for Spain).</p>' : '') + '</div>' +
      (function () { var t = themePref(); function c(id, label) { return '<button class="chip' + (t === id ? ' on' : '') + '" data-act="theme" data-v="' + id + '">' + label + '</button>'; }
        return '<div class="pref-row"><div class="pref-label">' + IC.theme + '<span>Appearance<small>' + (t === 'auto' ? 'Follows the light or dark mode of this ' + DEVICE : t === 'light' ? 'Light colours' : 'Dark colours') + '</small></span></div>' +
          '<div class="filters pref-chips">' + c('dark', 'Dark') + c('light', 'Light') + c('auto', 'Auto') + '</div></div>'; })() +
      (AI.has ? '<button class="menu-item" data-act="ai-sheet">' + IC.spark + '<span>AI tutor (DeepSeek)<small>' + (aiReady() ? 'Ready – explains wrong answers in Chinese' : 'Set up: add your DeepSeek API key') + '</small></span></button>' : '') +
      (SYNC.has ? (function () { var st = syncStatus(); return '<button class="menu-item" data-act="sync-sheet">' + IC.cloud + '<span>Backup file in Google Drive<small>' + (!st.linked ? 'Set up: saves after every session, loads on another device' : st.error ? 'Problem – tap to see' : st.lastSaved ? 'Saved ' + syncWhen(st.lastSaved) + (st.dirty ? ' · changes waiting' : '') : 'Linked · not saved yet') + '</small></span></button>'; })() : '') +
      '<button class="menu-item" data-act="credits">' + IC.info + '<span>About and credits<small>' + (WEB ? 'Version, dictionary, licences' : 'Word recordings, dictionary, licences') + '</small></span></button>';
    if (ui.sheet === 'prefs' && $('.sheet')) $('.sheet').innerHTML = '<div class="grip"></div>' + h; else openSheet(h, 'prefs');
  }
  function creditsSheet() {
    fcWordAudio(function () {
      openSheet('<h3>Vamos ' + VERSION + (WEB ? ' · web app' : '') + '</h3><p>Spanish sentence practice for Chinese speakers: 673 sentences in 19 topics, written in Spanish with Latin American Spanish as the main form (forms from Spain are accepted too), and flash cards with 5,100 common words.</p>' +
        (WEB ? '<div class="r-label">Sentence recordings</div><p class="credits">' + SAY_CREDIT + '</p>' : '') +
        ('<div class="r-label">Word recordings</div><p class="credits">Native speakers on Lingua Libre (lingualibre.org), from Wikimedia Commons: ' + esc(FC.credits || 'see licenses/lingualibre.txt') +
        '. Licences CC BY-SA 4.0, CC BY 4.0 or CC0, as listed per file in licenses/lingualibre.txt inside the app. Silence trimmed, loudness evened, re-encoded.</p>') +
        (WEB ? '<p class="credits">Words without a recording, and your own sentences, are read by the Spanish voice of this ' + DEVICE + '.</p>' : '') +
        '<div class="r-label">Dictionary</div><p class="credits">Word order and the forms people use: doozan/spanish_data (CC BY-SA), from the OpenSubtitles frequency list of hermitdave/FrequencyWords. Conjugation tables: made with verbecc (LGPL). Meanings in Chinese: written for Vamos.</p>' +
        '<div class="r-label">AI tutor</div><p class="credits">DeepSeek, online, with your own API key (optional).</p>' +
        '<div class="actions"><button class="btn" data-act="close-sheet">Done</button></div>', 'credits');
    });
  }
  function pasteSheet() {
    openSheet('<h3>Add sentences</h3><p>One sentence per line: <code>中文 | español | topic</code><br>The topic is optional. More accepted answers in Spanish can follow after the topic.</p>' +
      '<textarea class="paste" id="paste" lang="zh-CN" placeholder="我喜欢喝茶。 | Me gusta tomar té. | Food &amp; Drinks"></textarea>' +
      '<div class="actions"><button class="btn ghost" data-act="close-sheet">Cancel</button><button class="btn" data-act="paste-add">Add</button></div>', 'paste');
  }
  /* the fields of a line: tab separated, or | separated (a | inside {…} or […] belongs to an answer pattern) */
  function fields(line) {
    if (line.indexOf('\t') >= 0) return line.split('\t');
    var out = [''], depth = 0;
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (c === '{' || c === '[') depth++; else if ((c === '}' || c === ']') && depth > 0) depth--;
      if (c === '|' && !depth) out.push(''); else out[out.length - 1] += c;
    }
    return out;
  }
  function importSentences(text) {
    text = String(text || '').replace(/^﻿/, '').trim();
    var items = [];
    if (/^[\[{]/.test(text)) {
      var j = JSON.parse(text);
      if (j && !Array.isArray(j) && j.cards && !j.sentences) throw new Error('That file is a progress backup – use "Restore a backup".');
      items = Array.isArray(j) ? j : (j.sentences || []);
    } else {
      text.split(/\r?\n/).forEach(function (line) {
        line = line.trim(); if (!line || line[0] === '#') return;
        var f = fields(line).map(function (x) { return x.trim(); });
        if (f.length < 2) return;
        if (!HAN.test(f[0]) && HAN.test(f[1])) { var t = f[0]; f[0] = f[1]; f[1] = t; }
        items.push({ zh: f[0], es: f[1], topic: f[2], alt: f.slice(3) });
      });
    }
    var known = dict(), added = 0, skipped = 0;
    function zkey(z) { return String(z || '').replace(/[^㐀-鿿0-9a-zA-Z]/g, ''); }
    all.forEach(function (s) { known[zkey(s.zh)] = 1; });
    items.forEach(function (it) {
      it = it || {};
      var zh = String(it.zh || '').replace(/\s+/g, ' ').trim(), es = String(it.es || '').replace(/\s+/g, ' ').trim(), k = zkey(zh);
      var alt = (Array.isArray(it.alt) ? it.alt : []).map(function (a) { return String(a).replace(/\s+/g, ' ').trim(); })
        .filter(function (a) { return a && !HAN.test(a) && Check.hasSpanish(Check.plain(a)); });
      if (Check.isPattern(es)) { alt.unshift(es); es = Check.expand(es, 1)[0] || ''; }
      if (!HAN.test(zh) || !es || HAN.test(es) || !Check.hasSpanish(es) || known[k]) { skipped++; return; }
      known[k] = 1;
      var id = 'u' + hash(k); while (byId[id]) id += 'x';
      var s = { id: id, topic: String(it.topic || '').trim() || 'My sentences', zh: zh, es: es, custom: 1 };
      if (alt.length) s.alt = alt;
      state.custom.push(s); byId[id] = s; added++;
    });
    if (added) { reindex(); save(); }
    return { added: added, skipped: skipped };
  }
  function reportImport(fn) {
    try {
      var r = fn();
      toast(r.added ? 'Added ' + r.added + (r.added === 1 ? ' sentence' : ' sentences') + (r.skipped ? ' (' + r.skipped + ' skipped)' : '') : 'Nothing added' + (r.skipped ? ' – ' + r.skipped + ' duplicate or incomplete' : ''));
      if (r.added) { closeSheet(); render(); }
    } catch (e) { toast(e && e.message ? e.message : 'Could not read that.'); }
  }
  /* a file chosen by the user: cb(text, file). The input stays in the page until it is used (Safari may drop the
     choice of an input that is not in the page). */
  function pickFile(cb, accept) {
    var old = $('#file-pick'); if (old) old.remove();
    var inp = document.createElement('input');
    inp.type = 'file'; inp.id = 'file-pick'; inp.accept = accept || '.json,.txt,.csv,.tsv,text/plain,text/csv,text/tab-separated-values,application/json';
    inp.style.cssText = 'position:fixed;left:-500px;top:0;width:1px;height:1px;opacity:0';
    inp.onchange = function () {
      var f = inp.files && inp.files[0]; inp.remove(); if (!f) return;
      var rd = new FileReader();
      rd.onload = function () { cb(String(rd.result || ''), f); };
      rd.onerror = function () { toast('Could not read the file.'); };
      rd.readAsText(f);
    };
    document.body.appendChild(inp);
    inp.click();
  }

  /* ---------------- backups ----------------
     The progress is kept only on this device (in the web app: in the browser's storage). A backup is all of it in one
     small file, vamos-backup-<date>.json, that the user keeps (iPhone: Save to Files → iCloud Drive; Android: Google
     Drive, Downloads …) and reads back with Restore; it works across the Android app and the web app.
     vamos-backup-info (this device only, not in the progress or the backups): when the last backup was made, a fingerprint
     of the progress it held and the number of answers then - so the app knows whether newer practice is missing from it
     and reminds (Practice tab and end of a session; "Later" waits 3 days; can be switched off). */
  var BK_KEY = 'vamos-backup-info', BK_AGE = 7 * DAY, BK_MANY = 100, BK_SNOOZE = 3 * DAY, INSTALL_KEY = 'vamos-install-hint';
  function bkInfo() { try { var o = JSON.parse(localStorage.getItem(BK_KEY) || 'null'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
  function bkSet(p) { var o = bkInfo(); for (var k in p) o[k] = p[k]; try { localStorage.setItem(BK_KEY, JSON.stringify(o)); } catch (e) { } }
  /* fingerprint of the progress, the same whatever the order of the keys */
  function bkPrint(st) {
    return hash(JSON.stringify(st, function (k, v) {
      if (!v || typeof v !== 'object' || Array.isArray(v)) return v;
      var r = {}; Object.keys(v).sort().forEach(function (x) { r[x] = v[x]; }); return r;
    }));
  }
  function bkEmpty() { return !Object.keys(state.cards).length && !state.custom.length && !state.fc.cards.length; }
  function agoText(ms) {
    var d = new Date(ms), n = new Date(), k = Math.round((new Date(n.getFullYear(), n.getMonth(), n.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / DAY);
    return k <= 0 ? 'today' : k === 1 ? 'yesterday' : k + ' days ago';
  }
  function bkStatus() {
    var b = bkInfo(), empty = bkEmpty(), changed = !empty && bkPrint(state) !== b.print, since = Math.max(0, state.totals.answered - (+b.answered || 0));
    var linked = false; try { linked = SYNC.has && syncStatus().linked; } catch (e) { }
    var due = changed && b.remind !== false && !linked && !(b.later && Date.now() < b.later) &&
      (b.at ? Date.now() - b.at >= BK_AGE || since >= BK_MANY : state.totals.answered >= SESSION_SIZE || state.fc.cards.length >= 10);
    return { at: +b.at || 0, changed: changed, due: due, remind: b.remind !== false,
      line: b.at ? 'Last saved ' + syncWhen(b.at) + (changed ? ' · newer practice is not in it' : ' · up to date') : empty ? 'Nothing to save yet' : 'No backup yet – tap to save one' };
  }
  function bkCounts(st) {
    var seen = 0, star = 0;
    for (var k in st.cards) { var c = st.cards[k]; if (c && c.seen) seen++; if (c && c.star) star++; }
    return { seen: seen, star: star, fc: st.fc.cards.length, own: st.custom.length, answered: st.totals.answered };
  }
  function bkRefresh() {
    if (ui.sheet === 'backup') backupSheet(); else if (ui.sheet === 'prefs') prefsSheet();
    if (ui.view === 'tabs' || ui.view === 'summary') render();
  }
  function bkDone(p, at) { bkSet({ at: at || Date.now(), print: p.print, answered: p.answered, later: 0 }); bkRefresh(); }
  /* the banner that asks for a backup (Practice tab, end of a session) */
  function bkBannerHTML() {
    var b = bkStatus(); if (!b.due) return '';
    return '<div class="note-card bk">' + IC.save + '<span><b>Save a backup</b><small>' + (b.at ? 'Your last backup is from ' + agoText(b.at) + '. Keep the new practice safe.' : 'Your progress is only on this ' + DEVICE + '. A backup keeps it safe.') + '</small></span>' +
      '<button class="btn small" data-act="bk-save">Save</button><button class="nc-x" data-act="bk-later" aria-label="Later">' + IC.close + '</button></div>';
  }
  /* iPhone, in Safari: how to put Vamos on the Home Screen */
  function installHTML() {
    if (!WEB || !IOS || standalone()) return '';
    try { if (localStorage.getItem(INSTALL_KEY)) return ''; } catch (e) { }
    return '<div class="note-card install"><i class="nc-logo">' + LOGO + '</i><span><b>Put Vamos on your Home Screen</b><small>In Safari tap <b>⋯</b> → <b>Share</b> ' + IC.share +
      ' (共享) → <b>Add to Home Screen</b> (添加到主屏幕; keep “Open as Web App” on). Then open Vamos from there: full screen, works offline. Progress made here in Safari stays in Safari.</small></span>' +
      '<button class="nc-x" data-act="install-x" aria-label="Close">' + IC.close + '</button></div>';
  }
  /* a new, empty app (first start on a new phone, or after the Android app): offer to bring a backup over */
  var RESTORE_HINT_KEY = 'vamos-restore-hint';
  function restoreHintHTML() {
    if (!bkEmpty() || (IOS && WEB && !standalone())) return '';
    try { if (localStorage.getItem(RESTORE_HINT_KEY)) return ''; } catch (e) { }
    return '<div class="note-card restore">' + IC.up + '<span><b>Have a Vamos backup?</b><small>Bring your progress over from another phone or the ' + (WEB ? 'Android app' : 'iPhone web app') + '.</small></span>' +
      '<button class="btn small ghost" data-act="restore">Restore</button><button class="nc-x" data-act="restore-x" aria-label="Close">' + IC.close + '</button></div>';
  }
  function backupSheet() {
    var b = bkStatus(), c = bkCounts(state), empty = bkEmpty(), cls = empty ? 'mid' : !b.at || b.due ? 'warn' : b.changed ? 'mid' : 'ok';
    var how = IOS ? 'A menu opens: choose <b>Save to Files</b> (存储到“文件”) and a folder in <b>iCloud Drive</b> – or send it to yourself (Mail, WeChat, AirDrop).' :
      !WEB ? 'Choose where to keep it, for example Google Drive or Downloads.' : 'The file is downloaded to this ' + DEVICE + '.';
    var h = '<h3>Backup</h3>' +
      '<div class="bk-state ' + cls + '">' + (cls === 'ok' ? IC.check : IC.info) + '<span><b>' + (b.at ? 'Last backup: ' + syncWhen(b.at) : 'No backup yet') + '</b><small>' +
      (empty ? 'Nothing practiced yet.' : !b.at ? 'Your progress is only on this ' + DEVICE + '. If the app is removed, it is gone.' : b.changed ? 'You practiced after it – save a new one.' : 'It holds all your progress.') + '</small></span></div>' +
      '<button class="btn wide" data-act="bk-save"' + (empty ? ' disabled' : '') + '>' + IC.save + 'Save a backup</button>' +
      '<p class="bk-how">' + how + '</p>' +
      '<button class="btn ghost wide" data-act="restore">' + IC.up + 'Restore from a backup</button>' +
      '<p class="bk-how">Choose a <b>vamos-backup-….json</b> file (from this app or the ' + (WEB ? 'Android app' : 'iPhone web app') + '). You see what it holds before anything is replaced.</p>' +
      '<div class="r-label">In a backup</div><p class="bk-how">' + c.seen + ' practiced sentences and when they come back, ' + c.star + ' starred, ' + c.fc + ' flash cards' +
      (c.own ? ', ' + c.own + ' own sentences' : '') + ', your accepted answers and the streak. Not in it: your DeepSeek key and the voice setting.</p>' +
      '<button class="menu-item bk-remind" data-act="bk-remind"><span>Remind me to save a backup<small>About once a week, when there is new practice</small></span><i class="switch' + (b.remind ? ' on' : '') + '"></i></button>' +
      (WEB && IOS && !standalone() ? '<p class="bk-how">You are in Safari: its progress is separate from the Vamos app on the Home Screen. To move it there, save a backup here and restore it in the app.</p>' : '') +
      '<div class="actions"><button class="btn ghost" data-act="close-sheet">Close</button></div>';
    if (ui.sheet === 'backup' && $('.sheet')) $('.sheet').innerHTML = '<div class="grip"></div>' + h; else openSheet(h, 'backup');
  }
  function bkFileName() { var d = new Date(); return 'vamos-backup-' + d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + '.json'; }
  /* save a backup: Android's file screen; iPhone (and phones): the share menu, so it can go to Files / iCloud Drive;
     elsewhere a download. Must run inside the tap (the share menu needs it). */
  function exportBackup() {
    if (bkEmpty()) return toast('Nothing to save yet – practice first.');
    var o = JSON.parse(JSON.stringify(state)), name = bkFileName(), p = { print: bkPrint(state), answered: state.totals.answered };
    o.savedAt = Date.now(); o.device = WEB ? DEVICE : 'Android';
    var raw = JSON.stringify(o);
    if (!WEB && Native && Native.saveFile) { try { ui.bkPending = p; Native.saveFile(name, 'application/json', raw); return; } catch (e) { ui.bkPending = null; } }
    var file = null; try { file = new File([raw], name, { type: 'application/json' }); } catch (e) { }
    var canShare = false; try { canShare = !!(file && (IOS || /Android/.test(UA)) && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })); } catch (e) { }
    if (canShare) {
      navigator.share({ files: [file] }).then(function () { bkDone(p); toast('Backup saved.'); }, function (e) {
        if (e && e.name === 'AbortError') toast('Not saved – the menu was closed.');
        else bkDownload(raw, name, p);
      });
      return;
    }
    bkDownload(raw, name, p);
  }
  function bkDownload(raw, name, p) {
    var a = document.createElement('a'), url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    bkDone(p); toast('Backup downloaded: ' + name);
  }
  window.__fileSaved = function (ok) {           // Android: the file screen closed
    var p = ui.bkPending; ui.bkPending = null;
    if (ok && p) bkDone(p);
    toast(ok ? 'Backup saved.' : 'The backup was not saved.');
  };
  function bkCountsHTML(c) {
    return '<ul><li><b>' + c.seen + '</b> sentences practiced</li><li><b>' + c.answered + '</b> answers</li><li><b>' + c.fc + '</b> flash cards</li>' +
      (c.star ? '<li><b>' + c.star + '</b> starred</li>' : '') + (c.own ? '<li><b>' + c.own + '</b> own sentences</li>' : '') + '</ul>';
  }
  function restoreBackup(text, file) {
    text = String(text || '').replace(/^﻿/, '');
    var s = parseState(text);
    if (!s) return toast('That is not a Vamos backup. Choose a vamos-backup-….json file.');
    var meta = {}; try { meta = JSON.parse(text) || {}; } catch (e) { }
    var sync = meta.sync && typeof meta.sync === 'object' ? meta.sync : {};
    var at = +meta.savedAt || +sync.at || (file && +file.lastModified) || 0, from = String(meta.device || sync.device || '');
    var a = bkCounts(s), now = bkCounts(state), less = a.answered < now.answered;
    ui.pendingRestore = { state: s, at: at };
    openSheet('<h3>Restore this backup?</h3>' +
      '<div class="bk-cmp"><div class="bk-col"><b>The backup</b><small>' + (at ? 'saved ' + esc(syncWhen(at)) : 'date unknown') + (from ? ' · ' + esc(from) : '') + '</small>' + bkCountsHTML(a) + '</div>' +
      '<div class="bk-col now"><b>Now on this ' + DEVICE + '</b><small>replaced by the backup</small>' + bkCountsHTML(now) + '</div></div>' +
      (less ? '<p class="bk-warn">This backup has less practice than this ' + DEVICE + ' (' + a.answered + ' answers, here ' + now.answered + '). Restoring it loses the newer practice.</p>' : '') +
      '<div class="actions"><button class="btn ghost" data-act="close-sheet">Cancel</button><button class="btn" data-act="restore-go">Restore</button></div>', 'restore');
  }

  /* ---------------- actions ---------------- */
  function toggleStar(id) { var c = card(id); if (c.star) delete c.star; else c.star = 1; save(); return !!c.star; }
  function toggleArch(id) { var c = card(id); if (c.arch) delete c.arch; else c.arch = 1; save(); return !!c.arch; }
  function refreshList() { var el = $('#lib-list'); if (el) el.innerHTML = libraryListHTML(); else render(); }

  var ACT = {
    tab: function (el) { if (el.dataset.tab === 'cards' && ui.tab !== 'cards') FC.reveal = false; ui.tab = el.dataset.tab; ui.view = 'tabs'; render(); },
    start: function (el) { start(el.dataset.mode, el.dataset.topic); },
    home: function () { aiStop(); ui.view = 'tabs'; ui.tab = 'practice'; ui.sess = null; render(); syncPush(); },
    check: function () { doCheck(false); },
    giveup: function () { doCheck(true); },
    say: function (el) { speak(el.dataset.t); },
    ivl: function (el) { ui.sess.pick = +el.dataset.d; showResult(false); },
    'r-star': function () { toggleStar(cur().id); showResult(false); },
    'r-arch': function () { toggleArch(cur().id); showResult(false); },
    override: function () {           // "I was right": count as correct and remember the typed answer as accepted (Undo reverts both)
      var sess = ui.sess, s = cur(), res = sess.res;
      aiStop(); sess.ai = null;
      if (res.overridden) {
        res.overridden = false; sess.ok = false;
        if (sess.addedAlt != null) { removeUserAlt(s.id, sess.addedAlt); sess.addedAlt = null; }
      } else {
        res.overridden = true; sess.ok = true; sess.altsOpen = true; sess.addedAlt = addUserAlt(s.id, res.raw);
      }
      sess.pick = suggestInterval(s, sess.ok); showResult(false);
    },
    'alt-edit': function (el) { altSheet(el.dataset.id, +el.dataset.i, el.dataset.from); },
    'alt-add': function (el) { altSheet(el.dataset.id, -1, 'detail'); },
    'alt-save': altSave,
    'alt-done': altDone,
    'alt-remove': function () {
      var e = ui.altEdit; if (!e) return;
      var old = userAlts(e.id)[e.i];
      if (old != null) { removeUserAlt(e.id, old); if (ui.sess && ui.sess.addedAlt === old) ui.sess.addedAlt = null; }
      altDone();
    },
    'ai-ask': aiAsk,
    'ai-stop': aiStop,
    'ai-sheet': aiSheet,
    'sync-sheet': function () { SYNC.remote = null; syncSheet(); },
    'sync-create': function () { var st = syncStatus(), stamp = syncStamp(); SYNC.linkError = ''; try { Native.syncCreate(SYNC_FILE, syncContent(stamp, st.device), stamp); } catch (e) { toast('Could not open the file screen.'); } },
    'sync-open': function () { SYNC.linkError = ''; try { Native.syncOpen(); } catch (e) { toast('Could not open the file screen.'); } },
    'sync-save': function () { syncPush({ manual: true }); },
    'sync-load': function () { try { Native.syncRead('load'); } catch (e) { } },
    'sync-take': function () { if (SYNC.remote) syncAdopt(SYNC.remote); else syncSheet(); },
    'sync-overwrite': function () { SYNC.remote = null; closeSheet(); syncPush({ force: true }); },
    'sync-unlink': function () { try { Native.syncUnlink(); } catch (e) { } SYNC.remote = null; syncSheet(); toast('Disconnected. The file itself stays in your Drive.'); },
    'fail-show': function () { ui.failShow = !ui.failShow; render(); },
    again: function () { var l = ui.last || { mode: 'mixed' }; start(l.mode, l.topic); },
    next: commitAnswer,
    quit: function () {
      var n = ui.sess.results.length;
      openSheet('<h3>End this session?</h3><p>' + (n ? 'Your ' + n + ' answered ' + (n === 1 ? 'sentence is' : 'sentences are') + ' already saved.' : 'Nothing has been answered yet.') +
        '</p><div class="actions"><button class="btn ghost" data-act="close-sheet">Keep going</button><button class="btn danger" data-act="home-quit">End session</button></div>', 'quit');
    },
    'home-quit': function () { closeSheet(); ACT.home(); },
    backdrop: function (el, e) { if (e.target === el) closeSheet(); },
    'close-sheet': closeSheet,
    star: function (el) {
      var on = toggleStar(el.dataset.id);
      if (ui.view === 'tabs' && ui.tab === 'starred') return render();
      el.classList.toggle('on', on);
    },
    detail: function (el) { detailSheet(el.dataset.id); },
    'd-star': function (el) { toggleStar(el.dataset.id); closeSheet(); render(); },
    'd-arch': function (el) { var on = toggleArch(el.dataset.id); closeSheet(); render(); toast(on ? 'Archived – it will not appear in practice.' : 'Back in practice.'); },
    'd-reset': function (el) { var c = card(el.dataset.id); ['seen', 'ok', 'bad', 'ivl', 'due', 'last', 'fail', 'run'].forEach(function (k) { delete c[k]; }); save(); closeSheet(); render(); toast('Progress reset – the sentence is new again.'); },
    'd-delete': function (el) { var id = el.dataset.id; state.custom = state.custom.filter(function (s) { return s.id !== id; }); delete state.cards[id]; delete state.alts[id]; reindex(); save(); closeSheet(); render(); toast('Sentence deleted.'); },
    topic: function (el) { var t = el.dataset.topic; ui.lib.open[t] = !ui.lib.open[t]; refreshList(); },
    filter: function (el) { ui.lib.filter = el.dataset.filter; render(); },
    manage: manageSheet,
    prefs: prefsSheet,
    theme: function (el) { try { localStorage.setItem(THEME_KEY, el.dataset.v); } catch (e) { } applyTheme(); prefsSheet(); },
    voice: function (el) { setVoicePref(el.dataset.v); prefsSheet(); speak(el.dataset.v === 'es-ES' ? 'Hola, ¿qué tal? Vamos a practicar.' : 'Hola, ¿cómo estás? Vamos a practicar.'); },
    credits: creditsSheet,
    'paste-sheet': pasteSheet,
    'paste-add': function () { var v = $('#paste').value; if (!v.trim()) return toast('Type or paste at least one sentence.'); reportImport(function () { return importSentences(v); }); },
    'import-file': function () { pickFile(function (text) { reportImport(function () { return importSentences(text); }); }); },
    backup: backupSheet,
    'export': exportBackup,
    'bk-save': exportBackup,
    'bk-later': function () { bkSet({ later: Date.now() + BK_SNOOZE }); render(); toast('Reminder again in 3 days. Backup is always in Preferences (the gear).'); },
    'bk-remind': function () { bkSet({ remind: !bkStatus().remind, later: 0 }); backupSheet(); render(); },
    'install-x': function () { try { localStorage.setItem(INSTALL_KEY, '1'); } catch (e) { } render(); },
    'restore-x': function () { try { localStorage.setItem(RESTORE_HINT_KEY, '1'); } catch (e) { } render(); },
    restore: function () { pickFile(restoreBackup, '.json,application/json,text/plain'); },
    'restore-go': function () {
      var p = ui.pendingRestore; if (!p) return;
      state = p.state; ui.pendingRestore = null; reindex(); save();
      bkSet({ at: p.at || Date.now(), print: bkPrint(state), answered: state.totals.answered, later: 0 });   // this device now holds just what the backup holds
      closeSheet(); render(); toast('Backup restored.');
    }
  };
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!el || el.disabled) return;
    var fn = ACT[el.dataset.act] || FC_ACT[el.dataset.act]; if (fn) { fn(el, e); draftSoon(); }
  });
  document.addEventListener('input', function (e) {
    if (e.target.id === 'q') { ui.lib.q = e.target.value; $('#lib-list').innerHTML = libraryListHTML(); }
    if (e.target.id === 'fq') { var was = !!FC.q.trim(); FC.q = e.target.value; if (was !== !!FC.q.trim()) { render(); var f = $('#fq'); if (f) { f.focus(); try { f.setSelectionRange(f.value.length, f.value.length); } catch (x) { } } } else $('#fc-list').innerHTML = fcListHTML(); }
  });
  document.addEventListener('toggle', function (e) { if (ui.sess && e.target.classList && e.target.classList.contains('r-alts')) ui.sess.altsOpen = e.target.open; }, true);

  /* ---------------- unfinished session ----------------
     Android may stop the page while the app is in another app's shadow; the app then starts the page again
     (MainActivity.restartPage), or starts again altogether. So the session in progress - its sentences, where you are,
     the results so far, the text being typed or the answer on screen - is kept in draft.json (Java) and localStorage,
     and reopened when the page starts within 12 hours. Not part of the progress, the backups or the backup file. */
  var DRAFT_KEY = KEY + '.draft', DRAFT_MAX_AGE = 12 * 3600 * 1000, draftTimer = 0, draftKept = true;
  function draftSave() {
    clearTimeout(draftTimer); draftTimer = 0;
    var sess = ui.sess, raw = '';
    if (sess && ui.view === 'session' && sess.i < sess.items.length) {
      var ta = $('#answer');
      raw = JSON.stringify({ t: Date.now(), ids: sess.items.map(function (s) { return s.id; }), i: sess.i, results: sess.results, phase: sess.phase,
        text: ta ? ta.value : '', res: sess.phase === 'result' ? sess.res : null, ok: !!sess.ok, pick: sess.pick, altsOpen: !!sess.altsOpen,
        addedAlt: sess.addedAlt == null ? null : sess.addedAlt, last: ui.last || null });
    }
    if (!raw && !draftKept) return;               // nothing to keep and nothing kept
    draftKept = !!raw;
    try { if (raw) localStorage.setItem(DRAFT_KEY, raw); else localStorage.removeItem(DRAFT_KEY); } catch (e) { }
    try { if (Native && Native.saveDraft) Native.saveDraft(raw); } catch (e) { }
  }
  function draftSoon() { if (!draftTimer) draftTimer = setTimeout(draftSave, 300); }
  function draftRestore() {
    var raw = null, d, items;
    try { if (Native && Native.loadDraft) raw = Native.loadDraft(); } catch (e) { }
    if (!raw) { try { raw = localStorage.getItem(DRAFT_KEY); } catch (e) { } }
    if (!raw) return false;
    try {
      d = JSON.parse(raw); items = (d.ids || []).map(function (id) { return byId[id]; });
      if (!(Date.now() - d.t < DRAFT_MAX_AGE) || !items.length || items.some(function (s) { return !s; }) || !(d.i >= 0 && d.i < items.length)) throw 0;
      if (d.phase === 'result' && !(d.res && typeof d.res === 'object')) throw 0;
    } catch (e) { ui.sess = null; draftSave(); return false; }
    ui.sess = { items: items, i: d.i, results: Array.isArray(d.results) ? d.results : [], phase: d.phase === 'result' ? 'result' : 'input',
      res: d.phase === 'result' ? d.res : null, ok: !!d.ok, pick: INTERVALS.indexOf(+d.pick) >= 0 ? +d.pick : 1, altsOpen: !!d.altsOpen, addedAlt: d.addedAlt == null ? null : d.addedAlt };
    if (d.last) ui.last = d.last;
    ui.view = 'session';
    ui.restoredText = d.phase === 'result' ? String(d.res.raw || '') : String(d.text || '');
    return true;
  }
  window.__draftSave = draftSave;
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') draftSave(); });
  window.addEventListener('pagehide', draftSave);

  /* Android back button / gesture: returns true when the app handled it */
  window.__onBack = function () {
    if (ui.sheet) { closeSheet(); return true; }
    if (ui.view === 'session') { ACT.quit(); return true; }
    if (ui.view === 'summary') { ACT.home(); return true; }
    if (ui.view === 'fc' || ui.view === 'fcsum') { fcHome(); return true; }
    if (ui.tab !== 'practice') { ui.tab = 'practice'; render(); return true; }
    return false;
  };
  window.__app = { aiPrompt: aiPrompt, suggest: suggestInterval, current: function () { return ui.sess && cur(); }, aiFormat: aiFormat, state: function () { return state; },
    idle: function () { return ui.view === 'tabs' && !ui.sheet; }, backup: { status: bkStatus, print: bkPrint, set: bkSet }, voice: { best: bestVoice, name: voiceName, score: voiceScore },
    evaluate: function (id, text) { return Check.evaluate(text, effective(byId[id])); }, importSentences: importSentences, pickSession: pickSession, counts: counts, render: render, syncParse: syncParse,
    fc: { load: fcLoad, size: function () { return FC.db ? FC.db.length : 0; }, search: fcSearch, lookup: fcLookup, start: fcStart, noun: fcNoun, adj: fcAdj, display: fcDisplay, formNote: fcFormNote, plural: fcPlural, examples: fcExamplesHTML },
    aiSheetIfOpen: function () { if (ui.sheet === 'ai') aiSheet(); } };
  draftRestore();
  render();
  setTimeout(syncCheck, 400);                   // app opened: did another device save newer progress?
})();
