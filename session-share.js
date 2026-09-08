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
      getPermissions(){ return { switchTask: true, refreshOne: true, refreshAll: true, showSolution: true, deleteTask: true, board: true }; },
      setPermission(){}, onPermissionsChange(){},
      getAutosaveHistory(){ return true; }, setAutosaveHistory(){}, onAutosaveHistoryChange(){},
      registerHistoryUI(){}, notifyHistoryChanged(){},
    };
    return;
  }
  const SB = window.supabase.createClient(cfg.url, cfg.anonKey);

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
    if (action === 'switchTask' || action === 'navigate') return true;
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

  function subscribeChannel(c, onSubscribed) {
    if (channel) { try { SB.removeChannel(channel); } catch (e) {} channel = null; }
    channel = SB.channel('trainer_session:' + c)
      .on('broadcast', { event: 'state' }, ({ payload }) => {
        if (!payload || payload.uid === CLIENT_ID) return;
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
        push();
      })
      .subscribe((status) => { if (status === 'SUBSCRIBED' && onSubscribed) onSubscribed(); });
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (!code) return;
      upsertState(code, trainerSlug, fullState());
    }, 400);
  }

  function push() {
    if (applyingRemote || !code) return;
    const state = fullState();
    if (channel) {
      try { channel.send({ type: 'broadcast', event: 'state', payload: { uid: CLIENT_ID, state } }); } catch (e) {}
    }
    scheduleSave();
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
        // код так и не нашёлся — откатываемся к тому, что было ДО попытки
        // подключения, а не остаёмся "подвешенными" на несуществующем коде:
        // subscribeChannel() выше уже отписал от прежнего канала, поэтому
        // для настоящего отката его нужно переподписать заново
        if (prevCode) {
          await new Promise(resolve => subscribeChannel(prevCode, resolve));
          code = prevCode;
        } else {
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
      subscribed.then(() => {
        try { channel && channel.send({ type: 'broadcast', event: 'sync_request', payload: { uid: CLIENT_ID } }); } catch (e) {}
      });
    }
    return { ok: true };
  }

  async function init(opts) {
    trainerSlug = opts.trainer;
    getStateCb = opts.getState || (() => ({}));
    applyStateCb = opts.applyState || (() => {});

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
        try {
          channel.send({ type: 'broadcast', event: 'field', payload: { uid: CLIENT_ID, fieldId, value: el.value } });
        } catch (e) {}
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
    try { channel.send({ type: 'broadcast', event: 'ev', payload: { uid: CLIENT_ID, name, data } }); } catch (e) {}
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
      if (pop.classList.contains('open')) renderPanel();
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
    getPermissions, setPermission, onPermissionsChange,
    getAutosaveHistory, setAutosaveHistory, onAutosaveHistoryChange,
    registerHistoryUI, notifyHistoryChanged,
  };
})();
