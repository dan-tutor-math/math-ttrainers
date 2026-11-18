/* work-pdf.js — листы печати (DOM, свёрстанные work-print.js) → PDF-файл
   вектором: текст — текстом со встроенными шрифтами (выделяется, ищется,
   копируется), линии и рамки — линиями, рисунки — картинками внутри PDF.
   Задача 61, этап 2.

   Почему так, а не html2canvas + jsPDF (как было): тот путь фотографирует
   лист — текст в файле не выделяется и не ищется, формулы мылятся при
   увеличении. Печать браузера («Сохранить как PDF») даёт вектор, но кнопку
   «Сохранить» там нажимает пользователь, и в Safari на iPhone её нет.
   Здесь вёрстку делает сам браузер (те же листы, что уходят в печать), а мы
   переписываем готовый результат в PDF: у каждого слова берём место на листе
   (Range.getClientRects) и рисуем его тем же шрифтом в тот же пиксель.
   Переносы строк, колонки, дроби и KaTeX считать заново не нужно.

   Шрифты: тот же файл, что видел браузер, но в TTF (fonts/print/, делает
   tools/print/make_print_fonts.py): fontkit зависает на woff2 с составными
   глифами. Onest — по весам и наборам символов (unicode-range из onest.css),
   KaTeX — его семьи, символы, которых нет в Onest (∠ √ ∞ ⇒ ∥ ⩽ π α), —
   'WP Sym' (DejaVu Sans). Курсив Onest браузер рисует наклоном — и мы тоже.

   Библиотеки — vendor/pdf-lib-1.17.1/ (pdf-lib + fontkit, MIT), грузятся
   только при нажатии «Скачать PDF».

     WorkPDF.make(sheets, opts) → Promise<{ bytes, pages, missing, images }>
       sheets — элементы листов (.wp-sheet); лист с классом из opts.raster
       (по умолчанию .wp-off — официальные бланки) идёт картинкой через
       opts.rasterize(sheet) → canvas, как раньше.
       opts.title — заголовок документа.
       missing — символы, для которых не нашлось шрифта (не нарисованы). */
(function () {
  'use strict';
  if (window.WorkPDF) return;

  const BASE = (() => {
    const s = document.currentScript;
    return s && s.src ? s.src.replace(/[^/]*$/, '') : '';
  })();
  const PT = 0.75;                       // 1 CSS px = 0.75 pt (96 dpi)

  function script(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.onload = res;
      s.onerror = () => rej(new Error('не загрузилась библиотека ' + src));
      document.head.appendChild(s);
    });
  }
  let libsP = null;
  function libs() {
    if (libsP) return libsP;
    libsP = Promise.all([
      window.PDFLib ? 0 : script(BASE + 'vendor/pdf-lib-1.17.1/pdf-lib.min.js'),
      window.fontkit ? 0 : script(BASE + 'vendor/pdf-lib-1.17.1/fontkit.umd.min.js'),
    ]).then(() => {
      if (!window.PDFLib || !window.fontkit) throw new Error('pdf-lib не загрузился');
      return { P: window.PDFLib, fk: window.fontkit };
    }).catch(e => { libsP = null; throw e; });
    return libsP;
  }

  /* ── шрифты ── */
  // unicode-range «U+0400-045F, U+2116, U+4??» → [[от, до], …]
  function parseRanges(s) {
    if (!s) return null;
    const out = [];
    s.split(',').forEach(p => {
      const m = /U\+([0-9a-f?]+)(?:-([0-9a-f]+))?/i.exec(p.trim());
      if (!m) return;
      if (m[1].indexOf('?') >= 0) out.push([parseInt(m[1].replace(/\?/g, '0'), 16), parseInt(m[1].replace(/\?/g, 'f'), 16)]);
      else out.push([parseInt(m[1], 16), parseInt(m[2] || m[1], 16)]);
    });
    return out.length ? out : null;
  }
  const inRanges = (r, cp) => !r || r.some(x => cp >= x[0] && cp <= x[1]);
  const unq = s => s.trim().replace(/^["']|["']$/g, '');
  const famKey = s => unq(s).toLowerCase();
  function weights(w) {   // «400» | «bold» | «300 900» → [от, до]
    const a = String(w || '400').trim().split(/\s+/).map(x => x === 'bold' ? 700 : x === 'normal' ? 400 : Number(x) || 400);
    return [a[0], a[1] || a[0]];
  }

  // реестр начертаний: из @font-face страницы, файл — TTF-двойник в fonts/print/
  // реестр строится заново при каждой сборке (KaTeX и 'WP Sym' могли подключиться
  // позже), а разобранные файлы шрифтов живут в FILES — второй PDF не качает их снова
  let FACES = null;
  const FILES = {};
  function faces(fresh) {
    if (FACES && !fresh) return FACES;
    const list = [];
    const add = (fam, w, style, ranges, file) => list.push({ fam: famKey(fam), w, style: style === 'italic' || style === 'oblique' ? 'italic' : 'normal', ranges, file, fk: null });
    const rules = [];
    for (const sh of document.styleSheets) {
      let rs; try { rs = sh.cssRules; } catch (e) { continue; }
      for (const r of rs || []) if (r.type === 5 /* FONT_FACE */) rules.push(r.style);
    }
    const seen = new Set();
    rules.forEach(st => {
      const fam = famKey(st.getPropertyValue('font-family'));
      const src = st.getPropertyValue('src') || '';
      const ranges = parseRanges(st.getPropertyValue('unicode-range'));
      const style = (st.getPropertyValue('font-style') || 'normal').trim();
      const ww = weights(st.getPropertyValue('font-weight'));
      if (fam === 'onest') {
        // переменный Onest сайта → статические веса того же набора символов
        const m = /onest-([a-z-]+?)(?:-\d{3})?\.woff2/.exec(src);
        if (!m) return;
        [400, 500, 600, 700].forEach(w => {
          const k = 'onest|' + m[1] + '|' + w;
          if (seen.has(k)) return; seen.add(k);
          add('onest', [w, w], 'normal', ranges, 'fonts/print/onest-' + m[1] + '-' + w + '.ttf');
        });
      } else if (/^katex_/.test(fam)) {
        const it = style === 'italic', bold = ww[0] >= 600;
        const nm = st.getPropertyValue('font-family').trim().replace(/["']/g, '') + '-' + (bold ? (it ? 'BoldItalic' : 'Bold') : (it ? 'Italic' : 'Regular'));
        if (seen.has(nm)) return; seen.add(nm);
        add(fam, ww, style, ranges, 'fonts/print/' + nm + '.ttf');
      } else if (fam === 'wp sym') {
        const k = 'sym' + ww[0]; if (seen.has(k)) return; seen.add(k);
        add(fam, ww, 'normal', ranges, 'fonts/print/print-sym-' + (ww[0] >= 600 ? 700 : 400) + '.ttf');
      }
    });
    FACES = list;
    return list;
  }
  // подбор веса по правилам CSS: 400–500 — сначала до 500, потом легче, потом тяжелее;
  // меньше 400 — легче, потом тяжелее; больше 500 — тяжелее, потом легче
  function pickWeight(cands, w) {
    const dist = f => {
      const [a, b] = f.w;
      if (w >= a && w <= b) return 0;
      const near = w < a ? a : b;
      let d = Math.abs(near - w);
      if (w >= 400 && w <= 500) { if (near > w && near <= 500) d += 0; else if (near < w) d += 1000; else d += 2000; }
      else if (w < 400) { if (near > w) d += 1000; }
      else if (near < w) d += 1000;
      return d;
    };
    return cands.slice().sort((x, y) => dist(x) - dist(y))[0];
  }
  // начертание семьи для символа: стиль, вес, unicode-range
  function faceFor(fam, w, style, cp) {
    const all = faces().filter(f => f.fam === fam && inRanges(f.ranges, cp));
    if (!all.length) return null;
    let c = all.filter(f => f.style === style);
    if (!c.length) c = all;
    return pickWeight(c, w);
  }
  const FALLBACK = ['onest', 'wp sym'];   // что не нашлось в семьях элемента (KaTeX \text{кириллица})
  function families(st) {
    return st.fontFamily.split(',').map(famKey).filter(Boolean);
  }
  async function loadFace(f, fk) {
    if (f.fk || f.err) return f;
    if (!FILES[f.file]) FILES[f.file] = (async () => {
      const r = await fetch(BASE + f.file);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const bytes = new Uint8Array(await r.arrayBuffer());
      const font = fk.create(bytes);
      const os2 = font['OS/2'];
      const typo = os2 && (os2.fsSelection & 128);
      return { bytes, fk: font, upm: font.unitsPerEm,
        asc: typo ? os2.typoAscender : font.ascent, desc: Math.abs(typo ? os2.typoDescender : font.descent) };
    })();
    try { Object.assign(f, await FILES[f.file]); }
    catch (e) { f.err = String(e.message || e); delete FILES[f.file]; console.warn('[PDF] шрифт не загрузился', f.file, f.err); }
    return f;
  }
  const hasGlyph = (f, cp) => !!(f && f.fk && f.fk.hasGlyphForCodePoint(cp));

  /* ── цвета, видимость ── */
  function color(s) {
    const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/.exec(s || '');
    if (!m) return null;
    let a = m[4] == null ? 1 : (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]));
    return { r: +m[1] / 255, g: +m[2] / 255, b: +m[3] / 255, a };
  }
  const SKIP_CHARS = /[­​-‏⁠-⁤﻿]/g;

  /* ── проход 1: что нарисовать (замер в DOM, синхронно) ── */
  function collect(sheet) {
    const S = sheet.getBoundingClientRect();
    const ops = [];
    const chars = [];          // [семьи, вес, стиль, строка] — какие шрифты грузить
    const rel = r => ({ x: r.left - S.left, y: r.top - S.top, w: r.width, h: r.height });
    const range = document.createRange();
    const clipOf = el => {     // пересечение overflow:hidden предков в пределах листа
      let c = null;
      for (let p = el.parentElement; p && p !== sheet; p = p.parentElement) {
        const st = getComputedStyle(p);
        if (st.overflowX !== 'visible' || st.overflowY !== 'visible') {
          const r = rel(p.getBoundingClientRect());
          if (!c) c = r;
          else {
            const x = Math.max(c.x, r.x), y = Math.max(c.y, r.y);
            c = { x, y, w: Math.max(0, Math.min(c.x + c.w, r.x + r.w) - x), h: Math.max(0, Math.min(c.y + c.h, r.y + r.h) - y) };
          }
        }
      }
      return c;
    };
    function box(el, st) {
      const r = rel(el.getBoundingClientRect());
      if (r.w <= 0 && r.h <= 0) return;
      const bg = color(st.backgroundColor);
      const side = k => ({ w: parseFloat(st['border' + k + 'Width']) || 0, c: color(st['border' + k + 'Color']), s: st['border' + k + 'Style'] });
      const B = { T: side('Top'), R: side('Right'), Bo: side('Bottom'), L: side('Left') };
      const rad = parseFloat(st.borderTopLeftRadius) || 0;
      const vis = b => b.w > 0 && b.s !== 'none' && b.s !== 'hidden' && b.c && b.c.a > 0;
      if (rad >= Math.min(r.w, r.h) / 2 - 1 && r.w > 4 && r.h > 4 && (vis(B.T) || (bg && bg.a > 0))) {
        // круг (номер задания в кружке)
        ops.push({ t: 'ellipse', x: r.x, y: r.y, w: r.w, h: r.h, bw: vis(B.T) ? B.T.w : 0, bc: B.T.c, bg: bg && bg.a > 0 ? bg : null });
        return;
      }
      if (bg && bg.a > 0 && el !== sheet) ops.push({ t: 'rect', x: r.x, y: r.y, w: r.w, h: r.h, c: bg });
      if (vis(B.T)) ops.push({ t: 'rect', x: r.x, y: r.y, w: r.w, h: B.T.w, c: B.T.c, dash: B.T.s });
      if (vis(B.Bo)) ops.push({ t: 'rect', x: r.x, y: r.y + r.h - B.Bo.w, w: r.w, h: B.Bo.w, c: B.Bo.c, dash: B.Bo.s });
      if (vis(B.L)) ops.push({ t: 'rect', x: r.x, y: r.y, w: B.L.w, h: r.h, c: B.L.c, dash: B.L.s });
      if (vis(B.R)) ops.push({ t: 'rect', x: r.x + r.w - B.R.w, y: r.y, w: B.R.w, h: r.h, c: B.R.c, dash: B.R.s });
    }
    function text(node, st) {
      const data = node.data;
      if (!/\S/.test(data)) return;
      const fams = families(st);
      const w = Number(st.fontWeight) || 400;
      const style = st.fontStyle === 'normal' ? 'normal' : 'italic';
      const size = parseFloat(st.fontSize);
      const c = color(st.color) || { r: 0, g: 0, b: 0, a: 1 };
      if (c.a === 0) return;
      const tt = st.textTransform;
      const tf = s => tt === 'uppercase' ? s.toUpperCase() : tt === 'lowercase' ? s.toLowerCase() : s;
      const pre = /^pre/.test(st.whiteSpace);
      const re = pre ? /[^\n]+/g : /\S+/g;
      let m;
      while ((m = re.exec(data))) {
        const word = m[0];
        range.setStart(node, m.index); range.setEnd(node, m.index + word.length);
        const rs = [...range.getClientRects()].filter(r => r.width > 0 || r.height > 0);
        if (!rs.length) continue;
        const after = data.charAt(m.index + word.length);
        const sp = !pre && after !== '' && /\s/.test(after);
        if (rs.length === 1) {
          ops.push({ t: 'text', s: tf(word), sp, r: rel(rs[0]), node, i0: m.index, fams, w, style, size, c });
          chars.push([fams, w, style, word + (sp ? ' ' : '')]);
        } else {
          // слово разорвано на две строки (длинное без пробелов) — по буквам
          for (let k = 0; k < word.length; k++) {
            range.setStart(node, m.index + k); range.setEnd(node, m.index + k + 1);
            const r = range.getClientRects()[0];
            if (r) ops.push({ t: 'text', s: tf(word[k]), sp: false, r: rel(r), node, i0: m.index + k, fams, w, style, size, c });
          }
          chars.push([fams, w, style, word]);
        }
      }
    }
    function marker(li, st) {    // номер/точка у <li> списка (::marker в DOM нет)
      const t = st.listStyleType;
      if (!t || t === 'none' || st.display !== 'list-item') return;
      const p = li.parentElement;
      let s = '•';
      if (/decimal/.test(t)) {
        const idx = [...p.children].filter(x => x.tagName === 'LI').indexOf(li);
        s = (Number(p.getAttribute('start')) || 1) + idx + '.';
      } else if (t === 'circle') s = '◦'; else if (t === 'square') s = '▪';
      const first = document.createTreeWalker(li, NodeFilter.SHOW_TEXT, { acceptNode: n => /\S/.test(n.data) ? 1 : 3 }).nextNode();
      if (!first) return;
      range.selectNodeContents(first);
      const r = range.getClientRects()[0];
      if (!r) return;
      const L = rel(li.getBoundingClientRect());
      ops.push({ t: 'marker', s, right: L.x - 0.25 * parseFloat(st.fontSize), r: rel(r), fams: families(st), w: Number(st.fontWeight) || 400, style: 'normal', size: parseFloat(st.fontSize), c: color(st.color) || { r: 0, g: 0, b: 0, a: 1 }, node: first });
      chars.push([families(st), Number(st.fontWeight) || 400, 'normal', s]);
    }
    function walk(el) {
      const st = getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) return;
      if (el.classList.contains('katex-mathml')) return;
      if (el.tagName === 'svg' || el.tagName === 'SVG') { ops.push({ t: 'svg', el, r: rel(el.getBoundingClientRect()), clip: clipOf(el) }); return; }
      box(el, st);
      if (el.tagName === 'LI') marker(el, st);
      if (el.tagName === 'IMG') {
        if (el.complete && el.naturalWidth) {
          const r = rel(el.getBoundingClientRect());
          const pl = parseFloat(st.paddingLeft) + parseFloat(st.borderLeftWidth), pt = parseFloat(st.paddingTop) + parseFloat(st.borderTopWidth);
          const pr = parseFloat(st.paddingRight) + parseFloat(st.borderRightWidth), pb = parseFloat(st.paddingBottom) + parseFloat(st.borderBottomWidth);
          ops.push({ t: 'img', el, r: { x: r.x + pl, y: r.y + pt, w: r.w - pl - pr, h: r.h - pt - pb }, clip: clipOf(el) });
        }
        return;
      }
      if (el.tagName === 'CANVAS') { ops.push({ t: 'img', el, r: rel(el.getBoundingClientRect()), clip: clipOf(el) }); return; }
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.tagName === 'BUTTON') return;
      for (const ch of el.childNodes) {
        if (ch.nodeType === 1) walk(ch);
        else if (ch.nodeType === 3) text(ch, st);
      }
    }
    walk(sheet);
    range.detach && range.detach();
    return { w: S.width, h: S.height, ops, chars };
  }

  /* ── проход 2: шрифты под символы ── */
  function resolve(fams, w, style, cp) {
    for (const f of fams) { const fc = faceFor(f, w, style, cp); if (fc && hasGlyph(fc, cp)) return fc; }
    for (const f of FALLBACK) { const fc = faceFor(f, w, style === 'italic' ? 'italic' : 'normal', cp); if (fc && hasGlyph(fc, cp)) return fc; }
    return null;
  }
  // главный шрифт элемента — от него браузер считает высоту строки текста (а мы — базовую линию)
  function primary(fams, w, style) {
    for (const f of fams) { const fc = faceFor(f, w, style, 0x20) || faceFor(f, w, style, 0x41); if (fc && fc.fk) return fc; }
    return faceFor('onest', w, 'normal', 0x20);
  }
  async function loadFor(chars, fk) {
    const need = new Set();
    chars.forEach(([fams, w, style, s]) => {
      const cps = new Set([0x20, 0x41]);
      for (const ch of s.replace(SKIP_CHARS, '')) cps.add(ch.codePointAt(0));
      cps.forEach(cp => {
        fams.concat(FALLBACK).forEach(f => { const fc = faceFor(f, w, style, cp) || faceFor(f, w, 'normal', cp); if (fc) need.add(fc); });
      });
    });
    await Promise.all([...need].map(f => loadFace(f, fk)));
  }

  /* ── картинки ── */
  const isPng = b => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47;
  const isJpg = b => b[0] === 0xFF && b[1] === 0xD8;
  async function imageBytes(el, r) {
    const nat = el.tagName === 'CANVAS' ? el.width : el.naturalWidth;
    if (el.tagName === 'IMG') {
      try {
        const res = await fetch(el.currentSrc || el.src);
        const b = new Uint8Array(await res.arrayBuffer());
        // свой файл PNG/JPEG — как есть, если не огромный (больше 4× места на листе).
        // PNG с палитрой или серый (тип цвета не 2/6) — через холст: pdf-lib теряет у
        // палитры прозрачность (tRNS), и прозрачные края рисунка выходят тёмной рамкой
        const pngOk = isPng(b) && (b[25] === 2 || b[25] === 6);
        if ((pngOk || isJpg(b)) && nat <= r.w * 4) return { b, png: pngOk };
      } catch (e) { /* ниже — через холст */ }
    }
    // SVG, GIF, огромный снимок — через холст, 3× места на листе
    const k = Math.min(3, Math.max(1, (window.devicePixelRatio || 1) * 1.5));
    const W = Math.max(1, Math.round(Math.min(el.tagName === 'IMG' && !/\.svg(\?|$)/i.test(el.src) ? nat : 1e9, r.w * k)));
    const H = Math.max(1, Math.round(W * r.h / Math.max(1, r.w)));
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const cx = cv.getContext('2d');
    cx.fillStyle = '#fff'; cx.fillRect(0, 0, W, H);
    cx.drawImage(el, 0, 0, W, H);
    const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
    return { b: new Uint8Array(await blob.arrayBuffer()), png: true };
  }

  /* ── SVG внутри листа (корень у KaTeX √ и стрелок): пути — векторами ── */
  function svgPaths(svg) {
    const out = [];
    const num = (e, a) => parseFloat(e.getAttribute(a)) || 0;
    svg.querySelectorAll('path, line, rect, polyline, polygon').forEach(e => {
      let d = '';
      const tag = e.tagName.toLowerCase();
      if (tag === 'path') d = e.getAttribute('d') || '';
      else if (tag === 'line') d = 'M' + num(e, 'x1') + ' ' + num(e, 'y1') + 'L' + num(e, 'x2') + ' ' + num(e, 'y2');
      else if (tag === 'rect') { const x = num(e, 'x'), y = num(e, 'y'), w = num(e, 'width'), h = num(e, 'height'); d = `M${x} ${y}H${x + w}V${y + h}H${x}Z`; }
      else { const p = (e.getAttribute('points') || '').trim().split(/[\s,]+/); for (let i = 0; i + 1 < p.length; i += 2) d += (i ? 'L' : 'M') + p[i] + ' ' + p[i + 1]; if (tag === 'polygon') d += 'Z'; }
      if (!d) return;
      const st = getComputedStyle(e);
      out.push({ d, fill: st.fill === 'none' ? null : color(st.fill), stroke: st.stroke === 'none' ? null : color(st.stroke), sw: parseFloat(st.strokeWidth) || 1 });
    });
    return out;
  }

  /* ── сборка ── */
  async function make(sheets, opts) {
    opts = opts || {};
    const { P, fk } = await libs();
    const { PDFDocument, rgb, degrees, pushGraphicsState, popGraphicsState, rectangle, clip, endPath, concatTransformationMatrix } = P;
    const doc = await PDFDocument.create();
    doc.registerFontkit(fk);
    if (opts.title) doc.setTitle(opts.title);
    doc.setCreator('Mathh'); doc.setProducer('Mathh (pdf-lib)');
    const missing = new Set();
    const imgCache = new Map();
    const docFonts = new Map();     // файл шрифта → встроенный в этот PDF
    faces(true);
    let images = 0;
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const rasterSel = opts.raster == null ? '.wp-off' : opts.raster;

    for (const sheet of sheets) {
      const land = sheet.classList.contains('l');
      const PW = land ? 841.89 : 595.28, PH = land ? 595.28 : 841.89;
      const page = doc.addPage([PW, PH]);
      if (rasterSel && sheet.matches(rasterSel)) {
        // официальный бланк — картинкой, как было (вёрстку бланков не трогаем)
        const cv = await opts.rasterize(sheet);
        const im = await doc.embedJpg(await (await fetch(cv.toDataURL('image/jpeg', 0.92))).arrayBuffer());
        page.drawImage(im, { x: 0, y: 0, width: PW, height: PH });
        continue;
      }
      const R = collect(sheet);
      await loadFor(R.chars, fk);
      const k = PW / R.w;           // лист 210 мм → 595 pt (≈ 0,75 pt на px)
      const X = x => x * k, Y = y => PH - y * k;
      const col = c => rgb(Math.min(1, c.r), Math.min(1, c.g), Math.min(1, c.b));
      const withClip = (c, fn) => {
        if (!c) return fn();
        page.pushOperators(pushGraphicsState(), rectangle(X(c.x), Y(c.y + c.h), c.w * k, c.h * k), clip(), endPath());
        fn();
        page.pushOperators(popGraphicsState());
      };
      const pdfFont = f => {
        if (!docFonts.has(f.file)) docFonts.set(f.file, doc.embedFont(f.bytes, { subset: true }));
        return docFonts.get(f.file);
      };
      for (const op of R.ops) {
        if (op.t === 'rect') {
          page.drawRectangle({ x: X(op.x), y: Y(op.y + op.h), width: Math.max(0.2, op.w * k), height: Math.max(0.2, op.h * k), color: col(op.c), opacity: op.c.a });
        } else if (op.t === 'ellipse') {
          const bw = op.bw * k;
          page.drawEllipse({ x: X(op.x + op.w / 2), y: Y(op.y + op.h / 2), xScale: op.w * k / 2 - bw / 2, yScale: op.h * k / 2 - bw / 2,
            color: op.bg ? col(op.bg) : undefined, borderColor: op.bw ? col(op.bc) : undefined, borderWidth: bw || undefined });
        } else if (op.t === 'img') {
          if (op.r.w <= 0 || op.r.h <= 0) continue;
          const key = (op.el.currentSrc || op.el.src || '') + '|' + Math.round(op.r.w);
          let im = op.el.tagName === 'IMG' ? imgCache.get(key) : null;
          if (!im) {
            try {
              const { b, png } = await imageBytes(op.el, op.r);
              im = png ? await doc.embedPng(b) : await doc.embedJpg(b);
              if (op.el.tagName === 'IMG') imgCache.set(key, im);
            } catch (e) { console.warn('[PDF] картинка не встроилась', e); continue; }
          }
          images++;
          withClip(op.clip, () => page.drawImage(im, { x: X(op.r.x), y: Y(op.r.y + op.r.h), width: op.r.w * k, height: op.r.h * k }));
        } else if (op.t === 'svg') {
          const svg = op.el, r = op.r;
          const vb = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
          if (vb.length !== 4 || !vb[2] || !vb[3] || r.w <= 0 || r.h <= 0) continue;
          const par = (svg.getAttribute('preserveAspectRatio') || 'xMidYMid meet').trim().split(/\s+/);
          let sx = r.w / vb[2], sy = r.h / vb[3], tx = 0, ty = 0;
          if (par[0] !== 'none') {
            const s = par[1] === 'slice' ? Math.max(sx, sy) : Math.min(sx, sy);
            const ax = /xMid/.test(par[0]) ? 0.5 : /xMax/.test(par[0]) ? 1 : 0, ay = /YMid/.test(par[0]) ? 0.5 : /YMax/.test(par[0]) ? 1 : 0;
            tx = (r.w - vb[2] * s) * ax; ty = (r.h - vb[3] * s) * ay; sx = sy = s;
          }
          const c = op.clip ? { x: Math.max(op.clip.x, r.x), y: Math.max(op.clip.y, r.y), w: 0, h: 0 } : r;
          if (op.clip) { c.w = Math.min(op.clip.x + op.clip.w, r.x + r.w) - c.x; c.h = Math.min(op.clip.y + op.clip.h, r.y + r.h) - c.y; }
          withClip(c, () => svgPaths(svg).forEach(p => {
            page.pushOperators(pushGraphicsState(), concatTransformationMatrix(sx * k, 0, 0, sy * k, X(r.x + tx), Y(r.y + ty)));
            page.drawSvgPath(p.d, { x: -vb[0], y: vb[1], scale: 1, color: p.fill ? col(p.fill) : undefined,
              borderColor: p.stroke ? col(p.stroke) : undefined, borderWidth: p.stroke ? p.sw : undefined });
            page.pushOperators(popGraphicsState());
          }));
        } else if (op.t === 'text' || op.t === 'marker') {
          const prim = primary(op.fams, op.w, op.style);
          const r = op.r;
          // базовая линия: высота прямоугольника текста = (ascent + descent) главного шрифта
          const base = prim && prim.fk ? r.y + r.h / 2 + (prim.asc - prim.desc) / (prim.asc + prim.desc) * r.h / 2 : r.y + r.h * 0.8;
          const src = op.s.replace(SKIP_CHARS, '') + (op.sp ? ' ' : '');
          // участки одним шрифтом: буквы — Onest, ∠ — WP Sym, и т. д.
          const segs = [];
          for (const ch of src) {
            const cp = ch.codePointAt(0);
            const f = resolve(op.fams, op.w, op.style, cp);
            if (!f) { if (ch !== ' ') missing.add(ch); continue; }
            const last = segs[segs.length - 1];
            if (last && last.f === f) last.s += ch; else segs.push({ f, s: ch });
          }
          let x = op.t === 'marker' ? null : r.x;
          if (op.t === 'marker') {
            const wpx = segs.reduce((a, g) => a + g.f.fk.layout(g.s).advanceWidth / g.f.upm * op.size, 0);
            x = op.right - wpx;
          }
          for (const g of segs) {
            const font = await pdfFont(g.f);
            const skew = op.style === 'italic' && g.f.style !== 'italic';
            page.drawText(g.s, { x: X(x), y: Y(base), size: op.size * k, font, color: col(op.c), opacity: op.c.a < 1 ? op.c.a : undefined,
              ySkew: skew ? degrees(14) : undefined });
            x += g.f.fk.layout(g.s).advanceWidth / g.f.upm * op.size;
          }
        }
      }
    }
    const bytes = await doc.save({ useObjectStreams: false });
    return { bytes, pages: doc.getPageCount(), missing: [...missing], images };
  }

  window.WorkPDF = { make, libs, faces: () => faces(), _collect: collect };
})();
