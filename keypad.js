/* ═══════════════════════════════════════════════════════════════════════
   Промпт №14 (новый список): одна экранная клавиатура на все тренажёры.

   До этой правки у каждой страницы была своя раскладка, собранная в разное
   время: где-то без запятой, где-то без минуса, где-то «⌫» стоял крошечной
   клавишей в углу цифр, а в ОГЭ №9 кнопки движков вообще ни к чему не были
   привязаны (селектор искал #keypadButtons, а у движков id с префиксом).
   Теперь раскладка одна — та, что была лучшей (ОГЭ №8, ЕГЭ):

     7 8 9
     4 5 6
     1 2 3
     , 0 −
     [свои клавиши тренажёра: x, /, ; …]
     ⌫ Стереть        — отдельной широкой кнопкой, чтобы не путать с цифрами
     Ввод ↵

   Сама плавающая панель (✋, ✕, ⌨, перетаскивание) остаётся на страницах:
   её место и видимость у каждого тренажёра свои. Модуль даёт только то,
   что должно быть одинаковым везде:
     Keypad.keys(extras, opts)  — разметка кнопок
     Keypad.bind(box, press)    — повесить нажатия
     Keypad.insert(inp, text) / Keypad.erase(inp) — ввод как с настоящей
       клавиатуры: в место курсора, с учётом maxlength и с событием input
       (по нему поле уходит собеседнику в совместной сессии)
     Keypad.qaTarget(own) / Keypad.hasQa() / Keypad.press(inp, ch) /
       Keypad.watch(sync) — поле «ответ сразу» (quick-answer.js): раньше
       клавиатура появлялась только на шагах решения, а над шагами стоит
       поле ответа, и в него с телефона было нечем писать.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  if (window.Keypad) return;

  // !important — потому что в ОГЭ №9 стили клавиатуры движков записаны через
  // #linEngineArea/#quadEngineArea, и у них вес id: без него широкие кнопки
  // там остались бы шириной в одну цифру
  const CSS = `
    .keypad button.kp-wide{width:auto !important;}
    .keypad button.kp-back{grid-column:span 3 !important;width:auto !important;height:36px !important;font-size:15px !important;color:var(--muted-6) !important;}
    .keypad button.kp-enter{grid-column:span 3 !important;width:auto !important;}
    .keypad button.kp-comma{font-weight:700;color:var(--ink);}
    .keypad button.kp-minus{color:var(--teacher);font-weight:700;}
    .keypad button.kp-extra{font-size:16px;}
    .keypad button.kp-x{color:var(--moved);font-weight:700;font-style:italic;font-size:18px;}
  `;
  function ensureCss() {
    if (document.getElementById('kpStdStyle')) return;
    const st = document.createElement('style');
    st.id = 'kpStdStyle';
    st.textContent = CSS;
    // в конец head — позже стилей страницы, при равном весе побеждает это
    (document.head || document.documentElement).appendChild(st);
  }
  ensureCss();

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  function btn(key, label, cls, span) {
    const wide = span > 1 ? ' kp-wide' : '';
    const style = span > 1 ? ' style="grid-column:span ' + span + '"' : '';
    return '<button type="button" class="' + (cls || '') + wide + '" data-key="' + esc(key) + '"' + style + '>' + label + '</button>';
  }

  // extras — свои клавиши тренажёра: строка ('x') или { k, label, cls }.
  // Последняя растягивается до конца ряда, чтобы ряд не висел обрубком.
  // opts.minusKey — что вставляет «−»: обычно дефис (его понимают все
  // разборы ответа), логарифмы и тригонометрия исторически вставляют «−».
  function keys(extras, opts) {
    opts = opts || {};
    const minusKey = opts.minusKey || '-';
    let html = ['7', '8', '9', '4', '5', '6', '1', '2', '3'].map(d => btn(d, d)).join('');
    html += btn(',', ',', 'kp-comma') + btn('0', '0') + btn(minusKey, '−', 'kp-minus');
    const ex = (extras || []).map(e => (typeof e === 'string' ? { k: e, label: e } : e));
    let col = 0;
    ex.forEach((e, i) => {
      let span = 1;
      if (i === ex.length - 1) span = 3 - col;
      html += btn(e.k, e.label || e.k, 'kp-extra ' + (e.cls || ''), span);
      col = (col + span) % 3;
    });
    html += btn('back', '⌫ Стереть', 'kp-back') + btn('enter', 'Ввод ↵', 'kp-enter');
    return html;
  }

  function bind(box, press) {
    if (!box) return;
    box.querySelectorAll('button').forEach(b => {
      // фокус остаётся в поле: иначе на телефоне каждая клавиша сначала
      // снимала курсор, а он нужен, чтобы вставлять в его место
      b.addEventListener('mousedown', e => e.preventDefault());
      b.onclick = () => press(b.dataset.key);
    });
  }

  // поле на экране и в него можно писать
  function live(inp) {
    return !!(inp && inp.isConnected && !inp.disabled && !inp.readOnly && inp.getClientRects().length > 0);
  }

  function caret(inp) {
    let pos = null, end = null;
    try { pos = inp.selectionStart; end = inp.selectionEnd; } catch (e) {}
    if (pos == null) pos = inp.value.length;
    if (end == null) end = pos;
    return [pos, end];
  }
  function fire(inp) { inp.dispatchEvent(new Event('input', { bubbles: true })); }
  function focusKeep(inp, at) {
    try { inp.focus({ preventScroll: true }); } catch (e) { inp.focus(); }
    try { inp.setSelectionRange(at, at); } catch (e) {}
  }

  function insert(inp, text) {
    if (!inp) return;
    const [pos, end] = caret(inp);
    const v = inp.value || '';
    const next = v.slice(0, pos) + text + v.slice(end);
    // maxlength браузер проверяет только при наборе руками — тут сами
    if (inp.maxLength > 0 && next.length > inp.maxLength) { focusKeep(inp, pos); return; }
    inp.value = next;
    focusKeep(inp, pos + text.length);
    fire(inp);
  }
  function erase(inp) {
    if (!inp) return;
    const [pos, end] = caret(inp);
    const from = pos === end ? Math.max(0, pos - 1) : pos;
    inp.value = (inp.value || '').slice(0, from) + (inp.value || '').slice(end);
    focusKeep(inp, from);
    fire(inp);
  }

  /* ── «ответ сразу» ─────────────────────────────────────────────────── */
  let lastFocused = null;
  document.addEventListener('focusin', e => {
    if (e.target && e.target.tagName === 'INPUT') lastFocused = e.target;
  }, true);

  const qaInputs = () => Array.from(document.querySelectorAll('.qa-panel .qa-input')).filter(live);
  const hasQa = () => qaInputs().length > 0;

  // куда писать, если это поле «ответ сразу», иначе null — тогда страница
  // пишет в своё поле шага. Ответ сразу — если курсор последним стоял там
  // (фокус в поле шага после этого перебил бы lastFocused) или поля шага
  // сейчас нет (до «Начать», после решения шагов)
  function qaTarget(own) {
    if (lastFocused && lastFocused.closest && lastFocused.closest('.qa-panel') && live(lastFocused)) return lastFocused;
    if (live(own)) return null;
    return qaInputs()[0] || null;
  }

  // нажатие клавиши в поле. «Ввод» — тот же Enter, что с настоящей
  // клавиатуры (им проверяет «ответ сразу»); у полей шагов «Ввод» свой,
  // страница обрабатывает его до вызова
  function press(inp, ch) {
    if (!inp) return;
    if (ch === 'enter') { inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); return; }
    if (ch === 'back') { erase(inp); return; }
    if (ch === 'none') { inp.value = ''; insert(inp, 'нет корней'); return; }
    insert(inp, ch);
  }

  // поле «ответ сразу» появляется и закрывается само (таймер quick-answer.js),
  // страница об этом не знает — переспрашиваем видимость, когда оно меняется.
  // В ОГЭ №9 движок вызывает настройку клавиатуры при каждом входе — одна
  // и та же функция не должна заводить по таймеру на каждый вход
  const watched = new Set();
  function watch(sync) {
    if (watched.has(sync)) return;
    watched.add(sync);
    let was = null;
    setInterval(() => {
      const now = hasQa();
      if (now !== was) { was = now; try { sync(); } catch (e) {} }
    }, 250);
  }

  /* ── Промпт №110: плавающая панель и поле ответа на телефоне ───────────
     Панель (#keypadFloat) у всех тренажёров одна и та же, а показывает её
     каждая страница по-своему (syncKeypadVisibility). Поэтому здесь не
     спрашиваем страницу, а следим за самой панелью:
       — пока она открыта, у полей ответа inputmode="none": иначе iPhone по
         касанию поля (и по фокусу из нажатия нашей же клавиши) открывал
         свою клавиатуру поверх нашей. Закрыли панель ✕ — возвращаем
         прежний inputmode, иначе ученику нечем было бы набирать;
       — поле ответа не остаётся под панелью и под закреплённой «+»
         (.add-rail): страница поднимается, пока задание не окажется над
         ними. Перетащенную панель (у неё есть style.top) не учитываем —
         место выбрано руками;
       — под прижатой к низу панелью запас снизу, чтобы докрутить то, что
         под ней.
     «Поле ответа» — поле внутри панели задания. Служебные поля (код
     сессии, цвет доски, «свой пример») лежат вне панелей и не трогаются.
     Поля добавленных карточек ОГЭ №8 (.added-answer-input) — тоже: туда
     наша клавиатура не пишет, их набирают системной */
  const FIELD_IN = '.panel, .qa-panel, .answer-area';
  const NOT_TEXT = ['checkbox', 'radio', 'hidden', 'range', 'color', 'file', 'button', 'submit'];
  const coarse = () => window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  function isField(el) {
    return !!(el && el.tagName === 'INPUT' && !NOT_TEXT.includes(el.type) && el.closest(FIELD_IN) &&
      !el.closest('#keypadFloat') && !el.classList.contains('added-answer-input'));
  }
  const panel = () => document.getElementById('keypadFloat');
  // Прижата ли панель к низу экрана (bottom:16px из мобильного CSS страниц).
  // По «верх ниже середины» не определить: на 320×568 панель выше половины
  // экрана, хотя стоит внизу
  const docked = k => k.bottom >= window.innerHeight - 40;
  function panelShown() {
    const kp = panel();
    return !!(kp && kp.style.display !== 'none' && getComputedStyle(kp).display !== 'none');
  }

  // прежний inputmode храним в data-kp-im ('' — атрибута не было)
  function quietField(inp) {
    if (inp.dataset.kpIm === undefined) inp.dataset.kpIm = inp.getAttribute('inputmode') || '';
    inp.setAttribute('inputmode', 'none');
  }
  function restoreField(inp) {
    if (inp.dataset.kpIm === undefined) return;
    if (inp.dataset.kpIm) inp.setAttribute('inputmode', inp.dataset.kpIm);
    else inp.removeAttribute('inputmode');
    delete inp.dataset.kpIm;
  }
  function fields() { return Array.from(document.querySelectorAll('input')).filter(isField); }

  function applyPanelState(toggled) {
    const kp = panel();
    if (!kp || !document.body) return;
    const shown = panelShown();
    if (shown) fields().forEach(quietField);
    else document.querySelectorAll('input[data-kp-im]').forEach(restoreField);
    // iOS выбирает клавиатуру в момент фокуса: поле, уже стоящее в фокусе,
    // смену inputmode не заметит, пока его не перефокусируют. Поэтому, когда
    // панель открыли или закрыли, снимаем фокус — следующее касание откроет
    // нужную клавиатуру. Только на сенсорном экране: с мышью фокус в поле
    // нужен, чтобы печатать сразу
    const a = document.activeElement;
    if (toggled && coarse() && isField(a)) a.blur();
    const atBottom = shown && docked(kp.getBoundingClientRect());
    document.body.classList.toggle('kp-open', atBottom);
    if (atBottom) document.body.style.setProperty('--kp-h', kp.offsetHeight + 'px');
  }

  // Поле, которое должно быть видно: в фокусе, а если фокуса нет — первое
  // открытое для ввода поле задания на экране
  function currentField() {
    const a = document.activeElement;
    if (isField(a) && live(a)) return a;
    return fields().find(live) || null;
  }
  const CARD = ['.added-card-question', '.answer-area', '.qa-panel', '.panel'];
  const overlapX = (a, b) => a.left < b.right && a.right > b.left;

  function keepClear() {
    const kp = panel();
    if (!kp || !panelShown() || kp.style.top) return;
    const field = currentField();
    if (!field) return;
    const k = kp.getBoundingClientRect();
    if (!docked(k)) return;   // панель не внизу — так её поставила страница
    let cardEl = null;
    for (const s of CARD) { cardEl = field.closest(s); if (cardEl) break; }
    const row = field.parentElement.getBoundingClientRect();
    const card = cardEl ? cardEl.getBoundingClientRect() : row;
    const limK = k.top - 12;
    // всё задание, если оно помещается над панелью, иначе строка с полем
    let t = card.height <= limK - 8 ? card : row;
    let lim = overlapX(t, k) ? limK : Infinity;
    const railEl = document.querySelector('.add-rail');
    const rr = railEl && railEl.getBoundingClientRect();
    // у position:fixed offsetParent всегда null — видимость по размеру
    if (rr && rr.height > 0) {
      const limR = rr.top - 12;
      for (const cand of (t === card ? [card, row] : [row])) {
        if (!overlapX(cand, rr)) continue;
        const topAfter = cand.top - Math.max(0, cand.bottom - lim);
        // и после подъёма над панелью останется целиком ниже «+» — не мешает
        if (topAfter >= rr.bottom) break;
        if (cand.height <= limR - 8) { t = cand; lim = Math.min(lim, limR); break; }
      }
    }
    if (lim === Infinity || t.bottom <= lim) return;
    let dy = t.bottom - lim;
    if (t === card && card.top - dy < 8) dy = Math.max(card.top - 8, row.bottom - lim);
    if (dy <= 0) return;
    // Сразу, без behavior:'smooth': плавную прокрутку обрывает касание, а в
    // фоновой вкладке она не идёт вовсе — поле оставалось бы под панелью
    window.scrollBy(0, dy);
  }

  // после смены задания страница ещё 280 мс плавно растит панель задания
  // (setupAutoHeightAnimation) — раньше высота не окончательная. Срок берём
  // самый поздний: страница сразу после показа панели ставит фокус в поле,
  // и короткий таймер фокуса не должен перебить ожидание роста панели
  let clearTimer = null, clearDue = 0;
  function scheduleClear(ms) {
    const due = Date.now() + (ms == null ? 350 : ms);
    if (clearTimer && clearDue >= due) return;
    clearTimeout(clearTimer);
    clearDue = due;
    clearTimer = setTimeout(() => { clearTimer = null; keepClear(); }, due - Date.now());
  }

  function setupPanelWatch() {
    const kp = panel();
    if (!kp || kp._kpWatch) return;
    kp._kpWatch = true;
    let was = panelShown();
    new MutationObserver(() => {
      const now = panelShown();
      applyPanelState(now !== was);
      if (now && !was) scheduleClear();
      was = now;
    }).observe(kp, { attributes: true, attributeFilter: ['style', 'class'] });
    applyPanelState();
    if (was) scheduleClear();

    // Новое задание при уже открытой панели её style не меняет — ловим сам
    // вызов syncKeypadVisibility (он объявлен на верхнем уровне каждой
    // страницы, значит, это свойство window, и вызовы идут через него)
    const orig = window.syncKeypadVisibility;
    if (typeof orig === 'function' && !orig._kpWrapped) {
      const wrapped = function () {
        const r = orig.apply(this, arguments);
        applyPanelState();
        if (panelShown()) scheduleClear();
        return r;
      };
      wrapped._kpWrapped = true;
      window.syncKeypadVisibility = wrapped;
    }
  }

  // поле появилось позже (вопрос ЕГЭ, «ответ сразу») — inputmode ставим до
  // фокуса: iOS решает, какую клавиатуру открыть, в момент фокуса, а
  // касание приходит раньше
  ['touchstart', 'pointerdown'].forEach(type => document.addEventListener(type, e => {
    const t = e.target;
    if (isField(t) && panelShown()) quietField(t);
  }, { capture: true, passive: true }));
  document.addEventListener('focusin', e => {
    if (!isField(e.target) || !panelShown()) return;
    quietField(e.target);
    scheduleClear(60);
  }, true);

  // «← все типы» (#backBtn) прячет задание, но в ОГЭ №6, №8, №9, №12, №14,
  // №15–18, «Степенях» и ЕГЭ не пересчитывает панель — она оставалась
  // висеть над списком типов и закрывала его на телефоне. Пересчитываем
  // сами, после обработчика страницы (setTimeout), её же функцией: когда
  // панель нужна, решает страница
  document.addEventListener('click', e => {
    if (!e.target.closest || !e.target.closest('#backBtn')) return;
    setTimeout(() => {
      if (typeof window.syncKeypadVisibility === 'function') {
        try { window.syncKeypadVisibility(); } catch (err) {}
      }
    }, 0);
  });

  const PANEL_CSS = `
    /* запас под прижатой к низу панелью — см. keepClear в keypad.js */
    body.kp-open{padding-bottom:calc(var(--kp-h, 300px) + 32px) !important;}
  `;
  function ensurePanelCss() {
    if (document.getElementById('kpPanelStyle')) return;
    const st = document.createElement('style');
    st.id = 'kpPanelStyle';
    st.textContent = PANEL_CSS;
    (document.head || document.documentElement).appendChild(st);
  }
  ensurePanelCss();
  // страница объявляет syncKeypadVisibility в своём скрипте, а он идёт
  // после keypad.js — подключаемся, когда разметка и скрипты уже есть
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupPanelWatch);
  else setTimeout(setupPanelWatch, 0);

  window.Keypad = { keys, bind, insert, erase, live, qaTarget, hasQa, press, watch, keepClear, isField };
})();
