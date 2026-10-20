/* «Проверка связи» (№94). Окно, которое за полминуты отвечает на вопрос
 * «почему у ученика не обновляется доска»: дело в его сети или у нас.
 *
 * Зачем: урок 19.10.2026 — у ученика висела плашка «Связь с базой сбоит»,
 * его курсор у учителя мигал, а в Яндекс Телемосте в это же время всё было
 * отлично. Телемост ходит на серверы Яндекса в России, а доска — на Supabase
 * за Cloudflare, и часть провайдеров режет соединения именно с Cloudflare
 * (пропускает первые ~16 КБ, дальше тишина без ошибки). «Интернет хороший»
 * и «доска не грузится» тогда верны одновременно, и спорить об этом
 * бесполезно — нужно измерить. Поэтому проверка сравнивает ОДИН И ТОТ ЖЕ
 * файл (jsPDF, ~360 КБ) с нашего сайта (GitHub, не Cloudflare) и с cdnjs
 * (Cloudflare), а потом — сами серверы доски.
 *
 * Каждое скачивание читается по кускам и считается в байтах: оборвалось
 * на 10–40 КБ при живом сайте — это почерк ограничения, а не медленной сети.
 * Ответ базы 500 (statement timeout) — отдельно: это уже наша сторона.
 *
 * Сама проверка ничего не пишет ни в базу, ни в хранилище. Живая связь —
 * отдельным клиентом и своим каналом `netcheck:<случайное>`, сообщения
 * только самому себе: рабочий канал доски не трогается.
 *
 * Снаружи: window.MathhNetCheck.open() — открыть окно и запустить,
 * .run() — только измерить (для тестов), .last — последний итог.
 */
(function () {
  'use strict';
  if (window.MathhNetCheck) return;

  // меняются только в тестах (MathhNetCheck.opts)
  const opts = {
    idleMs: 8000,              // столько без единого байта — «оборвалось»
    totalMs: 30000,            // и не дольше этого на одно скачивание
    liveMs: 15000,             // живой связи на подключение и эхо
    cdnUrl: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    siteFile: 'jspdf.umd.min.js',   // тот же файл, лежит рядом с досками
  };
  const WS_MSGS = 20, WS_BYTES = 8000;      // 20 × 8 КБ — заведомо больше 16 КБ

  const cfg = () => window.SUPABASE_CONFIG || {};
  const nc = () => 'nc=' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const withNc = (u) => u + (u.indexOf('?') >= 0 ? '&' : '?') + nc();
  const kb = (n) => n < 1024 ? n + ' Б' : (n / 1024).toFixed(n < 10240 ? 1 : 0).replace('.', ',') + ' КБ';
  const sec = (ms) => (ms / 1000).toFixed(1).replace('.', ',') + ' с';

  /* Скачать и посчитать байты. Итог: { ok, status, bytes, ms, stalled,
     error, text? }. stalled — данные шли и встали (или не начались) */
  async function measure(url, init, wantText) {
    const t0 = performance.now();
    const ctl = new AbortController();
    let why = '';
    let idle = setTimeout(() => { why = 'idle'; ctl.abort(); }, opts.idleMs);
    const total = setTimeout(() => { why = 'total'; ctl.abort(); }, opts.totalMs);
    const poke = () => { clearTimeout(idle); idle = setTimeout(() => { why = 'idle'; ctl.abort(); }, opts.idleMs); };
    let bytes = 0, status = 0;
    const parts = [];
    try {
      const res = await fetch(url, Object.assign({ cache: 'no-store', signal: ctl.signal }, init || {}));
      status = res.status;
      poke();
      if (res.body && res.body.getReader) {
        const reader = res.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          bytes += value.length;
          if (wantText) parts.push(value);
          poke();
        }
      } else {
        const buf = await res.arrayBuffer();
        bytes = buf.byteLength;
      }
      let text;
      if (wantText) text = await new Blob(parts).text();
      return { ok: res.ok, status, bytes, ms: performance.now() - t0, stalled: false, text };
    } catch (e) {
      return { ok: false, status, bytes, ms: performance.now() - t0,
               stalled: why === 'idle' || why === 'total', slow: why === 'total',
               error: why ? '' : String(e && e.message || e) };
    } finally {
      clearTimeout(idle); clearTimeout(total);
    }
  }

  // «оборвалось на N КБ» — тот самый почерк: немного данных и тишина
  const cutLike = (r) => r && r.stalled && !r.slow && r.bytes > 0 && r.bytes < 64 * 1024;

  function describe(r, what) {
    if (!r) return '';
    if (r.ok) return kb(r.bytes) + ' за ' + sec(r.ms);
    if (r.stalled && r.slow) return 'идёт слишком медленно: ' + kb(r.bytes) + ' за ' + sec(r.ms);
    if (r.stalled && r.bytes) return 'оборвалось на ' + kb(r.bytes) + ' — дальше тишина';
    if (r.stalled) return 'нет ответа ' + sec(r.ms);
    if (r.status) return 'ответ сервера ' + r.status + (what ? ' ' + what : '');
    return 'не открылось' + (r.error ? ' (' + r.error + ')' : '');
  }

  async function authHeaders() {
    const h = { apikey: cfg().anonKey };
    try {
      const s = window.SB && (await window.SB.auth.getSession()).data.session;
      h.Authorization = 'Bearer ' + (s ? s.access_token : cfg().anonKey);
    } catch (e) { h.Authorization = 'Bearer ' + cfg().anonKey; }
    return h;
  }

  function currentCloudBoard() {
    try {
      const b = window.getCurrentBoard && window.getCurrentBoard();
      return b && b.cloudBoardId ? b : null;
    } catch (e) { return null; }
  }
  function firstImageKey(board) {
    const objs = (board && board.objects) || [];
    for (const o of objs) {
      if (o && typeof o.src === 'string' && o.src.startsWith('img:')) return o.src.slice(4);
    }
    return null;
  }

  /* Живая связь: отдельный клиент, свой канал, 20 сообщений по 8 КБ самому
     себе. Итог: { ok, joinMs, got, ms, error } */
  function liveTest() {
    return new Promise((resolve) => {
      const t0 = performance.now();
      let client, ch, done = false, got = 0, joinMs = 0, sentAt = 0;
      const finish = (r) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        try { if (client && ch) client.removeChannel(ch); } catch (e) {}
        try { if (client && client.realtime) client.realtime.disconnect(); } catch (e) {}
        resolve(Object.assign({ joinMs, got, ms: performance.now() - t0 }, r));
      };
      const timer = setTimeout(() => finish({ ok: false, error: joinMs ? 'echo' : 'join' }), opts.liveMs);
      try {
        if (!window.supabase || !window.supabase.createClient) { finish({ ok: false, error: 'lib' }); return; }
        client = window.supabase.createClient(cfg().url, cfg().anonKey,
          { auth: { persistSession: false, autoRefreshToken: false, storageKey: 'mathh-netcheck' } });
        ch = client.channel('netcheck:' + nc(), { config: { broadcast: { self: true } } });
        const pad = 'x'.repeat(WS_BYTES);
        ch.on('broadcast', { event: 'probe' }, () => {
          got++;
          if (got >= WS_MSGS) finish({ ok: true, echoMs: performance.now() - sentAt });
        });
        ch.subscribe((status) => {
          if (status === 'SUBSCRIBED' && !joinMs) {
            joinMs = performance.now() - t0;
            sentAt = performance.now();
            for (let i = 0; i < WS_MSGS; i++) {
              try { ch.send({ type: 'broadcast', event: 'probe', payload: { i, pad } }); } catch (e) {}
            }
          } else if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && !joinMs) {
            finish({ ok: false, error: 'join' });
          }
        });
      } catch (e) {
        finish({ ok: false, error: String(e && e.message || e) });
      }
    });
  }

  /* Все проверки по очереди; onStep(id, состояние) — для окна */
  async function run(onStep) {
    const step = onStep || function () {};
    const R = { at: new Date().toISOString(), ua: navigator.userAgent };
    const base = cfg().url || '';

    step('site', 'run');
    R.site = await measure(withNc(new URL(opts.siteFile, location.href).href));
    step('site', R.site.ok ? 'ok' : 'bad', describe(R.site));

    step('cdn', 'run');
    R.cdn = await measure(opts.cdnUrl);
    step('cdn', R.cdn.ok ? 'ok' : 'bad', describe(R.cdn));

    step('api', 'run');
    R.api = base ? await measure(withNc(base + '/auth/v1/settings'), { headers: { apikey: cfg().anonKey } }) : null;
    step('api', R.api && R.api.ok ? 'ok' : 'bad', R.api ? (R.api.ok ? 'отвечает за ' + sec(R.api.ms) : describe(R.api)) : 'не настроен');

    const board = currentCloudBoard();
    step('data', 'run');
    if (board && base) {
      const q = '/rest/v1/board_objects?select=obj_id,data&board_id=eq.' + encodeURIComponent(board.cloudBoardId)
        + '&order=obj_id.asc&limit=300';
      R.data = await measure(base + q, { headers: await authHeaders() }, true);
      R.data.dbTimeout = !R.data.ok && R.data.status >= 500 && /57014|statement timeout/.test(R.data.text || '');
      delete R.data.text;
      step('data', R.data.ok ? 'ok' : (R.data.dbTimeout ? 'warn' : 'bad'),
        R.data.dbTimeout ? 'база не успела ответить (на стороне сервера)' : describe(R.data));
    } else {
      R.data = null;
      step('data', 'skip', 'откройте общую доску — тогда проверю и её');
    }

    step('img', 'run');
    const key = board && firstImageKey(board);
    if (key && window.IMG_BASE_URL) {
      R.img = await measure(withNc(window.IMG_BASE_URL + key));
      step('img', R.img.ok ? 'ok' : 'bad', describe(R.img));
    } else {
      R.img = null;
      step('img', 'skip', board ? 'на этой доске нет картинок' : 'откройте общую доску — тогда проверю и картинки');
    }

    step('live', 'run');
    R.live = base ? await liveTest() : { ok: false, error: 'lib' };
    step('live', R.live.ok ? 'ok' : 'bad', R.live.ok
      ? 'подключилась за ' + sec(R.live.joinMs) + ', ' + kb(WS_MSGS * WS_BYTES) + ' туда и обратно'
      : (R.live.error === 'join' ? 'не подключилась за ' + sec(opts.liveMs)
        : R.live.error === 'echo' ? 'подключилась, но дошло ' + R.live.got + ' из ' + WS_MSGS + ' сообщений'
        : 'не запустилась'));

    R.verdict = verdict(R);
    api.last = R;
    return R;
  }

  /* Итог простыми словами: { kind: ok|warn|bad, title, text } */
  function verdict(R) {
    const sb = [R.api, R.data, R.img].filter(Boolean);
    const sbCut = sb.some(cutLike) || (R.live && R.live.error === 'echo');
    if (!R.site.ok && !R.cdn.ok && !(R.api && R.api.ok)) {
      return { kind: 'bad', title: 'Нет интернета', text: 'Не открывается ни наш сайт, ни остальные серверы. Проверьте подключение к сети.' };
    }
    if (R.site.ok && (cutLike(R.cdn) || (!R.cdn.ok && sbCut))) {
      return { kind: 'bad', title: 'Провайдер режет связь с сервером доски',
        text: 'Интернет работает (наш сайт скачался целиком), а с серверов Cloudflare, через которые работает доска, данные обрываются на первых килобайтах. '
          + 'Это ограничение со стороны провайдера, а не скорость сети: звонки и российские сайты при этом работают отлично. '
          + 'Помогает другая сеть — например, раздать интернет с телефона — или VPN.' };
    }
    if (R.site.ok && R.cdn.ok && sbCut) {
      return { kind: 'bad', title: 'Связь с сервером доски обрывается',
        text: 'Обычные сайты и Cloudflare открываются, а данные с сервера доски обрываются. Попробуйте другую сеть (например, интернет с телефона) и сообщите учителю.' };
    }
    if (R.api && !R.api.ok && R.cdn.ok) {
      return { kind: 'bad', title: 'Сервер доски не отвечает',
        text: 'Интернет есть, но сервер доски недоступен. Возможно, сбой на самом сервере — сообщите учителю.' };
    }
    if (R.data && R.data.dbTimeout) {
      return { kind: 'warn', title: 'База доски отвечает медленно',
        text: 'Связь в порядке, но база не успела отдать доску. Это на стороне сервера — перешлите учителю результат проверки.' };
    }
    if (R.live && !R.live.ok) {
      return { kind: 'warn', title: 'Живая связь не поднимается',
        text: 'Доска скачивается, но живая связь (курсоры, новое от собеседника сразу) не подключается. Её может блокировать сеть, антивирус или расширение браузера. Попробуйте другую сеть или другой браузер.' };
    }
    const bad = [R.site, R.cdn, R.data, R.img].filter(r => r && !r.ok);
    if (bad.length) {
      return { kind: 'warn', title: 'Часть проверок не прошла',
        text: 'Посмотрите строки с красной точкой. Если доска не обновляется — скопируйте результат и пришлите учителю.' };
    }
    return { kind: 'ok', title: 'Связь с серверами доски в порядке',
      text: 'Всё скачивается целиком, живая связь работает. Если доска всё равно не обновляется — обновите страницу и сообщите учителю.' };
  }

  const STEPS = [
    ['site', 'Интернет и наш сайт'],
    ['cdn', 'Серверы Cloudflare'],
    ['api', 'Сервер доски'],
    ['data', 'Загрузка доски'],
    ['img', 'Картинки доски'],
    ['live', 'Живая связь'],
  ];

  function reportText(R, rows) {
    const lines = ['Проверка связи Mathh — ' + new Date(R.at).toLocaleString('ru-RU'), R.verdict.title, ''];
    STEPS.forEach(([id, name]) => lines.push(name + ': ' + (rows[id] || '—')));
    lines.push('', 'Браузер: ' + R.ua);
    return lines.join('\n');
  }

  // ── окно ──────────────────────────────────────────────────────────────
  let modal = null, busy = false;
  function css() {
    const st = document.createElement('style');
    st.textContent = `
      #mnCheck{position:fixed;inset:0;z-index:5200;display:none;align-items:center;justify-content:center;
        background:rgba(0,0,0,.28);padding:16px;}
      #mnCheck.open{display:flex;}
      #mnCheck .mn-card{position:relative;width:460px;max-width:100%;max-height:calc(100vh - 32px);overflow:auto;
        box-sizing:border-box;padding:22px 22px 18px;border-radius:20px;background:var(--glass-strong,#fff);
        border:1px solid var(--glass-border,#ddd);color:var(--pencil,#222);font-size:14px;line-height:1.45;
        font-family:var(--font-ui, system-ui, -apple-system, 'Segoe UI', sans-serif);
        backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);
        box-shadow:inset 0 1px 0 var(--glass-inset,#fff), var(--shadow,0 10px 30px rgba(0,0,0,.2));}
      #mnCheck h3{margin:0 0 4px;font-size:17px;}
      #mnCheck .mn-sub{color:var(--muted-2,#777);font-size:12.5px;margin-bottom:12px;}
      #mnCheck .mn-row{display:flex;gap:10px;align-items:flex-start;padding:7px 0;border-top:1px solid var(--glass-border,#eee);}
      #mnCheck .mn-dot{flex:none;width:10px;height:10px;border-radius:50%;margin-top:5px;background:#c8c8cc;}
      #mnCheck .mn-row[data-s=run] .mn-dot{background:#3b82f6;animation:mnPulse 1s ease-in-out infinite;}
      #mnCheck .mn-row[data-s=ok] .mn-dot{background:#2f9e44;}
      #mnCheck .mn-row[data-s=warn] .mn-dot{background:#e0a800;}
      #mnCheck .mn-row[data-s=bad] .mn-dot{background:#e03131;}
      #mnCheck .mn-row[data-s=skip] .mn-dot{background:transparent;border:1.5px solid #c8c8cc;box-sizing:border-box;}
      @keyframes mnPulse{50%{opacity:.35;}}
      #mnCheck .mn-name{font-weight:600;}
      #mnCheck .mn-det{color:var(--muted-2,#777);font-size:12.5px;}
      #mnCheck .mn-verdict{margin-top:12px;padding:10px 12px;border-radius:12px;display:none;}
      #mnCheck .mn-verdict.open{display:block;}
      #mnCheck .mn-verdict.ok{background:rgba(47,158,68,.12);}
      #mnCheck .mn-verdict.warn{background:#fff4d6;color:#5a4300;}
      #mnCheck .mn-verdict.bad{background:rgba(224,49,49,.12);}
      #mnCheck .mn-verdict b{display:block;margin-bottom:2px;}
      #mnCheck .mn-acts{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;}
      #mnCheck .mn-acts button{flex:1;min-width:120px;font:inherit;font-size:13.5px;font-weight:600;padding:9px 10px;border-radius:11px;
        border:1px solid var(--glass-border,#ddd);background:var(--glass,#f4f4f6);color:var(--pencil,#222);cursor:pointer;}
      #mnCheck .mn-acts .mn-primary{background:var(--ink,#3b5bdb);border-color:transparent;color:#fff;}
      #mnCheck .mn-acts button:disabled{opacity:.55;cursor:default;}
      #mnCheck .mn-close{position:absolute;top:10px;right:12px;border:0;background:none;font-size:22px;line-height:1;
        color:var(--muted-2,#777);cursor:pointer;padding:4px;}
    `;
    document.head.appendChild(st);
  }
  function build() {
    if (modal) return modal;
    css();
    modal = document.createElement('div');
    modal.id = 'mnCheck';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-label', 'Проверка связи');
    modal.innerHTML = '<div class="mn-card"><button type="button" class="mn-close" aria-label="Закрыть">×</button>'
      + '<h3>Проверка связи</h3><div class="mn-sub">Около полуминуты. Проверяет связь именно с серверами доски — '
      + 'она может не работать, даже когда звонки и сайты открываются отлично.</div>'
      + STEPS.map(([id, name]) => `<div class="mn-row" data-id="${id}" data-s="wait"><span class="mn-dot"></span>`
        + `<div><div class="mn-name">${name}</div><div class="mn-det"></div></div></div>`).join('')
      + '<div class="mn-verdict"></div>'
      + '<div class="mn-acts"><button type="button" class="mn-again mn-primary">Проверить ещё раз</button>'
      + '<button type="button" class="mn-copy">Скопировать результат</button></div></div>';
    document.body.appendChild(modal);
    modal.querySelector('.mn-close').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal && !busy) close(); });
    modal.querySelector('.mn-again').addEventListener('click', start);
    modal.querySelector('.mn-copy').addEventListener('click', copy);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });
    return modal;
  }
  let rows = {};
  function setRow(id, s, det) {
    const r = modal.querySelector(`.mn-row[data-id="${id}"]`);
    if (!r) return;
    r.dataset.s = s;
    r.querySelector('.mn-det').textContent = det || (s === 'run' ? 'проверяю…' : '');
    if (s !== 'run') rows[id] = det || s;
  }
  async function start() {
    if (busy) return;
    busy = true; rows = {};
    const again = modal.querySelector('.mn-again'), cp = modal.querySelector('.mn-copy');
    again.disabled = true; cp.disabled = true;
    STEPS.forEach(([id]) => setRow(id, 'wait', ''));
    const v = modal.querySelector('.mn-verdict');
    v.className = 'mn-verdict';
    try {
      const R = await run(setRow);
      v.className = 'mn-verdict open ' + R.verdict.kind;
      v.innerHTML = '';
      const b = document.createElement('b'); b.textContent = R.verdict.title;
      v.appendChild(b); v.appendChild(document.createTextNode(R.verdict.text));
    } finally {
      busy = false; again.disabled = false; cp.disabled = false;
    }
  }
  async function copy() {
    if (!api.last) return;
    const text = reportText(api.last, rows);
    const btn = modal.querySelector('.mn-copy');
    try { await navigator.clipboard.writeText(text); btn.textContent = 'Скопировано'; }
    catch (e) {
      // буфер обмена недоступен (старый браузер, нет разрешения) — отдаём текстом
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); btn.textContent = 'Скопировано'; } catch (e2) {}
      ta.remove();
    }
    setTimeout(() => { btn.textContent = 'Скопировать результат'; }, 1800);
  }
  function open() {
    build().classList.add('open');
    if (!busy) start();
  }
  function close() { if (modal) modal.classList.remove('open'); }

  const api = { open, close, run, verdict, opts, last: null, reportText: () => api.last && reportText(api.last, rows) };
  window.MathhNetCheck = api;

  // пункт в меню «⋯» досок; ученику на просмотре доски учителя (?s=) меню
  // нет — там проверка открывается из плашки о связи
  if (window.MathhMenu && !/[?&]s=[^&#]/.test(location.search)) {
    try { window.MathhMenu.mount().add({ id: 'mnCheckBtn', icon: 'signal', label: 'Проверка связи', onClick: open }); } catch (e) {}
  }
})();
