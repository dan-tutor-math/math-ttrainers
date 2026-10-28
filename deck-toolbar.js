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
  { id: 'ribbon', label: 'Лента', title: 'Вкладки и крупные значки с подписями, как в PowerPoint' },
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
  order: '<rect x="3.5" y="9.5" width="11" height="10" rx="1.8"/><path d="M8.5 9.5V6a1.5 1.5 0 0 1 1.5-1.5h8.5A1.5 1.5 0 0 1 20 6v8.5a1.5 1.5 0 0 1-1.5 1.5h-4" />',
  styles: '<rect x="3.5" y="4" width="10" height="7" rx="1.6" fill="currentColor" fill-opacity=".25"/><rect x="10.5" y="13" width="10" height="7" rx="1.6"/><path d="M6 15.5h2.5M6 18.5h2.5" stroke-width="1.4"/>',
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
   short — подпись под значком в ленте (№107), ribbonOnly — кнопка только в ленте,
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
  // №103: оформление выделенного — та же панель .bx-bar (board-boxes.js),
  // вставленная в полосу; рядом — порядок, поворот, выравнивание, группа, стили
  { id: 'format', group: 'format', node: 'deckFmtBar', label: 'Оформление', keep: true },
  // порядок, поворот, выравнивание и группа — одним меню «Упорядочить», как
  // в Google Slides: отдельными значками полоса не влезала вместе со вставкой
  { id: 'arrange', group: 'arrange', icon: 'order', label: 'Упорядочить', title: 'Порядок, поворот, выравнивание, группа', prio: 4, pop: 'arrange', btnId: 'deckArrangeBtn',
    sel: true, enabled: () => dtbSel().length > 0 },
  { id: 'styles', group: 'arrange', icon: 'styles', label: 'Стили', title: 'Быстрые стили фигуры', prio: 3, pop: 'styles', btnId: 'deckStylesBtn',
    sel: true, enabled: () => dtbSel().some(dtbStylable) },
  { id: 'slide', group: 'slide', node: 'deckSlideBtn', label: 'Слайд', prio: 5 },
  { id: 'file', group: 'slide', node: 'deckFileBtn', label: 'Файл', prio: 5 },
  { id: 'mode', group: 'mode', node: 'deckModeSeg', label: 'Конструктор / Урок', keep: true },
  { id: 'prev', group: 'nav', node: 'deckPrev', label: 'Предыдущий слайд', keep: true },
  { id: 'no', group: 'nav', node: 'deckNo', label: 'Номер слайда', keep: true },
  { id: 'next', group: 'nav', node: 'deckNext', label: 'Следующий слайд', keep: true },
  { id: 'flowV', group: 'flow', short: 'По одному', node: 'deckFlowV', label: 'Листать вверх и вниз', prio: 1 },
  { id: 'flowS', group: 'flow', short: 'Сплошная', node: 'deckFlowS', label: 'Сплошная прокрутка', prio: 1 },
  { id: 'flowH', group: 'flow', short: 'Вбок', node: 'deckFlowH', label: 'Листать вбок', prio: 1 },
  { id: 'clear', group: 'lesson', node: 'deckClearNotes', label: 'Очистить пометки', prio: 6 },
  { id: 'copy', group: 'lesson', node: 'deckCopyBtn', label: 'Копия урока', prio: 5 },
  // №105: показ с текущего слайда (F5 — с начала, Shift+F5 — с текущего)
  // №107: в ленте на вкладке «Показ» — две кнопки, как в PowerPoint
  { id: 'showFirst', group: 'show', icon: 'show', label: 'С начала', title: 'Показ с первого слайда (F5)', ribbonOnly: true,
    run: () => dtbShowStart(true) },
  { id: 'show', group: 'show', icon: 'show', label: 'Показ', short: 'С текущего', title: 'Показ слайдов на всю вкладку (F5 — с начала, Shift+F5 — с текущего)', prio: 3, wide: true,
    run: () => dtbShowStart(false) }
];
// раскладка «одна строка» (вариант Б): порядок групп слева направо
const DTB_LINE_GROUPS = ['insert', 'format', 'arrange', 'slide', 'mode', 'nav', 'flow', 'lesson', 'show'];
// №103: пока что-то выделено, правая часть полосы — оформление; эти группы
// прячутся (листание ‹ N › остаётся — слайд можно перелистнуть и с выделением)
const DTB_FMT_HIDE = ['slide', 'mode', 'flow', 'lesson', 'show'];
function dtbFmtOn(){ return !!document.getElementById('deckNav')?.classList.contains('dtb-fmt'); }

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
  if (dtbStyle() === 'ribbon'){ if (!dtbFmtOn() && (c.group === 'format' || c.group === 'arrange')) return false; }
  else if (dtbFmtOn() ? DTB_FMT_HIDE.includes(c.group) : (c.group === 'format' || c.group === 'arrange')) return false;
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
  // панель оформления строит board-boxes.js (лениво) — строим сразу и даём id,
  // чтобы реестр нашёл её как узел
  if (typeof bxBuildBar === 'function'){ const bar = bxBuildBar(); bar.id = 'deckFmtBar'; dtbCompactBar(bar); }
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
      // подпись: у «широких» видна всегда, у остальных — только в ленте (dtb-lbl-r)
      el.innerHTML = dtbSvg(c.icon) + (c.wide ? '<span class="dtb-lbl">' + (c.short ? '<span class="dtb-lbl-l">' + c.label + '</span><span class="dtb-lbl-r">' + c.short + '</span>' : c.label) + '</span>'
        : '<span class="dtb-lbl-r">' + (c.short || c.label) + '</span>') + (c.pop ? dtbSvg('caret', 'dtb-caret') : '');
      if (c.pop){ el.setAttribute('aria-haspopup', 'menu'); el.setAttribute('aria-expanded', 'false'); }
      el.addEventListener('click', (e) => dtbRun(c, e));
    }
    if (!el) return;
    el.dataset.cmd = c.id;
    // у готовых кнопок-значков (режимы ленты) подписи нет — для ленты добавляем
    if (c.node && c.short && el.tagName === 'BUTTON' && !el.querySelector('.dtb-lbl-r')) el.insertAdjacentHTML('beforeend', '<span class="dtb-lbl-r">' + c.short + '</span>');
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
  dtbBuildRibbon(nav);
  dtbBuildSettings();
  dtbBuildPops();
  dtbBuildArrangePops();
  dtbBuildSlideMenu();
  dtbPlaceInit();
  dtbShowInit();
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
  dtbDockBar(on);
  if (!on){ nav.hidden = true; dtbMoreToggle(false); return; }
  nav.hidden = false;
  dtbSelSig = null; deckTbSelTick();
  const open = dtbOpen();
  nav.classList.toggle('dtb-closed', !open);
  nav.dataset.style = dtbStyle();
  dtbApplyStyle(nav);
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
    const fmt = nav.classList.contains('dtb-fmt'), gg = g.dataset.g;
    // лента: видны группы активной вкладки (их и так немного — без «⋯»)
    if (nav.classList.contains('dtb-ribbon')){ const t = dtbTabOf(gg); g.hidden = !any || !t || t.id !== dtbCurTab(); return; }
    g.hidden = !any || (fmt ? DTB_FMT_HIDE.includes(gg) : (gg === 'format' || gg === 'arrange'));
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
  // лента — во всю ширину свободного места, как в PowerPoint; кнопкам
  // вкладки места хватает, лишнее переносится на вторую строку
  nav.style.width = nav.classList.contains('dtb-ribbon') ? avail + 'px' : '';
  if (nav.classList.contains('dtb-closed') || nav.classList.contains('dtb-ribbon')) return;
  // ширину меряем по содержимому (scrollWidth): сама полоса ограничена
  // max-width и шире экрана не станет, даже когда кнопки уже не влезают
  const wide = () => nav.scrollWidth + 2 > Math.min(avail, nav.clientWidth + 2) || nav.getBoundingClientRect().width > avail;
  if (!wide()) return;
  if (more) more.hidden = false;
  // пока что-то выделено, вставка нужна меньше оформления — уходит первой
  const fmt = nav.classList.contains('dtb-fmt');
  const pr = (c) => (c.prio || 0) - (fmt && c.group === 'insert' ? 10 : 0);
  const order = DECK_CMDS.filter(c => !c.keep && dtbAvailable(c)).sort((a, b) => pr(a) - pr(b));
  for (const c of order){
    if (!wide()) break;
    dtbCmdEl(c)?.classList.add('dtb-off');
    syncGroups();
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   №107: вариант А — «Лента», как в PowerPoint. Те же группы и кнопки, что
   у строки (реестр один), только разложены по вкладкам: строка вкладок
   (.dtb-tabrow) и под ней панель (.dtb-panel) с группами активной вкладки.
   Переключение вида переносит группы между полосой и панелью, ничего не
   пересоздавая — обработчики и состояние кнопок остаются прежними.
   Свёрнута — видна только строка вкладок; щелчок по вкладке открывает её
   поверх слайда (.dtb-peek), команда или щелчок мимо — прячет. Место под
   слайд (deckArea) считается по самой полосе, а раскрытая поверх панель
   стоит absolute и в расчёт не попадает — слайд не прыгает
   ═══════════════════════════════════════════════════════════════════════ */
const DTB_TABS = [
  { id: 'home', label: 'Главная', groups: ['slide', 'mode', 'nav', 'flow', 'lesson'] },
  { id: 'insert', label: 'Вставка', groups: ['insert'] },
  { id: 'format', label: 'Формат', groups: ['format', 'arrange'], ctx: true },
  { id: 'show', label: 'Показ', groups: ['show'] }
];
const DTB_TAB_KEY = 'boardsDeckRibbonTab';
let dtbTab = 'home', dtbTabBack = null;
try { const t = localStorage.getItem(DTB_TAB_KEY); if (t && t !== 'format' && DTB_TABS.some(x => x.id === t)) dtbTab = t; } catch (e) {}
function dtbTabOf(g){ return DTB_TABS.find(t => t.groups.includes(g)) || null; }
// «Формат» есть, только пока что-то выделено
function dtbCurTab(){ return dtbTab === 'format' && !dtbFmtOn() ? (dtbTabBack || 'home') : dtbTab; }

function dtbBuildRibbon(nav){
  const row = document.createElement('div');
  row.className = 'dtb-tabrow';
  row.innerHTML = '<div class="dtb-tabs" role="tablist" aria-label="Вкладки панели">' + DTB_TABS.map(t =>
    '<button type="button" role="tab" class="dtb-tab' + (t.ctx ? ' ctx' : '') + '" data-tab="' + t.id + '" aria-selected="false">' + t.label + '</button>').join('') + '</div>';
  const panel = document.createElement('div');
  panel.className = 'dtb-panel';
  row.hidden = panel.hidden = true;
  nav.prepend(panel);
  nav.prepend(row);
  row.addEventListener('click', (e) => {
    const b = e.target.closest('.dtb-tab');
    if (!b) return;
    const id = b.dataset.tab;
    // свёрнутая лента: та же вкладка второй раз — спрятать, другая — показать её
    const peek = nav.classList.contains('dtb-closed');
    if (peek && nav.classList.contains('dtb-peek') && dtbCurTab() === id){ dtbPeek(false); return; }
    dtbTab = id; dtbTabBack = id === 'format' ? dtbTabBack : null;
    if (id !== 'format') try { localStorage.setItem(DTB_TAB_KEY, id); } catch (er) {}
    dtbSyncTabs();
    if (peek) dtbPeek(true);
  });
  // двойной щелчок по вкладке — свернуть или закрепить ленту (как в PowerPoint)
  row.addEventListener('dblclick', (e) => { if (e.target.closest('.dtb-tab')){ dtbPeek(false); dtbSetOpen(!dtbOpen()); } });
  // команда в раскрытой поверх панели выполнена — панель прячется; галереи
  // (кнопки с «▾») открываются под ней, поэтому их не трогаем
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || !nav.classList.contains('dtb-peek') || b.getAttribute('aria-haspopup') || b.closest('.bx-bar')) return;
    setTimeout(() => dtbPeek(false), 0);
  });
  document.addEventListener('pointerdown', (e) => {
    if (!nav.classList.contains('dtb-peek')) return;
    if (e.target.closest('#deckNav, .dtb-pop, #dtbMoreMenu, .deck-menu, .deck-pop, .bx-pal')) return;
    dtbPeek(false);
  });
}
function dtbPeek(on){
  const nav = document.getElementById('deckNav');
  if (nav) nav.classList.toggle('dtb-peek', !!on && nav.classList.contains('dtb-closed'));
}
// раскладка по виду: лента — группы в панель под вкладками; строка и гибрид
// — группы прямо в полосе, перед хвостом («⋯», свернуть)
function dtbApplyStyle(nav){
  const ribbon = dtbStyle() === 'ribbon';
  const row = nav.querySelector('.dtb-tabrow'), panel = nav.querySelector('.dtb-panel'), tail = nav.querySelector('.dtb-tail');
  if (!row || !panel || !tail) return;
  const was = nav.classList.contains('dtb-ribbon');
  if (ribbon !== was){
    const groups = DTB_LINE_GROUPS.map(g => nav.querySelector('.dtb-grp[data-g="' + g + '"]')).filter(Boolean);
    if (ribbon){ groups.forEach(g => panel.appendChild(g)); row.appendChild(tail); }
    else { nav.appendChild(tail); groups.forEach(g => nav.insertBefore(g, tail)); }
    row.hidden = panel.hidden = !ribbon;
    nav.classList.toggle('dtb-ribbon', ribbon);
    dtbPeek(false);
    // высота полосы другая — слайд вписывается заново
    requestAnimationFrame(() => { if (typeof deckStripRefit === 'function') deckStripRefit(); });
  }
  DECK_CMDS.forEach(c => { if (c.ribbonOnly){ const el = dtbCmdEl(c); if (el) el.hidden = !ribbon; } });
  dtbSyncTabs();
}
function dtbSyncTabs(){
  const nav = document.getElementById('deckNav');
  if (!nav || !nav.classList.contains('dtb-ribbon')) return;
  const cur = dtbCurTab(), fmt = dtbFmtOn();
  nav.querySelectorAll('.dtb-tab').forEach(b => {
    b.hidden = b.dataset.tab === 'format' && !fmt;
    b.setAttribute('aria-selected', b.dataset.tab === cur ? 'true' : 'false');
  });
  dtbScheduleLayout();
  dtbLayout();
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
    if (e.target.closest('.dtb-pop, #deckNav [aria-haspopup="menu"], #dtbMoreMenu')) return;
    dtbPopToggle(null);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') dtbPopToggle(null); });
}
// №104: «slide» дописывает dtbBuildSlideMenu
const DTB_POP_IDS = { shapes: 'dtbPopShapes', lines: 'dtbPopLines', table: 'dtbPopTable', arrange: 'dtbPopArrange', styles: 'dtbPopStyles' };
const DTB_POP_BTNS = { shapes: 'deckShapesBtn', lines: 'deckLinesBtn', table: 'deckTableBtn', arrange: 'deckArrangeBtn', styles: 'deckStylesBtn' };
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
    if (k === 'arrange') dtbSyncArrangeMenu();
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

/* ═══════════════════════════════════════════════════════════════════════
   №103 (шаг 3 плана): оформление выделенного — в полосе, а не плавающей
   панелью над объектом. Сама панель — прежняя .bx-bar из board-boxes.js
   (все её кнопки, состояние и обработчики остаются там): в презентации она
   переезжает в группу «format» полосы и стоит на месте (bxBarFollow её не
   двигает, пока у неё data-docked). На обычной доске — плавает, как была
   ═══════════════════════════════════════════════════════════════════════ */

// редкие кнопки панели — в выпадающие списки, чтобы оформление влезло в одну
// строку. Кнопки переносятся ВНУТРЬ .bx-bar (в меню-обёртку), поэтому щелчок
// по ним по-прежнему ловит обработчик панели, а bxBarState их находит.
// На обычной доске (панель не в полосе) обёртки «прозрачны» — display:contents
const DTB_BAR_DD = [
  { key: 'more', label: 'Ещё', title: 'Зачёркнутый, индексы', items: ['s', 'sup', 'sub'] },
  { key: 'al', icon: 'al', title: 'Выравнивание текста', items: ['al-l', 'al-c', 'al-r', 'al-j', 'an-t', 'an-m', 'an-b'] },
  { key: 'list', icon: 'bul', title: 'Списки и отступы', items: ['bul', 'num', 'out', 'ind'] },
  { key: 'tbl', label: 'Строки', title: 'Строки и столбцы таблицы', items: ['row+', 'col+', 'row-', 'col-'], attr: 'data-table' }
];
const DTB_BAR_ICONS = {
  fill: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><path d="M5 11.5L11.5 5l7 7-6.5 6.5a1.5 1.5 0 0 1-2.1 0L5 13.6a1.5 1.5 0 0 1 0-2.1z"/><path d="M8.5 3.5L11.5 5M5.3 12h12.8"/><path d="M20 15.5s1.5 1.9 1.5 2.9a1.5 1.5 0 0 1-3 0c0-1 1.5-2.9 1.5-2.9z"/></svg>',
  line: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><path d="M15.5 4.5l4 4L9 19l-5 1 1-5z"/><path d="M13 7l4 4"/></svg>'
};
function dtbCompactBar(bar){
  if (bar.dataset.compact) return;
  bar.dataset.compact = '1';
  // «Заливка» и «Контур» — значком с образцом цвета: слова занимали полстроки
  ['fill', 'line'].forEach(k => {
    const b = bar.querySelector('[data-bx="' + k + '"]');
    if (!b) return;
    [...b.childNodes].forEach(n => { if (n.nodeType === 3) n.remove(); });
    b.insertAdjacentHTML('afterbegin', DTB_BAR_ICONS[k]);
  });
  DTB_BAR_DD.forEach(d => {
    const btns = d.items.map(k => bar.querySelector('[data-bx="' + k + '"]')).filter(Boolean);
    if (!btns.length) return;
    const dd = document.createElement('span');
    dd.className = 'dtb-dd';
    dd.dataset.dd = d.key;
    if (d.attr) dd.setAttribute(d.attr, '');
    let face = d.label || '';
    if (d.icon && typeof BX_ICON !== 'undefined') face = d.icon === 'al' ? BX_ICON.al.l : BX_ICON[d.icon];
    dd.innerHTML = '<button type="button" class="dtb-dd-btn" title="' + d.title + '" aria-haspopup="menu" aria-expanded="false">' + face + dtbSvg('caret', 'dtb-caret') + '</button><span class="dtb-dd-menu" role="menu"></span>';
    btns[0].before(dd);
    const menu = dd.querySelector('.dtb-dd-menu');
    btns.forEach(b => {
      // у кнопки в меню — подпись словами: значок без слов в списке непонятен
      if (!b.querySelector('.dtb-dd-lbl')) b.insertAdjacentHTML('beforeend', '<span class="dtb-dd-lbl">' + (b.title || '').replace(/ \(.*\)$/, '') + '</span>');
      menu.appendChild(b);
    });
    // таблица прячет свои кнопки атрибутом hidden (bxShowBar) — обёртку
    // прячет он же, если у неё тот же атрибут
    dd.querySelector('.dtb-dd-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const open = !dd.classList.contains('open');
      dtbBarDdClose();
      if (!open) return;
      dd.classList.add('open');
      dd.querySelector('.dtb-dd-btn').setAttribute('aria-expanded', 'true');
      const r = dd.getBoundingClientRect();
      menu.style.left = Math.max(8, Math.min(window.innerWidth - 240, r.left)) + 'px';
      menu.style.top = (r.bottom + 8) + 'px';
    });
    menu.addEventListener('click', (e) => { if (e.target.closest('button[data-bx]')) setTimeout(dtbBarDdClose, 0); });
  });
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.dtb-dd')) dtbBarDdClose(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') dtbBarDdClose(); });
}
function dtbBarDdClose(){
  document.querySelectorAll('.dtb-dd.open').forEach(d => { d.classList.remove('open'); d.querySelector('.dtb-dd-btn')?.setAttribute('aria-expanded', 'false'); });
}
// в презентации — в полосу, на обычной доске — обратно плавать
function dtbDockBar(on){
  const bar = document.getElementById('deckFmtBar');
  if (!bar) return;
  if (on){
    const g = document.querySelector('#deckNav .dtb-grp[data-g="format"]');
    if (g && bar.parentElement !== g) g.appendChild(bar);
    bar.dataset.docked = '1';
    bar.style.left = ''; bar.style.top = '';
  } else if (bar.dataset.docked){
    delete bar.dataset.docked;
    dtbBarDdClose();
    (typeof bxHost === 'function' ? bxHost() : document.body).appendChild(bar);
  }
}

// выделенное, которое можно править: без служебного объекта слайдов, подложки
// и заготовки в «Уроке» (mayTouch)
function dtbSel(){
  if (typeof getSelectedObjects !== 'function' || typeof B === 'undefined' || !B) return [];
  return getSelectedObjects().filter(o => o && o.type !== 'deck' && !o.bgOf && (typeof mayTouch !== 'function' || mayTouch(o)));
}
function dtbRotatable(o){
  return o.type === 'box' || o.type === 'table' || (o.type === 'image' && typeof bxMayRotateImage === 'function' && bxMayRotateImage(o));
}
function dtbStylable(o){ return o.type === 'box'; }
// «единицы» для выравнивания: группа целиком (если выделена вся) или объект
function dtbUnits(sel){
  const units = [], byG = new Map();
  sel.forEach(o => {
    if (o.groupId){
      if (!byG.has(o.groupId)){ const u = []; byG.set(o.groupId, u); units.push(u); }
      byG.get(o.groupId).push(o);
    } else units.push([o]);
  });
  return units;
}
function dtbBox(list){
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  list.forEach(o => { const b = objectBBox(o); if (!b) return; minX = Math.min(minX, b.minX); minY = Math.min(minY, b.minY); maxX = Math.max(maxX, b.maxX); maxY = Math.max(maxY, b.maxY); });
  return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}
// сдвиг — как при перетаскивании (boards-core.js, dragMode 'move'): точки и ctrl
function dtbShift(o, dx, dy){
  if (!dx && !dy) return;
  o.points = (o.points || []).map(p => ({ x: p.x + dx, y: p.y + dy }));
  if (o.ctrl) o.ctrl = { x: o.ctrl.x + dx, y: o.ctrl.y + dy };
}
function dtbHit(a, b){ return a.minX <= b.maxX && b.minX <= a.maxX && a.minY <= b.maxY && b.minY <= a.maxY; }

// быстрые стили: заливка, контур, цвет текста (цвета Office — как у фигур
// по умолчанию и у импорта PPTX)
const DTB_QUICK_STYLES = [
  { f: '#4472C4', l: '#2F5597', t: '#FFFFFF', n: 'Синий' },
  { f: '#ED7D31', l: '#C55A11', t: '#FFFFFF', n: 'Оранжевый' },
  { f: '#70AD47', l: '#507E32', t: '#FFFFFF', n: 'Зелёный' },
  { f: '#FFC000', l: '#BF9000', t: '#1D1D1F', n: 'Жёлтый' },
  { f: '#A5A5A5', l: '#7C7C7C', t: '#FFFFFF', n: 'Серый' },
  { f: '#1F3864', l: null, t: '#FFFFFF', n: 'Тёмный' },
  { f: '#DDEBF7', l: '#4472C4', t: '#1D1D1F', n: 'Светлый' },
  { f: null, l: '#4472C4', t: '#1D1D1F', n: 'Только контур' }
];
// меню «Упорядочить»: разделы и пункты; can — когда пункт доступен
const DTB_ARR_MENU = [
  { h: 'Порядок', items: [['front', 'На передний план'], ['forward', 'Переместить вперёд'], ['backward', 'Переместить назад'], ['back', 'На задний план']] },
  { h: 'Поворот', can: (sel) => sel.some(dtbRotatable), items: [['rotr', 'Повернуть вправо на 90°'], ['rotl', 'Повернуть влево на 90°']] },
  { can: (sel) => sel.some(o => o.type === 'box'), items: [['flipH', 'Отразить слева направо'], ['flipV', 'Отразить сверху вниз']] },
  { h: 'Выровнять', can: (sel) => dtbUnits(sel).length >= 2, items: [['al-l', 'По левому краю'], ['al-c', 'По центру'], ['al-r', 'По правому краю'], ['al-t', 'По верхнему краю'], ['al-m', 'По середине'], ['al-b', 'По нижнему краю']] },
  { can: (sel) => dtbUnits(sel).length >= 3, items: [['dist-h', 'Распределить по горизонтали'], ['dist-v', 'Распределить по вертикали']] },
  { h: 'Группа', items: [['group', 'Сгруппировать', (sel) => dtbUnits(sel).length >= 2], ['ungroup', 'Разгруппировать', (sel) => sel.some(o => o.groupId)]] }
];
function dtbBuildArrangePops(){
  const host = document.getElementById('deckFileMenu')?.parentElement || document.body;
  const p = document.createElement('div');
  p.className = 'dtb-pop dtb-list';
  p.id = DTB_POP_IDS.arrange;
  p.hidden = true;
  p.setAttribute('role', 'menu');
  p.innerHTML = DTB_ARR_MENU.map((sec, i) => (sec.h ? '<div class="dtb-pop-h">' + sec.h + '</div>' : '') +
    sec.items.map(([a, l]) => '<button type="button" role="menuitem" data-arr="' + a + '" data-sec="' + i + '">' + l + '</button>').join('')).join('');
  host.appendChild(p);
  const st = document.createElement('div');
  st.className = 'dtb-pop';
  st.id = DTB_POP_IDS.styles;
  st.hidden = true;
  st.setAttribute('role', 'menu');
  st.innerHTML = '<div class="dtb-pop-h">Быстрые стили</div><div class="dtb-styles">' + DTB_QUICK_STYLES.map((q, i) =>
    '<button type="button" role="menuitem" data-arr="style-' + i + '" title="' + q.n + '"><i style="background:' + (q.f || 'transparent') + ';border-color:' + (q.l || q.f || 'transparent') + ';color:' + q.t + '">Аа</i></button>').join('') + '</div>';
  host.appendChild(st);
  [p, st].forEach(el => el.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-arr]');
    if (!b || b.disabled) return;
    dtbPopToggle(null);
    dtbArrange(b.dataset.arr);
  }));
}
// пункты меню, которые сейчас не к месту, — погашены (как в PowerPoint)
function dtbSyncArrangeMenu(){
  const sel = dtbSel();
  document.querySelectorAll('#dtbPopArrange button[data-arr]').forEach(b => {
    const sec = DTB_ARR_MENU[+b.dataset.sec], it = sec.items.find(x => x[0] === b.dataset.arr);
    b.disabled = !(sec.can ? sec.can(sel) : true) || !(it && it[2] ? it[2](sel) : true);
  });
}

function dtbArrange(act){
  const sel = dtbSel();
  if (!sel.length || typeof pushUndo !== 'function') return;
  const arr = B.objects, S = new Set(sel.map(o => o.id));
  const floor = (o) => o.type === 'deck' || !!o.bgOf;
  const done = () => { saveDB(); scheduleRedraw(); if (typeof updateContextMenu === 'function') updateContextMenu(); dtbSelSig = null; };
  if (act === 'front' || act === 'back' || act === 'forward' || act === 'backward'){
    const mv = arr.filter(o => S.has(o.id)), rest = arr.filter(o => !S.has(o.id));
    let at;
    if (act === 'front') at = rest.length;
    else if (act === 'back'){ at = 0; rest.forEach((o, i) => { if (floor(o)) at = i + 1; }); }
    else {
      // вперёд/назад — через ближайший объект, который ПЕРЕКРЫВАЕТ выделенное
      // (как в PowerPoint): объекты других слайдов на вид не влияют
      const bb = dtbBox(mv), idx = mv.map(o => arr.indexOf(o));
      if (act === 'forward'){
        const top = Math.max(...idx);
        const j = arr.findIndex((o, i) => i > top && !S.has(o.id) && dtbHit(bb, objectBBox(o) || bb));
        if (j < 0){ if (typeof deckToast === 'function') deckToast('Выше на слайде ничего нет'); return; }
        at = rest.indexOf(arr[j]) + 1;
      } else {
        const bot = Math.min(...idx);
        let j = -1;
        for (let i = bot - 1; i >= 0; i--){ const o = arr[i]; if (!S.has(o.id) && !floor(o) && dtbHit(bb, objectBBox(o) || bb)){ j = i; break; } }
        if (j < 0){ if (typeof deckToast === 'function') deckToast('Ниже на слайде ничего нет'); return; }
        at = rest.indexOf(arr[j]);
      }
    }
    pushUndo();
    // массив меняем на месте: на B.objects держат ссылку другие модули
    arr.splice(0, arr.length, ...rest.slice(0, at), ...mv, ...rest.slice(at));
    done();
    return;
  }
  if (act === 'rotr' || act === 'rotl' || act === 'flipH' || act === 'flipV'){
    const list = act.startsWith('rot') ? sel.filter(dtbRotatable) : sel.filter(o => o.type === 'box');
    if (!list.length) return;
    pushUndo();
    list.forEach(o => {
      if (act === 'rotr') o.rot = ((o.rot || 0) + 90) % 360;
      else if (act === 'rotl') o.rot = ((o.rot || 0) + 270) % 360;
      else if (act === 'flipH') o.flipH = !o.flipH || undefined;
      else o.flipV = !o.flipV || undefined;
      if (!o.rot) delete o.rot;
    });
    done();
    return;
  }
  if (act.startsWith('al-') || act.startsWith('dist-')){
    const units = dtbUnits(sel);
    if (units.length < 2) return;
    const all = dtbBox(sel), boxes = units.map(u => ({ u, b: dtbBox(u) }));
    pushUndo();
    if (act.startsWith('al-')){
      const k = act.slice(3);
      boxes.forEach(({ u, b }) => {
        let dx = 0, dy = 0;
        if (k === 'l') dx = all.minX - b.minX; else if (k === 'r') dx = all.maxX - b.maxX; else if (k === 'c') dx = all.cx - b.cx;
        else if (k === 't') dy = all.minY - b.minY; else if (k === 'b') dy = all.maxY - b.maxY; else if (k === 'm') dy = all.cy - b.cy;
        u.forEach(o => dtbShift(o, dx, dy));
      });
    } else {
      // поровну промежутков между крайними (крайние стоят на месте)
      const h = act === 'dist-h', lo = h ? 'minX' : 'minY', hi = h ? 'maxX' : 'maxY';
      boxes.sort((a, c) => (a.b[lo] + a.b[hi]) - (c.b[lo] + c.b[hi]));
      const span = boxes[boxes.length - 1].b[hi] - boxes[0].b[lo];
      const sizes = boxes.reduce((s, x) => s + (x.b[hi] - x.b[lo]), 0);
      const gap = (span - sizes) / (boxes.length - 1);
      let pos = boxes[0].b[lo];
      boxes.forEach(({ u, b }) => {
        const d = pos - b[lo];
        u.forEach(o => dtbShift(o, h ? d : 0, h ? 0 : d));
        pos += (b[hi] - b[lo]) + gap;
      });
    }
    done();
    return;
  }
  if (act === 'group'){
    if (dtbUnits(sel).length < 2) return;
    pushUndo();
    const gid = uid();
    sel.forEach(o => { o.groupId = gid; });
    done();
    return;
  }
  if (act === 'ungroup'){
    const g = sel.filter(o => o.groupId);
    if (!g.length) return;
    pushUndo();
    g.forEach(o => { delete o.groupId; });
    done();
    return;
  }
  if (act.startsWith('style-')){
    const q = DTB_QUICK_STYLES[+act.slice(6)], list = sel.filter(dtbStylable);
    if (!q || !list.length) return;
    pushUndo();
    list.forEach(o => {
      const isLine = /line|Connector/.test(o.geom || '');
      const ln = Object.assign({ w: 1.5 * (typeof bxPxPerPt === 'function' ? bxPxPerPt() : 1) }, o.line || {});
      if (isLine){ o.line = Object.assign(ln, { c: q.l || q.f }); return; }
      o.fill = q.f ? { c: q.f } : null;
      o.line = q.l ? Object.assign(ln, { c: q.l }) : null;
      if (o.text){
        // текст — новым объектом: кэш раскладки (bxTextFrame) привязан к самому объекту
        const tx = JSON.parse(JSON.stringify(o.text));
        (tx.paras || []).forEach(p => (p.runs || []).forEach(r => { r.c = q.t; }));
        tx.def = Object.assign({}, tx.def || {}, { c: q.t });
        o.text = tx;
      }
    });
    done();
  }
}

/* Раз в кадр (из bxEditorSync): изменилось выделение — полоса переходит в
   режим оформления или обратно. Подпись состояния дешёвая, полоса
   пересобирается только при её смене */
let dtbSelSig = null;
function deckTbSelTick(){
  const nav = document.getElementById('deckNav');
  if (!nav || !dtbBuilt) return;
  const on = typeof isDeckBoard === 'function' && isDeckBoard() && !nav.hidden;
  const bar = document.getElementById('deckFmtBar');
  const ms = typeof multiSelectIds !== 'undefined' ? multiSelectIds.join(',') : '';
  const sig = [on, typeof selectedId !== 'undefined' ? selectedId : '', ms, bar ? bar.hidden : 1, typeof bxEd !== 'undefined' && !!bxEd, B && B.rev].join('|');
  if (sig === dtbSelSig) return;
  dtbSelSig = sig;
  const sel = on ? dtbSel() : [];
  const fmt = on && (sel.length > 0 || (!!bar && !bar.hidden));
  const was = nav.classList.contains('dtb-fmt');
  nav.classList.toggle('dtb-fmt', fmt);
  DECK_CMDS.forEach(c => {
    if (!c.sel) return;
    const el = dtbCmdEl(c);
    if (!el) return;
    el.hidden = !fmt;
    el.disabled = !c.enabled();
  });
  if (was !== fmt){
    dtbPopToggle(null); dtbBarDdClose();
    // лента: выделили — открывается «Формат», сняли — прежняя вкладка
    if (fmt){ if (dtbTab !== 'format'){ dtbTabBack = dtbTab; dtbTab = 'format'; } }
    else if (dtbTab === 'format') dtbTab = dtbTabBack || 'home';
    dtbSyncTabs();
  }
  dtbLayout();
}

/* ═══════════════════════════════════════════════════════════════════════
   №104 (шаг 4 плана): «Слайд ▾» — новый слайд по макету, шаблоны, формат
   и подложка (прежнее окно #deckSlidePop), дублировать, скрыть из показа,
   переименовать, удалить. Сами действия — в deck-core.js (те же, что в
   меню «⋯» миниатюры), здесь только меню и макеты
   ═══════════════════════════════════════════════════════════════════════ */

// макеты: блоки-заполнители в долях слайда. ph — подсказка, пока блок пуст
// (рисует board-boxes.js, только в «Конструкторе»); sz — в пунктах
const DTB_LAYOUTS = [
  { id: 'blank', label: 'Пустой', boxes: [] },
  { id: 'title', label: 'Титульный', boxes: [
    { x: .08, y: .24, w: .84, h: .26, sz: 40, b: true, al: 'c', an: 'b', ph: 'Заголовок слайда' },
    { x: .14, y: .53, w: .72, h: .16, sz: 22, al: 'c', an: 't', c: '#595959', ph: 'Подзаголовок' }] },
  { id: 'titleText', label: 'Заголовок и текст', boxes: [
    { x: .06, y: .05, w: .88, h: .16, sz: 32, b: true, al: 'l', an: 'b', ph: 'Заголовок слайда' },
    { x: .06, y: .25, w: .88, h: .67, sz: 20, al: 'l', an: 't', body: true, ph: 'Текст слайда' }] },
  { id: 'twoCols', label: 'Две колонки', boxes: [
    { x: .06, y: .05, w: .88, h: .16, sz: 32, b: true, al: 'l', an: 'b', ph: 'Заголовок слайда' },
    { x: .06, y: .25, w: .425, h: .67, sz: 20, al: 'l', an: 't', body: true, ph: 'Текст слева' },
    { x: .515, y: .25, w: .425, h: .67, sz: 20, al: 'l', an: 't', body: true, ph: 'Текст справа' }] },
  { id: 'titleOnly', label: 'Только заголовок', boxes: [
    { x: .06, y: .05, w: .88, h: .16, sz: 32, b: true, al: 'l', an: 'b', ph: 'Заголовок слайда' }] }
];
// объекты макета для прямоугольника слайда r (в единицах доски)
function dtbLayoutObjects(layout, r){
  const ppt = typeof bxPxPerPt === 'function' ? bxPxPerPt() : 1;
  return layout.boxes.map(b => {
    const sz = b.sz * ppt;
    const tx = bxTextOf('', { sz, c: b.c || '#1D1D1F', f: BX_DEF_FONT, b: b.b || undefined });
    tx.anchor = b.an;
    // без маркера списка: у пустого абзаца с маркером точка видна и в «Уроке»,
    // и в показе, где подсказки уже нет
    tx.paras = [{ runs: [], esz: sz, al: b.al }];
    return { id: uid(), type: 'box', geom: 'rect', fill: null, line: null, ph: b.ph,
      w: r.w * b.w, h: r.h * b.h, points: [{ x: r.x + r.w * b.x, y: r.y + r.h * b.y }], text: tx };
  });
}
// эскиз макета для меню: те же доли, что у блоков
function dtbLayoutSvg(layout){
  const W = 64, H = 36;
  const rects = layout.boxes.map(b => {
    const x = b.x * W, y = b.y * H, w = b.w * W, h = b.h * H;
    if (b.body) return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="1" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-dasharray="2 1.5"/>' +
      [0, 1, 2].map(k => '<path d="M' + (x + 3) + ' ' + (y + 5 + k * 5) + 'h' + Math.max(4, w * .6) + '" stroke="currentColor" stroke-opacity=".6" stroke-width="1.4"/>').join('');
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="1" fill="currentColor" fill-opacity="' + (b.b ? '.35' : '.18') + '"/>';
  }).join('');
  return '<svg viewBox="0 0 64 36" width="64" height="36" aria-hidden="true"><rect x=".5" y=".5" width="63" height="35" rx="2" fill="var(--paper,#fff)" stroke="currentColor" stroke-opacity=".3"/>' + rects + '</svg>';
}

function dtbBuildSlideMenu(){
  const host = document.getElementById('deckFileMenu')?.parentElement || document.body;
  const p = document.createElement('div');
  p.className = 'dtb-pop dtb-list';
  p.id = 'dtbPopSlide';
  p.hidden = true;
  p.setAttribute('role', 'menu');
  p.innerHTML = '<div class="dtb-pop-h">Новый слайд</div><div class="dtb-layouts">' +
    DTB_LAYOUTS.map(l => '<button type="button" role="menuitem" data-layout="' + l.id + '" title="' + l.label + '">' + dtbLayoutSvg(l) + '<span>' + l.label + '</span></button>').join('') + '</div>' +
    '<button type="button" role="menuitem" data-sl="pop">Шаблоны, формат и подложка…</button>' +
    '<span class="deck-menu-sep"></span>' +
    '<button type="button" role="menuitem" data-sl="dup">Дублировать слайд</button>' +
    '<button type="button" role="menuitem" data-sl="hide">Скрыть из показа</button>' +
    '<button type="button" role="menuitem" data-sl="ren">Переименовать…</button>' +
    '<button type="button" role="menuitem" data-sl="del" class="danger">Удалить слайд</button>';
  host.appendChild(p);
  document.getElementById('deckSlideBtn')?.setAttribute('aria-haspopup', 'menu');
  DTB_POP_IDS.slide = 'dtbPopSlide';
  DTB_POP_BTNS.slide = 'deckSlideBtn';
  p.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    dtbPopToggle(null);
    const s = deckCur();
    if (b.dataset.layout){
      const l = DTB_LAYOUTS.find(x => x.id === b.dataset.layout);
      deckAddSlide(l && l.boxes.length ? (r) => dtbLayoutObjects(l, r) : null);
      return;
    }
    if (!s) return;
    const a = b.dataset.sl;
    if (a === 'pop') deckOpenPop(true);
    else if (a === 'dup') deckDuplicate(s.id);
    else if (a === 'hide') deckToggleHide(s.id);
    else if (a === 'ren') deckRename(s.id);
    else if (a === 'del') deckDelete(s.id);
  });
}
// зовёт deck-core.js по щелчку «Слайд»
function dtbSlideMenu(btn){
  const p = document.getElementById('dtbPopSlide');
  if (!p) return;
  if (typeof deckOpenPop === 'function') deckOpenPop(false);
  const s = deckCur(), can = typeof deckMayEdit === 'function' && deckMayEdit();
  p.querySelectorAll('button').forEach(b => {
    // открыть окно формата можно всегда (там же свои шаблоны), менять — только с правом
    b.disabled = b.dataset.sl === 'pop' ? false : (!can || (b.dataset.sl === 'del' && deckSlides().length <= 1));
  });
  const hb = p.querySelector('[data-sl="hide"]');
  if (hb) hb.textContent = s && s.hide ? 'Показывать в показе' : 'Скрыть из показа';
  const anchor = btn && !btn.classList.contains('dtb-off') ? btn : document.getElementById('dtbMoreBtn');
  dtbPopToggle('slide', anchor);
}

/* ═══════════════════════════════════════════════════════════════════════
   №105 (шаг 5 плана): режим показа. Презентация на всю вкладку (не на весь
   экран): html.deck-show прячет весь интерфейс доски, фон тёмный, слайд
   вписан во вкладку (deckArea, deck-core.js). Снизу — полоса, которая сама
   прячется через 2 с без движения мыши. В показе всегда «Урок»: пометки
   поверх, заготовку не задеть. Скрытые слайды (slide.hide) пропускаются.
   Ученик в совместной сессии получает признак показа в bd_view (sh) и
   видит то же — только слайд и пометки (deckViewerView)
   ═══════════════════════════════════════════════════════════════════════ */
let dtbShow = null;        // { mode, flow, tool, color, width, opacity } — что вернуть после показа
let dtbShowTool = 'nav';   // nav | pen | marker | eraser | laser
let dtbShowIdle = 0;
let dtbShowInner = false;  // инструмент меняет сам показ (dtbShowSetTool), а не щелчок по панели доски
function dtbShowOn(){ return !!dtbShow; }
// Инструменты доски в показе: вся панель (dock) с цветами и толщиной видна,
// как в обычном режиме, — рисовать можно чем угодно, не только пером и
// маркером. «Скрыть» на панели убирает её, «Инструменты» в полосе — возвращает.
// Выбор помним (localStorage boardsDeckShowTools). Только у того, кто ведёт
// показ: ученику признак показа приходит отдельно (deckViewerView), ему не надо
function dtbShowToolsPref(){ try { return localStorage.getItem('boardsDeckShowTools') !== '0'; } catch (e) { return true; } }
function dtbShowSetToolsVisible(on, save){
  if (save){ try { localStorage.setItem('boardsDeckShowTools', on ? '1' : '0'); } catch (e) {} }
  document.documentElement.classList.toggle('deck-show-tools', !!(on && dtbShow));
  document.querySelector('#dtbShowBar [data-sh="tools"]')?.setAttribute('aria-pressed', on ? 'true' : 'false');
  // слайд вписывается заново: панель забирает край вкладки или отдаёт его
  if (dtbShow) requestAnimationFrame(() => { deckGo(deckCurIndex(), 0); });
}
function dtbVisibleIdx(){ return deckSlides().map((s, i) => s.hide ? -1 : i).filter(i => i >= 0); }
// ближайший нескрытый слайд от i в сторону dir (0 — сам i или следующий)
function dtbShowFind(i, dir){
  const sl = deckSlides();
  for (let j = i; j >= 0 && j < sl.length; j += (dir || 1)) if (!sl[j].hide) return j;
  if (!dir) for (let j = i; j >= 0; j--) if (!sl[j].hide) return j;
  return -1;
}
function dtbShowStart(fromStart){
  if (dtbShow || typeof isDeckBoard !== 'function' || !isDeckBoard()) return;
  const vis = dtbVisibleIdx();
  if (!vis.length){ deckToast('Все слайды скрыты из показа'); return; }
  const start = fromStart ? vis[0] : dtbShowFind(Math.max(0, deckCurIndex()), 0);
  dtbPopToggle(null); dtbDisarm(); dtbMoreToggle(false);
  if (typeof bxCloseEditor === 'function') bxCloseEditor(true);
  if (typeof deckOpenPop === 'function') deckOpenPop(false);
  selectedId = null; multiSelectIds = [];
  dtbShow = { mode: deckMode, flow: deckFlow(), tool: tool, color: curColorTok, width: curWidth, opacity: curOpacity };
  document.documentElement.classList.add('deck-show');
  if (deckIsTeacher()) deckSetMode('lesson');
  if (deckFlow() === 'scroll') deckSetFlow('v', true);
  dtbShowBuildBar();
  dtbShowSetToolsVisible(dtbShowToolsPref(), false);
  dtbShowSetTool('nav');
  try { document.activeElement && document.activeElement.blur && document.activeElement.blur(); } catch (e) {}
  // панели спрятаны — места стало больше; вписываем, когда раскладка обновится
  requestAnimationFrame(() => { deckZf = 1; deckFitted = true; deckGo(start, 0); dtbShowSync(); dtbShowWake(); });
  if (typeof updateContextMenu === 'function') updateContextMenu();
}
function dtbShowStop(){
  if (!dtbShow) return;
  const st = dtbShow;
  dtbShow = null;
  document.documentElement.classList.remove('deck-show', 'dtb-show-idle', 'deck-show-tools');
  document.getElementById('dtbLaser')?.remove();
  // инструмент и перо — как были до показа
  curColorTok = st.color; curWidth = st.width; curOpacity = st.opacity;
  document.querySelector('.bd-tool[data-tool="' + st.tool + '"]')?.click();
  deckSetFlow(null, true);
  if (deckIsTeacher()) deckSetMode(st.mode);
  requestAnimationFrame(() => { if (typeof deckStripRefit === 'function') deckStripRefit(); deckTbSync(); });
}
function dtbShowStep(dir){
  if (!dtbShow) return false;
  const j = dtbShowFind(deckCurIndex() + dir, dir);
  if (j < 0){ if (dir > 0) deckToast('Конец показа — Esc, чтобы выйти'); return false; }
  deckGo(j, 0);
  // короткое проявление вместо выезда: слой глубины в показе спрятан
  const cv = document.getElementById('boardCv');
  if (cv){ cv.classList.remove('dtb-show-in'); void cv.offsetWidth; cv.classList.add('dtb-show-in'); }
  dtbShowSync();
  return true;
}
const DTB_SHOW_TOOLS = [
  { id: 'nav', label: 'Указатель — щелчок листает', icon: '<path d="M6 3.5l11 8.2-4.8.9 2.9 5.6-2.2 1.1-2.9-5.6-3.5 3.3z" stroke-linejoin="round"/>' },
  { id: 'pen', label: 'Перо', icon: '<path d="M15.5 4.5l4 4L9 19l-5 1 1-5z" stroke-linejoin="round"/><path d="M13 7l4 4"/>' },
  { id: 'marker', label: 'Маркер', icon: '<path d="M14 4l6 6-8 8H8v-4z" stroke-linejoin="round"/><path d="M4 21h9" stroke-width="3" stroke-opacity=".5"/>' },
  { id: 'eraser', label: 'Ластик', icon: '<path d="M8.5 19.5l-4-4a1.5 1.5 0 0 1 0-2.1l8.9-8.9a1.5 1.5 0 0 1 2.1 0l4 4a1.5 1.5 0 0 1 0 2.1l-8 8.9zM8.5 19.5H20M9 9.5l6 6"/>' },
  { id: 'laser', label: 'Лазерная указка', icon: '<circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="7" stroke-opacity=".45"/>' }
];
function dtbShowBuildBar(){
  if (document.getElementById('dtbShowBar')) return;
  const bar = document.createElement('div');
  bar.id = 'dtbShowBar';
  bar.className = 'dtb-show-bar';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Показ слайдов');
  const ic = (x) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true">' + x + '</svg>';
  bar.innerHTML = '<button type="button" data-sh="prev" title="Предыдущий (←)">' + ic('<path d="M15 5l-7 7 7 7" stroke-linejoin="round"/>') + '</button>' +
    '<span class="dtb-show-no" id="dtbShowNo">1 / 1</span>' +
    '<button type="button" data-sh="next" title="Следующий (→, пробел)">' + ic('<path d="M9 5l7 7-7 7" stroke-linejoin="round"/>') + '</button><i class="dtb-show-sep"></i>' +
    DTB_SHOW_TOOLS.map(t => '<button type="button" data-tool-show="' + t.id + '" title="' + t.label + '" aria-pressed="false">' + ic(t.icon) + '</button>').join('') +
    '<i class="dtb-show-sep"></i><button type="button" data-sh="tools" class="txt" title="Показать или скрыть инструменты доски" aria-pressed="false">Инструменты</button>' +
    '<button type="button" data-sh="clear" class="txt" title="Стереть пометки на этом слайде">Очистить</button>' +
    '<button type="button" data-sh="exit" class="txt" title="Выйти из показа (Esc)">Выйти</button>';
  (document.getElementById('screenBoard') || document.body).appendChild(bar);
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.toolShow){ dtbShowSetTool(b.dataset.toolShow); return; }
    const a = b.dataset.sh;
    if (a === 'prev') dtbShowStep(-1);
    else if (a === 'next') dtbShowStep(1);
    else if (a === 'tools') dtbShowSetToolsVisible(!document.documentElement.classList.contains('deck-show-tools'), true);
    else if (a === 'clear') deckClearNotes(false);
    else if (a === 'exit') dtbShowStop();
  });
  // кнопки полосы не начинают штрих и не листают
  bar.addEventListener('pointerdown', (e) => e.stopPropagation());
  // «Скрыть» — на самой панели инструментов, видна только в показе (CSS)
  const tools = document.getElementById('bdDockTools');
  if (tools && !document.getElementById('dtbDockHide')){
    const h = document.createElement('button');
    h.type = 'button'; h.id = 'dtbDockHide'; h.className = 'dtb-dock-hide';
    h.title = 'Скрыть инструменты (вернуть — «Инструменты» внизу)';
    h.textContent = 'Скрыть';
    h.addEventListener('click', () => dtbShowSetToolsVisible(false, true));
    tools.appendChild(h);
    // инструмент выбрали на панели доски (щелчком или цифрой) — указатель
    // показа больше не листает по щелчку, иначе линию или текст не провести
    tools.addEventListener('click', (e) => {
      const b = e.target.closest('.bd-tool[data-tool]');
      if (!dtbShow || dtbShowInner || !b) return;
      const t = b.dataset.tool;
      dtbShowMark(t === 'hand' ? 'nav' : t === 'eraser' ? 'eraser' : 'board');
      if (t !== 'hand') document.getElementById('dtbLaser')?.remove();
    });
  }
}
// отметить инструмент в полосе показа (board — любой инструмент панели доски)
function dtbShowMark(t){
  dtbShowTool = t;
  document.querySelectorAll('#dtbShowBar [data-tool-show]').forEach(b => b.setAttribute('aria-pressed', b.dataset.toolShow === t ? 'true' : 'false'));
  document.documentElement.dataset.showTool = t;
}
function dtbShowSetTool(t){
  dtbShowMark(t);
  const st = dtbShow;
  if (!st) return;
  // перо и маркер — свои цвет и толщина на время показа, как в PowerPoint
  if (t === 'pen'){ curColorTok = '#E0322B'; curWidth = 3; curOpacity = false; }
  else if (t === 'marker'){ curColorTok = '#FFD400'; curWidth = 16; curOpacity = true; }
  else { curColorTok = st.color; curWidth = st.width; curOpacity = st.opacity; }
  const boardTool = t === 'pen' || t === 'marker' ? 'pen' : t === 'eraser' ? 'eraser' : 'hand';
  dtbShowInner = true;
  try { document.querySelector('.bd-tool[data-tool="' + boardTool + '"]')?.click(); } finally { dtbShowInner = false; }
  if (t !== 'laser') document.getElementById('dtbLaser')?.remove();
}
function dtbShowSync(){
  const no = document.getElementById('dtbShowNo');
  if (!no) return;
  const vis = dtbVisibleIdx(), k = vis.indexOf(deckCurIndex());
  no.textContent = (k >= 0 ? k + 1 : '–') + ' / ' + vis.length;
}
// полоса и курсор прячутся через 2 с без движения — слайду ничто не мешает
function dtbShowWake(){
  document.documentElement.classList.remove('dtb-show-idle');
  clearTimeout(dtbShowIdle);
  dtbShowIdle = setTimeout(() => { if (dtbShow && !document.querySelector('#dtbShowBar:hover')) document.documentElement.classList.add('dtb-show-idle'); }, 2000);
}
function dtbShowInit(){
  // F5 — с начала, Shift+F5 — с текущего (как в PowerPoint); на Mac ещё
  // ⌘⇧⏎ и ⌘⏎. В показе: стрелки, PageUp/PageDown, пробел, Home/End, Esc
  document.addEventListener('keydown', (e) => {
    if (typeof isDeckBoard !== 'function' || !isDeckBoard()) return;
    const typing = e.target && e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]');
    if (!dtbShow){
      if (typing) return;
      if (e.key === 'F5' || (e.key === 'Enter' && e.metaKey)){ e.preventDefault(); e.stopImmediatePropagation(); dtbShowStart(e.key === 'F5' ? !e.shiftKey : e.shiftKey); }
      return;
    }
    // текст или формула набираются инструментом доски — пробел, Enter и
    // Backspace достаются полю, а не листают (Esc — тоже полю: закрыть его)
    if (typing) return;
    let dir = 0;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter', 'n', 'N'].includes(e.key)) dir = 1;
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace', 'p', 'P'].includes(e.key)) dir = -1;
    if (e.key === 'Escape'){ e.preventDefault(); e.stopImmediatePropagation(); dtbShowStop(); return; }
    if (e.key === 'F5'){ e.preventDefault(); e.stopImmediatePropagation(); return; }
    if (e.key === 'Home' || e.key === 'End'){
      e.preventDefault(); e.stopImmediatePropagation();
      const vis = dtbVisibleIdx();
      deckGo(e.key === 'Home' ? vis[0] : vis[vis.length - 1], 0); dtbShowSync();
      return;
    }
    if (dir){ e.preventDefault(); e.stopImmediatePropagation(); dtbShowStep(dir); }
  }, true);
  // указатель (и лазер): щелчок по правой половине — дальше, по левой —
  // назад; свайп — туда, куда смахнули. Перо, маркер и ластик — доске
  let tap = null;
  window.addEventListener('pointerdown', (e) => {
    if (!dtbShow) return;
    dtbShowWake();
    if (e.target.id !== 'boardCv' || (dtbShowTool !== 'nav' && dtbShowTool !== 'laser')) return;
    e.preventDefault(); e.stopImmediatePropagation();
    tap = { x: e.clientX, y: e.clientY, id: e.pointerId, btn: e.button };
  }, true);
  window.addEventListener('pointermove', (e) => {
    if (!dtbShow) return;
    dtbShowWake();
    if (dtbShowTool === 'laser'){
      let l = document.getElementById('dtbLaser');
      if (!l){ l = document.createElement('div'); l.id = 'dtbLaser'; l.className = 'dtb-laser'; document.body.appendChild(l); }
      l.style.transform = 'translate(' + (e.clientX - 7) + 'px,' + (e.clientY - 7) + 'px)';
    }
    if (tap && e.pointerId === tap.id){ e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  window.addEventListener('pointerup', (e) => {
    if (!dtbShow || !tap || e.pointerId !== tap.id) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const dx = e.clientX - tap.x, dy = e.clientY - tap.y, t = tap;
    tap = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) dtbShowStep(dx < 0 ? 1 : -1);
    else if (Math.abs(dy) > 50) dtbShowStep(dy < 0 ? 1 : -1);
    else if (t.btn === 2) dtbShowStep(-1);
    else dtbShowStep(e.clientX >= window.innerWidth / 2 ? 1 : -1);
  }, true);
  window.addEventListener('contextmenu', (e) => { if (dtbShow && e.target.id === 'boardCv') e.preventDefault(); }, true);
  // вкладку сузили или развернули — слайд вписывается заново
  window.addEventListener('resize', () => { if (dtbShow) requestAnimationFrame(() => { deckGo(deckCurIndex(), 0); }); });
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
    : st === 'ribbon'
      ? 'Вкладки «Главная», «Вставка», «Показ»; «Формат» — когда что-то выделено. Двойной щелчок по вкладке сворачивает ленту.'
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
    // №107: «10 / 13» не переносится на две строки — номер не сжимается
    '.dtb .deck-no{white-space:nowrap;flex:none;min-width:54px}',
    '.dtb .dtb-lbl-r{display:none}',
    '.dtb .dtb-btn.wide .dtb-lbl-l{display:inline}',
    // №107: лента (вариант А) — вкладки сверху, под ними группы крупных значков
    '.deck-nav.dtb.dtb-ribbon{flex-direction:column;align-items:stretch;padding:0;border-radius:14px}',
    '.dtb-tabrow{display:flex;align-items:center;justify-content:space-between;padding:2px 6px 0 10px;border-bottom:1px solid var(--glass-border)}',
    '.dtb-tabs{display:flex;gap:2px}',
    // у строки вкладок и панели свой display — без этого правила hidden не прячет
    '.dtb-tabrow[hidden],.dtb-panel[hidden]{display:none}',
    '.dtb-tab{border:none;background:none;font:600 13px var(--font-ui);color:var(--muted-2);padding:7px 10px 6px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}',
    '.dtb-tab:hover{color:var(--ink)}',
    '.dtb-tab[aria-selected="true"]{color:var(--ink);border-bottom-color:var(--ink)}',
    '.dtb-tab.ctx{color:var(--teacher)}',
    '.dtb-tab.ctx[aria-selected="true"]{border-bottom-color:var(--teacher)}',
    '.dtb-tab[hidden]{display:none}',
    '.dtb-ribbon .dtb-tail{border-left:none!important;padding:0}',
    '.dtb-panel{display:flex;flex-wrap:wrap;align-items:stretch;padding:6px 6px 5px;row-gap:4px}',
    '.dtb-ribbon .dtb-grp{padding:0 8px;align-items:center}',
    '.dtb-ribbon .dtb-panel > .dtb-grp:not([hidden]) ~ .dtb-grp:not([hidden]){border-left:1px solid var(--glass-border)}',
    '.dtb-ribbon .dtb-panel .deck-nav-btn.dtb-btn,.dtb-ribbon .dtb-grp[data-g="flow"] .deck-nav-btn,.dtb-ribbon #deckSlideBtn,.dtb-ribbon #deckFileBtn{position:relative;flex-direction:column;height:56px;min-width:58px;padding:4px 6px 3px;gap:3px;font-size:11.5px;font-weight:600}',
    '.dtb-ribbon .dtb-panel .deck-nav-btn.dtb-btn svg,.dtb-ribbon .dtb-grp[data-g="flow"] .deck-nav-btn svg,.dtb-ribbon #deckSlideBtn svg,.dtb-ribbon #deckFileBtn svg{width:22px;height:22px}',
    '.dtb-ribbon .dtb-lbl-r{display:block;white-space:nowrap;line-height:1.1}',
    '.dtb-ribbon .dtb-btn.wide .dtb-lbl-l{display:none}',
    '.dtb-ribbon .dtb-btn.wide .dtb-lbl{font-size:11.5px}',
    '.dtb-ribbon .dtb-panel svg.dtb-caret{position:absolute;right:2px;top:6px;width:10px!important;height:10px!important}',
    // свёрнута — только вкладки; щелчок по вкладке открывает её поверх слайда
    '.deck-nav.dtb.dtb-ribbon.dtb-closed{padding:0}',
    '.dtb-ribbon.dtb-closed .dtb-tabrow{border-bottom:none}',
    '.dtb-ribbon.dtb-closed .dtb-panel{display:none}',
    '.dtb-ribbon.dtb-closed.dtb-peek .dtb-panel{display:flex;position:absolute;left:-1px;right:-1px;top:calc(100% + 4px);border-radius:14px;background:var(--glass-strong);backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);border:1px solid var(--glass-border);box-shadow:var(--shadow)}',
    '.dtb-ribbon.dtb-closed.dtb-peek .dtb-grp:not([hidden]){display:inline-flex!important}',
    '.dtb-ribbon.dtb-closed .dtb-tail{display:inline-flex}',
    '.deck-nav.dtb-ribbon.dtb-closed #dtbFoldBtn{height:30px;min-width:34px}',
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
    // №103: панель оформления в полосе — без своей «плашки», в одну строку
    '.dtb .bx-bar[data-docked]{position:static;display:inline-flex;flex-wrap:nowrap;max-width:none;padding:0;border:none;border-radius:0;background:none;box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none;z-index:auto}',
    '.dtb .bx-bar[data-docked] select{max-width:96px}',
    '.dtb .bx-bar[data-docked] select[data-bx="lw"]{max-width:54px}',
    '.dtb .bx-bar[data-docked] button[data-bx="sz-"],.dtb .bx-bar[data-docked] button[data-bx="sz+"]{min-width:24px;padding:0 3px}',
    '.dtb .bx-bar[data-docked] input.bx-size{width:40px}',
    // образец цвета — полоской под значком, как в Google Slides: кнопка уже вдвое
    '.dtb .bx-bar[data-docked] button[data-bx="color"],.dtb .bx-bar[data-docked] button[data-bx="hl"],.dtb .bx-bar[data-docked] button[data-bx="fill"],.dtb .bx-bar[data-docked] button[data-bx="line"]{position:relative;min-width:30px;padding:0 6px 4px}',
    '.dtb .bx-bar[data-docked] button > .bx-sw{position:absolute;left:7px;right:7px;bottom:3px;width:auto;height:4px;border-radius:2px;border:none;box-shadow:inset 0 0 0 1px rgba(0,0,0,.18)}',
    '.dtb .bx-bar[data-docked] .bx-sep + .bx-sep{display:none}',
    '.dtb .bx-bar[data-docked] .bx-sep{margin:0 2px}',
    '.bx-bar:not([data-docked]) .dtb-dd-btn{display:none}',
    '.bx-bar:not([data-docked]) .dtb-dd,.bx-bar:not([data-docked]) .dtb-dd-menu{display:contents}',
    '.bx-bar:not([data-docked]) .dtb-dd-lbl{display:none}',
    '.bx-bar[data-docked] .dtb-dd{display:inline-flex;position:relative}',
    '.bx-bar[data-docked] .dtb-dd-btn{gap:1px}',
    '.bx-bar[data-docked] .dtb-dd-menu{display:none;position:fixed;z-index:430;flex-direction:column;align-items:stretch;min-width:210px;padding:5px;border-radius:12px;background:var(--glass-strong);backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);border:1px solid var(--glass-border);box-shadow:var(--shadow)}',
    '.bx-bar[data-docked] .dtb-dd.open .dtb-dd-menu{display:flex}',
    '.bx-bar[data-docked] .dtb-dd-menu button{justify-content:flex-start;gap:9px;font-weight:500;padding:0 10px}',
    '.bx-bar[data-docked] .dtb-dd-lbl{font-weight:500;font-size:13px;color:var(--pencil)}',
    '.dtb-pop.dtb-list{display:flex;flex-direction:column;padding:5px;min-width:220px}',
    '.dtb-pop.dtb-list[hidden]{display:none}',
    '.dtb-list button{border:none;background:none;text-align:left;font-family:var(--font-ui);font-size:13.5px;font-weight:500;color:var(--pencil);padding:8px 10px;border-radius:8px;cursor:pointer}',
    '.dtb-list button:hover:not(:disabled){background:var(--hover-2)}',
    '.dtb-list button:disabled{opacity:.4;cursor:default}',
    '.dtb-list .dtb-pop-h{margin:8px 10px 2px}',
    '.dtb-list .dtb-pop-h:first-child{margin-top:4px}',
    '.dtb-styles{display:grid;grid-template-columns:repeat(4,52px);gap:6px}',
    '.dtb-styles button{border:none;background:none;padding:3px;border-radius:9px;cursor:pointer}',
    '.dtb-styles button:hover{background:var(--hover-2)}',
    '.dtb-styles i{display:flex;align-items:center;justify-content:center;height:34px;border-radius:6px;border:2px solid;font-style:normal;font-family:var(--font-ui);font-weight:700;font-size:13px}',
    // №104: меню «Слайд ▾» — плитки макетов
    '.dtb-layouts{display:grid;grid-template-columns:repeat(3,auto);gap:4px;margin:2px 4px 6px}',
    '.dtb-list .dtb-layouts button{display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 4px;font-size:11.5px;color:var(--muted-3);text-align:center}',
    '.dtb-layouts svg{color:var(--ink)}',
    '.dtb-list button.danger{color:var(--teacher)}',
    '.dtb-list .deck-menu-sep{display:block;height:1px;background:var(--glass-border);margin:4px 6px}',
    // скрытый из показа слайд в ленте (разметку строит deck-core.js)
    '.deck-thumb.hid .deck-thumb-box{opacity:.42}',
    '.deck-thumb.hid .deck-thumb-n{text-decoration:line-through}',
    '.deck-thumb-hid{position:absolute;left:2px;top:22px;width:16px;height:16px;color:var(--muted-2)}',
    '.deck-thumb-hid svg{width:16px;height:16px;display:block}',
    // №105: режим показа — интерфейс доски спрятан, фон тёмный (и у ученика)
    'html.deck-show,html.deck-show body,html.deck-show #screenBoard{background:#121418!important}',
    'html.deck-show:not(.deck-show-tools) #screenBoard > :not(#boardCv):not(#bdTaskLayer):not(#deckToast):not(#bdEraserRing):not(#dtbShowBar){display:none!important}',
    // инструменты в показе: панель доски и всё, что она открывает (цвета и
    // толщина, паттерны, фигуры, формула, вставка картинки, меню объекта)
    'html.deck-show.deck-show-tools #screenBoard > :not(#boardCv):not(#bdTaskLayer):not(#deckToast):not(#bdEraserRing):not(#dtbShowBar):not(#bdDock):not(#bdOptbar):not(#bdPatterns):not(#bdFormulaEditor):not(#bdImgSrcPop):not(#bdFigMenu):not(#bdFigPanel):not(#bdCtxMenu):not(#bdDropOverlay){display:none!important}',
    '.dtb-dock-hide{display:none}',
    'html.deck-show-tools .dtb-dock-hide{display:inline-flex;align-items:center;justify-content:center;flex:none;position:relative;z-index:1;height:34px;padding:0 10px;margin-left:4px;border:none;border-radius:10px;background:rgba(127,127,127,.16);color:inherit;font:600 12px var(--font-ui);cursor:pointer}',
    'html.deck-show-tools .dtb-dock-hide:hover{background:rgba(127,127,127,.28)}',
    '.bd-dock.pos-left .dtb-dock-hide,.bd-dock.pos-right .dtb-dock-hide{margin:4px 0 0;padding:0 4px;font-size:11px}',
    // снизу — панель инструментов; полоса показа уходит наверх, чтобы не наложиться
    'html.deck-show.deck-show-tools .dtb-show-bar{top:12px;bottom:auto}',
    'html.deck-show.deck-show-tools.dtb-show-idle .dtb-show-bar{transform:translate(-50%,-12px)}',
    'html.deck-show body > .lg-menu,html.deck-show body > .lg-ftip,html.deck-show #authUserPill,html.deck-show .ts-share-pop,html.deck-show #bdSharePop,html.deck-show .dtb-pop,html.deck-show #dtbMoreMenu{display:none!important}',
    'html.deck-show[data-show-tool="nav"] #boardCv{cursor:default!important}',
    'html.deck-show[data-show-tool="laser"] #boardCv,html.deck-show.dtb-show-idle #boardCv{cursor:none!important}',
    '#boardCv.dtb-show-in{animation:dtbShowIn .18s ease-out}',
    '@keyframes dtbShowIn{from{opacity:.35}to{opacity:1}}',
    '.dtb-show-bar{display:none}',
    'html.deck-show .dtb-show-bar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:450;display:flex;align-items:center;gap:2px;padding:5px;border-radius:14px;background:rgba(30,33,40,.82);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 6px 24px rgba(0,0,0,.35);color:#E9ECF2;transition:opacity .35s,transform .35s;font-family:var(--font-ui)}',
    'html.deck-show.dtb-show-idle .dtb-show-bar{opacity:0;transform:translate(-50%,12px);pointer-events:none}',
    '.dtb-show-bar button{height:34px;min-width:34px;border:none;border-radius:10px;background:transparent;color:inherit;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0 6px;font:600 13px var(--font-ui)}',
    '.dtb-show-bar button.txt{padding:0 10px}',
    '.dtb-show-bar button:hover{background:rgba(255,255,255,.12)}',
    '.dtb-show-bar button[aria-pressed="true"]{background:rgba(255,255,255,.22)}',
    '.dtb-show-bar svg{width:19px;height:19px}',
    '.dtb-show-no{min-width:58px;text-align:center;font:600 13px var(--font-mono,monospace);font-variant-numeric:tabular-nums}',
    '.dtb-show-sep{width:1px;height:20px;background:rgba(255,255,255,.2);margin:0 4px}',
    '.dtb-laser{position:fixed;left:0;top:0;width:14px;height:14px;border-radius:50%;background:#ff2a2a;box-shadow:0 0 10px 4px rgba(255,40,40,.55);pointer-events:none;z-index:460}',
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
