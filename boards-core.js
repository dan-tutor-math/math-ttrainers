/* ═══════════════════════════════════════════════════════════════════════
   boards.html — отдельный режим «Доски»: список папок/досок + бесконечный
   векторный холст с горизонтальной лентой тетрадных листов.
   Черновой отдельный файл — пока не встроен в общую навигацию index.html.
   ═══════════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'ogeBoards:v1';

function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function nowTs(){ return Date.now(); }
function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }
function dist(a, b){ return Math.hypot(a.x - b.x, a.y - b.y); }
function clonePts(obj){ return { points: obj.points.map(p => ({ x: p.x, y: p.y })), ctrl: obj.ctrl ? { x: obj.ctrl.x, y: obj.ctrl.y } : null }; }

/* ───────── хранилище ───────── */
let DB = { folders: [], boards: [] };
function loadDB(){
  try { const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); if (raw && raw.boards) DB = raw; } catch(e){}
}
let saveTimer = null;
function saveDB(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(DB)); } catch(e){}
  }, 300);
}
loadDB();

/* ───────── палитра — привязана к переменным темы, поэтому чернила
   остаются читаемыми что на светлой, что на тёмной бумаге ───────── */
const PALETTE = [
  { tok: '--pencil',  name: 'Чёрный/белый' },
  { tok: '--ink',     name: 'Синий' },
  { tok: '--teacher', name: 'Красный' },
  { tok: '--ok',      name: 'Зелёный' },
  { tok: '--moved',   name: 'Голубой' },
];
function resolveColor(tok){
  if (typeof tok === 'string' && tok.indexOf('--') === 0) {
    return getComputedStyle(document.documentElement).getPropertyValue(tok).trim() || '#000';
  }
  return tok || '#000';
}

/* ═══════════════════════════════════════════════════════════════════════
   ЭКРАН 1 — список папок и досок
   ═══════════════════════════════════════════════════════════════════════ */
const screenList = document.getElementById('screenList');
const screenBoard = document.getElementById('screenBoard');
let curFolderId = null;   // null = «Все доски» (корень), '__recent' = «Недавние», иначе id папки
let sortMode = 'new';     // 'new' | 'old' | 'az'
let searchQuery = '';

function folderIcon(){
  return '<svg viewBox="0 0 24 24" fill="none"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="1.6"/></svg>';
}
function boardIcon(){
  return '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M7 20h10M9 17v3M15 17v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
}
function clockIcon(){
  return '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M12 7v5l3.5 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
}
function allIcon(){
  return '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.4" stroke="currentColor" stroke-width="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.4" stroke="currentColor" stroke-width="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.4" stroke="currentColor" stroke-width="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.4" stroke="currentColor" stroke-width="1.6"/></svg>';
}

function fmtDate(ts){
  if (!ts) return '';
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()} в ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function renderNav(){
  const recentCount = DB.boards.filter(b => b.lastOpenedAt).length;
  let html = `
    <button class="bl-nav-item${curFolderId==='__recent'?' active':''}" data-nav="__recent">${clockIcon()}Недавние<span class="cnt">${recentCount}</span></button>
    <button class="bl-nav-item${curFolderId===null?' active':''}" data-nav="__root">${allIcon()}Все доски<span class="cnt">${DB.boards.length}</span></button>
    <div class="bl-folders">
  `;
  DB.folders.forEach(f => {
    const n = DB.boards.filter(b => b.folderId === f.id).length;
    html += `<button class="bl-nav-item bl-folder-item${curFolderId===f.id?' active':''}" data-nav="${f.id}">${folderIcon()}${escHtml(f.name)}<span class="cnt">${n}</span></button>`;
  });
  html += '</div>';
  document.getElementById('blNav').innerHTML = html;
  document.querySelectorAll('.bl-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.nav;
      curFolderId = v === '__root' ? null : v === '__recent' ? '__recent' : v;
      searchQuery = '';
      document.getElementById('blSearch').value = '';
      renderList();
    });
  });
}

function escHtml(s){ return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function currentBoardsAndFolders(){
  if (searchQuery){
    const q = searchQuery.toLowerCase();
    return {
      folders: DB.folders.filter(f => f.name.toLowerCase().includes(q)),
      boards: DB.boards.filter(b => b.name.toLowerCase().includes(q)),
    };
  }
  if (curFolderId === '__recent'){
    return { folders: [], boards: DB.boards.filter(b => b.lastOpenedAt) };
  }
  if (curFolderId === null){
    return { folders: DB.folders, boards: DB.boards.filter(b => !b.folderId) };
  }
  return { folders: [], boards: DB.boards.filter(b => b.folderId === curFolderId) };
}

function sortBoards(list){
  const arr = list.slice();
  if (sortMode === 'new') arr.sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
  else if (sortMode === 'old') arr.sort((a,b) => (a.createdAt||0) - (b.createdAt||0));
  else arr.sort((a,b) => a.name.localeCompare(b.name, 'ru'));
  return arr;
}

function renderList(){
  renderNav();
  const { folders, boards } = currentBoardsAndFolders();
  const sortedBoards = sortBoards(boards);

  let titleHtml = '';
  if (searchQuery) titleHtml = `${allIcon()} Результаты поиска «${escHtml(searchQuery)}»`;
  else if (curFolderId === '__recent') titleHtml = `${clockIcon()} Недавние`;
  else if (curFolderId === null) titleHtml = `${allIcon()} Все доски`;
  else {
    const f = DB.folders.find(x => x.id === curFolderId);
    titleHtml = `${folderIcon()} ${escHtml(f ? f.name : '')}`;
  }
  document.getElementById('blTitle').innerHTML = titleHtml;

  const grid = document.getElementById('blGrid');
  if (!folders.length && !sortedBoards.length){
    grid.innerHTML = '';
    grid.insertAdjacentHTML('afterend', '');
    document.querySelector('.bl-empty')?.remove();
    grid.insertAdjacentHTML('beforebegin', '');
    grid.innerHTML = `<div class="bl-empty" style="grid-column:1/-1">Здесь пока пусто — создайте первую доску или папку кнопками выше.</div>`;
    return;
  }

  let html = '';
  folders.forEach(f => {
    const n = DB.boards.filter(b => b.folderId === f.id).length;
    html += `
      <div class="bl-card folder" data-folder="${f.id}">
        <button class="bl-card-menu" data-menu="folder:${f.id}">⋯</button>
        <div class="bl-card-icon">${folderIcon()}</div>
        <div class="bl-card-body">
          <div class="bl-card-name">${escHtml(f.name)}</div>
          <div class="bl-card-meta">${n} ${n===1?'доска':'досок'}</div>
        </div>
      </div>`;
  });
  sortedBoards.forEach(b => {
    html += `
      <div class="bl-card" data-board="${b.id}">
        <button class="bl-card-menu" data-menu="board:${b.id}">⋯</button>
        <div class="bl-card-icon">${boardIcon()}</div>
        <div class="bl-card-body">
          <div class="bl-card-name">${escHtml(b.name)}</div>
          <div class="bl-card-meta">Создана ${fmtDate(b.createdAt)}</div>
        </div>
      </div>`;
  });
  grid.innerHTML = html;

  grid.querySelectorAll('.bl-card[data-folder]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.bl-card-menu')) return;
      curFolderId = card.dataset.folder;
      searchQuery = ''; document.getElementById('blSearch').value = '';
      renderList();
    });
  });
  grid.querySelectorAll('.bl-card[data-board]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.bl-card-menu')) return;
      openBoard(card.dataset.board);
    });
  });
  grid.querySelectorAll('.bl-card-menu').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); openCardMenu(btn); });
  });
}

function closeAnyMenu(){ document.querySelectorAll('.bl-menu-pop').forEach(m => m.remove()); }
document.addEventListener('click', (e) => {
  if (!e.target.closest('.bl-card-menu') && !e.target.closest('.bl-menu-pop')) closeAnyMenu();
});

function openCardMenu(btn){
  closeAnyMenu();
  const [kind, id] = btn.dataset.menu.split(':');
  const pop = document.createElement('div');
  pop.className = 'bl-menu-pop';
  pop.innerHTML = `
    <button data-act="rename">Переименовать</button>
    ${kind==='board' ? `<button data-act="move">Переместить…</button>` : ''}
    <button data-act="delete" class="danger">Удалить</button>
  `;
  document.body.appendChild(pop);
  const r = btn.getBoundingClientRect();
  pop.style.top = (r.bottom + 4 + window.scrollY) + 'px';
  pop.style.left = Math.min(r.left + window.scrollX, window.innerWidth - 170) + 'px';
  pop.addEventListener('click', (e) => {
    e.stopPropagation();
    const act = e.target.dataset.act;
    if (!act) return;
    if (act === 'rename'){
      const list = kind === 'folder' ? DB.folders : DB.boards;
      const item = list.find(x => x.id === id);
      const name = prompt('Новое название:', item.name);
      if (name && name.trim()){ item.name = name.trim(); saveDB(); renderList(); }
    } else if (act === 'delete'){
      if (kind === 'folder'){
        const n = DB.boards.filter(b => b.folderId === id).length;
        if (!confirm(`Удалить папку и ${n} досок в ней? Это нельзя отменить.`)) return;
        DB.boards = DB.boards.filter(b => b.folderId !== id);
        DB.folders = DB.folders.filter(f => f.id !== id);
      } else {
        if (!confirm('Удалить доску? Это нельзя отменить.')) return;
        DB.boards = DB.boards.filter(b => b.id !== id);
      }
      saveDB(); renderList();
    } else if (act === 'move'){
      const b = DB.boards.find(x => x.id === id);
      const names = ['(без папки)'].concat(DB.folders.map(f => f.name));
      const choice = prompt('Введите название папки:\n' + names.join(', '), '(без папки)');
      if (choice == null) return;
      if (choice.trim() === '' || choice === '(без папки)'){ b.folderId = null; }
      else {
        const f = DB.folders.find(f => f.name === choice.trim());
        if (f) b.folderId = f.id; else { alert('Такой папки нет.'); return; }
      }
      saveDB(); renderList();
    }
    closeAnyMenu();
  });
}

document.getElementById('blSearch').addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  renderList();
});
document.getElementById('blCreateBoard').addEventListener('click', () => {
  const b = {
    id: uid(), name: 'Доска без названия',
    folderId: (curFolderId && curFolderId !== '__recent') ? curFolderId : null,
    createdAt: nowTs(), updatedAt: nowTs(), lastOpenedAt: null,
    cellSize: 24, sheetCols: 76, sheetRows: 54, sheetCount: 1, pageOrder: 'h',
    objects: [], recentColors: PALETTE.map(p => p.tok), colorUsage: {},
  };
  DB.boards.push(b); saveDB();
  openBoard(b.id);
});
document.getElementById('blCreateFolder').addEventListener('click', () => {
  const name = prompt('Название папки:', 'Новая папка');
  if (!name || !name.trim()) return;
  DB.folders.push({ id: uid(), name: name.trim(), createdAt: nowTs() });
  saveDB(); renderList();
});
const sortLabels = { new: 'Сначала новые', old: 'Сначала старые', az: 'По названию (А—Я)' };
document.getElementById('blSortBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('blSortPop').classList.toggle('open');
});
document.getElementById('blSortPop').addEventListener('click', (e) => {
  const s = e.target.dataset.sort;
  if (!s) return;
  sortMode = s;
  document.getElementById('blSortLabel').textContent = sortLabels[s];
  document.getElementById('blSortPop').classList.remove('open');
  renderList();
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.bl-sort')) document.getElementById('blSortPop').classList.remove('open');
});

/* ═══════════════════════════════════════════════════════════════════════
   ЭКРАН 2 — сама доска: бесконечный векторный холст
   ═══════════════════════════════════════════════════════════════════════ */
const canvas = document.getElementById('boardCv');
const ctx = canvas.getContext('2d');
let B = null;              // текущая доска (прямая ссылка на объект в DB.boards)
let boardActive = false;
let dpr = Math.max(1, window.devicePixelRatio || 1);
let cssW = 0, cssH = 0;

/* доска — это одно сплошное полотно, лишь условно, полупрозрачными линиями
   поделённое на «листы» формата А4 (B.sheetCols × B.sheetRows клеток); сетка из
   200×200 таких листов достаточно велика, чтобы на практике ощущаться
   бесконечной, но при этом конечна — значит, можно упереть панораму
   в её края вместо бесконечной прокрутки в пустоту */
const SHEET_COLS = 200, SHEET_ROWS = 200;
const PAN_MARGIN = 40;      // небольшой запас за краем полотна, чтобы «упор» не был слишком резким
// размер листа храним в клетках (B.sheetCols × B.sheetRows), а не в пикселях —
// тогда при любом размере клетки края листа всегда попадают точно на линию сетки
function sheetWpx(){ return B.sheetCols * B.cellSize; }
function sheetHpx(){ return B.sheetRows * B.cellSize; }
function totalW(){ return sheetWpx() * SHEET_COLS; }
function totalH(){ return sheetHpx() * SHEET_ROWS; }
function clampCam(){
  if (!B || !cssW || !cssH) return;
  const tw = totalW(), th = totalH();
  const viewW = cssW / cam.zoom, viewH = cssH / cam.zoom;
  if (viewW >= tw + PAN_MARGIN*2) cam.x = (tw - viewW) / 2;
  else cam.x = clamp(cam.x, -PAN_MARGIN, tw + PAN_MARGIN - viewW);
  if (viewH >= th + PAN_MARGIN*2) cam.y = (th - viewH) / 2;
  else cam.y = clamp(cam.y, -PAN_MARGIN, th + PAN_MARGIN - viewH);
}

const cam = { x: 0, y: 0, zoom: 1 };
const ZOOM_MIN = 0.1, ZOOM_MAX = 4;

// какой из двух холстов (сама доска или заметки справочной панели, см.
// блок rf* ниже) последним получал жест мыши/пера — по нему решаем, куда
// направить общие «отменить/повторить/удалить» (кнопки и горячие клавиши),
// когда оба холста видны и доступны для рисования одновременно
let lastActiveSurface = 'board'; // 'board' | 'notes'

let tool = 'pen';
let curColorTok = '--pencil';
let curWidth = 2;
let curDash = false;
let curFill = false;
let curSnap = true;
let curArrowEnd = false;   // «Стрелка» — только для инструмента «Прямая»
let curArrowBoth = false;  // «Двухсторонняя стрелка» — тоже только для «Прямой»
let curOpacity = false;    // «Полупрозрачность» — общий тумблер для любого инструмента рисования
const SEMI_OPACITY = 0.45; // сама степень прозрачности при включённом тумблере
let radiusSetting = null;   // «заданный радиус» циркуля; null = определять кликом
let curFontSize = 22;       // текущий размер шрифта инструмента «Текст» (в мировых единицах, как ширина линии)

let selectedId = null;
let multiSelectIds = [];     // групповое выделение рамкой (marquee) или по общему groupId
let clipboardObjs = null;    // «Скопировать»/«Вставить» из расширенного меню выделения
let pendingMoveArmed = false; // кнопка «Переместить»: следующий клик где угодно на холсте потащит выделенное, даже мимо самой фигуры (удобно для тонких линий)
// «рука» по умолчанию только панорамирует, даже если жест начался прямо
// на фигуре — иначе панорамирование по доске, полной рисунков, было бы
// мучением. Двойной клик по фигуре «взводит» её (armedHandId) — после
// этого, пока инструмент не сменили, одиночные клики именно по ЭТОЙ
// фигуре двигают её/её узлы, а клики где угодно ещё по-прежнему панорамируют
let armedHandId = null;
// после построения фигуры (или вставки изображения) она сразу должна быть
// редактируемой — тянуть ручки/двигать — БЕЗ переключения на инструмент
// «выделение». editLockId — id этого объекта, editLockTool — каким
// инструментом он создан (или 'image'); пока инструмент не поменяли явно,
// клики по инструменту-создателю не начинают новую фигуру, а редактируют
// именно этот объект. Новую фигуру запускает только повторное нажатие
// кнопки инструмента (см. обработчик .bd-tool ниже).
let editLockId = null;
let editLockTool = null;
function enterEditLock(obj, viaTool){
  editLockId = obj.id; editLockTool = viaTool;
  selectedId = obj.id; multiSelectIds = [];
}
function clearEditLock(){ editLockId = null; editLockTool = null; }
let dragMode = null;        // null | 'move' | 'handle' | 'pan' | 'multimove' | 'marquee'
let dragHandleRole = null;
let dragObjId = null;
let dragStart = null;
let dragOrig = null;
let dragGroupIds = null;    // групповое перетаскивание (multimove)
let dragOrigMap = null;
let panStart = null, camStart = null;
let marqueeStart = null, marqueeCur = null; // рамка выделения инструмента «выделение»

let draft = null;           // {type, pts:[...]} — для line/ellipse/quad/angle
let curvePts = null;        // {pts:[...], preview} — «кривая»: произвольное число точек
let circleState = null;     // {center, r, previewR}
let polyState = null;       // {pts:[...]}
let penStroke = null;       // штрих, который рисуется прямо сейчас

const undoStack = [], redoStack = [];
const UNDO_LIMIT = 60;
function pushUndo(){
  undoStack.push(JSON.stringify(B.objects));
  if (undoStack.length > UNDO_LIMIT) undoStack.shift();
  redoStack.length = 0;
}
function doUndo(){
  if (!undoStack.length) return;
  redoStack.push(JSON.stringify(B.objects));
  B.objects = JSON.parse(undoStack.pop());
  selectedId = null; multiSelectIds = []; clearEditLock();
  updateContextMenu();
  scheduleRedraw(); saveDB();
}
function doRedo(){
  if (!redoStack.length) return;
  undoStack.push(JSON.stringify(B.objects));
  B.objects = JSON.parse(redoStack.pop());
  selectedId = null; multiSelectIds = []; clearEditLock();
  updateContextMenu();
  scheduleRedraw(); saveDB();
}

function openBoard(id){
  const b = DB.boards.find(x => x.id === id);
  if (!b) return;
  b.lastOpenedAt = nowTs();
  B = b;
  B.objects = B.objects || [];
  B.recentColors = B.recentColors && B.recentColors.length ? B.recentColors : PALETTE.map(p => p.tok);
  B.colorUsage = B.colorUsage || {};
  B.cellSize = B.cellSize || 24;
  if (!B.sheetCols || !B.sheetRows){
    // миграция со старых досок (размер листа в пикселях, не выровненный по клеткам) —
    // переходим на новый, всегда идеально выровненный по сетке стандарт
    B.sheetCols = B.sheetW ? Math.max(2, Math.round(B.sheetW / B.cellSize)) : 76;
    B.sheetRows = B.sheetH ? Math.max(2, Math.round(B.sheetH / B.cellSize)) : 54;
  }
  delete B.sheetW; delete B.sheetH;
  B.pageOrder = B.pageOrder || 'h';
  B.imageLib = B.imageLib || [];
  if (B.gridColor === undefined) B.gridColor = null; // null = цвет по теме (авто)
  if (B.showPageNumbers === undefined) B.showPageNumbers = false;
  B.refPanel = Object.assign(defaultRefPanel(), B.refPanel || {});
  B.refPanel.imageObjects = B.refPanel.imageObjects || [];
  if (B.refPanel.imageSrc){
    // миграция со старых досок: раньше вкладка «Изображение» держала ровно
    // одну картинку строкой (B.refPanel.imageSrc). Теперь картинки — обычные
    // объекты, как на самой доске (B.refPanel.imageObjects), их можно вставить
    // сразу несколько, независимо двигать/масштабировать и рисовать поверх —
    // превращаем старую единственную картинку в такой объект один раз, при
    // первом открытии доски после обновления
    const legacySrc = B.refPanel.imageSrc;
    delete B.refPanel.imageSrc;
    if (!B.refPanel.imageObjects.some(o => o.src === legacySrc)){
      const legacyObj = { id: uid(), type: 'image', src: legacySrc, points: [{x:20,y:20}], w:240, h:180 };
      B.refPanel.imageObjects.push(legacyObj);
      loadImageSize(legacySrc).then(size => {
        if (!B.refPanel.imageObjects.includes(legacyObj)) return; // доску успели закрыть/картинку удалить, пока грузился размер
        const maxDim = 240; let w = size.w, h = size.h;
        if (w > maxDim || h > maxDim){ const s = maxDim / Math.max(w,h); w *= s; h *= s; }
        legacyObj.w = w; legacyObj.h = h; legacyObj.natW = size.w; legacyObj.natH = size.h;
        saveDB(); if (rfVisible()) rfScheduleRedraw();
      });
    }
  }
  saveDB();
  // необязательный хук для boards-cloud.js (общая доска с учеником) — сам
  // движок доски ничего не знает про облако, просто сообщает, какая доска
  // открылась, если такой слушатель вообще подключён
  if (window.onBoardOpened) window.onBoardOpened(B);

  screenList.style.display = 'none';
  screenBoard.style.display = 'block';
  boardActive = true;
  document.title = b.name + ' — Доски';
  document.getElementById('bdName').value = b.name;
  location.hash = 'board=' + id;

  undoStack.length = 0; redoStack.length = 0; selectedId = null; multiSelectIds = [];
  draft = null; curvePts = null; circleState = null; polyState = null; penStroke = null;
  armedHandId = null; clearEditLock();
  document.getElementById('bdCtxMenu')?.classList.remove('open');
  document.getElementById('bdImgSrcPop')?.classList.remove('open');
  updateCursor();
  // «заметки» справочной панели — отдельный, независимый холст (см. блок
  // rf* ниже); у каждой доски свой набор объектов в B.refPanel.drawObjects,
  // поэтому его состояние тоже сбрасываем при открытии другой доски
  rfResetTransient();
  rfCam.x = 0; rfCam.y = 0; rfCam.zoom = 1;
  rfUpdateCursor();
  applyRefPanel();

  requestAnimationFrame(() => {
    resizeCanvas();
    cam.zoom = 1;
    // центрируем ровно на середину ОДНОГО конкретного центрального листа, а не
    // на геометрический центр всего полотна — при чётном числе листов (200×200)
    // тот центр приходится точно на стык границ четырёх соседних листов, и
    // доска открывалась «на крестовине». Средний лист (индексы 100,100 из
    // 0..199) даёт целую страницу ровно посередине экрана.
    const midCol = Math.floor(SHEET_COLS/2), midRow = Math.floor(SHEET_ROWS/2);
    const sheetCenterX = (midCol + 0.5) * sheetWpx();
    const sheetCenterY = (midRow + 0.5) * sheetHpx();
    cam.x = sheetCenterX - cssW/2/cam.zoom;
    cam.y = sheetCenterY - cssH/2/cam.zoom;
    clampCam();
    updateZoomLabel();
    updateSettingsUI();
    renderSwatches();
    scheduleRedraw();
    // если у справочной панели сохранена открытая вкладка «Текст» →
    // «Рисовать» — сразу подогнать размер её собственного холста
    if (rfVisible()){ rfResizeCanvas(); rfScheduleRedraw(); }
  });
}

function backToList(){
  boardActive = false;
  screenBoard.style.display = 'none';
  screenList.style.display = 'flex';
  location.hash = '';
  saveDB();
  renderList();
  if (window.onBoardClosed) window.onBoardClosed();
}
document.getElementById('bdBack').addEventListener('click', backToList);
document.getElementById('bdName').addEventListener('input', (e) => {
  if (!B) return;
  B.name = e.target.value || 'Доска без названия';
  document.title = B.name + ' — Доски';
  saveDB();
});

/* ── подгонка размера холста под окно ── */
function resizeCanvas(){
  dpr = Math.max(1, window.devicePixelRatio || 1);
  cssW = window.innerWidth; cssH = window.innerHeight;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  clampCam();
  scheduleRedraw();
}
window.addEventListener('resize', () => { if (boardActive) resizeCanvas(); if (rfVisible()) rfResizeCanvas(); });

/* ── камера: мир ↔ экран ──
   activeCam — камера, с которой сейчас идёт отрисовка: обычно это просто
   `cam` (живой вид на экране), но на время экспорта в PNG render() подменяет
   её на отдельную «виртуальную» камеру, чтобы нарисовать всю доску целиком,
   не трогая при этом текущий масштаб/панораму, которые видит пользователь */
let activeCam = cam;
function worldToScreen(p){ return { x: (p.x - activeCam.x) * activeCam.zoom, y: (p.y - activeCam.y) * activeCam.zoom }; }
function screenToWorld(sx, sy){ return { x: sx / cam.zoom + cam.x, y: sy / cam.zoom + cam.y }; }
function eventWorld(e){
  const r = canvas.getBoundingClientRect();
  return screenToWorld(e.clientX - r.left, e.clientY - r.top);
}
function setZoom(z, wx, wy, sx, sy){
  z = clamp(z, ZOOM_MIN, ZOOM_MAX);
  cam.zoom = z;
  cam.x = wx - sx / z;
  cam.y = wy - sy / z;
  clampCam();
  updateZoomLabel();
  scheduleRedraw();
}
function updateZoomLabel(){ document.getElementById('railZoomLabel').textContent = Math.round(cam.zoom * 100) + '%'; }

function maybeSnap(p){
  if (!curSnap || !B) return p;
  const c = B.cellSize;
  return { x: Math.round(p.x / c) * c, y: Math.round(p.y / c) * c };
}

/* ═══════════════════════════════════════════════════════════════════════
   РИСОВАНИЕ
   ═══════════════════════════════════════════════════════════════════════ */
let redrawScheduled = false;
function scheduleRedraw(){
  if (redrawScheduled) return;
  redrawScheduled = true;
  requestAnimationFrame(() => { redrawScheduled = false; if (boardActive) render(ctx, cssW, cssH, cam, true); });
}

/* доска — сплошное полотно: одна заливка «бумаги» на весь мир (0..totalW,
   0..totalH), поверх — мелкая рабочая сетка и чуть более заметные, но
   всё равно полупрозрачные линии на границах листов формата А4. Линии
   считаются только в видимой части экрана — иначе на сетке 200×200
   листов пришлось бы каждый кадр перебирать десятки тысяч линий. */
function drawSheetsAndGrid(c, camv, w, h){
  // свой цвет клетки (настройки листа) — если не выбран, берём цвет по теме
  const gridColor = B.gridColor ? resolveColor(B.gridColor) : getComputedStyle(document.documentElement).getPropertyValue('--grid').trim();
  const paperColor = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim();
  const tw = totalW(), th = totalH();

  const p0 = worldToScreen({ x: 0, y: 0 });
  const p1 = worldToScreen({ x: tw, y: th });
  c.save();
  c.shadowColor = 'rgba(20,30,60,.16)'; c.shadowBlur = 26;
  c.fillStyle = paperColor;
  c.fillRect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);
  c.restore();

  const worldLeft = Math.max(0, camv.x), worldTop = Math.max(0, camv.y);
  const worldRight = Math.min(tw, camv.x + w / camv.zoom), worldBottom = Math.min(th, camv.y + h / camv.zoom);
  if (worldLeft >= worldRight || worldTop >= worldBottom) return;

  c.save();
  c.beginPath(); c.rect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y); c.clip();

  const cell = B.cellSize * camv.zoom;
  if (cell > 4){
    c.strokeStyle = gridColor; c.lineWidth = 1; c.globalAlpha = 0.55;
    const xStart = Math.floor(worldLeft / B.cellSize) * B.cellSize;
    const yStart = Math.floor(worldTop / B.cellSize) * B.cellSize;
    for (let x = xStart; x <= worldRight; x += B.cellSize){
      const sx = worldToScreen({ x, y: 0 }).x;
      c.beginPath(); c.moveTo(Math.round(sx)+0.5, p0.y); c.lineTo(Math.round(sx)+0.5, p1.y); c.stroke();
    }
    for (let y = yStart; y <= worldBottom; y += B.cellSize){
      const sy = worldToScreen({ x: 0, y }).y;
      c.beginPath(); c.moveTo(p0.x, Math.round(sy)+0.5); c.lineTo(p1.x, Math.round(sy)+0.5); c.stroke();
    }
  }

  // условные границы листов А4 — не жёсткое разделение, просто более
  // заметная (но всё ещё полупрозрачная) линия поверх той же сетки
  c.globalAlpha = 0.9; c.lineWidth = 1.6;
  const sw = sheetWpx(), sh = sheetHpx();
  const colStart = Math.floor(worldLeft / sw) * sw;
  const rowStart = Math.floor(worldTop / sh) * sh;
  for (let x = colStart; x <= worldRight; x += sw){
    const sx = worldToScreen({ x, y: 0 }).x;
    c.beginPath(); c.moveTo(Math.round(sx)+0.5, p0.y); c.lineTo(Math.round(sx)+0.5, p1.y); c.stroke();
  }
  for (let y = rowStart; y <= worldBottom; y += sh){
    const sy = worldToScreen({ x: 0, y }).y;
    c.beginPath(); c.moveTo(p0.x, Math.round(sy)+0.5); c.lineTo(p1.x, Math.round(sy)+0.5); c.stroke();
  }

  if (B.showPageNumbers){
    // координаты листов считаем от среднего листа полотна (200×200,
    // индексы 0..199) — та же точка, что openBoard() открывает по
    // умолчанию, поэтому "средняя (стартовая) страница" всегда 0,0
    const midCol = Math.floor(SHEET_COLS/2), midRow = Math.floor(SHEET_ROWS/2);
    const colFrom = Math.floor(worldLeft / sw), colTo = Math.floor(worldRight / sw);
    const rowFrom = Math.floor(worldTop / sh), rowTo = Math.floor(worldBottom / sh);
    c.save();
    c.setLineDash([]);
    c.fillStyle = gridColor;
    c.globalAlpha = 0.55;
    // размер шрифта — не больше одной клетки (в мировых единицах), но и не
    // мельче читаемого минимума на маленьком масштабе
    c.font = Math.max(8, Math.min(B.cellSize*0.6, B.cellSize) * camv.zoom) + 'px var(--font-ui), sans-serif';
    c.textAlign = 'left'; c.textBaseline = 'top';
    const pad = 3 * camv.zoom;
    for (let row = rowFrom; row <= rowTo; row++){
      for (let col = colFrom; col <= colTo; col++){
        const pageX = col - midCol, pageY = midRow - row;
        const corner = worldToScreen({ x: col*sw, y: row*sh });
        c.fillText(pageX + ',' + pageY, corner.x + pad, corner.y + pad);
      }
    }
    c.restore();
  }

  c.restore();
}
function roundRectPath(c, x, y, w, h, rad){
  const r = Math.min(rad, w/2, h/2);
  c.beginPath();
  c.moveTo(x+r, y);
  c.arcTo(x+w, y, x+w, y+h, r);
  c.arcTo(x+w, y+h, x, y+h, r);
  c.arcTo(x, y+h, x, y, r);
  c.arcTo(x, y, x+w, y, r);
  c.closePath();
}

function drawArrowHead(c, from, to, lenPx){
  const angle = Math.atan2(to.y-from.y, to.x-from.x);
  const headLen = Math.max(9, lenPx*3.2);
  const spread = Math.PI/7;
  c.beginPath();
  c.moveTo(to.x - headLen*Math.cos(angle-spread), to.y - headLen*Math.sin(angle-spread));
  c.lineTo(to.x, to.y);
  c.lineTo(to.x - headLen*Math.cos(angle+spread), to.y - headLen*Math.sin(angle+spread));
  c.stroke();
}
function strokePolyline(c, pts, smooth){
  if (!pts.length) return;
  c.beginPath();
  if (pts.length === 1){ c.moveTo(pts[0].x, pts[0].y); c.lineTo(pts[0].x+0.01, pts[0].y+0.01); }
  else if (!smooth || pts.length === 2){
    c.moveTo(pts[0].x, pts[0].y);
    for (let i=1;i<pts.length;i++) c.lineTo(pts[i].x, pts[i].y);
  } else {
    c.moveTo(pts[0].x, pts[0].y);
    for (let i=1;i<pts.length-1;i++){
      const mx=(pts[i].x+pts[i+1].x)/2, my=(pts[i].y+pts[i+1].y)/2;
      c.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    const last=pts[pts.length-1], prev=pts[pts.length-2];
    c.quadraticCurveTo(prev.x, prev.y, last.x, last.y);
  }
  c.stroke();
}

/* «кривая» — произвольное число точек, соединённых ОДНОЙ плавной линией,
   проходящей ровно через каждую поставленную точку: сплайн Катмулла-Рома,
   переведённый в кубические Безье (натяжение 1/6 — мягкая, «параболическая»
   плавность без резких изгибов) */
function strokeSmoothThroughPoints(c, pts){
  if (!pts.length) return;
  if (pts.length === 1){ c.beginPath(); c.moveTo(pts[0].x,pts[0].y); c.lineTo(pts[0].x+0.01,pts[0].y+0.01); c.stroke(); return; }
  if (pts.length === 2){ c.beginPath(); c.moveTo(pts[0].x,pts[0].y); c.lineTo(pts[1].x,pts[1].y); c.stroke(); return; }
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y);
  for (let i=0;i<pts.length-1;i++){
    const p0 = pts[i-1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i+1];
    const p3 = pts[i+2] || p2;
    const cp1x = p1.x + (p2.x-p0.x)/6, cp1y = p1.y + (p2.y-p0.y)/6;
    const cp2x = p2.x - (p3.x-p1.x)/6, cp2y = p2.y - (p3.y-p1.y)/6;
    c.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
  c.stroke();
}

/* ── изображения: кэш загруженных <img>, чтобы не пересоздавать их каждый кадр ── */
const imgCache = {};
function getImg(src){
  if (!imgCache[src]){
    const im = new Image();
    im.onload = () => scheduleRedraw();
    im.src = src;
    imgCache[src] = im;
  }
  return imgCache[src];
}
function renderImageObject(c, obj, camv){
  const p0 = worldToScreen(obj.points[0]);
  const p1 = worldToScreen({ x: obj.points[0].x + obj.w, y: obj.points[0].y + obj.h });
  const w = p1.x - p0.x, h = p1.y - p0.y;
  const im = getImg(obj.src);
  c.save();
  if (im.complete && im.naturalWidth){
    c.drawImage(im, p0.x, p0.y, w, h);
  } else {
    c.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--glass-strong').trim() || '#eee';
    roundRectPath(c, p0.x, p0.y, w, h, 8);
    c.fill();
    c.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--muted-2').trim() || '#888';
    c.font = '13px var(--font-ui), sans-serif'; c.textAlign='center'; c.textBaseline='middle';
    c.fillText('Загрузка…', p0.x + w/2, p0.y + h/2);
  }
  c.restore();
}

function renderObject(c, obj, camv, opts){
  if (obj.type === 'image'){ renderImageObject(c, obj, camv); return; }
  opts = opts || {};
  const color = resolveColor(obj.color);
  c.save();
  c.strokeStyle = color; c.fillStyle = color;
  c.lineWidth = Math.max(0.5, obj.width || 1) * camv.zoom;
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (obj.opacity != null) c.globalAlpha = obj.opacity;
  c.setLineDash(obj.dash ? [obj.width*3.4*camv.zoom, obj.width*2.4*camv.zoom] : []);
  const wp = obj.points.map(p => worldToScreen(p));

  if (obj.type === 'pen'){
    strokePolyline(c, wp, true);
  } else if (obj.type === 'line'){
    strokePolyline(c, wp, false);
    if (obj.arrowEnd || obj.arrowStart){
      c.save(); c.setLineDash([]);
      if (obj.arrowEnd) drawArrowHead(c, wp[0], wp[1], c.lineWidth);
      if (obj.arrowStart) drawArrowHead(c, wp[1], wp[0], c.lineWidth);
      c.restore();
    }
  } else if (obj.type === 'curve'){
    if (obj.ctrl){
      // старый формат (2 точки + управляющая) — квадратичная безье, оставлена для совместимости
      const cw = worldToScreen(obj.ctrl);
      c.beginPath(); c.moveTo(wp[0].x, wp[0].y); c.quadraticCurveTo(cw.x, cw.y, wp[1].x, wp[1].y); c.stroke();
    } else {
      strokeSmoothThroughPoints(c, wp);
    }
  } else if (obj.type === 'quad' || obj.type === 'poly'){
    c.beginPath(); c.moveTo(wp[0].x, wp[0].y);
    for (let i=1;i<wp.length;i++) c.lineTo(wp[i].x, wp[i].y);
    c.closePath();
    if (obj.fill){ c.globalAlpha = 0.16; c.fill(); c.globalAlpha = obj.opacity != null ? obj.opacity : 1; }
    c.stroke();
  } else if (obj.type === 'ellipse'){
    const cxy = worldToScreen(obj.points[0]);
    c.beginPath(); c.ellipse(cxy.x, cxy.y, Math.max(1,obj.rx*camv.zoom), Math.max(1,obj.ry*camv.zoom), 0, 0, Math.PI*2);
    if (obj.fill){ c.globalAlpha = 0.16; c.fill(); c.globalAlpha = obj.opacity != null ? obj.opacity : 1; }
    c.stroke();
  } else if (obj.type === 'circle'){
    const cxy = worldToScreen(obj.points[0]);
    c.beginPath(); c.arc(cxy.x, cxy.y, Math.max(1,obj.r*camv.zoom), 0, Math.PI*2);
    if (obj.fill){ c.globalAlpha = 0.16; c.fill(); c.globalAlpha = obj.opacity != null ? obj.opacity : 1; }
    c.stroke();
    c.beginPath(); c.arc(cxy.x, cxy.y, 2, 0, Math.PI*2); c.fill();
  } else if (obj.type === 'angle'){
    // вершина угла — ВТОРАЯ поставленная точка (obj.points[1]); лучи идут
    // к первой и третьей точкам
    const a = wp[0], v = wp[1], b = wp[2];
    c.beginPath(); c.moveTo(v.x, v.y); c.lineTo(a.x, a.y); c.stroke();
    c.beginPath(); c.moveTo(v.x, v.y); c.lineTo(b.x, b.y); c.stroke();
    drawAngleArcAndLabel(c, v, a, b, camv, obj.width);
  } else if (obj.type === 'text'){
    const p = wp[0];
    const fs = Math.max(1, (obj.fontSize || 22) * camv.zoom);
    c.setLineDash([]);
    c.font = fs + 'px var(--font-ui), sans-serif';
    c.textAlign = 'left'; c.textBaseline = 'top';
    const lineH = fs * 1.25;
    (obj.content || '').split('\n').forEach((line, i) => { c.fillText(line, p.x, p.y + i*lineH); });
  }
  c.restore();
}

/* дуга + подпись градусов угла — используется и для уже построенного объекта
   (renderObject), и для живого превью во время постановки третьей точки
   (drawDraftPreview), поэтому вынесена в отдельную функцию */
function drawAngleArcAndLabel(c, v, a, b, camv, width){
  const v1 = { x: a.x-v.x, y: a.y-v.y };
  const v2 = { x: b.x-v.x, y: b.y-v.y };
  const ang1 = Math.atan2(v1.y, v1.x), ang2 = Math.atan2(v2.y, v2.x);
  let deg = Math.abs((ang2-ang1) * 180/Math.PI); if (deg > 180) deg = 360-deg;
  const arcR = 28*camv.zoom;
  c.save(); c.setLineDash([]); c.lineWidth = Math.max(1, (width||2)*0.6)*camv.zoom;
  c.beginPath(); c.arc(v.x, v.y, arcR, ang1, ang2, false); c.stroke();
  c.restore();
  const midAng = ang1 + (ang2-ang1)/2;
  const lx = v.x + Math.cos(midAng)*(arcR+16*camv.zoom), ly = v.y + Math.sin(midAng)*(arcR+16*camv.zoom);
  c.save();
  c.font = (13*Math.max(0.7,Math.min(1.4,camv.zoom))) + 'px var(--font-ui), sans-serif';
  c.textAlign='center'; c.textBaseline='middle'; c.setLineDash([]);
  c.fillText(Math.round(deg) + '°', lx, ly);
  c.restore();
}

function getHandles(obj){
  if (obj.type === 'line') return [{role:'p0',x:obj.points[0].x,y:obj.points[0].y},{role:'p1',x:obj.points[1].x,y:obj.points[1].y}];
  if (obj.type === 'curve'){
    if (obj.ctrl) return [{role:'p0',x:obj.points[0].x,y:obj.points[0].y},{role:'p1',x:obj.points[1].x,y:obj.points[1].y},{role:'ctrl',x:obj.ctrl.x,y:obj.ctrl.y}];
    // новый формат — произвольное число точек, ручка на каждой (как у многоугольника)
    return obj.points.map((p,i)=>({role:'pt'+i,x:p.x,y:p.y}));
  }
  if (obj.type === 'quad' || obj.type === 'poly' || obj.type === 'angle') return obj.points.map((p,i)=>({role:'pt'+i,x:p.x,y:p.y}));
  if (obj.type === 'ellipse'){
    const c = obj.points[0];
    return [
      {role:'center',x:c.x,y:c.y},
      {role:'e',x:c.x+obj.rx,y:c.y},
      {role:'w',x:c.x-obj.rx,y:c.y},
      {role:'n',x:c.x,y:c.y-obj.ry},
      {role:'s',x:c.x,y:c.y+obj.ry},
    ];
  }
  if (obj.type === 'circle'){
    const c = obj.points[0];
    return [{role:'center',x:c.x,y:c.y},{role:'r',x:c.x+obj.r,y:c.y}];
  }
  if (obj.type === 'image'){
    // маркеры изменения размера доступны и у закреплённых картинок —
    // закрепление защищает только от ластика, двигать и тянуть за угол
    // можно всегда, пока картинка в фокусе (выделена/только что вставлена)
    const p = obj.points[0];
    return [
      {role:'nw',x:p.x,y:p.y},
      {role:'ne',x:p.x+obj.w,y:p.y},
      {role:'se',x:p.x+obj.w,y:p.y+obj.h},
      {role:'sw',x:p.x,y:p.y+obj.h},
    ];
  }
  return [];
}
function applyHandle(obj, role, pt){
  pt = maybeSnap(pt);
  if (role === 'p0') obj.points[0] = pt;
  else if (role === 'p1') obj.points[1] = pt;
  else if (role === 'ctrl') obj.ctrl = pt;
  else if (role && role.indexOf('pt') === 0){ obj.points[+role.slice(2)] = pt; }
  else if (obj.type === 'ellipse'){
    const c = obj.points[0];
    if (role === 'center') obj.points[0] = pt;
    else if (role === 'e') obj.rx = Math.max(4, Math.abs(pt.x - c.x));
    else if (role === 'w') obj.rx = Math.max(4, Math.abs(c.x - pt.x));
    else if (role === 'n') obj.ry = Math.max(4, Math.abs(c.y - pt.y));
    else if (role === 's') obj.ry = Math.max(4, Math.abs(pt.y - c.y));
  } else if (obj.type === 'circle'){
    if (role === 'center') obj.points[0] = pt;
    else if (role === 'r') obj.r = Math.max(4, dist(obj.points[0], pt));
  } else if (obj.type === 'image' && (role === 'se' || role === 'sw' || role === 'ne' || role === 'nw')){
    // сохраняем исходные пропорции — тянуть можно только по диагонали;
    // противоположный угол остаётся неподвижным «якорем»
    const p = obj.points[0];
    const ratio = obj.natW / obj.natH;
    const anchors = {
      se: { x: p.x,          y: p.y          },
      sw: { x: p.x + obj.w,  y: p.y          },
      ne: { x: p.x,          y: p.y + obj.h  },
      nw: { x: p.x + obj.w,  y: p.y + obj.h  },
    };
    const anchor = anchors[role];
    const w = Math.max(20, Math.abs(pt.x - anchor.x));
    const h = Math.max(20, w / ratio);
    let x0, y0;
    if (role === 'se'){ x0 = anchor.x; y0 = anchor.y; }
    else if (role === 'sw'){ x0 = anchor.x - w; y0 = anchor.y; }
    else if (role === 'ne'){ x0 = anchor.x; y0 = anchor.y - h; }
    else { x0 = anchor.x - w; y0 = anchor.y - h; } // nw
    obj.points[0] = { x: x0, y: y0 };
    obj.w = w; obj.h = h;
  }
}

function drawSelection(c, obj, camv){
  const handles = getHandles(obj);
  c.save();
  c.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
  c.strokeStyle = '#fff'; c.lineWidth = 1.5;
  handles.forEach(h => {
    const s = worldToScreen(h);
    c.beginPath(); c.arc(s.x, s.y, 5, 0, Math.PI*2); c.fill(); c.stroke();
  });
  c.restore();
}

function drawDraftPreview(c, camv){
  c.save();
  c.strokeStyle = resolveColor(curColorTok);
  c.fillStyle = resolveColor(curColorTok);
  c.lineWidth = Math.max(0.5, curWidth) * camv.zoom;
  c.lineCap='round'; c.lineJoin='round';
  c.setLineDash(curDash ? [curWidth*3.4*camv.zoom, curWidth*2.4*camv.zoom] : []);
  if (curOpacity) c.globalAlpha = SEMI_OPACITY;

  if (draft && draft.pts.length){
    const pts = draft.pts.slice();
    if (draft.preview) pts.push(draft.preview);
    const wp = pts.map(p=>worldToScreen(p));
    c.beginPath(); c.moveTo(wp[0].x, wp[0].y);
    for (let i=1;i<wp.length;i++) c.lineTo(wp[i].x, wp[i].y);
    if (draft.type === 'quad' && pts.length >= 3) c.closePath();
    c.stroke();
    if (draft.type === 'line' && wp.length === 2 && (curArrowEnd || curArrowBoth)){
      c.save(); c.setLineDash([]);
      drawArrowHead(c, wp[0], wp[1], c.lineWidth);
      if (curArrowBoth) drawArrowHead(c, wp[1], wp[0], c.lineWidth);
      c.restore();
    }
    // угол: вершина — вторая поставленная точка. Пока наводим третью точку
    // (после второго клика, ещё без третьего) — первые два отрезка уже видны
    // выше как обычная ломаная (draft.pts[0]→draft.pts[1]→preview), а здесь
    // дополнительно рисуем дугу и живое значение градуса, не дожидаясь клика
    if (draft.type === 'angle' && draft.pts.length === 2 && draft.preview){
      drawAngleArcAndLabel(c, wp[1], wp[0], wp[2], camv, curWidth);
    }
  }
  if (curvePts && curvePts.pts.length){
    const pts = curvePts.pts.slice();
    if (curvePts.preview) pts.push(curvePts.preview);
    strokeSmoothThroughPoints(c, pts.map(p=>worldToScreen(p)));
    // точки уже поставленные — маленькими маркерами, чтобы видеть, где кликнули
    pts.slice(0, curvePts.pts.length).forEach(p => {
      const s = worldToScreen(p);
      c.beginPath(); c.arc(s.x, s.y, 2.5, 0, Math.PI*2); c.fill();
    });
  }
  if (circleState){
    const cxy = worldToScreen(circleState.center);
    const r = (circleState.r != null ? circleState.r : (circleState.previewR||0)) * camv.zoom;
    c.beginPath(); c.arc(cxy.x, cxy.y, Math.max(1,r), 0, Math.PI*2); c.stroke();
    c.beginPath(); c.arc(cxy.x, cxy.y, 2, 0, Math.PI*2); c.fill();
  }
  if (polyState && polyState.pts.length){
    const pts = polyState.pts.slice();
    if (polyState.preview) pts.push(polyState.preview);
    const wp = pts.map(p=>worldToScreen(p));
    c.beginPath(); c.moveTo(wp[0].x, wp[0].y);
    for (let i=1;i<wp.length;i++) c.lineTo(wp[i].x, wp[i].y);
    c.stroke();
  }
  if (penStroke){
    strokePolyline(c, penStroke.points.map(p=>worldToScreen(p)), true);
  }
  c.restore();
}

function render(c, w, h, camv, isScreen, renderDpr){
  if (renderDpr === undefined) renderDpr = dpr;
  activeCam = camv;
  c.save();
  c.setTransform(renderDpr,0,0,renderDpr,0,0);
  c.clearRect(0,0,w,h);
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  c.fillStyle = bg; c.fillRect(0,0,w,h);
  c.restore();

  c.save();
  c.setTransform(renderDpr,0,0,renderDpr,0,0);
  drawSheetsAndGrid(c, camv, w, h);
  B.objects.forEach(o => renderObject(c, o, camv));
  if (isScreen) drawDraftPreview(c, camv);
  if (isScreen && selectedId){
    const obj = B.objects.find(o=>o.id===selectedId);
    if (obj) drawSelection(c, obj, camv);
  }
  if (isScreen && multiSelectIds.length){
    multiSelectIds.forEach(id => {
      const obj = B.objects.find(o=>o.id===id);
      if (obj) drawMultiOutline(c, obj, camv);
    });
  }
  if (isScreen && dragMode === 'marquee' && marqueeStart && marqueeCur) drawMarquee(c, camv);
  c.restore();
  if (isScreen){ updateUnlockBtn(); updateContextMenu(); }
}
function drawMultiOutline(c, obj, camv){
  const b = objectBBox(obj);
  const p0 = worldToScreen({x:b.minX,y:b.minY}), p1 = worldToScreen({x:b.maxX,y:b.maxY});
  c.save();
  c.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
  c.setLineDash([5,3]); c.lineWidth = 1.5;
  c.strokeRect(Math.min(p0.x,p1.x)-4, Math.min(p0.y,p1.y)-4, Math.abs(p1.x-p0.x)+8, Math.abs(p1.y-p0.y)+8);
  c.restore();
}
function drawMarquee(c, camv){
  const x0=Math.min(marqueeStart.x,marqueeCur.x), y0=Math.min(marqueeStart.y,marqueeCur.y);
  const x1=Math.max(marqueeStart.x,marqueeCur.x), y1=Math.max(marqueeStart.y,marqueeCur.y);
  const p0 = worldToScreen({x:x0,y:y0}), p1 = worldToScreen({x:x1,y:y1});
  c.save();
  c.fillStyle = 'rgba(0,120,255,.10)';
  c.strokeStyle = 'rgba(0,120,255,.9)';
  c.lineWidth = 1.4; c.setLineDash([5,4]);
  c.fillRect(p0.x, p0.y, p1.x-p0.x, p1.y-p0.y);
  c.strokeRect(p0.x, p0.y, p1.x-p0.x, p1.y-p0.y);
  c.restore();
}

/* ═══════════════════════════════════════════════════════════════════════
   ИНСТРУМЕНТЫ — точки собираются кликами (без перетаскивания), что даёт
   единый, предсказуемый жест для всех фигур
   ═══════════════════════════════════════════════════════════════════════ */
const FIXED_COUNT = { line: 2, ellipse: 2, quad: 4, angle: 3 };

function commitObject(obj){
  pushUndo();
  B.objects.push(obj);
  bumpColorUsage(obj.color);
  saveDB(); scheduleRedraw();
}
function newBase(type){
  const obj = { id: uid(), type, color: curColorTok, width: curWidth, dash: curDash, fill: curFill };
  if (curOpacity) obj.opacity = SEMI_OPACITY;
  if (type === 'line'){
    if (curArrowBoth){ obj.arrowStart = true; obj.arrowEnd = true; }
    else if (curArrowEnd){ obj.arrowEnd = true; }
  }
  return obj;
}
function bumpColorUsage(tok){
  // счётчик использований больше нигде не показываем (сбивал с толку) —
  // просто поднимаем цвет наверх списка недавних
  B.recentColors = [tok].concat(B.recentColors.filter(t=>t!==tok)).slice(0,8);
  saveDB(); renderSwatches();
}

/* ── инструмент «Текст» ──────────────────────────────────────────────────
   Клик по доске открывает всплывающее поле ввода прямо на месте клика;
   галочка (или потеря фокуса полем) фиксирует текст, крестик (или Escape)
   отменяет без изменений. Готовый объект хранит свои w/h (как картинка),
   пересчитываемые в measureTextObj — этим же прямоугольником пользуются
   попадание курсора (hitTestObject) и рамка выделения (objectBBox). ── */
let textEditSession = null; // { objId, isNew, worldPt, textarea, wrap } — пока открыто ровно одно поле редактирования

function measureTextObj(obj){
  const fs = obj.fontSize || 22;
  const lines = (obj.content || '').split('\n');
  ctx.save();
  ctx.font = fs + 'px var(--font-ui), sans-serif';
  let maxW = 0;
  lines.forEach(l => { const w = ctx.measureText(l).width; if (w > maxW) maxW = w; });
  ctx.restore();
  const lineH = fs * 1.25;
  obj.w = Math.max(4, maxW);
  obj.h = Math.max(lineH, lines.length * lineH);
}

function openTextEditor(existingObj, worldPt){
  // уже редактируем что-то другое — сначала фиксируем его (как клик мимо)
  if (textEditSession) confirmTextEditor();
  const isNew = !existingObj;
  const p = existingObj ? existingObj.points[0] : worldPt;
  const scr = worldToScreen(p);
  const r = canvas.getBoundingClientRect();

  const wrap = document.createElement('div');
  wrap.className = 'bd-text-editor';
  wrap.style.left = Math.round(r.left + scr.x) + 'px';
  wrap.style.top = Math.round(r.top + scr.y) + 'px';

  const ta = document.createElement('textarea');
  ta.className = 'bd-text-editor-input';
  ta.value = existingObj ? existingObj.content : '';
  ta.placeholder = 'Текст…';
  ta.style.color = resolveColor(existingObj ? existingObj.color : curColorTok);
  const fs = (existingObj ? existingObj.fontSize : curFontSize) || 22;
  ta.style.fontSize = Math.max(10, fs * cam.zoom) + 'px';

  const btns = document.createElement('div');
  btns.className = 'bd-text-editor-btns';
  const okBtn = document.createElement('button');
  okBtn.type = 'button'; okBtn.className = 'bd-text-editor-ok'; okBtn.title = 'Подтвердить'; okBtn.textContent = '\u2713';
  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button'; cancelBtn.className = 'bd-text-editor-cancel'; cancelBtn.title = 'Отмена'; cancelBtn.textContent = '\u2715';
  btns.appendChild(okBtn); btns.appendChild(cancelBtn);

  wrap.appendChild(ta); wrap.appendChild(btns);
  document.body.appendChild(wrap);

  textEditSession = { objId: existingObj ? existingObj.id : null, isNew, worldPt: p, textarea: ta, wrap };

  // клик по самим кнопкам не должен раньше времени увести фокус с textarea
  // (иначе сработал бы blur ниже и вызвал confirm ещё до клика по кнопке)
  okBtn.addEventListener('mousedown', (e) => e.preventDefault());
  cancelBtn.addEventListener('mousedown', (e) => e.preventDefault());
  okBtn.addEventListener('click', () => confirmTextEditor());
  cancelBtn.addEventListener('click', () => cancelTextEditor());
  // клик куда угодно ещё (по доске, по панели инструментов...) — считаем
  // подтверждением, как только поле теряет фокус
  ta.addEventListener('blur', () => { if (textEditSession) confirmTextEditor(); });
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Escape'){ e.preventDefault(); cancelTextEditor(); }
    else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)){ e.preventDefault(); confirmTextEditor(); }
  });
  ta.addEventListener('pointerdown', (e) => e.stopPropagation());

  // фокус — со следующего тика: клик по доске (сам canvas не фокусируемый)
  // сам по себе, как часть родного поведения mousedown, снял бы фокус с
  // только что созданного поля, если вызвать focus() прямо тут синхронно —
  // textarea мгновенно получала бы blur и поле закрывалось бы, не успев
  // открыться (blur-обработчик выше принял бы это за подтверждение)
  setTimeout(() => { ta.focus(); if (existingObj) ta.select(); }, 0);
}

function confirmTextEditor(){
  if (!textEditSession) return;
  const { objId, isNew, worldPt, textarea, wrap } = textEditSession;
  // снимаем сессию ДО удаления поля из DOM — удаление сфокусированного
  // textarea может само по себе синхронно вызвать 'blur' (см. обработчик
  // выше), и без этого confirmTextEditor() вызвался бы повторно, вложенно
  textEditSession = null;
  const value = textarea.value;
  wrap.remove();
  if (!value || !value.trim()) return; // пустой текст — ничего не создаём и не сохраняем
  if (isNew){
    const obj = { id: uid(), type:'text', color: curColorTok, fontSize: curFontSize, points:[worldPt], content: value };
    if (curOpacity) obj.opacity = SEMI_OPACITY;
    measureTextObj(obj);
    commitObject(obj);
  } else {
    const obj = B.objects.find(o=>o.id===objId);
    if (obj){
      pushUndo();
      obj.content = value;
      measureTextObj(obj);
      saveDB(); scheduleRedraw();
    }
  }
}

function cancelTextEditor(){
  if (!textEditSession) return;
  const { wrap } = textEditSession;
  textEditSession = null; // тот же порядок, что и в confirmTextEditor — на случай синхронного blur при remove()
  wrap.remove();
  scheduleRedraw();
}

function shapeClick(kind, pt){
  pt = maybeSnap(pt);
  if (!draft || draft.type !== kind) draft = { type: kind, pts: [] };
  draft.pts.push(pt);
  const need = FIXED_COUNT[kind];
  if (draft.pts.length >= need){
    const obj = newBase(kind);
    if (kind === 'ellipse'){
      const [a,b] = draft.pts;
      obj.points = [{x:(a.x+b.x)/2, y:(a.y+b.y)/2}];
      obj.rx = Math.max(4, Math.abs(a.x-b.x)/2);
      obj.ry = Math.max(4, Math.abs(a.y-b.y)/2);
    } else {
      obj.points = draft.pts.slice();
    }
    draft = null;
    commitObject(obj);
    enterEditLock(obj, kind);
  }
  scheduleRedraw();
}
/* ── «кривая»: произвольное число точек, соединённых одной плавной линией
   (сплайн Катмулла-Рома через все точки — проходит точно через каждую) ── */
function curvePointClick(pt){
  pt = maybeSnap(pt);
  if (!curvePts){ curvePts = { pts: [pt] }; return; }
  curvePts.pts.push(pt);
}
function finishCurve(){
  if (!curvePts || curvePts.pts.length < 2){ curvePts = null; scheduleRedraw(); return; }
  const obj = newBase('curve'); obj.points = curvePts.pts.slice();
  curvePts = null;
  commitObject(obj); enterEditLock(obj, 'curve');
}
function circleClick(pt){
  pt = maybeSnap(pt);
  if (!circleState){
    circleState = { center: pt, r: (radiusSetting>0 ? radiusSetting : null), previewR: 0 };
    if (circleState.r != null){
      const obj = newBase('circle'); obj.points=[pt]; obj.r=circleState.r;
      circleState = null; commitObject(obj); enterEditLock(obj, 'circle');
    }
    return;
  }
  const r = dist(circleState.center, pt);
  const obj = newBase('circle'); obj.points=[circleState.center]; obj.r = Math.max(4,r);
  circleState = null;
  commitObject(obj); enterEditLock(obj, 'circle');
  const input = document.getElementById('bdRadiusInput');
  input.value = Math.round(obj.r);
}
function polyClick(pt){
  pt = maybeSnap(pt);
  if (!polyState){ polyState = { pts: [pt] }; return; }
  if (polyState.pts.length >= 3 && dist(pt, polyState.pts[0]) < 14/cam.zoom){ finishPoly(); return; }
  polyState.pts.push(pt);
}
function finishPoly(){
  if (!polyState || polyState.pts.length < 3){ polyState = null; scheduleRedraw(); return; }
  const obj = newBase('poly'); obj.points = polyState.pts.slice();
  polyState = null;
  commitObject(obj); enterEditLock(obj, 'poly');
}
canvas.addEventListener('dblclick', (e) => {
  if (tool === 'poly' && polyState){
    if (polyState.pts.length) polyState.pts.pop();
    finishPoly();
    return;
  }
  if (tool === 'curve' && curvePts){
    // dblclick — это два подряд click/pointerdown; второй уже добавил лишнюю
    // точку в текущей позиции, её нужно убрать перед завершением кривой
    if (curvePts.pts.length) curvePts.pts.pop();
    finishCurve();
    return;
  }
  if (tool === 'hand'){
    const pt = eventWorld(e);
    let hit = null;
    for (let i=B.objects.length-1;i>=0;i--){ if (hitTestObject(B.objects[i], pt, 8/cam.zoom)){ hit=B.objects[i]; break; } }
    if (hit && hit.type === 'text'){
      armedHandId = null; selectedId = hit.id;
      openTextEditor(hit, null);
    } else if (hit && hit.type === 'image' && hit.locked){
      armedHandId = hit.id; selectedId = hit.id;
    } else if (hit){
      armedHandId = null; selectedId = hit.id;
    } else {
      armedHandId = null; selectedId = null;
    }
    scheduleRedraw();
  }
});

function cancelDrafts(){
  draft=null; curvePts=null; circleState=null; polyState=null; penStroke=null; armedHandId=null;
  marqueeStart=null; marqueeCur=null; pendingMoveArmed=false; clearEditLock();
  // расширенное меню выделения обновляем СРАЗУ (не дожидаясь следующего кадра
  // rAF) — иначе при быстрой смене инструмента меню на миг остаётся открытым
  // на старом месте и перехватывает клик, предназначенный холсту под ним
  updateContextMenu();
  scheduleRedraw();
}

/* ── ластик: целиком удаляет фигуру, к которой прикоснулись (векторный,
   без растровой композиции — проще и надёжнее для этой версии) ── */
function distToSeg(p,a,b){
  const dx=b.x-a.x, dy=b.y-a.y;
  const len2 = dx*dx+dy*dy;
  if (len2===0) return dist(p,a);
  let t = ((p.x-a.x)*dx+(p.y-a.y)*dy)/len2;
  t = clamp(t,0,1);
  return dist(p, { x:a.x+t*dx, y:a.y+t*dy });
}
function pointInPolygon(p, pts){
  let inside=false;
  for (let i=0,j=pts.length-1;i<pts.length;j=i++){
    const xi=pts[i].x, yi=pts[i].y, xj=pts[j].x, yj=pts[j].y;
    const intersect = ((yi>p.y)!==(yj>p.y)) && (p.x < (xj-xi)*(p.y-yi)/(yj-yi)+xi);
    if (intersect) inside=!inside;
  }
  return inside;
}
function hitTestObject(obj, pt, tol){
  if (obj.type==='pen' || obj.type==='line'){
    for (let i=0;i<obj.points.length-1;i++) if (distToSeg(pt,obj.points[i],obj.points[i+1])<=tol) return true;
    return obj.points.length===1 && dist(pt,obj.points[0])<=tol;
  }
  if (obj.type==='curve'){
    if (obj.ctrl){
      let prev=obj.points[0];
      for (let t=1;t<=12;t++){
        const s=t/12;
        const x=(1-s)*(1-s)*obj.points[0].x + 2*(1-s)*s*obj.ctrl.x + s*s*obj.points[1].x;
        const y=(1-s)*(1-s)*obj.points[0].y + 2*(1-s)*s*obj.ctrl.y + s*s*obj.points[1].y;
        if (distToSeg(pt,prev,{x,y})<=tol) return true;
        prev={x,y};
      }
      return false;
    }
    // новый формат — произвольное число точек; для попадания достаточно
    // приблизить сплайн отрезками между соседними точками (с запасом по tol)
    for (let i=0;i<obj.points.length-1;i++) if (distToSeg(pt,obj.points[i],obj.points[i+1])<=tol) return true;
    return false;
  }
  if (obj.type==='quad' || obj.type==='poly'){
    if (obj.fill && pointInPolygon(pt,obj.points)) return true;
    for (let i=0;i<obj.points.length;i++){
      const a=obj.points[i], b=obj.points[(i+1)%obj.points.length];
      if (distToSeg(pt,a,b)<=tol) return true;
    }
    return false;
  }
  if (obj.type==='ellipse'){
    const c=obj.points[0];
    const nx=(pt.x-c.x)/obj.rx, ny=(pt.y-c.y)/obj.ry;
    const rr = nx*nx+ny*ny;
    if (obj.fill) return rr<=1;
    return Math.abs(Math.sqrt(rr)-1) <= tol/Math.max(obj.rx,obj.ry);
  }
  if (obj.type==='circle'){
    const c=obj.points[0]; const d=dist(pt,c);
    if (obj.fill) return d<=obj.r;
    return Math.abs(d-obj.r)<=tol;
  }
  if (obj.type==='angle'){
    // вершина — points[1]; лучи идут к points[0] и points[2]
    return distToSeg(pt,obj.points[1],obj.points[0])<=tol || distToSeg(pt,obj.points[1],obj.points[2])<=tol;
  }
  if (obj.type==='text'){
    const p=obj.points[0];
    return pt.x>=p.x-tol && pt.x<=p.x+(obj.w||10)+tol && pt.y>=p.y-tol && pt.y<=p.y+(obj.h||20)+tol;
  }
  if (obj.type==='image'){
    const p=obj.points[0];
    return pt.x>=p.x && pt.x<=p.x+obj.w && pt.y>=p.y && pt.y<=p.y+obj.h;
  }
  return false;
}
function eraseAt(pt){
  const tol = 14/cam.zoom;
  for (let i=B.objects.length-1;i>=0;i--){
    if (B.objects[i].locked) continue; // закреплённое изображение ластик не трогает
    if (hitTestObject(B.objects[i], pt, tol)){
      pushUndo();
      const goneId = B.objects[i].id;
      if (selectedId===goneId) selectedId=null;
      multiSelectIds = multiSelectIds.filter(id=>id!==goneId);
      if (armedHandId===goneId) armedHandId=null;
      if (editLockId===goneId) clearEditLock();
      B.objects.splice(i,1);
      updateContextMenu();
      saveDB(); scheduleRedraw();
      return;
    }
  }
}

/* ── выделение и редактирование ── */
function hitTestHandles(obj, pt){
  const tol = 8/cam.zoom;
  const handles = getHandles(obj);
  for (const h of handles) if (dist(pt,h)<=tol) return h.role;
  return null;
}
function getSelectedObjects(){
  if (multiSelectIds.length) return B.objects.filter(o => multiSelectIds.includes(o.id));
  if (selectedId){ const o = B.objects.find(x=>x.id===selectedId); return o ? [o] : []; }
  return [];
}
function deleteSelected(){
  // закрепление защищает картинку только от ластика — кнопка «Удалить»
  // (и Backspace) удаляют её точно так же, как любой другой объект
  const sel = getSelectedObjects();
  if (!sel.length) return;
  const ids = sel.map(o=>o.id);
  pushUndo();
  B.objects = B.objects.filter(o => !ids.includes(o.id));
  if (armedHandId && ids.includes(armedHandId)) armedHandId=null;
  if (editLockId && ids.includes(editLockId)) clearEditLock();
  selectedId = null; multiSelectIds = [];
  updateContextMenu();
  saveDB(); scheduleRedraw();
}
// доска и заметки справочной панели — два независимых, одновременно видимых
// холста с общей нижней панелью инструментов; «отменить/повторить/удалить»
// применяем к тому из них, где было последнее действие мышью/пером (см.
// lastActiveSurface, обновляется в pointerdown каждого холста)
document.getElementById('deleteBtn').addEventListener('click', () => { if (lastActiveSurface === 'notes') rfDeleteSelected(); else deleteSelected(); });
document.getElementById('undoBtn').addEventListener('click', () => { if (lastActiveSurface === 'notes') rfDoUndo(); else doUndo(); });
document.getElementById('redoBtn').addEventListener('click', () => { if (lastActiveSurface === 'notes') rfDoRedo(); else doRedo(); });

/* ═══════════════════════════════════════════════════════════════════════
   УКАЗАТЕЛЬ (pointer events)
   ═══════════════════════════════════════════════════════════════════════ */
canvas.addEventListener('contextmenu', e => e.preventDefault());

canvas.addEventListener('pointerdown', (e) => {
  if (!boardActive) return;
  lastActiveSurface = 'board';
  canvas.setPointerCapture(e.pointerId);
  const pt = eventWorld(e);

  if (e.button === 2 || e.button === 1 || (e.button===0 && e.altKey)){ e.preventDefault(); dragMode='pan'; panStart={x:e.clientX,y:e.clientY}; camStart={x:cam.x,y:cam.y}; canvas.style.cursor='grabbing'; return; }

  // ── кнопка «Переместить» из расширенного меню: следующий клик где угодно
  // тащит уже выделенный объект/группу, даже если курсор не попадает точно в фигуру
  if (pendingMoveArmed){
    pendingMoveArmed = false;
    const sel = getSelectedObjects();
    if (sel.length === 1){
      pushUndo(); dragMode='move'; dragObjId=sel[0].id; dragStart=pt; dragOrig=clonePts(sel[0]);
      return;
    } else if (sel.length > 1){
      pushUndo(); dragMode='multimove'; dragGroupIds=sel.map(o=>o.id); dragStart=pt;
      dragOrigMap={}; dragGroupIds.forEach(id => { const o=B.objects.find(x=>x.id===id); if (o) dragOrigMap[id]=clonePts(o); });
      return;
    }
  }

  // ── «замок редактирования» сразу после построения фигуры/вставки картинки:
  // пока активен тот же инструмент, которым объект создан, клики по нему
  // двигают/тянут его ручки вместо начала новой фигуры; клик мимо — просто
  // игнорируется (новую фигуру запускает только повторное нажатие кнопки
  // инструмента, см. обработчик .bd-tool)
  if (editLockId){
    const obj = B.objects.find(o=>o.id===editLockId);
    if (!obj){ clearEditLock(); }
    else {
      const role = hitTestHandles(obj, pt);
      if (role){ pushUndo(); dragMode='handle'; dragHandleRole=role; dragObjId=obj.id; return; }
      if (hitTestObject(obj, pt, 8/cam.zoom)){
        pushUndo(); dragMode='move'; dragObjId=obj.id; dragStart=pt; dragOrig=clonePts(obj); return;
      }
      if (editLockTool === tool) return; // клик мимо тем же инструментом — игнорируем
    }
  }

  if (tool === 'hand'){
    // закреплённые изображения — единственное исключение из новой модели:
    // пока не «взведены» двойным кликом, одиночный клик их не двигает
    if (armedHandId){
      const obj = B.objects.find(o=>o.id===armedHandId);
      if (obj && obj.locked){
        const role = hitTestHandles(obj, pt);
        if (role){ pushUndo(); dragMode='handle'; dragHandleRole=role; dragObjId=obj.id; return; }
        if (hitTestObject(obj, pt, 8/cam.zoom)){
          pushUndo(); dragMode='move'; dragObjId=obj.id; dragStart=pt; dragOrig=clonePts(obj); return;
        }
        // клик мимо взведённой картинки — снимаем взвод, обрабатываем клик как обычный ниже
      }
      armedHandId = null;
    }

    // объект в режиме «редактирования» (вошли двойным кликом) — сначала
    // ручки (изменение формы/размера), затем тело (просто подвинуть, не
    // выходя из режима редактирования)
    if (selectedId){
      const obj = B.objects.find(o=>o.id===selectedId);
      if (obj){
        const role = hitTestHandles(obj, pt);
        if (role){ pushUndo(); dragMode='handle'; dragHandleRole=role; dragObjId=obj.id; return; }
        if (hitTestObject(obj, pt, 8/cam.zoom)){
          pushUndo(); dragMode='move'; dragObjId=obj.id; dragStart=pt; dragOrig=clonePts(obj); return;
        }
      }
      // клик мимо объекта редактирования — выходим из режима, обрабатываем клик как обычный ниже
      selectedId = null;
    }

    // любой другой объект под курсором — одиночный клик+протяжка двигает
    // его сразу, без взвода (кроме закреплённых изображений — им взвод нужен)
    for (let i=B.objects.length-1;i>=0;i--){
      const obj = B.objects[i];
      if (hitTestObject(obj, pt, 8/cam.zoom)){
        if (obj.type === 'image' && obj.locked){
          armedHandId = obj.id; selectedId = obj.id;
          scheduleRedraw();
          return;
        }
        pushUndo(); dragMode='move'; dragObjId=obj.id; dragStart=pt; dragOrig=clonePts(obj);
        return;
      }
    }

    // мимо всех объектов — панорамирование, как и раньше
    scheduleRedraw();
    dragMode='pan'; panStart={x:e.clientX,y:e.clientY}; camStart={x:cam.x,y:cam.y}; canvas.style.cursor='grabbing'; return;
  }

  if (tool === 'select'){
    // групповое выделение (рамкой или через «Объединить в группу») — клик по
    // любому из его участников двигает всю группу разом
    if (multiSelectIds.length){
      for (const gid of multiSelectIds){
        const gobj = B.objects.find(o=>o.id===gid);
        if (gobj && hitTestObject(gobj, pt, 8/cam.zoom)){
          pushUndo();
          dragMode='multimove'; dragGroupIds = multiSelectIds.slice(); dragStart = pt;
          dragOrigMap = {};
          dragGroupIds.forEach(id => { const o=B.objects.find(x=>x.id===id); if (o) dragOrigMap[id]=clonePts(o); });
          return;
        }
      }
      multiSelectIds = []; // клик мимо всех участников — снимаем групповое выделение
    }
    if (selectedId){
      const obj = B.objects.find(o=>o.id===selectedId);
      if (obj){
        const role = hitTestHandles(obj, pt);
        if (role){ pushUndo(); dragMode='handle'; dragHandleRole=role; dragObjId=obj.id; return; }
      }
    }
    for (let i=B.objects.length-1;i>=0;i--){
      if (hitTestObject(B.objects[i], pt, 8/cam.zoom)){
        const obj = B.objects[i];
        if (obj.groupId){
          // объект — часть сохранённой группы: выделяем и двигаем всех её участников разом
          const members = B.objects.filter(o=>o.groupId===obj.groupId).map(o=>o.id);
          selectedId = null; multiSelectIds = members;
          pushUndo();
          dragMode='multimove'; dragGroupIds = members; dragStart = pt;
          dragOrigMap = {};
          dragGroupIds.forEach(id => { const o=B.objects.find(x=>x.id===id); if (o) dragOrigMap[id]=clonePts(o); });
          updateContextMenu();
          scheduleRedraw();
          return;
        }
        selectedId = obj.id; multiSelectIds = [];
        pushUndo();
        dragMode='move'; dragObjId=selectedId; dragStart=pt; dragOrig=clonePts(obj);
        updateContextMenu();
        scheduleRedraw();
        return;
      }
    }
    // ничего не задели — начинаем рамку выделения (marquee): все объекты,
    // хоть частично попавшие в неё, будут выделены при отпускании ЛКМ
    selectedId = null; multiSelectIds = [];
    updateContextMenu();
    dragMode = 'marquee'; marqueeStart = pt; marqueeCur = pt;
    scheduleRedraw();
    return;
  }

  if (tool === 'text'){
    if (textEditSession) return; // поле уже открыто — этот клик его закроет через blur, сам по себе новый текст не начинает
    openTextEditor(null, maybeSnap(pt));
    return;
  }

  if (tool === 'pen'){
    pushUndo();
    penStroke = { id: uid(), type:'pen', color:curColorTok, width:curWidth, dash:curDash, points:[pt] };
    if (curOpacity) penStroke.opacity = SEMI_OPACITY;
    return;
  }
  if (tool === 'eraser'){ dragMode='erase'; eraseAt(pt); return; }

  if (tool === 'curve'){ curvePointClick(pt); scheduleRedraw(); return; }
  if (tool === 'circle'){ circleClick(pt); scheduleRedraw(); return; }
  if (tool === 'poly'){ polyClick(pt); scheduleRedraw(); return; }
  if (FIXED_COUNT[tool]){ shapeClick(tool, pt); return; }
});

canvas.addEventListener('pointermove', (e) => {
  if (!boardActive) return;
  const pt = eventWorld(e);

  if (dragMode === 'pan'){
    const dx = (e.clientX-panStart.x)/cam.zoom, dy=(e.clientY-panStart.y)/cam.zoom;
    cam.x = camStart.x - dx; cam.y = camStart.y - dy;
    clampCam();
    scheduleRedraw(); return;
  }
  if (dragMode === 'erase'){ eraseAt(pt); return; }
  if (dragMode === 'marquee'){ marqueeCur = pt; scheduleRedraw(); return; }
  if (dragMode === 'multimove'){
    const dx = pt.x-dragStart.x, dy = pt.y-dragStart.y;
    dragGroupIds.forEach(id => {
      const obj = B.objects.find(o=>o.id===id);
      const orig = dragOrigMap[id];
      if (obj && orig){
        obj.points = orig.points.map(p=>({x:p.x+dx,y:p.y+dy}));
        if (orig.ctrl) obj.ctrl = {x:orig.ctrl.x+dx, y:orig.ctrl.y+dy};
      }
    });
    scheduleRedraw(); return;
  }
  if (dragMode === 'move'){
    const dx = pt.x-dragStart.x, dy = pt.y-dragStart.y;
    const obj = B.objects.find(o=>o.id===dragObjId);
    if (obj){
      obj.points = dragOrig.points.map(p=>({x:p.x+dx,y:p.y+dy}));
      if (dragOrig.ctrl) obj.ctrl = {x:dragOrig.ctrl.x+dx, y:dragOrig.ctrl.y+dy};
      scheduleRedraw();
    }
    return;
  }
  if (dragMode === 'handle'){
    const obj = B.objects.find(o=>o.id===dragObjId);
    if (obj){ applyHandle(obj, dragHandleRole, pt); scheduleRedraw(); }
    return;
  }
  if (penStroke){
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    evs.forEach(ev => {
      const r = canvas.getBoundingClientRect();
      penStroke.points.push(screenToWorld(ev.clientX-r.left, ev.clientY-r.top));
    });
    scheduleRedraw(); return;
  }
  if (draft){ draft.preview = maybeSnap(pt); scheduleRedraw(); return; }
  if (curvePts){ curvePts.preview = maybeSnap(pt); scheduleRedraw(); return; }
  if (circleState && circleState.r==null){ circleState.previewR = dist(circleState.center, pt); scheduleRedraw(); return; }
  if (polyState){ polyState.preview = maybeSnap(pt); scheduleRedraw(); return; }
});

canvas.addEventListener('pointerup', (e) => {
  if (!boardActive) return;
  // «Прямая»: одно движение — зажал (первая точка уже легла в draft через
  // shapeClick при pointerdown), потянул (превью уже рисуется), отпустил —
  // вторая точка берётся прямо отсюда, без второго отдельного клика.
  // Нарочно НЕ enterEditLock() — иначе сразу после отпускания рядом
  // появлялось бы меню выделения, а нужно уметь тут же, без лишних
  // кликов, зажимать и вести следующую прямую
  if (tool === 'line' && draft && draft.type === 'line' && draft.pts.length === 1){
    const endPt = maybeSnap(eventWorld(e));
    const obj = newBase('line');
    obj.points = [draft.pts[0], endPt];
    draft = null;
    commitObject(obj);
    scheduleRedraw();
  }
  if (dragMode === 'move' || dragMode === 'handle' || dragMode === 'multimove'){ saveDB(); }
  if (dragMode === 'pan') updateCursor(); // вернуть «раскрытую руку» или курсор текущего инструмента
  if (dragMode === 'marquee'){
    const x0=Math.min(marqueeStart.x,marqueeCur.x), x1=Math.max(marqueeStart.x,marqueeCur.x);
    const y0=Math.min(marqueeStart.y,marqueeCur.y), y1=Math.max(marqueeStart.y,marqueeCur.y);
    // считаем «зацепленным» любой объект, чей bbox хоть как-то пересекается с
    // рамкой — не обязательно целиком внутри неё
    const hits = B.objects.filter(o => {
      const b = objectBBox(o);
      return b.maxX >= x0 && b.minX <= x1 && b.maxY >= y0 && b.minY <= y1;
    });
    if (hits.length === 1){ selectedId = hits[0].id; multiSelectIds = []; }
    else if (hits.length > 1){ selectedId = null; multiSelectIds = hits.map(o=>o.id); }
    else { selectedId = null; multiSelectIds = []; }
    marqueeStart = null; marqueeCur = null;
    updateContextMenu(); // сразу, не дожидаясь кадра — см. комментарий в cancelDrafts()
    scheduleRedraw();
  }
  dragMode = null; dragHandleRole=null; dragObjId=null; dragGroupIds=null; dragOrigMap=null;
  if (penStroke){
    if (penStroke.points.length >= 2) B.objects.push(penStroke);
    if (penStroke.points.length >= 1) bumpColorUsage(penStroke.color);
    penStroke = null; saveDB(); scheduleRedraw();
  }
});
canvas.addEventListener('pointercancel', () => {
  if (dragMode==='pan') updateCursor();
  if (dragMode==='marquee'){ marqueeStart=null; marqueeCur=null; }
  dragMode=null;
  if (penStroke){ penStroke=null; scheduleRedraw(); }
});

// колесо мыши над выделенным изображением (в том числе только что
// вставленным — оно сразу в фокусе) меняет его размер на месте, без
// необходимости сначала тянуть за угловой маркер; серия быстрых прокруток
// сворачивается в один шаг отмены, а не в десятки — иначе Ctrl+Z пришлось
// бы жать очень много раз, чтобы откатить один жест прокрутки
let wheelResizeUndoDone = false, wheelResizeTimer = null;
canvas.addEventListener('wheel', (e) => {
  if (!boardActive) return;
  e.preventDefault();
  const r = canvas.getBoundingClientRect();
  const sx = e.clientX-r.left, sy=e.clientY-r.top;
  if (e.ctrlKey || e.metaKey){
    const w = screenToWorld(sx,sy);
    setZoom(cam.zoom * Math.exp(-e.deltaY*0.0016), w.x, w.y, sx, sy);
    return;
  }
  if (!multiSelectIds.length && selectedId){
    const obj = B.objects.find(o=>o.id===selectedId);
    if (obj && obj.type === 'image'){
      if (!wheelResizeUndoDone){ pushUndo(); wheelResizeUndoDone = true; }
      clearTimeout(wheelResizeTimer);
      wheelResizeTimer = setTimeout(() => { wheelResizeUndoDone = false; }, 500);
      const factor = Math.exp(-e.deltaY*0.0016);
      const cx = obj.points[0].x + obj.w/2, cy = obj.points[0].y + obj.h/2;
      const newW = Math.max(20, obj.w*factor), newH = Math.max(20, obj.h*factor);
      obj.points[0] = { x: cx-newW/2, y: cy-newH/2 };
      obj.w = newW; obj.h = newH;
      saveDB(); scheduleRedraw();
      return;
    }
  }
  cam.x += e.deltaX/cam.zoom; cam.y += e.deltaY/cam.zoom; clampCam(); scheduleRedraw();
}, { passive:false });

/* ═══════════════════════════════════════════════════════════════════════
   КУРСОР — у каждого инструмента свой, вместо одного крестика на все;
   у пера кончик подсвечен ровно тем цветом, которым сейчас рисуем
   ═══════════════════════════════════════════════════════════════════════ */
function svgCursorUrl(svg, hx, hy, fallback){
  const encoded = encodeURIComponent(svg);
  return `url("data:image/svg+xml,${encoded}") ${hx} ${hy}, ${fallback}`;
}
function penCursorCSS(){
  const ink = resolveColor(curColorTok);
  // изящная тонкая ручка-«паркер» вместо карандаша: тоньше и чуть длиннее,
  // тёмный лаковый корпус с золотым ободком и клипсой; носик подкрашен в
  // текущий цвет чернил, чтобы было видно, каким цветом рисуем. Белый ореол
  // вокруг всей фигуры держит её читаемой на любом фоне листа (свет/тьма).
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34">
    <g transform="rotate(40 17 18)">
      <rect x="15.3" y="5" width="3.4" height="17" rx="1.7" fill="white" stroke="white" stroke-width="4"/>
      <polygon points="15.3,22 18.7,22 17,31" fill="white" stroke="white" stroke-width="4" stroke-linejoin="round"/>
      <polygon points="18.7,6.2 20.3,7 20.3,12.6 18.7,13.2" fill="white" stroke="white" stroke-width="3"/>
      <rect x="15.3" y="5" width="3.4" height="17" rx="1.7" fill="#22222a" stroke="#0c0c10" stroke-width="1"/>
      <rect x="15.9" y="6.4" width="0.7" height="13" rx="0.35" fill="#ffffff" opacity=".22"/>
      <rect x="15.3" y="19" width="3.4" height="1.5" fill="#dcb24a" stroke="#a9821f" stroke-width=".3"/>
      <polygon points="18.7,6.2 20.3,7 20.3,12.6 18.7,13.2" fill="#3c3c44" stroke="#0c0c10" stroke-width="0.8"/>
      <polygon points="15.3,22 18.7,22 17,31" fill="${ink}" stroke="#0c0c10" stroke-width="1" stroke-linejoin="round"/>
      <line x1="17" y1="24.5" x2="17" y2="30" stroke="#0c0c10" stroke-width="0.6"/>
    </g>
  </svg>`;
  return svgCursorUrl(svg, 9, 28, 'crosshair');
}
function eraserCursorCSS(){
  // тот же изящный язык, что и у ручки-«паркер»: аккуратный скруглённый
  // ластик тёмного лакового тона с золотым ободком-полоской, без пёстрых
  // розовых плашек. Белый ореол держит форму читаемой на любом фоне листа.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
    <g transform="rotate(-25 15 15)">
      <rect x="6" y="9.5" width="18" height="12" rx="3.2" fill="white" stroke="white" stroke-width="4"/>
      <rect x="6" y="9.5" width="18" height="12" rx="3.2" fill="#2c2c34" stroke="#0c0c10" stroke-width="1"/>
      <rect x="6" y="9.5" width="18" height="3.6" rx="1.8" fill="#dcb24a" stroke="#a9821f" stroke-width=".3"/>
      <rect x="7" y="14.4" width="16" height="0.9" rx=".45" fill="#ffffff" opacity=".16"/>
    </g>
  </svg>`;
  return svgCursorUrl(svg, 10, 23, 'crosshair');
}
function updateCursor(){
  if (!canvas) return;
  if (tool === 'pen') canvas.style.cursor = penCursorCSS();
  else if (tool === 'eraser') canvas.style.cursor = eraserCursorCSS();
  else if (tool === 'hand') canvas.style.cursor = 'grab';
  else if (tool === 'select') canvas.style.cursor = 'default';
  else if (tool === 'text') canvas.style.cursor = 'text';
  else canvas.style.cursor = 'crosshair';
}

/* ═══════════════════════════════════════════════════════════════════════
   ПАНЕЛЬ ИНСТРУМЕНТОВ
   ═══════════════════════════════════════════════════════════════════════ */
const optbar = document.getElementById('bdOptbar');
const TOOLS_WITH_OPTS = ['pen','line','curve','quad','poly','ellipse','circle','angle','text'];
document.querySelectorAll('.bd-tool[data-tool]').forEach(btn => {
  btn.addEventListener('click', () => {
    // если сейчас рисуется незавершённая кривая (или многоугольник) и
    // снова жмут на ту же кнопку инструмента — это способ ЗАКОНЧИТЬ её
    // на последней точке (как двойной клик или Enter), а не бросить черновик
    if (tool === 'curve' && btn.dataset.tool === 'curve' && curvePts && curvePts.pts.length >= 2){
      finishCurve();
    } else if (tool === 'poly' && btn.dataset.tool === 'poly' && polyState && polyState.pts.length >= 3){
      finishPoly();
    }
    // тот же повторный клик может завершать и незаконченную фигуру в
    // заметках справочной панели — набор инструментов общий на оба холста
    if (tool === 'curve' && btn.dataset.tool === 'curve' && rfCurvePts && rfCurvePts.pts.length >= 2){
      rfFinishCurve();
    } else if (tool === 'poly' && btn.dataset.tool === 'poly' && rfPolyState && rfPolyState.pts.length >= 3){
      rfFinishPoly();
    }
    tool = btn.dataset.tool;
    cancelDrafts(); // уже снимает editLock/черновики доски
    rfCancelDrafts(); // и черновики заметок — оба холста используют один и тот же инструмент
    if (tool !== 'select' && tool !== 'hand'){ selectedId = null; multiSelectIds = []; rfSelectedId = null; rfMultiSelectIds = []; }
    updateContextMenu(); // синхронно, не дожидаясь кадра — иначе меню на миг перехватывает клик по холсту под ним
    document.querySelectorAll('.bd-tool[data-tool]').forEach(b=>b.classList.toggle('active', b===btn));
    optbar.classList.toggle('open', TOOLS_WITH_OPTS.includes(tool));
    layoutOptbar();
    layoutRefPanel();
    document.getElementById('bdRadiusField').style.display = (tool==='circle') ? 'flex' : 'none';
    const arrowDisplay = (tool==='line') ? 'flex' : 'none';
    document.getElementById('toggleArrowEnd').style.display = arrowDisplay;
    document.getElementById('toggleArrowBoth').style.display = arrowDisplay;
    const isTextTool = (tool === 'text');
    document.getElementById('bdFontSizeField').style.display = isTextTool ? 'flex' : 'none';
    document.querySelector('.bd-width').style.display = isTextTool ? 'none' : 'flex';
    document.getElementById('toggleDash').style.display = isTextTool ? 'none' : '';
    document.getElementById('toggleFill').style.display = isTextTool ? 'none' : '';
    if (textEditSession) confirmTextEditor(); // смена инструмента во время редактирования текста — подтверждаем, как и при клике мимо
    updateCursor();
    rfUpdateCursor();
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   ПОЛОЖЕНИЕ И РАЗМЕР ПАНЕЛИ ИНСТРУМЕНТОВ — можно перетащить целиком к
   низу/левому/правому краю экрана за ручку-«гриппер» слева/сверху панели,
   и подстроить размер иконок, потянув за границу панели (как у Dock в
   macOS). Настройка общая для всех досок (это предпочтение по интерфейсу,
   а не данные конкретной доски) — хранится в localStorage, как тема.
   Когда панель уходит влево, левая колонка (экспорт/зум/PDF/фуллскрин)
   переезжает наверх, чтобы не перекрываться с ней.
   ═══════════════════════════════════════════════════════════════════════ */
const dockEl = document.getElementById('bdDock');
const dockGrip = document.getElementById('bdDockGrip');
const dockResizeHandle = document.getElementById('bdDockResize');
const railEl = document.getElementById('bdRail');
let dockPos = 'bottom', dockOffset = 0, dockScale = 1;
try {
  dockPos = localStorage.getItem('boardsDockPos') || 'bottom';
  dockOffset = parseFloat(localStorage.getItem('boardsDockOffset')) || 0;
  dockScale = clamp(parseFloat(localStorage.getItem('boardsDockScale')) || 1, 0.7, 1.6);
} catch(e){}
function saveDockPrefs(){
  try {
    localStorage.setItem('boardsDockPos', dockPos);
    localStorage.setItem('boardsDockOffset', String(dockOffset));
    localStorage.setItem('boardsDockScale', String(dockScale));
  } catch(e){}
}
function layoutOptbar(){
  if (!optbar.classList.contains('open')) return;
  if (dockPos === 'bottom'){
    optbar.classList.remove('side');
    optbar.style.left = `calc(50% + ${dockOffset}px)`; optbar.style.right = '';
    // отступ от дока считаем по его текущей, уже отмасштабированной высоте
    // (getBoundingClientRect), а не фиксированным числом — иначе при более
    // крупном доке панели наезжали друг на друга, а при мелком расходились
    const dockRect = dockEl.getBoundingClientRect();
    optbar.style.top = ''; optbar.style.bottom = (window.innerHeight - dockRect.top + 10) + 'px';
    optbar.style.transform = 'translateX(-50%)';
  } else {
    optbar.classList.add('side');
    const r = dockEl.getBoundingClientRect();
    optbar.style.bottom = ''; optbar.style.transform = 'translateY(-50%)';
    optbar.style.top = clamp(r.top + r.height/2, 90, window.innerHeight - 90) + 'px';
    if (dockPos === 'left'){ optbar.style.left = (r.right + 10) + 'px'; optbar.style.right = ''; }
    else { optbar.style.right = (window.innerWidth - r.left + 10) + 'px'; optbar.style.left = ''; }
  }
}
function applyDockLayout(){
  dockEl.classList.remove('pos-bottom','pos-left','pos-right');
  dockEl.classList.add('pos-' + dockPos);
  dockEl.style.setProperty('--dock-offset', dockOffset + 'px');
  dockEl.style.setProperty('--dock-scale', dockScale);
  // доп. панель (цвета/толщина/скругление) — отдельный от дока элемент,
  // css-переменная дока до неё не достаёт («--dock-scale» не наследуется
  // между соседями), поэтому дублируем её сюда явно
  optbar.style.setProperty('--dock-scale', dockScale);
  railEl.classList.remove('pos-left','pos-top');
  railEl.classList.add(dockPos === 'left' ? 'pos-top' : 'pos-left');
  layoutOptbar();
  layoutRefPanel();
}
window.addEventListener('resize', () => { layoutOptbar(); layoutRefPanel(); });

// ── перетаскивание за ручку: переезд к низу/левому/правому краю, а по
// нижнему краю — свободное скольжение влево-вправо ──
let dockDragActive = false;
dockGrip.addEventListener('pointerdown', (e) => {
  e.preventDefault(); e.stopPropagation();
  dockGrip.setPointerCapture(e.pointerId);
  dockDragActive = true;
});
dockGrip.addEventListener('pointermove', (e) => {
  if (!dockDragActive) return;
  const W = window.innerWidth, EDGE = 110;
  const newPos = e.clientX < EDGE ? 'left' : (e.clientX > W - EDGE ? 'right' : 'bottom');
  if (newPos !== dockPos){ dockPos = newPos; applyDockLayout(); }
  if (dockPos === 'bottom'){
    const half = Math.max(0, W/2 - 140);
    dockOffset = clamp(e.clientX - W/2, -half, half);
    dockEl.style.setProperty('--dock-offset', dockOffset + 'px');
    layoutOptbar();
  }
});
function endDockDrag(){ if (dockDragActive){ dockDragActive = false; saveDockPrefs(); } }
dockGrip.addEventListener('pointerup', endDockDrag);
dockGrip.addEventListener('pointercancel', endDockDrag);

// ── перетаскивание за границу панели: масштаб иконок, как у Dock в macOS ──
let dockResizeStart = null;
dockResizeHandle.addEventListener('pointerdown', (e) => {
  e.preventDefault(); e.stopPropagation();
  dockResizeHandle.setPointerCapture(e.pointerId);
  dockResizeStart = { x:e.clientX, y:e.clientY, scale:dockScale };
});
dockResizeHandle.addEventListener('pointermove', (e) => {
  if (!dockResizeStart) return;
  let delta;
  if (dockPos === 'bottom') delta = dockResizeStart.y - e.clientY; // тянешь вверх от нижней границы — крупнее
  else if (dockPos === 'left') delta = e.clientX - dockResizeStart.x; // тянешь вправо, от левого края — крупнее
  else delta = dockResizeStart.x - e.clientX; // pos-right: тянешь влево, от правого края — крупнее
  dockScale = clamp(dockResizeStart.scale + delta/140, 0.7, 1.6);
  dockEl.style.setProperty('--dock-scale', dockScale);
  optbar.style.setProperty('--dock-scale', dockScale);
  layoutOptbar();
});
function endDockResize(){ if (dockResizeStart){ dockResizeStart = null; saveDockPrefs(); } }
dockResizeHandle.addEventListener('pointerup', endDockResize);
dockResizeHandle.addEventListener('pointercancel', endDockResize);

/* ── справочные материалы (см. #bdRefPanel в boards.html): картинка или
   текст, которые всегда под рукой на ЭТОЙ доске — хранится прямо в B.refPanel,
   поэтому переживает переоткрытие доски, но у каждой доски свой набор ── */
const refToggleBtn = document.getElementById('bdRefToggle');
const refPanelEl = document.getElementById('bdRefPanel');
const refResizeHandle = document.getElementById('bdRefResize');
const refResizeHandleN = document.getElementById('bdRefResizeN');
const refResizeHandleW = document.getElementById('bdRefResizeW');
const refFileInput = document.getElementById('bdRefFileInput');
const refTextarea = document.getElementById('bdRefTextarea');
const refImageMode = document.getElementById('bdRefImageMode');
const refTextWrap = document.getElementById('bdRefTextWrap');
const refDrawHost = document.getElementById('bdRefDrawHost');
const refDrawCanvas = document.getElementById('bdRefDrawCanvas');
const refSubType = document.getElementById('bdRefSubType');
const refSubDraw = document.getElementById('bdRefSubDraw');
// применяем сохранённое положение/размер дока только теперь, когда элементы
// панели справочных материалов уже объявлены выше — applyDockLayout зовёт
// layoutRefPanel(), которому они нужны
applyDockLayout();

function defaultRefPanel(){ return { open:false, mode:'image', textMode:'type', text:'', drawObjects:[], imageObjects:[], w:null, h:null }; }

/* когда док внизу и рядом с ним раскрыта панель цвета/толщины (оптбар в
   горизонтальном виде, а не «узкой колонкой» сбоку), она может занимать
   середину и правую часть низа экрана и наехать на плавающую панель
   справочных материалов в углу — в этом случае временно поднимаем панель
   справочных материалов выше оптбара, чтобы они не перекрывались */
function layoutRefPanel(){
  if (!refPanelEl) return;
  const base = 68;
  if (dockPos === 'bottom' && optbar.classList.contains('open') && !optbar.classList.contains('side')){
    const r = optbar.getBoundingClientRect();
    refPanelEl.style.bottom = Math.max(base, window.innerHeight - r.top + 10) + 'px';
  } else {
    refPanelEl.style.bottom = base + 'px';
  }
}

function applyRefPanel(){
  if (!B) return;
  const rp = B.refPanel;
  refToggleBtn.classList.toggle('active', !!rp.open);
  refPanelEl.classList.toggle('open', !!rp.open);
  if (!rp.open) return;
  layoutRefPanel();
  refPanelEl.dataset.mode = rp.mode;
  // data-textmode нужен и панели целиком (CSS-селектор общего холста
  // #bdRefDrawHost, который теперь стоит вне .bd-ref-text-mode-wrap — см.
  // rfVisible ниже), и самой .bd-ref-text-mode-wrap (переключение
  // textarea/подсказки внутри неё) — дублируем на обоих элементах
  refPanelEl.dataset.textmode = rp.textMode;
  refPanelEl.classList.toggle('bd-ref-empty', rp.mode==='image' && !(rp.imageObjects && rp.imageObjects.length));
  document.getElementById('bdRefTabImage').classList.toggle('active', rp.mode==='image');
  document.getElementById('bdRefTabText').classList.toggle('active', rp.mode==='text');
  if (refTextarea.value !== (rp.text||'')) refTextarea.value = rp.text || '';
  refTextWrap.dataset.textmode = rp.textMode;
  refSubType.classList.toggle('active', rp.textMode==='type');
  refSubDraw.classList.toggle('active', rp.textMode==='draw');
  if (rp.w) refPanelEl.style.setProperty('--ref-w', rp.w + 'px'); else refPanelEl.style.removeProperty('--ref-w');
  if (rp.h) refPanelEl.style.setProperty('--ref-h', rp.h + 'px'); else refPanelEl.style.removeProperty('--ref-h');
}

/* виден ли сейчас общий холст заметок (#bdRefDrawCanvas, см. блок rf* ниже) —
   от этого зависит, нужно ли ему реагировать на размеры/события прямо сейчас.
   Он общий для двух мест: вкладки «Изображение» целиком (там на нём и
   рисуют, и держат сами картинки-объекты) и подвкладки «Текст» → «Рисовать» —
   какой именно набор объектов при этом отображается, решает rfObjects() ниже */
function rfVisible(){
  return !!(B && B.refPanel.open && (B.refPanel.mode === 'image' || (B.refPanel.mode === 'text' && B.refPanel.textMode === 'draw')));
}

refToggleBtn.addEventListener('click', () => {
  if (!B) return;
  B.refPanel.open = !B.refPanel.open;
  applyRefPanel();
  if (rfVisible()){ rfResizeCanvas(); rfScheduleRedraw(); }
  saveDB();
});
document.getElementById('bdRefClose').addEventListener('click', () => {
  if (!B) return;
  B.refPanel.open = false;
  applyRefPanel();
  saveDB();
});
document.querySelectorAll('.bd-ref-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!B) return;
    B.refPanel.mode = btn.dataset.mode;
    // у вкладки «Изображение» и подвкладки «Текст→Рисовать» разные наборы
    // объектов (см. rfObjects() ниже) — выделение/черновик/история отмены
    // от одного набора не должны переживать переключение на другой
    rfResetTransient();
    applyRefPanel();
    if (rfVisible()){ rfResizeCanvas(); rfScheduleRedraw(); }
    saveDB();
  });
});
document.querySelectorAll('.bd-ref-subtab').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!B) return;
    B.refPanel.textMode = btn.dataset.textmode;
    applyRefPanel();
    if (rfVisible()){ rfResizeCanvas(); rfScheduleRedraw(); }
    saveDB();
  });
});
function openRefFilePicker(){ refFileInput.click(); }
document.getElementById('bdRefUploadBtn').addEventListener('click', openRefFilePicker);
document.getElementById('bdRefAddImageBtn').addEventListener('click', openRefFilePicker);
refFileInput.addEventListener('change', async (e) => {
  const file = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!file || !file.type.startsWith('image/') || !B) return;
  const src = await fileToDataUrl(file);
  rfAddImageFromSrc(src);
});
refTextarea.addEventListener('input', () => {
  if (!B) return;
  B.refPanel.text = refTextarea.value;
  saveDB();
});

/* перетаскивание изображений прямо во вкладку «Изображение» — так же, как
   на саму доску: файл — через fileToDataUrl, картинка с веб-страницы —
   через её URL (с попыткой скачать и перекодировать в data:, иначе просто
   ссылка) */
let refDragDepth = 0;
refImageMode.addEventListener('dragenter', (e) => { if (!B) return; e.preventDefault(); refDragDepth++; refImageMode.classList.add('bd-ref-drag-over'); });
refImageMode.addEventListener('dragover', (e) => { if (!B) return; e.preventDefault(); });
refImageMode.addEventListener('dragleave', () => { refDragDepth = Math.max(0, refDragDepth-1); if (!refDragDepth) refImageMode.classList.remove('bd-ref-drag-over'); });
refImageMode.addEventListener('drop', async (e) => {
  if (!B) return;
  e.preventDefault();
  refDragDepth = 0; refImageMode.classList.remove('bd-ref-drag-over');
  const files = e.dataTransfer && e.dataTransfer.files;
  if (files && files.length && files[0].type.startsWith('image/')){
    const src = await fileToDataUrl(files[0]);
    rfAddImageFromSrc(src);
    return;
  }
  let url = e.dataTransfer && (e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain'));
  if (!url){
    const html = e.dataTransfer && e.dataTransfer.getData('text/html');
    const m = html && /<img[^>]+src=["']([^"']+)["']/i.exec(html);
    if (m) url = m[1];
  }
  if (!url) return;
  let src;
  try {
    const resp = await fetch(url, { mode: 'cors' });
    if (!resp.ok) throw new Error('fetch failed');
    src = await fileToDataUrl(await resp.blob());
  } catch(err){
    src = url;
  }
  rfAddImageFromSrc(src);
});

/* ручки изменения размера панели — как у окон приложений на macOS: угол
   (тянет и ширину, и высоту), верхний край (только высоту) и левый край
   (только ширину); правый нижний угол панели всегда остаётся на месте
   (см. .bd-ref-panel в CSS — right/bottom фиксированы) */
function setupRefResize(handleEl, mode){
  let start = null; // {x,y,w,h}
  handleEl.addEventListener('pointerdown', (e) => {
    if (!B) return;
    e.preventDefault(); e.stopPropagation();
    handleEl.setPointerCapture(e.pointerId);
    const r = refPanelEl.getBoundingClientRect();
    start = { x: e.clientX, y: e.clientY, w: r.width, h: r.height };
  });
  handleEl.addEventListener('pointermove', (e) => {
    if (!start || !B) return;
    // тянем к левому верхнему углу: сдвиг влево/вверх (отрицательная дельта) — панель растёт
    const dx = start.x - e.clientX, dy = start.y - e.clientY;
    const maxW = window.innerWidth - 32, maxH = window.innerHeight - 100;
    if (mode !== 'n'){
      const w = clamp(start.w + dx, 220, maxW);
      B.refPanel.w = w;
      refPanelEl.style.setProperty('--ref-w', w + 'px');
    }
    if (mode !== 'w'){
      const h = clamp(start.h + dy, 170, maxH);
      B.refPanel.h = h;
      refPanelEl.style.setProperty('--ref-h', h + 'px');
    }
    // пока открыта вкладка «Рисовать» — её холст должен подстраивать
    // разрешение под новый размер контейнера прямо во время перетаскивания,
    // а не только после того, как ручку отпустят
    if (rfVisible()) rfResizeCanvas();
  });
  function end(){ if (start){ start = null; saveDB(); } }
  handleEl.addEventListener('pointerup', end);
  handleEl.addEventListener('pointercancel', end);
}
setupRefResize(refResizeHandle, 'nw');
setupRefResize(refResizeHandleN, 'n');
setupRefResize(refResizeHandleW, 'w');

/* ═══════════════════════════════════════════════════════════════════════
   ТРЕНАЖЁРЫ ПРЯМО НА ДОСКЕ (#bdTrainersPanel в разметке) — список всех
   действующих тренажёров, открывается в боковой (растягиваемой) панели, не
   покидая доску. Выбранный тренажёр загружается как обычная страница в
   iframe (тот же домен — доска свободно достаёт iframe.contentDocument;
   ни один файл тренажёра при этом не меняется и не дублируется). Кнопка
   «Добавить на доску» поверх iframe снимает текущее задание — рисует его
   реальную DOM-вёрстку в PNG через html2canvas (нужно рендерить именно
   вёрстку, а не текст: формулы KaTeX, дроби столбиком, таблицы, числовые
   прямые) — и кладёт результат на доску отдельным объектом-картинкой, как
   при обычной вставке изображения (см. openImageModal/imgModalInsert выше).
   Пакет из нескольких заданий (кнопки «+1..+10» на ОГЭ №8) — каждое своей
   отдельной картинкой, так же, как каждое задание — отдельная запись в
   «Подборке» (см. addAllTasksToBasket в oge8.html). ── */

// какой(ие) DOM-узел(ы) внутри тренажёра считать «текущим заданием» — карта
// собрана по уже существующим кнопкам «В подборку» в каждом тренажёре (см.
// Basket.extractFromSelectorsRich в их коде), без единого изменения в их
// файлах. gateBtn — id кнопки, которая видна только когда соответствующий
// вариант сейчас актуален (несколько типов заданий на одной странице — ОГЭ
// №9 (мкв/линейные/квадратные), либо необязательная теория — №1–5); без
// gateBtn запись берётся всегда. selAll вместо sel — узлов может быть
// несколько сразу (доп. добавленные задания на ОГЭ №8), берём все на странице.
const TRAINER_CAPTURE = {
  oge1_5:    [ { sel:'#questionPanel' }, { sel:'#theoryContent', gateBtn:'theoryBasketAddBtn', unhide:true } ],
  oge6:      [ { sel:'#questionPanel' } ],
  oge7:      [ { sel:'#questionPanel' } ],
  oge8:      [ { sel:'#questionPanel' }, { selAll:'.added-task-card .added-card-question' } ],
  oge9:      [ { sel:'#questionPanel', gateBtn:'mcqBasketAddBtn' }, { sel:'#live', gateBtn:'linBasketAddBtn' }, { sel:'#eqLine', gateBtn:'quadBasketAddBtn' } ],
  oge10:     [ { sel:'#questionPanel' } ],
  oge11:     [ { sel:'#questionPanel' } ],
  oge12:     [ { sel:'#questionPanel' } ],
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
};

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
  ]},
];

const trainersToggleBtn = document.getElementById('bdTrainersToggle');
const trainersPanelEl = document.getElementById('bdTrainersPanel');
const trainersResizeHandleW = document.getElementById('bdTrainersResizeW');
const trainersBackBtn = document.getElementById('bdTrainersBack');
const trainersCloseBtn = document.getElementById('bdTrainersClose');
const trainersTitleEl = document.getElementById('bdTrainersTitle');
const trainersSearchEl = document.getElementById('bdTrainersSearch');
const trainersGroupsEl = document.getElementById('bdTrainersGroups');
const trainersIframe = document.getElementById('bdTrainersIframe');
const trainersAddBtn = document.getElementById('bdTrainersAddBtn');
const trainersToastEl = document.getElementById('bdTrainersToast');
let trainersOpenId = null;     // id открытого сейчас тренажёра (null — список)
let trainersInsertOffset = 0;  // лёгкий каскад для нескольких добавленных подряд картинок

// ширина панели — предпочтение зрителя (как масштаб/тема), не часть
// содержимого доски, поэтому хранится не в B, а в localStorage
const TRAINERS_PANEL_W_KEY = 'bdTrainersPanel:w';
(function restoreTrainersPanelWidth(){
  try {
    const w = parseFloat(localStorage.getItem(TRAINERS_PANEL_W_KEY));
    if (w) trainersPanelEl.style.setProperty('--tp-w', w + 'px');
  } catch(e){}
})();

function renderTrainersList(filterText){
  const q = (filterText || '').trim().toLowerCase();
  const html = TRAINERS_PANEL_GROUPS.map(g => {
    const items = g.items.filter(it => !q || it.name.toLowerCase().includes(q));
    if (!items.length) return '';
    return `
      <div>
        <div class="bd-trainers-group-title">${g.title}</div>
        ${items.map((it, ii) => `
          <button class="bd-trainers-item" data-id="${it.id}" data-href="${it.href}" data-name="${it.name.replace(/"/g,'&quot;')}">
            <span class="bd-trainers-item-num">${String(ii+1).padStart(2,'0')}</span>
            <span class="bd-trainers-item-name">${it.name}</span>
            <span class="bd-trainers-item-eq">${it.eq}</span>
          </button>`).join('')}
      </div>`;
  }).join('');
  trainersGroupsEl.innerHTML = html || `<div class="bd-trainers-empty">Ничего не нашлось</div>`;
  trainersGroupsEl.querySelectorAll('.bd-trainers-item').forEach(btn => {
    btn.addEventListener('click', () => openTrainerInPanel(btn.dataset.id, btn.dataset.href, btn.dataset.name));
  });
}
renderTrainersList('');
trainersSearchEl.addEventListener('input', () => renderTrainersList(trainersSearchEl.value));

function openTrainerInPanel(id, href, name){
  trainersOpenId = id;
  trainersInsertOffset = 0;
  trainersTitleEl.textContent = name;
  trainersBackBtn.style.display = '';
  trainersPanelEl.classList.add('bd-trainers-in-frame');
  trainersIframe.src = href;
  hideTrainersToast();
}
function closeTrainerFrame(){
  trainersOpenId = null;
  trainersTitleEl.textContent = 'Тренажёры';
  trainersBackBtn.style.display = 'none';
  trainersPanelEl.classList.remove('bd-trainers-in-frame');
  trainersIframe.src = 'about:blank';
}
trainersBackBtn.addEventListener('click', closeTrainerFrame);

trainersToggleBtn.addEventListener('click', () => {
  const opening = !trainersPanelEl.classList.contains('open');
  trainersPanelEl.classList.toggle('open', opening);
  trainersToggleBtn.classList.toggle('active', opening);
});
// крестик сворачивает панель, но не сбрасывает открытый тренажёр — как и
// у справочной панели, повторное открытие возвращает туда же, где остановились
trainersCloseBtn.addEventListener('click', () => {
  trainersPanelEl.classList.remove('open');
  trainersToggleBtn.classList.remove('active');
});

// ручка изменения ширины — тянем правый край панели (левый зафиксирован у
// края экрана), тот же приём, что и у справочной панели (см. setupRefResize)
(function setupTrainersResize(){
  let start = null; // {x, w}
  trainersResizeHandleW.addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation();
    trainersResizeHandleW.setPointerCapture(e.pointerId);
    const r = trainersPanelEl.getBoundingClientRect();
    start = { x: e.clientX, w: r.width };
  });
  trainersResizeHandleW.addEventListener('pointermove', (e) => {
    if (!start) return;
    const dx = e.clientX - start.x; // тянем вправо — панель растёт
    const maxW = window.innerWidth - 80;
    const w = clamp(start.w + dx, 300, maxW);
    trainersPanelEl.style.setProperty('--tp-w', w + 'px');
  });
  function end(){
    if (!start) return;
    start = null;
    try {
      const w = parseFloat(getComputedStyle(trainersPanelEl).width);
      localStorage.setItem(TRAINERS_PANEL_W_KEY, String(w));
    } catch(e){}
  }
  trainersResizeHandleW.addEventListener('pointerup', end);
  trainersResizeHandleW.addEventListener('pointercancel', end);
})();

function showTrainersToast(msg){
  trainersToastEl.textContent = msg;
  trainersToastEl.classList.add('show');
  clearTimeout(showTrainersToast._t);
  showTrainersToast._t = setTimeout(hideTrainersToast, 2200);
}
function hideTrainersToast(){ trainersToastEl.classList.remove('show'); }

// снимок одного DOM-узла тренажёра в PNG (data:) — вёрстка внутри iframe
// рендерится по-настоящему (шрифты, KaTeX, таблицы), а не просто копируется
// как текст, поэтому нужен html2canvas, а не Basket (тот отдаёт HTML/текст
// для живого повторного показа, не растровую картинку)
async function captureTrainerNode(el){
  if (typeof html2canvas !== 'function') throw new Error('html2canvas not loaded');
  const doc = el.ownerDocument;
  const win = doc.defaultView;
  const bg = win ? win.getComputedStyle(doc.body).backgroundColor : '';
  // html2canvas старается разобрать все стили страницы, в том числе внешние
  // (шрифты с Google Fonts и т.п.) — если у ученика/учителя в этот момент
  // плохая сеть, разбор может надолго зависнуть; ограничиваем снимок по
  // времени, чтобы кнопка не осталась «залипшей», а показывалась понятная
  // ошибка и можно было попробовать ещё раз
  const canvasPromise = html2canvas(el, {
    backgroundColor: (bg && bg !== 'rgba(0, 0, 0, 0)') ? bg : '#ffffff',
    scale: Math.min(2, window.devicePixelRatio || 1),
    useCORS: true,
  });
  const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('capture timeout')), 20000));
  const canvas = await Promise.race([canvasPromise, timeoutPromise]);
  return canvas.toDataURL('image/png');
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

// центр видимой области доски с поправкой на открытую панель тренажёров
// (пристыкована к левому краю) — иначе новая картинка ляжет ровно там, где
// сейчас сама панель, и её не будет видно, пока панель не свернут
function trainersAwareCenterWorld(){
  const panelOpen = trainersPanelEl.classList.contains('open');
  const panelW = panelOpen ? trainersPanelEl.getBoundingClientRect().width : 0;
  const screenCenterX = (Math.max(cssW, panelW + 160) + panelW) / 2; // центр свободной (правой) части экрана
  return { x: cam.x + screenCenterX/cam.zoom, y: cam.y + cssH/2/cam.zoom };
}

// вставка одной готовой картинки задания на доску — тот же формат объекта,
// что и у обычной вставленной картинки (см. imgModalInsert выше), только
// предел размера крупнее: это не иллюстрация для справки, а само задание —
// его нужно будет читать и решать прямо на доске
async function insertTaskImage(dataUrl){
  const size = await loadImageSize(dataUrl);
  const maxDim = 520;
  let w = size.w, h = size.h;
  if (w > maxDim || h > maxDim){ const s = maxDim / Math.max(w, h); w *= s; h *= s; }
  const center = trainersAwareCenterWorld();
  const pt = { x: center.x - w/2 + trainersInsertOffset, y: center.y - h/2 + trainersInsertOffset };
  trainersInsertOffset += 28;
  const obj = { id: uid(), type:'image', src: dataUrl, points:[pt], w, h, natW: size.w, natH: size.h };
  pushUndo();
  B.objects.push(obj);
}

trainersAddBtn.addEventListener('click', async () => {
  if (!trainersOpenId || !B) return;
  let doc;
  try { doc = trainersIframe.contentDocument; } catch(e){ doc = null; }
  if (!doc){ showTrainersToast('Не удалось получить доступ к тренажёру'); return; }
  const nodes = collectTrainerCaptureNodes(doc, trainersOpenId);
  if (!nodes.length){ showTrainersToast('Не нашли текущее задание — попробуйте сгенерировать заново'); return; }
  trainersAddBtn.disabled = true;
  let added = 0;
  try {
    for (const { el, restore } of nodes){
      try {
        const dataUrl = await captureTrainerNode(el);
        await insertTaskImage(dataUrl);
        added++;
      } finally {
        if (restore) restore();
      }
    }
  } catch(err){
    console.error('[trainers panel] capture failed', err);
  }
  trainersAddBtn.disabled = false;
  if (added){
    saveDB(); scheduleRedraw();
    showTrainersToast(added === 1 ? 'Добавлено на доску' : `Добавлено на доску: ${added}`);
  } else {
    showTrainersToast('Не получилось добавить задание');
  }
});

/* ═══════════════════════════════════════════════════════════════════════
   ХОЛСТ ЗАМЕТОК СПРАВОЧНОЙ ПАНЕЛИ (#bdRefDrawCanvas, вкладка «Текст» →
   «Рисовать»). Это ОТДЕЛЬНЫЙ, независимый от самой доски <canvas> — тот же
   набор инструментов (общая нижняя панель: те же tool/curColorTok/curWidth/
   curDash/curFill/curSnap, что и у доски), но свой список фигур
   (B.refPanel.drawObjects), своя камера и своя история отмены. Специально
   НЕ переиспользуем холст доски и не «переносим» его сюда — тогда бы сама
   доска пропадала из виду, пока открыты заметки, а нужно, чтобы оба были
   видны и доступны для рисования одновременно.
   Сознательно упрощено по сравнению с самой доской: нет рамки группового
   выделения (marquee), объединения фигур в группы и расширенного
   контекстного меню «Переместить/Скопировать» — для небольшого блокнота
   заметок это не нужно; один объект по-прежнему можно выделить кликом,
   подвинуть и потянуть за угловые ручки как обычно.
   ═══════════════════════════════════════════════════════════════════════ */
const rfCtx = refDrawCanvas.getContext('2d');
const rfCam = { x: 0, y: 0, zoom: 1 };
let rfCssW = 0, rfCssH = 0, rfDpr = 1;
let rfRedrawScheduled = false;

let rfSelectedId = null;
let rfMultiSelectIds = [];
let rfArmedHandId = null;
let rfEditLockId = null, rfEditLockTool = null;
function rfEnterEditLock(obj, viaTool){ rfEditLockId = obj.id; rfEditLockTool = viaTool; rfSelectedId = obj.id; rfMultiSelectIds = []; }
function rfClearEditLock(){ rfEditLockId = null; rfEditLockTool = null; }

let rfDragMode = null; // null | 'move' | 'handle' | 'pan' | 'erase'
let rfDragHandleRole = null, rfDragObjId = null, rfDragStart = null, rfDragOrig = null;
let rfPanStart = null, rfCamStart = null;

let rfDraft = null, rfCurvePts = null, rfCircleState = null, rfPolyState = null, rfPenStroke = null;

const rfUndoStack = [], rfRedoStack = [];
// Какой именно массив объектов сейчас «на холсте», зависит от вкладки:
// у «Изображения» — B.refPanel.imageObjects (картинки + рисование поверх
// них), у «Текст→Рисовать» — B.refPanel.drawObjects (как и раньше). Это
// два независимых блокнота с общим движком, а не общий список — поэтому
// читаем/подменяем ссылку на массив через геттер/сеттер, а не напрямую:
// doUndo/doRedo подменяют саму ссылку целиком (rfSetObjects(JSON.parse(...))),
// закешированная переменная после этого указывала бы на устаревший массив
function rfObjects(){ return B.refPanel.mode === 'image' ? B.refPanel.imageObjects : B.refPanel.drawObjects; }
function rfSetObjects(arr){
  if (B.refPanel.mode === 'image') B.refPanel.imageObjects = arr; else B.refPanel.drawObjects = arr;
}
// сбрасывает всё «сиюминутное» состояние холста заметок (выделение, черновики
// незаконченных фигур, историю отмены) — нужно и при открытии другой доски, и
// при переключении между вкладками «Изображение»/«Текст→Рисовать», потому что
// у них разные наборы объектов (см. rfObjects() выше), и история/выделение от
// одного набора не должны применяться к другому
function rfResetTransient(){
  rfUndoStack.length = 0; rfRedoStack.length = 0; rfSelectedId = null; rfMultiSelectIds = [];
  rfDraft = null; rfCurvePts = null; rfCircleState = null; rfPolyState = null; rfPenStroke = null;
  rfArmedHandId = null; rfClearEditLock(); rfDragMode = null;
}
function rfPushUndo(){
  rfUndoStack.push(JSON.stringify(rfObjects()));
  if (rfUndoStack.length > UNDO_LIMIT) rfUndoStack.shift();
  rfRedoStack.length = 0;
}
function rfDoUndo(){
  if (!rfUndoStack.length) return;
  rfRedoStack.push(JSON.stringify(rfObjects()));
  rfSetObjects(JSON.parse(rfUndoStack.pop()));
  rfSelectedId = null; rfMultiSelectIds = []; rfClearEditLock();
  rfScheduleRedraw(); saveDB();
}
function rfDoRedo(){
  if (!rfRedoStack.length) return;
  rfUndoStack.push(JSON.stringify(rfObjects()));
  rfSetObjects(JSON.parse(rfRedoStack.pop()));
  rfSelectedId = null; rfMultiSelectIds = []; rfClearEditLock();
  rfScheduleRedraw(); saveDB();
}
/* добавляет новую картинку-объект во вкладку «Изображение» — как
   openImageModal() на самой доске, но без модалки: панель заметок задумана
   маленькой и быстрой, поэтому картинка сразу встаёт на холст (чуть по
   диагонали от предыдущей, чтобы несколько подряд не легли ровно друг на
   друга) и сразу же выделена — можно тут же подвинуть/растянуть за угол */
function rfAddImageFromSrc(src){
  if (!B) return;
  B.refPanel.mode = 'image';
  applyRefPanel();
  if (rfVisible()) rfResizeCanvas();
  loadImageSize(src).then(size => {
    if (!B || !B.refPanel.imageObjects) return;
    let w = size.w, h = size.h;
    const maxDim = 220;
    if (w > maxDim || h > maxDim){ const s = maxDim / Math.max(w, h); w *= s; h *= s; }
    const n = B.refPanel.imageObjects.length;
    const pt = rfScreenToWorld(24 + (n % 5) * 22, 24 + (n % 5) * 22);
    const obj = { id: uid(), type: 'image', src, points: [pt], w, h, natW: size.w, natH: size.h };
    rfPushUndo();
    B.refPanel.imageObjects.push(obj);
    rfEnterEditLock(obj, 'image');
    applyRefPanel();
    saveDB(); rfScheduleRedraw();
  });
}

function rfResizeCanvas(){
  rfDpr = Math.max(1, window.devicePixelRatio || 1);
  const r = refDrawHost.getBoundingClientRect();
  rfCssW = Math.max(1, Math.round(r.width)); rfCssH = Math.max(1, Math.round(r.height));
  refDrawCanvas.width = Math.round(rfCssW * rfDpr);
  refDrawCanvas.height = Math.round(rfCssH * rfDpr);
  refDrawCanvas.style.width = rfCssW + 'px';
  refDrawCanvas.style.height = rfCssH + 'px';
  rfScheduleRedraw();
}
function rfScheduleRedraw(){
  if (rfRedrawScheduled) return;
  rfRedrawScheduled = true;
  requestAnimationFrame(() => { rfRedrawScheduled = false; if (rfVisible()) rfRender(); });
}
function rfWorldToScreen(p){ return { x: (p.x - rfCam.x) * rfCam.zoom, y: (p.y - rfCam.y) * rfCam.zoom }; }
function rfScreenToWorld(sx, sy){ return { x: sx / rfCam.zoom + rfCam.x, y: sy / rfCam.zoom + rfCam.y }; }
function rfEventWorld(e){
  const r = refDrawCanvas.getBoundingClientRect();
  return rfScreenToWorld(e.clientX - r.left, e.clientY - r.top);
}

function rfRender(){
  const c = rfCtx, w = rfCssW, h = rfCssH;
  // общие функции рисования (renderObject, drawSelection, ...) переводят
  // мировые координаты в экранные через worldToScreen(), а та берёт камеру
  // из общей переменной activeCam — поэтому на время отрисовки заметок
  // временно указываем её на rfCam (доска делает то же самое в своём render())
  activeCam = rfCam;
  c.save();
  c.setTransform(rfDpr,0,0,rfDpr,0,0);
  c.clearRect(0,0,w,h);
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  c.fillStyle = bg; c.fillRect(0,0,w,h);
  c.restore();

  c.save();
  c.setTransform(rfDpr,0,0,rfDpr,0,0);
  drawSheetsAndGrid(c, rfCam, w, h);
  rfObjects().forEach(o => renderObject(c, o, rfCam));
  rfDrawDraftPreview(c);
  if (rfSelectedId){
    const obj = rfObjects().find(o=>o.id===rfSelectedId);
    if (obj) drawSelection(c, obj, rfCam);
  }
  c.restore();
}
function rfDrawDraftPreview(c){
  c.save();
  c.strokeStyle = resolveColor(curColorTok);
  c.fillStyle = resolveColor(curColorTok);
  c.lineWidth = Math.max(0.5, curWidth) * rfCam.zoom;
  c.lineCap='round'; c.lineJoin='round';
  c.setLineDash(curDash ? [curWidth*3.4*rfCam.zoom, curWidth*2.4*rfCam.zoom] : []);

  if (rfDraft && rfDraft.pts.length){
    const pts = rfDraft.pts.slice();
    if (rfDraft.preview) pts.push(rfDraft.preview);
    const wp = pts.map(p=>rfWorldToScreen(p));
    c.beginPath(); c.moveTo(wp[0].x, wp[0].y);
    for (let i=1;i<wp.length;i++) c.lineTo(wp[i].x, wp[i].y);
    if (rfDraft.type === 'quad' && pts.length >= 3) c.closePath();
    c.stroke();
    if (rfDraft.type === 'angle' && rfDraft.pts.length === 2 && rfDraft.preview){
      drawAngleArcAndLabel(c, wp[1], wp[0], wp[2], rfCam, curWidth);
    }
  }
  if (rfCurvePts && rfCurvePts.pts.length){
    const pts = rfCurvePts.pts.slice();
    if (rfCurvePts.preview) pts.push(rfCurvePts.preview);
    strokeSmoothThroughPoints(c, pts.map(p=>rfWorldToScreen(p)));
    pts.slice(0, rfCurvePts.pts.length).forEach(p => {
      const s = rfWorldToScreen(p);
      c.beginPath(); c.arc(s.x, s.y, 2.5, 0, Math.PI*2); c.fill();
    });
  }
  if (rfCircleState){
    const cxy = rfWorldToScreen(rfCircleState.center);
    const r = (rfCircleState.r != null ? rfCircleState.r : (rfCircleState.previewR||0)) * rfCam.zoom;
    c.beginPath(); c.arc(cxy.x, cxy.y, Math.max(1,r), 0, Math.PI*2); c.stroke();
    c.beginPath(); c.arc(cxy.x, cxy.y, 2, 0, Math.PI*2); c.fill();
  }
  if (rfPolyState && rfPolyState.pts.length){
    const pts = rfPolyState.pts.slice();
    if (rfPolyState.preview) pts.push(rfPolyState.preview);
    const wp = pts.map(p=>rfWorldToScreen(p));
    c.beginPath(); c.moveTo(wp[0].x, wp[0].y);
    for (let i=1;i<wp.length;i++) c.lineTo(wp[i].x, wp[i].y);
    c.stroke();
  }
  if (rfPenStroke){
    strokePolyline(c, rfPenStroke.points.map(p=>rfWorldToScreen(p)), true);
  }
  c.restore();
}

function rfCommitObject(obj){
  rfPushUndo();
  rfObjects().push(obj);
  bumpColorUsage(obj.color);
  saveDB(); rfScheduleRedraw();
}
function rfShapeClick(kind, pt){
  pt = maybeSnap(pt);
  if (!rfDraft || rfDraft.type !== kind) rfDraft = { type: kind, pts: [] };
  rfDraft.pts.push(pt);
  const need = FIXED_COUNT[kind];
  if (rfDraft.pts.length >= need){
    const obj = newBase(kind);
    if (kind === 'ellipse'){
      const [a,b] = rfDraft.pts;
      obj.points = [{x:(a.x+b.x)/2, y:(a.y+b.y)/2}];
      obj.rx = Math.max(4, Math.abs(a.x-b.x)/2);
      obj.ry = Math.max(4, Math.abs(a.y-b.y)/2);
    } else {
      obj.points = rfDraft.pts.slice();
    }
    rfDraft = null;
    rfCommitObject(obj);
    rfEnterEditLock(obj, kind);
  }
  rfScheduleRedraw();
}
function rfCurvePointClick(pt){
  pt = maybeSnap(pt);
  if (!rfCurvePts){ rfCurvePts = { pts: [pt] }; return; }
  rfCurvePts.pts.push(pt);
}
function rfFinishCurve(){
  if (!rfCurvePts || rfCurvePts.pts.length < 2){ rfCurvePts = null; rfScheduleRedraw(); return; }
  const obj = newBase('curve'); obj.points = rfCurvePts.pts.slice();
  rfCurvePts = null;
  rfCommitObject(obj); rfEnterEditLock(obj, 'curve');
}
function rfCircleClick(pt){
  pt = maybeSnap(pt);
  if (!rfCircleState){
    rfCircleState = { center: pt, r: (radiusSetting>0 ? radiusSetting : null), previewR: 0 };
    if (rfCircleState.r != null){
      const obj = newBase('circle'); obj.points=[pt]; obj.r=rfCircleState.r;
      rfCircleState = null; rfCommitObject(obj); rfEnterEditLock(obj, 'circle');
    }
    return;
  }
  const r = dist(rfCircleState.center, pt);
  const obj = newBase('circle'); obj.points=[rfCircleState.center]; obj.r = Math.max(4,r);
  rfCircleState = null;
  rfCommitObject(obj); rfEnterEditLock(obj, 'circle');
  const input = document.getElementById('bdRadiusInput');
  if (input) input.value = Math.round(obj.r);
}
function rfPolyClick(pt){
  pt = maybeSnap(pt);
  if (!rfPolyState){ rfPolyState = { pts: [pt] }; return; }
  if (rfPolyState.pts.length >= 3 && dist(pt, rfPolyState.pts[0]) < 14/rfCam.zoom){ rfFinishPoly(); return; }
  rfPolyState.pts.push(pt);
}
function rfFinishPoly(){
  if (!rfPolyState || rfPolyState.pts.length < 3){ rfPolyState = null; rfScheduleRedraw(); return; }
  const obj = newBase('poly'); obj.points = rfPolyState.pts.slice();
  rfPolyState = null;
  rfCommitObject(obj); rfEnterEditLock(obj, 'poly');
}
function rfCancelDrafts(){
  rfDraft=null; rfCurvePts=null; rfCircleState=null; rfPolyState=null; rfPenStroke=null; rfArmedHandId=null;
  rfClearEditLock();
  rfScheduleRedraw();
}
function rfHitTestHandles(obj, pt){
  const tol = 8/rfCam.zoom;
  const handles = getHandles(obj);
  for (const h of handles) if (dist(pt,h)<=tol) return h.role;
  return null;
}
function rfEraseAt(pt){
  const tol = 14/rfCam.zoom;
  const objs = rfObjects();
  for (let i=objs.length-1;i>=0;i--){
    if (objs[i].locked) continue;
    if (hitTestObject(objs[i], pt, tol)){
      rfPushUndo();
      const goneId = objs[i].id;
      if (rfSelectedId===goneId) rfSelectedId=null;
      rfMultiSelectIds = rfMultiSelectIds.filter(id=>id!==goneId);
      if (rfArmedHandId===goneId) rfArmedHandId=null;
      if (rfEditLockId===goneId) rfClearEditLock();
      objs.splice(i,1);
      saveDB(); rfScheduleRedraw();
      return;
    }
  }
}
function rfGetSelectedObjects(){
  if (rfSelectedId){ const o = rfObjects().find(x=>x.id===rfSelectedId); return o ? [o] : []; }
  return [];
}
function rfDeleteSelected(){
  const sel = rfGetSelectedObjects();
  if (!sel.length) return;
  const ids = sel.map(o=>o.id);
  rfPushUndo();
  rfSetObjects(rfObjects().filter(o => !ids.includes(o.id)));
  if (rfArmedHandId && ids.includes(rfArmedHandId)) rfArmedHandId=null;
  if (rfEditLockId && ids.includes(rfEditLockId)) rfClearEditLock();
  rfSelectedId = null; rfMultiSelectIds = [];
  saveDB(); rfScheduleRedraw();
}
function rfUpdateCursor(){
  if (!refDrawCanvas) return;
  if (tool === 'pen') refDrawCanvas.style.cursor = penCursorCSS();
  else if (tool === 'eraser') refDrawCanvas.style.cursor = eraserCursorCSS();
  else if (tool === 'hand') refDrawCanvas.style.cursor = 'grab';
  else if (tool === 'select') refDrawCanvas.style.cursor = 'default';
  else refDrawCanvas.style.cursor = 'crosshair';
}

refDrawCanvas.addEventListener('contextmenu', e => e.preventDefault());
refDrawCanvas.addEventListener('pointerdown', (e) => {
  if (!B) return;
  lastActiveSurface = 'notes';
  refDrawCanvas.setPointerCapture(e.pointerId);
  const pt = rfEventWorld(e);

  if (e.button === 2 || e.button === 1 || (e.button===0 && e.altKey)){
    e.preventDefault(); rfDragMode='pan'; rfPanStart={x:e.clientX,y:e.clientY}; rfCamStart={x:rfCam.x,y:rfCam.y}; refDrawCanvas.style.cursor='grabbing'; return;
  }

  if (rfEditLockId){
    const obj = rfObjects().find(o=>o.id===rfEditLockId);
    if (!obj){ rfClearEditLock(); }
    else {
      const role = rfHitTestHandles(obj, pt);
      if (role){ rfPushUndo(); rfDragMode='handle'; rfDragHandleRole=role; rfDragObjId=obj.id; return; }
      if (hitTestObject(obj, pt, 8/rfCam.zoom)){
        rfPushUndo(); rfDragMode='move'; rfDragObjId=obj.id; rfDragStart=pt; rfDragOrig=clonePts(obj); return;
      }
      if (rfEditLockTool === tool) return;
    }
  }

  if (tool === 'hand'){
    if (rfArmedHandId){
      const obj = rfObjects().find(o=>o.id===rfArmedHandId);
      if (obj){
        const role = rfHitTestHandles(obj, pt);
        if (role){ rfPushUndo(); rfDragMode='handle'; rfDragHandleRole=role; rfDragObjId=obj.id; return; }
        if (hitTestObject(obj, pt, 8/rfCam.zoom)){
          rfPushUndo(); rfDragMode='move'; rfDragObjId=obj.id; rfDragStart=pt; rfDragOrig=clonePts(obj); return;
        }
      }
    }
    rfDragMode='pan'; rfPanStart={x:e.clientX,y:e.clientY}; rfCamStart={x:rfCam.x,y:rfCam.y}; refDrawCanvas.style.cursor='grabbing'; return;
  }

  if (tool === 'select'){
    if (rfSelectedId){
      const obj = rfObjects().find(o=>o.id===rfSelectedId);
      if (obj){
        const role = rfHitTestHandles(obj, pt);
        if (role){ rfPushUndo(); rfDragMode='handle'; rfDragHandleRole=role; rfDragObjId=obj.id; return; }
      }
    }
    for (let i=rfObjects().length-1;i>=0;i--){
      if (hitTestObject(rfObjects()[i], pt, 8/rfCam.zoom)){
        const obj = rfObjects()[i];
        rfSelectedId = obj.id; rfMultiSelectIds = [];
        rfPushUndo();
        rfDragMode='move'; rfDragObjId=rfSelectedId; rfDragStart=pt; rfDragOrig=clonePts(obj);
        rfScheduleRedraw();
        return;
      }
    }
    rfSelectedId = null; rfMultiSelectIds = [];
    rfScheduleRedraw();
    return;
  }

  if (tool === 'pen'){
    rfPushUndo();
    rfPenStroke = { id: uid(), type:'pen', color:curColorTok, width:curWidth, dash:curDash, points:[pt] };
    if (curOpacity) rfPenStroke.opacity = SEMI_OPACITY;
    return;
  }
  if (tool === 'eraser'){ rfDragMode='erase'; rfEraseAt(pt); return; }

  if (tool === 'curve'){ rfCurvePointClick(pt); rfScheduleRedraw(); return; }
  if (tool === 'circle'){ rfCircleClick(pt); rfScheduleRedraw(); return; }
  if (tool === 'poly'){ rfPolyClick(pt); rfScheduleRedraw(); return; }
  if (FIXED_COUNT[tool]){ rfShapeClick(tool, pt); return; }
});

refDrawCanvas.addEventListener('pointermove', (e) => {
  if (!B) return;
  const pt = rfEventWorld(e);

  if (rfDragMode === 'pan'){
    const dx = (e.clientX-rfPanStart.x)/rfCam.zoom, dy=(e.clientY-rfPanStart.y)/rfCam.zoom;
    rfCam.x = rfCamStart.x - dx; rfCam.y = rfCamStart.y - dy;
    rfScheduleRedraw(); return;
  }
  if (rfDragMode === 'erase'){ rfEraseAt(pt); return; }
  if (rfDragMode === 'move'){
    const dx = pt.x-rfDragStart.x, dy = pt.y-rfDragStart.y;
    const obj = rfObjects().find(o=>o.id===rfDragObjId);
    if (obj){
      obj.points = rfDragOrig.points.map(p=>({x:p.x+dx,y:p.y+dy}));
      if (rfDragOrig.ctrl) obj.ctrl = {x:rfDragOrig.ctrl.x+dx, y:rfDragOrig.ctrl.y+dy};
      rfScheduleRedraw();
    }
    return;
  }
  if (rfDragMode === 'handle'){
    const obj = rfObjects().find(o=>o.id===rfDragObjId);
    if (obj){ applyHandle(obj, rfDragHandleRole, pt); rfScheduleRedraw(); }
    return;
  }
  if (rfPenStroke){
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    evs.forEach(ev => {
      const r = refDrawCanvas.getBoundingClientRect();
      rfPenStroke.points.push(rfScreenToWorld(ev.clientX-r.left, ev.clientY-r.top));
    });
    rfScheduleRedraw(); return;
  }
  if (rfDraft){ rfDraft.preview = maybeSnap(pt); rfScheduleRedraw(); return; }
  if (rfCurvePts){ rfCurvePts.preview = maybeSnap(pt); rfScheduleRedraw(); return; }
  if (rfCircleState && rfCircleState.r==null){ rfCircleState.previewR = dist(rfCircleState.center, pt); rfScheduleRedraw(); return; }
  if (rfPolyState){ rfPolyState.preview = maybeSnap(pt); rfScheduleRedraw(); return; }
});

refDrawCanvas.addEventListener('pointerup', (e) => {
  if (!B) return;
  if (rfDragMode === 'move' || rfDragMode === 'handle'){ saveDB(); }
  if (rfDragMode === 'pan') rfUpdateCursor();
  rfDragMode = null; rfDragHandleRole=null; rfDragObjId=null;
  if (rfPenStroke){
    if (rfPenStroke.points.length >= 2) rfObjects().push(rfPenStroke);
    if (rfPenStroke.points.length >= 1) bumpColorUsage(rfPenStroke.color);
    rfPenStroke = null; saveDB(); rfScheduleRedraw();
  }
});
refDrawCanvas.addEventListener('pointercancel', () => {
  if (rfDragMode==='pan') rfUpdateCursor();
  rfDragMode=null;
  if (rfPenStroke){ rfPenStroke=null; rfScheduleRedraw(); }
});
refDrawCanvas.addEventListener('dblclick', (e) => {
  if (tool === 'poly' && rfPolyState){ if (rfPolyState.pts.length) rfPolyState.pts.pop(); rfFinishPoly(); return; }
  if (tool === 'curve' && rfCurvePts){ if (rfCurvePts.pts.length) rfCurvePts.pts.pop(); rfFinishCurve(); return; }
  if (tool === 'hand'){
    const pt = rfEventWorld(e);
    let hit = null;
    for (let i=rfObjects().length-1;i>=0;i--){ if (hitTestObject(rfObjects()[i], pt, 8/rfCam.zoom)){ hit=rfObjects()[i]; break; } }
    rfArmedHandId = hit ? hit.id : null;
    rfSelectedId = rfArmedHandId;
    rfScheduleRedraw();
  }
});
refDrawCanvas.addEventListener('wheel', (e) => {
  if (!B) return;
  e.preventDefault();
  const r = refDrawCanvas.getBoundingClientRect();
  const sx = e.clientX-r.left, sy=e.clientY-r.top;
  if (e.ctrlKey || e.metaKey){
    const w = rfScreenToWorld(sx,sy);
    const z = clamp(rfCam.zoom * Math.exp(-e.deltaY*0.0016), ZOOM_MIN, ZOOM_MAX);
    rfCam.zoom = z; rfCam.x = w.x - sx/z; rfCam.y = w.y - sy/z;
    rfScheduleRedraw();
    return;
  }
  rfCam.x += e.deltaX/rfCam.zoom; rfCam.y += e.deltaY/rfCam.zoom; rfScheduleRedraw();
}, { passive:false });

function renderSwatches(){
  const wrap = document.getElementById('bdSwatches');
  wrap.innerHTML = B.recentColors.map(tok => {
    const bg = resolveColor(tok);
    return `<button class="bd-swatch${tok===curColorTok?' active':''}" data-tok="${escHtml(tok)}" style="background:${bg}">
      <span class="bd-swatch-x" data-x="${escHtml(tok)}">×</span>
    </button>`;
  }).join('');
  wrap.querySelectorAll('.bd-swatch').forEach(sw => {
    sw.addEventListener('click', (e) => {
      if (e.target.closest('.bd-swatch-x')){
        e.stopPropagation();
        B.recentColors = B.recentColors.filter(t=>t!==sw.dataset.tok);
        if (curColorTok === sw.dataset.tok && B.recentColors.length) curColorTok = B.recentColors[0];
        saveDB(); renderSwatches();
        return;
      }
      curColorTok = sw.dataset.tok;
      renderSwatches();
    });
  });
  // цвет мог смениться — курсор пера должен тут же перекраситься следом
  updateCursor();
}
document.getElementById('bdSwatchAdd').addEventListener('click', () => document.getElementById('bdColorInput').click());
document.getElementById('bdColorInput').addEventListener('input', (e) => {
  const hex = e.target.value;
  curColorTok = hex;
  B.recentColors = [hex].concat(B.recentColors.filter(t=>t!==hex)).slice(0,8);
  saveDB(); renderSwatches();
});

document.getElementById('widthMinus').addEventListener('click', () => { curWidth=clamp(curWidth-1,1,20); document.getElementById('widthVal').textContent=curWidth; });
document.getElementById('widthPlus').addEventListener('click', () => { curWidth=clamp(curWidth+1,1,20); document.getElementById('widthVal').textContent=curWidth; });
document.getElementById('fontSizeMinus').addEventListener('click', () => { curFontSize=clamp(curFontSize-2,8,96); document.getElementById('fontSizeVal').textContent=curFontSize; });
document.getElementById('fontSizePlus').addEventListener('click', () => { curFontSize=clamp(curFontSize+2,8,96); document.getElementById('fontSizeVal').textContent=curFontSize; });
document.getElementById('toggleDash').addEventListener('click', (e) => { curDash=!curDash; e.currentTarget.classList.toggle('on',curDash); });
document.getElementById('toggleFill').addEventListener('click', (e) => { curFill=!curFill; e.currentTarget.classList.toggle('on',curFill); });
document.getElementById('toggleSnap').addEventListener('click', (e) => { curSnap=!curSnap; e.currentTarget.classList.toggle('on',curSnap); });
document.getElementById('toggleSnap').classList.add('on');
document.getElementById('toggleArrowEnd').addEventListener('click', (e) => { curArrowEnd=!curArrowEnd; e.currentTarget.classList.toggle('on',curArrowEnd); });
document.getElementById('toggleArrowBoth').addEventListener('click', (e) => { curArrowBoth=!curArrowBoth; e.currentTarget.classList.toggle('on',curArrowBoth); });
document.getElementById('toggleOpacity').addEventListener('click', (e) => { curOpacity=!curOpacity; e.currentTarget.classList.toggle('on',curOpacity); });
document.getElementById('bdRadiusInput').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  radiusSetting = (v>0) ? v : null;
});

/* ── настройки листа ── */
const settingsPop = document.getElementById('bdSettingsPop');
document.getElementById('bdGear').addEventListener('click', (e) => { e.stopPropagation(); settingsPop.classList.toggle('open'); });
document.addEventListener('click', (e) => { if (!e.target.closest('.bd-settings-pop') && !e.target.closest('#bdGear')) settingsPop.classList.remove('open'); });
function updateSettingsUI(){
  document.getElementById('cellVal').textContent = B.cellSize;
  document.getElementById('bdPageNumbersToggle').checked = !!B.showPageNumbers;
  const landscape = B.sheetCols >= B.sheetRows;
  document.getElementById('fmtLandscape').classList.toggle('active', landscape);
  document.getElementById('fmtPortrait').classList.toggle('active', !landscape);
  renderGridSwatches();
}
/* ── цвет клетки: по умолчанию (null) — общий цвет сетки текущей темы;
   иначе — свой цвет, сохранённый прямо в доске ── */
const GRID_PALETTE = [
  { tok: null,      name: 'По теме (авто)' },
];
function renderGridSwatches(){
  const wrap = document.getElementById('bdGridSwatches');
  if (!wrap || !B) return;
  const cur = B.gridColor || null;
  // свой цвет (не входящий в пресеты, т.е. не "по теме") — есть, если
  // B.gridColor вообще задан: показываем его прямо на кнопке палитры
  const customTok = GRID_PALETTE.some(p => p.tok === cur) ? null : cur;
  wrap.innerHTML = GRID_PALETTE.map(p => {
    const bg = p.tok ? p.tok : 'linear-gradient(135deg, #fdfcf7 50%, #232a44 50%)';
    return `<button class="bd-grid-swatch${cur===p.tok?' active':''}" data-tok="${p.tok?escHtml(p.tok):''}" title="${escHtml(p.name)}" style="background:${bg}"></button>`;
  }).join('') + `<button class="bd-swatch-add${customTok?' active':''}" id="bdGridSwatchAdd" title="Свой цвет — выбрать из палитры"` +
    (customTok ? ` style="background:${resolveColor(customTok)};color:transparent;"` : '') +
    `>${customTok ? '' : '+'}</button>`;
  wrap.querySelectorAll('.bd-grid-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      B.gridColor = sw.dataset.tok || null;
      saveDB(); renderGridSwatches(); scheduleRedraw();
    });
  });
  document.getElementById('bdGridSwatchAdd').addEventListener('click', () => document.getElementById('bdGridColorInput').click());
}
document.getElementById('bdGridColorInput').addEventListener('input', (e) => {
  if (!B) return;
  B.gridColor = e.target.value;
  saveDB(); renderGridSwatches(); scheduleRedraw();
});
document.getElementById('bdPageNumbersToggle').addEventListener('change', (e) => {
  if (!B) return;
  B.showPageNumbers = e.target.checked;
  saveDB(); scheduleRedraw();
});
document.getElementById('cellMinus').addEventListener('click', () => { B.cellSize=clamp(B.cellSize-4,12,64); updateSettingsUI(); saveDB(); scheduleRedraw(); });
document.getElementById('cellPlus').addEventListener('click', () => { B.cellSize=clamp(B.cellSize+4,12,64); updateSettingsUI(); saveDB(); scheduleRedraw(); });
// формат листа храним в клетках — свап местами cols/rows сохраняет точное выравнивание по сетке
document.getElementById('fmtLandscape').addEventListener('click', () => { const s=Math.max(B.sheetCols,B.sheetRows); B.sheetCols=s; B.sheetRows=Math.round(s*54/76); updateSettingsUI(); saveDB(); scheduleRedraw(); });
document.getElementById('fmtPortrait').addEventListener('click', () => { const s=Math.max(B.sheetCols,B.sheetRows); B.sheetRows=s; B.sheetCols=Math.round(s*54/76); updateSettingsUI(); saveDB(); scheduleRedraw(); });
// порядок страниц теперь настраивается прямо в окне «Сохранение конспекта» —
// туда же он и относится по смыслу (влияет только на очерёдность страниц в PDF)
function updatePageOrderUI(){
  const pgH = document.getElementById('pageOrderH'), pgV = document.getElementById('pageOrderV');
  if (pgH && pgV){ pgH.classList.toggle('active', B.pageOrder!=='v'); pgV.classList.toggle('active', B.pageOrder==='v'); }
}
document.getElementById('pageOrderH')?.addEventListener('click', () => { B.pageOrder='h'; updatePageOrderUI(); saveDB(); refreshPdfPagesOrder(); });
document.getElementById('pageOrderV')?.addEventListener('click', () => { B.pageOrder='v'; updatePageOrderUI(); saveDB(); refreshPdfPagesOrder(); });

/* ── левая колонка: зум / масштаб / полноэкранный режим / экспорт ── */
document.getElementById('railZoomIn').addEventListener('click', () => setZoom(cam.zoom*1.25, cam.x+cssW/2/cam.zoom, cam.y+cssH/2/cam.zoom, cssW/2, cssH/2));
document.getElementById('railZoomOut').addEventListener('click', () => setZoom(cam.zoom/1.25, cam.x+cssW/2/cam.zoom, cam.y+cssH/2/cam.zoom, cssW/2, cssH/2));
document.getElementById('railZoomLabel').addEventListener('click', () => setZoom(1, cam.x+cssW/2/cam.zoom, cam.y+cssH/2/cam.zoom, cssW/2, cssH/2));
document.getElementById('railFullscreen').addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
});
document.getElementById('railExport').addEventListener('click', () => {
  // печатаем не всё 200×200-полотно (оно огромное), а тот единственный
  // лист, что сейчас в центре экрана — как «текущая страница» в тетради
  const sw = sheetWpx(), sh = sheetHpx();
  const col = Math.floor(((cam.x+cssW/2/cam.zoom)) / sw);
  const row = Math.floor(((cam.y+cssH/2/cam.zoom)) / sh);
  const scale = 2;
  const off = document.createElement('canvas');
  off.width = Math.round(sw*scale); off.height = Math.round(sh*scale);
  const octx = off.getContext('2d');
  const fakeCam = { x: col*sw, y: row*sh, zoom: scale };
  try {
    render(octx, off.width, off.height, fakeCam, false, 1);
    activeCam = cam; // вернуть боевую камеру для следующей обычной перерисовки
    off.toBlob(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (B.name || 'доска') + '.png';
      a.click();
    });
  } catch(err){
    activeCam = cam;
    alert('Не удалось сохранить PNG: на доске есть изображение с другого сайта, которое браузер запрещает экспортировать. Попробуйте вставить его через «вставить файл» или Ctrl+V вместо перетаскивания.');
  }
});

/* ── экспорт в PDF («конспект») — только те листы, где есть хоть что-то нарисованное ── */
function objectBBox(obj){
  if (obj.type === 'text'){
    const p = obj.points[0];
    return { minX:p.x, minY:p.y, maxX:p.x+(obj.w||10), maxY:p.y+(obj.h||20) };
  }
  if (obj.type === 'image'){
    const p = obj.points[0];
    return { minX:p.x, minY:p.y, maxX:p.x+obj.w, maxY:p.y+obj.h };
  }
  if (obj.type === 'ellipse'){
    const c = obj.points[0];
    return { minX:c.x-obj.rx, minY:c.y-obj.ry, maxX:c.x+obj.rx, maxY:c.y+obj.ry };
  }
  if (obj.type === 'circle'){
    const c = obj.points[0];
    return { minX:c.x-obj.r, minY:c.y-obj.r, maxX:c.x+obj.r, maxY:c.y+obj.r };
  }
  const pts = obj.points.slice();
  if (obj.type === 'curve' && obj.ctrl) pts.push(obj.ctrl);
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  pts.forEach(p => { minX=Math.min(minX,p.x); minY=Math.min(minY,p.y); maxX=Math.max(maxX,p.x); maxY=Math.max(maxY,p.y); });
  return { minX,minY,maxX,maxY };
}
function findContentSheets(){
  if (!B.objects.length) return [];
  const sw = sheetWpx(), sh = sheetHpx();
  const boxes = B.objects.map(objectBBox);
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  boxes.forEach(b => { minX=Math.min(minX,b.minX); minY=Math.min(minY,b.minY); maxX=Math.max(maxX,b.maxX); maxY=Math.max(maxY,b.maxY); });
  const colFrom = Math.floor(minX/sw), colTo = Math.floor(maxX/sw);
  const rowFrom = Math.floor(minY/sh), rowTo = Math.floor(maxY/sh);
  const sheets = [];
  for (let row=rowFrom; row<=rowTo; row++){
    for (let col=colFrom; col<=colTo; col++){
      const rx0=col*sw, ry0=row*sh, rx1=rx0+sw, ry1=ry0+sh;
      const has = boxes.some(b => b.maxX > rx0 && b.minX < rx1 && b.maxY > ry0 && b.minY < ry1);
      if (has) sheets.push({ col, row });
    }
  }
  // порядок страниц: «по ширине» — слева направо, ряд за рядом; «по высоте» — сверху вниз, столбец за столбцом
  if (B.pageOrder === 'v') sheets.sort((a,b) => a.col-b.col || a.row-b.row);
  else sheets.sort((a,b) => a.row-b.row || a.col-b.col);
  return sheets;
}
function sheetKey(s){ return s.col + '_' + s.row; }

let pdfPages = [], pdfIndex = 0, pdfIncluded = {};
function renderSheetThumb(container, s){
  const sw = sheetWpx(), sh = sheetHpx();
  const scale = Math.min(2, 360/sw, 280/sh);
  const off = document.createElement('canvas');
  off.width = Math.max(1, Math.round(sw*scale)); off.height = Math.max(1, Math.round(sh*scale));
  const octx = off.getContext('2d');
  const fakeCam = { x: s.col*sw, y: s.row*sh, zoom: scale };
  octx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim() || '#fff';
  octx.fillRect(0, 0, off.width, off.height);
  try { render(octx, off.width, off.height, fakeCam, false, 1); } catch(e){}
  activeCam = cam;
  container.innerHTML = '';
  container.appendChild(off);
}
function updatePdfModalUI(){
  const wrap = document.querySelector('.bd-modal-pdf-page');
  const emptyMsg = document.getElementById('pdfEmptyMsg');
  const dlBtn = document.getElementById('pdfDownloadBtn');
  if (!pdfPages.length){
    wrap.style.display = 'none'; emptyMsg.style.display = 'block';
    dlBtn.disabled = true; dlBtn.style.opacity = .5;
    return;
  }
  wrap.style.display = 'block'; emptyMsg.style.display = 'none';
  dlBtn.disabled = false; dlBtn.style.opacity = 1;
  pdfIndex = clamp(pdfIndex, 0, pdfPages.length-1);
  const s = pdfPages[pdfIndex];
  document.getElementById('pdfPageInfo').textContent = `Страница ${pdfIndex+1} из ${pdfPages.length}`;
  document.getElementById('pdfPageInclude').checked = pdfIncluded[sheetKey(s)] !== false;
  document.getElementById('pdfPagePrev').disabled = pdfIndex === 0;
  document.getElementById('pdfPageNext').disabled = pdfIndex === pdfPages.length-1;
  renderSheetThumb(document.getElementById('pdfPagePreview'), s);
}
function openPdfModal(){
  pdfPages = findContentSheets();
  pdfIncluded = {};
  pdfPages.forEach(s => { pdfIncluded[sheetKey(s)] = true; });
  pdfIndex = 0;
  updatePageOrderUI();
  updatePdfModalUI();
  document.getElementById('pdfModalBackdrop').classList.add('open');
}
function closePdfModal(){ document.getElementById('pdfModalBackdrop').classList.remove('open'); }
function refreshPdfPagesOrder(){
  // порядок страниц поменяли прямо в открытом окне «Сохранение конспекта» —
  // пересобираем список, но стараемся остаться на том же листе, что и был
  if (!document.getElementById('pdfModalBackdrop').classList.contains('open')) return;
  const curKey = pdfPages[pdfIndex] ? sheetKey(pdfPages[pdfIndex]) : null;
  const prevIncluded = pdfIncluded;
  pdfPages = findContentSheets();
  pdfIncluded = {};
  pdfPages.forEach(s => { const k = sheetKey(s); pdfIncluded[k] = (k in prevIncluded) ? prevIncluded[k] : true; });
  const newIdx = curKey ? pdfPages.findIndex(s => sheetKey(s) === curKey) : -1;
  pdfIndex = newIdx >= 0 ? newIdx : 0;
  updatePdfModalUI();
}
document.getElementById('railPdf').addEventListener('click', openPdfModal);
document.getElementById('pdfModalClose').addEventListener('click', closePdfModal);
document.getElementById('pdfCloseBtn').addEventListener('click', closePdfModal);
document.getElementById('pdfModalBackdrop').addEventListener('click', (e) => { if (e.target.id==='pdfModalBackdrop') closePdfModal(); });
document.getElementById('pdfPagePrev').addEventListener('click', () => { if (pdfIndex>0){ pdfIndex--; updatePdfModalUI(); } });
document.getElementById('pdfPageNext').addEventListener('click', () => { if (pdfIndex<pdfPages.length-1){ pdfIndex++; updatePdfModalUI(); } });
document.getElementById('pdfPageInclude').addEventListener('change', (e) => {
  if (!pdfPages.length) return;
  pdfIncluded[sheetKey(pdfPages[pdfIndex])] = e.target.checked;
});
document.getElementById('pdfDownloadBtn').addEventListener('click', async () => {
  const toExport = pdfPages.filter(s => pdfIncluded[sheetKey(s)] !== false);
  if (!toExport.length) return;
  const btn = document.getElementById('pdfDownloadBtn');
  const origText = btn.textContent;
  btn.textContent = 'Сохраняем…'; btn.disabled = true;
  try {
    const sw = sheetWpx(), sh = sheetHpx();
    const scale = 2;
    const { jsPDF } = window.jspdf;
    let pdf = null;
    for (const s of toExport){
      const off = document.createElement('canvas');
      off.width = Math.round(sw*scale); off.height = Math.round(sh*scale);
      const octx = off.getContext('2d');
      const fakeCam = { x: s.col*sw, y: s.row*sh, zoom: scale };
      // фон листа — сплошная бумага + тонкая сетка, поэтому JPEG сжимает его
      // в разы компактнее PNG почти без потери видимой чёткости, а конспект
      // из полусотни листов не должен весить сотни мегабайт; заливаем «бумагой»
      // заранее — иначе редкий выступ рисунка за пределы 0..totalW/H даст
      // на JPEG чёрные пиксели вместо прозрачных
      octx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim() || '#fff';
      octx.fillRect(0, 0, off.width, off.height);
      render(octx, off.width, off.height, fakeCam, false, 1);
      activeCam = cam;
      const imgData = off.toDataURL('image/jpeg', 0.88);
      const orient = sw >= sh ? 'landscape' : 'portrait';
      if (!pdf) pdf = new jsPDF({ orientation: orient, unit: 'pt', format: [sw, sh] });
      else pdf.addPage([sw, sh], orient);
      pdf.addImage(imgData, 'JPEG', 0, 0, sw, sh);
    }
    pdf.save((B.name || 'доска') + '.pdf');
    closePdfModal();
  } catch(err){
    activeCam = cam;
    alert('Не удалось сохранить PDF: на доске есть изображение с другого сайта, которое браузер запрещает экспортировать. Попробуйте вставить его через «вставить файл» или Ctrl+V вместо перетаскивания.');
  } finally {
    btn.textContent = origText; btn.disabled = false;
  }
});

/* ═══════════════════════════════════════════════════════════════════════
   ИЗОБРАЖЕНИЯ — вставка файлом, буфером обмена (Ctrl+V) или перетаскиванием;
   можно закрепить (не трогать ластиком/перетаскиванием), привязать к сетке
   и сохранить в локальную «библиотеку» этой доски для повторной вставки
   ═══════════════════════════════════════════════════════════════════════ */
function updateUnlockBtn(){
  const btn = document.getElementById('unlockBtn');
  if (!btn || !B) return;
  const obj = selectedId ? B.objects.find(o=>o.id===selectedId) : null;
  const isImg = obj && obj.type==='image';
  btn.style.display = isImg ? 'flex' : 'none';
  if (isImg){
    // тёмный фон — изображение закреплено; без фона — свободно (тот же приём,
    // что и подсветка активного инструмента в доке)
    btn.classList.toggle('active', !!obj.locked);
    btn.title = obj.locked ? 'Открепить изображение' : 'Закрепить изображение';
  }
}
document.getElementById('unlockBtn').addEventListener('click', () => {
  const obj = selectedId ? B.objects.find(o=>o.id===selectedId) : null;
  if (obj){ pushUndo(); obj.locked = !obj.locked; saveDB(); scheduleRedraw(); updateUnlockBtn(); }
});

let pendingImage = null; // {src, natW, natH, worldPt}
function fileToDataUrl(fileOrBlob){
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(fileOrBlob);
  });
}
function loadImageSize(src){
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve({ w: im.naturalWidth || 300, h: im.naturalHeight || 200 });
    im.onerror = () => resolve({ w: 300, h: 200 });
    im.src = src;
  });
}
function viewportCenterWorld(){ return { x: cam.x + cssW/2/cam.zoom, y: cam.y + cssH/2/cam.zoom }; }

async function openImageModal(src, worldPt){
  const size = await loadImageSize(src);
  pendingImage = { src, natW: size.w, natH: size.h, worldPt: worldPt || viewportCenterWorld() };
  document.getElementById('imgModalPreview').innerHTML = `<img src="${src}" alt="">`;
  // по умолчанию не закрепляем: сразу после вставки картинку можно спокойно
  // подвинуть и растянуть по размеру — закрепить можно потом, кнопкой на панели
  document.getElementById('imgOptLock').checked = false;
  document.getElementById('imgOptSnap').checked = false;
  document.getElementById('imgOptLib').checked = false;
  renderImageLibrary();
  document.getElementById('imgModalBackdrop').classList.add('open');
}
function closeImageModal(){
  document.getElementById('imgModalBackdrop').classList.remove('open');
  pendingImage = null;
}
function renderImageLibrary(){
  const wrap = document.getElementById('imgModalLibRow');
  const box = document.getElementById('imgModalLib');
  const lib = (B && B.imageLib) || [];
  if (!lib.length){ box.style.display='none'; wrap.innerHTML=''; return; }
  box.style.display = 'block';
  wrap.innerHTML = lib.slice().reverse().map(it => `<img src="${it.src}" data-id="${it.id}" title="Вставить снова">`).join('');
  wrap.querySelectorAll('img').forEach(img => {
    img.addEventListener('click', async () => {
      const it = lib.find(x=>x.id===img.dataset.id);
      if (!it || !pendingImage) return;
      const size = await loadImageSize(it.src);
      pendingImage.src = it.src; pendingImage.natW = size.w; pendingImage.natH = size.h;
      document.getElementById('imgModalPreview').innerHTML = `<img src="${it.src}" alt="">`;
    });
  });
}

document.getElementById('imgModalClose').addEventListener('click', closeImageModal);
document.getElementById('imgModalBackdrop').addEventListener('click', (e) => { if (e.target.id==='imgModalBackdrop') closeImageModal(); });
document.getElementById('imgModalInsert').addEventListener('click', () => {
  if (!pendingImage || !B) return;
  // масштаб при вставке: пропорции сохраняем как у реального файла, но
  // крупные картинки сразу ужимаем, чтобы не занимали весь экран — точную
  // подгонку размера удобно докрутить сразу же колесом мыши, пока картинка
  // ещё в фокусе (см. обработчик 'wheel' ниже), без лишних кликов
  const maxDim = 320;
  let w = pendingImage.natW, h = pendingImage.natH;
  if (w > maxDim || h > maxDim){ const s = maxDim / Math.max(w,h); w *= s; h *= s; }
  let pt = { x: pendingImage.worldPt.x - w/2, y: pendingImage.worldPt.y - h/2 };
  if (document.getElementById('imgOptSnap').checked){
    pt = maybeSnap(pt);
    // подгоняем и размер под клетки, чтобы правый/нижний край тоже лёг ровно на сетку — без люфта
    const cs = B.cellSize;
    w = Math.max(cs, Math.round(w / cs) * cs);
    h = Math.max(cs, Math.round(h / cs) * cs);
  }
  const obj = {
    id: uid(), type: 'image', src: pendingImage.src,
    points: [pt], w, h, natW: pendingImage.natW, natH: pendingImage.natH,
    locked: document.getElementById('imgOptLock').checked,
  };
  pushUndo();
  B.objects.push(obj);
  if (document.getElementById('imgOptLib').checked){
    B.imageLib = B.imageLib || [];
    B.imageLib.push({ id: uid(), src: pendingImage.src, createdAt: nowTs() });
  }
  enterEditLock(obj, 'image');
  saveDB(); scheduleRedraw();
  closeImageModal();
});

/* ═══════════════ «Добавить из Подборки» — вставка задания прямо с
   тренажёра на доску. Подборка (Basket, см. basket-core.js) — общее,
   межстраничное хранилище (localStorage 'ogeBasket:v1'), которое уже
   подключено на всех ~20 страницах тренажёров кнопкой «В подборку» —
   поэтому ни один из них трогать не нужно, доска просто читает тот же
   список. HTML-снимок задания (дроби, таблицы, числовая прямая — уже
   безопасная разметка своими классами, не живой DOM тренажёра) сначала
   превращается в обычную PNG-картинку через SVG-foreignObject, а дальше
   идёт через тот же openImageModal, что и вставка любой другой картинки —
   с тем же выбором позиции, масштаба и закрепления ═══════════════ */
const TRAINER_NAMES = {
  oge1_5:'№1–5. Практические задачи', oge6:'№6. Числа и вычисления', oge7:'№7. Сравнение и оценка чисел',
  oge8:'№8. Выражения и формулы', oge9:'№9. Уравнения и неравенства', oge10:'№10. Теория вероятности',
  oge11:'№11. Графики функций', oge12:'№12. Вычисления по формулам', oge13:'№13. Неравенства',
  oge14:'№14. Прогрессии', oge15_18:'№15–18. Геометрия', oge19:'№19. Верные утверждения',
  add_col:'Сложение в столбик', sub_col:'Вычитание в столбик', mul_col:'Умножение в столбик', div_col:'Деление в столбик',
  linear:'Линейные уравнения', quadratic:'Квадратные уравнения',
  frac_mul:'Умножение дробей', frac_div:'Деление дробей', neg_pos:'Положительные и отрицательные числа',
};
function escapeHtmlBd(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function renderBasketPicker(){
  const list = document.getElementById('basketModalList');
  if (typeof Basket === 'undefined'){
    list.innerHTML = '<div class="bd-basket-empty">Подборка сейчас недоступна.</div>';
    return;
  }
  const items = Basket.all().slice().reverse(); // сначала недавно добавленные
  if (!items.length){
    list.innerHTML = '<div class="bd-basket-empty">Пока пусто. Откройте любой тренажёр и нажмите «В подборку» под заданием — оно появится здесь.</div>';
    return;
  }
  list.innerHTML = items.map(it => {
    const base = TRAINER_NAMES[it.trainerId] || it.trainerId || '';
    const src = (it.modeTitle && it.modeTitle !== base) ? (base + ' · ' + it.modeTitle) : base;
    return `
      <div class="basket-item">
        <div class="basket-item-head">
          <span class="basket-item-src">${escapeHtmlBd(src)}</span>
          <button class="basket-item-add" data-id="${it.id}">Добавить на доску</button>
        </div>
        <div class="basket-item-text">${it.html ? it.html : escapeHtmlBd(it.text)}</div>
      </div>
    `;
  }).join('');
  if (typeof resolveBasketTex === 'function') resolveBasketTex(list);
  list.querySelectorAll('.basket-item-add').forEach(btn => {
    btn.addEventListener('click', async () => {
      const it = items.find(x => x.id === btn.dataset.id);
      if (!it) return;
      btn.disabled = true; btn.textContent = 'Готовим…';
      try {
        const dataUrl = await rasterizeBasketItem(it);
        closeBasketModal();
        openImageModal(dataUrl);
      } catch(err){
        btn.disabled = false; btn.textContent = 'Добавить на доску';
        alert('Не удалось подготовить картинку задания. Попробуйте ещё раз.');
      }
    });
  });
}

/* HTML-снимок задания → PNG data:URL. foreignObject рендерится как
   отдельный, независимый от страницы документ — поэтому нужные классы
   заданий и реальные цвета текущей темы встраиваются прямо в svg своим
   <style>, а не берутся из подключённых на странице стилей */
function rasterizeBasketItem(item){
  return new Promise((resolve, reject) => {
    const rawHtml = item.html ? item.html : escapeHtmlBd(item.text || '');
    // формулы KaTeX ещё не отрисованы (basket-core.js откладывает их до показа) —
    // дорисовываем их в настоящую разметку до замера высоты и до сборки SVG,
    // иначе на картинке доски вместо формулы окажется пустое место
    const html = (typeof resolveBasketTexInHtml === 'function') ? resolveBasketTexInHtml(rawHtml) : rawHtml;
    const W = 480;
    // высоту сначала меряем в настоящем DOM страницы (там уже действуют
    // все её стили) — сам foreignObject без явной высоты не разложится
    const measure = document.createElement('div');
    measure.className = 'basket-item-text';
    measure.style.cssText = `position:fixed;left:-99999px;top:0;width:${W}px;padding:16px;box-sizing:border-box;`;
    measure.innerHTML = html;
    document.body.appendChild(measure);
    const H = Math.max(40, Math.ceil(measure.getBoundingClientRect().height));
    document.body.removeChild(measure);

    const cs = getComputedStyle(document.documentElement);
    const pencil = cs.getPropertyValue('--pencil').trim() || '#1D1D1F';
    const paper = cs.getPropertyValue('--paper').trim() || '#FDFCF7';

    const katexCssText = (document.getElementById('katexCssBlock') || {}).textContent || '';
    const embeddedCss = katexCssText + `
      .katex{visibility:visible;}
      .basket-item-text{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',Arial,sans-serif;font-size:15px;line-height:1.5;white-space:pre-line;color:${pencil};}
      .basket-frac{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;vertical-align:middle;margin:0 4px;line-height:1.2;position:relative;top:.12em;white-space:nowrap;}
      .bf-n,.bf-d{padding:0 2px;}
      .bf-bar{display:block;width:100%;border-top:1.5px solid currentColor;margin:2px 0;}
      .basket-frac .basket-frac{font-size:.82em;margin:0 3px;}
      .basket-opt-list{margin-top:8px;display:flex;flex-direction:column;gap:5px;}
      .basket-opt-list-inline{flex-direction:row;flex-wrap:wrap;gap:8px 26px;justify-content:center;}
      .basket-opt{padding:1px 0;}
      .basket-block{margin:4px 0;}
      .basket-block:first-child{margin-top:0;}
      .basket-block:last-child{margin-bottom:0;}
      .basket-img{display:inline-block;width:160px;max-width:42%;height:auto;margin:6px 10px 6px 0;vertical-align:top;border-radius:4px;}
      .basket-fig-row{margin-bottom:8px;}
      .basket-table{border-collapse:collapse;margin:10px 0;font-size:14px;}
      .basket-table td,.basket-table th{border:1px solid currentColor;padding:6px 10px;text-align:center;}
      .basket-table th{font-weight:700;}
      .basket-numline-row{margin:14px 0;text-align:center;}
      .basket-numline{position:relative;display:inline-block;vertical-align:middle;width:220px;max-width:80%;height:44px;margin:8px 6px;}
      .bnl-line{position:absolute;left:2px;right:2px;top:22px;height:2px;background:currentColor;}
      .bnl-tick{position:absolute;top:14px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;}
      .bnl-tickmark{width:2px;height:16px;background:currentColor;}
      .bnl-ticklabel{font-size:13px;margin-top:2px;white-space:nowrap;}
      .bnl-point{position:absolute;top:23px;transform:translate(-50%,-50%);}
      .bnl-dot{display:block;width:9px;height:9px;border-radius:50%;background:currentColor;}
      .bnl-plabel{position:absolute;left:50%;bottom:100%;transform:translateX(-50%);margin-bottom:5px;font-size:13px;font-weight:700;white-space:nowrap;}
    `;
    const totalH = H + 32;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${totalH}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${W}px;height:${totalH}px;box-sizing:border-box;padding:16px;background:${paper};">
          <style>${embeddedCss}</style>
          <div class="basket-item-text">${html}</div>
        </div>
      </foreignObject>
    </svg>`;
    const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    const im = new Image();
    im.onload = () => {
      const scale = 2; // чуть выше плотность пикселей, чтобы текст не размывался при увеличении на доске
      const canvas = document.createElement('canvas');
      canvas.width = W * scale; canvas.height = totalH * scale;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      ctx.fillStyle = paper; ctx.fillRect(0, 0, W, totalH);
      ctx.drawImage(im, 0, 0, W, totalH);
      try { resolve(canvas.toDataURL('image/png')); }
      catch(err){ reject(err); }
    };
    im.onerror = reject;
    im.src = svgUrl;
  });
}

function openBasketModal(){
  renderBasketPicker();
  document.getElementById('basketModalBackdrop').classList.add('open');
}
function closeBasketModal(){
  document.getElementById('basketModalBackdrop').classList.remove('open');
}
document.getElementById('bdBasketBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  openBasketModal();
});
document.getElementById('basketModalClose').addEventListener('click', closeBasketModal);
document.getElementById('basketModalBackdrop').addEventListener('click', (e) => { if (e.target.id === 'basketModalBackdrop') closeBasketModal(); });

/* кнопка вставки изображения открывает выбор источника: буфер обмена
   (через navigator.clipboard.read()) или обычный выбор файла */
async function pasteImageFromClipboardButton(){
  if (!navigator.clipboard || !navigator.clipboard.read){
    alert('Этот браузер не умеет читать буфер обмена по кнопке — воспользуйтесь Ctrl+V прямо на доске.');
    return;
  }
  try {
    const items = await navigator.clipboard.read();
    for (const item of items){
      const type = item.types.find(t => t.startsWith('image/'));
      if (type){
        const blob = await item.getType(type);
        openImageModal(await fileToDataUrl(blob));
        return;
      }
    }
    alert('В буфере обмена сейчас нет изображения.');
  } catch(err){
    alert('Не удалось прочитать буфер обмена — возможно, браузер не дал разрешения. Попробуйте Ctrl+V.');
  }
}
document.getElementById('imageBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  clearEditLock(); selectedId = null; multiSelectIds = [];
  updateContextMenu();
  const pop = document.getElementById('bdImgSrcPop');
  const r = e.currentTarget.getBoundingClientRect();
  pop.style.left = Math.max(6, Math.min(r.left, window.innerWidth - 230)) + 'px';
  pop.style.bottom = (window.innerHeight - r.top + 8) + 'px';
  pop.style.top = 'auto';
  pop.classList.toggle('open');
});
document.getElementById('bdImgSrcPop').addEventListener('click', async (e) => {
  const src = e.target.dataset.src;
  if (!src) return;
  document.getElementById('bdImgSrcPop').classList.remove('open');
  if (src === 'file') document.getElementById('imageFileInput').click();
  else if (src === 'clipboard') await pasteImageFromClipboardButton();
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('#bdImgSrcPop') && !e.target.closest('#imageBtn')) document.getElementById('bdImgSrcPop').classList.remove('open');
});
document.getElementById('imageFileInput').addEventListener('change', async (e) => {
  const file = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!file || !file.type.startsWith('image/')) return;
  openImageModal(await fileToDataUrl(file));
});

// вставка из буфера обмена — Ctrl+V где угодно, пока открыта доска
document.addEventListener('paste', async (e) => {
  if (!boardActive) return;
  const tag = (document.activeElement && document.activeElement.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  const items = e.clipboardData && e.clipboardData.items;
  if (!items) return;
  for (const item of items){
    if (item.type && item.type.startsWith('image/')){
      const file = item.getAsFile();
      if (!file) continue;
      openImageModal(await fileToDataUrl(file));
      return;
    }
  }
});

// перетаскивание — локальный файл с компьютера или картинка, схваченная
// прямо с веб-страницы в соседней вкладке
const dropOverlay = document.getElementById('bdDropOverlay');
let dragDepth = 0;
canvas.addEventListener('dragenter', (e) => { if (!boardActive) return; e.preventDefault(); dragDepth++; dropOverlay.classList.add('show'); });
canvas.addEventListener('dragover', (e) => { if (!boardActive) return; e.preventDefault(); });
canvas.addEventListener('dragleave', () => { dragDepth = Math.max(0, dragDepth-1); if (!dragDepth) dropOverlay.classList.remove('show'); });
canvas.addEventListener('drop', async (e) => {
  if (!boardActive) return;
  e.preventDefault();
  dragDepth = 0; dropOverlay.classList.remove('show');
  const pt = eventWorld(e);
  const files = e.dataTransfer && e.dataTransfer.files;
  if (files && files.length && files[0].type.startsWith('image/')){
    openImageModal(await fileToDataUrl(files[0]), pt);
    return;
  }
  // картинку перетащили не файлом, а прямо со страницы — сперва пробуем
  // скачать её байты (тогда экспорт доски в PNG потом не сломается из-за
  // чужого источника), а если сайт это запрещает — вставляем как есть по ссылке
  let url = e.dataTransfer && (e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain'));
  if (!url){
    const html = e.dataTransfer && e.dataTransfer.getData('text/html');
    const m = html && /<img[^>]+src=["']([^"']+)["']/i.exec(html);
    if (m) url = m[1];
  }
  if (!url) return;
  try {
    const resp = await fetch(url, { mode: 'cors' });
    if (!resp.ok) throw new Error('fetch failed');
    openImageModal(await fileToDataUrl(await resp.blob()), pt);
  } catch(err){
    openImageModal(url, pt);
  }
});

/* ═══════════════════════════════════════════════════════════════════════
   ГОРЯЧИЕ КЛАВИШИ
   ═══════════════════════════════════════════════════════════════════════ */
// цифры вместо букв: физическая клавиша с цифрой даёт один и тот же символ
// независимо от того, какая раскладка сейчас включена (RU/EN) — в отличие
// от буквенных мнемоник (P, E, L…), которые на кириллической раскладке
// превращались в другой символ. Порядок — как в панели инструментов слева
// направо. Цифровых клавиш всего 10 (1–9 и 0), а инструментов — 11
// («угол» и «вставка изображения» остаются только по клику мышью)
const KEY_TOOL = { '1':'hand', '2':'select', '3':'pen', '4':'eraser', '5':'line', '6':'curve', '7':'quad', '8':'poly', '9':'ellipse', '0':'circle' };
document.addEventListener('keydown', (e) => {
  if (!boardActive) return;
  if (e.key === 'Escape' && document.getElementById('imgModalBackdrop').classList.contains('open')){ closeImageModal(); return; }
  if (e.key === 'Escape' && document.getElementById('pdfModalBackdrop').classList.contains('open')){ closePdfModal(); return; }
  const tag = (document.activeElement && document.activeElement.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='z'){
    e.preventDefault();
    if (lastActiveSurface === 'notes'){ if (e.shiftKey) rfDoRedo(); else rfDoUndo(); }
    else { if (e.shiftKey) doRedo(); else doUndo(); }
    return;
  }
  if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='y'){ e.preventDefault(); if (lastActiveSurface === 'notes') rfDoRedo(); else doRedo(); return; }
  if (e.key === 'Escape'){
    cancelDrafts(); selectedId=null; multiSelectIds=[]; updateContextMenu(); scheduleRedraw();
    rfCancelDrafts(); rfSelectedId=null; rfMultiSelectIds=[]; rfScheduleRedraw();
    return;
  }
  if (e.key === 'Enter' && tool==='poly'){ if (polyState) finishPoly(); if (rfPolyState) rfFinishPoly(); return; }
  if (e.key === 'Enter' && tool==='curve'){ if (curvePts) finishCurve(); if (rfCurvePts) rfFinishCurve(); return; }
  if ((e.key==='Backspace' || e.key==='Delete')){
    if (lastActiveSurface === 'notes' && rfSelectedId){ rfDeleteSelected(); return; }
    if (selectedId){ deleteSelected(); return; }
  }
  const t = KEY_TOOL[e.key.toLowerCase()];
  if (t){ const btn = document.querySelector(`.bd-tool[data-tool="${t}"]`); if (btn) btn.click(); }
});

/* ═══════════════════════════════════════════════════════════════════════
   РАСШИРЕННОЕ МЕНЮ ВЫДЕЛЕНИЯ — появляется у объекта(ов) как сразу после
   постройки (пока активен «замок редактирования»), так и при любом более
   позднем повторном выделении через инструмент «выделение»
   ═══════════════════════════════════════════════════════════════════════ */
function updateContextMenu(){
  const menu = document.getElementById('bdCtxMenu');
  if (!menu || !B) return;
  if (dragMode === 'marquee' || dragMode === 'pan'){ menu.classList.remove('open'); return; }
  const sel = getSelectedObjects();
  if (!sel.length){ menu.classList.remove('open'); return; }

  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  sel.forEach(o => { const b=objectBBox(o); minX=Math.min(minX,b.minX); minY=Math.min(minY,b.minY); maxX=Math.max(maxX,b.maxX); maxY=Math.max(maxY,b.maxY); });
  const p0 = worldToScreen({x:minX,y:minY}), p1 = worldToScreen({x:maxX,y:maxY});
  menu.classList.add('open');
  const menuW = menu.offsetWidth || 200, menuH = menu.offsetHeight || 300;
  let left = p1.x + 14;
  if (left + menuW > cssW - 8) left = Math.max(8, p0.x - menuW - 14);
  let top = clamp(p0.y, 8, Math.max(8, cssH - menuH - 8));
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';

  const isSingleImage = sel.length===1 && sel[0].type==='image';
  document.getElementById('bdCtxGroup').disabled = sel.length < 2;
  document.getElementById('bdCtxSaveLib').disabled = !isSingleImage;
  document.getElementById('bdCtxSaveLib').style.display = (sel.length===1 && sel[0].type!=='image') ? 'none' : '';
  const pinBtn = document.getElementById('bdCtxPin');
  pinBtn.style.display = isSingleImage ? '' : 'none';
  pinBtn.textContent = (isSingleImage && sel[0].locked) ? 'Открепить' : 'Закрепить';
  document.getElementById('bdCtxZoomLabel').textContent = Math.round(cam.zoom*100) + '%';
}
document.getElementById('bdCtxMenu').addEventListener('click', (e) => {
  const act = e.target.closest('button') && e.target.closest('button').dataset.act;
  if (!act) return;
  const sel = getSelectedObjects();
  if (act === 'move'){
    if (sel.length) pendingMoveArmed = true;
  } else if (act === 'delete'){
    deleteSelected();
  } else if (act === 'copy'){
    if (sel.length) clipboardObjs = sel.map(o => JSON.parse(JSON.stringify(o)));
  } else if (act === 'paste'){
    pasteClipboard();
  } else if (act === 'savelib'){
    if (sel.length===1 && sel[0].type==='image' && B){
      B.imageLib = B.imageLib || [];
      B.imageLib.push({ id: uid(), src: sel[0].src, createdAt: nowTs() });
      saveDB();
    }
  } else if (act === 'group'){
    if (multiSelectIds.length >= 2){
      pushUndo();
      const gid = uid();
      multiSelectIds.forEach(id => { const o=B.objects.find(x=>x.id===id); if (o) o.groupId = gid; });
      saveDB(); scheduleRedraw();
    }
  } else if (act === 'pin'){
    if (sel.length===1 && sel[0].type==='image'){
      pushUndo(); sel[0].locked = !sel[0].locked; saveDB(); scheduleRedraw();
    }
  }
});
function pasteClipboard(){
  if (!clipboardObjs || !clipboardObjs.length || !B) return;
  pushUndo();
  // «Вставить» кладёт копию туда, где сейчас работает пользователь, а не
  // рядом с местом исходного копирования: если на момент нажатия что-то
  // выделено (а меню с кнопкой «Вставить» показывается только у выделения —
  // значит именно рядом с ним и нажали), центрируем вставляемую группу на
  // центре ЭТОГО выделения; иначе — на центре текущей видимой области.
  const curSel = getSelectedObjects();
  let anchor;
  if (curSel.length){
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    curSel.forEach(o => { const b=objectBBox(o); minX=Math.min(minX,b.minX); minY=Math.min(minY,b.minY); maxX=Math.max(maxX,b.maxX); maxY=Math.max(maxY,b.maxY); });
    anchor = { x:(minX+maxX)/2, y:(minY+maxY)/2 };
  } else {
    anchor = { x: cam.x + (cssW/2)/cam.zoom, y: cam.y + (cssH/2)/cam.zoom };
  }
  // центр самой копируемой группы в её исходных координатах — сдвигаем всю
  // группу целиком так, чтобы её центр оказался в anchor, сохраняя взаимное
  // расположение объектов друг относительно друга
  let cMinX=Infinity,cMinY=Infinity,cMaxX=-Infinity,cMaxY=-Infinity;
  clipboardObjs.forEach(o => { const b=objectBBox(o); cMinX=Math.min(cMinX,b.minX); cMinY=Math.min(cMinY,b.minY); cMaxX=Math.max(cMaxX,b.maxX); cMaxY=Math.max(cMaxY,b.maxY); });
  const srcCenter = { x:(cMinX+cMaxX)/2, y:(cMinY+cMaxY)/2 };
  let dx = anchor.x - srcCenter.x, dy = anchor.y - srcCenter.y;
  // вставляем туда же, откуда копировали (сдвиг ~0) — сдвигаем на полклетки,
  // чтобы новая копия была видна поверх исходника, а не легла точно на него
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1){ const off=(B.cellSize||20)/2; dx+=off; dy+=off; }
  const newIds = [];
  clipboardObjs.forEach(src => {
    const obj = JSON.parse(JSON.stringify(src));
    obj.id = uid();
    obj.points = obj.points.map(p => ({ x:p.x+dx, y:p.y+dy }));
    if (obj.ctrl) obj.ctrl = { x:obj.ctrl.x+dx, y:obj.ctrl.y+dy };
    delete obj.groupId; // вставленная копия — самостоятельный объект, а не часть старой группы
    B.objects.push(obj);
    newIds.push(obj.id);
  });
  if (newIds.length === 1){ selectedId = newIds[0]; multiSelectIds = []; }
  else { selectedId = null; multiSelectIds = newIds; }
  saveDB(); scheduleRedraw(); updateContextMenu();
}
document.getElementById('bdCtxZoomIn').addEventListener('click', () => setZoom(cam.zoom*1.25, cam.x+cssW/2/cam.zoom, cam.y+cssH/2/cam.zoom, cssW/2, cssH/2));
document.getElementById('bdCtxZoomOut').addEventListener('click', () => setZoom(cam.zoom/1.25, cam.x+cssW/2/cam.zoom, cam.y+cssH/2/cam.zoom, cssW/2, cssH/2));

/* ═══════════════════════════════════════════════════════════════════════
   Небольшой набор точек входа для boards-cloud.js (общая доска с учеником).
   B и DB — обычные `let`-переменные этого файла, снаружи (из другого
   <script>) недоступны напрямую, поэтому даём наружу только эти несколько
   функций-геттеров/помощников. Сам движок доски ничего не знает про
   облако — если boards-cloud.js не подключён, ничего этого не вызывается.
   ═══════════════════════════════════════════════════════════════════════ */
window.getDB = function(){ return DB; };
window.getCurrentBoard = function(){ return B; };
window.boardsRedraw = function(){ scheduleRedraw(); updateContextMenu(); };
window.boardsClearSelection = function(){ selectedId = null; multiSelectIds = []; clearEditLock(); };

/* ═══════════════════════════════════════════════════════════════════════
   СТАРТ
   ═══════════════════════════════════════════════════════════════════════ */
// точка входа приложения. Если подключён boards-cloud.js (вход по email
// для общей доски с учеником) — он сам вызовет boardsAppBoot() после
// подтверждения входа; если boards-cloud.js на странице нет вообще —
// вызываем сразу же, как и раньше, чтобы обычная локальная работа никак
// не зависела от облака.
window.boardsAppBoot = function(){
  if (window.__boardsBooted) return;
  window.__boardsBooted = true;
  renderList();
  const m = /board=([^&]+)/.exec(location.hash);
  if (m && DB.boards.some(b=>b.id===m[1])) openBoard(m[1]);
};
if (!window.__hasCloudGate) window.boardsAppBoot();
window.addEventListener('beforeunload', () => { if (B) { try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(DB)); }catch(e){} } });
document.addEventListener('visibilitychange', () => { if (document.hidden && B) { try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(DB)); }catch(e){} } });
