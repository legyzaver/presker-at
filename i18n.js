/* Presker.at — shared EN/DE/SL/auto language switcher.
 * "Auto" reads the browser's own UI language (navigator.language) — no IP
 * lookup, no geolocation. A page opts in by setting window.PRESKER_I18N =
 * { en:{...}, de:{...}, sl:{...} } before this script runs, and tagging
 * elements with data-i18n="key" (textContent), data-i18n-html="key"
 * (innerHTML, for copy that needs a nested tag) or data-i18n-href="key"
 * (the href itself, for per-language downloads). Elements with no matching
 * key, or pages with no PRESKER_I18N at all, are left untouched.
 */
(function () {
  'use strict';

  function getSaved() { try { return localStorage.getItem('presker-lang'); } catch (e) { return null; } }
  function setSaved(v) { try { localStorage.setItem('presker-lang', v); } catch (e) {} }

  function detect() {
    try {
      var raw = (navigator.language || 'en').toLowerCase();
      window.__preskerAuto = window.__preskerAuto || {};
      window.__preskerAuto.lang = raw;
      var primary = raw.split('-')[0];
      if (primary === 'de') return 'de';
      if (primary === 'sl') return 'sl';
      return 'en';
    } catch (e) { return 'en'; }
  }

  function resolve(pref) { return pref === 'auto' ? detect() : pref; }

  function translate(lang) {
    var table = window.PRESKER_I18N;
    if (!table) return;
    var dict = table[lang] || {};
    var fallback = table.en || {};
    var textEls = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < textEls.length; i++) {
      var key = textEls[i].getAttribute('data-i18n');
      var val = dict[key] != null ? dict[key] : fallback[key];
      if (val != null) textEls[i].textContent = val;
    }
    var htmlEls = document.querySelectorAll('[data-i18n-html]');
    for (var j = 0; j < htmlEls.length; j++) {
      var hkey = htmlEls[j].getAttribute('data-i18n-html');
      var hval = dict[hkey] != null ? dict[hkey] : fallback[hkey];
      if (hval != null) htmlEls[j].innerHTML = hval;
    }
    var phEls = document.querySelectorAll('[data-i18n-placeholder]');
    for (var k = 0; k < phEls.length; k++) {
      var pkey = phEls[k].getAttribute('data-i18n-placeholder');
      var pval = dict[pkey] != null ? dict[pkey] : fallback[pkey];
      if (pval != null) phEls[k].placeholder = pval;
    }
    /* data-i18n-href points a link at a per-language file (the German press
     * kit, say). The English file keeps the unsuffixed name, so a missing key
     * falls back to it rather than to a dead link. */
    var hrefEls = document.querySelectorAll('[data-i18n-href]');
    for (var m = 0; m < hrefEls.length; m++) {
      var mkey = hrefEls[m].getAttribute('data-i18n-href');
      var mval = dict[mkey] != null ? dict[mkey] : fallback[mkey];
      if (mval != null) hrefEls[m].setAttribute('href', mval);
    }
  }

  function apply(pref) {
    var resolved = resolve(pref);
    document.documentElement.setAttribute('lang', resolved);
    document.documentElement.setAttribute('data-lang-pref', pref);
    translate(resolved);
  }

  var savedPref = getSaved() || 'auto';
  apply(savedPref); // early pass: sets <html lang>; body may not exist yet

  window.PreskerI18n = {
    set: function (pref) { setSaved(pref); apply(pref); document.dispatchEvent(new CustomEvent('presker-lang-change')); },
    get: function () { return document.documentElement.getAttribute('data-lang-pref') || 'auto'; },
    getResolved: function () { return document.documentElement.getAttribute('lang'); },
    mountToggle: function () { wireToggle(); }
  };

  function wireToggle() {
    apply(window.PreskerI18n.get()); // real pass, now that <body> and PRESKER_I18N exist
    var group = document.querySelector('[data-lang-toggle]');
    if (!group || group.dataset.wired) return;
    group.dataset.wired = '1';
    function render() {
      var pref = window.PreskerI18n.get();
      var btns = group.querySelectorAll('[data-lang-set]');
      for (var i = 0; i < btns.length; i++) {
        var on = btns[i].getAttribute('data-lang-set') === pref;
        btns[i].classList.toggle('on', on);
        btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
      }
      var note = document.querySelector('[data-lang-note]');
      if (note) note.textContent = pref === 'auto' ? ('detected ' + ((window.__preskerAuto || {}).lang || '')) : '';
    }
    var setBtns = group.querySelectorAll('[data-lang-set]');
    for (var i = 0; i < setBtns.length; i++) {
      setBtns[i].addEventListener('click', (function (btn) {
        return function () { window.PreskerI18n.set(btn.getAttribute('data-lang-set')); };
      })(setBtns[i]));
    }
    document.addEventListener('presker-lang-change', render);
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireToggle);
  } else {
    wireToggle();
  }
})();
