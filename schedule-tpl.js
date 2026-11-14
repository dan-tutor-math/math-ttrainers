/* ==========================================================
   schedule-tpl.js — шаблоны недели, устойчивые пары и группы (задача В1б).

   Подключается к schedule.js: тот отдаёт сюда состояние (st) и общие
   приёмы (разбор строки, вопрос о незнакомом имени, окно, перерисовка)
   через Schedule.init → ScheduleTpl.attach(ctx). Данные — schedule-cloud.js
   (week_templates, template_slots, template_slot_students,
   student_groups, student_group_members).

   Три раздела внутри «Расписания» (решения Даниила, schedule-audit.md):
     «Занятия»         — неделя; в шапке выпадающий список «Шаблон недели»:
                         вставить шаблон в эту неделю;
     «Шаблоны недели»  — несколько шаблонов, активный один; слоты по дням
                         со временем, форматом и учениками; создать,
                         дублировать, переименовать, удалить;
     «Пары и группы»   — завести один раз, дальше подставляется в быстрый
                         ввод и в слоты; разъединить, добавить, сменить формат.

   «Вставить шаблон» создаёт настоящие занятия (from_slot), без правил
   повтора. Занятия, что уже стоят в то же время, молча не затираются:
   окно показывает, что занято, и по умолчанию их пропускает.
   Правка пары разносится по слотам шаблонов, где она стоит (format и
   состав); уже вставленные в недели занятия не трогаются — это история.
   ========================================================== */
(function(){
  'use strict';
  let X = null;
  const attach = ctx => { X = ctx; };
  const esc = s => X.esc(s);
  const toast = m => X.api().toast(m);
  const sameSet = (a, b) => a.length === b.length && a.every(x => b.indexOf(x) >= 0);
  const byTime = (a, b) => (a.start_min == null ? -1 : a.start_min) - (b.start_min == null ? -1 : b.start_min);
  const tplCur = () => X.st.tpls.find(t => t.id === X.st.tplId) || null;
  const tplName = t => t.name || 'Без названия';
  const slotTime = s => X.timeText(s);
  const slotPeople = s => (s.is_event ? esc(s.title || 'событие') : s.people.length ? s.people.map(p => esc(X.personName(p))).join(', ') : '<span class="hint">нет учеников</span>');
  let qOpen = null;             // день недели (1–7), где открыта форма быстрого ввода слота

  /* ── выпадающий список в шапке недели ── */
  function weekMenuHtml(){
    const ts = X.st.tpls;
    return '<select class="sc-tplmenu field" id="scTplMenu" aria-label="Шаблон недели" title="Вставить шаблон в эту неделю или открыть шаблоны">' +
      '<option value="">Шаблон недели</option>' +
      (ts.length ? '<optgroup label="Вставить в эту неделю">' + ts.map(t => '<option value="ins:' + esc(t.id) + '">' + (t.is_active ? '★ ' : '') + esc(tplName(t)) + '</option>').join('') + '</optgroup>' : '') +
      '<option value="manage">Управлять шаблонами…</option></select>';
  }
  function bindWeekMenu(host){
    const sel = host.querySelector('#scTplMenu');
    if (!sel) return;
    sel.addEventListener('change', () => {
      const v = sel.value;
      sel.value = '';
      if (v === 'manage') { X.st.mode = 'tpl'; X.render(); }
      else if (v.indexOf('ins:') === 0) { const t = X.st.tpls.find(x => x.id === v.slice(4)); if (t) openInsert(t); }
    });
  }

  /* ── вставка шаблона в неделю ── */
  // занятие недели пересекается со слотом по времени (или уже пришло из этого слота)
  function clashOf(s, day){
    return X.st.lessons.find(l => l.day === day && (l.from_slot === s.id ||
      (s.start_min != null && l.start_min != null && l.start_min < s.start_min + s.dur_min && s.start_min < l.start_min + l.dur_min)));
  }
  function openInsert(t){
    const st = X.st;
    const items = t.slots.slice().sort((a, b) => a.weekday - b.weekday || byTime(a, b))
      .map(s => { const day = X.addDays(st.week, s.weekday - 1); return { s, day, clash: clashOf(s, day) }; });
    const m = X.modalShell('Вставить шаблон');
    const free = items.filter(i => !i.clash), busy = items.length - free.length;
    m.sheet.innerHTML =
      '<div class="sc-ed-head"><b>Вставить «' + esc(tplName(t)) + '»</b><button type="button" class="sc-x" aria-label="Закрыть">×</button></div>' +
      '<div class="hint">Неделя ' + esc(X.rangeText(st.week)) + '. Будут созданы настоящие занятия — их можно двигать и отмечать как обычные.</div>' +
      (items.length ? '<div class="sc-ins">' + items.map(i =>
        '<div class="sc-ins-row' + (i.clash ? ' busy' : '') + '"><b>' + X.DAY_SHORT[i.s.weekday - 1] + '</b> <span class="mono">' + esc(slotTime(i.s)) + '</span> ' + slotPeople(i.s) +
        (i.clash ? ' <span class="sc-busy">уже занято: ' + esc(X.timeText(i.clash)) + '</span>' : '') + '</div>').join('') + '</div>'
        : '<div class="empty">В шаблоне пока нет слотов.</div>') +
      '<div class="form-msg" id="insMsg"></div>' +
      '<div class="row-btns sc-ed-foot">' +
        '<button type="button" class="btn quiet" id="insCancel">Отмена</button>' +
        (busy && free.length ? '<button type="button" class="btn quiet" id="insAll">Вставить все (' + items.length + ')</button>' : '') +
        (busy && !free.length ? '<button type="button" class="btn quiet" id="insAll">Всё равно вставить (' + items.length + ')</button>' : '') +
        (free.length ? '<button type="button" class="btn" id="insFree">' + (busy ? 'Только свободные (' + free.length + ')' : 'Вставить (' + free.length + ')') + '</button>' : '') +
      '</div>';
    const q = s => m.sheet.querySelector(s);
    q('.sc-x').addEventListener('click', X.closeModal);
    q('#insCancel').addEventListener('click', X.closeModal);
    const run = async list => {
      m.sheet.querySelectorAll('button').forEach(b => { b.disabled = true; });
      let n = 0;
      try {
        for (const i of list) {
          const s = i.s;
          const l = await X.SC.addLesson({ day: i.day, start_min: s.start_min, dur_min: s.dur_min, format: s.format, is_event: s.is_event,
            title: s.title, note: s.note, group_id: s.group_id, from_slot: s.id }, s.people.map(p => p.student_id ? { student_id: p.student_id } : { guest_name: p.guest_name }));
          st.lessons.push(l); n++;
        }
      } catch (e) {
        X.render();
        if (X.getModal() === m) { q('#insMsg').textContent = 'Вставлено ' + n + ' из ' + list.length + ': ' + e.message; m.sheet.querySelectorAll('button').forEach(b => { b.disabled = false; }); }
        return;
      }
      X.closeModal(); X.render();
      toast('Вставлено занятий: ' + n);
    };
    if (q('#insFree')) q('#insFree').addEventListener('click', () => run(free));
    if (q('#insAll')) q('#insAll').addEventListener('click', () => run(items));
  }

  /* ── раздел «Шаблоны недели» ── */
  function whoHtml(t){
    const cnt = new Map(), guests = new Map();
    t.slots.forEach(s => { if (!s.is_event) s.people.forEach(p => {
      if (p.student_id) cnt.set(p.student_id, (cnt.get(p.student_id) || 0) + 1);
      else guests.set(p.guest_name, (guests.get(p.guest_name) || 0) + 1);
    }); });
    const rows = [];
    X.activeStudents().forEach(s => { if (cnt.has(s.id)) rows.push([s.name, cnt.get(s.id), false]); });
    Array.from(guests).forEach(g => rows.push([g[0], g[1], true]));
    rows.sort((a, b) => a[0].localeCompare(b[0], 'ru'));
    const none = X.activeStudents().filter(s => !cnt.has(s.id)).map(s => s.name);
    return '<details class="sc-who" id="tplWho"><summary>Кто уже в шаблоне — сколько раз в неделю</summary>' +
      (rows.length ? '<div class="sc-who-list">' + rows.map(r => '<span class="sc-chip' + (r[2] ? ' guest' : '') + '">' + esc(r[0]) + ' <b>×' + r[1] + '</b></span>').join('') + '</div>' : '<div class="hint">Пока никого.</div>') +
      (none.length ? '<div class="hint">Не поставлены: ' + none.map(esc).join(', ') + '</div>' : '') + '</details>';
  }
  function tplHtml(){
    const st = X.st, t = tplCur();
    if (!t) return '<div class="empty">Шаблонов пока нет. Шаблон — заготовка недели: слоты по дням со временем и учениками; «вставить» создаёт по ним занятия.' +
      '<div style="margin-top:10px"><button type="button" class="btn" id="tplNew">Создать шаблон</button></div></div>';
    let h = '<div class="sc-tplbar">' +
      '<select class="field" id="tplSel" aria-label="Шаблон">' + st.tpls.map(x => '<option value="' + esc(x.id) + '"' + (x.id === t.id ? ' selected' : '') + '>' + (x.is_active ? '★ ' : '') + esc(tplName(x)) + '</option>').join('') + '</select>' +
      '<input class="field" id="tplName" maxlength="80" value="' + esc(t.name) + '" aria-label="Название шаблона" placeholder="Название">' +
      '<button type="button" class="btn quiet small" id="tplNew">Новый</button>' +
      '<button type="button" class="btn quiet small" id="tplDup">Дублировать</button>' +
      (t.is_active ? '<span class="sc-act" title="Активный шаблон — тот, что стоит первым в списке вставки">★ активный</span>' : '<button type="button" class="btn quiet small" id="tplAct">Сделать активным</button>') +
      X.weekClearHtml('tpl:') +
      '<button type="button" class="btn danger small" id="tplDel">Удалить</button></div>' +
      '<div class="form-msg" id="tplMsg"></div><div class="sc-days">';
    for (let i = 1; i <= 7; i++) {
      const ls = t.slots.filter(s => s.weekday === i).sort(byTime);
      h += '<section class="sc-day" data-wd="' + i + '"><header class="sc-dh"><b>' + X.DAY_SHORT[i - 1] + '</b><span>' + X.DAY_LONG[i - 1] + '</span>' +
        '<span class="sc-cnt">' + (ls.length ? X.plural(ls.length, 'слот', 'слота', 'слотов') : '') + '</span>' +
        X.dayActions('tpl:' + i) +
        '<button type="button" class="sc-plus" data-wd="' + i + '" aria-label="Добавить слот: ' + X.DAY_LONG[i - 1] + '" title="Добавить слот">+</button></header>' +
        '<div class="sc-rows">' + (ls.length ? ls.map(s =>
          '<div class="sc-row fmt-' + s.format + '" data-slot="' + esc(s.id) + '">' +
            '<button type="button" class="sc-time" data-open="' + esc(s.id) + '" title="Открыть слот">' + esc(slotTime(s)) + '</button>' +
            '<div class="sc-people">' + slotPeople(s) + (s.group_id && X.st.groups.some(g => g.id === s.group_id) ? '<span class="sc-guest" title="Устойчивая пара или группа">' + esc(X.fmtLabel(s.format).toLowerCase()) + '</span>' : '') + '</div>' +
            (s.is_event ? '' : '<select class="sc-fmt fmt-' + s.format + '" data-slot="' + esc(s.id) + '" aria-label="Формат слота" title="' + esc(X.FMT_HINT[s.format]) + '">' +
              X.SC.FORMATS.map(f => '<option value="' + f + '"' + (f === s.format ? ' selected' : '') + '>' + esc(X.fmtLabel(f)) + '</option>').join('') + '</select>') +
          '</div>').join('') : '<div class="sc-free">пусто</div>') + '</div>' +
        '<form class="sc-quick" data-wd="' + i + '" hidden>' +
          '<input class="field" maxlength="300" placeholder="15:00 Маша, Петя" aria-label="Новый слот: время и имена через запятую" autocomplete="off">' +
          '<button class="btn small" type="submit">Добавить</button><div class="sc-qmsg form-msg"></div><div class="sc-resolve"></div></form></section>';
    }
    return h + '</div>' + whoHtml(t);
  }

  async function patchSlot(s, patch){
    const old = {};
    Object.keys(patch).forEach(k => { old[k] = s[k]; });
    Object.assign(s, patch);
    X.render();
    try { const fresh = await X.SC.updateSlot(s.id, patch); Object.assign(s, fresh); }
    catch (e) { Object.assign(s, old); toast('Не сохранилось: ' + e.message); }
    X.render();
  }
  function nextName(){
    let n = X.st.tpls.length + 1;
    while (X.st.tpls.some(t => t.name === 'Шаблон ' + n)) n++;
    return 'Шаблон ' + n;
  }
  function bindTpl(host){
    const st = X.st, t = tplCur();
    const msg = host.querySelector('#tplMsg');
    const fail = e => { if (msg) msg.textContent = e.message || String(e); else toast(e.message || String(e)); };
    host.querySelector('#tplNew').addEventListener('click', async () => {
      try {
        const nt = await X.SC.addTemplate(nextName(), !st.tpls.length, st.tpls.length);
        st.tpls.push(nt); st.tplId = nt.id; X.render();
      } catch (e) { fail(e); }
    });
    if (!t) return;
    host.querySelector('#tplSel').addEventListener('change', e => { st.tplId = e.target.value; qOpen = null; X.render(); });
    host.querySelector('#tplName').addEventListener('change', async e => {
      const v = e.target.value.trim();
      if (!v) { e.target.value = t.name; return; }
      const old = t.name; t.name = v;
      try { await X.SC.renameTemplate(t.id, v); } catch (er) { t.name = old; fail(er); }
      X.render();
    });
    host.querySelector('#tplDup').addEventListener('click', async e => {
      e.target.disabled = true;
      try {
        const nt = await X.SC.duplicateTemplate(t, (t.name || 'Шаблон') + ' (копия)', st.tpls.length);
        st.tpls.push(nt); st.tplId = nt.id; X.render();
        toast('Шаблон скопирован');
      } catch (er) { e.target.disabled = false; fail(er); X.reload(); }
    });
    const act = host.querySelector('#tplAct');
    if (act) act.addEventListener('click', async () => {
      try { await X.SC.setActiveTemplate(t.id); st.tpls.forEach(x => { x.is_active = x === t; }); X.render(); } catch (e) { fail(e); }
    });
    let armed = false;
    const del = host.querySelector('#tplDel');
    del.addEventListener('click', async () => {
      // второе нажатие — подтверждение: в шаблоне может быть вся неделя
      if (!armed) { armed = true; del.textContent = 'Точно удалить?'; return; }
      del.disabled = true;
      try {
        await X.SC.deleteTemplate(t.id);
        st.tpls = st.tpls.filter(x => x !== t);
        st.tplId = (st.tpls.find(x => x.is_active) || st.tpls[0] || {}).id || null;
        X.render(); toast('Шаблон удалён');
      } catch (e) { del.disabled = false; fail(e); }
    });
    host.querySelectorAll('.sc-plus[data-wd]').forEach(b => b.addEventListener('click', () => {
      const f = host.querySelector('.sc-quick[data-wd="' + b.dataset.wd + '"]');
      f.hidden = !f.hidden;
      qOpen = f.hidden ? null : Number(b.dataset.wd);
      if (!f.hidden) f.querySelector('input').focus();
    }));
    host.querySelectorAll('.sc-quick').forEach(f => f.addEventListener('submit', async e => {
      e.preventDefault();
      const inp = f.querySelector('input'), qm = f.querySelector('.sc-qmsg');
      qm.textContent = '';
      const wd = Number(f.dataset.wd);
      const r = await X.resolveEntry(inp.value, f.querySelector('.sc-resolve'), null);
      if (r.msg) { qm.textContent = r.msg; return; }
      if (r.cancelled) return;
      try {
        const s = await X.SC.addSlot(t.id, { weekday: wd, start_min: r.start, dur_min: r.dur, format: r.format, group_id: r.group_id, is_event: !!r.is_event, title: r.title || '' }, r.people);
        t.slots.push(s);
      } catch (er) { qm.textContent = er.message; return; }
      qOpen = wd;
      X.render();
      const nf = host.querySelector('.sc-quick[data-wd="' + wd + '"]');
      if (nf) nf.querySelector('input').focus();
    }));
    host.querySelectorAll('select.sc-fmt[data-slot]').forEach(sel => sel.addEventListener('change', () => {
      const s = t.slots.find(x => x.id === sel.dataset.slot);
      if (s) patchSlot(s, { format: sel.value });
    }));
    host.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => {
      const s = t.slots.find(x => x.id === b.dataset.open);
      if (s) openSlot(s);
    }));
    if (qOpen) {
      const f = host.querySelector('.sc-quick[data-wd="' + qOpen + '"]');
      if (f) f.hidden = false;
    }
  }

  /* ── карточка слота ── */
  function openSlot(s){
    const t = tplCur();
    const m = X.modalShell('Слот шаблона');
    m.slotId = s.id;
    m.sheet.innerHTML =
      '<div class="sc-ed-head"><b>Слот шаблона</b><button type="button" class="sc-x" aria-label="Закрыть">×</button></div>' +
      '<div class="sc-ed-grid">' +
        '<label><span class="label">День</span><select class="field" id="slDay">' + X.DAY_LONG.map((d, i) => '<option value="' + (i + 1) + '">' + d + '</option>').join('') + '</select></label>' +
        '<label><span class="label">С</span><input class="field" type="time" step="900" id="slStart"></label>' +
        '<label><span class="label">До</span><input class="field" type="time" step="900" id="slEnd"></label>' +
      '</div>' +
      (s.is_event
        ? '<label><span class="label">Название</span><input class="field sc-edtitle" id="slTitle" maxlength="200" placeholder="Созвон, врач, вебинар…"></label>' +
          '<div class="hint">Событие не считается занятием: не доход и не часы.</div>'
        : '<div class="label">Формат</div><div class="seg sc-edfmt" id="slFmt"></div><div class="hint" id="slHint"></div>' +
          '<div class="label" style="margin-top:12px">Ученики</div><div class="sc-edpeople" id="slPeople"></div>' +
          '<form id="slAddForm" class="sc-addrow"><input class="field" id="slAdd" maxlength="300" placeholder="Добавить: Маша, Петя" aria-label="Добавить учеников" autocomplete="off">' +
            '<button class="btn quiet" type="submit">Добавить</button></form>') +
      '<div class="form-msg" id="slMsg"></div><div class="sc-resolve" id="slResolve"></div>' +
      '<div class="row-btns sc-ed-foot"><button type="button" class="btn danger" id="slDel">Удалить слот</button><button type="button" class="btn" id="slDone">Готово</button></div>';
    const q = sel => m.sheet.querySelector(sel);
    q('.sc-x').addEventListener('click', X.closeModal);
    q('#slDone').addEventListener('click', X.closeModal);
    q('#slDay').addEventListener('change', e => patchSlot(s, { weekday: Number(e.target.value) }).then(paint));
    q('#slStart').addEventListener('change', e => {
      const v = X.readTime(e.target.value);
      if (v != null) patchSlot(s, { start_min: v, dur_min: Math.min(s.dur_min, 1440 - v) }).then(paint);
    });
    q('#slEnd').addEventListener('change', e => {
      const v = X.readTime(e.target.value);
      if (v == null || s.start_min == null) return;
      if (v <= s.start_min) { q('#slMsg').textContent = 'Конец должен быть позже начала'; paint(); return; }
      q('#slMsg').textContent = '';
      patchSlot(s, { dur_min: v - s.start_min }).then(paint);
    });
    if (s.is_event) q('#slTitle').addEventListener('change', e => {
      const v = e.target.value.trim().replace(/\s+/g, ' ');
      if (!v) { e.target.value = s.title; return; }
      if (v !== s.title) patchSlot(s, { title: v }).then(paint);
    });
    if (!s.is_event) q('#slAddForm').addEventListener('submit', async e => {
      e.preventDefault();
      const names = X.parseQuick(q('#slAdd').value).names;
      if (!names.length) return;
      const people = await X.resolveNames(names, q('#slResolve'));
      if (!people || X.getModal() !== m) return;
      const fresh = people.filter(p => p.student_id ? !s.people.some(x => x.student_id === p.student_id) : !s.people.some(x => x.guest_name === p.guest_name));
      if (!fresh.length) { q('#slAdd').value = ''; return; }
      try {
        const rows = await X.SC.addSlotPeople(s.id, fresh, s.people.reduce((mx, p) => Math.max(mx, p.pos + 1), 0));
        s.people = s.people.concat(rows).sort((a, b) => a.pos - b.pos);
        q('#slAdd').value = '';
        X.render(); paint();
      } catch (er) { q('#slMsg').textContent = er.message; }
    });
    let armed = false;
    q('#slDel').addEventListener('click', async () => {
      if (!armed) { armed = true; q('#slDel').textContent = 'Точно удалить?'; return; }
      q('#slDel').disabled = true;
      try { await X.SC.deleteSlot(s.id); t.slots = t.slots.filter(x => x !== s); X.closeModal(); X.render(); }
      catch (er) { q('#slMsg').textContent = er.message; q('#slDel').disabled = false; }
    });
    function paint(){
      if (X.getModal() !== m) return;
      const setv = (sel, v) => { const el = q(sel); if (el && document.activeElement !== el) el.value = v; };
      setv('#slDay', String(s.weekday));
      setv('#slStart', X.timeVal(s.start_min));
      setv('#slEnd', s.start_min == null ? '' : X.timeVal(Math.min(1440, s.start_min + s.dur_min)));
      if (s.is_event) { setv('#slTitle', s.title || ''); return; }
      q('#slFmt').innerHTML = X.SC.FORMATS.map(f => '<button type="button" data-v="' + f + '" class="' + (f === s.format ? 'on' : '') + '" title="' + esc(X.FMT_HINT[f]) + '">' + esc(X.fmtLabel(f)) + '</button>').join('');
      const g = s.group_id && X.st.groups.find(x => x.id === s.group_id);
      q('#slHint').innerHTML = esc(X.fmtLabel(s.format) + ' — ' + X.FMT_HINT[s.format]) +
        (g ? ' · из «' + esc(g.name) + '» <button type="button" class="btn quiet small" id="slUnlink" title="Слот перестанет следовать за этой парой">Отвязать от пары</button>' : '');
      q('#slFmt').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { if (b.dataset.v !== s.format) patchSlot(s, { format: b.dataset.v }).then(paint); }));
      const un = q('#slUnlink');
      if (un) un.addEventListener('click', () => patchSlot(s, { group_id: null }).then(paint));
      q('#slPeople').innerHTML = s.people.length ? s.people.map(p =>
        '<div class="sc-edp"><span class="nm">' + esc(X.personName(p)) + (p.student_id ? '' : ' <span class="sc-guest">гость</span>') + '</span>' +
        '<button type="button" class="sc-rm" data-rm="' + esc(p.id) + '" aria-label="Убрать из слота: ' + esc(X.personName(p)) + '" title="Убрать из слота">×</button></div>').join('') : '<div class="hint">Учеников нет — добавьте ниже.</div>';
      q('#slPeople').querySelectorAll('.sc-rm').forEach(b => b.addEventListener('click', async () => {
        const p = s.people.find(x => x.id === b.dataset.rm);
        if (!p) return;
        s.people = s.people.filter(x => x !== p);
        X.render(); paint();
        try { await X.SC.removeSlotPerson(p.id); }
        catch (er) { s.people.push(p); s.people.sort((a, b2) => a.pos - b2.pos); toast('Не сохранилось: ' + er.message); X.render(); paint(); }
      }));
    }
    paint();
  }

  /* ── раздел «Пары и группы» ── */
  const autoName = ids => ids.map(id => (X.st.byId[id] || { name: '?' }).name).join(' + ');
  const cntSlots = g => X.st.tpls.reduce((n, t) => n + t.slots.filter(s => s.group_id === g.id).length, 0);
  function groupsHtml(){
    const gs = X.st.groups.filter(g => !g.archived_at);
    return '<div class="hint">Пару или группу заводят один раз: «Маша, Петя» → пара. Дальше её название («Маша + Петя») или просто те же имена в быстром вводе и в слотах шаблона сразу ставят формат и состав. Правка здесь доходит до слотов шаблонов.</div>' +
      '<form id="grpNew" class="sc-addrow"><input class="field" id="grpNames" maxlength="300" placeholder="Маша, Петя" aria-label="Ученики новой пары или группы через запятую" autocomplete="off">' +
        '<button class="btn" type="submit">Создать</button></form>' +
      '<div class="form-msg" id="grpMsg"></div><div class="sc-resolve" id="grpResolve"></div>' +
      '<div class="sc-groups">' + (gs.length ? gs.map(g =>
        '<div class="sc-grp fmt-' + g.format + '" data-g="' + esc(g.id) + '">' +
          '<div class="sc-grp-top">' +
            '<input class="field grp-name" maxlength="80" value="' + esc(g.name) + '" aria-label="Название">' +
            '<select class="field grp-fmt" aria-label="Формат">' + X.SC.GROUP_FORMATS.map(f => '<option value="' + f + '"' + (f === g.format ? ' selected' : '') + '>' + esc(X.fmtLabel(f)) + '</option>').join('') + '</select>' +
            '<label class="sc-dur"><input class="field grp-dur" type="number" min="5" max="720" step="5" value="' + (g.dur_min || '') + '" placeholder="мин" aria-label="Длительность, минут"></label>' +
          '</div>' +
          '<div class="sc-grp-mem">' + g.members.map(id => '<span class="sc-chip">' + esc((X.st.byId[id] || { name: 'ученик удалён' }).name) +
            ' <button type="button" class="sc-rm" data-rm="' + esc(id) + '" aria-label="Убрать из «' + esc(g.name) + '»: ' + esc((X.st.byId[id] || { name: '' }).name) + '" title="Убрать из состава">×</button></span>').join('') + '</div>' +
          '<form class="sc-addrow grp-add"><input class="field" maxlength="300" placeholder="Добавить: Вася" aria-label="Добавить в состав" autocomplete="off"><button class="btn quiet small" type="submit">Добавить</button></form>' +
          '<div class="sc-grp-foot"><span class="hint">' + (cntSlots(g) ? 'В слотах шаблонов: ' + cntSlots(g) : 'В шаблонах пока не стоит') + '</span>' +
            '<button type="button" class="btn danger small grp-del" title="Пара перестанет существовать; ученики, слоты и занятия остаются">Разъединить</button></div>' +
          '<div class="form-msg grp-msg"></div><div class="sc-resolve"></div>' +
        '</div>').join('') : '<div class="empty">Пар и групп пока нет.</div>') + '</div>';
  }
  // правка пары доходит до слотов, где она стоит: формат и состав
  async function propagate(g){
    let n = 0;
    const want = g.members.map(id => ({ student_id: id }));
    for (const t of X.st.tpls) for (const s of t.slots) {
      if (s.group_id !== g.id) continue;
      const have = s.people.map(p => p.student_id);
      if (s.format !== g.format) { const f = await X.SC.updateSlot(s.id, { format: g.format }); Object.assign(s, f); }
      if (!have.every(Boolean) || !sameSet(have, g.members)) { s.people = await X.SC.setSlotPeople(s.id, want); }
      n++;
    }
    return n;
  }
  function bindGroups(host){
    const st = X.st;
    host.querySelector('#grpNew').addEventListener('submit', async e => {
      e.preventDefault();
      const msg = host.querySelector('#grpMsg'), inp = host.querySelector('#grpNames');
      msg.textContent = '';
      const names = X.parseQuick(inp.value).names;
      if (!names.length) { msg.textContent = 'Напишите имена: «Маша, Петя»'; return; }
      const res = await X.resolveNames(names, host.querySelector('#grpResolve'), { noGuest: true });
      if (!res) return;
      const ids = [];
      res.forEach(p => { if (p.student_id && ids.indexOf(p.student_id) < 0) ids.push(p.student_id); });
      if (ids.length < 2) { msg.textContent = 'В паре или группе нужно хотя бы двое'; return; }
      const dup = st.groups.find(g => !g.archived_at && sameSet(g.members, ids));
      if (dup) { msg.textContent = 'Такая пара уже есть: «' + dup.name + '»'; return; }
      try {
        const g = await X.SC.addGroup({ name: autoName(ids), format: ids.length >= 3 ? 'group' : 'pair' }, ids);
        st.groups.push(g); X.render();
        toast('Создано: ' + X.fmtLabel(g.format).toLowerCase() + ' «' + g.name + '»');
      } catch (er) { msg.textContent = er.message; }
    });
    host.querySelectorAll('.sc-grp').forEach(card => {
      const g = st.groups.find(x => x.id === card.dataset.g);
      if (!g) return;
      const msg = card.querySelector('.grp-msg');
      const fail = er => { msg.textContent = er.message || String(er); };
      // сохранить поля пары и разнести по слотам; при ошибке вернуть как было
      const save = async (patch, members) => {
        const old = { name: g.name, format: g.format, dur_min: g.dur_min, members: g.members.slice() };
        try {
          if (members) {
            await X.SC.setGroupMembers(g.id, g.members, members);
            const prevAuto = autoName(g.members);
            g.members = members;
            // подпись «пара» ↔ «группа» следует за числом учеников, пока формат не выбран иначе
            if (g.format === 'pair' && members.length >= 3) patch = Object.assign({ format: 'group' }, patch);
            else if (g.format === 'group' && members.length === 2) patch = Object.assign({ format: 'pair' }, patch);
            if (g.name === prevAuto) patch = Object.assign({ name: autoName(members) }, patch);
          }
          if (patch && Object.keys(patch).length) Object.assign(g, await X.SC.updateGroup(g.id, patch));
          const n = await propagate(g);
          X.render();
          if (n) toast('Обновлено слотов в шаблонах: ' + n);
        } catch (er) { Object.assign(g, old); fail(er); X.reload(); }
      };
      card.querySelector('.grp-name').addEventListener('change', e => { const v = e.target.value.trim(); if (!v) { e.target.value = g.name; return; } save({ name: v }); });
      card.querySelector('.grp-fmt').addEventListener('change', e => save({ format: e.target.value }));
      card.querySelector('.grp-dur').addEventListener('change', e => save({ dur_min: e.target.value }));
      card.querySelectorAll('.sc-rm').forEach(b => b.addEventListener('click', () => save({}, g.members.filter(id => id !== b.dataset.rm))));
      card.querySelector('.grp-add').addEventListener('submit', async e => {
        e.preventDefault();
        const names = X.parseQuick(card.querySelector('.grp-add input').value).names;
        if (!names.length) return;
        const res = await X.resolveNames(names, card.querySelector('.sc-resolve'), { noGuest: true });
        if (!res) return;
        const add = res.map(p => p.student_id).filter((id, i, a) => id && g.members.indexOf(id) < 0 && a.indexOf(id) === i);
        if (!add.length) { msg.textContent = 'Эти ученики уже в составе'; return; }
        save({}, g.members.concat(add));
      });
      let armed = false;
      const del = card.querySelector('.grp-del');
      del.addEventListener('click', async () => {
        if (!armed) { armed = true; del.textContent = 'Точно разъединить?'; return; }
        del.disabled = true;
        try {
          await X.SC.deleteGroup(g.id);
          st.groups = st.groups.filter(x => x !== g);
          st.tpls.forEach(t => t.slots.forEach(s => { if (s.group_id === g.id) s.group_id = null; }));
          st.lessons.forEach(l => { if (l.group_id === g.id) l.group_id = null; });
          X.render(); toast('Разъединено: «' + g.name + '»');
        } catch (er) { del.disabled = false; fail(er); }
      });
    });
  }

  /* ── дни шаблона для действий дня (буфер, очистить, все часы, событие) ──
     Сами кнопки и вопросы — в schedule.js (dayActions): они общие с днями
     расписания, отсюда только чтение и запись слотов текущего шаблона */
  const dayKind = {
    items: wd => { const t = tplCur(); return t ? t.slots.filter(s => s.weekday === Number(wd)).sort(byTime) : []; },
    all: () => { const t = tplCur(); return t ? t.slots.slice() : []; },
    name: () => { const t = tplCur(); return t ? tplName(t) : ''; },
    label: wd => X.DAY_LONG[Number(wd) - 1] + ' шаблона «' + (tplCur() ? tplName(tplCur()) : '') + '»',
    noun: n => X.plural(n, 'слот', 'слота', 'слотов'),
    start: id => { const t = tplCur(), s = t && t.slots.find(x => x.id === id); return s ? s.start_min : null; },
    async remove(list){
      const t = tplCur(), ids = new Set(list.map(s => s.id));
      await X.SC.deleteSlots(Array.from(ids));
      if (t) t.slots = t.slots.filter(s => !ids.has(s.id));
    },
    async insert(wd, items){
      const t = tplCur();
      if (!t) return 0;
      const ss = await X.SC.addSlots(t.id, items.map(it => ({ f: Object.assign({}, it, { weekday: Number(wd) }), people: it.people })));
      t.slots = t.slots.concat(ss);
      return ss.length;
    },
    // быстрый ввод слота с готовым началом строки: «10:00 », «◆ »
    openQuick(wd, text){
      qOpen = Number(wd);
      X.render();
      const f = document.querySelector('.sc-quick[data-wd="' + Number(wd) + '"]');
      if (!f) return false;
      f.hidden = false;
      const i = f.querySelector('input');
      i.value = text; i.focus(); i.setSelectionRange(text.length, text.length);
      return true;
    },
    newEvent(wd){ dayKind.openQuick(wd, '◆ '); },
  };

  function paneHtml(){ return X.st.mode === 'groups' ? groupsHtml() : tplHtml(); }
  function bindPane(host){ if (X.st.mode === 'groups') bindGroups(host); else bindTpl(host); }

  window.ScheduleTpl = { attach, weekMenuHtml, bindWeekMenu, paneHtml, bindPane, openInsert, dayKind };
})();
