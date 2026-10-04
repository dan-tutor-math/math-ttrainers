/* ═══════════════════════════════════════════════════════════════════════
   board-figures.js — готовые фигуры на досках (промпт №17 «фигуры»).

   Этап 1 — плоские фигуры. Новых типов объектов НЕТ: фигура — это обычный
   'poly' (окружность — обычный 'circle') с полем fig, ровно как координатная
   прямая в №81 — обычный 'line' с полем axis. Поэтому:
     - перенос, копирование, группы, выгрузка, облако и ученик работают без
       единой правки — они двигают points и пересылают объект целиком;
     - старая вкладка (или ученик со старой страницей) нарисует хотя бы
       контур, а не потеряет объект.
   Всё, что «сверху» контура (подписи, штрихи, высоты, окружности), рисуется
   из fig на каждом кадре и никуда не сохраняется — его нельзя рассинхронить
   с вершинами.

   fig = {
     k:   вид фигуры (ключ FIG_KINDS),
     lab: имена вершин, у окружности — имя центра,
     sh:  что показано: lab, ticks, arcs, right, diag, in, out, rad, dia —
          флаги; h, m, b — у треугольника массивы номеров вершин («высота из
          A и C»), у четырёхугольника h — флаг; mid — у треугольника массив
          номеров сторон (средняя линия ∥ этой стороне), у трапеции флаг,
     ang: куда смотрит ручка поворота (радианы) — нужна, чтобы угол поворота
          считался от неё, а не от рамки, которая при повороте «дышит»
   }

   Ядро (boards-core.js) зовёт отсюда пять функций — каждая под проверкой
   typeof, чтобы доски жили и без этого файла: figDecor (renderObject),
   figHandles (getHandles), figApplyHandle (applyHandle), figDrawSelection
   (drawSelection), figOnSelection (updateContextMenu).
   ═══════════════════════════════════════════════════════════════════════ */

/* ── векторная мелочь ── */
const fgV = {
  add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y }),
  sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y }),
  mul: (a, k) => ({ x: a.x * k, y: a.y * k }),
  dot: (a, b) => a.x * b.x + a.y * b.y,
  cross: (a, b) => a.x * b.y - a.y * b.x,
  len: (a) => Math.hypot(a.x, a.y),
  unit: (a) => { const l = Math.hypot(a.x, a.y) || 1; return { x: a.x / l, y: a.y / l }; },
  // поворот на 90° в сторону s (+1 — по часовой на экране, где y вниз)
  rot90: (a, s) => s > 0 ? { x: -a.y, y: a.x } : { x: a.y, y: -a.x },
  mid: (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }),
  lerp: (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }),
  rot: (p, c, ang) => {
    const s = Math.sin(ang), co = Math.cos(ang), dx = p.x - c.x, dy = p.y - c.y;
    return { x: c.x + dx * co - dy * s, y: c.y + dx * s + dy * co };
  },
};
function fgArea(pts){
  let s = 0;
  for (let i = 0; i < pts.length; i++){ const a = pts[i], b = pts[(i + 1) % pts.length]; s += a.x * b.y - b.x * a.y; }
  return s / 2;
}
function fgCentroid(pts){
  let x = 0, y = 0;
  pts.forEach(p => { x += p.x; y += p.y; });
  return { x: x / pts.length, y: y / pts.length };
}
function fgFoot(p, a, b){
  const d = fgV.sub(b, a), l2 = fgV.dot(d, d) || 1;
  const t = fgV.dot(fgV.sub(p, a), d) / l2;
  return { t, p: fgV.add(a, fgV.mul(d, t)) };
}
// отражение точки p относительно прямой через a в направлении u (u — единичный)
function fgReflect(p, a, u){
  const f = fgV.add(a, fgV.mul(u, fgV.dot(fgV.sub(p, a), u)));
  return { x: 2 * f.x - p.x, y: 2 * f.y - p.y };
}
function fgCircum(a, b, c){
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(d) < 1e-9) return null;
  const a2 = a.x * a.x + a.y * a.y, b2 = b.x * b.x + b.y * b.y, c2 = c.x * c.x + c.y * c.y;
  const o = { x: (a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / d,
              y: (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / d };
  return { c: o, r: fgV.len(fgV.sub(a, o)) };
}
function fgIncircleTri(A, B, C){
  const a = fgV.len(fgV.sub(B, C)), b = fgV.len(fgV.sub(A, C)), c = fgV.len(fgV.sub(A, B));
  const p = a + b + c;
  if (p < 1e-9) return null;
  return { c: { x: (a * A.x + b * B.x + c * C.x) / p, y: (a * A.y + b * B.y + c * C.y) / p },
           r: 2 * Math.abs(fgArea([A, B, C])) / p };
}
// «A1» → «A₁»: в школе вершины с индексом пишут именно так, а набрать
// подстрочную цифру с клавиатуры нельзя
const FG_SUB = '₀₁₂₃₄₅₆₇₈₉';
function fgPrettyName(s){
  return String(s || '').replace(/(\D)(\d+)$/, (m, a, d) => a + d.split('').map(ch => FG_SUB[+ch]).join(''));
}

/* ═══ виды фигур ═══
   build(s) — вершины вокруг нуля, s — примерный размер (ширина). Порядок
   вершин — как в школьном учебнике: у четырёхугольника A внизу слева, B
   вверху слева, C вверху справа, D внизу справа (основания трапеции — AD и
   BC); равнобедренный треугольник — с основанием AC; прямой угол у
   прямоугольного — при вершине C («∠C = 90°»). */
const FG_TRI_EL = ['lab', 'ticks', 'arcs', 'right', 'h', 'm', 'b', 'mid', 'in', 'out'];
function fgRegular(n, R, a0){
  const out = [];
  for (let i = 0; i < n; i++){ const a = a0 + i * 2 * Math.PI / n; out.push({ x: R * Math.cos(a), y: R * Math.sin(a) }); }
  return out;
}
const FIG_KINDS = {
  'tri-iso':   { title: 'Равнобедренный треугольник', short: 'Равнобедр. △', n: 3, el: FG_TRI_EL,
                 build: s => [{x:-.45*s,y:.35*s},{x:0,y:-.45*s},{x:.45*s,y:.35*s}],
                 ticks: [{ e: [[0,1],[1,2]], k: 1 }], arcs: [{ v: [0,2], k: 1 }] },
  'tri-eq':    { title: 'Равносторонний треугольник', short: 'Равностор. △', n: 3, el: FG_TRI_EL, reg: true,
                 build: s => fgRegular(3, .52 * s, Math.PI * 5 / 6),
                 ticks: [{ e: [[0,1],[1,2],[2,0]], k: 1 }], arcs: [{ v: [0,1,2], k: 1 }] },
  'tri-right': { title: 'Прямоугольный треугольник', short: 'Прямоуг. △', n: 3, el: FG_TRI_EL,
                 build: s => [{x:-.35*s,y:-.4*s},{x:.45*s,y:.3*s},{x:-.35*s,y:.3*s}], right: [2] },
  'tri':       { title: 'Произвольный треугольник', short: 'Треугольник', n: 3, el: FG_TRI_EL,
                 build: s => [{x:-.45*s,y:.35*s},{x:-.1*s,y:-.4*s},{x:.5*s,y:.35*s}] },
  'sq':        { title: 'Квадрат', short: 'Квадрат', n: 4, el: ['lab','ticks','right','diag','in','out'],
                 build: s => [{x:-.4*s,y:.4*s},{x:-.4*s,y:-.4*s},{x:.4*s,y:-.4*s},{x:.4*s,y:.4*s}],
                 ticks: [{ e: [[0,1],[1,2],[2,3],[3,0]], k: 1 }], right: [0,1,2,3] },
  'rect':      { title: 'Прямоугольник', short: 'Прямоугольник', n: 4, el: ['lab','ticks','right','diag','out'],
                 build: s => [{x:-.5*s,y:.3*s},{x:-.5*s,y:-.3*s},{x:.5*s,y:-.3*s},{x:.5*s,y:.3*s}],
                 ticks: [{ e: [[0,1],[2,3]], k: 1 }, { e: [[1,2],[3,0]], k: 2 }], right: [0,1,2,3] },
  'rhomb':     { title: 'Ромб', short: 'Ромб', n: 4, el: ['lab','ticks','arcs','diag','h','in'],
                 build: s => [{x:-.5*s,y:.3*s},{x:-.18*s,y:-.3*s},{x:.5*s,y:-.3*s},{x:.18*s,y:.3*s}],
                 ticks: [{ e: [[0,1],[1,2],[2,3],[3,0]], k: 1 }], arcs: [{ v: [0,2], k: 1 }, { v: [1,3], k: 2 }] },
  'par':       { title: 'Параллелограмм', short: 'Параллелограмм', n: 4, el: ['lab','ticks','arcs','diag','h'],
                 build: s => [{x:-.5*s,y:.3*s},{x:-.25*s,y:-.3*s},{x:.5*s,y:-.3*s},{x:.25*s,y:.3*s}],
                 ticks: [{ e: [[0,1],[2,3]], k: 1 }, { e: [[1,2],[3,0]], k: 2 }], arcs: [{ v: [0,2], k: 1 }, { v: [1,3], k: 2 }] },
  'trap-iso':  { title: 'Равнобедренная трапеция', short: 'Равнобедр. трапеция', n: 4, el: ['lab','ticks','arcs','diag','h','mid','in','out'],
                 build: s => [{x:-.5*s,y:.3*s},{x:-.25*s,y:-.3*s},{x:.25*s,y:-.3*s},{x:.5*s,y:.3*s}],
                 ticks: [{ e: [[0,1],[2,3]], k: 1 }], arcs: [{ v: [0,3], k: 1 }, { v: [1,2], k: 2 }] },
  'trap-right':{ title: 'Прямоугольная трапеция', short: 'Прямоуг. трапеция', n: 4, el: ['lab','right','diag','h','mid','in'],
                 build: s => [{x:-.45*s,y:.3*s},{x:-.45*s,y:-.3*s},{x:.15*s,y:-.3*s},{x:.5*s,y:.3*s}], right: [0,1] },
  'trap':      { title: 'Произвольная трапеция', short: 'Трапеция', n: 4, el: ['lab','diag','h','mid'],
                 build: s => [{x:-.5*s,y:.3*s},{x:-.3*s,y:-.3*s},{x:.2*s,y:-.3*s},{x:.5*s,y:.3*s}] },
  'circle':    { title: 'Окружность', short: 'Окружность', n: 0, el: ['lab','rad','dia'] },
  'hex':       { title: 'Правильный шестиугольник', short: 'Шестиугольник', n: 6, el: ['lab','ticks','arcs','diag','in','out'], reg: true,
                 build: s => fgRegular(6, .5 * s, Math.PI * 2 / 3),
                 ticks: [{ e: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0]], k: 1 }], arcs: [{ v: [0,1,2,3,4,5], k: 1 }] },
};
const FIG_ORDER = ['tri-iso','tri-eq','tri-right','tri','sq','rect','rhomb','par','trap-iso','trap-right','trap','circle','hex'];
const FG_LETTERS = 'ABCDEF';

function figDefaultShow(K){
  return { lab: true, ticks: true, arcs: false, right: true, diag: false,
           h: K.n === 3 ? [] : false, m: [], b: [], mid: K.n === 3 ? [] : false,
           in: false, out: false, rad: false, dia: false };
}
// новая фигура в мировых координатах: центр c, размер s
function figCreate(kind, c, s){
  const K = FIG_KINDS[kind];
  if (!K) return null;
  if (kind === 'circle'){
    const obj = newBase('circle');
    obj.points = [{ x: c.x, y: c.y }];
    obj.r = s * 0.4;
    obj.fig = { k: kind, lab: ['O'], sh: figDefaultShow(K), ang: -Math.PI / 6 };
    return obj;
  }
  const obj = newBase('poly');
  obj.points = K.build(s).map(p => ({ x: c.x + p.x, y: c.y + p.y }));
  obj.fig = { k: kind, lab: FG_LETTERS.slice(0, K.n).split(''), sh: figDefaultShow(K), ang: -Math.PI / 2 };
  return obj;
}

/* ═══ ручки ═══
   Сначала вершины (их ищут первыми — иначе у прямоугольника правый нижний
   угол перехватывала бы ручка масштаба), потом поворот и масштаб. Отступы
   ручек — в мировых единицах, а не в пикселях: getHandles зовут и для доски,
   и для заметок справочной панели, у которых разные камеры. */
function fgFrame(obj){
  const pts = obj.points, cen = fgCentroid(pts);
  let R = 0, minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  pts.forEach(p => {
    R = Math.max(R, fgV.len(fgV.sub(p, cen)));
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
  });
  const off = R * 0.22 + 14;
  const ang = obj.fig.ang != null ? obj.fig.ang : -Math.PI / 2;
  return {
    cen, R, minX, minY, maxX, maxY,
    rot: { x: cen.x + Math.cos(ang) * (R + off), y: cen.y + Math.sin(ang) * (R + off) },
    sc: { x: maxX + off * 0.55, y: maxY + off * 0.55 },
  };
}
function figHandles(obj){
  if (obj.solid) return figSolidHandles(obj);
  if (!obj.fig || obj.type !== 'poly' || !FIG_KINDS[obj.fig.k]) return null;
  const F = fgFrame(obj);
  const hs = obj.points.map((p, i) => ({ role: 'pt' + i, x: p.x, y: p.y }));
  hs.push({ role: 'frot', x: F.rot.x, y: F.rot.y }, { role: 'fsc', x: F.sc.x, y: F.sc.y });
  return hs;
}

/* Перетаскивание вершины с сохранением вида фигуры. P — точка курсора (уже
   с прилипанием к клеткам), pts — копия вершин; возвращает новые вершины.
   Общий принцип: всё, что можно, держим неподвижным, двигаем минимум —
   тогда фигура не «уезжает» из-под руки. */
function fgDragVertex(kind, i, P, pts, sh){
  const n = pts.length, V = fgV;
  const s = Math.sign(fgArea(pts)) || 1;
  if (kind === 'tri') { pts[i] = P; return pts; }
  if (FIG_KINDS[kind].reg){
    // правильные: центр на месте, вершина задаёт радиус и поворот
    const O = fgCentroid(pts), r = V.sub(P, O);
    if (V.len(r) < 4) return pts;
    return pts.map((p, k) => V.add(O, V.rot({ x: r.x, y: r.y }, { x: 0, y: 0 }, s * (k - i) * 2 * Math.PI / n)));
  }
  if (kind === 'tri-iso'){
    // ось симметрии — через вершину B и середину основания AC
    const B = pts[1], M = V.mid(pts[0], pts[2]), u = V.unit(V.sub(M, B));
    if (i === 1){
      // вершина едет по оси, основание на месте
      const t = V.dot(V.sub(P, M), u);
      pts[1] = V.add(M, V.mul(u, t));
      return pts;
    }
    pts[i] = P; pts[2 - i] = fgReflect(P, B, u);
    return pts;
  }
  if (kind === 'tri-right'){
    const C = pts[2];
    if (i === 2){
      // прямой угол опирается на гипотенузу — его вершина ходит по окружности
      // с диаметром AB (угол, вписанный в полуокружность)
      const O = V.mid(pts[0], pts[1]), R = V.len(V.sub(pts[0], pts[1])) / 2;
      const d = V.sub(P, O);
      if (V.len(d) < 1e-6) return pts;
      pts[2] = V.add(O, V.mul(V.unit(d), R));
      return pts;
    }
    // острая вершина — куда угодно; второй катет поворачивается следом и
    // сохраняет длину, оставаясь перпендикулярным
    const j = 1 - i, oth = pts[j];
    const side = Math.sign(V.cross(V.sub(pts[i], C), V.sub(oth, C))) || 1;
    if (V.len(V.sub(P, C)) < 4) return pts;
    pts[i] = P;
    pts[j] = V.add(C, V.mul(V.rot90(V.unit(V.sub(P, C)), side), V.len(V.sub(oth, C))));
    return pts;
  }
  const o = (i + 2) % 4, nx = (i + 1) % 4, pv = (i + 3) % 4;
  if (kind === 'rect'){
    // противоположная вершина на месте, стороны остаются вдоль своих направлений
    const O = pts[o], e1 = V.unit(V.sub(pts[nx], pts[i])), e2 = V.unit(V.sub(pts[pv], pts[i]));
    pts[i] = P;
    pts[nx] = V.add(O, V.mul(e2, V.dot(V.sub(P, O), e2)));
    pts[pv] = V.add(O, V.mul(e1, V.dot(V.sub(P, O), e1)));
    return pts;
  }
  if (kind === 'sq'){
    // противоположная вершина на месте, диагональ задаёт квадрат целиком
    const O = pts[o], c = V.mid(O, P), d = V.sub(P, c);
    if (V.len(d) < 3) return pts;
    const a = V.add(c, V.rot90(d, 1)), b = V.sub(c, V.rot90(d, 1));
    pts[i] = P; pts[nx] = a; pts[pv] = b;
    if (Math.sign(fgArea(pts)) !== s){ pts[nx] = b; pts[pv] = a; }
    return pts;
  }
  if (kind === 'rhomb'){
    // центр на месте, вершина задаёт одну диагональ; вторая — той же длины,
    // перпендикулярно (диагонали ромба перпендикулярны и делятся пополам)
    const O = fgCentroid(pts), d = V.sub(P, O);
    if (V.len(d) < 3) return pts;
    const h = V.len(V.sub(pts[nx], O));
    const a = V.add(O, V.mul(V.rot90(V.unit(d), 1), h)), b = V.sub(O, V.mul(V.rot90(V.unit(d), 1), h));
    pts[i] = P; pts[o] = V.sub(O, d); pts[nx] = a; pts[pv] = b;
    if (Math.sign(fgArea(pts)) !== s){ pts[nx] = b; pts[pv] = a; }
    return pts;
  }
  if (kind === 'par'){
    // соседняя по ходу и противоположная на месте, четвёртая достраивается
    pts[i] = P;
    pts[pv] = V.add(P, V.sub(pts[o], pts[nx]));
    return pts;
  }
  // трапеции: основания AD (0–3) и BC (1–2), u — направление оснований
  const A = pts[0], D = pts[3];
  const u = V.unit(V.sub(D, A));
  if (kind === 'trap-iso'){
    // ось симметрии — перпендикуляр к основаниям через их середины. Вершина
    // ходит свободно, парная к ней — зеркально через ось: основания остаются
    // параллельными, боковые стороны — равными
    const X = V.mid(V.mid(A, D), V.mid(pts[1], pts[2]));
    const n = V.rot90(u, 1);
    const pair = { 0: 3, 3: 0, 1: 2, 2: 1 }[i];
    pts[i] = P; pts[pair] = fgReflect(P, X, n);
    if (sh && sh.in) fgTangentialIso(pts);
    return pts;
  }
  if (kind === 'trap-right'){
    // прямые углы при A и B: AB перпендикулярна основаниям
    const nB = V.unit(V.sub(pts[1], A));
    const h = V.dot(V.sub(pts[1], A), nB);
    if (i === 0){
      // A ходит по прямой нижнего основания, B — над ней на прежней высоте,
      // верхнее основание сохраняет длину
      const top = V.dot(V.sub(pts[2], pts[1]), u);
      const na = V.add(D, V.mul(u, V.dot(V.sub(P, D), u)));
      pts[0] = na; pts[1] = V.add(na, V.mul(nB, h));
      pts[2] = V.add(pts[1], V.mul(u, top));
    } else if (i === 3){
      pts[3] = V.add(A, V.mul(u, V.dot(V.sub(P, A), u)));
    } else {
      const nh = V.dot(V.sub(P, A), nB);
      if (Math.abs(nh) < 4) return pts;
      const top = i === 2 ? V.dot(V.sub(P, A), u) : V.dot(V.sub(pts[2], pts[1]), u);
      pts[1] = V.add(A, V.mul(nB, nh));
      pts[2] = V.add(pts[1], V.mul(u, top));
    }
    if (sh && sh.in) fgTangentialRight(pts);
    return pts;
  }
  if (kind === 'trap'){
    if (i === 0 || i === 3){
      // нижнее основание наклоняют — верхнее поворачивается следом, держась за B
      pts[i] = P;
      const nu = V.unit(V.sub(pts[3], pts[0]));
      pts[2] = V.add(pts[1], V.mul(nu, V.dot(V.sub(pts[2], pts[1]), nu)));
    } else {
      // вершина верхнего основания — куда угодно, соседняя по основанию
      // уходит на ту же высоту
      const j = i === 1 ? 2 : 1;
      const along = V.dot(V.sub(pts[j], pts[i]), u);
      pts[i] = P; pts[j] = V.add(P, V.mul(u, along));
    }
    return pts;
  }
  return pts;
}
/* Вписанная окружность у трапеции есть, только если суммы противоположных
   сторон равны. Включили её — фигура подстраивается: нижнее основание и
   высота остаются, верхнее пересчитывается. Для равнобедренной (основания
   a и b, высота h): a + b = 2·боковая ⇔ ab = h², то есть b = h² / a. */
function fgTangentialIso(pts){
  const V = fgV, A = pts[0], D = pts[3], u = V.unit(V.sub(D, A));
  const a = V.len(V.sub(D, A));
  const M = V.mid(A, D), N = V.mid(pts[1], pts[2]);
  const nvec = V.sub(N, M);
  let h = Math.abs(V.cross(u, nvec));
  if (a < 1e-6) return;
  if (h >= a * 0.95){ h = a * 0.8; }
  const nn = V.mul(V.unit(V.sub(nvec, V.mul(u, V.dot(nvec, u)))), h);
  const b = h * h / a;
  const top = V.add(M, nn);
  pts[1] = V.sub(top, V.mul(u, b / 2)); pts[2] = V.add(top, V.mul(u, b / 2));
}
/* Прямоугольная (основания a и b, высота h — она же боковая AB):
   a + b = h + √(h² + (a − b)²) ⇔ b = ha / (2a − h). */
function fgTangentialRight(pts){
  const V = fgV, A = pts[0], D = pts[3], u = V.unit(V.sub(D, A));
  const a = V.len(V.sub(D, A));
  const nB = V.unit(V.sub(pts[1], A));
  let h = V.dot(V.sub(pts[1], A), nB);
  if (a < 1e-6 || h < 1e-6) return;
  if (h >= a * 0.95){ h = a * 0.8; pts[1] = V.add(A, V.mul(nB, h)); }
  const b = h * a / (2 * a - h);
  pts[2] = V.add(pts[1], V.mul(u, b));
}

// true — ручку обработали здесь (ядро дальше не идёт)
function figApplyHandle(obj, role, pt, rawPt){
  if (obj.solid) return figSolidApplyHandle(obj, role, rawPt);
  if (!obj.fig || obj.type !== 'poly' || !FIG_KINDS[obj.fig.k]) return false;
  const F = fgFrame(obj);
  if (role === 'frot'){
    // поворот вокруг центра; рядом с кратным 15° прилипает — так проще
    // вернуть фигуру ровно или поставить «на угол»
    let a = Math.atan2(rawPt.y - F.cen.y, rawPt.x - F.cen.x);
    const step = Math.PI / 12, near = Math.round(a / step) * step;
    if (Math.abs(a - near) < Math.PI / 60) a = near;
    const prev = obj.fig.ang != null ? obj.fig.ang : -Math.PI / 2;
    obj.points = obj.points.map(p => fgV.rot(p, F.cen, a - prev));
    obj.fig.ang = a;
    return true;
  }
  if (role === 'fsc'){
    // масштаб вокруг центра — вид фигуры не меняется вовсе
    const cur = fgV.len(fgV.sub(F.sc, F.cen)), want = fgV.len(fgV.sub(rawPt, F.cen));
    if (cur < 1e-6) return true;
    let k = want / cur;
    if (F.R * k < 12) k = 12 / F.R;
    obj.points = obj.points.map(p => fgV.add(F.cen, fgV.mul(fgV.sub(p, F.cen), k)));
    return true;
  }
  if (role && role.indexOf('pt') === 0){
    const i = +role.slice(2);
    obj.points = fgDragVertex(obj.fig.k, i, pt, obj.points.map(p => ({ x: p.x, y: p.y })), obj.fig.sh);
    return true;
  }
  return false;
}

function figDrawSelection(c, obj, camv){
  if (obj.solid) return figSolidDrawSelection(c, obj, camv);
  if (!obj.fig || obj.type !== 'poly' || !FIG_KINDS[obj.fig.k]) return false;
  const F = fgFrame(obj), ink = themeVar('--ink');
  const toS = p => worldToScreen(p);
  c.save();
  // тонкая рамка — видно, что выделена фигура целиком, а не только контур
  const a = toS({ x: F.minX, y: F.minY }), b = toS({ x: F.maxX, y: F.maxY });
  c.strokeStyle = ink; c.lineWidth = 1; c.setLineDash([5, 3]); c.globalAlpha = 0.6;
  c.strokeRect(a.x - 6, a.y - 6, b.x - a.x + 12, b.y - a.y + 12);
  c.globalAlpha = 1; c.setLineDash([]);
  const cen = toS(F.cen), rot = toS(F.rot), sc = toS(F.sc);
  // ручка поворота на «ниточке» от центра — понятно, вокруг чего крутится
  c.beginPath(); c.moveTo(cen.x, cen.y); c.lineTo(rot.x, rot.y);
  c.setLineDash([2, 3]); c.lineWidth = 1; c.stroke(); c.setLineDash([]);
  c.fillStyle = '#fff'; c.lineWidth = 2;
  c.beginPath(); c.arc(rot.x, rot.y, 7, 0, Math.PI * 2); c.fill(); c.stroke();
  c.beginPath(); c.arc(rot.x, rot.y, 3.4, -Math.PI * 0.15, Math.PI * 1.2); c.lineWidth = 1.4; c.stroke();
  c.lineWidth = 2;
  c.fillRect(sc.x - 5.5, sc.y - 5.5, 11, 11); c.strokeRect(sc.x - 5.5, sc.y - 5.5, 11, 11);
  c.beginPath(); c.moveTo(sc.x - 2.5, sc.y - 2.5); c.lineTo(sc.x + 2.5, sc.y + 2.5); c.lineWidth = 1.3; c.stroke();
  // вершины — как у остальных фигур
  c.fillStyle = ink; c.strokeStyle = '#fff'; c.lineWidth = 1.5;
  obj.points.forEach(p => { const s = toS(p); c.beginPath(); c.arc(s.x, s.y, 5, 0, Math.PI * 2); c.fill(); c.stroke(); });
  c.restore();
  return true;
}

/* ═══ рисование «сверху» контура ═══
   Всё в экранных координатах (wp — вершины на экране): переход мир → экран —
   сдвиг и одинаковый масштаб, так что основания высот, центры окружностей и
   т. п. там те же самые. Размеры отметок и подписей — в мировых единицах
   (умножаются на zoom), то есть растут и уменьшаются вместе с фигурой при
   масштабе доски. */
function fgSizeWorld(obj){
  if (obj.type === 'circle') return obj.r * 2;
  const b = objectBBox(obj);
  return Math.max(20, Math.sqrt(Math.max(1, (b.maxX - b.minX) * (b.maxY - b.minY))));
}
function fgLabelAt(c, text, p, dir, fs){
  c.fillText(fgPrettyName(text), p.x + dir.x * fs * 0.78, p.y + dir.y * fs * 0.78);
}
function fgOutDir(p, cen, prev, next){
  const V = fgV;
  let d;
  if (prev && next){
    const bis = V.add(V.unit(V.sub(prev, p)), V.unit(V.sub(next, p)));
    d = V.len(bis) < 1e-3 ? V.rot90(V.unit(V.sub(next, prev)), 1) : V.mul(V.unit(bis), -1);
  } else d = V.unit(V.sub(p, cen));
  if (V.dot(d, V.sub(cen, p)) > 0) d = V.mul(d, -1);
  return d;
}
function fgTick(c, a, b, k, u){
  const V = fgV, m = V.mid(a, b), t = V.unit(V.sub(b, a)), n = V.rot90(t, 1);
  for (let j = 0; j < k; j++){
    const o = V.add(m, V.mul(t, (j - (k - 1) / 2) * u * 0.85));
    c.beginPath(); c.moveTo(o.x + n.x * u * 1.3, o.y + n.y * u * 1.3); c.lineTo(o.x - n.x * u * 1.3, o.y - n.y * u * 1.3); c.stroke();
  }
}
function fgArc(c, v, p, q, k, u){
  const a1 = Math.atan2(p.y - v.y, p.x - v.x);
  let d = Math.atan2(q.y - v.y, q.x - v.x) - a1;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d <= -Math.PI) d += 2 * Math.PI;
  for (let j = 0; j < k; j++){
    c.beginPath(); c.arc(v.x, v.y, u * (3.3 + j * 0.8), a1, a1 + d, d < 0); c.stroke();
  }
}
function fgRight(c, v, p, q, u){
  const V = fgV, e1 = V.mul(V.unit(V.sub(p, v)), u * 2.5), e2 = V.mul(V.unit(V.sub(q, v)), u * 2.5);
  c.beginPath(); c.moveTo(v.x + e1.x, v.y + e1.y); c.lineTo(v.x + e1.x + e2.x, v.y + e1.y + e2.y); c.lineTo(v.x + e2.x, v.y + e2.y); c.stroke();
}
function fgSeg(c, a, b, dashed, lw){
  c.save();
  if (dashed) c.setLineDash([lw * 3.2, lw * 2.6]);
  c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
  c.restore();
}
function fgDot(c, p, r){ c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI * 2); c.fill(); }
function fgCircle(c, o, r){ c.beginPath(); c.arc(o.x, o.y, Math.max(1, r), 0, Math.PI * 2); c.stroke(); }

// перпендикуляр из P на прямую (a, b): сам отрезок, пунктир продолжения
// стороны, если основание за её пределами, и знак прямого угла
function fgDrop(c, P, a, b, u, lw){
  const V = fgV, f = fgFoot(P, a, b), H = f.p;
  if (V.len(V.sub(P, H)) < 1) return H;
  fgSeg(c, P, H, false, lw);
  if (f.t < -0.001) fgSeg(c, a, H, true, lw);
  if (f.t > 1.001) fgSeg(c, b, H, true, lw);
  const along = f.t < 0.5 ? b : a;
  if (V.len(V.sub(along, H)) > 1) fgRight(c, H, P, along, u * 0.85);
  return H;
}

function figDecor(c, obj, wp, camv){
  const f = obj.fig, K = f && FIG_KINDS[f.k];
  if (!K) return;
  // показываем только то, что у этого вида фигуры бывает: флаг мог остаться
  // от данных, собранных руками, или прийти от другой версии страницы
  const sh0 = f.sh || {}, sh = {};
  Object.keys(sh0).forEach(key => { if (K.el.includes(key)) sh[key] = sh0[key]; });
  if (!K.el.includes('lab')) sh.lab = false;
  const z = camv.zoom, sw = fgSizeWorld(obj);
  const u = Math.max(4, Math.min(11, sw * 0.032)) * z;
  const fs = Math.max(14, Math.min(30, sw * 0.075)) * z;
  const baseLw = c.lineWidth, auxLw = Math.max(1, baseLw * 0.7);
  const V = fgV;
  c.save();
  c.setLineDash([]);
  c.font = '500 ' + fs.toFixed(1) + 'px ' + UI_FONT_FAMILY;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  const labels = [];   // [текст, точка, направление] — подписи рисуем последними, поверх линий

  if (f.k === 'circle'){
    const O = worldToScreen(obj.points[0]), r = obj.r * z;
    const ang = f.ang != null ? f.ang : -Math.PI / 6;
    c.lineWidth = auxLw;
    if (sh.dia){
      const d = { x: Math.cos(0), y: Math.sin(0) };
      fgSeg(c, V.sub(O, V.mul(d, r)), V.add(O, V.mul(d, r)), false, auxLw);
    }
    if (sh.rad){
      const e = V.add(O, V.mul({ x: Math.cos(ang), y: Math.sin(ang) }, r));
      fgSeg(c, O, e, false, auxLw);
      fgDot(c, e, Math.max(2, baseLw * 0.9));
    }
    if (sh.lab !== false && f.lab && f.lab[0]) labels.push([f.lab[0], O, V.unit({ x: -0.7, y: 0.75 })]);
  } else {
    const n = wp.length, cen = fgCentroid(wp), dotR = Math.max(2, baseLw * 0.9);
    c.lineWidth = auxLw;
    const nm = i => (f.lab && f.lab[i]) || '';
    // ── вспомогательные линии ──
    if (n === 3){
      const many = (arr) => (Array.isArray(arr) ? arr : []).length > 1;
      const sub = (letter, i, arr) => many(arr) ? letter + (i + 1) : letter;
      (Array.isArray(sh.h) ? sh.h : []).forEach(i => {
        const j = (i + 1) % 3, k = (i + 2) % 3;
        const H = fgDrop(c, wp[i], wp[j], wp[k], u, auxLw);
        // в прямоугольном треугольнике высота из острого угла — это катет,
        // её основание — вершина прямого угла: вторая буква там лишняя
        if (Math.min(fgV.len(fgV.sub(H, wp[j])), fgV.len(fgV.sub(H, wp[k]))) < u * 0.6) return;
        fgDot(c, H, dotR);
        labels.push([sub('H', i, sh.h), H, fgOutDir(H, cen)]);
      });
      (Array.isArray(sh.m) ? sh.m : []).forEach(i => {
        const j = (i + 1) % 3, k = (i + 2) % 3, M = V.mid(wp[j], wp[k]);
        fgSeg(c, wp[i], M, false, auxLw); fgDot(c, M, dotR);
        labels.push([sub('M', i, sh.m), M, fgOutDir(M, cen)]);
      });
      (Array.isArray(sh.b) ? sh.b : []).forEach(i => {
        const j = (i + 1) % 3, k = (i + 2) % 3;
        const lj = V.len(V.sub(wp[j], wp[i])), lk = V.len(V.sub(wp[k], wp[i]));
        const L = V.lerp(wp[j], wp[k], lj / ((lj + lk) || 1));
        fgSeg(c, wp[i], L, false, auxLw); fgDot(c, L, dotR);
        // половинки угла — по дуге, как отмечают биссектрису в тетради
        fgArc(c, wp[i], wp[j], L, 1, u * 0.9); fgArc(c, wp[i], L, wp[k], 1, u * 0.9);
        labels.push([sub('L', i, sh.b), L, fgOutDir(L, cen)]);
      });
      (Array.isArray(sh.mid) ? sh.mid : []).forEach(sIdx => {
        // сторона sIdx: 0 — AB, 1 — BC, 2 — CA; средняя линия ей параллельна
        const j = sIdx, k = (sIdx + 1) % 3, i = (sIdx + 2) % 3;
        fgSeg(c, V.mid(wp[i], wp[j]), V.mid(wp[i], wp[k]), false, auxLw);
        fgDot(c, V.mid(wp[i], wp[j]), dotR); fgDot(c, V.mid(wp[i], wp[k]), dotR);
      });
      if (sh.in){ const I = fgIncircleTri(wp[0], wp[1], wp[2]); if (I){ fgCircle(c, I.c, I.r); fgDot(c, I.c, dotR); } }
      if (sh.out){ const O = fgCircum(wp[0], wp[1], wp[2]); if (O){ fgCircle(c, O.c, O.r); fgDot(c, O.c, dotR); } }
    } else {
      if (sh.diag){
        if (n === 4){
          fgSeg(c, wp[0], wp[2], false, auxLw); fgSeg(c, wp[1], wp[3], false, auxLw);
          // точка пересечения диагоналей
          const d1 = V.sub(wp[2], wp[0]), d2 = V.sub(wp[3], wp[1]), den = V.cross(d1, d2);
          if (Math.abs(den) > 1e-6){
            const t = V.cross(V.sub(wp[1], wp[0]), d2) / den, O = V.add(wp[0], V.mul(d1, t));
            fgDot(c, O, dotR);
            labels.push(['O', O, V.unit({ x: 0.05, y: 1 })]);
            if (f.k === 'rhomb' || f.k === 'sq') fgRight(c, O, wp[1], wp[2], u * 0.8);
          }
        } else if (n === 6){
          for (let i = 0; i < 3; i++) fgSeg(c, wp[i], wp[i + 3], false, auxLw);
          fgDot(c, cen, dotR);
          labels.push(['O', cen, V.unit({ x: 0.3, y: 1 })]);
        }
      }
      if (sh.h && n === 4){
        // высота трапеции и параллелограмма — из B на AD; у прямоугольной
        // трапеции AB уже высота, поэтому из C
        const from = f.k === 'trap-right' ? 2 : 1;
        const H = fgDrop(c, wp[from], wp[0], wp[3], u, auxLw);
        fgDot(c, H, dotR);
        labels.push(['H', H, V.unit({ x: 0.15, y: 1 })]);
      }
      if (sh.mid && n === 4){
        const M1 = V.mid(wp[0], wp[1]), M2 = V.mid(wp[2], wp[3]);
        fgSeg(c, M1, M2, false, auxLw); fgDot(c, M1, dotR); fgDot(c, M2, dotR);
      }
      if (sh.in){
        let I = null;
        if (f.k === 'sq' || f.k === 'rhomb' || f.k === 'hex'){
          const F0 = fgFoot(cen, wp[0], wp[1]).p;
          I = { c: cen, r: V.len(V.sub(F0, cen)) };
        } else if (f.k === 'trap-iso'){
          const M = V.mid(wp[0], wp[3]), N = V.mid(wp[1], wp[2]);
          I = { c: V.mid(M, N), r: V.len(V.sub(N, M)) / 2 };
        } else if (f.k === 'trap-right'){
          const h = V.len(V.sub(wp[1], wp[0])), uu = V.unit(V.sub(wp[3], wp[0]));
          I = { c: V.add(V.mid(wp[0], wp[1]), V.mul(uu, h / 2)), r: h / 2 };
        }
        if (I){ fgCircle(c, I.c, I.r); fgDot(c, I.c, dotR); }
      }
      if (sh.out){
        let O = null;
        if (f.k === 'hex') O = { c: cen, r: V.len(V.sub(wp[0], cen)) };
        else if (n === 4) O = fgCircum(wp[0], wp[1], wp[3]);
        if (O){ fgCircle(c, O.c, O.r); fgDot(c, O.c, dotR); }
      }
    }
    // ── отметки: штрихи, дуги, прямые углы ──
    c.lineWidth = Math.max(1, baseLw * 0.75);
    if (sh.ticks && K.ticks) K.ticks.forEach(g => g.e.forEach(([a, b]) => fgTick(c, wp[a], wp[b], g.k, u)));
    if (sh.arcs && K.arcs) K.arcs.forEach(g => g.v.forEach(i => fgArc(c, wp[i], wp[(i + n - 1) % n], wp[(i + 1) % n], g.k, u)));
    if (sh.right !== false && K.right) K.right.forEach(i => fgRight(c, wp[i], wp[(i + n - 1) % n], wp[(i + 1) % n], u));
    if (sh.lab !== false){
      for (let i = 0; i < n; i++){
        if (!nm(i)) continue;
        labels.push([nm(i), wp[i], fgOutDir(wp[i], cen, wp[(i + n - 1) % n], wp[(i + 1) % n])]);
      }
    }
  }
  labels.forEach(([t, p, d]) => fgLabelAt(c, t, p, d, fs));
  c.restore();
}

/* ═══ меню «Фигуры» и панель «Элементы фигуры» ═══ */
let fgMenuTab = 'plane';
let fgPanelFor = null;   // id фигуры, для которой открыта панель

// иконка вида — та же геометрия, что на доске, в маленьком холсте
function fgIconCanvas(kind){
  const cv = document.createElement('canvas');
  const S = 46, d = Math.max(1, window.devicePixelRatio || 1);
  cv.width = S * d; cv.height = S * d; cv.style.width = S + 'px'; cv.style.height = S + 'px';
  const c = cv.getContext('2d');
  c.scale(d, d);
  c.strokeStyle = resolveColor('--pencil'); c.lineWidth = 1.6; c.lineJoin = 'round'; c.lineCap = 'round';
  const K = FIG_KINDS[kind];
  if (kind === 'circle'){
    c.beginPath(); c.arc(S / 2, S / 2, 16, 0, Math.PI * 2); c.stroke();
    c.fillStyle = c.strokeStyle; fgDot(c, { x: S / 2, y: S / 2 }, 1.8);
    return cv;
  }
  const pts = K.build(34).map(p => ({ x: S / 2 + p.x, y: S / 2 + p.y }));
  c.beginPath(); c.moveTo(pts[0].x, pts[0].y); pts.slice(1).forEach(p => c.lineTo(p.x, p.y)); c.closePath(); c.stroke();
  c.lineWidth = 1.1;
  if (K.ticks) K.ticks.forEach(g => g.e.forEach(([a, b]) => fgTick(c, pts[a], pts[b], g.k, 2.4)));
  if (K.right) K.right.forEach(i => fgRight(c, pts[i], pts[(i + K.n - 1) % K.n], pts[(i + 1) % K.n], 2));
  return cv;
}

function fgMenuEl(){ return document.getElementById('bdFigMenu'); }
function figMenuOpen(){ const m = fgMenuEl(); return !!(m && m.classList.contains('open')); }
function figCloseMenu(){
  const m = fgMenuEl();
  if (m) m.classList.remove('open');
  const b = document.getElementById('figBtn');
  if (b) b.classList.remove('active');
}
function fgRenderMenu(){
  const grid = document.getElementById('bdFigGrid');
  if (!grid) return;
  grid.innerHTML = '';
  document.querySelectorAll('#bdFigMenu .bd-fig-tab').forEach(t => t.classList.toggle('on', t.dataset.tab === fgMenuTab));
  if (fgMenuTab === 'plane'){
    FIG_ORDER.forEach(k => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'bd-fig-item'; b.dataset.fig = k; b.title = FIG_KINDS[k].title;
      b.appendChild(fgIconCanvas(k));
      const s = document.createElement('span'); s.textContent = FIG_KINDS[k].short; b.appendChild(s);
      grid.appendChild(b);
    });
  } else if (typeof window.figRenderSolidItems === 'function'){
    window.figRenderSolidItems(grid);   // этап 2 — тела, в своём модуле
  } else {
    grid.innerHTML = '<div class="bd-fig-empty">Загружаем…</div>';
  }
}
function fgPlaceMenu(){
  const m = fgMenuEl(), btn = document.getElementById('figBtn'), dock = document.getElementById('bdDock');
  if (!m || !btn || !dock) return;
  const br = btn.getBoundingClientRect(), dr = dock.getBoundingClientRect();
  const mw = m.offsetWidth, mh = m.offsetHeight, W = window.innerWidth, H = window.innerHeight;
  let left, top;
  if (dock.classList.contains('pos-left')){ left = dr.right + 10; top = br.top + br.height / 2 - mh / 2; }
  else if (dock.classList.contains('pos-right')){ left = dr.left - mw - 10; top = br.top + br.height / 2 - mh / 2; }
  else { left = br.left + br.width / 2 - mw / 2; top = dr.top - mh - 10; }
  m.style.left = Math.max(8, Math.min(W - mw - 8, left)) + 'px';
  m.style.top = Math.max(8, Math.min(H - mh - 8, top)) + 'px';
}
function figToggleMenu(){
  const m = fgMenuEl();
  if (!m) return;
  if (figMenuOpen()){ figCloseMenu(); return; }
  fgRenderMenu();
  m.classList.add('open');
  document.getElementById('figBtn').classList.add('active');
  fgPlaceMenu();
}

// куда и какого размера ставить новую фигуру: центр видимой части доски
// (без панелей), примерно треть её меньшей стороны
function figSpot(){
  const v = visibleBoardRect();
  return { c: { x: v.x + v.w / 2, y: v.y + v.h / 2 }, s: Math.max(60, Math.min(v.w, v.h) * 0.42) };
}
function figSelectNew(obj){
  // сразу «Выделение»: следующим движением фигуру тянут за вершины или
  // поворачивают, а не рисуют поверх неё ручкой
  const selBtn = document.querySelector('.bd-tool[data-tool="select"]');
  if (selBtn && tool !== 'select') selBtn.click();
  selectedId = obj.id; multiSelectIds = [];
  updateContextMenu(); scheduleRedraw();
}
function figInsert(kind){
  if (!B || !mayDraw()) return null;
  const sp = figSpot();
  const obj = figCreate(kind, sp.c, sp.s);
  if (!obj) return null;
  commitObject(obj);
  figCloseMenu();
  figSelectNew(obj);
  // на телефоне панель легла бы поверх самой фигуры — там она открывается
  // из меню выделения, когда нужна
  if (window.innerWidth > 600) figOpenPanel(obj.id);
  return obj;
}

/* панель «Элементы фигуры» — имена вершин и что показывать. Каждое
   нажатие — отдельный шаг отмены; набор имени — один шаг на всё поле */
const FG_EL_TITLES = { ticks: 'Равные стороны', arcs: 'Равные углы', right: 'Прямой угол', diag: 'Диагонали',
  in: 'Вписанная окр.', out: 'Описанная окр.', rad: 'Радиус', dia: 'Диаметр', lab: 'Подписи' };
function fgPanelEl(){ return document.getElementById('bdFigPanel'); }
function figPanelObj(){
  if (!B || !fgPanelFor) return null;
  return B.objects.find(o => o.id === fgPanelFor && (o.fig || o.solid)) || null;
}
function figClosePanel(){
  fgPanelFor = null;
  const p = fgPanelEl();
  if (p) p.classList.remove('open');
}
function fgChange(fn){
  const obj = figPanelObj();
  if (!obj || !mayTouch(obj)) return;
  pushUndo();
  fn(obj);
  saveDB(); scheduleRedraw();
  figRenderPanel();
}
function fgToggleIn(arr, v){
  const a = Array.isArray(arr) ? arr.slice() : [];
  const i = a.indexOf(v);
  if (i >= 0) a.splice(i, 1); else { a.push(v); a.sort(); }
  return a;
}
function figRenderPanel(){
  const p = fgPanelEl(), obj = figPanelObj();
  if (!p || !obj){ figClosePanel(); return; }
  if (typeof window.figRenderSolidPanel === 'function' && obj.solid){ window.figRenderSolidPanel(p, obj); return; }
  const f = obj.fig, K = FIG_KINDS[f.k], sh = f.sh || (f.sh = figDefaultShow(K));
  const keepFocus = document.activeElement && p.contains(document.activeElement) ? document.activeElement.dataset.vi : null;
  let html = '<div class="bd-fig-head"><b>' + escHtml(K.title) + '</b><button type="button" class="bd-fig-x" data-fx="close" title="Закрыть">✕</button></div>';
  const names = f.k === 'circle' ? ['Центр'] : FG_LETTERS.slice(0, K.n).split('');
  html += '<div class="bd-fig-row"><span class="bd-fig-cap">' + (f.k === 'circle' ? 'Центр' : 'Вершины') + '</span><div class="bd-fig-names">';
  names.forEach((_, i) => {
    html += '<input type="text" maxlength="4" spellcheck="false" data-vi="' + i + '" value="' + escHtml((f.lab && f.lab[i]) || '') + '">';
  });
  html += '</div></div><div class="bd-fig-chips">';
  const chip = (key, title, on) => '<button type="button" class="bd-fig-chip' + (on ? ' on' : '') + '" data-fk="' + key + '">' + title + '</button>';
  K.el.forEach(key => {
    if (key === 'h' || key === 'm' || key === 'b' || key === 'mid') return;
    if (key === 'ticks' && !K.ticks) return;
    if (key === 'arcs' && !K.arcs) return;
    if (key === 'right' && !K.right) return;
    const on = key === 'lab' || key === 'right' ? sh[key] !== false : !!sh[key];
    html += chip(key, FG_EL_TITLES[key], on);
  });
  if (K.n === 4 && K.el.includes('h')) html += chip('h', f.k === 'trap-right' ? 'Высота из C' : 'Высота из B', !!sh.h);
  if (K.n === 4 && K.el.includes('mid')) html += chip('mid', 'Средняя линия', !!sh.mid);
  html += '</div>';
  if (K.n === 3){
    const L = i => fgPrettyName((f.lab && f.lab[i]) || FG_LETTERS[i]);
    const rows = [['h', 'Высота'], ['m', 'Медиана'], ['b', 'Биссектриса']];
    rows.forEach(([key, title]) => {
      html += '<div class="bd-fig-row"><span class="bd-fig-cap">' + title + '</span><div class="bd-fig-chips">';
      for (let i = 0; i < 3; i++) html += '<button type="button" class="bd-fig-chip' + ((sh[key] || []).includes(i) ? ' on' : '') + '" data-fa="' + key + '" data-fi="' + i + '">из ' + escHtml(L(i)) + '</button>';
      html += '</div></div>';
    });
    html += '<div class="bd-fig-row"><span class="bd-fig-cap">Средняя линия</span><div class="bd-fig-chips">';
    for (let sI = 0; sI < 3; sI++){
      html += '<button type="button" class="bd-fig-chip' + ((sh.mid || []).includes(sI) ? ' on' : '') + '" data-fa="mid" data-fi="' + sI + '">∥ ' + escHtml(L(sI) + L((sI + 1) % 3)) + '</button>';
    }
    html += '</div></div>';
  }
  if ((f.k === 'trap-iso' || f.k === 'trap-right') && sh.in){
    html += '<div class="bd-fig-note">С вписанной окружностью верхнее основание подстраивается само: суммы противоположных сторон равны.</div>';
  }
  p.innerHTML = html;
  if (keepFocus != null){
    const inp = p.querySelector('input[data-vi="' + keepFocus + '"]');
    if (inp){ inp.focus(); const L = inp.value.length; inp.setSelectionRange(L, L); }
  }
}
function figOpenPanel(id){
  const p = fgPanelEl();
  if (!p) return;
  fgPanelFor = id;
  p.classList.add('open');
  figRenderPanel();
  const obj = figPanelObj();
  if (obj) fgPlacePanel(obj);
}
// ядро сообщает о смене выделения: панель живёт, пока выделена её фигура
function figOnSelection(sel){
  const one = sel && sel.length === 1 && (sel[0].fig || sel[0].solid) ? sel[0] : null;
  const btn = document.getElementById('bdCtxFig');
  if (btn){
    btn.style.display = one ? '' : 'none';
    btn.textContent = one && one.solid ? 'Подписи и вид…' : 'Элементы фигуры…';
  }
  if (fgPanelFor && (!one || one.id !== fgPanelFor)) figClosePanel();
  else if (fgPanelFor) fgPlacePanel(one);
}
/* Панель — сбоку от фигуры, чтобы не закрывать ни её, ни меню выделения
   (оно справа от фигуры): сначала пробуем слева от фигуры, потом справа
   от меню, иначе — в правом верхнем углу. На телефоне — снизу (CSS) */
function fgPlacePanel(obj){
  const p = fgPanelEl();
  if (!p || !obj || !p.classList.contains('open')) return;
  if (window.innerWidth <= 600){ p.style.left = ''; p.style.top = ''; p.style.right = ''; return; }
  const bb = objectBBox(obj), z = cam.zoom;
  const x0 = (bb.minX - cam.x) * z + boardInset, x1 = (bb.maxX - cam.x) * z + boardInset;
  const y0 = (bb.minY - cam.y) * z;
  const pw = p.offsetWidth || 330, ph = p.offsetHeight || 300, W = window.innerWidth, H = window.innerHeight;
  const menu = document.getElementById('bdCtxMenu');
  const mr = menu && menu.classList.contains('open') ? menu.getBoundingClientRect() : null;
  const minL = boardInset + 76;
  let left = null;
  const menuRight = !mr || mr.left > x1 - 4;
  if (menuRight){
    // меню справа — панель слева от фигуры; если места мало, прижимаем к
    // левой колонке: лучше чуть задеть край фигуры, чем закрыть меню
    left = Math.max(minL, x0 - 24 - pw);
    if (left + pw > x0 + (x1 - x0) * 0.35) left = (mr && mr.right + 10 + pw <= W - 8) ? mr.right + 10 : null;
  } else {
    left = Math.min(W - 8 - pw, x1 + 24);
    if (left < x1 - (x1 - x0) * 0.35) left = null;
  }
  if (left == null){ p.style.left = ''; p.style.right = '12px'; p.style.top = '62px'; return; }
  p.style.right = 'auto';
  p.style.left = Math.round(left) + 'px';
  p.style.top = Math.round(Math.max(62, Math.min(H - ph - 90, y0))) + 'px';
}

(function fgWire(){
  const btn = document.getElementById('figBtn');
  if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); figToggleMenu(); });
  const menu = fgMenuEl();
  if (menu){
    menu.addEventListener('click', (e) => {
      const tab = e.target.closest('.bd-fig-tab');
      if (tab){ fgMenuTab = tab.dataset.tab; fgRenderMenu(); fgPlaceMenu(); if (fgMenuTab === 'solid' && typeof window.figEnsureSolids === 'function') window.figEnsureSolids().then(() => { if (fgMenuTab === 'solid'){ fgRenderMenu(); fgPlaceMenu(); } }); return; }
      const it = e.target.closest('.bd-fig-item');
      if (it && it.dataset.fig){ figInsert(it.dataset.fig); return; }
      if (it && it.dataset.solid && typeof window.figInsertSolid === 'function'){ window.figInsertSolid(it.dataset.solid); figCloseMenu(); return; }
      if (e.target.closest('#bdFig3dBtn') && typeof window.figOpenConstructor === 'function'){ figCloseMenu(); window.figOpenConstructor(null); }
    });
  }
  // клик мимо меню закрывает его — как любое всплывающее меню
  document.addEventListener('pointerdown', (e) => {
    if (!figMenuOpen()) return;
    if (e.target.closest('#bdFigMenu') || e.target.closest('#figBtn')) return;
    figCloseMenu();
  }, true);
  window.addEventListener('resize', () => { if (figMenuOpen()) fgPlaceMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && figMenuOpen()) figCloseMenu(); });

  const panel = fgPanelEl();
  if (panel){
    panel.addEventListener('click', (e) => {
      if (e.target.closest('[data-fx="close"]')){ figClosePanel(); return; }
      const ch = e.target.closest('.bd-fig-chip');
      if (!ch) return;
      if (ch.dataset.fa){
        const key = ch.dataset.fa, i = +ch.dataset.fi;
        fgChange(o => { o.fig.sh[key] = fgToggleIn(o.fig.sh[key], i); });
        return;
      }
      const key = ch.dataset.fk;
      if (!key) return;
      fgChange(o => {
        const sh = o.fig.sh;
        if (key === 'lab' || key === 'right') sh[key] = sh[key] === false;
        else sh[key] = !sh[key];
        // вписанная окружность в трапецию — подгоняем форму сразу, а не
        // только при следующем движении вершины
        if (key === 'in' && sh.in){
          if (o.fig.k === 'trap-iso') fgTangentialIso(o.points);
          if (o.fig.k === 'trap-right') fgTangentialRight(o.points);
        }
      });
    });
    let undoArmed = false;
    panel.addEventListener('focusin', (e) => { if (e.target.matches('input[data-vi]')) undoArmed = false; });
    panel.addEventListener('input', (e) => {
      const inp = e.target.closest('input[data-vi]');
      if (!inp) return;
      const obj = figPanelObj();
      if (!obj || !mayTouch(obj)) return;
      if (!undoArmed){ pushUndo(); undoArmed = true; }
      const lab = (obj.fig.lab || []).slice();
      lab[+inp.dataset.vi] = inp.value.trim();
      obj.fig.lab = lab;
      saveDB(); scheduleRedraw();
    });
    panel.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === 'Escape') e.target.blur(); });
    // панель над холстом: клики по ней не должны доходить до доски
    panel.addEventListener('pointerdown', (e) => e.stopPropagation());
  }
})();


/* ═══════════════════════════════════════════════════════════════════════
   Этап 2 — тела. На доске тело — 'poly' с полем solid (сцена, см.
   solids-geom.js) и points — четыре угла рамки [лв, пв, пн, лн]. Чертёж
   вписывается в рамку с сохранением пропорций; рамку двигают как любую
   фигуру и тянут за углы (масштаб без искажений). Форму тела на доске не
   меняют — для этого конструктор.
   ═══════════════════════════════════════════════════════════════════════ */
let fgSolidsPromise = null;
function figLoadScript(src){
  return new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src; el.async = true;
    el.onload = () => resolve(); el.onerror = () => reject(new Error('не загрузился ' + src));
    document.head.appendChild(el);
  });
}
// модуль тел грузится один раз и только по требованию: на доске без тел
// он не нужен вовсе
window.figEnsureSolids = function(){
  if (window.Solids) return Promise.resolve();
  if (!fgSolidsPromise){
    fgSolidsPromise = figLoadScript('solids-geom.js').then(() => { scheduleRedraw(); if (typeof rfScheduleRedraw === 'function') rfScheduleRedraw(); })
      .catch(err => { fgSolidsPromise = null; throw err; });
  }
  return fgSolidsPromise;
};

function fgSolidRect(obj){
  const p = obj.points;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  p.forEach(q => { minX = Math.min(minX, q.x); minY = Math.min(minY, q.y); maxX = Math.max(maxX, q.x); maxY = Math.max(maxY, q.y); });
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}
function fgSetSolidRect(obj, x, y, w, h){
  obj.points = [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }];
}
function fgSolidAspect(scene){
  const d = window.Solids.drawCached(scene), b = d.box;
  return Math.max(0.2, Math.min(5, (b.maxY - b.minY) / Math.max(1e-6, b.maxX - b.minX)));
}
// сцена поменялась (подписи, вид, построения) — рамка подстраивается под
// новые пропорции, сохраняя ширину и центр
function figFitSolidRect(obj){
  if (!window.Solids) return;
  const r = fgSolidRect(obj), k = fgSolidAspect(obj.solid);
  const cx = r.minX + r.w / 2, cy = r.minY + r.h / 2;
  let w = r.w, h = w * k;
  // не даём телу вырасти вдвое по высоте из-за подписи — держим площадь
  const area = r.w * r.h;
  if (h * w > area * 1.6){ w = Math.sqrt(area / k); h = w * k; }
  fgSetSolidRect(obj, cx - w / 2, cy - h / 2, w, h);
}

function figRenderSolid(c, obj, camv){
  const r = fgSolidRect(obj);
  const p0 = worldToScreen({ x: r.minX, y: r.minY }), W = r.w * camv.zoom, H = r.h * camv.zoom;
  const color = resolveColor(obj.color);
  c.save();
  if (obj.opacity != null) c.globalAlpha = obj.opacity;
  if (!window.Solids){
    window.figEnsureSolids().catch(() => {});
    c.strokeStyle = color; c.globalAlpha = 0.35; c.setLineDash([6, 5]); c.lineWidth = 1;
    c.strokeRect(p0.x, p0.y, W, H);
    c.fillStyle = color; c.font = '13px ' + UI_FONT_FAMILY; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('Загрузка…', p0.x + W / 2, p0.y + H / 2);
    c.restore();
    return;
  }
  const d = window.Solids.drawCached(obj.solid), b = d.box;
  const bw = Math.max(1e-6, b.maxX - b.minX), bh = Math.max(1e-6, b.maxY - b.minY);
  const s = Math.min(W / bw, H / bh);
  const cx = p0.x + W / 2, cy = p0.y + H / 2, mx = (b.minX + b.maxX) / 2, my = (b.minY + b.maxY) / 2;
  const toS = (q) => ({ x: cx + (q.x - mx) * s, y: cy - (q.y - my) * s });
  const opt = obj.solid.opt || {};
  window.Solids.paint(c, d, toS, s, {
    lw: Math.max(0.5, obj.width || 2) * camv.zoom, color, secColor: resolveColor('--ink'),
    hid: opt.hid !== false, font: UI_FONT_FAMILY,
  });
  c.restore();
}

function figSolidHandles(obj){
  const r = fgSolidRect(obj);
  return [{ role: 'snw', x: r.minX, y: r.minY }, { role: 'sne', x: r.maxX, y: r.minY },
          { role: 'sse', x: r.maxX, y: r.maxY }, { role: 'ssw', x: r.minX, y: r.maxY }];
}
function figSolidApplyHandle(obj, role, pt){
  const r = fgSolidRect(obj);
  const anchors = { sse: { x: r.minX, y: r.minY }, ssw: { x: r.maxX, y: r.minY }, sne: { x: r.minX, y: r.maxY }, snw: { x: r.maxX, y: r.maxY } };
  const A = anchors[role];
  if (!A) return true;
  const k = r.h / Math.max(1e-6, r.w);
  // как у картинки: пропорции сохраняются, тянуть — по ширине; протянули за
  // противоположный угол — упираемся в минимум, а не выворачиваемся
  const dx = (role === 'sse' || role === 'sne') ? pt.x - A.x : A.x - pt.x;
  const w = Math.max(40, dx), h = w * k;
  const x0 = (role === 'sse' || role === 'sne') ? A.x : A.x - w;
  const y0 = (role === 'sse' || role === 'ssw') ? A.y : A.y - h;
  fgSetSolidRect(obj, x0, y0, w, h);
  return true;
}
function figSolidDrawSelection(c, obj, camv){
  void camv;
  const r = fgSolidRect(obj), a = worldToScreen({ x: r.minX, y: r.minY }), b = worldToScreen({ x: r.maxX, y: r.maxY });
  c.save();
  c.strokeStyle = themeVar('--ink'); c.lineWidth = 1; c.setLineDash([5, 3]); c.globalAlpha = 0.7;
  c.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
  c.globalAlpha = 1; c.setLineDash([]);
  c.fillStyle = themeVar('--ink'); c.strokeStyle = '#fff'; c.lineWidth = 1.5;
  [[a.x, a.y], [b.x, a.y], [b.x, b.y], [a.x, b.y]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill(); c.stroke(); });
  c.restore();
  return true;
}

// иконка тела для меню — тот же чертёж в маленьком холсте
function fgSolidIcon(menuId){
  const cv = document.createElement('canvas');
  const S = 46, dpr = Math.max(1, window.devicePixelRatio || 1);
  cv.width = S * dpr; cv.height = S * dpr; cv.style.width = S + 'px'; cv.style.height = S + 'px';
  const c = cv.getContext('2d');
  c.scale(dpr, dpr);
  const scene = window.Solids.newScene(menuId);
  scene.opt = { lab: false, axis: false };
  const d = window.Solids.drawCached(scene), b = d.box;
  const s = Math.min((S - 8) / (b.maxX - b.minX), (S - 8) / (b.maxY - b.minY));
  const mx = (b.minX + b.maxX) / 2, my = (b.minY + b.maxY) / 2;
  window.Solids.paint(c, d, q => ({ x: S / 2 + (q.x - mx) * s, y: S / 2 - (q.y - my) * s }), s,
    { lw: 1.25, color: resolveColor('--pencil'), hid: true });
  return cv;
}
window.figRenderSolidItems = function(grid){
  if (!window.Solids){ grid.innerHTML = '<div class="bd-fig-empty">Загружаем…</div>'; return; }
  window.Solids.MENU.forEach(m => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'bd-fig-item'; b.dataset.solid = m.id; b.title = m.title;
    b.appendChild(fgSolidIcon(m.id));
    const s = document.createElement('span'); s.textContent = m.short || m.title; b.appendChild(s);
    grid.appendChild(b);
  });
};
// тело на доску: сцена + рамка нужных пропорций в центре видимой части
function figPlaceSolid(scene, obj){
  const sp = figSpot(), k = fgSolidAspect(scene);
  let w = sp.s * 1.05, h = w * k;
  if (h > sp.s * 1.15){ h = sp.s * 1.15; w = h / k; }
  obj.solid = scene;
  fgSetSolidRect(obj, sp.c.x - w / 2, sp.c.y - h / 2, w, h);
  return obj;
}
window.figInsertSolid = function(menuId){
  if (!B || !mayDraw() || !window.Solids) return null;
  const obj = newBase('poly');
  delete obj.fill;
  figPlaceSolid(window.Solids.newScene(menuId), obj);
  commitObject(obj);
  figCloseMenu();
  figSelectNew(obj);
  if (window.innerWidth > 600) figOpenPanel(obj.id);
  return obj;
};

/* панель тела: имена вершин и точек, что показывать, вход в конструктор */
window.figRenderSolidPanel = function(p, obj){
  const sc = obj.solid;
  if (!window.Solids){
    p.innerHTML = '<div class="bd-fig-head"><b>Тело</b><button type="button" class="bd-fig-x" data-fx="close">✕</button></div><div class="bd-fig-note">Загружаем…</div>';
    window.figEnsureSolids().then(() => { if (fgPanelFor === obj.id) figRenderPanel(); });
    return;
  }
  const keepFocus = document.activeElement && p.contains(document.activeElement) ? document.activeElement.dataset.sid : null;
  const S = window.Solids, K = S.KINDS[sc.k] || {};
  const M = S.buildMesh(sc.k, sc.p), R = S.resolvePoints(M, sc);
  let title = K.title || 'Тело';
  if (sc.k === 'prism' || sc.k === 'pyr' || sc.k === 'fpyr'){
    const nn = { 3: 'треугольная', 4: 'четырёхугольная', 5: 'пятиугольная', 6: 'шестиугольная' }[sc.p.n];
    if (nn) title = (sc.k === 'fpyr' ? 'Усечённая ' : 'Правильная ') + nn + (sc.k === 'prism' ? ' призма' : ' пирамида');
  }
  let html = '<div class="bd-fig-head"><b>' + escHtml(title) + '</b><button type="button" class="bd-fig-x" data-fx="close" title="Закрыть">✕</button></div>';
  const ids = [];
  M.names.forEach((n, i) => { if (n) ids.push('v' + i); });
  (sc.pts || []).forEach(pt => ids.push(pt.id));
  html += '<div class="bd-fig-row"><span class="bd-fig-cap">Подписи точек</span><div class="bd-fig-names">';
  ids.forEach(id => {
    html += '<input type="text" maxlength="4" spellcheck="false" data-sid="' + id + '" value="' + escHtml(R.names[id] || '') + '">';
  });
  html += '</div></div><div class="bd-fig-chips">';
  const opt = sc.opt || {};
  const chip = (key, t, on) => '<button type="button" class="bd-fig-chip' + (on ? ' on' : '') + '" data-so="' + key + '">' + t + '</button>';
  html += chip('lab', 'Подписи', opt.lab !== false);
  html += chip('hid', 'Невидимые линии', opt.hid !== false);
  if (M.axis) html += chip('axis', sc.k === 'pyr' ? 'Высота' : 'Ось и центры', opt.axis !== false);
  if (sc.k === 'sphere') html += chip('eq', 'Экватор', opt.eq !== false);
  if ((sc.planes || []).length) html += chip('planes', 'Плоскости', opt.planes !== false);
  html += '</div>';
  if (typeof window.figOpenConstructor === 'function'){
    html += '<button type="button" class="bd-fig-btn" data-fx="open3d">Открыть в 3D-конструкторе</button>';
  }
  p.innerHTML = html;
  if (keepFocus != null){
    const inp = p.querySelector('input[data-sid="' + keepFocus + '"]');
    if (inp){ inp.focus(); const L = inp.value.length; inp.setSelectionRange(L, L); }
  }
};

(function fgWireSolids(){
  const panel = fgPanelEl();
  if (!panel) return;
  panel.addEventListener('click', (e) => {
    const so = e.target.closest('[data-so]');
    if (so){
      const key = so.dataset.so;
      fgChange(o => {
        if (!o.solid) return;
        const opt = Object.assign({}, o.solid.opt || {});
        opt[key] = opt[key] === false;
        if (opt[key]) delete opt[key];   // по умолчанию всё включено — храним только выключенное
        o.solid.opt = opt;
        figFitSolidRect(o);
      });
      return;
    }
    if (e.target.closest('[data-fx="open3d"]') && typeof window.figOpenConstructor === 'function'){
      const obj = figPanelObj();
      if (obj && obj.solid) window.figOpenConstructor(obj.id);
    }
  });
  let undoArmed = false;
  panel.addEventListener('focusin', (e) => { if (e.target.matches('input[data-sid]')) undoArmed = false; });
  panel.addEventListener('input', (e) => {
    const inp = e.target.closest('input[data-sid]');
    if (!inp) return;
    const obj = figPanelObj();
    if (!obj || !obj.solid || !mayTouch(obj)) return;
    if (!undoArmed){ pushUndo(); undoArmed = true; }
    const id = inp.dataset.sid, val = inp.value.trim();
    const sc = obj.solid;
    if (id[0] === 'p'){
      sc.pts = (sc.pts || []).map(pt => pt.id === id ? Object.assign({}, pt, { name: val }) : pt);
    } else {
      sc.nm = Object.assign({}, sc.nm || {}, { [id]: val });
    }
    saveDB(); scheduleRedraw();
  });
})();

/* ═══ этап 3: 3D-конструктор — отдельный файл, грузится при первом открытии ═══ */
let fg3dPromise = null;
function figEnsureConstructor(){
  if (window.Solids3D) return Promise.resolve();
  if (!fg3dPromise){
    fg3dPromise = window.figEnsureSolids().then(() => figLoadScript('solid3d.js'))
      .catch(err => { fg3dPromise = null; throw err; });
  }
  return fg3dPromise;
}
// objId — тело на доске, которое достраиваем; null — новое
window.figOpenConstructor = function(objId){
  if (!mayDraw() && !window.__boardViewer) return Promise.resolve();
  return figEnsureConstructor().then(() => {
    const obj = objId && B ? B.objects.find(o => o.id === objId && o.solid) : null;
    figClosePanel();
    window.Solids3D.open(obj ? { scene: obj.solid, objId: obj.id } : {});
  });
};
// двойной щелчок по телу на доске — сразу в конструктор
(function fgWireDbl(){
  const cv = document.getElementById('boardCv');
  if (!cv) return;
  cv.addEventListener('dblclick', (e) => {
    if (!B || !mayDraw() || (tool !== 'select' && tool !== 'hand')) return;
    const r = cv.getBoundingClientRect(), pt = screenToWorld(e.clientX - r.left, e.clientY - r.top);
    for (let i = B.objects.length - 1; i >= 0; i--){
      const o = B.objects[i];
      if (hitTestObject(o, pt, 8 / cam.zoom)){
        if (o.solid){ e.preventDefault(); window.figOpenConstructor(o.id); }
        return;
      }
    }
  });
})();
// ученик в совместной сессии видит конструктор учителя (только смотреть)
window.addEventListener('load', () => {
  const TS = window.TrainerSession;
  if (!window.__boardViewer || !TS || !TS.onEvent) return;
  TS.onEvent('s3d', (d) => {
    if (!d) return;
    if (!d.o && !window.Solids3D) return;
    figEnsureConstructor().then(() => window.Solids3D.viewerApply(d)).catch(() => {});
  });
});
