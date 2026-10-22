/* Ленивая загрузка тяжёлых библиотек экспорта: html2canvas (снимок
   задания — 47 КБ) и jsPDF (PDF — 116 КБ).

   Почему так. Раньше обе подключались обычными <script> в <head>: браузер
   качал и выполнял их до показа страницы, хотя нужны они только по
   нажатию («PDF», снимок задания в конспект или на доску). На медленном
   телефоне это заметная часть времени до первого текста.

   Почему не «только по нажатию». После await внутри обработчика нажатия
   браузер может уже не считать скачивание PDF действием пользователя
   (особенно Safari), а снимок задания должен сниматься сразу, пока задание
   ещё на экране. Поэтому библиотеки догружаются в фоне сразу после загрузки
   страницы — к первому нажатию они почти всегда уже есть, а load() —
   страховка на случай «нажали в первую секунду».

   Подключение: <script src="lazy-libs.js" data-preload="html2canvas jspdf">
   — в data-preload то, что нужно этой странице. Снаружи:
   window.MathhLibs.load('html2canvas' | 'jspdf') → Promise с библиотекой. */
(function () {
  'use strict';
  if (window.MathhLibs) return;

  const LIBS = {
    html2canvas: { src: 'html2canvas.min.js', get: () => window.html2canvas },
    jspdf: { src: 'jspdf.umd.min.js', get: () => window.jspdf },
  };
  const pending = {};

  function load(name) {
    const lib = LIBS[name];
    if (!lib) return Promise.reject(new Error('неизвестная библиотека ' + name));
    if (lib.get()) return Promise.resolve(lib.get());
    if (pending[name]) return pending[name];
    pending[name] = new Promise((resolve, reject) => {
      // тег с тем же адресом мог уже вставить кто-то другой (lesson-notes.js
      // сам догружает html2canvas) — тогда ждём его, а не качаем второй раз
      let s = document.querySelector('script[src="' + lib.src + '"]');
      if (!s) {
        s = document.createElement('script');
        s.src = lib.src;
        s.async = true;
        document.head.appendChild(s);
      }
      const fail = () => {
        // сбой сети не должен навсегда запомниться: следующее нажатие
        // попробует скачать заново
        delete pending[name];
        if (s.parentNode && !lib.get()) s.parentNode.removeChild(s);
        reject(new Error('не загрузилась библиотека ' + name));
      };
      s.addEventListener('load', () => (lib.get() ? resolve(lib.get()) : fail()));
      s.addEventListener('error', fail);
      // тег мог успеть загрузиться до того, как мы на него подписались
      if (lib.get()) resolve(lib.get());
    });
    return pending[name];
  }

  window.MathhLibs = { load };

  const me = document.currentScript;
  const want = ((me && me.getAttribute('data-preload')) || '').split(/\s+/).filter(Boolean);
  if (want.length) {
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 300));
    const start = () => idle(() => want.forEach((n) => load(n).catch(() => {})), { timeout: 2000 });
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
  }
})();
