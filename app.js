(function () {
  'use strict';

  /* =========================================================
     Basis
     ========================================================= */
  var D = window.RP_DATA;
  var PEOPLE = D.people;
  var ADMIN = { id: 'ADMIN', name: 'Beheerder', group: 'Beheer', role: 'admin', note: '' };
  var CONFIG = window.RP_CONFIG || {};
  var APP_VERSION = '9 · 25 nov 2026';
  PEOPLE.concat([ADMIN]).forEach(function (p) { p.baseName = p.name; });
  function usernameOf(id) { if (id === 'ADMIN') return 'beheerder'; var p = person(id); return p.baseName.toLowerCase().replace(/\s+/g, '-'); }
  function defaultPw(id) { return id === 'ADMIN' ? '1234' : 'welkom'; }
  var DAYS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
  var DAYS_LONG = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
  var MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  var MONTHS_LONG = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  var HALVES = ['Ochtend', 'Middag'];
  var HALF_TIME = [['08:00', '12:30'], ['13:00', '17:00']];
  var TYPES = ['Vakantie', 'Congres', 'Congres organisatie', 'Cursus / onderwijs'];
  var GRID_START = 7, GRID_END = 19;

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
    if (/manag/.test(s)) return 'MAN';
    if (/diep|nes/.test(s)) return '';
    if (/poli ?pok|polipok/.test(s)) return 'PPK';
    if (/pok ?2/.test(s)) return 'POK2';
    if (/pok/.test(s)) return 'POK';
    if (/combi/.test(s)) return 'COK';
    if (/ok ?10/.test(s)) return 'OK10';
    if (/(^|[^a-z])ok/.test(s)) return 'OK3';
    if (/su ?2/.test(s)) return 'LSU2';
    if (/su ?3/.test(s)) return 'LSU3';
    if (/(^|[^a-z])su/.test(s)) return 'LSU1';
    if (/^ao\b|(^|[^a-z])ao([^a-z]|$)/.test(s)) return 'AO';
    if (/wetenschap/.test(s)) return 'WTS';
    if (/opleiding|onderwijs/.test(s)) return 'OPL';
    if (/vergader|overleg/.test(s)) return 'VG';
    if (/(^|[^a-z])bt([^a-z]|$)/.test(s)) return 'BT';
    if (/mdo/.test(s)) return 'MDO';
    if (/tsh/.test(s)) return 'TSH';
    return '';
  }
  var CODE_NAMES = { AO: 'Ad en Org', WTS: 'Wetenschap', OPL: 'Opleiding', VG: 'Vergadering', BT: 'Baas Toezicht', MDO: 'MDO-overleg', TSH: 'TSH', MAN: 'Management', VS: 'Visite', SPT: 'Spoedtelefoon' };
  /* Toon een herkenbare naam als de Excel alleen een afkorting bevat (bijv. "AO" → "Ad en Org") */
  function titleOf(text) { var c = codeOf(text); return CODE_NAMES[c] && text.replace(/[^a-z]/gi, '').length <= 4 ? CODE_NAMES[c] : text; }
  /* Visite (08:00–08:30) gaat vooraf aan een ochtendspreekuur in het MCL; het spreekuur begint dan om 08:30 */
  function hasVisite(s, h) { return h === 0 && !!s.text && locOf(s.text) === 'MCL SU'; }
  function timesOf(s, h) { return hasVisite(s, h) ? ['08:30', '12:30'] : HALF_TIME[h]; }
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
  /* Gemiddeld aantal werkdagen per week volgens het basisrooster (even + oneven) */
  function rosterDays(p) {
    var tot = 0;
    ['e', 'o'].forEach(function (w) { for (var d = 0; d < 5; d++) if (p[w][d * 2] || p[w][d * 2 + 1]) tot += 1; });
    return Math.round(tot) / 2;
  }
  var prefs = load('rp.prefs', {});
  if (!prefs.theme) prefs.theme = 'auto';
  if (!prefs.font) prefs.font = 'systeem';
  if (!prefs.scale) prefs.scale = 1;
  if (!prefs.adminPin) prefs.adminPin = '1234';
  var overrides = load('rp.overrides', { blocks: {}, procs: {} });
  var notes = load('rp.notes', []);
  var rights = load('rp.rights', {});
  PEOPLE.forEach(function (p) {
    if (!rights[p.id]) rights[p.id] = { role: p.role, canShare: p.role !== 'aios' };
    var r0 = rights[p.id];
    if (r0.werkdagen == null) r0.werkdagen = rosterDays(p);
    if (r0.vakWeken == null) r0.vakWeken = 7;
    if (r0.conWeken == null) r0.conWeken = 2;
    if (r0.sabbatical == null) r0.sabbatical = 0;
    if (r0.vakAlD == null) r0.vakAlD = 0;
    if (r0.conAlD == null) r0.conAlD = 0;
    if (r0.fte == null) r0.fte = Math.round(r0.werkdagen / 5 * 100) / 100;
    if (r0.doetDienst == null) r0.doetDienst = p.group === 'Specialist';
    delete r0.vakRecht; delete r0.vakAl;
  });
  var gaps = load('rp.gaps', []);
  var profiles = load('rp.profiles', {});
  var notifs = load('rp.notifs', []);
  if (!prefs.colors) prefs.colors = {};
  if (!prefs.widgets) prefs.widgets = {};
  var pwStore = load('rp.pw', {});
  var feedback = load('rp.feedback', []);
  var appts = load('rp.appts', []);
  var duties = load('rp.duties', {});
  var noDuty = load('rp.nodienst', {});
  if (!load('rp.dienstSeeded', false)) { if (rights.B && rights.B.role === 'specialist') rights.B.role = 'dienst'; save('rp.dienstSeeded', true); }
  function applyNames() { PEOPLE.concat([ADMIN]).forEach(function (p) { var pr = profiles[p.id]; p.name = pr && pr.naam ? pr.naam : p.baseName; }); }
  applyNames();
  var requests = load('rp.requests', null);
  if (!requests) {
    var nm = addDays(mondayOf(new Date()), 7);
    requests = [{ id: 'seed1', person: 'C', by: 'C', type: 'Congres', from: iso(addDays(nm, 2)), fromPart: 'dag', to: iso(addDays(nm, 3)), toPart: 'dag', note: 'Voorbeeldaanvraag', status: 'pending', created: Date.now() }];
  }
  function persist() { save('rp.prefs', prefs); save('rp.overrides', overrides); save('rp.notes', notes); save('rp.rights', rights); save('rp.requests', requests); save('rp.gaps', gaps); save('rp.profiles', profiles); save('rp.notifs', notifs); save('rp.pw', pwStore); save('rp.feedback', feedback); save('rp.appts', appts); save('rp.duties', duties); save('rp.nodienst', noDuty); }
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
  function roleLabel(id) { return { admin: 'beheerder (alles)', beheer: 'planner', dienst: 'dienstplanner', specialist: 'specialist', aios: 'AIOS / ANIOS' }[roleOf(id)]; }
  function canPlanDuty() { return isAdmin() || roleOf(state.user) === 'dienst'; }
  function canSeeDutyAll() { return canPlanDuty() || canApprove(); }

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
    return [];
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
  function daysNum(r) {
    var n = 0, d = parseIso(r.from), end = parseIso(r.to), g = 0;
    while (d <= end && g++ < 400) { if (weekday(d) < 5) n += (covers(r, iso(d), 0) ? 0.5 : 0) + (covers(r, iso(d), 1) ? 0.5 : 0); d = addDays(d, 1); }
    return n;
  }
  function daysIn(r) { return String(daysNum(r)).replace('.', ','); }
  /* Saldo in dagen. Alleen dagdelen waarop iemand volgens het basisrooster werkt, tellen mee. */
  function workDaysOf(r) {
    var p = person(r.person), n = 0, d = parseIso(r.from), end = parseIso(r.to), g = 0;
    while (d <= end && g++ < 400) {
      var wd = weekday(d);
      if (wd < 5 && p && p[parityOf(d)]) for (var h = 0; h < 2; h++) if (covers(r, iso(d), h) && p[parityOf(d)][wd * 2 + h]) n += 0.5;
      d = addDays(d, 1);
    }
    return n;
  }
  function fmtD(n) { n = Math.round(n * 10) / 10; return String(n).replace('.', ',') + (Math.abs(n) === 1 ? ' dag' : ' dagen'); }
  function kindOf(type) { return type === 'Vakantie' ? 'vak' : (type === 'Congres' || type === 'Congres organisatie') ? 'con' : null; }
  function saldoOf(pid) {
    var rt = rights[pid] || {}, wd = rt.werkdagen || 0;
    var out = {
      vak: { recht: ((rt.vakWeken || 0) + (rt.sabbatical || 0)) * wd, op: rt.vakAlD || 0, aanv: 0 },
      con: { recht: (rt.conWeken || 0) * wd, op: rt.conAlD || 0, aanv: 0 }
    };
    requests.forEach(function (r) {
      var k = kindOf(r.type); if (r.person !== pid || !k) return;
      if (r.status === 'approved') out[k].op += workDaysOf(r); else if (r.status === 'pending') out[k].aanv += workDaysOf(r);
    });
    ['vak', 'con'].forEach(function (k) { out[k].saldo = out[k].recht - out[k].op; });
    return out;
  }
  function fmtN(n) { return String(Math.round(n * 10) / 10).replace('.', ','); }
  function saldoRow(label, s) {
    return '<div class="saldo-label">' + label + ' · in dagen</div><div class="saldo"><div><b>' + fmtN(s.recht) + '</b><span>Recht op</span></div><div><b>' + fmtN(s.op) + '</b><span>Opgenomen</span></div>' +
      '<div><b>' + fmtN(s.aanv) + '</b><span>Aangevraagd</span></div><div class="' + (s.saldo < 0 ? 'neg' : '') + '"><b>' + fmtN(s.saldo) + '</b><span>Over</span></div></div>';
  }
  function saldoHtml(pid) {
    var s = saldoOf(pid), rt = rights[pid] || {};
    return saldoRow('Vakantie', s.vak) + saldoRow('Congres', s.con) +
      '<p class="note" style="margin:0">' + String(rt.werkdagen).replace('.', ',') + ' werkdagen per week · ' + (rt.vakWeken || 0) + ' weken vakantie' + (rt.sabbatical ? ' + ' + rt.sabbatical + ' weken sabbatical' : '') + ' · ' + (rt.conWeken || 0) + ' weken congres</p>';
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
    document.documentElement.setAttribute('data-tone', prefs.tone || 'zacht');
    document.documentElement.setAttribute('data-font', prefs.font);
    document.documentElement.style.setProperty('--scale', prefs.scale);
    var rs = document.documentElement.style, c = (prefs.colors && prefs.colors[state.user]) || {};
    ['OK', 'POK', 'SU', 'FK', 'VS', 'OV', 'AF'].forEach(function (k) {
      if (c[k]) {
        rs.setProperty('--' + k + '-bar', c[k]);
        rs.setProperty('--' + k + '-bg', 'color-mix(in srgb, ' + c[k] + ' 20%, var(--surface))');
        rs.setProperty('--' + k + '-fg', 'color-mix(in srgb, ' + c[k] + ' 45%, var(--ink))');
        rs.setProperty('--' + k + '-on', lum(c[k]) > 0.45 ? '#000000' : '#FFFFFF');
      } else ['bar', 'bg', 'fg', 'on'].forEach(function (s) { rs.removeProperty('--' + k + '-' + s); });
    });
    if (c.tint) { rs.setProperty('--tint', c.tint); rs.setProperty('--on-tint', lum(c.tint) > 0.45 ? '#000000' : '#FFFFFF'); }
    else { rs.removeProperty('--tint'); rs.removeProperty('--on-tint'); }
    var mt = document.querySelectorAll('meta[name="theme-color"]');
    mt.forEach(function (m) { m.setAttribute('content', dark ? '#000000' : '#F2F2F7'); });
  }
  function lum(hex) {
    var h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map(function (x) { return x + x; }).join('');
    var v = [0, 2, 4].map(function (i) { var c = parseInt(h.substr(i, 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
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
    var el = e.target.closest('[data-abs],[data-key],[data-date],[data-appt],[data-col]');
    if (!el) return;
    var x = e.clientX, y = e.clientY;
    press = { el: el, x: x, y: y, t: setTimeout(function () { suppressClick = true; if (navigator.vibrate) navigator.vibrate(10); contextFor(el, x, y); press = null; }, 520) };
  });
  main.addEventListener('pointermove', function (e) { if (press && (Math.abs(e.clientX - press.x) > 10 || Math.abs(e.clientY - press.y) > 10)) { clearTimeout(press.t); press = null; } });
  ['pointerup', 'pointercancel'].forEach(function (ev) { main.addEventListener(ev, function () { if (press) { clearTimeout(press.t); press = null; } }); });
  main.addEventListener('click', function (e) { if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; } }, true);
  main.addEventListener('contextmenu', function (e) {
    var el = e.target.closest('[data-abs],[data-key],[data-date],[data-appt],[data-col]');
    if (!el) return;
    e.preventDefault();
    var x = e.clientX, y = e.clientY;
    if (!x && !y) { var r = el.getBoundingClientRect(); x = r.left + 12; y = r.bottom; }
    contextFor(el, x, y);
  });

  function timeAt(col, y) {
    var hh = +col.getAttribute('data-col').split('|')[2], remPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16, rect = col.getBoundingClientRect();
    var mins = GRID_START * 60 + Math.round(((y - rect.top) / (hh * remPx) * 60) / 15) * 15;
    return fromMin(Math.max(GRID_START * 60, Math.min(GRID_END * 60 - 15, mins)));
  }
  function contextFor(el, x, y) {
    var items = [];
    if (el.hasAttribute('data-appt')) { openAppt(null, null, null, el.getAttribute('data-appt')); return; }
    if (el.hasAttribute('data-col')) {
      var cc = el.getAttribute('data-col').split('|'), cpid = cc[0], cdi = cc[1];
      var tm = timeAt(el, y), mins = toMin(tm), part = mins < 13 * 60 ? 0 : (mins < 17 * 60 ? 1 : 2), cd = parseIso(cdi);
      items.push({ label: 'Afspraak om ' + tm + ' toevoegen…', run: function () { openAppt(cpid, cdi, part, null, tm); } });
      if (canApprove() && part < 2 && weekday(cd) < 5) items.push({ label: 'Inplannen (' + HALVES[part].toLowerCase() + ')…', run: function () { openPlan([cpid], cdi, part); } });
      if (canActFor(cpid)) {
        items.push({ label: 'Vrij vragen…', run: function () { openRequest(cpid, cdi, part === 1 ? 'middag' : 'dag'); } });
        if (part < 2) items.push({ label: 'Ziek melden – ' + HALVES[part].toLowerCase(), red: true, run: function () { reportSick(cpid, cdi, part); } });
      }
      if (cpid === state.user && dutyPeople().some(function (p) { return p.id === cpid; })) items.push({ label: isNoDuty(cpid, cdi) ? 'Toch beschikbaar voor dienst' : 'Geen dienst op deze dag', run: function () { toggleNoDuty(cpid, cdi); render(); toast('Opgeslagen voor de dienstplanner'); } });
      openMenu(x, y, person(cpid).name + ' · ' + short(cd) + ' ' + tm, items);
      return;
    }
    if (el.hasAttribute('data-abs')) {
      var r = reqById(el.getAttribute('data-abs')); if (!r) return;
      if (canApprove() && r.status === 'pending' && r.person !== state.user) {
        items.push({ label: 'Goedkeuren', run: function () { decideRequest(r.id, 'approve'); } });
        items.push({ label: 'Afwijzen', red: true, run: function () { decideRequest(r.id, 'decline'); } });
      }
      if (r.person === state.user || canApprove()) items.push({ label: r.type === 'Ziek' ? 'Ziekmelding verwijderen' : (r.status === 'pending' ? 'Aanvraag intrekken' : 'Verwijderen'), red: true, run: function () { decideRequest(r.id, 'remove'); } });
      items.push({ label: 'Details', run: function () { openAbsence(r.id); } });
      openMenu(x, y, person(r.person).name + ' · ' + r.type + ' (' + (r.status === 'approved' ? 'goedgekeurd' : 'aangevraagd') + ')', items);
      return;
    }
    if (el.hasAttribute('data-key')) {
      var k = el.getAttribute('data-key').split('|'), pid = k[0], dIso = k[1], half = +k[2], p = person(pid), d = parseIso(dIso);
      if (canActFor(pid)) {
        items.push({ label: 'Ziek melden – dit dagdeel', red: true, run: function () { reportSick(pid, dIso, half); } });
        items.push({ label: 'Ziek melden – hele dag', red: true, run: function () { reportSick(pid, dIso, null); } });
        items.push({ label: 'Vrij vragen…', run: function () { openRequest(pid, dIso, half === 1 ? 'middag' : 'dag'); } });
      }
      if (canApprove()) items.push({ label: 'Inplannen…', run: function () { openPlan([pid], dIso, half); } });
      var kcol = el.closest('[data-col]'), ktm = kcol ? timeAt(kcol, y) : null;
      items.push({ label: ktm ? 'Afspraak om ' + ktm + ' toevoegen…' : 'Afspraak toevoegen…', run: function () { openAppt(pid, dIso, half, null, ktm); } });
      items.push({ label: 'Notitie toevoegen…', run: function () { openNotes(pid, dIso, half, true); } });
      items.push({ label: 'Details', run: function () { openBlock(pid, dIso, half); } });
      if (isAdmin()) items.push({ label: 'Blok wijzigen…', run: function () { openBlock(pid, dIso, half, true); } });
      openMenu(x, y, p.name + ' · ' + short(d) + ' ' + HALVES[half].toLowerCase(), items);
    } else {
      var di = el.getAttribute('data-date'), dd = parseIso(di), vp = viewPerson();
      if (canActFor(vp.id)) {
        items.push({ label: 'Ziek melden – hele dag', red: true, run: function () { reportSick(vp.id, di, null); } });
        items.push({ label: 'Vrij vragen vanaf deze dag…', run: function () { openRequest(vp.id, di, 'dag'); } });
      }
      if (weekday(dd) < 5) {
        items.push({ label: 'Afspraak toevoegen…', run: function () { openAppt(vp.id, di, 0); } });
        items.push({ label: 'Notitie ochtend…', run: function () { openNotes(vp.id, di, 0, true); } });
        items.push({ label: 'Notitie middag…', run: function () { openNotes(vp.id, di, 1, true); } });
      }
      if (canApprove() && weekday(dd) < 5) items.push({ label: 'Inplannen…', run: function () { openPlan([vp.id], di, 0); } });
      if (vp.id === state.user && dutyPeople().some(function (p) { return p.id === vp.id; })) items.push({ label: isNoDuty(vp.id, di) ? 'Toch beschikbaar voor dienst' : 'Geen dienst op deze dag', run: function () { toggleNoDuty(vp.id, di); render(); toast('Opgeslagen voor de dienstplanner'); } });
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
    var g = gapsFor(r);
    requests.push(r); addGaps(g);
    notify('PLANNERS', p.name + ' is ziek gemeld voor ' + short(d) + (half == null ? '' : ' ' + HALVES[half].toLowerCase()) + (g.length ? ' · ' + g.length + ' tekort(en)' : ''));
    persist(); render();
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
    if (!fromIso || fromIso < iso(earliestVacation())) { fromIso = iso(earliestVacation()); fromPart = 'dag'; }
    var pplOpts = canApprove() ? '<label class="f">Voor wie<select id="rq-person">' + PEOPLE.map(function (p) { return '<option value="' + p.id + '"' + (p.id === who ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') + '</select></label>' : '';
    var html = pplOpts +
      '<div class="opts" role="group" aria-label="Soort">' + TYPES.map(function (k) { return '<button type="button" data-kind="' + esc(k) + '" aria-pressed="' + (k === kind) + '">' + esc(k) + '</button>'; }).join('') + '</div>' +
      '<p class="note" id="rq-rule"></p>' +
      '<div class="grid2"><label class="f">Van<input type="date" id="rq-from" value="' + fromIso + '"></label>' +
      '<label class="f">Vanaf<select id="rq-fromPart"><option value="dag">Hele dag</option><option value="middag"' + (fromPart === 'middag' ? ' selected' : '') + '>Middag</option></select></label>' +
      '<label class="f">Tot en met<input type="date" id="rq-to" value="' + iso(addDays(parseIso(fromIso), 1)) + '"></label>' +
      '<label class="f">Tot en met<select id="rq-toPart"><option value="dag">Hele dag</option><option value="ochtend">Ochtend</option></select></label></div>' +
      '<label class="f">Toelichting<textarea id="rq-note" rows="2" maxlength="200" placeholder="Bijv. naam van het congres"></textarea></label>' +
      '<p class="warn" id="rq-late" hidden></p>' +
      '<div id="rq-saldo" class="card" style="padding:.6rem .7rem"></div>' +
      (canApprove() ? '<p class="impact ok" id="rq-impact"></p>' : '') +
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
          late.textContent = 'Dit valt binnen de reguliere ' + VAK_WEEKS + ' weken (eerst mogelijke datum: ' + longDate(earliest) + '). Je kunt het wel aanvragen; de planner beslist.';
        }
        var st = statusFor(r);
        send.disabled = blocked;
        send.style.opacity = blocked ? '.45' : '';
        send.textContent = st === 'approved' ? 'Vastleggen' : 'Aanvraag indienen';
        var sb = root.querySelector('#rq-saldo');
        var kk = kindOf(kind);
        if (kk) {
          var sa = saldoOf(r.person)[kk], n = workDaysOf(r), after = sa.saldo - sa.aanv - n;
          sb.hidden = false;
          sb.innerHTML = '<h3>' + (kk === 'vak' ? 'Vakantie' : 'Congres') + 'dagen' + (r.person !== state.user ? ' · ' + esc(person(r.person).name) : '') + '</h3>' + saldoRow(kk === 'vak' ? 'Vakantie' : 'Congres', sa) +
            '<p class="note" style="margin:0">Deze aanvraag: <b>' + fmtD(n) + '</b> (alleen dagen die je volgens het rooster werkt). Daarna over: <b' + (after < 0 ? ' style="color:var(--low-ink)"' : '') + '>' + fmtD(after) + '</b>.</p>';
        } else { sb.hidden = true; sb.innerHTML = ''; }
        var el = root.querySelector('#rq-impact');
        if (el) {
          var imp = impactOf(r);
          el.className = 'impact' + (imp.length ? '' : ' ok');
          el.textContent = 'Voor de planner: ' + (imp.length ? 'gevolg ' + imp.join('; ') : 'geen tekorten in de bezetting.');
        }
      }
      root.querySelector('#rq-from').addEventListener('change', function () {
        var f = root.querySelector('#rq-from'), to = root.querySelector('#rq-to');
        if (f.value && (!to.value || to.value <= f.value)) to.value = iso(addDays(parseIso(f.value), 1));
      });
      root.querySelectorAll('[data-kind]').forEach(function (b) {
        b.addEventListener('click', function () {
          kind = b.getAttribute('data-kind'); root.querySelectorAll('[data-kind]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          var f = root.querySelector('#rq-from'), e1 = iso(earliestVacation());
          if (kind === 'Vakantie' && f.value < e1) { f.value = e1; root.querySelector('#rq-to').value = iso(addDays(earliestVacation(), 1)); }
          preview();
        });
      });
      root.querySelectorAll('input,select').forEach(function (i) { i.addEventListener('change', preview); i.addEventListener('input', preview); });
      preview();
      root.querySelector('#rq-send').addEventListener('click', function () {
        var r0 = current(); if (!r0.from || !r0.to) return;
        if (tooLate(r0)) {
          showAlert('Binnen de reguliere 12 weken',
            'Vakantie vraag je normaal minimaal ' + VAK_WEEKS + ' weken van tevoren aan; de eerst mogelijke datum is ' + longDate(earliestVacation()) + '. ' +
            'Je kunt deze aanvraag toch indienen, maar de planner kan hem afwijzen als de bezetting het niet toelaat. Overleg het liefst eerst even.',
            canApprove() ? 'Toch vastleggen' : 'Toch indienen', 'Datum aanpassen', function () { submitReq(current()); });
        } else submitReq(r0);
      });
      function submitReq(r) {
        r.status = statusFor(r);
        if (r.status === 'approved') {
          var g = gapsFor(r);
          requests.push(r); addGaps(g);
          if (r.person !== state.user) notify(r.person, r.type + ' vastgelegd door ' + person(state.user).name + ': ' + short(parseIso(r.from)) + (r.to !== r.from ? ' – ' + short(parseIso(r.to)) : ''));
          persist(); closeSheet(); render();
          if (g.length) openGaps(function (x) { return x.reqId === r.id; }, 'Vastgelegd · ' + g.length + ' tekort' + (g.length > 1 ? 'en' : ''));
          else toast('Vastgelegd, geen tekorten');
        } else {
          requests.push(r);
          notify('PLANNERS', 'Nieuwe aanvraag: ' + person(r.person).name + ' · ' + r.type + ' ' + short(parseIso(r.from)) + (r.to !== r.from ? ' – ' + short(parseIso(r.to)) : ''));
          persist(); closeSheet(); render();
          toast('Aanvraag verstuurd naar de planner');
        }
      }
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
      var s = slot(p, d, half), t = typeOf(s.text), c = codeOf(s.text), procs = s.text ? procsFor(s, half) : [], ab = s.absent || s.pending;
      var loc = locOf(s.text), team = [];
      if (loc) PEOPLE.forEach(function (q) { if (q.id === pid) return; var o = slot(q, d, half); if (!o.absent && locOf(o.text) === loc) team.push(q.name); });
      var html = '<div class="event t-' + t + '" style="cursor:default"><div class="body"><div class="ttl">' + (c ? '<span class="code">' + esc(c) + '</span>' : '') + '<span class="t">' + esc(s.text || 'Niet ingeroosterd') + '</span></div>' +
        '<div class="meta">' + esc(longDate(d) + ' · ' + HALF_TIME[half][0] + '–' + HALF_TIME[half][1]) + '</div></div></div>' +
        (ab ? '<button type="button" class="event t-AF' + (ab.status !== 'approved' ? ' pend' : '') + '" id="bk-abs"><span class="body"><span class="ttl"><span class="code">' + absLetter(ab) + '</span><span class="t">' + esc(ab.type) + '</span><span class="stat">' + (ab.status !== 'approved' ? 'Aangevraagd' : 'Goedgekeurd') + '</span></span><span class="meta">Tik voor details of om te verwijderen</span></span></button>' : '') +
        '<dl class="kv"><dt>Wie</dt><dd>' + esc(p.name + contactOf(pid)) + '</dd><dt>Waar</dt><dd>' + esc(loc ? PLACE[loc] : '–') + '</dd>' +
        (team.length ? '<dt>Ook hier</dt><dd>' + esc(team.join(', ')) + '</dd>' : '') +
        (s.edited ? '<dt>Excel</dt><dd>' + esc(s.base || 'leeg') + ' <span class="pill">aangepast</span></dd>' : '') + '</dl>';
      if (false) html += '<div class="card"><h3>Geplande ingrepen</h3><ul class="procs" style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.3rem">' +
        procs.map(function (x) { return '<li style="display:flex;gap:.6rem"><b style="font-variant-numeric:tabular-nums;min-width:3rem">' + esc(x.time) + '</b><span>' + esc(x.name) + (x.dur ? ' <span class="muted">· ' + x.dur + ' min</span>' : '') + '</span></li>'; }).join('') + '</ul><p class="note">Voorbeeldingrepen zonder patiëntgegevens.</p></div>';
      html += '<div class="card"><h3>Notities</h3>' + notesHtml(s.key) + noteForm() + '</div>';
      if (canActFor(pid)) html += '<div class="btn-row"><button type="button" class="btn danger" id="bk-sick">Ziek dit dagdeel</button><button type="button" class="btn secondary" id="bk-free">Vrij vragen</button></div>';
      if (isAdmin()) {
        html += '<div class="card" id="bk-edit"><h3>Beheer: blok wijzigen</h3>' +
          '<label class="f">Activiteit (zoals in de Excel)<input id="bk-text" value="' + esc(s.text) + '" placeholder="Bijv. OK 10, pok, su"></label>' +

          '<div class="btn-row"><button type="button" class="btn" id="bk-save">Opslaan</button><button type="button" class="btn secondary" id="bk-reset">Terug naar Excel</button></div></div>';
      }
      openSheet(HALVES[half] + ' · ' + short(d), html, function (root) {
        bindNotes(root, s.key, draw);
        var ba = root.querySelector('#bk-abs'); if (ba) ba.addEventListener('click', function () { openAbsence(ab.id); });
        var sick = root.querySelector('#bk-sick'); if (sick) sick.addEventListener('click', function () { closeSheet(); reportSick(pid, dIso, half); });
        var free = root.querySelector('#bk-free'); if (free) free.addEventListener('click', function () { openRequest(pid, dIso, half === 1 ? 'middag' : 'dag'); });
        var sv = root.querySelector('#bk-save');
        if (sv) sv.addEventListener('click', function () {
          var txt = root.querySelector('#bk-text').value.trim();
          if (txt === s.base) delete overrides.blocks[s.key]; else overrides.blocks[s.key] = txt;
          var lines = [];
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

  function absLetter(r) { return { 'Ziek': 'Z', 'Vakantie': 'V', 'Congres': 'C', 'Congres organisatie': 'C', 'Cursus / onderwijs': 'O' }[r.type] || 'A'; }
  function absEventCard(r, h) {
    var pend = r.status !== 'approved';
    return '<button type="button" class="event t-AF' + (pend ? ' pend' : '') + '" data-abs="' + r.id + '" aria-label="' + esc(r.type + ', ' + (pend ? 'aangevraagd' : 'goedgekeurd')) + '">' +
      '<span class="time">' + HALF_TIME[h][0] + '<br>' + HALF_TIME[h][1] + '</span><span class="body"><span class="ttl"><span class="code">' + absLetter(r) + '</span><span class="t">' + esc(r.type) + '</span><span class="stat">' + (pend ? 'Aangevraagd' : 'Goedgekeurd') + '</span></span>' +
      (r.note ? '<span class="meta">' + esc(r.note) + '</span>' : '') + '</span></button>';
  }
  function visiteCard(s) {
    return '<button type="button" class="event t-VS" data-key="' + s.key + '" aria-label="Visite 08:00 tot 08:30"><span class="time">08:00<br>08:30</span><span class="body"><span class="ttl"><span class="code">VS</span><span class="t">Visite</span></span><span class="meta">Voor het spreekuur</span></span></button>';
  }
  function eventCard(p, d, h) {
    var s = slot(p, d, h), abs = s.absent || s.pending;
    var t = typeOf(s.text), c = codeOf(s.text), nc = visibleNotes(s.key).length, tm = timesOf(s, h);
    var meta = [];
    if (locOf(s.text)) meta.push(PLACE[locOf(s.text)]);
    if (s.edited) meta.push('aangepast');
    var block = '<button type="button" class="event t-' + t + '" data-key="' + s.key + '" aria-label="' + esc(HALVES[h] + ': ' + (s.text ? titleOf(s.text) : 'niet ingeroosterd')) + '">' +
      '<span class="time">' + tm[0] + '<br>' + tm[1] + '</span><span class="body"><span class="ttl">' + (c ? '<span class="code">' + esc(c) + '</span>' : '') +
      '<span class="t">' + esc(s.text ? titleOf(s.text) : 'Niet ingeroosterd') + '</span>' + (nc ? NOTE_SVG : '') + '</span>' +
      (meta.length ? '<span class="meta">' + esc(meta.join(' · ')) + '</span>' : '') + '</span></button>';
    var out = (hasVisite(s, h) ? visiteCard(s) : '') + (abs ? '<div class="pair">' + block + absEventCard(abs, h) + '</div>' : block);
    return out + apptCards(p.id, iso(d), h);
  }

  function dayList(p, d) {
    var today = iso(d) === iso(new Date()), n = apptsOn(p.id, iso(d)).length;
    var html = '<h2 class="day-head' + (today ? ' today' : '') + '"><span>' + esc(longDate(d)) + '</span><span class="note">' + (n ? n + ' afspra' + (n > 1 ? 'ken' : 'ak') + ' · ' : '') + (today ? 'vandaag' : '') + '</span></h2>';
    var add = '<button type="button" class="mini-btn" data-newappt="' + p.id + '|' + iso(d) + '">+ Afspraak toevoegen</button>';
    if (weekday(d) > 4) return html + '<div class="list">' + dutyCard(p.id, iso(d)) + apptCards(p.id, iso(d), 0) + apptCards(p.id, iso(d), 1) + apptCards(p.id, iso(d), 2) + '</div>' + (n || duties[iso(d)] === p.id ? '' : '<p class="empty">Weekend, geen basisrooster.</p>') + add;
    return html + gapCards(iso(d)) + '<div class="list">' + dutyCard(p.id, iso(d)) + eventCard(p, d, 0) + eventCard(p, d, 1) + apptCards(p.id, iso(d), 2) + '</div>' + add;
  }

  /* =========================================================
     Afspraken (eigen tijdstip en omschrijving per dagdeel, ook 's avonds)
     ========================================================= */
  var APPT_KINDS = [['PT1', 'Patiënt zien/bellen', '#D63C9F'], ['VG', 'Vergadering', '#7E3BEF'], ['WTS', 'Wetenschap', '#8E1B1B'], ['OVL', 'Overleg', '#2F6DB5'], ['OPL', 'Onderwijs', '#1E7A4F'], ['AFS', 'Afspraak', '#5B6772']];
  var PARTS = ['Ochtend', 'Middag', 'Avond'], PART_DEF = [['09:00', '10:00'], ['13:00', '14:00'], ['16:30', '18:00']];
  function kindInfo(k) { for (var i = 0; i < APPT_KINDS.length; i++) if (APPT_KINDS[i][0] === k) return APPT_KINDS[i]; return APPT_KINDS[APPT_KINDS.length - 1]; }
  function canSeeAppt(a) { return a.person === state.user || a.by === state.user || a.shared || canApprove(); }
  function apptsOn(pid, dIso, part) {
    return appts.filter(function (a) { return a.person === pid && a.date === dIso && (part == null || a.part === part) && canSeeAppt(a); })
      .sort(function (a, b) { return a.start < b.start ? -1 : 1; });
  }
  function apptCards(pid, dIso, part) {
    return apptsOn(pid, dIso, part).map(function (a) {
      var k = kindInfo(a.kind);
      return '<button type="button" class="event appt" data-appt="' + a.id + '" style="--bar:' + k[2] + ';background:color-mix(in srgb,' + k[2] + ' 14%, var(--surface));color:var(--ink)">' +
        '<span class="time">' + esc(a.start) + '<br>' + esc(a.end) + '</span><span class="body"><span class="ttl"><span class="code" style="background:' + k[2] + ';color:#fff">' + esc(k[0]) + '</span><span class="t">' + esc(k[1]) + '</span>' + (a.shared ? '' : '<span class="pill">privé</span>') + '</span>' +
        (a.text ? '<span class="meta">' + esc(a.text) + '</span>' : '') + '</span></button>';
    }).join('');
  }
  function openAppt(pid, dIso, part, id, startTime) {
    var a = id ? appts.filter(function (x) { return x.id === id; })[0] : null;
    var mine = !a || a.by === state.user || a.person === state.user || isAdmin();
    var who = a ? a.person : (canApprove() ? (pid || state.user) : state.user);
    if (who === 'ADMIN') who = viewPerson().id;
    var pt = a ? a.part : (part == null ? 0 : part), def = PART_DEF[pt];
    if (!a && startTime) def = [startTime, fromMin(Math.min(toMin(startTime) + 30, 23 * 60 + 45))];
    var html = (canApprove() ? '<label class="f">Voor wie<select id="ap-person">' + PEOPLE.map(function (p) { return '<option value="' + p.id + '"' + (p.id === who ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') + '</select></label>' : '') +
      '<div class="grid2"><label class="f">Datum<input type="date" id="ap-date" value="' + (a ? a.date : dIso) + '"></label>' +
      '<label class="f">Dagdeel<select id="ap-part">' + PARTS.map(function (n, i) { return '<option value="' + i + '"' + (i === pt ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></label>' +
      '<label class="f">Van<input type="time" id="ap-start" value="' + (a ? a.start : def[0]) + '"></label><label class="f">Tot<input type="time" id="ap-end" value="' + (a ? a.end : def[1]) + '"></label></div>' +
      '<label class="f">Soort<select id="ap-kind">' + APPT_KINDS.map(function (k) { return '<option value="' + k[0] + '"' + ((a ? a.kind : 'AFS') === k[0] ? ' selected' : '') + '>' + k[0] + ' · ' + k[1] + '</option>'; }).join('') + '</select></label>' +
      '<label class="f">Omschrijving<input id="ap-text" maxlength="160" value="' + esc(a ? a.text : '') + '" placeholder="Bijv. gesprek, overleg in de vergaderzaal"></label>' +
      (canShare() ? '<label class="toggle">Zichtbaar voor iedereen<input type="checkbox" id="ap-shared"' + (a && a.shared ? ' checked' : '') + '></label>' : '<p class="note" style="margin:0">Zichtbaar voor jou en de planner.</p>') +
      (mine ? '<div class="btn-row"><button type="button" class="btn" id="ap-save">Opslaan</button>' + (a ? '<button type="button" class="btn danger" id="ap-del">Verwijderen</button>' : '') + '</div>' : '');
    openSheet(a ? 'Afspraak' : 'Nieuwe afspraak', html, function (root) {
      var partSel = root.querySelector('#ap-part');
      partSel.addEventListener('change', function () { var d2 = PART_DEF[+partSel.value]; root.querySelector('#ap-start').value = d2[0]; root.querySelector('#ap-end').value = d2[1]; });
      var sv = root.querySelector('#ap-save');
      if (sv) sv.addEventListener('click', function () {
        var sel = root.querySelector('#ap-person'), st = root.querySelector('#ap-start').value, en = root.querySelector('#ap-end').value;
        if (!st || !en || en <= st) { toast('Controleer de tijden'); return; }
        var o = a || { id: 'a' + Date.now(), by: state.user };
        o.person = sel ? sel.value : who; o.date = root.querySelector('#ap-date').value; o.part = +partSel.value; o.start = st; o.end = en;
        o.kind = root.querySelector('#ap-kind').value; o.text = root.querySelector('#ap-text').value.trim().slice(0, 160);
        var sh = root.querySelector('#ap-shared'); o.shared = !!(sh && sh.checked);
        if (!a) appts.push(o);
        if (o.person !== state.user) notify(o.person, (a ? 'Afspraak gewijzigd' : 'Nieuwe afspraak') + ': ' + kindInfo(o.kind)[1] + ' · ' + short(parseIso(o.date)) + ' ' + o.start);
        persist(); closeSheet(); render(); toast('Afspraak opgeslagen');
      });
      var dl = root.querySelector('#ap-del');
      if (dl) dl.addEventListener('click', function () { appts = appts.filter(function (x) { return x.id !== a.id; }); persist(); closeSheet(); render(); toast('Afspraak verwijderd'); });
    });
  }

  /* =========================================================
     Diensten (dagdienst doordeweeks, weekenddienst za+zo), verdeeld op FTE
     ========================================================= */
  function dutyType(d) { return weekday(d) > 4 ? ['WD', 'Weekenddienst'] : ['D', 'Dagdienst']; }
  function dutyPeople() { return PEOPLE.filter(function (p) { return rights[p.id] && rights[p.id].doetDienst; }); }
  function isNoDuty(pid, di) { return !!(noDuty[pid] && noDuty[pid][di]); }
  function absentOn(pid, di) { var r = absenceFor(pid, di, 0) || absenceFor(pid, di, 1); if (r) return r; var d = parseIso(di); if (weekday(d) > 4) return requests.filter(function (x) { return x.person === pid && x.status !== 'declined' && di >= x.from && di <= x.to; })[0] || null; return null; }
  function dutyBlock(pid, di) { if (isNoDuty(pid, di)) return 'geen dienst'; var a = absentOn(pid, di); if (a) return a.type.toLowerCase() + (a.status === 'pending' ? ' (aangevraagd)' : ''); return ''; }
  function dutyStats(year) {
    var ppl = dutyPeople(), fteSum = ppl.reduce(function (s, p) { return s + (rights[p.id].fte || 0); }, 0) || 1;
    var days = Math.round((new Date(year + 1, 0, 1) - new Date(year, 0, 1)) / 86400000), today = iso(new Date());
    var out = {};
    ppl.forEach(function (p) { var f = rights[p.id].fte || 0; out[p.id] = { fte: f, pct: f / fteSum * 100, doel: f / fteSum * days, gepland: 0, gedaan: 0 }; });
    Object.keys(duties).forEach(function (di) { var pid = duties[di]; if (!out[pid] || +di.slice(0, 4) !== year) return; out[pid].gepland++; if (di < today) out[pid].gedaan++; });
    return out;
  }
  function assignDuty(di, pid, silent) {
    var d = parseIso(di), dates = [di];
    if (weekday(d) === 5) dates.push(iso(addDays(d, 1))); else if (weekday(d) === 6) dates.push(iso(addDays(d, -1)));
    dates.forEach(function (x) { if (pid) duties[x] = pid; else delete duties[x]; });
    if (pid && !silent) notify(pid, 'Ingepland voor ' + dutyType(d)[1].toLowerCase() + ': ' + short(parseIso(dates.sort()[0])) + (dates.length > 1 ? ' en ' + short(parseIso(dates[1])) : ''));
  }
  function autoDistribute(monthDate) {
    var y = monthDate.getFullYear(), m = monthDate.getMonth(), st = dutyStats(y), count = {}, made = {}, n = 0;
    dutyPeople().forEach(function (p) { count[p.id] = st[p.id].gepland; });
    for (var d = new Date(y, m, 1); d.getMonth() === m; d = addDays(d, 1)) {
      var di = iso(d); if (duties[di] || weekday(d) === 6) continue;
      var wknd = weekday(d) === 5, dates = wknd ? [di, iso(addDays(d, 1))] : [di];
      var best = null, bestScore = 1e9;
      dutyPeople().forEach(function (p) {
        if (dates.some(function (x) { return dutyBlock(p.id, x); })) return;
        var prev = duties[iso(addDays(d, -1))] === p.id || duties[iso(addDays(d, -2))] === p.id;
        var score = (count[p.id] + 0.5) / Math.max(0.05, st[p.id].fte) + (prev ? 50 : 0);
        if (score < bestScore) { bestScore = score; best = p.id; }
      });
      if (!best) continue;
      dates.forEach(function (x) { duties[x] = best; });
      count[best] += dates.length; made[best] = (made[best] || 0) + dates.length; n += dates.length;
    }
    Object.keys(made).forEach(function (pid) { notify(pid, 'Je hebt ' + made[pid] + ' dienst' + (made[pid] > 1 ? 'en' : '') + ' in ' + MONTHS_LONG[m] + ' gekregen'); });
    return n;
  }
  function dutyChip(pid, di) {
    if (duties[di] !== pid) return '';
    var t = dutyType(parseIso(di));
    return '<span class="mbar t-DI"><span>' + t[0] + '</span></span>';
  }
  function dutyCard(pid, di) {
    if (duties[di] !== pid) return '';
    var t = dutyType(parseIso(di));
    return '<div class="event t-DI" style="cursor:default"><span class="time">hele<br>dag</span><span class="body"><span class="ttl"><span class="code">' + t[0] + '</span><span class="t">' + t[1] + '</span></span></span></div>';
  }
  function toggleNoDuty(pid, di) {
    noDuty[pid] = noDuty[pid] || {};
    if (noDuty[pid][di]) delete noDuty[pid][di]; else noDuty[pid][di] = true;
    if (noDuty[pid][di] && duties[di] === pid) notify('DIENST', person(pid).name + ' kan geen dienst op ' + short(parseIso(di)) + ', maar staat ingepland');
    persist();
  }
  function renderDiensten() {
    var cur = state.cursor, y = cur.getFullYear(), first = new Date(y, cur.getMonth(), 1), start = mondayOf(first), today = iso(new Date());
    var planner = canPlanDuty(), mode = planner ? (state.dutyMode || 'plan') : 'mijn';
    var me = person(state.user), st = dutyStats(y);
    var html = '';
    if (planner) html += '<div class="seg" style="grid-template-columns:repeat(2,1fr)" role="tablist" aria-label="Weergave"><button type="button" data-dmode="plan" aria-selected="' + (mode === 'plan') + '">Planning</button><button type="button" data-dmode="mijn" aria-selected="' + (mode === 'mijn') + '">Mijn beschikbaarheid</button></div>';
    if (mode === 'plan') html += '<div class="btn-row"><button type="button" class="btn" id="d-auto">Automatisch verdelen</button><button type="button" class="btn secondary" id="d-clear">Maand leegmaken</button></div><p class="note" style="margin:0">Tik op een dag om iemand in te plannen. Vakantie (ook aangevraagd) en "geen dienst" tellen als niet beschikbaar. Verdeling naar FTE.</p>';
    else html += '<p class="note" style="margin:0">Tik op de dagen waarop je <b>geen dienst</b> kunt. Vakantie hoef je niet aan te geven; die telt automatisch mee.</p>';
    html += '<div class="month"><div class="month-head">' + DAYS.map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div><div class="month-grid">';
    for (var i = 0; i < 42; i++) {
      var d = addDays(start, i); if (i >= 35 && d.getMonth() !== cur.getMonth()) break;
      var di = iso(d), pid = duties[di], wd = weekday(d), inner = '';
      if (mode === 'plan') {
        if (pid) { var bl = dutyBlock(pid, di); inner = '<span class="mbar ' + (bl ? 't-AF pend' : 't-DI') + '" title="' + esc(person(pid).name + (bl ? ' · ' + bl : '')) + '">' + esc(person(pid).name.replace(/^Chirurg /, '').split(' ')[0]) + (bl ? ' !' : '') + '</span>'; }
        else inner = '<span class="mbar" style="color:var(--muted)">–</span>';
      } else {
        var own = state.user, nd = isNoDuty(own, di), ab = absentOn(own, di);
        inner = (duties[di] === own ? '<span class="mbar t-DI">' + dutyType(d)[0] + '</span>' : '') + (nd ? '<span class="mbar t-AF pend">geen</span>' : '') + (ab ? '<span class="mbar t-AF">' + absLetter(ab) + '</span>' : '');
      }
      html += '<button type="button" class="mday' + (d.getMonth() !== cur.getMonth() ? ' out' : '') + (wd > 4 ? ' weekend' : '') + (di === today ? ' today' : '') + '" data-dday="' + di + '"><span class="mnum">' + d.getDate() + '</span>' + inner + '</button>';
    }
    html += '</div></div>';
    var mine = Object.keys(duties).filter(function (di) { return duties[di] === state.user && di >= today; }).sort().slice(0, 8);
    if (!isAdmin()) html += '<section class="card"><h2>Mijn komende diensten</h2>' + (mine.length ? mine.map(function (di) { return '<div class="w-row"><span>' + esc(longDate(parseIso(di))) + '</span><b>' + dutyType(parseIso(di))[1] + '</b></div>'; }).join('') : '<p class="empty">Geen diensten ingepland.</p>') + '</section>';
    var rows = canSeeDutyAll() ? dutyPeople() : dutyPeople().filter(function (p) { return p.id === state.user; });
    if (rows.length) html += '<section class="card"><h2>FTE en diensten ' + y + '</h2><div style="overflow-x:auto"><table class="dtable"><thead><tr><th>Naam</th><th>FTE</th><th>% dienst</th><th>Doel</th><th>Ingepland</th><th>Gedaan</th></tr></thead><tbody>' +
      rows.map(function (p) { var s = st[p.id]; return '<tr><td>' + esc(p.name) + '</td><td>' + fmtN(s.fte) + '</td><td>' + fmtN(Math.round(s.pct * 10) / 10) + '%</td><td>' + Math.round(s.doel) + '</td><td>' + s.gepland + '</td><td>' + s.gedaan + '</td></tr>'; }).join('') +
      '</tbody></table></div><p class="note" style="margin:0">% dienst = eigen FTE gedeeld door de FTE van iedereen die dienst doet. Doel = dat percentage van alle dagen in ' + y + '. FTE stelt de beheerder in.</p></section>';
    main.innerHTML = html;
    main.querySelectorAll('[data-dmode]').forEach(function (b) { b.addEventListener('click', function () { state.dutyMode = b.getAttribute('data-dmode'); render(); }); });
    var au = document.getElementById('d-auto'); if (au) au.addEventListener('click', function () { var n = autoDistribute(cur); persist(); render(); toast(n ? n + ' dienstdagen verdeeld' : 'Niets te verdelen'); });
    var cl = document.getElementById('d-clear'); if (cl) cl.addEventListener('click', function () { if (!window.confirm('Alle diensten in ' + MONTHS_LONG[cur.getMonth()] + ' leegmaken?')) return; Object.keys(duties).forEach(function (di) { var dd = parseIso(di); if (dd.getMonth() === cur.getMonth() && dd.getFullYear() === y) delete duties[di]; }); persist(); render(); });
    main.querySelectorAll('[data-dday]').forEach(function (b) {
      b.addEventListener('click', function () {
        var di = b.getAttribute('data-dday');
        if (mode === 'mijn') { toggleNoDuty(state.user, di); render(); return; }
        openDutyAssign(di);
      });
    });
  }
  function openDutyAssign(di) {
    var d = parseIso(di), t = dutyType(d), st = dutyStats(d.getFullYear()), cur = duties[di];
    var list = dutyPeople().map(function (p) { return { p: p, bl: dutyBlock(p.id, di), ratio: (st[p.id].gepland) / Math.max(0.05, st[p.id].fte) }; })
      .sort(function (a, b) { return (!!a.bl - !!b.bl) || a.ratio - b.ratio; });
    var html = '<p class="note" style="margin:0">' + esc(t[1] + (weekday(d) > 4 ? ' (zaterdag en zondag samen)' : '')) + '</p><div class="cands">' + list.map(function (c) {
      var s = st[c.p.id];
      return '<button type="button" class="cand" data-dpick="' + c.p.id + '"' + (cur === c.p.id ? ' style="box-shadow:inset 0 0 0 2px var(--tint)"' : '') + '><span>' + esc(c.p.name) + ' <small>' + (c.bl ? 'Niet beschikbaar: ' + esc(c.bl) : s.gepland + ' van ~' + Math.round(s.doel) + ' diensten · FTE ' + fmtN(s.fte)) + '</small></span><span class="go">' + (cur === c.p.id ? 'Ingepland' : 'Kies') + '</span></button>';
    }).join('') + '</div>' + (cur ? '<button type="button" class="btn secondary" id="d-none">Niemand (leegmaken)</button>' : '');
    openSheet(longDate(d), html, function (root) {
      root.querySelectorAll('[data-dpick]').forEach(function (b) {
        b.addEventListener('click', function () {
          var pid = b.getAttribute('data-dpick'), c = list.filter(function (x) { return x.p.id === pid; })[0];
          function go() { assignDuty(di, pid); persist(); closeSheet(); render(); toast(person(pid).name + ' ingepland'); }
          if (c.bl) showAlert('Niet beschikbaar', person(pid).name + ' heeft op deze dag: ' + c.bl + '. Toch inplannen?', 'Toch inplannen', 'Annuleren', go); else go();
        });
      });
      var nn = root.querySelector('#d-none'); if (nn) nn.addEventListener('click', function () { assignDuty(di, null); persist(); closeSheet(); render(); });
    });
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
    var html = gapBanner() + personPicker() + '<div class="month"><div class="month-head">' + DAYS.map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div><div class="month-grid">';
    for (var i = 0; i < 42; i++) {
      var d = addDays(start, i);
      if (i >= 35 && d.getMonth() !== cur.getMonth()) break;
      var di = iso(d), wd = weekday(d), cls = 'mday' + (d.getMonth() !== cur.getMonth() ? ' out' : '') + (wd > 4 ? ' weekend' : '') + (di === todayIso ? ' today' : '') + (di === selIso ? ' sel' : '');
      var bars = '';
      if (wd < 5) for (var h = 0; h < 2; h++) {
        var s = slot(p, d, h);
        var ab = s.absent || s.pending;
        if (!s.text && !ab) { bars += '<span class="mbar" style="visibility:hidden">·</span>'; continue; }
        var t = s.text ? typeOf(s.text) : 'AF', c = s.text ? (codeOf(s.text) || s.text.slice(0, 6)) : ab.type.slice(0, 5);
        bars += '<span class="mbar t-' + t + '"><span style="overflow:hidden;text-overflow:ellipsis">' + esc(c) + '</span>' + (ab ? '<i class="ab' + (ab.status !== 'approved' ? ' pend' : '') + '" title="' + esc(ab.type + (ab.status !== 'approved' ? ' (aangevraagd)' : '')) + '">' + absLetter(ab) + '</i>' : '') + '</span>';
      }
      bars += dutyChip(p.id, di);
      var nc = notesOnDay(p.id, di);
      var gc = canApprove() ? openGapsOn(di).length : 0;
      html += '<button type="button" class="' + cls + '" data-date="' + di + '" aria-label="' + esc(longDate(d) + (gc ? ', ' + gc + ' tekort' : '')) + '"><span class="mnum">' + d.getDate() + '</span>' + bars + '<span class="mdots">' + (gc ? '<span class="dot gap"></span>' : '') + (nc ? '<span class="dot note"></span>' : '') + (apptsOn(p.id, di).length ? '<span class="cnt">' + apptsOn(p.id, di).length + '</span>' : '') + '</span></button>';
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
      return '<button type="button" data-goto="' + iso(d) + '" class="' + (iso(d) === todayIso ? 'today' : '') + '"><span>' + DAYS[weekday(d)] + '</span><span class="n">' + d.getDate() + '</span>' + (duties[iso(d)] === p.id ? '<span class="code" style="background:var(--DI-bar);color:#fff;font-size:.6rem;padding:0 4px;border-radius:4px">' + dutyType(d)[0] + '</span>' : '') + '</button>';
    }).join('') + '</div><div class="tg-body" style="grid-template-columns:' + cols + ';height:' + total + 'rem"><div class="tg-hours">';
    for (var hr = GRID_START + 1; hr < GRID_END; hr++) html += '<span class="tg-hour" style="top:' + ((hr - GRID_START) * hourH) + 'rem">' + hr + ':00</span>';
    html += '</div>';
    var now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
    days.forEach(function (d) {
      html += '<div class="tg-col" data-col="' + p.id + '|' + iso(d) + '|' + hourH + '">';
      for (var hr2 = GRID_START + 1; hr2 < GRID_END; hr2++) html += '<span class="tg-line" style="top:' + ((hr2 - GRID_START) * hourH) + 'rem"></span>';
      if (iso(d) === todayIso && nowMin > GRID_START * 60 && nowMin < GRID_END * 60) html += '<span class="tg-now" style="top:' + ((nowMin / 60 - GRID_START) * hourH) + 'rem"></span>';
      if (weekday(d) < 5) for (var h = 0; h < 2; h++) {
        var s = slot(p, d, h), ab = s.absent || s.pending, dApp = apptsOn(p.id, iso(d), h);
        if (!s.text && !ab) continue;
        var tm = timesOf(s, h), side = ab || dApp.length;
        var top = (toMin(tm[0]) / 60 - GRID_START) * hourH, height = (toMin(tm[1]) - toMin(tm[0])) / 60 * hourH - 0.15;
        var pos = 'top:' + top + 'rem;height:' + height + 'rem';
        if (hasVisite(s, h)) html += '<button type="button" class="tg-ev t-VS' + (big ? ' big' : '') + '" data-key="' + s.key + '" style="top:' + ((8 - GRID_START) * hourH) + 'rem;height:' + (0.5 * hourH - 0.15) + 'rem"><span class="ttl"><span class="code">VS</span> Visite</span></button>';
        if (s.text) {
          var t = typeOf(s.text), c = codeOf(s.text), nc = visibleNotes(s.key).length;
          html += '<button type="button" class="tg-ev t-' + t + (big ? ' big' : '') + (side ? ' half-l' : '') + '" data-key="' + s.key + '" style="' + pos + '">' +
            '<span class="ttl">' + (c ? '<span class="code">' + esc(c) + '</span> ' : '') + esc(titleOf(s.text)) + '</span>' +
            (big ? '<span class="sm">' + esc(tm[0] + '–' + tm[1] + (locOf(s.text) ? ' · ' + PLACE[locOf(s.text)] : '')) + (nc ? ' · ' + nc + ' notitie' + (nc > 1 ? 's' : '') : '') + '</span>' : (nc ? '<span class="sm">' + NOTE_SVG + '</span>' : '')) + '</button>';
        }
        if (ab) {
          var pend = ab.status !== 'approved';
          html += '<button type="button" class="tg-ev t-AF' + (big ? ' big' : '') + (pend ? ' pend' : '') + (s.text ? ' half-r' : '') + '" data-abs="' + ab.id + '" style="' + pos + '">' +
            '<span class="ttl"><span class="code">' + absLetter(ab) + '</span> ' + esc(ab.type) + '</span><span class="sm">' + (pend ? 'Aangevraagd' : 'Goedgekeurd') + '</span>' + (big && ab.note ? '<span class="sm">' + esc(ab.note) + '</span>' : '') + '</button>';
        }
      }
      apptsOn(p.id, iso(d)).forEach(function (a) {
        var k = kindInfo(a.kind), st = Math.max(toMin(a.start), GRID_START * 60), en = Math.min(toMin(a.end), GRID_END * 60);
        if (en <= st) return;
        html += '<button type="button" class="tg-ev appt' + (big ? ' big' : '') + ' half-r" data-appt="' + a.id + '" style="top:' + ((st / 60 - GRID_START) * hourH) + 'rem;height:' + Math.max(big ? 2.4 : 1.2, (en - st) / 60 * hourH - 0.15) + 'rem;--bar:' + k[2] + ';background:color-mix(in srgb,' + k[2] + ' 16%, var(--surface));color:var(--ink);z-index:1">' +
          '<span class="ttl"><span class="code" style="background:' + k[2] + ';color:#fff">' + esc(k[0]) + '</span> ' + esc(a.start + '–' + a.end) + '</span>' + (big || (en - st) >= 45 ? '<span class="sm">' + esc(a.text || k[1]) + '</span>' : '') + '</button>';
      });
      html += '</div>';
    });
    return html + '</div></div>';
  }

  function renderWeek() {
    var p = viewPerson(), mon = mondayOf(state.cursor), days = [];
    for (var i = 0; i < 5; i++) days.push(addDays(mon, i));
    main.innerHTML = gapBanner() + personPicker() + timeGrid(days, p, false) + '<p class="note">' + (parityOf(mon) === 'e' ? 'Even' : 'Oneven') + ' week. Tik op een blok voor de ingrepen; houd ingedrukt of klik rechts voor meer opties.</p>';
    bindPicker(); bindEvents();
  }

  function renderDay() {
    var p = viewPerson(), d = state.cursor, mon = mondayOf(d), todayIso = iso(new Date());
    var strip = '<div class="chips" style="grid-template-columns:repeat(7,minmax(0,1fr))">';
    for (var i = 0; i < 7; i++) { var x = addDays(mon, i); strip += '<button type="button" class="daychip" data-goto="' + iso(x) + '" aria-pressed="' + (iso(x) === iso(d)) + '">' + DAYS[i] + '<small' + (iso(x) === todayIso ? ' style="color:var(--today);font-weight:700"' : '') + '>' + x.getDate() + '</small></button>'; }
    strip += '</div>';
    main.innerHTML = gapBanner() + personPicker() + strip + '<button type="button" class="mini-btn" style="align-self:flex-start" data-newappt="' + p.id + '|' + iso(d) + '">+ Afspraak toevoegen</button>' + gapCards(iso(d)) + (weekday(d) > 4 && !apptsOn(p.id, iso(d)).length ? '<div class="card"><p class="empty">Weekend, geen basisrooster.</p></div>' : timeGrid([d], p, true));
    bindPicker(); bindEvents();
  }

  function bindEvents() {
    main.querySelectorAll('[data-col]').forEach(function (c) {
      c.addEventListener('dblclick', function (e) { if (e.target !== c && !e.target.classList.contains('tg-line')) return; contextFor(c, e.clientX, e.clientY); });
    });
    main.querySelectorAll('[data-appt]').forEach(function (b) { b.addEventListener('click', function () { openAppt(null, null, null, b.getAttribute('data-appt')); }); });
    main.querySelectorAll('[data-newappt]').forEach(function (b) { b.addEventListener('click', function () { var a = b.getAttribute('data-newappt').split('|'); openAppt(a[0], a[1], 0); }); });
    main.querySelectorAll('[data-abs]').forEach(function (b) { b.addEventListener('click', function () { openAbsence(b.getAttribute('data-abs')); }); });
    main.querySelectorAll('[data-gaps]').forEach(function (b) {
      b.addEventListener('click', function () { var v = b.getAttribute('data-gaps'); openGaps(v === 'all' ? function (g) { return g.status === 'open' && g.date >= iso(new Date()); } : function (g) { return g.date === v; }, v === 'all' ? 'Open tekorten' : 'Tekorten ' + short(parseIso(v))); });
    });
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
        if (l) (groups[l] = groups[l] || []).push(p.name); else other.push(p.name + ' · ' + titleOf(s.text));
      });
      html += '<section class="card"><h2>' + HALVES[h] + ' <span class="muted" style="font-weight:500;font-size:.85rem">' + HALF_TIME[h][0] + '–' + HALF_TIME[h][1] + '</span></h2>';
      order.forEach(function (o) { if (groups[o]) html += '<div class="grp"><b>' + LOC_NAMES[o] + '</b><span>' + esc(groups[o].join(', ')) + '</span></div>'; });
      if (other.length) html += '<div class="grp"><b>Niet-klinisch (Ad en Org, wetenschap, opleiding)</b><span>' + esc(other.join(', ')) + '</span></div>';
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
      '<span class="note">' + esc(when + ' · ' + daysIn(r) + ' werkdag(en)' + (kindOf(r.type) ? ' · telt ' + fmtD(workDaysOf(r)) : '') + (r.note ? ' · ' + r.note : '')) + '</span>';
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
  function reqById(id) { return requests.filter(function (x) { return x.id === id; })[0]; }
  function decideRequest(id, action) {
    var r = reqById(id); if (!r) return;
    if (action === 'remove') {
      requests = requests.filter(function (x) { return x.id !== id; });
      gaps = gaps.filter(function (g) { return !(g.reqId === id && g.status === 'open'); });
      if (r.person === state.user && r.status === 'approved') notify('PLANNERS', person(r.person).name + ' heeft ' + (r.type === 'Ziek' ? 'de ziekmelding' : r.type.toLowerCase()) + ' van ' + short(parseIso(r.from)) + ' verwijderd');
      persist(); closeSheet(); render(); toast(r.type === 'Ziek' ? 'Ziekmelding verwijderd' : 'Verwijderd'); return;
    }
    if (action === 'decline') {
      r.status = 'declined'; notify(r.person, 'Je aanvraag (' + r.type.toLowerCase() + ' ' + short(parseIso(r.from)) + ') is afgewezen');
      persist(); closeSheet(); render(); toast('Afgewezen'); return;
    }
    r.status = 'pending';
    var g = gapsFor(r);
    r.status = 'approved'; addGaps(g);
    Object.keys(duties).forEach(function (di) { if (duties[di] === r.person && di >= r.from && di <= r.to) notify('DIENST', person(r.person).name + ' is afwezig (' + r.type.toLowerCase() + ') op dienstdag ' + short(parseIso(di)) + ': nieuwe dienst nodig'); });
    notify(r.person, 'Je ' + r.type.toLowerCase() + ' van ' + short(parseIso(r.from)) + (r.to !== r.from ? ' t/m ' + short(parseIso(r.to)) : '') + ' is goedgekeurd');
    persist(); render();
    if (g.length) openGaps(function (x) { return x.reqId === r.id; }, 'Goedgekeurd · ' + g.length + ' tekort' + (g.length > 1 ? 'en' : ''));
    else { closeSheet(); toast('Goedgekeurd, geen tekorten'); }
  }
  function bindReqButtons() {
    main.querySelectorAll('[data-approve],[data-decline],[data-withdraw],[data-remove]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.hasAttribute('data-approve')) decideRequest(b.getAttribute('data-approve'), 'approve');
        else if (b.hasAttribute('data-decline')) decideRequest(b.getAttribute('data-decline'), 'decline');
        else decideRequest(b.getAttribute('data-withdraw') || b.getAttribute('data-remove'), 'remove');
      });
    });
  }
  function openAbsence(id) {
    var r = reqById(id); if (!r) return;
    var p = person(r.person), pend = r.status !== 'approved';
    var when = longDate(parseIso(r.from)) + (r.fromPart === 'middag' ? ' (vanaf middag)' : '') + (r.to !== r.from || r.toPart === 'ochtend' ? ' t/m ' + longDate(parseIso(r.to)) + (r.toPart === 'ochtend' ? ' (ochtend)' : '') : '');
    var html = '<div class="event t-AF' + (pend ? ' pend' : '') + '" style="cursor:default"><div class="body"><div class="ttl"><span class="code">' + absLetter(r) + '</span><span class="t">' + esc(r.type) + '</span><span class="stat">' + (pend ? 'Aangevraagd' : 'Goedgekeurd') + '</span></div><div class="meta">' + esc(when) + '</div></div></div>' +
      '<dl class="kv"><dt>Wie</dt><dd>' + esc(p.name) + '</dd><dt>Duur</dt><dd>' + daysIn(r) + ' werkdag(en)' + (kindOf(r.type) ? ' · telt ' + fmtD(workDaysOf(r)) : '') + '</dd>' +
      (r.note ? '<dt>Toelichting</dt><dd>' + esc(r.note) + '</dd>' : '') + (r.by && r.by !== r.person ? '<dt>Ingevoerd door</dt><dd>' + esc(person(r.by) ? person(r.by).name : r.by) + '</dd>' : '') + '</dl>' +
      '<p class="note">De planning van die dag blijft gewoon staan; de afwezigheid staat ernaast. ' + (pend ? 'Gearceerd = nog niet goedgekeurd.' : 'Effen = goedgekeurd.') + '</p>';
    if (canApprove() && pend && r.person !== state.user) {
      var imp = impactOf(r);
      html += '<p class="impact' + (imp.length ? '' : ' ok') + '">' + esc(imp.length ? 'Gevolg: ' + imp.join('; ') : 'Geen tekorten door deze aanvraag') + '</p>' +
        '<div class="btn-row"><button type="button" class="btn" id="ab-ok">Goedkeuren</button><button type="button" class="btn secondary" id="ab-no">Afwijzen</button></div>';
    }
    if (r.person === state.user || canApprove()) html += '<button type="button" class="btn danger" id="ab-del">' + (r.type === 'Ziek' ? 'Ziekmelding verwijderen' : (pend ? 'Aanvraag intrekken' : 'Verwijderen')) + '</button>';
    openSheet(r.type, html, function (root) {
      var a = root.querySelector('#ab-ok'); if (a) a.addEventListener('click', function () { decideRequest(r.id, 'approve'); });
      var n = root.querySelector('#ab-no'); if (n) n.addEventListener('click', function () { decideRequest(r.id, 'decline'); });
      var dl = root.querySelector('#ab-del'); if (dl) dl.addEventListener('click', function () { decideRequest(r.id, 'remove'); });
    });
  }
  var alertDlg = document.getElementById('alert');
  function showAlert(title, text, okLabel, cancelLabel, onOk) {
    document.getElementById('alert-title').textContent = title;
    document.getElementById('alert-text').textContent = text;
    var ok = document.getElementById('alert-ok'), cancel = document.getElementById('alert-cancel');
    ok.textContent = okLabel; cancel.textContent = cancelLabel;
    ok.onclick = function () { alertDlg.close(); onOk(); };
    cancel.onclick = function () { alertDlg.close(); };
    if (typeof alertDlg.showModal === 'function') alertDlg.showModal(); else alertDlg.setAttribute('open', '');
    cancel.focus();
  }

  function renderAfwezig() {
    var html = '';
    if (canApprove()) {
      var pend = requests.filter(function (r) { return r.status === 'pending' && r.person !== state.user; });
      html += '<section class="card"><h2>Te beoordelen</h2>' + (pend.length ? pend.map(function (r) { return reqHtml(r, { showName: true, review: true }); }).join('') : '<p class="empty">Geen open aanvragen.</p>') + '</section>';
    }
    if (!isAdmin()) {
      html += '<section class="card"><h2>Mijn vakantie- en congresdagen</h2>' + saldoHtml(state.user) + '<p class="note" style="margin:0">Een dagdeel telt als een halve dag. Alleen dagen die je volgens het rooster werkt, gaan van je saldo af.</p></section>';
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
        '<select data-role="' + p.id + '" aria-label="Rol van ' + esc(p.name) + '"><option value="specialist"' + (r.role === 'specialist' ? ' selected' : '') + '>Specialist</option><option value="aios"' + (r.role === 'aios' ? ' selected' : '') + '>AIOS / ANIOS</option><option value="beheer"' + (r.role === 'beheer' ? ' selected' : '') + '>Planner</option><option value="dienst"' + (r.role === 'dienst' ? ' selected' : '') + '>Dienstplanner</option></select>' +
        '<label><input type="checkbox" data-share-right="' + p.id + '"' + (r.canShare ? ' checked' : '') + '> Notities delen</label>' +
        '<label><input type="checkbox" data-doetdienst="' + p.id + '"' + (r.doetDienst ? ' checked' : '') + '> Doet diensten</label>' +
        '<label>FTE <input type="number" min="0" max="1.2" step="0.05" data-right="' + p.id + '|fte" value="' + r.fte + '" style="width:4.2rem;min-height:40px;border-radius:8px;border:1px solid var(--line);background:var(--surface2);padding:0 .4rem"></label>' +
        [['werkdagen', 'Werkdagen p/w', 0.5], ['vakWeken', 'Vakantie (weken)', 1], ['sabbatical', 'Sabbatical (extra weken)', 1], ['conWeken', 'Congres (weken)', 1], ['vakAlD', 'Al opgenomen vakantie (dagen)', 0.5], ['conAlD', 'Al opgenomen congres (dagen)', 0.5]].map(function (f) {
          return '<label>' + f[1] + ' <input type="number" min="0" step="' + f[2] + '" data-right="' + p.id + '|' + f[0] + '" value="' + r[f[0]] + '" style="width:4.2rem;min-height:40px;border-radius:8px;border:1px solid var(--line);background:var(--surface2);padding:0 .4rem"></label>';
        }).join('') +
        '<span class="note" style="flex-basis:100%">Recht op: ' + fmtD(((r.vakWeken || 0) + (r.sabbatical || 0)) * r.werkdagen) + ' vakantie, ' + fmtD((r.conWeken || 0) * r.werkdagen) + ' congres</span>' +
        (profileLine(p.id) ? '<span class="note" style="flex-basis:100%">' + esc(profileLine(p.id)) + '</span>' : '') + '</div>';
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
    html += '<section class="card"><h2>Accounts</h2><p class="note" style="margin:0">Iedereen logt in met een eigen gebruikersnaam en wachtwoord (eerste keer: welkom). Reset zet het wachtwoord terug naar welkom.</p><div class="ppl">' +
      PEOPLE.concat([ADMIN]).map(function (p) { return '<div class="pp"><span class="nm">' + esc(p.name) + ' <span class="pill">' + esc(usernameOf(p.id)) + '</span></span><span class="note">' + (pwStore[p.id] ? 'eigen wachtwoord' : 'standaardwachtwoord') + '</span>' + (pwStore[p.id] && p.id !== 'ADMIN' ? '<button type="button" class="mini-btn" data-pwreset="' + p.id + '">Reset</button>' : '') + '</div>'; }).join('') + '</div>' +
      '<p class="note" style="margin:0">Demo: wachtwoorden staan alleen op dit toestel. Voor echte, gedeelde accounts is een server nodig.</p></section>';
    html += '<section class="card"><h2>Verbeterpunten</h2><p class="note" style="margin:0">' + (feedbackEmail() ? 'Gaan per e-mail naar het adres in config.js.' : 'Nog geen e-mailadres ingesteld in config.js; punten worden alleen in de app bewaard.') + ' ' + feedback.length + ' punt(en) op dit toestel.</p><button type="button" class="btn secondary" id="go-fb">Bekijk verbeterpunten</button></section>';
    html += '<section class="card"><h2>Gegevens</h2><div class="btn-row"><button type="button" class="btn secondary" id="export">Wijzigingen exporteren</button><button type="button" class="btn danger" id="reset">Demo resetten</button></div><p class="note">Exporteren maakt een bestand met alle aanpassingen, aanvragen en notities, bijvoorbeeld om later in de Excel te verwerken.</p></section>';
    main.innerHTML = html;
    bindReqButtons();
    main.querySelectorAll('[data-role]').forEach(function (s) { s.addEventListener('change', function () { rights[s.getAttribute('data-role')].role = s.value; persist(); toast('Rol aangepast'); }); });
    main.querySelectorAll('[data-right]').forEach(function (i) { i.addEventListener('change', function () { var a = i.getAttribute('data-right').split('|'); rights[a[0]][a[1]] = Math.max(0, +String(i.value).replace(',', '.') || 0); persist(); render(); toast('Aangepast'); }); });
    main.querySelectorAll('[data-doetdienst]').forEach(function (c) { c.addEventListener('change', function () { rights[c.getAttribute('data-doetdienst')].doetDienst = c.checked; persist(); }); });
    main.querySelectorAll('[data-share-right]').forEach(function (c) { c.addEventListener('change', function () { rights[c.getAttribute('data-share-right')].canShare = c.checked; persist(); }); });
    main.querySelectorAll('[data-undo]').forEach(function (b) { b.addEventListener('click', function () { var k = b.getAttribute('data-undo'); delete overrides.blocks[k]; delete overrides.procs[k]; persist(); render(); }); });
    main.querySelectorAll('[data-del-note]').forEach(function (b) { b.addEventListener('click', function () { notes = notes.filter(function (n) { return n.id !== b.getAttribute('data-del-note'); }); persist(); render(); }); });
    main.querySelectorAll('[data-pwreset]').forEach(function (b) { b.addEventListener('click', function () { delete pwStore[b.getAttribute('data-pwreset')]; persist(); render(); toast('Wachtwoord teruggezet naar welkom'); }); });
    document.getElementById('go-fb').addEventListener('click', function () { state.tab = 'feedback'; render(); });
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
  /* =========================================================
     Meldingen (in deze demo alleen op dit toestel)
     ========================================================= */
  function notify(to, text) {
    notifs.push({ id: 'm' + Date.now() + Math.random().toString(36).slice(2, 6), to: to, from: state.user, text: text, ts: Date.now(), read: false });
    if (notifs.length > 300) notifs = notifs.slice(-300);
    var forMe = to === state.user || (to === 'PLANNERS' && canApprove() && state.user !== 'ADMIN');
    if (forMe && 'Notification' in window && Notification.permission === 'granted') {
      try { new Notification('Roosterplanner', { body: text, icon: 'icons/icon-192.png' }); } catch (e) { /* niet ondersteund */ }
    }
  }
  function myNotifs() {
    return notifs.filter(function (n) { return n.to === state.user || (n.to === 'PLANNERS' && canApprove()) || (n.to === 'DIENST' && canPlanDuty()); }).sort(function (a, b) { return b.ts - a.ts; });
  }
  function ago(ts) {
    var m = Math.round((Date.now() - ts) / 60000);
    if (m < 1) return 'zojuist'; if (m < 60) return m + ' min geleden';
    var d = new Date(ts);
    if (iso(d) === iso(new Date())) return 'vandaag ' + fromMin(d.getHours() * 60 + d.getMinutes());
    return short(d);
  }

  /* =========================================================
     Tekorten en invallers
     ========================================================= */
  var FILL = { 'MCL OK': 'OK MCL', 'MCL POK': 'pok', 'MCL SU': 'su', 'Drachten': 'NS su', 'FK': 'FK su', 'Sneek': 'sneek/su', 'Totaal': 'su' };
  function gapsFor(r) {
    var out = [], d = parseIso(r.from), end = parseIso(r.to), guard = 0;
    while (d <= end && guard++ < 62) {
      if (weekday(d) < 5) for (var h = 0; h < 2; h++) {
        if (!covers(r, iso(d), h)) continue;
        var b = countsFor(d, h, null), a = countsFor(d, h, r), found = [];
        CHECKS.forEach(function (k) {
          var n = needFor(d, h, k);
          if ((b[k] || 0) >= n && (a[k] || 0) < n) found.push({ loc: k, need: n, have: a[k] || 0 });
        });
        var locs = found.filter(function (f) { return f.loc !== 'Totaal'; });
        (locs.length ? locs : found).forEach(function (f) {
          out.push({ id: 'g' + Date.now() + Math.random().toString(36).slice(2, 6), reqId: r.id, absent: r.person, reason: r.type.toLowerCase(), date: iso(d), half: h, loc: f.loc, need: f.need, have: f.have, status: 'open' });
        });
      }
      d = addDays(d, 1);
    }
    return out;
  }
  function addGaps(list) { gaps = gaps.concat(list); }
  function openGapsOn(di) { return gaps.filter(function (g) { return g.date === di && g.status === 'open'; }); }
  var WARN_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/></svg>';
  function gapBanner() {
    if (!canApprove()) return '';
    var n = gaps.filter(function (g) { return g.status === 'open' && g.date >= iso(new Date()); }).length;
    if (!n) return '';
    return '<button type="button" class="banner" data-gaps="all"><span style="display:flex;align-items:center;gap:.5rem">' + WARN_SVG + n + ' open tekort' + (n > 1 ? 'en' : '') + ' in de bezetting</span><span>Oplossen ›</span></button>';
  }
  function gapCards(di) {
    if (!canApprove()) return '';
    var list = gaps.filter(function (g) { return g.date === di; });
    if (!list.length) return '';
    return '<div class="list">' + list.map(function (g) {
      var head = LOC_NAMES[g.loc] + ' · ' + HALVES[g.half].toLowerCase();
      if (g.status === 'filled') return '<div class="gap-card done"><b>Opgelost: ' + esc(head) + '</b><span class="sm">' + esc(person(g.fill).name) + ' valt in voor ' + esc(person(g.absent).name) + '</span></div>';
      if (g.status === 'noted') return '<div class="gap-card done"><b>Afgehandeld: ' + esc(head) + '</b><span class="sm">' + esc(g.note) + '</span></div>';
      return '<div class="gap-card"><b>Tekort: ' + esc(head) + ' (' + g.have + ' van ' + g.need + ')</b><span class="sm">Door ' + esc(g.reason) + ' van ' + esc(person(g.absent).name) + '</span><button type="button" class="btn" data-gaps="' + di + '">Invaller kiezen of notitie</button></div>';
    }).join('') + '</div>';
  }
  function candidates(g) {
    var d = parseIso(g.date), c = countsFor(d, g.half, null), grp = person(g.absent).group, out = [];
    PEOPLE.forEach(function (p) {
      if (p.id === g.absent) return;
      var s = slot(p, d, g.half);
      if (s.absent) return;
      var l = locOf(s.text);
      if (!l) out.push({ p: p, score: s.text ? 1 : 0, why: s.text ? 'Nu: ' + s.text + ' (geen patiëntenzorg)' : 'Niet ingeroosterd' });
      else if (g.loc !== 'Totaal' && l !== g.loc && l !== 'Elders' && l !== 'FK' && (c[l] || 0) > needFor(d, g.half, l)) out.push({ p: p, score: 2, why: 'Nu: ' + s.text + ' · ' + LOC_NAMES[l] + ' heeft er ' + ((c[l] || 0) - needFor(d, g.half, l)) + ' extra' });
    });
    out.sort(function (a, b) { return a.score - b.score || ((b.p.group === grp) - (a.p.group === grp)); });
    return out.slice(0, 6);
  }
  function openGaps(filter, title) {
    var ui = { open: null, note: null };
    function draw() {
      var list = gaps.filter(filter).sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : a.half - b.half; });
      var html = list.length ? '' : '<p class="empty">Geen tekorten.</p>';
      list.forEach(function (g) {
        var d = parseIso(g.date), head = LOC_NAMES[g.loc] + ' · ' + short(d) + ' ' + HALVES[g.half].toLowerCase();
        html += '<div class="gap-card' + (g.status !== 'open' ? ' done' : '') + '"><b>' + esc(head) + '</b>';
        if (g.status === 'open') {
          html += '<span class="sm">' + g.have + ' van ' + g.need + ' · door ' + esc(g.reason) + ' van ' + esc(person(g.absent).name) + '</span>' +
            '<div class="btn-row"><button type="button" class="btn" data-cand="' + g.id + '">Kies invaller</button><button type="button" class="btn secondary" data-gnote="' + g.id + '">Notitie</button></div>';
          if (ui.open === g.id) {
            var cs = candidates(g);
            html += '<div class="cands">' + (cs.length ? cs.map(function (c) {
              return '<button type="button" class="cand" data-fill="' + g.id + '|' + c.p.id + '"><span>' + esc(c.p.name) + ' <small>' + esc(c.why) + '</small></span><span class="go">Inzetten</span></button>';
            }).join('') : '<p class="sm">Geen vrije collega gevonden.</p>') +
              '<button type="button" class="btn secondary" data-manual="' + g.id + '">Zelf iemand inplannen…</button></div>';
          }
          if (ui.note === g.id) html += '<label class="f">Notitie voor dit tekort<textarea id="gn-' + g.id + '" rows="2" maxlength="300" placeholder="Bijv. spreekuur verplaatst, OK-programma ingekort"></textarea></label><button type="button" class="btn" data-gsave="' + g.id + '">Opslaan als afgehandeld</button>';
        } else if (g.status === 'filled') {
          html += '<span class="sm">' + esc(person(g.fill).name) + ' valt in voor ' + esc(person(g.absent).name) + '</span><button type="button" class="mini-btn" style="align-self:flex-start" data-unfill="' + g.id + '">Ongedaan maken</button>';
        } else {
          html += '<span class="sm">Notitie: ' + esc(g.note) + '</span><button type="button" class="mini-btn" style="align-self:flex-start" data-reopen="' + g.id + '">Heropenen</button>';
        }
        html += '</div>';
      });
      openSheet(title, html, function (root) {
        function byId(id) { return gaps.filter(function (x) { return x.id === id; })[0]; }
        root.querySelectorAll('[data-cand]').forEach(function (b) { b.addEventListener('click', function () { ui.open = ui.open === b.getAttribute('data-cand') ? null : b.getAttribute('data-cand'); ui.note = null; draw(); }); });
        root.querySelectorAll('[data-gnote]').forEach(function (b) { b.addEventListener('click', function () { ui.note = b.getAttribute('data-gnote'); ui.open = null; draw(); var ta = document.getElementById('gn-' + ui.note); if (ta) ta.focus(); }); });
        root.querySelectorAll('[data-fill]').forEach(function (b) {
          b.addEventListener('click', function () {
            var a = b.getAttribute('data-fill').split('|'), g = byId(a[0]), pid = a[1], k = keyOf(pid, g.date, g.half);
            g.prevText = Object.prototype.hasOwnProperty.call(overrides.blocks, k) ? overrides.blocks[k] : null;
            overrides.blocks[k] = FILL[g.loc] + ' (invaller)';
            notes.push({ id: 'n' + Date.now(), key: k, author: state.user, text: 'Invaller voor ' + person(g.absent).name + ' (' + g.reason + ')', shared: true, ts: Date.now() });
            g.status = 'filled'; g.fill = pid;
            notify(pid, 'Je bent ingepland als invaller: ' + LOC_NAMES[g.loc] + ' · ' + short(parseIso(g.date)) + ' ' + HALVES[g.half].toLowerCase());
            persist(); render(); ui.open = null; draw(); toast(person(pid).name + ' ingepland en op de hoogte gebracht');
          });
        });
        root.querySelectorAll('[data-manual]').forEach(function (b) { b.addEventListener('click', function () { var g = byId(b.getAttribute('data-manual')); openPlan([], g.date, g.half, FILL[g.loc]); }); });
        root.querySelectorAll('[data-gsave]').forEach(function (b) {
          b.addEventListener('click', function () {
            var g = byId(b.getAttribute('data-gsave')), v = (document.getElementById('gn-' + g.id).value || '').trim(); if (!v) return;
            g.status = 'noted'; g.note = v.slice(0, 300); persist(); render(); ui.note = null; draw();
          });
        });
        root.querySelectorAll('[data-unfill]').forEach(function (b) {
          b.addEventListener('click', function () {
            var g = byId(b.getAttribute('data-unfill')), k = keyOf(g.fill, g.date, g.half);
            if (g.prevText == null) delete overrides.blocks[k]; else overrides.blocks[k] = g.prevText;
            notes = notes.filter(function (n) { return !(n.key === k && /^Invaller voor/.test(n.text)); });
            notify(g.fill, 'Invalbeurt vervallen: ' + LOC_NAMES[g.loc] + ' · ' + short(parseIso(g.date)) + ' ' + HALVES[g.half].toLowerCase());
            g.status = 'open'; delete g.fill; persist(); render(); draw();
          });
        });
        root.querySelectorAll('[data-reopen]').forEach(function (b) { b.addEventListener('click', function () { var g = byId(b.getAttribute('data-reopen')); g.status = 'open'; delete g.note; persist(); render(); draw(); }); });
      });
    }
    draw();
  }

  /* =========================================================
     Inplannen door planner of beheerder
     ========================================================= */
  var PLAN_ACTS = [['OK MCL', 'OK 3 · MCL'], ['OK 10', 'OK 10 · MCL'], ['combi OK', 'Combi OK · MCL'], ['pok', 'POK · MCL'], ['su', 'Spreekuur · MCL'],
    ['FK su', 'Spreekuur · Friesland Kliniek'], ['FK OK', 'OK · Friesland Kliniek'], ['FK pok', 'POK · Friesland Kliniek'], ['NS OK', 'OK · Nij Smellinghe'], ['NS pok', 'POK · Nij Smellinghe'],
    ['sneek/su', 'Sneek'], ['visite', 'Visite'], ['overleg', 'Overleg / vergadering'], ['onderwijs', 'Onderwijs'], ['AO', 'AO'], ['', 'Anders…']];
  function openPlanChoice(pid, dIso, half) {
    var html = '<div class="list"><button type="button" class="btn" id="pc-appt">Afspraak toevoegen</button>' +
      (canApprove() ? '<button type="button" class="btn secondary" id="pc-plan">Activiteit inplannen</button>' : '') +
      '<button type="button" class="btn secondary" id="pc-abs">' + (canApprove() ? 'Afwezigheid vastleggen' : 'Vrij vragen') + '</button></div>';
    openSheet('Wat wil je toevoegen?', html, function (root) {
      root.querySelector('#pc-appt').addEventListener('click', function () { openAppt(pid, dIso, half); });
      var pl = root.querySelector('#pc-plan'); if (pl) pl.addEventListener('click', function () { openPlan(pid ? [pid] : [], dIso, half); });
      root.querySelector('#pc-abs').addEventListener('click', function () { openRequest(pid, dIso, 'dag'); });
    });
  }
  function openPlan(pids, dIso, half, presetText) {
    var known = PLAN_ACTS.some(function (a) { return a[0] === presetText; });
    var html = '<div class="card"><h3>Wie</h3><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.1rem .6rem">' + PEOPLE.map(function (p) {
      return '<label class="toggle" style="min-height:40px;justify-content:flex-start;gap:.5rem"><input type="checkbox" data-pp="' + p.id + '"' + (pids.indexOf(p.id) >= 0 ? ' checked' : '') + '>' + esc(p.name) + '</label>';
    }).join('') + '</div></div>' +
      '<div class="grid2"><label class="f">Datum<input type="date" id="pl-date" value="' + dIso + '"></label>' +
      '<label class="f">Dagdeel<select id="pl-half"><option value="0"' + (half === 0 ? ' selected' : '') + '>Ochtend</option><option value="1"' + (half === 1 ? ' selected' : '') + '>Middag</option><option value="2">Hele dag</option></select></label></div>' +
      '<label class="f">Activiteit<select id="pl-act">' + PLAN_ACTS.map(function (a) { return '<option value="' + esc(a[0]) + '"' + ((known && a[0] === presetText) || (!known && presetText && a[0] === '') ? ' selected' : '') + '>' + esc(a[1]) + '</option>'; }).join('') + '</select></label>' +
      '<label class="f" id="pl-custom-wrap"' + (!known && presetText ? '' : ' hidden') + '>Eigen omschrijving<input id="pl-custom" maxlength="60" value="' + esc(!known && presetText ? presetText : '') + '"></label>' +

      '<label class="f">Notitie voor iedereen (optioneel)<input id="pl-note" maxlength="200" placeholder="Bijv. extra OK-dag i.v.m. wachtlijst"></label>' +
      '<p class="note" id="pl-prev"></p>' +
      '<label class="toggle">Betrokkenen een melding sturen<input type="checkbox" id="pl-notify" checked></label>' +
      '<button type="button" class="btn" id="pl-save">Inplannen</button>';
    openSheet('Inplannen', html, function (root) {
      function vals() {
        var sel = [].slice.call(root.querySelectorAll('[data-pp]:checked')).map(function (c) { return c.getAttribute('data-pp'); });
        var act = root.querySelector('#pl-act').value, text = act || root.querySelector('#pl-custom').value.trim();
        var h = +root.querySelector('#pl-half').value;
        return { pids: sel, date: root.querySelector('#pl-date').value, halves: h === 2 ? [0, 1] : [h], text: text };
      }
      function preview() {
        root.querySelector('#pl-custom-wrap').hidden = root.querySelector('#pl-act').value !== '';
        var v = vals(), el = root.querySelector('#pl-prev');
        if (!v.date || !v.pids.length || !v.text) { el.textContent = 'Kies minstens één persoon en een activiteit.'; return; }
        var d = parseIso(v.date);
        if (weekday(d) > 4) { el.textContent = 'Dit is een weekend: kies een werkdag.'; return; }
        el.textContent = v.pids.map(function (pid) {
          return person(pid).name + ': ' + v.halves.map(function (h) { var s = slot(person(pid), d, h); return HALVES[h].toLowerCase() + ' ' + (s.absent ? s.absent.type.toLowerCase() : (s.text || 'leeg')) + ' → ' + v.text; }).join(', ');
        }).join(' · ');
      }
      root.querySelectorAll('input,select').forEach(function (i) { i.addEventListener('change', preview); i.addEventListener('input', preview); });
      preview();
      root.querySelector('#pl-save').addEventListener('click', function () {
        var v = vals(); if (!v.date || !v.pids.length || !v.text) { preview(); return; }
        var d = parseIso(v.date); if (weekday(d) > 4) { preview(); return; }
        var planId = 'plan' + Date.now(), procLines = [];
        var noteText = root.querySelector('#pl-note').value.trim(), doNotify = root.querySelector('#pl-notify').checked, newGaps = [];
        v.halves.forEach(function (h) {
          var before = countsFor(d, h, null), prevLoc = {};
          v.pids.forEach(function (pid) { prevLoc[pid] = locOf(slot(person(pid), d, h).text); });
          v.pids.forEach(function (pid) {
            var k = keyOf(pid, v.date, h), old = slot(person(pid), d, h).text;
            overrides.blocks[k] = v.text;
            if (procLines.length) overrides.procs[k] = procLines.map(function (l) { var m = l.match(/^(\d{1,2}[:.]\d{2})\s+(.*)$/); return m ? { time: m[1].replace('.', ':'), name: m[2] } : { time: '', name: l }; });
            else delete overrides.procs[k];
            if (noteText) notes.push({ id: 'n' + Date.now() + pid, key: k, author: state.user, text: noteText, shared: true, ts: Date.now() });
            if (doNotify && pid !== state.user) notify(pid, 'Nieuw ingepland door ' + person(state.user).name + ': ' + v.text + ' · ' + short(d) + ' ' + HALVES[h].toLowerCase() + (old && old !== v.text ? ' (was: ' + old + ')' : ''));
          });
          var after = countsFor(d, h, null);
          CHECKS.forEach(function (k2) {
            var n = needFor(d, h, k2);
            if (k2 === 'Totaal' || !((before[k2] || 0) >= n && (after[k2] || 0) < n)) return;
            var moved = v.pids.filter(function (pid) { return prevLoc[pid] === k2; })[0] || v.pids[0];
            newGaps.push({ id: 'g' + Date.now() + Math.random().toString(36).slice(2, 6), reqId: planId, absent: moved, reason: 'herplanning', date: v.date, half: h, loc: k2, need: n, have: after[k2] || 0, status: 'open' });
          });
        });
        addGaps(newGaps);
        if (doNotify) notify('PLANNERS', person(state.user).name + ' plande ' + v.text + ' in voor ' + v.pids.map(function (x) { return person(x).name; }).join(', ') + ' · ' + short(d));
        persist(); render();
        if (newGaps.length) openGaps(function (g) { return g.reqId === planId; }, 'Ingepland · ' + newGaps.length + ' nieuw tekort');
        else { closeSheet(); toast('Ingepland' + (doNotify ? ' en betrokkenen op de hoogte gebracht' : '')); }
      });
    });
  }

  /* =========================================================
     Profiel en instellingen
     ========================================================= */
  var PROFILE_FIELDS = [['naam', 'Naam', 'Je volledige naam', 'name', 'text'], ['email', 'E-mail', 'naam@voorbeeld.nl', 'email', 'email'], ['mobiel', '06-nummer', '06 12345678', 'tel', 'tel']];
  function contactOf(pid) {
    if (!(canApprove() || pid === state.user)) return '';
    var pr = profiles[pid] || {}, bits = [];
    if (pr.mobiel) bits.push(pr.mobiel); if (pr.email) bits.push(pr.email);
    return bits.length ? ' · ' + bits.join(' · ') : '';
  }
  function profileLine(pid) {
    var pr = profiles[pid] || {}, bits = [];
    PROFILE_FIELDS.forEach(function (f) { if (pr[f[0]]) bits.push(f[1] + ': ' + pr[f[0]]); });
    return bits.join(' · ');
  }
  function openProfile() {
    var me = person(state.user), pr = profiles[state.user] || {}, list = myNotifs().slice(0, 15);
    var html = '<div class="profile-head"><span class="big">' + esc(isAdmin() ? '★' : me.id) + '</span><div><b style="font-size:1.1rem">' + esc(me.name) + '</b><div class="note">' + esc(me.group + ' · ' + roleLabel(me.id) + ' · ' + usernameOf(me.id)) + '</div></div></div>' +
      '<div class="card"><h3>Meldingen</h3>' + (list.length ? '<div class="notes">' + list.map(function (n) {
        return '<div class="note-item' + (n.read ? '' : ' shared') + '"><span>' + esc(n.text) + '</span><span class="by"><span>' + esc(ago(n.ts)) + '</span>' + (n.read ? '' : '<span class="pill">nieuw</span>') + '</span></div>';
      }).join('') + '</div>' : '<p class="empty">Geen meldingen.</p>') + '</div>';
    if (!isAdmin()) html += '<div class="card"><h3>Vakantie- en congresdagen</h3>' + saldoHtml(state.user) + '</div>';
    html += '<div class="card"><h3>Over mij</h3><p class="note" style="margin:0">Zichtbaar voor de planner en de beheerder.</p>' + PROFILE_FIELDS.map(function (f) {
      return '<label class="f">' + esc(f[1]) + '<input data-pf="' + f[0] + '" type="' + f[4] + '" autocomplete="' + f[3] + '" maxlength="80" value="' + esc(pr[f[0]] || '') + '" placeholder="' + esc(f[2]) + '"></label>';
    }).join('') + '<button type="button" class="btn" id="pf-save">Opslaan</button></div>' +
      '<div class="card"><h3>Wachtwoord wijzigen</h3><label class="f">Huidig wachtwoord<input type="password" id="pw-old" autocomplete="current-password"></label>' +
      '<label class="f">Nieuw wachtwoord<input type="password" id="pw-new" autocomplete="new-password" minlength="6"></label>' +
      '<label class="f">Herhaal nieuw wachtwoord<input type="password" id="pw-rep" autocomplete="new-password"></label><p class="impact" id="pw-err"></p>' +
      '<button type="button" class="btn secondary" id="pw-save">Wachtwoord opslaan</button></div>' +
      '<div class="btn-row"><button type="button" class="btn secondary" id="pf-settings">Instellingen</button><button type="button" class="btn danger" id="pf-logout">Uitloggen</button></div>';
    openSheet('Mijn profiel', html, function (root) {
      root.querySelector('#pf-save').addEventListener('click', function () {
        var o = {}; root.querySelectorAll('[data-pf]').forEach(function (i) { var v = i.value.trim(); if (v) o[i.getAttribute('data-pf')] = v; });
        if (o.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(o.email)) { toast('Controleer je e-mailadres'); return; }
        profiles[state.user] = o; applyNames(); persist(); render(); toast('Profiel opgeslagen');
      });
      root.querySelector('#pw-save').addEventListener('click', function () {
        var err = root.querySelector('#pw-err'), o = root.querySelector('#pw-old').value, n1 = root.querySelector('#pw-new').value, n2 = root.querySelector('#pw-rep').value;
        if (n1.length < 6) { err.textContent = 'Kies minstens 6 tekens.'; return; }
        if (n1 !== n2) { err.textContent = 'De nieuwe wachtwoorden zijn niet gelijk.'; return; }
        checkPw(state.user, o).then(function (ok) {
          if (!ok) { err.textContent = 'Huidig wachtwoord klopt niet.'; return; }
          return sha(state.user + ':' + n1).then(function (h) { pwStore[state.user] = h; persist(); err.textContent = ''; root.querySelectorAll('input[type=password]').forEach(function (i) { i.value = ''; }); toast('Wachtwoord gewijzigd'); });
        });
      });
      root.querySelector('#pf-settings').addEventListener('click', function () { openSettings(); });
      root.querySelector('#pf-logout').addEventListener('click', logout);
    });
    myNotifs().forEach(function (n) { n.read = true; });
    persist(); render();
  }

  var COLOR_KEYS = [['tint', 'Accentkleur (knoppen)', '--tint'], ['OK', 'OK', '--OK-bar'], ['POK', 'Poliklinische OK', '--POK-bar'], ['SU', 'Spreekuur', '--SU-bar'],
    ['FK', 'Friesland Kliniek en Sneek', '--FK-bar'], ['VS', 'Visite en spoed', '--VS-bar'], ['OV', 'Ad en Org, wetenschap, opleiding', '--OV-bar'], ['AF', 'Afwezig', '--AF-bar']];
  function toHex(v) {
    v = (v || '').trim();
    if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(v)) return ('#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3]).toLowerCase();
    return '#888888';
  }
  function openSettings(focus) {
    var fonts = [['systeem', 'Systeem'], ['rond', 'Rond'], ['klassiek', 'Klassiek'], ['leesbaar', 'Extra leesbaar']];
    var themes = [['auto', 'Automatisch'], ['light', 'Licht'], ['dark', 'Donker']];
    var cs = getComputedStyle(document.documentElement), mine = prefs.colors[state.user] || {};
    var perm = 'Notification' in window ? Notification.permission : 'unsupported';
    var html = '<div class="card" id="set-colors"><h3>Mijn kleuren</h3><p class="note" style="margin:0">Alleen voor jouw account op dit toestel.</p><div class="colors">' + COLOR_KEYS.map(function (c) {
      var val = toHex(mine[c[0]] || cs.getPropertyValue(c[2]));
      var prev = c[0] === 'tint' ? '<span class="prev" style="background:var(--tint);color:var(--on-tint)">Knop</span>' : '<span class="prev t-' + c[0] + '"><span class="code">' + c[0] + '</span></span>';
      return '<div class="color-row"><span class="sw">' + prev + '<span>' + esc(c[1]) + '</span></span><input type="color" data-color="' + c[0] + '" value="' + val + '" aria-label="Kleur voor ' + esc(c[1]) + '"></div>';
    }).join('') + '</div><button type="button" class="btn secondary" id="set-reset">Standaardkleuren</button></div>' +
      '<div class="card"><h3>Weergave</h3><div class="seg" role="group" aria-label="Thema">' + themes.map(function (t) { return '<button type="button" data-theme-opt="' + t[0] + '" aria-selected="' + (prefs.theme === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<label class="toggle">Zachte kleuren (minder hard contrast)<input type="checkbox" id="set-tone"' + ((prefs.tone || 'zacht') === 'zacht' ? ' checked' : '') + '></label></div>' +
      '<div class="card" id="set-text"><h3>Lettertype</h3><div class="opts">' + fonts.map(function (f) { return '<button type="button" data-font-opt="' + f[0] + '" aria-pressed="' + (prefs.font === f[0]) + '" style="font-family:' + ({ systeem: '-apple-system,sans-serif', rond: 'ui-rounded,\'SF Pro Rounded\',sans-serif', klassiek: 'ui-serif,Georgia,serif', leesbaar: 'Verdana,sans-serif' }[f[0]]) + '">' + f[1] + '</button>'; }).join('') + '</div>' +
      '<h3>Tekstgrootte</h3><div class="size-row"><span class="a1" aria-hidden="true">A</span><input type="range" id="size" min="0.85" max="1.4" step="0.05" value="' + prefs.scale + '" aria-label="Tekstgrootte"><span class="a2" aria-hidden="true">A</span></div><p class="note" id="size-val" style="margin:0">' + Math.round(prefs.scale * 100) + '%</p></div>' +
      '<div class="card"><h3>Meldingen op dit toestel</h3><p class="note" style="margin:0">' + ({ granted: 'Aan.', denied: 'Geblokkeerd in de instellingen van je telefoon of browser.', 'default': 'Nog niet ingesteld.', unsupported: 'Niet ondersteund in deze browser. Op de iPhone werkt het alleen als de app op het beginscherm staat (iOS 16.4 of nieuwer).' }[perm]) + '</p>' +
      (perm === 'default' ? '<button type="button" class="btn secondary" id="set-notif">Meldingen toestaan</button>' : '') + '</div>';
    html += '<p class="note" style="text-align:center">Versie ' + APP_VERSION + '</p>';
    openSheet('Instellingen', html, function (root) {
      root.querySelectorAll('[data-color]').forEach(function (i) {
        i.addEventListener('input', function () {
          var all = prefs.colors[state.user] || (prefs.colors[state.user] = {});
          all[i.getAttribute('data-color')] = i.value; persist(); applyPrefs();
        });
        i.addEventListener('change', function () { render(); });
      });
      root.querySelector('#set-reset').addEventListener('click', function () { delete prefs.colors[state.user]; persist(); applyPrefs(); render(); openSettings(); });
      root.querySelectorAll('[data-theme-opt]').forEach(function (b) { b.addEventListener('click', function () { prefs.theme = b.getAttribute('data-theme-opt'); persist(); applyPrefs(); openSettings(); }); });
      root.querySelectorAll('[data-font-opt]').forEach(function (b) { b.addEventListener('click', function () { prefs.font = b.getAttribute('data-font-opt'); persist(); applyPrefs(); openSettings('tekst'); }); });
      root.querySelector('#set-tone').addEventListener('change', function (e) { prefs.tone = e.target.checked ? 'zacht' : 'standaard'; persist(); applyPrefs(); });
      root.querySelector('#size').addEventListener('input', function (e) { prefs.scale = +e.target.value; root.querySelector('#size-val').textContent = Math.round(prefs.scale * 100) + '%'; persist(); applyPrefs(); });
      var nb = root.querySelector('#set-notif');
      if (nb) nb.addEventListener('click', function () { Notification.requestPermission().then(function () { openSettings(); }); });
      if (focus === 'tekst') { var tx = root.querySelector('#set-text'); if (tx) setTimeout(function () { tx.scrollIntoView({ block: 'start' }); }, 30); }
    });
  }

  /* ---------- inloggen (demo: wachtwoorden staan alleen op dit toestel) ---------- */
  function sha(text) {
    if (!(window.crypto && crypto.subtle)) return Promise.resolve('plain:' + text);
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }
  function checkPw(id, pw) {
    if (!pwStore[id]) return Promise.resolve(pw === defaultPw(id));
    return sha(id + ':' + pw).then(function (h) { return h === pwStore[id]; });
  }
  function idForUsername(u) {
    u = (u || '').trim().toLowerCase();
    var all = PEOPLE.concat([ADMIN]);
    for (var i = 0; i < all.length; i++) if (usernameOf(all[i].id) === u) return all[i].id;
    return null;
  }
  function renderLogin() {
    document.body.classList.add('logged-out');
    var last = load('rp.lastUser', '');
    main.innerHTML = '<div class="login"><form class="login-card" id="login-form" novalidate>' +
      '<img class="logo" src="icons/icon-192.png" alt=""><h1>Roosterplanner</h1><p class="note" style="text-align:center;margin:0">Log in met je eigen account</p>' +
      '<label class="f">Gebruikersnaam<input id="lg-user" autocomplete="username" autocapitalize="none" spellcheck="false" value="' + esc(last) + '" placeholder="bijv. chirurg-a"></label>' +
      '<label class="f">Wachtwoord<input id="lg-pw" type="password" autocomplete="current-password"></label>' +
      '<p class="impact" id="lg-err" role="alert"></p><button type="submit" class="btn">Inloggen</button>' +
      '<details><summary>Demo-accounts</summary><p style="margin:.4rem 0">Gebruikersnamen: <b>chirurg-a</b> t/m <b>chirurg-h</b>, <b>aios-1</b> t/m <b>aios-6</b>, <b>anios-1</b> en <b>beheerder</b>.</p>' +
      '<p style="margin:.4rem 0">Wachtwoord bij eerste keer: <b>welkom</b> (beheerder: <b>1234</b>). Wijzig het daarna via je profiel. Chirurg E is planner.</p>' +
      '<p class="note" style="margin:.4rem 0 0">Demo: wachtwoorden worden alleen op dit toestel bewaard en zijn geen echte beveiliging.</p></details></form></div>';
    var f = document.getElementById('login-form');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var u = document.getElementById('lg-user').value, pw = document.getElementById('lg-pw').value, err = document.getElementById('lg-err');
      var id = idForUsername(u);
      if (!id) { err.textContent = 'Onbekende gebruikersnaam.'; return; }
      checkPw(id, pw).then(function (ok) {
        if (!ok) { err.textContent = 'Wachtwoord klopt niet.'; return; }
        save('rp.lastUser', usernameOf(id)); login(id);
      });
    });
    setTimeout(function () { var el = document.getElementById(last ? 'lg-pw' : 'lg-user'); if (el) el.focus(); }, 50);
  }
  function login(id) {
    state.user = id; state.viewPid = null; save('rp.user', id);
    state.tab = id === 'ADMIN' ? 'beheer' : 'agenda'; state.cursor = startOfDay(new Date());
    save('rp.tab', state.tab); closeSheet(); document.body.classList.remove('logged-out'); render();
    toast('Welkom, ' + person(id).name);
  }
  function logout() { state.user = null; save('rp.user', null); closeSheet(); render(); }
  function openWho() { logout(); }

  /* ---------- verbeterpunten (gaan alleen naar de beheerder) ---------- */
  function feedbackEmail() {
    if (CONFIG.feedbackEmailB64) { try { return atob(CONFIG.feedbackEmailB64).trim(); } catch (e) { /* ongeldig */ } }
    return (CONFIG.feedbackEmail || '').trim();
  }
  function renderFeedback() {
    var to = feedbackEmail(), mine = feedback.filter(function (f) { return isAdmin() || f.by === state.user; }).sort(function (a, b) { return b.ts - a.ts; });
    var html = '<section class="card"><h2>Verbeterpunt of opmerking</h2><p class="note" style="margin:0">Je bericht gaat alleen naar de beheerder van het planprogramma.</p>' +
      '<div class="opts" role="group" aria-label="Soort">' + ['Verbetering', 'Fout', 'Vraag', 'Anders'].map(function (k, i) { return '<button type="button" data-fb="' + k + '" aria-pressed="' + (i === 0) + '">' + k + '</button>'; }).join('') + '</div>' +
      '<label class="f">Onderwerp<input id="fb-subj" maxlength="80" placeholder="Bijv. weekweergave op de computer"></label>' +
      '<label class="f">Toelichting<textarea id="fb-text" rows="5" maxlength="2000" placeholder="Wat werkt niet of wat mis je? Hoe zou het beter kunnen?"></textarea></label>' +
      '<button type="button" class="btn" id="fb-send">Versturen naar beheerder</button>' +
      (to ? '<p class="note" style="margin:0">Je e-mailapp opent met het bericht klaar om te versturen.</p>' : '<p class="warn">Er is nog geen e-mailadres van de beheerder ingesteld; het bericht wordt voorlopig alleen in de app bewaard.</p>') + '</section>';
    html += '<section class="card"><h2>' + (isAdmin() ? 'Alle verbeterpunten (op dit toestel)' : 'Mijn verzonden punten') + '</h2>' + (mine.length ? '<div class="notes">' + mine.map(function (f) {
      return '<div class="note-item"><span><b>' + esc(f.kind + ': ' + f.subject) + '</b></span><span>' + esc(f.text) + '</span><span class="by"><span>' + esc((isAdmin() ? (person(f.by) ? person(f.by).name + ' · ' : '') : '') + ago(f.ts)) + '</span>' + (isAdmin() ? '<button type="button" class="mini-btn" data-fbdel="' + f.id + '">Afgehandeld</button>' : '') + '</span></div>';
    }).join('') + '</div>' : '<p class="empty">Nog niets verstuurd.</p>') + '</section>';
    main.innerHTML = html;
    var kind = 'Verbetering';
    main.querySelectorAll('[data-fb]').forEach(function (b) { b.addEventListener('click', function () { kind = b.getAttribute('data-fb'); main.querySelectorAll('[data-fb]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }); });
    main.querySelectorAll('[data-fbdel]').forEach(function (b) { b.addEventListener('click', function () { feedback = feedback.filter(function (f) { return f.id !== b.getAttribute('data-fbdel'); }); persist(); render(); }); });
    document.getElementById('fb-send').addEventListener('click', function () {
      var subj = document.getElementById('fb-subj').value.trim(), text = document.getElementById('fb-text').value.trim();
      if (!subj || !text) { toast('Vul een onderwerp en toelichting in'); return; }
      var me = person(state.user), pr = profiles[state.user] || {};
      feedback.push({ id: 'f' + Date.now(), by: state.user, kind: kind, subject: subj, text: text, ts: Date.now() });
      persist();
      if (to) {
        var body = text + '\n\n—\nVan: ' + me.name + ' (' + usernameOf(me.id) + ')' + (pr.email ? '\nE-mail: ' + pr.email : '') + (pr.mobiel ? '\n06: ' + pr.mobiel : '') + '\nApp-versie: ' + new Date().toISOString().slice(0, 10);
        window.location.href = 'mailto:' + encodeURIComponent(to).replace('%40', '@') + '?subject=' + encodeURIComponent('[Roosterplanner] ' + kind + ': ' + subj) + '&body=' + encodeURIComponent(body);
      }
      render(); toast(to ? 'E-mail klaargezet' : 'Bewaard voor de beheerder');
    });
  }

  /* ---------- widgets (computerweergave) ---------- */
  var WIDGETS = {
    vandaag: { title: 'Vandaag', who: 'all' },
    mini: { title: 'Kalender', who: 'all' },
    meldingen: { title: 'Meldingen', who: 'all' },
    saldo: { title: 'Vakantie en congres', who: 'staff' },
    aanvragen: { title: 'Open aanvragen', who: 'planner' },
    tekorten: { title: 'Open tekorten', who: 'planner' },
    team: { title: 'Team vandaag', who: 'planner' },
    notities: { title: 'Mijn notities', who: 'all' }
  };
  function widgetAllowed(k) { var w = WIDGETS[k].who; return w === 'all' || (w === 'planner' && canApprove()) || (w === 'staff' && !isAdmin()); }
  function widgetCfg() {
    var c = prefs.widgets[state.user];
    if (!c) c = prefs.widgets[state.user] = { list: canApprove() ? ['vandaag', 'tekorten', 'aanvragen', 'mini', 'meldingen'] : ['vandaag', 'mini', 'saldo', 'meldingen'], closed: {} };
    c.list = c.list.filter(function (k) { return WIDGETS[k] && widgetAllowed(k); });
    return c;
  }
  function widgetBody(k) {
    var todayD = startOfDay(new Date()), ti = iso(todayD);
    if (k === 'vandaag') {
      if (isAdmin()) return '<p class="empty">Je bent ingelogd als beheerder.</p>';
      var me = person(state.user);
      if (weekday(todayD) > 4) return '<p class="empty">Weekend.</p>';
      return [0, 1].map(function (h) { var s = slot(me, todayD, h), ab = s.absent || s.pending; return '<div class="w-row"><span>' + HALVES[h] + '</span><b>' + esc((s.text || '–') + (ab ? ' · ' + ab.type + (ab.status !== 'approved' ? '?' : '') : '')) + '</b></div>'; }).join('');
    }
    if (k === 'mini') {
      var cur = state.cursor, first = new Date(cur.getFullYear(), cur.getMonth(), 1), st = mondayOf(first), h2 = '<div class="note" style="text-align:center;font-weight:700">' + MONTHS_LONG[cur.getMonth()] + ' ' + cur.getFullYear() + '</div><div class="mini-cal">' + DAYS.map(function (x) { return '<span>' + x[0] + '</span>'; }).join('');
      for (var i = 0; i < 42; i++) { var d = addDays(st, i); if (i >= 35 && d.getMonth() !== cur.getMonth()) break; h2 += '<button type="button" data-wgo="' + iso(d) + '" class="' + (d.getMonth() !== cur.getMonth() ? 'out ' : '') + (iso(d) === ti ? 'today ' : '') + (iso(d) === iso(cur) ? 'sel' : '') + '">' + d.getDate() + '</button>'; }
      return h2 + '</div>';
    }
    if (k === 'meldingen') { var ns = myNotifs().slice(0, 5); return ns.length ? ns.map(function (n) { return '<div class="w-row"><span>' + esc(n.text) + '</span></div>'; }).join('') : '<p class="empty">Geen meldingen.</p>'; }
    if (k === 'saldo') return saldoHtml(state.user);
    if (k === 'aanvragen') {
      var pend = requests.filter(function (r) { return r.status === 'pending' && r.person !== state.user; }).slice(0, 6);
      return pend.length ? pend.map(function (r) { return '<div class="w-row"><span>' + esc(person(r.person).name + ' · ' + r.type + ' ' + short(parseIso(r.from))) + '</span><button type="button" class="mini-btn" data-wabs="' + r.id + '">Bekijk</button></div>'; }).join('') : '<p class="empty">Geen open aanvragen.</p>';
    }
    if (k === 'tekorten') {
      var gs = gaps.filter(function (g) { return g.status === 'open' && g.date >= ti; }).slice(0, 6);
      return gs.length ? gs.map(function (g) { return '<div class="w-row"><span>' + esc(LOC_NAMES[g.loc] + ' · ' + short(parseIso(g.date)) + ' ' + HALVES[g.half].toLowerCase()) + '</span><button type="button" class="mini-btn" data-wgap="' + g.date + '">Oplossen</button></div>'; }).join('') : '<p class="empty">Geen open tekorten.</p>';
    }
    if (k === 'team') {
      if (weekday(todayD) > 4) return '<p class="empty">Weekend.</p>';
      var h = new Date().getHours() < 13 ? 0 : 1, groups = {};
      PEOPLE.forEach(function (p) { var s = slot(p, todayD, h); if (s.absent) return; var l = locOf(s.text); if (l) (groups[l] = groups[l] || []).push(p.name); });
      return '<div class="note">' + HALVES[h] + '</div>' + Object.keys(groups).map(function (l) { return '<div class="w-row"><span>' + LOC_NAMES[l] + '</span><b style="text-align:right">' + esc(groups[l].join(', ')) + '</b></div>'; }).join('');
    }
    if (k === 'notities') {
      var mineN = notes.filter(function (n) { return n.author === state.user && n.key.split('|')[1] >= ti; }).slice(0, 6);
      return mineN.length ? mineN.map(function (n) { var a = n.key.split('|'); return '<div class="w-row"><span>' + esc(n.text) + '</span><span class="note">' + esc(short(parseIso(a[1]))) + '</span></div>'; }).join('') : '<p class="empty">Geen komende notities.</p>';
    }
    return '';
  }
  var CHEV = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>', XSVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function renderWidgets() {
    var box = document.getElementById('widgets');
    if (!state.user) { box.innerHTML = ''; return; }
    var cfg = widgetCfg(), avail = Object.keys(WIDGETS).filter(function (k) { return widgetAllowed(k) && cfg.list.indexOf(k) < 0; });
    box.innerHTML = cfg.list.map(function (k) {
      var closed = !!cfg.closed[k];
      return '<section class="widget' + (closed ? ' closed' : '') + '"><div class="w-head"><h2>' + esc(WIDGETS[k].title) + '</h2>' +
        '<button type="button" class="w-tog" data-wtog="' + k + '" aria-expanded="' + !closed + '" aria-label="' + (closed ? 'Uitklappen' : 'Inklappen') + '">' + CHEV + '</button>' +
        '<button type="button" data-wdel="' + k + '" aria-label="Widget verwijderen">' + XSVG + '</button></div><div class="w-body">' + widgetBody(k) + '</div></section>';
    }).join('') + (avail.length ? '<div class="w-add"><select id="w-new" aria-label="Widget toevoegen"><option value="">+ Widget toevoegen…</option>' + avail.map(function (k) { return '<option value="' + k + '">' + esc(WIDGETS[k].title) + '</option>'; }).join('') + '</select></div>' : '');
    box.querySelectorAll('[data-wtog]').forEach(function (b) { b.addEventListener('click', function () { var k = b.getAttribute('data-wtog'); cfg.closed[k] = !cfg.closed[k]; persist(); renderWidgets(); }); });
    box.querySelectorAll('[data-wdel]').forEach(function (b) { b.addEventListener('click', function () { var k = b.getAttribute('data-wdel'); cfg.list = cfg.list.filter(function (x) { return x !== k; }); persist(); renderWidgets(); }); });
    var sel = document.getElementById('w-new'); if (sel) sel.addEventListener('change', function () { if (sel.value) { cfg.list.push(sel.value); persist(); renderWidgets(); } });
    box.querySelectorAll('[data-wgo]').forEach(function (b) { b.addEventListener('click', function () { state.cursor = parseIso(b.getAttribute('data-wgo')); state.tab = 'agenda'; render(); }); });
    box.querySelectorAll('[data-wabs]').forEach(function (b) { b.addEventListener('click', function () { openAbsence(b.getAttribute('data-wabs')); }); });
    box.querySelectorAll('[data-wgap]').forEach(function (b) { b.addEventListener('click', function () { var v = b.getAttribute('data-wgap'); openGaps(function (g) { return g.date === v; }, 'Tekorten ' + short(parseIso(v))); }); });
  }

  /* =========================================================
     Opbouw
     ========================================================= */
  var ICONS = {
    agenda: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>',
    team: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.8 0 4.5 2 4.5 5"/></svg>',
    bezetting: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    afwezig: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    diensten: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/><path d="M12 13v4M10 15h4"/></svg>',
    beheer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>'
  };
  var LABELS = { agenda: 'Agenda', team: 'Team', bezetting: 'Bezetting', diensten: 'Diensten', afwezig: 'Afwezig', beheer: 'Beheer', feedback: 'Verbeteren' };

  function render() {
    applyPrefs();
    if (!state.user || !person(state.user)) { closeSheet(); renderWidgets(); document.getElementById('tabs').innerHTML = ''; renderLogin(); return; }
    document.body.classList.remove('logged-out');
    var me = person(state.user);
    var tabs = canApprove() ? ['agenda', 'team', 'bezetting', 'diensten', 'afwezig'] : ['agenda', 'diensten', 'afwezig'];
    if (isAdmin()) tabs.push('beheer');
    if (tabs.indexOf(state.tab) < 0 && state.tab !== 'feedback') state.tab = 'agenda';
    var pend = canApprove() ? requests.filter(function (r) { return r.status === 'pending' && r.person !== state.user; }).length : 0;
    document.getElementById('tabs').innerHTML = tabs.map(function (t) {
      var badge = (t === (isAdmin() ? 'beheer' : 'afwezig') && pend) ? '<span class="badge">' + pend + '</span>' : '';
      return '<button type="button" class="tab" data-tab="' + t + '"' + (t === state.tab ? ' aria-current="page"' : '') + '>' + ICONS[t] + '<span>' + LABELS[t] + '</span>' + badge + '</button>';
    }).join('');
    document.querySelectorAll('.tab').forEach(function (b) { b.addEventListener('click', function () { state.tab = b.getAttribute('data-tab'); save('rp.tab', state.tab); window.scrollTo(0, 0); render(); }); });

    var unread = myNotifs().filter(function (n) { return !n.read; }).length;
    var wb = document.getElementById('who-btn');
    wb.innerHTML = esc(isAdmin() ? '★' : me.id) + (unread ? '<span class="badge" style="top:-4px;left:auto;right:-6px">' + unread + '</span>' : '');
    wb.style.position = 'relative';
    wb.setAttribute('aria-label', 'Mijn profiel' + (unread ? ', ' + unread + ' nieuwe meldingen' : ''));
    var c = state.cursor, title = document.getElementById('big-title'), sub = document.getElementById('subtitle');
    var seg = document.getElementById('view-seg'), arrows = document.getElementById('nav-arrows');
    seg.hidden = state.tab !== 'agenda';
    arrows.hidden = !(state.tab === 'agenda' || state.tab === 'team' || state.tab === 'bezetting' || state.tab === 'diensten');
    seg.querySelectorAll('[data-view]').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-view') === state.view)); });
    if (state.tab === 'agenda') {
      if (state.view === 'maand') title.innerHTML = esc(MONTHS_LONG[c.getMonth()]) + ' <span class="year">' + c.getFullYear() + '</span>';
      else if (state.view === 'week') title.innerHTML = 'Week ' + isoWeek(c) + ' <span class="year">' + esc(MONTHS[mondayOf(c).getMonth()]) + '</span>';
      else title.innerHTML = esc(window.innerWidth < 560 ? DAYS[weekday(c)] : DAYS_LONG[weekday(c)]) + ' <span class="year">' + c.getDate() + ' ' + esc(MONTHS[c.getMonth()]) + '</span>';
    } else if (state.tab === 'diensten') {
      title.innerHTML = 'Diensten <span class="year">' + esc(MONTHS[c.getMonth()]) + (window.innerWidth < 560 ? '' : ' ' + c.getFullYear()) + '</span>';
    } else if (state.tab === 'team' || state.tab === 'bezetting') {
      title.innerHTML = esc(LABELS[state.tab]) + ' <span class="year">wk ' + isoWeek(c) + '</span>';
    } else title.textContent = LABELS[state.tab];
    sub.textContent = me.name + ' · ' + roleLabel(me.id) + (state.tab === 'agenda' ? ' · ' + (parityOf(c) === 'e' ? 'even' : 'oneven') + ' week' : '');

    if (state.tab === 'agenda') ({ maand: renderMonth, week: renderWeek, dag: renderDay })[state.view]();
    else ({ team: renderTeam, bezetting: renderBezetting, afwezig: renderAfwezig, beheer: renderBeheer, feedback: renderFeedback, diensten: renderDiensten })[state.tab]();
    renderWidgets();
  }

  document.getElementById('view-seg').addEventListener('click', function (e) {
    var b = e.target.closest('[data-view]'); if (!b) return;
    state.view = b.getAttribute('data-view'); save('rp.view', state.view); render();
  });
  function step(dir) {
    var c = state.cursor;
    if ((state.tab === 'agenda' && state.view === 'maand') || state.tab === 'diensten') state.cursor = new Date(c.getFullYear(), c.getMonth() + dir, 1);
    else if (state.tab === 'agenda' && state.view === 'dag') state.cursor = addDays(c, dir);
    else state.cursor = addDays(c, 7 * dir);
    render();
  }
  document.getElementById('prev-btn').addEventListener('click', function () { step(-1); });
  document.getElementById('next-btn').addEventListener('click', function () { step(1); });
  document.getElementById('today-btn').addEventListener('click', function () { state.cursor = startOfDay(new Date()); render(); });
  document.getElementById('who-btn').addEventListener('click', function () { if (state.user) openProfile(); else openWho(); });
  document.getElementById('settings-btn').addEventListener('click', function () { openSettings(); });
  document.getElementById('feedback-btn').addEventListener('click', function () { state.tab = 'feedback'; window.scrollTo(0, 0); render(); });
  document.getElementById('theme-btn').addEventListener('click', function () {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    prefs.theme = dark ? 'light' : 'dark'; persist(); applyPrefs(); toast(dark ? 'Lichte weergave' : 'Donkere weergave');
  });
  document.getElementById('add-btn').addEventListener('click', function () {
    openPlanChoice(canApprove() ? viewPerson().id : state.user, iso(state.cursor), 0);
  });
  document.addEventListener('keydown', function (e) {
    if (sheet.open || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1); else if (e.key === 't') { state.cursor = startOfDay(new Date()); render(); }
  });

  var isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var standalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  if (isIos && !standalone && !load('rp.hintClosed', false)) document.getElementById('install-hint').hidden = false;
  document.getElementById('install-close').addEventListener('click', function () { document.getElementById('install-hint').hidden = true; save('rp.hintClosed', true); });
  if ('serviceWorker' in navigator) {
    var hadController = !!navigator.serviceWorker.controller, reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () { if (hadController && !reloaded) { reloaded = true; location.reload(); } });
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (reg) {
        reg.update();
        document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') reg.update(); });
      }).catch(function () {});
    });
  }

  render();
})();
