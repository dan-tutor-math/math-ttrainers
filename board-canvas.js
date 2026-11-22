/* board-canvas.js — цвет холста доски (листа, на котором пишут).

   Зачем. Раньше лист брал цвет из темы: в тёмной теме — тёмная бумага в
   тоне предмета. Даниилу (22.11) холст чаще нужен определённого цвета:
   белый, чёрный, иногда другой, и независимо от темы и цвета предмета.
   Решение: по умолчанию холст белый везде; на доске своя кнопка выбора
   цвета; выбор — для этой доски (поле доски canvasColor, как gridColor)
   или для всех досок (на этом устройстве, localStorage). При первой смене
   темы на доске — короткая подсказка, что холст можно перекрасить.

   Перо по умолчанию (--pencil) и клетка зависят от холста, а не от темы:
   иначе в тёмной теме на белом холсте перо было бы белым.

   Презентации не трогаем: у слайдов своя подложка (deck-core.js).

   API для boards-core.js: BoardCanvas.paper() / grid() / ink() — цвет или
   null («как тема»); key() — для ключа кеша отрисовки. */
(function () {
  'use strict';
  if (window.BoardCanvas) return;

  var GLOBAL_KEY = 'boards:canvas';       // выбор «для всех досок»
  var HINT_KEY = 'boards:canvasHintShown'; // подсказка показана

  // ink — перо по умолчанию; grid — клетка, когда своего цвета клетки нет
  var PRESETS = [
    { id: 'white',  title: 'Белый',         paper: '#FFFFFF', grid: '#DCE4F0', ink: '#1D1D1F' },
    { id: 'cream',  title: 'Тёплый белый',  paper: '#FDFCF7', grid: '#E3E1D6', ink: '#1D1D1F' },
    { id: 'gray',   title: 'Светло-серый',  paper: '#EEF0F3', grid: '#D5D9E0', ink: '#1D1D1F' },
    { id: 'chalk',  title: 'Меловая доска', paper: '#1F3B30', grid: '#2E5244', ink: '#F2F3F5' },
    { id: 'graphite', title: 'Графит',      paper: '#2A2D34', grid: '#3A3E47', ink: '#F2F3F5' },
    { id: 'black',  title: 'Чёрный',        paper: '#0E0F12', grid: '#262930', ink: '#F2F3F5' },
    // «как тема»: светлая — светлая бумага, тёмная — тёмная в тоне предмета
    { id: 'theme',  title: 'Как тема',      paper: null, grid: null, ink: null }
  ];
  var DEFAULT = 'white';

  function byId(id) { for (var i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === id) return PRESETS[i]; return null; }
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function board() { try { return typeof B !== 'undefined' ? B : null; } catch (e) { return null; } }
  function isDeck(b) { return !!(b && b.kind === 'deck'); }

  function globalChoice() { var v = ls(GLOBAL_KEY); return byId(v) ? v : null; }
  function boardChoice() { var b = board(); return b && byId(b.canvasColor) ? b.canvasColor : null; }
  function currentId() { return boardChoice() || globalChoice() || DEFAULT; }
  function current() {
    var b = board();
    if (!b || isDeck(b)) return null;
    var p = byId(currentId());
    return p && p.paper ? p : null;
  }

  var api = {
    presets: PRESETS,
    paper: function () { var p = current(); return p ? p.paper : null; },
    grid: function () { var p = current(); return p ? p.grid : null; },
    ink: function () { var p = current(); return p ? p.ink : null; },
    key: function () { var b = board(); return isDeck(b) ? '' : currentId(); },
    currentId: currentId,
    // scope: 'board' — только эта доска; 'all' — все доски (эта тоже
    // переходит на общий выбор: свой цвет у неё снимается)
    set: function (id, scope) {
      if (!byId(id)) return;
      var b = board();
      if (scope === 'all') {
        lsSet(GLOBAL_KEY, id);
        if (b && b.canvasColor) { delete b.canvasColor; save(); }
      } else if (b) {
        b.canvasColor = id; save();
      }
      redraw(); paintPop();
    }
  };
  api.markRoot = function () { markRoot(); };
  window.BoardCanvas = api;

  function save() { try { if (typeof saveDB === 'function') saveDB(); } catch (e) {} }
  function redraw() {
    try { if (typeof boardCacheReset === 'function') boardCacheReset('холст'); } catch (e) {}
    try { if (typeof scheduleRedraw === 'function') scheduleRedraw(); } catch (e) {}
  }

  /* ── кнопка и окошко ── */
  var css =
    '#bdCanvasBtn .cv-ico{width:18px;height:18px;border-radius:5px;border:1.5px solid currentColor;overflow:hidden;display:block;position:relative}' +
    '#bdCanvasBtn .cv-ico i{position:absolute;inset:0;background:var(--cv-cur,#fff)}' +
    '#bdCanvasPop{position:fixed;z-index:400;min-width:260px;padding:14px;border-radius:18px;background:var(--glass-strong);' +
      'backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);border:1px solid var(--glass-border);' +
      'box-shadow:var(--shadow);color:var(--pencil);font-family:var(--font-ui);font-size:13px}' +
    '#bdCanvasPop[hidden]{display:none}' +
    '#bdCanvasPop h4{margin:0 0 10px;font-size:13px;font-weight:700}' +
    '#bdCanvasPop .cv-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}' +
    '#bdCanvasPop .cv-sw{display:flex;flex-direction:column;align-items:center;gap:5px;padding:6px 2px;border:none;border-radius:12px;background:none;color:var(--muted-2);font:inherit;font-size:11px;cursor:pointer;line-height:1.15;text-align:center}' +
    '#bdCanvasPop .cv-sw:hover{background:var(--hover-1)}' +
    '#bdCanvasPop .cv-sw b{display:block;width:34px;height:24px;border-radius:7px;box-shadow:inset 0 0 0 1px rgba(127,127,127,.35)}' +
    '#bdCanvasPop .cv-sw.on{color:var(--pencil);font-weight:600}' +
    '#bdCanvasPop .cv-sw.on b{box-shadow:0 0 0 2px var(--ink)}' +
    '#bdCanvasPop .cv-scope{display:flex;gap:4px;padding:3px;border-radius:12px;background:var(--hover-1)}' +
    '#bdCanvasPop .cv-scope button{flex:1;border:none;border-radius:9px;padding:7px 8px;background:none;color:var(--muted-2);font:inherit;font-weight:600;cursor:pointer}' +
    '#bdCanvasPop .cv-scope button.on{background:var(--ink);color:#fff}' +
    '#bdCanvasPop .cv-note{margin-top:8px;color:var(--muted-1);font-size:11.5px}' +
    '#bdCanvasHint{position:fixed;z-index:401;max-width:280px;padding:10px 12px;border-radius:14px;background:var(--glass-strong);' +
      'backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--glass-border);box-shadow:var(--shadow);' +
      'color:var(--pencil);font:500 13px/1.35 var(--font-ui);display:flex;gap:10px;align-items:center;' +
      'opacity:0;transform:translateY(-4px);transition:opacity .25s,transform .25s;pointer-events:none}' +
    '#bdCanvasHint.show{opacity:1;transform:none;pointer-events:auto}' +
    '#bdCanvasHint button{border:none;border-radius:9px;padding:6px 10px;background:var(--ink);color:#fff;font:inherit;font-weight:600;cursor:pointer;white-space:nowrap}' +
    '@media (prefers-reduced-motion:reduce){#bdCanvasHint{transition:none}}' +
    /* тёмная тема на светлом холсте: полупрозрачное тёмное стекло панелей
       поверх белого становилось серо-сиреневым — делаем его плотным, в тон
       тёмного фона (и предмета: --bg уже окрашен subject-palette.js) */
    ':root[data-theme="dark"][data-canvas="light"]{--glass:color-mix(in srgb,var(--bg),#fff 9%);' +
      '--glass-strong:color-mix(in srgb,var(--bg),#fff 12%);--card:color-mix(in srgb,var(--bg),#fff 12%)}' +
    // и наоборот: светлая тема на тёмном холсте (чёрный, меловой, графит)
    ':root:not([data-theme="dark"])[data-canvas="dark"]{--glass:color-mix(in srgb,var(--bg),#fff 55%);' +
      '--glass-strong:color-mix(in srgb,var(--bg),#fff 70%);--card:color-mix(in srgb,var(--bg),#fff 70%)}';

  var btn = null, pop = null, scope = 'board';

  function place(el) {
    var r = btn.getBoundingClientRect();
    el.style.top = Math.round(r.bottom + 8) + 'px';
    var left = Math.min(window.innerWidth - el.offsetWidth - 10, Math.max(10, r.left + r.width / 2 - el.offsetWidth / 2));
    el.style.left = Math.round(left) + 'px';
  }
  // светлый ли холст сейчас — для плотного стекла панелей в тёмной теме
  function lightness(hex) { var n = parseInt(hex.slice(1), 16); return ((n >> 16 & 255) * .299 + (n >> 8 & 255) * .587 + (n & 255) * .114) / 255; }
  function markRoot() {
    var p = null;
    try { p = (typeof boardActive !== 'undefined' && boardActive) ? api.paper() : null; } catch (e) {}
    var v = p ? (lightness(p) > .6 ? 'light' : 'dark') : '';
    var root = document.documentElement;
    if (v) { if (root.getAttribute('data-canvas') !== v) root.setAttribute('data-canvas', v); }
    else if (root.hasAttribute('data-canvas')) root.removeAttribute('data-canvas');
  }
  function paintBtn() {
    markRoot();
    if (!btn) return;
    var p = byId(currentId());
    var c = p && p.paper ? p.paper : 'linear-gradient(135deg,#fff 50%,#1d1d1f 50%)';
    btn.style.setProperty('--cv-cur', c);
  }
  function paintPop() {
    paintBtn();
    if (!pop) return;
    var cur = scope === 'all' ? (globalChoice() || DEFAULT) : currentId();
    pop.querySelectorAll('.cv-sw').forEach(function (b) {
      var on = b.dataset.id === cur;
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
    });
    pop.querySelectorAll('.cv-scope button').forEach(function (b) {
      var on = b.dataset.scope === scope;
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
    });
    var note = pop.querySelector('.cv-note');
    note.textContent = scope === 'all'
      ? 'Цвет для всех досок на этом устройстве. Досок со своим цветом это не меняет.'
      : (boardChoice() ? 'У этой доски свой цвет холста.' : 'Сейчас у доски общий цвет — выбор задаст ей свой.');
  }
  function build() {
    if (pop) return;
    pop = document.createElement('div');
    pop.id = 'bdCanvasPop'; pop.hidden = true;
    pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Цвет холста');
    pop.innerHTML = '<h4>Цвет холста</h4><div class="cv-grid">' + PRESETS.map(function (p) {
      var sw = p.paper ? p.paper : 'linear-gradient(135deg,#FDFCF7 50%,#1E2540 50%)';
      return '<button type="button" class="cv-sw" data-id="' + p.id + '"><b style="background:' + sw + '"></b>' + p.title + '</button>';
    }).join('') + '</div>' +
      '<div class="cv-scope" role="group" aria-label="Для каких досок">' +
      '<button type="button" data-scope="board">Эта доска</button><button type="button" data-scope="all">Все доски</button></div>' +
      '<div class="cv-note"></div>';
    document.body.appendChild(pop);
    pop.addEventListener('click', function (e) {
      e.stopPropagation();
      var s = e.target.closest('.cv-scope button');
      if (s) { scope = s.dataset.scope; paintPop(); return; }
      var sw = e.target.closest('.cv-sw');
      if (sw) api.set(sw.dataset.id, scope);
    });
  }
  function open() {
    build(); hideHint();
    scope = boardChoice() ? 'board' : 'all';
    pop.hidden = false; place(pop); paintPop();
    btn.setAttribute('aria-expanded', 'true');
  }
  function close() { if (pop && !pop.hidden) { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); } }

  /* ── подсказка при первой смене темы ── */
  var hint = null, hintT = 0;
  function hideHint() { if (hint) { hint.classList.remove('show'); clearTimeout(hintT); } }
  function showHint() {
    if (ls(HINT_KEY) || !btn || btn.offsetParent === null) return;
    var b = board();
    if (!b || isDeck(b)) return;
    lsSet(HINT_KEY, '1');
    if (!hint) {
      hint = document.createElement('div');
      hint.id = 'bdCanvasHint'; hint.setAttribute('role', 'status');
      hint.innerHTML = '<span>Холст остался прежним. Цвет холста можно поменять здесь.</span><button type="button">Выбрать</button>';
      hint.querySelector('button').addEventListener('click', function (e) { e.stopPropagation(); hideHint(); open(); });
      document.body.appendChild(hint);
    }
    place(hint);
    requestAnimationFrame(function () { hint.classList.add('show'); });
    clearTimeout(hintT);
    hintT = setTimeout(hideHint, 7000);
  }

  function mount() {
    var gear = document.getElementById('bdGear');
    if (!gear || document.getElementById('bdCanvasBtn')) return;
    var st = document.createElement('style'); st.id = 'board-canvas-css'; st.textContent = css;
    document.head.appendChild(st);
    btn = document.createElement('button');
    btn.className = 'bd-gear'; btn.id = 'bdCanvasBtn'; btn.type = 'button';
    btn.title = 'Цвет холста'; btn.setAttribute('aria-label', 'Цвет холста');
    btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span class="cv-ico" aria-hidden="true"><i></i></span>';
    gear.parentNode.insertBefore(btn, gear);
    btn.addEventListener('click', function (e) { e.stopPropagation(); if (pop && !pop.hidden) close(); else open(); });
    document.addEventListener('click', function (e) { if (pop && !pop.hidden && !pop.contains(e.target)) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); hideHint(); } });
    window.addEventListener('resize', function () { if (pop && !pop.hidden) place(pop); });
    // смена темы: холст сам не меняется — один раз подсказываем, где его менять
    var theme = document.documentElement.getAttribute('data-theme');
    new MutationObserver(function () {
      var t = document.documentElement.getAttribute('data-theme');
      if (t === theme) return;
      theme = t; paintBtn();
      if (api.ink() !== null) showHint();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    // выбор «для всех» в другой вкладке
    window.addEventListener('storage', function (e) { if (e.key === GLOBAL_KEY) { redraw(); paintPop(); } });
    paintBtn();
    // доска открывается и меняется без перезагрузки — значок и плотность
    // панелей по текущей доске; проверка дешёвая (атрибут и localStorage)
    setInterval(paintBtn, 400);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
