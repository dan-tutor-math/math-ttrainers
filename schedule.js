/* ==========================================================
   schedule.js — вкладка «Расписание» кабинета (задача В1а).

   Одни данные (lessons + lesson_students, schedule-cloud.js) — два вида:
     «Строки» — как в приложении Даниила: дни списком, строка «время +
                имена», быстрый ввод «15:00 Маша, Петя», статус у каждого
                ученика одним нажатием (○ → ✓ → ✕ → ↷);
     «Неделя» — сетка часов как в планерах: плашка высотой в длительность,
                свободные окна видны сразу; клик по пустому — новое
                занятие, перетаскивание и растягивание с шагом 15 минут.
   Решения и разбор — claude-notes/schedule-audit.md.

   Вид запоминается в localStorage этого устройства, а не в настройках
   на сервере: на телефоне удобны «Строки», на компьютере «Неделя», и
   выбор на одном не должен переключать другое.

   Незнакомое имя в быстром вводе не заводится молча (решение Даниила):
   спрашиваем «завести ученика» или «оставить гостем» (guest_name).

   Кабинет зовёт Schedule.init({...}) один раз и Schedule.show(неделя) при
   каждом заходе на #/schedule[/ГГГГ-ММ-ДД].
   ========================================================== */
(function(){
  'use strict';
  const SC = window.ScheduleCloud;
  const STEP = 15;                 // шаг сетки, минут (решение Даниила)
  const PX = 1;                    // пикселей на минуту в сетке: час = 60px
  const VIEW_KEY = 'cabinet:schedule:view';
  const DAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const DAY_LONG = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const ST_SIGN = { plan: '○', done: '✓', skip: '✕', move: '↷' };
  const ST_NAME = { plan: 'запланировано', done: 'проведено', skip: 'пропуск', move: 'перенос' };
  const ST_NEXT = { plan: 'done', done: 'skip', skip: 'move', move: 'plan' };
  // что значит формат — в подсказке и легенде: подпись должна быть понятна
  // любому преподавателю, не только Даниилу
  const FMT_HINT = {
    single: 'один ученик',
    pair: 'двое одновременно, одно занятие на двоих',
    group: 'трое и больше вместе',
    semi: 'двое параллельно, преподаватель переходит от одного к другому',
  };

  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pad = n => (n < 10 ? '0' : '') + n;

  /* ── даты: день — строка ГГГГ-ММ-ДД по местному времени ── */
  const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const toDate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = toDate(s); d.setDate(d.getDate() + n); return ymd(d); };
  const today = () => ymd(new Date());
  const weekday = s => (toDate(s).getDay() + 6) % 7;          // 0 — понедельник
  const mondayOf = s => addDays(s, -weekday(s));
  const validDay = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !isNaN(toDate(s));
  function rangeText(mon){
    const a = toDate(mon), b = toDate(addDays(mon, 6));
    if (a.getMonth() === b.getMonth()) return a.getDate() + ' – ' + b.getDate() + ' ' + MONTHS[b.getMonth()] + ' ' + b.getFullYear();
    return a.getDate() + ' ' + MONTHS[a.getMonth()] + ' – ' + b.getDate() + ' ' + MONTHS[b.getMonth()] + ' ' + b.getFullYear();
  }
  const dayText = s => { const d = toDate(s); return d.getDate() + ' ' + MONTHS[d.getMonth()]; };

  /* ── время: минута суток ── */
  const hm = m => pad(Math.floor(m / 60)) + ':' + pad(m % 60);
  function timeText(l){
    if (l.start_min == null) return 'без времени';
    return hm(l.start_min) + ' – ' + hm(Math.min(1440, l.start_min + l.dur_min));
  }
  function parseHM(h, m){
    const H = Number(h), M = m == null || m === '' ? 0 : Number(m);
    return H >= 0 && H <= 24 && M >= 0 && M <= 59 && H * 60 + M <= 1440 ? H * 60 + M : null;
  }
  // «15:00 Маша, Петя», «9.30-11 Маша», «15 Петя», «Маша» (без времени)
  function parseQuick(text){
    const t = String(text || '').trim();
    const m = t.match(/^(\d{1,2})(?:[:.](\d{2}))?(?:\s*[-–—]\s*(\d{1,2})(?:[:.](\d{2}))?)?(?=\s|,|$)\s*,?\s*(.*)$/);
    let start = null, end = null, rest = t;
    if (m) {
      start = parseHM(m[1], m[2]);
      if (m[3] != null) end = parseHM(m[3], m[4]);
      rest = m[5];
      if (start != null && start >= 1440) start = null;
      if (end != null && start != null && end <= start) end = null;
    }
    const seen = new Set();
    const names = rest.split(/[,;]+/).map(s => s.trim().replace(/\s+/g, ' ')).filter(s => {
      const k = norm(s);
      if (!s || seen.has(k)) return false;
      seen.add(k); return true;
    });
    return { start, end, names };
  }

  /* ── ученики: имя из ввода → ученик ── */
  const norm = s => String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
  // точное полное имя; иначе «Маша» → «Маша Иванова» (по первым словам).
  // Несколько подходящих — спрашиваем, не угадываем
  function matchName(name, list){
    const n = norm(name);
    const exact = list.filter(s => norm(s.name) === n);
    if (exact.length) return exact;
    const words = n.split(' ');
    return list.filter(s => {
      const sw = norm(s.name).split(' ');
      return words.every((w, i) => sw[i] && sw[i].indexOf(w) === 0);
    });
  }

  /* ── состояние ── */
  let api = null, host = null;
  const st = { week: null, lessons: [], students: [], byId: {}, view: null, loadTok: 0, err: '', loading: false,
               mode: 'week', groups: [], tpls: [], tplId: null };   // mode: week | tpl | groups (В1б)
  let modal = null;           // открытая карточка занятия

  function readView(){
    try { const v = localStorage.getItem(VIEW_KEY); if (v === 'list' || v === 'grid') return v; } catch (e) {}
    return window.matchMedia && window.matchMedia('(max-width: 700px)').matches ? 'list' : 'grid';
  }
  function setView(v){
    st.view = v;
    try { localStorage.setItem(VIEW_KEY, v); } catch (e) {}
    render();
  }
  const settings = () => (api.settings && api.settings()) || {};
  const fmtLabel = f => ((settings().formatLabels || {})[f]) || ({ single: 'Индивидуальное', pair: 'Пара', group: 'Группа', semi: 'Полупараллелка' })[f];
  const defaultFormat = n => (n >= 3 ? 'group' : n === 2 ? 'pair' : 'single');
  // своя длительность ученика важнее настройки; у нескольких — самая
  // длинная из своих (занятие не должно обрезать чьё-то время)
  function durFor(people){
    const own = people.map(p => p.student_id && st.byId[p.student_id] && st.byId[p.student_id].dur_min).filter(Boolean);
    if (own.length) return Math.max.apply(null, own);
    const m = Number(settings().lessonMin);
    return m >= 5 && m <= 720 ? m : 60;
  }
  function personName(p){
    if (p.student_id) { const s = st.byId[p.student_id]; return s ? s.name : 'ученик удалён'; }
    return p.guest_name || '';
  }
  const lessonsOf = day => st.lessons.filter(l => l.day === day)
    .sort((a, b) => (a.start_min == null ? -1 : a.start_min) - (b.start_min == null ? -1 : b.start_min));
  const findLesson = id => st.lessons.find(l => l.id === id);
  function plural(n, a, b, c){ const m10 = n % 10, m100 = n % 100; return n + ' ' + (m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c); }

  /* ── загрузка недели ── */
  async function load(){
    const tok = ++st.loadTok;
    st.err = '';
    // пока неделя грузится, любая перерисовка (пришли настройки, щелчок в
    // соседней вкладке) показывает «Загружаем», а не пустую неделю из
    // старого или пустого st.lessons — иначе на миг «пропадали» занятия
    st.loading = true;
    render(true);
    try {
      const [students, lessons, groups, tpls] = await Promise.all([api.students(), SC.listRange(st.week, addDays(st.week, 6)), SC.listGroups(), SC.listTemplates()]);
      if (tok !== st.loadTok) return;
      setStudents(students);
      st.lessons = lessons;
      st.groups = groups;
      st.tpls = tpls;
      if (!st.tpls.some(t => t.id === st.tplId)) st.tplId = (st.tpls.find(t => t.is_active) || st.tpls[0] || {}).id || null;
    } catch (e) {
      if (tok !== st.loadTok) return;
      st.err = e.message || String(e);
      st.lessons = [];
    }
    st.loading = false;
    render();
  }
  function setStudents(list){
    st.students = list || [];
    st.byId = {};
    st.students.forEach(s => { st.byId[s.id] = s; });
  }
  const activeStudents = () => st.students.filter(s => !s.archived_at);

  /* ── запись с откатом: интерфейс не ждёт сеть ── */
  async function patchLesson(l, patch){
    const old = {};
    Object.keys(patch).forEach(k => { old[k] = l[k]; });
    Object.assign(l, patch);
    render();
    try { const fresh = await SC.updateLesson(l.id, patch); Object.assign(l, fresh); }
    catch (e) { Object.assign(l, old); api.toast('Не сохранилось: ' + e.message); }
    // занятие уехало в другую неделю — из этой его убираем
    if (l.day < st.week || l.day > addDays(st.week, 6)) st.lessons = st.lessons.filter(x => x !== l);
    render();
  }
  async function cycleStatus(l, p){
    const old = p.status;
    p.status = ST_NEXT[p.status] || 'done';
    render();
    try { await SC.setStatus(p.id, p.status); }
    catch (e) { p.status = old; api.toast('Не сохранилось: ' + e.message); render(); }
  }

  /* ── незнакомые имена: спросить, а не заводить молча ──
     box — куда нарисовать вопросы. Ответ — список участников или null
     (отмена). Новые ученики заводятся только после ответа на все вопросы */
  function resolveNames(names, box, opts){
    const noGuest = !!(opts && opts.noGuest);
    const list = activeStudents();
    const items = names.map(n => {
      const c = matchName(n, list);
      return { name: n, cands: c, choice: c.length === 1 ? { student_id: c[0].id } : null };
    });
    return new Promise(resolve => {
      const open = items.filter(it => !it.choice);
      if (!open.length) { box.innerHTML = ''; resolve(items.map(it => it.choice)); return; }
      const finish = async () => {
        if (items.some(it => !it.choice)) return;
        box.innerHTML = '<div class="hint">Сохраняем…</div>';
        try {
          for (const it of items) {
            if (it.choice.create) {
              const s = await api.addStudent(it.name);
              st.students.push(s); st.byId[s.id] = s;
              it.choice = { student_id: s.id };
            }
          }
          box.innerHTML = '';
          resolve(items.map(it => it.choice));
        } catch (e) { box.innerHTML = '<div class="form-msg">' + esc(e.message) + '</div>'; resolve(null); }
      };
      box.innerHTML = open.map((it, i) =>
        '<div class="sc-ask" data-i="' + items.indexOf(it) + '">' +
          '<span class="sc-ask-q">«' + esc(it.name) + '» — ' + (it.cands.length ? 'кого вы имели в виду?' : 'такого ученика нет') + '</span>' +
          '<span class="sc-ask-a">' +
            it.cands.map(s => '<button type="button" class="btn quiet small" data-pick="' + esc(s.id) + '">' + esc(s.name) + '</button>').join('') +
            (it.cands.length ? '' : '<button type="button" class="btn quiet small" data-act="create">Завести ученика</button>') +
            (noGuest ? '' : '<button type="button" class="btn quiet small" data-act="guest">Оставить гостем</button>') +
          '</span></div>').join('') +
        '<div class="sc-ask-foot"><button type="button" class="btn quiet small" data-act="cancel">Отмена</button></div>';
      box.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        if (b.dataset.act === 'cancel') { box.innerHTML = ''; resolve(null); return; }
        const row = b.closest('.sc-ask'), it = items[Number(row.dataset.i)];
        if (b.dataset.pick) it.choice = { student_id: b.dataset.pick };
        else if (b.dataset.act === 'create') it.choice = { create: true };
        else it.choice = { guest_name: it.name };
        row.classList.add('done');
        row.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
        finish();
      }));
    });
  }

  /* ── устойчивые пары и группы в быстром вводе (В1б) ──
     Название пары в строке («Маша + Петя») разворачивается в её учеников;
     а если ученики строки в точности совпали с составом сохранённой пары
     или группы, занятие сразу получает её формат, длительность и ссылку */
  const sameSet = (a, b) => a.length === b.length && a.every(x => b.indexOf(x) >= 0);
  const liveGroups = () => st.groups.filter(g => !g.archived_at && g.members.length);
  const groupByName = n => liveGroups().find(g => norm(g.name) === norm(n));
  const groupOf = ids => (ids.length >= 2 ? liveGroups().find(g => sameSet(g.members, ids)) : null) || null;

  // текст строки → { start, dur, people, format, group_id } | { msg } | { cancelled }
  async function resolveEntry(text, box, hint){
    const q = parseQuick(text);
    if (!q.names.length) return { msg: 'Напишите имя: «15:00 Маша, Петя»' };
    const named = [], rest = [];
    q.names.forEach(n => { const g = groupByName(n); if (g) named.push(g); else rest.push(n); });
    const found = rest.length ? await resolveNames(rest, box) : [];
    if (!found) return { cancelled: true };
    const people = [];
    const has = p => people.some(x => p.student_id ? x.student_id === p.student_id : x.guest_name === p.guest_name);
    named.forEach(g => g.members.forEach(id => { if (!has({ student_id: id })) people.push({ student_id: id }); }));
    found.forEach(p => { if (!has(p)) people.push(p); });
    const ids = people.map(p => p.student_id);
    const grp = ids.every(Boolean) ? groupOf(ids) : null;
    const start = q.start != null ? q.start : (hint && hint.start != null ? hint.start : null);
    let dur = q.end != null && q.start != null ? q.end - q.start : (hint && hint.dur) || (grp && grp.dur_min) || durFor(people);
    if (start != null) dur = Math.min(dur, 1440 - start);
    return { start, dur: Math.max(5, dur), people, format: grp ? grp.format : defaultFormat(people.length), group_id: grp ? grp.id : null };
  }
  // новое занятие из текста: день известен, время — из текста или подсказки
  async function createFromText(day, text, box, hint){
    const r = await resolveEntry(text, box, hint);
    if (!r.people) return r;
    try {
      const l = await SC.addLesson({ day, start_min: r.start, dur_min: r.dur, format: r.format, group_id: r.group_id }, r.people);
      if (l.day >= st.week && l.day <= addDays(st.week, 6)) st.lessons.push(l);
      render();
      return { lesson: l };
    } catch (e) { return { msg: e.message }; }
  }

  /* ── шапка ── */
  function modesHtml(){
    return '<div class="seg sc-modes" role="group" aria-label="Раздел расписания">' +
      [['week', 'Занятия'], ['tpl', 'Шаблоны недели'], ['groups', 'Пары и группы']].map(m =>
        '<button type="button" data-mode="' + m[0] + '" class="' + (st.mode === m[0] ? 'on' : '') + '">' + m[1] + '</button>').join('') + '</div>';
  }
  function headHtml(){
    if (st.mode !== 'week') return modesHtml();
    const fl = ['single', 'pair', 'group', 'semi'];
    return modesHtml() + '<div class="sc-head">' +
        '<div class="sc-nav">' +
          '<a class="btn quiet small sc-arrow" id="scPrev" href="' + esc(api.weekHref(addDays(st.week, -7))) + '" aria-label="Предыдущая неделя">‹</a>' +
          '<span class="sc-range" id="scRange">' + esc(rangeText(st.week)) + '</span>' +
          '<a class="btn quiet small sc-arrow" id="scNext" href="' + esc(api.weekHref(addDays(st.week, 7))) + '" aria-label="Следующая неделя">›</a>' +
          '<a class="btn quiet small" id="scToday" href="' + esc(api.weekHref(null)) + '"' + (mondayOf(today()) === st.week ? ' aria-current="true"' : '') + '>Сегодня</a>' +
        '</div>' +
        TPL().weekMenuHtml() +
        '<div class="seg sc-views" role="group" aria-label="Вид расписания">' +
          '<button type="button" data-v="list" class="' + (st.view === 'list' ? 'on' : '') + '">Строки</button>' +
          '<button type="button" data-v="grid" class="' + (st.view === 'grid' ? 'on' : '') + '">Неделя</button>' +
        '</div>' +
      '</div>' +
      '<div class="sc-legend">' + fl.map(f => '<span class="sc-lg fmt-' + f + '" title="' + esc(FMT_HINT[f]) + '"><i></i>' + esc(fmtLabel(f)) + '</span>').join('') +
        '<span class="sc-lg-st">' + ['done', 'skip', 'move'].map(s => '<b class="st-' + s + '">' + ST_SIGN[s] + '</b> ' + ST_NAME[s]).join(' · ') + '</span></div>';
  }

  /* ── вид «Строки» ── */
  function peopleHtml(l, mini){
    if (l.is_event) return '<span class="sc-ev">' + esc(l.title || 'событие') + '</span>';
    if (!l.people.length) return '<span class="hint">нет учеников</span>';
    return l.people.map(p =>
      '<span class="sc-p st-' + p.status + (p.student_id ? '' : ' guest') + '">' +
        (mini ? '<b class="sc-sg">' + (p.status === 'plan' ? '' : ST_SIGN[p.status]) + '</b>'
              : '<button type="button" class="sc-st st-' + p.status + '" data-pid="' + esc(p.id) + '" title="' + esc(ST_NAME[p.status]) + ' — нажмите, чтобы сменить" aria-label="Статус: ' + esc(ST_NAME[p.status]) + '">' + ST_SIGN[p.status] + '</button>') +
        '<span class="nm">' + esc(personName(p)) + '</span>' +
        (p.student_id ? '' : '<span class="sc-guest" title="Гость — без карточки ученика">гость</span>') +
      '</span>').join('');
  }
  function fmtSelect(l){
    return '<select class="sc-fmt fmt-' + l.format + '" data-id="' + esc(l.id) + '" aria-label="Формат занятия" title="' + esc(FMT_HINT[l.format]) + '">' +
      SC.FORMATS.map(f => '<option value="' + f + '"' + (f === l.format ? ' selected' : '') + '>' + esc(fmtLabel(f)) + '</option>').join('') + '</select>';
  }
  function listHtml(){
    let h = '<div class="sc-days">';
    for (let i = 0; i < 7; i++) {
      const day = addDays(st.week, i), ls = lessonsOf(day);
      h += '<section class="sc-day' + (day === today() ? ' today' : '') + '" data-day="' + day + '">' +
        '<header class="sc-dh"><b>' + DAY_SHORT[i] + '</b><span>' + esc(dayText(day)) + '</span>' +
          '<span class="sc-cnt">' + (ls.length ? plural(ls.length, 'занятие', 'занятия', 'занятий') : '') + '</span>' +
          '<button type="button" class="sc-plus" data-day="' + day + '" aria-label="Добавить занятие: ' + DAY_LONG[i] + ', ' + esc(dayText(day)) + '" title="Добавить занятие">+</button></header>' +
        '<div class="sc-rows">' + (ls.length ? ls.map(l =>
          '<div class="sc-row fmt-' + l.format + '" data-id="' + esc(l.id) + '">' +
            '<button type="button" class="sc-time" data-open="' + esc(l.id) + '" title="Открыть занятие">' + esc(timeText(l)) + '</button>' +
            '<div class="sc-people">' + peopleHtml(l) + '</div>' +
            (l.is_event ? '' : fmtSelect(l)) +
          '</div>').join('') : '<div class="sc-free">свободно</div>') + '</div>' +
        '<form class="sc-quick" data-day="' + day + '" hidden>' +
          '<input class="field" maxlength="300" placeholder="15:00 Маша, Петя" aria-label="Новое занятие: время и имена через запятую" autocomplete="off">' +
          '<button class="btn small" type="submit">Добавить</button>' +
          '<div class="sc-qmsg form-msg"></div><div class="sc-resolve"></div>' +
        '</form>' +
      '</section>';
    }
    return h + '</div>';
  }
  function bindList(){
    host.querySelectorAll('.sc-plus').forEach(b => b.addEventListener('click', () => {
      const f = host.querySelector('.sc-quick[data-day="' + b.dataset.day + '"]');
      f.hidden = !f.hidden;
      if (!f.hidden) f.querySelector('input').focus();
    }));
    host.querySelectorAll('.sc-quick').forEach(f => {
      // быстрый ввод — Enter и следующая строка: форма остаётся открытой
      f.addEventListener('submit', async e => {
        e.preventDefault();
        const inp = f.querySelector('input'), msg = f.querySelector('.sc-qmsg');
        msg.textContent = '';
        quickBusy = f.dataset.day;
        const r = await createFromText(f.dataset.day, inp.value, f.querySelector('.sc-resolve'));
        quickBusy = null;
        render();
        const nf = host.querySelector('.sc-quick[data-day="' + f.dataset.day + '"]');
        if (!nf) return;
        nf.hidden = false;
        const ni = nf.querySelector('input');
        if (r.lesson) { ni.value = ''; }
        else { ni.value = inp.value; if (r.msg) nf.querySelector('.sc-qmsg').textContent = r.msg; }
        ni.focus();
      });
    });
    bindCommon();
  }
  function bindCommon(){
    host.querySelectorAll('.sc-st[data-pid]').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      const l = findLesson(b.closest('[data-id]').dataset.id);
      const p = l && l.people.find(x => x.id === b.dataset.pid);
      if (p) cycleStatus(l, p);
    }));
    host.querySelectorAll('select.sc-fmt').forEach(s => s.addEventListener('change', () => {
      const l = findLesson(s.dataset.id);
      if (l) patchLesson(l, { format: s.value });
    }));
    host.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => {
      const l = findLesson(b.dataset.open);
      if (l) openPanel(l);
    }));
  }

  /* ── вид «Неделя»: сетка часов ── */
  function hoursRange(){
    let a = 8 * 60, b = 21 * 60;
    st.lessons.forEach(l => {
      if (l.start_min == null) return;
      a = Math.min(a, Math.floor(l.start_min / 60) * 60);
      b = Math.max(b, Math.ceil((l.start_min + l.dur_min) / 60) * 60);
    });
    return [Math.max(0, a), Math.min(1440, b)];
  }
  // пересекающиеся занятия одного дня — рядом, каждое в свою колонку
  function layoutDay(ls){
    const timed = ls.filter(l => l.start_min != null).sort((a, b) => a.start_min - b.start_min || b.dur_min - a.dur_min);
    const out = new Map();
    let cluster = [], cEnd = -1;
    const flush = () => {
      const cols = [];
      cluster.forEach(l => {
        let k = cols.findIndex(end => end <= l.start_min);
        if (k < 0) { k = cols.length; cols.push(0); }
        cols[k] = l.start_min + l.dur_min;
        out.set(l, { col: k });
      });
      cluster.forEach(l => { out.get(l).n = cols.length; });
      cluster = []; cEnd = -1;
    };
    timed.forEach(l => {
      if (cluster.length && l.start_min >= cEnd) flush();
      cluster.push(l);
      cEnd = Math.max(cEnd, l.start_min + l.dur_min);
    });
    if (cluster.length) flush();
    return out;
  }
  function plateHtml(l, pos, a){
    const top = (l.start_min - a) * PX, hgt = Math.max(STEP, l.dur_min) * PX;
    const w = 100 / pos.n;
    return '<div class="sc-plate fmt-' + l.format + (l.dur_min <= 30 ? ' short' : '') + '" data-id="' + esc(l.id) + '" ' +
        'style="top:' + top + 'px;height:' + hgt + 'px;left:calc(' + (w * pos.col) + '% + 2px);width:calc(' + w + '% - 4px)" ' +
        'role="button" tabindex="0" aria-label="' + esc(timeText(l) + ', ' + (l.is_event ? l.title : l.people.map(personName).join(', '))) + '">' +
        '<div class="sc-pt">' + esc(timeText(l)) + '</div>' +
        '<div class="sc-pn">' + peopleHtml(l, true) + '</div>' +
        (l.format !== 'single' && !l.is_event ? '<div class="sc-pf" title="' + esc(FMT_HINT[l.format]) + '">' + esc(fmtLabel(l.format)) + '</div>' : '') +
        '<div class="sc-rz" title="Потяните, чтобы изменить длительность" aria-hidden="true"></div>' +
      '</div>';
  }
  function gridHtml(){
    const [a, b] = hoursRange();
    const H = (b - a) * PX;
    let head = '<div class="sc-gcorner"></div>', cols = '';
    for (let i = 0; i < 7; i++) {
      const day = addDays(st.week, i), ls = lessonsOf(day);
      const untimed = ls.filter(l => l.start_min == null);
      head += '<div class="sc-gday' + (day === today() ? ' today' : '') + '"><b>' + DAY_SHORT[i] + '</b> ' + esc(dayText(day)) +
        '<button type="button" class="sc-plus" data-newday="' + day + '" aria-label="Добавить занятие: ' + DAY_LONG[i] + ', ' + esc(dayText(day)) + '" title="Добавить занятие">+</button>' +
        (untimed.length ? '<div class="sc-untimed">' + untimed.map(l => '<button type="button" class="sc-ut fmt-' + l.format + '" data-open="' + esc(l.id) + '">' + esc(l.people.map(personName).join(', ') || l.title || 'без времени') + '</button>').join('') + '</div>' : '') +
        '</div>';
      const pos = layoutDay(ls);
      cols += '<div class="sc-col' + (day === today() ? ' today' : '') + '" data-day="' + day + '" style="height:' + H + 'px">' +
        ls.filter(l => l.start_min != null).map(l => plateHtml(l, pos.get(l), a)).join('') + '</div>';
    }
    let hours = '';
    for (let m = a; m < b; m += 60) hours += '<div class="sc-hr" style="top:' + (m - a) * PX + 'px">' + hm(m) + '</div>';
    return '<div class="sc-gwrap"><div class="sc-grid" data-a="' + a + '" data-b="' + b + '">' +
      '<div class="sc-ghead">' + head + '</div>' +
      '<div class="sc-gbody"><div class="sc-hours" style="height:' + H + 'px">' + hours + '</div>' + cols + '</div>' +
      '</div></div><div class="hint sc-ghint">Щёлкните по свободному месту — новое занятие. Плашку можно перетащить и растянуть за нижний край (шаг 15 минут).</div>';
  }
  function bindGrid(){
    const grid = host.querySelector('.sc-grid');
    const a = Number(grid.dataset.a), b = Number(grid.dataset.b);
    const cols = Array.from(host.querySelectorAll('.sc-col'));
    const snap = m => Math.round(m / STEP) * STEP;
    host.querySelectorAll('[data-newday]').forEach(btn => btn.addEventListener('click', () => openNew(btn.dataset.newday, null)));
    cols.forEach(col => {
      col.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        const plate = e.target.closest('.sc-plate');
        const r0 = col.getBoundingClientRect();
        if (!plate) {
          // пустое место: новое занятие с начала четверти часа под курсором
          const y0 = e.clientY;
          const off = () => { col.removeEventListener('pointerup', up); col.removeEventListener('pointercancel', off); };
          const up = ev => {
            off();
            if (Math.abs(ev.clientY - y0) > 6) return;      // это была прокрутка
            const m = Math.floor(((ev.clientY - r0.top) / PX + a) / STEP) * STEP;
            openNew(col.dataset.day, Math.max(a, Math.min(b - STEP, m)));
          };
          col.addEventListener('pointerup', up);
          col.addEventListener('pointercancel', off);
          return;
        }
        const l = findLesson(plate.dataset.id);
        if (!l) return;
        e.preventDefault();
        const resize = !!e.target.closest('.sc-rz');
        const rects = cols.map(c => c.getBoundingClientRect());
        const ci = cols.indexOf(col);
        const x0 = e.clientX, y0 = e.clientY;
        let moved = false, dMin = 0, dCol = 0, newDur = l.dur_min;
        try { plate.setPointerCapture(e.pointerId); } catch (er) {}
        const label = plate.querySelector('.sc-pt');
        const move = ev => {
          const dy = ev.clientY - y0, dx = ev.clientX - x0;
          if (!moved && Math.abs(dy) < 4 && Math.abs(dx) < 4) return;
          moved = true;
          plate.classList.add('drag');
          if (resize) {
            newDur = Math.max(STEP, Math.min(1440 - l.start_min, l.dur_min + snap(dy / PX)));
            plate.style.height = newDur * PX + 'px';
            label.textContent = hm(l.start_min) + ' – ' + hm(l.start_min + newDur);
          } else {
            dMin = Math.max(-l.start_min, Math.min(1440 - l.dur_min - l.start_min, snap(dy / PX)));
            // колонка под курсором (дни недели)
            let k = rects.findIndex(r => ev.clientX >= r.left && ev.clientX < r.right);
            if (k < 0) k = ev.clientX < rects[0].left ? 0 : rects.length - 1;
            dCol = k - ci;
            plate.style.transform = 'translate(' + (rects[k].left - rects[ci].left) + 'px,' + dMin * PX + 'px)';
            label.textContent = hm(l.start_min + dMin) + ' – ' + hm(l.start_min + dMin + l.dur_min);
          }
        };
        const up = () => {
          plate.removeEventListener('pointermove', move);
          plate.removeEventListener('pointerup', up);
          plate.removeEventListener('pointercancel', up);
          if (!moved) { openPanel(l); return; }
          if (resize) { if (newDur !== l.dur_min) patchLesson(l, { dur_min: newDur }); else render(); return; }
          const patch = {};
          if (dMin) patch.start_min = l.start_min + dMin;
          if (dCol) patch.day = addDays(l.day, dCol);
          if (Object.keys(patch).length) patchLesson(l, patch); else render();
        };
        plate.addEventListener('pointermove', move);
        plate.addEventListener('pointerup', up);
        plate.addEventListener('pointercancel', up);
      });
      col.addEventListener('keydown', e => {
        const plate = e.target.closest('.sc-plate');
        if (plate && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); const l = findLesson(plate.dataset.id); if (l) openPanel(l); }
      });
    });
    bindCommon();
  }

  /* ── карточка занятия (общая для обоих видов) ── */
  function closeModal(){
    if (!modal) return;
    modal.el.remove();
    document.removeEventListener('keydown', modal.onKey);
    modal = null;
  }
  function modalShell(title){
    closeModal();
    const el = document.createElement('div');
    el.className = 'sc-modal';
    el.innerHTML = '<div class="sc-sheet panel" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"></div>';
    el.addEventListener('pointerdown', e => { if (e.target === el) closeModal(); });
    document.body.appendChild(el);
    const onKey = e => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', onKey);
    modal = { el, sheet: el.firstChild, onKey };
    return modal;
  }
  const timeVal = m => (m == null ? '' : hm(m));
  function readTime(v){ const m = String(v || '').match(/^(\d{1,2}):(\d{2})$/); return m ? parseHM(m[1], m[2]) : null; }

  // новое занятие: день и время уже есть (клик по сетке или «+»)
  function openNew(day, start){
    const m = modalShell('Новое занятие');
    const dur = durFor([]);
    m.sheet.innerHTML =
      '<div class="sc-ed-head"><b>Новое занятие</b><button type="button" class="sc-x" aria-label="Закрыть">×</button></div>' +
      '<div class="sc-ed-grid">' +
        '<label><span class="label">День</span><input class="field" type="date" id="edDay" value="' + day + '"></label>' +
        '<label><span class="label">С</span><input class="field" type="time" step="900" id="edStart" value="' + timeVal(start) + '"></label>' +
        '<label><span class="label">До</span><input class="field" type="time" step="900" id="edEnd" value="' + (start == null ? '' : timeVal(Math.min(1440, start + dur))) + '"></label>' +
      '</div>' +
      '<form id="edNewForm" class="sc-addrow"><input class="field" id="edNames" maxlength="300" placeholder="Маша, Петя" aria-label="Ученики через запятую" autocomplete="off">' +
        '<button class="btn" type="submit" id="edCreate">Создать</button></form>' +
      '<div class="hint">Имена через запятую. Двое — «пара», трое и больше — «группа»; формат можно сменить потом.</div>' +
      '<div class="form-msg" id="edMsg"></div><div class="sc-resolve" id="edResolve"></div>';
    m.sheet.querySelector('.sc-x').addEventListener('click', closeModal);
    // длительность по умолчанию держим, пока преподаватель не тронул «До»
    let endTouched = false;
    m.sheet.querySelector('#edEnd').addEventListener('input', () => { endTouched = true; });
    m.sheet.querySelector('#edStart').addEventListener('change', e => {
      const s = readTime(e.target.value);
      if (s != null && !endTouched) m.sheet.querySelector('#edEnd').value = timeVal(Math.min(1440, s + dur));
    });
    m.sheet.querySelector('#edNewForm').addEventListener('submit', async e => {
      e.preventDefault();
      const dayV = m.sheet.querySelector('#edDay').value;
      if (!validDay(dayV)) { m.sheet.querySelector('#edMsg').textContent = 'Выберите день'; return; }
      const s = readTime(m.sheet.querySelector('#edStart').value), en = readTime(m.sheet.querySelector('#edEnd').value);
      const hint = { start: s, dur: s != null && en != null && en > s && endTouched ? en - s : null };
      const btn = m.sheet.querySelector('#edCreate');
      btn.disabled = true;
      const r = await createFromText(dayV, m.sheet.querySelector('#edNames').value, m.sheet.querySelector('#edResolve'), hint);
      if (!modal || modal !== m) return;
      btn.disabled = false;
      if (r.lesson) { closeModal(); api.toast('Занятие добавлено'); }
      else if (r.msg) m.sheet.querySelector('#edMsg').textContent = r.msg;
    });
    setTimeout(() => { const n = m.sheet.querySelector('#edNames'); if (n) n.focus(); }, 0);
  }

  function openEditor(l){
    const m = modalShell('Занятие');
    m.lessonId = l.id;
    m.sheet.innerHTML =
      '<div class="sc-ed-head"><b>Занятие</b><button type="button" class="sc-x" aria-label="Закрыть">×</button></div>' +
      '<div class="sc-ed-grid">' +
        '<label><span class="label">День</span><input class="field" type="date" id="edDay"></label>' +
        '<label><span class="label">С</span><input class="field" type="time" step="900" id="edStart"></label>' +
        '<label><span class="label">До</span><input class="field" type="time" step="900" id="edEnd"></label>' +
      '</div>' +
      '<div class="label">Формат</div><div class="seg sc-edfmt" id="edFmt"></div><div class="hint" id="edFmtHint"></div>' +
      '<div class="label" style="margin-top:12px">Ученики</div><div class="sc-edpeople" id="edPeople"></div>' +
      '<form id="edAddForm" class="sc-addrow"><input class="field" id="edAdd" maxlength="300" placeholder="Добавить: Маша, Петя" aria-label="Добавить учеников" autocomplete="off">' +
        '<button class="btn quiet" type="submit">Добавить</button></form>' +
      '<div class="form-msg" id="edMsg"></div><div class="sc-resolve" id="edResolve"></div>' +
      '<div class="row-btns sc-ed-foot"><button type="button" class="btn danger" id="edDel">Удалить занятие</button>' +
        '<button type="button" class="btn" id="edDone">Готово</button></div>';
    const q = s => m.sheet.querySelector(s);
    q('.sc-x').addEventListener('click', closeModal);
    q('#edDone').addEventListener('click', closeModal);
    q('#edDay').addEventListener('change', e => { if (validDay(e.target.value)) patchLesson(l, { day: e.target.value }); });
    q('#edStart').addEventListener('change', e => {
      const s = readTime(e.target.value);
      if (s == null) return;
      patchLesson(l, { start_min: s, dur_min: Math.min(l.dur_min, 1440 - s) });
    });
    q('#edEnd').addEventListener('change', e => {
      const en = readTime(e.target.value);
      if (en == null || l.start_min == null) return;
      if (en <= l.start_min) { q('#edMsg').textContent = 'Конец должен быть позже начала'; paintEditor(); return; }
      q('#edMsg').textContent = '';
      patchLesson(l, { dur_min: en - l.start_min });
    });
    q('#edAddForm').addEventListener('submit', async e => {
      e.preventDefault();
      const names = parseQuick(q('#edAdd').value).names;
      if (!names.length) return;
      const people = await resolveNames(names, q('#edResolve'));
      if (!people || modal !== m) return;
      // ученик уже на занятии — второй раз не добавляем (в базе unique)
      const fresh = people.filter(p => !p.student_id || !l.people.some(x => x.student_id === p.student_id));
      if (!fresh.length) { q('#edAdd').value = ''; return; }
      try {
        const rows = await SC.addPeople(l.id, fresh, l.people.reduce((mx, p) => Math.max(mx, p.pos + 1), 0));
        l.people = l.people.concat(rows).sort((a, b) => a.pos - b.pos);
        q('#edAdd').value = '';
        render();
      } catch (er) { q('#edMsg').textContent = er.message; }
    });
    let delArmed = false;
    q('#edDel').addEventListener('click', async () => {
      // второе нажатие — подтверждение: занятие с отметками жалко потерять
      if (!delArmed) { delArmed = true; q('#edDel').textContent = 'Точно удалить?'; return; }
      q('#edDel').disabled = true;
      try {
        await SC.deleteLesson(l.id);
        st.lessons = st.lessons.filter(x => x !== l);
        closeModal(); render(); api.toast('Занятие удалено');
      } catch (er) { q('#edMsg').textContent = er.message; q('#edDel').disabled = false; }
    });
    paintEditor();
  }
  // перерисовка карточки после правки: поля, на которых стоит курсор, не трогаем
  function paintEditor(){
    if (!modal || !modal.lessonId) return;
    const l = findLesson(modal.lessonId);
    if (!l) { closeModal(); return; }
    const q = s => modal.sheet.querySelector(s);
    const setv = (sel, v) => { const el = q(sel); if (el && document.activeElement !== el) el.value = v; };
    setv('#edDay', l.day);
    setv('#edStart', timeVal(l.start_min));
    setv('#edEnd', l.start_min == null ? '' : timeVal(Math.min(1440, l.start_min + l.dur_min)));
    q('#edFmt').innerHTML = SC.FORMATS.map(f => '<button type="button" data-v="' + f + '" class="' + (f === l.format ? 'on' : '') + '" title="' + esc(FMT_HINT[f]) + '">' + esc(fmtLabel(f)) + '</button>').join('');
    q('#edFmtHint').textContent = fmtLabel(l.format) + ' — ' + FMT_HINT[l.format];
    q('#edFmt').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { if (b.dataset.v !== l.format) patchLesson(l, { format: b.dataset.v }); }));
    q('#edPeople').innerHTML = l.people.length ? l.people.map(p =>
      '<div class="sc-edp st-' + p.status + '" data-id="' + esc(l.id) + '">' +
        '<button type="button" class="sc-st st-' + p.status + '" data-pid="' + esc(p.id) + '" title="' + esc(ST_NAME[p.status]) + ' — нажмите, чтобы сменить">' + ST_SIGN[p.status] + '</button>' +
        '<span class="nm">' + esc(personName(p)) + (p.student_id ? '' : ' <span class="sc-guest">гость</span>') + '</span>' +
        '<span class="hint">' + esc(ST_NAME[p.status]) + '</span>' +
        '<button type="button" class="sc-rm" data-rm="' + esc(p.id) + '" aria-label="Убрать с занятия: ' + esc(personName(p)) + '" title="Убрать с занятия">×</button>' +
      '</div>').join('') : '<div class="hint">Учеников нет — добавьте ниже.</div>';
    q('#edPeople').querySelectorAll('.sc-st').forEach(b => b.addEventListener('click', () => {
      const p = l.people.find(x => x.id === b.dataset.pid);
      if (p) cycleStatus(l, p);
    }));
    q('#edPeople').querySelectorAll('.sc-rm').forEach(b => b.addEventListener('click', async () => {
      const p = l.people.find(x => x.id === b.dataset.rm);
      if (!p) return;
      l.people = l.people.filter(x => x !== p);
      render();
      try { await SC.removePerson(p.id); }
      catch (er) { l.people.push(p); l.people.sort((x, y) => x.pos - y.pos); api.toast('Не сохранилось: ' + er.message); render(); }
    }));
  }


  /* ── боковая панель занятия (В2) ──
     Щелчок по занятию открывает краткую карточку ученика и три действия:
     «Открыть карточку», «Открыть доску», «Начать сессию». Правка занятия
     (время, формат, состав) — по кнопке «Править занятие», как раньше.
     В паре и группе сверху — выбор ученика, действия относятся к нему.
     Панель не закрывает расписание (без затемнения): при разборе занятий
     удобно видеть соседние. Сессия начинается с lessonId — события журнала
     этой сессии помечаются занятием (StudentMemory.start, Б1). */
  const EXAM_SHORT = { oge: 'ОГЭ, математика', ege_prof: 'ЕГЭ, профиль', ege_base: 'ЕГЭ, база', rus_oge: 'ОГЭ, русский' };
  let panel = null;           // { el, lessonId, sid, onKey, off }
  function closePanel(){
    if (!panel) return;
    panel.el.remove();
    document.removeEventListener('keydown', panel.onKey);
    if (panel.off) panel.off();
    panel = null;
  }
  function openPanel(l, sid){
    const people = l.people.filter(p => p.student_id);
    const first = sid || (people[0] && people[0].student_id) || null;
    if (panel && panel.lessonId === l.id && !sid) { paintPanel(); return; }
    closePanel();
    const el = document.createElement('aside');
    el.className = 'sc-side panel';
    el.setAttribute('aria-label', 'Занятие');
    document.body.appendChild(el);
    const onKey = e => { if (e.key === 'Escape' && !modal) closePanel(); };
    document.addEventListener('keydown', onKey);
    panel = { el, lessonId: l.id, sid: first, onKey, off: null };
    const SM = window.StudentMemory;
    if (SM && SM.onChange) panel.off = SM.onChange(() => paintPanel());
    el.addEventListener('click', onPanelClick);
    paintPanel();
  }
  function onPanelClick(e){
    const t = e.target.closest('button, a');
    if (!t || !panel) return;
    const l = findLesson(panel.lessonId);
    if (!l) return;
    if (t.classList.contains('sc-x')) closePanel();
    else if (t.dataset.pick) { panel.sid = t.dataset.pick; paintPanel(); }
    else if (t.id === 'spEdit') openEditor(l);
    else if (t.id === 'spSession') toggleSession(l);
  }
  async function toggleSession(l){
    const SM = window.StudentMemory, s = st.byId[panel.sid];
    if (!SM || !s) return;
    const cur = SM.current();
    if (cur && cur.id === String(s.id) && cur.lessonId === l.id) { SM.end(); return; }
    const btn = panel.el.querySelector('#spSession');
    if (btn) btn.disabled = true;
    try { await SM.start({ id: s.id, name: s.name }, { lessonId: l.id }); }
    catch (er) { api.toast('Сессия не началась: ' + (er.message || er)); }
    paintPanel();
  }
  function paintPanel(){
    if (!panel) return;
    const l = findLesson(panel.lessonId);
    if (!l) { closePanel(); return; }
    const people = l.people.filter(p => p.student_id && st.byId[p.student_id]);
    const guests = l.people.filter(p => !p.student_id);
    if (!people.some(p => p.student_id === panel.sid)) panel.sid = people[0] ? people[0].student_id : null;
    const s = panel.sid ? st.byId[panel.sid] : null;
    const SM = window.StudentMemory, cur = SM && SM.current ? SM.current() : null;
    const mine = !!(s && cur && cur.id === String(s.id) && cur.lessonId === l.id);
    const keepScroll = panel.el.scrollTop;
    let h = '<div class="sc-ed-head"><b>' + esc(dayText(l.day)) + ', ' + esc(timeText(l)) + '</b><button type="button" class="sc-x" aria-label="Закрыть">×</button></div>' +
      '<div class="hint">' + esc(l.is_event ? 'событие' : fmtLabel(l.format)) + '</div>';
    if (l.is_event) h += '<div class="sc-sp-name">' + esc(l.title || 'Событие') + '</div>';
    if (people.length > 1) {
      h += '<div class="seg sc-sp-pick" role="group" aria-label="Ученик">' + people.map(p =>
        '<button type="button" data-pick="' + esc(p.student_id) + '" class="' + (p.student_id === panel.sid ? 'on' : '') + '">' + esc(personName(p)) + '</button>').join('') + '</div>';
    }
    if (s) {
      const meta = [s.grade ? s.grade + ' класс' : '', s.exam ? (EXAM_SHORT[s.exam] || s.exam) : ''].filter(Boolean).join(' · ');
      const board = l.board_id || ((s.boards || [])[0] || null);
      const boardWhere = l.board_id ? 'доска занятия' : 'доска ученика';
      h += '<div class="sc-sp-card"><div class="sc-sp-name">' + esc(s.name) + (s.archived_at ? ' <span class="badge">архив</span>' : '') + '</div>' +
        (meta ? '<div class="hint">' + esc(meta) + '</div>' : '') +
        (s.note ? '<div class="sc-sp-note">' + esc(String(s.note).slice(0, 300)) + (String(s.note).length > 300 ? '…' : '') + '</div>' : '') + '</div>' +
        '<div class="sc-sp-btns">' +
          '<a class="btn quiet" id="spCard" href="#/students/' + esc(s.id) + '">Открыть карточку</a>' +
          (board ? '<a class="btn quiet" id="spBoard" target="_blank" rel="noopener" href="boards.html#board=' + encodeURIComponent(board) + '" title="' + esc(boardWhere) + '">Открыть доску</a>'
                 : '<button type="button" class="btn quiet" id="spBoard" disabled title="Ни к занятию, ни к ученику доска не привязана">Открыть доску</button>') +
          '<button type="button" class="btn" id="spSession"' + (s.archived_at ? ' disabled title="Ученик в архиве"' : '') + '>' + (mine ? 'Закончить сессию' : 'Начать сессию') + '</button>' +
        '</div>' +
        '<div class="hint" id="spHint">' + (mine ? 'Идёт сессия с этим учеником' + (cur.paused ? ' (пауза)' : '') + ': задания запишутся на это занятие.'
          : cur ? 'Сейчас идёт сессия с учеником «' + esc(cur.name) + '» — она сменится.' : 'Задания сессии запишутся на это занятие.') +
          (board ? ' Доска: ' + esc(boardWhere) + '.' : '') + '</div>';
    } else if (!l.is_event) {
      h += '<div class="hint" style="margin:10px 0">Здесь нет ученика с карточкой — сессию и доску открыть не к кому.</div>';
    }
    if (guests.length) h += '<div class="hint">Гость без карточки: ' + esc(guests.map(personName).join(', ')) + '</div>';
    h += '<div class="sc-sp-foot"><button type="button" class="btn quiet small" id="spEdit">Править занятие</button></div>';
    panel.el.innerHTML = h;
    panel.el.scrollTop = keepScroll;
  }

  /* ── отрисовка ── */
  // пока в форме быстрого ввода висит вопрос о незнакомом имени, полная
  // перерисовка снесла бы его кнопки (их ждёт промис resolveNames). Поэтому
  // в это время render() только помечает «надо», а рисует обработчик формы
  // после ответа
  let quickBusy = null, pending = false;
  function render(loading){
    loading = loading || st.loading;
    if (quickBusy && !loading) { pending = true; return; }
    pending = false;
    if (!host || !st.week) return;
    // открытая форма быстрого ввода переживает перерисовку вместе с текстом
    const keep = {};
    host.querySelectorAll('.sc-quick').forEach(f => {
      if (!f.hidden) keep[f.dataset.day] = { v: f.querySelector('input').value, focus: document.activeElement === f.querySelector('input'), };
    });
    const gw = host.querySelector('.sc-gwrap');
    const scroll = gw ? [gw.scrollLeft, gw.scrollTop] : null;
    let body;
    if (loading) body = '<div class="empty">Загружаем…</div>';
    else if (st.err) body = '<div class="empty">' + esc(st.err) + ' <button type="button" class="btn quiet small" id="scRetry">Повторить</button></div>';
    else if (st.mode !== 'week') body = TPL().paneHtml();
    else body = st.view === 'grid' ? gridHtml() : listHtml();
    host.innerHTML = headHtml() + '<div class="sc-body sc-v-' + st.view + '" id="scBody">' + body + '</div>';
    host.querySelectorAll('.sc-views button').forEach(b => b.addEventListener('click', () => setView(b.dataset.v)));
    host.querySelectorAll('.sc-modes button').forEach(b => b.addEventListener('click', () => { st.mode = b.dataset.mode; closeModal(); closePanel(); render(); }));
    const retry = host.querySelector('#scRetry');
    if (retry) retry.addEventListener('click', load);
    if (loading || st.err) return;
    if (st.mode !== 'week') { TPL().bindPane(host); return; }
    TPL().bindWeekMenu(host);
    if (st.view === 'grid') {
      bindGrid();
      const ngw = host.querySelector('.sc-gwrap');
      if (scroll && ngw) { ngw.scrollLeft = scroll[0]; ngw.scrollTop = scroll[1]; }
    } else {
      bindList();
      Object.keys(keep).forEach(day => {
        const f = host.querySelector('.sc-quick[data-day="' + day + '"]');
        if (!f) return;
        f.hidden = false;
        f.querySelector('input').value = keep[day].v;
        if (keep[day].focus) f.querySelector('input').focus();
      });
    }
    paintEditor();
    paintPanel();
  }

  // шаблоны, пары и группы живут в schedule-tpl.js; общие приёмы он берёт отсюда
  const TPL = () => window.ScheduleTpl;
  function init(opts){
    api = opts;
    TPL().attach({ st, SC, api: () => api, esc, pad, hm, addDays, toDate, mondayOf, DAY_SHORT, DAY_LONG, FMT_HINT, fmtLabel, plural, rangeText, dayText,
      timeText, timeVal, readTime, parseQuick, norm, resolveNames, resolveEntry, activeStudents, personName, durFor, defaultFormat, groupOf,
      modalShell, closeModal, getModal: () => modal, render, reload: () => load() });
    host = opts.host;
    st.view = readView();
    if (api.settingsChanged) api.settingsChanged(() => { if (st.week) render(); });
  }
  function show(weekParam){
    const day = validDay(weekParam) ? weekParam : today();
    const mon = mondayOf(day);
    if (mon === st.week && st.lessons && !st.err && host.querySelector('.sc-body')) { render(); return Promise.resolve(); }
    st.week = mon;
    closeModal();
    closePanel();
    return load();
  }

  window.Schedule = { init, show, hide: closePanel, parseQuick, matchName, mondayOf, _st: st, reload: () => load(), setMode: m => { st.mode = m; render(); } };
})();
