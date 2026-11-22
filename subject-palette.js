/* subject-palette.js — цвет всего интерфейса по предмету.

   Зачем. У каждого предмета свой цвет (subjects-catalog.js: математика
   синяя, русский красный, обществознание зелёное, английский фиолетовый…),
   но раскрашена им была только главная. Тренажёры обществознания, английского,
   физики и информатики, доски, кабинет и «Работы» оставались синими: синий
   прописан в :root каждой страницы отдельно. Решение Даниила 18.11: палитра
   идёт от предмета, и педагог может выбрать её сам — не обязательно тот
   предмет, с которого зашёл; ученик видит то же, что показывает педагог.

   Как работает. Все страницы берут акцент из одних и тех же переменных
   (--ink, --ink-active, --hl-*, --hover-*, --blob-1, --grid). Скрипт стоит в
   <head> сразу после определения темы, вычисляет предмет палитры и ставит
   html[data-palette="<предмет>"], а вставленный <style> перекрывает эти
   переменные. Селектор :root[data-palette] сильнее, чем :root и
   html[data-theme="dark"] страниц, поэтому порядок подключения не важен.
   Если палитра совпадает с родной палитрой страницы, атрибута нет вовсе —
   страница выглядит ровно как раньше (свои тонкие настройки цвета целы).

   Какой предмет:
     1) у ученика в сессии — предмет, который прислал педагог (только на
        эту вкладку, sessionStorage; свой выбор ученика не трогаем);
     2) выбор педагога — настройка cabinetPalette в teacher_settings
        (сервер, копия в localStorage 'teacher:settings:v1', читаем её
        синхронно). Без входа — выбор этого устройства ('mathh:palette');
     3) «По предмету» (по умолчанию, cabinetPalette.subject = 'neutral'):
        тренажёр — свой предмет, главная — выбранная вкладка, доски, кабинет,
        «Работы», конспект — последний открытый предмет ('mathh:lastSubject').

   API: MathhPalette.current() — предмет палитры сейчас; choice() — выбор
   ('auto' или id); choose(id|'auto') — выбрать (и сохранить на сервер, если
   есть вход); subjects; setRemote(id|null) — палитра педагога в сессии;
   onChange(fn). */
(function () {
  'use strict';
  if (window.MathhPalette) return;

  var root = document.documentElement;
  var LOCAL_KEY = 'mathh:palette';        // выбор без входа в аккаунт
  var LAST_KEY = 'mathh:lastSubject';     // последний открытый предмет
  var REMOTE_KEY = 'mathh:palette:remote'; // палитра педагога у ученика (вкладка)
  var TS_KEY = 'teacher:settings:v1';     // копия teacher-settings.js

  // Цвета — те же, что у главной (index.html, html[data-subject]) и в
  // subjects-catalog.js. ink/act — акцент и нажатие, rgb — для полупрозрачных
  // подсветок, blob — цветное пятно фона. В тёмной теме тон светлее, чтобы
  // белый текст на акцентной кнопке читался так же
  var P = {
    math: { title: 'Математика', color: 'Синий',
      l: { ink: '#004C99', act: '#003A75', ink2: '#1E6FC2', rgb: '0,76,153',    blob: 'rgba(120,150,255,.16)' },
      d: { ink: '#2E7DE0', act: '#4A93F0', ink2: '#79ADF0', rgb: '46,125,224',  blob: 'rgba(90,110,255,.22)' } },
    inf:  { title: 'Информатика', color: 'Бирюзовый',
      l: { ink: '#0B6577', act: '#08505E', ink2: '#1592A5', rgb: '11,101,119',  blob: 'rgba(21,146,165,.16)' },
      d: { ink: '#2FA3B5', act: '#4DB8C8', ink2: '#7FD0DC', rgb: '47,163,181',  blob: 'rgba(47,163,181,.22)' } },
    phys: { title: 'Физика', color: 'Оранжевый',
      l: { ink: '#A3480F', act: '#843A0C', ink2: '#C8621F', rgb: '163,72,15',   blob: 'rgba(200,98,31,.16)' },
      d: { ink: '#D9773A', act: '#E58C52', ink2: '#F0AE80', rgb: '217,119,58',  blob: 'rgba(217,119,58,.22)' } },
    rus:  { title: 'Русский', color: 'Красный',
      l: { ink: '#9E2A47', act: '#7E1F37', ink2: '#C2405F', rgb: '158,42,71',   blob: 'rgba(194,64,95,.16)' },
      d: { ink: '#C9506E', act: '#D86A86', ink2: '#ED8DA5', rgb: '210,90,118',  blob: 'rgba(210,90,118,.22)' } },
    soc:  { title: 'Обществознание', color: 'Зелёный',
      l: { ink: '#17694F', act: '#10523D', ink2: '#24896A', rgb: '23,105,79',   blob: 'rgba(36,137,106,.16)' },
      d: { ink: '#2F8F70', act: '#3FA584', ink2: '#78CBB0', rgb: '58,158,126',  blob: 'rgba(58,158,126,.22)' } },
    eng:  { title: 'Английский', color: 'Фиолетовый',
      l: { ink: '#5B3596', act: '#47287A', ink2: '#7A52B8', rgb: '91,53,150',   blob: 'rgba(122,82,184,.16)' },
      d: { ink: '#8462C8', act: '#9878D6', ink2: '#BAA0ED', rgb: '148,116,208', blob: 'rgba(148,116,208,.22)' } }
  };
  var ORDER = ['math', 'inf', 'phys', 'rus', 'soc', 'eng'];

  // смесь двух цветов #RRGGBB: линии клетки — едва заметный оттенок предмета
  function mix(a, b, t) {
    var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16), out = '#';
    [16, 8, 0].forEach(function (s) {
      var c = Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t);
      out += (c < 16 ? '0' : '') + c.toString(16);
    });
    return out;
  }
  function rgba(rgb, a) { return 'rgba(' + rgb + ',' + a + ')'; }

  function vars(c, dark) {
    var grid = dark ? mix('#151A2C', c.ink, 0.22) : mix('#FFFFFF', c.ink, 0.14);
    return [
      '--ink:' + c.ink, '--ink-active:' + c.act, '--ink-2:' + c.ink2,
      '--hl-06:' + rgba(c.rgb, dark ? .10 : .06), '--hl-10:' + rgba(c.rgb, dark ? .16 : .10),
      '--hl-14:' + rgba(c.rgb, dark ? .26 : .14), '--hl:' + rgba(c.rgb, dark ? .26 : .14),
      // в тёмной теме у страниц эти подсветки плотнее (lcm.html и др.)
      '--hl-18:' + rgba(c.rgb, dark ? .29 : .18), '--hl-28:' + rgba(c.rgb, dark ? .45 : .28), '--hl-35:' + rgba(c.rgb, dark ? .5 : .35),
      '--hover-1:' + rgba(c.rgb, dark ? .08 : .06), '--hover-2:' + rgba(c.rgb, dark ? .14 : .10),
      '--blob-1:' + c.blob, '--grid:' + grid, '--bgp-line:' + grid,
      // панель сессии ученика и форма отчёта об уроке (student-memory.js,
      // lesson-reports.css) уже читают общий цвет действий отсюда
      '--lesson-action-bg:' + (dark ? c.ink : c.act),
      // меню навигации по номерам экзамена (exam-nav.css)
      '--ej-ink:' + (dark ? c.ink2 : c.ink), '--ej-soft:' + rgba(c.rgb, dark ? .10 : .08), '--ej-dot:' + c.ink2,
      '--subject-color:' + c.ink
    ].join(';');
  }
  /* Тёмная тема в тоне предмета. Фон, бумага, карточки и стекло тёмной темы
     у всех страниц одни и те же тёмно-синие (#0B0E1A, rgba(30,37,64,.82)…) —
     это «ночь» математики. С красным или зелёным акцентом синяя ночь
     выглядит чужой, поэтому у остальных предметов те же тёмные тона берут
     оттенок предмета: светлота та же, насыщенность чуть ниже (тёплые
     оттенки при той же насыщенности смотрятся грязно-коричневыми).
     Правило по data-palette-subject, а не data-palette: оно нужно и там,
     где палитра совпадает с родной (обществознание на своей странице) */
  function hsl(hex) {
    var n = parseInt(hex.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
    }
    return [h, s, l];
  }
  // тот же тёмный тон, но с оттенком hue: 'r,g,b'
  function retint(rgb, hue, k) {
    var p = rgb.split(',').map(Number);
    var hx = '#' + p.map(function (v) { return (v < 16 ? '0' : '') + v.toString(16); }).join('');
    var t = hsl(hx), s = t[1] * k, l = t[2];
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((hue / 60) % 2 - 1)), m = l - c / 2;
    var seg = Math.floor(hue / 60) % 6;
    var rr = [c, x, 0, 0, x, c][seg], gg = [x, c, c, x, 0, 0][seg], bb = [0, 0, x, c, c, x][seg];
    return [rr, gg, bb].map(function (v) { return Math.round((v + m) * 255); }).join(',');
  }
  function hexOf(rgb) {
    return '#' + rgb.split(',').map(function (v) { v = +v; return (v < 16 ? '0' : '') + v.toString(16); }).join('').toUpperCase();
  }
  function hex2(h, s, l) {
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    var seg = Math.floor(h / 60) % 6;
    var rr = [c, x, 0, 0, x, c][seg], gg = [x, c, c, x, 0, 0][seg], bb = [0, 0, x, c, c, x][seg];
    return hexOf([rr, gg, bb].map(function (v) { return Math.round((v + m) * 255); }).join(','));
  }
  // относительная яркость и контраст по WCAG — тот же расчёт, что в тесте
  function lum(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255].map(function (v, i) {
      v /= 255; v = v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4);
      return v * [.2126, .7152, .0722][i];
    }).reduce(function (a, b) { return a + b; });
  }
  function cr(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  // двигаем светлоту цвета (оттенок тот же), пока контраст с ref не станет ≥ goal
  function reach(hex, ref, goal, dir) {
    var t = hsl(hex), l = t[2], out = hex;
    for (var i = 0; i < 100 && cr(out, ref) < goal; i++) {
      l = Math.min(1, Math.max(0, l + dir * 0.01));
      out = hex2(t[0], t[1], l);
    }
    return out;
  }
  // тона текста тёмной темы — общие для всех предметов, и для математики
  // (там T — без перекраски: фон и панели остаются прежними синими)
  function textVars(id, T) {
    var lightest = hexOf(T('46,53,84')), cardC = hexOf(T('30,37,64'));
    var fill = reach(P[id].d.ink, '#FFFFFF', 4.6, -1);
    // 5,2 на самой светлой панели (на карточке выходит ~6): выше — текст
    // становится почти белым и теряет цвет предмета; насыщенность поднимаем,
    // чтобы осветлённый тон оставался узнаваемым
    var t0 = hsl(P[id].d.ink);
    var text = reach(hex2(t0[0], Math.max(t0[1], 0.75), t0[2]), lightest, 5.2, +1);
    var mutedA = reach('#9A9AA2', cardC, 7, +1), mutedB = reach('#AEAEB4', cardC, 8.5, +1);
    var ink = { fill: fill, text: text, act: hex2(hsl(fill)[0], hsl(fill)[1], Math.max(0, hsl(fill)[2] - .06)) };
    return [
        '--ink:' + fill, '--ink-active:' + ink.act, '--ink-text:' + text, '--ink-2:' + text,
        '--ej-ink:' + text, '--lesson-action-bg:' + fill,
        // зелёная кнопка «верно» (Хватит, Проверено) — тоже белый текст поверх
        '--ok:' + reach('#3E8E5B', '#FFFFFF', 4.6, -1),
        '--muted-1:' + mutedA, '--muted-2:' + mutedA, '--muted-6:' + mutedA, '--muted-8:' + mutedA,
        '--muted-3:' + mutedB, '--muted-4:' + reach('#C7C7CC', cardC, 10, +1)
    ];
  }
  var NIGHT = {}; // id → { bg: '#…' } для meta theme-color
  function nightVars(id) {
    // тёплые (русский, физика) приглушаем сильнее: красно-коричневые панели
    // утомляют глаз на длинном уроке
    var hue = hsl(P[id].d.ink)[0], k = { eng: 1, rus: 0.6, phys: 0.6 }[id] || 0.8;
    var T = function (rgb) { return retint(rgb, hue, k); };
    var bg = hexOf(T('11,14,26'));
    NIGHT[id] = { bg: bg };
    var menu = 'rgb(' + T('30,37,64') + ')';
    /* Шрифты контрастнее (просьба Даниила 22.11: на цветных тёмных темах
       читалось плохо). Замеры до правки: цветной текст 3,5–3,9, белый текст
       на цветной кнопке 3,2–4,3 (физика хуже всего), серый 5–6,9. Одним
       цветом предмета оба случая не вытянуть: светлее — лучше текст, но
       хуже белое на кнопке. Поэтому два тона: --ink (заливка) темнее, чтобы
       белому было ≥ 4,6, и --ink-text светлее для цветного текста, ≥ 5,2 на
       самой светлой панели. Правила с color: var(--ink) переводятся на него
       ниже (retargetInkText). Серый — до ≥ 7 на карточке */
    return {
      vars: textVars(id, T).concat([
        '--bg:' + bg, '--paper:' + hexOf(T('21,26,44')),
        '--card:rgba(' + T('30,37,64') + ',.82)', '--glass:rgba(' + T('40,46,74') + ',.5)',
        '--glass-strong:rgba(' + T('46,53,84') + ',.65)', '--muted-7:' + hexOf(T('58,63,85')),
        '--grid:' + hexOf(T('35,42,68')), '--bgp-line:' + hexOf(T('35,42,68')),
        '--text-bg:rgba(' + T('20,25,44') + ',.6)',
        // второе пятно фона — соседний оттенок, а не сиреневый математики
        '--blob-2:rgba(' + retint('150,90,220', (hue + 40) % 360, 0.7) + ',.16)'
      ]).join(';'),
      // меню с непрозрачным фоном, прописанным прямо в стилях
      menu: menu
    };
  }
  var css = '';
  ORDER.forEach(function (id) {
    css += ':root[data-palette="' + id + '"]{' + vars(P[id].l, false) + '}';
    css += ':root[data-palette="' + id + '"][data-theme="dark"]{' + vars(P[id].d, true) + '}';
    if (id === 'math') {
      // у математики фон и панели прежние, меняются только тона текста
      css += ':root[data-palette-subject="math"][data-theme="dark"]{' +
        textVars('math', function (rgb) { return rgb; }).join(';') + '}';
      return;
    }
    var n = nightVars(id), sel = ':root[data-palette-subject="' + id + '"][data-theme="dark"]';
    css += sel + '{' + n.vars + '}';
    css += sel + ' #examJumpMenu,' + sel + ' .exam-vb-pop{background:' + n.menu + '!important}';
  });
  var style = document.createElement('style');
  style.id = 'mathh-palette';
  style.textContent = css;
  (document.head || root).appendChild(style);

  /* ── цветной текст — светлым тоном (--ink-text) ──
     Цвет предмета служит и заливкой кнопок (белый текст поверх), и цветом
     текста. В тёмной теме этим ролям нужны разные тона, а правил с
     «color: var(--ink)» — сотни в десятках страниц. Поэтому не правим
     файлы, а один раз проходим по готовым стилям и меняем в таких правилах
     цвет на var(--ink-text, var(--ink)). --ink-text задан только в тёмной
     теме цветных предметов, в остальных случаях подставится тот же --ink —
     ничего не меняется. Правило, где фон тоже --ink, не трогаем: там текст
     поверх заливки. Пропущенное место (стиль, вписанный прямо в элемент)
     остаётся каким было, хуже не становится */
  var INK_RE = /^var\(\s*--ink\s*(,[^)]*)?\)$/;
  function retargetRules(rules) {
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (r.cssRules && !r.selectorText) { retargetRules(r.cssRules); continue; }
      if (!r.style || !r.selectorText) continue;
      var c = r.style.getPropertyValue('color').trim();
      if (!INK_RE.test(c)) continue;
      var b = r.style.getPropertyValue('background') + r.style.getPropertyValue('background-color');
      if (b.indexOf('--ink') >= 0) continue;
      r.style.setProperty('color', 'var(--ink-text, ' + c + ')', r.style.getPropertyPriority('color'));
    }
  }
  function retargetInkText() {
    for (var i = 0; i < document.styleSheets.length; i++) {
      var sh = document.styleSheets[i], rules = null;
      try { rules = sh.cssRules; } catch (e) { continue; } // чужой домен — не читается
      if (rules) retargetRules(rules);
    }
  }
  // стили досок, презентаций и сессии добавляются скриптами позже — проход
  // повторяем (он идемпотентен: переведённое правило уже не совпадает с INK_RE)
  var retT = 0;
  function retargetSoon() { clearTimeout(retT); retT = setTimeout(retargetInkText, 30); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', retargetInkText);
  else retargetInkText();
  window.addEventListener('load', retargetInkText);
  // следим только за прямыми детьми <head> и <body> — туда скрипты кладут
  // свои <style>; всё дерево не слушаем: на досках узлы меняются постоянно
  var styleObs = null;
  try {
    styleObs = new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) for (var j = 0; j < list[i].addedNodes.length; j++) {
        var n = list[i].addedNodes[j];
        if (n.nodeName === 'STYLE') retargetSoon();
        else if (n.nodeName === 'LINK') n.addEventListener('load', retargetSoon);
      }
    });
    if (document.head) styleObs.observe(document.head, { childList: true });
    var watchBody = function () { if (document.body) styleObs.observe(document.body, { childList: true }); };
    if (document.body) watchBody(); else document.addEventListener('DOMContentLoaded', watchBody);
  } catch (e) {}

  /* ── предмет страницы ── */
  var file = (location.pathname.split('/').pop() || 'index.html').toLowerCase().replace(/\.html$/, '') || 'index';
  // страницы без своего предмета: их палитра — от последнего открытого
  // предмета; свёрстаны они синими, поэтому «родная» палитра — математика
  var NEUTRAL = /^(boards|boards-panel|cabinet|works|work|notes|stage|deck-guide|font-check)$/;
  var isIndex = file === 'index';
  var isNeutral = NEUTRAL.test(file);
  function valid(id) { return typeof id === 'string' && Object.prototype.hasOwnProperty.call(P, id); }
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }

  // родной предмет страницы — тот же разбор имени файла, что в bg-style.js
  function native() {
    if (isNeutral) return 'math';
    if (/^rus/.test(file)) return 'rus';
    if (/^soc/.test(file)) return 'soc';
    if (/^eng/.test(file)) return 'eng';
    if (/^phys?/.test(file)) return 'phys';
    if (/^inf/.test(file)) return 'inf';
    var a = root.getAttribute('data-subject');
    return isIndex && valid(a) ? a : 'math';
  }
  function lastSubject() {
    var v = ls(LAST_KEY) || ls('ogeNav:subject');
    return valid(v) ? v : 'math';
  }

  /* ── выбор педагога ── */
  // id вошедшего пользователя — из сессии supabase-js в localStorage
  // (ключ sb-<проект>-auth-token). Копия teacher_settings общая для всех
  // аккаунтов на устройстве, поэтому выбор чужого аккаунта не берём —
  // так же сверяет owner кабинет
  function userId() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!/^sb-.+-auth-token$/.test(k)) continue;
        var s = JSON.parse(localStorage.getItem(k) || 'null');
        var u = s && (s.user || (s.currentSession && s.currentSession.user));
        if (u && u.id) return u.id;
      }
    } catch (e) {}
    return null;
  }
  function choice() {
    var uid = userId();
    if (uid) {
      var ts = null;
      try { ts = JSON.parse(ls(TS_KEY) || 'null'); } catch (e) {}
      var p = ts && ts.cabinetPalette;
      if (p && p.owner === uid) return valid(p.subject) ? p.subject : 'auto';
    }
    var v = ls(LOCAL_KEY);
    return valid(v) ? v : 'auto';
  }
  // основной предмет педагога (teacher_settings.mainSubject, кабинет)
  function mainSubject() {
    var uid = userId();
    if (!uid) return null;
    var ts = null;
    try { ts = JSON.parse(ls(TS_KEY) || 'null'); } catch (e) {}
    var m = ts && ts.mainSubject;
    return m && m.owner === uid && valid(m.subject) ? m.subject : null;
  }
  function remote() {
    var v = null;
    try { v = sessionStorage.getItem(REMOTE_KEY); } catch (e) {}
    return valid(v) ? v : null;
  }
  function current() {
    var r = remote();
    if (r) return r;
    var c = choice();
    if (c !== 'auto') return c;
    // доски, кабинет, «Работы»: основной предмет педагога (решение Даниила
    // 18.11), а пока он не выбран — последний открытый предмет
    return isNeutral ? (mainSubject() || lastSubject()) : native();
  }

  var subs = [], lastApplied = null;
  function apply() {
    var cur = current();
    if (cur === native()) root.removeAttribute('data-palette');
    else root.setAttribute('data-palette', cur);
    root.setAttribute('data-palette-subject', cur);
    paintBar(cur);
    // и смена выбора без смены цвета («по предмету» → «математика» на
    // математике) — подпись пункта меню должна обновиться
    var key = cur + '|' + choice();
    if (key !== lastApplied) {
      lastApplied = key;
      subs.forEach(function (fn) { try { fn(cur); } catch (e) {} });
    }
  }
  // полоса браузера на телефоне (meta theme-color) — в цвет тёмного фона
  // предмета; в светлой теме и у математики — как прописано в странице
  var metaOrig = null;
  function paintBar(cur) {
    var m = document.querySelector('meta[name="theme-color"]');
    if (!m) return;
    if (metaOrig === null) metaOrig = m.getAttribute('content') || '';
    var dark = root.getAttribute('data-theme') === 'dark';
    m.setAttribute('content', dark && NIGHT[cur] && metaOrig.toUpperCase() === '#0B0E1A' ? NIGHT[cur].bg : metaOrig);
  }
  new MutationObserver(function () { paintBar(current()); })
    .observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  // тренажёр и вкладка главной — «последний открытый предмет» для досок и
  // кабинета: с какого предмета пришли, тем цветом они и откроются
  function remember() { if (!isNeutral) lsSet(LAST_KEY, native()); }
  remember();
  apply();

  // на главной предмет меняется вкладкой без перезагрузки
  if (isIndex) new MutationObserver(function () { remember(); apply(); })
    .observe(root, { attributes: true, attributeFilter: ['data-subject'] });
  // выбор в другой вкладке (кабинет сохранил, сервер ответил)
  window.addEventListener('storage', function (e) {
    if (!e.key || e.key === TS_KEY || e.key === LOCAL_KEY || /auth-token$/.test(e.key)) apply();
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) apply(); });

  /* ── сохранить выбор ── */
  function loadScript(src) {
    return new Promise(function (ok, fail) {
      if (document.querySelector('script[src="' + src + '"]')) return ok();
      var s = document.createElement('script');
      s.src = src; s.onload = ok; s.onerror = fail;
      document.head.appendChild(s);
    });
  }
  // Выбор педагога живёт на сервере (teacher_settings.cabinetPalette), чтобы
  // открываться первым с любого устройства. Страницы без кабинета
  // (главная, доски) догружают teacher-settings.js и cabinet-cloud.js только
  // в момент выбора — при обычном открытии сеть не нужна
  function choose(id) {
    if (id !== 'auto' && !valid(id)) return Promise.resolve(false);
    var uid = userId();
    var subject = id === 'auto' ? 'neutral' : id;
    lsSet(LOCAL_KEY, id === 'auto' ? null : id);
    if (!uid) { apply(); return Promise.resolve(false); }
    // локальная копия — сразу, интерфейс не ждёт сеть
    try {
      var ts = JSON.parse(ls(TS_KEY) || 'null') || {};
      ts.cabinetPalette = { owner: uid, subject: subject };
      lsSet(TS_KEY, JSON.stringify(ts));
    } catch (e) {}
    apply();
    if (!window.SUPABASE_CONFIG || !window.supabase) return Promise.resolve(false);
    var ready = window.TeacherSettings && window.CabinetCloud ? Promise.resolve()
      : loadScript('teacher-settings.js').then(function () { return loadScript('cabinet-cloud.js'); });
    return ready.then(function () {
      var TS = window.TeacherSettings;
      // сначала серверная копия: иначе set() затёр бы чужие поля
      // настроек (оплаты, подписи) старыми значениями этого устройства
      return TS.load().then(function () {
        return TS.set({ cabinetPalette: { owner: uid, subject: subject } });
      });
    }).then(function () { apply(); return true; }, function () { return false; });
  }

  function setRemote(id) {
    try {
      if (valid(id)) sessionStorage.setItem(REMOTE_KEY, id);
      else sessionStorage.removeItem(REMOTE_KEY);
    } catch (e) {}
    apply();
  }

  /* ── пункт «Цвет» в меню «⋯» (главная, доски) ── */
  function label() {
    var c = choice();
    // цвет называем цветом, а не предметом (просьба Даниила 22.11)
    return 'Цвет: ' + (c === 'auto' ? 'по предмету' : P[c].color.toLowerCase());
  }
  function mountMenuItem() {
    if (!window.MathhMenu || !document.querySelector('.lg-menu') || document.getElementById('paletteToggle')) return;
    var item = window.MathhMenu.mount().add({ id: 'paletteToggle', icon: 'board', label: label(), keepOpen: true,
      onClick: function () {
        // по кругу: по предмету → математика → … → английский → по предмету
        var ids = ['auto'].concat(ORDER);
        choose(ids[(ids.indexOf(choice()) + 1) % ids.length]);
      } });
    // место — рядом с «Фон» (оба про внешний вид), а «Подборка» остаётся
    // последней: ею пользуются реже всего (test_prompt114)
    var anchor = document.getElementById('bgToggle') || document.getElementById('fxToggle');
    var anchorRow = anchor && anchor.closest('.lg-item');
    if (anchorRow && anchorRow.parentNode) {
      anchorRow.parentNode.insertBefore(item.row, anchorRow.nextSibling);
      Array.prototype.forEach.call(anchorRow.parentNode.children, function (r, i) { r.style.setProperty('--i', i); });
    }
    // значок — кружок цвета палитры: подпись и так называет предмет
    item.el.innerHTML = '<span aria-hidden="true" style="display:block;width:20px;height:20px;border-radius:50%;' +
      'background:var(--ink);box-shadow:inset 0 0 0 2px rgba(255,255,255,.55)"></span>';
    function sync() {
      item.setLabel(label());
      item.el.setAttribute('aria-label', label());
      item.setActive(choice() !== 'auto');
    }
    subs.push(sync);
    window.addEventListener('storage', sync);
    sync();
  }
  if (document.readyState === 'complete') setTimeout(mountMenuItem, 0);
  else window.addEventListener('load', function () { setTimeout(mountMenuItem, 0); });

  window.MathhPalette = {
    subjects: ORDER.map(function (id) { return { id: id, title: P[id].title, colorName: P[id].color, color: P[id].l.ink }; }),
    current: current, choice: choice, native: native, choose: choose, mainSubject: mainSubject,
    setRemote: setRemote, refresh: apply,
    // цвета для содержимого слайда (фигуры, шапка таблицы в презентациях):
    // светлый тон предмета — слайд печатают и показывают на белом, тёмная
    // тема интерфейса тут ни при чём. У математики — null: остаются
    // привычные цвета Office (#4472C4), как у импорта PPTX
    slideColors: function () {
      var id = current();
      if (id === 'math') return null;
      var c = P[id].l;
      return { fill: c.ink, line: c.act, soft: mix('#FFFFFF', c.ink, 0.15), border: mix('#FFFFFF', c.ink, 0.45), title: P[id].color };
    },
    onChange: function (fn) { subs.push(fn); }
  };
})();
