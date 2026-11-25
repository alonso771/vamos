/* Vamos web app (iPhone: Safari → Add to Home Screen; works in other browsers too). Loaded before app.js.
   It does here what the Android shell does in the Android app:
   - recordings (1.3.2), heard in silent mode too: words from Lingua Libre (data/words/<n>.m4a, AAC, as Safari cannot play
     the Ogg files of the Android app) and the sentences of the app (data/say/<id>.m4a, made with Piper); the phone's voice
     reads the rest (your own sentences) and is muted by the silent switch;
   - the keyboard: the iPhone keeps the page as tall as the screen when the keyboard opens, so the app is fitted to the
     visible part (visualViewport) and the Check button stays above the keyboard;
   - offline: sw.js keeps all files, the app opens without internet (DeepSeek needs internet, of course);
   - an update of the files on GitHub is taken at the next quiet moment (no session open);
   - asks the browser to keep the storage (the progress lives there). */
(function () {
  'use strict';
  window.AUDIO_EXT = 'm4a';
  window.SAY_AUDIO = { dir: 'data/say/', ext: 'm4a' };
  var de = document.documentElement, UA = navigator.userAgent || '';
  var IOS = /iPhone|iPad|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var STANDALONE = navigator.standalone === true || !!(window.matchMedia && (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches));
  de.classList.add('web');
  if (IOS) de.classList.add('ios');
  if (STANDALONE) de.classList.add('standalone');

  /* ---- the keyboard ---- */
  var vv = window.visualViewport;
  function editing() {
    var a = document.activeElement; if (!a) return false;
    return a.tagName === 'TEXTAREA' || a.isContentEditable || (a.tagName === 'INPUT' && !/^(button|checkbox|radio|file|range|submit|reset|color)$/i.test(a.type));
  }
  function fit() {
    if (!vv) return;
    var full = Math.max(de.clientHeight, window.innerHeight), kb = editing() && vv.height < full - 80;
    de.style.setProperty('--vvh', Math.round(vv.height) + 'px');
    de.style.setProperty('--vvt', Math.round(Math.max(0, vv.offsetTop)) + 'px');
    if (kb !== de.classList.contains('kb')) de.classList.toggle('kb', kb);
  }
  if (vv) { vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit); }
  document.addEventListener('focusin', function () { fit(); setTimeout(fit, 120); setTimeout(fit, 400); });
  document.addEventListener('focusout', function () {
    setTimeout(function () { if (!editing()) { if (window.scrollY) window.scrollTo(0, 0); } fit(); }, 80);    // (the iPhone can leave the page scrolled)
  });
  window.addEventListener('orientationchange', function () { setTimeout(fit, 350); });
  fit();
  /* the Home Screen app: no pinch zoom of the whole app (the text stays selectable) */
  if (IOS && STANDALONE) document.addEventListener('gesturestart', function (e) { e.preventDefault(); });

  /* ---- keep the storage ---- */
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(function (p) { if (!p) navigator.storage.persist(); }); } catch (e) { }

  /* ---- offline files and updates ---- */
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  var hadController = !!navigator.serviceWorker.controller, pending = false, reloading = false, reg = null, lastCheck = Date.now();
  function idle() { try { return !!(window.__app && window.__app.idle && window.__app.idle()); } catch (e) { return false; } }
  function tryReload() {
    if (!pending || reloading || !idle()) return;
    reloading = true;
    try { if (window.__draftSave) window.__draftSave(); } catch (e) { }
    location.reload();
  }
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!hadController) { hadController = true; return; }       // the first install: the files are kept now, nothing to reload
    pending = true; tryReload();
  });
  document.addEventListener('click', function () { if (pending) setTimeout(tryReload, 60); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') return;
    tryReload();
    if (reg && Date.now() - lastCheck > 3600000) { lastCheck = Date.now(); reg.update().catch(function () { }); }   // the app stays open for days on a phone
  });
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js', { scope: './' }).then(function (r) { reg = r; }).catch(function () { });
  });
})();
