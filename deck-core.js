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

function isDeckBoard(){ return !!(B && B.kind === 'deck'); }
function deckObj(){ return (B && Array.isArray(B.objects)) ? B.objects.find(o => o.type === 'deck') : null; }
function deckSlides(){ const d = deckObj(); return d && Array.isArray(d.slides) ? d.slides : []; }
function deckCur(){
  const sl = deckSlides();
  return sl.find(s => s.id === deckCurId) || sl[0] || null;
}
function deckCurIndex(){ const s = deckCur(); return s ? deckSlides().indexOf(s) : -1; }

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
  const nav = document.getElementById('deckNav');
  if (nav) nav.hidden = b.kind !== 'deck';
  document.documentElement.classList.toggle('deck-mode', b.kind === 'deck');
  deckSyncFlowUI();
}

// Свободная часть холста, куда вписывается слайд: между верхней полосой,
// панелью масштаба, доком и полосой листания. Панели переносятся к любому
// краю (промпт №9), поэтому край каждой берём по месту: к какому краю окна
// она ближе, тот и сужаем. Возвращает прямоугольник в координатах холста
function deckArea(){
  const W = window.innerWidth, H = window.innerHeight, gap = 14;
  const ins = { l: 16, t: 16, r: 16, b: 16 };
  const top = document.querySelector('.bd-topbar');
  if (top) ins.t = Math.max(ins.t, top.getBoundingClientRect().bottom + gap);
  ['bdRail', 'bdDock', 'deckNav'].forEach(id => {
    const el = document.getElementById(id);
    if (!el || el.hidden) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const d = { l: r.left, t: r.top, r: W - r.right, b: H - r.bottom };
    const e = Object.keys(d).reduce((m, k) => d[k] < d[m] ? k : m, 'l');
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
  const s = deckCur();
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
  deckUpdateNav();
}
// объекты рисуются только в пределах слайда, как в показе PowerPoint:
// и у ученика, и в выгрузке слайд выглядит одинаково
function deckClipSlide(c, camv){
  const s = deckCur();
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

// новый слайд — после текущего, того же формата и с той же подложкой,
// в новом слоте (номера слотов никогда не переиспользуются)
function deckAddSlide(){
  if (!isDeckBoard() || !mayDraw()) return;
  const d = deckObj(), cur = deckCur();
  if (!d) return;
  pushUndo();
  const slot = d.slides.reduce((m, s) => Math.max(m, s.slot), -1) + 1;
  const s = deckNewSlide(slot, cur);
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
