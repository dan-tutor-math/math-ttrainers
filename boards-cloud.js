/* ═══════════════════════════════════════════════════════════════════════
   boards-cloud.js — вход по email и (в перспективе) общая доска с учеником.

   Это отдельный, необязательный слой поверх обычного локального
   приложения (boards-core.js). Пока в нём только: (1) экран входа,
   который перекрывает всё приложение, пока пользователь не подтвердит
   email; (2) после входа — вызывает window.boardsAppBoot(), который
   раньше вызывался сам по себе при загрузке страницы.

   Если supabase-config.js не заполнен настоящими значениями — показываем
   понятную подсказку вместо тихой поломки, и приложение НЕ запускается
   (чтобы не показывать пустой экран входа без возможности его пройти).
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  const cfg = window.SUPABASE_CONFIG || {};
  const configured = cfg.url && cfg.anonKey &&
    !/ВСТАВЬ_СЮДА/.test(cfg.url) && !/ВСТАВЬ_СЮДА/.test(cfg.anonKey);

  const style = document.createElement('style');
  style.textContent = `
    #authGate{position:fixed;inset:0;z-index:5000;display:flex;align-items:center;justify-content:center;
      background:var(--bg);
      background:radial-gradient(circle at 6% -8%, var(--blob-1) 0%, transparent 40%),
                 radial-gradient(circle at 102% 8%, var(--blob-2) 0%, transparent 38%), var(--bg);}
    .ag-card{width:340px;max-width:90vw;padding:28px 26px;border-radius:20px;
      background:var(--glass-strong);border:1px solid var(--glass-border);
      backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);
      box-shadow:inset 0 1px 0 var(--glass-inset), var(--shadow);}
    .ag-logo{font-weight:700;font-size:19px;color:var(--pencil);margin-bottom:14px;}
    .ag-hint{font-size:13.5px;line-height:1.5;color:var(--muted-2);margin-bottom:14px;}
    #authGate input{width:100%;font-size:14px;padding:10px 12px;border-radius:11px;
      border:1px solid var(--glass-border);background:var(--glass);color:var(--pencil);
      outline:none;margin-bottom:10px;}
    #authGate input:focus{border-color:var(--ink);}
    #authGate button{width:100%;font-size:14px;font-weight:600;padding:10px 12px;border-radius:11px;
      border:none;background:var(--ink);color:#fff;cursor:pointer;transition:background .12s;}
    #authGate button:hover{background:var(--ink-active);}
    .ag-link{background:none !important;color:var(--ink) !important;font-weight:500 !important;
      padding:6px 0 !important;text-decoration:underline;}
    .ag-error{margin-top:10px;font-size:13px;color:var(--teacher);line-height:1.4;}
    .ag-user-pill{position:fixed;top:16px;left:16px;z-index:400;display:flex;align-items:center;gap:8px;
      padding:7px 12px;border-radius:12px;background:var(--glass-strong);border:1px solid var(--glass-border);
      backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);
      box-shadow:inset 0 1px 0 var(--glass-inset), var(--shadow);font-size:12.5px;color:var(--muted-2);}
    .ag-user-pill b{color:var(--pencil);font-weight:600;}
    .ag-user-pill a{color:var(--ink);cursor:pointer;text-decoration:underline;margin-left:2px;}
  `;
  document.head.appendChild(style);

  document.body.insertAdjacentHTML('afterbegin', `
    <div id="authGate">
      <div class="ag-card">
        <div class="ag-logo">Тренажёры</div>
        <div id="agStep1">
          <p class="ag-hint">Войдите по email, чтобы открыть доски.</p>
          <input id="agEmail" type="email" placeholder="you@example.com" autocomplete="email">
          <button id="agSend">Отправить ссылку для входа</button>
        </div>
        <div id="agStep2" hidden>
          <p class="ag-hint">Письмо отправлено на <b id="agSentEmail"></b>. Откройте его на этом же устройстве и перейдите по ссылке — страница обновится сама.</p>
          <button id="agResend" class="ag-link">Ввести другой email</button>
        </div>
        <div id="agLoading" hidden><p class="ag-hint">Входим…</p></div>
        <div id="agError" class="ag-error" hidden></div>
      </div>
    </div>
    <div id="authUserPill" class="ag-user-pill" style="display:none">
      <span>Вы вошли как <b id="agCurrentEmail"></b></span><a id="agSignOut">Выйти</a>
    </div>
  `);

  const gate = document.getElementById('authGate');
  const step1 = document.getElementById('agStep1');
  const step2 = document.getElementById('agStep2');
  const loading = document.getElementById('agLoading');
  const errBox = document.getElementById('agError');
  const pill = document.getElementById('authUserPill');

  function setStage(stage, msg) {
    step1.hidden = stage !== 'form';
    step2.hidden = stage !== 'sent';
    loading.hidden = stage !== 'loading';
    if (msg) { errBox.hidden = false; errBox.textContent = msg; } else { errBox.hidden = true; }
  }
  function showGate() {
    gate.style.display = 'flex';
    pill.style.display = 'none';
    const sl = document.getElementById('screenList'), sb2 = document.getElementById('screenBoard');
    if (sl) sl.style.display = 'none';
    if (sb2) sb2.style.display = 'none';
  }
  function hideGate() {
    gate.style.display = 'none';
    // снимаем инлайновый display:none, который showGate() поставил поверх
    // обычной CSS-логики видимости экранов — дальше ей снова управляет
    // сам boards-core.js (openBoard()/возврат к списку)
    const sl = document.getElementById('screenList'), sb2 = document.getElementById('screenBoard');
    if (sl) sl.style.display = '';
    if (sb2 && !window.__boardsBooted) sb2.style.display = '';
  }

  if (!configured) {
    showGate();
    setStage('form', 'Не настроен доступ к серверу: заполните supabase-config.js своими Project URL и anon key из Supabase (Project Settings → API), затем перезагрузите страницу.');
    document.getElementById('agSend').disabled = true;
    document.getElementById('agEmail').disabled = true;
    return;
  }

  const sb = window.supabase.createClient(cfg.url, cfg.anonKey);
  window.SB = sb; // остальным модулям (совместное редактирование, шаринг) — тот же клиент

  showGate();
  setStage('loading');
  // подстраховка: если по какой-то причине onAuthStateChange не сработает
  // быстро (например, сеть подвисла на первом запросе к Supabase),
  // не оставляем пользователя навсегда смотреть на «Входим…»
  const loadingFallback = setTimeout(() => { if (!loading.hidden) setStage('form'); }, 6000);

  document.getElementById('agSend').addEventListener('click', async () => {
    const email = document.getElementById('agEmail').value.trim();
    if (!email) { setStage('form', 'Введите email.'); return; }
    setStage('loading');
    try {
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: location.origin + location.pathname }
      });
      if (error) { setStage('form', 'Не получилось отправить письмо: ' + error.message); return; }
      document.getElementById('agSentEmail').textContent = email;
      setStage('sent');
    } catch (e) {
      setStage('form', 'Не получилось отправить письмо: ' + (e && e.message ? e.message : e));
    }
  });
  document.getElementById('agResend').addEventListener('click', () => setStage('form'));
  document.getElementById('agSignOut').addEventListener('click', () => { sb.auth.signOut(); });

  sb.auth.onAuthStateChange((event, session) => {
    clearTimeout(loadingFallback);
    if (session && session.user) {
      window.CURRENT_USER = session.user;
      document.getElementById('agCurrentEmail').textContent = session.user.email || '';
      pill.style.display = 'flex';
      hideGate();
      if (window.boardsAppBoot) window.boardsAppBoot();
      // подтягиваем в локальный список доски, которыми с этим пользователем
      // поделились (см. второй блок ниже — cloudImportSharedBoards)
      if (window.cloudImportSharedBoards) window.cloudImportSharedBoards();
    } else {
      window.CURRENT_USER = null;
      showGate();
      setStage('form');
    }
  });
})();

/* ═══════════════════════════════════════════════════════════════════════
   Общая доска — синхронизация объектов через Supabase Realtime, управление
   доступом («Совместная работа»), собственная история отмены только для
   своих действий.

   Работает поверх ОБЫЧНОГО локального движка доски, ничего в нём не меняя:
   обычные доски (без cloudBoardId) этим кодом вообще не затрагиваются.
   Заметки в справочной панели (второй холст, см. rf* в boards-core.js) в
   общую доску НЕ синхронизируются — это сознательное упрощение первой
   версии, у каждого свои заметки, как и раньше.

   Поскольку B и DB в boards-core.js — обычные `let`-переменные, снаружи
   не видны: используем несколько точек входа, которые boards-core.js сам
   выставил наружу (window.getDB/getCurrentBoard/boardsRedraw/
   boardsClearSelection/onBoardOpened-хук), и аккуратно подменяем несколько
   его глобальных функций (pushUndo/saveDB/doUndo/doRedo — это обычные
   `function`-объявления верхнего уровня, а значит и свойства window), не
   трогая ни одного места их вызова внутри самого движка.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  if (!window.SB) return; // не настроено — см. первый блок выше

  const style = document.createElement('style');
  style.textContent = `
    .bd-share-pop{position:fixed;top:56px;right:16px;z-index:400;background:var(--glass-strong);
      backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);
      border:1px solid var(--glass-border);border-radius:16px;box-shadow:var(--shadow);
      padding:16px;width:300px;display:none;flex-direction:column;gap:12px;max-height:70vh;overflow-y:auto;}
    .bd-share-pop.open{display:flex;}
    .bd-share-title{font-size:13px;font-weight:700;color:var(--pencil);}
    .bd-share-hint{font-size:12.5px;line-height:1.45;color:var(--muted-2);}
    .bd-share-row{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12.5px;color:var(--pencil);}
    .bd-share-row .role{color:var(--muted-2);font-size:11.5px;}
    .bd-share-row button{border:none;background:none;color:var(--teacher);cursor:pointer;font-size:11.5px;text-decoration:underline;padding:0;}
    .bd-share-invite{display:flex;flex-direction:column;gap:6px;border-top:1px solid var(--glass-border);padding-top:12px;}
    .bd-share-invite input{font-size:13px;padding:8px 10px;border-radius:9px;border:1px solid var(--glass-border);background:var(--glass);color:var(--pencil);outline:none;}
    .bd-share-invite select{font-size:12.5px;padding:7px 8px;border-radius:9px;border:1px solid var(--glass-border);background:var(--glass);color:var(--pencil);}
    .bd-share-invite button.primary{font-size:13px;font-weight:600;padding:8px 10px;border-radius:9px;border:none;background:var(--ink);color:#fff;cursor:pointer;}
    .bd-share-invite button.primary:hover{background:var(--ink-active);}
    .bd-share-make{font-size:13px;font-weight:600;padding:9px 10px;border-radius:10px;border:none;background:var(--ink);color:#fff;cursor:pointer;}
    .bd-share-make:hover{background:var(--ink-active);}
    .bd-share-msg{font-size:12px;color:var(--muted-2);}
    .bd-share-msg.err{color:var(--teacher);}
  `;
  document.head.appendChild(style);

  // кнопка в верхней панели доски — вставляем перед последним спейсером,
  // сразу после кнопки настроек листа
  const gearBtn = document.getElementById('bdGear');
  const shareBtn = document.createElement('button');
  shareBtn.className = 'bd-gear';
  shareBtn.id = 'bdShareBtn';
  shareBtn.title = 'Совместная работа';
  shareBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.6"/><circle cx="17" cy="6" r="2.4" stroke="currentColor" stroke-width="1.6"/><circle cx="17" cy="18" r="2.4" stroke="currentColor" stroke-width="1.6"/><path d="M10.6 9.4L15 6.9M10.6 12.6L15 17.1M3 19c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  if (gearBtn && gearBtn.parentElement) gearBtn.parentElement.insertBefore(shareBtn, gearBtn.nextSibling);

  const sharePop = document.createElement('div');
  sharePop.className = 'bd-share-pop';
  sharePop.id = 'bdSharePop';
  document.body.appendChild(sharePop);

  shareBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sharePop.classList.toggle('open');
    if (sharePop.classList.contains('open')) renderSharePanel();
  });
  document.addEventListener('click', (e) => {
    // не e.target.closest(...) — клики внутри панели часто запускают async-
    // операцию (пригласить/убрать/сделать общей), которая ПЕРЕРИСОВЫВАЕТ
    // содержимое панели (новый innerHTML) ещё до того, как это же событие
    // клика дойдёт по всплытию сюда, до document; к этому моменту исходная
    // кнопка уже отсоединена от DOM, и closest() по ней всегда возвращает
    // null, из-за чего панель ошибочно считалась «кликом снаружи» и тут же
    // закрывалась сама на себя. composedPath() — это снимок пути события,
    // снятый ДО начала всплытия, поэтому он остаётся верным, даже если сама
    // кнопка успела исчезнуть из документа к моменту проверки
    const path = e.composedPath ? e.composedPath() : [];
    if (!path.includes(sharePop) && e.target !== shareBtn && !shareBtn.contains(e.target)) {
      sharePop.classList.remove('open');
    }
  });

  // ------------------------------------------------------------------
  // состояние текущей открытой доски (сбрасывается при каждом openBoard)
  // ------------------------------------------------------------------
  let cloudBoardId = null;
  let cloudRole = null; // 'owner' | 'editor' | 'admin'
  let cloudChannel = null;
  let cloudApplyingRemote = false;
  let cloudGestureBefore = null; // JSON-снимок B.objects, снятый в начале ЖЕСТА (см. pushUndo ниже)
  let cloudUndoStack = [];
  let cloudRedoStack = [];
  let cloudFlushTimer = null;

  function computeDiff(beforeArr, afterArr) {
    const beforeMap = new Map(beforeArr.map(o => [o.id, o]));
    const afterMap = new Map(afterArr.map(o => [o.id, o]));
    const added = [], updated = [], removed = [];
    afterMap.forEach((obj, id) => {
      if (!beforeMap.has(id)) added.push(obj);
      else if (JSON.stringify(beforeMap.get(id)) !== JSON.stringify(obj)) updated.push({ id, before: beforeMap.get(id), after: obj });
    });
    beforeMap.forEach((obj, id) => { if (!afterMap.has(id)) removed.push({ id, obj }); });
    return { added, updated, removed };
  }
  function diffIsEmpty(d) { return !d.added.length && !d.updated.length && !d.removed.length; }
  function invertDiff(d) {
    return {
      added: d.removed.map(r => r.obj),
      removed: d.added.map(o => ({ id: o.id, obj: o })),
      updated: d.updated.map(u => ({ id: u.id, before: u.after, after: u.before })),
    };
  }
  function applyDiffLocally(board, d) {
    d.removed.forEach(r => { board.objects = board.objects.filter(o => o.id !== r.id); });
    d.added.forEach(o => { if (!board.objects.some(x => x.id === o.id)) board.objects.push(JSON.parse(JSON.stringify(o))); });
    d.updated.forEach(u => {
      const idx = board.objects.findIndex(o => o.id === u.id);
      if (idx >= 0) board.objects[idx] = JSON.parse(JSON.stringify(u.after));
    });
  }

  async function pushDiffToSupabase(boardId, diff) {
    const rows = diff.added.concat(diff.updated.map(u => u.after)).map(obj => ({
      board_id: boardId, obj_id: obj.id, data: obj,
      updated_by: window.CURRENT_USER ? window.CURRENT_USER.id : null,
    }));
    if (rows.length) {
      const { error } = await window.SB.from('board_objects').upsert(rows, { onConflict: 'board_id,obj_id' });
      if (error) console.error('[облачная доска] не удалось сохранить изменения:', error.message);
    }
    const ids = diff.removed.map(r => r.id);
    if (ids.length) {
      const { error } = await window.SB.from('board_objects').delete().eq('board_id', boardId).in('obj_id', ids);
      if (error) console.error('[облачная доска] не удалось удалить объекты:', error.message);
    }
  }

  function cloudFinalizeGesture() {
    if (!cloudBoardId || cloudGestureBefore === null) return;
    const board = window.getCurrentBoard();
    const before = JSON.parse(cloudGestureBefore);
    cloudGestureBefore = null;
    if (!board) return;
    const diff = computeDiff(before, board.objects);
    if (diffIsEmpty(diff)) return;
    cloudUndoStack.push(diff);
    if (cloudUndoStack.length > 100) cloudUndoStack.shift();
    cloudRedoStack.length = 0;
    pushDiffToSupabase(cloudBoardId, diff);
  }

  function cloudUndo() {
    if (!cloudUndoStack.length) return;
    const diff = cloudUndoStack.pop();
    const inv = invertDiff(diff);
    const board = window.getCurrentBoard();
    if (!board) return;
    cloudApplyingRemote = true;
    applyDiffLocally(board, inv);
    cloudApplyingRemote = false;
    cloudRedoStack.push(diff);
    window.boardsClearSelection();
    window.boardsRedraw();
    pushDiffToSupabase(cloudBoardId, inv);
  }
  function cloudRedo() {
    if (!cloudRedoStack.length) return;
    const diff = cloudRedoStack.pop();
    const board = window.getCurrentBoard();
    if (!board) return;
    cloudApplyingRemote = true;
    applyDiffLocally(board, diff);
    cloudApplyingRemote = false;
    cloudUndoStack.push(diff);
    window.boardsClearSelection();
    window.boardsRedraw();
    pushDiffToSupabase(cloudBoardId, diff);
  }

  // ------------------------------------------------------------------
  // подмена глобальных функций движка доски — только чтение/запись, без
  // единого изменения мест их вызова внутри boards-core.js
  // ------------------------------------------------------------------
  const _origPushUndo = window.pushUndo;
  const _origSaveDB = window.saveDB;
  const _origDoUndo = window.doUndo;
  const _origDoRedo = window.doRedo;

  window.pushUndo = function () {
    _origPushUndo();
    if (cloudBoardId && !cloudApplyingRemote) {
      // два pushUndo подряд без завершения предыдущего жеста бывает, когда
      // ластиком стирают несколько объектов быстро друг за другом — сначала
      // фиксируем предыдущий, потом начинаем снимок для нового
      if (cloudGestureBefore !== null) cloudFinalizeGesture();
      const board = window.getCurrentBoard();
      cloudGestureBefore = board ? JSON.stringify(board.objects) : null;
    }
  };
  window.saveDB = function () {
    _origSaveDB();
    if (cloudBoardId && !cloudApplyingRemote) {
      clearTimeout(cloudFlushTimer);
      cloudFlushTimer = setTimeout(cloudFinalizeGesture, 250);
    }
  };
  window.doUndo = function () { if (cloudBoardId) cloudUndo(); else _origDoUndo(); };
  window.doRedo = function () { if (cloudBoardId) cloudRedo(); else _origDoRedo(); };
  // важно: НЕ на фазе перехвата (capture) — жест ещё не записан в объекты
  // доски, пока событие не дойдёт до самого холста; ловим уже после того,
  // как обработчик холста отработал (обычное всплытие)
  window.addEventListener('pointerup', () => { if (cloudBoardId) { clearTimeout(cloudFlushTimer); cloudFinalizeGesture(); } });
  window.addEventListener('pointercancel', () => { if (cloudBoardId) { clearTimeout(cloudFlushTimer); cloudFinalizeGesture(); } });
  window.addEventListener('beforeunload', () => { if (cloudBoardId) cloudFinalizeGesture(); });

  // ------------------------------------------------------------------
  // применение изменений, пришедших от другого участника в реальном времени
  // ------------------------------------------------------------------
  function cloudHandleRemoteChange(payload) {
    const board = window.getCurrentBoard();
    if (!board || !cloudBoardId) return;
    const applyToArray = (arr) => {
      if (payload.eventType === 'DELETE') {
        const oldId = payload.old && payload.old.obj_id;
        return oldId ? arr.filter(o => o.id !== oldId) : arr;
      }
      const obj = payload.new && payload.new.data;
      if (!obj) return arr;
      const idx = arr.findIndex(o => o.id === obj.id);
      if (idx >= 0) { const copy = arr.slice(); copy[idx] = obj; return copy; }
      return arr.concat([obj]);
    };
    cloudApplyingRemote = true;
    board.objects = applyToArray(board.objects);
    cloudApplyingRemote = false;
    // если у меня прямо сейчас идёт свой незавершённый жест — обновляем и
    // его «снимок до», чтобы чужое изменение не попало в diff как моё
    // собственное, когда мой жест зафиксируется
    if (cloudGestureBefore !== null) cloudGestureBefore = JSON.stringify(applyToArray(JSON.parse(cloudGestureBefore)));
    window.boardsRedraw();
  }

  async function cloudSetupSubscription(boardId, board) {
    const { data: rows, error } = await window.SB.from('board_objects').select('obj_id, data').eq('board_id', boardId);
    if (!error && rows) {
      cloudApplyingRemote = true;
      board.objects = rows.map(r => r.data);
      cloudApplyingRemote = false;
      window.boardsClearSelection();
      window.boardsRedraw();
    } else if (error) {
      console.error('[облачная доска] не удалось загрузить объекты:', error.message);
    }
    cloudChannel = window.SB.channel('board_objects:' + boardId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'board_objects', filter: 'board_id=eq.' + boardId }, cloudHandleRemoteChange)
      .subscribe();
  }
  function cloudTeardownSubscription() {
    if (cloudChannel) { window.SB.removeChannel(cloudChannel); cloudChannel = null; }
  }

  window.onBoardOpened = function (board) {
    cloudTeardownSubscription();
    cloudUndoStack = []; cloudRedoStack = []; cloudGestureBefore = null;
    cloudBoardId = board.cloudBoardId || null;
    cloudRole = board.cloudRole || null;
    if (cloudBoardId) cloudSetupSubscription(cloudBoardId, board);
  };
  window.onBoardClosed = function () {
    cloudTeardownSubscription();
    cloudBoardId = null; cloudRole = null;
  };

  // ------------------------------------------------------------------
  // «Сделать общей» / панель управления доступом
  // ------------------------------------------------------------------
  async function makeCurrentBoardShared() {
    const board = window.getCurrentBoard();
    if (!board || !window.CURRENT_USER) return;
    const { data, error } = await window.SB.from('boards').insert({ owner: window.CURRENT_USER.id, title: board.name }).select().single();
    if (error) { renderSharePanel('Не получилось: ' + error.message, true); return; }
    board.cloudBoardId = data.id;
    board.cloudRole = 'owner';
    if (board.objects.length) {
      const rows = board.objects.map(obj => ({ board_id: data.id, obj_id: obj.id, data: obj, updated_by: window.CURRENT_USER.id }));
      await window.SB.from('board_objects').upsert(rows, { onConflict: 'board_id,obj_id' });
    }
    window.saveDB();
    window.onBoardOpened(board);
    renderSharePanel();
  }

  async function inviteToBoard(email, role) {
    if (!cloudBoardId) return;
    const { data: profile, error: pErr } = await window.SB.from('profiles').select('id').eq('email', email).maybeSingle();
    if (pErr || !profile) {
      renderSharePanel('Этот email ещё не входил в приложение хотя бы раз — попроси сначала войти по ссылке входа, потом пригласи снова.', true);
      return;
    }
    const { error } = await window.SB.from('board_access').upsert({ board_id: cloudBoardId, user_id: profile.id, role }, { onConflict: 'board_id,user_id' });
    if (error) { renderSharePanel('Не получилось добавить: ' + error.message, true); return; }
    renderSharePanel();
  }
  async function revokeAccess(userId) {
    if (!cloudBoardId) return;
    await window.SB.from('board_access').delete().eq('board_id', cloudBoardId).eq('user_id', userId);
    renderSharePanel();
  }

  async function renderSharePanel(message, isError) {
    const board = window.getCurrentBoard();
    if (!board) { sharePop.innerHTML = ''; return; }

    if (!board.cloudBoardId) {
      sharePop.innerHTML = `
        <div class="bd-share-title">Совместная работа</div>
        <div class="bd-share-hint">Сделай эту доску общей, чтобы пригласить ученика — он увидит и сможет рисовать на ней в реальном времени, ты будешь видеть его записи так же.</div>
        <button class="bd-share-make" id="bdShareMakeBtn">Сделать общей</button>
        ${message ? `<div class="bd-share-msg${isError ? ' err' : ''}">${message}</div>` : ''}
      `;
      document.getElementById('bdShareMakeBtn').addEventListener('click', makeCurrentBoardShared);
      return;
    }

    if (board.cloudRole !== 'owner' && board.cloudRole !== 'admin') {
      sharePop.innerHTML = `
        <div class="bd-share-title">Совместная работа</div>
        <div class="bd-share-hint">Это общая доска. У вас есть право рисовать на ней; управлять списком доступа может только её владелец.</div>
      `;
      return;
    }

    sharePop.innerHTML = `<div class="bd-share-title">Совместная работа</div><div class="bd-share-hint">Загрузка…</div>`;
    const { data: accessRows, error: aErr } = await window.SB.from('board_access').select('user_id, role').eq('board_id', board.cloudBoardId);
    let peopleHtml = '';
    if (!aErr && accessRows && accessRows.length) {
      const ids = accessRows.map(r => r.user_id);
      const { data: profiles } = await window.SB.from('profiles').select('id, email').in('id', ids);
      const emailById = new Map((profiles || []).map(p => [p.id, p.email]));
      peopleHtml = accessRows.map(r => `
        <div class="bd-share-row" data-uid="${r.user_id}">
          <span>${emailById.get(r.user_id) || r.user_id}</span>
          <span class="role">${r.role === 'admin' ? 'полный админ' : 'может рисовать'}</span>
          <button class="bd-share-revoke" data-uid="${r.user_id}">Убрать</button>
        </div>`).join('');
    }
    sharePop.innerHTML = `
      <div class="bd-share-title">Совместная работа</div>
      <div class="bd-share-hint">У кого есть доступ к этой доске:</div>
      ${peopleHtml || '<div class="bd-share-hint">Пока никого, кроме вас.</div>'}
      <div class="bd-share-invite">
        <input type="email" id="bdShareEmail" placeholder="email ученика">
        <select id="bdShareRole">
          <option value="editor">Может рисовать</option>
          <option value="admin">Полный админ</option>
        </select>
        <button class="primary" id="bdShareAddBtn">Добавить</button>
      </div>
      ${message ? `<div class="bd-share-msg${isError ? ' err' : ''}">${message}</div>` : ''}
    `;
    sharePop.querySelectorAll('.bd-share-revoke').forEach(btn => {
      btn.addEventListener('click', () => revokeAccess(btn.dataset.uid));
    });
    document.getElementById('bdShareAddBtn').addEventListener('click', () => {
      const email = document.getElementById('bdShareEmail').value.trim();
      const role = document.getElementById('bdShareRole').value;
      if (!email) { renderSharePanel('Введите email.', true); return; }
      inviteToBoard(email, role);
    });
  }

  // ------------------------------------------------------------------
  // подтягиваем в локальный список доски, которыми поделились с этим
  // пользователем (для того, кого пригласили — эта доска изначально есть
  // только на устройстве владельца)
  // ------------------------------------------------------------------
  window.cloudImportSharedBoards = async function () {
    if (!window.CURRENT_USER) return;
    const { data: boardsRows, error } = await window.SB.from('boards').select('id, title, owner');
    if (error || !boardsRows) return;
    const db = window.getDB();
    if (!db) return;
    const { data: accessRows } = await window.SB.from('board_access').select('board_id, role').eq('user_id', window.CURRENT_USER.id);
    const roleByBoard = new Map((accessRows || []).map(r => [r.board_id, r.role]));
    let changed = false;
    boardsRows.forEach(row => {
      if (db.boards.some(b => b.cloudBoardId === row.id)) return;
      const role = row.owner === window.CURRENT_USER.id ? 'owner' : (roleByBoard.get(row.id) || 'editor');
      db.boards.push({
        id: window.uid(), name: row.title || 'Общая доска', folderId: null,
        createdAt: window.nowTs(), updatedAt: window.nowTs(), lastOpenedAt: null,
        cellSize: 24, sheetCols: 76, sheetRows: 54, sheetCount: 1, pageOrder: 'h',
        objects: [], recentColors: [], colorUsage: {},
        cloudBoardId: row.id, cloudRole: role,
      });
      changed = true;
    });
    if (changed) { window.saveDB(); if (window.renderList) window.renderList(); }
  };
})();
