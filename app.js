(function () {
  'use strict';
  var D = window.RP_DATA;
  var PEOPLE = D.people;
  var DAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
  var DAYS_LONG = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];
  var MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  var HALVES = ['Ochtend', 'Middag'];
  var TYPES = ['Vakantie', 'Congres', 'Congres organisatie', 'Cursus / onderwijs'];

  /* ---------- opslag (blijft op dit toestel) ---------- */
  function load(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* privé-modus: alleen in geheugen */ }
  }

  /* ---------- datums ---------- */
  function startOfDay(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function mondayOf(d) { var x = startOfDay(d); var wd = (x.getDay() + 6) % 7; return addDays(x, -wd); }
  function isoWeek(d) {
    var x = startOfDay(d); x.setDate(x.getDate() + 3 - ((x.getDay() + 6) % 7));
    var w1 = new Date(x.getFullYear(), 0, 4);
    return 1 + Math.round(((x - w1) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7);
  }
  function iso(d) { var m = d.getMonth() + 1, day = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day; }
  function parseIso(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function weekday(d) { return (d.getDay() + 6) % 7; }
  function short(d) { return DAYS[weekday(d)].toLowerCase() + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; }
  function parityOf(d) { return isoWeek(d) % 2 === 0 ? 'e' : 'o'; }

  /* ---------- codes en locaties ---------- */
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
    var s = (t || '').toLowerCase();
    if (!s) return 'LE';
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
  var CHECKS = ['MCL OK', 'MCL POK', 'MCL SU', 'Drachten', 'FK', 'Sneek', 'Totaal'];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function person(id) { for (var i = 0; i < PEOPLE.length; i++) if (PEOPLE[i].id === id) return PEOPLE[i]; return null; }

  /* ---------- afwezigheid ---------- */
  var requests = load('rp.requests', null);
  if (!requests) {
    var nm = addDays(mondayOf(new Date()), 7);
    requests = [{ id: 'seed1', person: 'C', type: 'Congres', from: iso(addDays(nm, 2)), fromPart: 'dag', to: iso(addDays(nm, 3)), toPart: 'dag', note: 'Voorbeeldaanvraag', status: 'pending', created: Date.now() }];
    save('rp.requests', requests);
  }
  function covers(r, dIso, half) {
    if (dIso < r.from || dIso > r.to) return false;
    if (dIso === r.from && r.fromPart === 'middag' && half === 0) return false;
    if (dIso === r.to && r.toPart === 'ochtend' && half === 1) return false;
    return true;
  }
  function absenceFor(pid, dIso, half, extra) {
    var found = null;
    requests.concat(extra ? [extra] : []).forEach(function (r) {
      if (r.person !== pid || r.status === 'declined') return;
      if (!covers(r, dIso, half)) return;
      if (r.status === 'approved' || r === extra) found = r;
      else if (!found) found = r;
    });
    return found;
  }
  function slot(p, date, half, extra) {
    var wd = weekday(date);
    if (wd > 4) return { text: '', absent: null, pending: null };
    var text = p[parityOf(date)][wd * 2 + half] || '';
    var a = absenceFor(p.id, iso(date), half, extra);
    if (a && (a.status === 'approved' || a === extra)) return { text: text, absent: a, pending: null };
    return { text: text, absent: null, pending: a };
  }
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
  function needFor(date, half, key) { return D.req[parityOf(date)][key][weekday(date) * 2 + half] || 0; }
  function impactOf(r) {
    var out = [];
    var d = parseIso(r.from), end = parseIso(r.to), guard = 0;
    while (d <= end && guard < 62) {
      if (weekday(d) < 5) {
        for (var h = 0; h < 2; h++) {
          if (!covers(r, iso(d), h)) continue;
          var before = countsFor(d, h, null), after = countsFor(d, h, r);
          CHECKS.forEach(function (k) {
            var need = needFor(d, h, k);
            if ((before[k] || 0) >= need && (after[k] || 0) < need) out.push(short(d) + ' ' + HALVES[h].toLowerCase() + ': ' + LOC_NAMES[k] + ' ' + (after[k] || 0) + ' van ' + need);
          });
        }
      }
      d = addDays(d, 1); guard++;
    }
    return out;
  }
  function daysIn(r) {
    var n = 0, d = parseIso(r.from), end = parseIso(r.to), guard = 0;
    while (d <= end && guard < 400) { if (weekday(d) < 5) n += (covers(r, iso(d), 0) ? 0.5 : 0) + (covers(r, iso(d), 1) ? 0.5 : 0); d = addDays(d, 1); guard++; }
    return n;
  }

  /* ---------- status ---------- */
  var state = {
    tab: load('rp.tab', 'rooster'),
    week: mondayOf(new Date()),
    user: load('rp.user', null),
    teamDay: Math.min(weekday(new Date()), 4),
    onlyLow: true,
    kind: 'Vakantie'
  };
  var main = document.getElementById('main');

  function cellHtml(s) {
    if (s.absent) return '<div class="cell t-AF"><span class="chip c-AF">AFW</span><span class="txt">' + esc(s.absent.type) + '</span></div>';
    var t = typeOf(s.text), c = codeOf(s.text);
    return '<div class="cell t-' + t + '">' + (c ? '<span class="chip c-' + t + '">' + esc(c) + '</span>' : '') +
      '<span class="txt">' + esc(s.text || 'Niet ingeroosterd') + '</span>' +
      (s.pending ? '<span class="pending-tag">' + esc(s.pending.type) + '?</span>' : '') + '</div>';
  }

  function renderRooster() {
    var me = person(state.user);
    var today = iso(new Date());
    var html = '';
    for (var i = 0; i < 5; i++) {
      var d = addDays(state.week, i);
      html += '<section class="card' + (iso(d) === today ? ' today' : '') + '"><h2>' + DAYS_LONG[i] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + '</h2>';
      for (var h = 0; h < 2; h++) html += '<div class="row"><span class="half">' + HALVES[h] + '</span>' + cellHtml(slot(me, d, h)) + '</div>';
      html += '</section>';
    }
    if (me.note) html += '<p class="note">Vaste afspraak: ' + esc(me.note) + '</p>';
    html += '<p class="note">Basisrooster uit de Excel (' + (parityOf(state.week) === 'e' ? 'even' : 'oneven') + ' week). Codes zoals OK3 en LSU1 komen uit MedSpace.</p>';
    main.innerHTML = html;
  }

  function renderTeam() {
    var html = '<div class="chips" role="group" aria-label="Dag">';
    for (var i = 0; i < 5; i++) {
      var d = addDays(state.week, i);
      html += '<button type="button" class="daychip" data-day="' + i + '" aria-pressed="' + (state.teamDay === i) + '">' + DAYS[i] + '<small>' + d.getDate() + ' ' + MONTHS[d.getMonth()] + '</small></button>';
    }
    html += '</div>';
    var day = addDays(state.week, state.teamDay);
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
      html += '<section class="card"><h2>' + HALVES[h] + '</h2>';
      order.forEach(function (o) { if (groups[o]) html += '<div class="grp"><b>' + LOC_NAMES[o] + '</b><span>' + esc(groups[o].join(', ')) + '</span></div>'; });
      if (other.length) html += '<div class="grp"><b>Overig</b><span>' + esc(other.join(', ')) + '</span></div>';
      if (away.length) html += '<div class="grp"><b>Afwezig</b><span>' + esc(away.join(', ')) + '</span></div>';
      html += '</section>';
    }
    main.innerHTML = html;
    main.querySelectorAll('.daychip').forEach(function (b) {
      b.addEventListener('click', function () { state.teamDay = +b.getAttribute('data-day'); renderTeam(); });
    });
  }

  function renderBezetting() {
    var html = '<label class="toggle"><input type="checkbox" id="only-low"' + (state.onlyLow ? ' checked' : '') + '> Alleen tekorten tonen</label>';
    var totalLow = 0;
    for (var i = 0; i < 5; i++) {
      var d = addDays(state.week, i);
      html += '<section class="card"><h2>' + DAYS_LONG[i] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + '</h2>';
      for (var h = 0; h < 2; h++) {
        var c = countsFor(d, h, null), items = '';
        CHECKS.forEach(function (k) {
          var need = needFor(d, h, k), have = c[k] || 0;
          if (!need && !have) return;
          var low = have < need;
          if (low) totalLow++;
          if (state.onlyLow && !low) return;
          items += '<span class="chk ' + (low ? 'low' : 'ok') + '">' + LOC_NAMES[k] + ' ' + have + '/' + need + '</span>';
        });
        html += '<div class="row"><span class="half">' + HALVES[h] + '</span><div class="checks">' + (items || '<span class="chk ok">Alles op orde</span>') + '</div></div>';
      }
      html += '</section>';
    }
    html = '<p class="note">' + (totalLow ? totalLow + ' tekorten deze week, gemeten tegen de minimale bezetting uit de Excel.' : 'Geen tekorten deze week.') + ' Alleen goedgekeurde afwezigheid telt mee.</p>' + html;
    main.innerHTML = html;
    document.getElementById('only-low').addEventListener('change', function (e) { state.onlyLow = e.target.checked; renderBezetting(); });
  }

  function reqHtml(r, opts) {
    var p = person(r.person);
    var st = { pending: ['p', 'Aangevraagd'], approved: ['a', 'Goedgekeurd'], declined: ['d', 'Afgewezen'] }[r.status];
    var when = short(parseIso(r.from)) + (r.fromPart === 'middag' ? ' (middag)' : '') + (r.to !== r.from || r.toPart === 'ochtend' ? ' – ' + short(parseIso(r.to)) + (r.toPart === 'ochtend' ? ' (ochtend)' : '') : '');
    var html = '<div class="req' + (r.status === 'pending' ? ' pending' : '') + '"><div class="top-line"><b>' + esc(opts.showName ? p.name + ' · ' + r.type : r.type) + '</b><span class="status ' + st[0] + '">' + st[1] + '</span></div>' +
      '<span class="note">' + esc(when) + ' · ' + String(daysIn(r)).replace('.', ',') + ' werkdag(en)' + (r.note ? ' · ' + esc(r.note) : '') + '</span>';
    if (opts.review) {
      var imp = impactOf(r);
      html += '<span class="impact' + (imp.length ? '' : ' ok') + '">' + (imp.length ? 'Gevolg: ' + esc(imp.join('; ')) : 'Geen tekorten door deze aanvraag') + '</span>' +
        '<div class="btn-row"><button type="button" class="btn" data-approve="' + r.id + '">Goedkeuren</button><button type="button" class="btn secondary" data-decline="' + r.id + '">Afwijzen</button></div>';
    }
    if (opts.mine && r.status !== 'declined' && r.to >= iso(new Date())) html += '<button type="button" class="link-btn" data-withdraw="' + r.id + '">Intrekken</button>';
    return html + '</div>';
  }

  function renderAfwezig() {
    var me = person(state.user);
    var html = '';
    if (me.role === 'beheer') {
      var pend = requests.filter(function (r) { return r.status === 'pending' && r.person !== me.id; });
      html += '<section class="card"><h2>Te beoordelen</h2>' + (pend.length ? pend.map(function (r) { return reqHtml(r, { showName: true, review: true }); }).join('') : '<p class="empty">Geen open aanvragen.</p>') + '</section>';
    }
    var t = iso(new Date());
    html += '<section class="card"><h2>Nieuwe aanvraag</h2><form id="req-form" style="display:flex;flex-direction:column;gap:10px">' +
      '<div class="seg" role="group" aria-label="Soort">' + TYPES.map(function (k) { return '<button type="button" data-kind="' + esc(k) + '" aria-pressed="' + (state.kind === k) + '">' + esc(k) + '</button>'; }).join('') + '</div>' +
      '<div class="grid2"><label class="f">Van<input type="date" id="f-from" value="' + t + '" required></label>' +
      '<label class="f">Vanaf<select id="f-fromPart"><option value="dag">Hele dag</option><option value="middag">Middag</option></select></label>' +
      '<label class="f">Tot en met<input type="date" id="f-to" value="' + t + '" required></label>' +
      '<label class="f">Tot en met<select id="f-toPart"><option value="dag">Hele dag</option><option value="ochtend">Ochtend</option></select></label></div>' +
      '<label class="f">Toelichting<textarea id="f-note" rows="2" placeholder="Bijv. naam van het congres"></textarea></label>' +
      '<button type="submit" class="btn">Aanvraag indienen</button></form></section>';
    html += '<button type="button" class="btn danger" id="sick-btn">Ziek melden voor vandaag</button>';
    var mine = requests.filter(function (r) { return r.person === me.id; }).sort(function (a, b) { return a.from < b.from ? 1 : -1; });
    html += '<section class="card"><h2>Mijn aanvragen</h2>' + (mine.length ? mine.map(function (r) { return reqHtml(r, { mine: true }); }).join('') : '<p class="empty">Nog geen aanvragen.</p>') + '</section>';
    html += '<p class="note">Demo: aanvragen worden alleen op dit toestel bewaard. In de echte versie gaan ze naar de planner en de Excel.</p>';
    main.innerHTML = html;

    main.querySelectorAll('[data-kind]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.kind = b.getAttribute('data-kind');
        main.querySelectorAll('[data-kind]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      });
    });
    document.getElementById('req-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var from = document.getElementById('f-from').value, to = document.getElementById('f-to').value;
      if (!from || !to) return;
      if (to < from) { var tmp = from; from = to; to = tmp; }
      requests.push({ id: 'r' + Date.now(), person: me.id, type: state.kind, from: from, fromPart: document.getElementById('f-fromPart').value, to: to, toPart: document.getElementById('f-toPart').value, note: document.getElementById('f-note').value.trim().slice(0, 200), status: me.role === 'beheer' ? 'approved' : 'pending', created: Date.now() });
      save('rp.requests', requests); render();
    });
    document.getElementById('sick-btn').addEventListener('click', function () {
      if (!window.confirm('Ziek melden voor vandaag? De planner krijgt een melding.')) return;
      requests.push({ id: 's' + Date.now(), person: me.id, type: 'Ziek', from: t, fromPart: 'dag', to: t, toPart: 'dag', note: '', status: 'approved', created: Date.now() });
      save('rp.requests', requests); render();
    });
    main.querySelectorAll('[data-approve],[data-decline],[data-withdraw]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-approve') || b.getAttribute('data-decline') || b.getAttribute('data-withdraw');
        requests = requests.map(function (r) {
          if (r.id !== id) return r;
          if (b.hasAttribute('data-approve')) r.status = 'approved';
          else if (b.hasAttribute('data-decline')) r.status = 'declined';
          return r;
        }).filter(function (r) { return !(b.hasAttribute('data-withdraw') && r.id === id); });
        save('rp.requests', requests); render();
      });
    });
  }

  var TITLES = { rooster: 'Mijn rooster', team: 'Wie staat waar', bezetting: 'Bezetting', afwezig: 'Afwezigheid' };
  function render() {
    if (!state.user || !person(state.user)) { openWho(true); return; }
    var me = person(state.user);
    document.getElementById('who-btn').textContent = me.id;
    document.getElementById('view-title').textContent = TITLES[state.tab];
    document.getElementById('view-sub').textContent = me.name + ' · ' + me.group + (me.role === 'beheer' ? ' · beheerder' : '');
    var end = addDays(state.week, 4);
    document.getElementById('this-week').textContent = 'Week ' + isoWeek(state.week) + ' · ' + (parityOf(state.week) === 'e' ? 'even' : 'oneven') + ' · ' + state.week.getDate() + ' ' + MONTHS[state.week.getMonth()] + ' – ' + end.getDate() + ' ' + MONTHS[end.getMonth()];
    document.getElementById('weeknav').hidden = state.tab === 'afwezig';
    document.querySelectorAll('.tab').forEach(function (t) {
      if (t.getAttribute('data-tab') === state.tab) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
    });
    var pend = me.role === 'beheer' ? requests.filter(function (r) { return r.status === 'pending' && r.person !== me.id; }).length : 0;
    var badge = document.getElementById('pending-badge');
    badge.hidden = !pend; badge.textContent = pend;
    ({ rooster: renderRooster, team: renderTeam, bezetting: renderBezetting, afwezig: renderAfwezig })[state.tab]();
  }

  /* ---------- gebruiker kiezen ---------- */
  var dlg = document.getElementById('who-dialog');
  function openWho() {
    var list = document.getElementById('who-list');
    list.innerHTML = PEOPLE.map(function (p) {
      return '<button type="button" class="who" data-who="' + p.id + '" aria-current="' + (p.id === state.user) + '"><span class="ini">' + esc(p.id) + '</span><span>' + esc(p.name) + '<small>' + esc(p.group + (p.role === 'beheer' ? ' · beheerder (planner)' : '')) + '</small></span></button>';
    }).join('');
    list.querySelectorAll('[data-who]').forEach(function (b) {
      b.addEventListener('click', function () { state.user = b.getAttribute('data-who'); save('rp.user', state.user); dlg.close(); render(); });
    });
    if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); } else { dlg.setAttribute('open', ''); }
  }

  document.getElementById('who-btn').addEventListener('click', openWho);
  dlg.addEventListener('close', function () { if (!state.user) setTimeout(openWho, 0); });
  document.getElementById('prev-week').addEventListener('click', function () { state.week = addDays(state.week, -7); render(); });
  document.getElementById('next-week').addEventListener('click', function () { state.week = addDays(state.week, 7); render(); });
  document.getElementById('this-week').addEventListener('click', function () { state.week = mondayOf(new Date()); render(); });
  document.querySelectorAll('.tab').forEach(function (t) {
    t.addEventListener('click', function () { state.tab = t.getAttribute('data-tab'); save('rp.tab', state.tab); window.scrollTo(0, 0); render(); });
  });

  /* ---------- installeren ---------- */
  var isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var standalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  if (isIos && !standalone && !load('rp.hintClosed', false)) document.getElementById('install-hint').hidden = false;
  document.getElementById('install-close').addEventListener('click', function () { document.getElementById('install-hint').hidden = true; save('rp.hintClosed', true); });
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }

  render();
})();
