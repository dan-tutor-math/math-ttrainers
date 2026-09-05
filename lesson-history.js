/* ═══════════════ lesson-history.js — «История/конспект урока» (Промпт №23) ═══════════════
   Общий, не завязанный на конкретный тренажёр модуль: при смене/обновлении задания
   сохраняет «снимок» — картинку «как есть» (текст задания + все заметки доски поверх
   него, в том масштабе, в котором они были на момент решения) — ПЕРЕД тем, как доска
   для этого задания очищается. Снимки копятся в памяти (только на время сессии,
   ничего не отправляется на сервер) и в конце собираются в один PDF по кнопке
   «Скачать PDF» в панели «Совместный доступ».

   Технически: детач-клон + html2canvas — надёжный способ отрендерить DOM-элемент
   «как есть» на картинку без гонки с последующей мутацией живого DOM (сам элемент
   не трогаем, рендерим его копию). Поверх картинки с DOM накладываем обрезанные по
   тому же прямоугольнику куски слоёв чернил доски (обычный «лист» + фоновый слой) —
   мост к ним даёт window.__boardCanvasEl(), который регистрирует сама доска. Все
   размеры/координаты берём в пикселях viewport (getBoundingClientRect), синхронно,
   одним снимком времени — до всякого await, чтобы прокрутка/ресайз между тем не
   могли рассинхронизировать наложение. */
(function () {
  'use strict';

  const snapshots = []; // { dataUrl, w, h, ts, scope }
  let countChangeCb = null;

  function notifyCountChanged() {
    if (countChangeCb) { try { countChangeCb(snapshots.length); } catch (e) {} }
    if (window.TrainerSession && window.TrainerSession.notifyHistoryChanged) {
      try { window.TrainerSession.notifyHistoryChanged(); } catch (e) {}
    }
  }

  // ── склеивание обрезанного фрагмента исходного канваса поверх целевого,
  // с учётом того, что у обоих может быть свой масштаб (devicePixelRatio) —
  // всё сводится к общей системе координат viewport (CSS-пиксели) ──
  function cropCanvasOnto(destCanvas, destRect, srcCanvas, srcRect) {
    if (!srcCanvas || !srcRect || srcRect.width <= 0 || srcRect.height <= 0) return;
    const ox1 = Math.max(destRect.left, srcRect.left);
    const oy1 = Math.max(destRect.top, srcRect.top);
    const ox2 = Math.min(destRect.left + destRect.width, srcRect.left + srcRect.width);
    const oy2 = Math.min(destRect.top + destRect.height, srcRect.top + srcRect.height);
    if (ox2 <= ox1 || oy2 <= oy1) return; // клип и цель не пересекаются на экране
    const srcScaleX = srcCanvas.width / srcRect.width;
    const srcScaleY = srcCanvas.height / srcRect.height;
    const destScaleX = destCanvas.width / destRect.width;
    const destScaleY = destCanvas.height / destRect.height;
    const sx = (ox1 - srcRect.left) * srcScaleX;
    const sy = (oy1 - srcRect.top) * srcScaleY;
    const sw = (ox2 - ox1) * srcScaleX;
    const sh = (oy2 - oy1) * srcScaleY;
    const dx = (ox1 - destRect.left) * destScaleX;
    const dy = (oy1 - destRect.top) * destScaleY;
    const dw = (ox2 - ox1) * destScaleX;
    const dh = (oy2 - oy1) * destScaleY;
    try {
      destCanvas.getContext('2d').drawImage(srcCanvas, sx, sy, sw, sh, dx, dy, dw, dh);
    } catch (e) {}
  }

  // ── детач-клон: копируем узел, ставим его за пределы экрана с ЯВНО заданными
  // размерами оригинала (чтобы вёрстка/переносы совпадали 1-в-1), рендерим,
  // убираем — оригинал по ходу дела вообще не трогаем ──
  function detachedClone(el) {
    const rect = el.getBoundingClientRect();
    const clone = el.cloneNode(true);
    const holder = document.createElement('div');
    holder.style.cssText = 'position:fixed;left:-10000px;top:0;pointer-events:none;'
      + 'width:' + Math.ceil(rect.width) + 'px;height:' + Math.ceil(rect.height) + 'px;'
      + 'overflow:visible;';
    clone.style.width = Math.ceil(rect.width) + 'px';
    clone.style.height = Math.ceil(rect.height) + 'px';
    clone.style.margin = '0';
    // клон временно висит в живом документе (offscreen) — html2canvas умеет
    // рендерить только реально «положенные» в layout узлы. Но cloneNode(true)
    // копирует id как есть, а на странице id уникальны (JS-код много где ищет
    // элементы по document.getElementById/querySelectorAll) — снимаем id со
    // всего клона, чтобы на те несколько секунд, пока идёт рендер, в документе
    // не оказалось случайных дублей #answerInput, #card1Wrapper и т.п.
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    holder.setAttribute('data-lesson-history-clone', '1');
    holder.setAttribute('aria-hidden', 'true');
    holder.appendChild(clone);
    document.body.appendChild(holder);
    // синхронизируем значения полей ввода — cloneNode не копирует «живое» .value
    try {
      const origInputs = el.querySelectorAll('input,textarea,select');
      const cloneInputs = clone.querySelectorAll('input,textarea,select');
      origInputs.forEach((o, i) => { if (cloneInputs[i]) {
        if ('value' in o) cloneInputs[i].value = o.value;
        if (o.checked !== undefined) cloneInputs[i].checked = o.checked;
      }});
    } catch (e) {}
    return { holder, clone, rect };
  }

  async function capture(scope, targetEl) {
    if (!targetEl || !window.html2canvas) return null;
    // ── все прямоугольники — синхронно, одним снимком времени ──
    const targetRect = targetEl.getBoundingClientRect();
    if (targetRect.width <= 0 || targetRect.height <= 0) return null;
    const bridge = window.__boardCanvasEl ? window.__boardCanvasEl() : null;
    const sheetInfo = bridge && bridge.sheet ? { canvas: bridge.sheet.inkCanvas, rect: bridge.sheet.rect() } : null;
    const bgInfo = bridge && bridge.bg ? { canvas: bridge.bg.inkCanvas, rect: bridge.bg.rect() } : null;

    const { holder, clone } = detachedClone(targetEl);
    let domCanvas;
    try {
      domCanvas = await window.html2canvas(clone, {
        backgroundColor: getComputedStyle(document.body).backgroundColor || '#ffffff',
        useCORS: true,
        scale: window.devicePixelRatio || 1,
        logging: false,
        width: Math.ceil(targetRect.width),
        height: Math.ceil(targetRect.height),
        imageTimeout: 8000, // не позволяем одной недогрузившейся картинке/шрифту подвесить весь снимок надолго
      });
    } catch (e) {
      domCanvas = null;
    } finally {
      holder.remove();
    }
    if (!domCanvas) return null;

    const destRect = { left: targetRect.left, top: targetRect.top, width: targetRect.width, height: targetRect.height };
    if (sheetInfo && sheetInfo.canvas) cropCanvasOnto(domCanvas, destRect, sheetInfo.canvas, sheetInfo.rect);
    if (bgInfo && bgInfo.canvas) cropCanvasOnto(domCanvas, destRect, bgInfo.canvas, bgInfo.rect);

    const snap = { dataUrl: domCanvas.toDataURL('image/png'), w: domCanvas.width, h: domCanvas.height, ts: Date.now(), scope: scope || 'single' };
    snapshots.push(snap);
    notifyCountChanged();
    return snap;
  }

  // вызывается со всех триггерных точек тренажёра; сам решает, включено ли
  // автосохранение, — вызывающему коду не нужно об этом думать
  function captureIfEnabled(scope, targetEl) {
    if (!window.TrainerSession || !window.TrainerSession.getAutosaveHistory || !window.TrainerSession.getAutosaveHistory()) return Promise.resolve(null);
    return capture(scope, targetEl).catch(() => null);
  }

  function getCount() { return snapshots.length; }
  function getSnapshots() { return snapshots.slice(); }
  function clear() { snapshots.length = 0; notifyCountChanged(); }
  function onCountChange(cb) { countChangeCb = cb; }

  async function downloadPdf() {
    if (!snapshots.length || !window.jspdf) return false;
    const { jsPDF } = window.jspdf;
    let doc = null;
    for (const snap of snapshots) {
      const orientation = snap.w >= snap.h ? 'landscape' : 'portrait';
      const pageOpts = { orientation, unit: 'px', format: [snap.w, snap.h] };
      if (!doc) doc = new jsPDF(pageOpts);
      else doc.addPage([snap.w, snap.h], orientation);
      doc.addImage(snap.dataUrl, 'PNG', 0, 0, snap.w, snap.h);
    }
    if (!doc) return false;
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    doc.save(`история-урока-${stamp}.pdf`);
    return true;
  }

  window.LessonHistory = { capture, captureIfEnabled, getCount, getSnapshots, clear, onCountChange, downloadPdf };
})();
