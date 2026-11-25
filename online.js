/* Vamos - stands in front of the Java shell (MainActivity.Bridge, window.AndroidBridge) as window.FraseBridge.
   Everything is passed on to the Java shell (progress file, Drive backup file, text to speech, files), except the AI
   tutor: DeepSeek, online, with the user's own API key. The key is kept in this app's own storage (the WebView's
   localStorage), not in the progress and not in the backup file; Android's own backup leaves it out (res/xml/*_rules.xml).
   The page (app.js) hands over the messages for DeepSeek as JSON: a system message and the question, both in Chinese,
   so the explanation comes back in Chinese.
   In the web app (iPhone) there is no Java shell: only the AI tutor part is used, the key is kept in the browser's storage
   of the web app, and DeepSeek is called straight from the page (api.deepseek.com allows that). */
(function () {
  'use strict';
  var J = window.AndroidBridge || null, Bridge = {};
  /* the methods of the Java shell and how many arguments each takes: a Java method must be called on the injected
     object itself and with exactly its number of arguments (tools/check_bridge.py compares this with MainActivity.java) */
  var JAVA = { loadState: 0, saveState: 1, syncAvailable: 0, syncStatus: 0, syncCreate: 3, syncOpen: 0, syncPush: 3, syncRead: 1, syncAdopt: 1,
    syncUnlink: 0, saveFile: 3, ttsAvailable: 0, ttsSpeak: 1, ttsSetVoice: 1, loadDraft: 0, saveDraft: 1 };
  Object.keys(JAVA).forEach(function (n) {
    if (!J || !J[n]) return;
    Bridge[n] = JAVA[n] === 0 ? function () { return J[n](); } : JAVA[n] === 1 ? function (a) { return J[n](a); } : function (a, b, c) { return J[n](a, b, c); };
  });
  if (typeof window.AbortController !== 'function') window.AbortController = function () { this.signal = undefined; this.abort = function () { }; };   // old WebView: "Stop" does nothing

  /* ---------------- AI tutor: DeepSeek (the user's own key) ---------------- */
  var AI_KEY = 'frase-ai', API_URL = 'https://api.deepseek.com/chat/completions', HOST = 'api.deepseek.com', SITE = 'platform.deepseek.com → API keys';
  var KEYS_URL = 'https://platform.deepseek.com/api_keys';      // a link only in the web app (the Android app opens no web pages)
  var MODELS = [['deepseek-flash', 'deepseek-flash – fast and cheap (recommended)'], ['deepseek-v4-pro', 'deepseek-v4-pro – stronger, slower, costs more']];
  /* stored: { key, model } */
  var ai = (function () {
    var a = { key: '', model: MODELS[0][0] };
    try {
      var c = JSON.parse(localStorage.getItem(AI_KEY) || 'null');
      if (c && typeof c.key === 'string') { a.key = c.key; if (c.model) a.model = c.model; }
    } catch (e) { }
    return a;
  })();
  function aiKeep() { try { if (ai.key) localStorage.setItem(AI_KEY, JSON.stringify(ai)); else localStorage.removeItem(AI_KEY); } catch (e) { } }
  var aiRun = null, aiNote = { text: '', ok: false, busy: false };
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function llmEvent(ev) { try { if (window.__llm) window.__llm.onEvent(ev); } catch (e) { } }
  var AI_CHECK = ' Check it in Preferences → AI tutor.';
  function aiProblem(status, body) {
    var detail = ''; try { detail = JSON.parse(body).error.message || ''; } catch (e) { }
    if (status === 401 || status === 403) return 'DeepSeek did not accept the API key.' + AI_CHECK;
    if (status === 402 || /insufficient balance/i.test(detail)) return 'The DeepSeek account has no balance left. Top it up at platform.deepseek.com.';
    if (status === 429) return 'DeepSeek is receiving too many requests right now. Try again in a moment.';
    if (status >= 500) return 'DeepSeek is busy or has a problem (code ' + status + '). Try again in a moment.';
    return 'DeepSeek answered with an error (code ' + status + ')' + (detail ? ': ' + detail.slice(0, 160) : '.');
  }
  function aiOffline() { return 'Could not reach DeepSeek. Check the internet connection – a company network may block ' + HOST + '.'; }
  function aiRequest(messages, maxTokens, stream, signal, key, model) {
    return fetch(API_URL, { method: 'POST', signal: signal, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({ model: model, messages: messages, stream: stream, max_tokens: maxTokens, temperature: 0.7, thinking: { type: 'disabled' } }) });
  }
  /* the page hands over JSON [{ role, content }, ...]; plain text is sent as one question */
  function aiMessages(prompt) {
    try { var m = JSON.parse(prompt); if (Array.isArray(m) && m.length && m.every(function (x) { return x && typeof x.content === 'string'; })) return m; } catch (e) { }
    return [{ role: 'user', content: String(prompt) }];
  }
  Bridge.llmAvailable = function () { return typeof fetch === 'function' && typeof AbortController === 'function'; };
  Bridge.llmName = function () { return 'DeepSeek'; };
  Bridge.llmStatus = function () { return JSON.stringify({ state: ai.key ? 'ready' : 'none', model: ai.model }); };
  Bridge.llmStop = function () { if (aiRun) aiRun.ctl.abort(); };
  Bridge.llmAsk = function (id, prompt, maxTokens) {
    if (aiRun) aiRun.ctl.abort();
    var run = aiRun = { id: id, ctl: new AbortController() }, got = 0;
    var finish = function (ev) { if (aiRun === run) aiRun = null; ev.id = id; setTimeout(function () { llmEvent(ev); }, 0); };
    setTimeout(function () { llmEvent({ id: id, type: 'stage', stage: 'reading' }); }, 0);
    aiRequest(aiMessages(prompt), Math.max(500, maxTokens | 0), true, run.ctl.signal, ai.key, ai.model).then(function (r) {
      if (!r.ok) return r.text().then(function (b) { finish({ type: 'error', message: aiProblem(r.status, b) }); });
      var reader = r.body.getReader(), dec = new TextDecoder(), buf = '';
      var line = function (ln) {
        if (ln.slice(0, 5) !== 'data:') return;
        var d = ln.slice(5).trim(); if (!d || d === '[DONE]') return;
        try { var c = JSON.parse(d).choices[0].delta.content; if (c) { got += c.length; llmEvent({ id: id, type: 'text', text: c }); } } catch (e) { }
      };
      var pump = function () {
        return reader.read().then(function (x) {
          if (x.done) { if (buf) line(buf); return finish({ type: 'done' }); }
          buf += dec.decode(x.value, { stream: true });
          var parts = buf.split('\n'); buf = parts.pop();
          parts.forEach(function (p) { line(p.replace(/\r$/, '')); });
          return pump();
        });
      };
      return pump();
    }).catch(function (e) {
      if (e && e.name === 'AbortError') return finish({ type: 'stopped' });
      finish(got ? { type: 'done' } : { type: 'error', message: aiOffline() });
    });
  };
  /* the set-up sheet */
  Bridge.llmSheetHTML = function () {
    var opts = MODELS.map(function (m) { return '<option value="' + m[0] + '"' + (m[0] === ai.model ? ' selected' : '') + '>' + esc(m[1]) + '</option>'; }).join('');
    var note = aiNote.text ? '<p class="' + (aiNote.ok ? 'tutor-ok' : 'ai-err') + '">' + esc(aiNote.text) + '</p>' : '';
    var h = '<h3>AI tutor · DeepSeek</h3>';
    if (ai.key) {
      h += '<p>Connected with the key ending in <b>' + esc(ai.key.slice(-4)) + '</b>. After a wrong answer, tap <b>Ask DeepSeek why my answer is wrong</b>: the explanation comes in Chinese.</p>' +
        '<label class="tutor-lab">Model<select id="tutor-model" class="tutor-in">' + opts + '</select></label>' + note +
        '<div class="actions"><button class="btn danger" data-tutor="remove">Remove key</button><button class="btn ghost" data-tutor="test"' + (aiNote.busy ? ' disabled' : '') + '>' + (aiNote.busy ? 'Testing…' : 'Test') + '</button><button class="btn" data-act="close-sheet">Done</button></div>';
    } else {
      h += '<p>After a wrong answer, DeepSeek can explain in Chinese what is wrong. It is an online service: the Chinese sentence, the correct answer and what you typed are sent to <b>' + HOST + '</b> with your own API key. A question costs a small fraction of a cent.</p>' +
        (J ? '' : '<ol class="tutor-steps"><li>Open <a href="' + KEYS_URL + '" target="_blank" rel="noopener">platform.deepseek.com/api_keys</a> and sign in. Add a little balance under <b>Top up</b>.</li>' +
          '<li>Tap <b>Create new API key</b> and copy the key (it starts with sk-).</li><li>Come back to Vamos and paste it here.</li></ol>') +
        '<label class="tutor-lab">DeepSeek API key<input id="tutor-key" class="tutor-in masked" type="text" placeholder="sk-…" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></label>' +
        '<label class="tutor-lab">Model<select id="tutor-model" class="tutor-in">' + opts + '</select></label>' + note +
        '<div class="actions"><button class="btn ghost" data-act="close-sheet">Cancel</button><button class="btn" data-tutor="save"' + (aiNote.busy ? ' disabled' : '') + '>' + (aiNote.busy ? 'Checking…' : 'Save and test') + '</button></div>';
    }
    return h + '<p class="ai-credit">The key is kept only inside this app on this device – not in your progress and not in the backup file. Create or revoke it at ' +
      (J ? SITE : '<a href="' + KEYS_URL + '" target="_blank" rel="noopener">' + SITE + '</a>') + '.</p>';
  };
  function aiRepaint() { try { if (window.__app && window.__app.aiSheetIfOpen) window.__app.aiSheetIfOpen(); } catch (e) { } }
  function aiTest(key, model, onOk) {
    aiNote = { text: '', ok: false, busy: true }; aiRepaint();
    aiRequest([{ role: 'user', content: 'Reply with: ok' }], 5, false, undefined, key, model).then(function (r) {
      return r.text().then(function (b) {
        if (r.ok) { if (onOk) onOk(); aiNote = { text: 'It works: DeepSeek answered.', ok: true, busy: false }; }
        else aiNote = { text: aiProblem(r.status, b).replace(AI_CHECK, ' Check that it was copied completely.'), ok: false, busy: false };
      });
    }).catch(function () { aiNote = { text: aiOffline(), ok: false, busy: false }; }).then(aiRepaint);
  }
  document.addEventListener('change', function (e) { if (e.target && e.target.id === 'tutor-model' && ai.key) { ai.model = e.target.value; aiKeep(); } });
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-tutor]'); if (!el || el.disabled) return;
    var act = el.dataset.tutor, sel = document.getElementById('tutor-model'), model = sel ? sel.value : ai.model;
    if (act === 'save') {
      var key = (document.getElementById('tutor-key').value || '').trim();
      if (!key) { aiNote = { text: 'Paste the API key first.', ok: false, busy: false }; return aiRepaint(); }
      aiTest(key, model, function () { ai.key = key; ai.model = model; aiKeep(); });
    } else if (act === 'test') aiTest(ai.key, model);
    else if (act === 'remove') {
      if (aiRun) aiRun.ctl.abort();
      ai.key = ''; aiKeep(); aiNote = { text: 'The key was removed from this device.', ok: true, busy: false }; aiRepaint();
    }
  });
  Bridge.llmSheetOpened = function () { if (!aiNote.busy) aiNote = { text: '', ok: false, busy: false }; };

  window.FraseBridge = Bridge;
})();
