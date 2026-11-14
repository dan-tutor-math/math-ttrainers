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
  // порядок нажатий — решение Даниила 14.11: проведено → перенос → отменено
  const ST_NEXT = { plan: 'done', done: 'move', move: 'skip', skip: 'plan' };
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
               mode: 'week', groups: [], tpls: [], tplId: null,    // mode: week | tpl | groups (В1б)
               // оплаты недели (В4а, payments.js): способ оплаты учеников,
               // ставки, «оплатил» по id участия; armed — «снять оплату?»
               pay: { modes: {}, rates: {}, linked: {} }, armed: null,
               // ручные итоги дней недели { день: { amount } } (В4б,
               // cabinet-stats.sql); dtOpen — у какого дня открыта правка
               totals: {}, dtOpen: null };
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
      const [pay, totals] = await Promise.all([payInfo(lessons), dayTotals()]);
      if (tok !== st.loadTok) return;
      st.pay = pay;
      st.totals = totals;
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
  // Сведения об оплате не должны ломать расписание: нет payments.js, файл
  // cabinet-payments.sql не выполнен или сеть отказала — просто без них
  async function payInfo(lessons){
    const P = window.Payments, empty = { modes: {}, rates: {}, linked: {} };
    if (!P || (SC.hasPayCols && !SC.hasPayCols())) return empty;
    const ids = [];
    lessons.forEach(l => l.people.forEach(p => { if (p.student_id) ids.push(p.student_id); }));
    try { return await P.weekInfo(ids); } catch (e) { return empty; }
  }
  async function dayTotals(){
    const P = window.Payments, out = {};
    if (!P || !P.listDayTotals) return out;
    try { (await P.listDayTotals(st.week, addDays(st.week, 6))).forEach(r => { out[r.day] = r; }); } catch (e) {}
    return out;
  }
  const paySet = () => (window.Payments ? window.Payments.paySettings(settings()) : { flags: [], skipRule: 'free', reason: '' });
  const billOf = (p, l) => (window.Payments ? window.Payments.billOf(p, l, paySet()) : { pay: false });
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
    paintPayCard();
  }

  /* ══ оплаты на занятии (В4а) ══
     Решения Даниила 13.11 (payments-audit.md, раздел 5): пропуск по
     умолчанию не оплачивается (как перенос), причина — по умолчанию из
     настроек; маленькая необязательная карточка пропуска открывается по
     подписи у имени, а не сама — отметку ставят быстро и подряд. Отмена по
     вине преподавателя не считается, рядом — «назначить отработку».
     «Оплатил» — у учеников, которые платят за каждое занятие */
  async function setPart(l, p, patch){
    const old = {};
    Object.keys(patch).forEach(k => { old[k] = p[k]; });
    Object.assign(p, patch);
    render(); paintPayCard();
    try { const fresh = await SC.setPart(p.id, patch); Object.assign(p, fresh); }
    catch (e) { Object.assign(p, old); api.toast('Не сохранилось: ' + e.message); }
    render(); paintPayCard();
  }
  const isAbsent = p => p.status === 'skip' || p.status === 'move' || !!p.by_teacher;
  function whyText(p, l){
    const b = billOf(p, l), ps = paySet();
    if (p.by_teacher) return 'по моей вине';
    const r = p.reason || ps.reason;
    return (r ? r + ' · ' : '') + (b.pay ? 'оплачивается' : 'без оплаты');
  }
  function flagsHtml(p){
    const ps = paySet();
    const names = (p.flags || []).map(id => ps.flags.find(f => f.id === id)).filter(Boolean).map(f => f.name);
    return (names.length ? '<span class="sc-flag" title="Флаги занятия">(' + esc(names.join(', ')) + ')</span>' : '') +
      (p.makeup ? '<span class="sc-mk" title="Отработка пропущенного занятия">отработка</span>' : '');
  }
  function paidBtn(p, l){
    if (!p.student_id || st.pay.modes[p.student_id] !== 'lesson' || !billOf(p, l).pay) return '';
    const on = !!st.pay.linked[p.id], armed = st.armed === p.id;
    return '<button type="button" class="sc-paid' + (on ? ' on' : '') + '" data-paid="' + esc(p.id) + '" title="' +
      (on ? 'Оплачено за это занятие. Нажмите дважды, чтобы снять' : 'Ученик платит за каждое занятие: отметить «оплатил»') + '">' +
      (armed ? 'снять?' : on ? '₽ ✓' : '₽ оплатил') + '</button>';
  }
  async function togglePaid(l, p){
    const P = window.Payments, cur = st.pay.linked[p.id];
    if (!P) return;
    if (cur) {
      // второе нажатие — подтверждение: оплату жалко снять случайно
      if (st.armed !== p.id) { st.armed = p.id; render(); return; }
      st.armed = null;
      delete st.pay.linked[p.id];
      render(); paintPanel();
      try { await P.deletePayment(cur.id); api.toast('Оплата снята'); }
      catch (e) { st.pay.linked[p.id] = cur; api.toast('Не сохранилось: ' + e.message); }
      render(); paintPanel();
      return;
    }
    const price = P.rateOn(st.pay.rates[p.student_id], l.day, l.format);
    if (price == null) { api.toast('Сначала задайте ставку ученика во вкладке «Оплаты»'); return; }
    st.pay.linked[p.id] = { id: null, amount: price };
    render(); paintPanel();
    try {
      st.pay.linked[p.id] = await P.addPayment({ student_id: p.student_id, kind: 'single', paid_on: today(), amount: price, lesson_student_id: p.id });
      api.toast('Оплачено: ' + P.money(price));
    } catch (e) { delete st.pay.linked[p.id]; api.toast('Не сохранилось: ' + e.message); }
    render(); paintPanel();
  }

  // карточка пропуска: одна на страницу, висит до ×, Esc или щелчка мимо
  let payCard = null;     // { el, lessonId, pid, onKey, onDown, custom }
  function closePayCard(){
    if (!payCard) return;
    payCard.el.remove();
    document.removeEventListener('keydown', payCard.onKey);
    document.removeEventListener('pointerdown', payCard.onDown, true);
    payCard = null;
  }
  function openPayCard(l, p){
    closePayCard();
    const el = document.createElement('div');
    el.className = 'pay-card';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Пропуск занятия');
    document.body.appendChild(el);
    const onKey = e => { if (e.key === 'Escape') closePayCard(); };
    const onDown = e => { if (!el.contains(e.target) && !e.target.closest('.sc-why, #spWhy')) closePayCard(); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown, true);
    payCard = { el, lessonId: l.id, pid: p.id, onKey, onDown, custom: false };
    el.addEventListener('click', onPayCardClick);
    el.addEventListener('change', e => {
      if (e.target.id !== 'pcCustom') return;
      const c = curCard();
      if (c) setPart(c.l, c.p, { reason: e.target.value.trim() === paySet().reason ? null : e.target.value.trim() });
    });
    paintPayCard();
  }
  function curCard(){
    if (!payCard) return null;
    const l = findLesson(payCard.lessonId), p = l && l.people.find(x => x.id === payCard.pid);
    return l && p ? { l, p } : null;
  }
  function paintPayCard(){
    if (!payCard) return;
    const c = curCard();
    if (!c || (!isAbsent(c.p) && c.p.status !== 'done')) { closePayCard(); return; }
    const { l, p } = c, ps = paySet(), b = billOf(p, l), P = window.Payments;
    const reasons = (P ? P.REASONS : []).slice();
    const cur = p.reason || ps.reason;
    if (cur && reasons.indexOf(cur) < 0) reasons.unshift(cur);
    const ruleSkip = ps.skipRule === 'charge' ? 'оплачивается' : 'не оплачивается';
    payCard.el.innerHTML =
      '<div class="sc-ed-head"><b>' + ST_SIGN[p.status] + ' ' + esc(ST_NAME[p.status]) + ' · ' + esc(personName(p)) + '</b><button type="button" class="sc-x" aria-label="Закрыть">×</button></div>' +
      '<div class="hint">' + esc(dayText(l.day) + ', ' + timeText(l)) + (p.status === 'skip' ? ' · по правилу прогул ' + ruleSkip : p.status === 'move' ? ' · перенос не оплачивается' : '') + '</div>' +
      '<div class="seg" id="pcBill"><button type="button" data-bill="free" class="' + (!b.pay ? 'on' : '') + '">Не оплачивается</button>' +
        '<button type="button" data-bill="charge" class="' + (b.pay ? 'on' : '') + '">Оплачивается</button></div>' +
      (isAbsent(p) ? '<div class="label" style="margin-top:8px">Причина</div><div class="pc-reasons" id="pcReasons">' +
        reasons.map(r => '<button type="button" data-reason="' + esc(r) + '" class="' + (r === cur && !p.by_teacher ? 'on' : '') + '">' + esc(r) + '</button>').join('') +
        '<button type="button" data-own="1">своя…</button></div>' +
        (payCard.custom ? '<input class="field" id="pcCustom" maxlength="200" placeholder="своя причина" style="margin-top:6px" value="' + esc(p.reason || '') + '">' : '') +
        '<div class="pc-row"><button type="button" class="btn quiet small" id="pcTeacher" aria-pressed="' + (p.by_teacher ? 'true' : 'false') + '">' + (p.by_teacher ? '✓ ' : '') + 'По моей вине</button>' +
          (p.by_teacher ? '<button type="button" class="btn small" id="pcMakeup" title="Создать занятие в другой день с пометкой «отработка». В статистике ученика отработки считаются отдельно">Назначить отработку</button>' : '') +
        '</div>' + (p.by_teacher ? '<div class="hint">Отмена по вине преподавателя не считается.</div>' : '') : '');
    if (payCard.custom) { const i = payCard.el.querySelector('#pcCustom'); if (i && document.activeElement !== i) i.focus(); }
  }
  function onPayCardClick(e){
    const t = e.target.closest('button');
    const c = curCard();
    if (!t || !c) return;
    const { l, p } = c, ps = paySet();
    if (t.classList.contains('sc-x')) { closePayCard(); return; }
    if (t.dataset.bill) {
      // по правилу — без исключения (null): сменят правило — занятие пойдёт за ним
      const want = t.dataset.bill === 'charge';
      const byRule = p.status === 'done' ? true : p.status === 'skip' ? ps.skipRule === 'charge' : false;
      setPart(l, p, { bill: want === byRule ? null : t.dataset.bill, by_teacher: want ? false : p.by_teacher });
    } else if (t.dataset.reason) {
      payCard.custom = false;
      setPart(l, p, { reason: t.dataset.reason === ps.reason ? null : t.dataset.reason, by_teacher: false });
    } else if (t.dataset.own) { payCard.custom = true; paintPayCard(); }
    else if (t.id === 'pcTeacher') setPart(l, p, { by_teacher: !p.by_teacher, bill: null });
    else if (t.id === 'pcMakeup') { closePayCard(); assignMakeup(l, p); }
  }
  // отработка — обычное занятие в другой день, помеченное «отработка» со
  // ссылкой на пропуск: так её можно посчитать в статистике ученика
  function assignMakeup(l, p){
    const day = addDays(l.day < today() ? today() : l.day, 1);
    openNew(day, null, { names: p.student_id ? personName(p) : '', makeup: { sid: p.student_id, forId: p.id } });
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

  // событие в быстром вводе: «15:00 ◆ врач», «◆ вебинар», «12-13 событие: созвон»
  // (знак ◆ или «!» или слово «событие»). Событие — не урок: без учеников,
  // не доход и не часы (is_event, title)
  function parseEvent(text){
    const m = String(text || '').trim().match(/^((?:\d{1,2}(?:[:.]\d{2})?(?:\s*[-–—]\s*\d{1,2}(?:[:.]\d{2})?)?)\s*,?\s*)?(?:◆|!|событие(?=[\s:]|$)\s*:?)\s*(.*)$/i);
    if (!m) return null;
    const q = parseQuick(m[1] || '');
    return { start: q.start, end: q.end, title: m[2].trim().replace(/\s+/g, ' ').slice(0, 200) };
  }
  // текст строки → { start, dur, people, format, group_id[, is_event, title] } | { msg } | { cancelled }
  async function resolveEntry(text, box, hint){
    const ev = parseEvent(text);
    if (ev) {
      if (!ev.title) return { msg: 'Напишите, что за событие: «15:00 ◆ врач»' };
      const start = ev.start != null ? ev.start : (hint && hint.start != null ? hint.start : null);
      let dur = ev.end != null && ev.start != null ? ev.end - ev.start : (hint && hint.dur) || durFor([]);
      if (start != null) dur = Math.min(dur, 1440 - start);
      return { start, dur: Math.max(5, dur), people: [], format: 'single', group_id: null, is_event: true, title: ev.title };
    }
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
  async function createFromText(day, text, box, hint, makeup){
    const r = await resolveEntry(text, box, hint);
    if (!r.people) return r;
    try {
      // отработка (В4а): у её ученика сразу пометка и ссылка на пропуск
      const people = makeup ? r.people.map(p => (p.student_id && p.student_id === makeup.sid ? Object.assign({}, p, { makeup: true, makeup_for: makeup.forId }) : p)) : r.people;
      const l = await SC.addLesson({ day, start_min: r.start, dur_min: r.dur, format: r.format, group_id: r.group_id, is_event: !!r.is_event, title: r.title || '' }, people);
      if (l.day >= st.week && l.day <= addDays(st.week, 6)) st.lessons.push(l);
      render();
      return { lesson: l };
    } catch (e) { return { msg: e.message }; }
  }

  /* ── доход дня (В4б) ──
     Считается из отметок: сумма ставок оплачиваемых участий (проведено,
     оплачиваемый пропуск). «Запланировано» — не доход, а «ожидается»
     отдельно: в старом приложении plan шёл в доход дня, и число дня
     менялось задним числом от прогула. Ручной итог дня, если вписан, —
     вместо расчёта (решение Даниила 13.11: иногда нужен) */
  function dayMoney(day){
    const P = window.Payments;
    if (!P) return null;
    let inc = 0, exp = 0, noRate = 0;
    lessonsOf(day).forEach(l => {
      if (l.is_event) return;
      l.people.forEach(p => {
        if (!p.student_id) return;
        const b = billOf(p, l), pr = P.rateOn(st.pay.rates[p.student_id], day, l.format);
        if (b.pay) { if (pr == null) noRate++; else inc += pr; }
        else if (b.plan && pr != null) exp += pr;
      });
    });
    const man = st.totals[day];
    return { inc, exp, noRate, man: man ? Number(man.amount) : null, total: man ? Number(man.amount) : inc };
  }
  function dayMoneyHtml(day, has){
    const m = dayMoney(day);
    if (!m || (!has && m.man == null)) return '';
    const P = window.Payments;
    const title = m.man != null ? 'Итог дня вписан вручную; по отметкам — ' + P.money(m.inc) + '. Нажмите, чтобы изменить'
      : 'Доход дня по отметкам' + (m.exp ? '; ещё ожидается ' + P.money(m.exp) + ' по запланированным' : '') + (m.noRate ? '; без ставки: ' + m.noRate : '') + '. Нажмите, чтобы вписать свой итог';
    let h = '<button type="button" class="sc-dsum' + (m.man != null ? ' man' : '') + '" data-dsum="' + day + '" title="' + esc(title) + '">' +
      esc(P.money(m.total)) + (m.man != null ? ' ✎' : '') + (m.man == null && m.exp ? ' <small>+' + esc(P.money(m.exp)) + '</small>' : '') + '</button>';
    if (st.dtOpen === day) {
      h += '<form class="sc-dtf" data-dtf="' + day + '"><input class="field" type="number" min="0" step="50" name="amount" value="' + (m.man != null ? m.man : m.inc) + '" aria-label="Итог дня, ₽">' +
        '<button class="btn small" type="submit">Сохранить</button>' +
        (m.man != null ? '<button type="button" class="btn quiet small" data-dtauto>По отметкам</button>' : '') +
        '<button type="button" class="btn quiet small" data-dtcancel>Отмена</button>' +
        '<div class="hint">Свой итог дня — вместо расчёта по отметкам (' + esc(P.money(m.inc)) + ').</div></form>';
    }
    return h;
  }
  function weekMoneyHtml(){
    const P = window.Payments;
    if (!P) return '';
    let sum = 0, any = false;
    for (let i = 0; i < 7; i++) { const day = addDays(st.week, i), m = dayMoney(day); if (m && (m.total || lessonsOf(day).length)) { sum += m.total; any = true; } }
    return any ? '<span class="sc-wsum" id="scWeekSum" title="Доход недели по отметкам и ручным итогам дней">' + esc(P.money(sum)) + ' за неделю</span>' : '';
  }
  async function saveDayTotal(day, amount){
    try {
      const r = await window.Payments.setDayTotal(day, amount);
      if (r) st.totals[day] = r; else delete st.totals[day];
      st.dtOpen = null;
    } catch (e) {
      api.toast(window.Payments.missing(e) ? 'Ручной итог дня ещё не включён: выполните файл cabinet-stats.sql в Supabase' : 'Не сохранилось: ' + e.message);
    }
    render();
  }
  function bindDayMoney(){
    host.querySelectorAll('[data-dsum]').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      st.dtOpen = st.dtOpen === b.dataset.dsum ? null : b.dataset.dsum;
      render();
      const f = host.querySelector('.sc-dtf input');
      if (f) { f.focus(); f.select(); }
    }));
    host.querySelectorAll('.sc-dtf').forEach(f => {
      f.addEventListener('pointerdown', e => e.stopPropagation());
      f.addEventListener('click', e => {
        e.stopPropagation();
        if (e.target.closest('[data-dtcancel]')) { st.dtOpen = null; render(); }
        else if (e.target.closest('[data-dtauto]')) saveDayTotal(f.dataset.dtf, null);
      });
      f.addEventListener('submit', e => {
        e.preventDefault();
        const v = f.querySelector('[name=amount]').value;
        if (v === '' || !(Number(v) >= 0)) return;
        saveDayTotal(f.dataset.dtf, v);
      });
    });
  }

  /* ── шапка ── */
  function modesHtml(){
    return '<div class="seg sc-modes" role="group" aria-label="Раздел расписания">' +
      [['week', 'Занятия'], ['tpl', 'Шаблоны недели'], ['groups', 'Пары и группы']].map(m =>
        '<button type="button" data-mode="' + m[0] + '" class="' + (st.mode === m[0] ? 'on' : '') + '">' + m[1] + '</button>').join('') + '</div>';
  }
  function headHtml(){
    if (st.mode !== 'week') return modesHtml();
    return modesHtml() + '<div class="sc-head">' +
        '<div class="sc-nav">' +
          '<a class="btn quiet small sc-arrow" id="scPrev" href="' + esc(api.weekHref(addDays(st.week, -7))) + '" aria-label="Предыдущая неделя">‹</a>' +
          '<span class="sc-range" id="scRange">' + esc(rangeText(st.week)) + '</span>' +
          (st.loading || st.err ? '' : weekMoneyHtml()) +
          '<a class="btn quiet small sc-arrow" id="scNext" href="' + esc(api.weekHref(addDays(st.week, 7))) + '" aria-label="Следующая неделя">›</a>' +
          '<a class="btn quiet small" id="scToday" href="' + esc(api.weekHref(null)) + '"' + (mondayOf(today()) === st.week ? ' aria-current="true"' : '') + '>Сегодня</a>' +
        '</div>' +
        TPL().weekMenuHtml() + weekClearHtml('week:') +
        '<div class="seg sc-views" role="group" aria-label="Вид расписания">' +
          '<button type="button" data-v="list" class="' + (st.view === 'list' ? 'on' : '') + '">Строки</button>' +
          '<button type="button" data-v="grid" class="' + (st.view === 'grid' ? 'on' : '') + '">Неделя</button>' +
        '</div>' +
        '<button type="button" class="btn quiet small sc-lookbtn" id="scLook" aria-haspopup="menu" title="Как показывать время, пары и группы">Вид <span aria-hidden="true">▾</span></button>' +
      '</div>';
  }

  /* ── вид «Строки»: дни карточками, строки — общий компонент schedule-rows.js ──
     Действия строк — здесь: компонент про базу ничего не знает */
  const R = window.ScheduleRows;
  const DAY_TITLE = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  const dm = s => { const d = toDate(s); return pad(d.getDate()) + '.' + pad(d.getMonth() + 1); };
  const weekDays = () => { const a = []; for (let i = 0; i < 7; i++) a.push(addDays(st.week, i)); return a; };

  // статус всей строки (пара, группа) одним нажатием: всем — следующий
  // после общего; личные статусы при этом сбрасываются (как в старом)
  async function setAllStatus(l, status){
    const old = l.people.map(p => p.status);
    l.people.forEach(p => { p.status = status; });
    render();
    try { for (const p of l.people) await SC.setStatus(p.id, status); }
    catch (e) { l.people.forEach((p, i) => { p.status = old[i]; }); api.toast('Не сохранилось: ' + e.message); render(); }
    paintPayCard();
  }
  function rowStatus(l, p){
    if (p) return cycleStatus(l, p);
    if (l.people.length === 1) return cycleStatus(l, l.people[0]);
    return setAllStatus(l, R.NEXT[R.aggStatus(l.people)] || 'done');
  }
  // формат следует за числом учеников, пока его не выбрали вручную
  function fmtAfter(l, oldN){
    const n = l.people.length;
    return l.format === defaultFormat(oldN) && defaultFormat(n) !== l.format && n ? defaultFormat(n) : null;
  }
  // имена правят в строке: «Маша, Петя» → кого убрать, кого добавить
  async function saveNames(l, text, box){
    const names = parseQuick(text).names;
    const oldN = l.people.length;
    const keep = [], gone = l.people.slice();
    const fresh = [];
    names.forEach(n => {
      const i = gone.findIndex(p => norm(personName(p)) === norm(n));
      if (i >= 0) keep.push(gone.splice(i, 1)[0]);
      else {
        const g = groupByName(n);
        if (g) g.members.forEach(id => { if (!keep.some(p => p.student_id === id)) { const j = gone.findIndex(p => p.student_id === id); if (j >= 0) keep.push(gone.splice(j, 1)[0]); else fresh.push({ sid: id }); } });
        else fresh.push({ name: n });
      }
    });
    let add = fresh.filter(f => f.sid).map(f => ({ student_id: f.sid }));
    const ask = fresh.filter(f => f.name).map(f => f.name);
    if (ask.length) {
      const got = await resolveNames(ask, box);
      if (!got) return;
      add = add.concat(got);
    }
    add = add.filter((p, i) => !p.student_id || (!keep.some(x => x.student_id === p.student_id) && add.findIndex(x => x.student_id === p.student_id) === i));
    try {
      for (const p of gone) await SC.removePerson(p.id);
      l.people = keep;
      if (add.length) {
        const rows = await SC.addPeople(l.id, add, l.people.reduce((mx, p) => Math.max(mx, p.pos + 1), 0));
        l.people = l.people.concat(rows);
      }
      l.people.sort((a, b) => a.pos - b.pos);
      const f = fmtAfter(l, oldN);
      if (f) Object.assign(l, await SC.updateLesson(l.id, { format: f }));
    } catch (e) { api.toast('Не сохранилось: ' + e.message); load(); return; }
    render();
  }
  async function freeLesson(l){
    const old = l.people.slice();
    l.people = [];
    render();
    try { for (const p of old) await SC.removePerson(p.id); }
    catch (e) { api.toast('Не сохранилось: ' + e.message); load(); }
  }
  async function removeLesson(l){
    st.lessons = st.lessons.filter(x => x !== l);
    closePanel(); render();
    try { await SC.deleteLesson(l.id); api.toast('Занятие удалено'); }
    catch (e) { st.lessons.push(l); api.toast('Не сохранилось: ' + e.message); render(); }
  }
  /* перетаскивание (schedule-rows.js): на строку — ученики переезжают и
     сливаются (тот же ученик второй раз не встаёт); на свободный час или
     другой день — строка едет туда целиком, а одно имя из пары — отдельным
     занятием. Строка участия переезжает целиком (movePerson) — статус,
     оплата и флаги не теряются. Опустевшее занятие удаляем */
  async function moveDrop(d){
    const l = d.item, p = d.person, to = d.to;
    if (to.kind === 'row') {
      const t = to.item;
      const moving = p ? [p] : l.people.slice();
      if (!moving.length || t.is_event) return;
      const oldL = l.people.length, oldT = t.people.length, ops = [];
      let pos = t.people.reduce((mx, x) => Math.max(mx, x.pos + 1), 0);
      moving.forEach(x => {
        l.people = l.people.filter(y => y !== x);
        if (x.student_id && t.people.some(y => y.student_id === x.student_id)) ops.push(() => SC.removePerson(x.id));
        else { x.pos = pos++; t.people.push(x); ops.push(() => SC.movePerson(x.id, t.id, x.pos)); }
      });
      const emptied = !l.people.length && !l.is_event;
      if (emptied) st.lessons = st.lessons.filter(y => y !== l);
      const fT = fmtAfter(t, oldT), fL = emptied ? null : fmtAfter(l, oldL);
      if (fT) t.format = fT;
      if (fL) l.format = fL;
      render();
      try {
        for (const op of ops) await op();
        if (fT) await SC.updateLesson(t.id, { format: fT });
        if (fL) await SC.updateLesson(l.id, { format: fL });
        if (emptied) await SC.deleteLesson(l.id);
      } catch (e) { api.toast('Не сохранилось: ' + e.message); load(); }
      return;
    }
    const start = to.kind === 'slot' ? to.start : l.start_min;
    if (!p) {
      const patch = {};
      if (to.day !== l.day) patch.day = to.day;
      if (start !== l.start_min) { patch.start_min = start; if (start != null) patch.dur_min = Math.min(l.dur_min, 1440 - start); }
      if (Object.keys(patch).length) patchLesson(l, patch);
      return;
    }
    // одно имя из пары — своим занятием в новом месте
    const oldL = l.people.length;
    l.people = l.people.filter(y => y !== p);
    const fL = fmtAfter(l, oldL);
    if (fL) l.format = fL;
    render();
    try {
      const nl = await SC.addLesson({ day: to.day, start_min: start, dur_min: start == null ? l.dur_min : Math.min(l.dur_min, 1440 - start), format: 'single' }, []);
      const moved = await SC.movePerson(p.id, nl.id, 0);
      nl.people = [Object.assign(p, moved)];
      if (nl.day >= st.week && nl.day <= addDays(st.week, 6)) st.lessons.push(nl);
      if (fL) await SC.updateLesson(l.id, { format: fL });
    } catch (e) { api.toast('Не сохранилось: ' + e.message); load(); return; }
    render();
  }
  let rowsBusy = false;
  const rows = R.create({
    statuses: true,
    itemsOf: day => lessonsOf(day),
    days: weekDays,
    name: personName,
    personExtra: (l, p) => flagsHtml(p) + (isAbsent(p) && window.Payments ? '<button type="button" class="sc-why" data-why="' + esc(p.id) + '" title="Пропуск: оплачивается ли и причина — нажмите, чтобы сменить">' + esc(whyText(p, l)) + '</button>' : '') + paidBtn(p, l),
    showEnd: () => look.end,
    hoursOpen: day => !!st.expand['week:' + day],
    busy: v => { rowsBusy = v; if (!v && pending) render(); },
    rerender: () => render(),
    toast: m => api.toast(m),
    labels: { open: 'Открыть занятие' },
    act: {
      status: (l, p) => rowStatus(l, p),
      time: (l, m) => patchLesson(l, { start_min: m, dur_min: Math.min(l.dur_min, 1440 - m) }),
      names: (l, text, box) => saveNames(l, text, box),
      create: async (day, start, text, box) => {
        const r = await createFromText(day, (start != null ? hm(start) + ' ' : '') + text, box || document.createElement('div'));
        return r.lesson ? { item: r.lesson } : r;
      },
      open: l => openPanel(l),
      person: (l, p, el) => openStudentCard(l, p, el),
      free: l => freeLesson(l),
      remove: l => removeLesson(l),
      move: d => moveDrop(d),
    },
  });
  function listHtml(){
    let h = '<div class="sc-days">';
    weekDays().forEach((day, i) => {
      const ls = lessonsOf(day);
      h += '<section class="sc-day' + (day === today() ? ' today' : '') + '" data-day="' + day + '" data-rw-day="' + day + '">' +
        '<header class="sc-dh"><b>' + DAY_TITLE[i] + '</b><span>' + dm(day) + (day === today() ? ' · сегодня' : '') + '</span>' + dayActions('week:' + day) + '</header>' +
        rows.listHtml(day) +
        '<footer class="sc-dfoot"><span>за день</span>' + (dayMoneyHtml(day, ls.length) || '<span class="sc-dzero">—</span>') + '</footer>' +
      '</section>';
    });
    return h + '</div>';
  }
  function bindList(){
    rows.bind(host.querySelector('.sc-days'));
    bindCommon();
  }
  function bindCommon(){
    bindDayMoney();
    host.querySelectorAll('.sc-st[data-pid]').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      const l = findLesson(b.closest('[data-id]').dataset.id);
      const p = l && l.people.find(x => x.id === b.dataset.pid);
      if (p) cycleStatus(l, p);
    }));
    host.querySelectorAll('.sc-why[data-why], .sc-paid[data-paid]').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      const l = findLesson(b.closest('[data-id]').dataset.id);
      const p = l && l.people.find(x => x.id === (b.dataset.why || b.dataset.paid));
      if (!p) return;
      if (b.dataset.why) openPayCard(l, p); else togglePaid(l, p);
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

  /* ── вид «Неделя»: сетка часов (редизайн 14.11, макеты — cabinet-redesign.md) ──
     Цвет плашки — статус занятия (как в «Учительской»), формат цветом не
     показываем: полупараллелку видно по наложению, пару и группу — по
     именам. Занятия внахлёст — стопкой одной ширины, вправо сдвинуто
     только начатое в :30. В первой строке плашки — только статус, время и
     стрелка; имена никогда не встают на строку времени. Высоту часа и
     ширину дня тянут за линию часа и край дня, как в таблицах */
  const SH = 16;                           // сдвиг получасовой плашки при наложении, px
  // высота часа: своя (учитель потянул линию) или подобранная так, чтобы
  // плашки внахлёст не прятали имена друг друга и в каждой было видно имя
  function autoHH(){
    let need = 72;
    const ls = st.lessons.filter(l => l.start_min != null);
    weekDays().forEach(day => {
      const d = ls.filter(l => l.day === day).sort((x, y) => x.start_min - y.start_min);
      d.forEach((l, i) => {
        need = Math.max(need, 58 * 60 / Math.max(15, l.dur_min));           // шапка и строка имени
        for (let j = i + 1; j < d.length && d[j].start_min < l.start_min + l.dur_min; j++) {
          const gap = d[j].start_min - l.start_min;
          if (gap > 0) need = Math.max(need, 50 * 60 / gap);                  // верхняя плашка не закрывает имя нижней
        }
      });
    });
    return Math.min(200, Math.ceil(need / 4) * 4);
  }
  const HH = () => look.hh || autoHH();
  const pxm = () => HH() / 60;             // пикселей на минуту
  function hoursRange(){
    let a = 8 * 60, b = 21 * 60;
    st.lessons.forEach(l => {
      if (l.start_min == null) return;
      a = Math.min(a, Math.floor(l.start_min / 60) * 60);
      b = Math.max(b, Math.ceil((l.start_min + l.dur_min) / 60) * 60);
    });
    return [Math.max(0, a), Math.min(1440, b)];
  }
  const initials = n => String(n || '?').split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  function gTime(l){ return hm(l.start_min) + (look.end ? '–' + hm(Math.min(1440, l.start_min + l.dur_min)) : ''); }
  function nameSpan(l, p){
    const gone = p.status === 'skip' || p.status === 'move';
    return '<span class="sc-n' + (gone ? ' x' : '') + '" data-p="' + esc(l.id) + '|' + esc(p.id) + '">' + esc(personName(p)) + '</span>';
  }
  const ic = (s, attr) => attr ? '<button type="button" class="rw-ic st-' + s + '" ' + attr + ' aria-label="Статус: ' + esc(R.ST_NAME[s]) + '">' + R.icon(s) + '</button>'
    : '<span class="rw-ic sm st-' + s + '">' + R.icon(s) + '</span>';
  // тело плашки: у одного ученика — имя; у пары и группы — вид из меню «Вид»
  function plateBody(l, hgt, open){
    if (l.is_event) return '<div class="sc-pl1"><span class="sc-ev">' + esc(l.title || 'событие') + '</span></div>';
    const ps = l.people;
    if (!ps.length) return '<div class="sc-pl1 hint">свободно</div>';
    if (open) return '<div class="sc-plist">' + ps.map(p => '<div class="sc-prow">' + ic(p.status, 'data-pst="' + esc(p.id) + '"') + nameSpan(l, p) + '</div>').join('') + '</div>';
    if (ps.length === 1) return '<div class="sc-pl1">' + nameSpan(l, ps[0]) + '</div>';
    if (look.grp === 'ini') return '<div class="sc-pini">' + ps.map(p => '<span class="st-' + p.status + '" data-p="' + esc(l.id) + '|' + esc(p.id) + '" title="' + esc(personName(p)) + '">' + esc(initials(personName(p))) + '</span>').join('') + '</div>';
    if (look.grp === 'cnt') return '<div class="sc-picons">' + ps.map(p => '<span title="' + esc(personName(p)) + '">' + ic(p.status) + '</span>').join('') + '</div>';
    if (look.grp === 'col') return ps.map(p => '<div class="sc-prow">' + ic(p.status) + nameSpan(l, p) + '</div>').join('');
    const lines = Math.max(1, Math.floor((hgt - 34) / 20));
    return '<div class="sc-pwrap" style="max-height:' + lines * 20 + 'px">' + ps.map(p => '<span class="sc-pi">' + ic(p.status) + nameSpan(l, p) + '</span>').join('') + '</div>';
  }
  function plateHtml(l, geo, a, H){
    const top = (l.start_min - a) * pxm() + 2;
    let hgt = Math.max(STEP, l.dur_min) * pxm() - 4;
    const multi = l.people.length > 1, open = st.openPlate === l.id && multi;
    if (!open && multi && look.grp === 'col') hgt = Math.max(hgt, 32 + l.people.length * 22);
    const agg = l.is_event || !l.people.length ? 'plan' : R.aggStatus(l.people);
    const came = l.people.filter(p => p.status === 'done').length;
    let pos;
    if (open) {
      const need = 38 + l.people.length * 24;
      pos = (top + need > H ? 'bottom:' + Math.max(2, H - top - hgt) + 'px' : 'top:' + top + 'px') + ';min-height:' + hgt + 'px;left:4px;right:4px';
    } else pos = 'top:' + top + 'px;height:' + hgt + 'px;' + (geo.lone ? 'left:4px;right:4px' : 'left:' + (4 + (geo.half ? SH : 0)) + 'px;width:calc(100% - ' + (8 + SH) + 'px)');
    return '<div class="sc-plate st-' + agg + (open ? ' open' : '') + (l.is_event ? ' ev' : '') + '" data-id="' + esc(l.id) + '" style="' + pos + ';z-index:' + (open ? 30 : 1 + geo.z) + '" ' +
        'role="button" tabindex="0" aria-label="' + esc(timeText(l) + ', ' + (l.is_event ? l.title : l.people.map(personName).join(', '))) + '">' +
        '<div class="sc-ph">' + (l.is_event || !l.people.length ? '' : ic(agg, 'data-rst title="' + esc(multi ? 'Статус всем' : 'Статус') + ' — нажмите, чтобы сменить"')) +
          '<span class="sc-pt">' + esc(gTime(l)) + '</span>' +
          (multi && look.grp === 'cnt' && !open ? '<span class="sc-pc">' + came + ' из ' + l.people.length + '</span>' : '') +
          (multi ? '<button type="button" class="sc-pexp" data-exp aria-label="' + (open ? 'Свернуть' : 'Показать всех') + '" aria-expanded="' + open + '">' + (open ? '⌃' : '⌄') + '</button>' : '') +
        '</div>' + plateBody(l, hgt, open) +
        (open ? '' : '<div class="sc-rz" title="Потяните, чтобы изменить длительность" aria-hidden="true"></div>') +
      '</div>';
  }
  // раскладка дня: одиночное — во всю ширину; в наложении — одна ширина,
  // начатое в половину часа сдвинуто вправо; позже начатое — сверху
  function layoutDay(ls){
    const out = new Map();
    R.clusters(ls.filter(l => l.start_min != null)).forEach(cl => cl.forEach((l, i) => out.set(l, { lone: cl.length === 1, half: l.start_min % 60 !== 0, z: i })));
    return out;
  }
  function colTemplate(){ return '52px repeat(7,' + (look.cw ? look.cw + 'px' : 'minmax(116px,1fr)') + ')'; }
  function gridHtml(){
    const [a, b] = hoursRange();
    const H = (b - a) * pxm();
    let head = '<div class="sc-gcorner"></div>', cols = '';
    weekDays().forEach((day, i) => {
      const ls = lessonsOf(day);
      const untimed = ls.filter(l => l.start_min == null);
      head += '<div class="sc-gday' + (day === today() ? ' today' : '') + '"><b>' + DAY_SHORT[i] + '</b> <span>' + dm(day) + '</span>' +
        '<div class="sc-gmoney">' + dayMoneyHtml(day, ls.length) + '</div>' +
        dayActions('week:' + day, true) +
        (untimed.length ? '<div class="sc-untimed">' + untimed.map(l => '<button type="button" class="sc-ut" data-open="' + esc(l.id) + '">' + esc(l.people.map(personName).join(' ') || l.title || 'без времени') + '</button>').join('') + '</div>' : '') +
        '</div>';
      const pos = layoutDay(ls);
      cols += '<div class="sc-col' + (day === today() ? ' today' : '') + '" data-day="' + day + '" data-ci="' + i + '" style="height:' + H + 'px;background-size:100% ' + HH() + 'px">' +
        '<div class="sc-hv" aria-hidden="true"></div><div class="sc-gl" aria-hidden="true"></div><div class="sc-gv" aria-hidden="true"></div>' +
        ls.filter(l => l.start_min != null).map(l => plateHtml(l, pos.get(l), a, H)).join('') + '</div>';
    });
    let hours = '';
    for (let m = a; m < b; m += 60) hours += '<div class="sc-hr" style="top:' + (m - a) * pxm() + 'px">' + hm(m) + '</div>';
    return '<div class="sc-gwrap"><div class="sc-grid" data-a="' + a + '" data-b="' + b + '" style="--cols:' + colTemplate() + '">' +
      '<div class="sc-ghead">' + head + '</div>' +
      '<div class="sc-gbody"><div class="sc-hours" style="height:' + H + 'px">' + hours + '</div>' + cols + '</div>' +
      '</div></div><div class="hint sc-ghint">Щёлкните по свободному месту — новое занятие. Плашку можно перетащить и растянуть за нижний край; высоту часа и ширину дня — потянуть за линию часа и край дня.</div>';
  }
  const NEAR = 4;
  // что под курсором в колонке: линия часа, правый край или ничего
  function edgeAt(col, e){
    const r = col.getBoundingClientRect(), y = e.clientY - r.top, x = e.clientX - r.left;
    if (r.width - x <= NEAR + 2 && y > 14 && y < r.height - 14) return { t: 'c', ci: Number(col.dataset.ci) };
    const k = Math.round(y / HH());
    if (k >= 1 && Math.abs(y - k * HH()) <= NEAR) return { t: 'r', k };
    return null;
  }
  function showEdge(hit){
    host.querySelectorAll('.sc-gl, .sc-gv').forEach(x => { x.style.display = 'none'; });
    const g = host.querySelector('.sc-grid');
    if (!g) return;
    g.classList.toggle('rs', !!hit && hit.t === 'r');
    g.classList.toggle('cs', !!hit && hit.t === 'c');
    if (!hit) return;
    if (hit.t === 'r') host.querySelectorAll('.sc-gl').forEach(x => { x.style.top = hit.k * HH() + 'px'; x.style.display = 'block'; });
    else { const c = host.querySelector('.sc-col[data-ci="' + hit.ci + '"] .sc-gv'); if (c) c.style.display = 'block'; }
  }
  // тянем линию часа или край дня: на каждом шаге — перерисовка сетки
  function startEdgeDrag(e, hit, col){
    e.preventDefault();
    // как в таблицах: час над линией растёт ровно на сдвиг мыши, а его верх
    // стоит на месте (прокрутку двигаем на рост часов выше) — линия идёт за курсором
    const y0 = e.clientY, x0 = e.clientX, hh0 = HH(), cw0 = look.cw || col.getBoundingClientRect().width;
    const gw0 = host.querySelector('.sc-gwrap'), st0 = gw0 ? gw0.scrollTop : 0, sl0 = gw0 ? gw0.scrollLeft : 0;
    const move = ev => {
      if (hit.t === 'r') look.hh = Math.round(Math.max(40, Math.min(240, hh0 + (ev.clientY - y0))));
      else look.cw = Math.round(Math.max(96, Math.min(480, cw0 + (ev.clientX - x0))));
      render();
      const gw = host.querySelector('.sc-gwrap');
      if (gw) {
        if (hit.t === 'r') gw.scrollTop = st0 + (hit.k - 1) * (look.hh - hh0);
        else gw.scrollLeft = sl0 + hit.ci * (look.cw - cw0);
      }
      showEdge(hit);
    };
    const up = () => {
      document.removeEventListener('pointermove', move, true);
      document.removeEventListener('pointerup', up, true);
      document.removeEventListener('pointercancel', up, true);
      saveLook();
      showEdge(null);
    };
    document.addEventListener('pointermove', move, true);
    document.addEventListener('pointerup', up, true);
    document.addEventListener('pointercancel', up, true);
  }
  function bindGrid(){
    const grid = host.querySelector('.sc-grid');
    const a = Number(grid.dataset.a), b = Number(grid.dataset.b);
    const cols = Array.from(host.querySelectorAll('.sc-col'));
    const snap = m => Math.round(m / STEP) * STEP;
    cols.forEach(col => {
      const hv = col.querySelector('.sc-hv');
      col.addEventListener('pointermove', e => {
        if (e.buttons) return;
        const hit = edgeAt(col, e);
        showEdge(hit);
        if (hit || e.target.closest('.sc-plate')) { hv.style.display = 'none'; return; }
        // свободное место: мягко подсветить получас под курсором
        const r = col.getBoundingClientRect();
        const k = Math.floor((e.clientY - r.top) / (HH() / 2));
        const m = a + k * 30;
        if (m < a || m >= b) { hv.style.display = 'none'; return; }
        hv.style.top = (k * HH() / 2 + 2) + 'px';
        hv.style.height = (HH() / 2 - 4) + 'px';
        hv.textContent = '+ ' + hm(m);
        hv.style.display = 'flex';
      });
      col.addEventListener('pointerleave', () => { hv.style.display = 'none'; if (!document.querySelector('.sc-grid.rs:active, .sc-grid.cs:active')) showEdge(null); });
      col.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        const hit = edgeAt(col, e);
        if (hit && !e.target.closest('button, .sc-n, [data-p]')) { startEdgeDrag(e, hit, col); return; }
        const plate = e.target.closest('.sc-plate');
        const r0 = col.getBoundingClientRect();
        if (!plate) {
          // пустое место: новое занятие с начала получаса под курсором
          const y0 = e.clientY;
          const off = () => { col.removeEventListener('pointerup', up); col.removeEventListener('pointercancel', off); };
          const up = ev => {
            off();
            if (Math.abs(ev.clientY - y0) > 6) return;      // это была прокрутка
            const m = a + Math.floor((ev.clientY - r0.top) / (HH() / 2)) * 30;
            openNew(col.dataset.day, Math.max(a, Math.min(b - STEP, m)));
          };
          col.addEventListener('pointerup', up);
          col.addEventListener('pointercancel', off);
          return;
        }
        if (e.target.closest('button') || plate.classList.contains('open')) return;   // у кнопок — свои щелчки
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
        const P = pxm();
        const move = ev => {
          const dy = ev.clientY - y0, dx = ev.clientX - x0;
          if (!moved && Math.abs(dy) < 4 && Math.abs(dx) < 4) return;
          moved = true;
          plate.classList.add('drag');
          if (resize) {
            newDur = Math.max(STEP, Math.min(1440 - l.start_min, l.dur_min + snap(dy / P)));
            plate.style.height = newDur * P - 4 + 'px';
            label.textContent = hm(l.start_min) + '–' + hm(l.start_min + newDur);
          } else {
            dMin = Math.max(-l.start_min, Math.min(1440 - l.dur_min - l.start_min, snap(dy / P)));
            let k = rects.findIndex(r => ev.clientX >= r.left && ev.clientX < r.right);
            if (k < 0) k = ev.clientX < rects[0].left ? 0 : rects.length - 1;
            dCol = k - ci;
            plate.style.transform = 'translate(' + (rects[k].left - rects[ci].left) + 'px,' + dMin * P + 'px)';
            label.textContent = hm(l.start_min + dMin) + '–' + hm(l.start_min + dMin + l.dur_min);
          }
        };
        const up = () => {
          plate.removeEventListener('pointermove', move);
          plate.removeEventListener('pointerup', up);
          plate.removeEventListener('pointercancel', up);
          if (!moved) {
            // щелчок без сдвига: по имени — карточка ученика, иначе — панель занятия
            const n = e.target.closest('[data-p]'), p = n && l.people.find(x => x.id === n.dataset.p.split('|')[1]);
            if (p) openStudentCard(l, p, n); else openPanel(l);
            return;
          }
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
      col.addEventListener('click', e => {
        const plate = e.target.closest('.sc-plate');
        const l = plate && findLesson(plate.dataset.id);
        if (!l) return;
        const rst = e.target.closest('[data-rst]'), pst = e.target.closest('[data-pst]');
        if (rst || pst) { e.stopPropagation(); rowStatus(l, pst ? l.people.find(p => p.id === pst.dataset.pst) : null); return; }
        if (e.target.closest('[data-exp]')) { e.stopPropagation(); st.openPlate = st.openPlate === l.id ? null : l.id; render(); return; }
        // в раскрытом списке перетаскивания нет — имя открывает карточку здесь
        const n = plate.classList.contains('open') && e.target.closest('[data-p]');
        if (n) { e.stopPropagation(); const p = l.people.find(x => x.id === n.dataset.p.split('|')[1]); if (p) openStudentCard(l, p, n); }
      });
      col.addEventListener('keydown', e => {
        const plate = e.target.closest('.sc-plate');
        if (plate && e.target === plate && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); const l = findLesson(plate.dataset.id); if (l) openPanel(l); }
      });
    });
    bindCommon();
  }

  // неделя открывается с самого раннего занятого часа: пустое утро не листаем
  function gridToFirst(gw){
    const [a] = hoursRange();
    const starts = st.lessons.filter(l => l.start_min != null).map(l => l.start_min);
    gw.scrollTop = starts.length ? Math.max(0, (Math.floor(Math.min.apply(null, starts) / 60) * 60 - a) * pxm()) : 0;
  }
  // «Сегодня»: день ярче на миг и сразу в поле зрения (страница листается сама)
  function goToday(){
    const flash = el => { if (!el) return; el.classList.remove('sc-flash'); void el.offsetWidth; el.classList.add('sc-flash'); };
    if (st.view === 'grid') {
      const gw = host.querySelector('.sc-gwrap'), col = host.querySelector('.sc-col.today');
      if (gw && col) {
        gw.scrollTo({ left: Math.max(0, col.offsetLeft - 70), behavior: 'smooth' });
        const ls = lessonsOf(today()).filter(l => l.start_min != null);
        if (ls.length) { const [a] = hoursRange(); gw.scrollTo({ top: Math.max(0, (Math.floor(ls[0].start_min / 60) * 60 - a) * pxm()), behavior: 'smooth' }); }
        flash(col); flash(host.querySelector('.sc-gday.today'));
      }
      const r = (gw || host).getBoundingClientRect();
      if (r.top < 0 || r.top > window.innerHeight * 0.5) window.scrollTo({ top: window.scrollY + r.top - 80, behavior: 'smooth' });
      return;
    }
    const card = host.querySelector('.sc-day.today');
    if (!card) return;
    const r = card.getBoundingClientRect();
    window.scrollTo({ top: Math.max(0, window.scrollY + r.top - 90), behavior: 'smooth' });
    flash(card);
  }

  /* ── карточка ученика по щелчку на имя (как в «Учительской») ──
     Коротко и рядом с именем: время и статус, тариф, оплата; подробное —
     «Открыть занятие» (боковая панель) */
  let sCard = null;
  function closeStudentCard(){
    if (!sCard) return;
    sCard.el.remove();
    document.removeEventListener('pointerdown', sCard.onDown, true);
    document.removeEventListener('keydown', sCard.onKey);
    sCard = null;
  }
  function openStudentCard(l, p, anchor){
    closeStudentCard();
    const el = document.createElement('div');
    el.className = 'sc-scard';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Ученик на занятии');
    document.body.appendChild(el);
    const onDown = e => { if (!el.contains(e.target) && !e.target.closest('[data-p], .rw-p .nm') && !e.target.closest('.pay-card')) closeStudentCard(); };
    const onKey = e => { if (e.key === 'Escape') closeStudentCard(); };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey);
    sCard = { el, lid: l.id, pid: p.id, onDown, onKey, anchor };
    el.addEventListener('click', e => {
      const c = curSCard(), t = e.target.closest('button, a');
      if (!c || !t) return;
      if (t.dataset.x != null) closeStudentCard();
      else if (t.dataset.set) { const old = c.p.status; c.p.status = t.dataset.set; render(); SC.setStatus(c.p.id, c.p.status).catch(er => { c.p.status = old; api.toast('Не сохранилось: ' + er.message); render(); }); }
      else if (t.dataset.paidc != null) togglePaid(c.l, c.p);
      else if (t.dataset.whyc != null) openPayCard(c.l, c.p);
      else if (t.dataset.openl != null) { closeStudentCard(); openPanel(c.l, c.p.student_id); }
      else if (t.tagName === 'A') closeStudentCard();
    });
    paintStudentCard();
  }
  function curSCard(){
    if (!sCard) return null;
    const l = findLesson(sCard.lid), p = l && l.people.find(x => x.id === sCard.pid);
    return l && p ? { l, p } : null;
  }
  function paintStudentCard(){
    if (!sCard) return;
    const c = curSCard();
    if (!c) { closeStudentCard(); return; }
    const { l, p } = c, P = window.Payments;
    const gone = p.status === 'skip' || p.status === 'move';
    const price = P && p.student_id ? P.rateOn(st.pay.rates[p.student_id], l.day, l.format) : null;
    const paid = paidBtn(p, l);
    sCard.el.innerHTML =
      '<div class="sc-sc-top">' + ic(p.status) + '<span class="' + (gone ? 'x' : '') + '">' + esc(timeText(l).replace(' – ', '–')) + '</span><span>' + esc(R.ST_NAME[p.status]) + '</span>' +
        '<button type="button" class="sc-sc-x" data-x aria-label="Закрыть">×</button></div>' +
      '<div class="sc-sc-who"><div class="sc-av">' + esc(initials(personName(p))) + '</div><div><div class="sc-sc-name">' + esc(personName(p)) + '</div>' +
        '<div class="hint">' + (p.student_id ? (price != null ? 'По тарифу: ' + esc(P.money(price)) : 'Ставка не задана') : 'Гость без карточки') + '</div></div>' +
        (p.student_id ? '<a class="btn quiet small" href="#/payments/' + esc(p.student_id) + '">К оплатам</a>' : '') + '</div>' +
      '<div class="seg sc-sc-st" role="group" aria-label="Статус">' + ['plan', 'done', 'move', 'skip'].map(s =>
        '<button type="button" data-set="' + s + '" class="' + (p.status === s ? 'on' : '') + '">' + esc(({ plan: 'План', done: 'Проведено', move: 'Перенос', skip: 'Отменено' })[s]) + '</button>').join('') + '</div>' +
      (paid ? '<div class="sc-sc-pay">' + paid.replace('class="sc-paid', 'data-paidc class="sc-paid') + '</div>' : '') +
      (isAbsent(p) && P ? '<button type="button" class="btn quiet small sc-sc-why" data-whyc>' + esc(whyText(p, l)) + '</button>' : '') +
      '<div class="sc-sc-foot"><button type="button" class="btn quiet small" data-openl>Открыть занятие</button></div>';
    const r = sCard.anchor.isConnected ? sCard.anchor.getBoundingClientRect() : null;
    if (r) {
      const w = sCard.el.offsetWidth, h = sCard.el.offsetHeight;
      let x = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)), y = r.bottom + 6;
      if (y + h > window.innerHeight - 8) y = Math.max(8, r.top - h - 6);
      sCard.el.style.left = x + 'px'; sCard.el.style.top = y + 'px';
    }
  }

  /* ── меню «Вид»: время и вид пар/групп, с живым примером плашки ── */
  const LOOK_KEY = 'cabinet:schedule:look';
  // hh: null — высота часа подбирается сама (autoHH), число — своя, потянутая
  // учителем, и она запоминается на этом устройстве
  const look = { end: false, grp: 'names', hh: null, cw: null };
  try { Object.assign(look, JSON.parse(localStorage.getItem(LOOK_KEY) || '{}')); } catch (e) {}
  function saveLook(){ try { localStorage.setItem(LOOK_KEY, JSON.stringify(look)); } catch (e) {} }
  function lookPreview(end, grp){
    const ps = [['Маша', 'done'], ['Петя', 'done'], ['Аня', 'plan']];
    const body = grp === 'ini' ? '<div class="sc-pini">' + ps.map(p => '<span class="st-' + p[1] + '">' + p[0][0] + '</span>').join('') + '</div>'
      : grp === 'cnt' ? '<div class="sc-picons">' + ps.map(p => ic(p[1])).join('') + '</div>'
      : grp === 'col' ? ps.map(p => '<div class="sc-prow">' + ic(p[1]) + '<span class="sc-n">' + p[0] + '</span></div>').join('')
      : grp ? '<div class="sc-pwrap">' + ps.map(p => '<span class="sc-pi">' + ic(p[1]) + '<span class="sc-n">' + p[0] + '</span></span>').join('') + '</div>'
      : '<div class="sc-pl1"><span class="sc-n">Маша</span></div>';
    return '<span class="sc-lookpv"><span class="sc-plate demo st-plan"><span class="sc-ph">' + ic(grp ? 'plan' : 'done') + '<span class="sc-pt">' + (end ? '15:00–16:00' : '15:00') + '</span>' +
      (grp === 'cnt' ? '<span class="sc-pc">2 из 3</span>' : '') + '</span>' + body + '</span></span>';
  }
  function lookItems(){
    const it = (label, on, pv, fn) => ({ html: '<span class="gm-l">' + esc(label) + '</span>' + pv, on, keep: true, act: () => { fn(); saveLook(); render(); return { items: lookItems() }; } });
    return [
      { head: 'Время занятия' },
      it('Только начало', !look.end, lookPreview(false, null), () => { look.end = false; }),
      it('Начало и конец', look.end, lookPreview(true, null), () => { look.end = true; }),
      { head: 'Пары и группы в «Неделе»' },
      it('Имена', look.grp === 'names', lookPreview(false, 'names'), () => { look.grp = 'names'; }),
      it('Инициалы', look.grp === 'ini', lookPreview(false, 'ini'), () => { look.grp = 'ini'; }),
      it('Число', look.grp === 'cnt', lookPreview(false, 'cnt'), () => { look.grp = 'cnt'; }),
      it('Столбиком', look.grp === 'col', lookPreview(false, 'col'), () => { look.grp = 'col'; }),
      { sep: true },
      { label: 'Масштаб по умолчанию', hint: 'все плашки без наезда имён', act: () => { look.hh = null; look.cw = null; saveLook(); render(); } },
    ];
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
  function openNew(day, start, opts){
    opts = opts || {};
    const m = modalShell(opts.makeup ? 'Отработка' : 'Новое занятие');
    const dur = durFor([]);
    m.sheet.innerHTML =
      '<div class="sc-ed-head"><b>' + (opts.makeup ? 'Отработка' : 'Новое занятие') + '</b><button type="button" class="sc-x" aria-label="Закрыть">×</button></div>' +
      (opts.makeup ? '<div class="hint">Обычное занятие с пометкой «отработка» — выберите день и время.</div>'
        : '<div class="seg sc-edkind" id="edKind" role="group" aria-label="Что добавить"><button type="button" data-k="lesson">Занятие</button><button type="button" data-k="event">◆ Событие</button></div>') +
      '<div class="sc-ed-grid">' +
        '<label><span class="label">День</span><input class="field" type="date" id="edDay" value="' + day + '"></label>' +
        '<label><span class="label">С</span><input class="field" type="time" step="900" id="edStart" value="' + timeVal(start) + '"></label>' +
        '<label><span class="label">До</span><input class="field" type="time" step="900" id="edEnd" value="' + (start == null ? '' : timeVal(Math.min(1440, start + dur))) + '"></label>' +
      '</div>' +
      '<form id="edNewForm" class="sc-addrow"><input class="field" id="edNames" maxlength="300" placeholder="Маша, Петя" aria-label="Ученики через запятую" autocomplete="off" value="' + esc(opts.names || '') + '">' +
        '<button class="btn" type="submit" id="edCreate">Создать</button></form>' +
      '<div class="hint" id="edNewHint"></div>' +
      '<div class="form-msg" id="edMsg"></div><div class="sc-resolve" id="edResolve"></div>';
    m.sheet.querySelector('.sc-x').addEventListener('click', closeModal);
    // событие (созвон, врач, вебинар) — не урок: вместо имён название
    let isEvent = !!opts.event && !opts.makeup;
    const paintKind = () => {
      m.sheet.querySelectorAll('#edKind button').forEach(b => b.classList.toggle('on', (b.dataset.k === 'event') === isEvent));
      const n = m.sheet.querySelector('#edNames');
      n.placeholder = isEvent ? 'Созвон, врач, вебинар…' : 'Маша, Петя';
      n.setAttribute('aria-label', isEvent ? 'Название события' : 'Ученики через запятую');
      m.sheet.querySelector('#edNewHint').textContent = isEvent ? 'Событие не считается занятием: не доход и не часы.'
        : 'Имена через запятую. Двое — «пара», трое и больше — «группа»; формат можно сменить потом.';
    };
    m.sheet.querySelectorAll('#edKind button').forEach(b => b.addEventListener('click', () => { isEvent = b.dataset.k === 'event'; paintKind(); m.sheet.querySelector('#edNames').focus(); }));
    paintKind();
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
      const raw = m.sheet.querySelector('#edNames').value;
      if (isEvent && !raw.trim()) { m.sheet.querySelector('#edMsg').textContent = 'Напишите, что за событие'; btn.disabled = false; return; }
      const r = await createFromText(dayV, isEvent ? '◆ ' + raw : raw, m.sheet.querySelector('#edResolve'), hint, opts.makeup);
      if (!modal || modal !== m) return;
      btn.disabled = false;
      if (r.lesson) { closeModal(); api.toast(opts.makeup ? 'Отработка назначена' : isEvent ? 'Событие добавлено' : 'Занятие добавлено'); }
      else if (r.msg) m.sheet.querySelector('#edMsg').textContent = r.msg;
    });
    setTimeout(() => { const n = m.sheet.querySelector(opts.makeup ? '#edStart' : '#edNames'); if (n) n.focus(); }, 0);
  }

  function openEditor(l){
    const m = modalShell(l.is_event ? 'Событие' : 'Занятие');
    m.lessonId = l.id;
    m.sheet.innerHTML =
      '<div class="sc-ed-head"><b>' + (l.is_event ? '◆ Событие' : 'Занятие') + '</b><button type="button" class="sc-x" aria-label="Закрыть">×</button></div>' +
      '<div class="sc-ed-grid">' +
        '<label><span class="label">День</span><input class="field" type="date" id="edDay"></label>' +
        '<label><span class="label">С</span><input class="field" type="time" step="900" id="edStart"></label>' +
        '<label><span class="label">До</span><input class="field" type="time" step="900" id="edEnd"></label>' +
      '</div>' +
      (l.is_event
        ? '<label><span class="label">Название</span><input class="field sc-edtitle" id="edTitle" maxlength="200" placeholder="Созвон, врач, вебинар…"></label>' +
          '<div class="hint">Событие не считается занятием: не доход и не часы.</div>'
        : '<div class="label">Формат</div><div class="seg sc-edfmt" id="edFmt"></div><div class="hint" id="edFmtHint"></div>' +
          '<div class="label" style="margin-top:12px">Ученики</div><div class="sc-edpeople" id="edPeople"></div>' +
          '<form id="edAddForm" class="sc-addrow"><input class="field" id="edAdd" maxlength="300" placeholder="Добавить: Маша, Петя" aria-label="Добавить учеников" autocomplete="off">' +
            '<button class="btn quiet" type="submit">Добавить</button></form>') +
      '<div class="form-msg" id="edMsg"></div><div class="sc-resolve" id="edResolve"></div>' +
      '<div class="row-btns sc-ed-foot"><button type="button" class="btn danger" id="edDel">' + (l.is_event ? 'Удалить событие' : 'Удалить занятие') + '</button>' +
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
    if (l.is_event) q('#edTitle').addEventListener('change', e => {
      const v = e.target.value.trim().replace(/\s+/g, ' ');
      if (!v) { e.target.value = l.title; return; }
      if (v !== l.title) patchLesson(l, { title: v });
    });
    if (!l.is_event) q('#edAddForm').addEventListener('submit', async e => {
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
        closeModal(); render(); api.toast(l.is_event ? 'Событие удалено' : 'Занятие удалено');
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
    if (l.is_event) { setv('#edTitle', l.title || ''); return; }
    q('#edFmt').innerHTML = SC.FORMATS.map(f => '<button type="button" data-v="' + f + '" class="' + (f === l.format ? 'on' : '') + '" title="' + esc(FMT_HINT[f]) + '">' + esc(fmtLabel(f)) + '</button>').join('');
    q('#edFmtHint').textContent = fmtLabel(l.format) + ' — ' + FMT_HINT[l.format];
    q('#edFmt').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { if (b.dataset.v !== l.format) patchLesson(l, { format: b.dataset.v }); }));
    q('#edPeople').innerHTML = l.people.length ? l.people.map(p =>
      '<div class="sc-edp st-' + p.status + '" data-id="' + esc(l.id) + '">' +
        '<button type="button" class="sc-st rw-ic st-' + p.status + '" data-pid="' + esc(p.id) + '" title="' + esc(ST_NAME[p.status]) + ' — нажмите, чтобы сменить">' + R.icon(p.status) + '</button>' +
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
    // «Отработка» — галочка, а не кнопка: своё событие change
    el.addEventListener('change', e => {
      if (e.target.id !== 'spMakeup' || !panel) return;
      const l = findLesson(panel.lessonId), p = l && l.people.find(x => x.student_id === panel.sid);
      if (p) setPart(l, p, { makeup: e.target.checked }).then(paintPanel);
    });
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
    else if (t.id === 'spWhy' || t.id === 'spPaid' || t.dataset.flag) onPanelPay(t, l);
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
    if (s) h += panelPayHtml(l, l.people.find(p => p.student_id === s.id), s);
    h += '<div class="sc-sp-foot"><button type="button" class="btn quiet small" id="spEdit">Править занятие</button></div>';
    panel.el.innerHTML = h;
    panel.el.scrollTop = keepScroll;
  }

  /* ── оплата в боковой панели: отметки участия и остаток ученика ── */
  const sumCache = {};      // sid → { tok, text } — итог ученика на эту загрузку недели
  function panelPayHtml(l, p, s){
    const P = window.Payments;
    if (!P || !p || l.is_event || (SC.hasPayCols && !SC.hasPayCols())) return '';
    const ps = paySet();
    let h = '<div class="sp-pay" id="spPay"><div class="label">Оплата</div>';
    const sm = sumCache[s.id];
    if (!sm || sm.tok !== st.loadTok) {
      sumCache[s.id] = { tok: st.loadTok, text: '…' };
      P.loadStudent(s).then(d => {
        const c = P.calc(Object.assign({}, d, { settings: settings() }));
        const k = c.current;
        sumCache[s.id].text = (c.mode === 'pack' ? (k ? 'Абонемент: осталось ' + k.left + ' из ' + k.cap + (k.pay.burn === 'date' ? ' · до ' + P.dm(k.end) : k.until ? ' · до ' + P.dm(k.until) : '') : 'Абонемента нет') : 'Платит за занятие') +
          (c.debt > 0 ? ' · долг ' + P.money(c.debt) : '');
        paintPanel();
      }, () => { sumCache[s.id].text = ''; paintPanel(); });
    }
    const text = sumCache[s.id].text;
    h += '<div><a href="#/payments/' + esc(s.id) + '" id="spSum">' + esc(text || 'Оплаты ученика') + '</a></div>';
    h += paidBtn(p, l).replace('class="sc-paid', 'id="spPaid" class="sc-paid');
    if (isAbsent(p)) h += '<button type="button" class="btn quiet small" id="spWhy">' + esc(ST_NAME[p.status] + ': ' + whyText(p, l)) + '</button>';
    if (ps.flags.length) h += '<div class="sp-flags" role="group" aria-label="Флаги">' + ps.flags.map(f =>
      '<button type="button" data-flag="' + esc(f.id) + '" class="' + ((p.flags || []).indexOf(f.id) >= 0 ? 'on' : '') + '" title="' + (f.free ? 'делает занятие бесплатным' : 'пометка') + '">' + esc(f.name) + '</button>').join('') + '</div>';
    h += '<label class="chk" style="margin:0"><input type="checkbox" id="spMakeup"' + (p.makeup ? ' checked' : '') + '> Отработка</label>';
    return h + '</div>';
  }
  function onPanelPay(t, l){
    const p = l.people.find(x => x.student_id === panel.sid);
    if (!p) return;
    if (t.id === 'spWhy') openPayCard(l, p);
    else if (t.id === 'spPaid') togglePaid(l, p);
    else if (t.dataset.flag) {
      const fl = (p.flags || []).slice(), i = fl.indexOf(t.dataset.flag);
      if (i >= 0) fl.splice(i, 1); else fl.push(t.dataset.flag);
      setPart(l, p, { flags: fl }).then(paintPanel);
    }
  }

  /* ══ действия дня: ⧉ скопировать, ↓ вставить, ✕ очистить, ▤ все часы, ◆ событие ══
     Отдельными функциями, а не внутри listHtml: разметку строк дня
     переделывает редизайн (schedule-rows.js), и шапка дня берёт кнопки
     одной строкой — dayActions(ref) в html и bindDayActions(host) после
     отрисовки. ref — «week:ГГГГ-ММ-ДД» (день расписания) или «tpl:1…7»
     (день текущего шаблона); как читать и писать дни шаблона, знает
     schedule-tpl.js (ScheduleTpl.dayKind).

     Буфер дня общий для расписания и шаблона и живёт в localStorage: день
     копируют в одной вкладке, вставляют в другой (так было в старом
     приложении). Копируется состав, время, формат, событие — без статусов
     и оплат: вставленный день — новый, отметки у него свои */
  const CLIP_KEY = 'cabinet:schedule:dayclip';
  const HOURS_FROM = 9, HOURS_TO = 21;          // «развернуть все часы» — как в старом
  st.expand = {};                               // ref → развёрнут (только на экране, в базу не пишется)
  let dayBusy = false;
  function clipRead(){
    try { const c = JSON.parse(localStorage.getItem(CLIP_KEY) || 'null'); return c && Array.isArray(c.items) ? c : null; } catch (e) { return null; }
  }
  function clipWrite(c){ try { if (c) localStorage.setItem(CLIP_KEY, JSON.stringify(c)); else localStorage.removeItem(CLIP_KEY); } catch (e) {} }
  const itemOf = x => ({ start_min: x.start_min, dur_min: x.dur_min, format: x.format, is_event: !!x.is_event, title: x.title || '', note: x.note || '',
    group_id: x.group_id || null, people: x.is_event ? [] : x.people.map(p => (p.student_id ? { student_id: p.student_id } : { guest_name: p.guest_name })) });
  const weekKind = {
    items: day => lessonsOf(day),
    label: day => DAY_SHORT[weekday(day)] + ', ' + dayText(day),
    noun: n => plural(n, 'занятие', 'занятия', 'занятий'),
    start: id => { const l = findLesson(id); return l ? l.start_min : null; },
    async remove(list){
      const ids = new Set(list.map(l => l.id));
      await SC.deleteLessons(Array.from(ids));
      st.lessons = st.lessons.filter(l => !ids.has(l.id));
    },
    async insert(day, items){
      const ls = await SC.addLessons(items.map(it => ({ f: Object.assign({ day }, it), people: it.people })));
      st.lessons = st.lessons.concat(ls);
      return ls.length;
    },
    // новая строка с готовым началом: «10:00 » из ▤ или «◆ »
    openQuick(day, text){
      const q = String(text || '').match(/^(\d{1,2}:\d{2})\s*(.*)$/);
      rows.startNew(day, q ? R.parseTime(q[1]) : null, q ? q[2] : String(text || ''));
      return true;
    },
    newEvent(day){ openNew(day, null, { event: true }); },
  };
  const kindOf = ref => { const k = ref.slice(0, ref.indexOf(':')); return k === 'tpl' ? TPL().dayKind : weekKind; };
  const keyOf = ref => ref.slice(ref.indexOf(':') + 1);
  const marked = list => list.some(x => (x.people || []).some(p => p.status && p.status !== 'plan'));

  function dayActions(ref, compact){
    const K = kindOf(ref), key = keyOf(ref), n = K.items(key).length, clip = clipRead();
    const b = (act, sign, title, dis, on) => '<button type="button" class="sc-da' + (on ? ' on' : '') + '" data-dact="' + act + '" data-ref="' + esc(ref) + '"' +
      (dis || dayBusy ? ' disabled' : '') + ' title="' + esc(title) + '" aria-label="' + esc(title) + '">' + sign + '</button>';
    return '<span class="sc-dacts">' +
      b('copy', '⧉', n ? 'Скопировать день (' + K.noun(n) + ')' : 'Скопировать день — в нём пусто', !n) +
      b('paste', '↓', clip ? 'Вставить скопированный день: ' + clip.label : 'Вставить день — сначала скопируйте день кнопкой ⧉', !clip) +
      b('event', '◆', 'Добавить событие — не занятие: не доход и не часы') +
      (compact ? '' : b('hours', '▤', st.expand[ref] ? 'Свернуть пустые часы' : 'Развернуть все часы ' + HOURS_FROM + '–' + HOURS_TO, false, st.expand[ref])) +
      b('clear', '✕', n ? 'Очистить день' : 'Очистить день — в нём пусто', !n) +
      '</span>';
  }
  // «очистить неделю» (ref «week:» — неделя расписания, «tpl:» — весь шаблон)
  function weekClearHtml(ref){
    const all = ref === 'tpl:' ? TPL().dayKind.all() : st.lessons;
    return '<button type="button" class="btn quiet small sc-wclear" data-wclear="' + esc(ref) + '"' + (all.length && !dayBusy ? '' : ' disabled') +
      ' title="' + (ref === 'tpl:' ? 'Удалить все слоты шаблона' : 'Удалить все занятия этой недели') + '">✕ ' + (ref === 'tpl:' ? 'Очистить шаблон' : 'Очистить неделю') + '</button>';
  }

  // своё стеклянное окно вопроса вместо confirm(): ответ — value кнопки или null
  function askSheet(title, text, buttons){
    return new Promise(resolve => {
      const m = modalShell(title);
      let done = false;
      const fin = v => { if (done) return; done = true; if (modal === m) closeModal(); resolve(v); };
      m.sheet.innerHTML = '<div class="sc-ed-head"><b>' + esc(title) + '</b><button type="button" class="sc-x" aria-label="Закрыть">×</button></div>' +
        '<div class="sc-ask-text">' + text + '</div>' +
        '<div class="row-btns sc-ask-btns">' + buttons.map((x, i) => '<button type="button" class="btn' + (x.cls ? ' ' + x.cls : '') + '" data-i="' + i + '">' + esc(x.label) + '</button>').join('') + '</div>';
      m.sheet.querySelector('.sc-x').addEventListener('click', () => fin(null));
      m.sheet.querySelectorAll('[data-i]').forEach(x => x.addEventListener('click', () => fin(buttons[Number(x.dataset.i)].value)));
      // окно закрыли мимо кнопок (Esc, щелчок по фону) — это «нет»
      const obs = new MutationObserver(() => { if (!m.el.isConnected) { obs.disconnect(); fin(null); } });
      obs.observe(document.body, { childList: true });
      setTimeout(() => { const last = m.sheet.querySelector('[data-i]:last-child'); if (last) last.focus(); }, 0);
    });
  }
  const lossNote = list => (marked(list) ? '<br><span class="sc-ask-warn">У части уже есть отметки (проведено, пропуск) — они пропадут вместе с занятиями.</span>' : '');

  async function busyRun(fn){
    if (dayBusy) return;
    dayBusy = true; render();
    try { await fn(); }
    // часть могла лечь — правду знает только база, перечитываем неделю и шаблоны
    catch (e) { api.toast('Не сохранилось: ' + (e.message || e)); load(); }
    finally { dayBusy = false; render(); }
  }

  function copyDay(ref){
    const K = kindOf(ref), key = keyOf(ref), list = K.items(key);
    if (!list.length) return;
    clipWrite({ from: ref.slice(0, ref.indexOf(':')), label: K.label(key), items: list.map(itemOf), at: Date.now() });
    render();
  }
  async function pasteDay(ref){
    const clip = clipRead();
    if (!clip || !clip.items.length) return;
    const K = kindOf(ref), key = keyOf(ref), old = K.items(key);
    let mode = 'add';
    if (old.length) {
      mode = await askSheet('Вставить день',
        'В «' + esc(K.label(key)) + '» уже ' + esc(K.noun(old.length)) + '. Заменить ' + (old.length === 1 ? 'его' : 'их') + ' скопированным днём «' + esc(clip.label) + '» (' + esc(K.noun(clip.items.length)) + ')?' + lossNote(old),
        [{ label: 'Отмена', cls: 'quiet', value: null }, { label: 'Добавить к ним', cls: 'quiet', value: 'add' }, { label: 'Заменить ' + K.noun(old.length), cls: 'danger', value: 'replace' }]);
      if (!mode) return;
    }
    await busyRun(async () => {
      // сначала удаляем, потом вставляем: при «заменить» с пересечением по
      // времени иначе на миг стояли бы оба занятия
      if (mode === 'replace') await K.remove(old);
      const n = await K.insert(key, clip.items);
      api.toast('Вставлено: ' + K.noun(n));
    });
  }
  async function clearDay(ref){
    const K = kindOf(ref), key = keyOf(ref), list = K.items(key);
    if (!list.length) return;
    const ok = await askSheet('Очистить день', 'Удалить ' + esc(K.noun(list.length)) + ' — «' + esc(K.label(key)) + '»? Отменить это нельзя.' + lossNote(list),
      [{ label: 'Отмена', cls: 'quiet', value: null }, { label: 'Удалить ' + K.noun(list.length), cls: 'danger', value: true }]);
    if (!ok) return;
    await busyRun(async () => { await K.remove(list); api.toast('День очищен'); });
  }
  async function clearWeek(ref){
    const tpl = ref === 'tpl:', K = tpl ? TPL().dayKind : weekKind;
    const list = tpl ? K.all() : st.lessons.slice();
    if (!list.length) return;
    const where = tpl ? 'из шаблона «' + esc(K.name()) + '»' : 'с недели ' + esc(rangeText(st.week));
    const ok = await askSheet(tpl ? 'Очистить шаблон' : 'Очистить неделю', 'Удалить ' + esc(K.noun(list.length)) + ' ' + where + '? Отменить это нельзя.' + lossNote(list),
      [{ label: 'Отмена', cls: 'quiet', value: null }, { label: 'Удалить ' + K.noun(list.length), cls: 'danger', value: true }]);
    if (!ok) return;
    await busyRun(async () => { await K.remove(list); api.toast(tpl ? 'Шаблон очищен' : 'Неделя очищена'); });
  }

  function bindDayActions(root){
    root.querySelectorAll('[data-dact]').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      const ref = b.dataset.ref, K = kindOf(ref), key = keyOf(ref);
      const a = b.dataset.dact;
      if (a === 'copy') copyDay(ref);
      else if (a === 'paste') pasteDay(ref);
      else if (a === 'clear') clearDay(ref);
      else if (a === 'hours') { st.expand[ref] = !st.expand[ref]; render(); }
      else if (a === 'event') K.newEvent(key);
    }));
    root.querySelectorAll('[data-wclear]').forEach(b => b.addEventListener('click', () => clearWeek(b.dataset.wclear)));
  }

  // ▤ виртуальные пустые окна рисует schedule-rows.js (cfg.hoursOpen):
  // строка на каждый свободный час 9–21, в базу ничего не пишется

  // плашка буфера: внизу экрана, вне разметки дней — переживает любой вид
  function paintClip(){
    let el = document.getElementById('scClip');
    const clip = clipRead();
    const visible = clip && host && host.isConnected && host.offsetParent !== null && (st.mode === 'week' || st.mode === 'tpl');
    if (!visible) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement('div');
      el.id = 'scClip';
      el.className = 'sc-clip panel';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.innerHTML = '<span>Скопирован день <b>' + esc(clip.label) + '</b> · ' + esc(plural(clip.items.length, 'строка', 'строки', 'строк')) + ' — жмите ↓ у нужного дня</span>' +
      '<button type="button" class="btn quiet small" id="scClipX">Отменить</button>';
    el.querySelector('#scClipX').addEventListener('click', () => { clipWrite(null); render(); });
  }
  // день скопировали в другой вкладке — у кнопок ↓ и на плашке сразу видно
  window.addEventListener('storage', e => { if (e.key === CLIP_KEY && host && st.week) render(); });

  /* ── отрисовка ── */
  // пока в форме быстрого ввода висит вопрос о незнакомом имени, полная
  // перерисовка снесла бы его кнопки (их ждёт промис resolveNames). Поэтому
  // в это время render() только помечает «надо», а рисует обработчик формы
  // после ответа
  let pending = false;
  function render(loading){
    loading = loading || st.loading;
    if (rowsBusy && !loading) { pending = true; return; }
    pending = false;
    if (!host || !st.week) return;
    const gw = host.querySelector('.sc-gwrap');
    const scroll = gw ? [gw.scrollLeft, gw.scrollTop] : null;
    let body;
    if (loading) body = '<div class="empty">Загружаем…</div>';
    else if (st.err) body = '<div class="empty">' + esc(st.err) + ' <button type="button" class="btn quiet small" id="scRetry">Повторить</button></div>';
    else if (st.mode !== 'week') body = TPL().paneHtml();
    else body = st.view === 'grid' ? gridHtml() : listHtml();
    host.innerHTML = headHtml() + '<div class="sc-body sc-v-' + st.view + '" id="scBody">' + body + '</div>';
    const tb = host.querySelector('#scToday');
    // уже на этой неделе — адрес не меняется, перерисовываем сами (одна
    // перерисовка: вторая сняла бы вспышку дня)
    if (tb) tb.addEventListener('click', e => {
      st.goToday = true;
      if (mondayOf(today()) === st.week) { e.preventDefault(); if (location.hash !== tb.getAttribute('href')) history.replaceState(null, '', tb.getAttribute('href')); render(); }
    });
    host.querySelectorAll('.sc-views button').forEach(b => b.addEventListener('click', () => { rows.cancel(); setView(b.dataset.v); }));
    host.querySelectorAll('.sc-modes button').forEach(b => b.addEventListener('click', () => { rows.cancel(); st.mode = b.dataset.mode; closeModal(); closePanel(); closeStudentCard(); render(); }));
    const lookBtn = host.querySelector('#scLook');
    if (lookBtn) lookBtn.addEventListener('click', () => R.openMenu(lookBtn, lookItems(), { checks: true, cls: 'gm-look' }));
    const retry = host.querySelector('#scRetry');
    if (retry) retry.addEventListener('click', load);
    paintClip();
    if (loading || st.err) return;
    bindDayActions(host);
    if (st.mode !== 'week') { TPL().bindPane(host); return; }
    TPL().bindWeekMenu(host);
    if (st.view === 'grid') {
      bindGrid();
      const ngw = host.querySelector('.sc-gwrap');
      if (scroll && ngw && st.gridAt === st.week) { ngw.scrollLeft = scroll[0]; ngw.scrollTop = scroll[1]; }
      else if (ngw) gridToFirst(ngw);
      st.gridAt = st.week;
    } else { bindList(); st.gridAt = null; }
    if (st.goToday) { st.goToday = false; goToday(); }
    paintEditor();
    paintPanel();
    paintStudentCard();
  }

  // шаблоны, пары и группы живут в schedule-tpl.js; общие приёмы он берёт отсюда
  const TPL = () => window.ScheduleTpl;
  function init(opts){
    api = opts;
    TPL().attach({ st, SC, api: () => api, esc, pad, hm, addDays, toDate, mondayOf, DAY_SHORT, DAY_LONG, FMT_HINT, fmtLabel, plural, rangeText, dayText,
      timeText, timeVal, readTime, parseQuick, norm, resolveNames, resolveEntry, activeStudents, personName, durFor, defaultFormat, groupOf,
      modalShell, closeModal, getModal: () => modal, render, reload: () => load(), look: () => look, setBusy: v => { rowsBusy = v; if (!v && pending) render(); },
      dayActions, weekClearHtml, itemOf });
    host = opts.host;
    st.view = readView();
    if (api.settingsChanged) api.settingsChanged(() => { if (st.week) render(); });
  }
  function show(weekParam){
    const day = validDay(weekParam) ? weekParam : today();
    const mon = mondayOf(day);
    if (mon === st.week && st.lessons && !st.err && host.querySelector('.sc-body')) { render(); return Promise.resolve(); }
    st.week = mon;
    st.dtOpen = null;
    st.openPlate = null;
    rows.cancel();
    closeModal();
    closePanel();
    closeStudentCard();
    return load();
  }

  window.Schedule = { init, show, hide: () => { closePanel(); closeStudentCard(); R.closeMenu(); const c = document.getElementById('scClip'); if (c) c.remove(); }, parseQuick, matchName, mondayOf, _st: st, reload: () => load(), setMode: m => { st.mode = m; render(); } };
})();
