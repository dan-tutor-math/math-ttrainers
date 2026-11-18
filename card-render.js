/* ═══════════════════════════════════════════════════════════════════════
   card-render.js — карточка задания ФИПИ → DOM (задача 63).
   Один рендер для конструктора работ, страницы ученика и печати/PDF:
   только условие, рисунки, таблицы, варианты, по запросу — ответ, разбор и
   источник. Кнопок, полей ввода и подписей сайта нет: их ставит хозяин
   (work.html — поле ответа и выбор вариантов по data-opt, печать — бланк).

   Формат карточки — cards/_schema.json, решение — memory/decisions.md.
   Формулы: TeX в $…$ / $$…$$ рисует KaTeX (katex-0.18.5.js — тот же, что у
   тренажёров; в печати это текст со шрифтами, то есть вектор), простая
   запись — HTML (курсив, степени, дроби .c-frac). Рисунки — отдельные файлы
   cards/img/…: в печать и PDF идут файлом, а не снимком страницы.

     CardRender.render(card, opts) → HTMLElement (div.cr)
       opts.base     — где лежит папка карточек (по умолчанию 'cards/')
       opts.num      — номер задания в работе: «1.» перед условием (null — без)
       opts.source   — подпись источника под условием (по умолчанию нет)
       opts.answer   — строка «Ответ: …» (для учителя / ключа)
       opts.solution — разбор
       opts.root     — путь к корню сайта для аудио ('' по умолчанию)
       opts.print    — печать: чёрный текст, без фона, рисунок не рвётся листом
     CardRender.ready(cards, opts) → Promise: подгружает KaTeX, если он нужен
       карточкам и его нет на странице (opts.root — путь к корню сайта, '' )
     CardRender.needsTex(card) → true, если в карточке есть формулы TeX
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.CardRender) return;

  const CSS = `
.cr{font-family:var(--card-font,'Onest',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif);
  font-size:var(--card-size,18px);line-height:1.55;font-weight:400;color:var(--card-ink,inherit);text-align:left;overflow-wrap:break-word;}
.cr *{box-sizing:border-box;}
.cr-num{font-weight:700;margin-right:.35em;}
.cr-text>div+div{margin-top:.35em;}
.cr .c-eq{font-size:1.37em;text-align:center;padding:.5em 0 .2em;line-height:1.4;}
.cr .c-frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.3;margin:0 .15em;}
.cr .c-num{padding:0 .3em .15em;}
.cr .c-den{padding:.15em .3em 0;border-top:.07em solid currentColor;}
.cr .c-frac .c-frac{font-size:.72em;}
.cr .c-op{margin:0 .4em;}
.cr .c-line{margin:.15em 0;}
.cr .katex{font-size:1.06em;}
.cr .katex-display{margin:.5em 0;overflow-x:auto;overflow-y:hidden;}
.cr-fig{margin:.7em auto .2em;break-inside:avoid;page-break-inside:avoid;}
.cr-fig img{display:block;margin:0 auto;width:100%;height:auto;background:#fff;border-radius:4px;}
.cr-table{border-collapse:collapse;margin:.6em auto;font-size:.92em;break-inside:avoid;}
.cr-table th,.cr-table td{border:1px solid currentColor;padding:.25em .6em;text-align:center;}
.cr-opts{list-style:none;margin:.7em 0 0;padding:0;display:flex;flex-direction:column;gap:.4em;}
.cr-opt{display:flex;gap:.6em;align-items:flex-start;}
.cr-text>.cr-opts{margin-bottom:.7em;}
.cr-optn{font-weight:700;flex:0 0 auto;}
.cr-audio{display:block;width:100%;margin:0 0 .7em;}
.cr-crit{margin-top:.6em;font-size:.92em;}
.cr-src{font-size:.7em;color:var(--card-muted,#6e6e73);margin-top:.7em;}
.cr-ans{margin-top:.7em;}
.cr-sol{margin-top:.8em;padding-top:.6em;border-top:1px solid var(--card-line,rgba(127,127,127,.35));}
.cr-sol-h{font-weight:700;margin-bottom:.2em;}
.cr.cr-print{color:#000;}
.cr.cr-print .cr-src{color:#444;}
.cr.cr-print .cr-fig img{border-radius:0;}
`;

  function css() {
    if (document.getElementById('card-render-css')) return;
    const st = document.createElement('style');
    st.id = 'card-render-css';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  const TEX_RE = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
  function needsTex(card) {
    return !!card && card.math === 'tex';
  }
  // TeX → разметка KaTeX тем же вызовом, что у страниц тренажёров (rich в ege_prof.html):
  // htmlAndMathml — видимая часть HTML, для чтения с экрана и копирования — MathML
  function tex(src, display) {
    if (!window.katex) return null;
    try { return window.katex.renderToString(src, { throwOnError: false, output: 'htmlAndMathml', displayMode: !!display }); }
    catch (e) { return null; }
  }
  function rich(html, card) {
    if (!html) return '';
    if (!needsTex(card)) return html;
    if (!window.katex) console.warn('CardRender: нет KaTeX — формулы остались TeX (CardRender.ready)');
    return html.replace(TEX_RE, (m, disp, inl) => {
      const out = disp != null ? tex(disp, true) : tex(inl, false);
      return out == null ? m : out;
    });
  }

  function figEl(f, base, opts) {
    const box = document.createElement('div');
    box.className = 'cr-fig';
    const img = document.createElement('img');
    img.src = base + f.file;
    img.alt = f.alt || '';
    // ширина и высота файла — место под рисунок до загрузки (страница не прыгает)
    img.width = f.w; img.height = f.h;
    img.decoding = 'async';
    if (f.maxw) box.style.maxWidth = f.maxw + 'px';
    else box.style.maxWidth = f.w + 'px';
    box.appendChild(img);
    return box;
  }
  function tableEl(t, card) {
    const tb = document.createElement('table');
    tb.className = 'cr-table';
    let h = '';
    if (t.head && t.head.length) h += '<thead><tr>' + t.head.map(x => '<th>' + rich(x, card) + '</th>').join('') + '</tr></thead>';
    h += '<tbody>' + t.rows.map(r => '<tr>' + r.map(x => '<td>' + rich(x, card) + '</td>').join('') + '</tr>').join('') + '</tbody>';
    tb.innerHTML = h;
    return tb;
  }

  function render(card, opts) {
    opts = opts || {};
    css();
    const base = opts.base == null ? 'cards/' : opts.base;
    const root = document.createElement('div');
    root.className = 'cr' + (opts.print ? ' cr-print' : '');
    root.dataset.card = card.id;

    // аудиозапись (английский): плеер перед условием, файл — по пути от корня сайта (opts.root)
    if (!opts.print) (card.audio || []).forEach(a => {
      const au = document.createElement('audio');
      au.className = 'cr-audio'; au.controls = true; au.preload = 'none';
      au.src = (opts.root || '') + a;
      root.appendChild(au);
    });

    // условие: метки [[fig:k]] / [[table:k]] → заглушки, после разметки — настоящие узлы
    const text = document.createElement('div');
    text.className = 'cr-text';
    const used = { fig: new Set(), table: new Set() };
    const html = rich(card.text, card).replace(/\[\[opts\]\]/, '<span data-cr-opts></span>').replace(/\[\[(fig|table):(\d+)\]\]/g, (m, kind, k) => {
      used[kind].add(Number(k));
      return '<span data-cr-' + kind + '="' + k + '"></span>';
    });
    text.innerHTML = html;
    if (opts.num != null) {
      const num = document.createElement('span');
      num.className = 'cr-num';
      num.textContent = opts.num + '.';
      const first = text.firstElementChild && text.firstElementChild.tagName === 'DIV' ? text.firstElementChild : text;
      first.insertBefore(num, first.firstChild);
    }
    text.querySelectorAll('[data-cr-fig]').forEach(s => {
      const f = (card.figs || [])[Number(s.dataset.crFig)];
      if (f) s.replaceWith(figEl(f, base, opts)); else s.remove();
    });
    text.querySelectorAll('[data-cr-table]').forEach(s => {
      const t = (card.table || [])[Number(s.dataset.crTable)];
      if (t) s.replaceWith(tableEl(t, card)); else s.remove();
    });
    root.appendChild(text);
    // рисунки и таблицы без метки — после условия, по порядку (варианты — после них или на месте [[opts]])
    (card.table || []).forEach((t, k) => { if (!used.table.has(k)) root.appendChild(tableEl(t, card)); });
    (card.figs || []).forEach((f, k) => { if (!used.fig.has(k)) root.appendChild(figEl(f, base, opts)); });

    // варианты / утверждения: data-opt — номер для выбора у ученика (answer.correct)
    if (card.opts && card.opts.length) {
      const ol = document.createElement('ol');
      ol.className = 'cr-opts';
      card.opts.forEach((o, i) => {
        const li = document.createElement('li');
        li.className = 'cr-opt';
        li.dataset.opt = i;
        li.innerHTML = '<span class="cr-optn">' + (i + 1) + ')</span><span class="cr-optt">' + rich(o, card) + '</span>';
        ol.appendChild(li);
      });
      // [[opts]] в тексте — список на этом месте (у ФИПИ «В ответ запишите…» идёт после вариантов)
      const at = text.querySelector('[data-cr-opts]');
      if (at) at.replaceWith(ol); else root.appendChild(ol);
    }
    const stub = text.querySelector('[data-cr-opts]');
    if (stub) stub.remove();
    if (opts.source && card.source) {
      const s = document.createElement('div');
      s.className = 'cr-src';
      s.textContent = 'Источник: ' + card.source;
      root.appendChild(s);
    }
    if (opts.answer) {
      const a = document.createElement('div');
      a.className = 'cr-ans';
      a.innerHTML = 'Ответ: <b></b>';
      if (card.answer.kind === 'long') a.querySelector('b').outerHTML = '<div>' + rich(card.answer.value, card) + '</div>';
      else a.querySelector('b').textContent = card.answer.value;
      root.appendChild(a);
      // критерии оценивания развёрнутого ответа (письмо, устная часть)
      if (card.answer.criteria) {
        const c = document.createElement('div');
        c.className = 'cr-crit';
        c.innerHTML = '<b>Критерии</b>' + rich(card.answer.criteria, card);
        root.appendChild(c);
      }
    }
    if (opts.solution && card.solution) {
      const s = document.createElement('div');
      s.className = 'cr-sol';
      s.innerHTML = '<div class="cr-sol-h">Решение</div>' + rich(card.solution, card);
      root.appendChild(s);
    }
    return root;
  }

  let katexLoading = null;
  function ready(cards, opts) {
    const list = Array.isArray(cards) ? cards : [cards];
    if (window.katex || !list.some(needsTex)) return Promise.resolve();
    if (katexLoading) return katexLoading;
    const root = (opts && opts.root) || '';
    katexLoading = new Promise((res, rej) => {
      if (!document.querySelector('link[href$="katex-0.18.5.css"]')) {
        const l = document.createElement('link');
        l.rel = 'stylesheet'; l.href = root + 'katex-0.18.5.css';
        document.head.appendChild(l);
      }
      const s = document.createElement('script');
      s.src = root + 'katex-0.18.5.js';
      s.onload = () => res();
      s.onerror = () => { katexLoading = null; rej(new Error('KaTeX не загрузился')); };
      document.head.appendChild(s);
    });
    return katexLoading;
  }

  window.CardRender = { render, ready, needsTex, css };
})();
