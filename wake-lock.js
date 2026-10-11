/* ═══════════════════════════════════════════════════════════════════════
   wake-lock.js — экран не гаснет, пока идёт занятие.

   Зачем. Ученик с телефона или планшета смотрит экран учителя и почти не
   касается его: через полминуты-минуту телефон гасил экран, как будто
   ничего не происходит. Видео в браузере так не гаснет — нужно то же самое
   для занятия.

   Как. Screen Wake Lock API (navigator.wakeLock): Chrome на Android,
   Safari на iPhone и iPad с iOS 16.4. Браузер сам снимает блокировку, когда
   вкладку свернули, — поэтому берём её заново при возврате к вкладке и при
   каждом касании (некоторые браузеры дают её только после действия
   человека). Где API нет (старый iOS) — запасной путь, как у видеоплееров:
   крошечное беззвучное видео на повторе, запускается касанием и экран
   держит. На компьютере запасной путь не нужен и не включается.

   MathhWakeLock.hold() — держать экран, release() — отпустить. Повторные
   hold() ничего не ломают.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.MathhWakeLock) return;
  // 2 секунды чёрного кадра 16×16, H.264 baseline: проигрывается везде, весит 1,5 КБ
  const VIDEO = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAMzbW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAB9AAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAl10cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAB9AAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAABAAAAAQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAfQAAAAAAABAAAAAAHVbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAABAAAAAgABVxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAABgG1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAUBzdGJsAAAAuHN0c2QAAAAAAAAAAQAAAKhhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAABAAEABIAAAASAAAAAAAAAABFUxhdmM2MC4zMS4xMDIgbGlieDI2NAAAAAAAAAAAAAAAGP//AAAALmF2Y0MBQsAK/+EAFmdCwArZHsBEAAADAAQAAAMAEDxImSABAAVoy4PEyAAAABBwYXNwAAAAAQAAAAEAAAAUYnRydAAAAAAAAAqkAAAKpAAAABhzdHRzAAAAAAAAAAEAAAAEAAAgAAAAABRzdHNzAAAAAAAAAAEAAAABAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAAEAAAAAQAAACRzdHN6AAAAAAAAAAAAAAAEAAACiQAAAAsAAAALAAAACgAAABRzdGNvAAAAAAAAAAEAAANjAAAAYnVkdGEAAABabWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAbWRpcmFwcGwAAAAAAAAAAAAAAAAtaWxzdAAAACWpdG9vAAAAHWRhdGEAAAABAAAAAExhdmY2MC4xNi4xMDAAAAAIZnJlZQAAArFtZGF0AAACcgYF//9u3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE2NCByMzEwOCAzMWUxOWY5IC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAyMyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTAgcmVmPTMgZGVibG9jaz0xOi0zOi0zIGFuYWx5c2U9MHgxOjB4MTExIG1lPWhleCBzdWJtZT03IHBzeT0xIHBzeV9yZD0yLjAwOjAuNzAgbWl4ZWRfcmVmPTEgbWVfcmFuZ2U9MTYgY2hyb21hX21lPTEgdHJlbGxpcz0xIDh4OGRjdD0wIGNxbT0wIGRlYWR6b25lPTIxLDExIGZhc3RfcHNraXA9MSBjaHJvbWFfcXBfb2Zmc2V0PS00IHRocmVhZHM9MSBsb29rYWhlYWRfdGhyZWFkcz0xIHNsaWNlZF90aHJlYWRzPTAgbnI9MCBkZWNpbWF0ZT0xIGludGVybGFjZWQ9MCBibHVyYXlfY29tcGF0PTAgY29uc3RyYWluZWRfaW50cmE9MCBiZnJhbWVzPTAgd2VpZ2h0cD0wIGtleWludD0yNTAga2V5aW50X21pbj0yIHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4yMACAAAAAD2WIhAXzn///D0UAAVefgAAAAAdBmjgL5zqAAAAAB0GaVAL5zqAAAAAGQZpgFc51';
  const TOUCH = (() => { try { return navigator.maxTouchPoints > 0 || 'ontouchstart' in window; } catch (e) { return false; } })();
  let want = false, lock = null, asking = false, video = null;

  async function grab() {
    if (!want) return;
    if ('wakeLock' in navigator) {
      if (lock || asking || document.visibilityState !== 'visible') return;
      asking = true;
      try {
        lock = await navigator.wakeLock.request('screen');
        lock.addEventListener('release', () => { lock = null; });
        // пока ждали ответа, держать перестали
        if (!want) { try { lock.release(); } catch (e) {} lock = null; }
      } catch (e) {
        // отказ (нет разрешения, вкладка не на экране) — попробуем на
        // следующем касании или возврате к вкладке
        lock = null;
      } finally { asking = false; }
      return;
    }
    if (!TOUCH) return;
    if (!video) {
      video = document.createElement('video');
      video.setAttribute('playsinline', '');
      video.setAttribute('muted', '');
      video.muted = true;
      video.loop = true;
      video.setAttribute('aria-hidden', 'true');
      video.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-1;';
      video.src = VIDEO;
      (document.body || document.documentElement).appendChild(video);
    }
    if (video.paused) { try { const p = video.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {} }
  }
  function drop() {
    if (lock) { try { lock.release(); } catch (e) {} lock = null; }
    if (video) { try { video.pause(); } catch (e) {} }
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') grab(); });
  ['touchend', 'click', 'keydown'].forEach((t) => document.addEventListener(t, grab, { passive: true, capture: true }));

  window.MathhWakeLock = {
    hold() { want = true; grab(); },
    release() { want = false; drop(); },
    // касание пришло из кадра (сцена ученика): там свой документ, и наши
    // слушатели его не видят — кадр зовёт это сам
    poke() { grab(); },
    isHeld: () => !!lock || !!(video && !video.paused),
  };
})();
