/* Жидкое стекло Mathh — режимы «обычный» / «максимум» и живые эффекты.
 *
 * Подключается в <head> обычным <script src> ДО стилей страницы не обязательно,
 * но до первого кадра: атрибут data-fx ставится сразу, иначе при выбранном
 * «максимуме» страница сначала мигнула бы обычным стеклом.
 *
 * Выбор режима хранится на КАЖДОМ устройстве отдельно (localStorage
 * 'mathh-fx'): режим — это про мощность конкретного компьютера или телефона,
 * а не про ученика. По умолчанию — «обычный».
 *
 * Что делает «максимум» (стили — в liquid-glass.css):
 *   — преломление фона под стеклом (.lg-r): для каждого элемента строится
 *     карта искажения под его размер и форму; работает только в Chromium
 *     (Chrome, Edge, Яндекс) — Safari и Firefox не умеют SVG-фильтр в
 *     backdrop-filter, там остаётся обычное размытие;
 *   — увеличение кнопок под курсором (.lg-mag), как Dock на Mac;
 *   — упругое нажатие со вспышкой света (.lg-btn и .lg-press);
 *   — блик за курсором (.lg и .lg-s);
 *   — медленно плавающая подсветка фона.
 * Пока на странице рисуют на <canvas>, преломление выключается (класс
 * lg-paused на <html>) — оно пересчитывается каждый кадр и на слабом
 * устройстве может мешать рисовать.
 *
 * API: MathhGlass.mode() → 'lite' | 'full'; MathhGlass.set(m); MathhGlass.toggle();
 *      MathhGlass.onChange(fn); MathhGlass.refract(элементы|селектор) — пометить
 *      дополнительные стеклянные панели страницы для преломления;
 *      MathhGlass.autoRefract(селектор) — то же для панелей, которые страница
 *      создаёт и пересоздаёт сама; MathhGlass.pressable(селектор) — добавить
 *      кнопкам страницы упругое нажатие; MathhGlass.tips(селектор, 'left'|'right') —
 *      название кнопки стеклянной плашкой при наведении; MathhGlass.floatTips —
 *      то же для кнопок в прокручиваемых панелях; MathhGlass.liquidSelect —
 *      выделение выбранной кнопки, перетекающее каплей; MathhGlass.genie(окно,
 *      кнопка, открытие?) — окно вытекает из кнопки и втягивается обратно.
 */
(function () {
  'use strict';
  if (window.MathhGlass) return;
  var KEY = 'mathh-fx';
  var root = document.documentElement;
  var listeners = [];

  function read() { try { return localStorage.getItem(KEY) === 'full' ? 'full' : 'lite'; } catch (e) { return 'lite'; } }
  function applyAttr(m) { if (m === 'full') root.setAttribute('data-fx', 'full'); else root.removeAttribute('data-fx'); }
  var cur = read();
  applyAttr(cur);

  // Chromium — единственный движок, который рисует SVG-фильтр в backdrop-filter.
  // На iPhone любой браузер — это WebKit, userAgentData там нет, и мы честно
  // остаёмся без преломления
  var canRefract = !!(navigator.userAgentData && navigator.userAgentData.brands &&
    navigator.userAgentData.brands.some(function (b) { return /Chromium/i.test(b.brand); }));
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

  function set(m) {
    m = m === 'full' ? 'full' : 'lite';
    if (m === cur) return;
    cur = m;
    try { localStorage.setItem(KEY, m); } catch (e) {}
    applyAttr(m);
    sync();
    listeners.forEach(function (fn) { try { fn(m); } catch (e) {} });
  }
  // другая вкладка того же устройства переключила режим — подхватываем
  window.addEventListener('storage', function (e) {
    if (e.key !== KEY) return;
    var m = read(); if (m === cur) return;
    cur = m; applyAttr(m); sync();
    listeners.forEach(function (fn) { try { fn(m); } catch (err) {} });
  });

  /* ── преломление ───────────────────────────────────────────────────── */
  var NS = 'http://www.w3.org/2000/svg';
  var defs = null, uid = 0;
  var tracked = new Set();          // элементы с .lg-r
  var ro = null;

  function ensureDefs() {
    if (defs) return defs;
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    defs = document.createElementNS(NS, 'defs');
    svg.appendChild(defs);
    document.body.appendChild(svg);
    return defs;
  }

  function radiusOf(el, w, h) {
    var r = getComputedStyle(el).borderTopLeftRadius || '0';
    var v = parseFloat(r) || 0;
    if (/%$/.test(r)) v = Math.min(w, h) * v / 100;
    return Math.min(v, Math.min(w, h) / 2);
  }

  // Карта искажения: у края стекла фон растягивается и изгибается, как в
  // выпуклой линзе, а середина остаётся чистой. Направление — нормаль к краю
  // скруглённого прямоугольника (через функцию расстояния до границы), сила
  // плавно спадает к центру. R и G хранят сдвиг по x и y вокруг 128.
  function buildMap(w, h, r, band) {
    var cw = Math.max(8, Math.min(Math.round(w), 220)), ch = Math.max(8, Math.min(Math.round(h), 220));
    var cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    var ctx = cv.getContext('2d'); var img = ctx.createImageData(cw, ch); var d = img.data;
    var hx = w / 2, hy = h / 2, ix = hx - r, iy = hy - r;
    for (var j = 0; j < ch; j++) {
      var py = (j + 0.5) * h / ch - hy;
      for (var i = 0; i < cw; i++) {
        var px = (i + 0.5) * w / cw - hx;
        var ax = Math.abs(px), ay = Math.abs(py);
        var qx = ax - ix, qy = ay - iy, nx, ny, dist;
        if (qx > 0 && qy > 0) { var L = Math.hypot(qx, qy) || 1; nx = qx / L; ny = qy / L; dist = L - r; }
        else if (qx > qy) { nx = 1; ny = 0; dist = qx - r; }
        else { nx = 0; ny = 1; dist = qy - r; }
        var depth = -dist, m = depth < band ? Math.pow(1 - Math.max(depth, 0) / band, 2) : 0;
        nx *= px < 0 ? -1 : 1; ny *= py < 0 ? -1 : 1;
        var k = (j * cw + i) * 4;
        // минус: берём пиксели ближе к центру — у края фон растягивается, как в
        // линзе. Наружу брать нельзя: за границей элемента у backdrop-filter
        // нет фона, и по краю стекла шла бы белая полоса
        d[k] = 128 - nx * m * 127; d[k + 1] = 128 - ny * m * 127; d[k + 2] = 128; d[k + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return cv.toDataURL();
  }

  // Фильтр задаётся в долях элемента (objectBoundingBox), а не в пикселях:
  // тогда он сам растягивается вслед за элементом. Это важно для капсул —
  // при наведении кнопки растут, капсула растёт вместе с ними, и преломление
  // не должно ни пропадать, ни съезжать. Точную карту под новый размер
  // строим, когда размер успокоится (см. ResizeObserver ниже)
  function buildFilter(el) {
    var rect = el.getBoundingClientRect();
    var w = Math.round(rect.width), h = Math.round(rect.height);
    if (w < 4 || h < 4) return;
    if (el._lgSize === w + 'x' + h) { el.classList.add('lg-r-ready'); return; }
    el._lgSize = w + 'x' + h;
    var r = radiusOf(el, w, h);
    var small = Math.max(w, h) <= 180;
    // маленьким кнопкам и капсулам — сильнее и с радужным краем (каналы
    // смещаются чуть по-разному); большим панелям — мягче, чтобы текст читался
    var band = small ? Math.min(w, h) * 0.42 : Math.min(30, Math.min(w, h) * 0.3);
    var px = small ? 22 : 34;
    // в долях элемента сдвиг по x считается от ширины, по y — от высоты;
    // делим на среднее, чтобы сила в пикселях была примерно как задумано
    var scale = px / Math.sqrt(w * h);
    var blur = small ? 1.2 : 2;
    var map = buildMap(w, h, r, band);
    var id = 'lgf' + (++uid);
    var f = document.createElementNS(NS, 'filter');
    f.setAttribute('id', id);
    f.setAttribute('x', '0'); f.setAttribute('y', '0'); f.setAttribute('width', '1'); f.setAttribute('height', '1');
    f.setAttribute('filterUnits', 'objectBoundingBox'); f.setAttribute('primitiveUnits', 'objectBoundingBox');
    f.setAttribute('color-interpolation-filters', 'sRGB');
    // размытие — внутри фильтра, первым шагом: если писать его в CSS перед
    // url(), Chrome расширяет область под размытие и карта съезжает от края
    var inner = '<feGaussianBlur in="SourceGraphic" stdDeviation="' + (blur / w).toFixed(5) + ' ' + (blur / h).toFixed(5) + '" result="soft"/>' +
      '<feImage href="' + map + '" x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="map"/>';
    var dm = function (k, res) {
      return '<feDisplacementMap in="soft" in2="map" scale="' + (scale * k).toFixed(5) + '" xChannelSelector="R" yChannelSelector="G"' + (res ? ' result="' + res + '"' : '') + '/>';
    };
    if (small) {
      inner += dm(1, 'dr') + '<feColorMatrix in="dr" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="cr"/>' +
        dm(1.1, 'dg') + '<feColorMatrix in="dg" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="cg"/>' +
        dm(1.2, 'db') + '<feColorMatrix in="db" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="cb"/>' +
        '<feBlend in="cr" in2="cg" mode="screen" result="rg"/><feBlend in="rg" in2="cb" mode="screen"/>';
    } else {
      inner += dm(1);
    }
    f.innerHTML = inner;
    // Карту сначала раскодируем и только потом подменяем фильтр: пока
    // картинка не готова, Chrome считает её пустой, и стекло на один кадр
    // дёрнулось бы в сторону
    var swap = function () {
      if (!el.isConnected) return;
      ensureDefs().appendChild(f);
      el.style.setProperty('--lg-refract', 'url(#' + id + ')');
      el.classList.add('lg-r-ready');
      var old = el._lgId && document.getElementById(el._lgId);
      el._lgId = id;
      if (old) requestAnimationFrame(function () { old.remove(); });
    };
    var img = new Image();
    img.src = map;
    if (img.decode) img.decode().then(swap, swap); else img.onload = swap;
  }

  function refreshRefraction() {
    var on = cur === 'full' && canRefract;
    tracked.forEach(function (el) {
      if (!el.isConnected) { tracked.delete(el); return; }
      if (on) buildFilter(el);
      else el.classList.remove('lg-r-ready');
    });
  }
  function watch(el) {
    if (tracked.has(el)) return;
    tracked.add(el);
    if (!ro && window.ResizeObserver) {
      // Фильтр в долях элемента и так тянется вслед за размером; точную
      // карту (радиус скругления, ширина края) строим заново, когда размер
      // успокоится — строить её на каждом кадре анимации незачем
      ro = new ResizeObserver(function (entries) {
        if (cur !== 'full' || !canRefract) return;
        entries.forEach(function (e) {
          var el = e.target;
          if (!el._lgSize) { buildFilter(el); return; }
          var r = el.getBoundingClientRect();
          if (el._lgSize === Math.round(r.width) + 'x' + Math.round(r.height)) return;
          clearTimeout(el._lgT);
          el._lgT = setTimeout(function () { el._lgSize = ''; if (cur === 'full') buildFilter(el); }, 160);
        });
      });
    }
    if (ro) ro.observe(el);
    if (cur === 'full' && canRefract) buildFilter(el);
  }
  function refract(target) {
    var list = typeof target === 'string' ? document.querySelectorAll(target) : (target.length != null ? target : [target]);
    Array.prototype.forEach.call(list, function (el) { el.classList.add('lg-r'); watch(el); });
  }
  function scanRefract() { document.querySelectorAll('.lg-r').forEach(watch); }

  // Панели, которые страница перерисовывает сама (список тем на главной
  // меняется при каждом переключении вкладки), — следим за появлением новых.
  // Им же даём блик за курсором (.lg-s); слою блика нужен position:relative,
  // иначе он прилип бы к чужому предку
  var autoSel = [], autoMo = null, autoRaf = 0;
  function autoScan() {
    autoRaf = 0;
    if (!autoSel.length) return;
    document.querySelectorAll(autoSel.join(',')).forEach(function (el) {
      if (tracked.has(el)) return;
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.classList.add('lg-r', 'lg-s');
      watch(el);
    });
  }
  function autoRefract(sel) {
    autoSel.push(sel);
    var run = function () {
      autoScan();
      if (!autoMo) {
        autoMo = new MutationObserver(function () { if (!autoRaf) autoRaf = requestAnimationFrame(autoScan); });
        autoMo.observe(document.body, { childList: true, subtree: true });
      }
    };
    if (document.body) run(); else document.addEventListener('DOMContentLoaded', run);
  }

  /* ── подсказки-названия у кнопок капсул ──────────────────────────────── */
  // Название берётся из aria-label и показывается стеклянной плашкой рядом
  // с кнопкой, когда на неё навели (стили .lg-tip). Системный title убираем:
  // он всплыл бы с задержкой поверх нашей подсказки
  function tips(sel, side) {
    var run = function () {
      document.querySelectorAll(sel).forEach(function (b) {
        if (b.querySelector(':scope > .lg-tip')) return;
        var t = document.createElement('span');
        t.className = 'lg-tip lg' + (side === 'left' ? ' is-left' : '');
        t.setAttribute('aria-hidden', 'true');
        t.textContent = b.getAttribute('aria-label') || b.title || '';
        if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
        b.appendChild(t);
        if (b.title) { b.setAttribute('data-title', b.title); b.removeAttribute('title'); }
      });
    };
    if (document.body) run(); else document.addEventListener('DOMContentLoaded', run);
  }

  /* ── «жидкое» выделение: капля, перетекающая к выбранной кнопке ──────── */
  // В «максимуме» подсветка выбранного инструмента — отдельная капля под
  // кнопками. При смене инструмента она не перескакивает, а перетекает к
  // новому: едет на пружине и вытягивается по ходу движения, как капля
  // жидкости. Кнопки сами по-прежнему получают свой класс выбора — капля
  // только следит за ним, поэтому код страницы менять не нужно
  var pills = [], pillRaf = 0, pillLast = 0;
  var PK = 260, PC = 2 * Math.sqrt(260) * 0.82;   // чуть недодемпфирована — лёгкий «плюх» в конце
  function liquidSelect(cont, itemSel, activeClass) {
    if (!cont || cont._lgPill) return;
    activeClass = activeClass || 'active';
    var pill = document.createElement('span');
    pill.className = 'lg-pill'; pill.setAttribute('aria-hidden', 'true');
    cont.insertBefore(pill, cont.firstChild);
    cont.classList.add('lg-has-pill');
    var P = { cont: cont, pill: pill, sel: itemSel, cls: activeClass, x: 0, y: 0, w: 0, h: 0, vx: 0, vy: 0, vw: 0, vh: 0, placed: false, on: false };
    cont._lgPill = P;
    pills.push(P);
    new MutationObserver(kickPills).observe(cont, { attributes: true, attributeFilter: ['class'], subtree: true, childList: true });
    // панель могла быть скрыта, когда её размечали (доска ещё не открыта) —
    // капля встанет на место, как только у панели появится размер
    if (window.ResizeObserver) new ResizeObserver(kickPills).observe(cont);
    window.addEventListener('resize', kickPills);
    kickPills();
  }
  function pillTarget(P) {
    var el = P.cont.querySelector(P.sel + '.' + P.cls);
    if (!el || !el.offsetParent) return null;
    // offsetLeft/Top — от самого контейнера и не зависят от его прокрутки:
    // капля лежит внутри него и прокручивается вместе с кнопками
    return { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight,
      r: getComputedStyle(el).borderTopLeftRadius };
  }
  function kickPills() {
    if (!pills.length) return;
    if (!pillRaf) { pillLast = performance.now(); pillRaf = requestAnimationFrame(pillTick); }
  }
  function pillTick(now) {
    pillRaf = 0;
    var dt = Math.min(0.1, Math.max(0.001, (now - pillLast) / 1000)); pillLast = now;
    var n = Math.ceil(dt / 0.008), h = dt / n, busy = false;
    var still = cur !== 'full' || (reduceMotion && reduceMotion.matches);
    pills.forEach(function (P) {
      var T = pillTarget(P);
      P.pill.style.opacity = T ? '1' : '0';
      if (!T) { P.placed = false; return; }
      P.pill.style.borderRadius = T.r;
      if (!P.placed || still) {
        // первый показ и обычный режим — без анимации, сразу на месте
        P.x = T.x; P.y = T.y; P.w = T.w; P.h = T.h; P.vx = P.vy = P.vw = P.vh = 0; P.placed = true;
      } else {
        for (var i = 0; i < n; i++) {
          P.vx += (-PK * (P.x - T.x) - PC * P.vx) * h; P.x += P.vx * h;
          P.vy += (-PK * (P.y - T.y) - PC * P.vy) * h; P.y += P.vy * h;
          P.vw += (-PK * (P.w - T.w) - PC * P.vw) * h; P.w += P.vw * h;
          P.vh += (-PK * (P.h - T.h) - PC * P.vh) * h; P.h += P.vh * h;
        }
        if (Math.abs(P.x - T.x) + Math.abs(P.y - T.y) + Math.abs(P.w - T.w) + Math.abs(P.h - T.h) > 0.3 ||
            Math.abs(P.vx) + Math.abs(P.vy) + Math.abs(P.vw) + Math.abs(P.vh) > 2) busy = true;
        else { P.x = T.x; P.y = T.y; P.w = T.w; P.h = T.h; P.vx = P.vy = P.vw = P.vh = 0; }
      }
      // вытягивание по ходу движения: чем быстрее капля едет, тем она длиннее
      // вдоль пути и тоньше поперёк — и в покое снова круглая
      var sx = 1 + Math.min(Math.abs(P.vx) / 2600, 0.35) - Math.min(Math.abs(P.vy) / 5200, 0.15);
      var sy = 1 + Math.min(Math.abs(P.vy) / 2600, 0.35) - Math.min(Math.abs(P.vx) / 5200, 0.15);
      P.pill.style.width = P.w.toFixed(2) + 'px';
      P.pill.style.height = P.h.toFixed(2) + 'px';
      P.pill.style.transform = 'translate(' + P.x.toFixed(2) + 'px,' + P.y.toFixed(2) + 'px) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')';
    });
    // пока кнопки увеличиваются под курсором, капля следует за размером своей
    if (busy || magState.size) pillRaf = requestAnimationFrame(pillTick);
  }

  /* ── «джинн»: окно вытекает из кнопки, как свёрнутое окно из Dock на Mac ── */
  // Окно на время анимации сжато вдоль оси к кнопке (scale) и обрезано
  // воронкой (clip-path): у кнопки — узкое горлышко высотой с кнопку, дальше
  // плавно расширяется до полного окна. К концу воронка распрямляется.
  // Кнопку перечитываем каждый кадр — она может расти под курсором.
  // opening = true — из кнопки в окно, false — обратно в кнопку.
  function genie(el, anchor, opening, done) {
    if (el._genieRaf) { cancelAnimationFrame(el._genieRaf); el._genieRaf = 0; }
    var finish = function () {
      el._genieRaf = 0;
      el.style.clipPath = ''; el.style.transform = ''; el.style.transformOrigin = ''; el.style.opacity = '';
      if (done) done();
    };
    if (cur !== 'full' || (reduceMotion && reduceMotion.matches) || !anchor) { finish(); return; }
    var DUR = opening ? 560 : 420, t0 = performance.now(), N = 26;
    var ease = function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
    var sm = function (a, b, x) { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); };
    // сбрасываем свои стили, чтобы мерить окно в его настоящем положении
    el.style.transform = ''; el.style.clipPath = '';
    var step = function (now) {
      var k = Math.min(1, (now - t0) / DUR);
      var e = ease(opening ? k : 1 - k);           // 0 — всё в кнопке, 1 — окно открыто
      var r = el.getBoundingClientRect(), a = anchor.getBoundingClientRect();
      var W = el.offsetWidth, H = el.offsetHeight;
      // координаты кнопки в системе окна (без учёта нашего же transform)
      var sx = r.width / W || 1, sy = r.height / H || 1;
      var ox = r.left - (el._gx || 0) * (1 - sx), oy = r.top - (el._gy || 0) * (1 - sy);
      var ax = a.left + a.width / 2 - ox, ay = a.top + a.height / 2 - oy;
      var horiz = ax > W || ax < 0;                // кнопка сбоку от окна — тянемся вдоль x
      var L = horiz ? W : H, C = horiz ? H : W;     // длина вдоль оси и поперёк
      var ac = horiz ? ay : ax, half = (horiz ? a.height : a.width) / 2;
      var atEnd = horiz ? ax > W : ay > H;          // кнопка у дальнего конца оси
      var pinch = Math.pow(1 - e, 0.85);
      var pts = [], i, u, w, lo, hi, pos;
      for (i = 0; i <= N; i++) {
        u = i / N;                                   // 0 — дальний от кнопки край, 1 — у кнопки
        w = pinch * sm(0.05, 1, u);
        lo = (ac - half) * w; pos = (atEnd ? u : 1 - u) * L;
        pts.push(horiz ? [pos, lo] : [lo, pos]);
      }
      for (i = N; i >= 0; i--) {
        u = i / N; w = pinch * sm(0.05, 1, u);
        hi = C + (ac + half - C) * w; pos = (atEnd ? u : 1 - u) * L;
        pts.push(horiz ? [pos, hi] : [hi, pos]);
      }
      el.style.clipPath = 'polygon(' + pts.map(function (p) { return p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px'; }).join(',') + ')';
      var gx = horiz ? (atEnd ? W : 0) : ax, gy = horiz ? ay : (atEnd ? H : 0);
      el._gx = gx; el._gy = gy;
      el.style.transformOrigin = gx + 'px ' + gy + 'px';
      var sc = 0.04 + 0.96 * e;
      el.style.transform = horiz ? 'scaleX(' + sc.toFixed(4) + ')' : 'scaleY(' + sc.toFixed(4) + ')';
      el.style.opacity = Math.min(1, e * 5).toFixed(3);
      if (k < 1) el._genieRaf = requestAnimationFrame(step); else finish();
    };
    el._genieRaf = requestAnimationFrame(step);
  }

  /* ── подсказки над кнопками в прокручиваемых панелях ───────────────────── */
  // Подсказку внутри кнопки (tips) обрезала бы прокрутка панели — док доски
  // прокручивается на узком экране. Поэтому здесь одна общая плашка на
  // странице, прикреплённая к экрану, и её ставим к кнопке под курсором.
  // side(кнопка) говорит, с какой стороны показывать: 'top' | 'left' | 'right'
  var ftip = null, ftipFor = null, ftipStripped = [];
  // opts.fullOnly — только в «максимуме»; в обычном режиме у кнопок остаётся
  // их системная подсказка title, как было
  function floatTips(sel, side, opts) {
    opts = opts || {};
    var run = function () {
      if (!ftip) {
        ftip = document.createElement('div');
        ftip.className = 'lg-ftip lg'; ftip.setAttribute('aria-hidden', 'true');
        document.body.appendChild(ftip);
      }
      var show = function (b) {
        if (opts.fullOnly && cur !== 'full') return;
        var text = b.getAttribute('data-tip') || b.getAttribute('data-title') || b.title || b.getAttribute('aria-label') || '';
        // в title инструментов часто пояснение после тире — в подсказку идёт
        // только название, полный текст остаётся у кнопки в data-title
        text = text.split(' — ')[0];
        if (b.title) { b.setAttribute('data-title', b.title); b.removeAttribute('title'); ftipStripped.push(b); }
        if (!text) return;
        ftipFor = b;
        ftip.textContent = text;
        var sd = (typeof side === 'function' ? side(b) : side) || 'top';
        ftip.setAttribute('data-side', sd);
        placeTip();
        ftip.classList.add('is-on');
      };
      document.addEventListener('pointerover', function (e) {
        if (e.pointerType === 'touch') return;
        var b = e.target.closest && e.target.closest(sel);
        if (b && b !== ftipFor) show(b);
        else if (!b && ftipFor) { ftipFor = null; ftip.classList.remove('is-on'); }
      });
      document.addEventListener('focusin', function (e) { var b = e.target.closest && e.target.closest(sel); if (b && b.matches(':focus-visible')) show(b); });
      document.addEventListener('focusout', function () { ftipFor = null; ftip.classList.remove('is-on'); });
      document.addEventListener('pointerdown', function () { ftipFor = null; ftip.classList.remove('is-on'); }, true);
      // вернулись в обычный режим — возвращаем кнопкам их title
      if (opts.fullOnly) listeners.push(function (m) {
        if (m === 'full') return;
        ftipFor = null; ftip.classList.remove('is-on');
        ftipStripped.forEach(function (b) { if (!b.title && b.getAttribute('data-title')) b.title = b.getAttribute('data-title'); });
        ftipStripped = [];
      });
    };
    if (document.body) run(); else document.addEventListener('DOMContentLoaded', run);
  }
  // кнопка под курсором может расти (увеличение) — подсказка едет за ней
  function placeTip() {
    if (!ftip || !ftipFor) return;
    var r = ftipFor.getBoundingClientRect(), sd = ftip.getAttribute('data-side');
    var x, y;
    if (sd === 'left') { x = r.left - 12; y = r.top + r.height / 2; }
    else if (sd === 'right') { x = r.right + 12; y = r.top + r.height / 2; }
    else { x = r.left + r.width / 2; y = r.top - 10; }
    ftip.style.left = x + 'px'; ftip.style.top = y + 'px';
  }

  /* ── плавающая подсветка ───────────────────────────────────────────── */
  function ensureAmbient() {
    if (document.querySelector('.lg-ambient')) return;
    var a = document.createElement('div');
    a.className = 'lg-ambient'; a.setAttribute('aria-hidden', 'true');
    a.innerHTML = '<i></i><i></i><i></i>';
    document.body.insertBefore(a, document.body.firstChild);
  }

  /* ── увеличение, блик, нажатие ─────────────────────────────────────── */
  var raf = 0, lastEv = null;
  function onMove(e) {
    if (cur !== 'full') return;
    lastEv = e;
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function frame() {
    raf = 0; var e = lastEv; if (!e) return;
    var t = e.target && e.target.closest ? e.target : null;
    // блик: координаты курсора внутри стеклянного элемента
    var s = t && t.closest('.lg, .lg-s');
    // у капсул стекло — отдельный слой под кнопками, курсор над кнопкой
    // в него не попадает: ищем слой стекла своей капсулы
    if (!s && t) { var cap = t.closest('.lg-capsule, .lg-menu, .lg-box'); if (cap) s = cap.querySelector('.lg-glass, .lg-menu-glass'); }
    if (s) {
      var r = s.getBoundingClientRect();
      s.style.setProperty('--lg-mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      s.style.setProperty('--lg-my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    }
    // увеличение: куда тянуться — решаем здесь, а сами кнопки плавно
    // едут к цели в своём цикле кадров (magTick)
    var cont = t && t.closest('.lg-mag');
    if (cont !== magCont) { releaseMag(magCont); magCont = cont; if (cont) restOf(cont); }
    if (cont && !(reduceMotion && reduceMotion.matches)) {
      var R = magRest.get(cont);
      var p = R.row ? e.clientX : e.clientY;
      R.list.forEach(function (it) {
        var d = p - it.c;
        setTarget(it.b, 1 + MAG * Math.exp(-(d * d) / (2 * SIGMA * SIGMA)));
      });
      startMag(cont);
    }
  }

  /* Увеличение как у Dock на Mac.
     Раньше каждая кнопка получала новый размер на каждом движении мыши, а
     CSS-переход перезапускался с нуля — отсюда рывки. Теперь у каждой кнопки
     своя «пружина» (без перелёта, как в iOS): цель меняется сколько угодно
     часто, а размер догоняет её плавно, кадр за кадром, с частотой экрана.
     Расстояние до курсора меряем от ПОКОЙНОГО положения кнопки (как будто
     ничего не увеличено) и только вдоль капсулы: иначе выросшая кнопка
     сдвигает соседей, расстояния меняются, и всё начинает дрожать */
  var MAG = 0.38, SIGMA = 46, K = 220, C = 2 * Math.sqrt(220);
  var magCont = null, magState = new Map(), magRest = new WeakMap(), magRaf = 0, magLast = 0;
  function magButtons(c) { return c.querySelectorAll(':scope > a, :scope > button, .lg-item > .lg-btn, .lg-item > .ts-share-btn, .lg-mag-item'); }
  // Покойные центры кнопок вдоль капсулы, в координатах экрана. Снимаем их,
  // когда ничего не увеличено, и держим, пока кнопки не вернутся в покой:
  // капсула, стоящая по центру (док доски), при росте раздвигается в обе
  // стороны, и центры «от края капсулы» поехали бы вслед за курсором
  function restOf(cont) {
    var cs = getComputedStyle(cont);
    var row = cs.flexDirection.indexOf('row') === 0;
    var btns = Array.prototype.slice.call(magButtons(cont));
    var moving = btns.some(function (b) { return magState.has(b); });
    var old = magRest.get(cont);
    if (moving && old && old.list.length === btns.length) return;
    // запасной путь, если кнопки ещё не в покое: вычитаем, насколько
    // выросли предыдущие кнопки (разделители между ними не растут)
    var grown = 0, list = [];
    btns.forEach(function (b) {
      var st = magState.get(b), k = st ? st.x : 1;
      var r = b.getBoundingClientRect();
      var size = row ? r.width : r.height, rest = size / k;
      var start = (row ? r.left : r.top) - grown;
      list.push({ b: b, c: start + rest / 2 });
      grown += size - rest;
    });
    magRest.set(cont, { row: row, list: list });
  }
  function setTarget(b, v) {
    var st = magState.get(b);
    if (!st) { st = { x: 1, v: 0, t: 1 }; magState.set(b, st); }
    st.t = v;
  }
  function releaseMag(cont) {
    if (!cont) return;
    magButtons(cont).forEach(function (b) { setTarget(b, 1); });
    startMag(cont);
  }
  function startMag(cont) {
    var box = cont && cont.closest('.lg-menu, .lg-capsule');
    if (box) box.classList.add('lg-magging');
    if (!magRaf) { magLast = performance.now(); magRaf = requestAnimationFrame(magTick); }
  }
  function magTick(now) {
    magRaf = 0;
    // шаг по реальному времени кадра: на 60 и на 120 Гц скорость одна и та
    // же, а редкие кадры слабого устройства считаем мелкими подшагами — так
    // пружина не замедляется и не «взрывается» от большого шага
    var dt = Math.min(0.1, Math.max(0.001, (now - magLast) / 1000));
    magLast = now;
    var n = Math.ceil(dt / 0.008), h = dt / n;
    var busy = false;
    magState.forEach(function (st, b) {
      // критически затухающая пружина: быстро доходит до цели и не качается
      for (var i = 0; i < n; i++) {
        var a = -K * (st.x - st.t) - C * st.v;
        st.v += a * h; st.x += st.v * h;
      }
      if (Math.abs(st.x - st.t) < 0.0015 && Math.abs(st.v) < 0.002) {
        st.x = st.t; st.v = 0;
        if (st.t === 1) { b.style.removeProperty('--lg-mag'); magState.delete(b); return; }
      } else busy = true;
      b.style.setProperty('--lg-mag', st.x.toFixed(4));
    });
    if (pills.length) kickPills();
    placeTip();
    if (busy || magState.size && magCont) magRaf = requestAnimationFrame(magTick);
    else document.querySelectorAll('.lg-magging').forEach(function (el) { el.classList.remove('lg-magging'); });
  }
  function resetMag() {
    magState.forEach(function (st, b) { b.style.removeProperty('--lg-mag'); });
    magState.clear();
    document.querySelectorAll('.lg-magging').forEach(function (el) { el.classList.remove('lg-magging'); });
  }

  var pressSel = ['.lg-btn', '.lg-press', '.lg-side > a', '.lg-side > button'];
  function onDown(e) {
    // рисование на холсте — на время штриха снимаем преломление
    if (e.target && e.target.closest && e.target.closest('canvas')) { root.classList.add('lg-paused'); return; }
    if (cur !== 'full') return;
    var b = e.target && e.target.closest && e.target.closest(pressSel.join(','));
    if (!b || (reduceMotion && reduceMotion.matches)) return;
    b.classList.remove('lg-jelly');
    b.classList.add('lg-pressing');
    // вспышке нужен position у самой кнопки, иначе она растянулась бы на предка
    if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
    var r = b.getBoundingClientRect();
    var rp = document.createElement('span');
    rp.className = 'lg-ripple';
    rp.style.setProperty('--rx', (e.clientX - r.left) + 'px');
    rp.style.setProperty('--ry', (e.clientY - r.top) + 'px');
    b.appendChild(rp);
    setTimeout(function () { rp.remove(); }, 700);
    var up = function () {
      document.removeEventListener('pointerup', up, true);
      document.removeEventListener('pointercancel', up, true);
      b.classList.remove('lg-pressing');
      void b.offsetWidth;            // перезапуск анимации при быстрых повторных нажатиях
      b.classList.add('lg-jelly');
      setTimeout(function () { b.classList.remove('lg-jelly'); }, 650);
    };
    document.addEventListener('pointerup', up, true);
    document.addEventListener('pointercancel', up, true);
  }
  function onUp() {
    if (!root.classList.contains('lg-paused')) return;
    // небольшая задержка: между быстрыми штрихами не мигаем стеклом
    clearTimeout(onUp.t);
    onUp.t = setTimeout(function () { root.classList.remove('lg-paused'); }, 350);
  }

  function sync() {
    if (!document.body) return;
    if (cur === 'full') ensureAmbient();
    if (cur !== 'full') { resetMag(); magCont = null; }
    refreshRefraction();
    kickPills();
  }

  function init() {
    scanRefract();
    sync();
    document.addEventListener('pointermove', onMove, { passive: true });
    // курсор ушёл за окно — увеличенные кнопки возвращаем на место
    root.addEventListener('mouseleave', function () { releaseMag(magCont); magCont = null; });
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('pointerup', onUp, true);
    document.addEventListener('pointercancel', onUp, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.MathhGlass = {
    mode: function () { return cur; },
    set: set,
    toggle: function () { set(cur === 'full' ? 'lite' : 'full'); },
    onChange: function (fn) { listeners.push(fn); },
    refract: refract,
    autoRefract: autoRefract,
    tips: tips,
    floatTips: floatTips,
    liquidSelect: liquidSelect,
    genie: genie,
    // ещё кнопки страницы, которые должны пружинить при нажатии в «максимуме»
    pressable: function (sel) { pressSel.push(sel); },
    canRefract: canRefract
  };
})();
