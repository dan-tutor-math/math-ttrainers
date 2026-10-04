/* ═══════════════════════════════════════════════════════════════════════
   notes-editor.js — страница notes.html: список сессий конспекта и
   редактор их страниц (промпт №16).

   Страница конспекта — лист 1824 × 1296 (лист доски, см. notes-store.js) со
   списком объектов в формате досок. Редактор умеет то же, что правка
   отдельной доски, в пределах одного листа: выделение (рамкой и по
   одному, Shift — добавить), перемещение, размер за угол, удаление, ручка,
   ластик двух режимов, текст, линия, стрелка, прямоугольник, эллипс,
   копирование и вставка (между страницами и сессиями тоже), отмена.
   Всё сохраняется само через полсекунды после правки.

   Почему своя маленькая отрисовка, а не движок досок: boards-core.js — это
   бесконечное полотно со своим хранилищем, облаком и списком досок, и
   «встроить» его на страницу с одним листом значило бы тащить всё это
   следом. Формат объектов при этом общий, и «Сохранить как доску» отдаёт
   страницы движку досок как есть.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const NS = window.NotesStore;
  const W = NS.PAGE_W, H = NS.PAGE_H;
  const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif";
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const SID = params.get('s');

  function toast(msg, ms) {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), ms || 2200);
  }
  function plural(n, a, b, c) { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  /* ═════════════════ список сессий ═════════════════ */
  async function renderList() {
    const box = $('slList');
    let list = [];
    try { list = await NS.listSessions(); } catch (e) { box.innerHTML = '<div class="panel sl-empty">Не удалось открыть хранилище браузера.</div>'; return; }
    const cur = NS.readCur();
    if (!list.length) {
      box.innerHTML = '<div class="panel sl-empty">Сессий пока нет.<br>Порешайте в тренажёре: когда переходишь к следующему примеру, задание с записями сохраняется сюда страницей.</div>';
      return;
    }
    box.innerHTML = '';
    list.forEach(s => {
      const n = (s.pageIds || []).length;
      const live = cur && cur.id === s.id && !s.endedAt;
      const row = document.createElement('div');
      row.className = 'panel sl-row' + (live ? ' current' : '');
      row.dataset.id = s.id;
      row.innerHTML = `
        <div class="sl-main" data-act="open">
          <div class="sl-name">${esc(NS.sessionTitle(s))}</div>
          <div class="sl-meta">${esc(NS.fmtDateTime(s.createdAt))} · ${n} ${plural(n, 'страница', 'страницы', 'страниц')}${live ? ' · <b>идёт сейчас</b>' : (s.endedAt ? ' · завершена в ' + NS.fmtTime(s.endedAt) : '')}</div>
        </div>
        <div class="sl-acts">
          <button class="btn small" data-act="open" type="button">Открыть</button>
          <button class="btn quiet small" data-act="rename" type="button">Переименовать</button>
          <button class="btn danger small" data-act="del" type="button">Удалить</button>
        </div>`;
      box.appendChild(row);
    });
  }
  async function onListClick(e) {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const row = b.closest('.sl-row');
    const id = row && row.dataset.id;
    if (!id) return;
    const act = b.dataset.act;
    if (act === 'open') { location.href = 'notes.html?s=' + encodeURIComponent(id); return; }
    if (act === 'rename') {
      const s = await NS.getSession(id);
      const nameEl = row.querySelector('.sl-name');
      const inp = document.createElement('input');
      inp.className = 'field sl-name-input'; inp.maxLength = 80;
      inp.value = NS.sessionTitle(s);
      nameEl.replaceWith(inp); inp.focus(); inp.select();
      let done = false;
      const finish = async (save) => {
        if (done) return; done = true;
        if (save) { const v = inp.value.replace(/\s+/g, ' ').trim(); s.name = v && v !== NS.sessionTitle(Object.assign({}, s, { name: null })) ? v : null; await NS.putSession(s); }
        renderList();
      };
      inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') finish(true); if (ev.key === 'Escape') finish(false); });
      inp.addEventListener('blur', () => finish(true));
      inp.addEventListener('click', ev => ev.stopPropagation());
      return;
    }
    if (act === 'del') {
      const acts = row.querySelector('.sl-acts');
      acts.innerHTML = '<span class="sl-confirm">Удалить сессию со всеми страницами?</span>' +
        '<button class="btn danger small" data-act="del-yes" type="button">Удалить</button>' +
        '<button class="btn quiet small" data-act="del-no" type="button">Отмена</button>';
      return;
    }
    if (act === 'del-yes') { await NS.deleteSession(id); toast('Сессия удалена'); renderList(); return; }
    if (act === 'del-no') { renderList(); return; }
  }

  /* ═════════════════ редактор ═════════════════ */
  let session = null;
  let pages = [];
  let cur = -1;
  const histories = new Map();      // id страницы → { u: [], r: [] }
  const UNDO_LIMIT = 60;
  let tool = 'pen';
  let color = '#000000';
  let penWidth = 3, eraserSize = 30, textSize = 36;
  let erMode = 'area';
  try { if (localStorage.getItem('notesEraserMode') === 'stroke') erMode = 'stroke'; } catch (e) {}
  let selected = new Set();
  let drag = null;                  // текущий жест
  let hover = null;                 // точка под курсором (для круга ластика)
  let textEdit = null;
  const canvas = $('pc');
  const ctx = canvas.getContext('2d');
  let view = { s: 1, left: 0, top: 0 };
  let dpr = Math.max(1, window.devicePixelRatio || 1);

  const COLORS = ['#000000', '#FF3B30', '#0A84FF', '#34C759', '#FF9500', '#AF52DE'];
  const PEN_WIDTHS = [2, 3, 5, 9];
  const ERASER_SIZES = [16, 30, 60];
  const TEXT_SIZES = [24, 36, 54];

  function page() { return pages[cur] || null; }
  function objs() { const p = page(); return p ? p.objects : []; }

  /* ── картинки ── */
  const imgCache = new Map();
  function getImg(src, onload) {
    let e = imgCache.get(src);
    if (!e) {
      const im = new Image();
      e = { im, ok: false, waiters: [] };
      imgCache.set(src, e);
      im.onload = () => { e.ok = true; e.waiters.splice(0).forEach(fn => { try { fn(); } catch (err) {} }); };
      im.src = src;
    }
    if (!e.ok && onload) e.waiters.push(onload);
    return e.ok ? e.im : null;
  }
  function imagesReady(list) {
    return Promise.all(list.filter(o => o.type === 'image' && o.src).map(o => new Promise(res => { if (getImg(o.src, res)) res(); })));
  }

  /* ── отрисовка объекта (в единицах листа) ── */
  function strokePath(c, pts, smooth) {
    c.beginPath();
    if (pts.length === 1) { c.moveTo(pts[0].x, pts[0].y); c.lineTo(pts[0].x + 0.01, pts[0].y + 0.01); return; }
    c.moveTo(pts[0].x, pts[0].y);
    if (!smooth || pts.length === 2) { for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y); return; }
    for (let i = 1; i < pts.length - 1; i++) c.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + pts[i + 1].x) / 2, (pts[i].y + pts[i + 1].y) / 2);
    const l = pts[pts.length - 1], pv = pts[pts.length - 2];
    c.quadraticCurveTo(pv.x, pv.y, l.x, l.y);
  }
  function arrowHead(c, a, b, w) {
    const ang = Math.atan2(b.y - a.y, b.x - a.x), len = Math.max(14, w * 4.5);
    c.beginPath();
    c.moveTo(b.x, b.y); c.lineTo(b.x - len * Math.cos(ang - 0.45), b.y - len * Math.sin(ang - 0.45));
    c.moveTo(b.x, b.y); c.lineTo(b.x - len * Math.cos(ang + 0.45), b.y - len * Math.sin(ang + 0.45));
    c.stroke();
  }
  function textFont(o) { return (o.italic ? 'italic ' : '') + (o.bold ? '700 ' : '') + (o.fontSize || 36) + 'px ' + FONT; }
  const measureCtx = document.createElement('canvas').getContext('2d');
  function measureText(o) {
    measureCtx.font = textFont(o);
    const lines = String(o.content || '').split('\n');
    o.w = Math.max(10, ...lines.map(l => measureCtx.measureText(l).width));
    o.h = Math.max(1, lines.length) * (o.fontSize || 36) * 1.25;
    return o;
  }
  function colorOf(o) { const c = o.color || '#000000'; return /^--/.test(c) ? '#000000' : c; }
  function renderObj(c, o, redraw) {
    c.save();
    if (o.opacity != null) c.globalAlpha = o.opacity;
    if (o.type === 'image') {
      const im = getImg(o.src, redraw);
      const p = o.points[0];
      if (im) c.drawImage(im, p.x, p.y, o.w, o.h);
      else { c.fillStyle = '#f2f4f8'; c.fillRect(p.x, p.y, o.w, o.h); }
      c.restore(); return;
    }
    const col = colorOf(o);
    c.strokeStyle = col; c.fillStyle = col;
    c.lineWidth = Math.max(0.5, o.width || 2); c.lineCap = 'round'; c.lineJoin = 'round';
    if (o.dash) c.setLineDash([o.width * 3.4, o.width * 2.4]);
    const pts = o.points || [];
    if (o.type === 'pen') { strokePath(c, pts, true); c.stroke(); }
    else if (o.type === 'line' || o.type === 'curve') {
      strokePath(c, pts, o.type === 'curve'); c.stroke();
      c.setLineDash([]);
      if (o.arrowEnd && pts.length >= 2) arrowHead(c, pts[pts.length - 2], pts[pts.length - 1], o.width || 2);
      if (o.arrowStart && pts.length >= 2) arrowHead(c, pts[1], pts[0], o.width || 2);
    } else if (o.type === 'quad' || o.type === 'poly') {
      c.beginPath(); c.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
      c.closePath();
      if (o.fill) { c.globalAlpha = 0.16; c.fill(); c.globalAlpha = o.opacity != null ? o.opacity : 1; }
      c.stroke();
    } else if (o.type === 'ellipse') {
      c.beginPath(); c.ellipse(pts[0].x, pts[0].y, Math.max(1, o.rx), Math.max(1, o.ry), 0, 0, Math.PI * 2);
      if (o.fill) { c.globalAlpha = 0.16; c.fill(); c.globalAlpha = o.opacity != null ? o.opacity : 1; }
      c.stroke();
    } else if (o.type === 'circle') {
      c.beginPath(); c.arc(pts[0].x, pts[0].y, Math.max(1, o.r), 0, Math.PI * 2); c.stroke();
    } else if (o.type === 'text') {
      if (textEdit && textEdit.objId === o.id) { c.restore(); return; }
      const fs = o.fontSize || 36;
      c.setLineDash([]);
      c.font = textFont(o); c.textBaseline = 'top'; c.textAlign = 'left';
      if (o.bg) { c.save(); c.fillStyle = o.bg; c.fillRect(pts[0].x, pts[0].y, o.w || 0, o.h || 0); c.restore(); }
      String(o.content || '').split('\n').forEach((line, i) => c.fillText(line, pts[0].x, pts[0].y + i * fs * 1.25));
    } else if (o.type === 'angle' && pts.length === 3) {
      c.beginPath(); c.moveTo(pts[1].x, pts[1].y); c.lineTo(pts[0].x, pts[0].y); c.moveTo(pts[1].x, pts[1].y); c.lineTo(pts[2].x, pts[2].y); c.stroke();
    }
    c.restore();
  }
  // лист целиком — и для экрана, и для миниатюр, и для PDF
  function renderPage(c, pg, scale, redraw) {
    c.save();
    c.setTransform(scale, 0, 0, scale, 0, 0);
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H);
    c.beginPath(); c.rect(0, 0, W, H); c.clip();
    (pg.objects || []).forEach(o => renderObj(c, o, redraw));
    c.restore();
  }

  /* ── геометрия ── */
  function bbox(o) {
    const p = (o.points || [])[0] || { x: 0, y: 0 };
    if (o.type === 'image' || o.type === 'text') return { x0: p.x, y0: p.y, x1: p.x + (o.w || 10), y1: p.y + (o.h || 10) };
    if (o.type === 'ellipse') return { x0: p.x - o.rx, y0: p.y - o.ry, x1: p.x + o.rx, y1: p.y + o.ry };
    if (o.type === 'circle') return { x0: p.x - o.r, y0: p.y - o.r, x1: p.x + o.r, y1: p.y + o.r };
    const b = NS.bboxOf(o.points || []), h = (o.width || 2) / 2;
    return { x0: b.x0 - h, y0: b.y0 - h, x1: b.x1 + h, y1: b.y1 + h };
  }
  function unionBox(list) {
    if (!list.length) return null;
    const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    list.forEach(o => { const q = bbox(o); b.x0 = Math.min(b.x0, q.x0); b.y0 = Math.min(b.y0, q.y0); b.x1 = Math.max(b.x1, q.x1); b.y1 = Math.max(b.y1, q.y1); });
    return b;
  }
  function d2seg(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy;
    let t = l2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    const x = a.x + t * dx - p.x, y = a.y + t * dy - p.y; return x * x + y * y;
  }
  function distToPoly(p, pts, closed) {
    if (pts.length === 1) return Math.hypot(p.x - pts[0].x, p.y - pts[0].y);
    let m = Infinity;
    for (let i = 0; i < pts.length - 1; i++) m = Math.min(m, d2seg(p, pts[i], pts[i + 1]));
    if (closed) m = Math.min(m, d2seg(p, pts[pts.length - 1], pts[0]));
    return Math.sqrt(m);
  }
  function inBox(p, b, tol) { return p.x >= b.x0 - tol && p.x <= b.x1 + tol && p.y >= b.y0 - tol && p.y <= b.y1 + tol; }
  // попадание: forSelect — щелчок выделения (внутрь фигуры тоже считается);
  // иначе — касание ластиком (только контур, картинки не трогаем: задание
  // ластиком случайно не снесёшь, его удаляют выделением)
  function hitObj(o, p, tol, forSelect) {
    if (o.type === 'image') return forSelect && inBox(p, bbox(o), tol);
    if (o.type === 'text') return inBox(p, bbox(o), tol);
    const w2 = (o.width || 2) / 2;
    if (o.type === 'pen' || o.type === 'line' || o.type === 'curve' || o.type === 'angle') return distToPoly(p, o.points, false) <= tol + w2;
    if (o.type === 'quad' || o.type === 'poly') return (forSelect && inBox(p, bbox(o), 0)) || distToPoly(p, o.points, true) <= tol + w2;
    if (o.type === 'ellipse' || o.type === 'circle') {
      const c = o.points[0], rx = o.type === 'circle' ? o.r : o.rx, ry = o.type === 'circle' ? o.r : o.ry;
      const k = Math.hypot((p.x - c.x) / Math.max(1, rx), (p.y - c.y) / Math.max(1, ry));
      if (forSelect && k <= 1) return true;
      return Math.abs(k - 1) * Math.min(rx, ry) <= tol + w2;
    }
    return inBox(p, bbox(o), tol);
  }
  function topHit(p, forSelect) {
    const tol = 8 / view.s;
    const list = objs();
    for (let i = list.length - 1; i >= 0; i--) if (hitObj(list[i], p, tol, forSelect)) return list[i];
    return null;
  }

  /* ── отмена ── */
  function cloneObj(o) {
    // картинку целиком не копируем: её src — неизменяемая строка, общая для
    // всех копий; иначе каждый шаг отмены держал бы ещё полмегабайта
    if (o.type === 'image') return Object.assign({}, o, { points: o.points.map(p => ({ x: p.x, y: p.y })) });
    return JSON.parse(JSON.stringify(o));
  }
  function hist() { const p = page(); if (!p) return null; let h = histories.get(p.id); if (!h) { h = { u: [], r: [] }; histories.set(p.id, h); } return h; }
  function pushUndo() {
    const h = hist(); if (!h) return;
    h.u.push(objs().map(cloneObj)); if (h.u.length > UNDO_LIMIT) h.u.shift();
    h.r.length = 0; syncButtons();
  }
  function undo() {
    const h = hist(); if (!h || !h.u.length) return;
    commitText();
    h.r.push(objs().map(cloneObj)); page().objects = h.u.pop();
    selected.clear(); changed();
  }
  function redo() {
    const h = hist(); if (!h || !h.r.length) return;
    h.u.push(objs().map(cloneObj)); page().objects = h.r.pop();
    selected.clear(); changed();
  }

  /* ── сохранение: само, через полсекунды после правки ── */
  const dirty = new Set();
  let saveTimer = null;
  function changed() {
    const p = page(); if (!p) return;
    dirty.add(p.id);
    clearTimeout(saveTimer); saveTimer = setTimeout(flushSave, 500);
    draw(); syncButtons(); scheduleThumb(p.id);
  }
  async function flushSave() {
    clearTimeout(saveTimer); saveTimer = null;
    const ids = [...dirty]; dirty.clear();
    for (const id of ids) {
      const p = pages.find(x => x.id === id);
      if (p) { try { await NS.putPage(p); } catch (e) { toast('Не удалось сохранить страницу'); } }
    }
  }
  window.addEventListener('pagehide', () => { if (dirty.size) flushSave(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && dirty.size) flushSave(); });

  /* ── вид: лист вписан в рабочую область ── */
  function layout() {
    const st = $('edStage');
    const sw = st.clientWidth, sh = st.clientHeight;
    const topPad = $('edTools').offsetHeight + 22, botPad = 58;
    const s = Math.max(0.05, Math.min((sw - 32) / W, (sh - topPad - botPad) / H));
    const cw = W * s, ch = H * s;
    view = { s, left: Math.round((sw - cw) / 2), top: Math.round(topPad + (sh - topPad - botPad - ch) / 2) };
    dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.style.left = view.left + 'px'; canvas.style.top = view.top + 'px';
    canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    if (textEdit) placeTextEditor();
    draw();
  }
  function toPage(e) {
    const r = canvas.getBoundingClientRect();
    return { x: Math.round((e.clientX - r.left) / view.s * 10) / 10, y: Math.round((e.clientY - r.top) / view.s * 10) / 10 };
  }

  /* ── главный холст ── */
  let drawPending = false;
  function draw() {
    if (drawPending) return;
    drawPending = true;
    requestAnimationFrame(() => { drawPending = false; drawNow(); });
  }
  function drawNow() {
    const p = page();
    $('edEmpty').classList.toggle('on', !p);
    canvas.style.display = p ? '' : 'none';
    if (!p) return;
    const k = view.s * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    renderPage(ctx, p, k, draw);
    ctx.save();
    ctx.setTransform(k, 0, 0, k, 0, 0);
    if (drag && drag.preview) renderObj(ctx, drag.preview, draw);
    // рамка выделения и ручки
    const sel = selectedObjs();
    if (sel.length && !(drag && drag.kind === 'draw')) {
      const b = unionBox(sel);
      ctx.lineWidth = 1.5 / view.s; ctx.setLineDash([6 / view.s, 4 / view.s]); ctx.strokeStyle = '#0A84FF';
      ctx.strokeRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
      ctx.setLineDash([]);
      const hs = 9 / view.s;
      handlesOf(b).forEach(h => { ctx.fillStyle = '#fff'; ctx.fillRect(h.x - hs / 2, h.y - hs / 2, hs, hs); ctx.strokeRect(h.x - hs / 2, h.y - hs / 2, hs, hs); });
    }
    if (drag && drag.kind === 'band') {
      const b = drag.band;
      ctx.fillStyle = 'rgba(10,132,255,.08)'; ctx.strokeStyle = '#0A84FF'; ctx.lineWidth = 1 / view.s;
      ctx.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); ctx.strokeRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
    }
    if (tool === 'eraser' && hover) {
      ctx.beginPath(); ctx.arc(hover.x, hover.y, eraserSize / 2, 0, Math.PI * 2);
      ctx.lineWidth = 1.2 / view.s; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.setLineDash([]); ctx.stroke();
    }
    ctx.restore();
  }
  function selectedObjs() { return objs().filter(o => selected.has(o.id)); }
  function handlesOf(b) { return [{ r: 'nw', x: b.x0, y: b.y0 }, { r: 'ne', x: b.x1, y: b.y0 }, { r: 'se', x: b.x1, y: b.y1 }, { r: 'sw', x: b.x0, y: b.y1 }]; }
  function handleAt(p) {
    const sel = selectedObjs(); if (!sel.length) return null;
    const b = unionBox(sel), tol = 10 / view.s;
    return handlesOf(b).find(h => Math.abs(p.x - h.x) <= tol && Math.abs(p.y - h.y) <= tol) || null;
  }

  /* ── преобразования объектов ── */
  function moveObj(o, dx, dy) { o.points = o.points.map(p => ({ x: Math.round((p.x + dx) * 10) / 10, y: Math.round((p.y + dy) * 10) / 10 })); if (o.ctrl) o.ctrl = { x: o.ctrl.x + dx, y: o.ctrl.y + dy }; }
  function scaleObj(o, src, a, k) {
    o.points = src.points.map(p => ({ x: Math.round((a.x + (p.x - a.x) * k) * 10) / 10, y: Math.round((a.y + (p.y - a.y) * k) * 10) / 10 }));
    if (o.type === 'image') { o.w = src.w * k; o.h = src.h * k; }
    if (o.type === 'text') { o.fontSize = Math.max(6, (src.fontSize || 36) * k); measureText(o); }
    if (o.type === 'ellipse') { o.rx = src.rx * k; o.ry = src.ry * k; }
    if (o.type === 'circle') { o.r = src.r * k; }
  }

  /* ── жесты на листе ── */
  function newId() { return NS.uid(); }
  canvas.addEventListener('pointerdown', (e) => {
    if (!page()) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (textEdit) { commitText(); if (tool === 'text') return; }
    const p = toPage(e);
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
    if (tool === 'select') {
      const h = handleAt(p);
      if (h) {
        const sel = selectedObjs(), b = unionBox(sel);
        const opp = { nw: { x: b.x1, y: b.y1 }, ne: { x: b.x0, y: b.y1 }, se: { x: b.x0, y: b.y0 }, sw: { x: b.x1, y: b.y0 } }[h.r];
        pushUndo();
        drag = { kind: 'scale', a: opp, h0: { x: h.x, y: h.y }, src: new Map(sel.map(o => [o.id, cloneObj(o)])) };
        return;
      }
      const o = topHit(p, true);
      if (o) {
        if (e.shiftKey) { if (selected.has(o.id)) selected.delete(o.id); else selected.add(o.id); draw(); syncButtons(); return; }
        if (!selected.has(o.id)) { selected = new Set([o.id]); }
        drag = { kind: 'move', last: p, undo: false };
        draw(); syncButtons();
        return;
      }
      if (!e.shiftKey) selected.clear();
      drag = { kind: 'band', start: p, band: { x0: p.x, y0: p.y, x1: p.x, y1: p.y }, keep: new Set(selected) };
      draw(); syncButtons();
      return;
    }
    if (tool === 'text') { startText(p, null); return; }
    if (tool === 'eraser') {
      pushUndo();
      drag = { kind: 'erase', last: p, changed: false };
      eraseAlong(p, p);
      return;
    }
    selected.clear();
    const base = { id: newId(), color, width: penWidth };
    let preview;
    if (tool === 'pen') preview = Object.assign(base, { type: 'pen', points: [p] });
    else if (tool === 'line' || tool === 'arrow') preview = Object.assign(base, { type: 'line', points: [p, p] }, tool === 'arrow' ? { arrowEnd: true } : {});
    else if (tool === 'rect') preview = Object.assign(base, { type: 'quad', rect: true, points: [p, p, p, p] });
    else if (tool === 'ellipse') preview = Object.assign(base, { type: 'ellipse', points: [p], rx: 1, ry: 1 });
    drag = { kind: 'draw', start: p, preview };
    draw();
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = toPage(e);
    if (tool === 'eraser') { hover = p; if (!drag) draw(); }
    if (!drag) {
      if (tool === 'select') canvas.style.cursor = handleAt(p) ? 'nwse-resize' : (topHit(p, true) ? 'move' : 'default');
      return;
    }
    e.preventDefault();
    if (drag.kind === 'move') {
      const dx = p.x - drag.last.x, dy = p.y - drag.last.y;
      if (!dx && !dy) return;
      if (!drag.undo) { pushUndo(); drag.undo = true; }
      selectedObjs().forEach(o => moveObj(o, dx, dy));
      drag.last = p; drag.moved = true; draw();
    } else if (drag.kind === 'scale') {
      const a = drag.a, h0 = drag.h0;
      const vx = h0.x - a.x, vy = h0.y - a.y, l2 = vx * vx + vy * vy || 1;
      const k = Math.max(0.05, ((p.x - a.x) * vx + (p.y - a.y) * vy) / l2);
      selectedObjs().forEach(o => { const src = drag.src.get(o.id); if (src) scaleObj(o, src, a, k); });
      drag.moved = true; draw();
    } else if (drag.kind === 'band') {
      const s = drag.start;
      drag.band = { x0: Math.min(s.x, p.x), y0: Math.min(s.y, p.y), x1: Math.max(s.x, p.x), y1: Math.max(s.y, p.y) };
      const b = drag.band;
      selected = new Set(drag.keep);
      objs().forEach(o => { const q = bbox(o); if (q.x1 >= b.x0 && q.x0 <= b.x1 && q.y1 >= b.y0 && q.y0 <= b.y1) selected.add(o.id); });
      draw(); syncButtons();
    } else if (drag.kind === 'erase') {
      eraseAlong(drag.last, p); drag.last = p;
    } else if (drag.kind === 'draw') {
      const o = drag.preview, s = drag.start;
      if (o.type === 'pen') {
        const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
        (evs.length ? evs : [e]).forEach(ev => o.points.push(toPage(ev)));
      } else if (o.type === 'line') {
        let q = p;
        if (e.shiftKey) { const ang = Math.round(Math.atan2(p.y - s.y, p.x - s.x) / (Math.PI / 4)) * Math.PI / 4, len = Math.hypot(p.x - s.x, p.y - s.y); q = { x: s.x + len * Math.cos(ang), y: s.y + len * Math.sin(ang) }; }
        o.points[1] = q;
      } else if (o.type === 'quad') {
        o.points = [{ x: s.x, y: s.y }, { x: p.x, y: s.y }, { x: p.x, y: p.y }, { x: s.x, y: p.y }];
      } else if (o.type === 'ellipse') {
        o.points = [{ x: (s.x + p.x) / 2, y: (s.y + p.y) / 2 }]; o.rx = Math.abs(p.x - s.x) / 2; o.ry = Math.abs(p.y - s.y) / 2;
      }
      draw();
    }
  });
  function endGesture(e) {
    if (!drag) return;
    const d = drag; drag = null;
    try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
    if (d.kind === 'draw') {
      const o = d.preview;
      const b = bbox(o);
      const big = o.type === 'pen' || (b.x1 - b.x0) + (b.y1 - b.y0) > 6;
      if (big) { pushUndo(); objs().push(o); changed(); } else draw();
      return;
    }
    if (d.kind === 'move' || d.kind === 'scale') { if (d.moved) changed(); else draw(); return; }
    if (d.kind === 'erase') {
      if (d.changed) changed();
      else { const h = hist(); if (h) h.u.pop(); draw(); syncButtons(); }
      return;
    }
    draw(); syncButtons();
  }
  canvas.addEventListener('pointerup', endGesture);
  canvas.addEventListener('pointercancel', endGesture);
  canvas.addEventListener('pointerleave', () => { if (tool === 'eraser' && !drag) { hover = null; draw(); } });
  canvas.addEventListener('dblclick', (e) => {
    const p = toPage(e);
    const o = topHit(p, true);
    if (o && o.type === 'text') { selected = new Set([o.id]); startText(o.points[0], o); }
  });

  function eraseAlong(a, b) {
    const p = page(); if (!p) return;
    if (erMode === 'stroke') {
      const tol = eraserSize / 2;
      const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / Math.max(2, tol / 2)));
      const gone = new Set();
      for (let i = 0; i <= steps; i++) {
        const q = { x: a.x + (b.x - a.x) * i / steps, y: a.y + (b.y - a.y) * i / steps };
        p.objects.forEach(o => { if (!gone.has(o.id) && hitObj(o, q, tol, false)) gone.add(o.id); });
      }
      if (gone.size) { p.objects = p.objects.filter(o => !gone.has(o.id)); gone.forEach(id => selected.delete(id)); drag.changed = true; }
    } else {
      const r = NS.eraseAlong(p.objects, a.x === b.x && a.y === b.y ? [a] : [a, b], eraserSize / 2);
      if (r.changed) { p.objects = r.objs; drag.changed = true; }
    }
    draw();
  }

  /* ── текст ── */
  function startText(pt, obj) {
    commitText();
    const ta = document.createElement('textarea');
    ta.className = 'txt-edit';
    ta.spellcheck = false;
    const o = obj || { id: newId(), type: 'text', points: [{ x: pt.x, y: pt.y }], content: '', color, fontSize: textSize };
    textEdit = { ta, objId: obj ? obj.id : null, draft: o, isNew: !obj };
    ta.value = o.content || '';
    ta.style.color = colorOf(o);
    $('edStage').appendChild(ta);
    placeTextEditor();
    ta.addEventListener('input', placeTextEditor);
    ta.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); commitText(); }
    });
    // закрываем именно ЭТО поле: старое, снятое с экрана, тоже присылает
    // blur — и без проверки закрыло бы только что открытое новое
    ta.addEventListener('blur', () => setTimeout(() => { if (textEdit && textEdit.ta === ta) commitText(); }, 0));
    // фокус сразу (печатать можно с первого же символа) и ещё раз после
    // текущего нажатия: его действие по умолчанию могло увести фокус
    ta.focus();
    setTimeout(() => { if (textEdit && textEdit.ta === ta) ta.focus(); }, 0);
    draw();
  }
  function placeTextEditor() {
    if (!textEdit) return;
    const { ta, draft } = textEdit;
    const fs = (draft.fontSize || 36) * view.s;
    ta.style.font = (draft.bold ? '700 ' : '') + fs + 'px ' + FONT;
    ta.style.lineHeight = '1.25';
    ta.style.left = (view.left + draft.points[0].x * view.s) + 'px';
    ta.style.top = (view.top + draft.points[0].y * view.s) + 'px';
    measureCtx.font = (draft.bold ? '700 ' : '') + fs + 'px ' + FONT;
    const lines = (ta.value || ' ').split('\n');
    ta.style.width = Math.max(60, ...lines.map(l => measureCtx.measureText(l + 'mm').width)) + 'px';
    ta.style.height = (lines.length * fs * 1.25 + 4) + 'px';
  }
  function commitText() {
    if (!textEdit) return;
    const { ta, draft, isNew, objId } = textEdit;
    textEdit = null;
    const value = ta.value.replace(/\s+$/, '');
    ta.remove();
    const p = page();
    if (!p) return;
    if (isNew) {
      if (value.trim()) { pushUndo(); draft.content = value; measureText(draft); p.objects.push(draft); selected = new Set([draft.id]); changed(); }
      else draw();
      return;
    }
    const o = p.objects.find(x => x.id === objId);
    if (!o) { draw(); return; }
    if (value === o.content) { draw(); return; }
    pushUndo();
    if (!value.trim()) { p.objects = p.objects.filter(x => x.id !== objId); selected.delete(objId); }
    else { o.content = value; measureText(o); }
    changed();
  }

  /* ── выделенное: удалить, копировать, вставить ── */
  function deleteSelected() {
    if (!selected.size) return;
    pushUndo();
    page().objects = objs().filter(o => !selected.has(o.id));
    selected.clear(); changed();
  }
  const CLIP_KEY = 'notesClipboard:v1';
  let clip = null, pasteN = 0;
  function copySelected(cut) {
    const sel = selectedObjs(); if (!sel.length) return;
    clip = sel.map(cloneObj); pasteN = 0;
    // буфер — и в localStorage: вставить можно на другой странице и в
    // другой вкладке конспекта. Картинка задания туда может не влезть (лимит
    // хранилища) — тогда буфер живёт только в этой вкладке
    try { localStorage.setItem(CLIP_KEY, JSON.stringify(clip)); } catch (e) { try { localStorage.removeItem(CLIP_KEY); } catch (err) {} }
    if (cut) deleteSelected(); else toast(sel.length === 1 ? 'Скопировано' : 'Скопировано: ' + sel.length);
    syncButtons();
  }
  function paste() {
    let src = clip;
    if (!src) { try { src = JSON.parse(localStorage.getItem(CLIP_KEY) || 'null'); } catch (e) { src = null; } }
    if (!src || !src.length || !page()) return;
    pasteN++;
    const off = 24 * pasteN;
    pushUndo();
    const added = src.map(o => { const c = cloneObj(o); c.id = newId(); moveObj(c, off, off); return c; });
    added.forEach(o => objs().push(o));
    selected = new Set(added.map(o => o.id));
    changed();
  }
  function duplicate() { const sel = selectedObjs(); if (!sel.length) return; clip = sel.map(cloneObj); pasteN = 0; paste(); }

  /* ── панель инструментов ── */
  function setTool(t) {
    commitText();
    tool = t;
    if (t !== 'select') selected.clear();
    document.querySelectorAll('#edTools [data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
    canvas.style.cursor = t === 'select' ? 'default' : (t === 'text' ? 'text' : (t === 'eraser' ? 'none' : 'crosshair'));
    if (t !== 'eraser') hover = null;
    renderToolOptions();
    draw(); syncButtons();
  }
  function renderToolOptions() {
    const cb = $('edColors'), wb = $('edWidths');
    const showColors = tool !== 'eraser';
    cb.hidden = !showColors;
    cb.innerHTML = COLORS.map(c => `<button class="sw${c === color ? ' on' : ''}" data-color="${c}" style="background:${c}" title="Цвет"></button>`).join('');
    $('edErModes').hidden = tool !== 'eraser';
    document.querySelectorAll('#edErModes [data-ermode]').forEach(b => b.classList.toggle('on', b.dataset.ermode === erMode));
    let sizes, curV, dot;
    if (tool === 'eraser') { sizes = ERASER_SIZES; curV = eraserSize; dot = v => Math.round(6 + v / 5); }
    else if (tool === 'text') { sizes = TEXT_SIZES; curV = textSize; dot = null; }
    else if (tool === 'select') { sizes = []; }
    else { sizes = PEN_WIDTHS; curV = penWidth; dot = v => Math.round(3 + v * 1.4); }
    wb.innerHTML = sizes.map(v => dot
      ? `<button class="wd${v === curV ? ' on' : ''}" data-size="${v}" title="Толщина"><span style="width:${dot(v)}px;height:${dot(v)}px"></span></button>`
      : `<button class="tb txt${v === curV ? ' on' : ''}" data-size="${v}" title="Размер текста">${v === 24 ? 'S' : v === 36 ? 'M' : 'L'}</button>`).join('');
  }
  $('edTools').addEventListener('click', (e) => {
    const t = e.target.closest('[data-tool]'); if (t) { setTool(t.dataset.tool); return; }
    const c = e.target.closest('[data-color]');
    if (c) {
      color = c.dataset.color;
      // цвет при выделении — перекрасить выделенное
      const sel = selectedObjs().filter(o => o.type !== 'image');
      if (sel.length) { pushUndo(); sel.forEach(o => { o.color = color; }); changed(); }
      renderToolOptions(); return;
    }
    const s = e.target.closest('[data-size]');
    if (s) {
      const v = Number(s.dataset.size);
      if (tool === 'eraser') eraserSize = v; else if (tool === 'text') textSize = v; else penWidth = v;
      renderToolOptions(); draw(); return;
    }
    const m = e.target.closest('[data-ermode]');
    if (m) { erMode = m.dataset.ermode === 'stroke' ? 'stroke' : 'area'; try { localStorage.setItem('notesEraserMode', erMode); } catch (err) {} renderToolOptions(); return; }
  });
  $('edUndo').onclick = undo; $('edRedo').onclick = redo;
  $('edCopy').onclick = () => copySelected(false);
  $('edPaste').onclick = paste;
  $('edDel').onclick = deleteSelected;
  function syncButtons() {
    const h = hist();
    $('edUndo').disabled = !h || !h.u.length;
    $('edRedo').disabled = !h || !h.r.length;
    $('edCopy').disabled = !selected.size;
    $('edDel').disabled = !selected.size;
    let hasClip = !!clip;
    if (!hasClip) { try { hasClip = !!localStorage.getItem(CLIP_KEY); } catch (e) {} }
    $('edPaste').disabled = !hasClip || !page();
    $('edPos').textContent = pages.length ? (cur + 1) + ' / ' + pages.length : '—';
    $('edPrev').disabled = cur <= 0; $('edNext').disabled = cur >= pages.length - 1;
    $('edCount').textContent = pages.length + ' ' + plural(pages.length, 'страница', 'страницы', 'страниц');
  }

  /* ── клавиши ── */
  document.addEventListener('keydown', (e) => {
    if (!document.body.classList.contains('editing')) return;
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const mod = e.ctrlKey || e.metaKey;
    const k = e.key.toLowerCase();
    if (mod && (k === 'z' || k === 'я')) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (mod && (k === 'y' || k === 'н')) { e.preventDefault(); redo(); return; }
    if (mod && (k === 'c' || k === 'с')) { if (selected.size) { e.preventDefault(); copySelected(false); } return; }
    if (mod && (k === 'x' || k === 'ч')) { if (selected.size) { e.preventDefault(); copySelected(true); } return; }
    if (mod && (k === 'v' || k === 'м')) { e.preventDefault(); paste(); return; }
    if (mod && (k === 'd' || k === 'в')) { e.preventDefault(); duplicate(); return; }
    if (mod && (k === 'a' || k === 'ф')) { e.preventDefault(); setTool('select'); selected = new Set(objs().map(o => o.id)); draw(); syncButtons(); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') { if (selected.size) { e.preventDefault(); deleteSelected(); } return; }
    if (e.key === 'PageDown') { e.preventDefault(); go(cur + 1); return; }
    if (e.key === 'PageUp') { e.preventDefault(); go(cur - 1); return; }
    if (e.key === 'Escape') { selected.clear(); draw(); syncButtons(); return; }
    if (e.key.startsWith('Arrow') && selected.size) {
      e.preventDefault();
      const st = e.shiftKey ? 24 : 4;
      const dx = e.key === 'ArrowLeft' ? -st : e.key === 'ArrowRight' ? st : 0, dy = e.key === 'ArrowUp' ? -st : e.key === 'ArrowDown' ? st : 0;
      pushUndo(); selectedObjs().forEach(o => moveObj(o, dx, dy)); changed(); return;
    }
    if (mod || e.altKey) return;
    const map = { v: 'select', p: 'pen', e: 'eraser', t: 'text', l: 'line', a: 'arrow', r: 'rect', o: 'ellipse' };
    if (map[k]) setTool(map[k]);
  });

  /* ── страницы слева ── */
  const thumbTimers = new Map();
  function scheduleThumb(id) {
    clearTimeout(thumbTimers.get(id));
    thumbTimers.set(id, setTimeout(() => drawThumb(id), 250));
  }
  function drawThumb(id) {
    const item = $('edPages').querySelector('.pg-item[data-id="' + id + '"]');
    const p = pages.find(x => x.id === id);
    if (!item || !p) return;
    const cv = item.querySelector('canvas');
    const k = cv.width / W;
    const c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    renderPage(c, p, k, () => scheduleThumb(id));
  }
  function caption(p) {
    const t = NS.fmtTime(p.createdAt || Date.now());
    const what = [p.trainerTitle, p.proto].filter(Boolean).join(' · ');
    const res = p.result || 'notes';
    return `${esc(t)}${what ? ' · ' + esc(what) : ''}<br><span class="pg-res ${esc(res)}">${esc(NS.RESULT_LABEL[res] || '')}</span>`;
  }
  function renderPagesList() {
    const box = $('edPages');
    box.innerHTML = '';
    pages.forEach((p, i) => {
      const it = document.createElement('div');
      it.className = 'pg-item' + (i === cur ? ' sel' : '');
      it.dataset.id = p.id; it.draggable = true;
      it.innerHTML = `<canvas width="200" height="${Math.round(200 * H / W)}"></canvas><span class="pg-num">${i + 1}</span>
        <div class="pg-acts"><button data-pact="up" title="Выше">▲</button><button data-pact="down" title="Ниже">▼</button><button data-pact="del" class="del" title="Удалить страницу">✕</button></div>
        <div class="pg-cap">${caption(p)}</div>`;
      box.appendChild(it);
      drawThumb(p.id);
    });
    const add = document.createElement('button');
    add.className = 'btn quiet small pg-add'; add.type = 'button'; add.id = 'pgAdd';
    add.textContent = '＋ Пустая страница';
    box.appendChild(add);
    syncButtons();
  }
  $('edPages').addEventListener('click', async (e) => {
    if (e.target.closest('#pgAdd')) { addBlank(); return; }
    const it = e.target.closest('.pg-item'); if (!it) return;
    const i = pages.findIndex(p => p.id === it.dataset.id);
    const act = e.target.closest('[data-pact]');
    if (!act) { go(i); return; }
    e.stopPropagation();
    const a = act.dataset.pact;
    if (a === 'up' && i > 0) move(i, i - 1);
    else if (a === 'down' && i < pages.length - 1) move(i, i + 1);
    else if (a === 'del') {
      if (it.querySelector('.pg-confirm')) return;
      const cf = document.createElement('div');
      cf.className = 'pg-confirm';
      cf.innerHTML = 'Удалить страницу? <span><button class="btn danger small" data-pact="del-yes" type="button">Да</button> <button class="btn quiet small" data-pact="del-no" type="button">Нет</button></span>';
      it.appendChild(cf);
    } else if (a === 'del-no') { act.closest('.pg-confirm').remove(); }
    else if (a === 'del-yes') { await removePage(i); }
  });
  // перетаскивание миниатюр — смена порядка
  let dragId = null;
  $('edPages').addEventListener('dragstart', (e) => { const it = e.target.closest('.pg-item'); if (!it) return; dragId = it.dataset.id; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch (err) {} });
  $('edPages').addEventListener('dragover', (e) => {
    const it = e.target.closest('.pg-item'); if (!it || !dragId) return;
    e.preventDefault();
    const r = it.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
    $('edPages').querySelectorAll('.pg-item').forEach(x => x.classList.remove('drop-before', 'drop-after'));
    it.classList.add(after ? 'drop-after' : 'drop-before');
  });
  $('edPages').addEventListener('drop', (e) => {
    const it = e.target.closest('.pg-item'); if (!it || !dragId) return;
    e.preventDefault();
    const from = pages.findIndex(p => p.id === dragId);
    let to = pages.findIndex(p => p.id === it.dataset.id);
    const r = it.getBoundingClientRect(); if (e.clientY > r.top + r.height / 2) to++;
    if (from < to) to--;
    dragId = null;
    if (from >= 0 && to >= 0 && from !== to) move(from, to); else renderPagesList();
  });
  $('edPages').addEventListener('dragend', () => { dragId = null; $('edPages').querySelectorAll('.pg-item').forEach(x => x.classList.remove('drop-before', 'drop-after')); });

  async function move(from, to) {
    const curId = page() && page().id;
    const [p] = pages.splice(from, 1);
    pages.splice(to, 0, p);
    cur = pages.findIndex(x => x.id === curId);
    await NS.setPageOrder(session.id, pages.map(x => x.id));
    renderPagesList(); draw();
  }
  async function removePage(i) {
    const p = pages[i]; if (!p) return;
    commitText();
    dirty.delete(p.id);
    await NS.deletePage(session.id, p.id);
    pages.splice(i, 1); histories.delete(p.id);
    if (cur >= pages.length) cur = pages.length - 1;
    selected.clear();
    renderPagesList(); draw(); toast('Страница удалена');
  }
  async function addBlank() {
    commitText();
    const at = cur + 1;
    const p = await NS.addPage(session.id, { v: 1, objects: [], result: 'blank', trainerTitle: 'Пустая страница', proto: '' }, at);
    pages.splice(at, 0, p);
    cur = at; selected.clear();
    renderPagesList(); draw();
    scrollThumbIntoView();
  }
  function go(i) {
    if (i < 0 || i >= pages.length || i === cur) return;
    commitText();
    cur = i; selected.clear(); drag = null;
    $('edPages').querySelectorAll('.pg-item').forEach((x, k) => x.classList.toggle('sel', k === cur));
    scrollThumbIntoView();
    draw(); syncButtons();
  }
  function scrollThumbIntoView() {
    const it = $('edPages').querySelectorAll('.pg-item')[cur];
    if (it) it.scrollIntoView({ block: 'nearest' });
  }
  $('edPrev').onclick = () => go(cur - 1);
  $('edNext').onclick = () => go(cur + 1);

  /* ── новые страницы из тренажёра, пока конспект открыт ── */
  async function reloadPages() {
    const curId = page() && page().id;
    const fresh = await NS.getPages(session.id);
    const mine = new Map(pages.map(p => [p.id, p]));
    // свою (возможно ещё не записанную) правку не подменяем копией из базы
    pages = fresh.map(p => mine.get(p.id) || p);
    cur = Math.max(0, pages.findIndex(p => p.id === curId));
    if (!pages.length) cur = -1;
    renderPagesList(); draw();
  }
  NS.onChange((msg, local) => {
    if (local || !session) return;
    if (msg.t === 'page-added' && msg.sessionId === session.id) reloadPages();
  });

  /* ── название сессии ── */
  function bindTitle() {
    const inp = $('edTitle');
    inp.value = NS.sessionTitle(session);
    const save = async () => {
      const v = inp.value.replace(/\s+/g, ' ').trim();
      const auto = NS.sessionTitle(Object.assign({}, session, { name: null }));
      const name = v && v !== auto ? v : null;
      if (name === session.name) { inp.value = NS.sessionTitle(session); return; }
      session = (await NS.getSession(session.id)) || session;
      session.name = name; await NS.putSession(session);
      inp.value = NS.sessionTitle(session);
      document.title = NS.sessionTitle(session) + ' — Конспект';
    };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') inp.blur(); if (e.key === 'Escape') { inp.value = NS.sessionTitle(session); inp.blur(); } });
    inp.addEventListener('blur', save);
  }

  /* ── PDF ── */
  async function buildPdf() {
    if (!pages.length) { toast('В конспекте нет страниц'); return; }
    if (!window.jspdf) { toast('Не загрузилась библиотека PDF'); return; }
    commitText(); await flushSave();
    const btn = $('edPdf'); const was = btn.textContent;
    btn.classList.add('busy');
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pw = 297, ph = 210;
      // лист чуть «шире» А4 (76 × 54 клетки) — вписываем по высоте и
      // центрируем: поля по бокам меньше миллиметра
      const ih = ph, iw = ph * W / H, ix = (pw - iw) / 2;
      const k = 1.4;
      const cv = document.createElement('canvas'); cv.width = Math.round(W * k); cv.height = Math.round(H * k);
      const c = cv.getContext('2d');
      for (let i = 0; i < pages.length; i++) {
        btn.textContent = 'PDF: ' + (i + 1) + ' из ' + pages.length;
        await imagesReady(pages[i].objects || []);
        renderPage(c, pages[i], k, null);
        if (i) doc.addPage('a4', 'landscape');
        doc.addImage(cv.toDataURL('image/jpeg', 0.92), 'JPEG', ix, 0, iw, ih);
        await new Promise(r => setTimeout(r, 0));
      }
      const d = new Date(session.createdAt || Date.now());
      const stamp = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      const base = (session.name || 'конспект ' + stamp).replace(/[\\/:*?"<>|]+/g, ' ').trim();
      doc.save(base + '.pdf');
      window.__lastPdfPages = pages.length;   // для теста
    } catch (e) {
      console.error(e); toast('PDF не собрался');
    } finally {
      btn.textContent = was; btn.classList.remove('busy');
    }
  }
  $('edPdf').onclick = buildPdf;

  /* ── «Сохранить как доску» ── */
  async function saveAsBoard() {
    if (!pages.length) { toast('В конспекте нет страниц'); return; }
    commitText(); await flushSave();
    const board = NS.boardFromSession(session, pages);
    await NS.putOutbox({ id: board.id, board, createdAt: Date.now() });
    const href = 'boards.html#board=' + encodeURIComponent(board.id);
    const w = window.open(href, '_blank');
    toast(w ? 'Доска создаётся во вкладке досок' : 'Доска сохранена — откройте «Доски»');
    window.__lastBoardId = board.id;   // для теста
  }
  $('edBoard').onclick = saveAsBoard;

  $('edBack').onclick = async () => { commitText(); await flushSave(); location.href = 'notes.html'; };

  async function openEditor(id) {
    session = await NS.getSession(id);
    if (!session) { toast('Такой сессии нет — показываю список'); history.replaceState(null, '', 'notes.html'); showList(); return; }
    document.body.classList.add('editing');
    document.title = NS.sessionTitle(session) + ' — Конспект';
    $('homeBtn').hidden = true;
    pages = await NS.getPages(id);
    cur = pages.length ? 0 : -1;
    const want = params.get('p');
    if (want) { const i = pages.findIndex(p => p.id === want); if (i >= 0) cur = i; }
    bindTitle();
    renderPagesList();
    setTool('pen');
    layout();
    window.addEventListener('resize', layout);
  }
  function showList() {
    document.body.classList.remove('editing');
    renderList();
    $('slList').addEventListener('click', onListClick);
    $('slNew').onclick = async () => { const s = await NS.startNew(); location.href = 'notes.html?s=' + encodeURIComponent(s.id); };
    NS.onChange((msg, local) => { if (!local && !document.body.classList.contains('editing')) renderList(); });
  }

  // для тестов: состояние редактора без доступа к замыканию
  window.__notesEditor = {
    state: () => ({ session, pages, cur, tool, erMode, selected: [...selected], view }),
    setTool, go, flushSave, undo, redo, paste, copySelected, deleteSelected, buildPdf, saveAsBoard,
    select: (ids) => { selected = new Set(ids); draw(); syncButtons(); },
    toScreen: (p) => { const r = canvas.getBoundingClientRect(); return { x: r.left + p.x * view.s, y: r.top + p.y * view.s }; },
  };

  if (SID) openEditor(SID); else showList();
})();
