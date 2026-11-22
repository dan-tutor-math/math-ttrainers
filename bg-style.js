/* bg-style.js — единый фон страниц: главная и все тренажёры.

   Зачем. Раньше клетка на фоне была прописана в body каждой страницы
   отдельно: у lcm.html, oge7.html и ещё десятка она была, у oge8, русского,
   обществознания и английского — нет. Выбрать фон нельзя было нигде.
   Теперь узор — один выбор «Фон страницы» (главная, меню «⋯»), хранится на
   этом устройстве, и все страницы читают его отсюда. В самих страницах
   узора больше нет: остались только цветные пятна и --bg.

   Как работает. Скрипт стоит в <head> сразу после определения темы и
   вставляет <style>, который задаёт слои фона body: два цветных пятна,
   узор и сплошной --bg. Свойства с !important — чтобы не зависеть от того,
   что ещё написано в body конкретной страницы. Цвет линий свой (--bgp-line),
   а не --grid: на русском, обществознании и английском --grid не задан.

   Выбор:
     'auto' (по умолчанию) — по предмету: клетка у математики и физики,
                             у остальных предметов чистый фон;
     'none' | 'grid' | 'big' | 'dots' | 'lines' — один узор на всех страницах.
   Предмет страницы: на главной — html[data-subject] (меняется при выборе
   вкладки, поэтому за атрибутом идёт слежение), в тренажёре — по имени
   файла (rus_*, soc_*, eng_*, phys*, inf*; всё остальное — математика).

   API: MathhBg.get() / set(id) / presets / effective() / onChange(fn). */
(function () {
  'use strict';
  if (window.MathhBg) return;

  var KEY = 'bgPreset';
  var root = document.documentElement;

  // id → подпись и описание слоя узора ([image, size] или null — без узора)
  var L = 'var(--bgp-line)';
  var PRESETS = [
    { id: 'auto',  title: 'По предмету' },
    { id: 'none',  title: 'Чистый' },
    { id: 'grid',  title: 'Клетка',        img: 'linear-gradient(' + L + ' 1px,transparent 1px),linear-gradient(90deg,' + L + ' 1px,transparent 1px)', size: '24px 24px,24px 24px' },
    { id: 'big',   title: 'Крупная клетка', img: 'linear-gradient(' + L + ' 1px,transparent 1px),linear-gradient(90deg,' + L + ' 1px,transparent 1px)', size: '48px 48px,48px 48px' },
    { id: 'dots',  title: 'Точки',         img: 'radial-gradient(circle,' + L + ' 1.4px,transparent 1.6px)', size: '22px 22px' },
    { id: 'lines', title: 'Линейка',       img: 'linear-gradient(' + L + ' 1px,transparent 1px)', size: '28px 28px' }
  ];
  // предметы, у которых в режиме «по предмету» клетка (остальные — чистый фон)
  var GRID_SUBJECTS = { math: 1, phys: 1 };

  function byId(id) { for (var i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === id) return PRESETS[i]; return null; }

  function get() {
    var v = 'auto';
    try { v = localStorage.getItem(KEY) || 'auto'; } catch (e) {}
    return byId(v) ? v : 'auto';
  }

  function subject() {
    // палитра по предмету (subject-palette.js): педагог мог выбрать предмет
    // сам — тогда и фон «по предмету» идёт от него, а не от страницы
    if (window.MathhPalette) return window.MathhPalette.current();
    // сначала имя файла: у тренажёров data-subject может быть общим
    var f = (location.pathname.split('/').pop() || '').toLowerCase();
    if (/^rus/.test(f)) return 'rus';
    if (/^soc/.test(f)) return 'soc';
    if (/^eng/.test(f)) return 'eng';
    if (/^phys?/.test(f)) return 'phys';
    if (/^inf/.test(f)) return 'inf';
    var a = root.getAttribute('data-subject');
    return a || 'math';
  }

  // какой узор реально рисуется сейчас
  function effective() {
    var v = get();
    if (v === 'auto') return GRID_SUBJECTS[subject()] ? 'grid' : 'none';
    return v;
  }

  var style = document.createElement('style');
  style.id = 'mathh-bg';
  var BLOBS = 'radial-gradient(circle at 6% -8%,var(--blob-1) 0%,transparent 40%),radial-gradient(circle at 102% 8%,var(--blob-2) 0%,transparent 38%)';
  function render() {
    var p = byId(effective());
    var img = BLOBS, size = 'var(--bgp-blob-size,auto),var(--bgp-blob-size,auto)';
    var rep = 'var(--bgp-blob-repeat,repeat),var(--bgp-blob-repeat,repeat)';
    if (p && p.img) { img += ',' + p.img; size += ',' + p.size; rep += ',repeat,repeat'; }
    root.setAttribute('data-bg', p ? p.id : 'none');
    style.textContent =
      ':root{--bgp-line:#DCE4F0}' +
      'html[data-theme="dark"]{--bgp-line:#232A44}' +
      'html body{background-image:' + img + '!important;' +
      'background-size:' + size + '!important;' +
      'background-repeat:' + rep + '!important;' +
      'background-position:0 0!important;' +
      'background-color:var(--bg)!important}';
  }
  (document.head || root).appendChild(style);
  render();

  var subs = [];
  function changed() { render(); subs.forEach(function (fn) { try { fn(get(), effective()); } catch (e) {} }); }
  function set(id) {
    if (!byId(id)) return;
    try { if (id === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, id); } catch (e) {}
    changed();
  }

  // выбор, сделанный в другой вкладке, и переключение предмета на главной
  window.addEventListener('storage', function (e) { if (e.key === KEY) changed(); });
  new MutationObserver(function () { if (get() === 'auto') changed(); })
    .observe(root, { attributes: true, attributeFilter: ['data-subject', 'data-palette-subject'] });

  window.MathhBg = {
    presets: PRESETS, get: get, set: set, effective: effective,
    onChange: function (fn) { subs.push(fn); }
  };
})();
