/* ═══════════════════════════════════════════════════════════════════════
   notes-store.js — хранилище «Конспекта сессии» (промпт №16).

   Конспект — это страницы, которые сами собираются, пока работаешь в
   тренажёрах: перед сменой задания (если с ним что-то делали) задание и
   записи вокруг него уходят отдельной страницей. Страницы группируются по
   сессиям, редактируются в notes.html, собираются в PDF и переносятся на
   доску.

   Здесь то, что нужно сразу трём местам — тренажёрам (lesson-notes.js),
   редактору (notes.html) и доскам (boards-core.js забирает «Сохранить как
   доску»):
   - база IndexedDB ogeNotesDB: sessions, pages, outbox;
   - текущая сессия и её жизнь (localStorage lnCurrent:v1);
   - формат страницы и общая геометрия (резка штрихов растровым ластиком);
   - сборка доски из сессии.

   Почему IndexedDB, а не localStorage: на странице лежит снимок задания
   картинкой (сотни килобайт), а у localStorage потолок около 5 МБ на весь
   сайт, и там же живут вход Supabase, тема и подборка (раздел 8, «Грабли»).
   Почему отдельная база, а не ogeBoardsDB: досками владеет boards-core.js
   со своим слиянием вкладок (idbSaveMerged) — писать туда в обход него
   значило бы рано или поздно затереть чью-то доску.

   Формат объектов на странице — ровно формат объектов досок (раздел 6
   HANDOFF): image, pen, line, quad (rect:true), ellipse, text. Поэтому
   «Сохранить как доску» — это просто сдвиг координат, без перевода.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.NotesStore) return;

  const DB_NAME = 'ogeNotesDB';
  const DB_VER = 1;
  const CUR_KEY = 'lnCurrent:v1';
  // сессия сама заканчивается, если в ней так долго ничего не происходило:
  // занятия разделены часами, и «Завершить сессию» после урока легко забыть.
  // Те же три часа, что у истории решённого в тренажёрах (раздел 4)
  const IDLE_MS = 3 * 60 * 60 * 1000;

  // страница — лист доски один в один: 76 × 54 клетки по 24 px (альбомный
  // А4). Тогда страница конспекта ложится на лист доски без масштаба
  const PAGE_W = 76 * 24;   // 1824
  const PAGE_H = 54 * 24;   // 1296

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  /* ── база ── */
  let dbPromise = null;
  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      let req;
      try { req = indexedDB.open(DB_NAME, DB_VER); } catch (e) { reject(e); return; }
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('sessions')) db.createObjectStore('sessions', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('pages')) {
          const st = db.createObjectStore('pages', { keyPath: 'id' });
          st.createIndex('bySession', 'sessionId', { unique: false });
        }
        if (!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', { keyPath: 'id' });
      };
      req.onsuccess = () => {
        const db = req.result;
        // другая вкладка открыла базу новой версии — отпускаем, иначе она
        // зависнет на onblocked
        db.onversionchange = () => { try { db.close(); } catch (e) {} dbPromise = null; };
        resolve(db);
      };
      req.onerror = () => { dbPromise = null; reject(req.error); };
      req.onblocked = () => {};
    });
    return dbPromise;
  }
  function reqP(r) { return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
  function txDone(t) { return new Promise((res, rej) => { t.oncomplete = () => res(); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error || new Error('abort')); }); }

  async function getSession(id) {
    if (!id) return null;
    const db = await openDb();
    return (await reqP(db.transaction('sessions').objectStore('sessions').get(id))) || null;
  }
  async function putSession(s) {
    const db = await openDb();
    const t = db.transaction('sessions', 'readwrite');
    t.objectStore('sessions').put(s);
    await txDone(t);
    post({ t: 'session', id: s.id });
    return s;
  }
  async function listSessions() {
    const db = await openDb();
    const all = await reqP(db.transaction('sessions').objectStore('sessions').getAll());
    return (all || []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }
  async function getPage(id) {
    const db = await openDb();
    return (await reqP(db.transaction('pages').objectStore('pages').get(id))) || null;
  }
  async function putPage(p) {
    const db = await openDb();
    const t = db.transaction('pages', 'readwrite');
    p.updatedAt = Date.now();
    t.objectStore('pages').put(p);
    await txDone(t);
    return p;
  }
  // страницы сессии в её порядке (session.pageIds). Страница, которой в
  // порядке почему-то нет (порядок писала другая вкладка), не теряется —
  // встаёт в конец
  async function getPages(sessionId) {
    const db = await openDb();
    const t = db.transaction(['sessions', 'pages']);
    const s = await reqP(t.objectStore('sessions').get(sessionId));
    const list = await reqP(t.objectStore('pages').index('bySession').getAll(sessionId));
    const order = (s && s.pageIds) || [];
    const byId = new Map((list || []).map(p => [p.id, p]));
    const out = [];
    order.forEach(id => { const p = byId.get(id); if (p) { out.push(p); byId.delete(id); } });
    [...byId.values()].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)).forEach(p => out.push(p));
    return out;
  }
  async function countPages(sessionId) {
    const db = await openDb();
    return reqP(db.transaction('pages').objectStore('pages').index('bySession').count(sessionId));
  }
  // новая страница — одной транзакцией вместе с порядком сессии: две
  // вкладки тренажёров, сохраняющие одновременно, не затрут друг другу
  // список страниц
  async function addPage(sessionId, page, atIndex) {
    const db = await openDb();
    const t = db.transaction(['sessions', 'pages'], 'readwrite');
    const ss = t.objectStore('sessions');
    const s = await reqP(ss.get(sessionId));
    if (!s) { t.abort(); throw new Error('нет сессии ' + sessionId); }
    page.id = page.id || uid();
    page.sessionId = sessionId;
    page.createdAt = page.createdAt || Date.now();
    page.updatedAt = Date.now();
    t.objectStore('pages').put(page);
    s.pageIds = (s.pageIds || []).filter(id => id !== page.id);
    if (typeof atIndex === 'number' && atIndex >= 0 && atIndex <= s.pageIds.length) s.pageIds.splice(atIndex, 0, page.id);
    else s.pageIds.push(page.id);
    s.updatedAt = Date.now();
    ss.put(s);
    await txDone(t);
    post({ t: 'page-added', sessionId, pageId: page.id });
    return page;
  }
  async function deletePage(sessionId, pageId) {
    const db = await openDb();
    const t = db.transaction(['sessions', 'pages'], 'readwrite');
    t.objectStore('pages').delete(pageId);
    const ss = t.objectStore('sessions');
    const s = await reqP(ss.get(sessionId));
    if (s) { s.pageIds = (s.pageIds || []).filter(id => id !== pageId); s.updatedAt = Date.now(); ss.put(s); }
    await txDone(t);
    post({ t: 'session', id: sessionId });
  }
  async function setPageOrder(sessionId, ids) {
    const db = await openDb();
    const t = db.transaction('sessions', 'readwrite');
    const ss = t.objectStore('sessions');
    const s = await reqP(ss.get(sessionId));
    if (s) { s.pageIds = ids.slice(); s.updatedAt = Date.now(); ss.put(s); }
    await txDone(t);
    post({ t: 'session', id: sessionId });
  }
  async function deleteSession(id) {
    const db = await openDb();
    const t = db.transaction(['sessions', 'pages'], 'readwrite');
    const keys = await reqP(t.objectStore('pages').index('bySession').getAllKeys(id));
    (keys || []).forEach(k => t.objectStore('pages').delete(k));
    t.objectStore('sessions').delete(id);
    await txDone(t);
    const cur = readCur();
    if (cur && cur.id === id) writeCur(null);
    post({ t: 'session', id });
  }

  /* ── текущая сессия ──
     Одна на весь браузер (localStorage, общая для вкладок): человек ведёт
     одно занятие, переходя между тренажёрами и вкладками. Новая начинается,
     когда прошлую завершили (кнопкой или три часа тишины), — лениво, на
     первой сохранённой странице, чтобы не плодить пустые сессии от каждого
     случайного открытия тренажёра. */
  function readCur() {
    try { const v = JSON.parse(localStorage.getItem(CUR_KEY) || 'null'); return v && v.id ? v : null; } catch (e) { return null; }
  }
  function writeCur(v) {
    try { if (v) localStorage.setItem(CUR_KEY, JSON.stringify(v)); else localStorage.removeItem(CUR_KEY); } catch (e) {}
    post({ t: 'current' });
  }
  async function newSession(extra) {
    const now = Date.now();
    const s = Object.assign({ id: uid(), name: null, createdAt: now, updatedAt: now, endedAt: null, pageIds: [] }, extra || {});
    await putSession(s);
    writeCur({ id: s.id, at: now });
    return s;
  }
  // id текущей сессии, если она жива; create — завести новую, если нет
  async function currentSession(opts) {
    opts = opts || {};
    const cur = readCur();
    if (cur) {
      const s = await getSession(cur.id);
      if (s && !s.endedAt && Date.now() - (cur.at || 0) < IDLE_MS) return s;
      if (s && !s.endedAt) await finishSession(s);
      writeCur(null);
    }
    return opts.create ? newSession() : null;
  }
  function touchCurrent(id) {
    const cur = readCur();
    if (cur && cur.id === id) writeCur({ id, at: Date.now() });
  }
  // завершённая сессия без единой страницы никому не нужна — убираем её,
  // чтобы список сессий не зарастал пустыми строками
  async function finishSession(s) {
    const n = await countPages(s.id);
    if (!n) { await deleteSession(s.id); return; }
    s.endedAt = Date.now();
    await putSession(s);
  }
  async function endCurrent() {
    const cur = readCur();
    writeCur(null);
    if (!cur) return;
    const s = await getSession(cur.id);
    if (s && !s.endedAt) await finishSession(s);
  }
  async function startNew() {
    await endCurrent();
    return newSession();
  }

  /* ── outbox: «Сохранить как доску» ──
     Доску в ogeBoardsDB кладёт сам boards-core.js при запуске (обычным
     saveDB со слиянием вкладок): редактор только оставляет её здесь и
     открывает boards.html#board=<id>. */
  async function putOutbox(item) {
    const db = await openDb();
    const t = db.transaction('outbox', 'readwrite');
    t.objectStore('outbox').put(item);
    await txDone(t);
  }
  async function takeOutbox() {
    let db;
    try { db = await openDb(); } catch (e) { return []; }
    const t = db.transaction('outbox', 'readwrite');
    const st = t.objectStore('outbox');
    const items = await reqP(st.getAll());
    (items || []).forEach(it => st.delete(it.id));
    await txDone(t);
    return items || [];
  }

  /* ── соседние вкладки: редактор обновляет список страниц, тренажёры —
     счётчик на кнопке ── */
  let bc = null;
  try { bc = new BroadcastChannel('ln-notes'); } catch (e) { bc = null; }
  const listeners = [];
  function post(msg) {
    listeners.forEach(fn => { try { fn(msg, true); } catch (e) {} });
    try { if (bc) bc.postMessage(msg); } catch (e) {}
  }
  if (bc) bc.onmessage = (e) => listeners.forEach(fn => { try { fn(e.data || {}, false); } catch (err) {} });
  window.addEventListener('storage', (e) => { if (e.key === CUR_KEY) listeners.forEach(fn => { try { fn({ t: 'current' }, false); } catch (err) {} }); });
  function onChange(fn) { listeners.push(fn); }

  /* ── подписи ── */
  const RESULT_LABEL = { ok: 'ответ верный', bad: 'ответ неверный', none: 'ответ не дан', notes: 'только записи', blank: 'пустая страница' };
  const MONTHS = ['янв.', 'февр.', 'марта', 'апр.', 'мая', 'июня', 'июля', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'];
  function two(n) { return String(n).padStart(2, '0'); }
  function fmtDate(ts) { const d = new Date(ts); return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  function fmtTime(ts) { const d = new Date(ts); return two(d.getHours()) + ':' + two(d.getMinutes()); }
  function fmtDateTime(ts) { return fmtDate(ts) + ', ' + fmtTime(ts); }
  function sessionTitle(s) { return (s && s.name) || ('Сессия ' + fmtDateTime((s && s.createdAt) || Date.now())); }

  /* ── растровый ластик по векторным штрихам ──
     На доске тренажёра ластик стирает пиксели. В конспекте записи —
     отдельные редактируемые штрихи, а у досок, куда страница может уехать,
     растрового ластика нет совсем. Поэтому стирание переводим в геометрию:
     у штриха выбрасываются точки, попавшие под путь ластика, и штрих
     распадается на куски. Точки предварительно сгущаются — иначе длинная
     прямая из двух точек не «прорезалась» бы посередине. Картинки, текст и
     фигуры этим ластиком не режутся (их удаляет ластик по штрихам). */
  function d2seg(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy;
    let t = l2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const x = a.x + t * dx - p.x, y = a.y + t * dy - p.y;
    return x * x + y * y;
  }
  function distToPath2(p, path) {
    if (path.length === 1) { const x = p.x - path[0].x, y = p.y - path[0].y; return x * x + y * y; }
    let m = Infinity;
    for (let i = 0; i < path.length - 1; i++) { const d = d2seg(p, path[i], path[i + 1]); if (d < m) m = d; }
    return m;
  }
  function bboxOf(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    pts.forEach(p => { if (p.x < x0) x0 = p.x; if (p.y < y0) y0 = p.y; if (p.x > x1) x1 = p.x; if (p.y > y1) y1 = p.y; });
    return { x0, y0, x1, y1 };
  }
  function densify(pts, step) {
    if (pts.length < 2) return pts.slice();
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      const n = Math.floor(d / step);
      for (let k = 1; k < n; k++) out.push({ x: a.x + (b.x - a.x) * k / n, y: a.y + (b.y - a.y) * k / n });
      out.push(b);
    }
    return out;
  }
  // objs — объекты страницы; path — путь ластика; radius — половина его
  // толщины. Возвращает новый массив (объекты, которых ластик не коснулся,
  // — те же самые ссылки) и признак, было ли что-то стёрто
  function eraseAlong(objs, path, radius) {
    if (!path || !path.length) return { objs, changed: false };
    const pb = bboxOf(path);
    const r2 = radius * radius;
    let changed = false;
    const out = [];
    objs.forEach(o => {
      if ((o.type !== 'pen' && o.type !== 'line') || !o.points || !o.points.length || o.axis) { out.push(o); return; }
      const ob = bboxOf(o.points);
      if (ob.x1 < pb.x0 - radius || ob.x0 > pb.x1 + radius || ob.y1 < pb.y0 - radius || ob.y0 > pb.y1 + radius) { out.push(o); return; }
      const step = Math.max(0.6, Math.min(3, radius / 3));
      const pts = o.points.length === 1 ? o.points.slice() : densify(o.points, step);
      const keep = pts.map(p => distToPath2(p, path) > r2);
      if (keep.every(Boolean)) { out.push(o); return; }
      changed = true;
      if (o.points.length === 1) return; // точка целиком под ластиком
      let run = [];
      const flush = () => {
        if (run.length >= 2) {
          const piece = Object.assign({}, o, { id: uid(), type: 'pen', points: run });
          delete piece.arrowEnd; delete piece.arrowStart; delete piece.pivot;
          out.push(piece);
        }
        run = [];
      };
      pts.forEach((p, i) => { if (keep[i]) run.push(p); else flush(); });
      flush();
    });
    return { objs: changed ? out : objs, changed };
  }

  /* ── доска из сессии ──
     Каждая страница — отдельный лист доски, сверху вниз от среднего листа
     полотна (100, 100 — туда доска открывается по умолчанию, раздел 6),
     порядок страниц «по высоте». */
  function boardFromSession(session, pages) {
    const now = Date.now();
    const id = uid();
    const objects = [];
    pages.forEach((p, k) => {
      const ox = 100 * PAGE_W, oy = (100 + k) * PAGE_H;
      (p.objects || []).forEach(o => {
        const c = JSON.parse(JSON.stringify(o));
        c.id = uid();
        c.points = (c.points || []).map(pt => ({ x: Math.round((pt.x + ox) * 10) / 10, y: Math.round((pt.y + oy) * 10) / 10 }));
        if (c.ctrl) c.ctrl = { x: c.ctrl.x + ox, y: c.ctrl.y + oy };
        objects.push(c);
      });
    });
    return {
      id, name: sessionTitle(session), folderId: null,
      createdAt: now, updatedAt: now, lastOpenedAt: null,
      cellSize: 24, sheetCols: 76, sheetRows: 54, sheetCount: 1, pageOrder: 'v',
      objects, fromNotes: session.id,
    };
  }

  window.NotesStore = {
    PAGE_W, PAGE_H, IDLE_MS, uid,
    openDb, getSession, putSession, listSessions, deleteSession,
    getPage, putPage, getPages, countPages, addPage, deletePage, setPageOrder,
    currentSession, touchCurrent, readCur, endCurrent, startNew, newSession,
    putOutbox, takeOutbox, boardFromSession,
    onChange, post,
    RESULT_LABEL, fmtDate, fmtTime, fmtDateTime, sessionTitle,
    eraseAlong, densify, bboxOf,
  };
})();
