/* ═══════════════════════════════════════════════════════════════════════
   Промпт №18 нового списка: защита от повторяющихся и похожих заданий.
   Общий модуль для всех тренажёров, где задания придумывает генератор.

   Зачем. Генераторы случайные, и при нескольких заданиях подряд (⟳,
   «+1…+10», «Следующий пример», «ещё такое же» на доске) случай нет-нет
   да выдавал то же самое задание, тот же ответ два раза подряд или
   «то же самое с другим a» — ученик узнаёт ответ, а не решает.

   Как. Страница зовёт генератор не напрямую, а через
       NoRepeat.pick(scope, () => m.gen(), { keys, avoid })
   Модуль берёт кандидата у генератора, сравнивает его с историей этой
   области (scope — тренажёр, тип, уровень) по трём ключам и при совпадении
   просит другого:
     exact  — то же задание: то же условие с тем же верным ответом
              (неверные варианты случайные и в счёт не идут);
     shape  — «похожее»: та же запись, отличается только подставляемое
              значение переменной или основание (ключ даёт страница, у
              которой такое бывает, — ОГЭ №8 и «Степени»; по умолчанию нет);
     answer — тот же ответ у заданий подряд.
   У каждого ключа своё «окно» — с каким числом последних заданий он
   сравнивается (WIN): целиком задание не повторяется, пока его не
   вытеснили 120 других, похожее — среди 30 последних, ответ — среди 3.

   Если вариантов у генератора мало (демоверсия — всегда одно и то же,
   у некоторых типов десяток сочетаний), подходящий кандидат может не
   найтись. Тогда берётся тот, чьё совпадение СТАРШЕ всех: повтор
   допускается, но первым повторяется то, что было давнее всего, — то
   есть только после того, как перебрано остальное. Что хуже: повтор
   задания целиком, потом тот же ответ подряд, потом «похожее» (порядок
   ORDER). Перебор — до 200 проб и не дольше 150 мс; генератор, который
   все двенадцать первых проб отдал одно и то же, дальше не мучаем.

   ok(задание) — условие страницы, которое важнее повторов: у ⟳ в
   логарифмах задание должно быть ТОГО ЖЕ вида, и повтор лучше другого
   вида.

   История живёт в sessionStorage (ключ на область, «noRepeat:v1:<scope>»),
   а не в памяти страницы. Это нарочно: карточки «+» (trainer-multi.js) и
   невидимые кадры доски — отдельные окна той же вкладки, у них своя
   память, а sessionStorage общий. Так пять карточек «+5» не повторяют
   друг друга. Хранится только хэш ключей, не сами задания. Нет хранилища
   (приватный режим, file://) — работает на памяти страницы.

   avoid — задания, которые СЕЙЧАС на экране (то, что заменяется, и
   соседние карточки). Они считаются самыми свежими, хотя в историю этой
   вкладки могли и не попасть: пришли снимком от собеседника, восстановлены
   из прогресса после перезагрузки, подставлены доской в невидимый кадр.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  if (window.NoRepeat) return;

  const NS = 'noRepeat:v1:';
  const KEEP = 120;                                   // сколько последних помнить на область
  const WIN = { exact: 120, shape: 30, answer: 3 };
  const TRIES = 200;
  // пробы — это вызовы генератора; почти всегда хватает одной-двух, все
  // двести нужны, только когда варианты на исходе и остались редкие (у
  // тригонометрии «sin x = a» восемнадцать условий, самые редкие выпадают
  // в 1,6 % случаев). У тяжёлых генераторов двести проб заметны — поэтому
  // ещё и предел по времени
  const BUDGET_MS = 150;

  const mem = Object.create(null);                    // запасной путь без sessionStorage

  // FNV-1a: в хранилище кладём короткий хэш, а не условие с вёрсткой KaTeX
  // (оно бывает в несколько килобайт)
  function hash(s) {
    if (s === null || s === undefined || s === '') return '';
    s = String(s);
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(36) + ':' + s.length.toString(36);
  }

  function read(scope) {
    try {
      const raw = window.sessionStorage.getItem(NS + scope);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return mem[scope] ? mem[scope].slice() : [];
  }
  function write(scope, list) {
    list = list.slice(-KEEP);
    mem[scope] = list;
    try {
      window.sessionStorage.setItem(NS + scope, JSON.stringify(list));
    } catch (e) {
      // хранилище переполнено — чистим только свои ключи и пробуем ещё раз;
      // не вышло — остаётся память страницы
      try {
        const ss = window.sessionStorage;
        for (let i = ss.length - 1; i >= 0; i--) {
          const k = ss.key(i);
          if (k && k.indexOf(NS) === 0) ss.removeItem(k);
        }
        ss.setItem(NS + scope, JSON.stringify(list));
      } catch (e2) {}
    }
  }

  // JSON без функций и без «служебных» полей: в объектах примера арифметики
  // бывают функции (шаги квадратных уравнений) и счётчики, которые к самому
  // заданию не относятся. omit — ещё такие поля страницы: у слагаемых
  // линейных уравнений сквозной id, с ним любой пример был бы «новым»
  function stable(v, omit) {
    try {
      return JSON.stringify(v, (k, x) => (typeof x === 'function' || (k && k.charAt(0) === '_') || (omit && omit.indexOf(k) >= 0)) ? undefined : x);
    } catch (e) { return ''; }
  }

  // утверждения (ОГЭ №19) генератор перемешивает — то же задание с ними в
  // другом порядке должно считаться тем же, поэтому они сортируются
  function setKey(x) {
    const arr = Array.isArray(x) ? x : (x && Array.isArray(x.opts) ? x.opts : null);
    return arr ? arr.map(v => stable(v)).sort().join('¦') : stable(x);
  }

  // ключи по умолчанию — для заданий ОГЭ-семейства ({prompt, options,
  // correctIndex, correctValue, …}) и банков ({text, answer, …}).
  // «То же задание» — то же условие с тем же верным ответом. Неверные
  // варианты в ключ не входят: они случайные, и одно и то же уравнение с
  // другими «ловушками» иначе считалось бы новым (так и вышло в
  // тригонометрии). Весь объект целиком тоже не годится: у заданий банков
  // есть случайный key
  function keysOf(t) {
    if (!t || typeof t !== 'object') return { exact: stable(t), shape: null, answer: null };
    const text = t.prompt !== undefined ? t.prompt : (t.text !== undefined ? t.text : null);
    let answer = null;
    if (t.correctValue !== undefined && t.correctValue !== null) answer = t.correctValue;
    else if (Array.isArray(t.options) && typeof t.correctIndex === 'number') answer = t.options[t.correctIndex];
    else if (t.answer !== undefined) answer = t.answer;
    const ans = answer === null || answer === undefined ? null : stable(answer);
    const exact = text === null ? stable(t)
      : String(text) + '|' + (ans || '') + (t.statements ? '|' + setKey(t.statements) : '') + (t.fields ? '|' + stable(t.fields) : '');
    return { exact, shape: null, answer: ans };
  }

  function hashed(k) {
    k = k || {};
    return [hash(k.exact), hash(k.shape), hash(k.answer)];
  }

  // возраст самого свежего совпадения по каждому ключу (0 — последнее
  // задание); Infinity — совпадений в окне нет
  function verdict(k, recent, win) {
    const v = [Infinity, Infinity, Infinity];
    const lim = [win.exact, win.shape, win.answer];
    const n = recent.length;
    for (let i = n - 1; i >= 0; i--) {
      const age = n - 1 - i, r = recent[i];
      for (let j = 0; j < 3; j++) {
        if (v[j] === Infinity && k[j] && r[j] === k[j] && age < lim[j]) v[j] = age;
      }
    }
    return v;
  }
  // лучше — у кого совпадение старше. Важнее всего не повторить задание
  // целиком, потом — не дать тот же ответ подряд (окно короткое, это почти
  // всегда выполнимо), и уже потом — «похожесть»: у типов, где записей
  // немного (у №33 ОГЭ №8 их пятнадцать), похожие неизбежно возвращаются,
  // и тогда первой возвращается самая давняя
  const ORDER = [0, 2, 1];
  function better(a, b) {
    for (const j of ORDER) {
      if (a[j] !== b[j]) return a[j] > b[j];
    }
    return false;
  }
  const clean = v => v[0] === Infinity && v[1] === Infinity && v[2] === Infinity;

  const now = () => (window.performance && performance.now ? performance.now() : Date.now());

  function pick(scope, gen, opts) {
    opts = opts || {};
    scope = String(scope || 'default');
    const keysFn = opts.keys || keysOf;
    const win = Object.assign({}, WIN, opts.win || {});
    const hist = read(scope);
    const avoid = (opts.avoid || []).filter(Boolean).map(t => {
      try { return hashed(keysFn(t)); } catch (e) { return ['', '', '']; }
    });
    // задание с экрана обычно уже есть в истории — тогда оно не дублируется,
    // а переезжает в конец как самое свежее: дубль сдвинул бы возраст
    // остальных, и окно «ответ подряд» на деле стало бы короче
    const onScreen = new Set(avoid.map(a => a[0]).filter(Boolean));
    const recent = hist.filter(h => !onScreen.has(h[0])).concat(avoid);

    const t0 = now();
    let best = null, bestK = null, bestV = null;
    const exacts = new Set();
    const answers = new Set();
    for (let i = 0; i < TRIES; i++) {
      let task;
      if (i === 0) task = gen();
      else {
        try { task = gen(); } catch (e) { break; }
      }
      let k;
      try { k = hashed(keysFn(task)); } catch (e) { k = ['', '', '']; }
      let v = verdict(k, recent, win);
      // ok — условие страницы, которое важнее повторов (вид задания у ⟳ в
      // логарифмах): не подходящий кандидат хуже любого повтора
      const fit = !opts.ok || opts.ok(task);
      if (!fit) v = [-1, -1, -1];
      // у типа ответ всегда один и тот же (в №13 «Система не имеет решений»
      // по определению типа) — правило про ответ подряд к нему не относится;
      // иначе каждое задание перебирало бы все пробы впустую
      answers.add(k[2]);
      // (шестнадцать одинаковых ответов подряд — не случайность даже у
      // генератора с двумя ответами)
      if (fit && i >= 15 && win.answer > 0 && answers.size === 1 && v[2] !== Infinity) {
        win.answer = 0;
        v = verdict(k, recent, win);
        if (bestK) bestV = verdict(bestK, recent, win);
      }
      if (!best || better(v, bestV)) { best = task; bestK = k; bestV = v; }
      if (clean(v)) break;
      // генератор отдаёт одно и то же (демоверсия) — дальше пробовать
      // бессмысленно. Только если ВСЕ пробы с самого начала одинаковые и их
      // уже двенадцать: просто несколько одинаковых подряд бывают и у
      // генератора с двумя-тремя вариантами (первая версия сдавалась после
      // пяти подряд и пропускала повторы именно там, где вариантов мало)
      exacts.add(k[0]);
      if (i >= 11 && exacts.size === 1) break;
      // за тридцать проб попалось не больше трёх разных заданий — вариантов
      // у типа столько и есть (вероятности в ОГЭ №10), все уже были
      if (i >= 29 && exacts.size <= 3) break;
      if (i >= 8 && now() - t0 > BUDGET_MS) break;
    }
    hist.push(bestK);
    write(scope, hist);
    return best;
  }

  // отметить задание как показанное, не генерируя
  function see(scope, task, opts) {
    if (!task) return;
    opts = opts || {};
    scope = String(scope || 'default');
    const k = hashed((opts.keys || keysOf)(task));
    const hist = read(scope);
    const last = hist[hist.length - 1];
    if (last && last[0] === k[0] && last[1] === k[1] && last[2] === k[2]) return;
    hist.push(k);
    write(scope, hist);
  }

  function reset(scope) {
    if (scope === undefined) {
      Object.keys(mem).forEach(s => { delete mem[s]; });
      try {
        const ss = window.sessionStorage;
        for (let i = ss.length - 1; i >= 0; i--) {
          const k = ss.key(i);
          if (k && k.indexOf(NS) === 0) ss.removeItem(k);
        }
      } catch (e) {}
      return;
    }
    delete mem[scope];
    try { window.sessionStorage.removeItem(NS + scope); } catch (e) {}
  }

  window.NoRepeat = { pick, see, reset, keysOf, stable, hash, WIN, _read: read };
})();
