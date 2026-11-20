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
                                  раза) или bad (после ошибок или с подсказкой).
                                  Старый вызов, страницы переходят на recordAttempt
     recordAttempt(task, {ok, mode, page}) — задача 56: каждая попытка сразу —
                                  bad на неверный ответ (подсказку), ok на верный,
                                  даже после ошибок: в истории «неверно → верно»
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
     «Вкладка»: ученик и занятие общие для группы вкладок. В sessionStorage
     лежат id участника и группы; соседний урок может идти с другим учеником.
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

  const SS_TAB = 'studentMem:tab';              // старый формат, читаем при миграции
  const SS_GID = 'studentMem:gid', SS_ID = 'studentMem:tabId', SS_CODE = 'studentMem:code';
  const SS_MOVE = 'studentMem:outgoing', MOVE_ACK = 'studentMem:received:';
  const REGISTRY = 'studentMem:groups', INFO = 'studentMem:group:', MEMBER = 'studentMem:member:';
  const PAUSED = 'studentMem:paused:', LESSON = 'studentMem:lesson:';
  const HEARTBEAT = 15000, MAX_AGE = 45000;
  const LS_BROWSER = 'studentMem:browser';      // сессия браузера (режим «браузер»)
  const LS_REPORT_OWNER = 'studentMem:reportOwner';
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
  function ssSet(k, v){ try { sessionStorage.setItem(k, v); return true; } catch (e) { return false; } }
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

  if (document.currentScript?.hasAttribute('data-group-only') && !new URL(location.href).searchParams.has('sm') &&
      (bindMode() !== 'tab' || !ssGet(SS_GID))) return;

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
  // Каждый писатель меняет только свою отметку. Общий реестр — снимок этих
  // записей: две вкладки не могут перезаписать паузу или участника друг друга.
  function membership(gid, id){ return MEMBER + gid + ':' + id; }
  function allKeys(){ try { return Object.keys(localStorage); } catch (e) { return []; } }
  function groupData(gid){
    const g = parse(lsGet(INFO + gid), null);
    if (!g?.student?.id) return null;
    const pause = lsGet(PAUSED + gid);
    return Object.assign(g, parse(lsGet(LESSON + gid), {}), { paused: pause == null ? !!g.paused : pause === '1' });
  }
  function forgetGroup(gid){
    lsDel(INFO + gid);
    lsDel(LESSON + gid);
    lsDel(PAUSED + gid);
    for (const k of allKeys()) if (k.startsWith(MEMBER + gid + ':')) lsDel(k);
  }
  function registry(){
    const now = Date.now(), keys = allKeys().sort(), active = {}, reserved = new Set();
    for (const k of keys){
      if (k.startsWith(MOVE_ACK)){
        const receipt = parse(lsGet(k), null);
        if (!receipt || now - receipt.at >= MAX_AGE) lsDel(k);
      }
      if (!k.startsWith(MEMBER)) continue;
      const [gid, id] = k.slice(MEMBER.length).split(':');
      const stamp = Number(lsGet(k));
      // Отрицательная отметка — pagehide. Она даёт следующей странице
      // время продолжить урок, но закрытая вкладка уже не входит в счётчик.
      if (!stamp || now - Math.abs(stamp) >= MAX_AGE || !lsGet(INFO + gid)){
        lsDel(k); continue;
      }
      reserved.add(gid);
      if (stamp > 0) (active[gid] ||= {})[id] = stamp;
    }
    const out = {};
    for (const k of keys){
      if (!k.startsWith(INFO)) continue;
      const gid = k.slice(INFO.length), g = groupData(gid);
      if (!g) continue;
      if (active[gid]) out[gid] = Object.assign(g, { tabs: active[gid] });
      else if (!reserved.has(gid) && now - g.createdAt >= MAX_AGE) forgetGroup(gid);
    }
    const raw = JSON.stringify(out);
    if (raw !== (lsGet(REGISTRY) || '{}')) lsSet(REGISTRY, raw);
    return out;
  }
  function groups(){
    if (bindMode() !== 'tab' || isFollower()) return [];
    const here = ssGet(SS_GID);
    return Object.entries(registry()).map(([gid, g]) => ({
      gid, here: gid === here, name: g.student.name, lessonId: g.lessonId, lessonLabel: g.lessonLabel || '',
      paused: g.paused, startedAt: g.startedAt, tabs: Object.keys(g.tabs).length,
    }));
  }
  function clearMember(){
    const gid = ssGet(SS_GID), id = ssGet(SS_ID);
    if (gid && id) lsDel(membership(gid, id));
    ssDel(SS_GID); ssDel(SS_CODE); ssDel(SS_MOVE);
  }
  function join(gid){
    ssSet(SS_GID, gid);
    ssSet(SS_CODE, ssGet('tsTab:code') || '');
    return lsSet(membership(gid, ssGet(SS_ID)), String(Date.now()));
  }
  function createGroup(s){
    const gid = uuid();
    if (!lsSet(INFO + gid, JSON.stringify(Object.assign({}, s, { createdAt: Date.now() }))) || !join(gid))
      throw new Error('Не удалось сохранить сессию в этом браузере.');
    registry();
    return gid;
  }
  function readTab(){
    if (IN_TOP && !tabInitialized) initTab();
    const gid = ssGet(SS_GID), id = ssGet(SS_ID);
    if (!gid || !id) return null;
    const code = ssGet('tsTab:code'), prev = ssGet(SS_CODE);
    if (code && prev !== code && IN_TOP){
      if (prev && codeInRegistry(prev) && !explicitJoin) { clearMember(); return null; }
      ssSet(SS_CODE, code);
      explicitJoin = false;
    }
    const at = Number(lsGet(membership(gid, id)));
    if (at <= 0 || Date.now() - at >= MAX_AGE) return null;
    return groupData(gid);
  }
  function readSessionRaw(){
    if (bindMode() === 'tab') return readTab();
    const s = parse(lsGet(LS_BROWSER), null);
    return s && s.student && s.student.id ? s : null;
  }
  function current(){
    if (isFollower()) return null;
    const s = readSessionRaw();
    if (!s) return null;
    return { id: String(s.student.id), name: String(s.student.name || ''), paused: !!s.paused,
             lessonId: s.lessonId || null, startedAt: s.startedAt || null, mode: bindMode() };
  }
  function reportOwner(){ return lsGet(LS_REPORT_OWNER); }
  function reportContext(s = readSessionRaw()){
    const owner = reportOwner();
    if (!IN_TOP || isFollower() || !s?.student?.id || !(s.startedAt > 0) ||
        !owner || (s.reportOwner && s.reportOwner !== owner)) return null;
    const student = studentsCache?.find(item => item.id === String(s.student.id));
    return { owner, reportId:s.reportId, studentId:String(s.student.id), studentName:s.student.name || '',
      startedAt:s.startedAt, lessonId:s.lessonId || null, grade:student?.grade ?? s.student.grade,
      exam:student?.exam ?? s.student.exam };
  }

  let reportsLoad;
  function loadReports(){
    if (window.LessonReports) return Promise.resolve(window.LessonReports);
    if (!reportsLoad) reportsLoad = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL('lesson-reports.js', SCRIPT?.src || location.href).href;
      script.onload = () => resolve(window.LessonReports);
      script.onerror = () => { reportsLoad = null; script.remove(); reject(new Error()); };
      document.head.appendChild(script);
    });
    return reportsLoad;
  }

  function offerReport(context, endedAt){
    if (context && endedAt - context.startedAt > 10000) {
      loadReports().then(reports => reports.offer({ ...context, endedAt })).catch(() => {});
    }
  }
  function handoffUrl(url, opts){
    const cur = current();
    if (!cur || cur.mode !== 'tab') return url;
    const dest = new URL(url, location.href);
    if (dest.origin !== location.origin) return url;
    dest.searchParams.set('sm', ssGet(SS_GID));
    if (opts?.move){
      const token = uuid();
      ssSet(SS_MOVE, token);
      dest.searchParams.set('smMove', token);
    }
    return dest.href;
  }

  let explicitJoin = false, suspended = false, tabInitialized = false;
  function initTab(){
    if (!IN_TOP) return;
    const url = new URL(location.href), gid = url.searchParams.get('sm'), move = url.searchParams.get('smMove');
    if (gid || move){
      url.searchParams.delete('sm'); url.searchParams.delete('smMove');
      history.replaceState(history.state, '', url.href);
    }
    if (bindMode() !== 'tab') return;
    tabInitialized = true;
    const oldGid = ssGet(SS_GID), oldId = ssGet(SS_ID);
    const stamp = oldGid && oldId ? Number(lsGet(membership(oldGid, oldId))) : 0;
    const fresh = stamp && Date.now() - Math.abs(stamp) < MAX_AGE;
    const resume = fresh && stamp < 0;
    // После перехода остаётся собственная отметка pagehide. Живая отметка
    // принадлежит оригиналу дубликата: её удалять и занимать нельзя.
    if (!resume) ssSet(SS_ID, uuid());
    const old = parse(ssGet(SS_TAB), null);
    const originalUrl = performance.getEntriesByType('navigation')[0]?.name || location.href;
    const params = new URL(originalUrl).searchParams;
    const split = params.has('tsnew') || params.has('tsresume');
    const prev = ssGet(SS_CODE) || old?.code, code = ssGet('tsTab:code');
    const mismatch = prev && code && prev !== code && codeInRegistry(prev);
    const available = registry();
    const duplicate = fresh && stamp > 0 && !window.opener;
    const restore = !split && !mismatch && (resume || duplicate);
    const target = !isFollower() && !split && (gid ? (available[gid] ? gid : null) : restore && oldGid);
    if (!resume) ssDel(SS_MOVE);
    if (resume && oldGid !== target) clearMember();
    ssDel(SS_GID); ssDel(SS_CODE);
    if (target && groupData(target)){
      explicitJoin = !!gid || !!duplicate;
      if (join(target) && move) lsSet(MOVE_ACK + move, JSON.stringify({ gid: target, at: Date.now() }));
    } else if (!gid && !split && !mismatch && !isFollower() && old?.student?.id){
      createGroup(old);
    }
    ssDel(SS_TAB);
    finishMove();
    registry();
  }
  function finishMove(){
    const token = ssGet(SS_MOVE);
    if (!token || !IN_TOP || bindMode() !== 'tab') return;
    const receipt = parse(lsGet(MOVE_ACK + token), null);
    if (!receipt || receipt.gid !== ssGet(SS_GID)) return;
    lsDel(MOVE_ACK + token);
    end();
  }
  document.addEventListener('click', e => {
    const link = e.target.closest?.('a.bl-tabs-link, a[target="_blank"][href*="deck-guide.html"], a#wkOpen');
    if (!link || e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    const prev = link.getAttribute('href'), url = handoffUrl(link.href);
    if (url === link.href) return;
    link.href = url;
    setTimeout(() => { if (link.href === url) link.setAttribute('href', prev); }, 0);
  });
  function heartbeat(){
    if (!IN_TOP || suspended || bindMode() !== 'tab' || isFollower()) return;
    finishMove();
    const gid = ssGet(SS_GID);
    if (!gid) return;
    if (!readTab() && !registry()[gid]) { clearMember(); return; }
    if (gid === ssGet(SS_GID)) lsSet(membership(gid, ssGet(SS_ID)), String(Date.now()));
    registry();
  }
  const boardTabs = new Map();
  // После перезагрузки закреплённого кабинета ссылки на окна уже нет.
  // Запоминаем их действующие имена перед уходом со страницы.
  window.addEventListener('pagehide', () => {
    for (const [id, tab] of boardTabs){
      try {
        const name = !tab.closed && tab.location.origin === location.origin && tab.name;
        if (name) ssSet('studentMem:boardWindow:' + id, name);
        else ssDel('studentMem:boardWindow:' + id);
      } catch (e) { ssDel('studentMem:boardWindow:' + id); }
    }
  });
  function openBoardTab(boardId){
    const url = handoffUrl('boards.html#board=' + encodeURIComponent(boardId), { move: true });
    let tab = boardTabs.get(boardId);
    const dest = new URL(url, location.href);
    // Кабинет мог открыться сразу после доски. Новому окну нельзя
    // наследовать её признак аварийной перезагрузки при явном щелчке.
    if (ssGet('boardsAutoOpenAttempt') === boardId) ssDel('boardsAutoOpenAttempt');
    try {
      // Совместный урок меняет имя окна на tsSess:<код>. Ссылка на то же
      // окно позволяет вернуть фокус, даже если имя уже сменилось.
      if (tab && !tab.closed && tab.location.origin === location.origin){
        if (tab.location.href !== dest.href){
          if (tab.sessionStorage.getItem('boardsAutoOpenAttempt') === boardId) tab.sessionStorage.removeItem('boardsAutoOpenAttempt');
          const old = tab.getCurrentBoard?.();
          const samePage = tab.location.pathname === dest.pathname && tab.location.search === dest.search;
          tab.location.href = dest.href;
          // Учитель мог перейти на другую доску. Уже открытый редактор
          // игнорирует смену одного хеша, поэтому заново открываем нужную.
          if (samePage && old && old.id !== boardId && old.cloudBoardId !== boardId) tab.location.reload();
        }
      } else tab = null;
    } catch (e) { tab = null; }
    if (!tab){
      const name = ssGet('studentMem:boardWindow:' + boardId);
      // Браузер понимает _self и _top как команды. Допустимы только имена доски и сессии.
      const target = /^tsSess:[A-Z0-9]+$/.test(name) ? name : 'mathhBoard:' + boardId;
      try { tab = window.open(url, target); } catch (e) {}
    }
    if (!tab){
      ssDel(SS_MOVE);
      throw new Error('Разрешите открытие всплывающих окон для этого сайта и нажмите ещё раз.');
    }
    boardTabs.set(boardId, tab);
    tab.focus();
  }

  /* ── подписчики ── */
  const listeners = [];
  let emitSig = '', lastGroupShape = '';
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
    // один клиент входа на страницу (его же берёт кнопка «＋ В вариант» в
    // exam-nav.js): два клиента с одним хранилищем сессии спорят при
    // обновлении токена, и вход может слететь
    if (window.__mathhSb) return (sb = window.__mathhSb);
    try { sb = (window.rtGuard || (c => c))(window.supabase.createClient(cfg.url, cfg.anonKey)); } catch (e) { sb = null; }
    if (sb) window.__mathhSb = sb;
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

  // Задача 56: одна попытка — одно событие. Неверный ответ (или подсказка,
  // показанный разбор) — bad сразу, в момент ошибки; верный — ok всегда, даже
  // после ошибок. Так в истории остаётся и ошибка, и итог («неверно → верно»),
  // а «сразу верно» — это ok без bad перед ним. Повтор одного события по
  // заданию в 10 минут по-прежнему отсекает record (три ошибки подряд — одно bad)
  function recordAttempt(task, opts){
    opts = opts || {};
    try {
      if (!task || !window.TaskKey) return { ok: false, reason: 'no_key' };
      const page = opts.page || (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
      const t = (opts.mode && task.mode == null) ? Object.assign({}, task, { mode: opts.mode }) : task;
      const key = window.TaskKey.fromTask(page, t);
      if (!key) return { ok: false, reason: 'no_key' };
      return record(key, opts.ok ? 'ok' : 'bad', { source: 'trainer', srcRef: page });
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
    ssDel(SS_MOVE);
    const next = { student: { id: String(student.id), name: String(student.name || ''), grade:student.grade, exam:student.exam },
                   paused: false, reportOwner:reportOwner(), reportId:uuid(),
                   lessonId: opts.lessonId || null, lessonLabel: opts.lessonLabel || '', startedAt: Date.now() };
    if (bindMode() === 'tab'){
      if (!ssGet(SS_ID)) ssSet(SS_ID, uuid());
      const prior = readTab(), gid = ssGet(SS_GID);
      if (prior && prior.student.id === next.student.id){
        ssSet(SS_CODE, ssGet('tsTab:code') || '');
        if (Object.hasOwn(opts, 'lessonId')) lsSet(LESSON + gid, JSON.stringify({ lessonId: next.lessonId, lessonLabel: next.lessonLabel }));
      } else {
        clearMember();
        createGroup(next);
      }
      registry();
    } else lsSet(LS_BROWSER, JSON.stringify(next));
    emit(true);
    try { await loadLog(student.id); } catch (e) { /* нет связи — подписи по старой копии, запись всё равно в очередь */ }
    scheduleFlush(0);
    return current();
  }
  function pause(on){
    const s = readSessionRaw();
    if (!s) return;
    s.paused = on == null ? !s.paused : !!on;
    if (bindMode() === 'tab'){
      lsSet(PAUSED + ssGet(SS_GID), s.paused ? '1' : '0');
      registry();
    } else lsSet(LS_BROWSER, JSON.stringify(s));
    emit(true);
  }
  function end(opts){
    const endedAt = Date.now(), canOffer = opts?.report !== false;
    let report = null;
    if (bindMode() === 'tab'){
      const gid = ssGet(SS_GID), scope = typeof opts === 'string' ? opts : opts?.scope || 'here';
      const target = scope === 'all' || scope === 'here' ? gid : scope;
      // Выход из одной вкладки оставляет урок открытым, пока есть другая.
      if (canOffer && target && (scope !== 'here' || Object.keys(registry()[gid]?.tabs || {}).length <= 1)) {
        report = reportContext(groupData(target));
      }
      if (scope !== 'here'){
        if (target && lsGet(INFO + target)) forgetGroup(target);
      }
      if (scope === 'here' || scope === 'all' || scope === gid) clearMember();
      registry();
    } else {
      if (canOffer) report = reportContext();
      lsDel(LS_BROWSER);
    }
    emit(true);
    scheduleFlush(0);
    offerReport(report, endedAt);
  }

  const tabPlural = new Intl.PluralRules('ru');
  function tabCount(n){
    const word = { one: 'вкладка', few: 'вкладки', many: 'вкладок' }[tabPlural.select(n)] || 'вкладки';
    return n + ' ' + word;
  }
  function sessionHint(){
    const n = (groups().find(g => g.here)?.tabs || 1) - 1;
    return 'Идёт сессия с этим учеником' + (n ? ' (ещё в ' + n + (tabPlural.select(n) === 'one' ? ' вкладке)' : ' вкладках)') : '');
  }
  function askEnd(){
    const s = current();
    if (!s || isFollower()) return;
    const list = groups(), initial = list.find(g => g.here);
    if (s.mode === 'browser' || (list.length === 1 && initial?.tabs === 1)) { end(); return; }
    if (!initial || document.getElementById('smEndDialog')) return;
    if (!document.getElementById('smEndCss')){
      const link = document.createElement('link');
      link.id = 'smEndCss'; link.rel = 'stylesheet';
      link.href = new URL('student-session-dialog.css', SCRIPT?.src || location.href).href;
      document.head.appendChild(link);
    }
    const dialog = document.createElement('dialog');
    dialog.id = 'smEndDialog';
    dialog.setAttribute('aria-labelledby', 'smEndTitle');
    dialog.innerHTML = '<h2 id="smEndTitle"></h2><div class="sm-end-actions">' +
      '<button type="button" data-scope="here">Закончить здесь</button><button type="button" data-scope="all"></button></div>' +
      '<h3>Идущие сессии</h3><ul></ul><button type="button" data-cancel autofocus>Отмена</button>';
    const labels = new Map(), requested = new Set();
    // Старые сессии содержат только lessonId. Для них читаем расписание,
    // как в кабинете; обычный старт уже передаёт подпись занятия.
    async function loadLabels(rows){
      const ids = [...new Set(rows.map(g => !g.lessonLabel && g.lessonId).filter(id => id && !requested.has(id)))];
      const c = client();
      if (!ids.length || !c) return;
      ids.forEach(id => requested.add(id));
      try {
        const { data } = await c.from('lessons').select('id,day,start_min').in('id', ids);
        for (const l of data || []){
          if (!l.day) continue;
          const day = new Date(l.day + 'T12:00:00').toLocaleDateString('ru-RU', { month:'long', day:'numeric' });
          const time = l.start_min == null ? '' : ', ' + Math.floor(l.start_min / 60) + ':' + String(l.start_min % 60).padStart(2, '0');
          labels.set(l.id, day + time);
        }
        if (dialog.open) paint();
      } catch (e) { /* без сети остаются имя ученика и начало сессии */ }
    }
    let lastList = '';
    function paint(){
      const rows = groups(), here = rows.find(g => g.here);
      if (here?.gid !== initial.gid) { if (dialog.open) dialog.close(); return; }
      dialog.querySelector('h2').textContent = 'Закончить сессию с ' + here.name + '?';
      dialog.querySelector('[data-scope="all"]').textContent = 'Закончить везде (' + tabCount(here.tabs) + ')';
      const html = rows.sort((a, b) => Number(b.here) - Number(a.here) || a.startedAt - b.startedAt).map(g => {
        const since = new Date(g.startedAt).toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' });
        const meta = [g.lessonLabel || labels.get(g.lessonId) || (g.lessonId ? 'Занятие' : ''), tabCount(g.tabs), 'идёт с ' + since, g.paused ? 'пауза' : ''].filter(Boolean);
        return '<li><div><strong>' + esc(g.name) + '</strong>' + (g.here ? ' <small>эта вкладка</small>' : '') +
          '<p>' + esc(meta.join(' · ')) + '</p></div><button type="button" data-group="' + esc(g.gid) +
          '" aria-label="Закончить сессию с ' + esc(g.name) + '">Закончить</button></li>';
      }).join('');
      if (lastList !== html) { dialog.querySelector('ul').innerHTML = html; lastList = html; }
      loadLabels(rows);
    }
    dialog.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); dialog.close(); }
    });
    dialog.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b){
        const r = dialog.getBoundingClientRect();
        if (e.target === dialog && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) dialog.close();
        return;
      }
      if (b.hasAttribute('data-cancel')) { dialog.close(); return; }
      if (bindMode() !== 'tab' || ssGet(SS_GID) !== initial.gid || !current()) { dialog.close(); return; }
      const target = b.dataset.group;
      if (target && target !== initial.gid) {
        end({ scope:target });
        dialog.querySelector('[data-cancel]').focus();
        return;
      }
      dialog.close();
      end({ scope:target || b.dataset.scope });
    });
    const off = onChange(paint);
    dialog.addEventListener('close', () => { off(); dialog.remove(); }, { once:true });
    document.body.appendChild(dialog);
    paint(); dialog.showModal();
  }

  async function listStudents(){
    const c = client();
    if (!c) throw new Error('Нет подключения к серверу');
    if (!(await signedIn(c))) { const e = new Error('Нужен вход'); e.code = 'auth'; throw e; }
    const r = await c.from('students').select('id, name, boards, archived_at, grade, exam').order('name', { ascending: true });
    if (r.error) throw new Error(errText(r.error));
    const list = (r.data || []).filter(s => !s.archived_at)
      .map(s => ({ id:String(s.id), name:s.name, boards:Array.isArray(s.boards) ? s.boards.map(String) : [],
        grade:s.grade, exam:s.exam }));
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
    if (c) {
      try {
        const result = await c.auth.getSession();
        const session = result?.data?.session;
        authed = !!session;
        const owner = session?.user?.id || null;
        if (owner !== reportOwner()){
          if (owner) lsSet(LS_REPORT_OWNER, owner); else lsDel(LS_REPORT_OWNER);
          window.LessonReports?.accountChanged(owner);
        }
      } catch (e) { authed = false; }
    }
    if (authed !== was) renderBar();
  }
  let bar = null, barSig = null, menuOpen = false;
  // свёрнута ли плашка в точку — выбор преподавателя, общий для всех страниц:
  // на доске плашка закрывает угол рабочего поля, поэтому её можно убрать.
  // По умолчанию свёрнута (просьба Даниила 15.11): развёрнута, только если
  // её развернули сами — тогда в памяти '0'
  const LS_MINI = 'smBarMini:v1';
  function isMini(){ return lsGet(LS_MINI) !== '0'; }
  const calm = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function setMini(v){
    lsSet(LS_MINI, v ? '1' : '0'); barSig = null;
    if (v && bar && !calm()) {           // сворачиваем: плашка уходит влево, потом остаётся точка
      bar.classList.add('sm-out');
      setTimeout(renderBar, 220);
      return;
    }
    renderBar();
    if (!v && bar && !calm()) {          // разворачиваем: плашка раскрывается из точки
      bar.classList.add('sm-in');
      setTimeout(() => { if (bar) bar.classList.remove('sm-in'); }, 280);
    }
  }
  function css(){
    if (document.getElementById('smBarCss')) return;
    const st = document.createElement('style');
    st.id = 'smBarCss';
    st.textContent =
      '#smBar,#smUndo{--sm-bg:var(--lesson-action-bg,#14549a)}' +
      'html[data-theme="dark"] :is(#smBar,#smUndo),body.dark :is(#smBar,#smUndo){--sm-bg:var(--lesson-action-bg,#2361a4)}' +
      '#smBar{position:fixed;left:12px;bottom:12px;z-index:2147482000;display:flex;align-items:center;gap:2px;' +
      'font:500 13px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;color:#fff;background:var(--sm-bg);' +
      'border-radius:999px;padding:4px 6px 4px 12px;' +
      'box-shadow:0 4px 18px rgba(0,0,0,.22);max-width:calc(100vw - 24px)}' +
      '#smBar .sm-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:40vw;margin-right:4px}' +
      '#smBar .sm-name b{font-weight:650}' +
      '#smBar button{font:inherit;color:inherit;background:transparent;border:0;border-radius:999px;padding:5px 9px;cursor:pointer}' +
      '#smBar button:hover{background:rgba(255,255,255,.14)}' +
      '#smBar :is(button,a):focus-visible,#smUndo:focus-visible{outline:2px solid #fff;outline-offset:-2px}' +
      '#smBar.sm-move{transition:left .24s cubic-bezier(.2,.8,.2,1),bottom .24s cubic-bezier(.2,.8,.2,1)}' +
      '#smBar.sm-in{animation:smIn .24s cubic-bezier(.2,.8,.2,1) both}#smBar.sm-out{animation:smOut .22s cubic-bezier(.2,.8,.2,1) both;pointer-events:none}' +
      '@keyframes smIn{from{clip-path:inset(0 100% 0 0 round 999px);opacity:.3}to{clip-path:inset(0 0 0 0 round 999px);opacity:1}}' +
      '@keyframes smOut{from{clip-path:inset(0 0 0 0 round 999px);opacity:1}to{clip-path:inset(0 100% 0 0 round 999px);opacity:.3}}' +
      '@media (prefers-reduced-motion:reduce){#smBar.sm-move{transition:none}#smBar.sm-in,#smBar.sm-out{animation:none}}' +
      '#smBar .sm-dot{opacity:.5}' +
      '#smBar a.sm-board{color:inherit;font-weight:650;text-decoration:underline;text-underline-offset:2px;padding:5px 9px;border-radius:999px}#smBar a.sm-board:hover{background:rgba(255,255,255,.14)}' +
      '#smMenu{position:absolute;left:0;bottom:calc(100% + 6px);min-width:220px;max-height:50vh;overflow:auto;background:var(--sm-bg);' +
      'border-radius:12px;padding:6px;box-shadow:0 8px 28px rgba(0,0,0,.3)}' +
      '#smMenu button{display:block;width:100%;text-align:left;border-radius:8px}' +
      '#smMenu .sm-note{padding:6px 9px}#smMenu a{color:inherit;text-decoration:underline;text-underline-offset:2px}' +
      '#smBar .sm-hide{padding:5px 8px;opacity:.65;margin-left:2px}#smBar .sm-hide:hover{opacity:1}' +
      // свёрнутая плашка — синяя точка; идёт сессия — внутри мигает зелёная,
      // на паузе зелёная горит ровно, без сессии точка пустая
      '#smBar.mini{padding:0;background:transparent;box-shadow:none}' +
      '#smBar.mini button.sm-pip{width:22px;height:22px;padding:0;border-radius:50%;background:var(--sm-bg);' +
      'box-shadow:0 2px 8px rgba(0,0,0,.3),inset 0 0 0 1.5px rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center}' +
      '#smBar.mini button.sm-pip:hover,#smUndo:hover{filter:brightness(1.08)}' +
      '#smBar .sm-pip i{width:10px;height:10px;border-radius:50%;background:#2fd36b;box-shadow:0 0 6px #2fd36b}' +
      '#smBar .sm-pip i.on{animation:smBlink 1.2s ease-in-out infinite}' +
      '@keyframes smBlink{0%,100%{opacity:1}50%{opacity:.15}}' +
      '@media (prefers-reduced-motion:reduce){#smBar .sm-pip i.on{animation:none}}' +
      '@media print{#smBar{display:none}}';
    (document.head || document.documentElement).appendChild(st);
  }
  function esc(s){ return String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }
  /* доска сессии: из досок ученика — та, где были в этой сессии последней
     (smLastBoard), иначе первая. Нужна кнопке «на доску» и подсветке в списке */
  const LS_LASTB = 'smLastBoard:v1:';
  function sessionBoards(s){
    const st = s && studentsCache && studentsCache.find(x => x.id === s.id);
    return st ? st.boards : [];
  }
  function sessionBoard(s){
    const list = sessionBoards(s);
    if (!list.length) return null;
    const last = lsGet(LS_LASTB + s.id);
    return list.indexOf(last) >= 0 ? last : list[0];
  }
  function trackBoard(s){
    const ctx = s && pickCtx ? ctxNow() : null, list = sessionBoards(s);
    const hit = ctx && ctx.boards ? ctx.boards.find(b => list.indexOf(b) >= 0) : null;
    if (hit && lsGet(LS_LASTB + s.id) !== hit) lsSet(LS_LASTB + s.id, hit);
  }
  // в списке досок доска ученика сессии слегка выделена (карточки перерисовываются
  // страницей, поэтому метим при каждом проходе плашки, а не один раз)
  function markBoards(s){
    const ids = s ? sessionBoards(s) : [];
    // у ученика в кабинете — облачные id досок, у карточки в списке — локальный
    // id и cloudBoardId: сверяем по обоим
    let local = [];
    try { local = (window.getDB && window.getDB().boards) || []; } catch (e) {}
    document.querySelectorAll('.bl-card[data-board]').forEach(c => {
      const id = c.getAttribute('data-board'), b = local.find(x => x.id === id);
      c.classList.toggle('sm-sess-board', ids.indexOf(id) >= 0 || !!(b && b.cloudBoardId && ids.indexOf(b.cloudBoardId) >= 0));
    });
    if (ids.length && !document.getElementById('smMarkCss')) {
      const st = document.createElement('style'); st.id = 'smMarkCss';
      st.textContent = '.bl-card.sm-sess-board{box-shadow:0 0 0 2px #2fd36b,0 6px 18px rgba(47,211,107,.28)}' +
        '.bl-card.sm-sess-board::after{content:"доска сессии";position:absolute;top:8px;right:8px;font:600 11px/1 system-ui,sans-serif;color:#fff;background:#2fa35b;border-radius:999px;padding:4px 8px;pointer-events:none}' +
        '.bl-card.sm-sess-board{position:relative}';
      document.head.appendChild(st);
    }
  }
  /* внизу слева на «Досках» уже стоит плашка входа («Даниил · доступ · выйти»
     или кружок «⋯»). Плашку сессии ставим правее неё; не влезает (телефон) —
     над ней. Меряем при каждом проходе: плашку входа сворачивают и разворачивают */
  function placeBar(){
    if (!bar) return;
    let pill = null;
    ['authUserPill', 'agPillHandle'].forEach(id => { const e = document.getElementById(id); if (e && e.offsetWidth) pill = e; });
    let left = '12px', bottom = '12px';
    if (pill) {
      const r = pill.getBoundingClientRect(), w = bar.offsetWidth;
      if (window.innerWidth - r.right - 8 >= w + 8) { left = Math.round(r.right + 8) + 'px'; bottom = Math.max(12, Math.round(window.innerHeight - r.bottom)) + 'px'; }
      else bottom = Math.round(window.innerHeight - r.top + 8) + 'px';
    }
    if (bar.style.left !== left) bar.style.left = left;
    if (bar.style.bottom !== bottom) bar.style.bottom = bottom;
    // двигаться плавно — только после первой расстановки, иначе при загрузке
    // страницы плашка ехала бы из угла
    if (!bar.classList.contains('sm-move')) requestAnimationFrame(() => { if (bar) bar.classList.add('sm-move'); });
  }
  // плашка входа раскрылась/свернулась — едем тут же, с той же длительностью и кривой
  window.addEventListener('agpillchange', () => placeBar());
  function renderBar(){
    if (!IN_TOP || !document.body) return;
    placeBar();
    const s = isFollower() ? null : current();
    if (s) { ensureStudents(); trackBoard(s); }
    markBoards(s);
    const picker = !s && wantsPicker() && !isFollower();
    let bound = null;
    if (picker && pickCtx){ ensureStudents(); bound = boundStudent(ctxNow()); }
    const mini = isMini();
    const tb = s ? sessionBoard(s) : null, ctxB = s && pickCtx ? ctxNow() : null;
    const goBoard = tb && !(ctxB && ctxB.boards && ctxB.boards.indexOf(tb) >= 0) ? tb : null;
    let sig = s ? 'S|' + s.id + '|' + s.name + '|' + s.paused + '|' + (goBoard || '') : (picker ? 'P|' + (bound ? bound.id + '|' + bound.name : '') : '');
    const report = s && reportContext();
    if (sig) sig += '|' + (mini ? 'm' : '') + '|' + (report?.owner || '');
    if (sig === barSig) return;
    barSig = sig; menuOpen = false;
    if (!sig){ if (bar) { bar.remove(); bar = null; } return; }
    css();
    if (!bar){ bar = document.createElement('div'); bar.id = 'smBar'; bar.setAttribute('role', 'status'); document.body.appendChild(bar); }
    bar.classList.remove('sm-out');
    bar.classList.toggle('paused', !!(s && s.paused));
    bar.classList.toggle('mini', mini);
    setTimeout(placeBar, 0);
    const HIDE = '<button type="button" class="sm-hide" data-sm="mini" title="Свернуть в точку" aria-label="Свернуть">–</button>';
    if (mini){
      const t = s ? 'Сессия: ' + (s.name || 'ученик') + (s.paused ? ' (на паузе)' : '') + ' — развернуть' : 'Начать сессию с учеником — развернуть';
      bar.innerHTML = '<button type="button" class="sm-pip" data-sm="expand" title="' + esc(t) + '" aria-label="' + esc(t) + '">' +
        (s ? '<i class="' + (s.paused ? '' : 'on') + '"></i>' : '') + '</button>';
    } else if (s){
      bar.innerHTML = '<span class="sm-name">Сессия: <b>' + esc(s.name || 'ученик') + '</b>' + (s.paused ? ' · на паузе' : '') + '</span>' +
        '<button type="button" data-sm="pause">' + (s.paused ? 'продолжить' : 'пауза') + '</button>' +
        (goBoard ? '<span class="sm-dot">·</span><a class="sm-board" href="boards.html#board=' + encodeURIComponent(goBoard) + '" title="Вернуться на доску ученика">на доску</a>' : '') +
        (report ? '<span class="sm-dot">·</span><button type="button" data-sm="report">Отчёт</button>' : '') +
        '<span class="sm-dot">·</span><button type="button" data-sm="end">закончить</button>' + HIDE;
    } else {
      bar.innerHTML = bound
        ? '<button type="button" data-sm="start" data-id="' + esc(bound.id) + '" data-name="' + esc(bound.name) + '">Начать сессию: <b>' + esc(bound.name) + '</b></button>' +
          '<span class="sm-dot">·</span><button type="button" data-sm="pick" title="Выбрать другого ученика">другой</button>'
        : '<button type="button" data-sm="pick">Начать сессию с учеником</button>';
      bar.insertAdjacentHTML('beforeend', HIDE);
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
    else if (a === 'end') askEnd();
    else if (a === 'report') {
      const context = reportContext();
      if (context) loadReports().then(reports => reports.open(context, b)).catch(() => {});
    }
    else if (a === 'pick') openMenu();
    else if (a === 'mini') setMini(true);
    else if (a === 'expand') setMini(false);
    else if (a === 'start') start({ id: b.getAttribute('data-id'), name: b.getAttribute('data-name') });
  });

  /* ── события браузера ── */
  window.addEventListener('storage', e => {
    if (e.key === LS_REPORT_OWNER) { window.LessonReports?.accountChanged(reportOwner()); renderBar(); return; }
    if (e.newValue && e.key === MOVE_ACK + ssGet(SS_MOVE)) { finishMove(); return; }
    if (e.key === REGISTRY && bindMode() === 'tab'){
      const currentGroup = ssGet(SS_GID);
      if (currentGroup && !lsGet(INFO + currentGroup) && IN_TOP) clearMember();
      // Собираем актуальное состояние и после одновременных записей двух окон.
      // Обновление одного лишь времени не перерисовывает открытое меню.
      const live = IN_TOP ? registry() : parse(lsGet(REGISTRY), {});
      const shape = JSON.stringify(Object.entries(live).map(([id, g]) => [id, g.student.id, g.student.name,
        g.lessonId, g.lessonLabel, g.paused, Object.keys(g.tabs).length]));
      if (shape !== lastGroupShape) { lastGroupShape = shape; emit(true); }
      return;
    }
    if (e.key === LS_MINI) { barSig = null; renderBar(); return; }
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
    if (IN_TOP && bindMode() === 'tab' && readTab()){
      suspended = true;
      lsSet(membership(ssGet(SS_GID), ssGet(SS_ID)), String(-Date.now()));
      registry();
    }
  });
  window.addEventListener('pageshow', e => { if (e.persisted) { suspended = false; initTab(); emit(true); } });
  if (IN_TOP) setInterval(heartbeat, HEARTBEAT);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { heartbeat(); emit(false); scheduleFlush(0); } });
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
  initTab();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();


  /* ── «Начать сессию» с переходом на главную и «Отменить» ──
     Настройка кабинета sessionGoHome: после старта кабинет зовёт goHome() —
     запоминает, откуда пришли (sessionStorage, только эта вкладка), и
     открывает главную. Там сверху висит «Отменить»: закончит сессию и
     вернёт обратно. Первое же нажатие на что-либо другое (или клавиша)
     убирает кнопку — тогда начало сессии считается намеренным */
  const UNDO_KEY = 'smUndo:v1', UNDO_TTL = 5 * 60 * 1000;
  function goHome(){
    try { sessionStorage.setItem(UNDO_KEY, JSON.stringify({ back: location.href, at: Date.now() })); } catch (e) {}
    location.href = 'index.html';
  }
  function undoInit(){
    if (!IN_TOP) return;
    let u = null;
    try { u = JSON.parse(sessionStorage.getItem(UNDO_KEY) || 'null'); sessionStorage.removeItem(UNDO_KEY); } catch (e) {}
    if (!u || !u.back || Date.now() - u.at > UNDO_TTL || !current()) return;
    css();
    const st = document.createElement('style');
    st.textContent = '#smUndo{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483000;font:600 15px/1 system-ui,-apple-system,"Segoe UI",sans-serif;' +
      'color:#fff;background:var(--sm-bg);border:0;border-radius:999px;padding:12px 20px;cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,.28)}';
    document.head.appendChild(st);
    const b = document.createElement('button');
    b.id = 'smUndo'; b.type = 'button'; b.textContent = '↩ Отменить начало сессии';
    document.body.appendChild(b);
    const drop = () => { b.remove(); st.remove(); document.removeEventListener('pointerdown', onAny, true); document.removeEventListener('keydown', onAny, true); };
    const onAny = e => { if (e.target !== b) drop(); };
    document.addEventListener('pointerdown', onAny, true);
    document.addEventListener('keydown', onAny, true);
    b.addEventListener('click', () => { drop(); end({ report:false }); location.href = u.back; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', undoInit); else undoInit();

  window.StudentMemory = {
    current, groups, start, end, askEnd, sessionHint, pause, record, recordTask, recordAttempt, summary, kindSummary, keys, logState, forget, fetchLog, loadLog,
    reportContext, reportOwner, offerReport,
    listStudents, onChange, flush, isFollower, bindMode, setPickerContext, goHome, handoffUrl, openBoardTab,
    queue: () => readQueue().slice(), deadLetters: () => parse(lsGet(LS_DEAD), []),
    THROTTLE_MS,
  };
})();
