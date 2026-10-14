/* ═══════════════ ВЫКЛЮЧЕН с 14.10.2026 («„ФИПИ, потом на основе ФИПИ“») ═══════════════
   Ни одна страница этот файл больше не подключает: колонки «ФИПИ» и «Наши»
   заменила схема одного списка — у каждого вида сначала задания открытого
   банка ФИПИ, когда они решены, — наши «на основе ФИПИ» (fipi-mix.js,
   HANDOFF, раздел 4). Страницы зовут FipiSplit.apply только «если модуль
   есть», поэтому без подключения список рисуется одним столбиком, как до
   промпта №22. Файл оставлен, чтобы колонки можно было вернуть одной строкой
   подключения.

   ═══════════════ Колонки «ФИПИ» и «Наши» на экране выбора типа (промпт №22) ═══════════════
   В каждом тренажёре ОГЭ экран выбора типа делится на две колонки: слева —
   задания ФИПИ (банк ФИПИ и задание из демоверсии — его тоже составил ФИПИ,
   слово в слово), справа — типы, которые сделали мы. Наши типы пока все
   справа, даже те, что совпадают с ФИПИ по виду: сверка (отчёт
   oge_sverka_1_18.html) ещё не превратилась в решение, что с ними делать.

   Почему отдельным модулем и ПОСЛЕ отрисовки, а не правкой каждого
   renderPicker: экран выбора в 13 страницах ОГЭ нарисован шестью разными
   способами (группы с заголовками, плоский список, «Случайно» внутри и снаружи
   списка, разделы и группы ОГЭ ч. 2). Модуль берёт уже готовые карточки и
   ПЕРЕНОСИТ их (appendChild, не клон) в колонки — обработчики нажатий,
   которые страница уже повесила, едут вместе с карточками, а реестр типов,
   порядок «◀ Предыдущий тип / Следующий тип ▶», память прототипов и снимок
   сессии не меняются вовсе: они живут в данных, а не в разметке.

   Какая карточка ФИПИ: класс .demo (№0 демоверсии в №1–19) или атрибут
   data-fipi (тип «банк ФИПИ» в №19, задания и группы банка в ОГЭ ч. 2) —
   страница ставит его сама, потому что только она знает, откуда задание.
   «🎲 Случайно» над списком остаётся над обеими колонками: оно берёт из всех
   типов сразу. Случайно внутри группы (.mix в №9) и «скоро» (.soon в №1–5) —
   наши.

   Заголовок группы, где есть карточки обеих колонок, повторяется в обеих:
   иначе «№0» в №15–18 оказался бы без подписи, к какому номеру он.

   Порядок в разметке — сначала ФИПИ, потом наши: на телефоне колонки встают
   друг под другом ФИПИ сверху без всяких order, и exam-nav.js, который
   открывает «первую карточку» номера, по-прежнему попадает в №0 демоверсии. */
(function () {
  'use strict';
  if (window.FipiSplit) return;

  const CSS = `
.fs-split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:18px;align-items:start;}
.fs-col{min-width:0;}
.fs-body>.modes{margin-bottom:6px;}
.fs-body>.modes:last-child{margin-bottom:0;}
/* шапка колонки — как вкладки на главной (index.html, .nav-tabs/.nav-tab.active):
   та же стеклянная полоса и та же залитая «активная» вкладка */
.fs-head{display:flex;background:var(--glass-strong);backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);border:1px solid var(--glass-border);border-radius:18px;padding:7px;box-shadow:inset 0 1px 0 var(--glass-inset), var(--shadow);margin:0 0 12px;}
.fs-tab{flex:1 1 auto;text-align:center;font-family:var(--font-ui);font-weight:700;font-size:15px;color:#fff;background:var(--ink);border-radius:12px;padding:11px 12px;white-space:nowrap;cursor:default;user-select:none;}
.fs-tab .tcount{opacity:.65;font-weight:500;}
.fs-empty{font-family:var(--font-ui);font-size:14px;line-height:1.45;color:var(--muted-2);padding:6px 4px;}
/* в колонке заголовок группы первым — без верхнего отступа, иначе он отъезжает от шапки */
.fs-col>.fs-body>.group-title:first-child,.fs-col>.fs-body>.proto-section:first-child{margin-top:0;}
@media (max-width:640px){
  .fs-split{grid-template-columns:minmax(0,1fr);gap:14px;}
}`;

  function injectCss() {
    if (document.getElementById('fipiSplitCss')) return;
    const st = document.createElement('style');
    st.id = 'fipiSplitCss';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  const isCard = el => el.classList && el.classList.contains('mode-card');
  const defaultIsFipi = card => card.classList.contains('demo') || card.hasAttribute('data-fipi');

  /* Раскладывает уже отрисованный список (#modesGrid, #protoList) на колонки.
     opts.isFipi(card) — своя проверка; opts.emptyFipi / opts.emptyOurs — текст
     пустой колонки. Повторный вызов на том же списке безопасен: страница
     перед ним всё равно перерисовывает список через innerHTML. */
  function apply(grid, opts) {
    if (!grid || grid.querySelector(':scope > .fs-split')) return;
    opts = opts || {};
    const isFipi = opts.isFipi || defaultIsFipi;
    injectCss();

    // 1. блоки «заголовок + карточки» в исходном порядке
    const top = [];        // «Случайно» над списком — остаётся над колонками
    const blocks = [];
    let cur = { title: null, cards: [] };
    const flush = () => { if (cur.title || cur.cards.length) blocks.push(cur); };
    Array.from(grid.children).forEach(ch => {
      if (isCard(ch)) {
        if (ch.classList.contains('random') && !blocks.length && !cur.title && !cur.cards.length) top.push(ch);
        else cur.cards.push(ch);
      } else if (ch.classList && ch.classList.contains('modes')) {
        Array.from(ch.children).forEach(c => { if (isCard(c)) cur.cards.push(c); });
      } else {
        flush();
        cur = { title: ch, cards: [] };
      }
    });
    flush();

    // 2. колонки
    const mkCol = (cls, name) => {
      const col = document.createElement('div');
      col.className = 'fs-col ' + cls;
      col.innerHTML = '<div class="fs-head"><span class="fs-tab">' + name + '<span class="tcount"></span></span></div>';
      const body = document.createElement('div');
      body.className = 'fs-body';
      col.appendChild(body);
      return { col, body, n: 0 };
    };
    const F = mkCol('fs-fipi', 'ФИПИ');
    const O = mkCol('fs-ours', 'Наши');
    const put = (side, title, cards, cloneTitle) => {
      if (!cards.length) return;
      if (title) side.body.appendChild(cloneTitle ? title.cloneNode(true) : title);
      const box = document.createElement('div');
      box.className = 'modes';
      cards.forEach(c => box.appendChild(c));
      side.body.appendChild(box);
      side.n += cards.filter(c => !c.classList.contains('mix') && !c.classList.contains('soon')).length;
    };
    blocks.forEach(b => {
      const f = b.cards.filter(c => isFipi(c));
      const o = b.cards.filter(c => !isFipi(c));
      put(F, b.title, f, o.length > 0);   // заголовок нужен обеим — ФИПИ берёт копию
      put(O, b.title, o, false);
    });
    [[F, opts.emptyFipi || 'Заданий ФИПИ к этому номеру на платформе пока нет.'],
     [O, opts.emptyOurs || 'Своих типов к этому номеру пока нет.']].forEach(([side, text]) => {
      if (!side.n && !side.body.children.length) side.body.innerHTML = '<div class="fs-empty">' + text + '</div>';
      side.col.querySelector('.tcount').textContent = side.n ? ' · ' + side.n : '';
    });

    // 3. на место — сначала «Случайно», потом колонки
    const split = document.createElement('div');
    split.className = 'fs-split';
    split.appendChild(F.col);
    split.appendChild(O.col);
    grid.innerHTML = '';
    top.forEach(c => grid.appendChild(c));
    grid.appendChild(split);
  }

  window.FipiSplit = { apply };
})();
