/* ═══════════════════════════════════════════════════════════════════════
   session-share.js — «Совместный доступ» (Промпт №19): общий, не привязанный
   к конкретному тренажёру слой для лёгкой анонимной совместной сессии —
   код/ссылка, без входа по email (в отличие от совместных досок,
   boards-cloud.js, где это часть полноценной системы аккаунтов).

   Модель: при заходе на тренажёр у пользователя всегда есть «своя»
   сессия (код хранится в localStorage под конкретный тренажёр — так
   обновление страницы не начинает её заново). Кнопкой «Обновить» можно
   отбросить её и начать новую, пустую. Кто-то другой присоединяется по
   этому же коду или по ссылке вида ?s=КОД — с этого момента оба видят
   изменения друг друга в реальном времени (Supabase Realtime broadcast)
   и оба могут их вносить; последний снимок состояния также сохраняется
   в таблицу trainer_sessions — если кто-то перезайдёт/подключится позже,
   он получит актуальную картину, а не пустоту.

   Подключается на страницу ПОСЛЕ supabase-config.js и supabase-js.umd.js
   (тот же порядок, что уже используется в boards.html), но НЕ требует
   входа/authGate — работает анонимным (публичным) ключом напрямую.

   Публичный API (window.TrainerSession):
     init({ trainer, getState, applyState }) -> Promise<void>
       trainer     — слаг тренажёра ('oge8' и т.п.), только для метки записи
       getState()  — вернуть текущее «структурное» состояние тренажёра
                     (обычный JSON-объект: режим, текущее задание, список
                     добавленных заданий и т.п.) — вызывается изнутри push()
       applyState(state) — применить ПРИШЕДШЕЕ состояние к странице
                     (обновить переменные, перерисовать DOM); во время
                     этого вызова push() автоматически «глушится», так что
                     можно спокойно менять локальные переменные и дёргать
                     обычные функции рендера, не боясь эха на всю сеть
     push()        — вызвать после любого структурного изменения: заберёт
                     getState(), разошлёт остальным участникам и сохранит
     registerField(fieldId, inputEl) — включить посимвольную синхронизацию
                     одного текстового поля (например, поля ответа)
     unregisterField(fieldId)        — выключить (например, карточку убрали)
     getCode() / getShareUrl()       — код и ссылка текущей сессии
     resetSession()                  — «Обновить»: начать новую пустую сессию
     joinByCode(code)                — присоединиться к чужому коду
     mountShareButton()              — добавить стандартную плавающую кнопку
                     «Совместный доступ» с всплывающей панелью (код, ссылка,
                     копирование, «Обновить», поле для ввода чужого кода)
     broadcastEvent(name, data)      — разослать лёгкое «эфемерное» событие
                     (не сохраняется в БД, не идёт через getState/applyState) —
                     используется, например, для живой трансляции рисования на
                     доске поверх тренажёра, где полное состояние слишком
                     тяжело слать на каждую точку
     onEvent(name, cb)               — подписаться на такие события от
                     собеседника (свои собственные не приходят — фильтруются
                     по uid, как и во всех остальных каналах)
     openNewSessionTab()             — Промпт №75: новая независимая сессия
                     в новой вкладке (своя у каждой вкладки, см. ниже)
     goToSession(code)               — перейти к сессии из списка: открытая —
                     переключиться на её вкладку, закрытая — переоткрыть
     getSessionName() / renameSession(name) — имя сессии этой вкладки
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  const cfg = window.SUPABASE_CONFIG || {};
  /* Промпт №68: ?bdgen=1 — страницу открыла доска в невидимом кадре, чтобы
     сделать «ещё такое же задание» (boards-core.js, genFrame). Такому кадру
     совместная сессия не нужна и вредна: у учителя с открытой сессией кадр
     при старте записал бы в trainer_sessions свой слаг и разослал бы своё
     задание ученику. Поэтому — та же пустышка, что и без настроек Supabase */
  const BD_GEN = /[?&]bdgen=1(&|$)/.test(location.search);
  /* Промпт №11 нового списка: и вообще любой кадр нашего же сайта, кроме
     сцены ученика. Главный случай — панель тренажёров на доске: тренажёр в
     ней открыт кадром, и он подключался к сессии как ещё один «учитель» —
     переписывал в базе страницу группы на свою, слал свой размер окна и
     свои снимки. Ученик, смотревший доску, уезжал на этот тренажёр, а сцена
     сжималась до размера панели. Карточки «+» глушит trainer-multi.js,
     кадр «ещё такое же» — BD_GEN, этот случай — здесь. Кадр на чужом сайте
     (страницу тренажёра встроили куда-то) — обычная страница: туда наш
     родитель не заглянет, и мешать там некому */
  let OWN_FRAME = false;
  try {
    OWN_FRAME = window.top !== window.self && window.name !== 'tsStageFrame'
      && window.parent.location.origin === location.origin;
  } catch (e) { OWN_FRAME = false; }
  if (BD_GEN || OWN_FRAME || !cfg.url || !cfg.anonKey || !window.supabase) {
    if (!BD_GEN && !OWN_FRAME) console.warn('[session-share] SUPABASE_CONFIG или supabase-js не подключены — совместный доступ недоступен на этой странице.');
    window.TrainerSession = {
      init: async () => {}, push(){}, registerField(){}, unregisterField(){}, unregisterFieldsWithPrefix(){}, mountShareButton(){},
      broadcastEvent(){}, onEvent(){}, getCode(){ return null; }, getShareUrl(){ return ''; },
      resetSession: async () => {}, joinByCode: async () => ({ ok: false, reason: 'unavailable' }), isLeader(){ return true; },
      navigateTo: async (urlOrSlug) => { try { location.href = /^[a-z0-9_]+$/i.test(urlOrSlug) && !urlOrSlug.includes('.') ? urlOrSlug + '.html' : urlOrSlug; } catch (e) {} },
      guardStudentAction(action, fn){ return fn; }, studentRestricted(){ return false; }, flashRestrictedHint(){},
      getConnState(){ return 'online'; },
      getPermissions(){ return { switchTask: true, refreshOne: true, refreshAll: true, showSolution: true, deleteTask: true, board: true }; },
      setPermission(){}, onPermissionsChange(){},
      getAutosaveHistory(){ return true; }, setAutosaveHistory(){}, onAutosaveHistoryChange(){},
      registerHistoryUI(){}, notifyHistoryChanged(){},
      isStageFrame(){ return false; }, stageFocus(){},
      hasViewers(){ return false; }, holdStageReady(){}, releaseStageReady(){}, socketBacklog(){ return 0; },
      openNewSessionTab(){ return null; }, goToSession(){}, getSessionName(){ return ''; }, renameSession(){},
    };
    return;
  }
  /* ═══ Промпт №37: убираем ограничитель, а не обходим его ═══
     Настоящая причина «сообщение просто не дошло» оказалась не на сервере, а
     в самой библиотеке: у supabase-js есть СВОЙ ограничитель, по умолчанию 10
     сообщений в секунду, и всё сверх него он молча выбрасывает, отвечая
     «rate limited». Живая трансляция штрихов одна даёт больше двадцати — вот
     штрихи, нажатия «Проверить» и стирание и пропадали.
     Раньше я пробовал подстроиться под этот предел собственной очередью — от
     неё только росли задержки, а на живом сервере она же и убила штрихи.
     Поэтому просто поднимаем предел до 100 в секунду. Нам нужно от силы 40
     (штрихи 25 мс + перемещение + снимки), так что запас двойной, а до квот
     самого Supabase отсюда как до луны. */
  /* Промпт №11 нового списка: живучесть на скачущем интернете и VPN.
     По умолчанию библиотека проверяет сокет раз в 30 секунд — столько и
     длилась «тишина», когда связь уже умерла (сменился IP после VPN, моргнул
     Wi-Fi), а по виду всё на месте. Проверка раз в 10 секунд замечает
     смерть сокета втрое быстрее, и библиотека сама переподключается.
     worker — проверки идут из фонового потока: у ученика вкладка с уроком
     часто в фоне (рядом звонок), а браузер душит таймеры фоновых вкладок,
     и сервер закрывал канал «за молчание». heartbeatCallback — о смерти
     сокета узнаём сразу и показываем это в панели, не дожидаясь статуса
     канала. */
  const SB = window.supabase.createClient(cfg.url, cfg.anonKey, {
    // Промпт №11 нового списка (доска учителя): на странице досок у учителя
    // есть вход по email (boards-cloud.js, свой клиент). Совместной сессии
    // вход не нужен — она анонимная, — а второй клиент с настройками по
    // умолчанию подхватил бы тот же сохранённый вход и стал бы сам его
    // обновлять наперегонки с первым: одноразовый ключ обновления сгорает у
    // одного, и учителя выкидывает из аккаунта. Поэтому здесь вход не
    // читаем, не храним и не обновляем
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'ts-session-share-anon' },
    realtime: {
      params: { eventsPerSecond: 100 },
      heartbeatIntervalMs: 10000,
      worker: typeof Worker !== 'undefined',
      heartbeatCallback: (status) => { try { onSocketHeartbeat(status); } catch (e) {} },
    },
  });

  // код читается «безопасным для устной диктовки» алфавитом — без 0/O/1/I/L,
  // чтобы не путать при звонке (см. комментарий в trainer_sessions.sql)
  const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  function generateCode(len) {
    len = len || 8;
    let s = '';
    const arr = new Uint32Array(len);
    (window.crypto || window.msCrypto).getRandomValues(arr);
    for (let i = 0; i < len; i++) s += CODE_ALPHABET[arr[i] % CODE_ALPHABET.length];
    return s;
  }

  /* ═══ Промпт №75: несколько независимых сессий в одном браузере ═══
     Учитель ведёт параллельные занятия с одного компьютера: Ваня в одной
     вкладке, Петя в другой. Раньше код сессии был один на весь браузер
     (trainerSession:global), и вторая вкладка просто подключалась к той же
     сессии, а «Начать новую» в ней перебивала код первой.
     Теперь код и роль живут ВО ВКЛАДКЕ (sessionStorage). Браузер держит это
     хранилище за вкладкой, пока она открыта: переходы между страницами
     сайта (ОГЭ → ЕГЭ → основы → доски и обратно) и перезагрузка его не
     сбрасывают — поэтому сессия держится на любых переходах, как и раньше,
     и при этом не видна соседней вкладке. Общий ключ trainerSession:global
     остался: по нему вкладка, у которой своей сессии ещё нет, продолжает
     последнюю (если та не открыта в другой вкладке), а ученик, открывший
     сайт сам, возвращается на сцену учителя. */
  const TAB_CODE_KEY = 'tsTab:code';
  const TAB_ROLE_KEY = 'tsTab:role';
  // «семья» вкладок: те, что открыты нашими кнопками друг из друга. Только
  // в пределах семьи браузер даёт переключиться на вкладку по её имени
  // окна — по этой метке решаем, пробовать ли переключение (см. goToSession)
  const TAB_GROUP_KEY = 'tsTab:group';
  // время ухода прошлой страницы ЭТОЙ вкладки (см. pagehide ниже)
  const TAB_LEFT_KEY = 'tsTab:leftAt';
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function ssDel(k) { try { sessionStorage.removeItem(k); } catch (e) {} }

  // ?tsnew=КОД — вкладку открыла кнопка «Новая сессия», ?tsresume=КОД —
  // строка списка сессий (переоткрыть закрытую). Разбираем сразу при
  // загрузке: браузер копирует в открытую так вкладку хранилище той, что её
  // открыла (код, роль, номер участника), и их надо заменить раньше, чем
  // кто-то успеет их прочитать — подборка, номер участника чуть ниже
  let TAB_NEW_CODE = null, TAB_RESUME_CODE = null;
  (function takeTabParams() {
    let u;
    try { u = new URL(location.href); } catch (e) { return; }
    const n = u.searchParams.get('tsnew'), r = u.searchParams.get('tsresume');
    if (!n && !r) return;
    const clean = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16) || null;
    TAB_NEW_CODE = clean(n);
    TAB_RESUME_CODE = TAB_NEW_CODE ? null : clean(r);
    // метку из адреса убираем: перезагрузка такой вкладки — это уже обычная
    // перезагрузка своей сессии, а не «создать ещё одну»
    u.searchParams.delete('tsnew'); u.searchParams.delete('tsresume');
    try { history.replaceState(history.state, '', u.toString()); } catch (e) {}
    const c = TAB_NEW_CODE || TAB_RESUME_CODE;
    if (!c) return;
    ssSet(TAB_CODE_KEY, c);
    ssSet(TAB_ROLE_KEY, 'leader');
    ssDel(TAB_LEFT_KEY);
    ssDel('tsClientId'); // номер участника — свой, а не скопированный у соседней вкладки
  })();
  if (!ssGet(TAB_GROUP_KEY)) ssSet(TAB_GROUP_KEY, generateCode(10));

  function myClientId() {
    let id = sessionStorage.getItem('tsClientId');
    if (!id) { id = generateCode(12); sessionStorage.setItem('tsClientId', id); }
    return id;
  }

  let trainerSlug = null;
  let code = null;
  let channel = null;
  let getStateCb = () => ({});
  let applyStateCb = () => {};
  let applyingRemote = false;
  let saveTimer = null;
  const fields = new Map(); // fieldId -> {el, onInput}
  const eventListeners = new Map(); // name -> Set<cb>
  // let, а не const: вкладка-дубль получает новый номер (см. freshTabIdentity)
  let CLIENT_ID = myClientId();

  // ── Промпт №23: права ученика и переключатель автосохранения истории —
  // общие для ЛЮБОГО тренажёра (не завязаны на конкретную структуру getState
  // тренажёра), поэтому живут прямо здесь и всегда входят в fullState() под
  // отдельными ключами __permissions/__autosaveHistory, независимо от того,
  // умеет ли конкретный tsGetState() что-то о них знать
  const DEFAULT_PERMISSIONS = { switchTask: true, refreshOne: true, refreshAll: true, showSolution: true, deleteTask: true, board: true };
  let permissions = Object.assign({}, DEFAULT_PERMISSIONS);
  let permissionsChangeCb = null;
  let autosaveHistory = true; // по умолчанию включено — история пишется, пока явно не выключат
  let autosaveChangeCb = null;

  function getPermissions() { return Object.assign({}, permissions); }
  function setPermission(key, val) {
    // менять права может только «главный» (Учитель) — у присоединившегося
    // эта функция просто не должна вызываться из UI (см. mountShareButton),
    // но на всякий случай подстраховываемся и здесь
    if (!isLeaderFlag) return;
    permissions = Object.assign({}, permissions, { [key]: !!val });
    if (permissionsChangeCb) { try { permissionsChangeCb(getPermissions()); } catch (e) {} }
    push();
  }
  function onPermissionsChange(cb) { permissionsChangeCb = cb; }

  function getAutosaveHistory() { return autosaveHistory; }
  function setAutosaveHistory(val) {
    autosaveHistory = !!val;
    if (autosaveChangeCb) { try { autosaveChangeCb(autosaveHistory); } catch (e) {} }
    push();
  }
  function onAutosaveHistoryChange(cb) { autosaveChangeCb = cb; }

  /* ═══ Промпт №25/№30: права присоединившегося — общая проверка для ЛЮБОЙ
     страницы платформы (раньше это жило отдельной копией внутри каждого
     тренажёра — oge8.html, oge12.html; теперь одна реализация здесь, чтобы
     работало одинаково и на index.html, и на любом тренажёре без интеграции
     вручную). 'switchTask' — переключение типа/задания внутри тренажёра,
     'navigate' — уход со страницы вообще (на другой тренажёр или на
     главную): оба всегда только у «главного» (Учителя), без исключений и
     без переключателя в панели — иначе присоединившийся может сам сбить
     синхронизацию всей группы. */
  function studentRestricted(action) {
    if (isLeaderFlag) return false;
    // Промпт №11 нового списка: сцена сама повторяет у ученика то, что открыл
    // учитель (калькулятор, колонку «+», доску) — это не действие ученика
    if (mirrorApplying) return false;
    // Промпт №31: 'boardPan' — перемещение/масштаб доски и прокрутка
    // страницы. Тоже всегда только у главного: если ученик уедет по доске
    // сам, учитель будет писать в одном месте, а ученик смотреть в другое.
    if (action === 'switchTask' || action === 'navigate' || action === 'boardPan') return true;
    return !!permissions && permissions[action] === false;
  }
  let restrictedHintTimer = null;
  let restrictedHintStyleInjected = false;
  function ensureRestrictedHintStyle() {
    if (restrictedHintStyleInjected) return;
    restrictedHintStyleInjected = true;
    try {
      const style = document.createElement('style');
      style.textContent = `#tsRestrictedHint{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);
        z-index:9999;background:var(--glass-strong,rgba(30,30,30,.85));backdrop-filter:blur(20px) saturate(160%);
        -webkit-backdrop-filter:blur(20px) saturate(160%);border:1px solid var(--glass-border,rgba(255,255,255,.2));
        border-radius:12px;padding:9px 16px;font-size:12.5px;color:var(--pencil,#fff);
        box-shadow:var(--shadow,0 4px 20px rgba(0,0,0,.35));opacity:0;transition:opacity .2s;pointer-events:none;
        font-family:system-ui,-apple-system,sans-serif;}`;
      document.head.appendChild(style);
    } catch (e) {}
  }
  function flashRestrictedHint() {
    try {
      ensureRestrictedHintStyle();
      let el = document.getElementById('tsRestrictedHint');
      if (!el) {
        el = document.createElement('div');
        el.id = 'tsRestrictedHint';
        el.textContent = 'Учитель ограничил это действие';
        document.body.appendChild(el);
      }
      clearTimeout(restrictedHintTimer);
      el.style.opacity = '1';
      restrictedHintTimer = setTimeout(() => { el.style.opacity = '0'; }, 1400);
    } catch (e) {}
  }
  // оборачивает обработчик клика: если действие ограничено для
  // присоединившегося — просто показываем подсказку и ничего не делаем;
  // иначе выполняем как обычно. Используется как для внутритренажёрных
  // действий ('switchTask'), так и для любых ссылок/кнопок перехода между
  // страницами платформы ('navigate') — на index.html в том числе.
  function guardStudentAction(action, fn) {
    return function (...args) {
      if (studentRestricted(action)) { flashRestrictedHint(); return; }
      return fn.apply(this, args);
    };
  }

  // ── «История/конспект урока» сама по себе устроена по-разному в каждом
  // тренажёре (нужно знать структуру его DOM, чтобы делать снимки) — поэтому
  // здесь только слот регистрации: конкретный тренажёр (см. lesson-history.js)
  // подставляет сюда getCount()/onDownload(), а панель «Совместный доступ»
  // просто их вызывает, не зная деталей ──
  let historyUI = null; // { getCount(), onDownload() }
  function registerHistoryUI(api) { historyUI = api; if (uiEls) renderPanel(); }
  // вызывается снаружи (lesson-history.js) при каждом новом снимке — обновляет
  // счётчик «История: N снимков» в уже открытой панели, не дожидаясь её
  // повторного открытия
  function notifyHistoryChanged() { if (uiEls) renderPanel(); }

  // ── тема оформления сайта — тоже общая для любого тренажёра вещь: сама
  // применяем data-theme/localStorage, не дожидаясь, пока конкретный
  // tsApplyState() тренажёра об этом узнает ──
  // тема учителя — последняя, что пришла от него (см. followerThemeTick)
  let leaderTheme = null;
  function applyRemoteTheme(theme) {
    if (!theme) return;
    try {
      if (document.documentElement.getAttribute('data-theme') === theme) return;
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      const btn = document.getElementById('themeToggle');
      if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    } catch (e) {}
  }

  // Промпт №30: раньше код сессии хранился ОТДЕЛЬНО под каждый тренажёр
  // ('trainerSession:oge8', 'trainerSession:oge12', ...) — из-за этого переход
  // на другой тренажёр незаметно заводил учителю совсем другой, новый код, и
  // сессия «терялась». Теперь код один на всю платформу, под общим ключом —
  // переход между тренажёрами (и обычная перезагрузка страницы) больше не
  // сбрасывает его. Старые ключи ниже читаются один раз как аварийный
  // источник (чтобы уже открытая сессия не потерялась при обновлении сайта).
  const GLOBAL_CODE_KEY = 'trainerSession:global';
  function storageKey() { return GLOBAL_CODE_KEY; }

  function readStoredCode() {
    try {
      const own = localStorage.getItem(GLOBAL_CODE_KEY);
      if (own) return own;
      // миграция со старой, посттренажёрной схемы хранения — берём первый
      // найденный код от старой версии платформы, если общий ещё не заведён
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf('trainerSession:') === 0 && k !== GLOBAL_CODE_KEY) {
          const v = localStorage.getItem(k);
          if (v) return v;
        }
      }
      return null;
    } catch (e) { return null; }
  }
  // Промпт №75: код — и во вкладку (главное: по нему живёт эта вкладка), и в
  // общий ключ (по нему новая вкладка без своей сессии продолжит последнюю)
  function storeCode(c) {
    ssSet(TAB_CODE_KEY, c);
    try { localStorage.setItem(GLOBAL_CODE_KEY, c); } catch (e) {}
  }
  // последний код, который вводили в поле «Подключиться по коду» — не сам
  // код активной сессии (он в GLOBAL_CODE_KEY), а просто чтобы после
  // перезагрузки/потери связи не пришлось вспоминать код заново: как
  // договорились, в худшем случае достаточно нажать «Подключиться» ещё раз
  // с тем же кодом — а он уже будет стоять в поле.
  const LAST_JOIN_KEY = 'trainerSession:lastJoinCode';
  function readLastJoinCode() { try { return localStorage.getItem(LAST_JOIN_KEY) || ''; } catch (e) { return ''; } }
  function storeLastJoinCode(c) { try { localStorage.setItem(LAST_JOIN_KEY, c); } catch (e) {} }

  // Промпт №30: код теперь один на всю платформу и переживает переход между
  // тренажёрами и перезагрузку — но роль («главный»/«присоединившийся») тоже
  // нужно помнить отдельно от кода. Без этого ученик, чей браузер просто
  // открыл какую-то страницу платформы БЕЗ ?s= в адресе (например, вручную
  // набрал адрес, или вернулся на главную не по ссылке учителя), был бы по
  // старой логике объявлен «главным» для уже сохранённого у него общего
  // кода — и мог бы своей перезаписью строки в БД увести всю группу «туда,
  // где сейчас он», хотя реально сессией управляет учитель на другом
  // устройстве. Роль фиксируется один раз — при создании своего кода
  // («главный») или при подключении по чужому коду/ссылке
  // («присоединившийся») — и дальше читается на каждой обычной загрузке
  // страницы без ?s=, вместо того чтобы каждый раз считать себя главным.
  const ROLE_KEY = 'trainerSession:global:role';
  function readStoredRole() { try { return localStorage.getItem(ROLE_KEY); } catch (e) { return null; } }
  function storeRole(role) {
    ssSet(TAB_ROLE_KEY, role);
    try { localStorage.setItem(ROLE_KEY, role); } catch (e) {}
  }

  function urlJoinCode() {
    try {
      const p = new URLSearchParams(location.search);
      return p.get('s') || null;
    } catch (e) { return null; }
  }

  async function fetchRow(c) {
    // 'trainer' здесь читается не только «для метки записи» (как раньше), а
    // как «на какой странице сейчас находится группа» — Промпт №30 использует
    // это, чтобы новый/переподключившийся участник автоматически попадал на
    // ТОТ ЖЕ тренажёр, что и остальные, а не оставался на своей исходной странице.
    const { data, error } = await SB.from('trainer_sessions').select('code, state, trainer').eq('code', c).maybeSingle();
    if (error) { console.error('[session-share] ошибка чтения сессии:', error.message); return null; }
    return data;
  }
  async function insertRow(c, trainer, state) {
    const { error } = await SB.from('trainer_sessions').insert({ code: c, trainer: trainer, state: state || {} });
    if (error) console.error('[session-share] не удалось создать сессию:', error.message);
  }
  async function upsertState(c, trainer, state) {
    const { error } = await SB.from('trainer_sessions')
      .upsert({ code: c, trainer: trainer, state: state, last_active_at: new Date().toISOString() }, { onConflict: 'code' });
    if (error) console.error('[session-share] не удалось сохранить состояние:', error.message);
  }

  function fullState() {
    const s = getStateCb() || {};
    const fieldValues = {};
    fields.forEach((entry, id) => { fieldValues[id] = entry.el.value; });
    let theme = 'light';
    try { theme = document.documentElement.getAttribute('data-theme') || 'light'; } catch (e) {}
    return Object.assign({}, s, {
      __fields: fieldValues,
      __permissions: permissions,
      __autosaveHistory: autosaveHistory,
      __theme: theme,
      __trainer: trainerSlug, // Промпт №30 — какая страница прислала этот снимок
    }, isLeaderFlag ? {
      __stage: stageSize(), __ui: uiSnapshot(),
      __scroll: { x: Math.round(window.scrollX), y: Math.round(window.scrollY) },
    } : {});
  }

  function applyIncomingState(state) {
    if (!state) return;
    // Промпт №31: отправитель мог выкинуть из рассылки тяжёлые поля (см.
    // trimForBroadcast). Их отсутствие означает «не менялось / прислать не
    // смогли», а НЕ «стало пустым», поэтому подставляем на их место то, что
    // сейчас есть у нас: иначе доска или список добавленных заданий
    // очистились бы сами собой на принимающей стороне.
    if (Array.isArray(state.__trimmed) && state.__trimmed.length) {
      let localNow = {};
      try { localNow = getStateCb() || {}; } catch (e) {}
      state = Object.assign({}, state);
      state.__trimmed.forEach(k => {
        if (typeof localNow[k] !== 'undefined') state[k] = localNow[k];
      });
    }
    // права/автосохранение/тема — общие для ВСЕЙ платформы (не завязаны на
    // конкретный тренажёр), применяем их всегда, независимо от того, с какой
    // страницы пришло состояние — Промпт №30 (переход между тренажёрами) не
    // должен сбрасывать эти общие настройки
    if (state.__permissions) {
      permissions = Object.assign({}, DEFAULT_PERMISSIONS, state.__permissions);
      if (permissionsChangeCb) { try { permissionsChangeCb(getPermissions()); } catch (e) {} }
    }
    if (typeof state.__autosaveHistory === 'boolean' && state.__autosaveHistory !== autosaveHistory) {
      autosaveHistory = state.__autosaveHistory;
      if (autosaveChangeCb) { try { autosaveChangeCb(autosaveHistory); } catch (e) {} }
    }
    if (state.__theme) applyRemoteTheme(state.__theme);
    // снимок с размером сцены кладёт только учитель — его тема и есть «правильная»
    if (state.__theme && state.__stage) leaderTheme = state.__theme;
    // Промпт №11 нового списка: размер окна учителя — до проверки «чей снимок»: он нужен
    // сцене на любой странице, даже если снимок пришёл с соседнего тренажёра
    if (state.__stage) { stageFromLeader(state.__stage); lastLeaderTrainer = state.__trainer || lastLeaderTrainer; }
    if (state.__ui) uiFromLeader(state.__ui);
    // прокрутка страниц без доски (на тренажёрах её ведёт доска, board_view)
    if (state.__scroll && IN_STAGE && !isLeaderFlag && !window.__boardBroadcastView) {
      try { window.scrollTo(state.__scroll.x || 0, state.__scroll.y || 0); } catch (e) {}
    }

    // а вот СТРУКТУРНУЮ часть состояния (задания, режимы и т.п.) применяем
    // только если она реально принадлежит ЭТОЙ странице — иначе, в момент
    // перехода между тренажёрами, можно на долю секунды получить чужое
    // состояние (например, снимок oge8 попадёт в applyState тренажёра oge12,
    // структуры не совпадают) и либо сломать разметку, либо просто намусорить.
    // Если метки нет вовсе (старый снимок/другая версия) — применяем как
    // раньше, по умолчанию считая её «своей».
    const belongsHere = !state.__trainer || state.__trainer === trainerSlug;
    if (!belongsHere) { followLeaderPage(state); return; }

    applyingRemote = true;
    try {
      applyStateCb(state);
    } finally {
      applyingRemote = false;
    }
    // поля — уже ПОСЛЕ структурного применения: если applyState пересоздал
    // карточки с полями ввода, они успели зарегистрироваться заново внутри
    // applyStateCb, и теперь можно проставить в них последние значения
    if (state.__fields) {
      Object.keys(state.__fields).forEach(id => {
        const entry = fields.get(id);
        if (entry && !recentlyEditedLocally(entry)) entry.el.value = state.__fields[id];
      });
    }
  }

  // «кто печатает сейчас — тот и владеет полем»: проверяем не просто фокус
  // (после применения чужого состояния поле может оказаться programmatically
  // сфокусировано самим тренажёром — например, renderCurrentTask() всегда
  // ставит фокус в поле ответа нового задания — а это не то же самое, что
  // «человек прямо сейчас печатает»), а недавний СОБСТВЕННЫЙ ввод в это
  // поле: если он был совсем недавно, придержим входящее обновление, чтобы
  // не выдернуть напечатанное прямо из-под пальцев
  const LOCAL_EDIT_GRACE_MS = 1200;
  function recentlyEditedLocally(entry) {
    return (Date.now() - (entry.lastLocalInputAt || 0)) < LOCAL_EDIT_GRACE_MS;
  }

  /* ═══ Промпт №31: живучесть соединения ═══
     Раньше подписка обрабатывала ровно один статус — SUBSCRIBED, — а
     CHANNEL_ERROR / TIMED_OUT / CLOSED не ловились вообще. Любой обрыв
     вебсокета (моргнула сеть, вкладка/ноутбук ушли в сон, Supabase закрыл
     простаивающее соединение) означал, что сессия ТИХО умирала: код в
     панели на месте, всё выглядит рабочим, а на самом деле ни штрихи, ни
     задания больше никуда не летят. Именно так и выглядело «синхронизация
     слетела сама по себе, без перезагрузок».
     Теперь: ловим все статусы, переподключаемся с нарастающей паузой,
     дополнительно проверяем канал по таймеру (бывает, что он умирает
     совсем молча, без единого статуса), реагируем на возврат сети и на
     возврат к вкладке — и после КАЖДОГО восстановления просим у остальных
     участников актуальное состояние, чтобы догнать всё пропущенное. */
  const CONN = { ONLINE: 'online', RECONNECTING: 'reconnecting', OFFLINE: 'offline' };
  let connState = CONN.RECONNECTING;
  let reconnectAttempt = 0;
  let reconnectTimer = null;
  let keepaliveTimer = null;
  let everSubscribed = false;      // был ли хоть один успешный SUBSCRIBED на этом коде
  let resubscribing = false;       // защита от гонки переподписок
  const RECONNECT_DELAYS_MS = [700, 1500, 3000, 5000, 8000, 12000];
  const KEEPALIVE_EVERY_MS = 10000;

  function setConnState(s) {
    if (connState === s) return;
    connState = s;
    notifyUi();
    // сцене — сразу, а не по секундному таймеру: короткий обрыв (0,7 с до
    // переподключения) таймер мог и не заметить
    reportConn();
  }
  function getConnState() { return connState; }

  /* Правка «доска не грузится у ученика»: сколько байт лежит в исходящем
     буфере вебсокета, ещё не отправленных. Нужен тому, кто шлёт много сразу
     (доска учителя целиком, board-stage.js): channel.send не ждёт сети, а
     просто кладёт сообщение в буфер сокета. Пачка частей большой доски за
     секунду клала туда мегабайты — у учителя с обычной домашней отдачей они
     уходили десятки секунд, и всё это время за ними в той же очереди стоял
     служебный «пульс» библиотеки. Ответ на пульс не приходил за 10 с
     (heartbeatIntervalMs ниже), библиотека считала сокет мёртвым и рвала
     его — вместе со всем, что не успело уйти. Добираемся до сокета через
     внутренности supabase-js (socketAdapter.socket.conn в сборке 2.112),
     поэтому осторожно: не нашли — считаем, что буфер пуст */
  function socketBacklog() {
    try {
      const rt = SB.realtime;
      const sock = (rt && rt.socketAdapter && rt.socketAdapter.socket) || rt;
      const conn = sock && sock.conn;
      const n = conn && conn.bufferedAmount;
      return typeof n === 'number' ? n : 0;
    } catch (e) { return 0; }
  }

  // канал жив? у RealtimeChannel есть .state: joined | joining | closed | errored | leaving
  function channelLooksAlive() {
    if (!channel) return false;
    const st = channel.state;
    if (typeof st !== 'string') return true; // неизвестная реализация (в т.ч. тестовая заглушка) — не мешаем
    return st === 'joined' || st === 'joining';
  }

  function scheduleReconnect() {
    if (!code || reconnectTimer) return;
    const delay = RECONNECT_DELAYS_MS[Math.min(reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)];
    reconnectAttempt++;
    setConnState(reconnectAttempt > 3 ? CONN.OFFLINE : CONN.RECONNECTING);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (!code) return;
      resubscribing = true;
      try { subscribeChannel(code); } catch (e) { scheduleReconnect(); }
      resubscribing = false;
    }, delay);
  }

  // немедленная попытка (сеть вернулась / вкладка снова активна) — не ждём
  // очередную паузу backoff'а, но и не запускаем вторую параллельную попытку
  function reconnectNow() {
    if (!code) return;
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    reconnectAttempt = 0;
    try { subscribeChannel(code); } catch (e) { scheduleReconnect(); }
  }

  function startKeepalive() {
    if (keepaliveTimer) return;
    keepaliveTimer = setInterval(() => {
      if (!code || resubscribing || reconnectTimer) return;
      if (!channelLooksAlive()) {
        // канал отвалился молча — статуса не было, но и живым он уже не выглядит
        setConnState(CONN.RECONNECTING);
        reconnectNow();
      }
    }, KEEPALIVE_EVERY_MS);
  }

  function bindConnectionWatchers() {
    try {
      window.addEventListener('online', () => { if (code) reconnectNow(); });
      window.addEventListener('offline', () => setConnState(CONN.OFFLINE));
      document.addEventListener('visibilitychange', () => {
        // возврат к вкладке — самый частый момент, когда обнаруживается, что
        // соединение давно умерло (ноутбук закрывали, вкладка спала)
        if (document.visibilityState === 'visible' && code && !channelLooksAlive()) reconnectNow();
      });
    } catch (e) {}
  }

  // попросить участников прислать актуальное состояние (после переподключения
  // мы могли пропустить и штрихи, и смену задания — снимок всё это чинит)
  function requestSyncFromPeers() {
    if (!channel) return;
    queueSend({ type: 'broadcast', event: 'sync_request', payload: { uid: CLIENT_ID } });
  }

  function subscribeChannel(c, onSubscribed) {
    // очередь исходящих привязана к каналу: при пересоздании канала копить
    // старые сообщения бессмысленно — состояние всё равно уйдёт заново
    dropQueued();
    if (channel) { try { SB.removeChannel(channel); } catch (e) {} channel = null; }
    channel = SB.channel('trainer_session:' + c)
      .on('broadcast', { event: 'state' }, ({ payload }) => {
        if (!payload || payload.uid === CLIENT_ID) return;
        incomingStateCount++; // Промпт №31 — признак «на этом коде кто-то живой есть»
        // размер сцены в снимке кладёт только учитель — так ученик узнаёт его
        const fromLeader = !!(payload.state && payload.state.__stage);
        touchPeer(payload.uid, fromLeader ? { leader: true, stage: false } : null);
        applyIncomingState(payload.state);
        if (fromLeader) stageLiveStateArrived();
      })
      .on('broadcast', { event: 'field' }, ({ payload }) => {
        if (!payload || payload.uid === CLIENT_ID) return;
        touchPeer(payload.uid, null);
        const entry = fields.get(payload.fieldId);
        if (!entry) return;
        if (recentlyEditedLocally(entry)) return; // сейчас печатает локальный пользователь — не перебиваем
        entry.el.value = payload.value;
      })
      .on('broadcast', { event: 'ev' }, ({ payload }) => {
        if (!payload || payload.uid === CLIENT_ID) return;
        if (payload.name === 'bye') { forgetPeer(payload.uid); return; }
        touchPeer(payload.uid, payload.name === 'hb' ? payload.data : null);
        // новый участник спрашивает «кто здесь?» — отвечаем сразу, не через
        // 5 секунд: учителю, только что перешедшему на другую страницу, иначе
        // до следующего сигнала казалось бы, что на сцене никого нет
        if (payload.name === 'hb' && payload.data && payload.data.ask) setTimeout(() => sendHeartbeat(false), 30 + Math.random() * 200);
        const set = eventListeners.get(payload.name);
        if (set) set.forEach(cb => { try { cb(payload.data); } catch (e) { console.error('[session-share] onEvent callback error:', e); } });
      })
      // Промпт №21: кто-то только что подключился (по ссылке/коду) и просит
      // актуальное состояние — отвечаем немедленным push() СВОЕГО текущего
      // состояния. Это подстраховка сверх снимка, который присоединившийся
      // и так получает через fetchRow() при заходе: снимок в БД мог ещё не
      // долететь (сохранение debounce-нное, см. scheduleSave), а вот прямая
      // просьба "пришли, что у тебя сейчас" всегда бьёт по актуальному —
      // отвечает КАЖДЫЙ, у кого уже есть код (не только явно назначенный
      // «главный»), так это работает и при 3+ участниках
      .on('broadcast', { event: 'sync_request' }, ({ payload }) => {
        if (!payload || payload.uid === CLIENT_ID) return;
        touchPeer(payload.uid, null);
        // именно ПОЛНЫЙ снимок, без диеты: у просящего может не быть вообще
        // ничего (только подключился) либо он мог пропустить часть штрихов,
        // пока связи не было — здесь как раз тот случай, когда доску нужно
        // передать целиком (см. trimForBroadcast)
        pushFull();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          const wasBroken = everSubscribed && connState !== CONN.ONLINE;
          everSubscribed = true;
          reconnectAttempt = 0;
          setConnState(CONN.ONLINE);
          startKeepalive();
          // Промпт №11 нового списка: сразу заявляем о себе — учитель видит
          // ученика «на связи», не дожидаясь очередного сигнала через 5 секунд
          setTimeout(() => sendHeartbeat(true), 30);
          if (onSubscribed) onSubscribed();
          // это переподключение, а не первый вход: пока связи не было, мы
          // могли пропустить и штрихи, и смену задания — просим у остальных
          // участников актуальный снимок, чтобы догнать всё разом
          if (wasBroken) requestSyncFromPeers();
          // Промпт №37: и, симметрично, досылаем СВОЁ — то, что могло не уйти,
          // пока связи не было (нажатый «Проверить», ответ, новое задание)
          if (wasBroken) setTimeout(push, 150);
          return;
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          if (!resubscribing) scheduleReconnect();
        }
      });
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    // Промпт №11 нового списка: сохранение пишет в строку ТОГО кода, для
    // которого его заказали. Раньше бралось то, что в code на момент записи:
    // ученик набирал чужой код в панели, и отложенное сохранение его
    // прежней, своей сессии успевало записать в строку учителя «группа на
    // моей странице» — и ученика не уводило к учителю
    const forCode = code;
    saveTimer = setTimeout(() => {
      if (!code || code !== forCode) return;
      upsertState(code, trainerSlug, fullState());
    }, 400);
  }

  /* ═══ Промпт №31: диета рассылаемого снимка ═══
     Замер на живом тренажёре: снимок состояния тащит в себе ВСЮ доску
     целиком, и весит он 9.7 КБ уже на пяти штрихах, 57 КБ на шестидесяти —
     дальше линейно, примерно 48 байт на точку. За урок с полноценным
     разбором это уверенно уходит за лимит Supabase Realtime (256 КБ на
     сообщение): рассылка начинает молча не доходить, и связь «умирает»
     ровно в тот момент, когда на доске активно пишут.
     Поэтому: если снимок раздулся, выкидываем из РАССЫЛКИ самые тяжёлые
     массивы (это и есть штрихи доски) — их содержимое собеседник и так
     получает живьём, отдельными лёгкими событиями board_stroke. В БД при
     этом продолжает уходить полный снимок, а любой присоединившийся или
     переподключившийся получает полную картину через sync_request. */
  /* Промпт №37: предел одного сообщения — 256 КБ; берём почти всё, оставляя
     запас только на служебную обвязку. Диета включается редко, а когда
     включается — не выбрасывает штрихи, а шлёт хвост (см. ниже). */
  const MAX_BROADCAST_BYTES = 230 * 1024;
  // Штрихи доски получатель склеивает по их опознавательным знакам (sid) и
  // никогда не удаляет по отсутствию — значит, вместо того чтобы выбрасывать
  // массив штрихов целиком, можно послать его ХВОСТ: последние штрихи как раз
  // и есть то новое, чего у собеседника ещё нет. Именно это чинило «стираю, а
  // у ученика не стирается»: ластик — это тоже штрих, он всегда последний, и
  // при старом способе он выпадал из рассылки вместе со всем массивом, а
  // дойти живьём мог не успеть.
  const MERGEABLE_ARRAYS = ['strokes', 'bgStrokes'];
  const TAIL_STEPS = [200, 120, 60, 30, 12, 4];
  let trimWarned = false;

  function jsonSize(v) { try { return JSON.stringify(v).length; } catch (e) { return 0; } }

  function trimForBroadcast(state) {
    let json;
    try { json = JSON.stringify(state); } catch (e) { return state; }
    if (!json || json.length <= MAX_BROADCAST_BYTES) return state;

    const light = Object.assign({}, state);
    let size = json.length;

    // сначала укорачиваем массивы штрихов до хвоста — без потери смысла
    for (const k of MERGEABLE_ARRAYS) {
      if (size <= MAX_BROADCAST_BYTES) break;
      const arr = state[k];
      if (!Array.isArray(arr) || arr.length === 0) continue;
      const full = jsonSize(arr);
      for (const n of TAIL_STEPS) {
        if (arr.length <= n) continue;
        const tail = arr.slice(-n);
        const w = jsonSize(tail);
        light[k] = tail;
        size = size - full + w;
        if (size <= MAX_BROADCAST_BYTES) break;
      }
    }

    // если и этого мало — выкидываем самые тяжёлые оставшиеся массивы
    const weights = Object.keys(light)
      .filter(k => Array.isArray(light[k]))
      .map(k => ({ k, w: jsonSize(light[k]) }))
      .sort((a, b) => b.w - a.w);

    const dropped = [];
    for (const { k, w } of weights) {
      if (size <= MAX_BROADCAST_BYTES) break;
      delete light[k];
      dropped.push(k);
      size -= w;
    }
    if (dropped.length) {
      // получатель по этой метке понимает: отсутствие поля означает «не
      // прислали», а не «стало пустым» (важно, чтобы доска не «стёрлась»
      // сама собой на той стороне)
      light.__trimmed = dropped;
      if (!trimWarned) {
        trimWarned = true;
        console.info('[session-share] снимок велик (' + Math.round(json.length / 1024) + ' КБ) — тяжёлые поля идут только в БД и по запросу синхронизации:', dropped.join(', '));
      }
    }
    return light;
  }

  /* ═══ Промпт №36: очередь исходящих сообщений ═══
     Сервер realtime считает сообщения в секунду и при превышении лимита
     сначала молча их теряет, а потом закрывает соединение. Раньше мы слали
     всё подряд немедленно: во время активного письма на доске это гарантированно
     пробивало лимит. Теперь любое исходящее сообщение проходит через эту
     очередь. Она держит темп заведомо ниже разрешённого, а лишнее не
     выбрасывает, а СКЛЕИВАЕТ: несколько подряд идущих снимков состояния
     сворачиваются в последний (он и так самый свежий), пачки точек одного и
     того же штриха — в одну, перемещения по доске — в последнее. Важное
     (начало и конец штриха, очистка, переход) при этом никуда не девается. */
  /* Промпт №37: отправляем сразу и без посредников. Никаких очередей,
     никаких «бюджетов»: чем меньше слоёв между рукой и экраном собеседника,
     тем меньше задержка. queueSend оставлен как имя (его зовут из нескольких
     мест), но теперь это просто отправка. */
  function queueSend(msg) {
    if (!channel) return;
    try { channel.send(msg); } catch (e) {}
  }
  function dropQueued() {}

  function push() {
    if (applyingRemote || !code) return;
    const state = fullState();
    if (channel) {
      const payloadState = trimForBroadcast(state);
      queueSend({ type: 'broadcast', event: 'state', payload: { uid: CLIENT_ID, state: payloadState } });
    }
    scheduleSave();
  }

  // полный снимок, без диеты — только в ответ на прямую просьбу
  // «пришлите, что у вас сейчас» (подключение/переподключение)
  function pushFull() {
    if (applyingRemote || !code || !channel) return;
    queueSend({ type: 'broadcast', event: 'state', payload: { uid: CLIENT_ID, state: fullState() } });
  }

  // Промпт №21: тот, кто НЕ переходил по чужой ссылке/коду (т.е. сам открыл
  // тренажёр и сам создал/переиспользовал свой код) — «главный» (Учитель).
  // Это не столько отдельная привилегия, сколько объяснение того, ПОЧЕМУ
  // при подключении по ссылке синхронизация идёт именно к его текущему
  // заданию — обычный флаг для UI («Вы — главный» в панели), см. mountShareButton.
  let isLeaderFlag = true;
  function isLeader() { return isLeaderFlag; }

  // Промпт №25: сколько раз и с какой паузой перепроверять существование
  // кода, прежде чем окончательно признать "такой сессии нет" — реальная
  // сеть иногда чуть отстаёт от факта (запись учителя уже видна ЕМУ самому
  // в панели, но первый select у подключающегося может её ещё не увидеть).
  // Один быстрый повтор почти всегда всё решает; дальше — на случай совсем
  // медленной сети.
  const JOIN_RETRY_DELAYS_MS = [300, 700, 1200];

  /* ═══ Промпт №31: «сессия не найдена» при живой сессии ═══
     Существование сессии проверялось ИСКЛЮЧИТЕЛЬНО по строке в таблице. Но
     строка — не единственная правда: она пишется с задержкой (scheduleSave
     debounce-нут), может не записаться вовсе (сеть/права), а сама сессия при
     этом прекрасно живёт в realtime-канале. В таком случае подключение
     фактически проходило — снимки от учителя приходили, — а панель всё равно
     писала «Сессия с таким кодом не найдена».
     Поэтому, если строки нет, спрашиваем у самого канала: есть ли тут
     кто-нибудь живой? Любой ответивший снимок означает, что сессия
     существует и мы в неё попали. */
  let incomingStateCount = 0;
  const LIVE_PROBE_MS = 1500;

  async function probeLiveSession() {
    const before = incomingStateCount;
    requestSyncFromPeers();
    for (let waited = 0; waited < LIVE_PROBE_MS; waited += 100) {
      await new Promise(r => setTimeout(r, 100));
      if (incomingStateCount > before) return true;
    }
    return incomingStateCount > before;
  }

  // Промпт №30: если код найден, но его 'trainer' не совпадает с текущей
  // страницей — прежде чем считать, что группа реально в другом месте, и
  // уводить туда, даём короткое окно на то, что запись в БД просто ещё не
  // успела подтянуться. Типичная причина — ведущий только что сам
  // переключился сюда через navigateTo(): рассылка 'navigate' уходит
  // подписчикам раньше, чем у ведущего успевает прогрузиться новая
  // страница и обновить строку в БД (см. фикс ниже в activate()), поэтому
  // присоединившегося, идущего следом за той же рассылкой, иначе уводило
  // обратно туда, откуда он только что синхронно пришёл.
  const MISMATCH_RECHECK_DELAYS_MS = [200, 400, 800];

  // Промпт №30: адрес другой страницы тренажёра по её слагу — слаг всегда
  // совпадает с именем файла без расширения (тот же слаг, что передаётся в
  // TrainerSession.init({trainer: ...}) на каждой странице), поэтому
  // отдельная таблица соответствий не нужна.
  function urlForTrainer(slug, c) {
    const u = new URL(slug + '.html', location.href);
    if (c) u.searchParams.set('s', c);
    return u.toString();
  }

  async function activate(c, opts) {
    opts = opts || {};
    const prevCode = code; // на случай отката, если c не найдётся (см. ниже)
    code = c;
    let resolveSubscribed;
    const subscribed = new Promise((res) => { resolveSubscribed = res; });
    subscribeChannel(c, resolveSubscribed);
    let row = await fetchRow(c);
    if (!row && !opts.createIfMissing) {
      // это попытка ПОДКЛЮЧИТЬСЯ к чужому коду (не создать свой) — прежде чем
      // сообщать "не найдено", даём сети ещё несколько шансов досогласоваться
      for (const delay of JOIN_RETRY_DELAYS_MS) {
        await new Promise(r => setTimeout(r, delay));
        row = await fetchRow(c);
        if (row) break;
      }
    }
    if (!row) {
      if (opts.createIfMissing) {
        await insertRow(c, trainerSlug, fullState());
      } else {
        // Промпт №31: строки нет — но, возможно, сессия всё равно живая
        // (см. комментарий у probeLiveSession). Спрашиваем у канала.
        await Promise.race([subscribed, new Promise(r => setTimeout(r, 1200))]);
        const alive = await probeLiveSession();
        if (alive) {
          storeCode(c);
          notifyUi();
          // снимок в БД восстановит ближайшее сохранение любого участника —
          // отдельно писать его отсюда не нужно (и не надо: наше состояние
          // сейчас пустое, мы только что подключились)
          return { ok: true, viaLiveProbe: true };
        }
        // сессии действительно нет — откатываемся к тому, что было ДО попытки
        // подключения, а не остаёмся "подвешенными" на несуществующем коде:
        // subscribeChannel() выше уже отписал от прежнего канала, поэтому
        // для настоящего отката его нужно переподписать заново
        if (prevCode) {
          await new Promise(resolve => subscribeChannel(prevCode, resolve));
          code = prevCode;
        } else {
          // прежнего кода не было вовсе — тогда и подписка на чужой канал
          // здесь лишняя: без этого мы оставались бы слушать код, в котором
          // формально «не состоим» (code = null), и получалась бы половинчатая
          // синхронизация — снимки приходят, свои не уходят
          if (channel) { try { SB.removeChannel(channel); } catch (e) {} channel = null; }
          code = null;
        }
        notifyUi();
        return { ok: false, reason: 'not_found' };
      }
    } else {
      // Промпт №30: код нашёлся — но группа может сейчас быть НЕ на этой
      // странице (учитель уже переключил тренажёр где-то ещё). Подключение
      // «к чужому коду» (не создание своего) — а также обычная загрузка
      // страницы БЕЗ ?s= у того, кто по сохранённой РОЛИ является
      // присоединившимся (opts.followerFallback, см. init()) — в этом
      // случае не остаётся здесь — переходим на актуальную страницу, унося
      // код в ?s= с собой, и не трогаем applyIncomingState здесь: она всё
      // равно относится к другому тренажёру и там будет применена заново
      // после перехода.
      const treatAsFollower = !opts.createIfMissing || opts.followerFallback;
      if (treatAsFollower && row.trainer && row.trainer !== trainerSlug) {
        // прежде чем окончательно решить "группа сейчас не здесь" — даём
        // БД короткое окно догнать реальность (см. комментарий у
        // MISMATCH_RECHECK_DELAYS_MS выше)
        let mismatchRow = row;
        for (const delay of MISMATCH_RECHECK_DELAYS_MS) {
          if (!mismatchRow.trainer || mismatchRow.trainer === trainerSlug) break;
          await new Promise(r => setTimeout(r, delay));
          const fresh = await fetchRow(c);
          if (fresh) mismatchRow = fresh;
        }
        if (mismatchRow.trainer && mismatchRow.trainer !== trainerSlug) {
          storeCode(c);
          location.href = urlForTrainer(mismatchRow.trainer, c);
          return { ok: true, redirecting: true };
        }
        row = mismatchRow;
      } else if (!treatAsFollower && row.trainer && row.trainer !== trainerSlug) {
        // Промпт №30: сюда попадает только настоящий «главный» (по
        // сохранённой роли, см. init()) — сам оказался здесь с уже
        // существующим (глобальным) кодом, но БД ещё помнит группу на
        // другой странице; типичный случай: «главный» только что
        // переключился сюда через navigateTo(). Актуализируем trainer в
        // БД СРАЗУ, не дожидаясь обычного дебаунса scheduleSave() (400мс) —
        // иначе те, кто подключается прямо сейчас вслед за той же
        // рассылкой 'navigate', ещё какое-то время видели бы здесь старую
        // страницу и ошибочно уводились бы обратно.
        try { await upsertState(c, trainerSlug, fullState()); } catch (e) {}
      }
      if (row.state && Object.keys(row.state).length) {
        applyIncomingState(row.state);
      }
    }
    storeCode(c);
    notifyUi();
    if (isLeaderFlag) onLeaderActivated(c); // Промпт №75: список сессий, имя вкладки, заголовок
    if (opts.requestSyncFromLeader) {
      // догоняем то, что снимок из БД мог не успеть отразить (см. комментарий
      // у обработчика 'sync_request' в subscribeChannel) — как только канал
      // реально подписан, просим текущих участников прислать актуальное
      // состояние ещё раз, напрямую
      subscribed.then(() => { requestSyncFromPeers(); });
    }
    return { ok: true };
  }

  async function init(opts) {
    trainerSlug = opts.trainer;
    getStateCb = opts.getState || (() => ({}));
    applyStateCb = opts.applyState || (() => {});
    bindConnectionWatchers(); // Промпт №31 — следим за сетью/возвратом вкладки

    const joinCode = urlJoinCode();
    // Промпт №11 нового списка: пришёл по ссылке учителя в обычном окне — открываем эту
    // же страницу на сцене (stage.html), а сами к каналу не подключаемся:
    // подключится кадр сцены, второй участник от того же ученика не нужен
    if (joinCode && canEnterStage()) {
      isLeaderFlag = false;
      enterStage(joinCode.toUpperCase());
      return;
    }
    if (joinCode) {
      isLeaderFlag = false;
      const res = await activate(joinCode.toUpperCase(), { createIfMissing: false, requestSyncFromLeader: true });
      if (res.ok) { storeRole('follower'); if (!res.redirecting) stageActivated(); return; }
      // ссылка устарела/битая — просто продолжаем со своей обычной сессией,
      // без всплывающих ошибок при обычном заходе на страницу
      isLeaderFlag = true;
      // Промпт №11 нового списка: на сцене смотреть некого (урок кончился,
      // код старый) — выходим из рамки на обычную страницу, выбор ученика
      // «сцена/обычный режим» при этом не трогаем
      if (IN_STAGE) toStageHost({ type: 'leave' });
    }
    // Промпт №75: вкладку открыла кнопка «Новая сессия» или строка списка
    // («открыть закрытую сессию») — код уже лежит во вкладке (takeTabParams)
    if (TAB_NEW_CODE || TAB_RESUME_CODE) {
      let c = TAB_NEW_CODE || TAB_RESUME_CODE;
      if (TAB_RESUME_CODE && await heldByOtherTab(c)) {
        // пока вкладка грузилась, эту сессию уже открыли в другой вкладке —
        // второй «учитель» одной сессии перебивал бы первого. Показываем
        // ту вкладку, эту закрываем (её открыл наш скрипт — браузер разрешит);
        // если закрыть не дали — здесь будет новая, своя сессия
        tabsPost({ t: 'flash', code: c });
        try { window.close(); } catch (e) {}
        await new Promise(r => setTimeout(r, 250));
        if (window.closed) return;
        c = generateCode();
        ssSet(TAB_CODE_KEY, c);
      }
      isLeaderFlag = true;
      await activate(c, { createIfMissing: true });
      storeRole('leader');
      wantPanelOpen = !!TAB_NEW_CODE; // новая сессия — сразу показываем код и ссылку
      maybeOpenPanel();
      return;
    }
    // своя сессия этой вкладки важнее общего ключа: в соседней вкладке может
    // идти другая. Общий — только для вкладки, у которой своей ещё нет
    const tabCode = ssGet(TAB_CODE_KEY);
    const fromTab = !!tabCode;
    const stored = tabCode || readStoredCode();
    const storedRole = fromTab ? (ssGet(TAB_ROLE_KEY) || 'leader') : readStoredRole();
    if (stored && storedRole === 'follower' && canEnterStage()) {
      // Промпт №11 нового списка: тот же ученик открыл страницу платформы сам, без ссылки
      isLeaderFlag = false;
      enterStage(stored);
      return;
    }
    if (stored && storedRole === 'follower') {
      // Промпт №30: этот браузер и раньше был присоединившимся к этому же
      // общему коду — обычная загрузка страницы БЕЗ ?s= в адресе (вручную
      // набранный адрес, возврат на главную и т.п.) не должна вдруг сделать
      // его «главным» и не должна перезаписывать в БД, где сейчас реально
      // находится группа. Ведём себя так же, как при подключении по
      // ссылке — если группа сейчас на другой странице, activate() сам
      // уведёт куда нужно (followerFallback).
      isLeaderFlag = false;
      const res = await activate(stored, { createIfMissing: true, followerFallback: true, requestSyncFromLeader: true });
      if (res.ok) return;
      isLeaderFlag = true;
    }
    let own = stored;
    // Промпт №75: этим кодом уже ведёт урок другая вкладка. Так бывает у
    // дубля вкладки (браузер копирует ему хранилище вместе с кодом) и у
    // новой вкладки, открытой вручную, — общий ключ указывает на сессию,
    // которая идёт рядом. Два «учителя» одной сессии перебивали бы друг
    // друга и уводили учеников, поэтому такая вкладка заводит свою сессию.
    // Переход по страницам внутри вкладки и перезагрузку не проверяем: там
    // прежняя страница этой же вкладки только что ушла (см. pagehide)
    if (own && !cameFromSameTab() && await heldByOtherTab(own)) {
      if (fromTab) freshTabIdentity();
      own = null;
    }
    own = own || generateCode();
    isLeaderFlag = true;
    await activate(own, { createIfMissing: true });
    storeRole('leader');
  }

  function registerField(fieldId, el) {
    if (!el) return;
    const prev = fields.get(fieldId);
    if (prev && prev.el === el) return; // уже зарегистрировано
    if (prev) prev.el.removeEventListener('input', prev.onInput);
    const entry = { el, onInput: null, lastLocalInputAt: 0 };
    entry.onInput = () => {
      if (applyingRemote) return;
      entry.lastLocalInputAt = Date.now();
      if (channel) {
        queueSend({ type: 'broadcast', event: 'field', payload: { uid: CLIENT_ID, fieldId, value: el.value } });
      }
      scheduleSave();
    };
    el.addEventListener('input', entry.onInput);
    fields.set(fieldId, entry);
  }
  function unregisterField(fieldId) {
    const entry = fields.get(fieldId);
    if (entry) { entry.el.removeEventListener('input', entry.onInput); fields.delete(fieldId); }
  }
  // используется перед полной перерисовкой динамического списка полей
  // (например, карточек добавленных заданий) — снимает регистрацию со ВСЕХ
  // полей, чьи id начинаются с префикса, чтобы не копились ссылки на уже
  // удалённые из DOM элементы
  function unregisterFieldsWithPrefix(prefix) {
    Array.from(fields.keys()).forEach(id => { if (id.indexOf(prefix) === 0) unregisterField(id); });
  }

  async function resetSession() {
    // «Обновить» отвязывает от старого общего канала и заводит новый, пустой —
    // но НЕ трогает то, что сейчас на экране у самого нажавшего: его текущее
    // задание никуда не девается, просто дальше оно уже не расшарено по
    // старому коду. applyIncomingState({}) вызывается на случай, если сам
    // тренажёр захочет как-то отреагировать на «пустую» сессию — у oge8.html
    // это осознанно no-op (см. проверку typeof state.picker в tsApplyState).
    const c = generateCode();
    // Промпт №75: это та же вкладка и, как правило, тот же ученик — новый
    // только код. Имя в списке сессий и подборка переезжают на новый код,
    // а не теряются (подборка теперь своя у каждой сессии)
    const prev = isLeaderFlag ? code : null;
    // код вкладки — сразу, вместе с переездом подборки: activate() запишет
    // его только после запроса к базе, и всё это время подборка читалась бы
    // по старому коду — пустой
    if (prev) { regRecode(prev, c); moveBasket(prev, c); ssSet(TAB_CODE_KEY, c); }
    isLeaderFlag = true; // новая своя сессия — снова главный в ней
    await activate(c, { createIfMissing: true });
    storeRole('leader');
    applyIncomingState({});
  }
  async function joinByCode(rawCode) {
    const c = (rawCode || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!c) return { ok: false, reason: 'empty' };
    storeLastJoinCode(c);
    isLeaderFlag = false; // подключаемся к чужому коду — дальше синхронизируемся к нему
    const res = await activate(c, { createIfMissing: false, requestSyncFromLeader: true });
    if (res.ok) {
      storeRole('follower');
      // Промпт №75: своей сессии в этой вкладке больше нет — соседи должны
      // увидеть её «закрытой», а из заголовка уходит её имя
      tabsPost({ t: 'bye' });
      applyTitle();
    }
    else isLeaderFlag = true; // код не найден — остаёмся при своей сессии
    // Промпт №11 нового списка: код ввели в обычном окне — дальше смотрим экран учителя
    // на сцене. Если activate() уже уводит на страницу группы, сцену
    // откроет та страница: у неё в адресе будет ?s=
    if (res.ok && !res.redirecting && canEnterStage()) enterStage(c);
    return res;
  }
  // ── лёгкие «эфемерные» события: не сохраняются, не входят в getState —
  // только для живой трансляции того, что происходит прямо сейчас (например,
  // текущая, ещё не законченная линия на доске) ──
  function broadcastEvent(name, data) {
    if (!channel) return;
    // Промпт №37: без склеек и отложек — событие уходит сразу, как есть
    queueSend({ type: 'broadcast', event: 'ev', payload: { uid: CLIENT_ID, name, data } });
  }
  function onEvent(name, cb) {
    if (!eventListeners.has(name)) eventListeners.set(name, new Set());
    eventListeners.get(name).add(cb);
  }
  function getCode() { return code; }
  function getShareUrl() {
    const u = new URL(location.href);
    u.search = '';
    u.searchParams.set('s', code);
    return u.toString();
  }

  /* ═══ Промпт №30: переход между тренажёрами внутри сессии ═══
     Учитель вызывает это вместо обычной навигации (там, где иначе стоял бы
     <a href> или location.href) — так все присоединившиеся ученики
     переходят синхронно вслед за ним, включая переход на главную (index.html,
     слаг 'index'). Присоединившийся вызвать это не может — соответствующие
     кнопки/ссылки должны быть обёрнуты в guardStudentAction('navigate', ...),
     который для него всегда запрещён (см. studentRestricted). */
  async function navigateTo(urlOrSlug) {
    if (isLeaderFlag === false) return; // подстраховка — переход всегда только у главного
    const isBareSlug = /^[a-z0-9_]+$/i.test(urlOrSlug) && !urlOrSlug.includes('.');
    const bareUrl = isBareSlug ? new URL(urlOrSlug + '.html', location.href).toString() : new URL(urlOrSlug, location.href).toString();
    // ВАЖНО: сам «главный» переходит БЕЗ ?s= в адресе — свой код он и так
    // получит на новой странице через общий (глобальный) localStorage, а
    // код в URL означает «я не создатель, а присоединившийся» (см. init()) —
    // если приклеить его и себе, «главный» на новой странице сам себе
    // покажется учеником. Код в ?s= добавляется только в рассылку — её
    // получают ТОЛЬКО присоединившиеся (см. onEvent('navigate', ...) ниже),
    // и именно им он и нужен, чтобы попасть в ту же сессию.
    const followerUrl = (() => {
      const u = new URL(bareUrl);
      if (code) u.searchParams.set('s', code);
      return u.toString();
    })();
    broadcastEvent('navigate', { url: followerUrl });
    // короткая пауза перед уходом со страницы — иначе бывает, что вкладка
    // начинает закрываться/перегружаться раньше, чем сокет успел отправить
    // последний пакет с этим событием, и присоединившиеся его не увидят
    await new Promise(r => setTimeout(r, 150));
    location.href = bareUrl;
  }
  // присоединившийся сам к себе это событие не шлёт (его собственные события
  // отфильтровываются по uid ещё в subscribeChannel), поэтому здесь не нужно
  // отдельно проверять isLeaderFlag у ОТПРАВИТЕЛЯ — только у получателя: если
  // «главный» вдруг тоже получит такое событие (не должен, но на всякий
  // случай) — он сам управляет своей навигацией и никуда «телепортироваться» не должен
  onEvent('navigate', (data) => {
    if (isLeaderFlag) return;
    if (!data || !data.url) return;
    // Промпт №11 нового списка: на сцене страницу меняет сама сцена — она
    // грузит новую во второй, скрытый кадр и показывает, когда та уже
    // нарисовала то же, что у учителя. Сами бы ушли — ученик видел бы
    // пустой кадр и промежуточный экран (список номеров) до задания
    if (IN_STAGE) { toStageHost({ type: 'nav', url: data.url }); return; }
    try { location.href = data.url; } catch (e) {}
  });

  /* ═══ Промпт №11 нового списка: «общий экран» — ученик видит страницу учителя целиком ═══
     Раньше каждый участник верстал страницу под СВОЁ окно: на телефоне
     ученика блоки уже и переносятся иначе, а записи на доске привязаны к
     координатам документа — и то, что учитель обвёл, у ученика оказывалось
     рядом, а не на месте.
     Теперь присоединившийся открывает страницу не напрямую, а внутри
     stage.html: там она лежит в кадре ровно такого размера, как окно
     учителя, и кадр целиком масштабируется под экран ученика. Внутри кадра
     вёрстка, медиазапросы и координаты доски те же, что у учителя, поэтому
     всё совпадает пропорционально без пересчёта координат — уменьшает
     картинку браузер. Страница учителя при этом не меняется вообще.
     Кадр сцены узнаём по имени окна: window.name переживает переходы внутри
     кадра (учитель ушёл на другой тренажёр — кадр перешёл следом и остался
     сценой), а метку в адресе пришлось бы протаскивать через каждый переход. */
  const STAGE_FRAME_NAME = 'tsStageFrame';
  let IN_ANY_FRAME = false;
  try { IN_ANY_FRAME = window.top !== window.self; } catch (e) { IN_ANY_FRAME = true; }
  const IN_STAGE = IN_ANY_FRAME && window.name === STAGE_FRAME_NAME;
  // Ключ нарочно НЕ начинается с «trainerSession:»: readStoredCode() в браузере
  // без общего кода берёт первый такой ключ за старый код сессии — и «off»
  // стал бы кодом (поймано тестом №54).
  // «off» — ученик сам выбрал обычный режим (своя вёрстка). Хранится у него
  // в браузере: на телефоне в вертикальном положении экран учителя мелкий,
  // и это решение ученика, а не повод дёргать учителя
  const STAGE_PREF_KEY = 'tsStage:pref';
  function stagePrefOn() { try { return localStorage.getItem(STAGE_PREF_KEY) !== 'off'; } catch (e) { return true; } }
  function setStagePref(on) { try { localStorage.setItem(STAGE_PREF_KEY, on ? 'on' : 'off'); } catch (e) {} }
  // карточки «+» и живые задания на доске — тоже кадры, но им сцена не нужна
  function canEnterStage() { return !IN_ANY_FRAME && stagePrefOn(); }
  // адрес этой страницы без кода: код сцена добавит сама
  function stageTarget() {
    const u = new URL(location.href);
    u.searchParams.delete('s');
    return (u.pathname.split('/').pop() || 'index.html') + u.search + u.hash;
  }
  function enterStage(c) {
    const u = new URL('stage.html', location.href);
    u.searchParams.set('s', c);
    u.searchParams.set('to', stageTarget());
    location.replace(u.toString());
  }
  // Размер сцены — окно учителя. Ширина без полосы прокрутки (clientWidth):
  // в кадре ученика полосы нет (прячем ниже), и ширина вёрстки совпадает
  // точно, даже если у одного Mac с тонкой полосой, а у другого Windows
  function stageSize() {
    const de = document.documentElement;
    return { w: Math.round((de && de.clientWidth) || window.innerWidth), h: Math.round(window.innerHeight) };
  }
  function toStageHost(msg) {
    if (!IN_STAGE) return;
    try { window.parent.postMessage(Object.assign({ source: 'ts-stage' }, msg), location.origin); } catch (e) {}
  }
  function stageFromLeader(sz) {
    if (isLeaderFlag || !sz || !(sz.w > 0) || !(sz.h > 0)) return;
    toStageHost({ type: 'size', w: sz.w, h: sz.h });
  }
  // где учитель сейчас пишет (координаты окна кадра) — увеличенная сцена
  // держит это место в поле зрения. Штрих шлёт точки по 30 мс, сцене
  // столько не нужно: хватает нескольких раз в секунду
  let stageFocusAt = 0;
  function stageFocus(x, y) {
    if (!IN_STAGE || isLeaderFlag) return;
    const now = Date.now();
    if (now - stageFocusAt < 120) return;
    stageFocusAt = now;
    toStageHost({ type: 'focus', x: Math.round(x), y: Math.round(y) });
  }
  if (IN_STAGE) {
    // полосу прокрутки в кадре прячем: ширина вёрстки = ширина кадра = окно
    // учителя. Прокручивает кадр всё равно учитель (board_view), не ученик
    try {
      const st = document.createElement('style');
      st.textContent = 'html{scrollbar-width:none}html::-webkit-scrollbar{display:none}';
      document.head.appendChild(st);
    } catch (e) {}
    // адрес — чтобы перезагрузка сцены вернула ученика туда же
    toStageHost({ type: 'url', href: location.href, title: document.title });
  }
  // учитель поменял окно (растянул, открыл панель, сменил масштаб браузера)
  // — сцена у учеников меняет размер следом. Кроме resize следим и за самим
  // <html>: полоса прокрутки (Windows, «всегда показывать» на Mac) появляется
  // на длинной странице и съедает ширину без всякого resize
  let stageResizeTimer = null, lastStageKey = '';
  function checkStageSize() {
    if (!isLeaderFlag || !code) return;
    clearTimeout(stageResizeTimer);
    stageResizeTimer = setTimeout(() => {
      if (!isLeaderFlag || !code) return;   // за 150 мс мог стать учеником чужой сессии
      const sz = stageSize(), key = sz.w + 'x' + sz.h;
      if (key === lastStageKey) return;
      lastStageKey = key;
      broadcastEvent('stage_size', sz);
      scheduleSave();   // и в базу: подключившийся позже сразу получит верный размер
    }, 150);
  }
  window.addEventListener('resize', checkStageSize);
  try { if (window.ResizeObserver) new ResizeObserver(checkStageSize).observe(document.documentElement); } catch (e) {}
  onEvent('stage_size', stageFromLeader);

  /* ── ученик оказался не на той странице, где учитель ──
     Обычно ученика переводит событие 'navigate'. Но его можно пропустить
     (связь моргнула в момент перехода), а подключение, прошедшее через
     «живую пробу» канала без строки в базе, вообще не знает, где группа.
     Живой снимок учителя с чужой страницы — верный признак: подождав
     немного (вдруг 'navigate' уже в пути), идём туда же */
  // Запоздавший снимок со страницы, которую учитель уже покинул, тоже
  // «чужой» — поэтому идём, только если и последний снимок учителя всё ещё
  // оттуда: сам учитель на новой странице отвечает на запрос синхронизации
  // быстрее, чем истекает пауза
  let followTimer = null, followTarget = '', lastLeaderTrainer = '';
  function followLeaderPage(state) {
    if (isLeaderFlag || !code || !state || !state.__stage || !state.__trainer) return;
    if (followTarget === state.__trainer) return;
    clearTimeout(followTimer);
    const target = state.__trainer;
    followTimer = setTimeout(() => {
      if (isLeaderFlag || !code || followTarget === target || lastLeaderTrainer !== target) return;
      followTarget = target;
      const url = urlForTrainer(target, code);
      if (IN_STAGE) toStageHost({ type: 'nav', url: url });
      else { try { location.href = url; } catch (e) {} }
    }, 1200);
  }

  /* ── кадр сцены готов: показывает то же, что у учителя ──
     Сцена держит новую страницу скрытой, пока та не догонит учителя. Снимок
     из базы может быть старым (учитель пришёл стрелкой и только что открыл
     прототип — в базе ещё список номеров), поэтому ждём живой снимок
     учителя, пришедший уже после подключения. Нет его за 1,8 с (учитель
     молчит или вышел) — показываем то, что есть */
  let stageActivatedAt = 0, stageReadySent = false;
  // страница может попросить придержать «готово», пока не догрузит своё
  // (доска учителя приходит частями уже после подключения — board-stage.js)
  let readyHolds = 0, readyWanted = false;
  function holdStageReady() { readyHolds++; }
  function releaseStageReady() {
    if (readyHolds > 0) readyHolds--;
    if (!readyHolds && readyWanted) { readyWanted = false; stageReadyNow(); }
  }
  function stageReadyNow() {
    if (!IN_STAGE || stageReadySent) return;
    if (readyHolds) { readyWanted = true; return; }
    stageReadySent = true;
    // небольшая пауза — чтобы пришедшее успело лечь на экран. Не через
    // requestAnimationFrame: кадр, пока ждёт, прозрачен, и браузер вправе
    // придерживать ему отрисовку
    setTimeout(() => toStageHost({ type: 'ready' }), 150);
  }
  function stageActivated() {
    if (!IN_STAGE) return;
    stageActivatedAt = Date.now();
    setTimeout(stageReadyNow, 1800);
  }
  function stageLiveStateArrived() {
    if (IN_STAGE && stageActivatedAt && !stageReadySent) stageReadyNow();
  }

  /* ═══ Промпт №11 нового списка: кто на связи ═══
     Каждый участник раз в 5 секунд шлёт короткий сигнал «я здесь» (кто он:
     учитель/ученик, на сцене ли). Отсюда:
     - учитель видит, сколько учеников сейчас на связи;
     - ученик видит, что учитель пропал (закрыл вкладку, у него упал интернет),
       а не гадает, почему ничего не происходит;
     - молчаливую смерть собственной связи: собеседники сигналили, и вдруг
       тишина дольше трёх сигналов — переспрашиваем, а не ответили — сами
       переподключаемся, не дожидаясь, пока библиотека заметит обрыв.
     Уходя со страницы, участник прощается («bye») — иначе при каждом
     переходе учитель видел бы «на связи» лишнего ученика ещё 15 секунд. */
  const HB_EVERY_MS = 5000, PEER_TTL_MS = 16000;
  const peers = new Map();           // uid -> { at, leader, stage }
  let lastPeerAt = 0, leaderSeenAt = 0;
  let silentStep = 0, silentAt = 0;  // 1 — переспросили, 2 — переподключились
  function touchPeer(uid, info) {
    if (!uid || uid === CLIENT_ID) return;
    const now = Date.now();
    const p = peers.get(uid) || { at: 0, leader: false, stage: false };
    p.at = now;
    if (info) { p.leader = !!info.leader; p.stage = !!info.stage; }
    peers.set(uid, p);
    lastPeerAt = now;
    if (p.leader) leaderSeenAt = now;
    silentStep = 0;
  }
  function forgetPeer(uid) {
    peers.delete(uid);
    if (!peers.size) lastPeerAt = 0;
  }
  function livePeers() {
    const now = Date.now(), out = [];
    peers.forEach((p) => { if (now - p.at < PEER_TTL_MS) out.push(p); });
    return out;
  }
  function studentsOnline() { return livePeers().filter(p => !p.leader).length; }
  function stageViewers() { return livePeers().some(p => !p.leader && p.stage); }
  // учитель молчит дольше трёх сигналов (считая от подключения, если его
  // ещё не слышали) — для ученика это «учитель не на связи»
  function teacherSilent() {
    if (isLeaderFlag || !code || connState !== CONN.ONLINE) return false;
    const since = leaderSeenAt || stageActivatedAt || joinedAt;
    return !!since && Date.now() - since > PEER_TTL_MS;
  }
  let joinedAt = 0;
  function sendHeartbeat(ask) {
    if (!code || !channel) return;
    if (!joinedAt) joinedAt = Date.now();
    const data = { leader: !!isLeaderFlag, stage: IN_STAGE };
    if (ask) data.ask = 1;
    broadcastEvent('hb', data);
  }
  setInterval(() => {
    sendHeartbeat(false);
    // молчаливая смерть связи (см. выше)
    if (!code || connState !== CONN.ONLINE || !lastPeerAt) return;
    const now = Date.now();
    if (silentStep === 0 && now - lastPeerAt > PEER_TTL_MS) {
      silentStep = 1; silentAt = now;
      requestSyncFromPeers();
    } else if (silentStep === 1 && now - silentAt > 4000) {
      // никто не ответил: либо все ушли, либо мертва наша связь. Одно
      // переподключение ничего не стоит; дальше ждём, пока кто-то появится
      // Состояние «переподключаемся» ставим честно: связь, скорее всего,
      // была мёртвой, и после подписки нужно запросить пропущенное (это
      // делает ветка «wasBroken» в subscribeChannel)
      silentStep = 2;
      setConnState(CONN.RECONNECTING);
      reconnectNow();
    }
  }, HB_EVERY_MS);
  // Кадр сцены не прощается: при смене страницы сцена держит старый кадр,
  // пока новый не готов, а номер участника у них общий (он в sessionStorage
  // вкладки) — прощание старого кадра «выписало» бы уже подключившийся новый
  window.addEventListener('pagehide', () => {
    if (!IN_STAGE && code && channel) { try { channel.send({ type: 'broadcast', event: 'ev', payload: { uid: CLIENT_ID, name: 'bye', data: {} } }); } catch (e) {} }
  });
  function onSocketHeartbeat(status) {
    if (!code) return;
    if (status === 'timeout' || status === 'disconnected' || status === 'error') {
      if (connState === CONN.ONLINE) setConnState(CONN.RECONNECTING);
      // библиотека переподключит сокет сама; если канал после этого не
      // вернётся, его поднимет наш keepalive (channelLooksAlive)
    }
  }
  // панель и сцена — раз в секунду: «учитель не на связи» наступает не по
  // событию, а по отсутствию событий
  let lastConnSig = '';
  function reportConn() {
    const sig = connState + '|' + (teacherSilent() ? 'silent' : 'ok') + '|' + studentsOnline();
    if (sig === lastConnSig) return;
    lastConnSig = sig;
    notifyUi();
    toStageHost({ type: 'conn', state: connState, teacher: teacherSilent() ? 'silent' : 'ok' });
  }
  setInterval(reportConn, 1000);

  /* ═══ Промпт №11 нового списка: курсор учителя на сцене ═══
     Учитель водит мышью (или пером по планшету) — у учеников на сцене видно
     стрелку ровно там же: «вот сюда смотри», даже когда он ничего не пишет.
     Координаты — окна страницы, у ученика на сцене они те же. Шлём не чаще
     раз в 50 мс и только если кто-то смотрит на сцене: ученикам в обычном
     режиме (своя вёрстка) чужие координаты бессмысленны */
  const CURSOR_MS = 50;
  let curLast = 0, curTimer = null, curPending = null, curShown = false;
  function flushCursor() {
    curTimer = null;
    if (!curPending) return;
    curLast = Date.now();
    broadcastEvent('cursor', curPending);
    curShown = !curPending.h;
    curPending = null;
  }
  function queueCursor(c, now) {
    if (!isLeaderFlag || !code || !channel || !stageViewers()) return;
    curPending = c;
    if (now) { clearTimeout(curTimer); flushCursor(); return; }
    if (curTimer) return;
    curTimer = setTimeout(flushCursor, Math.max(0, CURSOR_MS - (Date.now() - curLast)));
  }
  function cursorFromEvent(e, dx, dy, now) {
    const x = e.clientX + dx, y = e.clientY + dy;
    // страница может попросить не показывать курсор в части окна, которой у
    // ученика нет (панель тренажёров на доске, см. board-stage.js)
    if (typeof window.__tsCursorMask === 'function') {
      let masked = false;
      try { masked = !!window.__tsCursorMask(x, y); } catch (err) {}
      if (masked) { hideCursor(); return; }
    }
    queueCursor({ x: Math.round(x), y: Math.round(y), d: e.buttons ? 1 : 0 }, now);
  }
  function hideCursor() { if (curShown) queueCursor({ h: 1 }, true); }
  function hookCursor(win, offset) {
    const o = offset || (() => [0, 0]);
    win.addEventListener('pointermove', (e) => { const [dx, dy] = o(); cursorFromEvent(e, dx, dy, false); }, { capture: true, passive: true });
    win.addEventListener('pointerdown', (e) => { const [dx, dy] = o(); cursorFromEvent(e, dx, dy, true); }, { capture: true, passive: true });
    win.addEventListener('pointerup', (e) => { const [dx, dy] = o(); cursorFromEvent(e, dx, dy, true); }, { capture: true, passive: true });
  }
  if (!IN_ANY_FRAME) {
    hookCursor(window);
    window.addEventListener('mouseout', (e) => { if (!e.relatedTarget) hideCursor(); });
    window.addEventListener('blur', () => setTimeout(() => { if (!document.hasFocus()) hideCursor(); }, 0));
    document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible') hideCursor(); });
    // Над карточками «+» и калькулятором в столбик мышь уходит в кадры своей
    // страницы, и родитель её движений не видит — курсор у ученика замирал бы
    // на краю карточки. Кадры своего сайта подслушиваем тоже, со сдвигом
    setInterval(() => {
      if (!isLeaderFlag || !code) return;
      document.querySelectorAll('iframe').forEach((f) => {
        let w = null;
        try { w = f.contentWindow; if (!w || !w.document || w.__tsCursorHooked) return; } catch (e) { return; }
        w.__tsCursorHooked = true;
        hookCursor(w, () => { const r = f.getBoundingClientRect(); return [r.left + (f.clientLeft || 0), r.top + (f.clientTop || 0)]; });
      });
    }, 1500);
  }
  onEvent('cursor', (c) => { if (IN_STAGE && !isLeaderFlag) toStageHost(Object.assign({ type: 'cursor' }, c)); });

  /* ── прокрутка страниц без доски (главная, список номеров) ──
     На тренажёрах прокрутку повторяет доска (board_view). На главной доски
     нет, а учитель листает список тренажёров — ученик на сцене листает
     следом */
  let scrollTimer = null;
  window.addEventListener('scroll', () => {
    if (window.__boardBroadcastView || !isLeaderFlag || !code || scrollTimer || !stageViewers()) return;
    scrollTimer = setTimeout(() => {
      scrollTimer = null;
      broadcastEvent('stage_scroll', { x: Math.round(window.scrollX), y: Math.round(window.scrollY) });
    }, 80);
  }, { passive: true });
  onEvent('stage_scroll', (d) => {
    if (!IN_STAGE || isLeaderFlag || !d || window.__boardBroadcastView) return;
    try { window.scrollTo(d.x || 0, d.y || 0); } catch (e) {}
  });

  /* ═══ Промпт №11 нового списка: всё, что учитель открыл, — открыто и у ученика ═══
     Калькуляторы «Сложить/Вычесть/…», их история, история примеров,
     колонка «+», доска, «свернуть подсказки», клавиатура, «свой пример»,
     тема. Это состояние интерфейса, а не задания: тренажёры его в снимок не
     кладут, и у ученика на сцене всё это оставалось закрытым. Учитель
     описывает, что у него открыто (по общим для всех тренажёров кнопкам), а
     ученик на сцене нажимает те же кнопки у себя, пока не совпадёт. Чего на
     странице нет — просто пропускается. Только на сцене: ученику в обычном
     режиме своё открывать и закрывать никто не мешает */
  let mirrorApplying = false;
  function byId(id) { return document.getElementById(id); }
  function shown(el) { return !!el && el.style.display === 'block'; }
  function uiSnapshot() {
    const de = document.documentElement;
    const calcBtn = document.querySelector('.calc-tool-btn[data-op].active');
    const rail = byId('addRail'), kp = byId('keypadFloat');
    return {
      theme: de.getAttribute('data-theme') || 'light',
      board: de.getAttribute('data-board') === 'on',
      focus: de.getAttribute('data-focus') === 'on',
      calc: calcBtn ? calcBtn.dataset.op : '',
      calcHist: shown(byId('calcHistoryPanel')),
      exHist: shown(byId('exampleHistoryPanel')),
      rail: !!(rail && rail.classList.contains('open')),
      custom: shown(byId('customSheet')),
      kp: kp ? kp.style.display === 'block' : null,
    };
  }
  let uiWant = null, lastUiSent = '';
  const uiActedAt = {};
  function uiFromLeader(ui) {
    if (ui && ui.theme && !isLeaderFlag) leaderTheme = ui.theme;
    if (!IN_STAGE || isLeaderFlag || !ui) return;
    uiWant = ui;
    uiReconcile();
  }
  function uiReconcile() {
    if (!uiWant) return;
    const want = uiWant, have = uiSnapshot(), now = Date.now();
    // одна и та же кнопка — не чаще раза в 1,2 с: открытие бывает не
    // мгновенным (калькулятор грузит свой кадр), и без паузы мы бы
    // нажимали «открыть-закрыть» по кругу
    const act = (key, fn) => {
      if (now - (uiActedAt[key] || 0) < 1200) return;
      uiActedAt[key] = now;
      mirrorApplying = true;
      try { fn(); } catch (e) {} finally { mirrorApplying = false; }
    };
    const click = (el) => { if (el) el.click(); };
    if (want.theme && want.theme !== have.theme) applyRemoteTheme(want.theme);
    if (want.board !== have.board) act('board', () => click(byId('boardVisibilityToggle')));
    if (want.focus !== have.focus) act('focus', () => click(byId('focusToggle')));
    if (want.calc !== have.calc) act('calc', () => click(want.calc
      ? document.querySelector('.calc-tool-btn[data-op="' + want.calc + '"]') : byId('calcPanelClose')));
    if (want.calcHist !== have.calcHist) act('calcHist', () => click(byId(want.calcHist ? 'calcHistoryBtn' : 'calcHistoryClose')));
    if (want.exHist !== have.exHist) act('exHist', () => click(byId(want.exHist ? 'exampleHistoryToggle' : 'exampleHistoryClose')));
    if (want.rail !== have.rail) act('rail', () => click(byId('addRailToggle')));
    if (want.custom !== have.custom) act('custom', () => click(byId('customToggle')));
    if (want.kp != null && have.kp != null && want.kp !== have.kp) act('kp', () => click(byId(want.kp ? 'kpToggle' : 'kpClose')));
  }
  onEvent('ui', uiFromLeader);
  setInterval(() => {
    if (isLeaderFlag) {
      if (!code || !channel) return;
      let sig;
      try { sig = JSON.stringify(uiSnapshot()); } catch (e) { return; }
      if (sig === lastUiSent) return;
      lastUiSent = sig;
      broadcastEvent('ui', JSON.parse(sig));
    } else if (IN_STAGE) {
      uiReconcile();   // страница ученика могла закрыть что-то сама (новое задание)
    }
    followerThemeTick();
  }, 300);

  /* ═══ Правка «оформление как у учителя» ═══
     Ученик в сессии менял себе светлую/тёмную тему кнопкой 🌙, у учителя
     ничего не менялось — и они начинали видеть разное: то, что учитель пишет
     тёмными чернилами на светлом листе, у ученика на тёмном листе выглядит
     иначе (цвета «по теме» пересчитываются), и они перестают понимать друг
     друга по цвету. Поэтому у ученика в сессии кнопки темы нет вовсе (и на
     сцене, и в обычном режиме — тему ему всё равно переписывает каждый
     снимок учителя), а тема держится учительская: если её что-то сменило
     (системная тема, старая вкладка), через доли секунды она возвращается.
     Кадр сцены — всегда ученик, ему класс ставим сразу при загрузке, чтобы
     кнопка не мелькнула до первого тика */
  (function () {
    try {
      const st = document.createElement('style');
      st.textContent = 'html.ts-follower #themeToggle{display:none!important;}';
      (document.head || document.documentElement).appendChild(st);
      if (IN_STAGE) document.documentElement.classList.add('ts-follower');
    } catch (e) {}
  })();
  function followerThemeTick() {
    const follower = IN_STAGE || (!isLeaderFlag && !!code);
    try { document.documentElement.classList.toggle('ts-follower', follower); } catch (e) {}
    if (!follower || !leaderTheme) return;
    let have = 'light';
    try { have = document.documentElement.getAttribute('data-theme') || 'light'; } catch (e) {}
    if (have !== leaderTheme) applyRemoteTheme(leaderTheme);
  }

  /* ═══ Промпт №75: список сессий и связь между вкладками ═══
     Список сессий этого компьютера лежит в localStorage (общий для вкладок):
     имя, номер, на какой странице сессия была в последний момент и когда.
     Вкладка обновляет свою строку при каждом переходе, раз в 10 с и уходя,
     поэтому закрытую по ошибке сессию можно открыть там же, где остановились:
     состояние тренажёра подтянется из базы (как при обычной перезагрузке),
     доска — из своего хранилища по #board= в адресе.
     Какие сессии открыты прямо сейчас, вкладки узнают друг у друга через
     BroadcastChannel: «кто здесь?» → «я, код такой-то». Отвечают только
     вкладки, где идёт своя сессия (учитель), и только верхнее окно. */
  // Ключ НЕ «trainerSession:…»: readStoredCode() принял бы его за старый код
  const REG_KEY = 'tsSessions:v1';
  const REG_MAX = 30;
  const REG_TTL_MS = 30 * 24 * 3600 * 1000;
  // номер «Сессия N» — наименьший свободный среди сессий последних 12 часов:
  // каждый учебный день счёт идёт снова с 1, а не растёт до «Сессии 47»
  const REG_NUM_WINDOW_MS = 12 * 3600 * 1000;
  // подборка своя у каждой сессии — ключ тот же, что в basket-core.js
  const BASKET_KEY = 'ogeBasket:v1';
  function basketKey(c) { return BASKET_KEY + ':' + c; }
  function moveBasket(from, to) {
    try {
      const v = localStorage.getItem(basketKey(from));
      if (v === null) return;
      if (localStorage.getItem(basketKey(to)) === null) localStorage.setItem(basketKey(to), v);
      localStorage.removeItem(basketKey(from));
    } catch (e) {}
  }
  function dropBasket(c) { try { localStorage.removeItem(basketKey(c)); } catch (e) {} }

  function regRead() {
    try {
      const v = JSON.parse(localStorage.getItem(REG_KEY) || '[]');
      return Array.isArray(v) ? v.filter(e => e && typeof e.code === 'string') : [];
    } catch (e) { return []; }
  }
  function regWrite(list) {
    const now = Date.now();
    const keep = list.filter(e => now - (e.updatedAt || 0) < REG_TTL_MS)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, REG_MAX);
    // у выпавших из списка сессий подборка больше никому не видна — убираем,
    // чтобы не копить её в localStorage (у него потолок около 5 МБ на сайт)
    const kept = new Set(keep.map(e => e.code));
    list.forEach(e => { if (!kept.has(e.code) && e.code !== code) dropBasket(e.code); });
    try { localStorage.setItem(REG_KEY, JSON.stringify(keep)); } catch (e) {}
  }
  function regGet(c) { return regRead().find(e => e.code === c) || null; }
  function regNextNumber(list) {
    const now = Date.now(), used = new Set();
    list.forEach(e => { if (e.n && now - (e.updatedAt || 0) < REG_NUM_WINDOW_MS) used.add(e.n); });
    openTabCodes().forEach(c => { const e = list.find(x => x.code === c); if (e && e.n) used.add(e.n); });
    let k = 1;
    while (used.has(k)) k++;
    return k;
  }
  function regTouch(c, patch) {
    if (!c) return null;
    const list = regRead(), now = Date.now();
    let e = list.find(x => x.code === c);
    if (!e) { e = { code: c, n: regNextNumber(list), createdAt: now }; list.push(e); }
    Object.assign(e, patch || {}, { updatedAt: now });
    regWrite(list);
    return e;
  }
  function regRename(c, name) {
    const v = String(name || '').replace(/\s+/g, ' ').trim().slice(0, 40);
    regTouch(c, { name: v || null });
    tabsPost({ t: 'renamed', code: c });
    applyTitle();
  }
  function regRemove(c) {
    regWrite(regRead().filter(e => e.code !== c));
    if (c !== code) dropBasket(c);
  }
  function regRecode(from, to) {
    const list = regRead(), e = list.find(x => x.code === from);
    if (!e) return;
    e.code = to; e.updatedAt = Date.now();
    regWrite(list);
  }
  function sessionLabel(e) { return (e && e.name) || ('Сессия ' + ((e && e.n) || 1)); }

  // адрес, куда вернуть переоткрытую сессию: без кода (?s= — признак
  // ученика) и без наших меток новой вкладки
  function currentUrl() {
    try {
      const u = new URL(location.href);
      ['s', 'tsnew', 'tsresume'].forEach(k => u.searchParams.delete(k));
      return u.toString();
    } catch (e) { return location.href; }
  }

  const PAGE_ID = generateCode(10);
  function tabGroup() { return ssGet(TAB_GROUP_KEY) || ''; }
  let tabsBC = null;
  try { if (window.BroadcastChannel) tabsBC = new BroadcastChannel('ts-tabs'); } catch (e) { tabsBC = null; }
  function tabsPost(m) {
    if (!tabsBC) return;
    try { tabsBC.postMessage(Object.assign({ from: PAGE_ID }, m)); } catch (e) {}
  }
  // своя сессия идёт в этой вкладке — только такие отвечают «я здесь»
  function amTabHolder() { return !!code && isLeaderFlag && !IN_ANY_FRAME; }
  const TAB_TTL_MS = 45000;
  const knownTabs = new Map();      // номер страницы -> { code, group, at }
  const pongWaiters = new Set();
  function noteTab(from, c, group) {
    const prev = knownTabs.get(from);
    knownTabs.set(from, { code: c, group: group || '', at: Date.now() });
    if (!prev || prev.code !== c) tabsChanged();
  }
  function openTabCodes() {
    const now = Date.now(), out = new Set();
    knownTabs.forEach((t, id) => { if (now - t.at < TAB_TTL_MS) out.add(t.code); else knownTabs.delete(id); });
    return out;
  }
  function openTabInfo(c) {
    const now = Date.now();
    let found = null;
    knownTabs.forEach((t) => { if (t.code === c && now - t.at < TAB_TTL_MS) found = t; });
    return found;
  }
  function tabsChanged() { applyTitle(); renderSessionsSoon(); }
  if (tabsBC) tabsBC.onmessage = (ev) => {
    const m = ev.data;
    if (!m || !m.from || m.from === PAGE_ID) return;
    if (m.t === 'ping' || m.t === 'hello') {
      if (m.code) noteTab(m.from, m.code, m.group);
      if (amTabHolder()) tabsPost({ t: 'pong', to: m.from, code: code, group: tabGroup() });
    } else if (m.t === 'pong') {
      if (m.code) noteTab(m.from, m.code, m.group);
      if (m.to === PAGE_ID) pongWaiters.forEach(fn => { try { fn(m); } catch (e) {} });
    } else if (m.t === 'bye') {
      if (knownTabs.delete(m.from)) tabsChanged();
    } else if (m.t === 'renamed') {
      tabsChanged();
    } else if (m.t === 'flash') {
      if (amTabHolder() && m.code === code) flashTitle();
    }
  };
  // спросить вкладки «кто здесь?» и собрать ответы за ms миллисекунд.
  // Ответ приходит за единицы миллисекунд — окно берём с запасом на фоновые
  function askTabs(ms) {
    return new Promise((resolve) => {
      if (!tabsBC) { resolve([]); return; }
      const got = [];
      const fn = (m) => got.push(m);
      pongWaiters.add(fn);
      tabsPost({ t: 'ping', code: amTabHolder() ? code : null, group: tabGroup() });
      setTimeout(() => { pongWaiters.delete(fn); resolve(got); }, ms);
    });
  }
  async function heldByOtherTab(c) {
    const got = await askTabs(150);
    return got.some(m => m.code === c);
  }
  // прошлая страница ЭТОЙ вкладки ушла только что — это переход по сайту или
  // перезагрузка, а не дубль. Метку ставит pagehide, читаем один раз при загрузке
  const CAME_FROM_SAME_TAB = (() => {
    const t = +ssGet(TAB_LEFT_KEY) || 0;
    ssDel(TAB_LEFT_KEY);
    return t > 0 && Date.now() - t < 15000;
  })();
  function cameFromSameTab() { return CAME_FROM_SAME_TAB; }
  // дубль вкладки: браузер скопировал ему номер участника и «семью» — номер
  // нужен свой (иначе собеседники примут его сообщения за свои), а в семью
  // открывшей вкладки дубль не входит (у него нет opener)
  function freshTabIdentity() {
    ssDel('tsClientId');
    CLIENT_ID = myClientId();
    if (!window.opener) ssSet(TAB_GROUP_KEY, generateCode(10));
  }

  function onLeaderActivated(c) {
    if (IN_ANY_FRAME) return;
    // имя окна — по нему другая вкладка переключается сюда (window.open('', имя)).
    // window.name переживает переходы по страницам сайта внутри вкладки
    try { window.name = 'tsSess:' + c; } catch (e) {}
    regTouch(c, { url: currentUrl(), title: baseTitle() });
    tabsPost({ t: 'hello', code: c, group: tabGroup() });
    applyTitle();
    renderSessionsSoon();
  }
  // строку списка держим свежей: страница (в т.ч. #board= на досках), заголовок,
  // были ли ученики. Пишем, только если что-то поменялось, или раз в минуту —
  // по времени последней записи считается «закрыта N минут назад»
  function regUpkeep(force) {
    if (!amTabHolder()) return;
    const e = regGet(code);
    const patch = { url: currentUrl(), title: baseTitle() };
    if (studentsOnline() > 0) patch.students = true;
    const changed = !e || e.url !== patch.url || e.title !== patch.title || (patch.students && !e.students);
    if (force || changed || Date.now() - (e.updatedAt || 0) > 60000) regTouch(code, patch);
  }
  setInterval(() => {
    regUpkeep(false);
    if (amTabHolder()) tabsPost({ t: 'ping', code: code, group: tabGroup() });
  }, 10000);
  window.addEventListener('hashchange', () => regUpkeep(false));
  window.addEventListener('popstate', () => regUpkeep(false));
  window.addEventListener('pagehide', () => {
    ssSet(TAB_LEFT_KEY, String(Date.now()));
    if (!amTabHolder()) return;
    regUpkeep(true);
    tabsPost({ t: 'bye' });
  });
  // другая вкладка переименовала сессию или открыла/закрыла свою
  window.addEventListener('storage', (e) => { if (e.key === REG_KEY) tabsChanged(); });

  /* ── заголовок вкладки: «Ваня · ОГЭ №8» ──
     Имя показываем, когда открыто больше одной сессии (или сессию
     переименовали) — иначе у учителя с одним учеником в каждой вкладке
     висело бы лишнее «Сессия 1 ·». Страница может менять свой заголовок
     сама (номер задания) — следим за этим и держим приставку */
  let titleBaseVal = null, titleApplied = null, titleObserved = null, flashTimer = null;
  function baseTitle() {
    if (titleBaseVal === null || document.title !== titleApplied) titleBaseVal = document.title;
    return titleBaseVal;
  }
  function titlePrefix() {
    if (!amTabHolder()) return '';
    const e = regGet(code);
    if (!e) return '';
    const others = Array.from(openTabCodes()).filter(c => c !== code).length;
    return (others || e.name) ? sessionLabel(e) + ' · ' : '';
  }
  function watchTitle() {
    const el = document.querySelector('head > title');
    if (!el || el === titleObserved || !window.MutationObserver) return;
    titleObserved = el;
    try { new MutationObserver(() => applyTitle()).observe(el, { childList: true, characterData: true, subtree: true }); } catch (e) {}
  }
  function applyTitle() {
    if (IN_ANY_FRAME) return;
    const base = baseTitle();
    if (flashTimer) return;
    const want = titlePrefix() + base;
    if (document.title !== want) document.title = want;
    titleApplied = document.title; // браузер мог нормализовать пробелы — берём как есть
    watchTitle();
  }
  // «вот эта вкладка»: заголовок мигает, пока на неё не переключатся
  // (или ~15 с). Сама вкладка вывести себя на передний план не может —
  // браузер не даёт сайтам перехватывать фокус
  function flashTitle() {
    if (IN_ANY_FRAME) return;
    stopFlash();
    const base = baseTitle();
    const label = '● ' + sessionLabel(regGet(code)) + ' — сюда';
    let on = false, ticks = 0;
    flashTimer = setInterval(() => {
      ticks++;
      if ((document.visibilityState === 'visible' && document.hasFocus()) || ticks > 25) { stopFlash(); return; }
      on = !on;
      document.title = on ? label : titlePrefix() + base;
      titleApplied = document.title;
    }, 600);
  }
  function stopFlash() {
    if (!flashTimer) return;
    clearInterval(flashTimer);
    flashTimer = null;
    titleApplied = document.title; // мигание — не смена заголовка страницей
    applyTitle();
  }

  // переход к сессии из списка: открытая — переключиться на её вкладку,
  // закрытая — открыть там, где остановились
  function goToSession(c) {
    const e = regGet(c);
    if (!e || c === code) return;
    const info = openTabInfo(c);
    if (info) {
      // Браузер переключает на вкладку по имени окна, только если она из
      // той же «семьи» (открыта нашими кнопками из этой или из общей
      // предшественницы) и только по нажатию человека — поэтому без await
      // до window.open. Чужую вкладку он не найдёт и вместо неё откроет
      // пустую — такую сразу закрываем и просим ту вкладку помигать
      if (info.group && info.group === tabGroup()) {
        let w = null;
        try { w = window.open('', 'tsSess:' + c); } catch (err) { w = null; }
        let ours = false;
        try { ours = !!w && w.location.origin === location.origin && w.location.href !== 'about:blank'; } catch (err) { ours = false; }
        if (ours) {
          try { w.focus(); } catch (err) {}
          window.__tsSwitchResult = 'focused';
          return;
        }
        if (w) { try { w.close(); } catch (err) {} }
      }
      tabsPost({ t: 'flash', code: c });
      window.__tsSwitchResult = 'flash';
      sessionsMsg('«' + sessionLabel(e) + '» открыта в другой вкладке — её заголовок мигает.');
      return;
    }
    let u;
    try { u = new URL(e.url || 'index.html', location.href); } catch (err) { u = new URL('index.html', location.href); }
    if (u.origin !== location.origin) u = new URL('index.html', location.href);
    u.searchParams.delete('s');
    u.searchParams.set('tsresume', c);
    const w = window.open(u.toString(), 'tsSess:' + c);
    window.__tsSwitchResult = w ? 'reopened' : 'blocked';
    if (!w) sessionsMsg('Браузер не дал открыть вкладку — разрешите всплывающие окна для этого сайта.');
  }
  function openNewSessionTab() {
    const c = generateCode();
    // номер даём здесь, а не в новой вкладке: так «Сессия N» не совпадёт с
    // соседней, даже если две вкладки откроют быстро одну за другой
    regTouch(c, { explicit: true, url: new URL('index.html', location.href).toString(), title: '' });
    const u = new URL('index.html', location.href);
    u.searchParams.set('tsnew', c);
    const w = window.open(u.toString(), 'tsSess:' + c);
    if (!w) {
      regRemove(c);
      sessionsMsg('Браузер не дал открыть вкладку — разрешите всплывающие окна для этого сайта.');
    }
    return w ? c : null;
  }
  // вкладке, открытой кнопкой «Новая сессия», сразу показываем код и ссылку
  let wantPanelOpen = false;
  function maybeOpenPanel() {
    if (!wantPanelOpen || !uiEls) return;
    wantPanelOpen = false;
    uiEls.pop.classList.add('open');
    renderPanel();
    refreshPresence();
  }

  // ── сессии в панели ──
  function agoText(ts) {
    const m = Math.round((Date.now() - (ts || 0)) / 60000);
    if (m < 1) return 'только что';
    if (m < 60) return m + ' мин назад';
    const h = Math.round(m / 60);
    if (h < 24) return h + ' ч назад';
    const d = Math.round(h / 24);
    return d === 1 ? 'вчера' : d + ' дн назад';
  }
  function sessionsMsg(text) {
    if (!uiEls || !uiEls.sessMsg) return;
    uiEls.sessMsg.textContent = text || '';
    uiEls.sessMsg.style.display = text ? '' : 'none';
  }
  // полный опрос: кто не ответил — тот закрыт. Без этого вкладка, закрытая
  // без прощания (браузер не всегда успевает его отправить), ещё 45 с
  // числилась бы открытой, и «Открыть» было бы не нажать
  function refreshPresence() {
    const started = Date.now();
    askTabs(250).then(() => {
      knownTabs.forEach((t, id) => { if (t.at < started) knownTabs.delete(id); });
      renderSessionsSoon();
      applyTitle();
    });
  }
  let sessRenderTimer = null;
  function renderSessionsSoon() {
    if (sessRenderTimer) return;
    sessRenderTimer = setTimeout(() => { sessRenderTimer = null; renderSessions(); }, 30);
  }
  function renderSessions() {
    if (!uiEls || !uiEls.sessSection) return;
    const show = amTabHolder();
    uiEls.sessSection.style.display = show ? '' : 'none';
    uiEls.sessSep.style.display = show ? '' : 'none';
    if (!show) return;
    // идёт переименование — не перерисовываем, иначе поле пропадёт из-под пальцев
    if (uiEls.sessList.querySelector('input')) return;
    const open = openTabCodes();
    open.add(code);
    const list = regRead();
    if (!list.some(e => e.code === code)) list.push(regTouch(code, { url: currentUrl(), title: baseTitle() }));
    const isOpen = (e) => open.has(e.code);
    // открытые — в постоянном порядке (по номеру), чтобы «Ваня, Петя, Коля»
    // не прыгали; закрытые — свежие сверху. Случайные вкладки без учеников,
    // без имени и не через кнопку, закрывшись, в списке не нужны
    const openRows = list.filter(isOpen).sort((a, b) => (a.n || 0) - (b.n || 0) || (a.createdAt || 0) - (b.createdAt || 0));
    const closedRows = list.filter(e => !isOpen(e) && (e.students || e.name || e.explicit))
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 6);
    const box = uiEls.sessList;
    box.textContent = '';
    openRows.concat(closedRows).forEach((e) => {
      const here = e.code === code, on = isOpen(e);
      const row = document.createElement('div');
      row.className = 'ts-sess-row' + (here ? ' here' : '');
      row.dataset.code = e.code;
      const dot = document.createElement('span');
      dot.className = 'ts-sess-dot' + (on ? ' on' : '');
      const main = document.createElement('div');
      main.className = 'ts-sess-main';
      const name = document.createElement('button');
      name.type = 'button';
      name.className = 'ts-sess-name';
      name.textContent = sessionLabel(e);
      name.title = 'Нажмите, чтобы переименовать';
      name.addEventListener('click', (ev) => { ev.stopPropagation(); startRename(row, e); });
      const sub = document.createElement('div');
      sub.className = 'ts-sess-sub';
      const where = (e.title || '').trim();
      sub.textContent = (here ? 'эта вкладка' : on ? 'открыта' : 'закрыта · ' + agoText(e.updatedAt)) + (where ? ' · ' + where : '');
      sub.title = sub.textContent;
      main.appendChild(name); main.appendChild(sub);
      row.appendChild(dot); row.appendChild(main);
      if (!here) {
        const go = document.createElement('button');
        go.type = 'button';
        go.className = 'ts-sess-go';
        go.textContent = on ? 'Перейти' : 'Открыть';
        go.title = on ? 'Переключиться на вкладку этой сессии' : 'Открыть сессию там, где остановились';
        go.addEventListener('click', (ev) => { ev.stopPropagation(); goToSession(e.code); });
        row.appendChild(go);
      }
      if (!on) {
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'ts-sess-del';
        del.textContent = '×';
        del.title = 'Убрать из списка';
        del.addEventListener('click', (ev) => { ev.stopPropagation(); regRemove(e.code); renderSessions(); });
        row.appendChild(del);
      }
      box.appendChild(row);
    });
  }
  function startRename(row, e) {
    const btn = row.querySelector('.ts-sess-name');
    if (!btn) return;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'ts-sess-input';
    input.maxLength = 40;
    input.value = sessionLabel(e);
    input.placeholder = 'Сессия ' + (e.n || 1);
    btn.replaceWith(input);
    input.focus();
    input.select();
    let done = false;
    const finish = (save) => {
      if (done) return;
      done = true;
      // по умолчанию имя «Сессия N» не сохраняем как своё: оставили как
      // было — значит, не переименовывали
      if (save) {
        const v = input.value.trim();
        regRename(e.code, v && v !== 'Сессия ' + (e.n || 1) ? v : '');
      }
      input.remove();
      renderSessions();
    };
    input.addEventListener('keydown', (ev) => {
      ev.stopPropagation(); // горячие клавиши доски и тренажёра здесь не нужны
      if (ev.key === 'Enter') { ev.preventDefault(); finish(true); }
      else if (ev.key === 'Escape') { ev.preventDefault(); finish(false); }
    });
    input.addEventListener('blur', () => finish(true));
    input.addEventListener('click', (ev) => ev.stopPropagation());
  }

  // ── стандартная плавающая кнопка + панель (одинаковая на всех тренажёрах) ──
  let uiEls = null;
  function notifyUi() { if (uiEls) renderPanel(); }
  function renderPanel() {
    if (!uiEls) return;
    uiEls.codeEl.textContent = code || '—';
    uiEls.linkEl.value = code ? getShareUrl() : '';
    uiEls.roleEl.textContent = isLeaderFlag
      ? 'Вы — главный (Учитель): к вашему заданию подключаются присоединившиеся.'
      : 'Вы подключены к чужой сессии — задания синхронизируются с главным.';

    // Промпт №31: реальное состояние связи. Раньше при обрыве панель
    // выглядела совершенно обычно — код на месте, и понять, что ничего уже
    // не синхронизируется, было невозможно до тех пор, пока не заметишь,
    // что собеседник не видит написанного.
    if (uiEls.connEl) {
      const label = connState === CONN.ONLINE ? 'На связи'
        : connState === CONN.RECONNECTING ? 'Связь потеряна — восстанавливаю…'
        : 'Нет связи — пробую переподключиться';
      uiEls.connEl.textContent = label;
      uiEls.connEl.className = 'ts-conn ts-conn-' + connState;
    }
    // Промпт №11 нового списка: кто на связи
    if (uiEls.peersEl) {
      let txt = '';
      if (code && connState === CONN.ONLINE) {
        if (isLeaderFlag) {
          const n = studentsOnline();
          txt = n ? 'Учеников на связи: ' + n : 'Учеников пока нет — отправьте ссылку';
        } else {
          txt = teacherSilent() ? '⚠ Учитель не на связи — ждём, пока он вернётся' : 'Учитель на связи';
        }
      }
      uiEls.peersEl.textContent = txt;
      uiEls.peersEl.style.display = txt ? '' : 'none';
    }
    if (uiEls.btn) {
      const n = isLeaderFlag && code ? studentsOnline() : 0;
      uiEls.btn.classList.toggle('ts-has-peers', n > 0 && connState === CONN.ONLINE);
      if (uiEls.badge) uiEls.badge.textContent = String(n);
      uiEls.btn.classList.toggle('ts-teacher-silent', teacherSilent());
      uiEls.btn.classList.toggle('ts-offline', connState !== CONN.ONLINE);
      uiEls.btn.title = connState === CONN.ONLINE
        ? 'Совместный доступ' : 'Совместный доступ — связь восстанавливается';
    }
    // Промпт №30: если поле подключения сейчас пустое (например, панель
    // только что открыли, или подключение отвалилось после перезагрузки) —
    // подставляем туда последний использованный код, чтобы «подключиться
    // заново» было одним кликом, а не набором кода по памяти
    try { if (!uiEls.joinInput.value) uiEls.joinInput.value = readLastJoinCode(); } catch (e) {}

    // права ученика редактирует только «главный» — присоединившийся видит
    // только сам факт (через применённые ограничения в интерфейсе тренажёра),
    // а не эту панель управления
    const showPerm = isLeaderFlag;
    uiEls.permSep.style.display = showPerm ? '' : 'none';
    uiEls.permSection.style.display = showPerm ? '' : 'none';
    if (showPerm) {
      const perms = getPermissions();
      uiEls.permList.querySelectorAll('input[data-perm]').forEach(input => {
        input.checked = perms[input.dataset.perm] !== false;
      });
    }

    uiEls.autosaveToggle.checked = getAutosaveHistory();

    // Промпт №11 нового списка: переключатель сцены — только у ученика и только в окне
    // платформы или в самой сцене (не в карточке «+» и не в задании на доске)
    const stageSwitchable = !isLeaderFlag && !!code && (IN_STAGE || !IN_ANY_FRAME);
    uiEls.stageToggle.style.display = stageSwitchable ? '' : 'none';
    uiEls.stageToggle.textContent = IN_STAGE ? 'Обычный режим (своя вёрстка)' : 'Смотреть экран учителя целиком';

    const count = historyUI && historyUI.getCount ? historyUI.getCount() : 0;
    uiEls.historyCountEl.textContent = count > 0 ? `История: ${count} ` + pluralSnapshots(count) : 'История: пока пусто';
    uiEls.historyDownloadBtn.disabled = count === 0;
    renderSessions();
  }
  function pluralSnapshots(n) {
    const n10 = n % 10, n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return 'снимок';
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return 'снимка';
    return 'снимков';
  }
  function mountShareButton() {
    if (uiEls) return;
    const style = document.createElement('style');
    style.textContent = `
      .ts-share-btn{position:fixed;top:16px;right:64px;width:40px;height:40px;border-radius:14px;
        border:1px solid var(--glass-border);background:var(--glass-strong);
        backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);
        color:var(--ink);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;
        box-shadow:inset 0 1px 0 var(--glass-inset), var(--shadow);z-index:200;transition:transform .15s;}
      .ts-share-btn:active{transform:scale(.92)}
      /* Промпт №31: обрыв связи виден прямо на кнопке — не нужно открывать
         панель, чтобы заметить, что синхронизация встала */
      .ts-share-btn.ts-offline{border-color:#e0a03a;color:#e0a03a;}
      /* Промпт №11 нового списка: сколько учеников на связи — прямо на кнопке */
      .ts-peers-badge{position:absolute;bottom:-5px;right:-5px;min-width:16px;height:16px;padding:0 4px;
        border-radius:8px;background:#2e9e5b;color:#fff;font-size:10.5px;font-weight:700;line-height:16px;
        text-align:center;box-shadow:0 0 0 2px var(--glass-strong);display:none;box-sizing:border-box;}
      .ts-share-btn.ts-has-peers .ts-peers-badge{display:block;}
      .ts-share-btn.ts-teacher-silent{border-color:#d9534f;color:#d9534f;}
      .ts-share-btn.ts-offline::after{content:'';position:absolute;top:-2px;right:-2px;
        width:10px;height:10px;border-radius:50%;background:#e0a03a;
        box-shadow:0 0 0 2px var(--glass-strong);animation:tsPulse 1.2s ease-in-out infinite;}
      @keyframes tsPulse{0%,100%{opacity:1}50%{opacity:.35}}
      .ts-conn{font-family:var(--font-ui,inherit);font-size:12px;font-weight:600;
        padding:6px 10px;border-radius:10px;margin-bottom:8px;display:flex;align-items:center;gap:6px;}
      .ts-conn::before{content:'';width:8px;height:8px;border-radius:50%;background:currentColor;flex:0 0 auto;}
      .ts-conn-online{color:#2e9e5b;background:rgba(46,158,91,.10);}
      .ts-conn-reconnecting{color:#e0a03a;background:rgba(224,160,58,.12);}
      .ts-conn-offline{color:#d9534f;background:rgba(217,83,79,.12);}
      .ts-share-pop{position:fixed;top:60px;right:16px;z-index:400;background:var(--glass-strong);
        backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);
        border:1px solid var(--glass-border);border-radius:16px;box-shadow:var(--shadow);
        padding:16px;width:290px;display:none;flex-direction:column;gap:10px;
        max-height:calc(100vh - 76px);overflow-y:auto;box-sizing:border-box;}
      /* Промпт №75: список сессий этого компьютера */
      .ts-sess-head{display:flex;align-items:center;justify-content:space-between;gap:8px;}
      .ts-sess-new{font-size:12px;font-weight:600;padding:6px 10px;border-radius:9px;border:none;
        background:var(--ink);color:#fff;cursor:pointer;white-space:nowrap;}
      .ts-sess-new:hover{background:var(--ink-active);}
      .ts-sess-list{display:flex;flex-direction:column;gap:4px;margin-top:6px;}
      .ts-sess-row{display:flex;align-items:center;gap:7px;padding:5px 6px;border-radius:9px;min-height:34px;}
      .ts-sess-row.here{background:var(--glass);box-shadow:inset 0 0 0 1px var(--glass-border);}
      .ts-sess-dot{width:8px;height:8px;border-radius:50%;flex:0 0 auto;background:rgba(128,128,128,.45);}
      .ts-sess-dot.on{background:#2e9e5b;}
      .ts-sess-main{flex:1;min-width:0;display:flex;flex-direction:column;}
      .ts-sess-name{font:inherit;font-size:12.5px;font-weight:600;color:var(--pencil);background:none;border:none;
        padding:0;text-align:left;cursor:text;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;}
      .ts-sess-name:hover{text-decoration:underline dotted;}
      .ts-sess-input{font:inherit;font-size:12.5px;font-weight:600;color:var(--pencil);padding:2px 5px;margin:-3px 0;
        border-radius:6px;border:1px solid var(--ink);background:var(--glass);outline:none;width:100%;box-sizing:border-box;}
      .ts-sess-sub{font-size:11px;color:var(--muted-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .ts-sess-go{font-size:11.5px;font-weight:600;padding:5px 8px;border-radius:8px;border:1px solid var(--glass-border);
        background:var(--glass-strong);color:var(--pencil);cursor:pointer;white-space:nowrap;flex:0 0 auto;}
      .ts-sess-go:hover{border-color:var(--ink);}
      .ts-sess-del{font-size:15px;line-height:1;padding:2px 4px;border:none;background:none;color:var(--muted-2);
        cursor:pointer;flex:0 0 auto;}
      .ts-sess-del:hover{color:var(--teacher);}
      .ts-share-pop.open{display:flex;}
      .ts-share-title{font-size:13px;font-weight:700;color:var(--pencil);}
      .ts-share-hint{font-size:12px;line-height:1.45;color:var(--muted-2);}
      .ts-share-code{font-size:20px;font-weight:700;letter-spacing:.06em;color:var(--pencil);text-align:center;
        padding:8px;border-radius:10px;background:var(--glass);border:1px solid var(--glass-border);}
      .ts-share-row{display:flex;gap:6px;}
      .ts-share-row input{flex:1;font-size:12.5px;padding:8px 9px;border-radius:9px;border:1px solid var(--glass-border);
        background:var(--glass);color:var(--pencil);outline:none;min-width:0;}
      .ts-share-row button{font-size:12px;font-weight:600;padding:8px 10px;border-radius:9px;border:none;
        background:var(--ink);color:#fff;cursor:pointer;white-space:nowrap;}
      .ts-share-row button:hover{background:var(--ink-active);}
      .ts-share-sep{border-top:1px solid var(--glass-border);margin:2px 0;}
      .ts-share-reset{font-size:12px;background:none;border:none;color:var(--teacher);cursor:pointer;
        text-decoration:underline;padding:0;align-self:flex-start;}
      .ts-share-msg{font-size:11.5px;color:var(--muted-2);min-height:14px;}
      .ts-share-msg.err{color:var(--teacher);}
      .ts-section-title{font-size:12px;font-weight:700;color:var(--pencil);}
      .ts-perm-list{display:flex;flex-direction:column;gap:8px;}
      .ts-perm-row{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12.5px;color:var(--pencil);}
      .ts-perm-row span{line-height:1.3;}
      .ts-switch{position:relative;display:inline-block;width:36px;height:21px;flex:0 0 auto;}
      .ts-switch input{opacity:0;width:0;height:0;position:absolute;}
      .ts-switch .slider{position:absolute;inset:0;background:var(--glass-border);transition:background .15s;border-radius:20px;cursor:pointer;}
      .ts-switch .slider:before{position:absolute;content:"";height:17px;width:17px;left:2px;top:2px;background:#fff;transition:transform .15s;border-radius:50%;box-shadow:0 1px 2px rgba(0,0,0,.3);}
      .ts-switch input:checked + .slider{background:var(--ink);}
      .ts-switch input:checked + .slider:before{transform:translateX(15px);}
      .ts-history-row button{font-size:12px;font-weight:600;padding:6px 10px;border-radius:9px;border:none;
        background:var(--ink);color:#fff;cursor:pointer;white-space:nowrap;}
      .ts-history-row button:disabled{opacity:.45;cursor:default;}
      .ts-history-row button:not(:disabled):hover{background:var(--ink-active);}
    `;
    document.head.appendChild(style);

    const btn = document.createElement('button');
    btn.className = 'ts-share-btn';
    btn.title = 'Совместный доступ';
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.6"/><circle cx="17" cy="6" r="2.4" stroke="currentColor" stroke-width="1.6"/><circle cx="17" cy="18" r="2.4" stroke="currentColor" stroke-width="1.6"/><path d="M10.6 9.4L15 6.9M10.6 12.6L15 17.1M3 19c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
    const badge = document.createElement('span');
    badge.className = 'ts-peers-badge';
    btn.appendChild(badge);
    document.body.appendChild(btn);

    const pop = document.createElement('div');
    pop.className = 'ts-share-pop';
    pop.innerHTML = `
      <div class="ts-share-title">Совместный доступ</div>
      <div id="tsSessSection" style="display:none">
        <div class="ts-sess-head">
          <span class="ts-section-title">Сессии</span>
          <button class="ts-sess-new" id="tsNewSess" title="Отдельная сессия со своим кодом — в новой вкладке">＋ Новая сессия</button>
        </div>
        <div class="ts-sess-list" id="tsSessList"></div>
        <div class="ts-share-hint" id="tsSessMsg" style="display:none;margin-top:6px"></div>
      </div>
      <div class="ts-share-sep" id="tsSessSep" style="display:none"></div>
      <div class="ts-share-hint">Поделитесь кодом или ссылкой — тот, кто откроет её, увидит те же задания и ввод, что и вы, в реальном времени.</div>
      <div class="ts-share-hint" id="tsRole" style="font-weight:600;"></div>
      <div class="ts-conn ts-conn-reconnecting" id="tsConn">На связи</div>
      <div class="ts-share-hint" id="tsPeers" style="margin-top:-4px"></div>
      <div class="ts-share-code" id="tsCode">—</div>
      <div class="ts-share-row">
        <input id="tsLink" type="text" readonly>
        <button id="tsCopy">Копировать</button>
      </div>
      <button class="ts-share-reset" id="tsReset" title="Ученики по старой ссылке отключатся; имя сессии и подборка останутся">Сменить код этой сессии</button>
      <div class="ts-share-sep"></div>
      <div class="ts-share-hint">Есть код от другого человека?</div>
      <div class="ts-share-row">
        <input id="tsJoinInput" type="text" placeholder="код сессии">
        <button id="tsJoin">Подключиться</button>
      </div>
      <div class="ts-share-msg" id="tsMsg"></div>
      <button class="ts-share-reset" id="tsStageToggle" style="display:none"></button>
      <div class="ts-share-sep" id="tsPermSep" style="display:none"></div>
      <div id="tsPermSection" style="display:none">
        <div class="ts-section-title">Права ученика</div>
        <div class="ts-perm-list" id="tsPermList"></div>
      </div>
      <div class="ts-share-sep"></div>
      <div class="ts-perm-row">
        <span>Сохранять обновлённые задания в историю</span>
        <label class="ts-switch"><input type="checkbox" id="tsAutosaveToggle"><span class="slider"></span></label>
      </div>
      <div class="ts-perm-row ts-history-row">
        <span id="tsHistoryCount">История: 0 снимков</span>
        <button id="tsHistoryDownload" disabled>Скачать PDF</button>
      </div>
    `;
    document.body.appendChild(pop);

    uiEls = {
      btn, pop, badge,
      codeEl: pop.querySelector('#tsCode'),
      linkEl: pop.querySelector('#tsLink'),
      msgEl: pop.querySelector('#tsMsg'),
      joinInput: pop.querySelector('#tsJoinInput'),
      roleEl: pop.querySelector('#tsRole'),
      connEl: pop.querySelector('#tsConn'),
      permSep: pop.querySelector('#tsPermSep'),
      permSection: pop.querySelector('#tsPermSection'),
      permList: pop.querySelector('#tsPermList'),
      autosaveToggle: pop.querySelector('#tsAutosaveToggle'),
      historyCountEl: pop.querySelector('#tsHistoryCount'),
      historyDownloadBtn: pop.querySelector('#tsHistoryDownload'),
      stageToggle: pop.querySelector('#tsStageToggle'),
      peersEl: pop.querySelector('#tsPeers'),
      sessSection: pop.querySelector('#tsSessSection'),
      sessSep: pop.querySelector('#tsSessSep'),
      sessList: pop.querySelector('#tsSessList'),
      sessMsg: pop.querySelector('#tsSessMsg'),
    };
    pop.querySelector('#tsNewSess').addEventListener('click', (e) => {
      e.stopPropagation();
      sessionsMsg('');
      openNewSessionTab();
      renderSessions();
    });

    // Промпт №25: «Переключать задание/тип» здесь больше не показываем —
    // выход из текущего типа заданий (и переключение на другой) теперь
    // ВСЕГДА только у учителя, без исключений (см. studentRestricted() в
    // тренажёре) — переключатель для этого действия был бы просто нерабочим
    const PERMISSION_LABELS = [
      ['refreshOne', 'Обновлять один пример'],
      ['refreshAll', 'Обновлять все задания разом'],
      ['showSolution', 'Открывать решение и ответ'],
      ['deleteTask', 'Удалять пример'],
      ['board', 'Доступ к доске'],
    ];
    PERMISSION_LABELS.forEach(([key, label]) => {
      const row = document.createElement('div');
      row.className = 'ts-perm-row';
      row.innerHTML = `<span>${label}</span><label class="ts-switch"><input type="checkbox" data-perm="${key}"><span class="slider"></span></label>`;
      const input = row.querySelector('input');
      input.addEventListener('change', () => setPermission(key, input.checked));
      uiEls.permList.appendChild(row);
    });

    uiEls.autosaveToggle.addEventListener('change', () => {
      setAutosaveHistory(uiEls.autosaveToggle.checked);
    });
    uiEls.historyDownloadBtn.addEventListener('click', () => {
      if (historyUI && historyUI.onDownload) historyUI.onDownload();
    });
    onPermissionsChange(() => renderPanel());
    onAutosaveHistoryChange(() => renderPanel());

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      pop.classList.toggle('open');
      if (pop.classList.contains('open')) {
        // Промпт №31: не показываем прошлую ошибку подключения при новом
        // открытии панели — иначе «Сессия не найдена» висит и после того,
        // как подключение давно прошло успешно
        if (uiEls && uiEls.msgEl && uiEls.msgEl.classList.contains('err')) {
          uiEls.msgEl.textContent = '';
          uiEls.msgEl.classList.remove('err');
        }
        sessionsMsg('');
        renderPanel();
        refreshPresence(); // какие сессии открыты — спрашиваем вкладки заново
      }
    });
    // пока панель открыта, список «открыта/закрыта» держим живым: соседнюю
    // вкладку могли закрыть или открыть прямо сейчас
    setInterval(() => { if (pop.classList.contains('open')) refreshPresence(); }, 2000);
    document.addEventListener('click', (e) => {
      const path = e.composedPath ? e.composedPath() : [];
      if (!path.includes(pop) && e.target !== btn && !btn.contains(e.target)) pop.classList.remove('open');
    });
    pop.querySelector('#tsCopy').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(uiEls.linkEl.value); uiEls.msgEl.textContent = 'Ссылка скопирована.'; uiEls.msgEl.classList.remove('err'); }
      catch (e) { uiEls.linkEl.select(); uiEls.msgEl.textContent = 'Скопируйте вручную (Ctrl+C).'; }
    });
    // Промпт №11 нового списка: ученик сам переключается между экраном учителя (сцена) и
    // своей обычной вёрсткой — например, на телефоне в вертикальном положении
    uiEls.stageToggle.addEventListener('click', () => {
      if (isLeaderFlag || !code) return;
      if (IN_STAGE) { setStagePref(false); toStageHost({ type: 'exit' }); }
      else { setStagePref(true); enterStage(code); }
    });
    pop.querySelector('#tsReset').addEventListener('click', async () => {
      await resetSession();
      uiEls.msgEl.textContent = 'Код сменился — отправьте ученику новую ссылку.'; uiEls.msgEl.classList.remove('err');
    });
    pop.querySelector('#tsJoin').addEventListener('click', async () => {
      const val = uiEls.joinInput.value;
      uiEls.msgEl.textContent = 'Подключаемся…'; uiEls.msgEl.classList.remove('err');
      const res = await joinByCode(val);
      if (res.ok) { uiEls.joinInput.value = ''; uiEls.msgEl.textContent = 'Подключено.'; uiEls.msgEl.classList.remove('err'); }
      else { uiEls.msgEl.textContent = 'Сессия с таким кодом не найдена.'; uiEls.msgEl.classList.add('err'); }
    });
    renderPanel();
    maybeOpenPanel();
  }

  window.TrainerSession = {
    init, push, registerField, unregisterField, unregisterFieldsWithPrefix,
    getCode, getShareUrl, resetSession, joinByCode, mountShareButton,
    broadcastEvent, onEvent, isLeader, navigateTo,
    guardStudentAction, studentRestricted, flashRestrictedHint,
    getConnState,
    getPermissions, setPermission, onPermissionsChange,
    getAutosaveHistory, setAutosaveHistory, onAutosaveHistoryChange,
    registerHistoryUI, notifyHistoryChanged,
    isStageFrame: () => IN_STAGE, stageFocus,
    // есть ли кому показывать (board-stage.js шлёт доску, только если есть)
    hasViewers: () => studentsOnline() > 0,
    holdStageReady, releaseStageReady,
    // сколько байт ещё не ушло в сеть из сокета этой страницы. board-stage.js
    // по нему держит темп, отдавая доску частями: см. там pumpBulk
    socketBacklog,
    // Промпт №75: несколько сессий в одном браузере
    openNewSessionTab, goToSession,
    getSessionName: () => (amTabHolder() ? sessionLabel(regGet(code)) : ''),
    renameSession: (name) => { if (amTabHolder()) regRename(code, name); },
  };
})();
