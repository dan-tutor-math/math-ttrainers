/* ═══════════════════════════════════════════════════════════════════════
   image-store.js — картинки досок в хранилище файлов Supabase (промпт №89,
   «переезд на сервер», шаг 1).

   Зачем. Картинка на доске хранилась прямо в объекте текстом (data:…base64):
   250 МБ досок учителя — почти сплошь такие строки. Они лежат в хранилище
   браузера, в памяти страницы (по 1,3 МБ строки на мегабайт картинки плюс
   её распакованная копия), в каждом снимке отмены, в каждой рассылке
   облачной доски. Падение вкладки посреди записи таких махин и портило
   хранилище (HANDOFF, раздел 6, «Если доски тормозят или падают»).
   Теперь картинка — файл в бакете board-images, а в доске остаётся
   короткая ссылка. Файлами браузер распоряжается сам: кэширует, выгружает,
   подгружает.

   Как. Не трогаем ни одно из мест, где картинки попадают на доску (вставка,
   файл, задание из тренажёра, формула, панель заметок): «переносчик» раз в
   пару секунд ищет на открытой доске картинки, которые ещё текстом, и по
   одной заливает их, а потом подменяет src на ссылку. Новая картинка
   уезжает через секунду-две после вставки, старые — когда доску открывают.
   Пока картинка не залита (нет входа, нет связи, бакета ещё нет), она
   живёт текстом, как раньше: урок без интернета не ломается.

   В доску пишется не адрес, а ключ «img:<путь>» (№89б): адрес сервера
   подставляет imgUrl (boards-core.js) из IMG_BASE_URL (supabase-config.js),
   так переезд на другой сервер — одна строка настроек.
   Имя файла — <id пользователя>/<sha-256 содержимого>.<тип>: одна и та же
   картинка заливается один раз, а угадать имя нельзя. Бакет публичный —
   ученик в совместной сессии видит картинки без входа (SQL —
   board-images-schema.sql). Ссылка подменяется только после того, как
   картинка по ней реально загрузилась: на экране ничего не мигает.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const BUCKET = 'board-images';
  const TICK_MS = 2000;
  let off = false;          // бакета нет / нет прав — до перезагрузки не пытаемся
  let busy = false;
  const failed = new Set(); // картинки, которые не залились, — не долбим каждый тик
  const done = new Map();   // data: → ссылка (одна картинка на нескольких объектах)

  function client() { return window.SB && window.SB.storage ? window.SB : null; }
  function userId() { return (window.CURRENT_USER && window.CURRENT_USER.id) || ''; }
  function isData(src) { return typeof src === 'string' && src.startsWith('data:image/'); }
  // №89б: в первые часы переезда в доски успели записаться полные адреса
  // бакета — их переводим в ключ «img:…» без всякой заливки
  function isFullUrl(src) { return typeof src === 'string' && !!window.IMG_BASE_URL && src.startsWith(window.IMG_BASE_URL); }

  // все места доски, где у картинки есть src: сама доска и разбор у задания
  // с тренажёра (sol). Панель заметок (refPanel) — нет: она живёт только в
  // браузере, на сервер не ездит, и уборка мусора (gc ниже) по базе не
  // увидела бы, что её картинка ещё нужна
  function holders(test, board) {
    test = test || isData;
    board = board || (typeof B !== 'undefined' ? B : null);
    const out = [];
    if (!board || !Array.isArray(board.objects)) return out;
    board.objects.forEach((o) => {
      if (!o) return;
      if (o.type === 'image' && test(o.src)) out.push({ o, k: 'src' });
      if (o.sol && test(o.sol.src)) out.push({ o: o.sol, k: 'src' });
    });
    return out;
  }

  function dataToBlob(src) {
    const comma = src.indexOf(',');
    const meta = src.slice(5, comma);
    const type = meta.split(';')[0] || 'image/png';
    const body = src.slice(comma + 1);
    let bytes;
    if (/;base64/.test(meta)) {
      const bin = atob(body);
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    } else {
      bytes = new TextEncoder().encode(decodeURIComponent(body));
    }
    return { blob: new Blob([bytes], { type }), bytes, type };
  }
  const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg' };
  async function hashHex(bytes) {
    const d = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(d)).map(x => x.toString(16).padStart(2, '0')).join('');
  }
  // ссылку берём только когда картинка по ней действительно грузится, и
  // сразу кладём её в кэш доски — подмена src не даёт ни кадра пустоты
  function preload(url) {
    return new Promise((resolve, reject) => {
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error('картинка по ссылке не загрузилась'));
      im.src = url;
    });
  }

  async function upload(src) {
    if (done.has(src)) return done.get(src);
    const sb = client(), uid = userId();
    const { blob, bytes, type } = dataToBlob(src);
    const path = uid + '/' + (await hashHex(bytes)) + '.' + (EXT[type] || 'png');
    const st = sb.storage.from(BUCKET);
    const res = await st.upload(path, blob, { contentType: type, upsert: false, cacheControl: '31536000' });
    // уже есть — та же картинка (имя = содержимое), это не ошибка
    if (res.error && !/exist|duplicate|409/i.test(String(res.error.message || res.error.statusCode || res.error))) throw res.error;
    // в доску — ключ, а не адрес: адрес сервера подставляет imgUrl при показе
    const key = 'img:' + path;
    const im = await preload(imgUrl(key));
    if (typeof imgCache !== 'undefined') imgCache[key] = im;
    done.set(src, key);
    return key;
  }

  // любая доска целиком (перенос на сервер, cloud-migrate.js): все её
  // картинки — в хранилище. Бросает ошибку, если хранилище недоступно, —
  // тогда переносить доску на сервер нельзя: в базу уехали бы мегабайты
  async function convertBoard(board) {
    if (!client() || !userId()) throw new Error('нет входа');
    let n = 0;
    for (const h of holders(isFullUrl, board)) { h.o[h.k] = 'img:' + h.o[h.k].slice(window.IMG_BASE_URL.length); n++; }
    const srcs = Array.from(new Set(holders(isData, board).map(h => h.o[h.k])));
    for (const src of srcs) {
      let key;
      try { key = await upload(src); }
      catch (err) { if (/bucket not found|not found|row-level security|unauthorized|403|404/i.test(String((err && err.message) || err))) off = true; throw err; }
      holders(isData, board).forEach(h => { if (h.o[h.k] === src) { h.o[h.k] = key; n++; } });
    }
    return n;
  }

  // облачная доска сохраняет правки по снимку «до» (pushUndo, boards-cloud.js):
  // без него подмена картинки на ключ осталась бы только в этом браузере
  function beginEdit() {
    if (typeof B !== 'undefined' && B && B.cloudBoardId && typeof pushUndo === 'function') pushUndo();
  }

  async function tick() {
    if (off || busy || !client() || !userId()) return;
    if (typeof boardActive !== 'undefined' && !boardActive) return;
    const legacy = holders(isFullUrl);
    if (legacy.length){
      beginEdit();
      legacy.forEach(h => { h.o[h.k] = 'img:' + h.o[h.k].slice(window.IMG_BASE_URL.length); });
      if (typeof saveDB === 'function') saveDB();
      if (typeof scheduleRedraw === 'function') scheduleRedraw();
    }
    const list = holders().filter(h => !failed.has(h.o[h.k]));
    if (!list.length) return;
    busy = true;
    const boardId = B.id;
    try {
      const src = list[0].o[list[0].k];
      let key;
      try { key = await upload(src); }
      catch (err) {
        const msg = String((err && (err.message || err.error || err.statusCode)) || err);
        // бакета ещё нет (SQL не запущен) или нет прав — молча работаем по-старому
        if (/bucket not found|not found|row-level security|unauthorized|403|404/i.test(msg)) off = true;
        else failed.add(src);
        console.warn('[картинки] не удалось залить в хранилище:', msg);
        return;
      }
      // пока заливали, доску могли закрыть или сменить — тогда в следующий раз
      if (typeof B === 'undefined' || !B || B.id !== boardId) return;
      let n = 0;
      if (holders().some(h => h.o[h.k] === src)) beginEdit();
      holders().forEach(h => { if (h.o[h.k] === src) { h.o[h.k] = key; n++; } });
      if (n){
        if (typeof saveDB === 'function') saveDB();
        if (typeof scheduleRedraw === 'function') scheduleRedraw();
      }
    } finally { busy = false; }
  }
  setInterval(() => { tick().catch(() => { busy = false; }); }, TICK_MS);

  /* ── уборка мусора (№90) ──
     Картинка, которую убрали со всех досок, остаётся файлом навсегда. Раз в
     сутки сервер называет файлы этого учителя старше 30 дней, на которые не
     ссылается ни один объект ни одной доски в базе (функция
     board_images_garbage, boards-server-schema.sql), и мы их удаляем.
     Удалять файлы может только Storage API (прямое удаление строк из
     storage.objects Supabase запрещает), поэтому это делает сайт, а не
     задание в базе. Запускаем, только когда ВСЕ доски этого браузера уже на
     сервере: иначе картинка доски, которая ещё не переехала, выглядела бы
     для сервера мусором.

     Ссылки, которых в базе нет вовсе, живут только в браузере: буфер досок
     (вставка через месяц), версии досок (откат), библиотека картинок доски,
     панель заметок. Без защиты уборка стёрла бы такой файл, и вместо
     картинки было бы пустое место. Поэтому каждое устройство раз в сутки
     отмечает свои ссылки на сервере (board_image_keep, syncKeep) — их не
     тронет уборка с ЛЮБОГО устройства, — а перед своей уборкой ещё и
     вычёркивает их из списка сама (на случай, если таблицы нет). */
  const GC_KEY = 'boardsImgGcAt', GC_EVERY_MS = 24 * 3600 * 1000;
  const KEEP_TABLE = 'board_image_keep';
  const KEEP_SIG = 'boardsImgKeepSig', KEEP_AT = 'boardsImgKeepAt', KEEP_CLIP = 'boardsImgKeepClip';
  const KEEP_EVERY_MS = 20 * 3600 * 1000;      // меньше суток: окно для уборки с другого устройства узкое
  const KEEP_TTL_MS = 60 * 24 * 3600 * 1000;   // как в board_images_garbage
  const DEV_KEY = 'boardsImgDevice';

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  // строки устройства отдельно от строк того же учителя на другом устройстве:
  // иначе одно устройство, стирая «свои» устаревшие строки, стёрло бы чужие
  function deviceId() {
    let d = lsGet(DEV_KEY);
    if (!d) { d = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); lsSet(DEV_KEY, d); }
    return d;
  }
  function idbRead(key) {
    return typeof window.idbGet === 'function' ? Promise.resolve(window.idbGet(key)).catch(() => null) : Promise.resolve(null);
  }

  // все ключи картинок, которые держит этот браузер вне базы
  async function localRefs() {
    const names = new Set();
    const add = (s) => { if (typeof s === 'string' && s.startsWith('img:')) names.add(s.slice(4)); };
    const addObj = (o) => { if (o) { add(o.src); if (o.sol) add(o.sol.src); } };
    const clip = await idbRead('clipboard');                    // буфер досок (boards-core.js, CLIP_KEY)
    ((clip && clip.objects) || []).forEach(addObj);
    const boards = (typeof getDB === 'function' && getDB() && getDB().boards) || [];
    for (const b of boards) {
      ((b.refPanel && b.refPanel.imageObjects) || []).forEach(addObj);
      // библиотека картинок лежит в тяжёлой части доски — у выгруженной доски
      // читаем её с диска (по одной доске, раз в сутки)
      let lib = b.imageLib;
      if (lib === undefined) { const h = await idbRead('boarddata:' + b.id); lib = h && h.imageLib; }
      (lib || []).forEach(addObj);
      // версии доски (boards-cloud.js, saveVersion): ключи img: короткие и
      // лежат прямо в снимке. Имена ключей — как там: cloudver:<доска>[:<слот>]
      const cb = b.cloudBoardId;
      if (!cb) continue;
      const meta = await idbRead('cloudver:' + cb);
      for (const v of ((meta && meta.list) || [])) {
        const snap = await idbRead('cloudver:' + cb + ':' + v.slot);
        ((snap && snap.objects) || []).forEach(addObj);
      }
    }
    return names;
  }

  function sigOf(list) {
    let a = 0x811c9dc5;
    const t = list.join('|');
    for (let i = 0; i < t.length; i++) a = Math.imul(a ^ t.charCodeAt(i), 0x01000193);
    return list.length + ':' + (a >>> 0).toString(36);
  }

  // отметить ссылки этого устройства на сервере; false — таблицы нет или нет сети
  async function syncKeep(names, force) {
    const sb = client(), uid = userId();
    if (off || !sb || !uid || typeof sb.from !== 'function') return false;
    const list = Array.from(names).sort();
    const sig = sigOf(list);
    if (!force && lsGet(KEEP_SIG) === sig && Date.now() - (+lsGet(KEEP_AT) || 0) < KEEP_EVERY_MS) return true;
    const dev = deviceId(), now = new Date().toISOString();
    try {
      for (let i = 0; i < list.length; i += 500) {
        const rows = list.slice(i, i + 500).map(name => ({ user_id: uid, device: dev, name, seen_at: now }));
        const r = await sb.from(KEEP_TABLE).upsert(rows, { onConflict: 'user_id,device,name' });
        if (r && r.error) throw r.error;
      }
      // всё, что это устройство больше не держит, — не обновлено сейчас; плюс
      // строки устройств, которых не открывали дольше срока
      let r = await sb.from(KEEP_TABLE).delete().eq('user_id', uid).eq('device', dev).lt('seen_at', now);
      if (r && r.error) throw r.error;
      r = await sb.from(KEEP_TABLE).delete().eq('user_id', uid).lt('seen_at', new Date(Date.now() - KEEP_TTL_MS).toISOString());
      if (r && r.error) throw r.error;
    } catch (err) {
      console.warn('[картинки] не удалось отметить картинки этого устройства:', (err && err.message) || err);
      return false;
    }
    lsSet(KEEP_SIG, sig);
    lsSet(KEEP_AT, String(Date.now()));
    return true;
  }

  // раз в час: дёшево смотрим, не менялся ли буфер; полный обход — только
  // если буфер новый или прошлая отметка старше KEEP_EVERY_MS
  async function keepTick(force) {
    if (off || !client() || !userId()) return false;
    const clip = await idbRead('clipboard');
    const clipAt = String((clip && clip.at) || '');
    const fresh = Date.now() - (+lsGet(KEEP_AT) || 0) < KEEP_EVERY_MS;
    if (!force && fresh && clipAt === (lsGet(KEEP_CLIP) || '')) return true;
    const ok = await syncKeep(await localRefs(), force);
    if (ok) lsSet(KEEP_CLIP, clipAt);
    return ok;
  }

  async function gc(force) {
    const sb = client();
    if (off || !sb || !userId() || typeof getDB !== 'function') return { skipped: 'нет входа или хранилища' };
    let last = 0;
    try { last = +localStorage.getItem(GC_KEY) || 0; } catch (e) {}
    if (!force && Date.now() - last < GC_EVERY_MS) return { skipped: 'рано' };
    const boards = getDB().boards || [];
    if (boards.some(b => !b.cloudBoardId)) return { skipped: 'не все доски на сервере' };
    // сначала свои ссылки — на сервер (их увидят уборки других устройств) и в
    // свой список «не трогать»; не вышло отметить — уборка всё равно идёт,
    // как до этого: свои ссылки защищены вычёркиванием ниже
    const keep = await localRefs();
    const kept = await syncKeep(keep);
    const res = await sb.rpc('board_images_garbage', { min_age_days: 30 });
    if (res.error) { console.warn('[картинки] уборка недоступна:', res.error.message || res.error); return { skipped: 'нет функции' }; }
    const names = (res.data || []).map(r => (typeof r === 'string' ? r : r.name)).filter(n => n && !keep.has(n));
    for (let i = 0; i < names.length; i += 100) {
      const r = await sb.storage.from(BUCKET).remove(names.slice(i, i + 100));
      if (r.error) { console.warn('[картинки] не удалось удалить:', r.error.message || r.error); return { removed: i, kept }; }
    }
    try { localStorage.setItem(GC_KEY, String(Date.now())); } catch (e) {}
    return { removed: names.length, kept };
  }
  setTimeout(() => {
    keepTick().catch(() => {}).then(() => gc()).catch(() => {});
    setInterval(() => { keepTick().catch(() => {}).then(() => gc()).catch(() => {}); }, 3600 * 1000);
  }, 30000);

  // для переноса досок, тестов и консоли
  window.ImageStore = { pending: () => holders().length, isOff: () => off, tick, convertBoard, gc, localRefs, keepTick };
})();
