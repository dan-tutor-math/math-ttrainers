/* ==========================================================
   works-cloud.js — работы по ссылке и база Supabase (промпт №15 «работы»).

   Один модуль на обе страницы: конструктор учителя (works.html) и
   страницу ученика (work.html). Что лежит в базе и почему ученик ходит
   только через функции — works-schema.sql и раздел 7а HANDOFF.

   Ученик: open(code) → start(code, name) → save(...) → finish(...),
   продолжение на том же устройстве — resume(attempt, secret) по секрету из
   localStorage (remember/recall). Учитель: вход, свои работы (обычные
   запросы под RLS), картинки заданий в хранилище work-images.

   Ошибки базы приходят коротким кодом в тексте (work_not_found, …) —
   errorText переводит их в фразу для человека. Сеть пропала — код
   'network', страница ученика тогда копит ответы и досылает позже.
   ========================================================== */
(function(){
  const cfg = window.SUPABASE_CONFIG || {};
  const BUCKET = 'work-images';
  let sb = null;
  function client(){
    if (sb) return sb;
    if (!cfg.url || !cfg.anonKey || !window.supabase) return null;
    // тот же ключ хранения сессии, что у досок (supabase-js сам берёт его из
    // адреса проекта): учитель, вошедший на «Досках», здесь уже вошёл
    sb = window.supabase.createClient(cfg.url, cfg.anonKey);
    return sb;
  }

  const ERRORS = {
    work_not_found: 'Работа не найдена — проверьте ссылку',
    work_closed: 'Учитель закрыл приём этой работы',
    bad_name: 'Напиши имя — от 1 до 60 букв',
    attempt_not_found: 'Не нашли эту попытку — начни работу заново',
    attempt_finished: 'Работа уже завершена — ответы больше не меняются',
    task_not_found: 'Этого задания больше нет в работе',
    bad_answer: 'Не получилось сохранить ответ',
    answer_too_big: 'Ответ слишком длинный',
    too_many_attempts: 'По этой ссылке уже слишком много попыток — напиши учителю',
    network: 'Нет связи с сервером',
    no_config: 'Нет настроек подключения к серверу (supabase-config.js)',
  };
  function codeOf(err){
    if (!err) return null;
    const msg = String(err.message || err.error_description || err || '');
    for (const k of Object.keys(ERRORS)) if (msg.indexOf(k) >= 0) return k;
    // fetch упал (нет сети, сервер недоступен) — у supabase-js это TypeError
    // или сообщение «Failed to fetch» / «NetworkError»
    if (/fetch|network|load failed|timeout/i.test(msg) || err.name === 'TypeError') return 'network';
    return 'other';
  }
  function errorText(err){
    const c = codeOf(err);
    if (c && c !== 'other') return ERRORS[c];
    return 'Ошибка сервера: ' + String((err && err.message) || err || 'неизвестно');
  }
  class WorkError extends Error {
    constructor(err){ super(errorText(err)); this.code = codeOf(err); this.raw = err; }
  }
  async function rpc(name, args){
    const c = client();
    if (!c) throw new WorkError({ message: 'no_config' });
    let res;
    try { res = await c.rpc(name, args); }
    catch (e) { throw new WorkError(e); }
    if (res.error) throw new WorkError(res.error);
    return res.data;
  }

  /* ── ученик ── */
  const open   = code => rpc('work_open', { p_code: code });
  const start  = (code, name) => rpc('work_start', { p_code: code, p_name: name });
  const resume = (attempt, secret) => rpc('work_resume', { p_attempt: attempt, p_secret: secret });
  const save   = (attempt, secret, answer, activeMs) =>
    rpc('work_save_answer', { p_attempt: attempt, p_secret: secret, p_answer: answer, p_active_ms: Math.round(activeMs || 0) });
  const finish = (attempt, secret, activeMs) =>
    rpc('work_finish', { p_attempt: attempt, p_secret: secret, p_active_ms: Math.round(activeMs || 0) });

  // заход ученика на этом устройстве: по коду ссылки — номер захода и секрет.
  // localStorage может быть недоступен (приватный режим) — тогда просто не
  // продолжить после перезагрузки, работа всё равно решается
  const memKey = code => 'work:att:' + String(code || '').toUpperCase();
  function remember(code, rec){ try { localStorage.setItem(memKey(code), JSON.stringify(rec)); } catch (e) {} }
  function recall(code){ try { const r = JSON.parse(localStorage.getItem(memKey(code)) || 'null'); return r && r.attempt && r.secret ? r : null; } catch (e) { return null; } }
  function forget(code){ try { localStorage.removeItem(memKey(code)); } catch (e) {} }

  /* ── учитель ── */
  async function currentUser(){
    const c = client();
    if (!c) return null;
    try {
      const { data } = await c.auth.getSession();
      return data && data.session ? data.session.user : null;
    } catch (e) { return null; }
  }
  async function signIn(email, password){
    const c = client();
    if (!c) throw new WorkError({ message: 'no_config' });
    const { data, error } = await c.auth.signInWithPassword({ email, password });
    if (error) throw new WorkError(error);
    return data.user;
  }
  async function signOut(){ const c = client(); if (c) await c.auth.signOut(); }

  function check(res){
    if (res.error) throw new WorkError(res.error);
    return res.data;
  }
  async function listWorks(){
    return check(await client().from('works')
      .select('id, title, kind, settings, closed, created_at, updated_at, work_variants(id, num, code, blocks), work_attempts(id, finished_at)')
      .order('created_at', { ascending: false }));
  }
  async function getWork(id){
    return check(await client().from('works')
      .select('id, title, kind, settings, closed, created_at, work_variants(id, num, code, blocks)')
      .eq('id', id).single());
  }
  // w: { id?, title, kind, settings, variants: [{ id?, num, blocks }], deleted: [id варианта] }
  //   → { id, variants: [{ id, num, code }] } в том же порядке, что w.variants
  async function saveWork(w){
    const c = client();
    const head = { title: w.title || '', kind: w.kind || 'hw', settings: w.settings || {} };
    let id = w.id;
    if (!id){
      id = check(await c.from('works').insert(head).select('id').single()).id;
    } else {
      check(await c.from('works').update(head).eq('id', id).select('id'));
    }
    // удалённые варианты — ДО записи новых: номер удалённого может достаться
    // новому, а (work_id, num) в базе уникальны
    for (const vid of (w.deleted || [])) check(await c.from('work_variants').delete().eq('id', vid));
    const out = [];
    for (const v of (w.variants || [])){
      if (!v.id){
        out.push(check(await c.from('work_variants').insert({ work_id: id, num: v.num, blocks: v.blocks || [] }).select('id, num, code').single()));
      } else {
        const r = check(await c.from('work_variants').update({ blocks: v.blocks || [] }).eq('id', v.id).select('id, num, code'));
        out.push(r && r[0] ? r[0] : { id: v.id, num: v.num, code: v.code });
      }
    }
    return { id, variants: out };
  }
  async function setClosed(id, closed){ check(await client().from('works').update({ closed: !!closed }).eq('id', id).select('id')); }
  async function deleteWork(id){ check(await client().from('works').delete().eq('id', id)); }
  async function results(workId){
    return check(await client().from('work_attempts')
      .select('id, student_name, started_at, finished_at, last_seen_at, active_ms, variant_id, work_answers(task_id, status, value, tries, hint_used, solution_shown, time_ms, updated_at)')
      .eq('work_id', workId).order('started_at', { ascending: true }));
  }
  async function deleteAttempt(id){ check(await client().from('work_attempts').delete().eq('id', id)); }

  // картинка задания → хранилище; имя — хэш содержимого: одинаковая картинка
  // (то же задание во втором варианте, повторное сохранение) не грузится и
  // не хранится дважды. Возвращает публичную ссылку
  async function uploadImage(blob){
    const c = client();
    const user = await currentUser();
    if (!c || !user) throw new WorkError({ message: 'Нужно войти' });
    const buf = await blob.arrayBuffer();
    const dig = await crypto.subtle.digest('SHA-256', buf);
    const hash = Array.from(new Uint8Array(dig)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 40);
    const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/jpeg' ? 'jpg' : 'png';
    const path = user.id + '/' + hash + '.' + ext;
    const { error } = await c.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || 'image/png', cacheControl: '31536000', upsert: false });
    // «уже есть» — не ошибка: то же содержимое уже лежит под этим именем
    if (error && !/exist|duplicate|409/i.test(String(error.message || '') + ' ' + String(error.statusCode || '') + ' ' + String(error.error || ''))) {
      throw new WorkError(error);
    }
    return c.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  // ссылка для ученика — рядом с текущей страницей, на том же сайте
  function linkFor(code){
    const base = location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, '');
    return base + 'work.html?c=' + encodeURIComponent(code);
  }

  const KINDS = { hw: 'Домашняя работа', sr: 'Самостоятельная работа', kr: 'Контрольная работа', custom: 'Работа' };
  function kindLabel(kind, settings){
    if (kind === 'custom') return (settings && String(settings.kindName || '').trim()) || KINDS.custom;
    return KINDS[kind] || KINDS.hw;
  }

  window.WorksCloud = {
    client, errorText, codeOf, WorkError,
    open, start, resume, save, finish, remember, recall, forget,
    currentUser, signIn, signOut, listWorks, getWork, saveWork, setClosed, deleteWork, results, deleteAttempt,
    uploadImage, linkFor, kindLabel, KINDS,
  };
})();
