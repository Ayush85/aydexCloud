(function () {
  'use strict';
  // Analytics must never break or slow the host page: anything unexpected is swallowed.
  try {
  var d = document, w = window, nav = navigator;
  var s = d.currentScript || d.querySelector('script[data-site]');
  if (!s) return;
  var sid = s.getAttribute('data-site');
  if (!sid) return;
  if (nav.webdriver) return;
  // Opt-in: honour the browser's Do Not Track signal.
  if (s.getAttribute('data-respect-dnt') === 'true' && (nav.doNotTrack === '1' || w.doNotTrack === '1')) return;

  var src = s.src || '';
  var base = src.substring(0, src.lastIndexOf('/'));
  // data-endpoint lets a first-party proxy expose the collector under a neutral path.
  var endpoint = s.getAttribute('data-endpoint') || 'collect';
  var storageMode = s.getAttribute('data-storage') || '';
  var dataKey = s.getAttribute('data-key') || '';
  var behavior = s.getAttribute('data-behavior') !== 'off';
  var spa = s.getAttribute('data-spa') !== 'off';

  // Optional persistent, encrypted anonymous visitor id (opt-in via data-storage).
  // Default (no data-storage / "memory") keeps today's behavior: no client storage at all.
  async function deriveKey(passphrase, salt) {
    var bk = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, bk, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  function toB64(bytes) { var bin = ''; for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]); return btoa(bin); }
  function fromB64(b64) { var bin = atob(b64); var bytes = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); return bytes; }
  async function encryptVal(plaintext, key) {
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(plaintext));
    var combined = new Uint8Array(iv.length + ct.byteLength);
    combined.set(iv, 0); combined.set(new Uint8Array(ct), iv.length);
    return toB64(combined);
  }
  async function decryptVal(encoded, key) {
    var combined = fromB64(encoded);
    var iv = combined.slice(0, 12);
    var ct = combined.slice(12);
    var pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ct);
    return new TextDecoder().decode(pt);
  }
  async function getVisitorId() {
    if (!storageMode || storageMode === 'memory') return '';
    try {
      var store = storageMode === 'localStorage' ? w.localStorage : w.sessionStorage;
      var existing = store.getItem('aydex_vid');
      var key = dataKey ? await deriveKey(dataKey, sid) : null;
      if (existing) {
        if (key) {
          try { return await decryptVal(existing, key); } catch (e) { /* corrupt/undecryptable — fall through and regenerate */ }
        } else {
          return existing;
        }
      }
      var id = (crypto.randomUUID ? crypto.randomUUID() : (Date.now() + '-' + Math.random().toString(36).slice(2)));
      store.setItem('aydex_vid', key ? (await encryptVal(id, key)) : id);
      return id;
    } catch (e) { return ''; }
  }

  var vid = '', isReady = false;
  var ready = getVisitorId().then(function (v) { vid = v; isReady = true; }, function () { isReady = true; });
  function whenReady(fn) { if (isReady) fn(); else ready.then(fn); }

  function fire(u, beacon) {
    if (beacon && nav.sendBeacon) { try { if (nav.sendBeacon(u)) return; } catch (e) { /* fall back to the pixel */ } }
    new Image().src = u;
  }

  // o: { path, ref, beacon }. A pixel request / beacon carrying everything in the query string.
  function send(name, props, o) {
    o = o || {};
    whenReady(function () {
      var p = encodeURIComponent(o.path || (location.pathname + location.search));
      var r = encodeURIComponent(o.ref === undefined ? (d.referrer || '') : o.ref);
      var q = '?s=' + sid + '&p=' + p + '&r=' + r + '&w=' + screen.width;
      if (vid) q += '&v=' + encodeURIComponent(vid);
      if (name && name !== 'pageview') {
        q += '&e=' + encodeURIComponent(name);
        if (props) q += '&ep=' + encodeURIComponent(JSON.stringify(props));
      }
      fire(base + '/' + endpoint + q, o.beacon);
    });
  }

  // ── Per-page state (memory only; a random page id is never stored or reused) ──
  var pid = '', page = null;
  function newPage() {
    pid = Math.random().toString(36).slice(2, 10);
    page = { path: location.pathname + location.search, vis: 0, since: d.visibilityState === 'hidden' ? 0 : Date.now(), scroll: 0, rage: 0, dead: 0, err: 0 };
  }
  function engaged() { return page.vis + (page.since ? Date.now() - page.since : 0); }
  // Sends the engaged time (and deepest scroll) accumulated since the last flush.
  function flush() {
    var ms = engaged();
    if (ms >= 500) send('_dur', { ms: Math.min(ms, 1800000), sd: page.scroll, pid: pid }, { path: page.path, beacon: true });
    page.vis = 0;
    page.since = d.visibilityState === 'hidden' ? 0 : Date.now();
  }

  newPage();
  send('pageview');

  d.addEventListener('visibilitychange', function () {
    if (d.visibilityState === 'hidden') { flush(); page.since = 0; } else { page.since = Date.now(); }
  });
  w.addEventListener('pagehide', flush);

  // Single-page apps: a pushState/replaceState/popstate to a new path is a new pageview.
  if (spa) {
    var onNav = function () {
      var p = location.pathname + location.search;
      if (p === page.path) return;
      flush();
      newPage();
      send('pageview', null, { ref: '' });
    };
    ['pushState', 'replaceState'].forEach(function (fn) {
      var orig = w.history && w.history[fn];
      if (!orig) return;
      w.history[fn] = function () { var r = orig.apply(this, arguments); setTimeout(onNav, 0); return r; };
    });
    w.addEventListener('popstate', onNav);
  }

  // Deepest scroll position, in 5% steps.
  var scrollTimer = 0;
  function later(fn) { if (w.requestAnimationFrame) w.requestAnimationFrame(fn); else setTimeout(fn, 0); }
  function readScroll() {
    scrollTimer = 0;
    try {
    var de = d.documentElement, b = d.body;
    var h = Math.max(de.scrollHeight || 0, b ? b.scrollHeight : 0);
    var y = (w.pageYOffset || de.scrollTop || 0) + (w.innerHeight || de.clientHeight || 0);
    if (h > 0) { var pc = Math.min(100, Math.round(y / h * 20) * 5); if (pc > page.scroll) page.scroll = pc; }
    } catch (e) { /* ignore */ }
  }
  function onScroll() { if (!scrollTimer) scrollTimer = setTimeout(function () { later(readScroll); }, 150); }
  w.addEventListener('scroll', onScroll, { passive: true });
  setTimeout(function () { later(readScroll); }, 500);

  // ── Behavior signals: counted, never recorded. No text, no screenshots, no keystrokes. ──
  function interactive(el) {
    while (el && el !== d.body && el.nodeType === 1) {
      var t = el.tagName;
      if (t === 'A' || t === 'BUTTON' || t === 'INPUT' || t === 'SELECT' || t === 'SUMMARY' || (el.getAttribute && el.getAttribute('role') === 'button')) return el;
      el = el.parentElement;
    }
    return null;
  }
  function sel(el) {
    if (!el || !el.tagName) return '';
    var r = el.tagName.toLowerCase();
    if (el.id) r += '#' + String(el.id).slice(0, 40);
    else if (el.className && typeof el.className === 'string') r += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.').slice(0, 60);
    return r.slice(0, 100);
  }
  function clean(m) {
    return String(m || '')
      .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]')
      .replace(/\d{6,}/g, '#')
      .replace(/([?#])[^\s'")]*/g, '$1')
      .slice(0, 140);
  }
  // A button/role=button/placeholder link that changed nothing within 800ms.
  function deadCandidate(el) {
    if (el.disabled) return false;
    var t = el.tagName;
    if (t === 'BUTTON') return el.type === 'button' || !el.form;
    if (el.getAttribute('role') === 'button') return true;
    if (t === 'A') { var h = el.getAttribute('href'); return !h || h === '#' || /^javascript:/i.test(h); }
    return false;
  }
  function watchDead(el) {
    var changed = false, mo;
    try {
      mo = new MutationObserver(function () { changed = true; });
      mo.observe(d.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
    } catch (e) { return; }
    var href = location.href;
    setTimeout(function () {
      mo.disconnect();
      if (!changed && location.href === href && d.visibilityState !== 'hidden' && page.dead < 3) {
        page.dead++;
        send('_dead', { t: sel(el) });
      }
    }, 800);
  }
  var DL = /\.(pdf|zip|rar|7z|gz|tar|dmg|exe|msi|apk|doc|docx|xls|xlsx|ppt|pptx|csv|mp3|mp4|mov|epub)$/i;
  var clicks = [];

  if (behavior) {
    d.addEventListener('click', function (e) {
      try { onClick(e); } catch (err) { /* ignore */ }
    }, true);
    function onClick(e) {
      var t = e.target;
      if (!t || !t.tagName) return;
      if (t.closest && t.closest('[data-aydex-ignore]')) return;
      var now = Date.now(), x = e.clientX, y = e.clientY;

      // Rage click: 3+ clicks within 1s inside a 30px box.
      clicks.push({ t: now, x: x, y: y });
      clicks = clicks.filter(function (c) { return now - c.t < 1000 && Math.abs(c.x - x) < 31 && Math.abs(c.y - y) < 31; });
      var el = interactive(t);
      if (clicks.length >= 3 && page.rage < 3) {
        page.rage++;
        clicks = [];
        send('_rage', { t: sel(el || t) });
      } else if (el && deadCandidate(el) && page.dead < 3) {
        watchDead(el);
      }

      // Outbound links and file downloads (origin + path only; query strings are dropped).
      var a = t.closest ? t.closest('a[href]') : null;
      if (a) {
        try {
          var u = new URL(a.href, location.href);
          if (u.protocol === 'http:' || u.protocol === 'https:') {
            if (DL.test(u.pathname)) {
              send('_dl', { f: u.pathname.split('/').pop().slice(0, 100) }, { beacon: true });
            } else if (u.host !== location.host) {
              send('_out', { u: (u.origin + u.pathname).slice(0, 200) }, { beacon: true });
            }
          }
        } catch (err) { /* malformed href */ }
      }
    }

    w.addEventListener('error', function (e) {
      if (page.err >= 5 || !e || !e.message || e.message === 'Script error.') return;
      page.err++;
      var f = '';
      try { f = new URL(e.filename, location.href).pathname; } catch (err) { /* no filename */ }
      send('_err', { m: clean(e.message), f: f.slice(0, 120), l: e.lineno || 0 });
    });
    w.addEventListener('unhandledrejection', function (e) {
      if (page.err >= 5) return;
      page.err++;
      var r = e && e.reason;
      send('_err', { m: clean((r && r.message) || r), f: '', l: 0 });
    });
  }

  // Custom events. Names starting with "_" are reserved for the signals above.
  w.aydex = {
    track: function (name, props) {
      if (!name || String(name).charAt(0) === '_') return;
      send(String(name).slice(0, 64), props);
    }
  };
  } catch (e) { /* never surface errors to the host page */ }
})();
