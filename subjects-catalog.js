/* subjects-catalog.js — единый каталог тренажёров: предметы, экзамены, номера.

   Зачем отдельный файл. Раньше один и тот же список жил в четырёх местах:
   реестр TRAINERS и вкладки экзаменов на главной (index.html), панель
   тренажёров досок и презентаций (TRAINERS_PANEL_GROUPS в trainer-tasks.js),
   подписи «Подборки» (TRAINER_NAMES в boards-core.js) и карта снятия заданий
   (TRAINER_CAPTURE). Их сверяли руками — и русский, обществознание и
   английский на главную попали, а в панель досок так и не дошли. Теперь
   экзамен описывается здесь один раз: главная строит из него вкладку,
   панель на досках, в презентациях, на телефоне и в «Работах» — свой
   раздел, доска — способ снять задание. Новый экзамен = одна запись в EXAMS.

   Подключается обычным <script> ДО кода, который его читает: на главной —
   до встроенного скрипта с NAV, на досках, в панели, в «Работах» и на
   странице работы ученика — до trainer-tasks.js. Ничего не рисует сам.

   Что тут НЕ лежит: дерево «Классы» и программа по классам (CURRICULUM) —
   это навигация одной главной, панели они не нужны. */
(function(){
  'use strict';

  // Порядок предметов — как в переключателе на главной. color — акцент
  // предмета светлой темы из index.html (html[data-subject=…] --ink): белый
  // текст на нём читается и в тёмной теме, светлые варианты тёмной темы
  // для заливки не годятся (обществознание #3FA584 с белым — 3:1, «Грабли»)
  const SUBJECTS = [
    { id: 'math', title: 'Математика',     color: '#004C99' },
    { id: 'rus',  title: 'Русский',        color: '#9E2A47' },
    { id: 'soc',  title: 'Обществознание', color: '#17694F' },
    { id: 'eng',  title: 'Английский',     color: '#5B3596' },
  ];

  /* ───────── реестр тренажёров ─────────
     id → { name, href, subject, eq, cap, panel, full }
     - name  — подпись карточки (как на главной);
     - href  — страница; null — заглушка «скоро»;
     - eq    — короткая подсказка справа в списке панели;
     - cap   — как доска снимает задание, если не описано в TRAINER_CAPTURE
               (trainer-tasks.js): 'ege' — страница-копия ege_prof.html,
               условие в #egeQuestion; 'rus' — скелет rus_oge.html;
     - panel — false: на главной есть, в панель досок не идёт;
     - full  — подпись с предметом и экзаменом для «Подборки» на доске */
  const T = {
    oge1_5:   { name: '№1–5. Практические задачи',      href: 'oge1_5.html',   eq: 'шины, тарифы…' },
    oge6:     { name: '№6. Числа и вычисления',         href: 'oge6.html',     eq: '1/10 + 29/20' },
    oge7:     { name: '№7. Сравнение и оценка чисел',   href: 'oge7.html',     eq: '5 < √27 < 6' },
    oge8:     { name: '№8. Выражения и формулы',        href: 'oge8.html',     eq: 'a²−b²' },
    oge9:     { name: '№9. Уравнения и неравенства',    href: 'oge9.html',     eq: '3x²−7x+2=0' },
    oge10:    { name: '№10. Теория вероятности',        href: 'oge10.html',    eq: 'P(A)=5⁄20' },
    oge11:    { name: '№11. Графики функций',           href: 'oge11.html',    eq: 'y=kx+b' },
    oge12:    { name: '№12. Вычисления по формулам',    href: 'oge12.html',    eq: 'v=v₀+at' },
    oge13:    { name: '№13. Неравенства',               href: 'oge13.html',    eq: 'x²−9≤0' },
    oge14:    { name: '№14. Прогрессии',                href: 'oge14.html',    eq: 'aₙ=a₁+(n−1)d' },
    oge15_18: { name: '№15–18. Геометрия',              href: 'oge15_18.html', eq: 'S, P, Пифагор' },
    oge19:    { name: '№19. Верные утверждения',        href: 'oge19.html',    eq: 'верно/неверно' },
    add_col:  { name: 'Сложение в столбик',             href: 'addition.html',          eq: '999+1' },
    sub_col:  { name: 'Вычитание в столбик',            href: 'subtraction.html',       eq: '700−458' },
    mul_col:  { name: 'Умножение в столбик',            href: 'multiplication.html',    eq: '347×26' },
    div_col:  { name: 'Деление в столбик',              href: 'division.html',          eq: '4826:7' },
    linear:   { name: 'Линейные уравнения',             href: 'linear.html',            eq: '3(2x−5)+x' },
    quadratic:{ name: 'Квадратные уравнения',           href: 'quadratic.html',         eq: '2x²−7x+3=0' },
    frac_mul: { name: 'Умножение дробей',               href: 'fraction_multiply.html', eq: '4⁄9×3⁄8' },
    frac_div: { name: 'Деление дробей',                 href: 'fraction_divide.html',   eq: '2⁄3÷4⁄5' },
    neg_pos:  { name: 'Сложение и вычитание положительных и отрицательных чисел', href: 'neg_pos.html' },
    // Состав числа для 1 класса: домики 2–10, девять типов заданий на одной странице
    sostav:   { name: 'Состав числа: домики',           href: 'sostav.html' },
    powers:   { name: 'Действия со степенями',          href: 'powers.html',            eq: 'a⁵·a³=a⁸' },
    // Промпт №65: НОД — три раздела (перебор, разложение, Евклид) в одном файле
    gcd:      { name: 'Наибольший общий делитель (НОД)', href: 'gcd.html',              eq: 'НОД(84, 60)' },
    // Промпт №74: НОК — перебор кратных, разложение и через НОД, по образцу НОД
    lcm:      { name: 'Наименьшее общее кратное (НОК)', href: 'lcm.html',               eq: 'НОК(12, 18)' },
    // Промпт №71: все типы задач на проценты — плитки прототипов в одном файле
    percent:  { name: 'Проценты',                       href: 'percent.html',           eq: '15% от 80' },
    // Промпт №12 (новый список): свойства логарифмов; одна страница на 10 и 11 класс
    logarithms: { name: 'Свойства логарифмов',          href: 'logarithms.html',        eq: 'log₂8 = 3' },
    // Промпт №13 (новый список): тригонометрические уравнения, от простейших до №14 ЕГЭ
    trig_equations: { name: 'Тригонометрические уравнения', href: 'trig_equations.html', eq: 'sin x = ½' },
  };
  Object.keys(T).forEach(id => { T[id].subject = 'math'; });

  // номера одной страницы на много позиций (?n=…) — записи строим циклом,
  // иначе тут стояли бы десятки почти одинаковых строк
  function addNumbered(prefix, titles, mk){
    Object.keys(titles).forEach(k => {
      const n = +k;
      T[prefix + n] = Object.assign({ name: '№' + n + '. ' + titles[n] }, mk(n, titles[n]));
    });
  }
  const range = (prefix, from, to) => { const a = []; for (let n = from; n <= to; n++) a.push(prefix + n); return a; };
  const byIndex = arr => { const o = {}; arr.forEach((t, i) => { o[i + 1] = t; }); return o; };

  /* ЕГЭ (профиль): все 20 позиций — ege_prof.html?n=…, банк ege-prof-bank.js.
     Названия — по спецификации ЕГЭ-2027 */
  const EGE_PROF_TITLES = [
    'Планиметрия', 'Векторы', 'Стереометрия', 'Начала теории вероятностей',
    'Вероятности сложных событий', 'Случайная величина', 'Простейшие уравнения',
    'Вычисления и преобразования', 'Производная и графики',
    'Задачи с прикладным содержанием', 'Текстовые задачи', 'Графики функций',
    'Кредиты и вклады', 'Уравнения', 'Стереометрическая задача', 'Неравенства',
    'Прикладная задача', 'Планиметрическая задача', 'Задача с параметром',
    'Числа и их свойства',
  ];
  addNumbered('ege', byIndex(EGE_PROF_TITLES), (n, t) => ({ href: 'ege_prof.html?n=' + n, subject: 'math',
    cap: 'ege', eq: n <= 13 ? 'краткий ответ' : 'с решением', full: 'ЕГЭ профиль №' + n + '. ' + t }));

  /* ЕГЭ (база): та же страница ege_base.html на все 21 позицию. Префикс egeb,
     чтобы id не совпали с профилем (по ним живут подборка и снимки на доске) */
  const EGE_BASE_TITLES = [
    'Простейшие текстовые задачи', 'Величины и их значения', 'Графики, диаграммы и таблицы',
    'Вычисления по формулам', 'Начала теории вероятностей', 'Выбор оптимального варианта',
    'Анализ графиков и диаграмм', 'Анализ утверждений', 'Площади на клетчатом плане',
    'Прикладная планиметрия', 'Прикладная стереометрия', 'Планиметрия', 'Стереометрия',
    'Вычисления', 'Проценты и доли', 'Значения выражений', 'Простейшие уравнения',
    'Числа на прямой и неравенства', 'Цифровая запись числа', 'Текстовые задачи',
    'Задачи на смекалку',
  ];
  addNumbered('egeb', byIndex(EGE_BASE_TITLES), (n, t) => ({ href: 'ege_base.html?n=' + n, subject: 'math',
    cap: 'ege', eq: 'краткий ответ', full: 'ЕГЭ база №' + n + '. ' + t }));

  /* ОГЭ, часть 2 (Промпт №61): задания 20–25 — та же страница, что у ЕГЭ
     (oge_part2.html?n=20). Id oge20…oge25 не пересекаются с первой частью */
  const OGE_PART2_TITLES = {
    20: 'Уравнения и неравенства', 21: 'Текстовая задача', 22: 'Графики функций',
    23: 'Геометрическая задача на вычисление', 24: 'Геометрическая задача на доказательство',
    25: 'Геометрическая задача повышенной сложности',
  };
  addNumbered('oge', OGE_PART2_TITLES, n => ({ href: 'oge_part2.html?n=' + n, subject: 'math',
    cap: 'ege', eq: n === 24 ? 'доказательство' : 'с решением' }));

  /* Русский язык, ОГЭ (13 заданий): №2–12 — одна страница rus_oge.html, №1
     (изложение) и №13 (сочинение) — свои страницы: их не проверить ключом и
     снимком на доску они бессмысленны (аудио, темы и черновик), поэтому в
     панель не идут. Названия совпадают с NUMS в rus_oge.html */
  const RUS_OGE_TITLES = {
    1: 'Сжатое изложение', 2: 'Грамматическая основа', 3: 'Характеристики предложений',
    4: 'Пунктуационные правила', 5: 'Расстановка запятых', 6: 'Объяснение написания',
    7: 'Пропущенные буквы', 8: 'Формы слова', 9: 'Замена словосочетания',
    10: 'Содержание текста', 11: 'Средства выразительности', 12: 'Лексический анализ',
    13: 'Сочинение-рассуждение',
  };
  const RUS_OGE_PAGES = { 1: 'rus_oge01.html', 13: 'rus_oge13.html' };
  addNumbered('rus', RUS_OGE_TITLES, (n, t) => {
    const page = !RUS_OGE_PAGES[n];
    return { href: RUS_OGE_PAGES[n] || 'rus_oge.html?n=' + n, subject: 'rus',
      cap: page ? 'rus' : null, panel: page, eq: 'краткий ответ', full: 'Русский ОГЭ №' + n + '. ' + t };
  });

  /* Обществознание, ОГЭ по КИМ 2027 (20 заданий): все номера — soc_oge.html,
     копия страницы ЕГЭ (доска, подборка, сессия). Развёрнутые ответы доска
     проверить не может — они ложатся картинкой. Названия совпадают с TITLES
     fipi-pilot/tools/soc_page_export.py */
  const SOC_OGE_TITLES = {
    1: 'Понятия и их смысл', 2: 'Пропуск в таблице', 3: 'Сходства и различия',
    4: 'Человек, общество, культура: понятия', 5: 'Человек, общество, культура: ситуация',
    6: 'Человек, общество, культура: суждения', 7: 'Анализ фотографии',
    8: 'Финансовая грамотность', 9: 'Экономика', 10: 'Экономика: суждения', 11: 'Политика',
    12: 'Диаграмма или таблица', 13: 'Конституция и органы власти', 14: 'Соответствие',
    15: 'Право', 16: 'Государство и право: суждения', 17: 'Объяснение явления',
    18: 'Текст: план', 19: 'Текст: ответы по тексту', 20: 'Текст: примеры',
  };
  const SOC_LONG = [1, 7, 8, 12, 17, 18, 19, 20];
  addNumbered('soc', SOC_OGE_TITLES, (n, t) => ({ href: 'soc_oge.html?n=' + n, subject: 'soc', cap: 'ege',
    eq: SOC_LONG.indexOf(n) >= 0 ? 'развёрнутый' : 'краткий ответ', full: 'Обществознание ОГЭ №' + n + '. ' + t }));

  /* Английский, ОГЭ (КИМ 2027): все позиции — eng_oge.html, копия страницы ЕГЭ.
     Позиция — набор КИМ (одна аудиозапись или один текст и все его вопросы),
     в адресе первый номер набора (?n=20 — №20–28). Аудирование в панель не
     идёт: на доске снимок без звука бесполезен. Названия — NUMS скрипта
     fipi-pilot/tools/eng_export.py */
  const ENG_OGE = [
    [1, '№1–4', 'Аудирование: четыре коротких текста', 'аудио'], [5, '№5', 'Аудирование: рубрики к высказываниям', 'аудио'],
    [6, '№6–11', 'Аудирование: заполнение таблицы', 'аудио'], [12, '№12', 'Чтение: в каком тексте ответ', 'чтение'],
    [13, '№13–19', 'Чтение: True, False, Not stated', 'чтение'], [20, '№20–28', 'Грамматика', 'грамматика'],
    [29, '№29–34', 'Словообразование', 'лексика'], [35, '№35', 'Электронное письмо', 'письмо'],
    [36, 'Устная часть, №1', 'Чтение текста вслух', 'устно'], [37, 'Устная часть, №2', 'Диалог-расспрос', 'устно'],
    [38, 'Устная часть, №3', 'Монологическое высказывание', 'устно'],
  ];
  ENG_OGE.forEach(([n, label, title, eq]) => {
    T['eng' + n] = { name: label + '. ' + title, href: 'eng_oge.html?n=' + n, subject: 'eng', cap: 'ege',
      eq, panel: eq !== 'аудио', full: 'Английский ОГЭ ' + label + '. ' + title };
  });

  /* ───────── экзамены ─────────
     Вкладки «Экзамены» на главной и разделы панели досок строятся отсюда.
     id — id подвкладки на главной (сохранённая вкладка помнит его, не менять);
     title — подпись подвкладки и раздела панели; groups — как на главной
     (continueNum: нумерация карточек продолжается со второй группы и совпадает
     с номером задания); soon — пока пусто, в панель не идёт */
  const EXAMS = [
    { subject: 'math', id: 'oge', title: 'ОГЭ', groups: [
      { title: 'Часть 1 — краткий ответ', items: ['oge1_5','oge6','oge7','oge8','oge9','oge10','oge11','oge12','oge13','oge14','oge15_18','oge19'], continueNum: true },
      { title: 'Часть 2 — развёрнутый ответ', items: range('oge', 20, 25), continueNum: true },
    ] },
    { subject: 'math', id: 'ege_prof', title: 'ЕГЭ профиль', groups: [
      { title: 'Часть 1 — краткий ответ', items: range('ege', 1, 13), continueNum: true },
      { title: 'Часть 2 — развёрнутый ответ', items: range('ege', 14, 20), continueNum: true },
    ] },
    { subject: 'math', id: 'ege_base', title: 'ЕГЭ база', groups: [
      { title: 'Задания с кратким ответом', items: range('egeb', 1, 21) },
    ] },
    { subject: 'rus', id: 'oge', title: 'ОГЭ', groups: [
      { title: 'Часть 1 — изложение', items: ['rus1'] },
      { title: 'Часть 2 — краткий ответ', items: range('rus', 2, 12), continueNum: true },
      { title: 'Часть 3 — сочинение', items: ['rus13'], continueNum: true },
    ] },
    { subject: 'rus', id: 'ege', title: 'ЕГЭ', groups: [], soon: true,
      soonText: 'ЕГЭ по русскому готовим следующим — тоже по открытому банку ФИПИ.' },
    { subject: 'soc', id: 'oge', title: 'ОГЭ', groups: [
      { title: 'Задания 1–17', items: range('soc', 1, 17) },
      { title: 'Задания 18–20 — к тексту', items: range('soc', 18, 20), continueNum: true },
    ] },
    { subject: 'soc', id: 'ege', title: 'ЕГЭ', groups: [], soon: true },
    { subject: 'eng', id: 'oge', title: 'ОГЭ', groups: [
      { title: 'Аудирование', items: ['eng1', 'eng5', 'eng6'] },
      { title: 'Чтение', items: ['eng12', 'eng13'] },
      { title: 'Грамматика и лексика', items: ['eng20', 'eng29'] },
      { title: 'Письмо', items: ['eng35'] },
      { title: 'Устная часть', items: ['eng36', 'eng37', 'eng38'] },
    ] },
    { subject: 'eng', id: 'ege', title: 'ЕГЭ', groups: [], soon: true },
  ];

  /* Разделы панели, которых нет среди экзаменов. «Основа» — без повторов
     одного тренажёра в нескольких разделах: на главной он лежит в нескольких
     классах ради навигации, а в панели это только мешало бы искать */
  const PANEL_EXTRA = {
    math: [
      { title: 'Основа', items: ['add_col', 'sub_col', 'mul_col', 'div_col', 'linear', 'quadratic',
        'frac_mul', 'frac_div', 'powers', 'gcd', 'lcm', 'percent', 'logarithms', 'trig_equations'] },
    ],
  };

  // подвкладки экзаменов предмета в формате NAV главной
  function examSubtabs(subject){
    return EXAMS.filter(e => e.subject === subject).map(e => {
      const st = { id: e.id, title: e.title, groups: e.groups.map(g => Object.assign({}, g, { items: g.items.slice() })) };
      if (e.soon) st.soon = true;
      if (e.soonText) st.soonText = e.soonText;
      return st;
    });
  }

  // разделы панели досок: { subject, title, items: [{ id, name, href, eq }] }.
  // В панель идёт только то, что открывается (есть href) и не помечено panel:false
  function panelGroups(){
    const out = [];
    SUBJECTS.forEach(s => {
      const groups = EXAMS.filter(e => e.subject === s.id && !e.soon)
        .map(e => ({ title: e.title, ids: [].concat(...e.groups.map(g => g.items)) }))
        .concat((PANEL_EXTRA[s.id] || []).map(g => ({ title: g.title, ids: g.items })));
      groups.forEach(g => {
        const items = g.ids.map(id => {
          const t = T[id];
          if (!t || !t.href || t.panel === false) return null;
          return { id, name: t.name, href: t.href, eq: t.eq || '' };
        }).filter(Boolean);
        if (items.length) out.push({ subject: s.id, title: g.title, items });
      });
    });
    return out;
  }

  window.MathhCatalog = {
    subjects: SUBJECTS,
    trainers: T,
    exams: EXAMS,
    examSubtabs,
    panelGroups,
    range,
    titles: { egeProf: EGE_PROF_TITLES, egeBase: EGE_BASE_TITLES, ogePart2: OGE_PART2_TITLES,
              rusOge: RUS_OGE_TITLES, socOge: SOC_OGE_TITLES, engOge: ENG_OGE },
    subjectOf: id => (T[id] && T[id].subject) || null,
  };
})();
