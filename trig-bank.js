/* ═══════════════════════════════════════════════════════════════════════
   trig-bank.js — задания тренажёра «Тригонометрические
   уравнения» (10–11 класс), промпт №13 нового списка. Черновик: набор
   типов и методика будут дорабатываться руками.

   Пять плашек-уровней, в каждой свои плитки-типы:
     1 — простейшие (частные случаи, sin, cos, отрицательное a,
         нетабличное a и «корней нет», tg, ctg);
     2 — составной аргумент (kx, x/k, x ± φ, kx + φ, tg/ctg, формат ЕГЭ
         с аргументом π(x − a)/b и ответом-числом);
     3 — сводятся к простейшим (множители, квадратные, основное
         тождество, двойной угол, приведение, однородные, tg и ctg вместе);
     4 — отбор корней на отрезке (перебор n, двойное неравенство,
         окружность);
     5 — уровень №14 ЕГЭ (пункт б с отбором, дробь с ОДЗ, корень,
         показательная замена).

   Почему ответ хранится СЕРИЯМИ-данными, а не готовым текстом. Серия —
   объект { c, sg, a, p }: x = c + (±a | (−1)ⁿa | a) + p·n, где c, a, p —
   рациональные доли π (a бывает и arcsin/arccos/arctg/arcctg нетабличного
   числа). Из этих же данных рисуется вариант ответа и решение, по ним же
   варианты сравниваются между собой (разворачиваем серии в корни на
   отрезке и сравниваем списки): неверный вариант, который случайно
   оказался равен верному (другая запись того же множества), выбрасывается.
   Тест (test_prompt13_trig_equations.py) проверяет каждое задание ЧИСЛЕННО
   своим кодом: корни верного ответа — это все корни уравнения на отрезке
   (уравнение — строка meta.zero, условия ОДЗ — meta.cond), неверные
   варианты с ним не совпадают.

   Задание — обычные данные без функций (как в logarithms-bank.js): оно
   целиком уходит в снимок совместной сессии, в карточки «+» и на доску.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  /* ── случайности ── */
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  function shuffle(a){ a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  /* ── рациональные числа [p, q] ── */
  function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while (b){ [a, b] = [b, a % b]; } return a; }
  function Q(p, q){ q = q === undefined ? 1 : q; if (q < 0){ p = -p; q = -q; } const g = gcd(p, q) || 1; return [p / g, q / g]; }
  const qa = (x, y) => Q(x[0] * y[1] + y[0] * x[1], x[1] * y[1]);
  const qs = (x, y) => Q(x[0] * y[1] - y[0] * x[1], x[1] * y[1]);
  const qm = (x, y) => Q(x[0] * y[0], x[1] * y[1]);
  const qd = (x, y) => Q(x[0] * y[1], x[1] * y[0]);
  const qn = x => Q(-x[0], x[1]);
  const qv = x => x[0] / x[1];
  const qeq = (x, y) => x[0] === y[0] && x[1] === y[1];
  const qz = x => x[0] === 0;
  // остаток от деления на положительное m — в [0, m)
  function qmod(x, m){ const k = Math.floor(qv(qd(x, m)) + 1e-12); let r = qs(x, qm(Q(k), m)); if (qv(r) < 0) r = qa(r, m); if (qv(r) >= qv(m) - 1e-12) r = qs(r, m); return r; }
  function lcmInt(a, b){ return a / gcd(a, b) * b; }
  const qlcm = (x, y) => Q(lcmInt(x[0], y[0]), gcd(x[1], y[1]));

  /* ═══════════════ деревья выражений ═══════════════
     число | ['v','x'] | ['pi', [p,q]] — доля π | ['fn', имя, аргумент, степень?]
     ['sqrt', n] | ['/', a, b] | ['*', …] | ['+', …] | ['-', a, b] | ['neg', a]
     ['pow', основание, показатель] | ['=', левая, правая]
     Из дерева получаются и разметка (render), и строка-выражение для
     численной проверки (expr: 2*sin(x)**2-3*sin(x)+1). */
  const X = ['v', 'x'];
  const PI = r => ['pi', r];
  const F = (name, arg, pw) => pw ? ['fn', name, arg || X, pw] : ['fn', name, arg || X];
  const SQ = n => ['sqrt', n];
  const Fr = (a, b) => ['/', a, b];
  const Mul = (...x) => ['*', ...x];
  const Add = (...x) => ['+', ...x];
  const Sub = (a, b) => ['-', a, b];
  const Neg = a => ['neg', a];
  const Eq = (a, b) => ['=', a, b];
  const FNAME = { sin: 'sin', cos: 'cos', tg: 'tg', ctg: 'ctg' };

  function fracHTML(n, d){ return '<span class="frac"><span class="num">' + n + '</span><span class="den">' + d + '</span></span>'; }
  const MO = s => '<span class="mo">' + s + '</span>';
  const par = h => '<span class="mp">(</span>' + h + '<span class="mp">)</span>';
  function numHTML(n){ return '<span class="mn">' + (n < 0 ? '−' : '') + String(Math.abs(n)).replace('.', ',') + '</span>'; }
  // доля π: π, 2π, π/6 (дробь вертикально), 5π/6, −π/3
  function piHTML(r){
    if (qz(r)) return numHTML(0);
    const s = r[0] < 0 ? '−' : '', p = Math.abs(r[0]);
    const top = (p === 1 ? '' : p) + 'π';
    return (s ? '<span class="mo neg">−</span>' : '') + (r[1] === 1 ? '<span class="mn">' + top + '</span>' : fracHTML(top, r[1]));
  }
  function qHTML(r){
    const s = r[0] < 0 ? '<span class="mo neg">−</span>' : '';
    return s + (r[1] === 1 ? numHTML(Math.abs(r[0])) : fracHTML(Math.abs(r[0]), r[1]));
  }
  const PREC = { '+': 1, '-': 1, 'neg': 2, '*': 3, 'fn': 4, 'pow': 5 };
  const prec = t => typeof t === 'number' ? (t < 0 ? 2 : 9) : (PREC[t[0]] || 9);
  const isNeg = t => (typeof t === 'number' && t < 0) || (Array.isArray(t) && (t[0] === 'neg' || (t[0] === 'pi' && t[1][0] < 0)));
  // аргумент функции без скобок: x, 2x, x/2 и дробь π(x − 7)/3; со скобками — сумма
  function argHTML(t){
    const bare = t[0] === 'v' || t[0] === '/' || (t[0] === '*' && t.length === 3 && typeof t[1] === 'number' && t[2][0] === 'v');
    return bare ? render(t) : par(render(t));
  }
  function render(t){
    if (typeof t === 'number') return numHTML(t);
    switch (t[0]){
      case 'v': return '<i class="mv">' + t[1] + '</i>';
      case 'pi': return piHTML(t[1]);
      case 'q': return qHTML(t[1]);
      case 'sqrt': return '<span class="rt"><span class="rs">√</span><span class="rad">' + render(t[1]) + '</span></span>';
      case '/': return fracHTML(render(t[1]), render(t[2]));
      case 'fn': return '<span class="fn">' + FNAME[t[1]] + (t[3] ? '<sup>' + t[3] + '</sup>' : '') + '</span>&#8201;' + argHTML(t[2]);
      case 'pow': return '<span class="pw">' + (prec(t[1]) >= 9 ? render(t[1]) : par(render(t[1]))) + '<sup>' + render(t[2]) + '</sup></span>';
      case 'neg': return '<span class="mo neg">−</span>' + (prec(t[1]) <= 2 ? par(render(t[1])) : render(t[1]));
      case '*': {
        // множители подряд без точки: 2x, 2 sin x, √3 cos x, π(x − 7);
        // точка — только между двумя числами
        let h = '';
        t.slice(1).forEach((x, i) => {
          const xh = (prec(x) <= 2 || (i > 0 && isNeg(x))) ? par(render(x)) : render(x);
          if (i > 0){
            const prev = t[i];
            if (typeof prev === 'number' && (typeof x === 'number' || (x[0] === 'pow' && typeof x[1] === 'number'))) h += MO('·');
            else if (typeof prev === 'number' && x[0] === 'pow' && Array.isArray(x[1]) && x[1][0] === 'v') h += '';
            else if (!(typeof prev === 'number' && Array.isArray(x) && (x[0] === 'v' || x[0] === 'pi')) && !(Array.isArray(prev) && prev[0] === 'pi')) h += '&#8201;';
          }
          h += xh;
        });
        return h;
      }
      case '+': return t.slice(1).map((x, i) => {
        if (i === 0) return render(x);
        if (typeof x === 'number' && x < 0) return MO('−') + '<wbr>' + numHTML(-x);
        if (Array.isArray(x) && x[0] === 'neg') return MO('−') + '<wbr>' + (prec(x[1]) <= 1 ? par(render(x[1])) : render(x[1]));
        if (Array.isArray(x) && x[0] === 'pi' && x[1][0] < 0) return MO('−') + '<wbr>' + piHTML(qn(x[1]));
        return MO('+') + '<wbr>' + render(x);
      }).join('');
      case '-': return render(t[1]) + MO('−') + '<wbr>' + (prec(t[2]) <= 1 || isNeg(t[2]) ? par(render(t[2])) : render(t[2]));
      case '=': return render(t[1]) + '<span class="mo eq">=</span><wbr>' + render(t[2]);
    }
    return '';
  }
  // строка для численной проверки (и в тесте на Python, и в JS): ** — степень
  const EXPR_FN = { sin: 'sin', cos: 'cos', tg: 'tan', ctg: 'cot' };
  function expr(t){
    if (typeof t === 'number') return '(' + t + ')';
    switch (t[0]){
      case 'v': return 'x';
      case 'pi': return '(' + t[1][0] + '*pi/' + t[1][1] + ')';
      case 'q': return '(' + t[1][0] + '/' + t[1][1] + ')';
      case 'sqrt': return 'sqrt(' + expr(t[1]) + ')';
      case '/': return '(' + expr(t[1]) + ')/(' + expr(t[2]) + ')';
      case 'fn': return t[3] ? '(' + EXPR_FN[t[1]] + '(' + expr(t[2]) + ')**' + t[3] + ')' : EXPR_FN[t[1]] + '(' + expr(t[2]) + ')';
      case 'pow': return '((' + expr(t[1]) + ')**(' + expr(t[2]) + '))';
      case 'neg': return '(-(' + expr(t[1]) + '))';
      case '*': return '(' + t.slice(1).map(expr).join('*') + ')';
      case '+': return '(' + t.slice(1).map(expr).join('+') + ')';
      case '-': return '(' + expr(t[1]) + '-(' + expr(t[2]) + '))';
      case '=': return '(' + expr(t[1]) + ')-(' + expr(t[2]) + ')';
    }
    return '0';
  }
  // короткая строчная запись для истории решённого
  function plain(t){
    if (typeof t === 'number') return String(t).replace('-', '−').replace('.', ',');
    switch (t[0]){
      case 'v': return 'x';
      case 'pi': { const r = t[1]; if (qz(r)) return '0'; const top = (Math.abs(r[0]) === 1 ? '' : Math.abs(r[0])) + 'π'; return (r[0] < 0 ? '−' : '') + top + (r[1] === 1 ? '' : '/' + r[1]); }
      case 'q': return (t[1][0] < 0 ? '−' : '') + Math.abs(t[1][0]) + (t[1][1] === 1 ? '' : '/' + t[1][1]);
      case 'sqrt': return '√' + plain(t[1]);
      case '/': { const a = plain(t[1]), b = plain(t[2]); return (/[+−\s]/.test(a.slice(1)) ? '(' + a + ')' : a) + '/' + (/[+−\s]/.test(b) ? '(' + b + ')' : b); }
      case 'fn': { const a = plain(t[2]); const bare = t[2][0] === 'v' || t[2][0] === '/' || (t[2][0] === '*' && typeof t[2][1] === 'number'); return FNAME[t[1]] + (t[3] ? (t[3] === 2 ? '²' : '^' + t[3]) : '') + (bare ? ' ' + a : '(' + a + ')'); }
      case 'pow': return plain(t[1]) + '^(' + plain(t[2]) + ')';
      case 'neg': return '−' + plain(t[1]);
      case '*': return t.slice(1).map(x => prec(x) <= 2 ? '(' + plain(x) + ')' : plain(x)).join(' ').replace(/(\d) x/g, '$1x').replace(/π \(/g, 'π(');
      case '+': return t.slice(1).map((x, i) => { const s = plain(x); return i === 0 ? s : (s[0] === '−' ? ' − ' + s.slice(1) : ' + ' + s); }).join('');
      case '-': return plain(t[1]) + ' − ' + (prec(t[2]) <= 1 ? '(' + plain(t[2]) + ')' : plain(t[2]));
      case '=': return plain(t[1]) + ' = ' + plain(t[2]);
    }
    return '';
  }
  const M = t => '<span class="mx">' + render(t) + '</span>';

  /* ═══════════════ значения и табличные углы ═══════════════
     Значение правой части — ключ таблицы: дерево для записи и число. */
  const VT = {
    '0': 0, '1': 1, '-1': -1,
    '1/2': Fr(1, 2), '-1/2': Neg(Fr(1, 2)),
    'r2/2': Fr(SQ(2), 2), '-r2/2': Neg(Fr(SQ(2), 2)),
    'r3/2': Fr(SQ(3), 2), '-r3/2': Neg(Fr(SQ(3), 2)),
    'r3': SQ(3), '-r3': Neg(SQ(3)), 'r3/3': Fr(SQ(3), 3), '-r3/3': Neg(Fr(SQ(3), 3)),
  };
  const VN = { '0': 0, '1': 1, '-1': -1, '1/2': .5, '-1/2': -.5, 'r2/2': Math.SQRT2 / 2, '-r2/2': -Math.SQRT2 / 2,
    'r3/2': Math.sqrt(3) / 2, '-r3/2': -Math.sqrt(3) / 2, 'r3': Math.sqrt(3), '-r3': -Math.sqrt(3), 'r3/3': Math.sqrt(3) / 3, '-r3/3': -Math.sqrt(3) / 3 };
  // главное значение арк-функции (доля π) для табличных чисел
  const ARC = {
    sin: { '0': Q(0), '1/2': Q(1, 6), 'r2/2': Q(1, 4), 'r3/2': Q(1, 3), '1': Q(1, 2), '-1/2': Q(-1, 6), '-r2/2': Q(-1, 4), '-r3/2': Q(-1, 3), '-1': Q(-1, 2) },
    cos: { '1': Q(0), 'r3/2': Q(1, 6), 'r2/2': Q(1, 4), '1/2': Q(1, 3), '0': Q(1, 2), '-1/2': Q(2, 3), '-r2/2': Q(3, 4), '-r3/2': Q(5, 6), '-1': Q(1) },
    tg: { '0': Q(0), 'r3/3': Q(1, 6), '1': Q(1, 4), 'r3': Q(1, 3), '-r3/3': Q(-1, 6), '-1': Q(-1, 4), '-r3': Q(-1, 3) },
    ctg: { 'r3': Q(1, 6), '1': Q(1, 4), 'r3/3': Q(1, 3), '0': Q(1, 2), '-r3/3': Q(2, 3), '-1': Q(3, 4), '-r3': Q(5, 6) },
  };
  const ARCNAME = { sin: 'arcsin', cos: 'arccos', tg: 'arctg', ctg: 'arcctg' };
  const negKey = k => k === '0' ? '0' : (k[0] === '-' ? k.slice(1) : '-' + k);
  // «напарник» по таблице — типичная путаница arcsin ↔ arccos, arctg ↔ arcctg
  const PARTNER = { sin: 'cos', cos: 'sin', tg: 'ctg', ctg: 'tg' };

  /* ═══════════════ серии ═══════════════
     { c: доля π, sg: '' | 'pm' | 'alt', a: доля π ИЛИ { arc, v: [p,q], k }, p: доля π }
     x = c + a + p·n;  pm: x = c ± a + p·n;  alt: x = c + (−1)ⁿ a + p·n.
     Нетабличное a: arc — имя функции, v — число (рациональное), k — множитель
     (−1: −arcsin ⅓; ½ — после деления аргумента). v вне [−1; 1] у arcsin/
     arccos — «серия», которой нет: такой вариант всегда неверен. */
  const ser = (c, sg, a, p) => ({ c, sg, a, p });
  const isArc = a => a && !Array.isArray(a);
  function arcNum(a){
    const v = qv(a.v);
    let r;
    if (a.arc === 'sin') r = Math.abs(v) <= 1 ? Math.asin(v) : NaN;
    else if (a.arc === 'cos') r = Math.abs(v) <= 1 ? Math.acos(v) : NaN;
    else if (a.arc === 'tg') r = Math.atan(v);
    else r = Math.PI / 2 - Math.atan(v);
    return r * qv(a.k);
  }
  const aNum = a => isArc(a) ? arcNum(a) : qv(a) * Math.PI;
  // корни серии на отрезке [lo; hi] (в радианах); null — серия бессмысленна
  function expand(s, lo, hi){
    const A = aNum(s.a), C = qv(s.c) * Math.PI, P = qv(s.p) * Math.PI;
    if (!isFinite(A)) return null;
    const out = [];
    const n0 = Math.floor((lo - C - Math.abs(A)) / P) - 2, n1 = Math.ceil((hi - C + Math.abs(A)) / P) + 2;
    for (let n = n0; n <= n1; n++){
      const vals = s.sg === 'pm' ? [C + A + P * n, C - A + P * n] : s.sg === 'alt' ? [C + (n % 2 === 0 ? A : -A) + P * n] : [C + A + P * n];
      vals.forEach(x => { if (x >= lo - 1e-9 && x <= hi + 1e-9) out.push(x); });
    }
    return out;
  }
  // окно сравнения шире самого длинного периода (8π у x/4)
  const WIN = [-60.1234, 60.4321];
  // все корни набора серий в окне — отсортированные, без повторов
  function rootsOf(list, lo, hi){
    lo = lo === undefined ? WIN[0] : lo; hi = hi === undefined ? WIN[1] : hi;
    let all = [];
    for (const s of list){ const r = expand(s, lo, hi); if (!r) return null; all = all.concat(r); }
    all.sort((a, b) => a - b);
    return all.filter((x, i) => i === 0 || Math.abs(x - all[i - 1]) > 1e-7);
  }
  function sameRoots(a, b){
    if (!a || !b || a.length !== b.length) return false;
    return a.every((x, i) => Math.abs(x - b[i]) < 1e-6);
  }

  // серия с шагом p = «решётка» { P, R }: остатки по модулю P (доли π)
  function toLat(s){
    if (isArc(s.a)) return null;
    const P0 = s.sg === 'alt' ? qm(s.p, Q(2)) : s.p;
    const pts = s.sg === 'pm' ? [qa(s.c, s.a), qs(s.c, s.a)] : s.sg === 'alt' ? [qa(s.c, s.a), qa(qs(s.c, s.a), s.p)] : [qa(s.c, s.a)];
    return normLat({ P: P0, R: pts });
  }
  function normLat(L){
    const R = [];
    L.R.forEach(r => { const m = qmod(r, L.P); if (!R.some(x => qeq(x, m))) R.push(m); });
    R.sort((a, b) => qv(a) - qv(b));
    return { P: L.P, R };
  }
  function toPeriod(L, P){
    const k = Math.round(qv(qd(P, L.P))), R = [];
    for (let i = 0; i < k; i++) L.R.forEach(r => R.push(qa(r, qm(Q(i), L.P))));
    return normLat({ P, R });
  }
  function latUnion(a, b){
    if (!a || !a.R.length) return b; if (!b || !b.R.length) return a;
    const P = qlcm(a.P, b.P), A = toPeriod(a, P), B = toPeriod(b, P);
    return normLat({ P, R: A.R.concat(B.R) });
  }
  function latMinus(a, b){
    if (!b || !b.R.length) return a;
    const P = qlcm(a.P, b.P), A = toPeriod(a, P), B = toPeriod(b, P);
    return normLat({ P, R: A.R.filter(r => !B.R.some(x => qeq(x, r))) });
  }
  const latFilter = (L, keep) => normLat({ P: L.P, R: L.R.filter(keep) });
  // решётку — обратно в короткую запись: пары точек через полпериода
  // (π/6 и 7π/6 → π/6 + πn), затем ± для симметричных (±π/3 + 2πn).
  // Тройки и четвёрки (π/3 + 2πn/3, πn/2) сознательно не склеиваем: так
  // ответ выглядит как в школьном решении — серия на каждое простейшее
  function latToSeries(L){
    if (!L || !L.R.length) return [];
    let rest = L.R.slice();
    const out = [];
    const nR = rest.length;
    while (rest.length){
      const r = rest[0];
      let best = 1;
      for (let m = Math.min(2, nR); m >= 2; m--){
        const step = qd(L.P, Q(m));
        let ok = true;
        for (let j = 1; j < m && ok; j++){ const y = qmod(qa(r, qm(Q(j), step)), L.P); if (!rest.some(x => qeq(x, y))) ok = false; }
        if (ok){ best = m; break; }
      }
      const step = qd(L.P, Q(best));
      const coset = [];
      for (let j = 0; j < best; j++) coset.push(qmod(qa(r, qm(Q(j), step)), L.P));
      rest = rest.filter(x => !coset.some(y => qeq(x, y)));
      // представитель — ближайший к нулю (−π/3, а не 5π/3)
      let rep = qmod(r, step);
      if (qv(rep) > qv(step) / 2 + 1e-12) rep = qs(rep, step);
      out.push(ser(Q(0), '', rep, step));
    }
    // ±: две серии с одним шагом и противоположными представителями
    const merged = [];
    out.forEach(s => {
      const twin = merged.find(t => t.sg === '' && qeq(t.p, s.p) && qeq(t.a, qn(s.a)) && !qz(s.a));
      if (twin){ twin.sg = 'pm'; twin.a = qv(twin.a) < 0 ? qn(twin.a) : twin.a; }
      else merged.push(Object.assign({}, s));
    });
    merged.sort((x, y) => qv(x.p) - qv(y.p) || Math.abs(qv(x.a)) - Math.abs(qv(y.a)));
    return merged;
  }

  /* ── запись серии ── */
  function periodHTML(p){
    const t = (Math.abs(p[0]) === 1 ? '' : Math.abs(p[0])) + 'π<i class="mv">n</i>';
    return p[1] === 1 ? '<span class="mn">' + t + '</span>' : fracHTML(t, p[1]);
  }
  function arcHTML(a){
    const k = a.k, neg = k[0] < 0, ak = [Math.abs(k[0]), k[1]];
    const vv = qv(a.v) < 0 ? par(qHTML(a.v)) : qHTML(a.v);
    const core = '<span class="fn">' + ARCNAME[a.arc] + '</span>&#8201;' + vv;
    return (neg ? '<span class="mo neg">−</span>' : '') + (ak[0] === 1 && ak[1] === 1 ? core : qHTML(ak) + '&#8201;' + core);
  }
  const aHTML = a => isArc(a) ? arcHTML(a) : piHTML(a);
  function seriesHTML(s){
    const X_ = '<i class="mv">x</i><span class="mo eq">=</span>';
    let base = '';
    if (s.sg === '' && !isArc(s.a)){
      const t = qa(s.c, s.a);
      base = qz(t) ? '' : piHTML(t);
    } else {
      const c = qz(s.c) ? '' : piHTML(s.c);
      // ± симметричен: ±(−π/4) пишем как ±π/4
      if (s.sg === 'pm') base = c + (c ? MO('±') : '<span class="mo pm">±</span>') + (isArc(s.a) ? aHTML(Object.assign({}, s.a, { k: qv(s.a.k) < 0 ? qn(s.a.k) : s.a.k })) : piHTML(qv(s.a) < 0 ? qn(s.a) : s.a));
      else if (s.sg === 'alt'){
        // sin x = −½: школьная запись (−1)ⁿ⁺¹·π/6, а не (−1)ⁿ·(−π/6)
        const negA = isArc(s.a) ? qv(s.a.k) < 0 : qv(s.a) < 0;
        const a = isArc(s.a) ? Object.assign({}, s.a, { k: negA ? qn(s.a.k) : s.a.k }) : (negA ? qn(s.a) : s.a);
        base = c + (c ? MO('+') : '') + '<span class="alt">(−1)<sup><i class="mv">n</i>' + (negA ? '+1' : '') + '</sup></span>&#8201;' + aHTML(a);
      } else base = c + (c && !(isArc(s.a) && qv(s.a.k) < 0) ? MO('+') : '') + aHTML(s.a);
    }
    return '<span class="ser">' + X_ + base + (base ? MO('+') : '') + periodHTML(s.p) + '</span>';
  }
  function answerHTML(list){
    if (!list.length) return '<span class="ser none">корней нет</span>';
    return list.map(seriesHTML).join('');
  }
  function seriesPlain(s){
    const d = document.createElement('div'); d.innerHTML = seriesHTML(s);
    return d.textContent.replace(/\s+/g, ' ').trim();
  }

  /* ═══════════════ простейшее уравнение ═══════════════
     f(u) = v, где u = k·x + b (b — доля π; k — рациональное).
     formula — серии по школьной формуле ((−1)ⁿ для sin, ± для cos),
     уже пересчитанные на x. vKey — ключ таблицы или { v: [p,q] } для
     нетабличного числа. */
  function formulaU(f, vKey){
    if (typeof vKey === 'string'){
      const v = vKey, al = ARC[f][v];
      if (f === 'sin'){
        if (v === '0') return [ser(Q(0), '', Q(0), Q(1))];
        if (v === '1') return [ser(Q(0), '', Q(1, 2), Q(2))];
        if (v === '-1') return [ser(Q(0), '', Q(-1, 2), Q(2))];
        return [ser(Q(0), 'alt', al, Q(1))];
      }
      if (f === 'cos'){
        if (v === '0') return [ser(Q(0), '', Q(1, 2), Q(1))];
        if (v === '1') return [ser(Q(0), '', Q(0), Q(2))];
        if (v === '-1') return [ser(Q(0), '', Q(1), Q(2))];
        return [ser(Q(0), 'pm', al, Q(2))];
      }
      return [ser(Q(0), '', al, Q(1))];
    }
    const v = vKey.v;
    if ((f === 'sin' || f === 'cos') && Math.abs(qv(v)) > 1) return [];
    if (f === 'sin') return [ser(Q(0), 'alt', { arc: 'sin', v: qv(v) < 0 ? qn(v) : v, k: qv(v) < 0 ? Q(-1) : Q(1) }, Q(1))];
    if (f === 'cos') return [ser(Q(0), 'pm', { arc: 'cos', v, k: Q(1) }, Q(2))];
    if (f === 'tg') return [ser(Q(0), '', { arc: 'tg', v: qv(v) < 0 ? qn(v) : v, k: qv(v) < 0 ? Q(-1) : Q(1) }, Q(1))];
    return [ser(Q(0), '', { arc: 'ctg', v, k: Q(1) }, Q(1))];
  }
  // из u = … к x = (u − b)/k
  function toX(list, k, b){
    k = k || Q(1); b = b || Q(0);
    return list.map(s => ser(qd(qa(s.c, qn(b)), k), s.sg,
      isArc(s.a) ? Object.assign({}, s.a, { k: qd(s.a.k, k) }) : qd(s.a, k), qd(s.p, k)));
  }
  const solveX = (f, v, k, b) => toX(formulaU(f, v), k, b);
  // табличное уравнение — решётка (для объединения, ОДЗ и отбора)
  function latOf(f, v, k, b){
    const list = solveX(f, v, k, b);
    let L = { P: Q(2), R: [] };
    list.forEach(s => { L = latUnion(L, toLat(s)); });
    return L;
  }

  /* ═══════════════ запись уравнений ═══════════════ */
  // «коэффициентная» запись табличного значения: 2 sin x = √3, 2 cos x + 1 = 0
  function coefForms(ft, vKey){
    const v = VT[vKey];
    const forms = [Eq(ft, v)];
    const neg = vKey[0] === '-', k = neg ? vKey.slice(1) : vKey;
    const num = { '1/2': 1, 'r2/2': SQ(2), 'r3/2': SQ(3), 'r3/3': SQ(3) }[k], den = { '1/2': 2, 'r2/2': 2, 'r3/2': 2, 'r3/3': 3 }[k];
    if (num !== undefined){
      const d = Mul(den, ft);
      forms.push(Eq(d, neg ? (typeof num === 'number' ? -num : Neg(num)) : num));
      forms.push(Eq(neg ? Add(d, num) : Sub(d, num), 0));
    }
    if (k === 'r3' || k === '1') forms.push(Eq(neg ? Add(ft, k === '1' ? 1 : SQ(3)) : Sub(ft, k === '1' ? 1 : SQ(3)), 0));
    return forms;
  }
  // многочлен от t-выражения: [[коэф, дерево|null], …] → A t² − 3t + 1
  function poly(terms){
    const parts = [];
    terms.forEach(([c, t]) => {
      if (c === 0) return;
      const mag = Math.abs(c);
      let node = t ? (mag === 1 ? t : Mul(mag, t)) : mag;
      if (c < 0) node = parts.length ? Neg(node) : (t ? Neg(node) : -mag);
      parts.push(node);
    });
    return parts.length === 1 ? parts[0] : Add(...parts);
  }
  // c·t, где c = 2·v (v — табличное): 1 → t, √3 → √3 t, −1 → −t
  const TWICE = { '1/2': 1, 'r2/2': SQ(2), 'r3/2': SQ(3), '-1/2': -1, '-r2/2': Neg(SQ(2)), '-r3/2': Neg(SQ(3)), '1': 2, '-1': -2 };
  // left − 2v·t: «2 sin² x − √3 sin x», «2 cos x + 1»
  function minusTwice(left, v, t){
    const c = TWICE[v];
    if (typeof c === 'number') return c > 0 ? Sub(left, c === 1 ? t : Mul(c, t)) : Add(left, -c === 1 ? t : Mul(-c, t));
    return c[0] === 'neg' ? Add(left, t === 1 ? c[1] : Mul(c[1], t)) : Sub(left, t === 1 ? c : Mul(c, t));
  }

  /* ═══════════════ отрезки ═══════════════ */
  function segHTML(seg){ return '<span class="seg">[' + piHTML(seg[0]) + '<span class="mo">;</span>' + piHTML(seg[1]) + ']</span>'; }
  function latRoots(L, seg){
    const out = [];
    const lo = qv(seg[0]), hi = qv(seg[1]);
    L.R.forEach(r => {
      const n0 = Math.floor((lo - qv(r)) / qv(L.P)) - 1, n1 = Math.ceil((hi - qv(r)) / qv(L.P)) + 1;
      for (let n = n0; n <= n1; n++){ const x = qa(r, qm(Q(n), L.P)); if (qv(x) >= lo - 1e-12 && qv(x) <= hi + 1e-12 && !out.some(y => qeq(y, x))) out.push(x); }
    });
    return out.sort((a, b) => qv(a) - qv(b));
  }
  const rootsHTML = rs => rs.length ? '<span class="ser roots">' + rs.map(piHTML).join('<span class="mo">;</span> ') + '</span>' : '<span class="ser none">корней нет</span>';

  /* ═══════════════ плашки и плитки ═══════════════ */
  const LEVELS = [
    { id: 1, title: 'Простейшие уравнения', lead: 'sin, cos, tg и ctg от x — формулы корней и таблица значений' },
    { id: 2, title: 'Составной аргумент', lead: 'под функцией не x, а 2x, x/3, x + π/4 или π(x − a)/b' },
    { id: 3, title: 'Сводятся к простейшим', lead: 'множители, замена, формулы — пока не останутся простейшие' },
    { id: 4, title: 'Отбор корней', lead: 'корни на отрезке: перебором, неравенством, по окружности' },
    { id: 5, title: 'Уровень №14 ЕГЭ', lead: 'уравнения второй части: отбор, ОДЗ, замена' },
  ];
  const GROUPS = [
    { id: 'spec', title: 'Частные случаи', color: '#1E9E8A' },
    { id: 'sc', title: 'sin и cos', color: '#2E7DE0' },
    { id: 'neg', title: 'sin и cos', color: '#3F63D8' },
    { id: 'arc', title: 'Нетабличные', color: '#E07A2E' },
    { id: 'tc', title: 'tg и ctg', color: '#8E5CE6' },
    { id: 'arg', title: 'Аргумент', color: '#1B98B8' },
    { id: 'shift', title: 'Сдвиг', color: '#C2410C' },
    { id: 'ege', title: 'Как в ЕГЭ', color: '#D0457A' },
    { id: 'fac', title: 'Множители', color: '#16A34A' },
    { id: 'sub', title: 'Замена', color: '#7C3AED' },
    { id: 'form', title: 'Формулы', color: '#0E7490' },
    { id: 'hom', title: 'Однородные', color: '#B45309' },
    { id: 'sel', title: 'Отбор', color: '#0891B2' },
    { id: 'e14', title: '№14', color: '#BE123C' },
    { id: 'odz', title: 'ОДЗ', color: '#9333EA' },
  ];
  const groupById = id => GROUPS.find(g => g.id === id) || GROUPS[0];
  // size: 's' — обычная (2×1), 'l' — большая (2×2). Порядок — как на экране:
  // сетка плашки подобрана под него (страница, раздел «сетка»)
  const TILES = [
    { id: 'sin', lvl: 1, group: 'sc', size: 'l', title: 'sin x = a' },
    { id: 'cos', lvl: 1, group: 'sc', size: 'l', title: 'cos x = a' },
    { id: 'spec', lvl: 1, group: 'spec', size: 's', title: 'Частные случаи: 0, 1, −1' },
    { id: 'neg', lvl: 1, group: 'neg', size: 's', title: 'Отрицательное a' },
    { id: 'arc', lvl: 1, group: 'arc', size: 's', title: 'Нетабличное a и «корней нет»' },
    { id: 'tg', lvl: 1, group: 'tc', size: 's', title: 'tg x = a' },
    { id: 'ctg', lvl: 1, group: 'tc', size: 's', title: 'ctg x = a' },

    { id: 'shift', lvl: 2, group: 'shift', size: 'l', title: 'Сдвиг: x ± φ' },
    { id: 'egeArg', lvl: 2, group: 'ege', size: 'l', title: 'Аргумент π(x − a)/b, ответ — число' },
    { id: 'kx', lvl: 2, group: 'arg', size: 's', title: 'Аргумент kx' },
    { id: 'xk', lvl: 2, group: 'arg', size: 's', title: 'Аргумент x/k' },
    { id: 'lin', lvl: 2, group: 'shift', size: 's', title: 'Аргумент kx + φ' },
    { id: 'tc2', lvl: 2, group: 'tc', size: 's', title: 'tg и ctg составного аргумента' },

    { id: 'quad', lvl: 3, group: 'sub', size: 'l', title: 'Квадратные относительно sin, cos, tg' },
    { id: 'hom', lvl: 3, group: 'hom', size: 'l', title: 'Однородные уравнения' },
    { id: 'fac', lvl: 3, group: 'fac', size: 's', title: 'Разложение на множители' },
    { id: 'ident', lvl: 3, group: 'sub', size: 's', title: 'Через sin² x + cos² x = 1' },
    { id: 'dbl', lvl: 3, group: 'form', size: 's', title: 'Формулы двойного угла' },
    { id: 'red', lvl: 3, group: 'form', size: 's', title: 'Формулы приведения' },
    { id: 'tgctg', lvl: 3, group: 'tc', size: 's', title: 'tg и ctg в одном уравнении' },

    { id: 'circ', lvl: 4, group: 'sel', size: 'l', title: 'Отбор по окружности' },
    { id: 'enum', lvl: 4, group: 'sel', size: 's', title: 'Перебор n' },
    { id: 'ineq', lvl: 4, group: 'sel', size: 's', title: 'Двойное неравенство' },

    { id: 'ab', lvl: 5, group: 'e14', size: 'l', title: 'а) решите; б) найдите корни на отрезке' },
    { id: 'frac', lvl: 5, group: 'odz', size: 's', title: 'Дробь: знаменатель ≠ 0' },
    { id: 'root', lvl: 5, group: 'odz', size: 's', title: 'Под корнем: ОДЗ' },
    { id: 'expo', lvl: 5, group: 'sub', size: 's', title: 'Показательная замена' },
  ];
  const tileById = id => TILES.find(t => t.id === id);

  /* ═══════════════ генераторы ═══════════════
     Каждый отдаёт spec:
       eq    — дерево уравнения (что видит ученик)
       ask   — вопрос над уравнением (по умолчанию «Решите уравнение»)
       good  — верный ответ: { list: серии } | { roots: доли π, seg } | { num }
       bad   — кандидаты в неверные: такие же объекты (лишние и совпавшие
               с верным отсеиваются в build)
       steps — строки решения (разметка)
       zero  — выражение, нули которого — корни (для теста), cond — ОДЗ */
  const TABLE_SC = ['1/2', 'r2/2', 'r3/2'];
  const TABLE_ALL_SIN = ['0', '1/2', 'r2/2', 'r3/2', '1', '-1/2', '-r2/2', '-r3/2', '-1'];
  const TABLE_TG = ['0', 'r3/3', '1', 'r3', '-r3/3', '-1', '-r3'];
  const TABLE_CTG = ['0', 'r3/3', '1', 'r3', '-r3/3', '-1', '-r3'];
  const ask = s => s;
  const L = list => ({ list });
  // шаг решения «по формуле»
  const FORMULA_TXT = {
    sin: 'по формуле <span class="mx"><i class="mv">x</i> = (−1)<sup><i class="mv">n</i></sup> arcsin <i class="mv">a</i> + π<i class="mv">n</i></span>',
    cos: 'по формуле <span class="mx"><i class="mv">x</i> = ± arccos <i class="mv">a</i> + 2π<i class="mv">n</i></span>',
    tg: 'по формуле <span class="mx"><i class="mv">x</i> = arctg <i class="mv">a</i> + π<i class="mv">n</i></span>',
    ctg: 'по формуле <span class="mx"><i class="mv">x</i> = arcctg <i class="mv">a</i> + π<i class="mv">n</i></span>',
  };
  const arcEq = (f, vKey) => '<span class="mx"><span class="fn">' + ARCNAME[f] + '</span>&#8201;' + (vKey[0] === '-' ? par(render(VT[vKey])) : render(VT[vKey])) + ' = ' + piHTML(ARC[f][vKey]) + '</span>';
  const serTxt = list => '<span class="mx">' + answerHTML(list) + '</span>';
  // уравнение f(x) = v для теста: нули без полюсов tg/ctg
  function zeroOf(f, argE, vN){
    if (f === 'tg') return { zero: 'sin(' + argE + ')-(' + vN + ')*cos(' + argE + ')', cond: [{ e: 'cos(' + argE + ')', t: 'ne' }] };
    if (f === 'ctg') return { zero: 'cos(' + argE + ')-(' + vN + ')*sin(' + argE + ')', cond: [{ e: 'sin(' + argE + ')', t: 'ne' }] };
    return { zero: (f === 'sin' ? 'sin' : 'cos') + '(' + argE + ')-(' + vN + ')', cond: [] };
  }
  // типичные ошибки для простейшего f(u) = v, u = kx + b
  function simpleBad(f, v, k, b){
    const out = [];
    const P = PARTNER[f];
    if (ARC[P][v] !== undefined) out.push(solveX(P, v, k, b));                       // перепутал таблицу/формулу
    const good = formulaU(f, v)[0];
    if (good){
      // неверный период: 2πn ↔ πn
      out.push(toX([ser(good.c, good.sg, good.a, qeq(good.p, Q(1)) ? Q(2) : Q(1))], k, b));
      // формула «от другой функции»: ± вместо (−1)ⁿ и наоборот
      if (good.sg === 'alt') out.push(toX([ser(good.c, 'pm', good.a, Q(2))], k, b));
      if (good.sg === 'pm') out.push(toX([ser(good.c, 'alt', good.a, Q(1))], k, b));
      if (good.sg === '' && !(Array.isArray(good.a) && qz(good.a))) out.push(toX([ser(good.c, 'pm', good.a, Q(2))], k, b));
      // только одна серия из двух
      if (good.sg !== '') out.push(toX([ser(good.c, '', good.a, Q(2))], k, b));
    }
    if (v !== '0' && ARC[f][negKey(v)] !== undefined) out.push(solveX(f, negKey(v), k, b)); // потерян знак
    return out;
  }

  const GEN = {
    /* ── плашка 1 ── */
    spec(){
      const f = pick(['sin', 'cos']), v = pick(['0', '1', '-1']);
      const ft = F(f);
      const eq = pick([Eq(ft, VT[v]), v === '0' ? Eq(Mul(pick([2, 3, 5]), ft), 0) : Eq(v === '1' ? Sub(ft, 1) : Add(ft, 1), 0)]);
      const others = [];
      ['sin', 'cos'].forEach(g => ['0', '1', '-1'].forEach(w => { if (g !== f || w !== v) others.push(solveX(g, w)); }));
      const good = solveX(f, v);
      return { eq, good: L(good), bad: shuffle(others).map(L),
        steps: ['Частный случай — формулу общего вида не берём, отмечаем точку на окружности: ' + M(Eq(ft, VT[v])) + ' там, где ' + (f === 'sin' ? 'ордината' : 'абсцисса') + ' точки равна ' + M(VT[v]) + '.',
          (v === '0' ? 'Таких точек две, они повторяются через π' : 'Точка одна, она повторяется через 2π') + ': ' + serTxt(good) + '.'],
        ...zeroOf(f, 'x', VN[v]) };
    },
    sin(){ return simpleTile('sin', pick(Math.random() < .8 ? TABLE_SC : ['-1/2', '-r2/2', '-r3/2'])); },
    cos(){ return simpleTile('cos', pick(Math.random() < .8 ? TABLE_SC : ['-1/2', '-r2/2', '-r3/2'])); },
    neg(){ return simpleTile(pick(['sin', 'cos', 'cos']), pick(['-1/2', '-r2/2', '-r3/2'])); },
    tg(){ return simpleTile('tg', pick(TABLE_TG)); },
    ctg(){ return simpleTile('ctg', pick(TABLE_CTG)); },
    arc(){
      const f = pick(['sin', 'cos', 'sin', 'cos', 'tg', 'ctg']);
      const none = (f === 'sin' || f === 'cos') && Math.random() < .35;
      let v;
      if (none) v = pick([Q(3, 2), Q(-4, 3), Q(2), Q(-5, 4), Q(7, 5), Q(-3)]);
      else if (f === 'sin' || f === 'cos') v = pick([Q(1, 3), Q(2, 3), Q(1, 4), Q(3, 4), Q(2, 5), Q(-1, 3), Q(-2, 5), Q(-3, 4), Q(2, 7)]);
      else v = pick([Q(2), Q(3), Q(5), Q(1, 2), Q(-2), Q(-4), Q(1, 3)]);
      const vt = ['q', v];
      const eq = Eq(F(f), vt);
      const good = formulaU(f, { v });
      const bad = [];
      if (none){
        bad.push(L([ser(Q(0), f === 'sin' ? 'alt' : 'pm', { arc: f, v, k: Q(1) }, f === 'sin' ? Q(1) : Q(2))]));
        bad.push(L([ser(Q(0), f === 'sin' ? 'pm' : 'alt', { arc: PARTNER[f], v, k: Q(1) }, f === 'sin' ? Q(2) : Q(1))]));
        bad.push(L([ser(Q(0), '', { arc: 'tg', v, k: Q(1) }, Q(1))]));
      } else {
        bad.push(L([]));
        const g = good[0];
        bad.push(L([ser(Q(0), g.sg === 'alt' ? 'pm' : (g.sg === 'pm' ? 'alt' : 'pm'), g.a, g.sg === 'alt' ? Q(2) : Q(1))]));
        bad.push(L([ser(Q(0), g.sg, Object.assign({}, g.a, { arc: PARTNER[f] }), g.p)]));
        bad.push(L([ser(Q(0), g.sg, g.a, qeq(g.p, Q(1)) ? Q(2) : Q(1))]));
      }
      const steps = none
        ? ['Значения ' + (f === 'sin' ? 'синуса' : 'косинуса') + ' лежат на отрезке ' + M(['q', Q(-1)]) + '…' + M(1) + ', а ' + M(vt) + (Math.abs(qv(v)) > 1 ? ' за его пределами' : '') + '.', 'Уравнение корней не имеет.']
        : ['Число ' + M(vt) + ' не табличное — угол записываем через ' + ARCNAME[f] + '.', (f === 'sin' || f === 'cos' ? 'Так как ' + M(vt) + ' лежит между −1 и 1, корни есть; ' : 'Корни у tg и ctg есть при любом числе; ') + FORMULA_TXT[f] + ':', serTxt(good) + '.'];
      return { eq, good: L(good), bad, steps, ...zeroOf(f, 'x', qv(v)) };
    },

    /* ── плашка 2 ── */
    kx(){ const k = pick([2, 3, 4]); return compTile(pick(['sin', 'cos', 'tg']), Q(k), Q(0), Mul(k, X)); },
    xk(){ const k = pick([2, 3, 4]); return compTile(pick(['sin', 'cos', 'tg']), Q(1, k), Q(0), Fr(X, k)); },
    shift(){
      const b = pick([Q(1, 6), Q(1, 4), Q(1, 3), Q(1, 2), Q(-1, 6), Q(-1, 4), Q(-1, 3), Q(-1, 2)]);
      const arg = qv(b) > 0 ? Add(X, PI(b)) : Sub(X, PI(qn(b)));
      return compTile(pick(['sin', 'cos', 'cos', 'tg']), Q(1), b, arg);
    },
    lin(){
      const k = pick([2, 3]), b = pick([Q(1, 6), Q(1, 4), Q(1, 3), Q(-1, 6), Q(-1, 4), Q(-1, 3)]);
      const arg = qv(b) > 0 ? Add(Mul(k, X), PI(b)) : Sub(Mul(k, X), PI(qn(b)));
      return compTile(pick(['sin', 'cos', 'tg']), Q(k), b, arg);
    },
    tc2(){
      const f = pick(['tg', 'ctg']);
      const kind = pick(['k', 'd', 's']);
      if (kind === 'k'){ const k = pick([2, 3]); return compTile(f, Q(k), Q(0), Mul(k, X)); }
      if (kind === 'd'){ const k = pick([2, 3]); return compTile(f, Q(1, k), Q(0), Fr(X, k)); }
      const b = pick([Q(1, 6), Q(1, 4), Q(-1, 3), Q(-1, 4)]);
      return compTile(f, Q(1), b, qv(b) > 0 ? Add(X, PI(b)) : Sub(X, PI(qn(b))));
    },
    egeArg(){
      // cos π(x − a)/b = v: корни x = a + b·u/π, где u — корни простейшего
      for (let tries = 0; tries < 200; tries++){
        const f = pick(['sin', 'cos', 'cos', 'tg']);
        const b = pick([3, 4, 6, 12]), a = ri(-9, 9) || 7;
        const v = f === 'tg' ? pick(['1', '-1', 'r3', '-r3', 'r3/3', '-r3/3']) : pick(['1/2', '-1/2', 'r2/2', '-r2/2', 'r3/2', '-r3/2']);
        const L0 = latOf(f, v);   // u, доли π
        // x = a + b·u (u в долях π): решётка по x — числа
        const P = qm(L0.P, Q(b)), R = L0.R.map(r => qa(Q(a), qm(r, Q(b))));
        if (!R.every(r => r[1] === 1) || P[1] !== 1) continue;
        const pos = Math.random() < .5;
        // ближайшие к нулю корни каждого класса
        const cands = [];
        R.forEach(r => { for (let n = -40; n <= 40; n++){ const x = qv(r) + qv(P) * n; cands.push(x); } });
        const want = pos ? Math.min(...cands.filter(x => x > 0)) : Math.max(...cands.filter(x => x < 0));
        const argT = Fr(Mul(PI(Q(1)), a >= 0 ? Sub(X, a) : Add(X, -a)), b);
        const eq = Eq(F(f, argT), VT[v]);
        const xs = R.map(r => qv(r)).sort((p, q) => p - q);
        const shiftTxt = (a >= 0 ? '<i class="mv">x</i> − ' + a : '<i class="mv">x</i> + ' + (-a));
        const uList = formulaU(f, v);
        return { eq, ask: 'Решите уравнение. В ответе запишите ' + (pos ? '<b>наименьший положительный</b>' : '<b>наибольший отрицательный</b>') + ' корень.',
          good: { num: want },
          steps: ['Обозначим аргумент ' + M(argT) + ' и решим простейшее: ' + serTxt(uList).replace(/<i class="mv">x<\/i>/g, '<i class="mv">u</i>') + '.',
            'Умножаем на ' + b + ' и делим на π: ' + '<span class="mx">' + shiftTxt + ' = …</span>, значит корни — ' + xs.map(x => '<span class="mx">' + String(x).replace('-', '−') + ' + ' + qv(P) + '<i class="mv">n</i></span>').join(' и ') + '.',
            'Перебираем n и выбираем ' + (pos ? 'наименьший положительный' : 'наибольший отрицательный') + ': ' + M(want) + '.'],
          ...zeroOf(f, 'pi*(x-(' + a + '))/' + b, VN[v]) };
      }
      throw new Error('trig-bank: egeArg');
    },

    /* ── плашка 3 ── */
    fac(){
      const kind = pick(['sc', 'sc', 's2', 'sq', 'cq']);
      let eq, parts, zero, stepsA;
      if (kind === 'sc' || kind === 's2'){
        // A sin x cos x = B cos x → cos x (A sin x − B) = 0
        const outer = pick(['sin', 'cos']), inner = PARTNER[outer] === 'sin' ? 'sin' : 'cos';
        const v = pick(['1/2', 'r2/2', 'r3/2', '-1/2', '-r3/2']);
        const vt = VT[v];
        const lhs = kind === 's2' ? F('sin', Mul(2, X)) : Mul(2, F('sin'), F('cos'));
        // правая часть: 2·v·(outer)
        const coef = { '1/2': 1, 'r2/2': SQ(2), 'r3/2': SQ(3), '-1/2': -1, '-r3/2': Neg(SQ(3)) }[v];
        const rhs = typeof coef === 'number' ? (coef === 1 ? F(outer) : Neg(F(outer))) : (coef[0] === 'neg' ? Neg(Mul(coef[1], F(outer))) : Mul(coef, F(outer)));
        eq = Eq(lhs, rhs);
        parts = [latOf(outer, '0'), latOf(inner, v)];
        stepsA = [(kind === 's2' ? 'По формуле двойного угла ' + M(Eq(F('sin', Mul(2, X)), Mul(2, F('sin'), F('cos')))) + '. ' : '') + 'Переносим всё влево и выносим ' + M(F(outer)) + ' за скобки. Делить на ' + M(F(outer)) + ' нельзя — потеряем корни.',
          'Произведение равно нулю: ' + M(Eq(F(outer), 0)) + ' или ' + M(Eq(F(inner), vt)) + '.'];
        zero = expr(eq);
      } else {
        // A f² x = B f x → f x = 0 или f x = B/A
        const f = kind === 'sq' ? 'sin' : 'cos';
        const v = pick(['1/2', 'r3/2', '-1/2', 'r2/2']);
        const coefR = { '1/2': [2, 1], 'r3/2': [2, SQ(3)], '-1/2': [2, -1], 'r2/2': [2, SQ(2)] }[v];
        const rhsCoef = coefR[1];
        const rhs = rhsCoef === 1 ? F(f) : rhsCoef === -1 ? Neg(F(f)) : Mul(rhsCoef, F(f));
        eq = Eq(Mul(2, F(f, X, 2)), rhs);
        parts = [latOf(f, '0'), latOf(f, v)];
        stepsA = ['Переносим всё влево и выносим ' + M(F(f)) + ' за скобки (делить на ' + M(F(f)) + ' нельзя).', 'Отсюда ' + M(Eq(F(f), 0)) + ' или ' + M(Eq(F(f), VT[v])) + '.'];
        zero = expr(eq);
      }
      const good = latToSeries(latUnion(parts[0], parts[1]));
      return { eq, good: L(good), bad: [L(latToSeries(parts[1])), L(latToSeries(parts[0])), L(latToSeries(latUnion(parts[0], negLat(parts[1]))))],
        steps: stepsA.concat(['Объединяем корни: ' + serTxt(good) + '.']), zero, cond: [] };
    },
    quad(){ return quadTile('plain'); },
    ident(){ return quadTile('ident'); },
    dbl(){ return quadTile('dbl'); },
    red(){
      // f(A ± x) = v → по формуле приведения ±g(x) = v
      const RED = [
        ['sin', Q(1, 2), -1, 'cos', 1], ['sin', Q(1, 2), 1, 'cos', 1], ['sin', Q(1), -1, 'sin', 1], ['sin', Q(1), 1, 'sin', -1],
        ['sin', Q(3, 2), -1, 'cos', -1], ['sin', Q(3, 2), 1, 'cos', -1], ['cos', Q(1, 2), -1, 'sin', 1], ['cos', Q(1, 2), 1, 'sin', -1],
        ['cos', Q(1), -1, 'cos', -1], ['cos', Q(1), 1, 'cos', -1], ['cos', Q(3, 2), -1, 'sin', -1], ['cos', Q(3, 2), 1, 'sin', 1],
      ];
      const [f, A, sx, g, sg] = pick(RED);
      const v = pick(['1/2', 'r2/2', 'r3/2', '-1/2', '1', '0']);
      const arg = sx > 0 ? Add(PI(A), X) : Sub(PI(A), X);
      const eq = Eq(F(f, arg), VT[v]);
      const w = sg > 0 ? v : negKey(v);
      const good = latToSeries(latOf(g, w));
      const bad = [L(latToSeries(latOf(g, negKey(w)))), L(latToSeries(latOf(f, v))), L(latToSeries(latOf(f, negKey(v))))];
      return { eq, good: L(good), bad,
        steps: ['По формуле приведения ' + M(Eq(F(f, arg), sg > 0 ? F(g) : Neg(F(g)))) + ' (' + (f === g ? 'функция не меняется' : 'функция меняется на ко-функцию') + ', знак — по четверти).',
          'Получаем простейшее ' + M(Eq(F(g), VT[w])) + ': ' + serTxt(good) + '.'],
        zero: expr(eq), cond: [] };
    },
    hom(){
      if (Math.random() < .45){
        // a sin x + b cos x = 0 → tg x = −b/a
        const forms = [
          [Eq(F('sin'), Mul(SQ(3), F('cos'))), 'r3'], [Eq(F('sin'), F('cos')), '1'], [Eq(Add(F('sin'), F('cos')), 0), '-1'],
          [Eq(Sub(Mul(SQ(3), F('sin')), F('cos')), 0), 'r3/3'], [Eq(Add(F('sin'), Mul(SQ(3), F('cos'))), 0), '-r3'], [Eq(Mul(SQ(3), F('sin')), Neg(F('cos'))), '-r3/3'],
        ];
        const [eq, t] = pick(forms);
        const good = latToSeries(latOf('tg', t));
        return { eq, good: L(good), bad: [L(latToSeries(latOf('tg', negKey(t)))), L(latToSeries(latOf('ctg', t))), L(latToSeries(latUnion(latOf('tg', t), latOf('cos', '0'))))],
          steps: ['Однородное первой степени. ' + M(Eq(F('cos'), 0)) + ' не подходит: тогда и ' + M(Eq(F('sin'), 0)) + ', а так не бывает. Делим на ' + M(F('cos')) + ':', M(Eq(F('tg'), VT[t])) + ', ' + serTxt(good) + '.'],
          zero: expr(eq), cond: [] };
      }
      // sin² x + B sin x cos x + C cos² x = 0 → t² + Bt + C = 0, t = tg x
      const R0 = shuffle([1, -1, 2, -2, 3, -3]);
      const t1 = R0[0], t2 = R0.find(t => t !== t1 && t !== -t1);
      const B = -(t1 + t2), C = t1 * t2;
      const eq = Eq(poly([[1, F('sin', X, 2)], [B, Mul(F('sin'), F('cos'))], [C, F('cos', X, 2)]]), 0);
      const part = t => Math.abs(t) === 1 ? { lat: latOf('tg', t > 0 ? '1' : '-1') } : { arc: [ser(Q(0), '', { arc: 'tg', v: Q(Math.abs(t)), k: Q(t > 0 ? 1 : -1) }, Q(1))] };
      const sol = ts => { let lat = null, arcs = []; ts.forEach(t => { const p = part(t); if (p.lat) lat = latUnion(lat, p.lat); else arcs = arcs.concat(p.arc); }); return latToSeries(lat).concat(arcs); };
      const good = sol([t1, t2]);
      return { eq, good: L(good), bad: [L(sol([t1])), L(sol([-t1, -t2])), L(good.concat(latToSeries(latOf('cos', '0'))))],
        steps: ['Однородное второй степени: ' + M(Eq(F('cos'), 0)) + ' не подходит (тогда и ' + M(Eq(F('sin'), 0)) + '). Делим на ' + M(F('cos', X, 2)) + ':',
          M(Eq(poly([[1, F('tg', X, 2)], [B, F('tg')], [C, null]]), 0)) + ', откуда ' + M(Eq(F('tg'), t1)) + ' или ' + M(Eq(F('tg'), t2)) + '.',
          serTxt(good) + '.'],
        zero: expr(eq), cond: [] };
    },
    tgctg(){
      const R0 = shuffle([1, -1, 2, -2, 3, -3]);
      const t1 = R0[0], t2 = R0.find(t => t !== t1 && t !== -t1);
      const k = t1 * t2, m = t1 + t2;
      const eq = Eq(poly([[1, F('tg')], [k, F('ctg')]]), m);
      const part = t => Math.abs(t) === 1 ? latToSeries(latOf('tg', t > 0 ? '1' : '-1')) : [ser(Q(0), '', { arc: 'tg', v: Q(Math.abs(t)), k: Q(t > 0 ? 1 : -1) }, Q(1))];
      const good = part(t1).concat(part(t2));
      return { eq, good: L(good), bad: [L(part(t1)), L(part(-t1).concat(part(-t2))), L(part(t2))],
        steps: ['Так как ' + M(Eq(F('ctg'), Fr(1, F('tg')))) + ', обозначим ' + M(Eq(['v', 't'], F('tg'))) + ' (t ≠ 0): ' + M(Eq(poly([[1, ['v', 't']], [k, Fr(1, ['v', 't'])]]), m)) + '.',
          'Умножаем на t: ' + M(Eq(poly([[1, ['pow', ['v', 't'], 2]], [-m, ['v', 't']], [k, null]]), 0)) + ', ' + M(Eq(['v', 't'], t1)) + ' или ' + M(Eq(['v', 't'], t2)) + '.',
          serTxt(good) + '.'],
        zero: 'sin(x)**2+(' + (-m) + ')*sin(x)*cos(x)+(' + k + ')*cos(x)**2', cond: [{ e: 'sin(x)', t: 'ne' }, { e: 'cos(x)', t: 'ne' }] };
    },

    /* ── плашка 4 ── */
    enum(){ return selTile('enum'); },
    ineq(){ return selTile('ineq'); },
    circ(){ return selTile('circ'); },

    /* ── плашка 5 ── */
    ab(){
      const inner = pick([GEN.fac, () => quadTile('plain', true), () => quadTile('ident', true), () => quadTile('dbl', true), GEN.red])();
      const lat = seriesToLat(inner.good.list);
      if (!lat) return GEN.ab();
      const seg = pickSeg();
      const rs = latRoots(lat, seg);
      if (!rs.length) return GEN.ab();
      const bad = rootBad(lat, rs, seg).concat(inner.bad.map(b => seriesToLat(b.list)).filter(Boolean).map(l => ({ roots: latRoots(l, seg), seg })));
      return { eq: inner.eq, ask: 'а) Решите уравнение. б) Укажите корни этого уравнения, принадлежащие отрезку ' + segHTML(seg) + '.',
        good: { roots: rs, seg }, bad,
        steps: ['а) ' + inner.steps.join(' '), 'б) Отбираем корни на отрезке ' + segHTML(seg) + ' (перебором n или по окружности): ' + rootsHTML(rs) + '.'],
        zero: inner.zero, cond: inner.cond, seg };
    },
    frac(){
      for (let i = 0; i < 100; i++){
        // числитель f(2f − 2v) после выноса: 2f² − 2v·f; знаменатель — g − w ≠ 0
        const f = pick(['sin', 'cos']);
        const v = pick(['1/2', 'r2/2', 'r3/2', '-1/2', '-r2/2']);
        const num = minusTwice(Mul(2, F(f, X, 2)), v, F(f));
        const S = latUnion(latOf(f, '0'), latOf(f, v));
        const g = PARTNER[f];
        const w = pick(['1/2', 'r2/2', 'r3/2', '-1/2', '-r2/2', '-r3/2', '1', '-1']);
        const Ex = latOf(g, w);
        const ans = latMinus(S, Ex);
        // интересно, только если ОДЗ что-то выбрасывает, но не всё
        if (latMinus(S, ans).R.length === 0 || !ans.R.length) continue;
        const den = w === '1' ? Sub(F(g), 1) : w === '-1' ? Add(F(g), 1) : minusTwice(Mul(2, F(g)), w, 1);
        const eq = Eq(Fr(num, den), 0);
        const good = latToSeries(ans);
        const NE = t => t.replace('<span class="mo eq">=</span>', '<span class="mo eq">≠</span>');
        return { eq, good: L(good), bad: [L(latToSeries(S)), L(latToSeries(latMinus(S, latOf(g, negKey(w))))), L(latToSeries(latMinus(latOf(f, v), Ex))), L(latToSeries(latMinus(latOf(f, '0'), Ex)))],
          steps: ['Дробь равна нулю, когда числитель равен нулю, а знаменатель — нет.',
            'Числитель: выносим ' + M(F(f)) + ' за скобки — ' + M(Eq(F(f), 0)) + ' или ' + M(Eq(F(f), VT[v])) + '; это ' + serTxt(latToSeries(S)) + '.',
            'Знаменатель: ' + NE(M(Eq(F(g), VT[w]))) + ' — выбрасываем точки ' + serTxt(latToSeries(latMinus(S, ans))) + '.',
            'Ответ: ' + serTxt(good) + '.'],
          zero: expr(num), cond: [{ e: expr(den), t: 'ne' }] };
      }
      throw new Error('trig-bank: frac');
    },
    root(){
      for (let i = 0; i < 100; i++){
        // √(h) · (2g − c) = 0: h = 0 — всегда корни; g = w — только где h ≥ 0
        const hs = pick([['sin', 1], ['cos', 1], ['sin', -1], ['cos', -1]]);
        const hT = hs[1] > 0 ? F(hs[0]) : Neg(F(hs[0]));
        const g = PARTNER[hs[0]];
        const w = pick(['1/2', 'r2/2', 'r3/2', '-1/2', '-r2/2']);
        const H0 = latOf(hs[0], '0');
        const G = latOf(g, w);
        const hv = r => hs[1] * (hs[0] === 'sin' ? Math.sin(qv(r) * Math.PI) : Math.cos(qv(r) * Math.PI));
        const Gok = latFilter(G, r => hv(r) >= -1e-12);
        const ans = latUnion(H0, Gok);
        if (Gok.R.length === G.R.length || !Gok.R.length) continue;
        const factor = minusTwice(Mul(2, F(g)), w, 1);
        const eq = Eq(Mul(SQ(hT), factor), 0);
        const good = latToSeries(ans);
        return { eq, good: L(good), bad: [L(latToSeries(latUnion(H0, G))), L(latToSeries(Gok)), L(latToSeries(latUnion(H0, latFilter(G, r => hv(r) <= 1e-12))))],
          steps: ['ОДЗ: ' + M(hT) + ' ≥ 0.', 'Произведение равно нулю: ' + M(Eq(hT, 0)) + ' — корни ' + serTxt(latToSeries(H0)) + ' (подходят всегда), или ' + M(Eq(F(g), VT[w])) + '.',
            'Из серии ' + serTxt(latToSeries(G)) + ' оставляем только точки, где ' + M(hT) + ' ≥ 0: ' + serTxt(latToSeries(Gok)) + '.', 'Ответ: ' + serTxt(good) + '.'],
          zero: '(' + expr(hT) + ')*(' + expr(factor) + ')', cond: [{ e: expr(hT), t: 'ge' }] };
      }
      throw new Error('trig-bank: root');
    },
    expo(){
      const f = pick(['sin', 'cos']);
      const kind = pick(['01', 'pm1', 'half']);
      const E = F(f);
      let eq, vals, stepsT;
      if (kind === '01'){
        const b = pick([2, 3, 5]);
        eq = Eq(Add(['pow', b, Mul(2, E)], Neg(Mul(b + 1, ['pow', b, E])), b), 0);
        vals = ['0', '1'];
        stepsT = 'Замена ' + M(Eq(['v', 't'], ['pow', b, E])) + ' (t > 0): ' + M(Eq(poly([[1, ['pow', ['v', 't'], 2]], [-(b + 1), ['v', 't']], [b, null]]), 0)) + ', t = 1 или t = ' + b + '.';
      } else if (kind === 'pm1'){
        const b = pick([2, 3, 5]);
        eq = Eq(Add(['pow', b, E], ['pow', b, Neg(E)]), Fr(b * b + 1, b));
        vals = ['1', '-1'];
        stepsT = 'Замена ' + M(Eq(['v', 't'], ['pow', b, E])) + ': ' + M(Eq(Add(['v', 't'], Fr(1, ['v', 't'])), Fr(b * b + 1, b))) + ', t = ' + b + ' или t = ' + M(Fr(1, b)) + '.';
      } else {
        const r = pick([2, 3]), b = r * r;
        eq = Eq(Add(['pow', b, E], ['pow', b, Neg(E)]), Fr(r * r + 1, r));
        vals = ['1/2', '-1/2'];
        stepsT = 'Замена ' + M(Eq(['v', 't'], ['pow', b, E])) + ': ' + M(Eq(Add(['v', 't'], Fr(1, ['v', 't'])), Fr(r * r + 1, r))) + ', t = ' + r + ' или t = ' + M(Fr(1, r)) + ', то есть ' + M(['pow', b, E]) + ' = ' + M(['pow', b, Fr(1, 2)]) + ' или ' + M(['pow', b, Neg(Fr(1, 2))]) + '.';
      }
      const A = latOf(f, vals[0]), B = latOf(f, vals[1]);
      const good = latToSeries(latUnion(A, B));
      return { eq, good: L(good), bad: [L(latToSeries(A)), L(latToSeries(B)), L(latToSeries(latUnion(latOf(PARTNER[f], vals[0]), latOf(PARTNER[f], vals[1]))))],
        steps: [stepsT, 'Значит, ' + M(Eq(E, VT[vals[0]])) + ' или ' + M(Eq(E, VT[vals[1]])) + '.', 'Ответ: ' + serTxt(good) + '.'],
        zero: expr(eq), cond: [] };
    },
  };
  function negLat(L0){ return normLat({ P: L0.P, R: L0.R.map(qn) }); }
  // серии → решётка (если все табличные)
  function seriesToLat(list){
    let lat = { P: Q(2), R: [] };
    for (const s of list){ const l = toLat(s); if (!l) return null; lat = latUnion(lat, l); }
    return lat;
  }

  // плашка 1: f(x) = v с табличным v
  function simpleTile(f, v){
    const ft = F(f);
    const eq = pick(coefForms(ft, v));
    const good = solveX(f, v);
    const steps = [];
    if (eq[1] !== ft || eq[2] !== VT[v]) steps.push('Приводим к виду ' + M(Eq(ft, VT[v])) + '.');
    const ARG_NEG = '<span class="mx"><span class="fn">' + ARCNAME[f] + '</span>(−<i class="mv">a</i>) = ' + ((f === 'cos' || f === 'ctg') ? 'π − ' : '−') + ARCNAME[f] + ' <i class="mv">a</i></span>';
    if (v[0] === '-') steps.push('Число отрицательное: ' + ARG_NEG + ', поэтому ' + arcEq(f, v) + '.');
    else steps.push('По таблице: ' + arcEq(f, v) + '.');
    steps.push((['0', '1', '-1'].indexOf(v) >= 0 && (f === 'sin' || f === 'cos') ? 'Частный случай: ' : FORMULA_TXT[f][0].toUpperCase() + FORMULA_TXT[f].slice(1) + ': ') + serTxt(good) + '.');
    return { eq, good: L(good), bad: simpleBad(f, v).map(L), steps, zero: expr(eq), cond: f === 'tg' ? [{ e: 'cos(x)', t: 'ne' }] : f === 'ctg' ? [{ e: 'sin(x)', t: 'ne' }] : [] };
  }
  // плашка 2: f(kx + b) = v
  function compTile(f, k, b, argT){
    const tbl = f === 'tg' ? TABLE_TG : f === 'ctg' ? TABLE_CTG : TABLE_ALL_SIN;
    const v = pick(tbl.filter(x => (f !== 'cos' || ARC.cos[x] !== undefined)));
    const eq = Eq(F(f, argT), VT[v]);
    const u = formulaU(f, v);
    const good = toX(u, k, b);
    const bad = simpleBad(f, v, k, b);
    // типичные ошибки составного аргумента: не поделили период, не
    // перенесли сдвиг, сдвиг с тем же знаком
    if (!qeq(k, Q(1))) bad.push(u.map(s => ser(qd(qn(b), k), s.sg, qd(s.a, k), s.p)), u.map(s => ser(qa(s.c, qn(b)), s.sg, s.a, qd(s.p, k))));
    if (!qz(b)) bad.push(toX(u, k, qn(b)), toX(u, k, Q(0)));
    const uTxt = serTxt(u).replace(/<i class="mv">x<\/i>/g, M(argT));
    const steps = ['Обозначим аргумент ' + M(argT) + ' и решим как простейшее: ' + (ARC[f][v] !== undefined ? arcEq(f, v) + ', ' : '') + uTxt + '.'];
    if (!qz(b)) steps.push('Переносим ' + piHTML(qv(b) > 0 ? b : qn(b)) + ' в правую часть с противоположным знаком.');
    if (!qeq(k, Q(1))) steps.push(qv(k) > 1 ? 'Делим обе части на ' + qv(k) + ' — делится и период.' : 'Умножаем обе части на ' + (1 / qv(k)) + ' — умножается и период.');
    steps.push(serTxt(good) + '.');
    const argE = expr(argT);
    return { eq, good: L(good), bad: bad.map(L), steps, ...zeroOf(f, argE, VN[v]) };
  }
  // плашка 3: квадратные (в том числе через тождество и двойной угол)
  function quadTile(kind, latOnly){
    for (let tries = 0; tries < 300; tries++){
      const f = kind === 'plain' ? pick(['sin', 'cos', 'tg']) : pick(['sin', 'cos']);
      const H = f === 'tg' ? [[1, 1], [-1, 1], [0, 1], [3, 1], [2, 1], [-2, 1]] : [[1, 2], [-1, 2], [1, 1], [-1, 1], [0, 1], [2, 1], [-2, 1], [3, 2], [-3, 2]];
      const r1 = pick(H), r2 = pick(H);
      if (r1[0] * r2[1] === r2[0] * r1[1]) continue;
      const valid = r => f === 'tg' ? true : Math.abs(r[0] / r[1]) <= 1;
      if (!valid(r1) && !valid(r2)) continue;
      if (f === 'tg' && latOnly && (Math.abs(r1[0]) > 1 || Math.abs(r2[0]) > 1)) continue;
      // (q1 t − p1)(q2 t − p2)
      let A = r1[1] * r2[1], B = -(r1[1] * r2[0] + r2[1] * r1[0]), C = r1[0] * r2[0];
      const key = r => ({ '1/2': '1/2', '-1/2': '-1/2', '1/1': '1', '-1/1': '-1', '0/1': '0' })[r[0] + '/' + r[1]];
      const t = F(f);
      let eq, pre = '';
      if (kind === 'plain') eq = Eq(poly([[A, F(f, X, 2)], [B, t], [C, null]]), 0);
      else if (kind === 'ident'){
        // A f² = A − A g²:  −A g² + B f + (A + C) = 0 → A g² − B f − (A + C) = 0
        const g = PARTNER[f];
        eq = Eq(poly([[A, F(g, X, 2)], [-B, t], [-(A + C), null]]), 0);
        pre = 'Заменяем ' + M(Eq(F(g, X, 2), Sub(1, F(f, X, 2)))) + ' — получаем уравнение только с ' + M(t) + ':';
      } else {
        // cos 2x через sin: 1 − 2 sin²; через cos: 2 cos² − 1. Нужно A = 2
        if (A !== 2 && A !== 4) continue;
        const s = A / 2;
        if (f === 'sin'){ // A s² + B s + C = 0 ↔ s·(2 sin² − 1) + … : −s·cos 2x + B sin x + (C + s) = 0
          eq = Eq(poly([[-s, F('cos', Mul(2, X))], [B, t], [C + s, null]]), 0);
          if (-s < 0) eq = Eq(poly([[s, F('cos', Mul(2, X))], [-B, t], [-(C + s), null]]), 0);
          pre = 'По формуле ' + M(Eq(F('cos', Mul(2, X)), Sub(1, Mul(2, F('sin', X, 2))))) + ' переходим к уравнению с ' + M(t) + ':';
        } else {
          // A cos² x = s·(cos 2x + 1), s = A/2
          eq = Eq(poly([[s, F('cos', Mul(2, X))], [B, t], [C + s, null]]), 0);
          pre = 'По формуле ' + M(Eq(F('cos', Mul(2, X)), Sub(Mul(2, F('cos', X, 2)), 1))) + ' переходим к уравнению с ' + M(t) + ':';
        }
      }
      const part = r => {
        if (!valid(r)) return { none: true };
        const k = key(r);
        if (k !== undefined && ARC[f][k] !== undefined) return { lat: latOf(f, k) };
        if (latOnly) return { bad: true };
        return { arc: formulaU(f, { v: Q(r[0], r[1]) }) };
      };
      const p1 = part(r1), p2 = part(r2);
      if (p1.bad || p2.bad) continue;
      const sol = ps => { let lat = null, arcs = []; ps.forEach(p => { if (p.lat) lat = latUnion(lat, p.lat); if (p.arc) arcs = arcs.concat(p.arc); }); return latToSeries(lat).concat(arcs); };
      const good = sol([p1, p2]);
      if (!good.length) continue;
      const bad = [L(sol([p1])), L(sol([p2]))];
      // посторонний корень не отброшен — «серия» с arcsin 2
      // посторонний корень не отброшен: «серия» с arcsin 2 — её не бывает
      [r1, r2].forEach(r => { if (!valid(r)) bad.push(L(good.concat([ser(Q(0), f === 'sin' ? 'alt' : 'pm', { arc: f, v: Q(r[0], r[1]), k: Q(1) }, f === 'sin' ? Q(1) : Q(2))]))); });
      const flip = r => valid([-r[0], r[1]]) ? part([-r[0], r[1]]) : { none: true };
      const fb = [flip(r1), flip(r2)];
      if (!fb.some(p => p.bad)) bad.push(L(sol(fb)));
      const tv = ['v', 't'];
      const rt = r => r[1] === 1 ? r[0] : (r[0] < 0 ? Neg(Fr(-r[0], r[1])) : Fr(r[0], r[1]));
      const steps = [];
      if (pre) steps.push(pre + ' ' + M(Eq(poly([[A, F(f, X, 2)], [B, t], [C, null]]), 0)) + '.');
      steps.push('Замена ' + M(Eq(tv, t)) + (f === 'tg' ? '' : ', где ' + M(['q', Q(-1)]) + ' ≤ t ≤ 1') + ': ' + M(Eq(poly([[A, ['pow', tv, 2]], [B, tv], [C, null]]), 0)) + ', корни ' + M(Eq(tv, rt(r1))) + ' и ' + M(Eq(tv, rt(r2))) + '.');
      [r1, r2].forEach(r => { if (!valid(r)) steps.push(M(Eq(t, rt(r))) + ' — корней нет, так как |' + M(t) + '| ≤ 1.'); });
      steps.push('Возвращаемся к x: ' + serTxt(good) + '.');
      return { eq, good: L(good), bad, steps, zero: expr(eq), cond: f === 'tg' ? [{ e: 'cos(x)', t: 'ne' }] : [] };
    }
    throw new Error('trig-bank: quad');
  }
  // плашка 4: отбор корней простейшего уравнения
  function pickSeg(){
    const segs = [[Q(-1), Q(1, 2)], [Q(0), Q(2)], [Q(-3, 2), Q(1, 2)], [Q(1, 2), Q(5, 2)], [Q(-2), Q(0)], [Q(-1, 2), Q(3, 2)], [Q(2), Q(7, 2)], [Q(-7, 2), Q(-2)], [Q(3, 2), Q(3)], [Q(-5, 2), Q(-1)], [Q(0), Q(3)], [Q(-3), Q(-3, 2)]];
    return pick(segs);
  }
  function rootBad(lat, rs, seg){
    const out = [];
    // корень у края потерян; добавлен соседний за краем; «зеркальные» знаки
    if (rs.length > 1){ out.push({ roots: rs.slice(1), seg }); out.push({ roots: rs.slice(0, -1), seg }); }
    const wide = latRoots(lat, [qs(seg[0], Q(1, 2)), qa(seg[1], Q(1, 2))]);
    if (wide.length > rs.length) out.push({ roots: wide, seg });
    out.push({ roots: rs.map(qn).sort((a, b) => qv(a) - qv(b)), seg });
    return out;
  }
  function selTile(how){
    for (let i = 0; i < 100; i++){
      const f = pick(['sin', 'cos', 'tg', 'sin', 'cos']);
      const v = f === 'tg' ? pick(['1', '-1', 'r3', '-r3', 'r3/3']) : pick(['1/2', '-1/2', 'r2/2', 'r3/2', '-r3/2', '-r2/2', '0', '1']);
      const argK = Math.random() < .25 && how !== 'circ' ? 2 : 1;
      const lat = latOf(f, v, Q(argK));
      const seg = pickSeg();
      const rs = latRoots(lat, seg);
      if (!rs.length || rs.length > 5) continue;
      const argT = argK === 1 ? X : Mul(2, X);
      const eq = Eq(F(f, argT), VT[v]);
      const serL = toX(formulaU(f, v), Q(argK));
      const bad = rootBad(lat, rs, seg);
      const other = latOf(PARTNER[f] === 'ctg' ? 'tg' : PARTNER[f], ARC[PARTNER[f]][v] !== undefined ? v : '1/2', Q(argK));
      bad.push({ roots: latRoots(other, seg), seg });
      const series = latToSeries(lat);
      let st;
      if (how === 'enum') st = 'Перебираем n в каждой серии и оставляем значения, попавшие в отрезок: ' + rootsHTML(rs) + '.';
      else if (how === 'ineq') st = 'Для каждой серии решаем двойное неравенство ' + piHTML(seg[0]) + ' ≤ … ≤ ' + piHTML(seg[1]) + ' относительно n, берём целые n: ' + rootsHTML(rs) + '.';
      else st = 'Отмечаем на окружности дугу от ' + piHTML(seg[0]) + ' до ' + piHTML(seg[1]) + ' и точки серий на ней: ' + rootsHTML(rs) + '.';
      return { eq, ask: 'Найдите корни уравнения, принадлежащие отрезку ' + segHTML(seg) + '.', good: { roots: rs, seg }, bad,
        steps: ['Решаем уравнение: ' + serTxt(serL) + (series.length !== serL.length || f === 'sin' ? ', то есть ' + serTxt(series) : '') + '.', st],
        ...zeroOf(f, argK === 1 ? 'x' : '2*x', VN[v]), seg };
    }
    throw new Error('trig-bank: sel');
  }

  /* ═══════════════ сборка задания ═══════════════ */
  let serial = 0;
  const lastText = {};
  let lastPid = null;
  function optKey(o){ return o.list ? rootsOf(o.list) : o.roots ? o.roots.map(qv) : null; }
  function optHTML(o){ return o.list ? answerHTML(o.list) : rootsHTML(o.roots); }
  function build(pid, spec){
    const tile = tileById(pid);
    const t = { pid, lvl: tile.lvl, key: pid + '-' + Date.now().toString(36) + '-' + (++serial) + '-' + Math.random().toString(36).slice(2, 6) };
    t.text = '<div class="log-ask">' + (spec.ask || 'Решите уравнение.') + '</div><div class="log-expr">' + render(spec.eq) + '</div>';
    if (spec.good.num !== undefined){
      t.kind = 'calc';
      t.fields = [{ id: 'a', label: 'Ответ:', type: 'num', value: String(spec.good.num) }];
      t.answer = numHTML(spec.good.num);
    } else {
      t.kind = 'choice';
      const gk = optKey(spec.good);
      const seen = [gk];
      const bads = [];
      shuffle(spec.bad || []).forEach(b => {
        if (bads.length >= 3) return;
        const k = optKey(b);
        const html = optHTML(b);
        // вариант, равный верному (или уже взятому), — другая запись того же
        // множества: такой «неверный» вариант был бы верным
        if (k && seen.some(s => s && sameRoots(s, k))) return;
        if (!k && bads.some(x => optHTML(x) === html)) return;
        if (html === optHTML(spec.good)) return;
        seen.push(k);
        bads.push(b);
      });
      // запас: если типичных ошибок набралось мало — сдвиг на полпериода и
      // смена знака у верного ответа (тоже отсеиваются, если совпали)
      const spare = [];
      if (spec.good.list) spec.good.list.forEach((s0, i) => {
        spare.push({ list: spec.good.list.map((s1, j) => j === i ? ser(qa(s1.c, qd(s1.p, Q(2))), s1.sg, s1.a, s1.p) : s1) });
        if (!isArc(s0.a)) spare.push({ list: spec.good.list.map((s1, j) => j === i ? ser(qn(s1.c), s1.sg, qn(s1.a), s1.p) : s1) });
        spare.push({ list: spec.good.list.map((s1, j) => j === i ? ser(s1.c, s1.sg, s1.a, qm(s1.p, Q(2))) : s1) });
        spare.push({ list: spec.good.list.map((s1, j) => j === i ? ser(s1.c, s1.sg, s1.a, qd(s1.p, Q(2))) : s1) });
      });
      if (spec.good.roots){ const rs = spec.good.roots; spare.push({ roots: rs.map(r => qa(r, Q(1))) }, { roots: rs.map(r => qs(r, Q(1, 2))) }, { roots: rs.concat([qa(rs[rs.length - 1], Q(1, 3))]) }); }
      spare.forEach(b => {
        if (bads.length >= 3) return;
        const k = optKey(b);
        if (!k || seen.some(s => s && sameRoots(s, k))) return;
        if (b.list && !b.list.length) return;
        seen.push(k); bads.push(b);
      });
      const opts = shuffle([spec.good].concat(bads));
      const correct = opts.indexOf(spec.good);
      t.choice = { opts: opts.map(optHTML), correct };
      t.answer = optHTML(spec.good);
      t.optData = opts.map(o => o.list ? { list: o.list.map(serData) } : { roots: o.roots.map(qv) });
    }
    t.steps = spec.steps;
    t.peek = plain(spec.eq);
    t.meta = { zero: spec.zero, cond: spec.cond || [], eq: expr(spec.eq), seg: spec.seg ? spec.seg.map(qv) : null,
      good: spec.good.num !== undefined ? { num: spec.good.num } : spec.good.list ? { list: spec.good.list.map(serData) } : { roots: spec.good.roots.map(qv) } };
    return t;
  }
  // серия числами (для теста и доски): база, шаг, вид; a — в радианах
  function serData(s){ return { c: qv(s.c) * Math.PI, a: aNum(s.a), p: qv(s.p) * Math.PI, sg: s.sg, text: seriesPlain(s) }; }

  function generateRaw(pids, lvlUnused, prefer){
    const list = (Array.isArray(pids) ? pids : [pids]).filter(p => GEN[p]);
    if (!list.length) list.push(TILES[0].id);
    let pid = prefer && list.indexOf(prefer) >= 0 ? prefer : pick(list);
    if (!prefer && list.length > 1 && pid === lastPid) pid = pick(list.filter(p => p !== lastPid));
    lastPid = pid;
    let t = null;
    for (let i = 0; i < 8; i++){
      t = build(pid, GEN[pid]());
      if (t.text !== lastText[pid]) break;
    }
    lastText[pid] = t.text;
    return t;
  }
  /* Промпт №18 нового списка: без повторов (no-repeat.js). Своя защита
     банка (то же условие два раза подряд) — только от соседнего задания, а
     «+5» или несколько «⟳» подряд всё равно повторяли задания и ответы.
     Ключи — условие и ответ: у задания есть случайный key, целиком объект
     каждый раз «новый». Без модуля (тест грузит банк отдельно) — как раньше */
  function generate(pids, lvlUnused, prefer){
    if (!window.NoRepeat) return generateRaw(pids, lvlUnused, prefer);
    const scope = 'trig:' + [].concat(pids).join(',') + ':' + (prefer || '');
    // «подряд не тот же тип» считается от ПРИНЯТОГО задания, а не от
    // отбракованной пробы — lastPid возвращаем перед каждой пробой
    const keepPid = lastPid;
    const t = window.NoRepeat.pick(scope, () => { lastPid = keepPid; return generateRaw(pids, lvlUnused, prefer); });
    // принято могло быть и не последнее опробованное
    if (t && t.pid) lastPid = t.pid;
    return t;
  }

  window.TRIG_BANK = {
    levels: LEVELS, groups: GROUPS, tiles: TILES, tileById, groupById,
    generate, render, plain, expr, piHTML,
    // для плиток: разметка формул и серий теми же функциями, что в заданиях
    seriesHTML, answerHTML, Q, ser, F, Eq, Fr, SQ, Mul, Add, Sub, Neg, PI, X, VT,
    _internal: { latOf, latToSeries, formulaU, solveX, rootsOf, sameRoots, GEN },
  };
})();
