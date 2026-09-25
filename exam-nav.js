/* ═══════════════ Навигация между номерами экзамена (промпт №73) ═══════════════
   Круглые стрелки ◀ ▶ по бокам заголовка экзаменационного тренажёра: ОГЭ
   (oge1_5 … oge19 и oge_part2?n=20…25), ЕГЭ база (ege_base?n=1…21), ЕГЭ
   профиль (ege_prof?n=1…20). Стрелка ведёт на соседний номер того же экзамена;
   на первом номере неактивна левая, на последнем — правая.

   Память номеров. Первый заход на номер в этой вкладке открывает его первый
   прототип. Возврат на номер, который уже открывали, — тот же прототип и то
   же задание, что были в последний раз. Хранится в sessionStorage: «в этой
   сессии» — это вкладка, и память переживает переход на соседнюю страницу
   ОГЭ, но не тянется в завтрашнее занятие (для этого у тренажёров есть своя
   память по прототипам в localStorage, её здесь не трогаем).

   Что запоминаем:
   - ОГЭ — снимок страницы через её же мост сессии (tsGetState) без доски,
     калькулятора и карточек «+». Возврат — tsApplyState(снимок): так же, как
     ученик получает экран учителя. Мост сперва открывает тип обычным путём
     страницы (openTask/startMode — с её собственной памятью по типу:
     задание, ответ, поле), и только если задание разошлось со снимком
     (в №19 памяти по типу нет вовсе, после трёх часов паузы она
     обнуляется), рисует задание из снимка. Поэтому память номеров не
     сбрасывает память прототипов, а дополняет её;
   - ЕГЭ и ОГЭ часть 2 — только прототип: задание ЕГЭ и есть прототип, а
     смена прототипа внутри номера тоже открывает его с чистого листа.
     Режим («Экзамен/Тренировка/Обучение») не запоминаем — он общий на все
     номера страницы, как и при смене прототипа.

   Где страница — определяем по имени файла, как слаг сессии. Страница
   ЕГЭ-семейства (номер внутри страницы меняется без перезагрузки) отдаёт
   хук window.__examNav = { n(), pid(), open(n, pid) }; тренажёрам ОГЭ №1–19
   хук не нужен — хватает моста сессии и карточек на экране выбора типа.

   В совместной сессии стрелки — только у учителя (как любой переход):
   ученику guardStudentAction покажет «Учитель ограничил это действие».
   Переход на другую страницу — через TrainerSession.navigateTo, чтобы
   ученики ушли следом. */
(function () {
  'use strict';
  if (window.__examNavLoaded) return;
  window.__examNavLoaded = true;

  const params = new URLSearchParams(location.search);
  // в карточке «+» (кадр ?card=1) и в живом задании на доске страница
  // открыта в iframe: там видно только задание, заголовка нет, а своя память
  // кадра перебивала бы память вкладки
  let inFrame = false;
  try { inFrame = window.top !== window.self; } catch (e) { inFrame = true; }
  if (params.get('card') === '1' || inFrame) return;

  const slug = (location.pathname.split('/').pop() || '').replace(/\.html?$/i, '');
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

  /* Порядок номеров — как в каталоге на главной. №1–5 и №15–18 — один
     тренажёр на несколько номеров, поэтому в ОГЭ позиция — это страница, а
     у ОГЭ части 2 и ЕГЭ — страница плюс номер из адреса. Числа позиций
     сверяет с банками тест №73 */
  const OGE_PART1 = [
    ['oge1_5', '№1–5'], ['oge6', '№6'], ['oge7', '№7'], ['oge8', '№8'], ['oge9', '№9'],
    ['oge10', '№10'], ['oge11', '№11'], ['oge12', '№12'], ['oge13', '№13'], ['oge14', '№14'],
    ['oge15_18', '№15–18'], ['oge19', '№19'],
  ];
  const EXAMS = {
    oge: {
      title: 'ОГЭ',
      list: OGE_PART1.map(([s, label]) => ({ slug: s, label: label }))
        .concat(range(20, 25).map(n => ({ slug: 'oge_part2', n: n, label: '№' + n }))),
    },
    ege_base: { title: 'ЕГЭ база', list: range(1, 21).map(n => ({ slug: 'ege_base', n: n, label: '№' + n })) },
    ege_prof: { title: 'ЕГЭ профиль', list: range(1, 20).map(n => ({ slug: 'ege_prof', n: n, label: '№' + n })) },
  };
  let examId = null;
  Object.keys(EXAMS).forEach(id => { if (EXAMS[id].list.some(p => p.slug === slug)) examId = id; });
  if (!examId) return;
  const EXAM = EXAMS[examId];

  const MEM_KEY = 'examNav:mem:v1';
  const ARRIVE_KEY = 'examNav:arrive';
  const ARRIVE_TTL_MS = 60 * 1000;   // метка «пришли стрелкой» старше минуты — не наша
  const posKey = p => p.slug + (p.n ? '?n=' + p.n : '');
  const posUrl = p => p.slug + '.html' + (p.n ? '?n=' + p.n : '');

  function ssGet(key) {
    try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch (e) { return null; }
  }
  function ssSet(key, val) {
    try {
      if (val == null) sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  const hook = () => window.__examNav || null;
  function curN() {
    const h = hook();
    if (h && typeof h.n === 'function') return h.n();
    const v = parseInt(params.get('n'), 10);
    return isFinite(v) ? v : null;
  }
  function curIndex() {
    const n = curN();
    return EXAM.list.findIndex(p => p.slug === slug && (p.n == null || p.n === n));
  }

  /* ── что запомнить про открытый номер ── */
  function stripKeys(getter) {
    try { return getter ? Object.keys(getter() || {}) : []; } catch (e) { return []; }
  }
  // → объект памяти или null, если сейчас не открыто задание (экран выбора)
  function currentMemo() {
    const h = hook();
    if (h && typeof h.pid === 'function') {
      const pid = h.pid();
      return pid ? { pid: pid } : null;
    }
    if (typeof window.tsGetState !== 'function') return null;
    let s;
    try { s = window.tsGetState(); } catch (e) { return null; }
    if (!s || s.picker !== false) return null;
    const snap = Object.assign({}, s);
    // доска у страницы одна на все номера и живёт своей жизнью; калькулятор
    // в столбик и карточки «+» — рабочие окна поверх задания. Всё это
    // сохранять не нужно, а доска ещё и тяжёлая для sessionStorage
    stripKeys(window.__boardGetState).concat(stripKeys(window.__calcGetState), ['__cards'])
      .forEach(k => { delete snap[k]; });
    try { return { snap: JSON.parse(JSON.stringify(snap)) }; } catch (e) { return null; }
  }
  let lastSaved = '';
  function record() {
    const i = curIndex();
    if (i < 0) return;
    const memo = currentMemo();
    if (!memo) return;   // на экране выбора прототипа — помним последнее открытое
    const key = posKey(EXAM.list[i]);
    const str = JSON.stringify(memo);
    if (str === lastSaved) return;
    const mem = ssGet(MEM_KEY) || {};
    mem[key] = memo;
    ssSet(MEM_KEY, mem);
    lastSaved = str;
  }

  /* ── открыть номер: из памяти или его первый прототип ── */
  function openHere(pos) {
    const memo = (ssGet(MEM_KEY) || {})[posKey(pos)] || null;
    const h = hook();
    if (h && typeof h.open === 'function') {
      h.open(pos.n, memo && memo.pid ? memo.pid : null);
      return;
    }
    if (memo && memo.snap && typeof window.tsApplyState === 'function') {
      try { window.tsApplyState(memo.snap); return; } catch (e) {}
    }
    // первый прототип — первая карточка экрана выбора (без «Случайно» и
    // «скоро»): нажимаем её, как нажал бы учитель, и страница открывает тип
    // своим обычным путём — с теорией темы в №1–5, движком уравнений в №9
    const first = document.querySelector('#pickerArea .mode-card[data-id]:not(.random):not(.soon):not([data-id="random"])');
    if (first) first.click();
  }
  // подпись открытого экрана: по ней после подключения к сессии видно,
  // не увёл ли кто-нибудь страницу с только что открытого номера
  function screenSig() {
    const h = hook();
    if (h && typeof h.pid === 'function') return JSON.stringify([h.n(), h.pid()]);
    try {
      const s = window.tsGetState();
      return JSON.stringify([s.picker, s.curMode]);
    } catch (e) { return ''; }
  }

  /* ── переход по стрелке ── */
  const TS = () => window.TrainerSession || null;
  function go(delta) {
    const i = curIndex();
    const target = EXAM.list[i + delta];
    if (i < 0 || !target) return;
    record();
    if (target.slug === slug && hook() && typeof hook().open === 'function') {
      openHere(target);   // тот же файл (ЕГЭ, ОГЭ часть 2) — без перезагрузки
      render();
      return;
    }
    ssSet(ARRIVE_KEY, { key: posKey(target), at: Date.now() });
    const ts = TS();
    if (ts && typeof ts.navigateTo === 'function') ts.navigateTo(posUrl(target));
    else location.href = posUrl(target);
  }
  function guarded(action, fn) {
    const ts = TS();
    return ts && typeof ts.guardStudentAction === 'function' ? ts.guardStudentAction(action, fn) : fn;
  }

  /* ── кнопки ── */
  const CSS = `
h1.exam-nav-h1{display:flex;align-items:center;justify-content:center;gap:12px;max-height:150px;}
h1.exam-nav-h1 .exam-nav-text{min-width:0;}
/* вид — как у стрелок «◀ Предыдущий прототип / Следующий прототип ▶», только
   кнопка круглая и без подписи. .wrap у тренажёров не ловит мышь (под ним
   доска), поэтому pointer-events возвращаем явно */
.exam-nav-btn{pointer-events:auto;flex:0 0 auto;width:34px;height:34px;padding:0;border:1px solid var(--glass-border);border-radius:50%;background:var(--glass-strong);backdrop-filter:blur(14px) saturate(160%);-webkit-backdrop-filter:blur(14px) saturate(160%);color:var(--ink);font-family:var(--font-ui);font-weight:600;font-size:13px;line-height:1;letter-spacing:0;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:transform .12s, border-color .12s, opacity .12s;}
.exam-nav-btn:hover:not(:disabled){border-color:var(--ink)}
.exam-nav-btn:active:not(:disabled){transform:scale(.9)}
.exam-nav-btn:disabled{opacity:.3;cursor:default}
/* пока .wrap доходит до краёв экрана, в углах над заголовком висят круглые
   кнопки страницы (position:fixed, 40px + отступ 16px): слева «домой»,
   справа в верхнем ряду две (совместный доступ и тема), под ними по одной
   (доска, фокус). Заголовок со стрелками сдвигаем внутрь, чтобы стрелки не
   легли под эти кнопки: на планшете — отступом на два ряда кнопок, на
   телефоне так не хватает ширины, поэтому заголовок опускается под верхний
   ряд, а сбоку остаётся отступ на одну кнопку. 1080 = самый широкий
   .wrap (860) + по 104 с каждой стороны */
@media (max-width:1080px){
  h1.exam-nav-h1{padding:0 104px;box-sizing:border-box}
}
@media (max-width:640px){
  h1.exam-nav-h1{padding:0 44px;margin-top:44px}
}
@media (max-width:520px){
  h1.exam-nav-h1{gap:6px;font-size:21px}
  h1.exam-nav-h1 .exam-nav-text{overflow-wrap:anywhere}
  .exam-nav-btn{width:30px;height:30px;font-size:12px}
}
@media (max-width:360px){
  h1.exam-nav-h1{font-size:18px}
  .exam-nav-btn{width:28px;height:28px;font-size:11px}
}`;
  let prevBtn = null, nextBtn = null;
  function makeBtn(id, glyph, delta) {
    const b = document.createElement('button');
    b.type = 'button';
    b.id = id;
    b.className = 'exam-nav-btn';
    b.textContent = glyph;
    b.onclick = guarded('navigate', () => go(delta));
    return b;
  }
  function render() {
    if (!prevBtn) return;
    const i = curIndex();
    const prev = i >= 0 ? EXAM.list[i - 1] : null;
    const next = i >= 0 ? EXAM.list[i + 1] : null;
    prevBtn.disabled = !prev;
    nextBtn.disabled = !next;
    const tip = (p, word) => p ? word + ': ' + EXAM.title + ' ' + p.label : '';
    prevBtn.title = tip(prev, 'Предыдущее задание') || 'Это первое задание ' + EXAM.title;
    nextBtn.title = tip(next, 'Следующее задание') || 'Это последнее задание ' + EXAM.title;
    prevBtn.setAttribute('aria-label', prevBtn.title);
    nextBtn.setAttribute('aria-label', nextBtn.title);
  }
  function mountButtons() {
    const h1 = document.querySelector('.wrap h1') || document.querySelector('h1');
    if (!h1 || h1.classList.contains('exam-nav-h1')) return;
    const style = document.createElement('style');
    style.id = 'examNavStyle';
    style.textContent = CSS;
    document.head.appendChild(style);
    // текст заголовка — в свой элемент: ЕГЭ-страница меняет его (номер в
    // заголовке), и стрелки при этом не должны пропадать
    const text = document.createElement('span');
    text.className = 'exam-nav-text';
    while (h1.firstChild) text.appendChild(h1.firstChild);
    prevBtn = makeBtn('examPrevBtn', '◀', -1);
    nextBtn = makeBtn('examNextBtn', '▶', 1);
    h1.classList.add('exam-nav-h1');
    h1.appendChild(prevBtn);
    h1.appendChild(text);
    h1.appendChild(nextBtn);
    render();
  }

  /* ── запуск ── */
  // промис подключения к сессии: TrainerSession.init страница зовёт сама,
  // здесь только подслушиваем его результат (скрипт подключён сразу после
  // session-share.js, до основного скрипта страницы). Нужен, чтобы после
  // подключения проверить: не увёл ли снимок из базы страницу с номера,
  // на который учитель пришёл стрелкой
  let sessionReady = null;
  (function wrapInit() {
    const ts = TS();
    if (!ts || typeof ts.init !== 'function' || ts.__examNavWrapped) return;
    const orig = ts.init;
    ts.init = function () {
      const p = orig.apply(this, arguments);
      sessionReady = Promise.resolve(p).catch(() => {});
      return p;
    };
    ts.__examNavWrapped = true;
  })();

  function arrive() {
    const mark = ssGet(ARRIVE_KEY);
    const i = curIndex();
    if (!mark || i < 0 || mark.key !== posKey(EXAM.list[i])) return;
    ssSet(ARRIVE_KEY, null);
    if (!(Date.now() - (mark.at || 0) < ARRIVE_TTL_MS)) return;
    const pos = EXAM.list[i];
    openHere(pos);
    const want = screenSig();
    if (sessionReady) {
      sessionReady.then(() => setTimeout(() => {
        // присоединившегося уводит за учителем сама сессия — не мешаем
        const ts = TS();
        if (ts && ts.isLeader && !ts.isLeader()) return;
        if (curIndex() === i && screenSig() !== want) openHere(pos);
      }, 0));
    }
  }

  function start() {
    mountButtons();
    arrive();
    record();
    // номер в ЕГЭ может смениться и без стрелок (сессия, возврат по адресу),
    // а прототип — открыт и тут же закрыт возвратом к списку: стрелки и
    // память догоняют таймером, тем же шагом, что и таймер сессии (300 мс) —
    // быстрее человек не успеет открыть прототип и уйти с него
    setInterval(() => { render(); record(); }, 300);
    window.addEventListener('pagehide', record);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.ExamNav = { exam: examId, list: EXAM.list, go: go, record: record };
})();
