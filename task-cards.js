/* ═══════════════════════════════════════════════════════════════════════
   task-cards.js — лёгкие карточки «+» (несколько заданий на одном экране)
   для тренажёров, у которых задание — ДАННЫЕ: генератор возвращает объект
   с условием, вариантами и решением, а страница только рисует его.

   Зачем вместо trainer-multi.js. Там каждая карточка — вся страница
   тренажёра в iframe (?card=1): +5 — это шесть копий страницы с KaTeX,
   скриптами и доской в памяти, на телефоне ~2 с на создание и 10–17 МБ на
   карточку, и карточки вставали под калькулятором и историей. Здесь
   карточка рисуется прямо на странице из данных задания, как в ОГЭ №8.

   Первый тренажёр — ОГЭ №7 (задание с вариантами ответа). Остальные
   переводятся сюда же: страница отдаёт адаптер, всё остальное общее.

   Подключение (после session-share.js и no-repeat.js):
     TaskCards.mount({
       trainerId: 'oge7',
       gen(avoid)       → новое задание того же типа, что основное (avoid —
                          задания на экране: основное и карточки)
       slim(task)       → только то, что нужно карточке (уходит в общий снимок
                          сессии с каждым штрихом доски — лишнее не тащим)
       typeKey()        → тип задания сейчас ('random' тоже тип): при смене
                          карточки пересоздаются под новый тип, как в №8
       isTaskScreen()   → открыт экран задания, а не выбор типа
       subMode()        → 'learn' | 'practice' | 'exam'
       anchor()         → после этого узла встают карточки (под заданием,
                          выше калькулятора, счётчиков и истории)
       title()          → название типа для «В подборку»
       onResult(kind, firstTry, task) → счётчики страницы: 'wrong' — неверный
                          выбор, 'solved' — верный, 'revealed' — вторая ошибка,
                          ответ показан
     })
   В общий снимок карточки попадают через window.__cardsGetState /
   __cardsApplyState — эти крючки страницы уже вызывают (их же звал
   trainer-multi.js), так что код сессии на странице не меняется.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.TaskCards) return;

  const TS = () => window.TrainerSession || null;
  const guard = (action, fn) => {
    const ts = TS();
    return ts && ts.guardStudentAction ? ts.guardStudentAction(action, fn) : fn;
  };
  const push = () => { const ts = TS(); if (ts && ts.push) ts.push(); };
  const isLeader = () => { const ts = TS(); return !ts || !ts.isLeader || ts.isLeader(); };
  const me = Math.random().toString(36).slice(2, 10);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const LETTERS = ['1', '2', '3', '4', '5', '6'];

  let A = null;           // адаптер страницы
  let cards = [];         // [{ id, task, wrong:[i], answered, sol, rev, by }]
  /* Версия СПИСКА (добавили, убрали, заменили задание) и версия КАЖДОЙ
     карточки (выбор варианта, разбор). Снимок сессии уходит и с каждым
     штрихом доски и несёт карточки такими, какими они были у отправителя в
     тот момент. Без версий такой запоздавший снимок откатывал бы свежий
     ответ собеседника. Чужое берём, только если оно новее; при равных
     номерах решает автор — одинаково у всех участников */
  let listRev = 0, listBy = '';
  let wrap = null, rail = null, railOpen = false;
  let lastType = null, lastScreen = null, lastSub = null;
  const drawn = new Map(); // id → подпись того, что нарисовано в карточке

  const newer = (r1, b1, r2, b2) => (r1 !== r2 ? r1 > r2 : String(b1 || '') > String(b2 || ''));
  function bumpList() { listRev++; listBy = me; }
  function bumpCard(c) { c.rev = (c.rev || 0) + 1; c.by = me; }

  function avoidList() {
    const out = cards.map(c => c.task);
    try { if (A.current) out.push(A.current()); } catch (e) {}
    return out;
  }
  function makeCard() {
    return { id: uid(), task: A.slim(A.gen(avoidList())), wrong: [], answered: false, sol: false, rev: 0, by: me };
  }

  /* ── стили: вёрстку задания берём у страницы (.panel, .prompt, .mcq-btn,
     .explain, .plan), здесь только раскладка и кнопки карточки ── */
  function injectStyle() {
    if (document.getElementById('taskCardsStyle')) return;
    const st = document.createElement('style');
    st.id = 'taskCardsStyle';
    st.textContent = `
      .tc-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,380px),1fr));
        gap:14px;margin:0 0 14px;}
      .tc-cards:empty{display:none}
      .tc-card{margin-bottom:0;display:flex;flex-direction:column;}
      .tc-card .prompt{margin-bottom:10px}
      .tc-card .mcq-options{gap:6px}
      .tc-card .explain{margin-top:12px}
      .tc-btn-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;align-items:center}
      .tc-btn{font-family:var(--font-ui,inherit);font-weight:600;font-size:13px;color:var(--ink,#1b3b6f);
        background:var(--glass-strong,rgba(255,255,255,.9));border:1px solid var(--glass-border,rgba(0,0,0,.08));
        border-radius:10px;padding:6px 10px;cursor:pointer;}
      .tc-btn:hover{border-color:var(--ink,#1b3b6f)}
      .tc-btn.ok{border-color:var(--ok,#2a9d5c);color:var(--ok,#2a9d5c)}
      .tc-remove{margin-left:auto;color:var(--teacher,#c0392b)}
      .tc-num{font-family:var(--font-ui,inherit);font-weight:700;font-size:12px;color:var(--muted-3,#667);margin-bottom:8px}
      .add-rail{position:fixed;left:12px;top:50%;transform:translateY(-50%);z-index:120;
        display:flex;flex-direction:column;align-items:center;gap:8px;}
      .add-rail-toggle{width:44px;height:44px;flex:0 0 auto;border:none;border-radius:50%;
        background:var(--ink,#1b3b6f);color:#fff;font-size:24px;line-height:1;cursor:pointer;
        display:inline-flex;align-items:center;justify-content:center;
        box-shadow:0 6px 18px rgba(0,0,0,.25);transition:transform .15s;}
      .add-rail-toggle:hover{transform:scale(1.06)}
      .add-rail.open .add-rail-toggle{transform:rotate(45deg)}
      .add-rail-body{display:none;flex-direction:column;gap:6px;
        background:var(--glass,rgba(255,255,255,.75));backdrop-filter:blur(20px) saturate(160%);
        -webkit-backdrop-filter:blur(20px) saturate(160%);
        border:1px solid var(--glass-border,rgba(0,0,0,.08));border-radius:16px;padding:10px 8px;
        box-shadow:0 8px 24px rgba(0,0,0,.12);max-height:70vh;overflow-y:auto;}
      .add-rail.open .add-rail-body{display:flex;}
      .add-rail-label{font-family:var(--font-ui,inherit);font-weight:600;font-size:11px;
        color:var(--muted-3,#667);text-align:center;margin-bottom:2px;}
      .add-rail-body .add-qty-btn,.add-rail-act{min-width:46px;text-align:center;padding:8px 6px;
        font-family:var(--font-ui,inherit);font-weight:600;font-size:12px;color:var(--ink,#1b3b6f);
        background:var(--glass-strong,rgba(255,255,255,.9));border:1px solid var(--glass-border,rgba(0,0,0,.08));
        border-radius:10px;cursor:pointer;}
      .add-rail-body .add-qty-btn:hover,.add-rail-act:hover{border-color:var(--ink,#1b3b6f)}
      .add-rail-sep{height:1px;background:var(--glass-border,rgba(0,0,0,.08));margin:4px 2px;}
      @media (max-width:760px){
        .add-rail{left:6px;}
        .add-rail-toggle{width:38px;height:38px;font-size:20px;}
      }
    `;
    document.head.appendChild(st);
  }

  function ensureWrap() {
    if (wrap && wrap.isConnected) return wrap;
    wrap = document.createElement('div');
    wrap.className = 'tc-cards';
    wrap.id = 'tcCards';
    const a = A.anchor();
    a.parentNode.insertBefore(wrap, a.nextSibling);
    return wrap;
  }

  function buildRail() {
    rail = document.createElement('div');
    rail.className = 'add-rail';
    rail.id = 'addRail';
    rail.innerHTML = `
      <button class="add-rail-toggle" id="addRailToggle" title="Добавить примеры" aria-expanded="false">+</button>
      <div class="add-rail-body" id="addRailBody">
        <span class="add-rail-label">Добавить</span>
        ${[1, 2, 3, 5, 10].map(n => `<button class="add-qty-btn" data-n="${n}">+${n}</button>`).join('')}
        <div class="add-rail-sep" id="tcRailSep"></div>
        <button class="add-rail-act" id="tcRefreshAll" title="Новые задания во всех карточках">⟳ Все</button>
        <button class="add-rail-act" id="tcClearBtn">Убрать все</button>
      </div>`;
    document.body.appendChild(rail);
    rail.querySelector('#addRailToggle').onclick = () => { railOpen = !railOpen; syncRail(); };
    rail.querySelectorAll('.add-qty-btn').forEach(b => {
      b.onclick = guard('switchTask', () => addCards(+b.dataset.n));
    });
    rail.querySelector('#tcRefreshAll').onclick = guard('refreshAll', refreshAll);
    rail.querySelector('#tcClearBtn').onclick = guard('deleteTask', clearAll);
  }
  function syncRail() {
    if (!rail) return;
    const show = A.isTaskScreen();
    rail.style.display = show ? 'flex' : 'none';
    rail.classList.toggle('open', railOpen);
    rail.querySelector('#addRailToggle').setAttribute('aria-expanded', railOpen ? 'true' : 'false');
    const has = cards.length > 0;
    rail.querySelector('#tcRailSep').style.display = has ? 'block' : 'none';
    rail.querySelector('#tcRefreshAll').style.display = has ? 'block' : 'none';
    rail.querySelector('#tcClearBtn').style.display = has ? 'block' : 'none';
    if (wrap) wrap.style.display = show ? '' : 'none';
  }

  /* ── одна карточка ── */
  function cardHTML(c, idx) {
    const t = c.task;
    const sub = A.subMode();
    const finished = c.answered;
    const showSol = finished || (c.sol && sub !== 'exam');
    const solBtn = !finished && sub !== 'exam';
    const opts = (t.options || []).map((o, i) => {
      let cls = 'mcq-btn';
      if (finished || c.wrong.indexOf(i) >= 0) cls += ' disabled';
      if (c.wrong.indexOf(i) >= 0) cls += ' wrong';
      if (finished && i === t.correctIndex) cls += ' correct';
      return `<button class="${cls}" data-i="${i}"><span class="mlabel">${LETTERS[i]})</span><span>${o}</span></button>`;
    }).join('');
    const plan = (sub === 'learn' && t.plan && !finished) ? `<div class="plan"><b>План решения.</b> ${t.plan}</div>` : '';
    const sol = showSol
      ? `<div class="explain"><b>Решение:</b> ${t.explain}${finished ? '' : `<div class="answer-line"><b>Ответ:</b> ${t.correctIndex + 1}) ${t.options[t.correctIndex]}</div>`}</div>`
      : '';
    return `
      <div class="tc-num">Пример ${idx + 2}</div>
      <div class="tc-question">
        <div class="prompt">${t.prompt}</div>
        ${t.numline ? `<div class="tc-numline">${t.numline}</div>` : ''}
        <div class="mcq-title">Варианты ответа:</div>
        <div class="mcq-options">${opts}</div>
      </div>
      ${plan}
      ${sol}
      <div class="tc-btn-row">
        ${solBtn ? `<button class="tc-btn tc-sol">${c.sol ? 'Скрыть решение и ответ' : 'Показать решение и ответ'}</button>` : ''}
        <button class="tc-btn tc-refresh" title="Другое задание">⟳</button>
        <button class="tc-btn tc-basket" title="В подборку">📥</button>
        <button class="tc-btn tc-remove">− Убрать</button>
      </div>`;
  }
  function cardSig(c, idx) {
    return JSON.stringify([idx, A.subMode(), c.task.prompt, c.wrong, c.answered, c.sol]);
  }

  function bindCard(el, c) {
    el.querySelectorAll('.mcq-btn').forEach(b => {
      b.onclick = () => pickOption(c.id, +b.dataset.i);
    });
    const sol = el.querySelector('.tc-sol');
    if (sol) sol.onclick = guard('showSolution', () => {
      const cur = cards.find(x => x.id === c.id);
      if (!cur || cur.answered) return;
      cur.sol = !cur.sol; bumpCard(cur);
      render(); push();
    });
    el.querySelector('.tc-refresh').onclick = guard('refreshOne', () => refreshCard(c.id));
    el.querySelector('.tc-remove').onclick = guard('deleteTask', () => removeCard(c.id));
    const bb = el.querySelector('.tc-basket');
    bb.onclick = () => {
      if (!window.Basket) return;
      const rich = window.Basket.extractFromSelectorsRich([`.tc-card[data-id="${c.id}"] .tc-question`]);
      if (!rich || !rich.text) return;
      window.Basket.add({ trainerId: A.trainerId, modeTitle: A.title(), text: rich.text, html: rich.html });
      bb.classList.add('ok'); bb.textContent = '✓';
      setTimeout(() => { bb.classList.remove('ok'); bb.textContent = '📥'; }, 900);
    };
  }

  /* Правила выбора — как у основного задания в «Тренировке» и «Экзамене»:
     первая ошибка отмечается красным и можно выбрать ещё раз, вторая —
     показывается верный вариант и разбор. Решения по шагам у карточки нет,
     поэтому так же и в «Обучении» (там у карточки есть план и разбор) */
  function pickOption(id, i) {
    const c = cards.find(x => x.id === id);
    if (!c || c.answered || c.wrong.indexOf(i) >= 0) return;
    const firstTry = c.wrong.length === 0;
    if (i === c.task.correctIndex) {
      c.answered = true; c.sol = false;
      A.onResult('solved', firstTry, c.task);
    } else {
      c.wrong.push(i);
      A.onResult('wrong', firstTry, c.task);
      if (c.wrong.length >= 2) { c.answered = true; c.sol = false; A.onResult('revealed', false, c.task); }
    }
    bumpCard(c);
    render(); push();
  }

  /* ── список ── */
  function addCards(n) {
    for (let i = 0; i < n; i++) cards.push(makeCard());
    bumpList(); render(); push();
  }
  function refreshCard(id) {
    const i = cards.findIndex(x => x.id === id);
    if (i < 0) return;
    // новый id: для собеседника это другая карточка, а не правка старой —
    // иначе чужой ответ на прежнее задание мог бы «победить» по версии
    cards[i] = makeCard();
    bumpList(); render(); push();
  }
  function removeCard(id) {
    cards = cards.filter(x => x.id !== id);
    bumpList(); render(); push();
  }
  function clearAll() { cards = []; bumpList(); render(); push(); }
  function refreshAll() { regenerate(); push(); }
  function regenerate() {
    const n = cards.length;
    cards = [];
    for (let i = 0; i < n; i++) cards.push(makeCard());
    bumpList(); render();
  }

  function render() {
    if (!A) return;
    const w = ensureWrap();
    const want = new Set(cards.map(c => c.id));
    Array.from(w.children).forEach(el => {
      if (!want.has(el.dataset.id)) { drawn.delete(el.dataset.id); el.remove(); }
    });
    cards.forEach((c, idx) => {
      let el = w.querySelector(`.tc-card[data-id="${c.id}"]`);
      if (!el) {
        el = document.createElement('div');
        el.className = 'panel tc-card';
        el.dataset.id = c.id;
      }
      // порядок как в списке; перерисовываем только изменившуюся карточку
      if (w.children[idx] !== el) w.insertBefore(el, w.children[idx] || null);
      const sig = cardSig(c, idx);
      if (drawn.get(c.id) !== sig) {
        el.innerHTML = cardHTML(c, idx);
        bindCard(el, c);
        drawn.set(c.id, sig);
      }
    });
    syncRail();
  }

  /* ── общий снимок сессии. Ключ __qcards, а не __cards: вкладка со старым
     trainer-multi.js (кадры) не должна принять эти карточки за свои ── */
  function getState() {
    return { __qcards: { list: cards, rev: listRev, by: listBy } };
  }
  function applyState(state) {
    const inc = state && state.__qcards;
    if (!inc || !Array.isArray(inc.list)) return;
    const mine = new Map(cards.map(c => [c.id, c]));
    let next;
    if (newer(inc.rev || 0, inc.by, listRev, listBy)) {
      // список новее — берём его состав, но карточку, на которую у нас
      // ответ свежее, оставляем свою
      next = inc.list.map(c => {
        const m = mine.get(c.id);
        return (m && !newer(c.rev || 0, c.by, m.rev || 0, m.by)) ? m : c;
      });
      listRev = inc.rev || 0; listBy = String(inc.by || '');
    } else {
      // состав у нас свежее — из пришедшего берём только более новые ответы
      const incMap = new Map(inc.list.map(c => [c.id, c]));
      next = cards.map(m => {
        const c = incMap.get(m.id);
        return (c && newer(c.rev || 0, c.by, m.rev || 0, m.by)) ? c : m;
      });
    }
    const changed = JSON.stringify(next) !== JSON.stringify(cards);
    cards = next.map(c => Object.assign({ wrong: [], answered: false, sol: false, rev: 0 }, c, { wrong: (c.wrong || []).slice() }));
    if (changed) render();
  }

  /* ── смена типа, экрана и режима. Страница об этом не сообщает — смотрим
     сами, лёгкой проверкой раз в 300 мс: так не нужно вписывать вызовы в
     каждое место страницы, где меняется тип (выбор, стрелки, приход от
     собеседника). Пересоздаёт карточки только ведущий: у ученика новые
     придут в его снимке, иначе у двоих оказались бы разные задания ── */
  function watch() {
    let type = null, screen = false, sub = null;
    try { type = A.typeKey(); screen = !!A.isTaskScreen(); sub = A.subMode(); } catch (e) { return; }
    if (screen !== lastScreen) { lastScreen = screen; syncRail(); }
    if (type !== lastType) {
      const had = lastType !== null;
      lastType = type;
      if (had && screen && cards.length && isLeader()) { regenerate(); push(); }
    }
    if (sub !== lastSub) { lastSub = sub; if (cards.length) render(); }
  }

  function mount(adapter) {
    if (A) return;
    A = adapter;
    injectStyle();
    const start = () => {
      buildRail();
      ensureWrap();
      try { lastType = A.typeKey(); lastScreen = !!A.isTaskScreen(); lastSub = A.subMode(); } catch (e) {}
      syncRail();
      setInterval(watch, 300);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
    window.__cardsGetState = getState;
    window.__cardsApplyState = applyState;
  }

  window.TaskCards = {
    mount,
    // для тестов и отладки
    _cards: () => cards,
    _add: (n) => addCards(n),
  };
})();
