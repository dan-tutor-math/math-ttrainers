/* ═══════════════════════════════════════════════════════════════════════
   ПРЕЗЕНТАЦИИ (промпт №84) — второй вид доски: вместо бесконечного листа
   лента слайдов. Модель данных — HANDOFF.md, раздел 6б.

   Презентация — это обычная доска целиком (тот же код инструментов,
   выделения, облака, ученика), поэтому здесь только то, чем она
   отличается: где лежат слайды, как их показывать и листать.

   Подключается ДО boards-core.js: доска может открыться сразу при загрузке
   (по хэшу #board=…), и к этому моменту хуки отсюда уже должны быть.
   Функции читают B, cam, cssW и прочее из boards-core.js только в момент
   вызова — к тому времени всё объявлено.
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

function isDeckBoard(){ return !!(B && B.kind === 'deck'); }
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
    bg: like && like.bg ? Object.assign({}, like.bg) : { k: 'grid' },
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
  const isD = b.kind === 'deck';
  const layer = document.getElementById('deckDepth'), scr = document.getElementById('deckScrub');
  if (layer) layer.hidden = !isD;
  if (scr) scr.hidden = !isD;
  // Промпт №85б: у презентации таблетка (PNG, масштаб, PDF…) — в верхней строке
  if (typeof applyDockLayout === 'function') applyDockLayout();
  const nav = document.getElementById('deckNav');
  if (nav) nav.hidden = b.kind !== 'deck';
  document.documentElement.classList.toggle('deck-mode', b.kind === 'deck');
  deckSyncFlowUI();
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
  // на ближайший оставшийся, иначе на экране было бы пустое полотно
  if (isScreen && camv === cam && deckSlides().length && !deckSlideAtY(cam.y + cssH / 2 / cam.zoom)){
    const s0 = deckCur();
    if (s0){ deckFitCam(s0); deckFitted = true; camv = cam; }
  }
  const s = deckDrawnSlide();
  if (!s) return;
  const r = deckSlideRect(s);
  const p0 = worldToScreen({ x: r.x, y: r.y }), p1 = worldToScreen({ x: r.x + r.w, y: r.y + r.h });
  c.save();
  c.shadowColor = 'rgba(20,30,60,.18)'; c.shadowBlur = 30; c.shadowOffsetY = 8;
  c.fillStyle = themeVar('--paper');
  c.fillRect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);
  c.restore();
  if (!s.bg || s.bg.k === 'grid'){
    const cell = B.cellSize * camv.zoom;
    if (cell > 4){
      c.save();
      c.beginPath(); c.rect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y); c.clip();
      c.strokeStyle = B.gridColor ? resolveColor(B.gridColor) : themeVar('--grid');
      c.lineWidth = 1; c.globalAlpha = 0.55;
      for (let x = r.x; x <= r.x + r.w + 0.5; x += B.cellSize){
        const sx = Math.round(worldToScreen({ x, y: 0 }).x) + 0.5;
        c.beginPath(); c.moveTo(sx, p0.y); c.lineTo(sx, p1.y); c.stroke();
      }
      for (let y = r.y; y <= r.y + r.h + 0.5; y += B.cellSize){
        const sy = Math.round(worldToScreen({ x: 0, y }).y) + 0.5;
        c.beginPath(); c.moveTo(p0.x, sy); c.lineTo(p1.x, sy); c.stroke();
      }
      c.restore();
    }
  }
  if (isScreen){ deckUpdateNav(); deckStripUpdate(); deckDepthSync(); deckScrubSync(); }
}
// объекты рисуются только в пределах слайда, как в показе PowerPoint:
// и у ученика, и в выгрузке слайд выглядит одинаково
function deckClipSlide(c, camv){
  const s = deckDrawnSlide();
  if (!s) return false;
  const r = deckSlideRect(s);
  const p0 = worldToScreen({ x: r.x, y: r.y }), p1 = worldToScreen({ x: r.x + r.w, y: r.y + r.h });
  c.save();
  c.beginPath(); c.rect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y); c.clip();
  return true;
}
// для «Скачать PNG»: выгружаем текущий слайд, а не лист А4 полотна
function deckCurRect(){ const s = deckCur(); return s ? deckSlideRect(s) : null; }

function deckFlow(){
  try { return localStorage.getItem(DECK_FLOW_KEY) === 'h' ? 'h' : 'v'; } catch (e) { return 'v'; }
}
function deckSetFlow(f){
  try { localStorage.setItem(DECK_FLOW_KEY, f); } catch (e) {}
  deckSyncFlowUI();
}
function deckSyncFlowUI(){
  const f = deckFlow();
  document.getElementById('deckFlowV')?.setAttribute('aria-pressed', f === 'v');
  document.getElementById('deckFlowH')?.setAttribute('aria-pressed', f === 'h');
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
  if (!deckFitted) return false;
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
  if (!isDeckBoard() || !boardActive) return;
  const wasFitted = deckFitted;
  requestAnimationFrame(() => {
    if (wasFitted){ const s = deckCur(); if (s){ deckFitCam(s, deckZf); deckFitted = true; scheduleRedraw(); } }
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

function deckIcon(){
  return '<svg viewBox="0 0 24 24" fill="none"><rect x="2.5" y="4" width="13" height="9" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="8.5" y="10" width="13" height="9" rx="1.5" fill="var(--paper)" stroke="currentColor" stroke-width="1.6"/></svg>';
}

function deckCreate(){
  const b = {
    id: uid(), name: 'Презентация без названия', kind: 'deck',
    folderId: (curFolderId && curFolderId !== '__recent') ? curFolderId : null,
    createdAt: nowTs(), updatedAt: nowTs(), lastOpenedAt: null,
    cellSize: 24, sheetCols: 76, sheetRows: 54, sheetCount: 1, pageOrder: 'h',
    objects: [deckNewObj()], recentColors: PALETTE.map(p => p.tok), colorUsage: {},
  };
  DB.boards.push(b); saveDB();
  openBoard(b.id);
}

document.getElementById('blCreateDeck')?.addEventListener('click', () => deckCreate());
document.getElementById('deckPrev')?.addEventListener('click', () => deckStep(-1));
document.getElementById('deckNext')?.addEventListener('click', () => deckStep(1));
document.getElementById('deckAdd')?.addEventListener('click', () => deckAddSlide());
document.getElementById('deckFlowV')?.addEventListener('click', () => deckSetFlow('v'));
document.getElementById('deckFlowH')?.addEventListener('click', () => deckSetFlow('h'));

/* ═══════════════════════════════════════════════════════════════════════
   ЛЕНТА МИНИАТЮР (промпт №85). Миниатюра — тот же render() доски в
   маленький canvas, поэтому на ней всё как на слайде. Перерисовываем не на
   каждый кадр, а не чаще раза в секунду и только то, что поменялось и видно
   в ленте: на презентации из сорока страниц PDF иначе каждый штрих
   перерисовывал бы сорок картинок
   ═══════════════════════════════════════════════════════════════════════ */
const DECK_STRIP_KEY = 'boardsDeckStrip';
const DECK_THUMB_W = 116, DECK_THUMB_H = 80;
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
  const r = deckSlideRect(s), sc = Math.min(DECK_THUMB_W / r.w, DECK_THUMB_H / r.h);
  return { w: Math.max(8, Math.round(r.w * sc)), h: Math.max(8, Math.round(r.h * sc)), sc, r };
}

// зовётся из отрисовки экрана: лента следит за списком слайдов и правками
function deckStripUpdate(){
  if (B.rev !== deckLastRev){ deckLastRev = B.rev; deckScheduleThumbs(); }
  const list = document.getElementById('deckStripList');
  if (!list || !deckStripOpen()) return;
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
    sig[slot] = (sig[slot] || 0) + 1 + b.minX + b.minY * 3 + b.maxX * 7 + b.maxY * 11 + (o.content ? o.content.length : 0) + String(o.color || '').length;
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
  finally { deckRenderSlideId = null; activeCam = cam; }
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
    B.objects.push(c);
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
  const m = document.getElementById('deckMenu');
  if (!m) return;
  deckMenuFor = id;
  const one = deckSlides().length <= 1, can = deckMayEdit();
  m.querySelectorAll('button').forEach(b => { b.disabled = !can || (b.dataset.act === 'del' && one); });
  m.hidden = false;
  const r = anchor.getBoundingClientRect(), mw = m.offsetWidth, mh = m.offsetHeight;
  m.style.left = Math.min(window.innerWidth - mw - 8, r.right + 6) + 'px';
  m.style.top = Math.max(8, Math.min(window.innerHeight - mh - 8, r.top)) + 'px';
}
function deckCloseMenu(){ const m = document.getElementById('deckMenu'); if (m) m.hidden = true; deckMenuFor = null; }
document.getElementById('deckMenu')?.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b || b.disabled) return;
  const id = deckMenuFor;
  deckCloseMenu();
  if (b.dataset.act === 'dup') deckDuplicate(id);
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
function deckStripSigOf(sl){ return sl.map(s => s.id + ':' + s.w + 'x' + s.h + ':' + (s.name || '')).join('|'); }
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
const deckCards = new Map();          // id слайда → { el, bw, dirty }
const deckCardQueue = [];
let deckDepthKey = '', deckDepthCurShown = null;

function deckSlideHidden(){ return deckFast || Date.now() < deckAnimUntil; }
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
  finally { deckRenderSlideId = null; activeCam = cam; }
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
  deckFast = false; deckAnimUntil = 0;
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
    Z = fz * zf; cx = a.x + a.w / 2; cy = a.y + a.h / 2;
  } else {
    const r = deckSlideRect(cur);
    Z = cam.zoom; cx = (r.x + r.w / 2 - cam.x) * Z; cy = (r.y + r.h / 2 - cam.y) * Z;
  }
  const p = deckDepthParams(deckFitted || hidden ? zf : 1);
  const key = [cur.id, hidden, deckFast, flow, Math.round(Z * 1000), Math.round(cx), Math.round(cy), sl.length, deckStripSig].join('|');
  if (key === deckDepthKey) return;
  const animate = cur.id !== deckDepthCurShown || hidden !== (deckDepthKey.split('|')[1] === 'true') || deckFast !== (deckDepthKey.split('|')[2] === 'true');
  deckDepthKey = key; deckDepthCurShown = cur.id;

  const want = new Set();
  for (let k = -3; k <= 3; k++){ const s = sl[ci + k]; if (s) want.add(s.id); }
  deckCards.forEach((c, id) => { if (!want.has(id)){ c.el.remove(); deckCards.delete(id); } });
  const rc = deckSlideRect(cur), alongCur = (flow === 'v' ? rc.h : rc.w) * Z;
  // размер элемента — при «вписан», остальное (масштаб, место) — одним
  // transform: тогда и отдаление в обзор, и возврат анимируются целиком
  const Zref = fz, zs = Z / Zref;
  for (let k = -3; k <= 3; k++){
    const s = sl[ci + k];
    if (!s) continue;
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
    const r = deckSlideRect(s), w = r.w * Z, h = r.h * Z, a = Math.abs(k), sgn = Math.sign(k);
    const wr = r.w * Zref, hr = r.h * Zref;
    c.want = w;
    let t = `scale(${zs})`, op = 1;
    if (k !== 0){
      const ns = a === 1 ? p.s : p.s * .82, alongN = (flow === 'v' ? h : w);
      const peek1 = Math.max(DECK_PEEK_PX, p.peek * p.s * alongN);
      let off = alongCur / 2 + peek1 - ns * alongN / 2;
      if (a >= 2) off += p.peek * p.s * alongN * .62 + 14;
      if (a >= 3) off += alongN * .2;
      off *= sgn;
      const ang = p.tilt * (a >= 2 ? 1.25 : 1);
      const tr = flow === 'v' ? `translateY(${off}px)` : `translateX(${off}px)`;
      const rot = ang ? (flow === 'v' ? ` rotateX(${-sgn * ang}deg)` : ` rotateY(${sgn * ang}deg)`) : '';
      t = `${tr}${rot} scale(${ns * zs})`;
      op = a === 1 ? p.op : a === 2 ? p.op2 : 0;
    } else op = hidden ? 1 : 0;
    const el = c.el;
    // новый и центральный при выходе из листания — без анимации: холст
    // уже рисует слайд сам, картинка должна исчезнуть сразу
    el.classList.toggle('instant', fresh || !animate || (k === 0 && !hidden));
    el.className = el.className.replace(/\bk\d\b/g, '').trim() + ' k' + Math.min(a, 3);
    el.style.width = wr + 'px'; el.style.height = hr + 'px';
    el.style.transform = `translate(${cx - wr / 2}px, ${cy - hr / 2}px) ` + t;
    el.style.opacity = op;
    el.style.zIndex = 30 - a;
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
    knob.style.top = (Math.abs(y - tickY) < DECK_SCRUB_MAGNET ? tickY : y) + 'px';
    const s = deckSlides()[i];
    if (s && s.id !== deckCurId){
      deckCurId = s.id;
      deckFitCam(s, deckZf); deckFitted = true;
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
      if (deckCur() && !deckReducedMotion()){ deckShowCurCard(); deckSlowFor(DECK_MODE_MS); deckFast = true; }
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
      if (deckFast){ deckSlowFor(DECK_MODE_MS); deckFlipAnim(DECK_MODE_MS); deckFast = false; }
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
