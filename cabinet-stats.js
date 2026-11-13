/* ==========================================================
   cabinet-stats.js — вкладка «Статистика» кабинета (задача В4(б);
   экраны — payments-audit.md, раздел 3 «Вкладка Статистика», решения
   Даниила — раздел 5).

   Всё считается из отметок занятий, ставок и оплат (payments.js: billOf,
   rateOn, calc) — итогов в базе нет. Исключение одно: ручной итог дня
   (day_totals, cabinet-stats.sql) — он стоит вместо расчёта дня.

   Что на вкладке:
     периоды (неделя / месяц / 3 мес. / полгода / год / свой / период
     группы) со стрелками и сравнением с прошлым таким же периодом;
     карточки: доход (начислено), получено, должны, занятий, часов,
     стоимость часа, потеряно на пропусках;
     столбики: по месяцам (доход и получено), по ученикам (с отработками),
     по дням недели;
     «В месяц» по ученикам (способ — ×4 недели или по шаблону недели;
     ручное значение у ставки ученика важнее), статистика шаблона недели,
     калькулятор сценариев и группы дохода — свёрнуты, чтобы не мешали.

   Час — по времени проведённых занятий, пересечения не задваиваются
   (Payments.busyHours): пара и параллель — один час работы.
   ========================================================== */
(function(){
  'use strict';
  const P = () => window.Payments;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const DOW = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const MON_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const MON_FULL = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
  const PERIODS = [['week', 'Неделя'], ['month', 'Месяц'], ['q', '3 мес.'], ['half', 'Полгода'], ['year', 'Год'], ['custom', 'Свой']];
  const MONTHS_N = { month: 1, q: 3, half: 6, year: 12 };
  let ctx = null, host = null;
  const st = { data: null, err: '', tok: 0, students: [], tpls: [], totals: [], per: 'month', off: 0, from: null, to: null, grp: '', tplId: null };

  const settings = () => (ctx && ctx.settings && ctx.settings()) || {};
  const groups = () => (settings().incomeGroups || []).slice();
  const ymOf = s => s.slice(0, 7);
  const monStart = s => s.slice(0, 8) + '01';
  const monEnd = s => P().addDays(P().addMonths(monStart(s), 1), -1);
  const weekday = s => { const [y, m, d] = s.split('-').map(Number); return (new Date(y, m - 1, d).getDay() + 6) % 7; };
  const fmtH = h => (Math.round(h * 10) / 10).toLocaleString('ru-RU');

  /* ── группы дохода ──
     auto — «все ученики, кроме убранных» (out): новый ученик попадает сам,
     как в старом приложении; иначе — явный состав (members) */
  const inGroup = (g, sid) => (g.auto ? g.out.indexOf(String(sid)) < 0 : g.members.indexOf(String(sid)) >= 0);
  const curGroup = () => groups().find(g => g.id === st.grp) || null;

  /* ── период ── */
  function range(per, off, now){
    now = now || P().today();
    if (per === 'custom') {
      const from = st.from || monStart(now), to = st.to && st.to >= from ? st.to : now;
      return { from, to, label: P().dmy(from) + ' — ' + P().dmy(to) };
    }
    if (per === 'group') {
      const g = curGroup() || {};
      const from = g.from || monStart(now), to = g.to || now;
      return { from, to, label: (g.name || 'группа') + ': ' + P().dmy(from) + ' — ' + P().dmy(to) };
    }
    if (per === 'week') {
      const mon = P().addDays(now, -weekday(now) + 7 * off);
      return { from: mon, to: P().addDays(mon, 6), label: P().dm(mon) + ' — ' + P().dmy(P().addDays(mon, 6)) };
    }
    const n = MONTHS_N[per] || 1;
    const endM = P().addMonths(monStart(now), n * off), from = P().addMonths(endM, -(n - 1)), to = monEnd(endM);
    const ml = s => MON_FULL[Number(s.slice(5, 7)) - 1] + ' ' + s.slice(0, 4);
    return { from, to, label: n === 1 ? ml(from) : ml(from) + ' — ' + ml(to) };
  }
  // прошлый такой же период: для месяцев — те же месяцы раньше, для
  // своего — столько же дней перед ним
  function prevRange(per, off, r){
    if (per === 'week' || MONTHS_N[per]) return range(per, off - 1);
    const len = P().daysBetween(r.from, r.to);
    const to = P().addDays(r.from, -1);
    return { from: P().addDays(to, -len), to };
  }

  /* ══ расчёт за период ══
     data — ответ Payments.loadAll; o = { from, to, ids (Set id учеников или
     null — все), totals { день: сумма }, settings, today }.
     Ручной итог дня учитывается только без фильтра по ученикам: его не
     разделить между учениками */
  function compute(data, o){
    const ps = P().paySettings(o.settings), now = o.today || P().today();
    const byL = {}, rates = {};
    data.lessons.forEach(l => { byL[l.id] = l; });
    data.rates.forEach(r => { (rates[r.student_id] = rates[r.student_id] || []).push(r); });
    const want = sid => !o.ids || (sid && o.ids.has(String(sid)));
    const R = { income: 0, got: 0, lost: 0, expected: 0, noRate: 0, lessons: 0, hours: 0, workDays: 0, manualDays: 0, skips: 0, makeups: 0,
      per: {}, dow: DOW.map(() => ({ inc: 0, n: 0 })), months: {}, dayInc: {} };
    const doneL = {}, doneByDay = {};
    const mon = ym => (R.months[ym] = R.months[ym] || { inc: 0, got: 0 });
    data.people.forEach(p => {
      const l = byL[p.lesson_id];
      if (!l || l.is_event || l.day < o.from || l.day > o.to || !p.student_id || !want(p.student_id)) return;
      const sid = String(p.student_id);
      const S = R.per[sid] = R.per[sid] || { inc: 0, n: 0, skip: 0, move: 0, makeup: 0, lost: 0 };
      const b = P().billOf(p, l, ps), pr = P().rateOn(rates[p.student_id], l.day, l.format);
      if (p.status === 'done') {
        S.n++;
        if (!doneL[l.id]) { doneL[l.id] = 1; (doneByDay[l.day] = doneByDay[l.day] || []).push(l); R.dow[weekday(l.day)].n++; }
        // отработка — обычное занятие в другой день; в статистике ученика
        // считаем, сколько их было (решение Даниила 13.11)
        if (p.makeup) { S.makeup++; R.makeups++; }
      }
      if (p.status === 'move') S.move++;
      if (b.pay) {
        if (pr == null) { R.noRate++; return; }
        R.income += pr; S.inc += pr;
        R.dayInc[l.day] = (R.dayInc[l.day] || 0) + pr;
        R.dow[weekday(l.day)].inc += pr;
        mon(ymOf(l.day)).inc += pr;
      } else if (b.plan) {
        if (l.day >= now && pr != null) R.expected += pr;
      } else if (p.status === 'skip') {
        // потеряно — неоплачиваемый пропуск по ставке, которую не получили
        S.skip++; R.skips++;
        if (pr != null) { R.lost += pr; S.lost += pr; }
      }
    });
    if (!o.ids) {
      Object.keys(o.totals || {}).forEach(day => {
        if (day < o.from || day > o.to) return;
        const diff = Number(o.totals[day]) - (R.dayInc[day] || 0);
        R.income += diff; R.dayInc[day] = Number(o.totals[day]); R.manualDays++;
        R.dow[weekday(day)].inc += diff; mon(ymOf(day)).inc += diff;
      });
    }
    Object.keys(doneByDay).forEach(day => { R.hours += P().busyHours(doneByDay[day]); });
    R.lessons = Object.keys(doneL).length;
    R.workDays = Object.keys(doneByDay).length;
    data.payments.forEach(x => {
      if (x.paid_on < o.from || x.paid_on > o.to || !want(x.student_id)) return;
      const a = Number(x.amount) || 0;
      R.got += a; mon(ymOf(x.paid_on)).got += a;
      if (x.student_id) { const S = R.per[x.student_id] = R.per[x.student_id] || { inc: 0, n: 0, skip: 0, move: 0, makeup: 0, lost: 0 }; S.got = (S.got || 0) + a; }
    });
    R.perHour = R.hours ? R.income / R.hours : 0;
    return R;
  }

  /* ── загрузка ── */
  async function load(){
    const tok = ++st.tok;
    st.err = '';
    try {
      const SC = window.ScheduleCloud;
      const [students, data, totals, tpls] = await Promise.all([ctx.students(), P().loadAll(), P().listDayTotals(),
        SC ? SC.listTemplates().catch(() => []) : []]);
      if (tok !== st.tok) return;
      st.students = students || [];
      st.data = data;
      st.totals = totals || [];
      st.tpls = tpls || [];
    } catch (e) {
      if (tok !== st.tok) return;
      st.err = P().missing(e) ? 'Статистике нужны оплаты: выполните файл cabinet-payments.sql в Supabase (SQL Editor).' : (e.message || String(e));
    }
    render();
  }

  /* ── отрисовка ── */
  function delta(cur, prev, money){
    if (!prev && !cur) return '';
    if (!prev) return '<em class="st-d up">было 0</em>';
    const d = Math.round((cur - prev) / Math.abs(prev) * 100);
    return '<em class="st-d ' + (d > 0 ? 'up' : d < 0 ? 'down' : '') + '" title="Прошлый период: ' + esc(money ? P().money(prev) : fmtH(prev)) + '">' + (d > 0 ? '+' : d < 0 ? '−' : '±') + Math.abs(d) + '%</em>';
  }
  function card(id, label, val, sub, cls){
    return '<div class="pay-stat' + (cls ? ' ' + cls : '') + '" id="' + id + '"><span class="label">' + label + '</span><b>' + val + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div>';
  }
  function bars(rows, opt){
    const max = Math.max(1, ...rows.map(r => Math.max(r.v, r.v2 || 0)));
    return '<div class="st-bars">' + rows.map(r =>
      '<div class="st-bar"' + (r.key ? ' data-k="' + esc(r.key) + '"' : '') + '><span class="st-bl">' + esc(r.label) + '</span>' +
        '<span class="st-bt"><i style="width:' + (100 * Math.max(0, r.v) / max).toFixed(1) + '%"></i>' +
          (opt && opt.two ? '<i class="got" style="width:' + (100 * Math.max(0, r.v2 || 0) / max).toFixed(1) + '%"></i>' : '') + '</span>' +
        '<span class="st-bv">' + r.text + '</span></div>').join('') + '</div>';
  }
  function debtNow(ids){
    const per = P().split(st.data, st.students);
    let sum = 0;
    const who = [];
    st.students.forEach(s => {
      if (ids && !ids.has(String(s.id))) return;
      const c = P().calc(Object.assign({}, per[s.id], { settings: settings() }));
      if (c.debt > 0) { sum += c.debt; who.push(s.name); }
    });
    return { sum, who };
  }

  function statsHtml(){
    const g = curGroup();
    if (st.per === 'group' && !g) st.per = 'month';
    const r = range(st.per, st.off), pr = prevRange(st.per, st.off, r);
    const ids = g ? new Set(st.students.filter(s => inGroup(g, s.id)).map(s => String(s.id))) : null;
    const totals = {};
    st.totals.forEach(t => { totals[t.day] = Number(t.amount); });
    const base = { ids, totals, settings: settings() };
    const R = compute(st.data, Object.assign({ from: r.from, to: r.to }, base));
    const Rp = compute(st.data, Object.assign({ from: pr.from, to: pr.to }, base));
    const debt = debtNow(ids);
    const nav = st.per === 'custom'
      ? '<label class="st-cust">с <input class="field" type="date" id="stFrom" value="' + r.from + '"></label><label class="st-cust">по <input class="field" type="date" id="stTo" value="' + r.to + '"></label>'
      : st.per === 'group' ? '<span class="st-lab" id="stLabel">' + esc(r.label) + '</span>'
      : '<button type="button" class="btn quiet small sc-arrow" id="stPrev" aria-label="Раньше">‹</button><span class="st-lab" id="stLabel">' + esc(r.label) + '</span>' +
        '<button type="button" class="btn quiet small sc-arrow" id="stNext" aria-label="Позже"' + (st.off >= 0 ? ' disabled' : '') + '>›</button>' +
        (st.off ? '<button type="button" class="btn quiet small" id="stNow">Сейчас</button>' : '');
    let h = '<div class="st-head"><div class="seg" id="stPer">' + PERIODS.map(p => '<button type="button" data-p="' + p[0] + '" class="' + (st.per === p[0] ? 'on' : '') + '">' + p[1] + '</button>').join('') +
        (g && (g.from || g.to) ? '<button type="button" data-p="group" class="' + (st.per === 'group' ? 'on' : '') + '">Период группы</button>' : '') + '</div>' +
      '<select class="field st-grp" id="stGrp" aria-label="Группа дохода"><option value="">Все ученики</option>' +
        groups().map(x => '<option value="' + esc(x.id) + '"' + (x.id === st.grp ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('') + '</select></div>' +
      '<div class="st-nav">' + nav + '</div>';
    const cmp = 'к периоду ' + P().dm(pr.from) + '—' + P().dm(pr.to);
    h += '<div class="st-cards">' +
      card('stIncome', 'Доход (начислено)', P().money(R.income), delta(R.income, Rp.income, true) + ' ' + cmp +
        (R.expected ? ' · ожидается ещё ' + P().money(R.expected) : '') + (R.manualDays ? ' · ручной итог: ' + P().plural(R.manualDays, 'день', 'дня', 'дней') : '')) +
      card('stGot', 'Получено', P().money(R.got), delta(R.got, Rp.got, true) + ' оплаты за период') +
      card('stDebt', 'Должны сейчас', P().money(debt.sum), esc(debt.who.length ? debt.who.slice(0, 3).join(', ') + (debt.who.length > 3 ? '…' : '') : 'никто'), debt.sum ? 'bad' : '') +
      card('stLessons', 'Занятий', String(R.lessons), delta(R.lessons, Rp.lessons) + ' проведено' + (R.makeups ? ' · отработок ' + R.makeups : '')) +
      card('stHours', 'Часов', fmtH(R.hours), delta(R.hours, Rp.hours) + ' ' + (R.workDays ? 'за ' + P().plural(R.workDays, 'рабочий день', 'рабочих дня', 'рабочих дней') : 'по времени занятий')) +
      card('stHour', 'Стоимость часа', P().money(R.perHour), delta(R.perHour, Rp.perHour, true) + ' доход ÷ часы') +
      card('stLost', 'Потеряно на пропусках', P().money(R.lost), R.skips ? P().plural(R.skips, 'неоплаченный пропуск', 'неоплаченных пропуска', 'неоплаченных пропусков') : 'пропусков нет', R.lost ? 'warn' : '') +
      '</div>';
    if (R.noRate) h += '<div class="hint st-warn">Без ставки: ' + P().plural(R.noRate, 'занятие', 'занятия', 'занятий') + ' не вошли в доход — задайте ставку на вкладке «Оплаты».</div>';
    if (g && st.totals.some(t => t.day >= r.from && t.day <= r.to)) h += '<div class="hint st-warn">Ручные итоги дней в группе не учитываются: их не разделить по ученикам.</div>';

    // по месяцам: у короткого периода — полгода до его конца, иначе один столбик
    const mFrom = P().daysBetween(r.from, r.to) < 60 ? P().addMonths(monStart(r.to), -5) : monStart(r.from);
    const RM = compute(st.data, Object.assign({ from: mFrom, to: monEnd(r.to) }, base));
    const mrows = [];
    for (let m = mFrom; m <= r.to; m = P().addMonths(m, 1)) {
      const x = RM.months[ymOf(m)] || { inc: 0, got: 0 };
      mrows.push({ key: ymOf(m), label: MON_SHORT[Number(m.slice(5, 7)) - 1] + ' ' + m.slice(2, 4), v: x.inc, v2: x.got, text: esc(P().money(x.inc)) + ' <span class="hint">/ ' + esc(P().money(x.got)) + '</span>' });
    }
    h += '<div class="set-group"><h3>По месяцам</h3><div class="hint">Доход (начислено) и получено оплатами: <span class="st-key"></span> доход, <span class="st-key got"></span> получено.</div><div id="stMonths">' + bars(mrows, { two: true }) + '</div></div>';

    const byName = {};
    st.students.forEach(s => { byName[s.id] = s; });
    const srows = Object.keys(R.per).map(sid => ({ sid, s: byName[sid], x: R.per[sid] })).filter(o => o.s && (o.x.inc || o.x.n || o.x.got || o.x.skip))
      .sort((a, b) => b.x.inc - a.x.inc || a.s.name.localeCompare(b.s.name, 'ru'));
    h += '<div class="set-group"><h3>По ученикам</h3>' + (srows.length ? '<div id="stStudents">' + bars(srows.map(o => ({ key: o.sid, label: o.s.name, v: o.x.inc,
      text: esc(P().money(o.x.inc)) + ' <span class="hint">· ' + P().plural(o.x.n, 'занятие', 'занятия', 'занятий') +
        (o.x.makeup ? ' · отработок ' + o.x.makeup : '') + (o.x.skip ? ' · пропусков ' + o.x.skip : '') + (o.x.move ? ' · переносов ' + o.x.move : '') + '</span>' }))) + '</div>'
      : '<div class="hint">За период нет отмеченных занятий.</div>') + '</div>';

    h += '<div class="set-group"><h3>По дням недели</h3><div id="stDow">' + bars(R.dow.map((x, i) => ({ key: String(i), label: DOW[i], v: x.inc,
      text: esc(P().money(x.inc)) + ' <span class="hint">· ' + P().plural(x.n, 'занятие', 'занятия', 'занятий') + '</span>' }))) + '</div></div>';

    h += monthlyHtml(ids, g) + tplHtml() + calcHtml() + groupsHtml();
    return h;
  }

  /* ── «в месяц» ── */
  const activeTpl = () => st.tpls.find(t => t.is_active) || null;
  function monthlyHtml(ids, g){
    const ps = P().paySettings(settings()), per = P().split(st.data, st.students), tpl = activeTpl();
    const rows = st.students.filter(s => !s.archived_at && (!ids || ids.has(String(s.id))))
      .map(s => ({ s, m: P().monthlyOf({ rates: per[s.id].rates, tpl, sid: s.id, mode: ps.monthMode }) }))
      .sort((a, b) => (b.m.sum || 0) - (a.m.sum || 0) || a.s.name.localeCompare(b.s.name, 'ru'));
    const sum = rows.reduce((a, r) => a + (r.m.sum || 0), 0);
    return '<div class="set-group"><h3>В месяц</h3>' +
      '<div class="hint">Сколько ученики приносят в обычный месяц. Способ — для всех; ручную сумму ученику можно вписать на вкладке «Оплаты» в его ставке — она важнее.</div>' +
      '<div class="seg" id="stMonthMode"><button type="button" data-v="x4" class="' + (ps.monthMode === 'x4' ? 'on' : '') + '">×4 недели</button>' +
        '<button type="button" data-v="tpl" class="' + (ps.monthMode === 'tpl' ? 'on' : '') + '">По шаблону недели</button></div>' +
      (ps.monthMode === 'tpl' && !tpl ? '<div class="hint st-warn">Активного шаблона недели нет — заведите его в «Расписании».</div>' : '') +
      '<div class="st-month" id="stMonthly">' + rows.map(r =>
        '<div class="st-mrow" data-sid="' + esc(r.s.id) + '"><a href="#/payments/' + esc(r.s.id) + '">' + esc(r.s.name) + '</a><b>' + (r.m.sum == null ? '—' : esc(P().money(r.m.sum))) + '</b><span class="hint">' + esc(r.m.text) + '</span></div>').join('') +
      '</div><div class="st-mtot" id="stMonthTotal">Итого' + (g ? ' по группе «' + esc(g.name) + '»' : '') + ': <b>' + esc(P().money(sum)) + '</b> в месяц</div></div>';
  }

  /* ── шаблон недели: часы и стоимость часа (как «Статистика шаблона» старого) ── */
  function tplStats(t){
    const per = P().split(st.data, st.students), now = P().today();
    let hours = 0, inc = 0, n = 0, noRate = 0;
    const kids = new Set();
    for (let wd = 1; wd <= 7; wd++) {
      const slots = t.slots.filter(s => s.weekday === wd && !s.is_event && (s.people || []).length);
      hours += P().busyHours(slots);
      slots.forEach(s => {
        n++;
        s.people.forEach(p => {
          if (!p.student_id) return;
          kids.add(String(p.student_id));
          const pr = per[p.student_id] ? P().rateOn(per[p.student_id].rates, now, s.format) : null;
          if (pr == null) noRate++; else inc += pr;
        });
      });
    }
    return { hours, inc, n, kids: kids.size, noRate, perHour: hours ? inc / hours : 0 };
  }
  function tplHtml(){
    if (!st.tpls.length) return '';
    const t = st.tpls.find(x => x.id === st.tplId) || activeTpl() || st.tpls[0];
    const T = tplStats(t);
    return '<details class="set-group st-fold" id="stTpl"' + (st.tplOpen ? ' open' : '') + '><summary><b>Шаблон недели</b> <span class="hint">' + esc(fmtH(T.hours)) + ' ч · ' + esc(P().money(T.perHour)) + ' за час</span></summary>' +
      (st.tpls.length > 1 ? '<select class="field st-grp" id="stTplSel" aria-label="Шаблон">' + st.tpls.map(x => '<option value="' + esc(x.id) + '"' + (x === t ? ' selected' : '') + '>' + esc(x.name) + (x.is_active ? ' (активный)' : '') + '</option>').join('') + '</select>' : '') +
      '<div class="st-cards" id="stTplCards">' +
        card('stTplHours', 'Часов в неделю', fmtH(T.hours), T.hours ? 'по времени занятий · ' + P().plural(T.n, 'занятие', 'занятия', 'занятий') : 'пока пусто') +
        card('stTplHour', 'Средняя стоимость часа', P().money(T.perHour), T.hours ? 'доход за неделю ' + P().money(T.inc) : 'нет занятых часов') +
        card('stTplMonth', 'В месяц по шаблону', P().money(T.inc * 4), 'неделя × 4 · ' + P().plural(T.kids, 'ученик', 'ученика', 'учеников')) +
      '</div>' + (T.noRate ? '<div class="hint st-warn">Без ставки: ' + T.noRate + ' — не вошли в доход.</div>' : '') + '</details>';
  }

  /* ── калькулятор сценариев (из «Сценариев» старого приложения, без
     построения выдуманного расписания: только расчёт) ── */
  const PRESETS = [
    { t: 'Студент на подработке', p: { inc: 50000, price: 1000, per: 1, grp: 1, days: 5, skip: 0 } },
    { t: 'Начинающий репетитор', p: { inc: 100000, price: 1500, per: 2, grp: 1, days: 6, skip: 0 } },
    { t: 'Крепкий середняк', p: { inc: 150000, price: 2000, per: 2, grp: 1, days: 6, skip: 0 } },
    { t: 'Нестабильные ученики', p: { inc: 150000, price: 1500, per: 2, grp: 1, days: 6, skip: 15 } },
    { t: 'Подготовка к ЕГЭ', p: { inc: 250000, price: 3000, per: 2, grp: 1, days: 6, skip: 0 } },
    { t: '250 тысяч в мини-группах', p: { inc: 250000, price: 1000, per: 2, grp: 4, days: 5, skip: 0 } },
    { t: 'Дорогой эксперт', p: { inc: 300000, price: 5000, per: 1.5, grp: 1, days: 5, skip: 0 } },
  ];
  let SC = Object.assign({}, PRESETS[2].p);
  // Доход — как «в месяц» ×4: цена × занятий в неделю × 4. Одно занятие —
  // один час. Пропуски — доля неоплаченных занятий (прогул по умолчанию
  // не оплачивается): чтобы выйти на доход, учеников нужно больше
  function scPlan(p){
    const keep = 1 - Math.min(90, Math.max(0, p.skip)) / 100;
    const N = Math.max(1, Math.ceil(p.inc / (p.price * p.per * 4 * keep)));
    const units = Math.ceil(N / p.grp), lessons = Math.round(units * p.per * 10) / 10;
    const gross = N * p.price * p.per * 4;
    return { N, units, lessons, perDay: lessons / Math.max(1, p.days), month: Math.round(gross * keep), lost: Math.round(gross * (1 - keep)), perHour: lessons ? Math.round(gross * keep / (lessons * 4)) : 0 };
  }
  function scSumHtml(){
    const p = SC, pl = scPlan(p), m = P().money;
    let h = '<div>Нужно <b>' + pl.N + '</b> ' + P().plural(pl.N, 'ученик', 'ученика', 'учеников').replace(/^\d+\s/, '') + (p.grp > 1 ? ' — это ' + P().plural(pl.units, 'группа', 'группы', 'групп') : '') + '</div>' +
      '<div><b>' + fmtH(pl.lessons) + '</b> ' + (pl.lessons % 1 ? 'занятия' : P().plural(pl.lessons, 'занятие', 'занятия', 'занятий').replace(/^\d+\s/, '')) + ' в неделю — ≈ <b>' + fmtH(pl.perDay) + '</b> ч в рабочий день</div>' +
      '<div>Доход ≈ <b>' + m(pl.month) + '</b> в месяц · <b>' + m(pl.perHour) + '</b> за час работы</div>' +
      (pl.lost ? '<div>На пропусках теряется ≈ <b>' + m(pl.lost) + '</b> в месяц</div>' : '');
    if (pl.lessons > 40) h += '<div class="st-calc-warn">Больше 40 часов в неделю чистого времени занятий — без подготовки и переписки. Это перегруз.</div>';
    else if (pl.lessons <= 15) h += '<div class="st-calc-ok">Свободного времени много — можно брать ещё учеников или поднять цену.</div>';
    return h + '<div class="hint">Цена × занятий в неделю × 4. Одно занятие — один час.</div>';
  }
  function calcHtml(){
    const f = (k, label, min, max, step) => '<label><span class="label">' + label + '</span><input class="field" type="number" data-sc="' + k + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + SC[k] + '"></label>';
    return '<details class="set-group st-fold" id="stCalc"' + (st.calcOpen ? ' open' : '') + '><summary><b>Калькулятор сценариев</b> <span class="hint">сколько нужно учеников на желаемый доход</span></summary>' +
      '<div class="row-btns st-presets">' + PRESETS.map((x, i) => '<button type="button" class="btn quiet small" data-preset="' + i + '">' + esc(x.t) + '</button>').join('') +
        '<button type="button" class="btn quiet small" id="stMine" title="Средняя ставка и число занятий в неделю — из ваших учеников и активного шаблона">Мои цифры</button></div>' +
      '<div class="pay-fgrid">' + f('inc', 'Доход в месяц, ₽', 10000, 2000000, 10000) + f('price', 'Цена занятия, ₽', 100, 20000, 100) +
        f('per', 'Занятий в неделю с учеником', 0.5, 7, 0.5) + f('grp', 'Учеников на занятии', 1, 12, 1) + f('days', 'Рабочих дней в неделю', 1, 7, 1) + f('skip', 'Пропусков без оплаты, %', 0, 90, 5) + '</div>' +
      '<div class="st-calc" id="stCalcSum">' + scSumHtml() + '</div></details>';
  }
  // «Мои цифры»: средняя ставка учеников, занятий в неделю на ученика и
  // рабочих дней — из активного шаблона, доход — сумма «в месяц»
  function mine(){
    const per = P().split(st.data, st.students), ps = P().paySettings(settings()), tpl = activeTpl(), now = P().today();
    const act = st.students.filter(s => !s.archived_at);
    const prices = act.map(s => P().rateOn(per[s.id].rates, now, 'single')).filter(x => x != null);
    if (prices.length) SC.price = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length / 100) * 100;
    const inc = act.reduce((a, s) => a + (P().monthlyOf({ rates: per[s.id].rates, tpl, sid: s.id, mode: ps.monthMode }).sum || 0), 0);
    if (inc) SC.inc = Math.round(inc / 1000) * 1000;
    if (tpl) {
      const T = tplStats(tpl), days = new Set(tpl.slots.filter(s => !s.is_event && (s.people || []).length).map(s => s.weekday));
      if (T.kids) SC.per = Math.max(0.5, Math.round(T.n / T.kids * 2) / 2);
      if (days.size) SC.days = days.size;
      SC.grp = 1;
    }
  }

  /* ── группы дохода (фильтр статистики; как в старом приложении, но
     состав — ссылками на учеников, а не именами) ── */
  function groupsHtml(){
    const gs = groups(), act = st.students.filter(s => !s.archived_at).sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    const y = Number(P().today().slice(0, 4)) - (Number(P().today().slice(5, 7)) >= 8 ? 0 : 1);
    return '<details class="set-group st-fold" id="stGroups"' + (st.grpOpen ? ' open' : '') + '><summary><b>Группы дохода</b> <span class="hint">' + (gs.length ? esc(gs.map(g => g.name).join(', ')) : 'учебный год, ОГЭ, летние…') + '</span></summary>' +
      '<div class="hint">Группа — фильтр статистики и «в месяц». «Все новые ученики» — ученик попадает в группу сам, лишних можно снять.</div>' +
      gs.map(g => '<div class="st-gbox" data-gid="' + esc(g.id) + '"><div class="pay-fgrid">' +
          '<label><span class="label">Название</span><input class="field" data-gf="name" maxlength="40" value="' + esc(g.name) + '"></label>' +
          '<label><span class="label">С (необязательно)</span><input class="field" type="date" data-gf="from" value="' + esc(g.from || '') + '"></label>' +
          '<label><span class="label">По (необязательно)</span><input class="field" type="date" data-gf="to" value="' + esc(g.to || '') + '"></label></div>' +
        '<label class="chk"><input type="checkbox" data-gf="auto"' + (g.auto ? ' checked' : '') + '> Все новые ученики попадают сами</label>' +
        '<div class="st-gmem">' + act.map(s => '<label class="chk"><input type="checkbox" data-gm="' + esc(s.id) + '"' + (inGroup(g, s.id) ? ' checked' : '') + '> ' + esc(s.name) + '</label>').join('') + '</div>' +
        '<div class="row-btns"><button type="button" class="btn quiet small danger" data-gdel>Удалить группу</button></div></div>').join('') +
      '<div class="row-btns" style="margin-top:8px">' + (gs.some(g => /учебн/i.test(g.name)) ? '' : '<button type="button" class="btn quiet small" id="stAddYear" data-y="' + y + '">+ Учебный год</button>') +
        '<button type="button" class="btn quiet small" id="stAddGrp">+ группа</button></div></details>';
  }
  function saveGroups(list){ return ctx.save({ incomeGroups: list }); }
  function patchGroup(id, fn){ saveGroups(groups().map(g => (g.id === id ? fn(Object.assign({}, g, { members: g.members.slice(), out: g.out.slice() })) : g))); }

  function bind(){
    const q = s => host.querySelector(s);
    host.querySelectorAll('#stPer button').forEach(b => b.addEventListener('click', () => { st.per = b.dataset.p; st.off = 0; render(); }));
    if (q('#stPrev')) q('#stPrev').addEventListener('click', () => { st.off--; render(); });
    if (q('#stNext')) q('#stNext').addEventListener('click', () => { st.off = Math.min(0, st.off + 1); render(); });
    if (q('#stNow')) q('#stNow').addEventListener('click', () => { st.off = 0; render(); });
    ['stFrom', 'stTo'].forEach(id => { const i = q('#' + id); if (i) i.addEventListener('change', () => { if (i.value) { st[id === 'stFrom' ? 'from' : 'to'] = i.value; render(); } }); });
    q('#stGrp').addEventListener('change', e => { st.grp = e.target.value; if (!st.grp && st.per === 'group') st.per = 'month'; render(); });
    host.querySelectorAll('#stMonthMode button').forEach(b => b.addEventListener('click', () => {
      ctx.save({ pay: Object.assign({}, P().paySettings(settings()), { monthMode: b.dataset.v }) });
      render();
    }));
    const ts = q('#stTplSel');
    if (ts) ts.addEventListener('change', () => { st.tplId = ts.value; render(); });
    // свёрнутые блоки помнят, открыты ли: перерисовка их не закрывает
    [['stTpl', 'tplOpen'], ['stCalc', 'calcOpen'], ['stGroups', 'grpOpen']].forEach(([id, k]) => { const d = q('#' + id); if (d) d.addEventListener('toggle', () => { st[k] = d.open; }); });
    const calc = q('#stCalc');
    if (calc) {
      calc.addEventListener('input', e => {
        const k = e.target.dataset.sc;
        if (!k) return;
        const v = Number(e.target.value);
        if (v > 0 || (k === 'skip' && v >= 0)) { SC[k] = v; q('#stCalcSum').innerHTML = scSumHtml(); }
      });
      calc.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.preset) SC = Object.assign({}, PRESETS[Number(b.dataset.preset)].p);
        else if (b.id === 'stMine') mine();
        else return;
        render();
      });
    }
    const gb = q('#stGroups');
    if (gb) {
      gb.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.id === 'stAddYear') { const y = b.dataset.y; saveGroups(groups().concat([{ id: 'g' + Date.now().toString(36), name: 'Учебный год', members: [], out: [], from: y + '-09-01', to: (Number(y) + 1) + '-05-31', auto: true }])); render(); }
        else if (b.id === 'stAddGrp') { saveGroups(groups().concat([{ id: 'g' + Date.now().toString(36), name: 'Новая группа', members: [], out: [], from: null, to: null, auto: false }])); render(); }
        else if (b.hasAttribute('data-gdel')) {
          if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = 'Точно удалить?'; return; }
          const id = b.closest('[data-gid]').dataset.gid;
          if (st.grp === id) st.grp = '';
          saveGroups(groups().filter(g => g.id !== id)); render();
        }
      });
      gb.addEventListener('change', e => {
        const t = e.target, box = t.closest('[data-gid]');
        if (!box) return;
        const id = box.dataset.gid;
        if (t.dataset.gm) {
          const sid = t.dataset.gm, on = t.checked;
          patchGroup(id, g => {
            if (g.auto) g.out = on ? g.out.filter(x => x !== sid) : g.out.concat([sid]);
            else g.members = on ? g.members.concat([sid]) : g.members.filter(x => x !== sid);
            return g;
          });
        } else if (t.dataset.gf === 'auto') {
          // сменили «все новые»: состав на экране сохраняем как есть
          const all = st.students.map(s => String(s.id));
          patchGroup(id, g => { const cur = all.filter(sid => inGroup(g, sid)); g.auto = t.checked; g.members = t.checked ? [] : cur; g.out = t.checked ? all.filter(sid => cur.indexOf(sid) < 0) : []; return g; });
        } else if (t.dataset.gf) {
          const k = t.dataset.gf, v = t.value.trim();
          patchGroup(id, g => { if (k === 'name') { if (v) g.name = v; } else g[k] = v || null; return g; });
        }
        render();
      });
    }
  }

  function render(){
    if (!host) return;
    if (!st.data && !st.err) { host.innerHTML = '<div class="empty">Загружаем…</div>'; return; }
    if (st.err) { host.innerHTML = '<div class="empty">' + esc(st.err) + ' <button type="button" class="btn quiet small" id="stRetry">Повторить</button></div>'; host.querySelector('#stRetry').addEventListener('click', load); return; }
    // поле с фокусом (название группы, калькулятор) перерисовка не должна выбивать
    const a = document.activeElement, keep = a && host.contains(a) && a.matches('input.field') ? { sel: a.dataset.sc ? '[data-sc="' + a.dataset.sc + '"]' : a.id ? '#' + a.id : null } : null;
    host.innerHTML = statsHtml();
    bind();
    if (keep && keep.sel) { const n = host.querySelector(keep.sel); if (n) n.focus(); }
  }

  function init(opts){ ctx = opts; }
  function show(box){ host = box; render(); return load(); }

  window.CabinetStats = { init, show, compute, range, scPlan, repaint: () => { if (host && host.offsetParent && st.data) render(); }, reload: () => load(), _st: st };
})();
