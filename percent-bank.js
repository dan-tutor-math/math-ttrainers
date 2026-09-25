/* ═══════════════════════════════════════════════════════════════════════
   percent-bank.js — прототипы тренажёра «Проценты» (5–6 класс), промпт №71.

   Источник — практикум «Проценты · 5–6 класс» (Mathh.): 13 блоков заданий,
   в каждом уровни А (базовый — прямое применение правила), Б (средний —
   неудобные числа, проценты больше 100 %) и В (текстовые задачи и задачи с
   подвохом). Здесь блоки разложены на прототипы — один прототип = один
   способ рассуждения, иначе плитка «Процент от числа» смешивала бы устный
   счёт и задачи на остаток, и ученик не понимал бы, что тренирует.

   Задания ГЕНЕРИРУЮТСЯ, а не лежат готовыми (в отличие от ЕГЭ-банков):
   у 5–6 класса смысл в том, чтобы решить одно и то же правило много раз на
   разных числах. Генератор отдаёт готовый объект задания — обычные данные
   без функций (условие, поля, решение по шагам). Это важно: объект целиком
   уходит в снимок совместной сессии, в карточки «+» и на доску, а функции
   через JSON не проходят (та же беда была у quadratic.html, HANDOFF §4).

   Поле ответа: { id, label, type, value, unit?, show? }
     type 'num'  — число; принимается десятичная дробь, обыкновенная и
                   смешанное число («33 1/3»), знак единицы в конце не мешает
     type 'dec'  — только десятичная запись (блок 1: «запиши десятичной»)
     type 'frac' — только обыкновенная несократимая дробь (блок 1)
     value — машинная запись эталона: '0.45', '3/25', '100/3'
     show  — как эталон показать ученику (HTML), если не как value
   Вместо полей может быть choice: { opts: [HTML…], correct } — выбор
   варианта (сравнение, «что выгоднее»).

   meta — исходные числа задания. Страница их не читает; по ним тест
   (test_prompt71_percent.py) пересчитывает ответ НЕЗАВИСИМО от генератора —
   так ловится опечатка в формуле решения.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  /* ── случайности ── */
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const chance = p => Math.random() < p;
  // случайный элемент, удовлетворяющий условию; генераторы строятся так, что
  // подходящий найдётся быстро, предел — только защита от вечного цикла
  function tryGen(make, ok, tries){
    for (let i = 0; i < (tries || 400); i++){ const v = make(); if (ok(v)) return v; }
    throw new Error('percent-bank: не удалось подобрать числа');
  }

  /* ── числа ── */
  function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while (b){ [a, b] = [b, a % b]; } return a; }
  // убираем хвосты двоичной арифметики: 0.1 + 0.2 → 0.3
  const clean = x => Math.round(x * 1e9) / 1e9;
  const isInt = x => Math.abs(x - Math.round(x)) < 1e-9;
  // сколько знаков после запятой у числа (для отбора «удобных» ответов)
  function decPlaces(x){
    x = clean(Math.abs(x));
    for (let k = 0; k <= 9; k++){ if (isInt(x * Math.pow(10, k))) return k; }
    return 99;
  }
  const NB = ' ';   // неразрывный пробел: «15 %» и «40 000» не рвутся по строкам
  // 40000 → «40 000», 0.035 → «0,035», −5 → «−5». Разряды — только с пяти
  // знаков: «1800 ₽», как в практикуме, а не «1 800 ₽»
  function N(x){
    const v = clean(x);
    const neg = v < 0;
    let s = String(Math.abs(v));
    if (/e/i.test(s)) s = Math.abs(v).toFixed(9).replace(/0+$/, '').replace(/\.$/, '');
    let [i, f] = s.split('.');
    if (i.length > 4) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, NB);
    return (neg ? '−' : '') + i + (f ? ',' + f : '');
  }
  const P = x => N(x) + NB + '%';
  const RUB = x => N(x) + NB + '₽';
  // машинная запись для эталона ответа
  const V = x => String(clean(x));
  // вертикальная дробь — те же классы, что понимает «Подборка» (basket-core.js:
  // .frac/.num/.den), поэтому в подборке и на печати дробь остаётся дробью
  function F(n, d){ return '<span class="frac"><span class="num">' + n + '</span><span class="den">' + d + '</span></span>'; }
  // смешанное число: целая часть и дробь рядом (33 1/3)
  function MIX(num, den){
    const g = gcd(num, den); num /= g; den /= g;
    const w = Math.floor(num / den), r = num - w * den;
    if (!r) return N(w);
    return (w ? N(w) : '') + F(r, den);
  }
  // несократимая дробь num/den строкой-HTML (целое — просто число)
  function FR(num, den){
    const g = gcd(num, den); num /= g; den /= g;
    return den === 1 ? N(num) : F(N(num), N(den));
  }
  const b = s => '<b>' + s + '</b>';
  // 1 ученик, 2 ученика, 5 учеников — форма слова по числу
  function plural(n, one, few, many){
    const a = Math.abs(n) % 100, c = a % 10;
    if (!isInt(n)) return few;                 // 2,5 процента, 1,5 кг — «родительный единственного»
    if (a > 10 && a < 20) return many;
    if (c === 1) return one;
    if (c >= 2 && c <= 4) return few;
    return many;
  }
  const pl = (n, one, few, many) => N(n) + ' ' + plural(n, one, few, many);
  // «1 % числа равен…», но «5 % числа равны…»
  const equalsFor = p => plural(p, 'равен', 'равны', 'равны');
  const M = s => '<span class="m">' + s + '</span>';   // строка вычисления (моноширинно не надо — просто не рвётся)

  /* ── вспомогательное для заданий ── */
  function field(id, label, value, opts){
    return Object.assign({ id, label, type: 'num', value: String(value) }, opts || {});
  }
  function ans(label, value, unit, opts){
    return field('a', label || 'Ответ:', value, Object.assign(unit ? { unit } : {}, opts || {}));
  }
  // «33 1/3» — у такого эталона показываем смешанное число, а записать можно
  // и так, и дробью 100/3
  function exact(num, den){ const g = gcd(num, den); return { value: (num / g) + '/' + (den / g), show: MIX(num, den), exactFrac: true }; }

  /* ═════════════ группы — для раскладки плиток ═════════════ */
  const GROUPS = [
    { id: 'base',   title: 'Перевод и доли',          blocks: 'Блоки 1–2', color: '#2E7DE0' },
    { id: 'three',  title: 'Три главные задачи',      blocks: 'Блоки 3–6', color: '#7B5CE0' },
    { id: 'change', title: 'Увеличение и уменьшение', blocks: 'Блок 7',    color: '#E0822E' },
    { id: 'cmp',    title: 'Сравнение процентов',     blocks: 'Блок 8',    color: '#1E9E8C' },
    { id: 'parts',  title: 'Части и диаграммы',       blocks: 'Блоки 9–10', color: '#D0457A' },
    { id: 'mix',    title: 'Растворы и смеси',        blocks: 'Блок 11',   color: '#2E9FD0' },
    { id: 'money',  title: 'Банк и налог',            blocks: 'Блок 12',   color: '#3E9A4E' },
    { id: 'hard',   title: 'Повышенной сложности',    blocks: 'Блок 13',   color: '#C24A3A' },
  ];

  const PROTOS = [];
  function proto(def){ PROTOS.push(def); }

  /* ═════════════════════════ БЛОК 1 ═════════════════════════ */

  // 1. Проценты → десятичная дробь
  proto({
    id: 'pct-dec', group: 'base', block: 1, title: 'Проценты → десятичная дробь',
    example: '37' + NB + '% = 0,37', art: 'decshift',
    gen(lvl){
      let p, ctx = '';
      if (lvl === 1) p = chance(0.15) ? 100 : (chance(0.3) ? ri(1, 9) : ri(11, 99));
      else if (lvl === 2) p = pick([3.5, 12.5, 150, 0.5, 250, 108, 2.5, 7.5, 120, 175, 4.8, 99.9, 1.5, 300]);
      else {
        const c = pick([
          () => { const f = pick([1.5, 2.5, 3.2, 3.5, 6]); return [f, 'В молоке ' + P(f) + ' жира. Какую часть молока составляет жир? Запиши десятичной дробью.']; },
          () => { const f = pick([0.4, 0.05, 0.25, 0.8, 0.03]); return [f, 'Запиши десятичной дробью: ' + b(P(f)) + '. Осторожно: процентов меньше одного.']; },
          () => { const f = pick([205, 1000, 110, 1250, 400]); return [f, 'Население посёлка составляет ' + P(f) + ' от прежнего. Запиши это число процентов десятичной дробью.']; },
          () => { const f = pick([37.5, 62.5, 87.5, 12.25, 0.75]); return [f, 'Запиши десятичной дробью: ' + b(P(f)) + '.']; },
        ])();
        p = c[0]; ctx = c[1];
      }
      const v = clean(p / 100);
      return {
        meta: { p },
        text: ctx || 'Запиши десятичной дробью: ' + b(P(p)) + '.',
        fields: [field('a', P(p) + ' =', V(v), { type: 'dec' })],
        steps: [
          'Процент — это одна сотая: ' + M('1' + NB + '% = ' + F(1, 100) + ' = 0,01') + '.',
          'Убираем знак % и делим на 100 — запятая сдвигается на два знака влево: ' + M(N(p) + ' : 100 = ' + N(v)) + '.',
        ],
        answer: P(p) + ' = ' + N(v),
      };
    },
  });

  // 2. Проценты → обыкновенная дробь
  proto({
    id: 'pct-frac', group: 'base', block: 1, title: 'Проценты → обыкновенная дробь',
    example: '40' + NB + '% = ' + F(2, 5), art: 'fracmorph',
    gen(lvl){
      let p, ctx = '';
      if (lvl === 1) p = pick([50, 25, 20, 40, 75, 10, 5, 60, 80, 30, 70, 90, 4, 2]);
      else if (lvl === 2) p = pick([12, 35, 45, 64, 15, 8, 36, 48, 84, 65, 55, 28, 24, 16, 44, 52, 68, 72, 76, 88, 96, 85, 95, 6, 14, 120, 125, 150, 180, 250]);
      else {
        p = pick([2.5, 12.5, 37.5, 0.5, 62.5, 7.5, 1.5, 87.5, 22.5, 0.2]);
        ctx = pick([
          'Скидка составляет ' + P(p) + ' цены. Какую часть цены составляет скидка? Запиши несократимой дробью.',
          'Запиши несократимой обыкновенной дробью: ' + b(P(p)) + '.',
        ]);
      }
      // p может быть дробным: 12,5 % = 125/1000
      const k = decPlaces(p), scale = Math.pow(10, k);
      const num = Math.round(p * scale), den = 100 * scale;
      const g = gcd(num, den);
      const steps = ['Записываем число процентов в числитель, 100 — в знаменатель: ' + M(P(p) + ' = ' + F(N(p), 100)) + '.'];
      if (k) steps.push('В числителе десятичная дробь — умножаем числитель и знаменатель на ' + N(scale) + ': ' + M(F(N(p), 100) + ' = ' + F(N(num), N(den))) + '.');
      steps.push(g > 1 ? 'Сокращаем на ' + N(g) + ': ' + M(F(N(num), N(den)) + ' = ' + FR(num, den)) + '.' : 'Дробь уже несократима.');
      if (num / g > den / g) steps.push('Дробь неправильная — можно выделить целую часть: ' + M(FR(num, den) + ' = ' + MIX(num, den)) + '.');
      return {
        meta: { p },
        text: ctx || 'Запиши несократимой обыкновенной дробью: ' + b(P(p)) + '.',
        fields: [field('a', P(p) + ' =', (num / g) + '/' + (den / g), { type: 'frac', show: FR(num, den) })],
        steps,
        answer: P(p) + ' = ' + FR(num, den),
      };
    },
  });

  // 3. Дробь → проценты
  proto({
    id: 'frac-pct', group: 'base', block: 1, title: 'Дробь → проценты',
    example: F(1, 4) + ' = 25' + NB + '%', art: 'ring',
    gen(lvl){
      // [числитель, знаменатель] или десятичная дробь
      let src, ctx = '';
      if (lvl === 1) src = chance(0.5)
        ? { d: pick([0.17, 0.8, 0.05, 0.3, 0.45, 0.09, 0.6, 0.73, 0.02, 0.5]) }
        : { n: pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10], [1, 20]]) };
      else if (lvl === 2) src = chance(0.35)
        ? { d: pick([1.25, 0.035, 1.5, 2, 0.125, 0.005, 3.2]) }
        : { n: pick([[7, 20], [9, 25], [1, 8], [3, 8], [5, 8], [7, 8], [13, 50], [3, 2], [5, 4], [11, 20], [17, 25], [3, 40]]) };
      else {
        const pair = pick([[1, 3], [2, 3], [1, 6], [5, 6], [7, 40], [11, 8], [3, 5], [9, 20], [1, 12]]);
        src = { n: pair };
        ctx = pick([
          'Мальчики составляют ' + F(pair[0], pair[1]) + ' класса. Сколько это процентов?',
          'Вырази в процентах: ' + F(pair[0], pair[1]) + '. Если деление не заканчивается, запиши процент смешанным числом.',
          'Турист прошёл ' + F(pair[0], pair[1]) + ' маршрута. Сколько процентов маршрута он прошёл?',
        ]);
      }
      if (src.d !== undefined){
        const v = clean(src.d * 100);
        return {
          meta: { num: src.d, den: 1 },
          text: 'Вырази в процентах: ' + b(N(src.d)) + '.',
          fields: [ans(N(src.d) + ' =', V(v), '%')],
          steps: ['Чтобы перевести дробь в проценты, умножаем её на 100 и ставим знак %: запятая сдвигается на два знака вправо.',
                  M(N(src.d) + ' · 100 = ' + N(v)) + ', то есть ' + M(N(src.d) + ' = ' + P(v)) + '.'],
          answer: N(src.d) + ' = ' + P(v),
        };
      }
      const [n, d] = src.n;
      const exactP = n * 100 / d;
      const niceP = decPlaces(exactP) <= 3;
      const fld = niceP ? ans(F(n, d) + ' =', V(exactP), '%') : Object.assign(ans(F(n, d) + ' =', '', '%'), exact(n * 100, d));
      const steps = [];
      if (100 % d === 0) steps.push('Приводим дробь к знаменателю 100: ' + M(F(n, d) + ' = ' + F(n * 100 / d, 100) + ' = ' + P(exactP)) + '.');
      else if (niceP) steps.push('Делим числитель на знаменатель: ' + M(n + ' : ' + d + ' = ' + N(n / d)) + '.', 'Умножаем на 100: ' + M(N(n / d) + ' · 100 = ' + N(exactP)) + ', то есть ' + P(exactP) + '.');
      else steps.push('Умножаем дробь на 100 %: ' + M(F(n, d) + ' · 100' + NB + '% = ' + F(n * 100, d) + NB + '%') + '.',
                      'Выделяем целую часть: ' + M(F(n * 100, d) + ' = ' + MIX(n * 100, d)) + '. Десятичной дробью это число не записать, поэтому ответ — смешанным числом.');
      return {
        meta: { num: n, den: d },
        text: ctx || 'Вырази в процентах: ' + F(n, d) + '.',
        fields: [fld],
        steps,
        answer: F(n, d) + ' = ' + (niceP ? P(exactP) : MIX(n * 100, d) + NB + '%'),
      };
    },
  });

  /* ═════════════════════════ БЛОК 2 ═════════════════════════ */

  // 4. Какая часть фигуры закрашена (клетки и отрезок)
  proto({
    id: 'share-fig', group: 'base', block: 2, title: 'Какая часть фигуры закрашена',
    example: '37 клеток из 100 — это 37' + NB + '%', art: 'grid', size: 'w',
    gen(lvl){
      if (lvl === 3 && chance(0.4)){
        // отрезок: единица длины — не 100
        const L = pick([5, 8, 4, 20, 25, 40]);
        const k = ri(1, L - 1);
        const v = clean(k * 100 / L);
        return {
          meta: { part: k, whole: L },
          text: 'Длина отрезка ' + L + NB + 'см. Сколько процентов его длины составляют ' + k + NB + 'см?',
          fig: { kind: 'segment', L, k },
          fields: [ans('Ответ:', V(v), '%')],
          steps: ['Часть делим на целое и умножаем на 100 %: ' + M(F(k, L) + ' · 100' + NB + '% = ' + P(v)) + '.'],
          answer: P(v),
        };
      }
      const shapes = lvl === 1 ? [[10, 10]] : lvl === 2 ? [[4, 5], [5, 5], [5, 10], [2, 5], [2, 2], [4, 10]] : [[5, 8], [2, 4], [4, 8], [5, 4], [8, 5]];
      const [rows, cols] = pick(shapes);
      const total = rows * cols;
      const k = ri(Math.max(1, Math.round(total * 0.08)), total - Math.max(1, Math.round(total * 0.08)));
      const v = clean(k * 100 / total), rest = clean(100 - v);
      const askRest = lvl === 1 ? chance(0.5) : lvl === 3;
      const fields = [field('a', 'Закрашено:', V(v), { unit: '%' })];
      if (askRest) fields.push(field('b', 'Не закрашено:', V(rest), { unit: '%' }));
      const steps = [];
      if (total === 100) steps.push('Всего 100 клеток, значит одна клетка — это 1' + NB + '%. Закрашено ' + k + ' клеток — это ' + P(v) + '.');
      else steps.push('Всего ' + total + ' клеток, закрашено ' + k + '. Часть делим на целое: ' + M(F(k, total) + ' · 100' + NB + '% = ' + P(v)) + '.');
      if (askRest) steps.push('Вся фигура — 100' + NB + '%, поэтому не закрашено ' + M('100' + NB + '% − ' + P(v) + ' = ' + P(rest)) + '.');
      return {
        meta: { part: k, whole: total },
        text: (rows === cols ? 'Квадрат' : 'Прямоугольник') + ' разбит на ' + total + ' ' + plural(total, 'равную клетку', 'равные клетки', 'равных клеток') + ', закрашено ' + k + '. Сколько процентов фигуры закрашено?' + (askRest ? ' Сколько не закрашено?' : ''),
        fig: { kind: 'grid', rows, cols, k },
        fields, steps,
        answer: askRest ? 'закрашено ' + P(v) + ', не закрашено ' + P(rest) : P(v),
      };
    },
  });

  // 5. Доля величины (единицы измерения, выполнение плана)
  const UNIT_PAIRS = {
    1: [ // целое = 100 меньших единиц
      { whole: 'метра', part: 'см', k: 100 }, { whole: 'рубля', part: 'коп.', k: 100 }, { whole: 'центнера', part: 'кг', k: 100 },
    ],
    2: [
      { whole: 'килограмма', part: 'г', k: 1000, vals: [250, 500, 750, 125, 50, 200, 600, 20] },
      { whole: 'часа', part: 'мин', k: 60, vals: [15, 30, 45, 12, 6, 36, 48, 3, 24, 54] },
      { whole: 'суток', part: 'ч', k: 24, vals: [6, 12, 18, 3, 9, 21] },
      { whole: 'метра', part: 'дм', k: 10, vals: [1, 3, 7, 5, 9] },
      { whole: 'тонны', part: 'кг', k: 1000, vals: [250, 500, 750, 100, 50, 400] },
    ],
  };
  proto({
    id: 'share-units', group: 'base', block: 2, title: 'Сколько процентов величины',
    example: '15 мин — это 25' + NB + '% часа', art: 'clock',
    gen(lvl){
      if (lvl === 3){
        // выполнение плана
        const plan = pick([200, 250, 400, 500, 80, 120, 160, 300, 50]);
        const pct = tryGen(() => pick([115, 120, 125, 110, 130, 150, 80, 90, 75, 105, 112, 96]), p => isInt(plan * p / 100));
        const done = plan * pct / 100;
        const over = pct > 100;
        const thing = pick([['деталей', 'рабочий сделал'], ['кг яблок', 'фермер собрал'], ['страниц', 'Маша прочитала'], ['саженцев', 'посадили']]);
        const fields = [field('a', 'План выполнен на', V(pct), { unit: '%' })];
        if (over) fields.push(field('b', 'Перевыполнен на', V(pct - 100), { unit: '%' }));
        return {
          meta: { part: done, whole: plan },
          text: 'План — ' + plan + ' ' + thing[0] + ', ' + thing[1] + ' ' + done + '. Сколько процентов плана выполнено?' + (over ? ' На сколько процентов план перевыполнен?' : ''),
          fields,
          steps: ['Сделанное делим на план: ' + M(F(done, plan) + ' = ' + N(done / plan) + ' = ' + P(pct)) + '.']
            .concat(over ? ['Получилось больше 100' + NB + '% — план перевыполнен на ' + M(P(pct) + ' − 100' + NB + '% = ' + P(pct - 100)) + '.'] : []),
          answer: over ? P(pct) + ', перевыполнен на ' + P(pct - 100) : P(pct),
        };
      }
      const u = pick(UNIT_PAIRS[lvl]);
      const x = lvl === 1 ? (chance(0.3) ? 1 : ri(2, 95)) : pick(u.vals);
      const v = clean(x * 100 / u.k);
      const ONE = { 'метра': '1 м', 'рубля': '1 рубль', 'центнера': '1 ц', 'килограмма': '1 кг', 'часа': '1 ч', 'суток': '1 сутки', 'тонны': '1 т' };
      const steps = ['Переводим целое в те же единицы: ' + ONE[u.whole] + ' = ' + N(u.k) + ' ' + u.part + '.'];
      if (u.k === 100) steps.push('Значит, 1 ' + u.part + ' — это 1' + NB + '% целого, а ' + x + ' ' + u.part + ' — это ' + P(v) + '.');
      else steps.push('Часть делим на целое и умножаем на 100 %: ' + M(F(x, N(u.k)) + ' · 100' + NB + '% = ' + P(v)) + '.');
      return {
        meta: { part: x, whole: u.k },
        text: 'Сколько процентов ' + u.whole + ' ' + plural(x, 'составляет', 'составляют', 'составляют') + ' ' + x + ' ' + u.part + '?',
        fields: [ans('Ответ:', V(v), '%')],
        steps,
        answer: P(v),
      };
    },
  });

  /* ═════════════════════════ БЛОК 3 ═════════════════════════ */

  // 6. Процент от числа
  proto({
    id: 'of-num', group: 'three', block: 3, title: 'Процент от числа',
    example: '15' + NB + '% от 80 = 12', art: 'barpart', size: 'l',
    gen(lvl){
      if (lvl === 1){
        // устный счёт: делим на 2, 4, 5, 10, 100
        const kind = pick([[50, 2], [10, 10], [25, 4], [1, 100], [20, 5], [75, 4], [5, 20]]);
        const [p, div] = kind;
        const x = p === 1 ? ri(2, 60) * 100 : div * ri(3, 40);
        const r = clean(x * p / 100);
        const how = { 50: 'делим на 2', 10: 'делим на 10', 25: 'делим на 4', 1: 'делим на 100', 20: 'делим на 5', 75: 'делим на 4 и умножаем на 3', 5: 'берём половину от 10' + NB + '%' }[p];
        return {
          meta: { p, x },
          text: 'Найди устно: ' + b(P(p) + ' от ' + N(x)) + '.',
          fields: [ans(P(p) + ' от ' + N(x) + ' =', V(r))],
          steps: [P(p) + ' — ' + how + '.', M(p === 75 ? N(x) + ' : 4 · 3 = ' + N(x / 4) + ' · 3 = ' + N(r) : p === 5 ? '10' + NB + '% от ' + N(x) + ' = ' + N(x / 10) + ', половина — ' + N(r) : N(x) + ' : ' + div + ' = ' + N(r)) + '.'],
          answer: N(r),
        };
      }
      if (lvl === 2){
        const p = pick([15, 8, 35, 12, 45, 120, 2.5, 150, 64, 36, 18, 6, 125, 7.5, 32]);
        const x = tryGen(() => pick([ri(2, 50) * 10, ri(2, 20) * 20, ri(1, 16) * 25, ri(2, 9) * 100, ri(1, 12) * 40]),
          x => decPlaces(x * p / 100) <= 1 && x * p / 100 >= 1);
        const r = clean(x * p / 100), mult = clean(p / 100);
        return {
          meta: { p, x },
          text: 'Найди ' + b(P(p) + ' от ' + N(x)) + '.',
          fields: [ans(P(p) + ' от ' + N(x) + ' =', V(r))],
          steps: ['Записываем процент десятичной дробью: ' + M(P(p) + ' = ' + N(mult)) + '.',
                  'Умножаем число на эту дробь: ' + M(N(x) + ' · ' + N(mult) + ' = ' + N(r)) + '.'],
          answer: N(r),
        };
      }
      // В — текстовые задачи
      const t = ri(0, 3);
      if (t === 0){
        const n = pick([20, 25, 30, 40, 24, 32]);
        const p = tryGen(() => pick([20, 25, 40, 60, 75, 30, 45, 35, 80, 15]), p => isInt(n * p / 100));
        const r = n * p / 100;
        const what = pick(['занимаются спортом', 'ходят в кружок', 'получили «5»', 'живут рядом со школой']);
        return {
          meta: { p, x: n },
          text: 'В классе ' + pl(n, 'ученик', 'ученика', 'учеников') + ', ' + P(p) + ' из них ' + what + '. Сколько учеников ' + what + '?',
          fields: [ans('Ответ:', V(r))],
          steps: ['Известно целое (' + pl(n, 'ученик', 'ученика', 'учеников') + '), нужна часть — это задача на процент от числа.',
                  M(n + ' · ' + N(p / 100) + ' = ' + N(r)) + '.'],
          answer: pl(r, 'ученик', 'ученика', 'учеников'),
        };
      }
      if (t === 1){
        const pages = pick([240, 180, 200, 320, 160, 300, 120, 360]);
        const p = tryGen(() => pick([35, 25, 40, 15, 45, 60, 30, 65, 55]), p => isInt(pages * p / 100));
        const left = clean(pages * (100 - p) / 100);
        const who = pick(['Маша', 'Петя', 'Катя', 'Дима']);
        return {
          meta: { p: 100 - p, x: pages },
          text: 'В книге ' + pages + ' страниц. ' + who + ' прочитал' + (/[ая]$/.test(who) && who !== 'Дима' ? 'а' : '') + ' ' + P(p) + ' книги. Сколько страниц осталось прочитать?',
          fields: [ans('Ответ:', V(left))],
          steps: ['Осталось прочитать ' + M('100' + NB + '% − ' + P(p) + ' = ' + P(100 - p)) + ' книги.',
                  M(pages + ' · ' + N((100 - p) / 100) + ' = ' + N(left)) + '.'],
          answer: pl(left, 'страница', 'страницы', 'страниц'),
        };
      }
      if (t === 2){
        const price = pick([1800, 2400, 1200, 3600, 2000, 4500, 800, 1600, 3000]);
        const p = tryGen(() => pick([15, 20, 25, 10, 30, 35, 5, 40]), p => isInt(price * p / 100));
        const disc = price * p / 100, pay = price - disc;
        const item = pick(['Кофта', 'Куртка', 'Рюкзак', 'Кроссовки', 'Наушники']);
        return {
          meta: { p, x: price },
          text: item + ' стоит ' + RUB(price) + ', на неё скидка ' + P(p) + '. Сколько рублей составляет скидка? Сколько заплатит покупатель?',
          fields: [field('a', 'Скидка:', V(disc), { unit: '₽' }), field('b', 'Заплатит:', V(pay), { unit: '₽' })],
          steps: ['Скидка — ' + P(p) + ' от цены: ' + M(N(price) + ' · ' + N(p / 100) + ' = ' + RUB(disc)) + '.',
                  'Покупатель заплатит ' + M(N(price) + ' − ' + N(disc) + ' = ' + RUB(pay)) + '.'],
          answer: 'скидка ' + RUB(disc) + ', заплатит ' + RUB(pay),
        };
      }
      const mass = pick([360, 400, 250, 500, 200, 320, 600]);
      const p = tryGen(() => pick([45, 60, 35, 40, 55, 65, 30, 25]), p => isInt(mass * p / 100));
      const zinc = mass * (100 - p) / 100;
      return {
        meta: { p: 100 - p, x: mass },
        text: 'Масса сплава ' + mass + NB + 'г, медь составляет ' + P(p) + ', остальное — цинк. Сколько граммов цинка в сплаве?',
        fields: [ans('Ответ:', V(zinc), 'г')],
        steps: ['Цинк составляет ' + M('100' + NB + '% − ' + P(p) + ' = ' + P(100 - p)) + ' сплава.',
                M(mass + ' · ' + N((100 - p) / 100) + ' = ' + N(zinc)) + NB + 'г.'],
        answer: zinc + NB + 'г',
      };
    },
  });

  /* ═════════════════════════ БЛОК 4 ═════════════════════════ */

  // 7. Число по его проценту
  proto({
    id: 'num-by-pct', group: 'three', block: 4, title: 'Число по его проценту',
    example: '30' + NB + '% числа = 24 → число 80', art: 'barwhole',
    gen(lvl){
      if (lvl === 1 || lvl === 2){
        const ps = lvl === 1 ? [10, 50, 25, 1, 20, 5] : [30, 12, 45, 125, 35, 8, 15, 40, 60, 75, 150, 24];
        const p = pick(ps);
        const W = tryGen(() => lvl === 1 && p === 1 ? ri(1, 99) * 50 : ri(4, 60) * pick([5, 10, 20]),
          W => decPlaces(W * p / 100) <= (p === 1 ? 1 : 0) && W * p / 100 >= 1);
        const part = clean(W * p / 100);
        return {
          meta: { p, part },
          text: 'Найди число, если ' + b(P(p) + ' числа ' + equalsFor(p) + ' ' + N(part)) + '.',
          fields: [ans('Число =', V(W))],
          steps: ['Известна часть и её процент, нужно целое — делим часть на процент, записанный дробью.',
                  M(N(part) + ' : ' + N(p / 100) + ' = ' + N(W)) + '.',
                  'Проверка: ' + M(P(p) + ' от ' + N(W) + ' = ' + N(part)) + '.'],
          answer: N(W),
        };
      }
      const t = ri(0, 3);
      if (t === 0){
        const L = pick([30, 40, 25, 20, 45, 50, 60]);
        const p = tryGen(() => pick([60, 40, 75, 80, 30, 35, 45, 20]), p => isInt(L * p / 100));
        const d = L * p / 100;
        return {
          meta: { p, part: d },
          text: 'Турист прошёл ' + d + NB + 'км, это ' + P(p) + ' маршрута. Какова длина всего маршрута?',
          fields: [ans('Ответ:', V(L), 'км')],
          steps: [d + NB + 'км — это ' + P(p) + ' маршрута, весь маршрут — 100' + NB + '%.', M(d + ' : ' + N(p / 100) + ' = ' + L) + NB + 'км.'],
          answer: L + NB + 'км',
        };
      }
      if (t === 1){
        const price = pick([1200, 1500, 2000, 800, 2400, 3000, 1600, 4000]);
        const p = tryGen(() => pick([20, 25, 10, 15, 30, 40, 5]), p => isInt(price * p / 100));
        const paid = price * (100 - p) / 100;
        return {
          meta: { p: 100 - p, part: paid },
          text: 'Со скидкой ' + P(p) + ' за товар заплатили ' + RUB(paid) + '. Сколько стоил товар без скидки?',
          fields: [ans('Ответ:', V(price), '₽')],
          steps: ['Подвох: ' + RUB(paid) + ' — это не ' + P(p) + ', а ' + M('100' + NB + '% − ' + P(p) + ' = ' + P(100 - p)) + ' цены.',
                  M(N(paid) + ' : ' + N((100 - p) / 100) + ' = ' + N(price)) + NB + '₽.'],
          answer: RUB(price),
        };
      }
      if (t === 2){
        const all = pick([80, 60, 120, 40, 200, 150, 50]);
        const p = tryGen(() => pick([45, 35, 25, 15, 30, 55, 65, 12]), p => isInt(all * p / 100));
        const n = all * p / 100;
        const tree = pick([['яблоня', 'яблони', 'яблонь'], ['груша', 'груши', 'груш'], ['вишня', 'вишни', 'вишен'], ['слива', 'сливы', 'слив']]);
        return {
          meta: { p, part: n },
          text: 'В саду ' + pl(n, tree[0], tree[1], tree[2]) + ', это ' + P(p) + ' всех деревьев сада. Сколько всего деревьев в саду?',
          fields: [ans('Ответ:', V(all))],
          steps: [pl(n, tree[0], tree[1], tree[2]) + ' — это ' + P(p) + ', все деревья — 100' + NB + '%.', M(n + ' : ' + N(p / 100) + ' = ' + all) + '.'],
          answer: pl(all, 'дерево', 'дерева', 'деревьев'),
        };
      }
      const all = pick([20, 40, 25, 30, 50, 60]);
      const pLeft = tryGen(() => pick([30, 20, 40, 25, 60, 15, 35]), p => isInt(all * p / 100) && p < 100);
      const done = all * (100 - pLeft) / 100;
      return {
        meta: { p: 100 - pLeft, part: done },
        text: 'Ученик решил ' + pl(done, 'задачу', 'задачи', 'задач') + ', и ему осталось решить ' + P(pLeft) + ' всех задач. Сколько всего задач?',
        fields: [ans('Ответ:', V(all))],
        steps: ['Подвох: ' + pl(done, 'задача', 'задачи', 'задач') + ' — это решённые, их ' + M('100' + NB + '% − ' + P(pLeft) + ' = ' + P(100 - pLeft)) + '.',
                M(done + ' : ' + N((100 - pLeft) / 100) + ' = ' + all) + '.'],
        answer: pl(all, 'задача', 'задачи', 'задач'),
      };
    },
  });

  /* ═════════════════════════ БЛОК 5 ═════════════════════════ */

  // 8. Сколько процентов одно число составляет от другого
  proto({
    id: 'pct-of', group: 'three', block: 5, title: 'Сколько процентов составляет',
    example: '12 от 48 — это 25' + NB + '%', art: 'twobars',
    gen(lvl){
      if (lvl < 3){
        const ps = lvl === 1 ? [50, 25, 10, 7, 20, 75, 40, 5, 1, 30] : [30, 35, 125, 25, 15, 45, 12.5, 150, 64, 36, 62.5, 8, 120];
        const p = pick(ps);
        const [a, w] = tryGen(() => {
          const w = lvl === 1 ? pick([10, 12, 90, 100, 4, 20, 60, 80, 40, 200]) * (chance(0.5) ? 1 : ri(1, 3)) : pick([60, 120, 36, 4.8, 80, 40, 200, 16, 24, 250, 64]) * pick([1, 1, 2]);
          return [clean(w * p / 100), w];
        }, ([a]) => a > 0 && decPlaces(a) <= 1);
        return {
          meta: { part: a, whole: w },
          text: 'Сколько процентов составляет ' + b(N(a) + ' от ' + N(w)) + '?',
          fields: [ans('Ответ:', V(p), '%')],
          steps: ['Часть делим на целое и умножаем на 100 %.',
                  M(F(N(a), N(w)) + ' = ' + N(a / w) + ' = ' + P(p)) + '.'],
          answer: P(p),
        };
      }
      const t = ri(0, 2);
      if (t === 0){
        const all = pick([25, 20, 40, 50, 30, 60]);
        const k = tryGen(() => ri(Math.ceil(all / 2), all - 1), k => decPlaces(k * 100 / all) <= 1);
        const v = clean(k * 100 / all);
        return {
          meta: { part: k, whole: all },
          text: 'Из ' + pl(all, 'задачи', 'задач', 'задач') + ' ученик решил ' + k + '. Какой процент задач он решил?',
          fields: [ans('Ответ:', V(v), '%')],
          steps: [M(F(k, all) + ' · 100' + NB + '% = ' + P(v)) + '.'],
          answer: P(v),
        };
      }
      if (t === 1){
        const boys = pick([12, 10, 14, 8, 15, 9]);
        const girls = tryGen(() => ri(8, 20), g => g !== boys && decPlaces(g * 100 / (g + boys)) <= 1);
        const all = boys + girls, v = clean(girls * 100 / all);
        return {
          meta: { part: girls, whole: all },
          text: 'В классе ' + pl(boys, 'мальчик', 'мальчика', 'мальчиков') + ' и ' + pl(girls, 'девочка', 'девочки', 'девочек') + '. Сколько процентов класса составляют девочки?',
          fields: [ans('Ответ:', V(v), '%')],
          steps: ['Подвох: целое — весь класс, ' + M(boys + ' + ' + girls + ' = ' + all) + ', а не мальчики.',
                  M(F(girls, all) + ' · 100' + NB + '% = ' + P(v)) + '.'],
          answer: P(v),
        };
      }
      const w = pick([500, 400, 250, 80, 1200, 150]);
      const v = tryGen(() => pick([8, 12, 15, 24, 36, 45, 64, 72, 6, 18]), v => isInt(w * v / 100));
      const a = w * v / 100;
      const seeds = chance(0.5);
      const part = a, vv = clean(part * 100 / w);
      return {
        meta: { part, whole: w },
        text: seeds
          ? 'Посеяли ' + w + ' семян, взошло ' + (w - a) + '. Сколько процентов семян не взошло?'
          : 'В магазин привезли ' + w + NB + 'кг овощей, ' + a + NB + 'кг из них — картофель. Сколько процентов овощей составляет картофель?',
        fields: [ans('Ответ:', V(vv), '%')],
        steps: seeds
          ? ['Не взошло ' + M(w + ' − ' + (w - a) + ' = ' + a) + ' семян.', M(F(a, w) + ' · 100' + NB + '% = ' + P(vv)) + '.']
          : [M(F(a, w) + ' · 100' + NB + '% = ' + P(vv)) + '.'],
        answer: P(vv),
      };
    },
  });

  // 9. На сколько процентов изменилась величина
  const RATIOS = [[5, 4], [3, 2], [6, 5], [2, 1], [8, 5], [5, 2], [4, 3], [5, 3], [3, 1], [10, 9], [9, 8]];
  proto({
    id: 'pct-change', group: 'three', block: 5, title: 'На сколько процентов изменилась',
    example: 'было 500, стало 600 → +20' + NB + '%', art: 'pricetag',
    gen(lvl){
      if (lvl < 3){
        const up = chance(0.5);
        const ps = lvl === 1 ? (up ? [10, 20, 25, 50, 100] : [10, 20, 25, 50, 40]) : (up ? [15, 12, 35, 60, 150, 8, 45, 120] : [15, 12, 35, 8, 45, 6, 65, 30]);
        const p = pick(ps);
        const was = tryGen(() => lvl === 1 ? pick([100, 200, 500, 1000, 400, 50, 300]) : pick([800, 40, 250, 1200, 300, 600, 150, 2000, 360]),
          w => isInt(w * p / 100));
        const now = up ? was + was * p / 100 : was - was * p / 100;
        const d = Math.abs(now - was);
        // [начало, «стала», единица, «она выросла», «она уменьшилась»] — род
        // у каждого подлежащего свой, поэтому формы глагола лежат рядом
        const thing = pick([
          ['Цена была', 'стала', '₽', 'повысилась цена', 'понизилась цена'],
          ['Население посёлка было', 'стало', 'человек', 'выросло население', 'уменьшилось население'],
          ['Книг в библиотеке было', 'стало', '', 'выросло число книг', 'уменьшилось число книг'],
        ]);
        const unit = thing[2] === '₽' ? NB + '₽' : (thing[2] ? ' ' + thing[2] : '');
        return {
          meta: { was, now },
          text: thing[0] + ' ' + N(was) + unit + ', ' + thing[1] + ' ' + N(now) + unit + '. На сколько процентов ' + (up ? thing[3] : thing[4]) + '?',
          fields: [ans('На', V(p), '%')],
          steps: ['Изменение: ' + M(N(Math.max(was, now)) + ' − ' + N(Math.min(was, now)) + ' = ' + N(d)) + '.',
                  'Делим изменение на то, что было СНАЧАЛА: ' + M(F(N(d), N(was)) + ' · 100' + NB + '% = ' + P(p)) + '.'],
          answer: (up ? 'выросла на ' : 'уменьшилась на ') + P(p),
        };
      }
      // В — «на сколько больше» и «на сколько меньше» — разные проценты
      const [ra, rb] = pick(RATIOS);
      const k = tryGen(() => ri(2, 12), k => ra * k <= 60 && ra * k >= 6);
      const A = ra * k, Bv = rb * k;
      const askMore = chance(0.5);
      const pair = pick([['девочек', 'мальчиков'], ['яблонь', 'груш'], ['красных шаров', 'синих шаров'], ['легковых машин', 'грузовых машин']]);
      const num = (A - Bv) * 100, den = askMore ? Bv : A;
      const f = decPlaces(num / den) <= 2 ? ans('На', V(num / den), '%') : Object.assign(ans('На', '', '%'), exact(num, den));
      return {
        meta: { was: askMore ? Bv : A, now: askMore ? A : Bv },
        text: pair[0].charAt(0).toUpperCase() + pair[0].slice(1) + ' — ' + A + ', ' + pair[1] + ' — ' + Bv + '. ' +
          (askMore ? 'На сколько процентов ' + pair[0] + ' больше, чем ' + pair[1] + '?' : 'На сколько процентов ' + pair[1] + ' меньше, чем ' + pair[0] + '?'),
        fields: [f],
        steps: ['Разница: ' + M(A + ' − ' + Bv + ' = ' + (A - Bv)) + '.',
                'За 100' + NB + '% берём то, С ЧЕМ сравниваем (после слова «чем»): ' + (askMore ? pair[1] + ' — ' + Bv : pair[0] + ' — ' + A) + '.',
                M(F(A - Bv, den) + ' · 100' + NB + '% = ' + (f.exactFrac ? MIX(num, den) + NB + '%' : P(num / den))) + '.',
                'Обрати внимание: «на сколько больше» и «на сколько меньше» дают разные проценты — меняется то, что принято за 100' + NB + '%.'],
        answer: 'на ' + (f.exactFrac ? MIX(num, den) + NB + '%' : P(num / den)),
      };
    },
  });

  /* ═════════════════════════ БЛОК 6 ═════════════════════════ */

  // 10. Решение с помощью пропорции
  function propRows(a1, b1, a2, b2){
    // две строки «величина — проценты» столбиком, как в тетради
    return '<span class="prop"><span>' + a1 + ' — ' + b1 + '</span><span>' + a2 + ' — ' + b2 + '</span></span>';
  }
  proto({
    id: 'proportion', group: 'three', block: 6, title: 'Решение с помощью пропорции',
    example: 'x — 100' + NB + '%, 36 — 24' + NB + '%', art: 'balance',
    gen(lvl){
      if (lvl === 1){
        const t = ri(0, 2);
        const p = pick([24, 18, 75, 35, 40, 12, 60, 45, 16]);
        const W = tryGen(() => ri(3, 40) * pick([5, 10, 25]), W => isInt(W * p / 100) && W * p / 100 >= 2);
        const part = W * p / 100;
        if (t === 0) return {
          meta: { kind: 'whole', p, part },
          text: 'Составь пропорцию и реши: ' + b(P(p) + ' числа равны ' + part) + '. Найди число.',
          fields: [ans('Число =', V(W))],
          steps: ['Целое (неизвестное число x) ставим напротив 100' + NB + '%: ' + propRows('x', '100' + NB + '%', part, P(p)),
                  'Пропорция: ' + M(F('x', part) + ' = ' + F(100, p)) + ', отсюда ' + M('x = ' + F(part + ' · 100', p) + ' = ' + N(W)) + '.'],
          answer: N(W),
        };
        if (t === 1) return {
          meta: { kind: 'part', p, x: W },
          text: 'Составь пропорцию и реши: найди ' + b(P(p) + ' от ' + W) + '.',
          fields: [ans(P(p) + ' от ' + W + ' =', V(part))],
          steps: ['Целое ставим напротив 100' + NB + '%: ' + propRows(W, '100' + NB + '%', 'x', P(p)),
                  M('x = ' + F(W + ' · ' + p, 100) + ' = ' + N(part)) + '.'],
          answer: N(part),
        };
        return {
          meta: { kind: 'pct', part, whole: W },
          text: 'Составь пропорцию и реши: сколько процентов составляет ' + b(part + ' от ' + W) + '?',
          fields: [ans('Ответ:', V(p), '%')],
          steps: ['Целое ставим напротив 100' + NB + '%: ' + propRows(W, '100' + NB + '%', part, 'x' + NB + '%'),
                  M('x = ' + F(part + ' · 100', W) + ' = ' + N(p)) + ', то есть ' + P(p) + '.'],
          answer: P(p),
        };
      }
      // Б и В: прямая пропорциональность и процентное содержание
      const src = lvl === 2
        ? pick([
          { a: 'руды', b: 'металла', in: 'в руде', A: pick([300, 200, 400, 500]), p: pick([15, 12, 20, 8, 25]), X: pick([1200, 800, 1500, 2000, 600]) },
          { a: 'молока', b: 'сливок', in: 'в молоке', A: pick([200, 100, 50, 400]), p: pick([20, 25, 15, 12]), X: pick([500, 350, 150, 600]) },
        ])
        : pick([
          { a: 'морской воды', b: 'соли', in: 'в морской воде', A: pick([40, 20, 50, 80]), p: pick([3.5, 2.5, 4, 3]), X: 100, verb: 'содержится' },
          { a: 'зерна', b: 'муки', in: 'в зерне (выход муки)', A: pick([50, 20, 25, 40]), p: pick([78, 80, 72, 76]), X: pick([100, 150, 200]) },
        ]);
      const partA = clean(src.A * src.p / 100), partX = clean(src.X * src.p / 100);
      return {
        meta: { kind: 'mix', A: src.A, partA, X: src.X },
        text: (src.verb
          ? 'В ' + N(src.A) + NB + 'кг ' + src.a + ' содержится ' + N(partA) + NB + 'кг ' + src.b + '. Сколько ' + src.b + ' в ' + N(src.X) + NB + 'кг такой воды?'
          : 'Из ' + N(src.A) + NB + 'кг ' + src.a + ' получают ' + N(partA) + NB + 'кг ' + src.b + '. Сколько ' + src.b + ' получат из ' + N(src.X) + NB + 'кг ' + src.a + '?') +
          ' Каково процентное содержание ' + src.b + ' ' + src.in + '?',
        fields: [field('a', src.verb ? 'Соли:' : 'Получат:', V(partX), { unit: 'кг' }), field('b', 'Содержание:', V(src.p), { unit: '%' })],
        steps: ['Во сколько раз больше ' + src.a + ', во столько же раз больше ' + src.b + ' — это прямая пропорциональность: ' +
                  propRows(N(src.A) + NB + 'кг', N(partA) + NB + 'кг', N(src.X) + NB + 'кг', 'x' + NB + 'кг'),
                M('x = ' + F(N(src.X) + ' · ' + N(partA), N(src.A)) + ' = ' + N(partX)) + NB + 'кг.',
                'Процентное содержание: ' + propRows(N(src.A) + NB + 'кг', '100' + NB + '%', N(partA) + NB + 'кг', 'x' + NB + '%') +
                  M('x = ' + F(N(partA) + ' · 100', N(src.A)) + ' = ' + N(src.p)) + ', то есть ' + P(src.p) + '.'],
        answer: N(partX) + NB + 'кг; ' + P(src.p),
      };
    },
  });

  /* ═════════════════════════ БЛОК 7 ═════════════════════════ */

  // 11. Увеличить / уменьшить на процент
  proto({
    id: 'incdec', group: 'change', block: 7, title: 'Увеличить или уменьшить на процент',
    example: '400 + 15' + NB + '% = 460', art: 'grow',
    gen(lvl){
      let up = chance(0.5), p, x, ctx = '';
      if (lvl === 1){
        p = pick(up ? [10, 25, 50, 20, 100] : [50, 20, 10, 25, 30]);
        x = tryGen(() => pick([200, 300, 80, 600, 40, 120, 500, 160, 1000]), x => isInt(x * p / 100));
      } else if (lvl === 2){
        p = pick(up ? [12, 150, 8, 35, 120, 7.5] : [8, 12.5, 15, 35, 6, 45]);
        x = tryGen(() => pick([450, 1250, 64, 72, 200, 480, 360, 800, 96, 1200, 640]), x => isInt(x * p / 100) || decPlaces(x * p / 100) <= 1);
      } else {
        const c = pick([
          () => ({ up: true, p: pick([15, 10, 20, 8, 12]), x: pick([40000, 35000, 50000, 60000, 45000]), t: (x, p) => 'Зарплата ' + RUB(x) + ' повысилась на ' + P(p) + '. Какой стала зарплата?', unit: '₽' }),
          () => ({ up: false, p: pick([15, 20, 25, 30, 12]), x: pick([2400, 3600, 1800, 4000, 6000]), t: (x, p) => 'Цена товара ' + RUB(x) + '. В распродажу её снизили на ' + P(p) + '. Сколько стоит товар теперь?', unit: '₽' }),
          () => ({ up: true, p: pick([4, 5, 8, 2, 6]), x: pick([2500, 5000, 1500, 3000, 12500]), t: (x, p) => 'В посёлке жило ' + N(x) + ' человек. За год население выросло на ' + P(p) + '. Сколько человек стало?', unit: 'чел.' }),
          () => ({ up: false, p: pick([10, 20, 15, 25]), x: pick([80, 60, 120, 40]), t: (x, p) => 'Велосипедист ехал со скоростью ' + x + NB + 'км/ч, потом снизил скорость на ' + P(p) + '. С какой скоростью он поехал?', unit: 'км/ч' }),
        ])();
        up = c.up; p = c.p; x = c.x;
        ctx = c.t(x, p);
        const k = clean((up ? 100 + p : 100 - p) / 100), r = clean(x * k);
        return {
          meta: { x, p: up ? p : -p },
          text: ctx,
          fields: [ans('Ответ:', V(r), c.unit)],
          steps: [(up ? 'Увеличить на ' : 'Уменьшить на ') + P(p) + ' — значит найти ' + M((up ? '100 + ' : '100 − ') + N(p) + ' = ' + P(up ? 100 + p : 100 - p)) + ' от числа.',
                  M(N(x) + ' · ' + N(k) + ' = ' + N(r)) + '.'],
          answer: N(r) + ' ' + c.unit.replace('₽', '₽'),
        };
      }
      const k = clean((up ? 100 + p : 100 - p) / 100), r = clean(x * k);
      return {
        meta: { x, p: up ? p : -p },
        text: (up ? 'Увеличь ' : 'Уменьши ') + b(N(x)) + ' на ' + b(P(p)) + '.',
        fields: [ans('Ответ:', V(r))],
        steps: [(up ? 'Увеличить на ' : 'Уменьшить на ') + P(p) + ' — значит найти ' + P(up ? 100 + p : 100 - p) + ' от числа, то есть умножить на ' + N(k) + '.',
                M(N(x) + ' · ' + N(k) + ' = ' + N(r)) + '.'],
        answer: N(r),
      };
    },
  });

  // 12. Найти, что было (обратная задача)
  const INVERSE_UP = [[25, 20, 1], [100, 50, 1], [50, 100, 3], [20, 100, 6], [60, 37.5, 1], [150, 60, 1], [300, 75, 1], [400, 80, 1]];
  proto({
    id: 'reverse', group: 'change', block: 7, title: 'Найти, что было до изменения',
    example: '+25' + NB + '% дало 150 → было 120', art: 'rewind',
    gen(lvl){
      if (lvl < 3){
        const up = chance(0.5);
        const p = lvl === 1 ? pick(up ? [25, 10, 20, 50, 100] : [20, 25, 50, 10]) : pick(up ? [15, 12, 30, 5, 150] : [20, 15, 30, 12, 40]);
        const x = tryGen(() => ri(2, 60) * pick([10, 20, 4, 5]), x => isInt(x * p / 100));
        const r = clean(x * (up ? 100 + p : 100 - p) / 100);
        const k = clean((up ? 100 + p : 100 - p) / 100);
        const money = lvl === 2 && chance(0.6);
        const text = money
          ? (up ? 'После повышения цены на ' + P(p) + ' товар стал стоить ' + RUB(r) + '. Сколько он стоил до повышения?'
                : 'Со скидкой ' + P(p) + ' за товар заплатили ' + RUB(r) + '. Сколько стоил товар без скидки?')
          : 'Число ' + (up ? 'увеличили' : 'уменьшили') + ' на ' + P(p) + ' и получили ' + N(r) + '. Какое число было?';
        return {
          meta: { r, p: up ? p : -p },
          text,
          fields: [ans('Ответ:', V(x), money ? '₽' : '')],
          steps: [N(r) + ' — это ' + M((up ? '100 + ' : '100 − ') + N(p) + ' = ' + P(up ? 100 + p : 100 - p)) + ' исходного числа.',
                  'Число по его проценту: ' + M(N(r) + ' : ' + N(k) + ' = ' + N(x)) + '.',
                  'Проверка: ' + M(N(x) + ' · ' + N(k) + ' = ' + N(r)) + '.'],
          answer: N(x) + (money ? NB + '₽' : ''),
        };
      }
      // В: на сколько процентов изменить обратно
      const up = chance(0.5);
      let p, back, num, den;
      if (up){ const row = pick(INVERSE_UP); p = row[0]; num = p * 100; den = 100 + p; }
      else { p = pick([20, 50, 60, 75, 80, 37.5, 25]); num = p * 100; den = 100 - p; }
      const scale = Math.pow(10, decPlaces(p));
      num *= scale; den *= scale;
      back = num / den;
      const f = decPlaces(back) <= 2 ? ans('На', V(back), '%') : Object.assign(ans('На', '', '%'), exact(num, den));
      const backStr = f.exactFrac ? MIX(num, den) + NB + '%' : P(back);
      return {
        meta: { p: up ? p : -p },
        text: 'Число ' + (up ? 'увеличили' : 'уменьшили') + ' на ' + P(p) + '. На сколько процентов теперь нужно ' + (up ? 'уменьшить' : 'увеличить') + ' результат, чтобы получить исходное число?',
        fields: [f],
        steps: ['Возьмём исходное число за 100. После изменения стало ' + N(up ? 100 + p : 100 - p) + '.',
                'Чтобы вернуться к 100, нужно ' + (up ? 'убрать ' : 'добавить ') + N(p) + ', а за 100' + NB + '% теперь берём ' + N(up ? 100 + p : 100 - p) + ' — то, что есть сейчас.',
                M(F(N(p), N(up ? 100 + p : 100 - p)) + ' · 100' + NB + '% = ' + backStr) + '.',
                'Подвох: ответ не ' + P(p) + ' — второй процент считается от другого числа.'],
        answer: 'на ' + backStr,
      };
    },
  });

  // 13. Несколько изменений подряд
  proto({
    id: 'chain', group: 'change', block: 7, title: 'Несколько изменений подряд',
    example: '+10' + NB + '%, затем −10' + NB + '% → −1' + NB + '%', art: 'stairs', size: 'w',
    gen(lvl){
      if (lvl === 1){
        const p1 = pick([10, 20, 25, 50]), p2 = pick([10, 20, 50, 25]);
        const up1 = true, up2 = chance(0.5);
        const x = tryGen(() => pick([2000, 1000, 4000, 800, 24000, 1200, 1600, 5000]), x => isInt(x * (100 + p1) / 100 * (up2 ? 100 + p2 : 100 - p2) / 100));
        const m1 = clean(x * (100 + p1) / 100), m2 = clean(m1 * (up2 ? 100 + p2 : 100 - p2) / 100);
        return {
          meta: { x, ch: [p1, up2 ? p2 : -p2] },
          text: 'Товар стоил ' + RUB(x) + '. Сначала цену повысили на ' + P(p1) + ', потом ' + (up2 ? 'ещё повысили' : 'понизили') + ' на ' + P(p2) + '. Сколько стоит товар теперь?',
          fields: [ans('Ответ:', V(m2), '₽')],
          steps: ['После первого изменения: ' + M(N(x) + ' · ' + N((100 + p1) / 100) + ' = ' + N(m1)) + NB + '₽.',
                  'Второй процент считаем уже от новой цены: ' + M(N(m1) + ' · ' + N((up2 ? 100 + p2 : 100 - p2) / 100) + ' = ' + N(m2)) + NB + '₽.'],
          answer: RUB(m2),
        };
      }
      if (lvl === 2){
        const p1 = pick([10, 20, 30, 50, 25]), p2 = pick([10, 20, 30, 50, 25]);
        const up2 = chance(0.5);
        const k = clean((100 + p1) / 100 * (up2 ? 100 + p2 : 100 - p2) / 100);
        if (Math.abs(k - 1) < 1e-9) return this.gen(2);
        const total = clean((k - 1) * 100);
        const grew = total > 0;
        return {
          meta: { ch: [p1, up2 ? p2 : -p2] },
          text: 'Цену сначала повысили на ' + P(p1) + ', а затем ' + (up2 ? 'ещё повысили' : 'понизили') + ' на ' + P(p2) + '. На сколько процентов ' + (grew ? 'повысилась' : 'понизилась') + ' цена по сравнению с первоначальной?',
          fields: [ans('На', V(Math.abs(total)), '%')],
          steps: ['Проценты складывать нельзя: второй процент считается от НОВОЙ цены. Удобно перемножить множители.',
                  M(N((100 + p1) / 100) + ' · ' + N((up2 ? 100 + p2 : 100 - p2) / 100) + ' = ' + N(k)) + ' — новая цена составляет ' + P(k * 100) + ' старой.',
                  grew ? 'Цена повысилась на ' + M(P(k * 100) + ' − 100' + NB + '% = ' + P(total)) + '.' : 'Цена понизилась на ' + M('100' + NB + '% − ' + P(k * 100) + ' = ' + P(-total)) + '.'],
          answer: (grew ? 'повысилась на ' : 'понизилась на ') + P(Math.abs(total)),
        };
      }
      // В: две скидки подряд / три изменения
      if (chance(0.5)){
        const d1 = pick([20, 10, 30, 25, 50]), d2 = pick([10, 20, 5, 40]);
        const k = clean((100 - d1) / 100 * (100 - d2) / 100), total = clean(100 - k * 100);
        return {
          meta: { ch: [-d1, -d2] },
          text: 'В магазине сначала сделали скидку ' + P(d1) + ', а потом ещё ' + P(d2) + ' от новой цены. Какова общая скидка в процентах?',
          fields: [ans('Скидка', V(total), '%')],
          steps: ['Подвох: это не ' + P(d1 + d2) + ' — вторая скидка берётся от уже сниженной цены.',
                  M(N((100 - d1) / 100) + ' · ' + N((100 - d2) / 100) + ' = ' + N(k)) + ' — платим ' + P(k * 100) + ' цены.',
                  'Скидка: ' + M('100' + NB + '% − ' + P(k * 100) + ' = ' + P(total)) + '.'],
          answer: P(total),
        };
      }
      const x = pick([10000, 20000, 5000, 8000, 40000]);
      const ch = [pick([10, 20, 50]), -pick([10, 20, 50]), pick([10, 25, 50])];
      let cur = x; const lines = [];
      ch.forEach(c => { const n = clean(cur * (100 + c) / 100); lines.push(M(N(cur) + ' · ' + N((100 + c) / 100) + ' = ' + N(n))); cur = n; });
      if (!isInt(cur)) return this.gen(3);
      return {
        meta: { x, ch },
        text: 'Акции стоили ' + RUB(x) + '. В понедельник они подорожали на ' + P(ch[0]) + ', во вторник подешевели на ' + P(-ch[1]) + ', в среду подорожали на ' + P(ch[2]) + '. Сколько стоят акции теперь?',
        fields: [ans('Ответ:', V(cur), '₽')],
        steps: ['Каждый процент считаем от цены предыдущего дня.'].concat(lines.map((l, i) => ['Понедельник', 'Вторник', 'Среда'][i] + ': ' + l + '.')),
        answer: RUB(cur),
      };
    },
  });

  /* ═════════════════════════ БЛОК 8 ═════════════════════════ */

  // 14. Удобный счёт: a % от b = b % от a
  proto({
    id: 'swap', group: 'cmp', block: 8, title: 'Удобный счёт: переставь числа',
    example: '8' + NB + '% от 25 = 25' + NB + '% от 8 = 2', art: 'swap',
    gen(lvl){
      if (lvl < 3){
        const conv = lvl === 1 ? [[25, 4], [50, 2], [20, 5]] : [[75, 0], [125, 0], [20, 5], [40, 0], [60, 0]];
        const [nice] = pick(conv);
        const a = tryGen(() => ri(3, 96), a => a !== nice && (lvl === 1 ? isInt(a * nice / 100) : decPlaces(a * nice / 100) <= 1) && a % 10 !== 0);
        const r = clean(a * nice / 100);
        return {
          meta: { a, b: nice },
          text: 'Вычисли удобным способом: ' + b(P(a) + ' от ' + nice) + '.',
          fields: [ans('Ответ:', V(r))],
          steps: ['Переставляем числа: ' + M(P(a) + ' от ' + nice + ' = ' + P(nice) + ' от ' + a) + ' — оба равны ' + M(F(a + ' · ' + nice, 100)) + '.',
                  P(nice) + ' от ' + a + ' — ' + ({ 25: 'делим на 4', 50: 'делим на 2', 20: 'делим на 5', 10: 'делим на 10', 75: 'делим на 4 и умножаем на 3', 125: 'умножаем на 1,25', 40: 'умножаем на 0,4', 60: 'умножаем на 0,6' })[nice] + ': ' + M(N(r)) + '.'],
          answer: N(r),
        };
      }
      // В: сумма и разность «перевёртышей»
      const nice = pick([25, 50, 20]);
      const a = tryGen(() => ri(3, 60), a => isInt(a * nice / 100) && a !== nice);
      const r = clean(a * nice / 100);
      const minus = chance(0.4);
      return {
        meta: { a, b: nice, op: minus ? '-' : '+' },
        text: 'Вычисли: ' + b(P(a) + ' от ' + nice + (minus ? ' − ' : ' + ') + P(nice) + ' от ' + a) + '.',
        fields: [ans('Ответ:', V(minus ? 0 : 2 * r))],
        steps: ['Оба слагаемых равны: ' + M(P(a) + ' от ' + nice + ' = ' + P(nice) + ' от ' + a + ' = ' + N(r)) + '.',
                minus ? 'Разность двух равных чисел — ' + M('0') + '. Считать вообще ничего не нужно!' : M(N(r) + ' + ' + N(r) + ' = ' + N(2 * r)) + '.'],
        answer: N(minus ? 0 : 2 * r),
      };
    },
  });

  // 15. Сравни проценты — выбор знака
  const SIGNS = ['&gt;', '=', '&lt;'];
  proto({
    id: 'compare', group: 'cmp', block: 8, title: 'Сравни проценты',
    example: '15' + NB + '% от 200 ? 20' + NB + '% от 140', art: 'scales',
    gen(lvl){
      let a1, b1, a2, b2;
      if (lvl === 1){
        if (chance(0.5)){ a1 = pick([20, 30, 40, 15, 12, 60]); b1 = pick([50, 90, 70, 25, 80]); a2 = b1; b2 = a1; }
        else { a1 = pick([1, 10, 50]); b1 = pick([1000, 200, 60, 400]); a2 = pick([10, 20, 25]); b2 = pick([90, 40, 80, 120]); }
      } else if (lvl === 2){
        [a1, b1, a2, b2] = tryGen(() => [pick([15, 12, 35, 45, 8, 24]), pick([200, 150, 60, 120, 250]), pick([20, 30, 18, 40, 25]), pick([140, 90, 110, 70, 160])],
          ([a1, b1, a2, b2]) => decPlaces(a1 * b1 / 100) <= 1 && decPlaces(a2 * b2 / 100) <= 1);
      } else {
        const c = pick([
          () => { const x = pick([800, 400, 1200]); return [0.5, x, 5, x / 10]; },
          () => { const x = pick([64, 48, 32]); return [12.5, x, x, 12.5]; },
          () => [150, pick([60, 40, 80]), pick([60, 90]), 150],
          () => [pick([2.5, 7.5]), pick([400, 200]), pick([25, 75]), pick([40, 20])],
        ])();
        [a1, b1, a2, b2] = c;
      }
      const v1 = clean(a1 * b1 / 100), v2 = clean(a2 * b2 / 100);
      const correct = v1 > v2 + 1e-9 ? 0 : (Math.abs(v1 - v2) < 1e-9 ? 1 : 2);
      const swapNote = (a1 === b2 && b1 === a2) ? ['Числа просто переставлены: ' + M(P(a1) + ' от ' + N(b1) + ' = ' + P(b1) + ' от ' + N(a1)) + ' — выражения равны без вычислений.'] : [];
      return {
        meta: { a1, b1, a2, b2 },
        text: 'Сравни значения и выбери знак:',
        choice: { opts: SIGNS.slice(), correct, cmp: [P(a1) + ' от ' + N(b1), P(a2) + ' от ' + N(b2)] },
        steps: swapNote.concat([
          'Вычисляем оба значения: ' + M(P(a1) + ' от ' + N(b1) + ' = ' + N(v1)) + ', ' + M(P(a2) + ' от ' + N(b2) + ' = ' + N(v2)) + '.',
          M(N(v1) + ' ' + SIGNS[correct] + ' ' + N(v2)) + '.']),
        answer: P(a1) + ' от ' + N(b1) + ' ' + SIGNS[correct] + ' ' + P(a2) + ' от ' + N(b2),
      };
    },
  });

  // 16. Что выгоднее
  proto({
    id: 'better', group: 'cmp', block: 8, title: 'Что выгоднее?',
    example: 'скидка 30' + NB + '% или 20' + NB + '% + 10' + NB + '%', art: 'tags', size: 'w',
    gen(lvl){
      if (lvl === 1){
        const [p1, d1, p2, d2] = tryGen(() => [pick([5000, 4000, 3000, 6000, 2000]), pick([25, 20, 10, 30, 40]), pick([4000, 3500, 4500, 2500, 5000]), pick([5, 10, 15, 20])],
          ([p1, d1, p2, d2]) => p1 !== p2 && isInt(p1 * d1 / 100) && isInt(p2 * d2 / 100));
        const c1 = p1 * (100 - d1) / 100, c2 = p2 * (100 - d2) / 100;
        const correct = c1 < c2 ? 0 : (c1 === c2 ? 2 : 1);
        return {
          meta: { c1, c2 },
          text: 'В одном магазине куртка стоит ' + RUB(p1) + ' со скидкой ' + P(d1) + ', в другом — ' + RUB(p2) + ' со скидкой ' + P(d2) + '. Где куртка дешевле?',
          choice: { opts: ['в первом', 'во втором', 'одинаково'], correct },
          steps: ['Первый магазин: ' + M(N(p1) + ' · ' + N((100 - d1) / 100) + ' = ' + N(c1)) + NB + '₽.',
                  'Второй магазин: ' + M(N(p2) + ' · ' + N((100 - d2) / 100) + ' = ' + N(c2)) + NB + '₽.',
                  correct === 2 ? 'Цены одинаковые.' : 'Дешевле ' + (correct === 0 ? 'в первом' : 'во втором') + ' магазине — сравниваем цены, а не проценты скидки.'],
          answer: ['в первом', 'во втором', 'одинаково'][correct],
        };
      }
      if (lvl === 2){
        const d1 = pick([20, 10, 30, 15]), d2 = pick([10, 20, 15]);
        const single = d1 + d2 + pick([0, 0, -1, -2, 1, -3]);
        const k2 = clean((100 - d1) * (100 - d2) / 100);   // платим, % цены
        const k1 = 100 - single;
        const correct = k1 < k2 - 1e-9 ? 0 : (Math.abs(k1 - k2) < 1e-9 ? 2 : 1);
        return {
          meta: { k1, k2 },
          text: 'Что выгоднее покупателю: одна скидка ' + P(single) + ' или скидка ' + P(d1) + ', а потом ещё ' + P(d2) + ' от новой цены?',
          choice: { opts: ['одна скидка ' + P(single), 'две скидки подряд', 'одинаково'], correct },
          steps: ['Две скидки подряд: ' + M(N((100 - d1) / 100) + ' · ' + N((100 - d2) / 100) + ' = ' + N(k2 / 100)) + ' — платим ' + P(k2) + ' цены, то есть скидка ' + P(100 - k2) + '.',
                  'Одна скидка ' + P(single) + ' — платим ' + P(k1) + ' цены.',
                  correct === 2 ? 'Одинаково.' : 'Выгоднее ' + (correct === 0 ? 'одна скидка ' + P(single) : 'две скидки подряд') + '.'],
          answer: ['одна скидка ' + P(single), 'две скидки подряд', 'одинаково'][correct],
        };
      }
      // В: акции «n по цене m» против скидки
      const deal = pick([[3, 2], [4, 3], [5, 4], [2, 1]]);
      const [n, m] = deal;
      const dNum = (n - m) * 100, dDen = n;       // скидка акции, %
      const dealPct = dNum / dDen;
      const d = pick([20, 25, 30, 35, 40, 15, 50]);
      const correct = dealPct > d + 1e-9 ? 0 : (Math.abs(dealPct - d) < 1e-9 ? 2 : 1);
      const dealStr = decPlaces(dealPct) <= 2 ? P(dealPct) : MIX(dNum, dDen) + NB + '%';
      return {
        meta: { dealPct, d },
        text: 'Что выгоднее: акция «' + n + ' товара по цене ' + m + '» (товары одинаковые, нужно ровно ' + n + ') или скидка ' + P(d) + ' на каждый товар?',
        choice: { opts: ['акция «' + n + ' по цене ' + m + '»', 'скидка ' + P(d), 'одинаково'], correct },
        steps: ['По акции платим за ' + m + ' товар' + (m === 1 ? '' : 'а') + ' из ' + n + ', то есть ' + M(F(m, n)) + ' цены.',
                'Скидка акции — ' + M(F(n - m, n) + ' · 100' + NB + '% = ' + dealStr) + '.',
                correct === 2 ? 'Одинаково.' : 'Сравниваем ' + dealStr + ' и ' + P(d) + ': выгоднее ' + (correct === 0 ? 'акция' : 'скидка ' + P(d)) + '.'],
        answer: ['акция', 'скидка ' + P(d), 'одинаково'][correct],
      };
    },
  });

  /* ═════════════════════════ БЛОК 9 ═════════════════════════ */

  // 17. Части целого
  proto({
    id: 'parts', group: 'parts', block: 9, title: 'Части целого',
    example: '40' + NB + '% + 35' + NB + '% + ? = 100' + NB + '%', art: 'stack',
    gen(lvl){
      if (lvl === 1){
        const a = pick([40, 35, 30, 25, 45, 20]), c = tryGen(() => pick([35, 25, 20, 30, 15, 40]), c => a + c < 95);
        const r = 100 - a - c;
        const theme = pick([['На контрольной ', ' учеников получили «5», ', ' — «4», остальные — «3». Сколько процентов учеников получили «3»?'],
                            ['В саду ', ' деревьев — яблони, ', ' — груши, остальные — вишни. Сколько процентов деревьев — вишни?']]);
        return {
          meta: { known: [a, c] },
          text: theme[0] + P(a) + theme[1] + P(c) + theme[2],
          fields: [ans('Ответ:', V(r), '%')],
          steps: ['Все части вместе — 100' + NB + '%.', M('100' + NB + '% − ' + P(a) + ' − ' + P(c) + ' = ' + P(r)) + '.'],
          answer: P(r),
        };
      }
      if (lvl === 2){
        const [a, c, L] = tryGen(() => [pick([35, 30, 25, 40, 20]), pick([40, 35, 45, 30]), pick([60, 40, 80, 120, 50, 100])],
          ([a, c, L]) => a + c < 95 && isInt(L * (100 - a - c) / 100));
        const rest = L * (100 - a - c) / 100;
        return {
          meta: { known: [a, c], rest },
          text: 'В первый день туристы прошли ' + P(a) + ' маршрута, во второй — ' + P(c) + ', в третий — оставшиеся ' + rest + NB + 'км. Какова длина маршрута?',
          fields: [ans('Ответ:', V(L), 'км')],
          steps: ['В третий день прошли ' + M('100' + NB + '% − ' + P(a) + ' − ' + P(c) + ' = ' + P(100 - a - c)) + ' маршрута.',
                  rest + NB + 'км — это ' + P(100 - a - c) + '; весь маршрут: ' + M(rest + ' : ' + N((100 - a - c) / 100) + ' = ' + L) + NB + 'км.'],
          answer: L + NB + 'км',
        };
      }
      const [f, u, t, B] = tryGen(() => [pick([40, 35, 30, 45]), pick([25, 20, 15]), pick([15, 10, 20, 5]), pick([60000, 50000, 80000, 40000, 100000])],
        ([f, u, t, B]) => f + u + t < 95 && isInt(B * (100 - f - u - t) / 100) && isInt(B * f / 100));
      const r = 100 - f - u - t, save = B * r / 100, food = B * f / 100;
      return {
        meta: { known: [f, u, t], rest: save },
        text: 'Семья тратит ' + P(f) + ' бюджета на еду, ' + P(u) + ' — на коммунальные услуги, ' + P(t) + ' — на транспорт, а оставшиеся ' + RUB(save) + ' откладывает. Каков бюджет семьи? Сколько уходит на еду?',
        fields: [field('a', 'Бюджет:', V(B), { unit: '₽' }), field('b', 'На еду:', V(food), { unit: '₽' })],
        steps: ['Откладывают ' + M('100' + NB + '% − ' + P(f) + ' − ' + P(u) + ' − ' + P(t) + ' = ' + P(r)) + ' бюджета.',
                'Бюджет: ' + M(N(save) + ' : ' + N(r / 100) + ' = ' + N(B)) + NB + '₽.',
                'На еду: ' + M(N(B) + ' · ' + N(f / 100) + ' = ' + N(food)) + NB + '₽.'],
        answer: 'бюджет ' + RUB(B) + ', на еду ' + RUB(food),
      };
    },
  });

  // 18. Процент от процента, процент от остатка
  proto({
    id: 'pct-of-pct', group: 'parts', block: 9, title: 'Процент от части и от остатка',
    example: '30' + NB + '% от 55' + NB + '% учеников', art: 'nested',
    gen(lvl){
      if (lvl < 3){
        const total = lvl === 1 ? pick([30, 40, 20, 50, 60]) : pick([800, 600, 500, 1200, 400]);
        const [p1, p2] = tryGen(() => lvl === 1 ? [pick([40, 50, 60, 30]), pick([50, 25, 20])] : [pick([45, 55, 40, 35, 60]), pick([30, 20, 40, 15, 25])],
          ([p1, p2]) => isInt(total * p1 / 100) && isInt(total * (100 - p1) / 100 * p2 / 100));
        const girls = total * (100 - p1) / 100, r = girls * p2 / 100;
        const w = lvl === 1 ? ['В классе', 'учеников'] : ['В школе', 'учеников'];
        return {
          meta: { total, p1: 100 - p1, p2 },
          text: w[0] + ' ' + pl(total, 'ученик', 'ученика', 'учеников') + ', ' + P(p1) + ' из них — мальчики. ' + P(p2) + ' девочек занимаются танцами. Сколько девочек занимаются танцами?',
          fields: [ans('Ответ:', V(r))],
          steps: ['Процент берётся «от девочек» — значит, сначала находим, сколько девочек. Они — 100' + NB + '% для второго процента.',
                  'Девочек ' + M('100' + NB + '% − ' + P(p1) + ' = ' + P(100 - p1)) + ', это ' + M(total + ' · ' + N((100 - p1) / 100) + ' = ' + girls) + '.',
                  'Танцуют: ' + M(girls + ' · ' + N(p2 / 100) + ' = ' + r) + '.'],
          answer: pl(r, 'девочка', 'девочки', 'девочек'),
        };
      }
      // от остатка, решение «с конца»
      const t = chance(0.5);
      const [p1, p2, left] = tryGen(() => t
        ? [pick([20, 10, 25, 40]), pick([25, 50, 20, 10]), pick([240, 120, 180, 300, 360])]
        : [pick([40, 20, 25, 50]), pick([50, 25, 20]), pick([150, 120, 90, 300])],
        ([p1, p2, left]) => isInt(left / ((100 - p1) / 100 * (100 - p2) / 100)));
      const k = clean((100 - p1) / 100 * (100 - p2) / 100), all = clean(left / k);
      return {
        meta: { p1, p2, left },
        text: t
          ? 'В первый день продали ' + P(p1) + ' всех арбузов, во второй — ' + P(p2) + ' остатка. Осталось ' + pl(left, 'арбуз', 'арбуза', 'арбузов') + '. Сколько арбузов было?'
          : 'Петя потратил ' + P(p1) + ' своих денег, потом ' + (p2 === 50 ? 'половину' : P(p2)) + ' остатка. У него осталось ' + RUB(left) + '. Сколько денег было у Пети?',
        fields: [ans('Ответ:', V(all), t ? '' : '₽')],
        steps: ['После первого раза осталось ' + P(100 - p1) + ', то есть ' + N((100 - p1) / 100) + ' всего.',
                'Во второй раз процент берётся от остатка: осталось ' + M(N((100 - p1) / 100) + ' · ' + N((100 - p2) / 100) + ' = ' + N(k)) + ' всего.',
                M(N(left) + ' : ' + N(k) + ' = ' + N(all)) + '.'],
        answer: t ? pl(all, 'арбуз', 'арбуза', 'арбузов') : RUB(all),
      };
    },
  });

  /* ═════════════════════════ БЛОК 10 ═════════════════════════ */

  // 19. Круговые диаграммы
  const PIE_SETS = [[40, 35, 25], [50, 30, 20], [45, 25, 20, 10], [30, 30, 25, 15], [60, 25, 15], [35, 30, 20, 15], [50, 25, 25], [40, 30, 20, 10]];
  // [кого/что выбрали, подпись сектора]: «выбрали историю», но сектор «История»
  const PIE_TOPICS = [
    [['математику', 'Математика'], ['литературу', 'Литература'], ['историю', 'История'], ['биологию', 'Биология']],
    [['футбол', 'Футбол'], ['плавание', 'Плавание'], ['шахматы', 'Шахматы'], ['танцы', 'Танцы']],
    [['кошек', 'Кошки'], ['собак', 'Собаки'], ['рыбок', 'Рыбки'], ['попугаев', 'Попугаи']],
  ];
  proto({
    id: 'pie', group: 'parts', block: 10, title: 'Круговые диаграммы',
    example: '25' + NB + '% круга — 90°', art: 'pie', size: 'l',
    gen(lvl){
      if (lvl === 1){
        if (chance(0.55)){
          const p = pick([25, 10, 45, 20, 30, 5, 40, 15, 50, 35, 12.5, 60]);
          const deg = clean(p * 3.6);
          return {
            meta: { p },
            text: 'Какой угол у сектора круговой диаграммы, который соответствует ' + P(p) + '?',
            fig: { kind: 'pie', parts: [p, 100 - p], texts: [P(p), ''], mark: 0 },
            fields: [ans('Угол:', V(deg), '°')],
            steps: ['Весь круг — 360°, это 100' + NB + '%. Значит, 1' + NB + '% = 360° : 100 = 3,6°.', M(N(p) + ' · 3,6° = ' + N(deg) + '°') + '.'],
            answer: N(deg) + '°',
          };
        }
        const p = pick([15, 5, 20, 30, 40, 25, 35, 10]);
        const deg = clean(p * 3.6);
        return {
          meta: { deg },
          text: 'Сектор круговой диаграммы имеет угол ' + N(deg) + '°. Сколько процентов он составляет?',
          fig: { kind: 'pie', parts: [p, 100 - p], texts: [N(deg) + '°', ''], mark: 0 },
          fields: [ans('Ответ:', V(p), '%')],
          steps: ['1' + NB + '% круга — это 3,6°.', 'Процент = угол : 3,6°: ' + M(N(deg) + ' : 3,6 = ' + N(p)) + ', то есть ' + P(p) + '.'],
          answer: P(p),
        };
      }
      const set = pick(PIE_SETS), topic = pick(PIE_TOPICS);
      if (lvl === 2){
        const i = ri(0, set.length - 1);
        const total = tryGen(() => pick([200, 400, 300, 500, 80, 120, 600]), T => set.every(p => isInt(T * p / 100)));
        const n = total * set[i] / 100, deg = clean(set[i] * 3.6);
        return {
          meta: { total, p: set[i] },
          text: 'Опросили ' + total + ' учеников, что им нравится больше всего. Результаты — на диаграмме. Сколько учеников выбрали ' + topic[i][0] + '? Какой угол у этого сектора?',
          fig: { kind: 'pie', parts: set, texts: set.map(P), legend: topic.slice(0, set.length).map(t => t[1]), mark: i },
          fields: [field('a', 'Учеников:', V(n)), field('b', 'Угол:', V(deg), { unit: '°' })],
          steps: ['Сектор «' + topic[i][1] + '» — это ' + P(set[i]) + ': ' + M(total + ' · ' + N(set[i] / 100) + ' = ' + n) + '.',
                  'Угол сектора: ' + M(N(set[i]) + ' · 3,6° = ' + N(deg) + '°') + '.'],
          answer: pl(n, 'ученик', 'ученика', 'учеников') + ', ' + N(deg) + '°',
        };
      }
      // В: по углу сектора и числу опрошенных — сколько человек; или угол «остальных»
      const i = ri(0, set.length - 1);
      const total = tryGen(() => pick([300, 200, 400, 600, 500, 120]), T => set.every(p => isInt(T * p / 100)));
      const deg = clean(set[i] * 3.6), n = total * set[i] / 100;
      if (chance(0.5)) return {
        meta: { total, deg },
        text: 'Всего опросили ' + total + ' человек. На круговой диаграмме сектор «' + topic[i][1] + '» имеет угол ' + N(deg) + '°. Сколько человек выбрали ' + topic[i][0] + '?',
        fig: { kind: 'pie', parts: set, texts: set.map((x, j) => j === i ? N(deg) + '°' : ''), legend: topic.slice(0, set.length).map(t => t[1]), mark: i },
        fields: [ans('Ответ:', V(n))],
        steps: ['Сначала переводим угол в проценты: ' + M(N(deg) + ' : 3,6 = ' + N(set[i])) + ', то есть ' + P(set[i]) + '.',
                'Теперь процент от числа: ' + M(total + ' · ' + N(set[i] / 100) + ' = ' + n) + '.'],
        answer: pl(n, 'человек', 'человека', 'человек'),
      };
      const others = set.filter((_, j) => j !== i);
      const rest = 100 - others.reduce((s, x) => s + x, 0);
      return {
        meta: { known: others },
        text: 'На круговой диаграмме ' + others.map((p, j) => 'сектор «' + topic[j >= i ? j + 1 : j][1] + '» занимает ' + P(p)).join(', ') + '. Какой угол у оставшегося сектора «' + topic[i][1] + '»?',
        fig: { kind: 'pie', parts: set, texts: set.map((x, j) => j === i ? '?' : P(x)), legend: topic.slice(0, set.length).map(t => t[1]), mark: i },
        fields: [ans('Угол:', V(clean(rest * 3.6)), '°')],
        steps: ['Оставшийся сектор: ' + M('100' + NB + '% − ' + others.map(P).join(' − ') + ' = ' + P(rest)) + '.',
                'Угол: ' + M(N(rest) + ' · 3,6° = ' + N(rest * 3.6) + '°') + '.'],
        answer: N(rest * 3.6) + '°',
      };
    },
  });

  /* ═════════════════════════ БЛОК 11 ═════════════════════════ */

  // 20. Концентрация раствора
  proto({
    id: 'conc', group: 'mix', block: 11, title: 'Концентрация раствора',
    example: '30 г соли в 200 г раствора — 15' + NB + '%', art: 'beaker',
    gen(lvl){
      const t = ri(0, 2);
      const Ms = lvl === 1 ? [200, 500, 100, 400, 300] : [250, 150, 350, 120, 450, 80, 600];
      const ps = lvl === 1 ? [15, 8, 5, 10, 20, 25] : [12, 6, 4, 18, 3.5, 7.5, 2.5, 35];
      const [m, p] = tryGen(() => [pick(Ms), pick(ps)], ([m, p]) => decPlaces(m * p / 100) <= (lvl === 1 ? 0 : 1));
      const s = clean(m * p / 100);
      const sub = pick(['соли', 'сахара']);
      if (lvl === 3 && chance(0.6)){
        const water = m - s;
        return {
          meta: { s, m },
          text: 'В ' + N(water) + NB + 'г воды растворили ' + N(s) + NB + 'г ' + sub + '. Какова концентрация раствора?',
          fields: [ans('Ответ:', V(p), '%')],
          steps: ['Подвох: раствор — это вода вместе с ' + (sub === 'соли' ? 'солью' : 'сахаром') + ': ' + M(N(water) + ' + ' + N(s) + ' = ' + N(m)) + NB + 'г.',
                  'Концентрация = масса вещества : масса раствора · 100' + NB + '%: ' + M(F(N(s), N(m)) + ' · 100' + NB + '% = ' + P(p)) + '.'],
          answer: P(p),
        };
      }
      if (t === 0) return {
        meta: { s, m },
        text: 'В ' + N(m) + NB + 'г раствора содержится ' + N(s) + NB + 'г ' + sub + '. Какова концентрация раствора?',
        fields: [ans('Ответ:', V(p), '%')],
        steps: ['Концентрация = масса вещества : масса раствора · 100' + NB + '%.', M(F(N(s), N(m)) + ' = ' + N(p / 100) + ' = ' + P(p)) + '.'],
        answer: P(p),
      };
      if (t === 1) return {
        meta: { m, p },
        text: 'Сколько граммов ' + sub + ' в ' + N(m) + NB + 'г ' + N(p) + '%-го раствора?',
        fields: [ans('Ответ:', V(s), 'г')],
        steps: [N(p) + '%-й раствор — вещество составляет ' + P(p) + ' массы раствора.', M(N(m) + ' · ' + N(p / 100) + ' = ' + N(s)) + NB + 'г.'],
        answer: N(s) + NB + 'г',
      };
      return {
        meta: { s, p },
        text: 'Сколько граммов ' + N(p) + '%-го раствора содержат ' + N(s) + NB + 'г ' + sub + '?',
        fields: [ans('Ответ:', V(m), 'г')],
        steps: [N(s) + NB + 'г — это ' + P(p) + ' раствора, нужен весь раствор (100' + NB + '%).', M(N(s) + ' : ' + N(p / 100) + ' = ' + N(m)) + NB + 'г.'],
        answer: N(m) + NB + 'г',
      };
    },
  });

  // 21. Разбавление и смешивание
  proto({
    id: 'mixing', group: 'mix', block: 11, title: 'Разбавление и смешивание',
    example: '200 г 10' + NB + '% + 50 г воды → 8' + NB + '%', art: 'pour', size: 'w',
    gen(lvl){
      if (lvl === 1){
        // добавили воду
        const [m, p, w] = tryGen(() => [pick([200, 300, 400, 100, 500]), pick([10, 20, 15, 12, 25]), pick([50, 100, 200, 300, 150])],
          ([m, p, w]) => isInt(m * p / 100) && decPlaces(m * p / (m + w)) <= 1);
        const s = m * p / 100, r = clean(s * 100 / (m + w));
        return {
          meta: { s, m: m + w },
          text: 'К ' + m + NB + 'г ' + p + '%-го раствора соли добавили ' + w + NB + 'г воды. Какой стала концентрация?',
          fields: [ans('Ответ:', V(r), '%')],
          steps: ['Соли в растворе ' + M(m + ' · ' + N(p / 100) + ' = ' + s) + NB + 'г — вода её не меняет.',
                  'Раствора стало ' + M(m + ' + ' + w + ' = ' + (m + w)) + NB + 'г.',
                  M(F(s, m + w) + ' · 100' + NB + '% = ' + P(r)) + '.'],
          answer: P(r),
        };
      }
      if (lvl === 2){
        if (chance(0.5)){
          const [m, p, add] = tryGen(() => [pick([300, 200, 400, 180, 100]), pick([20, 10, 15, 25]), pick([20, 40, 50, 60, 100])],
            ([m, p, add]) => isInt(m * p / 100) && decPlaces((m * p / 100 + add) * 100 / (m + add)) <= 1);
          const s = m * p / 100, r = clean((s + add) * 100 / (m + add));
          return {
            meta: { s: s + add, m: m + add },
            text: 'К ' + m + NB + 'г ' + p + '%-го раствора соли добавили ' + add + NB + 'г соли. Какой стала концентрация?',
            fields: [ans('Ответ:', V(r), '%')],
            steps: ['Соли было ' + M(m + ' · ' + N(p / 100) + ' = ' + s) + NB + 'г, стало ' + M(s + ' + ' + add + ' = ' + (s + add)) + NB + 'г.',
                    'Добавили вещество — меняется и раствор: ' + M(m + ' + ' + add + ' = ' + (m + add)) + NB + 'г.',
                    M(F(s + add, m + add) + ' · 100' + NB + '% = ' + P(r)) + '.'],
            answer: P(r),
          };
        }
        const [m1, p1, m2, p2] = tryGen(() => [pick([100, 200, 300, 150]), pick([10, 20, 5, 40]), pick([300, 200, 100, 150, 400]), pick([30, 10, 20, 50, 15])],
          ([m1, p1, m2, p2]) => p1 !== p2 && isInt(m1 * p1 / 100) && isInt(m2 * p2 / 100) && decPlaces((m1 * p1 + m2 * p2) / (m1 + m2)) <= 1);
        const s1 = m1 * p1 / 100, s2 = m2 * p2 / 100, r = clean((s1 + s2) * 100 / (m1 + m2));
        return {
          meta: { s: s1 + s2, m: m1 + m2 },
          text: 'Смешали ' + m1 + NB + 'г ' + p1 + '%-го раствора и ' + m2 + NB + 'г ' + p2 + '%-го раствора. Какова концентрация смеси?',
          fields: [ans('Ответ:', V(r), '%')],
          steps: ['Складываем отдельно вещество и отдельно растворы.',
                  'Вещества: ' + M(m1 + ' · ' + N(p1 / 100) + ' + ' + m2 + ' · ' + N(p2 / 100) + ' = ' + s1 + ' + ' + s2 + ' = ' + (s1 + s2)) + NB + 'г; раствора: ' + M(m1 + ' + ' + m2 + ' = ' + (m1 + m2)) + NB + 'г.',
                  M(F(s1 + s2, m1 + m2) + ' · 100' + NB + '% = ' + P(r)) + '.'],
          answer: P(r),
        };
      }
      // В: сколько воды добавить
      const [m, p1, p2] = tryGen(() => [pick([400, 300, 200, 600, 500]), pick([15, 20, 12, 30, 25]), pick([10, 5, 8, 12, 6, 15])],
        ([m, p1, p2]) => p2 < p1 && isInt(m * p1 / 100) && isInt(m * p1 / p2));
      const s = m * p1 / 100, newM = m * p1 / p2, w = newM - m;
      return {
        meta: { m, p1, p2 },
        text: 'Сколько граммов воды нужно добавить к ' + m + NB + 'г ' + p1 + '%-го раствора, чтобы получить ' + p2 + '%-й раствор?',
        fields: [ans('Ответ:', V(w), 'г')],
        steps: ['Соли ' + M(m + ' · ' + N(p1 / 100) + ' = ' + s) + NB + 'г — при добавлении воды не меняется.',
                s + NB + 'г должны составлять ' + P(p2) + ' нового раствора: ' + M(s + ' : ' + N(p2 / 100) + ' = ' + newM) + NB + 'г — новый раствор.',
                'Воды добавить: ' + M(newM + ' − ' + m + ' = ' + w) + NB + 'г.'],
        answer: w + NB + 'г',
      };
    },
  });

  // 22. Выпаривание и высушивание
  proto({
    id: 'drying', group: 'mix', block: 11, title: 'Выпаривание и высушивание',
    example: 'арбуз 99' + NB + '% воды → 98' + NB + '%', art: 'dry',
    gen(lvl){
      if (lvl === 1){
        const [m, p, w] = tryGen(() => [pick([200, 300, 400, 500, 600]), pick([5, 4, 6, 10, 8]), pick([100, 50, 200, 150, 300])],
          ([m, p, w]) => w < m && isInt(m * p / 100) && decPlaces(m * p / (m - w)) <= 1);
        const s = m * p / 100, r = clean(s * 100 / (m - w));
        return {
          meta: { s, m: m - w },
          text: 'Из ' + m + NB + 'г ' + p + '%-го раствора соли выпарили ' + w + NB + 'г воды. Какой стала концентрация?',
          fields: [ans('Ответ:', V(r), '%')],
          steps: ['Выпаривается только вода — соли остаётся ' + M(m + ' · ' + N(p / 100) + ' = ' + s) + NB + 'г.',
                  'Раствора стало ' + M(m + ' − ' + w + ' = ' + (m - w)) + NB + 'г.',
                  M(F(s, m - w) + ' · 100' + NB + '% = ' + P(r)) + '.'],
          answer: P(r),
        };
      }
      if (lvl === 2){
        const [m, p1, p2] = tryGen(() => [pick([500, 400, 300, 600, 200]), pick([4, 5, 6, 8, 2]), pick([10, 20, 8, 12, 25, 16])],
          ([m, p1, p2]) => p2 > p1 && isInt(m * p1 / 100) && isInt(m * p1 / p2));
        const s = m * p1 / 100, newM = m * p1 / p2;
        return {
          meta: { m, p1, p2 },
          text: 'Сколько граммов воды нужно выпарить из ' + m + NB + 'г ' + p1 + '%-го раствора, чтобы получить ' + p2 + '%-й раствор?',
          fields: [ans('Ответ:', V(m - newM), 'г')],
          steps: ['Соли ' + M(m + ' · ' + N(p1 / 100) + ' = ' + s) + NB + 'г — она остаётся.',
                  'В новом растворе это ' + P(p2) + ': ' + M(s + ' : ' + N(p2 / 100) + ' = ' + newM) + NB + 'г раствора.',
                  'Выпарить: ' + M(m + ' − ' + newM + ' = ' + (m - newM)) + NB + 'г воды.'],
          answer: (m - newM) + NB + 'г',
        };
      }
      // В: высушивание — сухое вещество связывает «до» и «после»
      const item = pick([
        { what: 'Арбуз массой', unit: 'кг', w1: 99, w2: pick([98, 96, 95]), M: pick([20, 10, 30, 40]), after: 'Когда он немного усох, содержание воды стало', ask: 'Сколько теперь весит арбуз?' },
        { what: 'Свежие грибы', unit: 'кг', w1: 90, w2: pick([12, 20, 10, 60]), M: pick([22, 44, 11, 20, 18]), after: 'а сушёные —', ask: 'Сколько сушёных грибов получится?' },
        { what: 'Свежие ягоды', unit: 'кг', w1: 80, w2: pick([20, 10, 36]), M: pick([10, 20, 36, 16]), after: 'после сушки —', ask: 'Сколько сушёных ягод получится?' },
      ]);
      const D = clean(item.M * (100 - item.w1) / 100), after = clean(D * 100 / (100 - item.w2));
      if (decPlaces(after) > 2) return this.gen(3);
      const text = item.what === 'Арбуз массой'
        ? 'Арбуз массой ' + item.M + NB + 'кг содержал ' + P(item.w1) + ' воды. ' + item.after + ' ' + P(item.w2) + '. ' + item.ask
        : item.what + ' содержат ' + P(item.w1) + ' воды, ' + item.after + ' ' + P(item.w2) + '. Взяли ' + item.M + NB + 'кг. ' + item.ask;
      return {
        meta: { M: item.M, w1: item.w1, w2: item.w2 },
        text,
        fields: [ans('Ответ:', V(after), 'кг')],
        steps: ['При сушке испаряется только вода, сухое вещество остаётся тем же.',
                'Сухого вещества ' + M('100' + NB + '% − ' + P(item.w1) + ' = ' + P(100 - item.w1)) + ': ' + M(item.M + ' · ' + N((100 - item.w1) / 100) + ' = ' + N(D)) + NB + 'кг.',
                'После сушки это ' + P(100 - item.w2) + ' массы: ' + M(N(D) + ' : ' + N((100 - item.w2) / 100) + ' = ' + N(after)) + NB + 'кг.'],
        answer: N(after) + NB + 'кг',
      };
    },
  });

  /* ═════════════════════════ БЛОК 12 ═════════════════════════ */

  // 23. Вклады: простые и сложные проценты
  proto({
    id: 'deposit', group: 'money', block: 12, title: 'Вклады: простые и сложные проценты',
    example: '10' + NB + '000 ₽ под 10' + NB + '% на 2 года', art: 'coins', size: 'w',
    gen(lvl){
      if (lvl === 1){
        const [S, p] = tryGen(() => [pick([10000, 20000, 5000, 50000, 15000, 8000]), pick([8, 10, 5, 6, 12, 7])], ([S, p]) => isInt(S * p / 100));
        const add = S * p / 100;
        return {
          meta: { S, p, n: 1 },
          text: 'Вклад ' + RUB(S) + ' положили под ' + P(p) + ' годовых. Сколько рублей начислят за год? Какой станет сумма?',
          fields: [field('a', 'Начислят:', V(add), { unit: '₽' }), field('b', 'Станет:', V(S + add), { unit: '₽' })],
          steps: ['За год: ' + M(N(S) + ' · ' + N(p / 100) + ' = ' + N(add)) + NB + '₽.', 'Сумма: ' + M(N(S) + ' + ' + N(add) + ' = ' + N(S + add)) + NB + '₽.'],
          answer: RUB(add) + ' и ' + RUB(S + add),
        };
      }
      if (lvl === 2){
        const t = ri(0, 2);
        const [S, p, n] = tryGen(() => [pick([30000, 20000, 12000, 50000, 40000, 25000]), pick([6, 7, 5, 8, 4, 10]), pick([2, 3, 4, 5])], ([S, p]) => isInt(S * p / 100));
        const add = S * p / 100;
        if (t === 0) return {
          meta: { S, p, n, simple: true },
          text: 'Вклад ' + RUB(S) + ' положили на ' + n + ' ' + (n < 5 ? 'года' : 'лет') + ' под ' + P(p) + ' годовых (простые проценты). Какой станет сумма?',
          fields: [ans('Ответ:', V(S + n * add), '₽')],
          steps: ['При простых процентах прибавка каждый год одинаковая — от первоначальной суммы: ' + M(N(S) + ' · ' + N(p / 100) + ' = ' + N(add)) + NB + '₽.',
                  'За ' + n + ' ' + (n < 5 ? 'года' : 'лет') + ': ' + M(N(S) + ' + ' + n + ' · ' + N(add) + ' = ' + N(S + n * add)) + NB + '₽.'],
          answer: RUB(S + n * add),
        };
        if (t === 1) return {
          meta: { S, after: S + add },
          text: 'За год вклад ' + RUB(S) + ' вырос до ' + RUB(S + add) + '. Под какой процент годовых он был положен?',
          fields: [ans('Ответ:', V(p), '%')],
          steps: ['Прибавка: ' + M(N(S + add) + ' − ' + N(S) + ' = ' + N(add)) + NB + '₽.', 'Сколько процентов прибавка составляет от вклада: ' + M(F(N(add), N(S)) + ' · 100' + NB + '% = ' + P(p)) + '.'],
          answer: P(p),
        };
        return {
          meta: { p, after: S + add },
          text: 'Какую сумму положили в банк под ' + P(p) + ' годовых, если через год на счёте ' + RUB(S + add) + '?',
          fields: [ans('Ответ:', V(S), '₽')],
          steps: [RUB(S + add) + ' — это ' + P(100 + p) + ' вклада.', M(N(S + add) + ' : ' + N((100 + p) / 100) + ' = ' + N(S)) + NB + '₽.'],
          answer: RUB(S),
        };
      }
      const [S, p] = tryGen(() => [pick([10000, 20000, 50000, 40000, 30000]), pick([10, 20, 5, 8])], ([S, p]) => isInt(S * (100 + p) * (100 + p) / 10000));
      const y1 = S * (100 + p) / 100, y2 = y1 * (100 + p) / 100;
      if (chance(0.5)) return {
        meta: { S, p, n: 2, simple: false },
        text: 'Вклад ' + RUB(S) + ' положили на 2 года под ' + P(p) + ' годовых с капитализацией (сложные проценты). Какой станет сумма?',
        fields: [ans('Ответ:', V(y2), '₽')],
        steps: ['С капитализацией процент каждый год начисляют на уже накопленную сумму: умножаем на ' + N((100 + p) / 100) + ' каждый год.',
                '1-й год: ' + M(N(S) + ' · ' + N((100 + p) / 100) + ' = ' + N(y1)) + NB + '₽.',
                '2-й год: ' + M(N(y1) + ' · ' + N((100 + p) / 100) + ' = ' + N(y2)) + NB + '₽.'],
        answer: RUB(y2),
      };
      const simple = S + 2 * S * p / 100;
      return {
        meta: { S, p, n: 2, both: true },
        text: RUB(S) + ' положили на 2 года под ' + P(p) + ' годовых. Сколько будет на счёте при простых процентах и сколько — при сложных?',
        fields: [field('a', 'Простые:', V(simple), { unit: '₽' }), field('b', 'Сложные:', V(y2), { unit: '₽' })],
        steps: ['Простые: каждый год прибавка ' + M(N(S) + ' · ' + N(p / 100) + ' = ' + N(S * p / 100)) + NB + '₽, итого ' + M(N(S) + ' + 2 · ' + N(S * p / 100) + ' = ' + N(simple)) + NB + '₽.',
                'Сложные: ' + M(N(S) + ' · ' + N((100 + p) / 100) + ' · ' + N((100 + p) / 100) + ' = ' + N(y2)) + NB + '₽.',
                'Разница ' + RUB(y2 - simple) + ' — это проценты, начисленные на проценты первого года.'],
        answer: 'простые ' + RUB(simple) + ', сложные ' + RUB(y2),
      };
    },
  });

  // 24. Налог и кредит
  proto({
    id: 'tax', group: 'money', block: 12, title: 'Налог и кредит',
    example: '50' + NB + '000 ₽ − 13' + NB + '% = 43' + NB + '500 ₽', art: 'wallet',
    gen(lvl){
      if (lvl === 1){
        if (chance(0.5)){
          const S = pick([50000, 40000, 30000, 60000, 20000, 100000]);
          const net = S * 87 / 100;
          return {
            meta: { S, p: -13 },
            text: 'Начисленная зарплата ' + RUB(S) + ', налог на доходы — 13' + NB + '%. Сколько рублей работник получит на руки?',
            fields: [ans('Ответ:', V(net), '₽')],
            steps: ['На руки получают ' + M('100' + NB + '% − 13' + NB + '% = 87' + NB + '%') + ' начисленного.', M(N(S) + ' · 0,87 = ' + N(net)) + NB + '₽.'],
            answer: RUB(net),
          };
        }
        const [K, p] = tryGen(() => [pick([20000, 10000, 30000, 50000, 15000]), pick([15, 10, 12, 20, 18])], ([K, p]) => isInt(K * p / 100));
        const back = K * (100 + p) / 100;
        return {
          meta: { S: K, p },
          text: 'Кредит ' + RUB(K) + ' взяли на год под ' + P(p) + ' годовых. Сколько нужно вернуть?',
          fields: [ans('Ответ:', V(back), '₽')],
          steps: ['Вернуть нужно сумму кредита и проценты: ' + P(100 + p) + ' от кредита.', M(N(K) + ' · ' + N((100 + p) / 100) + ' = ' + N(back)) + NB + '₽.'],
          answer: RUB(back),
        };
      }
      if (lvl === 2){
        const S = tryGen(() => ri(150, 900) * 100, S => isInt(S * 13 / 100));
        const tax = S * 13 / 100;
        return {
          meta: { S, tax: true },
          text: 'Работнику начислено ' + RUB(S) + '. Сколько рублей составит налог 13' + NB + '%? Сколько рублей работник получит на руки?',
          fields: [field('a', 'Налог:', V(tax), { unit: '₽' }), field('b', 'На руки:', V(S - tax), { unit: '₽' })],
          steps: ['Налог: ' + M(N(S) + ' · 0,13 = ' + N(tax)) + NB + '₽.', 'На руки: ' + M(N(S) + ' − ' + N(tax) + ' = ' + N(S - tax)) + NB + '₽.'],
          answer: 'налог ' + RUB(tax) + ', на руки ' + RUB(S - tax),
        };
      }
      const S = pick([40000, 50000, 30000, 60000, 70000, 45000, 36000]);
      const net = S * 87 / 100;
      return {
        meta: { net },
        text: 'После вычета 13' + NB + '% налога работник получил ' + RUB(net) + '. Какая зарплата была начислена?',
        fields: [ans('Ответ:', V(S), '₽')],
        steps: ['Подвох: ' + RUB(net) + ' — это не 100' + NB + '%, а 87' + NB + '% начисленного.', M(N(net) + ' : 0,87 = ' + N(S)) + NB + '₽.'],
        answer: RUB(S),
      };
    },
  });

  /* ═════════════════════════ БЛОК 13 ═════════════════════════ */

  // 25. Задачи повышенной сложности
  proto({
    id: 'hard', group: 'hard', block: 13, title: 'Задачи повышенной сложности',
    example: 'длина +20' + NB + '%, ширина −20' + NB + '% → площадь?', art: 'rect',
    gen(lvl){
      if (lvl === 1){
        const p = pick([20, 10, 30, 50, 40]);
        const k = clean((100 + p) * (100 + p) / 10000);
        return {
          meta: { mult: [1 + p / 100, 1 + p / 100] },
          text: 'Цену повысили на ' + P(p) + ', а потом ещё на ' + P(p) + '. На сколько процентов повысилась цена всего?',
          fields: [ans('На', V(clean((k - 1) * 100)), '%')],
          steps: ['Проценты не складываются: второй раз ' + P(p) + ' берут от новой цены.',
                  M(N(1 + p / 100) + ' · ' + N(1 + p / 100) + ' = ' + N(k)) + ' → цена выросла на ' + P((k - 1) * 100) + ', а не на ' + P(2 * p) + '.'],
          answer: 'на ' + P((k - 1) * 100),
        };
      }
      if (lvl === 2){
        const p = pick([20, 10, 30, 50, 40]);
        const sq = chance(0.4);
        if (sq){
          const k = clean((100 + p) * (100 + p) / 10000);
          return {
            meta: { mult: [1 + p / 100, 1 + p / 100] },
            text: 'Сторону квадрата увеличили на ' + P(p) + '. На сколько процентов увеличилась его площадь?',
            fields: [ans('На', V(clean((k - 1) * 100)), '%')],
            steps: ['Приём «возьмём за 100»: пусть сторона была 10, площадь 100.',
                    'Сторона стала ' + N(10 * (1 + p / 100)) + ', площадь ' + M(N(10 * (1 + p / 100)) + ' · ' + N(10 * (1 + p / 100)) + ' = ' + N(100 * k)) + '.',
                    'Площадь выросла на ' + P((k - 1) * 100) + '.'],
            answer: 'на ' + P((k - 1) * 100),
          };
        }
        const k = clean((100 + p) * (100 - p) / 10000);
        return {
          meta: { mult: [1 + p / 100, 1 - p / 100] },
          text: 'Длину прямоугольника увеличили на ' + P(p) + ', а ширину уменьшили на ' + P(p) + '. На сколько процентов уменьшилась площадь?',
          fields: [ans('На', V(clean((1 - k) * 100)), '%')],
          steps: ['Приём «возьмём за 100»: пусть длина и ширина были по 10, площадь 100.',
                  'Стало ' + N(10 * (1 + p / 100)) + ' и ' + N(10 * (1 - p / 100)) + ', площадь ' + M(N(10 * (1 + p / 100)) + ' · ' + N(10 * (1 - p / 100)) + ' = ' + N(100 * k)) + '.',
                  'Подвох: площадь не осталась прежней — она уменьшилась на ' + P((1 - k) * 100) + '.'],
          answer: 'на ' + P((1 - k) * 100),
        };
      }
      const t = ri(0, 2);
      if (t === 0){
        const [n, m] = pick([[3, 2], [4, 3], [5, 4], [5, 3], [6, 5]]);
        const num = (n - m) * 100, den = n;
        const f = decPlaces(num / den) <= 2 ? ans('Скидка', V(num / den), '%') : Object.assign(ans('Скидка', '', '%'), exact(num, den));
        const str = f.exactFrac ? MIX(num, den) + NB + '%' : P(num / den);
        return {
          meta: { n, m },
          text: 'В магазине акция «' + n + ' товара по цене ' + m + '». Какую скидку в процентах получает покупатель, который берёт ' + n + ' одинаковых товара?',
          fields: [f],
          steps: ['Платим за ' + m + ' из ' + n + ' товаров, то есть ' + M(F(m, n)) + ' цены.',
                  'Скидка — ' + M(F(n - m, n) + ' · 100' + NB + '% = ' + str) + '.'],
          answer: str,
        };
      }
      if (t === 1){
        const [p, q, left] = tryGen(() => [pick([40, 20, 25, 60]), pick([50, 25, 40]), pick([150, 120, 300, 90, 60])],
          ([p, q, left]) => isInt(left / ((100 - p) / 100 * (100 - q) / 100)));
        const k = clean((100 - p) / 100 * (100 - q) / 100), all = clean(left / k);
        const who = pick(['Петя', 'Маша']);
        return {
          meta: { p1: p, p2: q, left },
          text: who + ' потратил' + (who === 'Маша' ? 'а' : '') + ' ' + P(p) + ' своих денег, потом ' + (q === 50 ? 'половину' : P(q)) + ' остатка. Осталось ' + RUB(left) + '. Сколько денег было?',
          fields: [ans('Ответ:', V(all), '₽')],
          steps: ['Осталось ' + M(N((100 - p) / 100) + ' · ' + N((100 - q) / 100) + ' = ' + N(k)) + ' всех денег.', M(N(left) + ' : ' + N(k) + ' = ' + N(all)) + NB + '₽.'],
          answer: RUB(all),
        };
      }
      const p = pick([30, 15, 45, 12.5, 35, 55]);
      return {
        meta: { p },
        text: 'На круговой диаграмме сектор занимает ' + P(p) + '. Чему равен угол этого сектора?',
        fields: [ans('Угол:', V(clean(p * 3.6)), '°')],
        steps: ['1' + NB + '% круга = 3,6°.', M(N(p) + ' · 3,6° = ' + N(p * 3.6) + '°') + '.'],
        answer: N(p * 3.6) + '°',
      };
    },
  });

  /* ═════════════ сборка задания ═════════════ */
  let seq = 0;
  // key — уникальный номер задания: по нему поля регистрируются в совместной
  // сессии (набранное в прошлом задании не должно перетечь в новое) и
  // сравнивается «то же задание или уже другое» при чужом снимке
  function makeKey(){ return Date.now().toString(36) + '-' + (++seq).toString(36) + '-' + Math.random().toString(36).slice(2, 7); }
  function generate(pid, lvl){
    const pr = PROTOS.find(p => p.id === pid) || PROTOS[0];
    const L = Math.max(1, Math.min(3, lvl | 0 || 1));
    const t = pr.gen.call(pr, L);
    return Object.assign({ pid: pr.id, lvl: L, key: makeKey() }, t);
  }

  window.PERCENT_BANK = {
    groups: GROUPS,
    protos: PROTOS,
    generate,
    LEVELS: ['А', 'Б', 'В'],
    LEVEL_HINTS: ['базовый — прямое применение правила', 'средний — неудобные числа, проценты больше 100 %', 'текстовые задачи и задачи с подвохом'],
    // для теста и страницы
    util: { N, P, F, MIX, gcd, clean, decPlaces },
  };
})();
