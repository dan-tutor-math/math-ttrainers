// Настройки подключения к Supabase — заполняются один раз после создания
// проекта на supabase.com (Project Settings → API).
//
// Сюда идут ТОЛЬКО открытые (публичные) значения — Project URL и anon
// public key. Они и так видны в браузере любого пользователя приложения,
// это нормально и предусмотрено самим Supabase. А вот значение
// "service_role" (secret) сюда класть НЕЛЬЗЯ НИКОГДА — это ключ полного
// доступа в обход всех прав, ему тут не место.
window.SUPABASE_CONFIG = {
  url: 'https://nctwdjyxlwnsbdkmisje.supabase.co',
  anonKey: 'sb_publishable_S0ruXCX_UXlIkPAboUlAPg_SYP72WVi'
};
// Где лежат файлы картинок досок (промпт №89б). В досках хранится только
// ключ «img:<путь>», адрес подставляется при показе — при переезде на другой
// сервер меняется только эта строка
window.IMG_BASE_URL = window.SUPABASE_CONFIG.url + '/storage/v1/object/public/board-images/';

/* Предохранитель realtime (промпт №88г). Когда вебсокет к Supabase не
   поднимается (у учителя 15.10.2026: «WebSocket … failed» и «falling back
   to REST» в каждой консоли), библиотека ничего не выбрасывает: каждое
   исходящее сообщение копится в её очередях (sendBuffer сокета, pushBuffer
   канала) до появления связи, а широковещательные — уходят отдельным
   HTTP-запросом каждое (курсор, пульс, вид доски). Страница при этом росла
   до гигабайтов и падала, а падение портило хранилище досок.
   Поэтому: 1) пока канал не подключён, широковещательные сообщения не
   шлём вовсе — без связи их некому получить, а после подключения код сам
   пересылает актуальное состояние (sync_request, pushFull, sendFull);
   2) очереди библиотеки, пока связи нет, держим короткими — старое там всё
   равно устарело. Ставится на каждого клиента: rtGuard(createClient(...)) */
window.rtGuard = function (client) {
  if (!client || client.__rtGuard) return client;
  client.__rtGuard = true;
  const KEEP = 20;
  const trim = (q) => { if (Array.isArray(q) && q.length > KEEP) q.splice(0, q.length - KEEP); };
  const origChannel = client.channel.bind(client);
  client.channel = function () {
    const ch = origChannel.apply(null, arguments);
    const send = ch.send.bind(ch);
    ch.send = function (msg, opts) {
      if (msg && msg.type === 'broadcast' && typeof ch.state === 'string' && ch.state !== 'joined') return Promise.resolve('skipped');
      return send(msg, opts);
    };
    return ch;
  };
  setInterval(() => {
    try {
      const rt = client.realtime;
      if (!rt) return;
      const sock = (rt.socketAdapter && rt.socketAdapter.socket) || rt;
      const up = typeof rt.isConnected === 'function' ? rt.isConnected() : true;
      if (!up) trim(sock.sendBuffer);
      (typeof rt.getChannels === 'function' ? rt.getChannels() : rt.channels || []).forEach((ch) => {
        if (ch.state === 'joined') return;
        [ch, ch.channelAdapter && ch.channelAdapter.channel, ch.channel].forEach(x => { if (x) trim(x.pushBuffer); });
      });
    } catch (e) {}
  }, 2000);
  return client;
};

/* Сторож запросов к базе (№93 «связь с доской»). Урок 19.10.2026: у ученика
   жёлтая плашка «Связь с базой сбоит — догружаю доску» висела до конца урока,
   новое на доске больше не появлялось, картинка задания — «Загрузка…», его
   курсор у учителя то появлялся, то пропадал. Supabase стоит за Cloudflare
   (в ответе сервера `server: cloudflare`), а часть российских провайдеров с
   9 июня 2025 года пропускает к Cloudflare только первые ~16 КБ соединения:
   дальше данные не идут, а ошибки нет — запрос висит бесконечно.
   Один такой запрос держал навсегда загрузку доски (а пока она не кончилась,
   сверка раз в полминуты не запускается) или очередь записей
   (cloudWriteChain, следующие правки ждут предыдущую).
   Встроенный таймаут библиотеки (`db.timeout`) не спасает: он снимается,
   как только пришли заголовки ответа, а виснет обычно тело — заголовки
   в первые 16 КБ влезают. Поэтому здесь: запрос обрывается, если
   `idleMs` не пришло ни байта — ни заголовков, ни очередного куска тела.
   Медленный, но живой ответ не обрывается. Обрыв — обычная ошибка
   (AbortError): загрузка уходит на повтор, запись — в недописанное,
   которое повторит сверка; вход (`/auth/`) считает её сетевой и сессию не
   теряет. Хранилище картинок (`/storage/`) не трогаем: выгрузка картинки
   по медленному каналу может честно идти дольше.
   `stalls` — когда обрывали: по ним доска подсказывает сменить сеть */
window.sbGuardedFetch = (function () {
  const GUARDED = /\/(rest|auth|functions)\/v1\//;
  const NO_BODY = [101, 204, 205, 304];
  function guarded(input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || String(input);
    if (!GUARDED.test(url) || typeof AbortController !== 'function') return fetch(input, init);
    const ctl = new AbortController();
    const outer = init && init.signal;
    const onOuter = () => ctl.abort();
    if (outer) { if (outer.aborted) ctl.abort(); else outer.addEventListener('abort', onOuter, { once: true }); }
    let timer = null, stalled = false;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { stalled = true; ctl.abort(); }, guarded.idleMs);
    };
    const finish = () => { clearTimeout(timer); if (outer) outer.removeEventListener('abort', onOuter); };
    arm();
    return fetch(input, Object.assign({}, init, { signal: ctl.signal })).then(async (res) => {
      if (!res.body || NO_BODY.indexOf(res.status) >= 0) { finish(); return res; }
      // тело читаем здесь же, под тем же сторожем: каждый кусок — заново
      // отсчёт; иначе зависание тела досталось бы res.json() библиотеки
      arm();
      const reader = res.body.getReader();
      const parts = [];
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        parts.push(value);
        arm();
      }
      finish();
      return new Response(new Blob(parts), { status: res.status, statusText: res.statusText, headers: res.headers });
    }).catch((e) => {
      finish();
      if (stalled) {
        const now = Date.now();
        guarded.stalls.push(now);
        while (guarded.stalls.length && now - guarded.stalls[0] > 10 * 60 * 1000) guarded.stalls.shift();
        console.warn('[связь] запрос к базе оборван: ' + guarded.idleMs / 1000 + ' с без ответа', url.split('?')[0]);
      }
      throw e;
    });
  }
  guarded.idleMs = 20000;
  guarded.stalls = [];
  return guarded;
})();
