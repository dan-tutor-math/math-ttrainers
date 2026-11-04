/* ═══════════════════════════════════════════════════════════════════════
   deck-io-html-frame.js — разборщик HTML-презентации. Работает ВНУТРИ
   песочницы импорта (iframe с адресом data:, см. deck-io.js ioHtmlSession),
   доска подкладывает его текстом в конец чужого HTML вместе с html2canvas
   (deck-io.js, ioImportHtml; HANDOFF.md раздел 6г).

   Почему внутри, а не снаружи: у кадра data: свой
   «никакой» адрес — скрипты чужой презентации (reveal.js, свои движки,
   что угодно из интернета) не видят ни localStorage, ни вход в Supabase
   доски. Но и доска тогда не видит её DOM — поэтому мерить и снимать
   слайды приходится изнутри, а наружу отдавать готовые данные postMessage.

   Разговор с доской:
     сюда  { mxio:'go', mode:'full'|'img', from, to }
     туда  { mxio:'probe', n, w, h, kind, missing }   — после загрузки
           { mxio:'slide', i, data }                  — по слайду
           { mxio:'done' } | { mxio:'err', msg }
   Координаты — CSS px от левого верхнего угла слайда; в единицы доски
   их переводит deck-io.js.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if (window.__mxio) return;
  window.__mxio = true;
  const send = (m) => { try { parent.postMessage(Object.assign({ mxio: m.mxio }, m), '*'); } catch (e) {} };
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  /* Время анимаций в невидимом кадре браузер может не двигать (кадр
     прозрачный и под доской — его отрисовку придерживают), и «выплывающий»
     заголовок навсегда остаётся в начале, с прозрачностью 0. Поэтому
     анимации и переходы доводим до конца сами; бесконечные — снимаем */
  function finishAll(){
    if (!document.getAnimations) return;
    document.getAnimations().forEach(a => {
      try { a.finish(); } catch (e) { try { a.cancel(); } catch (e2) {} }
    });
  }
  const frames = (n) => new Promise(r => { let k = n || 2; const f = () => (--k <= 0 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); setTimeout(r, 120); });

  /* Анимации появления — сразу в конечное состояние, «фрагменты» reveal.js
     видны: в заготовке урока слайд должен быть целиком, а не первым шагом.
     animation: none не годится — тогда «выплывающий» текст остался бы в
     начальном состоянии (opacity 0) и пропал бы вовсе */
  function freeze(){
    const st = document.createElement('style');
    st.textContent = '*,*::before,*::after{animation-delay:0s!important;animation-duration:0.001s!important;animation-iteration-count:1!important;transition-duration:0s!important;transition-delay:0s!important;caret-color:transparent!important}'
      + '.reveal .fragment{opacity:1!important;visibility:visible!important;transform:none!important}'
      + '[data-mxio-stage]{transform:none!important;scale:none!important;translate:none!important;zoom:1!important;left:0!important;top:0!important;right:auto!important;bottom:auto!important;margin:0!important}'
      + '.mxio-t{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}';
    (document.head || document.documentElement).appendChild(st);
  }

  /* ── поиск слайдов ──────────────────────────────────────────────────── */
  const VW = () => window.innerWidth, VH = () => window.innerHeight;
  // только самые внешние совпадения: у вложенных section reveal.js и у
  // .slide внутри .slide слайд — внешний
  function outer(list){ return list.filter(el => !list.some(o => o !== el && o.contains(el))); }
  function shown(el){ const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.05; }

  function findSlides(){
    // reveal.js: слайды и листание — его же API, фон слайда лежит вне section
    // (.backgrounds), поэтому снимаем всё окно .reveal, а не сам слайд
    if (window.Reveal && typeof Reveal.getSlides === 'function' && document.querySelector('.reveal')){
      const els = Reveal.getSlides().filter(s => !s.classList.contains('stack'));
      if (els.length) return { kind: 'reveal', list: els.map(s => ({ root: s, host: s, frame: document.querySelector('.reveal') })) };
    }
    // Marp: каждый слайд — svg[data-marpit-svg] > foreignObject > section
    const marp = [...document.querySelectorAll('svg[data-marpit-svg]')];
    if (marp.length) return { kind: 'marp', list: marp.map(sv => { const s = sv.querySelector('section') || sv; return { root: s, host: sv, frame: s }; }) };
    // свои движки: первый набор, где хотя бы два слайда и видимый занимает
    // заметную часть окна (иначе .page/.slide могли оказаться кнопками)
    const SEL = ['.slide', '[data-slide]', '.slides > section', '.slides > div', '.deck > section', '.deck > div', '.page', 'section', 'article'];
    const area = VW() * VH();
    for (const sel of SEL){
      const els = outer([...document.querySelectorAll(sel)]).filter(el => !el.closest('[aria-hidden="true"].thumbs, .thumbnails, nav'));
      if (els.length < 2) continue;
      const big = els.some(el => { if (!shown(el)) return false; const r = el.getBoundingClientRect(); return r.width * r.height >= area * 0.25; });
      if (big){
        const st = findStage(els);
        // слайды на сцене: слайдом считается вся сцена (фишки, рамки, фон
        // вокруг слайда — тоже часть кадра), разбираем тоже её — у скрытых
        // слайдов display: none, они сами не попадут
        if (st) return { kind: sel, stage: true, list: els.map(el => ({ root: st, host: el, frame: st })) };
        return { kind: sel, list: els.map(el => ({ root: el, host: el, frame: el })) };
      }
    }
    // один длинный документ: режем на страницы по высоте окна
    const H = Math.max(VH(), document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0);
    const n = H > VH() * 1.25 ? Math.min(60, Math.ceil(H / VH() - 0.05)) : 1;
    const list = [];
    for (let i = 0; i < n; i++) list.push({ root: document.body, host: null, frame: document.body, slice: { y: i * VH(), h: VH() } });
    return { kind: 'page', list };
  }

  /* «Сцена»: многие движки (и наши шаблоны разборов) рисуют кадр
     постоянного размера — 1920 × 1080 — и вписывают его в окно через
     transform: scale. Слайды тогда лишь часть кадра (у разборов — левая
     колонка, а фишки, рамка камеры и подпись лежат вне слайдов), и размер
     слайда выходил 1336 × 872 вместо 16:9. Признак сцены: общий предок
     всех слайдов с transform / scale / zoom и размером не больше двух
     слайдов (иначе это лента всех слайдов подряд, а не кадр) */
  function findStage(els){
    const vis = els.find(shown) || els[0];
    const sw = Math.max(1, vis.offsetWidth), sh = Math.max(1, vis.offsetHeight);
    let best = null;
    for (let p = vis.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement){
      if (!els.every(e => p.contains(e))) continue;
      const cs = getComputedStyle(p);
      // уже найденная сцена: масштаб с неё снят нашим же стилем
      const tf = p.hasAttribute('data-mxio-stage') || (cs.transform && cs.transform !== 'none') || (cs.scale && cs.scale !== 'none') || (cs.zoom && cs.zoom !== '1' && cs.zoom !== 'normal');
      if (tf && p.offsetWidth >= sw && p.offsetHeight >= sh && p.offsetWidth <= sw * 2.05 && p.offsetHeight <= sh * 2.05) best = p;
    }
    if (best) best.setAttribute('data-mxio-stage', '');
    return best;
  }

  /* «Активный» слайд у своих движков почти всегда отличается классом
     (active, current, present…): ищем видимый слайд, берём его классы,
     которых нет у невидимых, и при съёмке переставляем их нужному. Плюс
     на всякий случай делаем его видимым напрямую */
  let actCls = null;
  function activeClasses(list){
    if (actCls) return actCls;
    const hosts = list.map(s => s.host).filter(Boolean);
    const vis = hosts.filter(shown), inv = hosts.filter(h => !shown(h));
    actCls = [];
    if (vis.length && inv.length){
      const own = [...vis[0].classList].filter(c => vis.every(h => h.classList.contains(c)) && inv.every(h => !h.classList.contains(c)));
      // свой класс бывает и у одного слайда (title, cover) — его не брать:
      // только похожие на «активный», остальное решит видимость напрямую
      actCls = own.filter(c => /activ|current|present|show|visib|select|open|enter|^on$|^in$|--on|is-/i.test(c));
    }
    return actCls;
  }
  let forced = null;
  function unforce(){
    if (!forced) return;
    ['display', 'visibility', 'opacity'].forEach(p => forced.style.removeProperty(p));
    forced = null;
  }
  let keyNav = null;   // null — не проверяли, true/false — отвечает ли на клавиши
  const curIdx = (all) => all.findIndex(o => o.host && shown(o.host));
  function press(key){
    const code = { ArrowRight: 39, ArrowLeft: 37, Home: 36 }[key];
    const t = document.activeElement && document.activeElement !== document.body ? document.activeElement : document.body;
    t.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, keyCode: code, which: code, bubbles: true, cancelable: true }));
    t.dispatchEvent(new KeyboardEvent('keyup', { key, code: key, keyCode: code, which: code, bubbles: true, cancelable: true }));
  }
  async function keyGo(all, i){
    let at = curIdx(all);
    if (at < 0) return false;
    if (keyNav === null){
      // проверка: шаг вперёд (или назад с последнего) должен сменить слайд
      const k = at < all.length - 1 ? 'ArrowRight' : 'ArrowLeft';
      press(k); await frames(2); finishAll();
      const now = curIdx(all);
      keyNav = now >= 0 && now !== at && Math.abs(now - at) === 1;
      if (!keyNav) return false;
      at = now;
    }
    for (let n = 0; at !== i && n < all.length + 2; n++){
      press(at < i ? 'ArrowRight' : 'ArrowLeft');
      await frames(2); finishAll();
      const now = curIdx(all);
      if (now === at){ keyNav = false; return false; }   // застряли — дальше классами
      at = now;
    }
    return at === i;
  }
  async function show(S, all, kind){
    if (kind === 'reveal'){
      const ix = Reveal.getIndices(S.root);
      Reveal.slide(ix.h, ix.v, ix.f);
      await frames(3);
      return;
    }
    if (S.slice){ window.scrollTo(0, 0); await frames(2); return; }
    // листаем клавишами самой презентации, если она на них отвечает: её
    // функция листания меняет и то, что вокруг слайда (номер, подпись в
    // шапке, решение), а не только какой слайд виден
    if (keyNav !== false && await keyGo(all, all.indexOf(S))) return;
    const ac = activeClasses(all);
    unforce();
    all.forEach(o => { if (o.host && o.host !== S.host) ac.forEach(c => o.host.classList.remove(c)); });
    ac.forEach(c => S.host.classList.add(c));
    await frames(2);
    // класса не нашлось (или его мало) — видимость напрямую
    const h = S.host, cs = getComputedStyle(h);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 1) forced = h;
    if (cs.display === 'none'){ h.style.setProperty('display', 'block', 'important'); }
    if (cs.visibility === 'hidden') h.style.setProperty('visibility', 'visible', 'important');
    if (+cs.opacity < 1) h.style.setProperty('opacity', '1', 'important');
    // слайды друг под другом (длинная страница) — подвести нужный к окну
    const r = h.getBoundingClientRect();
    if (r.top < -1 || r.bottom > VH() + 1) { h.scrollIntoView({ block: 'start' }); await frames(2); }
  }
  function frameRect(S){
    if (S.slice) return { left: 0, top: S.slice.y - window.scrollY, width: VW(), height: S.slice.h };
    const r = S.frame.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  }

  /* ── цвета ──────────────────────────────────────────────────────────── */
  const cvx = document.createElement('canvas').getContext('2d');
  function rgba(css){
    if (!css || css === 'transparent') return null;
    const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/.exec(css);
    if (!m){
      // color(srgb…), oklch() и прочее — через холст
      try { cvx.fillStyle = '#000'; cvx.fillStyle = css; const v = cvx.fillStyle; if (v[0] === '#') return { c: v.toUpperCase(), a: 1 }; return rgba(v); } catch (e) { return null; }
    }
    let a = m[4] == null ? 1 : (/%$/.test(m[4]) ? parseFloat(m[4]) / 100 : +m[4]);
    const hx = (v) => Math.max(0, Math.min(255, Math.round(+v))).toString(16).padStart(2, '0').toUpperCase();
    return { c: '#' + hx(m[1]) + hx(m[2]) + hx(m[3]), a };
  }
  function pageBg(el){
    for (let e = el; e && e.nodeType === 1; e = e.parentElement){
      const c = rgba(getComputedStyle(e).backgroundColor);
      if (c && c.a > 0.5) return c.c;
    }
    return '#FFFFFF';
  }
  // первый цвет градиента — для текста «градиентом» (background-clip: text)
  function gradFirst(bi){ const m = /(#[0-9a-f]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\))/i.exec(bi || ''); return m ? rgba(m[1]) : null; }

  /* ── шрифты: семейство страницы → одно из шрифтов доски по похожести.
     Доска рисует надписи своими файлами (одинаковые метрики у учителя и
     ученика), поэтому «Inter» станет ближайшим из её восьми; Unbounded
     (шаблоны разборов) у доски есть свой */
  const SERIF = /serif|georgia|times|garamond|palatino|cambria|merriweather|lora|playfair|pt serif|noto serif|source serif|crimson|baskerville/i;
  const MONO = /mono|courier|consolas|menlo|monaco|code/i;
  function family(ff){
    const list = String(ff || '').split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
    const known = ['Unbounded', 'Calibri', 'Arial', 'Helvetica', 'Times New Roman', 'Cambria', 'Courier New', 'PT Sans', 'PT Serif', 'Georgia', 'Verdana', 'Tahoma', 'Segoe UI', 'Roboto', 'Open Sans', 'Montserrat', 'Consolas', 'Onest'];
    for (const f of list){ const k = known.find(x => x.toLowerCase() === f.toLowerCase()); if (k) return k; }
    for (const f of list){
      if (/sans-serif/i.test(f)) return 'Arial';
      if (/^serif$/i.test(f) || SERIF.test(f) && !/sans/i.test(f)) return 'Times New Roman';
      if (MONO.test(f)) return 'Courier New';
    }
    return 'Arial';
  }

  /* ── разбор слайда «полностью» ─────────────────────────────────────── */
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'HEAD', 'META', 'LINK', 'TITLE', 'OPTION', 'DATALIST']);
  // то, что снимается целиком картинкой: внутрь не лезем
  const ATOMIC = (el) => {
    const t = el.tagName;
    if (t === 'IMG' || t === 'CANVAS' || t === 'MATH') return true;
    if (el instanceof SVGSVGElement) return !(el.closest('svg[data-marpit-svg]') === el);
    return el.classList && (el.classList.contains('katex') || el.classList.contains('katex-display') || el.classList.contains('MathJax') || t === 'MJX-CONTAINER');
  };
  const NOTES = (el) => (el.tagName === 'ASIDE' && el.classList.contains('notes')) || el.classList.contains('speaker-notes') || el.hasAttribute('data-notes');
  // поворот или наклон — такой узел оставляем на подложке как есть:
  // доска не знает, вокруг чего его вращала страница
  function turned(tf){
    if (!tf || tf === 'none') return false;
    try { const m = new DOMMatrixReadOnly(tf); return Math.abs(m.b) > 1e-3 || Math.abs(m.c) > 1e-3; } catch (e) { return false; }
  }
  function sides(cs){
    const s = ['Top', 'Right', 'Bottom', 'Left'].map(k => ({ w: parseFloat(cs['border' + k + 'Width']) || 0, st: cs['border' + k + 'Style'], c: cs['border' + k + 'Color'] }));
    return s;
  }

  function parse(S, R){
    const items = [], blocks = new Map(), notes = [], rotatedText = [];
    let order = 0, bgColor = null;
    const rootRect = R;
    const inside = (r) => r.width > 0.5 && r.height > 0.5 && r.right > rootRect.left + 1 && r.left < rootRect.left + rootRect.width - 1 && r.bottom > rootRect.top + 1 && r.top < rootRect.top + rootRect.height - 1;
    const rel = (r) => ({ x: r.left - rootRect.left, y: r.top - rootRect.top, w: r.width, h: r.height });

    function shape(el, cs, op, ord){
      if (turned(cs.transform)) return null;
      const r = el.getBoundingClientRect();
      if (!inside(r) || r.width < 3 || r.height < 3) return null;
      const bg = rgba(cs.backgroundColor);
      const hasImg = cs.backgroundImage && cs.backgroundImage !== 'none';
      let fill = !hasImg && bg && bg.a > 0.02 ? { c: bg.c, a: +(bg.a * op).toFixed(3) } : null;
      const sd = sides(cs);
      const same = sd.every(s => s.w > 0 && s.st !== 'none' && s.st !== 'hidden' && s.w === sd[0].w && s.st === sd[0].st && s.c === sd[0].c);
      let line = null;
      if (same && ['solid', 'dashed', 'dotted'].includes(sd[0].st)){
        const lc = rgba(sd[0].c);
        if (lc && lc.a > 0.02) line = { c: lc.c, a: +(lc.a * op).toFixed(3), w: sd[0].w, dash: sd[0].st === 'solid' ? null : sd[0].st === 'dashed' ? 'dash' : 'sysDot' };
      }
      if (!fill && !line) return null;
      // слайд целиком своей заливкой — это фон, а не фигура
      if (r.width >= rootRect.width * 0.97 && r.height >= rootRect.height * 0.97){
        if (fill && fill.a > 0.9 && !bgColor) bgColor = fill.c;
        return null;
      }
      const rd = ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'].map(k => parseFloat(cs['border' + k + 'Radius']) || 0);
      const ss = Math.min(r.width, r.height);
      let geom = 'rect', adj = null;
      if (rd.some(v => v > 0.5)){
        // разные углы доска не рисует — такая фигура остаётся на подложке
        if (rd.some(v => Math.abs(v - rd[0]) > 0.5)) return null;
        const rad = Math.min(rd[0], ss / 2);
        if (rad >= ss / 2 - 0.5 && Math.abs(r.width - r.height) < 1.5) geom = 'ellipse';
        else { geom = 'roundRect'; adj = Math.round(rad / ss * 100000); }
      }
      const it = Object.assign({ t: 'box', ord, el, geom, fill, line }, rel(r));
      if (adj != null) it.adj = adj;
      items.push(it);
      return it;
    }

    function addText(block, node, pcs, op){
      let t = node.data;
      const ws = pcs.whiteSpace;
      if (!/^pre/.test(ws) && ws !== 'break-spaces') t = t.replace(/[\s​]+/g, ' ');
      else if (ws === 'pre-line') t = t.replace(/[ \t]+/g, ' ');
      if (!t) return;
      const tt = pcs.textTransform;
      if (tt === 'uppercase') t = t.toUpperCase();
      else if (tt === 'lowercase') t = t.toLowerCase();
      else if (tt === 'capitalize') t = t.replace(/(^|\s)(\S)/g, (a, s, c) => s + c.toUpperCase());
      let B = blocks.get(block);
      if (!B){ B = { el: block, ord: order, runs: [], nodes: [], rects: [] }; blocks.set(block, B); }
      const rg = document.createRange();
      rg.selectNodeContents(node);
      const rs = [...rg.getClientRects()].filter(r => r.width > 0 && r.height > 0);
      if (!rs.length && !t.trim()) { B.runs.push({ t: ' ', ws: true }); return; }
      if (!rs.length) return;
      if (!rs.some(inside)) return;
      rs.forEach(r => B.rects.push(r));
      B.nodes.push(node);
      let col = rgba(pcs.webkitTextFillColor || pcs.color);
      if (!col || col.a < 0.05){ const g = gradFirst(pcs.backgroundImage); if (g) col = g; }
      if (!col || col.a < 0.05) col = rgba(pcs.color) || { c: '#000000', a: 1 };
      // подчёркивание задаёт предок, у самого узла его в стиле нет
      let u = false, s = false;
      for (let e = node.parentElement; e && e !== block.parentElement; e = e.parentElement){
        const d = getComputedStyle(e).textDecorationLine || '';
        if (/underline/.test(d)) u = true;
        if (/line-through/.test(d)) s = true;
        if (e === block) break;
      }
      const run = { t, fs: parseFloat(pcs.fontSize) || 16, f: family(pcs.fontFamily), c: col.c };
      if ((parseInt(pcs.fontWeight, 10) || 400) >= 600) run.b = true;
      if (/italic|oblique/.test(pcs.fontStyle)) run.i = true;
      if (u) run.u = true;
      if (s) run.s = true;
      const sup = pcs.verticalAlign;
      if (sup === 'super') run.bl = 'sup'; else if (sup === 'sub') run.bl = 'sub';
      B.runs.push(run);
    }

    function walk(el, op, block, rot){
      if (SKIP.has(el.tagName)) return;
      // заметки докладчика обычно спрятаны (display: none) — проверять до видимости
      if (NOTES(el)){ const t = (el.textContent || '').replace(/\s+/g, ' ').trim(); if (t) notes.push(t); el.setAttribute('data-mxio-notes', ''); return; }
      const cs = getComputedStyle(el);
      if (cs.display === 'none') return;
      const o = op * (+cs.opacity || 0);
      if (o < 0.04) return;
      const hidden = cs.visibility === 'hidden';
      const r2 = rot || turned(cs.transform);
      const ord = ++order;
      if (ATOMIC(el)){ if (!hidden && !r2) items.push({ t: 'atom', ord, el, op: o }); return; }
      const isBlock = cs.display !== 'inline' && cs.display !== 'contents';
      const my = isBlock ? el : block;
      if (isBlock && !hidden && !r2) shape(el, cs, o, ord);
      for (const ch of el.childNodes){
        if (ch.nodeType === 3){
          if (hidden || !ch.data) continue;
          if (r2){ if (ch.data.trim()) rotatedText.push(ch); continue; }
          addText(my, ch, cs, o);
        } else if (ch.nodeType === 1){
          if (ch.tagName === 'BR'){ const B = blocks.get(my); if (B) B.runs.push({ t: '\n', br: true }); continue; }
          walk(ch, o, my, r2);
        }
      }
    }
    const start = S.slice ? document.body : S.root;
    // корень сам может быть фигурой-фоном: его заливка — цвет слайда
    walk(start, 1, start, false);

    // блоки текста → надписи (или текст внутри своей фигуры)
    blocks.forEach(B => {
      // склеить куски одного вида, обрезать пробелы по краям строк
      const runs = [];
      B.runs.forEach(r => {
        if (r.ws){ if (runs.length) runs[runs.length - 1].t += ' '; return; }
        if (r.br){ if (runs.length) runs[runs.length - 1].t += '\n'; return; }
        const p = runs[runs.length - 1];
        if (p && ['fs', 'f', 'c', 'b', 'i', 'u', 's', 'bl'].every(k => (p[k] || null) === (r[k] || null))) p.t += r.t;
        else runs.push(Object.assign({}, r));
      });
      if (runs.length){
        runs[0].t = runs[0].t.replace(/^ +/, '');
        runs[runs.length - 1].t = runs[runs.length - 1].t.replace(/[ \n]+$/, '');
        runs.forEach(r => { r.t = r.t.replace(/ *\n */g, '\n'); });
      }
      const kept = runs.filter(r => r.t);
      if (!kept.length || !kept.some(r => r.t.trim())) return;
      const cs = getComputedStyle(B.el);
      const er = B.el.getBoundingClientRect();
      const tl = Math.min(...B.rects.map(r => r.left)), tr = Math.max(...B.rects.map(r => r.right));
      const tt = Math.min(...B.rects.map(r => r.top)), tb = Math.max(...B.rects.map(r => r.bottom));
      const px = (k) => parseFloat(cs[k]) || 0;
      const cl = er.left + px('borderLeftWidth') + px('paddingLeft'), cr = er.right - px('borderRightWidth') - px('paddingRight');
      const ta = cs.textAlign;
      const al = /center/.test(ta) ? 'c' : /right|end/.test(ta) && cs.direction !== 'rtl' ? 'r' : ta === 'justify' ? 'j' : 'l';
      const lh = cs.lineHeight === 'normal' ? null : parseFloat(cs.lineHeight) || null;
      const lines = Math.max(1, Math.round((tb - tt) / Math.max(1, lh || kept[0].fs * 1.2)));
      const T = { runs: kept, al, lh, lines };
      if (cs.display === 'list-item' && cs.listStyleType !== 'none'){
        const lt = cs.listStyleType;
        if (/decimal|alpha|roman/.test(lt)){
          const li = B.el, sib = [...li.parentElement.children].filter(e => e.tagName === 'LI');
          const ol = li.parentElement;
          const st = ol && ol.tagName === 'OL' && ol.hasAttribute('start') ? +ol.getAttribute('start') || 1 : 1;
          T.bu = { num: /alpha/.test(lt) ? (/upper/.test(lt) ? 'alphaUcPeriod' : 'alphaLcPeriod') : /roman/.test(lt) ? (/upper/.test(lt) ? 'romanUcPeriod' : 'romanLcPeriod') : 'arabicPeriod', start: st + sib.indexOf(li) };
        } else T.bu = { ch: lt === 'circle' ? '◦' : lt === 'square' ? '▪' : '•' };
        const mc = rgba(getComputedStyle(B.el, '::marker').color);
        if (mc && mc.c !== kept[0].c) T.bu.c = mc.c;
      }
      const sh = items.find(it => it.t === 'box' && it.el === B.el);
      if (sh){
        // текст в своей фигуре: поля — как отступы CSS, по вертикали — где стоит
        sh.text = T;
        sh.pad = [px('paddingLeft') + px('borderLeftWidth'), px('paddingTop') + px('borderTopWidth'), px('paddingRight') + px('borderRightWidth'), px('paddingBottom') + px('borderBottomWidth')];
        const mid = (tt + tb) / 2, emid = (er.top + er.bottom) / 2;
        sh.anchor = Math.abs(mid - emid) < 3 ? 'm' : (er.bottom - tb) < (tt - er.top) - 3 ? 'b' : 't';
        if (sh.anchor !== 't') sh.pad[1] = sh.pad[3] = Math.min(sh.pad[1], sh.pad[3]);
        sh.nodes = B.nodes;
        return;
      }
      // одна надпись: ширина — содержимое блока (чтобы строки переносились
      // там же), высота — сам текст
      const x0 = Math.min(cl, tl), x1 = Math.max(cr, tr);
      items.push({ t: 'text', ord: B.ord, el: B.el, x: x0 - rootRect.left, y: tt - rootRect.top, w: Math.max(4, x1 - x0), h: Math.max(4, tb - tt), text: T, nodes: B.nodes });
    });
    items.sort((a, b) => a.ord - b.ord);
    return { items, notes, bgColor, rotatedText };
  }

  /* SVG в картинку: стили из CSS-классов в отдельной картинке не действуют,
     поэтому переносим вычисленные значения в атрибуты (и для подложки:
     html2canvas рисует svg так же — сериализацией) */
  const SVG_PROPS = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'dominant-baseline', 'visibility', 'display'];
  /* <use href="#star"> ссылается на значок в другом svg страницы — в
     отдельной картинке ссылка пустая, и значок пропадал. Разворачиваем
     ссылку в копию фигур (до переноса стилей: заливку они наследуют) */
  function expandUse(svg){
    svg.querySelectorAll('use').forEach(u => {
      const ref = (u.getAttribute('href') || u.getAttribute('xlink:href') || '').replace(/^#/, '');
      const src = ref && document.getElementById(ref);
      if (!src || src.contains(u)) return;
      const NS = 'http://www.w3.org/2000/svg';
      let el;
      if (src.tagName.toLowerCase() === 'symbol'){
        el = document.createElementNS(NS, 'svg');
        if (src.getAttribute('viewBox')) el.setAttribute('viewBox', src.getAttribute('viewBox'));
        ['x', 'y'].forEach(a => { if (u.getAttribute(a)) el.setAttribute(a, u.getAttribute(a)); });
        el.setAttribute('width', u.getAttribute('width') || '100%');
        el.setAttribute('height', u.getAttribute('height') || '100%');
        [...src.childNodes].forEach(c => el.appendChild(c.cloneNode(true)));
      } else {
        el = document.createElementNS(NS, 'g');
        const x = +u.getAttribute('x') || 0, y = +u.getAttribute('y') || 0;
        if (x || y) el.setAttribute('transform', 'translate(' + x + ' ' + y + ')');
        el.appendChild(src.cloneNode(true));
        el.firstChild.removeAttribute('id');
      }
      [...u.attributes].forEach(a => { if (!/^(href|xlink:href|x|y|width|height)$/.test(a.name)) el.setAttribute(a.name, a.value); });
      u.replaceWith(el);
    });
  }
  // сначала разворачиваем <use> во всех svg, потом переносим стили: иначе
  // образец значка (<symbol> в невидимом svg) успевал получить «свой»
  // чёрный цвет и копия теряла цвет, унаследованный от места вставки
  function prepSvgs(){
    const all = [...document.querySelectorAll('svg')];
    all.forEach(sv => { if (!sv.__mxioUse){ sv.__mxioUse = true; expandUse(sv); } });
    all.forEach(inlineSvg);
  }
  function inlineSvg(svg){
    if (svg.__mxioDone) return;
    svg.__mxioDone = true;
    [svg, ...svg.querySelectorAll('*')].forEach(e => {
      const cs = getComputedStyle(e);
      SVG_PROPS.forEach(p => { const v = cs.getPropertyValue(p); if (v && !(p === 'display' && v !== 'none')) e.style.setProperty(p, v); });
    });
  }
  async function svgData(el, r){
    const cl = el.cloneNode(true);
    cl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    cl.setAttribute('width', r.width); cl.setAttribute('height', r.height);
    if (!cl.getAttribute('viewBox') && el.viewBox && el.viewBox.baseVal && el.viewBox.baseVal.width === 0) cl.setAttribute('viewBox', '0 0 ' + r.width + ' ' + r.height);
    cl.style.removeProperty('display');
    const s = new XMLSerializer().serializeToString(cl);
    return { src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s), natW: Math.round(r.width), natH: Math.round(r.height) };
  }
  async function snap(el, r){
    // картинка без обрезки и формы — прямо холстом, это быстрее html2canvas
    if (el.tagName === 'IMG' && el.complete && el.naturalWidth){
      const cs = getComputedStyle(el);
      const plain = (cs.objectFit === 'fill' || (cs.objectFit === 'contain' && Math.abs(el.naturalWidth / el.naturalHeight - r.width / r.height) < 0.01)) && !['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'].some(k => parseFloat(cs['border' + k + 'Radius']) > 0);
      if (plain){
        const k = Math.min(1, 2400 / Math.max(el.naturalWidth, el.naturalHeight), Math.max(2 * r.width / el.naturalWidth, 0.25));
        const cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(el.naturalWidth * k)); cv.height = Math.max(1, Math.round(el.naturalHeight * k));
        cv.getContext('2d').drawImage(el, 0, 0, cv.width, cv.height);
        try { const png = /\.png|image\/png|\.svg|svg\+xml|\.gif/i.test(el.currentSrc || el.src); return { src: cv.toDataURL(png ? 'image/png' : 'image/jpeg', 0.9), natW: cv.width, natH: cv.height }; } catch (e) { return null; }
      }
    }
    if (el instanceof SVGSVGElement){ prepSvgs(); return svgData(el, r); }
    if (el.tagName === 'CANVAS'){
      try {
        // прозрачный слой для рисования поверх кадра (как у разборов) лёг бы
        // пустой картинкой на весь слайд и мешал бы выделять
        const t = document.createElement('canvas'); t.width = 96; t.height = 54;
        const tc = t.getContext('2d'); tc.drawImage(el, 0, 0, 96, 54);
        const d = tc.getImageData(0, 0, 96, 54).data; let any = false;
        for (let i = 3; i < d.length && !any; i += 4) if (d[i] > 8) any = true;
        if (!any) return { empty: true };
        return { src: el.toDataURL('image/png'), natW: el.width, natH: el.height };
      } catch (e) { return null; }
    }
    try {
      const cv = await html2canvas(el, { backgroundColor: null, scale: Math.min(3, Math.max(1, 1600 / Math.max(r.width, r.height))), logging: false, useCORS: true });
      return { src: cv.toDataURL('image/png'), natW: cv.width, natH: cv.height };
    } catch (e) { return null; }
  }

  /* html2canvas рисует svg своей сериализацией и часть значков теряет
     совсем (звезда у подписи в шаблоне разборов не рисовалась ни с какими
     стилями), а та же картинка через <img> рисуется всегда. Поэтому перед
     снимком видимые svg заменяются картинками ровно того же места: вид и
     положение переносятся вычисленными значениями, классы оставляем */
  const BOX_PROPS = ['display', 'position', 'left', 'top', 'right', 'bottom', 'transform', 'transform-origin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'vertical-align', 'flex', 'align-self', 'z-index', 'opacity', 'visibility', 'float'];
  async function svgToImg(root){
    const list = [...root.querySelectorAll('svg')].filter(sv => !sv.parentElement.closest('svg') && !sv.hasAttribute('data-marpit-svg') && !sv.closest('foreignObject'));
    for (const sv of list){
      const r = sv.getBoundingClientRect();
      if (!(r.width > 0.5 && r.height > 0.5)) continue;
      const cs = getComputedStyle(sv);
      if (cs.display === 'none') continue;
      const d = await svgData(sv, { width: sv.clientWidth || r.width, height: sv.clientHeight || r.height });
      const im = document.createElement('img');
      im.src = d.src;
      try { await im.decode(); } catch (e) { continue; }
      im.className = sv.getAttribute('class') || '';
      BOX_PROPS.forEach(p => im.style.setProperty(p, cs.getPropertyValue(p)));
      im.style.width = (sv.clientWidth || r.width) + 'px';
      im.style.height = (sv.clientHeight || r.height) + 'px';
      im.style.boxSizing = 'content-box';
      sv.replaceWith(im);
      undo.push(['swap', im, sv]);
    }
  }
  /* html2canvas рисует градиент холстом, а холст смешивает цвета без учёта
     прозрачности: «голубой → transparent» (transparent = чёрный с
     прозрачностью 0) по пути темнел, и мягкие цветные пятна на фоне
     выходили серыми. Заменяем каждый transparent тем же цветом соседней
     точки с прозрачностью 0 — так считает и сам браузер */
  function fixGrad(v){
    const out = [];
    let i = 0;
    while (i < v.length){
      const m = /(?:repeating-)?(?:linear|radial|conic)-gradient\(/g;
      m.lastIndex = i;
      const f = m.exec(v);
      if (!f){ out.push(v.slice(i)); break; }
      out.push(v.slice(i, f.index + f[0].length));
      let depth = 1, j = f.index + f[0].length;
      while (j < v.length && depth){ if (v[j] === '(') depth++; else if (v[j] === ')') depth--; j++; }
      const body = v.slice(f.index + f[0].length, j - 1);
      const cols = [];
      body.replace(/rgba?\([^)]*\)/g, (c, at) => { cols.push({ c, at }); return c; });
      let nb = body;
      for (let k = cols.length - 1; k >= 0; k--){
        if (!/^rgba\(\s*0,\s*0,\s*0,\s*0\s*\)$/.test(cols[k].c)) continue;
        const near = (cols[k - 1] && !/,\s*0\s*\)$/.test(cols[k - 1].c) && cols[k - 1]) || (cols[k + 1] && !/,\s*0\s*\)$/.test(cols[k + 1].c) && cols[k + 1]);
        if (!near) continue;
        const rgb = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(near.c);
        if (!rgb) continue;
        nb = nb.slice(0, cols[k].at) + 'rgba(' + rgb[1] + ', ' + rgb[2] + ', ' + rgb[3] + ', 0)' + nb.slice(cols[k].at + cols[k].c.length);
      }
      out.push(nb + ')');
      i = j;
    }
    return out.join('');
  }
  function fixGradients(root){
    [root, ...root.querySelectorAll('*')].forEach(e => {
      const bi = getComputedStyle(e).backgroundImage;
      if (!bi || bi === 'none' || bi.indexOf('gradient') < 0 || bi.indexOf('rgba(0, 0, 0, 0)') < 0) return;
      e.style.setProperty('background-image', fixGrad(bi), 'important');
    });
  }
  async function shoot(S, R, bg){
    const sc = Math.min(2, 2400 / Math.max(R.width, R.height));
    const opt = { backgroundColor: bg, scale: sc, logging: false, useCORS: true, windowWidth: VW(), windowHeight: VH(), scrollX: 0, scrollY: -window.scrollY };
    let el = S.frame;
    if (S.slice) Object.assign(opt, { x: 0, y: S.slice.y, width: VW(), height: S.slice.h, scrollY: 0 });
    prepSvgs();
    await svgToImg(el);
    fixGradients(el);
    const cv = await html2canvas(el, opt);
    return { src: cv.toDataURL('image/jpeg', 0.9), w: cv.width, h: cv.height };
  }

  /* Всё, что разборщик меняет в странице ради снимка (прячет текст и фон
     фигур, меняет svg на картинки), после слайда откатывается: фишки,
     рамки и подписи вокруг слайдов на сцене общие — без отката со второго
     слайда у них уже не было ни фона, ни значков */
  const undo = [];
  function setSt(el, p, v){
    undo.push(['st', el, p, el.style.getPropertyValue(p), el.style.getPropertyPriority(p)]);
    el.style.setProperty(p, v, 'important');
  }
  function rollback(){
    while (undo.length){
      const u = undo.pop();
      try {
        if (u[0] === 'st'){ if (u[3]) u[1].style.setProperty(u[2], u[3], u[4]); else u[1].style.removeProperty(u[2]); }
        else if (u[0] === 'wrap'){ if (u[1].parentNode) u[1].replaceWith(...u[1].childNodes); }
        else if (u[0] === 'swap'){ if (u[1].parentNode) u[1].replaceWith(u[2]); }
      } catch (e) {}
    }
  }
  async function slide(S, all, kind, mode){
    try { return await slide1(S, all, kind, mode); } finally { rollback(); }
  }
  async function slide1(S, all, kind, mode){
    await show(S, all, kind);
    finishAll();
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const R = frameRect(S);
    const bg = pageBg(S.frame === document.body ? document.body : S.frame);
    if (mode === 'img'){
      const notes = [...(S.slice ? [] : S.root.querySelectorAll('aside.notes,.speaker-notes,[data-notes]'))].map(e => (e.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
      if (!S.slice) S.root.querySelectorAll('aside.notes,.speaker-notes,[data-notes]').forEach(e => e.style.setProperty('display', 'none', 'important'));
      const shot = await shoot(S, R, bg);
      return { w: R.width, h: R.height, raster: shot.src, rw: shot.w, rh: shot.h, notes: notes.join('\n\n') };
    }
    const P = parse(S, R);
    const out = [];
    // картинки, формулы, svg — снять, пока видны
    let atoms = 0;
    for (const it of P.items){
      if (it.t !== 'atom') continue;
      const r = it.el.getBoundingClientRect();
      if (!(r.width > 2 && r.height > 2) || r.right < R.left || r.left > R.left + R.width || r.bottom < R.top || r.top > R.top + R.height) { it.skip = true; continue; }
      if (++atoms > 40) { it.skip = true; continue; }
      const d = await snap(it.el, r);
      if (!d || d.empty){ it.skip = true; continue; }
      Object.assign(it, d, { x: r.left - R.left, y: r.top - R.top, w: r.width, h: r.height });
    }
    // подложка: всё, что стало объектами, с неё убрать
    P.items.forEach(it => {
      if (it.skip) return;
      if (it.t === 'atom') setSt(it.el, 'visibility', 'hidden');
      if (it.t === 'box'){
        if (it.fill) setSt(it.el, 'background-color', 'transparent');
        if (it.line) setSt(it.el, 'border-color', 'transparent');
      }
      // маркер списка рисует сама надпись — родной с подложки убрать
      if (it.text && it.text.bu) setSt(it.el, 'list-style-type', 'none');
      // текст прячем обёрткой каждого куска, а не цветом блока: иначе
      // пропали бы и значки из ::before/::after, которых нет среди объектов
      (it.nodes || []).forEach(n => {
        if (!n.parentNode || (n.parentNode.classList && n.parentNode.classList.contains('mxio-t'))) return;
        const sp = document.createElement('span');
        sp.className = 'mxio-t';
        n.parentNode.insertBefore(sp, n);
        undo.push(['wrap', sp]);
        sp.appendChild(n);
      });
    });
    if (!S.slice) S.root.querySelectorAll('[data-mxio-notes]').forEach(e => e.style.setProperty('display', 'none', 'important'));
    await frames(1);
    const shot = await shoot(S, R, P.bgColor || bg);
    P.items.forEach(it => {
      if (it.skip) return;
      const o = { t: it.t === 'atom' ? 'img' : it.t, x: it.x, y: it.y, w: it.w, h: it.h };
      if (it.t === 'atom'){ Object.assign(o, { src: it.src, natW: it.natW, natH: it.natH }); if (it.op < 0.99) o.op = +it.op.toFixed(3); }
      if (it.t === 'box'){ Object.assign(o, { geom: it.geom, fill: it.fill, line: it.line }); if (it.adj != null) o.adj = it.adj; if (it.text){ o.text = it.text; o.pad = it.pad; o.anchor = it.anchor; } }
      if (it.t === 'text') o.text = it.text;
      // кусок слайда-страницы: надписи и фигуры, начавшиеся на другой странице, не берём
      if (S.slice && (o.y < -2 || o.y > R.height - 2)) return;
      out.push(o);
    });
    return { w: R.width, h: R.height, bg: P.bgColor || bg, under: shot.src, uw: shot.w, uh: shot.h, items: out, notes: P.notes.join('\n\n') };
  }

  /* ── запуск ─────────────────────────────────────────────────────────── */
  let found = null;
  async function ready(){
    freeze();
    if (document.fonts && document.fonts.ready) await Promise.race([document.fonts.ready, sleep(4000)]);
    // reveal.js и свои движки раскладывают слайды скриптом после загрузки
    for (let i = 0; i < 30 && window.Reveal && Reveal.isReady && !Reveal.isReady(); i++) await sleep(100);
    if (window.Reveal && Reveal.configure){
      try { Reveal.configure({ transition: 'none', backgroundTransition: 'none', margin: 0, controls: false, progress: false, slideNumber: false, autoSlide: 0, minScale: 1, maxScale: 1 }); } catch (e) {}
    }
    await sleep(350);
    finishAll();
    found = findSlides();
    let w = VW(), h = VH();
    if (found.kind === 'reveal'){
      const c = Reveal.getConfig ? Reveal.getConfig() : {};
      if (+c.width > 0) w = +c.width;
      if (+c.height > 0) h = +c.height;
    } else if (found.stage){
      const st = found.list[0].frame;
      await frames(2);
      w = st.offsetWidth; h = st.offsetHeight;
    } else if (found.kind !== 'page'){
      // настоящий размер слайда — без масштаба, которым движок вписал его в окно
      const vis = found.list.find(s => shown(s.frame)) || found.list[0];
      if (vis.frame.offsetWidth > 50 && vis.frame.offsetHeight > 50){ w = vis.frame.offsetWidth; h = vis.frame.offsetHeight; }
      else if (vis.frame.getBBox){ const b = vis.frame.getBoundingClientRect(); w = b.width || w; h = b.height || h; }
      if (found.kind === 'marp'){ const vb = vis.host.viewBox && vis.host.viewBox.baseVal; if (vb && vb.width) { w = vb.width; h = vb.height; } }
    }
    const missing = [...document.images].filter(im => im.complete && !im.naturalWidth && im.getAttribute('src')).length;
    send({ mxio: 'probe', n: found.list.length, w: Math.round(w), h: Math.round(h), kind: found.kind, missing, title: document.title || '' });
  }
  window.addEventListener('message', async (e) => {
    if (e.source !== parent || !e.data || e.data.mxio !== 'go') return;
    const { mode, from, to } = e.data;
    try {
      if (!found) found = findSlides();
      actCls = null;
      const list = found.list;
      for (let i = Math.max(0, from); i <= Math.min(list.length - 1, to); i++){
        const data = await slide(list[i], list, found.kind, mode);
        send({ mxio: 'slide', i, data });
      }
      send({ mxio: 'done' });
    } catch (err) { send({ mxio: 'err', msg: String(err && err.message || err) }); }
  });
  if (document.readyState === 'complete') ready().catch(err => send({ mxio: 'err', msg: String(err && err.message || err) }));
  else window.addEventListener('load', () => ready().catch(err => send({ mxio: 'err', msg: String(err && err.message || err) })));
})();
