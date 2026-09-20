/* ═══════════════════════════════════════════════════════════════════════
   trainer-multi.js — «несколько примеров на одной доске» для тренажёров,
   у которых нет собственной системы карточек.

   Промпт №33. В ОГЭ №8 (и его копиях — №12, «Действия со степенями») такая
   система есть: там задание описано данными, и вторую карточку можно просто
   отрисовать рядом. В остальных восемнадцати тренажёрах задание — это целый
   рабочий лист со своей вёрсткой и своими обработчиками; отрисовать его
   второй раз в той же странице нельзя, id-шники столкнутся.

   Поэтому здесь каждый добавленный пример — это сам тренажёр, открытый в
   отдельном кадре (iframe) в режиме ?card=1: те же примеры, та же логика,
   тот же ввод, только без шапки, вкладок и панелей. Кадры одного
   происхождения, поэтому родитель управляет ими напрямую — и именно так
   пример в карточке оказывается ОДИНАКОВЫМ у учителя и ученика: карточки
   живут в общем снимке сессии, а не генерируются у каждого свои.

   Подключать ПОСЛЕ session-share.js.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  const TS = window.TrainerSession || {
    push(){}, isLeader(){ return true; }, studentRestricted(){ return false; },
    flashRestrictedHint(){}, guardStudentAction(a, fn){ return fn; },
  };

  const params = new URLSearchParams(location.search);
  const IS_CARD = params.get('card') === '1';

  /* ── режим карточки: прячем всё, кроме самого задания ─────────────────
     Список селекторов общий для всех тренажёров — вёрстка у них родственная.
     Прячем не удалением узлов, а стилем: сам тренажёр продолжает работать,
     как ни в чём не бывало, просто его обвязка не видна. */
  if (IS_CARD) {
    /* Внутри карточки совместная сессия не нужна и вредна: каждый кадр —
       это та же страница целиком, и без этой заглушки десять карточек
       завели бы десять подключений к одному каналу и засыпали бы сессию
       своими снимками. Подменяем весь модуль пустышкой ДО того, как
       тренажёр успеет вызвать init (этот файл подключается раньше). */
    const noop = function(){};
    window.TrainerSession = {
      init: async () => {}, push: noop, registerField: noop, unregisterField: noop,
      unregisterFieldsWithPrefix: noop, mountShareButton: noop,
      broadcastEvent: noop, onEvent: noop, getCode: () => null, getShareUrl: () => '',
      resetSession: async () => {}, joinByCode: async () => ({ ok: false }),
      isLeader: () => true, navigateTo: noop, getConnState: () => 'online',
      guardStudentAction: (a, fn) => fn, studentRestricted: () => false, flashRestrictedHint: noop,
      getPermissions: () => ({ switchTask: true, refreshOne: true, refreshAll: true,
        showSolution: true, deleteTask: true, board: true }),
      setPermission: noop, onPermissionsChange: noop,
      getAutosaveHistory: () => false, setAutosaveHistory: noop, onAutosaveHistoryChange: noop,
      registerHistoryUI: noop, notifyHistoryChanged: noop,
    };

    const style = document.createElement('style');
    style.textContent = `
      h1, .sub, .home-btn, .theme-toggle, .board-visibility-toggle,
      .board-toolbar, .board-view-toolbar, .ts-share-btn, .ts-share-pop,
      .add-rail, #pickerArea, .submode-row, .stats-row, .stats,
      #basketBar, .basket-bar, .hint-collapse-btn, #calcBar, .calc-bar,
      .calc-history-panel, #boardCanvasBg,
      /* в карточке не нужна ни вторая копия выбора уровня, ни повтор
         теории со статистикой — всё это уже есть у основного примера
         выше, а в карточке только зря занимает экран */
      .levels, #levels, .theory, .stats-row, #statsRow, .stat-row,
      #boardSpace, .keypad-toggle { display: none !important; }
      body { background: transparent !important; }
      .wrap { padding-top: 0 !important; margin-top: 0 !important; }
      html, body { overflow-x: hidden; }
    `;
    document.documentElement.setAttribute('data-card', '1');
    (document.head || document.documentElement).appendChild(style);
    // высоту содержимого сообщаем родителю, чтобы кадр не приходилось
    // прокручивать отдельно — он просто становится нужного размера
    const report = () => {
      try {
        const h = Math.ceil(document.documentElement.scrollHeight);
        parent.postMessage({ __trainerCard: true, height: h }, '*');
      } catch (e) {}
    };
    window.addEventListener('load', () => { report(); setTimeout(report, 400); });
    setInterval(report, 700);
    return; // внутри карточки своя колонка «+» не нужна
  }

  /* ── состояние: список карточек (по одному снимку задания на карточку) ── */
  let cards = [];           // [{ id, state }]
  let railOpen = false;
  let wrapEl = null;
  const frames = new Map(); // id -> iframe

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // снимок задания без доски и без служебных полей — именно он делает
  // карточку одинаковой у обоих участников
  function taskSnapshot(win) {
    try {
      const api = win.__trainerState;
      if (!api || !api.get) return null;
      const s = api.get() || {};
      const out = {};
      Object.keys(s).forEach(k => {
        if (k === 'strokes' || k === 'bgStrokes' || k.indexOf('__') === 0) return;
        out[k] = s[k];
      });
      return out;
    } catch (e) { return null; }
  }

  /* ── разметка колонки и карточек ─────────────────────────────────────── */
  function injectStyle() {
    if (document.getElementById('trainerMultiStyle')) return;
    const st = document.createElement('style');
    st.id = 'trainerMultiStyle';
    st.textContent = `
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
      .add-rail-body .add-qty-btn{min-width:46px;text-align:center;padding:8px 6px;
        font-family:var(--font-ui,inherit);font-weight:600;font-size:12px;color:var(--ink,#1b3b6f);
        background:var(--glass-strong,rgba(255,255,255,.9));border:1px solid var(--glass-border,rgba(0,0,0,.08));
        border-radius:10px;cursor:pointer;}
      .add-rail-body .add-qty-btn:hover{border-color:var(--ink,#1b3b6f)}
      .add-rail-sep{height:1px;background:var(--glass-border,rgba(0,0,0,.08));margin:4px 2px;}
      .add-rail-act{padding:7px 6px;font-family:var(--font-ui,inherit);font-weight:600;font-size:13px;
        color:var(--ink,#1b3b6f);background:var(--glass-strong,rgba(255,255,255,.9));
        border:1px solid var(--glass-border,rgba(0,0,0,.08));border-radius:10px;cursor:pointer;}
      .tm-cards{display:flex;flex-direction:column;gap:14px;margin:18px auto 40px;
        max-width:var(--work-w,900px);width:100%;}
      .tm-card{position:relative;border:1px solid var(--glass-border,rgba(0,0,0,.08));
        border-radius:18px;overflow:hidden;background:var(--glass,rgba(255,255,255,.6));}
      .tm-card iframe{display:block;width:100%;border:none;background:transparent;}
      .tm-card-loading{padding:26px 16px;text-align:center;font-family:var(--font-ui,inherit);
        font-size:13px;color:var(--muted-3,#667);}
      .tm-card-remove{position:absolute;top:8px;right:8px;z-index:2;border:none;border-radius:10px;
        padding:5px 10px;font-family:var(--font-ui,inherit);font-weight:600;font-size:12px;
        color:#c0392b;background:rgba(255,255,255,.85);cursor:pointer;}
      @media (max-width:760px){
        .add-rail{left:6px;}
        .add-rail-toggle{width:38px;height:38px;font-size:20px;}
      }
    `;
    document.head.appendChild(st);
  }

  function cardsWrap() {
    if (wrapEl && document.body.contains(wrapEl)) return wrapEl;
    wrapEl = document.createElement('div');
    wrapEl.className = 'tm-cards';
    wrapEl.id = 'tmCards';
    // ставим сразу под основным содержимым тренажёра
    const anchor = document.querySelector('.wrap') || document.body;
    anchor.appendChild(wrapEl);
    return wrapEl;
  }

  function buildRail() {
    injectStyle();
    const rail = document.createElement('div');
    rail.className = 'add-rail';
    rail.id = 'addRail';
    rail.innerHTML = `
      <button class="add-rail-toggle" id="addRailToggle" title="Добавить примеры" aria-expanded="false">+</button>
      <div class="add-rail-body" id="addRailBody">
        <span class="add-rail-label">Добавить</span>
        <button class="add-qty-btn" data-n="1">+1</button>
        <button class="add-qty-btn" data-n="2">+2</button>
        <button class="add-qty-btn" data-n="3">+3</button>
        <button class="add-qty-btn" data-n="5">+5</button>
        <button class="add-qty-btn" data-n="10">+10</button>
        <div class="add-rail-sep" id="addRailSep" style="display:none"></div>
        <button class="add-rail-act" id="tmClearBtn" style="display:none">Убрать все</button>
      </div>`;
    document.body.appendChild(rail);

    const toggle = rail.querySelector('#addRailToggle');
    toggle.addEventListener('click', () => {
      railOpen = !railOpen;
      rail.classList.toggle('open', railOpen);
      toggle.setAttribute('aria-expanded', railOpen ? 'true' : 'false');
      toggle.title = railOpen ? 'Свернуть' : 'Добавить примеры';
    });
    rail.querySelectorAll('.add-qty-btn').forEach(btn => {
      btn.addEventListener('click', TS.guardStudentAction('switchTask', () => addCards(+btn.dataset.n)));
    });
    rail.querySelector('#tmClearBtn').addEventListener('click',
      TS.guardStudentAction('deleteTask', () => { cards = []; render(); TS.push(); }));
    return rail;
  }

  function syncRailExtras() {
    const sep = document.getElementById('addRailSep');
    const clear = document.getElementById('tmClearBtn');
    const has = cards.length > 0;
    if (sep) sep.style.display = has ? 'block' : 'none';
    if (clear) clear.style.display = has ? 'block' : 'none';
  }

  function cardUrl() {
    const u = new URL(location.pathname, location.href);
    u.searchParams.set('card', '1');
    return u.toString();
  }

  function makeCardEl(card) {
    const box = document.createElement('div');
    box.className = 'tm-card';
    box.dataset.id = card.id;
    const rm = document.createElement('button');
    rm.className = 'tm-card-remove';
    rm.textContent = '− Убрать';
    rm.addEventListener('click', TS.guardStudentAction('deleteTask', () => {
      cards = cards.filter(c => c.id !== card.id);
      render();
      TS.push();
    }));
    // пока кадр грузится, в карточке видно, что она не «пустая и сломанная»,
    // а именно готовится — на медленной сети это единственное отличие между
    // «ещё секунду» и «кажется, не работает»
    const loading = document.createElement('div');
    loading.className = 'tm-card-loading';
    loading.textContent = 'Готовим пример…';

    const frame = document.createElement('iframe');
    frame.src = cardUrl();
    frame.title = 'Дополнительный пример';
    frame.style.height = '320px';
    frame.addEventListener('load', () => {
      frames.set(card.id, frame);
      loading.remove();
      applyToFrame(card.id);
    });
    box.appendChild(rm);
    box.appendChild(loading);
    box.appendChild(frame);
    return box;
  }

  // отдаём кадру снимок задания; если снимка ещё нет (карточку только что
  // создал ведущий) — просим кадр сгенерировать свой и запоминаем его,
  // чтобы у второго участника появился ровно такой же пример
  // ВАЖНО: карточку ищем по идентификатору прямо сейчас, а не держим ссылку
  // на объект. Список карточек приходит из общего снимка и каждый раз
  // пересобирается заново — а кадр грузится долго, и к моменту его загрузки
  // прежний объект уже устарел. Именно из-за этого у присоединившегося в
  // карточке оставался свой пример: снимок от ведущего приходил в новый
  // объект, а обработчик загрузки смотрел в старый, где было пусто.
  function applyToFrame(cardId) {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    const frame = frames.get(card.id);
    if (!frame || !frame.contentWindow) return;
    const api = frame.contentWindow.__trainerState;
    if (!api) return;
    if (card.state) {
      try { api.apply(card.state); } catch (e) {}
      return;
    }
    // Новый пример придумывает ТОЛЬКО ведущий. Иначе выходило так: карточка
    // появлялась у обоих, каждый кадр честно генерировал себе пример — и в
    // одной и той же карточке у учителя и ученика оказывались разные числа.
    // Присоединившийся просто ждёт снимок: он придёт следующей же рассылкой
    // и применится сюда же (см. __cardsApplyState → render → applyToFrame).
    if (!(TS.isLeader && TS.isLeader())) return;
    try {
      // Промпт №54: кадр — это свежая загрузка страницы, он ничего не знает
      // о том, какой тип задания (или уровень) выбран на основной странице.
      // В тренажёрах с экраном выбора типа это давало пустую карточку:
      // newTask() в кадре искал тип null, падал, и ошибку тихо глотал этот
      // же try — «+1» просто ничего не показывал. В арифметике карточка
      // молча бралась с первого уровня, какой бы ни был выбран. Поэтому
      // сначала переводим кадр в то же состояние, что и основную страницу, и
      // только потом просим новый пример — того же типа и уровня.
      // Копия, а не ссылка: иначе кадр работал бы с живыми объектами
      // основной страницы (в quadratic.html он обнулял её S.tempSign, и
      // следующая проверка там не проходила). Через JSON — как по сети:
      // функции в P.steps приёмная сторона и так пересобирает сама
      const parentSnap = taskSnapshot(window);
      if (parentSnap) api.apply(JSON.parse(JSON.stringify(parentSnap)));
      if (api.newTask) api.newTask();
      card.state = taskSnapshot(frame.contentWindow);
      TS.push();
    } catch (e) {}
  }

  function render() {
    const wrap = cardsWrap();
    const want = new Set(cards.map(c => c.id));
    // убираем лишние
    Array.from(wrap.children).forEach(el => {
      if (!want.has(el.dataset.id)) { frames.delete(el.dataset.id); el.remove(); }
    });
    // добавляем недостающие, сохраняя порядок
    cards.forEach(card => {
      let el = wrap.querySelector(`.tm-card[data-id="${card.id}"]`);
      if (!el) { el = makeCardEl(card); wrap.appendChild(el); }
      else applyToFrame(card.id);
    });
    syncRailExtras();
  }

  function addCards(n) {
    for (let i = 0; i < n; i++) cards.push({ id: uid(), state: null });
    render();
    TS.push();
  }

  /* ── участие в общем снимке сессии: карточки одинаковы у обоих ───────── */
  window.__cardsGetState = function () {
    return { __cards: cards };
  };
  window.__cardsApplyState = function (state) {
    if (!state || !Array.isArray(state.__cards)) return;
    let changed = state.__cards.length !== cards.length;
    if (!changed) {
      for (let i = 0; i < cards.length; i++) {
        if (cards[i].id !== state.__cards[i].id) { changed = true; break; }
        if (!cards[i].state && state.__cards[i].state) { changed = true; break; }
      }
    }
    if (!changed) return;
    cards = state.__cards.map(c => ({ id: c.id, state: c.state || null }));
    render();
  };

  window.addEventListener('message', (e) => {
    const d = e.data;
    if (!d || !d.__trainerCard || !d.height) return;
    frames.forEach((frame) => {
      if (frame.contentWindow === e.source) frame.style.height = Math.max(160, d.height) + 'px';
    });
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildRail);
  } else {
    buildRail();
  }
})();
