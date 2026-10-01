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

  window.Keypad = { keys, bind, insert, erase, live, qaTarget, hasQa, press, watch };
})();
