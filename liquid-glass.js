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
 *      название кнопки стеклянной плашкой при наведении.
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
    if (!s && t) { var cap = t.closest('.lg-capsule, .lg-menu'); if (cap) s = cap.querySelector('.lg-glass, .lg-menu-glass'); }
    if (s) {
      var r = s.getBoundingClientRect();
      s.style.setProperty('--lg-mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      s.style.setProperty('--lg-my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    }
    // увеличение: ближняя кнопка растёт сильнее, соседние — меньше, волной
    var cont = t && t.closest('.lg-mag');
    if (cont !== magCont) { resetMag(); magCont = cont; }
    if (cont && !(reduceMotion && reduceMotion.matches)) {
      magButtons(cont).forEach(function (b) {
        var br = b.getBoundingClientRect();
        var d = Math.hypot(e.clientX - (br.left + br.width / 2), e.clientY - (br.top + br.height / 2));
        var k = 1 + 0.34 * Math.exp(-(d * d) / (2 * 42 * 42));
        b.style.setProperty('--lg-mag', k.toFixed(3));
      });
    }
  }
  var magCont = null;
  function magButtons(c) { return c.querySelectorAll(':scope > a, :scope > button, .lg-item > .lg-btn, .lg-item > .ts-share-btn'); }
  function resetMag() { if (magCont) magButtons(magCont).forEach(function (b) { b.style.removeProperty('--lg-mag'); }); }

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
  }

  function init() {
    scanRefract();
    sync();
    document.addEventListener('pointermove', onMove, { passive: true });
    // курсор ушёл за окно — увеличенные кнопки возвращаем на место
    root.addEventListener('mouseleave', function () { resetMag(); magCont = null; });
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
    // ещё кнопки страницы, которые должны пружинить при нажатии в «максимуме»
    pressable: function (sel) { pressSel.push(sel); },
    canRefract: canRefract
  };
})();
