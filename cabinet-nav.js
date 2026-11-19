/* Переход из рабочих разделов Mathh в личный кабинет. */
(() => {
  const query = new URLSearchParams(location.search);
  // У встроенного задания своя внешняя панель. На сцене ученика показывается только урок.
  if (window !== window.top || query.get('embed') === '1' || query.get('card') === '1' || window.__boardViewer) return;

  function cabinetLink(position = '') {
    const link = document.createElement('a');
    link.className = 'cabinet-link' + (position ? ' cabinet-link--' + position : '');
    link.href = 'cabinet.html#/schedule';
    // Доска, несохранённое поле и подключение к уроку остаются в рабочей вкладке.
    link.target = '_blank';
    link.rel = 'noopener';
    link.title = 'Открыть кабинет в новой вкладке';
    link.setAttribute('aria-label', 'Кабинет');
    link.innerHTML = '<svg viewBox="0 0 56 56" fill="none" stroke="currentColor" stroke-width="3.6" aria-hidden="true"><circle cx="28" cy="18" r="9.5"/><path d="M9 50c1.2-10 8.6-16 19-16s17.8 6 19 16" stroke-linecap="round"/></svg><span>Кабинет</span>';
    return link;
  }

  const anchors = document.querySelectorAll('[data-cabinet-after]');
  for (const anchor of anchors) anchor.after(cabinetLink(anchor.dataset.cabinetAfter));
  if (!anchors.length) {
    const home = document.querySelector('a.home-btn');
    if (home) home.after(cabinetLink(home.closest('.corner-nav') ? '' : 'corner'));
  }
  document.querySelector('#authGate .ag-card')?.append(cabinetLink());
})();
