/* Настройка ширины рабочей зоны тренажёра */
window.TrainerWorkWidth = {
  create(zone, key, clampWidth, { fixed = false } = {}) {
    const embedded = window.self !== window.top || new URLSearchParams(location.search).get('bdgen') === '1';
    const usesSavedWidth = () => !fixed && (embedded || window.TrainerSession?.isShared?.() === true);
    let restored = false;

    function restore() {
      if (restored || !usesSavedWidth()) return;
      restored = true;
      // Урок может определиться позже, когда уже применили снимок или потянули за край.
      if (zone.style.getPropertyValue('--work-w')) return;
      try {
        const width = parseFloat(localStorage.getItem(key));
        if (width) zone.style.setProperty('--work-w', clampWidth(width) + 'px');
      } catch (e) {}
    }

    restore();
    return {
      usesSavedWidth,
      getWidth() {
        // Статус урока иногда становится известен только при первом снимке.
        restore();
        return parseFloat(getComputedStyle(zone).width) || null;
      },
      save(width) {
        if (!usesSavedWidth()) return;
        try {
          localStorage.setItem(key, String(width ?? parseFloat(getComputedStyle(zone).width)));
        } catch (e) {}
      }
    };
  }
};
