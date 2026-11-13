/* ==========================================================
   student-memory.js — память заданий ученика и сессия с учеником (задача Б1
   плана кабинета, claude-notes/cabinet-plan.md).

   Что даёт (window.StudentMemory):
     current()                  — ученик сессии {id, name, paused, lessonId, startedAt, mode} или null
     start({id, name}, {lessonId}) — начать сессию (журнал ученика грузится сразу)
     end(), pause(on)           — закончить; пауза записи
     record(key, event, {source, srcRef, lessonId, studentId}) — записать событие
                                  (studentId — Б5: явному ученику, без сессии)
     recordTask(task, {clean, mode, page}) — итог решения из страницы тренажёра (Б2):
                                  ключ строит TaskKey.fromTask, событие ok (с первого
                                  раза) или bad (после ошибок или с подсказкой)
                                  event: hw / board / ok / bad; ключ — task-key.js (А1)
     summary(key, {studentId})  — даты и счётчики по каждому виду события
     kindSummary(prefix, …)     — то же по всем ключам вида («gen:oge9:3», «fipi:oge:9»)
     keys({studentId})          — ключи с событиями (Б4: «скрывать решённые»)
     forget(keys, {studentId, prefix}) — забыть задания (удаление строк журнала)
     fetchLog(studentId)        — журнал с сервера целиком (карточка ученика, Б6)
     listStudents()             — ученики преподавателя для выбора
     onChange(fn)               — подписка: сессия, пауза, журнал; возвращает отписку
     flush()                    — отправить очередь сейчас
     isFollower()               — вкладка ученика в совместной сессии
     setPickerContext(fn)       — Б3: кнопка выбора ученика по контексту страницы
                                  (доска: fn() → {boards:[id…]} или null)

   Почему так устроено:
   - Привязка — настройка преподавателя (TeacherSettings, sessionBind).
     «Вкладка»: ученик лежит в sessionStorage рядом с кодом совместной сессии
     вкладки (tsTab:code) — в соседней вкладке может идти урок с другим.
     «Браузер»: один ключ в localStorage, остальные вкладки узнают о смене по
     событию storage.
   - Журнал грузится один раз при старте сессии и лежит сжатой копией в
     localStorage: кадры тренажёров на доске и карточки «+» — отдельные
     документы, они читают копию и не ходят в сеть.
   - Запись — через очередь в localStorage: обрыв сети, закрытая вкладка,
     страница без входа (тренажёр без supabase-config.js) событие не теряют —
     отправит любая страница, где есть связь и вход. id строки задаёт клиент,
     сервер повтор молча пропускает (on conflict do nothing), поэтому две
     вкладки, отправившие одно и то же, дубля не дают.
   - У вкладки ученика в совместной сессии (follower, сцена) модуль ничего не
     грузит и не рисует. И ничего отсюда не уходит в состояние совместной
     сессии и в данные доски: модуль не трогает ни TrainerSession, ни доску.
   ========================================================== */
(function(){
  if (window.StudentMemory) return;

  const SS_TAB = 'studentMem:tab';              // сессия вкладки (режим «вкладка»)
  const LS_BROWSER = 'studentMem:browser';      // сессия браузера (режим «браузер»)
  const LS_QUEUE = 'studentMem:queue:v1';       // неотправленные события
  const LS_DEAD = 'studentMem:dead:v1';         // отвергнутые сервером навсегда — не теряем, откладываем
  const LS_LOG = 'studentMem:log:';             // + id ученика: сжатая копия журнала
  const LS_LOCK = 'studentMem:flushLock';
  const SETTINGS_KEY = 'teacher:settings:v1';   // тот же ключ, что в teacher-settings.js
  const THROTTLE_MS = 10 * 60 * 1000;           // одно событие по заданию — не чаще раза в 10 минут
  const LOG_KEEP_MS = 3 * 24 * 3600 * 1000;     // копии журналов других учеников — 3 дня
  const QUEUE_MAX = 5000;
  // lesson_id в student_task_log есть (cabinet-schema.sql, А3, внешний ключ на
  // lessons, on delete set null): событие сессии, начатой из занятия расписания
  // (В2), уходит на сервер вместе с занятием. Флаг оставлен выключателем: если
  // на каком-то стенде схема без столбца, достаточно поставить false
  const SEND_LESSON_ID = true;
  const EV = { hw: 'h', board: 'b', ok: 'o', bad: 'x' };
  const EV_BACK = { h: 'hw', b: 'board', o: 'ok', x: 'bad' };
  const SOURCES = ['trainer', 'board', 'work'];
  const KEY_RE = /^[a-z0-9_]+:.+$/;

  const IN_TOP = (function(){ try { return window.top === window.self; } catch (e) { return false; } })();
  const ME = Math.random().toString(36).slice(2, 10);

  /* ── хранилища ── */
  function ssGet(k){ try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v){ try { sessionStorage.setItem(k, v); } catch (e) {} }
  function ssDel(k){ try { sessionStorage.removeItem(k); } catch (e) {} }
  function lsGet(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v){ try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function lsDel(k){ try { localStorage.removeItem(k); } catch (e) {} }
  function parse(s, d){ try { const v = JSON.parse(s); return v == null ? d : v; } catch (e) { return d; } }

  function bindMode(){
    try { if (window.TeacherSettings) return window.TeacherSettings.get().sessionBind === 'tab' ? 'tab' : 'browser'; } catch (e) {}
    const s = parse(lsGet(SETTINGS_KEY), {});
    return s && s.sessionBind === 'tab' ? 'tab' : 'browser';
  }

  /* ── роль в совместной сессии ──
     Смотрим сразу несколько признаков, а не один TrainerSession.isLeader():
     модуль подключён раньше или позже session-share.js, а в кадре у
     TrainerSession пустышка, которая всегда «ведущий». Ошибиться в сторону
     «ученик» безопасно (плашки просто нет), в обратную — нельзя */
  function topWin(){ try { return window.top && window.top.location.origin === location.origin ? window.top : null; } catch (e) { return null; } }
  function isFollower(){
    const t = topWin() || window;
    try { if (t.name === 'tsStageFrame' || window.name === 'tsStageFrame') return true; } catch (e) {}
    try { if (/(^|\/)stage\.html$/.test(t.location.pathname)) return true; } catch (e) {}
    if (ssGet('tsTab:role') === 'follower') return true;
    try { if (new URL(t.location.href).searchParams.get('s')) return true; } catch (e) {}
    if (!ssGet('tsTab:code') && lsGet('trainerSession:global') && lsGet('trainerSession:global:role') === 'follower') return true;
    try {
      const TS = t.TrainerSession;
      if (TS && TS.getCode && TS.getCode() && TS.isLeader && !TS.isLeader()) return true;
    } catch (e) {}
    return false;
  }

  /* ── сессия ── */
  // код совместной сессии вкладки уже ушёл в другую вкладку? Новая вкладка
  // «＋ Новая сессия» получает КОПИЮ sessionStorage открывшей (а с ней и
  // нашего ученика), но session-share.js сразу ставит ей свой код. Старый код
  // при этом остаётся в списке сессий (tsSessions:v1) — значит, им живёт
  // соседняя вкладка, а эта начинает без ученика. Если же старого кода в
  // списке нет — это та же вкладка сменила код («новый код», «Завершить»),
  // и ученик переезжает на новый, как подборка (moveBasket)
  function codeInRegistry(c){
    const list = parse(lsGet('tsSessions:v1'), []);
    return Array.isArray(list) && list.some(e => e && e.code === c);
  }
  function readTab(){
    const s = parse(ssGet(SS_TAB), null);
    if (!s || !s.student || !s.student.id) return null;
    const cur = ssGet('tsTab:code');
    if (cur && s.code && s.code !== cur){
      if (codeInRegistry(s.code)) { ssDel(SS_TAB); return null; }
      s.code = cur; ssSet(SS_TAB, JSON.stringify(s));
    } else if (cur && !s.code){
      s.code = cur; ssSet(SS_TAB, JSON.stringify(s));
    }
    return s;
  }
  function readSessionRaw(){
    if (bindMode() === 'tab') return readTab();
    const s = parse(lsGet(LS_BROWSER), null);
    return s && s.student && s.student.id ? s : null;
  }
  function writeSession(s){
    if (bindMode() === 'tab'){
      if (s) { s.code = ssGet('tsTab:code') || null; ssSet(SS_TAB, JSON.stringify(s)); }
      else ssDel(SS_TAB);
    } else {
      if (s) lsSet(LS_BROWSER, JSON.stringify(s)); else lsDel(LS_BROWSER);
    }
  }
  function current(){
    if (isFollower()) return null;
    const s = readSessionRaw();
    if (!s) return null;
    return { id: String(s.student.id), name: String(s.student.name || ''), paused: !!s.paused,
             lessonId: s.lessonId || null, startedAt: s.startedAt || null, mode: bindMode() };
  }

  /* ── подписчики ── */
  const listeners = [];
  let emitSig = '';
  function emit(force){
    const c = current();
    const sig = c ? [c.id, c.name, c.paused, c.lessonId].join('|') : '';
    if (!force && sig === emitSig) return;
    emitSig = sig;
    listeners.slice().forEach(f => { try { f(c); } catch (e) {} });
    renderBar();
  }
  function onChange(f){
    listeners.push(f);
    return () => { const i = listeners.indexOf(f); if (i >= 0) listeners.splice(i, 1); };
  }

  /* ── сжатая копия журнала ──
     { at: когда загружена, full: загружена ли с сервера целиком, used,
       k: { ключ: "o<сек36>,x<сек36>,…" } } — буква события + время в секундах
     по основанию 36: журнал за год занятий умещается в десятки килобайт */
  const logCache = {};
  function readLog(sid){
    const raw = lsGet(LS_LOG + sid);
    if (logCache[sid] && logCache[sid].raw === raw) return logCache[sid].data;
    const o = parse(raw, null);
    const data = { at: 0, full: false, k: {} };
    if (o && typeof o === 'object'){
      data.at = o.at || 0; data.full = !!o.full;
      Object.keys(o.k || {}).forEach(key => {
        data.k[key] = String(o.k[key]).split(',').filter(Boolean).map(t => ({ e: EV_BACK[t[0]], t: parseInt(t.slice(1), 36) * 1000 }))
          .filter(x => x.e && x.t > 0);
      });
    }
    logCache[sid] = { raw, data };
    return data;
  }
  function writeLog(sid, data){
    const k = {};
    Object.keys(data.k).forEach(key => {
      const list = data.k[key];
      if (list && list.length) k[key] = list.map(x => EV[x.e] + Math.floor(x.t / 1000).toString(36)).join(',');
    });
    const raw = JSON.stringify({ at: data.at, full: data.full, used: Date.now(), k });
    if (!lsSet(LS_LOG + sid, raw)) { pruneLogs(sid, 0); lsSet(LS_LOG + sid, raw); }
    logCache[sid] = { raw: lsGet(LS_LOG + sid), data };
  }
  // копии журналов, которыми давно не пользовались, — долой: у localStorage
  // потолок ~5 МБ на сайт, его делят доски и подборки
  function pruneLogs(keepSid, maxAge){
    const now = Date.now();
    try {
      for (let i = localStorage.length - 1; i >= 0; i--){
        const k = localStorage.key(i);
        if (!k || k.indexOf(LS_LOG) !== 0 || k === LS_LOG + keepSid) continue;
        const o = parse(localStorage.getItem(k), {});
        if (now - (o.used || o.at || 0) > maxAge) localStorage.removeItem(k);
      }
    } catch (e) {}
  }
  function addToLog(sid, key, e, t){
    const data = readLog(sid);
    (data.k[key] = data.k[key] || []).push({ e, t });
    data.k[key].sort((a, b) => a.t - b.t);
    writeLog(sid, data);
  }

  function sumOf(lists){
    const out = { total: 0, last: null, hw: null, board: null, ok: null, bad: null, events: [] };
    lists.forEach(list => list.forEach(x => {
      out.events.push({ event: x.e, at: x.t });
      const b = out[x.e] || (out[x.e] = { n: 0, first: null, last: null, dates: [] });
      b.n++; b.dates.push(x.t);
      if (b.first == null || x.t < b.first) b.first = x.t;
      if (b.last == null || x.t > b.last) b.last = x.t;
      out.total++;
      if (out.last == null || x.t > out.last) out.last = x.t;
    }));
    out.events.sort((a, b) => a.at - b.at);
    ['hw', 'board', 'ok', 'bad'].forEach(e => { if (out[e]) out[e].dates.sort((a, b) => a - b); });
    return out;
  }
  function sidOf(opts){
    if (opts && opts.studentId) return String(opts.studentId);
    const c = current();
    return c ? c.id : null;
  }
  // даты по каждому виду события одного задания; null — ученика нет
  function summary(key, opts){
    const sid = sidOf(opts);
    if (!sid || !key) return null;
    const s = sumOf([readLog(sid).k[key] || []]);
    s.key = key;
    return s;
  }
  // по виду: все ключи, равные prefix или начинающиеся с «prefix:»
  // («gen:oge9:3» — вид генератора, «fipi:oge» — все задания банка ОГЭ)
  function kindSummary(prefix, opts){
    const sid = sidOf(opts);
    if (!sid || !prefix) return null;
    const data = readLog(sid), lists = [], keys = [];
    Object.keys(data.k).forEach(k => {
      if (k === prefix || k.indexOf(prefix + ':') === 0) { keys.push(k); lists.push(data.k[k]); }
    });
    const s = sumOf(lists);
    s.prefix = prefix; s.keys = keys.length;
    return s;
  }
  function keys(opts){
    const sid = sidOf(opts);
    if (!sid) return [];
    const data = readLog(sid);
    return Object.keys(data.k).filter(k => data.k[k].length);
  }
  function logState(opts){
    const sid = sidOf(opts);
    if (!sid) return null;
    const d = readLog(sid);
    return { loadedAt: d.at || null, full: d.full };
  }

  /* ── Supabase ── */
  let sb = null;
  function client(){
    if (sb) return sb;
    try { if (window.CabinetCloud && window.CabinetCloud.client()) return (sb = window.CabinetCloud.client()); } catch (e) {}
    const cfg = window.SUPABASE_CONFIG || {};
    if (!cfg.url || !cfg.anonKey || !window.supabase || !window.supabase.createClient) return null;
    try { sb = (window.rtGuard || (c => c))(window.supabase.createClient(cfg.url, cfg.anonKey)); } catch (e) { sb = null; }
    return sb;
  }
  async function signedIn(c){
    try { const r = await c.auth.getSession(); return !!(r && r.data && r.data.session); } catch (e) { return false; }
  }
  function errText(err){ return String((err && (err.message || err.details || err.hint)) || err || ''); }
  // навсегда — только когда сервер отверг сами данные (ученик удалён, чужой
  // ученик, неверный ключ). Сеть, истёкший вход, «нет прав» без входа — повтор
  function permanent(err){
    const m = errText(err);
    return /violates|invalid input|malformed|out of range|too long/i.test(m) && !/row-level security/i.test(m);
  }

  /* ── очередь записи ── */
  function readQueue(){ const q = parse(lsGet(LS_QUEUE), []); return Array.isArray(q) ? q : []; }
  function writeQueue(q){
    if (q.length > QUEUE_MAX) q = q.slice(q.length - QUEUE_MAX);
    if (q.length) lsSet(LS_QUEUE, JSON.stringify(q)); else lsDel(LS_QUEUE);
  }
  function uuid(){
    try { if (crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
    const b = new Uint8Array(16);
    try { crypto.getRandomValues(b); } catch (e) { for (let i = 0; i < 16; i++) b[i] = Math.random() * 256 | 0; }
    b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }
  function pageSource(){
    const p = (location.pathname.split('/').pop() || '').toLowerCase();
    if (/^boards(-panel)?\.html$/.test(p)) return 'board';
    if (/^works?\.html$/.test(p)) return 'work';
    return 'trainer';
  }

  // { ok: true, id } или { ok: false, reason: no_session | paused | follower | throttled | bad_key | bad_event }
  function record(key, event, opts){
    opts = opts || {};
    if (isFollower()) return { ok: false, reason: 'follower' };
    key = String(key || '');
    if (key.length < 3 || key.length > 200 || !KEY_RE.test(key)) return { ok: false, reason: 'bad_key' };
    if (!EV[event]) return { ok: false, reason: 'bad_event' };
    // Б5: «Выдано» в работах пишет явно названному ученику, сессия не нужна и пауза
    // не мешает — это действие преподавателя, а не фоновая запись урока
    let s = current();
    if (opts.studentId) s = { id: String(opts.studentId), paused: false, lessonId: null };
    if (!s) return { ok: false, reason: 'no_session' };
    if (s.paused) return { ok: false, reason: 'paused' };
    const now = Date.now();
    const prev = (readLog(s.id).k[key] || []).filter(x => x.e === event);
    if (prev.length && now - prev[prev.length - 1].t < THROTTLE_MS) return { ok: false, reason: 'throttled' };
    const source = SOURCES.indexOf(opts.source) >= 0 ? opts.source : pageSource();
    let ref = opts.srcRef != null ? String(opts.srcRef) : (location.pathname.split('/').pop() || '');
    if (ref.length > 300) ref = ref.slice(0, 300);
    const row = { id: uuid(), student_id: s.id, task_key: key, event, source, src_ref: ref || null,
                  at: new Date(now).toISOString(), lesson_id: opts.lessonId || s.lessonId || null };
    const q = readQueue(); q.push(row); writeQueue(q);
    addToLog(s.id, key, event, now);
    emit(true);
    scheduleFlush(0);
    return { ok: true, id: row.id };
  }

  // Б2: одно место для всех страниц тренажёров. Страница не знает про ключи и
  // сессию — отдаёт задание и «чисто ли решено», остальное (нет сессии, пауза,
  // follower, нет ключа) решает здесь, поэтому вызов безопасен всегда
  function recordTask(task, opts){
    opts = opts || {};
    try {
      if (!task || !window.TaskKey) return { ok: false, reason: 'no_key' };
      const page = opts.page || (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
      const t = (opts.mode && task.mode == null) ? Object.assign({}, task, { mode: opts.mode }) : task;
      const key = window.TaskKey.fromTask(page, t);
      if (!key) return { ok: false, reason: 'no_key' };
      return record(key, opts.clean === false ? 'bad' : 'ok', { source: 'trainer', srcRef: page });
    } catch (e) { return { ok: false, reason: 'error' }; }
  }

  let flushing = false, flushTimer = null, retryMs = 0;
  function scheduleFlush(ms){
    clearTimeout(flushTimer);
    flushTimer = setTimeout(() => { flushTimer = null; flush(); }, ms || 0);
  }
  function rowForServer(r){
    const o = { id: r.id, student_id: r.student_id, task_key: r.task_key, event: r.event, source: r.source, src_ref: r.src_ref, at: r.at };
    if (SEND_LESSON_ID && r.lesson_id) o.lesson_id = r.lesson_id;
    return o;
  }
  function dropFromQueue(ids){
    const set = new Set(ids);
    writeQueue(readQueue().filter(r => !set.has(r.id)));
  }
  async function flush(){
    if (flushing) return { sent: 0, left: readQueue().length };
    let q = readQueue();
    if (!q.length) { retryMs = 0; return { sent: 0, left: 0 }; }
    const c = client();
    if (!c) return { sent: 0, left: q.length };
    // замок между вкладками: не страшно и без него (повтор сервер
    // пропускает), но так одно событие не уходит пятью запросами сразу
    const lock = parse(lsGet(LS_LOCK), null);
    if (lock && lock.by !== ME && Date.now() - lock.at < 20000) { scheduleFlush(5000); return { sent: 0, left: q.length }; }
    lsSet(LS_LOCK, JSON.stringify({ by: ME, at: Date.now() }));
    flushing = true;
    let sent = 0;
    try {
      if (!(await signedIn(c))) { scheduleFlush(60000); return { sent: 0, left: q.length }; }
      while (q.length){
        const batch = q.slice(0, 100);
        const res = await c.from('student_task_log').upsert(batch.map(rowForServer), { onConflict: 'id', ignoreDuplicates: true });
        if (res && res.error){
          if (!permanent(res.error)) throw res.error;
          // кто-то один отвергнут навсегда — шлём по одному, его откладываем
          for (const r of batch){
            const one = await c.from('student_task_log').upsert([rowForServer(r)], { onConflict: 'id', ignoreDuplicates: true });
            if (one && one.error){
              if (!permanent(one.error)) throw one.error;
              const dead = parse(lsGet(LS_DEAD), []);
              dead.push(Object.assign({}, r, { error: errText(one.error).slice(0, 200) }));
              lsSet(LS_DEAD, JSON.stringify(dead.slice(-500)));
            } else sent++;
            dropFromQueue([r.id]);
          }
        } else {
          sent += batch.length;
          dropFromQueue(batch.map(r => r.id));
        }
        q = readQueue();
      }
      retryMs = 0;
    } catch (e) {
      // сеть или вход: повтор с нарастающей паузой, до двух минут
      retryMs = Math.min(Math.max(retryMs * 2, 5000), 120000);
      scheduleFlush(retryMs);
    } finally {
      flushing = false;
      const l = parse(lsGet(LS_LOCK), null);
      if (l && l.by === ME) lsDel(LS_LOCK);
    }
    return { sent, left: readQueue().length };
  }

  /* ── журнал с сервера ── */
  async function fetchLog(studentId){
    const c = client();
    if (!c) throw new Error('Нет подключения к серверу');
    const out = [];
    for (let from = 0; ; from += 1000){
      const res = await c.from('student_task_log').select('id, task_key, event, source, src_ref, at, lesson_id')
        .eq('student_id', String(studentId)).order('at', { ascending: true }).range(from, from + 999);
      if (res.error) throw new Error(errText(res.error) || 'Ошибка сервера');
      out.push.apply(out, res.data || []);
      if (!res.data || res.data.length < 1000) break;
    }
    return out;
  }
  // журнал → сжатая копия. Неотправленное из очереди добавляем сверху: его
  // ещё нет на сервере, но для подписей и для «раз в 10 минут» оно уже было
  async function loadLog(studentId){
    const sid = String(studentId);
    const rows = await fetchLog(sid);
    const data = { at: Date.now(), full: true, k: {} };
    const seen = new Set();
    rows.forEach(r => {
      seen.add(r.id);
      const t = Date.parse(r.at);
      if (!EV[r.event] || !(t > 0)) return;
      (data.k[r.task_key] = data.k[r.task_key] || []).push({ e: r.event, t });
    });
    readQueue().forEach(r => {
      if (r.student_id !== sid || seen.has(r.id)) return;
      (data.k[r.task_key] = data.k[r.task_key] || []).push({ e: r.event, t: Date.parse(r.at) });
    });
    Object.keys(data.k).forEach(k => data.k[k].sort((a, b) => a.t - b.t));
    writeLog(sid, data);
    pruneLogs(sid, LOG_KEEP_MS);
    emit(true);
    return logState({ studentId: sid });
  }

  /* ── забыть задания ── */
  function likeEscape(s){ return s.replace(/[\\%_]/g, m => '\\' + m); }
  // keys — список ключей; prefix: true — каждый ключ понимается как вид
  // (сам ключ и всё, что начинается с «ключ:»). Сначала очередь (иначе
  // неотправленное доедет на сервер после удаления), потом сервер, потом копия
  async function forget(keyList, opts){
    opts = opts || {};
    const sid = sidOf(opts);
    if (!sid) throw new Error('Ученик не выбран');
    keyList = (Array.isArray(keyList) ? keyList : [keyList]).map(String).filter(Boolean);
    if (!keyList.length) return 0;
    const hit = k => keyList.some(p => k === p || (opts.prefix && k.indexOf(p + ':') === 0));
    writeQueue(readQueue().filter(r => !(r.student_id === sid && hit(r.task_key))));
    const c = client();
    if (c){
      if (opts.prefix){
        for (const p of keyList){
          const a = await c.from('student_task_log').delete().eq('student_id', sid).eq('task_key', p);
          if (a.error) throw new Error(errText(a.error));
          const b = await c.from('student_task_log').delete().eq('student_id', sid).like('task_key', likeEscape(p) + ':%');
          if (b.error) throw new Error(errText(b.error));
        }
      } else {
        for (let i = 0; i < keyList.length; i += 100){
          const r = await c.from('student_task_log').delete().eq('student_id', sid).in('task_key', keyList.slice(i, i + 100));
          if (r.error) throw new Error(errText(r.error));
        }
      }
    }
    const data = readLog(sid);
    let n = 0;
    Object.keys(data.k).forEach(k => { if (hit(k)) { n += data.k[k].length; delete data.k[k]; } });
    writeLog(sid, data);
    emit(true);
    return n;
  }

  /* ── сессия: начать, пауза, закончить ── */
  async function start(student, opts){
    if (!student || !student.id) throw new Error('Не выбран ученик');
    if (isFollower()) return null;
    opts = opts || {};
    writeSession({ student: { id: String(student.id), name: String(student.name || '') }, paused: false,
                   lessonId: opts.lessonId || null, startedAt: Date.now() });
    emit(true);
    try { await loadLog(student.id); } catch (e) { /* нет связи — подписи по старой копии, запись всё равно в очередь */ }
    scheduleFlush(0);
    return current();
  }
  function pause(on){
    const s = readSessionRaw();
    if (!s) return;
    s.paused = on == null ? !s.paused : !!on;
    writeSession(s);
    emit(true);
  }
  function end(){
    writeSession(null);
    emit(true);
    scheduleFlush(0);
  }

  async function listStudents(){
    const c = client();
    if (!c) throw new Error('Нет подключения к серверу');
    if (!(await signedIn(c))) { const e = new Error('Нужен вход'); e.code = 'auth'; throw e; }
    const r = await c.from('students').select('id, name, boards, archived_at').order('name', { ascending: true });
    if (r.error) throw new Error(errText(r.error));
    const list = (r.data || []).filter(s => !s.archived_at)
      .map(s => ({ id: String(s.id), name: s.name, boards: Array.isArray(s.boards) ? s.boards.map(String) : [] }));
    studentsCache = list;
    return list;
  }

  /* ── выбор ученика на странице с контекстом (Б3: доска) ──
     Страница отдаёт функцию: null — кнопки здесь нет (список досок, чужая
     доска), { boards: [id…] } — кнопка есть, и если одна из досок привязана к
     ученику в кабинете (students.boards), он предлагается сразу. Сама
     страница сессию не начинает: открытие доски ничего не переключает */
  let pickCtx = null, studentsCache = null, studentsLoading = false, studentsTried = 0;
  function setPickerContext(fn){
    pickCtx = typeof fn === 'function' ? fn : null;
    barSig = null;
    renderBar();
  }
  function ctxNow(){ try { return pickCtx ? pickCtx() : null; } catch (e) { return null; } }
  function boundStudent(ctx){
    if (!ctx || !ctx.boards || !ctx.boards.length || !studentsCache) return null;
    const hit = studentsCache.filter(s => s.boards.some(b => ctx.boards.indexOf(b) >= 0));
    // доска у двух учеников (группа) — не угадываем, выбор из списка
    return hit.length === 1 ? hit[0] : null;
  }
  function ensureStudents(){
    // плашка перерисовывается раз в 2 с — без связи не долбим сервер
    if (studentsCache || studentsLoading || !authed || Date.now() - studentsTried < 60000) return;
    studentsLoading = true; studentsTried = Date.now();
    listStudents().catch(() => {}).then(() => { studentsLoading = false; barSig = null; renderBar(); });
  }

  /* ── плашка «Сессия: имя · пауза · закончить» ──
     Только в верхнем окне (не в кадрах доски) и не у ученика. На главной и в
     кабинете (data-picker у тега script) без сессии — кнопка выбора ученика */
  const SCRIPT = document.currentScript;
  // выбор ученика — только вошедшему преподавателю: главную открывают и
  // ученики, им кнопка «Начать сессию» ни к чему
  let authed = false;
  function wantsPicker(){
    if (!authed) return false;
    if (pickCtx) return !!ctxNow();
    if (SCRIPT && SCRIPT.hasAttribute('data-picker')) return true;
    return /(^|\/)(index\.html)?$/.test(location.pathname);
  }
  async function checkAuth(){
    const c = client();
    const was = authed;
    authed = !!(c && await signedIn(c));
    if (authed !== was) renderBar();
  }
  let bar = null, barSig = null, menuOpen = false;
  function css(){
    if (document.getElementById('smBarCss')) return;
    const st = document.createElement('style');
    st.id = 'smBarCss';
    st.textContent =
      '#smBar{position:fixed;left:12px;bottom:12px;z-index:2147482000;display:flex;align-items:center;gap:2px;' +
      'font:500 13px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;color:#fff;background:rgba(28,30,40,.86);' +
      '-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-radius:999px;padding:4px 6px 4px 12px;' +
      'box-shadow:0 4px 18px rgba(0,0,0,.22);max-width:calc(100vw - 24px)}' +
      '#smBar .sm-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:40vw;margin-right:4px}' +
      '#smBar .sm-name b{font-weight:650}' +
      '#smBar.paused .sm-name{opacity:.7}' +
      '#smBar button{font:inherit;color:inherit;background:transparent;border:0;border-radius:999px;padding:5px 9px;cursor:pointer}' +
      '#smBar button:hover{background:rgba(255,255,255,.14)}' +
      '#smBar .sm-dot{opacity:.5}' +
      '#smMenu{position:absolute;left:0;bottom:calc(100% + 6px);min-width:220px;max-height:50vh;overflow:auto;background:rgba(28,30,40,.95);' +
      'border-radius:12px;padding:6px;box-shadow:0 8px 28px rgba(0,0,0,.3)}' +
      '#smMenu button{display:block;width:100%;text-align:left;border-radius:8px}' +
      '#smMenu .sm-note{padding:6px 9px;opacity:.75}#smMenu a{color:#9cc7ff}' +
      '@media print{#smBar{display:none}}';
    (document.head || document.documentElement).appendChild(st);
  }
  function esc(s){ return String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }
  function renderBar(){
    if (!IN_TOP || !document.body) return;
    const s = isFollower() ? null : current();
    const picker = !s && wantsPicker() && !isFollower();
    let bound = null;
    if (picker && pickCtx){ ensureStudents(); bound = boundStudent(ctxNow()); }
    const sig = s ? 'S|' + s.id + '|' + s.name + '|' + s.paused : (picker ? 'P|' + (bound ? bound.id + '|' + bound.name : '') : '');
    if (sig === barSig) return;
    barSig = sig; menuOpen = false;
    if (!sig){ if (bar) { bar.remove(); bar = null; } return; }
    css();
    if (!bar){ bar = document.createElement('div'); bar.id = 'smBar'; bar.setAttribute('role', 'status'); document.body.appendChild(bar); }
    bar.classList.toggle('paused', !!(s && s.paused));
    if (s){
      bar.innerHTML = '<span class="sm-name">Сессия: <b>' + esc(s.name || 'ученик') + '</b>' + (s.paused ? ' · на паузе' : '') + '</span>' +
        '<button type="button" data-sm="pause">' + (s.paused ? 'продолжить' : 'пауза') + '</button>' +
        '<span class="sm-dot">·</span><button type="button" data-sm="end">закончить</button>';
    } else {
      bar.innerHTML = bound
        ? '<button type="button" data-sm="start" data-id="' + esc(bound.id) + '" data-name="' + esc(bound.name) + '">Начать сессию: <b>' + esc(bound.name) + '</b></button>' +
          '<span class="sm-dot">·</span><button type="button" data-sm="pick" title="Выбрать другого ученика">другой</button>'
        : '<button type="button" data-sm="pick">Начать сессию с учеником</button>';
    }
  }
  async function openMenu(){
    if (!bar) return;
    let m = document.getElementById('smMenu');
    if (m) { m.remove(); menuOpen = false; return; }
    m = document.createElement('div'); m.id = 'smMenu';
    m.innerHTML = '<div class="sm-note">Загружаем учеников…</div>';
    bar.appendChild(m); menuOpen = true;
    try {
      const list = await listStudents();
      m.innerHTML = list.length
        ? list.map(x => '<button type="button" data-sm="start" data-id="' + esc(x.id) + '" data-name="' + esc(x.name) + '">' + esc(x.name) + '</button>').join('')
        : '<div class="sm-note">Учеников пока нет — <a href="cabinet.html#/students">добавить в кабинете</a></div>';
    } catch (e) {
      m.innerHTML = e.code === 'auth'
        ? '<div class="sm-note"><a href="cabinet.html">Войдите в кабинет</a>, чтобы выбрать ученика</div>'
        : '<div class="sm-note">' + esc(e.message) + '</div>';
    }
  }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('#smBar [data-sm]');
    if (!b) {
      if (menuOpen && !(e.target.closest && e.target.closest('#smMenu'))) { const m = document.getElementById('smMenu'); if (m) m.remove(); menuOpen = false; }
      return;
    }
    const a = b.getAttribute('data-sm');
    if (a === 'pause') pause();
    else if (a === 'end') end();
    else if (a === 'pick') openMenu();
    else if (a === 'start') start({ id: b.getAttribute('data-id'), name: b.getAttribute('data-name') });
  });

  /* ── события браузера ── */
  window.addEventListener('storage', e => {
    if (e.key === LS_BROWSER || e.key === SETTINGS_KEY || e.key === 'tsSessions:v1') emit(false);
    else if (e.key && e.key.indexOf(LS_LOG) === 0) emit(true);
    else if (e.key === LS_QUEUE && e.newValue) scheduleFlush(300);
  });
  window.addEventListener('online', () => scheduleFlush(0));
  // страницу закрыли посреди отправки — замок снимаем сразу, иначе другие
  // вкладки (и эта же после перезагрузки) ждали бы его истечения
  window.addEventListener('pagehide', () => {
    const l = parse(lsGet(LS_LOCK), null);
    if (l && l.by === ME) lsDel(LS_LOCK);
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { emit(false); scheduleFlush(0); } });
  try { if (window.TeacherSettings) window.TeacherSettings.onChange(() => emit(false)); } catch (e) {}
  // роль и код вкладки меняются без событий (подключились по коду, сменили
  // код) — сверяемся раз в 2 секунды; дёшево: только чтение хранилищ
  setInterval(() => { emit(false); renderBar(); if (IN_TOP && readQueue().length && !flushing && !flushTimer) scheduleFlush(0); }, 2000);

  function boot(){
    emit(true);
    renderBar();
    // сессия есть, а копии журнала нет (почистили хранилище) — догрузить
    const s = current();
    if (IN_TOP && s && !readLog(s.id).full && client()) loadLog(s.id).catch(() => {});
    if (readQueue().length) scheduleFlush(500);
    if (IN_TOP && !isFollower()){
      checkAuth();
      try { const c = client(); if (c) c.auth.onAuthStateChange(() => { checkAuth(); scheduleFlush(0); }); } catch (e) {}
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.StudentMemory = {
    current, start, end, pause, record, recordTask, summary, kindSummary, keys, logState, forget, fetchLog, loadLog,
    listStudents, onChange, flush, isFollower, bindMode, setPickerContext,
    queue: () => readQueue().slice(), deadLetters: () => parse(lsGet(LS_DEAD), []),
    THROTTLE_MS,
  };
})();
