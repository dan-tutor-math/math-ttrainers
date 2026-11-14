/* ==========================================================
   cabinet-payments.js — вкладка «Оплаты» кабинета и настройки оплат
   (задача В4(а); экраны — payments-audit.md, раздел 3 «Экраны»).

   Список — по ученикам, а не по оплатам: остаток абонемента полосой,
   долг, напоминание «осталось мало» (только преподавателю, здесь же),
   «+ оплата» с подстановкой прошлой. Ученик — #/payments/<id>: способ
   оплаты, ставка с даты, абонементы, выписка «почему столько».

   Всё считает Payments.calc (payments.js) из занятий и оплат; здесь только
   показ и формы. Интерфейс не громоздкий: лишнее — в «Ещё», значения по
   умолчанию разумные (сегодня, прошлая сумма, сгорание по числу занятий).
   ========================================================== */
(function(){
  'use strict';
  const P = () => window.Payments;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const MONTHS_IN = ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре'];
  let ctx = null, host = null;
  const st = { data: null, per: null, sid: null, err: '', formFor: null, tok: 0, rateOpen: false, showAll: false, tpls: [], monOpen: false };

  const settings = () => (ctx && ctx.settings && ctx.settings()) || {};
  function calcFor(sid){
    const d = st.per && st.per[sid];
    return d ? P().calc(Object.assign({}, d, { settings: settings() })) : null;
  }
  function packText(k){
    if (!k) return '';
    let t = 'осталось ' + k.left + ' из ' + k.cap;
    if (k.pay.burn === 'date') t += ' · до ' + P().dm(k.end);
    else if (k.until) t += ' · до ' + P().dm(k.until);
    return t;
  }

  async function load(){
    const tok = ++st.tok;
    st.err = '';
    try {
      const SC = window.ScheduleCloud;
      // шаблоны — для «в месяц» по шаблону (В4б); без них страница работает
      const [students, data, tpls] = await Promise.all([ctx.students(), P().loadAll(), SC ? SC.listTemplates().catch(() => []) : []]);
      if (tok !== st.tok) return;
      st.tpls = tpls || [];
      st.students = students || [];
      st.data = data;
      st.per = P().split(data, st.students);
    } catch (e) {
      if (tok !== st.tok) return;
      st.err = P().missing(e) ? 'Оплаты ещё не включены: выполните файл cabinet-payments.sql в Supabase (SQL Editor).' : (e.message || String(e));
    }
    render();
  }

  /* ── список по ученикам ── */
  function listHtml(){
    const now = P().today(), mon = now.slice(0, 7);
    const rows = st.students.filter(s => st.showAll || !s.archived_at).map(s => ({ s, c: calcFor(s.id) }));
    const got = st.data.payments.filter(p => String(p.paid_on).slice(0, 7) === mon).reduce((a, p) => a + Number(p.amount || 0), 0);
    const debtors = rows.filter(r => r.c.debt > 0), soon = rows.filter(r => r.c.remind && !r.s.archived_at);
    const debtSum = debtors.reduce((a, r) => a + r.c.debt, 0);
    rows.sort((a, b) => (b.c.debt > 0) - (a.c.debt > 0) || (!!b.c.remind) - (!!a.c.remind) || !!a.s.archived_at - !!b.s.archived_at || a.s.name.localeCompare(b.s.name, 'ru'));
    const names = list => list.slice(0, 3).map(r => r.s.name).join(', ') + (list.length > 3 ? '…' : '');
    let h = '<div class="pay-top">' +
      '<div class="pay-stat' + (debtSum ? ' bad' : '') + '" id="payDebt"><span class="label">Должны</span><b>' + P().money(debtSum) + '</b><small>' + esc(debtors.length ? names(debtors) : 'никто') + '</small></div>' +
      '<div class="pay-stat' + (soon.length ? ' warn' : '') + '" id="paySoon"><span class="label">Скоро кончится</span><b>' + soon.length + '</b><small>' + esc(soon.length ? names(soon) : 'нет') + '</small></div>' +
      '<div class="pay-stat" id="payGot"><span class="label">Получено в ' + MONTHS_IN[Number(mon.slice(5)) - 1] + '</span><b>' + P().money(got) + '</b></div>' +
      '</div>' +
      '<div class="list-tools"><span>Учеников: ' + rows.length + '</span><label class="chk" style="margin:0"><input type="checkbox" id="payAll"' + (st.showAll ? ' checked' : '') + '> Показать архив</label></div>' +
      '<div class="pay-list">';
    h += rows.length ? rows.map(r => rowHtml(r.s, r.c)).join('') : '<div class="empty">Учеников пока нет — добавьте на вкладке «Ученики».</div>';
    return h + '</div>';
  }
  function rowHtml(s, c){
    const k = c.current;
    let mid;
    if (c.mode === 'pack') {
      mid = k ? '<span class="pay-bar" title="' + esc(packText(k)) + '"><i style="width:' + Math.round(100 * k.left / Math.max(1, k.cap)) + '%"></i></span><span class="pay-left">' + esc(packText(k)) + (c.queued.length ? ' · ещё ' + c.queued.length + ' в очереди' : '') + '</span>'
        : '<span class="pay-left hint">' + (c.packs.length ? 'абонемент закончился' : 'абонемента нет') + '</span>';
    } else {
      mid = '<span class="pay-left">за занятие' + (c.rate != null ? ' · ' + P().money(c.rate) : ' · ставка не задана') + '</span>';
    }
    return '<div class="pay-row' + (c.debt > 0 ? ' debt' : '') + (c.remind ? ' remind' : '') + (s.archived_at ? ' arch' : '') + '" data-sid="' + esc(s.id) + '">' +
      '<a class="nm" href="#/payments/' + esc(s.id) + '">' + esc(s.name) + '</a>' +
      '<span class="pay-mid">' + mid + '</span>' +
      (c.debt > 0 ? '<span class="pay-debt">долг ' + P().money(c.debt) + '</span>' : c.balance > 0 ? '<span class="pay-adv">аванс ' + P().money(c.balance) + '</span>' : '') +
      (c.remind && !s.archived_at ? '<span class="pay-remind" title="Напоминание видно только вам">' + esc(c.remind) + '</span>' : '') +
      '<button type="button" class="btn small pay-add" data-add="' + esc(s.id) + '">+ оплата</button>' +
      '</div>' + (st.formFor === String(s.id) ? '<div class="pay-formbox">' + formHtml(s, c) + '</div>' : '');
  }

  /* ── форма оплаты: подставляет прошлую ── */
  function formHtml(s, c){
    const last = c.last, now = P().today();
    const kind = last ? last.kind : (c.mode === 'lesson' ? 'single' : 'pack');
    const lessons = last && last.kind === 'pack' ? last.lessons : 8;
    const burn = last && last.kind === 'pack' ? last.burn : 'count';
    const amount = last ? Number(last.amount) : (c.rate != null ? c.rate * (kind === 'pack' ? lessons : 1) : '');
    // по сроку: тот же срок, что у прошлого абонемента, иначе месяц
    let end = P().addMonths(now, 1);
    if (last && last.kind === 'pack' && last.burn === 'date' && last.end_on) end = P().addDays(now, P().daysBetween(last.start_on || last.paid_on, last.end_on));
    return '<form class="pay-form" data-sid="' + esc(s.id) + '">' +
      '<div class="pay-fgrid">' +
        '<label><span class="label">Дата оплаты</span><input class="field" type="date" name="paid_on" value="' + now + '" required></label>' +
        '<label><span class="label">Сумма, ₽</span><input class="field" type="number" name="amount" min="0" step="1" value="' + esc(amount) + '" required></label>' +
      '</div>' +
      '<div class="seg pay-kind" role="group" aria-label="Вид оплаты">' +
        '<button type="button" data-kind="pack" class="' + (kind === 'pack' ? 'on' : '') + '">Абонемент</button>' +
        '<button type="button" data-kind="single" class="' + (kind === 'single' ? 'on' : '') + '">Разовая</button></div>' +
      '<input type="hidden" name="kind" value="' + kind + '">' +
      '<div class="pay-packf"' + (kind === 'pack' ? '' : ' hidden') + '>' +
        '<div class="pay-fgrid"><label><span class="label">Занятий</span><input class="field" type="number" name="lessons" min="1" max="500" value="' + esc(lessons) + '"></label></div>' +
        '<div class="seg pay-burn" role="group" aria-label="Когда сгорает">' +
          '<button type="button" data-burn="count" class="' + (burn !== 'date' ? 'on' : '') + '">Сгорает по числу занятий</button>' +
          '<button type="button" data-burn="date" class="' + (burn === 'date' ? 'on' : '') + '">По сроку</button></div>' +
        '<input type="hidden" name="burn" value="' + (burn === 'date' ? 'date' : 'count') + '">' +
        '<div class="hint pay-burnhint">Можно и так, и так. По числу занятий — абонемент действует, пока не пройдут все занятия. По сроку — до даты конца, неиспользованные занятия сгорают.</div>' +
        '<label class="pay-endf"' + (burn === 'date' ? '' : ' hidden') + '><span class="label">Действует до</span><input class="field" type="date" name="end_on" value="' + end + '"></label>' +
      '</div>' +
      '<div class="hint pay-singlehint"' + (kind === 'single' ? '' : ' hidden') + '>Разовая — деньги в счёт занятий по ставке; учитывается отдельно от абонементов.</div>' +
      '<details class="pay-more"><summary>Ещё</summary><div class="pay-fgrid">' +
        '<label class="pay-startf"><span class="label">Начало абонемента</span><input class="field" type="date" name="start_on"><span class="hint">Пусто — с дня оплаты (а если прошлый не кончился — после него)</span></label>' +
        '<label><span class="label">Кто платил</span><input class="field" name="payer" maxlength="80" value="' + esc(last && last.payer || '') + '" placeholder="мама, папа…"></label>' +
        '<label><span class="label">Заметка</span><input class="field" name="note" maxlength="300"></label>' +
      '</div></details>' +
      '<div class="row-btns"><button class="btn" type="submit">Сохранить оплату</button><button type="button" class="btn quiet" data-cancel>Отмена</button><span class="form-msg"></span></div>' +
    '</form>';
  }
  function bindForm(f){
    const set = (n, v) => { f.querySelector('[name="' + n + '"]').value = v; };
    f.querySelectorAll('.pay-kind button').forEach(b => b.addEventListener('click', () => {
      set('kind', b.dataset.kind);
      f.querySelectorAll('.pay-kind button').forEach(x => x.classList.toggle('on', x === b));
      f.querySelector('.pay-packf').hidden = b.dataset.kind !== 'pack';
      f.querySelector('.pay-singlehint').hidden = b.dataset.kind !== 'single';
    }));
    f.querySelectorAll('.pay-burn button').forEach(b => b.addEventListener('click', () => {
      set('burn', b.dataset.burn);
      f.querySelectorAll('.pay-burn button').forEach(x => x.classList.toggle('on', x === b));
      f.querySelector('.pay-endf').hidden = b.dataset.burn !== 'date';
    }));
    f.querySelector('[data-cancel]').addEventListener('click', () => { st.formFor = null; render(); });
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const v = n => (f.querySelector('[name="' + n + '"]') || {}).value;
      const msg = f.querySelector('.form-msg');
      const kind = v('kind'), burn = v('burn');
      const rec = { student_id: f.dataset.sid, kind, paid_on: v('paid_on'), amount: v('amount'), payer: v('payer'), note: v('note'), start_on: v('start_on') || null };
      if (!rec.paid_on) { msg.textContent = 'Укажите дату'; return; }
      if (!(Number(rec.amount) >= 0) || v('amount') === '') { msg.textContent = 'Укажите сумму'; return; }
      if (kind === 'pack') {
        rec.lessons = v('lessons'); rec.burn = burn;
        if (!(Number(rec.lessons) >= 1)) { msg.textContent = 'Сколько занятий в абонементе?'; return; }
        if (burn === 'date') {
          rec.end_on = v('end_on');
          if (!rec.end_on) { msg.textContent = 'Укажите, до какого дня действует'; return; }
          // по сроку начало нужно явно: иначе окно «с дня оплаты»
          if (!rec.start_on) rec.start_on = rec.paid_on;
          if (rec.end_on < rec.start_on) { msg.textContent = 'Конец раньше начала'; return; }
        }
      } else rec.start_on = null;
      const btn = f.querySelector('[type=submit]');
      btn.disabled = true; msg.textContent = 'Сохраняем…';
      try {
        await P().addPayment(rec);
        st.formFor = null;
        ctx.toast('Оплата сохранена');
        await load();
      } catch (er) { msg.textContent = er.message; btn.disabled = false; }
    });
  }

  /* ── ученик: способ оплаты, ставка, абонементы, выписка ── */
  function studentHtml(s, c){
    const d = st.per[s.id];
    const rates = d.rates.slice().sort((a, b) => (a.valid_from < b.valid_from ? 1 : -1));
    const curRate = rates.find(r => r.valid_from <= P().today()) || null;
    let h = '<div class="card-head"><a class="btn quiet small" href="#/payments">← Оплаты</a><h2>' + esc(s.name) + '</h2>' +
      '<a class="btn quiet small" href="#/students/' + esc(s.id) + '">Карточка ученика</a></div>';
    h += '<div class="pay-sum">' +
      (c.mode === 'pack' ? '<span class="pay-chip">' + (c.current ? 'Абонемент: ' + esc(packText(c.current)) : c.packs.length ? 'Абонемент закончился' : 'Абонемента нет') + '</span>' : '<span class="pay-chip">Платит за каждое занятие</span>') +
      (c.debt > 0 ? '<span class="pay-chip bad" id="psDebt">Долг ' + P().money(c.debt) + (c.debtLessons ? ' · ' + P().plural(c.debtLessons, 'занятие', 'занятия', 'занятий') + ' без оплаты' : '') + '</span>'
        : c.balance > 0 ? '<span class="pay-chip good">Аванс ' + P().money(c.balance) + '</span>' : '<span class="pay-chip good" id="psDebt">Долга нет</span>') +
      (c.noRate ? '<span class="pay-chip warn">Ставка не задана — ' + P().plural(c.noRate, 'занятие', 'занятия', 'занятий') + ' без цены</span>' : '') +
      (c.remind ? '<span class="pay-chip warn" title="Напоминание видно только вам">' + esc(c.remind) + '</span>' : '') +
      '</div>';
    h += '<div class="set-group"><h3>Как платит</h3><div class="seg" id="psMode">' +
      '<button type="button" data-mode="pack" class="' + (c.mode === 'pack' ? 'on' : '') + '">Абонементом</button>' +
      '<button type="button" data-mode="lesson" class="' + (c.mode === 'lesson' ? 'on' : '') + '">За каждое занятие</button></div>' +
      '<div class="hint">За каждое занятие — в расписании у занятия появится кнопка «оплатил».</div></div>';
    h += '<div class="set-group"><h3>Ставка</h3><div id="psRate">' +
      (curRate ? '<b>' + P().money(curRate.price) + '</b> за занятие' + (curRate.group_price != null ? ' · в паре и группе ' + P().money(curRate.group_price) : '') + ' <span class="hint">с ' + P().dmy(curRate.valid_from) + '</span>'
        : '<span class="hint">Не задана — без неё долг по разовым занятиям не посчитать.</span>') +
      ' <button type="button" class="btn quiet small" id="psRateBtn">' + (curRate ? 'Изменить' : 'Задать') + '</button></div>' +
      (st.rateOpen ? '<form class="pay-ratef" id="psRateForm"><div class="pay-fgrid">' +
        '<label><span class="label">С даты</span><input class="field" type="date" name="valid_from" value="' + P().today() + '" required></label>' +
        '<label><span class="label">Цена занятия, ₽</span><input class="field" type="number" min="0" name="price" value="' + esc(curRate ? Number(curRate.price) : '') + '" required></label>' +
        '<label><span class="label">В паре и группе, ₽ (необязательно)</span><input class="field" type="number" min="0" name="group_price" value="' + esc(curRate && curRate.group_price != null ? Number(curRate.group_price) : '') + '"></label>' +
        '</div><div class="hint">Прошлые занятия считаются по прежней ставке. Чтобы пересчитать прошлое — поставьте дату раньше.</div>' +
        '<div class="row-btns"><button class="btn" type="submit">Сохранить ставку</button><button type="button" class="btn quiet" data-cancel>Отмена</button><span class="form-msg"></span></div></form>' : '') +
      (rates.length > 1 ? '<div class="pay-rates">' + rates.map(r => '<div class="pay-rate">с ' + P().dmy(r.valid_from) + ' — ' + P().money(r.price) + (r.group_price != null ? ' / ' + P().money(r.group_price) : '') +
        ' <button type="button" class="sc-rm" data-delrate="' + esc(r.id) + '" title="Удалить ставку" aria-label="Удалить ставку">×</button></div>').join('') + '</div>' : '') +
      monthHtml(d, curRate) +
      '</div>';
    h += '<div class="row-btns" style="margin-bottom:10px"><button type="button" class="btn pay-add" data-add="' + esc(s.id) + '">+ оплата</button></div>' +
      (st.formFor === String(s.id) ? '<div class="pay-formbox">' + formHtml(s, c) + '</div>' : '');
    if (c.packs.length) {
      h += '<div class="set-group"><h3>Абонементы</h3><div class="pay-packs">' + c.packs.slice().reverse().map(k => {
        const state = k.expired ? (k.burned ? 'срок кончился, сгорело ' + k.burned : 'срок кончился') : k.left <= 0 ? 'использован' : k === c.current ? 'действует' : 'в очереди';
        return '<div class="pay-pack' + (k.closed ? ' closed' : '') + '" data-pid="' + esc(k.pay.id) + '">' +
          '<div><b>от ' + P().dmy(k.pay.paid_on) + '</b> · ' + P().plural(k.cap, 'занятие', 'занятия', 'занятий') + ' · ' + P().money(k.pay.amount) +
            ' · ' + (k.pay.burn === 'date' ? 'по сроку до ' + P().dm(k.end) : 'по числу занятий') + '</div>' +
          '<div class="hint">прошло ' + Math.min(k.used, k.cap) + (k.pay.adjust ? ' (с правкой ' + (k.pay.adjust > 0 ? '+' : '') + k.pay.adjust + ')' : '') + ' · ' + esc(k.closed ? state : packText(k) + ' · ' + state) + '</div>' +
          '<div class="row-btns"><button type="button" class="btn quiet small" data-adj="' + esc(k.pay.id) + '">Поправить остаток</button>' +
            '<button type="button" class="btn quiet small danger" data-del="' + esc(k.pay.id) + '">Удалить</button></div>' +
          '<form class="pay-adjf" data-adjf="' + esc(k.pay.id) + '" hidden><input class="field" type="number" name="adj" min="-500" max="500" value="' + (k.pay.adjust || 0) + '" style="width:90px" aria-label="Правка прошло">' +
            '<input class="field" name="why" maxlength="200" placeholder="причина: занятие в долг перенесли…" value="' + esc(k.pay.note || '') + '"><button class="btn small" type="submit">Сохранить</button>' +
            '<span class="hint">+1 — списать ещё одно занятие, −1 — вернуть</span></form>' +
          '</div>';
      }).join('') + '</div></div>';
    }
    const singles = d.payments.filter(p => p.kind === 'single').sort((a, b) => (a.paid_on < b.paid_on ? 1 : -1));
    if (singles.length) {
      h += '<div class="set-group"><h3>Разовые оплаты</h3><div class="pay-packs">' + singles.map(p =>
        '<div class="pay-pack" data-pid="' + esc(p.id) + '"><div><b>' + P().dmy(p.paid_on) + '</b> · ' + P().money(p.amount) + ' · ' + (p.lesson_student_id ? 'за занятие' : 'в счёт занятий') + (p.payer ? ' · ' + esc(p.payer) : '') + '</div>' +
        '<div class="row-btns"><button type="button" class="btn quiet small danger" data-del="' + esc(p.id) + '">Удалить</button></div></div>').join('') + '</div></div>';
    }
    h += '<div class="set-group"><h3>Почему столько</h3><div class="hint">Оплаты и занятия одной лентой, новые сверху: что списано, что бесплатно и почему.</div>' +
      (c.lines.length ? '<div class="pay-lines" id="psLines">' + c.lines.slice().reverse().map(ln =>
        '<div class="pay-line ' + ln.cls + '"><span class="pay-ld">' + P().dm(ln.day) + '</span><span class="pay-ls">' + esc(ln.sign) + '</span><span class="pay-lt">' + esc(ln.text) + '</span><span class="pay-lr">' + esc(ln.right || '') + '</span></div>').join('') + '</div>'
        : '<div class="hint" style="margin-top:6px">Пока ни оплат, ни отмеченных занятий.</div>') + '</div>';
    return h;
  }
  /* ── «в месяц» (В4б): способ — в «Статистике», здесь ученику — сколько
     занятий в неделю и своя сумма. Оба поля живут в строке ставки,
     действующей сегодня (student_rates.per_week, monthly) ── */
  function monthHtml(d, curRate){
    if (!curRate) return '';
    const ps = P().paySettings(settings());
    const m = P().monthlyOf({ rates: d.rates, tpl: (st.tpls || []).find(t => t.is_active) || null, sid: d.student.id, mode: ps.monthMode });
    return '<div class="pay-month" id="psMonth">В месяц: <b>' + (m.sum == null ? '—' : P().money(m.sum)) + '</b> <span class="hint">' + esc(m.text) + '</span>' +
      ' <button type="button" class="btn quiet small" id="psMonBtn">Изменить</button></div>' +
      (st.monOpen ? '<form class="pay-ratef" id="psMonForm"><div class="pay-fgrid">' +
        '<label><span class="label">Занятий в неделю (для ×4)</span><input class="field" type="number" min="0" max="30" step="0.5" name="per_week" value="' + esc(curRate.per_week != null ? Number(curRate.per_week) : '') + '" placeholder="по шаблону"></label>' +
        '<label><span class="label">Своя сумма в месяц, ₽</span><input class="field" type="number" min="0" name="monthly" value="' + esc(curRate.monthly != null ? Number(curRate.monthly) : '') + '" placeholder="считать само"></label>' +
        '</div><div class="hint">Своя сумма важнее расчёта — для тех, кто платит фиксированно. Пусто — считается: ×4 недели или по шаблону недели (способ — во вкладке «Статистика»).</div>' +
        '<div class="row-btns"><button class="btn" type="submit">Сохранить</button><button type="button" class="btn quiet" data-cancel>Отмена</button><span class="form-msg"></span></div></form>' : '');
  }
  function bindStudent(s){
    const q = sel => host.querySelector(sel);
    host.querySelectorAll('#psMode button').forEach(b => b.addEventListener('click', async () => {
      try { await P().setMode(s.id, b.dataset.mode); await load(); }
      catch (e) { ctx.toast('Не сохранилось: ' + e.message); }
    }));
    q('#psRateBtn').addEventListener('click', () => { st.rateOpen = !st.rateOpen; render(); });
    if (q('#psMonBtn')) q('#psMonBtn').addEventListener('click', () => { st.monOpen = !st.monOpen; render(); });
    const mf = q('#psMonForm');
    if (mf) {
      mf.querySelector('[data-cancel]').addEventListener('click', () => { st.monOpen = false; render(); });
      mf.addEventListener('submit', async e => {
        e.preventDefault();
        const rate = P().curRateRow(st.per[s.id].rates, P().today());
        const v = n => mf.querySelector('[name="' + n + '"]').value;
        try { await P().setRateExtra(rate.id, { per_week: v('per_week'), monthly: v('monthly') }); st.monOpen = false; ctx.toast('Сохранено'); await load(); }
        catch (er) { mf.querySelector('.form-msg').textContent = er.message; }
      });
    }
    const rf = q('#psRateForm');
    if (rf) {
      rf.querySelector('[data-cancel]').addEventListener('click', () => { st.rateOpen = false; render(); });
      rf.addEventListener('submit', async e => {
        e.preventDefault();
        const v = n => rf.querySelector('[name="' + n + '"]').value;
        if (!v('valid_from') || v('price') === '') { rf.querySelector('.form-msg').textContent = 'Дата и цена'; return; }
        try { await P().setRate(s.id, { valid_from: v('valid_from'), price: v('price'), group_price: v('group_price') }, st.per[s.id].rates); st.rateOpen = false; ctx.toast('Ставка сохранена'); await load(); }
        catch (er) { rf.querySelector('.form-msg').textContent = er.message; }
      });
    }
    host.querySelectorAll('[data-delrate]').forEach(b => b.addEventListener('click', async () => {
      try { await P().deleteRate(b.dataset.delrate); await load(); } catch (e) { ctx.toast('Не удалилось: ' + e.message); }
    }));
    host.querySelectorAll('[data-adj]').forEach(b => b.addEventListener('click', () => {
      const f = host.querySelector('[data-adjf="' + b.dataset.adj + '"]');
      f.hidden = !f.hidden;
    }));
    host.querySelectorAll('[data-adjf]').forEach(f => f.addEventListener('submit', async e => {
      e.preventDefault();
      try { await P().updatePayment(f.dataset.adjf, { adjust: f.querySelector('[name=adj]').value, note: f.querySelector('[name=why]').value }); ctx.toast('Остаток поправлен'); await load(); }
      catch (er) { ctx.toast('Не сохранилось: ' + er.message); }
    }));
    host.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      // второе нажатие — подтверждение: оплату жалко потерять
      if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = 'Точно удалить?'; return; }
      b.disabled = true;
      try { await P().deletePayment(b.dataset.del); ctx.toast('Оплата удалена'); await load(); }
      catch (e) { ctx.toast('Не удалилось: ' + e.message); b.disabled = false; }
    }));
  }

  function render(){
    if (!host) return;
    if (!st.data && !st.err) { host.innerHTML = '<div class="empty">Загружаем…</div>'; return; }
    if (st.err) { host.innerHTML = '<div class="empty">' + esc(st.err) + ' <button type="button" class="btn quiet small" id="payRetry">Повторить</button></div>'; host.querySelector('#payRetry').addEventListener('click', load); return; }
    const s = st.sid && st.students.find(x => String(x.id) === st.sid);
    if (st.sid && !s) { host.innerHTML = '<div class="empty">Ученик не найден. <a href="#/payments">← Оплаты</a></div>'; return; }
    host.innerHTML = s ? studentHtml(s, calcFor(s.id)) : listHtml();
    host.querySelectorAll('.pay-add').forEach(b => b.addEventListener('click', () => {
      st.formFor = st.formFor === b.dataset.add ? null : b.dataset.add;
      render();
      const f = host.querySelector('.pay-form');
      if (f) { const a = f.querySelector('[name=amount]'); a.focus(); a.select(); }
    }));
    const all = host.querySelector('#payAll');
    if (all) all.addEventListener('change', () => { st.showAll = all.checked; render(); });
    host.querySelectorAll('.pay-form').forEach(bindForm);
    if (s) bindStudent(s);
  }

  function init(opts){ ctx = opts; }
  function show(box, sid){
    host = box;
    const nsid = sid ? String(sid) : null;
    if (nsid !== st.sid) { st.formFor = null; st.rateOpen = false; st.monOpen = false; }
    st.sid = nsid;
    render();
    return load();
  }

  /* ══ настройки оплат (вкладка «Настройки») ══ */
  function settingsHtml(){
    const ps = P().paySettings(settings());
    const tpls = P().FLAG_TEMPLATES.filter(t => !ps.flags.some(f => f.id === t.id || f.name === t.name));
    return '<h3>Оплаты</h3>' +
      '<div class="hint">Прогул по умолчанию — как перенос: не оплачивается. На занятии это можно сменить.</div>' +
      '<div class="seg" id="psSkip"><button type="button" data-v="free" class="' + (ps.skipRule === 'free' ? 'on' : '') + '">Прогул не оплачивается</button>' +
        '<button type="button" data-v="charge" class="' + (ps.skipRule === 'charge' ? 'on' : '') + '">Прогул оплачивается</button></div>' +
      '<div class="hint" style="margin-top:10px">Занятия вне абонемента (до первой оплаты, после «абонемент истёк») и у ученика без оплат. Как в старом приложении — не долг.</div>' +
      '<div class="seg" id="psOutside"><button type="button" data-v="free" class="' + (ps.outside !== 'debt' ? 'on' : '') + '">Не считать долгом</button>' +
        '<button type="button" data-v="debt" class="' + (ps.outside === 'debt' ? 'on' : '') + '">Считать долгом</button></div>' +
      '<div class="pay-fgrid" style="margin-top:10px">' +
        '<label><span class="label">Причина пропуска по умолчанию</span><input class="field" id="psReason" maxlength="60" list="psReasons" value="' + esc(ps.reason) + '">' +
          '<datalist id="psReasons">' + P().REASONS.map(r => '<option value="' + esc(r) + '">').join('') + '</datalist></label>' +
        '<label><span class="label">Напомнить, когда осталось занятий</span><input class="field" type="number" id="psLeft" min="0" max="20" value="' + ps.remindLeft + '"></label>' +
        '<label><span class="label">…или дней до конца срока</span><input class="field" type="number" id="psDays" min="0" max="60" value="' + ps.remindDays + '"></label>' +
      '</div>' +
      '<div class="label" style="margin-top:12px">Флаги у имени на занятии</div>' +
      '<div class="hint">Свои пометки: видны в скобках у имени в расписании. Флаг «бесплатно» делает занятие бесплатным.</div>' +
      '<div class="pay-flags" id="psFlags">' + ps.flags.map(f =>
        '<div class="pay-flag" data-fid="' + esc(f.id) + '"><input class="field" maxlength="30" value="' + esc(f.name) + '" aria-label="Название флага">' +
        '<label class="chk" style="margin:0"><input type="checkbox"' + (f.free ? ' checked' : '') + '> бесплатно</label>' +
        '<button type="button" class="sc-rm" data-rmflag title="Удалить флаг" aria-label="Удалить флаг">×</button></div>').join('') + '</div>' +
      '<div class="row-btns" style="margin-top:8px">' + tpls.map(t => '<button type="button" class="btn quiet small" data-tpl="' + t.id + '">+ ' + esc(t.name) + '</button>').join('') +
        '<button type="button" class="btn quiet small" id="psNewFlag">+ свой флаг</button></div>';
  }
  function mountSettings(box, save){
    const paint = () => { if (!box.contains(document.activeElement) || document.activeElement === document.body) box.innerHTML = settingsHtml(); };
    const setPay = patch => save({ pay: Object.assign({}, P().paySettings(settings()), patch) });
    const flags = () => P().paySettings(settings()).flags.slice();
    box.innerHTML = settingsHtml();
    box.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.closest('#psSkip')) { setPay({ skipRule: b.dataset.v }); box.innerHTML = settingsHtml(); }
      else if (b.closest('#psOutside')) { setPay({ outside: b.dataset.v }); box.innerHTML = settingsHtml(); }
      else if (b.dataset.tpl) { const t = P().FLAG_TEMPLATES.find(x => x.id === b.dataset.tpl); setPay({ flags: flags().concat([Object.assign({}, t)]) }); box.innerHTML = settingsHtml(); }
      else if (b.id === 'psNewFlag') {
        setPay({ flags: flags().concat([{ id: 'f' + Date.now().toString(36), name: 'новый флаг', free: false }]) });
        box.innerHTML = settingsHtml();
        const inp = box.querySelector('.pay-flag:last-child input.field'); if (inp) { inp.focus(); inp.select(); }
      } else if (b.hasAttribute('data-rmflag')) {
        const id = b.closest('.pay-flag').dataset.fid;
        setPay({ flags: flags().filter(f => f.id !== id) }); box.innerHTML = settingsHtml();
      }
    });
    box.addEventListener('change', e => {
      const t = e.target;
      if (t.id === 'psReason') setPay({ reason: t.value.trim() });
      else if (t.id === 'psLeft') setPay({ remindLeft: Number(t.value) });
      else if (t.id === 'psDays') setPay({ remindDays: Number(t.value) });
      else if (t.closest('.pay-flag')) {
        const row = t.closest('.pay-flag'), id = row.dataset.fid;
        const name = row.querySelector('input.field').value.trim(), free = row.querySelector('input[type=checkbox]').checked;
        setPay({ flags: flags().map(f => f.id === id ? { id, name: name || f.name, free } : f) });
      }
    });
    return paint;
  }

  window.CabinetPayments = { init, show, reload: () => load(), repaint: () => { if (host && host.offsetParent) render(); }, mountSettings, _st: st };
})();
