/* Frase - answer checking: compares the typed Spanish with the accepted answers of a sentence.
   Accepted answers are patterns (sentences/*.json, macros already expanded by tools/build_data.py):
     {a|b|c} = one of them,  [x] = optional.   "{El domingo|Los domingos} no estoy en casa[ hoy]."
   When comparing, these never matter:
   - capital letters, punctuation, ¿ ¡, spaces
   - numbers in words or digits (tres = 3, dos mil veinticinco = 2025, 8:30 = ocho y media = ocho y treinta)
   - subject pronouns Spanish leaves out: yo, tú, nosotros, vosotros may be added or left out;
     él, ella, ellos, ellas, usted, ustedes may be left out (a wrong one is still wrong)
   - a few spelling equivalences (acá = aquí, ésta = esta, juntas = juntos ...), see RULES
   Missing or wrong accents (á é í ó ú ü ñ) are accepted, but the result says so (accent: true).
   Written for old WebViews too: no regex lookbehind, no \p{...}. */
(function (root) {
  'use strict';
  /* maps keyed by words need no prototype: "constructor" is a Spanish word, and {}['constructor'] is a function */
  function dict(o) { var d = Object.create(null); if (o) for (var k in o) d[k] = o[k]; return d; }
  var CAP = 3000;                 // most expansions taken from one pattern
  var TOTAL = 9000;               // most expansions per sentence
  var LOWER = 'a-zñáéíóúü', LETTER = '0-9a-zA-ZÀ-ÖØ-öø-ÿ';

  /* ---------- patterns ---------- */
  function parse(s) {
    var i = 0;
    function seq(stop) {
      var items = [], text = '';
      while (i < s.length) {
        var c = s[i];
        if (stop.indexOf(c) >= 0) break;
        if (c === '{' || c === '[') {
          if (text) { items.push(text); text = ''; }
          i++;
          if (c === '{') { var alts = [seq('|}')]; while (s[i] === '|') { i++; alts.push(seq('|}')); } i++; items.push({ alt: alts }); }
          else { var inner = seq(']'); i++; items.push({ alt: [inner, []] }); }
          continue;
        }
        if (c === '}' || c === ']' || c === '|') { i++; continue; }      // stray mark: ignored
        text += c; i++;
      }
      if (text) items.push(text);
      return items;
    }
    return seq('');
  }
  function combos(items, cap) {
    var out = [''];
    for (var k = 0; k < items.length; k++) {
      var it = items[k], next = [];
      if (typeof it === 'string') { for (var a = 0; a < out.length; a++) next.push(out[a] + it); }
      else {
        var opts = [];
        for (var q = 0; q < it.alt.length; q++) opts = opts.concat(combos(it.alt[q], cap));
        for (var b = 0; b < out.length && next.length < cap; b++) for (var c = 0; c < opts.length && next.length < cap; c++) next.push(out[b] + opts[c]);
      }
      out = next;
    }
    return out;
  }
  var FIRST = new RegExp('^([¿¡"«(]*)([' + LOWER + '])');
  function tidy(x) {
    x = x.replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').replace(/([¿¡])\s+/g, '$1').replace(/,\s*,/g, ',').replace(/^\s*,\s*/, '').trim();
    return x.replace(FIRST, function (m, p, l) { return p + l.toUpperCase(); });
  }
  /* every sentence a pattern stands for; the first one takes the first choice everywhere (and includes [optional] parts) */
  function expand(p, cap) {
    var seen = dict(), out = [], all = combos(parse(String(p == null ? '' : p)), cap || CAP);
    for (var i = 0; i < all.length; i++) { var x = tidy(all[i]); if (x && !seen[x]) { seen[x] = 1; out.push(x); } }
    return out;
  }
  function isPattern(p) { return /[{}\[\]|]/.test(String(p || '')); }

  /* pattern -> HTML for showing it: choices as "a / b", optional parts in brackets */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function render(p) {
    function seqHTML(items) {
      var h = '';
      for (var k = 0; k < items.length; k++) {
        var it = items[k];
        if (typeof it === 'string') { h += esc(it); continue; }
        var parts = [], empty = false, lead = false, trail = false;
        for (var q = 0; q < it.alt.length; q++) {
          var sq = it.alt[q], x = seqHTML(sq);
          if (/^\s/.test(x)) lead = true;
          if (/\s$/.test(x)) trail = true;
          x = x.replace(/^\s+|\s+$/g, '');
          if (x) parts.push(x); else empty = true;
        }
        if (!parts.length) continue;
        var inner = parts.join('<i>/</i>');
        h += (lead ? ' ' : '') + (empty ? '<span class="p-opt">(' + inner + ')</span>' : parts.length > 1 ? '<span class="p-alt">' + inner + '</span>' : inner) + (trail ? ' ' : '');
      }
      return h;
    }
    return seqHTML(parse(String(p || ''))).replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').replace(/([¿¡])\s+/g, '$1').trim();
  }

  /* ---------- normalising ---------- */
  var MARKS = /[̀-ͯ]/g;
  function strip(s) { return String(s).normalize('NFD').replace(MARKS, '').normalize('NFC'); }      // á -> a, ñ -> n, ü -> u
  var UNITS = dict({ cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
    once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20,
    veintiun: 21, veintiuno: 21, veintiuna: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25, veintiseis: 26,
    veintisiete: 27, veintiocho: 28, veintinueve: 29 });
  var TENS = dict({ treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90 });
  var HUNDREDS = dict({ cien: 100, ciento: 100, doscientos: 200, doscientas: 200, trescientos: 300, trescientas: 300, cuatrocientos: 400,
    cuatrocientas: 400, quinientos: 500, quinientas: 500, seiscientos: 600, seiscientas: 600, setecientos: 700, setecientas: 700,
    ochocientos: 800, ochocientas: 800, novecientos: 900, novecientas: 900 });
  /* words of a number -> digits:  "novecientos ocho" -> "908", "sesenta y cinco" -> "65", "un" -> "1" */
  function numbers(tok) {
    var out = [], i = 0;
    while (i < tok.length) {
      var j = i, total = 0, cur = 0, any = false, zero = false;
      while (j < tok.length) {
        var t = strip(tok[j]);
        if (HUNDREDS[t] != null && cur === 0) { cur = HUNDREDS[t]; any = true; j++; continue; }
        if (TENS[t] != null && cur % 100 === 0) {
          cur += TENS[t]; any = true; j++;
          var u = j + 1 < tok.length && tok[j] === 'y' ? UNITS[strip(tok[j + 1])] : null;
          if (u != null && u >= 1 && u <= 9) { cur += u; j += 2; }
          continue;
        }
        if (UNITS[t] != null && cur % 100 === 0 && !zero && !(t === 'cero' && any)) { cur += UNITS[t]; zero = t === 'cero'; any = true; j++; continue; }
        if (t === 'mil' && total === 0 && (cur > 0 || !any)) { total = (cur || 1) * 1000; cur = 0; any = true; j++; continue; }
        break;
      }
      if (any) { out.push(String(total + cur)); i = j; } else { out.push(tok[i]); i++; }
    }
    return out;
  }
  var DEMONSTR = dict({ 'éste': 'este', 'ésta': 'esta', 'ésto': 'esto', 'éstos': 'estos', 'éstas': 'estas', 'ése': 'ese', 'ésa': 'esa', 'éso': 'eso', 'ésos': 'esos',
    'ésas': 'esas', 'aquél': 'aquel', 'aquélla': 'aquella', 'aquéllos': 'aquellos', 'aquéllas': 'aquellas', 'sólo': 'solo', 'guión': 'guion' });
  /* [pattern, replacement] on the normalised text (words separated by single spaces, a space at both ends) */
  var RULES = [
    [/ acá /g, ' aquí '], [/ allá /g, ' allí '], [/ ahí /g, ' allí '], [/ ahorita /g, ' ahora '],
    [/ juntas /g, ' juntos '], [/ shanghái /g, ' shanghai '], [/ yogurt /g, ' yogur '], [/ yogurts /g, ' yogures '],
    [/ (los )?(estados unidos|ee uu|eeuu) /g, ' eeuu '],
    [/ y media /g, ' y 30 '], [/ y cuarto /g, ' y 15 '], [/ menos cuarto /g, ' menos 15 '], [/ en punto /g, ' ']
  ];
  var PREP = dict({ a: 1, ante: 1, con: 1, contra: 1, de: 1, desde: 1, en: 1, entre: 1, hacia: 1, hasta: 1, para: 1, por: 1, 'según': 1, sin: 1, sobre: 1, tras: 1 });
  var DROP_ALWAYS = dict({ yo: 1 });                                                          // left out on both sides
  var DROP_FREE = dict({ 'tú': 1, nosotros: 1, nosotras: 1, vosotros: 1, vosotras: 1 });     // left out on both sides unless after a preposition
  var DROP_ACCEPTED = dict({ 'él': 1, ella: 1, ellos: 1, ellas: 1, usted: 1, ustedes: 1 });  // the learner may leave them out
  var NOT_LETTER = new RegExp('[^' + LETTER + '\\u3400-\\u9fff\' ]+', 'g');
  function words(s) {
    s = String(s == null ? '' : s).normalize('NFC').toLowerCase()
      .replace(/(\d)[.,](\d{3})(?!\d)/g, '$1$2')                                                              // 1.000 -> 1000
      .replace(/(\d{1,2})[:.h](\d{2})(?!\d)/g, function (m, h, mm) { return +mm ? h + ' y ' + (+mm) : h; })  // 8:30 -> 8 y 30, 8:00 -> 8
      .replace(/[‘’`´']/g, "'").replace(/[-‐‑–—_\/]/g, ' ')
      .replace(NOT_LETTER, ' ').replace(/'/g, '');
    var tok = s.split(/\s+/).filter(Boolean).map(function (w) { return DEMONSTR[w] || w; });
    return numbers(tok);
  }
  /* the text in the form that is compared (pronouns that may be left out are taken out) */
  function normalize(text) {
    var s = ' ' + words(text).join(' ') + ' ';
    for (var r = 0; r < RULES.length; r++) s = s.replace(RULES[r][0], RULES[r][1]).replace(RULES[r][0], RULES[r][1]);
    var tok = s.split(' ').filter(Boolean), out = [];
    for (var i = 0; i < tok.length; i++) {
      var w = tok[i];
      if (DROP_ALWAYS[w] || (DROP_FREE[w] && !PREP[out[out.length - 1]])) continue;
      out.push(w);
    }
    return out.join(' ');
  }
  /* accepted answer, normalised: also the forms without one subject pronoun the learner may leave out */
  function variants(n) {
    var tok = n.split(' '), out = [n];
    for (var i = 0; i < tok.length; i++) if (DROP_ACCEPTED[tok[i]] && !PREP[tok[i - 1]]) out.push(tok.slice(0, i).concat(tok.slice(i + 1)).join(' '));
    return out;
  }

  /* ---------- accepted answers of a sentence ---------- */
  function accepted(sentence) {
    return [sentence.es].concat(sentence.alt || []).filter(function (x) { return x != null && String(x).trim(); });
  }
  var memo = dict(), memoKeys = [];
  function table(sentence) {
    var acc = accepted(sentence), key = acc.join('\u0001');
    if (memo[key]) return memo[key];
    var t = { list: [], exact: dict(), loose: dict() };
    for (var a = 0; a < acc.length && t.list.length < TOTAL; a++) {
      var xs = expand(acc[a], Math.min(CAP, TOTAL - t.list.length));
      for (var k = 0; k < xs.length; k++) {
        var n = normalize(xs[k]), idx = t.list.length, vs = variants(n);
        t.list.push({ text: xs[k], n: n });
        for (var v = 0; v < vs.length; v++) {
          if (!(vs[v] in t.exact)) t.exact[vs[v]] = idx;
          var l = strip(vs[v]); if (!(l in t.loose)) t.loose[l] = idx;
        }
      }
    }
    memo[key] = t; memoKeys.push(key);
    if (memoKeys.length > 40) delete memo[memoKeys.shift()];
    return t;
  }
  function count(sentence) { return table(sentence).list.length; }

  /* ---------- differences, for showing them ---------- */
  function lev(a, b, max) {
    var m = a.length, n = b.length, prev = [], cur, i, j;
    if (Math.abs(m - n) > max) return max + 1;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur = [i]; var low = i;
      for (j = 1; j <= n; j++) { cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); if (cur[j] < low) low = cur[j]; }
      if (low > max) return max + 1;
      prev = cur;
    }
    return prev[n];
  }
  function lcs(a, b) {
    var m = a.length, n = b.length, t = [], i, j;
    for (i = 0; i <= m; i++) { t[i] = []; for (j = 0; j <= n; j++) t[i][j] = 0; }
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) t[i][j] = a[i - 1] === b[j - 1] ? t[i - 1][j - 1] + 1 : Math.max(t[i - 1][j], t[i][j - 1]);
    var ma = a.map(function () { return false; }), mb = b.map(function () { return false; });
    i = m; j = n;
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) { ma[i - 1] = mb[j - 1] = true; i--; j--; }
      else if (t[i - 1][j] >= t[i][j - 1]) i--; else j--;
    }
    return [ma, mb];
  }
  /* the words of a text as shown, each with a loose key for comparing (no case, accents or punctuation) */
  function shown(text) {
    var out = [], re = /\S+/g, m;
    while ((m = re.exec(String(text || '')))) out.push({ w: m[0], k: strip(m[0].toLowerCase()).replace(/[^0-9a-z㐀-鿿]/g, '') });
    return out;
  }
  /* words of a and b that are not in their longest common sequence (compared loosely): { a: [{w, bad}], b: [{w, bad}] } */
  function wordMarks(a, b) {
    var wa = shown(a), wb = shown(b), r = lcs(wa.map(function (x) { return x.k; }), wb.map(function (x) { return x.k; }));
    return { a: wa.map(function (x, i) { return { w: x.w, bad: !r[0][i] && !!x.k }; }), b: wb.map(function (x, i) { return { w: x.w, bad: !r[1][i] && !!x.k }; }) };
  }
  /* the right answer, word by word, with the letters whose accent the learner left out or put wrongly: [[{t, bad}], ...] */
  function accentMarks(user, right) {
    var wu = shown(user), wr = shown(right), r = lcs(wu.map(function (x) { return x.k; }), wr.map(function (x) { return x.k; })), pair = {}, i = 0, j = 0;
    while (i < wu.length && j < wr.length) { if (r[0][i] && r[1][j]) { pair[j] = wu[i]; i++; j++; } else if (!r[0][i]) i++; else j++; }
    return wr.map(function (x, n) {
      var u = pair[n], uw = u ? Array.from(u.w.toLowerCase().normalize('NFC')) : null, rw = Array.from(x.w.toLowerCase().normalize('NFC')), show = Array.from(x.w.normalize('NFC')), parts = [];
      for (var k = 0; k < show.length; k++) {
        var bad = !!uw && uw.length === rw.length && uw[k] !== rw[k];
        if (parts.length && parts[parts.length - 1].bad === bad) parts[parts.length - 1].t += show[k]; else parts.push({ t: show[k], bad: bad });
      }
      return parts;
    });
  }

  /* ---------- the check ----------
     { empty: true, han }            nothing in Spanish was typed (han: Chinese characters were typed)
     { ok: true, match, accent }     match = the accepted sentence it equals; accent = only accents differ (accentMarks)
     { ok: false, closest, marks }   closest = the accepted sentence nearest to it; marks = wordMarks(typed, closest) */
  var HAS_LETTER = new RegExp('[' + LETTER + ']');
  function evaluate(input, sentence) {
    var raw = String(input == null ? '' : input).replace(/\s+/g, ' ').trim();
    if (!HAS_LETTER.test(raw)) return { ok: false, empty: true, user: raw, han: /[㐀-鿿]/.test(raw) };
    var t = table(sentence), n = normalize(raw);
    if (n in t.exact) return { ok: true, user: raw, match: t.list[t.exact[n]].text };
    var l = strip(n);
    if (l in t.loose) { var mt = t.list[t.loose[l]].text; return { ok: true, accent: true, user: raw, match: mt, accentMarks: accentMarks(raw, mt) }; }
    var ut = n.split(' '), best = null, bestD = Infinity;
    for (var i = 0; i < t.list.length && bestD > 0; i++) {
      var d = lev(ut, t.list[i].n.split(' '), Math.min(bestD, 60));
      if (d < bestD) { bestD = d; best = t.list[i]; }
    }
    var closest = best ? best.text : String(sentence.es || '');
    return { ok: false, user: raw, closest: closest, marks: wordMarks(raw, closest) };
  }
  /* is this text already accepted for the sentence? (exactly, accents included) */
  function matches(text, sentence) { return normalize(text) in table(sentence).exact; }
  /* text written by the learner ("I was right", Library): no pattern marks */
  function plain(text) { return String(text || '').replace(/[{}\[\]|]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function hasSpanish(text) { return HAS_LETTER.test(String(text || '')); }
  /* the main answer and its alternatives as plain text for searching (choices joined) */
  function searchText(sentence) { return accepted(sentence).join(' ').replace(/[{}\[\]|]/g, ' '); }

  var api = { expand: expand, render: render, isPattern: isPattern, normalize: normalize, strip: strip, accepted: accepted, count: count,
    evaluate: evaluate, matches: matches, plain: plain, hasSpanish: hasSpanish, wordMarks: wordMarks, accentMarks: accentMarks,
    words: words, lev: lev, searchText: searchText };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Check = api;
})(typeof window !== 'undefined' ? window : this);
