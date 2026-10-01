/* ═══════════════════════════════════════════════════════════════════════
   tile-demo.js — «пример на плитке» для экранов выбора плитками (стандарт
   платформы, HANDOFF раздел 4 «Плитки с примером»). Вынесено из
   logarithms.html, когда на этих плитках появился второй тренажёр
   (тригонометрические уравнения), — чтобы движок примера был один.

   Запись примера — две строки разметки: откуда (from) и куда (to).
   Одинаковые части помечены data-k: «куда» стоит на странице обычной
   строкой (это конечный кадр), а смещения из положения «откуда» меряет
   layoutDemo() и кладёт в --dx/--dy/--s. Часть, которой нет в «куда»
   (скобки, знак «·»), — «призрак», тает; часть, которой нет в «откуда»,
   проявляется; data-late — итог, появляется последним. data-at="k" —
   часть вылетает из того же места, что часть k (второй log₂ рождается из
   первого). Так пример действительно «распадается» по правилу, а не просто
   сменяется картинкой. Сама анимация — keyframes в tile-demo.css.

   Страница вызывает TileDemo.mount({ root, demos, isShown }):
     root   — узел, внутри которого плитки (.tile) с полосами .demo[data-demo]
     demos  — словарь { id: { from, to } } в разметке из помощников ниже
     isShown() — открыт ли сейчас экран плиток (на скрытом не мерим)
   и получает relayout(force) — перемерить примеры (force — даже если
   ширина та же, после перерисовки плиток) и watch() — заново следить,
   какие плитки на экране (после перерисовки плиток).
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  /* ── помощники разметки примера ── */
  const K = (k, h, cls) => '<span class="t' + (cls ? ' ' + cls : '') + '" data-k="' + k + '">' + h + '</span>';
  const AT = (k, at) => '<span data-k="' + k + '" data-at="' + at + '"></span>';
  const LATE = h => '<span class="t" data-k="res" data-late>' + h + '</span>';
  const OP = s => '<span class="op">' + s + '</span>';
  // дробь, черта которой — часть примера (может приехать или растаять)
  const FR = (n, d) => '<span class="dfrac"><span class="dn">' + n + '</span>' + K('bar', '', 'dbar') + '<span class="dn">' + d + '</span></span>';
  // «статичная» дробь внутри части примера — едет вместе с ней
  const SFR = (n, d) => '<span class="dfrac"><span class="dn">' + n + '</span><span class="dbar"></span><span class="dn">' + d + '</span></span>';

  function layoutDemo(box, spec){
    if (!spec) return;
    box.innerHTML = '<span class="demo-line">' + spec.to + '</span>';
    const line = box.firstChild;
    if (!box.offsetWidth) return;       // экран скрыт — померим, когда покажут
    const meas = document.createElement('span');
    meas.className = 'demo-measure';
    meas.innerHTML = '<span class="demo-line">' + spec.from + '</span>';
    box.appendChild(meas);
    // Всё меряем от левого верхнего угла СВОЕЙ строки, а не полосы: обе строки
    // стоят по центру полосы, поэтому разница их начал — половина разницы
    // ширин и от ширины полосы не зависит. Ширина полосы меняется и без
    // resize (появилась полоса прокрутки, сетка перестроилась) — смещения от
    // края полосы тогда съезжали, и пример в начале анимации «рассыпался»
    const lf = line.getBoundingClientRect(), l0 = meas.firstChild.getBoundingClientRect();
    const sc = lf.width / (line.offsetWidth || lf.width) || 1;   // плитка могла быть увеличена наведением
    const ox = (l0.left - lf.left) / sc, oy = (l0.top - lf.top) / sc;
    const rel = (r, base) => ({ x: (r.left - base.left) / sc, y: (r.top - base.top) / sc, w: r.width / sc, h: r.height / sc });
    const fin = {}, from = {};
    // масштаб — отношение размеров шрифта: цифра из показателя степени
    // вырастает в полноразмерную и наоборот
    const fs = el => parseFloat(getComputedStyle(el).fontSize) || 1;
    line.querySelectorAll('[data-k]').forEach(el => { fin[el.dataset.k] = { el, r: rel(el.getBoundingClientRect(), lf), f: fs(el) }; });
    meas.querySelectorAll('[data-k]:not([data-at])').forEach(el => {
      const r = rel(el.getBoundingClientRect(), l0);
      from[el.dataset.k] = { el, r: { x: r.x + ox, y: r.y + oy, w: r.w, h: r.h }, f: fs(el) };
    });
    meas.querySelectorAll('[data-at]').forEach(el => { if (from[el.dataset.at]) from[el.dataset.k] = from[el.dataset.at]; });
    meas.remove();
    Object.keys(fin).forEach(k => {
      const f = fin[k], s0 = from[k], el = f.el;
      el.classList.remove('mvk', 'ink', 'late');
      if (s0) {
        const s = s0.f / f.f;
        el.classList.add('mvk');
        el.style.setProperty('--dx', (s0.r.x - f.r.x).toFixed(1) + 'px');
        el.style.setProperty('--dy', (s0.r.y - f.r.y).toFixed(1) + 'px');
        el.style.setProperty('--s', Math.abs(s - 1) < 0.08 ? '1' : s.toFixed(3));
      } else el.classList.add(el.hasAttribute('data-late') ? 'late' : 'ink');
    });
    // «призраки» живут внутри строки «куда» — их место считается от неё же
    Object.keys(from).forEach(k => {
      if (fin[k]) return;
      const s0 = from[k], g = document.createElement('span');
      g.className = s0.el.className + ' ghost';
      g.innerHTML = s0.el.innerHTML;
      g.style.left = s0.r.x.toFixed(1) + 'px'; g.style.top = s0.r.y.toFixed(1) + 'px';
      g.style.width = Math.max(1, s0.r.w).toFixed(1) + 'px'; g.style.height = s0.r.h.toFixed(1) + 'px';
      line.appendChild(g);
    });
  }

  function mount(opt){
    const root = opt.root, demos = opt.demos || {};
    const isShown = opt.isShown || (() => true);
    let demosAt = 0;                     // ширина, под которую померены примеры
    function relayout(force){
      const w = root.offsetWidth;
      if (!w || (!force && w === demosAt)) return;
      demosAt = w;
      root.querySelectorAll('.demo[data-demo]').forEach(box => layoutDemo(box, demos[box.dataset.demo]));
    }
    /* Анимации только у видимых плиток: IntersectionObserver ставит .live, CSS
       держит остальные на паузе. На экране задания плитки скрыты — ни одна
       не идёт. Без IntersectionObserver (очень старый браузер) — у всех. */
    let observer = null;
    function watch(){
      const tiles = root.querySelectorAll('.tile');
      if (!('IntersectionObserver' in window)) { tiles.forEach(t => t.classList.add('live')); return; }
      if (observer) observer.disconnect();
      observer = new IntersectionObserver(entries => {
        entries.forEach(en => en.target.classList.toggle('live', en.isIntersecting));
      }, { rootMargin: '40px 0px' });
      tiles.forEach(t => observer.observe(t));
    }
    let timer = null;
    window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(() => { if (isShown()) relayout(); }, 180); });
    // веб-шрифт догружается позже — ширины букв меняются, примеры мерим заново
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => relayout(true));
    return { relayout, watch };
  }

  window.TileDemo = { K, AT, LATE, OP, FR, SFR, layoutDemo, mount };
})();
