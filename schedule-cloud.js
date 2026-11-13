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

  window.ScheduleCloud = { FORMATS, STATUSES, listRange, addLesson, updateLesson, deleteLesson, addPeople, setStatus, removePerson };
})();
