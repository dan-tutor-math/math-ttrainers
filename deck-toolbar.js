/* ═══════════════════════════════════════════════════════════════════════
   ПАНЕЛЬ ИНСТРУМЕНТОВ ПРЕЗЕНТАЦИИ (№101, шаг 1 плана
   claude/presentations-toolbar-plan.md; HANDOFF.md раздел 6д)

   Зачем. Полоса листания разрослась кнопками-словами («Вставить», «Файл»…),
   а учителям из PowerPoint и Google Slides привычна строка значков. Дальше
   будут три вида панели на выбор (лента, одна строка, гибрид), поэтому
   команды объявлены ОДИН раз в реестре DECK_CMDS, а вид панели — только
   раскладка над ним: новая команда указывает группу и сама появляется в
   любом виде.

   Как. Полоса — тот же элемент #deckNav, перестроенный на месте: на его
   прямоугольник уже опираются deckArea() (место под слайд), проверка
   «у ученика полосы нет» и старые тесты. Кнопки, которые были в разметке
   (Конструктор/Урок, листание, «Слайд», «Файл», режимы ленты, «Очистить
   пометки»), переносятся в группы целиком, вместе с id и обработчиками
   из deck-core.js, — второй копии логики нет. Новые кнопки (надпись,
   таблица, фигуры, показ) зовут те же функции, что и старое меню
   «Вставить» (deckInsertAt → bxInsert).

   Грузится после deck-core.js (DECK_MODULES в boards-core.js); deck-core
   зовёт deckTbSync() по typeof — без этого модуля полоса просто старая.
   Стили — здесь же, чтобы boards.html не рос.
   ═══════════════════════════════════════════════════════════════════════ */

const DTB_STYLE_KEY = 'boardsDeckBarStyle';   // ribbon | line | hybrid
const DTB_OPEN_KEY = 'boardsDeckBarOpen';     // '1' раскрыта, '0' свёрнута
const DTB_STYLES = [
  { id: 'ribbon', label: 'Лента', soon: true, title: 'Вкладки и крупные значки, как в PowerPoint' },
  { id: 'line', label: 'Одна строка', title: 'Одна строка значков, как в Google Slides' },
  { id: 'hybrid', label: 'Гибрид', title: 'Одна строка, а фигуры, линии и таблица — крупными галереями с подписями' }
];

// значки — контуром одной толщины, как у дока (1,7), красятся currentColor
const DTB_ICONS = {
  text: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.2"/><path d="M8.5 9h7M12 9v7.2"/>',
  table: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.2"/><path d="M3.5 9.6h17M3.5 14.5h17M9.2 4.5v15M14.8 4.5v15" stroke-width="1.3"/>',
  shapes: '<circle cx="9" cy="9" r="5"/><rect x="11.2" y="11.2" width="9.3" height="9.3" rx="1.6"/>',
  show: '<rect x="3.5" y="4" width="17" height="12.5" rx="2"/><path d="M10.3 7.8l4.4 2.45-4.4 2.45z" stroke-linejoin="round"/><path d="M12 16.5v3.2M8.5 19.8h7"/>',
  up: '<path d="M7 14.5l5-5 5 5"/>',
  down: '<path d="M7 9.5l5 5 5-5"/>',
  more: '<circle cx="6" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
  caret: '<path d="M8 10.5l4 4 4-4"/>',
  line: '<path d="M5 19L19 5"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.2"/><circle cx="9" cy="9.7" r="1.7"/><path d="M20.5 15.5l-5-4.6-8.7 8.6"/>',
  formula: '<path d="M14.5 4.5c-1.8-.4-3 .5-3.3 2.3L9.6 17.2c-.3 1.8-1.5 2.7-3.3 2.3M7.5 10h6"/><path d="M14.5 12.5l5 5M19.5 12.5l-5 5"/>',
  task: '<rect x="3.5" y="4" width="7.5" height="7.5" rx="1.8"/><rect x="13" y="4" width="7.5" height="7.5" rx="1.8"/><rect x="3.5" y="13.5" width="7.5" height="6.5" rx="1.8"/><path d="M16.75 13.8v6M13.75 16.8h6"/>'
};
function dtbSvg(name, cls){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"' +
    (cls ? ' class="' + cls + '"' : '') + ' aria-hidden="true">' + (DTB_ICONS[name] || '') + '</svg>';
}

/* Реестр команд. Поля:
   id, group (insert | slide | file | mode | nav | flow | lesson | show),
   label — подпись (в «⋯» и подсказке), icon — значок новой кнопки,
   node — id готового узла из boards.html (его обработчики в deck-core.js),
   pop — выпадающая галерея (кнопка с «▾»; dtbPopToggle),
   run — обработчик новой кнопки; у узла по умолчанию его же click(),
   enabled — можно ли нажать сейчас, keep — никогда не уходит в «⋯»,
   prio — чем меньше, тем раньше уходит в «⋯» на узком экране: сначала
   режимы ленты, потом редкая вставка; пометки урока — последними, на уроке
   они нужнее всего */
const dtbCanInsert = () => typeof bxInsert === 'function' && typeof mayDraw === 'function' && mayDraw();
const DECK_CMDS = [
  // №102: вставка как в PowerPoint — выбрал, протянул по слайду (dtbArm)
  { id: 'text', group: 'insert', icon: 'text', label: 'Надпись', title: 'Надпись — протяните рамку по слайду или щёлкните', prio: 4,
    enabled: dtbCanInsert, run: () => dtbArm('text', 'dtb-text') },
  { id: 'shapes', group: 'insert', icon: 'shapes', label: 'Фигуры', title: 'Фигуры', prio: 4, pop: 'shapes', btnId: 'deckShapesBtn', enabled: dtbCanInsert },
  { id: 'lines', group: 'insert', icon: 'line', label: 'Линия', title: 'Линия, стрелка, соединительная', prio: 3, pop: 'lines', btnId: 'deckLinesBtn', enabled: dtbCanInsert },
  { id: 'table', group: 'insert', icon: 'table', label: 'Таблица', title: 'Таблица — выберите размер', prio: 3, pop: 'table', btnId: 'deckTableBtn', enabled: dtbCanInsert },
  // картинка, формула и задание — те же окна, что у дока и верхней строки доски
  { id: 'image', group: 'insert', icon: 'image', label: 'Картинка', title: 'Картинка — из буфера обмена или с устройства', prio: 2, enabled: dtbCanInsert,
    run: (e) => dtbImage(e) },
  { id: 'formula', group: 'insert', icon: 'formula', label: 'Формула', title: 'Формула (LaTeX)', prio: 2,
    enabled: () => typeof openFormulaEditor === 'function' && mayDraw(), run: () => openFormulaEditor(null) },
  { id: 'task', group: 'insert', icon: 'task', label: 'Задание', title: 'Задание из тренажёра', prio: 2,
    enabled: () => !!document.getElementById('bdTrainersToggle') && mayDraw(), run: () => document.getElementById('bdTrainersToggle').click() },
  { id: 'slide', group: 'slide', node: 'deckSlideBtn', label: 'Слайд', prio: 5 },
  { id: 'file', group: 'slide', node: 'deckFileBtn', label: 'Файл', prio: 5 },
  { id: 'mode', group: 'mode', node: 'deckModeSeg', label: 'Конструктор / Урок', keep: true },
  { id: 'prev', group: 'nav', node: 'deckPrev', label: 'Предыдущий слайд', keep: true },
  { id: 'no', group: 'nav', node: 'deckNo', label: 'Номер слайда', keep: true },
  { id: 'next', group: 'nav', node: 'deckNext', label: 'Следующий слайд', keep: true },
  { id: 'flowV', group: 'flow', node: 'deckFlowV', label: 'Листать вверх и вниз', prio: 1 },
  { id: 'flowS', group: 'flow', node: 'deckFlowS', label: 'Сплошная прокрутка', prio: 1 },
  { id: 'flowH', group: 'flow', node: 'deckFlowH', label: 'Листать вбок', prio: 1 },
  { id: 'clear', group: 'lesson', node: 'deckClearNotes', label: 'Очистить пометки', prio: 6 },
  { id: 'copy', group: 'lesson', node: 'deckCopyBtn', label: 'Копия урока', prio: 5 },
  // режим показа — шаг 5 плана; пока только место в полосе
  { id: 'show', group: 'show', icon: 'show', label: 'Показ', title: 'Показ слайдов на всю вкладку (скоро)', prio: 3, wide: true,
    run: () => { if (typeof deckToast === 'function') deckToast('Режим показа появится в следующем обновлении'); } }
];
// раскладка «одна строка» (вариант Б): порядок групп слева направо
const DTB_LINE_GROUPS = ['insert', 'slide', 'mode', 'nav', 'flow', 'lesson', 'show'];

function dtbStyle(){
  let v = null;
  try { v = localStorage.getItem(DTB_STYLE_KEY); } catch (e) {}
  return DTB_STYLES.some(s => s.id === v) ? v : 'line';
}
function dtbOpen(){
  try { return localStorage.getItem(DTB_OPEN_KEY) !== '0'; } catch (e) { return true; }
}
function dtbCmdEl(c){ return document.getElementById(c.node || c.btnId || ('dtb-' + c.id)); }
// команда сейчас нужна (её не спрятал deck-core: «Копия урока» у ученика,
// «Очистить пометки» вне «Урока»…) — без учёта ухода в «⋯»
function dtbAvailable(c){
  const el = dtbCmdEl(c);
  // группы полосы прячет сама раскладка (dtbLayout) — их hidden не в счёт
  return !!el && !el.hidden && !el.parentElement?.closest('[hidden]:not(.dtb-grp)');
}

let dtbBuilt = false;
function dtbBuild(){
  const nav = document.getElementById('deckNav');
  if (!nav || dtbBuilt) return;
  dtbBuilt = true;
  dtbInjectStyle();
  nav.classList.add('dtb');
  nav.setAttribute('role', 'toolbar');
  nav.setAttribute('aria-label', 'Панель презентации');
  // разделители теперь рисует сама группа (рамка слева) — старые убираем,
  // иначе у спрятанной группы остался бы лишний разделитель
  nav.querySelectorAll('.deck-sep').forEach(s => s.remove());
  const groups = {};
  DTB_LINE_GROUPS.forEach(g => {
    const span = document.createElement('span');
    span.className = 'dtb-grp';
    span.dataset.g = g;
    groups[g] = span;
  });
  DECK_CMDS.forEach(c => {
    let el = c.node ? document.getElementById(c.node) : null;
    if (!el && !c.node){
      el = document.createElement('button');
      el.type = 'button';
      el.id = c.btnId || ('dtb-' + c.id);
      el.className = 'deck-nav-btn dtb-btn' + (c.wide ? ' wide' : '');
      el.title = c.title || c.label;
      el.setAttribute('aria-label', c.label);
      el.innerHTML = dtbSvg(c.icon) + (c.wide ? '<span class="dtb-lbl">' + c.label + '</span>' : '') + (c.pop ? dtbSvg('caret', 'dtb-caret') : '');
      if (c.pop){ el.setAttribute('aria-haspopup', 'menu'); el.setAttribute('aria-expanded', 'false'); }
      el.addEventListener('click', (e) => dtbRun(c, e));
    }
    if (!el) return;
    el.dataset.cmd = c.id;
    // «Очистить пометки» и «Копия урока» живут в своём контейнере, который
    // прячет deckSyncModeUI, — переносим контейнер целиком
    const host = c.group === 'lesson' ? document.getElementById('deckLessonBtns') : null;
    if (host){ if (host.parentElement !== groups.lesson) groups.lesson.appendChild(host); }
    else groups[c.group].appendChild(el);
  });
  // «Слайд» и «Файл» — со стрелкой, как выпадающие в Google Slides
  ['deckSlideBtn', 'deckFileBtn'].forEach(id => {
    const b = document.getElementById(id);
    if (b && !b.querySelector('.dtb-caret')) b.insertAdjacentHTML('beforeend', dtbSvg('caret', 'dtb-caret'));
  });
  nav.textContent = '';
  DTB_LINE_GROUPS.forEach(g => nav.appendChild(groups[g]));
  // хвост полосы: «⋯» (то, что не влезло) и свернуть/развернуть
  const tail = document.createElement('span');
  tail.className = 'dtb-tail';
  tail.innerHTML = '<button type="button" class="deck-nav-btn" id="dtbMoreBtn" title="Ещё" aria-label="Ещё команды" aria-haspopup="menu" aria-expanded="false" hidden>' + dtbSvg('more') + '</button>' +
    '<button type="button" class="deck-nav-btn" id="dtbFoldBtn" title="Свернуть панель (двойной щелчок по пустому месту панели)" aria-label="Свернуть панель">' + dtbSvg('up') + '</button>';
  nav.appendChild(tail);
  const more = document.createElement('div');
  more.className = 'deck-menu';
  more.id = 'dtbMoreMenu';
  more.hidden = true;
  more.setAttribute('role', 'menu');
  (document.getElementById('deckFileMenu')?.parentElement || document.body).appendChild(more);

  document.getElementById('dtbFoldBtn').addEventListener('click', () => dtbSetOpen(!dtbOpen()));
  document.getElementById('dtbMoreBtn').addEventListener('click', () => dtbMoreToggle());
  // двойной щелчок по пустому месту полосы (не по кнопке) — свернуть/развернуть
  nav.addEventListener('dblclick', (e) => {
    // только внутри полосы: у <html> презентации тоже есть класс deck-mode
    if (e.target.closest('#deckNav button, #deckNo, #deckModeSeg')) return;
    dtbSetOpen(!dtbOpen());
  });
  more.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-cmd]');
    if (!b || b.disabled) return;
    const c = DECK_CMDS.find(x => x.id === b.dataset.cmd);
    dtbMoreToggle(false);
    if (c) dtbRun(c, e);
  });
  document.addEventListener('pointerdown', (e) => {
    if (e.target.closest('#dtbMoreMenu, #dtbMoreBtn')) return;
    dtbMoreToggle(false);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') dtbMoreToggle(false); });
  window.addEventListener('resize', () => dtbScheduleLayout());
  // ленту миниатюр сворачивают и растягивают — место под полосу меняется
  const strip = document.getElementById('deckStrip');
  if (strip && typeof ResizeObserver === 'function') new ResizeObserver(() => dtbScheduleLayout()).observe(strip);
  dtbBuildSettings();
  dtbBuildPops();
  dtbPlaceInit();
}

function dtbRun(c, e){
  if (c.enabled && !c.enabled()) return;
  if (c.pop){
    const btn = dtbCmdEl(c);
    // ушла в «⋯» — галерею открываем под «⋯»
    const anchor = btn && btn.classList.contains('dtb-off') ? document.getElementById('dtbMoreBtn') : btn;
    dtbPopToggle(c.pop, anchor);
    return;
  }
  if (c.run){ c.run(e); return; }
  dtbCmdEl(c)?.click();
}

function dtbSetOpen(v){
  try { localStorage.setItem(DTB_OPEN_KEY, v ? '1' : '0'); } catch (e) {}
  dtbMoreToggle(false);
  deckTbSync();
  // места под слайд стало больше или меньше — вписываем заново (как лента миниатюр)
  requestAnimationFrame(() => { if (typeof deckStripRefit === 'function') deckStripRefit(); });
}

function dtbMoreToggle(open){
  const m = document.getElementById('dtbMoreMenu'), b = document.getElementById('dtbMoreBtn');
  if (!m || !b) return;
  const on = open === undefined ? m.hidden : open;
  if (on){
    const off = DECK_CMDS.filter(c => dtbCmdEl(c)?.classList.contains('dtb-off') && dtbAvailable(c));
    m.innerHTML = '';
    off.forEach(c => {
      const el = dtbCmdEl(c);
      const it = document.createElement('button');
      it.type = 'button';
      it.dataset.cmd = c.id;
      it.setAttribute('role', 'menuitem');
      const pressed = el?.getAttribute('aria-pressed') === 'true';
      it.textContent = (pressed ? '✓ ' : '') + c.label + (c.pop ? ' ▸' : '');
      it.disabled = !!(el?.disabled) || (c.enabled ? !c.enabled() : false);
      m.appendChild(it);
    });
    if (!off.length) return;
  }
  m.hidden = !on;
  b.setAttribute('aria-expanded', on ? 'true' : 'false');
  if (!on) return;
  const r = b.getBoundingClientRect();
  m.style.left = Math.max(8, Math.min(window.innerWidth - m.offsetWidth - 8, r.right - m.offsetWidth)) + 'px';
  m.style.top = (r.bottom + 8) + 'px';
}

/* Главная синхронизация: зовут deckOnOpen и deckSyncModeUI (deck-core.js),
   а также сама полоса после сворачивания. Видна полоса только у
   презентации учителя: у ученика в просмотре (deckViewerMode) isDeckBoard()
   ложь — полосы нет вовсе, как и раньше */
function deckTbSync(){
  dtbBuild();
  const nav = document.getElementById('deckNav');
  if (!nav) return;
  const on = typeof isDeckBoard === 'function' && isDeckBoard();
  if (!on){ nav.hidden = true; dtbMoreToggle(false); return; }
  nav.hidden = false;
  const open = dtbOpen();
  nav.classList.toggle('dtb-closed', !open);
  nav.dataset.style = dtbStyle();
  const fold = document.getElementById('dtbFoldBtn');
  if (fold){
    fold.innerHTML = dtbSvg(open ? 'up' : 'down');
    fold.title = open ? 'Свернуть панель (двойной щелчок по пустому месту панели)' : 'Развернуть панель';
    fold.setAttribute('aria-label', open ? 'Свернуть панель' : 'Развернуть панель');
    fold.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  DECK_CMDS.forEach(c => {
    if (c.node || !c.enabled) return;
    const el = dtbCmdEl(c);
    if (el) el.disabled = !c.enabled();
  });
  dtbSyncSettings();
  dtbLayout();
}

let dtbLayoutRaf = 0;
function dtbScheduleLayout(){
  if (dtbLayoutRaf) return;
  dtbLayoutRaf = requestAnimationFrame(() => { dtbLayoutRaf = 0; dtbLayout(); });
}
// узкий экран: команды с меньшим prio по очереди уходят в «⋯», пока полоса
// не влезет. Меряем по факту (ширина кнопок зависит от шрифта и режима)
function dtbLayout(){
  const nav = document.getElementById('deckNav');
  if (!nav || nav.hidden) return;
  const more = document.getElementById('dtbMoreBtn');
  DECK_CMDS.forEach(c => dtbCmdEl(c)?.classList.remove('dtb-off'));
  if (more) more.hidden = true;
  const syncGroups = () => nav.querySelectorAll('.dtb-grp').forEach(g => {
    // группа без видимых кнопок — прячем, вместе с её разделителем
    const any = [...g.querySelectorAll('[data-cmd]')].some(el => !el.classList.contains('dtb-off') && !el.hidden && !el.parentElement.closest('[hidden]:not(.dtb-grp)'));
    g.hidden = !any;
  });
  syncGroups();
  // №102: полоса стоит посередине места ПРАВЕЕ ленты миниатюр: по центру
  // окна длинная полоса наезжала на шапку ленты (кнопку «‹» не нажать)
  const W = window.innerWidth, strip = document.getElementById('deckStrip');
  let x0 = 12;
  if (strip && !strip.hidden){
    const r = strip.getBoundingClientRect();
    if (r.width && r.right < W / 2) x0 = Math.max(x0, r.right + 10);
  }
  const avail = Math.max(200, W - 12 - x0);
  nav.style.left = (x0 + avail / 2) + 'px';
  nav.style.maxWidth = avail + 'px';
  if (nav.classList.contains('dtb-closed')) return;
  // ширину меряем по содержимому (scrollWidth): сама полоса ограничена
  // max-width и шире экрана не станет, даже когда кнопки уже не влезают
  const wide = () => nav.scrollWidth + 2 > Math.min(avail, nav.clientWidth + 2) || nav.getBoundingClientRect().width > avail;
  if (!wide()) return;
  if (more) more.hidden = false;
  const order = DECK_CMDS.filter(c => !c.keep && dtbAvailable(c)).sort((a, b) => (a.prio || 0) - (b.prio || 0));
  for (const c of order){
    if (!wide()) break;
    dtbCmdEl(c)?.classList.add('dtb-off');
    syncGroups();
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   №102 (шаг 2 плана): вставка со значками — галереи фигур и линий, сетка
   таблицы, картинка, формула, задание; вставка протяжкой, как в PowerPoint
   ═══════════════════════════════════════════════════════════════════════ */

// фигуры по группам, как в PowerPoint. Значок каждой рисует bxGeomOf —
// тот же контур, что ляжет на слайд, поэтому значок не разойдётся с фигурой
const DTB_SHAPE_GROUPS = [
  { name: 'Основные', items: ['rect', 'roundRect', 'snip1Rect', 'ellipse', 'triangle', 'rtTriangle', 'diamond', 'parallelogram', 'trapezoid', 'pentagon', 'hexagon', 'octagon', 'plus', 'donut', 'can', 'cube', 'foldedCorner', 'frame', 'heart', 'lightningBolt', 'moon', 'smileyFace', 'cloud', 'pie'] },
  { name: 'Звёзды', items: ['star4', 'star5', 'star6', 'star8', 'star10', 'star12'] },
  { name: 'Стрелки', items: ['rightArrow', 'leftArrow', 'upArrow', 'downArrow', 'leftRightArrow', 'upDownArrow', 'notchedRightArrow', 'chevron', 'homePlate'] },
  { name: 'Выноски', items: ['wedgeRectCallout', 'wedgeRoundRectCallout', 'wedgeEllipseCallout', 'cloudCallout'] },
  { name: 'Скобки', items: ['leftBracket', 'rightBracket', 'leftBrace', 'rightBrace', 'bracketPair', 'bracePair'] },
  { name: 'Математические знаки', items: ['mathPlus', 'mathMinus', 'mathMultiply', 'mathDivide', 'mathEqual', 'mathNotEqual'] },
  { name: 'Блок-схемы', items: ['flowChartProcess', 'flowChartAlternateProcess', 'flowChartDecision', 'flowChartInputOutput', 'flowChartPredefinedProcess', 'flowChartDocument', 'flowChartTerminator', 'flowChartPreparation', 'flowChartManualInput', 'flowChartManualOperation', 'flowChartConnector', 'flowChartOffpageConnector', 'flowChartExtract', 'flowChartMerge', 'flowChartDelay'] }
];
const DTB_SHAPE_NAMES = {
  rect: 'Прямоугольник', roundRect: 'Скруглённый прямоугольник', snip1Rect: 'Прямоугольник со срезанным углом', ellipse: 'Овал',
  triangle: 'Треугольник', rtTriangle: 'Прямоугольный треугольник', diamond: 'Ромб', parallelogram: 'Параллелограмм', trapezoid: 'Трапеция',
  pentagon: 'Пятиугольник', hexagon: 'Шестиугольник', octagon: 'Восьмиугольник', plus: 'Крест', donut: 'Кольцо', can: 'Цилиндр', cube: 'Куб',
  foldedCorner: 'Загнутый угол', frame: 'Рамка', heart: 'Сердце', lightningBolt: 'Молния', moon: 'Месяц', smileyFace: 'Улыбка', cloud: 'Облако',
  pie: 'Сектор',
  star4: 'Звезда 4', star5: 'Звезда 5', star6: 'Звезда 6', star8: 'Звезда 8', star10: 'Звезда 10', star12: 'Звезда 12',
  rightArrow: 'Стрелка вправо', leftArrow: 'Стрелка влево', upArrow: 'Стрелка вверх', downArrow: 'Стрелка вниз', leftRightArrow: 'Двойная стрелка',
  upDownArrow: 'Стрелка вверх-вниз', notchedRightArrow: 'Стрелка с вырезом', chevron: 'Шеврон', homePlate: 'Пятиугольник-стрелка',
  wedgeRectCallout: 'Выноска', wedgeRoundRectCallout: 'Скруглённая выноска', wedgeEllipseCallout: 'Овальная выноска', cloudCallout: 'Выноска-облако',
  leftBracket: 'Левая квадратная скобка', rightBracket: 'Правая квадратная скобка', leftBrace: 'Левая фигурная скобка', rightBrace: 'Правая фигурная скобка',
  bracketPair: 'Квадратные скобки', bracePair: 'Фигурные скобки',
  mathPlus: 'Плюс', mathMinus: 'Минус', mathMultiply: 'Умножение', mathDivide: 'Деление', mathEqual: 'Равно', mathNotEqual: 'Не равно',
  flowChartProcess: 'Процесс', flowChartAlternateProcess: 'Альтернативный процесс', flowChartDecision: 'Решение', flowChartInputOutput: 'Данные',
  flowChartPredefinedProcess: 'Подпрограмма', flowChartDocument: 'Документ', flowChartTerminator: 'Начало / конец', flowChartPreparation: 'Подготовка',
  flowChartManualInput: 'Ручной ввод', flowChartManualOperation: 'Ручная операция', flowChartConnector: 'Соединитель', flowChartOffpageConnector: 'Межстраничный соединитель',
  flowChartExtract: 'Извлечение', flowChartMerge: 'Слияние', flowChartDelay: 'Задержка'
};
const DTB_LINES = [
  { id: 'line', label: 'Линия', icon: '<path d="M4 19L20 5"/>' },
  { id: 'arrow', label: 'Стрелка', icon: '<path d="M4 19L19 6"/><path d="M12.5 6H19v6.5" />' },
  { id: 'elbow', label: 'Соединительная', icon: '<path d="M4 18h7V6h9"/><circle cx="4" cy="18" r="1.4" fill="currentColor" stroke="none"/><circle cx="20" cy="6" r="1.4" fill="currentColor" stroke="none"/>' }
];
const DTB_TABLE_MAX = 8;

// пропорции значка: стрелки вбок — широкие, скобки — узкие
function dtbGeomBox(g){
  if (/^(rightArrow|leftArrow|leftRightArrow|notchedRightArrow|chevron|homePlate)$/.test(g)) return [20, 12];
  if (/^(upArrow|downArrow|upDownArrow|can)$/.test(g)) return [12, 20];
  if (/^(leftBracket|rightBracket|leftBrace|rightBrace)$/.test(g)) return [7, 20];
  if (/^(rect|roundRect|snip1Rect|parallelogram|trapezoid|frame|foldedCorner|wedge|cloudCallout|bracketPair|bracePair|flowChart(Process|AlternateProcess|Decision|InputOutput|PredefinedProcess|Document|Terminator|Preparation|ManualInput|ManualOperation|Delay))/.test(g)) return [20, 14];
  return [19, 19];
}
function dtbGeomSvg(g){
  if (typeof bxGeomOf !== 'function') return '';
  // у выносок хвост по умолчанию выходит за рамку вниз — рамку поднимаем
  const callout = /Callout$/.test(g);
  const [w, h] = callout ? [18, 11] : dtbGeomBox(g), ox = (24 - w) / 2, oy = callout ? 3 : (24 - h) / 2;
  let parts = [];
  try { parts = bxGeomOf({ geom: g }, w, h) || []; } catch (e) { parts = []; }
  const f = v => (Math.round(v * 100) / 100);
  const body = parts.map(sp => {
    const d = (sp.cmds || []).map(k => k[0] === 'Z' ? 'Z' : k[0] + k.slice(1).map((v, i) => f(v + (i % 2 ? oy : ox))).join(' ')).join('');
    return '<path d="' + d + '" fill="' + (sp.fill === false ? 'none' : 'currentColor') + '" fill-opacity=".13" fill-rule="evenodd"' + (sp.stroke === false ? ' stroke="none"' : '') + '/>';
  }).join('');
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">' + body + '</svg>';
}

function dtbBuildPops(){
  const host = document.getElementById('deckFileMenu')?.parentElement || document.body;
  const mk = (id, label) => {
    const p = document.createElement('div');
    p.className = 'dtb-pop';
    p.id = id;
    p.hidden = true;
    p.setAttribute('role', 'menu');
    p.setAttribute('aria-label', label);
    host.appendChild(p);
    return p;
  };
  // фигуры
  const sh = mk('dtbPopShapes', 'Фигуры');
  sh.innerHTML = DTB_SHAPE_GROUPS.map(gr => '<div class="dtb-pop-h">' + gr.name + '</div><div class="dtb-gal">' +
    gr.items.map(g => '<button type="button" role="menuitem" data-geom="' + g + '" title="' + (DTB_SHAPE_NAMES[g] || g) + '">' + dtbGeomSvg(g) +
      '<span class="dtb-cap">' + (DTB_SHAPE_NAMES[g] || g) + '</span></button>').join('') + '</div>').join('');
  sh.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-geom]');
    if (!b) return;
    dtbPopToggle(null);
    dtbArm(b.dataset.geom, 'deckShapesBtn');
  });
  // линии
  const ln = mk('dtbPopLines', 'Линии');
  ln.innerHTML = '<div class="dtb-pop-h">Линии</div><div class="dtb-gal">' + DTB_LINES.map(l =>
    '<button type="button" role="menuitem" data-line="' + l.id + '" title="' + l.label + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    l.icon + '</svg><span class="dtb-cap">' + l.label + '</span></button>').join('') + '</div>';
  ln.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-line]');
    if (!b) return;
    dtbPopToggle(null);
    dtbArm(b.dataset.line, 'deckLinesBtn');
  });
  // таблица: сетка 8 × 8 — навёл и щёлкнул, как в PowerPoint
  const tb = mk('dtbPopTable', 'Таблица');
  let cells = '';
  for (let r = 1; r <= DTB_TABLE_MAX; r++) for (let c = 1; c <= DTB_TABLE_MAX; c++) cells += '<i data-r="' + r + '" data-c="' + c + '"></i>';
  tb.innerHTML = '<div class="dtb-pop-h" id="dtbTblSize">Таблица</div><div class="dtb-tgrid">' + cells + '</div>';
  const hl = (r, c) => {
    tb.querySelectorAll('.dtb-tgrid i').forEach(i => i.classList.toggle('on', +i.dataset.r <= r && +i.dataset.c <= c));
    tb.querySelector('#dtbTblSize').textContent = r && c ? 'Таблица ' + c + ' × ' + r : 'Таблица';
  };
  tb.addEventListener('pointermove', (e) => { const i = e.target.closest('i[data-r]'); if (i) hl(+i.dataset.r, +i.dataset.c); });
  tb.addEventListener('pointerleave', () => hl(0, 0));
  tb.addEventListener('click', (e) => {
    const i = e.target.closest('i[data-r]');
    if (!i) return;
    dtbPopToggle(null);
    dtbInsertTable(+i.dataset.r, +i.dataset.c);
  });
  document.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.dtb-pop, #deckShapesBtn, #deckLinesBtn, #deckTableBtn, #dtbMoreMenu')) return;
    dtbPopToggle(null);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') dtbPopToggle(null); });
}
const DTB_POP_IDS = { shapes: 'dtbPopShapes', lines: 'dtbPopLines', table: 'dtbPopTable' };
const DTB_POP_BTNS = { shapes: 'deckShapesBtn', lines: 'deckLinesBtn', table: 'deckTableBtn' };
function dtbPopToggle(kind, anchor){
  Object.keys(DTB_POP_IDS).forEach(k => {
    const p = document.getElementById(DTB_POP_IDS[k]);
    const open = k === kind && !!p && p.hidden;
    if (!p) return;
    p.hidden = !open;
    document.getElementById(DTB_POP_BTNS[k])?.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!open) return;
    // гибрид (вариант В) — те же галереи, только крупные и с подписями
    p.classList.toggle('big', dtbStyle() === 'hybrid');
    if (k === 'table') p.querySelector('#dtbTblSize').textContent = 'Таблица';
    const r = (anchor || document.getElementById(DTB_POP_BTNS[k])).getBoundingClientRect();
    p.style.left = Math.max(8, Math.min(window.innerWidth - p.offsetWidth - 8, r.left)) + 'px';
    p.style.top = (r.bottom + 8) + 'px';
    p.style.maxHeight = Math.max(160, window.innerHeight - r.bottom - 24) + 'px';
  });
}

// картинка — то же окошко «из буфера / с устройства», что у дока, но под
// кнопкой панели. Щелчок не должен дойти до document: там окошко закрывается
function dtbImage(e){
  const pop = document.getElementById('bdImgSrcPop'), btn = document.getElementById('dtb-image');
  if (!pop) return;
  if (e) e.stopPropagation();
  const a = btn && !btn.classList.contains('dtb-off') ? btn : document.getElementById('dtbMoreBtn');
  const r = (a || btn).getBoundingClientRect();
  pop.style.left = Math.max(6, Math.min(r.left, window.innerWidth - 230)) + 'px';
  pop.style.top = (r.bottom + 8) + 'px';
  pop.style.bottom = 'auto';
  pop.classList.toggle('open');
}

// таблица выбранного размера: создаёт bxInsert (один шаг отмены, поле
// правки в первой ячейке), а строки и столбцы меняем сразу, до открытия поля
function dtbInsertTable(rows, cols){
  if (!dtbCanInsert() || typeof deckInsertAt !== 'function') return null;
  const o = deckInsertAt('table');
  if (!o) return null;
  const hdr = o.cells[0][0], body = o.cells[1][0];
  const s = deckCur(), sr = s ? deckSlideRect(s) : { x: 0, y: 0, w: 1600, h: 900 };
  const cw = Math.round(Math.min(200, sr.w * 0.86 / cols)), rh = 56;
  const clone = (x) => JSON.parse(JSON.stringify(x));
  o.cols = Array.from({ length: cols }, () => cw);
  o.rows = Array.from({ length: rows }, () => rh);
  o.cells = o.rows.map((_, r) => o.cols.map(() => clone(r === 0 ? hdr : body)));
  o.w = cw * cols; o.h = rh * rows;
  o.points = [{ x: sr.x + sr.w / 2 - o.w / 2, y: sr.y + sr.h / 2 - o.h / 2 }];
  saveDB(); scheduleRedraw();
  return o;
}

/* Вставка протяжкой. Выбрали фигуру, линию или «Надпись» — курсор-крестик;
   протянули по слайду — объект этого размера (с Shift — пропорционально,
   линия — под углом, кратным 45°), просто щелчок — размер по умолчанию.
   Объект создаёт bxInsert (pushUndo — один шаг отмены, сразу «рука»),
   размер ставим сразу после. Нажатие перехватываем на window в фазе
   захвата: иначе первым его получил бы инструмент доски (перо нарисовало
   бы точку). Esc, правая кнопка или щелчок мимо слайда — отмена */
let dtbPlace = null;      // { kind, btnId } — что вставляем
let dtbDrag = null;       // { x0, y0, x1, y1, id } — протяжка, экранные координаты
const DTB_LINE_GEOM = { line: 'line', arrow: 'straightConnector1', elbow: 'bentConnector3' };
function dtbArm(kind, btnId){
  if (!dtbCanInsert()) return;
  if (dtbPlace && dtbPlace.kind === kind){ dtbDisarm(); return; }
  dtbDisarm();
  // выделение снимаем: его панель оформления (.bx-bar) лежит поверх слайда и
  // перехватила бы нажатие — вставка отменилась бы щелчком «мимо»
  if (typeof selectedId !== 'undefined' && (selectedId || multiSelectIds.length)){
    selectedId = null; multiSelectIds = [];
    if (typeof updateContextMenu === 'function') updateContextMenu();
    // панель прячем сразу, не дожидаясь кадра: щелчок по слайду может
    // прийти раньше перерисовки
    if (typeof bxSelectionTick === 'function') bxSelectionTick();
    scheduleRedraw();
  }
  dtbPlace = { kind, btnId };
  document.documentElement.classList.add('dtb-placing');
  document.getElementById(btnId)?.setAttribute('aria-pressed', 'true');
  if (typeof deckToast === 'function') deckToast('Протяните рамку по слайду или щёлкните. Esc — отмена');
}
function dtbDisarm(){
  if (dtbPlace) document.getElementById(dtbPlace.btnId)?.removeAttribute('aria-pressed');
  dtbPlace = null; dtbDrag = null;
  document.documentElement.classList.remove('dtb-placing');
  const g = document.getElementById('dtbGhost');
  if (g) g.remove();
}
function dtbCanvasPt(x, y){
  const cv = document.getElementById('boardCv'), r = cv.getBoundingClientRect();
  return screenToWorld(x - r.left, y - r.top);
}
// линия с Shift — угол, кратный 45°
function dtbSnap45(x0, y0, x1, y1){
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
  const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
  return { x: x0 + L * Math.cos(a), y: y0 + L * Math.sin(a) };
}
// рамка протяжки (экранная) с учётом Shift
function dtbDragRect(d, shift, isLine){
  let x1 = d.x1, y1 = d.y1;
  if (isLine && shift){ const p = dtbSnap45(d.x0, d.y0, x1, y1); x1 = p.x; y1 = p.y; }
  else if (shift){
    const m = Math.max(Math.abs(x1 - d.x0), Math.abs(y1 - d.y0));
    x1 = d.x0 + Math.sign(x1 - d.x0 || 1) * m; y1 = d.y0 + Math.sign(y1 - d.y0 || 1) * m;
  }
  return { x0: d.x0, y0: d.y0, x1, y1 };
}
function dtbGhostDraw(d, shift){
  let g = document.getElementById('dtbGhost');
  if (!g){
    g = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    g.id = 'dtbGhost';
    document.body.appendChild(g);
  }
  const isLine = !!DTB_LINE_GEOM[dtbPlace.kind], r = dtbDragRect(d, shift, isLine);
  g.innerHTML = isLine
    ? '<line x1="' + r.x0 + '" y1="' + r.y0 + '" x2="' + r.x1 + '" y2="' + r.y1 + '"/>'
    : '<rect x="' + Math.min(r.x0, r.x1) + '" y="' + Math.min(r.y0, r.y1) + '" width="' + Math.abs(r.x1 - r.x0) + '" height="' + Math.abs(r.y1 - r.y0) + '"/>';
}
function dtbPlaceObject(kind, d, shift){
  const isLine = !!DTB_LINE_GEOM[kind];
  const sr = dtbDragRect(d, shift, isLine);
  const click = Math.hypot(sr.x1 - sr.x0, sr.y1 - sr.y0) < 6;
  let a = dtbCanvasPt(sr.x0, sr.y0), b = dtbCanvasPt(sr.x1, sr.y1);
  if (isLine){
    // щелчок — линия по умолчанию, вбок от точки щелчка
    if (click){ a = { x: a.x - 160, y: a.y }; b = { x: a.x + 320, y: a.y }; }
    const o = bxInsert(DTB_LINE_GEOM[kind], { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    if (!o) return null;
    o.w = Math.max(0.01, Math.abs(b.x - a.x)); o.h = Math.max(0.01, Math.abs(b.y - a.y));
    o.flipH = b.x < a.x || undefined; o.flipV = b.y < a.y || undefined;
    o.points = [{ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y) }];
    if (kind === 'arrow' && o.line) o.line.te = 'triangle';
    saveDB(); scheduleRedraw();
    return o;
  }
  if (click) return bxInsert(kind, a);
  const w = Math.max(8, Math.abs(b.x - a.x)), h = Math.max(8, Math.abs(b.y - a.y));
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  const o = bxInsert(kind, { x: x + w / 2, y: y + h / 2 });
  if (!o) return null;
  o.w = w;
  // у надписи высота растёт под текст (fit: grow) — меньше строки не делаем
  o.h = kind === 'text' ? Math.max(o.h, h) : h;
  o.points = [{ x, y }];
  saveDB(); scheduleRedraw();
  return o;
}
function dtbPlaceInit(){
  const stop = (e) => { e.preventDefault(); e.stopImmediatePropagation(); };
  window.addEventListener('pointerdown', (e) => {
    if (!dtbPlace) return;
    const cv = document.getElementById('boardCv');
    if (e.target !== cv){
      // свои кнопки и галереи не отменяют — по ним выбирают другое
      if (!e.target.closest('#deckNav, .dtb-pop, #dtbMoreMenu')) dtbDisarm();
      return;
    }
    if (e.button){ stop(e); dtbDisarm(); return; }
    stop(e);
    dtbDrag = { x0: e.clientX, y0: e.clientY, x1: e.clientX, y1: e.clientY, id: e.pointerId };
  }, true);
  window.addEventListener('pointermove', (e) => {
    if (!dtbPlace || !dtbDrag || e.pointerId !== dtbDrag.id) return;
    stop(e);
    dtbDrag.x1 = e.clientX; dtbDrag.y1 = e.clientY;
    dtbGhostDraw(dtbDrag, e.shiftKey);
  }, true);
  const end = (e) => {
    if (!dtbPlace || !dtbDrag || e.pointerId !== dtbDrag.id) return;
    stop(e);
    dtbDrag.x1 = e.clientX; dtbDrag.y1 = e.clientY;
    const kind = dtbPlace.kind, d = dtbDrag;
    dtbDisarm();
    if (e.type === 'pointerup') dtbPlaceObject(kind, d, e.shiftKey);
  };
  window.addEventListener('pointerup', end, true);
  window.addEventListener('pointercancel', end, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && dtbPlace) dtbDisarm(); });
}

/* Настройки досок (шестерёнка «Настройки листа»): вид панели презентации.
   Пункт виден только в презентации (CSS по html.deck-mode). «Гибрид» (№102)
   — та же строка с крупными галереями; «Лента» выбирается и запоминается,
   но пока показывается одна строка. Вид меняет только раскладку, не данные
   доски, поэтому ученик и совместная сессия от него не зависят */
function dtbBuildSettings(){
  const pop = document.getElementById('bdSettingsPop');
  if (!pop || document.getElementById('dtbStyleRow')) return;
  const row = document.createElement('div');
  row.className = 'bd-set-row bd-set-row-wrap dtb-set';
  row.id = 'dtbStyleRow';
  row.innerHTML = '<label>Вид панели презентации</label><div class="bd-set-btnrow dtb-set-btns">' +
    DTB_STYLES.map(s => '<button type="button" data-dtbstyle="' + s.id + '" title="' + s.title + '">' + s.label +
      (s.soon ? '<small class="dtb-soon">скоро</small>' : '') + '</button>').join('') + '</div>';
  const note = document.createElement('div');
  note.className = 'bd-set-note dtb-set';
  note.id = 'dtbStyleNote';
  pop.appendChild(row);
  pop.appendChild(note);
  row.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-dtbstyle]');
    if (!b) return;
    try { localStorage.setItem(DTB_STYLE_KEY, b.dataset.dtbstyle); } catch (er) {}
    deckTbSync();
  });
}
function dtbSyncSettings(){
  const st = dtbStyle();
  document.querySelectorAll('#dtbStyleRow [data-dtbstyle]').forEach(b => b.classList.toggle('active', b.dataset.dtbstyle === st));
  const note = document.getElementById('dtbStyleNote');
  const s = DTB_STYLES.find(x => x.id === st);
  if (note) note.textContent = s && s.soon
    ? '«' + s.label + '» запомнили — она появится в одном из следующих обновлений, пока панель в одну строку.'
    : st === 'hybrid'
      ? 'Фигуры, линии и таблица открываются крупными галереями с подписями.'
      : 'Панель сворачивается кнопкой справа или двойным щелчком по её пустому месту.';
}

function dtbInjectStyle(){
  if (document.getElementById('dtbStyle')) return;
  const st = document.createElement('style');
  st.id = 'dtbStyle';
  st.textContent = [
    '.deck-nav.dtb{gap:0;padding:5px;max-width:calc(100vw - 24px)}',
    '.dtb .dtb-grp{display:inline-flex;align-items:center;gap:2px;padding:0 5px}',
    '.dtb .dtb-grp[hidden]{display:none}',
    // разделитель — рамка слева у каждой видимой группы, кроме первой
    '.dtb .dtb-grp:not([hidden]) ~ .dtb-grp:not([hidden]),.dtb .dtb-grp:not([hidden]) ~ .dtb-tail{border-left:1px solid var(--glass-border)}',
    '.dtb .dtb-tail{display:inline-flex;align-items:center;gap:2px;padding:0 0 0 5px}',
    '.dtb .dtb-off{display:none!important}',
    '.dtb .deck-nav-btn[hidden]{display:none}',
    '.dtb .dtb-btn{gap:2px}',
    '.dtb .dtb-btn.wide{gap:6px}',
    '.dtb .dtb-lbl{font-size:13px}',
    '.dtb .deck-nav-btn svg.dtb-caret{width:12px;height:12px;margin-left:1px;opacity:.6}',
    '.dtb .deck-lesson-btns{gap:2px}',
    // свёрнута — тонкая полоска с одной кнопкой «⌄» (шире, чем выше: deckArea
    // по форме считает её верхней панелью)
    '.deck-nav.dtb.dtb-closed{padding:1px 14px;border-radius:12px}',
    '.dtb.dtb-closed .dtb-grp,.dtb.dtb-closed #dtbMoreBtn{display:none!important}',
    '.dtb.dtb-closed .dtb-tail{padding:0;border-left:none!important}',
    '.dtb.dtb-closed #dtbFoldBtn{height:22px;min-width:44px}',
    // №102: галереи вставки
    '.dtb-pop{position:fixed;z-index:420;padding:8px 10px 10px;border-radius:14px;background:var(--glass-strong);backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);border:1px solid var(--glass-border);box-shadow:var(--shadow);overflow:auto;width:max-content;max-width:min(340px,calc(100vw - 16px))}',
    '.dtb-pop[hidden]{display:none}',
    '.dtb-pop-h{font-family:var(--font-ui);font-size:11.5px;font-weight:600;color:var(--muted-2);margin:6px 2px 4px}',
    '.dtb-pop-h:first-child{margin-top:0}',
    '.dtb-gal{display:grid;grid-template-columns:repeat(9,32px);gap:2px}',
    '.dtb-gal button{width:32px;height:32px;border:none;border-radius:8px;background:transparent;color:var(--ink);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0}',
    '.dtb-gal button:hover{background:var(--hover-2)}',
    '.dtb-gal button svg{width:22px;height:22px;flex:none}',
    '.dtb-gal .dtb-cap{display:none}',
    // гибрид (вариант В): крупные значки с подписями
    '.dtb-pop.big{max-width:min(560px,calc(100vw - 16px))}',
    '.dtb-pop.big .dtb-gal{grid-template-columns:repeat(6,82px);gap:4px}',
    '.dtb-pop.big .dtb-gal button{width:82px;height:70px;flex-direction:column;gap:4px;padding:4px 2px}',
    '.dtb-pop.big .dtb-gal button svg{width:34px;height:34px}',
    '.dtb-pop.big .dtb-cap{display:block;font-family:var(--font-ui);font-size:10.5px;line-height:1.15;color:var(--muted-3);text-align:center;max-width:78px;overflow:hidden;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}',
    '.dtb-tgrid{display:grid;grid-template-columns:repeat(8,18px);gap:3px}',
    '.dtb-pop.big .dtb-tgrid{grid-template-columns:repeat(8,26px)}',
    // клетки — полупрозрачным серым: на «стекле» белая клетка с рамкой стекла не видна
    '.dtb-tgrid i{display:block;height:18px;border:1px solid rgba(127,127,127,.38);border-radius:3px;background:rgba(127,127,127,.07);cursor:pointer}',
    '.dtb-pop.big .dtb-tgrid i{height:26px}',
    '.dtb-tgrid i.on{background:var(--hl-10);border-color:var(--ink)}',
    // вставка протяжкой: крестик и рамка
    'html.dtb-placing #boardCv{cursor:crosshair!important}',
    '#dtbGhost{position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:430;overflow:visible}',
    '#dtbGhost rect,#dtbGhost line{fill:rgba(68,114,196,.08);stroke:#4472C4;stroke-width:1.5;stroke-dasharray:5 4}',
    // пункт настроек — только в презентации
    'html:not(.deck-mode) .dtb-set{display:none}',
    // подпись над кнопками: три варианта в одну строку рядом с ней не влезают
    '.bd-set-row.dtb-set{flex-direction:column;align-items:stretch;gap:6px}',
    '.dtb-set-btns button{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;line-height:1.15}',
    '.dtb-soon{font-size:9.5px;font-weight:600;opacity:.6;text-transform:uppercase;letter-spacing:.04em}'
  ].join('\n');
  document.head.appendChild(st);
}

// модуль мог догрузиться уже после открытия презентации (deckModuleReady
// смотрит только на deck-core.js) — подхватываем текущее состояние сразу
deckTbSync();
