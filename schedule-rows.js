/* ==========================================================
   schedule-rows.js — общий компонент строк для расписания и шаблона
   недели (пункты 1–2 раздела 14 old-app-gap.md, редизайн 14.11).

   Почему отдельный файл: «Строки» расписания и шаблон недели — одно и то же
   (строка «время · имена»), и Даниил хочет, чтобы в шаблоне работало всё,
   что в расписании: правка на месте, перетаскивание мышью и пальцем. Данные
   у них разные (занятия со статусами и слоты без статусов) — поэтому
   компонент ничего не знает о базе: он рисует строки и зовёт действия,
   которые даёт хозяин (schedule.js или schedule-tpl.js).

   Как устроено (решения по макетам — claude-notes/cabinet-redesign.md):
   - строка: значок статуса · время · имена; у пары и группы имена
     столбиком, у каждого свой значок; постоянных полей ввода нет — ручка и
     «⋯» появляются при наведении;
   - время и имена правятся на месте: щелчок → поле; «1530» → 15:30,
     «9» → 09:00; Enter в имени — новая строка ниже, стрелки — между
     строками и днями, Esc — отмена;
   - занятия, что пересекаются по времени, — в одной мягкой рамке без
     подписи, получасовые сдвинуты вправо (как в старом приложении);
   - перетаскивание: мышь — зажать и тянуть, палец — долгое нажатие
     (0,45 с, вибрация). Строку или одно имя из пары можно бросить на другую
     строку (ученики сливаются), на свободный час (на время перетаскивания
     в днях появляются пустые часы) или на другой день (то же время).

   Правка идёт через состояние `ed`, а не через живое поле: хозяин может
   перерисовать страницу в любой момент (пришёл ответ сервера), и поле с
   текстом и курсором встаёт обратно.
   ========================================================== */
(function(){
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pad = n => (n < 10 ? '0' : '') + n;
  const hm = m => pad(Math.floor(m / 60)) + ':' + pad(m % 60);
  const norm = s => String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();

  /* ── значки статуса: svg, а не символы шрифта — одинаковы везде ── */
  const SVG = d => '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="' + d + '"/></svg>';
  const ICON = {
    plan: '',
    done: SVG('M3.8 8.4l2.7 2.7 5.7-6'),
    skip: SVG('M5 5l6 6M11 5l-6 6'),
    move: SVG('M10.5 3.5l3 3-3 3M13.5 6.5H7a3.5 3.5 0 0 0 0 7h1.5'),
  };
  // порядок нажатий — решение Даниила 14.11: проведено → перенос → отменено
  const NEXT = { plan: 'done', done: 'move', move: 'skip', skip: 'plan' };
  const ST_NAME = { plan: 'запланировано', done: 'проведено', skip: 'отменено', move: 'перенос' };
  const icon = s => ICON[s] || '';
  // общий статус строки: у всех одинаковый — он, иначе «смешанный» (plan)
  const aggStatus = people => (people.length && people.every(p => p.status === people[0].status) ? people[0].status : 'plan');

  /* ── время из того, что набрали: «1530», «15:30», «15.3», «9» ── */
  function parseTime(text){
    const t = String(text || '').trim();
    if (!t) return null;
    let h, m;
    let r = t.match(/^(\d{1,2})[:.,\s](\d{1,2})$/);
    if (r) { h = +r[1]; m = r[2].length === 1 ? +r[2] * 10 : +r[2]; }
    else if (/^\d{1,4}$/.test(t)) {
      if (t.length <= 2) { h = +t; m = 0; }
      else if (t.length === 3) { h = +t[0]; m = +t.slice(1); }
      else { h = +t.slice(0, 2); m = +t.slice(2); }
    } else return null;
    return h >= 0 && h <= 23 && m >= 0 && m <= 59 ? h * 60 + m : null;
  }

  /* ── пересечения: занятия одного дня, идущие внахлёст, — одна группа ── */
  function clusters(items){
    const out = [];
    let cur = null, end = -1;
    items.forEach(it => {
      if (it.start_min == null) { out.push([it]); cur = null; end = -1; return; }
      if (cur && it.start_min < end) { cur.push(it); end = Math.max(end, it.start_min + it.dur_min); return; }
      cur = [it]; end = it.start_min + it.dur_min; out.push(cur);
    });
    return out;
  }

  /* ══ своё выпадающее меню в стиле стекла (никаких браузерных select) ══
     items: [{ head }, { label, act, on, danger, hint, html }]; act(item) —
     действие; keep: true — меню не закрывается (переключатели). */
  let menuEl = null, menuOff = null;
  function closeMenu(){
    if (!menuEl) return;
    const el = menuEl;
    menuEl = null;
    if (menuOff) menuOff();
    menuOff = null;
    el.classList.remove('on');
    el.style.pointerEvents = 'none';       // гаснущее меню не должно ловить щелчки
    setTimeout(() => el.remove(), 180);
  }
  function openMenu(anchor, items, opts){
    opts = opts || {};
    closeMenu();
    const el = document.createElement('div');
    el.className = 'gm-menu' + (opts.cls ? ' ' + opts.cls : '');
    el.setAttribute('role', 'menu');
    const paint = () => {
      el.innerHTML = items.map((it, i) => it.head ? '<div class="gm-head">' + esc(it.head) + '</div>'
        : it.sep ? '<div class="gm-sep"></div>'
        : '<button type="button" role="menuitem" class="gm-item' + (it.on ? ' on' : '') + (it.danger ? ' danger' : '') + '" data-i="' + i + '">' +
            (it.html || '<span class="gm-l">' + esc(it.label) + '</span>') +
            (it.hint ? '<span class="gm-hint">' + esc(it.hint) + '</span>' : '') +
            (opts.checks ? '<span class="gm-ok">' + ICON.done + '</span>' : '') + '</button>').join('');
    };
    paint();
    document.body.appendChild(el);
    const r = anchor.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
    let x = opts.alignLeft ? r.left : r.right - w;
    x = Math.max(8, Math.min(x, window.innerWidth - w - 8));
    let y = r.bottom + 6;
    if (y + h > window.innerHeight - 8 && r.top - h - 6 > 8) { y = r.top - h - 6; el.classList.add('up'); }
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    requestAnimationFrame(() => el.classList.add('on'));
    el.addEventListener('click', e => {
      const b = e.target.closest('.gm-item');
      if (!b) return;
      const it = items[+b.dataset.i];
      if (!it || !it.act) return;
      if (!it.keep) { closeMenu(); it.act(it); return; }
      const r2 = it.act(it);
      if (r2 && r2.items) items = r2.items;
      paint();
    });
    const onDown = e => { if (!el.contains(e.target) && !anchor.contains(e.target)) closeMenu(); };
    const onKey = e => { if (e.key === 'Escape') closeMenu(); };
    const onScroll = e => { if (!el.contains(e.target)) closeMenu(); };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    menuOff = () => { document.removeEventListener('pointerdown', onDown, true); document.removeEventListener('keydown', onKey); window.removeEventListener('scroll', onScroll, true); };
    menuEl = el;
    return el;
  }

  /* ══ компонент строк ══
     cfg = {
       statuses: true — у строк есть статусы (занятия), false — слоты шаблона;
       itemsOf(day) → занятия дня по времени [{ id, start_min, dur_min, is_event, title, people:[{ id, status?, student_id, guest_name }] }];
       days() → ключи дней по порядку (для стрелок ←/→ и перетаскивания);
       name(p) → имя; personExtra(item, p) → html после имени (оплата, флаги);
       showEnd() → показывать «начало–конец»;
       defaultDur(day) → длительность новой строки;
       busy(v) — хозяин не должен перерисовывать, пока задан вопрос об имени;
       act: { status(item, p|null), time(item, min), names(item, text, box), create(day, start, text, box),
              open(item, p), free(item), remove(item), move({ item, person, to }),
              person(item, p, el) — щелчок по имени (нет — имя тоже правит строку) }
       labels: { open: 'Открыть занятие' }
     } */
  function create(cfg){
    const C = { cfg };
    let ed = null;          // { day, id ('new' — новая строка), field: 'time'|'names', time, names, caret }
    let drag = null;        // перетаскивание
    let suppressClick = 0;

    const itemsOf = day => cfg.itemsOf(day) || [];
    const find = (day, id) => itemsOf(day).find(x => String(x.id) === String(id));
    const namesText = it => it.people.map(p => cfg.name(p)).join(', ');
    const endOf = it => (it.start_min == null ? null : Math.min(1440, it.start_min + it.dur_min));
    const timeLabel = it => (it.start_min == null ? '—' : hm(it.start_min) + (cfg.showEnd && cfg.showEnd() ? '–' + hm(endOf(it)) : ''));

    function personHtml(it, p, multi){
      const st = p.status || 'plan', gone = cfg.statuses && (st === 'skip' || st === 'move');
      return '<span class="rw-p st-' + st + (p.student_id ? '' : ' guest') + '" data-pid="' + esc(p.id) + '">' +
        (multi && cfg.statuses ? '<button type="button" class="rw-ic sm st-' + st + '" data-pst="' + esc(p.id) + '" title="' + esc(ST_NAME[st]) + ' — нажмите, чтобы сменить" aria-label="Статус ' + esc(cfg.name(p)) + ': ' + esc(ST_NAME[st]) + '">' + icon(st) + '</button>' : '') +
        '<span class="nm' + (gone ? ' x' : '') + '">' + esc(cfg.name(p)) + '</span>' +
        (p.student_id ? '' : '<span class="rw-guest" title="Гость — без карточки ученика">гость</span>') +
        (cfg.personExtra ? cfg.personExtra(it, p) : '') + '</span>';
    }
    function editInput(field, val){
      return '<input class="rw-in rw-in-' + field + '" data-field="' + field + '" value="' + esc(val) + '" autocomplete="off" spellcheck="false"' +
        (field === 'time' ? ' inputmode="numeric" maxlength="5" placeholder="15:00" aria-label="Время"' : ' maxlength="300" placeholder="Маша, Петя" aria-label="Ученики через запятую"') + '>';
    }
    function rowHtml(day, it, inFrame){
      const e = ed && ed.day === day && String(ed.id) === String(it.id) ? ed : null;
      const multi = it.people.length > 1, agg = aggStatus(it.people);
      const st = cfg.statuses && !it.is_event && it.people.length ? agg : 'plan';
      const half = inFrame && it.start_min != null && it.start_min % 60 !== 0;
      let names;
      if (e && e.field === 'names') names = editInput('names', e.names);
      else if (it.is_event) names = '<span class="rw-ev">' + esc(it.title || 'событие') + '</span>';
      else if (!it.people.length) names = '<span class="rw-empty">свободно</span>';
      else names = it.people.map(p => personHtml(it, p, multi)).join('');
      return '<div class="rw-row' + (half ? ' half' : '') + (multi ? ' multi' : '') + (it.is_event ? ' ev' : '') + (cfg.statuses ? ' st-' + st : '') + (e ? ' editing' : '') + '"' +
          ' data-id="' + esc(it.id) + '" data-day="' + esc(day) + '"' + (it.start_min != null ? ' data-start="' + it.start_min + '"' : '') + '>' +
        '<span class="rw-grip" aria-hidden="true"></span>' +
        (cfg.statuses ? (it.is_event || !it.people.length ? '<span class="rw-ic ph"></span>'
          : '<button type="button" class="rw-ic st-' + st + '" data-rst title="' + esc(multi ? 'Статус всем: ' + ST_NAME[st] : ST_NAME[st]) + ' — нажмите, чтобы сменить" aria-label="Статус' + (multi ? ' всем' : '') + ': ' + esc(ST_NAME[st]) + '">' + icon(st) + '</button>') : '') +
        (e && e.field === 'time' ? editInput('time', e.time) : '<button type="button" class="rw-time" data-edit="time" title="Изменить время">' + esc(timeLabel(it)) + '</button>') +
        '<div class="rw-names" data-edit="names"' + (it.is_event ? '' : ' title="Изменить учеников"') + '>' + names + '</div>' +
        '<button type="button" class="rw-more" data-more aria-label="Ещё: ' + esc(timeLabel(it)) + '" title="Ещё">' + SVG('M3.5 8h.01M8 8h.01M12.5 8h.01') + '</button>' +
      '</div>' +
      (e ? '<div class="rw-resolve" data-for="' + esc(it.id) + '"></div>' : '');
    }
    function draftHtml(day){
      if (!ed || ed.day !== day || ed.id !== 'new') return '';
      return '<div class="rw-row draft editing" data-id="new" data-day="' + esc(day) + '">' +
        '<span class="rw-grip" aria-hidden="true"></span>' + (cfg.statuses ? '<span class="rw-ic ph"></span>' : '') +
        editInput('time', ed.time) + '<div class="rw-names">' + editInput('names', ed.names) + '</div>' +
        '<span class="rw-more ph"></span></div><div class="rw-resolve" data-for="new"></div>' +
        (ed.msg ? '<div class="rw-msg">' + esc(ed.msg) + '</div>' : '');
    }
    // строки дня: пересекающиеся — в одной рамке, новая строка — по времени
    C.listHtml = function(day){
      const items = itemsOf(day);
      let h = '<div class="rw-list" data-day="' + esc(day) + '">';
      const draftAt = ed && ed.day === day && ed.id === 'new' ? (parseTime(ed.time) == null ? Infinity : parseTime(ed.time)) : null;
      let drafted = draftAt == null;
      clusters(items).forEach(cl => {
        const first = cl[0];
        if (!drafted && first.start_min != null && draftAt < first.start_min && !(ed.after && cl.some(x => String(x.id) === String(ed.after)))) { h += draftHtml(day); drafted = true; }
        h += cl.length > 1 ? '<div class="rw-frame" data-start="' + first.start_min + '">' + cl.map(it => rowHtml(day, it, true)).join('') + '</div>'
          : rowHtml(day, first, false);
        if (!drafted && ed.after && cl.some(x => String(x.id) === String(ed.after))) { h += draftHtml(day); drafted = true; }
      });
      if (!drafted) h += draftHtml(day);
      if (!items.length && !(ed && ed.day === day && ed.id === 'new')) h += '<div class="rw-free">свободно</div>';
      return h + '<button type="button" class="rw-add" data-add="' + esc(day) + '">+ строка</button></div>';
    };

    /* ── правка на месте ── */
    function startEdit(day, id, field, extra){
      const it = id === 'new' ? null : find(day, id);
      if (id !== 'new' && !it) return;
      ed = Object.assign({ day, id, field,
        time: it ? (it.start_min == null ? '' : hm(it.start_min)) : '',
        names: it ? namesText(it) : '' }, extra || {});
      cfg.rerender();
    }
    C.startEdit = startEdit;
    C.editing = () => !!ed;
    // новая строка: время — сразу после предыдущей (или после строки after)
    function startDraft(day, after){
      const items = itemsOf(day);
      const prev = after ? find(day, after) : items.filter(x => x.start_min != null).slice(-1)[0];
      const t = prev && prev.start_min != null ? Math.min(23 * 60, endOf(prev)) : null;
      startEdit(day, 'new', t == null ? 'time' : 'names', { time: t == null ? '' : hm(t), after: after || null });
    }
    C.startDraft = startDraft;
    function focusEdit(root){
      if (!ed) return;
      const row = root.querySelector('.rw-row[data-day="' + cssq(ed.day) + '"][data-id="' + cssq(ed.id) + '"]');
      const inp = row && row.querySelector('.rw-in[data-field="' + ed.field + '"]');
      if (!inp) return;
      if (document.activeElement !== inp) {
        inp.focus({ preventScroll: false });
        const c = ed.caret == null ? inp.value.length : Math.min(ed.caret, inp.value.length);
        try { inp.setSelectionRange(c, c); } catch (e) {}
      }
    }
    const cssq = s => String(s).replace(/["\\]/g, '\\$&');

    // сохранить поле; дальше — куда перейти (next: 'names' | 'down' | 'up' | 'newrow' | null)
    async function commit(next){
      if (!ed) return;
      const e = ed, day = e.day;
      if (e.id === 'new') {
        const start = parseTime(e.time);
        if (e.field === 'time' && next === 'names') { ed = Object.assign({}, e, { field: 'names', caret: null, time: start == null ? e.time : hm(start) }); cfg.rerender(); return; }
        if (!e.names.trim()) { ed = null; cfg.rerender(); return; }
        if (String(e.time).trim() && start == null) { ed = Object.assign({}, e, { field: 'time', msg: 'Время не понятно: напишите 15:00 или 1500' }); cfg.rerender(); return; }
        const root = C.root, box = root && root.querySelector('.rw-resolve[data-for="new"]');
        if (cfg.busy) cfg.busy(true);
        let r;
        try { r = await cfg.act.create(day, start, e.names, box); } finally { if (cfg.busy) cfg.busy(false); }
        if (r && r.item) {
          ed = null;
          if (next === 'newrow' || next === 'names') startDraft(day, r.item.id); else cfg.rerender();
        } else if (r && r.cancelled) { ed = Object.assign({}, e, { msg: '' }); cfg.rerender(); }
        else { ed = Object.assign({}, e, { msg: (r && r.msg) || '' }); cfg.rerender(); }
        return;
      }
      const it = find(day, e.id);
      ed = null;
      if (!it) { cfg.rerender(); return; }
      if (e.field === 'time') {
        const v = parseTime(e.time);
        if (v != null && v !== it.start_min) cfg.act.time(it, v);
        else if (String(e.time).trim() && v == null) cfg.toast && cfg.toast('Время не понятно: напишите 15:00 или 1500');
      } else if (e.field === 'names' && !it.is_event && norm(e.names) !== norm(namesText(it))) {
        // ответ на вопрос о незнакомом имени рисуется под строкой — держим её
        ed = Object.assign({}, e, { pending: true });
        cfg.rerender();
        const box = C.root && C.root.querySelector('.rw-resolve[data-for="' + cssq(it.id) + '"]');
        if (cfg.busy) cfg.busy(true);
        try { await cfg.act.names(it, e.names, box); } finally { if (cfg.busy) cfg.busy(false); }
        ed = null;
      }
      if (next === 'names') startEdit(day, it.id, 'names');
      else if (next === 'newrow') startDraft(day, it.id);
      else if (next === 'down' || next === 'up') moveVert(day, it.id, e.field, next === 'down' ? 1 : -1);
      else cfg.rerender();
    }
    function rowsOrder(day){ return itemsOf(day).map(x => String(x.id)); }
    function moveVert(day, id, field, d){
      const ids = rowsOrder(day), i = ids.indexOf(String(id));
      const j = i + d;
      if (j >= 0 && j < ids.length) startEdit(day, ids[j], field);
      else cfg.rerender();
    }
    function moveDay(day, id, field, d){
      const days = cfg.days(), k = days.indexOf(day) + d;
      if (k < 0 || k >= days.length) return false;
      const i = Math.max(0, rowsOrder(day).indexOf(String(id)));
      const ids = rowsOrder(days[k]);
      if (!ids.length) { ed = null; startDraft(days[k]); return true; }
      startEdit(days[k], ids[Math.min(i, ids.length - 1)], field, { caret: field === 'names' ? 0 : null });
      return true;
    }

    /* ── действия строки: меню «⋯» ── */
    function moreMenu(btn, day, it){
      const items = [{ label: (cfg.labels && cfg.labels.open) || 'Открыть', act: () => cfg.act.open(it, null) }];
      if (!it.is_event && it.people.length) items.push({ label: 'Освободить строку', hint: 'убрать учеников, время оставить', act: () => cfg.act.free(it) });
      items.push({ label: 'Удалить строку', danger: true, keep: true, act: () => ({ items: [{ label: 'Точно удалить?', danger: true, act: () => cfg.act.remove(it) }, { label: 'Отмена', act: () => {} }] }) });
      openMenu(btn, items);
    }

    /* ══ перетаскивание ══ */
    const HOURS = [8, 21];
    function freeHours(day, skip){
      const items = itemsOf(day).filter(x => x.start_min != null && !(skip && String(x.id) === String(skip.id) && skip.whole));
      const out = [];
      for (let h = HOURS[0]; h <= HOURS[1]; h++) {
        const a = h * 60, b = a + 60;
        if (!items.some(x => x.start_min < b && a < x.start_min + x.dur_min)) out.push(a);
      }
      return out;
    }
    function showSlots(){
      C.root.querySelectorAll('.rw-list').forEach(list => {
        const day = list.dataset.day;
        freeHours(day, { id: drag.item.id, whole: !drag.person }).forEach(m => {
          const s = document.createElement('div');
          s.className = 'rw-slot';
          s.dataset.day = day; s.dataset.start = m;
          s.textContent = hm(m);
          // по времени среди строк и рамок дня
          const kids = Array.from(list.children).filter(k => k.dataset && k.dataset.start != null && (k.classList.contains('rw-row') || k.classList.contains('rw-frame')));
          const after = kids.find(k => Number(k.dataset.start) > m);
          list.insertBefore(s, after || list.querySelector('.rw-add'));
        });
      });
    }
    function dropTarget(x, y){
      const el = document.elementFromPoint(x, y);
      if (!el || !C.root.contains(el)) return null;
      const slot = el.closest('.rw-slot');
      if (slot) return { el: slot, to: { kind: 'slot', day: slot.dataset.day, start: Number(slot.dataset.start) } };
      const row = el.closest('.rw-row:not(.draft)');
      if (row) {
        const it = find(row.dataset.day, row.dataset.id);
        if (it && !(String(it.id) === String(drag.item.id) && drag.day === row.dataset.day)) return { el: row, to: { kind: 'row', day: row.dataset.day, item: it } };
        return null;
      }
      const card = el.closest('[data-rw-day]');
      if (card && card.dataset.rwDay !== drag.day) return { el: card, to: { kind: 'day', day: card.dataset.rwDay } };
      return null;
    }
    function beginDrag(){
      const d = drag;
      d.active = true;
      if (navigator.vibrate && d.touch) { try { navigator.vibrate(18); } catch (e) {} }
      const src = d.person ? d.pill : d.row;
      const r = src.getBoundingClientRect();
      const g = src.cloneNode(true);
      g.className += ' rw-ghost';
      g.style.width = r.width + 'px';
      d.dx = d.x0 - r.left; d.dy = d.y0 - r.top;
      document.body.appendChild(g);
      d.ghost = g;
      src.classList.add('rw-src');
      C.root.classList.add('rw-dragging');
      // пустые часы раздвигают дни: прокручиваем так, чтобы строка под
      // пальцем осталась на месте, иначе под ним окажется чужой день
      const top0 = src.getBoundingClientRect().top;
      showSlots();
      const shift = src.getBoundingClientRect().top - top0;
      if (shift) window.scrollBy(0, shift);
      place(d.x0, d.y0);
    }
    function place(x, y){
      const d = drag;
      d.ghost.style.transform = 'translate(' + (x - d.dx) + 'px,' + (y - d.dy) + 'px) rotate(-1.2deg)';
      const t = dropTarget(x, y);
      if (d.tEl && (!t || t.el !== d.tEl)) d.tEl.classList.remove('rw-target');
      d.tEl = t ? t.el : null; d.to = t ? t.to : null;
      if (d.tEl) d.tEl.classList.add('rw-target');
      // у края окна — прокрутка, иначе далёкий день не достать
      const edge = 70;
      d.scroll = y < edge ? -1 : y > window.innerHeight - edge ? 1 : 0;
      if (d.scroll && !d.raf) {
        const step = () => {
          if (!drag || !drag.scroll) { if (drag) drag.raf = 0; return; }
          window.scrollBy(0, drag.scroll * 12);
          drag.raf = requestAnimationFrame(step);
        };
        d.raf = requestAnimationFrame(step);
      }
    }
    function endDrag(ok){
      const d = drag;
      drag = null;
      if (!d) return;
      clearTimeout(d.timer);
      document.removeEventListener('pointermove', onMove, true);
      document.removeEventListener('pointerup', onUp, true);
      document.removeEventListener('pointercancel', onCancel, true);
      if (!d.active) return;
      suppressClick = Date.now() + 80;      // гасим только щелчок от этого же отпускания
      if (d.raf) cancelAnimationFrame(d.raf);
      d.ghost.remove();
      if (d.tEl) d.tEl.classList.remove('rw-target');
      C.root.classList.remove('rw-dragging');
      C.root.querySelectorAll('.rw-slot').forEach(s => s.remove());
      C.root.querySelectorAll('.rw-src').forEach(s => s.classList.remove('rw-src'));
      if (ok && d.to) cfg.act.move({ item: d.item, from: d.day, person: d.person || null, to: d.to });
    }
    function onMove(e){
      const d = drag;
      if (!d || e.pointerId !== d.pid) return;
      if (!d.active) {
        const far = Math.abs(e.clientX - d.x0) > (d.touch ? 9 : 5) || Math.abs(e.clientY - d.y0) > (d.touch ? 9 : 5);
        if (!far) return;
        if (d.touch) { endDrag(false); return; }      // палец пошёл раньше долгого нажатия — это прокрутка
        beginDrag();
      }
      e.preventDefault();
      place(e.clientX, e.clientY);
    }
    function onUp(e){ if (drag && e.pointerId === drag.pid) endDrag(true); }
    function onCancel(e){ if (drag && e.pointerId === drag.pid) endDrag(false); }
    function onDown(e){
      if (e.button !== 0 || drag || ed) return;
      const row = e.target.closest('.rw-row');
      if (!row || row.classList.contains('draft')) return;
      if (e.target.closest('input, a, .rw-ic, .rw-more, .sc-why, .sc-paid')) return;
      const it = find(row.dataset.day, row.dataset.id);
      if (!it) return;
      const pill = it.people.length > 1 ? e.target.closest('.rw-p') : null;
      const person = pill ? it.people.find(p => String(p.id) === pill.dataset.pid) : null;
      drag = { pid: e.pointerId, x0: e.clientX, y0: e.clientY, row, pill, item: it, person, day: row.dataset.day,
               touch: e.pointerType !== 'mouse', active: false };
      if (drag.touch) drag.timer = setTimeout(() => { if (drag && !drag.active) beginDrag(); }, 450);
      document.addEventListener('pointermove', onMove, true);
      document.addEventListener('pointerup', onUp, true);
      document.addEventListener('pointercancel', onCancel, true);
    }

    /* ── привязка к странице (после каждой перерисовки) ── */
    C.bind = function(root){
      C.root = root;
      if (!root.__rwBound) {
        root.__rwBound = true;
        root.addEventListener('pointerdown', onDown);
        // долгое нажатие пальцем: пока тащим, страница не должна прокручиваться
        root.addEventListener('touchmove', e => { if (drag && drag.active) e.preventDefault(); }, { passive: false });
        root.addEventListener('contextmenu', e => { if (drag || (e.target.closest && e.target.closest('.rw-row') && e.pointerType !== 'mouse' && !e.target.closest('input'))) e.preventDefault(); });
        root.addEventListener('click', onClick, true);
        root.addEventListener('input', e => {
          const inp = e.target.closest('.rw-in');
          if (!inp || !ed) return;
          ed[inp.dataset.field] = inp.value;
          ed.caret = inp.selectionStart;
          if (ed.msg) ed.msg = '';
        });
        root.addEventListener('keydown', onKey);
        root.addEventListener('focusout', e => {
          const inp = e.target.closest && e.target.closest('.rw-in');
          if (!inp || !ed || ed.pending) return;
          // фокус ушёл из строки совсем (не в соседнее поле той же строки) —
          // сохраняем; уход из-за перерисовки — не уход
          setTimeout(() => {
            if (!ed || ed.pending || !inp.isConnected) return;
            const row = inp.closest('.rw-row'), a = document.activeElement;
            if (row && a && row.contains(a)) return;
            const resolve = root.querySelector('.rw-resolve[data-for="' + cssq(ed.id) + '"]');
            if (resolve && resolve.children.length) return;           // ждём ответа на вопрос об имени
            commit(null);
          }, 0);
        });
      }
      focusEdit(root);
    };
    function onClick(e){
      if (Date.now() < suppressClick) { e.stopPropagation(); e.preventDefault(); return; }
      const t = e.target;
      const add = t.closest('[data-add]');
      if (add) { e.stopPropagation(); if (ed) commit(null); startDraft(add.dataset.add); return; }
      const row = t.closest('.rw-row');
      if (!row || row.classList.contains('draft') || t.closest('input')) return;
      const day = row.dataset.day, it = find(day, row.dataset.id);
      if (!it) return;
      const rst = t.closest('[data-rst]'), pst = t.closest('[data-pst]');
      if (rst || pst) {
        e.stopPropagation();
        cfg.act.status(it, pst ? it.people.find(p => String(p.id) === pst.dataset.pst) : null);
        return;
      }
      const more = t.closest('[data-more]');
      if (more) { e.stopPropagation(); moreMenu(more, day, it); return; }
      if (t.closest('.sc-why, .sc-paid, a')) return;     // оплата — обработчик хозяина
      // имя — карточка ученика (как в «Неделе»); свободное место рядом — правка имён
      const nm = cfg.act.person && t.closest('.rw-p .nm');
      if (nm) {
        e.stopPropagation();
        const p = it.people.find(x => String(x.id) === nm.closest('.rw-p').dataset.pid);
        if (p) { if (ed) commit(null); cfg.act.person(it, p, nm); }
        return;
      }
      const fld = t.closest('[data-edit]');
      if (fld) {
        e.stopPropagation();
        if (fld.dataset.edit === 'names' && it.is_event) { cfg.act.open(it, null); return; }
        if (ed) commit(null);
        startEdit(day, it.id, fld.dataset.edit);
      }
    }
    function onKey(e){
      const inp = e.target.closest && e.target.closest('.rw-in');
      if (!inp || !ed) return;
      const f = inp.dataset.field, v = inp.value, a = inp.selectionStart, b = inp.selectionEnd;
      ed[f] = v;
      if (e.key === 'Escape') { e.preventDefault(); ed = null; cfg.rerender(); return; }
      if (e.key === 'Enter') { e.preventDefault(); commit(f === 'time' ? 'names' : 'newrow'); return; }
      if (e.key === 'Tab' && !e.shiftKey && f === 'time') { e.preventDefault(); commit('names'); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (ed.id === 'new') return;
        e.preventDefault(); commit(e.key === 'ArrowDown' ? 'down' : 'up'); return;
      }
      if (e.key === 'ArrowRight' && a === v.length && b === v.length) {
        if (f === 'time') { e.preventDefault(); if (ed.id === 'new') { commit('names'); return; } const id = ed.id, day = ed.day; commitThen(() => startEdit(day, id, 'names', { caret: 0 })); return; }
        if (ed.id !== 'new') { e.preventDefault(); const id = ed.id, day = ed.day; commitThen(() => { if (!moveDay(day, id, 'time', 1)) cfg.rerender(); }); }
        return;
      }
      if (e.key === 'ArrowLeft' && a === 0 && b === 0) {
        if (f === 'names') { e.preventDefault(); if (ed.id === 'new') { ed.field = 'time'; ed.caret = null; cfg.rerender(); return; } const id = ed.id, day = ed.day; commitThen(() => startEdit(day, id, 'time')); return; }
        if (ed.id !== 'new') { e.preventDefault(); const id = ed.id, day = ed.day; commitThen(() => { if (!moveDay(day, id, 'names', -1)) cfg.rerender(); }); }
        return;
      }
      if (e.key === 'Backspace' && ed.id === 'new' && !ed.time && !ed.names) { e.preventDefault(); ed = null; cfg.rerender(); }
    }
    async function commitThen(fn){
      const e = ed;
      if (!e) return fn();
      // сохраняем поле и сразу открываем следующее (сеть не ждём: хозяин
      // меняет данные сразу и откатывает при ошибке)
      ed = null;
      const it = find(e.day, e.id);
      if (it && e.field === 'time') { const v = parseTime(e.time); if (v != null && v !== it.start_min) cfg.act.time(it, v); }
      if (it && e.field === 'names' && !it.is_event && norm(e.names) !== norm(namesText(it))) { ed = Object.assign({}, e, { pending: true }); await commit(null); }
      fn();
    }
    C.cancel = () => { ed = null; endDrag(false); };
    return C;
  }

  window.ScheduleRows = { create, parseTime, clusters, icon, aggStatus, NEXT, ST_NAME, openMenu, closeMenu, hm };
})();
