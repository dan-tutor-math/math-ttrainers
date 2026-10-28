/* ═══════════════════════════════════════════════════════════════════════
   Видео на платформе, этап 1: свой плеер HLS поверх тренажёра.

   Почему свой, а не <video controls>: нужны главы на полосе прокрутки,
   выбор качества, одинаковый вид и клавиши на всех устройствах. Почему HLS,
   а не mp4: три качества — на телефоне с плохой связью видео не встаёт, а
   спускается до 360p; перемотка грузит только нужный сегмент, а не файл.

   Правила:
   - окно поверх страницы, страница под ним не трогается вовсе: задание,
     введённый ответ, теория, снимок сессии — всё остаётся как было, закрыли
     окно — продолжили задание с того же места;
   - hls.js грузится с cdnjs только при первом открытии и только там, где он
     нужен: Safari (Mac, iPhone, iPad) играет HLS сам, и родной плеер там
     лучше — экономит батарею и работает на iPhone без MSE;
   - место остановки помнится на устройстве (localStorage «videoPos:<slug>»),
     скорость — тоже («videoRate»). Любое чтение и запись — в try/catch:
     в приватном окне Safari localStorage бросает исключение, и плеер не
     должен из-за этого падать;
   - пока окно открыто, пробел, стрелки и Esc принадлежат плееру: ловим их
     в фазе захвата, иначе пробел нажал бы кнопку тренажёра под окном, а
     стрелки листали бы задания.

   Подключение (видео ищется в window.VIDEO_LINKS из video-links.js):
     <script src="video-links.js"></script>
     <script src="video-player.js"></script>
     const v = VideoPlayer.findFor({ page: 'oge1_5', block: 'tire', task: curMode });
     VideoPlayer.syncButton(кнопка, v);   // покажет «Смотреть разбор» или спрячет
     VideoPlayer.open(v) / VideoPlayer.close() / VideoPlayer.isOpen()
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  if (window.VideoPlayer) return;

  // Версия закреплена вместе с хешем: cdnjs отдаёт ровно этот файл, а
  // подменённый браузер не выполнит (integrity). Обновлять — обе строки сразу.
  const HLS_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.20/hls.min.js';
  const HLS_SRI = 'sha512-yQzohCknrQkYGB82MKUj2tk/XxXIH8jthzZpy89adgms47b9ydFW6UK2f3eEXIZm0pe3lbhrWfxZOHuIGHSJ0w==';
  const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];
  const SEEK_STEP = 10;
  const POS_PREFIX = 'videoPos:';
  const RATE_KEY = 'videoRate';
  const KIND_LABEL = { razbor: 'Смотреть разбор', guide: 'Смотреть гайд' };

  const CSS = `
    .video-open-btn{display:inline-flex;align-items:center;gap:8px;font-family:var(--font-ui);font-weight:700;
      font-size:15px;line-height:1.2;color:var(--ink);background:var(--card);border:1.5px solid var(--ink);
      border-radius:999px;padding:9px 16px;cursor:pointer;-webkit-tap-highlight-color:transparent;}
    .video-open-btn:hover{background:var(--ink);color:var(--card);}
    .video-open-btn:focus-visible{outline:2px solid var(--ink);outline-offset:2px;}
    .video-open-btn svg{width:14px;height:14px;flex:0 0 14px;}

    .vp-overlay{position:fixed;inset:0;z-index:100000;background:rgba(8,10,14,.78);display:flex;
      align-items:center;justify-content:center;padding:16px;box-sizing:border-box;
      font-family:var(--font-ui, -apple-system, system-ui, sans-serif);color:#f4f5f7;
      -webkit-tap-highlight-color:transparent;}
    .vp-box{position:relative;width:min(1040px,100%);max-height:100%;display:flex;flex-direction:column;
      background:#0f1115;border-radius:16px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.5);}
    .vp-head{display:flex;align-items:center;gap:12px;padding:10px 10px 10px 18px;}
    .vp-title{flex:1 1 auto;min-width:0;font-weight:700;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .vp-btn{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;gap:4px;min-width:40px;height:40px;
      padding:0 8px;box-sizing:border-box;border:none;border-radius:10px;background:transparent;color:inherit;
      font:inherit;font-size:14px;font-weight:600;cursor:pointer;font-variant-numeric:tabular-nums;}
    .vp-btn:hover{background:rgba(255,255,255,.12);}
    .vp-btn:focus-visible{outline:2px solid #fff;outline-offset:-2px;}
    .vp-btn svg{width:22px;height:22px;fill:currentColor;}
    .vp-btn[hidden]{display:none;}
    .vp-stage{position:relative;background:#000;aspect-ratio:16/9;max-height:calc(100vh - 170px);flex:0 1 auto;}
    .vp-video{display:block;width:100%;height:100%;object-fit:contain;background:#000;}
    .vp-msg{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);max-width:80%;text-align:center;
      background:rgba(0,0,0,.72);padding:12px 16px;border-radius:12px;font-size:15px;line-height:1.4;pointer-events:none;}
    .vp-msg[hidden]{display:none;}
    .vp-resume{position:absolute;left:12px;bottom:12px;display:flex;align-items:center;gap:8px;
      background:rgba(0,0,0,.72);padding:6px 6px 6px 12px;border-radius:12px;font-size:14px;}
    .vp-resume[hidden]{display:none;}
    .vp-resume .vp-btn{height:32px;background:rgba(255,255,255,.14);}
    .vp-controls{padding:6px 10px 10px;}
    .vp-bar{position:relative;height:28px;cursor:pointer;touch-action:none;outline:none;}
    .vp-track{position:absolute;left:0;right:0;top:12px;height:4px;border-radius:2px;background:rgba(255,255,255,.22);}
    .vp-bar:hover .vp-track,.vp-bar:focus-visible .vp-track{top:11px;height:6px;}
    .vp-buf,.vp-played{position:absolute;left:0;top:0;bottom:0;border-radius:inherit;width:0;}
    .vp-buf{background:rgba(255,255,255,.35);}
    .vp-played{background:#fff;}
    /* метки глав — щели в полосе, как на YouTube: видны и поверх сыгранной части */
    .vp-tick{position:absolute;top:-1px;bottom:-1px;width:3px;margin-left:-1.5px;background:#0f1115;}
    .vp-thumb{position:absolute;top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:#fff;
      left:0;box-shadow:0 0 0 3px rgba(0,0,0,.25);}
    .vp-tip{position:absolute;bottom:30px;transform:translateX(-50%);white-space:nowrap;background:#fff;color:#111;
      font-size:13px;font-weight:600;padding:4px 8px;border-radius:8px;pointer-events:none;max-width:60vw;overflow:hidden;text-overflow:ellipsis;}
    .vp-tip[hidden]{display:none;}
    .vp-row{display:flex;align-items:center;gap:2px;flex-wrap:wrap;}
    .vp-time{font-size:14px;font-variant-numeric:tabular-nums;padding:0 8px;white-space:nowrap;opacity:.9;}
    .vp-chapter{flex:1 1 120px;min-width:0;font-size:14px;opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .vp-break{display:none;}
    .vp-menu-wrap{position:relative;}
    .vp-menu{position:absolute;right:0;bottom:46px;min-width:130px;background:#1c1f26;border-radius:12px;padding:6px;
      box-shadow:0 12px 32px rgba(0,0,0,.5);z-index:2;}
    .vp-menu[hidden]{display:none;}
    .vp-menu button{display:block;width:100%;text-align:left;border:none;background:none;color:inherit;font:inherit;
      font-size:14px;padding:9px 12px;border-radius:8px;cursor:pointer;}
    .vp-menu button:hover,.vp-menu button:focus-visible{background:rgba(255,255,255,.12);outline:none;}
    .vp-menu button[aria-checked="true"]{font-weight:700;}
    .vp-menu button[aria-checked="true"]::before{content:'✓ ';}
    .vp-box:fullscreen,.vp-box:-webkit-full-screen{width:100%;height:100%;max-height:none;border-radius:0;}
    .vp-box:fullscreen .vp-stage,.vp-box:-webkit-full-screen .vp-stage{flex:1 1 auto;max-height:none;aspect-ratio:auto;}
    /* телефон: окно во всю ширину, кнопки крупнее для пальца, время и глава —
       отдельной строкой, чтобы кнопки управления не уезжали за край */
    @media (max-width:600px){
      .vp-overlay{padding:0;align-items:flex-start;}
      .vp-box{border-radius:0;width:100%;}
      .vp-stage{max-height:calc(100vh - 190px);}
      .vp-head{padding:6px 6px 6px 16px;}
      .vp-btn{min-width:44px;height:44px;}
      .vp-controls{padding:4px 6px calc(10px + env(safe-area-inset-bottom));}
      .vp-time{order:-3;flex:0 0 auto;padding-left:6px;}
      .vp-chapter{order:-2;flex:1 1 0;}
      .vp-break{display:block;order:-1;flex:0 0 100%;height:2px;}
      .vp-spacer{flex:1 1 0 !important;}
    }
    html.vp-lock,html.vp-lock body{overflow:hidden;}
  `;

  const ICON = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
    // перемотка — текстом: цифра «10» внутри значка-стрелки на 22 px не читается
    back: '−10 с',
    fwd: '+10 с',
    full: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5v2H6v3zm11-5h5v5h-2V6h-3zM6 15v3h3v2H4v-5zm12 0h2v5h-5v-2h3z"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z"/></svg>',
    btnPlay: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>',
  };

  // ── память на устройстве ─────────────────────────────────────────────
  function lsGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function lsSet(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
  function lsDel(key) { try { localStorage.removeItem(key); } catch (e) {} }
  function readPos(slug) {
    try { const p = JSON.parse(lsGet(POS_PREFIX + slug) || 'null'); return p && isFinite(p.t) ? p.t : 0; }
    catch (e) { return 0; }
  }
  function writePos(slug, t) { lsSet(POS_PREFIX + slug, JSON.stringify({ t: Math.floor(t), at: Date.now() })); }
  function readRate() {
    const r = parseFloat(lsGet(RATE_KEY));
    return RATES.indexOf(r) >= 0 ? r : 1;
  }

  function fmtTime(s) {
    s = Math.max(0, Math.floor(s || 0));
    const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sec = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(sec).padStart(2, '0');
  }
  function fmtRate(r) { return String(r).replace('.', ',') + '×'; }

  // ── поиск видео по привязке ──────────────────────────────────────────
  function findFor(q) {
    const db = window.VIDEO_LINKS;
    if (!db || !q || !q.page) return null;
    const links = (db.links || []).filter(l => l.page === q.page && l.block_key === q.block);
    // привязка к конкретному заданию важнее привязки ко всему блоку
    const link = (q.task && links.find(l => l.task_key === q.task)) || links.find(l => !l.task_key);
    if (!link) return null;
    const v = (db.videos || []).find(x => x.slug === link.video_slug);
    // запись без ссылки — видео заведено, но ещё не загружено: кнопки нет
    return v && v.hls_url ? v : null;
  }

  function syncButton(btn, video) {
    if (!btn) return;
    if (!video) { btn.style.display = 'none'; btn._video = null; return; }
    btn._video = video;
    btn.innerHTML = ICON.btnPlay + '<span></span>';
    btn.querySelector('span').textContent = KIND_LABEL[video.kind] || KIND_LABEL.razbor;
    btn.style.display = '';
    if (!btn._vpBound) {
      btn._vpBound = true;
      btn.addEventListener('click', () => { if (btn._video) open(btn._video); });
    }
  }

  // ── загрузка hls.js ──────────────────────────────────────────────────
  let hlsPromise = null;
  function loadHls() {
    if (window.Hls) return Promise.resolve(window.Hls);
    if (hlsPromise) return hlsPromise;
    hlsPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = HLS_SRC;
      s.integrity = HLS_SRI;
      s.crossOrigin = 'anonymous';
      s.referrerPolicy = 'no-referrer';
      s.onload = () => window.Hls ? resolve(window.Hls) : reject(new Error('hls.js'));
      // не кэшируем неудачу: следующее открытие попробует ещё раз (сеть могла вернуться)
      s.onerror = () => { hlsPromise = null; s.remove(); reject(new Error('hls.js')); };
      document.head.appendChild(s);
    });
    return hlsPromise;
  }

  // Родной HLS берём только у Apple. Chrome и Android тоже иногда отвечают
  // canPlayType «maybe», но без выбора качества и с худшей перемоткой —
  // там hls.js. На iPhone до iOS 17.1 MSE нет вовсе, и родной — единственный.
  function preferNative(video) {
    if (!video.canPlayType('application/vnd.apple.mpegurl')) return false;
    const ua = navigator.userAgent;
    const apple = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ||
      (/Safari\//.test(ua) && !/Chrome|Chromium|CriOS|Edg|Android|Firefox|FxiOS/.test(ua));
    return apple || !(window.MediaSource || window.ManagedMediaSource);
  }

  // ── окно ─────────────────────────────────────────────────────────────
  let ui = null;          // элементы открытого окна
  let cur = null;         // открытое видео
  let hls = null;
  let lastFocus = null;
  let saveTimer = 0, hideTimer = 0;

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function iconBtn(cls, icon, label) {
    const b = el('button', 'vp-btn ' + cls, icon);
    b.type = 'button';
    b.title = label;
    b.setAttribute('aria-label', label);
    return b;
  }

  function build(video) {
    if (!document.getElementById('videoPlayerStyle')) {
      const st = document.createElement('style');
      st.id = 'videoPlayerStyle';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    const o = el('div', 'vp-overlay');
    o.id = 'videoPlayer';
    o.setAttribute('role', 'dialog');
    o.setAttribute('aria-modal', 'true');
    o.setAttribute('aria-label', video.title || 'Видео');
    const box = el('div', 'vp-box');
    const head = el('div', 'vp-head');
    const title = el('div', 'vp-title');
    title.textContent = video.title || '';
    const closeB = iconBtn('vp-close', ICON.close, 'Закрыть (Esc)');
    head.append(title, closeB);

    const stage = el('div', 'vp-stage');
    const v = el('video', 'vp-video');
    // playsinline — иначе iPhone сразу уводит видео в свой полноэкранный плеер
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.preload = 'metadata';
    v.crossOrigin = 'anonymous';
    if (video.poster_url) v.poster = video.poster_url;
    const msg = el('div', 'vp-msg');
    msg.hidden = true;
    const resume = el('div', 'vp-resume');
    resume.hidden = true;
    const resumeText = el('span');
    const fromStart = el('button', 'vp-btn vp-from-start', 'С начала');
    fromStart.type = 'button';
    resume.append(resumeText, fromStart);
    stage.append(v, msg, resume);

    const ctr = el('div', 'vp-controls');
    const bar = el('div', 'vp-bar');
    bar.tabIndex = 0;
    bar.setAttribute('role', 'slider');
    bar.setAttribute('aria-label', 'Перемотка');
    const track = el('div', 'vp-track');
    const buf = el('div', 'vp-buf'), played = el('div', 'vp-played');
    track.append(buf, played);
    const thumb = el('div', 'vp-thumb');
    const tip = el('div', 'vp-tip');
    tip.hidden = true;
    bar.append(track, thumb, tip);

    const row = el('div', 'vp-row');
    const playB = iconBtn('vp-play', ICON.play, 'Смотреть (пробел)');
    const backB = iconBtn('vp-back', ICON.back, 'Назад на 10 с (←)');
    const fwdB = iconBtn('vp-fwd', ICON.fwd, 'Вперёд на 10 с (→)');
    const time = el('div', 'vp-time', '0:00 / 0:00');
    const chapter = el('div', 'vp-chapter');
    const spacer = el('div', 'vp-spacer');
    spacer.style.flex = '0 0 0';

    const rateWrap = el('div', 'vp-menu-wrap');
    const rateB = el('button', 'vp-btn vp-rate', fmtRate(1));
    rateB.type = 'button';
    rateB.title = 'Скорость';
    rateB.setAttribute('aria-haspopup', 'menu');
    const rateMenu = el('div', 'vp-menu');
    rateMenu.setAttribute('role', 'menu');
    rateMenu.hidden = true;
    rateWrap.append(rateB, rateMenu);

    const qWrap = el('div', 'vp-menu-wrap');
    const qB = el('button', 'vp-btn vp-quality', 'Авто');
    qB.type = 'button';
    qB.title = 'Качество';
    qB.setAttribute('aria-haspopup', 'menu');
    const qMenu = el('div', 'vp-menu');
    qMenu.setAttribute('role', 'menu');
    qMenu.hidden = true;
    qWrap.append(qB, qMenu);

    const fullB = iconBtn('vp-full', ICON.full, 'Во весь экран');
    // vp-break на телефоне переносит кнопки на свою строку под временем
    row.append(playB, backB, fwdB, time, chapter, el('div', 'vp-break'), spacer, rateWrap, qWrap, fullB);
    ctr.append(bar, row);
    box.append(head, stage, ctr);
    o.append(box);

    return { o, box, closeB, stage, v, msg, resume, resumeText, fromStart, bar, buf, played, thumb, tip,
      playB, backB, fwdB, time, chapter, rateB, rateMenu, qWrap, qB, qMenu, fullB };
  }

  function showMsg(text) {
    if (!ui) return;
    ui.msg.textContent = text || '';
    ui.msg.hidden = !text;
  }
  const NET_MSG = 'Видео не загрузилось. Проверьте интернет; если включён VPN — попробуйте без него, и наоборот.';

  function chapterAt(t) {
    const ch = (cur && cur.chapters) || [];
    let c = null;
    for (const x of ch) { if (x.t <= t + 0.25) c = x; else break; }
    return c;
  }
  function duration() {
    const d = ui && ui.v.duration;
    return isFinite(d) && d > 0 ? d : (cur && cur.duration) || 0;
  }

  function renderTicks() {
    ui.bar.querySelectorAll('.vp-tick').forEach(t => t.remove());
    const d = duration();
    if (!d) return;
    const track = ui.bar.querySelector('.vp-track');
    ((cur && cur.chapters) || []).forEach(c => {
      if (!(c.t > 0 && c.t < d)) return;   // глава с нуля — не щель, а начало полосы
      const t = el('div', 'vp-tick');
      t.style.left = (c.t / d * 100) + '%';
      t.title = c.title;
      track.appendChild(t);
    });
  }

  function renderTime() {
    if (!ui) return;
    const v = ui.v, d = duration(), t = v.currentTime || 0;
    const p = d ? Math.min(1, t / d) : 0;
    ui.played.style.width = (p * 100) + '%';
    ui.thumb.style.left = (p * 100) + '%';
    ui.time.textContent = fmtTime(t) + ' / ' + fmtTime(d);
    ui.bar.setAttribute('aria-valuemin', '0');
    ui.bar.setAttribute('aria-valuemax', String(Math.floor(d)));
    ui.bar.setAttribute('aria-valuenow', String(Math.floor(t)));
    ui.bar.setAttribute('aria-valuetext', fmtTime(t));
    const c = chapterAt(t);
    ui.chapter.textContent = c ? c.title : '';
    if (v.buffered && v.buffered.length && d) {
      let end = 0;
      for (let i = 0; i < v.buffered.length; i++) if (v.buffered.start(i) <= t + 1) end = Math.max(end, v.buffered.end(i));
      ui.buf.style.width = Math.min(100, end / d * 100) + '%';
    }
  }

  function renderPlay() {
    if (!ui) return;
    const paused = ui.v.paused;
    ui.playB.innerHTML = paused ? ICON.play : ICON.pause;
    ui.playB.title = paused ? 'Смотреть (пробел)' : 'Пауза (пробел)';
    ui.playB.setAttribute('aria-label', ui.playB.title);
  }

  function togglePlay() {
    if (!ui) return;
    const v = ui.v;
    if (v.paused || v.ended) {
      const p = v.play();
      // без жеста пользователя браузер может не дать включить звук — тогда
      // просто остаёмся на паузе, а не падаем с необработанным отказом
      if (p && p.catch) p.catch(() => renderPlay());
    } else v.pause();
  }
  function seekTo(t) {
    if (!ui) return;
    const d = duration();
    ui.v.currentTime = Math.max(0, d ? Math.min(t, d - 0.1) : t);
    ui.resume.hidden = true;
    renderTime();
  }
  function seekBy(dt) { if (ui) seekTo((ui.v.currentTime || 0) + dt); }

  function savePos(force) {
    if (!ui || !cur) return;
    const t = ui.v.currentTime || 0, d = duration();
    // досмотрел почти до конца — в следующий раз с начала, а не с титров
    if (d && t > d - 5) { lsDel(POS_PREFIX + cur.slug); return; }
    if (t > 3 || force) writePos(cur.slug, t);
  }

  // ── меню скорости и качества ─────────────────────────────────────────
  function closeMenus() {
    if (!ui) return;
    ui.rateMenu.hidden = true;
    ui.qMenu.hidden = true;
  }
  function fillMenu(menu, items, onPick) {
    menu.innerHTML = '';
    items.forEach(it => {
      const b = el('button');
      b.type = 'button';
      b.setAttribute('role', 'menuitemradio');
      b.setAttribute('aria-checked', it.on ? 'true' : 'false');
      b.textContent = it.label;
      b.dataset.value = String(it.value);
      b.addEventListener('click', () => { onPick(it.value); closeMenus(); });
      menu.appendChild(b);
    });
  }
  function toggleMenu(menu, fill) {
    const wasOpen = !menu.hidden;
    closeMenus();
    if (wasOpen) return;
    fill();
    menu.hidden = false;
    const on = menu.querySelector('[aria-checked="true"]') || menu.querySelector('button');
    if (on) on.focus();
  }
  function setRate(r) {
    if (!ui) return;
    ui.v.playbackRate = r;
    ui.v.defaultPlaybackRate = r;
    ui.rateB.textContent = fmtRate(r);
    lsSet(RATE_KEY, String(r));
  }
  function qualityItems() {
    const auto = hls ? hls.autoLevelEnabled : true;
    const items = [{ label: 'Авто', value: -1, on: auto }];
    if (hls) {
      // от лучшего к худшему, как привыкли в YouTube
      hls.levels.map((l, i) => ({ h: l.height, i })).sort((a, b) => b.h - a.h)
        .forEach(x => items.push({ label: x.h + 'p', value: x.i, on: !auto && hls.currentLevel === x.i }));
    }
    return items;
  }
  function renderQuality() {
    if (!ui) return;
    if (!hls) { ui.qWrap.hidden = true; return; }
    ui.qWrap.hidden = false;
    const lv = hls.levels[hls.currentLevel];
    ui.qB.textContent = hls.autoLevelEnabled ? 'Авто' + (lv ? ' · ' + lv.height + 'p' : '') : (lv ? lv.height + 'p' : 'Авто');
  }
  function setQuality(i) {
    if (!hls) return;
    // currentLevel переключает сразу (сбрасывает буфер) — человек выбрал
    // качество и хочет увидеть его сейчас, а не через полминуты буфера
    hls.currentLevel = i;
    renderQuality();
  }

  // ── полный экран ─────────────────────────────────────────────────────
  function isFull() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function toggleFull() {
    if (!ui) return;
    if (isFull()) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      return;
    }
    const box = ui.box;
    const req = box.requestFullscreen || box.webkitRequestFullscreen;
    if (req) { const p = req.call(box); if (p && p.catch) p.catch(() => {}); }
    // iPhone не умеет во весь экран элемент — только само видео, своим плеером
    else if (ui.v.webkitEnterFullscreen) ui.v.webkitEnterFullscreen();
  }

  // ── полоса прокрутки ─────────────────────────────────────────────────
  function barTime(clientX) {
    const r = ui.bar.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * duration();
  }
  function showTip(clientX) {
    const d = duration();
    if (!d) return;
    const t = barTime(clientX), r = ui.bar.getBoundingClientRect();
    const c = chapterAt(t);
    ui.tip.textContent = fmtTime(t) + (c ? ' · ' + c.title : '');
    ui.tip.hidden = false;
    const half = ui.tip.offsetWidth / 2;
    ui.tip.style.left = Math.max(half, Math.min(r.width - half, clientX - r.left)) + 'px';
  }
  function bindBar() {
    let dragging = false;
    ui.bar.addEventListener('pointerdown', e => {
      dragging = true;
      ui.bar.setPointerCapture && ui.bar.setPointerCapture(e.pointerId);
      seekTo(barTime(e.clientX));
      showTip(e.clientX);
    });
    ui.bar.addEventListener('pointermove', e => {
      showTip(e.clientX);
      if (dragging) seekTo(barTime(e.clientX));
    });
    const end = () => { dragging = false; };
    ui.bar.addEventListener('pointerup', end);
    ui.bar.addEventListener('pointercancel', end);
    ui.bar.addEventListener('pointerleave', () => { if (!dragging) ui.tip.hidden = true; });
  }

  // ── клавиши ──────────────────────────────────────────────────────────
  function onKey(e) {
    if (!ui) return;
    const k = e.key;
    if (k === 'Escape') {
      // Esc в полном экране браузер забирает себе и выходит из него сам;
      // сюда он доходит, только когда полного экрана уже нет
      e.preventDefault(); e.stopPropagation();
      if (!ui.rateMenu.hidden || !ui.qMenu.hidden) { const b = !ui.rateMenu.hidden ? ui.rateB : ui.qB; closeMenus(); b.focus(); }
      else close();
      return;
    }
    if (k === 'Tab') { trapTab(e); e.stopPropagation(); return; }
    const inMenu = e.target && e.target.closest && e.target.closest('.vp-menu');
    if (k === ' ' || k === 'Spacebar') {
      // пробел на кнопке меню оставляем кнопке, иначе меню не выбрать с клавиатуры
      if (inMenu) { e.stopPropagation(); return; }
      e.preventDefault(); e.stopPropagation();
      togglePlay();
      wake();
      return;
    }
    if (k === 'ArrowLeft' || k === 'ArrowRight') {
      e.preventDefault(); e.stopPropagation();
      seekBy(k === 'ArrowLeft' ? -SEEK_STEP : SEEK_STEP);
      wake();
      return;
    }
    if (k === 'ArrowUp' || k === 'ArrowDown') {
      e.stopPropagation();
      if (inMenu) {
        e.preventDefault();
        const items = [...inMenu.querySelectorAll('button')];
        const i = items.indexOf(document.activeElement);
        const n = items[(i + (k === 'ArrowDown' ? 1 : -1) + items.length) % items.length];
        if (n) n.focus();
      }
      return;
    }
    // Захват на window, а не на document: window стоит первым на пути
    // события, и обработчик тренажёра, повешенный туда же с захватом, не
    // успеет раньше нас.
    // Остальные клавиши не пускаем к тренажёру под окном (цифры набрали бы
    // ответ в поле задания), но Enter на кнопках плеера работает как обычно
    e.stopPropagation();
  }
  function onKeyUp(e) { if (ui) e.stopPropagation(); }
  function trapTab(e) {
    const f = [...ui.o.querySelectorAll('button, [tabindex="0"]')].filter(x => !x.hidden && x.offsetParent !== null && !x.closest('[hidden]'));
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!ui.o.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  }

  // Панель прячется, пока видео идёт и мышь стоит: доска на видео — главное,
  // а полоса с кнопками закрывает нижние строки решения в полном экране
  function wake() {
    if (!ui) return;
    ui.box.classList.remove('vp-idle');
    clearTimeout(hideTimer);
    if (isFull() && !ui.v.paused) hideTimer = setTimeout(() => { if (ui && !ui.v.paused) ui.box.classList.add('vp-idle'); }, 2500);
  }

  // ── открыть / закрыть ────────────────────────────────────────────────
  function open(video) {
    if (!video || !video.hls_url) return;
    if (ui) close();
    cur = video;
    lastFocus = document.activeElement;
    ui = build(video);
    if (!document.getElementById('videoPlayerIdle')) {
      const st = document.createElement('style');
      st.id = 'videoPlayerIdle';
      st.textContent = '.vp-box.vp-idle .vp-controls,.vp-box.vp-idle .vp-head{opacity:0;transition:opacity .3s;}.vp-box.vp-idle{cursor:none;}';
      document.head.appendChild(st);
    }
    document.body.appendChild(ui.o);
    document.documentElement.classList.add('vp-lock');
    const v = ui.v;

    // щелчок мимо окна закрывает, как у любого всплывающего окна
    ui.o.addEventListener('click', e => { if (e.target === ui.o) close(); });
    ui.closeB.addEventListener('click', close);
    ui.playB.addEventListener('click', togglePlay);
    ui.backB.addEventListener('click', () => seekBy(-SEEK_STEP));
    ui.fwdB.addEventListener('click', () => seekBy(SEEK_STEP));
    ui.fullB.addEventListener('click', toggleFull);
    v.addEventListener('click', togglePlay);
    v.addEventListener('dblclick', toggleFull);
    ui.rateB.addEventListener('click', () => toggleMenu(ui.rateMenu, () =>
      fillMenu(ui.rateMenu, RATES.map(r => ({ label: fmtRate(r), value: r, on: v.playbackRate === r })), setRate)));
    ui.qB.addEventListener('click', () => toggleMenu(ui.qMenu, () => fillMenu(ui.qMenu, qualityItems(), setQuality)));
    ui.box.addEventListener('pointermove', wake);
    ui.box.addEventListener('click', e => { if (!e.target.closest('.vp-menu-wrap')) closeMenus(); });
    ui.fromStart.addEventListener('click', () => { seekTo(0); lsDel(POS_PREFIX + cur.slug); });
    bindBar();

    ['timeupdate', 'progress', 'durationchange', 'seeked'].forEach(ev => v.addEventListener(ev, renderTime));
    v.addEventListener('loadedmetadata', () => { renderTicks(); renderTime(); });
    v.addEventListener('play', () => { renderPlay(); wake(); showMsg(''); });
    v.addEventListener('pause', () => { renderPlay(); wake(); savePos(); });
    v.addEventListener('ended', () => { lsDel(POS_PREFIX + cur.slug); renderPlay(); });
    v.addEventListener('waiting', () => { if (!v.paused) showMsg('Загрузка…'); });
    v.addEventListener('playing', () => showMsg(''));
    v.addEventListener('ratechange', () => { if (ui) ui.rateB.textContent = fmtRate(v.playbackRate); });
    // родной плеер (Safari) сообщает о сбое только событием error у <video>
    v.addEventListener('error', () => { if (!hls) showMsg(NET_MSG); });
    saveTimer = setInterval(() => { if (ui && !ui.v.paused) savePos(); }, 5000);

    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', onKeyUp, true);
    document.addEventListener('fullscreenchange', wake);
    document.addEventListener('webkitfullscreenchange', wake);

    const rate = readRate();
    const startAt = readPos(video.slug);
    const d0 = video.duration || 0;
    const resumeAt = startAt > 3 && (!d0 || startAt < d0 - 5) ? startAt : 0;
    // скорость ставим и после загрузки: hls.js и Safari сбрасывают её при
    // подключении источника
    const applyStart = () => {
      if (!ui || ui.v !== v) return;
      setRate(rate);
      if (resumeAt) {
        v.currentTime = resumeAt;
        ui.resumeText.textContent = 'Продолжаем с ' + fmtTime(resumeAt);
        ui.resume.hidden = false;
        setTimeout(() => { if (ui) ui.resume.hidden = true; }, 6000);
      }
      renderTicks();
      renderTime();
    };
    setRate(rate);
    renderPlay();
    renderTime();
    renderTicks();
    renderQuality();
    showMsg('Загрузка…');

    if (preferNative(v)) {
      v.src = video.hls_url;
      v.addEventListener('loadedmetadata', () => { applyStart(); showMsg(''); }, { once: true });
      renderQuality();
    } else {
      loadHls().then(Hls => {
        if (!ui || ui.v !== v) return;   // окно успели закрыть, пока грузился hls.js
        if (!Hls.isSupported()) {
          if (v.canPlayType('application/vnd.apple.mpegurl')) {
            v.src = video.hls_url;
            v.addEventListener('loadedmetadata', () => { applyStart(); showMsg(''); }, { once: true });
          } else showMsg('Этот браузер не умеет показывать видео. Откройте сайт в Safari, Chrome или Яндекс Браузере.');
          return;
        }
        hls = new Hls({
          // на телефоне не качаем 1080p в окошко шириной 375 пикселей — трафик
          // и наш, и ученика; ручной выбор качества это ограничение обходит
          capLevelToPlayerSize: true,
          startPosition: resumeAt || -1,
          maxBufferLength: 30,
        });
        let netRetry = 0, mediaRetry = 0;
        hls.on(Hls.Events.ERROR, (ev, data) => {
          if (!data.fatal) return;
          // Одна повторная попытка на сбой: сеть мигнула при переключении VPN
          // или медиабуфер споткнулся — часто проходит без перезагрузки
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR && netRetry++ < 1) { hls.startLoad(); return; }
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRetry++ < 1) { hls.recoverMediaError(); return; }
          showMsg(NET_MSG);
        });
        hls.on(Hls.Events.MANIFEST_PARSED, () => { applyStart(); showMsg(''); renderQuality(); });
        hls.on(Hls.Events.LEVEL_SWITCHED, renderQuality);
        hls.loadSource(video.hls_url);
        hls.attachMedia(v);
      }).catch(() => showMsg('Не загрузился модуль плеера. Проверьте интернет и откройте видео ещё раз.'));
    }
    ui.playB.focus();
  }

  function close() {
    if (!ui) return;
    savePos();
    clearInterval(saveTimer);
    clearTimeout(hideTimer);
    if (isFull()) { try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) {} }
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('keyup', onKeyUp, true);
    document.removeEventListener('fullscreenchange', wake);
    document.removeEventListener('webkitfullscreenchange', wake);
    // останавливаем загрузку: закрытое окно не должно дальше тянуть сегменты
    try { ui.v.pause(); } catch (e) {}
    if (hls) { try { hls.destroy(); } catch (e) {} hls = null; }
    ui.v.removeAttribute('src');
    try { ui.v.load(); } catch (e) {}
    ui.o.remove();
    document.documentElement.classList.remove('vp-lock');
    ui = null;
    cur = null;
    if (lastFocus && lastFocus.focus && document.contains(lastFocus)) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
    lastFocus = null;
  }

  // Ушли со страницы посреди ролика — место всё равно запомнится
  window.addEventListener('pagehide', () => savePos());

  // стиль кнопки нужен ещё до первого открытия окна
  function injectStyleEarly() {
    if (document.getElementById('videoPlayerStyle') || !document.head) return;
    const st = document.createElement('style');
    st.id = 'videoPlayerStyle';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  injectStyleEarly();

  window.VideoPlayer = {
    findFor, syncButton, open, close,
    isOpen: () => !!ui,
    // для тестов и отладки: каким путём играет видео
    mode: () => (ui ? (hls ? 'hls.js' : 'native') : null),
  };
})();
