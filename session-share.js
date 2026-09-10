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
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  const cfg = window.SUPABASE_CONFIG || {};
  if (!cfg.url || !cfg.anonKey || !window.supabase) {
    console.warn('[session-share] SUPABASE_CONFIG или supabase-js не подключены — совместный доступ недоступен на этой странице.');
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
  const SB = window.supabase.createClient(cfg.url, cfg.anonKey, {
    realtime: { params: { eventsPerSecond: 100 } },
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
  const CLIENT_ID = myClientId();

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
  function storeCode(c) {
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
  function storeRole(role) { try { localStorage.setItem(ROLE_KEY, role); } catch (e) {} }

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
    });
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

    // а вот СТРУКТУРНУЮ часть состояния (задания, режимы и т.п.) применяем
    // только если она реально принадлежит ЭТОЙ странице — иначе, в момент
    // перехода между тренажёрами, можно на долю секунды получить чужое
    // состояние (например, снимок oge8 попадёт в applyState тренажёра oge12,
    // структуры не совпадают) и либо сломать разметку, либо просто намусорить.
    // Если метки нет вовсе (старый снимок/другая версия) — применяем как
    // раньше, по умолчанию считая её «своей».
    const belongsHere = !state.__trainer || state.__trainer === trainerSlug;
    if (!belongsHere) return;

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
  }
  function getConnState() { return connState; }

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
        applyIncomingState(payload.state);
      })
      .on('broadcast', { event: 'field' }, ({ payload }) => {
        if (!payload || payload.uid === CLIENT_ID) return;
        const entry = fields.get(payload.fieldId);
        if (!entry) return;
        if (recentlyEditedLocally(entry)) return; // сейчас печатает локальный пользователь — не перебиваем
        entry.el.value = payload.value;
      })
      .on('broadcast', { event: 'ev' }, ({ payload }) => {
        if (!payload || payload.uid === CLIENT_ID) return;
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
    saveTimer = setTimeout(() => {
      if (!code) return;
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
    if (joinCode) {
      isLeaderFlag = false;
      const res = await activate(joinCode.toUpperCase(), { createIfMissing: false, requestSyncFromLeader: true });
      if (res.ok) { storeRole('follower'); return; }
      // ссылка устарела/битая — просто продолжаем со своей обычной сессией,
      // без всплывающих ошибок при обычном заходе на страницу
      isLeaderFlag = true;
    }
    const stored = readStoredCode();
    const storedRole = readStoredRole();
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
    const own = stored || generateCode();
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
    if (res.ok) storeRole('follower');
    else isLeaderFlag = true; // код не найден — остаёмся при своей сессии
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
    if (data && data.url) { try { location.href = data.url; } catch (e) {} }
  });

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
    if (uiEls.btn) {
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

    const count = historyUI && historyUI.getCount ? historyUI.getCount() : 0;
    uiEls.historyCountEl.textContent = count > 0 ? `История: ${count} ` + pluralSnapshots(count) : 'История: пока пусто';
    uiEls.historyDownloadBtn.disabled = count === 0;
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
        padding:16px;width:290px;display:none;flex-direction:column;gap:10px;}
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
    document.body.appendChild(btn);

    const pop = document.createElement('div');
    pop.className = 'ts-share-pop';
    pop.innerHTML = `
      <div class="ts-share-title">Совместный доступ</div>
      <div class="ts-share-hint">Поделитесь кодом или ссылкой — тот, кто откроет её, увидит те же задания и ввод, что и вы, в реальном времени.</div>
      <div class="ts-share-hint" id="tsRole" style="font-weight:600;"></div>
      <div class="ts-conn ts-conn-reconnecting" id="tsConn">На связи</div>
      <div class="ts-share-code" id="tsCode">—</div>
      <div class="ts-share-row">
        <input id="tsLink" type="text" readonly>
        <button id="tsCopy">Копировать</button>
      </div>
      <button class="ts-share-reset" id="tsReset">Начать новую сессию</button>
      <div class="ts-share-sep"></div>
      <div class="ts-share-hint">Есть код от другого человека?</div>
      <div class="ts-share-row">
        <input id="tsJoinInput" type="text" placeholder="код сессии">
        <button id="tsJoin">Подключиться</button>
      </div>
      <div class="ts-share-msg" id="tsMsg"></div>
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
      btn, pop,
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
    };

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
        renderPanel();
      }
    });
    document.addEventListener('click', (e) => {
      const path = e.composedPath ? e.composedPath() : [];
      if (!path.includes(pop) && e.target !== btn && !btn.contains(e.target)) pop.classList.remove('open');
    });
    pop.querySelector('#tsCopy').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(uiEls.linkEl.value); uiEls.msgEl.textContent = 'Ссылка скопирована.'; uiEls.msgEl.classList.remove('err'); }
      catch (e) { uiEls.linkEl.select(); uiEls.msgEl.textContent = 'Скопируйте вручную (Ctrl+C).'; }
    });
    pop.querySelector('#tsReset').addEventListener('click', async () => {
      await resetSession();
      uiEls.msgEl.textContent = 'Начата новая сессия.'; uiEls.msgEl.classList.remove('err');
    });
    pop.querySelector('#tsJoin').addEventListener('click', async () => {
      const val = uiEls.joinInput.value;
      uiEls.msgEl.textContent = 'Подключаемся…'; uiEls.msgEl.classList.remove('err');
      const res = await joinByCode(val);
      if (res.ok) { uiEls.joinInput.value = ''; uiEls.msgEl.textContent = 'Подключено.'; uiEls.msgEl.classList.remove('err'); }
      else { uiEls.msgEl.textContent = 'Сессия с таким кодом не найдена.'; uiEls.msgEl.classList.add('err'); }
    });
    renderPanel();
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
  };
})();
