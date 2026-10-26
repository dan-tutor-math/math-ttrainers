/* ═══════════════════════════════════════════════════════════════════════
   boards-cloud.js — вход по email и (в перспективе) общая доска с учеником.

   Это отдельный, необязательный слой поверх обычного локального
   приложения (boards-core.js): (1) экран входа, который перекрывает всё
   приложение, пока человек не войдёт — по почте из списка доступа или
   паролем (промпт №83, функция supabase/functions/email-login); окна
   «Доступ» (список почт) и «Пароль», красная плашка «Добавьте пароль» у
   преподавателя; (2) после входа — вызывает window.boardsAppBoot(),
   который раньше вызывался сам по себе при загрузке страницы.

   Если supabase-config.js не заполнен настоящими значениями — показываем
   понятную подсказку вместо тихой поломки, и приложение НЕ запускается
   (чтобы не показывать пустой экран входа без возможности его пройти).
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  // Промпт №11 нового списка: ученик пришёл за учителем смотреть его доску
  // (boards.html?s=КОД, см. board-stage.js) — вход по email ему не нужен,
  // экран входа и облачные доски не запускаем вовсе
  if (window.__boardViewer) return;
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
    /* на телефоне ссылки плашки (имя, пароль, доступ, выйти) в одну строку
       не влезают — переносятся, а не уезжают за край экрана */
    .ag-user-pill{max-width:calc(100vw - 32px);box-sizing:border-box;flex-wrap:wrap;row-gap:3px;}
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
    /* Промпт №76: плашка состояния загрузки общей доски — сверху по центру,
       под строкой с названием доски; клики сквозь неё на доску не нужны,
       поэтому она обычный блок, а не pointer-events:none */
    #bdCloudLoad{display:none;position:fixed;top:64px;left:calc(50% + var(--bd-inset,0px) / 2);
      transform:translateX(-50%);z-index:420;max-width:min(620px, calc(100vw - 24px));
      align-items:center;gap:10px;padding:8px 14px;border-radius:12px;font-size:13.5px;line-height:1.4;
      background:var(--glass-strong);border:1px solid var(--glass-border);color:var(--pencil);
      backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);
      box-shadow:inset 0 1px 0 var(--glass-inset), var(--shadow);}
    #bdCloudLoad.open{display:flex;}
    #bdCloudLoad.warn{background:#fff4d6;border-color:#e0a800;color:#5a4300;}
    #bdCloudLoad.bad{background:#c0392b;border-color:#c0392b;color:#fff;font-weight:600;}
    #bdCloudLoad .bd-cl-retry{flex:none;font:inherit;font-weight:700;border:0;border-radius:8px;
      padding:5px 12px;cursor:pointer;background:#fff;color:#c0392b;}
    #bdCloudLoad .bd-cl-retry:disabled{opacity:.7;cursor:default;}
    #bdCloudLoad .bd-cl-retry[hidden],#bdCloudLoad .bd-cl-check[hidden]{display:none;}
    #bdCloudLoad .bd-cl-check{flex:none;font:inherit;font-weight:700;border:1px solid currentColor;border-radius:8px;
      padding:4px 10px;cursor:pointer;background:transparent;color:inherit;white-space:nowrap;}

    /* ── Промпт №83: вход по списку почт ── */
    .ag-pw-hint{font-size:12.5px;color:var(--muted-2);margin:-4px 0 10px;line-height:1.4;}
    /* Красная плашка «Добавьте пароль» у преподавателя без пароля — слева
       сверху, В ВЕРХНЕЙ СТРОКЕ, сразу правее «Назад к доскам» на доске и
       правее заголовка в списке (место считает placePwBanner). Просто
       поставить её в угол нельзя: там «К тренажёрам», поиск, рейл доски, и
       плашка их перекрывала (та же ошибка была у «Вы вошли как», см.
       .ag-user-pill). Закрыть нельзя: пока пароля нет, войти в аккаунт
       может любой, кто знает почту */
    #agPwBanner{position:fixed;top:14px;left:16px;z-index:450;display:none;align-items:center;gap:7px;
      height:34px;box-sizing:border-box;padding:0 12px 0 8px;border-radius:10px;white-space:nowrap;
      border:2px solid #FF3B30;background:var(--glass-strong);color:#FF3B30;font-weight:700;font-size:13.5px;
      backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);
      box-shadow:0 0 0 3px rgba(255,59,48,.16), var(--shadow);cursor:pointer;font-family:inherit;}
    #agPwBanner.open{display:inline-flex;}
    #agPwBanner .ag-pwb-dot{width:18px;height:18px;border-radius:50%;background:#FF3B30;color:#fff;
      display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex:none;}
    #agPwBanner:hover{background:#FF3B30;color:#fff;}
    /* места на полную плашку нет — только кружок «!», текст в подсказке */
    #agPwBanner.mini{width:34px;padding:0;justify-content:center;font-size:0;gap:0;border-radius:50%;}
    #agPwBanner.mini .ag-pwb-dot{font-size:12px;}
    #agPwBanner:hover .ag-pwb-dot{background:#fff;color:#FF3B30;}
    /* окна «Пароль» и «Доступ» — та же стеклянная карточка, что вход */
    .ag-modal{position:fixed;inset:0;z-index:5100;display:none;align-items:center;justify-content:center;
      background:rgba(0,0,0,.28);padding:16px;}
    .ag-modal.open{display:flex;}
    .ag-modal .ag-card{position:relative;max-height:calc(100vh - 32px);overflow:auto;}
    .ag-modal input,.ag-modal textarea,.ag-modal select{width:100%;font:inherit;font-size:14px;padding:9px 11px;
      border-radius:11px;border:1px solid var(--glass-border);background:var(--glass);color:var(--pencil);
      outline:none;margin-bottom:9px;box-sizing:border-box;}
    .ag-modal textarea{min-height:76px;resize:vertical;}
    .ag-modal input:focus,.ag-modal textarea:focus{border-color:var(--ink);}
    .ag-modal .ag-primary{width:100%;font-size:14px;font-weight:600;padding:10px 12px;border-radius:11px;
      border:none;background:var(--ink);color:#fff;cursor:pointer;}
    .ag-modal .ag-primary:disabled{opacity:.6;cursor:default;}
    .ag-modal .ag-close{position:absolute;top:12px;right:14px;border:0;background:none;font-size:20px;line-height:1;
      color:var(--muted-2);cursor:pointer;padding:4px;}
    .ag-modal .ag-msg{font-size:13px;line-height:1.4;margin-top:9px;color:var(--muted-2);white-space:pre-line;}
    .ag-modal .ag-msg.err{color:var(--teacher);}
    #agAccess .ag-card{width:520px;}
    .ag-acc-add{display:flex;flex-direction:column;}
    .ag-acc-row2{display:flex;gap:8px;}
    .ag-acc-row2 > *{flex:1;min-width:0;}
    .ag-acc-sec{font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--muted-2);
      margin:16px 0 6px;}
    .ag-acc-item{display:flex;align-items:center;gap:8px;padding:8px 0;border-top:1px solid var(--glass-border);}
    .ag-acc-who{flex:1;min-width:0;}
    .ag-acc-email{font-size:13.5px;color:var(--pencil);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .ag-acc-meta{font-size:12px;color:var(--muted-2);margin-top:2px;}
    .ag-acc-meta .pw{color:var(--ok, #3E8E5B);}
    .ag-acc-item select{width:auto;margin:0;padding:5px 6px;font-size:12.5px;border-radius:8px;}
    .ag-acc-item button{flex:none;font:inherit;font-size:12.5px;border:1px solid var(--glass-border);border-radius:8px;
      padding:5px 9px;background:var(--glass);color:var(--pencil);cursor:pointer;white-space:nowrap;}
    .ag-acc-item button.danger{color:var(--teacher);}
    .ag-acc-item button.confirm{background:var(--teacher);color:#fff;border-color:var(--teacher);}
    @media (max-width:520px){
      .ag-acc-item{flex-wrap:wrap;}
      .ag-acc-who{flex-basis:100%;}
    }
  `;
  document.head.appendChild(style);

  document.body.insertAdjacentHTML('afterbegin', `
    <div id="authGate">
      <div class="ag-card">
        <div class="ag-logo">Тренажёры</div>
        <div id="agStep1">
          <p class="ag-hint">Введите почту, которую вы дали преподавателю, и нажмите «Войти». Если вы задавали пароль — введите и его.</p>
          <input id="agEmail" type="email" placeholder="you@example.com" autocomplete="email">
          <input id="agPassword" type="password" placeholder="Пароль (если задавали)" autocomplete="current-password">
          <button id="agSend">Войти</button>
        </div>
        <div id="agLoading" hidden><p class="ag-hint">Входим…</p></div>
        <!-- Показывается вместо пустой формы входа, когда на ЭТОМ устройстве
             уже есть сохранённый вход, но прямо сейчас не получилось связаться
             с сервером (сеть моргнула, сервер на секунду недоступен). Без
             этого экрана человек видел пустую форму и входил заново, хотя
             вход на устройстве никуда не делся — достаточно повторить -->
        <div id="agReconnect" hidden>
          <p class="ag-hint">Не получилось подключиться к серверу — но вы уже входили на этом устройстве. Проверьте интернет-соединение и повторите попытку.</p>
          <button id="agRetryConnect">Повторить попытку</button>
          <button id="agUseOtherEmail" class="ag-link">Войти под другой почтой</button>
        </div>
        <div id="agError" class="ag-error" hidden></div>
      </div>
    </div>
    <div id="authUserPill" class="ag-user-pill" style="display:none">
      <span>Вы вошли как <b id="agCurrentEmail"></b></span>
      <a id="agEditName" class="ag-edit-name" title="Задать имя, которое увидит собеседник рядом со своим курсором">изменить имя</a>
      <a id="agSetPassword" class="ag-edit-name" title="Задать или сменить пароль">задать пароль</a>
      <a id="agOpenAccess" class="ag-edit-name" style="display:none" title="Кому открыт вход на платформу">доступ</a>
      <a id="agSignOut">Выйти</a>
      <a id="agPillCollapse" class="ag-pill-collapse" title="Свернуть эту панель">✕</a>
    </div>
    <div id="agPillHandle" class="ag-pill-handle" style="display:none" title="Показать данные входа">⋯</div>
    <button id="agPwBanner" type="button" title="Пока пароля нет, войти в ваш аккаунт может любой, кто знает вашу почту">
      <span class="ag-pwb-dot">!</span>Добавьте пароль
    </button>
    <div id="agPwModal" class="ag-modal">
      <div class="ag-card">
        <button class="ag-close" type="button" title="Закрыть">×</button>
        <div class="ag-logo" id="agPwTitle">Пароль</div>
        <p class="ag-hint" id="agPwText"></p>
        <input id="agPw1" type="password" placeholder="Новый пароль" autocomplete="new-password">
        <input id="agPw2" type="password" placeholder="Повторите пароль" autocomplete="new-password">
        <div class="ag-pw-hint">Не короче 6 символов.</div>
        <button class="ag-primary" id="agPwSave" type="button">Сохранить</button>
        <div class="ag-msg" id="agPwMsg" hidden></div>
      </div>
    </div>
    <div id="agAccess" class="ag-modal">
      <div class="ag-card">
        <button class="ag-close" type="button" title="Закрыть">×</button>
        <div class="ag-logo">Доступ</div>
        <p class="ag-hint" id="agAccHint"></p>
        <div class="ag-acc-add">
          <textarea id="agAccEmails" placeholder="Почты — через запятую или каждая с новой строки"></textarea>
          <div class="ag-acc-row2">
            <input id="agAccLabel" type="text" maxlength="120" placeholder="Подпись (необязательно): Маша, 9 класс">
            <select id="agAccRole">
              <option value="student">Ученик</option>
              <option value="teacher">Преподаватель</option>
            </select>
          </div>
          <button class="ag-primary" id="agAccAdd" type="button">Добавить</button>
          <div class="ag-msg" id="agAccMsg" hidden></div>
        </div>
        <input id="agAccFilter" type="search" placeholder="Найти по почте или подписи" style="margin-top:14px">
        <div id="agAccList"></div>
      </div>
    </div>
  `);

  const gate = document.getElementById('authGate');
  const step1 = document.getElementById('agStep1');
  const loading = document.getElementById('agLoading');
  const reconnectBox = document.getElementById('agReconnect');
  const errBox = document.getElementById('agError');
  const pill = document.getElementById('authUserPill');
  const pillHandle = document.getElementById('agPillHandle');
  const pillCollapseBtn = document.getElementById('agPillCollapse');
  const pwBanner = document.getElementById('agPwBanner');
  const pwModal = document.getElementById('agPwModal');
  const accModal = document.getElementById('agAccess');
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
    loading.hidden = stage !== 'loading';
    reconnectBox.hidden = stage !== 'reconnect';
    if (msg) { errBox.hidden = false; errBox.textContent = msg; } else { errBox.hidden = true; }
  }

  // Ссылки-приглашения (?invite=…) остались в старых сообщениях. Вход
  // теперь по списку почт, сама ссылка ничего не значит — просто убираем
  // её из адреса, чтобы не путала, и показываем обычную форму
  if (new URLSearchParams(location.search).has('invite')) {
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
  }
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
    pwBanner.classList.remove('open');
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
    return;
  }

  // sbGuardedFetch (supabase-config.js) — запрос, по которому долго не
  // приходит ни байта, обрывается, а не висит до конца урока
  const sbOpts = window.sbGuardedFetch ? { global: { fetch: window.sbGuardedFetch } } : undefined;
  const sb = (window.rtGuard || (c => c))(window.supabase.createClient(cfg.url, cfg.anonKey, sbOpts));
  window.SB = sb; // остальным модулям (совместное редактирование, шаринг) — тот же клиент

  // Все обращения к серверной функции входа и списка почт
  // (supabase/functions/email-login). Функция всегда отвечает 200 с
  // { ok, error } — сетевой сбой и «функции нет» (не развёрнута, 404)
  // сводим к одному { ok:false, error:'network' }
  async function callAccess(body) {
    try {
      const { data, error } = await sb.functions.invoke('email-login', { body });
      if (error || !data) {
        console.error('[вход] функция email-login:', error && error.message);
        return { ok: false, error: 'network' };
      }
      return data;
    } catch (e) {
      console.error('[вход] функция email-login:', e);
      return { ok: false, error: 'network' };
    }
  }

  function presentForm() { setStage('form'); }

  showGate();
  setStage('loading');
  let authSettled = false;
  // подстраховка: если по какой-то причине onAuthStateChange не сработает
  // быстро (например, сеть подвисла на первом запросе к Supabase), не
  // оставляем пользователя навсегда смотреть на «Входим…». Человеку, уже
  // входившему на этом устройстве, показываем «Повторить», а не пустую
  // форму — вход на устройстве при сетевом сбое никуда не девается
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

  // Вход по одной почте: функция проверяет список и выдаёт одноразовый код
  // (то же, что ссылка из письма, только без письма), сайт меняет его на
  // обычную сессию. Дальше всё как при любом входе — onAuthStateChange
  async function emailLogin(email) {
    setStage('loading');
    const res = await callAccess({ action: 'login', email });
    if (!res.ok) {
      if (res.error === 'password_required') {
        setStage('form', 'Для этой почты задан пароль — введите его и нажмите «Войти».');
        document.getElementById('agPassword').focus();
      } else if (res.error === 'not_allowed') {
        setStage('form', 'Эта почта не добавлена на платформу. Напишите преподавателю — он добавит её, и вход заработает сразу.');
      } else if (res.error === 'bad_email') {
        setStage('form', 'Похоже, в почте опечатка — проверьте её.');
      } else {
        setStage('form', 'Не получилось связаться с сервером входа. Проверьте интернет и попробуйте ещё раз.');
      }
      return;
    }
    // type 'email' — нынешнее имя этого кода в supabase-js; 'magiclink' —
    // старое, на случай если сервер Supabase окажется старше библиотеки
    let { error } = await sb.auth.verifyOtp({ token_hash: res.token_hash, type: 'email' });
    if (error) ({ error } = await sb.auth.verifyOtp({ token_hash: res.token_hash, type: 'magiclink' }));
    if (error) setStage('form', 'Не получилось войти: ' + error.message);
  }
  document.getElementById('agSend').addEventListener('click', async () => {
    const email = document.getElementById('agEmail').value.trim();
    const password = document.getElementById('agPassword').value;
    if (!email) { setStage('form', 'Введите почту.'); return; }
    if (!password) { await emailLogin(email); return; }
    setStage('loading');
    try {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (!error) return; // дальше всё делает onAuthStateChange
      setStage('form', 'Не подошёл пароль. Проверьте его. Если не помните — напишите владельцу платформы, он сбросит пароль, и можно будет войти по одной почте.');
    } catch (e) {
      setStage('form', 'Не получилось войти: ' + (e && e.message ? e.message : e));
    }
  });
  // Enter в любом из полей формы входа — как нажатие «Войти»
  ['agEmail', 'agPassword'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('agSend').click();
    });
  });
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

  // ── Роли и пароль ──
  // is_owner лежит в app_metadata (ставится руками в дашборде Supabase),
  // mathh_role — тоже в app_metadata, его пишет функция email-login по
  // списку почт. user_metadata человек может менять сам себе через
  // updateUser(), app_metadata — нет; поэтому роль не подделать с сайта.
  // На сайте роль решает только, что ПОКАЗАТЬ; права проверяет функция
  function hasPassword(user) {
    return !!(user && user.user_metadata && user.user_metadata.has_password);
  }
  function roleOf(user) {
    const am = (user && user.app_metadata) || {};
    if (am.is_owner) return 'owner';
    return am.mathh_role === 'teacher' ? 'teacher' : (am.mathh_role === 'student' ? 'student' : null);
  }
  window.mathhRole = () => roleOf(window.CURRENT_USER);
  function updateAccountUI(user) {
    const role = roleOf(user);
    document.getElementById('agSetPassword').textContent = hasPassword(user) ? 'сменить пароль' : 'задать пароль';
    document.getElementById('agOpenAccess').style.display = (role === 'owner' || role === 'teacher') ? '' : 'none';
    // плашка — только у преподавателя: ученики входят по почте, и это
    // нормально; у владельца пароль есть всегда (по почте он не входит)
    pwBanner.classList.toggle('open', !!user && role === 'teacher' && !hasPassword(user));
    placePwBanner();
  }
  // Место плашки — слева сверху, но на свободном месте: сначала в верхней
  // строке правее «Назад к доскам» (на доске) или заголовка (в списке), по
  // их высоте; не влезло — первое свободное место сверху вниз, слева
  // направо в верхних 200 px; нет и такого — плашка сжимается до красного
  // кружка «!» и ищет место снова. «Свободное» — не накрывает ни одной
  // кнопки, ссылки, поля и рейла: на телефоне верхняя строка забита, и
  // плашка в фиксированном углу закрывала «Создать доску» и название доски.
  // Экраны переключает boards-core.js без событий для нас, поэтому пока
  // плашка видна — сверяемся раз в полсекунды; пересчёт сетки — только
  // если сменился экран/размер окна или место перестало быть свободным
  const PW_BLOCKERS = '#screenList button, #screenList a, #screenList input, #screenList .bl-title, '
    + '#screenBoard button, #screenBoard a, #screenBoard input, .bd-rail, #bdShareBtn, #lgMenuToggle, '
    + '.ag-user-pill, .ag-pill-handle';
  let pwPlaceKey = '';
  function pwBlockers() {
    const out = [];
    document.querySelectorAll(PW_BLOCKERS).forEach(el => {
      if (el === pwBanner || pwBanner.contains(el)) return;
      const r = el.getBoundingClientRect();
      if (r.width && r.height && r.top < 260 && getComputedStyle(el).visibility !== 'hidden') out.push(r);
    });
    return out;
  }
  function pwFree(left, top, w, h, rects) {
    if (left < 6 || top < 6 || left + w > window.innerWidth - 6) return false;
    return !rects.some(r => left < r.right + 4 && r.left - 4 < left + w && top < r.bottom + 4 && r.top - 4 < top + h);
  }
  function pwFindSpot(rects) {
    const w = pwBanner.offsetWidth, h = pwBanner.offsetHeight;
    const vis = el => { if (!el) return null; const r = el.getBoundingClientRect(); return r.width ? r : null; };
    const anchor = vis(document.getElementById('bdBack')) || vis(document.getElementById('blTitle'))
      || vis(document.getElementById('blToIndex'));
    if (anchor) {
      const l = Math.round(anchor.right + 10), t = Math.round(anchor.top + (anchor.height - h) / 2);
      if (pwFree(l, t, w, h, rects)) return [l, t];
    }
    for (let t = 8; t <= 200; t += 6)
      for (let l = 8; l + w <= window.innerWidth - 6; l += 6)
        if (pwFree(l, t, w, h, rects)) return [l, t];
    return null;
  }
  function placePwBanner() {
    if (!pwBanner.classList.contains('open')) return;
    const board = document.getElementById('screenBoard');
    const key = [window.innerWidth, window.innerHeight, board && getComputedStyle(board).display,
      pwBanner.classList.contains('mini')].join('|');
    const rects = pwBlockers();
    const cur = pwBanner.getBoundingClientRect();
    if (key === pwPlaceKey && pwFree(cur.left, cur.top, cur.width, cur.height, rects)) return;
    pwBanner.classList.remove('mini');
    let spot = pwFindSpot(rects);
    if (!spot) { pwBanner.classList.add('mini'); spot = pwFindSpot(rects) || [16, 64]; }
    pwBanner.style.left = spot[0] + 'px';
    pwBanner.style.top = spot[1] + 'px';
    pwPlaceKey = [window.innerWidth, window.innerHeight, board && getComputedStyle(board).display,
      pwBanner.classList.contains('mini')].join('|');
  }
  setInterval(placePwBanner, 500);
  window.addEventListener('resize', placePwBanner);

  function openPwModal() {
    const already = hasPassword(window.CURRENT_USER);
    document.getElementById('agPwTitle').textContent = already ? 'Сменить пароль' : 'Добавить пароль';
    document.getElementById('agPwText').textContent = already
      ? 'Новый пароль заменит старый на всех устройствах.'
      : 'После этого войти в ваш аккаунт можно будет только с паролем — по одной почте уже нельзя.';
    document.getElementById('agPw1').value = '';
    document.getElementById('agPw2').value = '';
    document.getElementById('agPwMsg').hidden = true;
    document.getElementById('agPwSave').disabled = false;
    pwModal.classList.add('open');
    setTimeout(() => document.getElementById('agPw1').focus(), 30);
  }
  function pwMessage(text, isErr) {
    const m = document.getElementById('agPwMsg');
    m.hidden = !text; m.textContent = text || ''; m.classList.toggle('err', !!isErr);
  }
  async function savePassword() {
    const p1 = document.getElementById('agPw1').value;
    const p2 = document.getElementById('agPw2').value;
    if (p1.trim().length < 6) { pwMessage('Пароль должен быть не короче 6 символов.', true); return; }
    if (p1 !== p2) { pwMessage('Пароли не совпадают.', true); return; }
    const btn = document.getElementById('agPwSave');
    btn.disabled = true;
    pwMessage('Сохраняем…');
    try {
      const { data, error } = await sb.auth.updateUser({ password: p1, data: { has_password: true } });
      if (error) {
        const same = /different from the old|same_password/i.test(error.message || '');
        pwMessage(same ? 'Это ваш нынешний пароль — придумайте другой.' : 'Не получилось сохранить пароль: ' + error.message, true);
        btn.disabled = false;
        return;
      }
      if (data && data.user) window.CURRENT_USER = data.user;
      updateAccountUI(window.CURRENT_USER);
      pwMessage('Пароль сохранён. В следующий раз входите с почтой и паролем.');
      setTimeout(() => pwModal.classList.remove('open'), 1200);
    } catch (e) {
      pwMessage('Не получилось сохранить пароль: ' + (e && e.message ? e.message : e), true);
      btn.disabled = false;
    }
  }
  document.getElementById('agSetPassword').addEventListener('click', openPwModal);
  pwBanner.addEventListener('click', openPwModal);
  document.getElementById('agPwSave').addEventListener('click', savePassword);
  ['agPw1', 'agPw2'].forEach(id => document.getElementById(id).addEventListener('keydown', e => {
    if (e.key === 'Enter') savePassword();
  }));
  [pwModal, accModal].forEach(m => {
    m.querySelector('.ag-close').addEventListener('click', () => m.classList.remove('open'));
    // клик мимо карточки закрывает; mousedown — чтобы выделение текста в
    // поле, отпущенное за краем карточки, окно не закрывало
    m.addEventListener('mousedown', e => { if (e.target === m) m.classList.remove('open'); });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') [pwModal, accModal].forEach(m => m.classList.remove('open'));
  });

  // ── Окно «Доступ»: список почт ──
  // Владелец видит всех и задаёт роль; преподаватель — только своих
  // учеников. Список и все изменения идут через функцию: у браузера прав на
  // таблицу access_emails нет вовсе (access-schema.sql)
  let accRows = [];
  let accConfirm = null; // почта, у которой «Убрать» ждёт второго нажатия
  function accMessage(text, isErr) {
    const m = document.getElementById('agAccMsg');
    m.hidden = !text; m.textContent = text || ''; m.classList.toggle('err', !!isErr);
  }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  }
  function renderAccList() {
    const owner = roleOf(window.CURRENT_USER) === 'owner';
    const q = document.getElementById('agAccFilter').value.trim().toLowerCase();
    const rows = accRows.filter(r => !q || r.email.includes(q) || (r.label || '').toLowerCase().includes(q));
    const item = r => {
      const meta = [];
      if (r.label) meta.push(esc(r.label));
      meta.push(r.last_login_at ? 'входил(а) ' + fmtDate(r.last_login_at) : 'ещё не входил(а)');
      if (r.has_password) meta.push('<span class="pw">пароль задан</span>');
      if (owner && !r.added_by_me && r.added_by_email) meta.push('добавил(а) ' + esc(r.added_by_email));
      const roleCtl = owner
        ? `<select data-act="role" data-email="${esc(r.email)}">
             <option value="teacher"${r.role === 'teacher' ? ' selected' : ''}>Преподаватель</option>
             <option value="student"${r.role === 'student' ? ' selected' : ''}>Ученик</option>
           </select>`
        : '';
      const reset = r.can_manage && r.has_password
        ? `<button data-act="reset" data-email="${esc(r.email)}" title="Пароль сотрётся, человек снова войдёт по почте и задаст новый">Сбросить пароль</button>` : '';
      const del = r.can_manage
        ? (accConfirm === r.email
            ? `<button class="confirm" data-act="remove" data-email="${esc(r.email)}">Точно убрать?</button>`
            : `<button class="danger" data-act="remove-ask" data-email="${esc(r.email)}" title="Вход закроется на всех устройствах. Доски и работы человека останутся">Убрать</button>`)
        : '';
      return `<div class="ag-acc-item" data-email="${esc(r.email)}">
        <div class="ag-acc-who"><div class="ag-acc-email" title="${esc(r.email)}">${esc(r.email)}</div>
          <div class="ag-acc-meta">${meta.join(' · ')}</div></div>
        ${roleCtl}${reset}${del}</div>`;
    };
    let html = '';
    if (!accRows.length) html = '<p class="ag-hint" style="margin-top:12px">Пока никого.</p>';
    else if (!rows.length) html = '<p class="ag-hint" style="margin-top:12px">Ничего не нашлось.</p>';
    else if (owner) {
      const t = rows.filter(r => r.role === 'teacher'), s = rows.filter(r => r.role !== 'teacher');
      if (t.length) html += `<div class="ag-acc-sec">Преподаватели · ${t.length}</div>` + t.map(item).join('');
      if (s.length) html += `<div class="ag-acc-sec">Ученики · ${s.length}</div>` + s.map(item).join('');
    } else {
      html = `<div class="ag-acc-sec">Мои ученики · ${rows.length}</div>` + rows.map(item).join('');
    }
    document.getElementById('agAccList').innerHTML = html;
  }
  async function loadAccList() {
    document.getElementById('agAccList').innerHTML = '<p class="ag-hint" style="margin-top:12px">Загрузка…</p>';
    const res = await callAccess({ action: 'list' });
    if (!res.ok) {
      document.getElementById('agAccList').innerHTML = `<p class="ag-msg err">${res.error === 'forbidden'
        ? 'Список доступен только владельцу платформы и преподавателям.'
        : 'Не получилось загрузить список. Проверьте интернет и откройте окно ещё раз.'}</p>`;
      return;
    }
    accRows = res.rows || [];
    renderAccList();
  }
  function openAccess() {
    const owner = roleOf(window.CURRENT_USER) === 'owner';
    document.getElementById('agAccHint').textContent = owner
      ? 'Добавленные почты входят на платформу без пароля и писем: открыть сайт, ввести почту, «Войти». Преподавателям после первого входа предложим задать пароль.'
      : 'Добавьте почты своих учеников — они войдут на платформу без пароля и писем: открыть сайт, ввести почту, «Войти». И их сразу можно звать к доске.';
    document.getElementById('agAccRole').style.display = owner ? '' : 'none';
    document.getElementById('agAccRole').value = 'student';
    accConfirm = null;
    accMessage('');
    accModal.classList.add('open');
    loadAccList();
  }
  document.getElementById('agOpenAccess').addEventListener('click', openAccess);
  document.getElementById('agAccFilter').addEventListener('input', renderAccList);

  const ADD_REASON = { bad_email: 'не похоже на почту', self: 'это ваша почта', error: 'ошибка сервера' };
  // Добавить почты в список. Отдельной функцией — её же зовёт «Совместная
  // работа», когда к доске зовут почту, которой на платформе ещё нет
  async function addAccessEmails(emails, role, label) {
    return callAccess({ action: 'add', emails, role, label });
  }
  window.mathhAddAccess = addAccessEmails;
  document.getElementById('agAccAdd').addEventListener('click', async () => {
    const emails = document.getElementById('agAccEmails').value;
    if (!emails.trim()) { accMessage('Впишите хотя бы одну почту.', true); return; }
    const btn = document.getElementById('agAccAdd');
    btn.disabled = true;
    accMessage('Добавляем…');
    const res = await addAccessEmails(emails, document.getElementById('agAccRole').value,
      document.getElementById('agAccLabel').value);
    btn.disabled = false;
    if (!res.ok) {
      accMessage(res.error === 'forbidden' ? 'Добавлять почты могут только владелец платформы и преподаватели.'
        : res.error === 'no_emails' ? 'Не нашлось ни одной почты.'
        : 'Не получилось связаться с сервером. Попробуйте ещё раз.', true);
      return;
    }
    const by = s => res.results.filter(r => r.status === s);
    const lines = [];
    const added = by('added'), upd = by('updated'), exists = by('exists');
    if (added.length) lines.push('Добавлено: ' + added.length);
    if (upd.length) lines.push('Обновлено: ' + upd.length);
    if (exists.length) lines.push('Уже были: ' + exists.map(r => r.email).join(', '));
    const bad = res.results.filter(r => ADD_REASON[r.status]);
    bad.forEach(r => lines.push(r.email + ' — ' + ADD_REASON[r.status]));
    accMessage(lines.join('\n'), !!bad.length);
    if (!bad.length) {
      document.getElementById('agAccEmails').value = '';
      document.getElementById('agAccLabel').value = '';
    } else {
      // в поле оставляем только то, что не прошло, — поправить и отправить снова
      document.getElementById('agAccEmails').value = bad.filter(r => r.status !== 'self').map(r => r.email).join('\n');
    }
    loadAccList();
  });
  document.getElementById('agAccList').addEventListener('click', async e => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const email = btn.dataset.email, act = btn.dataset.act;
    if (act === 'remove-ask') { accConfirm = email; renderAccList(); return; }
    btn.disabled = true;
    const res = await callAccess(act === 'remove' ? { action: 'remove', email } : { action: 'reset_password', email });
    accConfirm = null;
    if (!res.ok) accMessage('Не получилось: ' + (res.error === 'forbidden' ? 'нет прав на эту почту' : 'нет связи с сервером'), true);
    else accMessage(act === 'remove' ? email + ' — вход закрыт' : email + ' — пароль сброшен, вход снова по почте');
    loadAccList();
  });
  document.getElementById('agAccList').addEventListener('change', async e => {
    const sel = e.target.closest('select[data-act="role"]');
    if (!sel) return;
    sel.disabled = true;
    const res = await callAccess({ action: 'set_role', email: sel.dataset.email, role: sel.value });
    if (!res.ok) accMessage('Не получилось сменить роль — нет связи с сервером.', true);
    loadAccList();
  });

  sb.auth.onAuthStateChange((event, session) => {
    if (session && session.user) {
      authSettled = true;
      clearTimeout(loadingFallback);
      if (autoReconnectTimer) { clearInterval(autoReconnectTimer); autoReconnectTimer = null; }
      window.CURRENT_USER = session.user;
      document.getElementById('agCurrentEmail').textContent = displayNameOf(session.user);
      updateAccountUI(session.user);
      syncPillVisibility();
      hideGate();
      if (window.boardsAppBoot) window.boardsAppBoot();
      // подтягиваем в локальный список доски, которыми с этим пользователем
      // поделились (см. второй блок ниже — cloudImportSharedBoards)
      if (window.cloudImportSharedBoards) window.cloudImportSharedBoards();
      // Роль в сохранённом входе может быть старой: владелец сменил её или
      // сбросил пароль, а токен обновляется раз в час. getUser берёт
      // аккаунт с сервера — плашка и «доступ» сразу как есть сейчас.
      // Один раз на вход/открытие, не на каждое обновление токена
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        sb.auth.getUser().then(({ data }) => {
          if (data && data.user && window.CURRENT_USER && data.user.id === window.CURRENT_USER.id) {
            window.CURRENT_USER = data.user;
            updateAccountUI(data.user);
          }
        }).catch(() => { /* нет связи — остаётся то, что в сохранённом входе */ });
      }
    } else {
      window.CURRENT_USER = null;
      updateAccountUI(null);
      // сессии сейчас нет — но если на устройстве всё ещё лежит сохранённый
      // токен, это почти наверняка просто сбой сети при попытке его обновить,
      // а не настоящий выход: когда сервер ДЕЙСТВИТЕЛЬНО признаёт вход
      // недействительным (или человек сам нажал «Выйти»), supabase-js сам
      // стирает токен из хранилища — вот тогда и покажем обычную форму входа.
      // Пока токен на месте — не дёргаем человека, а даём кнопке
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

    /* «Кто на доске»: участники общей доски, которые сейчас на ней, — справа
       от кнопки «Совместная работа». Каждое имя — кнопка «найти»: камера
       едет к курсору человека (или, если мышь у него не над доской, к
       середине его экрана). Высота как у соседних кнопок панели (32 px) */
    .bd-peers{display:flex;align-items:center;gap:6px;flex:0 1 auto;min-width:0;}
    .bd-peers:empty{display:none;}
    .bd-peer{display:inline-flex;align-items:center;gap:6px;height:32px;max-width:170px;flex:0 1 auto;min-width:0;
      padding:0 10px 0 4px;border-radius:10px;border:1px solid var(--glass-border);background:var(--glass);
      color:var(--pencil);font:600 12.5px var(--font-ui);cursor:pointer;transition:border-color .12s,transform .12s;}
    .bd-peer:hover{border-color:var(--ink);}
    .bd-peer:active{transform:scale(.96);}
    .bd-peer-dot{flex:none;width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:12px;font-weight:700;position:relative;}
    .bd-peer-dot svg{position:absolute;right:-4px;bottom:-4px;width:13px;height:13px;border-radius:50%;
      background:var(--glass-strong);color:var(--pencil);padding:1px;box-sizing:border-box;}
    .bd-peer-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    /* №93: от человека давно ничего не приходит — связь пропала (или ушёл,
       не попрощавшись). Кнопка остаётся, но блёклая, пунктиром */
    .bd-peer.is-stale{opacity:.5;border-style:dashed;}
    .bd-peer.is-stale .bd-peer-dot{filter:grayscale(1);}
    /* на узком экране в панели тесно — остаётся только квадратик с буквой,
       полное имя в подсказке (title) */
    @media (max-width:760px){
      .bd-peers{flex:none;gap:4px;}
      .bd-peer{padding:0 3px;flex:none;}
      .bd-peer-name{display:none;}
    }
    /* «вот он» — расходящееся кольцо там, куда привела кнопка, и подпись
       курсора на миг подсвечивается. Без него после полёта не сразу
       понятно, где именно человек на экране */
    .bd-peer-ping{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;}
    .bd-peer-ping::before,.bd-peer-ping::after{content:'';position:absolute;left:-28px;top:-28px;width:56px;height:56px;
      border-radius:50%;border:3px solid var(--ping-c,#3b82f6);opacity:0;animation:bdPeerPing 1.4s ease-out 2;}
    .bd-peer-ping::after{animation-delay:.35s;}
    @keyframes bdPeerPing{0%{transform:scale(.3);opacity:.9;}100%{transform:scale(1.6);opacity:0;}}
    .bd-remote-cursor.is-found .bd-remote-cursor-label{outline:2px solid var(--ping-c,#3b82f6);outline-offset:1px;}
  `;
  document.head.appendChild(style);

  // кнопка в верхней панели доски — вставляем перед последним спейсером,
  // сразу после кнопки настроек листа
  const gearBtn = document.getElementById('bdGear');
  const shareBtn = document.createElement('button');
  shareBtn.className = 'bd-gear';
  shareBtn.id = 'bdShareBtn';
  shareBtn.title = 'Общая доска по email — совместная работа через аккаунты';
  // Значок — облако с человеком, а не «люди со связями»: тот же значок
  // «люди со связями» у кнопки «Совместный доступ» (код и ссылка для
  // ученика, session-share.js), и с промпта о сессии на досках обе кнопки
  // стоят на одном экране. Одинаковые значки путали: эта — про облачную
  // доску и вход по email, та — про показ ученику без входа
  shareBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none"><path d="M6.5 19.5h11a4.5 4.5 0 0 0 .7-8.95A6.5 6.5 0 0 0 5.6 9.6 5 5 0 0 0 6.5 19.5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="11.6" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M8.6 19.4c.3-2.1 1.7-3.4 3.4-3.4s3.1 1.3 3.4 3.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  if (gearBtn && gearBtn.parentElement) gearBtn.parentElement.insertBefore(shareBtn, gearBtn.nextSibling);

  // участники общей доски — сразу справа от кнопки «Совместная работа»
  const peersBar = document.createElement('div');
  peersBar.className = 'bd-peers';
  peersBar.id = 'bdPeers';
  if (shareBtn.parentElement) shareBtn.parentElement.insertBefore(peersBar, shareBtn.nextSibling);

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
    if (touchPeer(payload.uid, entry.name)) renderPeers();
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
    if (peerPings.length && window.worldToScreen) {
      const canvasEl = document.getElementById('boardCv');
      const rect = canvasEl ? canvasEl.getBoundingClientRect() : { left: 0, top: 0 };
      const now = Date.now();
      peerPings = peerPings.filter(pg => {
        if (now > pg.until) { pg.el.remove(); return false; }
        const s = window.worldToScreen({ x: pg.x, y: pg.y });
        pg.el.style.transform = `translate(${Math.round(rect.left + s.x)}px, ${Math.round(rect.top + s.y)}px)`;
        return true;
      });
    }
    maybeSendHereOnMove();
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

  // ------------------------------------------------------------------
  // «Кто на доске» и кнопка «найти». Курсора одного мало: он есть, только
  // пока мышь человека над холстом, и пропадает через 6 с тишины — а
  // ученик может смотреть на свой кусок доски, не двигая мышью, или сидеть
  // с планшета. Поэтому каждый участник раз в 5 с (и сразу, как сдвинул
  // камеру) рассылает тем же каналом `here`: кто он и какая точка доски у
  // него посередине экрана. Новенький шлёт `ask` — остальные отвечают
  // сразу, не дожидаясь своих 5 с. Уходя — `bye`. В базу ничего не пишется.
  // Кнопка ведёт к курсору, если он сейчас виден, иначе — к середине
  // экрана человека: курсор точнее (туда человек показывает)
  // ------------------------------------------------------------------
  const HERE_EVERY = 5000;
  // №93: замолчал — кнопка не пропадает, а становится блёклой («нет
  // связи»); пропадает только после долгой тишины или `bye`. Раньше при
  // рвущейся связи ученика его кнопка у учителя то исчезала, то появлялась,
  // и было непонятно, ушёл он или у него пропал интернет
  let PEER_TTL = 16000;            // три пропущенных `here` подряд — нет связи
  let PEER_GONE = 90000;           // столько молчит — ушёл (закрыл ноутбук без `bye`)
  const PEER_COLORS = ['#3b82f6', '#e8590c', '#2f9e44', '#9c36b5', '#c2255c', '#0c8599', '#f08c00', '#5f3dc4'];
  let peers = new Map();           // uid -> { name, cx, cy, zoom, lastSeen }
  let hereLastSentAt = 0;
  let hereLastView = null;
  let peerPings = [];              // { el, x, y, until }

  // цвет закреплён за человеком, пока он на доске: пришёл третий — у первых
  // двух цвета не меняются. Начальный — по номеру (FNV-1a), занятый уже
  // кем-то из присутствующих — следующий свободный, чтобы двое не были
  // одного цвета
  function peerColor(uid) {
    const p = peers.get(uid);
    if (p && p.color) return p.color;
    let h = 2166136261;
    for (let i = 0; i < uid.length; i++) { h ^= uid.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    const used = new Set(Array.from(peers.values()).map(q => q.color).filter(Boolean));
    let c = PEER_COLORS[h % PEER_COLORS.length];
    for (let k = 0; k < PEER_COLORS.length && used.has(c); k++) c = PEER_COLORS[(h + k + 1) % PEER_COLORS.length];
    if (p) p.color = c;
    return c;
  }
  function escHtml(t) {
    return String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function sendHere(extra) {
    if (!cloudChannel || !cloudBoardId || !window.CURRENT_USER) return;
    const v = window.boardsViewCenter ? window.boardsViewCenter() : null;
    hereLastSentAt = Date.now();
    hereLastView = v;
    const payload = Object.assign({ uid: window.CURRENT_USER.id, name: window.displayNameOf(window.CURRENT_USER) },
      v ? { cx: v.x, cy: v.y, z: v.zoom } : {}, extra || {});
    try { cloudChannel.send({ type: 'broadcast', event: 'here', payload }); } catch (e) {}
  }
  // своя камера сдвинулась заметно (на четверть экрана или масштабом) —
  // говорим об этом не позже чем через полсекунды, а не ждём 5 с: иначе
  // «найти» приводило бы туда, где человек был, а не где он сейчас
  function maybeSendHereOnMove() {
    if (!cloudChannel || !window.boardsViewCenter) return;
    if (Date.now() - hereLastSentAt < 500) return;
    const v = window.boardsViewCenter();
    if (!v) return;
    const p = hereLastView;
    const far = !p || Math.abs(v.zoom - p.zoom) > 0.01
      || Math.hypot(v.x - p.x, v.y - p.y) * v.zoom > Math.min(window.innerWidth, window.innerHeight) / 4;
    if (far) sendHere();
  }
  // true — кнопку надо перерисовать: человек новый или снова на связи
  function touchPeer(uid, name) {
    let p = peers.get(uid);
    const isNew = !p;
    if (!p) { p = {}; peers.set(uid, p); }
    if (name) p.name = name;
    p.lastSeen = Date.now();
    const back = !!p.stale;
    p.stale = false;
    return isNew || back;
  }
  function cloudHandleHere(payload) {
    if (!payload || !cloudBoardId || !payload.uid) return;
    if (window.CURRENT_USER && payload.uid === window.CURRENT_USER.id) return;
    if (payload.bye) { if (peers.delete(payload.uid)) renderPeers(); return; }
    const changed = touchPeer(payload.uid, payload.name || '');
    const p = peers.get(payload.uid);
    if (typeof payload.cx === 'number' && typeof payload.cy === 'number') { p.cx = payload.cx; p.cy = payload.cy; p.zoom = payload.z; }
    // ответ новенькому — с небольшим разбросом, чтобы при пяти участниках
    // ответы не летели в канал одной пачкой
    if (payload.ask) setTimeout(() => sendHere(), 50 + Math.random() * 250);
    if (changed || p.shownName !== p.name) renderPeers();
  }
  function renderPeers() {
    const list = Array.from(peers.entries())
      .map(([uid, p]) => ({ uid, name: p.name || 'Участник', stale: !!p.stale }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    peers.forEach(p => { p.shownName = p.name; });
    const locate = '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5.5" stroke="currentColor" stroke-width="2.2"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
    peersBar.innerHTML = list.map(({ uid, name, stale }) => {
      const letter = escHtml((name.trim()[0] || '?').toUpperCase());
      const title = stale ? `${name} — нет связи с доской. Нажмите — туда, где был` : `Найти на доске: ${name}`;
      return `<button type="button" class="bd-peer${stale ? ' is-stale' : ''}" data-uid="${escHtml(uid)}" title="${escHtml(title)}">`
        + `<span class="bd-peer-dot" style="background:${peerColor(uid)}">${letter}${locate}</span>`
        + `<span class="bd-peer-name">${escHtml(name)}</span></button>`;
    }).join('');
  }
  function findPeer(uid) {
    const p = peers.get(uid);
    if (!p || !window.boardsFlyTo) return false;
    const cur = remoteCursors.get(uid);
    let x, y;
    if (cur && typeof cur.x === 'number') { x = cur.x; y = cur.y; }
    else if (typeof p.cx === 'number') { x = p.cx; y = p.cy; }
    else return false;
    window.boardsFlyTo(x, y);
    const color = peerColor(uid);
    const el = document.createElement('div');
    el.className = 'bd-peer-ping';
    el.style.setProperty('--ping-c', color);
    cursorLayer.appendChild(el);
    peerPings.push({ el, x, y, until: Date.now() + 3200 });
    if (cur && cur.el) {
      cur.el.style.setProperty('--ping-c', color);
      cur.el.classList.add('is-found');
      setTimeout(() => cur.el && cur.el.classList.remove('is-found'), 2400);
    }
    startCursorAnim();
    return true;
  }
  function clearPeers() {
    peers.clear();
    peerPings.forEach(pg => pg.el.remove());
    peerPings = [];
    hereLastView = null;
    renderPeers();
  }
  peersBar.addEventListener('click', (e) => {
    const b = e.target.closest('.bd-peer');
    if (b) findPeer(b.dataset.uid);
  });
  setInterval(() => {
    if (!cloudBoardId) return;
    if (cloudChannel && Date.now() - hereLastSentAt >= HERE_EVERY - 100) sendHere();
    const now = Date.now();
    let changed = false;
    peers.forEach((p, uid) => {
      const quiet = now - p.lastSeen;
      if (quiet > PEER_GONE) { peers.delete(uid); changed = true; }
      else if (quiet > PEER_TTL && !p.stale) { p.stale = true; changed = true; }
    });
    if (changed) renderPeers();
  }, 1000);

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
  // одинаково ли содержимое двух копий объекта. Ключи сортируются: из базы
  // объект приходит с другим их порядком (jsonb), и простое сравнение JSON
  // считало бы разными одинаковые. src — сотни КБ, его не сериализуем
  function sameObjectContent(a, b) {
    if (!a || !b) return a === b;
    if (a.src !== b.src) return false;
    const sig = (v, top) => {
      if (Array.isArray(v)) return '[' + v.map(x => sig(x, false)).join(',') + ']';
      if (v && typeof v === 'object') {
        // undefined в базу не доезжает (JSON его выбрасывает) — не различие
        return '{' + Object.keys(v).filter(k => v[k] !== undefined && !(top && k === 'src')).sort()
          .map(k => JSON.stringify(k) + ':' + sig(v[k], false)).join(',') + '}';
      }
      return JSON.stringify(v === undefined ? null : v);
    };
    return sig(a, true) === sig(b, true);
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

  /* Промпт №76: плашка «доска загружена не полностью».
     Живой случай (доска Юли, 19 и 25 сентября): до промпта №10 база отдавала
     при входе только первую тысячу объектов, последние 325 штрихов урока
     19-го не показывались, низ доски выглядел пустым — и 25-го там же
     написали новый урок. Когда загрузка починилась, два урока легли друг на
     друга. Сам потолок в 1000 строк №10 снял, но неполная загрузка возможна
     и сейчас (связь, сбой базы) — а знала об этом только консоль. Человек
     видел пустое место и писал поверх невидимого. Поэтому состояние загрузки
     теперь видно на самой доске:
     - первая загрузка идёт дольше LOAD_BANNER_DELAY_MS — спокойная плашка
       (короткую не показываем: мелькание на каждом входе приучит плашку не
       замечать);
     - ответ неполный, идут повторы — жёлтая, «часть записей может быть не
       видна»;
     - повторы кончились — красная с кнопкой «Повторить». Держится, пока
       загрузка не пройдёт целиком (сама, сверкой раз в полминуты, или по
       кнопке), и НЕ сменяется спокойной на время очередной попытки — иначе
       раз в полминуты казалось бы, что всё в порядке */
  const LOAD_BANNER_DELAY_MS = 700;
  let cloudLoadTrouble = null;   // null | 'warn' | 'bad' — худшее с начала этого открытия, пока не загрузилось целиком
  let loadBannerTimer = null;
  function setLoadState(s) {
    cloudLoadState = s;
    if (s === 'retry' && cloudLoadTrouble !== 'bad') cloudLoadTrouble = 'warn';
    if (s === 'failed') cloudLoadTrouble = 'bad';
    if (s === 'done') cloudLoadTrouble = null;
    renderLoadBanner();
  }
  function loadBannerEl() {
    let el = document.getElementById('bdCloudLoad');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'bdCloudLoad';
    el.setAttribute('role', 'status');
    el.innerHTML = '<span class="bd-cl-text"></span><button type="button" class="bd-cl-check">Проверить связь</button>'
      + '<button type="button" class="bd-cl-retry">Повторить</button>';
    el.querySelector('.bd-cl-retry').addEventListener('click', retryLoadNow);
    // №94: плашка о сбое — ровно тот момент, когда человек спрашивает
    // «у меня что-то с интернетом?»; ответ — проверка в один клик
    el.querySelector('.bd-cl-check').addEventListener('click', () => { if (window.MathhNetCheck) window.MathhNetCheck.open(); });
    // внутри экрана доски: на списке досок плашки не видно в любом случае
    (document.getElementById('screenBoard') || document.body).appendChild(el);
    return el;
  }
  function hideLoadBanner() {
    clearTimeout(loadBannerTimer); loadBannerTimer = null;
    const el = document.getElementById('bdCloudLoad');
    if (el) el.className = '';
  }
  function showLoadBanner(kind, text, retry) {
    const el = loadBannerEl();
    el.className = 'open ' + kind;
    el.querySelector('.bd-cl-text').textContent = text;
    const btn = el.querySelector('.bd-cl-retry');
    btn.hidden = !retry;
    // обычная «загружается…» — не сбой, проверку не предлагаем
    el.querySelector('.bd-cl-check').hidden = kind === 'wait' || !window.MathhNetCheck;
    // пока попытка идёт, вторую по кнопке не запускаем — просто видно, что пробуем
    const busy = cloudLoadState === 'loading';
    btn.disabled = busy;
    btn.textContent = busy ? 'Пробую…' : 'Повторить';
  }
  function renderLoadBanner() {
    const s = cloudLoadState;
    // №93: о связи плашка говорит и на загруженной доске — без связи новое
    // от собеседника не приходит, хотя загрузка давно кончилась
    const lost = liveLostLong();
    liveBannerOn = lost;
    if (!cloudBoardId || s === 'idle' || (s === 'done' && !lost)) { hideLoadBanner(); return; }
    if (cloudLoadTrouble === 'bad') {
      clearTimeout(loadBannerTimer); loadBannerTimer = null;
      showLoadBanner('bad', 'Доска загружена не полностью — часть записей может быть не видна. '
        + 'Не пишите на пустых местах, пока не догрузится.' + netHint(), true);
      return;
    }
    if (lost) {
      clearTimeout(loadBannerTimer); loadBannerTimer = null;
      showLoadBanner('warn', 'Нет связи с доской — переподключаюсь. Пока связи нет, новое от собеседника сюда не приходит.' + netHint(), false);
      return;
    }
    if (cloudLoadTrouble === 'warn') {
      clearTimeout(loadBannerTimer); loadBannerTimer = null;
      showLoadBanner('warn', 'Связь с базой сбоит — догружаю доску. Пока не догрузится, часть записей может быть не видна.' + netHint(), false);
      return;
    }
    // обычная первая загрузка: показываем, только если затянулась. Связь
    // только что вернулась — её плашку убираем сразу, не ждём таймера
    const cur = document.getElementById('bdCloudLoad');
    if (cur && cur.classList.contains('open') && !cur.classList.contains('wait')) hideLoadBanner();
    if (loadBannerTimer) return;
    loadBannerTimer = setTimeout(() => {
      loadBannerTimer = null;
      if (cloudLoadState === 'loading' && cloudBoardId && !cloudLoadTrouble && !liveLostLong()) {
        showLoadBanner('wait', 'Доска загружается из облака…', false);
      }
    }, LOAD_BANNER_DELAY_MS);
  }
  function retryLoadNow() {
    const board = window.getCurrentBoard && window.getCurrentBoard();
    if (!cloudBoardId || !board || board.cloudBoardId !== cloudBoardId) return;
    if (cloudLoadState === 'loading' || cloudLoadState === 'done') return;
    cloudInitialLoad(cloudBoardId, board, cloudLoadGen, LOAD_RETRY_MS.length);
  }

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
    sameContent: sameObjectContent,
    tombs: () => cloudTombs,
    writesIdle: () => cloudWriteChain,
    // Промпт №10
    loadState: () => cloudLoadState,
    retryLoad: () => retryLoadNow(),   // Промпт №76
    seen: () => Array.from(cloudSeen),
    reconcileNow: () => reconcileOnce(cloudBoardId),
    // «Найти участника»
    peers: () => Array.from(peers.keys()),
    hereState: () => ({ at: hereLastSentAt, now: Date.now(), channel: !!cloudChannel, board: cloudBoardId }),
    // №93 «связь с доской»
    live: () => ({ live: cloudLive, ever: cloudLiveEver, lostAt: cloudLiveLostAt, drops: cloudLiveDrops.length, troubles: netTroubles() }),
    setLiveTimes: (bannerMs, peerTtl, peerGone) => { LIVE_BANNER_MS = bannerMs; PEER_TTL = peerTtl; PEER_GONE = peerGone; },
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
  // Правка общей доски уходит собеседнику, только если перед ней был
  // pushUndo — он снимает «как было» для сравнения. Жест, который сам решает,
  // звать ли pushUndo (колесо над картинкой: один шаг отмены на серию
  // прокруток), спрашивает здесь, не закрылся ли его снимок: сохранение
  // закрывает его через 250 мс, и остаток серии иначе оставался только на
  // этом экране (раздел 8 HANDOFF, «картинка у учителя и ученика разная»)
  window.boardsCloudGestureIdle = function () { return !!cloudBoardId && cloudGestureBefore === null; };
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

  /* ═══ Задание на доске у обоих сразу ═══
     Поля ответа, варианты, «Проверить» и «Показать решение и ответ» лежат
     поверх картинки задания. Их состояние едет лёгким сообщением task_live
     (ядро, boardsApplyTaskLive / taskLiveOut): по символу при наборе и сразу
     по нажатию. Картинку целиком собеседник по-прежнему получает обычной
     правкой через базу — она нужна для перезагрузки, но живой показ от неё
     больше не зависит.
     Страховка записи: ученик с уровнем «Только свои записи» правит объект,
     который положил учитель, и правила базы могут такую запись не пустить —
     тогда после перезагрузки ответ ученика пропал бы. Поэтому тот, у кого
     полный доступ, получив новый итог или разбор от собеседника, ждёт его
     «записано» (board_ready). Не дождался — сверяет с базой и, если там
     другое, записывает сам, своей правкой без шага отмены */
  const TASK_SAVE_WAIT_MS = 4000;
  const taskSaveWait = new Map();   // id задания → таймер
  window.boardsTaskLiveSend = function (p) {
    if (!cloudBoardId || !cloudChannel || !p) return;
    try {
      cloudChannel.send({ type: 'broadcast', event: 'task_live',
        payload: Object.assign({}, p, { uid: myUid() || null, b: cloudBoardId }) });
    } catch (e) {}
  };
  function taskSaved(ids) {
    (ids || []).forEach(id => {
      if (!taskSaveWait.has(id)) return;
      clearTimeout(taskSaveWait.get(id));
      taskSaveWait.delete(id);
    });
  }
  function cloudHandleTaskLive(payload) {
    if (!payload || !payload.id || !cloudBoardId) return;
    if (payload.uid && payload.uid === myUid()) return;
    if (payload.b && payload.b !== cloudBoardId) return;
    const board = window.getCurrentBoard();
    if (!board || board.cloudBoardId !== cloudBoardId || !window.boardsApplyTaskLive) return;
    const res = window.boardsApplyTaskLive(payload);
    if (res !== 'state') return;
    // итог поменял объект доски: мой незавершённый жест не должен счесть это
    // своей правкой, а на диске пусть лежит то же, что на экране
    syncGestureBefore(board, [payload.id]);
    persistBoardQuiet(board);
    if (window.getBoardAccess && window.getBoardAccess() === 'full') {
      clearTimeout(taskSaveWait.get(payload.id));
      const boardId = cloudBoardId;
      taskSaveWait.set(payload.id, setTimeout(() => ensureTaskSaved(boardId, payload.id), TASK_SAVE_WAIT_MS));
    }
  }
  async function ensureTaskSaved(boardId, id) {
    taskSaveWait.delete(id);
    if (boardId !== cloudBoardId) return;
    const res = await window.SB.from('board_objects').select('obj_id, data').eq('board_id', boardId).in('obj_id', [id]);
    if (res.error || !res.data || boardId !== cloudBoardId) return;
    const board = window.getCurrentBoard();
    const obj = board && board.objects.find(o => o.id === id);
    if (!obj) return;
    const row = res.data[0] && res.data[0].data;
    const pick = (o) => JSON.stringify([o && o.task ? (o.task.st || null) : null, o && o.sol ? !!o.sol.open : null]);
    if (row && pick(row) === pick(obj)) return;    // собеседник записал сам
    if (row && revOf(row) > revOf(obj)) return;     // в базе новее — придёт своим путём
    const diff = { added: [], updated: [{ id, before: cloneObj(obj), after: obj }], removed: [] };
    stampLocalDiff(diff);
    pushDiffToSupabase(boardId, diff);
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
    // №92: версии — снимки доски с картинками в хранилище браузера, самый
    // тяжёлый его жилец. Когда места нет (инкогнито, забитый диск), без них:
    // доска и так в облаке, а версия, упирающаяся в квоту, роняла запись досок
    if (window.boardsCloudOnly && window.boardsCloudOnly()) return Promise.resolve(false);
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
    liveReset();
    openCloudChannel(boardId);
    startReconcile(boardId);
    cloudInitialLoad(boardId, board, cloudLoadGen, 0);
  }

  function openCloudChannel(boardId) {
    const ch = window.SB.channel('board_objects:' + boardId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'board_objects', filter: 'board_id=eq.' + boardId }, cloudHandleRemoteChange)
      // курсоры — тем же каналом, но отдельным типом сообщений: broadcast
      // ничего не пишет в базу (в отличие от postgres_changes выше), это
      // ровно то, что нужно для эфемерного "где сейчас мышь"
      .on('broadcast', { event: 'cursor' }, ({ payload }) => cloudHandleRemoteCursor(payload))
      .on('broadcast', { event: 'here' }, ({ payload }) => cloudHandleHere(payload))
      // быстрый путь для самих объектов доски — см. pushDiffToSupabase выше;
      // postgres_changes (обработчик над этим) остаётся как подстраховка
      .on('broadcast', { event: 'board_diff' }, ({ payload }) => cloudHandleRemoteDiff(payload))
      // Промпт №42: «объекты записаны, заберите их сами» — страховка на случай,
      // если основная рассылка не долетела
      // задание на доске: набор, проверка, разбор — см. cloudHandleTaskLive
      .on('broadcast', { event: 'task_live' }, ({ payload }) => cloudHandleTaskLive(payload))
      .on('broadcast', { event: 'board_ready' }, ({ payload }) => {
        if (!payload || !payload.ids) return;
        if (payload.uid && window.CURRENT_USER && payload.uid === window.CURRENT_USER.id) return;
        taskSaved(payload.ids);
        const b = window.getCurrentBoard();
        if (!b) return;
        const revs = payload.revs || {};
        const { ids, expect } = wantedFromAnnounce(b, payload.ids.map(id => ({ id, rv: revs[id] })));
        if (ids.length) fetchHeavyObjects(cloudBoardId, ids, 0, expect);
      });
    // канал запоминаем ДО подписки: ответ о подписке сверяется с ним — так
    // запоздалое «закрыт» от канала прошлой доски не трогает нынешний
    cloudChannel = ch;
    ch.subscribe((status) => liveStatus(ch, boardId, status));
  }

  /* №93 «связь с доской». Живая связь (вебсокет) у ученика на уроке
     19.10.2026 то рвалась, то возвращалась (провайдер режет связь с
     Cloudflare, см. sbGuardedFetch в supabase-config.js) — и ничего этого
     не было видно: у учителя кнопка ученика и его курсор мигали, у ученика
     переставало появляться новое на доске. Библиотека сама переподключает
     сокет и заново подписывает канал, но:
     - всё, что собеседник сделал, пока связи не было, до нас не доходило
       до сверки раз в полминуты — а сверка не шла вовсе, пока висела
       загрузка доски. Теперь сразу после переподключения — сверка;
     - связи нет дольше LIVE_BANNER_MS — плашка на доске («Нет связи с
       доской — переподключаюсь»), а не тишина;
     - канал, закрытый не нами (CLOSED сам по себе, без ухода с доски),
       библиотека заново не открывает — открываем сами через 2 с;
     - связь рвалась не раз за последние минуты — в плашке совет сменить
       сеть: дело не в доске, и перезагрузка тут не поможет */
  let LIVE_BANNER_MS = 6000;
  const NET_HINT_WINDOW_MS = 5 * 60 * 1000;
  let cloudLive = false;        // канал сейчас подключён
  let cloudLiveEver = false;    // был ли подключён хоть раз за это открытие
  let cloudLiveLostAt = 0;      // с какого момента связи нет (0 — связь есть)
  let cloudLiveDrops = [];      // когда связь пропадала после подключения
  let liveBannerOn = false;
  let reopenTimer = null;
  function liveReset() {
    cloudLive = false; cloudLiveEver = false;
    // открыли доску — связи ещё нет: если подключение так и не случится,
    // плашка покажется так же, как при обрыве
    cloudLiveLostAt = Date.now();
    cloudLiveDrops = [];
    liveBannerOn = false;
    clearTimeout(reopenTimer); reopenTimer = null;
  }
  function liveLostLong() {
    return !!cloudBoardId && !cloudLive && cloudLiveLostAt > 0 && Date.now() - cloudLiveLostAt >= LIVE_BANNER_MS;
  }
  function liveStatus(ch, boardId, status) {
    if (ch !== cloudChannel || boardId !== cloudBoardId) return;
    if (status === 'SUBSCRIBED') {
      const back = cloudLiveEver && !cloudLive;
      cloudLive = true; cloudLiveEver = true; cloudLiveLostAt = 0;
      // «я пришёл, кто здесь?» — только когда канал действительно
      // подключён: отправленное раньше сервер молча выбросит
      sendHere({ ask: true });
      // пока связи не было, рассылки собеседника пропали — забираем из базы
      if (back) setTimeout(() => { if (cloudChannel === ch) reconcileOnce(boardId); }, 300);
      renderLoadBanner();
      return;
    }
    // CHANNEL_ERROR, TIMED_OUT, CLOSED
    if (cloudLive) { cloudLiveDrops.push(Date.now()); cloudLiveLostAt = Date.now(); }
    else if (!cloudLiveLostAt) cloudLiveLostAt = Date.now();
    cloudLive = false;
    if (status === 'CLOSED') {
      // после ошибки и таймаута библиотека переподписывает канал сама, после
      // закрытия — нет. Наш собственный уход с доски сюда не попадает:
      // cloudTeardownSubscription обнуляет cloudChannel раньше
      clearTimeout(reopenTimer);
      reopenTimer = setTimeout(() => {
        reopenTimer = null;
        if (cloudChannel !== ch || cloudBoardId !== boardId) return;
        // как при уходе с доски: старый канал не должен отвечать в liveStatus
        cloudChannel = null;
        try { window.SB.removeChannel(ch); } catch (e) {}
        openCloudChannel(boardId);
      }, 2000);
    }
  }
  // сколько раз за последние минуты связь рвалась: обрывы сокета плюс
  // запросы к базе, оборванные сторожем за молчание
  function netTroubles() {
    const now = Date.now();
    cloudLiveDrops = cloudLiveDrops.filter(t => now - t < NET_HINT_WINDOW_MS);
    const stalls = (window.sbGuardedFetch && window.sbGuardedFetch.stalls || []).filter(t => now - t < NET_HINT_WINDOW_MS);
    return cloudLiveDrops.length + stalls.length;
  }
  function netHint() {
    return netTroubles() >= 2
      ? ' Связь рвётся уже не первый раз — похоже, её режут по дороге к серверу доски. Помогает другая сеть: например, раздать интернет с телефона.'
      : '';
  }
  // плашка о связи появляется и уходит по времени, а не по событию: «нет
  // связи 6 с» — это момент, о котором сам канал ничего не сообщает
  setInterval(() => {
    if (liveLostLong() !== liveBannerOn) renderLoadBanner();
  }, 1000);

  // Промпт №10: загрузка общей доски при входе — слиянием, а не заменой.
  // Подробности — в комментарии у cloudSeen выше
  async function cloudInitialLoad(boardId, board, gen, attempt) {
    const alive = () => gen === cloudLoadGen && boardId === cloudBoardId && window.getCurrentBoard() === board;
    if (!alive()) return;
    setLoadState('loading');
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
        // «Та же версия — то же содержимое» верно, только если каждая правка
        // доходила до базы. Правка без pushUndo (колесо над картинкой) номер
        // не поднимала и в базу не уходила — у одного участника картинка
        // оставалась своего размера навсегда, и записи собеседника ложились у
        // него мимо рисунка. Поэтому при той же версии всё равно сверяем
        // содержимое, но без тяжёлого src (его — простым сравнением строк) и
        // без учёта порядка ключей: jsonb в базе их переставляет
        const differs = sameVer ? !sameObjectContent(local, inc) : JSON.stringify(local) !== JSON.stringify(inc);
        if (differs) { next[i] = cloneObj(inc); touched.push(inc.id); }
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
    // №90: тип доски («презентация») на сервер не ездит — его узнают по
    // служебному объекту слайдов, а он приходит только сейчас, из базы
    if (window.deckAdopt) window.deckAdopt(board);
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
    if (complete) { setLoadState('done'); return; }
    if (attempt < LOAD_RETRY_MS.length) {
      setLoadState('retry');
      setTimeout(() => cloudInitialLoad(boardId, board, gen, attempt + 1), LOAD_RETRY_MS[attempt]);
    } else {
      setLoadState('failed');
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
      try { cloudChannel.send({ type: 'broadcast', event: 'here', payload: { uid: window.CURRENT_USER ? window.CURRENT_USER.id : null, bye: true } }); } catch (e) {}
      // обнуляем ДО removeChannel: его «закрыт» не должен выглядеть как
      // обрыв связи и открывать канал заново (liveStatus)
      const ch = cloudChannel;
      cloudChannel = null;
      window.SB.removeChannel(ch);
    }
    clearTimeout(reopenTimer); reopenTimer = null;
    cloudLive = false; cloudLiveLostAt = 0;
    stopCursorAnim();
    clearAllCursors();
    clearPeers();
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
    cloudLoadTrouble = null;
    setLoadState('idle');
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
    setLoadState('idle');
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
    email = email.trim().toLowerCase();
    const { data: profile, error: pErr } = await window.SB.from('profiles').select('id').eq('email', email).maybeSingle();
    let userId = !pErr && profile ? profile.id : null;
    if (!userId) {
      // Промпт №83: почты на платформе ещё нет. Владелец и преподаватель
      // добавляют её в список тут же, учеником, — функция сразу создаёт
      // аккаунт, и к доске можно звать, не дожидаясь первого входа (раньше
      // приходилось просить человека сначала войти по письму)
      const myRole = window.mathhRole ? window.mathhRole() : null;
      if ((myRole !== 'owner' && myRole !== 'teacher') || !window.mathhAddAccess) {
        renderSharePanel('Этой почты нет на платформе. Попросите преподавателя добавить её, потом позовите снова.', true);
        return;
      }
      renderSharePanel('Добавляю почту на платформу…');
      const res = await window.mathhAddAccess(email, 'student');
      const r = res && res.ok && res.results && res.results[0];
      if (!r || !r.user_id) {
        renderSharePanel(r && r.status === 'bad_email' ? 'Похоже, в почте опечатка — проверьте её.'
          : 'Не получилось добавить почту на платформу. Проверьте интернет и попробуйте ещё раз.', true);
        return;
      }
      userId = r.user_id;
    }
    const { error } = await window.SB.from('board_access').upsert({ board_id: cloudBoardId, user_id: userId, role }, { onConflict: 'board_id,user_id' });
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
    // №93: created_at — настоящее время создания доски. Раньше заглушке
    // ставили «сейчас», и у всех подтянутых из облака досок «Создана»
    // совпадало с моментом открытия страницы (в инкогнито — каждый раз)
    // «Корзина досок»: trashed_at появляется после boards-trash-schema.sql.
    // Пока файл не запущен, такой запрос — ошибка; тогда спрашиваем по-старому
    let { data: boardsRows, error } = await window.SB.from('boards').select('id, title, owner, created_at, trashed_at');
    if (error) {
      // без trashed_at удалённое на другом устройстве не узнать — об этом
      // надо сказать, а не тихо работать по-старому
      cloudTrashFailed('select trashed_at', error);
      ({ data: boardsRows, error } = await window.SB.from('boards').select('id, title, owner, created_at'));
    } else cloudTrashOk('select trashed_at');
    if (error || !boardsRows) return;
    // Список из хранилища должен быть уже загружен (boardsBootReady в
    // boards-core.js): иначе ни карточек, ни следов удаления ещё не видно,
    // и всё с сервера завелось бы заново — так удалённые и воскресали
    if (window.boardsBootReady) await window.boardsBootReady;
    const db = window.getDB();
    if (!db) return;
    const now = window.nowTs();
    // облачные доски, стёртые здесь насовсем: пока сервер их не стёр (нет
    // связи, не запущен SQL), строка в базе ещё есть — заново не заводим
    const goneTraces = (db.deleted || []).filter(d => d.kind === 'cloud');
    const goneCloud = new Set(goneTraces.map(d => d.id));
    const rowIds = new Set(boardsRows.map(r => r.id));
    let changed = false;
    // Строка «стёртой» доски всё ещё приходит с сервера (стирание не прошло
    // или сервер его не делает) — след продлеваем, иначе через 90 дней
    // (pruneDeleted) доска вернулась бы
    goneTraces.forEach(d => {
      if (rowIds.has(d.id) && now - (d.at || 0) > CLOUD_TRACE_REFRESH_MS) { d.at = now; changed = true; }
    });
    if (cloudDropStubs(db, goneCloud)) changed = true;
    const { data: accessRows } = await window.SB.from('board_access').select('board_id, role').eq('user_id', window.CURRENT_USER.id);
    const roleByBoard = new Map((accessRows || []).map(r => [r.board_id, r.role]));
    boardsRows.forEach(row => {
      if (goneCloud.has(row.id)) return;
      const born = Date.parse(row.created_at || '') || 0;
      const have = db.boards.find(b => b.cloudBoardId === row.id);
      if (have) {
        // заглушки, заведённые до №93, чиним на месте. Берём более раннее из
        // двух: у перенесённой из браузера доски (№90) своё время старше
        // строки в базе, его не трогаем
        if (born && (!have.createdAt || born < have.createdAt)) { have.createdAt = born; changed = true; }
        // Корзина на другом устройстве: владелец удалил доску там — здесь
        // она тоже уходит в корзину (у всех её карточек). Вернул там —
        // возвращается и здесь, но только если в корзину её положил сервер,
        // а не человек на этом устройстве (trashSource)
        const serverTrashed = Date.parse(row.trashed_at || '') || 0;
        db.boards.forEach(b => {
          if (b.cloudBoardId !== row.id) return;
          if (serverTrashed && !b.trashedAt && !b.cloudRestorePending) {
            b.trashedAt = serverTrashed; b.trashSource = 'server'; window.touchBoard(b); changed = true;
          } else if (!serverTrashed && b.trashedAt && b.trashSource === 'server') {
            b.trashedAt = 0; b.trashSource = ''; window.touchBoard(b); changed = true;
          }
        });
        return;
      }
      if (row.trashed_at) return;   // в корзине у владельца — новую карточку не заводим
      const role = row.owner === window.CURRENT_USER.id ? 'owner' : (roleByBoard.get(row.id) || 'editor');
      db.boards.push({
        id: window.uid(), name: row.title || 'Общая доска', folderId: null,
        createdAt: born || window.nowTs(), updatedAt: born || window.nowTs(), lastOpenedAt: null,
        cellSize: 24, sheetCols: 76, sheetRows: 54, sheetCount: 1, pageOrder: 'h',
        objects: [], recentColors: [], colorUsage: {},
        cloudBoardId: row.id, cloudRole: role,
      });
      changed = true;
    });
    // Доски, которых на сервере больше нет (владелец стёр, доступ убрали), —
    // в корзину, а не насовсем: если это ошибка (в браузере вошли под
    // другой почтой), за 5 дней всё вернётся само при входе нужного
    // человека. Сервер отдаёт не больше 1000 строк — при длинном списке
    // «нет в ответе» не значит «нет на сервере», тогда ничего не трогаем
    if (boardsRows.length < 900) {
      db.boards.forEach(b => {
        if (!b.cloudBoardId || b.cloudPendingId || b.trashedAt || rowIds.has(b.cloudBoardId)) return;
        if (window.getCurrentBoard && window.getCurrentBoard() === b) return;
        b.trashedAt = now; b.trashSource = 'server'; window.touchBoard(b); changed = true;
      });
    }
    if (changed) { window.saveDB(); if (window.renderList) window.renderList(); }
  };

  const CLOUD_TRACE_REFRESH_MS = 30 * 24 * 3600 * 1000;
  /* Лишние карточки облачных досок. «Заглушка» — живая карточка, которую ни
     разу не открывали в этом браузере (своего содержимого у неё нет, всё на
     сервере). Такие плодили гонка импорта с загрузкой списка и две вкладки,
     импортировавшие одновременно. Убираем заглушку, если:
     - доску здесь стёрли насовсем (след «cloud») — это воскресшая;
     - у той же доски есть другая карточка: открытая или положенная в
       корзину — там решение человека, заглушка его отменяла;
     - заглушек несколько и других нет — оставляем одну (с меньшим id, чтобы
       все вкладки выбрали одну и ту же).
     Убираем только из браузера (deleteListItems), сервер не трогаем */
  function cloudDropStubs(db, goneCloud) {
    const cur = window.getCurrentBoard && window.getCurrentBoard();
    const isStub = b => !b.trashedAt && !b.lastOpenedAt && !b.cloudPendingId && b !== cur
      && !(Array.isArray(b.objects) && b.objects.length);
    const groups = new Map();
    db.boards.forEach(b => {
      if (!b.cloudBoardId) return;
      if (!groups.has(b.cloudBoardId)) groups.set(b.cloudBoardId, []);
      groups.get(b.cloudBoardId).push(b);
    });
    const drop = [];
    groups.forEach((list, cloudId) => {
      const stubs = list.filter(isStub);
      if (!stubs.length) return;
      if (goneCloud.has(cloudId)) { stubs.forEach(b => drop.push(b.id)); return; }
      if (list.length < 2) return;
      if (stubs.length < list.length) { stubs.forEach(b => drop.push(b.id)); return; }
      stubs.sort((a, b) => (a.id < b.id ? -1 : 1)).slice(1).forEach(b => drop.push(b.id));
    });
    if (!drop.length) return false;
    console.info('[корзина] убраны лишние карточки облачных досок:', drop);
    window.deleteListItems(drop, []);
    return true;
  }

  /* Сбой сервера корзины виден: запись в консоль с текстом ошибки и плашка
     над списком досок (#blCloudWarn). Раньше cloudRpc глотал ошибку молча,
     и при незапущенном boards-trash-schema.sql доска удалялась только в
     этом браузере, а на другом устройстве возвращалась */
  const trashFailures = new Map();   // что не прошло → текст ошибки
  function rpcErrorText(error) {
    if (!error) return '';
    if (typeof error === 'string') return error;
    return [error.code, error.message || String(error)].filter(Boolean).join(' ');
  }
  function noTrashSql(error) {
    const t = rpcErrorText(error);
    return /PGRST202|42883|42703|Could not find the function|trashed_at/i.test(t);
  }
  function cloudTrashFailed(name, error) {
    const text = rpcErrorText(error);
    console.error('[корзина] ' + name + ' не прошёл: ' + text, error);
    trashFailures.set(name, error);
    renderTrashWarn();
  }
  function cloudTrashOk(name) {
    if (trashFailures.delete(name)) renderTrashWarn();
  }
  function renderTrashWarn() {
    const el = document.getElementById('blCloudWarn');
    if (!el) return;
    if (!trashFailures.size) { el.hidden = true; return; }
    const errs = [...trashFailures.values()];
    const sql = errs.some(noTrashSql);
    const msg = sql
      ? 'На сервере не настроена корзина досок (не запущен boards-trash-schema.sql в Supabase). Удаление досок дошло только до этого браузера — на других устройствах они вернутся. Сайт повторит при следующем входе.'
      : 'Сервер не принял удаление или восстановление досок — на других устройствах они могут вернуться. Сайт повторит при следующем входе.';
    el.querySelector('.bl-cloud-warn-text').textContent = msg;
    el.querySelector('.bl-cloud-warn-detail').textContent =
      [...trashFailures.entries()].map(([n, e]) => n + ': ' + rpcErrorText(e)).join(' · ');
    el.hidden = false;
  }
  // стирание дошло — след «cloud» больше не нужен навсегда (pruneDeleted
  // заберёт его через 90 дней). Время сдвигаем вперёд: при слиянии вкладок
  // побеждает более свежий след, и неподтверждённая копия соседней вкладки
  // не перебьёт подтверждение
  function cloudConfirmGone(ids) {
    const db = window.getDB();
    const set = new Set(ids);
    let changed = false;
    (db.deleted || []).forEach(d => {
      if (d.kind !== 'cloud' || !set.has(d.id) || d.pending === false) return;
      d.pending = false; d.at = Math.max(window.nowTs(), (d.at || 0) + 1); changed = true;
    });
    if (changed) window.saveDB();
  }

  /* ═══ Корзина досок: что делать на сервере (boards-trash-schema.sql) ═══
     Движок (boards-core.js, блок «Корзина досок») сам решает, что лежит в
     корзине, и зовёт эти хуки. Здесь — только сервер:
     - в корзину / из корзины — пометка trashed_at у МОЕЙ доски, чтобы
       другие устройства тоже её спрятали или вернули;
     - насовсем — boards_delete_now: моя доска стирается целиком, у чужой
       убирается только мой доступ.
     Сервер трогаем, только если в списке нет второй живой карточки той же
     облачной доски: после пересборки хранилища заглушки бывают дважды
     (HANDOFF, раздел 6), и удаление лишней не должно стирать доску.
     Карточки, которые в корзину положил сам сервер (trashSource 'server'),
     на сервер ничего не шлют — там их судьбу уже решил владелец.
     Не дошло (нет связи, SQL не запущен) — флаг остаётся и вызов
     повторяется при следующем входе (cloudTrashReconcile). */
  function cloudTwinAlive(b, except) {
    return window.getDB().boards.some(x => x !== b && x.cloudBoardId === b.cloudBoardId
      && !x.trashedAt && !(except && except.has(x.id)));
  }
  async function cloudRpc(name, args, quiet) {
    if (!window.SB || !window.CURRENT_USER) return { error: 'нет входа' };
    let r;
    try { r = await window.SB.rpc(name, args); } catch (e) { r = { error: e }; }
    r = r || { error: 'пустой ответ' };
    if (!quiet) { if (r.error) cloudTrashFailed(name, r.error); else cloudTrashOk(name); }
    return r;
  }
  // Стирание насовсем — по одной доске за вызов: весь вызов функции — один
  // запрос под statement timeout, и пачка досок (вход досылает все следы
  // разом, «С сервера» — сколько отметили) упиралась в него целиком (57014).
  // Так прошедшие подтверждаются, а не прошедшие повторятся при следующем входе
  async function cloudDeleteNow(ids) {
    let firstErr = null;
    for (const id of ids) {
      const r = await cloudRpc('boards_delete_now', { p_boards: [id] }, true);
      if (r.error) { if (!firstErr) firstErr = r.error; if (r.error === 'нет входа') break; }
      else cloudConfirmGone([id]);
    }
    if (firstErr && firstErr !== 'нет входа') cloudTrashFailed('boards_delete_now', firstErr);
    else if (!firstErr) cloudTrashOk('boards_delete_now');
  }
  function cloudMarkDone(list, flag) {
    list.forEach(b => { if (b[flag]) { b[flag] = false; window.touchBoard(b); } });
    window.saveDB();
  }
  window.onBoardsTrashed = function (list) {
    const mine = list.filter(b => b.cloudBoardId && !b.cloudPendingId && b.trashSource !== 'server' && !cloudTwinAlive(b));
    if (!mine.length) return;
    mine.forEach(b => { b.cloudTrashPending = true; b.cloudRestorePending = false; });
    cloudRpc('boards_trash', { p_boards: mine.map(b => b.cloudBoardId) })
      .then(r => { if (!r.error) cloudMarkDone(mine, 'cloudTrashPending'); });
  };
  window.onBoardsRestored = function (list) {
    const mine = list.filter(b => b.cloudBoardId && !b.cloudPendingId);
    if (!mine.length) return;
    mine.forEach(b => { b.cloudRestorePending = true; b.cloudTrashPending = false; });
    cloudRpc('boards_restore', { p_boards: mine.map(b => b.cloudBoardId) })
      .then(r => { if (!r.error) cloudMarkDone(mine, 'cloudRestorePending'); });
  };
  window.onBoardsPurged = function (list) {
    const purging = new Set(list.map(b => b.id));
    const ids = [];
    list.forEach(b => {
      if (!b.cloudBoardId || b.cloudPendingId || b.trashSource === 'server') return;
      // вторая карточка той же доски (живая или в корзине, но не стираемая
      // сейчас) — сервер не трогаем
      if (window.getDB().boards.some(x => !purging.has(x.id) && x.cloudBoardId === b.cloudBoardId)) return;
      if (ids.includes(b.cloudBoardId)) return;
      ids.push(b.cloudBoardId);
      // след «стёрта насовсем»: пока он есть (90 дней), импорт не заведёт
      // доску заново, а вход повторит стирание на сервере
      window.noteDeleted('cloud', b.cloudBoardId, { pending: true });
    });
    if (ids.length) cloudDeleteNow(ids);
  };
  // При каждом входе: дослать то, что не дошло, и стереть мою просроченную
  // корзину на сервере (вдруг браузер, где доску удалили, больше не открывали)
  window.cloudTrashReconcile = async function () {
    const db = window.getDB && window.getDB();
    if (!db || !window.CURRENT_USER) return;
    // прошлые сбои вызовов забываем: что ещё не дошло, повторяется ниже, и
    // его новый сбой снова поднимет плашку. Иначе плашка висела бы из-за
    // вызова, повторять который уже нечего (доску с тех пор стёрли)
    ['boards_trash', 'boards_restore', 'boards_delete_now', 'boards_purge_trash'].forEach(n => trashFailures.delete(n));
    renderTrashWarn();
    const tr = db.boards.filter(b => b.cloudTrashPending && b.trashedAt);
    if (tr.length) {
      const r = await cloudRpc('boards_trash', { p_boards: tr.map(b => b.cloudBoardId) });
      if (!r.error) cloudMarkDone(tr, 'cloudTrashPending');
    }
    const rs = db.boards.filter(b => b.cloudRestorePending && !b.trashedAt);
    if (rs.length) {
      const r = await cloudRpc('boards_restore', { p_boards: rs.map(b => b.cloudBoardId) });
      if (!r.error) cloudMarkDone(rs, 'cloudRestorePending');
    }
    // досылаем только неподтверждённые (у следов до этой правки поля нет)
    const gone = [...new Set((db.deleted || []).filter(d => d.kind === 'cloud' && d.pending !== false).map(d => d.id))];
    if (gone.length) await cloudDeleteNow(gone);
    await cloudRpc('boards_purge_trash', {});
  };
  // движок досок зовёт это, когда список загружен из хранилища (вход к этому
  // моменту уже есть — boardsAppBoot запускается после него)
  window.onBoardsBooted = function () { window.cloudTrashReconcile(); };
})();
