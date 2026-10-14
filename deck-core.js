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
  ['bdRail', 'bdDock', 'deckNav', 'deckStrip'].forEach(id => {
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
function deckFitZoom(s){
  const r = deckSlideRect(s), a = deckArea();
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.min(a.w / r.w, a.h / r.h)));
}
function deckFitCam(s){
  const r = deckSlideRect(s), a = deckArea(), z = deckFitZoom(s);
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
  const s = deckSlideAtY(cy) || deckCur() || sl[0];
  deckCurId = s.id;
  const fz = deckFitZoom(s);
  if (cam.zoom <= fz * 1.001){ deckFitCam(s); deckFitted = true; }
  else {
    deckFitted = false;
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
  if (isScreen){ deckUpdateNav(); deckStripUpdate(); }
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
  deckCurId = s.id;
  deckFitCam(s);
  deckFitted = true;
  if (dir) deckAnimate(dir);
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
    if (wasFitted){ const s = deckCur(); if (s){ deckFitCam(s); deckFitted = true; scheduleRedraw(); } }
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
  document.documentElement.classList.toggle('deck-strip-open', on && open);
  document.documentElement.classList.toggle('deck-strip-closed', on && !open);
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
  const list = document.getElementById('deckStripList');
  if (!list || !deckStripOpen()) return;
  const sl = deckSlides();
  const sig = sl.map(s => s.id + ':' + s.w + 'x' + s.h + ':' + (s.name || '')).join('|');
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
  if (B.rev !== deckLastRev){ deckLastRev = B.rev; deckScheduleThumbs(); }
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
  if (!isDeckBoard() || !boardActive || !deckStripOpen()) return;
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
    if (deckSlotSig[s.id] !== v){ deckSlotSig[s.id] = v; deckThumbDirty.add(s.id); }
    if (s.id === deckCurId) deckThumbDirty.add(s.id);
  });
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

// ── щелчок открывает слайд, перетаскивание меняет порядок (мышь, перо, палец) ──
(function(){
  const list = document.getElementById('deckStripList');
  if (!list) return;
  let drag = null;   // { id, from, x0, y0, moving, line }
  function dropIndex(y){
    const items = [...list.querySelectorAll('.deck-thumb')];
    for (let i = 0; i < items.length; i++){
      const r = items[i].getBoundingClientRect();
      if (y < r.top + r.height / 2) return i;
    }
    return items.length;
  }
  function placeLine(idx){
    const items = [...list.querySelectorAll('.deck-thumb')];
    const lr = list.getBoundingClientRect();
    let y;
    if (idx < items.length) y = items[idx].getBoundingClientRect().top - 5;
    else { const last = items[items.length - 1]; y = last ? last.getBoundingClientRect().bottom + 3 : lr.top; }
    drag.line.style.top = (y - lr.top + list.scrollTop) + 'px';
  }
  list.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    const menuBtn = e.target.closest('.deck-thumb-menu');
    if (menuBtn){ e.preventDefault(); const m = document.getElementById('deckMenu'); if (m && !m.hidden && deckMenuFor === menuBtn.dataset.id) deckCloseMenu(); else deckOpenMenu(menuBtn.dataset.id, menuBtn); return; }
    const th = e.target.closest('.deck-thumb');
    if (!th) return;
    const ids = deckSlides().map(s => s.id);
    drag = { id: th.dataset.id, from: ids.indexOf(th.dataset.id), x0: e.clientX, y0: e.clientY, moving: false, line: null };
    try { list.setPointerCapture(e.pointerId); } catch (err) {}
  });
  list.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (!drag.moving){
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6 || !deckMayEdit()) return;
      drag.moving = true;
      list.querySelector(`.deck-thumb[data-id="${drag.id}"]`)?.classList.add('dragging');
      drag.line = document.createElement('div');
      drag.line.className = 'deck-drop-line';
      list.appendChild(drag.line);
    }
    // у края ленты — прокручиваем её, чтобы дотащить до невидимых слайдов
    const lr = list.getBoundingClientRect();
    if (e.clientY < lr.top + 24) list.scrollTop -= 12;
    else if (e.clientY > lr.bottom - 24) list.scrollTop += 12;
    placeLine(dropIndex(e.clientY));
  });
  function finish(e, cancel){
    if (!drag) return;
    const d = drag; drag = null;
    if (d.line) d.line.remove();
    list.querySelector('.deck-thumb.dragging')?.classList.remove('dragging');
    if (cancel) return;
    if (d.moving) deckMoveSlide(d.from, dropIndex(e.clientY));
    else {
      const cur = deckCurIndex();
      if (d.from !== cur) deckGo(d.from, d.from > cur ? 1 : -1);
    }
  }
  list.addEventListener('pointerup', (e) => finish(e, false));
  list.addEventListener('pointercancel', (e) => finish(e, true));
})();

document.getElementById('deckStripToggle')?.addEventListener('click', () => deckSetStripOpen(!deckStripOpen()));
