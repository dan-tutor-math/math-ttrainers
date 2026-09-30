/* ═══════════════════════════════════════════════════════════════════════
   logarithms-bank.js — задания тренажёра «Свойства логарифмов» (10–11
   класс), промпт №12 нового списка.

   Десять плиток-свойств (как на школьной карточке «Свойства логарифмов»):
   основное тождество, логарифм единицы и основания, произведения, частного,
   степени, степень в основании, степени в основании и в аргументе, переход
   к новому основанию, перемена основания и аргумента местами, обмен
   основания степени и аргумента логарифма. У каждого свойства три уровня
   (А — прямое применение на простых числах, Б — дроби, корни, отрицательные
   показатели и «спрятанные» степени, В — свойство несколько раз подряд и в
   обратную сторону) и несколько типов заданий: вычислить, упростить
   (вписать число в тождество), применить в обратную сторону, выбрать
   верную формулу.

   Почему выражения хранятся ДЕРЕВЬЯМИ, а не готовым HTML. Каждое выражение
   задания и каждая строка решения — массив вида ['log', 2, ['*', 4, 8]].
   Условие и решение на экране рисуются из этого же дерева (render), а тест
   (test_prompt12_logarithms.py) вычисляет деревья СВОИМ вычислителем и
   сверяет: ответ с условием, каждую строку решения с предыдущей, неверные
   варианты выбора — что они действительно не равны верному. Опечатка в
   генераторе тогда не может разойтись с тем, что видит ученик: картинка и
   проверка — одно и то же дерево.

   Задание — обычные данные без функций (как в percent-bank.js): оно
   целиком уходит в снимок совместной сессии, в карточки «+» и на доску.

   Узлы дерева:
     число (в том числе десятичное: 1.5 рисуется «1,5»)
     ['v', 'x']           — буква (курсивом)
     ['slot']             — пропуск «?» в тождестве, его вписывает ученик
     ['log', осн, арг]    — логарифм; ['lg', арг] — десятичный
     ['pow', осн, пок]    — степень
     ['root', n, x]       — корень n-й степени
     ['/', a, b]          — дробь (вертикальная, числитель над знаменателем)
     ['*', …], ['+', …]   — произведение, сумма; ['-', a, b]; ['neg', a]
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  /* ── случайности ── */
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  function shuffle(a){ a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  // генераторы подобраны так, что подходящее находится быстро; предел —
  // только защита от вечного цикла
  function tryGen(make, ok){
    for (let i = 0; i < 500; i++){ const v = make(); if (v && ok(v)) return v; }
    throw new Error('logarithms-bank: не удалось подобрать числа');
  }

  /* ── числа ── */
  function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while (b){ [a, b] = [b, a % b]; } return a; }
  function rat(p, q){ if (q < 0){ p = -p; q = -q; } const g = gcd(p, q) || 1; return [p / g, q / g]; }
  // дробь как запись эталона для поля: '5/3', '-2', '1/125'
  function ratStr(p, q){ [p, q] = rat(p, q); return q === 1 ? String(p) : p + '/' + q; }
  // дробь как дерево: 5/3 — вертикальная дробь, −5/2 — минус перед дробью
  function ratTree(p, q){
    [p, q] = rat(p, q);
    if (q === 1) return p;
    return p < 0 ? ['neg', ['/', -p, q]] : ['/', p, q];
  }
  const isPowOf = (n, p) => { if (n < p) return n === 1; while (n % p === 0) n /= p; return n === 1; };
  const divisors = n => { const d = []; for (let i = 2; i < n; i++) if (n % i === 0) d.push(i); return d; };

  /* ── конструкторы деревьев ── */
  const L = (b, a) => ['log', b, a];
  const LG = a => ['lg', a];
  const Pw = (b, e) => ['pow', b, e];
  const Fr = (a, b) => ['/', a, b];
  const Mul = (...x) => ['*', ...x];
  const Add = (...x) => ['+', ...x];
  const Sub = (a, b) => ['-', a, b];
  const Neg = a => ['neg', a];
  const Rt = (n, x) => ['root', n, x];
  const V = n => ['v', n];
  const SLOT = ['slot'];

  /* ═══════════════ рисование формул ═══════════════
     Свой маленький наборщик вместо KaTeX: формул немного, а KaTeX весит
     сотни килобайт и «Подборка» разбирает его вёрстку только через
     скрытую TeX-аннотацию. Здесь — обычные sub/sup и вертикальная дробь
     .frac/.num/.den, которую понимают и «Подборка», и снимок на доску.
     <wbr> после «+», «−» и «=» — места, где длинная строка может
     перенестись на телефоне (логарифм, степень и дробь не рвутся). */
  const PREC = { '+': 1, '-': 1, '*': 2, 'neg': 2, 'log': 3, 'lg': 3, 'pow': 4 };
  function prec(t){
    if (typeof t === 'number') return t < 0 ? 2 : 9;
    return PREC[t[0]] || 9;
  }
  const isNegative = t => (typeof t === 'number' && t < 0) || (Array.isArray(t) && t[0] === 'neg');
  function numHTML(n){
    const s = String(Math.abs(n)).replace('.', ',');
    return '<span class="mn">' + (n < 0 ? '−' : '') + s + '</span>';
  }
  const par = h => '<span class="mp">(</span>' + h + '<span class="mp">)</span>';
  function wrapIf(t, cond){ const h = render(t); return cond ? par(h) : h; }
  // аргумент логарифма: скобки у суммы, произведения, отрицательного и
  // вложенного логарифма; у степени, дроби и корня — нет (log₂ 8⁵, log₃ 54/2)
  function argHTML(t){
    const needs = isNegative(t) || (Array.isArray(t) && ['+', '-', '*', 'log', 'lg'].indexOf(t[0]) >= 0);
    return '<span class="la">' + (needs ? par(render(t)) : render(t)) + '</span>';
  }
  function render(t){
    if (typeof t === 'number') return numHTML(t);
    switch (t[0]){
      case 'v': return '<i class="mv">' + t[1] + '</i>';
      case 'slot': return '<span class="slot">?</span>';
      case '/': return '<span class="frac"><span class="num">' + render(t[1]) + '</span><span class="den">' + render(t[2]) + '</span></span>';
      case 'root':
        return '<span class="rt">' + (t[1] === 2 ? '' : '<span class="ri">' + t[1] + '</span>') +
          '<span class="rs">√</span><span class="rad">' + render(t[2]) + '</span></span>';
      case 'pow': {
        // основание в скобках, если это не простое число или буква
        const b = t[1];
        const simple = (typeof b === 'number' && b >= 0) || (Array.isArray(b) && (b[0] === 'v' || b[0] === 'slot'));
        return '<span class="pw">' + (simple ? render(b) : par(render(b))) + '<sup>' + render(t[2]) + '</sup></span>';
      }
      case 'log': return '<span class="lg">log<sub>' + render(t[1]) + '</sub></span>' + argHTML(t[2]);
      // между «lg» и аргументом — настоящий (тонкий) пробел, а не только
      // отступ: иначе в тексте «Подборки» выходило «lg4» вместо «lg 4»
      case 'lg': return '<span class="lg">lg</span>&#8202;' + argHTML(t[1]).replace('<span class="la">', '<span class="la lga">');
      case 'neg': return '<span class="mo">−</span>' + wrapIf(t[1], prec(t[1]) <= 2 && !(Array.isArray(t[1]) && t[1][0] === '*'));
      case '*': return t.slice(1).map((x, i) => wrapIf(x, prec(x) < 2 || (i > 0 && isNegative(x)))).join('<span class="mo">·</span>');
      case '+': return t.slice(1).map((x, i) => {
        if (i === 0) return render(x);
        if (typeof x === 'number' && x < 0) return '<span class="mo">−</span>' + numHTML(-x);
        if (Array.isArray(x) && x[0] === 'neg') return '<span class="mo">−</span>' + wrapIf(x[1], prec(x[1]) <= 1);
        return '<span class="mo">+</span><wbr>' + render(x);
      }).join('');
      case '-': return render(t[1]) + '<span class="mo">−</span><wbr>' + wrapIf(t[2], prec(t[2]) <= 1 || isNegative(t[2]));
    }
    return '';
  }

  /* Строчная запись для истории решённого: log₂(4·8), 2^(log₂ 3). */
  const SUBD = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', '−': '₋' };
  const SUPD = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '−': '⁻' };
  const small = (s, map, mark) => /^[0-9−]+$/.test(s) ? s.split('').map(c => map[c]).join('') : mark + '(' + s + ')';
  function plain(t){
    if (typeof t === 'number') return (t < 0 ? '−' : '') + String(Math.abs(t)).replace('.', ',');
    const pp = x => '(' + plain(x) + ')';
    switch (t[0]){
      case 'v': return t[1];
      case 'slot': return '?';
      case '/': { const a = plain(t[1]), b = plain(t[2]); return (/^[0-9a-z,−]+$/i.test(a) ? a : pp(t[1])) + '/' + (/^[0-9a-z,]+$/i.test(b) ? b : pp(t[2])); }
      case 'root': return (t[1] === 2 ? '√' : t[1] === 3 ? '∛' : t[1] + '√') + (typeof t[2] === 'number' ? plain(t[2]) : pp(t[2]));
      case 'pow': { const b = t[1]; const simple = (typeof b === 'number' && b >= 0) || (Array.isArray(b) && b[0] === 'v'); return (simple ? plain(b) : pp(b)) + small(plain(t[2]), SUPD, '^'); }
      case 'log': { const a = t[2], needs = isNegative(a) || (Array.isArray(a) && ['+', '-', '*', 'log', 'lg', '/'].indexOf(a[0]) >= 0); return 'log' + small(plain(t[1]), SUBD, '_') + (needs ? pp(a) : ' ' + plain(a)); }
      case 'lg': { const a = t[1], needs = Array.isArray(a) && a[0] !== 'v' && a[0] !== 'pow'; return 'lg' + (needs ? pp(a) : ' ' + plain(a)); }
      case 'neg': return '−' + (prec(t[1]) <= 2 ? pp(t[1]) : plain(t[1]));
      case '*': return t.slice(1).map((x, i) => (prec(x) < 2 || (i > 0 && isNegative(x))) ? pp(x) : plain(x)).join('·');
      case '+': return t.slice(1).map((x, i) => i === 0 ? plain(x) : (isNegative(x) ? ' − ' + plain(typeof x === 'number' ? -x : x[1]) : ' + ' + plain(x))).join('');
      case '-': return plain(t[1]) + ' − ' + (prec(t[2]) <= 1 || isNegative(t[2]) ? pp(t[2]) : plain(t[2]));
    }
    return '';
  }

  /* ═══════════════ свойства ═══════════════
     Группа задаёт цвет плитки и метки свойства в решении. */
  const GROUPS = [
    { id: 'base', title: 'Определение', color: '#2E7DE0' },
    { id: 'ops', title: 'Действия', color: '#1F9D63' },
    { id: 'pow', title: 'Степени', color: '#8E5BD9' },
    { id: 'change', title: 'Основание', color: '#E0782E' },
  ];
  const PROPS = [
    { id: 'ident',   group: 'base',   title: 'Основное логарифмическое тождество' },
    { id: 'unit',    group: 'base',   title: 'Логарифм единицы и основания' },
    { id: 'prod',    group: 'ops',    title: 'Логарифм произведения' },
    { id: 'quot',    group: 'ops',    title: 'Логарифм частного' },
    { id: 'pow',     group: 'ops',    title: 'Логарифм степени' },
    { id: 'basepow', group: 'pow',    title: 'Степень в основании' },
    { id: 'bothpow', group: 'pow',    title: 'Степени в основании и аргументе' },
    { id: 'change',  group: 'change', title: 'Переход к новому основанию' },
    { id: 'swap',    group: 'change', title: 'Перемена основания и аргумента' },
    { id: 'expswap', group: 'change', title: 'Обмен основания и аргумента в степени' },
  ];
  const propById = id => PROPS.find(p => p.id === id);
  const groupById = id => GROUPS.find(g => g.id === id) || GROUPS[0];
  // подписи шагов решения: свойство логарифмов — его названием и цветом
  // плитки; вспомогательный шаг (вычисление, свойство степеней) — серым
  const STEP = {
    def: { text: 'по определению логарифма' },
    arith: { text: 'вычисляем' },
    rewrite: { text: 'записываем число как степень' },
    powrule: { text: 'свойство степеней' },
  };
  function stepTag(p){
    const pr = propById(p);
    if (pr) return '<span class="prop-tag" style="--acc:' + groupById(pr.group).color + '">' + pr.title.toLowerCase() + '</span>';
    return '<span class="prop-tag aux">' + ((STEP[p] || {}).text || p) + '</span>';
  }

  /* ═══════════════ сборка задания ═══════════════
     spec от генератора:
       { type, kind:'calc', expr, links:[[свойство, дерево]…], ans:[p,q] }
       { type, kind:'slot', lhs, rhs (с ['slot']), links, ans, vars? }
       { type, kind:'choice', expr, good, bad:[…], links, vars? }
     type — вычислить / упростить / в обратную сторону / формула.
     links — решение: цепочка «= следующее выражение» с подписью свойства. */
  const TYPES = { calc: 'Вычислить', simp: 'Упростить', rev: 'В обратную сторону', know: 'Формула' };
  const ASK = {
    calc: 'Вычислите:',
    slot: 'Впишите число вместо <span class="slot">?</span>, чтобы равенство стало верным:',
  };
  const VAR_NOTE = '<div class="log-note">Все буквы — положительные числа, основания логарифмов не равны 1.</div>';
  function fillSlot(t, v){
    if (!Array.isArray(t)) return t;
    if (t[0] === 'slot') return v;
    return t.map((x, i) => i === 0 ? x : fillSlot(x, v));
  }
  let serial = 0;
  function build(pid, lvl, spec){
    const t = { pid, lvl, type: spec.type, kind: spec.kind, key: pid + '-' + lvl + '-' + Date.now().toString(36) + '-' + (++serial) + '-' + Math.random().toString(36).slice(2, 6) };
    let first;
    if (spec.kind === 'calc'){
      first = spec.expr;
      t.text = '<div class="log-ask">' + ASK.calc + '</div><div class="log-expr">' + render(spec.expr) + '</div>';
      const v = ratStr(spec.ans[0], spec.ans[1]);
      t.fields = [{ id: 'a', label: 'Ответ:', type: 'num', value: v }];
      t.answer = render(ratTree(spec.ans[0], spec.ans[1]));
      t.meta = { expr: spec.expr, ans: v };
    } else if (spec.kind === 'slot'){
      const ansT = ratTree(spec.ans[0], spec.ans[1]);
      first = fillSlot(spec.lhs, ansT);
      t.text = '<div class="log-ask">' + ASK.slot + '</div><div class="log-expr">' + render(spec.lhs) + '<span class="mo eq">=</span>' + render(spec.rhs) + '</div>' + (spec.vars ? VAR_NOTE : '');
      const v = ratStr(spec.ans[0], spec.ans[1]);
      t.fields = [{ id: 'a', label: '<span class="slot">?</span> =', type: 'num', value: v }];
      t.answer = render(ansT);
      t.slotEq = render(fillSlot(spec.lhs, ansT)) + '<span class="mo eq">=</span>' + render(fillSlot(spec.rhs, ansT));
      t.meta = { lhs: spec.lhs, rhs: spec.rhs, ans: v, vars: spec.vars || null };
    } else {
      first = spec.first || spec.expr;
      const opts = shuffle([spec.good].concat(spec.bad));
      const correct = opts.indexOf(spec.good);
      t.text = '<div class="log-ask">Какое выражение равно <span class="log-inline">' + render(spec.expr) + '</span>?</div>' + (spec.vars ? VAR_NOTE : '');
      t.choice = { opts: opts.map(render), correct };
      t.answer = render(spec.good);
      t.meta = { expr: spec.expr, opts, correct, vars: spec.vars || null };
    }
    // решение: первая строка «выражение = …», дальше «= …»
    const trees = [first].concat(spec.links.map(l => l[1]));
    t.steps = spec.links.map((l, i) =>
      '<div class="step-line">' + stepTag(l[0]) + '<div class="step-math">' +
        (i === 0 ? render(first) : '') + '<span class="mo eq">=</span><wbr>' + render(l[1]) + '</div></div>');
    t.props = [...new Set(spec.links.map(l => l[0]).filter(p => propById(p)))];
    t.meta.chain = trees;
    t.peek = spec.kind === 'slot' ? plain(spec.lhs) + ' = ' + plain(spec.rhs) : plain(spec.expr);
    return t;
  }

  /* ═══════════════ генераторы по свойствам ═══════════════
     GEN[свойство][уровень] — список форм; каждая форма отдаёт spec.
     Числа подбираются так, чтобы ответ был «школьным»: целое или
     несложная дробь, степени — в пределах таблицы. */
  const x = V('x'), y = V('y'), a = V('a'), b = V('b'), c = V('c');
  const SMALL_BASES = [2, 3, 5, 7];
  // основание, показатель и сама степень с ограничением сверху
  function powPick(bases, kMin, kMax, max){
    return tryGen(() => { const p = pick(bases), k = ri(kMin, kMax); return { p, k, v: Math.pow(p, k) }; }, o => o.v <= max);
  }
  // не степень основания и не единица — чтобы логарифм не считался «в лоб»
  const plainNum = (from, to, p, extra) => tryGen(() => ri(from, to), n => !isPowOf(n, p) && gcd(n, p) === 1 && (!extra || extra(n)));

  const GEN = {
    /* ── a^(log_a b) = b ── */
    ident: {
      1: [
        () => { const p = pick([2, 3, 5, 6, 7]), n = plainNum(2, 15, p);
          return { type: 'calc', kind: 'calc', expr: Pw(p, L(p, n)), links: [['ident', n]], ans: [n, 1] }; },
        () => { const n = ri(2, 30);
          return { type: 'calc', kind: 'calc', expr: Pw(10, LG(n)), links: [['ident', n]], ans: [n, 1] }; },
        () => { const p = pick([2, 3, 5]), q = pick([6, 7]), m = plainNum(2, 9, p), n = plainNum(2, 9, q);
          return { type: 'calc', kind: 'calc', expr: Add(Pw(p, L(p, m)), Pw(q, L(q, n))), links: [['ident', Add(m, n)], ['arith', m + n]], ans: [m + n, 1] }; },
        () => { const p = pick([2, 3, 5, 7]), n = plainNum(3, 20, p);
          return { type: 'rev', kind: 'slot', lhs: n, rhs: Pw(p, L(p, SLOT)), links: [['ident', Pw(p, L(p, n))]], ans: [n, 1] }; },
        () => ({ type: 'know', kind: 'choice', vars: true, expr: Pw(a, L(a, b)), good: b,
          bad: [a, L(a, b), Mul(a, b)], links: [['ident', b]] }),
      ],
      2: [
        // 4^(log₂ 3) = (2^(log₂ 3))² = 9
        () => { const o = powPick([2, 3, 5], 2, 3, 125), n = plainNum(2, 9, o.p, v => Math.pow(v, o.k) <= 729);
          return { type: 'calc', kind: 'calc', expr: Pw(o.v, L(o.p, n)),
            links: [['rewrite', Pw(Pw(o.p, o.k), L(o.p, n))], ['powrule', Pw(Pw(o.p, L(o.p, n)), o.k)], ['ident', Pw(n, o.k)], ['arith', Math.pow(n, o.k)]], ans: [Math.pow(n, o.k), 1] }; },
        // 3^(log₃ 4 + 2) = 4 · 9
        () => { const o = powPick([2, 3, 5], 1, 3, 27), n = plainNum(2, 9, o.p);
          return { type: 'calc', kind: 'calc', expr: Pw(o.p, Add(L(o.p, n), o.k)),
            links: [['powrule', Mul(Pw(o.p, L(o.p, n)), Pw(o.p, o.k))], ['ident', Mul(n, o.v)], ['arith', n * o.v]], ans: [n * o.v, 1] }; },
        // 2^(2·log₂ 3) = 9
        () => { const p = pick([2, 3, 5, 7]), k = ri(2, 3), n = plainNum(2, 9, p, v => Math.pow(v, k) <= 729);
          return { type: 'calc', kind: 'calc', expr: Pw(p, Mul(k, L(p, n))),
            links: [['powrule', Pw(Pw(p, L(p, n)), k)], ['ident', Pw(n, k)], ['arith', Math.pow(n, k)]], ans: [Math.pow(n, k), 1] }; },
      ],
      3: [
        // 6^(2 − log₆ 4) = 36 : 4
        () => tryGen(() => { const p = pick([6, 10, 12, 14, 15]), k = p <= 10 ? ri(2, 3) : 2, N = Math.pow(p, k);
            const ds = divisors(N).filter(d => !isPowOf(d, p) && d < 60);
            if (!ds.length) return null;
            const d = pick(ds);
            const expr = p === 10 ? Pw(10, Sub(k, LG(d))) : Pw(p, Sub(k, L(p, d)));
            return { type: 'calc', kind: 'calc', expr,
              links: [['powrule', Fr(Pw(p, k), p === 10 ? Pw(10, LG(d)) : Pw(p, L(p, d)))], ['ident', Fr(N, d)], ['arith', N / d]], ans: [N / d, 1] }; }, () => true),
        // (1/2)^(log₂ 5) = 1/5
        () => { const p = pick([2, 3, 5, 7]), n = plainNum(2, 11, p);
          return { type: 'calc', kind: 'calc', expr: Pw(Fr(1, p), L(p, n)),
            links: [['rewrite', Pw(Pw(p, -1), L(p, n))], ['powrule', Pw(Pw(p, L(p, n)), -1)], ['ident', Pw(n, -1)], ['arith', Fr(1, n)]], ans: [1, n] }; },
        // 2^(½·log₂ 9) = 3
        () => { const p = pick([2, 3, 5, 7]), k = ri(2, 3), n = plainNum(2, 9, p, v => Math.pow(v, k) <= 1000), N = Math.pow(n, k);
          return { type: 'calc', kind: 'calc', expr: Pw(p, Mul(Fr(1, k), L(p, N))),
            links: [['powrule', Pw(Pw(p, L(p, N)), Fr(1, k))], ['ident', Pw(N, Fr(1, k))], ['arith', n]], ans: [n, 1] }; },
      ],
    },

    /* ── log_a 1 = 0, log_a a = 1 ── */
    unit: {
      1: [
        () => { const p = ri(2, 20); return { type: 'calc', kind: 'calc', expr: L(p, 1), links: [['unit', 0]], ans: [0, 1] }; },
        () => { const p = ri(2, 20); return { type: 'calc', kind: 'calc', expr: L(p, p), links: [['unit', 1]], ans: [1, 1] }; },
        () => { const p = ri(2, 13), q = ri(2, 13), k = ri(2, 9);
          return pick([
            { type: 'calc', kind: 'calc', expr: Add(L(p, p), L(q, 1)), links: [['unit', Add(1, 0)], ['arith', 1]], ans: [1, 1] },
            { type: 'calc', kind: 'calc', expr: Mul(k, L(p, p)), links: [['unit', Mul(k, 1)], ['arith', k]], ans: [k, 1] },
          ]); },
        () => { const p = ri(2, 15);
          return pick([
            { type: 'rev', kind: 'slot', lhs: L(p, SLOT), rhs: 0, links: [['unit', 0]], ans: [1, 1] },
            { type: 'rev', kind: 'slot', lhs: L(p, SLOT), rhs: 1, links: [['unit', 1]], ans: [p, 1] },
          ]); },
      ],
      2: [
        () => { const p = pick([2, 3, 5, 7]);
          return pick([
            { type: 'calc', kind: 'calc', expr: L(Fr(1, p), Fr(1, p)), links: [['unit', 1]], ans: [1, 1] },
            { type: 'calc', kind: 'calc', expr: L(Rt(2, p), 1), links: [['unit', 0]], ans: [0, 1] },
            { type: 'calc', kind: 'calc', expr: L(Rt(2, p), Rt(2, p)), links: [['unit', 1]], ans: [1, 1] },
            { type: 'calc', kind: 'calc', expr: L(pick([0.2, 0.5, 2.5, 1.5]), 1), links: [['unit', 0]], ans: [0, 1] },
          ]); },
        () => { const p = ri(2, 9), q = ri(2, 9), r = ri(10, 15), k = ri(2, 6), m = ri(2, 9);
          return { type: 'calc', kind: 'calc', expr: Add(Sub(Mul(k, L(p, p)), Mul(m, L(q, 1))), L(r, r)),
            links: [['unit', Add(Sub(Mul(k, 1), Mul(m, 0)), 1)], ['arith', k + 1]], ans: [k + 1, 1] }; },
        () => { const p = ri(2, 9), q = tryGen(() => ri(2, 9), v => v !== p);
          return { type: 'know', kind: 'choice', expr: 1, first: L(p, p), good: L(p, p),
            bad: [L(p, 1), Sub(L(p, p), L(q, q)), Mul(2, L(q, q))], links: [['unit', 1]] }; },
      ],
      3: [
        () => { const p = ri(2, 9), q = ri(2, 9);
          return { type: 'calc', kind: 'calc', expr: L(p, L(q, q)), links: [['unit', L(p, 1)], ['unit', 0]], ans: [0, 1] }; },
        () => { const p = ri(3, 9), q = ri(2, 9);
          return { type: 'calc', kind: 'calc', expr: L(p, Add(L(q, q), p - 1)), links: [['unit', L(p, Add(1, p - 1))], ['arith', L(p, p)], ['unit', 1]], ans: [1, 1] }; },
        () => { const p = ri(2, 9), q = ri(2, 9), r = ri(2, 9), k = ri(2, 5);
          return { type: 'calc', kind: 'calc', expr: Add(Pw(L(p, p), k), L(q, L(r, r))),
            links: [['unit', Add(Pw(1, k), L(q, 1))], ['unit', Add(1, 0)], ['arith', 1]], ans: [1, 1] }; },
        () => { const n = ri(2, 30), k = ri(2, 5);
          return { type: 'rev', kind: 'slot', lhs: Mul(k, L(SLOT, n)), rhs: k, links: [['unit', Mul(k, 1)], ['arith', k]], ans: [n, 1] }; },
      ],
    },

    /* ── log_a(bc) = log_a b + log_a c ── */
    prod: {
      1: [
        // log₆ 4 + log₆ 9 = log₆ 36 = 2
        () => tryGen(() => { const p = pick([6, 10, 12, 14, 15, 18, 20]), k = p <= 10 ? pick([2, 3]) : 2, N = Math.pow(p, k);
            const ds = divisors(N).filter(d => !isPowOf(d, p) && !isPowOf(N / d, p) && d <= N / d);
            if (!ds.length) return null;
            const m = pick(ds), n = N / m, Lp = v => p === 10 ? LG(v) : L(p, v);
            return { type: 'calc', kind: 'calc', expr: Add(Lp(m), Lp(n)), links: [['prod', Lp(Mul(m, n))], ['arith', Lp(N)], ['def', k]], ans: [k, 1] }; }, () => true),
        // log₂(8·5) = ? + log₂ 5
        () => { const o = powPick([2, 3, 5], 1, 4, 81), m = plainNum(3, 11, o.p);
          return { type: 'simp', kind: 'slot', lhs: L(o.p, Mul(o.v, m)), rhs: Add(SLOT, L(o.p, m)),
            links: [['prod', Add(L(o.p, o.v), L(o.p, m))], ['def', Add(o.k, L(o.p, m))]], ans: [o.k, 1] }; },
        () => ({ type: 'know', kind: 'choice', vars: true, expr: L(a, Mul(x, y)), good: Add(L(a, x), L(a, y)),
          bad: [Mul(L(a, x), L(a, y)), Sub(L(a, x), L(a, y)), Mul(x, L(a, y))], links: [['prod', Add(L(a, x), L(a, y))]] }),
      ],
      2: [
        // log₃ 5 + log₃ 7 = log₃ ?
        () => { const p = pick(SMALL_BASES), m = plainNum(2, 12, p), n = plainNum(2, 12, p, v => v * m <= 150 && v !== m);
          return { type: 'rev', kind: 'slot', lhs: Add(L(p, m), L(p, n)), rhs: L(p, SLOT), links: [['prod', L(p, Mul(m, n))], ['arith', L(p, m * n)]], ans: [m * n, 1] }; },
        // log₁₂ 2 + log₁₂ 8 + log₁₂ 9 = 2
        () => tryGen(() => { const p = pick([6, 10, 12, 15, 18]), k = p <= 10 ? pick([2, 3]) : 2, N = Math.pow(p, k);
            const m = pick(divisors(N)), rest = N / m, n = pick(divisors(rest).concat([0]));
            if (!n || rest / n < 2) return null;
            const r = rest / n, Lp = v => p === 10 ? LG(v) : L(p, v);
            if ([m, n, r].some(v => v === p)) return null;
            return { type: 'calc', kind: 'calc', expr: Add(Lp(m), Lp(n), Lp(r)), links: [['prod', Lp(Mul(m, n, r))], ['arith', Lp(N)], ['def', k]], ans: [k, 1] }; }, () => true),
        // log₂ 40 = ? + log₂ 5
        () => { const o = powPick([2, 3, 5], 1, 4, 81), m = plainNum(3, 11, o.p);
          return { type: 'simp', kind: 'slot', lhs: L(o.p, o.v * m), rhs: Add(SLOT, L(o.p, m)),
            links: [['arith', L(o.p, Mul(o.v, m))], ['prod', Add(L(o.p, o.v), L(o.p, m))], ['def', Add(o.k, L(o.p, m))]], ans: [o.k, 1] }; },
      ],
      3: [
        // log₈ 5 + log₈ 1,6 = log₈ 8; log₁₆ 5 + log₁₆ 0,8 = ½
        () => tryGen(() => { const p = pick([2, 3]), m = ri(2, p === 2 ? 4 : 3), B = Math.pow(p, m), s = ri(1, 5), T = Math.pow(p, s);
            if (T > 81 || s === m) return null;
            const n = pick([5, 25, 4, 20, 2, 10].filter(v => gcd(v, p) === 1 || p === 3));
            const cc = T / n;
            if (Number.isInteger(cc) || Math.abs(Math.round(cc * 100) - cc * 100) > 1e-9 || cc > 100) return null;
            const cv = Math.round(cc * 100) / 100;
            return { type: 'calc', kind: 'calc', expr: Add(L(B, n), L(B, cv)), links: [['prod', L(B, Mul(n, cv))], ['arith', L(B, T)], ['def', ratTree(s, m)]], ans: [s, m] }; }, () => true),
        // lg 8 + lg 12,5 = 2
        () => tryGen(() => { const k = ri(1, 3), T = Math.pow(10, k), n = pick([2, 4, 8, 16, 5, 25, 125, 40, 80]);
            const cc = T / n;
            if (Number.isInteger(cc) && cc % 10 === 0) return null;
            if (Math.abs(Math.round(cc * 1000) - cc * 1000) > 1e-9 || n >= T) return null;
            const cv = Math.round(cc * 1000) / 1000;
            return { type: 'calc', kind: 'calc', expr: Add(LG(n), LG(cv)), links: [['prod', LG(Mul(n, cv))], ['arith', LG(T)], ['def', k]], ans: [k, 1] }; }, () => true),
        // log₂(1/3) + log₂ 6 = log₂ ?
        () => { const p = pick(SMALL_BASES), n = plainNum(2, 7, p), q = ri(2, 6), m = n * q;
          return { type: 'rev', kind: 'slot', lhs: Add(L(p, Fr(1, n)), L(p, m)), rhs: L(p, SLOT), links: [['prod', L(p, Mul(Fr(1, n), m))], ['arith', L(p, q)]], ans: [q, 1] }; },
      ],
    },

    /* ── log_a(b/c) = log_a b − log_a c ── */
    quot: {
      1: [
        // log₂ 48 − log₂ 3 = log₂ 16 = 4
        () => { const o = powPick([2, 3, 5], 1, 4, 81), m = plainNum(3, 9, o.p, v => v * o.v <= 500), n = m * o.v;
          return { type: 'calc', kind: 'calc', expr: Sub(L(o.p, n), L(o.p, m)), links: [['quot', L(o.p, Fr(n, m))], ['arith', L(o.p, o.v)], ['def', o.k]], ans: [o.k, 1] }; },
        // log₃(x/9) = log₃ x − ?
        () => { const o = powPick([2, 3, 5], 1, 4, 125);
          return { type: 'simp', kind: 'slot', vars: true, lhs: L(o.p, Fr(x, o.v)), rhs: Sub(L(o.p, x), SLOT),
            links: [['quot', Sub(L(o.p, x), L(o.p, o.v))], ['def', Sub(L(o.p, x), o.k)]], ans: [o.k, 1] }; },
        () => ({ type: 'know', kind: 'choice', vars: true, expr: L(a, Fr(x, y)), good: Sub(L(a, x), L(a, y)),
          bad: [Fr(L(a, x), L(a, y)), Sub(L(a, y), L(a, x)), Add(L(a, x), L(a, y))], links: [['quot', Sub(L(a, x), L(a, y))]] }),
      ],
      2: [
        // log₂ 5 − log₂ 40 = −3
        () => { const o = powPick([2, 3, 5], 1, 4, 81), m = plainNum(3, 9, o.p, v => v * o.v <= 500), n = m * o.v;
          return { type: 'calc', kind: 'calc', expr: Sub(L(o.p, m), L(o.p, n)), links: [['quot', L(o.p, Fr(m, n))], ['arith', L(o.p, Fr(1, o.v))], ['def', -o.k]], ans: [-o.k, 1] }; },
        // log₇ 30 − log₇ 5 = log₇ ?
        () => { const p = pick(SMALL_BASES), m = plainNum(2, 9, p), q = plainNum(2, 12, p, v => v !== m);
          return { type: 'rev', kind: 'slot', lhs: Sub(L(p, m * q), L(p, m)), rhs: L(p, SLOT), links: [['quot', L(p, Fr(m * q, m))], ['arith', L(p, q)]], ans: [q, 1] }; },
        // lg 500 − lg 5 = 2
        () => { const m = pick([2, 3, 4, 5, 7, 8]), k = ri(1, 2), n = m * Math.pow(10, k), up = Math.random() < 0.6;
          return up
            ? { type: 'calc', kind: 'calc', expr: Sub(LG(n), LG(m)), links: [['quot', LG(Fr(n, m))], ['arith', LG(Math.pow(10, k))], ['def', k]], ans: [k, 1] }
            : { type: 'calc', kind: 'calc', expr: Sub(LG(m), LG(n)), links: [['quot', LG(Fr(m, n))], ['arith', LG(Fr(1, Math.pow(10, k)))], ['def', -k]], ans: [-k, 1] }; },
      ],
      3: [
        // log₄ 24 − log₄ 3 = log₄ 8 = 3/2
        () => tryGen(() => { const p = pick([2, 3, 5]), m = ri(2, p === 2 ? 4 : 3), B = Math.pow(p, m), s = ri(1, 5), T = Math.pow(p, s);
            if (B > 81 || T > 243 || s % m === 0) return null;
            const n = plainNum(3, 7, p), N = n * T;
            if (N > 1000) return null;
            return { type: 'calc', kind: 'calc', expr: Sub(L(B, N), L(B, n)), links: [['quot', L(B, Fr(N, n))], ['arith', L(B, T)], ['def', ratTree(s, m)]], ans: [s, m] }; }, () => true),
        // log₂ 96 − log₂ 3 − log₂ 4 = 3
        () => tryGen(() => { const o = powPick([2, 3], 1, 3, 27), m = plainNum(3, 7, o.p), n = ri(2, 6), N = m * n * o.v;
            if (N > 1000) return null;
            return { type: 'calc', kind: 'calc', expr: Sub(Sub(L(o.p, N), L(o.p, m)), L(o.p, n)),
              links: [['quot', Sub(L(o.p, Fr(N, m)), L(o.p, n))], ['arith', Sub(L(o.p, N / m), L(o.p, n))], ['quot', L(o.p, Fr(N / m, n))], ['arith', L(o.p, o.v)], ['def', o.k]], ans: [o.k, 1] }; }, () => true),
        // log₅ 6 − log₅ 9 = log₅ ?  (ответ — дробь)
        () => tryGen(() => { const p = pick(SMALL_BASES), g = ri(2, 4), m = ri(2, 5), n = ri(2, 5);
            if (gcd(m, n) !== 1 || m === n || [m * g, n * g].some(v => isPowOf(v, p))) return null;
            return { type: 'rev', kind: 'slot', lhs: Sub(L(p, m * g), L(p, n * g)), rhs: L(p, SLOT), links: [['quot', L(p, Fr(m * g, n * g))], ['arith', L(p, Fr(m, n))]], ans: [m, n] }; }, () => true),
      ],
    },

    /* ── log_a bⁿ = n·log_a b ── */
    pow: {
      1: [
        () => { const p = pick(SMALL_BASES), n = ri(2, 9), v = pick([x, b]);
          return { type: 'simp', kind: 'slot', vars: true, lhs: L(p, Pw(v, n)), rhs: Mul(SLOT, L(p, v)), links: [['pow', Mul(n, L(p, v))]], ans: [n, 1] }; },
        // 3·log₂ 5 = log₂ ?
        () => { const p = pick(SMALL_BASES), n = ri(2, 3), m = plainNum(2, 6, p, v => Math.pow(v, n) <= 250);
          return { type: 'rev', kind: 'slot', lhs: Mul(n, L(p, m)), rhs: L(p, SLOT), links: [['pow', L(p, Pw(m, n))], ['arith', L(p, Math.pow(m, n))]], ans: [Math.pow(m, n), 1] }; },
        // log₂ 4⁵ = 5·log₂ 4 = 10
        () => { const o = powPick([2, 3, 5], 1, 3, 27), n = ri(2, 6);
          return { type: 'calc', kind: 'calc', expr: L(o.p, Pw(o.v, n)), links: [['pow', Mul(n, L(o.p, o.v))], ['def', Mul(n, o.k)], ['arith', n * o.k]], ans: [n * o.k, 1] }; },
        () => ({ type: 'know', kind: 'choice', vars: true, expr: L(a, Pw(x, V('n'))), good: Mul(V('n'), L(a, x)),
          bad: [Pw(L(a, x), V('n')), L(a, Mul(V('n'), x)), Add(V('n'), L(a, x))], links: [['pow', Mul(V('n'), L(a, x))]] }),
      ],
      2: [
        () => { const p = pick([2, 3, 5]);
          return pick([
            (() => { const k = ri(1, 4), A = Math.pow(p, k); return { type: 'calc', kind: 'calc', expr: L(p, Fr(1, A)), links: [['rewrite', L(p, Pw(p, -k))], ['pow', Mul(-k, L(p, p))], ['unit', -k]], ans: [-k, 1] }; })(),
            (() => { const n = ri(2, 4); return { type: 'calc', kind: 'calc', expr: L(p, Rt(n, p)), links: [['rewrite', L(p, Pw(p, Fr(1, n)))], ['pow', Mul(Fr(1, n), L(p, p))], ['unit', Fr(1, n)]], ans: [1, n] }; })(),
            (() => { const n = ri(3, 5), m = tryGen(() => ri(2, n + 2), v => gcd(v, n) === 1 && Math.pow(p, v) <= 1000); return { type: 'calc', kind: 'calc', expr: L(p, Rt(n, Math.pow(p, m))), links: [['rewrite', L(p, Pw(p, Fr(m, n)))], ['pow', Mul(Fr(m, n), L(p, p))], ['unit', Fr(m, n)]], ans: [m, n] }; })(),
            { type: 'calc', kind: 'calc', expr: L(p, Fr(1, Rt(2, p))), links: [['rewrite', L(p, Pw(p, Neg(Fr(1, 2))))], ['pow', Mul(Neg(Fr(1, 2)), L(p, p))], ['unit', Neg(Fr(1, 2))]], ans: [-1, 2] },
          ]); },
        () => { const p = pick(SMALL_BASES), n = ri(2, 5), m = ri(2, 5);
          return pick([
            { type: 'simp', kind: 'slot', vars: true, lhs: L(p, Fr(1, Pw(x, n))), rhs: Mul(SLOT, L(p, x)), links: [['rewrite', L(p, Pw(x, -n))], ['pow', Mul(-n, L(p, x))]], ans: [-n, 1] },
            { type: 'simp', kind: 'slot', vars: true, lhs: L(p, Rt(n, x)), rhs: Mul(SLOT, L(p, x)), links: [['rewrite', L(p, Pw(x, Fr(1, n)))], ['pow', Mul(Fr(1, n), L(p, x))]], ans: [1, n] },
            { type: 'simp', kind: 'slot', vars: true, lhs: L(p, Rt(n, Pw(x, m))), rhs: Mul(SLOT, L(p, x)), links: [['rewrite', L(p, Pw(x, ratTree(m, n)))], ['pow', Mul(ratTree(m, n), L(p, x))]], ans: [m, n] },
          ]); },
      ],
      3: [
        // log₂ (∛4)⁶ = 6·(2/3) = 4
        () => tryGen(() => { const p = pick([2, 3, 5]), k = ri(2, 3), j = ri(1, k + 1), n = ri(2, 6), P = Math.pow(p, j);
            if (j === k || P > 125) return null;
            return { type: 'calc', kind: 'calc', expr: L(p, Pw(Rt(k, P), n)),
              links: [['pow', Mul(n, L(p, Rt(k, P)))], ['rewrite', Mul(n, L(p, Pw(p, ratTree(j, k))))], ['pow', Mul(n, ratTree(j, k))], ['arith', ratTree(n * j, k)]], ans: [n * j, k] }; }, () => true),
        // ½·log₃ 49 = log₃ ?;  −2·log₅ 3 = log₅ ?
        () => { const p = pick(SMALL_BASES), m = plainNum(2, 7, p);
          return pick([
            { type: 'rev', kind: 'slot', lhs: Mul(Fr(1, 2), L(p, m * m)), rhs: L(p, SLOT), links: [['pow', L(p, Pw(m * m, Fr(1, 2)))], ['arith', L(p, m)]], ans: [m, 1] },
            { type: 'rev', kind: 'slot', lhs: Mul(-2, L(p, m)), rhs: L(p, SLOT), links: [['pow', L(p, Pw(m, -2))], ['arith', L(p, Fr(1, m * m))]], ans: [1, m * m] },
            { type: 'rev', kind: 'slot', lhs: Mul(Fr(2, 3), L(p, m * m * m)), rhs: L(p, SLOT), links: [['pow', L(p, Pw(m * m * m, Fr(2, 3)))], ['arith', L(p, m * m)]], ans: [m * m, 1] },
          ]); },
        // log₂ (1/4)³ = −6
        () => { const o = powPick([2, 3, 5], 1, 3, 27), n = ri(2, 5);
          return { type: 'calc', kind: 'calc', expr: L(o.p, Pw(Fr(1, o.v), n)),
            links: [['pow', Mul(n, L(o.p, Fr(1, o.v)))], ['rewrite', Mul(n, L(o.p, Pw(o.p, -o.k)))], ['pow', Mul(n, -o.k)], ['arith', -n * o.k]], ans: [-n * o.k, 1] }; },
      ],
    },

    /* ── log_(a^k) b = (1/k)·log_a b ── */
    basepow: {
      1: [
        // log₄ 32 = ½·log₂ 32 = 5/2
        () => tryGen(() => { const p = pick([2, 3, 5]), k = ri(2, 3), B = Math.pow(p, k), j = ri(1, 6), P = Math.pow(p, j);
            if (B > 125 || P > 729 || j % k === 0) return null;
            return { type: 'calc', kind: 'calc', expr: L(B, P),
              links: [['rewrite', L(Pw(p, k), P)], ['basepow', Mul(Fr(1, k), L(p, P))], ['def', Mul(Fr(1, k), j)], ['arith', ratTree(j, k)]], ans: [j, k] }; }, () => true),
        () => { const k = ri(2, 5);
          return { type: 'simp', kind: 'slot', vars: true, lhs: L(Pw(a, k), x), rhs: Mul(SLOT, L(a, x)), links: [['basepow', Mul(Fr(1, k), L(a, x))]], ans: [1, k] }; },
        () => ({ type: 'know', kind: 'choice', vars: true, expr: L(Pw(a, 3), x), good: Mul(Fr(1, 3), L(a, x)),
          bad: [Mul(3, L(a, x)), L(a, Fr(x, 3)), Sub(L(a, x), 3)], links: [['basepow', Mul(Fr(1, 3), L(a, x))]] }),
      ],
      2: [
        // log₂₅ x = ?·log₅ x
        () => { const o = powPick([2, 3, 5, 7], 2, 3, 125);
          return { type: 'simp', kind: 'slot', vars: true, lhs: L(o.v, x), rhs: Mul(SLOT, L(o.p, x)), links: [['rewrite', L(Pw(o.p, o.k), x)], ['basepow', Mul(Fr(1, o.k), L(o.p, x))]], ans: [1, o.k] }; },
        // log_√3 9 = 2·log₃ 9 = 4
        () => { const o = powPick([2, 3, 5], 1, 5, 243);
          return { type: 'calc', kind: 'calc', expr: L(Rt(2, o.p), o.v),
            links: [['rewrite', L(Pw(o.p, Fr(1, 2)), o.v)], ['basepow', Mul(2, L(o.p, o.v))], ['def', Mul(2, o.k)], ['arith', 2 * o.k]], ans: [2 * o.k, 1] }; },
        // log_(1/2) 8 = −log₂ 8 = −3
        () => { const o = powPick([2, 3, 5], 1, 6, 729);
          return { type: 'calc', kind: 'calc', expr: L(Fr(1, o.p), o.v),
            links: [['rewrite', L(Pw(o.p, -1), o.v)], ['basepow', Neg(L(o.p, o.v))], ['def', -o.k]], ans: [-o.k, 1] }; },
      ],
      3: [
        // log_(1/4) 32 = −5/2
        () => tryGen(() => { const p = pick([2, 3]), k = ri(2, 3), B = Math.pow(p, k), j = ri(1, 6), P = Math.pow(p, j);
            if (B > 27 || P > 243 || j % k === 0) return null;
            return { type: 'calc', kind: 'calc', expr: L(Fr(1, B), P),
              links: [['rewrite', L(Pw(p, -k), P)], ['basepow', Mul(Neg(Fr(1, k)), L(p, P))], ['def', Mul(Neg(Fr(1, k)), j)], ['arith', ratTree(-j, k)]], ans: [-j, k] }; }, () => true),
        // log_∛5 25 = 6
        () => { const o = powPick([2, 3, 5], 1, 4, 81);
          return { type: 'calc', kind: 'calc', expr: L(Rt(3, o.p), o.v),
            links: [['rewrite', L(Pw(o.p, Fr(1, 3)), o.v)], ['basepow', Mul(3, L(o.p, o.v))], ['def', Mul(3, o.k)], ['arith', 3 * o.k]], ans: [3 * o.k, 1] }; },
        // ⅓·log₅ x = log_? x;  −log₂ x = log_? x
        () => { const o = powPick([2, 3, 5], 2, 3, 125);
          return pick([
            { type: 'rev', kind: 'slot', vars: true, lhs: Mul(Fr(1, o.k), L(o.p, x)), rhs: L(SLOT, x), links: [['basepow', L(Pw(o.p, o.k), x)], ['arith', L(o.v, x)]], ans: [o.v, 1] },
            { type: 'rev', kind: 'slot', vars: true, lhs: Neg(L(o.p, x)), rhs: L(SLOT, x), links: [['basepow', L(Pw(o.p, -1), x)], ['arith', L(Fr(1, o.p), x)]], ans: [1, o.p] },
          ]); },
      ],
    },

    /* ── log_(a^k) bⁿ = (n/k)·log_a b ── */
    bothpow: {
      1: [
        // log₄ 8 = log_(2²) 2³ = 3/2
        () => tryGen(() => { const p = pick([2, 3, 5]), k = ri(2, 4), n = ri(1, 6), B = Math.pow(p, k), P = Math.pow(p, n);
            if (B > 81 || P > 729 || n % k === 0 || n === 1) return null;
            return { type: 'calc', kind: 'calc', expr: L(B, P),
              links: [['rewrite', L(Pw(p, k), Pw(p, n))], ['bothpow', Mul(ratTree(n, k), L(p, p))], ['unit', ratTree(n, k)]], ans: [n, k] }; }, () => true),
        () => tryGen(() => { const k = ri(2, 5), n = ri(2, 9);
            if (n === k) return null;
            return { type: 'simp', kind: 'slot', vars: true, lhs: L(Pw(x, k), Pw(y, n)), rhs: Mul(SLOT, L(x, y)), links: [['bothpow', Mul(ratTree(n, k), L(x, y))]], ans: [n, k] }; }, () => true),
        () => ({ type: 'know', kind: 'choice', vars: true, expr: L(Pw(a, 2), Pw(b, 2)), good: L(a, b),
          bad: [Mul(2, L(a, b)), Mul(4, L(a, b)), L(Pw(a, 2), b)], links: [['bothpow', L(a, b)]] }),
      ],
      2: [
        // log₉ 49 = log₃ ?
        () => { const p = pick([2, 3, 5]), n = ri(2, 3), m = plainNum(2, 10, p, v => Math.pow(v, n) <= 1000 && Math.pow(p, n) <= 125);
          return { type: 'rev', kind: 'slot', lhs: L(Math.pow(p, n), Math.pow(m, n)), rhs: L(p, SLOT),
            links: [['rewrite', L(Pw(p, n), Pw(m, n))], ['bothpow', L(p, m)]], ans: [m, 1] }; },
        // log_(1/4) 8 = −3/2
        () => tryGen(() => { const p = pick([2, 3, 5]), k = ri(2, 3), n = ri(1, 5), B = Math.pow(p, k), P = Math.pow(p, n);
            if (B > 27 || P > 243 || n % k === 0) return null;
            return { type: 'calc', kind: 'calc', expr: L(Fr(1, B), P),
              links: [['rewrite', L(Pw(p, -k), Pw(p, n))], ['bothpow', Mul(ratTree(-n, k), L(p, p))], ['unit', ratTree(-n, k)]], ans: [-n, k] }; }, () => true),
        // log_√2 8 = 6
        () => { const o = powPick([2, 3, 5], 1, 5, 243);
          return { type: 'calc', kind: 'calc', expr: L(Rt(2, o.p), o.v),
            links: [['rewrite', L(Pw(o.p, Fr(1, 2)), Pw(o.p, o.k))], ['bothpow', Mul(2 * o.k, L(o.p, o.p))], ['unit', 2 * o.k]], ans: [2 * o.k, 1] }; },
      ],
      3: [
        // log_√3 ∛9 = (2/3) : (1/2) = 4/3
        () => tryGen(() => { const p = pick([2, 3]);
            const E = [[1, 2], [1, 3], [2, 3], [3, 2], [5, 2], [3, 4]];
            const e1 = pick(E), e2 = pick(E);
            if (e1 === e2) return null;
            const node = e => e[0] === 1 ? Rt(e[1], p) : Rt(e[1], Math.pow(p, e[0]));
            const pn = e2[0] * e1[1], pd = e2[1] * e1[0];
            return { type: 'calc', kind: 'calc', expr: L(node(e1), node(e2)),
              links: [['rewrite', L(Pw(p, ratTree(e1[0], e1[1])), Pw(p, ratTree(e2[0], e2[1])))], ['bothpow', Mul(Fr(ratTree(e2[0], e2[1]), ratTree(e1[0], e1[1])), L(p, p))], ['unit', ratTree(pn, pd)]], ans: [pn, pd] }; }, () => true),
        // log₃ 5 = log₉ ?;  log₂ 7 = log_? 49
        () => { const p = pick([2, 3, 5, 7]), m = plainNum(2, 9, p);
          return pick([
            { type: 'rev', kind: 'slot', lhs: L(p, m), rhs: L(p * p, SLOT), links: [['bothpow', L(Pw(p, 2), Pw(m, 2))], ['arith', L(p * p, m * m)]], ans: [m * m, 1] },
            { type: 'rev', kind: 'slot', lhs: L(p, m), rhs: L(SLOT, m * m), links: [['bothpow', L(Pw(p, 2), Pw(m, 2))], ['arith', L(p * p, m * m)]], ans: [p * p, 1] },
          ]); },
      ],
    },

    /* ── log_a b = log_c b / log_c a ── */
    change: {
      1: [
        // log₃ 32 / log₃ 2 = log₂ 32 = 5
        () => { const o = powPick([2, 3, 5], 2, 5, 243), c0 = pick([3, 5, 7, 10, 11].filter(v => v !== o.p)), Lc = v => c0 === 10 ? LG(v) : L(c0, v);
          return { type: 'calc', kind: 'calc', expr: Fr(Lc(o.v), Lc(o.p)), links: [['change', L(o.p, o.v)], ['def', o.k]], ans: [o.k, 1] }; },
        // log₅ 7 / log₅ 3 = log_? 7
        () => { const c0 = pick([2, 3, 5, 7]), p = tryGen(() => ri(2, 9), v => v !== c0), m = tryGen(() => ri(2, 13), v => v !== c0 && v !== p);
          return { type: 'rev', kind: 'slot', lhs: Fr(L(c0, m), L(c0, p)), rhs: L(SLOT, m), links: [['change', L(p, m)]], ans: [p, 1] }; },
        // log₈ x = log₂ x / ?
        () => { const o = powPick([2, 3, 5], 2, 4, 125);
          return { type: 'simp', kind: 'slot', vars: true, lhs: L(o.v, x), rhs: Fr(L(o.p, x), SLOT), links: [['change', Fr(L(o.p, x), L(o.p, o.v))], ['def', Fr(L(o.p, x), o.k)]], ans: [o.k, 1] }; },
        () => ({ type: 'know', kind: 'choice', vars: true, expr: L(a, b), good: Fr(L(c, b), L(c, a)),
          bad: [Fr(L(c, a), L(c, b)), Sub(L(c, b), L(c, a)), Mul(L(c, b), L(c, a))], links: [['change', Fr(L(c, b), L(c, a))]] }),
      ],
      2: [
        // log₈ 32 = log₂ 32 / log₂ 8 = 5/3
        () => tryGen(() => { const p = pick([2, 3]), m = ri(2, 4), n = ri(1, 6), B = Math.pow(p, m), P = Math.pow(p, n);
            if (B > 81 || P > 243 || n % m === 0) return null;
            return { type: 'calc', kind: 'calc', expr: L(B, P), links: [['change', Fr(L(p, P), L(p, B))], ['def', Fr(n, m)], ['arith', ratTree(n, m)]], ans: [n, m] }; }, () => true),
        // lg 81 / lg 3 = 4
        () => { const o = powPick([2, 3, 5, 7], 2, 5, 625);
          return { type: 'calc', kind: 'calc', expr: Fr(LG(o.v), LG(o.p)), links: [['change', L(o.p, o.v)], ['def', o.k]], ans: [o.k, 1] }; },
        // log_(1/2) 16 = log₂ 16 / log₂ ½ = −4
        () => { const o = powPick([2, 3, 5], 1, 5, 243);
          return { type: 'calc', kind: 'calc', expr: L(Fr(1, o.p), o.v), links: [['change', Fr(L(o.p, o.v), L(o.p, Fr(1, o.p)))], ['def', Fr(o.k, -1)], ['arith', -o.k]], ans: [-o.k, 1] }; },
      ],
      3: [
        // log₂ 3 · log₃ 8 = 3
        () => { const o = powPick([2, 3, 5], 2, 5, 243), m = plainNum(3, 11, o.p);
          return { type: 'calc', kind: 'calc', expr: Mul(L(o.p, m), L(m, o.v)),
            links: [['change', Mul(L(o.p, m), Fr(L(o.p, o.v), L(o.p, m)))], ['arith', L(o.p, o.v)], ['def', o.k]], ans: [o.k, 1] }; },
        // log₂ 5 · log₅ 7 · log₇ 16 = 4
        () => { const o = powPick([2, 3], 2, 5, 243), m = plainNum(3, 7, o.p), n = plainNum(3, 11, o.p, v => v !== m);
          return { type: 'calc', kind: 'calc', expr: Mul(L(o.p, m), L(m, n), L(n, o.v)),
            links: [['change', Mul(L(o.p, m), Fr(L(o.p, n), L(o.p, m)), Fr(L(o.p, o.v), L(o.p, n)))], ['arith', L(o.p, o.v)], ['def', o.k]], ans: [o.k, 1] }; },
        // log₇ 125 / log₇ 25 = log₂₅ 125 = 3/2
        () => tryGen(() => { const p = pick([2, 3, 5]), m = ri(2, 4), n = ri(2, 6), c0 = pick([3, 7, 10, 11].filter(v => v !== p));
            if (Math.pow(p, m) > 81 || Math.pow(p, n) > 729 || n % m === 0) return null;
            const Lc = v => c0 === 10 ? LG(v) : L(c0, v);
            return { type: 'calc', kind: 'calc', expr: Fr(Lc(Math.pow(p, n)), Lc(Math.pow(p, m))),
              links: [['change', L(Math.pow(p, m), Math.pow(p, n))], ['rewrite', L(Pw(p, m), Pw(p, n))], ['bothpow', ratTree(n, m)]], ans: [n, m] }; }, () => true),
      ],
    },

    /* ── log_a b = 1/log_b a ── */
    swap: {
      1: [
        () => { const p = ri(2, 12), q = tryGen(() => ri(2, 12), v => v !== p);
          return { type: 'calc', kind: 'calc', expr: Mul(L(p, q), L(q, p)), links: [['swap', 1]], ans: [1, 1] }; },
        // 1/log₈ 2 = log₂ 8 = 3
        () => { const o = powPick([2, 3, 5], 2, 5, 243);
          return { type: 'calc', kind: 'calc', expr: Fr(1, L(o.v, o.p)), links: [['swap', L(o.p, o.v)], ['def', o.k]], ans: [o.k, 1] }; },
        // 1/log₃ 7 = log_? 3
        () => { const p = ri(2, 9), q = tryGen(() => ri(2, 13), v => v !== p);
          return { type: 'rev', kind: 'slot', lhs: Fr(1, L(p, q)), rhs: L(SLOT, p), links: [['swap', L(q, p)]], ans: [q, 1] }; },
        () => ({ type: 'know', kind: 'choice', vars: true, expr: Fr(1, L(a, b)), good: L(b, a),
          bad: [L(a, b), Neg(L(b, a)), L(Pw(a, 2), b)], links: [['swap', L(b, a)]] }),
      ],
      2: [
        // 1/log₄ 2 + 1/log₂₇ 3 = 5
        () => { const o1 = powPick([2, 3, 5], 2, 4, 125), o2 = powPick([2, 3, 5, 7], 2, 3, 125);
          return { type: 'calc', kind: 'calc', expr: Add(Fr(1, L(o1.v, o1.p)), Fr(1, L(o2.v, o2.p))),
            links: [['swap', Add(L(o1.p, o1.v), L(o2.p, o2.v))], ['def', Add(o1.k, o2.k)], ['arith', o1.k + o2.k]], ans: [o1.k + o2.k, 1] }; },
        // log₆ 5 · log₅ 6 + log₂ 8 = 4
        () => { const p = ri(2, 12), q = tryGen(() => ri(2, 12), v => v !== p), o = powPick([2, 3, 5], 1, 5, 243);
          return { type: 'calc', kind: 'calc', expr: Add(Mul(L(p, q), L(q, p)), L(o.p, o.v)),
            links: [['swap', Add(1, L(o.p, o.v))], ['def', Add(1, o.k)], ['arith', 1 + o.k]], ans: [1 + o.k, 1] }; },
        // 2 / log₈ 2 = 2·log₂ 8 = 6
        () => { const o = powPick([2, 3, 5], 2, 4, 125), k = ri(2, 5);
          return { type: 'calc', kind: 'calc', expr: Fr(k, L(o.v, o.p)), links: [['swap', Mul(k, L(o.p, o.v))], ['def', Mul(k, o.k)], ['arith', k * o.k]], ans: [k * o.k, 1] }; },
      ],
      3: [
        // 1/log₄ 36 + 1/log₉ 36 = log₃₆ 36 = 1
        () => tryGen(() => { const m = ri(2, 9), n = ri(2, 9), N = m * n;
            if (m === n || N > 72) return null;
            return { type: 'calc', kind: 'calc', expr: Add(Fr(1, L(m, N)), Fr(1, L(n, N))),
              links: [['swap', Add(L(N, m), L(N, n))], ['prod', L(N, Mul(m, n))], ['arith', L(N, N)], ['unit', 1]], ans: [1, 1] }; }, () => true),
        // 1/log₈ 2 − 1/log₉ 3 = 3 − 2
        () => { const o1 = powPick([2, 3, 5], 2, 5, 243), o2 = powPick([2, 3, 5, 7], 2, 3, 125);
          return { type: 'calc', kind: 'calc', expr: Sub(Fr(1, L(o1.v, o1.p)), Fr(1, L(o2.v, o2.p))),
            links: [['swap', Sub(L(o1.p, o1.v), L(o2.p, o2.v))], ['def', Sub(o1.k, o2.k)], ['arith', o1.k - o2.k]], ans: [o1.k - o2.k, 1] }; },
        // log₃ 5 · log₅ 27 = log₃ 5 · 3·log₅ 3 = 3
        () => { const o = powPick([2, 3, 5], 2, 4, 125), m = plainNum(3, 11, o.p);
          return { type: 'calc', kind: 'calc', expr: Mul(L(o.p, m), L(m, o.v)),
            links: [['rewrite', Mul(L(o.p, m), L(m, Pw(o.p, o.k)))], ['pow', Mul(L(o.p, m), o.k, L(m, o.p))], ['swap', Mul(o.k, 1)], ['arith', o.k]], ans: [o.k, 1] }; },
      ],
    },

    /* ── a^(log_b c) = c^(log_b a) ── */
    expswap: {
      1: [
        // 4^(log₂ 7) = 7^(log₂ 4) = 49
        () => { const o = powPick([2, 3, 5], 2, 3, 125), m = plainNum(3, 9, o.p, v => Math.pow(v, o.k) <= 1000);
          return { type: 'calc', kind: 'calc', expr: Pw(o.v, L(o.p, m)), links: [['expswap', Pw(m, L(o.p, o.v))], ['def', Pw(m, o.k)], ['arith', Math.pow(m, o.k)]], ans: [Math.pow(m, o.k), 1] }; },
        // 5^(log₂ 3) = 3^(log₂ ?)
        () => { const p = ri(2, 7), m = tryGen(() => ri(2, 9), v => v !== p), n = tryGen(() => ri(2, 9), v => v !== p && v !== m);
          return { type: 'rev', kind: 'slot', lhs: Pw(n, L(p, m)), rhs: Pw(m, L(p, SLOT)), links: [['expswap', Pw(m, L(p, n))]], ans: [n, 1] }; },
        () => ({ type: 'know', kind: 'choice', vars: true, expr: Pw(a, L(b, c)), good: Pw(c, L(b, a)),
          bad: [Pw(b, L(a, c)), Pw(c, L(a, b)), Pw(a, L(c, b))], links: [['expswap', Pw(c, L(b, a))]] }),
      ],
      2: [
        // 8^(log₄ 9) = 9^(log₄ 8) = 9^(3/2) = 27
        () => tryGen(() => { const p = pick([2, 3]), m = p === 2 ? ri(2, 3) : 2, k = ri(1, 4), r = pick(p === 2 ? [3, 5, 7] : [2, 4, 5]);
            const A = Math.pow(p, k), B = Math.pow(p, m), R = Math.pow(r, m);
            if (k === m || A > 27 || R > 1000 || Math.pow(r, k) > 1000) return null;
            return { type: 'calc', kind: 'calc', expr: Pw(A, L(B, R)), links: [['expswap', Pw(R, L(B, A))], ['def', Pw(R, ratTree(k, m))], ['arith', Math.pow(r, k)]], ans: [Math.pow(r, k), 1] }; }, () => true),
        // 4^(log₂ 7) : 7 = 7
        () => { const o = powPick([2, 3, 5], 2, 3, 125), m = plainNum(3, 9, o.p, v => Math.pow(v, o.k) <= 1000);
          return { type: 'calc', kind: 'calc', expr: Fr(Pw(o.v, L(o.p, m)), m), links: [['expswap', Fr(Pw(m, L(o.p, o.v)), m)], ['def', Fr(Pw(m, o.k), m)], ['arith', Math.pow(m, o.k - 1)]], ans: [Math.pow(m, o.k - 1), 1] }; },
      ],
      3: [
        // 5^(log₃ 7) − 7^(log₃ 5) = 0
        () => { const p = ri(2, 7), m = tryGen(() => ri(2, 11), v => v !== p), n = tryGen(() => ri(2, 11), v => v !== p && v !== m);
          return pick([
            { type: 'calc', kind: 'calc', expr: Sub(Pw(m, L(p, n)), Pw(n, L(p, m))), links: [['expswap', Sub(Pw(n, L(p, m)), Pw(n, L(p, m)))], ['arith', 0]], ans: [0, 1] },
            { type: 'calc', kind: 'calc', expr: Fr(Pw(m, L(p, n)), Pw(n, L(p, m))), links: [['expswap', Fr(Pw(n, L(p, m)), Pw(n, L(p, m)))], ['arith', 1]], ans: [1, 1] },
          ]); },
        // 9^(log₂₇ 8) = 8^(log₂₇ 9) = 8^(2/3) = 4
        () => tryGen(() => { const p = pick([2, 3, 5]), m = ri(2, 3), k = ri(1, 3), r = pick([2, 3, 5, 7].filter(v => v !== p));
            const A = Math.pow(p, k), B = Math.pow(p, m), R = Math.pow(r, m);
            if (k === m || A > 125 || B > 125 || R > 1000 || Math.pow(r, k) > 1000) return null;
            return { type: 'calc', kind: 'calc', expr: Pw(A, L(B, R)), links: [['expswap', Pw(R, L(B, A))], ['def', Pw(R, ratTree(k, m))], ['arith', Math.pow(r, k)]], ans: [Math.pow(r, k), 1] }; }, () => true),
        // 4^(log₂ 3) + 9^(log₃ 2) = 3² + 2² = 13
        () => { const o1 = powPick([2, 3, 5], 2, 2, 25), m = plainNum(2, 7, o1.p), o2 = powPick([2, 3, 5].filter(v => v !== o1.p), 2, 2, 25), n = plainNum(2, 7, o2.p);
          return { type: 'calc', kind: 'calc', expr: Add(Pw(o1.v, L(o1.p, m)), Pw(o2.v, L(o2.p, n))),
            links: [['expswap', Add(Pw(m, L(o1.p, o1.v)), Pw(n, L(o2.p, o2.v)))], ['def', Add(Pw(m, 2), Pw(n, 2))], ['arith', m * m + n * n]], ans: [m * m + n * n, 1] }; },
      ],
    },
  };

  /* ═══════════════ выдача задания ═══════════════
     generate(props, lvl) — задание одного из выбранных свойств. Подряд одно
     и то же свойство (при нескольких выбранных) и одно и то же условие не
     выпадают: при смешанной тренировке ученик должен каждый раз заново
     узнавать свойство, а не решать по инерции. */
  let lastPid = null;
  const lastText = {};
  function generate(props, lvl, prefer){
    const list = (Array.isArray(props) ? props : [props]).filter(p => GEN[p]);
    if (!list.length) list.push(PROPS[0].id);
    lvl = Math.max(1, Math.min(3, lvl || 1));
    let pid = prefer && list.indexOf(prefer) >= 0 ? prefer : pick(list);
    if (!prefer && list.length > 1 && pid === lastPid) pid = pick(list.filter(p => p !== lastPid));
    lastPid = pid;
    let t = null;
    for (let i = 0; i < 8; i++){
      t = build(pid, lvl, pick(GEN[pid][lvl])());
      if (t.text !== lastText[pid]) break;
    }
    lastText[pid] = t.text;
    return t;
  }

  window.LOG_BANK = {
    props: PROPS, groups: GROUPS, propById, groupById,
    generate, render, plain, ratTree, stepTag,
    TYPES,
    LEVELS: ['А', 'Б', 'В'],
    LEVEL_HINTS: ['прямое применение, простые числа', 'дроби, корни, отрицательные и «спрятанные» степени', 'свойство несколько раз и в обратную сторону'],
    _gen: GEN,
  };
})();
