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
    window.TrainerSession = { init: async () => {}, push(){}, registerField(){}, unregisterField(){}, unregisterFieldsWithPrefix(){}, mountShareButton(){}, broadcastEvent(){}, onEvent(){}, getCode(){ return null; }, getShareUrl(){ return ''; }, resetSession: async () => {}, joinByCode: async () => ({ ok: false, reason: 'unavailable' }), isLeader(){ return true; } };
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

  function storageKey(trainer) { return 'trainerSession:' + trainer; }

  function readStoredCode(trainer) {
    try { return localStorage.getItem(storageKey(trainer)) || null; } catch (e) { return null; }
  }
  function storeCode(trainer, c) {
    try { localStorage.setItem(storageKey(trainer), c); } catch (e) {}
  }

  function urlJoinCode() {
    try {
      const p = new URLSearchParams(location.search);
      return p.get('s') || null;
    } catch (e) { return null; }
  }

  async function fetchRow(c) {
    const { data, error } = await SB.from('trainer_sessions').select('code, state').eq('code', c).maybeSingle();
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
    return Object.assign({}, s, { __fields: fieldValues });
  }

  function applyIncomingState(state) {
    if (!state) return;
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

  async function activate(c, opts) {
    opts = opts || {};
    code = c;
    let resolveSubscribed;
    const subscribed = new Promise((res) => { resolveSubscribed = res; });
    subscribeChannel(c, resolveSubscribed);
    let row = await fetchRow(c);
    if (!row) {
      if (opts.createIfMissing) {
        await insertRow(c, trainerSlug, fullState());
      } else {
        return { ok: false, reason: 'not_found' };
      }
    } else if (row.state && Object.keys(row.state).length) {
      applyIncomingState(row.state);
    }
    storeCode(trainerSlug, c);
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
      if (res.ok) return;
      // ссылка устарела/битая — просто продолжаем со своей обычной сессией,
      // без всплывающих ошибок при обычном заходе на страницу
      isLeaderFlag = true;
    }
    const stored = readStoredCode(trainerSlug);
    const own = stored || generateCode();
    await activate(own, { createIfMissing: true });
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
    applyIncomingState({});
  }
  async function joinByCode(rawCode) {
    const c = (rawCode || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!c) return { ok: false, reason: 'empty' };
    isLeaderFlag = false; // подключаемся к чужому коду — дальше синхронизируемся к нему
    const res = await activate(c, { createIfMissing: false, requestSyncFromLeader: true });
    if (!res.ok) isLeaderFlag = true; // код не найден — остаёмся при своей сессии
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
    `;
    document.body.appendChild(pop);

    uiEls = {
      btn, pop,
      codeEl: pop.querySelector('#tsCode'),
      linkEl: pop.querySelector('#tsLink'),
      msgEl: pop.querySelector('#tsMsg'),
      joinInput: pop.querySelector('#tsJoinInput'),
      roleEl: pop.querySelector('#tsRole'),
    };

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
    broadcastEvent, onEvent, isLeader,
  };
})();
