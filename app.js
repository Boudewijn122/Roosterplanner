(function () {
  'use strict';

  /* =========================================================
     Basis
     ========================================================= */
  var D = window.RP_DATA;
  var PEOPLE = D.people;
  var ADMIN = { id: 'ADMIN', name: 'Beheerder', group: 'Beheer', role: 'admin', note: '' };
  var DAYS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
  var DAYS_LONG = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
  var MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  var MONTHS_LONG = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  var HALVES = ['Ochtend', 'Middag'];
  var HALF_TIME = [['08:00', '12:30'], ['13:00', '17:00']];
  var TYPES = ['Vakantie', 'Congres', 'Congres organisatie', 'Cursus / onderwijs'];
  var GRID_START = 7, GRID_END = 18;

  function load(key, fallback) { try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } }
  function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* privé-modus */ } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- datums ---------- */
  function startOfDay(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function mondayOf(d) { var x = startOfDay(d); return addDays(x, -((x.getDay() + 6) % 7)); }
  function isoWeek(d) {
    var x = startOfDay(d); x.setDate(x.getDate() + 3 - ((x.getDay() + 6) % 7));
    var w1 = new Date(x.getFullYear(), 0, 4);
    return 1 + Math.round(((x - w1) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7);
  }
  function iso(d) { var m = d.getMonth() + 1, day = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day; }
  function parseIso(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function weekday(d) { return (d.getDay() + 6) % 7; }
  function short(d) { return DAYS[weekday(d)] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; }
  function longDate(d) { return DAYS_LONG[weekday(d)] + ' ' + d.getDate() + ' ' + MONTHS_LONG[d.getMonth()]; }
  function parityOf(d) { return isoWeek(d) % 2 === 0 ? 'e' : 'o'; }
  function toMin(t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; }
  function fromMin(m) { var h = Math.floor(m / 60), mm = m % 60; return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm; }

  /* ---------- codes, soorten, locaties ---------- */
  function codeOf(t) {
    var s = (t || '').toLowerCase().trim();
    if (!s) return '';
    if (/visite/.test(s)) return 'VS';
    if (/spoedpieper/.test(s)) return 'SPT';
    if (s.indexOf('fk') >= 0) { if (/pok/.test(s)) return 'FKPO'; if (/fkm|manag/.test(s)) return 'FKM'; if (/(^|[^a-z])ok/.test(s)) return 'FKOK'; if (/su/.test(s)) return 'FKSU'; return 'FK'; }
    if (/sneek/.test(s)) return 'Snk';
    if (/(^|[^a-z])ns([^a-z]|$)/.test(s)) { if (/pok/.test(s)) return 'PON'; if (/ok/.test(s)) return 'OKN'; return 'NS'; }
    if (/(^|[^a-z])hh/.test(s) && /(^|[^a-z])ok/.test(s)) return 'OKH';
    if (/diep|nes|manag/.test(s)) return '';
    if (/poli ?pok|polipok/.test(s)) return 'PPK';
    if (/pok ?2/.test(s)) return 'POK2';
    if (/pok/.test(s)) return 'POK';
    if (/combi/.test(s)) return 'COK';
    if (/ok ?10/.test(s)) return 'OK10';
    if (/(^|[^a-z])ok/.test(s)) return 'OK3';
    if (/su ?2/.test(s)) return 'LSU2';
    if (/su ?3/.test(s)) return 'LSU3';
    if (/(^|[^a-z])su/.test(s)) return 'LSU1';
    return '';
  }
  function typeOf(t) {
    if (!t) return 'LE';
    var c = codeOf(t);
    if (c === 'VS' || c === 'SPT') return 'VS';
    if (/^FK|^Snk/.test(c)) return 'FK';
    if (/^(POK|POK2|PON|PPK)$/.test(c)) return 'POK';
    if (/^(OK3|OK10|COK|OKN|OKH)$/.test(c)) return 'OK';
    if (/^LSU/.test(c) || c === 'NS') return 'SU';
    return 'OV';
  }
  function locOf(t) {
    var s = (t || '').toLowerCase();
    if (!s) return null;
    if (s.indexOf('fk') >= 0) return 'FK';
    if (s.indexOf('manag') >= 0) return null;
    if (s.indexOf('sneek') >= 0) return 'Sneek';
    if (/(^|[^a-z])ns([^a-z]|$)/.test(s)) return 'Drachten';
    if (/diep|hh|nes/.test(s)) return 'Elders';
    if (s.indexOf('pok') >= 0) return 'MCL POK';
    if (s.indexOf('ok') >= 0) return 'MCL OK';
    if (/(^|[^a-z])s?su/.test(s)) return 'MCL SU';
    return null;
  }
  var LOC_NAMES = { 'MCL OK': 'OK MCL', 'MCL POK': 'POK MCL', 'MCL SU': 'Spreekuur MCL', 'Drachten': 'Drachten (NS)', 'FK': 'Friesland Kliniek', 'Sneek': 'Sneek', 'Elders': 'Elders', 'Totaal': 'Totaal ingezet' };
  var PLACE = { 'MCL OK': 'OK, MCL Leeuwarden', 'MCL POK': 'Poliklinische OK, MCL', 'MCL SU': 'Polikliniek MCL', 'Drachten': 'Nij Smellinghe, Drachten', 'FK': 'Friesland Kliniek', 'Sneek': 'Sneek', 'Elders': 'Externe locatie' };
  var CHECKS = ['MCL OK', 'MCL POK', 'MCL SU', 'Drachten', 'FK', 'Sneek', 'Totaal'];

  /* ---------- ingrepen (voorbeeld, zonder patiëntgegevens) ---------- */
  var POOL = {
    mamma: [['Mammareductie', 120], ['Borstreconstructie (DIEP-lap)', 240], ['Mamma-augmentatie', 90], ['Tepelreconstructie', 45]],
    hand: [['Carpaletunnel-release', 30], ['Dupuytren fasciëctomie', 90], ['Peesreconstructie hand', 90], ['Triggerfinger-release', 20]],
    ok: [['Abdominoplastiek', 150], ['Littekencorrectie', 60], ['Huidtumor-excisie met lap', 75], ['Ooglidcorrectie', 60], ['Liposuctie', 90], ['Mammareductie', 120], ['Dupuytren fasciëctomie', 90], ['Huidtransplantaat', 60]],
    pok: [['Excisie huidafwijking', 20], ['Carpaletunnel-release', 30], ['Triggerfinger-release', 20], ['Ganglion-excisie', 30], ['Naevus-excisie', 20], ['Kleine littekencorrectie', 30], ['Lipoom-excisie', 30]]
  };
  function seeded(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return function () { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }
  function genProcs(text, key, half) {
    var t = typeOf(text), c = codeOf(text), s = (text || '').toLowerCase();
    var isOk = t === 'OK' || c === 'FKOK', isPok = t === 'POK' || c === 'FKPO';
    if (!isOk && !isPok) return [];
    var pool = /mamma/.test(s) ? POOL.mamma : /hand|pols/.test(s) ? POOL.hand : isPok ? POOL.pok : POOL.ok;
    var rnd = seeded(key), m = toMin(HALF_TIME[half][0]) + (isOk ? 15 : 0), end = toMin(HALF_TIME[half][1]), out = [], guard = 0;
    pool = pool.slice();
    while (guard++ < 12 && pool.length) {
      var p = pool.splice(Math.floor(rnd() * pool.length), 1)[0];
      if (m + p[1] > end) { if (out.length) break; continue; }
      out.push({ time: fromMin(m), name: p[0], dur: p[1] });
      m += p[1] + (isOk ? 20 : 10);
    }
    return out;
  }

  /* =========================================================
     Opslag
     ========================================================= */
  var prefs = load('rp.prefs', {});
  if (!prefs.theme) prefs.theme = 'auto';
  if (!prefs.font) prefs.font = 'systeem';
  if (!prefs.scale) prefs.scale = 1;
  if (!prefs.adminPin) prefs.adminPin = '1234';
  var overrides = load('rp.overrides', { blocks: {}, procs: {} });
  var notes = load('rp.notes', []);
  var rights = load('rp.rights', {});
  PEOPLE.forEach(function (p) { if (!rights[p.id]) rights[p.id] = { role: p.role, canShare: p.role !== 'aios' }; });
  var requests = load('rp.requests', null);
  if (!requests) {
    var nm = addDays(mondayOf(new Date()), 7);
    requests = [{ id: 'seed1', person: 'C', by: 'C', type: 'Congres', from: iso(addDays(nm, 2)), fromPart: 'dag', to: iso(addDays(nm, 3)), toPart: 'dag', note: 'Voorbeeldaanvraag', status: 'pending', created: Date.now() }];
  }
  function persist() { save('rp.prefs', prefs); save('rp.overrides', overrides); save('rp.notes', notes); save('rp.rights', rights); save('rp.requests', requests); }
  persist();

  /* =========================================================
     Mensen en rechten
     ========================================================= */
  function person(id) { if (id === 'ADMIN') return ADMIN; for (var i = 0; i < PEOPLE.length; i++) if (PEOPLE[i].id === id) return PEOPLE[i]; return null; }
  function isAdmin() { return state.user === 'ADMIN'; }
  function roleOf(id) { return id === 'ADMIN' ? 'admin' : (rights[id] ? rights[id].role : 'specialist'); }
  function canApprove() { return isAdmin() || roleOf(state.user) === 'beheer'; }
  function canShare() { return isAdmin() || (rights[state.user] && rights[state.user].canShare); }
  function canActFor(pid) { return pid === state.user || canApprove(); }
  function roleLabel(id) { return { admin: 'beheerder (alles)', beheer: 'planner', specialist: 'specialist', aios: 'AIOS / ANIOS' }[roleOf(id)]; }

  /* =========================================================
     Rooster
     ========================================================= */
  function keyOf(pid, dIso, half) { return pid + '|' + dIso + '|' + half; }
  function covers(r, dIso, half) {
    if (dIso < r.from || dIso > r.to) return false;
    if (dIso === r.from && r.fromPart === 'middag' && half === 0) return false;
    if (dIso === r.to && r.toPart === 'ochtend' && half === 1) return false;
    return true;
  }
  function absenceFor(pid, dIso, half, extra) {
    var found = null;
    requests.concat(extra ? [extra] : []).forEach(function (r) {
      if (r.person !== pid || r.status === 'declined' || !covers(r, dIso, half)) return;
      if (r.status === 'approved' || r === extra) found = r; else if (!found) found = r;
    });
    return found;
  }
  function slot(p, date, half, extra) {
    var wd = weekday(date), dIso = iso(date), key = keyOf(p.id, dIso, half);
    if (wd > 4) return { text: '', absent: null, pending: null, key: key, edited: false };
    var base = p[parityOf(date)][wd * 2 + half] || '';
    var text = Object.prototype.hasOwnProperty.call(overrides.blocks, key) ? overrides.blocks[key] : base;
    var a = absenceFor(p.id, dIso, half, extra);
    var absent = a && (a.status === 'approved' || a === extra) ? a : null;
    return { text: text, base: base, absent: absent, pending: absent ? null : a, key: key, edited: text !== base };
  }
  function procsFor(s, half) {
    if (overrides.procs[s.key]) return overrides.procs[s.key];
    return genProcs(s.text, s.key, half);
  }
  function visibleNotes(key) {
    return notes.filter(function (n) { return n.key === key && (n.shared || n.author === state.user || isAdmin()); });
  }
  function notesOnDay(pid, dIso) { return visibleNotes(keyOf(pid, dIso, 0)).length + visibleNotes(keyOf(pid, dIso, 1)).length; }
  function countsFor(date, half, extra) {
    var c = {};
    PEOPLE.forEach(function (p) {
      var s = slot(p, date, half, extra);
      if (s.absent) return;
      var l = locOf(s.text);
      if (!l) return;
      c[l] = (c[l] || 0) + 1;
      if (l !== 'Elders') c.Totaal = (c.Totaal || 0) + 1;
    });
    return c;
  }
  function needFor(date, half, k) { return D.req[parityOf(date)][k][weekday(date) * 2 + half] || 0; }
  function impactOf(r) {
    var out = [], d = parseIso(r.from), end = parseIso(r.to), guard = 0;
    while (d <= end && guard++ < 62) {
      if (weekday(d) < 5) for (var h = 0; h < 2; h++) {
        if (!covers(r, iso(d), h)) continue;
        var b = countsFor(d, h, null), a = countsFor(d, h, r);
        CHECKS.forEach(function (k) { var n = needFor(d, h, k); if ((b[k] || 0) >= n && (a[k] || 0) < n) out.push(short(d) + ' ' + HALVES[h].toLowerCase() + ': ' + LOC_NAMES[k] + ' ' + (a[k] || 0) + ' van ' + n); });
      }
      d = addDays(d, 1);
    }
    return out;
  }
  function daysIn(r) {
    var n = 0, d = parseIso(r.from), end = parseIso(r.to), g = 0;
    while (d <= end && g++ < 400) { if (weekday(d) < 5) n += (covers(r, iso(d), 0) ? 0.5 : 0) + (covers(r, iso(d), 1) ? 0.5 : 0); d = addDays(d, 1); }
    return String(n).replace('.', ',');
  }

  /* =========================================================
     Toestand
     ========================================================= */
  var state = {
    user: load('rp.user', null),
    tab: load('rp.tab', 'agenda'),
    view: load('rp.view', 'maand'),
    cursor: startOfDay(new Date()),
    viewPid: null,
    onlyLow: true
  };
  if (state.tab === 'rooster') state.tab = 'agenda';
  var main = document.getElementById('main');

  function viewPerson() {
    var id = state.viewPid || (isAdmin() ? PEOPLE[0].id : state.user);
    return person(id) || PEOPLE[0];
  }

  /* =========================================================
     Weergave-instellingen
     ========================================================= */
  function applyPrefs() {
    var dark = prefs.theme === 'dark' || (prefs.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-font', prefs.font);
    document.documentElement.style.setProperty('--scale', prefs.scale);
    var mt = document.querySelectorAll('meta[name="theme-color"]');
    mt.forEach(function (m) { m.setAttribute('content', dark ? '#000000' : '#F2F2F7'); });
  }
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { if (prefs.theme === 'auto') applyPrefs(); });

  /* =========================================================
     Melding, blad (sheet), contextmenu
     ========================================================= */
  var toastTimer;
  function toast(msg) {
    var t = document.getElementById('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }

  var sheet = document.getElementById('sheet'), sheetInner = document.getElementById('sheet-inner');
  function openSheet(title, html, bind, opts) {
    sheetInner.innerHTML = '<div class="grabber" aria-hidden="true"></div><div class="sheet-top"><h2 id="sheet-title">' + esc(title) + '</h2>' +
      (opts && opts.noClose ? '' : '<button type="button" class="text-btn" data-close>Klaar</button>') + '</div>' + html;
    var c = sheetInner.querySelector('[data-close]'); if (c) c.addEventListener('click', closeSheet);
    if (bind) bind(sheetInner);
    if (!sheet.open) { if (typeof sheet.showModal === 'function') sheet.showModal(); else sheet.setAttribute('open', ''); }
  }
  function closeSheet() { if (sheet.open) sheet.close(); }
  sheet.addEventListener('click', function (e) { if (e.target === sheet && state.user) closeSheet(); });
  sheet.addEventListener('cancel', function (e) { if (!state.user) e.preventDefault(); });

  var menu = document.getElementById('menu');
  function openMenu(x, y, title, items) {
    menu.innerHTML = (title ? '<div class="mh">' + esc(title) + '</div>' : '') + items.map(function (it, i) {
      return '<button type="button" role="menuitem" data-i="' + i + '"' + (it.red ? ' class="red"' : '') + '>' + esc(it.label) + '</button>';
    }).join('');
    menu.hidden = false; menu.openedAt = Date.now();
    var w = menu.offsetWidth, h = menu.offsetHeight;
    menu.style.left = Math.max(12, Math.min(x, window.innerWidth - w - 12)) + 'px';
    menu.style.top = Math.max(12, Math.min(y, window.innerHeight - h - 12)) + 'px';
    menu.querySelectorAll('[data-i]').forEach(function (b) {
      b.addEventListener('click', function () { var it = items[+b.getAttribute('data-i')]; closeMenu(); it.run(); });
    });
    var first = menu.querySelector('button'); if (first) first.focus({ preventScroll: true });
  }
  function closeMenu() { menu.hidden = true; }
  document.addEventListener('pointerdown', function (e) { if (!menu.hidden && !menu.contains(e.target)) closeMenu(); }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('scroll', function () { if (Date.now() - (menu.openedAt || 0) > 400) closeMenu(); }, { passive: true });

  /* Lang drukken (telefoon) en rechtermuisknop (computer) */
  var press = null, suppressClick = false;
  main.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse') return;
    var el = e.target.closest('[data-key],[data-date]');
    if (!el) return;
    var x = e.clientX, y = e.clientY;
    press = { el: el, x: x, y: y, t: setTimeout(function () { suppressClick = true; if (navigator.vibrate) navigator.vibrate(10); contextFor(el, x, y); press = null; }, 520) };
  });
  main.addEventListener('pointermove', function (e) { if (press && (Math.abs(e.clientX - press.x) > 10 || Math.abs(e.clientY - press.y) > 10)) { clearTimeout(press.t); press = null; } });
  ['pointerup', 'pointercancel'].forEach(function (ev) { main.addEventListener(ev, function () { if (press) { clearTimeout(press.t); press = null; } }); });
  main.addEventListener('click', function (e) { if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; } }, true);
  main.addEventListener('contextmenu', function (e) {
    var el = e.target.closest('[data-key],[data-date]');
    if (!el) return;
    e.preventDefault();
    var x = e.clientX, y = e.clientY;
    if (!x && !y) { var r = el.getBoundingClientRect(); x = r.left + 12; y = r.bottom; }
    contextFor(el, x, y);
  });

  function contextFor(el, x, y) {
    var items = [];
    if (el.hasAttribute('data-key')) {
      var k = el.getAttribute('data-key').split('|'), pid = k[0], dIso = k[1], half = +k[2], p = person(pid), d = parseIso(dIso);
      if (canActFor(pid)) {
        items.push({ label: 'Ziek melden – dit dagdeel', red: true, run: function () { reportSick(pid, dIso, half); } });
        items.push({ label: 'Ziek melden – hele dag', red: true, run: function () { reportSick(pid, dIso, null); } });
        items.push({ label: 'Vrij vragen…', run: function () { openRequest(pid, dIso, half === 1 ? 'middag' : 'dag'); } });
      }
      items.push({ label: 'Notitie toevoegen…', run: function () { openNotes(pid, dIso, half, true); } });
      items.push({ label: 'Details en ingrepen', run: function () { openBlock(pid, dIso, half); } });
      if (isAdmin()) items.push({ label: 'Blok wijzigen…', run: function () { openBlock(pid, dIso, half, true); } });
      openMenu(x, y, p.name + ' · ' + short(d) + ' ' + HALVES[half].toLowerCase(), items);
    } else {
      var di = el.getAttribute('data-date'), dd = parseIso(di), vp = viewPerson();
      if (canActFor(vp.id)) {
        items.push({ label: 'Ziek melden – hele dag', red: true, run: function () { reportSick(vp.id, di, null); } });
        items.push({ label: 'Vrij vragen vanaf deze dag…', run: function () { openRequest(vp.id, di, 'dag'); } });
      }
      if (weekday(dd) < 5) {
        items.push({ label: 'Notitie ochtend…', run: function () { openNotes(vp.id, di, 0, true); } });
        items.push({ label: 'Notitie middag…', run: function () { openNotes(vp.id, di, 1, true); } });
      }
      items.push({ label: 'Open deze dag', run: function () { state.cursor = dd; state.view = 'dag'; save('rp.view', 'dag'); render(); } });
      openMenu(x, y, vp.name + ' · ' + longDate(dd), items);
    }
  }

  /* =========================================================
     Acties
     ========================================================= */
  function reportSick(pid, dIso, half) {
    var p = person(pid), d = parseIso(dIso);
    var r = { id: 's' + Date.now(), person: pid, by: state.user, type: 'Ziek', from: dIso, fromPart: half === 1 ? 'middag' : 'dag', to: dIso, toPart: half === 0 ? 'ochtend' : 'dag', note: '', status: 'approved', created: Date.now() };
    requests.push(r); persist(); render();
    toast((pid === state.user ? 'Je bent' : p.name + ' is') + ' ziek gemeld voor ' + short(d) + (half == null ? '' : ' ' + HALVES[half].toLowerCase()));
  }

  /* Vakantie: minimaal 12 weken van tevoren; alleen planner of beheerder keurt goed */
  var VAK_WEEKS = 12;
  function earliestVacation() { return addDays(startOfDay(new Date()), VAK_WEEKS * 7); }
  function leadDays(r) { return Math.round((parseIso(r.from) - startOfDay(new Date(r.created || Date.now()))) / 86400000); }
  function tooLate(r) { return r.type === 'Vakantie' && leadDays(r) < VAK_WEEKS * 7; }
  function statusFor(r) {
    if (isAdmin()) return 'approved';
    if (canApprove() && r.person !== state.user) return 'approved';
    return 'pending';
  }

  function openRequest(pid, fromIso, fromPart) {
    var who = canApprove() ? (pid || state.user) : state.user;
    if (who === 'ADMIN') who = viewPerson().id;
    var kind = 'Vakantie';
    var pplOpts = canApprove() ? '<label class="f">Voor wie<select id="rq-person">' + PEOPLE.map(function (p) { return '<option value="' + p.id + '"' + (p.id === who ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') + '</select></label>' : '';
    var html = pplOpts +
      '<div class="opts" role="group" aria-label="Soort">' + TYPES.map(function (k) { return '<button type="button" data-kind="' + esc(k) + '" aria-pressed="' + (k === kind) + '">' + esc(k) + '</button>'; }).join('') + '</div>' +
      '<p class="note" id="rq-rule"></p>' +
      '<div class="grid2"><label class="f">Van<input type="date" id="rq-from" value="' + fromIso + '"></label>' +
      '<label class="f">Vanaf<select id="rq-fromPart"><option value="dag">Hele dag</option><option value="middag"' + (fromPart === 'middag' ? ' selected' : '') + '>Middag</option></select></label>' +
      '<label class="f">Tot en met<input type="date" id="rq-to" value="' + fromIso + '"></label>' +
      '<label class="f">Tot en met<select id="rq-toPart"><option value="dag">Hele dag</option><option value="ochtend">Ochtend</option></select></label></div>' +
      '<label class="f">Toelichting<textarea id="rq-note" rows="2" maxlength="200" placeholder="Bijv. naam van het congres"></textarea></label>' +
      '<p class="impact" id="rq-late" hidden></p>' +
      '<p class="impact ok" id="rq-impact"></p>' +
      '<button type="button" class="btn" id="rq-send">Aanvraag indienen</button>';
    openSheet('Vrij vragen', html, function (root) {
      function current() {
        var from = root.querySelector('#rq-from').value, to = root.querySelector('#rq-to').value;
        if (to < from) { var t = from; from = to; to = t; }
        var sel = root.querySelector('#rq-person');
        return { id: 'r' + Date.now(), person: sel ? sel.value : who, by: state.user, type: kind, from: from, fromPart: root.querySelector('#rq-fromPart').value, to: to, toPart: root.querySelector('#rq-toPart').value, note: root.querySelector('#rq-note').value.trim().slice(0, 200), status: 'pending', created: Date.now() };
      }
      function preview() {
        var r = current(), send = root.querySelector('#rq-send'), late = root.querySelector('#rq-late'), rule = root.querySelector('#rq-rule');
        var earliest = earliestVacation();
        rule.textContent = kind === 'Vakantie'
          ? 'Vakantie vraag je minimaal ' + VAK_WEEKS + ' weken van tevoren aan (vanaf ' + longDate(earliest) + '). Alleen de planner of beheerder keurt goed.'
          : 'Wordt goedgekeurd door de planner of beheerder.';
        if (!r.from || !r.to) { send.disabled = true; return; }
        var blocked = false;
        late.hidden = true;
        if (tooLate(r)) {
          late.hidden = false;
          if (canApprove()) {
            late.textContent = 'Let op: dit is binnen ' + VAK_WEEKS + ' weken. Alleen als uitzondering vastleggen.';
          } else {
            blocked = true;
            late.textContent = 'Te laat aangevraagd: vakantie kan op zijn vroegst vanaf ' + longDate(earliest) + '. Voor eerder: overleg met de planner.';
          }
        }
        var st = statusFor(r);
        send.disabled = blocked;
        send.style.opacity = blocked ? '.45' : '';
        send.textContent = st === 'approved' ? 'Vastleggen' : 'Aanvraag indienen';
        var imp = impactOf(r), el = root.querySelector('#rq-impact');
        el.className = 'impact' + (imp.length ? '' : ' ok');
        el.textContent = daysIn(r) + ' werkdag(en). ' + (imp.length ? 'Gevolg: ' + imp.join('; ') : 'Geen tekorten in de bezetting.');
      }
      root.querySelectorAll('[data-kind]').forEach(function (b) {
        b.addEventListener('click', function () { kind = b.getAttribute('data-kind'); root.querySelectorAll('[data-kind]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); preview(); });
      });
      root.querySelectorAll('input,select').forEach(function (i) { i.addEventListener('change', preview); i.addEventListener('input', preview); });
      preview();
      root.querySelector('#rq-send').addEventListener('click', function () {
        var r = current(); if (!r.from || !r.to) return;
        if (tooLate(r) && !canApprove()) { preview(); return; }
        r.status = statusFor(r);
        requests.push(r); persist(); closeSheet(); render();
        toast(r.status === 'approved' ? 'Vastgelegd in het rooster' : 'Aanvraag verstuurd naar de planner');
      });
    });
  }

  function notesHtml(key) {
    var list = visibleNotes(key);
    if (!list.length) return '<p class="empty">Nog geen notities.</p>';
    return '<div class="notes">' + list.map(function (n) {
      var a = person(n.author), mine = n.author === state.user || isAdmin();
      return '<div class="note-item' + (n.shared ? ' shared' : '') + '"><span>' + esc(n.text) + '</span><span class="by"><span>' + esc(a ? a.name : '?') + ' · ' + (n.shared ? 'voor iedereen' : 'alleen jij') + '</span>' +
        (mine ? '<span>' + (canShare() ? '<button type="button" class="mini-btn" data-share="' + n.id + '">' + (n.shared ? 'Maak privé' : 'Deel met iedereen') + '</button>' : '') + '<button type="button" class="mini-btn" data-del="' + n.id + '">Verwijder</button></span>' : '') + '</span></div>';
    }).join('') + '</div>';
  }
  function bindNotes(root, key, reopen) {
    root.querySelectorAll('[data-del]').forEach(function (b) { b.addEventListener('click', function () { notes = notes.filter(function (n) { return n.id !== b.getAttribute('data-del'); }); persist(); reopen(); render(); }); });
    root.querySelectorAll('[data-share]').forEach(function (b) { b.addEventListener('click', function () { notes.forEach(function (n) { if (n.id === b.getAttribute('data-share')) n.shared = !n.shared; }); persist(); reopen(); render(); }); });
    var add = root.querySelector('#nt-add');
    if (add) add.addEventListener('click', function () {
      var txt = root.querySelector('#nt-text').value.trim(); if (!txt) return;
      var sh = root.querySelector('#nt-shared');
      notes.push({ id: 'n' + Date.now(), key: key, author: state.user, text: txt.slice(0, 500), shared: !!(sh && sh.checked), ts: Date.now() });
      persist(); reopen(); render(); toast('Notitie opgeslagen');
    });
  }
  function noteForm() {
    return '<label class="f">Nieuwe notitie<textarea id="nt-text" rows="2" maxlength="500" placeholder="Bijv. materiaal klaarzetten, overleg met anesthesie"></textarea></label>' +
      (canShare() ? '<label class="toggle">Zichtbaar voor iedereen<input type="checkbox" id="nt-shared"></label>' : '<p class="note">Alleen jij ziet deze notitie. Notities delen kan met extra rechten.</p>') +
      '<button type="button" class="btn" id="nt-add">Notitie opslaan</button>';
  }
  function openNotes(pid, dIso, half, focus) {
    var key = keyOf(pid, dIso, half), p = person(pid), d = parseIso(dIso);
    function draw() {
      openSheet('Notities', '<p class="note">' + esc(p.name + ' · ' + longDate(d) + ' · ' + HALVES[half].toLowerCase()) + '</p>' + notesHtml(key) + noteForm(), function (root) {
        bindNotes(root, key, draw);
        if (focus) { var t = root.querySelector('#nt-text'); if (t) setTimeout(function () { t.focus(); }, 50); focus = false; }
      });
    }
    draw();
  }

  function openBlock(pid, dIso, half, editFirst) {
    var p = person(pid), d = parseIso(dIso);
    function draw() {
      var s = slot(p, d, half), t = s.absent ? 'AF' : typeOf(s.text), c = codeOf(s.text), procs = s.absent ? [] : procsFor(s, half);
      var loc = locOf(s.text), team = [];
      if (loc && !s.absent) PEOPLE.forEach(function (q) { if (q.id === pid) return; var o = slot(q, d, half); if (!o.absent && locOf(o.text) === loc) team.push(q.name); });
      var html = '<div class="event t-' + t + '" style="cursor:default"><div class="body"><div class="ttl">' + (c && !s.absent ? '<span class="code">' + esc(c) + '</span>' : '') + '<span class="t">' + esc(s.absent ? s.absent.type : (s.text || 'Niet ingeroosterd')) + '</span></div>' +
        '<div class="meta">' + esc(longDate(d) + ' · ' + HALF_TIME[half][0] + '–' + HALF_TIME[half][1]) + '</div></div></div>' +
        '<dl class="kv"><dt>Wie</dt><dd>' + esc(p.name) + '</dd><dt>Waar</dt><dd>' + esc(loc ? PLACE[loc] : '–') + '</dd>' +
        (team.length ? '<dt>Ook hier</dt><dd>' + esc(team.join(', ')) + '</dd>' : '') +
        (s.edited ? '<dt>Excel</dt><dd>' + esc(s.base || 'leeg') + ' <span class="pill">aangepast</span></dd>' : '') + '</dl>';
      if (procs.length) html += '<div class="card"><h3>Geplande ingrepen</h3><ul class="procs" style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.3rem">' +
        procs.map(function (x) { return '<li style="display:flex;gap:.6rem"><b style="font-variant-numeric:tabular-nums;min-width:3rem">' + esc(x.time) + '</b><span>' + esc(x.name) + (x.dur ? ' <span class="muted">· ' + x.dur + ' min</span>' : '') + '</span></li>'; }).join('') + '</ul><p class="note">Voorbeeldingrepen zonder patiëntgegevens.</p></div>';
      html += '<div class="card"><h3>Notities</h3>' + notesHtml(s.key) + noteForm() + '</div>';
      if (canActFor(pid)) html += '<div class="btn-row"><button type="button" class="btn danger" id="bk-sick">Ziek dit dagdeel</button><button type="button" class="btn secondary" id="bk-free">Vrij vragen</button></div>';
      if (isAdmin()) {
        html += '<div class="card" id="bk-edit"><h3>Beheer: blok wijzigen</h3>' +
          '<label class="f">Activiteit (zoals in de Excel)<input id="bk-text" value="' + esc(s.text) + '" placeholder="Bijv. OK 10, pok, su"></label>' +
          '<label class="f">Ingrepen (één per regel: tijd naam)<textarea id="bk-procs" rows="4">' + esc(procsFor(s, half).map(function (x) { return x.time + ' ' + x.name; }).join('\n')) + '</textarea></label>' +
          '<div class="btn-row"><button type="button" class="btn" id="bk-save">Opslaan</button><button type="button" class="btn secondary" id="bk-reset">Terug naar Excel</button></div></div>';
      }
      openSheet(HALVES[half] + ' · ' + short(d), html, function (root) {
        bindNotes(root, s.key, draw);
        var sick = root.querySelector('#bk-sick'); if (sick) sick.addEventListener('click', function () { closeSheet(); reportSick(pid, dIso, half); });
        var free = root.querySelector('#bk-free'); if (free) free.addEventListener('click', function () { openRequest(pid, dIso, half === 1 ? 'middag' : 'dag'); });
        var sv = root.querySelector('#bk-save');
        if (sv) sv.addEventListener('click', function () {
          var txt = root.querySelector('#bk-text').value.trim();
          if (txt === s.base) delete overrides.blocks[s.key]; else overrides.blocks[s.key] = txt;
          var lines = root.querySelector('#bk-procs').value.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
          overrides.procs[s.key] = lines.map(function (l) { var m = l.match(/^(\d{1,2}[:.]\d{2})\s+(.*)$/); return m ? { time: m[1].replace('.', ':'), name: m[2] } : { time: '', name: l }; });
          persist(); render(); draw(); toast('Blok bijgewerkt voor iedereen');
        });
        var rs = root.querySelector('#bk-reset');
        if (rs) rs.addEventListener('click', function () { delete overrides.blocks[s.key]; delete overrides.procs[s.key]; persist(); render(); draw(); toast('Terug naar het basisrooster'); });
        if (editFirst) { var e = root.querySelector('#bk-edit'); if (e) e.scrollIntoView({ block: 'start' }); editFirst = false; }
      });
    }
    draw();
  }

  /* =========================================================
     Agenda: maand, week, dag
     ========================================================= */
  var NOTE_SVG = '<svg class="note-ico" viewBox="0 0 24 24" aria-label="notitie"><path d="M4 4h12l4 4v12H4z"/><path d="M8 12h8M8 16h5"/></svg>';

  function eventCard(p, d, h, withProcs) {
    var s = slot(p, d, h);
    var t = s.absent ? 'AF' : typeOf(s.text), c = s.absent ? 'AFW' : codeOf(s.text);
    var procs = s.absent ? [] : procsFor(s, h), nc = visibleNotes(s.key).length;
    var meta = [];
    if (!s.absent && locOf(s.text)) meta.push(PLACE[locOf(s.text)]);
    if (procs.length && !withProcs) meta.push(procs.length + ' ingreep' + (procs.length > 1 ? 'en' : ''));
    if (s.edited) meta.push('aangepast');
    return '<button type="button" class="event t-' + t + '" data-key="' + s.key + '" aria-label="' + esc(HALVES[h] + ': ' + (s.absent ? s.absent.type : (s.text || 'niet ingeroosterd'))) + '">' +
      '<span class="time">' + HALF_TIME[h][0] + '<br>' + HALF_TIME[h][1] + '</span><span class="body"><span class="ttl">' + (c ? '<span class="code">' + esc(c) + '</span>' : '') +
      '<span class="t">' + esc(s.absent ? s.absent.type : (s.text || 'Niet ingeroosterd')) + '</span>' + (nc ? NOTE_SVG : '') + (s.pending ? '<span class="flag">' + esc(s.pending.type) + '?</span>' : '') + '</span>' +
      (meta.length ? '<span class="meta">' + esc(meta.join(' · ')) + '</span>' : '') +
      (withProcs && procs.length ? '<ul class="procs">' + procs.map(function (x) { return '<li><b>' + esc(x.time) + '</b><span>' + esc(x.name) + '</span></li>'; }).join('') + '</ul>' : '') +
      '</span></button>';
  }

  function dayList(p, d) {
    var today = iso(d) === iso(new Date());
    var html = '<h2 class="day-head' + (today ? ' today' : '') + '"><span>' + esc(longDate(d)) + '</span><span class="note">' + (today ? 'vandaag' : '') + '</span></h2>';
    if (weekday(d) > 4) return html + '<p class="empty">Weekend, geen basisrooster.</p>';
    return html + '<div class="list">' + eventCard(p, d, 0) + eventCard(p, d, 1) + '</div>';
  }

  function personPicker() {
    var vp = viewPerson();
    return '<label class="f">Rooster van<select id="pick-person">' + PEOPLE.map(function (q) { return '<option value="' + q.id + '"' + (q.id === vp.id ? ' selected' : '') + '>' + esc(q.name + (q.id === state.user ? ' (ik)' : '')) + '</option>'; }).join('') + '</select></label>';
  }
  function bindPicker() {
    var s = document.getElementById('pick-person');
    if (s) s.addEventListener('change', function () { state.viewPid = s.value; render(); });
  }

  function renderMonth() {
    var p = viewPerson(), cur = state.cursor, first = new Date(cur.getFullYear(), cur.getMonth(), 1), start = mondayOf(first);
    var todayIso = iso(new Date()), selIso = iso(cur);
    var html = personPicker() + '<div class="month"><div class="month-head">' + DAYS.map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div><div class="month-grid">';
    for (var i = 0; i < 42; i++) {
      var d = addDays(start, i);
      if (i >= 35 && d.getMonth() !== cur.getMonth()) break;
      var di = iso(d), wd = weekday(d), cls = 'mday' + (d.getMonth() !== cur.getMonth() ? ' out' : '') + (wd > 4 ? ' weekend' : '') + (di === todayIso ? ' today' : '') + (di === selIso ? ' sel' : '');
      var bars = '';
      if (wd < 5) for (var h = 0; h < 2; h++) {
        var s = slot(p, d, h);
        if (!s.text && !s.absent) { bars += '<span class="mbar" style="visibility:hidden">·</span>'; continue; }
        var t = s.absent ? 'AF' : typeOf(s.text), c = s.absent ? 'AFW' : (codeOf(s.text) || s.text.slice(0, 6));
        bars += '<span class="mbar t-' + t + '">' + esc(c) + (s.pending ? '?' : '') + '</span>';
      }
      var nc = notesOnDay(p.id, di);
      html += '<button type="button" class="' + cls + '" data-date="' + di + '" aria-label="' + esc(longDate(d)) + '"><span class="mnum">' + d.getDate() + '</span>' + bars + '<span class="mdots">' + (nc ? '<span class="dot note"></span>' : '') + '</span></button>';
    }
    html += '</div></div>' + dayList(p, cur) + '<p class="note">Tip: houd een dag of blok ingedrukt (of klik met de rechtermuisknop) om je ziek te melden, vrij te vragen of een notitie te maken.</p>';
    main.innerHTML = html;
    bindPicker();
    main.querySelectorAll('.mday').forEach(function (b) {
      b.addEventListener('click', function () { state.cursor = parseIso(b.getAttribute('data-date')); render(); });
      b.addEventListener('dblclick', function () { state.cursor = parseIso(b.getAttribute('data-date')); state.view = 'dag'; save('rp.view', 'dag'); render(); });
    });
    bindEvents();
  }

  function timeGrid(days, p, big) {
    var hourH = big ? 4.6 : 2.6, total = (GRID_END - GRID_START) * hourH;
    var cols = '3rem repeat(' + days.length + ', minmax(0, 1fr))';
    var todayIso = iso(new Date());
    var html = '<div class="tgrid"><div class="tg-head" style="grid-template-columns:' + cols + '"><span></span>' + days.map(function (d) {
      return '<button type="button" data-goto="' + iso(d) + '" class="' + (iso(d) === todayIso ? 'today' : '') + '"><span>' + DAYS[weekday(d)] + '</span><span class="n">' + d.getDate() + '</span></button>';
    }).join('') + '</div><div class="tg-body" style="grid-template-columns:' + cols + ';height:' + total + 'rem"><div class="tg-hours">';
    for (var hr = GRID_START + 1; hr < GRID_END; hr++) html += '<span class="tg-hour" style="top:' + ((hr - GRID_START) * hourH) + 'rem">' + hr + ':00</span>';
    html += '</div>';
    var now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
    days.forEach(function (d) {
      html += '<div class="tg-col">';
      for (var hr2 = GRID_START + 1; hr2 < GRID_END; hr2++) html += '<span class="tg-line" style="top:' + ((hr2 - GRID_START) * hourH) + 'rem"></span>';
      if (iso(d) === todayIso && nowMin > GRID_START * 60 && nowMin < GRID_END * 60) html += '<span class="tg-now" style="top:' + ((nowMin / 60 - GRID_START) * hourH) + 'rem"></span>';
      if (weekday(d) < 5) for (var h = 0; h < 2; h++) {
        var s = slot(p, d, h);
        if (!s.text && !s.absent) continue;
        var top = (toMin(HALF_TIME[h][0]) / 60 - GRID_START) * hourH, height = (toMin(HALF_TIME[h][1]) - toMin(HALF_TIME[h][0])) / 60 * hourH - 0.15;
        var t = s.absent ? 'AF' : typeOf(s.text), c = s.absent ? 'AFW' : codeOf(s.text), procs = s.absent ? [] : procsFor(s, h), nc = visibleNotes(s.key).length;
        html += '<button type="button" class="tg-ev t-' + t + (big ? ' big' : '') + '" data-key="' + s.key + '" style="top:' + top + 'rem;height:' + height + 'rem">' +
          '<span class="ttl">' + (c ? '<span class="code">' + esc(c) + '</span> ' : '') + esc(s.absent ? s.absent.type : s.text) + '</span>' +
          (big ? '<span class="sm">' + esc(HALF_TIME[h][0] + '–' + HALF_TIME[h][1] + (locOf(s.text) && !s.absent ? ' · ' + PLACE[locOf(s.text)] : '')) + (nc ? ' · ' + nc + ' notitie' + (nc > 1 ? 's' : '') : '') + '</span>' : (procs.length ? '<span class="sm">' + procs.length + ' ingr.</span>' : '') + (nc ? '<span class="sm">' + NOTE_SVG + '</span>' : '')) +
          (s.pending ? '<span class="sm">' + esc(s.pending.type) + '?</span>' : '') +
          (big && procs.length ? '<ul>' + procs.map(function (x) { return '<li><b>' + esc(x.time) + '</b>' + esc(x.name) + '</li>'; }).join('') + '</ul>' : '') + '</button>';
      }
      html += '</div>';
    });
    return html + '</div></div>';
  }

  function renderWeek() {
    var p = viewPerson(), mon = mondayOf(state.cursor), days = [];
    for (var i = 0; i < 5; i++) days.push(addDays(mon, i));
    main.innerHTML = personPicker() + timeGrid(days, p, false) + '<p class="note">' + (parityOf(mon) === 'e' ? 'Even' : 'Oneven') + ' week. Tik op een blok voor de ingrepen; houd ingedrukt of klik rechts voor meer opties.</p>';
    bindPicker(); bindEvents();
  }

  function renderDay() {
    var p = viewPerson(), d = state.cursor, mon = mondayOf(d), todayIso = iso(new Date());
    var strip = '<div class="chips" style="grid-template-columns:repeat(7,minmax(0,1fr))">';
    for (var i = 0; i < 7; i++) { var x = addDays(mon, i); strip += '<button type="button" class="daychip" data-goto="' + iso(x) + '" aria-pressed="' + (iso(x) === iso(d)) + '">' + DAYS[i] + '<small' + (iso(x) === todayIso ? ' style="color:var(--today);font-weight:700"' : '') + '>' + x.getDate() + '</small></button>'; }
    strip += '</div>';
    main.innerHTML = personPicker() + strip + (weekday(d) > 4 ? '<div class="card"><p class="empty">Weekend, geen basisrooster.</p></div>' : timeGrid([d], p, true));
    bindPicker(); bindEvents();
  }

  function bindEvents() {
    main.querySelectorAll('[data-key]').forEach(function (b) {
      b.addEventListener('click', function () { var k = b.getAttribute('data-key').split('|'); openBlock(k[0], k[1], +k[2]); });
    });
    main.querySelectorAll('[data-goto]').forEach(function (b) {
      b.addEventListener('click', function () { state.cursor = parseIso(b.getAttribute('data-goto')); state.view = 'dag'; save('rp.view', 'dag'); render(); });
    });
  }

  /* =========================================================
     Team, bezetting, afwezigheid, beheer
     ========================================================= */
  function renderTeam() {
    var mon = mondayOf(state.cursor), sel = Math.min(weekday(state.cursor), 4), day = addDays(mon, sel);
    var html = '<div class="chips">';
    for (var i = 0; i < 5; i++) { var d = addDays(mon, i); html += '<button type="button" class="daychip" data-day="' + iso(d) + '" aria-pressed="' + (i === sel) + '">' + DAYS[i] + '<small>' + d.getDate() + ' ' + MONTHS[d.getMonth()] + '</small></button>'; }
    html += '</div>';
    var order = ['MCL OK', 'MCL POK', 'MCL SU', 'Drachten', 'FK', 'Sneek', 'Elders'];
    for (var h = 0; h < 2; h++) {
      var groups = {}, away = [], other = [];
      PEOPLE.forEach(function (p) {
        var s = slot(p, day, h);
        if (s.absent) { away.push(p.name + ' (' + s.absent.type.toLowerCase() + ')'); return; }
        if (!s.text) return;
        var l = locOf(s.text);
        if (l) (groups[l] = groups[l] || []).push(p.name); else other.push(p.name + ' · ' + s.text);
      });
      html += '<section class="card"><h2>' + HALVES[h] + ' <span class="muted" style="font-weight:500;font-size:.85rem">' + HALF_TIME[h][0] + '–' + HALF_TIME[h][1] + '</span></h2>';
      order.forEach(function (o) { if (groups[o]) html += '<div class="grp"><b>' + LOC_NAMES[o] + '</b><span>' + esc(groups[o].join(', ')) + '</span></div>'; });
      if (other.length) html += '<div class="grp"><b>Overig</b><span>' + esc(other.join(', ')) + '</span></div>';
      if (away.length) html += '<div class="grp"><b>Afwezig</b><span>' + esc(away.join(', ')) + '</span></div>';
      html += '</section>';
    }
    main.innerHTML = html;
    main.querySelectorAll('[data-day]').forEach(function (b) { b.addEventListener('click', function () { state.cursor = parseIso(b.getAttribute('data-day')); render(); }); });
  }

  function renderBezetting() {
    var mon = mondayOf(state.cursor), totalLow = 0, body = '';
    for (var i = 0; i < 5; i++) {
      var d = addDays(mon, i);
      body += '<section class="card"><h2>' + esc(longDate(d)) + '</h2>';
      for (var h = 0; h < 2; h++) {
        var c = countsFor(d, h, null), items = '';
        CHECKS.forEach(function (k) {
          var need = needFor(d, h, k), have = c[k] || 0;
          if (!need && !have) return;
          var low = have < need; if (low) totalLow++;
          if (state.onlyLow && !low) return;
          items += '<span class="chk ' + (low ? 'low' : 'ok') + '">' + LOC_NAMES[k] + ' ' + have + '/' + need + '</span>';
        });
        body += '<div class="row"><span class="half">' + HALVES[h] + '</span><div class="checks">' + (items || '<span class="chk ok">Alles op orde</span>') + '</div></div>';
      }
      body += '</section>';
    }
    main.innerHTML = '<p class="note">' + (totalLow ? totalLow + ' tekorten deze week' : 'Geen tekorten deze week') + ', gemeten tegen de minimale bezetting uit de Excel. Alleen goedgekeurde afwezigheid telt mee.</p>' +
      '<label class="toggle card">Alleen tekorten tonen<input type="checkbox" id="only-low"' + (state.onlyLow ? ' checked' : '') + '></label>' + body;
    document.getElementById('only-low').addEventListener('change', function (e) { state.onlyLow = e.target.checked; renderBezetting(); });
  }

  function reqHtml(r, opts) {
    var p = person(r.person) || { name: '?' };
    var st = { pending: ['p', 'Aangevraagd'], approved: ['a', 'Goedgekeurd'], declined: ['d', 'Afgewezen'] }[r.status];
    var when = short(parseIso(r.from)) + (r.fromPart === 'middag' ? ' (middag)' : '') + (r.to !== r.from || r.toPart === 'ochtend' ? ' – ' + short(parseIso(r.to)) + (r.toPart === 'ochtend' ? ' (ochtend)' : '') : '');
    var html = '<div class="req' + (r.status === 'pending' ? ' pending' : '') + '"><div class="top-line"><b>' + esc(opts.showName ? p.name + ' · ' + r.type : r.type) + '</b><span class="status ' + st[0] + '">' + st[1] + '</span></div>' +
      '<span class="note">' + esc(when + ' · ' + daysIn(r) + ' werkdag(en)' + (r.note ? ' · ' + r.note : '')) + '</span>';
    if (tooLate(r)) html += '<span class="impact">Aangevraagd binnen ' + VAK_WEEKS + ' weken (' + Math.max(0, Math.floor(leadDays(r) / 7)) + ' weken van tevoren)</span>';
    if (opts.review) {
      var imp = impactOf(r);
      html += '<span class="impact' + (imp.length ? '' : ' ok') + '">' + esc(imp.length ? 'Gevolg: ' + imp.join('; ') : 'Geen tekorten door deze aanvraag') + '</span>' +
        '<div class="btn-row"><button type="button" class="btn" data-approve="' + r.id + '">Goedkeuren</button><button type="button" class="btn secondary" data-decline="' + r.id + '">Afwijzen</button></div>';
    }
    if (opts.mine && r.status !== 'declined' && r.to >= iso(new Date())) html += '<button type="button" class="mini-btn" style="align-self:flex-start" data-withdraw="' + r.id + '">Intrekken</button>';
    if (opts.admin) html += '<button type="button" class="mini-btn" style="align-self:flex-start" data-remove="' + r.id + '">Verwijderen</button>';
    return html + '</div>';
  }
  function bindReqButtons() {
    main.querySelectorAll('[data-approve],[data-decline],[data-withdraw],[data-remove]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-approve') || b.getAttribute('data-decline') || b.getAttribute('data-withdraw') || b.getAttribute('data-remove');
        if (b.hasAttribute('data-withdraw') || b.hasAttribute('data-remove')) requests = requests.filter(function (r) { return r.id !== id; });
        else requests.forEach(function (r) { if (r.id === id) r.status = b.hasAttribute('data-approve') ? 'approved' : 'declined'; });
        persist(); render();
      });
    });
  }

  function renderAfwezig() {
    var html = '';
    if (canApprove()) {
      var pend = requests.filter(function (r) { return r.status === 'pending' && r.person !== state.user; });
      html += '<section class="card"><h2>Te beoordelen</h2>' + (pend.length ? pend.map(function (r) { return reqHtml(r, { showName: true, review: true }); }).join('') : '<p class="empty">Geen open aanvragen.</p>') + '</section>';
    }
    if (!isAdmin()) {
      html += '<div class="btn-row"><button type="button" class="btn" id="new-req">Vrij vragen</button><button type="button" class="btn danger" id="sick-today">Ziek vandaag</button></div>';
      html += '<p class="note">Vakantie vraag je minimaal ' + VAK_WEEKS + ' weken van tevoren aan; eerst mogelijke dag nu: ' + longDate(earliestVacation()) + '. Aanvragen worden goedgekeurd door de planner of beheerder.</p>';
      var mine = requests.filter(function (r) { return r.person === state.user; }).sort(function (a, b) { return a.from < b.from ? 1 : -1; });
      html += '<section class="card"><h2>Mijn aanvragen</h2>' + (mine.length ? mine.map(function (r) { return reqHtml(r, { mine: true }); }).join('') : '<p class="empty">Nog geen aanvragen.</p>') + '</section>';
    }
    html += '<p class="note">Demo: alles wordt alleen op dit toestel bewaard. In de echte versie gaan aanvragen naar de planner en de Excel.</p>';
    main.innerHTML = html;
    bindReqButtons();
    var nr = document.getElementById('new-req'); if (nr) nr.addEventListener('click', function () { openRequest(state.user, iso(new Date()), 'dag'); });
    var st = document.getElementById('sick-today'); if (st) st.addEventListener('click', function () { if (window.confirm('Ziek melden voor vandaag?')) reportSick(state.user, iso(new Date()), null); });
  }

  function renderBeheer() {
    var pend = requests.filter(function (r) { return r.status === 'pending'; });
    var edited = Object.keys(overrides.blocks).concat(Object.keys(overrides.procs)).filter(function (k, i, a) { return a.indexOf(k) === i; });
    var shared = notes.filter(function (n) { return n.shared; });
    var html = '<section class="card"><h2>Openstaande aanvragen</h2>' + (pend.length ? pend.map(function (r) { return reqHtml(r, { showName: true, review: true }); }).join('') : '<p class="empty">Niets te beoordelen.</p>') + '</section>';
    html += '<section class="card"><h2>Mensen en rechten</h2><p class="note">Planners keuren aanvragen goed. "Notities delen" bepaalt wie notities voor iedereen zichtbaar mag maken.</p><div class="ppl">' + PEOPLE.map(function (p) {
      var r = rights[p.id];
      return '<div class="pp"><span class="nm">' + esc(p.name) + ' <span class="pill">' + esc(p.group) + '</span></span>' +
        '<select data-role="' + p.id + '" aria-label="Rol van ' + esc(p.name) + '"><option value="specialist"' + (r.role === 'specialist' ? ' selected' : '') + '>Specialist</option><option value="aios"' + (r.role === 'aios' ? ' selected' : '') + '>AIOS / ANIOS</option><option value="beheer"' + (r.role === 'beheer' ? ' selected' : '') + '>Planner</option></select>' +
        '<label><input type="checkbox" data-share-right="' + p.id + '"' + (r.canShare ? ' checked' : '') + '> Notities delen</label></div>';
    }).join('') + '</div></section>';
    html += '<section class="card"><h2>Aangepaste blokken</h2>' + (edited.length ? edited.map(function (k) {
      var a = k.split('|'), p = person(a[0]);
      return '<div class="req"><div class="top-line"><b>' + esc(p.name + ' · ' + short(parseIso(a[1])) + ' ' + HALVES[+a[2]].toLowerCase()) + '</b><button type="button" class="mini-btn" data-undo="' + esc(k) + '">Ongedaan maken</button></div>' +
        '<span class="note">' + esc((overrides.blocks[k] != null ? 'Activiteit: ' + (overrides.blocks[k] || 'leeg') : 'Activiteit ongewijzigd') + (overrides.procs[k] ? ' · ' + overrides.procs[k].length + ' ingrepen ingesteld' : '')) + '</span></div>';
    }).join('') : '<p class="empty">Nog niets aangepast. Open een blok in de agenda en kies "Blok wijzigen".</p>') + '</section>';
    html += '<section class="card"><h2>Gedeelde notities</h2>' + (shared.length ? '<div class="notes">' + shared.map(function (n) {
      var a = n.key.split('|'), p = person(a[0]), au = person(n.author);
      return '<div class="note-item shared"><span>' + esc(n.text) + '</span><span class="by"><span>' + esc((au ? au.name : '?') + ' → ' + p.name + ', ' + short(parseIso(a[1])) + ' ' + HALVES[+a[2]].toLowerCase()) + '</span><button type="button" class="mini-btn" data-del-note="' + n.id + '">Verwijder</button></span></div>';
    }).join('') + '</div>' : '<p class="empty">Geen gedeelde notities.</p>') + '</section>';
    html += '<section class="card"><h2>Beheerderscode</h2><p class="note">Demo: deze code houdt niemand echt tegen, want de broncode is openbaar. In de echte versie log je in met je ziekenhuisaccount.</p>' +
      '<div class="grid2"><label class="f">Nieuwe code<input id="pin-new" inputmode="numeric" maxlength="8" placeholder="••••"></label><button type="button" class="btn secondary" id="pin-save" style="align-self:end">Opslaan</button></div></section>';
    html += '<section class="card"><h2>Gegevens</h2><div class="btn-row"><button type="button" class="btn secondary" id="export">Wijzigingen exporteren</button><button type="button" class="btn danger" id="reset">Demo resetten</button></div><p class="note">Exporteren maakt een bestand met alle aanpassingen, aanvragen en notities, bijvoorbeeld om later in de Excel te verwerken.</p></section>';
    main.innerHTML = html;
    bindReqButtons();
    main.querySelectorAll('[data-role]').forEach(function (s) { s.addEventListener('change', function () { rights[s.getAttribute('data-role')].role = s.value; persist(); toast('Rol aangepast'); }); });
    main.querySelectorAll('[data-share-right]').forEach(function (c) { c.addEventListener('change', function () { rights[c.getAttribute('data-share-right')].canShare = c.checked; persist(); }); });
    main.querySelectorAll('[data-undo]').forEach(function (b) { b.addEventListener('click', function () { var k = b.getAttribute('data-undo'); delete overrides.blocks[k]; delete overrides.procs[k]; persist(); render(); }); });
    main.querySelectorAll('[data-del-note]').forEach(function (b) { b.addEventListener('click', function () { notes = notes.filter(function (n) { return n.id !== b.getAttribute('data-del-note'); }); persist(); render(); }); });
    document.getElementById('pin-save').addEventListener('click', function () { var v = document.getElementById('pin-new').value.trim(); if (v.length < 4) { toast('Kies minstens 4 tekens'); return; } prefs.adminPin = v; persist(); toast('Beheerderscode gewijzigd'); });
    document.getElementById('export').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify({ exported: new Date().toISOString(), overrides: overrides, requests: requests, notes: notes, rights: rights }, null, 2)], { type: 'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'roosterplanner-wijzigingen.json'; document.body.appendChild(a); a.click(); a.remove();
    });
    document.getElementById('reset').addEventListener('click', function () {
      if (!window.confirm('Alle aanvragen, notities en aanpassingen op dit toestel wissen?')) return;
      ['rp.overrides', 'rp.notes', 'rp.rights', 'rp.requests'].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
      location.reload();
    });
  }

  /* =========================================================
     Instellingen, inloggen
     ========================================================= */
  function openTextSettings() {
    var fonts = [['systeem', 'Systeem'], ['rond', 'Rond'], ['klassiek', 'Klassiek'], ['leesbaar', 'Extra leesbaar']];
    var themes = [['auto', 'Automatisch'], ['light', 'Licht'], ['dark', 'Donker']];
    var html = '<div class="card"><h3>Weergave</h3><div class="seg" role="group" aria-label="Thema">' + themes.map(function (t) { return '<button type="button" data-theme-opt="' + t[0] + '" aria-selected="' + (prefs.theme === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="card"><h3>Lettertype</h3><div class="opts">' + fonts.map(function (f) { return '<button type="button" data-font-opt="' + f[0] + '" aria-pressed="' + (prefs.font === f[0]) + '" style="font-family:' + ({ systeem: '-apple-system,sans-serif', rond: 'ui-rounded,\'SF Pro Rounded\',sans-serif', klassiek: 'ui-serif,Georgia,serif', leesbaar: 'Verdana,sans-serif' }[f[0]]) + '">' + f[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="card"><h3>Tekstgrootte</h3><div class="size-row"><span class="a1" aria-hidden="true">A</span><input type="range" id="size" min="0.85" max="1.4" step="0.05" value="' + prefs.scale + '" aria-label="Tekstgrootte"><span class="a2" aria-hidden="true">A</span></div><p class="note" id="size-val">' + Math.round(prefs.scale * 100) + '%</p></div>';
    openSheet('Tekst en weergave', html, function (root) {
      root.querySelectorAll('[data-theme-opt]').forEach(function (b) { b.addEventListener('click', function () { prefs.theme = b.getAttribute('data-theme-opt'); persist(); applyPrefs(); openTextSettings(); }); });
      root.querySelectorAll('[data-font-opt]').forEach(function (b) { b.addEventListener('click', function () { prefs.font = b.getAttribute('data-font-opt'); persist(); applyPrefs(); openTextSettings(); }); });
      root.querySelector('#size').addEventListener('input', function (e) { prefs.scale = +e.target.value; root.querySelector('#size-val').textContent = Math.round(prefs.scale * 100) + '%'; persist(); applyPrefs(); });
    });
  }

  function openWho() {
    var html = '<p class="note">Demo zonder echte inlog. In de echte versie log je in met je ziekenhuisaccount.</p><div class="who-list">' +
      '<button type="button" class="who admin" data-who="ADMIN" aria-current="' + (state.user === 'ADMIN') + '"><span class="ini">★</span><span>Beheerder<small>Alles aanpassen voor iedereen · code nodig</small></span></button>' +
      PEOPLE.map(function (p) { return '<button type="button" class="who" data-who="' + p.id + '" aria-current="' + (p.id === state.user) + '"><span class="ini">' + esc(p.id) + '</span><span>' + esc(p.name) + '<small>' + esc(p.group + ' · ' + roleLabel(p.id)) + '</small></span></button>'; }).join('') + '</div>' +
      '<div id="pin-box" hidden class="card"><label class="f">Beheerderscode (demo: 1234)<input id="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="8"></label><button type="button" class="btn" id="pin-ok">Inloggen als beheerder</button><p class="impact" id="pin-err"></p></div>';
    openSheet('Wie ben jij?', html, function (root) {
      root.querySelectorAll('[data-who]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-who');
          if (id === 'ADMIN') { root.querySelector('#pin-box').hidden = false; root.querySelector('#pin').focus(); return; }
          login(id);
        });
      });
      function tryPin() { if (root.querySelector('#pin').value === prefs.adminPin) login('ADMIN'); else root.querySelector('#pin-err').textContent = 'Onjuiste code'; }
      root.querySelector('#pin-ok').addEventListener('click', tryPin);
      root.querySelector('#pin').addEventListener('keydown', function (e) { if (e.key === 'Enter') tryPin(); });
    }, { noClose: !state.user });
  }
  function login(id) {
    state.user = id; state.viewPid = null; save('rp.user', id);
    if (id === 'ADMIN') state.tab = 'beheer'; else if (state.tab === 'beheer') state.tab = 'agenda';
    save('rp.tab', state.tab); closeSheet(); render();
    toast('Ingelogd als ' + person(id).name);
  }

  /* =========================================================
     Opbouw
     ========================================================= */
  var ICONS = {
    agenda: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>',
    team: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.8 0 4.5 2 4.5 5"/></svg>',
    bezetting: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    afwezig: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    beheer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>'
  };
  var LABELS = { agenda: 'Agenda', team: 'Team', bezetting: 'Bezetting', afwezig: 'Afwezig', beheer: 'Beheer' };

  function render() {
    applyPrefs();
    if (!state.user || !person(state.user)) { main.innerHTML = ''; openWho(); return; }
    var me = person(state.user);
    var tabs = ['agenda', 'team', 'bezetting', 'afwezig'];
    if (isAdmin()) tabs.push('beheer');
    if (tabs.indexOf(state.tab) < 0) state.tab = 'agenda';
    var pend = canApprove() ? requests.filter(function (r) { return r.status === 'pending' && r.person !== state.user; }).length : 0;
    document.getElementById('tabs').innerHTML = tabs.map(function (t) {
      var badge = (t === (isAdmin() ? 'beheer' : 'afwezig') && pend) ? '<span class="badge">' + pend + '</span>' : '';
      return '<button type="button" class="tab" data-tab="' + t + '"' + (t === state.tab ? ' aria-current="page"' : '') + '>' + ICONS[t] + '<span>' + LABELS[t] + '</span>' + badge + '</button>';
    }).join('');
    document.querySelectorAll('.tab').forEach(function (b) { b.addEventListener('click', function () { state.tab = b.getAttribute('data-tab'); save('rp.tab', state.tab); window.scrollTo(0, 0); render(); }); });

    document.getElementById('who-btn').textContent = isAdmin() ? '★' : me.id;
    var c = state.cursor, title = document.getElementById('big-title'), sub = document.getElementById('subtitle');
    var seg = document.getElementById('view-seg'), arrows = document.getElementById('nav-arrows');
    seg.hidden = state.tab !== 'agenda';
    arrows.hidden = !(state.tab === 'agenda' || state.tab === 'team' || state.tab === 'bezetting');
    seg.querySelectorAll('[data-view]').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-view') === state.view)); });
    if (state.tab === 'agenda') {
      if (state.view === 'maand') title.innerHTML = esc(MONTHS_LONG[c.getMonth()]) + ' <span class="year">' + c.getFullYear() + '</span>';
      else if (state.view === 'week') title.innerHTML = 'Week ' + isoWeek(c) + ' <span class="year">' + esc(MONTHS[mondayOf(c).getMonth()]) + '</span>';
      else title.innerHTML = esc(DAYS_LONG[weekday(c)]) + ' <span class="year">' + c.getDate() + ' ' + esc(MONTHS[c.getMonth()]) + '</span>';
    } else if (state.tab === 'team' || state.tab === 'bezetting') {
      title.innerHTML = esc(LABELS[state.tab]) + ' <span class="year">wk ' + isoWeek(c) + '</span>';
    } else title.textContent = LABELS[state.tab];
    sub.textContent = me.name + ' · ' + roleLabel(me.id) + (state.tab === 'agenda' ? ' · ' + (parityOf(c) === 'e' ? 'even' : 'oneven') + ' week' : '');

    if (state.tab === 'agenda') ({ maand: renderMonth, week: renderWeek, dag: renderDay })[state.view]();
    else ({ team: renderTeam, bezetting: renderBezetting, afwezig: renderAfwezig, beheer: renderBeheer })[state.tab]();
  }

  document.getElementById('view-seg').addEventListener('click', function (e) {
    var b = e.target.closest('[data-view]'); if (!b) return;
    state.view = b.getAttribute('data-view'); save('rp.view', state.view); render();
  });
  function step(dir) {
    var c = state.cursor;
    if (state.tab === 'agenda' && state.view === 'maand') state.cursor = new Date(c.getFullYear(), c.getMonth() + dir, 1);
    else if (state.tab === 'agenda' && state.view === 'dag') state.cursor = addDays(c, dir);
    else state.cursor = addDays(c, 7 * dir);
    render();
  }
  document.getElementById('prev-btn').addEventListener('click', function () { step(-1); });
  document.getElementById('next-btn').addEventListener('click', function () { step(1); });
  document.getElementById('today-btn').addEventListener('click', function () { state.cursor = startOfDay(new Date()); render(); });
  document.getElementById('who-btn').addEventListener('click', openWho);
  document.getElementById('text-btn').addEventListener('click', openTextSettings);
  document.getElementById('theme-btn').addEventListener('click', function () {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    prefs.theme = dark ? 'light' : 'dark'; persist(); applyPrefs(); toast(dark ? 'Lichte weergave' : 'Donkere weergave');
  });
  document.getElementById('add-btn').addEventListener('click', function () { openRequest(isAdmin() ? viewPerson().id : state.user, iso(state.cursor), 'dag'); });
  document.addEventListener('keydown', function (e) {
    if (sheet.open || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1); else if (e.key === 't') { state.cursor = startOfDay(new Date()); render(); }
  });

  var isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var standalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  if (isIos && !standalone && !load('rp.hintClosed', false)) document.getElementById('install-hint').hidden = false;
  document.getElementById('install-close').addEventListener('click', function () { document.getElementById('install-hint').hidden = true; save('rp.hintClosed', true); });
  if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });

  render();
})();
