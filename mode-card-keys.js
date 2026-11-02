/* ═══════════════════════════════════════════════════════════════════════
   Промпт №110: карточки типов заданий (.mode-card) — с клавиатуры.

   Карточки — div, а не button: FipiSplit переносит их между колонками, у
   них своя вёрстка (flex, медали), и страницы перерисовывают список целиком.
   Поэтому с клавиатуры тип было не выбрать: Tab перепрыгивал весь список,
   экранный диктор не знал, что это кнопки (аудит impeccable, раздел 8
   HANDOFF). Модуль не трогает разметку страниц: сам находит карточки (и
   после каждой перерисовки), даёт им роль кнопки и фокус, а Enter и пробел
   превращает в тот же щелчок, что и мышью — обработчики страниц не меняются.
   Карточки «скоро» (.soon) не нажимаются — их не трогаем.
   Подключение: <script src="mode-card-keys.js"></script> в любом месте.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  if (window.ModeCardKeys) return;
  const SEL = '.mode-card:not(.soon)';

  const st = document.createElement('style');
  st.id = 'modeCardKeysStyle';
  st.textContent = `.mode-card:focus-visible{outline:3px solid var(--ink, #1b3b6f);outline-offset:2px;}`;
  (document.head || document.documentElement).appendChild(st);

  function mark() {
    document.querySelectorAll(SEL).forEach(c => {
      if (c.tagName === 'A' || c.tagName === 'BUTTON') return;
      if (!c.hasAttribute('role')) c.setAttribute('role', 'button');
      if (!c.hasAttribute('tabindex')) c.tabIndex = 0;
    });
  }

  // один слушатель на документ — переживает любую перерисовку списка.
  // Пробел — как у настоящей кнопки, без прокрутки страницы
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const c = e.target;
    if (!c || !c.matches || !c.matches(SEL) || c.tagName === 'BUTTON' || c.tagName === 'A') return;
    e.preventDefault();
    c.click();
  });

  // список перерисовывается по ходу (медали, FipiSplit, смена раздела) —
  // помечаем заново, но не чаще раза за кадр
  let queued = false;
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; mark(); });
  }
  function start() {
    mark();
    new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.ModeCardKeys = { mark };
})();
