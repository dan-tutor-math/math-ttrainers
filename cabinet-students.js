/* ==========================================================
   cabinet-students.js — вкладка «Ученики» кабинета таблицей, как плашка
   «Доход / расход» старого приложения расписания (просьба Даниила 14.11).

   Строка — ученик: имя, класс, экзамен, группы дохода, цена за занятие,
   раз в неделю, в месяц. Всё правится прямо в ячейке и сразу пишется:
     - имя, класс, экзамен — students (CabinetCloud.updateStudent);
     - цена — student_rates: новая ставка действует с сегодняшнего дня,
       прошлые итоги не меняются (как в старом). «Раз в неделю» и своя
       сумма «в месяц» живут в строке ставки на сегодня (payments.js) —
       при новой цене их переносим в новую строку, иначе они бы пропали;
     - группы дохода — settings.incomeGroups (те же, что в «Статистике»);
     - сортировки (вкладки над таблицей) — settings.studentCats: свой
       список учеников или отбор по классу / экзамену (новый девятиклассник
       попадает в «9 класс» сам).
   «В месяц» считает Payments.monthlyOf — то же число, что в «Статистике»;
   вписанное вручную подсвечено. Итог внизу — по видимой сортировке.
   Карточка ученика — кнопка «→» у имени (имя — поле ввода, по нему не
   перейти).
   ========================================================== */
(function(){
  'use strict';
  const P = () => window.Payments, C = () => window.CabinetCloud;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const LS_CAT = 'cabinet:students:cat';
  let ctx = null, host = null;
  const st = { list: [], rates: {}, tpl: null, noPay: false, err: '', tok: 0, sort: 'name', dir: 1, adding: false, edit: null, archOpen: false };
  let cat = '';
  try { cat = localStorage.getItem(LS_CAT) || ''; } catch (e) {}

  const settings = () => (ctx && ctx.settings && ctx.settings()) || {};
  const cats = () => (settings().studentCats || []).slice();
  const groups = () => (settings().incomeGroups || []).slice();
  const exams = () => (ctx && ctx.exams) || {};
  const active = () => st.list.filter(s => !s.archived_at);
  const newId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

  /* ── членство ── */
  const catHas = (c, s) => (c.kind === 'grade' ? String(s.grade || '').trim().toLowerCase() === c.v.toLowerCase()
    : c.kind === 'exam' ? (s.exam || '') === c.v : c.members.indexOf(String(s.id)) >= 0);
  const inGroup = (g, sid) => (g.auto ? g.out.indexOf(String(sid)) < 0 : g.members.indexOf(String(sid)) >= 0);
  function visible(){
    const a = active();
    if (!cat) return a;
    if (cat === '_none') return a.filter(s => !cats().some(c => catHas(c, s)));
    const c = cats().find(x => x.id === cat);
    return c ? a.filter(s => catHas(c, s)) : a;
  }

  /* ── деньги ── */
  const monthOf = s => P().monthlyOf({ rates: st.rates[s.id] || [], tpl: st.tpl, sid: s.id, mode: P().paySettings(settings()).monthMode });
  const curRate = s => P().curRateRow(st.rates[s.id] || [], P().today());
  const num = v => String(v == null ? '' : v).replace(/\s/g, '').replace(',', '.');

  /* ── загрузка ── */
  async function load(){
    const tok = ++st.tok;
    st.err = ''; st.payErr = '';
    try {
      const SC = window.ScheduleCloud;
      const [list, rates, tpls] = await Promise.all([
        ctx.students(),
        // ставок нет (SQL оплат не выполнен) или не загрузились — таблица
        // всё равно открывается: имена, классы и сортировки правятся без них
        P().listRates().catch(e => { st.payErr = P().missing(e) ? 'выполните cabinet-payments.sql' : 'ставки не загрузились'; return null; }),
        SC ? SC.listTemplates().catch(() => []) : [],
      ]);
      if (tok !== st.tok) return;
      st.list = (list || []).slice();
      st.noPay = rates == null;
      st.rates = {};
      (rates || []).forEach(r => { (st.rates[r.student_id] = st.rates[r.student_id] || []).push(r); });
      st.tpl = (tpls || []).find(t => t.is_active) || null;
    } catch (e) {
      if (tok !== st.tok) return;
      st.err = e.message || String(e);
    }
    render();
  }

  /* ── отрисовка ── */
  const SORTS = {
    name: (a, b) => a.name.localeCompare(b.name, 'ru'),
    grade: (a, b) => (parseInt(a.grade, 10) || 99) - (parseInt(b.grade, 10) || 99) || String(a.grade || '').localeCompare(String(b.grade || ''), 'ru'),
    exam: (a, b) => String(a.exam || '~').localeCompare(String(b.exam || '~')),
    price: (a, b) => ((curRate(a) || {}).price || 0) - ((curRate(b) || {}).price || 0),
    month: (a, b) => (monthOf(a).sum || 0) - (monthOf(b).sum || 0),
  };
  function rowsSorted(){
    const f = SORTS[st.sort] || SORTS.name;
    return visible().sort((a, b) => st.dir * f(a, b) || SORTS.name(a, b));
  }
  function th(key, label, cls){
    const on = st.sort === key;
    return '<th class="' + (cls || '') + '"><button type="button" class="cs-sort' + (on ? ' on' : '') + '" data-sort="' + key + '">' + label +
      (on ? (st.dir > 0 ? ' ↑' : ' ↓') : '') + '</button></th>';
  }
  function catsHtml(){
    const a = active(), cs = cats();
    const chip = (id, name, n, extra) => '<button type="button" class="cs-chip' + (cat === id ? ' on' : '') + '" data-cat="' + esc(id) + '">' + esc(name) +
      ' <span class="cs-n">' + n + '</span>' + (extra || '') + '</button>';
    const none = a.filter(s => !cs.some(c => catHas(c, s))).length;
    return chip('', 'Все', a.length) +
      cs.map(c => chip(c.id, c.name, a.filter(s => catHas(c, s)).length, cat === c.id ? '<span class="cs-pen" title="Изменить сортировку">✎</span>' : '')).join('') +
      (cs.length ? chip('_none', 'Без сортировки', none) : '') +
      '<button type="button" class="cs-chip cs-plus" id="csCatAdd" title="Новая сортировка — по классу, экзамену или свой список">+</button>';
  }
  function gradeOpts(){
    const set = new Set(['5', '6', '7', '8', '9', '10', '11']);
    st.list.forEach(s => { if (s.grade) set.add(String(s.grade).trim()); });
    return Array.from(set).sort((a, b) => (parseInt(a, 10) || 99) - (parseInt(b, 10) || 99) || a.localeCompare(b, 'ru'));
  }
  function examOpts(v){
    const E = exams();
    return Object.keys(E).map(k => '<option value="' + esc(k) + '"' + ((v || '') === k ? ' selected' : '') + '>' + esc(k ? E[k] : '—') + '</option>').join('') +
      (v && !(v in E) ? '<option value="' + esc(v) + '" selected>' + esc(v) + '</option>' : '');
  }
  function editHtml(){
    const c = st.edit;
    if (!c) return '';
    const E = exams();
    return '<div class="cs-edit" id="csEdit">' +
      '<div class="cs-erow"><label><span class="label">Название</span><input class="field" id="csEName" maxlength="40" value="' + esc(c.name) + '" placeholder="например, ОГЭ"></label>' +
      '<div><span class="label">Кто попадает</span><div class="seg" id="csEKind">' +
        [['list', 'Свой список'], ['grade', 'По классу'], ['exam', 'По экзамену']].map(([k, t]) => '<button type="button" data-k="' + k + '" class="' + (c.kind === k ? 'on' : '') + '">' + t + '</button>').join('') +
      '</div></div></div>' +
      (c.kind === 'grade' ? '<div class="cs-erow"><label><span class="label">Класс</span><select class="field" id="csEV">' + gradeOpts().map(g => '<option' + (g === c.v ? ' selected' : '') + '>' + esc(g) + '</option>').join('') + '</select></label>' +
        '<span class="hint">Ученик с этим классом в карточке попадает сюда сам.</span></div>' : '') +
      (c.kind === 'exam' ? '<div class="cs-erow"><label><span class="label">Экзамен</span><select class="field" id="csEV">' + Object.keys(E).filter(Boolean).map(k => '<option value="' + esc(k) + '"' + (k === c.v ? ' selected' : '') + '>' + esc(E[k]) + '</option>').join('') + '</select></label>' +
        '<span class="hint">Ученик с этим экзаменом попадает сюда сам.</span></div>' : '') +
      (c.kind === 'list' ? '<div class="cs-emem" id="csEMem">' + active().sort(SORTS.name).map(s => '<label class="chk"><input type="checkbox" value="' + esc(s.id) + '"' + (c.members.indexOf(String(s.id)) >= 0 ? ' checked' : '') + '> ' + esc(s.name) + '</label>').join('') + '</div>' : '') +
      '<div class="row-btns"><button type="button" class="btn small" id="csEOk">Готово</button><button type="button" class="btn quiet small" id="csECancel">Отмена</button>' +
        (c.isNew ? '' : '<button type="button" class="btn small danger" id="csEDel">Удалить сортировку</button>') +
        '<span class="hint">Ученики не удаляются — только вкладка.</span></div></div>';
  }
  function groupCell(s){
    const gs = groups().filter(g => inGroup(g, s.id)).map(g => g.name);
    return '<button type="button" class="cs-cellbtn cs-grp" data-act="grp" title="Группы дохода (как в «Статистике»)">' + (gs.length ? esc(gs.join(', ')) : '<span class="cs-mute">—</span>') + '</button>';
  }
  function moneyCells(s){
    if (st.noPay) return '<td class="cs-num" colspan="3"><span class="cs-mute">' + esc(st.payErr) + '</span></td>';
    const r = curRate(s), m = monthOf(s), t = P().tplLoad(st.tpl, s.id, st.rates[s.id] || [], P().today());
    const manual = m.how === 'manual';
    return '<td class="cs-num"><input class="cs-in cs-ni" data-f="price" inputmode="numeric" value="' + (r ? esc(Number(r.price)) : '') + '" placeholder="—" aria-label="Цена за занятие" title="Новая цена действует с сегодняшнего дня"></td>' +
      '<td class="cs-num"><input class="cs-in cs-ni" data-f="per_week" inputmode="decimal" value="' + (r && r.per_week != null ? esc(String(Number(r.per_week)).replace('.', ',')) : '') + '"' +
        ' placeholder="' + (r ? (t.n ? t.n : '—') : '') + '"' + (r ? '' : ' disabled title="Сначала цена за занятие"') + ' aria-label="Раз в неделю"></td>' +
      '<td class="cs-num"><input class="cs-in cs-ni cs-mon' + (manual ? ' manual' : '') + '" data-f="monthly" inputmode="numeric" value="' + (manual ? esc(fmt(m.sum)) : '') + '"' +
        ' placeholder="' + (m.sum == null ? '—' : esc(fmt(m.sum))) + '"' + (r ? '' : ' disabled') + ' title="' + esc(manual ? 'Вписано вручную — сотрите, чтобы считать само' : (m.text || '')) + '" aria-label="В месяц"></td>';
  }
  // стрелка «⇩» в шрифте Onest рисуется как «!» — значок коробки архива
  const ARCH_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/></svg>';
  const fmt = n => (n == null ? '' : Math.round(n).toLocaleString('ru-RU'));
  function rowHtml(s, i){
    return '<tr data-sid="' + esc(s.id) + '">' +
      '<td class="cs-i">' + (i + 1) + '</td>' +
      // «→» — рядом с именем, а не в конце строки: на телефоне колонка имени
      // прилипает слева, и переход к карточке виден без прокрутки вбок
      '<td class="cs-nm"><div class="cs-nmw"><input class="cs-in" data-f="name" maxlength="80" value="' + esc(s.name) + '" aria-label="Имя">' +
        '<a class="cs-ic cs-open" href="#/students/' + esc(s.id) + '" title="Открыть карточку ученика" aria-label="Открыть карточку">→</a></div></td>' +
      '<td><input class="cs-in cs-gr" data-f="grade" maxlength="20" list="csGrades" value="' + esc(s.grade || '') + '" placeholder="—" aria-label="Класс"></td>' +
      '<td><select class="cs-in cs-ex" data-f="exam" aria-label="Экзамен">' + examOpts(s.exam) + '</select></td>' +
      '<td>' + groupCell(s) + '</td>' +
      moneyCells(s) +
      '<td class="cs-act">' +
        (cats().some(c => c.kind === 'list') ? '<button type="button" class="cs-ic" data-act="cats" title="В какие сортировки входит">⋮</button>' : '') +
        '<a class="cs-ic" href="#/payments/' + esc(s.id) + '" title="Оплаты ученика">₽</a>' +
        '<button type="button" class="cs-ic" data-act="arch" title="В архив">' + ARCH_SVG + '</button></td></tr>';
  }
  function totalHtml(){
    const sum = visible().reduce((a, s) => a + (monthOf(s).sum || 0), 0);
    const c = cats().find(x => x.id === cat);
    return '<span class="cs-tl">Всего в месяц' + (cat === '_none' ? ' · без сортировки' : c ? ' · ' + esc(c.name) : '') + '</span><b id="csTotal">' + esc(P().money(sum)) + '</b>';
  }
  function render(){
    if (!host) return;
    if (st.err) { host.innerHTML = '<div class="empty">' + esc(st.err) + '</div>'; return; }
    if (cat && cat !== '_none' && !cats().some(c => c.id === cat)) cat = '';
    const rows = rowsSorted(), arch = st.list.filter(s => s.archived_at).sort(SORTS.name);
    host.innerHTML =
      '<div class="cs-head"><h2>Ученики <span class="cs-sub">' + active().length + '</span></h2>' +
        '<button type="button" class="btn ok" id="csAdd">+ Добавить ученика</button></div>' +
      '<div class="cs-cats" id="csCats">' + catsHtml() + '</div>' + editHtml() +
      '<div class="cs-box"><div class="cs-scroll"><table class="cs-tbl"><thead><tr><th class="cs-i">№</th>' + th('name', 'Ученик', 'cs-nm') + th('grade', 'Класс') + th('exam', 'Экзамен') +
        '<th>Группа</th>' + th('price', 'За занятие', 'cs-num') + '<th class="cs-num">Раз в неделю</th>' + th('month', 'В месяц', 'cs-num') + '<th></th></tr></thead>' +
        '<tbody id="csBody">' + rows.map(rowHtml).join('') +
        (st.adding ? '<tr class="cs-newrow"><td class="cs-i">+</td><td class="cs-nm" colspan="2"><input class="cs-in" id="csNew" maxlength="80" placeholder="Имя — Enter, чтобы добавить"></td><td colspan="7"><span class="hint" id="csNewMsg">Esc — отмена</span></td></tr>' : '') +
        (!rows.length && !st.adding ? '<tr><td colspan="10" class="empty">' + (active().length ? 'В этой сортировке учеников нет.' : 'Учеников пока нет — нажмите «Добавить ученика».') + '</td></tr>' : '') +
        '</tbody></table></div>' +
        '<div class="cs-foot"><button type="button" class="cs-ic cs-ic-big" id="csAdd2" title="Добавить ученика">+</button><div class="cs-total" id="csTotalBox">' + totalHtml() + '</div></div></div>' +
      '<datalist id="csGrades">' + gradeOpts().map(g => '<option value="' + esc(g) + '">').join('') + '<option value="студент"><option value="взрослый"></datalist>' +
      '<div class="hint cs-note">Новая цена действует с сегодняшнего дня — прошлые итоги не меняются. «В месяц» считается ' +
        (P().paySettings(settings()).monthMode === 'tpl' ? 'по активному шаблону недели' : 'как цена × раз в неделю × 4') +
        ' (способ — во вкладке «Статистика»). Впишите своё число, если у ученика особый расчёт, — оно сохранится и подсветится; сотрите — снова считается само. Пустое «раз в неделю» — по шаблону недели. → — карточка ученика.</div>' +
      (arch.length ? '<details class="cs-arch" id="csArch"' + (st.archOpen ? ' open' : '') + '><summary><b>Архив</b> <span class="hint">' + P().plural(arch.length, 'ученик', 'ученика', 'учеников') + '</span></summary>' +
        arch.map(s => '<div class="cs-arow" data-sid="' + esc(s.id) + '"><a class="cs-aname" href="#/students/' + esc(s.id) + '">' + esc(s.name) + '</a>' +
          '<span class="hint">' + esc([s.grade ? s.grade + ' класс' : '', s.exam ? exams()[s.exam] || s.exam : ''].filter(Boolean).join(' · ')) + '</span>' +
          '<button type="button" class="btn quiet small" data-act="unarch">Вернуть</button></div>').join('') + '</details>' : '');
    bind();
    if (st.adding) { const n = host.querySelector('#csNew'); if (n) n.focus(); }
  }
  // после правки в ячейке перерисовываем только то, что от неё зависит:
  // полная перерисовка сбила бы фокус, когда идут Tab-ом по строке
  function repaintRow(sid){
    const tr = host && host.querySelector('tr[data-sid="' + CSS.escape(String(sid)) + '"]'), s = st.list.find(x => String(x.id) === String(sid));
    if (tr && s && !st.noPay) {
      const focus = document.activeElement && tr.contains(document.activeElement) ? document.activeElement.dataset.f : null;
      const tmp = document.createElement('tbody');
      tmp.innerHTML = rowHtml(s, Number(tr.querySelector('.cs-i').textContent) - 1);
      const nt = tmp.firstChild;
      // поле, где стоит курсор, не трогаем
      nt.querySelectorAll('td').forEach((td, i) => {
        const old = tr.children[i];
        if (focus && old.querySelector('[data-f="' + focus + '"]')) return;
        old.replaceWith(td);
      });
    }
    paintTotals();
  }
  function paintTotals(){
    const b = host && host.querySelector('#csTotalBox');
    if (b) b.innerHTML = totalHtml();
    const cs = host && host.querySelector('#csCats');
    if (cs) cs.innerHTML = catsHtml();
  }

  /* ── запись ── */
  const sOf = sid => st.list.find(x => String(x.id) === String(sid));
  async function saveField(sid, f, el){
    const s = sOf(sid);
    if (!s) return;
    const v = el.value;
    el.classList.remove('err');
    try {
      if (f === 'name') {
        const name = v.trim();
        if (!name) { el.value = s.name; return; }
        if (name === s.name) return;
        Object.assign(s, await C().updateStudent(s.id, { name }));
      } else if (f === 'grade' || f === 'exam') {
        if ((s[f] || '') === v.trim()) return;
        Object.assign(s, await C().updateStudent(s.id, { [f]: v }));
      } else if (f === 'price') await savePrice(s, el);
      else if (f === 'per_week' || f === 'monthly') await saveExtra(s, f, el);
      if (ctx.changed) ctx.changed();
      el.classList.add('saved');
      setTimeout(() => el.classList.remove('saved'), 900);
    } catch (e) {
      el.classList.add('err');
      ctx.toast('Не сохранилось: ' + (e.message || e));
      return;
    }
    repaintRow(sid);
  }
  async function savePrice(s, el){
    const raw = num(el.value), cur = curRate(s);
    if (raw === '') { el.value = cur ? Number(cur.price) : ''; if (cur) ctx.toast('Цену не стереть — впишите новую'); return; }
    const price = Number(raw);
    if (!(price >= 0)) { el.value = cur ? Number(cur.price) : ''; return; }
    if (cur && Number(cur.price) === price) return;
    const today = P().today(), rates = st.rates[s.id] || [];
    let row = await P().setRate(s.id, { valid_from: today, price, group_price: cur ? cur.group_price : null }, rates);
    // новая строка ставки: «раз в неделю» и своя сумма остались у прошлой —
    // переносим, иначе «в месяц» после смены цены вдруг стал бы считаться иначе
    if (cur && cur.valid_from !== today && (cur.per_week != null || cur.monthly != null))
      row = await P().setRateExtra(row.id, { per_week: cur.per_week, monthly: cur.monthly });
    st.rates[s.id] = rates.filter(r => r.id !== row.id).concat([row]).sort((a, b) => (a.valid_from < b.valid_from ? -1 : 1));
  }
  async function saveExtra(s, f, el){
    const cur = curRate(s);
    if (!cur) return;
    const raw = num(el.value);
    const v = raw === '' ? null : Number(raw);
    if (v != null && !(v >= 0)) { el.classList.add('err'); return; }
    const was = cur[f] == null ? null : Number(cur[f]);
    if (was === v) return;
    const row = await P().setRateExtra(cur.id, { [f]: v });
    st.rates[s.id] = (st.rates[s.id] || []).map(r => (r.id === row.id ? row : r));
  }
  async function addNew(el){
    const name = el.value.trim();
    if (!name) { st.adding = false; render(); return; }
    el.disabled = true;
    const c = cats().find(x => x.id === cat), f = { name };
    // добавили, стоя на сортировке «9 класс» или «ОГЭ», — ученик сразу в ней
    if (c && c.kind === 'grade') f.grade = c.v;
    if (c && c.kind === 'exam') f.exam = c.v;
    try {
      const s = await C().addStudent(f);
      st.list.push(s);
      if (c && c.kind === 'list') patchCat(c.id, x => { x.members.push(String(s.id)); return x; });
      if (ctx.changed) ctx.changed();
      st.adding = false;
      render();
      const pr = host.querySelector('tr[data-sid="' + CSS.escape(String(s.id)) + '"] [data-f="price"]');
      if (pr) pr.focus();
      ctx.toast('Ученик добавлен: ' + s.name);
    } catch (e) {
      el.disabled = false;
      const m = host.querySelector('#csNewMsg');
      if (m) m.textContent = e.message || String(e);
    }
  }
  function saveCats(list){ return ctx.save({ studentCats: list }); }
  function patchCat(id, fn){ saveCats(cats().map(c => (c.id === id ? fn(Object.assign({}, c, { members: c.members.slice() })) : c))); }
  function saveGroups(list){ return ctx.save({ incomeGroups: list }); }

  /* ── всплывающее меню с галочками (группы дохода, сортировки строки) ── */
  let menuEl = null;
  function closeMenu(){ if (menuEl) { menuEl.remove(); menuEl = null; } }
  function menu(btn, title, items, onToggle, empty){
    closeMenu();
    const m = document.createElement('div');
    m.className = 'cs-menu';
    m.innerHTML = '<div class="cs-mt">' + esc(title) + '</div>' + (items.length ? items.map((it, i) =>
      '<label class="chk"><input type="checkbox" data-i="' + i + '"' + (it.on ? ' checked' : '') + '> ' + esc(it.label) + '</label>').join('') : '<div class="hint">' + empty + '</div>');
    document.body.appendChild(m);
    const r = btn.getBoundingClientRect(), w = m.offsetWidth, h = m.offsetHeight;
    m.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + 'px';
    m.style.top = (r.bottom + h + 8 > window.innerHeight ? Math.max(8, r.top - h - 4) : r.bottom + 4) + 'px';
    m.addEventListener('change', e => { const i = Number(e.target.dataset.i); onToggle(items[i], e.target.checked); });
    menuEl = m;
  }
  document.addEventListener('mousedown', e => { if (menuEl && !menuEl.contains(e.target) && !e.target.closest('[data-act="grp"],[data-act="cats"]')) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('hashchange', closeMenu);

  function bind(){
    const q = s => host.querySelector(s);
    const startAdd = () => { st.adding = true; render(); };
    q('#csAdd').addEventListener('click', startAdd);
    q('#csAdd2').addEventListener('click', startAdd);
    const nw = q('#csNew');
    if (nw) {
      nw.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); addNew(nw); }
        if (e.key === 'Escape') { st.adding = false; render(); }
      });
      nw.addEventListener('blur', () => { if (!nw.disabled && !nw.value.trim()) setTimeout(() => { if (st.adding && document.activeElement !== nw) { st.adding = false; render(); } }, 150); });
    }
    // сортировки
    q('#csCats').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.id === 'csCatAdd') { st.edit = { id: newId('c'), name: '', kind: 'list', v: '', members: [], isNew: true }; render(); const n = q('#csEName'); if (n) n.focus(); return; }
      const id = b.dataset.cat;
      if (id == null) return;
      if (id === cat && id && id !== '_none') {   // нажали выбранную ещё раз — изменить её
        const c = cats().find(x => x.id === id);
        if (c) { st.edit = Object.assign({}, c, { members: c.members.slice() }); render(); }
        return;
      }
      cat = id;
      try { localStorage.setItem(LS_CAT, cat); } catch (err) {}
      st.edit = null;
      render();
    });
    const ed = q('#csEdit');
    if (ed) {
      const c = st.edit, E = exams();
      // название подставляется само, пока его не правили руками
      const autoName = () => (c.kind === 'grade' ? c.v + ' класс' : c.kind === 'exam' ? (E[c.v] || c.v) : '');
      const nameIn = q('#csEName');
      nameIn.addEventListener('input', () => { c.name = nameIn.value; c.nameTouched = true; });
      const pickV = () => { const s = q('#csEV'); if (s) { c.v = s.value; if (!c.nameTouched || !c.name) { c.name = autoName(); nameIn.value = c.name; } } };
      ed.querySelectorAll('#csEKind button').forEach(b => b.addEventListener('click', () => {
        c.kind = b.dataset.k;
        c.v = c.kind === 'grade' ? (c.v && /^\d/.test(c.v) ? c.v : '9') : c.kind === 'exam' ? (E[c.v] ? c.v : Object.keys(E).filter(Boolean)[0] || '') : '';
        if (!c.nameTouched || !c.name) c.name = autoName();
        render();
      }));
      const vs = q('#csEV');
      if (vs) { vs.addEventListener('change', pickV); if (!c.v) pickV(); }
      const mem = q('#csEMem');
      if (mem) mem.addEventListener('change', e => {
        const id = e.target.value, i = c.members.indexOf(id);
        if (e.target.checked && i < 0) c.members.push(id);
        if (!e.target.checked && i >= 0) c.members.splice(i, 1);
      });
      q('#csEOk').addEventListener('click', () => {
        c.name = nameIn.value.trim() || autoName();
        if (!c.name) { nameIn.focus(); nameIn.classList.add('err'); return; }
        const clean = { id: c.id, name: c.name, kind: c.kind, v: c.v, members: c.kind === 'list' ? c.members : [] };
        const list = cats();
        saveCats(c.isNew ? list.concat([clean]) : list.map(x => (x.id === c.id ? clean : x)));
        cat = c.id;
        try { localStorage.setItem(LS_CAT, cat); } catch (err) {}
        st.edit = null;
        render();
      });
      q('#csECancel').addEventListener('click', () => { st.edit = null; render(); });
      const del = q('#csEDel');
      if (del) del.addEventListener('click', () => {
        if (!del.dataset.armed) { del.dataset.armed = '1'; del.textContent = 'Точно удалить?'; return; }
        saveCats(cats().filter(x => x.id !== c.id));
        cat = '';
        st.edit = null;
        render();
      });
    }
    // сортировка по столбцу
    host.querySelectorAll('.cs-sort').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.sort;
      if (st.sort === k) st.dir = -st.dir; else { st.sort = k; st.dir = k === 'price' || k === 'month' ? -1 : 1; }
      render();
    }));
    // ячейки
    const body = q('#csBody');
    body.addEventListener('change', e => {
      const el = e.target, f = el.dataset.f, tr = el.closest('tr[data-sid]');
      if (f && tr) saveField(tr.dataset.sid, f, el);
    });
    body.addEventListener('keydown', e => {
      const el = e.target;
      if (!el.dataset || !el.dataset.f || el.tagName !== 'INPUT') return;
      if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
      if (e.key === 'Escape') { const s = sOf(el.closest('tr').dataset.sid); repaintRowValue(el, s); el.blur(); }
    });
    body.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const s = sOf(b.closest('tr').dataset.sid);
      if (!s) return;
      if (b.dataset.act === 'grp') {
        const gs = groups();
        menu(b, 'Группы дохода — ' + s.name, gs.map(g => ({ id: g.id, label: g.name, on: inGroup(g, s.id) })), (it, on) => {
          saveGroups(groups().map(g => {
            if (g.id !== it.id) return g;
            const x = Object.assign({}, g, { members: g.members.slice(), out: g.out.slice() }), sid = String(s.id);
            const arr = x.auto ? x.out : x.members, i = arr.indexOf(sid);
            if ((x.auto ? !on : on) && i < 0) arr.push(sid);
            if ((x.auto ? on : !on) && i >= 0) arr.splice(i, 1);
            return x;
          }));
          repaintRow(s.id);
        }, 'Групп дохода нет — их заводят во вкладке «Статистика» (учебный год, ОГЭ, летние…).');
      } else if (b.dataset.act === 'cats') {
        const ls = cats().filter(c => c.kind === 'list');
        menu(b, 'Сортировки — ' + s.name, ls.map(c => ({ id: c.id, label: c.name, on: catHas(c, s) })), (it, on) => {
          patchCat(it.id, c => { const i = c.members.indexOf(String(s.id)); if (on && i < 0) c.members.push(String(s.id)); if (!on && i >= 0) c.members.splice(i, 1); return c; });
          paintTotals();
        }, '');
      } else if (b.dataset.act === 'arch') {
        if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = 'В архив?'; b.classList.add('armed'); setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.innerHTML = ARCH_SVG; b.classList.remove('armed'); } }, 3000); return; }
        archive(s, true);
      }
    });
    const ar = q('#csArch');
    if (ar) {
      ar.addEventListener('toggle', () => { st.archOpen = ar.open; });
      ar.addEventListener('click', e => {
        const b = e.target.closest('[data-act="unarch"]');
        if (b) archive(sOf(b.closest('[data-sid]').dataset.sid), false);
      });
    }
  }
  function repaintRowValue(el, s){
    if (!s) return;
    const f = el.dataset.f, r = curRate(s);
    if (f === 'name' || f === 'grade') el.value = s[f] || '';
    else if (f === 'price') el.value = r ? Number(r.price) : '';
    else if (f === 'per_week') el.value = r && r.per_week != null ? String(Number(r.per_week)).replace('.', ',') : '';
    else if (f === 'monthly') el.value = r && r.monthly != null ? fmt(r.monthly) : '';
  }
  async function archive(s, on){
    try {
      Object.assign(s, await C().setArchived(s.id, on));
      if (ctx.changed) ctx.changed();
      ctx.toast(on ? 'Ученик в архиве: ' + s.name : 'Ученик возвращён: ' + s.name);
      render();
    } catch (e) { ctx.toast(e.message || String(e)); }
  }

  function init(opts){ ctx = opts; }
  function show(box){ host = box; if (st.list.length) render(); return load(); }
  // настройки пришли с сервера (сортировки, группы, способ «в месяц»)
  function repaint(){ if (host && host.isConnected && !host.closest('[hidden]') && !st.edit && !(document.activeElement && host.contains(document.activeElement))) render(); }
  window.CabinetStudents = { init, show, repaint, _st: st };
})();
