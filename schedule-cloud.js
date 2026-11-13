/* ==========================================================
   schedule-cloud.js — занятия расписания и база Supabase (задача В1а).

   Таблицы lessons и lesson_students (cabinet-schema.sql); поля берём
   оттуда, чужих не выдумываем. Клиент, вход и ошибки — общие с
   cabinet-cloud.js (CabinetCloud): одна сессия, один текст ошибок.

   Права — RLS «вижу только свои строки»: owner база ставит сама
   (default auth.uid()), поэтому в запросах его нет.

   Почему два запроса, а не вложенный select('*, lesson_students(*)'):
   так запрос не зависит от того, как PostgREST угадывает связь по
   составному ключу (lesson_id, owner), и так же устроена заглушка теста.

   Записи идут по очереди (writeChain): плашку двигают быстро, и второе
   перемещение не должно обогнать первое на сервере.
   ========================================================== */
(function(){
  const C = window.CabinetCloud;
  const LESSON_COLS = 'id, day, start_min, dur_min, format, is_event, title, note, board_id, group_id, from_slot, ext_id, updated_at';
  const LS_COLS = 'id, lesson_id, student_id, guest_name, status, pos';
  const FORMATS = ['single', 'pair', 'group', 'semi'];
  const STATUSES = ['plan', 'done', 'skip', 'move'];

  function need(){
    const c = C && C.client();
    if (!c) throw new C.CabinetError({ message: 'no_config' });
    return c;
  }
  async function run(p){
    let res;
    try { res = await p; } catch (e) { throw new C.CabinetError(e); }
    if (res.error) throw new C.CabinetError(res.error);
    return res.data;
  }
  let writeChain = Promise.resolve();
  function serial(fn){
    const p = writeChain.catch(() => {}).then(fn);
    writeChain = p;
    return p;
  }

  // поля занятия — только те, что есть в базе, и в её границах: база всё
  // равно отвергнет лишнее, а понятнее отказать до сети
  function cleanLesson(f){
    const o = {};
    if ('day' in f) o.day = String(f.day);
    if ('start_min' in f) {
      const n = f.start_min == null || f.start_min === '' ? null : Math.round(Number(f.start_min));
      o.start_min = n == null || !(n >= 0 && n <= 1439) ? null : n;
    }
    if ('dur_min' in f) { const n = Math.round(Number(f.dur_min)); o.dur_min = Math.min(720, Math.max(5, n || 60)); }
    if ('format' in f) o.format = FORMATS.indexOf(f.format) >= 0 ? f.format : 'single';
    if ('title' in f) o.title = String(f.title || '').slice(0, 200);
    if ('note' in f) o.note = String(f.note || '').slice(0, 2000);
    if ('is_event' in f) o.is_event = !!f.is_event;
    // откуда занятие: слот шаблона и устойчивая пара/группа (В1б)
    if ('from_slot' in f) o.from_slot = f.from_slot || null;
    if ('group_id' in f) o.group_id = f.group_id || null;
    return o;
  }
  // участник: либо ученик из students, либо гость по имени (не заводим
  // ученика молча — schedule-audit.md)
  function cleanPerson(p, lessonId, pos){
    const o = { lesson_id: lessonId, pos: pos || 0, status: STATUSES.indexOf(p.status) >= 0 ? p.status : 'plan' };
    if (p.student_id) { o.student_id = String(p.student_id); o.guest_name = null; }
    else { o.student_id = null; o.guest_name = String(p.guest_name || '').trim().replace(/\s+/g, ' ').slice(0, 80); }
    return o;
  }

  /* ── чтение: неделя (или любой отрезок дней) ── */
  async function listRange(fromDay, toDay){
    const c = need();
    const lessons = await run(c.from('lessons').select(LESSON_COLS)
      .gte('day', fromDay).lte('day', toDay).order('day', { ascending: true }).order('start_min', { ascending: true }));
    const ids = (lessons || []).map(l => l.id);
    const people = ids.length ? await run(c.from('lesson_students').select(LS_COLS).in('lesson_id', ids).order('pos', { ascending: true })) : [];
    const by = {};
    (people || []).forEach(p => { (by[p.lesson_id] = by[p.lesson_id] || []).push(p); });
    return (lessons || []).map(l => Object.assign({}, l, { people: (by[l.id] || []).sort((a, b) => a.pos - b.pos) }));
  }

  /* ── занятие ── */
  // f — поля занятия, people — [{student_id} | {guest_name}]. Участники не
  // встали — занятие удаляем: пустая плашка без объяснения хуже ошибки
  function addLesson(f, people){
    return serial(async () => {
      const c = need();
      const l = await run(c.from('lessons').insert(cleanLesson(f)).select(LESSON_COLS).single());
      let rows = [];
      if (people && people.length) {
        try {
          rows = await run(c.from('lesson_students').insert(people.map((p, i) => cleanPerson(p, l.id, i))).select(LS_COLS));
        } catch (e) {
          try { await run(c.from('lessons').delete().eq('id', l.id)); } catch (e2) {}
          throw e;
        }
      }
      return Object.assign({}, l, { people: (rows || []).sort((a, b) => a.pos - b.pos) });
    });
  }
  function updateLesson(id, patch){
    return serial(() => run(need().from('lessons').update(cleanLesson(patch)).eq('id', id).select(LESSON_COLS).single()));
  }
  function deleteLesson(id){
    // участники уходят каскадом (внешний ключ on delete cascade)
    return serial(() => run(need().from('lessons').delete().eq('id', id)));
  }

  /* ── участники ── */
  function addPeople(lessonId, people, fromPos){
    return serial(() => run(need().from('lesson_students')
      .insert(people.map((p, i) => cleanPerson(p, lessonId, (fromPos || 0) + i))).select(LS_COLS)));
  }
  function setStatus(personId, status){
    if (STATUSES.indexOf(status) < 0) status = 'plan';
    return serial(() => run(need().from('lesson_students').update({ status }).eq('id', personId).select(LS_COLS).single()));
  }
  function removePerson(personId){
    return serial(() => run(need().from('lesson_students').delete().eq('id', personId)));
  }

  /* ══ В1б: устойчивые пары и группы ══
     student_groups + student_group_members. В группе только ученики из
     students (гостя без карточки в паре держать негде — так в схеме) */
  const GROUP_COLS = 'id, name, format, dur_min, note, archived_at, updated_at';
  const GROUP_FORMATS = ['pair', 'group', 'semi'];
  function cleanGroup(f){
    const o = {};
    if ('name' in f) o.name = String(f.name || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    if ('format' in f) o.format = GROUP_FORMATS.indexOf(f.format) >= 0 ? f.format : 'pair';
    if ('dur_min' in f) { const n = f.dur_min == null || f.dur_min === '' ? null : Math.round(Number(f.dur_min)); o.dur_min = n && n >= 5 && n <= 720 ? n : null; }
    if ('note' in f) o.note = String(f.note || '').slice(0, 2000);
    return o;
  }
  async function listGroups(){
    const c = need();
    const gs = await run(c.from('student_groups').select(GROUP_COLS).order('created_at', { ascending: true }));
    const ids = (gs || []).map(g => g.id);
    const ms = ids.length ? await run(c.from('student_group_members').select('group_id, student_id, pos').in('group_id', ids).order('pos', { ascending: true })) : [];
    const by = {};
    (ms || []).forEach(m => { (by[m.group_id] = by[m.group_id] || []).push(m); });
    return (gs || []).map(g => Object.assign({}, g, { members: (by[g.id] || []).sort((a, b) => a.pos - b.pos).map(m => m.student_id) }));
  }
  function addGroup(f, studentIds){
    return serial(async () => {
      const c = need();
      const g = await run(c.from('student_groups').insert(cleanGroup(f)).select(GROUP_COLS).single());
      try {
        if (studentIds && studentIds.length) await run(c.from('student_group_members').insert(studentIds.map((id, i) => ({ group_id: g.id, student_id: id, pos: i }))));
      } catch (e) {
        try { await run(c.from('student_groups').delete().eq('id', g.id)); } catch (e2) {}
        throw e;
      }
      return Object.assign({}, g, { members: (studentIds || []).slice() });
    });
  }
  function updateGroup(id, patch){
    return serial(() => run(need().from('student_groups').update(cleanGroup(patch)).eq('id', id).select(GROUP_COLS).single()));
  }
  // состав меняем разницей (убрали / добавили), а не «всё удалить и вставить»:
  // обрыв посередине не оставит пару пустой
  function setGroupMembers(id, oldIds, newIds){
    return serial(async () => {
      const c = need();
      const gone = oldIds.filter(x => newIds.indexOf(x) < 0), add = newIds.filter(x => oldIds.indexOf(x) < 0);
      if (gone.length) await run(c.from('student_group_members').delete().eq('group_id', id).in('student_id', gone));
      if (add.length) await run(c.from('student_group_members').insert(add.map((sid, i) => ({ group_id: id, student_id: sid, pos: newIds.indexOf(sid) }))));
    });
  }
  function deleteGroup(id){ return serial(() => run(need().from('student_groups').delete().eq('id', id))); }

  /* ══ В1б: шаблоны недели ══
     week_templates → template_slots → template_slot_students. Активный
     шаблон один (частичный уникальный индекс): сначала снимаем флаг с
     прежнего, потом ставим новому */
  const TPL_COLS = 'id, name, is_active, pos';
  const SLOT_COLS = 'id, template_id, weekday, start_min, dur_min, format, is_event, title, note, group_id, pos';
  const SP_COLS = 'id, slot_id, student_id, guest_name, pos';
  function cleanSlot(f){
    const o = cleanLesson(f);
    delete o.day; delete o.from_slot;
    if ('weekday' in f) { const n = Math.round(Number(f.weekday)); o.weekday = n >= 1 && n <= 7 ? n : 1; }
    return o;
  }
  function slotPerson(p, slotId, pos){
    const o = { slot_id: slotId, pos: pos || 0 };
    if (p.student_id) { o.student_id = String(p.student_id); o.guest_name = null; }
    else { o.student_id = null; o.guest_name = String(p.guest_name || '').trim().replace(/\s+/g, ' ').slice(0, 80); }
    return o;
  }
  async function listTemplates(){
    const c = need();
    const ts = await run(c.from('week_templates').select(TPL_COLS).order('pos', { ascending: true }).order('created_at', { ascending: true }));
    const ids = (ts || []).map(t => t.id);
    const slots = ids.length ? await run(c.from('template_slots').select(SLOT_COLS).in('template_id', ids).order('weekday', { ascending: true }).order('start_min', { ascending: true })) : [];
    const sids = (slots || []).map(s => s.id);
    const ps = sids.length ? await run(c.from('template_slot_students').select(SP_COLS).in('slot_id', sids).order('pos', { ascending: true })) : [];
    const pBy = {}, sBy = {};
    (ps || []).forEach(p => { (pBy[p.slot_id] = pBy[p.slot_id] || []).push(p); });
    (slots || []).forEach(s => { (sBy[s.template_id] = sBy[s.template_id] || []).push(Object.assign({}, s, { people: (pBy[s.id] || []).sort((a, b) => a.pos - b.pos) })); });
    return (ts || []).map(t => Object.assign({}, t, { slots: sBy[t.id] || [] }));
  }
  function addTemplate(name, active, pos){
    return serial(async () => {
      const c = need();
      if (active) await run(c.from('week_templates').update({ is_active: false }).eq('is_active', true));
      const t = await run(c.from('week_templates').insert({ name: String(name || '').trim().slice(0, 80), is_active: !!active, pos: pos || 0 }).select(TPL_COLS).single());
      return Object.assign({}, t, { slots: [] });
    });
  }
  function renameTemplate(id, name){
    return serial(() => run(need().from('week_templates').update({ name: String(name || '').trim().slice(0, 80) }).eq('id', id).select(TPL_COLS).single()));
  }
  function deleteTemplate(id){ return serial(() => run(need().from('week_templates').delete().eq('id', id))); }
  function setActiveTemplate(id){
    return serial(async () => {
      const c = need();
      await run(c.from('week_templates').update({ is_active: false }).eq('is_active', true));
      await run(c.from('week_templates').update({ is_active: true }).eq('id', id));
    });
  }
  function addSlot(tplId, f, people){
    return serial(async () => {
      const c = need();
      const s = await run(c.from('template_slots').insert(Object.assign(cleanSlot(f), { template_id: tplId })).select(SLOT_COLS).single());
      let rows = [];
      if (people && people.length) {
        try { rows = await run(c.from('template_slot_students').insert(people.map((p, i) => slotPerson(p, s.id, i))).select(SP_COLS)); }
        catch (e) { try { await run(c.from('template_slots').delete().eq('id', s.id)); } catch (e2) {} throw e; }
      }
      return Object.assign({}, s, { people: (rows || []).sort((a, b) => a.pos - b.pos) });
    });
  }
  function updateSlot(id, patch){
    return serial(() => run(need().from('template_slots').update(cleanSlot(patch)).eq('id', id).select(SLOT_COLS).single()));
  }
  function deleteSlot(id){ return serial(() => run(need().from('template_slots').delete().eq('id', id))); }
  function addSlotPeople(slotId, people, fromPos){
    return serial(() => run(need().from('template_slot_students').insert(people.map((p, i) => slotPerson(p, slotId, (fromPos || 0) + i))).select(SP_COLS)));
  }
  function removeSlotPerson(id){ return serial(() => run(need().from('template_slot_students').delete().eq('id', id))); }
  // состав слота целиком (правка пары разносится по слотам, где она стоит)
  function setSlotPeople(slotId, people){
    return serial(async () => {
      const c = need();
      await run(c.from('template_slot_students').delete().eq('slot_id', slotId));
      return people.length ? await run(c.from('template_slot_students').insert(people.map((p, i) => slotPerson(p, slotId, i))).select(SP_COLS)) : [];
    });
  }
  // копия шаблона: слоты и их участники; уникальных ext_id копия не берёт
  async function duplicateTemplate(t, name, pos){
    const nt = await addTemplate(name, false, pos);
    for (const s of t.slots) {
      const ns = await addSlot(nt.id, s, s.people);
      nt.slots.push(ns);
    }
    return nt;
  }

  window.ScheduleCloud = { FORMATS, STATUSES, GROUP_FORMATS, listRange, addLesson, updateLesson, deleteLesson, addPeople, setStatus, removePerson,
    listGroups, addGroup, updateGroup, setGroupMembers, deleteGroup,
    listTemplates, addTemplate, renameTemplate, deleteTemplate, setActiveTemplate, addSlot, updateSlot, deleteSlot, addSlotPeople, removeSlotPerson, setSlotPeople, duplicateTemplate };
})();
