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
        entry.el.style.transform = `translate(${Math.round(rect.left + s.x)}px, ${Math.round(rect.top + s.y)}px)`;
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
  function applyDiffLocally(board, d) {
    d.removed.forEach(r => { board.objects = board.objects.filter(o => o.id !== r.id); });
    d.added.forEach(o => { if (!board.objects.some(x => x.id === o.id)) board.objects.push(JSON.parse(JSON.stringify(o))); });
    d.updated.forEach(u => {
      const idx = board.objects.findIndex(o => o.id === u.id);
      if (idx >= 0) board.objects[idx] = JSON.parse(JSON.stringify(u.after));
    });
  }

  async function pushDiffToSupabase(boardId, diff) {
    // отправляем немедленно, синхронно, до первого await ниже — так
    // остальные участники видят изменение сразу, не дожидаясь ни ответа
    // сервера на запись, ни тем более цикла репликации postgres_changes
    if (cloudChannel) {
      try { cloudChannel.send({ type: 'broadcast', event: 'board_diff', payload: { diff, uid: window.CURRENT_USER ? window.CURRENT_USER.id : null } }); } catch (e) {}
    }
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

  function cloudHandleRemoteDiff(payload) {
    const board = window.getCurrentBoard();
    if (!board || !cloudBoardId || !payload || !payload.diff) return;
    // моё же сообщение возвращается мне тем же broadcast-каналом (эхо) —
    // я его уже применил локально в момент рисования, применять второй раз
    // не нужно (см. тот же приём у курсоров, cloudHandleRemoteCursor)
    if (payload.uid && window.CURRENT_USER && payload.uid === window.CURRENT_USER.id) return;
    cloudApplyingRemote = true;
    applyDiffLocally(board, payload.diff);
    cloudApplyingRemote = false;
    // если у меня прямо сейчас идёт свой незавершённый жест — обновляем и
    // его «снимок до», чтобы чужое изменение не попало в diff как моё
    // собственное, когда мой жест зафиксируется (тот же приём, что и в
    // cloudHandleRemoteChange для postgres_changes)
    if (cloudGestureBefore !== null) {
      const tmp = { objects: JSON.parse(cloudGestureBefore) };
      applyDiffLocally(tmp, payload.diff);
      cloudGestureBefore = JSON.stringify(tmp.objects);
    }
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
      // курсоры — тем же каналом, но отдельным типом сообщений: broadcast
      // ничего не пишет в базу (в отличие от postgres_changes выше), это
      // ровно то, что нужно для эфемерного "где сейчас мышь"
      .on('broadcast', { event: 'cursor' }, ({ payload }) => cloudHandleRemoteCursor(payload))
      // быстрый путь для самих объектов доски — см. pushDiffToSupabase выше;
      // postgres_changes (обработчик над этим) остаётся как подстраховка
      .on('broadcast', { event: 'board_diff' }, ({ payload }) => cloudHandleRemoteDiff(payload))
      .subscribe();
  }
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
  }

  window.onBoardOpened = function (board) {
    cloudTeardownSubscription();
    cloudUndoStack = []; cloudRedoStack = []; cloudGestureBefore = null;
    cloudBoardId = board.cloudBoardId || null;
    cloudRole = board.cloudRole || null;
    if (cloudBoardId) { cloudSetupSubscription(cloudBoardId, board); startCursorAnim(); }
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
