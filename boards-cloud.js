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
    /* Внизу слева — единственный угол экрана, свободный и на доске (там
       слева наверху «Назад к доскам», справа наверху шестерёнка/шеринг,
       справа внизу — круглая кнопка справочной панели), и на списке досок
       (там слева наверху «К тренажёрам», справа наверху — переключатель
       темы). Раньше плашка стояла в top:16px;left:16px поверх «Назад» и
       «К тренажёрам» (у неё z-index выше, а те кнопки — в обычном потоке
       документа, поэтому плашка их полностью перекрывала и блокировала клик) */
    .ag-user-pill{position:fixed;bottom:16px;left:16px;z-index:400;display:flex;align-items:center;gap:8px;
      padding:7px 12px;border-radius:12px;background:var(--glass-strong);border:1px solid var(--glass-border);
      backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);
      box-shadow:inset 0 1px 0 var(--glass-inset), var(--shadow);font-size:12.5px;color:var(--muted-2);}
    .ag-user-pill b{color:var(--pencil);font-weight:600;}
    .ag-user-pill a{color:var(--ink);cursor:pointer;text-decoration:underline;margin-left:2px;}
    .ag-user-pill .ag-edit-name{opacity:.7;font-size:11.5px;}
    .ag-user-pill .ag-pill-collapse{margin-left:2px;opacity:.5;text-decoration:none;cursor:pointer;font-size:13px;padding:0 2px;}
    .ag-user-pill .ag-pill-collapse:hover{opacity:1;}
    /* маленький кружок вместо плашки, когда её свернули — та же позиция
       (левый нижний угол), чтобы легко найти и вернуть обратно */
    .ag-pill-handle{position:fixed;bottom:16px;left:16px;z-index:400;width:28px;height:28px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;cursor:pointer;
      background:var(--glass-strong);border:1px solid var(--glass-border);
      backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);
      box-shadow:inset 0 1px 0 var(--glass-inset), var(--shadow);color:var(--muted-2);font-size:14px;}
    .ag-pill-handle:hover{color:var(--pencil);}
  `;
  document.head.appendChild(style);

  document.body.insertAdjacentHTML('afterbegin', `
    <div id="authGate">
      <div class="ag-card">
        <div class="ag-logo">Тренажёры</div>
        <div id="agStep1">
          <p class="ag-hint">Войдите по email. Если уже задавали пароль — введите его, вход будет сразу, без письма. Если ещё нет — оставьте поле пароля пустым.</p>
          <input id="agEmail" type="email" placeholder="you@example.com" autocomplete="email">
          <input id="agPassword" type="password" placeholder="Пароль (если уже задан)" autocomplete="current-password">
          <button id="agSend">Войти</button>
          <button id="agSendLink" class="ag-link">Прислать ссылку на почту вместо пароля</button>
        </div>
        <div id="agStep2" hidden>
          <p class="ag-hint">Письмо отправлено на <b id="agSentEmail"></b>. Откройте его на этом же устройстве и перейдите по ссылке — страница обновится сама.</p>
          <button id="agResend" class="ag-link">Ввести другой email</button>
        </div>
        <div id="agLoading" hidden><p class="ag-hint">Входим…</p></div>
        <!-- Показывается вместо пустой формы «введите email», когда на ЭТОМ
             устройстве уже есть сохранённый вход (человек когда-то прошёл по
             ссылке из письма), но прямо сейчас не получилось связаться с
             сервером (сеть моргнула, сервер на секунду недоступен и т.п.).
             Без этого экрана человек в такой ситуации видел просто пустую
             форму входа — и заново отправлял себе письмо, хотя оно совершенно
             не нужно: сам вход на устройстве никуда не делся, достаточно
             просто повторить попытку, когда соединение восстановится */ -->
        <div id="agReconnect" hidden>
          <p class="ag-hint">Не получилось подключиться к серверу — но вы уже входили на этом устройстве. Проверьте интернет-соединение и повторите попытку; письмо для этого не нужно.</p>
          <button id="agRetryConnect">Повторить попытку</button>
          <button id="agUseOtherEmail" class="ag-link">Войти под другой почтой</button>
        </div>
        <!-- Ссылка-приглашение из URL (?invite=...) устарела, уже использована
             кем-то другим, или её отозвали — регистрация по ней закрыта
             специально (см. sendMagicLink/shouldCreateUser ниже), чтобы
             посторонний человек не мог сам себе завести вход на сайт -->
        <div id="agInviteInvalid" hidden>
          <p class="ag-hint">Эта ссылка-приглашение уже использована или недействительна. Попросите новую у того, кто её прислал.</p>
          <button id="agInviteGoNormal" class="ag-link">У меня уже есть аккаунт — войти обычно</button>
        </div>
        <div id="agError" class="ag-error" hidden></div>
      </div>
    </div>
    <div id="authUserPill" class="ag-user-pill" style="display:none">
      <span>Вы вошли как <b id="agCurrentEmail"></b></span>
      <a id="agEditName" class="ag-edit-name" title="Задать имя, которое увидит собеседник рядом со своим курсором">изменить имя</a>
      <a id="agSetPassword" class="ag-edit-name" title="Задать или сменить пароль для входа без письма">задать пароль</a>
      <a id="agCreateInvite" class="ag-edit-name" style="display:none" title="Создать одноразовую ссылку-приглашение для нового человека">пригласить</a>
      <a id="agSignOut">Выйти</a>
      <a id="agPillCollapse" class="ag-pill-collapse" title="Свернуть эту панель">✕</a>
    </div>
    <div id="agPillHandle" class="ag-pill-handle" style="display:none" title="Показать данные входа">⋯</div>
  `);

  const gate = document.getElementById('authGate');
  const step1 = document.getElementById('agStep1');
  const step2 = document.getElementById('agStep2');
  const loading = document.getElementById('agLoading');
  const reconnectBox = document.getElementById('agReconnect');
  const errBox = document.getElementById('agError');
  const pill = document.getElementById('authUserPill');
  const pillHandle = document.getElementById('agPillHandle');
  const pillCollapseBtn = document.getElementById('agPillCollapse');
  const inviteInvalidBox = document.getElementById('agInviteInvalid');
  let pillCollapsed = false;
  try { pillCollapsed = localStorage.getItem('ag-pill-collapsed') === '1'; } catch (e) {}
  // что из плашки/кружка видно, зависит от двух вещей: вошёл ли человек
  // (signedIn) и свернул ли он сам плашку (pillCollapsed) — второе
  // запоминается в localStorage на этом устройстве, чтобы не сворачивать
  // заново на каждой доске/при каждой перезагрузке
  function syncPillVisibility() {
    const signedIn = !!window.CURRENT_USER;
    pill.style.display = (signedIn && !pillCollapsed) ? 'flex' : 'none';
    pillHandle.style.display = (signedIn && pillCollapsed) ? 'flex' : 'none';
  }
  pillCollapseBtn.addEventListener('click', () => {
    pillCollapsed = true;
    try { localStorage.setItem('ag-pill-collapsed', '1'); } catch (e) {}
    syncPillVisibility();
  });
  pillHandle.addEventListener('click', () => {
    pillCollapsed = false;
    try { localStorage.setItem('ag-pill-collapsed', '0'); } catch (e) {}
    syncPillVisibility();
  });

  function setStage(stage, msg) {
    step1.hidden = stage !== 'form';
    step2.hidden = stage !== 'sent';
    loading.hidden = stage !== 'loading';
    reconnectBox.hidden = stage !== 'reconnect';
    inviteInvalidBox.hidden = stage !== 'invite-invalid';
    if (msg) { errBox.hidden = false; errBox.textContent = msg; } else { errBox.hidden = true; }
  }

  // ── Закрытая регистрация по ссылке-приглашению (?invite=<id>): без
  //    валидного приглашения новый аккаунт создать нельзя (см. sendMagicLink
  //    -> shouldCreateUser ниже) — так посторонний человек с адресом сайта
  //    не сможет сам себе завести вход, а сможет только тот, кому дали
  //    одноразовую ссылку. У кого уже ЕСТЬ аккаунт — вход как обычно,
  //    приглашение вообще не требуется. ──
  let inviteId = new URLSearchParams(location.search).get('invite');
  let inviteInfo = { valid: !inviteId, label: '' };
  // есть ли на этом устройстве сохранённый с прошлого раза вход — используем
  // только для того, чтобы решить, ЧТО показать при сбое связи (см. выше);
  // сам ключ (sb-<project-ref>-auth-token) — деталь реализации supabase-js,
  // поэтому проверяем мягко, по префиксу/суффиксу, а не по точному имени
  function hasCachedSessionOnThisDevice() {
    try { return Object.keys(localStorage).some(k => k.startsWith('sb-') && k.endsWith('-auth-token')); }
    catch (e) { return false; }
  }
  // имя, которое человек сам себе задал (см. agEditName ниже) — хранится в
  // user_metadata самого пользователя в Supabase Auth (обновляется через
  // auth.updateUser, без какой-либо отдельной таблицы/миграции), поэтому
  // доступно сразу же, как только известен session.user. Если имя ещё не
  // задано — показываем email, как и раньше.
  function displayNameOf(user) {
    return (user && user.user_metadata && user.user_metadata.display_name) || (user && user.email) || '';
  }
  window.displayNameOf = displayNameOf; // используется вторым блоком файла (живой курсор)
  function showGate() {
    gate.style.display = 'flex';
    pill.style.display = 'none';
    pillHandle.style.display = 'none';
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
    document.getElementById('agPassword').disabled = true;
    document.getElementById('agSendLink').disabled = true;
    return;
  }

  const sb = window.supabase.createClient(cfg.url, cfg.anonKey);
  window.SB = sb; // остальным модулям (совместное редактирование, шаринг) — тот же клиент

  // Проверяем ссылку СРАЗУ (пока идёт остальная загрузка), но ничего не
  // помечаем использованной здесь — только смотрим, действительна ли она.
  // Погашение (redeem_invite) происходит позже, только в момент реальной
  // отправки письма (sendMagicLink) — чтобы просто открыть ссылку и уйти
  // не сжигало её впустую.
  const inviteCheckPromise = inviteId
    ? sb.rpc('check_invite', { p_id: inviteId }).then(({ data, error }) => {
        const row = Array.isArray(data) ? data[0] : data;
        inviteInfo = (!error && row && row.valid) ? { valid: true, label: row.label || '' } : { valid: false };
      }).catch(() => { inviteInfo = { valid: false }; })
    : Promise.resolve();

  // Момент «показать форму входа с нуля» — либо обычная форма (email/
  // пароль), либо та же форма с другой подсказкой (пришли по действующему
  // приглашению), либо экран «ссылка недействительна»
  async function presentForm() {
    await inviteCheckPromise;
    if (inviteId && !inviteInfo.valid) { setStage('invite-invalid'); return; }
    document.querySelector('#agStep1 .ag-hint').textContent = (inviteId && inviteInfo.valid)
      ? 'Вас пригласили' + (inviteInfo.label ? ` (${inviteInfo.label})` : '') + '. Введите свою почту — придёт письмо со ссылкой для входа.'
      : 'Войдите по email. Если уже задавали пароль — введите его, вход будет сразу, без письма. Если ещё нет — оставьте поле пароля пустым.';
    setStage('form');
  }
  document.getElementById('agInviteGoNormal').addEventListener('click', () => {
    // ссылка оказалась чужой/старой, но у человека уже есть свой аккаунт —
    // даём войти обычным способом, просто убираем ?invite= из адресной строки
    history.replaceState(null, '', location.pathname);
    inviteId = null;
    inviteInfo = { valid: true, label: '' };
    presentForm();
  });

  showGate();
  setStage('loading');
  let authSettled = false;
  // подстраховка: если по какой-то причине onAuthStateChange не сработает
  // быстро (например, сеть подвисла на первом запросе к Supabase), не
  // оставляем пользователя навсегда смотреть на «Входим…». Раньше в этом
  // случае всегда показывали пустую форму «введите email» — из-за чего
  // человек, уже когда-то входивший на этом устройстве, при обычном сетевом
  // сбое сам себе заново отправлял письмо, хотя сессия никуда не делась и
  // достаточно было просто повторить попытку (см. hasCachedSessionOnThisDevice
  // и agReconnect выше) — здесь просто РАЗДЕЛЯЕМ эти два случая
  const loadingFallback = setTimeout(() => {
    if (authSettled) return;
    if (hasCachedSessionOnThisDevice()) { setStage('reconnect'); startAutoReconnect(); }
    else presentForm();
  }, 8000);

  // несколько тихих попыток само собой переподключиться, пока человек ещё
  // ничего не нажал — большинство коротких сетевых сбоев успевают пройти
  // сами за эти секунды, и тогда человек даже не заметит экран agReconnect
  let autoReconnectTimer = null, autoReconnectTries = 0;
  function startAutoReconnect() {
    if (autoReconnectTimer) return;
    autoReconnectTimer = setInterval(async () => {
      if (authSettled || autoReconnectTries >= 4) { clearInterval(autoReconnectTimer); autoReconnectTimer = null; return; }
      autoReconnectTries++;
      try { await sb.auth.getSession(); } catch (e) { /* следующая попытка через интервал */ }
    }, 4000);
  }
  document.getElementById('agRetryConnect').addEventListener('click', async () => {
    setStage('loading');
    try { await sb.auth.getSession(); } catch (e) { /* ниже подстраховка вернёт на agReconnect */ }
    setTimeout(() => { if (!authSettled) setStage('reconnect'); }, 5000);
  });
  document.getElementById('agUseOtherEmail').addEventListener('click', () => {
    if (autoReconnectTimer) { clearInterval(autoReconnectTimer); autoReconnectTimer = null; }
    setStage('form');
  });

  async function sendMagicLink(email) {
    setStage('loading');
    try {
      // Разрешаем создать НОВЫЙ аккаунт только если пришли по ещё не
      // погашенной ссылке-приглашению — redeem_invite атомарно помечает её
      // использованной и возвращает true только ПЕРВОМУ, кто успел. Без
      // приглашения (или если оно уже использовано кем-то другим) —
      // shouldCreateUser:false: у СУЩЕСТВУЮЩИХ пользователей вход при этом
      // работает как обычно, это ограничивает только СОЗДАНИЕ новых аккаунтов.
      let allowCreate = false;
      if (inviteId && inviteInfo.valid) {
        const { data: redeemed, error: redeemErr } = await sb.rpc('redeem_invite', { p_id: inviteId, p_email: email });
        if (redeemErr) { setStage('form', 'Не получилось проверить приглашение: ' + redeemErr.message); return; }
        if (!redeemed) { setStage('invite-invalid'); return; }
        allowCreate = true;
      }
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: location.origin + location.pathname, shouldCreateUser: allowCreate }
      });
      if (error) {
        const notAllowed = /signup|not allowed/i.test(error.message || '');
        setStage('form', notAllowed
          ? 'Эта почта ещё не зарегистрирована, а свободная регистрация закрыта — нужна ссылка-приглашение от владельца платформы.'
          : 'Не получилось отправить письмо: ' + error.message);
        return;
      }
      document.getElementById('agSentEmail').textContent = email;
      setStage('sent');
    } catch (e) {
      setStage('form', 'Не получилось отправить письмо: ' + (e && e.message ? e.message : e));
    }
  }
  document.getElementById('agSend').addEventListener('click', async () => {
    const email = document.getElementById('agEmail').value.trim();
    const password = document.getElementById('agPassword').value;
    if (!email) { setStage('form', 'Введите email.'); return; }
    if (password) {
      setStage('loading');
      try {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (!error) return; // дальше всё делает onAuthStateChange — письмо не отправлялось
        // намеренно НЕ отправляем письмо сами в этой ветке — только предлагаем
        // явную кнопку ниже, чтобы не слать письма молча на опечатку в пароле
        setStage('form', 'Не подошёл пароль (или он ещё не задан для этой почты). Проверьте пароль или нажмите «Прислать ссылку на почту».');
      } catch (e) {
        setStage('form', 'Не получилось войти: ' + (e && e.message ? e.message : e));
      }
      return;
    }
    await sendMagicLink(email);
  });
  document.getElementById('agSendLink').addEventListener('click', () => {
    const email = document.getElementById('agEmail').value.trim();
    if (!email) { setStage('form', 'Введите email.'); return; }
    sendMagicLink(email);
  });
  // Enter в любом из полей формы входа — как нажатие «Войти»
  ['agEmail', 'agPassword'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('agSend').click();
    });
  });
  document.getElementById('agResend').addEventListener('click', () => setStage('form'));
  document.getElementById('agSignOut').addEventListener('click', () => { sb.auth.signOut(); });
  // «изменить имя» — доступно в любой момент, не только при регистрации:
  // это имя (не email) увидит собеседник на общей доске рядом со своим
  // курсором (см. второй блок файла — «живой курсор»)
  document.getElementById('agEditName').addEventListener('click', async () => {
    const current = displayNameOf(window.CURRENT_USER) === (window.CURRENT_USER && window.CURRENT_USER.email)
      ? '' // имя ещё не задавали — в поле подсказки email не подставляем
      : displayNameOf(window.CURRENT_USER);
    const name = prompt('Как вас называть на доске? Это имя увидит ученик/учитель рядом с вашим курсором.', current);
    if (name === null) return; // отменили
    const trimmed = name.trim();
    try {
      const { data, error } = await sb.auth.updateUser({ data: { display_name: trimmed } });
      if (error) { alert('Не получилось сохранить имя: ' + error.message); return; }
      if (data && data.user) window.CURRENT_USER = data.user;
      document.getElementById('agCurrentEmail').textContent = displayNameOf(window.CURRENT_USER);
    } catch (e) {
      alert('Не получилось сохранить имя: ' + (e && e.message ? e.message : e));
    }
  });

  function hasPassword(user) {
    return !!(user && user.user_metadata && user.user_metadata.has_password);
  }
  function updateSetPasswordLabel(user) {
    const el = document.getElementById('agSetPassword');
    if (el) el.textContent = hasPassword(user) ? 'сменить пароль' : 'задать пароль';
  }
  // is_owner специально хранится в app_metadata (а не в user_metadata, как
  // has_password/display_name) — user_metadata человек может менять сам
  // себе через updateUser(), а app_metadata правится только вручную в
  // дашборде Supabase самим владельцем проекта. Так рядовой аккаунт не
  // сможет сам себе выдать право создавать приглашения.
  function isOwner(user) {
    return !!(user && user.app_metadata && user.app_metadata.is_owner);
  }
  function updateOwnerUI(user) {
    const el = document.getElementById('agCreateInvite');
    if (el) el.style.display = isOwner(user) ? '' : 'none';
  }
  async function offerSetPassword() {
    const already = hasPassword(window.CURRENT_USER);
    const msg = already
      ? 'Новый пароль для входа без письма (не короче 6 символов). Оставьте пустым, чтобы отменить.'
      : 'Задать пароль, чтобы в следующий раз входить сразу, без письма? Не короче 6 символов. Оставьте пустым, если не хотите — предложим позже, кнопкой «задать пароль» рядом с вашим email.';
    const pw = prompt(msg);
    if (pw === null) return; // отменили
    const trimmed = pw.trim();
    if (!trimmed) return; // оставили пустым — не настаиваем
    if (trimmed.length < 6) { alert('Пароль должен быть не короче 6 символов. Можно задать его позже.'); return; }
    try {
      const { data, error } = await sb.auth.updateUser({ password: trimmed, data: { has_password: true } });
      if (error) { alert('Не получилось сохранить пароль: ' + error.message); return; }
      if (data && data.user) { window.CURRENT_USER = data.user; updateSetPasswordLabel(data.user); }
    } catch (e) {
      alert('Не получилось сохранить пароль: ' + (e && e.message ? e.message : e));
    }
  }
  document.getElementById('agSetPassword').addEventListener('click', () => offerSetPassword());
  document.getElementById('agCreateInvite').addEventListener('click', async () => {
    const label = (prompt('Для кого эта ссылка? (необязательно, просто чтобы не забыть, кому давали)') || '').trim();
    try {
      const { data, error } = await sb.from('invites')
        .insert({ created_by: window.CURRENT_USER.id, label: label || null })
        .select('id').single();
      if (error || !data) { alert('Не получилось создать приглашение: ' + (error ? error.message : 'нет ответа')); return; }
      const link = location.origin + location.pathname + '?invite=' + data.id;
      const note = '\n\nОна одноразовая: сработает только у первого, кто по ней зарегистрируется.';
      try {
        await navigator.clipboard.writeText(link);
        alert('Ссылка-приглашение скопирована в буфер обмена:\n\n' + link + note);
      } catch (e) {
        alert('Ссылка-приглашение (скопируйте вручную):\n\n' + link + note);
      }
    } catch (e) {
      alert('Не получилось создать приглашение: ' + (e && e.message ? e.message : e));
    }
  });
  let passwordPromptShown = false;

  sb.auth.onAuthStateChange((event, session) => {
    if (session && session.user) {
      authSettled = true;
      clearTimeout(loadingFallback);
      if (autoReconnectTimer) { clearInterval(autoReconnectTimer); autoReconnectTimer = null; }
      window.CURRENT_USER = session.user;
      document.getElementById('agCurrentEmail').textContent = displayNameOf(session.user);
      updateSetPasswordLabel(session.user);
      updateOwnerUI(session.user);
      syncPillVisibility();
      hideGate();
      if (window.boardsAppBoot) window.boardsAppBoot();
      // подтягиваем в локальный список доски, которыми с этим пользователем
      // поделились (см. второй блок ниже — cloudImportSharedBoards)
      if (window.cloudImportSharedBoards) window.cloudImportSharedBoards();
      // event==='SIGNED_IN' — именно свежий вход в этой вкладке (по ссылке из
      // письма или по паролю), а не тихое восстановление уже существующей
      // сессии при обычной перезагрузке страницы (иначе предложение задать
      // пароль всплывало бы при каждом открытии приложения)
      if (event === 'SIGNED_IN' && !passwordPromptShown && !hasPassword(session.user)) {
        passwordPromptShown = true;
        offerSetPassword();
      }
    } else {
      window.CURRENT_USER = null;
      // сессии сейчас нет — но если на устройстве всё ещё лежит сохранённый
      // токен, это почти наверняка просто сбой сети при попытке его обновить,
      // а не настоящий выход: когда сервер ДЕЙСТВИТЕЛЬНО признаёт вход
      // недействительным (или человек сам нажал «Выйти»), supabase-js сам
      // стирает токен из хранилища — вот тогда и покажем обычную форму входа.
      // Пока токен на месте — не дёргаем человека письмом, а даём кнопке
      // «Повторить»/тихому авто-повтору ещё шанс
      if (hasCachedSessionOnThisDevice()) {
        clearTimeout(loadingFallback);
        showGate();
        setStage('reconnect');
        startAutoReconnect();
      } else {
        authSettled = true;
        clearTimeout(loadingFallback);
        if (autoReconnectTimer) { clearInterval(autoReconnectTimer); autoReconnectTimer = null; }
        showGate();
        presentForm();
      }
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
    .bd-share-row .who{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .bd-share-rolesel{flex:0 0 auto;max-width:132px;font-size:11.5px;padding:4px 6px;border-radius:8px;
      border:1px solid var(--glass-border);background:var(--glass);color:var(--pencil);cursor:pointer;}
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
    .bd-share-vers{display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--glass-border);padding-top:12px;}
    #bdShareVersList{display:flex;flex-direction:column;gap:8px;}
    #bdShareVersList:empty{display:none;}
    .bd-share-vers-btn,.bd-ver-save{font-size:12.5px;font-weight:600;padding:7px 10px;border-radius:9px;
      border:1px solid var(--glass-border);background:var(--glass);color:var(--pencil);cursor:pointer;}
    .bd-ver-row{display:flex;flex-direction:column;gap:5px;padding:8px;border-radius:10px;border:1px solid var(--glass-border);}
    .bd-ver-info{font-size:12px;color:var(--pencil);line-height:1.35;}
    .bd-ver-acts{display:flex;gap:10px;flex-wrap:wrap;}
    .bd-ver-acts button{border:none;background:none;color:var(--teacher);cursor:pointer;font-size:11.5px;text-decoration:underline;padding:0;}

    /* Курсоры других участников совместной доски — см. блок «живой курсор»
       ниже. Слой на весь экран, сам не ловит клики (pointer-events:none),
       чтобы не мешать работе с холстом под ним; каждый курсор — просто
       иконка пера (тот же силуэт, что и у собственного курсора-пера при
       рисовании, см. penCursorCSS() в boards-core.js), но в инвертированных
       цветах (filter:invert), плюс подпись с почтой рядом — как и обычная
       плашка "Вы вошли как …" в этом же файле, тот же стиль стеклянной
       таблички. z-index ниже, чем у всплывающих панелей (400), но выше
       холста, чтобы курсор не терялся под содержимым доски. */
    #bdCursorLayer{position:fixed;inset:0;z-index:250;pointer-events:none;overflow:hidden;}
    .bd-remote-cursor{position:absolute;left:0;top:0;pointer-events:none;will-change:transform;}
    .bd-remote-cursor-icon{display:block;width:24px;height:24px;filter:invert(1);
      transform:translate(-3px,-3px);transition:filter .15s;}
    .bd-remote-cursor.is-drawing .bd-remote-cursor-icon{filter:invert(1) drop-shadow(0 0 4px rgba(0,0,0,.35));}
    .bd-remote-cursor-label{position:absolute;left:19px;top:16px;white-space:nowrap;font-size:11px;
      font-weight:600;padding:3px 8px;border-radius:8px;background:var(--glass-strong);
      border:1px solid var(--glass-border);color:var(--pencil);
      backdrop-filter:blur(14px) saturate(160%);-webkit-backdrop-filter:blur(14px) saturate(160%);
      box-shadow:var(--shadow);}
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

  const cursorLayer = document.createElement('div');
  cursorLayer.id = 'bdCursorLayer';
  document.body.appendChild(cursorLayer);

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

  // ------------------------------------------------------------------
  // живой курсор — где сейчас указывает мышь у другого участника этой же
  // общей доски, обновляется на КАЖДОЕ движение мыши (не только когда
  // что-то рисуют), чтобы можно было просто найти друг друга на доске
  // или обвести что-то, не рисуя ни одной линии. Передаётся через
  // realtime-broadcast на том же канале, что и сами объекты доски, но
  // НИКУДА не сохраняется в базу — это чисто эфемерные данные "прямо
  // сейчас", в отличие от board_objects.
  // ------------------------------------------------------------------
  let remoteCursors = new Map(); // uid -> {email, x, y, drawing, lastSeen, el}
  let myPointerDown = false;
  let cursorAnimHandle = null;
  let cursorSendPending = null;
  let cursorSendTimer = null;
  let cursorLastSentAt = 0;

  // те же координаты кончика пера, что и в penCursorCSS() (boards-core.js:
  // `svgCursorUrl(svg, 9, 28, ...)`), пересчитанные из родного размера
  // иконки там (34px) в размер здесь (24px, см. .bd-remote-cursor-icon)
  const CURSOR_TIP_X = 9 / 34 * 24;
  const CURSOR_TIP_Y = 28 / 34 * 24;

  function remoteCursorIconSVG() {
    // тот же силуэт «паркера», что и у penCursorCSS() в boards-core.js —
    // тёмный лаковый корпус с золотым ободком, белый ореол для читаемости;
    // цвета инвертируются CSS-фильтром (.bd-remote-cursor-icon{filter:invert(1)})
    // прямо на элементе, поэтому здесь рисуем как обычно, "неинвертированно"
    return `<svg class="bd-remote-cursor-icon" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(40 17 18)">
        <rect x="15.3" y="5" width="3.4" height="17" rx="1.7" fill="white" stroke="white" stroke-width="4"/>
        <polygon points="15.3,22 18.7,22 17,31" fill="white" stroke="white" stroke-width="4" stroke-linejoin="round"/>
        <polygon points="18.7,6.2 20.3,7 20.3,12.6 18.7,13.2" fill="white" stroke="white" stroke-width="3"/>
        <rect x="15.3" y="5" width="3.4" height="17" rx="1.7" fill="#22222a" stroke="#0c0c10" stroke-width="1"/>
        <rect x="15.3" y="19" width="3.4" height="1.5" fill="#dcb24a" stroke="#a9821f" stroke-width=".3"/>
        <polygon points="18.7,6.2 20.3,7 20.3,12.6 18.7,13.2" fill="#3c3c44" stroke="#0c0c10" stroke-width="0.8"/>
        <polygon points="15.3,22 18.7,22 17,31" fill="#6b6b74" stroke="#0c0c10" stroke-width="1" stroke-linejoin="round"/>
      </g>
    </svg>`;
  }
  function makeCursorEl(uid) {
    const el = document.createElement('div');
    el.className = 'bd-remote-cursor';
    el.dataset.uid = uid;
    el.innerHTML = remoteCursorIconSVG() + '<div class="bd-remote-cursor-label"></div>';
    cursorLayer.appendChild(el);
    return el;
  }
  function removeCursorEntry(uid) {
    const entry = remoteCursors.get(uid);
    if (entry && entry.el && entry.el.parentNode) entry.el.parentNode.removeChild(entry.el);
    remoteCursors.delete(uid);
  }
  function clearAllCursors() {
    remoteCursors.forEach(entry => { if (entry.el && entry.el.parentNode) entry.el.parentNode.removeChild(entry.el); });
    remoteCursors.clear();
  }

  function cloudHandleRemoteCursor(payload) {
    if (!payload || !cloudBoardId || !payload.uid) return;
    if (window.CURRENT_USER && payload.uid === window.CURRENT_USER.id) return; // на всякий случай, своё эхо
    if (payload.leave) { removeCursorEntry(payload.uid); return; }
    if (typeof payload.x !== 'number' || typeof payload.y !== 'number') return;
    let entry = remoteCursors.get(payload.uid);
    if (!entry) { entry = { el: makeCursorEl(payload.uid) }; remoteCursors.set(payload.uid, entry); }
    // name — то, что человек сам себе задал (см. agEditName и displayNameOf
    // в первом блоке файла); email — старое поле, оставлено на всякий
    // случай (если по какой-то причине имя не задано и не пришло)
    entry.name = payload.name || payload.email || '';
    entry.x = payload.x; entry.y = payload.y;
    entry.drawing = !!payload.drawing;
    entry.lastSeen = Date.now();
    entry.el.classList.toggle('is-drawing', entry.drawing);
    const labelEl = entry.el.querySelector('.bd-remote-cursor-label');
    if (labelEl && labelEl.textContent !== entry.name) labelEl.textContent = entry.name;
    startCursorAnim();
  }

  // курсоры других участников рисуем каждый кадр, а не только когда пришло
  // новое сообщение по сети: иначе при панораме/масштабировании СВОЕГО
  // вида их экранное положение не обновлялось бы (их мировые координаты не
  // менялись, а вот перевод мир→экран — да)
  function cursorAnimTick() {
    if (!cloudBoardId) { cursorAnimHandle = null; return; }
    if (remoteCursors.size && window.worldToScreen) {
      const canvasEl = document.getElementById('boardCv');
      const rect = canvasEl ? canvasEl.getBoundingClientRect() : { left: 0, top: 0 };
      remoteCursors.forEach(entry => {
        const s = window.worldToScreen({ x: entry.x, y: entry.y });
        // сдвигаем на "хотспот" пера в обратную сторону, чтобы его кончик
        // (а не угол невидимого квадрата иконки) указывал точно в (x,y)
        entry.el.style.transform = `translate(${Math.round(rect.left + s.x - CURSOR_TIP_X)}px, ${Math.round(rect.top + s.y - CURSOR_TIP_Y)}px)`;
      });
    }
    cursorAnimHandle = requestAnimationFrame(cursorAnimTick);
  }
  function startCursorAnim() { if (!cursorAnimHandle) cursorAnimHandle = requestAnimationFrame(cursorAnimTick); }
  function stopCursorAnim() { if (cursorAnimHandle) { cancelAnimationFrame(cursorAnimHandle); cursorAnimHandle = null; } }

  // подчищаем курсоры, для которых давно не было сообщений (человек закрыл
  // вкладку без события pointerleave/beforeunload — например, у него просто
  // разрядился ноутбук) — иначе значок навсегда "застынет" на месте
  setInterval(() => {
    if (!remoteCursors.size) return;
    const now = Date.now();
    remoteCursors.forEach((entry, uid) => { if (now - entry.lastSeen > 6000) removeCursorEntry(uid); });
  }, 3000);

  function flushCursorSend() {
    cursorSendTimer = null;
    const pending = cursorSendPending; cursorSendPending = null;
    if (!pending || !cloudChannel || !cloudBoardId || !window.CURRENT_USER) return;
    cursorLastSentAt = Date.now();
    const payload = pending.leave
      ? { uid: window.CURRENT_USER.id, leave: true }
      : { uid: window.CURRENT_USER.id, name: window.displayNameOf(window.CURRENT_USER), x: pending.x, y: pending.y, drawing: !!pending.drawing };
    // курсор — вспомогательная штука поверх основной синхронизации; сбой
    // отправки (сеть моргнула, канал ещё не до конца подключился сразу
    // после открытия доски) не должен ронять ничего в приложении
    try { cloudChannel.send({ type: 'broadcast', event: 'cursor', payload }); } catch (e) {}
  }
  // не чаще ~15 раз в секунду — этого более чем достаточно для плавности
  // "живого" курсора и не перегружает канал; событие "ушёл с холста"/"скрыл
  // вкладку" отправляем сразу, без троттлинга
  function scheduleCursorSend(x, y, drawing, leave) {
    cursorSendPending = leave ? { leave: true } : { x, y, drawing };
    if (leave) { clearTimeout(cursorSendTimer); cursorSendTimer = null; flushCursorSend(); return; }
    if (cursorSendTimer) return;
    const wait = Math.max(0, 65 - (Date.now() - cursorLastSentAt));
    cursorSendTimer = setTimeout(flushCursorSend, wait);
  }

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
  /* ═══ Промпт №53: действия на общей доске откатывались сами ═══
     Живой случай: учитель увеличивает картинку — через секунду она сама
     возвращается к старому размеру; удаляет картинку — через секунду она
     появляется снова. Происходило именно тогда, когда ученик в это время
     пишет на доске. Причин было несколько, и все про одно: до получателя
     доезжала СТАРАЯ версия объекта, и её применяли поверх новой, потому что
     отличить старую от новой было не по чему.

     - Тяжёлый объект (картинка) едет заглушкой, и получатель сразу идёт за
       ним в базу. Но рассылка уходит ДО записи в базу — первый же запрос
       отдавал прошлую версию, и она считалась полученной.
     - Если это старьё приезжало посреди жеста ученика (он пишет не
       отрываясь), оно попадало в его «снимок после», но не в «снимок до», и
       уходило обратно учителю как правка ученика. Учитель получал свою же
       картинку в прошлом размере, а удалённая — воскресала.
     - Записи в базу шли параллельно: два изменения подряд могли дойти до
       базы в обратном порядке, а удаление — раньше предыдущего сохранения
       той же картинки. Тогда в базе оставалось старьё, и его через полминуты
       подтягивала сверка.
     - Своё же эхо из postgres_changes (запись первого из двух быстрых
       изменений) приходило после второго и откатывало его.

     Лечение. У каждого объекта есть номер версии `rv` (и `rvBy` — кто её
     сделал, чтобы при равных номерах все участники выбрали одно и то же).
     Любая своя правка поднимает номер, а чужая версия применяется, только
     если она не старее той, что уже на доске. Удалённый объект оставляет
     «надгробие» с номером своей версии: вернуть его может только более
     новая версия (отмена удаления её и даёт), а старые копии из запоздавших
     ответов базы и чужих жестов больше ничего не воскрешают. Плюс записи в
     базу идут строго по очереди — это НЕ та очередь, от которой отказались
     в промптах №36–37: рассылка по каналу как уходила сразу, так и уходит,
     упорядочены только запросы к базе. */
  let cloudTombs = new Map();          // id -> номер версии удалённого объекта
  const TOMB_LIMIT = 5000;
  let cloudWriteChain = Promise.resolve();

  function myUid() { return window.CURRENT_USER ? window.CURRENT_USER.id : ''; }
  function revOf(o) { return (o && typeof o.rv === 'number') ? o.rv : 0; }
  function cloneObj(o) { return JSON.parse(JSON.stringify(o)); }

  // при равных номерах решает автор версии — сравнение одинаковое у всех
  // участников, поэтому при одновременной правке все сойдутся на одной
  function incomingWins(inc, local) {
    if (!local) return true;
    const a = revOf(inc), b = revOf(local);
    if (a !== b) return a > b;
    return String(inc.rvBy || '') >= String(local.rvBy || '');
  }
  function tombBlocks(id, rv) {
    return cloudTombs.has(id) && (rv || 0) <= cloudTombs.get(id);
  }

  /* ═══ Промпт №10 (новый список): при входе на общую доску пропадало всё ═══
     Живой случай: заходишь на общую доску — секунду всё на месте, потом
     доска пустая; так при каждой перезагрузке, и нарисованное поверх пустой
     доски после выхода и входа тоже пропадало.

     Причина. При открытии общей доски объекты забирались из базы ОДНИМ
     запросом, и его ответ целиком ЗАМЕНЯЛ то, что уже лежало на доске из
     локальной копии (board.objects = rows). А база (PostgREST у Supabase)
     отдаёт за один запрос не больше 1000 строк — настройка «Max rows» по
     умолчанию, и об обрезке она не сообщает. Месяцы занятий с одной ученицей
     перевалили за тысячу объектов, и с этого момента при каждом входе
     на доске оставалась случайная тысяча строк (как правило, самое старое,
     где-то далеко от места работы), а всё свежее — задания, решения, новые
     штрихи — исчезало с экрана. В базе оно при этом лежало целым: запись шла
     нормально, обрезалось только чтение. Сверка раз в полминуты страдала тем
     же — видела только первую тысячу номеров.

     Лечение:
     - всё, что читает доску из базы целиком, читает постранично и сверяет
       число полученного с числом строк в базе (selectAllPaged)
     - ответ базы не заменяет доску, а сливается с ней по номерам версий
       (cloudInitialLoad). Убрать с доски объект, которого в базе нет, можно
       только когда ответ точно полный и объект раньше точно был в базе
       (cloudSeen — эту память храним на диске): значит, его удалил
       собеседник. Объект, которого в базе не было никогда, — это
       несостоявшаяся запись; он остаётся и дописывается
     - пустой ответ базы никогда не опустошает непустую доску
     - несостоявшиеся записи повторяются при сверке (cloudUnsynced)
     - перед сверкой с базой снимается версия доски на этом устройстве
       (раздел «Версии» ниже), из неё можно вернуть пропавшее */
  let cloudLoadState = 'idle';   // 'idle' | 'loading' | 'retry' | 'done' | 'failed'
  let cloudLoadGen = 0;          // поколение открытия: ответ для прошлого открытия не применяем
  let cloudSeen = new Set();     // номера объектов, которые точно были в базе
  let cloudSeenKnown = false;    // есть ли вообще такая память (нет — первый вход после обновления)
  let cloudMine = new Set();     // объекты, которые я правил в этой сессии — их запись уже в очереди
  let cloudUnsynced = new Set(); // объекты, запись которых в базу не прошла — повторим при сверке
  let cloudUnsyncedDel = new Set(); // то же для удалений

  const PAGE_DATA = 250;         // строк с содержимым за запрос (картинки тяжёлые)
  const PAGE_LIGHT = 1000;       // строк без содержимого (номера и версии)
  const PAGE_PARALLEL = 3;       // сколько страниц просим одновременно
  const IN_CHUNK = 150;          // номеров в одном .in() — длинный адрес сервер не примет
  const LOAD_RETRY_MS = [1500, 4000, 10000];

  function chunksOf(arr, n) {
    const out = [];
    for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
    return out;
  }

  // Все строки доски постранично. complete — получено ровно столько, сколько
  // строк в базе; только при полном ответе можно делать вывод «этого в базе нет».
  // Порядок по obj_id — без него страницы могут пересекаться и терять строки
  async function selectAllPaged(boardId, sel, pageSize) {
    const byId = new Map();
    const page = (from, size) => window.SB.from('board_objects')
      .select(sel, from === 0 ? { count: 'exact' } : undefined)
      .eq('board_id', boardId).order('obj_id', { ascending: true })
      .range(from, from + size - 1);
    const first = await page(0, pageSize);
    if (first.error) return { rows: [], complete: false, error: first.error };
    (first.data || []).forEach(r => byId.set(r.obj_id, r));
    const total = typeof first.count === 'number' ? first.count : null;
    let size = pageSize;
    // база может резать страницу сильнее, чем мы просили (свой «Max rows»)
    if (first.data && first.data.length < pageSize && (total === null || first.data.length < total)) {
      size = Math.max(1, first.data.length);
    }
    let from = (first.data || []).length;
    let error = null;
    if (total !== null) {
      const offsets = [];
      for (let o = from; o < total; o += size) offsets.push(o);
      for (const batch of chunksOf(offsets, PAGE_PARALLEL)) {
        const res = await Promise.all(batch.map(o => page(o, size)));
        res.forEach(r => {
          if (r.error) { error = r.error; return; }
          (r.data || []).forEach(x => byId.set(x.obj_id, x));
        });
        if (error) break;
      }
    } else {
      // количество не пришло — идём страница за страницей до пустой
      for (let guard = 0; guard < 10000 && from > 0; guard++) {
        const r = await page(from, size);
        if (r.error) { error = r.error; break; }
        if (!r.data || !r.data.length) break;
        r.data.forEach(x => byId.set(x.obj_id, x));
        from += r.data.length;
      }
    }
    const rows = Array.from(byId.values());
    const complete = !error && total !== null && rows.length >= total;
    return { rows, complete, error, total };
  }

  // память «что было в базе» — отдельной записью на доску, рядом с досками
  function seenKey(boardId) { return 'cloudseen:' + boardId; }
  let seenSaveTimer = null;
  let seenSavePending = null;
  function saveSeenSoon() {
    if (!cloudBoardId || !cloudSeenKnown || !window.idbPut) return;
    const key = seenKey(cloudBoardId), set = cloudSeen;
    seenSavePending = () => window.idbPut(key, { ids: Array.from(set), at: Date.now() }).catch(() => {});
    clearTimeout(seenSaveTimer);
    seenSaveTimer = setTimeout(flushSeen, 1200);
  }
  function flushSeen() {
    clearTimeout(seenSaveTimer); seenSaveTimer = null;
    const job = seenSavePending; seenSavePending = null;
    if (job) job();
  }
  function loadSeen(boardId) {
    if (!window.idbGet) return Promise.resolve(null);
    return window.idbGet(seenKey(boardId)).then(v => (v && Array.isArray(v.ids)) ? v.ids : null).catch(() => null);
  }

  // пришедшее из облака — на диск (без подъёма rev, см. boardsPersistQuiet)
  function persistBoardQuiet(board) {
    if (window.boardsPersistQuiet && board) window.boardsPersistQuiet(board);
  }
  function addTomb(id, rv) {
    const prev = cloudTombs.has(id) ? cloudTombs.get(id) : -1;
    cloudTombs.delete(id);
    cloudTombs.set(id, Math.max(prev, rv || 0));
    // Map помнит порядок вставки — выбрасываем самые давние
    while (cloudTombs.size > TOMB_LIMIT) cloudTombs.delete(cloudTombs.keys().next().value);
  }

  // чужая версия объекта: 'applied' — легла на доску, 'same' — такая уже
  // есть, 'stale' — у нас новее или объект удалён позже этой версии
  function acceptRemoteObject(board, inc) {
    if (!inc || !inc.id) return 'stale';
    if (tombBlocks(inc.id, revOf(inc))) return 'stale';
    const idx = board.objects.findIndex(o => o.id === inc.id);
    const local = idx >= 0 ? board.objects[idx] : null;
    if (local && !incomingWins(inc, local)) return 'stale';
    // одинаковое не трогаем: подмена объекта на равный ему ничего не даёт,
    // а лишняя перерисовка тяжёлой картинки заметна
    if (local && JSON.stringify(local) === JSON.stringify(inc)) return 'same';
    const copy = cloneObj(inc);
    if (idx >= 0) board.objects[idx] = copy; else board.objects.push(copy);
    cloudTombs.delete(inc.id);
    // Промпт №10: пришло от собеседника — значит, в базе оно есть (или вот-вот
    // будет); и на диск эту доску пора переписать
    cloudSeen.add(inc.id); saveSeenSoon();
    persistBoardQuiet(board);
    return 'applied';
  }
  // rv — версия, которую удалял собеседник. Она может быть новее нашей:
  // учитель увеличил картинку и сразу удалил, а увеличенная до нас ещё не
  // доехала — без этого номера запоздавшее увеличение её бы воскресило
  function removeRemoteObject(board, id, rv) {
    const local = board.objects.find(o => o.id === id);
    addTomb(id, Math.max(revOf(local), rv || 0));
    if (local) board.objects = board.objects.filter(o => o.id !== id);
    // из cloudSeen НЕ убираем: «был в базе, теперь нет» — ровно то, по чему
    // при следующем входе старая копия этого объекта с диска распознаётся как
    // удалённая, а не как несостоявшаяся запись, которую надо дописать
    if (local) persistBoardQuiet(board);
    return !!local;
  }

  // Если у меня идёт свой жест, всё пришедшее от других должно попасть и в
  // его «снимок до» — иначе при завершении жеста чужое изменение уйдёт в
  // рассылку как моё. Раньше это делалось для двух путей из трёх, а про
  // догрузку картинок из базы забыли — именно через неё старьё и уходило
  function syncGestureBefore(board, ids) {
    if (cloudGestureBefore === null || !ids || !ids.length) return;
    const before = JSON.parse(cloudGestureBefore);
    const want = new Set(ids);
    const nowById = new Map();
    board.objects.forEach(o => { if (want.has(o.id)) nowById.set(o.id, o); });
    const out = [];
    const seen = new Set();
    before.forEach(o => {
      if (!want.has(o.id)) { out.push(o); return; }
      seen.add(o.id);
      if (nowById.has(o.id)) out.push(nowById.get(o.id));
    });
    nowById.forEach((o, id) => { if (!seen.has(id)) out.push(o); });
    cloudGestureBefore = JSON.stringify(out);
  }

  // своя правка: поднимаем номер версии у всего, что добавлено или
  // изменено, и ставим надгробия на удалённое. Объекты в diff.added и
  // diff.updated[].after — это живые объекты доски, номер ложится прямо на них
  function stampLocalDiff(diff) {
    const me = myUid();
    diff.added.forEach(o => {
      o.rv = Math.max(revOf(o), cloudTombs.has(o.id) ? cloudTombs.get(o.id) : 0) + 1;
      o.rvBy = me;
      cloudTombs.delete(o.id);
      cloudMine.add(o.id);
    });
    diff.updated.forEach(u => {
      u.after.rv = Math.max(revOf(u.before), revOf(u.after)) + 1;
      u.after.rvBy = me;
      cloudMine.add(u.id);
    });
    diff.removed.forEach(r => { addTomb(r.id, revOf(r.obj)); cloudMine.add(r.id); });
  }

  // отмена/повтор: применяем свой diff к доске и сразу выдаём номер версии
  // новее текущего — иначе отмена вернула бы объект со СТАРЫМ номером, и
  // остальные участники справедливо сочли бы его устаревшим
  // step — на сколько поднять номер. Обычно на 1; восстановление из версии
  // (Промпт №10) поднимает сильнее: объект могли удалить, пока меня не было,
  // и у собеседника лежит надгробие с номером новее моей старой копии —
  // скачок номера ничего не ломает (важен только порядок), а надгробие обходит
  function applyOwnDiff(board, d, step) {
    step = step || 1;
    const me = myUid();
    const out = { added: [], updated: [], removed: [] };
    if (d.removed.length) {
      const gone = new Set(d.removed.map(r => r.id));
      board.objects.forEach(local => {
        if (!gone.has(local.id)) return;
        addTomb(local.id, revOf(local));
        cloudMine.add(local.id);
        out.removed.push({ id: local.id, obj: local });
      });
      board.objects = board.objects.filter(o => !gone.has(o.id));
    }
    const have = new Map(board.objects.map((o, i) => [o.id, i]));
    d.added.forEach(o => {
      if (have.has(o.id)) return;
      const c = cloneObj(o);
      c.rv = Math.max(revOf(o), cloudTombs.has(o.id) ? cloudTombs.get(o.id) : 0) + step;
      c.rvBy = me;
      cloudTombs.delete(o.id);
      cloudMine.add(o.id);
      have.set(o.id, board.objects.length);
      board.objects.push(c);
      out.added.push(c);
    });
    d.updated.forEach(u => {
      const idx = have.get(u.id);
      if (idx === undefined) return;
      const cur = board.objects[idx];
      const c = cloneObj(u.after);
      c.rv = Math.max(revOf(cur), revOf(u.after)) + step;
      c.rvBy = me;
      cloudMine.add(u.id);
      board.objects[idx] = c;
      out.updated.push({ id: u.id, before: cur, after: c });
    });
    return out;
  }

  /* ═══ Промпт №42: тяжёлые объекты (картинки) ═══
     У сообщения realtime есть предел размера, и всё, что в него не влезло,
     сервер выбрасывает МОЛЧА. Именно поэтому одна картинка у ученика
     появлялась, а другая — нет: разница была только в весе.
     Теперь в рассылку тяжёлый объект едет не целиком, а заглушкой с одним
     лишь номером; получатель по этому номеру забирает его из базы обычным
     запросом, где никакого предела нет. Лёгкие объекты (а это всё
     рукописное) как летали напрямую, так и летают. */
  const BROADCAST_LIMIT = 180 * 1024;   // запас к пределу сообщения realtime
  const HEAVY_OBJ_BYTES = 30 * 1024;    // с какого веса объект считаем тяжёлым

  function jsonLen(v){ try { return JSON.stringify(v).length; } catch (e) { return 0; } }

  function lightenDiff(diff) {
    if (jsonLen(diff) <= BROADCAST_LIMIT) return { diff, heavy: [] };
    const heavy = [];
    const light = (o) => {
      if (!o || jsonLen(o) <= HEAVY_OBJ_BYTES) return o;
      heavy.push(o.id);
      // Промпт №53: заглушка несёт номер версии — получатель по нему
      // понимает, что из базы пришло старьё, и спрашивает ещё раз
      return { id: o.id, __heavy: true, rv: revOf(o), rvBy: o.rvBy || '' };
    };
    const out = {
      added: diff.added.map(light),
      updated: diff.updated.map(u => ({ id: u.id, after: light(u.after) })),
      removed: diff.removed.map(r => ({ id: r.id, rv: revOf(r.obj) })),
    };
    return { diff: out, heavy };
  }

  // забрать тяжёлые объекты из базы. Запись собеседника могла ещё не дойти —
  // поэтому пробуем несколько раз с нарастающей паузой. expect — какой номер
  // версии мы ждём по каждому объекту: пока в базе лежит версия старше,
  // считаем, что запись ещё не дошла, и спрашиваем снова (Промпт №53)
  const HEAVY_RETRY_MS = [200, 600, 1500, 3000, 6000];
  async function fetchHeavyObjects(boardId, ids, attempt, expect) {
    attempt = attempt || 0;
    expect = expect || {};
    if (!ids.length || !boardId || boardId !== cloudBoardId) return;
    // Промпт №10: кусками — сверка теперь видит все объекты доски, и
    // недостающих может оказаться сотни; такой список номеров в одном адресе
    // запроса сервер не примет. Сбой куска — его номера просто пойдут на повтор
    const rows = [];
    for (const part of chunksOf(ids, IN_CHUNK)) {
      const res = await window.SB.from('board_objects')
        .select('obj_id, data').eq('board_id', boardId).in('obj_id', part);
      if (!res.error && res.data) rows.push(...res.data);
    }
    const board = window.getCurrentBoard();
    if (!board || board.cloudBoardId !== boardId || boardId !== cloudBoardId) return;
    const done = new Set();
    // пока ходили в базу, объект могли удалить — тогда он больше не нужен
    ids.forEach(id => { if (tombBlocks(id, expect[id] || 0)) done.add(id); });
    const applied = [];
    if (rows.length) {
      if (window.boardsStampMine) window.boardsStampMine();
      cloudApplyingRemote = true;
      rows.forEach(r => {
        if (!r.data || done.has(r.obj_id)) return;
        if (expect[r.obj_id] !== undefined && revOf(r.data) < expect[r.obj_id]) return;   // в базе ещё прошлая версия
        done.add(r.obj_id);
        if (acceptRemoteObject(board, r.data) === 'applied') applied.push(r.obj_id);
      });
      cloudApplyingRemote = false;
      if (applied.length) {
        if (window.boardsNoteForeignObjects) window.boardsNoteForeignObjects(applied);
        syncGestureBefore(board, applied);
        window.boardsRedraw();
      }
    }
    const left = ids.filter(id => !done.has(id));
    if (left.length && attempt < HEAVY_RETRY_MS.length) {
      setTimeout(() => fetchHeavyObjects(boardId, left, attempt + 1, expect), HEAVY_RETRY_MS[attempt]);
    } else if (left.length) {
      console.warn('[облачная доска] не удалось получить объекты:', left.join(', '));
    }
  }

  // наружу отдаём только для проверок — сама логика никуда больше не ходит
  window.__cloudDiffTest = {
    lightenDiff, BROADCAST_LIMIT, HEAVY_OBJ_BYTES,
    tombs: () => cloudTombs,
    writesIdle: () => cloudWriteChain,
    // Промпт №10
    loadState: () => cloudLoadState,
    seen: () => Array.from(cloudSeen),
    reconcileNow: () => reconcileOnce(cloudBoardId),
  };

  function pushDiffToSupabase(boardId, liveDiff) {
    // копия на момент правки: объекты в diff живые, и следующий жест успел
    // бы поменять их раньше, чем очередь дойдёт до записи в базу
    const diff = cloneObj(liveDiff);
    // отправляем немедленно, синхронно — так остальные участники видят
    // изменение сразу, не дожидаясь ни записи в базу, ни postgres_changes
    const { diff: forAir } = lightenDiff(diff);
    if (cloudChannel) {
      try { cloudChannel.send({ type: 'broadcast', event: 'board_diff', payload: { diff: forAir, uid: myUid() || null } }); } catch (e) {}
    }
    cloudWriteChain = cloudWriteChain
      .then(() => writeDiffToDb(boardId, diff))
      .catch(e => console.error('[облачная доска] ошибка записи:', e && e.message ? e.message : e));
    return cloudWriteChain;
  }

  // Промпт №53: запросы к базе строго по очереди. Параллельные запросы
  // приходили в базу в любом порядке: «размер 2» мог записаться раньше
  // «размера 1», а удаление — раньше предыдущего сохранения той же картинки,
  // и в базе оставалось старьё
  async function writeDiffToDb(boardId, diff) {
    const rows = diff.added.concat(diff.updated.map(u => u.after)).map(obj => ({
      board_id: boardId, obj_id: obj.id, data: obj,
      updated_by: myUid() || null,
    }));
    if (rows.length) {
      const { error } = await window.SB.from('board_objects').upsert(rows, { onConflict: 'board_id,obj_id' });
      // Промпт №10: помним, что записано, а что нет. Записанное — «было в
      // базе» (cloudSeen); незаписанное повторит сверка (cloudUnsynced), а не
      // молча останется только на этом экране до перезагрузки
      if (boardId === cloudBoardId) {
        rows.forEach(r => { if (error) cloudUnsynced.add(r.obj_id); else { cloudUnsynced.delete(r.obj_id); cloudSeen.add(r.obj_id); } });
        if (!error) saveSeenSoon();
      }
      if (error) console.error('[облачная доска] не удалось сохранить изменения:', error.message);
      // Промпт №42: запись прошла — говорим об этом отдельным лёгким
      // сообщением. Если первая рассылка потерялась, это второй шанс: по
      // номерам собеседник заберёт объекты из базы сам. Промпт №53: вместе с
      // номерами версий — чтобы забирали и то, что у них есть, но старее
      else if (cloudChannel && boardId === cloudBoardId) {
        const revs = {};
        rows.forEach(r => { revs[r.obj_id] = revOf(r.data); });
        try {
          cloudChannel.send({ type: 'broadcast', event: 'board_ready',
            payload: { ids: rows.map(r => r.obj_id), revs, uid: myUid() || null } });
        } catch (e) {}
      }
    }
    const ids = diff.removed.map(r => r.id);
    if (ids.length) {
      const { error } = await window.SB.from('board_objects').delete().eq('board_id', boardId).in('obj_id', ids);
      // Промпт №10: несостоявшееся удаление тоже повторяет сверка — иначе
      // при следующем входе объект честно придёт из базы и воскреснет
      if (boardId === cloudBoardId) ids.forEach(id => { if (error) cloudUnsyncedDel.add(id); else cloudUnsyncedDel.delete(id); });
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
    stampLocalDiff(diff);
    // в стек отмены — копию: живые объекты доски меняются дальше
    cloudUndoStack.push(cloneObj(diff));
    if (cloudUndoStack.length > 100) cloudUndoStack.shift();
    cloudRedoStack.length = 0;
    pushDiffToSupabase(cloudBoardId, diff);
  }

  function cloudUndo() {
    if (!cloudUndoStack.length) return;
    const diff = cloudUndoStack.pop();
    const board = window.getCurrentBoard();
    if (!board) return;
    cloudApplyingRemote = true;
    const sent = applyOwnDiff(board, invertDiff(diff));
    cloudApplyingRemote = false;
    cloudRedoStack.push(diff);
    window.boardsClearSelection();
    window.boardsRedraw();
    if (!diffIsEmpty(sent)) pushDiffToSupabase(cloudBoardId, sent);
  }
  function cloudRedo() {
    if (!cloudRedoStack.length) return;
    const diff = cloudRedoStack.pop();
    const board = window.getCurrentBoard();
    if (!board) return;
    cloudApplyingRemote = true;
    const sent = applyOwnDiff(board, diff);
    cloudApplyingRemote = false;
    cloudUndoStack.push(diff);
    window.boardsClearSelection();
    window.boardsRedraw();
    if (!diffIsEmpty(sent)) pushDiffToSupabase(cloudBoardId, sent);
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

  // Промпт №53: удаление через postgres_changes не несёт ничего, кроме
  // номера объекта, — ни версии, ни автора. Оно может прийти ПОСЛЕ того, как
  // объект вернули отменой, и снесло бы уже вернувшийся. Поэтому такое
  // удаление не применяем вслепую, а переспрашиваем у базы: запись в неё
  // идёт по очереди, и если объекта там действительно нет — удаляем
  let goneCheckIds = new Set();
  let goneCheckTimer = null;
  function scheduleGoneCheck(id) {
    goneCheckIds.add(id);
    if (goneCheckTimer) return;
    const boardId = cloudBoardId;
    goneCheckTimer = setTimeout(async () => {
      goneCheckTimer = null;
      const ids = Array.from(goneCheckIds);
      goneCheckIds = new Set();
      if (!ids.length || boardId !== cloudBoardId) return;
      // кусками (Промпт №10); сбой любого куска — не удаляем ничего
      const rows = [];
      for (const part of chunksOf(ids, IN_CHUNK)) {
        const res = await window.SB.from('board_objects')
          .select('obj_id').eq('board_id', boardId).in('obj_id', part);
        if (res.error || !res.data) return;
        rows.push(...res.data);
      }
      const board = window.getCurrentBoard();
      if (!board || board.cloudBoardId !== boardId || boardId !== cloudBoardId) return;
      const alive = new Set(rows.map(r => r.obj_id));
      const gone = ids.filter(id => !alive.has(id));
      if (!gone.length) return;
      if (window.boardsStampMine) window.boardsStampMine();
      cloudApplyingRemote = true;
      const removed = gone.filter(id => removeRemoteObject(board, id));
      cloudApplyingRemote = false;
      if (removed.length) { syncGestureBefore(board, removed); window.boardsRedraw(); }
    }, 400);
  }

  function cloudHandleRemoteChange(payload) {
    const board = window.getCurrentBoard();
    if (!board || !cloudBoardId) return;
    if (payload.eventType === 'DELETE') {
      const oldId = payload.old && payload.old.obj_id;
      if (oldId && board.objects.some(o => o.id === oldId)) scheduleGoneCheck(oldId);
      return;
    }
    const row = payload.new || {};
    // своё эхо не применяем: оно может прийти уже после следующей моей
    // правки того же объекта и откатить её (так «сам собой» отменялся
    // второй подряд размер картинки)
    if (row.updated_by && row.updated_by === myUid()) return;
    const obj = row.data;
    if (!obj) return;
    if (window.boardsStampMine) window.boardsStampMine();   // Промпт №41
    cloudApplyingRemote = true;
    const res = acceptRemoteObject(board, obj);
    cloudApplyingRemote = false;
    if (res !== 'applied') return;
    // пришедшее от собеседника своим не считается
    if (window.boardsNoteForeignObjects) window.boardsNoteForeignObjects([obj.id]);
    syncGestureBefore(board, [obj.id]);
    window.boardsRedraw();
  }

  function cloudHandleRemoteDiff(payload) {
    const board = window.getCurrentBoard();
    if (!board || !cloudBoardId || !payload || !payload.diff) return;
    // моё же сообщение возвращается мне тем же broadcast-каналом (эхо) —
    // я его уже применил локально в момент рисования, применять второй раз
    // не нужно (см. тот же приём у курсоров, cloudHandleRemoteCursor)
    if (payload.uid && window.CURRENT_USER && payload.uid === window.CURRENT_USER.id) return;
    // Промпт №42: заглушки тяжёлых объектов не применяем — по ним идём в базу
    const heavyIds = [];
    const expect = {};
    const touched = [];
    const incoming = (payload.diff.added || []).concat((payload.diff.updated || []).map(u => u && u.after));
    if (window.boardsStampMine) window.boardsStampMine();   // Промпт №41
    cloudApplyingRemote = true;
    (payload.diff.removed || []).forEach(r => {
      if (!r || !r.id) return;
      if (removeRemoteObject(board, r.id, Math.max(r.rv || 0, revOf(r.obj)))) touched.push(r.id);
    });
    incoming.forEach(o => {
      if (!o || !o.id) return;
      if (o.__heavy) {
        if (tombBlocks(o.id, revOf(o))) return;
        const local = board.objects.find(x => x.id === o.id);
        if (local && !incomingWins(o, local)) return;
        heavyIds.push(o.id);
        expect[o.id] = revOf(o);
        return;
      }
      if (acceptRemoteObject(board, o) === 'applied') touched.push(o.id);
    });
    cloudApplyingRemote = false;
    if (touched.length && window.boardsNoteForeignObjects) window.boardsNoteForeignObjects(touched);
    if (heavyIds.length) fetchHeavyObjects(cloudBoardId, heavyIds, 0, expect);
    // если у меня прямо сейчас идёт свой незавершённый жест — обновляем и
    // его «снимок до», чтобы чужое изменение не попало в diff как моё
    syncGestureBefore(board, touched);
    if (touched.length) window.boardsRedraw();
  }

  // что из объявленного (номер и версия) нам стоит забрать из базы
  function wantedFromAnnounce(board, list) {
    const have = new Map(board.objects.map(o => [o.id, o]));
    const ids = [], expect = {};
    list.forEach(({ id, rv }) => {
      if (rv === undefined) {
        // старый клиент без версий — как раньше, только недостающее
        if (!have.has(id) && !cloudTombs.has(id)) ids.push(id);
        return;
      }
      if (tombBlocks(id, rv)) return;
      const local = have.get(id);
      if (!local || revOf(local) < rv) { ids.push(id); expect[id] = rv; }
    });
    return { ids, expect };
  }

  /* ═══ Промпт №10 (новый список): версии общей доски ═══
     У обычных досок есть автоматические копии всего хранилища (db_snap1..3,
     раз в 15 минут), у общих — не было ничего: главная копия лежит в базе,
     истории там нет, и когда доска пустела при входе, откатиться было не к
     чему. Теперь на каждом устройстве хранятся последние VER_MAX версий
     каждой общей доски: при входе (до сверки с базой — это главное), раз в
     десять минут работы, при выходе и перед каждым восстановлением. Версия
     пишется, только если доска с прошлой версии изменилась.

     Картинки (задания с тренажёров, вставки) весят в сотни раз больше
     штрихов и почти не меняются. Если класть их в каждую версию, дюжина
     версий доски с заданиями — это сотни мегабайт на диске (а раздутое
     хранилище уже роняло вкладку, см. HANDOFF, раздел 6). Поэтому картинка
     лежит один раз в пуле `cloudimg:<доска>:<хэш>`, а в версии — только
     ссылка `__img`. Пул чистится, когда картинку перестаёт упоминать хоть
     одна версия.

     Восстановление — два действия в панели «Совместная работа»:
     «Вернуть пропавшее» (дописывает объекты версии, которых сейчас нет, и
     больше ничего не трогает) и «Откатить» (доска становится ровно такой,
     как в версии). Оба идут обычной своей правкой: в базу, собеседнику и в
     историю отмены — Ctrl+Z возвращает как было. */
  const VER_MAX = 12;
  const VER_EVERY_MS = 10 * 60 * 1000;
  const VER_REASON = {
    open: 'при входе', auto: 'во время работы', close: 'при выходе',
    restore: 'перед восстановлением', manual: 'вручную',
  };
  let verChain = Promise.resolve();
  let lastVerAt = 0;

  function verMetaKey(cb) { return 'cloudver:' + cb; }
  function verSlotKey(cb, slot) { return 'cloudver:' + cb + ':' + slot; }
  function verImgKey(cb, h) { return 'cloudimg:' + cb + ':' + h; }

  // хэш строки картинки: два независимых 32-битных плюс длина — совпадение
  // двух разных картинок практически исключено. Картинки на доске те же
  // строки из раза в раз, поэтому хэш кэшируется (сбрасывается при смене доски)
  const srcHashCache = new Map();
  function srcHash(s) {
    let h = srcHashCache.get(s);
    if (h) return h;
    let a = 0x811c9dc5, b = 0;
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      a = Math.imul(a ^ c, 0x01000193);
      b = (Math.imul(b, 31) + c) | 0;
    }
    h = (a >>> 0).toString(36) + '_' + (b >>> 0).toString(36) + '_' + s.length.toString(36);
    srcHashCache.set(s, h);
    return h;
  }
  // подпись содержимого — чтобы не писать версию, если ничего не поменялось
  function boardSig(objects) {
    let a = 0x811c9dc5;
    objects.forEach(o => {
      const t = (o && o.id) + '@' + revOf(o);
      for (let i = 0; i < t.length; i++) a = Math.imul(a ^ t.charCodeAt(i), 0x01000193);
    });
    return objects.length + ':' + (a >>> 0).toString(36);
  }

  // force — писать, даже если с прошлой версией не отличается
  function saveVersion(board, reason, force) {
    const cb = board && board.cloudBoardId;
    if (!cb || !Array.isArray(board.objects) || !window.idbGet || !window.idbPut) return Promise.resolve(false);
    if (!board.objects.length && !force) return Promise.resolve(false);
    // снимок — сразу, синхронно: к моменту записи доска уже будет другой
    const sig = boardSig(board.objects);
    const imgs = new Map();
    const snapshot = JSON.parse(JSON.stringify(board.objects.map(o => {
      if (o && o.type === 'image' && typeof o.src === 'string' && o.src.length > 256) {
        const h = srcHash(o.src);
        imgs.set(h, o.src);
        return Object.assign({}, o, { src: null, __img: h });
      }
      return o;
    })));
    const at = Date.now();
    lastVerAt = at;
    verChain = verChain.then(async () => {
      const meta = (await window.idbGet(verMetaKey(cb))) || { list: [], pool: [] };
      const list = Array.isArray(meta.list) ? meta.list.slice() : [];
      if (!force && list.length && list[0].sig === sig) return false;
      const pool = new Set(meta.pool || []);
      for (const [h, src] of imgs) {
        if (pool.has(h)) continue;
        await window.idbPut(verImgKey(cb, h), src);
        pool.add(h);
      }
      let slot;
      if (list.length >= VER_MAX) slot = list.pop().slot;
      else { const used = new Set(list.map(v => v.slot)); slot = 0; while (used.has(slot)) slot++; }
      await window.idbPut(verSlotKey(cb, slot), { at, objects: snapshot });
      list.unshift({ slot, at, reason, count: snapshot.length, sig, imgs: Array.from(imgs.keys()) });
      // картинки, которые больше не упоминает ни одна версия, — из пула долой
      const keep = new Set();
      list.forEach(v => (v.imgs || []).forEach(h => keep.add(h)));
      for (const h of Array.from(pool)) {
        if (keep.has(h)) continue;
        if (window.idbDelete) await window.idbDelete(verImgKey(cb, h));
        pool.delete(h);
      }
      await window.idbPut(verMetaKey(cb), { list, pool: Array.from(pool) });
      return true;
    }).catch(e => { console.warn('[облачная доска] версию доски сохранить не удалось:', e && e.message ? e.message : e); return false; });
    return verChain;
  }
  function listVersions(cb) {
    if (!cb || !window.idbGet) return Promise.resolve([]);
    return verChain.then(() => window.idbGet(verMetaKey(cb)))
      .then(meta => (meta && Array.isArray(meta.list)) ? meta.list : []).catch(() => []);
  }
  // объекты версии с картинками из пула; картинка пропала из пула — объект
  // пропускаем (картинка без src на доске была бы пустой рамкой)
  async function loadVersionObjects(cb, entry) {
    const rec = await window.idbGet(verSlotKey(cb, entry.slot));
    if (!rec || !Array.isArray(rec.objects) || rec.at !== entry.at) return null;
    const cache = new Map();
    const out = [];
    for (const o of rec.objects) {
      if (o && o.__img) {
        if (!cache.has(o.__img)) cache.set(o.__img, await window.idbGet(verImgKey(cb, o.__img)).catch(() => null));
        const src = cache.get(o.__img);
        if (!src) continue;
        const c = Object.assign({}, o, { src });
        delete c.__img;
        out.push(c);
      } else out.push(o);
    }
    return out;
  }
  // без номера версии и автора версии — сравниваем само содержимое
  function bareJson(o) { const c = Object.assign({}, o); delete c.rv; delete c.rvBy; return JSON.stringify(c); }

  // mode: 'missing' — вернуть пропавшее; 'rollback' — ровно как в версии
  async function restoreVersion(entry, mode) {
    const board = window.getCurrentBoard();
    const cb = cloudBoardId;
    if (!board || !cb || board.cloudBoardId !== cb) return { error: 'Доска закрыта' };
    if ((ROLE_ACCESS[cloudRole] || 'full') !== 'full') return { error: 'Восстанавливать может только владелец или полный доступ' };
    const objs = await loadVersionObjects(cb, entry);
    if (!objs) return { error: 'Эта версия не читается — возможно, её уже вытеснила более новая' };
    if (window.getCurrentBoard() !== board || cloudBoardId !== cb) return { error: 'Доска закрыта' };
    // свой незавершённый жест — сначала отправить, иначе он смешается с восстановлением
    if (cloudGestureBefore !== null) cloudFinalizeGesture();
    saveVersion(board, 'restore', true);
    const cur = new Map(board.objects.map(o => [o.id, o]));
    const inVer = new Set(objs.map(o => o.id));
    const d = { added: [], updated: [], removed: [] };
    objs.forEach(o => {
      const now = cur.get(o.id);
      if (!now) d.added.push(o);
      else if (mode === 'rollback' && bareJson(now) !== bareJson(o)) d.updated.push({ id: o.id, before: now, after: o });
    });
    if (mode === 'rollback') board.objects.forEach(o => { if (!inVer.has(o.id)) d.removed.push({ id: o.id, obj: o }); });
    if (diffIsEmpty(d)) return { n: 0 };
    if (window.boardsStampMine) window.boardsStampMine();
    cloudApplyingRemote = true;
    const sent = applyOwnDiff(board, d, 1000);
    cloudApplyingRemote = false;
    // возвращённое — не «моё» по авторству: у объектов свой by из версии
    if (window.boardsNoteForeignObjects) window.boardsNoteForeignObjects(sent.added.map(o => o.id));
    cloudUndoStack.push(cloneObj(sent));
    if (cloudUndoStack.length > 100) cloudUndoStack.shift();
    cloudRedoStack.length = 0;
    window.boardsClearSelection();
    window.boardsRedraw();
    pushDiffToSupabase(cb, sent);
    // правка: пусть обычное сохранение запишет доску на диск
    window.saveDB();
    return { n: sent.added.length + sent.updated.length + sent.removed.length,
             added: sent.added.length, removed: sent.removed.length, updated: sent.updated.length };
  }

  // версия во время работы — раз в VER_EVERY_MS, если было что менять
  setInterval(() => {
    const board = window.getCurrentBoard && window.getCurrentBoard();
    if (!cloudBoardId || !board || board.cloudBoardId !== cloudBoardId) return;
    if (cloudLoadState !== 'done') return;   // пока доска не сверена с базой — версия была бы полуготовой
    if (Date.now() - lastVerAt < VER_EVERY_MS) return;
    saveVersion(board, 'auto');
  }, 60 * 1000);
  // и при закрытии вкладки — запись может не успеть, но обычно успевает
  window.addEventListener('pagehide', () => {
    const board = window.getCurrentBoard && window.getCurrentBoard();
    if (cloudBoardId && board && board.cloudBoardId === cloudBoardId && cloudLoadState === 'done') saveVersion(board, 'close');
    flushSeen();
  });

  // для проверок и для ручной работы из консоли
  window.__cloudVersions = {
    list: () => listVersions(cloudBoardId),
    saveNow: (reason) => { const b = window.getCurrentBoard(); return saveVersion(b, reason || 'manual', true); },
    restore: async (i, mode) => { const l = await listVersions(cloudBoardId); return l[i] ? restoreVersion(l[i], mode || 'missing') : { error: 'нет такой версии' }; },
  };

  function fmtVerTime(ts) {
    const d = new Date(ts);
    const p = (n) => String(n).padStart(2, '0');
    return p(d.getDate()) + '.' + p(d.getMonth() + 1) + ', ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function objWord(n) {
    const t = n % 10, h = n % 100;
    return (t === 1 && h !== 11) ? 'объект' : (t >= 2 && t <= 4 && (h < 12 || h > 14)) ? 'объекта' : 'объектов';
  }
  async function renderVersionsList(message, isError) {
    const box = document.getElementById('bdShareVersList');
    if (!box) return;
    const cb = cloudBoardId;
    const list = await listVersions(cb);
    if (!document.getElementById('bdShareVersList') || cb !== cloudBoardId) return;
    const rows = list.map((v, i) => `
      <div class="bd-ver-row" data-i="${i}">
        <div class="bd-ver-info"><b>${fmtVerTime(v.at)}</b> · ${v.count} ${objWord(v.count)} · ${VER_REASON[v.reason] || VER_REASON.manual}</div>
        <div class="bd-ver-acts">
          <button class="bd-ver-missing" data-i="${i}" title="Дописать на доску то, что есть в этой версии и чего сейчас нет. Остальное не трогается">Вернуть пропавшее</button>
          <button class="bd-ver-rollback" data-i="${i}" title="Сделать доску ровно такой, как в этой версии">Откатить</button>
        </div>
      </div>`).join('');
    box.innerHTML = `
      <div class="bd-share-hint">Версии хранятся на этом устройстве, последние ${VER_MAX}. Восстановление можно отменить (Ctrl+Z).</div>
      ${rows || '<div class="bd-share-hint">Пока ни одной версии.</div>'}
      <button class="bd-ver-save" id="bdVerSaveBtn">Сохранить версию сейчас</button>
      ${message ? `<div class="bd-share-msg${isError ? ' err' : ''}">${message}</div>` : ''}`;
    const act = async (i, mode) => {
      const res = await restoreVersion(list[i], mode);
      if (res.error) renderVersionsList(res.error, true);
      else if (!res.n) renderVersionsList(mode === 'missing' ? 'Всё из этой версии уже на доске.' : 'Доска и так совпадает с этой версией.');
      else renderVersionsList(mode === 'missing'
        ? `Возвращено: ${res.added} ${objWord(res.added)}.`
        : `Доска откатена: вернулось ${res.added}, убрано ${res.removed}, изменено обратно ${res.updated}.`);
    };
    box.querySelectorAll('.bd-ver-missing').forEach(btn => btn.addEventListener('click', () => act(+btn.dataset.i, 'missing')));
    box.querySelectorAll('.bd-ver-rollback').forEach(btn => btn.addEventListener('click', () => {
      // откат убирает с доски всё, чего не было в версии, — второе нажатие
      // как подтверждение (системное окно подтверждения здесь не годится:
      // оно останавливает страницу, пока его не закроют)
      if (btn.dataset.armed === '1') { btn.dataset.armed = ''; act(+btn.dataset.i, 'rollback'); return; }
      btn.dataset.armed = '1';
      btn.textContent = 'Точно откатить?';
      setTimeout(() => { if (btn.isConnected && btn.dataset.armed === '1') { btn.dataset.armed = ''; btn.textContent = 'Откатить'; } }, 4000);
    }));
    const saveBtn = document.getElementById('bdVerSaveBtn');
    if (saveBtn) saveBtn.addEventListener('click', async () => {
      const b = window.getCurrentBoard();
      await saveVersion(b, 'manual', true);
      renderVersionsList('Версия сохранена.');
    });
  }

  async function cloudSetupSubscription(boardId, board) {
    // Промпт №10: сначала канал, потом загрузка. Раньше канал открывался
    // только после ответа базы, и всё, что собеседник успел сделать за время
    // запроса, до нас не доходило вовсе (до сверки через полминуты). Пришедшее
    // во время загрузки ложится на доску и сравнивается с ответом базы по
    // номерам версий — порядок прихода ничего не решает
    cloudChannel = window.SB.channel('board_objects:' + boardId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'board_objects', filter: 'board_id=eq.' + boardId }, cloudHandleRemoteChange)
      // курсоры — тем же каналом, но отдельным типом сообщений: broadcast
      // ничего не пишет в базу (в отличие от postgres_changes выше), это
      // ровно то, что нужно для эфемерного "где сейчас мышь"
      .on('broadcast', { event: 'cursor' }, ({ payload }) => cloudHandleRemoteCursor(payload))
      // быстрый путь для самих объектов доски — см. pushDiffToSupabase выше;
      // postgres_changes (обработчик над этим) остаётся как подстраховка
      .on('broadcast', { event: 'board_diff' }, ({ payload }) => cloudHandleRemoteDiff(payload))
      // Промпт №42: «объекты записаны, заберите их сами» — страховка на случай,
      // если основная рассылка не долетела
      .on('broadcast', { event: 'board_ready' }, ({ payload }) => {
        if (!payload || !payload.ids) return;
        if (payload.uid && window.CURRENT_USER && payload.uid === window.CURRENT_USER.id) return;
        const b = window.getCurrentBoard();
        if (!b) return;
        const revs = payload.revs || {};
        const { ids, expect } = wantedFromAnnounce(b, payload.ids.map(id => ({ id, rv: revs[id] })));
        if (ids.length) fetchHeavyObjects(cloudBoardId, ids, 0, expect);
      })
      .subscribe();
    startReconcile(boardId);
    cloudInitialLoad(boardId, board, cloudLoadGen, 0);
  }

  // Промпт №10: загрузка общей доски при входе — слиянием, а не заменой.
  // Подробности — в комментарии у cloudSeen выше
  async function cloudInitialLoad(boardId, board, gen, attempt) {
    const alive = () => gen === cloudLoadGen && boardId === cloudBoardId && window.getCurrentBoard() === board;
    if (!alive()) return;
    cloudLoadState = 'loading';
    if (attempt === 0) {
      // версия того, что лежит на этом устройстве, — до того, как база
      // хоть что-то на доске поменяет: если сверка ошибётся, отсюда всё
      // возвращается кнопкой (раздел «Версии» ниже)
      if (board.objects.length) saveVersion(board, 'open');
      const ids = await loadSeen(boardId);
      if (!alive()) return;
      if (ids) { ids.forEach(id => cloudSeen.add(id)); cloudSeenKnown = true; }
    }
    // что знали о базе ДО запроса: пока он идёт, свои записи пополняют
    // cloudSeen, и объект, записанный прямо сейчас, но не попавший в ответ,
    // выглядел бы удалённым собеседником
    const seenBefore = cloudSeenKnown ? new Set(cloudSeen) : null;
    const res = await selectAllPaged(boardId, 'obj_id, data', PAGE_DATA);
    if (!alive()) return;
    if (res.error) console.error('[облачная доска] не удалось загрузить объекты:', res.error.message || res.error);

    const server = new Map();
    res.rows.forEach(r => { if (r && r.data && r.data.id) server.set(r.data.id, r.data); });
    const complete = res.complete;
    const me = myUid();
    const access = ROLE_ACCESS[cloudRole] || 'full';
    const canWrite = access !== 'view';
    const full = access === 'full';

    if (window.boardsStampMine) window.boardsStampMine();   // Промпт №41
    cloudApplyingRemote = true;
    let next = board.objects.slice();
    const at = new Map(next.map((o, i) => [o.id, i]));
    const touched = [], upAdded = [], upUpdated = [];
    // 1) что есть в базе — берём, если там не старее нашего
    server.forEach(inc => {
      if (tombBlocks(inc.id, revOf(inc))) return;        // удалили, пока шёл запрос
      const i = at.get(inc.id);
      if (i === undefined) { at.set(inc.id, next.length); next.push(cloneObj(inc)); touched.push(inc.id); return; }
      const local = next[i];
      if (incomingWins(inc, local)) {
        // одна и та же версия одного автора — одно и то же содержимое (любая
        // правка поднимает номер); не сериализуем зря картинки по сотне КБ
        const sameVer = revOf(inc) > 0 && revOf(inc) === revOf(local) && (inc.rvBy || '') === (local.rvBy || '');
        if (!sameVer && JSON.stringify(local) !== JSON.stringify(inc)) { next[i] = cloneObj(inc); touched.push(inc.id); }
      } else if (canWrite && !cloudMine.has(inc.id)) {
        // у нас версия новее, а в базе её нет — запись когда-то не дошла
        upUpdated.push({ id: inc.id, before: inc, after: local });
      }
    });
    // 2) чего в базе нет. Решаем, только если ответ точно полный: иначе
    // «нет в ответе» не значит «нет в базе»
    const drop = new Set();
    if (complete) {
      next.forEach(o => {
        if (server.has(o.id) || cloudMine.has(o.id)) return;   // своё из этой сессии — уже в очереди записи
        // «моё» — подписанное мной; неподписанное (нарисованное до того, как
        // доску сделали общей) считаем своим у владельца и полного доступа
        const mine = o.by ? o.by === me : full;
        let keep;
        if (server.size === 0) keep = true;               // пустая база не опустошает доску
        else if (seenBefore) keep = !seenBefore.has(o.id); // было в базе и пропало — удалил собеседник
        else keep = mine;   // первый вход после обновления: памяти о базе нет — своё дописываем, чужое старьё не воскрешаем
        if (!keep) { drop.add(o.id); return; }
        if (canWrite && (mine || full)) upAdded.push(o);
      });
    }
    if (drop.size) {
      next = next.filter(o => {
        if (!drop.has(o.id)) return true;
        addTomb(o.id, revOf(o)); touched.push(o.id);
        return false;
      });
    }
    board.objects = next;
    // память «что было в базе»: при полном ответе — ровно ответ плюс
    // записанное мной за время запроса; при неполном — только пополняем
    if (complete) {
      const s = new Set(server.keys());
      cloudSeen.forEach(id => { if (cloudMine.has(id)) s.add(id); });
      // удалённое остаётся в памяти навсегда — см. removeRemoteObject
      if (seenBefore) seenBefore.forEach(id => s.add(id));
      cloudSeen = s;
    } else {
      server.forEach((_, id) => cloudSeen.add(id));
    }
    cloudSeenKnown = true;
    saveSeenSoon();
    if (window.boardsNoteForeignObjects) window.boardsNoteForeignObjects(Array.from(server.keys()));
    cloudApplyingRemote = false;
    // у меня мог идти свой жест — пришедшее не должно уйти в него как моё
    syncGestureBefore(board, touched);
    if (touched.length) { persistBoardQuiet(board); window.boardsRedraw(); }
    // несостоявшиеся записи — дописать (собеседнику они уйдут тем же путём)
    if (upAdded.length || upUpdated.length) {
      console.info('[облачная доска] дописываю в базу то, что туда не дошло:', upAdded.length + upUpdated.length);
      pushDiffToSupabase(boardId, { added: upAdded, updated: upUpdated, removed: [] });
    }
    if (complete) { cloudLoadState = 'done'; return; }
    if (attempt < LOAD_RETRY_MS.length) {
      cloudLoadState = 'retry';
      setTimeout(() => cloudInitialLoad(boardId, board, gen, attempt + 1), LOAD_RETRY_MS[attempt]);
    } else {
      cloudLoadState = 'failed';
      console.warn('[облачная доска] доска загрузилась не полностью — недостающее докачает сверка');
    }
  }

  /* Промпт №42: последняя линия обороны. Раз в полминуты спрашиваем у базы
     один только список номеров объектов (это несколько килобайт, не больше)
     и, если у нас чего-то нет, докачиваем. Ничего не удаляем: свои объекты
     могут быть ещё не записаны. Так «картинка не появилась» перестаёт быть
     необратимым — максимум полминуты, и она придёт сама.
     Промпт №53: вместе с номерами берём и версии — чтобы докачивать и то,
     что у нас есть, но устарело, и НЕ воскрешать удалённое у нас.
     Промпт №10 (новый список): список — постранично (раньше сверка видела
     только первую тысячу номеров), и здесь же повторяются несостоявшиеся
     записи и удаления */
  let reconcileTimer = null;
  async function reconcileOnce(boardId) {
    if (!cloudBoardId || cloudBoardId !== boardId) return;
    const board = window.getCurrentBoard();
    if (!board || board.cloudBoardId !== boardId) return;
    // первая загрузка так и не прошла целиком — пробуем её заново
    if (cloudLoadState === 'failed') { cloudInitialLoad(boardId, board, cloudLoadGen, LOAD_RETRY_MS.length); return; }
    if (cloudLoadState !== 'done') return;
    let res = await selectAllPaged(boardId, 'obj_id, rv:data->rv', PAGE_LIGHT);
    if (res.error && !res.rows.length) {
      // если выборка по полю внутри json вдруг не пройдёт — только номера
      res = await selectAllPaged(boardId, 'obj_id', PAGE_LIGHT);
    }
    if (boardId !== cloudBoardId || window.getCurrentBoard() !== board) return;
    if (res.rows.length) {
      const { ids, expect } = wantedFromAnnounce(board, res.rows.map(r => ({
        id: r.obj_id, rv: typeof r.rv === 'number' ? r.rv : (r.rv === undefined ? undefined : 0),
      })));
      if (ids.length) fetchHeavyObjects(boardId, ids, 0, expect);
    }
    if (cloudUnsynced.size && ROLE_ACCESS[cloudRole] !== 'view') {
      const again = board.objects.filter(o => cloudUnsynced.has(o.id));
      cloudUnsynced.clear();
      if (again.length) pushDiffToSupabase(boardId, { added: again, updated: [], removed: [] });
    }
    if (cloudUnsyncedDel.size && ROLE_ACCESS[cloudRole] !== 'view') {
      const onBoard = new Set(board.objects.map(o => o.id));
      const gone = Array.from(cloudUnsyncedDel).filter(id => !onBoard.has(id));
      cloudUnsyncedDel.clear();
      if (gone.length) pushDiffToSupabase(boardId, { added: [], updated: [],
        removed: gone.map(id => ({ id, obj: { id, rv: cloudTombs.get(id) || 0 } })) });
    }
  }
  function startReconcile(boardId) {
    stopReconcile();
    reconcileTimer = setInterval(() => {
      if (document.hidden) return;
      reconcileOnce(boardId);
    }, 30000);
  }
  function stopReconcile() { if (reconcileTimer) { clearInterval(reconcileTimer); reconcileTimer = null; } }
  function cloudTeardownSubscription() {
    if (cloudChannel) {
      // по-хорошему сообщаем остальным, что нас больше нет — на случай
      // сбоя всё равно есть подстраховка по таймауту (setInterval выше)
      try { cloudChannel.send({ type: 'broadcast', event: 'cursor', payload: { uid: window.CURRENT_USER ? window.CURRENT_USER.id : null, leave: true } }); } catch (e) {}
      window.SB.removeChannel(cloudChannel);
      cloudChannel = null;
    }
    stopCursorAnim();
    clearAllCursors();
    stopReconcile();
    clearTimeout(goneCheckTimer); goneCheckTimer = null; goneCheckIds = new Set();
  }

  window.onBoardOpened = function (board) {
    cloudTeardownSubscription();
    flushSeen();
    cloudUndoStack = []; cloudRedoStack = []; cloudGestureBefore = null;
    cloudTombs = new Map();
    // Промпт №10: всё, что относится к прошлому открытию, — забыть
    cloudLoadGen++;
    cloudLoadState = 'idle';
    cloudSeen = new Set(); cloudSeenKnown = false;
    cloudMine = new Set(); cloudUnsynced = new Set(); cloudUnsyncedDel = new Set();
    srcHashCache.clear();
    cloudBoardId = board.cloudBoardId || null;
    cloudRole = board.cloudRole || null;
    // Промпт №41: доска сама должна знать, что этому человеку на ней можно
    if (window.setBoardAccess) {
      window.setBoardAccess(cloudBoardId ? (ROLE_ACCESS[cloudRole] || 'full') : 'full',
                            window.CURRENT_USER && window.CURRENT_USER.id);
    }
    if (cloudBoardId) { lastVerAt = Date.now(); cloudSetupSubscription(cloudBoardId, board); startCursorAnim(); }
  };
  window.onBoardClosed = function () {
    // Промпт №10: версия доски на выходе (если с прошлой что-то поменялось)
    const board = window.getCurrentBoard();
    if (cloudBoardId && board && board.cloudBoardId === cloudBoardId) saveVersion(board, 'close');
    cloudTeardownSubscription();
    flushSeen();
    cloudLoadGen++;
    cloudBoardId = null; cloudRole = null;
    if (window.setBoardAccess) window.setBoardAccess('full', window.CURRENT_USER && window.CURRENT_USER.id);
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
      // Промпт №10: кусками — доска с картинками одним запросом может не
      // пройти целиком. Не записавшееся не теряется: при открытии ниже
      // (onBoardOpened) загрузка увидит, что этого в базе нет, и допишет
      for (const part of chunksOf(rows, 100)) {
        const { error: upErr } = await window.SB.from('board_objects').upsert(part, { onConflict: 'board_id,obj_id' });
        if (upErr) console.error('[облачная доска] не удалось записать часть доски:', upErr.message);
      }
    }
    window.saveDB();
    window.onBoardOpened(board);
    renderSharePanel();
  }

  /* ═══ Промпт №41: три уровня доступа вместо двух ═══
     В базе роль хранится строкой; 'editor' и 'admin' там были и раньше,
     добавился 'viewer'. Подпись у каждой роли одна на всё приложение —
     и в списке, и в выпадающем списке при приглашении. */
  const ROLE_LABEL = {
    owner:  'владелец',
    admin:  'полный доступ',
    editor: 'только свои записи',
    viewer: 'только просмотр',
  };
  // что это значит для самой доски (см. setBoardAccess в boards-core.js)
  const ROLE_ACCESS = { owner: 'full', admin: 'full', editor: 'own', viewer: 'view' };
  function roleOptions(sel){
    return ['editor', 'admin', 'viewer']
      .map(r => `<option value="${r}"${r === sel ? ' selected' : ''}>${ROLE_LABEL[r]}</option>`).join('');
  }
  const ROLE_DB_HINT = 'База пока не знает такой уровень доступа. Его нужно один раз разрешить в настройках базы — см. подсказку в HANDOFF.';
  function roleError(error){ return /viol|check|constraint|invalid/i.test(error.message || '') ? ROLE_DB_HINT : null; }
  async function changeRole(userId, role) {
    if (!cloudBoardId) return;
    const { error } = await window.SB.from('board_access')
      .upsert({ board_id: cloudBoardId, user_id: userId, role }, { onConflict: 'board_id,user_id' });
    if (error) { renderSharePanel(roleError(error) || ('Не получилось изменить: ' + error.message), true); return; }
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
    if (error) { renderSharePanel(roleError(error) || ('Не получилось добавить: ' + error.message), true); return; }
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
      const what = board.cloudRole === 'viewer'
        ? 'Вы видите её, но рисовать на ней нельзя.'
        : 'Вы можете писать на ней и править то, что написали сами.';
      sharePop.innerHTML = `
        <div class="bd-share-title">Совместная работа</div>
        <div class="bd-share-hint">Это общая доска. ${what} Управлять списком доступа может только её владелец.</div>
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
          <span class="who" title="${emailById.get(r.user_id) || r.user_id}">${emailById.get(r.user_id) || r.user_id}</span>
          <select class="bd-share-rolesel" data-uid="${r.user_id}">${roleOptions(r.role)}</select>
          <button class="bd-share-revoke" data-uid="${r.user_id}">Убрать</button>
        </div>`).join('');
    }
    sharePop.innerHTML = `
      <div class="bd-share-title">Совместная работа</div>
      <div class="bd-share-hint">У кого есть доступ к этой доске:</div>
      ${peopleHtml || '<div class="bd-share-hint">Пока никого, кроме вас.</div>'}
      <div class="bd-share-invite">
        <input type="email" id="bdShareEmail" placeholder="email ученика">
        <select id="bdShareRole">${roleOptions('editor')}</select>
        <button class="primary" id="bdShareAddBtn">Добавить</button>
      </div>
      ${message ? `<div class="bd-share-msg${isError ? ' err' : ''}">${message}</div>` : ''}
      <div class="bd-share-vers">
        <button class="bd-share-vers-btn" id="bdShareVersBtn">Версии доски</button>
        <div id="bdShareVersList"></div>
      </div>
    `;
    // Промпт №10: версии общей доски — см. saveVersion
    document.getElementById('bdShareVersBtn').addEventListener('click', () => renderVersionsList());
    sharePop.querySelectorAll('.bd-share-revoke').forEach(btn => {
      btn.addEventListener('click', () => revokeAccess(btn.dataset.uid));
    });
    sharePop.querySelectorAll('.bd-share-rolesel').forEach(sel => {
      sel.addEventListener('change', () => changeRole(sel.dataset.uid, sel.value));
    });
    document.getElementById('bdShareAddBtn').addEventListener('click', () => {
      const email = document.getElementById('bdShareEmail').value.trim();
      const role = document.getElementById('bdShareRole').value;
      if (!email) { renderSharePanel('Введите email.', true); return; }
      inviteToBoard(email, role);
    });
  }

  // ------------------------------------------------------------------
  // отправка СВОЕГО курсора остальным участникам общей доски — на любое
  // движение мыши над холстом, независимо от инструмента: можно просто
  // водить курсором (или обвести им что-то) без единого штриха, и другой
  // участник это увидит; собственно рисование при этом продолжает
  // работать как и раньше, это отдельный, самостоятельный поток данных
  // ------------------------------------------------------------------
  const boardCanvasEl = document.getElementById('boardCv');
  if (boardCanvasEl) {
    boardCanvasEl.addEventListener('pointermove', (e) => {
      if (!cloudBoardId || !window.eventWorld) return;
      const pt = window.eventWorld(e);
      scheduleCursorSend(pt.x, pt.y, myPointerDown);
    });
    boardCanvasEl.addEventListener('pointerdown', () => { myPointerDown = true; });
    boardCanvasEl.addEventListener('pointerleave', () => { if (cloudBoardId) scheduleCursorSend(0, 0, false, true); });
  }
  window.addEventListener('pointerup', () => { myPointerDown = false; });
  window.addEventListener('pointercancel', () => { myPointerDown = false; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && cloudBoardId) scheduleCursorSend(0, 0, false, true);
  });

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
