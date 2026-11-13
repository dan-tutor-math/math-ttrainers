/* ==========================================================
   schedule-sync.js — двусторонняя синхронизация кабинета со старым
   приложением расписания Даниила (задача В5, cabinet-plan.md).

   Устройство (claude-notes/schedule-audit.md, «Двусторонняя синхронизация»):
   старое приложение — Cloudflare Worker, всё состояние — один JSON, API
   /data: GET {rev, data}, PUT {base, data} → {ok, rev} или 409 со свежими
   данными. Кабинет для него — ещё одно «устройство»: читает, сводит, пишет.

   Сведение трёхстороннее, как mergeStates в старом приложении:
   база (последнее согласованное, ext_sync.base) / кабинет / старое.
   Единица сведения — «раздел»:
     d:ГГГГ-ММ-ДД — день расписания (только окно: PAST_DAYS назад и всё
                    будущее; давние дни никто не правит, а база не пухнет);
     s:<имя>      — ученик (имя и архив);
     t:<id>       — шаблон недели целиком;
     p:<id>       — устойчивая пара / группа кабинета (в старом — поле pairs,
                    старое приложение его только хранит);
     a            — активный шаблон.
   Менял только кабинет — берём кабинет, только старое — старое, оба — спрашиваем
   (показываем оба варианта). Оплаты и статистика НЕ синхронизируются — придут
   с В4: их разделы (payments, incomeGroups, rates у учеников) остаются в старом
   как есть — PUT берёт присланное состояние целиком и меняет только свои разделы.
   Место под них — RAW_KEYS_LATER ниже.

   Сравниваем не сырые строки старого, а их смысл (rowNorm): время в минутах,
   длительность, формат, имена и статусы. Поэтому цвет полупараллелки, пометки
   в скобках у имени и пустые строки-окна («развернуть все часы») не считаются
   правкой и при записи сохраняются: строка, смысл которой не менялся, уходит
   обратно как была.

   Код доступа к старому приложению хранится ТОЛЬКО в localStorage этого
   браузера и уходит только в заголовке x-code к адресу старого приложения.
   В Supabase (teacher_settings, ext_sync) его нет и быть не должно.

   Ученики: имя в строке старого ↔ students.ext_name. Незнакомое имя — гость
   (guest_name) и предложение завести ученика; молча не заводим. Переименовали
   ученика в кабинете (name ≠ ext_name) — переименовываем и в старом: в строках,
   шаблонах, оплатах, как «Переименовать везде» старого приложения.
   ========================================================== */
(function(){
  'use strict';
  const C = window.CabinetCloud, SC = window.ScheduleCloud;
  const SOURCE = 'old_app';
  const LS_URL = 'cabinet:sync:url', LS_CODE = 'cabinet:sync:code', LS_SKIP = 'cabinet:sync:guests';
  const PAST_DAYS = 62;
  const EVERY_MS = 3 * 60 * 1000;
  const FORMATS = ['single', 'pair', 'group', 'semi'];
  const GROUP_FORMATS = ['pair', 'group', 'semi'];
  const ST = ['plan', 'done', 'skip', 'move'];
  const DEF_DUR = 60;                   // в старом строка без dur — час
  // eslint-disable-next-line no-unused-vars
  const RAW_KEYS_LATER = ['payments', 'incomeGroups'];   // В4: оплаты и доход — пока не трогаем
  const LCOLS = 'id, day, start_min, dur_min, format, is_event, title, group_id, ext_id';
  const PCOLS = 'id, lesson_id, student_id, guest_name, status, pos';
  const SCOLS = 'id, name, ext_name, archived_at';

  /* ── мелочи ── */
  const pad = n => (n < 10 ? '0' : '') + n;
  const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const addDays = (s, n) => { const [y, m, d] = s.split('-').map(Number); return ymd(new Date(y, m - 1, d + n)); };
  const today = () => ymd(new Date());
  const copy = x => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
  // сравнение по смыслу, без порядка ключей: база сведения лежит в jsonb, а
  // Postgres переставляет ключи объектов — иначе после чтения базы любой
  // день казался «изменённым в кабинете» и правка в старом давала ложный конфликт
  const stable = x => (Array.isArray(x) ? x.map(stable)
    : x && typeof x === 'object' ? Object.keys(x).sort().reduce((o, k) => { o[k] = stable(x[k]); return o; }, {}) : x);
  const eq = (a, b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));
  const norm = s => String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
  const rid = p => (p || 'r') + Math.random().toString(36).slice(2, 10);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hm = m => pad(Math.floor(m / 60)) + ':' + pad(m % 60);
  const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const sortN = list => list.sort(byId);
  const keysOf = (...objs) => Array.from(new Set([].concat(...objs.map(o => Object.keys(o || {})))));

  /* ══ строки старого приложения (те же правила, что в index.ts) ══ */
  const splitNames = v => String(v || '').split(',').map(x => x.trim()).filter(Boolean);
  const stName = x => String(x || '').replace(/\([^)]*\)/g, '').trim();
  const nkey = x => stName(x).toLowerCase();
  function timeMin(t){
    const m = /^(\d{1,2}):?(\d{2})?/.exec(String(t || '').trim());
    if (!m) return null;
    const v = Number(m[1]) * 60 + Number(m[2] || 0);
    return v <= 1439 ? v : null;
  }
  const stOf = r => (ST.indexOf(r && r.st) >= 0 ? r.st : 'plan');
  function stOfName(r, x){ const m = r && r.sts, v = m && m[nkey(x)]; return ST.indexOf(v) >= 0 ? v : stOf(r); }
  const defFmt = n => (n >= 3 ? 'group' : n === 2 ? 'pair' : 'single');
  const durOf = v => { const n = Math.round(Number(v)); return n >= 5 && n <= 720 ? n : DEF_DUR; };
  // строка с занятием или событием; пустая строка — окно «развернуть все часы»
  const isLessonRow = r => !!r && (!!r.ev || splitNames(r.names).some(x => stName(x)));

  // смысл строки: из него и в него переводится занятие кабинета
  function rowNorm(r, withSt){
    const ev = !!r.ev, seen = {}, names = [];
    if (!ev) splitNames(r.names).forEach(x => { const n = stName(x); if (n && !seen[norm(n)]) { seen[norm(n)] = 1; names.push(n); } });
    const f = ev ? 'single' : r.stg ? 'semi' : FORMATS.indexOf(r.fmt) >= 0 ? r.fmt : defFmt(names.length);
    return { id: r.id || null, t: timeMin(r.time), d: durOf(r.dur), f, ev, ti: ev ? String(r.names || '').trim() : '',
      p: names.map(n => [n, withSt ? stOfName(r, n) : 'plan']), g: r.grp || null };
  }
  const sameLesson = (b, n) => b.t === n.t && !!b.ev === !!n.ev && eq(b.p.map(x => norm(x[0])), n.p.map(x => norm(x[0])));

  // строки → занятия. Строке без id (заведена до новой версии Worker) даём id:
  // то же время и имена, что у занятия базы, — его id, иначе новый. Повтор id
  // (строку скопировали старым способом) — тоже новый. Сырые строки при этом
  // меняются — тогда их нужно записать обратно (mark)
  function rowsToN(rows, withSt, baseList, mark){
    const used = {}, out = [];
    (rows || []).forEach(r => { if (isLessonRow(r) && r.id) used[r.id] = (used[r.id] || 0) + 1; });
    const pool = (baseList || []).filter(b => !used[b.id]);
    const seen = {};
    (rows || []).forEach(r => {
      if (!isLessonRow(r)) return;
      if (!r.id || seen[r.id]) {
        const n0 = rowNorm(r, withSt);
        const i = pool.findIndex(b => sameLesson(b, n0));
        r.id = i >= 0 ? pool.splice(i, 1)[0].id : rid();
        mark();
      }
      seen[r.id] = 1;
      out.push(rowNorm(r, withSt));
    });
    return sortN(out);
  }

  // занятие → строка. Смысл не изменился — строка уходит как была; иначе
  // правим только изменившееся, остальное (цвет, скобки у имён) не трогаем
  function rowFrom(l, prev, withSt){
    if (prev && eq(rowNorm(prev, withSt), l)) return prev;
    const o = prev ? copy(prev) : { time: '', names: '' };
    o.id = l.id;
    if (!(prev && timeMin(prev.time) === l.t)) o.time = l.t == null ? '' : hm(l.t);
    if ((o.dur ? durOf(o.dur) : DEF_DUR) !== l.d) { if (l.d === DEF_DUR) delete o.dur; else o.dur = l.d; }
    if (l.g) o.grp = l.g; else delete o.grp;
    if (l.ev) {
      o.ev = true;
      o.names = l.ti;
      delete o.sts; delete o.fmt;
      return o;
    }
    delete o.ev;
    const prevRaw = prev && !prev.ev ? splitNames(prev.names) : [];
    const want = l.p.map(x => x[0]);
    if (!eq(prevRaw.map(stName).filter(Boolean), want)) {
      o.names = want.map(n => prevRaw.find(raw => stName(raw) === n) || n).join(', ');
    }
    if (withSt) {
      const sts = l.p.map(x => x[1]);
      if (!eq(want.map(n => stOfName(o, n)), sts)) {
        const cnt = {};
        sts.forEach(s => { cnt[s] = (cnt[s] || 0) + 1; });
        const main = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0] || 'plan';
        if (main === 'plan') delete o.st; else o.st = main;
        delete o.sts;
        want.forEach((n, i) => { if (sts[i] !== main) { o.sts = o.sts || {}; o.sts[nkey(n)] = sts[i]; } });
      }
    }
    if (l.f === 'semi') { o.stg = true; delete o.fmt; }
    else {
      if (o.stg) { delete o.stg; delete o.stgB; delete o.stgC; }
      if (l.f === defFmt(want.length)) delete o.fmt; else o.fmt = l.f;
    }
    return o;
  }

  // день (или день шаблона) целиком: порядок строк старого сохраняем — на нём
  // держатся полупараллелки; новые встают по времени, на место пустого окна
  function buildRows(lessons, prevRows, withSt){
    const want = {};
    lessons.forEach(l => { want[l.id] = l; });
    const used = {}, out = [];
    (prevRows || []).forEach(r => {
      if (!isLessonRow(r)) { out.push(r); return; }
      const l = r.id && want[r.id];
      if (!l || used[l.id]) return;
      used[l.id] = 1;
      out.push(rowFrom(l, r, withSt));
    });
    const tOf = r => { const t = timeMin(r.time); return t == null ? 1e9 : t; };
    lessons.filter(l => !used[l.id]).sort((a, b) => (a.t == null ? 1e9 : a.t) - (b.t == null ? 1e9 : b.t)).forEach(l => {
      const row = rowFrom(l, null, withSt), t = l.t == null ? 1e9 : l.t;
      const hole = out.findIndex(r => !isLessonRow(r) && !r.ev && l.t != null && timeMin(r.time) === l.t);
      if (hole >= 0) { out[hole] = row; return; }
      const at = out.findIndex(r => tOf(r) > t);
      if (at < 0) out.push(row); else out.splice(at, 0, row);
    });
    return out;
  }

  // «Переименовать везде» старого приложения: строки, шаблоны, оплаты, группы дохода
  function renameRaw(raw, from, to){
    const f = norm(from);
    const fixRow = r => {
      if (!r || r.ev) return;
      let hit = false;
      r.names = String(r.names || '').split(',').map(part => {
        if (norm(stName(part)) !== f) return part.trim();
        hit = true;
        const paren = part.match(/\([^)]*\)/);
        return to + (paren ? ' ' + paren[0] : '');
      }).filter(x => x !== '').join(', ');
      // личный статус в параллели хранится по имени — переносим
      if (hit && r.sts) Object.keys(r.sts).forEach(k => { if (norm(k) === f) { r.sts[to.toLowerCase()] = r.sts[k]; delete r.sts[k]; } });
    };
    Object.values(raw.schedule || {}).forEach(d => (d && d.rows || []).forEach(fixRow));
    (raw.templates || []).forEach(t => (t.days || []).forEach(rows => (rows || []).forEach(fixRow)));
    (raw.students || []).forEach(s => { if (norm(s.name) === f) s.name = to; });
    (raw.payments || []).forEach(p => { if (norm(p.student) === f) p.student = to; });
    (raw.incomeGroups || []).forEach(g => { g.members = (g.members || []).map(m => (norm(m) === f ? to : m)); });
    (raw.pairs || []).forEach(g => { g.members = (g.members || []).map(m => (norm(m) === f ? to : m)); });
  }
  function renameUnits(U, from, to){
    const f = norm(from);
    const fixP = p => p.forEach(x => { if (norm(x[0]) === f) x[0] = to; });
    Object.keys(U).forEach(k => {
      const v = U[k];
      if (k.startsWith('d:')) v.forEach(l => fixP(l.p));
      else if (k.startsWith('t:')) v.days.forEach(ls => ls.forEach(l => fixP(l.p)));
      else if (k.startsWith('p:')) v.m = v.m.map(m => (norm(m) === f ? to : m));
    });
    if (U['s:' + f]) { const v = U['s:' + f]; delete U['s:' + f]; v.n = to; U['s:' + norm(to)] = v; }
  }

  /* ══ состояние старого приложения → разделы ══ */
  function remoteUnits(data, from, base, mark){
    const U = {};
    const sch = (data && data.schedule) || {};
    Object.keys(sch).forEach(day => {
      if (day < from || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
      const ls = rowsToN(sch[day] && sch[day].rows, true, base['d:' + day], mark);
      if (ls.length) U['d:' + day] = ls;
    });
    ((data && data.students) || []).forEach(s => {
      const n = String((s && s.name) || '').trim();
      if (n) U['s:' + norm(n)] = { n, a: !!s.arch };
    });
    ((data && data.templates) || []).forEach(t => {
      if (!t || !t.id) return;
      const bt = base['t:' + t.id];
      U['t:' + t.id] = { n: String(t.name || ''), days: [0, 1, 2, 3, 4, 5, 6].map(i => rowsToN((t.days || [])[i], false, bt && bt.days[i], mark)) };
    });
    ((data && data.pairs) || []).forEach(p => {
      if (p && p.id) U['p:' + p.id] = { n: String(p.name || ''), f: GROUP_FORMATS.indexOf(p.fmt) >= 0 ? p.fmt : 'pair', d: p.dur || null, m: (p.members || []).slice() };
    });
    if (data && data.activeTpl) U.a = data.activeTpl;
    return U;
  }

  /* ══ кабинет: загрузка и разделы ══ */
  function need(){ const c = C && C.client(); if (!c) throw new C.CabinetError({ message: 'no_config' }); return c; }
  async function run(p){
    let res;
    try { res = await p; } catch (e) { throw new C.CabinetError(e); }
    if (res.error) throw new C.CabinetError(res.error);
    return res.data;
  }
  async function peopleOf(table, key, ids, cols){
    let out = [];
    for (let i = 0; i < ids.length; i += 100) out = out.concat(await run(need().from(table).select(cols).in(key, ids.slice(i, i + 100))) || []);
    return out;
  }
  async function loadCab(from){
    const c = need();
    const students = await run(c.from('students').select(SCOLS)) || [];
    students.forEach(s => { s._orig = { name: s.name, ext_name: s.ext_name || null, archived_at: s.archived_at || null }; });
    // PostgREST отдаёт не больше 1000 строк за раз — листаем
    let lessons = [];
    for (let a = 0; ; a += 1000) {
      const part = await run(c.from('lessons').select(LCOLS).gte('day', from).order('day', { ascending: true }).range(a, a + 999)) || [];
      lessons = lessons.concat(part);
      if (part.length < 1000) break;
    }
    const ppl = await peopleOf('lesson_students', 'lesson_id', lessons.map(l => l.id), PCOLS);
    const pBy = {};
    ppl.forEach(p => { (pBy[p.lesson_id] = pBy[p.lesson_id] || []).push(p); });
    lessons.forEach(l => { l.people = (pBy[l.id] || []).sort((a, b) => a.pos - b.pos); });
    const groups = await run(c.from('student_groups').select('id, name, format, dur_min, archived_at, ext_id')) || [];
    const mem = await peopleOf('student_group_members', 'group_id', groups.map(g => g.id), 'group_id, student_id, pos');
    groups.forEach(g => { g.members = mem.filter(m => m.group_id === g.id).sort((a, b) => a.pos - b.pos).map(m => m.student_id); });
    const tpls = await run(c.from('week_templates').select('id, name, is_active, pos, ext_id')) || [];
    const slots = await peopleOf('template_slots', 'template_id', tpls.map(t => t.id), 'id, template_id, weekday, start_min, dur_min, format, is_event, title, group_id, pos, ext_id');
    const sp = await peopleOf('template_slot_students', 'slot_id', slots.map(s => s.id), 'id, slot_id, student_id, guest_name, pos');
    slots.forEach(s => { s.people = sp.filter(p => p.slot_id === s.id).sort((a, b) => a.pos - b.pos); });
    tpls.forEach(t => { t.slots = slots.filter(s => s.template_id === t.id); });
    const sync = await run(c.from('ext_sync').select('rev, base, synced_at').eq('source', SOURCE).maybeSingle());
    const cab = { students, lessons, groups, tpls, sync, newExt: [] };
    reindex(cab);
    return cab;
  }
  function reindex(cab){
    cab.byId = {};
    cab.students.forEach(s => { cab.byId[s.id] = s; });
  }
  // имя из строки старого → ученик: сперва привязка ext_name, потом имя
  function resolver(cab){
    const ext = {}, nm = {};
    cab.students.forEach(s => { if (s.ext_name) ext[norm(s.ext_name)] = s; });
    cab.students.forEach(s => { if (!nm[norm(s.name)]) nm[norm(s.name)] = s; });
    return name => ext[norm(name)] || nm[norm(name)] || null;
  }
  const represented = l => !!l.is_event || (l.people || []).length > 0;
  function ensureExt(cab, obj, table, prefix){
    if (!obj.ext_id) { obj.ext_id = rid(prefix); cab.newExt.push({ table, id: obj.id, ext_id: obj.ext_id }); }
    return obj.ext_id;
  }
  function cabUnits(cab, from, base){
    const U = {};
    const gExt = {};
    cab.groups.forEach(g => { if (!g.archived_at) gExt[g.id] = ensureExt(cab, g, 'student_groups', 'g'); });
    const pName = p => (p.student_id ? (cab.byId[p.student_id] || {}).name : p.guest_name) || '';
    const toN = (l, withSt) => ({
      id: l.ext_id, t: l.start_min == null ? null : l.start_min, d: durOf(l.dur_min), f: l.is_event ? 'single' : (FORMATS.indexOf(l.format) >= 0 ? l.format : 'single'),
      ev: !!l.is_event, ti: l.is_event ? String(l.title || '').trim() : '',
      p: l.is_event ? [] : (l.people || []).map(p => [pName(p), withSt ? (ST.indexOf(p.status) >= 0 ? p.status : 'plan') : 'plan']).filter(x => x[0]),
      g: (l.group_id && gExt[l.group_id]) || null,
    });
    cab.lessons.forEach(l => {
      if (l.day < from || !represented(l)) return;
      ensureExt(cab, l, 'lessons', 'r');
      (U['d:' + l.day] = U['d:' + l.day] || []).push(toN(l, true));
    });
    Object.keys(U).forEach(k => sortN(U[k]));
    cab.students.forEach(s => {
      // привязанный ученик в архиве, которого нет в базе (его удалили в старом), — не возвращаем туда
      if (s.archived_at && (!s.ext_name || !base['s:' + norm(s.name)])) return;
      U['s:' + norm(s.name)] = { n: s.name, a: !!s.archived_at };
    });
    // кабинет учеников не удаляет: имена базы, которых он не знает, — как в базе
    Object.keys(base).forEach(k => { if (k.startsWith('s:') && !(k in U)) U[k] = copy(base[k]); });
    cab.tpls.forEach(t => {
      const ext = ensureExt(cab, t, 'week_templates', 't');
      const days = [[], [], [], [], [], [], []];
      t.slots.forEach(s => {
        if (!represented(s) || !(s.weekday >= 1 && s.weekday <= 7)) return;
        ensureExt(cab, s, 'template_slots', 'r');
        days[s.weekday - 1].push(toN(s, false));
      });
      U['t:' + ext] = { n: String(t.name || ''), days: days.map(sortN) };
      if (t.is_active) U.a = ext;
    });
    cab.groups.forEach(g => {
      if (g.archived_at) return;
      U['p:' + g.ext_id] = { n: String(g.name || ''), f: g.format, d: g.dur_min || null, m: g.members.map(id => (cab.byId[id] || {}).name).filter(Boolean) };
    });
    return U;
  }

  /* ══ сведение ══ */
  function merge(B, K, R){
    const M = {}, conflicts = [];
    let mine = 0, theirs = 0;
    keysOf(B, K, R).forEach(k => {
      const b = B[k], kk = K[k], r = R[k];
      if (eq(kk, r)) { if (kk !== undefined) M[k] = copy(kk); return; }
      const lch = !eq(kk, b), rch = !eq(r, b);
      if (lch && !rch) { if (kk !== undefined) M[k] = copy(kk); mine++; }
      else if (!lch && rch) { if (r !== undefined) M[k] = copy(r); theirs++; }
      else conflicts.push({ k, mine: kk, theirs: r });
    });
    return { M, conflicts, mine, theirs };
  }

  /* ══ запись в старое ══ */
  function applyToRaw(raw, M, RN){
    raw.schedule = raw.schedule || {};
    const changed = keysOf(M, RN).filter(k => !eq(M[k], RN[k]));
    changed.forEach(k => {
      const m = M[k];
      if (k.startsWith('d:')) {
        const day = k.slice(2), rec = raw.schedule[day];
        const rows = buildRows(m || [], rec && rec.rows, true);
        if (!rows.length && !(rec && rec.total != null)) delete raw.schedule[day];
        else raw.schedule[day] = Object.assign({ total: null }, rec || {}, { rows });
      } else if (k.startsWith('s:')) {
        const list = raw.students = raw.students || [];
        const i = list.findIndex(s => norm(s && s.name) === k.slice(2));
        if (!m) { if (i >= 0) list.splice(i, 1); return; }
        // новый ученик — как «+ ученик» старого приложения
        const s = i >= 0 ? list[i] : (list.push({ name: m.n, tag: 'уч. год', price: '', per: '2', monthly: null }), list[list.length - 1]);
        s.name = m.n;
        if (m.a) s.arch = true; else delete s.arch;
      } else if (k.startsWith('t:')) {
        const list = raw.templates = raw.templates || [];
        const id = k.slice(2), i = list.findIndex(t => t && t.id === id);
        if (!m) { if (i >= 0) list.splice(i, 1); return; }
        const prev = i >= 0 ? list[i] : null;
        const days = [0, 1, 2, 3, 4, 5, 6].map(d => buildRows(m.days[d], prev && prev.days && prev.days[d], false));
        const t = Object.assign({}, prev || {}, { id, name: m.n, days });
        if (i >= 0) list[i] = t; else list.push(t);
      } else if (k === 'a') {
        if (m) raw.activeTpl = m;
      }
    });
    if (changed.some(k => k.startsWith('p:'))) {
      const order = (raw.pairs || []).map(p => p.id);
      raw.pairs = Object.keys(M).filter(k => k.startsWith('p:')).map(k => ({ id: k.slice(2), name: M[k].n, fmt: M[k].f, dur: M[k].d, members: M[k].m.slice() }))
        .sort((a, b) => (order.indexOf(a.id) + 1 || 1e9) - (order.indexOf(b.id) + 1 || 1e9));
    }
    return raw;
  }

  /* ══ запись в кабинет ══ */
  async function applyToCab(cab, M, K, extra){
    const c = need();
    // ext_id, выданные кабинетом своим занятиям, слотам, шаблонам, парам
    for (const x of cab.newExt) await run(c.from(x.table).update({ ext_id: x.ext_id }).eq('id', x.id));
    cab.newExt = [];
    // отмеченные в предпросмотре импорта — заводим учениками
    for (const name of (extra && extra.create) || []) {
      const s = await run(c.from('students').insert({ name, ext_name: name }).select(SCOLS).single());
      s._orig = { name: s.name, ext_name: s.ext_name, archived_at: null };
      cab.students.push(s);
    }
    reindex(cab);
    let changed = false;
    const res = () => resolver(cab);
    let find = res();
    // ученики: переименование и архив из старого
    keysOf(M, K).filter(k => k.startsWith('s:') && !eq(M[k], K[k])).forEach(k => {
      const m = M[k], s = find(k.slice(2));
      if (m && s) {
        if (s.name !== m.n) { s.name = m.n; s.ext_name = m.n; }
        if (!!s.archived_at !== m.a) s.archived_at = m.a ? new Date().toISOString() : null;
      } else if (!m && s && s.ext_name && !s.archived_at) s.archived_at = new Date().toISOString();
    });
    find = res();
    const person = (name, status, pos) => {
      const s = find(name);
      return s ? { student_id: s.id, guest_name: null, status, pos } : { student_id: null, guest_name: name.slice(0, 80), status, pos };
    };
    const want = list => {
      const seen = {}, out = [];
      list.forEach((x, i) => { const p = person(x[0], x[1], i); const key = p.student_id ? 's' + p.student_id : 'g' + norm(p.guest_name); if (!seen[key]) { seen[key] = 1; out.push(p); } });
      return out;
    };
    const pkey = p => (p.student_id ? 's' + p.student_id : 'g' + norm(p.guest_name));

    // пары и группы — до дней: занятие ссылается на пару
    const gByExt = {};
    cab.groups.forEach(g => { if (g.ext_id) gByExt[g.ext_id] = g; });
    for (const k of keysOf(M, K).filter(k => k.startsWith('p:') && !eq(M[k], K[k]))) {
      const m = M[k], ext = k.slice(2), g = gByExt[ext];
      changed = true;
      if (!m) { if (g) await run(c.from('student_groups').delete().eq('id', g.id)); delete gByExt[ext]; continue; }
      const ids = Array.from(new Set(m.m.map(n => find(n)).filter(Boolean).map(s => s.id)));
      const f = { name: m.n.slice(0, 80), format: GROUP_FORMATS.indexOf(m.f) >= 0 ? m.f : 'pair', dur_min: m.d || null };
      let gid;
      if (!g) {
        const ng = await run(c.from('student_groups').insert(Object.assign(f, { ext_id: ext })).select('id').single());
        gid = ng.id; gByExt[ext] = { id: gid, members: [] };
      } else {
        gid = g.id;
        if (g.name !== f.name || g.format !== f.format || (g.dur_min || null) !== f.dur_min) await run(c.from('student_groups').update(f).eq('id', gid));
      }
      if (!eq((gByExt[ext].members || []), ids)) {
        await run(c.from('student_group_members').delete().eq('group_id', gid));
        if (ids.length) await run(c.from('student_group_members').insert(ids.map((sid, i) => ({ group_id: gid, student_id: sid, pos: i }))));
      }
    }
    const gid = ext => (ext && gByExt[ext] ? gByExt[ext].id : null);
    const fieldsOf = (T, extraF) => Object.assign({
      start_min: T.t, dur_min: T.d, format: FORMATS.indexOf(T.f) >= 0 ? T.f : 'single', is_event: !!T.ev, group_id: gid(T.g), ext_id: T.id,
    }, T.ev ? { title: T.ti.slice(0, 200) } : {}, extraF);
    const diff = (row, f) => { const o = {}; Object.keys(f).forEach(x => { if ((row[x] == null ? null : row[x]) !== (f[x] == null ? null : f[x])) o[x] = f[x]; }); return Object.keys(o).length ? o : null; };

    // шаблоны недели
    const tByExt = {};
    cab.tpls.forEach(t => { if (t.ext_id) tByExt[t.ext_id] = t; });
    for (const k of keysOf(M, K).filter(k => k.startsWith('t:') && !eq(M[k], K[k]))) {
      const m = M[k], ext = k.slice(2);
      let t = tByExt[ext];
      changed = true;
      if (!m) { if (t) await run(c.from('week_templates').delete().eq('id', t.id)); continue; }
      if (!t) {
        t = await run(c.from('week_templates').insert({ name: m.n.slice(0, 80), is_active: false, pos: cab.tpls.length, ext_id: ext }).select('id, name, is_active, pos, ext_id').single());
        t.slots = []; cab.tpls.push(t); tByExt[ext] = t;
      } else if (t.name !== m.n) await run(c.from('week_templates').update({ name: m.n.slice(0, 80) }).eq('id', t.id));
      const sByExt = {};
      t.slots.forEach(s => { if (s.ext_id) sByExt[s.ext_id] = s; });
      const keep = {};
      for (let d = 0; d < 7; d++) {
        for (const T of m.days[d]) {
          keep[T.id] = 1;
          const f = fieldsOf(T, { weekday: d + 1 });
          const people = want(T.p).map(p => ({ student_id: p.student_id, guest_name: p.guest_name, pos: p.pos }));
          let s = sByExt[T.id];
          if (!s) {
            s = await run(c.from('template_slots').insert(Object.assign({ template_id: t.id, title: '', note: '' }, f)).select('id').single());
            if (people.length) await run(c.from('template_slot_students').insert(people.map(p => Object.assign({ slot_id: s.id }, p))));
            continue;
          }
          const dd = diff(s, f);
          if (dd) await run(c.from('template_slots').update(dd).eq('id', s.id));
          if (!eq(s.people.map(pkey), people.map(pkey))) {
            await run(c.from('template_slot_students').delete().eq('slot_id', s.id));
            if (people.length) await run(c.from('template_slot_students').insert(people.map(p => Object.assign({ slot_id: s.id }, p))));
          }
        }
      }
      for (const s of t.slots) if (represented(s) && s.ext_id && !keep[s.ext_id]) await run(c.from('template_slots').delete().eq('id', s.id));
    }
    if (M.a !== K.a && M.a && tByExt[M.a]) {
      changed = true;
      await run(c.from('week_templates').update({ is_active: false }).eq('is_active', true));
      await run(c.from('week_templates').update({ is_active: true }).eq('id', tByExt[M.a].id));
    }

    // дни: занятие узнаём по ext_id; перенос на другой день — тот же ext_id
    const days = keysOf(M, K).filter(k => k.startsWith('d:') && !eq(M[k], K[k])).map(k => k.slice(2));
    const hist = (extra && extra.history) || {};
    const lByExt = {};
    cab.lessons.forEach(l => { if (l.ext_id) lByExt[l.ext_id] = l; });
    const keep = {}, inserts = [];
    const plan = days.map(d => [d, M['d:' + d] || []]).concat(Object.keys(hist).map(d => [d, hist[d]]));
    for (const [day, list] of plan) {
      for (const T of list) {
        keep[T.id] = 1;
        const f = fieldsOf(T, { day });
        const L = lByExt[T.id];
        if (!L) { inserts.push({ f, people: want(T.p) }); continue; }
        changed = true;
        const dd = diff(L, f);
        if (dd) await run(c.from('lessons').update(dd).eq('id', L.id));
        const ppl = want(T.p), have = {};
        L.people.forEach(p => { have[pkey(p)] = p; });
        const wk = {};
        ppl.forEach(p => { wk[pkey(p)] = 1; });
        for (const p of L.people) if (!wk[pkey(p)]) await run(c.from('lesson_students').delete().eq('id', p.id));
        for (const p of ppl) {
          const e = have[pkey(p)];
          if (!e) await run(c.from('lesson_students').insert(Object.assign({ lesson_id: L.id }, p)));
          else if (e.status !== p.status || e.pos !== p.pos) await run(c.from('lesson_students').update({ status: p.status, pos: p.pos }).eq('id', e.id));
        }
      }
    }
    const dayset = {};
    days.forEach(d => { dayset[d] = 1; });
    for (const l of cab.lessons) {
      if (dayset[l.day] && represented(l) && !keep[l.ext_id]) { changed = true; await run(c.from('lessons').delete().eq('id', l.id)); }
    }
    for (let i = 0; i < inserts.length; i += 200) {
      changed = true;
      const part = inserts.slice(i, i + 200);
      const rows = await run(c.from('lessons').insert(part.map(x => Object.assign({ title: '', note: '' }, x.f))).select('id, ext_id')) || [];
      const idBy = {};
      rows.forEach(r => { idBy[r.ext_id] = r.id; });
      const ppl = [];
      part.forEach(x => { const lid = idBy[x.f.ext_id]; if (lid) x.people.forEach(p => ppl.push(Object.assign({ lesson_id: lid }, p))); });
      for (let j = 0; j < ppl.length; j += 500) await run(c.from('lesson_students').insert(ppl.slice(j, j + 500)));
    }
    return changed;
  }

  // имена, привязки и архив учеников — одной записью на ученика в конце:
  // ext_name ставим только когда имя уже есть в старом (после удачного PUT)
  async function commitStudents(cab, M){
    const c = need();
    const taken = {};
    cab.students.forEach(s => { if (s.ext_name) taken[norm(s.ext_name)] = (taken[norm(s.ext_name)] || 0) + 1; });
    let changed = false;
    for (const s of cab.students) {
      if (M['s:' + norm(s.name)] && s.ext_name !== s.name) {
        const was = s.ext_name ? norm(s.ext_name) : null;
        if (was !== norm(s.name) && taken[norm(s.name)]) continue;      // имя уже привязано к другому
        if (was) taken[was]--;
        taken[norm(s.name)] = (taken[norm(s.name)] || 0) + 1;
        s.ext_name = s.name;
      }
      const o = s._orig || {}, patch = {};
      ['name', 'ext_name', 'archived_at'].forEach(f => { if ((s[f] || null) !== (o[f] || null)) patch[f] = s[f] || null; });
      if (Object.keys(patch).length) {
        await run(c.from('students').update(patch).eq('id', s.id));
        s._orig = { name: s.name, ext_name: s.ext_name || null, archived_at: s.archived_at || null };
        changed = true;
      }
    }
    return changed;
  }

  /* ══ старое приложение: сеть ══ */
  function readCfg(){
    try {
      const url = (localStorage.getItem(LS_URL) || '').trim(), code = localStorage.getItem(LS_CODE) || '';
      return url && code ? { url: url.replace(/\/+$/, '').replace(/\/data$/, ''), code } : null;
    } catch (e) { return null; }
  }
  class SyncError extends Error { constructor(msg, code){ super(msg); this.code = code; } }
  async function remote(cfg, method, body){
    let r;
    try {
      r = await fetch(cfg.url + '/data', {
        method, cache: 'no-store',
        headers: Object.assign({ 'x-code': encodeURIComponent(cfg.code) }, body ? { 'content-type': 'application/json' } : {}),
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) { throw new SyncError('Старое приложение не отвечает (адрес или CORS в Worker)', 'network'); }
    if (r.status === 401) throw new SyncError('Код старого приложения не подходит', 'code');
    if (r.status === 409) { const j = await r.json(); return { conflict: true, rev: j.rev, data: j.data }; }
    if (r.status === 403) throw new SyncError('Это гостевой код — нужен код владельца', 'guest');
    if (!r.ok) throw new SyncError('Старое приложение ответило ошибкой ' + r.status, 'http');
    const j = await r.json();
    if (j && j.guest) throw new SyncError('Это гостевой код — нужен код владельца', 'guest');
    return j;
  }

  /* ══ один проход ══ */
  const S = { status: 'off', at: null, error: '', unknown: [], busy: false, lastMine: 0, lastTheirs: 0 };
  const listeners = [];
  const emit = () => listeners.slice().forEach(f => { try { f(S); } catch (e) {} });
  function setS(patch){ Object.assign(S, patch); emit(); }
  let opts = {};
  let running = null, again = 0;     // 0 — не нужно, 1 — авто, 2 — по кнопке
  const answers = {};          // ответы на конфликты: повтор после 409 не спрашивает заново

  async function cycle(manual){
    const cfg = readCfg();
    if (!cfg) { setS({ status: 'off', error: '' }); return; }
    if (!(await C.currentUser())) return;
    setS({ busy: true, error: '' });
    const from = addDays(today(), -PAST_DAYS);
    const cab = await loadCab(from);
    const first = !cab.sync;
    if (first && !manual) { setS({ status: 'wait_import' }); return; }
    const saved = first ? {} : ((cab.sync.base && cab.sync.base.u) || {});
    Object.keys(saved).forEach(k => { if (k.startsWith('d:') && k.slice(2) < from) delete saved[k]; });
    let extra = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      const rem = await remote(cfg, 'GET');
      // KV старого приложения отдаёт кэш до 30 с — старее нашей записи не берём
      if (!first && cab.sync.rev && (rem.rev || 0) < cab.sync.rev) { setS({ status: 'stale' }); return; }
      const raw = copy(rem.data) || {};
      const B = copy(saved);
      let rawDirty = false;
      const mark = () => { rawDirty = true; };
      let RN = remoteUnits(raw, from, B, mark);
      // переименовали в старом: из базы ушло одно имя и пришло одно новое — тот же ученик
      const gone = Object.keys(B).filter(k => k.startsWith('s:') && !RN[k]);
      const came = Object.keys(RN).filter(k => k.startsWith('s:') && !B[k]);
      if (gone.length === 1 && came.length === 1) {
        const s = cab.students.find(x => x.ext_name && norm(x.ext_name) === gone[0].slice(2));
        if (s) { renameUnits(B, B[gone[0]].n, RN[came[0]].n); s.name = s.ext_name = RN[came[0]].n; }
      }
      // привязка по имени: ученик кабинета без ext_name и такой же в старом
      cab.students.forEach(s => { if (!s.ext_name && RN['s:' + norm(s.name)] && !cab.students.some(o => o.ext_name && norm(o.ext_name) === norm(s.name))) s.ext_name = RN['s:' + norm(s.name)].n; });
      // переименовали в кабинете: name ≠ ext_name — правим старое везде
      let renamed = false;
      cab.students.forEach(s => {
        if (s.ext_name && s.ext_name !== s.name && (RN['s:' + norm(s.ext_name)] || B['s:' + norm(s.ext_name)])) {
          renameRaw(raw, s.ext_name, s.name); renameUnits(B, s.ext_name, s.name); renamed = true;
        }
      });
      if (renamed) { rawDirty = true; RN = remoteUnits(raw, from, B, mark); }
      const K = cabUnits(cab, from, B);
      const mg = merge(B, K, RN);
      const M = mg.M;
      if (first && !extra) {
        extra = await preview(cab, raw, RN, K, mg, from);
        if (!extra) { setS({ status: 'wait_import', busy: false }); return; }
      }
      for (const cf of mg.conflicts) {
        const key = cf.k + '|' + JSON.stringify(cf.mine) + '|' + JSON.stringify(cf.theirs);
        if (!answers[key]) answers[key] = await askConflict(cf, cab);
        const v = answers[key] === 'mine' ? cf.mine : cf.theirs;
        if (v === undefined) delete M[cf.k]; else M[cf.k] = copy(v);
      }
      // прошлые занятия при импорте (до окна) — один раз, по выбору в предпросмотре
      let hist = {};
      if (extra && extra.history) {
        const known = await pastExt(from);
        Object.keys(raw.schedule || {}).forEach(day => {
          if (day >= from || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
          const ls = rowsToN(raw.schedule[day].rows, true, null, mark).filter(l => !known[l.id]);
          if (ls.length) hist[day] = ls;
        });
      }
      let rev = rem.rev || 0;
      const toRemote = keysOf(M, RN).filter(k => !eq(M[k], RN[k]));
      if (toRemote.length || rawDirty) {
        const out = applyToRaw(raw, M, RN);
        const put = await remote(cfg, 'PUT', { base: rem.rev || 0, data: out });
        if (put.conflict) continue;                 // кто-то записал раньше — сводим заново
        rev = put.rev;
      }
      const a = await applyToCab(cab, M, K, Object.assign({}, extra || {}, { history: hist }));
      const b = await commitStudents(cab, M);
      const base = {};
      Object.keys(M).forEach(k => { if (!k.startsWith('d:') || k.slice(2) >= from) base[k] = M[k]; });
      await saveBase(rev, base);
      const unknown = unknownNames(cab, M);
      setS({ status: 'ok', at: new Date().toISOString(), unknown, busy: false, lastMine: toRemote.length, lastTheirs: keysOf(M, K).filter(k => !eq(M[k], K[k])).length });
      if ((a || b) && opts.onChanged) opts.onChanged();
      return;
    }
    throw new SyncError('Старое приложение всё время меняется — попробуем позже', 'busy');
  }
  async function pastExt(from){
    const out = {};
    for (let a = 0; ; a += 1000) {
      const part = await run(need().from('lessons').select('id, ext_id, day').lt('day', from).range(a, a + 999)) || [];
      part.forEach(l => { if (l.ext_id) out[l.ext_id] = 1; });
      if (part.length < 1000) break;
    }
    return out;
  }
  async function saveBase(rev, units){
    const u = await C.currentUser();
    await run(need().from('ext_sync').upsert({ owner: u && u.id, source: SOURCE, rev, base: { v: 1, u: units }, synced_at: new Date().toISOString() }, { onConflict: 'owner,source' }));
  }
  function skipped(){ try { return JSON.parse(localStorage.getItem(LS_SKIP) || '[]'); } catch (e) { return []; } }
  // имена из старого без ученика в кабинете: ученики списка старого и гости в строках
  function unknownNames(cab, M){
    const find = resolver(cab), out = {}, skip = skipped().map(norm);
    const add = n => { const k = norm(n); if (n && !find(n) && skip.indexOf(k) < 0 && !out[k]) out[k] = n; };
    Object.keys(M).forEach(k => {
      if (k.startsWith('s:') && !M[k].a) add(M[k].n);
      else if (k.startsWith('d:')) M[k].forEach(l => l.p.forEach(x => add(x[0])));
    });
    return Object.values(out).sort((a, b) => a.localeCompare(b, 'ru'));
  }

  async function sync(manual){
    if (running) { again = Math.max(again, manual ? 2 : 1); return running; }
    running = (async () => {
      try { await cycle(!!manual); }
      catch (e) { setS({ status: 'error', error: e.message || String(e) }); }
      finally {
        S.busy = false; running = null; emit();
        if (again) { const m = again === 2; again = 0; setTimeout(() => sync(m), 0); }
      }
    })();
    return running;
  }

  /* ══ окна: предпросмотр импорта и конфликт ══ */
  function modal(html){
    const o = document.createElement('div');
    o.className = 'sy-modal';
    o.innerHTML = '<div class="sy-box" role="dialog" aria-modal="true">' + html + '</div>';
    document.body.appendChild(o);
    return o;
  }
  const DAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  const MON = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const dayTitle = s => { const [y, m, d] = s.split('-').map(Number); const dt = new Date(y, m - 1, d); return DAYS[dt.getDay()] + ', ' + d + ' ' + MON[m - 1]; };
  const ST_SIGN = { plan: '', done: ' ✓', skip: ' ✕', move: ' ↷' };
  const lessonLine = l => (l.t == null ? '—' : hm(l.t)) + ' ' + (l.ev ? '«' + l.ti + '»' : l.p.map(x => x[0] + ST_SIGN[x[1]]).join(', ')) + (l.d !== DEF_DUR ? ' · ' + l.d + ' мин' : '');
  function describe(k, v){
    if (v === undefined) return '<i>нет</i>';
    const lines = list => (list.length ? list.slice().sort((a, b) => (a.t == null ? -1 : a.t) - (b.t == null ? -1 : b.t)).map(l => '<div>' + esc(lessonLine(l)) + '</div>').join('') : '<i>пусто</i>');
    if (k.startsWith('d:')) return lines(v);
    if (k.startsWith('t:')) return '<b>' + esc(v.n) + '</b>' + v.days.map((ls, i) => (ls.length ? '<div class="sy-dim">' + ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][i] + '</div>' + lines(ls) : '')).join('');
    if (k.startsWith('s:')) return esc(v.n) + (v.a ? ' (в архиве)' : '');
    if (k.startsWith('p:')) return esc(v.n || 'без названия') + ': ' + esc(v.m.join(', '));
    return esc(String(v));
  }
  function unitTitle(k, cf){
    if (k.startsWith('d:')) return 'День ' + dayTitle(k.slice(2));
    if (k.startsWith('t:')) return 'Шаблон недели «' + ((cf.mine || cf.theirs || {}).n || '') + '»';
    if (k.startsWith('s:')) return 'Ученик ' + ((cf.mine || cf.theirs || {}).n || '');
    if (k.startsWith('p:')) return 'Пара или группа';
    return 'Активный шаблон';
  }
  function askConflict(cf){
    return new Promise(resolve => {
      const o = modal('<h3>Правили в обоих местах</h3>' +
        '<p class="sy-dim">' + esc(unitTitle(cf.k, cf)) + ' изменили и в кабинете, и в старом приложении. Какой вариант оставить? Второй пропадёт в обоих местах.</p>' +
        '<div class="sy-two"><div class="sy-var"><div class="sy-h">В кабинете</div>' + describe(cf.k, cf.mine) + '</div>' +
        '<div class="sy-var"><div class="sy-h">В старом приложении</div>' + describe(cf.k, cf.theirs) + '</div></div>' +
        '<div class="sy-btns"><button class="btn" data-pick="mine">Оставить как в кабинете</button><button class="btn" data-pick="theirs">Взять из старого приложения</button></div>');
      o.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => { o.remove(); resolve(b.dataset.pick); }));
    });
  }
  function preview(cab, raw, RN, K, mg, from){
    const find = resolver(cab);
    const dayKeys = Object.keys(RN).filter(k => k.startsWith('d:'));
    const nLessons = dayKeys.reduce((n, k) => n + RN[k].length, 0);
    const past = Object.keys(raw.schedule || {}).filter(d => d < from && (raw.schedule[d].rows || []).some(isLessonRow));
    const nPast = past.reduce((n, d) => n + raw.schedule[d].rows.filter(isLessonRow).length, 0);
    const studs = Object.keys(RN).filter(k => k.startsWith('s:')).map(k => RN[k]);
    const matched = studs.filter(s => find(s.n)), fresh = studs.filter(s => !find(s.n));
    const inList = {};
    studs.forEach(s => { inList[norm(s.n)] = 1; });
    const guests = {};
    dayKeys.forEach(k => RN[k].forEach(l => l.p.forEach(x => { if (!inList[norm(x[0])] && !find(x[0])) guests[norm(x[0])] = x[0]; })));
    const tpls = Object.keys(RN).filter(k => k.startsWith('t:')).length;
    const toOld = keysOf(K).filter(k => !eq(K[k], RN[k]) && !mg.conflicts.some(c => c.k === k));
    return new Promise(resolve => {
      const o = modal('<h3>Первая синхронизация: импорт из старого приложения</h3>' +
        '<p>Занятия: <b>' + nLessons + '</b> в ' + dayKeys.length + ' днях, с ' + esc(dayTitle(from)) + ' и дальше. Шаблонов недели: <b>' + tpls + '</b>.</p>' +
        (nPast ? '<label class="sy-chk"><input type="checkbox" id="syHist" checked> Перенести и прошлые занятия: ' + nPast + ' (до ' + esc(dayTitle(from)) + '). Их дальше не сводим.</label>' : '') +
        (matched.length ? '<p>Уже есть в кабинете — свяжем по имени: ' + matched.map(s => '<b>' + esc(s.n) + '</b>').join(', ') + '.</p>' : '') +
        (fresh.length ? '<p>Ученики старого приложения, которых нет в кабинете. Отмеченных заведём:</p><div class="sy-list">' +
          fresh.map(s => '<label class="sy-chk"><input type="checkbox" data-new="' + esc(s.n) + '"' + (s.a ? '' : ' checked') + '> ' + esc(s.n) + (s.a ? ' <span class="sy-dim">(в архиве)</span>' : '') + '</label>').join('') + '</div>' : '') +
        (Object.keys(guests).length ? '<p>Только в строках расписания, останутся гостями (завести можно потом): ' + Object.values(guests).map(esc).join(', ') + '.</p>' : '') +
        (toOld.length ? '<p>Из кабинета уйдёт в старое приложение: ' + toOld.length + ' ' + 'разделов (дни, ученики, шаблоны).</p>' : '') +
        (mg.conflicts.length ? '<p>Есть и тут и там, по-разному: ' + mg.conflicts.length + ' — спросим по каждому.</p>' : '') +
        '<p class="sy-dim">Перед импортом сохраните копию в старом приложении («Сохранить файл»).</p>' +
        '<div class="sy-btns"><button class="btn" id="syGo">Импортировать</button><button class="btn quiet" id="syNo">Отмена</button></div>');
      o.querySelector('#syGo').addEventListener('click', () => {
        const create = Array.from(o.querySelectorAll('[data-new]:checked')).map(x => x.dataset.new);
        const h = o.querySelector('#syHist');
        o.remove();
        resolve({ create, history: !!(h && h.checked) });
      });
      o.querySelector('#syNo').addEventListener('click', () => { o.remove(); resolve(null); });
    });
  }

  /* ══ «завести ученика» из незнакомого имени ══ */
  async function adopt(name){
    const c = need();
    const s = await run(c.from('students').insert({ name: name.slice(0, 80), ext_name: name.slice(0, 80) }).select(SCOLS).single());
    // гостей с этим именем — в ученика: занятия и слоты шаблонов
    for (const t of ['lesson_students', 'template_slot_students']) {
      const rows = await run(c.from(t).select('id').eq('guest_name', name)) || [];
      for (const r of rows) await run(c.from(t).update({ student_id: s.id, guest_name: null }).eq('id', r.id));
    }
    S.unknown = S.unknown.filter(n => norm(n) !== norm(name));
    emit();
    if (opts.onChanged) opts.onChanged();
    return s;
  }
  function skipName(name){
    const list = skipped();
    if (list.map(norm).indexOf(norm(name)) < 0) list.push(name);
    try { localStorage.setItem(LS_SKIP, JSON.stringify(list)); } catch (e) {}
    S.unknown = S.unknown.filter(n => norm(n) !== norm(name));
    emit();
  }

  /* ══ когда синхронизировать ══ */
  let kickT = 0, timer = 0;
  const delay = () => (window.SCHEDULE_SYNC_DELAY != null ? window.SCHEDULE_SYNC_DELAY : 4000);
  function kick(){
    if (!readCfg()) return;
    clearTimeout(kickT);
    kickT = setTimeout(() => sync(false), delay());
  }
  // правки кабинета идут через ScheduleCloud / CabinetCloud — после каждой
  // удачной записи синхронизируем (с задержкой: правки идут пачками)
  function wrap(obj, names){
    names.forEach(n => {
      const f = obj && obj[n];
      if (typeof f !== 'function' || f.__sync) return;
      const w = function(){ const p = f.apply(this, arguments); Promise.resolve(p).then(kick, () => {}); return p; };
      w.__sync = true;
      obj[n] = w;
    });
  }
  function init(o){
    opts = o || {};
    wrap(SC, ['addLesson', 'updateLesson', 'deleteLesson', 'addPeople', 'setStatus', 'removePerson', 'addGroup', 'updateGroup', 'setGroupMembers', 'deleteGroup',
      'addTemplate', 'renameTemplate', 'deleteTemplate', 'setActiveTemplate', 'addSlot', 'updateSlot', 'deleteSlot', 'addSlotPeople', 'removeSlotPerson', 'setSlotPeople', 'duplicateTemplate']);
    wrap(C, ['addStudent', 'updateStudent', 'setArchived']);
    clearInterval(timer);
    timer = setInterval(() => { if (document.visibilityState === 'visible' && readCfg()) sync(false); }, EVERY_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && readCfg() && (!S.at || Date.now() - new Date(S.at).getTime() > 60000)) sync(false);
    });
    S.status = readCfg() ? 'idle' : 'off';
  }
  function configure(url, code){
    try {
      // код пустой, но уже сохранён — меняем только адрес
      if (url && (code || localStorage.getItem(LS_CODE))) { localStorage.setItem(LS_URL, String(url).trim()); if (code) localStorage.setItem(LS_CODE, String(code)); }
      else { localStorage.removeItem(LS_URL); localStorage.removeItem(LS_CODE); }
    } catch (e) {}
    setS({ status: readCfg() ? 'idle' : 'off', error: '' });
  }
  function config(){ const c = readCfg(); return c ? { url: c.url, hasCode: true } : { url: '', hasCode: false }; }

  // вёрстка окон — здесь же, чтобы модуль был самодостаточным
  const css = document.createElement('style');
  css.textContent = '.sy-modal{position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px}' +
    '.sy-box{background:var(--panel,#fff);color:var(--ink,#222);border-radius:14px;max-width:640px;width:100%;max-height:90vh;overflow:auto;padding:18px 20px;box-shadow:0 10px 40px rgba(0,0,0,.3)}' +
    '.sy-box h3{margin:0 0 10px}.sy-dim{opacity:.7;font-size:13px}.sy-two{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0}' +
    '.sy-var{border:1px solid var(--line,#ddd);border-radius:10px;padding:10px;font-size:14px}.sy-h{font-weight:600;margin-bottom:6px}' +
    '.sy-btns{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.sy-chk{display:block;margin:4px 0}.sy-list{max-height:200px;overflow:auto}' +
    '@media (max-width:520px){.sy-two{grid-template-columns:1fr}}';
  document.head.appendChild(css);

  window.ScheduleSync = { init, sync: () => sync(true), syncAuto: () => sync(false), configure, config, state: S, onChange: f => { listeners.push(f); return () => { const i = listeners.indexOf(f); if (i >= 0) listeners.splice(i, 1); }; },
    adopt, skipName,
    // для тестов: чистые функции сведения
    _t: { rowNorm, rowFrom, buildRows, rowsToN, merge, remoteUnits, renameRaw } };
})();
