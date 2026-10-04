/* Меню «⋯» — общая кнопка настроек в правом верхнем углу.
 *
 * Зачем: справа сверху копились отдельные квадратные кнопки (сброс,
 * совместный доступ, тема), и каждая новая настройка добавляла ещё одну.
 * Теперь там одна кнопка «⋯»: по нажатию из неё вниз «вытекает» стеклянная
 * капсула со списком кнопок и подписями слева. Новые настройки добавляются
 * в этот список, а не новым квадратиком на экране.
 *
 * Использование:
 *   var menu = MathhMenu.mount();
 *   menu.add({ id, icon, label, onClick, keepOpen })   — новая кнопка
 *   menu.adopt(элемент, { label, keepOpen })           — перенести готовую кнопку
 *   menu.adoptShare()  — дождаться кнопки совместного доступа от
 *                        session-share.js, забрать её в меню и показывать
 *                        её состояние точкой на «⋯», пока меню закрыто
 * Готовые кнопки переносятся вместе со своими id и обработчиками — код
 * страницы, который их ищет, продолжает работать.
 */
(function () {
  'use strict';
  if (window.MathhMenu) return;
  var I = function (n) { return window.MathhIcons ? window.MathhIcons.html(n) : ''; };
  var inst = null;

  function mount() {
    if (inst) return inst;
    var wrap = document.createElement('div');
    wrap.className = 'lg-menu';
    wrap.innerHTML =
      // тень — отдельным слоем: на самом стекле она сбила бы преломление
      '<div class="lg-menu-shadow" aria-hidden="true"></div>' +
      '<div class="lg-menu-glass lg lg-r" aria-hidden="true"></div>' +
      '<button type="button" class="lg-btn lg-menu-toggle" id="lgMenuToggle" aria-expanded="false" aria-controls="lgMenuItems" ' +
      'title="Ещё" aria-label="Ещё: настройки и совместный доступ">' + I('more') + '<span class="lg-dot"></span></button>' +
      '<div class="lg-menu-items lg-mag" id="lgMenuItems"></div>';
    document.body.appendChild(wrap);
    var toggle = wrap.querySelector('.lg-menu-toggle');
    var list = wrap.querySelector('.lg-menu-items');
    var glass = wrap.querySelector('.lg-menu-glass');
    var dot = wrap.querySelector('.lg-dot');
    var items = [];
    if (window.MathhGlass) window.MathhGlass.refract(glass);

    // размер стекла считаем по факту, а не формулой: кнопка совместного
    // доступа может появиться позже, а в «максимуме» кнопки под курсором
    // растут — и стекло должно расти вместе с ними
    function measure() {
      var open = wrap.classList.contains('is-open');
      var h = open ? list.offsetTop + list.offsetHeight : toggle.offsetHeight + 8;
      var w = open ? wrap.offsetWidth : toggle.offsetWidth + 8;
      wrap.style.setProperty('--lg-h', h + 'px');
      wrap.style.setProperty('--lg-w', w + 'px');
    }
    var springT = 0;
    function setOpen(open) {
      // длинная пружина — только на открытие и закрытие (см. .lg-spring в css)
      wrap.classList.add('lg-spring');
      clearTimeout(springT);
      springT = setTimeout(function () { wrap.classList.remove('lg-spring'); }, 700);
      wrap.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      measure();
    }
    if (window.ResizeObserver) new ResizeObserver(measure).observe(list);
    toggle.addEventListener('click', function () { setOpen(!wrap.classList.contains('is-open')); });
    // клик мимо меню закрывает его; панель совместного доступа считается
    // частью меню — иначе меню схлопывалось бы при каждом нажатии в ней
    document.addEventListener('click', function (e) {
      if (!wrap.classList.contains('is-open')) return;
      var path = e.composedPath ? e.composedPath() : [];
      if (path.indexOf(wrap) >= 0) return;
      var pop = document.querySelector('.ts-share-pop');
      if (pop && path.indexOf(pop) >= 0) return;
      setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && wrap.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });

    function place(btn, opts) {
      var row = document.createElement('div');
      row.className = 'lg-item';
      row.style.setProperty('--i', items.length);
      var lab = document.createElement('span');
      lab.className = 'lg-label lg';
      lab.textContent = opts.label || btn.getAttribute('aria-label') || btn.title || '';
      row.appendChild(lab);
      row.appendChild(btn);
      // подпись уже есть — системная всплывающая подсказка от title
      // дублировала бы её с задержкой
      if (btn.title) { btn.setAttribute('data-title', btn.title); btn.removeAttribute('title'); }
      if (opts.before && opts.before.parentNode === list) list.insertBefore(row, opts.before);
      else list.appendChild(row);
      btn.addEventListener('click', function () { if (!opts.keepOpen) setOpen(false); });
      var api = {
        el: btn, row: row,
        setLabel: function (t) { lab.textContent = t; },
        setIcon: function (n) {
          var old = btn.querySelector('svg.mi');
          var fresh = window.MathhIcons.el(n);
          if (old) old.replaceWith(fresh); else btn.insertBefore(fresh, btn.firstChild);
        },
        setActive: function (on) { btn.classList.toggle('is-on', !!on); }
      };
      items.push(api);
      Array.prototype.forEach.call(list.children, function (r, i) { r.style.setProperty('--i', i); });
      measure();
      return api;
    }

    function add(o) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'lg-btn';
      if (o.id) b.id = o.id;
      b.setAttribute('aria-label', o.label || '');
      b.innerHTML = I(o.icon);
      if (o.onClick) b.addEventListener('click', o.onClick);
      return place(b, o);
    }
    function adopt(el, o) {
      o = o || {};
      // кнопка жила в углу экрана со своим position:fixed — снимаем её
      // собственный класс-раскладку, оставляем id и обработчики
      if (o.dropClass) el.classList.remove(o.dropClass);
      el.classList.add('lg-btn');
      return place(el, o);
    }

    // совместный доступ: кнопку создаёт session-share.js, и не сразу —
    // поэтому ждём её появления и следим за её состоянием
    function adoptShare(o) {
      o = o || {};
      var done = false;
      function grab() {
        var b = document.querySelector('.ts-share-btn');
        if (!b || done) return !!b;
        done = true;
        var api = adopt(b, { label: 'Совместный доступ', keepOpen: true, before: o.before });
        var old = b.querySelector('svg:not(.mi)');
        if (old) old.replaceWith(window.MathhIcons.el('share'));
        var pop = document.querySelector('.ts-share-pop');
        var mirror = function () {
          dot.className = 'lg-dot' +
            (b.classList.contains('ts-offline') ? ' is-warn' :
             b.classList.contains('ts-teacher-silent') ? ' is-bad' :
             b.classList.contains('ts-has-peers') ? ' is-ok' : '');
          wrap.classList.toggle('has-pop', !!(pop && pop.classList.contains('open')));
        };
        new MutationObserver(mirror).observe(b, { attributes: true, attributeFilter: ['class'] });
        if (pop) new MutationObserver(mirror).observe(pop, { attributes: true, attributeFilter: ['class'] });
        mirror();
        if (o.onAdopt) o.onAdopt(api);
        return true;
      }
      if (grab()) return;
      var mo = new MutationObserver(function () { if (grab()) mo.disconnect(); });
      mo.observe(document.body, { childList: true });
    }

    window.addEventListener('resize', measure);
    measure();
    inst = { el: wrap, add: add, adopt: adopt, adoptShare: adoptShare, open: function () { setOpen(true); }, close: function () { setOpen(false); }, measure: measure };
    return inst;
  }

  window.MathhMenu = { mount: mount };
})();
