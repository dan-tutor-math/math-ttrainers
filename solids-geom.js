/* ═══════════════════════════════════════════════════════════════════════
   solids-geom.js — геометрия тел для досок (промпт №17 «фигуры», этапы 2–3).

   Свой маленький движок вместо готовой 3D-библиотеки. Причина не в весе (хотя
   и в нём тоже): школьному чертежу нужен ПУНКТИР НЕВИДИМЫХ ЛИНИЙ, а
   библиотеки рисуют «как в жизни» — задние рёбра просто закрыты гранями.
   Здесь все тела выпуклые, поэтому видимость считается точно и дёшево:
     - ребро многогранника видно, если видна хоть одна из двух его граней
       (грань видна, если её внешняя нормаль смотрит на зрителя);
     - у круглых тел боковая поверхность — многогранник из 72 граней, но его
       «швы» не рисуются, кроме контурных (одна грань видна, другая нет) —
       это и есть образующие на контуре цилиндра и конуса;
     - произвольная точка (на ребре, на грани, внутри, на отрезке построения)
       скрыта, если луч от неё к зрителю проходит сквозь тело. Для выпуклого
       тела это пересечение полупространств граней, для шара — квадратное
       уравнение.
   Файл грузится по требованию (board-figures.js → figEnsureSolids), только
   когда на доске появилось тело или открыли вкладку «Стереометрия».

   Сцена (поле solid у объекта доски и состояние конструктора):
     { k: вид, p: параметры, nm: { id: имя } — переименования,
       cam: { m: 'school' } | { m: 'orth', yaw, pitch },
       pts: [{ id, def }] — точки построения, segs: [{ id, a, b, line }],
       planes: [{ id, a, b, c, sec, plane }], marks: [...], opt: {...} }
   id вершин тела — 'v0', 'v1', …; точек построения — 'p1', 'p2', …
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

const V3 = {
  add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }),
  sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }),
  mul: (a, k) => ({ x: a.x * k, y: a.y * k, z: a.z * k }),
  dot: (a, b) => a.x * b.x + a.y * b.y + a.z * b.z,
  cross: (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }),
  len: (a) => Math.hypot(a.x, a.y, a.z),
  unit: (a) => { const l = Math.hypot(a.x, a.y, a.z) || 1; return { x: a.x / l, y: a.y / l, z: a.z / l }; },
  lerp: (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t }),
  P: (x, y, z) => ({ x, y, z }),
};

const RING = 72;                       // граней у боковой поверхности круглых тел
const LETTERS = 'ABCDEFGHKLMN';

/* ═══ виды тел ═══
   par — какие параметры у вида (для конструктора), def — значения по
   умолчанию в условных единицах. Ось z вверх, y — «вглубь» (от зрителя),
   основание лежит в плоскости z = 0. */
const KINDS = {
  cube:   { title: 'Куб', short: 'Куб', par: ['a'], def: { a: 4 } },
  box:    { title: 'Прямоугольный параллелепипед', short: 'Параллелепипед', par: ['w', 'd', 'h'], def: { w: 6, d: 4, h: 3 } },
  prism:  { title: 'Правильная призма', short: 'Призма', par: ['n', 'a', 'h'], def: { n: 3, a: 4, h: 5 } },
  pyr:    { title: 'Правильная пирамида', short: 'Пирамида', par: ['n', 'a', 'h'], def: { n: 4, a: 4, h: 4 } },
  tetra:  { title: 'Правильный тетраэдр', short: 'Тетраэдр', par: ['a'], def: { a: 4 } },
  fpyr:   { title: 'Усечённая пирамида', short: 'Усечённая пирамида', par: ['n', 'a', 'a2', 'h'], def: { n: 4, a: 4, a2: 2, h: 3 } },
  cyl:    { title: 'Цилиндр', short: 'Цилиндр', par: ['r', 'h'], def: { r: 2, h: 4 }, round: true },
  cone:   { title: 'Конус', short: 'Конус', par: ['r', 'h'], def: { r: 2, h: 4 }, round: true },
  fcone:  { title: 'Усечённый конус', short: 'Усечённый конус', par: ['r', 'r2', 'h'], def: { r: 2.5, r2: 1.3, h: 3 }, round: true },
  sphere: { title: 'Шар', short: 'Шар', par: ['r'], def: { r: 2.5 }, round: true },
};
const PAR_TITLES = { a: 'Сторона основания', w: 'Ширина', d: 'Глубина', h: 'Высота', n: 'Сторон основания',
  a2: 'Сторона верхнего основания', r: 'Радиус', r2: 'Радиус верхнего основания' };
// пункты меню «Стереометрия» — набор из промпта; призмы и пирамиды — один
// вид с числом сторон основания (в конструкторе его можно поменять)
const MENU = [
  { id: 'cube', k: 'cube', title: 'Куб' },
  { id: 'box', k: 'box', title: 'Прямоугольный параллелепипед', short: 'Параллелепипед' },
  { id: 'prism3', k: 'prism', p: { n: 3, a: 4, h: 5 }, title: 'Правильная треугольная призма', short: 'Треуг. призма' },
  { id: 'prism6', k: 'prism', p: { n: 6, a: 2.2, h: 4 }, title: 'Правильная шестиугольная призма', short: 'Шестиуг. призма' },
  { id: 'pyr3', k: 'pyr', p: { n: 3, a: 4, h: 4 }, title: 'Правильная треугольная пирамида', short: 'Треуг. пирамида' },
  { id: 'pyr4', k: 'pyr', p: { n: 4, a: 4, h: 4 }, title: 'Правильная четырёхугольная пирамида', short: 'Четырёхуг. пирамида' },
  { id: 'tetra', k: 'tetra', title: 'Тетраэдр' },
  { id: 'cyl', k: 'cyl', title: 'Цилиндр' },
  { id: 'cone', k: 'cone', title: 'Конус' },
  { id: 'sphere', k: 'sphere', title: 'Шар' },
  { id: 'fcone', k: 'fcone', title: 'Усечённый конус' },
  { id: 'fpyr', k: 'fpyr', title: 'Усечённая пирамида' },
];

function clampPar(k, p){
  const K = KINDS[k], q = Object.assign({}, K.def, p || {});
  Object.keys(q).forEach(key => {
    if (key === 'n') q.n = Math.max(3, Math.min(10, Math.round(+q.n) || 3));
    else q[key] = Math.max(0.1, Math.min(100, +q[key] || K.def[key] || 1));
  });
  if (k === 'fpyr' && q.a2 >= q.a) q.a2 = q.a * 0.5;
  if (k === 'fcone' && q.r2 >= q.r) q.r2 = q.r * 0.5;
  return q;
}

// правильный n-угольник со стороной a в плоскости z: первая вершина —
// спереди слева, дальше по часовой, если смотреть сверху (как ABCD у куба:
// A спереди слева, B сзади слева, C сзади справа, D спереди справа)
function regBase(n, a, z){
  const R = a / (2 * Math.sin(Math.PI / n));
  const a0 = Math.PI * 1.5 - Math.PI / n;
  const out = [];
  for (let i = 0; i < n; i++){ const t = a0 - i * 2 * Math.PI / n; out.push(V3.P(R * Math.cos(t), R * Math.sin(t), z)); }
  return out;
}
function ring(r, z, n){
  const out = [];
  for (let i = 0; i < n; i++){ const t = -Math.PI / 2 + i * 2 * Math.PI / n; out.push(V3.P(r * Math.cos(t), r * Math.sin(t), z)); }
  return out;
}

/* Сетка тела. V — точки, names — имена по умолчанию ('' — точка без имени:
   кольца круглых тел), F — грани (номера вершин), smooth — «швы» боковой
   поверхности, aux — центры оснований (не лежат на поверхности, но это
   точки чертежа: O, O₁, к ним строят отрезки). */
function buildMesh(k, p){
  p = clampPar(k, p);
  const V = [], names = [], F = [], smooth = new Set(), aux = new Set();
  const addV = (pt, nm) => { V.push(pt); names.push(nm || ''); return V.length - 1; };
  let sphere = null, axis = null;
  if (k === 'cube' || k === 'box'){
    const w = k === 'cube' ? p.a : p.w, d = k === 'cube' ? p.a : p.d, h = k === 'cube' ? p.a : p.h;
    const base = [V3.P(0, 0, 0), V3.P(0, d, 0), V3.P(w, d, 0), V3.P(w, 0, 0)];
    base.forEach((q, i) => addV(q, 'ABCD'[i]));
    base.forEach((q, i) => addV(V3.P(q.x, q.y, h), 'ABCD'[i] + '1'));
    F.push([0, 1, 2, 3], [4, 5, 6, 7]);
    for (let i = 0; i < 4; i++) F.push([i, (i + 1) % 4, 4 + (i + 1) % 4, 4 + i]);
  } else if (k === 'prism' || k === 'fpyr'){
    const n = p.n, top = k === 'prism' ? regBase(n, p.a, p.h) : regBase(n, p.a2, p.h);
    regBase(n, p.a, 0).forEach((q, i) => addV(q, LETTERS[i]));
    top.forEach((q, i) => addV(q, LETTERS[i] + '1'));
    F.push([...Array(n).keys()], [...Array(n).keys()].map(i => n + i));
    for (let i = 0; i < n; i++) F.push([i, (i + 1) % n, n + (i + 1) % n, n + i]);
  } else if (k === 'pyr' || k === 'tetra'){
    const n = k === 'tetra' ? 3 : p.n, a = p.a;
    const h = k === 'tetra' ? a * Math.sqrt(2 / 3) : p.h;
    regBase(n, a, 0).forEach((q, i) => addV(q, LETTERS[i]));
    const s = addV(V3.P(0, 0, h), k === 'tetra' ? 'D' : 'S');
    F.push([...Array(n).keys()]);
    for (let i = 0; i < n; i++) F.push([i, (i + 1) % n, s]);
    if (k === 'pyr'){ const o = addV(V3.P(0, 0, 0), 'O'); aux.add(o); axis = [s, o]; }
  } else if (k === 'cyl' || k === 'fcone'){
    const N = RING, r2 = k === 'cyl' ? p.r : p.r2;
    ring(p.r, 0, N).forEach(q => addV(q, ''));
    ring(r2, p.h, N).forEach(q => addV(q, ''));
    F.push([...Array(N).keys()], [...Array(N).keys()].map(i => N + i));
    for (let i = 0; i < N; i++){
      F.push([i, (i + 1) % N, N + (i + 1) % N, N + i]);
      smooth.add(ekey(i, N + i));
    }
    const o = addV(V3.P(0, 0, 0), 'O'), o1 = addV(V3.P(0, 0, p.h), 'O1');
    aux.add(o); aux.add(o1); axis = [o, o1];
  } else if (k === 'cone'){
    const N = RING;
    ring(p.r, 0, N).forEach(q => addV(q, ''));
    const s = addV(V3.P(0, 0, p.h), 'S');
    F.push([...Array(N).keys()]);
    for (let i = 0; i < N; i++){ F.push([i, (i + 1) % N, s]); smooth.add(ekey(i, s)); }
    const o = addV(V3.P(0, 0, 0), 'O'); aux.add(o); axis = [s, o];
  } else if (k === 'sphere'){
    const o = addV(V3.P(0, 0, 0), 'O'); aux.add(o);
    sphere = { c: V3.P(0, 0, 0), r: p.r };
  }
  // центр тела — середина габарита (вокруг него вращаем и от него
  // отводим подписи)
  let mn = V3.P(Infinity, Infinity, Infinity), mx = V3.P(-Infinity, -Infinity, -Infinity);
  const grow = q => { mn = V3.P(Math.min(mn.x, q.x), Math.min(mn.y, q.y), Math.min(mn.z, q.z)); mx = V3.P(Math.max(mx.x, q.x), Math.max(mx.y, q.y), Math.max(mx.z, q.z)); };
  V.forEach(grow);
  if (sphere){ grow(V3.add(sphere.c, V3.P(sphere.r, sphere.r, sphere.r))); grow(V3.sub(sphere.c, V3.P(sphere.r, sphere.r, sphere.r))); }
  const center = V3.mul(V3.add(mn, mx), 0.5);
  const R = V3.len(V3.sub(mx, mn)) / 2 || 1;
  // грани: внешняя нормаль (по Ньюэллу, развёрнута от центра) и d = n·x
  const faces = F.map(vs => {
    let n = V3.P(0, 0, 0);
    for (let i = 0; i < vs.length; i++){
      const a = V[vs[i]], b = V[vs[(i + 1) % vs.length]];
      n = V3.add(n, V3.P((a.y - b.y) * (a.z + b.z), (a.z - b.z) * (a.x + b.x), (a.x - b.x) * (a.y + b.y)));
    }
    n = V3.unit(n);
    let c = V3.P(0, 0, 0); vs.forEach(i => { c = V3.add(c, V[i]); }); c = V3.mul(c, 1 / vs.length);
    if (V3.dot(n, V3.sub(c, center)) < 0) n = V3.mul(n, -1);
    return { v: vs, n, d: V3.dot(n, V[vs[0]]), c };
  });
  // рёбра и их грани
  const em = new Map();
  faces.forEach((f, fi) => f.v.forEach((a, i) => {
    const b = f.v[(i + 1) % f.v.length], key = ekey(a, b);
    if (!em.has(key)) em.set(key, { a: Math.min(a, b), b: Math.max(a, b), f: [], smooth: smooth.has(key) });
    em.get(key).f.push(fi);
  }));
  return { k, p, V, names, faces, edges: [...em.values()], aux, sphere, axis, center, R };
}
function ekey(a, b){ return a < b ? a + '_' + b : b + '_' + a; }

/* ═══ камера ═══
   ex, ey — куда идут оси экрана (y вверх), v — направление на зрителя.
   «Школьная проекция» многогранников — фронтальная диметрия, как в
   учебнике: передняя грань без искажений, глубина — под 45° с
   сокращением вдвое. У круглых тел так основание выходит косым овалом, а
   в учебнике оно — горизонтальный эллипс, поэтому им — взгляд спереди
   чуть сверху. */
function camBasis(cam, k){
  cam = cam || { m: 'school' };
  if (cam.m === 'school' && !(KINDS[k] && KINDS[k].round)){
    const q = 0.5 * Math.SQRT1_2;
    return { ex: V3.P(1, q, 0), ey: V3.P(0, q, 1), v: V3.unit(V3.P(q, -1, q)), oblique: true };
  }
  let yaw = 0, pitch = 0.32;
  if (cam.m === 'orth'){ yaw = +cam.yaw || 0; pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, +cam.pitch || 0)); }
  const v = V3.P(Math.sin(yaw) * Math.cos(pitch), -Math.cos(yaw) * Math.cos(pitch), Math.sin(pitch));
  const ex = V3.P(Math.cos(yaw), Math.sin(yaw), 0);
  const ey = V3.cross(v, ex);
  return { ex, ey, v };
}
// школьный вид в виде вращаемой камеры — с него начинается вращение мышью
function schoolAsOrth(k){
  return KINDS[k] && KINDS[k].round ? { m: 'orth', yaw: 0, pitch: 0.32 } : { m: 'orth', yaw: 0.42, pitch: 0.36 };
}

/* ═══ видимость ═══ */
function occluded(M, p, v){
  const eps = 1e-7 * M.R;
  if (M.sphere){
    const c = M.sphere.c, r = M.sphere.r, w = V3.sub(p, c);
    const b = V3.dot(v, w), cc = V3.dot(w, w) - r * r, disc = b * b - cc;
    if (disc <= 0) return false;
    const t2 = -b + Math.sqrt(disc), t1 = -b - Math.sqrt(disc);
    return t2 > Math.max(eps, t1) + eps && t2 > 1e-6 * M.R;
  }
  if (!M.faces.length) return false;
  let lo = 1e-6 * M.R, hi = Infinity;
  for (const f of M.faces){
    const np = V3.dot(f.n, p) - f.d, nv = V3.dot(f.n, v);
    // условие внутри: np + t·nv < 0
    if (Math.abs(nv) < 1e-12){ if (np >= -eps) return false; continue; }
    const t = -np / nv;
    if (nv > 0) hi = Math.min(hi, t); else lo = Math.max(lo, t);
    if (hi - lo <= 1e-6 * M.R) return false;
  }
  return hi - lo > 1e-6 * M.R;
}
function frontFace(f, v){ return V3.dot(f.n, v) > 1e-9; }

/* ═══ точки построения ═══
   def:
     { t: 'v' } — вершина тела (сами вершины, id 'v<номер>');
     { t: 'seg', a, b, k } — на отрезке ab, AM : AB = k (середина — 0,5);
       a и b — id любых точек, так задаются и точки на рёбрах, и внутри
       тела (середина диагонали);
     { t: 'face', f, w: [w0, w1, w2] } — на грани f, барицентрически по
       трём её первым вершинам: при смене размеров точка остаётся на грани;
     { t: 'sph', th, ph } — на шаре (долгота, широта);
     { t: 'xyz', x, y, z } — по координатам (в осях тела);
     { t: 'foot', p, a, b[, c] } — основание перпендикуляра из p на прямую
       ab или на плоскость abc;
     { t: 'cut', a, b, c, d, e } — пересечение прямой ab с плоскостью cde
       (точки сечения на рёбрах, «следы»). */
function resolvePoints(M, scene){
  const pos = {}, names = {};
  M.V.forEach((q, i) => { pos['v' + i] = q; names['v' + i] = M.names[i]; });
  const nm = (scene && scene.nm) || {};
  Object.keys(nm).forEach(id => { if (id in names) names[id] = nm[id]; });
  const list = (scene && scene.pts) || [];
  const byId = {}; list.forEach(pt => { byId[pt.id] = pt; });
  const busy = new Set();
  const get = (id) => {
    if (pos[id]) return pos[id];
    const pt = byId[id];
    if (!pt || busy.has(id)) return null;
    busy.add(id);
    const q = calcPoint(M, pt.def || {}, get);
    busy.delete(id);
    if (q) pos[id] = q;
    return q;
  };
  list.forEach(pt => { get(pt.id); names[pt.id] = pt.name || ''; });
  return { pos, names };
}
function calcPoint(M, d, get){
  if (d.t === 'seg'){
    const a = get(d.a), b = get(d.b);
    return a && b ? V3.lerp(a, b, +d.k || 0) : null;
  }
  if (d.t === 'face'){
    const f = M.faces[d.f];
    if (!f) return null;
    // tri — какие три вершины грани (номера в её списке): у грани из многих
    // вершин точку берут в треугольнике веера, куда попал клик
    const w = d.w || [1 / 3, 1 / 3, 1 / 3], tri = d.tri || [0, 1, 2];
    let q = V3.P(0, 0, 0);
    for (let i = 0; i < 3; i++){ const vi = f.v[tri[i]]; if (vi == null) return null; q = V3.add(q, V3.mul(M.V[vi], w[i] || 0)); }
    return q;
  }
  if (d.t === 'sph' && M.sphere){
    const c = M.sphere.c, r = M.sphere.r;
    return V3.P(c.x + r * Math.cos(d.ph) * Math.cos(d.th), c.y + r * Math.cos(d.ph) * Math.sin(d.th), c.z + r * Math.sin(d.ph));
  }
  if (d.t === 'xyz') return V3.P(+d.x || 0, +d.y || 0, +d.z || 0);
  if (d.t === 'foot'){
    const p = get(d.p), a = get(d.a), b = get(d.b);
    if (!p || !a || !b) return null;
    if (d.c){
      const c = get(d.c);
      if (!c) return null;
      const n = V3.unit(V3.cross(V3.sub(b, a), V3.sub(c, a)));
      return V3.sub(p, V3.mul(n, V3.dot(V3.sub(p, a), n)));
    }
    const u = V3.sub(b, a), l2 = V3.dot(u, u) || 1;
    return V3.add(a, V3.mul(u, V3.dot(V3.sub(p, a), u) / l2));
  }
  if (d.t === 'cut'){
    const a = get(d.a), b = get(d.b), c = get(d.c), e = get(d.d), g = get(d.e);
    if (!a || !b || !c || !e || !g) return null;
    const n = V3.cross(V3.sub(e, c), V3.sub(g, c)), u = V3.sub(b, a), den = V3.dot(n, u);
    if (Math.abs(den) < 1e-12) return null;
    return V3.add(a, V3.mul(u, V3.dot(n, V3.sub(c, a)) / den));
  }
  return null;
}

/* ═══ сечение ═══
   Плоскость через три точки ∩ тело: у многогранника — отрезки по граням
   (видимость стороны сечения = видимость грани), у шара — окружность. */
function planeOf(a, b, c){
  const n = V3.cross(V3.sub(b, a), V3.sub(c, a));
  const l = V3.len(n);
  if (l < 1e-9) return null;
  const u = V3.mul(n, 1 / l);
  return { n: u, d: V3.dot(u, a), o: a };
}
function sectionOf(M, pl){
  const eps = 1e-9 * M.R;
  if (M.sphere){
    const c = M.sphere.c, r = M.sphere.r, dist = V3.dot(pl.n, c) - pl.d;
    if (Math.abs(dist) >= r) return null;
    const cc = V3.sub(c, V3.mul(pl.n, dist)), rr = Math.sqrt(r * r - dist * dist);
    const e1 = planeAxis(pl.n), e2 = V3.cross(pl.n, e1);
    const poly = [];
    for (let i = 0; i < 96; i++){ const t = i * 2 * Math.PI / 96; poly.push(V3.add(cc, V3.add(V3.mul(e1, rr * Math.cos(t)), V3.mul(e2, rr * Math.sin(t))))); }
    return { poly, sides: null, circle: { c: cc, r: rr } };
  }
  const sides = [];
  M.faces.forEach((f, fi) => {
    const hit = [];
    for (let i = 0; i < f.v.length; i++){
      const a = M.V[f.v[i]], b = M.V[f.v[(i + 1) % f.v.length]];
      const da = V3.dot(pl.n, a) - pl.d, db = V3.dot(pl.n, b) - pl.d;
      if (Math.abs(da) <= eps) hit.push(a);
      if ((da < -eps && db > eps) || (da > eps && db < -eps)) hit.push(V3.lerp(a, b, da / (da - db)));
    }
    const uniq = dedup(hit, 1e-7 * M.R);
    if (uniq.length >= 2){
      // грань целиком в плоскости — её стороны не «след», а само сечение
      if (uniq.length > 2) return;
      sides.push({ a: uniq[0], b: uniq[1], f: fi });
    }
  });
  const pts = dedup(sides.flatMap(s => [s.a, s.b]), 1e-7 * M.R);
  // грань, целиком лежащая в плоскости, — сечение совпадает с ней
  M.faces.forEach(f => {
    if (f.v.every(i => Math.abs(V3.dot(pl.n, M.V[i]) - pl.d) <= eps)) f.v.forEach(i => pts.push(M.V[i]));
  });
  const all = dedup(pts, 1e-7 * M.R);
  if (all.length < 3) return null;
  return { poly: hullInPlane(all, pl.n), sides };
}
function planeAxis(n){
  const a = Math.abs(n.x) < 0.9 ? V3.P(1, 0, 0) : V3.P(0, 1, 0);
  return V3.unit(V3.cross(n, a));
}
function dedup(arr, eps){
  const out = [];
  arr.forEach(p => { if (!out.some(q => V3.len(V3.sub(p, q)) <= eps)) out.push(p); });
  return out;
}
function hullInPlane(pts, n){
  const e1 = planeAxis(n), e2 = V3.cross(n, e1);
  let c = V3.P(0, 0, 0); pts.forEach(p => { c = V3.add(c, p); }); c = V3.mul(c, 1 / pts.length);
  return pts.slice().sort((p, q) => {
    const a = Math.atan2(V3.dot(V3.sub(p, c), e2), V3.dot(V3.sub(p, c), e1));
    const b = Math.atan2(V3.dot(V3.sub(q, c), e2), V3.dot(V3.sub(q, c), e1));
    return a - b;
  });
}
// кусок плоскости для показа — сечение габаритного куба, раздутого на 15%
function planePatch(M, pl){
  const R = M.R * 1.15, c = M.center;
  const box = [];
  for (let i = 0; i < 8; i++) box.push(V3.P(c.x + (i & 1 ? R : -R), c.y + (i & 2 ? R : -R), c.z + (i & 4 ? R : -R)));
  const E = [[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]];
  const hit = [];
  E.forEach(([i, j]) => {
    const a = box[i], b = box[j], da = V3.dot(pl.n, a) - pl.d, db = V3.dot(pl.n, b) - pl.d;
    if ((da <= 0 && db > 0) || (da > 0 && db <= 0)) hit.push(V3.lerp(a, b, da / (da - db)));
  });
  const u = dedup(hit, 1e-9 * M.R);
  return u.length >= 3 ? hullInPlane(u, pl.n) : null;
}

/* ═══ сборка чертежа ═══
   Результат — плоские примитивы в единицах модели, ось y вверх:
     fills  [{ pts, kind: 'sec' | 'plane' }],
     lines  [{ pts, hid, aux, kind }] — уже склеенные в ломаные (иначе
            пунктир на кольце из 72 кусков начинался бы заново на каждом),
     dots   [{ x, y, hid }], labels [{ t, x, y }], box — габарит с подписями.
   Видимость каждой точки считается в 3D, поэтому чертёж правильный при
   любом повороте. */
function draw(scene){
  const M = buildMesh(scene.k, scene.p);
  const cam = camBasis(scene.cam, scene.k);
  if (scene.net > 0 && !M.sphere) return drawNet(scene, M, cam);
  const v = cam.v, C = M.center;
  const opt = Object.assign({ hid: true, lab: true, planes: true, axis: true }, scene.opt || {});
  const pr = (q) => { const w = V3.sub(q, C); return { x: V3.dot(w, cam.ex), y: V3.dot(w, cam.ey) }; };
  const out = { fills: [], lines: [], dots: [], labels: [], marks: [], cam, mesh: M };
  const segs = [];   // { a3, b3, hid, aux, kind }
  const R = resolvePoints(M, scene);

  // рёбра тела
  M.edges.forEach(e => {
    const fr = e.f.map(fi => frontFace(M.faces[fi], v));
    const anyFront = fr.some(Boolean);
    if (e.smooth){
      if (fr.length === 2 && fr[0] !== fr[1]) segs.push({ a3: M.V[e.a], b3: M.V[e.b], hid: false, kind: 'edge', ka: e.a, kb: e.b });
      return;
    }
    segs.push({ a3: M.V[e.a], b3: M.V[e.b], hid: !anyFront, kind: 'edge', ka: e.a, kb: e.b });
  });
  // шар: контур — окружность того же радиуса, экватор — эллипс
  if (M.sphere){
    const c = M.sphere.c, r = M.sphere.r;
    const cc = pr(c), circ = [];
    for (let i = 0; i <= 128; i++){ const t = i * 2 * Math.PI / 128; circ.push({ x: cc.x + r * Math.cos(t), y: cc.y + r * Math.sin(t) }); }
    out.lines.push({ pts: circ, hid: false, kind: 'edge' });
    if (opt.eq !== false){
      const eq = [];
      for (let i = 0; i <= 128; i++){ const t = i * 2 * Math.PI / 128; eq.push(V3.P(c.x + r * Math.cos(t), c.y + r * Math.sin(t), c.z)); }
      for (let i = 0; i < 128; i++){
        const m = V3.lerp(eq[i], eq[i + 1], 0.5), hid = V3.dot(V3.sub(m, c), v) < 0;
        segs.push({ a3: eq[i], b3: eq[i + 1], hid, kind: 'edge', ka: 'q' + i, kb: 'q' + (i + 1) % 128 });
      }
    }
  }
  // ось и центры круглых тел, высота пирамиды — вспомогательные, пунктиром
  // там, где их закрывает тело (а внутри тела закрыто всё)
  if (opt.axis && M.axis){
    addSampled(segs, M, v, M.V[M.axis[0]], M.V[M.axis[1]], 'axis', true);
  }

  // плоскости и сечения — заливки снизу
  (scene.planes || []).forEach(P => {
    const a = R.pos[P.a], b = R.pos[P.b], c = R.pos[P.c];
    if (!a || !b || !c) return;
    const pl = planeOf(a, b, c);
    if (!pl) return;
    if (opt.planes && P.plane){
      const patch = planePatch(M, pl);
      if (patch) out.fills.push({ pts: patch.map(pr), kind: 'plane', id: P.id });
    }
    if (P.sec !== false){
      const S = sectionOf(M, pl);
      if (!S) return;
      // пошаговый показ: заливка — только когда проведены все стороны
      if (P.steps == null) out.fills.push({ pts: S.poly.map(pr), kind: 'sec', id: P.id });
      if (S.sides){
        const lim = P.steps != null ? P.steps : Infinity;
        orderSides(S.sides, M).slice(0, lim).forEach(s => {
          segs.push({ a3: s.a, b3: s.b, hid: !frontFace(M.faces[s.f], v), kind: 'sec' });
        });
      } else {
        for (let i = 0; i < S.poly.length; i++){
          const p = S.poly[i], q = S.poly[(i + 1) % S.poly.length];
          segs.push({ a3: p, b3: q, hid: occluded(M, V3.lerp(p, q, 0.5), v), kind: 'sec' });
        }
      }
    }
  });
  // отрезки и прямые построения
  (scene.segs || []).forEach(S => {
    let a = R.pos[S.a], b = R.pos[S.b];
    if (!a || !b || V3.len(V3.sub(a, b)) < 1e-9) return;
    if (S.line){
      // прямая — продолжаем за обе точки до габаритной сферы тела с запасом
      const u = V3.unit(V3.sub(b, a)), w = V3.sub(a, C);
      const bb = V3.dot(w, u), cc = V3.dot(w, w) - (M.R * 1.35) ** 2, disc = bb * bb - cc;
      if (disc > 0){
        const t1 = -bb - Math.sqrt(disc), t2 = -bb + Math.sqrt(disc);
        const L = V3.len(V3.sub(b, a));
        const a0 = a;
        a = V3.add(a0, V3.mul(u, Math.min(t1, -0.25 * L)));
        b = V3.add(a0, V3.mul(u, Math.max(t2, 1.25 * L)));
      }
    }
    addSampled(segs, M, v, a, b, S.kind || (S.line ? 'line' : 'seg'), false, S.id);
  });

  // измерения, перпендикуляры, подписи — построения поверх тела
  const vals = [];   // подписи значений: { t, at3, off3? }
  (scene.marks || []).forEach(mk => markPrims(M, R.pos, mk, segs, vals, v));
  if (opt.dims) dimsPrims(M, segs, vals, v);

  // склейка в ломаные: соседние куски с одной видимостью и одним видом
  joinChains(segs, pr).forEach(L => out.lines.push(L));
  // система координат: оси из выбранной точки вдоль рёбер тела
  if (opt.axes){
    const O = R.pos[opt.origin || 'v0'] || M.V[0];
    let mn = V3.P(Infinity, Infinity, Infinity), mx = V3.P(-Infinity, -Infinity, -Infinity);
    M.V.forEach(q => { mn = V3.P(Math.min(mn.x, q.x), Math.min(mn.y, q.y), Math.min(mn.z, q.z)); mx = V3.P(Math.max(mx.x, q.x), Math.max(mx.y, q.y), Math.max(mx.z, q.z)); });
    if (M.sphere){ mn = V3.sub(M.sphere.c, V3.P(M.sphere.r, M.sphere.r, M.sphere.r)); mx = V3.add(M.sphere.c, V3.P(M.sphere.r, M.sphere.r, M.sphere.r)); }
    [['x', V3.P(1, 0, 0), mx.x - O.x], ['y', V3.P(0, 1, 0), mx.y - O.y], ['z', V3.P(0, 0, 1), mx.z - O.z]].forEach(([nmAx, e, ext]) => {
      const L = Math.max(ext, M.R * 0.5) * 1.3 + M.R * 0.15;
      const end = V3.add(O, V3.mul(e, L));
      const a2 = pr(O), b2 = pr(end);
      out.lines.push({ pts: [a2, b2], hid: false, kind: 'coord' });
      const dx = b2.x - a2.x, dy = b2.y - a2.y, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, hl = M.R * 0.07;
      out.lines.push({ pts: [{ x: b2.x - ux * hl - uy * hl * 0.45, y: b2.y - uy * hl + ux * hl * 0.45 }, b2, { x: b2.x - ux * hl + uy * hl * 0.45, y: b2.y - uy * hl - ux * hl * 0.45 }], hid: false, kind: 'coord' });
      out.labels.push({ t: nmAx, x: b2.x, y: b2.y, ax: ux, ay: uy, val: true, it: true });
    });
  }

  // точки: вершины тела с именем, центры, точки построения
  const used = new Set();
  (scene.segs || []).forEach(S => { used.add(S.a); used.add(S.b); });
  (scene.planes || []).forEach(P => { used.add(P.a); used.add(P.b); used.add(P.c); });
  const center2 = pr(C);
  const labelOf = (id, q, isAux) => {
    const t = R.names[id];
    const p2 = pr(q);
    const hid = occluded(M, q, v);
    // центры оснований и точки построения — жирной точкой; вершины тела —
    // только подписью (вершина и так видна как угол)
    if (isAux || id[0] === 'p') out.dots.push({ x: p2.x, y: p2.y, hid, id });
    if (opt.lab && t) out.labels.push({ t, x: p2.x, y: p2.y, ax: p2.x - center2.x, ay: p2.y - center2.y, id });
  };
  M.V.forEach((q, i) => {
    if (!M.names[i]) return;
    const isAux = M.aux.has(i);
    if (isAux && !(opt.axis || used.has('v' + i))) return;
    labelOf('v' + i, q, isAux);
  });
  (scene.pts || []).forEach(pt => { const q = R.pos[pt.id]; if (q) labelOf(pt.id, q, false); });

  vals.forEach(V_ => {
    const p2 = pr(V_.at3);
    let ax = 0, ay = 1;
    if (V_.dir3){ const q = pr(V3.add(V_.at3, V_.dir3)); ax = q.x - p2.x; ay = q.y - p2.y; }
    else { ax = p2.x - center2.x; ay = p2.y - center2.y; }
    out.labels.push({ t: V_.t, x: p2.x, y: p2.y, ax, ay, val: true });
  });
  // подписи: отступ от точки — от центра чертежа наружу; размер шрифта —
  // доля габарита чертежа без подписей
  let mnx = Infinity, mny = Infinity, mxx = -Infinity, mxy = -Infinity;
  const growB = (p) => { mnx = Math.min(mnx, p.x); mny = Math.min(mny, p.y); mxx = Math.max(mxx, p.x); mxy = Math.max(mxy, p.y); };
  out.lines.forEach(L => L.pts.forEach(growB));
  out.fills.forEach(F => { if (F.kind === 'sec') F.pts.forEach(growB); });
  if (!isFinite(mnx)){ mnx = mny = -1; mxx = mxy = 1; }
  const size = Math.max(mxx - mnx, mxy - mny, 1e-6);
  out.fs = size * 0.066;
  out.labels.forEach(L => {
    let dx = L.ax, dy = L.ay, l = Math.hypot(dx, dy);
    if (l < size * 0.02){ dx = -0.6; dy = -0.8; l = 1; }
    L.x += dx / l * out.fs * 0.8; L.y += dy / l * out.fs * 0.8;
  });
  out.lines.forEach(L => L.pts.forEach(growB));
  out.fills.forEach(F => F.pts.forEach(growB));
  out.labels.forEach(L => { growB({ x: L.x - out.fs * 0.6, y: L.y - out.fs * 0.6 }); growB({ x: L.x + out.fs * 0.6, y: L.y + out.fs * 0.6 }); });
  out.box = { minX: mnx, minY: mny, maxX: mxx, maxY: mxy };
  out.pos = R.pos; out.names = R.names; out.pr = pr;
  return out;
}
// отрезок, видимость которого меняется по длине (входит в тело, выходит):
// режем на куски и для каждого спрашиваем occluded
function addSampled(segs, M, v, a, b, kind, aux, id){
  const N = 48;
  let prev = a;
  for (let i = 1; i <= N; i++){
    const q = V3.lerp(a, b, i / N), m = V3.lerp(prev, q, 0.5);
    segs.push({ a3: prev, b3: q, hid: occluded(M, m, v), kind, aux, id, ka: kind + id + (i - 1), kb: kind + id + i });
    prev = q;
  }
}
// стороны сечения по порядку обхода многоугольника — так их и показывают
// по одной в пошаговом построении
function orderSides(sides, M){
  if (sides.length < 2) return sides;
  const eps = 1e-6 * M.R, out = [sides[0]], rest = sides.slice(1);
  let end = sides[0].b;
  while (rest.length){
    let k = rest.findIndex(s => V3.len(V3.sub(s.a, end)) < eps || V3.len(V3.sub(s.b, end)) < eps);
    if (k < 0){ out.push(...rest); break; }
    const s = rest.splice(k, 1)[0];
    if (V3.len(V3.sub(s.a, end)) < eps){ out.push(s); end = s.b; }
    else { out.push({ a: s.b, b: s.a, f: s.f }); end = s.a; }
  }
  return out;
}
function joinChains(segs, pr){
  const key = (p) => Math.round(p.x * 1e5) + ',' + Math.round(p.y * 1e5) + ',' + Math.round(p.z * 1e5);
  const groups = new Map();
  segs.forEach(s => {
    const g = (s.hid ? 'h' : 's') + '|' + s.kind + '|' + (s.aux ? 1 : 0);
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(s);
  });
  const lines = [];
  groups.forEach((list) => {
    const byEnd = new Map();
    list.forEach((s, i) => {
      [key(s.a3), key(s.b3)].forEach(k => { if (!byEnd.has(k)) byEnd.set(k, []); byEnd.get(k).push(i); });
    });
    const used = new Array(list.length).fill(false);
    for (let i = 0; i < list.length; i++){
      if (used[i]) continue;
      used[i] = true;
      const chain = [list[i].a3, list[i].b3];
      // растим в обе стороны
      for (let side = 0; side < 2; side++){
        for (;;){
          const endK = key(side === 0 ? chain[chain.length - 1] : chain[0]);
          const cand = (byEnd.get(endK) || []).find(j => !used[j]);
          if (cand == null) break;
          used[cand] = true;
          const s = list[cand], nxt = key(s.a3) === endK ? s.b3 : s.a3;
          if (side === 0) chain.push(nxt); else chain.unshift(nxt);
        }
      }
      lines.push({ pts: chain.map(pr), hid: list[i].hid, kind: list[i].kind, aux: list[i].aux });
    }
  });
  return lines;
}

/* ═══ рисование на холсте ═══
   d — результат draw(), toS — модель → экран, s — масштаб (пикселей на
   единицу модели), st — стиль: цвет, толщина, показывать ли невидимые. */
function paint(c, d, toS, s, st){
  const lw = st.lw, col = st.color, sec = st.secColor || col;
  c.save();
  c.lineCap = 'round'; c.lineJoin = 'round';
  d.fills.forEach(F => {
    c.beginPath();
    F.pts.forEach((p, i) => { const q = toS(p); if (i) c.lineTo(q.x, q.y); else c.moveTo(q.x, q.y); });
    c.closePath();
    c.fillStyle = F.kind === 'sec' ? sec : col;
    c.globalAlpha = F.kind === 'sec' ? 0.22 : F.kind === 'face' ? 0.05 : 0.07;
    c.fill();
    if (F.kind === 'plane'){ c.globalAlpha = 0.35; c.strokeStyle = col; c.lineWidth = Math.max(0.6, lw * 0.4); c.setLineDash([]); c.stroke(); }
  });
  c.globalAlpha = 1;
  const order = d.lines.slice().sort((a, b) => (b.hid ? 1 : 0) - (a.hid ? 1 : 0));
  order.forEach(L => {
    if (L.hid && st.hid === false) return;
    const aux = L.aux || L.kind === 'axis';
    c.strokeStyle = L.kind === 'sec' ? sec : col;
    c.lineWidth = L.kind === 'sec' ? lw * 1.1 : (aux || L.kind === 'seg' || L.kind === 'line') ? Math.max(0.8, lw * 0.75) : lw;
    if (L.kind === 'mark' || L.kind === 'coord'){ c.strokeStyle = L.kind === 'mark' ? sec : col; c.lineWidth = Math.max(0.8, lw * 0.6); }
    if (L.kind === 'face'){ c.lineWidth = lw; }
    if (L.hid || L.kind === 'par') c.setLineDash([Math.max(3, lw * 3.2), Math.max(2.4, lw * 2.4)]);
    else if (L.kind === 'axis') c.setLineDash([Math.max(6, lw * 6), Math.max(2.4, lw * 2), Math.max(1, lw), Math.max(2.4, lw * 2)]);
    else c.setLineDash([]);
    c.beginPath();
    L.pts.forEach((p, i) => { const q = toS(p); if (i) c.lineTo(q.x, q.y); else c.moveTo(q.x, q.y); });
    c.stroke();
  });
  c.setLineDash([]);
  c.fillStyle = col;
  const r = Math.max(2, lw * 1.25);
  d.dots.forEach(D => {
    if (D.hid && st.hid === false) return;
    const q = toS(D);
    c.beginPath(); c.arc(q.x, q.y, r, 0, Math.PI * 2); c.fill();
  });
  if (d.labels.length){
    const fs = d.fs * s;
    c.font = '500 ' + fs.toFixed(1) + 'px ' + (st.font || 'sans-serif');
    c.textAlign = 'center'; c.textBaseline = 'middle';
    d.labels.forEach(L => {
      const q = toS(L);
      if (L.val){
        c.save();
        c.font = (L.it ? 'italic 500 ' : '600 ') + (fs * 0.66).toFixed(1) + 'px ' + (st.font || 'sans-serif');
        c.fillStyle = L.it ? col : sec;
        c.fillText(L.t, q.x, q.y);
        c.restore();
      } else c.fillText(pretty(L.t), q.x, q.y);
    });
  }
  c.restore();
}
const SUB = '₀₁₂₃₄₅₆₇₈₉';
function pretty(t){ return String(t || '').replace(/(\D)(\d+)$/, (q, a, dd) => a + dd.split('').map(ch => SUB[+ch]).join('')); }

/* ═══ числа ═══
   Длины по возможности точно: квадрат длины в условных единицах обычно
   рационален (стороны целые или с половинками), и тогда ответ пишется как
   в задачнике — 2√3, √2/2. Иначе — приближённо. Запятая — десятичная. */
function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while (b){ const t = a % b; a = b; b = t; } return a || 1; }
function fmtNum(x, dig){
  const k = Math.pow(10, dig);
  let s = (Math.round(x * k) / k).toFixed(dig).replace(/\.?0+$/, '');
  if (s === '-0') s = '0';
  return s.replace('.', ',');
}
function exactSqrt(x2){
  if (!(x2 > 0) || x2 > 1e6) return null;
  for (let q = 1; q <= 64; q++){
    const p = Math.round(x2 * q);
    if (p <= 0 || Math.abs(p / q - x2) > 1e-9 * Math.max(1, x2)) continue;
    let N = p * q, k = 1;
    for (let f = 2; f * f <= N; f++) while (N % (f * f) === 0){ N /= f * f; k *= f; }
    const g = gcd(k, q), kk = k / g, qq = q / g;
    const rad = N === 1 ? '' : '√' + N;
    const num = rad ? (kk === 1 ? rad : kk + rad) : String(kk);
    return qq === 1 ? num : num + '/' + qq;
  }
  return null;
}
function fmtLen(L){
  const ex = exactSqrt(L * L), ap = fmtNum(L, 2);
  if (!ex) return '≈ ' + ap;
  return /[√/]/.test(ex) ? ex + ' ≈ ' + ap : ex;
}
function fmtAngle(a){
  const deg = a * 180 / Math.PI;
  const r = Math.abs(deg - Math.round(deg)) < 1e-6 ? String(Math.round(deg)) : fmtNum(deg, 1);
  const short = (r.indexOf(',') >= 0 ? '≈ ' : '') + r + '°';
  let full = short;
  if (deg > 1e-6 && deg < 90 - 1e-6){
    const t = Math.tan(a), c = Math.cos(a);
    const et = exactSqrt(t * t), ec = exactSqrt(c * c);
    const parts = [];
    if (ec) parts.push('cos = ' + ec);
    if (et) parts.push('tg = ' + et);
    if (parts.length) full += ' (' + parts.join(', ') + ')';
  }
  return { short, full };
}

/* ═══ построения-измерения ═══
   mk.t:
     len   — длина отрезка ab;
     dist  — расстояние от точки p до плоскости abc (перпендикуляр, основание,
             прямой угол);
     dline — расстояние от точки p до прямой ab;
     angLL — угол между прямыми ab и cd (скрещивающиеся — через параллельную
             прямую из точки a, пунктиром);
     angLP — угол между прямой ab и плоскостью cde (перпендикуляр из точки
             прямой и её проекция);
     angPP — угол между плоскостями abc и def (два перпендикуляра к линии
             пересечения в одной точке);
     right — знак прямого угла при p между pa и pb;
     text  — свой текст у точки p. */
function measure(M, pos, mk){
  const P = (id) => pos[id];
  const res = { short: '', full: '', ok: false };
  if (mk.t === 'len'){
    const a = P(mk.a), b = P(mk.b);
    if (!a || !b) return res;
    const L = V3.len(V3.sub(a, b));
    return { short: fmtLen(L), full: fmtLen(L), ok: true, val: L };
  }
  if (mk.t === 'dist' || mk.t === 'dline'){
    const g = geomOfMark(M, pos, mk);
    if (!g) return res;
    const L = V3.len(V3.sub(g.p, g.H));
    return { short: fmtLen(L), full: fmtLen(L), ok: true, val: L };
  }
  if (mk.t === 'angLL' || mk.t === 'angLP' || mk.t === 'angPP'){
    const g = geomOfMark(M, pos, mk);
    if (!g) return res;
    const f = fmtAngle(g.ang);
    return { short: f.short, full: f.full, ok: true, val: g.ang };
  }
  return res;
}
function footPlane(p, a, b, c){
  const pl = planeOf(a, b, c);
  if (!pl) return null;
  return { H: V3.sub(p, V3.mul(pl.n, V3.dot(pl.n, p) - pl.d)), pl };
}
function geomOfMark(M, pos, mk){
  const P = (id) => pos[id];
  if (mk.t === 'dist'){
    const p = P(mk.p), a = P(mk.a), b = P(mk.b), c = P(mk.c);
    if (!p || !a || !b || !c) return null;
    const f = footPlane(p, a, b, c);
    return f ? { p, H: f.H, pl: f.pl, a } : null;
  }
  if (mk.t === 'dline'){
    const p = P(mk.p), a = P(mk.a), b = P(mk.b);
    if (!p || !a || !b) return null;
    const u = V3.sub(b, a), l2 = V3.dot(u, u);
    if (l2 < 1e-12) return null;
    return { p, H: V3.add(a, V3.mul(u, V3.dot(V3.sub(p, a), u) / l2)), u };
  }
  if (mk.t === 'angLL'){
    const a = P(mk.a), b = P(mk.b), c = P(mk.c), d = P(mk.d);
    if (!a || !b || !c || !d) return null;
    const u1 = V3.unit(V3.sub(b, a)), u2 = V3.unit(V3.sub(d, c));
    const cosv = Math.min(1, Math.abs(V3.dot(u1, u2)));
    // пересекаются ли прямые: ближайшие точки совпадают
    const w = V3.sub(a, c), bb = V3.dot(u1, u2), den = 1 - bb * bb;
    let X = null;
    if (den > 1e-9){
      const t1 = (bb * V3.dot(u2, w) - V3.dot(u1, w)) / den, t2 = (V3.dot(u2, w) - bb * V3.dot(u1, w)) / den;
      const p1 = V3.add(a, V3.mul(u1, t1)), p2 = V3.add(c, V3.mul(u2, t2));
      if (V3.len(V3.sub(p1, p2)) < 1e-6 * M.R) X = p1;
    }
    return { ang: Math.acos(cosv), X, u1, u2, a, b, c, d, skew: !X };
  }
  if (mk.t === 'angLP'){
    const a = P(mk.a), b = P(mk.b), c = P(mk.c), d = P(mk.d), e = P(mk.e);
    if (!a || !b || !c || !d || !e) return null;
    const pl = planeOf(c, d, e);
    if (!pl) return null;
    const u = V3.unit(V3.sub(b, a));
    const s = Math.min(1, Math.abs(V3.dot(pl.n, u)));
    const den = V3.dot(pl.n, u);
    const O = Math.abs(den) > 1e-12 ? V3.add(a, V3.mul(u, (pl.d - V3.dot(pl.n, a)) / den)) : null;
    const Q = O ? (V3.len(V3.sub(a, O)) > V3.len(V3.sub(b, O)) ? a : b) : a;
    const H = V3.sub(Q, V3.mul(pl.n, V3.dot(pl.n, Q) - pl.d));
    return { ang: Math.asin(s), O, Q, H, pl };
  }
  if (mk.t === 'angPP'){
    const p1 = [P(mk.a), P(mk.b), P(mk.c)], p2 = [P(mk.d), P(mk.e), P(mk.f)];
    if (p1.some(x => !x) || p2.some(x => !x)) return null;
    const A = planeOf(...p1), Bp = planeOf(...p2);
    if (!A || !Bp) return null;
    const u = V3.cross(A.n, Bp.n), ul = V3.len(u);
    if (ul < 1e-9) return { ang: 0, X: null };
    const uu = V3.mul(u, 1 / ul);
    // точка на линии пересечения, ближайшая к центру тела
    let X = V3.mul(V3.add(V3.mul(V3.cross(Bp.n, u), A.d), V3.mul(V3.cross(u, A.n), Bp.d)), 1 / (ul * ul));
    X = V3.add(X, V3.mul(uu, V3.dot(V3.sub(M.center, X), uu)));
    // в каждой плоскости — направление от линии пересечения к её точкам
    const toward = (pl, pts) => {
      let w = V3.unit(V3.cross(pl.n, uu));
      let best = 0; pts.forEach(q => { const t = V3.dot(V3.sub(q, X), w); if (Math.abs(t) > Math.abs(best)) best = t; });
      return best < 0 ? V3.mul(w, -1) : w;
    };
    const w1 = toward(A, p1), w2 = toward(Bp, p2);
    const cs = V3.dot(w1, w2);
    return { ang: Math.acos(Math.min(1, Math.abs(cs))), X, w1, w2: cs < 0 ? V3.mul(w2, -1) : w2, uu };
  }
  return null;
}
function addPoly3(segs, M, v, pts, kind, id){
  for (let i = 0; i + 1 < pts.length; i++){
    const m = V3.lerp(pts[i], pts[i + 1], 0.5);
    segs.push({ a3: pts[i], b3: pts[i + 1], hid: occluded(M, m, v), kind, ka: kind + id + i, kb: kind + id + (i + 1) });
  }
}
function arc3(X, u1, u2, r){
  const a1 = V3.unit(u1);
  let w = V3.sub(u2, V3.mul(a1, V3.dot(u2, a1)));
  if (V3.len(w) < 1e-9) return [];
  w = V3.unit(w);
  const ang = Math.acos(Math.max(-1, Math.min(1, V3.dot(a1, V3.unit(u2)))));
  const out = [];
  for (let i = 0; i <= 16; i++){ const t = ang * i / 16; out.push(V3.add(X, V3.add(V3.mul(a1, r * Math.cos(t)), V3.mul(w, r * Math.sin(t))))); }
  return out;
}
function right3(H, e1, e2, r){
  const a = V3.mul(V3.unit(e1), r), b = V3.mul(V3.unit(e2), r);
  return [V3.add(H, a), V3.add(H, V3.add(a, b)), V3.add(H, b)];
}
function markPrims(M, pos, mk, segs, vals, v){
  const r = M.R * 0.09, id = mk.id || '';
  if (mk.t === 'text'){
    const p = pos[mk.p];
    if (p && mk.text) vals.push({ t: mk.text, at3: p });
    return;
  }
  if (mk.t === 'right'){
    const p = pos[mk.p], a = pos[mk.a], b = pos[mk.b];
    if (p && a && b) addPoly3(segs, M, v, right3(p, V3.sub(a, p), V3.sub(b, p), r * 0.8), 'mark', id);
    return;
  }
  if (mk.t === 'len'){
    const a = pos[mk.a], b = pos[mk.b];
    if (!a || !b) return;
    const m = measure(M, pos, mk);
    // подпись — сбоку от середины, наружу от центра тела
    const mid = V3.lerp(a, b, 0.5);
    vals.push({ t: m.short, at3: mid, dir3: V3.sub(mid, M.center) });
    return;
  }
  const g = geomOfMark(M, pos, mk);
  if (!g) return;
  const m = measure(M, pos, mk);
  if (mk.t === 'dist' || mk.t === 'dline'){
    addSampled(segs, M, v, g.p, g.H, 'seg', false, id);
    let e2;
    if (mk.t === 'dline') e2 = g.u;
    else { e2 = V3.sub(g.a, g.H); e2 = V3.sub(e2, V3.mul(g.pl.n, V3.dot(e2, g.pl.n))); if (V3.len(e2) < 1e-9) e2 = planeAxis(g.pl.n); }
    if (V3.len(V3.sub(g.p, g.H)) > 1e-9) addPoly3(segs, M, v, right3(g.H, V3.sub(g.p, g.H), e2, r * 0.8), 'mark', id);
    vals.push({ t: m.short, at3: V3.lerp(g.p, g.H, 0.5), dir3: V3.sub(V3.lerp(g.p, g.H, 0.5), M.center) });
    return;
  }
  if (mk.t === 'angLL'){
    // параллельные — угол 0, строить нечего, только подпись
    if (g.ang < 1e-6){ vals.push({ t: m.short, at3: V3.lerp(g.a, g.b, 0.5), dir3: V3.sub(V3.lerp(g.a, g.b, 0.5), M.center) }); return; }
    let X = g.X, u2 = g.u2;
    if (!X){
      // скрещивающиеся: переносим вторую прямую в точку a
      X = g.a;
      addSampled(segs, M, v, X, V3.add(X, V3.mul(u2, V3.len(V3.sub(g.d, g.c)))), 'par', false, id);
    }
    let u1 = g.u1;
    if (V3.dot(u1, u2) < 0) u2 = V3.mul(u2, -1);
    addPoly3(segs, M, v, arc3(X, u1, u2, r * 1.3), 'mark', id);
    vals.push({ t: m.short, at3: V3.add(X, V3.mul(V3.unit(V3.add(u1, u2)), r * 2.6)), dir3: V3.add(u1, u2) });
    return;
  }
  if (mk.t === 'angLP'){
    if (!g.O) return;
    addSampled(segs, M, v, g.Q, g.H, 'par', false, id);
    addSampled(segs, M, v, g.O, g.H, 'seg', false, id + 'h');
    if (V3.len(V3.sub(g.Q, g.H)) > 1e-9 && V3.len(V3.sub(g.O, g.H)) > 1e-9){
      addPoly3(segs, M, v, right3(g.H, V3.sub(g.Q, g.H), V3.sub(g.O, g.H), r * 0.7), 'mark', id + 'r');
      addPoly3(segs, M, v, arc3(g.O, V3.sub(g.Q, g.O), V3.sub(g.H, g.O), r * 1.3), 'mark', id + 'a');
    }
    vals.push({ t: m.short, at3: g.O, dir3: V3.add(V3.unit(V3.sub(g.Q, g.O)), V3.unit(V3.sub(g.H, g.O))) });
    return;
  }
  if (mk.t === 'angPP'){
    if (!g.X) return;
    const L = M.R * 0.45;
    addSampled(segs, M, v, g.X, V3.add(g.X, V3.mul(g.w1, L)), 'seg', false, id + '1');
    addSampled(segs, M, v, g.X, V3.add(g.X, V3.mul(g.w2, L)), 'seg', false, id + '2');
    addSampled(segs, M, v, V3.sub(g.X, V3.mul(g.uu, L * 0.6)), V3.add(g.X, V3.mul(g.uu, L * 0.6)), 'par', false, id + 'u');
    addPoly3(segs, M, v, right3(g.X, g.w1, g.uu, r * 0.6), 'mark', id + 'r1');
    addPoly3(segs, M, v, right3(g.X, g.w2, g.uu, r * 0.6), 'mark', id + 'r2');
    addPoly3(segs, M, v, arc3(g.X, g.w1, g.w2, r * 1.5), 'mark', id + 'a');
    vals.push({ t: m.short, at3: V3.add(g.X, V3.mul(V3.unit(V3.add(g.w1, g.w2)), r * 2.8)), dir3: V3.add(g.w1, g.w2) });
  }
}
// «Подписать размеры»: сторона основания и высота (у круглых — радиусы)
function dimsPrims(M, segs, vals, v){
  const p = M.p, V = M.V, k = M.k;
  const lab = (a, b, val) => { const mid = V3.lerp(a, b, 0.5); vals.push({ t: fmtNum(val, 2), at3: mid, dir3: V3.sub(mid, M.center) }); };
  if (k === 'cube' || k === 'box'){
    // у куба — боковое ребро AA₁: на середине AD чаще всего ставят точку
    if (k === 'cube') lab(V[0], V[4], p.a);
    else { lab(V[0], V[3], p.w); lab(V[2], V[3], p.d); lab(V[3], V[7], p.h); }
    return;
  }
  if (k === 'prism' || k === 'fpyr'){
    const n = p.n; lab(V[0], V[n - 1], p.a);
    if (k === 'fpyr') lab(V[n], V[2 * n - 1], p.a2);
    else lab(V[n - 1], V[2 * n - 1], p.h);
    return;
  }
  if (k === 'pyr' || k === 'tetra'){
    const n = k === 'tetra' ? 3 : p.n; lab(V[0], V[n - 1], p.a);
    if (k === 'pyr' && M.axis){ const a = V[M.axis[0]], b = V[M.axis[1]]; vals.push({ t: 'h = ' + fmtNum(p.h, 2), at3: V3.lerp(a, b, 0.5), dir3: V3.P(1, 0, 0) }); }
    return;
  }
  const radius = (c, rr, z, nm) => {
    const e = V3.add(c, V3.P(rr * Math.SQRT1_2, -rr * Math.SQRT1_2, 0));
    addSampled(segs, M, v, c, e, 'seg', false, 'dim' + z);
    vals.push({ t: nm + ' = ' + fmtNum(rr, 2), at3: V3.lerp(c, e, 0.5), dir3: V3.P(0.3, -1, -0.4) });
  };
  if (M.sphere){ radius(M.sphere.c, M.sphere.r, 0, 'r'); return; }
  const O = V[M.axis[k === 'cone' ? 1 : 0]];
  radius(O, p.r, 0, 'r');
  if (k === 'fcone') radius(V[M.axis[1]], p.r2, 1, 'r₂');
  vals.push({ t: 'h = ' + fmtNum(p.h, 2), at3: V3.P(O.x, O.y, p.h / 2), dir3: V3.P(1, 0, 0) });
}

/* ═══ развёртка ═══
   Каждая грань поворачивается вокруг общего ребра с «родителем» на долю t
   того угла, что кладёт её в плоскость родителя; повороты складываются по
   дереву. Дерево — как развёртку рисуют в учебнике: у призм и пирамид
   боковые грани вокруг нижнего основания («крест» у куба), верхнее основание
   — на одной из боковых; у цилиндра, конуса и усечённого конуса боковые
   грани цепочкой одна за другой — из 72 полосок и получаются прямоугольник,
   сектор и кольцевой сектор. */
function netTree(M){
  const k = M.k, n = M.faces.length, parent = new Array(n).fill(-1);
  if (k === 'cube' || k === 'box' || k === 'prism' || k === 'fpyr'){
    for (let i = 2; i < n; i++) parent[i] = 0;
    parent[1] = 2;
    return { root: 0, parent };
  }
  if (k === 'pyr' || k === 'tetra'){ for (let i = 1; i < n; i++) parent[i] = 0; return { root: 0, parent }; }
  if (k === 'cyl' || k === 'fcone'){
    for (let i = 3; i < n; i++) parent[i] = i - 1;
    parent[0] = 2; parent[1] = 2;
    return { root: 2, parent };
  }
  if (k === 'cone'){ for (let i = 2; i < n; i++) parent[i] = i - 1; parent[0] = 1; return { root: 1, parent }; }
  return null;
}
function rotM(u, th){
  const c = Math.cos(th), s = Math.sin(th), t = 1 - c, x = u.x, y = u.y, z = u.z;
  return [[t * x * x + c, t * x * y - s * z, t * x * z + s * y],
          [t * x * y + s * z, t * y * y + c, t * y * z - s * x],
          [t * x * z - s * y, t * y * z + s * x, t * z * z + c]];
}
function mulMV(m, p){ return V3.P(m[0][0] * p.x + m[0][1] * p.y + m[0][2] * p.z, m[1][0] * p.x + m[1][1] * p.y + m[1][2] * p.z, m[2][0] * p.x + m[2][1] * p.y + m[2][2] * p.z); }
function mulMM(a, b){
  const r = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r[i][j] = a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j];
  return r;
}
function netFaces(M, t){
  const T = netTree(M);
  if (!T) return null;
  const n = M.faces.length, tr = new Array(n).fill(null);
  tr[T.root] = { m: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], o: V3.P(0, 0, 0) };
  const get = (f) => {
    if (tr[f]) return tr[f];
    const p = T.parent[f], tp = get(p);
    const F = M.faces[f], Pf = M.faces[p];
    const common = F.v.filter(x => Pf.v.includes(x));
    const h1 = M.V[common[0]], h2 = M.V[common[1]];
    const u = V3.unit(V3.sub(h2, h1));
    const th = Math.atan2(V3.dot(V3.cross(F.n, Pf.n), u), V3.dot(F.n, Pf.n));
    const R = rotM(u, th * t);
    const oR = V3.sub(h1, mulMV(R, h1));
    tr[f] = { m: mulMM(tp.m, R), o: V3.add(mulMV(tp.m, oR), tp.o) };
    return tr[f];
  };
  return M.faces.map((F, i) => { const q = get(i); return F.v.map(vi => V3.add(mulMV(q.m, M.V[vi]), q.o)); });
}
// развёртка в чертёж: грани с лёгкой заливкой, все рёбра сплошные (на
// плоской развёртке невидимого нет), подписи вершин у каждого их места
function drawNet(scene, M, cam){
  const t = Math.max(0, Math.min(1, +scene.net || 0));
  const FS = netFaces(M, t);
  const opt = Object.assign({ lab: true }, scene.opt || {});
  let C = V3.P(0, 0, 0); let cnt = 0;
  FS.forEach(f => f.forEach(q => { C = V3.add(C, q); cnt++; }));
  C = V3.mul(C, 1 / Math.max(1, cnt));
  const pr = (q) => { const w = V3.sub(q, C); return { x: V3.dot(w, cam.ex), y: V3.dot(w, cam.ey) }; };
  const out = { fills: [], lines: [], dots: [], labels: [], cam, mesh: M, net: true };
  const R = resolvePoints(M, scene);
  // грани — от дальних к ближним, чтобы заливки ложились как надо
  const order = FS.map((f, i) => i).sort((a, b) => V3.dot(avg(FS[a]), cam.v) - V3.dot(avg(FS[b]), cam.v));
  const smooth = M.k === 'cyl' || M.k === 'cone' || M.k === 'fcone';
  order.forEach(i => {
    const poly = FS[i].map(pr);
    out.fills.push({ pts: poly, kind: 'face' });
    if (!smooth || M.faces[i].v.length > 4){ out.lines.push({ pts: poly.concat([poly[0]]), hid: false, kind: 'face' }); return; }
    // у круглых тел полоски боковой поверхности без внутренних швов: только
    // рёбра, что лежат на краю развёртки (общие с основаниями)
    const F = M.faces[i];
    for (let j = 0; j < F.v.length; j++){
      const a = F.v[j], b = F.v[(j + 1) % F.v.length];
      const e = M.edges.find(E => (E.a === Math.min(a, b) && E.b === Math.max(a, b)));
      if (e && e.smooth){
        // шов: рисуем, только если это край (первая и последняя полоска)
        const other = e.f.find(x => x !== i);
        const tr = netTree(M);
        if (tr.parent[other] === i || tr.parent[i] === other) continue;
      }
      out.lines.push({ pts: [poly[j], poly[(j + 1) % F.v.length]], hid: false, kind: 'face' });
    }
  });
  if (opt.lab){
    const seen = [];
    FS.forEach((f, i) => f.forEach((q, j) => {
      const vi = M.faces[i].v[j], nm = R.names['v' + vi];
      if (!nm) return;
      const p2 = pr(q);
      if (seen.some(s => s.n === nm && Math.hypot(s.x - p2.x, s.y - p2.y) < M.R * 0.02)) return;
      seen.push({ n: nm, x: p2.x, y: p2.y });
      const fc = pr(avg(f));
      out.labels.push({ t: nm, x: p2.x, y: p2.y, ax: p2.x - fc.x, ay: p2.y - fc.y });
    }));
  }
  let mnx = Infinity, mny = Infinity, mxx = -Infinity, mxy = -Infinity;
  const growB = (p) => { mnx = Math.min(mnx, p.x); mny = Math.min(mny, p.y); mxx = Math.max(mxx, p.x); mxy = Math.max(mxy, p.y); };
  out.fills.forEach(F => F.pts.forEach(growB));
  const size = Math.max(mxx - mnx, mxy - mny, 1e-6);
  out.fs = size * 0.05;
  out.labels.forEach(L => { const l = Math.hypot(L.ax, L.ay) || 1; L.x += L.ax / l * out.fs * 0.7; L.y += L.ay / l * out.fs * 0.7; growB({ x: L.x - out.fs * 0.6, y: L.y - out.fs * 0.6 }); growB({ x: L.x + out.fs * 0.6, y: L.y + out.fs * 0.6 }); });
  out.box = { minX: mnx, minY: mny, maxX: mxx, maxY: mxy };
  out.pos = R.pos; out.names = R.names; out.pr = pr;
  return out;
}
function avg(pts){ let c = V3.P(0, 0, 0); pts.forEach(q => { c = V3.add(c, q); }); return V3.mul(c, 1 / pts.length); }

/* кэш чертежей: на доске тело перерисовывается каждый кадр, а пересчёт
   (видимость 72 граней, склейка ломаных) — миллисекунды. Ключ — сама сцена */
const cache = new Map();
function drawCached(scene){
  const key = JSON.stringify(scene);
  let d = cache.get(key);
  if (!d){
    d = draw(scene);
    cache.set(key, d);
    if (cache.size > 60) cache.delete(cache.keys().next().value);
  } else { cache.delete(key); cache.set(key, d); }
  return d;
}

function newScene(menuId){
  const m = MENU.find(x => x.id === menuId) || MENU[0];
  return { k: m.k, p: clampPar(m.k, m.p), nm: {}, cam: { m: 'school' }, pts: [], segs: [], planes: [], marks: [], opt: {} };
}

window.Solids = {
  V3, KINDS, MENU, PAR_TITLES, clampPar, buildMesh, camBasis, schoolAsOrth, occluded, resolvePoints,
  planeOf, sectionOf, orderSides, draw, drawCached, paint, pretty, newScene, frontFace,
  measure, fmtLen, fmtAngle, fmtNum, exactSqrt, netTree, netFaces, geomOfMark,
};
})();
