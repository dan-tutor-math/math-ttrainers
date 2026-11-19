/* ==========================================================
   cabinet-payments.js — вкладка «Оплаты» кабинета и настройки оплат
   (задача В4(а); экраны — payments-audit.md, раздел 3 «Экраны»).

   Абонементы и разовые оплаты в отдельных списках, архив под ними.
   Срок абонемента показываем по реальному расписанию и шаблону.
   Ученик — #/payments/<id>: способ оплаты, ставка и сворачиваемая выписка.

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
  const st = { data: null, per: null, sid: null, err: '', formFor: null, tok: 0, rateOpen: false, filter: 'pack', tpls: [], monOpen: false, open: new Set(), filledWeeks: new Set() };
  const filters = { pack: 'Абонементы', lesson: 'Разовые' };
  const pendingPayments = new Set();

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
      st.filledWeeks = new Set(data.lessons.map(l => weekStart(l.day)));
    } catch (e) {
      if (tok !== st.tok) return;
      st.err = P().missing(e) ? 'Оплаты ещё не включены: выполните файл cabinet-payments.sql в Supabase (SQL Editor).' : (e.message || String(e));
    }
    render();
  }

  function visibleOptions(){
    try {
      const saved = JSON.parse(localStorage.getItem('cabinet:payments:view') || '{}');
      return saved && typeof saved==='object' && !Array.isArray(saved) ? saved : {};
    }
    catch (e) { return {}; }
  }
  const view = visibleOptions();
  const tableLabels = ['Ученик','Родитель','Дата оплаты','Действует','Сумма, ₽','Занятий','Прошло','Абонемент'];
  const columns = {
    pack: ['student','payer','paidOn','period','amount','cap','used','status'].map((key,i)=>[key,tableLabels[i]]),
    lesson: [['student',tableLabels[0]],['payer',tableLabels[1]],['paidOn',tableLabels[2]],['amount',tableLabels[4]]],
    archive: [['student',tableLabels[0]],['paidOn',tableLabels[2]],['start','Начало'],['end','Окончание'],['amount',tableLabels[4]]],
  };
  const orderBy = Object.fromEntries(Object.keys(columns).map(scope=>[scope,{key:'paidOn',direction:-1}]));
  const alphabetical = new Intl.Collator('ru',{numeric:true,sensitivity:'base'});
  const calendarStates = { done: 'Проведено', plan: 'Запланировано', template: 'По шаблону', unmarked: 'Не отмечено', over: 'Сверх оплаченного' };

  function sortingHeader(scope){
    const sort = orderBy[scope];
    return '<div class="pay-entry pay-thead" role="row">'+columns[scope].map(([key,label])=>{
      const active = sort.key===key;
      const ariaSort = active ? ' aria-sort="'+(sort.direction===1?'ascending':'descending')+'"' : '';
      return '<div role="columnheader"'+ariaSort+(key==='payer'?' class="pay-payer"':'')+'><button type="button" class="pay-sort"'+
        ' data-pay-sort="'+key+'" data-sort-scope="'+scope+'">'+label+(active?' <span aria-hidden="true">'+
        (sort.direction===1?'↑':'↓')+'</span>':'')+'</button></div>';
    }).join('')+(scope==='archive'?'<div role="columnheader" aria-label="Действия"></div>':'')+'</div>';
  }

  function sortedEntries(entries,scope){
    const compare = (a,b,direction) => {
      if (a == null || a==='') return b == null || b==='' ? 0 : 1;
      if (b == null || b==='') return -1;
      return direction*(typeof a==='number' ? a-b : alphabetical.compare(a,b));
    };
    const {key,direction} = orderBy[scope];
    return entries.sort((a,b)=>compare(a[key],b[key],direction) || compare(a.paidOn,b.paidOn,-1) || compare(a.student,b.student,1));
  }

  const paymentButton = (label, key, id, cls = '') => '<button type="button" class="btn quiet small ' + cls +
    '" data-' + key + '="' + esc(id) + '">' + esc(label) + '</button>';
  const cell = (label, html, cls = '') => '<div role="cell" class="'+cls+'" data-col="'+label+'">'+html+'</div>';
  const paymentCell = (i, html, cls = '') => cell(tableLabels[i], html, cls);
  const paymentInput = (p, key, label, value, attrs = '') => '<input class="field pay-cell-input" aria-label="' + esc(label) +
    '" data-pay-edit="' + key + '" data-pid="' + esc(p.id) + '" value="' + esc(value) + '" ' + attrs + '>';
  const studentLink = s => '<a class="nm" href="#/payments/' + esc(s.id) + '">' + esc(s.name) + '</a>';
  const firstDate = (...dates) => dates.filter(Boolean).sort()[0] || null;
  const weekStart = day => P().addDays(day, -((new Date(day + 'T12:00:00').getDay()+6)%7));
  const recordsFor = sid => st.per[sid]?.payments || [];
  const packEnd = k => firstDate(k.end, k.cut);
  const effectiveUsed = k => Math.max(0, Math.min(k.cap, k.used));

  function recordedPackEnd(k){
    if (k.end) return packEnd(k);
    const lastCovered = k.left <= 0 ? k.items.at(-1)?.day || k.start : null;
    return firstDate(k.cut, lastCovered);
  }

  function fullPeriod(start,end){
    return 'Период с '+P().dmy(start)+(end?' по '+P().dmy(end):' · дата окончания не указана');
  }

  function scheduleMarks(s, k){
    const d = st.per[s.id];
    const now = P().today(), end = packEnd(k);
    const used = new Set(k.items.map(item => item.x.p.id));
    const ps = P().paySettings(settings());
    const linked = new Set(d.payments.filter(p => p.lesson_student_id).map(p => p.lesson_student_id));
    const actual = new Map();
    const put = (day, kind) => {
      if (!actual.has(day)) actual.set(day, []);
      actual.get(day).push(kind);
    };
    (d.parts || []).forEach(({p,l}) => {
      if (l.is_event) return;
      const b = P().billOf(p,l,ps);
      if (used.has(p.id)) put(l.day,'done');
      else if (b.pay && !linked.has(p.id) && l.day >= k.start && (!end || l.day <= end)) put(l.day,'over');
      else if (b.plan && !linked.has(p.id)) put(l.day,l.day < now ? 'unmarked' : 'plan');
    });
    return actual;
  }

  function templateMarks(s){
    const template = st.tpls.find(t => t.is_active);
    const days = Array(7).fill(0);
    (template?.slots || []).forEach(slot => {
      if (!slot.is_event && slot.people?.some(p => String(p.student_id) === String(s.id))) days[slot.weekday-1]++;
    });
    return days;
  }

  function periodPreview(s,k){
    const now = P().today(), marks = scheduleMarks(s,k), template = templateMarks(s);
    const from = now > k.start ? now : k.start;
    const filled = st.filledWeeks;
    const marksOn = day => marks.get(day) || (day >= now && !filled.has(weekStart(day)) ?
      Array(template[(new Date(day+'T12:00:00').getDay()+6)%7]).fill('template') : []);
    let end = recordedPackEnd(k);
    if (!end && (template.some(Boolean) || marks.size)) {
      const lastActual = [...marks.keys()].sort().at(-1);
      const anchor = lastActual && lastActual > from ? lastActual : from;
      const horizon = template.some(Boolean) ? P().addDays(anchor,Math.max(14,k.left*7+7)) : anchor;
      let left = k.left;
      // Недели с записями берём из расписания; шаблон достраивает будущие пустые недели.
      for (let day=from; day<=horizon; day=P().addDays(day,1)){
        left -= marksOn(day).filter(x => x==='plan' || x==='template').length;
        if (left <= 0) { end=day; break; }
      }
    }
    return { end, marksOn };
  }

  function listHtml(){
    const now = P().today(), mon = now.slice(0, 7);
    const rows = st.students.filter(s => !s.archived_at).map(s => ({ s, c: calcFor(s.id) }));
    const kind = st.filter==='pack' ? 'pack' : 'single';
    const got = st.data.payments.filter(p=>p.kind===kind && p.paid_on?.startsWith(mon))
      .reduce((sum,p)=>sum+Number(p.amount||0),0);
    const debtors = rows.filter(r=>r.c.debt>0)
      .sort((a,b)=>b.c.debt-a.c.debt || alphabetical.compare(a.s.name,b.s.name));
    const ps = P().paySettings(settings());
    const reminders = rows.flatMap(({s,c}) => {
      const k = c.active.find(pack=>!pack.pay.archived_at) || c.packs.findLast(pack=>!pack.pay.archived_at);
      if (!k || k.start>now) return [];
      const end = periodPreview(s,k).end;
      return end && ps.remindedPacks?.[k.pay.id] !== end ? [{s,k,end}] : [];
    });
    const soon = reminders.filter(r=>r.end>=now && P().daysBetween(now,r.end)<7).sort((a,b)=>a.end.localeCompare(b.end));
    const visible = rows.filter(({s,c})=>c.mode===st.filter || recordsFor(s.id).some(p=>!p.archived_at && p.kind===kind));
    const header = '<div class="pay-top">' +
      '<div class="pay-stat" id="payGot"><span>Получено в ' + MONTHS_IN[Number(mon.slice(5))-1] + '</span><b>'+P().money(got)+
      '</b><small>'+filters[st.filter]+'</small></div>' + overdueHtml(debtors) +
      '<details class="pay-view" id="payView"'+(st.open.has('payView')?' open':'')+'><summary class="btn quiet small">Вид</summary>' +
      '<div class="pay-view-menu"><label class="chk"><input type="checkbox" data-pay-view="showPayer"'+(view.showPayer!==false?' checked':'')+
      '> Подпись родителя</label><label class="chk"><input type="checkbox" data-pay-view="showRemaining"'+(view.showRemaining?' checked':'')+
      '> Остаток занятий</label><label class="chk"><input type="checkbox" data-pay-view="showOverdue"'+(view.showOverdue?' checked':'')+
      '> Показывать просрочку при нуле</label></div></details></div>';
    const filter = '<div class="seg pay-filters" role="group" aria-label="Виды оплат">'+Object.entries(filters).map(([key,label]) =>
      '<button type="button" data-pay-filter="'+key+'" class="'+(st.filter===key?'on':'')+'" aria-pressed="'+(st.filter===key)+'">'+label+'</button>').join('')+'</div>';
    const remind = '<aside class="pay-reminders" id="paySoon"><div class="pay-remind-head"><h3>Напомнить об оплате</h3><small><b>'+soon.length+
      '</b> на ближайшие 7 дней</small></div>'+soon.map(({s,k,end})=>'<div class="pay-remind-row"><div>'+studentLink(s)+'<div class="hint">'+
      (end===now?'Сегодня':P().dm(end))+'</div></div><button type="button" class="btn quiet small" data-pay-reminded="'+esc(k.pay.id)+
      '" data-due="'+end+'">Напомнил</button></div>').join('')+(soon.length?'':'<div class="hint">Напоминаний нет</div>')+'</aside>';
    const table = '<div role="table" aria-label="'+filters[st.filter]+'" class="pay-ledger '+(st.filter==='pack'?'pack':'single')+
      (view.showPayer===false?' hide-payer':'')+'">'+sortingHeader(st.filter)+
      (visible.length ? ledgerRows(visible) : '<div class="empty">Таких оплат пока нет.</div>')+'</div>';
    return header+'<div class="pay-overview"><div class="pay-main">'+filter+table+'</div>'+remind+'</div>'+
      archiveHtml(new Map(rows.map(({s,c})=>[s.id,c])));
  }

  function overdueHtml(debtors){
    const count = debtors.length;
    const total = debtors.reduce((sum,{c})=>sum+c.debt,0);
    const contents = count ? '<ul>'+debtors.map(({s,c})=>'<li>'+studentLink(s)+'<span>'+P().money(c.debt)+'</span></li>').join('')+
      '</ul>' : '<div class="hint">Просроченных оплат нет</div>';
    return '<details class="pay-overdue" id="payDebt"'+(!view.showOverdue&&!count?' hidden':'')+(st.open.has('payDebt')?' open':'')+
      '><summary class="pay-stat'+(count?' bad':'')+'"><span>Просрочено</span><b>'+count+'</b>'+
      (count?'<small>Долг '+P().money(total)+'</small>':'')+'</summary>'+
      '<div class="pay-overdue-list">'+contents+'</div></details>';
  }

  function packStatus(k,queued){
    if (k.closed) return k.expired||k.left>0 ? 'Истёк' : 'Завершён';
    return queued || k.start>P().today() ? 'В очереди' : 'Действует';
  }

  function controlsHtml(k,state){
    const id = k.pay.id, buttons = [];
    if (k.manualClose && !k.pay.archived_at) buttons.push(paymentButton('Вернуть','pay-resume',id));
    if (k.closed && !k.pay.archived_at) buttons.push(paymentButton('В архив','pay-archive',id));
    if (state==='Действует') buttons.push(paymentButton('Абонемент истёк','pay-expire',id));
    return '<span class="pay-chip '+(k.closed?'warn':'good')+'">'+state+'</span><div class="row-btns">'+buttons.join('')+'</div>';
  }

  function packEntry(row,identity){
    const {k,p,end:expected,status} = row, used = effectiveUsed(k);
    const range = P().dm(k.start)+' – '+(expected?P().dm(expected):'…');
    const adjustment = Number(p.adjust)||0;
    const remaining = view.showRemaining ? '<div class="hint pay-remaining">осталось '+k.left+' из '+k.cap+
      (adjustment?' · вручную '+(adjustment>0?'+':'')+adjustment:'')+'</div>' : '';
    return '<div role="row" class="pay-entry" data-pay-pack="'+esc(p.id)+'">'+
      paymentCell(0,identity,'pay-identity')+
      paymentCell(1,paymentInput(p,'payer','Подпись родителя',p.payer || '','maxlength="80" placeholder="Не указана"'),'pay-payer')+
      paymentCell(2,P().dm(p.paid_on),'pay-paid-on')+
      paymentCell(3,paymentButton(range,'pay-period',p.id,'pay-period-btn'),'pay-range')+
      paymentCell(4,paymentInput(p,'amount','Сумма абонемента, ₽',p.amount,'type="number" min="0" step="0.01" inputmode="decimal"'))+
      paymentCell(5,paymentInput(p,'lessons','Занятий в абонементе',k.cap,'type="number" min="1" max="500" inputmode="numeric"'))+
      paymentCell(6,'<div class="pay-count">'+paymentInput(p,'used','Прошло занятий',Math.max(0,k.used),'type="number" min="0" max="1000" inputmode="numeric"')+
        '<span>/ '+k.cap+'</span></div><div class="pay-bar" role="progressbar" aria-label="Прошло занятий" aria-valuemin="0" aria-valuemax="'+k.cap+
        '" aria-valuenow="'+used+'"><i style="width:'+Math.round(used*100/Math.max(1,k.cap))+'%"></i></div>'+remaining)+
      paymentCell(7,controlsHtml(k,status),'pay-state')+'</div>';
  }

  function sortableReceipt(p,student){
    return {p,student,payer:p.payer,paidOn:p.paid_on,amount:Number(p.amount)};
  }

  function ledgerRows(students){
    const pack = st.filter==='pack';
    const entries = students.flatMap(({s,c})=>{
      const base = {s,c,student:s.name};
      const receipts = pack ? c.packs.filter(k=>!k.pay.archived_at).map(k=>{
        const end = periodPreview(s,k).end;
        return {...base,...sortableReceipt(k.pay,s.name),k,end,period:k.start+' '+(end||''),cap:k.cap,
          used:Math.max(0,k.used),status:packStatus(k,c.queued.includes(k))};
      }) : recordsFor(s.id).filter(p=>p.kind==='single'&&!p.archived_at).map(p=>({...base,...sortableReceipt(p,s.name)}));
      return receipts.length ? receipts : [base];
    });
    const seen = new Set();
    return sortedEntries(entries,st.filter).map(row=>{
      const {s,c,p} = row, first = !seen.has(s.id);
      seen.add(s.id);
      const identity = studentLink(s)+(first ? (c.debt>0?'<small class="pay-debt">долг '+P().money(c.debt)+'</small>':'')+
        paymentButton('+ оплата','add',s.id,'pay-add') : '');
      let html;
      if (!p) html = '<div role="row" class="pay-entry pay-entry-empty">'+paymentCell(0,identity,'pay-identity')+
        cell('',pack?'Абонемента нет':'Разовых оплат нет','hint')+'</div>';
      else if (pack) html = packEntry(row,identity);
      else html = '<div role="row" class="pay-entry">'+paymentCell(0,identity,'pay-identity')+
        paymentCell(1,esc(p.payer||'—'),'pay-payer')+paymentCell(2,P().dmy(p.paid_on))+paymentCell(4,P().money(p.amount))+'</div>';
      return '<div role="presentation" class="pay-row" data-sid="'+esc(s.id)+'">'+html+
        (first&&st.formFor===String(s.id)?'<div role="row"><div role="cell" class="pay-formbox">'+formHtml(s,c)+'</div></div>':'')+'</div>';
    }).join('');
  }

  function archiveHtml(calculated){
    const manualClosures = P().paySettings(settings()).closedPacks;
    const receipts = st.data.payments.filter(p=>p.archived_at).map(p=>{
      const s = st.students.find(x=>x.id===p.student_id);
      if (s && !calculated.has(s.id)) calculated.set(s.id,calcFor(s.id));
      const k = s && calculated.get(s.id)?.packs.find(pack=>pack.pay.id===p.id);
      const start = p.kind==='pack' ? k?.start || p.start_on || p.paid_on : null;
      const end = p.kind==='pack' ? (k ? recordedPackEnd(k) : firstDate(p.end_on,manualClosures?.[p.id])) : null;
      return {...sortableReceipt(p,s?.name || p.guest_name || 'Ученик'),s,start,end};
    });
    const students = st.students.filter(s=>s.archived_at);
    const archiveDate = date => date ? P().dmy(date) : '—';
    const table = receipts.length ? '<div class="pay-ledger pay-archive-ledger" role="table" aria-label="Архив оплат">'+sortingHeader('archive')+
      sortedEntries(receipts,'archive').map(({p,s,student,start,end})=>'<div role="row" class="pay-entry pay-archive-row" data-archived-payment="'+esc(p.id)+'">'+
        paymentCell(0,s?studentLink(s):esc(student),'pay-identity')+paymentCell(2,archiveDate(p.paid_on))+
        cell('Начало',archiveDate(start))+cell('Окончание',archiveDate(end))+paymentCell(4,P().money(p.amount))+
        cell('',paymentButton('Из архива','pay-unarchive',p.id),'pay-archive-action')+'</div>').join('')+'</div>' :
      '<div class="hint pay-archive-row">Оплат в архиве нет</div>';
    return '<details class="pay-archive" id="payArchive"'+(st.open.has('payArchive')?' open':'')+'><summary>Архив оплат <span class="hint">'+receipts.length+
      '</span></summary>'+table+
      (students.length?'<details class="pay-archive-students" id="payArchivedStudents"'+(st.open.has('payArchivedStudents')?' open':'')+'><summary>Архивные ученики <span class="hint">'+
      students.length+'</span></summary>'+students.map(s=>'<div class="pay-archive-row">'+studentLink(s)+'</div>').join('')+'</details>':'')+'</details>';
  }

  function singleChoices(sid, c){
    const d = st.per[sid];
    const linked = new Set(d.payments.map(p => p.lesson_student_id));
    const eligible = new Set(c.lines.filter(line=>line.canMarkPaid).map(line=>line.lsId));
    const ps = P().paySettings(settings());
    const now = P().today();
    return d.parts.filter(({p,l}) => !l.is_event && !linked.has(p.id) &&
      (eligible.has(p.id) || p.status==='plan' && l.day>=now && P().billOf(p,l,ps).plan))
      .map(({p,l}) => ({id:p.id, day:l.day, time:l.start_min, planned:p.status==='plan', price:P().rateOn(d.rates,l.day,l.format)}))
      .sort((a,b) => Number(a.planned)-Number(b.planned) || (a.planned ? a.day.localeCompare(b.day) : b.day.localeCompare(a.day)) || a.time-b.time);
  }

  /* ── форма оплаты: для разовой по уроку дата и ставка берутся из расписания ── */
  function formHtml(s, c){
    const kind = (st.sid ? c.mode : st.filter) === 'lesson' ? 'single' : 'pack';
    const last = recordsFor(s.id).filter(p => p.kind===kind && (kind==='pack' || !p.lesson_student_id))
      .sort((a,b)=>b.paid_on.localeCompare(a.paid_on))[0], now = P().today();
    const lessons = last && last.kind === 'pack' ? last.lessons : 8;
    const burn = last && last.kind === 'pack' ? last.burn : 'count';
    const amount = last ? Number(last.amount) : (c.rate != null ? c.rate * (kind === 'pack' ? lessons : 1) : '');
    // по сроку: тот же срок, что у прошлого абонемента, иначе месяц
    let end = P().addMonths(now, 1);
    if (last && last.kind === 'pack' && last.burn === 'date' && last.end_on) end = P().addDays(now, P().daysBetween(last.start_on || last.paid_on, last.end_on));
    return '<form class="pay-form" data-sid="' + esc(s.id) + '">' +
      '<div class="pay-single-choice"' + (kind==='single'?'':' hidden') + '><div class="label">Занятие</div>' +
        '<button type="button" class="btn quiet small" data-choose-lesson aria-haspopup="menu">Выбрать занятие</button>' +
        '<input type="hidden" name="lesson_student_id"><small class="hint" data-lesson-hint></small></div>' +
      '<div class="pay-fgrid">' +
        '<label><span class="label">Дата оплаты</span><input class="field" type="date" name="paid_on" value="' + now + '" required></label>' +
        '<label><span class="label">Сумма, ₽</span><input class="field" type="number" name="amount" min="0" step="0.01" value="' + esc(amount) + '" required></label>' +
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
      '<details class="pay-more"><summary>Ещё</summary><div class="pay-fgrid">' +
        '<label class="pay-startf"><span class="label">Начало абонемента</span><input class="field" type="date" name="start_on"><span class="hint">Пусто — с дня оплаты (а если прошлый не кончился — после него)</span></label>' +
        '<label'+(view.showPayer===false?' hidden':'')+'><span class="label">Подпись родителя</span><input class="field" name="payer" maxlength="80" value="' + esc(last && last.payer || '') + '" placeholder="мама, папа…"></label>' +
        '<label><span class="label">Заметка</span><input class="field" name="note" maxlength="300"></label>' +
      '</div></details>' +
      '<div class="row-btns"><button class="btn" type="submit">Сохранить оплату</button><button type="button" class="btn quiet" data-cancel>Отмена</button><span class="form-msg"></span></div>' +
    '</form>';
  }
  function bindForm(f){
    const set = (n, v) => { f.querySelector('[name="' + n + '"]').value = v; };
    const choices = singleChoices(f.dataset.sid,calcFor(f.dataset.sid));
    const choose = f.querySelector('[data-choose-lesson]');
    const choiceLabel = lesson => P().dmy(lesson.day)+' · '+(lesson.planned?'по расписанию':'проведено')+
      (lesson.price==null?'':' · '+P().money(lesson.price));
    let packAmount = f.elements.amount.value;
    function selectLesson(lesson){
      set('lesson_student_id',lesson?.id || '');
      set('paid_on',lesson?.day || P().today());
      set('amount',lesson ? (lesson.price ?? '') : (calcFor(f.dataset.sid).rate ?? ''));
      f.elements.paid_on.readOnly = !!lesson;
      choose.textContent = lesson ? choiceLabel(lesson) : 'В счёт занятий · аванс';
      f.querySelector('[data-lesson-hint]').textContent = lesson && lesson.price==null ? 'Ставки на эту дату нет, укажите сумму.' : '';
    }
    choose.addEventListener('click', () => {
      const items = choices.map(lesson=>({label:choiceLabel(lesson), on:f.elements.lesson_student_id.value===lesson.id, act:()=>selectLesson(lesson)}));
      window.ScheduleRows.openMenu(choose,items.concat({label:'В счёт занятий · аванс', on:!f.elements.lesson_student_id.value, act:()=>selectLesson(null)}));
    });
    if (f.elements.kind.value==='single') selectLesson(choices[0]);
    f.querySelectorAll('.pay-kind button').forEach(b => b.addEventListener('click', () => {
      if (f.elements.kind.value===b.dataset.kind) return;
      if (f.elements.kind.value==='pack') packAmount=f.elements.amount.value;
      set('kind', b.dataset.kind);
      f.querySelectorAll('.pay-kind button').forEach(x => x.classList.toggle('on', x === b));
      f.querySelector('.pay-packf').hidden = b.dataset.kind !== 'pack';
      f.querySelector('.pay-startf').hidden = b.dataset.kind !== 'pack';
      f.querySelector('.pay-single-choice').hidden = b.dataset.kind !== 'single';
      if (b.dataset.kind==='single') selectLesson(choices[0]);
      else { selectLesson(null); set('amount',packAmount); }
    }));
    f.querySelector('.pay-startf').hidden = f.elements.kind.value!=='pack';
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
      } else {
        rec.start_on = null;
        const linked = choices.find(lesson=>lesson.id===v('lesson_student_id'));
        if (linked) { rec.lesson_student_id = linked.id; rec.paid_on = linked.day; }
      }
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
    const singleDebtOff = c.mode === 'lesson' && P().paySettings(settings()).trackSingleDebt === false;
    const rates = d.rates.slice().sort((a, b) => (a.valid_from < b.valid_from ? 1 : -1));
    const curRate = rates.find(r => r.valid_from <= P().today()) || null;
    let h = '<div class="card-head"><a class="btn quiet small" href="#/payments">← Оплаты</a><h2>' + esc(s.name) + '</h2>' +
      '<a class="btn quiet small" href="#/students/' + esc(s.id) + '">Карточка ученика</a></div>';
    h += '<div class="pay-sum">' +
      (c.mode === 'pack' ? '<span class="pay-chip">' + (c.current ? 'Абонемент: ' + esc(packText(c.current)) : c.packs.length ? 'Абонемент закончился' : 'Абонемента нет') + '</span>' : '<span class="pay-chip">Платит за каждое занятие</span>') +
      (c.debt > 0 ? '<span class="pay-chip bad" id="psDebt">Долг ' + P().money(c.debt) + (c.debtLessons ? ' · ' + P().plural(c.debtLessons, 'занятие', 'занятия', 'занятий') + ' без оплаты' : '') + '</span>'
        : c.balance > 0 ? '<span class="pay-chip good">Аванс ' + P().money(c.balance) + '</span>' : singleDebtOff ? '' : '<span class="pay-chip good" id="psDebt">Долга нет</span>') +
      (singleDebtOff ? '<span class="pay-chip" id="psDebt">Долги за разовые занятия не учитываются</span>' : '') +
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
        const end = k.pay.archived_at ? recordedPackEnd(k) : periodPreview(s,k).end;
        return '<div class="pay-pack' + (k.closed ? ' closed' : '') + '" data-pid="' + esc(k.pay.id) + '">' +
          '<div><b>от ' + P().dmy(k.pay.paid_on) + '</b> · ' + P().plural(k.cap, 'занятие', 'занятия', 'занятий') + ' · ' + P().money(k.pay.amount) +
            ' · ' + (k.pay.burn === 'date' ? 'по сроку' : 'по числу занятий') + '</div>' +
          '<div class="hint">' + fullPeriod(k.start,end) + '</div>' +
          '<div class="hint">прошло ' + Math.min(k.used, k.cap) + (k.pay.adjust ? ' (с правкой ' + (k.pay.adjust > 0 ? '+' : '') + k.pay.adjust + ')' : '') + ' · ' + esc(k.closed ? state : packText(k) + ' · ' + state) + '</div>' +
          '<div class="row-btns"><button type="button" class="btn quiet small" data-adj="' + esc(k.pay.id) + '">Поправить остаток</button>' +
            '<button type="button" class="btn quiet small danger" data-del="' + esc(k.pay.id) + '">Удалить</button></div>' +
          '<form class="pay-adjf" data-adjf="' + esc(k.pay.id) + '" hidden><input class="field" type="number" name="adj" min="-500" max="500" value="' + (k.pay.adjust || 0) + '" style="width:90px" aria-label="Правка прошло">' +
            '<input class="field" name="why" maxlength="200" placeholder="причина: занятие в долг перенесли…" value="' + esc(k.pay.note || '') + '"><button class="btn small" type="submit">Сохранить</button>' +
            '<span class="hint">+1 — списать ещё одно занятие, −1 — вернуть</span></form>' +
          '</div>';
      }).join('') + '</div></div>';
    }
    const singles = d.payments.filter(p => p.kind === 'single').sort((a, b) => b.paid_on.localeCompare(a.paid_on));
    if (singles.length) {
      h += historySection('paySingleHistory','История разовых оплат',singles.length,'<div class="pay-packs">' + singles.map(p =>
        '<div class="pay-pack" data-pid="' + esc(p.id) + '"><div><b>' + P().dmy(p.paid_on) + '</b> · ' + P().money(p.amount) + ' · ' + (p.lesson_student_id ? 'за занятие' : 'в счёт занятий') + (p.payer ? ' · ' + esc(p.payer) : '') + '</div>' +
        '<div class="row-btns"><button type="button" class="btn quiet small danger" data-del="' + esc(p.id) + '">Удалить</button></div></div>').join('') + '</div>');
    }
    h += statementHtml(d,c,singles);
    return h;
  }
  function historySection(id,title,count,contents){
    return '<details class="pay-history" id="'+id+'"'+(st.open.has(id)?' open':'')+'><summary>'+esc(title)+
      ' <span class="hint">'+count+'</span></summary>'+(contents||'<div class="hint">Записей пока нет</div>')+'</details>';
  }
  function statementLine(ln){
    return '<div class="pay-line '+ln.cls+'"><span class="pay-ld">'+P().dm(ln.day)+'</span><span class="pay-ls">'+esc(ln.sign)+
      '</span><span class="pay-lt">'+esc(ln.text)+'</span><div class="pay-lr">'+esc(ln.right||'')+paymentAction(ln)+'</div></div>';
  }
  function statementHtml(d,c,singles){
    const lines = c.lines.slice().reverse();
    const paid = lines.filter(ln=>ln.history==='paid');
    d.parts.filter(({p})=>p.status==='plan').forEach(({p,l})=>{
      const receipt = singles.find(payment=>payment.lesson_student_id===p.id);
      if (receipt) paid.push({ day:l.day, cls:'les', sign:'○', text:'Запланировано — оплачено за занятие, '+P().money(receipt.amount) });
    });
    paid.sort((a,b)=>b.day.localeCompare(a.day));
    const unpaid = lines.filter(ln=>ln.history==='unpaid');
    const reasons = Array.from(new Set(unpaid.map(ln=>ln.reason)));
    const groups = reasons.map((key,i)=>{
      const entries = unpaid.filter(ln=>ln.reason===key);
      return historySection('payReason'+i,key,entries.length,entries.map(statementLine).join(''));
    }).join('');
    const other = lines.filter(ln=>!ln.history);
    return '<div class="set-group" id="psLines">'+historySection('payPaidHistory','Оплаченные занятия',paid.length,paid.map(statementLine).join(''))+
      historySection('payUnpaidHistory','Неоплаченные занятия',unpaid.length,groups)+
      (other.length?historySection('payOtherHistory','Платежи и правки',other.length,other.map(statementLine).join('')):'')+'</div>';
  }
  function paymentAction(line){
    if (!line.canMarkPaid) return '';
    const day = P().dmy(line.day);
    const amount = line.price == null ? '<input class="field pay-line-amount" type="number" name="amount" min="0.01" step="0.01" placeholder="Сумма, ₽" aria-label="Сумма за занятие ' + day + ', ₽" required>' : '';
    return '<form class="pay-line-action" data-part="' + esc(line.lsId) + '">' + amount +
      '<button class="btn quiet small" type="submit" aria-label="Оплатил за ' + day + (line.price == null ? '' : ', ' + P().money(line.price)) + '"' +
      (pendingPayments.has(line.lsId) ? ' disabled' : '') + '>Оплатил</button></form>';
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
    host.querySelectorAll('.pay-line-action').forEach(f => f.addEventListener('submit', async e => {
      e.preventDefault();
      const id = f.dataset.part;
      if (pendingPayments.has(id)) return;
      const line = calcFor(s.id).lines.find(ln => ln.lsId === id && ln.canMarkPaid);
      if (!line) return;
      const amount = line.price == null ? f.elements.amount.valueAsNumber : line.price;
      pendingPayments.add(id);
      const button = f.querySelector('button');
      button.disabled = true;
      try {
        await P().addPayment({ student_id: s.id, kind: 'single', paid_on: line.day, amount, lesson_student_id: id });
        ctx.toast('Оплата сохранена');
      } catch (err) {
        if (err.raw && err.raw.code === '23505') ctx.toast('Оплата уже отмечена');
        else {
          pendingPayments.delete(id);
          const current = host.querySelector('[data-part="' + CSS.escape(id) + '"] button');
          if (current) current.disabled = false;
          ctx.toast('Не удалось сохранить оплату: ' + err.message);
          return;
        }
      }
      await load();
      pendingPayments.delete(id);
    }));
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

  const dayOf = day => Number(day.slice(8,10));
  const monthOf = day => day.slice(0,7)+'-01';
  const pendingPacks = new Set();

  function packById(id){
    const p = st.data.payments.find(p=>String(p.id)===id && p.kind==='pack');
    if (!p) return null;
    const s = st.students.find(s=>String(s.id)===String(p.student_id));
    const k = s && calcFor(s.id).packs.find(k=>k.pay.id===p.id);
    return k ? {s,k} : null;
  }

  async function runPack(button,id,action,message){
    if (pendingPacks.has(id)) return;
    pendingPacks.add(id);
    button.disabled = true;
    try {
      await action();
      ctx.toast(message);
      await load();
    } catch (e) {
      ctx.toast('Не сохранилось: '+e.message);
      button.disabled = false;
    } finally {
      pendingPacks.delete(id);
    }
  }

  async function savePayMap(key,id,value){
    const previous = P().paySettings(settings())[key]?.[id];
    const update = next => {
      const pay = P().paySettings(settings());
      const map = { ...pay[key] };
      if (next) map[id]=next; else delete map[id];
      return window.TeacherSettings.set({pay:{...pay,[key]:map}});
    };
    try { await update(value); }
    catch (e) {
      // При сетевом сбое откатываем только свою метку: остальные настройки
      // могли измениться, пока запись была в очереди.
      if ((P().paySettings(settings())[key]?.[id] || null)===(value || null)) await update(previous).catch(()=>{});
      throw e;
    }
  }

  function calendarMonthHtml(anchor,draft,preview){
    const date = new Date(anchor+'T12:00:00');
    const title = new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric'}).format(date).replace(/ г\.$/,'');
    const lead = (date.getDay()+6)%7;
    const next = monthOf(P().addMonths(anchor,1));
    const days = P().daysBetween(anchor,next);
    const marks = [];
    for (let i=0;i<days;i++){
      const day = P().addDays(anchor,i);
      const states = [...new Set(preview.marksOn(day))];
      const selected = day>=draft.start && day<=(preview.end||draft.start);
      const edge = day===draft.start || day===preview.end;
      marks.push('<button type="button" data-pay-day="'+day+'" class="pay-day'+(selected?' in-range':'')+(edge?' edge':'')+
        '" aria-label="'+P().dmy(day)+(states.length?', '+esc(states.map(x=>calendarStates[x]).join(', ')):'')+
        '" aria-pressed="'+edge+'">'+dayOf(day)+'<span class="pay-dots">'+states.map(x=>'<i class="pay-dot '+x+'"></i>').join('')+'</span></button>');
    }
    return '<section class="pay-month-grid"><h4>'+esc(title)+'</h4><div class="pay-day-grid">'+
      ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d=>'<small class="hint">'+d+'</small>').join('')+'<span></span>'.repeat(lead)+marks.join('')+'</div></section>';
  }

  function openPeriod(button,{s,k}){
    const id = k.pay.id;
    const dialog = document.createElement('dialog');
    dialog.className='panel pay-period';
    dialog.setAttribute('aria-labelledby','payPeriodTitle');
    dialog.innerHTML='<h3 id="payPeriodTitle">Период абонемента</h3><div class="hint">'+esc(s.name)+' · '+
      P().plural(k.cap,'занятие','занятия','занятий')+'</div><div class="pay-period-tools">'+
      '<div class="seg" role="group" aria-label="Граница периода"><button type="button" data-pay-bound="start" class="on" aria-pressed="true">Начало</button>'+
      '<button type="button" data-pay-bound="end" aria-pressed="false">Конец</button></div>'+
      '<div class="row-btns"><button class="btn quiet small" type="button" data-pay-month="-1" aria-label="Предыдущий месяц">‹</button>'+
      '<button class="btn quiet small" type="button" data-pay-month="1" aria-label="Следующий месяц">›</button></div></div>'+
      '<div class="pay-period-months"></div><div class="pay-calendar-legend">'+Object.entries(calendarStates).map(([key,label])=>
      '<span><i class="pay-dot '+key+'"></i>'+label+'</span>').join('')+'</div><div class="pay-calendar-result" role="status"></div>'+
      '<div class="form-msg" role="alert"></div><div class="pay-period-footer"><button type="button" class="btn quiet small" data-pay-auto>Посчитать само</button>'+
      '<div class="row-btns"><button type="button" class="btn quiet small" data-pay-cancel>Отмена</button>'+
      '<button type="button" class="btn small" data-pay-period-save>Готово</button></div></div>';
    host.appendChild(dialog);
    const draft = { start:k.start, autoStart:!k.pay.start_on, end:k.pay.end_on, anchor:monthOf(k.start), bound:'start' };
    const msg = dialog.querySelector('.form-msg');
    function patch(){
      return { start_on:draft.autoStart?null:draft.start, end_on:draft.end || null, burn:draft.end?'date':'count' };
    }
    function draw(){
      const d = st.per[s.id];
      const next = P().calc({...d,settings:settings(),payments:d.payments.map(p=>p.id===id?{...p,...patch()}:p)}).packs.find(p=>p.pay.id===id);
      const preview = periodPreview(s,next);
      dialog.querySelector('.pay-period-months').innerHTML=calendarMonthHtml(draft.anchor,{...draft,start:next.start},preview)+
        calendarMonthHtml(monthOf(P().addMonths(draft.anchor,1)),{...draft,start:next.start},preview);
      dialog.querySelector('.pay-calendar-result').textContent=P().dm(next.start)+' – '+(preview.end?P().dm(preview.end):'по расписанию')+
        ' · прошло '+Math.max(0,next.used)+' из '+next.cap+(draft.end?' · конец выбран вручную':'');
      dialog.querySelectorAll('[data-pay-bound]').forEach(b => {
        const on=b.dataset.payBound===draft.bound;
        b.classList.toggle('on',on); b.setAttribute('aria-pressed',String(on));
      });
    }
    dialog.addEventListener('close',()=>{dialog.remove(); if (button.isConnected) button.focus();});
    dialog.addEventListener('cancel',e=>{ if (pendingPacks.has(id)) e.preventDefault(); });
    dialog.addEventListener('click',e=>{
      const b=e.target.closest('button');
      if (!b || pendingPacks.has(id)) return;
      const {payMonth,payDay,payBound}=b.dataset;
      if (b.hasAttribute('data-pay-cancel')) { dialog.close(); return; }
      if (b.hasAttribute('data-pay-period-save')){
        void runPack(b,id,async()=>{
          await P().updatePayment(id,patch());
          dialog.close();
        },'Период сохранён');
        return;
      }
      msg.textContent='';
      if (payMonth) draft.anchor=monthOf(P().addMonths(draft.anchor,Number(payMonth)));
      else if (payBound) draft.bound=payBound;
      else if (b.hasAttribute('data-pay-auto')){
        Object.assign(draft,{start:k.pay.paid_on,autoStart:true,end:null,anchor:monthOf(k.pay.paid_on),bound:'start'});
      } else if (payDay && draft.bound==='start'){
        Object.assign(draft,{start:payDay,autoStart:false,end:null});
      } else if (payDay) {
        if (payDay<draft.start){msg.textContent='Конец периода не может быть раньше начала.';return;}
        Object.assign(draft,{end:payDay,autoStart:false});
      } else return;
      draw();
      if (payDay) dialog.querySelector('[data-pay-day="'+payDay+'"]')?.focus();
    });
    draw();
    dialog.showModal();
  }

  function bindOverview(){
    host.querySelectorAll('[data-pay-sort]').forEach(button=>button.addEventListener('click',event=>{
      const {paySort:key,sortScope:scope} = button.dataset;
      const previous = orderBy[scope];
      orderBy[scope] = {key,direction:previous.key===key ? -previous.direction :
        (key==='student'||key==='payer'||key==='status' ? 1 : -1)};
      render();
      if (event.detail===0) host.querySelector('[data-sort-scope="'+scope+'"][data-pay-sort="'+key+'"]')?.focus();
    }));
    host.querySelectorAll('[data-pay-view]').forEach(input=>input.addEventListener('change',()=>{
      view[input.dataset.payView]=input.checked;
      try { localStorage.setItem('cabinet:payments:view',JSON.stringify(view)); } catch (e) {}
      render();
      host.querySelector('#payView summary')?.focus();
    }));
    const actions = ['period','expire','resume','archive','unarchive','reminded'];
    actions.forEach(action=>host.querySelectorAll('[data-pay-'+action+']').forEach(b=>b.addEventListener('click',()=>{
      const id = b.getAttribute('data-pay-'+action), current = packById(id);
      if (action==='period') { if (current) openPeriod(b,current); return; }
      if (action==='reminded') {
        void runPack(b,id,()=>savePayMap('remindedPacks',id,b.dataset.due),'Отмечено как напомненное');
        return;
      }
      if (action==='unarchive'){
        void runPack(b,id,()=>P().updatePayment(id,{archived_at:null}),'Возвращено из архива');
        return;
      }
      if (!current) return;
      if (action==='expire' && !current.k.closed && current.k.start<=P().today()){
        if (!window.confirm('Завершить абонемент сегодня? Оставшиеся занятия перестанут быть доступны.')) return;
        void runPack(b,id,()=>savePayMap('closedPacks',id,P().today()),'Абонемент завершён');
      } else if (action==='resume' && current.k.manualClose){
        void runPack(b,id,()=>savePayMap('closedPacks',id,null),'Абонемент возвращён');
      } else if (action==='archive' && current.k.closed){
        void runPack(b,id,()=>P().updatePayment(id,{archived_at:new Date().toISOString()}),'Добавлено в архив');
      }
    })));
    host.querySelectorAll('[data-pay-edit]').forEach(input=>{
      input.addEventListener('keydown',e=>{ if (e.key==='Enter') input.blur(); });
      input.addEventListener('change',async()=>{
        const {pid,payEdit}=input.dataset;
        const current=packById(pid);
        if (!current) return;
        const k=current.k;
        const old=payEdit==='used'?Math.max(0,k.used):k.pay[payEdit] ?? '';
        const value=payEdit==='payer'?input.value.trim():input.valueAsNumber;
        if (!input.checkValidity() || (payEdit!=='payer' && !Number.isFinite(value))) {
          input.value=old;
          ctx.toast('Введите допустимое значение');
          return;
        }
        if (String(value)===String(old)) return;
        const patch=payEdit==='used'?{adjust:value-k.used+(Number(k.pay.adjust)||0)}:{[payEdit]:value};
        if (payEdit==='used' && Math.abs(patch.adjust)>500){input.value=old;ctx.toast('Максимальная поправка — 500 занятий');return;}
        if (pendingPacks.has(pid)){input.value=old;ctx.toast('Дождитесь сохранения оплаты');return;}
        await runPack(input,pid,()=>P().updatePayment(pid,patch),'Оплата обновлена');
        if (input.isConnected) input.value=old;
      });
    });
  }

  function render(){
    if (!host) return;
    if (!st.data && !st.err) { host.innerHTML = '<div class="empty">Загружаем…</div>'; return; }
    if (st.err) { host.innerHTML = '<div class="empty">' + esc(st.err) + ' <button type="button" class="btn quiet small" id="payRetry">Повторить</button></div>'; host.querySelector('#payRetry').addEventListener('click', load); return; }
    const s = st.sid && st.students.find(x => String(x.id) === st.sid);
    if (st.sid && !s) { host.innerHTML = '<div class="empty">Ученик не найден. <a href="#/payments">← Оплаты</a></div>'; return; }
    host.querySelectorAll('details[id]').forEach(d => { if (d.open) st.open.add(d.id); else st.open.delete(d.id); });
    host.innerHTML = s ? studentHtml(s, calcFor(s.id)) : listHtml();
    host.querySelectorAll('.pay-add').forEach(b => b.addEventListener('click', () => {
      st.formFor = st.formFor === b.dataset.add ? null : b.dataset.add;
      render();
      const f = host.querySelector('.pay-form');
      if (f) { const a = f.querySelector('[name=amount]'); a.focus(); a.select(); }
    }));
    host.querySelectorAll('[data-pay-filter]').forEach(b => b.addEventListener('click', () => {
      st.filter = b.dataset.payFilter;
      st.formFor = null;
      render();
      host.querySelector('[data-pay-filter="' + st.filter + '"]').focus();
    }));
    host.querySelectorAll('.pay-form').forEach(bindForm);
    if (s) bindStudent(s); else bindOverview();
  }

  function init(opts){ ctx = opts; }
  function show(box, sid){
    host = box;
    const nsid = sid ? String(sid) : null;
    if (nsid !== st.sid) { st.formFor = null; st.rateOpen = false; st.monOpen = false; }
    st.sid = nsid;
    // Старая выписка может ещё предлагать оплатить уже закрытое занятие.
    st.data = null;
    st.err = '';
    render();
    return load();
  }

  /* ══ настройки оплат (вкладка «Настройки») ══ */
  function settingsHtml(){
    const ps = P().paySettings(settings());
    const tpls = P().FLAG_TEMPLATES.filter(t => !ps.flags.some(f => f.id === t.id || f.name === t.name));
    return '<h3>Оплаты</h3>' +
      '<div class="pay-debt-rule"><label class="chk"><input type="checkbox" id="psSingleDebt" aria-describedby="psSingleHint"' + (ps.trackSingleDebt ? ' checked' : '') + '> Учитывать долги за разовые занятия</label>' +
      '<div class="hint" id="psSingleHint">Если ученики платят сразу и вы редко вносите эти оплаты, снимите галочку. Занятия без отметки не попадут в долг. При желании оплату можно отметить в выписке ученика.</div></div>' +
      '<div class="hint">Прогул по умолчанию — как перенос: не оплачивается. На занятии это можно сменить.</div>' +
      '<div class="seg" id="psSkip"><button type="button" data-v="free" class="' + (ps.skipRule === 'free' ? 'on' : '') + '">Прогул не оплачивается</button>' +
        '<button type="button" data-v="charge" class="' + (ps.skipRule === 'charge' ? 'on' : '') + '">Прогул оплачивается</button></div>' +
      '<div class="hint" style="margin-top:10px">Занятия вне абонемента (до первой оплаты, после «абонемент истёк») и у ученика без оплат. Как в старом приложении — не долг.</div>' +
      '<div class="seg" id="psOutside"><button type="button" data-v="free" class="' + (ps.outside !== 'debt' ? 'on' : '') + '">Не считать долгом</button>' +
        '<button type="button" data-v="debt" class="' + (ps.outside === 'debt' ? 'on' : '') + '">Считать долгом</button></div>' +
      '<div class="pay-fgrid" style="margin-top:10px">' +
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
      if (t.id === 'psSingleDebt') setPay({ trackSingleDebt: t.checked });
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

  window.CabinetPayments = { init, show, reload: () => load(),
    repaint: () => { if (!pendingPacks.size && host && host.offsetParent) render(); }, mountSettings, _st: st };
})();
