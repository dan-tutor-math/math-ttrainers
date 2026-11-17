/* ═══════════════════════════════════════════════════════════════════════
   tools/cards/collect.js — сбор сырого задания с живой страницы тренажёра
   для карточки ФИПИ (задача 63). Работает в tools/cards/harness.html, тренажёр —
   в кадре #f того же сайта. Зовёт его build.py (Playwright) через
   window.CardCollect; ученикам и учителю не подключается.

   Почему с живой страницы, а не из файла банка: условие строит функция
   страницы (у ОГЭ №6–9 — из параметров), формулы рисует KaTeX страницы, и
   карточка должна совпасть с тем, что видит ученик. Обратное превращение
   идёт по самому DOM: KaTeX → его исходный TeX (annotation), картинка,
   холст, svg → отдельный файл, таблица → table карточки, кнопки, поля и
   подписи интерфейса выбрасываются.

   Ответ — тем же trainerTaskInfo (trainer-tasks.js), что у конструктора
   работ при «Добавить в работу»: ответ карточки = ответ живого задания.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const frame = () => document.getElementById('f');
  const W = () => frame().contentWindow;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // теги, которые карточка хранит как есть (остальные разворачиваются в детей)
  const KEEP = ['b', 'strong', 'i', 'em', 'u', 's', 'sub', 'sup', 'br', 'p', 'div', 'span', 'ol', 'ul', 'li', 'nobr'];
  // элементы интерфейса — в карточку не идут никогда
  const DROP_TAGS = ['button', 'input', 'select', 'textarea', 'script', 'style', 'noscript', 'template', 'label', 'form', 'video', 'audio', 'iframe'];
  const DROP_SEL = ['.source-note', '.tc-cur', '.check-btn', '.change-answer-btn', '.answer-area', '.input-answer-row',
    '.card-btn-row', '.manual-note', '.ege-source', '.soft-btn', '.sol-btn-row', '#feedback', '[aria-hidden="true"]:not(.katex-html)'];
  // классы страницы → классы карточки (у карточки свой словарь, см. card-render.js);
  // класс, которого здесь нет, выбрасывается
  const CLASS_MAP = {
    'expr-display': 'c-eq', 'frac': 'c-frac', 'num': 'c-num', 'den': 'c-den', 'op': 'c-op',
    'sol-line': 'c-line', 'vf': 'c-frac',
  };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\$/g, '&#36;');

  async function open(href, timeout) {
    const f = frame();
    const t0 = Date.now();
    f.src = 'about:blank';
    await sleep(30);
    f.src = '../../' + href;
    // страница готова, когда есть каталог и (если есть KaTeX) шрифты формул прогреты
    for (;;) {
      await sleep(80);
      let w = null;
      try { w = f.contentWindow; } catch (e) {}
      const ok = w && w.document && w.document.readyState === 'complete' && w.__trainerCatalog
        && (!w.katex || w.document.documentElement.classList.contains('katex-fonts-ready') || Date.now() - t0 > 4000);
      if (ok) break;
      if (Date.now() - t0 > (timeout || 30000)) throw new Error('страница не загрузилась: ' + href);
    }
    const w = W();
    const item = typeof ttPanelItemForLocation === 'function' ? ttPanelItemForLocation(w.location) : null;
    const file = w.location.pathname.split('/').pop().replace(/\.html$/, '');
    const nq = new URLSearchParams(w.location.search).get('n');
    const n = nq != null ? Number(nq) : null;
    const spec = window.ExamSpec ? ExamSpec.find(file, n) : null;
    return { tid: item ? item.id : null, slug: file, n, spec: spec ? JSON.parse(JSON.stringify(spec)) : null };
  }

  async function list(n) {
    const l = await W().__trainerCatalog.list(n);
    return JSON.parse(JSON.stringify(l || []));
  }

  async function openAt(proto, pos, n) {
    const r = await W().__trainerCatalog.openAt(proto, pos, n);
    // две отрисовки: KaTeX и картинки ставятся после openAt
    await new Promise(res => W().requestAnimationFrame(() => W().requestAnimationFrame(res)));
    await waitImages();
    return JSON.parse(JSON.stringify(r || {}));
  }

  async function waitImages() {
    const doc = W().document;
    const t0 = Date.now();
    for (;;) {
      const imgs = [...doc.images].filter(i => i.offsetParent !== null);
      if (imgs.every(i => i.complete)) return;
      if (Date.now() - t0 > 8000) return;
      await sleep(50);
    }
  }

  function hidden(el) {
    const cs = el.ownerDocument.defaultView.getComputedStyle(el);
    return cs.display === 'none' || cs.visibility === 'hidden';
  }

  // svg с вычисленными цветами: в карточке нет CSS страницы (переменные темы,
  // классы), поэтому заливку и обводку переносим в атрибуты
  function svgMarkup(svg) {
    const win = svg.ownerDocument.defaultView;
    const clone = svg.cloneNode(true);
    const src = [svg, ...svg.querySelectorAll('*')];
    const dst = [clone, ...clone.querySelectorAll('*')];
    src.forEach((s, i) => {
      const cs = win.getComputedStyle(s), d = dst[i];
      ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity', 'font-size', 'font-family', 'font-style', 'font-weight', 'text-anchor', 'dominant-baseline'].forEach(p => {
        const v = cs.getPropertyValue(p);
        if (v && v !== 'normal' && !(p === 'opacity' && v === '1')) d.setAttribute(p, v);
      });
      d.removeAttribute('class'); d.removeAttribute('style');
    });
    const r = svg.getBoundingClientRect();
    if (!clone.getAttribute('viewBox')) clone.setAttribute('viewBox', '0 0 ' + Math.round(r.width) + ' ' + Math.round(r.height));
    clone.setAttribute('width', Math.round(r.width)); clone.setAttribute('height', Math.round(r.height));
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    return new XMLSerializer().serializeToString(clone);
  }

  /* узел страницы → { html, figs, tables }. figs — что сохранить отдельными
     файлами (build.py пишет их в cards/img/<slug>/), в html на их месте
     [[fig:k]]; tables — [[table:k]]. opts.drop — ещё селекторы интерфейса,
     opts.classMap — ещё классы страницы (семья знает свои) */
  function convert(root, opts) {
    opts = opts || {};
    const drop = DROP_SEL.concat(opts.drop || []).join(',');
    const cmap = Object.assign({}, CLASS_MAP, opts.classMap || {});
    const figs = [], tables = [], tex = [];
    function walk(node) {
      if (node.nodeType === 3) return esc(node.nodeValue);
      if (node.nodeType !== 1) return '';
      const el = node, tag = el.tagName.toLowerCase();
      if (DROP_TAGS.indexOf(tag) >= 0) return '';
      if (el.matches && el.matches(drop)) return '';
      if (tag !== 'svg' && el.namespaceURI === 'http://www.w3.org/1999/xhtml' && hidden(el)) return '';
      if (el.classList.contains('katex-display') || el.classList.contains('katex')) {
        const a = el.querySelector('annotation[encoding="application/x-tex"]');
        const src = a ? a.textContent.trim() : el.textContent;
        tex.push(src);
        return el.classList.contains('katex-display') ? '$$' + src + '$$' : '$' + src + '$';
      }
      if (tag === 'img') {
        const r = el.getBoundingClientRect();
        figs.push({ kind: 'img', src: el.currentSrc || el.src, nw: el.naturalWidth, nh: el.naturalHeight,
          dw: Math.round(r.width), dh: Math.round(r.height), alt: el.getAttribute('alt') || '' });
        return '[[fig:' + (figs.length - 1) + ']]';
      }
      if (tag === 'canvas') {
        const r = el.getBoundingClientRect();
        let data = null;
        try { data = el.toDataURL('image/png'); } catch (e) {}
        figs.push({ kind: 'canvas', data, nw: el.width, nh: el.height, dw: Math.round(r.width), dh: Math.round(r.height), alt: el.getAttribute('aria-label') || '' });
        return '[[fig:' + (figs.length - 1) + ']]';
      }
      if (tag === 'svg') {
        const r = el.getBoundingClientRect();
        figs.push({ kind: 'svg', markup: svgMarkup(el), nw: Math.round(r.width), nh: Math.round(r.height),
          dw: Math.round(r.width), dh: Math.round(r.height), alt: el.getAttribute('aria-label') || '' });
        return '[[fig:' + (figs.length - 1) + ']]';
      }
      if (tag === 'table') {
        const rows = [...el.rows].map(tr => [...tr.cells].map(td => inner(td).trim()));
        const head = el.tHead && el.tHead.rows.length ? rows.shift() : null;
        tables.push({ head, rows });
        return '[[table:' + (tables.length - 1) + ']]';
      }
      const body = inner(el);
      if (KEEP.indexOf(tag) < 0) return body;
      const cls = [...el.classList].map(c => cmap[c]).filter(Boolean);
      if (tag === 'span' && !cls.length) return body;
      if (tag === 'br') return '<br>';
      return '<' + tag + (cls.length ? ' class="' + cls.join(' ') + '"' : '') + '>' + body + '</' + tag + '>';
    }
    function inner(el) { return [...el.childNodes].map(walk).join(''); }
    let html = inner(root);
    // пробелы как в вёрстке, без переносов исходника; пустые обёртки — прочь
    html = html.replace(/\s+/g, ' ');
    for (let i = 0; i < 4; i++) html = html.replace(/<(div|span|p)>\s*<\/\1>/g, '').replace(/<div>\s*(\[\[(?:fig|table):\d+\]\])\s*<\/div>/g, '$1');
    html = html.replace(/\s*(<\/?(?:div|p|ol|ul|li)\b[^>]*>)\s*/g, '$1').trim();
    return { html, figs, tables, tex };
  }

  // главный узел задания — первый из TRAINER_CAPTURE (тот же, что снимает конструктор)
  function mainNode(tid) {
    const nodes = collectTrainerCaptureNodes(W().document, tid);
    nodes.forEach(x => { try { x.restore && x.restore(); } catch (e) {} });
    const main = nodes.find(x => !(x.el.closest && x.el.closest('.added-task-card')));
    return main ? main.el : null;
  }

  // сырое задание: разметка узла, ответ живого задания, видимый текст (для сверки)
  function grab(tid, opts) {
    const el = mainNode(tid);
    if (!el) return { err: 'нет узла задания (TRAINER_CAPTURE ' + tid + ')' };
    const info = trainerTaskInfo(W(), tid, el);
    const conv = convert(el, opts);
    return Object.assign(conv, { info: info ? JSON.parse(JSON.stringify(info)) : null, sel: el.id ? '#' + el.id : null });
  }

  /* готовая разметка банка (разбор explain, утверждение) → разметка карточки тем же
     convert: узел временно ставится в документ сборщика, чтобы видеть стили */
  function convertHtml(html, opts) {
    const box = document.createElement('div');
    box.innerHTML = html;
    document.body.appendChild(box);
    try { return convert(box, opts); } finally { box.remove(); }
  }

  // выражение в окне тренажёра (банк страницы, прототип) — для normalize семьи
  function evalIn(expr) {
    try { return JSON.parse(JSON.stringify(W().eval(expr))); } catch (e) { return { __err: String(e) }; }
  }

  window.CardCollect = { open, list, openAt, grab, convert, convertHtml, evalIn, mainNode };
})();
