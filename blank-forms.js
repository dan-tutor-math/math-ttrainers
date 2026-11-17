/* Бланки ответов ЕГЭ/ОГЭ как объекты: вёрстка листов А4 (вектором, без картинок),
   где клетки — поля ввода. Нужны, чтобы бланк можно было заполнить на экране
   (с автопереходом по клеткам), распечатать и сохранить в PDF вместе с вписанным.

   Лист рисуется в «пикселях оригинала» (ширина источника W): единицы переводятся
   в мм через --u = 210мм / W, поэтому размеры повторяют образец один в один при
   любом масштабе. Образцы: ЕГЭ-2026 — blanks/ege2026 (Рособрнадзор, см.
   blanks/SOURCES.md); ОГЭ — по образцу из «Загрузок» Даниила (бланк №2, ОГЭ-2024).
   Значения полей — в state: { 'id': 'строка' }; клетка i — символ i строки.
   Допустимые знаки — как в правилах заполнения: заглавные кириллица и латиница,
   цифры, запятая, минус. API: BlankForms.kinds, create(kind, state, opts), allowed. */
(function () {
  'use strict';
  if (window.BlankForms) return;

  const OK = /[А-ЯЁA-Z0-9,\-–—]/;
  const norm = ch => { const u = String(ch).toUpperCase().replace(/[–—]/g, '-'); return OK.test(u) ? u : ''; };

  const CSS = `
.bf-sheet{position:relative;box-sizing:border-box;background:#fff;color:#000;overflow:hidden;font-family:Arial,'Helvetica Neue',sans-serif;user-select:none}
.bf-sheet *{box-sizing:border-box}
.bf-sheet .a{position:absolute}
.bf-sheet .sq{background:#000}
.bf-sheet .dot{border:calc(var(--u)*1.6) dotted #444}
.bf-sheet .serif{font-family:'Times New Roman',Times,serif}
.bf-sheet .t{position:absolute;white-space:nowrap;line-height:1}
.bf-sheet .c{position:absolute;border:calc(var(--u)*1.6) dotted #333;border-radius:calc(var(--u)*5);background:transparent}
.bf-sheet .c input{position:absolute;inset:0;width:100%;height:100%;border:0;background:transparent;text-align:center;padding:0;margin:0;outline:none;
  font:700 calc(var(--u)*26)/1 Arial,sans-serif;color:#111;caret-color:#0a58ca;user-select:text;text-transform:uppercase}
.bf-sheet .c input:focus{background:rgba(10,88,202,.12);border-radius:calc(var(--u)*5)}
.bf-sheet .c.ro input{pointer-events:none}
@media print{.bf-sheet .c input{color:#000}}`;
  function ensureCss() {
    if (document.getElementById('bfStyle')) return;
    const s = document.createElement('style'); s.id = 'bfStyle'; s.textContent = CSS; document.head.appendChild(s);
  }

  // ── кирпичики ──
  function Builder(srcW, srcH, state, opts) {
    const root = document.createElement('div');
    root.className = 'bf-sheet';
    root.style.setProperty('--u', 'calc(210mm / ' + srcW + ')');
    root.style.width = '210mm';
    root.style.height = 'calc(var(--u) * ' + srcH + ')';
    const n = v => 'calc(var(--u) * ' + v + ')';
    const place = (e, x, y, w, h) => {
      e.style.left = n(x); e.style.top = n(y);
      if (w != null) e.style.width = n(w);
      if (h != null) e.style.height = n(h);
      return e;
    };
    const add = (cls, x, y, w, h, html) => { const e = document.createElement('div'); e.className = cls; if (html != null) e.innerHTML = html; place(e, x, y, w, h); root.appendChild(e); return e; };
    const b = {
      root,
      sq: (x, y, w, h) => add('a sq', x, y, w || 35, h || 35),
      dot: (x, y, w, h) => add('a dot', x, y, w, h),
      frame: (x, y, w, h, t) => { const e = add('a', x, y, w, h); e.style.border = n(t || 2) + ' solid #000'; return e; },
      hr: (x1, x2, y, t) => { const e = add('a', x1, y, x2 - x1, t || 2); e.style.background = '#000'; return e; },
      // текст: (x, y) — центр по x при align:'c', иначе левый край; y — центр строки
      t: (x, y, text, o) => {
        o = o || {};
        const e = document.createElement('div');
        e.className = 't' + (o.serif ? ' serif' : '');
        e.innerHTML = text;
        e.style.fontSize = n(o.size || 16);
        if (o.bold) e.style.fontWeight = '700';
        if (o.under) e.style.textDecoration = 'underline';
        if (o.ls) e.style.letterSpacing = n(o.ls);
        if (o.color) e.style.color = o.color;
        e.style.top = n(y - (o.size || 16) / 2);
        if (o.align === 'c') { e.style.left = n(x); e.style.transform = 'translateX(-50%)'; e.style.textAlign = 'center'; }
        else if (o.align === 'r') { e.style.left = n(x); e.style.transform = 'translateX(-100%)'; }
        else e.style.left = n(x);
        root.appendChild(e); return e;
      },
      // группа клеток: id поля, левый верх, число клеток, шаг, размер клетки
      cells: (id, x, y, cnt, pitch, cw, ch, o) => {
        o = o || {};
        const val = String((state && state[id]) || '');
        for (let i = 0; i < cnt; i++) {
          const c = add('c' + (opts.readonly ? ' ro' : ''), x + i * pitch, y, cw, ch);
          const inp = document.createElement('input');
          inp.maxLength = 1; inp.value = val[i] || '';
          inp.dataset.f = id; inp.dataset.i = String(i); inp.autocomplete = 'off'; inp.spellcheck = false;
          inp.setAttribute('aria-label', (o.label || id) + ', клетка ' + (i + 1));
          if (opts.readonly) inp.readOnly = true;
          c.appendChild(inp);
        }
      },
    };
    return b;
  }

  // ввод: автопереход по клеткам группы, Backspace назад, вставка строки
  function wire(root, state, onChange) {
    const group = inp => [...root.querySelectorAll('input[data-f="' + inp.dataset.f + '"]')];
    const sync = f => {
      const arr = [...root.querySelectorAll('input[data-f="' + f + '"]')];
      state[f] = arr.map(i => i.value || ' ').join('').replace(/\s+$/, '');
      if (!state[f]) delete state[f];
      if (onChange) onChange(f, state[f] || '');
    };
    root.addEventListener('input', e => {
      const inp = e.target; if (!inp.dataset || inp.dataset.f == null) return;
      const g = group(inp), i = g.indexOf(inp);
      const raw = String(inp.value);
      inp.value = '';
      let k = i;
      for (const ch of raw) { const c = norm(ch); if (!c || k >= g.length) continue; g[k].value = c; k++; }
      sync(inp.dataset.f);
      const nx = g[Math.min(k, g.length - 1)]; if (nx) nx.focus();
    });
    root.addEventListener('keydown', e => {
      const inp = e.target; if (!inp.dataset || inp.dataset.f == null) return;
      const g = group(inp), i = g.indexOf(inp);
      if (e.key === 'Backspace' && !inp.value && i > 0) { g[i - 1].value = ''; sync(inp.dataset.f); g[i - 1].focus(); e.preventDefault(); }
      else if (e.key === 'ArrowLeft' && i > 0) { g[i - 1].focus(); e.preventDefault(); }
      else if (e.key === 'ArrowRight' && i < g.length - 1) { g[i + 1].focus(); e.preventDefault(); }
    });
    root.addEventListener('focusin', e => { if (e.target.select) e.target.select(); });
  }

  // ── ЕГЭ-2026, бланк ответов № 1 (1389 × 1940, образец blanks/ege2026/o1.png) ──
  function egeO1(state, opts) {
    const b = Builder(1389, 1940, state, opts);
    b.sq(290, 48); b.sq(1178, 48); b.sq(1178, 342); b.sq(50, 1590, 36, 30); b.sq(1304, 1590, 36, 30);
    b.dot(50, 55, 203, 203); b.dot(43, 288, 71, 88); b.dot(125, 288, 345, 94); b.dot(1255, 48, 90, 335);
    b.t(752, 63, 'ЕДИНЫЙ ГОСУДАРСТВЕННЫЙ ЭКЗАМЕН - 2026', { serif: 1, size: 31, align: 'c', under: 1 });
    b.t(752, 106, 'БЛАНК ОТВЕТОВ № 1', { serif: 1, size: 46, bold: 1, align: 'c' });
    b.hr(290, 1212, 130, 2);
    b.t(358, 155, 'Код<br>региона', { serif: 1, size: 15, bold: 1, align: 'c' }).style.lineHeight = n17;
    b.cells('reg', 325, 180, 2, 35, 32, 45, { label: 'Код региона' });
    b.t(470, 155, 'Код<br>предмета', { serif: 1, size: 15, bold: 1, align: 'c' }).style.lineHeight = n17;
    b.cells('subj', 437, 180, 2, 35, 32, 45, { label: 'Код предмета' });
    b.t(604, 155, 'Название<br>предмета', { serif: 1, size: 15, bold: 1, align: 'c' }).style.lineHeight = n17;
    b.cells('subjname', 553, 180, 3, 36, 33, 45, { label: 'Название предмета' });
    b.frame(692, 138, 375, 72, 1.5);
    b.t(880, 224, 'Подпись участника экзамена строго внутри окошка', { serif: 1, size: 12, align: 'c' });
    b.t(1135, 155, 'Резерв - 4', { serif: 1, size: 15, align: 'c' });
    b.cells('res4', 1090, 180, 3, 35, 33, 45, { label: 'Резерв-4' });
    b.hr(290, 1212, 237, 2);
    b.t(485, 257, 'Заполнять гелевой  или капиллярной ручкой ЧЕРНЫМИ чернилами ЗАГЛАВНЫМИ', { serif: 1, size: 15, bold: 1 });
    b.t(485, 282, 'ПЕЧАТНЫМИ БУКВАМИ и ЦИФРАМИ по следующим образцам:', { serif: 1, size: 15, bold: 1 });
    ['АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ,-', '1234567890  ÀÂÀÖÖÈÉËÈÏÏÜÛÛßÇ'].forEach((s, i) =>
      b.t(483, [307, 342, 369][i], s, { size: 24, bold: 1, ls: 5.5 }));
    b.t(125, 414, 'ВНИМАНИЕ!', { size: 17, bold: 1, color: '#fff', align: 'c' });
    b.t(225, 413, 'Все бланки и контрольные измерительные материалы рассматриваются в комплекте', { size: 17, bold: 1 });
    // чёрная плашка ВНИМАНИЕ! ставится под текстом
    const bar = document.createElement('div'); bar.className = 'a'; bar.style.background = '#000';
    bar.style.left = 'calc(var(--u) * 43)'; bar.style.top = 'calc(var(--u) * 400)'; bar.style.width = 'calc(var(--u) * 162)'; bar.style.height = 'calc(var(--u) * 29)';
    b.root.insertBefore(bar, b.root.querySelector('.t[style*="color"]'));
    b.hr(43, 1213, 430, 3);
    b.t(697, 450, 'Результаты выполнения заданий с КРАТКИМ  ОТВЕТОМ', { serif: 1, size: 28, align: 'c', under: 1 });
    const gy = [487, 760, 1039, 1316];   // верх первой клетки в группе из 5 строк
    for (let g = 0; g < 4; g++) {
      for (let r = 0; r < 5; r++) {
        const y = gy[g] + r * 51.4, n1 = g * 5 + r + 1;
        b.t(65, y + 22, String(n1), { size: 22, bold: 1, align: 'c' });
        if (r < 4) b.hr(50, 82, y + 46, 3);
        b.cells('a' + n1, 96, y, 17, 34.6, 29, 43, { label: 'Ответ ' + n1 });
        b.t(718, y + 22, String(n1 + 20), { size: 22, bold: 1, align: 'c' });
        if (r < 4) b.hr(703, 735, y + 46, 3);
        b.cells('a' + (n1 + 20), 746, y, 17, 34.8, 29, 43, { label: 'Ответ ' + (n1 + 20) });
      }
      if (g < 3) { b.hr(96, 684, [748, 1026, 1303][g], 1.5); b.hr(748, 1337, [748, 1026, 1303][g], 1.5); }
    }
    b.hr(108, 1288, 1578, 4);
    b.t(697, 1599, 'Замена ошибочных ответов на задания с  КРАТКИМ  ОТВЕТОМ', { serif: 1, size: 28, align: 'c', under: 1 });
    for (let r = 0; r < 3; r++) {
      const y = 1637 + r * 52;
      b.cells('rn' + (r * 2 + 1), 78, y, 2, 31, 28, 43, { label: 'Номер задания для замены' });
      b.t(144, y + 22, '–', { size: 24, bold: 1, align: 'c' });
      b.cells('rv' + (r * 2 + 1), 155, y, 15, 35, 29, 43, { label: 'Верный ответ для замены' });
      b.cells('rn' + (r * 2 + 2), 730, y, 2, 31, 28, 43, { label: 'Номер задания для замены' });
      b.t(797, y + 22, '–', { size: 24, bold: 1, align: 'c' });
      b.cells('rv' + (r * 2 + 2), 807, y, 15, 35.3, 29, 43, { label: 'Верный ответ для замены' });
    }
    b.hr(43, 1347, 1791, 4);
    b.t(697, 1818, 'ЗАПОЛНЯЕТСЯ ОТВЕТСТВЕННЫМ ОРГАНИЗАТОРОМ В АУДИТОРИИ:', { serif: 1, size: 25, align: 'c', under: 1 });
    b.t(316, 1863, 'Количество заполненных полей', { serif: 1, size: 18 });
    b.t(316, 1891, '«Замена ошибочных ответов»', { serif: 1, size: 18 });
    b.cells('cnt', 655, 1855, 1, 30, 27, 42, { label: 'Количество заполненных полей' });
    b.frame(778, 1850, 357, 52, 1.5);
    b.t(956, 1912, 'Подпись ответственного организатора строго внутри окошка', { serif: 1, size: 11, align: 'c' });
    return b.root;
  }
  const n17 = 'calc(var(--u) * 17)';

  // ── бланк ответов № 2 (лист 1, лист 2, дополнительный; ЕГЭ и ОГЭ) ──
  // 1386 × 1965, образец blanks/ege2026/o2l1.png. cfg: title, head ('лист 1' | 'лист 2' | null),
  // label (подпись поля номера листа), res (Резерв), notes, warn, foot
  function o2(state, opts, cfg) {
    const b = Builder(1386, 1965, state, opts);
    b.sq(290, 48); b.sq(1178, 48); b.sq(290, 208); b.sq(1178, 392);
    b.sq(52, 1887, 33, 33); b.sq(1180, 1887, 33, 33); b.sq(1300, 1887, 33, 33);
    b.dot(50, 55, 202, 202); b.dot(43, 288, 70, 90); b.dot(126, 282, 343, 100); b.dot(1252, 48, 88, 334);
    b.t(748, 63, cfg.title, { serif: 1, size: 31, align: 'c', under: 1 });
    if (cfg.head) {
      b.t(355, 106, 'БЛАНК ОТВЕТОВ № 2', { serif: 1, size: 44, bold: 1 });
      const v = b.hr(862, 864, 85, 2); v.style.height = 'calc(var(--u) * 127)';
      b.t(1038, 108, cfg.head, { serif: 1, size: 40, bold: 1, align: 'c' });
    } else b.t(780, 106, 'ДОПОЛНИТЕЛЬНЫЙ БЛАНК ОТВЕТОВ № 2', { serif: 1, size: 42, bold: 1, align: 'c' });
    b.hr(340, 1210, 130, 2);
    if (!cfg.head) { const v = b.hr(878, 880, 132, 2); v.style.height = 'calc(var(--u) * 80)'; }
    [[398, 'Код региона'], [553, 'Код предмета'], [731, 'Название предмета']].forEach(([x, t]) => b.t(x, 145, t, { serif: 1, size: 15, bold: 1, align: 'c' }));
    b.cells('reg', 365, 160, 2, 36, 33, 45, { label: 'Код региона' });
    b.cells('subj', 520, 160, 2, 36, 33, 45, { label: 'Код предмета' });
    b.cells('subjname', 680, 160, 3, 36, 33, 45, { label: 'Название предмета' });
    b.t(932, 176, cfg.res, { serif: 1, size: 15, align: 'c' });
    b.cells('res', 1000, 155, 6, 35.6, 33, 48, { label: cfg.res });
    b.hr(340, 1210, 212, 2);
    b.t(420, 233, cfg.label[0], { serif: 1, size: 17, align: 'c' });
    b.t(420, 254, cfg.label[1], { serif: 1, size: 17, align: 'c' });
    b.cells('sheetno', 508, 222, 12, 38.9, 35, 46, { label: cfg.label.join(' ') });
    b.t(1071, 247, 'Лист', { serif: 1, size: 18, align: 'c' });
    b.cells('list', 1105, 222, 3, 36, 33, 46, { label: 'Лист' });
    b.hr(480, 1210, 275, 2);
    cfg.notes.forEach((tx, i) => b.t(493, 295 + i * 24.5, tx, { serif: 1, size: 12.6 }));
    b.hr(480, 1210, 389, 2);
    const bar = b.sq(43, 395, 163, 22);
    b.t(125, 406, 'ВНИМАНИЕ!', { size: 15, bold: 1, color: '#fff', align: 'c' });
    b.t(223, 405, cfg.warn, { serif: 1, size: 15, bold: 1 });
    const g = b.frame(45, 418, 1288, 1452, 3);
    g.style.backgroundImage = 'linear-gradient(to right, rgba(0,0,0,.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,.2) 1px, transparent 1px)';
    g.style.backgroundSize = 'calc(var(--u) * 33.5) calc(var(--u) * 33.5)';
    b.t(632, 1904, cfg.foot, { serif: 1, size: 21, align: 'c' });
    return b.root;
  }
  const NOTE3 = ['Перепишите значения полей «Код региона», «Код предмета», «Название предмета» из БЛАНКА РЕГИСТРАЦИИ.',
    'Отвечая на задания с РАЗВЕРНУТЫМ ОТВЕТОМ, пишите аккуратно и разборчиво, соблюдая разметку страницы.',
    'Не забудьте указать номер задания, на которое Вы отвечаете, например, 31.', 'Условия задания переписывать не нужно.'];
  const egeY = 'ЕДИНЫЙ ГОСУДАРСТВЕННЫЙ ЭКЗАМЕН - 2026';
  const ogeY = 'ОСНОВНОЙ ГОСУДАРСТВЕННЫЙ ЭКЗАМЕН - 2024';
  const ALL = 'Все бланки и контрольные измерительные материалы рассматриваются в комплекте';
  const mkO2 = (title, kind) => (st, op) => o2(st, op, {
    title, head: kind === 'dop' ? null : (kind === 'l1' ? 'лист 1' : 'лист 2'),
    res: kind === 'l1' ? 'Резерв - 5' : 'Резерв - 6',
    label: kind === 'l1' ? ['Бланк ответов № 2', '(лист 2)'] : ['Дополнительный', 'бланк ответов № 2'],
    notes: title === ogeY ? NOTE3.slice(1) : NOTE3,   // на образце ОГЭ строки «Перепишите значения…» нет
    warn: kind === 'l1' ? ALL : kind === 'l2' ? 'Данный бланк использовать только после заполнения бланка ответов № 2 лист 1' : 'Данный бланк использовать только после заполнения обоих листов основного бланка ответов № 2',
    foot: kind === 'l1' ? 'Оборотная сторона бланка НЕ ЗАПОЛНЯЕТСЯ. Используйте бланк ответов № 2 (лист 2).' : 'Оборотная сторона бланка НЕ ЗАПОЛНЯЕТСЯ. Попросите дополнительный бланк ответов № 2.',
  });

  // ── ЕГЭ-2026, бланк регистрации (1348 × 1907, образец blanks/ege2026/reg.png) ──
  function egeReg(state, opts) {
    const b = Builder(1348, 1907, state, opts);
    b.sq(280, 48, 33, 33); b.sq(1145, 48, 33, 33); b.sq(50, 1472, 33, 33); b.sq(1265, 1472, 33, 33); b.sq(50, 1823, 33, 33); b.sq(667, 1823, 33, 33); b.sq(1265, 1823, 33, 33);
    b.dot(50, 55, 195, 195); b.dot(43, 280, 67, 85); b.dot(122, 272, 336, 95); b.dot(1218, 48, 90, 325);
    b.t(728, 62, egeY, { serif: 1, size: 31, align: 'c', under: 1 });
    b.t(728, 107, 'БЛАНК РЕГИСТРАЦИИ', { serif: 1, size: 46, bold: 1, align: 'c' });
    b.hr(282, 1177, 140, 2);
    const v1 = b.hr(821, 823, 140, 2); v1.style.height = 'calc(var(--u) * 255)';
    const v2 = b.hr(1025, 1027, 258, 2); v2.style.height = 'calc(var(--u) * 142)';
    b.hr(282, 1177, 257, 2);
    const lbl = (x, y, t, sz) => b.t(x, y, t, { serif: 1, size: sz || 14, bold: 1, align: 'c' });
    lbl(330, 168, 'Код<br>региона').style.lineHeight = n17; b.cells('reg', 298, 192, 2, 36, 32, 44, { label: 'Код региона' });
    lbl(520, 168, 'Код образовательной<br>организации').style.lineHeight = n17; b.cells('org', 417, 192, 6, 35.2, 31, 44, { label: 'Код образовательной организации' });
    lbl(727, 168, 'Класс<br>Номер Буква').style.lineHeight = n17; b.cells('cls', 678, 192, 3, 33, 31, 44, { label: 'Класс' });
    lbl(932, 167, 'Код ППЭ'); b.cells('ppe', 865, 192, 4, 34.5, 31, 44, { label: 'Код ППЭ' });
    lbl(1097, 167, 'Номер аудитории'); b.cells('aud', 1030, 192, 4, 34.5, 31, 44, { label: 'Номер аудитории' });
    lbl(542, 297, 'Код<br>предмета').style.lineHeight = n17; b.cells('subj', 511, 322, 2, 36, 32, 44, { label: 'Код предмета' });
    lbl(667, 297, 'Название<br>предмета').style.lineHeight = n17; b.cells('subjname', 615, 322, 3, 36, 32, 44, { label: 'Название предмета' });
    lbl(873, 288, 'Дата проведения ЕГЭ'); b.t(873, 305, '(ДД-ММ-ГГ)', { serif: 1, size: 11, align: 'c' });
    b.cells('d1', 757, 322, 2, 35, 31, 44, { label: 'День' }); b.t(830, 345, '–', { size: 26, bold: 1, align: 'c' });
    b.cells('d2', 840, 322, 2, 35, 31, 44, { label: 'Месяц' }); b.t(913, 345, '–', { size: 26, bold: 1, align: 'c' });
    b.cells('d3', 924, 322, 2, 34, 31, 44, { label: 'Год' });
    b.t(1113, 295, 'Резерв - 1', { serif: 1, size: 14, align: 'c' }); b.cells('res1', 1065, 322, 3, 35, 32, 44, { label: 'Резерв-1' });
    b.t(673, 413, 'Заполнять гелевой или капиллярной ручкой ЧЕРНЫМИ чернилами ЗАГЛАВНЫМИ ПЕЧАТНЫМИ БУКВАМИ по следующим образцам:', { serif: 1, size: 14.5, bold: 1, align: 'c' });
    b.t(673, 446, 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ1234567890XVIL-', { size: 24, bold: 1, ls: 5, align: 'c' });
    b.hr(43, 1307, 468, 3);
    b.sq(43, 479, 157, 24); b.t(121, 491, 'ВНИМАНИЕ!', { size: 15, bold: 1, color: '#fff', align: 'c' });
    b.t(218, 487, 'Все бланки и контрольные измерительные материалы рассматриваются в комплекте', { serif: 1, size: 16, bold: 1 });
    b.hr(43, 1307, 505, 3);
    b.t(673, 526, 'СВЕДЕНИЯ ОБ УЧАСТНИКЕ', { serif: 1, size: 29, align: 'c' });
    b.hr(43, 1307, 546, 3);
    [['Фамилия', 580, 'fam'], ['Имя', 636, 'im'], ['Отчество', 690, 'ot']].forEach(([t, y, id]) => {
      b.t(70, y, t, { serif: 1, size: 25, bold: 1 }); b.cells(id, 218, y - 22, 30, 35, 31, 43, { label: t });
    });
    b.t(70, 706, '(при наличии)', { serif: 1, size: 11 });
    b.hr(43, 1307, 727, 3);
    b.t(70, 765, 'Документ', { serif: 1, size: 25, bold: 1 });
    b.t(262, 765, 'Серия', { serif: 1, size: 24 }); b.cells('docs', 358, 743, 9, 34.8, 31, 44, { label: 'Серия документа' });
    b.t(764, 765, 'Номер', { serif: 1, size: 24 }); b.cells('docn', 850, 743, 12, 35, 31, 44, { label: 'Номер документа' });
    b.hr(43, 1307, 808, 3);
    b.t(673, 831, 'ВО ВРЕМЯ ПРОВЕДЕНИЯ ЭКЗАМЕНА СОБЛЮДАЙТЕ ПОРЯДОК ПРОВЕДЕНИЯ ГИА', { serif: 1, size: 27, align: 'c', under: 1 });
    b.sq(545, 868, 260, 27); b.t(675, 881, 'ЗАПРЕЩАЕТСЯ:', { size: 22, bold: 1, color: '#fff', align: 'c' });
    ['выполнять экзаменационную работу несамостоятельно, общаться с другими участниками экзамена;',
      'иметь при себе средства связи, фото-, аудио- и видеоаппаратуру, электронно-вычислительную технику, справочные',
      '&nbsp;&nbsp;материалы, письменные заметки и иные средства хранения и передачи информации;',
      'выносить из аудиторий и ППЭ черновики, экзаменационные материалы на бумажном и (или) электронном носителях;',
      'фотографировать экзаменационные материалы, черновики;',
      'выходить из аудитории и перемещаться по ППЭ без сопровождения организатора.'].forEach((tx, i) => {
      const y = [915, 944, 972, 1002, 1031, 1059][i];
      if (!tx.startsWith('&nbsp;')) b.t(40, y, '–', { size: 21, bold: 1 });
      b.t(62, y, tx.replace(/^&nbsp;(&nbsp;)*/, ''), { size: 19.5, bold: 1 }).style.letterSpacing = '-0.02em';
    });
    b.t(673, 1118, 'ДО НАЧАЛА РАБОТЫ С БЛАНКАМИ ОТВЕТОВ ПРОВЕРЬТЕ:', { serif: 1, size: 27, align: 'c', under: 1 });
    [['наличие в своем индивидуальном комплекте (ИК) бланка регистрации, бланка ответов № 1, бланка ответов № 2 (лист 1) и бланка', 1165, 1],
      ['ответов № 2 (лист 2) (за исключением ИК для проведения ЕГЭ по математике базового уровня) и контрольных измерительных', 1192, 0],
      ['материалов (КИМ);', 1218, 0],
      ['отсутствие дефектов печати КИМ и бланков (в том числе в штрихкодах);', 1246, 1],
      ['совпадение значений штрихкодов и номеров КИМ с  соответствующими значениями на контрольном листе или на конвертах ИК', 1273, 1],
      ['(при  проведении ЕГЭ в ППЭ на дому, в учреждениях здравоохранения, исполнения наказаний, закрытого типа).', 1300, 0],
      ['Если обнаружили брак или некомплектность, обратитесь к организатору за другим ИК.', 1327, 0]].forEach(([tx, y, dash]) => {
      if (dash) b.t(40, y, '–', { size: 19 }); b.t(62, y, tx, { size: 18.8 }).style.letterSpacing = '-0.02em';
    });
    b.t(147, 1392, 'Контрольная сумма', { serif: 1, size: 21 });
    [368, 455, 541, 628, 714].forEach((x, i) => { b.cells('cs' + (i + 1), x, 1370, 2, 34.5, 31, 44, { label: 'Контрольная сумма' }); if (i < 4) b.t(x + 76, 1392, '–', { size: 26, bold: 1, align: 'c' }); });
    b.hr(43, 1307, 1449, 4);
    b.t(887, 1505, 'С порядком проведения', { serif: 1, size: 24, align: 'r' });
    b.t(887, 1537, 'государственной итоговой аттестации ознакомлен(-а).', { serif: 1, size: 24, align: 'r' });
    b.frame(907, 1470, 310, 80, 1.5);
    b.t(1062, 1567, 'Подпись участника экзамена строго внутри окошка', { serif: 1, size: 12, align: 'c' });
    b.hr(43, 1307, 1586, 3);
    b.t(178, 1625, 'Резерв - 2', { serif: 1, size: 21 }); b.cells('res2', 290, 1603, 6, 34.8, 31, 44, { label: 'Резерв-2' });
    b.t(551, 1625, 'Служебная отметка', { serif: 1, size: 21 }); b.cells('serv', 760, 1603, 12, 38.2, 33, 44, { label: 'Служебная отметка' });
    b.hr(43, 1307, 1663, 4);
    b.t(673, 1692, 'ЗАПОЛНЯЕТСЯ ОТВЕТСТВЕННЫМ ОРГАНИЗАТОРОМ В АУДИТОРИИ:', { serif: 1, size: 25, align: 'c', under: 1 });
    b.t(205, 1745, 'Удален из ППЭ в связи', { serif: 1, size: 18 }); b.t(205, 1764, 'с нарушением порядка', { serif: 1, size: 18 }); b.t(205, 1783, 'проведения ГИА', { serif: 1, size: 18 });
    b.cells('rem', 433, 1757, 1, 30, 23, 23, { label: 'Удален из ППЭ' });
    b.t(597, 1754, 'Не завершил экзамен по', { serif: 1, size: 18 }); b.t(597, 1773, 'объективным причинам', { serif: 1, size: 18 });
    b.cells('unf', 838, 1757, 1, 30, 23, 23, { label: 'Не завершил экзамен' });
    b.frame(950, 1723, 355, 60, 1.5);
    b.t(1128, 1805, 'Подпись ответственного организатора строго внутри окошка', { serif: 1, size: 11, align: 'c' });
    return b.root;
  }

  const KINDS = {
    ege_reg: { title: 'ЕГЭ. Бланк регистрации', make: egeReg },
    ege_o1: { title: 'ЕГЭ. Бланк ответов № 1', make: egeO1 },
    ege_o2l1: { title: 'ЕГЭ. Бланк ответов № 2, лист 1', make: mkO2(egeY, 'l1') },
    ege_o2l2: { title: 'ЕГЭ. Бланк ответов № 2, лист 2', make: mkO2(egeY, 'l2') },
    ege_dop: { title: 'ЕГЭ. Дополнительный бланк ответов № 2', make: mkO2(egeY, 'dop') },
    oge_o2l1: { title: 'ОГЭ. Бланк ответов № 2, лист 1', make: mkO2(ogeY, 'l1') },
    oge_o2l2: { title: 'ОГЭ. Бланк ответов № 2, лист 2', make: mkO2(ogeY, 'l2') },
  };

  function create(kind, state, opts) {
    ensureCss();
    opts = opts || {};
    const k = KINDS[kind]; if (!k) throw new Error('нет бланка ' + kind);
    state = state || {};
    const el = k.make(state, opts);
    if (!opts.readonly) wire(el, state, opts.onChange);
    el.dataset.form = kind;
    return el;
  }

  window.BlankForms = { kinds: KINDS, create, norm, ensureCss };
})();
