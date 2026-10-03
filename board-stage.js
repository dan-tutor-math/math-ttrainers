/* ═══════════════════════════════════════════════════════════════════════
   board-stage.js — доска учителя у ученика (промпт №11 нового списка,
   часть 3: «как в AnyDesk» и на досках).

   Зачем. Учитель в совместной сессии уходит с тренажёра на доску — ученик
   должен видеть ту же доску: что открыто, куда учитель смотрит, как он
   двигает и масштабирует, что пишет — прямо в момент письма. Без входа по
   email и без заранее расшаренной доски.

   Почему не через облако досок (boards-cloud.js). Облачная общая доска —
   это доступ по аккаунту: ученику нужен вход, доска должна быть заранее
   общей, а личные доски учителя в облаке вообще не лежат (они только в его
   браузере). Здесь другое: учитель ПОКАЗЫВАЕТ любую свою доску, ученик
   только смотрит. Поэтому содержимое идёт тем же каналом совместной
   сессии, что и тренажёры (session-share.js), лёгкими сообщениями, и ни в
   какую базу не пишется: доска живёт у учителя, ученик видит её копию, пока
   смотрит. SQL и новые таблицы не нужны.

   Две роли одного файла:

   УЧИТЕЛЬ (ведущий сессии, обычная страница досок)
   - открыл доску, а на связи есть ученик — шлёт её целиком: сначала
     «шапку» (настройки листа, число частей), потом объекты частями не больше
     150 КБ (предел одного сообщения realtime — 256 КБ, и лишнее сервер
     выбрасывает молча). Картинки внутри объектов не едут с объектом: у
     объекта остаётся ключ картинки, а саму её ученик просит отдельно и
     получает частями — одна и та же картинка не гоняется повторно;
   - каждая правка (всё, что проходит через saveDB) — разница: изменённые и
     новые объекты, удалённые номера, порядок слоёв, если он поменялся.
     Правки нумеруются: ученик, пропустивший номер, просит доску заново;
   - то, что рисуется прямо сейчас (штрих пером до отпускания, объект,
     который тащат), — отдельными «живыми» сообщениями не чаще раза в 40 мс;
   - вид: камера (сдвиг, масштаб) и ширина панели тренажёров слева.

   УЧЕНИК (boards.html?s=КОД — пришёл за учителем)
   - страница досок в режиме просмотра: без экрана входа, без своего списка
     досок, НИЧЕГО не пишет в собственное хранилище досок ученика (все
     сохранения подменены пустышками), рисовать и двигать нельзя;
   - доска учителя собирается из частей, камера повторяет учительскую; на
     сцене (stage.html) окно того же размера, поэтому всё совпадает
     пропорционально;
   - учитель на списке досок — «Учитель выбирает доску…».

   Подключается в boards.html последним, после session-share.js. Движок
   досок (boards-core.js) о нём не знает: функции верхнего уровня движка —
   свойства window, и мы подменяем несколько из них (как это делает и
   boards-cloud.js), а переменные верхнего уровня (B, cam, boardInset…)
   видны отсюда по имени — это общий глобальный уровень классических скриптов.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const TS = window.TrainerSession;
  if (!TS || !TS.onEvent) return;
  const VIEWER = !!window.__boardViewer;

  /* Правка «доска не грузится у ученика» (после живого урока: учитель
     перешёл с главной на доску, у ученика минутами крутилась загрузка и
     доска появилась только после нескольких перезагрузок).
     Что было. Доска уходила частями по 150 КБ с паузой 30 мс — до 5 МБ в
     секунду в буфер сокета учителя, а домашняя отдача — от силы 0,1–1 МБ/с.
     Буфер разбухал, за ним стоял «пульс» библиотеки, ответа на пульс не было
     10 с — и библиотека сама рвала сокет вместе со всем, что не ушло. Ученик
     через 6 с без доски просил её заново, и учитель начинал ВСЮ доску с
     начала — ещё мегабайты в тот же буфер. Круг замыкался: чем больше доска
     и чем слабее отдача, тем вернее загрузка не кончалась никогда.
     Что теперь:
     - доска едет одним сжатым (gzip) куском, порезанным на части: точки
       штрихов — это в основном цифры, сжимаются в разы (координаты в дорогу
       ещё и округляются до сотых — на экране это неотличимо);
     - части уходят в темпе сети учителя: следующая — только когда буфер
       сокета почти пуст (TS.socketBacklog) и не чаще раза в 120 мс;
     - потерянную часть ученик дозапрашивает по номеру (bd_need_chunks),
       а не всю доску; повторная просьба «пришли доску», пока она ещё едет,
       получает только «шапку», без нового круга;
     - у ученика видно, сколько уже загружено, в процентах */
  const CHUNK_CHARS = 120000;   // одна часть — заведомо меньше предела сообщения
  const DIFF_MAX_CHARS = 150000; // правка больше этого — проще прислать доску заново
  const BULK_GAP_MS = 120;      // части подряд — не чаще: у тарифа есть предел сообщений в секунду на весь проект
  const BACKLOG_MAX = 64 * 1024; // в буфере сокета больше этого — следующую часть придержим
  const LIVE_MS = 30;           // живое (штрих, фигура, текст, перетаскивание, камера) — как штрихи на тренажёрах
  const PROTO = 2;              // версия способа передачи (см. bd_hello)

  /* ── сжатие ──
     CompressionStream есть во всех нынешних браузерах (Safari — с 16.4).
     Кто не умеет распаковать, говорит об этом в bd_hello (gz:false) — тогда
     учитель шлёт доску несжатой */
  const CAN_GZIP = typeof CompressionStream === 'function';
  const CAN_GUNZIP = typeof DecompressionStream === 'function';
  async function gzipToB64(str) {
    const stream = new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'));
    const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    let bin = '';
    // по кускам: String.fromCharCode с сотнями тысяч аргументов падает
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  async function b64ToText(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return await new Response(stream).text();
  }

  /* ── ключ картинки ──
     Картинки хранятся в объекте строкой data:URL по сотне килобайт и больше.
     Ключ — длина плюс выборочная сумма символов: считать по всей строке на
     каждой правке дорого, а совпадение длины и выборки у двух разных
     картинок на одной доске практически невозможно */
  const keyCache = new Map();
  function srcKey(src) {
    if (!src) return '';
    let k = keyCache.get(src);
    if (k) return k;
    let h = 0;
    const step = Math.max(1, Math.floor(src.length / 4000));
    for (let i = 0; i < src.length; i += step) h = (h * 31 + src.charCodeAt(i)) | 0;
    h = (h * 31 + src.charCodeAt(src.length - 1)) | 0;
    k = src.length.toString(36) + '.' + (h >>> 0).toString(36);
    if (keyCache.size > 500) keyCache.clear();
    keyCache.set(src, k);
    return k;
  }

  /* ════════════════════════ УЧИТЕЛЬ ════════════════════════ */
  function teacher() {
    // Браузер ученика (роль «присоединившийся» с прошлого урока), открывший
    // доски сам, без ссылки учителя: он пришёл в СВОИ доски — общие доски по
    // email. Совместную сессию здесь не запускаем вовсе: иначе init() увёл
    // бы его на сцену учителя (так ведут себя страницы тренажёров), и до
    // своих досок он бы не добрался. Показывать доску может только учитель
    // Промпт №75: роль — сначала своя у вкладки (в соседней вкладке учитель
    // мог подключиться к чужой сессии, и общий ключ говорит «ученик»)
    let role = null;
    try { role = sessionStorage.getItem('tsTab:role') || localStorage.getItem('trainerSession:global:role'); } catch (e) {}
    if (role === 'follower') return;
    TS.init({ trainer: 'boards', getState: () => ({}), applyState: () => {} });

    // «К тренажёрам» — через сессию, чтобы ученики вернулись следом
    const toIndex = document.getElementById('blToIndex');
    if (toIndex) toIndex.addEventListener('click', (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      TS.navigateTo('index.html');
    });

    // Части доски и картинок — по одной, в темпе сети (см. вверху файла);
    // живое (штрих, вид, правки) идёт мимо этой очереди, сразу: оно мелкое.
    // key — чтобы одна и та же часть, запрошенная дважды, не встала в
    // очередь второй раз
    const bulk = [];
    let bulkTimer = null, lastBulkAt = 0;
    function sendBulk(name, data, key) {
      if (key && bulk.some(m => m[2] === key)) return;
      bulk.push([name, data, key]);
      if (!bulkTimer) bulkTimer = setTimeout(pumpBulk, 0);
    }
    function pumpBulk() {
      bulkTimer = null;
      if (!bulk.length) return;
      const wait = lastBulkAt + BULK_GAP_MS - Date.now();
      const backlog = TS.socketBacklog ? TS.socketBacklog() : 0;
      if (wait > 0 || backlog > BACKLOG_MAX) { bulkTimer = setTimeout(pumpBulk, Math.max(wait, 50)); return; }
      const m = bulk.shift();
      lastBulkAt = Date.now();
      TS.broadcastEvent(m[0], m[1]);
      if (bulk.length) bulkTimer = setTimeout(pumpBulk, BULK_GAP_MS);
    }
    function chunksQueued(sync) { return bulk.some(m => m[0] === 'bd_chunk' && m[1].sync === sync); }

    let syncId = 0;            // номер полной рассылки доски
    let ver = 0;               // номер правки внутри неё
    let pack = null;           // упакованная доска текущей рассылки: { sync, bid, z, chunks, settings, size }
    let packing = 0;           // номер рассылки, которая сейчас сжимается
    let noGz = !CAN_GZIP;      // кто-то из учеников не умеет распаковывать
    let lastFullAt = 0;
    let shownId = undefined;   // какая доска сейчас «в эфире» (null — список)
    let sent = new Map();      // id объекта → подпись того, что ушло
    let sentOrder = [];
    const imgs = new Map();    // ключ картинки → data:URL (картинки текущей доски)

    function viewers() { return TS.hasViewers ? TS.hasViewers() : true; }
    function boardOpen() { return !!(boardActive && B && Array.isArray(B.objects)); }

    /* подпись объекта: всё, кроме точек и картинки, плюс сводка точек.
       Точки перетаскиваемого объекта меняются на месте, поэтому сводка — по
       всем точкам (сумма), а не только по их числу */
    function sig(o) {
      let s;
      try {
        s = JSON.stringify(o, (k, v) => (k === 'points' || k === 'src' || k === 'gen') ? undefined : v);
      } catch (e) { s = String(Math.random()); }
      const p = o.points;
      if (Array.isArray(p) && p.length) {
        let sx = 0, sy = 0;
        for (let i = 0; i < p.length; i++) { sx += p[i].x; sy += p[i].y * 1.7; }
        s += '|' + p.length + ',' + Math.round(sx * 10) + ',' + Math.round(sy * 10);
      }
      if (o.src) s += '|' + srcKey(o.src);
      return s;
    }
    // Объект в дорогу: картинка — ключом, сама она едет отдельно по запросу.
    // gen у задания с тренажёра — рецепт «ещё такого же» с вёрсткой задания
    // (до 300 КБ): ученику он не нужен, а в одно сообщение бы не влез
    function slim(o) {
      const c = Object.assign({}, o);
      // точки в дорогу — до сотых: под пером их тысячи, и лишние знаки
      // после запятой (а их у координат из событий мыши бывает по десять)
      // были большей частью веса доски. На экране сотая пикселя не видна
      if (Array.isArray(o.points)) {
        c.points = o.points.map((p) => {
          if (!p || typeof p.x !== 'number') return p;
          const q = Object.assign({}, p);
          q.x = Math.round(p.x * 100) / 100;
          q.y = Math.round(p.y * 100) / 100;
          return q;
        });
      }
      if (o.src) {
        const k = srcKey(o.src);
        imgs.set(k, o.src);
        delete c.src;
        c.srcKey = k;
      }
      delete c.gen;
      return c;
    }
    function settingsOf(b) {
      return {
        name: b.name || '', cellSize: b.cellSize, sheetCols: b.sheetCols, sheetRows: b.sheetRows,
        pageOrder: b.pageOrder, gridColor: b.gridColor == null ? null : b.gridColor,
        showPageNumbers: !!b.showPageNumbers,
      };
    }
    let lastSettings = '';

    /* Справочные материалы (кнопка в правом нижнем углу доски): ученик
       видит их так же, как учитель, — что открыто, какая вкладка, картинки,
       текст, заметки и куда учитель сдвинул/увеличил холст заметок. Хранятся
       они в самой доске (B.refPanel), поэтому едут вместе с ней и правками;
       картинки — ключами, как картинки самой доски */
    function refOf(b) {
      const rp = (b && b.refPanel) || {};
      const out = {
        open: !!rp.open, mode: rp.mode || 'image', textMode: rp.textMode || 'type', text: rp.text || '',
        w: rp.w || null, h: rp.h || null,
        imageObjects: (rp.imageObjects || []).map(slim), drawObjects: (rp.drawObjects || []).map(slim),
      };
      if (typeof rfCam !== 'undefined' && rfCam) out.cam = { x: +rfCam.x.toFixed(2), y: +rfCam.y.toFixed(2), zoom: +rfCam.zoom.toFixed(4) };
      return out;
    }
    let lastRefSig = '';

    function sendClosed() {
      // номер рассылки — дальше: сжатие, начатое для закрытой доски, не
      // должно потом разослать её «шапку» (см. проверку после await в sendFull)
      syncId++; packing = 0; pack = null; bulk.length = 0;
      shownId = null;
      sent = new Map(); sentOrder = [];
      TS.broadcastEvent('bd_meta', { bid: null });
    }
    function sendMeta() {
      if (!pack) return;
      TS.broadcastEvent('bd_meta', { bid: pack.bid, sync: pack.sync, n: pack.chunks.length, z: pack.z, size: pack.size, settings: pack.settings });
    }
    function queueChunks(idx) {
      if (!pack) return;
      idx.forEach((i) => {
        const d = pack.chunks[i];
        if (d != null) sendBulk('bd_chunk', { sync: pack.sync, i: i, d: d }, 'c' + pack.sync + ':' + i);
      });
    }
    async function sendFull() {
      if (!boardOpen()) { sendClosed(); return; }
      syncId++; ver = 0;
      const my = syncId;
      shownId = B.id;
      bulk.length = 0;
      imgs.clear();
      pack = null;
      packing = my;
      lastFullAt = Date.now();
      sent = new Map();
      const objs = B.objects.map((o) => { sent.set(o.id, sig(o)); return slim(o); });
      sentOrder = B.objects.map(o => o.id);
      const st = settingsOf(B);
      lastSettings = JSON.stringify(st);
      const ref = refOf(B);
      lastRefSig = JSON.stringify(ref);
      lastShapeSig = ''; lastTextSig = '';   // новая рассылка — живое заново
      const json = JSON.stringify({ objs: objs, ref: ref });
      let data = json, z = 0;
      if (!noGz) {
        try { data = await gzipToB64(json); z = 1; } catch (e) { data = json; z = 0; }
      }
      // пока сжимали, учитель открыл другую доску или ушёл к списку — эта
      // рассылка устарела, новую начал тот, кто это заметил
      if (my !== syncId) return;
      packing = 0;
      const chunks = [];
      for (let i = 0; i < data.length; i += CHUNK_CHARS) chunks.push(data.slice(i, i + CHUNK_CHARS));
      if (!chunks.length) chunks.push('');
      pack = { sync: my, bid: shownId, z: z, chunks: chunks, settings: st, size: json.length };
      sendMeta();
      queueChunks(chunks.map((_, i) => i));
      sendView(true);
    }

    function sendDiff() {
      // пока доска сжимается, правки копятся сами: sent — снимок того, что
      // ушло в упаковку, разница посчитается от него, когда «шапка» уйдёт
      if (packing || !boardOpen() || shownId !== B.id || !viewers()) return;
      const upd = [], del = [];
      const now = new Map();
      B.objects.forEach((o) => {
        const s = sig(o);
        now.set(o.id, s);
        if (sent.get(o.id) !== s) upd.push(slim(o));
      });
      sent.forEach((_, id) => { if (!now.has(id)) del.push(id); });
      const order = B.objects.map(o => o.id);
      // порядок, который получится у ученика сам: старый без удалённых, новые
      // в конце. Не совпал (объект подняли наверх, отмена вернула удалённый
      // на старое место) — шлём порядок целиком
      const delSet = new Set(del);
      const expect = sentOrder.filter(id => !delSet.has(id));
      const known = new Set(expect);
      order.forEach(id => { if (!known.has(id)) expect.push(id); });
      const orderChanged = expect.length !== order.length || expect.some((id, i) => id !== order[i]);
      const st = JSON.stringify(settingsOf(B));
      const stChanged = st !== lastSettings;
      const ref = refOf(B);
      const refSig = JSON.stringify(ref);
      const refChanged = refSig !== lastRefSig;
      if (!upd.length && !del.length && !orderChanged && !stChanged && !refChanged) return;
      sent = now; sentOrder = order; lastSettings = st; lastRefSig = refSig;
      ver++;
      const msg = { sync: syncId, ver: ver, upd: upd, del: del };
      if (orderChanged) msg.order = order;
      if (stChanged) msg.settings = JSON.parse(st);
      if (refChanged) msg.ref = ref;
      // крупная правка (вставили пачку картинок, загрузили доску из файла) не
      // влезет в одно сообщение — проще прислать доску заново
      if (JSON.stringify(msg).length > DIFF_MAX_CHARS) { sendFull(); return; }
      TS.broadcastEvent('bd_diff', msg);
    }
    let diffTimer = null;
    function queueDiff() {
      if (diffTimer) return;
      diffTimer = setTimeout(() => { diffTimer = null; sendDiff(); }, 60);
    }

    /* ── вид и живое ── */
    let lastView = '';
    function sendView(force) {
      if (!boardOpen()) return;
      const v = { x: +cam.x.toFixed(2), y: +cam.y.toFixed(2), zoom: +cam.zoom.toFixed(4), inset: boardInset };
      const key = JSON.stringify(v);
      if (!force && key === lastView) return;
      lastView = key;
      TS.broadcastEvent('bd_view', v);
    }
    let liveTimer = null, liveAt = 0;
    let livePenId = null, livePenSent = 0, livePenT0 = 0, livePenLastT = 0;
    const liveDragSig = new Map();
    let lastShapeSig = '', lastTextSig = '';

    /* Фигура, которую тянут прямо сейчас (прямая, прямоугольник, окружность,
       кривая, многоугольник, угол): движок держит её в переменных черновика и
       рисует «предпросмотром» до отпускания. Шлём ровно эти переменные и
       текущий стиль — у ученика тот же движок нарисует тот же предпросмотр */
    function shapeState() {
      if (!draft && !curvePts && !circleState && !polyState && !shapeDrag) return null;
      return {
        draft: draft, curvePts: curvePts, circleState: circleState, polyState: polyState, shapeDrag: shapeDrag,
        st: { c: curColorTok, w: curWidth, d: curDash, o: curOpacity, ae: curArrowEnd, ab: curArrowBoth },
      };
    }
    /* Текст, который набирают прямо сейчас: до «Подтвердить» он живёт только
       в поле ввода поверх доски, в объекты доски не попадает. Шлём то, что в
       поле, и вид будущего текста — у ученика он рисуется на месте поля */
    function textState() {
      const t = textEditSession;
      if (!t || !t.textarea) return null;
      return {
        objId: t.objId || null, pt: t.worldPt, content: t.textarea.value,
        boxW: t.boxW || null, fontSize: t.fontSize, bold: !!t.bold, italic: !!t.italic,
        underline: !!t.underline, strike: !!t.strike, color: t.color, bg: t.bg || null,
      };
    }
    function sendLive() {
      liveTimer = null;
      liveAt = Date.now();
      if (!boardOpen() || shownId !== B.id || !viewers()) return;
      sendView(false);
      const live = {};
      // штрих пером — по кусочкам: только новые точки. У каждой точки — время
      // от начала штриха (мс): ученик проигрывает их с тем же темпом, что и
      // рука учителя, а не выставляет пачку разом. Точное время каждой точки
      // движок не хранит, поэтому точки пачки раскладываем равномерно между
      // прошлой отправкой и этой — за 30 мс рука проходит почти прямую
      if (penStroke && penStroke.points && penStroke.points.length) {
        const now = Date.now();
        if (livePenId !== penStroke.id) { livePenId = penStroke.id; livePenSent = 0; livePenT0 = now; livePenLastT = 0; }
        const pts = penStroke.points.slice(livePenSent);
        if (pts.length) {
          const tNow = now - livePenT0, tPrev = livePenSent ? livePenLastT : tNow;
          const ts = pts.map((_, i) => Math.round(tPrev + (tNow - tPrev) * (i + 1) / pts.length));
          live.pen = { id: penStroke.id, from: livePenSent, pts: pts, ts: ts };
          if (livePenSent === 0) Object.assign(live.pen, { color: penStroke.color, width: penStroke.width, dash: penStroke.dash, opacity: penStroke.opacity });
          livePenSent = penStroke.points.length;
          livePenLastT = tNow;
        }
      } else if (livePenId) {
        live.pen = null; livePenId = null; livePenSent = 0;
      }
      // фигура по ходу рисования — только если изменилась
      const sh = shapeState();
      const shSig = sh ? JSON.stringify(sh) : '';
      if (shSig !== lastShapeSig) { lastShapeSig = shSig; live.shape = sh; }
      // текст по ходу набора
      const tx = textState();
      const txSig = tx ? JSON.stringify(tx) : '';
      if (txSig !== lastTextSig) { lastTextSig = txSig; live.text = tx; }
      // объект, который тащат или тянут за ручку: у ученика он едет следом, не
      // дожидаясь отпускания (итог всё равно придёт правкой)
      const ids = (dragMode === 'multimove' && Array.isArray(dragGroupIds)) ? dragGroupIds
        : ((dragMode === 'move' || dragMode === 'handle') && dragObjId) ? [dragObjId] : [];
      if (ids.length) {
        const objs = [];
        ids.slice(0, 60).forEach((id) => {
          const o = B.objects.find(x => x.id === id);
          if (!o) return;
          const s = sig(o);
          if (liveDragSig.get(id) === s) return;
          liveDragSig.set(id, s);
          objs.push(slim(o));
        });
        if (objs.length) live.objs = objs;
      } else if (liveDragSig.size) liveDragSig.clear();
      if (Object.keys(live).length) { live.sync = syncId; TS.broadcastEvent('bd_live', live); }
    }
    // Набор текста идёт мимо перерисовки доски (поле ввода — обычный
    // элемент страницы), поэтому клавиши слушаем отдельно
    document.addEventListener('input', (e) => {
      if (textEditSession && e.target === textEditSession.textarea) queueLive();
    }, true);
    // Курсор над панелью тренажёров слева у ученика не показываем: панели
    // у него нет (на её месте продолжается доска), и стрелка «водила бы» по
    // доске там, где учитель на самом деле листает тренажёры
    window.__tsCursorMask = (x) => boardOpen() && boardInset > 0 && x < boardInset;
    function queueLive() {
      if (liveTimer) return;
      liveTimer = setTimeout(sendLive, Math.max(0, LIVE_MS - (Date.now() - liveAt)));
    }

    // Любая правка доски проходит через saveDB, любое движение — через
    // перерисовку: подслушиваем обе, не трогая мест вызова внутри движка
    const origSave = window.saveDB;
    window.saveDB = function () {
      const r = origSave.apply(this, arguments);
      queueDiff();
      return r;
    };
    const origRedraw = window.scheduleRedraw;
    window.scheduleRedraw = function () {
      const r = origRedraw.apply(this, arguments);
      queueLive();
      return r;
    };

    // открыли/закрыли доску, пришёл ученик — смотрим раз в полсекунды: так
    // не нужно встраиваться во все пути открытия (список, хэш, облако)
    let hadViewers = false;
    setInterval(() => {
      const v = viewers();
      const nowId = boardOpen() ? B.id : null;
      if (!v) { hadViewers = false; return; }
      if (!hadViewers || nowId !== shownId) {
        hadViewers = true;
        if (nowId) sendFull(); else sendClosed();
        return;
      }
      // правки, прошедшие мимо saveDB (облачная доска: чужие изменения)
      if (nowId) sendDiff();
    }, 500);

    // ученик просит доску целиком (только пришёл, переподключился, пропустил правку)
    let helloTimer = null;
    TS.onEvent('bd_hello', (d) => {
      // Ученик со старым board-stage.js (страница из кэша браузера) ждёт
      // доску прежним способом и не понял бы новый — просил бы её снова и
      // снова, а каждая просьба гнала бы всю доску заново. Ему не отвечаем:
      // перезагрузка страницы подтянет новую версию
      if (!d || d.v !== PROTO) return;
      let repack = false;
      if (d.gz === false && !noGz) { noGz = true; repack = !!(pack && pack.z); }
      clearTimeout(helloTimer);
      // несколько учеников подряд — одна рассылка на всех
      helloTimer = setTimeout(() => {
        if (!boardOpen()) { sendClosed(); return; }
        if (packing) return;   // «шапка» уйдёт сама, как только доска сожмётся
        // доска ещё едет — новому ученику хватит «шапки»: части, что уже
        // ушли до него, он дозапросит по номерам. Начинать всё заново —
        // это и был бесконечный круг (см. вверху файла)
        if (!repack && pack && pack.bid === B.id && chunksQueued(pack.sync)) { sendMeta(); return; }
        sendFull();
      }, 120);
    });
    // ученик собирает доску и какой-то части у него нет (потерялась в
    // сети, пришёл посреди рассылки) — шлём только эти части
    TS.onEvent('bd_need_chunks', (d) => {
      if (!d || !Array.isArray(d.idx) || !boardOpen()) return;
      if (!pack || d.sync !== pack.sync) {
        // ученик собирает старую рассылку — покажем ему, какая сейчас
        if (pack && pack.bid === B.id) sendMeta();
        return;
      }
      queueChunks(d.idx.slice(0, 60).filter(i => typeof i === 'number'));
    });
    // картинки — по запросу
    TS.onEvent('bd_need', (d) => {
      if (!d || !Array.isArray(d.keys)) return;
      d.keys.slice(0, 50).forEach((k) => {
        const src = imgs.get(k);
        if (!src) return;
        const n = Math.max(1, Math.ceil(src.length / CHUNK_CHARS));
        for (let i = 0; i < n; i++) {
          sendBulk('bd_img', { key: k, i: i, n: n, data: src.slice(i * CHUNK_CHARS, (i + 1) * CHUNK_CHARS) }, 'i' + k + ':' + i);
        }
      });
    });
  }

  /* ════════════════════════ УЧЕНИК ════════════════════════ */
  function viewer() {
    // ── ничего не пишем в хранилище ученика ──
    // Его собственные доски лежат в этом же браузере (IndexedDB). Доска
    // учителя здесь — временная копия; любое сохранение из движка (выход со
    // страницы, сворачивание вкладки, случайная правка) записало бы её к
    // ученику, а то и поверх его досок
    window.saveDB = function () {};
    window.idbSaveDB = function () { return Promise.resolve(true); };
    window.pushUndo = function () {};
    window.rememberView = function () {};
    boardAccess = 'view';

    const st = document.createElement('style');
    st.textContent = `
      /* просмотр: от интерфейса досок остаются холст и живые поля заданий
         (они показывают ответ ученика учителя, но нажать их нельзя) */
      html.bd-viewer #screenList{display:none!important;}
      html.bd-viewer #screenBoard > *:not(#boardCv):not(#bdTaskLayer):not(#bdViewerWait):not(#bdRefToggle):not(#bdRefPanel){display:none!important;}
      html.bd-viewer #screenBoard, html.bd-viewer #screenBoard *{pointer-events:none!important;}
      /* справочные материалы учителя: кнопка в углу ученику видна и
         нажимается (открыть/свернуть у себя), текст в панели можно листать;
         менять в панели ученик ничего не может */
      html.bd-viewer:not(.bd-viewer-on) #bdRefToggle, html.bd-viewer:not(.bd-viewer-on) #bdRefPanel{display:none!important;}
      html.bd-viewer #screenBoard #bdRefToggle, html.bd-viewer #screenBoard #bdRefClose,
      html.bd-viewer #screenBoard #bdRefTextarea{pointer-events:auto!important;}
      html.bd-viewer #bdRefResize, html.bd-viewer #bdRefResizeN, html.bd-viewer #bdRefResizeW,
      html.bd-viewer #bdRefImageFill, html.bd-viewer #bdRefUploadBtn{display:none!important;}
      #bdViewerWait{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:50;
        background:var(--bg);color:var(--muted-2,#888);font-family:var(--font-ui,system-ui);font-size:17px;
        text-align:center;padding:24px;box-sizing:border-box;}
      #bdViewerWait.hidden{display:none;}
      #bdViewerWait b{display:block;color:var(--pencil,#222);font-size:20px;margin-bottom:6px;}
    `;
    document.head.appendChild(st);
    document.documentElement.classList.add('bd-viewer');
    const wait = document.createElement('div');
    wait.id = 'bdViewerWait';
    wait.innerHTML = '<div><b>Доска учителя</b><span id="bdViewerWaitText">Подключаемся…</span></div>';
    document.body.appendChild(wait);
    const waitText = wait.querySelector('#bdViewerWaitText');
    function showWait(text) { waitText.textContent = text; wait.classList.remove('hidden'); }
    function hideWait() { wait.classList.add('hidden'); }
    screenList.style.display = 'none';

    // ученик смотрит, а не управляет: колесо, клавиши, жесты — мимо движка.
    // Кроме кнопки справочных материалов и её «свернуть» (на планшете
    // preventDefault у касания отменил бы и само нажатие) и текста в
    // справочной панели — его можно листать
    const REF_FREE = '#bdRefToggle, #bdRefClose, #bdRefTextarea';
    const block = (e) => {
      const t = e.target;
      if (e.type !== 'keydown' && t && t.closest && t.closest(REF_FREE)) return;
      e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'keydown') e.preventDefault();
    };
    ['wheel', 'pointerdown', 'mousedown', 'touchstart', 'dblclick', 'contextmenu', 'gesturestart'].forEach((t) => {
      window.addEventListener(t, block, { capture: true, passive: false });
    });
    window.addEventListener('keydown', block, { capture: true });

    /* Панель тренажёров слева у учителя ученику не показываем вовсе —
       ни её содержимое, ни пустую полосу на её месте: холст у ученика всегда
       во всё окно. Чтобы доска при этом стояла на тех же местах экрана, что
       у учителя, камера ученика сдвигается на ширину панели: у учителя точка
       доски x видна в inset + (x − cam.x)·zoom, у ученика — в (x − cam.x')·zoom,
       и при cam.x' = cam.x − inset/zoom это одно и то же место. Под панелью
       ученик видит продолжение доски — как будто панель закрыта */
    window.applyBoardInset = function () {
      if (boardInset === 0) return;
      boardInset = 0;
      screenBoardEl.style.setProperty('--bd-inset', '0px');
      if (boardActive) resizeCanvas();
    };

    const inStage = !!(TS.isStageFrame && TS.isStageFrame());
    TS.holdStageReady && TS.holdStageReady();
    let released = false;
    function releaseReady() {
      if (released) return;
      released = true;
      TS.releaseStageReady && TS.releaseStageReady();
    }
    setTimeout(releaseReady, 3500);   // доска большая или учитель молчит — не держим сцену

    /* ── живой штрих учителя ──
       Точки приходят пачками раз в 30 мс, и сеть их задерживает неровно.
       Выставлять пачку разом — линия у ученика дорастает рывками. Поэтому
       точки проигрываются по своему времени (ts, см. учителя) с небольшой
       задержкой: пока одна пачка проигрывается, следующая уже пришла, и перо
       у ученика идёт ровно, в темпе руки учителя.
       Задержка подстраивается под сеть ученика: пачки опаздывают сильнее
       (мобильный интернет отдаёт их залпами) — задержка растёт до этого
       опоздания, сеть ровная — понемногу сжимается обратно. Помнится между
       штрихами: неровная сеть даёт рывок только в начале первого штриха.
       Отстали сильно (сеть «встала», потом отдала всё сразу) — догоняем,
       чтобы не рисовать с опозданием в секунды */
    const PLAYOUT_MIN = 60, PLAYOUT_MAX = 260, CATCHUP_MS = 400;
    let playout = 80;
    let livePen = null;           // { id, …стиль, points: показанные, queue: [{p,t}], base }
    let playRaf = 0;
    function learnLateness(lastT) {
      if (!livePen) return;
      const late = performance.now() - livePen.base - lastT;
      if (late > playout - 15) playout = Math.min(PLAYOUT_MAX, late + 30);
      else playout = Math.max(PLAYOUT_MIN, playout - 0.5);
    }
    function playPen() {
      playRaf = 0;
      if (!livePen || !livePen.queue.length) return;
      const now = performance.now();
      const q = livePen.queue;
      // сколько времени штриха «должно быть» показано к этому моменту
      let target = now - livePen.base - playout;
      const last = q[q.length - 1].t;
      if (last - target > CATCHUP_MS) { livePen.base -= (last - target - CATCHUP_MS); target = last - CATCHUP_MS; }
      let n = 0;
      while (n < q.length && q[n].t <= target) n++;
      if (n) { livePen.points.push.apply(livePen.points, q.splice(0, n).map(x => x.p)); scheduleRedraw(); }
      if (q.length) playRaf = requestAnimationFrame(playPen);
    }
    function kickPen() { if (!playRaf) playRaf = requestAnimationFrame(playPen); }

    // фигура и текст учителя по ходу рисования/набора
    let liveShape = null, liveText = null;
    function applyShape(sh) {
      liveShape = sh || null;
      // переменные черновика движка — его же предпросмотр нарисует фигуру
      // (у ученика они больше ни для чего не используются: рисовать он не может)
      draft = sh ? sh.draft : null;
      curvePts = sh ? sh.curvePts : null;
      circleState = sh ? sh.circleState : null;
      polyState = sh ? sh.polyState : null;
      shapeDrag = sh ? sh.shapeDrag : null;
      if (sh && sh.st) {
        curColorTok = sh.st.c; curWidth = sh.st.w; curDash = !!sh.st.d; curOpacity = !!sh.st.o;
        curArrowEnd = !!sh.st.ae; curArrowBoth = !!sh.st.ab;
      }
    }
    function textObj(t) {
      const o = {
        id: '__liveText', type: 'text', content: t.content || '', points: [{ x: t.pt.x, y: t.pt.y }],
        fontSize: t.fontSize || 22, bold: t.bold, italic: t.italic, underline: t.underline, strike: t.strike,
        color: t.color || '--pencil',
      };
      if (t.boxW) o.boxW = t.boxW;
      if (t.bg) o.bg = t.bg;
      try { measureTextObj(o); } catch (e) {}
      return o;
    }

    const origRender = window.render;
    window.render = function (c, w, h, camv, isScreen, rd) {
      // правят существующий текст — сам объект прячем, вместо него рисуется
      // то, что сейчас в поле ввода у учителя (как у учителя: поле поверх)
      const hideId = isScreen && liveText && liveText.objId;
      let saved = null;
      if (hideId && B && Array.isArray(B.objects)) { saved = B.objects; B.objects = saved.filter(o => o.id !== hideId); }
      try { origRender.apply(this, arguments); }
      finally { if (saved) B.objects = saved; }
      if (!isScreen) return;
      c.save();
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      try {
        if (livePen && livePen.points.length) renderObject(c, livePen, camv);
        if (liveText && liveText.content) renderObject(c, textObj(liveText), camv);
      } catch (e) {}
      c.restore();
    };

    /* ── справочные материалы учителя ──
       Панель повторяет учительскую: открыта/свёрнута, вкладка, размер,
       картинки, текст, заметки. Ученик может сам открыть её кнопкой в углу
       или свернуть — это остаётся у него, пока учитель сам не откроет или не
       свернёт свою: тогда снова как у учителя */
    let refLocal = null;            // null — как у учителя, иначе открыта ли у ученика
    let refTeacherOpen = null;
    const refTextareaEl = document.getElementById('bdRefTextarea');
    if (refTextareaEl) { refTextareaEl.readOnly = true; refTextareaEl.placeholder = ''; }
    function refRefresh() {
      if (B !== VB || typeof applyRefPanel !== 'function') return;
      try {
        applyRefPanel();
        if (rfVisible()) {
          const r = refDrawHost.getBoundingClientRect();
          // холст заметок пересоздаём, только если поменялся размер:
          // иначе он мигал бы на каждой правке учителя
          if (Math.round(r.width) !== rfCssW || Math.round(r.height) !== rfCssH) rfResizeCanvas();
          rfScheduleRedraw();
        }
      } catch (e) {}
    }
    function applyRef(ref) {
      if (!ref) return;
      const open = !!ref.open;
      if (refLocal !== null && refTeacherOpen !== null && open !== refTeacherOpen) refLocal = null;
      refTeacherOpen = open;
      VB.refPanel = {
        open: refLocal !== null ? refLocal : open,
        mode: ref.mode === 'text' ? 'text' : 'image', textMode: ref.textMode === 'draw' ? 'draw' : 'type',
        text: ref.text || '', w: ref.w || null, h: ref.h || null,
        imageObjects: (ref.imageObjects || []).map(fat), drawObjects: (ref.drawObjects || []).map(fat),
      };
      if (ref.cam && typeof rfCam !== 'undefined') { rfCam.x = ref.cam.x; rfCam.y = ref.cam.y; rfCam.zoom = ref.cam.zoom || 1; }
      refRefresh();
    }
    // свои обработчики кнопок движка (он сохранял бы доску) — перехватываем
    // нажатие раньше них
    window.addEventListener('click', (e) => {
      const t = e.target && e.target.closest && e.target.closest('#bdRefToggle, #bdRefClose');
      if (!t) return;
      e.stopImmediatePropagation(); e.preventDefault();
      if (B !== VB) return;
      refLocal = t.id === 'bdRefClose' ? false : !VB.refPanel.open;
      VB.refPanel.open = refLocal;
      refRefresh();
    }, true);
    function refObjects() { return VB.refPanel ? [].concat(VB.refPanel.imageObjects || [], VB.refPanel.drawObjects || []) : []; }

    // ── сборка доски ──
    const VB = {
      id: '__teacher', name: 'Доска учителя', objects: [], imageLib: [],
      cellSize: 24, sheetCols: 76, sheetRows: 54, pageOrder: 'h', gridColor: null, showPageNumbers: false,
      recentColors: [], colorUsage: {}, refPanel: defaultRefPanel(),
    };
    let curSync = 0, curVer = 0, complete = false;
    let assembling = null;          // { sync, bid, n, z, got: [], count, settings, size, lastAt, needAt }
    let unpacking = 0;              // рассылка, которая сейчас распаковывается
    let pendingDiffs = [];
    const imgStore = new Map();     // ключ → data:URL
    const imgParts = new Map();     // ключ → { n, got: [] }
    const needAsked = new Map();    // ключ → когда просили (перезапрос через 6 с)
    let view = null;

    function applySettings(s) {
      if (!s) return;
      ['cellSize', 'sheetCols', 'sheetRows', 'pageOrder', 'gridColor', 'showPageNumbers'].forEach((k) => {
        if (s[k] !== undefined) VB[k] = s[k];
      });
      if (s.name) { VB.name = s.name; document.title = s.name + ' — доска учителя'; }
    }
    function fat(o) {
      // картинка: есть — ставим, нет — пустая (не рисуется), просим у учителя
      if (o.srcKey) o.src = imgStore.get(o.srcKey) || '';
      return o;
    }
    function askImages() {
      const now = Date.now(), keys = [];
      VB.objects.concat(refObjects()).forEach((o) => {
        if (!o.srcKey || imgStore.has(o.srcKey)) return;
        const at = needAsked.get(o.srcKey) || 0;
        if (now - at < 6000) return;
        needAsked.set(o.srcKey, now);
        keys.push(o.srcKey);
      });
      if (keys.length) TS.broadcastEvent('bd_need', { keys: keys.slice(0, 50) });
    }
    function applyView() {
      if (!view || !boardActive) return;
      window.applyBoardInset();
      // на сцене — сдвиг на панель (см. выше); ученику в обычном режиме
      // окно своё, там доска просто с той же точки, что у учителя
      const shift = inStage ? (view.inset || 0) / (view.zoom || 1) : 0;
      cam.x = view.x - shift; cam.y = view.y; cam.zoom = view.zoom;
      scheduleRedraw();
    }
    function openViewerBoard() {
      B = VB;
      screenList.style.display = 'none';
      screenBoard.style.display = 'block';
      boardActive = true;
      resizeCanvas();
      applyView();
      scheduleRedraw();
    }
    let helloAt = 0;
    function hello() { helloAt = Date.now(); TS.broadcastEvent('bd_hello', { v: PROTO, gz: CAN_GUNZIP }); }

    // сколько доски уже пришло — ученик видит, что загрузка идёт, а не висит
    function showProgress() {
      if (complete) return;
      const a = assembling;
      if (!a || a.n < 2) { showWait('Загружаем доску учителя…'); return; }
      showWait('Загружаем доску учителя… ' + Math.floor(a.count / a.n * 100) + ' %');
    }
    function setOn(on) { document.documentElement.classList.toggle('bd-viewer-on', !!on); }

    TS.onEvent('bd_meta', (m) => {
      if (!m) return;
      if (!m.bid) {
        complete = false; assembling = null; unpacking = 0; livePen = null; applyShape(null); liveText = null;
        boardActive = false;
        setOn(false);
        showWait('Учитель выбирает доску…');
        releaseReady();
        return;
      }
      // ту же рассылку уже собираем или собрали («шапку» прислали ещё раз
      // для другого ученика) — ничего не начинаем заново
      if (assembling && assembling.sync === m.sync) return;
      if ((complete && curSync === m.sync) || unpacking === m.sync) return;
      if (typeof m.n !== 'number') return;   // учитель со старой страницей — дождёмся новой
      if (m.z && !CAN_GUNZIP) { hello(); return; }   // попросим несжатую (hello скажет gz:false)
      const now = Date.now();
      assembling = { sync: m.sync, bid: m.bid, n: m.n, z: m.z, got: new Array(m.n), count: 0, settings: m.settings,
                     size: m.size, lastAt: now, needAt: now };
      // правки этой же рассылки могли прийти раньше «шапки» — их оставляем
      pendingDiffs = pendingDiffs.filter(d => d.sync === m.sync);
      showProgress();
    });
    TS.onEvent('bd_chunk', (p) => {
      const a = assembling;
      if (!p || !a || p.sync !== a.sync || typeof p.i !== 'number' || p.i < 0 || p.i >= a.n || a.got[p.i] != null) return;
      a.got[p.i] = p.d || '';
      a.count++;
      a.lastAt = Date.now();
      if (a.count < a.n) { showProgress(); return; }
      assembling = null;
      finishBoard(a);
    });
    async function finishBoard(a) {
      unpacking = a.sync;
      let data;
      try {
        const text = a.got.join('');
        data = JSON.parse(a.z ? await b64ToText(text) : text);
      } catch (e) {
        // часть пришла битой — просим доску заново
        console.warn('[board-stage] доска учителя не распаковалась:', e);
        if (unpacking === a.sync) { unpacking = 0; hello(); }
        return;
      }
      // пока распаковывали, учитель ушёл к списку досок
      if (unpacking !== a.sync) return;
      unpacking = 0;
      applySettings(a.settings);
      VB.objects = (data.objs || []).map(fat);
      curSync = a.sync; curVer = 0; complete = true;
      livePen = null; applyShape(null); liveText = null;
      openViewerBoard();
      setOn(true);
      applyRef(data.ref);
      hideWait();
      pendingDiffs.filter(d => d.sync === curSync).sort((x, y) => x.ver - y.ver).forEach(applyDiff);
      pendingDiffs = [];
      askImages();
      releaseReady();
    }
    function applyDiff(d) {
      if (d.ver <= curVer) return;
      if (d.ver !== curVer + 1) { complete = false; hello(); return; }   // пропустили правку
      curVer = d.ver;
      if (d.settings) applySettings(d.settings);
      const del = new Set(d.del || []);
      const byId = new Map();
      VB.objects.forEach((o) => { if (!del.has(o.id)) byId.set(o.id, o); });
      const order = VB.objects.filter(o => !del.has(o.id)).map(o => o.id);
      (d.upd || []).forEach((o) => {
        if (!byId.has(o.id)) order.push(o.id);
        byId.set(o.id, fat(o));
      });
      const ids = Array.isArray(d.order) ? d.order : order;
      VB.objects = ids.map(id => byId.get(id)).filter(Boolean);
      if (d.ref) applyRef(d.ref);
      // штрих, который только что дорисовали, пришёл объектом — живой больше не нужен
      if (livePen && byId.has(livePen.id)) livePen = null;
      // подтверждённый текст пришёл правкой — поле учителя уже закрыто
      // (придёт и text: null), но не держим двойника до следующего живого
      askImages();
      scheduleRedraw();
    }
    TS.onEvent('bd_diff', (d) => {
      if (!d) return;
      if ((assembling && d.sync === assembling.sync) || unpacking === d.sync) { pendingDiffs.push(d); return; }
      if (!complete || d.sync !== curSync) { if (!assembling && !unpacking) hello(); return; }
      applyDiff(d);
    });
    TS.onEvent('bd_view', (v) => {
      if (!v) return;
      view = v;
      applyView();
    });
    TS.onEvent('bd_live', (l) => {
      if (!l || !complete || l.sync !== curSync) return;
      if (l.pen === null) {
        // перо поднято: доигрываем то, что осталось в очереди, штрих заменит
        // объект из правки (applyDiff убирает живой, когда он пришёл)
        if (livePen && livePen.queue.length) { livePen.points.push.apply(livePen.points, livePen.queue.map(x => x.p)); livePen.queue = []; }
      } else if (l.pen) {
        if (!livePen || livePen.id !== l.pen.id) {
          if (l.pen.from !== 0) return;   // начало штриха не дошло — дождёмся итога
          livePen = { id: l.pen.id, type: 'pen', color: l.pen.color, width: l.pen.width, dash: l.pen.dash, opacity: l.pen.opacity,
                      points: [], queue: [], got: 0, base: performance.now() };
        }
        if (l.pen.from === livePen.got) {
          const pts = l.pen.pts || [], ts = l.pen.ts || [];
          pts.forEach((p, i) => livePen.queue.push({ p: p, t: typeof ts[i] === 'number' ? ts[i] : 0 }));
          livePen.got += pts.length;
          if (ts.length) learnLateness(ts[ts.length - 1]);
          kickPen();
        }
      }
      if ('shape' in l) applyShape(l.shape);
      if ('text' in l) liveText = l.text || null;
      if (Array.isArray(l.objs)) {
        l.objs.forEach((o) => {
          const i = VB.objects.findIndex(x => x.id === o.id);
          if (i >= 0) VB.objects[i] = fat(o);
        });
      }
      scheduleRedraw();
    });
    TS.onEvent('bd_img', (p) => {
      if (!p || !p.key || imgStore.has(p.key)) return;
      let rec = imgParts.get(p.key);
      if (!rec || rec.n !== p.n) { rec = { n: p.n, got: new Array(p.n), count: 0 }; imgParts.set(p.key, rec); }
      if (rec.got[p.i] != null) return;
      rec.got[p.i] = p.data || '';
      rec.count++;
      if (rec.count < rec.n) return;
      imgParts.delete(p.key);
      const src = rec.got.join('');
      imgStore.set(p.key, src);
      let inRef = false;
      VB.objects.forEach((o) => { if (o.srcKey === p.key) o.src = src; });
      refObjects().forEach((o) => { if (o.srcKey === p.key) { o.src = src; inRef = true; } });
      scheduleRedraw();
      if (inRef) refRefresh();
    });

    /* Просим доску, пока не соберём.
       - Доски нет и она не едет — «пришли доску» раз в 2,5 с.
       - Доска едет, но части перестали приходить на 2,5 с, а каких-то нет
         (потерялись, или ученик пришёл посреди рассылки) — просим только
         недостающие, по номерам. Раньше здесь через 6 с выбрасывалось всё
         собранное и просилась вся доска заново — на медленной сети учителя
         это и не давало ей догрузиться никогда.
       - Совсем тихо 25 с (учитель перезагрузил страницу и забыл рассылку) —
         тогда уже всю заново */
    setInterval(() => {
      if (!TS.getCode || !TS.getCode()) return;
      const now = Date.now();
      const a = assembling;
      if (a) {
        if (now - a.lastAt > 25000 && now - a.needAt > 2500) { assembling = null; hello(); return; }
        if (now - a.lastAt > 2500 && now - a.needAt > 2500) {
          const idx = [];
          for (let i = 0; i < a.n && idx.length < 40; i++) if (a.got[i] == null) idx.push(i);
          a.needAt = now;
          if (idx.length) TS.broadcastEvent('bd_need_chunks', { sync: a.sync, idx: idx });
        }
      } else if (!complete && !unpacking && now - helloAt > 2500) hello();
      if (complete) askImages();
    }, 700);
    // связь восстановилась — всё, что пришло за время обрыва, могло потеряться.
    // Доску, которую собирали, не бросаем: сразу спрашиваем недостающие части
    let wasOnline = true;
    setInterval(() => {
      const on = !TS.getConnState || TS.getConnState() === 'online';
      if (on && !wasOnline) {
        if (assembling) { assembling.lastAt = 0; assembling.needAt = 0; }
        else hello();
      }
      wasOnline = on;
    }, 1000);

    // для тестов и отладки: сколько точек живого штриха учителя сейчас на экране
    window.__bdView = {
      livePts: () => (livePen ? livePen.points.length : 0),
      liveQueued: () => (livePen ? livePen.queue.length : 0),
      playout: () => playout,
      liveShape: () => liveShape, liveText: () => liveText,
      progress: () => (assembling ? { n: assembling.n, count: assembling.count, z: assembling.z } : null),
      ref: () => VB.refPanel,
    };

    TS.init({ trainer: 'boards', getState: () => ({}), applyState: () => {} });
    showWait('Подключаемся…');
  }

  if (VIEWER) viewer(); else teacher();
})();
