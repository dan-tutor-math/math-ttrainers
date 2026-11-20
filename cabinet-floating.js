/* Окна кабинета привязаны к исходной строке или занятию, даже если список перерисовался. */
(function(){
  'use strict';

  const GAP = 10;
  const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
  const interactive = 'button, a, input, select, textarea, [contenteditable]';

  function rectOf(node){
    const r = node?.getBoundingClientRect();
    const clip = node?.closest('.sc-gwrap, .cs-scroll')?.getBoundingClientRect();
    if (!r || !r.width || !r.height) return null;
    const left = Math.max(0, r.left, clip?.left ?? 0);
    const top = Math.max(0, r.top, clip?.top ?? 0);
    const right = Math.min(innerWidth, r.right, clip?.right ?? innerWidth);
    const bottom = Math.min(innerHeight, r.bottom, clip?.bottom ?? innerHeight);
    if (right <= left || bottom <= top) return null;
    return { left, top, right, bottom, width:right - left, height:bottom - top };
  }

  function attach(el, { anchor, avoid = anchor, avoidVertically = anchor, motion = true }){
    let x = 0, y = 0;
    let animation = null, drag = null, moved = false, closing = false;
    const events = new AbortController();
    const options = { signal:events.signal };
    el.classList.add('cab-float');

    function put(left, top){
      x = clamp(left, GAP, document.documentElement.clientWidth - el.offsetWidth - GAP);
      y = clamp(top, GAP, window.innerHeight - el.offsetHeight - GAP);
      el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    }

    function place(){
      el.style.removeProperty('--cab-float-limit');
      if (moved) { put(x, y); return; }
      const source = rectOf(anchor());
      const width = document.documentElement.clientWidth;
      if (!source) {
        put(width - el.offsetWidth - GAP, 64);
        return;
      }
      const protectedArea = rectOf(avoid()) || source;
      const leftRoom = protectedArea.left - 2 * GAP;
      const rightRoom = width - protectedArea.right - 2 * GAP;
      const w = el.offsetWidth, h = el.offsetHeight;
      if (Math.max(leftRoom, rightRoom) >= w) {
        put(leftRoom > rightRoom ? protectedArea.left - w - GAP : protectedArea.right + GAP, source.top - 16);
        return;
      }
      // На узком экране оставляем на виду хотя бы нажатую плашку и ближайшие уроки.
      const lesson = rectOf(avoidVertically()) || source;
      const above = lesson.top - 2 * GAP, below = innerHeight - lesson.bottom - 2 * GAP;
      const useTop = above > below;
      const room = useTop ? above : below;
      if (room >= 148) el.style.setProperty('--cab-float-limit', Math.floor(room) + 'px');
      put(source.left + (source.width - w) / 2, useTop ? lesson.top - GAP - Math.min(h, el.offsetHeight) : lesson.bottom + GAP);
    }

    function targetTransform(rect){
      const sx = clamp(rect.width / el.offsetWidth, .12, .95);
      const sy = clamp(rect.height / el.offsetHeight, .12, .95);
      // Центр свёрнутого окна совпадает с центром кнопки или имени.
      const dx = rect.left + (rect.width - el.offsetWidth * sx) / 2;
      const dy = rect.top + (rect.height - el.offsetHeight * sy) / 2;
      return 'translate3d(' + dx + 'px,' + dy + 'px,0) scale(' + sx + ',' + sy + ')';
    }

    function run(keyframes, duration, done){
      animation?.cancel();
      const effect = el.animate(keyframes, { duration, easing:EASE, fill:'both' });
      animation = effect;
      effect.finished.then(() => {
        if (animation !== effect) return;
        animation = null;
        done?.();
        effect.cancel();
      }, () => {});
    }

    function stopDrag(){
      const pointer = drag?.id;
      drag = null;
      if (pointer != null && el.hasPointerCapture(pointer)) el.releasePointerCapture(pointer);
      el.classList.remove('cab-float-moving');
    }

    function dispose(){
      closing = true;
      stopDrag();
      events.abort();
      observer.disconnect();
      animation?.cancel();
      el.inert = false;
      el.classList.remove('cab-float');
      el.style.removeProperty('transform');
      el.style.removeProperty('--cab-float-limit');
    }

    const observer = new ResizeObserver(() => { if (!closing && !drag) put(x, y); });
    observer.observe(el);
    window.addEventListener('resize', () => { if (!closing && !drag) place(); }, options);
    el.addEventListener('pointerdown', event => {
      if (closing || drag || event.button !== 0 || !event.target.closest('[data-cab-drag]') || event.target.closest(interactive)) return;
      const presented = el.getBoundingClientRect();
      animation?.cancel();
      animation = null;
      const dx = (event.clientX - presented.left) * el.offsetWidth / presented.width;
      const dy = (event.clientY - presented.top) * el.offsetHeight / presented.height;
      moved = true;
      el.style.removeProperty('--cab-float-limit');
      put(event.clientX - dx, event.clientY - dy);
      drag = { id:event.pointerId, dx:event.clientX - x, dy:event.clientY - y };
      el.setPointerCapture(event.pointerId);
      el.classList.add('cab-float-moving');
      event.preventDefault();
    }, options);
    el.addEventListener('pointermove', event => {
      if (event.pointerId === drag?.id) put(event.clientX - drag.dx, event.clientY - drag.dy);
    }, options);
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      el.addEventListener(type, event => { if (event.pointerId === drag?.id) stopDrag(); }, options);
    }

    place();
    const source = rectOf(anchor());
    if (motion && typeof el.animate === 'function') {
      if (source && !reduce.matches) run([{ transform:targetTransform(source), opacity:.18 }, { transform:el.style.transform, opacity:1 }], 250);
      else run([{ opacity:.72 }, { opacity:1 }], 120);
    }
    el.querySelector('[data-cab-close]')?.focus({ preventScroll:true });

    return {
      dispose,
      close({ motion = true, restoreFocus = true, done } = {}){
        if (closing) return;
        closing = true;
        stopDrag();
        const finish = () => {
          dispose();
          done?.();
          const source = anchor();
          if (restoreFocus) (source?.closest('a, button, [tabindex]') || source)?.focus({ preventScroll:true });
        };
        if (!motion || typeof el.animate !== 'function') { finish(); return; }
        const source = rectOf(anchor());
        const style = getComputedStyle(el);
        const from = { opacity:style.opacity };
        const to = { opacity:0 };
        if (source && !reduce.matches) {
          from.transform = style.transform;
          to.transform = targetTransform(source);
        } else from.transform = to.transform = style.transform;
        el.inert = true;
        run([from, to], source && !reduce.matches ? 220 : 120, finish);
      },
    };
  }

  window.CabinetFloating = { attach };
})();
