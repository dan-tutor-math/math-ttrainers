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
  { id: 'hybrid', label: 'Гибрид', soon: true, title: 'Одна строка, а фигуры и таблицы — крупными галереями' }
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
  caret: '<path d="M8 10.5l4 4 4-4"/>'
};
function dtbSvg(name, cls){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"' +
    (cls ? ' class="' + cls + '"' : '') + ' aria-hidden="true">' + (DTB_ICONS[name] || '') + '</svg>';
}

/* Реестр команд. Поля:
   id, group (insert | slide | file | mode | nav | flow | lesson | show),
   label — подпись (в «⋯» и подсказке), icon — значок новой кнопки,
   node — id готового узла из boards.html (его обработчики в deck-core.js),
   menu — id выпадающего меню (кнопка с «▾»),
   run — обработчик новой кнопки; у узла по умолчанию его же click(),
   enabled — можно ли нажать сейчас, keep — никогда не уходит в «⋯»,
   prio — чем меньше, тем раньше уходит в «⋯» на узком экране */
const DECK_CMDS = [
  { id: 'text', group: 'insert', icon: 'text', label: 'Надпись', title: 'Вставить надпись', prio: 5,
    enabled: () => typeof bxInsert === 'function' && mayDraw(), run: () => deckInsertAt('text') },
  { id: 'table', group: 'insert', icon: 'table', label: 'Таблица', title: 'Вставить таблицу 3 × 3', prio: 4,
    enabled: () => typeof bxInsert === 'function' && mayDraw(), run: () => deckInsertAt('table') },
  { id: 'shapes', group: 'insert', icon: 'shapes', label: 'Фигуры', title: 'Вставить фигуру', prio: 5, menu: 'deckInsertMenu', btnId: 'deckShapesBtn',
    enabled: () => typeof bxInsert === 'function' && mayDraw() },
  { id: 'slide', group: 'slide', node: 'deckSlideBtn', label: 'Слайд', prio: 6 },
  { id: 'file', group: 'slide', node: 'deckFileBtn', label: 'Файл', prio: 6 },
  { id: 'mode', group: 'mode', node: 'deckModeSeg', label: 'Конструктор / Урок', keep: true },
  { id: 'prev', group: 'nav', node: 'deckPrev', label: 'Предыдущий слайд', keep: true },
  { id: 'no', group: 'nav', node: 'deckNo', label: 'Номер слайда', keep: true },
  { id: 'next', group: 'nav', node: 'deckNext', label: 'Следующий слайд', keep: true },
  { id: 'flowV', group: 'flow', node: 'deckFlowV', label: 'Листать вверх и вниз', prio: 1 },
  { id: 'flowS', group: 'flow', node: 'deckFlowS', label: 'Сплошная прокрутка', prio: 1 },
  { id: 'flowH', group: 'flow', node: 'deckFlowH', label: 'Листать вбок', prio: 1 },
  { id: 'clear', group: 'lesson', node: 'deckClearNotes', label: 'Очистить пометки', prio: 3 },
  { id: 'copy', group: 'lesson', node: 'deckCopyBtn', label: 'Копия урока', prio: 2 },
  // режим показа — шаг 5 плана; пока только место в полосе
  { id: 'show', group: 'show', icon: 'show', label: 'Показ', title: 'Показ слайдов на всю вкладку (скоро)', prio: 4, wide: true,
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
      el.innerHTML = dtbSvg(c.icon) + (c.wide ? '<span class="dtb-lbl">' + c.label + '</span>' : '') + (c.menu ? dtbSvg('caret', 'dtb-caret') : '');
      if (c.menu){ el.setAttribute('aria-haspopup', 'menu'); el.setAttribute('aria-expanded', 'false'); }
      el.addEventListener('click', () => dtbRun(c));
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
    if (c) dtbRun(c);
  });
  document.addEventListener('pointerdown', (e) => {
    if (e.target.closest('#dtbMoreMenu, #dtbMoreBtn')) return;
    dtbMoreToggle(false);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') dtbMoreToggle(false); });
  window.addEventListener('resize', () => dtbScheduleLayout());
  dtbBuildSettings();
}

function dtbRun(c){
  if (c.enabled && !c.enabled()) return;
  if (c.menu){
    // фигуры — то же меню, что было у «Вставить»; кнопки в нём гаснут без права рисовать
    document.querySelectorAll('#' + c.menu + ' button').forEach(b => { b.disabled = !(c.enabled ? c.enabled() : true); });
    const btn = dtbCmdEl(c);
    // ушла в «⋯» — меню открываем под «⋯»
    const anchor = btn && btn.classList.contains('dtb-off') ? document.getElementById('dtbMoreBtn') : btn;
    if (typeof deckMenuToggle === 'function') deckMenuToggle(c.menu, anchor?.id || c.btnId);
    return;
  }
  if (c.run){ c.run(); return; }
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
      it.textContent = (pressed ? '✓ ' : '') + c.label + (c.menu ? ' ▸' : '');
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
  if (nav.classList.contains('dtb-closed')) return;
  const avail = window.innerWidth - 24;
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

/* Настройки досок (шестерёнка «Настройки листа»): вид панели презентации.
   Пункт виден только в презентации (CSS по html.deck-mode). «Лента» и
   «Гибрид» уже выбираются и запоминаются, но пока показывается одна
   строка — вид меняет только раскладку, не данные доски, поэтому ученик и
   совместная сессия от него не зависят */
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
