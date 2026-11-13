/* ==========================================================
   cabinet-cloud.js — кабинет преподавателя и база Supabase (задача А4).

   Читает и пишет students и teacher_settings (cabinet-schema.sql); поля
   берём оттуда, чужих не выдумываем. Права — RLS «вижу только свои
   строки», поэтому в запросах нет фильтра по owner: owner база подставляет
   сама (default auth.uid()). Вход — тот же ключ сессии, что у досок и
   «Работ»: вошёл там — здесь уже вошёл.

   Образец — works-cloud.js. Сеть пропала — ошибка с code 'network'.
   ========================================================== */
(function(){
  const cfg = window.SUPABASE_CONFIG || {};
  let sb = null;
  function client(){
    if (sb) return sb;
    if (!cfg.url || !cfg.anonKey || !window.supabase) return null;
    sb = (window.rtGuard || (c => c))(window.supabase.createClient(cfg.url, cfg.anonKey));
    return sb;
  }

  function codeOf(err){
    const msg = String((err && (err.message || err.error_description)) || err || '');
    if (/no_config/.test(msg)) return 'no_config';
    if (/fetch|network|load failed|timeout/i.test(msg) || (err && err.name === 'TypeError')) return 'network';
    if (/invalid login|credentials/i.test(msg)) return 'bad_login';
    return 'other';
  }
  function errorText(err){
    const c = codeOf(err);
    if (c === 'no_config') return 'Нет настроек подключения к серверу (supabase-config.js)';
    if (c === 'network') return 'Нет связи с сервером';
    if (c === 'bad_login') return 'Не подошли почта или пароль';
    return 'Ошибка сервера: ' + String((err && err.message) || err || 'неизвестно');
  }
  class CabinetError extends Error {
    constructor(err){ super(errorText(err)); this.code = codeOf(err); this.raw = err; }
  }
  // запрос supabase-js возвращает {data, error}; сетевой сбой — исключение
  async function run(p){
    let res;
    try { res = await p; } catch (e) { throw new CabinetError(e); }
    if (res.error) throw new CabinetError(res.error);
    return res.data;
  }
  function need(){
    const c = client();
    if (!c) throw new CabinetError({ message: 'no_config' });
    return c;
  }

  /* ── вход ── */
  async function currentUser(){
    const c = client();
    if (!c) return null;
    try { const { data } = await c.auth.getSession(); return data && data.session ? data.session.user : null; }
    catch (e) { return null; }
  }
  async function signIn(email, password){
    const c = need();
    let res;
    try { res = await c.auth.signInWithPassword({ email, password }); } catch (e) { throw new CabinetError(e); }
    if (res.error) throw new CabinetError(res.error);
    return res.data.user;
  }
  async function signOut(){ const c = client(); if (c) await c.auth.signOut(); }

  /* ── ученики ── */
  const STUDENT_COLS = 'id, name, grade, exam, note, boards, account_email, dur_min, archived_at, created_at, updated_at';
  // все ученики, включая архивных: архив прячет страница, а не запрос —
  // так «показать архив» не ходит в сеть второй раз
  async function listStudents(){
    return run(need().from('students').select(STUDENT_COLS).order('name', { ascending: true }));
  }
  async function getStudent(id){
    return run(need().from('students').select(STUDENT_COLS).eq('id', id).single());
  }
  // f: { name, grade?, exam?, note?, boards?, dur_min? }
  async function addStudent(f){
    return run(need().from('students').insert(clean(f)).select(STUDENT_COLS).single());
  }
  async function updateStudent(id, patch){
    return run(need().from('students').update(clean(patch)).eq('id', id).select(STUDENT_COLS).single());
  }
  async function setArchived(id, archived){
    return updateStudent(id, { archived_at: archived ? new Date().toISOString() : null });
  }
  // пустые строки — это «не задано» (null), а не пустое значение: база для
  // класса и экзамена проверяет длину, а длительность — числом
  function clean(f){
    const o = {};
    if ('name' in f) o.name = String(f.name || '').trim().replace(/\s+/g, ' ');
    if ('grade' in f) o.grade = String(f.grade || '').trim() || null;
    if ('exam' in f) o.exam = String(f.exam || '').trim() || null;
    if ('note' in f) o.note = String(f.note || '');
    if ('boards' in f) o.boards = Array.isArray(f.boards) ? f.boards.map(String) : [];
    if ('dur_min' in f) { const n = Math.round(Number(f.dur_min)); o.dur_min = n >= 5 && n <= 720 ? n : null; }
    if ('archived_at' in f) o.archived_at = f.archived_at;
    return o;
  }

  /* ── доски преподавателя: для привязки к ученику ── */
  // id и название; удалённые в корзину не предлагаем. Колонки trashed_at в
  // старой базе могло не быть — тогда второй запрос без неё (как в boards-cloud.js)
  async function listBoards(){
    const c = need();
    let r;
    try { r = await c.from('boards').select('id, title, trashed_at'); } catch (e) { throw new CabinetError(e); }
    if (r.error) {
      try { r = await c.from('boards').select('id, title'); } catch (e) { throw new CabinetError(e); }
      if (r.error) throw new CabinetError(r.error);
    }
    return (r.data || []).filter(b => !b.trashed_at).map(b => ({ id: String(b.id), title: b.title || 'Без названия' }));
  }

  /* ── настройки: одна строка на преподавателя ── */
  async function getSettings(){
    const row = await run(need().from('teacher_settings').select('settings').maybeSingle());
    return row ? row.settings : null;
  }
  async function saveSettings(settings){
    const user = await currentUser();
    if (!user) throw new CabinetError({ message: 'not signed in' });
    return run(need().from('teacher_settings').upsert({ owner: user.id, settings }, { onConflict: 'owner' }));
  }

  window.CabinetCloud = {
    client, errorText, codeOf, CabinetError,
    currentUser, signIn, signOut,
    listStudents, getStudent, addStudent, updateStudent, setArchived, listBoards,
    getSettings, saveSettings,
  };
})();
