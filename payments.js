/* ==========================================================
   payments.js — оплаты и ставки кабинета: база и расчёт (задача В4(а)).

   Таблицы student_rates, payments, поля оплаты у lesson_students и
   students.pay_mode — cabinet-payments.sql. Разбор и решения Даниила —
   claude-notes/payments-audit.md (разделы 3 и 5).

   Главное: остаток, долг и «почему столько» НЕ хранятся, а считаются здесь
   из отметок занятий и оплат (calc). Поэтому у любого числа есть выписка —
   список занятий и оплат, из которых оно сложилось.

   Правило «оплачивается ли занятие ученика» (billOf):
     событие — никогда; флаг преподавателя «бесплатно» — нет; ручное
     исключение bill (charge / free) — как сказано; отмена по вине
     преподавателя — нет; проведено — да; прогул — по настройке
     pay.skipRule (по умолчанию нет — как перенос, решение Даниила 13.11 и
     правило старого приложения); перенос и «запланировано» — нет.

   Абонемент (kind = pack) списывает оплачиваемые занятия по порядку дат:
   занятие берёт первый по очереди абонемент, который уже начался, ещё не
   кончился (по сроку или вручную) и в котором есть место. Так прошлый
   абонемент дорабатывается раньше нового, оплаченного заранее (очередь,
   как в старом приложении), а сгорание по сроку — просто граница окна.
   Занятия, которым абонемента не хватило, и разовые оплаты сводятся в
   баланс в рублях по ставке на дату занятия. «Оплатил» у занятия — разовая
   оплата со ссылкой на участие: это занятие закрыто, в баланс не идёт.
   ========================================================== */
(function(){
  'use strict';
  const C = () => window.CabinetCloud;

  const PAY_LS = 'bill, reason, by_teacher, makeup, makeup_for, flags';
  const PAY_COLS = 'id, student_id, guest_name, kind, paid_on, amount, lessons, burn, start_on, end_on, adjust, lesson_student_id, payer, method, note, archived_at, ext_id, created_at';
  const RATE_COLS = 'id, student_id, valid_from, price, group_price, per_week, monthly, note';
  const LES_COLS = 'id, day, start_min, dur_min, format, is_event';
  const PAGE = 1000;     // потолок строк одного ответа PostgREST у Supabase

  /* ── даты и деньги ── */
  const pad = n => (n < 10 ? '0' : '') + n;
  const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const today = () => ymd(new Date());
  const toDate = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = toDate(s); d.setDate(d.getDate() + n); return ymd(d); };
  const addMonths = (s, n) => { const d = toDate(s); const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); return ymd(d); };
  const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / 86400000);
  const dm = s => { const d = toDate(s); return pad(d.getDate()) + '.' + pad(d.getMonth() + 1); };
  const dmy = s => dm(s) + '.' + toDate(s).getFullYear();
  // 16 000 ₽ — пробел внутри числа неразрывный: сумма не рвётся по строкам
  function money(n){
    const v = Math.round(Number(n) || 0);
    return (v < 0 ? '−' : '') + String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
  }
  function plural(n, a, b, c){ const m10 = n % 10, m100 = n % 100; return n + ' ' + (m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c); }

  /* ── настройки оплат (teacher_settings.settings.pay) ── */
  const FLAG_TEMPLATES = [
    { id: 'trial', name: 'пробное', free: true },
    { id: 'charity', name: 'благотворительное', free: true },
    { id: 'practice', name: 'тренировочное', free: true },
  ];
  const REASONS = ['болезнь', 'предупредил заранее', 'не пришёл', 'семейные обстоятельства'];
  const PAY_DEFAULTS = { skipRule: 'free', reason: 'болезнь', remindLeft: 1, remindDays: 3, flags: [] };
  function paySettings(s){
    const raw = (s && s.pay) || {};
    return Object.assign({}, PAY_DEFAULTS, raw, { flags: Array.isArray(raw.flags) ? raw.flags : [] });
  }

  /* ── правило «оплачивается ли» ── */
  const ST_WORD = { plan: 'запланировано', done: 'проведено', skip: 'прогул', move: 'перенос' };
  // p — участие (lesson_students), l — занятие. → { pay, why, plan }
  function billOf(p, l, ps){
    if (l && l.is_event) return { pay: false, why: 'событие' };
    const fl = (p.flags || []).map(id => ps.flags.find(f => f.id === id)).filter(Boolean);
    const freeFlag = fl.find(f => f.free);
    if (freeFlag) return { pay: false, why: 'флаг «' + freeFlag.name + '»' };
    if (p.bill === 'free') return { pay: false, why: 'отмечено бесплатным' };
    if (p.by_teacher) return { pay: false, why: 'отмена по вине преподавателя' };
    if (p.bill === 'charge') return { pay: true, why: p.status === 'done' ? 'проведено' : ST_WORD[p.status] + ' — отмечено «оплачивается»' };
    if (p.status === 'done') return { pay: true, why: 'проведено' };
    if (p.status === 'skip') return ps.skipRule === 'charge' ? { pay: true, why: 'прогул — оплачивается по правилу' } : { pay: false, why: 'прогул — не оплачивается' };
    if (p.status === 'move') return { pay: false, why: 'перенос' };
    return { pay: false, why: 'запланировано', plan: true };
  }
  const reasonOf = (p, ps) => (p.status === 'skip' || p.status === 'move' || p.by_teacher) ? (p.reason || ps.reason || '') : '';

  /* ── ставка на дату ── */
  function rateOn(rates, day, format){
    let r = null;
    (rates || []).forEach(x => { if (x.valid_from <= day && (!r || x.valid_from > r.valid_from)) r = x; });
    if (!r) return null;
    const grp = format && format !== 'single' && r.group_price != null;
    return Number(grp ? r.group_price : r.price);
  }

  /* ── способ оплаты ученика: явный или по наличию абонементов ── */
  function modeOf(student, payments){
    if (student && (student.pay_mode === 'pack' || student.pay_mode === 'lesson')) return student.pay_mode;
    return (payments || []).some(p => p.kind === 'pack') ? 'pack' : 'lesson';
  }

  /* ══ расчёт по одному ученику ══
     d = { student, rates, payments, parts: [{ p, l }], settings, today }
     Возвращает итог и выписку (lines, от старых к новым) */
  function calc(d){
    const ps = paySettings(d.settings), now = d.today || today();
    const rates = d.rates || [], pays = (d.payments || []).slice();
    const linked = {};
    pays.forEach(x => { if (x.kind === 'single' && x.lesson_student_id) linked[x.lesson_student_id] = x; });
    const packs = pays.filter(x => x.kind === 'pack')
      .map(x => ({ pay: x, start: x.start_on || x.paid_on, end: x.end_on || null, cap: Number(x.lessons) || 0, used: Number(x.adjust) || 0, proj: 0, items: [], until: null }))
      .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : String(a.pay.created_at || '') < String(b.pay.created_at || '') ? -1 : 1));
    const parts = (d.parts || []).filter(x => x.l && !x.l.is_event)
      .sort((a, b) => (a.l.day < b.l.day ? -1 : a.l.day > b.l.day ? 1 : (a.l.start_min || 0) - (b.l.start_min || 0)));
    const fits = (k, day, used) => k.start <= day && (!k.end || day <= k.end) && used < k.cap;
    const rows = [];
    let moneyIn = 0, cost = 0, noRate = 0, unpaidN = 0, singlePaid = 0;
    parts.forEach(x => {
      const b = billOf(x.p, x.l, ps);
      const row = { kind: 'lesson', day: x.l.day, x, b, price: rateOn(rates, x.l.day, x.l.format) };
      if (b.plan) {
        // будущее «запланировано»: только для даты «до какого числа»
        if (x.l.day >= now) {
          const k = packs.find(k2 => fits(k2, x.l.day, k2.used + k2.proj));
          if (k) { k.proj++; if (k.used + k.proj === k.cap) k.until = x.l.day; }
        }
        return;
      }
      if (b.pay) {
        const sp = linked[x.p.id];
        if (sp) { row.single = sp; singlePaid++; }
        else {
          const k = packs.find(k2 => fits(k2, x.l.day, k2.used));
          if (k) { k.used++; row.pack = k; row.n = k.used; k.items.push(row); if (k.used === k.cap) k.until = x.l.day; }
          else { row.debt = true; unpaidN++; if (row.price == null) noRate++; else cost += row.price; }
        }
      }
      rows.push(row);
    });
    // разовые без занятия — деньги в счёт занятий
    pays.forEach(x => { if (x.kind === 'single' && !x.lesson_student_id) moneyIn += Number(x.amount) || 0; });
    packs.forEach(k => {
      k.left = Math.max(0, k.cap - k.used);
      k.expired = !!(k.end && now > k.end);
      k.closed = k.expired || k.left <= 0;
      k.burned = k.expired ? k.left : 0;
    });
    const active = packs.filter(k => !k.closed);
    const current = active[0] || null;
    const lastPack = packs.length ? packs[packs.length - 1] : null;
    const balance = moneyIn - cost;
    const debt = Math.max(0, -balance);
    const mode = modeOf(d.student, pays);
    // напоминание — только преподавателю, в кабинете (решение Даниила 13.11)
    let remind = null;
    if (current) {
      if (current.left <= ps.remindLeft) remind = 'осталось ' + plural(current.left, 'занятие', 'занятия', 'занятий');
      if (current.end && daysBetween(now, current.end) <= ps.remindDays) remind = (remind ? remind + ', ' : '') + 'срок до ' + dm(current.end);
    } else if (mode === 'pack' && lastPack) remind = 'абонемент закончился';

    // выписка: оплаты и занятия одной лентой, с остатком после каждой строки
    const lines = [];
    pays.forEach(x => {
      if (x.kind === 'pack') {
        const k = packs.find(k2 => k2.pay === x);
        lines.push({ day: x.paid_on, ord: 0, sign: '+', cls: 'in', text: 'Абонемент: ' + plural(k.cap, 'занятие', 'занятия', 'занятий') + ', ' + money(x.amount) +
          (x.burn === 'date' ? ' · по сроку с ' + dm(k.start) + ' по ' + dm(k.end) : (x.start_on && x.start_on !== x.paid_on ? ' · с ' + dm(k.start) : '')) +
          (x.payer ? ' · платил: ' + x.payer : ''), right: 'осталось ' + k.cap, pay: x });
        if (x.adjust) lines.push({ day: x.paid_on, ord: 1, sign: '±', cls: 'adj', text: 'Правка: ' + (x.adjust > 0 ? 'списано ещё ' : 'возвращено ') + plural(Math.abs(x.adjust), 'занятие', 'занятия', 'занятий') + (x.note ? ' — ' + x.note : ''), right: '' });
        if (k.expired && k.burned) lines.push({ day: addDays(k.end, 1), ord: 0, sign: '×', cls: 'burn', text: 'Срок абонемента от ' + dm(x.paid_on) + ' кончился ' + dm(k.end) + ': сгорело ' + plural(k.burned, 'занятие', 'занятия', 'занятий'), right: '' });
      } else if (!x.lesson_student_id) {
        lines.push({ day: x.paid_on, ord: 0, sign: '+', cls: 'in', text: 'Оплата ' + money(x.amount) + ' в счёт занятий' + (x.payer ? ' · платил: ' + x.payer : '') + (x.note ? ' · ' + x.note : ''), money: Number(x.amount) || 0, pay: x });
      }
    });
    rows.forEach(r => {
      const p = r.x.p, rs = reasonOf(p, ps);
      const sign = { done: '✓', skip: '✕', move: '↷', plan: '○' }[p.status];
      const what = ST_WORD[p.status] + (rs ? ', ' + rs : '') + (p.makeup ? ' · отработка' : '');
      let text, right = '', cls = 'les';
      if (!r.b.pay) { text = what + ' — не оплачивается' + (r.b.why && r.b.why.indexOf(ST_WORD[p.status]) !== 0 ? ' (' + r.b.why + ')' : ''); cls = 'free'; }
      else if (r.single) text = what + ' — оплачено за занятие, ' + money(r.single.amount);
      else if (r.pack) { text = what + ' — абонемент от ' + dm(r.pack.pay.paid_on) + ': ' + r.n + '-е из ' + r.pack.cap; right = 'осталось ' + Math.max(0, r.pack.cap - r.n); }
      else { text = what + ' — без оплаты: ' + (r.price == null ? 'ставка не задана' : money(r.price)); cls = 'debt'; r.money = -(r.price || 0); }
      lines.push({ day: r.day, ord: 2, sign, cls, text, right, money: r.money, lsId: p.id });
    });
    lines.sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : a.ord - b.ord));
    let bal = 0;
    lines.forEach(ln => { if (ln.money != null) { bal += ln.money; ln.right = (ln.right ? ln.right + ' · ' : '') + 'баланс ' + money(bal); } });

    const last = pays.slice().sort((a, b) => (a.paid_on < b.paid_on ? 1 : a.paid_on > b.paid_on ? -1 : 0))
      .find(x => x.kind === 'pack' || !x.lesson_student_id) || null;
    return { mode, packs, current, active, queued: active.slice(1), balance, debt, debtLessons: unpaidN, noRate, singlePaid,
      remind, lines, last, rate: rateOn(rates, now, 'single'), groupRate: rateOn(rates, now, 'pair'), rates };
  }

  /* ══ база ══ */
  function need(){ const c = C() && C().client(); if (!c) throw new (C().CabinetError)({ message: 'no_config' }); return c; }
  async function run(p){
    let res;
    try { res = await p; } catch (e) { throw new (C().CabinetError)(e); }
    if (res.error) throw new (C().CabinetError)(res.error);
    return res.data;
  }
  // все строки запроса страницами: у Supabase ответ обрезается на 1000
  async function all(make){
    let out = [];
    for (let i = 0; ; i += PAGE) {
      const part = (await run(make().range(i, i + PAGE - 1))) || [];
      out = out.concat(part);
      if (part.length < PAGE) return out;
    }
  }
  // Файл cabinet-payments.sql ещё не выполнен — таблиц и полей нет. Тогда
  // вкладка говорит «выполните SQL», а расписание работает как раньше
  const missing = e => { const r = (e && e.raw) || e || {}; return r.code === '42P01' || r.code === '42703' || r.code === 'PGRST205' || /does not exist|could not find the table/i.test(String(r.message || '')); };

  async function modes(){
    try { return await all(() => need().from('students').select('id, pay_mode').order('id', { ascending: true })); }
    catch (e) { if (missing(e)) return []; throw e; }
  }
  // всё для вкладки «Оплаты»: у одного преподавателя данных немного,
  // считаем на клиенте (payments-audit.md, «Как считать»)
  async function loadAll(){
    const c = need();
    const [rates, pays, ls, les, pm] = await Promise.all([
      all(() => c.from('student_rates').select(RATE_COLS).order('valid_from', { ascending: true })),
      all(() => c.from('payments').select(PAY_COLS).order('paid_on', { ascending: true })),
      all(() => c.from('lesson_students').select('id, lesson_id, student_id, status, ' + PAY_LS).order('id', { ascending: true })),
      all(() => c.from('lessons').select(LES_COLS).order('day', { ascending: true })),
      modes(),
    ]);
    return { rates, payments: pays, people: ls, lessons: les, modes: pm };
  }
  // данные к calc для каждого ученика из ответа loadAll
  function split(data, students){
    const byL = {};
    data.lessons.forEach(l => { byL[l.id] = l; });
    const pm = {};
    data.modes.forEach(m => { pm[m.id] = m.pay_mode; });
    const out = {};
    students.forEach(s => { out[s.id] = { student: Object.assign({}, s, { pay_mode: pm[s.id] || null }), rates: [], payments: [], parts: [] }; });
    data.rates.forEach(r => { if (out[r.student_id]) out[r.student_id].rates.push(r); });
    data.payments.forEach(p => { if (p.student_id && out[p.student_id]) out[p.student_id].payments.push(p); });
    data.people.forEach(p => { if (p.student_id && out[p.student_id] && byL[p.lesson_id]) out[p.student_id].parts.push({ p, l: byL[p.lesson_id] }); });
    return out;
  }
  // один ученик (боковая панель расписания)
  async function loadStudent(student){
    const c = need(), sid = String(student.id);
    const [rates, pays, les, pm] = await Promise.all([
      run(c.from('student_rates').select(RATE_COLS).eq('student_id', sid)),
      run(c.from('payments').select(PAY_COLS).eq('student_id', sid)),
      window.ScheduleCloud.listForStudent(sid),
      run(c.from('students').select('id, pay_mode').eq('id', sid)).catch(() => []),
    ]);
    return { student: Object.assign({}, student, { pay_mode: (pm && pm[0] && pm[0].pay_mode) || null }), rates: rates || [], payments: pays || [],
      parts: (les || []).map(l => ({ p: l.my, l })) };
  }
  // для недели расписания: способ оплаты, ставки и «оплатил» её учеников
  async function weekInfo(studentIds){
    const ids = Array.from(new Set(studentIds.filter(Boolean).map(String)));
    if (!ids.length) return { modes: {}, rates: {}, linked: {} };
    const c = need();
    const [pm, rates, pays] = await Promise.all([
      run(c.from('students').select('id, pay_mode').in('id', ids)),
      run(c.from('student_rates').select(RATE_COLS).in('student_id', ids)),
      run(c.from('payments').select(PAY_COLS).in('student_id', ids)),
    ]);
    const modesBy = {}, ratesBy = {}, linked = {}, paysBy = {};
    (rates || []).forEach(r => { (ratesBy[r.student_id] = ratesBy[r.student_id] || []).push(r); });
    (pays || []).forEach(p => { (paysBy[p.student_id] = paysBy[p.student_id] || []).push(p); if (p.lesson_student_id) linked[p.lesson_student_id] = p; });
    const pmBy = {};
    (pm || []).forEach(s => { pmBy[s.id] = s.pay_mode; });
    ids.forEach(id => { modesBy[id] = modeOf({ pay_mode: pmBy[id] }, paysBy[id]); });
    return { modes: modesBy, rates: ratesBy, linked };
  }

  function cleanPay(f){
    const o = {};
    const num = v => (v === '' || v == null ? null : Number(v));
    ['student_id', 'guest_name', 'payer', 'method', 'start_on', 'end_on', 'lesson_student_id', 'archived_at'].forEach(k => { if (k in f) o[k] = f[k] === '' || f[k] == null ? null : (typeof f[k] === 'string' ? f[k].trim() : f[k]); });
    if ('kind' in f) o.kind = f.kind === 'single' ? 'single' : 'pack';
    if ('paid_on' in f) o.paid_on = f.paid_on;
    if ('amount' in f) o.amount = Math.max(0, Math.round((num(f.amount) || 0) * 100) / 100);
    if ('lessons' in f) { const n = Math.round(num(f.lessons)); o.lessons = n >= 1 && n <= 500 ? n : null; }
    if ('burn' in f) o.burn = f.burn === 'date' ? 'date' : f.burn === 'count' ? 'count' : null;
    if ('adjust' in f) o.adjust = Math.max(-500, Math.min(500, Math.round(num(f.adjust) || 0)));
    if ('note' in f) o.note = String(f.note || '').slice(0, 1000);
    if (o.payer) o.payer = o.payer.slice(0, 80);
    return o;
  }
  const addPayment = f => run(need().from('payments').insert(cleanPay(f)).select(PAY_COLS).single());
  const updatePayment = (id, f) => run(need().from('payments').update(cleanPay(f)).eq('id', id).select(PAY_COLS).single());
  const deletePayment = id => run(need().from('payments').delete().eq('id', id));
  // ставка с даты: та же дата — правим строку (unique student_id + valid_from)
  async function setRate(studentId, f, existing){
    const o = { valid_from: f.valid_from, price: Math.max(0, Number(f.price) || 0), group_price: f.group_price === '' || f.group_price == null ? null : Math.max(0, Number(f.group_price) || 0) };
    const same = (existing || []).find(r => r.valid_from === o.valid_from);
    if (same) return run(need().from('student_rates').update(o).eq('id', same.id).select(RATE_COLS).single());
    return run(need().from('student_rates').insert(Object.assign({ student_id: String(studentId) }, o)).select(RATE_COLS).single());
  }
  const deleteRate = id => run(need().from('student_rates').delete().eq('id', id));
  const setMode = (studentId, mode) => run(need().from('students').update({ pay_mode: mode === 'pack' || mode === 'lesson' ? mode : null }).eq('id', String(studentId)).select('id, pay_mode').single());

  window.Payments = {
    FLAG_TEMPLATES, REASONS, PAY_DEFAULTS, paySettings, billOf, reasonOf, rateOn, modeOf, calc,
    loadAll, split, loadStudent, weekInfo, addPayment, updatePayment, deletePayment, setRate, deleteRate, setMode, missing,
    money, plural, dm, dmy, today, addDays, addMonths, daysBetween,
  };
})();
