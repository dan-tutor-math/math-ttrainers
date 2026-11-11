/* ==========================================================
   trainer-tasks.js — задания тренажёров «снаружи» тренажёра.

   Вынесено из boards-core.js в промпте №15 «работы» (этап 1): тем же
   самым теперь пользуются и доски, и конструктор работ (works.html), и
   страница ученика (work.html). До выноса всё это жило внутри движка
   досок, и вторая копия для работ разошлась бы с первой при первой же
   правке — у каждого тренажёра своя модель задания, и карта «где задание,
   какой ответ, как сделать такое же» должна быть одна.

   Что здесь:
   - каталог тренажёров для панелей (TRAINERS_PANEL_GROUPS) и карта узлов
     задания (TRAINER_CAPTURE, collectTrainerCaptureNodes);
   - снимок задания чистой карточкой (captureTrainerNode, html2canvas) с
     замером мест под живые поля (prepareTaskClone, bakeTaskRows);
   - верный ответ из самого тренажёра (trainerTaskInfo) и проверка записи
     ответа (taCheckField — копия разбора из ege_prof.html);
   - рецепт «такого же задания» (trainerGenInfo) и невидимые кадры, где оно
     делается заново (genFrameFor, genShowSameInFrame, genNewTaskInFrame);
   - «Обновить пример» (refreshTrainerIn).

   Подключается обычным <script> ДО boards-core.js (и до скрипта works.html
   / work.html): объявления верхнего уровня видны следующим скриптам под
   теми же именами, поэтому код досок, который их зовёт, не менялся.
   Поэтому же здесь нельзя заводить имя, которое уже объявлено в
   boards-core.js через const/let, — второе объявление уронит доски
   SyntaxError'ом. Свои помощники — с приставкой tt (ttUid,
   ttRoundRectPath, TT_UI_FONT): одноимённые функции досок остаются там.
   ========================================================== */

function ttUid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function ttRoundRectPath(c, x, y, w, h, rad){
  const r = Math.min(rad, w/2, h/2);
  c.beginPath();
  c.moveTo(x+r, y);
  c.arcTo(x+w, y, x+w, y+h, r);
  c.arcTo(x+w, y+h, x, y+h, r);
  c.arcTo(x, y+h, x, y, r);
  c.arcTo(x, y, x+w, y, r);
  c.closePath();
}
// шрифт подписей, дорисованных прямо в картинку задания (bakeTaskRows):
// тот же, что у страницы, которая снимает, — у досок и работ он задан в --font-ui
const TT_UI_FONT = getComputedStyle(document.documentElement).getPropertyValue('--font-ui').trim() || 'system-ui, -apple-system, "Segoe UI", sans-serif';

// какой(ие) DOM-узел(ы) внутри тренажёра считать «текущим заданием» — карта
// собрана по уже существующим кнопкам «В подборку» в каждом тренажёре (см.
// Basket.extractFromSelectorsRich в их коде), без единого изменения в их
// файлах. gateBtn — id кнопки, которая видна только когда соответствующий
// вариант сейчас актуален (необязательная теория — №1–5; до промпта №80 так
// же различались три вида заданий ОГЭ №9); без
// gateBtn запись берётся всегда. selAll вместо sel — узлов может быть
// несколько сразу (доп. добавленные задания на ОГЭ №8), берём все на странице.
const TRAINER_CAPTURE = {
  oge1_5:    [ { sel:'#questionPanel' }, { sel:'#theoryContent', gateBtn:'theoryBasketAddBtn', unhide:true } ],
  oge6:      [ { sel:'#questionPanel' } ],
  oge7:      [ { sel:'#questionPanel' } ],
  oge8:      [ { sel:'#questionPanel' }, { selAll:'.added-task-card .added-card-question' } ],
  // Промпт №80: №9 — прототипы, как №6; движков уравнений на странице больше нет
  oge9:      [ { sel:'#questionPanel' } ],
  oge10:     [ { sel:'#questionPanel' } ],
  oge11:     [ { sel:'#questionPanel' } ],
  // Промпт №54: у ОГЭ №12 и «Степеней» те же добавленные карточки, что у №8
  // (это его копии), — раньше с них снималось только первое задание
  oge12:     [ { sel:'#questionPanel' }, { selAll:'.added-task-card .added-card-question' } ],
  oge13:     [ { sel:'#questionPanel' } ],
  oge14:     [ { sel:'#questionPanel' } ],
  oge15_18:  [ { sel:'#questionPanel' } ],
  oge19:     [ { sel:'#questionPanel' } ],
  // Столбики снимаются не с живого #board, а с чистой записи, которую
  // собирает columnCaptureNode: на странице до «Начать» пример стоит в
  // строку («87 + 6 = ?»), во время решения на листе подсветка и уже
  // вписанные цифры, а у деления раньше снимался вопрос шага («Сколько
  // первых цифр…»), а не сам уголок
  add_col:   [ { column:'add' } ],
  sub_col:   [ { column:'sub' } ],
  mul_col:   [ { column:'mul' } ],
  div_col:   [ { column:'div' } ],
  linear:    [ { sel:'#live' } ],
  quadratic: [ { sel:'#eqLine' } ],
  frac_mul:  [ { sel:'#board' } ],
  frac_div:  [ { sel:'#board' } ],
  // Промпт №65: у НОД условие лежит отдельно от листа с решением
  gcd:       [ { sel:'#taskLine' } ],
  // Промпт №74: у НОК так же, как у НОД
  lcm:       [ { sel:'#taskLine' } ],
  // Промпт №71: «Проценты» — условие отдельно от полей ответа, как у ЕГЭ;
  // у добавленных «+» карточек — .added-card-question
  percent:   [ { sel:'#pctQuestion' }, { selAll:'.added-task-card .added-card-question' } ],
  // Промпт №12 нового списка: «Свойства логарифмов» — как «Проценты»
  logarithms:[ { sel:'#logQuestion' }, { selAll:'.added-task-card .added-card-question' } ],
  // Промпт №13 нового списка: «Тригонометрические уравнения» — как логарифмы
  trig_equations:[ { sel:'#trigQuestion' }, { selAll:'.added-task-card .added-card-question' } ],
  powers:    [ { sel:'#questionPanel' }, { selAll:'.added-task-card .added-card-question' } ],
};
// Промпт №55: ЕГЭ профиль — одна страница на все 20 позиций (ege_prof.html?n=…),
// поэтому у всех её записей один и тот же узел задания, и ставим их циклом.
// #egeQuestion — только условие, без полей ответа и кнопок; у добавленных
// кнопкой «+» карточек ту же роль играет .added-card-question (Промпт №56).
for (let n = 1; n <= 20; n++) {
  TRAINER_CAPTURE['ege' + n] = [ { sel:'#egeQuestion' }, { selAll:'.added-task-card .added-card-question' } ];
}
// Промпт №57: ЕГЭ база — та же страница (ege_base.html), 21 позиция, id egeb…
for (let n = 1; n <= 21; n++) {
  TRAINER_CAPTURE['egeb' + n] = [ { sel:'#egeQuestion' }, { selAll:'.added-task-card .added-card-question' } ];
}
// Промпт №61: ОГЭ, часть 2 — та же страница (oge_part2.html), номера 20–25, id oge20…
for (let n = 20; n <= 25; n++) {
  TRAINER_CAPTURE['oge' + n] = [ { sel:'#egeQuestion' }, { selAll:'.added-task-card .added-card-question' } ];
}

/* Каталог тренажёров для панелей — из subjects-catalog.js (общий с главной).
   TRAINERS_PANEL_GROUPS — все разделы всех предметов подряд, у раздела есть
   subject: поиск id и адреса кадра (ttPanelItemForLocation, «Работы») идёт
   по всем предметам сразу, а список на экране показывает один предмет —
   выбранный в переключателе (ttPanelView). Без каталога на странице панель
   пуста, но остальной модуль (снимки, проверка ответа) работает */
const TT_CATALOG = window.MathhCatalog || null;
if (!TT_CATALOG) console.error('trainer-tasks.js: не подключён subjects-catalog.js — список тренажёров пуст');
const TRAINERS_PANEL_GROUPS = TT_CATALOG ? TT_CATALOG.panelGroups() : [];
// прежние имена списков — их читает boards-core.js (подписи «Подборки»)
const EGE_PROF_PANEL = TT_CATALOG ? TT_CATALOG.titles.egeProf : [];
const EGE_BASE_PANEL = TT_CATALOG ? TT_CATALOG.titles.egeBase : [];
const OGE_PART2_PANEL = TT_CATALOG ? TT_CATALOG.titles.ogePart2 : {};

/* Страницы-копии ege_prof.html (ЕГЭ, ОГЭ ч. 2, обществознание, английский)
   снимаются одинаково — условие #egeQuestion и карточки «+»; русский
   (скелет rus_oge.html) — вся панель задания без кнопок и отзыва: поле ответа
   и варианты остаются, на доске по ним пишут ручкой. Явная запись в
   TRAINER_CAPTURE выше важнее каталога */
const TT_RUS_STRIP = '.check-btn, #feedback, #answerBox, #solRow, .sol-row, #nextBtn, .next-btn';
if (TT_CATALOG) Object.keys(TT_CATALOG.trainers).forEach(id => {
  if (TRAINER_CAPTURE[id]) return;
  const cap = TT_CATALOG.trainers[id].cap;
  if (cap === 'ege') TRAINER_CAPTURE[id] = [ { sel:'#egeQuestion' }, { selAll:'.added-task-card .added-card-question' } ];
  else if (cap === 'rus') TRAINER_CAPTURE[id] = [ { sel:'#questionPanel', strip: TT_RUS_STRIP } ];
});

/* ── переключатель предмета в панели ──
   Выбор помнится отдельно от главной (ttPanel:subject): на доске учитель
   ведёт урок одного предмета, а главную мог оставить на другом. Пока выбора
   не было — берём предмет главной (ogeNav:subject), это обычно тот же урок */
const TT_SUBJECT_KEY = 'ttPanel:subject';
function ttPanelSubjects(){
  if (!TT_CATALOG) return [];
  // предмет без единого раздела в панели не показываем — нечего выбирать
  return TT_CATALOG.subjects.filter(s => TRAINERS_PANEL_GROUPS.some(g => g.subject === s.id));
}
function ttPanelSubject(){
  const subs = ttPanelSubjects();
  let id = null;
  try { id = localStorage.getItem(TT_SUBJECT_KEY) || localStorage.getItem('ogeNav:subject'); } catch (e) {}
  return subs.some(s => s.id === id) ? id : (subs[0] ? subs[0].id : 'math');
}
function ttSetPanelSubject(id){
  try { localStorage.setItem(TT_SUBJECT_KEY, id); } catch (e) {}
}
/* что показать в списке: без поиска — разделы выбранного предмета; с
   поиском — по всем предметам (учитель не обязан помнить, где что лежит),
   и тогда к заголовку раздела приписан предмет: «ОГЭ» без него не различить */
function ttPanelView(filterText){
  const q = (filterText || '').trim().toLowerCase();
  const cur = ttPanelSubject();
  const title = id => { const s = TT_CATALOG && TT_CATALOG.subjects.find(x => x.id === id); return s ? s.title : ''; };
  return TRAINERS_PANEL_GROUPS
    .filter(g => q || g.subject === cur)
    .map(g => ({ subject: g.subject, title: q ? title(g.subject) + ' · ' + g.title : g.title,
      items: g.items.filter(it => !q || it.name.toLowerCase().includes(q)) }))
    .filter(g => g.items.length);
}
// ряд кнопок предметов; цвет — акцент предмета, как на главной
function ttSubjectTabsHtml(){
  const subs = ttPanelSubjects();
  if (subs.length < 2) return '';
  ttEnsureSubjectCss();
  const cur = ttPanelSubject();
  const e = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  return '<div class="tt-subj-row" role="group" aria-label="Предмет">' + subs.map(s =>
    '<button type="button" class="tt-subj' + (s.id === cur ? ' on' : '') + '" data-subj="' + e(s.id) +
    '" aria-pressed="' + (s.id === cur) + '" style="--tt-s:' + e(s.color) + '">' + e(s.title) + '</button>').join('') + '</div>';
}
// щелчок по предмету: запомнить и перерисовать список тем же кодом
function ttBindSubjectTabs(container, rerender){
  container.querySelectorAll('.tt-subj').forEach(b => b.addEventListener('click', () => {
    ttSetPanelSubject(b.dataset.subj);
    rerender();
  }));
}
// стили кнопок предметов — здесь, а не в trainers-list.css: «Работы» этот
// файл не подключают, а переключатель у всех трёх списков должен быть одним
function ttEnsureSubjectCss(){
  if (document.getElementById('ttSubjCss')) return;
  const st = document.createElement('style');
  st.id = 'ttSubjCss';
  st.textContent = '.tt-subj-row{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}'
    + '.tt-subj{appearance:none;border:1px solid rgba(128,128,128,.35);background:transparent;color:inherit;'
    + 'border-radius:999px;padding:6px 12px;font:inherit;font-size:13px;line-height:1.2;cursor:pointer}'
    + '.tt-subj:hover{border-color:var(--tt-s)}'
    + '.tt-subj.on{background:var(--tt-s);border-color:var(--tt-s);color:#fff}'
    + '.tt-subj:focus-visible{outline:2px solid var(--tt-s);outline-offset:2px}';
  document.head.appendChild(st);
}


// снимок одного DOM-узла тренажёра в PNG (data:) — вёрстка внутри iframe
// рендерится по-настоящему (шрифты, KaTeX, таблицы), а не просто копируется
// как текст, поэтому нужен html2canvas, а не Basket (тот отдаёт HTML/текст
// для живого повторного показа, не растровую картинку)
// Промпт №66: если у задания известен ответ (task — см. trainerTaskInfo),
// снимок делается с «чистого» клона (без введённого ответа, подсветки и
// разбора) и в том же клоне замеряются поле ответа, варианты и кнопка
// «Проверить» — поверх этих мест на доске лягут живые элементы. Замер именно
// в клоне, а не на живой странице: чистка клона меняет вёрстку (прячется
// разбор), и координаты с живой страницы съехали бы. Возвращает
// { dataUrl, hot } — hot === null, если задание не интерактивное.
/* ── Промпт №70: задание на доске — чистая карточка ──
   Раньше снимок заливался цветом страницы тренажёра (backgroundColor у
   html2canvas) прямоугольником по рамке узла, и на доске было видно всё
   лишнее: углы за скруглением — квадратики цвета страницы, обрезанная по
   краю снимка тень панели, «стекло» панели (полупрозрачный фон с
   backdrop-filter, которого html2canvas не умеет) — серой подложкой, а
   внутренняя тень (inset) панели — ещё одним прямоугольником внутри.
   Теперь:
   - снимок идёт на прозрачном фоне, у корня клона сняты тень, размытие и
     отступы, у потомков — внутренние тени (html2canvas рисует их неверно);
   - карточка собирается сама: скруглённый прямоугольник цвета карточки
     тренажёра (её полупрозрачный фон, сведённый с фоном страницы в
     непрозрачный — так он и выглядит на экране), поверх — снимок, и всё,
     что за скруглением, вырезается до полной прозрачности;
   - если снимаемый узел сам не карточка (у ЕГЭ — одно условие, у столбиков —
     сам пример), цвет и скругление берутся у ближайшего предка-карточки, а
     вокруг содержимого — поле, как внутри карточки;
   - скругление запоминается в объекте (obj.card), и доска на каждом кадре
     обрезает картинку ВЕКТОРНЫМ контуром (renderImageObject) — край ровный
     при любом масштабе, а не растянутые пиксели снимка. */
function parseCssColor(css){
  const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)/.exec(css || '');
  if (!m) return null;
  let a = m[4] == null ? 1 : parseFloat(m[4]);
  if (m[4] && m[4].indexOf('%') > 0) a /= 100;
  return { r: +m[1], g: +m[2], b: +m[3], a };
}
// цвет fg поверх непрозрачного bg — один непрозрачный цвет
function flattenColor(fg, bg){
  const f = parseCssColor(fg), b = parseCssColor(bg) || { r: 255, g: 255, b: 255, a: 1 };
  if (!f) return 'rgb(' + b.r + ',' + b.g + ',' + b.b + ')';
  const mix = k => Math.round(f[k] * f.a + b[k] * (1 - f.a));
  return 'rgb(' + mix('r') + ',' + mix('g') + ',' + mix('b') + ')';
}
function trainerPageBg(doc){
  const win = doc.defaultView;
  const cands = [doc.body, doc.documentElement];
  for (const e of cands){
    const c = parseCssColor(win.getComputedStyle(e).backgroundColor);
    if (c && c.a > 0) return flattenColor(win.getComputedStyle(e).backgroundColor, '#ffffff');
  }
  return '#ffffff';
}
// какой карточкой выглядит задание: сам узел или ближайший предок с фоном и
// скруглением (панель тренажёра)
const CARD_PAD = 18;   // поле вокруг содержимого, если узел сам не карточка
function trainerCardStyle(el, pageBg){
  const win = el.ownerDocument.defaultView;
  for (let e = el; e && e !== e.ownerDocument.body; e = e.parentElement){
    const cs = win.getComputedStyle(e);
    const c = parseCssColor(cs.backgroundColor);
    const r = parseFloat(cs.borderTopLeftRadius) || 0;
    if (c && c.a > 0.02 && r > 0){
      return { own: e === el, color: flattenColor(cs.backgroundColor, pageBg), radius: r,
               pad: e === el ? 0 : CARD_PAD };
    }
  }
  // карточки вокруг нет — белая «стеклянная» панель, как у всех тренажёров
  const dark = isDarkColor(pageBg);
  return { own: false, color: flattenColor(dark ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.6)', pageBg), radius: 18, pad: CARD_PAD };
}
// чистка клона перед снимком — только то, что html2canvas рисует не так,
// как браузер; вёрстку (размеры, отступы внутри) не трогаем
function cleanCloneForCard(c, card){
  c.style.setProperty('box-shadow', 'none', 'important');
  c.style.setProperty('backdrop-filter', 'none', 'important');
  c.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
  c.style.setProperty('margin', '0', 'important');
  c.style.setProperty('transform', 'none', 'important');
  c.style.setProperty('animation', 'none', 'important');
  if (card.own) c.style.setProperty('background-color', card.color, 'important');
  else c.style.setProperty('background', 'transparent', 'important');
  const win = c.ownerDocument.defaultView;
  c.querySelectorAll('*').forEach(e => {
    const sh = win.getComputedStyle(e).boxShadow;
    if (sh && sh !== 'none' && sh.indexOf('inset') >= 0) e.style.setProperty('box-shadow', 'none', 'important');
  });
}
// содержимое на прозрачном фоне → карточка: скруглённый прямоугольник цвета
// карточки, содержимое с полем pad, всё за скруглением — прозрачное
function wrapIntoCard(content, card, scale, cssW, cssH){
  const pad = card.pad;
  const W = cssW + pad * 2, H = cssH + pad * 2;
  const out = document.createElement('canvas');
  out.width = Math.round(W * scale); out.height = Math.round(H * scale);
  const c = out.getContext('2d');
  const R = Math.min(card.radius, W / 2, H / 2) * scale;
  ttRoundRectPath(c, 0, 0, out.width, out.height, R);
  c.fillStyle = card.color; c.fill();
  c.drawImage(content, Math.round(pad * scale), Math.round(pad * scale));
  // вырезаем углы: всё, что вне контура, — полностью прозрачное
  c.globalCompositeOperation = 'destination-in';
  ttRoundRectPath(c, 0, 0, out.width, out.height, R);
  c.fillStyle = '#000'; c.fill();
  c.globalCompositeOperation = 'source-over';
  return { canvas: out, W, H, R: R / scale };
}

// сколько пикселей картинки на CSS-пиксель задания: не меньше двух — задание
// на доске часто смотрят крупнее, чем в тренажёре, и с одним пикселем текст
// сразу мылится. Вкладка-панель берёт число у доски (opts.scale), а не у
// своего экрана: иначе задание с телефона (плотность 3) весило бы вдвое
// больше такого же со встроенной панели
function ttCaptureScale(){ return Math.max(2, Math.min(3, window.devicePixelRatio || 1)); }

/* Холст и вариативный шрифт (промпт «сопряжение панели», после этапа 3).
   Onest на сайте — вариативный: один файл на все веса (onest.css).
   html2canvas рисует текст на холсте страницы, где он запущен (доски или
   вкладки-панели), а Safari на iPhone на холсте вес вариативного шрифта не
   применяет: полужирный текст задания ложился обычным 400 — тусклым и
   тонким, в отличие от того же задания со встроенной панели. Формулы KaTeX
   и моноширинные варианты ответа не страдали: у них обычные файлы по весам.
   Проверка на месте: рисуем строку весом 400 и 800 и сравниваем, сколько
   «краски» ушло. Различает — ничего не трогаем (Chrome, Firefox). Не
   различает — подключаем onest-static.css (Onest отдельными файлами по
   весам) и отключаем вариативный onest.css на этой странице: тогда и холст
   берёт нужный вес. Страницы тренажёров в кадре это не затрагивает: вёрстку
   html2canvas считает по ним, а рисует шрифтами страницы, где запущен. */
let ttFontFixP = null;
function ttCanvasInk(c, weight){
  c.clearRect(0, 0, 240, 60);
  c.font = weight + ' 36px Onest';
  c.fillStyle = '#000';
  c.textBaseline = 'top';
  c.fillText('ШЖМшжм', 4, 8);
  const d = c.getImageData(0, 0, 240, 60).data;
  let ink = 0;
  for (let i = 3; i < d.length; i += 4) ink += d[i];
  return ink;
}
// Onest на этой странице — из отдельных файлов по весам (onest-static.css)
async function ttUseStaticOnest(){
  if (!document.getElementById('ttOnestStatic')){
    await new Promise((resolve) => {
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = 'onest-static.css'; l.id = 'ttOnestStatic';
      l.onload = l.onerror = resolve;
      document.head.appendChild(l);
    });
  }
  document.querySelectorAll('link[rel="stylesheet"][href$="onest.css"]').forEach(l => { l.disabled = true; });
  const sample = 'Аа Aa 0123 ≥−∞';
  await Promise.all([400, 500, 600, 700].map(w => document.fonts.load(w + ' 16px Onest', sample)));
}
function ttCanvasFontFix(){
  if (ttFontFixP) return ttFontFixP;
  ttFontFixP = (async () => {
    try {
      if (!document.fonts || !document.fonts.load) return 'no-fonts-api';
      // без загруженного Onest проверка мерила бы запасной шрифт
      await Promise.all([document.fonts.load('400 36px Onest', 'ШЖМшжм'), document.fonts.load('800 36px Onest', 'ШЖМшжм')]);
      if (!document.fonts.check('400 36px Onest', 'ШЖМ')) return 'no-onest';
      const cv = document.createElement('canvas');
      cv.width = 240; cv.height = 60;
      const c = cv.getContext('2d', { willReadFrequently: true });
      const thin = ttCanvasInk(c, 400), bold = ttCanvasInk(c, 800);
      // у Onest 800 «краски» заметно больше, чем у 400 (в Chrome — в полтора
      // раза); почти поровну — холст вес не применяет
      if (!thin || bold > thin * 1.15) return 'ok';
      await ttUseStaticOnest();
      return 'static';
    } catch (e) {
      console.warn('[снимок] проверка шрифта холста не удалась', e);
      return 'error';
    }
  })();
  return ttFontFixP;
}

/* Шрифты кадра — странице, которая снимает. html2canvas рисует текст на
   холсте страницы, где запущен (доски или вкладки-панели), а не кадра
   тренажёра: шрифт, которого на этой странице нет, холст заменяет
   запасным. На доске стили формул KaTeX подключены, а на вкладке-панели
   их не было — и формулы с телефона ложились на доску запасным шрифтом:
   «x» опущен, дробь срезана, промежутки неровные (ОГЭ ч. 2 №20). Поэтому
   перед снимком: описания шрифтов (@font-face) кадра, которых здесь нет, —
   сюда, и загрузить ровно те начертания, что есть в задании (холст сам
   шрифт не грузит, он берёт только уже загруженное). Onest не трогаем —
   его эта страница держит сама (ttCanvasFontFix) */
const ttFontRulesSeen = new Set();
async function ttSyncFrameFonts(el){
  const doc = el.ownerDocument;
  if (!doc || doc === document || !document.fonts) return;
  try {
    const have = new Set();
    document.fonts.forEach(f => have.add(String(f.family).replace(/['"]/g, '').trim().toLowerCase()));
    let css = '';
    Array.from(doc.styleSheets).forEach(sh => {
      let rules = null;
      try { rules = sh.cssRules; } catch (e) { return; }
      const base = sh.href || doc.baseURI;
      Array.from(rules || []).forEach(r => {
        if (r.type !== 5) return;   // CSSRule.FONT_FACE_RULE
        const fam = String(r.style.getPropertyValue('font-family')).replace(/['"]/g, '').trim().toLowerCase();
        if (!fam || fam === 'onest' || have.has(fam)) return;
        // относительный адрес файла шрифта — от стиля кадра, не этой страницы
        const t = r.cssText.replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, u) =>
          /^(data:|blob:|https?:)/.test(u) ? m : 'url("' + new URL(u, base).href + '")');
        if (ttFontRulesSeen.has(t)) return;
        ttFontRulesSeen.add(t);
        css += t + '\n';
      });
    });
    if (css){
      const st = document.createElement('style');
      st.className = 'tt-frame-fonts';
      st.textContent = css;
      document.head.appendChild(st);
    }
    // начертания, которые есть в задании, — загрузить до снимка
    const want = new Map();
    const win = doc.defaultView;
    const nodes = [el].concat(Array.from(el.querySelectorAll('*')).slice(0, 3000));
    nodes.forEach(e => {
      const cs = win.getComputedStyle(e);
      const key = cs.fontStyle + ' ' + cs.fontWeight + ' 16px ' + cs.fontFamily;
      if (!want.has(key)) want.set(key, '');
      const tx = (e.textContent || '').trim();
      if (tx && want.get(key).length < 60) want.set(key, (want.get(key) + tx).slice(0, 60));
    });
    await Promise.all(Array.from(want).map(([font, text]) => document.fonts.load(font, text || 'a').catch(() => {})));
  } catch (e) {
    console.warn('[снимок] не удалось подготовить шрифты кадра', e);
  }
}

// opts.answer — где строка ответа, если её дорисовывать: 'below' (под
// снимком) или 'right'; без него — как просит узел (data-bd-answer у
// столбиков), иначе под снимком.
// opts.html — содержимое узла, которое подставить в клон вместо того, что
// сейчас на странице (перестройка задания под новую ширину, промпт №70);
// opts.width — ширина узла в CSS-пикселях: текст и формулы переносятся по ней
async function captureTrainerNode(el, task, opts){
  // html2canvas догружается в фоне (lazy-libs.js); попросили раньше — ждём.
  // Ждём в самом начале, до того как что-то мерить на странице
  if (typeof html2canvas !== 'function' && window.MathhLibs) {
    try { await window.MathhLibs.load('html2canvas'); } catch (e) {}
  }
  if (typeof html2canvas !== 'function') throw new Error('html2canvas not loaded');
  await ttCanvasFontFix();
  await ttSyncFrameFonts(el);
  opts = opts || {};
  const doc = el.ownerDocument;
  const answerSide = opts.answer || el.getAttribute('data-bd-answer');
  const pageBg = trainerPageBg(doc);
  const card = trainerCardStyle(el, pageBg);
  const scale = opts.scale > 0 ? opts.scale : ttCaptureScale();
  let hot = null;
  const mark = 'c' + ttUid();
  el.setAttribute('data-bd-cap', mark);
  // html2canvas старается разобрать все стили страницы, в том числе внешние
  // (шрифты с Google Fonts и т.п.) — если у ученика/учителя в этот момент
  // плохая сеть, разбор может надолго зависнуть; ограничиваем снимок по
  // времени, чтобы кнопка не осталась «залипшей», а показывалась понятная
  // ошибка и можно было попробовать ещё раз
  const vw = doc.defaultView ? doc.defaultView.innerWidth : 0;
  const h2cOpts = {
    backgroundColor: null,   // прозрачный фон — карточку собираем сами (wrapIntoCard)
    scale,
    useCORS: true,
    onclone: (cloneDoc) => {
      // копия страницы для снимка — без автоукрупнения текста браузерами
      // iPhone (см. bdNoTextInflate в trainer-capture.js): иначе строки
      // расставлены по одному размеру, а буквы нарисованы другим
      cloneDoc.documentElement.style.setProperty('-webkit-text-size-adjust', '100%', 'important');
      cloneDoc.documentElement.style.setProperty('text-size-adjust', '100%', 'important');
      const c = cloneDoc.querySelector('[data-bd-cap="' + mark + '"]');
      if (!c) return;
      // сам узел клона не подменяем — html2canvas рисует именно его, по
      // ссылке; меняем только содержимое и ширину
      if (opts.html != null) c.innerHTML = opts.html;
      if (opts.width){
        c.style.setProperty('width', opts.width + 'px', 'important');
        c.style.setProperty('max-width', 'none', 'important');
        c.style.setProperty('min-width', '0', 'important');
        c.style.setProperty('flex', 'none', 'important');
        // высота — по содержимому: у панелей тренажёров во время их плавной
        // анимации высоты (setupAutoHeightAnimation) стоит явная высота,
        // и после переноса строк карточка осталась бы прежней высоты
        c.style.setProperty('height', 'auto', 'important');
        c.style.setProperty('min-height', '0', 'important');
        c.style.setProperty('max-height', 'none', 'important');
      }
      cleanCloneForCard(c, card);
      hideDeadSolutionButtons(c);
      const strip = c.getAttribute('data-bd-strip');
      // «Проверить» с пометкой data-bd-check у задания с проверкой (task) остаётся
      // на снимке: поверх неё доска кладёт живую кнопку. Без проверки (русский с
      // ok: 0, теория) кнопка мёртвая — её прячем, как раньше
      if (strip) { try { c.querySelectorAll(strip).forEach(e => {
        if (task && e.hasAttribute('data-bd-check')) return;
        e.style.setProperty('display', 'none', 'important');
      }); } catch (e) {} }
      // столбик с ответом под записью — место для решения не нужно
      if (answerSide !== 'right') c.querySelectorAll('.bd-col-blank').forEach(e => e.remove());
      if (task) hot = prepareTaskClone(c, task);
    },
  };
  // узел шире окна кадра — окно клона раздвигаем, иначе правый край срежется
  if (opts.width && vw && opts.width > vw - 40) h2cOpts.windowWidth = Math.ceil(opts.width + 80);
  const canvasPromise = html2canvas(el, h2cOpts);
  const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('capture timeout')), 20000));
  let canvas;
  try { canvas = await Promise.race([canvasPromise, timeoutPromise]); }
  finally { el.removeAttribute('data-bd-cap'); }
  let cw = canvas.width / scale, ch = canvas.height / scale;
  if (task && hot) {
    // html2canvas берёт размер холста не всегда по той же рамке, что
    // getBoundingClientRect в клоне (у столбиков холст уже рамки узла) —
    // доли пересчитываем к настоящему размеру снимка
    const kx = hot.w / cw, ky = hot.h / ch;
    if (Math.abs(kx - 1) > 0.01 || Math.abs(ky - 1) > 0.01) {
      const fix = r => r && ({ x: r.x * kx, y: r.y * ky, w: r.w * kx, h: r.h * ky });
      hot.fields = hot.fields.map(fix); hot.opts = hot.opts.map(fix); hot.check = fix(hot.check);
    }
    hot.w = cw; hot.h = ch;
  }
  let baked = false;
  if (task && hot) {
    // чего на снимке не нашлось (у ЕГЭ снимается одно условие, у столбиков —
    // сам пример), то дорисовываем строкой ниже: подпись, поле, кнопка
    const b = bakeTaskRows(canvas, task, hot, card.color, scale, answerSide);
    if (b) { canvas = b.canvas; hot = b.hot; cw = hot.w; ch = hot.h; baked = true; }
  }
  // «Тренировка»: ряд с кнопкой «Показать решение и ответ» — в самом низу
  // карточки, поверх него доска кладёт живую кнопку (solHot — доли карточки)
  let solHot = null;
  if (opts.solRow) {
    // узел сам карточка (ОГЭ №8: #questionPanel) — у него свои внутренние
    // отступы, ряд встаёт по левому краю содержимого, а снизу — тот же отступ
    let inset = null;
    if (card.own) {
      const ecs = getComputedStyle(el);
      inset = { l: parseFloat(ecs.paddingLeft) || 0, b: parseFloat(ecs.paddingBottom) || 0 };
    }
    const s = bakeSolutionRow(canvas, cw, ch, card.color, scale, inset);
    if (task && hot) {
      const ky = ch / s.h;
      const fix = r => r && ({ x: r.x, y: r.y * ky, w: r.w, h: r.h * ky });
      hot.fields = hot.fields.map(fix); hot.opts = hot.opts.map(fix); hot.check = fix(hot.check);
      hot.h = s.h;
    }
    canvas = s.canvas; ch = s.h;
    solHot = { x: s.btn.x / cw, y: s.btn.y / ch, w: s.btn.w / cw, h: s.btn.h / ch };
  }
  const wrapped = wrapIntoCard(canvas, card, scale, cw, ch);
  canvas = wrapped.canvas;
  if (task && hot && card.pad) {
    // доли — от размера карточки с полем, а не от голого снимка
    const p = card.pad, W = wrapped.W, H = wrapped.H;
    const fix = r => r && ({ x: (r.x * cw + p) / W, y: (r.y * ch + p) / H, w: r.w * cw / W, h: r.h * ch / H });
    hot.fields = hot.fields.map(fix); hot.opts = hot.opts.map(fix); hot.check = fix(hot.check);
    hot.w = W; hot.h = H;
  }
  if (solHot && card.pad) {
    const p = card.pad, W = wrapped.W, H = wrapped.H;
    solHot = { x: (solHot.x * cw + p) / W, y: (solHot.y * ch + p) / H, w: solHot.w * cw / W, h: solHot.h * ch / H };
  }
  if (task && hot && !baked && hot.fields.length && hot.style) {
    // фон поля в тренажёре полупрозрачный (стекло поверх панели) — живое
    // поле с тем же rgba просвечивало бы нарисованный под ним «?». Берём
    // готовый цвет пикселя с собранной карточки у левого края поля
    try {
      const f = hot.fields[0];
      const px = canvas.getContext('2d').getImageData(
        Math.round((f.x * hot.w + 6) * scale), Math.round((f.y + f.h / 2) * hot.h * scale), 1, 1).data;
      hot.style.inBg = 'rgb(' + px[0] + ',' + px[1] + ',' + px[2] + ')';
    } catch (e) {}
  }
  return {
    dataUrl: canvas.toDataURL('image/png'),
    hot: (task && hot && hotIsUsable(task, hot)) ? hot : null,
    // скругление — долей ширины: картинка на доске масштабируется целиком
    card: { r: +(wrapped.R / wrapped.W).toFixed(5) },
    // размер карточки в CSS-пикселях тренажёра, поле вокруг содержимого и
    // цвет карточки — для изменения размера на доске (промпт №70)
    css: { w: wrapped.W, h: wrapped.H, pad: card.pad, bg: card.color },
    solHot,
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   «ПОКАЗАТЬ РЕШЕНИЕ И ОТВЕТ» У ЗАДАНИЙ «ТРЕНИРОВКИ» НА ДОСКЕ.
   В «Тренировке» тренажёр рисует под заданием кнопку «Показать решение и
   ответ», и она попадала на снимок — на доске это была просто картинка
   кнопки. Теперь при добавлении задания разбор снимается отдельной
   картинкой (obj.sol), а на карточке внизу — ряд с кнопкой, поверх которого
   доска кладёт живую кнопку: по ней разбор раскрывается под заданием.

   Разбор берётся из того же тренажёра и тем же кодом, что рисует его там:
   у ЕГЭ, ОГЭ ч. 2, «Процентов», логарифмов и тригонометрии — их функцией
   solutionHTML (через eval окна кадра, как ответ в egeTaskInfo), у ОГЭ —
   из curTask.explain, как это делает revealSolution каждого тренажёра.
   Нажимать кнопку в самом тренажёре нельзя: в совместной сессии раскрытый
   разбор общий, и ученик на миг увидел бы ответ. Поэтому разметка разбора
   собирается в невидимом узле за краем страницы кадра, снимается и
   убирается — состояние тренажёра не меняется вовсе.
   ═══════════════════════════════════════════════════════════════════════ */

// кнопки разбора на снимке не нужны: живую кнопку доска ставит в свой ряд,
// а нарисованная тренажёрная нажималась бы впустую. Ряд кнопок карточки (⟳,
// «В подборку», разбор) на доске тоже мёртвый — прячем, если в нём нет поля
// ответа или «Проверить»
function hideDeadSolutionButtons(c){
  c.querySelectorAll('#showSolutionBtn, .added-solution-btn, #solBtnRow').forEach(e => { e.style.setProperty('display', 'none', 'important'); });
  c.querySelectorAll('.card-btn-row').forEach(row => {
    if (!row.querySelector('input, .check-btn, .mcq-btn')) row.style.setProperty('display', 'none', 'important');
  });
}

// разбор текущего задания → { cls, html } или null (не «Тренировка», нет
// разбора, теория). force — не смотреть на режим: «ещё такое же» к заданию,
// у которого разбор уже есть, делается в невидимом кадре, а режим там свой
function trainerSolutionHTML(win, trainerId, el, force){
  if (!win || !el || !trainerId || el.id === 'theoryContent') return null;
  try {
    const card = el.closest ? el.closest('.added-task-card[data-idx]') : null;
    const cardIdx = card ? Number(card.dataset.idx) : -1;
    if (isEgeLikeTrainer(trainerId) || typeof win.__boardTaskInfo === 'function') {
      if (!force && trainerEval(win, 'S.mode') !== 'practice') return null;
      if (typeof win.solutionHTML !== 'function') return null;
      const t = isEgeLikeTrainer(trainerId)
        ? trainerEval(win, cardIdx >= 0 ? 'protoById(S.n, S.cards[' + cardIdx + '].pid)' : 'protoById(S.n, S.pid)')
        : trainerEval(win, cardIdx >= 0 ? '(S.cards[' + cardIdx + '] || {}).task' : 'S.task');
      if (!t) return null;
      const html = win.solutionHTML(t);
      return html ? { cls: '', html } : null;
    }
    const st = typeof win.tsGetState === 'function' ? win.tsGetState() : null;
    if (!st || (!force && st.curSubMode !== 'practice')) return null;
    const t = cardIdx >= 0 ? ((st.addedTasks || [])[cardIdx] || {}).task : st.curTask;
    if (!t) return null;
    // ОГЭ №6, №7, №9, №11, №13–19: у тренажёра своя solutionHTML() без
    // аргументов — разбор основного задания ровно как по его кнопке (с
    // ответом «как в бланке», если в explain ответа нет; у №19 explain у
    // каждого утверждения свой, а не у задания)
    if (cardIdx < 0 && typeof win.solutionHTML === 'function' && win.solutionHTML.length === 0) {
      const own = win.solutionHTML();
      if (own) return { cls: 'explain', html: own };
    }
    if (!t.explain) return null;
    // остальные (№8, №12, «Степени», №10, №1–5, карточки «+») показывают
    // в разборе explain; у вариантов дописываем номер верного, как №7
    let html = '<b>Решение:</b> ' + t.explain;
    if (!/Ответ/.test(t.explain) && Array.isArray(t.options) && typeof t.correctIndex === 'number' && t.options[t.correctIndex] != null)
      html += '<div class="answer-line" style="margin-top:10px"><b>Ответ:</b> ' + (t.correctIndex + 1) + ') ' + t.options[t.correctIndex] + '</div>';
    return { cls: 'explain', html };
  } catch (e) {
    console.warn('[доска] не удалось прочитать разбор задания', e);
    return null;
  }
}

// снять разбор картинкой-карточкой той же ширины, что задание (el — узел
// задания в кадре: его документ, стили, тема)
async function captureSolutionImage(el, sol, width, scale){
  const doc = el.ownerDocument;
  const w = Math.round(width || el.getBoundingClientRect().width || 600);
  const host = doc.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  // за левым краем страницы: на экране его не видно, а вёрстка настоящая —
  // html2canvas нужна именно она (display:none дал бы пустой снимок)
  host.style.cssText = 'position:absolute;left:-30000px;top:0;width:' + w + 'px;pointer-events:none;';
  const panel = doc.createElement('div');
  panel.className = 'panel';
  panel.style.cssText = 'display:block;margin:0;width:' + w + 'px;box-sizing:border-box;';
  const inner = doc.createElement('div');
  if (sol.cls) inner.className = sol.cls;
  // у .explain в тренажёрах бывает верхняя черта-отбивка от задания — в
  // отдельной карточке разбора она лишняя
  inner.style.cssText = 'display:block;margin-top:0;padding-top:0;border-top:0;';
  inner.innerHTML = sol.html;
  panel.appendChild(inner);
  host.appendChild(panel);
  doc.body.appendChild(host);
  try {
    flattenModernColors(panel);
    const shot = await captureTrainerNode(panel, null, { scale });
    return { src: shot.dataUrl, css: { w: shot.css.w, h: shot.css.h }, card: shot.card };
  } finally {
    host.remove();
  }
}

// html2canvas не понимает цвета вида color(srgb …) — так браузер отдаёт
// вычисленный color-mix() (метки свойств в шагах логарифмов и тригонометрии)
// — и падает на всём снимке. Узел разбора временный, поэтому такие цвета
// прямо в нём заменяем на rgba того же пикселя
const MODERN_COLOR_PROPS = ['color', 'background-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'];
let colorProbe = null;
function cssColorToRgba(css){
  if (!colorProbe){ colorProbe = document.createElement('canvas'); colorProbe.width = colorProbe.height = 1; }
  const c = colorProbe.getContext('2d', { willReadFrequently: true });
  c.clearRect(0, 0, 1, 1);
  c.fillStyle = '#000'; c.fillStyle = css;
  c.fillRect(0, 0, 1, 1);
  const d = c.getImageData(0, 0, 1, 1).data;
  return 'rgba(' + d[0] + ',' + d[1] + ',' + d[2] + ',' + (d[3] / 255).toFixed(3) + ')';
}
function flattenModernColors(root){
  const win = root.ownerDocument.defaultView;
  [root, ...root.querySelectorAll('*')].forEach(e => {
    const cs = win.getComputedStyle(e);
    MODERN_COLOR_PROPS.forEach(p => {
      const v = cs.getPropertyValue(p);
      if (v && /^(color|oklch|oklab|lab|lch)\(/.test(v)) e.style.setProperty(p, cssColorToRgba(v), 'important');
    });
  });
}

// ряд «Показать решение и ответ» под снимком (CSS-пиксели тренажёра)
const SOL_BTN_TEXT = 'Показать решение и ответ';
// inset — внутренние отступы узла-карточки: ряд по левому краю содержимого,
// под ним — тот же нижний отступ, что был у карточки
function bakeSolutionRow(canvas, W, H, bgColor, scale, inset){
  const dark = isDarkColor(bgColor);
  const ROW = 40, GAP = 12, FONT = 15;
  const L = inset ? Math.min(inset.l, W / 3) : 0, B = inset ? Math.min(inset.b, 40) : 0;
  const PAD = B || 4;
  const top = H - B;     // где кончается содержимое
  const meas = document.createElement('canvas').getContext('2d');
  meas.font = '600 ' + FONT + 'px ' + TT_UI_FONT;
  const bw = Math.min(W - L * 2, Math.ceil(meas.measureText(SOL_BTN_TEXT).width) + 36);
  const totalH = top + GAP + ROW + PAD;
  const out = document.createElement('canvas');
  out.width = canvas.width; out.height = Math.round(totalH * scale);
  const c = out.getContext('2d');
  // ниже снимка холст прозрачный — wrapIntoCard зальёт его цветом карточки
  c.drawImage(canvas, 0, 0);
  c.scale(scale, scale);
  const x = L, y = top + GAP;
  c.beginPath(); ttRoundRectPath(c, x, y, bw, ROW, 12);
  c.fillStyle = dark ? 'rgba(138,180,248,.16)' : 'rgba(46,125,224,.10)'; c.fill();
  c.fillStyle = dark ? '#8AB4F8' : '#1F5FB8';
  c.font = '600 ' + FONT + 'px ' + TT_UI_FONT;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(SOL_BTN_TEXT, x + bw / 2, y + ROW / 2, bw - 12);
  return { canvas: out, h: totalH, btn: { x, y, w: bw, h: ROW } };
}

// собрать список узлов текущего задания по TRAINER_CAPTURE — см. комментарий
// у самой карты выше про gateBtn/unhide/selAll
function collectTrainerCaptureNodes(doc, trainerId){
  const cfg = TRAINER_CAPTURE[trainerId];
  if (!cfg) return [];
  const out = [];
  cfg.forEach(entry => {
    if (entry.gateBtn){
      const btn = doc.getElementById(entry.gateBtn);
      if (!btn || btn.offsetParent === null) return; // этот вариант сейчас не активен на странице
    }
    if (entry.column){
      const node = columnCaptureNode(doc, entry.column);
      if (node) out.push(node);
      return;
    }
    if (entry.selAll){
      doc.querySelectorAll(entry.selAll).forEach(el => { if (el.offsetParent !== null) out.push({ el, restore:null }); });
      return;
    }
    const el = doc.querySelector(entry.sel);
    if (!el) return;
    // strip — что спрятать на снимке (кнопки, отзыв): прячем в копии
    // страницы, которую снимает html2canvas, а живую страницу не трогаем —
    // ученик в совместной сессии ничего не заметит. Селектор едет на самом
    // узле: captureTrainerNode получает только узел, не запись карты
    if (entry.strip) el.setAttribute('data-bd-strip', entry.strip);
    let restore = null;
    if (entry.unhide && getComputedStyle(el).display === 'none'){
      const prevDisplay = el.style.display;
      el.style.display = 'block';
      restore = () => { el.style.display = prevDisplay; };
    }
    if (el.offsetParent !== null || entry.unhide) out.push({ el, restore });
  });
  return out;
}

/* ── Столбики на доске: чистая запись примера и место под решение ──
   Учитель решает столбик на доске сам, ручкой, поэтому на карточке нужен
   пример в том виде, как его пишут в тетради, и пустые клетки под ним.
   Живой #board тренажёра для этого не годится: до «Начать» там пример в
   строку, во время решения — подсветка, перенос и уже вписанные цифры.
   Поэтому запись собирается заново из P тренажёра его же классами
   (.mrow/.mc/.mline у сложения, вычитания, умножения, .row/.c у деления) —
   цифры, шрифт и линии те же, что на странице, — во временном узле за
   левым краем страницы кадра (как разбор в captureSolutionImage), внутри
   такого же тетрадного листа .sheet: по нему снимок берёт цвет карточки.
   restore убирает узел. Строка ответа у такого узла встаёт справа от
   записи (data-bd-answer="right", bakeTaskRows): снизу — место для решения.
   Сам тренажёр и его состояние не трогаются вовсе — в совместной сессии
   ученик ничего не увидит. */
const COL_EXTRA_ROWS = { add: 2, sub: 2 };
function columnCaptureNode(doc, kind){
  const win = doc.defaultView;
  const P = trainerEval(win, 'P');
  if (!P || typeof P !== 'object') return null;
  let html = null;
  try { html = kind === 'div' ? divColumnHTML(P) : arithColumnHTML(P, kind); } catch (e) { html = null; }
  if (!html) return null;
  const host = doc.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:absolute;left:-30000px;top:0;pointer-events:none;';
  const sheet = doc.createElement('div');
  sheet.className = 'sheet';
  // лист нужен только ради цвета карточки и переменных темы: поля, высота
  // и прокрутка тренажёрного листа во временном узле ни к чему
  sheet.style.cssText = 'display:inline-block;min-height:0;overflow:visible;padding:0;';
  const el = doc.createElement('div');
  el.id = 'bdColumn';
  el.setAttribute('data-bd-answer', 'right');
  // у деления #board растянут на всю ширину листа (min-width:100%) — здесь
  // ширина по самой записи
  el.style.cssText = 'display:inline-block;position:relative;min-width:0;';
  el.innerHTML = html;
  sheet.appendChild(el);
  host.appendChild(sheet);
  doc.body.appendChild(host);
  return { el, restore: () => host.remove() };
}
// сложение, вычитание, умножение: числа по правому краю, знак слева от
// нижнего, черта, пустые строки под ответ (у умножения на многозначное —
// под каждое неполное произведение, вторая черта и строка суммы)
function arithColumnHTML(P, kind){
  let top, bot, resLen;
  if (kind === 'mul'){
    top = (P.top || String(P.topVal).split('')).map(String);
    bot = (P.bottom || String(P.bottomVal).split('')).map(String);
    resLen = String(P.topVal * P.bottomVal).length;
  } else {
    top = (P.topDigits || String(P.topVal).split('')).map(String);
    bot = (P.bottomDigits || String(P.bottomVal).split('')).map(String);
    // у тренажёра нижнее число дополнено нулями слева до длины верхнего —
    // в тетради их не пишут
    while (bot.length > 1 && bot[0] === '0') bot.shift();
    while (top.length > 1 && top[0] === '0') top.shift();
    resLen = String(kind === 'add' ? P.topVal + P.bottomVal : P.topVal - P.bottomVal).length;
  }
  if (!top.length || !bot.length) return null;
  const W = Math.max(top.length, bot.length + 1, resLen) + 1;
  const sign = kind === 'add' ? '+' : kind === 'sub' ? '−' : '×';
  const cell = ch => '<div class="mc">' + (ch == null ? '' : ch) + '</div>';
  const row = (digits, signAt) => {
    const cells = [];
    for (let i = 0; i < W; i++) cells.push(null);
    digits.forEach((d, i) => { cells[W - digits.length + i] = d; });
    return '<div class="mrow">' + cells.map((c, i) => i === signAt ? '<div class="mc sign">' + sign + '</div>' : cell(c)).join('') + '</div>';
  };
  // пустые строки под решение помечены: если ответ встаёт под запись (работы
  // для телефона), captureTrainerNode их убирает
  const blank = () => row([]).replace('class="mrow"', 'class="mrow bd-col-blank"');
  // знак — как в самих тренажёрах: у умножения прямо перед множителем, у
  // сложения и вычитания — перед началом длинного числа
  const signAt = W - (kind === 'mul' ? bot.length : Math.max(bot.length, top.length)) - 1;
  const rows = [row(top), row(bot, signAt), '<div class="mline"></div>'];
  if (kind === 'mul' && bot.length > 1){
    for (let i = 0; i < bot.length; i++) rows.push(blank());
    rows.push('<div class="mline bd-col-blank"></div>');
    rows.push(blank());
  } else {
    const extra = COL_EXTRA_ROWS[kind] || 1;
    for (let i = 0; i < extra; i++) rows.push(blank());
  }
  return rows.join('');
}
// деление — уголок, как в тренажёре (render в division.html): делимое,
// черта, делитель с полкой под частное; ниже — по две строки на каждую
// цифру частного (вычитаемое и остаток) и запас
function divColumnHTML(P){
  const dividend = String(P.dividend || '');
  const divisor = String(P.divisor || '');
  if (!dividend || !divisor) return null;
  const n = dividend.length;
  const D = n + 1 + (P.decimal ? (P.maxDecimalDigits || 2) + 1 : 0);
  const qLen = String(P.q != null ? P.q : '').replace('.', ',').length || 1;
  const shelf = Math.max(divisor.length, qLen + 1);
  const cols = D + 1 + shelf + 1;
  const blankRow = () => Array.from({ length: cols }, () => ({ ch: '', cls: '' }));
  const r0 = blankRow();
  for (let i = 0; i < n; i++) r0[i + 1].ch = dividend[i];
  r0[D].cls = 'vline';
  for (let i = 0; i < shelf; i++){ r0[D + 1 + i].cls = 'uline'; if (i < divisor.length) r0[D + 1 + i].ch = divisor[i]; }
  const r1 = blankRow();
  r1[D].cls = 'vline';
  const rows = [r0, r1];
  const steps = Math.min(12, 2 * qLen + 1);
  for (let i = 1; i < steps; i++) rows.push(blankRow());
  return rows.map((rr, i) => '<div class="row' + (i > 1 ? ' bd-col-blank' : '') + '">' + rr.map(c => '<div class="c ' + c.cls + '">' + c.ch + '</div>').join('') + '</div>').join('');
}

// какой тренажёр из каталога открыт по адресу loc (location кадра): файл
// и ?n= для страниц, где один файл на много номеров (ЕГЭ, ОГЭ ч. 2). null —
// это не тренажёр каталога (главная, доски, работы…)
function ttPanelItemForLocation(loc){
  if (!loc || !loc.href || loc.href === 'about:blank') return null;
  const file = (loc.pathname || '').split('/').pop();
  const n = new URLSearchParams(loc.search || '').get('n');
  for (const g of TRAINERS_PANEL_GROUPS) for (const it of g.items){
    const [f, q] = it.href.split('?');
    if (f !== file) continue;
    if (!q) return it;
    if (n && q === 'n=' + n) return it;
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════
   Промпт №66: ЗАДАНИЯ С ТРЕНАЖЁРОВ НА ДОСКЕ — ЖИВЫЕ.
   Картинка задания остаётся обычной картинкой (на ней можно писать, её
   видно в выгрузке, она едет в общую доску как раньше), а в объекте лежит
   ещё поле task: какой ответ верный и где на картинке поле ответа, варианты
   и кнопка «Проверить». Поверх этих мест доска кладёт настоящие <input> и
   кнопки (слой #bdTaskLayer над холстом) и двигает их вместе с камерой.

   task = {
     v: 1,
     kind: 'fields' | 'choice' | 'multi',
     fields: [{ id, label, type, value, alts, seq, anyOrder, unit,     // fields
                anyCols, exactLen, choices, norm }],  // по виду поля: ttTaskFields
     n, correct,            // choice: номер верного; multi: массив номеров
     hot: { w, h,           // размер снятого узла в CSS-пикселях тренажёра
            fields: [{x,y,w,h}], opts: [{x,y,w,h}], check: {x,y,w,h},
            style: {...} }, // доли от размеров картинки (0..1)
     st: { res: 'ok'|'bad', vals, marks, pick, picks, tries }   // после проверки
   }

   Почему ответ берётся из самого тренажёра, а не вычисляется доской: у
   каждого тренажёра своя модель задания, и повторять генераторы здесь —
   значит разойтись с ними при первой же правке. Все они отдают состояние
   через tsGetState() (мост совместной сессии), и из него же — curTask/P.
   ЕГЭ держит задание в константе S, до неё достаём через eval окна кадра
   (тот же домен, файлы тренажёров не меняются).

   Черновик (что набрано, но не проверено, какие утверждения отмечены) живёт
   только в taskDrafts, а в объект попадает при нажатии «Проверить»: иначе
   каждое нажатие клавиши гоняло бы в общую доску всю картинку целиком
   (объект тяжелее 30 КБ едет через базу, раздел 7 HANDOFF).
   ═══════════════════════════════════════════════════════════════════════ */

function trainerEval(win, expr){
  try { return win.eval(expr); } catch (e) { return undefined; }
}
function plainCopy(x){ try { return x == null ? x : JSON.parse(JSON.stringify(x)); } catch (e) { return null; } }
function gcdOfList(nums){
  const g = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
  return (nums || []).reduce((acc, x) => g(acc, x), 0);
}
function numField(v, label, extra){
  return Object.assign({ id: 'main', label: label || 'Ответ:', type: 'num', value: String(v) }, extra || {});
}

// ОГЭ №1–19 и «Степени»: curTask одинаковой формы во всех тренажёрах —
// варианты (options + correctIndex), утверждения (№19), число (correctValue
// или answer у №10)
function taskFromCurTask(t){
  if (!t) return null;
  if (Array.isArray(t.options) && typeof t.correctIndex === 'number' && t.correctIndex >= 0 && t.correctIndex < t.options.length)
    return { kind: 'choice', n: t.options.length, correct: t.correctIndex };
  if (Array.isArray(t.statements) && t.statements.length){
    const correct = [];
    t.statements.forEach((s, i) => { if (s && s.isTrue) correct.push(i); });
    return { kind: 'multi', n: t.statements.length, correct };
  }
  const v = t.correctValue !== undefined ? t.correctValue : t.answer;
  if (typeof v === 'number' && isFinite(v)) return { kind: 'fields', fields: [numField(v, null, t.unit ? { unit: t.unit } : null)] };
  return null;
}

function egeTaskInfo(win, cardIdx, el){
  const p = trainerEval(win, cardIdx >= 0
    ? 'protoById(S.n, S.cards[' + cardIdx + '].pid)'
    : 'protoById(S.n, S.pid)');
  // доказательство (ОГЭ №24) проверять нечем — только картинка
  if (!p || p.proof || typeof win.fieldsOf !== 'function') return null;
  let list;
  try { list = win.fieldsOf(p); } catch (e) { return null; }
  if (!Array.isArray(list) || !list.length) return null;
  // слово (word) на страницах-копиях ege_prof.html проверяется wordKey —
  // правилом английского (can't = cannot): так делает и сама страница
  const fields = ttTaskFields(list, 'en');
  if (!fields) return null;
  // обществознание (№4, 5, 6, 9, 10, 11, 13, 15, 16): одно поле «1–4», а сами
  // варианты — кнопки в условии (data-bd-opt, EXAM.optButtons страницы). На
  // доске такое задание — выбор нажатием на вариант (kind 'choice', проверка
  // сразу по нажатию, «Проверить» не нужна). Только когда на снимке ровно
  // столько видимых вариантов, сколько в поле: иначе запасной путь — поле с
  // цифрой (taCheckField сравнивает её с choices и value)
  const f = fields.length === 1 ? fields[0] : null;
  if (f && f.type === 'yesno' && f.choices && f.choices.length && f.choices.every(c => /^\d+$/.test(c)) && el && el.querySelectorAll){
    const shown = [...el.querySelectorAll('[data-bd-opt]')].filter(e => {
      const r = e.getBoundingClientRect();
      return r.width > 1 && r.height > 1;
    });
    const at = f.choices.indexOf(f.value);
    if (at >= 0 && shown.length === f.choices.length) return { kind: 'choice', n: f.choices.length, correct: at };
  }
  return { kind: 'fields', fields };
}

// Виды полей, которые доска умеет проверить (taCheckField). word — слово
// (norm: 'ru' — как normText rus_oge.html, 'en' — как wordKey eng_oge.html),
// term — слово или словосочетание обществознания (termKey soc_oge.html)
const TT_FIELD_TYPES = ['plain', 'num', 'nums', 'set', 'yesno', 'pairs', 'word', 'term'];
// поля тренажёра → поля задания на доске; null — есть поле, которое доска
// проверить не умеет (тогда всё задание — картинка). Переносим только то, что
// нужно проверке: флаги порядка цифр (anyOrder — весь ответ, anyCols — внутри
// колонок «2 + 2», №3 обществознания), exactLen, варианты yesno (choices)
function ttTaskFields(list, wordNorm){
  if (!Array.isArray(list) || !list.length) return null;
  const fields = list.map(f => {
    const o = {
      id: String(f.id), label: String(f.label || ''), type: f.type,
      value: f.value == null ? '' : String(f.value),
      alts: (f.alts || []).map(String), seq: !!f.seq, anyOrder: !!f.anyOrder, unit: f.unit || '',
    };
    if (f.anyCols) o.anyCols = true;
    if (f.exactLen) o.exactLen = true;
    if (f.type === 'yesno' && Array.isArray(f.choices) && f.choices.length) o.choices = f.choices.map(String);
    if (f.type === 'word') o.norm = f.norm === 'ru' || f.norm === 'en' ? f.norm : (wordNorm || 'en');
    return o;
  });
  return fields.some(f => TT_FIELD_TYPES.indexOf(f.type) < 0) ? null : fields;
}
// ответ хука __boardTaskInfo → задание или null (непонятное — картинкой)
function ttCheckHookInfo(info){
  if (!info || typeof info !== 'object') return null;
  const okN = n => Number.isInteger(n) && n > 0;
  if (info.kind === 'fields'){
    const fields = ttTaskFields(info.fields, 'ru');
    return fields ? { kind: 'fields', fields } : null;
  }
  if (info.kind === 'choice')
    return okN(info.n) && Number.isInteger(info.correct) && info.correct >= 0 && info.correct < info.n
      ? { kind: 'choice', n: info.n, correct: info.correct } : null;
  if (info.kind === 'multi'){
    // несколько отметок и «Проверить» (русский: варианты №2, 3, 6, 10, 11, 12)
    const c = info.correct;
    return okN(info.n) && Array.isArray(c) && c.length && c.every(i => Number.isInteger(i) && i >= 0 && i < info.n)
      ? { kind: 'multi', n: info.n, correct: c.slice().sort((a, b) => a - b) } : null;
  }
  return null;
}

function soloTaskInfo(trainerId, P){
  if (!P) return null;
  switch (trainerId){
    case 'add_col': return { kind: 'fields', fields: [numField(P.topVal + P.bottomVal)] };
    case 'sub_col': return { kind: 'fields', fields: [numField(P.topVal - P.bottomVal)] };
    case 'mul_col': return { kind: 'fields', fields: [numField(P.topVal * P.bottomVal)] };
    case 'div_col':
      // с остатком — два поля, как пишут в тетради: частное и остаток
      if (Number(P.r) > 0) return { kind: 'fields', fields: [
        { id: 'q', label: 'Частное:', type: 'num', value: String(P.q) },
        { id: 'r', label: 'Остаток:', type: 'num', value: String(P.r) },
      ] };
      return { kind: 'fields', fields: [numField(P.q)] };
    case 'linear': return typeof P.x0 === 'number' ? { kind: 'fields', fields: [numField(P.x0, 'x =')] } : null;
    case 'quadratic': {
      let roots = null;
      if (Array.isArray(P.roots)) roots = P.roots;
      else if (P.kind === 'noB') roots = P.hasRoots ? [P.r, -P.r] : [];
      else if (typeof P.x1 === 'number') roots = [P.x1, P.x2];
      if (!roots) return null;
      return { kind: 'fields', fields: [{ id: 'main', label: 'Корни:', type: 'nums', value: roots.join('; ') }] };
    }
    case 'frac_mul': case 'frac_div':
      // сравниваем по значению: 21/130, 0,16…, смешанная запись — всё верно,
      // если число то же (сокращать ли — решает учитель, а не доска)
      return (P.sim && P.sim.resultDen) ? { kind: 'fields', fields: [numField(P.sim.resultNum + '/' + P.sim.resultDen)] } : null;
    case 'gcd': return Array.isArray(P.nums) ? { kind: 'fields', fields: [numField(gcdOfList(P.nums), 'НОД =')] } : null;
  }
  return null;
}

// что верно в задании, которое сейчас снимают с узла el; null — задание
// останется просто закреплённой картинкой (теория, №9 с квадратными и т. п.)
function trainerTaskInfo(win, trainerId, el){
  if (!win || !el || !trainerId) return null;
  try {
    const card = el.closest ? el.closest('.added-task-card[data-idx]') : null;
    const cardIdx = card ? Number(card.dataset.idx) : -1;
    if (isEgeLikeTrainer(trainerId)) return egeTaskInfo(win, cardIdx, el);
    // Промпт №71: тренажёр, у которого верный ответ лежит прямо в объекте
    // задания («Проценты»), отдаёт его сам готовым — доске не нужно знать
    // его модель задания. Новым тренажёрам достаточно завести этот хук
    if (typeof win.__boardTaskInfo === 'function') return ttCheckHookInfo(plainCopy(win.__boardTaskInfo(cardIdx)));
    if (el.id === 'theoryContent') return null;
    const st = typeof win.tsGetState === 'function' ? plainCopy(win.tsGetState()) : null;
    if (!st) return null;
    if (st.solo) return soloTaskInfo(trainerId, st.P);
    if (cardIdx >= 0){
      const bt = (st.addedTasks || [])[cardIdx];
      return bt ? taskFromCurTask(bt.task) : null;
    }
    return taskFromCurTask(st.curTask);
  } catch (e) {
    console.warn('[доска] не удалось прочитать ответ задания', e);
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   Промпт №68: «ЕЩЁ ТАКОЕ ЖЕ ЗАДАНИЕ» У ЗАДАНИЯ НА ДОСКЕ.
   Доска сама заданий не придумывает — у каждого тренажёра свой генератор,
   и повторять их здесь значило бы разойтись с ними при первой же правке
   (та же причина, что у ответа в trainerTaskInfo). Поэтому при добавлении
   задания в объект пишется obj.gen — из чего его можно сделать заново:

     gen = { v: 1, tid, href, vw,       // тренажёр, его адрес, ширина кадра
             kind: 'state',  snap }     // ОГЭ, арифметика, НОД: снимок моста
                                        //   сессии (тип, уровень, раздел)
           | kind: 'ege',    n, pid     // ЕГЭ и ОГЭ ч. 2: следующий прототип
           | kind: 'engine', mode, lvl  // движки уравнений ОГЭ №9 — только у
                                        //   заданий, снятых до промпта №80

   По кнопке тренажёр открывается в НЕВИДИМОМ кадре (genFrameFor, адрес с
   ?bdgen=1 — session-share.js тогда не подключается к сессии), в него
   применяется снимок и зовётся тот же newTask(), что у «+1» в
   trainer-multi.js; дальше снимок и ответ — теми же captureTrainerNode и
   trainerTaskInfo, что у кнопки «Добавить на доску». Кадр остаётся жить
   (до трёх разных тренажёров), поэтому второе нажатие — без загрузки.
   Побочный эффект тот же, что у карточек «+1»: кадр пишет прогресс типа в
   localStorage тренажёра (последнее задание, последний уровень).
   ═══════════════════════════════════════════════════════════════════════ */
// страница-копия ege_prof.html: ЕГЭ, ОГЭ ч. 2, обществознание, английский —
// у них одна модель задания (S.n, S.pid, fieldsOf). Список — в каталоге (cap)
function isEgeLikeTrainer(tid){
  if (/^(ege|egeb)\d+$/.test(tid) || /^oge2[0-5]$/.test(tid)) return true;
  const t = TT_CATALOG && TT_CATALOG.trainers[tid];
  return !!(t && t.cap === 'ege');
}
// снимок моста сессии без доски, калькулятора и служебных полей: только то,
// что задаёт тип и уровень задания
function stripTrainerSnap(st){
  if (!st || typeof st !== 'object') return null;
  const out = {};
  Object.keys(st).forEach(k => {
    if (k.indexOf('__') === 0 || k === 'strokes' || k === 'bgStrokes' || k === 'calcOp' || k === 'calcHist') return;
    out[k] = st[k];
  });
  // добавленные «+» карточки (ОГЭ №8, №12, степени) в кадре не нужны — из
  // них снимается только основное задание
  if (Array.isArray(out.addedTasks)) out.addedTasks = [];
  return plainCopy(out);
}
const GEN_HTML_MAX = 300000;
function trainerGenInfo(win, tid, href, el){
  if (!win || !tid || !href || !el || el.id === 'theoryContent') return null;
  try {
    const base = { v: 1, tid, href, vw: Math.round(win.innerWidth || 0) || null };
    // Промпт №70: вёрстка самого задания — чтобы перестроить его под новую
    // ширину, не придумывая заново (у движков №9 и карточек «+» по-другому
    // то же задание не воспроизвести). node — какой узел снимали: ширину,
    // заданную у одного вида узлов, переносим только на такой же
    const html = el.innerHTML;
    if (html && html.length <= GEN_HTML_MAX) base.html = html;
    base.node = el.id || (el.classList.contains('added-card-question') ? 'card' : el.className || 'node');
    if (isEgeLikeTrainer(tid)){
      const card = el.closest ? el.closest('.added-task-card[data-idx]') : null;
      const n = trainerEval(win, 'S.n');
      const pid = trainerEval(win, card ? 'S.cards[' + Number(card.dataset.idx) + '].pid' : 'S.pid');
      if (n == null || pid == null) return null;
      return Object.assign(base, { kind: 'ege', n: Number(n), pid: String(pid) });
    }
    const api = win.__trainerState;
    // Промпт №14 «логарифмы и тригонометрия»: снимали карточку «+» — тренажёр отдаёт уровень и вид ЕЁ
    // задания (логарифмы, тригонометрия), а не основного; остальные
    // тренажёры номер карточки просто не читают
    const card = el.closest ? el.closest('.added-task-card[data-idx]') : null;
    const cardIdx = card ? Number(card.dataset.idx) : -1;
    const snap = stripTrainerSnap(api && api.get ? api.get(cardIdx) : (typeof win.tsGetState === 'function' ? win.tsGetState() : null));
    return snap ? Object.assign(base, { kind: 'state', snap }) : null;
  } catch (e) {
    console.warn('[доска] не удалось запомнить тип задания', e);
    return null;
  }
}

const genFrames = new Map();   // адрес тренажёра → { frame, ready }
const GEN_FRAMES_MAX = 3;
function genFrameFor(href, vw){
  let rec = genFrames.get(href);
  if (!rec){
    while (genFrames.size >= GEN_FRAMES_MAX){
      const [k, r] = genFrames.entries().next().value;
      r.frame.remove(); genFrames.delete(k);
    }
    const frame = document.createElement('iframe');
    frame.className = 'bd-gen-frame';
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    // не display:none — html2canvas нужна настоящая вёрстка; просто далеко
    // за краем экрана и прозрачный
    frame.style.cssText = 'position:fixed;left:-30000px;top:0;height:1600px;border:0;opacity:0;pointer-events:none;';
    frame.style.width = (vw || 720) + 'px';
    const ready = new Promise((resolve, reject) => {
      frame.addEventListener('load', () => {
        const t0 = Date.now();
        (function poll(){
          let w = null;
          try { w = frame.contentWindow; } catch (e) {}
          // __fipiBusy: ОГЭ ч. 2 догружает задания ФИПИ своего номера отдельным
          // файлом — без них «ещё такое же» взяло бы демоверсию
          if (w && w.document && w.document.readyState === 'complete' && typeof w.tsGetState === 'function'
              && !(typeof w.__fipiBusy === 'function' && w.__fipiBusy())){
            setTimeout(() => resolve(frame), 400);   // стартовые таймеры страницы (восстановление прогресса)
            return;
          }
          if (Date.now() - t0 > 15000){ reject(new Error('тренажёр не загрузился')); return; }
          setTimeout(poll, 100);
        })();
      }, { once: true });
    });
    frame.src = href + (href.indexOf('?') >= 0 ? '&' : '?') + 'bdgen=1';
    document.body.appendChild(frame);
    rec = { frame, ready };
    genFrames.set(href, rec);
    ready.catch(() => { if (genFrames.get(href) === rec){ frame.remove(); genFrames.delete(href); } });
  }
  if (vw) rec.frame.style.width = vw + 'px';   // снимок той же ширины, что у исходного
  return rec.ready;
}
const genWait = ms => new Promise(r => setTimeout(r, ms));

// в кадре — новое задание того же типа и уровня
// в кадре — то же задание, что в объекте (для перестройки под ширину):
// экран нужного типа; само содержимое узла потом подставляется из gen.html
async function genShowSameInFrame(win, g){
  const doc = win.document;
  if (g.kind === 'ege'){
    win.eval('openTask(' + JSON.stringify(g.n) + ', ' + JSON.stringify(g.pid) + '); if (typeof render === "function") render();');
  } else if (g.kind === 'engine'){
    // задание движка до промпта №80: его вёрстку (#live, #eqLine) новый №9
    // уже не построит — пусть доска оставит снимок как был
    throw new Error('задание старого вида №9 не перестраивается');
  } else {
    const api = win.__trainerState;
    const snap = plainCopy(g.snap);
    if (api && api.apply) api.apply(snap); else win.tsApplyState(snap);
  }
  await genWait(250);
}

async function genNewTaskInFrame(win, g){
  const doc = win.document;
  if (g.kind === 'ege'){
    win.eval('openTask(' + JSON.stringify(g.n) + ', pidAfter(' + JSON.stringify(g.pid) + ')); if (typeof render === "function") render();');
  } else if (g.kind === 'engine'){
    // Промпт №80: движков уравнений в №9 больше нет, а на досках остались
    // задания, снятые с них. «Ещё такое же» к ним — задание №9 того же вида
    // уравнения: «Случайно» среди линейных или квадратных прототипов
    const api = win.__trainerState;
    if (!api || !api.apply) throw new Error('нет __trainerState');
    api.apply({ picker: false, curMode: g.mode === 'quadratic' ? 'randomQuad' : 'randomLin', curSubMode: 'exam' });
    await genWait(120);
    api.newTask();
  } else {
    const api = win.__trainerState;
    const snap = plainCopy(g.snap);
    if (api && api.apply) api.apply(snap); else win.tsApplyState(snap);
    await genWait(120);
    if (api && api.newTask) api.newTask();
    else if (typeof win.newTask === 'function') win.newTask();
    else throw new Error('нет newTask');
  }
  await genWait(250);
}


/* ── чистка клона перед снимком и замер мест под живые элементы ── */
function prepareTaskClone(c, task){
  const win = c.ownerDocument.defaultView;
  const visible = e => {
    const r = e.getBoundingClientRect();
    return r.width > 1 && r.height > 1 && win.getComputedStyle(e).visibility !== 'hidden';
  };
  // следы уже данного ответа на снимке не нужны: задание на доске начинается
  // с чистого листа, разбор и «Следующий пример» тоже убираем
  c.querySelectorAll('.explain, .added-explain, .next-btn, .answer-msg, #mainPanel').forEach(e => { e.style.display = 'none'; });
  c.querySelectorAll('input, .mcq-btn, .stmt, .check-btn, [data-bd-opt], [data-bd-check]').forEach(e => {
    ['good', 'bad', 'shake', 'correct', 'wrong', 'disabled', 'picked', 'ok', 'reveal', 'struck', 'sel'].forEach(k => e.classList.remove(k));
    if (e.tagName === 'INPUT'){ e.value = ''; e.setAttribute('value', ''); }
    if ('disabled' in e) e.disabled = false;
    e.removeAttribute('disabled');
  });
  const unhide = btn => { if (btn && btn.style.display === 'none') btn.style.display = ''; };
  let fieldEl = null, checkEl = null, optEls = null;
  // Страница сама может пометить места для доски: data-bd-opt — варианты,
  // data-bd-check — «Проверить», data-bd-field — место поля ответа. Пометки
  // — запасной путь после классов ОГЭ (.mcq-btn, .stmt, input.answer-input):
  // у русского варианты .opt, а кнопка не в родителе поля
  const marked = sel => [...c.querySelectorAll(sel)].filter(visible);
  const markedCheck = () => marked('[data-bd-check]')[0] || null;
  if (task.kind === 'fields' && task.fields.length === 1){
    const ins = [...c.querySelectorAll('input.answer-input')].filter(visible);
    if (ins.length === 1){
      fieldEl = ins[0];
      checkEl = (fieldEl.parentElement && fieldEl.parentElement.querySelector('.check-btn')) || markedCheck();
      unhide(checkEl);
    } else if (!ins.length){
      const spot = marked('[data-bd-field]');
      if (spot.length === 1){
        fieldEl = spot[0];
        // место не поле (№4 русского: выпадающие списки по буквам) — на снимке
        // вместо него пустое поле того же вида, что у остальных номеров: на
        // доске ответ один, цифрами подряд, как в бланке
        if (fieldEl.tagName !== 'INPUT'){
          const inp = c.ownerDocument.createElement('input');
          inp.className = 'answer-input';
          inp.setAttribute('value', '');
          fieldEl.replaceChildren(inp);
          fieldEl = inp;
        }
        checkEl = markedCheck();
      }
    }
  }
  if (task.kind === 'choice'){
    let btns = [...c.querySelectorAll('.mcq-btn')].filter(visible);
    if (btns.length !== task.n) btns = marked('[data-bd-opt]');
    if (btns.length === task.n) optEls = btns;
  }
  if (task.kind === 'multi'){
    let items = [...c.querySelectorAll('.stmt')].filter(visible);
    if (items.length !== task.n) items = marked('[data-bd-opt]');
    if (items.length === task.n) optEls = items;
    checkEl = c.querySelector('[data-bd-check]') || c.querySelector('.check-btn');
    if (checkEl && getComputedStyle(checkEl).display === 'none') checkEl.style.display = 'block';
  }
  // замер — после всех правок вёрстки клона
  const base = c.getBoundingClientRect();
  const rel = e => {
    const r = e.getBoundingClientRect();
    return { x: (r.left - base.left) / base.width, y: (r.top - base.top) / base.height,
             w: r.width / base.width, h: r.height / base.height };
  };
  const hot = { w: base.width, h: base.height, fields: [], opts: [], check: null, style: null };
  if (fieldEl) hot.fields = [rel(fieldEl)];
  if (optEls) hot.opts = optEls.map(rel);
  if (checkEl && visible(checkEl)) hot.check = rel(checkEl);
  // подпись кнопки — как в тренажёре («Проверить ответ» в №19), иначе
  // живая кнопка поверх картинки показывала бы другой текст
  if (hot.check) hot.checkText = (checkEl.textContent || '').trim().slice(0, 40);
  // цвета поля и кнопки — с самого тренажёра, чтобы живое поле на доске
  // выглядело так же, как на картинке под ним (и в светлой, и в тёмной теме)
  const cs = e => e ? win.getComputedStyle(e) : null;
  const fs = cs(fieldEl), bs = cs(checkEl);
  hot.style = {
    inBg: fs ? fs.backgroundColor : null, inFg: fs ? fs.color : null, inBorder: fs ? fs.borderTopColor : null,
    inRadius: fs ? parseFloat(fs.borderTopLeftRadius) || 0 : null,
    btnBg: bs ? ttButtonBg(bs) : null, btnFg: bs ? bs.color : null,
    btnRadius: bs ? parseFloat(bs.borderTopLeftRadius) || 0 : null,
    font: win.getComputedStyle(c).fontFamily || null,
  };
  return hot;
}

// фон кнопки «Проверить» для живой кнопки на доске. У русского он градиентом
// (background-image), а backgroundColor прозрачный — живая кнопка была бы
// прозрачной, и сквозь её подпись просвечивала нарисованная на снимке
function ttButtonBg(cs){
  const col = cs.backgroundColor || '';
  const transparent = !col || col === 'transparent' || /rgba\([^)]*,\s*0\s*\)$/.test(col);
  if (transparent && /gradient\(/.test(cs.backgroundImage || '')) return cs.backgroundImage;
  return col || null;
}

function hotIsUsable(task, hot){
  if (task.kind === 'fields') return hot.fields.length === task.fields.length;
  if (task.kind === 'choice') return hot.opts.length === task.n;
  if (task.kind === 'multi') return hot.opts.length === task.n && !!hot.check;
  return false;
}

function isDarkColor(css){
  const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(css || '');
  if (!m) return false;
  return (0.299 * m[1] + 0.587 * m[2] + 0.114 * m[3]) < 128;
}

// дорисовать под снимком строку «Ответ: [поле] [Проверить]» (или ряд
// номеров вариантов), если на самом снимке таких мест нет. Пишем прямо в
// картинку, чтобы задание оставалось одним объектом: его рамка, закрепление,
// перенос и копирование не знают ни о каких «приставках» снизу
// side === 'right' — строки встают справа от снимка, сверху (столбики:
// под записью учитель решает сам, место там должно оставаться пустым)
function bakeTaskRows(canvas, task, hot, bgColor, scale, side){
  const need = task.kind === 'fields' ? !hot.fields.length : !hot.opts.length;
  if (!need) return null;
  const dark = isDarkColor(bgColor);
  const ink = dark ? '#E8EAED' : '#1C1C1E';
  const boxBorder = dark ? 'rgba(255,255,255,.28)' : 'rgba(0,0,0,.22)';
  const boxBg = dark ? '#1f2227' : '#ffffff';
  const btnBg = '#2E7DE0';
  const W = hot.w, H = hot.h;                // в CSS-пикселях тренажёра
  const ROW = 46, GAP = 10, PAD = 14, BTN_W = 124, FONT = 17;
  const meas = document.createElement('canvas').getContext('2d');
  meas.font = '600 ' + FONT + 'px ' + TT_UI_FONT;
  const rows = [];     // { label, box: 'field'|'opts' }
  if (task.kind === 'fields') task.fields.forEach(f => rows.push({ label: taPlainLabel(f.label) || 'Ответ:', field: f }));
  else rows.push({ label: task.kind === 'multi' ? 'Верные:' : 'Ответ:' });
  const labelW = Math.max(...rows.map(r => meas.measureText(r.label).width)) + 12;
  const extraH = PAD + rows.length * ROW + (rows.length - 1) * GAP + PAD;
  const right = side === 'right';
  // справа: блок строк шириной под подпись, поле и кнопку; отступ от записи
  // — как поле карточки, чтобы поле ответа не липло к цифрам
  const SIDE_GAP = 28;
  const blockW = PAD + labelW + 180 + GAP + BTN_W + PAD;
  const x0Block = right ? W + SIDE_GAP - PAD : 0;
  const totalW = right ? x0Block + blockW : Math.max(W, PAD + labelW + 200 + GAP + BTN_W + PAD);
  const totalH = right ? Math.max(H, extraH - PAD) : H + extraH;
  const out = document.createElement('canvas');
  out.width = Math.round(totalW * scale); out.height = Math.round(totalH * scale);
  const c = out.getContext('2d');
  // фон не заливаем: строка ответа ложится на карточку (wrapIntoCard), а
  // bgColor — цвет карточки, по нему только выбираем светлые/тёмные цвета
  c.drawImage(canvas, 0, 0);
  c.scale(scale, scale);
  c.font = '600 ' + FONT + 'px ' + TT_UI_FONT;
  c.textBaseline = 'middle';
  const frac = (x, y, w, h) => ({ x: x / totalW, y: y / totalH, w: w / totalW, h: h / totalH });
  const hot2 = { w: totalW, h: totalH, fields: [], opts: [], check: null, style: hot.style || {} };
  const box = (x, y, w, h, fill, stroke, r) => {
    c.beginPath(); ttRoundRectPath(c, x, y, w, h, r || 10);
    if (fill){ c.fillStyle = fill; c.fill(); }
    if (stroke){ c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); }
  };
  // справа — от верхнего края записи (первая строка поля — вровень с
  // первым числом), снизу — с отступом под снимком
  let y = right ? 0 : H + PAD;
  rows.forEach((r, i) => {
    c.fillStyle = ink; c.textAlign = 'left';
    c.fillText(r.label, x0Block + PAD, y + ROW / 2);
    const x0 = x0Block + PAD + labelW;
    const isLast = i === rows.length - 1;
    const room = totalW - x0 - PAD - (isLast ? BTN_W + GAP : 0);
    if (task.kind === 'fields'){
      const wide = r.field.type === 'nums' || r.field.type === 'set' || r.field.type === 'term' || r.field.seq;
      const w = Math.min(room, wide ? 280 : 180);
      box(x0, y, w, ROW, boxBg, boxBorder);
      hot2.fields.push(frac(x0, y, w, ROW));
      if (isLast){ box(x0 + w + GAP, y, BTN_W, ROW, btnBg, null); hot2.check = frac(x0 + w + GAP, y, BTN_W, ROW); }
    } else {
      const s = Math.min(ROW, (room - GAP * (task.n - 1)) / task.n);
      for (let k = 0; k < task.n; k++){
        const bx = x0 + k * (s + GAP);
        box(bx, y, s, ROW, boxBg, boxBorder);
        c.fillStyle = ink; c.textAlign = 'center';
        c.fillText(String(k + 1), bx + s / 2, y + ROW / 2);
        hot2.opts.push(frac(bx, y, s, ROW));
      }
      if (task.kind === 'multi'){
        const bx = x0 + task.n * (s + GAP);
        box(bx, y, BTN_W, ROW, btnBg, null);
        hot2.check = frac(bx, y, BTN_W, ROW);
      }
    }
    y += ROW + GAP;
  });
  hot2.style = Object.assign({}, hot2.style, {
    inBg: boxBg, inFg: ink, inBorder: boxBorder, inRadius: 10, btnBg, btnFg: '#ffffff', btnRadius: 10,
  });
  return { canvas: out, hot: hot2 };
}
function taPlainLabel(label){
  return String(label || '').replace(/<[^>]+>/g, '').replace(/\$/g, '').replace(/\\[a-zA-Z]+/g, '').replace(/[{}]/g, '').trim();
}

/* ── проверка ответа ─────────────────────────────────────────────────────
   Та же логика, что в ege_prof.html (evalExpr/parseSet/checkField): точные
   записи 72√3, 169/5, −15π/4, наборы корней через «;», промежутки. Копия, а
   не подключение того файла: доске не нужен весь тренажёр ради разбора
   одного поля. Правите разбор там — не забудьте и здесь. */
function taNormMinus(s){ return String(s).replace(/[−–—‐‑]/g, '-'); }
function taStrip(s){ return String(s).replace(/[\s   ]/g, ''); }
function taParsePlain(raw){
  const s = taStrip(taNormMinus(raw)).replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return parseFloat(s);
}
function taNormExpr(src){
  let s = taStrip(taNormMinus(src)).toLowerCase();
  s = s.replace(/sqrt|корень/g, '√');
  s = s.replace(/infinity|inf|беск/g, '∞');
  s = s.replace(/pi|пи|п/g, 'π');
  s = s.replace(/[·×\*]/g, '*').replace(/[:÷]/g, '/').replace(/,/g, '.');
  return s;
}
function taEval(src){
  const s = taNormExpr(src);
  if (!s) return NaN;
  let i = 0;
  const peek = () => s[i];
  function number(){
    const m = /^\d+(\.\d+)?/.exec(s.slice(i));
    if (!m) return null;
    i += m[0].length;
    return parseFloat(m[0]);
  }
  const startsPrimary = ch => ch === '(' || ch === 'π' || ch === '∞' || ch === '√' || /[0-9]/.test(ch || '');
  function primary(){
    const ch = peek();
    if (ch === '(') { i++; const v = expr(); if (peek() !== ')') throw 0; i++; return v; }
    if (ch === 'π') { i++; return Math.PI; }
    if (ch === '∞') { i++; return Infinity; }
    if (ch === '√') { i++; const v = power(); if (v < 0) throw 0; return Math.sqrt(v); }
    const n = number();
    if (n === null) throw 0;
    return n;
  }
  function power(){ const b = primary(); if (peek() === '^') { i++; return Math.pow(b, unary()); } return b; }
  function unary(){
    if (peek() === '-') { i++; return -unary(); }
    if (peek() === '+') { i++; return unary(); }
    return power();
  }
  function term(){
    let v = unary();
    for (;;) {
      const ch = peek();
      if (ch === '*') { i++; v *= unary(); }
      else if (ch === '/') { i++; v /= unary(); }
      else if (startsPrimary(ch)) { v *= power(); }
      else break;
    }
    return v;
  }
  function expr(){
    let v = term();
    for (;;) {
      const ch = peek();
      if (ch === '+') { i++; v += term(); }
      else if (ch === '-') { i++; v -= term(); }
      else break;
    }
    return v;
  }
  try { const v = expr(); return i === s.length ? v : NaN; } catch (e) { return NaN; }
}
function taSameNum(a, b){
  if (a === b) return true;
  if (!isFinite(a) || !isFinite(b)) return false;
  return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
}
function taSplit(src){
  const s = taNormMinus(src);
  const out = [];
  let depth = 0, cur = '';
  for (let k = 0; k < s.length; k++) {
    const ch = s[k];
    if ('([{'.indexOf(ch) >= 0) depth++;
    if (')]}'.indexOf(ch) >= 0) depth--;
    const isSep = depth === 0 && (ch === ';' ||
      (ch === ',' && !(/\d/.test(s[k - 1] || '') && /\d/.test(s[k + 1] || ''))));
    if (isSep) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out.map(x => x.trim()).filter(x => x !== '');
}
function taParseNums(src){
  // №108: так корни пишут в тетради — «x = 4 ± √7» и «x₁ = …»: подпись
  // переменной снимаем, а «±» раскрываем в два корня. Иначе верный по сути
  // ответ уходил в «запишите иначе», и ученик не понимал, что не так
  const items = [];
  taSplit(src).forEach(raw => {
    const it = taStrip(raw).replace(/^[a-zа-я][0-9₀-₉]*=/i, '');
    const k = it.indexOf('±');
    if (k >= 0 && it.indexOf('±', k + 1) < 0) items.push(it.replace('±', '+'), it.replace('±', '-'));
    else items.push(it);
  });
  return taEvalNums(items);
}
function taEvalNums(list){
  const items = list.map(taEval);
  return items.some(isNaN) ? null : items;
}
// корни сравниваем как множество: у x² + 6x + 9 = 0 «−3» и «−3; −3» — одно и то же
function taSameNumSets(a, b){
  if (!a || !b) return false;
  const uniq = arr => arr.slice().sort((p, q) => p - q).filter((v, k, all) => k === 0 || !taSameNum(v, all[k - 1]));
  const x = uniq(a), y = uniq(b);
  return x.length === y.length && x.every((v, k) => taSameNum(v, y[k]));
}
// разрезание по символу только вне скобок: «;» внутри (1; 5) — не разделитель
function taSplitTop(s, ch){
  const out = []; let depth = 0, cur = '';
  for (const c of s) {
    if ('([{'.indexOf(c) >= 0) depth++;
    if (')]}'.indexOf(c) >= 0) depth--;
    if (depth === 0 && c === ch) { out.push(cur); cur = ''; } else cur += c;
  }
  out.push(cur);
  return out;
}
// пересечение двух списков промежутков (оба уже склеены и упорядочены)
function taIntersectSets(a, b){
  const out = [];
  for (const p of a) for (const q of b) {
    let lo, loC, hi, hiC;
    if (taSameNum(p.lo, q.lo)) { lo = p.lo; loC = p.loC && q.loC; }
    else if (p.lo > q.lo) { lo = p.lo; loC = p.loC; } else { lo = q.lo; loC = q.loC; }
    if (taSameNum(p.hi, q.hi)) { hi = p.hi; hiC = p.hiC && q.hiC; }
    else if (p.hi < q.hi) { hi = p.hi; hiC = p.hiC; } else { hi = q.hi; hiC = q.hiC; }
    if (lo < hi && !taSameNum(lo, hi)) out.push({ lo, loC, hi, hiC });
    else if (taSameNum(lo, hi) && loC && hiC) out.push({ lo, loC: true, hi, hiC: true });
  }
  return out;
}
function taParseSet(src){
  let s = taNormMinus(src).toLowerCase();
  s = s.replace(/<=/g, '≤').replace(/>=/g, '≥').replace(/\s+или\s+/g, ';');
  s = s.replace(/∪/g, ';').replace(/\bu\b/g, ';');
  s = s.replace(/[a-zа-я]\s*∈\s*/g, '');
  const items = taSplit(s);
  if (!items.length) return null;
  const out = [];
  for (const raw of items) {
    // «∩» связывает сильнее «∪»: «(1; 5) ∩ (3; 8) ∪ {10}». «∪» к этому
    // месту уже стал «;», так что здесь в одном элементе только пересечение.
    // Копии этой функции в ege_prof.html «∩» не знает — там ответ вводят
    // системной клавиатурой, а у панели на досках кнопка ∩ есть
    const inter = taSplitTop(raw, '∩');
    if (inter.length > 1) {
      let acc = null;
      for (const piece of inter) {
        const v = taParseSet(piece);
        if (v === null) return null;
        acc = acc === null ? v : taIntersectSets(acc, v);
      }
      acc.forEach(iv => out.push(iv));
      continue;
    }
    const item = taStrip(raw);
    if (/^[\(\[].*[\)\]]$/.test(item)) {
      const parts = taSplit(item.slice(1, -1));
      if (parts.length !== 2) return null;
      const lo = taEval(parts[0]), hi = taEval(parts[1]);
      if (isNaN(lo) || isNaN(hi) || lo > hi) return null;
      out.push({ lo, loC: item[0] === '[' && isFinite(lo), hi, hiC: item[item.length - 1] === ']' && isFinite(hi) });
      continue;
    }
    if (/^\{.*\}$/.test(item)) {
      for (const p of taSplit(item.slice(1, -1))) {
        const v = taEval(p);
        if (isNaN(v)) return null;
        out.push({ lo: v, loC: true, hi: v, hiC: true });
      }
      continue;
    }
    if (/[<>≤≥=]/.test(item)) {
      const parts = item.split(/([<>≤≥=])/).filter(x => x !== '');
      const isVar = x => /^[a-zа-я]$/.test(x);
      if (parts.length === 3 && (isVar(parts[0]) || isVar(parts[2]))) {
        let [l, op, r] = parts;
        if (isVar(r)) { const flip = { '<': '>', '>': '<', '≤': '≥', '≥': '≤', '=': '=' }; [l, r] = [r, l]; op = flip[op]; }
        const v = taEval(r);
        if (isNaN(v)) return null;
        if (op === '<') out.push({ lo: -Infinity, loC: false, hi: v, hiC: false });
        else if (op === '≤') out.push({ lo: -Infinity, loC: false, hi: v, hiC: true });
        else if (op === '>') out.push({ lo: v, loC: false, hi: Infinity, hiC: false });
        else if (op === '≥') out.push({ lo: v, loC: true, hi: Infinity, hiC: false });
        else out.push({ lo: v, loC: true, hi: v, hiC: true });
        continue;
      }
      if (parts.length === 5 && isVar(parts[2])) {
        const a = taEval(parts[0]), b = taEval(parts[4]);
        const op1 = parts[1], op2 = parts[3];
        if (isNaN(a) || isNaN(b)) return null;
        if ((op1 === '<' || op1 === '≤') && (op2 === '<' || op2 === '≤')) out.push({ lo: a, loC: op1 === '≤' && isFinite(a), hi: b, hiC: op2 === '≤' && isFinite(b) });
        else if ((op1 === '>' || op1 === '≥') && (op2 === '>' || op2 === '≥')) out.push({ lo: b, loC: op2 === '≥' && isFinite(b), hi: a, hiC: op1 === '≥' && isFinite(a) });
        else return null;
        continue;
      }
      return null;
    }
    const v = taEval(item);
    if (isNaN(v)) return null;
    out.push({ lo: v, loC: true, hi: v, hiC: true });
  }
  out.sort((p, q) => p.lo - q.lo || (p.loC === q.loC ? 0 : (p.loC ? -1 : 1)));
  const merged = [];
  for (const iv of out) {
    const last = merged[merged.length - 1];
    if (last && (iv.lo < last.hi || (taSameNum(iv.lo, last.hi) && (last.hiC || iv.loC)))) {
      if (iv.hi > last.hi) { last.hi = iv.hi; last.hiC = iv.hiC; }
      else if (taSameNum(iv.hi, last.hi)) last.hiC = last.hiC || iv.hiC;
    } else merged.push(Object.assign({}, iv));
  }
  return merged;
}
function taSameSets(a, b){
  if (!a || !b || a.length !== b.length) return false;
  return a.every((iv, k) => taSameNum(iv.lo, b[k].lo) && taSameNum(iv.hi, b[k].hi)
    && (!isFinite(iv.lo) || iv.loC === b[k].loC) && (!isFinite(iv.hi) || iv.hiC === b[k].hiC));
}
// Ключи сравнения слов — копии со страниц тренажёров (правите там — правьте здесь):
// русский — normText rus_oge.html: регистр, ё = е, пробелы и знаки не важны
function taRuWordKey(s){ return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[\s.,;:!?«»"'()]+/g, ''); }
// английский — wordKey eng_oge.html: один апостроф на все написания, n't = not
function taEnWordKey(s){
  return String(s || '').toLowerCase()
    .replace(/[\u2018\u2019\u02BC\u0060\u00B4]/g, "'")
    .replace(/\bcan't\b/g, 'cannot').replace(/\bwon't\b/g, 'will not').replace(/\bshan't\b/g, 'shall not')
    .replace(/n't\b/g, ' not')
    .replace(/[\s.,!?;:]+/g, '');
}
// обществознание №2 — termKey soc_oge.html: ещё и тире, дефисы не важны
function taTermKey(s){ return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[\s.,;:!?«»"'()–—-]+/g, ''); }
// обществознание №3 — colsKey soc_oge.html: порядок важен только между колонками
function taColsKey(s){ s = String(s); return s.slice(0, 2).split('').sort().join('') + '|' + s.slice(2).split('').sort().join(''); }
// поле, ответ в которое набирают буквами: обычная клавиатура устройства, а не
// цифровая (BoardAnswerPad на доске, inputmode у работ). yesno с номерами
// вариантов — цифры
function taFieldIsText(f){
  if (!f) return false;
  if (f.type === 'word' || f.type === 'term') return true;
  if (f.type === 'yesno') return !(Array.isArray(f.choices) && f.choices.length && f.choices.every(c => /^\d+$/.test(String(c))));
  return false;
}
// → true / false / null (null — запись не разобрали: это не ошибка ученика,
// а просьба записать иначе, отметка «неверно» не ставится)
function taCheckField(f, value){
  const raw = String(value || '').trim();
  if (!raw) return null;
  const accepted = [f.value].concat(f.alts || []);
  if (f.type === 'yesno'){
    // варианты — «да/нет» или номера (обществознание №4, 5, 6…: choices '1'–'4'):
    // ответ сверяем с тем вариантом, что вписан, а не требуем «да/нет»
    const choices = Array.isArray(f.choices) && f.choices.length ? f.choices.map(c => String(c).toLowerCase()) : ['да', 'нет'];
    const v = taStrip(raw).toLowerCase().replace(/[.!)]+$/, '');
    if (choices.indexOf(v) < 0) return null;
    return v === String(f.value).toLowerCase();
  }
  if (f.type === 'word'){
    // слово: правило — по полю norm, а не по тексту ответа (русское слово и
    // английское проверяются по-разному, а угадывать язык по буквам ненадёжно)
    const key = f.norm === 'ru' ? taRuWordKey : taEnWordKey;
    const v = key(raw);
    return v ? accepted.some(a => key(a) === v) : null;
  }
  if (f.type === 'term'){
    const v = taTermKey(raw);
    return v ? accepted.some(a => taTermKey(a) === v) : null;
  }
  if (f.type === 'plain' && f.seq){
    const d = taStrip(raw);
    if (!/^\d+$/.test(d)) return null;
    // не столько цифр, сколько клеток бланка, — просьба переписать, а не ошибка (как на странице)
    if (f.exactLen && d.length !== String(f.value).length) return null;
    // anyOrder — порядок цифр не важен вовсе (русский №5, №7); anyCols — только
    // внутри колонок «две цифры сходства | две различия» (обществознание №3)
    const key = x => f.anyOrder ? String(x).split('').sort().join('') : f.anyCols ? taColsKey(x) : String(x);
    return accepted.some(a => key(a) === key(d));
  }
  if (f.type === 'plain'){
    const v = taParsePlain(raw);
    if (v === null){
      // на доске допускаем и точную запись (1/4 вместо 0,25) — как в num
      const e = taEval(raw);
      return isNaN(e) ? null : accepted.some(a => taSameNum(e, taParsePlain(a)));
    }
    return accepted.some(a => taSameNum(v, taParsePlain(a)));
  }
  if (f.type === 'num'){
    let s = raw;
    if (f.unit) s = s.replace(new RegExp('\\s*' + f.unit + '\\.?$', 'i'), '');
    const v = taEval(s);
    return isNaN(v) ? null : accepted.some(a => taSameNum(v, taEval(a)));
  }
  if (f.type === 'nums'){
    // «нет корней» — законный ответ, если корней правда нет
    if (/^(нет|нет\s*корней|∅|пусто)$/i.test(raw.replace(/\.$/, ''))) return !String(f.value || '').trim();
    const v = taParseNums(raw);
    if (v === null) return null;
    if (!String(f.value || '').trim()) return false;
    return taSameNumSets(v, taParseNums(f.value));
  }
  if (f.type === 'set'){
    const v = taParseSet(raw);
    return v === null ? null : taSameSets(v, taParseSet(f.value));
  }
  if (f.type === 'pairs'){
    const v = taParsePairs(raw);
    return v === null ? null : taSamePairs(v, taParsePairs(f.value));
  }
  return null;
}
// пары — ответ системы (ОГЭ №20): «(−1; 4); (1; 4)», порядок пар не важен,
// порядок чисел в паре важен; копия parsePairs/samePairs из ege_prof.html
function taParsePairs(src){
  const out = [];
  for (const item of taSplit(src)){
    const it = taStrip(item);
    if (!/^\(.*\)$/.test(it)) return null;
    const xy = taSplit(it.slice(1, -1)).map(taEval);
    if (xy.length !== 2 || xy.some(isNaN)) return null;
    out.push(xy);
  }
  return out.length ? out : null;
}
function taSamePairs(a, b){
  if (!a || !b || a.length !== b.length) return false;
  const ord = arr => arr.slice().sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const x = ord(a), y = ord(b);
  return x.every((p, k) => taSameNum(p[0], y[k][0]) && taSameNum(p[1], y[k][1]));
}


/* ── «Обновить пример» (промпт №15 нового списка) ──
   Урок идёт так: добавил задание → новый пример → добавил ещё. Кнопка ⟳
   живёт в шапке тренажёра, далеко от «Добавить», — «Обновить пример» в
   панели нажимает ту же самую, без своей логики: что делает ⟳ в тренажёре
   (правила сессии, уровень, «Экзамен», история примеров), то и здесь.
   Порядок:
   1) видимая ⟳ самого тренажёра — #refreshBtn (арифметика, уравнения, ОГЭ,
      движки №9) или #mcqRefreshBtn (типы №9 с выбором ответа);
   2) где ⟳ у основного задания нет (деление в столбик, «Проценты»,
      логарифмы, тригонометрия) — __trainerState.newTask(), тот же новый
      пример того же типа, что у «+1» и у «ещё такое же» на доске;
   3) ЕГЭ и ОГЭ ч. 2: задания там — готовые прототипы, новый пример — это
      следующий прототип номера, кнопка «Следующий прототип ▶».
   Во 2) и 3) — только когда в кадре открыто задание: с экрана выбора типа
   newTask() открыл бы задание сам, а это уже не «обновить».
   Общая для панели досок и конструктора работ (промпт №15 «работы»). */
function visibleBtn(doc, id){
  const b = doc.getElementById(id);
  return b && !b.disabled && b.getClientRects().length > 0 ? b : null;
}
function trainerHasTask(doc, tid){
  const nodes = collectTrainerCaptureNodes(doc, tid);
  nodes.forEach(n => { if (n.restore) n.restore(); });
  return nodes.some(n => n.el.id !== 'theoryContent');
}
// → 'ok' | 'notask' (в кадре экран выбора) | 'single' (у номера ЕГЭ один прототип)
function refreshTrainerIn(win, tid){
  let doc = null;
  try { doc = win && win.document; } catch (e) { doc = null; }
  if (!doc || !tid) return 'notask';
  const own = visibleBtn(doc, 'refreshBtn') || visibleBtn(doc, 'mcqRefreshBtn');
  if (own){ own.click(); return 'ok'; }
  if (!trainerHasTask(doc, tid)) return 'notask';
  const api = win.__trainerState;
  if (api && typeof api.newTask === 'function'){ api.newTask(); return 'ok'; }
  const next = visibleBtn(doc, 'nextProtoBtn');
  if (next){ next.click(); return 'ok'; }
  return 'single';
}
