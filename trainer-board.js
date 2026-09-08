/* ═══════════════════════════════════════════════════════════════════════
   trainer-board.js — общая интерактивная доска для ВСЕХ тренажёров.

   Промпт №32: раньше этот модуль лежал отдельной копией внутри каждого
   файла тренажёра. Копии разошлись: в oge8/oge12/powers жила новая версия —
   с трансляцией штрихов собеседнику и синхронным перемещением, — а в
   остальных восемнадцати оставалась старая, где доска была чисто локальной
   и совместная работа на ней не работала вовсе. Теперь реализация одна на
   всю платформу: правка делается один раз и попадает во все тренажёры.

   Модуль самодостаточен: снаружи ему нужны только стандартные элементы
   доски (#boardCanvas, #boardCanvasBg, тулбар, кнопки масштаба) — они
   одинаковы во всех тренажёрах, — а наружу он отдаёт мосты window.__board*
   (см. конец файла), через которые тренажёр включает доску в общую
   синхронизацию состояния.

   Подключать ПОСЛЕ session-share.js: при разборе файла модуль сразу берёт
   window.TrainerSession.
   ═══════════════════════════════════════════════════════════════════════ */

/* ═══════════════ интерактивная доска на фоне ═══════════════ */
(function(){
  // Промпт №19: живая посимвольная (пожалуй, точнее — «по точкам») трансляция
  // рисования на доске поверх тренажёра собеседнику в совместной сессии.
  // Лёгкие события о том, что рисуется ПРЯМО СЕЙЧАС, идут через отдельный
  // «эфемерный» канал (TS.broadcastEvent/onEvent) — они не сохраняются и не
  // входят в getState; а уже готовый, законченный штрих попадает в обычный
  // getState()/applyState() тренажёра (см. tsGetState/tsApplyState выше) —
  // так он переживёт перезагрузку страницы и достаётся тем, кто подключится позже.
  const TS = window.TrainerSession || { onEvent(){}, broadcastEvent(){}, push(){} };

  // Промпт №23: отдельная кнопка учителя, полностью отключающая ученику доступ
  // к рисованию на доске (независимо от остальных пяти прав) — permissions.board
  const boardVisBtn = document.getElementById('boardVisibilityToggle');
  function boardAccessAllowed(){
    if (!TS.isLeader || TS.isLeader()) return true; // учителя это ограничение никогда не касается
    const perms = TS.getPermissions ? TS.getPermissions() : null;
    return !perms || perms.board !== false;
  }
  function applyBoardAccessToUI(){
    const allowed = boardAccessAllowed();
    if (boardVisBtn) {
      boardVisBtn.disabled = !allowed;
      boardVisBtn.style.opacity = allowed ? '' : '.4';
      boardVisBtn.style.cursor = allowed ? '' : 'not-allowed';
      if (!allowed) boardVisBtn.title = 'Учитель отключил доступ к доске';
    }
    if (!allowed && document.documentElement.getAttribute('data-board') === 'on') {
      document.documentElement.setAttribute('data-board', 'off');
      if (boardVisBtn) { boardVisBtn.classList.remove('active'); boardVisBtn.title = 'Учитель отключил доступ к доске'; }
    }
  }
  window.__boardAccessAllowed = boardAccessAllowed;
  if (TS.onPermissionsChange) TS.onPermissionsChange(applyBoardAccessToUI);
  applyBoardAccessToUI();

  // Промпт №23: мост для lesson-history.js — доступ к «чернильным» (без сетки/фона)
  // слоям обоих холстов доски и к их текущему прямоугольнику на экране (viewport,
  // те же координаты, что и getBoundingClientRect() у любого DOM-узла страницы),
  // чтобы можно было аккуратно наложить обрезанный фрагмент поверх снимка задания
  window.__boardCanvasEl = function () {
    return {
      sheet: { inkCanvas: inkCanvas, rect: () => canvas.getBoundingClientRect() },
      bg: { inkCanvas: inkCanvasBg, rect: () => canvasBg.getBoundingClientRect() },
    };
  };

  const canvas = document.getElementById('boardCanvas');
  const ctx = canvas.getContext('2d');
  // отдельный оффскрин-слой только для чернил: ластик (destination-out) стирает
  // содержимое ТОЛЬКО этого слоя, а сетка рисуется отдельно на основном холсте
  // и затем чернила накладываются сверху обычным source-over — так ластик
  // больше не «прогрызает» дыры в клетчатой сетке
  const inkCanvas = document.createElement('canvas');
  const inkCtx = inkCanvas.getContext('2d');

  // второй, независимый холст — «фон»: лежит на всю страницу НИЖЕ обычного
  // контента (z-index:-1 в CSS), поэтому карточки задания перекрывают его
  // собой, а свободное место вокруг них доступно для рисования
  const canvasBg = document.getElementById('boardCanvasBg');
  const ctxBg = canvasBg.getContext('2d');
  const inkCanvasBg = document.createElement('canvas');
  const inkCtxBg = inkCanvasBg.getContext('2d');

  const toolbar = document.getElementById('boardToolbar');
  const zoomResetBtn = document.getElementById('zoomResetBtn');

  // ═══ модель данных: штрихи хранятся в «мировых» координатах (=координаты
  // документа, как обычный page-scroll), а не в пикселях экрана. Холст же —
  // это просто окно viewport-размера, которое на каждый кадр перерисовывает
  // видимый кусок этого мира с учётом прокрутки страницы, панорамирования
  // и масштаба. Так рисунок всегда остаётся «приклеен» к странице, а зум
  // по-настоящему приближает/отдаляет содержимое, а не просто холст. ═══

  let tool = 'pen';          // 'pen' | 'eraser' | 'line' | 'hand'
  let penWidth = 2;          // тонкая по умолчанию
  let penColor = '#000000';  // чёрный по умолчанию
  let eraserSize = 26;       // средний ластик по умолчанию
  let dpr = Math.max(1, window.devicePixelRatio || 1);

  let strokes = [];          // завершённые штрихи: {tool,color,width,points:[{x,y}...]}
  // ═══ Промпт №32: доска — общая, поэтому её снимок СЛИВАЕТСЯ, а не заменяется ═══
  // Раньше входящий снимок просто присваивал strokes целиком. При двух
  // участниках это означало гонку: пока твой свежий штрих летит собеседнику,
  // от него приходит его снимок — снятый ДО твоего штриха — и затирает его.
  // Внешне это выглядело как «пишу, а записи не появляются / пропадают».
  // Теперь у каждого законченного штриха есть свой идентификатор, снимок
  // сливается по этим идентификаторам, а удаления (очистка, отмена, стирание
  // области) передаются явно — списком удалённых и счётчиком полной очистки.
  let boardClearSeq = 0;         // сколько раз доску очищали целиком
  const removedSids = new Set(); // «надгробия»: штрихи, удалённые осознанно
  const REMOVED_LIMIT = 800;
  function rememberRemoved(list){
    list.forEach(st => { if (st && st.sid) removedSids.add(st.sid); });
    while (removedSids.size > REMOVED_LIMIT) removedSids.delete(removedSids.values().next().value);
  }
  function diffRemoved(before, after){
    const keep = new Set(after.map(st => st && st.sid).filter(Boolean));
    rememberRemoved(before.filter(st => st && st.sid && !keep.has(st.sid)));
  }
  let currentStroke = null;  // штрих, который рисуется прямо сейчас (для живого превью)
  let currentStrokeSid = null; // id текущего штриха — чтобы собеседник мог отличать несколько одновременных линий
  const remoteStrokes = new Map(); // sid -> штрих собеседника, который он рисует прямо сейчас (ещё не завершён)
  const UNDO_LIMIT = 60;
  const undoStack = [];      // снимки массива strokes (лёгкие — это просто точки, не пиксели)

  // ── масштаб и панорамирование (в локальных пикселях листа) ──
  let viewScale = 1, panX = 0, panY = 0;
  const ZOOM_MIN = 0.5, ZOOM_MAX = 3, ZOOM_STEP = 1.2;

  // ── доска пишет строго поверх «тетрадного листа» примера (.sheet), а не
  // поверх всей страницы: холст каждый кадр подгоняется под текущий
  // getBoundingClientRect() этого листа, поэтому локальные координаты —
  // это просто пиксели внутри листа, без поправки на прокрутку страницы ──
  let boardTarget = null;
  function resolveBoardTarget(){
    // первая рабочая зона доски — всегда именно тетрадный лист примера (.sheet),
    // независимо от режима фокуса; вторая зона (фон) обслуживается отдельным
    // холстом ниже и в этот выбор не входит
    const sheets = [...document.querySelectorAll('.sheet')];
    for (const el of sheets) if (el.offsetParent !== null) return el;
    const fallbacks = [document.getElementById('workZone'), document.getElementById('taskArea'), document.querySelector('.panel')];
    for (const el of fallbacks) if (el && el.offsetParent !== null) return el;
    return null;
  }

  function worldToScreenTransform(){
    const s = viewScale * dpr;
    return [s, 0, 0, s, -panX * s, -panY * s];
  }
  // Промпт №31: координаты округляем до десятых. Визуально это ничего не
  // меняет (десятая доля пикселя), а в снимке состояния точка вместо
  // «123.45678901234567» занимает «123.5» — вес доски (и в рассылке, и в
  // сохраняемом снимке) падает в несколько раз.
  const rnd1 = (v) => Math.round(v * 10) / 10;
  function screenToWorld(clientX, clientY){
    const rect = canvas.getBoundingClientRect();
    return {
      x: rnd1((clientX - rect.left) / viewScale + panX),
      y: rnd1((clientY - rect.top) / viewScale + panY),
    };
  }

  function resizeCanvas(){
    dpr = Math.max(1, window.devicePixelRatio || 1);
    syncBoardTarget();
    redraw();
  }

  // ── синхронизирует размер/положение холста с текущим прямоугольником
  // листа; вызывается каждый кадр — так холст сам следует за ресайзом окна и
  // ростом листа (например, когда в столбик дописывается новая строка).
  // Промпт №26: саму прокрутку страницы теперь отрабатывает браузер сам —
  // холст position:absolute и координаты ниже переведены в систему ДОКУМЕНТА
  // (+ window.scrollX/scrollY), а не вьюпорта, поэтому при обычном скролле
  // left/top ниже не меняются вообще и лишний раз не перезаписываются.
  let lastSyncLeft = null, lastSyncTop = null, lastSyncW = null, lastSyncH = null;
  function syncBoardTarget(){
    const el = resolveBoardTarget();
    boardTarget = el;
    if (!el) { canvas.style.display = 'none'; lastSyncLeft = lastSyncTop = lastSyncW = lastSyncH = null; return false; }
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) { canvas.style.display = 'none'; lastSyncLeft = lastSyncTop = lastSyncW = lastSyncH = null; return false; }
    canvas.style.display = '';
    const docLeft = Math.round(rect.left + window.scrollX);
    const docTop = Math.round(rect.top + window.scrollY);
    const w = Math.round(rect.width), h = Math.round(rect.height);
    // пишем в style только когда что-то реально изменилось — раньше эти
    // присваивания шли на КАЖДЫЙ кадр безусловно, даже когда лист стоял на
    // месте, что зря гоняло стили/layout параллельно со скроллом страницы
    if (docLeft !== lastSyncLeft || docTop !== lastSyncTop) {
      canvas.style.left = docLeft + 'px';
      canvas.style.top = docTop + 'px';
      lastSyncLeft = docLeft; lastSyncTop = docTop;
    }
    if (w !== lastSyncW || h !== lastSyncH) {
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      lastSyncW = w; lastSyncH = h;
    }
    const pw = Math.round(w * dpr), ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      inkCanvas.width = pw;
      inkCanvas.height = ph;
    }
    return true;
  }

  function drawStroke(targetCtx, s){
    if (!s || s.points.length === 0) return;
    targetCtx.save();
    targetCtx.globalCompositeOperation = (s.tool === 'eraser') ? 'destination-out' : 'source-over';
    targetCtx.strokeStyle = s.color || '#000';
    targetCtx.lineWidth = s.width;
    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';
    const pts = s.points;
    targetCtx.beginPath();
    if (pts.length === 1) {
      // одиночная точка — рисуем короткий отрезок «на месте»
      const p = pts[0];
      targetCtx.moveTo(p.x, p.y);
      targetCtx.lineTo(p.x + 0.01, p.y + 0.01);
    } else if (pts.length === 2) {
      // ровно 2 точки — это либо инструмент «линия» (должна остаться идеально
      // прямой), либо очень короткий росчерк, где сглаживать нечего
      targetCtx.moveTo(pts[0].x, pts[0].y);
      targetCtx.lineTo(pts[1].x, pts[1].y);
    } else {
      // сглаживание через квадратичные кривые по серединам отрезков —
      // стандартный приём для рисования от руки: убирает «углы» на изломах,
      // не требуя менять сами записанные точки
      targetCtx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const midX = (pts[i].x + pts[i + 1].x) / 2;
        const midY = (pts[i].y + pts[i + 1].y) / 2;
        targetCtx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
      }
      const last = pts[pts.length - 1];
      const prev = pts[pts.length - 2];
      targetCtx.quadraticCurveTo(prev.x, prev.y, last.x, last.y);
    }
    targetCtx.stroke();
    targetCtx.restore();
  }

  let redrawScheduled = false;

  function redraw(){
    if (redrawScheduled) return;
    redrawScheduled = true;
    requestAnimationFrame(()=>{
      redrawScheduled = false;
      // Промпт №22: раньше здесь стояло "if (!boardTarget) return;" — если ровно
      // в момент срабатывания отложенного (через rAF) перерисовывания boardTarget
      // оказывался временно null (лист/рабочая зона на миг пропадали из DOM —
      // например, между переключением экранов), вся перерисовка целиком
      // пропускалась, включая ctx.clearRect() основного видимого холста. Экран
      // застревал на СТАРОМ кадре до следующего "удачного" вызова — из-за этого
      // только что дорисованный штрих мог не появиться (штрих уже есть в массиве
      // strokes и корректно уходит собеседнику через push(), а вот отрисовка
      // именно на своём экране откладывалась на неопределённый срок), а нажатие
      // "Стереть всё" могло точно так же не долететь до экрана — данные уже
      // очищены (strokes = []), но кадр на экране всё ещё старый. Сама
      // перерисовка не использует boardTarget напрямую (только viewScale/pan/dpr),
      // так что убираем этот ранний выход — теперь редрав всегда честно
      // синхронизирует то, что нарисовано на холсте, с текущим состоянием strokes.
      const m = worldToScreenTransform();

      // чернила рисуются на отдельном слое (чтобы ластик стирал только их),
      // а затем накладываются на основной холст обычным source-over —
      // свою сетку холст больше не рисует: клетка — это фон самого .sheet,
      // доска лишь пишет поверх него прозрачным слоем
      inkCtx.save();
      inkCtx.setTransform(1, 0, 0, 1, 0, 0);
      inkCtx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
      inkCtx.restore();
      inkCtx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
      for (const s of strokes) drawStroke(inkCtx, s);
      if (currentStroke) drawStroke(inkCtx, currentStroke);
      remoteStrokes.forEach(s => drawStroke(inkCtx, s));

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      ctx.drawImage(inkCanvas, 0, 0);
    });
  }

  function pushUndo(surface){
    undoStack.push({ surface, data: (surface === 'bg' ? bgStrokes : strokes).slice() });
    if (undoStack.length > UNDO_LIMIT) undoStack.shift();
  }
  function undo(){
    // общий стек на обе поверхности: Ctrl+Z отменяет последнее действие,
    // где бы оно ни произошло — на листе или на фоне
    if (undoStack.length === 0) return;
    const entry = undoStack.pop();
    if (entry.surface === 'bg') { diffRemoved(bgStrokes, entry.data); bgStrokes = entry.data; redrawBg(); }
    else { diffRemoved(strokes, entry.data); strokes = entry.data; redraw(); }
    TS.push(); // отмена — структурное изменение, рассылаем и сохраняем как обычно
  }
  // Промпт №23: точечная очистка заметок «листа» строго в границах экранного
  // прямоугольника (используется при смене/обновлении задания — чистит только
  // штрихи над ЗАМЕНЯЕМЫМ заданием, не трогая соседние карточки на той же
  // странице). Штрих считается «принадлежащим» области, если его геометрический
  // центр (среднее всех точек) попадает внутрь неё — простой и предсказуемый
  // критерий. Фоновый (общий, на всю страницу) слой сюда не входит — он общее рабочее
  // пространство поверх всей страницы, а не привязан к конкретному заданию.
  function clearBoardInScreenRect(rect){
    if (!rect || rect.width <= 0 || rect.height <= 0) return false;
    const p1 = screenToWorld(rect.left, rect.top);
    const p2 = screenToWorld(rect.left + rect.width, rect.top + rect.height);
    const x1 = Math.min(p1.x, p2.x), x2 = Math.max(p1.x, p2.x);
    const y1 = Math.min(p1.y, p2.y), y2 = Math.max(p1.y, p2.y);
    const inRect = (s) => {
      if (!s.points || !s.points.length) return false;
      let sx = 0, sy = 0;
      for (const p of s.points) { sx += p.x; sy += p.y; }
      const cx = sx / s.points.length, cy = sy / s.points.length;
      return cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2;
    };
    if (!strokes.some(inRect)) return false; // нечего чистить — не трогаем стек отмен
    pushUndo('sheet');
    rememberRemoved(strokes.filter(inRect));  // Промпт №32 — удаление должно доехать до собеседника
    strokes = strokes.filter(s => !inRect(s));
    redraw();
    TS.push();
    return true;
  }
  window.__boardClearInScreenRect = clearBoardInScreenRect;

  function clearBoard(){
    pushUndo('sheet');
    rememberRemoved(strokes);
    strokes = [];
    pushUndo('bg');
    rememberRemoved(bgStrokes);
    bgStrokes = [];
    boardClearSeq++;
    // Промпт №22: "Стереть всё" должно чистить ВООБЩЕ всё, включая то, что
    // технически не входит в strokes/bgStrokes — незавершённый штрих (свой,
    // если что-то помешало штатному pointerup/pointercancel завершить его —
    // см. комментарий у setPointerCapture) и незавершённые штрихи собеседника,
    // которые ещё рисуются "вживую" и не долетели финальным событием 'end'
    currentStroke = null; currentStrokeSid = null;
    bgCurrentStroke = null; bgCurrentStrokeSid = null;
    remoteStrokes.clear();
    bgRemoteStrokes.clear();
    redraw();
    redrawBg();
    TS.push();
  }

  // ── если перед началом рисования фокус оставался в текстовом поле (например,
  // пользователь только что напечатал ответ и, не кликнув мимо, сразу начал
  // писать на доске), это поле продолжает считаться "активным" — и следующее
  // Ctrl+Z/⌘+Z уходит в системную отмену ввода текста, а не в отмену штриха.
  // Снимаем фокус в момент начала взаимодействия с доской, чтобы Ctrl+Z всегда
  // попадал в undo() доски ──
  function blurActiveFormField(){
    const el = document.activeElement;
    if (el && el !== document.body) {
      const tag = (el.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || el.isContentEditable) el.blur();
    }
  }

  // ── панорамирование: средняя ИЛИ правая кнопка мыши, ИЛИ инструмент «рука» + левая кнопка ──
  let panning = false;
  let panStartClientX = 0, panStartClientY = 0, panStartPanX = 0, panStartPanY = 0;

  function startPan(e){
    // Промпт №31: перемещение доски — только у главного (см. 'boardPan')
    if (TS.studentRestricted && TS.studentRestricted('boardPan')) {
      if (TS.flashRestrictedHint) TS.flashRestrictedHint();
      return;
    }
    panning = true;
    try { canvas.setPointerCapture(e.pointerId); } catch(_){}
    panStartClientX = e.clientX; panStartClientY = e.clientY;
    panStartPanX = panX; panStartPanY = panY;
    updateCursor();
  }
  function updateCursor(){
    canvas.style.cursor = panning ? 'grabbing' : (tool === 'hand' ? 'grab' : 'crosshair');
    canvasBg.style.cursor = bgPanning ? 'grabbing' : (tool === 'hand' ? 'grab' : 'crosshair');
  }

  let drawing = false;

  function makeStrokeId(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }

  // ── троттлинг живой трансляции точек: не чаще, чем раз в THROTTLE_MS,
  // копим точки в буфере и шлём их одной пачкой — собеседник всё равно видит
  // линию «живьём», но канал не заваливается сообщением на каждый pixel ──
  const BOARD_THROTTLE_MS = 45;
  function makeLiveSender(surface){
    let pending = []; let replaceLast = false; let timer = null; let sid = null; let lastSentAt = 0;
    function flush(){
      timer = null;
      if (!sid || (pending.length === 0 && !replaceLast)) return;
      TS.broadcastEvent('board_stroke', { surface, sid, phase: 'move', points: pending, replace: replaceLast });
      pending = []; replaceLast = false; lastSentAt = Date.now();
    }
    return {
      start(newSid, stroke){
        sid = newSid; pending = []; replaceLast = false; lastSentAt = 0;
        TS.broadcastEvent('board_stroke', { surface, sid, phase: 'start', tool: stroke.tool, color: stroke.color, width: stroke.width, points: stroke.points.slice() });
      },
      point(p){ pending.push(p); schedule(); },
      replacePoint(p){ pending = [p]; replaceLast = true; schedule(); },
      end(finalPoint){
        clearTimeout(timer); timer = null;
        if (!sid) return;
        TS.broadcastEvent('board_stroke', { surface, sid, phase: 'end', point: finalPoint || null });
        sid = null; pending = []; replaceLast = false;
      },
    };
    function schedule(){
      if (timer) return;
      const wait = Math.max(0, BOARD_THROTTLE_MS - (Date.now() - lastSentAt));
      timer = setTimeout(flush, wait);
    }
  }
  const sheetLiveSender = makeLiveSender('sheet');
  const bgLiveSender = makeLiveSender('bg');

  // ── приём живых точек от собеседника: рисуем их как временный «чужой»
  // штрих (remoteStrokes/bgRemoteStrokes), пока не придёт финальный снимок
  // состояния, который заменит strokes/bgStrokes целиком, — см. tsApplyState ──
  TS.onEvent('board_stroke', (data) => {
    if (!data || !data.sid) return;
    const map = data.surface === 'bg' ? bgRemoteStrokes : remoteStrokes;
    const doRedraw = data.surface === 'bg' ? redrawBg : redraw;
    if (data.phase === 'start') {
      map.set(data.sid, { tool: data.tool, color: data.color, width: data.width, points: (data.points || []).slice() });
    } else if (data.phase === 'move') {
      const s = map.get(data.sid);
      if (!s) return; // старт мог не дойти (переподключение и т.п.) — просто игнорируем хвост
      if (data.replace) { if (s.points.length) s.points[s.points.length - 1] = data.points[0]; else s.points.push(data.points[0]); }
      else (data.points || []).forEach(p => s.points.push(p));
    } else if (data.phase === 'end') {
      const s = map.get(data.sid);
      if (s) {
        if (data.point) s.points.push(data.point);
        s.sid = data.sid;                    // Промпт №32 — чтобы снимок не задвоил этот штрих
        (data.surface === 'bg' ? bgStrokes : strokes).push(s);
      }
      map.delete(data.sid);
    }
    doRedraw();
  });

  // ── у холста нет pointer-events (см. CSS выше), поэтому сам он больше не
  //    получает pointerdown естественным образом — запускаем рисование сами
  //    из document-обработчика ниже, вызывая эту функцию напрямую ──
  function onCanvasPointerDown(e){
    blurActiveFormField();
    if (e.button === 1 || e.button === 2) { startPan(e); e.preventDefault(); return; } // средняя ИЛИ правая кнопка — панорамирование
    if (tool === 'hand') {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      startPan(e); e.preventDefault(); return;
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    drawing = true;
    try { canvas.setPointerCapture(e.pointerId); } catch(_){}
    pushUndo('sheet');
    const p = screenToWorld(e.clientX, e.clientY);
    if (tool === 'line') {
      currentStroke = { tool: 'line', color: penColor, width: penWidth, points: [p, p] };
    } else if (tool === 'eraser') {
      currentStroke = { tool: 'eraser', width: eraserSize, points: [p] };
    } else {
      currentStroke = { tool: 'pen', color: penColor, width: penWidth, points: [p] };
    }
    currentStrokeSid = makeStrokeId();
    sheetLiveSender.start(currentStrokeSid, currentStroke);
    redraw();
    e.preventDefault();
  }

  // ── клики по реальным кнопкам/полям/ручкам растягивания должны работать,
  //    даже когда доска включена — рисуем только там, где под пальцем нет
  //    ничего кликабельного ──
  const BOARD_INTERACTIVE_SEL = 'button, a[href], input, select, textarea, label, [role="button"], [contenteditable="true"], .work-resize-handle';
  function isBoardInteractiveTarget(el){
    return !!(el && el.closest && el.closest(BOARD_INTERACTIVE_SEL));
  }
  function pointInRect(clientX, clientY, rect){
    return !!rect && clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  }
  document.addEventListener('contextmenu', e=>{
    if (document.documentElement.getAttribute('data-board') !== 'on') return;
    if (isBoardInteractiveTarget(e.target)) return;
    if (pointInRect(e.clientX, e.clientY, boardTarget && boardTarget.getBoundingClientRect())) e.preventDefault(); // правая кнопка двигает доску, а не открывает системное меню
  });
  document.addEventListener('pointerdown', e=>{
    if (document.documentElement.getAttribute('data-board') !== 'on') return;
    if (!boardAccessAllowed()) return; // Промпт №23: учитель мог отключить доступ к доске ученику
    if (isBoardInteractiveTarget(e.target)) return; // клик по кнопке/полю/ручке — пропускаем как обычно, не рисуем
    if (!pointInRect(e.clientX, e.clientY, boardTarget && boardTarget.getBoundingClientRect())) return;
    onCanvasPointerDown(e);
  }, true);

  canvas.addEventListener('pointermove', e=>{
    if (panning) {
      panX = panStartPanX - (e.clientX - panStartClientX) / viewScale;
      panY = panStartPanY - (e.clientY - panStartClientY) / viewScale;
      redraw();
      if (window.__boardBroadcastView) window.__boardBroadcastView(); // Промпт №31
      e.preventDefault();
      return;
    }
    if (!drawing || !currentStroke) return;
    if (tool === 'line') {
      const p = screenToWorld(e.clientX, e.clientY);
      currentStroke.points[1] = p; // линия — всегда ровно 2 точки: старт и текущая
      sheetLiveSender.replacePoint(p);
    } else {
      // getCoalescedEvents() восстанавливает промежуточные точки, которые браузер
      // «схлопнул» при быстром движении мыши/пера — это повышает эффективную
      // частоту дискретизации и вместе со сглаживанием в drawStroke() даёт
      // заметно менее угловатую линию
      const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      const list = events.length ? events : [e];
      for (const ev of list) {
        const p = screenToWorld(ev.clientX, ev.clientY);
        currentStroke.points.push(p);
        sheetLiveSender.point(p);
      }
    }
    redraw();
    e.preventDefault();
  });

  function endStroke(e){
    if (panning) {
      panning = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch(_){}
      updateCursor();
      return;
    }
    if (!drawing) return;
    drawing = false;
    if (currentStroke) {
      // на случай, если pointerup пришёл без предшествующего pointermove
      // ровно в этой точке — досчитываем финальную позицию по самому событию
      let finalPoint = null;
      if (typeof e.clientX === 'number') {
        const p = screenToWorld(e.clientX, e.clientY);
        finalPoint = p;
        if (tool === 'line') currentStroke.points[1] = p;
        else currentStroke.points.push(p);
      }
      currentStroke.sid = currentStrokeSid || makeStrokeId();
      strokes.push(currentStroke);
      currentStroke = null;
      sheetLiveSender.end(finalPoint);
      TS.push(); // законченный штрих — сохраняем и рассылаем как обычное структурное состояние
    }
    currentStrokeSid = null;
    try { canvas.releasePointerCapture(e.pointerId); } catch(_){}
    redraw();
  }
  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointercancel', endStroke);
  // Промпт №22 — подстраховка: у canvas стоит pointer-events:none, и рисование
  // держится на setPointerCapture(), перенаправляющем последующие pointer-события
  // именно на canvas. Если это перенаправление по какой-то причине не сработало
  // (redraw()/re-layout ровно в момент pointerdown, отклонённый браузером запрос
  // capture и т.п.) — pointerup/pointercancel на canvas просто не придёт, а
  // currentStroke так и останется "незавершённым" навсегда: будет рисоваться как
  // живой штрих бесконечно и переживёт даже "Стереть всё" (см. clearBoard()).
  // Этот же pointerup в любом случае всплывает и до document — ловим его тут как
  // запасной путь; endStroke()/endBgStroke() сами по себе идемпотентны (ранний
  // выход по !drawing/!bgDrawing), так что двойной вызов на обычном пути ничего
  // не портит.
  document.addEventListener('pointerup', (e)=>{ if (drawing) endStroke(e); if (bgDrawing) endBgStroke(e); });
  document.addEventListener('pointercancel', (e)=>{ if (drawing) endStroke(e); if (bgDrawing) endBgStroke(e); });

  /* ─────────────── вторая зона доски: фон (вся страница) ───────────────
     координаты «мировые» — как обычная прокрутка страницы, — поэтому
     рисунок остаётся «приклеен» к странице при скролле; здесь же живут
     полноценные панорамирование и масштаб (кнопки +/− в тулбаре) */

  let bgStrokes = [];
  let bgCurrentStroke = null;
  let bgCurrentStrokeSid = null;
  const bgRemoteStrokes = new Map(); // sid -> штрих собеседника на фоновом холсте, ещё не завершённый
  let bgViewScale = 1, bgPanX = 0, bgPanY = 0;
  const BG_GRID = 24; // px — совпадает с шагом клетки основного дизайна (--grid)

  function bgWorldToScreenTransform(){
    const s = bgViewScale * dpr;
    return [s, 0, 0, s, -(bgPanX + window.scrollX) * s, -(bgPanY + window.scrollY) * s];
  }
  function bgScreenToWorld(clientX, clientY){
    // округление — см. комментарий у screenToWorld выше
    return {
      x: Math.round((clientX / bgViewScale + bgPanX + window.scrollX) * 10) / 10,
      y: Math.round((clientY / bgViewScale + bgPanY + window.scrollY) * 10) / 10,
    };
  }

  function resizeBgCanvas(){
    dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = window.innerWidth, h = window.innerHeight;
    canvasBg.style.width = w + 'px';
    canvasBg.style.height = h + 'px';
    const pw = Math.round(w * dpr), ph = Math.round(h * dpr);
    if (canvasBg.width !== pw || canvasBg.height !== ph) {
      canvasBg.width = pw;
      canvasBg.height = ph;
      inkCanvasBg.width = pw;
      inkCanvasBg.height = ph;
    }
    redrawBg();
  }

  function drawBgGrid(){
    const topLeft = bgScreenToWorld(0, 0);
    const bottomRight = bgScreenToWorld(window.innerWidth, window.innerHeight);
    const gridColor = (getComputedStyle(document.documentElement).getPropertyValue('--grid') || '#dfe6f3').trim() || '#dfe6f3';
    const startX = Math.floor(topLeft.x / BG_GRID) * BG_GRID;
    const startY = Math.floor(topLeft.y / BG_GRID) * BG_GRID;
    ctxBg.strokeStyle = gridColor;
    ctxBg.lineWidth = 1 / bgViewScale;
    ctxBg.beginPath();
    for (let x = startX; x <= bottomRight.x; x += BG_GRID) { ctxBg.moveTo(x, topLeft.y); ctxBg.lineTo(x, bottomRight.y); }
    for (let y = startY; y <= bottomRight.y; y += BG_GRID) { ctxBg.moveTo(topLeft.x, y); ctxBg.lineTo(bottomRight.x, y); }
    ctxBg.stroke();
  }

  let bgRedrawScheduled = false;
  function redrawBg(){
    if (bgRedrawScheduled) return;
    bgRedrawScheduled = true;
    requestAnimationFrame(()=>{
      bgRedrawScheduled = false;
      const m = bgWorldToScreenTransform();

      inkCtxBg.save();
      inkCtxBg.setTransform(1, 0, 0, 1, 0, 0);
      inkCtxBg.clearRect(0, 0, inkCanvasBg.width, inkCanvasBg.height);
      inkCtxBg.restore();
      inkCtxBg.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
      for (const s of bgStrokes) drawStroke(inkCtxBg, s);
      if (bgCurrentStroke) drawStroke(inkCtxBg, bgCurrentStroke);
      bgRemoteStrokes.forEach(s => drawStroke(inkCtxBg, s));

      ctxBg.setTransform(1, 0, 0, 1, 0, 0);
      ctxBg.clearRect(0, 0, canvasBg.width, canvasBg.height);
      ctxBg.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
      drawBgGrid();
      ctxBg.setTransform(1, 0, 0, 1, 0, 0);
      ctxBg.drawImage(inkCanvasBg, 0, 0);
    });
  }

  // ── панорамирование фона: средняя/правая кнопка мыши, ИЛИ «рука» + левая ──
  let bgPanning = false;
  let bgPanStartClientX = 0, bgPanStartClientY = 0, bgPanStartPanX = 0, bgPanStartPanY = 0;

  function startBgPan(e){
    // Промпт №31: перемещение фона доски — тоже только у главного
    if (TS.studentRestricted && TS.studentRestricted('boardPan')) {
      if (TS.flashRestrictedHint) TS.flashRestrictedHint();
      return;
    }
    bgPanning = true;
    try { canvasBg.setPointerCapture(e.pointerId); } catch(_){}
    bgPanStartClientX = e.clientX; bgPanStartClientY = e.clientY;
    bgPanStartPanX = bgPanX; bgPanStartPanY = bgPanY;
    updateCursor();
  }

  let bgDrawing = false;

  canvasBg.addEventListener('contextmenu', e=>{
    if (document.documentElement.getAttribute('data-board') === 'on') e.preventDefault();
  });
  canvasBg.addEventListener('pointerdown', e=>{
    // Промпт №23: холст фона теперь виден ВСЕГДА (чтобы были видны чужие записи),
    // а не только когда data-board="on" — но рисовать/панорамировать по нему
    // по-прежнему можно только при явно включённом инструменте доски у СЕБЯ
    if (document.documentElement.getAttribute('data-board') !== 'on') return;
    if (!boardAccessAllowed()) return; // учитель мог отключить доступ к доске ученику
    blurActiveFormField();
    if (e.button === 1 || e.button === 2) { startBgPan(e); e.preventDefault(); return; }
    if (tool === 'hand') {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      startBgPan(e); e.preventDefault(); return;
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    bgDrawing = true;
    try { canvasBg.setPointerCapture(e.pointerId); } catch(_){}
    pushUndo('bg');
    const p = bgScreenToWorld(e.clientX, e.clientY);
    if (tool === 'line') {
      bgCurrentStroke = { tool: 'line', color: penColor, width: penWidth, points: [p, p] };
    } else if (tool === 'eraser') {
      bgCurrentStroke = { tool: 'eraser', width: eraserSize, points: [p] };
    } else {
      bgCurrentStroke = { tool: 'pen', color: penColor, width: penWidth, points: [p] };
    }
    bgCurrentStrokeSid = makeStrokeId();
    bgLiveSender.start(bgCurrentStrokeSid, bgCurrentStroke);
    redrawBg();
    e.preventDefault();
  });

  canvasBg.addEventListener('pointermove', e=>{
    if (bgPanning) {
      bgPanX = bgPanStartPanX - (e.clientX - bgPanStartClientX) / bgViewScale;
      bgPanY = bgPanStartPanY - (e.clientY - bgPanStartClientY) / bgViewScale;
      redrawBg();
      if (window.__boardBroadcastView) window.__boardBroadcastView(); // Промпт №31
      e.preventDefault();
      return;
    }
    if (!bgDrawing || !bgCurrentStroke) return;
    if (tool === 'line') {
      const p = bgScreenToWorld(e.clientX, e.clientY);
      bgCurrentStroke.points[1] = p;
      bgLiveSender.replacePoint(p);
    } else {
      const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      const list = events.length ? events : [e];
      for (const ev of list) {
        const p = bgScreenToWorld(ev.clientX, ev.clientY);
        bgCurrentStroke.points.push(p);
        bgLiveSender.point(p);
      }
    }
    redrawBg();
    e.preventDefault();
  });

  function endBgStroke(e){
    if (bgPanning) {
      bgPanning = false;
      try { canvasBg.releasePointerCapture(e.pointerId); } catch(_){}
      updateCursor();
      return;
    }
    if (!bgDrawing) return;
    bgDrawing = false;
    if (bgCurrentStroke) {
      let finalPoint = null;
      if (typeof e.clientX === 'number') {
        const p = bgScreenToWorld(e.clientX, e.clientY);
        finalPoint = p;
        if (tool === 'line') bgCurrentStroke.points[1] = p;
        else bgCurrentStroke.points.push(p);
      }
      bgCurrentStroke.sid = bgCurrentStrokeSid || makeStrokeId();
      bgStrokes.push(bgCurrentStroke);
      bgCurrentStroke = null;
      bgLiveSender.end(finalPoint);
      TS.push();
    }
    bgCurrentStrokeSid = null;
    try { canvasBg.releasePointerCapture(e.pointerId); } catch(_){}
    redrawBg();
  }
  canvasBg.addEventListener('pointerup', endBgStroke);
  canvasBg.addEventListener('pointercancel', endBgStroke);

  // ── инструменты (ручка/ластик/линия/рука) — общая группа, активен ровно один ──
  // кнопка «рука» лежит в отдельной (второй) панели, поэтому ищем по всему документу
  const toolBtns = [...document.querySelectorAll('[data-tool]')];
  const eraserMainBtn = toolbar.querySelector('.eraser');
  const penMainBtn = toolbar.querySelector('.pen-main');

  function setActiveTool(btn){
    toolBtns.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    if (btn.dataset.tool === 'eraser' && btn !== eraserMainBtn) {
      eraserMainBtn.classList.add('active');
    }
    if (btn.dataset.tool === 'pen' && btn !== penMainBtn) {
      penMainBtn.classList.add('active');
    }
  }

  toolBtns.forEach(btn=>{
    btn.onclick = ()=>{
      setActiveTool(btn);
      const t = btn.dataset.tool;
      if (t === 'pen') {
        tool = 'pen';
        if (btn.dataset.width) penWidth = Number(btn.dataset.width);
      } else if (t === 'line') {
        tool = 'line';
      } else if (t === 'eraser') {
        tool = 'eraser';
        if (btn.dataset.size) eraserSize = Number(btn.dataset.size);
      } else if (t === 'hand') {
        tool = 'hand';
      }
      updateCursor();
    };
  });

  // ── всплывающие окошки с размерами (ручка/ластик): наведение показывает,
  // уход прячет — но с небольшой задержкой, чтобы курсор успевал доехать до
  // окошка, даже если путь неидеально прямой ──
  const HOVER_HIDE_DELAY = 350;
  [...document.querySelectorAll('.tool-group')].forEach(group=>{
    const flyout = group.querySelector('.size-flyout');
    if (!flyout) return;
    let hideTimer = null;
    function show(){ clearTimeout(hideTimer); flyout.classList.add('open'); }
    function scheduleHide(){ clearTimeout(hideTimer); hideTimer = setTimeout(()=> flyout.classList.remove('open'), HOVER_HIDE_DELAY); }
    group.addEventListener('mouseenter', show);
    group.addEventListener('mouseleave', scheduleHide);
    flyout.addEventListener('mouseenter', show);
    flyout.addEventListener('mouseleave', scheduleHide);
  });

  // ── цвет ручки — независимая группа ──
  const colorBtns = [...toolbar.querySelectorAll('[data-color]')];
  const firstPenBtn = toolbar.querySelector('[data-tool="pen"][data-width]');
  colorBtns.forEach(btn=>{
    btn.onclick = ()=>{
      colorBtns.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      penColor = btn.dataset.color;
      tool = 'pen';
      const widthBtn = toolbar.querySelector(`[data-tool="pen"][data-width="${penWidth}"]`) || firstPenBtn;
      setActiveTool(widthBtn);
    };
  });

  // ── «свой» цвет: SV-квадрат + слайдер оттенка + RGB-поля + пипетка ──
  function hsvToRgb(h, s, v){
    h = ((h % 360) + 360) % 360;
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
  }
  function rgbToHsv(r, g, b){
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d !== 0) {
      if (max === r) h = 60 * (((g - b) / d) % 6);
      else if (max === g) h = 60 * ((b - r) / d + 2);
      else h = 60 * ((r - g) / d + 4);
    }
    if (h < 0) h += 360;
    return { h, s: max === 0 ? 0 : d / max, v: max };
  }
  function rgbToHex(r, g, b){
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  function hexToRgb(hex){
    const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  const customColorBtn = document.getElementById('customColorBtn');
  const customColorDot = document.getElementById('customColorDot');
  const cpSvCanvas = document.getElementById('cpSvCanvas');
  const cpSvCtx = cpSvCanvas.getContext('2d');
  const cpSvThumb = document.getElementById('cpSvThumb');
  const cpHue = document.getElementById('cpHue');
  const cpHueThumb = document.getElementById('cpHueThumb');
  const cpSwatch = document.getElementById('cpSwatch');
  const cpEyedropper = document.getElementById('cpEyedropper');
  const cpR = document.getElementById('cpR'), cpG = document.getElementById('cpG'), cpB = document.getElementById('cpB');

  let customHue = 280, customSat = 0.71, customVal = 0.87; // стартовый фиолетовый — просто заготовка на будущее

  function renderSvSquare(){
    const w = cpSvCanvas.width, h = cpSvCanvas.height;
    const hc = hsvToRgb(customHue, 1, 1);
    cpSvCtx.fillStyle = `rgb(${hc.r},${hc.g},${hc.b})`;
    cpSvCtx.fillRect(0, 0, w, h);
    const wg = cpSvCtx.createLinearGradient(0, 0, w, 0);
    wg.addColorStop(0, 'rgba(255,255,255,1)');
    wg.addColorStop(1, 'rgba(255,255,255,0)');
    cpSvCtx.fillStyle = wg;
    cpSvCtx.fillRect(0, 0, w, h);
    const bg = cpSvCtx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, 'rgba(0,0,0,0)');
    bg.addColorStop(1, 'rgba(0,0,0,1)');
    cpSvCtx.fillStyle = bg;
    cpSvCtx.fillRect(0, 0, w, h);
  }
  function updateCpThumbs(){
    cpSvThumb.style.left = (customSat * 100) + '%';
    cpSvThumb.style.top = ((1 - customVal) * 100) + '%';
    cpHueThumb.style.left = (customHue / 360 * 100) + '%';
  }
  // opts.updateInputs=false — не перезаписывать RGB-поля (когда цвет и так пришёл из них)
  // opts.activate=false — только обновить визуал кнопки/окошка, не делать цвет активным цветом пера
  function setCustomColor(rgb, opts){
    opts = opts || {};
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    customColorBtn.dataset.color = hex;
    cpSwatch.style.background = hex;
    customColorDot.style.background = hex;
    if (opts.updateInputs !== false) { cpR.value = rgb.r; cpG.value = rgb.g; cpB.value = rgb.b; }
    updateCpThumbs();
    if (opts.activate !== false) customColorBtn.click(); // переиспользуем обычный обработчик цветовых кнопок
    return hex;
  }

  renderSvSquare();
  setCustomColor(hsvToRgb(customHue, customSat, customVal), { activate: false });

  let svDragging = false;
  function pickFromSv(e){
    const rect = cpSvCanvas.getBoundingClientRect();
    customSat = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    customVal = 1 - Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setCustomColor(hsvToRgb(customHue, customSat, customVal));
  }
  cpSvCanvas.addEventListener('pointerdown', e=>{
    svDragging = true;
    cpSvCanvas.setPointerCapture(e.pointerId);
    pickFromSv(e);
    e.preventDefault(); e.stopPropagation();
  });
  cpSvCanvas.addEventListener('pointermove', e=>{
    if (!svDragging) return;
    pickFromSv(e);
    e.preventDefault(); e.stopPropagation();
  });
  cpSvCanvas.addEventListener('pointerup', e=>{
    svDragging = false;
    try { cpSvCanvas.releasePointerCapture(e.pointerId); } catch(_){}
    e.stopPropagation();
  });

  let hueDragging = false;
  function pickFromHue(e){
    const rect = cpHue.getBoundingClientRect();
    customHue = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * 360;
    renderSvSquare();
    setCustomColor(hsvToRgb(customHue, customSat, customVal));
  }
  cpHue.addEventListener('pointerdown', e=>{
    hueDragging = true;
    cpHue.setPointerCapture(e.pointerId);
    pickFromHue(e);
    e.preventDefault(); e.stopPropagation();
  });
  cpHue.addEventListener('pointermove', e=>{
    if (!hueDragging) return;
    pickFromHue(e);
    e.preventDefault(); e.stopPropagation();
  });
  cpHue.addEventListener('pointerup', e=>{
    hueDragging = false;
    try { cpHue.releasePointerCapture(e.pointerId); } catch(_){}
    e.stopPropagation();
  });

  function clampByte(n){
    n = Math.round(Number(n));
    if (!Number.isFinite(n)) n = 0;
    return Math.max(0, Math.min(255, n));
  }
  function onRgbInputChange(){
    const r = clampByte(cpR.value), g = clampByte(cpG.value), b = clampByte(cpB.value);
    cpR.value = r; cpG.value = g; cpB.value = b;
    const hsv = rgbToHsv(r, g, b);
    customHue = hsv.h; customSat = hsv.s; customVal = hsv.v;
    renderSvSquare();
    setCustomColor({ r, g, b }, { updateInputs: false });
  }
  [cpR, cpG, cpB].forEach(inp=>{
    inp.addEventListener('input', ()=>{ inp.value = inp.value.replace(/[^\d]/g, '').slice(0, 3); });
    inp.addEventListener('change', onRgbInputChange);
    inp.addEventListener('blur', onRgbInputChange);
    inp.addEventListener('keydown', e=>{ if (e.key === 'Enter') inp.blur(); });
    inp.addEventListener('pointerdown', e=> e.stopPropagation());
  });

  cpEyedropper.addEventListener('click', async e=>{
    e.preventDefault(); e.stopPropagation();
    if (!window.EyeDropper) return; // браузер не поддерживает EyeDropper API — кнопка просто неактивна
    try {
      const ed = new EyeDropper();
      const result = await ed.open();
      const rgb = hexToRgb(result.sRGBHex);
      if (rgb) {
        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        customHue = hsv.h; customSat = hsv.s; customVal = hsv.v;
        renderSvSquare();
        setCustomColor(rgb);
      }
    } catch(_) { /* пользователь отменил выбор пипеткой */ }
  });
  if (!window.EyeDropper) cpEyedropper.style.opacity = '0.4';

  // ── отмена последнего действия: Ctrl+Z / ⌘+Z ──
  window.addEventListener('keydown', e=>{
    const tag = (e.target && e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) return;
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      undo();
    }
  });

  document.getElementById('clearBoardBtn').onclick = clearBoard;

  // ── масштаб фона: кнопки +/− и сброс вида (у листа своего зума нет) ──
  function zoomBy(factor){
    bgViewScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, bgViewScale * factor));
    zoomResetBtn.textContent = Math.round(bgViewScale * 100) + '%';
    redrawBg();
    if (window.__boardBroadcastView) window.__boardBroadcastView(); // Промпт №31
  }
  document.getElementById('zoomInBtn').onclick = ()=> zoomBy(ZOOM_STEP);
  document.getElementById('zoomOutBtn').onclick = ()=> zoomBy(1 / ZOOM_STEP);
  zoomResetBtn.onclick = ()=>{
    bgViewScale = 1; bgPanX = 0; bgPanY = 0;
    zoomResetBtn.textContent = '100%';
    redrawBg();
    if (window.__boardBroadcastView) window.__boardBroadcastView(); // Промпт №31
  };

  window.addEventListener('resize', ()=>{ resizeCanvas(); resizeBgCanvas(); });

  // Промпт №23: раньше цикл крутился, только пока data-board="on" (сама
  // доска включена локально) — но записи, оставленные учителем/собеседником,
  // должны быть видны поверх тренажёра ВСЕГДА, даже если у этого участника
  // инструмент рисования выключен и он сам ничего не пишет. Поэтому цикл
  // теперь работает постоянно, с момента загрузки страницы, и от data-board
  // больше не зависит — а вот интерактивность (рисование, тулбар) по-прежнему
  // включается только явно, см. isBoardInteractiveTarget/CSS выше.
  let rafHandle = null;
  function boardLoop(){
    syncBoardTarget();
    redraw();
    redrawBg();
    rafHandle = requestAnimationFrame(boardLoop);
  }
  function ensureLoopRunning(){
    if (rafHandle == null) rafHandle = requestAnimationFrame(boardLoop);
  }
  ensureLoopRunning();
  resizeCanvas();
  resizeBgCanvas();
  updateCursor();

  // ── мост к общей синхронизации состояния тренажёра (см. tsGetState/
  // tsApplyState в предыдущем <script>): классические <script>-теги не делят
  // между собой let/const верхнего уровня, поэтому единственный способ
  // дотянуться сюда снаружи — функции на window (они, в отличие от let/const,
  // общие для всех тегов на странице) ──
  /* ═══ Промпт №31: синхронное перемещение по доске ═══
     Учитель двигает доску (панорамирование листа, панорамирование и масштаб
     фона, обычная прокрутка страницы) — у ученика вид повторяется один в
     один. Сам ученик двигать не может: иначе он смотрит в одно место, а
     учитель пишет в другом — ровно та ситуация, из-за которой «пишешь, а у
     него ничего не появляется».
     Вид шлём отдельным лёгким эфемерным событием, а не через общий снимок
     состояния: перемещение должно быть живым, а снимок и debounce-нут, и
     тяжёл (см. trimForBroadcast в session-share.js). */
  const VIEW_THROTTLE_MS = 60;
  let viewSendTimer = null, applyingRemoteView = false;

  function currentView(){
    return {
      panX: panX, panY: panY,
      bgPanX: bgPanX, bgPanY: bgPanY, bgViewScale: bgViewScale,
      scrollX: window.scrollX, scrollY: window.scrollY,
    };
  }
  function broadcastView(){
    if (applyingRemoteView) return;                       // это мы сами только что применили чужой вид
    if (TS.studentRestricted && TS.studentRestricted('boardPan')) return; // ученик вид не задаёт
    if (viewSendTimer) return;
    viewSendTimer = setTimeout(() => {
      viewSendTimer = null;
      TS.broadcastEvent('board_view', currentView());
    }, VIEW_THROTTLE_MS);
  }
  window.__boardBroadcastView = broadcastView;

  function applyView(v){
    if (!v) return;
    applyingRemoteView = true;
    try {
      if (typeof v.panX === 'number') { panX = v.panX; panY = v.panY; }
      if (typeof v.bgPanX === 'number') { bgPanX = v.bgPanX; bgPanY = v.bgPanY; }
      if (typeof v.bgViewScale === 'number' && v.bgViewScale !== bgViewScale) {
        bgViewScale = v.bgViewScale;
        try { zoomResetBtn.textContent = Math.round(bgViewScale * 100) + '%'; } catch (e) {}
      }
      if (typeof v.scrollY === 'number' &&
          (Math.abs(window.scrollY - v.scrollY) > 2 || Math.abs(window.scrollX - (v.scrollX || 0)) > 2)) {
        window.scrollTo(v.scrollX || 0, v.scrollY);
      }
      redraw();
      redrawBg();
    } finally {
      // снимаем флаг не сразу: window.scrollTo() выше отправит событие scroll
      // уже следующим кадром, и без этой паузы мы бы тут же разослали чужой
      // вид обратно как свой — вид «дрожал» бы между участниками
      setTimeout(() => { applyingRemoteView = false; }, 120);
    }
  }
  TS.onEvent('board_view', applyView);

  // вид входит и в общий снимок — чтобы подключившийся/переподключившийся
  // сразу оказался там же, где остальные, не дожидаясь ближайшего движения
  /* ═══ Промпт №32: ревизия доски ═══
     Снимок состояния приходит от ЛЮБОГО участника, в том числе от того, кто
     только что подключился и у кого доска ещё пустая. Без защиты такой
     пустой снимок стирал бы записи у всех остальных — «учитель пишет, а
     доска вдруг очищается». Поэтому у доски есть номер ревизии: он растёт
     на каждое изменение, а входящий снимок применяется, только если он не
     старше нашего. Осознанная очистка доски — это тоже изменение, её номер
     больше, поэтому «Стереть всё» по-прежнему доезжает до всех. */
  // слияние снимка: берём чужие штрихи, которых у нас ещё нет, и не
  // возвращаем те, что были осознанно удалены (у нас или у собеседника)
  function mergeStrokes(local, incoming){
    if (!Array.isArray(incoming)) return local;
    const own = new Set(local.map(st => st && st.sid).filter(Boolean));
    const add = [];
    for (const st of incoming) {
      if (!st) continue;
      if (!st.sid) {                       // снимок старой версии — без опознавательных знаков
        if (local.length === 0) add.push(st);   // принимаем только на пустую доску
        continue;
      }
      if (own.has(st.sid) || removedSids.has(st.sid)) continue;
      add.push(st);
    }
    const kept = local.filter(st => !(st && st.sid && removedSids.has(st.sid)));
    return add.length || kept.length !== local.length ? kept.concat(add) : local;
  }

  window.__boardGetState = function(){
    return {
      strokes: strokes, bgStrokes: bgStrokes, __view: currentView(),
      __boardClear: boardClearSeq,
      __boardRemoved: Array.from(removedSids),
    };
  };
  window.__boardApplyState = function(state){
    if (!state) return;
    // полная очистка доски у кого-то из участников — применяем её первой
    const incClear = typeof state.__boardClear === 'number' ? state.__boardClear : 0;
    if (incClear > boardClearSeq) {
      boardClearSeq = incClear;
      rememberRemoved(strokes); rememberRemoved(bgStrokes);
      strokes = []; bgStrokes = [];
    }
    if (Array.isArray(state.__boardRemoved)) {
      state.__boardRemoved.forEach(id => removedSids.add(id));
      while (removedSids.size > REMOVED_LIMIT) removedSids.delete(removedSids.values().next().value);
    }
    if (Array.isArray(state.strokes)) { strokes = mergeStrokes(strokes, state.strokes); redraw(); }
    if (Array.isArray(state.bgStrokes)) { bgStrokes = mergeStrokes(bgStrokes, state.bgStrokes); redrawBg(); }
    if (state.__view && TS.studentRestricted && TS.studentRestricted('boardPan')) applyView(state.__view);
  };

  // прокрутка страницы — часть вида: учитель прокручивает лист с заданиями,
  // ученик прокручивается следом
  window.addEventListener('scroll', () => { broadcastView(); }, { passive: true });

  /* ── ученику перемещение запрещено: гасим и перетаскивание доски, и
     обычную прокрутку колесом/тачем/клавишами. Подсказку про ограничение
     показываем не на каждое событие (колесо шлёт их десятками), а изредка ── */
  let lastPanHintAt = 0;
  function panBlocked(){
    return !!(TS.studentRestricted && TS.studentRestricted('boardPan'));
  }
  function hintPanBlocked(){
    const now = Date.now();
    if (now - lastPanHintAt < 2000) return;
    lastPanHintAt = now;
    if (TS.flashRestrictedHint) TS.flashRestrictedHint();
  }
  window.addEventListener('wheel', (e) => {
    if (!panBlocked()) return;
    e.preventDefault();
    hintPanBlocked();
  }, { passive: false });
  window.addEventListener('touchmove', (e) => {
    if (!panBlocked()) return;
    e.preventDefault();
    hintPanBlocked();
  }, { passive: false });
  window.addEventListener('keydown', (e) => {
    if (!panBlocked()) return;
    const tag = (e.target && e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) return;
    const scrollKeys = ['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '];
    if (scrollKeys.indexOf(e.key) === -1) return;
    e.preventDefault();
    hintPanBlocked();
  });
})();
