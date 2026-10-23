/* ═══════════════════════════════════════════════════════════════════════
   ПРЕЗЕНТАЦИИ (промпт №84) — второй вид доски: вместо бесконечного листа
   лента слайдов. Модель данных — HANDOFF.md, раздел 6б.

   Презентация — это обычная доска целиком (тот же код инструментов,
   выделения, облака, ученика), поэтому здесь только то, чем она
   отличается: где лежат слайды, как их показывать и листать.

   №96: подгружается по требованию (ensureDeckModule в boards-core.js),
   когда открывают презентацию, — уже ПОСЛЕ boards-core.js. Функции читают
   B, cam, cssW и прочее из boards-core.js только в момент вызова.
   ═══════════════════════════════════════════════════════════════════════ */

// размер слайда по умолчанию — 16:9 в клетках доски (64×36 по 24 px):
// края слайда всегда попадают на линию сетки, как у листов А4 на доске
const DECK_DEF_W = 64, DECK_DEF_H = 36;
// у каждого слайда свой формат, поэтому слот берём с запасом под самый
// большой допустимый слайд — тогда смена формата никого не сдвигает
const DECK_MAX_CELLS = 112;
const DECK_SLOT_PITCH = 128;          // шаг слотов по вертикали, в клетках
const DECK_FLOW_KEY = 'boardsDeckFlow';

let deckCurId = null;                 // текущий слайд (выводится из камеры, см. deckClampCam)
let deckFitted = true;                // слайд вписан в экран — колесо листает, а не двигает
// Промпт №85в: отдаление от «вписан» (1 — вписан, меньше — видны соседи в
// глубине). Сохраняется при перелистывании
let deckZf = 1;
const DECK_ZMIN = .45;                // дальше 45% от «вписан» не отдаляем
const DECK_PEEK_PX = 40;              // сколько видно соседа при «вписан»
// Промпт №85: render() рисует для миниатюры не текущий слайд, а этот
let deckRenderSlideId = null;

// №96: у ученика (доска учителя, board-stage.js) презентация только
// рисуется — ни листания, ни ленты, ни меню: всё это проверяет isDeckBoard
function isDeckBoard(){ return !!(B && B.kind === 'deck') && !window.deckViewerMode; }
function deckObj(){ return (B && Array.isArray(B.objects)) ? B.objects.find(o => o.type === 'deck') : null; }
function deckSlides(){ const d = deckObj(); return d && Array.isArray(d.slides) ? d.slides : []; }
function deckCur(){
  const sl = deckSlides();
  return sl.find(s => s.id === deckCurId) || sl[0] || null;
}
function deckCurIndex(){ const s = deckCur(); return s ? deckSlides().indexOf(s) : -1; }
function deckDrawnSlide(){
  return deckRenderSlideId ? (deckSlides().find(s => s.id === deckRenderSlideId) || null) : deckCur();
}

// служебный объект: одна точка далеко за краем полотна — старый код (ученик
// со страницей из кэша) его не нарисует, не поймает ластиком и рамкой
function deckNewObj(){
  return { id: 'deck', type: 'deck', points: [{ x: -1e7, y: -1e7 }], slides: [deckNewSlide(0)] };
}
function deckNewSlide(slot, like){
  return {
    id: uid(), slot,
    w: like ? like.w : DECK_DEF_W, h: like ? like.h : DECK_DEF_H,
    // картинка-подложка — объект своего слайда, новому достаётся чистый лист
    bg: like && like.bg ? (like.bg.k === 'img' ? { k: 'plain' } : Object.assign({}, like.bg)) : { k: 'grid' },
  };
}
function deckSlideRect(s){
  const cell = B.cellSize || 24;
  return { x: 0, y: s.slot * DECK_SLOT_PITCH * cell, w: s.w * cell, h: s.h * cell };
}
// слайд, на который реально смотрит камера: середина в его рамке (с запасом
// в 8 клеток). Промежуток между слотами — ничей: увеличили масштаб с курсором
// над пустым местом, середина уехала туда — остаёмся на своём слайде
function deckSlideNearY(y){
  const m = 8 * (B.cellSize || 24);
  return deckSlides().find(s => { const r = deckSlideRect(s); return y >= r.y - m && y <= r.y + r.h + m; }) || null;
}
function deckSlideAtY(y){
  const slot = Math.floor(y / (DECK_SLOT_PITCH * (B.cellSize || 24)));
  return deckSlides().find(s => s.slot === slot) || null;
}

// №90: облачная доска с другого устройства приходит без kind, а её объекты —
// уже после открытия (boards-cloud.js, первая загрузка из базы). Пришёл
// служебный объект слайдов — включаем презентацию тут же, а не со второго
// открытия
window.deckAdopt = function (b){
  if (typeof B === 'undefined' || b !== B || b.kind === 'deck') return;
  if (!Array.isArray(b.objects) || !b.objects.some(o => o.type === 'deck')) return;
  deckOnOpen(b);
  deckOpenCam();
  if (typeof applyDockLayout === 'function') applyDockLayout();
  scheduleRedraw();
};

// Вызывается из openBoardReady. Признак презентации — сам объект deck, а не
// только поле kind: у ученика и на другом компьютере доска приходит из облака
// одними объектами, поле kind из индекса туда не попадает
function deckOnOpen(b){
  const hasObj = Array.isArray(b.objects) && b.objects.some(o => o.type === 'deck');
  if (hasObj) b.kind = 'deck';
  if (b.kind === 'deck'){
    if (!hasObj) b.objects.unshift(deckNewObj());
    const d = b.objects.find(o => o.type === 'deck');
    if (!Array.isArray(d.slides) || !d.slides.length) d.slides = [deckNewSlide(0)];
    d.slides.forEach((s, i) => {
      if (!s.id) s.id = uid();
      if (typeof s.slot !== 'number') s.slot = i;
      s.w = Math.max(4, Math.min(DECK_MAX_CELLS, s.w || DECK_DEF_W));
      s.h = Math.max(4, Math.min(DECK_MAX_CELLS, s.h || DECK_DEF_H));
      if (!s.bg) s.bg = { k: 'grid' };
    });
    deckCurId = null;
  }
  deckFitted = true;
  deckStripSig = ''; deckStripCurShown = null; deckLastRev = null;
  deckSlotSig = {}; deckThumbDirty.clear();
  deckSyncStrip();
  deckResetDepth(); deckZf = 1; deckScrubTicks = -1;
  deckOpenPop(false);
  if (b.kind === 'deck') deckLoadPresets();
  // №88: презентация открывается в «Конструкторе»; что было на доске — «видено»
  deckMode = 'edit'; deckResetSeen(); deckSyncModeUI();
  const sb = document.getElementById('deckSlideBtn');
  if (sb) sb.hidden = !(b.kind === 'deck');
  const isD = b.kind === 'deck';
  const layer = document.getElementById('deckDepth'), scr = document.getElementById('deckScrub');
  if (layer) layer.hidden = !isD || deckFlow() === 'scroll';
  if (scr) scr.hidden = !isD;
  // Промпт №85б: у презентации таблетка (PNG, масштаб, PDF…) — в верхней строке
  if (typeof applyDockLayout === 'function') applyDockLayout();
  const nav = document.getElementById('deckNav');
  if (nav) nav.hidden = b.kind !== 'deck';
  document.documentElement.classList.toggle('deck-mode', b.kind === 'deck');
  deckSyncFlowUI();
  // №101: панель инструментов (deck-toolbar.js) — видимость, свёрнута ли, «⋯»
  if (typeof deckTbSync === 'function') deckTbSync();
}

/* №96: доска учителя у ученика (board-stage.js, совместная сессия по коду).
   Камеру там ведёт учитель, поэтому от модуля презентаций ученику нужно
   только одно: знать, какой слайд на экране, чтобы нарисовать его бумагу и
   обрезать объекты по его краю. Какой слайд — учитель присылает вместе с
   видом (ds), как и режим листания (fl): у ученика в localStorage может быть
   свой режим, а слайды должны стоять так же, как у учителя */
let deckViewerFlow = null, deckViewerSlide = null;
function deckViewerOpen(b){
  window.deckViewerMode = true;
  b.kind = 'deck';
  const d = Array.isArray(b.objects) ? b.objects.find(o => o.type === 'deck') : null;
  if (d && Array.isArray(d.slides)) d.slides.forEach((s, i) => {
    if (typeof s.slot !== 'number') s.slot = i;
    s.w = Math.max(4, Math.min(DECK_MAX_CELLS, s.w || DECK_DEF_W));
    s.h = Math.max(4, Math.min(DECK_MAX_CELLS, s.h || DECK_DEF_H));
    if (!s.bg) s.bg = { k: 'grid' };
  });
  deckCurId = null;
}
function deckViewerClose(){ window.deckViewerMode = false; deckViewerFlow = null; deckViewerSlide = null; deckCurId = null; }
function deckViewerView(v){
  if (!v) return;
  deckViewerFlow = v.fl || null;
  deckViewerSlide = v.ds || null;
}
function deckViewerSync(){
  const sl = deckSlides();
  if (!sl.length) return;
  const byId = deckViewerSlide && sl.find(s => s.id === deckViewerSlide);
  // старый учитель (страница из кэша) слайд не присылает — берём по середине экрана
  const s = byId || deckSlideNearY(cam.y + cssH / 2 / cam.zoom) || deckCur() || sl[0];
  deckCurId = s.id;
}

// Свободная часть холста, куда вписывается слайд: между верхней полосой,
// панелью масштаба, доком, лентой и полосой листания. Панели переносятся к
// любому краю (промпт №9), поэтому край берём по форме и месту: высокая
// узкая панель — боковая (левая или правая половина окна), широкая низкая —
// верхняя или нижняя. «Ближайший край окна» не годится: панель масштаба,
// сдвинутая лентой вправо, оказывается ближе к верху, чем к левому краю.
// Возвращает прямоугольник в координатах холста
function deckArea(){
  const W = window.innerWidth, H = window.innerHeight, gap = 14;
  const ins = { l: 16, t: 16, r: 16, b: 16 };
  const top = document.querySelector('.bd-topbar');
  if (top) ins.t = Math.max(ins.t, top.getBoundingClientRect().bottom + gap);
  ['bdRail', 'bdDock', 'deckNav', 'deckStrip', 'deckScrub'].forEach(id => {
    const el = document.getElementById(id);
    if (!el || el.hidden) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
    const e = r.height >= r.width ? (cx < W / 2 ? 'l' : 'r') : (cy < H / 2 ? 't' : 'b');
    if (e === 'l') ins.l = Math.max(ins.l, r.right + gap);
    else if (e === 'r') ins.r = Math.max(ins.r, W - r.left + gap);
    else if (e === 't') ins.t = Math.max(ins.t, r.bottom + gap);
    else ins.b = Math.max(ins.b, H - r.top + gap);
  });
  const x0 = Math.max(16, ins.l - boardInset), x1 = Math.min(cssW - 16, W - ins.r - boardInset);
  const y0 = ins.t, y1 = Math.min(cssH, H) - ins.b;
  return { x: x0, y: y0, w: Math.max(80, x1 - x0), h: Math.max(60, y1 - y0) };
}
// «вписан» оставляет по краям, куда листают, место под выглядывающих соседей
function deckFitZoom(s){
  // (в сплошной прокрутке свой масштаб — deckScrollFit)
  const r = deckSlideRect(s), a = deckArea(), v = deckFlow() !== 'h';
  const aw = a.w - (v ? 0 : 2 * DECK_PEEK_PX), ah = a.h - (v ? 2 * DECK_PEEK_PX : 0);
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.min(Math.max(40, aw) / r.w, Math.max(30, ah) / r.h)));
}
function deckFitCam(s, zf){
  const r = deckSlideRect(s), a = deckArea(), z = deckFitZoom(s) * (zf || 1);
  cam.zoom = z;
  cam.x = r.x + r.w / 2 - (a.x + a.w / 2) / z;
  cam.y = r.y + r.h / 2 - (a.y + a.h / 2) / z;
}

/* Замена clampCam для презентации. Текущий слайд выводится из середины
   камеры: тогда запомненный вид (view.cx/cy), вид из соседней вкладки и
   отмена работают сами, без отдельного поля «текущий слайд». Отдалить
   слайд меньше, чем «вписан», нельзя — иначе было бы видно пустое полотно
   и соседние слоты */
function deckClampCam(){
  if (window.deckViewerMode){ deckViewerSync(); return; }   // №96: камеру ведёт учитель
  if (deckIsScroll()){ deckScrollClamp(); return; }
  const sl = deckSlides();
  if (!sl.length) return;
  const cy = cam.y + cssH / 2 / cam.zoom;
  const s = deckSlideNearY(cy) || deckCur() || sl[0];
  deckCurId = s.id;
  const fz = deckFitZoom(s);
  if (cam.zoom <= fz * 1.001){
    // меньше «вписан» — обзор с соседями в глубине (№85в), слайд по центру
    deckZf = Math.max(DECK_ZMIN, Math.min(1, cam.zoom / fz));
    deckFitCam(s, deckZf); deckFitted = true;
  } else {
    deckFitted = false; deckZf = 1;
    const r = deckSlideRect(s);
    const viewW = cssW / cam.zoom, viewH = cssH / cam.zoom, m = 40 / cam.zoom;
    if (viewW >= r.w + m * 2) cam.x = r.x + r.w / 2 - viewW / 2;
    else cam.x = clamp(cam.x, r.x - m, r.x + r.w + m - viewW);
    if (viewH >= r.h + m * 2) cam.y = r.y + r.h / 2 - viewH / 2;
    else cam.y = clamp(cam.y, r.y - m, r.y + r.h + m - viewH);
  }
}
// открытие: камера уже стоит по запомненному виду (или в середине полотна) —
// если середина не на слайде, встаём на первый
function deckOpenCam(){
  const cy = cam.y + cssH / 2 / cam.zoom;
  const s = deckSlideAtY(cy) || deckSlides()[0];
  if (!s) return;
  deckCurId = s.id;
  if (!deckSlideAtY(cy)) deckFitCam(s);
}

function deckDrawBackground(c, camv, w, h, isScreen){
  // отмена или собеседник убрали слайд, на котором стоит камера, — переезжаем
  // на ближайший оставшийся, иначе на экране было бы пустое полотно. В
  // сплошной прокрутке середина экрана законно бывает на чужом слайде
  deckInkOnDark = false;
  const scroll = deckIsScroll();
  // №96: у ученика камера учительская — не двигаем её и не трогаем ленту и
  // полосу листания (их у ученика нет), только бумага слайда
  if (window.deckViewerMode){
    if (isScreen && camv === cam) deckViewerSync();
    if (isScreen && scroll && camv === cam) deckRenderScrollOthers(c, camv, w, h);
    const sv = deckDrawnSlide();
    if (sv) deckDrawPaper(c, sv, camv);
    return;
  }
  if (isScreen && camv === cam && deckSlides().length && (scroll ? !deckSlides().some(x => x.id === deckCurId) : !deckSlideAtY(cam.y + cssH / 2 / cam.zoom))){
    const s0 = deckCur();
    if (s0){ deckShowSlide(s0); camv = cam; }
  }
  if (isScreen && scroll && camv === cam) deckRenderScrollOthers(c, camv, w, h);
  const s = deckDrawnSlide();
  if (!s) return;
  deckDrawPaper(c, s, camv);
  if (isScreen){ deckUpdateNav(); deckStripUpdate(); deckDepthSync(); deckScrubSync(); deckSyncPop(); }
}
// бумага, тень и сетка одного слайда — по текущей activeCam
function deckDrawPaper(c, s, camv){
  const r = deckSlideRect(s);
  const p0 = worldToScreen({ x: r.x, y: r.y }), p1 = worldToScreen({ x: r.x + r.w, y: r.y + r.h });
  c.save();
  c.shadowColor = 'rgba(20,30,60,.18)'; c.shadowBlur = 30; c.shadowOffsetY = 8;
  c.fillStyle = deckPaperColor(s);
  c.fillRect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);
  c.restore();
  deckDrawPattern(c, s, r, p0, p1, camv);   // №87: клетка, линейки, точки…
}
// объекты рисуются только в пределах слайда, как в показе PowerPoint:
// и у ученика, и в выгрузке слайд выглядит одинаково
function deckClipSlide(c, camv){
  const s = deckDrawnSlide();
  if (!s) return false;
  deckInkOnDark = deckIsDarkBg(s);
  const r = deckSlideRect(s);
  const p0 = worldToScreen({ x: r.x, y: r.y }), p1 = worldToScreen({ x: r.x + r.w, y: r.y + r.h });
  c.save();
  c.beginPath(); c.rect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y); c.clip();
  return true;
}
// для «Скачать PNG»: выгружаем текущий слайд, а не лист А4 полотна
function deckCurRect(){ const s = deckCur(); return s ? deckSlideRect(s) : null; }

// листание: 'v' лента по одному, 'scroll' сплошная прокрутка (№86), 'h' галерея
function deckFlow(){
  if (window.deckViewerMode && deckViewerFlow) return deckViewerFlow;   // №96: как у учителя
  try { const f = localStorage.getItem(DECK_FLOW_KEY); return f === 'h' || f === 'scroll' ? f : 'v'; } catch (e) { return 'v'; }
}
function deckSetFlow(f){
  const was = deckFlow();
  try { localStorage.setItem(DECK_FLOW_KEY, f); } catch (e) {}
  deckSyncFlowUI();
  if (!isDeckBoard() || !boardActive || was === f) return;
  // текущий слайд при смене режима остаётся текущим
  const s = deckCur();
  deckResetDepth();
  if (s){
    if (f === 'scroll') deckScrollTo(s, true);
    else { deckCurId = s.id; deckZf = 1; deckFitCam(s, 1); deckFitted = true; }
  }
  scheduleRedraw(); rememberView();
}
function deckSyncFlowUI(){
  const f = deckFlow();
  document.getElementById('deckFlowV')?.setAttribute('aria-pressed', f === 'v');
  document.getElementById('deckFlowS')?.setAttribute('aria-pressed', f === 'scroll');
  document.getElementById('deckFlowH')?.setAttribute('aria-pressed', f === 'h');
  // в сплошной прокрутке соседи и так видны — слоя глубины нет
  const L = document.getElementById('deckDepth');
  if (L) L.hidden = !isDeckBoard() || f === 'scroll';
}

let deckNavShown = '';
function deckUpdateNav(){
  const i = deckCurIndex(), n = deckSlides().length;
  const txt = (i + 1) + ' / ' + n;
  if (txt === deckNavShown) return;
  deckNavShown = txt;
  const no = document.getElementById('deckNo'); if (no) no.textContent = txt;
  const pv = document.getElementById('deckPrev'), nx = document.getElementById('deckNext');
  if (pv) pv.disabled = i <= 0;
  if (nx) nx.disabled = i >= n - 1;
}

function deckGo(idx, dir){
  const sl = deckSlides();
  if (idx < 0 || idx >= sl.length) return false;
  const s = sl[idx];
  if (deckIsScroll()){ deckScrollTo(s); scheduleRedraw(); rememberView(); return true; }
  // №85в: текущий слайд картинкой уезжает назад, новый выезжает вперёд;
  // без слоя глубины (или при «меньше движения») — старый сдвиг холста
  if (dir && !deckFlipAnim()) deckAnimate(dir);
  deckCurId = s.id;
  deckFitCam(s, deckFitted ? deckZf : 1);
  deckFitted = true;
  scheduleRedraw();
  rememberView();
  return true;
}
// щелчок по процентам масштаба — слайд снова вписан в экран
function deckResetZoom(){
  const s = deckCur();
  if (!s) return;
  if (deckIsScroll()) deckScrollTo(s, true);
  else { deckZf = 1; deckFitCam(s, 1); deckFitted = true; }
  scheduleRedraw(); rememberView();
}
function deckStep(dir){ return deckGo(deckCurIndex() + dir, dir); }

// сдвиг холста при перелистывании — CSS-анимацией самого холста: камера
// прыгает на другой слот мгновенно, а глазу нужно видеть направление
function deckAnimate(dir){
  const cv = document.getElementById('boardCv');
  if (!cv) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cls = deckFlow() === 'h' ? (dir > 0 ? 'deck-in-h' : 'deck-in-hb') : (dir > 0 ? 'deck-in-v' : 'deck-in-vb');
  cv.classList.remove('deck-in-v', 'deck-in-vb', 'deck-in-h', 'deck-in-hb');
  void cv.offsetWidth;
  cv.classList.add(cls);
}

function deckNextSlot(d){ return d.slides.reduce((m, s) => Math.max(m, s.slot), -1) + 1; }

// новый слайд — после текущего, того же формата и с той же подложкой,
// в новом слоте (номера слотов никогда не переиспользуются)
function deckAddSlide(){
  if (!isDeckBoard() || !mayDraw()) return;
  const d = deckObj(), cur = deckCur();
  if (!d) return;
  pushUndo();
  const s = deckNewSlide(deckNextSlot(d), cur);
  d.slides.splice(deckCurIndex() + 1, 0, s);
  saveDB();
  deckGo(d.slides.indexOf(s), 1);
}

/* Колесо: пока слайд вписан, один жест — один слайд. Тачпад шлёт десятки
   мелких событий с инерцией, колесо мыши — серию щелчков: копим сдвиг,
   листаем при пороге и молчим, пока поток событий не прервётся. Увеличили
   слайд — колесо двигает его, как обычную доску (возвращаем false) */
let deckWheelAcc = 0, deckWheelLocked = false, deckWheelTimer = null;
function deckWheel(e){
  if (window.deckViewerMode) return false;   // №96: у ученика листает учитель
  if (!deckFitted || deckIsScroll()) return false;   // в сплошной прокрутке колесо прокручивает
  let d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  if (e.deltaMode === 1) d *= 16;
  clearTimeout(deckWheelTimer);
  deckWheelTimer = setTimeout(() => { deckWheelLocked = false; deckWheelAcc = 0; }, 180);
  if (deckWheelLocked) return true;
  deckWheelAcc += d;
  if (Math.abs(deckWheelAcc) >= 40){
    deckWheelLocked = true;
    deckStep(deckWheelAcc > 0 ? 1 : -1);
    deckWheelAcc = 0;
  }
  return true;
}

// окно поменяло размер — вписанный слайд остаётся вписанным (а не
// становится «увеличенным» из-за уменьшившегося окна)
window.addEventListener('resize', () => {
  if (!isDeckBoard() || !boardActive) return;   // у ученика isDeckBoard() — false (№96)
  const wasFitted = deckFitted;
  requestAnimationFrame(() => {
    if (deckIsScroll()){ clampCam(); scheduleRedraw(); }
    else if (wasFitted){ const s = deckCur(); if (s){ deckFitCam(s, deckZf); deckFitted = true; scheduleRedraw(); } }
    deckScrubTicks = -1;
  });
});

// Клавиши: PageUp/PageDown, Home/End — всегда; стрелки — только когда
// ничего не выделено (стрелки могут понадобиться выделенному) и не идёт ввод
document.addEventListener('keydown', (e) => {
  if (!boardActive || !isDeckBoard()) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const t = document.activeElement, tag = (t && t.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
  if (typeof textEditSession !== 'undefined' && textEditSession) return;
  let dir = 0;
  if (e.key === 'PageDown') dir = 1;
  else if (e.key === 'PageUp') dir = -1;
  else if (e.key === 'Home'){ e.preventDefault(); deckGo(0, -1); return; }
  else if (e.key === 'End'){ e.preventDefault(); deckGo(deckSlides().length - 1, 1); return; }
  else if (!selectedId && !(multiSelectIds && multiSelectIds.length)){
    const f = deckFlow();
    if (e.key === (f === 'v' ? 'ArrowDown' : 'ArrowRight')) dir = 1;
    else if (e.key === (f === 'v' ? 'ArrowUp' : 'ArrowLeft')) dir = -1;
  }
  if (!dir) return;
  e.preventDefault();
  deckStep(dir);
});

function deckCreate(){
  const b = {
    id: uid(), name: 'Презентация без названия', kind: 'deck',
    folderId: curRealFolderId(),
    createdAt: nowTs(), updatedAt: nowTs(), lastOpenedAt: null,
    cellSize: 24, sheetCols: 76, sheetRows: 54, sheetCount: 1, pageOrder: 'h',
    objects: [deckNewObj()], recentColors: PALETTE.map(p => p.tok), colorUsage: {},
  };
  DB.boards.push(b); saveDB();
  openBoard(b.id);
}

// «Создать презентацию» подключает boards-core.js: модуль ещё не загружен (№96)
document.getElementById('deckPrev')?.addEventListener('click', () => deckStep(-1));
document.getElementById('deckNext')?.addEventListener('click', () => deckStep(1));
document.getElementById('deckAdd')?.addEventListener('click', () => deckAddSlide());
document.getElementById('deckFlowV')?.addEventListener('click', () => deckSetFlow('v'));
document.getElementById('deckFlowH')?.addEventListener('click', () => deckSetFlow('h'));
document.getElementById('deckFlowS')?.addEventListener('click', () => deckSetFlow('scroll'));

/* ═══════════════════════════════════════════════════════════════════════
   ЛЕНТА МИНИАТЮР (промпт №85). Миниатюра — тот же render() доски в
   маленький canvas, поэтому на ней всё как на слайде. Перерисовываем не на
   каждый кадр, а не чаще раза в секунду и только то, что поменялось и видно
   в ленте: на презентации из сорока страниц PDF иначе каждый штрих
   перерисовывал бы сорок картинок
   ═══════════════════════════════════════════════════════════════════════ */
const DECK_STRIP_KEY = 'boardsDeckStrip';
// №85д: размер рамки миниатюры — от ширины ленты (ленту можно растянуть),
// чтобы миниатюры всегда помещались целиком
let deckThumbW = 116, deckThumbH = 80;
let deckStripLastCW = -1;
const DECK_STRIP_SIZE_KEY = 'boardsDeckStripSize';
const DECK_STRIP_THUMB_DEF = 116;
let deckStripSig = '', deckStripCurShown = null, deckLastRev = null;
let deckSlotSig = {};
const deckThumbDirty = new Set(), deckThumbVisible = new Set();
let deckThumbTimer = null, deckThumbLast = 0, deckThumbObserver = null;

function deckMayEdit(){ const d = deckObj(); return !!d && mayDraw() && mayTouch(d); }
function deckPitchPx(){ return DECK_SLOT_PITCH * (B.cellSize || 24); }
// чей объект: по середине его рамки — штрих, вылезший за край, остаётся своему слайду
function deckSlotOf(o){ const b = objectBBox(o); return Math.floor(((b.minY + b.maxY) / 2) / deckPitchPx()); }
function deckSlotObjects(s){ return B.objects.filter(o => o.type !== 'deck' && deckSlotOf(o) === s.slot); }

function deckStripOpen(){ try { return localStorage.getItem(DECK_STRIP_KEY) !== '0'; } catch (e) { return true; } }
function deckSyncStrip(){
  const el = document.getElementById('deckStrip');
  if (!el) return;
  const on = isDeckBoard(), open = deckStripOpen();
  el.hidden = !on;
  el.classList.toggle('collapsed', !open);
  const t = document.getElementById('deckStripToggle');
  if (t){ t.textContent = open ? '‹' : '›'; t.title = open ? 'Свернуть ленту слайдов' : 'Показать ленту слайдов'; t.setAttribute('aria-label', t.title); }
  if (on && open) deckApplyStripSize();
}

/* ── №85д: ленту можно растянуть: правый край — ширина, нижний — высота,
   угол — оба. По умолчанию ширина ровно под миниатюры (с учётом полосы
   прокрутки), высота — до дока. Размер — в localStorage ── */
function deckStripSize(){
  try { const v = JSON.parse(localStorage.getItem(DECK_STRIP_SIZE_KEY) || 'null'); return v && typeof v === 'object' ? v : {}; }
  catch (e) { return {}; }
}
// ширина ленты, при которой миниатюра шириной tw помещается целиком
function deckStripWidthFor(tw){
  const el = document.getElementById('deckStrip'), list = document.getElementById('deckStripList');
  if (!el || !list) return tw + 52;
  const sb = Math.max(0, list.offsetWidth - list.clientWidth);              // полоса прокрутки
  const cs = getComputedStyle(el), pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
  // номер (16) + зазор (4) + рамка + запас под «⋯» (8) + поля списка (4)
  return Math.ceil(pad + sb + 16 + 4 + tw + 8 + 4);
}
function deckApplyStripSize(){
  const el = document.getElementById('deckStrip'), list = document.getElementById('deckStripList');
  if (!el || !list) return;
  const sz = deckStripSize();
  const w = sz.w || deckStripWidthFor(DECK_STRIP_THUMB_DEF);
  el.style.width = Math.round(Math.max(130, Math.min(Math.max(160, window.innerWidth * .5), w))) + 'px';
  if (sz.h){ el.style.bottom = 'auto'; el.style.height = Math.round(Math.max(160, Math.min(window.innerHeight - 84, sz.h))) + 'px'; }
  else { el.style.bottom = ''; el.style.height = ''; }
  // миниатюра — по фактической ширине списка (лента ещё не на экране —
  // ширины нет, посчитаем, когда появится: deckStripUpdate)
  if (!list.clientWidth) return;
  deckStripLastCW = list.clientWidth;
  const free = list.clientWidth - 16 - 4 - 8 - 4;
  const tw = Math.max(60, Math.min(420, Math.floor(free)));
  if (tw !== deckThumbW){
    deckThumbW = tw; deckThumbH = Math.round(tw * 80 / 116);
    el.style.setProperty('--deck-tw', tw + 'px');
    el.style.setProperty('--deck-th', deckThumbH + 'px');
    deckStripSig = '';                      // перестроить миниатюры в новом размере
  }
}
(function(){
  const el = document.getElementById('deckStrip');
  if (!el) return;
  let rs = null;   // { mode, x0, y0, w0, h0, t }
  el.addEventListener('pointerdown', (e) => {
    const hd = e.target.closest('[data-rs]');
    if (!hd || e.button > 0) return;
    e.preventDefault(); e.stopPropagation();
    const r = el.getBoundingClientRect();
    rs = { mode: hd.dataset.rs, x0: e.clientX, y0: e.clientY, w0: r.width, h0: r.height, t: 0 };
    el.classList.add('resizing');
    try { hd.setPointerCapture(e.pointerId); } catch (err) {}
  });
  el.addEventListener('pointermove', (e) => {
    if (!rs) return;
    const sz = deckStripSize();
    if (rs.mode !== 'y') sz.w = Math.max(130, Math.min(Math.max(160, window.innerWidth * .5), rs.w0 + e.clientX - rs.x0));
    if (rs.mode !== 'x') sz.h = Math.max(160, Math.min(window.innerHeight - 84, rs.h0 + e.clientY - rs.y0));
    try { localStorage.setItem(DECK_STRIP_SIZE_KEY, JSON.stringify(sz)); } catch (err) {}
    deckApplyStripSize();
    // миниатюры и место под слайд — не чаще раза в 120 мс, пока тянут
    const now = Date.now();
    if (now - rs.t > 120){ rs.t = now; deckStripRefit(); }
  });
  const end = () => { if (!rs) return; rs = null; el.classList.remove('resizing'); deckApplyStripSize(); deckStripRefit(); };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  // двойной щелчок по краю — размер по умолчанию
  el.addEventListener('dblclick', (e) => {
    const hd = e.target.closest('[data-rs]');
    if (!hd) return;
    const sz = deckStripSize();
    if (hd.dataset.rs !== 'y') delete sz.w;
    if (hd.dataset.rs !== 'x') delete sz.h;
    try { localStorage.setItem(DECK_STRIP_SIZE_KEY, JSON.stringify(sz)); } catch (err) {}
    deckApplyStripSize(); deckStripRefit();
  });
  window.addEventListener('resize', () => { if (isDeckBoard() && deckStripOpen()) deckApplyStripSize(); });
})();
function deckStripRefit(){
  if (!isDeckBoard() || !boardActive) return;
  const s = deckCur();
  if (s && (deckFitted || deckIsScroll())) deckShowSlide(s); else clampCam();
  scheduleRedraw();
}
function deckSetStripOpen(v){
  try { localStorage.setItem(DECK_STRIP_KEY, v ? '1' : '0'); } catch (e) {}
  deckSyncStrip();
  deckStripSig = '';
  // свободного места стало больше или меньше — вписываем слайд заново
  requestAnimationFrame(() => {
    if (!isDeckBoard() || !boardActive) return;
    if (deckFitted){ const s = deckCur(); if (s) deckFitCam(s); } else clampCam();
    scheduleRedraw();
  });
}

function deckThumbSize(s){
  const r = deckSlideRect(s), sc = Math.min(deckThumbW / r.w, deckThumbH / r.h);
  return { w: Math.max(8, Math.round(r.w * sc)), h: Math.max(8, Math.round(r.h * sc)), sc, r };
}

// зовётся из отрисовки экрана: лента следит за списком слайдов и правками
function deckStripUpdate(){
  if (B.rev !== deckLastRev){ deckLastRev = B.rev; deckScheduleThumbs(); }
  const list = document.getElementById('deckStripList');
  if (!list || !deckStripOpen()) return;
  if (list.clientWidth !== deckStripLastCW) deckApplyStripSize();
  const sl = deckSlides();
  const sig = deckStripSigOf(sl);
  if (sig !== deckStripSig){ deckStripSig = sig; deckStripCurShown = null; deckBuildStrip(list, sl); }
  const cur = deckCur(), cid = cur && cur.id;
  if (cid !== deckStripCurShown){
    deckStripCurShown = cid;
    list.querySelectorAll('.deck-thumb').forEach(t => {
      const on = t.dataset.id === cid;
      t.classList.toggle('cur', on);
      if (on){ try { t.scrollIntoView({ block: 'nearest' }); } catch (e) {} }
    });
  }
}

function deckBuildStrip(list, sl){
  if (deckThumbObserver) deckThumbObserver.disconnect();
  deckThumbVisible.clear();
  list.innerHTML = sl.map((s, i) => {
    const t = deckThumbSize(s);
    const name = s.name ? escHtml(s.name) : '';
    return `<div class="deck-thumb" data-id="${s.id}" title="${name || 'Слайд ' + (i + 1)}">`
      + `<span class="deck-thumb-n">${i + 1}</span>`
      + `<span class="deck-thumb-main"><span class="deck-thumb-box"><canvas style="width:${t.w}px;height:${t.h}px"></canvas></span>`
      + (name ? `<span class="deck-thumb-name">${name}</span>` : '') + `</span>`
      + `<button class="deck-thumb-menu" data-id="${s.id}" aria-label="Действия со слайдом" title="Дублировать, переименовать, удалить">⋯</button></div>`;
  }).join('');
  sl.forEach(s => deckThumbDirty.add(s.id));
  deckThumbObserver = ('IntersectionObserver' in window) ? new IntersectionObserver(entries => {
    entries.forEach(en => {
      const id = en.target.dataset.id;
      if (en.isIntersecting){ deckThumbVisible.add(id); if (deckThumbDirty.has(id)) deckScheduleThumbs(true); }
      else if (deckThumbVisible.delete(id)){
        // ушла из виду — отдаём память картинки, нарисуем снова, когда вернётся
        const cv = en.target.querySelector('canvas');
        if (cv){ cv.width = 0; cv.height = 0; }
        deckThumbDirty.add(id);
      }
    });
  }, { root: list, rootMargin: '120px 0px' }) : null;
  list.querySelectorAll('.deck-thumb').forEach(el => {
    if (deckThumbObserver) deckThumbObserver.observe(el); else deckThumbVisible.add(el.dataset.id);
  });
  deckScheduleThumbs(true);
}

function deckScheduleThumbs(soon){
  if (deckThumbTimer) return;
  const wait = soon ? 30 : Math.max(0, 1000 - (Date.now() - deckThumbLast));
  deckThumbTimer = setTimeout(() => { deckThumbTimer = null; deckThumbLast = Date.now(); deckRefreshThumbs(); }, wait);
}
function deckRefreshThumbs(){
  if (!isDeckBoard() || !boardActive) return;
  // что поменялось: грубая подпись содержимого каждого слота. Текущий слайд
  // перерисовываем всегда — правят почти всегда его; подпись ловит то, что
  // пришло от собеседника на другие слайды
  const sig = {};
  B.objects.forEach(o => {
    if (o.type === 'deck') return;
    const b = objectBBox(o), slot = Math.floor(((b.minY + b.maxY) / 2) / deckPitchPx());
    sig[slot] = (sig[slot] || 0) + 1 + b.minX + b.minY * 3 + b.maxX * 7 + b.maxY * 11 + (o.content ? o.content.length : 0) + String(o.color || '').length + (typeof bxSig === 'function' ? bxSig(o) : 0);
  });
  deckSlides().forEach(s => {
    const v = sig[s.slot] || 0;
    if (deckSlotSig[s.id] !== v){ deckSlotSig[s.id] = v; deckThumbDirty.add(s.id); if (s.id !== deckCurId) deckMarkCardsDirty([s.id]); }
    if (s.id === deckCurId){ deckThumbDirty.add(s.id); const c = deckCards.get(s.id); if (c) c.dirty = true; }
  });
  if (!deckStripOpen()) return;
  let pending = false;
  [...deckThumbDirty].forEach(id => {
    if (!deckThumbVisible.has(id)) return;
    deckThumbDirty.delete(id);
    if (deckRenderThumb(id)) pending = true;
  });
  // картинки слайда ещё грузятся — дорисуем миниатюру, когда догрузятся
  if (pending) deckScheduleThumbs();
}
function deckRenderThumb(id){
  const el = document.querySelector(`#deckStripList .deck-thumb[data-id="${id}"] canvas`);
  const s = deckSlides().find(x => x.id === id);
  if (!el || !s) return false;
  const t = deckThumbSize(s), pd = Math.min(2, window.devicePixelRatio || 1);
  el.width = Math.round(t.w * pd); el.height = Math.round(t.h * pd);
  el.style.width = t.w + 'px'; el.style.height = t.h + 'px';
  deckRenderSlideId = id;
  try { render(el.getContext('2d'), t.w, t.h, { x: t.r.x, y: t.r.y, zoom: t.sc, minLine: 1 }, false, pd); }
  catch (e) {}
  finally { deckRenderSlideId = null; activeCam = cam; deckInkSync(); }
  const loading = deckSlotObjects(s).some(o => { if (o.type !== 'image') return false; const im = getImg(o.src); return !(im.complete && im.naturalWidth); });
  if (loading) deckThumbDirty.add(id);
  return loading;
}

// ── правка списка слайдов: каждое действие — один шаг отмены ──
function deckShiftObj(o, dy){
  o.points = (o.points || []).map(p => ({ x: p.x, y: p.y + dy }));
  if (o.ctrl) o.ctrl = { x: o.ctrl.x, y: o.ctrl.y + dy };
}
function deckDuplicate(id){
  const d = deckObj();
  if (!d || !deckMayEdit()) return;
  const i = d.slides.findIndex(x => x.id === id);
  if (i < 0) return;
  pushUndo();
  const src = d.slides[i], ns = deckNewSlide(deckNextSlot(d), src);
  if (src.name) ns.name = src.name + ' (копия)';
  const dy = (ns.slot - src.slot) * deckPitchPx(), groups = {};
  deckSlotObjects(src).forEach(o => {
    const c = JSON.parse(JSON.stringify(o));
    c.id = uid();
    delete c.by;      // копию сделал я — она моя (stampAuthors подпишет)
    delete c.stack;   // и не часть чужой стопки заданий (как при вставке)
    if (c.groupId) c.groupId = groups[c.groupId] || (groups[c.groupId] = uid());
    deckShiftObj(c, dy);
    if (c.bgOf){
      // картинка-подложка копии — тоже в самый низ и копии же принадлежит
      c.bgOf = ns.id; ns.bg = { k: 'img', img: c.id };
      B.objects.splice(B.objects.findIndex(x => x.type === 'deck') + 1, 0, c);
    } else B.objects.push(c);
  });
  d.slides.splice(i + 1, 0, ns);
  saveDB();
  deckGo(i + 1, 1);
}
function deckDelete(id){
  const d = deckObj();
  if (!d || !deckMayEdit() || d.slides.length <= 1) return;
  const i = d.slides.findIndex(x => x.id === id);
  if (i < 0) return;
  pushUndo();
  const s = d.slides[i], gone = new Set(deckSlotObjects(s).map(o => o.id));
  B.objects = B.objects.filter(o => !gone.has(o.id));
  d.slides.splice(i, 1);
  if (selectedId && gone.has(selectedId)) selectedId = null;
  multiSelectIds = multiSelectIds.filter(x => !gone.has(x));
  saveDB();
  if (s.id === deckCurId || !deckSlides().some(x => x.id === deckCurId)) deckGo(Math.min(i, d.slides.length - 1), 0);
  else scheduleRedraw();
}
function deckRename(id){
  const d = deckObj();
  if (!d || !deckMayEdit()) return;
  const s = d.slides.find(x => x.id === id);
  if (!s) return;
  const v = prompt('Название слайда:', s.name || '');
  if (v === null) return;
  pushUndo();
  if (v.trim()) s.name = v.trim(); else delete s.name;
  saveDB(); scheduleRedraw();
}
// to — место вставки в списке до перестановки (0…length)
function deckMoveSlide(from, to){
  const d = deckObj();
  if (!d || !deckMayEdit() || to === from || to === from + 1) return;
  pushUndo();
  const [s] = d.slides.splice(from, 1);
  d.slides.splice(to > from ? to - 1 : to, 0, s);
  saveDB(); scheduleRedraw();
}

// ── меню «⋯» миниатюры ──
let deckMenuFor = null;
function deckOpenMenu(id, anchor){
  const r = anchor.getBoundingClientRect();
  deckOpenMenuAt(id, r.right + 6, r.top);
}
// меню слайда в точке экрана (миниатюра, правая кнопка, двойное касание)
function deckOpenMenuAt(id, x, y){
  const m = document.getElementById('deckMenu');
  if (!m) return;
  deckMenuFor = id;
  const one = deckSlides().length <= 1, can = deckMayEdit();
  // сохранить себе шаблон можно и с чужой доски — она от этого не меняется;
  // свои пометки стирает и ученик
  const free = { tpl: 1, clear: 1, clearall: 1 };
  m.querySelectorAll('button').forEach(b => { b.disabled = !free[b.dataset.act] && (!can || (b.dataset.act === 'del' && one)); });
  m.querySelectorAll('[data-act="base"]').forEach(b => { b.hidden = !deckIsTeacher(); });
  m.hidden = false;
  const mw = m.offsetWidth, mh = m.offsetHeight;
  m.style.left = Math.max(8, Math.min(window.innerWidth - mw - 8, x)) + 'px';
  m.style.top = Math.max(8, Math.min(window.innerHeight - mh - 8, y)) + 'px';
}
function deckCloseMenu(){ const m = document.getElementById('deckMenu'); if (m) m.hidden = true; deckMenuFor = null; }
document.getElementById('deckMenu')?.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b || b.disabled) return;
  const id = deckMenuFor;
  deckCloseMenu();
  if (b.dataset.act === 'tpl') deckSaveSlideTemplate(id);
  else if (b.dataset.act === 'clear' || b.dataset.act === 'clearall'){
    const i = deckSlides().findIndex(x => x.id === id), c = deckCurIndex();
    if (b.dataset.act === 'clear' && i >= 0 && i !== c) deckGo(i, i > c ? 1 : -1);
    deckClearNotes(b.dataset.act === 'clearall');
  }
  else if (b.dataset.act === 'base') deckMakeBase(id);
  else if (b.dataset.act === 'fmt'){
    const i = deckSlides().findIndex(x => x.id === id), c = deckCurIndex();
    if (i >= 0 && i !== c) deckGo(i, i > c ? 1 : -1);
    deckOpenPop(true);
  }
  else if (b.dataset.act === 'dup') deckDuplicate(id);
  else if (b.dataset.act === 'ren') deckRename(id);
  else if (b.dataset.act === 'del') deckDelete(id);
});
document.addEventListener('pointerdown', (e) => {
  const m = document.getElementById('deckMenu');
  if (m && !m.hidden && !m.contains(e.target) && !e.target.closest('.deck-thumb-menu')) deckCloseMenu();
}, true);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') deckCloseMenu(); });

// после перестановки переставляем готовые узлы ленты, а не строим её заново:
// миниатюры не мигают пустыми, пока перерисуются
function deckStripSigOf(sl){ return sl.map(s => s.id + ':' + s.w + 'x' + s.h + ':' + (s.name || '') + ':' + (s.bg ? s.bg.k + (s.bg.c || '') + (s.bg.f || '') + (s.bg.img || '') : '')).join('|'); }
function deckStripReorderDom(){
  const list = document.getElementById('deckStripList');
  if (!list) return;
  const sl = deckSlides(), map = {};
  list.querySelectorAll('.deck-thumb').forEach(el => { map[el.dataset.id] = el; });
  if (sl.some(s => !map[s.id])) return;   // состав поменялся — пусть строится заново
  sl.forEach((s, i) => { list.appendChild(map[s.id]); map[s.id].querySelector('.deck-thumb-n').textContent = i + 1; });
  deckStripSig = deckStripSigOf(sl);
}

/* ── щелчок открывает слайд, перетаскивание меняет порядок ──
   Как перенос значков на Android: миниатюра «поднимается» (крупнее, с
   тенью) и едет за пальцем, соседние плавно расступаются, отпустили —
   встаёт в щель. Мышью и пером тащим сразу; пальцем — после удержания,
   иначе нельзя было бы прокрутить длинную ленту */
(function(){
  const list = document.getElementById('deckStripList');
  if (!list) return;
  const GAP = 10, LONG_MS = 320;
  let drag = null;   // { id, from, el, x0, y0, st0, pid, touch, timer, moving, items, h, to }
  function contentY(clientY){ return clientY - list.getBoundingClientRect().top + list.scrollTop; }
  function lift(){
    if (!drag || drag.moving || !deckMayEdit()) return;
    drag.moving = true;
    const els = [...list.querySelectorAll('.deck-thumb')];
    drag.items = els.map(el => { const r = el.getBoundingClientRect(); return { el, h: r.height, mid: contentY(r.top) + r.height / 2 }; });
    drag.from = els.indexOf(drag.el);
    drag.h = drag.items[drag.from].h + GAP;
    drag.to = drag.from;
    list.classList.add('sorting');
    drag.el.classList.add('lifted');
    try { list.setPointerCapture(drag.pid); } catch (e) {}
    if (drag.touch && navigator.vibrate){ try { navigator.vibrate(12); } catch (e) {} }
  }
  function follow(clientY){
    const dy = clientY - drag.y0 + (list.scrollTop - drag.st0);
    drag.el.style.transform = `translateY(${dy}px) scale(1.06)`;
    const center = drag.items[drag.from].mid + dy;
    // куда встанет: сколько остальных миниатюр выше её середины
    let to = 0;
    drag.items.forEach((it, i) => { if (i !== drag.from && it.mid < center) to++; });
    drag.to = to;
    drag.items.forEach((it, i) => {
      if (i === drag.from) return;
      let shift = 0;
      if (drag.from < to && i > drag.from && i <= to) shift = -drag.h;
      else if (to < drag.from && i >= to && i < drag.from) shift = drag.h;
      it.el.style.transform = shift ? `translateY(${shift}px)` : '';
    });
  }
  function drop(){
    const d = drag; drag = null;
    let off = 0;
    if (d.to > d.from) for (let i = d.from + 1; i <= d.to; i++) off += d.items[i].h + GAP;
    else for (let i = d.to; i < d.from; i++) off -= d.items[i].h + GAP;
    d.el.classList.remove('lifted');
    d.el.classList.add('settling');
    d.el.style.transform = `translateY(${off}px)`;
    setTimeout(() => {
      // анимации выключаем до того, как снять сдвиги и переставить узлы, —
      // тогда всё встаёт на место за один кадр, без обратного проезда
      list.classList.remove('sorting');
      d.el.classList.remove('settling');
      d.items.forEach(it => { it.el.style.transform = ''; });
      if (d.to !== d.from){ deckMoveSlide(d.from, d.to > d.from ? d.to + 1 : d.to); deckStripReorderDom(); }
    }, 190);
  }
  function cancel(){
    if (!drag) return;
    clearTimeout(drag.timer);
    if (drag.moving){
      list.classList.remove('sorting');
      drag.el.classList.remove('lifted');
      drag.items.forEach(it => { it.el.style.transform = ''; });
    }
    drag = null;
  }
  list.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    const menuBtn = e.target.closest('.deck-thumb-menu');
    if (menuBtn){ e.preventDefault(); const m = document.getElementById('deckMenu'); if (m && !m.hidden && deckMenuFor === menuBtn.dataset.id) deckCloseMenu(); else deckOpenMenu(menuBtn.dataset.id, menuBtn); return; }
    const th = e.target.closest('.deck-thumb');
    if (!th || drag) return;
    drag = { id: th.dataset.id, el: th, from: deckSlides().findIndex(s => s.id === th.dataset.id),
             x0: e.clientX, y0: e.clientY, st0: list.scrollTop, pid: e.pointerId,
             touch: e.pointerType === 'touch', timer: null, moving: false };
    if (drag.touch) drag.timer = setTimeout(lift, LONG_MS);
    else { try { list.setPointerCapture(e.pointerId); } catch (err) {} }
  });
  list.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pid) return;
    if (!drag.moving){
      const dist = Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0);
      // палец сдвинулся до удержания — это прокрутка ленты, не перенос
      if (drag.touch){ if (dist > 8) cancel(); return; }
      if (dist < 6) return;
      lift();
      if (!drag || !drag.moving) return;
    }
    // у края ленты — прокручиваем её, чтобы дотащить до невидимых слайдов
    const lr = list.getBoundingClientRect();
    if (e.clientY < lr.top + 28) list.scrollTop -= 12;
    else if (e.clientY > lr.bottom - 28) list.scrollTop += 12;
    follow(e.clientY);
  });
  // палец после удержания не должен прокручивать ленту вместо переноса
  list.addEventListener('touchmove', (e) => { if (drag && drag.moving) e.preventDefault(); }, { passive: false });
  list.addEventListener('contextmenu', (e) => { if (e.target.closest('.deck-thumb')) e.preventDefault(); });
  list.addEventListener('pointerup', (e) => {
    if (!drag || e.pointerId !== drag.pid) return;
    clearTimeout(drag.timer);
    if (drag.moving){ drop(); return; }
    const from = drag.from; drag = null;
    const cur = deckCurIndex();
    if (from >= 0 && from !== cur) deckGo(from, from > cur ? 1 : -1);
  });
  list.addEventListener('pointercancel', cancel);
})();

document.getElementById('deckStripToggle')?.addEventListener('click', () => deckSetStripOpen(!deckStripOpen()));

/* ═══════════════════════════════════════════════════════════════════════
   СОСЕДНИЕ СЛАЙДЫ В ГЛУБИНЕ, ОБЗОР, БЫСТРОЕ ЛИСТАНИЕ (промпт №85в)
   Позади холста (у презентации он вне слайда прозрачный) — слой #deckDepth
   с соседними слайдами. Соседи — готовые картинки (тот же render(), что у
   миниатюр), сдвиг, наклон и прозрачность им задаёт CSS: анимация плавная
   и почти не стоит процессору, рисование на текущем слайде не замедляется.
   Вид зависит от масштаба (доля от «вписан»): 100% и больше — полоска,
   около 80% — половина, 55% и меньше — наклон, между ними плавно.
   Пока листают (0,3 с) и пока тянут ползунок справа, текущий слайд тоже
   картинка, а холст его не рисует (deckSlideHidden) — так текущий может
   уехать назад, а сосед выехать вперёд
   ═══════════════════════════════════════════════════════════════════════ */
const DECK_KEYS = [
  { z: .55, s: .74, peek: .55, tilt: 28, op: .8,  op2: .45 },
  { z: .80, s: .78, peek: .45, tilt: 0,  op: .6,  op2: 0 },
  { z: 1.0, s: .86, peek: .06, tilt: 0,  op: .5,  op2: 0 },
];
const DECK_FAST_Z = .5, DECK_ANIM_MS = 330, DECK_CARD_MAXW = 1400;
// вход в обзор и выход из него — медленнее и мягче перелистывания: с
// обычного масштаба в обзор резкий прыжок читается как рывок
const DECK_MODE_MS = 560;
let deckSlowTimer = null;
function deckSlowFor(ms){
  const L = deckDepthLayer();
  if (!L) return;
  L.classList.add('slow');
  clearTimeout(deckSlowTimer);
  deckSlowTimer = setTimeout(() => L.classList.remove('slow'), ms + 30);
}
let deckFast = false, deckAnimUntil = 0, deckAnimTimer = null;
// №85г: в «максимуме эффектов» стопка при быстром листании идёт за ручкой
// ползунка непрерывно: deckFastPos — дробный номер слайда (2,4 — между
// вторым и третьим), deckFastFollow — ручка вне «магнита» отметки
let deckFastPos = null, deckFastFollow = false, deckDepthFollowShown = false;
function deckMaxFx(){ return document.documentElement.getAttribute('data-fx') === 'full'; }
const deckCards = new Map();          // id слайда → { el, bw, dirty }
const deckCardQueue = [];
let deckDepthKey = '', deckDepthCurShown = null;

function deckSlideHidden(){ return deckFast || Date.now() < deckAnimUntil || !!deckFx; }

/* №85е: в «максимуме эффектов» вход в быстрое листание, ход за ручкой и
   выход ведёт JS кадр за кадром: показанные положение стопки (pos) и
   отдаление (z) плавно догоняют цель (экспоненциально, ~70 и ~140 мс).
   CSS-анимация тут дёргалась: каждый сдвиг ручки перезапускал её, а по
   окончании мягкого входа стопка прыгала к ручке. Пока deckFx жив, текущий
   слайд — картинка в слое, холст его не рисует */
let deckFx = null, deckFxRaf = 0;
function deckFxTarget(){
  return { pos: deckFastPos !== null ? deckFastPos : Math.max(0, deckCurIndex()), z: deckFast ? Math.min(deckZf, DECK_FAST_Z) : deckZf };
}
function deckFxStart(){
  if (!deckFx) deckFx = { pos: Math.max(0, deckCurIndex()), z: deckZf, t: performance.now() };
  if (!deckFxRaf) deckFxRaf = requestAnimationFrame(deckFxTick);
}
function deckFxTick(now){
  deckFxRaf = 0;
  if (!deckFx || !isDeckBoard() || !boardActive){ deckFx = null; return; }
  // шаг кадра не больше 100 мс: после свёрнутой вкладки не прыгнуть разом
  const dt = Math.max(1, Math.min(100, now - deckFx.t)); deckFx.t = now;
  const T = deckFxTarget();
  deckFx.pos += (T.pos - deckFx.pos) * (1 - Math.exp(-dt / 70));
  deckFx.z += (T.z - deckFx.z) * (1 - Math.exp(-dt / 140));
  if (!deckFast && Math.abs(T.pos - deckFx.pos) < .004 && Math.abs(T.z - deckFx.z) < .008){
    deckFx = null; deckDepthKey = '';
    scheduleRedraw();            // холст снова рисует слайд, картинка исчезает
    return;
  }
  deckDepthSync();
  deckFxRaf = requestAnimationFrame(deckFxTick);
}
function deckDepthParams(z){
  const K = DECK_KEYS, zz = Math.max(K[0].z, Math.min(K[2].z, z));
  let a = K[0], b = K[1];
  if (zz > K[1].z){ a = K[1]; b = K[2]; }
  const t = (zz - a.z) / (b.z - a.z), m = k => a[k] + (b[k] - a[k]) * t;
  return { s: m('s'), peek: m('peek'), tilt: m('tilt'), op: m('op'), op2: m('op2') };
}
function deckDepthLayer(){ return document.getElementById('deckDepth'); }
function deckReducedMotion(){ return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }

// картинка слайда для слоя: ширина по экрану, но не больше DECK_CARD_MAXW
function deckRenderCard(id, cssWpx){
  const s = deckSlides().find(x => x.id === id), card = deckCards.get(id);
  if (!s || !card) return;
  const r = deckSlideRect(s), pd = Math.min(2, window.devicePixelRatio || 1);
  const bw = Math.max(64, Math.round(Math.min(DECK_CARD_MAXW, (cssWpx || card.want || 600) * pd)));
  const bh = Math.max(36, Math.round(bw * r.h / r.w));
  card.el.width = bw; card.el.height = bh; card.bw = bw; card.dirty = false;
  deckRenderSlideId = id;
  try { render(card.el.getContext('2d'), bw, bh, { x: r.x, y: r.y, zoom: bw / r.w, minLine: 1 }, false, 1); }
  catch (e) {}
  finally { deckRenderSlideId = null; activeCam = cam; deckInkSync(); }
  const loading = deckSlotObjects(s).some(o => { if (o.type !== 'image') return false; const im = getImg(o.src); return !(im.complete && im.naturalWidth); });
  if (loading){ card.dirty = true; setTimeout(() => deckQueueCard(id), 900); }
}
// не больше одной картинки за кадр: при быстром листании в слой входят
// новые соседи, и рисовать их все разом — это рывок
function deckQueueCard(id){
  if (!deckCardQueue.includes(id)) deckCardQueue.push(id);
  if (deckCardQueue.length === 1) requestAnimationFrame(deckDrainCards);
}
function deckDrainCards(){
  const id = deckCardQueue.shift();
  if (id && deckCards.has(id) && isDeckBoard() && boardActive) deckRenderCard(id);
  if (deckCardQueue.length) requestAnimationFrame(deckDrainCards);
}
function deckMarkCardsDirty(ids){
  ids.forEach(id => { const c = deckCards.get(id); if (c){ c.dirty = true; deckQueueCard(id); } });
}

function deckResetDepth(){
  const L = deckDepthLayer();
  if (L) L.innerHTML = '';
  deckCards.clear(); deckCardQueue.length = 0;
  deckDepthKey = ''; deckDepthCurShown = null;
  deckFast = false; deckAnimUntil = 0; deckFastPos = null; deckFastFollow = false; deckDepthFollowShown = false;
  deckFx = null;
}

/* Расстановка слоя. Зовётся из каждого кадра доски, но DOM трогает, только
   если что-то поменялось. Смена текущего слайда, начало/конец листания —
   с анимацией; масштаб и окно — без неё (иначе слой отставал бы от холста) */
function deckDepthSync(){
  const L = deckDepthLayer(), sl = deckSlides(), cur = deckCur();
  if (!L || !cur || L.hidden) return;
  const ci = sl.indexOf(cur), flow = deckFlow() === 'h' ? 'h' : 'v';
  const hidden = deckSlideHidden();
  const fz = deckFitZoom(cur);
  const zf = deckFast ? Math.min(deckZf, DECK_FAST_Z) : deckZf;
  // где текущий слайд на экране: по камере, а в листании — посередине
  // свободного места в «виртуальном» масштабе
  let Z, cx, cy;
  if (hidden || deckFitted){
    const a = deckArea();
    Z = fz * (deckFx ? deckFx.z : zf); cx = a.x + a.w / 2; cy = a.y + a.h / 2;
  } else {
    const r = deckSlideRect(cur);
    Z = cam.zoom; cx = (r.x + r.w / 2 - cam.x) * Z; cy = (r.y + r.h / 2 - cam.y) * Z;
  }
  // «максимум»: положение и отдаление ведёт deckFxTick, анимация CSS не нужна
  const fxOn = !!deckFx;
  const p = deckDepthParams(fxOn ? deckFx.z : (deckFitted || hidden ? zf : 1));
  const frac = fxOn || (deckFast && deckFastPos !== null);
  const fpos = fxOn ? Math.max(0, Math.min(sl.length - 1, deckFx.pos)) : frac ? Math.max(0, Math.min(sl.length - 1, deckFastPos)) : ci;
  // пока идёт мягкий вход в обзор (класс slow), за ручкой — с анимацией
  // (она догоняет плавно), потом — без неё, ровно с ручкой
  const follow = fxOn || (frac && deckFastFollow && !L.classList.contains('slow'));
  const key = [cur.id, hidden, deckFast, flow, Math.round(Z * 1000), Math.round(cx), Math.round(cy), sl.length, deckStripSig, Math.round(fpos * 1000)].join('|');
  if (key === deckDepthKey) return;
  const old = deckDepthKey.split('|');
  const animate = !follow && (cur.id !== deckDepthCurShown || hidden !== (old[1] === 'true') || deckFast !== (old[2] === 'true') || deckDepthFollowShown || frac);
  deckDepthKey = key; deckDepthCurShown = cur.id; deckDepthFollowShown = follow;

  const lo = Math.max(0, Math.floor(fpos) - 3), hi = Math.min(sl.length - 1, Math.ceil(fpos) + 3);
  const want = new Set();
  for (let i = lo; i <= hi; i++) want.add(sl[i].id);
  deckCards.forEach((c, id) => { if (!want.has(id)){ c.el.remove(); deckCards.delete(id); } });
  const rc = deckSlideRect(cur), alongCur = (flow === 'v' ? rc.h : rc.w) * Z;
  // размер элемента — при «вписан», остальное (масштаб, место) — одним
  // transform: тогда и отдаление в обзор, и возврат анимируются целиком
  const Zref = fz, zs = Z / Zref;
  // положение слайда на целом расстоянии k от текущего; дробное — между ними
  const pose = (k, alongN) => {
    if (k === 0) return { off: 0, ang: 0, sc: 1, op: hidden ? 1 : 0 };
    const a = Math.min(3, Math.abs(k)), sgn = Math.sign(k), ns = a === 1 ? p.s : p.s * .82;
    const peek1 = Math.max(DECK_PEEK_PX, p.peek * p.s * alongN);
    let off = alongCur / 2 + peek1 - ns * alongN / 2;
    if (a >= 2) off += p.peek * p.s * alongN * .62 + 14;
    if (a >= 3) off += alongN * .2;
    return { off: off * sgn, ang: p.tilt * (a >= 2 ? 1.25 : 1) * sgn, sc: ns, op: a === 1 ? p.op : a === 2 ? p.op2 : 0 };
  };
  for (let i = lo; i <= hi; i++){
    const s = sl[i], kf = i - fpos;
    let c = deckCards.get(s.id), fresh = false;
    if (!c){
      const el = document.createElement('canvas');
      el.className = 'deck-card';
      el.dataset.id = s.id;
      L.appendChild(el);
      c = { el, bw: 0, dirty: true };
      deckCards.set(s.id, c);
      fresh = true;
    }
    const r = deckSlideRect(s), w = r.w * Z, h = r.h * Z;
    const wr = r.w * Zref, hr = r.h * Zref, alongN = flow === 'v' ? h : w;
    c.want = w;
    const k0 = Math.floor(kf), t = kf - k0, A = pose(k0, alongN), Bp = t ? pose(k0 + 1, alongN) : A;
    const m = key2 => A[key2] + (Bp[key2] - A[key2]) * t;
    const off = m('off'), ang = m('ang'), sc = m('sc'), op = m('op'), a = Math.abs(kf);
    const tr = off ? (flow === 'v' ? `translateY(${off}px) ` : `translateX(${off}px) `) : '';
    const rot = ang ? (flow === 'v' ? `rotateX(${-ang}deg) ` : `rotateY(${ang}deg) `) : '';
    const el = c.el;
    // новый и центральный при выходе из листания — без анимации: холст
    // уже рисует слайд сам, картинка должна исчезнуть сразу
    el.classList.toggle('instant', fresh || !animate || (a < .5 && !hidden));
    el.className = el.className.replace(/\bk\d\b/g, '').trim() + ' k' + Math.min(Math.round(a), 3);
    el.style.width = wr + 'px'; el.style.height = hr + 'px';
    el.style.transform = `translate(${cx - wr / 2}px, ${cy - hr / 2}px) ${tr}${rot}scale(${sc * zs})`;
    el.style.opacity = op;
    // «максимум»: размытие растёт с удалённостью плавно, а не скачком на
    // середине пути (иначе при непрерывной прокрутке слайд «щёлкает»)
    el.style.filter = deckMaxFx() && a > .02 ? `blur(${(Math.min(a, 1) * 1.4 + Math.max(0, Math.min(a, 2) - 1)).toFixed(2)}px)` : '';
    el.style.zIndex = 100 - Math.round(a * 10);
    if (fresh || c.dirty || (c.bw && w * Math.min(2, window.devicePixelRatio || 1) > c.bw * 1.35 && c.bw < DECK_CARD_MAXW)) deckQueueCard(s.id);
  }
  if (animate) void L.offsetWidth;
}

// текущий слайд — свежей картинкой и сразу видимой (без проявления): холст
// его сейчас перестанет рисовать, и он должен уехать назад, а не моргнуть
function deckShowCurCard(){
  const cur = deckCur();
  if (!cur) return;
  deckDepthKey = '';
  deckDepthSync();
  const c = deckCards.get(cur.id);
  if (!c) return;
  deckRenderCard(cur.id, c.want);
  c.el.classList.add('instant');
  c.el.style.opacity = 1;
  void c.el.offsetWidth;
}
// перелистывание с анимацией «сосед выезжает вперёд, текущий уходит назад».
// Зовётся ДО смены текущего слайда
function deckFlipAnim(ms){
  const L = deckDepthLayer();
  if (!L || L.hidden || deckReducedMotion()) return false;
  ms = ms || DECK_ANIM_MS;
  if (!deckSlideHidden()) deckShowCurCard();
  deckAnimUntil = Math.max(deckAnimUntil, Date.now() + ms);
  clearTimeout(deckAnimTimer);
  deckAnimTimer = setTimeout(() => { deckAnimUntil = 0; scheduleRedraw(); }, deckAnimUntil - Date.now() + 20);
  return true;
}

/* ── ползунок быстрого листания справа (напротив ленты миниатюр) ──
   Ручка идёт ровно за мышью и прилипает к отметке слайда только совсем
   рядом. Быстрое листание (обзор с наклоном) — с первого сдвига ручки, не
   с нажатия; щелчок по дорожке без движения — просто переход */
const DECK_SCRUB_MOVE = 4, DECK_SCRUB_MAGNET = 8;
let deckScrubState = null;     // { y0, moved, onKnob }
let deckScrubTicks = -1;
function deckScrubSync(){
  const sc = document.getElementById('deckScrub'), knob = document.getElementById('deckKnob');
  if (!sc || !knob || sc.hidden) return;
  const n = deckSlides().length, i = deckCurIndex();
  if (n !== deckScrubTicks){
    deckScrubTicks = n;
    sc.querySelectorAll('.deck-scrub-tick').forEach(t => t.remove());
    const hgt = sc.clientHeight || 300;
    // отметки — пока между ними хотя бы 4 пикселя, иначе это сплошная полоса
    if (n > 1 && hgt / (n - 1) >= 4){
      for (let k = 0; k < n; k++){
        const t = document.createElement('span');
        t.className = 'deck-scrub-tick';
        t.style.top = (k / (n - 1) * 100) + '%';
        sc.appendChild(t);
      }
    }
    sc.setAttribute('aria-valuemax', n);
  }
  knob.textContent = i + 1;
  sc.setAttribute('aria-valuenow', i + 1);
  sc.classList.toggle('single', n <= 1);
  if (deckScrubState && deckScrubState.moved) return;
  knob.style.top = (n > 1 ? i / (n - 1) * 100 : 0) + '%';
}
(function(){
  const sc = document.getElementById('deckScrub'), knob = document.getElementById('deckKnob');
  if (!sc || !knob) return;
  function idxAt(clientY){
    const r = sc.getBoundingClientRect(), n = deckSlides().length;
    const y = Math.max(0, Math.min(r.height, clientY - r.top));
    return { y, r, n, i: n > 1 ? Math.round(y / r.height * (n - 1)) : 0 };
  }
  function follow(clientY){
    const { y, r, n, i } = idxAt(clientY);
    const tickY = n > 1 ? i / (n - 1) * r.height : 0;
    const snapped = Math.abs(y - tickY) < DECK_SCRUB_MAGNET;
    knob.style.top = (snapped ? tickY : y) + 'px';
    // «максимум эффектов»: стопка идёт за ручкой непрерывно, у отметки —
    // примагничивается к слайду
    if (deckFast && deckMaxFx()){
      deckFastFollow = !snapped;
      deckFastPos = snapped || n < 2 ? i : y / r.height * (n - 1);
      if (deckFx) deckFxStart(); else scheduleRedraw();
    }
    const s = deckSlides()[i];
    if (s && s.id !== deckCurId){
      deckShowSlide(s);
      scheduleRedraw();
    }
  }
  sc.addEventListener('pointerdown', (e) => {
    if (e.button > 0 || !isDeckBoard()) return;
    e.preventDefault();
    deckScrubState = { y0: e.clientY, moved: false, onKnob: !!e.target.closest('.deck-scrub-knob') };
    try { sc.setPointerCapture(e.pointerId); } catch (err) {}
  });
  sc.addEventListener('pointermove', (e) => {
    const st = deckScrubState;
    if (!st) return;
    if (!st.moved){
      if (Math.abs(e.clientY - st.y0) < DECK_SCRUB_MOVE) return;
      st.moved = true;
      sc.classList.add('drag');
      // в сплошной прокрутке соседи и так видны — без обзора
      if (deckCur() && !deckReducedMotion() && !deckIsScroll()){
        deckShowCurCard();
        if (deckMaxFx()){ deckFast = true; deckFastPos = Math.max(0, deckCurIndex()); deckFxStart(); }
        else { deckSlowFor(DECK_MODE_MS); deckFast = true; }
      }
      scheduleRedraw();
    }
    follow(e.clientY);
  });
  function end(e, cancel){
    const st = deckScrubState;
    if (!st) return;
    deckScrubState = null;
    sc.classList.remove('drag');
    if (st.moved){
      // обзор → свой масштаб, текущий слайд ещё 0,3 с картинкой
      if (deckFast && deckFx){
        // «максимум»: стопка плавно доезжает до слайда и приближается обратно
        deckFastPos = null; deckFastFollow = false; deckFast = false; deckFxStart();
      } else if (deckFast){ deckFastPos = null; deckFastFollow = false; deckSlowFor(DECK_MODE_MS); deckFlipAnim(DECK_MODE_MS); deckFast = false; }
      rememberView();
      scheduleRedraw();
      return;
    }
    if (!cancel && !st.onKnob && e){
      const { i } = idxAt(e.clientY), c = deckCurIndex();
      if (i !== c) deckGo(i, i > c ? 1 : -1);
    }
  }
  sc.addEventListener('pointerup', (e) => end(e, false));
  sc.addEventListener('pointercancel', (e) => end(e, true));
  sc.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight'){ e.preventDefault(); e.stopPropagation(); deckStep(1); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft'){ e.preventDefault(); e.stopPropagation(); deckStep(-1); }
  });
})();

// щелчок по выглядывающему соседу — перейти на него. Только мимо самого
// слайда: на слайде пишут, как всегда
(function(){
  const cv = document.getElementById('boardCv');
  if (!cv) return;
  cv.addEventListener('pointerdown', (e) => {
    if (!isDeckBoard() || !boardActive || deckSlideHidden() || e.button > 0) return;
    const cur = deckCur();
    if (!cur) return;
    const r = deckSlideRect(cur), cr = cv.getBoundingClientRect();
    const x = (e.clientX - cr.left) / cam.zoom + cam.x, y = (e.clientY - cr.top) / cam.zoom + cam.y;
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return;
    const sl = deckSlides(), ci = sl.indexOf(cur);
    let hit = -1, best = -1;
    deckCards.forEach((c, id) => {
      const i = sl.findIndex(s => s.id === id);
      if (i === ci || Math.abs(i - ci) > 2 || parseFloat(c.el.style.opacity) < .05) return;
      const b = c.el.getBoundingClientRect();
      if (e.clientX >= b.left && e.clientX <= b.right && e.clientY >= b.top && e.clientY <= b.bottom){
        // ближний сосед лежит поверх дальнего
        const pri = 3 - Math.abs(i - ci);
        if (pri > best){ best = pri; hit = i; }
      }
    });
    if (hit < 0) return;
    e.preventDefault(); e.stopImmediatePropagation();
    deckGo(hit, hit > ci ? 1 : -1);
  }, true);
})();

/* ═══════════════════════════════════════════════════════════════════════
   СПЛОШНАЯ ПРОКРУТКА (промпт №86): слайды столбиком в порядке показа, как
   страницы PDF, колесо прокручивает плавно. Слоты на полотне не двигаются:
   у каждого слайда свой сдвиг «столбик ↔ полотно» (deckScrollLayout).
   Камера всегда в координатах ТЕКУЩЕГО слайда, поэтому рисование, выделение,
   ручки, текст и задания работают на нём без переделки; остальные видимые
   слайды рисуются копией камеры со своим сдвигом. Когда середина экрана
   переходит на другой слайд или его касаются, камера незаметно
   пересчитывается в его координаты — на экране ничего не дёргается
   ═══════════════════════════════════════════════════════════════════════ */
const DECK_SCROLL_GAP_CELLS = 2;
let deckPointerDown = false;

function deckIsScroll(){ return deckFlow() === 'scroll'; }
// столбик: где каждый слайд, в координатах столбика; off — что прибавить к
// мировой точке слайда, чтобы получить точку столбика
function deckScrollLayout(){
  const sl = deckSlides(), cell = B.cellSize || 24, gap = DECK_SCROLL_GAP_CELLS * cell;
  let Wmax = 0;
  sl.forEach(s => { Wmax = Math.max(Wmax, s.w * cell); });
  const off = new Map();
  let y = 0;
  sl.forEach(s => {
    const r = deckSlideRect(s);
    off.set(s.id, { x: (Wmax - r.w) / 2 - r.x, y: y - r.y, top: y, h: r.h });
    y += r.h + gap;
  });
  return { off, Wmax, H: Math.max(0, y - gap) };
}
function deckScrollFit(L){
  const a = deckArea();
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, a.w / Math.max(1, L.Wmax)));
}
// замена deckClampCam в сплошной прокрутке. keep — не менять текущий слайд
// (только что перешли на него кнопкой, щелчком, ползунком)
function deckScrollClamp(keep){
  const sl = deckSlides();
  if (!sl.length) return;
  const L = deckScrollLayout(), a = deckArea(), fit = deckScrollFit(L);
  cam.zoom = Math.max(fit * DECK_ZMIN, Math.min(ZOOM_MAX, cam.zoom || fit));
  const z = cam.zoom;
  let cur = deckCur(), oc = L.off.get(cur.id);
  let dx = cam.x + oc.x, dy = cam.y + oc.y;          // камера в координатах столбика
  const m = 24 / z;
  if (a.w / z >= L.Wmax) dx = L.Wmax / 2 - (a.x + a.w / 2) / z;
  else dx = clamp(dx, -a.x / z - m, L.Wmax + m - (a.x + a.w) / z);
  const minY = -a.y / z - m, maxY = L.H + m - (a.y + a.h) / z;
  dy = maxY < minY ? (minY + maxY) / 2 : clamp(dy, minY, maxY);
  // текущий — слайд у середины свободной области. Пока палец или перо на
  // холсте, что-то выделено или правится текст — не меняем: штрих, рамка
  // выделения и поле ввода живут в координатах своего слайда
  const busy = deckPointerDown || selectedId || (multiSelectIds && multiSelectIds.length) || (typeof textEditSession !== 'undefined' && textEditSession);
  if (!keep && !busy){
    const mid = dy + (a.y + a.h / 2) / z;
    let best = cur, bd = Infinity;
    sl.forEach(s => {
      const o = L.off.get(s.id);
      const d = mid < o.top ? o.top - mid : mid > o.top + o.h ? mid - o.top - o.h : 0;
      if (d < bd){ bd = d; best = s; }
    });
    cur = best; deckCurId = cur.id; oc = L.off.get(cur.id);
  }
  cam.x = dx - oc.x; cam.y = dy - oc.y;
  deckFitted = false; deckZf = 1;
}
// показать слайд: верх слайда — у верха свободной области
function deckScrollTo(s, fitZoom){
  const L = deckScrollLayout(), a = deckArea(), o = L.off.get(s.id);
  if (!o) return;
  if (fitZoom || !cam.zoom) cam.zoom = deckScrollFit(L);
  deckCurId = s.id;
  const z = Math.max(deckScrollFit(L) * DECK_ZMIN, cam.zoom);
  cam.zoom = z;
  cam.x = (L.Wmax / 2 - (a.x + a.w / 2) / z) - o.x;
  cam.y = (o.top - (a.y + 12) / z) - o.y;
  deckScrollClamp(true);
}
// переход на слайд в любом режиме листания
function deckShowSlide(s){
  if (deckIsScroll()) deckScrollTo(s);
  else { deckCurId = s.id; deckFitCam(s, deckZf); deckFitted = true; }
}

// остальные видимые слайды — до текущего (его нарисует render() как обычно)
function deckRenderScrollOthers(c, camv, w, h){
  const L = deckScrollLayout(), cur = deckCur();
  if (!cur) return;
  const oc = L.off.get(cur.id), z = camv.zoom;
  const dy0 = camv.y + oc.y, dy1 = dy0 + h / z;
  deckSlides().forEach(s => {
    if (s.id === cur.id) return;
    const o = L.off.get(s.id);
    if (o.top > dy1 || o.top + o.h < dy0) return;
    const cv = { x: camv.x + oc.x - o.x, y: camv.y + oc.y - o.y, zoom: z };
    activeCam = cv;
    deckDrawPaper(c, s, cv);
    const r = deckSlideRect(s);
    const p0 = worldToScreen({ x: r.x, y: r.y }), p1 = worldToScreen({ x: r.x + r.w, y: r.y + r.h });
    c.save();
    c.beginPath(); c.rect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y); c.clip();
    deckInkOnDark = deckIsDarkBg(s);
    const pad = 80 / z, vx0 = cv.x - pad, vy0 = cv.y - pad, vx1 = cv.x + w / z + pad, vy1 = cv.y + h / z + pad;
    B.objects.forEach(ob => {
      if (ob.type === 'deck') return;
      const b = objectBBox(ob);
      if (b.maxX < vx0 || b.minX > vx1 || b.maxY < vy0 || b.minY > vy1) return;
      renderObject(c, ob, cv);
    });
    c.restore();
  });
  activeCam = camv;
  deckInkSync();
}

// касание другого слайда — сначала делаем его текущим (камера в его
// координатах), потом доска обрабатывает касание как обычно
(function(){
  const cv = document.getElementById('boardCv');
  if (!cv) return;
  cv.addEventListener('pointerdown', (e) => {
    if (!isDeckBoard() || !boardActive || !deckIsScroll()) return;
    deckPointerDown = true;
    const L = deckScrollLayout(), cur = deckCur();
    if (!cur) return;
    const cr = cv.getBoundingClientRect(), oc = L.off.get(cur.id);
    const dy = (e.clientY - cr.top) / cam.zoom + cam.y + oc.y;
    const s = deckSlides().find(x => { const o = L.off.get(x.id); return dy >= o.top && dy <= o.top + o.h; });
    if (!s || s.id === cur.id) return;
    const o = L.off.get(s.id);
    cam.x += oc.x - o.x; cam.y += oc.y - o.y;
    deckCurId = s.id;
    scheduleRedraw();
  }, true);
  const up = () => { deckPointerDown = false; };
  window.addEventListener('pointerup', up, true);
  window.addEventListener('pointercancel', up, true);
})();

/* ═══════════════════════════════════════════════════════════════════════
   ФОРМАТ И ПОДЛОЖКА СЛАЙДА (промпт №87). Кнопка в полосе листания →
   окно: формат (готовые и свой в сантиметрах, 1 клетка = 0,5 см),
   подложка, цвет линий, «этот слайд / все слайды». Смена формата объекты
   не двигает: левый верхний угол слайда на месте, вышедшее за край
   обрезается при показе, но не удаляется. Своя картинка-подложка —
   закреплённое изображение в самом низу слайда (поле bgOf), а не строка в
   объекте deck: иначе вся картинка уходила бы в облако при каждом листании
   ═══════════════════════════════════════════════════════════════════════ */
const DECK_FORMATS = { '64x36': [64, 36], '56x42': [56, 42], '40x57': [40, 57], '57x40': [57, 40], '48x48': [48, 48] };
const DECK_DARK_PAPER = '#1B2230', DECK_DARK_INK = '#F2F3F5';
// перо по умолчанию ('--pencil') на тёмной подложке рисуется светлым;
// ставит deckClipSlide для слайда, который сейчас рисуется (resolveColor)
let deckInkOnDark = false;
// миниатюра, соседняя карточка или соседний слайд в сплошной прокрутке
// рисуются со своим флагом — после них флаг снова по ТЕКУЩЕМУ слайду: по нему
// цвет пера в палитре и курсоре (иначе на тёмном слайде перо иногда
// становилось тёмным, если последней дорисовалась миниатюра светлого)
function deckInkSync(){ const s = deckCur(); deckInkOnDark = !!s && deckIsDarkBg(s); }
// №98: подложка «цвет» (bg.f) — фон слайда из PowerPoint. Тёмный цвет —
// перо по умолчанию светлое, как на тёмной подложке
function deckPaperColor(s){
  const k = deckBgKind(s);
  if (k === 'dark') return DECK_DARK_PAPER;
  if (k === 'fill' && s.bg.f) return s.bg.f;
  return themeVar('--paper');
}
function deckIsDarkBg(s){
  const k = deckBgKind(s);
  if (k === 'dark') return true;
  return k === 'fill' && typeof bxLuma === 'function' && bxLuma(s.bg.f) < 0.45;
}

function deckBgKind(s){ return (s && s.bg && s.bg.k) || 'grid'; }
function deckLineColor(s){
  if (s.bg && s.bg.c) return s.bg.c;
  if (deckIsDarkBg(s)) return 'rgba(255,255,255,.16)';
  return B.gridColor ? resolveColor(B.gridColor) : themeVar('--grid');
}
// узор подложки по клеткам слайда; p0/p1 — его углы на экране
// №87г: шаг узора — slide.bg.s в клетках (клетка = 0,5 см), меняется
// ползунком. По умолчанию: клетка, линейка, точки — 1 клетка, широкая — 2,
// косая (прописи) — 1 (высота рабочей строки)
const DECK_BG_STEP = { grid: 1, thin: 1, wide: 2, dots: 1, kosaya: 1 };
const DECK_STEP_MIN = .5, DECK_STEP_MAX = 6;
function deckBgStepCells(s){
  const k = deckBgKind(s);
  const v = s.bg && typeof s.bg.s === 'number' ? s.bg.s : DECK_BG_STEP[k];
  return Math.max(DECK_STEP_MIN, Math.min(DECK_STEP_MAX, v || 1));
}
function deckDrawPattern(c, s, r, p0, p1, camv){
  const k = deckBgKind(s), cs = B.cellSize;
  if (!DECK_BG_STEP[k]) return;
  const u = deckBgStepCells(s) * cs, upx = u * camv.zoom;
  c.save();
  c.beginPath(); c.rect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y); c.clip();
  c.strokeStyle = c.fillStyle = deckLineColor(s);
  c.lineWidth = 1; c.globalAlpha = 0.55;
  const hLine = y => {
    const sy = Math.round(worldToScreen({ x: 0, y }).y) + 0.5;
    c.beginPath(); c.moveTo(p0.x, sy); c.lineTo(p1.x, sy); c.stroke();
  };
  const hLines = step => { for (let y = r.y + step; y < r.y + r.h - 0.5; y += step) hLine(y); };
  if (k === 'grid' && upx > 4){
    for (let x = r.x; x <= r.x + r.w + 0.5; x += u){
      const sx = Math.round(worldToScreen({ x, y: 0 }).x) + 0.5;
      c.beginPath(); c.moveTo(sx, p0.y); c.lineTo(sx, p1.y); c.stroke();
    }
    hLines(u);
  } else if (k === 'thin' && upx > 3){
    hLines(u);
  } else if (k === 'wide' && upx > 3){
    c.globalAlpha = 0.8;
    hLines(u);
    // поле тетради — красная линия слева
    const mx = Math.round(worldToScreen({ x: r.x + cs * 5, y: 0 }).x) + 0.5;
    c.strokeStyle = 'rgba(255,59,48,.5)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(mx, p0.y); c.lineTo(mx, p1.y); c.stroke();
  } else if (k === 'dots' && upx > 5){
    c.globalAlpha = 0.9;
    const d = Math.max(1.4, Math.min(2.6, upx * 0.09));
    for (let x = r.x + u; x < r.x + r.w - 0.5; x += u){
      const sx = worldToScreen({ x, y: 0 }).x;
      for (let y = r.y + u; y < r.y + r.h - 0.5; y += u){
        const sy = worldToScreen({ x: 0, y }).y;
        c.fillRect(sx - d / 2, sy - d / 2, d, d);
      }
    }
  } else if (k === 'kosaya' && upx > 2){
    // косая линейка прописей: строка — две основные линии (рабочая строка
    // высотой u) и по вспомогательной сверху и снизу, между строками
    // промежуток; плюс наклонные под 65° для наклона букв
    for (let y0 = r.y; y0 + u * 4 < r.y + r.h; y0 += u * 5){
      c.globalAlpha = 0.4; hLine(y0 + u); hLine(y0 + u * 4);
      c.globalAlpha = 0.9; hLine(y0 + u * 2); hLine(y0 + u * 3);
    }
    c.globalAlpha = 0.3;
    const k65 = 1 / Math.tan(65 * Math.PI / 180), dxAll = r.h * k65;
    for (let x = r.x - dxAll; x < r.x + r.w; x += u * 3){
      const a = worldToScreen({ x, y: r.y + r.h }), b = worldToScreen({ x: x + dxAll, y: r.y });
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    }
  }
  c.restore();
}

// ── картинка-подложка: закреплённое изображение во весь слайд ──
function deckBgImgObj(s){ return s.bg && s.bg.img ? B.objects.find(o => o.id === s.bg.img) : null; }
function deckRemoveBgImg(s){
  if (!s.bg || !s.bg.img) return;
  const id = s.bg.img;
  B.objects = B.objects.filter(o => o.id !== id);
}
function deckFitBgImg(s){
  const o = deckBgImgObj(s);
  if (!o) return;
  const r = deckSlideRect(s);
  o.points = [{ x: r.x, y: r.y }]; o.w = r.w; o.h = r.h;
}

function deckScopeAll(){ return document.querySelector('input[name="deckScope"]:checked')?.value === 'all'; }
// одна правка списка слайдов — один шаг отмены
function deckApplySlides(fn){
  const d = deckObj();
  if (!d || !deckMayEdit()) return;
  pushUndo();
  const list = deckScopeAll() ? d.slides : [deckCur()].filter(Boolean);
  list.forEach(fn);
  saveDB();
  deckMarkCardsDirty([...deckCards.keys()]);
  const s = deckCur();
  if (s && (deckFitted || deckIsScroll())) deckShowSlide(s); else clampCam();
  scheduleRedraw();
  deckSyncPop();
}
function deckSetFormat(w, h){
  w = Math.max(4, Math.min(DECK_MAX_CELLS, Math.round(w)));
  h = Math.max(4, Math.min(DECK_MAX_CELLS, Math.round(h)));
  deckApplySlides(s => { s.w = w; s.h = h; deckFitBgImg(s); });
}
function deckSetBg(k){
  deckApplySlides(s => {
    deckRemoveBgImg(s);
    const c = s.bg && s.bg.c;
    s.bg = { k };
    if (c) s.bg.c = c;
  });
}
let deckStepUndoDone = false;
function deckSetStep(cells, live){
  const d = deckObj();
  if (!d || !deckMayEdit()) return;
  if (!deckStepUndoDone){ pushUndo(); deckStepUndoDone = true; }
  if (!live) deckStepUndoDone = false;
  const v = Math.max(DECK_STEP_MIN, Math.min(DECK_STEP_MAX, cells));
  (deckScopeAll() ? d.slides : [deckCur()].filter(Boolean)).forEach(s => {
    if (!DECK_BG_STEP[deckBgKind(s)]) return;
    s.bg = Object.assign({}, s.bg, { s: v });
  });
  saveDB();
  deckMarkCardsDirty([...deckCards.keys()]);
  scheduleRedraw();
  deckSyncPop();
}
function deckSetLines(c){
  deckApplySlides(s => {
    s.bg = Object.assign({}, s.bg || { k: 'grid' });
    if (c) s.bg.c = c; else delete s.bg.c;
  });
}
async function deckSetBgImage(file){
  if (!file || !deckMayEdit()) return;
  let src, size;
  try { src = await fileToDataUrl(file); size = await loadImageSize(src); }
  catch (e) { alert('Не удалось открыть картинку: ' + (e && e.message || e)); return; }
  deckApplySlides(s => {
    deckRemoveBgImg(s);
    const r = deckSlideRect(s), o = {
      id: uid(), type: 'image', src, points: [{ x: r.x, y: r.y }], w: r.w, h: r.h,
      natW: size && size.w, natH: size && size.h, locked: true, bgOf: s.id,
    };
    // сразу за объектом deck — в самом низу, под всем, что на слайде
    const di = B.objects.findIndex(x => x.type === 'deck');
    B.objects.splice(di + 1, 0, o);
    s.bg = { k: 'img', img: o.id };
  });
}

// ── окно «Слайд» ──
function deckSyncPop(){
  const pop = document.getElementById('deckSlidePop');
  if (!pop || pop.hidden) return;
  const s = deckCur();
  if (!s) return;
  const key = s.w + 'x' + s.h, isStd = !!DECK_FORMATS[key], can = deckMayEdit();
  pop.querySelectorAll('[data-fmt]').forEach(b => {
    b.setAttribute('aria-pressed', b.dataset.fmt === key || (b.dataset.fmt === 'custom' && !isStd));
    b.disabled = !can;
  });
  pop.querySelectorAll('[data-ufmt]').forEach(b => {
    const f = deckPresets.formats.find(x => x.id === b.dataset.ufmt);
    b.setAttribute('aria-pressed', !!f && f.w === s.w && f.h === s.h);
    b.disabled = !can;
  });
  pop.querySelectorAll('[data-ubg], [data-tpl]').forEach(b => { b.disabled = !can; });
  const k = deckBgKind(s);
  pop.querySelectorAll('[data-bg]').forEach(b => { b.setAttribute('aria-pressed', b.dataset.bg === k); b.disabled = !can; });
  const c = (s.bg && s.bg.c) || '';
  pop.querySelectorAll('[data-lc]').forEach(b => { b.setAttribute('aria-pressed', b.dataset.lc === c); b.disabled = !can; });
  const cw = document.getElementById('deckCW'), ch = document.getElementById('deckCH');
  if (cw && document.activeElement !== cw) cw.value = s.w / 2;
  if (ch && document.activeElement !== ch) ch.value = s.h / 2;
  // поля своего размера: открылись «Своим…» — так и остаются (видно размер
  // любого формата), «−» прячет их обратно
  document.getElementById('deckCustom').hidden = !!pop.dataset.customHide || (isStd && !pop.dataset.custom);
  // ползунок шага — только у узоров (клетка, линейки, точки, косая)
  const stepRow = document.getElementById('deckStepRow'), hasStep = !!DECK_BG_STEP[k];
  if (stepRow){
    stepRow.hidden = !hasStep;
    const inp = document.getElementById('deckStep');
    if (hasStep && document.activeElement !== inp){ inp.value = deckBgStepCells(s); }
    if (hasStep){
      const cm = deckBgStepCells(s) / 2;
      document.getElementById('deckStepV').textContent = (Math.round(cm * 100) / 100).toString().replace('.', ',') + ' см';
      document.getElementById('deckStepLabel').textContent = k === 'grid' ? 'Размер клетки' : k === 'dots' ? 'Шаг точек' : k === 'kosaya' ? 'Высота строки' : 'Между линиями';
    }
    inp.disabled = !can;
  }
}
function deckOpenPop(open){
  const pop = document.getElementById('deckSlidePop'), btn = document.getElementById('deckSlideBtn');
  if (!pop) return;
  pop.hidden = !open;
  if (btn) btn.setAttribute('aria-expanded', open);
  if (open){ delete pop.dataset.custom; delete pop.dataset.customHide; deckSyncPop(); }
}
(function(){
  const pop = document.getElementById('deckSlidePop'), btn = document.getElementById('deckSlideBtn');
  if (!pop || !btn) return;
  btn.addEventListener('click', () => deckOpenPop(pop.hidden));
  pop.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.fmt === 'custom'){ pop.dataset.custom = '1'; delete pop.dataset.customHide; deckSyncPop(); document.getElementById('deckCW')?.focus(); return; }
    if (b.id === 'deckCustomHide'){ delete pop.dataset.custom; pop.dataset.customHide = '1'; deckSyncPop(); return; }
    if (b.dataset.fmt){ const f = DECK_FORMATS[b.dataset.fmt]; if (f) deckSetFormat(f[0], f[1]); return; }
    if (b.dataset.bg === 'img'){ const inp = document.getElementById('deckBgFile'); inp.value = ''; inp.click(); return; }
    if (b.dataset.bg){ deckSetBg(b.dataset.bg); return; }
    if (b.dataset.lc !== undefined){ deckSetLines(b.dataset.lc); return; }
    if (b.id === 'deckCApply'){
      const w = parseFloat(String(document.getElementById('deckCW').value).replace(',', '.'));
      const h = parseFloat(String(document.getElementById('deckCH').value).replace(',', '.'));
      if (isFinite(w) && isFinite(h) && w > 0 && h > 0) deckSetFormat(w * 2, h * 2);
    }
  });
  pop.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.target.id === 'deckCW' || e.target.id === 'deckCH')){ e.preventDefault(); document.getElementById('deckCApply').click(); }
  });
  const step = document.getElementById('deckStep');
  if (step){
    step.addEventListener('input', () => deckSetStep(parseFloat(step.value), true));
    step.addEventListener('change', () => deckSetStep(parseFloat(step.value), false));
  }
  document.getElementById('deckBgFile')?.addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) deckSetBgImage(f);
  });
  document.addEventListener('pointerdown', (e) => {
    if (pop.hidden || pop.contains(e.target) || btn.contains(e.target)) return;
    deckOpenPop(false);
  }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) deckOpenPop(false); });
})();

/* ═══════════════════════════════════════════════════════════════════════
   СВОИ ШАБЛОНЫ (промпт №87б). Всё, что собрал сам, сохраняется и потом
   выбирается рядом со встроенным:
   - слайд целиком (формат, подложка, текст, картинки, их расстановка) —
     «Сохранить как шаблон» в меню слайда; «Новый слайд из шаблона» в окне
     «Слайд» (первым — «Пустой слайд»)
   - подложка (узор, цвет линий, картинка) — «Мои подложки»
   - формат («Свой…») — «Мои форматы»
   Хранятся в IndexedDB этого браузера одной записью deckPresets (как доски,
   не в облаке). Объекты шаблона — в координатах от левого верхнего угла
   слайда, поэтому шаблон подходит к любому слоту
   ═══════════════════════════════════════════════════════════════════════ */
const DECK_PRESETS_KEY = 'deckPresets';
let deckPresets = { slides: [], bgs: [], formats: [], gone: [] };
let deckPresetsLoaded = false;

/* №87в: шаблоны привязаны к аккаунту. Вошли — главная копия в облаке
   (таблица deck_templates, deck-templates-schema.sql), в браузере — её
   копия под ключом deckPresets:<id аккаунта>: окно открывается сразу и
   работает без связи. Сохранённое без связи помечено _dirty и уедет при
   следующей возможности; удалённое ждёт в gone. Без входа (или пока
   таблицы нет) — только браузер, ключ deckPresets, как раньше; при первом
   входе это всё уезжает в аккаунт */
const DECK_TPL_TABLE = 'deck_templates';
const DECK_TPL_KINDS = [['slides', 'slide'], ['bgs', 'bg'], ['formats', 'format']];
let deckPresetsUser = null;     // чей набор загружен: id аккаунта или '' (без входа)
let deckCloudOff = false;       // таблицы ещё нет — молча работаем в браузере
let deckPushing = null;

function deckUserId(){ return (window.CURRENT_USER && window.CURRENT_USER.id) || ''; }
function deckPresetsKey(u){ return u ? DECK_PRESETS_KEY + ':' + u : DECK_PRESETS_KEY; }
function deckNormPresets(v){ return { slides: (v && v.slides) || [], bgs: (v && v.bgs) || [], formats: (v && v.formats) || [], gone: (v && v.gone) || [] }; }
// id шаблона — uuid, его же получит строка в облаке
function deckNewPresetId(){
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  const b = new Uint8Array(16);
  (window.crypto || {}).getRandomValues ? crypto.getRandomValues(b) : b.forEach((_, i) => { b[i] = Math.random() * 256 | 0; });
  b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
  const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
function deckCloudOn(){ return !!(window.SB && deckPresetsUser && !deckCloudOff); }
function deckCloudFail(err){
  const msg = String((err && (err.message || err.code)) || err);
  // таблицы нет (SQL ещё не выполнен) — больше не пытаемся до перезагрузки
  if (/deck_templates|42P01|PGRST20[45]|does not exist|schema cache/i.test(msg)) deckCloudOff = true;
  console.warn('Шаблоны презентаций: облако недоступно —', msg);
}

function deckLoadPresets(force){
  const u = deckUserId();
  if (deckPresetsLoaded && deckPresetsUser === u && !force) return Promise.resolve();
  deckPresetsUser = u;
  return idbGet(deckPresetsKey(u)).then(v => {
    if (deckPresetsUser !== u) return;
    deckPresets = deckNormPresets(v);
    deckPresetsLoaded = true;
    deckRenderPresets();
    if (u) return deckCloudPull(u);
  }).catch(() => { deckPresetsLoaded = true; });
}
function deckSavePresets(){
  deckRenderPresets();
  return idbPut(deckPresetsKey(deckPresetsUser), deckPresets)
    .catch(e => alert('Не удалось сохранить шаблон: ' + (e && e.message || e)))
    .then(() => deckCloudPush());
}
// в облако — то, что ещё не там, и удаления. Один проход за раз
function deckCloudPush(){
  if (!deckCloudOn()) return Promise.resolve();
  if (deckPushing) return deckPushing.then(() => deckCloudPush());
  const u = deckPresetsUser;
  deckPushing = (async () => {
    for (const [k, kind] of DECK_TPL_KINDS){
      for (const p of deckPresets[k].slice()){
        if (!p._dirty) continue;
        const { id, name, _dirty, ...data } = p;
        const { error } = await window.SB.from(DECK_TPL_TABLE).upsert({ id, kind, name, data });
        if (error){ deckCloudFail(error); return; }
        delete p._dirty;
      }
    }
    for (const id of deckPresets.gone.slice()){
      const { error } = await window.SB.from(DECK_TPL_TABLE).delete().eq('id', id);
      if (error){ deckCloudFail(error); return; }
      deckPresets.gone = deckPresets.gone.filter(x => x !== id);
    }
    if (deckPresetsUser === u) await idbPut(deckPresetsKey(u), deckPresets).catch(() => {});
  })().catch(deckCloudFail).finally(() => { deckPushing = null; });
  return deckPushing;
}
// при открытии: шаблоны без входа — в аккаунт, несохранённое — в облако,
// потом список из облака (там то, что сохранено и на других устройствах)
async function deckCloudPull(u){
  if (!window.SB || deckCloudOff) return;
  try {
    const old = await idbGet(DECK_PRESETS_KEY);
    if (old && DECK_TPL_KINDS.some(([k]) => (old[k] || []).length)){
      DECK_TPL_KINDS.forEach(([k]) => (old[k] || []).forEach(p => deckPresets[k].push(Object.assign({}, p, { id: deckNewPresetId(), _dirty: true }))));
      await idbPut(deckPresetsKey(u), deckPresets);
      await idbDelete(DECK_PRESETS_KEY);
    }
  } catch (e) {}
  await deckCloudPush();
  if (deckCloudOff || deckPresetsUser !== u) return;
  let res;
  try { res = await window.SB.from(DECK_TPL_TABLE).select('id,kind,name,data,created_at').order('created_at', { ascending: false }); }
  catch (e) { deckCloudFail(e); return; }
  if (res.error){ deckCloudFail(res.error); return; }
  if (deckPresetsUser !== u) return;
  const fresh = deckNormPresets({ gone: deckPresets.gone });
  (res.data || []).forEach(r => {
    const pair = DECK_TPL_KINDS.find(([, kind]) => kind === r.kind);
    if (pair && !deckPresets.gone.includes(r.id)) fresh[pair[0]].push(Object.assign({}, r.data, { id: r.id, name: r.name }));
  });
  // не уехавшее (нет связи) — остаётся и уедет потом
  DECK_TPL_KINDS.forEach(([k]) => deckPresets[k].filter(p => p._dirty && !fresh[k].some(x => x.id === p.id)).forEach(p => fresh[k].unshift(p)));
  deckPresets = fresh;
  await idbPut(deckPresetsKey(u), deckPresets).catch(() => {});
  deckRenderPresets();
}
let deckToastTimer = null;
function deckToast(msg){
  const t = document.getElementById('deckToast');
  if (!t) return;
  t.textContent = msg; t.hidden = false;
  clearTimeout(deckToastTimer);
  deckToastTimer = setTimeout(() => { t.hidden = true; }, 2200);
}
function deckMoveObj(o, dx, dy){
  o.points = (o.points || []).map(p => ({ x: p.x + dx, y: p.y + dy }));
  if (o.ctrl) o.ctrl = { x: o.ctrl.x + dx, y: o.ctrl.y + dy };
}
function deckAskName(def){
  const v = prompt('Название шаблона:', def || '');
  return v && v.trim() ? v.trim().slice(0, 60) : null;
}
// маленькая картинка слайда для плитки шаблона
function deckPreviewOf(s){
  const r = deckSlideRect(s), w = 160, h = Math.max(20, Math.round(160 * r.h / r.w));
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  deckRenderSlideId = s.id;
  try { render(cv.getContext('2d'), w, h, { x: r.x, y: r.y, zoom: w / r.w, minLine: 1 }, false, 1); }
  catch (e) {}
  finally { deckRenderSlideId = null; activeCam = cam; deckInkSync(); }
  try { return cv.toDataURL('image/jpeg', 0.8); } catch (e) { return ''; }
}

// ── слайд целиком ──
function deckSaveSlideTemplate(id){
  const s = deckSlides().find(x => x.id === id);
  if (!s) return;
  const name = deckAskName(s.name || 'Мой слайд');
  if (!name) return;
  const r = deckSlideRect(s), bgObj = deckBgImgObj(s);
  const objects = deckSlotObjects(s).filter(o => !o.bgOf).map(o => {
    const c = JSON.parse(JSON.stringify(o));
    delete c.by; delete c.stack;
    deckMoveObj(c, -r.x, -r.y);
    return c;
  });
  const bg = Object.assign({}, s.bg || { k: 'grid' });
  delete bg.img;
  deckLoadPresets().then(() => {
    deckPresets.slides.unshift({ id: deckNewPresetId(), _dirty: true, name, w: s.w, h: s.h, bg, bgImg: bgObj ? bgObj.src : null, objects, preview: deckPreviewOf(s), at: nowTs() });
    deckSavePresets();
    deckToast('Шаблон «' + name + '» сохранён');
  });
}
// новый слайд после текущего; t = null — «Пустой слайд» текущего формата
function deckAddFromTemplate(t){
  const d = deckObj();
  if (!d || !deckMayEdit()) return;
  pushUndo();
  const cur = deckCur(), ns = deckNewSlide(deckNextSlot(d), cur);
  if (t){
    ns.w = t.w; ns.h = t.h;
    ns.bg = Object.assign({}, t.bg || { k: 'grid' });
    if (ns.bg.k === 'img' && !t.bgImg) ns.bg = { k: 'plain' };
  } else ns.bg = { k: 'plain' };
  const idx = deckCurIndex() + 1;
  d.slides.splice(idx, 0, ns);
  const r = deckSlideRect(ns);
  if (t){
    const groups = {};
    (t.objects || []).forEach(o => {
      const c = JSON.parse(JSON.stringify(o));
      c.id = uid();
      if (c.groupId) c.groupId = groups[c.groupId] || (groups[c.groupId] = uid());
      deckMoveObj(c, r.x, r.y);
      B.objects.push(c);
    });
    if (t.bgImg) deckPutBgImg(ns, t.bgImg);
  }
  saveDB();
  deckGo(idx, 1);
}

// ── подложка и формат ──
function deckPutBgImg(s, src, size){
  const r = deckSlideRect(s), o = {
    id: uid(), type: 'image', src, points: [{ x: r.x, y: r.y }], w: r.w, h: r.h,
    natW: size && size.w, natH: size && size.h, locked: true, bgOf: s.id,
  };
  B.objects.splice(B.objects.findIndex(x => x.type === 'deck') + 1, 0, o);
  s.bg = { k: 'img', img: o.id };
}
function deckSaveBgPreset(){
  const s = deckCur();
  if (!s) return;
  const name = deckAskName('Моя подложка');
  if (!name) return;
  const bg = Object.assign({}, s.bg || { k: 'grid' }), o = deckBgImgObj(s);
  delete bg.img;
  deckLoadPresets().then(() => {
    deckPresets.bgs.unshift({ id: deckNewPresetId(), _dirty: true, name, bg, img: o ? o.src : null, at: nowTs() });
    deckSavePresets();
    deckToast('Подложка «' + name + '» сохранена');
  });
}
function deckApplyBgPreset(p){
  deckApplySlides(s => {
    deckRemoveBgImg(s);
    if (p.img) deckPutBgImg(s, p.img);
    else s.bg = Object.assign({}, p.bg);
  });
}
function deckSaveFormatPreset(){
  const s = deckCur();
  if (!s) return;
  const name = deckAskName((s.w / 2) + ' × ' + (s.h / 2) + ' см');
  if (!name) return;
  deckLoadPresets().then(() => {
    deckPresets.formats.unshift({ id: deckNewPresetId(), _dirty: true, name, w: s.w, h: s.h, at: nowTs() });
    deckSavePresets();
    deckToast('Формат «' + name + '» сохранён');
  });
}
function deckDeletePreset(kind, id){
  const list = deckPresets[kind], p = list && list.find(x => x.id === id);
  if (!p || !confirm('Удалить «' + p.name + '»?')) return;
  deckPresets[kind] = list.filter(x => x.id !== id);
  if (deckPresetsUser) deckPresets.gone.push(id);
  deckSavePresets();
}
function deckRenamePreset(kind, id){
  const p = (deckPresets[kind] || []).find(x => x.id === id);
  if (!p) return;
  const name = deckAskName(p.name);
  if (!name) return;
  p.name = name; p._dirty = true;
  deckSavePresets();
}

// ── плитки в окне «Слайд» ──
function deckRenderPresets(){
  const tl = document.getElementById('deckTplList'), bl = document.getElementById('deckMyBgs'), fl = document.getElementById('deckMyFmts');
  const x = (kind, id) => `<span class="deck-ux" data-del="${kind}" data-id="${id}" title="Удалить" role="button" aria-label="Удалить">×</span>`;
  if (tl){
    tl.innerHTML = `<button class="deck-tpl" data-tpl=""><span class="deck-tpl-img blank"></span>Пустой слайд</button>`
      + deckPresets.slides.map(t => `<button class="deck-tpl mine" data-tpl="${t.id}" title="${escHtml(t.name)} — щелчок: новый слайд; правая кнопка: переименовать">`
        + `<span class="deck-tpl-img" style="aspect-ratio:${t.w}/${t.h}">${t.preview ? `<img src="${t.preview}" alt="">` : ''}</span>${escHtml(t.name)}${x('slides', t.id)}</button>`).join('');
  }
  if (bl){
    bl.innerHTML = deckPresets.bgs.map(p => {
      const st = p.img ? `background-image:url(${imgUrl(p.img)});background-size:cover;background-position:center` : (p.bg.c ? `--lc:${p.bg.c}` : '');
      return `<button class="mine" data-ubg="${p.id}" title="${escHtml(p.name)}"><i class="bgp ${p.img ? 'photo' : p.bg.k}" style="${st}"></i>${escHtml(p.name)}${x('bgs', p.id)}</button>`;
    }).join('');
  }
  if (fl){
    fl.innerHTML = deckPresets.formats.map(f => `<button class="mine" data-ufmt="${f.id}" title="${f.w / 2} × ${f.h / 2} см">${escHtml(f.name)}${x('formats', f.id)}</button>`).join('');
  }
  deckSyncPop();
}
(function(){
  const pop = document.getElementById('deckSlidePop');
  if (!pop) return;
  pop.addEventListener('click', (e) => {
    const del = e.target.closest('[data-del]');
    if (del){ e.stopPropagation(); deckDeletePreset(del.dataset.del, del.dataset.id); return; }
    const tpl = e.target.closest('[data-tpl]');
    if (tpl){
      const t = tpl.dataset.tpl ? deckPresets.slides.find(x => x.id === tpl.dataset.tpl) : null;
      if (tpl.dataset.tpl && !t) return;
      deckAddFromTemplate(t);
      return;
    }
    const ub = e.target.closest('[data-ubg]');
    if (ub){ const p = deckPresets.bgs.find(x => x.id === ub.dataset.ubg); if (p) deckApplyBgPreset(p); return; }
    const uf = e.target.closest('[data-ufmt]');
    if (uf){ const f = deckPresets.formats.find(x => x.id === uf.dataset.ufmt); if (f) deckSetFormat(f.w, f.h); return; }
    if (e.target.closest('#deckSaveBg')){ deckSaveBgPreset(); return; }
    if (e.target.closest('#deckSaveFmt')){ deckSaveFormatPreset(); return; }
  }, true);
  // правая кнопка по своей плитке — переименовать
  pop.addEventListener('contextmenu', (e) => {
    const el = e.target.closest('[data-tpl], [data-ubg], [data-ufmt]');
    if (!el) return;
    e.preventDefault();
    if (el.dataset.tpl) deckRenamePreset('slides', el.dataset.tpl);
    else if (el.dataset.ubg) deckRenamePreset('bgs', el.dataset.ubg);
    else if (el.dataset.ufmt) deckRenamePreset('formats', el.dataset.ufmt);
  });
})();

// ── меню слайда прямо на слайде: правая кнопка без перетаскивания (с
// перетаскиванием она двигает доску) и двойное касание пальцем, когда
// выбраны «выделение» или «рука» (ручкой двойное касание — две точки) ──
(function(){
  const cv = document.getElementById('boardCv');
  if (!cv) return;
  let rdown = null, lastTap = null;
  function slideAt(clientX, clientY){
    const s = deckCur();
    if (!s) return null;
    const cr = cv.getBoundingClientRect(), r = deckSlideRect(s);
    const x = (clientX - cr.left) / cam.zoom + cam.x, y = (clientY - cr.top) / cam.zoom + cam.y;
    return (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) ? s : null;
  }
  cv.addEventListener('pointerdown', (e) => {
    if (!isDeckBoard() || !boardActive) return;
    if (e.button === 2) rdown = { x: e.clientX, y: e.clientY };
  }, true);
  cv.addEventListener('pointerup', (e) => {
    if (!isDeckBoard() || !boardActive || deckSlideHidden()) return;
    if (e.button === 2 && rdown){
      const moved = Math.hypot(e.clientX - rdown.x, e.clientY - rdown.y) > 5;
      rdown = null;
      const s = !moved && slideAt(e.clientX, e.clientY);
      if (s) deckOpenMenuAt(s.id, e.clientX, e.clientY);
      return;
    }
    if (e.pointerType === 'touch' && (tool === 'select' || tool === 'hand')){
      const now = Date.now();
      if (lastTap && now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 24){
        lastTap = null;
        const s = slideAt(e.clientX, e.clientY);
        if (s) deckOpenMenuAt(s.id, e.clientX, e.clientY);
      } else lastTap = { t: now, x: e.clientX, y: e.clientY };
    }
  });
})();

/* ═══════════════════════════════════════════════════════════════════════
   КОНСТРУКТОР И УРОК (промпт №88). В «Конструкторе» всё новое на слайде —
   заготовка (поле lay: 'base'), в «Уроке» — пометки (без lay). В уроке
   заготовку не берут ластик, выделение, лассо и перетаскивание (mayTouch),
   поэтому одну презентацию можно вести с разными учениками: «Очистить
   пометки» стирает только пометки. Презентация открывается в
   «Конструкторе»; у ученика (доступ не full) переключателя нет — он всегда
   в «Уроке». Объекты без lay из старых презентаций — пометки; «Закрепить
   как заготовку» в меню слайда делает заготовкой всё, что на нём есть.
   Метка ставится не в шести местах, где доска создаёт объекты, а при
   сохранении: всё, чего на доске раньше не было (deckSeen), в
   «Конструкторе» получает lay. Чужое (от собеседника) и возвращённое
   отменой — уже «виденное», его не метим
   ═══════════════════════════════════════════════════════════════════════ */
let deckMode = 'edit';                // 'edit' — Конструктор, 'lesson' — Урок
const deckSeen = new Set();

function deckIsTeacher(){ return typeof boardAccess === 'undefined' || boardAccess === 'full'; }
function deckLessonMode(){ return isDeckBoard() && (deckMode === 'lesson' || !deckIsTeacher()); }
function deckResetSeen(){
  deckSeen.clear();
  if (B && Array.isArray(B.objects)) B.objects.forEach(o => deckSeen.add(o.id));
}
function deckNoteKnown(ids){ (ids || []).forEach(id => deckSeen.add(id)); }
// зовётся из saveDB — до того, как правка уйдёт на диск и в облако
function deckStampLayers(){
  if (!isDeckBoard() || !Array.isArray(B.objects)) return;
  const stamp = !deckLessonMode();
  B.objects.forEach(o => {
    if (deckSeen.has(o.id)) return;
    deckSeen.add(o.id);
    if (stamp && o.type !== 'deck' && !o.bgOf && o.lay === undefined) o.lay = 'base';
  });
}
function deckSetMode(m){
  if (!deckIsTeacher()) m = 'lesson';
  if (m === deckMode && document.documentElement.classList.contains(m === 'lesson' ? 'deck-lesson' : 'deck-edit')) return;
  deckStampLayers();                  // всё созданное до переключения — по старому режиму
  deckMode = m;
  // выделенное в конструкторе — в уроке заготовка, её трогать нельзя
  if (m === 'lesson'){
    if (selectedId){ const o = B.objects.find(x => x.id === selectedId); if (o && o.lay === 'base') selectedId = null; }
    multiSelectIds = multiSelectIds.filter(id => { const o = B.objects.find(x => x.id === id); return !(o && o.lay === 'base'); });
    if (typeof updateContextMenu === 'function') updateContextMenu();
  }
  deckSyncModeUI();
  scheduleRedraw();
}
function deckSyncModeUI(){
  const on = isDeckBoard(), teacher = deckIsTeacher(), lesson = deckLessonMode();
  const box = document.getElementById('deckModeSeg');
  if (box) box.hidden = !on || !teacher;
  document.getElementById('deckModeEdit')?.setAttribute('aria-pressed', !lesson);
  document.getElementById('deckModeLesson')?.setAttribute('aria-pressed', lesson);
  const lb = document.getElementById('deckLessonBtns');
  if (lb) lb.hidden = !on || !lesson;
  const cb = document.getElementById('deckCopyBtn');
  if (cb) cb.hidden = !teacher;
  document.documentElement.classList.toggle('deck-lesson', on && lesson);
  document.documentElement.classList.toggle('deck-edit', on && !lesson);
  // в «Уроке» появляются «Очистить пометки» и «Копия урока» — полоса шире,
  // на узком экране что-то должно уйти в «⋯» (deck-toolbar.js)
  if (typeof deckTbSync === 'function') deckTbSync();
}

// пометки слайда — всё, кроме заготовки, подложки и чужого
function deckNotes(s){ return deckSlotObjects(s).filter(o => o.lay !== 'base' && !o.bgOf && mayTouch(o)); }
function deckClearNotes(all){
  const list = all ? deckSlides() : [deckCur()].filter(Boolean);
  const gone = new Set();
  list.forEach(s => deckNotes(s).forEach(o => gone.add(o.id)));
  if (!gone.size){ deckToast('Пометок нет'); return; }
  pushUndo();
  B.objects = B.objects.filter(o => !gone.has(o.id));
  if (selectedId && gone.has(selectedId)) selectedId = null;
  multiSelectIds = multiSelectIds.filter(id => !gone.has(id));
  saveDB(); scheduleRedraw();
  deckToast(all ? 'Пометки стёрты на всех слайдах' : 'Пометки стёрты, заготовка осталась');
}
// всё, что на слайде, — в заготовку (старые презентации, где lay ещё не было)
function deckMakeBase(id){
  const s = deckSlides().find(x => x.id === id);
  if (!s || !deckMayEdit()) return;
  const list = deckSlotObjects(s).filter(o => o.lay !== 'base' && !o.bgOf);
  if (!list.length){ deckToast('Всё на слайде уже заготовка'); return; }
  pushUndo();
  list.forEach(o => { o.lay = 'base'; });
  saveDB(); scheduleRedraw();
  deckToast('Слайд закреплён как заготовка');
}
// копия урока: вся презентация с пометками — отдельной доской в списке
function deckSaveLessonCopy(){
  if (!isDeckBoard() || !deckIsTeacher()) return;
  deckStampLayers();
  const d = new Date(), pad = n => String(n).padStart(2, '0');
  const stamp = `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const copy = JSON.parse(JSON.stringify(B));
  ['cloudBoardId', 'cloudRole', 'syncedAt', 'pairMissing', 'view', 'refPanel'].forEach(k => delete copy[k]);
  copy.id = uid();
  copy.name = (B.name || 'Презентация') + ' · ' + stamp;
  copy.createdAt = copy.updatedAt = nowTs();
  copy.lastOpenedAt = null;
  copy.rev = 1;
  DB.boards.push(copy);
  touchBoard(copy);
  saveDB();
  deckToast('Копия «' + copy.name + '» — в списке досок');
}

document.getElementById('deckModeEdit')?.addEventListener('click', () => deckSetMode('edit'));
document.getElementById('deckModeLesson')?.addEventListener('click', () => deckSetMode('lesson'));
document.getElementById('deckClearNotes')?.addEventListener('click', () => deckClearNotes(false));
document.getElementById('deckCopyBtn')?.addEventListener('click', () => deckSaveLessonCopy());


/* ═══════════════════════════════════════════════════════════════════════
   №97–100: вставка блоков и таблиц (board-boxes.js) и «Файл» (импорт
   PPTX/PDF и выгрузка — deck-io.js). deck-io.js тяжёлый по смыслу (разбор
   файлов, библиотеки), поэтому грузится только по нажатию «Файл».
   №101–102: кнопки «Вставить» больше нет — надпись, фигуры, линии,
   таблица и прочее стали значками панели со своими галереями
   (deck-toolbar.js); отсюда им нужен только deckInsertAt
   ═══════════════════════════════════════════════════════════════════════ */
function deckMenuToggle(menuId, btnId, open){
  const m = document.getElementById(menuId), b = document.getElementById(btnId);
  if (!m || !b) return;
  const on = open === undefined ? m.hidden : open;
  ['deckFileMenu'].forEach(id => { const x = document.getElementById(id); if (x && id !== menuId) x.hidden = true; });
  ['deckFileBtn', 'dtbMoreBtn'].forEach(id => document.getElementById(id)?.setAttribute('aria-expanded', 'false'));
  m.hidden = !on;
  b.setAttribute('aria-expanded', on ? 'true' : 'false');
  if (!on) return;
  const r = b.getBoundingClientRect();
  m.style.left = Math.max(8, Math.min(window.innerWidth - m.offsetWidth - 8, r.left)) + 'px';
  m.style.top = (r.bottom + 8) + 'px';
}
document.getElementById('deckFileBtn')?.addEventListener('click', () => {
  document.querySelectorAll('#deckFileMenu [data-file="import"]').forEach(b => { b.disabled = !deckMayEdit(); });
  deckMenuToggle('deckFileMenu', 'deckFileBtn');
});
document.addEventListener('pointerdown', (e) => {
  if (e.target.closest('#deckFileMenu,#deckFileBtn')) return;
  deckMenuToggle('deckFileMenu', 'deckFileBtn', false);
});
// общий обработчик вставки: значки и галереи панели (deck-toolbar.js)
function deckInsertAt(kind){
  const s = deckCur();
  if (!s || typeof bxInsert !== 'function') return null;
  // новый объект — посередине текущего слайда
  const r = deckSlideRect(s);
  return bxInsert(kind, { x: r.x + r.w / 2, y: r.y + r.h / 2 });
}
let deckIoPromise = null;
function deckIoEnsure(){
  if (typeof deckIoImportFile === 'function') return Promise.resolve();
  if (deckIoPromise) return deckIoPromise;
  deckIoPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'deck-io.js';
    s.onload = () => resolve();
    s.onerror = () => { s.remove(); deckIoPromise = null; reject(new Error('deck-io.js')); };
    document.head.appendChild(s);
  });
  return deckIoPromise;
}
document.getElementById('deckFileMenu')?.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-file]');
  if (!b || b.disabled) return;
  deckMenuToggle('deckFileMenu', 'deckFileBtn', false);
  const act = b.dataset.file;
  if (act === 'import'){ document.getElementById('deckImportFile')?.click(); deckIoEnsure().catch(() => {}); return; }
  deckIoEnsure().then(() => (act === 'pdf' ? deckIoExportPdf() : deckIoExportPptx()), () => deckToast('Не удалось загрузить выгрузку — проверьте связь'));
});
document.getElementById('deckImportFile')?.addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!f) return;
  deckIoEnsure().then(() => deckIoImportFile(f), () => deckToast('Не удалось загрузить импорт — проверьте связь'));
});
// шрифт догрузился (board-boxes.js) — миниатюры и соседние слайды перерисовать
function deckThumbsInvalidate(){
  if (!isDeckBoard()) return;
  deckSlotSig = {};
  deckSlides().forEach(sl => deckThumbDirty.add(sl.id));
  if (typeof deckMarkCardsDirty === 'function') deckMarkCardsDirty(deckSlides().map(sl => sl.id));
  deckScheduleThumbs(true);
}
