/* Плавающие окна кабинета: положение, общий лимит и переход от плашки ученика. */
(function(){
  'use strict';

  const GAP = 10;
  const STACK = 64;
  const phone = matchMedia('(max-width: 599px), (pointer: coarse) and (max-height: 499px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motionKey = 'mathh:cabinet:window-motion';
  const windows = [];
  const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const interactive = 'button, a, input, select, textarea, [contenteditable]';
  let allowMotion = true, flight = null, canvas = null, tray = null;
  try { allowMotion = localStorage.getItem(motionKey) !== 'off'; } catch (_) {}

  function rectOf(node){
    const r = node?.getBoundingClientRect();
    const clip = node?.closest('.sc-gwrap, .cs-scroll')?.getBoundingClientRect();
    if (!r?.width || !r.height) return null;
    const left = Math.max(0, r.left, clip?.left ?? 0);
    const top = Math.max(0, r.top, clip?.top ?? 0);
    const right = Math.min(innerWidth, r.right, clip?.right ?? innerWidth);
    const bottom = Math.min(innerHeight, r.bottom, clip?.bottom ?? innerHeight);
    if (right <= left || bottom <= top) return null;
    return { left, top, right, bottom, width:right - left, height:bottom - top };
  }

  function setMotion(value){
    allowMotion = value;
    try { localStorage.setItem(motionKey, value ? 'on' : 'off'); } catch (_) {}
    if (!value) endFlight();
    updateTray();
  }

  function updateTray(){
    if (!tray && !windows.length) return;
    if (!tray) {
      tray = document.createElement('div');
      tray.className = 'cab-window-tray';
      tray.setAttribute('role', 'group');
      tray.setAttribute('aria-label', 'Открытые окна');
      document.body.append(tray);
    }
    tray.hidden = !windows.length;
    windows.forEach((item, i) => { item.el.style.zIndex = STACK + i; });
    if (flight) canvas.style.zIndex = flight.item.el.style.zIndex;
    const focused = document.activeElement;
    const entries = [...windows].sort((a,b) => a.order - b.order);
    const items = entries.map(item => {
      const button = item.tab ||= document.createElement('button');
      button.type = 'button';
      button.textContent = item.title();
      button.title = item.title();
      button.setAttribute('aria-pressed', String(item === windows.at(-1)));
      button.onclick = () => item.raise(true);
      return button;
    });
    const toggle = tray.motionToggle ||= document.createElement('button');
    toggle.type = 'button';
    toggle.textContent = 'Анимация';
    toggle.setAttribute('aria-pressed', String(allowMotion && !reduced.matches));
    toggle.disabled = reduced.matches;
    toggle.onclick = () => setMotion(!allowMotion);
    if (items.length + 1 !== tray.children.length || items.some((item, i) => item !== tray.children[i])) {
      tray.replaceChildren(...items, toggle);
      if (focused?.isConnected && tray.contains(focused)) focused.focus({ preventScroll:true });
    }
  }

  function room(){
    if (phone.matches) {
      endFlight();
      for (const item of [...windows]) item.dismiss();
    }
    return windows.length < 5;
  }
  phone.addEventListener('change', () => {
    if (phone.matches) for (const item of windows.slice(0, -1)) item.dismiss();
  });
  reduced.addEventListener('change', () => { if (reduced.matches) endFlight(); updateTray(); });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog[open]')) return;
    const item = windows.at(-1);
    if (!item || !item.canEscape()) return;
    event.preventDefault();
    item.dismiss(false, true);
  });

  function endFlight(finish = true){
    if (!flight) return;
    const current = flight;
    flight = null;
    cancelAnimationFrame(current.frame);
    canvas.hidden = true;
    if (finish) current.done();
  }

  // Снимаем только видимую часть окна. Сетка за пределами прокрутки не участвует в эффекте.
  function capture(el, rect){
    const image = document.createElement('canvas');
    image.width = Math.ceil(rect.width);
    image.height = Math.ceil(rect.height);
    const ctx = image.getContext('2d');
    if (!ctx) return null;
    ctx.translate(-rect.left, -rect.top);
    const range = document.createRange();
    let budget = 220;
    const outside = (box, clip) => box.right <= clip.left || box.left >= clip.right
      || box.bottom <= clip.top || box.top >= clip.bottom;
    function text(value, bounds, style){
      if (!value || !bounds.width || !bounds.height) return;
      ctx.font = [style.fontStyle, style.fontWeight, style.fontSize, style.fontFamily].join(' ');
      ctx.fillStyle = style.color;
      ctx.textBaseline = 'middle';
      ctx.fillText(value, bounds.left, bounds.top + Math.min(bounds.height, parseFloat(style.fontSize) * 1.25) / 2, bounds.width);
    }
    function draw(node, clip){
      if (budget <= 0 || node.matches('dialog, datalist, option, script, style, .cab-resize')) return;
      const r = node.getBoundingClientRect();
      if (outside(r, clip)) return;
      const style = getComputedStyle(node);
      if (style.visibility !== 'visible' || style.display === 'none') return;
      budget--;
      ctx.save();
      const radius = Math.min(parseFloat(style.borderTopLeftRadius) || 0, r.width / 2, r.height / 2);
      ctx.beginPath();
      ctx.roundRect(r.left, r.top, r.width, r.height, radius);
      if (style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent') {
        ctx.fillStyle = style.backgroundColor;
        ctx.fill();
      }
      if (parseFloat(style.borderTopWidth) > 0) {
        ctx.strokeStyle = style.borderTopColor;
        ctx.lineWidth = parseFloat(style.borderTopWidth);
        ctx.stroke();
      }
      if (node === el || /auto|scroll|hidden|clip/.test(style.overflow)) {
        ctx.clip();
        clip = { left:Math.max(clip.left, r.left), top:Math.max(clip.top, r.top),
          right:Math.min(clip.right, r.right), bottom:Math.min(clip.bottom, r.bottom) };
      }
      if (node.matches('input, textarea, select')) {
        const left = r.left + (parseFloat(style.paddingLeft) || 0) + 2;
        const top = r.top + (parseFloat(style.paddingTop) || 0) + 3;
        const label = node.selectedOptions ? node.selectedOptions[0]?.textContent : node.value || node.placeholder;
        if (node.type !== 'checkbox') text(label, { left, top, width:r.right - left - 4, height:r.height }, style);
      } else if (!node.matches('svg')) {
        for (const child of node.childNodes) {
          if (budget <= 0) break;
          if (child.nodeType === Node.ELEMENT_NODE) draw(child, clip);
          if (child.nodeType !== Node.TEXT_NODE || !child.textContent.trim()) continue;
          range.selectNodeContents(child);
          const bounds = range.getBoundingClientRect();
          if (!outside(bounds, clip)) text(child.textContent.trim().replace(/\s+/g, ' '), bounds, style);
        }
      }
      ctx.restore();
    }
    draw(el, rect);
    return image;
  }

  function paintFlight(current, p){
    const { ctx, image, horizontal, sign, start, length, span, cross, slot, slotCross } = current;
    const strips = 80;
    const axis = horizontal ? image.width : image.height;
    const breadth = horizontal ? image.height : image.width;
    const strip = axis / strips;
    const far = smooth((p - .13) / .87), near = smooth(p / .79);
    const points = [];
    for (let i = 0; i <= strips; i++) {
      const u = i / strips;
      const mouth = smooth((p - (1 - u) * .61) / .39);
      const pull = slot < start + length ? smooth(p) : mix(far, near, smooth(u));
      points.push({
        along:mix(start + u * length, slot - 1 + u * 2, pull) * sign,
        center:mix(cross, slotCross, mix(pull, mouth, .68)),
        width:mix(span, 20, mouth),
      });
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1 - smooth((p - .93) / .07);
    for (let i = 0; i < strips; i++) {
      const a = points[sign > 0 ? i : i + 1], b = points[sign > 0 ? i + 1 : i];
      const source = (sign > 0 ? i : strips - i - 1) * strip;
      const width = (a.width + b.width) / 2;
      const along = Math.max(.02, b.along - a.along) / strip;
      const skew = (b.center - a.center) / strip;
      const edge = a.center - width / 2;
      const drawn = strip + Math.min(.48 / along, strip * .7);
      if (horizontal) {
        ctx.setTransform(along, skew, 0, width / breadth, a.along, edge);
        ctx.drawImage(image, source, 0, strip, breadth, 0, 0, drawn, breadth);
      } else {
        ctx.setTransform(width / breadth, 0, skew, along, edge, a.along);
        ctx.drawImage(image, 0, source, breadth, strip, 0, 0, breadth, drawn);
      }
    }
    ctx.resetTransform();
  }

  function animate(item, source, closing, done){
    if (flight || !source || !allowMotion || reduced.matches) { done(); return; }
    const el = item.el, rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) { done(); return; }
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'cab-genie';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.append(canvas);
    }
    let image, ctx;
    try {
      image = capture(el, rect);
      ctx = canvas.getContext('2d');
    } catch (_) {}
    if (!image || !ctx) { canvas.hidden = true; done(); return; }
    canvas.width = document.documentElement.clientWidth;
    canvas.height = innerHeight;
    const sx = source.left + source.width / 2, sy = source.top + source.height / 2;
    const dx = sx - rect.left - rect.width / 2, dy = sy - rect.top - rect.height / 2;
    const horizontal = Math.abs(dx) / rect.width > Math.abs(dy) / rect.height;
    const length = horizontal ? rect.width : rect.height;
    const span = horizontal ? rect.height : rect.width;
    const sign = (horizontal ? dx : dy) >= 0 ? 1 : -1;
    const bound = horizontal ? rect.left : rect.top;
    const geometry = { ctx, image, horizontal, sign, length, span, start:sign > 0 ? bound : -bound - length,
      slot:(horizontal ? sx : sy) * sign, slotCross:horizontal ? sy : sx,
      cross:(horizontal ? rect.top : rect.left) + span / 2 };
    el.style.visibility = 'hidden';
    el.inert = true;
    canvas.hidden = false;
    canvas.dataset.direction = closing ? 'close' : 'open';
    canvas.style.zIndex = el.style.zIndex;
    const current = flight = { item, done, frame:0, target:closing ? 1 : 0, progress:closing ? 0 : 1 };
    let previous, slowFrames = 0;
    function tick(now){
      const elapsed = previous ? now - previous : 0;
      if (elapsed > 47 && ++slowFrames >= 3) {
        setMotion(false);
        return;
      }
      previous = now;
      current.progress = clamp(current.progress + (current.target ? 1 : -1) * elapsed / 400, 0, 1);
      paintFlight(geometry, current.progress);
      if (current.progress === current.target) endFlight();
      else current.frame = requestAnimationFrame(tick);
    }
    current.frame = requestAnimationFrame(tick);
  }

  let order = 0;
  function attach(el, { anchor, avoid = anchor, avoidVertically = anchor, motion = true,
    title, dismiss, canEscape = () => true, scroll = false }){
    let x = 0, y = 0, gesture = null, placed = false, sized = false, closed = false, closing = false;
    const events = new AbortController();
    const options = { signal:events.signal };
    let content = el;
    if (scroll) {
      content = document.createElement('div');
      content.className = 'cab-window-scroll';
      content.append(...el.childNodes);
      el.append(content);
    }
    el.classList.add('cab-float');

    function put(left, top){
      x = clamp(left, GAP, document.documentElement.clientWidth - el.offsetWidth - GAP);
      y = clamp(top, GAP, innerHeight - el.offsetHeight - GAP);
      el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    }

    function place(){
      el.style.removeProperty('--cab-float-limit');
      if (placed) { put(x, y); return; }
      const source = rectOf(anchor()), width = document.documentElement.clientWidth;
      if (!source) { put(width - el.offsetWidth - GAP, 64); return; }
      const area = rectOf(avoid()) || source;
      const left = area.left - 2 * GAP, right = width - area.right - 2 * GAP;
      const w = el.offsetWidth;
      if (Math.max(left, right) >= w) {
        put(left > right ? area.left - w - GAP : area.right + GAP, source.top - 16);
        return;
      }
      const lesson = rectOf(avoidVertically()) || source;
      const above = lesson.top - 2 * GAP, below = innerHeight - lesson.bottom - 2 * GAP;
      const top = above > below, available = top ? above : below;
      if (available >= 148) el.style.setProperty('--cab-float-limit', Math.floor(available) + 'px');
      put(source.left + (source.width - w) / 2, top ? lesson.top - GAP - el.offsetHeight : lesson.bottom + GAP);
    }

    function size(w, h){
      el.style.width = w + 'px';
      el.style.height = h + 'px';
    }
    function limits(){
      const w = document.documentElement.clientWidth - 2 * GAP;
      const h = innerHeight - 2 * GAP;
      return { w, h, minW:Math.min(295, w), minH:Math.min(190, h) };
    }
    function resize(start, edge, dx, dy){
      const { w, h, minW, minH } = limits();
      let left = start.x, top = start.y, right = start.x + start.w, bottom = start.y + start.h;
      if (edge.includes('w')) left = clamp(left + dx, GAP, right - minW);
      if (edge.includes('e')) right = clamp(right + dx, left + minW, w + GAP);
      if (edge.includes('n')) top = clamp(top + dy, GAP, bottom - minH);
      if (edge.includes('s')) bottom = clamp(bottom + dy, top + minH, h + GAP);
      size(right - left, bottom - top);
      put(left, top);
    }
    function raise(focus){
      if (closed || closing) return;
      const index = windows.indexOf(item);
      if (index >= 0 && index !== windows.length - 1) {
        windows.push(...windows.splice(index, 1));
        updateTray();
      }
      if (focus && !el.inert) el.querySelector('[data-cab-close]')?.focus({ preventScroll:true });
    }
    function stop(){
      if (!gesture) return;
      const id = gesture.id;
      gesture = null;
      if (el.hasPointerCapture(id)) el.releasePointerCapture(id);
      el.classList.remove('cab-float-moving');
    }
    function dispose(){
      if (closed) return;
      closed = true;
      stop();
      events.abort();
      observer.disconnect();
      if (flight?.item === item) endFlight(false);
      const index = windows.indexOf(item);
      if (index >= 0) windows.splice(index, 1);
      updateTray();
    }
    function close({ motion = true, restoreFocus = true, done } = {}){
      if (closed || closing) return;
      closing = true;
      stop();
      const wasActive = windows.at(-1) === item;
      const finish = () => {
        dispose();
        done?.();
        if (restoreFocus && wasActive && !windows.at(-1)?.el.contains(document.activeElement)) {
          const source = anchor();
          (source?.closest('a, button, [tabindex]') || source)?.focus({ preventScroll:true });
        }
      };
      if (flight?.item === item) {
        if (motion) {
          flight.target = 1;
          flight.done = finish;
          canvas.dataset.direction = 'close';
          return;
        }
        endFlight(false);
      }
      if (motion) animate(item, rectOf(anchor()), true, finish);
      else finish();
    }
    function shown(){
      el.style.visibility = '';
      el.inert = false;
      if (!closing && windows.at(-1) === item) raise(true);
    }
    function reopen(){
      if (closing && flight?.item === item) {
        closing = false;
        flight.target = 0;
        flight.done = shown;
        canvas.dataset.direction = 'open';
      }
      raise(true);
    }
    const item = { el, content, raise, reopen, close, dispose, dismiss, canEscape, title, order:++order, refresh:updateTray };
    for (const edge of ['n','ne','e','se','s','sw','w','nw']) {
      const handle = document.createElement(edge === 'se' ? 'button' : 'span');
      handle.className = 'cab-resize';
      handle.dataset.edge = edge;
      if (edge === 'se') {
        handle.type = 'button';
        handle.setAttribute('aria-label', 'Изменить размер окна стрелками');
        handle.addEventListener('keydown', event => {
          const step = event.shiftKey ? 32 : 10;
          const delta = { ArrowLeft:[-step,0], ArrowRight:[step,0], ArrowUp:[0,-step], ArrowDown:[0,step] }[event.key];
          if (!delta) return;
          event.preventDefault();
          placed = sized = true;
          el.style.removeProperty('--cab-float-limit');
          resize({ x, y, w:el.offsetWidth, h:el.offsetHeight }, 'se', ...delta);
        });
      } else handle.setAttribute('aria-hidden', 'true');
      el.append(handle);
    }
    const observer = new ResizeObserver(() => { if (!closing && !gesture) place(); });
    observer.observe(el);
    window.addEventListener('resize', () => {
      if (flight?.item === item) endFlight();
      if (closed || closing) return;
      stop();
      if (sized) {
        const { w, h } = limits();
        size(Math.min(parseFloat(el.style.width), w), Math.min(parseFloat(el.style.height), h));
      }
      place();
    }, options);
    el.addEventListener('focusin', () => raise(false), options);
    el.addEventListener('pointerdown', event => {
      if (closing) return;
      raise(false);
      if (gesture || event.button !== 0) return;
      const edge = event.target.closest('.cab-resize')?.dataset.edge;
      if (!edge && (!event.target.closest('[data-cab-drag]') || event.target.closest(interactive))) return;
      const start = { x, y, w:el.offsetWidth, h:el.offsetHeight };
      gesture = { id:event.pointerId, edge, start, px:event.clientX, py:event.clientY };
      placed = true;
      if (edge) sized = true;
      if (sized) size(start.w, start.h);
      el.style.removeProperty('--cab-float-limit');
      el.setPointerCapture(event.pointerId);
      if (!edge) el.classList.add('cab-float-moving');
      if (edge === 'se') event.target.focus({ preventScroll:true });
      event.preventDefault();
    }, options);
    el.addEventListener('pointermove', event => {
      if (gesture?.id !== event.pointerId) return;
      const { edge, start, px, py } = gesture;
      if (edge) resize(start, edge, event.clientX - px, event.clientY - py);
      else put(start.x + event.clientX - px, start.y + event.clientY - py);
    }, options);
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      el.addEventListener(type, event => { if (event.pointerId === gesture?.id) stop(); }, options);
    }

    windows.push(item);
    el.style.zIndex = STACK + windows.length - 1;
    place();
    updateTray();
    if (motion) animate(item, rectOf(anchor()), false, shown);
    else shown();
    return item;
  }

  window.CabinetFloating = { attach, room };
})();
