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
  add_col:   [ { sel:'#board' } ],
  sub_col:   [ { sel:'#board' } ],
  mul_col:   [ { sel:'#board' } ],
  div_col:   [ { sel:'#prompt' } ],
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

// список тренажёров для панели — те же названия/файлы, что и в реестре
// TRAINERS на главной странице (index.html), сгруппированы так же просто,
// как раздел «Основа» там: отдельно все номера ОГЭ, отдельно всё остальное —
// без повторов одного тренажёра в нескольких разделах (это на главной
// странице оправдано навигацией по классам, а тут только мешало бы искать)
const TRAINERS_PANEL_GROUPS = [
  { title: 'ОГЭ', items: [
    { id:'oge1_5',   name:'№1–5. Практические задачи',    href:'oge1_5.html',            eq:'шины, тарифы…' },
    { id:'oge6',     name:'№6. Числа и вычисления',       href:'oge6.html',              eq:'1/10 + 29/20' },
    { id:'oge7',     name:'№7. Сравнение и оценка чисел', href:'oge7.html',              eq:'5 < √27 < 6' },
    { id:'oge8',     name:'№8. Выражения и формулы',      href:'oge8.html',              eq:'a²−b²' },
    { id:'oge9',     name:'№9. Уравнения и неравенства',  href:'oge9.html',              eq:'3x²−7x+2=0' },
    { id:'oge10',    name:'№10. Теория вероятности',      href:'oge10.html',             eq:'P(A)=5⁄20' },
    { id:'oge11',    name:'№11. Графики функций',         href:'oge11.html',             eq:'y=kx+b' },
    { id:'oge12',    name:'№12. Вычисления по формулам',  href:'oge12.html',             eq:'v=v₀+at' },
    { id:'oge13',    name:'№13. Неравенства',             href:'oge13.html',             eq:'x²−9≤0' },
    { id:'oge14',    name:'№14. Прогрессии',              href:'oge14.html',             eq:'aₙ=a₁+(n−1)d' },
    { id:'oge15_18', name:'№15–18. Геометрия',            href:'oge15_18.html',          eq:'S, P, Пифагор' },
    { id:'oge19',    name:'№19. Верные утверждения',      href:'oge19.html',             eq:'верно/неверно' },
  ]},
  { title: 'Основа', items: [
    { id:'add_col',   name:'Сложение в столбик',      href:'addition.html',          eq:'999+1' },
    { id:'sub_col',   name:'Вычитание в столбик',     href:'subtraction.html',       eq:'700−458' },
    { id:'mul_col',   name:'Умножение в столбик',     href:'multiplication.html',    eq:'347×26' },
    { id:'div_col',   name:'Деление в столбик',       href:'division.html',          eq:'4826:7' },
    { id:'linear',    name:'Линейные уравнения',      href:'linear.html',            eq:'3(2x−5)+x' },
    { id:'quadratic', name:'Квадратные уравнения',    href:'quadratic.html',         eq:'2x²−7x+3=0' },
    { id:'frac_mul',  name:'Умножение дробей',        href:'fraction_multiply.html', eq:'4⁄9×3⁄8' },
    { id:'frac_div',  name:'Деление дробей',          href:'fraction_divide.html',   eq:'2⁄3÷4⁄5' },
    // Промпт №54: тренажёр степеней появился на главной позже этой панели,
    // сюда его добавить забыли
    { id:'powers',    name:'Действия со степенями',   href:'powers.html',            eq:'a⁵·a³=a⁸' },
    { id:'gcd',       name:'Наибольший общий делитель (НОД)', href:'gcd.html',    eq:'НОД(84, 60)' },
    { id:'lcm',       name:'Наименьшее общее кратное (НОК)',  href:'lcm.html',    eq:'НОК(12, 18)' },
    { id:'percent',   name:'Проценты',                href:'percent.html',           eq:'15% от 80' },
    { id:'logarithms', name:'Свойства логарифмов',    href:'logarithms.html',        eq:'log₂8 = 3' },
    { id:'trig_equations', name:'Тригонометрические уравнения', href:'trig_equations.html', eq:'sin x = ½' },
  ]},
];
// ЕГЭ профиль вставляем вторым разделом (после ОГЭ) — те же названия, что в
// реестре на главной; все двадцать номеров ведут в один файл с номером в адресе
const EGE_PROF_PANEL = [
  'Планиметрия', 'Векторы', 'Стереометрия', 'Начала теории вероятностей',
  'Вероятности сложных событий', 'Случайная величина', 'Простейшие уравнения',
  'Вычисления и преобразования', 'Производная и графики',
  'Задачи с прикладным содержанием', 'Текстовые задачи', 'Графики функций',
  'Кредиты и вклады', 'Уравнения', 'Стереометрическая задача', 'Неравенства',
  'Прикладная задача', 'Планиметрическая задача', 'Задача с параметром',
  'Числа и их свойства',
];
TRAINERS_PANEL_GROUPS.splice(1, 0, { title: 'ЕГЭ профиль', items: EGE_PROF_PANEL.map((title, i) => ({
  id: 'ege' + (i + 1),
  name: '№' + (i + 1) + '. ' + title,
  href: 'ege_prof.html?n=' + (i + 1),
  eq: i < 13 ? 'краткий ответ' : 'с решением',
})) });
// ЕГЭ база — третьим разделом, сразу за профилем; названия те же, что на главной
const EGE_BASE_PANEL = [
  'Простейшие текстовые задачи', 'Величины и их значения', 'Графики, диаграммы и таблицы',
  'Вычисления по формулам', 'Начала теории вероятностей', 'Выбор оптимального варианта',
  'Анализ графиков и диаграмм', 'Анализ утверждений', 'Площади на клетчатом плане',
  'Прикладная планиметрия', 'Прикладная стереометрия', 'Планиметрия', 'Стереометрия',
  'Вычисления', 'Проценты и доли', 'Значения выражений', 'Простейшие уравнения',
  'Числа на прямой и неравенства', 'Цифровая запись числа', 'Текстовые задачи',
  'Задачи на смекалку',
];
TRAINERS_PANEL_GROUPS.splice(2, 0, { title: 'ЕГЭ база', items: EGE_BASE_PANEL.map((title, i) => ({
  id: 'egeb' + (i + 1),
  name: '№' + (i + 1) + '. ' + title,
  href: 'ege_base.html?n=' + (i + 1),
  eq: 'краткий ответ',
})) });

// ОГЭ, часть 2 (Промпт №61) — в тот же раздел «ОГЭ», следом за №19; названия
// те же, что в реестре на главной, все шесть номеров ведут в oge_part2.html
const OGE_PART2_PANEL = {
  20: 'Уравнения и неравенства', 21: 'Текстовая задача', 22: 'Графики функций',
  23: 'Геометрическая задача на вычисление', 24: 'Геометрическая задача на доказательство',
  25: 'Геометрическая задача повышенной сложности',
};
Object.keys(OGE_PART2_PANEL).forEach(n => {
  TRAINERS_PANEL_GROUPS[0].items.push({ id: 'oge' + n, name: '№' + n + '. ' + OGE_PART2_PANEL[n],
    href: 'oge_part2.html?n=' + n, eq: n === '24' ? 'доказательство' : 'с решением' });
});


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

// opts.html — содержимое узла, которое подставить в клон вместо того, что
// сейчас на странице (перестройка задания под новую ширину, промпт №70);
// opts.width — ширина узла в CSS-пикселях: текст и формулы переносятся по ней
async function captureTrainerNode(el, task, opts){
  if (typeof html2canvas !== 'function') throw new Error('html2canvas not loaded');
  opts = opts || {};
  const doc = el.ownerDocument;
  const pageBg = trainerPageBg(doc);
  const card = trainerCardStyle(el, pageBg);
  // не меньше двух пикселей на CSS-пиксель: задание на доске часто смотрят
  // крупнее, чем в тренажёре, и с одним пикселем текст сразу мылится
  const scale = Math.max(2, Math.min(3, window.devicePixelRatio || 1));
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
    const b = bakeTaskRows(canvas, task, hot, card.color, scale);
    if (b) { canvas = b.canvas; hot = b.hot; cw = hot.w; ch = hot.h; baked = true; }
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
  };
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
    if (entry.selAll){
      doc.querySelectorAll(entry.selAll).forEach(el => { if (el.offsetParent !== null) out.push({ el, restore:null }); });
      return;
    }
    const el = doc.querySelector(entry.sel);
    if (!el) return;
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
     fields: [{ id, label, type, value, alts, seq, anyOrder, unit }],  // fields
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

function egeTaskInfo(win, cardIdx){
  const p = trainerEval(win, cardIdx >= 0
    ? 'protoById(S.n, S.cards[' + cardIdx + '].pid)'
    : 'protoById(S.n, S.pid)');
  // доказательство (ОГЭ №24) проверять нечем — только картинка
  if (!p || p.proof || typeof win.fieldsOf !== 'function') return null;
  let list;
  try { list = win.fieldsOf(p); } catch (e) { return null; }
  if (!Array.isArray(list) || !list.length) return null;
  const fields = list.map(f => ({
    id: String(f.id), label: String(f.label || ''), type: f.type,
    value: f.value == null ? '' : String(f.value),
    alts: (f.alts || []).map(String), seq: !!f.seq, anyOrder: !!f.anyOrder, unit: f.unit || '',
  }));
  if (fields.some(f => ['plain', 'num', 'nums', 'set', 'yesno'].indexOf(f.type) < 0)) return null;
  return { kind: 'fields', fields };
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
    if (/^(ege|egeb)\d+$/.test(trainerId) || /^oge2[0-5]$/.test(trainerId)) return egeTaskInfo(win, cardIdx);
    // Промпт №71: тренажёр, у которого верный ответ лежит прямо в объекте
    // задания («Проценты»), отдаёт его сам готовым — доске не нужно знать
    // его модель задания. Новым тренажёрам достаточно завести этот хук
    if (typeof win.__boardTaskInfo === 'function') {
      const info = plainCopy(win.__boardTaskInfo(cardIdx));
      return info && (info.kind === 'fields' ? Array.isArray(info.fields) && info.fields.length : info.kind === 'choice') ? info : null;
    }
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
function isEgeLikeTrainer(tid){ return /^(ege|egeb)\d+$/.test(tid) || /^oge2[0-5]$/.test(tid); }
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
          if (w && w.document && w.document.readyState === 'complete' && typeof w.tsGetState === 'function'){
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
  c.querySelectorAll('input, .mcq-btn, .stmt, .check-btn').forEach(e => {
    ['good', 'bad', 'shake', 'correct', 'wrong', 'disabled', 'picked', 'ok', 'reveal', 'struck'].forEach(k => e.classList.remove(k));
    if (e.tagName === 'INPUT'){ e.value = ''; e.setAttribute('value', ''); }
    if ('disabled' in e) e.disabled = false;
    e.removeAttribute('disabled');
  });
  const unhide = btn => { if (btn && btn.style.display === 'none') btn.style.display = ''; };
  let fieldEl = null, checkEl = null, optEls = null;
  if (task.kind === 'fields' && task.fields.length === 1){
    const ins = [...c.querySelectorAll('input.answer-input')].filter(visible);
    if (ins.length === 1){
      fieldEl = ins[0];
      checkEl = fieldEl.parentElement && fieldEl.parentElement.querySelector('.check-btn');
      unhide(checkEl);
    }
  }
  if (task.kind === 'choice'){
    const btns = [...c.querySelectorAll('.mcq-btn')].filter(visible);
    if (btns.length === task.n) optEls = btns;
  }
  if (task.kind === 'multi'){
    const items = [...c.querySelectorAll('.stmt')].filter(visible);
    if (items.length === task.n) optEls = items;
    checkEl = c.querySelector('.check-btn');
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
    btnBg: bs ? bs.backgroundColor : null, btnFg: bs ? bs.color : null,
    btnRadius: bs ? parseFloat(bs.borderTopLeftRadius) || 0 : null,
    font: win.getComputedStyle(c).fontFamily || null,
  };
  return hot;
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
function bakeTaskRows(canvas, task, hot, bgColor, scale){
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
  const totalW = Math.max(W, PAD + labelW + 200 + GAP + BTN_W + PAD);
  const totalH = H + extraH;
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
  let y = H + PAD;
  rows.forEach((r, i) => {
    c.fillStyle = ink; c.textAlign = 'left';
    c.fillText(r.label, PAD, y + ROW / 2);
    const x0 = PAD + labelW;
    const isLast = i === rows.length - 1;
    const room = totalW - x0 - PAD - (isLast ? BTN_W + GAP : 0);
    if (task.kind === 'fields'){
      const wide = r.field.type === 'nums' || r.field.type === 'set' || r.field.seq;
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
  const items = taSplit(src).map(taEval);
  return items.some(isNaN) ? null : items;
}
// корни сравниваем как множество: у x² + 6x + 9 = 0 «−3» и «−3; −3» — одно и то же
function taSameNumSets(a, b){
  if (!a || !b) return false;
  const uniq = arr => arr.slice().sort((p, q) => p - q).filter((v, k, all) => k === 0 || !taSameNum(v, all[k - 1]));
  const x = uniq(a), y = uniq(b);
  return x.length === y.length && x.every((v, k) => taSameNum(v, y[k]));
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
// → true / false / null (null — запись не разобрали: это не ошибка ученика,
// а просьба записать иначе, отметка «неверно» не ставится)
function taCheckField(f, value){
  const raw = String(value || '').trim();
  if (!raw) return null;
  const accepted = [f.value].concat(f.alts || []);
  if (f.type === 'yesno'){
    const v = raw.toLowerCase().replace(/[.!]/g, '');
    if (v !== 'да' && v !== 'нет') return null;
    return v === String(f.value).toLowerCase();
  }
  if (f.type === 'plain' && f.seq){
    const d = taStrip(raw);
    if (!/^\d+$/.test(d)) return null;
    const key = x => f.anyOrder ? String(x).split('').sort().join('') : String(x);
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
  return null;
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
