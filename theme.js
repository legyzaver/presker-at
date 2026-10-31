/* Presker.at — shared light/dark/auto theme.
 * Loaded unminified, non-deferred, early in <head> on every shell page so it
 * can set data-theme before first paint (no flash). "Auto" computes today's
 * sunrise/sunset for the visitor's own timezone, entirely client-side — no
 * geolocation permission, no network request, no third-party service.
 */
(function () {
  'use strict';

  // Approximate [lat, lon] per IANA zone, for "auto". Unlisted zones fall
  // back to an estimate derived from the browser's UTC offset alone.
  var TZ_COORDS = {
    'Europe/Vienna': [48.21, 16.37], 'Europe/Ljubljana': [46.06, 14.51],
    'Europe/Berlin': [52.52, 13.40], 'Europe/Zurich': [47.37, 8.54],
    'Europe/London': [51.51, -0.13], 'Europe/Paris': [48.86, 2.35],
    'Europe/Madrid': [40.42, -3.70], 'Europe/Rome': [41.90, 12.50],
    'Europe/Amsterdam': [52.37, 4.90], 'Europe/Brussels': [50.85, 4.35],
    'Europe/Prague': [50.08, 14.44], 'Europe/Warsaw': [52.23, 21.01],
    'Europe/Budapest': [47.50, 19.04], 'Europe/Zagreb': [45.81, 15.98],
    'Europe/Belgrade': [44.79, 20.45], 'Europe/Bucharest': [44.43, 26.10],
    'Europe/Athens': [37.98, 23.73], 'Europe/Stockholm': [59.33, 18.07],
    'Europe/Oslo': [59.91, 10.75], 'Europe/Copenhagen': [55.68, 12.57],
    'Europe/Helsinki': [60.17, 24.94], 'Europe/Dublin': [53.35, -6.26],
    'Europe/Lisbon': [38.72, -9.14], 'Europe/Moscow': [55.76, 37.62],
    'Europe/Kyiv': [50.45, 30.52],
    'America/New_York': [40.71, -74.01], 'America/Chicago': [41.88, -87.63],
    'America/Denver': [39.74, -104.99], 'America/Los_Angeles': [34.05, -118.24],
    'America/Toronto': [43.65, -79.38], 'America/Vancouver': [49.28, -123.12],
    'America/Mexico_City': [19.43, -99.13], 'America/Sao_Paulo': [-23.55, -46.63],
    'America/Argentina/Buenos_Aires': [-34.60, -58.38],
    'Asia/Tokyo': [35.68, 139.69], 'Asia/Shanghai': [31.23, 121.47],
    'Asia/Hong_Kong': [22.32, 114.17], 'Asia/Singapore': [1.35, 103.82],
    'Asia/Seoul': [37.57, 126.98], 'Asia/Kolkata': [28.61, 77.21],
    'Asia/Dubai': [25.20, 55.27], 'Asia/Bangkok': [13.76, 100.50],
    'Asia/Jakarta': [-6.21, 106.85],
    'Australia/Sydney': [-33.87, 151.21], 'Australia/Melbourne': [-37.81, 144.96],
    'Australia/Perth': [-31.95, 115.86], 'Pacific/Auckland': [-36.85, 174.76],
    'Africa/Cairo': [30.04, 31.24], 'Africa/Johannesburg': [-26.20, 28.04],
    'Africa/Lagos': [6.52, 3.38]
  };

  // Standard NOAA approximate solar calculation (declination + equation of
  // time). Accurate to within a few minutes — plenty for day/night theming.
  function sunTimesUTC(date, lat, lon) {
    var rad = Math.PI / 180;
    var start = Date.UTC(date.getFullYear(), 0, 1);
    var today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    var dayOfYear = Math.floor((today - start) / 86400000) + 1;
    var gamma = (2 * Math.PI / 365) * (dayOfYear - 1);
    var decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
      - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
      - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
    var eqtime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
      - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
    var latRad = lat * rad;
    var zenith = 90.833 * rad;
    var cosHA = (Math.cos(zenith) / (Math.cos(latRad) * Math.cos(decl))) - Math.tan(latRad) * Math.tan(decl);
    cosHA = Math.max(-1, Math.min(1, cosHA));
    var haDeg = Math.acos(cosHA) / rad;
    return {
      sunriseUTC: (720 - 4 * (lon + haDeg) - eqtime) / 60,
      sunsetUTC: (720 - 4 * (lon - haDeg) - eqtime) / 60
    };
  }
  function norm24(h) { return ((h % 24) + 24) % 24; }

  function computeAutoTheme() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      var coords = TZ_COORDS[tz];
      if (!coords) {
        var offsetHours = -new Date().getTimezoneOffset() / 60;
        coords = [45, offsetHours * 15];
      }
      var now = new Date();
      var r = sunTimesUTC(now, coords[0], coords[1]);
      var offMin = now.getTimezoneOffset();
      var sunrise = norm24(r.sunriseUTC - offMin / 60);
      var sunset = norm24(r.sunsetUTC - offMin / 60);
      var h = now.getHours() + now.getMinutes() / 60;
      var isDay = sunrise < sunset ? (h >= sunrise && h < sunset) : !(h >= sunset && h < sunrise);
      window.__preskerAuto = window.__preskerAuto || {};
      window.__preskerAuto.theme = { tz: tz, sunrise: sunrise, sunset: sunset, isDay: isDay };
      return isDay ? 'light' : 'dark';
    } catch (e) {
      return 'light';
    }
  }

  function getSaved() { try { return localStorage.getItem('presker-theme'); } catch (e) { return null; } }
  function setSaved(v) { try { localStorage.setItem('presker-theme', v); } catch (e) {} }
  function resolve(pref) { return pref === 'auto' ? computeAutoTheme() : pref; }

  function apply(pref) {
    var resolved = resolve(pref);
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.setAttribute('data-theme-pref', pref);
  }

  // Runs synchronously, before <body> is parsed: no flash of the wrong theme.
  apply(getSaved() || 'auto');

  window.PreskerTheme = {
    set: function (pref) { setSaved(pref); apply(pref); document.dispatchEvent(new CustomEvent('presker-theme-change')); },
    get: function () { return document.documentElement.getAttribute('data-theme-pref') || 'auto'; },
    getResolved: function () { return document.documentElement.getAttribute('data-theme'); },
    mountToggle: function () { wireToggle(); }
  };

  function wireToggle() {
    var group = document.querySelector('[data-theme-toggle]');
    if (!group || group.dataset.wired) return;
    group.dataset.wired = '1';
    function render() {
      var pref = window.PreskerTheme.get();
      var btns = group.querySelectorAll('[data-theme-set]');
      for (var i = 0; i < btns.length; i++) {
        var on = btns[i].getAttribute('data-theme-set') === pref;
        btns[i].classList.toggle('on', on);
        btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
      }
      var note = document.querySelector('[data-theme-note]');
      if (note) {
        var a = (window.__preskerAuto || {}).theme;
        var fmt = function (h) { var hh = Math.floor(h), mm = Math.round((h - hh) * 60); return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm; };
        note.textContent = (pref === 'auto' && a) ? ((a.isDay ? '☀ ' : '☾ ') + a.tz + ' · ' + fmt(a.sunrise) + '–' + fmt(a.sunset)) : '';
      }
    }
    var setBtns = group.querySelectorAll('[data-theme-set]');
    for (var i = 0; i < setBtns.length; i++) {
      setBtns[i].addEventListener('click', (function (btn) {
        return function () { window.PreskerTheme.set(btn.getAttribute('data-theme-set')); };
      })(setBtns[i]));
    }
    document.addEventListener('presker-theme-change', render);
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireToggle);
  } else {
    wireToggle();
  }
})();
