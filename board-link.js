/* ==========================================================
   board-link.js — сопряжение панели тренажёров с доской.

   Зачем. Урок идёт на слабом ноутбуке с трансляцией экрана, и тяжёлый
   рендер заданий (тренажёр в кадре, html2canvas) не должен нагружать
   вкладку доски. Поэтому панель тренажёров можно вынести в отдельную
   вкладку, окно или на телефон/планшет (boards-panel.html): снимок задания
   делает панель, а доске уходит готовая картинка с метаданными. Описание
   задания вместо картинки не годится: тренажёры генерируют примеры через
   Math.random без seed, повторить пример на доске нельзя.

   Здесь — протокол и обе его стороны без DOM:
   - BoardLink.createHost(opts) — сторона доски (boards-core.js рисует к ней
     окна: код, QR, запрос на подключение, список устройств, очередь);
   - BoardLink.createClient(opts) — сторона панели (boards-panel.html).

   Сообщения (поле t):
     hello      панель → доска, по каналу кода: «подключите меня» (имя
                устройства, открытый ключ ECDH, nonce)
     approve    доска → панель: разрешено (открытый ключ доски, id устройства)
     reject     доска → панель: отклонено (reason: denied | busy)
     ping/pong  индикатор связи; pong несёт состояние доски (ширина стопки
                для снимка, очередь, имя доски)
     add-task   задание на доску (id сообщения, картинка, метаданные)
     add-manual задание для ручного размещения с призраком (этап 2)
     ack        доска приняла и вставила задание id (или ok:false)
     queue-state задание id стоит в очереди доски (pos из total)
     placed / cancelled  итог ручного размещения
     revoked    устройство отключили на доске

   Безопасность. Короткий код (6 символов) нужен только для первого
   рукопожатия, и угаданный код приводит лишь к окошку «Разрешить /
   Отклонить» на доске — без «Разрешить» ничего не принимается. После
   «Разрешить» обе стороны выводят общий длинный секрет по ECDH (P-256):
   по каналу кода идут только открытые ключи, поэтому тот, кто подслушал
   рукопожатие, зная код, рабочего канала всё равно не узнает. Рабочий канал
   устройства назван от этого секрета — его не угадать. Секрет хранится на
   обеих сторонах (localStorage), и следующие подключения идут молча.

   Транспорт. Этап 1 — BroadcastChannel (вкладки одного браузера и
   профиля). Этап 3 добавит Supabase Realtime под тем же openChannel:
   протокол и обработчики от транспорта не зависят.
   ========================================================== */
(function(){
  'use strict';
  if (window.BoardLink) return;

  // тот же алфавит, что у кодов совместной сессии (session-share.js): без
  // путаемых I/L/1 и O/0 — код читают с экрана и набирают на телефоне
  const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const CODE_LEN = 6;
  const PROMPT_GAP_MS = 4000;      // запросы на подключение — не чаще одного в 4 с
  const PING_MS = 2500;
  const ONLINE_TTL_MS = 7000;      // нет ответа дольше — «доска не в сети»
  const RESEND_MS = 6000;          // без ответа на задание — шлём его ещё раз
  const HELLO_TIMEOUT_MS = 120000; // учитель мог отойти от доски — ждём долго
  const REVOKED_MAX = 20;
  const DONE_MAX = 200;
  const NAME_MAX = 40;

  const LS_CODE = 'bdLink:code';
  const LS_DEVICES = 'bdLink:devices';
  const LS_REVOKED = 'bdLink:revoked';
  const SS_DONE = 'bdLink:done';
  const LS_PANEL = 'bdPanel:link';
  const LS_PANEL_NAME = 'bdPanel:name';
  // все доски, к которым подключали эту панель: у каждой доски свой код и
  // свой ключ устройства, а учитель ведёт нескольких учеников — между их
  // досками панель переключается без кода
  const LS_PANEL_LINKS = 'bdPanel:links';
  const PANEL_LINKS_MAX = 30;

  function panelLinks(){
    const l = lsGet(LS_PANEL_LINKS, []);
    return Array.isArray(l) ? l.filter(x => x && typeof x.key === 'string') : [];
  }
  function rememberPanelLink(link){
    const list = panelLinks().filter(x => x.key !== link.key && !(link.boardId && x.boardId === link.boardId));
    list.unshift(link);
    lsSet(LS_PANEL_LINKS, list.slice(0, PANEL_LINKS_MAX));
  }
  function forgetPanelLink(key){
    lsSet(LS_PANEL_LINKS, panelLinks().filter(x => x.key !== key));
  }
  function lsGet(k, def){ try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } }
  function lsSet(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function randBytes(n){ const a = new Uint8Array(n); crypto.getRandomValues(a); return a; }
  function b64url(bytes){
    let s = '';
    bytes.forEach(b => { s += String.fromCharCode(b); });
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function unb64url(s){
    const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
    const a = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
    return a;
  }
  function newId(){ return b64url(randBytes(12)); }
  function newCode(){
    const a = new Uint32Array(CODE_LEN);
    crypto.getRandomValues(a);
    let s = '';
    for (let i = 0; i < CODE_LEN; i++) s += CODE_ALPHABET[a[i] % CODE_ALPHABET.length];
    return s;
  }
  // набранный руками код: регистр, дефисы и пробелы не важны
  function normCode(s){
    const t = String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (t.length !== CODE_LEN) return '';
    for (const ch of t) if (CODE_ALPHABET.indexOf(ch) < 0) return '';
    return t;
  }
  function formatCode(c){ return c ? c.slice(0, 3) + '-' + c.slice(3) : ''; }
  function cleanName(s){ return String(s || '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX) || 'Устройство'; }

  /* ── ECDH ── */
  function cryptoOk(){ return !!(window.crypto && crypto.subtle && window.isSecureContext !== false); }
  async function makeKeyPair(){
    const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
    const raw = await crypto.subtle.exportKey('raw', kp.publicKey);
    return { priv: kp.privateKey, pub: b64url(new Uint8Array(raw)) };
  }
  async function deriveSecret(priv, peerPub){
    const pk = await crypto.subtle.importKey('raw', unb64url(peerPub), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
    const bits = await crypto.subtle.deriveBits({ name: 'ECDH', public: pk }, priv, 256);
    // хэш поверх общей точки — равномерный ключ, из которого строим имя канала
    const h = await crypto.subtle.digest('SHA-256', bits);
    return b64url(new Uint8Array(h));
  }

  /* ── транспорт ──
     Каждое сообщение несёт mid: при повторной отправке (RESEND_MS) и
     при двух транспортах сразу один и тот же mid обрабатывается один раз.

     Транспорт выбирается сам, отдельно для каждого канала:
     - BroadcastChannel — всегда (вкладки одного браузера и профиля);
     - Supabase Realtime — только у «удалённого» канала (opts.remote:
       телефон, планшет, другой компьютер). Пока с той стороны слышно хоть
       что-то по BroadcastChannel (ONLINE_TTL_MS), Supabase не шлём вовсе:
       собеседник рядом, и гонять картинку через сервер незачем.
     Протокол и обработчики от транспорта не зависят: им приходит одно и то
     же сообщение, откуда бы оно ни пришло. */
  const transports = [];
  function bcTransport(name, onMsg){
    let bc = null;
    try { if (window.BroadcastChannel) bc = new BroadcastChannel('bdlink:' + name); } catch (e) { bc = null; }
    if (!bc) return null;
    bc.onmessage = (e) => onMsg(e.data, 'bc');
    return { kind: 'bc', post: (m) => { try { bc.postMessage(m); } catch (e) {} }, close: () => { try { bc.close(); } catch (e) {} } };
  }
  transports.push(bcTransport);

  /* ── Supabase: клиент, канал, крупные задания ──
     Лимит одного сообщения Realtime — 256 КБ на плане Free (3000 КБ на Pro).
     Снимок задания в PNG с разбором и вёрсткой (gen.html) бывает больше.
     Поэтому крупное сообщение сначала сжимаем (картинки — в WebP), а если и
     так велико — кладём в Storage (бакет board-link, board-link-schema.sql)
     и шлём по каналу только имя файла. Файл зашифрован ключом устройства
     (AES-GCM от общего секрета ECDH): бакет общий для всех досок, и чужой,
     даже увидев файл, прочитать задание не сможет. */
  const REMOTE_SAFE_BYTES = 200 * 1024;   // с запасом от 256 КБ: конверт сообщения и служебные поля
  const BLOB_BUCKET = 'board-link';
  const BLOB_DIR = 'v1';
  const BLOB_TTL_MS = 60 * 60 * 1000;     // старше часа — брошенное (панель закрыли до ответа доски)
  const WEBP_Q = 0.9;
  let supa = null, supaTried = false;
  function getSupa(){
    if (supaTried) return supa;
    // supabase-js на странице досок подключён ниже этого файла: пока
    // страница грузится, «нет клиента» ещё ничего не значит
    if (!window.__bdLinkSupabase && !window.supabase && document.readyState === 'loading') return null;
    supaTried = true;
    try {
      // тесты подставляют свою заглушку: из песочницы Supabase недоступен
      if (typeof window.__bdLinkSupabase === 'function'){ supa = window.__bdLinkSupabase(); return supa; }
      const cfg = window.SUPABASE_CONFIG;
      if (!cfg || !window.supabase || !window.supabase.createClient) return null;
      // свой анонимный клиент без входа, как у совместной сессии
      // (session-share.js): клиент с настройками по умолчанию подхватил бы
      // вход учителя на странице досок и стал бы обновлять его наперегонки
      supa = window.supabase.createClient(cfg.url, cfg.anonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'bdlink-anon' },
        realtime: { params: { eventsPerSecond: 20 }, heartbeatIntervalMs: 10000 },
      });
      if (window.rtGuard) window.rtGuard(supa);
    } catch (e) { console.warn('[board-link] Supabase недоступен', e); supa = null; }
    return supa;
  }
  function sbTransport(name, onMsg, opts){
    if (!opts.remote) return null;
    const sb = getSupa();
    if (!sb) return null;
    let joined = false, closed = false;
    const pending = [];
    const ch = sb.channel('bdlink:' + name, { config: { broadcast: { self: false, ack: false } } });
    ch.on('broadcast', { event: 'm' }, (e) => onMsg(e && e.payload, 'sb'));
    // пока канал не подключён, rtGuard (supabase-config.js) молча выбросил бы
    // сообщение — держим сами и шлём после подключения. Держим немного:
    // ping устаревают, а задания панель всё равно повторит (RESEND_MS)
    const send = (m) => { try { ch.send({ type: 'broadcast', event: 'm', payload: m }); } catch (e) {} };
    ch.subscribe((status) => {
      joined = status === 'SUBSCRIBED';
      if (joined && !closed) pending.splice(0).forEach(send);
    });
    return {
      kind: 'sb',
      post(m){ if (joined) send(m); else { pending.push(m); if (pending.length > 10) pending.shift(); } },
      close(){ closed = true; try { sb.removeChannel(ch); } catch (e) {} },
    };
  }
  transports.push(sbTransport);

  const te = new TextEncoder(), td = new TextDecoder();
  function jsonBytes(x){ return te.encode(JSON.stringify(x)).length; }
  function loadImg(src){
    return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
  }
  // → WebP той же картинки или исходник, если браузер WebP не пишет (старый
  // Safari отдаёт PNG) или WebP вышел не меньше
  async function toWebp(dataUrl){
    if (typeof dataUrl !== 'string' || !/^data:image\/png/.test(dataUrl)) return dataUrl;
    try {
      const im = await loadImg(dataUrl);
      const c = document.createElement('canvas');
      c.width = im.naturalWidth; c.height = im.naturalHeight;
      c.getContext('2d').drawImage(im, 0, 0);
      const w = c.toDataURL('image/webp', WEBP_Q);
      return (/^data:image\/webp/.test(w) && w.length < dataUrl.length) ? w : dataUrl;
    } catch (e) { return dataUrl; }
  }
  async function blobKey(secret){
    const h = await crypto.subtle.digest('SHA-256', te.encode('bdlink-blob:' + secret));
    return crypto.subtle.importKey('raw', h, 'AES-GCM', false, ['encrypt', 'decrypt']);
  }
  async function sealJson(obj, secret){
    const iv = randBytes(12);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await blobKey(secret), te.encode(JSON.stringify(obj)));
    const out = new Uint8Array(12 + ct.byteLength);
    out.set(iv, 0); out.set(new Uint8Array(ct), 12);
    return out;
  }
  async function openJson(buf, secret){
    const b = new Uint8Array(buf);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b.slice(0, 12) }, await blobKey(secret), b.slice(12));
    return JSON.parse(td.decode(pt));
  }
  /* задание p → то, что можно отправить через Realtime:
     { p, how: 'as-is' | 'webp' | 'blob' | 'too-big', path?, bytes } */
  async function shrinkPayload(p, secret){
    let bytes = jsonBytes(p);
    if (bytes <= REMOTE_SAFE_BYTES) return { p, how: 'as-is', bytes };
    const q = Object.assign({}, p);
    q.img = await toWebp(q.img);
    if (q.sol && q.sol.src) q.sol = Object.assign({}, q.sol, { src: await toWebp(q.sol.src) });
    bytes = jsonBytes(q);
    if (bytes <= REMOTE_SAFE_BYTES) return { p: q, how: 'webp', bytes };
    const sb = getSupa();
    if (!sb || !secret) return { p: q, how: 'too-big', bytes };
    const path = BLOB_DIR + '/' + newId() + newId() + '.bin';
    const body = await sealJson(q, secret);
    const { error } = await sb.storage.from(BLOB_BUCKET).upload(path, new Blob([body], { type: 'application/octet-stream' }), { contentType: 'application/octet-stream', upsert: false });
    if (error) throw error;
    return { p: { $blob: path }, how: 'blob', path, bytes };
  }
  async function fetchBlob(path, secret){
    const sb = getSupa();
    if (!sb || !secret || typeof path !== 'string' || path.indexOf(BLOB_DIR + '/') !== 0) return null;
    try {
      const { data, error } = await sb.storage.from(BLOB_BUCKET).download(path);
      if (error || !data) return null;
      return await openJson(await data.arrayBuffer(), secret);
    } catch (e) { console.warn('[board-link] не удалось получить задание из хранилища', e); return null; }
  }
  function dropBlob(path){
    const sb = getSupa();
    if (sb && path) sb.storage.from(BLOB_BUCKET).remove([path]).catch(() => {});
  }
  // брошенные файлы (панель закрыли, не дождавшись доски) — подчищает доска
  // при запуске и раз в полчаса: Storage сам по времени не чистит, а
  // удалять строки storage.objects SQL-запросом Supabase не велит (файл
  // остаётся лежать)
  async function sweepBlobs(){
    const sb = getSupa();
    if (!sb) return;
    try {
      const { data } = await sb.storage.from(BLOB_BUCKET).list(BLOB_DIR, { limit: 100, sortBy: { column: 'created_at', order: 'asc' } });
      const old = (data || []).filter(f => f && f.name && f.created_at && Date.now() - Date.parse(f.created_at) > BLOB_TTL_MS).map(f => BLOB_DIR + '/' + f.name);
      if (old.length) await sb.storage.from(BLOB_BUCKET).remove(old);
    } catch (e) {}
  }

  // opts.remote — канал может понадобиться с другого устройства (Supabase);
  // opts.secret — ключ устройства для крупных заданий через Storage
  function openChannel(name, onMsg, opts){
    opts = opts || {};
    const seen = new Set(), order = [];
    let bcPeerAt = 0;
    const blobsOut = new Map();   // id задания → { promise, path } (повтор не заливает файл заново)
    const deliver = async (m, kind) => {
      if (!m || typeof m !== 'object' || typeof m.t !== 'string') return;
      if (m.mid){
        if (seen.has(m.mid)) return;
        seen.add(m.mid); order.push(m.mid);
        if (order.length > 500) seen.delete(order.shift());
      }
      if (kind === 'bc') bcPeerAt = Date.now();
      if (m.p && typeof m.p === 'object' && m.p.$blob){
        // файл мог уже пропасть (задание давно принято, файл стёрт) — тогда
        // сообщение всё равно доходит, без задания: доска ответит на повтор
        // по id, не вставляя заново
        m = Object.assign({}, m, { p: await fetchBlob(m.p.$blob, opts.secret) });
      }
      try { onMsg(m); } catch (e) { console.error('[board-link]', e); }
    };
    const legs = transports.map(f => f(name, deliver, opts)).filter(Boolean);
    const near = () => Date.now() - bcPeerAt < ONLINE_TTL_MS;
    async function postRemote(leg, msg){
      if (!msg.p || typeof msg.p !== 'object' || !msg.id) return leg.post(msg);
      let rec = blobsOut.get(msg.id);
      if (!rec){
        rec = { promise: shrinkPayload(msg.p, opts.secret) };
        blobsOut.set(msg.id, rec);
        rec.promise.then(r => { rec.path = r.path; }, () => { blobsOut.delete(msg.id); });
      }
      try {
        const r = await rec.promise;
        if (r.how === 'too-big') console.warn('[board-link] задание велико для Realtime даже в WebP:', r.bytes);
        leg.post(Object.assign({}, msg, { p: r.p }));
      } catch (e) { console.warn('[board-link] не удалось подготовить задание для отправки', e); }
    }
    return {
      name,
      kinds: legs.map(l => l.kind),
      post(m){
        const msg = Object.assign({ mid: newId() }, m);
        // своё же сообщение назад не принимаем (у Supabase оно может вернуться)
        seen.add(msg.mid); order.push(msg.mid);
        legs.forEach(l => {
          if (l.kind !== 'sb') l.post(msg);
          else if (!near()) postRemote(l, msg);
        });
        return msg.mid;
      },
      // задание id доставлено (или от него отказались) — файл в Storage больше не нужен
      release(id){
        const rec = blobsOut.get(id);
        if (!rec) return;
        blobsOut.delete(id);
        rec.promise.then(r => dropBlob(r.path), () => {});
      },
      close(){ legs.forEach(l => l.close()); legs.length = 0; },
    };
  }
  const pairName = code => 'p-' + code;
  const workName = key => 'w-' + key;

  /* ═══════════ сторона доски ═══════════
     opts:
       isBusy()           → true, если сейчас вставлять нельзя (открыт диалог,
                            идёт ручное размещение, доска не открыта): задание
                            ждёт в очереди, а не затирает текущее состояние
       insert(p, dev)     → Promise: вставить задание add-task
       placeManual(p, dev)→ Promise<'placed'|'cancelled'> (этап 2)
       state()            → { ref: {tid, w — ширина карточки}|null, board: имя доски, scale }
       ask(dev)           → Promise<boolean> — окошко «Разрешить / Отклонить»
       onChange()         — перерисовать окна доски (код, устройства, очередь)
     opts.state() даёт ещё board — имя доски (его видит панель).

     Код и подключённые устройства — У КАЖДОЙ ДОСКИ СВОИ (setBoard(id) из
     boards-core.js, когда в вкладке открывают доску). Сначала они были одни
     на компьютер, и задания шли в первую открытую вкладку доски, а не на ту
     доску, с которой занимаются: учитель открывал доску другого ученика, а
     задания с телефона уезжали к прежнему, туда же всплывал и запрос на
     подключение. Теперь телефон подключают к доске, и он шлёт именно на неё.
     Хранится в localStorage этого компьютера под id доски, не в самой доске:
     ключи устройств не должны уезжать в облако и в совместную сессию.
     Одна и та же доска открыта в двух вкладках — принимает одна (Web Locks
     на id доски), иначе задание легло бы дважды; вторая подхватит приём,
     когда первая закроется или перейдёт на другую доску. */
  function createHost(opts){
    let boardId = null;          // доска, открытая в этой вкладке
    let code = null, devices = [], revoked = [];
    const kCode = () => LS_CODE + ':' + boardId;
    const kDevices = () => LS_DEVICES + ':' + boardId;
    const kRevoked = () => LS_REVOKED + ':' + boardId;
    let done = [];
    try { done = JSON.parse(sessionStorage.getItem(SS_DONE) || '[]'); } catch (e) { done = []; }
    const doneMap = new Map(done.map(d => [d.id, d.r]));

    let active = false;          // эта вкладка принимает задания своей доски
    let lockRelease = null;      // отпустить замок доски (Web Locks)
    let pairChan = null, pairCode = null, pairRemote = false;
    // канал кода через Supabase — только пока на доске открыто окно с кодом
    // и PAIR_REMOTE_KEEP_MS после: подключают телефон, глядя на это окно, а
    // держать лишний канал на сервере весь урок незачем
    let pairingVisible = false, pairingOffAt = 0, pairingTimer = null;
    const PAIR_REMOTE_KEEP_MS = 5 * 60 * 1000;
    const chans = new Map();     // key → { ch, remote } — каналы устройств (и отключённых — чтобы сказать revoked)
    const seenAt = new Map();    // id устройства → когда слышали
    const queue = [];            // { dev, m }
    let working = null;          // что вставляется / размещается сейчас
    let asking = null, lastAskAt = 0;
    let pumpTimer = null;

    const change = () => { try { opts.onChange && opts.onChange(); } catch (e) { console.error(e); } };
    const saveDevices = () => { if (boardId) lsSet(kDevices(), devices); };
    const boardName = () => { try { return (opts.state() || {}).board || ''; } catch (e) { return ''; } };

    // этап 1 хранил код и устройства одни на компьютер — они переходят к
    // первой доске, которую откроют: уже подключённый телефон не придётся
    // подключать заново хотя бы к ней
    function migrateGlobal(){
      const old = lsGet(LS_DEVICES, null);
      if (!Array.isArray(old)) return;
      if (!Array.isArray(lsGet(kDevices(), null))){
        lsSet(kDevices(), old);
        const c = lsGet(LS_CODE, null);
        if (normCode(c)) lsSet(kCode(), c);
        const r = lsGet(LS_REVOKED, null);
        if (Array.isArray(r)) lsSet(kRevoked(), r);
      }
      try { [LS_DEVICES, LS_CODE, LS_REVOKED].forEach(k => localStorage.removeItem(k)); } catch (e) {}
    }
    function loadBoard(){
      migrateGlobal();
      code = lsGet(kCode(), null);
      if (!normCode(code)){ code = newCode(); lsSet(kCode(), code); }
      devices = lsGet(kDevices(), []);
      if (!Array.isArray(devices)) devices = [];
      revoked = lsGet(kRevoked(), []);
      if (!Array.isArray(revoked)) revoked = [];
    }

    function rememberDone(id, r){
      doneMap.set(id, r);
      done.push({ id, r });
      while (done.length > DONE_MAX){ doneMap.delete(done.shift().id); }
      try { sessionStorage.setItem(SS_DONE, JSON.stringify(done)); } catch (e) {}
    }

    function openPair(){
      const remote = pairingVisible || Date.now() < pairingOffAt;
      if (pairChan && pairCode === code && pairRemote === remote) return;
      if (pairChan) pairChan.close();
      pairCode = code; pairRemote = remote;
      const ch = openChannel(pairName(code), (m) => onPair(ch, m), { remote });
      pairChan = ch;
    }
    function syncChannels(){
      if (!active) return;
      openPair();
      // устройство из этого же браузера (своя вкладка) — только
      // BroadcastChannel; телефон и чужой компьютер — ещё и Supabase.
      // Отключённым отвечаем revoked только в пределах браузера
      const want = new Map();
      revoked.forEach(key => want.set(key, { remote: false, secret: key }));
      devices.forEach(d => want.set(d.key, { remote: !d.local, secret: d.key }));
      chans.forEach((rec, key) => {
        const w = want.get(key);
        if (w && w.remote === rec.remote) return;
        // только что отключённому должен успеть уйти revoked через сервер
        const ch = rec.ch;
        setTimeout(() => ch.close(), w ? 0 : 2000);
        chans.delete(key);
      });
      want.forEach((w, key) => {
        if (chans.has(key)) return;
        const ch = openChannel(workName(key), (m) => onWork(key, ch, m), w);
        chans.set(key, { ch, remote: w.remote });
      });
    }

    async function onPair(ch, m){
      if (m.t !== 'hello' || !m.from || typeof m.pub !== 'string') return;
      // запросы — по одному и не чаще одного в несколько секунд: подбор кода
      // перебором упрётся в окошко, а не завалит доску окнами
      if (asking || Date.now() - lastAskAt < PROMPT_GAP_MS){
        ch.post({ t: 'reject', to: m.from, nonce: m.nonce, reason: 'busy' });
        return;
      }
      const dev = { name: cleanName(m.name) };
      lastAskAt = Date.now();
      asking = dev; change();
      let ok = false;
      try { ok = !!(await opts.ask(dev)); } catch (e) { ok = false; }
      asking = null; lastAskAt = Date.now(); change();
      // код сменили, пока висело окошко, — старый код новых не подключает
      if (ch !== pairChan){ ch.post({ t: 'reject', to: m.from, nonce: m.nonce, reason: 'denied' }); return; }
      if (!ok){ ch.post({ t: 'reject', to: m.from, nonce: m.nonce, reason: 'denied' }); return; }
      try {
        const kp = await makeKeyPair();
        const key = await deriveSecret(kp.priv, m.pub);
        const d = { id: newId(), name: dev.name, key, addedAt: Date.now() };
        devices.push(d); saveDevices();
        seenAt.set(d.id, Date.now());
        syncChannels();
        ch.post({ t: 'approve', to: m.from, nonce: m.nonce, pub: kp.pub, devId: d.id, name: d.name, boardId, board: boardName() });
        change();
      } catch (e) {
        console.error('[board-link] pairing failed', e);
        ch.post({ t: 'reject', to: m.from, nonce: m.nonce, reason: 'error' });
      }
    }

    function stateMsg(){
      let st = {};
      try { st = opts.state() || {}; } catch (e) {}
      return { ref: st.ref || null, board: st.board || '', scale: st.scale || null, queue: queue.length + (working ? 1 : 0),
        pending: queue.map(q => q.m.id).concat(working ? [working.m.id] : []) };
    }
    function onWork(key, ch, m){
      const dev = devices.find(d => d.key === key);
      if (!dev){
        // отключённое устройство: говорим ему об этом, чтобы панель
        // забыла ключ, а не показывала вечно «доска не в сети»
        if (m.t !== 'revoked' && m.t !== 'pong' && m.t !== 'ack' && m.t !== 'queue-state') ch.post({ t: 'revoked' });
        return;
      }
      if (m.t === 'ping' || m.t === 'add-task' || m.t === 'add-manual'){
        const was = seenAt.get(dev.id) || 0;
        seenAt.set(dev.id, Date.now());
        if (Date.now() - was > ONLINE_TTL_MS) change();
      }
      if (m.t === 'ping'){ ch.post(Object.assign({ t: 'pong', to: m.from }, stateMsg())); return; }
      if (m.t !== 'add-task' && m.t !== 'add-manual') return;
      if (typeof m.id !== 'string') return;
      // повтор уже принятого (ответ потерялся) — только повторяем ответ; само
      // задание при этом может и не прийти (файл в Storage уже стёрт)
      if (doneMap.has(m.id)){ reply(ch, m, doneMap.get(m.id)); return; }
      if ((working && working.m.id === m.id) || queue.some(q => q.m.id === m.id)){ postQueueState(ch, m.id); return; }
      if (!m.p || typeof m.p !== 'object') return;
      queue.push({ dev, key, ch, m });
      change();
      pump();
      // ждёт в очереди — или уже размещается призраком: панель показывает
      // «Размещаем на доске…», пока учитель выбирает место
      if (queue.some(q => q.m.id === m.id) || (working && working.m.id === m.id && m.t === 'add-manual')) postQueueState(ch, m.id);
    }
    function postQueueState(ch, id){
      const pos = queue.findIndex(q => q.m.id === id);
      ch.post({ t: 'queue-state', id, pos: pos < 0 ? 0 : pos + 1, total: queue.length, placing: !!(working && working.m.id === id) });
    }
    function reply(ch, m, r){
      if (m.t === 'add-manual') ch.post({ t: r === 'placed' ? 'placed' : 'cancelled', id: m.id });
      else ch.post({ t: 'ack', id: m.id, ok: r !== 'fail' });
    }
    async function pump(){
      clearTimeout(pumpTimer);
      if (working || !queue.length) return;
      let busy = true;
      try { busy = !!opts.isBusy(); } catch (e) {}
      // доска занята — ждём, пока освободится; задания не теряются и не
      // вставляются поверх открытого окна
      if (busy){ pumpTimer = setTimeout(pump, 600); return; }
      working = queue.shift();
      change();
      const job = working;
      const { m, dev, ch } = job;
      let r = 'fail';
      try {
        if (m.t === 'add-manual' && opts.placeManual) r = (await opts.placeManual(m.p, dev)) === 'placed' ? 'placed' : 'cancelled';
        else { await opts.insert(m.p, dev); r = 'ok'; }
      } catch (e) {
        console.error('[board-link] insert failed', e);
        r = m.t === 'add-manual' ? 'cancelled' : 'fail';
      }
      rememberDone(m.id, r);
      reply(ch, m, r);
      // приём успели закрыть, пока размещали (ушли с доски) — ответили и
      // закрываем канал этого устройства
      if (job.closeAfter) setTimeout(job.closeAfter, 1500);
      working = null;
      change();
      // соседи по очереди узнают, что продвинулись
      queue.forEach(q => postQueueState(q.ch, q.m.id));
      pump();
      if (working && working.m.t === 'add-manual') postQueueState(working.ch, working.m.id);
    }

    function onStorage(e){
      if (!boardId) return;
      if (e.key === kCode()){ const c = lsGet(kCode(), null); if (normCode(c)) code = c; }
      else if (e.key === kDevices()){ const d = lsGet(kDevices(), []); devices = Array.isArray(d) ? d : []; }
      else if (e.key === kRevoked()){ const r = lsGet(kRevoked(), []); revoked = Array.isArray(r) ? r : []; }
      else return;
      syncChannels(); change();
    }
    window.addEventListener('storage', onStorage);

    function activate(){
      // каналы — когда страница догрузилась: supabase-js подключается ниже
      if (document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', activate, { once: true }); return; }
      if (!boardId) return;
      active = true; syncChannels(); change();
    }
    // приём закрывается: вкладка ушла с доски или открыла другую. Канал
    // устройства, чьё задание сейчас размещают призраком, закрываем после
    // ответа — иначе панель так и ждала бы «Закреплено / Отменено»
    function deactivate(){
      active = false;
      if (pairChan){ pairChan.close(); pairChan = null; pairCode = null; }
      const keep = working ? working.key : null;
      chans.forEach((rec, key) => { if (key !== keep) rec.ch.close(); });
      if (keep && chans.get(keep)){ const ch = chans.get(keep).ch; working.closeAfter = () => ch.close(); }
      chans.clear();
      // что не успели вставить, панели пришлют снова (RESEND_MS) — уже туда,
      // где эта доска откроется
      queue.length = 0;
      seenAt.clear();
      if (lockRelease){ lockRelease(); lockRelease = null; }
    }
    function setBoard(id){
      id = id || null;
      if (id === boardId) return;
      deactivate();
      boardId = id;
      if (!id){ code = null; devices = []; revoked = []; change(); return; }
      loadBoard();
      change();
      if (navigator.locks && navigator.locks.request){
        const mine = id;
        // замок держится, пока вкладка на этой доске; доску сменили, пока
        // ждали замка, — сразу отпускаем
        navigator.locks.request('bdlink-board-' + mine, () => new Promise((release) => {
          if (boardId !== mine){ release(); return; }
          lockRelease = release;
          activate();
        })).catch(() => { if (boardId === mine) activate(); });
      } else activate();
    }
    // брошенные файлы крупных заданий в Storage — только если есть кому их
    // оставлять (к этой доске подключено удалённое устройство)
    const sweep = () => { if (active && devices.some(d => !d.local)) sweepBlobs(); };
    setTimeout(sweep, 15000);
    setInterval(sweep, 30 * 60 * 1000);

    return {
      get code(){ return code; },
      get active(){ return active; },
      get boardId(){ return boardId; },
      setBoard,
      get asking(){ return asking; },
      devices: () => devices.map(d => ({ id: d.id, name: d.name, addedAt: d.addedAt, online: Date.now() - (seenAt.get(d.id) || 0) < ONLINE_TTL_MS })),
      queueLength: () => queue.length,
      working: () => working ? { t: working.m.t, dev: working.dev.name } : null,
      changeCode(){
        if (!boardId) return null;
        code = newCode(); lsSet(kCode(), code);
        syncChannels(); change();
        return code;
      },
      rename(id, name){
        const d = devices.find(x => x.id === id);
        if (!d) return;
        d.name = cleanName(name); saveDevices(); change();
      },
      disconnect(id){
        const i = devices.findIndex(x => x.id === id);
        if (i < 0) return;
        const d = devices[i];
        const rec = chans.get(d.key);
        if (rec) rec.ch.post({ t: 'revoked' });
        devices.splice(i, 1); saveDevices();
        revoked.push(d.key);
        while (revoked.length > REVOKED_MAX) revoked.shift();
        lsSet(kRevoked(), revoked);
        // недоставленное от него больше не ждём
        for (let k = queue.length - 1; k >= 0; k--) if (queue[k].dev.id === id) queue.splice(k, 1);
        syncChannels(); change();
      },
      // «Открыть панель в отдельной вкладке» этого же браузера: localStorage
      // у вкладок общий, поэтому код не нужен — ключ кладём панели прямо
      // туда. Окошко «Разрешить» тут лишнее: открыл её сам учитель с доски
      linkLocalPanel(){
        if (!boardId) return;
        let d = devices.find(x => x.local);
        if (!d){
          d = { id: newId(), name: 'Вкладка этого браузера', key: b64url(randBytes(32)), addedAt: Date.now(), local: true };
          devices.push(d); saveDevices();
        }
        const link = { key: d.key, devId: d.id, name: d.name, at: Date.now(), local: true, boardId, board: boardName() };
        lsSet(LS_PANEL, link);
        rememberPanelLink(link);
        syncChannels(); change();
      },
      pump,
      stateChanged(){
        // ширина стопки или имя доски поменялись — панелям не ждать пинга
        chans.forEach((rec, key) => { if (devices.some(d => d.key === key)) rec.ch.post(Object.assign({ t: 'pong' }, stateMsg())); });
      },
      // окно с кодом открыто / закрыто (см. pairingVisible)
      setPairingVisible(v){
        v = !!v;
        if (v === pairingVisible) return;
        pairingVisible = v;
        clearTimeout(pairingTimer);
        if (!v){
          pairingOffAt = Date.now() + PAIR_REMOTE_KEEP_MS;
          pairingTimer = setTimeout(() => { if (active) openPair(); }, PAIR_REMOTE_KEEP_MS + 50);
        }
        if (active) openPair();
      },
      get pairRemote(){ return pairRemote; },
    };
  }

  /* ═══════════ сторона панели ═══════════
     opts.onChange(state) — перерисовать индикатор и счётчик.

     Доска закрыта — задание не теряется: панель держит его у себя и шлёт,
     как только доска ответит, а пока показывает «ждут отправки: N».
     Почему так, а не «не отправлено, нажмите ещё раз»: задание снято в
     потоке урока, и пример в тренажёре к моменту повторной попытки уже
     другой (Math.random) — потерянное задание не восстановить. Держим
     только в памяти вкладки, не в localStorage: картинки весят сотни КБ,
     а хранилище маленькое; закрыли панель — честно теряем, она это видно
     показывает счётчиком до закрытия. Повтор безопасен: у задания свой id,
     и доска второй раз его не вставит (doneMap). */
  function createClient(opts){
    const me = newId();
    let link = lsGet(LS_PANEL, null);
    if (!link || typeof link.key !== 'string') link = null;
    // ключ с этапа 1 (до списка досок) — в список, чтобы не потерялся
    if (link && !panelLinks().some(x => x.key === link.key)) rememberPanelLink(link);
    let chan = null;
    let lastPong = 0, board = { ref: null, board: '', queue: 0 };
    let revokedFlag = false;
    const outbox = [];   // { id, t, p, sentAt, heardAt, state, resolve, pos, total }
    let timer = null;

    const online = () => !!link && Date.now() - lastPong < ONLINE_TTL_MS;
    const mine = (o) => !!link && o.key === link.key;
    const snapshot = () => ({
      paired: !!link, online: online(), revoked: revokedFlag, board,
      deviceName: link ? link.name : '',
      boardName: link ? (link.board || '') : '',
      // не дошло до доски (ещё не слали или ответа нет): доска не в сети —
      // это и есть «ждут отправки»
      waiting: outbox.filter(o => mine(o) && (o.state === 'wait' || o.state === 'sent')).length,
      // неотправленное на другие доски этой панели (переключились, не дождавшись)
      waitingElsewhere: outbox.filter(o => !mine(o)).length,
      queued: outbox.filter(o => mine(o) && (o.state === 'queued' || o.state === 'placing')).length,
      placing: outbox.some(o => mine(o) && o.state === 'placing'),
    });
    const change = () => { try { opts.onChange && opts.onChange(snapshot()); } catch (e) { console.error(e); } };

    function onWork(m){
      if (m.to && m.to !== me && m.t !== 'pong') return;
      if (m.t === 'pong'){
        const was = online();
        lastPong = Date.now();
        board = { ref: m.ref || null, board: m.board || '', scale: m.scale || null, queue: m.queue || 0 };
        // доску переименовали — в списке досок панели тоже
        if (link && m.board && link.board !== m.board){
          link.board = m.board;
          lsSet(LS_PANEL, link); rememberPanelLink(link);
        }
        (m.pending || []).forEach(id => { const o = outbox.find(x => x.id === id); if (o) o.heardAt = Date.now(); });
        if (!was) flush();
        change();
        return;
      }
      if (m.t === 'revoked'){
        revokedFlag = true;
        forget();
        return;
      }
      const o = outbox.find(x => x.id === m.id);
      if (!o) return;
      lastPong = Date.now();
      if (m.t === 'queue-state'){
        o.state = m.placing ? 'placing' : 'queued'; o.pos = m.pos; o.total = m.total; o.heardAt = Date.now();
        change(); return;
      }
      if (m.t === 'ack' || m.t === 'placed' || m.t === 'cancelled'){
        outbox.splice(outbox.indexOf(o), 1);
        if (chan) chan.release(o.id);
        o.resolve(m.t === 'ack' ? (m.ok ? 'ok' : 'fail') : m.t);
        change();
      }
    }
    function openWork(){
      if (chan) chan.close();
      // ключ от вкладки этого же браузера (доска положила его в общий
      // localStorage) — доска рядом, Supabase не нужен
      chan = link ? openChannel(workName(link.key), onWork, { remote: !link.local, secret: link.key }) : null;
    }
    function flush(){
      if (!chan || !online()) return;
      const now = Date.now();
      outbox.forEach(o => {
        // задание снято для своей доски — на другую оно не уходит, даже
        // если панель уже переключили (ждёт, пока на неё вернутся)
        if (o.key !== link.key) return;
        if (o.sentAt && now - Math.max(o.sentAt, o.heardAt || 0) < RESEND_MS) return;
        o.sentAt = now;
        if (o.state === 'wait') o.state = 'sent';
        chan.post({ t: o.t, id: o.id, from: me, p: o.p });
      });
    }
    function tick(){
      if (chan) chan.post({ t: 'ping', from: me });
      flush();
      change();
    }
    function forget(){
      if (chan) outbox.forEach(o => chan.release(o.id));
      // в хранилище мог уже лечь ключ другой вкладки-панели этого браузера —
      // стираем только свой
      const stored = lsGet(LS_PANEL, null);
      if (link && stored && stored.key === link.key){ try { localStorage.removeItem(LS_PANEL); } catch (e) {} }
      const gone = link ? link.key : null;
      if (link) forgetPanelLink(link.key);
      link = null;
      if (chan){ chan.close(); chan = null; }
      lastPong = 0;
      // доска нас больше не примет — недоставленное честно отменяем
      if (gone){ for (let i = outbox.length - 1; i >= 0; i--) if (outbox[i].key === gone){ outbox[i].resolve('revoked'); outbox.splice(i, 1); } }
      change();
    }
    function start(){
      openWork();
      clearInterval(timer);
      timer = setInterval(tick, PING_MS);
      tick();
    }
    // ключ положила доска («Открыть в отдельной вкладке») уже после открытия
    // панели. Подхватываем, только если своего нет: уже подключённая вкладка
    // молча на чужой ключ не переходит
    window.addEventListener('storage', (e) => {
      if (e.key !== LS_PANEL || link) return;
      const l = lsGet(LS_PANEL, null);
      if (l && typeof l.key === 'string'){ link = l; revokedFlag = false; openWork(); tick(); }
    });
    start();

    return {
      get me(){ return me; },
      state: snapshot,
      // → Promise<'ok'|'denied'|'busy'|'timeout'|'badcode'|'nocrypto'|'error'>
      async pair(rawCode, name){
        const c = normCode(rawCode);
        if (!c) return 'badcode';
        if (!cryptoOk()) return 'nocrypto';
        const nm = cleanName(name);
        try { localStorage.setItem(LS_PANEL_NAME, nm); } catch (e) {}
        let kp;
        try { kp = await makeKeyPair(); } catch (e) { return 'nocrypto'; }
        const nonce = newId();
        return new Promise((resolve) => {
          let finished = false;
          const end = (r) => { if (finished) return; finished = true; clearTimeout(to); ch.close(); resolve(r); };
          const ch = openChannel(pairName(c), async (m) => {
            if (m.to !== me || m.nonce !== nonce) return;
            if (m.t === 'reject') return end(m.reason === 'busy' ? 'busy' : (m.reason === 'error' ? 'error' : 'denied'));
            if (m.t !== 'approve' || typeof m.pub !== 'string') return;
            try {
              const key = await deriveSecret(kp.priv, m.pub);
              link = { key, devId: m.devId, name: m.name || nm, at: Date.now(), boardId: m.boardId || null, board: m.board || '' };
              lsSet(LS_PANEL, link);
              rememberPanelLink(link);
              revokedFlag = false;
              openWork(); tick();
              end('ok');
            } catch (e) { end('error'); }
          }, { remote: true });
          const to = setTimeout(() => end('timeout'), HELLO_TIMEOUT_MS);
          ch.post({ t: 'hello', from: me, nonce, name: nm, pub: kp.pub });
        });
      },
      // → Promise, итог: 'ok' | 'fail' | 'placed' | 'cancelled' | 'revoked'
      send(t, p){
        return new Promise((resolve) => {
          const o = { id: newId(), t, p, key: link ? link.key : null, sentAt: 0, heardAt: 0, state: 'wait', resolve };
          outbox.push(o);
          flush();
          change();
        });
      },
      unpair: forget,
      // доски, к которым подключали панель, — для выбора без кода
      links: () => panelLinks().map(x => ({ key: x.key, board: x.board || '', boardId: x.boardId || null, local: !!x.local, active: !!link && x.key === link.key })),
      // переключиться на другую доску из списка (без кода)
      use(key){
        const x = panelLinks().find(l => l.key === key);
        if (!x) return false;
        link = x; revokedFlag = false; lastPong = 0;
        board = { ref: null, board: x.board || '', queue: 0 };
        lsSet(LS_PANEL, link);
        rememberPanelLink(link);
        openWork(); tick();
        return true;
      },
      savedName: () => { try { return localStorage.getItem(LS_PANEL_NAME) || ''; } catch (e) { return ''; } },
    };
  }

  window.BoardLink = {
    CODE_ALPHABET, CODE_LEN, PROMPT_GAP_MS, PING_MS, ONLINE_TTL_MS, RESEND_MS,
    newCode, normCode, formatCode, cleanName, cryptoOk,
    REMOTE_SAFE_BYTES, BLOB_BUCKET,
    openChannel, transports, createHost, createClient,
    // для теста размеров и формата (test_prompt_board_link_remote.py)
    shrinkPayload, toWebp, jsonBytes, sealJson, openJson,
  };
})();
