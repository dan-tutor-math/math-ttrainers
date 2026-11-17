/* ==========================================================
   schedule-insights.js — сводки под неделей и под шаблоном недели
   (old-app-gap.md, пункты 4 и 6; сверка 14.11 со списком функций старого
   приложения расписания).

   Что здесь:
   - «Кто в этой неделе» и «Кто уже в шаблоне»: плашка на каждого
     активного ученика, заливка — сколько раз стоит из нормы «раз в
     неделю», итог «X из Y занятий · не хватает Z». Щелчок — подсветить
     ученика везде, двойной щелчок — вписать в строку, которой касались
     последней (как в старом);
   - всплывашка «ученик за месяц» (проведено, отмены и переносы, ссылка
     на карточку);
   - «Статистика недели» (часы по времени, средняя стоимость часа) и
     окно «Статистика по ученикам» за неделю;
   - «Статистика шаблона» прямо в шаблоне и деньги шаблона в сводке;
   - итог месяца над неделей (только ✓ в прошедших днях, «впереди N ₽») и
     «Пересчитать месяц» — снять ручные итоги дней месяца разом.

   Почему отдельный файл: schedule.js и так большой, а сводки нужны и
   неделе, и шаблону. Данные берём из состояния расписания (ctx от
   schedule.js), считаем теми же Payments.billOf / rateOn / busyHours, что
   и «Статистика» — числа везде должны совпадать.

   Норма «раз в неделю» — per_week из ставки ученика на сегодня. Не
   вписана — у недели нормой служит число занятий ученика в активном
   шаблоне (так же «в месяц» берёт его в payments.js), а у самого шаблона
   нормы нет: шаблон и есть источник, плашка показывает просто «×N».
   ========================================================== */
(function(){
  'use strict';
  let X = null;
  const P = () => window.Payments;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const MON_IN = ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре'];
  const MON_NAME = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const fmtH = h => (Math.round(h * 10) / 10).toLocaleString('ru-RU');
  // «1,5 часа», «2 часа», «5 часов» — как в старом приложении
  const hoursText = h => { const v = Math.round(h * 10) / 10; return v % 1 ? fmtH(v) + ' часа' : P().plural(v, 'час', 'часа', 'часов'); };
  const money = v => P().money(Math.round(v));
  const fold = {};            // раскрыт ли блок: «сеанс помнит», по неделе и шаблону отдельно
  const month = { key: null, lessons: null, totals: null, tok: 0, err: '' };
  let pop = null;             // всплывашка «ученик за месяц»

  function attach(ctx){ X = ctx; }
  const st = () => X.st;
  const today = () => P().today();
  const rates = sid => (st().pay.rates || {})[sid] || [];
  const perWeek = sid => { const r = P().curRateRow(rates(sid), today()); return r && r.per_week != null ? Number(r.per_week) : null; };
  const activeTpl = () => st().tpls.find(t => t.is_active) || null;
  const live = p => p.status === 'plan' || p.status === 'done' || !p.status;

  /* ══ «Кто в этой неделе» / «Кто уже в шаблоне» ══
     items — занятия или слоты; counted(p) — считать ли участие */
  function counts(items, counted){
    const m = new Map();
    items.forEach(l => { if (!l.is_event) l.people.forEach(p => { if (p.student_id && counted(p)) m.set(String(p.student_id), (m.get(String(p.student_id)) || 0) + 1); }); });
    return m;
  }
  function tplCount(sid){
    const t = activeTpl();
    return t ? P().tplLoad(t, sid, rates(sid), today()).n : 0;
  }
  // kind: 'week' | 'tpl'
  // mon — неделя блока (в списке месяца у каждой недели свои сводки); у текущей id прежние, у остальных — с датой
  const sfx = mon => (mon && mon !== st().week ? '_' + mon : '');
  function whoHtml(kind, items, mon){
    const cnt = counts(items, kind === 'week' ? live : () => true);
    const list = X.activeStudents().slice().sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    let need = 0, have = 0, short = 0, total = 0;
    const plates = list.map(s => {
      const sid = String(s.id), n = cnt.get(sid) || 0;
      total += n;
      let norm = perWeek(sid);
      if (norm == null && kind === 'week') norm = tplCount(sid) || 1;
      let cls, tip, label;
      if (norm == null || norm <= 0) {
        cls = n ? 'nonorm' : 'empty'; label = n ? '×' + n : '—';
        tip = n ? 'Стоит ' + P().plural(n, 'раз', 'раза', 'раз') + '. Норма «раз в неделю» не задана — впишите её в таблице учеников' : 'Ещё не добавлен';
      } else {
        need += norm; have += Math.min(n, norm); short += Math.max(0, norm - n);
        const nv = String(norm).replace('.', ',');
        label = n + '/' + nv;
        if (!n) { cls = 'empty'; tip = 'Ещё не добавлен'; }
        else if (n < norm) { cls = 'part'; tip = 'Не хватает ' + P().plural(Math.ceil(norm - n), 'занятия', 'занятий', 'занятий'); }
        else if (n === norm) { cls = 'full'; tip = 'Все занятия на месте'; }
        else { cls = 'over'; tip = 'Поставлен ' + P().plural(n, 'раз', 'раза', 'раз') + ' вместо ' + nv + ' — сверх нормы, +' + String(n - norm).replace('.', ',') + ' к неделе'; }
      }
      const fill = norm ? Math.min(1, n / norm) : (n ? 1 : 0);
      const on = st().hl && String(st().hl) === sid;
      return '<button type="button" class="si-who ' + cls + (on ? ' on' : '') + '" data-who="' + esc(sid) + '" title="' + esc(tip) + '">' +
        '<i style="width:' + (fill * 100).toFixed(0) + '%"></i><span class="nm">' + esc(s.name) + '</span><b>' + esc(label) + '</b></button>';
    }).join('');
    // «3 из 4 занятий»: после «из» — родительный падеж
    const nv = v => String(Math.round(v * 10) / 10).replace('.', ',');
    const ofN = y => nv(y) + ' ' + (y % 10 === 1 && y % 100 !== 11 ? 'занятия' : 'занятий');
    let sum = need ? nv(have) + ' из ' + ofN(need) +
      (short > 0 ? ' · не хватает ' + nv(short) : ' · всё на месте')
      : (total ? P().plural(total, 'занятие', 'занятия', 'занятий') : 'пока никого');
    let extra = '';
    if (kind === 'tpl') {
      const T = tplMoney(items);
      extra = ' · ' + money(T.inc) + ' в неделю · ' + money(T.inc * 4) + ' в месяц';
    }
    const id = (kind === 'week' ? 'scWho' + sfx(mon) : 'tplWho'), fk = kind + ':' + (kind === 'week' ? (mon || st().week) : st().tplId) + ':who';
    const title = kind === 'week' ? 'Кто в этой неделе' : 'Кто уже в шаблоне';
    const hint = 'заливка — сколько раз в неделю поставлен из нужного · щелчок — подсветить, двойной щелчок — вписать в выбранную строку';
    return '<details class="si-box" id="' + id + '" data-fold="' + esc(fk) + '"' + (fold[fk] ? ' open' : '') + '>' +
      '<summary><b>' + title + '</b> <span class="si-sum" id="' + id + 'Sum">' + esc(sum + extra) + '</span></summary>' +
      (list.length ? '<div class="si-who-list">' + plates + '</div><div class="hint">' + esc(hint) + '</div>'
        : '<div class="hint">Учеников пока нет — добавьте их во вкладке «Ученики».</div>') +
      '</details>';
  }

  /* ══ деньги и часы ══ */
  // доход занятий: проведённое и запланированное (как сумма недели в
  // старом), ручной итог дня — вместо расчёта этого дня
  function weekCalc(mon){
    mon = mon || st().week;
    const ps = P().paySettings(X.settings());
    let hours = 0, inc = 0, noRate = 0;
    const per = {};
    for (let i = 0; i < 7; i++) {
      const day = X.addDays(mon, i), ls = X.lessonsOf(day).filter(l => !l.is_event);
      hours += P().busyHours(ls.filter(l => l.people.some(live)));
      let dayInc = 0;
      ls.forEach(l => l.people.forEach(p => {
        if (!p.student_id) return;
        const sid = String(p.student_id);
        const S = per[sid] = per[sid] || { n: 0, off: 0, inc: 0 };
        if (live(p)) S.n++; else S.off++;
        const b = P().billOf(p, l, ps), pr = P().rateOn(rates(sid), day, l.format);
        if (!(b.pay || b.plan)) return;
        if (pr == null) { noRate++; return; }
        dayInc += pr; S.inc += pr;
      }));
      const man = st().totals[day];
      inc += man ? Number(man.amount) : dayInc;
    }
    return { hours, inc, noRate, per, perHour: hours ? inc / hours : 0 };
  }
  function tplMoney(slots){
    let inc = 0, noRate = 0;
    slots.forEach(s => { if (!s.is_event) s.people.forEach(p => {
      if (!p.student_id) return;
      const pr = P().rateOn(rates(p.student_id), today(), s.format);
      if (pr == null) noRate++; else inc += pr;
    }); });
    let hours = 0;
    for (let wd = 1; wd <= 7; wd++) hours += P().busyHours(slots.filter(s => s.weekday === wd && !s.is_event && s.people.length));
    return { inc, noRate, hours, perHour: hours ? inc / hours : 0 };
  }
  const tile = (id, label, val, sub) => '<div class="pay-stat" id="' + id + '"><span class="label">' + label + '</span><b>' + val + '</b><small>' + sub + '</small></div>';
  function weekStatsHtml(mon){
    mon = mon || st().week;
    const W = weekCalc(mon), fk = 'week:' + mon + ':stats', k = sfx(mon);
    const sum = W.hours ? hoursText(W.hours) + ' · ' + money(W.perHour) + ' за час' : 'пока пусто';
    return '<details class="si-box" id="scWeekStats' + k + '" data-fold="' + esc(fk) + '"' + (fold[fk] ? ' open' : '') + '>' +
      '<summary><b>Статистика недели</b> <span class="si-sum">' + esc(sum) + '</span>' +
        '<button type="button" class="btn quiet small si-stu" id="scWeekStu' + k + '" data-wstu="' + mon + '">Статистика по ученикам</button></summary>' +
      '<div class="st-cards si-tiles">' +
        tile('scWkHours' + k, 'Часов в неделю', fmtH(W.hours), W.hours ? 'по времени занятий — пересечения не задваиваются' : 'пока пусто') +
        tile('scWkHour' + k, 'Средняя стоимость часа', money(W.perHour), W.hours ? 'доход за неделю ' + money(W.inc) + ' — проведённое и запланированное' : 'нет занятых часов') +
      '</div>' + (W.noRate ? '<div class="hint st-warn">Без ставки: ' + P().plural(W.noRate, 'занятие', 'занятия', 'занятий') + ' — не вошли в доход.</div>' : '') +
      '</details>';
  }
  function tplStatsHtml(slots){
    const T = tplMoney(slots), fk = 'tpl:' + st().tplId + ':stats';
    const sum = T.hours ? hoursText(T.hours) + ' · ' + money(T.perHour) + ' за час' : 'пока пусто';
    return '<details class="si-box" id="tplStats" data-fold="' + esc(fk) + '"' + (fold[fk] ? ' open' : '') + '>' +
      '<summary><b>Статистика шаблона</b> <span class="si-sum">' + esc(sum) + '</span></summary>' +
      '<div class="st-cards si-tiles">' +
        tile('tplHours', 'Часов в неделю', fmtH(T.hours), T.hours ? 'часов — по времени занятий' : 'пока пусто') +
        tile('tplHour', 'Средняя стоимость часа', money(T.perHour), T.hours ? 'доход за неделю ' + money(T.inc) : 'нет занятых строк') +
        tile('tplMonth', 'В месяц по шаблону', money(T.inc * 4), 'неделя × 4') +
      '</div>' + (T.noRate ? '<div class="hint st-warn">Без ставки: ' + T.noRate + ' — не вошли в доход.</div>' : '') +
      '</details>';
  }

  /* ══ окно «Статистика по ученикам» за неделю ══ */
  function openWeekStudents(mon){
    mon = mon || st().week;
    const W = weekCalc(mon), m = X.modalShell('Статистика по ученикам');
    const byId = {};
    X.st.students.forEach(s => { byId[s.id] = s; });
    const rows = Object.keys(W.per).map(sid => ({ s: byId[sid], x: W.per[sid] })).filter(r => r.s)
      .sort((a, b) => b.x.inc - a.x.inc || a.s.name.localeCompare(b.s.name, 'ru'));
    const tot = rows.reduce((a, r) => ({ n: a.n + r.x.n, off: a.off + r.x.off, inc: a.inc + r.x.inc }), { n: 0, off: 0, inc: 0 });
    m.sheet.innerHTML = '<div class="sc-ed-head"><b>Статистика по ученикам · ' + esc(X.rangeText(mon)) + '</b><button type="button" class="sc-x" aria-label="Закрыть">×</button></div>' +
      (rows.length ? '<table class="si-tab" id="siWeekTab"><thead><tr><th>Ученик</th><th>Занятий</th><th>Отм./перен.</th><th>Доход</th></tr></thead><tbody>' +
        rows.map(r => '<tr data-sid="' + esc(r.s.id) + '"><td><a href="#/students/' + esc(r.s.id) + '">' + esc(r.s.name) + '</a></td><td>' + r.x.n + '</td><td>' + (r.x.off || '—') + '</td><td>' + esc(money(r.x.inc)) + '</td></tr>').join('') +
        '</tbody><tfoot><tr><td>Всего</td><td>' + tot.n + '</td><td>' + (tot.off || '—') + '</td><td>' + esc(money(tot.inc)) + '</td></tr></tfoot></table>' +
        '<div class="hint">Занятия — запланированные и проведённые; доход — по ставкам на дату занятия, без ручных итогов дней.</div>'
        : '<div class="empty">На этой неделе занятий с учениками нет.</div>') +
      '<div class="row-btns sc-ed-foot"><button type="button" class="btn" data-close>Готово</button></div>';
    m.sheet.querySelectorAll('.sc-x, [data-close]').forEach(b => b.addEventListener('click', X.closeModal));
    m.sheet.querySelectorAll('a').forEach(a => a.addEventListener('click', () => X.closeModal()));
  }

  /* ══ месяц: занятия месяца грузим отдельно (неделя — только 7 дней) ══ */
  // месяц недели — тот, на который приходится её четверг (неделя на стыке
  // двух месяцев относится к тому, где у неё больше дней)
  const monthOfWeek = () => X.addDays(st().week, 3).slice(0, 7);
  const monStart = ym => ym + '-01';
  const monEnd = ym => P().addDays(P().addMonths(monStart(ym), 1), -1);
  async function loadMonth(force){
    const ym = monthOfWeek();
    if (!force && month.key === ym && month.lessons) return;
    const tok = ++month.tok;
    month.key = ym; month.err = '';
    try {
      const [ls, tt] = await Promise.all([X.SC.listRange(monStart(ym), monEnd(ym)), P().listDayTotals ? P().listDayTotals(monStart(ym), monEnd(ym)).catch(() => []) : []]);
      if (tok !== month.tok) return;
      month.lessons = ls; month.totals = {};
      (tt || []).forEach(t => { month.totals[t.day] = Number(t.amount); });
      // ставки тех, кто был в месяце, но не в списке активных (архивные)
      const miss = [];
      ls.forEach(l => l.people.forEach(p => { if (p.student_id && !(p.student_id in (st().pay.rates || {}))) miss.push(p.student_id); }));
      if (miss.length && P().weekInfo) { try { const extra = await P().weekInfo(miss); Object.assign(st().pay.rates, extra.rates); } catch (e) {} }
    } catch (e) {
      if (tok !== month.tok) return;
      month.lessons = null; month.err = e.message || String(e);
    }
    paintMonth();
  }
  // правило старого приложения: прошедшие дни и сегодня — ручной итог или
  // только ✓; будущие — ✓, если уже отмечены, остальное — «впереди»
  // дни открытой недели берём из живого состояния расписания: отметка ✓
  // сразу меняет итог месяца, без новой загрузки
  function monthLessons(){
    const a = st().win.from, b = st().win.to, ym = month.key;
    return month.lessons.filter(l => l.day < a || l.day > b).concat(st().lessons.filter(l => l.day.slice(0, 7) === ym));
  }
  function monthTotals(){
    const a = st().win.from, b = st().win.to, out = {};
    Object.keys(month.totals).forEach(d => { if (d < a || d > b) out[d] = month.totals[d]; });
    Object.keys(st().totals || {}).forEach(d => { if (d.slice(0, 7) === month.key) out[d] = Number(st().totals[d].amount); });
    return out;
  }
  function monthCalc(){
    const ps = P().paySettings(X.settings()), now = today(), byDay = {}, totals = monthTotals();
    monthLessons().forEach(l => { if (!l.is_event) (byDay[l.day] = byDay[l.day] || []).push(l); });
    let inc = 0, ahead = 0, n = 0, hours = 0, manual = 0;
    const days = new Set(Object.keys(byDay).concat(Object.keys(totals)));
    days.forEach(day => {
      const ls = byDay[day] || [];
      let done = 0, plan = 0;
      ls.forEach(l => l.people.forEach(p => {
        if (!p.student_id) return;
        const b = P().billOf(p, l, ps), pr = P().rateOn(rates(p.student_id), day, l.format);
        if (b.pay && pr != null) done += pr;
        else if (b.plan && pr != null) plan += pr;
      }));
      if (day <= now) {
        if (day in totals) { inc += totals[day]; manual++; } else inc += done;
        const dl = ls.filter(l => l.people.some(p => p.status === 'done'));
        dl.forEach(l => { n += l.people.filter(p => p.status === 'done').length; });
        hours += P().busyHours(dl);
      } else { inc += done; ahead += plan; }
    });
    return { inc, ahead, n, hours, manual };
  }
  function monthHtml(){ return '<div class="si-month" id="scMonth">' + monthInner() + '</div>'; }
  function monthInner(){
    const ym = monthOfWeek(), mi = Number(ym.slice(5)) - 1;
    if (month.key !== ym || (!month.lessons && !month.err)) return '<span class="hint">' + MON_NAME[mi] + ' · считаем…</span>';
    if (month.err) return '<span class="hint">Итог месяца не загрузился: ' + esc(month.err) + '</span>';
    const M = monthCalc();
    return '<span class="si-mtot" title="Только занятия, отмеченные ✓ «проведено», и ручные итоги дней. Будущие запланированные — в «впереди»">' +
        '<span class="label">' + MON_NAME[mi] + ' ' + ym.slice(0, 4) + '</span> <b id="scMonthSum">' + esc(money(M.inc)) + '</b></span>' +
      '<span class="hint" id="scMonthSub">за ' + MON_NAME[mi].toLowerCase() + ' · ' + P().plural(M.n, 'занятие', 'занятия', 'занятий') + ' · ' + hoursText(M.hours) +
        (M.ahead ? ' · впереди ' + money(M.ahead) : '') + '</span>' +
      '<button type="button" class="btn quiet small" id="scRecalc" title="Убрать ручные итоги дней за месяц и считать доход по ставкам учеников">Пересчитать месяц</button>';
  }
  function paintMonth(){
    const el = document.getElementById('scMonth');
    if (el) { el.innerHTML = monthInner(); bindMonth(el); }
  }
  function bindMonth(el){
    const b = el.querySelector('#scRecalc');
    if (!b) return;
    b.addEventListener('click', async () => {
      const ym = monthOfWeek(), mi = Number(ym.slice(5)) - 1;
      const days = month.lessons ? Object.keys(monthTotals()) : [];
      if (!days.length) { X.api().toast('В ' + MON_IN[mi] + ' все итоги и так считаются автоматически'); return; }
      const ok = await X.askSheet('Пересчитать месяц', 'Убрать ' + P().plural(days.length, 'ручной итог', 'ручных итога', 'ручных итогов') + ' за ' + MON_NAME[mi].toLowerCase() + ' и считать доход по ставкам учеников?',
        [{ value: '', label: 'Отмена', cls: 'quiet' }, { value: 'go', label: 'Пересчитать', cls: 'danger' }]);
      if (ok !== 'go') return;
      try {
        for (const d of days) await P().setDayTotal(d, null);
        days.forEach(d => { delete st().totals[d]; });
        X.api().toast('Ручные итоги сняты: ' + days.length);
      } catch (e) { X.api().toast('Не сохранилось: ' + e.message); }
      await loadMonth(true);
      X.render();
    });
  }

  /* ══ всплывашка «ученик за месяц» ══ */
  function closePop(){
    if (!pop) return;
    document.removeEventListener('pointerdown', pop.onDown, true);
    document.removeEventListener('keydown', pop.onKey);
    pop.el.remove();
    pop = null;
  }
  async function openPop(sid, anchor){
    if (pop && pop.sid === sid) { closePop(); return; }
    closePop();
    const s = X.st.students.find(x => String(x.id) === String(sid));
    if (!s) return;
    const el = document.createElement('div');
    el.className = 'si-pop';
    el.setAttribute('role', 'dialog');
    document.body.appendChild(el);
    const onDown = e => { if (!el.contains(e.target) && !e.target.closest('[data-who]')) closePop(); };
    const onKey = e => { if (e.key === 'Escape') closePop(); };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey);
    pop = { el, sid: String(sid), onDown, onKey };
    const paint = () => {
      if (!pop || pop.el !== el) return;
      const ym = monthOfWeek(), mi = Number(ym.slice(5)) - 1;
      let body;
      if (month.key !== ym || !month.lessons) body = month.err ? '<div class="hint">' + esc(month.err) + '</div>' : '<div class="hint">Считаем…</div>';
      else {
        let done = 0, off = 0;
        monthLessons().forEach(l => { if (!l.is_event) l.people.forEach(p => {
          if (String(p.student_id) !== String(sid)) return;
          if (p.status === 'done') done++; else if (p.status === 'skip' || p.status === 'move') off++;
        }); });
        body = '<div class="si-pbig" id="siPopN">' + done + '</div><div class="hint">' + (done === 1 ? 'занятие' : done >= 2 && done <= 4 ? 'занятия' : 'занятий') + ' в ' + MON_IN[mi] + '</div>' +
          (off ? '<div class="hint" id="siPopOff">' + P().plural(off, 'отмена/перенос', 'отмены/переноса', 'отмен/переносов') + ' — не в счёт</div>' : '');
      }
      el.innerHTML = '<div class="si-phead"><a href="#/students/' + esc(s.id) + '" title="Открыть карточку ученика">' + esc(s.name) + '</a>' +
        '<button type="button" class="sc-x" aria-label="Закрыть">×</button></div>' + body;
      el.querySelector('.sc-x').addEventListener('click', closePop);
      el.querySelector('a').addEventListener('click', () => closePop());
      const r = anchor.getBoundingClientRect(), w = el.offsetWidth || 220;
      el.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left)) + window.scrollX + 'px';
      el.style.top = r.bottom + 6 + window.scrollY + 'px';
    };
    paint();
    pop.paint = paint;
    await loadMonth();
    if (pop && pop.el === el) paint();
  }

  /* ══ привязка ══
     host — блок недели или шаблона; o = { insert(sid) } — вписать ученика */
  function bind(root, o){
    root.querySelectorAll('details.si-box').forEach(d => d.addEventListener('toggle', () => { fold[d.dataset.fold] = d.open; }));
    root.querySelectorAll('[data-wstu]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); openWeekStudents(b.dataset.wstu); }));
    let timer = null;
    root.querySelectorAll('[data-who]').forEach(b => {
      b.addEventListener('click', () => {
        // двойной щелчок не должен дважды мигать подсветкой и всплывашкой:
        // одиночный ждёт, не придёт ли второй
        clearTimeout(timer);
        timer = setTimeout(() => {
          const sid = b.dataset.who;
          X.st.hl = String(X.st.hl) === sid ? null : sid;
          X.render();
          if (o.kind === 'week' && X.st.hl) {
            const nb = document.querySelector('[data-who="' + sid + '"]');
            if (nb) openPop(sid, nb);
          } else closePop();
        }, 220);
      });
      b.addEventListener('dblclick', e => { e.preventDefault(); clearTimeout(timer); o.insert(b.dataset.who); });
    });
    const mon = root.querySelector('#scMonth');
    if (mon) bindMonth(mon);
  }
  function weekBlocksHtml(mon){
    mon = mon || st().week;
    const items = X.st.lessons.filter(l => l.day >= mon && l.day <= X.addDays(mon, 6));
    return '<div class="si-blocks"' + (sfx(mon) ? '' : ' id="scBlocks"') + '>' + whoHtml('week', items, mon) + weekStatsHtml(mon) + '</div>';
  }
  function tplBlocksHtml(slots){ return '<div class="si-blocks" id="tplBlocks">' + whoHtml('tpl', slots) + tplStatsHtml(slots) + '</div>'; }
  // неделя сменилась или занятия переписали — месяц пересчитать
  function weekLoaded(){ if (monthOfWeek() !== month.key) { month.lessons = null; month.err = ''; } loadMonth(true); if (pop && pop.paint) pop.paint(); }

  window.ScheduleInsights = { attach, whoHtml, weekBlocksHtml, tplBlocksHtml, weekStatsHtml, monthHtml, bind, loadMonth, weekLoaded, weekCalc, tplMoney, monthCalc, closePop, openWeekStudents,
    _month: month };
})();
