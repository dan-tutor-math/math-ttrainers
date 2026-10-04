/* ═══════════════════════════════════════════════════════════════════════
   solid3d.js — 3D-конструктор поверх доски (промпт №17 «фигуры», этап 3).

   Грузится только при первом открытии конструктора (board-figures.js →
   figOpenConstructor), геометрию берёт из solids-geom.js. Сторонней
   3D-библиотеки нет — почему, сказано в шапке solids-geom.js.

   Что здесь: окно поверх доски, параметры тела, вращение мышью и пальцем
   (протяжка — всегда вращение, щелчок — действие инструмента, поэтому
   отдельного режима «вращать» не нужно), стандартные виды, точки, отрезки,
   прямые, сечения, перпендикуляры, измерения, подписи, система координат,
   развёртка с анимацией, автовращение, пошаговое сечение.

   Всё, что построено, — это сцена (см. solids-geom.js). «На доску» кладёт
   сцену в объект доски целиком, поэтому тело на доске векторное и его
   можно открыть снова и достроить (двойной щелчок или кнопка в панели).

   Совместная сессия: учитель шлёт сцену событием 's3d' (не чаще раза в
   60 мс), ученик в режиме просмотра (board-stage.js, boards.html?s=…)
   видит то же окно без права менять. Проверяется только на сайте: из
   песочницы websocket до Supabase закрыт.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const S = window.Solids;
if (!S) return;
const V3 = S.V3;

const CSS = `
.s3d{position:fixed;inset:0;z-index:400;display:none;flex-direction:column;background:var(--bg);color:var(--pencil);font-family:var(--font-ui);}
.s3d.open{display:flex;}
.s3d-top{display:flex;align-items:center;gap:10px;padding:10px 70px 10px 14px;border-bottom:1px solid var(--s3d-line);flex-wrap:wrap;background:var(--glass-strong);}
.s3d-title{font-weight:700;font-size:15px;margin-right:6px;}
.s3d-seg{display:flex;gap:3px;background:var(--hover-1);border-radius:10px;padding:3px;flex-wrap:wrap;}
.s3d-seg button,.s3d-btn{border:none;background:none;border-radius:8px;padding:6px 10px;font-size:12.5px;font-weight:600;color:var(--pencil);cursor:pointer;white-space:nowrap;}
.s3d-seg button.on{background:var(--card);box-shadow:0 1px 4px rgba(0,0,0,.1);}
.s3d-btn{border:1px solid var(--s3d-line);background:var(--card);}
.s3d-btn:hover{border-color:var(--ink);}
.s3d-btn.on{background:var(--ink);border-color:var(--ink);color:#fff;}
.s3d-btn:disabled{opacity:.4;cursor:default;}
.s3d-primary{background:var(--ink);border-color:var(--ink);color:#fff;}
.s3d-primary:hover{background:var(--ink-active);}
.s3d-sp{flex:1;}
.s3d-body{flex:1;display:flex;min-height:0;}
.s3d-side{width:318px;flex:none;overflow:auto;padding:12px 14px 30px;border-right:1px solid var(--s3d-line);display:flex;flex-direction:column;gap:14px;background:var(--glass);}
.s3d-sec{display:flex;flex-direction:column;gap:7px;}
.s3d-h{font-size:11.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--muted-2);}
.s3d-row{display:flex;flex-wrap:wrap;gap:5px;align-items:center;}
.s3d-row label{font-size:12.5px;color:var(--muted-3);}
.s3d-par{display:grid;grid-template-columns:1fr 78px;gap:5px 8px;align-items:center;font-size:12.5px;}
.s3d input[type=number],.s3d input[type=text],.s3d select{border:1px solid var(--s3d-line);background:var(--card);color:var(--pencil);border-radius:8px;padding:5px 7px;font-size:13px;font-family:var(--font-ui);min-width:0;}
.s3d input:focus,.s3d select:focus{outline:none;border-color:var(--ink);}
.s3d select.s3d-pt{width:58px;}
.s3d-tools{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;}
.s3d-tools .s3d-btn{padding:7px 4px;}
.s3d-note{font-size:12px;line-height:1.35;color:var(--muted-2);}
.s3d-list{display:flex;flex-direction:column;gap:4px;}
.s3d-item{display:flex;align-items:center;gap:6px;font-size:12.5px;padding:5px 6px;border-radius:8px;background:var(--card);border:1px solid var(--s3d-line);}
.s3d-item .s3d-name{width:40px;padding:3px 5px;font-weight:700;text-align:center;}
.s3d-item .s3d-txt{flex:1;min-width:0;}
.s3d-item .s3d-txt small{display:block;color:var(--muted-2);font-size:11.5px;}
.s3d-x{border:none;background:none;color:var(--muted-2);cursor:pointer;font-size:13px;border-radius:6px;width:22px;height:22px;flex:none;}
.s3d-x:hover{background:var(--hover-1);color:var(--teacher);}
.s3d-mini{border:1px solid var(--s3d-line);background:none;border-radius:7px;padding:3px 7px;font-size:11.5px;font-weight:600;cursor:pointer;color:var(--ink);flex:none;}
.s3d-stage{flex:1;position:relative;min-width:0;touch-action:none;background:var(--paper);}
.s3d-stage canvas{position:absolute;inset:0;width:100%;height:100%;cursor:grab;}
.s3d-stage canvas.drag{cursor:grabbing;}
.s3d-hint{position:absolute;left:50%;top:12px;transform:translateX(-50%);background:var(--glass-strong);border:1px solid var(--glass-border);border-radius:10px;padding:7px 12px;font-size:12.5px;box-shadow:var(--shadow);pointer-events:none;max-width:calc(100% - 24px);text-align:center;}
.s3d-hint:empty{display:none;}
.s3d-steps{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);display:none;align-items:center;gap:8px;background:var(--glass-strong);border:1px solid var(--glass-border);border-radius:12px;padding:7px 10px;box-shadow:var(--shadow);font-size:12.5px;max-width:calc(100% - 24px);flex-wrap:wrap;justify-content:center;}
.s3d-steps.open{display:flex;}
.s3d-net{display:flex;align-items:center;gap:8px;}
.s3d-net input{flex:1;}
.s3d-confirm{position:absolute;right:14px;top:58px;z-index:2;display:none;gap:8px;align-items:center;background:var(--glass-strong);border:1px solid var(--glass-border);border-radius:12px;padding:8px 10px;box-shadow:var(--shadow);font-size:12.5px;}
.s3d-confirm.open{display:flex;}
.s3d.viewer .s3d-side,.s3d.viewer .s3d-edit{display:none!important;}
@media (max-width:760px){
  .s3d-body{flex-direction:column-reverse;}
  .s3d-side{width:auto;flex:1;border-right:none;border-top:1px solid var(--s3d-line);}
  .s3d-stage{flex:none;height:48vh;}
  .s3d-top{gap:6px;padding:8px;}
  .s3d-title{display:none;}
  /* на телефоне подсказка — мелко и внизу холста: сверху она закрывала
     подписи верхних вершин */
  .s3d-hint{top:auto;bottom:8px;font-size:11px;padding:5px 9px;opacity:.92;}
  .s3d-steps{bottom:44px;}
}
`;

const TOOLS = [
  ['pt', 'Точка'], ['seg', 'Отрезок'], ['line', 'Прямая'],
  ['plane', 'Сечение'], ['perp', 'Перпендикуляр'], ['text', 'Подпись'],
];
const HINTS = {
  pt: 'Щёлкните по ребру, грани или отрезку — там встанет точка. Протяжка — вращение',
  seg: 'Выберите две точки — между ними пройдёт отрезок',
  line: 'Выберите две точки — через них пройдёт прямая',
  plane: 'Выберите три точки — через них пройдёт плоскость, сечение закрасится',
  perp: 'Перпендикуляр строится из формы слева',
  text: 'Щёлкните по точке и впишите текст слева',
};
const MEASURES = [
  ['len', 'Длина отрезка', ['a', 'b']],
  ['dline', 'Расстояние от точки до прямой', ['p', 'a', 'b']],
  ['dist', 'Расстояние от точки до плоскости', ['p', 'a', 'b', 'c']],
  ['angLL', 'Угол между прямыми', ['a', 'b', 'c', 'd']],
  ['angLP', 'Угол между прямой и плоскостью', ['a', 'b', 'c', 'd', 'e']],
  ['angPP', 'Угол между плоскостями', ['a', 'b', 'c', 'd', 'e', 'f']],
];
const MEASURE_CAPS = {
  len: ['Отрезок', 2], dline: ['Точка', 1, 'Прямая', 2], dist: ['Точка', 1, 'Плоскость', 3],
  angLL: ['Прямая', 2, 'Прямая', 2], angLP: ['Прямая', 2, 'Плоскость', 3], angPP: ['Плоскость', 3, 'Плоскость', 3],
};
const NEW_NAMES = 'MNKLPQRTEFGHUVWXYZ';

let root = null, cv = null, ctx = null;
let st = null;         // состояние открытого конструктора

function el(id){ return root.querySelector('#' + id); }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]); }
function themeCol(v, fb){ try { return (typeof resolveColor === 'function' ? resolveColor(v) : getComputedStyle(document.documentElement).getPropertyValue(v).trim()) || fb; } catch (e) { return fb; } }
function uiFont(){ return (typeof UI_FONT_FAMILY !== 'undefined' && UI_FONT_FAMILY) || 'sans-serif'; }
function clone(o){ return JSON.parse(JSON.stringify(o)); }

function build(){
  if (root) return;
  const style = document.createElement('style');
  style.textContent = CSS + `.s3d{--s3d-line:rgba(0,76,153,.18);}html[data-theme="dark"] .s3d{--s3d-line:rgba(255,255,255,.14);}`;
  document.head.appendChild(style);
  root = document.createElement('div');
  root.className = 's3d'; root.id = 's3dRoot';
  root.innerHTML = `
  <div class="s3d-top">
    <span class="s3d-title" id="s3dTitle">3D-конструктор</span>
    <div class="s3d-seg" id="s3dViews">
      <button type="button" data-view="school">Школьная</button>
      <button type="button" data-view="front">Спереди</button>
      <button type="button" data-view="top">Сверху</button>
      <button type="button" data-view="side">Сбоку</button>
    </div>
    <button type="button" class="s3d-btn" id="s3dSpin" title="Медленно вращать — показать ученику со всех сторон">⟳ Вращение</button>
    <span class="s3d-sp"></span>
    <button type="button" class="s3d-btn s3d-edit" id="s3dUndo" title="Отменить">↶</button>
    <button type="button" class="s3d-btn s3d-edit" id="s3dRedo" title="Повторить">↷</button>
    <button type="button" class="s3d-btn s3d-primary s3d-edit" id="s3dToBoard">На доску</button>
    <button type="button" class="s3d-btn s3d-edit" id="s3dClose" title="Закрыть">✕</button>
  </div>
  <div class="s3d-confirm" id="s3dConfirm"><span>Закрыть без переноса на доску?</span>
    <button type="button" class="s3d-btn" id="s3dCloseYes">Закрыть</button><button type="button" class="s3d-btn" id="s3dCloseNo">Остаться</button></div>
  <div class="s3d-body">
    <aside class="s3d-side" id="s3dSide">
      <div class="s3d-sec">
        <div class="s3d-h">Фигура</div>
        <select id="s3dKind"></select>
        <div class="s3d-par" id="s3dPar"></div>
      </div>
      <div class="s3d-sec">
        <div class="s3d-h">Показать</div>
        <div class="s3d-row" id="s3dOpts"></div>
        <div class="s3d-row" id="s3dOrigin"></div>
      </div>
      <div class="s3d-sec">
        <div class="s3d-h">Построить</div>
        <div class="s3d-tools" id="s3dTools"></div>
        <div id="s3dToolBox" class="s3d-sec"></div>
      </div>
      <div class="s3d-sec">
        <div class="s3d-h">Измерить</div>
        <select id="s3dMType"></select>
        <div class="s3d-row" id="s3dMArgs"></div>
        <div class="s3d-row"><button type="button" class="s3d-btn" id="s3dMAdd">Измерить и показать</button></div>
      </div>
      <div class="s3d-sec" id="s3dNetSec">
        <div class="s3d-h">Развёртка</div>
        <div class="s3d-net"><button type="button" class="s3d-btn" id="s3dNetBtn">Развернуть</button><input type="range" min="0" max="100" value="0" id="s3dNetRange"></div>
      </div>
      <div class="s3d-sec">
        <div class="s3d-h">Построения</div>
        <div class="s3d-list" id="s3dList"></div>
      </div>
    </aside>
    <div class="s3d-stage" id="s3dStage">
      <canvas id="s3dCanvas"></canvas>
      <div class="s3d-hint" id="s3dHint"></div>
      <div class="s3d-steps" id="s3dSteps"></div>
    </div>
  </div>`;
  document.body.appendChild(root);
  cv = el('s3dCanvas'); ctx = cv.getContext('2d');
  const kind = el('s3dKind');
  Object.keys(S.KINDS).forEach(k => { const o = document.createElement('option'); o.value = k; o.textContent = S.KINDS[k].title; kind.appendChild(o); });
  el('s3dTools').innerHTML = TOOLS.map(([k, t]) => `<button type="button" class="s3d-btn" data-tool="${k}">${t}</button>`).join('');
  el('s3dMType').innerHTML = MEASURES.map(([k, t]) => `<option value="${k}">${t}</option>`).join('');
  wire();
}

/* ═══ состояние ═══ */
function open(opts){
  build();
  opts = opts || {};
  const sc = opts.scene ? clone(opts.scene) : S.newScene('cube');
  sc.pts = sc.pts || []; sc.segs = sc.segs || []; sc.planes = sc.planes || []; sc.marks = sc.marks || []; sc.nm = sc.nm || {}; sc.opt = sc.opt || {};
  st = {
    scene: sc, objId: opts.objId || null, viewer: !!opts.viewer,
    hist: [], fut: [], dirty: false, tool: 'pt', pend: [], hover: null, zoom: 1,
    ratio: null, spin: false, anim: null, stepPlane: null, textFor: null, mSel: {},
  };
  root.classList.toggle('viewer', st.viewer);
  root.classList.add('open');
  el('s3dTitle').textContent = st.viewer ? 'Учитель строит фигуру' : '3D-конструктор';
  el('s3dConfirm').classList.remove('open');
  if (window.figCloseMenu) try { window.figCloseMenu(); } catch (e) {}
  resize();
  refreshSide();
  render();
  if (!st.viewer) syncSend(true);
}
function close(){
  if (!root) return;
  stopAnim();
  root.classList.remove('open');
  if (st && !st.viewer) syncSend(false, true);
  st = null;
}
function isOpen(){ return !!(root && root.classList.contains('open') && st); }

function change(fn, opts){
  if (!st || st.viewer) return;
  st.hist.push(JSON.stringify(st.scene));
  if (st.hist.length > 100) st.hist.shift();
  st.fut.length = 0;
  fn(st.scene);
  st.dirty = true;
  if (!opts || !opts.keepSide) refreshSide(); else refreshList();
  render(); syncSend(true);
}
function undo(){
  if (!st || !st.hist.length) return;
  st.fut.push(JSON.stringify(st.scene));
  st.scene = JSON.parse(st.hist.pop());
  st.pend = []; refreshSide(); render(); syncSend(true);
}
function redo(){
  if (!st || !st.fut.length) return;
  st.hist.push(JSON.stringify(st.scene));
  st.scene = JSON.parse(st.fut.pop());
  st.pend = []; refreshSide(); render(); syncSend(true);
}

/* ═══ точки: имена, выбор ═══ */
function meshNow(){ return S.buildMesh(st.scene.k, st.scene.p); }
function namedPoints(){
  const M = meshNow(), R = S.resolvePoints(M, st.scene);
  const out = [];
  M.names.forEach((n, i) => { if (n) out.push({ id: 'v' + i, name: R.names['v' + i] || n }); });
  st.scene.pts.forEach(pt => { if (R.pos[pt.id]) out.push({ id: pt.id, name: pt.name || pt.id }); });
  return out;
}
function freeName(prefer){
  const used = new Set(namedPoints().map(p => p.name));
  const pool = prefer ? [prefer] : NEW_NAMES.split('');
  for (const c of pool) if (!used.has(c)) return c;
  for (let i = 1; i < 30; i++) for (const c of pool) if (!used.has(c + i)) return c + i;
  return 'P' + Date.now() % 1000;
}
function nextId(prefix, list){
  let n = 1;
  const ids = new Set(list.map(x => x.id));
  while (ids.has(prefix + n)) n++;
  return prefix + n;
}
function ptOptions(sel){
  return namedPoints().map(p => `<option value="${p.id}"${p.id === sel ? ' selected' : ''}>${esc(S.pretty(p.name))}</option>`).join('');
}

/* ═══ боковая панель ═══ */
function refreshSide(){
  if (!st) return;
  const sc = st.scene, K = S.KINDS[sc.k];
  el('s3dKind').value = sc.k;
  el('s3dPar').innerHTML = K.par.map(key => {
    const step = key === 'n' ? 1 : 0.5, min = key === 'n' ? 3 : 0.5, max = key === 'n' ? 10 : 50;
    return `<label for="s3dP_${key}">${S.PAR_TITLES[key] || key}</label><input type="number" id="s3dP_${key}" data-par="${key}" min="${min}" max="${max}" step="${step}" value="${sc.p[key]}">`;
  }).join('');
  const opt = sc.opt;
  const chips = [['hid', 'Невидимые линии', opt.hid !== false], ['lab', 'Подписи', opt.lab !== false], ['planes', 'Плоскости', opt.planes !== false]];
  const M = meshNow();
  if (M.axis) chips.push(['axis', sc.k === 'pyr' ? 'Высота' : 'Ось и центры', opt.axis !== false]);
  if (sc.k === 'sphere') chips.push(['eq', 'Экватор', opt.eq !== false]);
  chips.push(['dims', 'Размеры', !!opt.dims], ['axes', 'Оси координат', !!opt.axes]);
  el('s3dOpts').innerHTML = chips.map(([k, t, on]) => `<button type="button" class="s3d-btn${on ? ' on' : ''}" data-opt="${k}">${t}</button>`).join('');
  el('s3dOrigin').innerHTML = opt.axes ? `<label>Начало координат</label><select id="s3dOriginSel" class="s3d-pt">${ptOptions(opt.origin || 'v0')}</select>` : '';
  root.querySelectorAll('#s3dTools [data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === st.tool));
  refreshToolBox();
  refreshMeasureArgs();
  el('s3dNetSec').style.display = sc.k === 'sphere' ? 'none' : '';
  el('s3dNetBtn').textContent = (sc.net || 0) > 0.5 ? 'Свернуть' : 'Развернуть';
  el('s3dNetRange').value = Math.round((sc.net || 0) * 100);
  root.querySelectorAll('#s3dViews [data-view]').forEach(b => b.classList.toggle('on', viewName() === b.dataset.view));
  el('s3dSpin').classList.toggle('on', !!st.spin);
  el('s3dUndo').disabled = !st.hist.length; el('s3dRedo').disabled = !st.fut.length;
  refreshList();
  refreshSteps();
  el('s3dHint').textContent = st.viewer ? '' : hintText();
}
function hintText(){
  if (st.tool === 'seg' || st.tool === 'line' || st.tool === 'plane'){
    const need = st.tool === 'plane' ? 3 : 2;
    const got = st.pend.map(id => S.pretty(nameOf(id))).join(', ');
    return HINTS[st.tool] + (got ? ` — выбрано: ${got} (${st.pend.length} из ${need})` : '');
  }
  return HINTS[st.tool] || '';
}
function nameOf(id){
  const R = S.resolvePoints(meshNow(), st.scene);
  return R.names[id] || id;
}
function refreshToolBox(){
  const box = el('s3dToolBox');
  if (st.tool === 'pt'){
    const r = st.ratio;
    const ratios = [[null, 'где щёлкнули'], [0.5, 'середина'], [1 / 3, '1 : 2'], [2 / 3, '2 : 1'], [0.25, '1 : 3'], [0.75, '3 : 1']];
    box.innerHTML = `<div class="s3d-note">На ребре точку делит в отношении (от первой буквы ребра):</div>
      <div class="s3d-row">${ratios.map(([v, t]) => `<button type="button" class="s3d-btn${(v === r) ? ' on' : ''}" data-ratio="${v == null ? '' : v}">${t}</button>`).join('')}</div>
      <div class="s3d-note">Точка внутри тела или на любом отрезке:</div>
      <div class="s3d-row"><select class="s3d-pt" id="s3dSegA">${ptOptions('v0')}</select><span>—</span><select class="s3d-pt" id="s3dSegB">${ptOptions(namedPoints().length > 6 ? 'v6' : 'v1')}</select>
        <input type="number" id="s3dSegM" value="1" min="1" step="1" style="width:46px"><span>:</span><input type="number" id="s3dSegN" value="1" min="1" step="1" style="width:46px">
        <button type="button" class="s3d-btn" id="s3dSegAdd">Добавить</button></div>
      <div class="s3d-note">По координатам${st.scene.opt.axes ? '' : ' (в осях тела, начало — в ' + esc(S.pretty(nameOf('v0'))) + ')'}:</div>
      <div class="s3d-row">x<input type="number" id="s3dX" value="0" step="0.5" style="width:56px">y<input type="number" id="s3dY" value="0" step="0.5" style="width:56px">z<input type="number" id="s3dZ" value="0" step="0.5" style="width:56px"><button type="button" class="s3d-btn" id="s3dXYZAdd">Добавить</button></div>`;
  } else if (st.tool === 'perp'){
    const pls = st.scene.planes;
    box.innerHTML = `<div class="s3d-row"><label>Из точки</label><select class="s3d-pt" id="s3dPerpP">${ptOptions(st.mSel.pp || (st.scene.pts[0] && st.scene.pts[0].id) || 'v0')}</select></div>
      <div class="s3d-row"><label>на прямую</label><select class="s3d-pt" id="s3dPerpA">${ptOptions('v1')}</select><select class="s3d-pt" id="s3dPerpB">${ptOptions('v2')}</select><button type="button" class="s3d-btn" id="s3dPerpLine">Построить</button></div>
      <div class="s3d-row"><label>на плоскость</label><select id="s3dPerpPl">${pls.map(P => `<option value="${P.id}">${esc(planeName(P))}</option>`).join('') || '<option value="">— сначала постройте сечение —</option>'}</select><button type="button" class="s3d-btn" id="s3dPerpPlane"${pls.length ? '' : ' disabled'}>Построить</button></div>
      <div class="s3d-note">Появится основание перпендикуляра (H) и знак прямого угла.</div>`;
  } else if (st.tool === 'text'){
    box.innerHTML = `<div class="s3d-row"><label>У точки</label><select class="s3d-pt" id="s3dTextP">${ptOptions(st.textFor || 'v0')}</select>
      <input type="text" id="s3dTextV" placeholder="Текст, например 6 или ?" style="flex:1"><button type="button" class="s3d-btn" id="s3dTextAdd">Добавить</button></div>
      <div class="s3d-note">Длины рёбер — переключатель «Размеры» выше или «Измерить → Длина отрезка».</div>`;
  } else box.innerHTML = '';
}
function planeName(P){ return 'Сечение ' + [P.a, P.b, P.c].map(id => S.pretty(nameOf(id))).join(''); }
function refreshMeasureArgs(){
  const t = el('s3dMType').value || 'len';
  const def = MEASURES.find(m => m[0] === t);
  const caps = MEASURE_CAPS[t];
  const pre = st.mSel[t] || {};
  // по умолчанию — первые точки и последнее сечение, чтобы меньше выбирать
  // первая плоскость — последнее сечение, вторая — основание
  const lastPl = st.scene.planes[st.scene.planes.length - 1];
  const defaults = { a: 'v0', b: 'v1', c: 'v2', d: 'v3', e: 'v4', f: 'v5', p: 'v0' };
  let html = '', k = 0, planeNo = 0;
  for (let g = 0; g < caps.length; g += 2){
    html += `<label>${caps[g]}</label>`;
    const isPlane = caps[g] === 'Плоскость';
    for (let j = 0; j < caps[g + 1]; j++){
      const key = def[2][k++];
      let val = pre[key] || defaults[key];
      if (isPlane && !pre[key]){
        if (planeNo === 0 && lastPl) val = [lastPl.a, lastPl.b, lastPl.c][j];
        else val = ['v0', 'v1', 'v2'][j];
      }
      html += `<select class="s3d-pt" data-marg="${key}">${ptOptions(val)}</select>`;
    }
    if (isPlane) planeNo++;
  }
  el('s3dMArgs').innerHTML = html;
}
function refreshList(){
  const sc = st.scene, M = meshNow(), R = S.resolvePoints(M, sc);
  const parts = [];
  const coords = (id) => {
    if (!sc.opt.axes || !R.pos[id]) return '';
    const O = R.pos[sc.opt.origin || 'v0'] || M.V[0], q = R.pos[id];
    return ` <small>(${S.fmtNum(q.x - O.x, 2)}; ${S.fmtNum(q.y - O.y, 2)}; ${S.fmtNum(q.z - O.z, 2)})</small>`;
  };
  sc.pts.forEach(pt => {
    parts.push(`<div class="s3d-item"><input type="text" class="s3d-name" maxlength="4" data-ren="${pt.id}" value="${esc(pt.name || '')}"><span class="s3d-txt">${esc(ptDesc(pt))}${coords(pt.id)}</span><button type="button" class="s3d-x" data-del="pt:${pt.id}" title="Удалить">✕</button></div>`);
  });
  if (sc.opt.axes){
    M.names.forEach((n, i) => { if (n) parts.push(`<div class="s3d-item"><b class="s3d-name">${esc(S.pretty(R.names['v' + i]))}</b><span class="s3d-txt">вершина${coords('v' + i)}</span></div>`); });
  }
  sc.segs.forEach(g => parts.push(`<div class="s3d-item"><span class="s3d-txt">${g.line ? 'Прямая' : 'Отрезок'} ${esc(S.pretty(R.names[g.a]) + S.pretty(R.names[g.b]))}</span><button type="button" class="s3d-x" data-del="seg:${g.id}">✕</button></div>`));
  sc.planes.forEach(P => {
    parts.push(`<div class="s3d-item"><span class="s3d-txt">${esc(planeName(P))}</span>
      <button type="button" class="s3d-mini" data-steps="${P.id}" title="Стороны сечения по одной">Пошагово</button>
      <button type="button" class="s3d-mini" data-cutpts="${P.id}" title="Подписать точки, где сечение пересекает рёбра">Точки</button>
      <button type="button" class="s3d-x" data-del="pl:${P.id}">✕</button></div>`);
  });
  sc.marks.forEach(m => {
    let t;
    if (m.t === 'text') t = `Подпись «${esc(m.text)}» у ${esc(S.pretty(R.names[m.p]))}`;
    else if (m.t === 'right') return;
    else {
      const res = S.measure(M, R.pos, m), def = MEASURES.find(x => x[0] === m.t);
      const who = def[2].map(k => S.pretty(R.names[m[k]] || '?'));
      t = `${def[1]} <small>${esc(argsText(m.t, who))}: ${esc(res.full || '—')}</small>`;
    }
    parts.push(`<div class="s3d-item"><span class="s3d-txt">${t}</span><button type="button" class="s3d-x" data-del="mk:${m.id}">✕</button></div>`);
  });
  el('s3dList').innerHTML = parts.join('') || '<div class="s3d-note">Пока ничего не построено. Выберите инструмент выше и щёлкните по фигуре.</div>';
}
function argsText(t, w){
  if (t === 'len') return w[0] + w[1];
  if (t === 'dline') return w[0] + ' и ' + w[1] + w[2];
  if (t === 'dist') return w[0] + ' и (' + w[1] + w[2] + w[3] + ')';
  if (t === 'angLL') return w[0] + w[1] + ' и ' + w[2] + w[3];
  if (t === 'angLP') return w[0] + w[1] + ' и (' + w[2] + w[3] + w[4] + ')';
  return '(' + w[0] + w[1] + w[2] + ') и (' + w[3] + w[4] + w[5] + ')';
}
function ptDesc(pt){
  const d = pt.def || {}, n = (id) => S.pretty(nameOf(id));
  if (d.t === 'seg'){
    const k = +d.k;
    const frac = Math.abs(k - 0.5) < 1e-9 ? 'середина' : ratioText(k);
    return `на ${n(d.a)}${n(d.b)}, ${frac}`;
  }
  if (d.t === 'face') return 'на грани';
  if (d.t === 'sph') return 'на шаре';
  if (d.t === 'xyz') return 'по координатам';
  if (d.t === 'foot') return `основание перпендикуляра из ${n(d.p)}`;
  if (d.t === 'cut') return `сечение ∩ ${n(d.a)}${n(d.b)}`;
  return '';
}
function ratioText(k){
  // k = AM : AB → AM : MB
  for (let q = 2; q <= 12; q++){
    const p = Math.round(k * q);
    if (p > 0 && p < q && Math.abs(p / q - k) < 1e-6) return `${p} : ${q - p}`;
  }
  return 'k = ' + S.fmtNum(k, 3);
}

/* ═══ пошаговое сечение ═══ */
function sectionSteps(P){
  const M = meshNow(), R = S.resolvePoints(M, st.scene);
  const a = R.pos[P.a], b = R.pos[P.b], c = R.pos[P.c];
  if (!a || !b || !c) return [];
  const pl = S.planeOf(a, b, c);
  if (!pl) return [];
  const sec = S.sectionOf(M, pl);
  if (!sec || !sec.sides) return [];
  const named = Object.keys(R.pos).filter(id => R.names[id]);
  const nameAt = (q) => { const id = named.find(i => V3.len(V3.sub(R.pos[i], q)) < 1e-6 * M.R); return id ? S.pretty(R.names[id]) : ''; };
  return S.orderSides(sec.sides, M).map(sd => {
    const F = M.faces[sd.f];
    // боковая грань пирамиды — с вершины: «SAD», а не «DAS»
    let vs = F.v.slice();
    if (vs.length === 3 && (M.k === 'pyr' || M.k === 'tetra')){ const top = Math.max(...vs); vs = [top].concat(vs.filter(i => i !== top).sort((a, b) => a - b)); }
    const fn = vs.every(i => M.names[i]) ? vs.map(i => S.pretty(R.names['v' + i])).join('') : '';
    const ends = nameAt(sd.a) + nameAt(sd.b);
    const where = fn ? `в грани ${fn}` : (F.v.length > 4 ? 'в основании' : 'на боковой поверхности');
    return (ends.length >= 2 ? `Проводим ${ends} ` : 'Проводим сторону сечения ') + where;
  });
}
function refreshSteps(){
  const box = el('s3dSteps');
  const P = st.stepPlane && st.scene.planes.find(x => x.id === st.stepPlane);
  if (!P || P.steps == null){ box.classList.remove('open'); box.innerHTML = ''; return; }
  const steps = sectionSteps(P);
  const k = Math.min(P.steps, steps.length);
  box.innerHTML = `<b>Шаг ${k} из ${steps.length}</b><span>${esc(k ? steps[k - 1] : 'Отмечены точки, через которые идёт плоскость')}</span>
    <span class="s3d-edit"><button type="button" class="s3d-btn" data-step="-1">◀</button> <button type="button" class="s3d-btn" data-step="1">▶</button> <button type="button" class="s3d-btn" data-step="all">Всё сечение</button></span>`;
  box.classList.add('open');
}

/* ═══ камера ═══ */
function viewName(){
  const c = st.scene.cam || { m: 'school' };
  if (c.m === 'school') return 'school';
  if (c.m !== 'orth') return '';
  const near = (a, b) => Math.abs(a - b) < 1e-6;
  if (near(c.pitch, 0) && near(c.yaw, 0)) return 'front';
  if (near(c.pitch, Math.PI / 2)) return 'top';
  if (near(c.pitch, 0) && near(c.yaw, Math.PI / 2)) return 'side';
  return '';
}
function setView(v){
  const cam = v === 'school' ? { m: 'school' } : v === 'front' ? { m: 'orth', yaw: 0, pitch: 0 } : v === 'top' ? { m: 'orth', yaw: 0, pitch: Math.PI / 2 } : { m: 'orth', yaw: Math.PI / 2, pitch: 0 };
  change(sc => { sc.cam = cam; });
}
function orthCam(){
  const c = st.scene.cam;
  if (!c || c.m !== 'orth') return S.schoolAsOrth(st.scene.k);
  return { m: 'orth', yaw: c.yaw, pitch: c.pitch };
}

/* ═══ рисование ═══ */
function resize(){
  if (!cv) return;
  const stage = el('s3dStage'), r = stage.getBoundingClientRect(), dpr = Math.max(1, window.devicePixelRatio || 1);
  cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
  st && (st.dpr = dpr, st.W = r.width, st.H = r.height);
}
function view(){
  // масштаб — от радиуса описанной сферы, а не от габарита картинки: при
  // вращении фигура не «дышит»
  const d = S.drawCached(st.scene);
  const M = d.mesh;
  let R = M.R;
  if (d.net){ const b = d.box; R = Math.max(b.maxX - b.minX, b.maxY - b.minY) / 2; }
  const s = Math.min(st.W, st.H) * 0.4 / R * st.zoom;
  let cx = st.W / 2, cy = st.H / 2;
  if (d.net){ cx -= ((d.box.minX + d.box.maxX) / 2) * s; cy += ((d.box.minY + d.box.maxY) / 2) * s; }
  return { d, s, toS: (q) => ({ x: cx + q.x * s, y: cy - q.y * s }) };
}
function render(){
  if (!st || !ctx) return;
  const dpr = st.dpr || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, st.W, st.H);
  const vw = view();
  const col = themeCol('--pencil', '#1d1d1f'), ink = themeCol('--ink', '#004c99');
  S.paint(ctx, vw.d, vw.toS, vw.s, { lw: 2, color: col, secColor: ink, hid: st.scene.opt.hid !== false, font: uiFont() });
  // подсветка: что под курсором и что уже выбрано
  ctx.save();
  if (st.hover && st.hover.kind === 'edge'){
    const a = vw.toS(vw.d.pr(st.hover.a3)), b = vw.toS(vw.d.pr(st.hover.b3));
    ctx.strokeStyle = ink; ctx.globalAlpha = 0.35; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    if (st.hover.q){ const q = vw.toS(vw.d.pr(st.hover.q)); ctx.globalAlpha = 1; ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(q.x, q.y, 4.5, 0, Math.PI * 2); ctx.fill(); }
  }
  if (st.hover && st.hover.kind === 'face' && st.hover.q){
    const q = vw.toS(vw.d.pr(st.hover.q)); ctx.fillStyle = ink; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.arc(q.x, q.y, 4.5, 0, Math.PI * 2); ctx.fill();
  }
  const ring = (id, a) => {
    const q3 = vw.d.pos[id];
    if (!q3) return;
    const q = vw.toS(vw.d.pr(q3));
    ctx.globalAlpha = a; ctx.strokeStyle = ink; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(q.x, q.y, 9, 0, Math.PI * 2); ctx.stroke();
  };
  if (st.hover && st.hover.kind === 'pt') ring(st.hover.id, 0.55);
  st.pend.forEach(id => ring(id, 1));
  ctx.restore();
}

/* ═══ выбор под курсором ═══ */
function pick(mx, my){
  const vw = view(), d = vw.d, M = d.mesh, sc = st.scene;
  if (d.net) return null;
  const toS2 = (q3) => vw.toS(d.pr(q3));
  // 1) точки
  let best = null, bd = 14;
  namedPoints().forEach(p => {
    const q = d.pos[p.id]; if (!q) return;
    const s = toS2(q), dd = Math.hypot(s.x - mx, s.y - my);
    if (dd < bd){ bd = dd; best = { kind: 'pt', id: p.id }; }
  });
  if (best) return best;
  if (st.tool !== 'pt') return null;
  // 2) рёбра тела и отрезки построения
  const cands = [];
  M.edges.forEach(e => { if (!e.smooth) cands.push({ a: 'v' + e.a, b: 'v' + e.b, a3: M.V[e.a], b3: M.V[e.b] }); });
  sc.segs.forEach(g => { const a = d.pos[g.a], b = d.pos[g.b]; if (a && b) cands.push({ a: g.a, b: g.b, a3: a, b3: b }); });
  let eb = null, ed = 10;
  cands.forEach(c => {
    const A = toS2(c.a3), B = toS2(c.b3), dx = B.x - A.x, dy = B.y - A.y, l2 = dx * dx + dy * dy;
    if (l2 < 1) return;
    let t = ((mx - A.x) * dx + (my - A.y) * dy) / l2;
    if (t < 0 || t > 1) return;
    const dist = Math.hypot(A.x + dx * t - mx, A.y + dy * t - my);
    // при прочих равных — видимое ребро (перед невидимым, что под ним)
    const hid = S.occluded(M, V3.lerp(c.a3, c.b3, t), d.cam.v);
    const score = dist + (hid ? 3 : 0);
    if (score < ed){ ed = score; eb = Object.assign({ kind: 'edge', t }, c); }
  });
  if (eb){
    // отношение: заданное кнопкой или «где щёлкнули» с прилипанием к простым долям
    // (проекция аффинная — доля на экране та же, что в пространстве)
    let k = st.ratio != null ? st.ratio : eb.t;
    if (st.ratio == null){
      const nice = [1 / 2, 1 / 3, 2 / 3, 1 / 4, 3 / 4, 1 / 5, 2 / 5, 3 / 5, 4 / 5];
      const n = nice.find(f => Math.abs(f - k) < 0.04);
      if (n != null) k = n;
    }
    eb.k = k; eb.q = V3.lerp(eb.a3, eb.b3, k);
    return eb;
  }
  // 3) видимые грани: барицентрика в треугольнике веера (тоже аффинная)
  if (M.sphere){
    const c = toS2(M.sphere.c), r = M.sphere.r * vw.s;
    const X = (mx - c.x) / vw.s, Y = -(my - c.y) / vw.s, rr = M.sphere.r;
    if (X * X + Y * Y < rr * rr){
      const Z = Math.sqrt(rr * rr - X * X - Y * Y), cam = d.cam;
      const w = V3.add(V3.add(V3.mul(cam.ex, X), V3.mul(cam.ey, Y)), V3.mul(cam.v, Z));
      void r;
      return { kind: 'face', def: { t: 'sph', th: Math.atan2(w.y, w.x), ph: Math.asin(Math.max(-1, Math.min(1, w.z / rr))) }, q: V3.add(M.sphere.c, w) };
    }
    return null;
  }
  for (let fi = 0; fi < M.faces.length; fi++){
    const F = M.faces[fi];
    if (!S.frontFace(F, d.cam.v)) continue;
    const P = F.v.map(i => toS2(M.V[i]));
    for (let j = 1; j + 1 < P.length; j++){
      const w = bary(mx, my, P[0], P[j], P[j + 1]);
      if (w && w.every(x => x >= -1e-6)){
        const q = V3.add(V3.add(V3.mul(M.V[F.v[0]], w[0]), V3.mul(M.V[F.v[j]], w[1])), V3.mul(M.V[F.v[j + 1]], w[2]));
        return { kind: 'face', def: { t: 'face', f: fi, tri: [0, j, j + 1], w }, q };
      }
    }
  }
  return null;
}
function bary(x, y, a, b, c){
  const den = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
  if (Math.abs(den) < 1e-9) return null;
  const w0 = ((b.y - c.y) * (x - c.x) + (c.x - b.x) * (y - c.y)) / den;
  const w1 = ((c.y - a.y) * (x - c.x) + (a.x - c.x) * (y - c.y)) / den;
  return [w0, w1, 1 - w0 - w1];
}

/* ═══ действия ═══ */
function addPoint(def, name){
  let id = null;
  change(sc => {
    id = nextId('p', sc.pts);
    sc.pts.push({ id, name: name || freeName(), def });
  });
  return id;
}
function clickAt(mx, my){
  if (!st || st.viewer) return;
  const h = pick(mx, my);
  if (st.tool === 'pt'){
    if (!h || h.kind === 'pt') return;
    if (h.kind === 'edge') addPoint({ t: 'seg', a: h.a, b: h.b, k: h.k });
    else addPoint(h.def);
    return;
  }
  if (st.tool === 'text'){
    if (h && h.kind === 'pt'){ st.textFor = h.id; refreshToolBox(); const inp = el('s3dTextV'); if (inp) inp.focus(); }
    return;
  }
  if (st.tool === 'seg' || st.tool === 'line' || st.tool === 'plane'){
    if (!h || h.kind !== 'pt') return;
    if (st.pend.includes(h.id)){ st.pend = st.pend.filter(x => x !== h.id); }
    else st.pend.push(h.id);
    const need = st.tool === 'plane' ? 3 : 2;
    if (st.pend.length >= need){
      const ids = st.pend.slice(0, need);
      st.pend = [];
      if (st.tool === 'plane'){
        const M = meshNow(), R = S.resolvePoints(M, st.scene);
        if (!S.planeOf(R.pos[ids[0]], R.pos[ids[1]], R.pos[ids[2]])){ el('s3dHint').textContent = 'Эти три точки лежат на одной прямой — плоскость не задают'; render(); return; }
        change(sc => { sc.planes.push({ id: nextId('s', sc.planes), a: ids[0], b: ids[1], c: ids[2], sec: true, plane: false }); });
      } else {
        change(sc => { sc.segs.push({ id: nextId('g', sc.segs), a: ids[0], b: ids[1], line: st.tool === 'line' }); });
      }
      return;
    }
    el('s3dHint').textContent = hintText();
    render();
  }
}
function perpLine(){
  const p = el('s3dPerpP').value, a = el('s3dPerpA').value, b = el('s3dPerpB').value;
  if (!p || !a || !b || a === b) return;
  st.mSel.pp = p;
  change(sc => {
    const id = nextId('p', sc.pts);
    sc.pts.push({ id, name: freeName('H'), def: { t: 'foot', p, a, b } });
    sc.segs.push({ id: nextId('g', sc.segs), a: p, b: id });
    sc.marks.push({ id: nextId('m', sc.marks), t: 'right', p: id, a: p, b: a });
  });
}
function perpPlane(){
  const p = el('s3dPerpP').value, P = st.scene.planes.find(x => x.id === el('s3dPerpPl').value);
  if (!p || !P) return;
  st.mSel.pp = p;
  change(sc => {
    const id = nextId('p', sc.pts);
    sc.pts.push({ id, name: freeName('H'), def: { t: 'foot', p, a: P.a, b: P.b, c: P.c } });
    sc.segs.push({ id: nextId('g', sc.segs), a: p, b: id });
    // знак прямого угла — между перпендикуляром и направлением на точку плоскости
    sc.marks.push({ id: nextId('m', sc.marks), t: 'right', p: id, a: p, b: P.a === p ? P.b : P.a });
  });
}
function cutPoints(planeId){
  const P = st.scene.planes.find(x => x.id === planeId);
  if (!P) return;
  const M = meshNow(), R = S.resolvePoints(M, st.scene);
  const a = R.pos[P.a], b = R.pos[P.b], c = R.pos[P.c], pl = a && b && c && S.planeOf(a, b, c);
  if (!pl) return;
  const add = [];
  const exists = (q) => Object.keys(R.pos).some(id => R.names[id] && V3.len(V3.sub(R.pos[id], q)) < 1e-6 * M.R) || add.some(x => V3.len(V3.sub(x.q, q)) < 1e-6 * M.R);
  M.edges.forEach(e => {
    if (e.smooth || !M.names[e.a] || !M.names[e.b]) return;
    const A = M.V[e.a], Bq = M.V[e.b], da = V3.dot(pl.n, A) - pl.d, db = V3.dot(pl.n, Bq) - pl.d;
    if (!((da < 0 && db > 0) || (da > 0 && db < 0))) return;
    const q = V3.lerp(A, Bq, da / (da - db));
    if (!exists(q)) add.push({ q, a: 'v' + e.a, b: 'v' + e.b });
  });
  if (!add.length){ el('s3dHint').textContent = 'Все точки сечения на рёбрах уже подписаны'; return; }
  change(sc => {
    add.forEach(x => {
      sc.pts.push({ id: nextId('p', sc.pts), name: freeName(), def: { t: 'cut', a: x.a, b: x.b, c: P.a, d: P.b, e: P.c } });
    });
  });
}
function addMeasure(){
  const t = el('s3dMType').value, def = MEASURES.find(m => m[0] === t);
  const args = {};
  root.querySelectorAll('#s3dMArgs [data-marg]').forEach(s => { args[s.dataset.marg] = s.value; });
  st.mSel[t] = Object.assign({}, args);
  if (def[2].some(k => !args[k])) return;
  const M = meshNow(), R = S.resolvePoints(M, st.scene);
  const res = S.measure(M, R.pos, Object.assign({ t }, args));
  if (!res.ok){ el('s3dHint').textContent = 'Так не измерить: проверьте точки (совпадают или лежат на одной прямой)'; return; }
  change(sc => { sc.marks.push(Object.assign({ id: nextId('m', sc.marks), t }, args)); });
}

/* ═══ анимации: автовращение и развёртка ═══ */
function stopAnim(){ if (st && st.raf){ cancelAnimationFrame(st.raf); st.raf = 0; } }
function loop(){
  if (!st) return;
  st.raf = 0;
  const now = performance.now(), dt = Math.min(0.05, (now - (st.lastT || now)) / 1000);
  st.lastT = now;
  let more = false;
  if (st.spin){
    const c = orthCam();
    st.scene.cam = { m: 'orth', yaw: c.yaw + dt * 0.6, pitch: c.pitch };
    more = true;
  }
  if (st.anim){
    const A = st.anim;
    A.t = Math.min(1, A.t + dt / 1.6);
    const e = A.t < 0.5 ? 2 * A.t * A.t : 1 - Math.pow(-2 * A.t + 2, 2) / 2;
    st.scene.net = A.from + (A.to - A.from) * e;
    st.scene.cam = lerpCam(A.cam0, A.cam1, e);
    if (A.t >= 1){
      st.scene.net = A.to;
      if (A.to === 0 && A.restore) st.scene.cam = A.restore;
      st.anim = null; refreshSide();
    } else more = true;
  }
  render(); syncSend(true);
  if (more) st.raf = requestAnimationFrame(loop);
}
function kick(){ if (st && !st.raf){ st.lastT = performance.now(); st.raf = requestAnimationFrame(loop); } }
function lerpCam(a, b, t){ return { m: 'orth', yaw: a.yaw + (b.yaw - a.yaw) * t, pitch: a.pitch + (b.pitch - a.pitch) * t }; }
// откуда смотреть на готовую развёртку: прямо на корневую грань
function netCam(){
  const M = meshNow(), T = S.netTree(M);
  if (!T) return orthCam();
  let n = M.faces[T.root].n;
  if (n.z < -0.5) n = V3.mul(n, -1);
  const c0 = orthCam();
  // сверху — без поворота вокруг вертикали, чтобы развёртка легла ровно
  void c0;
  if (Math.abs(n.z) > 0.99) return { m: 'orth', yaw: 0, pitch: Math.PI / 2 * Math.sign(n.z) };
  return { m: 'orth', yaw: Math.atan2(n.x, -n.y), pitch: Math.asin(Math.max(-1, Math.min(1, n.z))) };
}
function toggleNet(){
  const sc = st.scene, open = (sc.net || 0) < 0.5;
  change(() => {}, { keepSide: true });
  st.spin = false;
  const c0 = orthCam();
  if (open){
    st.netRestore = sc.cam && sc.cam.m === 'school' ? { m: 'school' } : c0;
    st.anim = { t: 0, from: sc.net || 0, to: 1, cam0: c0, cam1: netCam() };
  } else {
    const back = st.netRestore && st.netRestore.m === 'orth' ? st.netRestore : S.schoolAsOrth(sc.k);
    st.anim = { t: 0, from: sc.net || 1, to: 0, cam0: c0, cam1: back, restore: st.netRestore };
  }
  kick();
}

/* ═══ совместная сессия ═══ */
let syncTimer = null, syncHelloWired = false;
function syncSend(openFlag, force){
  const TS = window.TrainerSession;
  if (!TS || !TS.broadcastEvent || window.__boardViewer) return;
  if (!TS.getCode || !TS.getCode()) return;
  if (!syncHelloWired && TS.onEvent){
    syncHelloWired = true;
    // ученик подключился позже — дошлём ему открытый конструктор
    TS.onEvent('bd_hello', () => { if (isOpen() && !st.viewer) syncSend(true, true); });
  }
  const send = () => {
    syncTimer = null;
    if (!isOpen()){ TS.broadcastEvent('s3d', { o: 0 }); return; }
    TS.broadcastEvent('s3d', { o: 1, sc: st.scene, z: st.zoom });
  };
  if (!openFlag || force){ clearTimeout(syncTimer); syncTimer = null; if (!openFlag) TS.broadcastEvent('s3d', { o: 0 }); else send(); return; }
  if (!syncTimer) syncTimer = setTimeout(send, 60);
}
// у ученика: показать, что прислал учитель
function viewerApply(d){
  if (!d || !d.o){ if (isOpen() && st.viewer) close(); return; }
  if (!isOpen() || !st.viewer) open({ viewer: true, scene: d.sc });
  st.scene = d.sc; st.zoom = d.z || 1;
  render();
}

/* ═══ на доску ═══ */
function toBoard(){
  if (!st || st.viewer) return;
  stopAnim();
  st.spin = false;
  const sc = clone(st.scene);
  if (st.anim){ sc.net = st.anim.to; st.anim = null; }
  if (typeof B === 'undefined' || !B) { close(); return; }
  const obj = st.objId ? B.objects.find(o => o.id === st.objId && o.solid) : null;
  if (obj){
    pushUndo();
    obj.solid = sc;
    window.figFitSolidRect(obj);
    saveDB(); scheduleRedraw();
    const id = obj.id;
    close();
    selectedId = id; multiSelectIds = []; updateContextMenu();
    return;
  }
  const o = newBase('poly');
  delete o.fill;
  window.figPlaceSolid(sc, o);
  commitObject(o);
  close();
  window.figSelectNew(o);
}
function askClose(){
  if (!st) return;
  if (st.viewer || !st.dirty){ close(); return; }
  el('s3dConfirm').classList.add('open');
}

/* ═══ события ═══ */
function wire(){
  window.addEventListener('resize', () => { if (isOpen()){ resize(); render(); } });
  el('s3dViews').addEventListener('click', (e) => { const b = e.target.closest('[data-view]'); if (b){ st.spin = false; stopAnim(); setView(b.dataset.view); } });
  el('s3dSpin').addEventListener('click', () => { st.spin = !st.spin; if (st.spin){ if (!st.scene.cam || st.scene.cam.m !== 'orth') st.scene.cam = orthCam(); kick(); } refreshSide(); });
  el('s3dUndo').addEventListener('click', undo);
  el('s3dRedo').addEventListener('click', redo);
  el('s3dToBoard').addEventListener('click', toBoard);
  el('s3dClose').addEventListener('click', askClose);
  el('s3dCloseYes').addEventListener('click', close);
  el('s3dCloseNo').addEventListener('click', () => el('s3dConfirm').classList.remove('open'));
  el('s3dKind').addEventListener('change', (e) => {
    const k = e.target.value;
    // другое тело — построения прежнего к нему не относятся
    change(sc => { sc.k = k; sc.p = S.clampPar(k, {}); sc.pts = []; sc.segs = []; sc.planes = []; sc.marks = []; sc.nm = {}; sc.net = 0; sc.cam = { m: 'school' }; });
  });
  el('s3dPar').addEventListener('change', (e) => {
    const inp = e.target.closest('[data-par]');
    if (!inp) return;
    change(sc => { const p = Object.assign({}, sc.p, { [inp.dataset.par]: +inp.value }); sc.p = S.clampPar(sc.k, p); });
  });
  el('s3dOpts').addEventListener('click', (e) => {
    const b = e.target.closest('[data-opt]'); if (!b) return;
    const k = b.dataset.opt, defOn = ['hid', 'lab', 'planes', 'axis', 'eq'].includes(k);
    change(sc => {
      const o = Object.assign({}, sc.opt);
      if (defOn){ if (o[k] === false) delete o[k]; else o[k] = false; }
      else { if (o[k]) delete o[k]; else o[k] = true; }
      sc.opt = o;
    });
  });
  el('s3dOrigin').addEventListener('change', (e) => { if (e.target.id === 's3dOriginSel') change(sc => { sc.opt = Object.assign({}, sc.opt, { origin: e.target.value }); }); });
  el('s3dTools').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tool]'); if (!b) return;
    st.tool = b.dataset.tool; st.pend = []; refreshSide(); render();
  });
  el('s3dToolBox').addEventListener('click', (e) => {
    const r = e.target.closest('[data-ratio]');
    if (r){ st.ratio = r.dataset.ratio === '' ? null : +r.dataset.ratio; refreshToolBox(); return; }
    if (e.target.id === 's3dSegAdd'){
      const a = el('s3dSegA').value, b = el('s3dSegB').value, m = Math.max(0, +el('s3dSegM').value || 0), n = Math.max(0, +el('s3dSegN').value || 0);
      if (a && b && a !== b && m + n > 0) addPoint({ t: 'seg', a, b, k: m / (m + n) });
      return;
    }
    if (e.target.id === 's3dXYZAdd'){
      const M = meshNow(), R = S.resolvePoints(M, st.scene);
      const O = st.scene.opt.axes ? (R.pos[st.scene.opt.origin || 'v0'] || M.V[0]) : M.V[0];
      addPoint({ t: 'xyz', x: O.x + (+el('s3dX').value || 0), y: O.y + (+el('s3dY').value || 0), z: O.z + (+el('s3dZ').value || 0) });
      return;
    }
    if (e.target.id === 's3dPerpLine'){ perpLine(); return; }
    if (e.target.id === 's3dPerpPlane'){ perpPlane(); return; }
    if (e.target.id === 's3dTextAdd'){
      const p = el('s3dTextP').value, text = el('s3dTextV').value.trim();
      if (p && text) change(sc => { sc.marks.push({ id: nextId('m', sc.marks), t: 'text', p, text }); });
    }
  });
  el('s3dToolBox').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 's3dTextV') el('s3dTextAdd').click(); });
  el('s3dMType').addEventListener('change', refreshMeasureArgs);
  el('s3dMAdd').addEventListener('click', addMeasure);
  el('s3dNetBtn').addEventListener('click', toggleNet);
  el('s3dNetRange').addEventListener('input', (e) => {
    const t = +e.target.value / 100;
    if (!st.netDragging){ st.netDragging = true; st.hist.push(JSON.stringify(st.scene)); st.fut.length = 0; st.netCam0 = (st.scene.net || 0) > 0 ? null : orthCam(); st.netRestore = st.netRestore || (st.scene.cam && st.scene.cam.m === 'school' ? { m: 'school' } : orthCam()); }
    stopAnim(); st.anim = null; st.spin = false;
    st.scene.net = t;
    const c0 = st.netRestore && st.netRestore.m === 'orth' ? st.netRestore : S.schoolAsOrth(st.scene.k);
    st.scene.cam = t > 0 ? lerpCam(c0, netCam(), t) : (st.netRestore || { m: 'school' });
    st.dirty = true;
    render(); syncSend(true);
  });
  el('s3dNetRange').addEventListener('change', () => { st.netDragging = false; refreshSide(); });
  el('s3dList').addEventListener('click', (e) => {
    const del = e.target.closest('[data-del]');
    if (del){
      const [kind, id] = del.dataset.del.split(':');
      change(sc => {
        if (kind === 'pt'){
          // вместе с точкой — всё, что на неё опирается
          const gone = new Set([id]);
          let grew = true;
          while (grew){
            grew = false;
            sc.pts.forEach(p => { const d = p.def || {}; if (!gone.has(p.id) && ['a', 'b', 'c', 'd', 'e', 'p'].some(k => gone.has(d[k]))){ gone.add(p.id); grew = true; } });
          }
          sc.pts = sc.pts.filter(p => !gone.has(p.id));
          sc.segs = sc.segs.filter(g => !gone.has(g.a) && !gone.has(g.b));
          sc.planes = sc.planes.filter(P => ![P.a, P.b, P.c].some(x => gone.has(x)));
          sc.marks = sc.marks.filter(m => !['a', 'b', 'c', 'd', 'e', 'f', 'p'].some(k => gone.has(m[k])));
        }
        if (kind === 'seg') sc.segs = sc.segs.filter(g => g.id !== id);
        if (kind === 'pl') sc.planes = sc.planes.filter(P => P.id !== id);
        if (kind === 'mk') sc.marks = sc.marks.filter(m => m.id !== id);
      });
      return;
    }
    const stp = e.target.closest('[data-steps]');
    if (stp){
      const id = stp.dataset.steps;
      st.stepPlane = id;
      change(sc => { sc.planes = sc.planes.map(P => P.id === id ? Object.assign({}, P, { steps: 0 }) : P); }, { keepSide: true });
      refreshSteps();
      return;
    }
    const cp = e.target.closest('[data-cutpts]');
    if (cp) cutPoints(cp.dataset.cutpts);
  });
  let renArmed = false;
  el('s3dList').addEventListener('focusin', () => { renArmed = false; });
  el('s3dList').addEventListener('input', (e) => {
    const inp = e.target.closest('[data-ren]'); if (!inp) return;
    if (!renArmed){ st.hist.push(JSON.stringify(st.scene)); st.fut.length = 0; renArmed = true; }
    st.scene.pts = st.scene.pts.map(p => p.id === inp.dataset.ren ? Object.assign({}, p, { name: inp.value.trim() }) : p);
    st.dirty = true; render(); syncSend(true);
  });
  el('s3dSteps').addEventListener('click', (e) => {
    const b = e.target.closest('[data-step]'); if (!b || !st.stepPlane) return;
    const P = st.scene.planes.find(x => x.id === st.stepPlane); if (!P) return;
    const v = b.dataset.step;
    if (v === 'close') return;
    const total = sectionSteps(P).length;
    change(sc => {
      sc.planes = sc.planes.map(Q => {
        if (Q.id !== P.id) return Q;
        const R = Object.assign({}, Q);
        if (v === 'all'){ delete R.steps; }
        else R.steps = Math.max(0, Math.min(total, (Q.steps || 0) + (+v)));
        if (R.steps === total) delete R.steps;
        return R;
      });
    }, { keepSide: true });
    if (v === 'all' || !st.scene.planes.find(x => x.id === P.id && x.steps != null)){
      // последний шаг — пошаговый показ кончился; оставляем подпись последнего шага
      const steps = sectionSteps(P);
      const n = steps.length, w = (n % 10 === 1 && n % 100 !== 11) ? 'сторона' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 'стороны' : 'сторон';
      el('s3dSteps').innerHTML = `<b>Сечение построено</b><span>${n} ${w}</span><button type="button" class="s3d-btn s3d-edit" data-step="close">OK</button>`;
      st.stepPlane = null;
      return;
    }
    refreshSteps();
  });
  el('s3dSteps').addEventListener('click', (e) => { if (e.target.closest('[data-step="close"]')) el('s3dSteps').classList.remove('open'); });

  // вращение протяжкой, щелчок — действие, колесо и щипок — масштаб
  const pointers = new Map();
  let drag = null, pinch = null;
  cv.addEventListener('pointerdown', (e) => {
    if (!st) return;
    cv.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2){
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: st.zoom }; drag = null; return;
    }
    drag = { x: e.clientX, y: e.clientY, moved: false, cam: orthCam() };
  });
  cv.addEventListener('pointermove', (e) => {
    if (!st) return;
    const r = cv.getBoundingClientRect();
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size === 2){
      const [a, b] = [...pointers.values()];
      st.zoom = Math.max(0.4, Math.min(4, pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, pinch.d)));
      render(); syncSend(true); return;
    }
    if (drag && (drag.moved || Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 4)){
      if (st.viewer) return;
      if (!drag.moved){ drag.moved = true; st.spin = false; stopAnim(); cv.classList.add('drag'); }
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      const pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, drag.cam.pitch + dy * 0.01));
      st.scene.cam = { m: 'orth', yaw: drag.cam.yaw - dx * 0.01, pitch };
      st.dirty = true;
      render(); syncSend(true);
      return;
    }
    if (!drag && !st.viewer){
      const h = pick(e.clientX - r.left, e.clientY - r.top);
      const same = JSON.stringify(h && { k: h.kind, id: h.id, a: h.a, b: h.b, q: h.q }) === JSON.stringify(st.hover && { k: st.hover.kind, id: st.hover.id, a: st.hover.a, b: st.hover.b, q: st.hover.q });
      if (!same){ st.hover = h; render(); }
    }
  });
  const up = (e) => {
    if (!st) return;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    cv.classList.remove('drag');
    if (drag && !drag.moved && e.type === 'pointerup'){
      const r = cv.getBoundingClientRect();
      clickAt(e.clientX - r.left, e.clientY - r.top);
    } else if (drag && drag.moved){
      // поворот — тоже шаг отмены, но один на всю протяжку
      st.hist.push(JSON.stringify(Object.assign({}, st.scene, { cam: { m: 'orth', yaw: drag.cam.yaw, pitch: drag.cam.pitch } })));
      st.fut.length = 0;
      refreshSide();
    }
    drag = null;
  };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  cv.addEventListener('pointerleave', () => { if (st && st.hover){ st.hover = null; render(); } });
  cv.addEventListener('wheel', (e) => {
    if (!st) return;
    e.preventDefault();
    st.zoom = Math.max(0.4, Math.min(4, st.zoom * Math.exp(-e.deltaY * 0.0015)));
    render(); syncSend(true);
  }, { passive: false });
  document.addEventListener('keydown', (e) => {
    if (!isOpen() || st.viewer) return;
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;   // доска такие клавиши и сама пропускает
    if (tag === 'SELECT'){ e.stopImmediatePropagation(); return; }
    // доска под окном не должна получать эти клавиши
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z'){ e.preventDefault(); e.stopImmediatePropagation(); if (e.shiftKey) redo(); else undo(); return; }
    if (e.key === 'Escape'){ e.stopImmediatePropagation(); if (st.pend.length){ st.pend = []; refreshSide(); render(); } else askClose(); return; }
    e.stopImmediatePropagation();
  }, true);
}

window.Solids3D = {
  open, close, isOpen, viewerApply,
  // для проверок
  state: () => st, pick, clickAt, view, undo, redo, toBoard, sectionSteps, toggleNet,
};
})();
