/* ═══════════════════════════════════════════════════════════════════════
   lesson-notes.js — «Конспект сессии» в тренажёрах (промпт №16).

   Перед сменой задания («Следующий пример», «Обновить пример», соседний
   тип или прототип, «− Убрать» у карточки) смотрим, работали ли с
   заданием: записи ручкой поверх или вокруг, введённый ответ, отметка
   верно/неверно. Если работали — задание и записи уходят страницей в
   конспект текущей сессии (notes-store.js), а записи с доски убираются,
   и новое задание открывается на чистом месте. Если нет — ничего.

   Откуда узнаём о смене задания:
   - страницы с собственным снимком перед сменой (snapshotAndClear —
     ОГЭ №8/№12/«Степени», ЕГЭ, ОГЭ ч. 2, «Проценты», логарифмы,
     тригонометрия) зовут LessonHistory.captureIfEnabled — оттуда сюда
     (lesson-history.js), с точной областью: одна карточка или всё;
   - остальные тренажёры своего снимка не имеют, и трогать 20 страниц ради
     одной строчки в каждом не стали: ловим нажатие кнопок смены задания в
     фазе ПЕРЕХВАТА (capture), то есть раньше обработчика страницы, пока на
     экране ещё старое задание.

   Совместный доступ (TrainerSession.isShared): страница в конспект всё
   равно уходит (у ведущего), но записи сами НЕ стираются — там остаётся
   прежняя механика урока: история урока и PDF в панели совместного
   доступа, очистка над заменяемой карточкой. У ученика конспекта нет.

   Снимок задания — html2canvas по живой странице: он клонирует документ
   СИНХРОННО в момент вызова (DocumentCloner создаётся до первого await),
   поэтому страница сразу после нашего вызова может спокойно рисовать новое
   задание. Клон берёт и значения полей, и содержимое <canvas> (графики
   №11), чего не умеет простой cloneNode у lesson-history.js.

   Работает только в верхнем окне: карточки «+», панель тренажёров на
   доске, кадр сцены ученика — чужие для конспекта.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.LessonNotes) return;
  let topWin = false;
  try { topWin = window.top === window.self; } catch (e) { topWin = false; }
  const NS = window.NotesStore;
  if (!topWin || !NS || !window.indexedDB) {
    window.LessonNotes = { captureFromTrainer: () => null, active: () => false };
    return;
  }

  const SLUG = (location.pathname.split('/').pop() || '').replace(/\.html$/, '') || 'index';
  const TS = () => window.TrainerSession || null;
  const isLeader = () => { const t = TS(); return !t || !t.isLeader || t.isLeader(); };
  const isShared = () => { const t = TS(); return !!(t && t.isShared && t.isShared()); };
  function active() { return isLeader() && !!window.__boardTakeStrokes; }

  const SHOT_SCALE = 2;        // снимок задания вдвое плотнее экрана: в PDF и на доске текст чёткий
  const PAGE_MARGIN = 60;      // поля страницы конспекта (единицы страницы, 1824 × 1296)
  const MAX_SCALE = 1.5;       // маленькое задание не раздуваем на весь лист
  const STROKE_PAD = 16;       // запас вокруг записей, чтобы край линии не упирался в край листа

  /* ── html2canvas: на тренажёрах без своей истории урока его нет —
     подгружаем сами, заранее, чтобы к первому нажатию он уже был ── */
  function ensureH2C() {
    if (window.html2canvas || document.querySelector('script[data-ln-h2c]')) return;
    const s = document.createElement('script');
    s.src = 'html2canvas.min.js';
    s.async = true;
    s.setAttribute('data-ln-h2c', '1');
    document.head.appendChild(s);
  }
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
  idle(ensureH2C);

  /* ═══ что делали с заданием ═══
     Отметки «неверно/верно» и ввод ответа у тренажёров устроены по-разному,
     но классы у всех одни и те же: bad/wrong/shake — ошибка, good/correct —
     верно. fixed (ЕГЭ: верный ответ подставлен) и correct у варианта,
     подсвеченного при показе решения, сами по себе работой с заданием НЕ
     считаются: «Показать решение» без попытки — не повод для страницы. Часть из них живёт мгновение (shake, у ОГЭ №6
     bad снимается при новой попытке), часть рисуется заново вместе с
     заданием (ЕГЭ) — поэтому и слушаем изменения, и при снимке смотрим
     ещё раз на то, что есть сейчас. */
  const BAD_CLASSES = ['bad', 'wrong', 'shake'];
  const GOOD_CLASSES = ['good', 'correct'];
  const NOT_TASK = '#boardToolbar, .board-toolbar, .board-view-toolbar, .ts-share-pop, .keypad, [class*="keypad"], .calc-panel, .calc-history-panel, .example-history-panel, .ln-pop, .basket-add-btn, .cp-rgb-row';
  const OPTION_SEL = '.mcq-btn, .yn-btn, [data-opt], .opt-btn, .option-btn';
  let marks = [];              // { el, kind: 'bad' | 'good' | 'touch', at }
  function note(el, kind) {
    if (!el || el.nodeType !== 1) return;
    if (el.closest && el.closest(NOT_TASK)) return;
    marks.push({ el, kind, at: Date.now() });
    if (marks.length > 400) marks = marks.slice(-300);
  }
  function classKind(el) {
    const cl = el.classList;
    if (!cl) return null;
    if (BAD_CLASSES.some(c => cl.contains(c))) return 'bad';
    if (GOOD_CLASSES.some(c => cl.contains(c))) return 'good';
    return null;
  }
  try {
    const mo = new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === 'attributes') {
          const el = m.target;
          const k = classKind(el);
          if (!k) continue;
          const before = ' ' + (m.oldValue || '') + ' ';
          const was = (k === 'bad' ? BAD_CLASSES : GOOD_CLASSES).some(c => before.indexOf(' ' + c + ' ') !== -1);
          if (!was) note(el, k);
        } else {
          m.addedNodes.forEach(n => {
            if (n.nodeType !== 1) return;
            const k = classKind(n); if (k) note(n, k);
            if (n.querySelectorAll) n.querySelectorAll('.bad, .wrong, .good, .correct').forEach(c => { const kk = classKind(c); if (kk) note(c, kk); });
          });
        }
      }
    });
    const startMo = () => mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
    if (document.body) startMo(); else document.addEventListener('DOMContentLoaded', startMo);
  } catch (e) {}
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (!t || !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    note(t, 'touch');
  }, true);
  document.addEventListener('click', (e) => {
    const b = e.target && e.target.closest && e.target.closest(OPTION_SEL);
    if (b) note(b, 'touch');
  }, true);

  function visible(el) {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none';
  }
  function inParts(el, parts) { return parts.some(p => p === el || p.contains(el)); }

  function readInteraction(parts, scope) {
    let bad = false, good = false, touch = false;
    const relevant = marks.filter(m => m.el.isConnected ? inParts(m.el, parts) : scope !== 'single');
    relevant.forEach(m => { if (m.kind === 'bad') bad = true; else if (m.kind === 'good') good = true; else touch = true; });
    parts.forEach(p => {
      p.querySelectorAll('.bad, .wrong').forEach(el => { if (!el.closest(NOT_TASK) && visible(el)) bad = true; });
      p.querySelectorAll('.good, .correct').forEach(el => { if (!el.closest(NOT_TASK) && visible(el)) good = true; });
      p.querySelectorAll('input, textarea').forEach(el => {
        if (el.closest(NOT_TASK) || el.type === 'hidden' || el.readOnly) return;
        if (String(el.value || '').trim() && visible(el)) touch = true;
      });
      p.querySelectorAll('.yn-btn.sel, .mcq-btn.picked, .mcq-btn.wrong, .mcq-btn.correct').forEach(el => { if (visible(el)) touch = true; });
    });
    // пошаговые тренажёры (столбики, уравнения) отметки «верно» не ставят:
    // пример решён, когда появилась «Следующий пример →»
    const next = document.getElementById('nextBtn');
    const finished = !!(next && visible(next));
    let result;
    if (bad) result = 'bad';
    else if ((good || finished) && touch) result = 'ok';
    else if (touch || good) result = 'none';
    else result = 'notes';
    return { any: bad || touch, result };
  }
  function forgetMarks(parts, scope) {
    if (scope === 'single') marks = marks.filter(m => !(m.el.isConnected && inParts(m.el, parts)));
    else marks = [];
  }

  /* ═══ подписи ═══ */
  function clean(s) { return String(s || '').replace(/[◀▶◄►]/g, '').replace(/\s+/g, ' ').trim(); }
  function trainerTitle() {
    const pt = document.getElementById('pageTitle');
    if (pt && clean(pt.textContent)) return clean(pt.textContent);
    const h1 = document.querySelector('h1');
    if (h1 && clean(h1.textContent)) return clean(h1.textContent);
    return clean(document.title);
  }
  function protoTitle() {
    const tt = document.getElementById('taskTitle');
    if (tt && visible(tt) && clean(tt.textContent)) return clean(tt.textContent);
    const parts = [];
    const sec = document.querySelector('#sections .active');
    if (sec && visible(sec)) parts.push(clean(sec.textContent));
    const lvl = document.querySelector('#levels .lvl.active, .levels .lvl.active');
    if (lvl && visible(lvl) && !parts.includes(clean(lvl.textContent))) parts.push(clean(lvl.textContent));
    return parts.join(' · ');
  }

  /* ═══ что снимать ═══
     Задание — это не весь экран тренажёра: шапка, вкладки режимов,
     калькуляторы, статистика и история туда не входят — «как при свёрнутых
     подсказках». Части задания (условие, ответ, решение, лист со
     столбиком) стоят друг под другом; снимаем их общий прямоугольник, а
     всё остальное внутри него делаем невидимым (visibility, не display —
     иначе съедет вёрстка и записи не совпадут с заданием). */
  const PART_EXCLUDE = '.calc-tools, .calc-panel, .calc-history-panel, .example-history-panel, .coming-soon, .stats, #customSheet, .theory';
  const HIDE_SEL = [
    '.corner', '.corner-left', '.card-btn-row', '.sol-btn-row', '#solBtnRow',
    '.check-btn', '.qa-check', 'button.go', '#goBtn', '.next-btn', '.refresh-btn', '.refresh-inline-btn',
    '.basket-add-btn', '.basket-btn', '.solution-btn', '.added-solution-btn', '.added-remove-btn',
    '.added-refresh-btn', '.added-basket-btn', '.added-check-btn', '.change-answer-btn', '.undo-btn',
    '.mixed-ok-btn', '.type-nav-btn', '.back-btn', '.calc-tools', '.calc-tool-btn', '.keypad-toggle',
    '.corner-btn', '.taskset-nav-btn', '.add-qty-btn', '.lvl', '.options-hint', '.add-rail',
    '.theory-toggle', '#showSolutionBtn',
  ].join(', ');
  function genericParts() {
    const ta = document.getElementById('taskArea');
    if (ta && visible(ta)) {
      const parts = [...ta.children].filter(c => {
        if (!c.matches('.panel, .sheet') || c.matches(PART_EXCLUDE) || !visible(c)) return false;
        // свёрнутая теория (ОГЭ №1–5) — это одна кнопка «Показать теорию»:
        // в конспекте от неё осталась бы пустая полоса
        const tc = c.querySelector('.theory-content');
        if (c.querySelector('.theory-toggle') && (!tc || !visible(tc))) return false;
        return true;
      });
      if (parts.length) return { container: ta, parts };
    }
    const wrap = document.querySelector('.wrap');
    if (wrap) {
      const parts = [...wrap.children].filter(c => {
        if (!visible(c) || c.matches(PART_EXCLUDE)) return false;
        if (c.matches('.sheet')) return true;
        // «ответ сразу» — только если им пользовались: пустое поле с
        // подсказкой «Знаешь ответ — впиши сразу» в конспекте лишнее
        if (c.matches('.qa-panel')) {
          const inp = c.querySelector('input');
          const msg = c.querySelector('.qa-msg');
          return !!((inp && String(inp.value || '').trim()) || (msg && visible(msg) && clean(msg.textContent)));
        }
        return false;
      });
      if (parts.length) return { container: wrap, parts };
    }
    return null;
  }
  function unionRect(parts) {
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    parts.forEach(p => { const q = p.getBoundingClientRect(); if (q.width <= 0 || q.height <= 0) return; l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom); });
    if (!isFinite(l)) return null;
    return { left: l, top: t, width: r - l, height: b - t };
  }

  /* ═══ записи: из доски — в объекты страницы ═══ */
  function buildInk(raw, origin) {
    const layers = { bg: [], sheet: [] };
    raw.forEach(s => {
      const pts = s.points.map(p => ({ x: p.x - origin.left, y: p.y - origin.top }));
      const L = layers[s.surface === 'bg' ? 'bg' : 'sheet'];
      if (s.tool === 'eraser') {
        const r = NS.eraseAlong(L, pts, (s.width || 20) / 2);
        layers[s.surface === 'bg' ? 'bg' : 'sheet'] = r.objs;
        return;
      }
      L.push({ id: NS.uid(), type: s.tool === 'line' ? 'line' : 'pen', color: s.color || '#000000', width: s.width || 2, points: pts });
    });
    return layers.bg.concat(layers.sheet).filter(o => o.points && o.points.length);
  }

  /* ═══ снимок ═══ */
  function markForShot(container, parts) {
    const marked = [];
    const mark = (el, attr) => { el.setAttribute(attr, '1'); marked.push([el, attr]); };
    const keep = new Set();
    parts.forEach(p => { let e = p; while (e && e !== container) { keep.add(e); e = e.parentElement; } });
    keep.add(container);
    keep.forEach(anc => {
      if (parts.includes(anc)) return;
      [...anc.children].forEach(ch => { if (!keep.has(ch)) mark(ch, 'data-ln-ghost'); });
    });
    parts.forEach(p => p.querySelectorAll(HIDE_SEL).forEach(el => mark(el, 'data-ln-hide')));
    return () => marked.forEach(([el, attr]) => el.removeAttribute(attr));
  }
  const SHOT_CSS =
    'html,body{background:#ffffff!important;background-image:none!important;}' +
    '[data-ln-ghost],[data-ln-hide]{visibility:hidden!important;}' +
    '*,*::before,*::after{animation:none!important;transition:none!important;}';
  function ignoreForShot(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.id === 'boardCanvas' || el.id === 'boardCanvasBg') return true;
    if (el.tagName === 'SCRIPT') return true;
    const c = el.classList;
    return !!(c && (c.contains('board-toolbar') || c.contains('board-view-toolbar') || c.contains('ln-btn') || c.contains('ln-pop') || c.contains('ln-toast')));
  }
  // возвращает Promise<canvas> — уже обрезанный по прямоугольнику задания
  function startShot(container, parts, union) {
    const cRect = container.getBoundingClientRect();
    const crop = { x: union.left - cRect.left, y: union.top - cRect.top, w: union.width, h: union.height, cw: cRect.width };
    const opts = {
      backgroundColor: '#ffffff', scale: SHOT_SCALE, useCORS: true, logging: false, imageTimeout: 8000,
      ignoreElements: ignoreForShot,
      onclone: (doc) => {
        // тема снимка — всегда светлая: страница конспекта белая, тёмная
        // карточка на ней смотрелась бы чужой и съедала бы краску при печати
        try { doc.documentElement.setAttribute('data-theme', 'light'); } catch (e) {}
        const st = doc.createElement('style'); st.textContent = SHOT_CSS; doc.head.appendChild(st);
      },
    };
    let p;
    if (window.html2canvas) {
      const unmark = markForShot(container, parts);
      try { p = window.html2canvas(container, opts); }
      catch (e) { p = Promise.reject(e); }
      finally { unmark(); }
    } else {
      // html2canvas ещё не догрузился (нажали в первую же секунду): держим
      // копию узла у себя и снимаем её, когда библиотека появится
      p = shotFromDetachedClone(container, parts, opts);
    }
    return p.then(canvas => {
      const k = canvas.width / Math.max(1, crop.cw);
      const out = document.createElement('canvas');
      out.width = Math.max(1, Math.round(crop.w * k));
      out.height = Math.max(1, Math.round(crop.h * k));
      const c = out.getContext('2d');
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, out.width, out.height);
      c.drawImage(canvas, Math.round(crop.x * k), Math.round(crop.y * k), out.width, out.height, 0, 0, out.width, out.height);
      return out;
    });
  }
  function shotFromDetachedClone(container, parts, opts) {
    const unmark = markForShot(container, parts);
    const rect = container.getBoundingClientRect();
    const clone = container.cloneNode(true);
    unmark();
    const src = container.querySelectorAll('input,textarea,select'), dst = clone.querySelectorAll('input,textarea,select');
    src.forEach((o, i) => { if (dst[i]) { dst[i].value = o.value; if ('checked' in o) dst[i].checked = o.checked; } });
    clone.removeAttribute('id'); clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    clone.querySelectorAll('[data-ln-ghost],[data-ln-hide]').forEach(el => { el.style.visibility = 'hidden'; });
    return new Promise((resolve, reject) => {
      let tries = 0;
      (function wait() {
        if (window.html2canvas) {
          const holder = document.createElement('div');
          holder.style.cssText = 'position:fixed;left:-20000px;top:0;pointer-events:none;width:' + Math.ceil(rect.width) + 'px;';
          clone.style.width = Math.ceil(rect.width) + 'px'; clone.style.margin = '0';
          holder.appendChild(clone); document.body.appendChild(holder);
          window.html2canvas(clone, Object.assign({}, opts, { width: Math.ceil(rect.width), height: Math.ceil(rect.height) }))
            .then(c => { holder.remove(); resolve(c); }, e => { holder.remove(); reject(e); });
          return;
        }
        ensureH2C();
        if (++tries > 100) { reject(new Error('html2canvas не загрузился')); return; }
        setTimeout(wait, 100);
      })();
    });
  }

  /* ═══ страница конспекта ═══
     Задание — сверху по центру, как в тренажёре; записи — на своих местах
     относительно него. Если писали далеко в сторону или вниз, лист не
     режет их, а уменьшает всё вместе: центр задания остаётся посередине
     листа, поэтому по горизонтали содержимое расширяется в обе стороны
     одинаково. */
  function layoutPage(tw, th, ink) {
    let x0 = 0, y0 = 0, x1 = tw, y1 = th;
    ink.forEach(o => {
      const h = (o.width || 2) / 2 + STROKE_PAD;
      o.points.forEach(p => { x0 = Math.min(x0, p.x - h); y0 = Math.min(y0, p.y - h); x1 = Math.max(x1, p.x + h); y1 = Math.max(y1, p.y + h); });
    });
    const cx = tw / 2;
    const half = Math.max(cx - x0, x1 - cx);
    const cw = half * 2, ch = y1 - y0;
    const W = NS.PAGE_W, H = NS.PAGE_H, m = PAGE_MARGIN;
    const s = Math.min(MAX_SCALE, (W - 2 * m) / Math.max(1, cw), (H - 2 * m) / Math.max(1, ch));
    const ox = W / 2 - cx * s;           // где окажется x = 0 задания
    const oy = m - y0 * s;               // верх содержимого — у верхнего поля
    return { s, map: (p) => ({ x: Math.round((ox + p.x * s) * 10) / 10, y: Math.round((oy + p.y * s) * 10) / 10 }) };
  }
  function buildPage(shot, union, ink, meta) {
    const tw = union.width, th = union.height;
    const L = layoutPage(tw, th, ink);
    const topLeft = L.map({ x: 0, y: 0 });
    const img = {
      id: NS.uid(), type: 'image', src: shot.toDataURL('image/png'),
      points: [topLeft], w: Math.round(tw * L.s * 10) / 10, h: Math.round(th * L.s * 10) / 10,
      natW: shot.width, natH: shot.height, lnTask: true,
    };
    const strokes = ink.map(o => Object.assign({}, o, {
      width: Math.round(o.width * L.s * 100) / 100,
      points: o.points.map(L.map),
    }));
    return Object.assign({ v: 1, objects: [img].concat(strokes) }, meta);
  }

  /* ═══ очередь: страницы ложатся в конспект строго по порядку ═══ */
  let chain = Promise.resolve();
  let lastSaved = null;
  function enqueue(fn) { chain = chain.then(fn, fn); return chain; }

  /* ═══ главный вход ═══
     scope: 'whole' — меняется всё задание (все записи страницы его), 'single'
     — одна карточка из нескольких (записи — те, что над ней и рядом).
     clear: убирать ли записи с доски (вне совместного доступа). */
  function capture(scope, container, parts, opts) {
    opts = opts || {};
    if (!active() || !container || !parts || !parts.length) return null;
    const union = unionRect(parts);
    if (!union) return null;
    const single = scope === 'single';
    const takeOpts = single ? { rect: union, inflate: 40 } : {};
    let raw = [];
    try { raw = window.__boardTakeStrokes(takeOpts) || []; } catch (e) { raw = []; }
    const ink = buildInk(raw, union);
    const inter = readInteraction(parts, scope);
    if (!ink.length && !inter.any) { forgetMarks(parts, scope); return null; }
    const meta = {
      trainer: SLUG, trainerTitle: trainerTitle(), proto: protoTitle(),
      result: inter.any ? inter.result : 'notes', url: location.pathname.split('/').pop() + location.search,
      createdAt: Date.now(),
    };
    let shotP;
    try { shotP = startShot(container, parts, union); } catch (e) { shotP = Promise.reject(e); }
    const shared = isShared();
    if (opts.clear !== false && !shared && raw.length) {
      try { window.__boardTakeStrokes(Object.assign({ remove: true }, takeOpts)); } catch (e) {}
    }
    forgetMarks(parts, scope);
    return enqueue(async () => {
      let shot;
      try { shot = await shotP; } catch (e) { console.warn('[конспект] снимок не получился', e); shot = null; }
      if (!shot) {
        // без картинки задания страница всё равно нужна: записи важнее
        shot = document.createElement('canvas'); shot.width = Math.max(1, Math.round(union.width)); shot.height = Math.max(1, Math.round(union.height));
        const c = shot.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, shot.width, shot.height);
      }
      const page = buildPage(shot, union, ink, meta);
      const s = await NS.currentSession({ create: true });
      await NS.addPage(s.id, page);
      NS.touchCurrent(s.id);
      lastSaved = page;
      flashSaved();
      refreshUI();
      return page;
    }).catch(e => { console.warn('[конспект] страница не сохранилась', e); return null; });
  }

  // вход для страниц со своим snapshotAndClear (через lesson-history.js)
  function captureFromTrainer(scope, targetEl, opts) {
    if (!targetEl) return null;
    return capture(scope === 'single' ? 'single' : 'whole', targetEl, [targetEl], opts);
  }

  /* ── остальные тренажёры: кнопки смены задания ── */
  const TRIGGER_SEL = '#nextBtn, #refreshBtn, #nextTypeBtn, #prevTypeBtn, #nextTaskBtn, #prevTaskBtn, #levels .lvl:not(.custom), #sections .sec';
  document.addEventListener('click', (e) => {
    if (typeof window.snapshotAndClear === 'function') return; // у страницы свой снимок — она позовёт нас сама
    const btn = e.target && e.target.closest && e.target.closest(TRIGGER_SEL);
    if (!btn || btn.disabled || !active()) return;
    const g = genericParts();
    if (!g) return;
    try { capture('whole', g.container, g.parts, { clear: true }); } catch (err) { console.warn('[конспект]', err); }
  }, true);

  /* ═══ кнопка «Конспект» и её окошко ═══ */
  let ui = null;
  function mountUI() {
    if (ui || !document.body) return;
    const st = document.createElement('style');
    st.textContent = `
      .ln-btn{position:fixed;top:16px;right:112px;width:40px;height:40px;border-radius:14px;border:1px solid var(--glass-border);
        background:var(--glass-strong);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);
        color:var(--ink);font-size:17px;cursor:pointer;display:flex;align-items:center;justify-content:center;
        box-shadow:inset 0 1px 0 var(--glass-inset), var(--shadow);z-index:200;transition:transform .15s, border-color .12s;padding:0;}
      .ln-btn:hover{border-color:var(--ink)}
      .ln-btn:active{transform:scale(.92)}
      .ln-btn .ln-count{position:absolute;right:-5px;top:-5px;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:var(--teacher,#ff3b30);
        color:#fff;font:700 11px/18px system-ui,-apple-system,sans-serif;text-align:center;display:none;}
      .ln-btn.has .ln-count{display:block}
      .ln-btn.pulse{animation:lnPulse .7s ease}
      @keyframes lnPulse{0%{transform:scale(1)}35%{transform:scale(1.18)}100%{transform:scale(1)}}
      .ln-pop{position:fixed;top:64px;right:16px;width:300px;max-width:calc(100vw - 32px);z-index:400;display:none;
        background:#fff;
        border:1px solid var(--glass-border);border-radius:18px;box-shadow:var(--shadow);padding:14px;color:var(--ink);font-size:14px;}
      html[data-theme="dark"] .ln-pop{background:#1E2540;}
      .ln-pop.open{display:block}
      .ln-pop h4{margin:0 0 4px;font-size:15px}
      .ln-pop .ln-sess{font-weight:600;margin-bottom:2px;word-break:break-word}
      .ln-pop .ln-meta{color:var(--muted,#6b7280);font-size:12.5px;margin-bottom:10px}
      .ln-pop .ln-note{font-size:12.5px;line-height:1.35;background:rgba(10,132,255,.08);border-radius:10px;padding:8px 10px;margin-bottom:10px;display:none}
      .ln-pop .ln-note.on{display:block}
      .ln-pop button.ln-act{display:block;width:100%;margin:6px 0 0;padding:9px 12px;border-radius:12px;border:1px solid var(--glass-border);
        background:var(--glass);color:var(--ink);font:inherit;font-size:13.5px;font-weight:600;cursor:pointer;text-align:left}
      .ln-pop button.ln-act:hover{border-color:var(--ink)}
      .ln-pop button.ln-act.primary{background:var(--ink);color:#fff;border-color:var(--ink)}
      .ln-pop .ln-row{display:flex;gap:6px}
      .ln-pop .ln-row button.ln-act{flex:1;text-align:center;font-size:12.5px}
      .ln-pop .ln-last{margin-top:10px;font-size:12px;color:var(--muted,#6b7280);line-height:1.35}
      .ln-toast{position:fixed;top:64px;right:112px;z-index:270;background:var(--ink);color:#fff;border-radius:12px;padding:8px 12px;
        font:600 13px/1.2 system-ui,-apple-system,sans-serif;box-shadow:var(--shadow);opacity:0;transform:translateY(-6px);transition:opacity .2s, transform .2s;pointer-events:none}
      .ln-toast.on{opacity:1;transform:none}
      html.ts-follower .ln-btn, html.ts-follower .ln-pop{display:none!important}
    `;
    document.head.appendChild(st);
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'ln-btn'; btn.id = 'lnBtn';
    btn.title = 'Конспект сессии'; btn.setAttribute('aria-label', 'Конспект сессии');
    btn.innerHTML = '📒<span class="ln-count"></span>';
    const pop = document.createElement('div');
    pop.className = 'ln-pop'; pop.id = 'lnPop';
    pop.innerHTML = `
      <h4>Конспект</h4>
      <div class="ln-sess"></div>
      <div class="ln-meta"></div>
      <div class="ln-note"></div>
      <button type="button" class="ln-act primary" data-act="open">Открыть конспект</button>
      <button type="button" class="ln-act" data-act="all">Все сессии</button>
      <div class="ln-row">
        <button type="button" class="ln-act" data-act="new">Начать новую сессию</button>
        <button type="button" class="ln-act" data-act="end">Завершить сессию</button>
      </div>
      <div class="ln-last"></div>`;
    const toast = document.createElement('div');
    toast.className = 'ln-toast'; toast.textContent = '＋ страница в конспекте';
    document.body.appendChild(btn); document.body.appendChild(pop); document.body.appendChild(toast);
    ui = { btn, pop, toast, sess: pop.querySelector('.ln-sess'), meta: pop.querySelector('.ln-meta'), note: pop.querySelector('.ln-note'), last: pop.querySelector('.ln-last') };
    btn.addEventListener('click', (e) => { e.stopPropagation(); pop.classList.toggle('open'); if (pop.classList.contains('open')) refreshUI(); });
    document.addEventListener('pointerdown', (e) => { if (!pop.contains(e.target) && e.target !== btn && !btn.contains(e.target)) pop.classList.remove('open'); }, true);
    pop.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const act = b.dataset.act;
      if (act === 'open') {
        const s = await NS.currentSession({ create: false });
        openNotes(s ? 'notes.html?s=' + encodeURIComponent(s.id) : 'notes.html');
      } else if (act === 'all') {
        openNotes('notes.html');
      } else if (act === 'new') {
        await NS.startNew();
        refreshUI();
      } else if (act === 'end') {
        await NS.endCurrent();
        refreshUI();
      }
    });
    refreshUI();
  }
  // конспект — отдельная вкладка: тренажёр с заданием и записями остаётся
  // открытым, а повторное нажатие попадает в ту же вкладку, а не плодит новые
  function openNotes(href) {
    const w = window.open(href, 'mathhNotes');
    if (!w) location.href = href;
  }
  function plural(n, a, b, c) { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c); }
  let refreshing = false, refreshAgain = false;
  async function refreshUI() {
    if (!ui) return;
    if (refreshing) { refreshAgain = true; return; }
    refreshing = true;
    try {
      const s = await NS.currentSession({ create: false });
      const n = s ? await NS.countPages(s.id) : 0;
      ui.btn.classList.toggle('has', n > 0);
      ui.btn.querySelector('.ln-count').textContent = n > 99 ? '99+' : String(n);
      if (s) {
        ui.sess.textContent = NS.sessionTitle(s);
        ui.meta.textContent = n + ' ' + plural(n, 'страница', 'страницы', 'страниц') + ' · начата в ' + NS.fmtTime(s.createdAt);
      } else {
        ui.sess.textContent = 'Сессия ещё не начата';
        ui.meta.textContent = 'Начнётся сама с первой сохранённой страницы';
      }
      const shared = isShared();
      ui.note.classList.toggle('on', shared);
      ui.note.textContent = shared
        ? 'Идёт совместный доступ: страницы в конспект сохраняются, но записи с доски сами не стираются — там работает история урока из панели совместного доступа.'
        : '';
      ui.pop.querySelector('[data-act="end"]').disabled = !s;
      ui.pop.querySelector('[data-act="end"]').style.opacity = s ? '' : '.5';
      if (lastSaved) {
        ui.last.textContent = 'Последняя страница: ' + NS.fmtTime(lastSaved.createdAt) + ' · ' + [lastSaved.trainerTitle, lastSaved.proto].filter(Boolean).join(' · ') + ' · ' + (NS.RESULT_LABEL[lastSaved.result] || '');
      } else ui.last.textContent = 'Страница сохраняется при «Следующий пример» или «Обновить пример», если с заданием работали: записи, ответ.';
    } catch (e) {}
    refreshing = false;
    if (refreshAgain) { refreshAgain = false; refreshUI(); }
  }
  let toastTimer = null;
  function flashSaved() {
    if (!ui) return;
    ui.btn.classList.remove('pulse'); void ui.btn.offsetWidth; ui.btn.classList.add('pulse');
    ui.toast.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ui.toast.classList.remove('on'), 1600);
  }
  NS.onChange((msg) => { if (msg && (msg.t === 'page-added' || msg.t === 'current' || msg.t === 'session')) refreshUI(); });

  function boot() {
    // у ученика в совместной сессии своего конспекта нет; роль известна
    // не сразу (сессия подключается асинхронно) — проверяем и потом
    if (!isLeader()) return;
    mountUI();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setTimeout(() => { if (ui && !isLeader()) { ui.btn.style.display = 'none'; ui.pop.classList.remove('open'); } else if (!ui) boot(); }, 2500);

  window.LessonNotes = { captureFromTrainer, capture, active, refreshUI, _genericParts: genericParts, _chain: () => chain };
})();
