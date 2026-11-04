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
      if (big) return { kind: sel, list: els.map(el => ({ root: el, host: el, frame: el })) };
    }
    // один длинный документ: режем на страницы по высоте окна
    const H = Math.max(VH(), document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0);
    const n = H > VH() * 1.25 ? Math.min(60, Math.ceil(H / VH() - 0.05)) : 1;
    const list = [];
    for (let i = 0; i < n; i++) list.push({ root: document.body, host: null, frame: document.body, slice: { y: i * VH(), h: VH() } });
    return { kind: 'page', list };
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
  async function show(S, all, kind){
    if (kind === 'reveal'){
      const ix = Reveal.getIndices(S.root);
      Reveal.slide(ix.h, ix.v, ix.f);
      await frames(3);
      return;
    }
    if (S.slice){ window.scrollTo(0, 0); await frames(2); return; }
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
     ученика), поэтому «Inter» или «Unbounded» станут ближайшим из её семи */
  const SERIF = /serif|georgia|times|garamond|palatino|cambria|merriweather|lora|playfair|pt serif|noto serif|source serif|crimson|baskerville/i;
  const MONO = /mono|courier|consolas|menlo|monaco|code/i;
  function family(ff){
    const list = String(ff || '').split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
    const known = ['Calibri', 'Arial', 'Helvetica', 'Times New Roman', 'Cambria', 'Courier New', 'PT Sans', 'PT Serif', 'Georgia', 'Verdana', 'Tahoma', 'Segoe UI', 'Roboto', 'Open Sans', 'Montserrat', 'Consolas'];
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
    if (el instanceof SVGSVGElement){ inlineSvg(el); return svgData(el, r); }
    if (el.tagName === 'CANVAS'){ try { return { src: el.toDataURL('image/png'), natW: el.width, natH: el.height }; } catch (e) { return null; } }
    try {
      const cv = await html2canvas(el, { backgroundColor: null, scale: Math.min(3, Math.max(1, 1600 / Math.max(r.width, r.height))), logging: false, useCORS: true });
      return { src: cv.toDataURL('image/png'), natW: cv.width, natH: cv.height };
    } catch (e) { return null; }
  }

  async function shoot(S, R, bg){
    const sc = Math.min(2, 2400 / Math.max(R.width, R.height));
    const opt = { backgroundColor: bg, scale: sc, logging: false, useCORS: true, windowWidth: VW(), windowHeight: VH(), scrollX: 0, scrollY: -window.scrollY };
    let el = S.frame;
    if (S.slice) Object.assign(opt, { x: 0, y: S.slice.y, width: VW(), height: S.slice.h, scrollY: 0 });
    document.querySelectorAll('svg').forEach(inlineSvg);
    const cv = await html2canvas(el, opt);
    return { src: cv.toDataURL('image/jpeg', 0.9), w: cv.width, h: cv.height };
  }

  async function slide(S, all, kind, mode){
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
      if (!d){ it.skip = true; continue; }
      Object.assign(it, d, { x: r.left - R.left, y: r.top - R.top, w: r.width, h: r.height });
    }
    // подложка: всё, что стало объектами, с неё убрать
    P.items.forEach(it => {
      if (it.skip) return;
      if (it.t === 'atom') it.el.style.setProperty('visibility', 'hidden', 'important');
      if (it.t === 'box'){
        if (it.fill) it.el.style.setProperty('background-color', 'transparent', 'important');
        if (it.line) it.el.style.setProperty('border-color', 'transparent', 'important');
      }
      // маркер списка рисует сама надпись — родной с подложки убрать
      if (it.text && it.text.bu) it.el.style.setProperty('list-style-type', 'none', 'important');
      // текст прячем обёрткой каждого куска, а не цветом блока: иначе
      // пропали бы и значки из ::before/::after, которых нет среди объектов
      (it.nodes || []).forEach(n => {
        if (!n.parentNode || (n.parentNode.classList && n.parentNode.classList.contains('mxio-t'))) return;
        const sp = document.createElement('span');
        sp.className = 'mxio-t';
        n.parentNode.insertBefore(sp, n);
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
      found = findSlides();
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
