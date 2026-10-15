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

  // все места открытой доски, где у картинки есть src: сама доска, панель
  // заметок, разбор у задания с тренажёра (sol)
  function holders(test) {
    test = test || isData;
    const out = [];
    if (typeof B === 'undefined' || !B || !Array.isArray(B.objects)) return out;
    const add = (o) => {
      if (!o) return;
      if (o.type === 'image' && test(o.src)) out.push({ o, k: 'src' });
      if (o.sol && test(o.sol.src)) out.push({ o: o.sol, k: 'src' });
    };
    B.objects.forEach(add);
    if (B.refPanel && Array.isArray(B.refPanel.imageObjects)) B.refPanel.imageObjects.forEach(add);
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

  async function tick() {
    if (off || busy || !client() || !userId()) return;
    if (typeof boardActive !== 'undefined' && !boardActive) return;
    const legacy = holders(isFullUrl);
    if (legacy.length){
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
      holders().forEach(h => { if (h.o[h.k] === src) { h.o[h.k] = key; n++; } });
      if (n){
        if (typeof saveDB === 'function') saveDB();
        if (typeof scheduleRedraw === 'function') scheduleRedraw();
      }
    } finally { busy = false; }
  }
  setInterval(() => { tick().catch(() => { busy = false; }); }, TICK_MS);

  // для тестов и консоли: сколько картинок на открытой доске ещё текстом
  window.ImageStore = { pending: () => holders().length, isOff: () => off, tick };
})();
