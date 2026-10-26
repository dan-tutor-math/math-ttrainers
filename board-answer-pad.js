/* ═══════════════════════════════════════════════════════════════════════
   board-answer-pad.js — клавиатура ответа у живых заданий на доске
   (промпт №108).

   Зачем: у ОГЭ №20 и ЕГЭ ответы вида 4 − √7 и −1/6 (и через «;» — корни),
   а поле на доске — обычный <input inputmode="decimal">. С ним:
     — на iPhone и iPad цифровая клавиатура без «−», «;», «/» и «√» —
       отрицательный корень набрать было НЕЧЕМ;
     — с настоящей клавиатуры «√» не набрать вовсе (разбор понимает
       «sqrt»/«корень», но ученик об этом не знает).
   Поэтому к полю ответа цепляется своя панель:
     — на сенсорном экране — полная клавиатура вместо системной
       (inputmode="none", иначе системная вылезала поверх и закрывала
       пол-доски); кнопкой ⌨ можно вернуть системную — выбор запоминается;
     — с мышью — узкая полоска только того, чего нет на клавиатуре
       (√ ± / ; ( ) ), цифры набирают руками; «123» раскрывает цифры
       для тех, у кого мышь без клавиатуры (интерактивная доска).
   Панель одна на страницу и висит в body с position:fixed: слой заданий
   (#bdTaskLayer) обрезает всё, что выходит за задание, и не ловит мышь.
   Ввод — через Keypad-подобные insert/erase с событием input: по нему
   boards-core.js пишет черновик и шлёт поле собеседнику, как при наборе.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  if (window.BoardAnswerPad) return;

  const LS_SYS = 'bdPadSysKbd';    // '1' — на сенсорном экране системная клавиатура
  const LS_FULL = 'bdPadFull';     // '1' — с мышью показывать и цифры
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  // «сенсорный» — по основному указателю: у ноутбука с тачскрином основной
  // всё равно мышь, и прятать ему системную клавиатуру незачем. iPad с
  // карандашом — coarse
  const coarse = () => { try { return matchMedia('(pointer: coarse)').matches; } catch (e) { return false; } };

  const CSS = `
    #bdAnsPad{position:fixed;z-index:400;display:none;box-sizing:border-box;padding:8px;border-radius:16px;
      background:var(--glass-strong,rgba(255,255,255,.96));border:1px solid var(--glass-border,rgba(0,0,0,.08));
      box-shadow:0 10px 32px rgba(0,0,0,.18);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);
      font-family:var(--font-ui,system-ui);user-select:none;-webkit-user-select:none;touch-action:manipulation;}
    #bdAnsPad.open{display:block;}
    #bdAnsPad .bap-grid{display:grid;gap:6px;}
    #bdAnsPad.full .bap-grid{grid-template-columns:repeat(5,52px);}
    #bdAnsPad.slim .bap-grid{grid-template-columns:repeat(8,40px);}
    #bdAnsPad button{height:44px;border:none;border-radius:10px;padding:0;margin:0;cursor:pointer;
      background:var(--hover-1,rgba(0,0,0,.05));color:var(--ink,#1d1d1f);font:inherit;font-size:19px;}
    #bdAnsPad.slim button{height:36px;font-size:17px;}
    #bdAnsPad button:active{background:var(--hover-2,rgba(0,0,0,.12));}
    #bdAnsPad button.sp{color:#2e7de0;font-weight:600;}
    /* класс НЕ «mi»: в liquid-glass.css «.mi» — общий класс значков (width:1em),
       и кнопка «−» сжималась до узкой полоски вместо своей ячейки сетки */
    #bdAnsPad button.neg{color:var(--teacher,#ff3b30);font-weight:700;}
    #bdAnsPad button.set{font-family:"STIX Two Math","Cambria Math","Latin Modern Math","Times New Roman",serif;
      font-weight:400;font-size:25px;}
    #bdAnsPad button.aux{font-size:14px;color:var(--muted-6,#86868b);}
    #bdAnsPad button.go{background:#2e7de0;color:#fff;font-size:16px;font-weight:600;}
    @media (max-width:420px){#bdAnsPad.full .bap-grid{grid-template-columns:repeat(5,minmax(44px,1fr));}}
  `;

  // Раскладка: слева — привычный цифровой блок (как в keypad.js тренажёров),
  // справа — то, ради чего панель: √, /, ±, ;, скобки. «+» нужен для 4 + √7,
  // «±» — потому что так пишут в тетради (4 ± √7), и разбор его понимает.
  // Ряд ∞ +∞ −∞ ∪ ∩ — для ответов к неравенствам: (−∞; 3) ∪ (5; +∞).
  // «−∞» вставляет дефис, как и кнопка «−»: так его читают все разборы ответа
  const FULL = [
    ['7'], ['8'], ['9'], ['√', 'sp'], ['back', 'aux', '⌫'],
    ['4'], ['5'], ['6'], ['/', 'sp'], ['±', 'sp'],
    ['1'], ['2'], ['3'], ['+', 'sp'], [';', 'sp'],
    ['-', 'neg', '−'], ['0'], [','], ['(', 'sp'], [')', 'sp'],
    ['∞', 'sp'], ['+∞', 'sp'], ['-∞', 'sp', '−∞'], ['∪', 'sp set'], ['∩', 'sp set'],
    ['kbd', 'aux', '⌨'], ['check', 'go', 'Проверить', 3], ['close', 'aux', '✕']
  ];
  const SLIM = [
    ['√', 'sp'], ['±', 'sp'], ['/', 'sp'], [';', 'sp'], ['(', 'sp'], [')', 'sp'],
    ['digits', 'aux', '123'], ['close', 'aux', '✕'],
    ['∞', 'sp'], ['+∞', 'sp'], ['-∞', 'sp', '−∞'], ['∪', 'sp set'], ['∩', 'sp set']
  ];

  let pad = null, grid = null, target = null, opts = null, raf = 0, lastPos = '';

  function ensure() {
    if (pad) return pad;
    const st = document.createElement('style');
    st.id = 'bdAnsPadStyle';
    st.textContent = CSS;
    document.head.appendChild(st);
    pad = document.createElement('div');
    pad.id = 'bdAnsPad';
    pad.setAttribute('role', 'group');
    pad.setAttribute('aria-label', 'Клавиатура ответа');
    grid = document.createElement('div');
    grid.className = 'bap-grid';
    pad.appendChild(grid);
    // фокус должен остаться в поле: курсор нужен, чтобы вставлять в его
    // место, а потеря фокуса закрыла бы панель. pointerdown не должен и
    // начинать жест доски под панелью
    const keep = e => { e.preventDefault(); e.stopPropagation(); };
    pad.addEventListener('pointerdown', keep);
    pad.addEventListener('mousedown', keep);
    pad.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
    pad.addEventListener('wheel', e => e.stopPropagation(), { passive: true });
    pad.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b) press(b.dataset.k);
    });
    document.body.appendChild(pad);
    return pad;
  }

  function layout() {
    const full = coarse() ? lsGet(LS_SYS) !== '1' : lsGet(LS_FULL) === '1';
    pad.classList.toggle('full', full);
    pad.classList.toggle('slim', !full);
    const keys = full ? FULL.slice() : SLIM.slice();
    // с мышью в полной раскладке ⌨ не нужен — вместо него «свернуть»
    if (full && !coarse()) keys[keys.length - 3] = ['digits', 'aux', '⌄'];
    const sig = keys.map(k => k[0]).join('|');
    if (grid.dataset.sig === sig) return;
    grid.dataset.sig = sig;
    grid.innerHTML = '';
    keys.forEach(([k, cls, label, span]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.k = k;
      if (cls) b.className = cls;
      b.textContent = label || k;
      if (span) b.style.gridColumn = 'span ' + span;
      if (k === 'kbd') b.title = 'Системная клавиатура';
      if (k === 'back') b.title = 'Стереть';
      if (k === 'digits') b.title = full ? 'Спрятать цифры' : 'Показать цифры';
      grid.appendChild(b);
    });
  }

  /* ── ввод в место курсора, как с настоящей клавиатуры ── */
  function caret(inp) {
    let a = null, b = null;
    try { a = inp.selectionStart; b = inp.selectionEnd; } catch (e) {}
    if (a == null) a = inp.value.length;
    if (b == null) b = a;
    return [a, b];
  }
  function put(inp, text, at) {
    try { inp.focus({ preventScroll: true }); } catch (e) { inp.focus(); }
    try { inp.setSelectionRange(at, at); } catch (e) {}
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function insert(inp, text) {
    const [a, b] = caret(inp);
    const v = inp.value || '';
    inp.value = v.slice(0, a) + text + v.slice(b);
    put(inp, text, a + text.length);
  }
  function erase(inp) {
    const [a, b] = caret(inp);
    const v = inp.value || '';
    if (a !== b) { inp.value = v.slice(0, a) + v.slice(b); put(inp, '', a); return; }
    if (a === 0) return;
    inp.value = v.slice(0, a - 1) + v.slice(a);
    put(inp, '', a - 1);
  }

  function press(k) {
    const inp = target;
    if (!inp) return;
    if (k === 'close') { hide(); return; }
    if (k === 'digits') { lsSet(LS_FULL, lsGet(LS_FULL) === '1' ? '0' : '1'); layout(); place(true); return; }
    if (k === 'kbd') {
      // системную показывает только новый фокус с другим inputmode
      lsSet(LS_SYS, '1');
      inp.inputMode = 'text';
      layout();
      inp.blur();
      setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (e) { inp.focus(); } }, 30);
      return;
    }
    if (inp.readOnly || inp.disabled) return;
    if (k === 'check') { if (opts && opts.onCheck) opts.onCheck(); return; }
    if (k === 'back') { erase(inp); return; }
    // «; » с пробелом — так читается и совпадает с записью в разборе
    insert(inp, k === ';' ? '; ' : k);
  }

  /* ── место на экране: под полем, а если не влезает — над ним ── */
  function place(force) {
    if (!target || !pad.classList.contains('open')) return;
    const r = target.getBoundingClientRect();
    const vv = window.visualViewport;
    const vh = vv ? vv.height + vv.offsetTop : window.innerHeight;
    const vw = vv ? vv.width + vv.offsetLeft : window.innerWidth;
    // поле ушло с экрана (доску сдвинули) — панель прячем, но не закрываем
    // доска прячет (visibility) задание с фокусом, ушедшее из кадра
    const off = r.width === 0 || getComputedStyle(target).visibility === 'hidden' || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw;
    pad.style.visibility = off ? 'hidden' : '';
    if (off) return;
    const pw = pad.offsetWidth, ph = pad.offsetHeight, gap = 8;
    let top = r.bottom + gap;
    if (top + ph > vh - 6 && r.top - gap - ph >= 6) top = r.top - gap - ph;
    top = Math.max(6, Math.min(top, vh - ph - 6));
    let left = r.left + r.width / 2 - pw / 2;
    left = Math.max(6, Math.min(left, vw - pw - 6));
    const pos = Math.round(left) + ',' + Math.round(top);
    if (!force && pos === lastPos) return;
    lastPos = pos;
    pad.style.left = Math.round(left) + 'px';
    pad.style.top = Math.round(top) + 'px';
  }
  // Камера доски двигается жестами и колесом, а событий «поле сдвинулось»
  // нет — сверяем место каждый кадр, пока панель открыта (одно чтение
  // getBoundingClientRect, перерисовки панели только при сдвиге)
  function loop() {
    raf = 0;
    if (!target || !pad.classList.contains('open')) return;
    if (!target.isConnected || target.readOnly || target.disabled) { hide(); return; }
    place(false);
    raf = requestAnimationFrame(loop);
  }

  function show(inp, o) {
    ensure();
    target = inp; opts = o || {};
    layout();
    pad.classList.add('open');
    lastPos = '';
    place(true);
    if (!raf) raf = requestAnimationFrame(loop);
  }
  function hide() {
    if (pad) pad.classList.remove('open');
    target = null; opts = null;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  // inp — поле ответа живого задания; o.onCheck — «Проверить» этого задания
  function attach(inp, o) {
    if (!inp || inp.dataset.bap) return;
    inp.dataset.bap = '1';
    // inputmode ставим заранее, до первого фокуса: поменять его в focus
    // поздно — iOS уже решил, какую клавиатуру поднимать
    if (coarse() && lsGet(LS_SYS) !== '1') inp.inputMode = 'none';
    else if (coarse()) inp.inputMode = 'text';
    inp.addEventListener('focus', () => {
      if (inp.readOnly || inp.disabled) return;
      show(inp, o);
    });
    // поле может остаться в фокусе после закрытия панели (✕, верный ответ,
    // потом ↺) — тогда focus не придёт, открываем по нажатию в поле
    inp.addEventListener('click', () => {
      if (document.activeElement === inp && target !== inp && !inp.readOnly && !inp.disabled) show(inp, o);
    });
    inp.addEventListener('blur', () => {
      // ⌨ на миг снимает фокус, чтобы поднять системную, — не закрываемся
      setTimeout(() => { if (target === inp && document.activeElement !== inp) hide(); }, 120);
    });
  }

  window.BoardAnswerPad = { attach, hide, isOpen: () => !!(pad && pad.classList.contains('open')) };
})();
