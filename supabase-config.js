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
