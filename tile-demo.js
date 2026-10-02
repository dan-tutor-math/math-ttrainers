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

  /* ═══ «Показать свойство» в задании (промпт №14 «логарифмы и тригонометрия») ═══
     Тот же пример с той же анимацией, что на плитке, но не по наведению, а
     по кнопке под заданием: один проход (4,5 с — время плиток), потом
     запись стоит законченной. Если свойств в задании несколько, они идут
     по очереди: проход одного — пауза — следующее; фишки сверху — какое
     сейчас и переход к любому. Состояние (что показано, какой пример)
     ведёт страница — она шлёт его собеседнику в совместной сессии, —
     здесь только отрисовка и таймер очереди.

     showcase(root, {
       items: [{ tag, color, title, formula, spec, cap, keep }],  // spec — { from, to };
                                  // keep — после прохода видны обе части: «откуда = куда»
       start,                     // с какого начать
       label,                     // «Свойство» / «Формула»
       toggle: { value, options: [[значение, подпись]…] } | null,
       reroll,                    // показать «Другой пример»
       on: { close, pick(i), toggle(v), reroll, replay },
     }) → { stop() } */
  const CYCLE_MS = 4500, HOLD_MS = 900;
  /* «Обе части свойства» (keep): после прохода на полосе стоит формула
     целиком — «откуда = куда». Левая часть стоит на месте с самого начала,
     появляется «=», а части примера выезжают из левой части вправо и
     складываются в результат. Сделано тем же layoutDemo: строка «куда» —
     неподвижная копия «откуда» (без data-k, поэтому её части не двигаются)
     + «=» + «куда»; строка «откуда» для замера — «откуда» и невидимый хвост
     той же ширины, что «= куда», чтобы части замерялись ровно там, где в
     строке стоит неподвижная копия, а не по центру полосы. */
  // без data-k/data-at/data-late: такие части layoutDemo не двигает и не
  // красит. Класс .late итогу НЕ добавлять: в строке «куда» он появляется
  // уже после замера, и хвост с его отступом сдвигал бы замер на полотступа
  const plainCopy = h => String(h).replace(/ data-(?:k|at)="[^"]*"/g, '').replace(/ data-late/g, '');
  function keepSpec(spec){
    const eq = '<span class="t op" data-k="__eq">=</span>';
    return {
      from: spec.from + '<span style="visibility:hidden">' + plainCopy('<span class="t op">=</span>' + spec.to) + '</span>',
      to: '<span class="keep">' + plainCopy(spec.from) + '</span>' + eq + spec.to,
    };
  }
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function hexA(hex, a){
    const n = parseInt(String(hex || '#2E7DE0').slice(1), 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  const reducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function showcase(root, opt){
    if (root._pshow) root._pshow.stop();
    const items = opt.items || [], on = opt.on || {};
    const n = items.length;
    if (!n) { root.innerHTML = ''; return { stop(){} }; }
    let cur = Math.max(0, Math.min(n - 1, opt.start || 0)), timer = null, alive = true;
    const tg = opt.toggle;
    root.innerHTML =
      '<div class="pshow">' +
        '<div class="pshow-head">' +
          '<span class="pshow-label"></span>' +
          (n > 1 ? '<span class="pshow-chips">' + items.map((it, i) =>
            '<button type="button" class="pshow-chip" data-i="' + i + '" style="--acc:' + it.color + ';--acc-soft:' + hexA(it.color, .14) + '">' + esc(it.title) + '</button>').join('') + '</span>' : '') +
          '<button type="button" class="pshow-x" title="Закрыть" aria-label="Закрыть">✕</button>' +
        '</div>' +
        '<div class="pshow-card">' +
          '<div class="pshow-top"><span class="tile-tag"></span><span class="pshow-title"></span></div>' +
          '<div class="pshow-formula"></div>' +
          '<div class="pshow-strip"><span class="pshow-cap"></span><span class="demo"></span></div>' +
        '</div>' +
        '<div class="pshow-ctrl">' +
          (tg ? '<span class="pshow-seg">' + tg.options.map(o => '<button type="button" data-v="' + o[0] + '" class="' + (o[0] === tg.value ? 'on' : '') + '">' + esc(o[1]) + '</button>').join('') + '</span>' : '') +
          (opt.reroll ? '<button type="button" class="pshow-btn pshow-reroll">🎲 Другой пример</button>' : '') +
          '<button type="button" class="pshow-btn pshow-replay">↻ Ещё раз</button>' +
        '</div>' +
      '</div>';
    const box = root.querySelector('.pshow');
    const q = s => box.querySelector(s);
    const strip = q('.pshow-strip'), demo = q('.demo');
    // длинная запись (серия, отрезок и корни; уровень Г) на узком экране не
    // влезала в полосу — шрифт примера уменьшаем ровно настолько, чтобы
    // строка «куда» встала целиком, и меряем пример заново уже в нём
    function fit(spec){
      demo.style.fontSize = '';
      layoutDemo(demo, spec);
      const line = demo.querySelector('.demo-line');
      const room = strip.clientWidth - 20;
      if (!line || !room || line.offsetWidth <= room) return;
      const fs = parseFloat(getComputedStyle(demo).fontSize) || 20;
      demo.style.fontSize = Math.max(10, Math.floor(fs * room / line.offsetWidth)) + 'px';
      layoutDemo(demo, spec);
    }
    function play(i){
      clearTimeout(timer);
      cur = i;
      const it = items[i];
      box.style.setProperty('--acc', it.color);
      box.style.setProperty('--acc-soft', hexA(it.color, .14));
      q('.pshow-label').textContent = (opt.label || 'Свойство') + (n > 1 ? ' ' + (i + 1) + ' из ' + n : '');
      q('.tile-tag').textContent = it.tag || '';
      q('.pshow-title').textContent = it.title;
      q('.pshow-formula').innerHTML = it.formula || '';
      q('.pshow-cap').textContent = it.cap || 'пример';
      box.querySelectorAll('.pshow-chip').forEach(c => {
        const k = +c.dataset.i;
        c.classList.toggle('on', k === i);
        c.classList.toggle('seen', k < i);
      });
      // строка «куда» ставится сразу (она же конечный кадр), смещения
      // меряются по ней; анимация перезапускается снятием класса
      strip.classList.remove('play');
      demo.classList.toggle('keeping', !!it.keep);
      fit(it.keep ? keepSpec(it.spec) : it.spec);
      void strip.offsetWidth;
      strip.classList.add('play');
      // «уменьшить движение» — ничего не едет и само не листается
      if (i < n - 1 && !reducedMotion()) timer = setTimeout(() => { if (alive) play(i + 1); }, CYCLE_MS + HOLD_MS);
    }
    q('.pshow-x').onclick = () => { if (on.close) on.close(); };
    box.querySelectorAll('.pshow-chip').forEach(c => { c.onclick = () => { const i = +c.dataset.i; if (on.pick) on.pick(i); else play(i); }; });
    box.querySelectorAll('.pshow-seg button').forEach(b => { b.onclick = () => { if (b.dataset.v !== tg.value && on.toggle) on.toggle(b.dataset.v); }; });
    const rr = q('.pshow-reroll');
    if (rr) rr.onclick = () => { if (on.reroll) on.reroll(); };
    q('.pshow-replay').onclick = () => { if (on.replay) on.replay(); else play(0); };
    // ширина поменялась — пример перемеряем, иначе части «рассыпались» бы
    // (как у плиток); проход при этом не повторяем — стоит конечный кадр
    let rt = null;
    const onResize = () => { clearTimeout(rt); rt = setTimeout(() => { if (alive && demo.offsetWidth) { const it = items[cur]; strip.classList.remove('play'); fit(it.keep ? keepSpec(it.spec) : it.spec); } }, 180); };
    window.addEventListener('resize', onResize);
    const ctl = {
      stop(){ alive = false; clearTimeout(timer); clearTimeout(rt); window.removeEventListener('resize', onResize); if (root._pshow === ctl) root._pshow = null; },
      cur: () => cur,
    };
    root._pshow = ctl;
    play(cur);
    return ctl;
  }

  window.TileDemo = { K, AT, LATE, OP, FR, SFR, layoutDemo, mount, showcase, CYCLE_MS };
})();
