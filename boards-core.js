/* ═══════════════════════════════════════════════════════════════════════
   boards-core.js — движок приложения «Доски» (boards.html): список папок и
   досок, бесконечный векторный холст из тетрадных листов, хранение в
   IndexedDB, экспорт. Вход и общие доски — отдельным слоем в boards-cloud.js.
   С главной (index.html) сюда ведёт кнопка «Доски». Карта модели данных и
   история решений — в HANDOFF.md, разделы 6–8.
   ═══════════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'ogeBoards:v1';

function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function nowTs(){ return Date.now(); }
function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }
function dist(a, b){ return Math.hypot(a.x - b.x, a.y - b.y); }
function clonePts(obj){ return { points: obj.points.map(p => ({ x: p.x, y: p.y })), ctrl: obj.ctrl ? { x: obj.ctrl.x, y: obj.ctrl.y } : null }; }

/* ───────── хранилище ─────────
   Раньше ВСЕ доски со всеми картинками лежали в одном ключе localStorage.
   У localStorage потолок около 5 МБ на весь сайт — одна вставленная в доску
   картинка со скриншотом съедала его целиком, и с этого момента доски просто
   переставали сохраняться. Теперь доски живут в IndexedDB: там браузер даёт
   не мегабайты, а сотни мегабайт (обычно доли свободного места на диске).
   localStorage остаётся только как аварийный запасной вариант — и как
   источник для одноразового переезда старых досок. */
let DB = { folders: [], boards: [] };

const IDB_NAME = 'ogeBoardsDB';
const IDB_STORE = 'state';
let idbPromise = null;
function idbOpen(){
  if (idbPromise) return idbPromise;
  idbPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(new Error('IndexedDB недоступен')); return; }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).catch(err => { idbPromise = null; throw err; });
  return idbPromise;
}
function idbGet(key){
  return idbOpen().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}
function idbPut(key, value){
  return idbOpen().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('запись прервана'));
  }));
}
function idbDelete(key){
  return idbOpen().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('удаление прервано'));
  })).catch(() => {});   // это только уборка мусора — сбой здесь не критичен
}

/* ═══ Промпт №45: доски — отдельными записями ═══
   Раньше ВСЕ доски со всеми картинками лежали ОДНОЙ записью ('db') — и на
   каждое сохранение (пауза 300 мс после любого штриха) сериализовалась и
   переписывалась целиком вся коллекция, а не только та доска, в которой
   рисуют. Пока досок было немного, это не чувствовалось; когда их
   накопилось два десятка, часть — с вставленными картинками, запись стала
   ощутимо грузить процессор и диск при каждом штрихе, а один раз вкладка
   так и вовсе упала. Проблема не в новой правке — она была заложена
   изначально, просто раньше не набрала веса, чтобы её заметить.

   Теперь тяжёлые поля каждой доски (штрихи `objects` и `imageLib`) лежат
   СВОЕЙ записью `boarddata:<id>`, а запись `db` держит только лёгкие
   метаданные — имена, папки, даты, `rev`, вид. При автосохранении во время
   рисования переписывается индекс (маленький, метаданные всех досок сразу)
   и запись ОДНОЙ активной доски — остальные 21 не трогаются вовсе.

   В памяти доски тоже лёгкие, пока их не открыли: тяжёлые поля
   подгружаются по одной при открытии (Промпт №47, ensureBoardLoaded) и
   выгружаются обратно при выходе в список (Промпт №48, unloadBoard).
   Код, которому нужны ВСЕ доски целиком (экспорт архива, перенос, копии),
   сам догружает их и «застолбляет» на время работы (pinAllBoards). */
const IDB_BOARD_PREFIX = 'boarddata:';
const IDB_INDEX_VERSION = 2;
// Промпт №49: ключ метки «пытаемся открыть доску по хэшу из адреса» — см.
// boardsAppBoot внизу файла, защита от бесконечного цикла крах-перезагрузка
const AUTO_OPEN_GUARD_KEY = 'boardsAutoOpenAttempt';

// то, что уходит в индекс: доска без тяжёлых полей
function stripHeavy(b){
  const copy = Object.assign({}, b);
  delete copy.objects;
  delete copy.imageLib;
  return copy;
}
// то, что уходит в отдельную запись доски
function heavyOf(b){
  return { objects: b.objects || [], imageLib: b.imageLib || [] };
}

// Промпт №47: доска из индекса приходит БЕЗ objects/imageLib (см. stripHeavy) —
// b.objects === undefined и есть признак «эту доску ещё не подгружали».
// Догружаем её тяжёлые поля из собственной записи один раз и дальше держим
// в памяти как обычно (это не меняется — меняется только МОМЕНТ загрузки:
// не все 22 доски разом при заходе на сайт, а по одной, когда её реально
// открывают/используют)
// Промпт №54: если прочитать запись НЕ ПОЛУЧИЛОСЬ (сбой хранилища, а не
// «записи нет»), доска остаётся невыгруженной и обещание отклоняется. Раньше
// сбой чтения превращался в `objects = []` — доска выглядела подгруженной и
// пустой, и первый же штрих на ней переписал бы на диске весь урок этим
// одним штрихом (та же беда, что в промпте №52, только через чтение).
// Отсутствие записи — законная пустая доска (например, только что созданная
// или подтянутая из облака), её по-прежнему считаем пустой.
function ensureBoardLoaded(b){
  if (!b || b.objects !== undefined) return Promise.resolve(b);
  return idbGet(IDB_BOARD_PREFIX + b.id).then(payload => {
    // пока читали, доску могли подгрузить другим путём — не затираем
    if (b.objects !== undefined) return b;
    b.objects = (payload && payload.objects) || [];
    b.imageLib = (payload && payload.imageLib) || [];
    return b;
  });
}
// одно сообщение на все места, где доску не удалось прочитать с диска
function alertBoardReadFailed(err){
  console.error('[boards] не удалось прочитать доску с диска:', err);
  alert('Не получилось прочитать доску из памяти браузера. Её содержимое не тронуто — '
    + 'попробуйте ещё раз или перезагрузите страницу. Если повторяется — см. HANDOFF, '
    + '«Если доски тормозят или падают».');
}

// Промпт №48: ensureBoardLoaded подгружает доску один раз, но ничего не
// выгружает обратно — доска, которую открывали в этой сессии, так и
// оставалась в памяти НАВСЕГДА, пока не перезагрузишь всю страницу. За
// долгую рабочую сессию (открыл одну доску, вернулся в список, открыл
// другую, и так десяток раз) это тихо копится — а декодированная в
// памяти браузера картинка (imgCache, см. ниже) весит НАМНОГО больше
// своего же base64-веса на диске: скриншот в пару мегабайт разворачивается
// в десятки мегабайт по 4 байта на пиксель. Через несколько часов работы
// с несколькими досками с картинками это и даёт тот самый мгновенный
// скачок на несколько гигабайт и крах вкладки, который ловили в этой
// сессии живьём через Activity Monitor. Выгружаем доску обратно в лёгкое
// состояние (как будто её не открывали) при уходе со страницы доски —
// вызывается из backToList(); данные при этом никуда не пропадают, они
// уже сохранены в свою запись boarddata:<id> и просто подгрузятся заново,
// если доску откроют снова.
// Промпт №48 (правка после находки гонки): пока идёт операция, которой
// ЗАКОНОМЕРНО нужны все доски разом (выгрузка всего архива, восстановление
// из копии, слияние архива) — она сама держит подгруженные доски какое-то
// время через await/диалоги, и если ровно в этот момент пользователь (или,
// в тестах, соседний вызов) успевает уйти с другой доски, unloadBoard мог
// выдернуть objects из-под уже идущей операции ПОСЛЕ того, как та их
// прочитала, но ДО того, как записала итог, — доска экспортировалась бы
// пустой. Пока счётчик > 0, выгрузку просто откладываем: доска полежит в
// памяти чуть дольше, зато операции с «нужны все доски» ничего не потеряют.
let boardsPinned = 0;
function pinAllBoards(){ boardsPinned++; }
function unpinAllBoards(){ boardsPinned = Math.max(0, boardsPinned - 1); }

function unloadBoard(b){
  if (boardsPinned > 0) return;              // идёт операция «нужны все доски целиком» — не мешаем
  if (!b || b.objects === undefined) return; // уже не подгружена — нечего выгружать
  const srcs = new Set();
  (b.objects || []).forEach(o => { if (o.type === 'image' && o.src) srcs.add(o.src); });
  (b.refPanel && b.refPanel.imageObjects || []).forEach(o => { if (o.src) srcs.add(o.src); });
  // не трогаем кэш картинки, если она же используется какой-то ДРУГОЙ доской,
  // до сих пор подгруженной в память, — редкий случай (общая картинка), но
  // проверить его дешевле, чем потом ловить «Загрузка…» на чужой доске
  DB.boards.forEach(other => {
    if (other === b || other.objects === undefined) return;
    (other.objects || []).forEach(o => { if (o.type === 'image' && o.src) srcs.delete(o.src); });
    (other.refPanel && other.refPanel.imageObjects || []).forEach(o => { if (o.src) srcs.delete(o.src); });
  });
  srcs.forEach(src => { delete imgCache[src]; });
  b.objects = undefined;
  b.imageLib = undefined;
}

// какие доски правились с последнего сохранения — раз в 300 мс рисования
// это почти всегда ровно одна (открытая), но объёмные операции (импорт
// файла, перенос архивом, восстановление из копии) правят сразу несколько
let dirtyBoardIds = new Set();
function markBoardDirty(id){ if (id) dirtyBoardIds.add(id); }

// синхронное чтение старого хранилища — нужно и для переезда, и на случай,
// если IndexedDB почему-то недоступен (например, приватное окно)
function loadDB(){
  try { const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); if (raw && raw.boards) DB = raw; } catch(e){}
}

/* Переезд со старого формата (одна запись 'db' со ВСЕМИ полями каждой
   доски) на новый (лёгкий индекс + отдельная запись на каждую доску).
   Тяжёлые поля уже лежат у нас в памяти (пришли из старой записи целиком),
   поэтому просто раскладываем их по своим ключам и переписываем индекс.
   Одноразовая операция: как только индекс получит __v: 2, дальше грузимся
   уже по-новому. Делается один раз при первом заходе после обновления —
   стоит ровно столько же записи, сколько раньше стоило одно обычное
   сохранение, просто раздельными кусками вместо одного. */
function migrateToSplitStorage(oldDb){
  const boards = Array.isArray(oldDb.boards) ? oldDb.boards : [];
  return Promise.all(boards.map(b => idbPut(IDB_BOARD_PREFIX + b.id, heavyOf(b))))
    .then(() => idbPut('db', {
      __v: IDB_INDEX_VERSION,
      folders: oldDb.folders || [],
      boards: boards.map(stripHeavy),
      deleted: oldDb.deleted || [],
      sortMode: oldDb.sortMode,
    }))
    .then(() => console.info('[boards] доски переведены на раздельное хранение — обычное сохранение больше не переписывает всё сразу'));
}

/* Загрузка из IndexedDB. Если там пусто, а в localStorage лежат старые
   доски — переносим их и только ПОСЛЕ успешной записи освобождаем старый
   ключ: до этого момента ничего удалять нельзя, иначе при сбое переезда
   доски пропали бы совсем. */
// Промпт №54: IndexedDB прочитался при загрузке — значит, доски живут в нём.
// Тогда сбой записи — это настоящий сбой, и о нём надо сказать человеку, а не
// прятать за копией в localStorage (см. idbSaveDB)
let idbWorks = false;
function idbLoadDB(){
  return idbGet('db').then(saved => {
    idbWorks = true;
    if (saved && Array.isArray(saved.boards)) {
      if (saved.__v === IDB_INDEX_VERSION) {
        // Промпт №47: раньше тут же, при самой загрузке страницы, тяжёлые
        // поля ВСЕХ досок разом подгружались в память (Promise.all по
        // каждой доске) — при десятках досок с картинками это столько
        // памяти, что вкладка падала ещё до того, как успевал появиться
        // список досок (без единого штриха, без открытия хоть одной
        // доски). Теперь в индексе только лёгкие поля, а штрихи и картинки
        // каждой доски подгружаются лениво — при её открытии (см.
        // ensureBoardLoaded, вызывается из openBoard)
        DB = saved;
        return true;
      }
      // старый формат — доски уже полные (со штрихами и картинками), просто
      // раскладываем их по новым записям
      DB = saved;
      return migrateToSplitStorage(saved).then(() => true).catch(err => {
        // не удалось разложить — не страшно, работаем как раньше единым
        // блоком, следующая попытка будет при следующей загрузке страницы
        console.warn('[boards] переезд на раздельное хранение не удался, работаем по-старому:', err && err.message);
        // Промпт №54: но первое же сохранение запишет индекс УЖЕ без
        // штрихов поверх старой полной записи — значит, штрихи каждой доски
        // должны уйти в её собственную запись тем же сохранением. Без этой
        // пометки туда попали бы только правленные доски, а остальные
        // остались бы лишь в памяти до перезагрузки
        (DB.boards || []).forEach(b => { if (b && b.objects !== undefined) markBoardDirty(b.id); });
        return true;
      });
    }
    loadDB();
    if (DB && DB.boards && DB.boards.length) {
      return migrateToSplitStorage(DB).then(() => {
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        console.info('[boards] доски перенесены из localStorage в IndexedDB — место больше не кончится');
        return true;
      });
    }
    return true;
  }).catch(err => {
    console.warn('[boards] IndexedDB недоступен, работаем на localStorage:', err && err.message);
    // Промпт №54: сюда попадаем и когда чтение прошло, а переезд из
    // localStorage записаться не смог — тогда доски живут в localStorage,
    // и именно туда должна идти аварийная копия (см. idbSaveDB)
    idbWorks = false;
    loadDB();
    return false;
  });
}
let saveTimer = null;
// ── раньше ошибка сохранения (например, кончилось место в localStorage —
// лимит на весь сайт около 5–10 МБ, а тут в ОДНОМ ключе лежат вообще все
// доски со всеми картинками) проглатывалась молча: работа в моменте
// выглядела нормально, но по факту с этого момента вообще ничего не
// сохранялось, и пропажа обнаруживалась только через день-два, когда было
// уже поздно. Теперь неудачное сохранение сразу показывает предупреждение
// на весь экран — один раз, пока не появится успешное сохранение снова, —
// вместо того чтобы молчать. ──
let saveFailedWarned = false;

/* ── сколько места занято и сколько всего доступно ──
   Раньше сообщение о сбое сохранения было гаданием: «вероятно, кончилось
   место» — а понять, так это или нет, было нечем. Теперь считаем реальные
   цифры: вес самих досок и оценку браузера по всему origin. */
function fmtMB(bytes){
  if (!isFinite(bytes) || bytes < 0) return '?';
  const mb = bytes / (1024 * 1024);
  return (mb < 10 ? mb.toFixed(1) : Math.round(mb)) + ' МБ';
}
function boardsPayloadBytes(){
  try { return JSON.stringify(DB).length; } catch (e) { return -1; }
}
function isQuotaError(e){
  if (!e) return false;
  const name = e.name || '';
  return name === 'QuotaExceededError'
      || name === 'NS_ERROR_DOM_QUOTA_REACHED'
      || e.code === 22 || e.code === 1014;
}
// оценка браузера приходит асинхронно — как только придёт, дополняем текст
async function storageEstimateText(){
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      if (est && est.quota) return ' Браузер отводит на этот сайт около ' + fmtMB(est.quota)
        + ', занято примерно ' + fmtMB(est.usage || 0) + '.';
    }
  } catch (e) {}
  return '';
}
window.boardsStorageInfo = async function(){
  const used = boardsPayloadBytes();
  let quota = null, usage = null;
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      quota = est && est.quota || null;
      usage = est && est.usage || null;
    }
  } catch (e) {}
  return { boardsBytes: used, quota, usage };
};

function showSaveFailedWarning(err){
  if (saveFailedWarned) return;
  saveFailedWarned = true;
  try {
    const quotaLike = isQuotaError(err);
    const bar = document.createElement('div');
    bar.id = 'saveFailBanner';
    bar.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:99999;background:#c0392b;color:#fff;'
      + 'font-family:system-ui,sans-serif;font-size:14px;line-height:1.45;padding:10px 16px;text-align:center;'
      + 'box-shadow:0 2px 10px rgba(0,0,0,.35);display:flex;gap:12px;align-items:center;justify-content:center;'
      + 'flex-wrap:wrap;';

    const text = document.createElement('span');
    text.id = 'saveFailText';
    // после переезда на IndexedDB упереться в место почти невозможно, поэтому
    // формулировка больше не утверждает «кончилось место» как единственную
    // причину: браузер может отказать в записи и в приватном окне, и при
    // переполненном диске
    text.textContent = quotaLike
      ? '⚠️ Доска не сохраняется: браузер отказал в записи, похоже, из-за нехватки места. Все доски вместе весят '
        + fmtMB(boardsPayloadBytes()) + '.'
      : '⚠️ Доска не сохраняется (' + ((err && (err.name || err.message)) || 'причина неизвестна')
        + '). Все доски вместе весят ' + fmtMB(boardsPayloadBytes()) + '.';

    // кнопка спасения прямо здесь: не нужно выходить из доски, чтобы
    // сохранить работу файлом — именно в этот момент выходить и опаснее всего
    const save = document.createElement('button');
    save.textContent = 'Выгрузить в файл';
    save.style.cssText = 'background:#fff;color:#c0392b;border:0;border-radius:8px;padding:6px 12px;'
      + 'font:inherit;font-weight:700;cursor:pointer;';
    save.addEventListener('click', () => {
      // Промпт №54: на списке досок B указывает на ПОКИНУТУЮ и уже
      // выгруженную доску (промпт №52) — её выгрузка давала файл без
      // единого штриха. А «все доски» раньше писались как JSON.stringify(DB),
      // где у неоткрытых досок нет содержимого, и такой файл даже не
      // загружался обратно. Теперь: открыта доска — она, иначе — полный архив.
      try {
        if (boardActive && B) exportBoardToFile(B);
        else exportAllBoardsArchive();
      } catch (e) { alert('Не удалось выгрузить: ' + (e && e.message || e)); }
    });

    const hide = document.createElement('button');
    hide.textContent = 'Скрыть';
    hide.style.cssText = 'background:transparent;color:#fff;border:1px solid rgba(255,255,255,.6);'
      + 'border-radius:8px;padding:6px 12px;font:inherit;cursor:pointer;';
    hide.addEventListener('click', () => bar.remove());

    bar.appendChild(text); bar.appendChild(save); bar.appendChild(hide);
    document.body.appendChild(bar);

    // дополняем оценкой браузера, когда она посчитается
    storageEstimateText().then(extra => {
      if (extra && document.getElementById('saveFailText')) {
        document.getElementById('saveFailText').textContent += extra
          + ' Сначала выгрузите эту доску в файл кнопкой ниже — так работа точно не потеряется.';
      }
    });
  } catch (e) {}
}
function clearSaveFailedWarning(){
  saveFailedWarned = false;
  const bar = document.getElementById('saveFailBanner');
  if (bar) bar.remove();
}
/* ═══ Промпт №40: сохранение больше не затирает чужую работу ═══
   Все доски лежат в хранилище ОДНОЙ записью, а каждая вкладка держит свою
   копию в памяти и раньше писала её туда целиком. Достаточно было открыть
   доску во второй вкладке и что-нибудь там тронуть — и запись этой вкладки
   стирала всё, что успели написать в первой. Именно так и пропадали записи
   после занятия: вторая вкладка, открытая утром, «помнила» доску пустой.

   Теперь запись идёт в одной транзакции: читаем то, что реально лежит в
   хранилище прямо сейчас, вливаем в него свои изменения и только потом
   записываем. Доска берётся та, у которой свежее отметка правки; доски,
   созданные в другой вкладке, не теряются; удаление разносится отдельным
   списком «удалённых» (иначе удалённая в одной вкладке доска возвращалась бы
   из копии другой). */
const DELETED_KEEP_MS = 90 * 24 * 3600 * 1000;   // сколько помним об удалении

function noteDeleted(kind, id){
  DB.deleted = DB.deleted || [];
  DB.deleted.push({ kind, id, at: nowTs() });
}
function pruneDeleted(list){
  const edge = nowTs() - DELETED_KEEP_MS;
  return (list || []).filter(d => d && d.id && (d.at || 0) > edge);
}
function stamp(b){ return Math.max(b && b.updatedAt || 0, b && b.createdAt || 0); }
// «чья версия главнее»: сперва номер правки, при равенстве — время
function storedWins(sb, mb){
  const rs = (sb.rev || 0), rm = (mb.rev || 0);
  if (rs !== rm) return rs > rm;
  return stamp(sb) > stamp(mb);
}

/* Слияние «что в хранилище» и «что у меня в памяти». mine — главный по
   порядку следования и по общим настройкам, но содержимое каждой доски
   берётся то, которое новее. */
function mergeDbs(stored, mine){
  if (!stored || !Array.isArray(stored.boards)) return mine;
  const deleted = pruneDeleted((stored.deleted || []).concat(mine.deleted || []));
  const goneIds = new Set(deleted.map(d => d.id));

  const storedById = new Map(stored.boards.map(b => [b.id, b]));
  const mineById = new Map(mine.boards.map(b => [b.id, b]));
  const out = [];
  const taken = new Set();
  let activeChanged = false;
  // сначала — в моём порядке (порядок карточек тоже настройка вкладки).
  // Объекты досок НЕ подменяем новыми: на открытую доску указывает B, и
  // подмена оборвала бы связь с тем, что сейчас рисуют. Если свежее оказалась
  // чужая версия — переливаем её содержимое в свой же объект.
  mine.boards.forEach(mb => {
    if (goneIds.has(mb.id)) return;
    taken.add(mb.id);
    const sb = storedById.get(mb.id);
    if (!sb) { out.push(mb); return; }
    const lastOpened = Math.max(sb.lastOpenedAt || 0, mb.lastOpenedAt || 0);
    if (storedWins(sb, mb)) {
      const myView = mb.view;
      Object.assign(mb, sb);
      if (myView) mb.view = myView;        // куда прокручено — дело этой вкладки
      if (B && B.id === mb.id) activeChanged = true;
    }
    mb.lastOpenedAt = lastOpened;
    out.push(mb);
  });
  // если открытая доска подтянула чужую, более свежую версию — перерисуем
  if (activeChanged) setTimeout(() => { try { scheduleRedraw(); } catch (e) {} }, 0);
  // доски, созданные в другой вкладке, пока я работал
  stored.boards.forEach(sb => { if (!taken.has(sb.id) && !goneIds.has(sb.id)) out.push(sb); });

  const folders = [];
  const fTaken = new Set();
  (mine.folders || []).forEach(f => { if (!goneIds.has(f.id)) { fTaken.add(f.id); folders.push(f); } });
  (stored.folders || []).forEach(f => { if (!fTaken.has(f.id) && !goneIds.has(f.id)) folders.push(f); });

  return Object.assign({}, mine, { boards: out, folders, deleted });
}

/* Одна транзакция на чтение+запись индекса: пока она идёт, другая вкладка
   в эту же запись не влезет — значит, слияние не может «разъехаться».
   Сюда идут только лёгкие метаданные — штрихи и картинки сохраняются
   отдельно, см. idbSaveDB. Возвращает, проиграла ли открытая доска слияние
   (тогда её содержимое устарело и его нужно перечитать, а не переписывать
   своим). */
function idbSaveIndexMerged(){
  return idbOpen().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    const req = store.get('db');
    let activeLost = false;
    req.onsuccess = () => {
      try {
        const stored = (req.result && Array.isArray(req.result.boards)) ? req.result : null;
        activeLost = activeLostTo(stored);
        // сравниваем и переставляем ЛЁГКИЕ копии — mergeDbs не трогает
        // тяжёлые поля (rev/updatedAt на них не завязаны), а сами реальные
        // доски (с их objects/imageLib в памяти) ниже подставляются обратно
        const mineIndex = {
          folders: DB.folders, deleted: DB.deleted, sortMode: DB.sortMode,
          boards: DB.boards.map(stripHeavy),
        };
        const merged = mergeDbs(stored, mineIndex);
        merged.deleted = pruneDeleted(merged.deleted);
        applyMergedIndex(merged);
        store.put(Object.assign({ __v: IDB_INDEX_VERSION }, {
          folders: DB.folders, boards: DB.boards.map(stripHeavy),
          deleted: DB.deleted, sortMode: DB.sortMode,
        }), 'db');
      } catch (e) { reject(e); return; }
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => resolve({ activeLost });
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('запись прервана'));
  }));
}
// проиграла ли МОЯ открытая доска слияние (в другой вкладке её продвинули
// дальше) — тогда мои несохранённые правки по ней уже не главные
function activeLostTo(stored){
  if (!B || !stored) return false;
  const sb = stored.boards && stored.boards.find(x => x.id === B.id);
  return !!(sb && storedWins(sb, stripHeavy(B)));
}
// результат mergeDbs (лёгкие копии) — обратно в реальные доски с их
// тяжёлыми полями. Доска, которая была и раньше, получает СВОИ метаданные
// (Object.assign не трогает objects/imageLib — их просто нет у lite-копии);
// доска, которой раньше не было (её создали в другой вкладке), пока лежит
// без содержимого — оно подтянется, когда её откроют
function applyMergedIndex(merged){
  const realById = new Map(DB.boards.map(r => [r.id, r]));
  DB.boards = merged.boards.map(m => {
    const real = realById.get(m.id);
    if (real) { Object.assign(real, m); return real; }
    return m;
  });
  DB.folders = merged.folders;
  DB.deleted = merged.deleted;
}
// открытая доска проиграла слияние — подтягиваем то, что реально лежит на
// диске, вместо того чтобы через триста миллисекунд затереть это своим
// устаревшим содержимым (та же логика, что раньше делал Object.assign(mb, sb)
// целиком, просто тяжёлая часть теперь лежит отдельно и её надо перечитать)
function refreshActivePayloadIfLost(lost){
  if (!lost || !B) return Promise.resolve();
  const id = B.id;
  return idbGet(IDB_BOARD_PREFIX + id).then(payload => {
    if (!B || B.id !== id) return;   // за время запроса успели закрыть доску
    B.objects = (payload && payload.objects) || [];
    B.imageLib = (payload && payload.imageLib) || [];
    try { scheduleRedraw(); } catch (e) {}
  });
}

/* ═══ Промпт №40: автоматические резервные копии ═══
   Даже с правильным слиянием остаётся класс бед, от которых спасает только
   копия: сбой браузера, случайное «удалить», чужая ошибка в коде. Поэтому
   не чаще раза в 15 минут откладываем снимок всего хранилища. Снимков три —
   примерно на последние сутки работы.
   Промпт №45/47: снимок берём из того, что реально лежит в памяти (DB), —
   с диска ради снимка ничего не дочитываем (см. комментарий в
   maybeSnapshot: это вернуло бы падения по памяти). Неоткрытые в этой
   сессии доски попадают в снимок лёгкими, без штрихов. */
const SNAP_KEYS = ['db_snap1', 'db_snap2', 'db_snap3'];
const SNAP_EVERY_MS = 15 * 60 * 1000;
function maybeSnapshot(){
  if (!DB || !Array.isArray(DB.boards) || !DB.boards.length) return Promise.resolve();
  return idbGet('db_snap_meta').then(meta => {
    const now = Date.now();
    const last = (meta && meta.at) || 0;
    if (now - last < SNAP_EVERY_MS) return;
    const slot = ((meta && meta.slot) || 0) % SNAP_KEYS.length;
    // Промпт №47 (первая версия) пыталась догружать с диска штрихи ВСЕХ
    // неоткрытых досок прямо тут, чтобы снимок был полным — но это ровно та
    // же исходная беда: разом в памяти оказываются штрихи и картинки всех
    // 22 досок, только теперь это происходит не при заходе на сайт, а через
    // пару секунд после открытия ЛЮБОЙ доски (как только придёт время
    // очередного 15-минутного снимка) — вкладка падала снова, просто по
    // другому поводу. Берём в снимок только то, что и так уже подгружено —
    // доска, которую в этой сессии не открывали, останется в снимке лёгкой
    // (без штрихов); её содержимое и так цело в своей записи `boarddata:<id>`
    // независимо от снимков, так что это не потеря данных, а осознанный
    // компромисс ради того, чтобы снимок никогда не стоил всей памяти сразу
    const snap = JSON.parse(JSON.stringify({ folders: DB.folders, boards: DB.boards, deleted: DB.deleted, sortMode: DB.sortMode }));
    return idbPut(SNAP_KEYS[slot], { at: now, db: snap })
      .then(() => idbPut('db_snap_meta', { at: now, slot: slot + 1 }));
  }).catch(() => {});
}
function listSnapshots(){
  return Promise.all(SNAP_KEYS.map(k => idbGet(k).then(v => (v && v.db ? { key: k, at: v.at, db: v.db } : null)).catch(() => null)))
    .then(list => list.filter(Boolean).sort((a, b) => b.at - a.at));
}

/* Промпт №45: раньше здесь одной записью писалась вся `DB` целиком — на
   каждый штрих переписывались все доски со всеми картинками разом. Теперь
   отдельно (и всегда) — маленький индекс всех досок, и отдельно — тяжёлая
   часть ТОЛЬКО тех досок, что реально правили с прошлого сохранения
   (dirtyBoardIds, см. touchBoard). Пока правят одну открытую доску, это
   значит: индекс + ровно одна запись, а не двадцать две. */
function idbSaveDB(){
  maybeSnapshot().catch(() => {});
  const toFlush = Array.from(dirtyBoardIds);
  dirtyBoardIds = new Set();
  return idbSaveIndexMerged()
    .then(({ activeLost }) => {
      const jobs = [];
      if (activeLost) {
        jobs.push(refreshActivePayloadIfLost(true));
        // свои правки по ЭТОЙ доске уже не главные — её мы не дописываем,
        // остальные «грязные» доски (например, из только что загруженного
        // файла) это не касается, их пишем как обычно
        const i = B ? toFlush.indexOf(B.id) : -1;
        if (i >= 0) toFlush.splice(i, 1);
      }
      toFlush.forEach(id => {
        const b = DB.boards.find(x => x.id === id);
        // Промпт №52: доска, выгруженная из памяти (objects === undefined,
        // см. unloadBoard/ensureBoardLoaded), НЕ пустая — её содержимое лежит
        // на диске в своей записи. Метаданные такой доски правят и на списке
        // (перенос в папку, переименование), это метит её «грязной», и
        // heavyOf() тогда писал бы вместо настоящих штрихов пустой массив —
        // ровно так пропал целый урок после переноса доски в архив. Пишем
        // тяжёлую часть только у доски, которая реально лежит в памяти
        if (b && b.objects !== undefined) jobs.push(idbPut(IDB_BOARD_PREFIX + id, heavyOf(b)));
      });
      return Promise.all(jobs);
    })
    .then(() => { clearSaveFailedWarning(); pingOtherTabs(); return true; })
    .catch(err => {
      // не получилось — возвращаем доски в список «грязных», чтобы
      // следующее сохранение попробовало ещё раз
      toFlush.forEach(id => dirtyBoardIds.add(id));
      /* Промпт №54: раньше здесь всегда шла аварийная копия в localStorage,
         и если она вставала — предупреждение снималось. Но при рабочем
         IndexedDB эту копию при загрузке НИКТО не читает (idbLoadDB берёт
         localStorage, только когда в IndexedDB пусто), то есть человеку
         говорили «всё в порядке», а сохранённое терялось. Вдобавок копия
         всех досок забивала localStorage, где лежат вход Supabase, тема и
         «Подборка» — их запись могла начать отказывать следом. Поэтому
         копия в localStorage — только когда IndexedDB недоступен вовсе
         (приватное окно): тогда именно её и прочитает следующая загрузка. */
      if (idbWorks) {
        console.error('[boards] сохранение не прошло:', err);
        showSaveFailedWarning(err);
        return false;
      }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(DB)); clearSaveFailedWarning(); return true; }
      catch (e) { console.error('[boards] сохранение не прошло:', err || e); showSaveFailedWarning(err || e); return false; }
    });
}

/* Соседние вкладки должны узнавать о чужих сохранениях — иначе они так и
   будут держать в памяти устаревшую копию и подсовывать её при каждом своём
   сохранении (слияние это переживёт, но список досок будет врать). */
const DB_PING = 'boardsDbPing';
let lastPingSent = 0;
function pingOtherTabs(){
  const now = Date.now();
  if (now - lastPingSent < 400) return;     // не частим
  lastPingSent = now;
  try { localStorage.setItem(DB_PING, String(now)); } catch (e) {}
}
function refreshFromStore(){
  return idbGet('db').then(stored => {
    if (!stored || !Array.isArray(stored.boards)) return;
    const lost = activeLostTo(stored);
    const mineIndex = { folders: DB.folders, deleted: DB.deleted, sortMode: DB.sortMode, boards: DB.boards.map(stripHeavy) };
    const merged = mergeDbs(stored, mineIndex);
    merged.deleted = pruneDeleted(merged.deleted);
    applyMergedIndex(merged);
    return refreshActivePayloadIfLost(lost).then(() => { if (!boardActive) renderList(); });
  }).catch(() => {});
}
window.addEventListener('storage', (e) => { if (e.key === DB_PING) refreshFromStore(); });
/* Промпт №43: и обязательно — при возвращении к вкладке. Сообщение о чужом
   сохранении вкладка получает и в фоне, но перерисовать себя она в фоне не
   может: браузер останавливает отрисовку у невидимых вкладок. Плюс само
   сообщение может и не дойти (окно другого браузера, приватный режим,
   отключённое хранилище). Поэтому переключение на вкладку — отдельный повод
   перечитать хранилище: так доска свежая уже в момент, когда на неё
   посмотрели, а не через несколько секунд. */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') refreshFromStore();
});
window.addEventListener('focus', () => { refreshFromStore(); });
/* Отметка времени правки. Раньше updatedAt записывалось один раз при
   создании доски и дальше не менялось никогда — то есть узнать, какая из
   двух версий доски свежее, было в принципе невозможно. Сохранение идёт
   через одну точку (saveDB вызывается из полусотни мест), поэтому здесь же
   и штампуем открытую доску: любое изменение внутри неё проходит тут. */
function touchBoard(board){
  // Промпт №52: без аргумента правится открытая доска. Но B после выхода в
  // список не обнуляется и указывает на только что покинутую (и уже
  // выгруженную) доску — а saveDB() на списке зовут удаление, переименование
  // и перенос ЛЮБОЙ доски. Раньше это молча поднимало rev покинутой доске и
  // метило её «грязной». На списке «открытой доски» нет — и штамповать некого
  if (!board && !boardActive) return;
  const b = board || (typeof B !== 'undefined' ? B : null);
  if (!b) return;
  b.updatedAt = nowTs();
  // Промпт №40: номер правки. По нему слияние вкладок понимает, чья копия
  // доски главнее. Одного updatedAt мало: загрузка доски из файла осознанно
  // ставит СТАРУЮ версию, и по времени слияние бы её тут же откатило.
  b.rev = (b.rev || 0) + 1;
  // Промпт №45: любая правка отмечается как «грязная» — при следующем
  // сохранении её тяжёлые поля (штрихи/картинки) действительно запишутся на
  // диск. Через этот же путь идёт весь обычный рисунок (saveDB → touchBoard
  // без аргумента → правится B), поэтому обычное рисование помечает ровно
  // одну доску — открытую.
  markBoardDirty(b.id);
}
function bumpRev(copy, a, b){
  copy.rev = Math.max((a && a.rev) || 0, (b && b.rev) || 0) + 1;
  return copy;
}
function saveDB(){
  stampAuthors();
  touchBoard();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(idbSaveDB, 300);
}
loadDB();

/* ───────── экспорт/импорт отдельной доски файлом ─────────
   Обычные доски хранятся только в этом браузере (IndexedDB), на сервере —
   лишь общие (boards-cloud.js). Файл — ручной, но надёжный способ не
   потерять конкретную доску и перенести её на другое устройство. Загружается
   он той же кнопкой «Загрузить из файла», что и архив всех досок
   (importAnyBoardsFile разбирается по содержимому). */
function exportBoardToFile(board){
  const payload = {
    __app: 'oge-boards', __kind: 'board-export', __version: 1,
    exportedAt: nowTs(),
    board: JSON.parse(JSON.stringify(board)),
  };
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (board.name || 'доска').replace(/[\\/:*?"<>|]/g, '_') + '.board.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ═══════════════════════════════════════════════════════════════════════
   Перенос всех досок между устройствами файлом

   Сценарий: дома выгрузил всё одной кнопкой, увёз файл на ноутбук, там
   загрузил одной кнопкой, поработал, выгрузил обратно, дома загрузил —
   и всё на месте и в свежем виде.

   Почему не «заменить всё целиком»: доска, созданная дома уже ПОСЛЕ
   отъезда, в ноутбучном файле отсутствует — замена стёрла бы её. Поэтому
   слияние: стороны складываются, а по каждой доске отдельно решается,
   чья версия новее.

   Опознаются доски по внутреннему id, а не по имени: переименовал на
   ноутбуке — дома обновится та же самая доска, а не появится вторая.

   Одного времени правки мало: по нему не отличить «правил только там» от
   «правил и там, и тут». Поэтому у доски есть вторая отметка — syncedAt,
   время последнего обмена. Спорной считается доска, изменённая после этой
   точки с обеих сторон; только про такие и спрашиваем.
   ═══════════════════════════════════════════════════════════════════════ */

function workedAt(b){ return Math.max(b.lastOpenedAt || 0, b.updatedAt || 0, b.createdAt || 0); }

function fmtWhen(ts){
  if (!ts) return 'неизвестно';
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2,'0'), mm = String(d.getMonth()+1).padStart(2,'0');
  const hh = String(d.getHours()).padStart(2,'0'), mi = String(d.getMinutes()).padStart(2,'0');
  return `${dd}.${mm}.${d.getFullYear()} ${hh}:${mi}`;
}
function boardWeight(b){
  try { return Math.round(JSON.stringify(b).length / 1024); } catch (e) { return 0; }
}

function exportAllBoardsArchive(){
  // единственное место, где нам ЗАКОНОМЕРНО нужны все доски целиком сразу —
  // это осознанное разовое действие пользователя, а не то, что происходит
  // на каждой загрузке страницы (см. Промпт №47 про ленивую подгрузку).
  // pinAllBoards() — см. Промпт №48: пока собираем архив, не даём
  // unloadBoard() выдернуть чью-то доску из-под уже идущего экспорта
  pinAllBoards();
  Promise.all((DB.boards || []).map(ensureBoardLoaded))
    // архив без одной из досок хуже, чем никакого: человек решит, что всё
    // сохранено, и пойдёт пересобирать хранилище (HANDOFF, раздел 6)
    .then(() => exportAllBoardsArchiveReady(), alertBoardReadFailed)
    .finally(unpinAllBoards);
}
function exportAllBoardsArchiveReady(){
  const stamp = nowTs();
  const payload = {
    __app: 'oge-boards', __kind: 'boards-archive', __version: 1,
    exportedAt: stamp,
    sortMode: DB.sortMode || sortMode,
    folders: JSON.parse(JSON.stringify(DB.folders || [])),
    boards: JSON.parse(JSON.stringify(DB.boards || [])),
  };
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const d = new Date(stamp);
  a.download = 'доски-' + d.getFullYear() + '-' +
    String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0') + '.boards.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);

  // точка расхождения: с этого момента считаем, что стороны выровнены
  (DB.boards || []).forEach(b => { b.syncedAt = stamp; });
  saveDB();
}

/* ── окно выбора версии для спорной доски ─────────────────────────────
   Показываем по одной: что за доска, чем версии отличаются (когда над
   каждой работали, сколько весит), и галочку «так же для остальных» —
   чтобы не отвечать на каждую по отдельности. */
function askWhichVersion(mine, theirs, restCount){
  return new Promise(resolve => {
    const wrap = document.createElement('div');
    wrap.className = 'bl-conflict-back';
    wrap.innerHTML = `
      <div class="bl-conflict">
        <div class="bl-conflict-title">Доска «${escHtml(mine.name || theirs.name)}» изменена в двух местах</div>
        <div class="bl-conflict-sub">Соединить их автоматически нельзя — выберите, какую версию оставить.</div>
        <div class="bl-conflict-cols">
          <label class="bl-conflict-opt">
            <input type="radio" name="blConflictPick" value="mine" checked>
            <span class="bl-conflict-h">Эта версия (здесь)</span>
            <span class="bl-conflict-m">работали: ${fmtWhen(workedAt(mine))}</span>
            <span class="bl-conflict-m">объектов: ${(mine.objects||[]).length} · ${boardWeight(mine)} КБ</span>
          </label>
          <label class="bl-conflict-opt">
            <input type="radio" name="blConflictPick" value="theirs">
            <span class="bl-conflict-h">Версия из файла</span>
            <span class="bl-conflict-m">работали: ${fmtWhen(workedAt(theirs))}</span>
            <span class="bl-conflict-m">объектов: ${(theirs.objects||[]).length} · ${boardWeight(theirs)} КБ</span>
          </label>
          <label class="bl-conflict-opt">
            <input type="radio" name="blConflictPick" value="both">
            <span class="bl-conflict-h">Оставить обе</span>
            <span class="bl-conflict-m">версия из файла ляжет рядом отдельной доской</span>
          </label>
        </div>
        <label class="bl-conflict-all${restCount > 0 ? '' : ' hidden'}">
          <input type="checkbox" id="blConflictAll"> Так же для остальных спорных досок (ещё ${restCount})
        </label>
        <div class="bl-conflict-btns"><button id="blConflictOk">Применить</button></div>
      </div>`;
    document.body.appendChild(wrap);
    wrap.querySelector('#blConflictOk').addEventListener('click', () => {
      const pick = wrap.querySelector('input[name="blConflictPick"]:checked').value;
      const all = wrap.querySelector('#blConflictAll').checked;
      wrap.remove();
      resolve({ pick, all });
    });
  });
}

/* ═══ Промпт №40: окно «Резервные копии» ═══
   Восстановление — только добавляющее: ничего из того, что есть сейчас, оно
   не стирает. Доска, которой сейчас нет, возвращается как была; доска,
   которая есть, но в копии полнее, кладётся рядом отдельной доской с датой
   в названии — а дальше уже человек решает, какая ему нужна. */
function openSnapshotsModal(){
  listSnapshots().then(snaps => {
    const wrap = document.createElement('div');
    wrap.className = 'bl-conflict-back';
    const rows = snaps.length ? snaps.map((sn, i) => {
      const boards = sn.db.boards || [];
      const objs = boards.reduce((n, b) => n + (b.objects || []).length, 0);
      return `<label class="bl-conflict-opt">
          <input type="radio" name="blSnapPick" value="${i}"${i === 0 ? ' checked' : ''}>
          <span class="bl-conflict-h">Копия от ${fmtWhen(sn.at)}</span>
          <span class="bl-conflict-m">досок: ${boards.length} · объектов: ${objs}</span>
        </label>`;
    }).join('') : '<div class="bl-conflict-sub">Копий пока нет — они появляются сами, примерно раз в четверть часа работы.</div>';
    wrap.innerHTML = `
      <div class="bl-conflict">
        <div class="bl-conflict-title">Резервные копии</div>
        <div class="bl-conflict-sub">Копии складываются автоматически. Восстановление только добавляет: ничего из того, что есть сейчас, не пропадёт.</div>
        <div class="bl-conflict-cols">${rows}</div>
        <div class="bl-conflict-btns">
          ${snaps.length ? '<button id="blSnapOk">Восстановить</button>' : ''}
          <button id="blSnapCancel">Закрыть</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    wrap.querySelector('#blSnapCancel').addEventListener('click', () => wrap.remove());
    const ok = wrap.querySelector('#blSnapOk');
    if (ok) ok.addEventListener('click', () => {
      const i = +wrap.querySelector('input[name="blSnapPick"]:checked').value;
      wrap.remove();
      restoreFromSnapshot(snaps[i]);
    });
  });
}
function restoreFromSnapshot(sn){
  // Промпт №47: сравнение «что полнее» ниже читает mine.objects — доска
  // могла быть ещё не подгружена в память (см. ensureBoardLoaded), сначала
  // догружаем всех «своих» кандидатов, иначе сравнение соврёт (посчитает
  // недогруженную доску пустой) и создаст лишнюю копию.
  // pinAllBoards() — см. Промпт №48: то же самое соображение, что и в
  // exportAllBoardsArchive — не даём unloadBoard() выдернуть доску, пока
  // сравниваем её с копией
  pinAllBoards();
  Promise.all((sn.db.boards || []).map(sb => ensureBoardLoaded(DB.boards.find(b => b.id === sb.id))))
    .then(() => restoreFromSnapshotReady(sn), alertBoardReadFailed)
    .finally(unpinAllBoards);
}
function restoreFromSnapshotReady(sn){
  const when = fmtWhen(sn.at);
  let back = 0, copies = 0;
  (sn.db.boards || []).forEach(sb => {
    const mine = DB.boards.find(b => b.id === sb.id);
    if (!mine){
      const b = JSON.parse(JSON.stringify(sb));
      // след об удалении мешал бы доске вернуться — раз человек восстанавливает
      // осознанно, снимаем его
      DB.deleted = (DB.deleted || []).filter(d => d.id !== b.id);
      DB.boards.push(b); markBoardDirty(b.id); back++;
      return;
    }
    if ((sb.objects || []).length > (mine.objects || []).length){
      const b = JSON.parse(JSON.stringify(sb));
      b.id = uid();
      b.name = (sb.name || 'Доска') + ' (копия от ' + when + ')';
      b.createdAt = nowTs(); b.updatedAt = nowTs(); b.syncedAt = 0; b.pairMissing = false;
      DB.boards.push(b); markBoardDirty(b.id); copies++;
    }
  });
  (sn.db.folders || []).forEach(sf => {
    if (!DB.folders.some(f => f.id === sf.id)){
      DB.deleted = (DB.deleted || []).filter(d => d.id !== sf.id);
      DB.folders.push(JSON.parse(JSON.stringify(sf)));
    }
  });
  idbSaveDB();
  renderList();
  alert(back || copies
    ? `Восстановлено из копии от ${when}:\n· вернулось досок: ${back}\n· добавлено копий более полных версий: ${copies}`
    : `В копии от ${when} нет ничего, чего не было бы сейчас.`);
}

/* ── слияние архива ───────────────────────────────────────────────── */
async function mergeArchive(payload){
  // Промпт №48: слияние может подолгу ждать пользователя в askWhichVersion
  // (диалог выбора версии) с уже подгруженной mine — держим pin на всё
  // время функции, а не только вокруг ensureBoardLoaded, иначе unloadBoard
  // успеет отработать прямо во время ожидания клика в диалоге
  pinAllBoards();
  try {
    return await mergeArchiveReady(payload);
  } finally {
    unpinAllBoards();
  }
}
async function mergeArchiveReady(payload){
  const stamp = nowTs();
  const theirBoards = Array.isArray(payload.boards) ? payload.boards : [];
  const theirFolders = Array.isArray(payload.folders) ? payload.folders : [];

  // папки: по id, недостающие добавляем, имя берём у более свежей стороны
  theirFolders.forEach(tf => {
    const mine = DB.folders.find(f => f.id === tf.id);
    if (!mine) DB.folders.push(JSON.parse(JSON.stringify(tf)));
    else if ((tf.updatedAt || 0) > (mine.updatedAt || 0)) mine.name = tf.name;
  });

  const stats = { added: 0, updated: 0, kept: 0, both: 0, marked: 0 };
  const theirIds = new Set(theirBoards.map(b => b.id));
  let blanket = null;   // выбор, применяемый к остальным спорным доскам

  // сначала считаем спорные — чтобы в окне честно писать, сколько осталось
  const conflicts = theirBoards.filter(tb => {
    const mine = DB.boards.find(b => b.id === tb.id);
    if (!mine) return false;
    const base = Math.max(mine.syncedAt || 0, tb.syncedAt || 0);
    return (mine.updatedAt || 0) > base && (tb.updatedAt || 0) > base;
  }).map(b => b.id);
  let conflictsLeft = conflicts.length;

  for (const tb of theirBoards){
    const idx = DB.boards.findIndex(b => b.id === tb.id);
    if (idx < 0){
      const copy = JSON.parse(JSON.stringify(tb));
      copy.syncedAt = stamp;
      copy.pairMissing = false;
      DB.boards.push(copy);
      markBoardDirty(copy.id);
      stats.added++;
      continue;
    }
    const mine = DB.boards[idx];
    mine.pairMissing = false;

    if (conflicts.indexOf(tb.id) >= 0){
      conflictsLeft--;
      let choice = blanket;
      if (!choice){
        // окно сравнения ниже читает mine.objects — доска могла быть ещё не
        // подгружена в память (см. ensureBoardLoaded)
        await ensureBoardLoaded(mine);
        const res = await askWhichVersion(mine, tb, conflictsLeft);
        choice = res.pick;
        if (res.all) blanket = res.pick;
      }
      if (choice === 'theirs'){
        const copy = bumpRev(JSON.parse(JSON.stringify(tb)), mine, tb);
        copy.syncedAt = stamp; copy.pairMissing = false;
        DB.boards[idx] = copy; markBoardDirty(copy.id); stats.updated++;
      } else if (choice === 'both'){
        const copy = JSON.parse(JSON.stringify(tb));
        copy.id = uid();
        copy.name = (tb.name || 'Доска') + ' (версия из файла)';
        copy.syncedAt = stamp; copy.pairMissing = false;
        DB.boards.push(copy);
        markBoardDirty(copy.id);
        mine.syncedAt = stamp;
        stats.both++;
      } else {
        mine.syncedAt = stamp; stats.kept++;
      }
      continue;
    }

    // спора нет — просто берём ту версию, над которой работали позже
    if ((tb.updatedAt || 0) > (mine.updatedAt || 0)){
      const copy = bumpRev(JSON.parse(JSON.stringify(tb)), mine, tb);
      copy.syncedAt = stamp; copy.pairMissing = false;
      DB.boards[idx] = copy; markBoardDirty(copy.id); stats.updated++;
    } else {
      mine.syncedAt = stamp; stats.kept++;
    }
  }

  // доски, которых в файле не оказалось: может быть, их удалили на другом
  // устройстве, а может быть — создали только здесь. Не гадаем и ничего не
  // трогаем, просто помечаем точкой, чтобы это было видно с первого взгляда
  DB.boards.forEach(b => {
    if (!theirIds.has(b.id) && (b.syncedAt || 0) < stamp){
      b.pairMissing = true;
      stats.marked++;
    }
  });

  saveDB();
  renderList();
  const parts = [];
  if (stats.added) parts.push('добавлено: ' + stats.added);
  if (stats.updated) parts.push('обновлено: ' + stats.updated);
  if (stats.kept) parts.push('оставлено своих: ' + stats.kept);
  if (stats.both) parts.push('сохранено обеих версий: ' + stats.both);
  if (stats.marked) parts.push('без пары (помечены точкой): ' + stats.marked);
  alert('Доски перенесены.\n' + (parts.join('\n') || 'изменений нет'));
  return stats;
}

function importAnyBoardsFile(file){
  const reader = new FileReader();
  reader.onload = async () => {
    let payload = null;
    try { payload = JSON.parse(reader.result); } catch (e) {}
    if (payload && payload.__kind === 'boards-archive'){
      try { await mergeArchive(payload); }
      catch (e) {
        // сюда приходим, если посреди переноса не прочиталась одна из своих
        // досок (окно сравнения версий) — часть досок из файла к этому
        // моменту уже добавлена. Повторная загрузка того же файла безопасна:
        // слияние идёт по id, уже перенесённое просто совпадёт
        console.error('[boards] перенос из файла прерван:', e);
        renderList();
        alert('Перенос прерван: не получилось прочитать одну из досок в памяти браузера. '
          + 'Часть досок из файла уже добавлена. Перезагрузите страницу и загрузите тот же файл ещё раз.');
      }
      return;
    }
    if (payload && payload.__kind === 'board-export' && payload.board){ importBoardPayload(payload.board); return; }
    alert('Не удалось прочитать файл — это не файл досок.');
  };
  reader.readAsText(file);
}

function importBoardPayload(src){
  if (!src || !Array.isArray(src.objects)){ alert('Файл доски испорчен.'); return; }
  const folderStillExists = src.folderId && DB.folders.some(f => f.id === src.folderId);
  const b = Object.assign({}, src, {
    id: uid(),
    folderId: folderStillExists ? src.folderId : null,
    createdAt: nowTs(), updatedAt: nowTs(), lastOpenedAt: null,
  });
  DB.boards.push(b);
  markBoardDirty(b.id);
  saveDB();
  renderList();
  alert(`Доска «${b.name}» загружена.`);
}
/* ───────── палитра — привязана к переменным темы, поэтому чернила
   остаются читаемыми что на светлой, что на тёмной бумаге ───────── */
const PALETTE = [
  { tok: '--pencil',  name: 'Чёрный/белый' },
  { tok: '--ink',     name: 'Синий' },
  { tok: '--teacher', name: 'Красный' },
  { tok: '--ok',      name: 'Зелёный' },
  { tok: '--moved',   name: 'Голубой' },
];
/* Промпт №54: значения переменных темы кэшируем. resolveColor зовётся на
   КАЖДЫЙ объект КАЖДЫЙ кадр (render → renderObject), и каждый вызов
   getComputedStyle(...).getPropertyValue стоил заметно: на доске из 2500
   штрихов в кадре это ~15% времени отрисовки. Переменные темы меняются только
   при смене темы, а она всегда идёт через атрибут data-theme (кнопка, системная
   тема, совместная сессия) — на него и сбрасываем кэш. */
const themeVarCache = new Map();
function themeVar(name){
  let v = themeVarCache.get(name);
  if (v === undefined) {
    v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    themeVarCache.set(name, v);
  }
  return v;
}
try {
  new MutationObserver(() => themeVarCache.clear())
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
} catch (e) {}
function resolveColor(tok){
  if (typeof tok === 'string' && tok.indexOf('--') === 0) return themeVar(tok) || '#000';
  return tok || '#000';
}
// canvas 2D context НЕ умеет резолвить CSS-переменные внутри строки font
// (в отличие от обычных DOM-элементов) — присвоение вида
// `ctx.font = fs+'px ' + UI_FONT_FAMILY` целиком отклоняется как
// невалидное и молча откатывается к дефолту canvas (`10px sans-serif`),
// из-за чего ЛЮБОЙ текст на канвасе (подписи листов, надписи углов,
// «Загрузка…» у картинок и, главное, сам инструмент «Текст») всегда
// рисовался и измерялся крошечным 10px шрифтом независимо от заданного
// размера. Резолвим переменную один раз здесь и везде подставляем уже
// готовое значение семейства шрифтов, а не саму переменную
const UI_FONT_FAMILY = getComputedStyle(document.documentElement).getPropertyValue('--font-ui').trim() || 'sans-serif';

/* ═══════════════════════════════════════════════════════════════════════
   ЭКРАН 1 — список папок и досок
   ═══════════════════════════════════════════════════════════════════════ */
const screenList = document.getElementById('screenList');
const screenBoard = document.getElementById('screenBoard');
let curFolderId = null;   // null = «Все доски» (корень), '__recent' = «Недавние», иначе id папки
let sortMode = 'new';     // 'my' | 'work' | 'new' | 'old' | 'az'
// 'my' — порядок, который пользователь выставил сам, перетаскивая карточки.
// Это просто порядок элементов в самих массивах DB.folders/DB.boards, поэтому
// он переживает перезагрузку вместе с досками и не требует отдельных полей.
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
      if (blSuppressClick) return;
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
  if (sortMode === 'my') return arr;   // как расставил пользователь — не трогаем
  // «по дате работы» — когда доску последний раз открывали или правили;
  // для повседневной работы это куда полезнее даты создания
  if (sortMode === 'work') arr.sort((a,b) => workedAt(b) - workedAt(a));
  else if (sortMode === 'new') arr.sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
  else if (sortMode === 'old') arr.sort((a,b) => (a.createdAt||0) - (b.createdAt||0));
  else arr.sort((a,b) => a.name.localeCompare(b.name, 'ru'));
  return arr;
}


/* ═══════════════════════════════════════════════════════════════════════
   Перетаскивание карточек в списке досок

   Как в проводнике: тянешь карточку левой кнопкой — она едет за курсором;
   бросаешь между двумя другими — встаёт туда; бросаешь доску на папку —
   попадает внутрь неё. Папки переставляются между папками, доски — между
   досками. Работает и пальцем на планшете: события указателя общие.

   Порядок хранится не отдельным полем, а самим порядком элементов в
   DB.folders / DB.boards, поэтому он сохраняется вместе с досками.
   ═══════════════════════════════════════════════════════════════════════ */
let blDragState = null;
let blSuppressClick = false;
const BL_DRAG_THRESHOLD = 5;   // px — меньше этого считаем обычным кликом

function ensureDragStyle(){
  if (document.getElementById('blDragStyle')) return;
  const st = document.createElement('style');
  st.id = 'blDragStyle';
  st.textContent = `
    .bl-card{ touch-action: manipulation; }
    .bl-card.bl-dragging{ opacity:.35; }
    .bl-drag-ghost{ position:fixed; z-index:9999; pointer-events:none; opacity:.92;
      transform:translate(-50%,-50%) rotate(-1.5deg); box-shadow:0 18px 40px rgba(0,0,0,.28);
      border-radius:16px; overflow:hidden; }
    .bl-card.bl-drop-into{ outline:2px solid var(--ink,#1b3b6f); outline-offset:2px;
      background:var(--hl-10, rgba(27,59,111,.10)); }
    .bl-nav-item.bl-drop-into{ outline:2px solid var(--ink,#1b3b6f); outline-offset:-2px; border-radius:10px; }
    .bl-drop-line{ position:fixed; z-index:9998; width:3px; border-radius:2px;
      background:var(--ink,#1b3b6f); pointer-events:none; }
  `;
  document.head.appendChild(st);
}

function blDropLine(){
  let el = document.getElementById('blDropLine');
  if (!el){
    el = document.createElement('div');
    el.id = 'blDropLine';
    el.className = 'bl-drop-line';
    document.body.appendChild(el);
  }
  return el;
}
function hideDropMarks(){
  const l = document.getElementById('blDropLine');
  if (l) l.style.display = 'none';
  document.querySelectorAll('.bl-drop-into').forEach(el => el.classList.remove('bl-drop-into'));
}

function blCardKind(card){ return card.dataset.folder ? 'folder' : 'board'; }

// куда именно упадёт карточка, если отпустить прямо сейчас
function resolveDropTarget(x, y){
  const el = document.elementFromPoint(x, y);
  if (!el) return null;

  // папка в левом списке разделов — «положить доску в эту папку»
  const nav = el.closest('.bl-nav-item');
  if (nav && blDragState.kind === 'board'){
    const v = nav.dataset.nav;
    if (v === '__recent') return null;
    return { type: 'into', folderId: v === '__root' ? null : v, el: nav };
  }

  const card = el.closest('.bl-card');
  if (!card || card === blDragState.card) return null;
  const kind = blCardKind(card);

  // доска на папку — внутрь папки
  if (blDragState.kind === 'board' && kind === 'folder'){
    return { type: 'into', folderId: card.dataset.folder, el: card };
  }
  // переставлять можно только среди своих: папки с папками, доски с досками
  if (kind !== blDragState.kind) return null;
  const r = card.getBoundingClientRect();
  const after = x > r.left + r.width / 2;
  return { type: 'reorder', card, after, rect: r };
}

function showDropTarget(t){
  hideDropMarks();
  if (!t) return;
  if (t.type === 'into'){ t.el.classList.add('bl-drop-into'); return; }
  const line = blDropLine();
  line.style.display = 'block';
  line.style.height = t.rect.height + 'px';
  line.style.top = t.rect.top + 'px';
  line.style.left = (t.after ? t.rect.right + 3 : t.rect.left - 6) + 'px';
}

// переставляем элемент в исходном массиве: видимый список может быть
// отфильтрован (папка, поиск), но порядок хранится в самом DB
function moveInArray(arr, id, targetId, after){
  const from = arr.findIndex(x => x.id === id);
  if (from < 0) return false;
  const [item] = arr.splice(from, 1);
  let to = arr.findIndex(x => x.id === targetId);
  if (to < 0) { arr.splice(from, 0, item); return false; }
  if (after) to += 1;
  arr.splice(to, 0, item);
  return true;
}

// состояние перетаскивания передаём явно: к моменту применения броска
// blDragState уже сброшен (перетаскивание закончилось), и брать данные
// оттуда нельзя — именно на этом сначала и споткнулись
function applyDrop(st, t){
  if (!t || !st) return false;
  const { id, kind } = st;
  if (t.type === 'into'){
    if (kind !== 'board') return false;
    const b = DB.boards.find(x => x.id === id);
    if (!b) return false;
    if ((b.folderId || null) === (t.folderId || null)) return false;
    b.folderId = t.folderId || null;
    touchBoard(b);
    return true;
  }
  const arr = kind === 'folder' ? DB.folders : DB.boards;
  const targetId = kind === 'folder' ? t.card.dataset.folder : t.card.dataset.board;
  if (!moveInArray(arr, id, targetId, t.after)) return false;
  // ручная расстановка имеет смысл только в своём порядке — переключаемся,
  // иначе список тут же пересортировался бы по дате и перестановка пропала
  if (sortMode !== 'my'){
    sortMode = 'my';
    DB.sortMode = 'my';
    const lbl = document.getElementById('blSortLabel');
    if (lbl && typeof sortLabels === 'object') lbl.textContent = sortLabels['my'] || 'Мой порядок';
  }
  return true;
}

function onCardPointerDown(e){
  if (e.button !== undefined && e.button !== 0) return;      // только левая кнопка
  if (e.target.closest('.bl-card-menu')) return;             // меню «⋯» — не перетаскивание
  const card = e.currentTarget;
  ensureDragStyle();
  blDragState = {
    card,
    kind: blCardKind(card),
    id: card.dataset.folder || card.dataset.board,
    startX: e.clientX, startY: e.clientY,
    moved: false, ghost: null, target: null,
    pointerId: e.pointerId,
  };
  try { card.setPointerCapture(e.pointerId); } catch (err) {}
  card.addEventListener('pointermove', onCardPointerMove);
  card.addEventListener('pointerup', onCardPointerUp);
  card.addEventListener('pointercancel', onCardPointerUp);
}

function onCardPointerMove(e){
  if (!blDragState || e.pointerId !== blDragState.pointerId) return;
  const dx = e.clientX - blDragState.startX, dy = e.clientY - blDragState.startY;
  if (!blDragState.moved){
    if (Math.hypot(dx, dy) < BL_DRAG_THRESHOLD) return;      // ещё не перетаскивание
    blDragState.moved = true;
    const card = blDragState.card;
    const r = card.getBoundingClientRect();
    const ghost = card.cloneNode(true);
    ghost.className = 'bl-card bl-drag-ghost';
    ghost.style.width = r.width + 'px';
    ghost.style.height = r.height + 'px';
    document.body.appendChild(ghost);
    blDragState.ghost = ghost;
    card.classList.add('bl-dragging');
    document.body.style.userSelect = 'none';
  }
  const g = blDragState.ghost;
  if (g){ g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px'; }
  blDragState.target = resolveDropTarget(e.clientX, e.clientY);
  showDropTarget(blDragState.target);
  e.preventDefault();
}

function onCardPointerUp(e){
  if (!blDragState || e.pointerId !== blDragState.pointerId) return;
  const st = blDragState;
  const card = st.card;
  card.removeEventListener('pointermove', onCardPointerMove);
  card.removeEventListener('pointerup', onCardPointerUp);
  card.removeEventListener('pointercancel', onCardPointerUp);
  try { card.releasePointerCapture(st.pointerId); } catch (err) {}
  card.classList.remove('bl-dragging');
  if (st.ghost) st.ghost.remove();
  hideDropMarks();
  document.body.style.userSelect = '';
  blDragState = null;

  if (!st.moved) return;                 // это был обычный клик — пусть откроется
  // после перетаскивания click всё равно прилетит — гасим его, иначе доска
  // открылась бы сразу после того, как её просто переставили
  blSuppressClick = true;
  setTimeout(() => { blSuppressClick = false; }, 0);

  if (e.type === 'pointercancel') return;
  if (applyDrop(st, st.target)){ saveDB(); renderList(); }
}

function initCardDnd(grid){
  ensureDragStyle();
  grid.querySelectorAll('.bl-card').forEach(card => {
    card.addEventListener('pointerdown', onCardPointerDown);
  });
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
        ${b.pairMissing ? `<span class="bl-pair-dot" title="При последнем переносе пары для этой доски не нашлось — возможно, её удалили на другом устройстве или она создана только здесь"></span>` : ''}
        <button class="bl-card-menu" data-menu="board:${b.id}">⋯</button>
        <div class="bl-card-icon">${boardIcon()}</div>
        <div class="bl-card-body">
          <div class="bl-card-name">${escHtml(b.name)}</div>
          <div class="bl-card-meta">Создана ${fmtDate(b.createdAt)}</div>
        </div>
      </div>`;
  });
  grid.innerHTML = html;

  initCardDnd(grid);   // перетаскивание карточек мышью

  grid.querySelectorAll('.bl-card[data-folder]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (blSuppressClick) return;
      if (e.target.closest('.bl-card-menu')) return;
      curFolderId = card.dataset.folder;
      searchQuery = ''; document.getElementById('blSearch').value = '';
      renderList();
    });
  });
  grid.querySelectorAll('.bl-card[data-board]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (blSuppressClick) return;
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
    ${kind==='board' ? `<button data-act="export">Экспортировать в файл</button>` : ''}
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
      if (name && name.trim()){ item.name = name.trim(); touchBoard(item); saveDB(); renderList(); }
    } else if (act === 'delete'){
      if (kind === 'folder'){
        const n = DB.boards.filter(b => b.folderId === id).length;
        if (!confirm(`Удалить папку и ${n} досок в ней? Это нельзя отменить.`)) return;
        DB.boards.filter(b => b.folderId === id).forEach(b => { noteDeleted('board', b.id); idbDelete(IDB_BOARD_PREFIX + b.id); });
        noteDeleted('folder', id);
        DB.boards = DB.boards.filter(b => b.folderId !== id);
        DB.folders = DB.folders.filter(f => f.id !== id);
      } else {
        if (!confirm('Удалить доску? Это нельзя отменить.')) return;
        noteDeleted('board', id);
        idbDelete(IDB_BOARD_PREFIX + id);   // отдельная запись доски — мусор без неё не подчистится сама
        DB.boards = DB.boards.filter(b => b.id !== id);
      }
      saveDB(); renderList();
    } else if (act === 'export'){
      const b = DB.boards.find(x => x.id === id);
      // доска могла быть ещё не подгружена в память (см. ensureBoardLoaded) —
      // без этого экспорт ушёл бы без штрихов и картинок
      if (b) ensureBoardLoaded(b).then(() => exportBoardToFile(b), alertBoardReadFailed);
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
document.getElementById('blExportAll').addEventListener('click', exportAllBoardsArchive);
document.getElementById('blSnapshots')?.addEventListener('click', openSnapshotsModal);
document.getElementById('blImportBoard').addEventListener('click', () => {
  const input = document.getElementById('blImportFile');
  input.value = ''; // сброс — иначе повторный выбор ТОГО ЖЕ файла не даст событие change
  input.click();
});
document.getElementById('blImportFile').addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  // одна кнопка на оба случая: и архив со всеми досками, и старый файл
  // одной доски — разбираемся по содержимому, а не по названию
  if (file) importAnyBoardsFile(file);
});
const sortLabels = { my: 'Мой порядок', work: 'По дате работы', new: 'Сначала новые', old: 'Сначала старые', az: 'По названию (А—Я)' };
document.getElementById('blSortBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('blSortPop').classList.toggle('open');
});
document.getElementById('blSortPop').addEventListener('click', (e) => {
  const s = e.target.dataset.sort;
  if (!s) return;
  sortMode = s;
  DB.sortMode = s; saveDB();          // выбор порядка тоже запоминаем
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
// Промпт №68: сколько экрана слева занято панелью тренажёров (открытой или
// свёрнутой в полосу) — холст начинается правее, cssW — ширина самого холста,
// а не окна (см. applyBoardInset)
let boardInset = 0;

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
/* ═══ Промпт №39: доска открывается там, где её закрыли ═══
   Раньше каждое открытие начиналось с центрального листа, и после занятия
   приходилось заново искать место, где работали. Теперь у доски есть
   запомненный вид (положение и масштаб). Сохраняем его отдельно от обычного
   saveDB(): тот отмечает доску как ИЗМЕНЁННУЮ, а прокрутка — не правка, и
   из-за неё не должны появляться расхождения при переносе досок между
   компьютерами и скакать сортировка «по дате работы». */
let viewSaveTimer = null;
function rememberView(){
  if (!B || !boardActive || !cssW || !cssH) return;
  B.view = { x: cam.x, y: cam.y, zoom: cam.zoom };
  clearTimeout(viewSaveTimer);
  viewSaveTimer = setTimeout(() => { idbSaveDB().catch(() => {}); }, 700);
}
/* ═══ Промпт №41: три уровня доступа к общей доске ═══
   «Полный доступ» — можно всё, как у владельца.
   «Только свои записи» — можно писать и править/стирать только то, что
      написал сам; чужое нельзя даже выделить.
   «Только просмотр» — видно всё, тронуть нельзя ничего.
   Уровень приходит из boards-cloud.js при открытии общей доски; на своих
   (необщих) досках он всегда «полный». */
let boardAccess = 'full';          // 'full' | 'own' | 'view'
let boardUserId = null;            // кто я — чтобы отличать свои записи от чужих
let knownObjIds = new Set();       // что уже лежало на доске до моих правок

window.setBoardAccess = function(access, userId){
  boardAccess = (access === 'own' || access === 'view') ? access : 'full';
  boardUserId = userId || null;
  document.documentElement.setAttribute('data-access', boardAccess);
  const note = document.getElementById('bdAccessNote');
  if (note) note.textContent = boardAccess === 'view'
    ? 'Только просмотр — рисовать на этой доске нельзя'
    : (boardAccess === 'own' ? 'Правится только то, что вы написали сами' : '');
  try { selectedId = null; multiSelectIds = []; clearEditLock(); updateContextMenu(); scheduleRedraw(); } catch (e) {}
};
window.getBoardAccess = function(){ return boardAccess; };
// объекты, пришедшие от собеседника, своими не считаются
window.boardsNoteForeignObjects = function(ids){ (ids || []).forEach(id => knownObjIds.add(id)); };
// а это — «подпиши всё моё прямо сейчас»: вызывается ПЕРЕД тем, как в доску
// вольют чужие изменения, иначе мой только что нарисованный штрих, ещё не
// успевший попасть в сохранение, оказался бы записан в чужие
window.boardsStampMine = function(){ stampAuthors(); };

function mayDraw(){ return boardAccess !== 'view'; }
// можно ли трогать конкретный объект — выделять, двигать, стирать
function mayTouch(obj){
  if (boardAccess === 'full') return true;
  if (boardAccess === 'view') return false;
  return !!(obj && boardUserId && obj.by === boardUserId);
}
/* Подпись авторства ставится при сохранении и только на объекты, которых
   раньше на доске не было: всё, что лежало до моего прихода (и всё, что
   прислал собеседник), остаётся чужим — иначе ученик, открыв доску,
   «присвоил» бы себе все записи учителя. */
function stampAuthors(){
  if (!boardUserId || !B || !Array.isArray(B.objects)) return;
  B.objects.forEach(o => { if (!o.by && !knownObjIds.has(o.id)) o.by = boardUserId; });
  knownObjIds = new Set(B.objects.map(o => o.id));
}

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
let curBold = false, curItalic = false, curUnderline = false, curStrike = false; // форматирование по умолчанию для следующего текста
let curBgTok = null;        // цвет фона по умолчанию для следующего текста (null — без фона)

let selectedId = null;
let multiSelectIds = [];     // групповое выделение рамкой (marquee) или по общему groupId
/* ═══ Промпт №38: буфер обмена, общий для ВСЕХ досок ═══
   Раньше «Скопировать»/«Вставить» жили в обычной переменной: закрыл вкладку —
   и скопированного больше нет, а «Вставить» вообще нельзя было нажать на
   пустой доске, потому что меню появляется только у выделения. Теперь буфер
   лежит в том же хранилище, что и сами доски: скопировал на одной доске —
   вставил на любой другой, хоть завтра, хоть в соседней вкладке. */
let clipboardObjs = null;    // что скопировано (в памяти — для мгновенной вставки)
let clipboardFrom = '';      // с какой доски скопировано — показываем в подсказке
const CLIP_KEY = 'clipboard';               // ключ в IndexedDB
const CLIP_PING = 'boardsClipboardPing';    // как соседние вкладки узнают об изменении

function updatePasteUI(){
  const btn = document.getElementById('railPaste');
  if (!btn) return;
  const n = clipboardObjs ? clipboardObjs.length : 0;
  btn.style.display = n ? '' : 'none';
  const tail = n % 10, hund = n % 100;
  const word = (tail === 1 && hund !== 11) ? 'объект'
             : (tail >= 2 && tail <= 4 && (hund < 12 || hund > 14)) ? 'объекта'
             : 'объектов';
  btn.title = n
    ? `Вставить ${n} ${word}` + (clipboardFrom ? ` с доски «${clipboardFrom}»` : '')
    : 'Вставить';
}
function setClipboard(objs, fromName){
  clipboardObjs = objs.map(o => JSON.parse(JSON.stringify(o)));
  clipboardFrom = fromName || '';
  updatePasteUI();
  // сохраняем рядом с досками; если вдруг не вышло (переполнение и т.п.) —
  // в этой вкладке буфер всё равно работает, просто не переживёт перезагрузку
  idbPut(CLIP_KEY, { objects: clipboardObjs, from: clipboardFrom, at: nowTs() })
    .then(() => { try { localStorage.setItem(CLIP_PING, String(Date.now())); } catch (e) {} })
    .catch(() => {});
}
function loadClipboard(){
  return idbGet(CLIP_KEY).then(saved => {
    if (saved && Array.isArray(saved.objects) && saved.objects.length){
      clipboardObjs = saved.objects;
      clipboardFrom = saved.from || '';
    }
    updatePasteUI();
  }).catch(() => {});
}
// скопировали в одной вкладке — вторая подхватывает тот же буфер
window.addEventListener('storage', (e) => { if (e.key === CLIP_PING) loadClipboard(); });
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
/* Промпт №50: НАЙДЕНА настоящая причина падений с почти мгновенным скачком
   памяти на несколько гигабайт (см. HANDOFF, раздел 10 — там же живой
   пример краша на ~6.3 ГБ). pushUndo() вызывается на КАЖДЫЙ штрих/перетаскивание
   и клал в undoStack ПОЛНУЮ копию всей доски целиком (JSON.stringify
   B.objects) — если у доски богатая история (например, общая доска,
   которой пользуются на каждом уроке месяцами, объекты в ней никогда не
   схлопываются и не чистятся), один такой снимок может весить десятки
   мегабайт, а стек хранит их до 60 штук ОДНОВРЕМЕННО — то есть до 60×
   вес доски единовременно висит в памяти. Именно поэтому доска, в которой
   давно никто ничего не трогал руками, спокойно открывалась (её просто
   читают), а падение случалось ровно в момент, когда начинали писать —
   на первом же pushUndo. Теперь общий вес истории отмены/повтора ограничен
   явным бюджетом байт, а не только количеством снимков: на лёгких досках
   поведение не меняется (60 снимков там весят копейки и лимит по счётчику
   срабатывает раньше лимита по байтам), а на тяжёлых стек становится
   короче 60, зато вкладка не падает. */
const UNDO_BYTES_BUDGET = 40 * 1024 * 1024;
let undoBytes = 0, redoBytes = 0;
function trimStackToBudget(stack, bytesRef){
  // bytesRef — объект-обёртка {v: число}, чтобы менять счётчик байт по ссылке
  while (stack.length > 1 && (stack.length > UNDO_LIMIT || bytesRef.v > UNDO_BYTES_BUDGET)) {
    bytesRef.v -= stack.shift().length;
  }
}
function pushUndo(){
  const snap = JSON.stringify(B.objects);
  undoStack.push(snap);
  const ref = { v: undoBytes + snap.length };
  trimStackToBudget(undoStack, ref);
  undoBytes = ref.v;
  redoStack.length = 0; redoBytes = 0;
}
function doUndo(){
  if (!mayDraw()) return;                             // Промпт №41
  if (!undoStack.length) return;
  const redoSnap = JSON.stringify(B.objects);
  redoStack.push(redoSnap);
  const rRef = { v: redoBytes + redoSnap.length };
  trimStackToBudget(redoStack, rRef);
  redoBytes = rRef.v;
  const popped = undoStack.pop();
  undoBytes -= popped.length;
  B.objects = JSON.parse(popped);
  selectedId = null; multiSelectIds = []; clearEditLock();
  updateContextMenu();
  scheduleRedraw(); saveDB();
}
function doRedo(){
  if (!mayDraw()) return;                             // Промпт №41
  if (!redoStack.length) return;
  const undoSnap = JSON.stringify(B.objects);
  undoStack.push(undoSnap);
  const uRef = { v: undoBytes + undoSnap.length };
  trimStackToBudget(undoStack, uRef);
  undoBytes = uRef.v;
  const popped = redoStack.pop();
  redoBytes -= popped.length;
  B.objects = JSON.parse(popped);
  selectedId = null; multiSelectIds = []; clearEditLock();
  updateContextMenu();
  scheduleRedraw(); saveDB();
}

function openBoard(id){
  const b = DB.boards.find(x => x.id === id);
  if (!b) return;
  // Промпт №47: у этой доски могут быть ещё не подгружены штрихи/картинки
  // (см. ensureBoardLoaded) — раньше это делалось для ВСЕХ досок сразу при
  // заходе на сайт; теперь только для той, что реально открывают
  ensureBoardLoaded(b).then(() => openBoardReady(b, id), alertBoardReadFailed);
}
function openBoardReady(b, id){
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
  // Промпт №39: открытие доски запоминает время последнего захода, но правкой
  // не является — пишем напрямую, минуя saveDB() с его отметкой «изменено»
  clearTimeout(saveTimer); saveTimer = null;
  idbSaveDB().catch(() => {});
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

  knownObjIds = new Set((B.objects || []).map(o => o.id));   // Промпт №41
  undoStack.length = 0; redoStack.length = 0; undoBytes = 0; redoBytes = 0; selectedId = null; multiSelectIds = [];
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
    // Промпт №39: если доска уже открывалась — возвращаемся ровно туда, где
    // работали в прошлый раз; проверяем числа на вменяемость, чтобы испорченная
    // запись не выкинула доску в пустоту (тогда просто открываем как раньше)
    const v = B.view;
    const sane = v && [v.x, v.y, v.zoom].every(n => typeof n === 'number' && isFinite(n))
                 && v.zoom >= ZOOM_MIN && v.zoom <= ZOOM_MAX;
    if (sane) {
      cam.zoom = v.zoom; cam.x = v.x; cam.y = v.y;
    } else {
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
    }
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
  rememberView();
  clearTimeout(viewSaveTimer); viewSaveTimer = null;
  boardActive = false;
  screenBoard.style.display = 'none';
  screenList.style.display = 'flex';
  location.hash = '';
  // Промпт №39: записываем сразу, но НЕ через saveDB() — он отмечает доску как
  // изменённую, а просто «зашёл и вышел» правкой не является: иначе при
  // переносе досок между компьютерами каждая открытая доска выглядела бы
  // спорной. Настоящие правки свою отметку уже поставили в момент правки.
  clearTimeout(saveTimer); saveTimer = null;
  // Промпт №48: доску, которую покидаем, выгружаем из памяти — но только
  // ПОСЛЕ того, как её собственная запись точно дописана на диск (ждём
  // idbSaveDB здесь, а не идём дальше сразу же), иначе при сбое записи
  // выгрузка удалит из памяти то, что ещё не успело сохраниться
  const leaving = B;
  idbSaveDB()
    .catch(() => false)
    // Промпт №54: idbSaveDB при сбое не бросает, а возвращает false — и
    // раньше доска выгружалась всё равно, унося из памяти несохранённые
    // штрихи. При сбое она остаётся подгруженной и «грязной»: следующее
    // сохранение попробует ещё раз, а «Выгрузить в файл» возьмёт её из памяти
    .then(ok => { if (ok !== false) unloadBoard(leaving); });
  renderList();
  if (window.onBoardClosed) window.onBoardClosed();
}
document.getElementById('bdBack').addEventListener('click', (e) => {
  // средняя кнопка (колёсико), Ctrl/⌘+клик, Shift+клик — стандартные способы
  // открыть ссылку в новой вкладке/окне; здесь их не перехватываем и отдаём
  // браузеру. Только обычный левый клик без модификаторов остаётся быстрым
  // переходом внутри приложения, без перезагрузки страницы
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  backToList();
});
document.getElementById('bdName').addEventListener('input', (e) => {
  if (!B) return;
  B.name = e.target.value || 'Доска без названия';
  document.title = B.name + ' — Доски';
  saveDB();
});

/* ── подгонка размера холста под окно ── */
function resizeCanvas(){
  dpr = Math.max(1, window.devicePixelRatio || 1);
  cssW = Math.max(1, window.innerWidth - boardInset); cssH = window.innerHeight;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  clampCam();
  scheduleRedraw();
}
window.addEventListener('resize', () => {
  // сначала отступ под панель тренажёров (на узком экране она ложится поверх
  // доски, на широком — рядом), потом уже размер холста
  if (typeof applyBoardInset === 'function') applyBoardInset();
  if (boardActive) resizeCanvas();
  if (rfVisible()) rfResizeCanvas();
});

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
  rememberView();
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
  requestAnimationFrame(() => {
    redrawScheduled = false;
    if (!boardActive) return;
    render(ctx, cssW, cssH, cam, true);
    syncTextEditorToCam();
    syncTaskOverlays();   // Промпт №66
  });
}
// открытое поле редактирования текста «приклеено» к своей мировой точке —
// пересчитываем его экранные координаты и размер шрифта на каждый кадр,
// пока камера (панорамирование/зум/ресайз окна) двигается
function syncTextEditorToCam(){
  if (!textEditSession) return;
  const { wrap, worldPt } = textEditSession;
  const scr = worldToScreen(worldPt);
  const r = canvas.getBoundingClientRect();
  wrap.style.left = Math.round(r.left + scr.x) + 'px';
  wrap.style.top = Math.round(r.top + scr.y) + 'px';
  applyTextEditorLiveStyle();
}
// растягивает textarea точно по содержимому (ширина и высота), без переноса
// строк — canvas ниже тоже никогда не переносит текст сам, только по явным
// «\n»; если разрешить textarea переноситься по своей ширине, то, что видно
// при наборе (несколько коротких визуальных строк), разойдётся с финальным
// рендером на доске (одна длинная строка) — из-за этого итоговый текст и
// выглядел «не тем, что было при редактировании»
function autoGrowTextarea(ta){
  ta.style.width = '0px';
  ta.style.height = '0px';
  const sw = ta.scrollWidth, sh = ta.scrollHeight;
  ta.style.width = Math.max(24, sw) + 'px';
  ta.style.height = Math.max(20, sh) + 'px';
}
// единая точка, где живые данные редактируемого текста (размер, цвет, фон,
// начертание) превращаются в то, что видно в textarea — используется и при
// открытии поля, и при каждом изменении в панели инструментов, и на каждом
// кадре синхронизации с камерой (syncTextEditorToCam), поэтому то, что
// видно во время редактирования, ВСЕГДА совпадает с тем, что будет
// сохранено в объект при подтверждении (WYSIWYG)
function applyTextEditorLiveStyle(){
  if (!textEditSession) return;
  const s = textEditSession;
  const fs = s.fontSize || curFontSize || 22;
  s.textarea.style.fontSize = Math.max(4, fs * cam.zoom) + 'px';
  s.textarea.style.fontWeight = s.bold ? '700' : '400';
  s.textarea.style.fontStyle = s.italic ? 'italic' : 'normal';
  const deco = [];
  if (s.underline) deco.push('underline');
  if (s.strike) deco.push('line-through');
  s.textarea.style.textDecoration = deco.length ? deco.join(' ') : 'none';
  s.textarea.style.color = resolveColor(s.color);
  s.textarea.style.background = s.bg ? resolveColor(s.bg) : '';
  autoGrowTextarea(s.textarea);
}

/* доска — сплошное полотно: одна заливка «бумаги» на весь мир (0..totalW,
   0..totalH), поверх — мелкая рабочая сетка и чуть более заметные, но
   всё равно полупрозрачные линии на границах листов формата А4. Линии
   считаются только в видимой части экрана — иначе на сетке 200×200
   листов пришлось бы каждый кадр перебирать десятки тысяч линий. */
function drawSheetsAndGrid(c, camv, w, h){
  // свой цвет клетки (настройки листа) — если не выбран, берём цвет по теме
  const gridColor = B.gridColor ? resolveColor(B.gridColor) : themeVar('--grid');
  const paperColor = themeVar('--paper');
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
    c.font = Math.max(8, Math.min(B.cellSize*0.6, B.cellSize) * camv.zoom) + 'px ' + UI_FONT_FAMILY;
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
    c.fillStyle = themeVar('--glass-strong') || '#eee';
    roundRectPath(c, p0.x, p0.y, w, h, 8);
    c.fill();
    c.fillStyle = themeVar('--muted-2') || '#888';
    c.font = '13px ' + UI_FONT_FAMILY; c.textAlign='center'; c.textBaseline='middle';
    c.fillText('Загрузка…', p0.x + w/2, p0.y + h/2);
  }
  // Промпт №66: на экране ответ показывают живые элементы поверх картинки,
  // а в выгрузку (PNG/PDF рисуются своей камерой) их не попадает — там
  // рисуем введённое и отметки прямо на холсте
  if (obj.task && activeCam !== cam) drawTaskStateForExport(c, obj, p0.x, p0.y, w, h);
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
    c.font = (obj.italic?'italic ':'') + (obj.bold?'700 ':'') + fs + 'px ' + UI_FONT_FAMILY;
    c.textAlign = 'left'; c.textBaseline = 'top';
    const lineH = fs * 1.25;
    if (obj.bg){
      c.save();
      c.fillStyle = resolveColor(obj.bg);
      c.fillRect(p.x, p.y, (obj.w||0)*camv.zoom, (obj.h||0)*camv.zoom);
      c.restore();
    }
    c.fillStyle = color;
    (obj.content || '').split('\n').forEach((line, i) => {
      const ly = p.y + i*lineH;
      c.fillText(line, p.x, ly);
      if (obj.underline || obj.strike){
        const lw = c.measureText(line).width;
        c.save();
        c.strokeStyle = color;
        c.lineWidth = Math.max(1, fs*0.06);
        if (obj.underline){ const uy = ly + fs*0.92; c.beginPath(); c.moveTo(p.x, uy); c.lineTo(p.x+lw, uy); c.stroke(); }
        if (obj.strike){ const sy = ly + fs*0.55; c.beginPath(); c.moveTo(p.x, sy); c.lineTo(p.x+lw, sy); c.stroke(); }
        c.restore();
      }
    });
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
  c.font = (13*Math.max(0.7,Math.min(1.4,camv.zoom))) + 'px ' + UI_FONT_FAMILY;
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
  c.fillStyle = themeVar('--ink');
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
  const bg = themeVar('--bg');
  c.fillStyle = bg; c.fillRect(0,0,w,h);
  c.restore();

  c.save();
  c.setTransform(renderDpr,0,0,renderDpr,0,0);
  drawSheetsAndGrid(c, camv, w, h);
  // раньше рисовали ВСЕ объекты доски на каждый кадр, даже те, что на других
  // страницах далеко за пределами экрана — при доске из десятков рисунков
  // это означало сотни лишних c.stroke()/fillText() на каждое движение пера.
  // Отсекаем по прямоугольнику видимой области (с небольшим запасом, чтобы
  // объект не мигал у самого края) — рисуем только то, что реально попадает в кадр
  const cullPad = 80 / camv.zoom;
  const visMinX = camv.x - cullPad, visMinY = camv.y - cullPad;
  const visMaxX = camv.x + w / camv.zoom + cullPad, visMaxY = camv.y + h / camv.zoom + cullPad;
  B.objects.forEach(o => {
    const b = objectBBox(o);
    if (b.maxX < visMinX || b.minX > visMaxX || b.maxY < visMinY || b.minY > visMaxY) return;
    renderObject(c, o, camv);
  });
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
  c.strokeStyle = themeVar('--ink');
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
  ctx.font = (obj.italic?'italic ':'') + (obj.bold?'700 ':'') + fs + 'px ' + UI_FONT_FAMILY;
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

  const wrap = document.createElement('div');
  wrap.className = 'bd-text-editor';

  const ta = document.createElement('textarea');
  ta.className = 'bd-text-editor-input';
  ta.value = existingObj ? existingObj.content : '';
  ta.placeholder = 'Текст…';
  ta.setAttribute('wrap', 'off'); // без авто-переноса — canvas тоже не переносит текст сам, только по «\n» (см. autoGrowTextarea)
  ta.spellcheck = false;

  const btns = document.createElement('div');
  btns.className = 'bd-text-editor-btns';
  const okBtn = document.createElement('button');
  okBtn.type = 'button'; okBtn.className = 'bd-text-editor-ok'; okBtn.title = 'Подтвердить'; okBtn.textContent = '\u2713';
  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button'; cancelBtn.className = 'bd-text-editor-cancel'; cancelBtn.title = 'Отмена'; cancelBtn.textContent = '\u2715';
  btns.appendChild(okBtn); btns.appendChild(cancelBtn);

  wrap.appendChild(ta); wrap.appendChild(btns);
  document.body.appendChild(wrap);

  textEditSession = {
    objId: existingObj ? existingObj.id : null, isNew, worldPt: p, textarea: ta, wrap,
    fontSize: (existingObj ? existingObj.fontSize : curFontSize) || 22,
    bold: existingObj ? !!existingObj.bold : curBold,
    italic: existingObj ? !!existingObj.italic : curItalic,
    underline: existingObj ? !!existingObj.underline : curUnderline,
    strike: existingObj ? !!existingObj.strike : curStrike,
    color: existingObj ? existingObj.color : curColorTok,
    bg: existingObj ? (existingObj.bg || null) : curBgTok,
    locked: existingObj ? !!existingObj.locked : false,
  };

  // позиционируем и применяем начальный вид (размер/начертание/цвет/фон) —
  // тем же кодом, который потом синхронизирует поле на каждом кадре, пока
  // двигается камера, так что расхождений между «во время» и «после» нет
  syncTextEditorToCam();
  openTextEditToolbar();

  // клик по самим кнопкам не должен раньше времени увести фокус с textarea
  // (иначе сработал бы blur ниже и вызвал confirm ещё до клика по кнопке)
  okBtn.addEventListener('mousedown', (e) => e.preventDefault());
  cancelBtn.addEventListener('mousedown', (e) => e.preventDefault());
  okBtn.addEventListener('click', () => confirmTextEditor());
  cancelBtn.addEventListener('click', () => cancelTextEditor());
  // клик куда угодно ещё (по доске, по панели инструментов...) — считаем
  // подтверждением, как только поле теряет фокус. Кнопки новой панели
  // редактирования (над доком) гасят mousedown централизованно (см. optbar
  // ниже) и поэтому фокус не отнимают — сюда «естественный» blur прилетает
  // только от кликов ПО-НАСТОЯЩЕМУ мимо (холст, другой инструмент и т.п.)
  ta.addEventListener('blur', () => { if (textEditSession) confirmTextEditor(); });
  ta.addEventListener('input', () => autoGrowTextarea(ta));
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
  const s = textEditSession;
  // снимаем сессию ДО удаления поля из DOM — удаление сфокусированного
  // textarea может само по себе синхронно вызвать 'blur' (см. обработчик
  // выше), и без этого confirmTextEditor() вызвался бы повторно, вложенно
  textEditSession = null;
  closeTextEditToolbar();
  const value = s.textarea.value;
  s.wrap.remove();
  if (!value || !value.trim()) return; // пустой текст — ничего не создаём и не сохраняем
  const fields = { color: s.color, fontSize: s.fontSize, bold: s.bold, italic: s.italic, underline: s.underline, strike: s.strike, bg: s.bg, locked: s.locked };
  if (s.isNew){
    const obj = Object.assign({ id: uid(), type:'text', points:[s.worldPt], content: value }, fields);
    if (curOpacity) obj.opacity = SEMI_OPACITY;
    measureTextObj(obj);
    commitObject(obj);
  } else {
    const obj = B.objects.find(o=>o.id===s.objId);
    if (obj){
      pushUndo();
      obj.content = value;
      Object.assign(obj, fields);
      measureTextObj(obj);
      saveDB(); scheduleRedraw();
    }
  }
}

function cancelTextEditor(){
  if (!textEditSession) return;
  const { wrap } = textEditSession;
  textEditSession = null; // тот же порядок, что и в confirmTextEditor — на случай синхронного blur при remove()
  closeTextEditToolbar();
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
    } else if (hit && hit.type === 'image' && hit.isFormula){
      armedHandId = null; selectedId = hit.id;
      openFormulaEditor(hit);
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
  // Промпт №41: чужой объект просто «не ловится» — ни ластиком, ни выделением,
  // ни за ручки. Одна проверка закрывает сразу все способы его тронуть.
  if (!mayTouch(obj)) return false;
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
  const sel = getSelectedObjects().filter(mayTouch);   // Промпт №41
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

  // Промпт №41: «только просмотр» — доску можно листать, но не менять
  if (!mayDraw()){
    e.preventDefault(); dragMode='pan'; panStart={x:e.clientX,y:e.clientY};
    camStart={x:cam.x,y:cam.y}; canvas.style.cursor='grabbing'; return;
  }

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
    let hitText = null;
    for (let i=B.objects.length-1;i>=0;i--){
      if (B.objects[i].type === 'text' && hitTestObject(B.objects[i], pt, 8/cam.zoom)){ hitText = B.objects[i]; break; }
    }
    if (hitText){ selectedId = hitText.id; openTextEditor(hitText, null); }
    else openTextEditor(null, maybeSnap(pt));
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
    scheduleRedraw(); rememberView(); return;
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
      if (!mayTouch(o)) return false;               // Промпт №41
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
  // Промпт №54: на тачпаде Mac это основной способ двигать доску, а вид
  // запоминался только при перетаскивании и масштабе — при падении вкладки
  // доска открывалась не там, где закончили (rememberView сам с паузой)
  rememberView();
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
optbar.addEventListener('mousedown', (e) => { if (e.target.closest('button')) e.preventDefault(); });
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
    if (textEditSession) confirmTextEditor(); // смена инструмента во время редактирования текста — подтверждаем, как и при клике мимо (уже восстановит панель через closeTextEditToolbar)
    applyOptbarForTool();
    updateCursor();
    rfUpdateCursor();
  });
});
// обычное состояние доп. панели инструментов — набор полей/переключателей
// зависит от выбранного ИНСТРУМЕНТА. Вынесено отдельной функцией, чтобы её
// же можно было позвать при ЗАКРЫТИИ панели редактирования текста (та
// показывается не по инструменту, а по факту открытой сессии редактирования
// — см. openTextEditToolbar/closeTextEditToolbar ниже)
function applyOptbarForTool(){
  optbar.classList.toggle('open', TOOLS_WITH_OPTS.includes(tool));
  optbar.classList.remove('text-editing');
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
}
// состояние доп. панели ПОКА АКТИВНА сессия редактирования текста — полная
// панель форматирования (f(x), Ж/К/Ч/З, Aa+размер, цвет текста/фона,
// замок), НАД основным доком, независимо от того, каким инструментом
// («рука» через двойной клик или «текст») редактирование было открыто
function openTextEditToolbar(){
  optbar.classList.add('open');
  optbar.classList.add('text-editing');
  document.getElementById('bdFontSizeField').style.display = 'flex';
  document.querySelector('.bd-width').style.display = 'none';
  document.getElementById('toggleDash').style.display = 'none';
  document.getElementById('toggleFill').style.display = 'none';
  document.getElementById('bdRadiusField').style.display = 'none';
  document.getElementById('toggleArrowEnd').style.display = 'none';
  document.getElementById('toggleArrowBoth').style.display = 'none';
  document.getElementById('fontSizeVal').textContent = (textEditSession && textEditSession.fontSize) || curFontSize;
  layoutOptbar();
  layoutRefPanel();
  renderBgSwatches();
  updateTextFmtButtons();
}
function closeTextEditToolbar(){
  applyOptbarForTool();
}

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
let trainersInsertOffset = 0;  // запасной каскад, если свободного места на экране нет совсем
let trainersOpenHref = null;   // адрес открытого тренажёра — для «ещё такое же» (промпт №68)
const trainersCollapseBtn = document.getElementById('bdTrainersCollapse');
const trainersStripEl = document.getElementById('bdTrainersStrip');
const trainersStripText = document.getElementById('bdTrainersStripText');

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
  trainersOpenHref = href;
  trainersInsertOffset = 0;
  trainersTitleEl.textContent = name;
  trainersStripText.textContent = name;
  trainersBackBtn.style.display = '';
  trainersPanelEl.classList.add('bd-trainers-in-frame');
  trainersIframe.src = href;
  hideTrainersToast();
}
function closeTrainerFrame(){
  trainersOpenId = null;
  trainersOpenHref = null;
  trainersTitleEl.textContent = 'Тренажёры';
  trainersStripText.textContent = 'Тренажёры';
  trainersBackBtn.style.display = 'none';
  trainersPanelEl.classList.remove('bd-trainers-in-frame');
  trainersIframe.src = 'about:blank';
}
trainersBackBtn.addEventListener('click', closeTrainerFrame);

/* ── Промпт №68: открыть / свернуть / закрыть ──
   Три состояния панели: открыта; свёрнута в узкую полосу у левого края
   (тренажёр в кадре живёт дальше — выбранный тип, уровень, набранное
   остаются, развернуть — один клик по полосе); закрыта совсем (крестик —
   как раньше: тренажёр тоже не выгружается, открыть можно кнопкой в
   верхней панели). Кадр при сворачивании не трогаем вовсе: display:none у
   предка iframe страницу внутри не перезагружает. */
function trainersPanelIsOpen(){ return trainersPanelEl.classList.contains('open'); }
function setTrainersPanel(state){          // 'open' | 'collapsed' | 'closed'
  trainersPanelEl.classList.toggle('open', state === 'open');
  trainersToggleBtn.classList.toggle('active', state === 'open');
  trainersStripEl.classList.toggle('show', state === 'collapsed');
  applyBoardInset();
}
trainersToggleBtn.addEventListener('click', () => {
  if (!trainersPanelIsOpen()) setTrainersPanel('open');
  // повторное нажатие сворачивает, если в панели открыт тренажёр (его
  // незачем терять), и закрывает, если там просто список
  else setTrainersPanel(trainersOpenId ? 'collapsed' : 'closed');
});
trainersCollapseBtn.addEventListener('click', () => setTrainersPanel('collapsed'));
trainersStripEl.addEventListener('click', () => setTrainersPanel('open'));
trainersCloseBtn.addEventListener('click', () => setTrainersPanel('closed'));

/* ── отступ доски под панель ──
   На широком экране панель встаёт РЯДОМ с доской: холст, левая панель
   инструментов (масштаб, скриншот…), нижний док и полоса настроек сдвигаются
   вправо на её ширину (CSS-переменная --bd-inset, см. boards.html), и
   кнопки масштаба работают по центру оставшейся части. Раньше панель лежала
   поверх и закрывала собой левую колонку инструментов. На узком экране
   (телефон) места рядом нет — там панель по-прежнему поверх доски, а
   свернуть её можно в полосу.
   Состояние панели читаем с самого элемента, а не из setTrainersPanel:
   класс open ставят и в других местах (тесты, будущие кнопки) — наблюдатель
   ниже ловит любое изменение. */
const BOARD_INSET_MIN_SCREEN = 700;
const screenBoardEl = document.getElementById('screenBoard');
function computeBoardInset(){
  if (trainersPanelIsOpen()){
    if (window.innerWidth < BOARD_INSET_MIN_SCREEN) return 0;
    return Math.round(trainersPanelEl.getBoundingClientRect().width);
  }
  return trainersStripEl.classList.contains('show') ? Math.round(trainersStripEl.getBoundingClientRect().width || 30) : 0;
}
function applyBoardInset(){
  // полоса нужна, только пока панель свёрнута — открытие любым путём её прячет
  if (trainersPanelIsOpen()) trainersStripEl.classList.remove('show');
  const next = computeBoardInset();
  if (next === boardInset) return;
  const d = next - boardInset;
  boardInset = next;
  screenBoardEl.style.setProperty('--bd-inset', next + 'px');
  if (B && boardActive){
    // то, что было на экране, остаётся на месте: холст съехал вправо на d,
    // камера — на столько же. Иначе при каждом открытии панели доска
    // прыгала бы вбок. Вид при этом не запоминаем — это не прокрутка
    cam.x += d / cam.zoom;
    resizeCanvas();
    updateContextMenu();
  }
}
new MutationObserver(applyBoardInset).observe(trainersPanelEl, { attributes: true, attributeFilter: ['class', 'style'] });
if (window.ResizeObserver) new ResizeObserver(() => applyBoardInset()).observe(trainersPanelEl);

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
    // рядом с панелью доске нужно хотя бы 300 px (см. applyBoardInset)
    const maxW = window.innerWidth - (window.innerWidth >= BOARD_INSET_MIN_SCREEN ? 300 : 80);
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
// Промпт №66: если у задания известен ответ (task — см. trainerTaskInfo),
// снимок делается с «чистого» клона (без введённого ответа, подсветки и
// разбора) и в том же клоне замеряются поле ответа, варианты и кнопка
// «Проверить» — поверх этих мест на доске лягут живые элементы. Замер именно
// в клоне, а не на живой странице: чистка клона меняет вёрстку (прячется
// разбор), и координаты с живой страницы съехали бы. Возвращает
// { dataUrl, hot } — hot === null, если задание не интерактивное.
async function captureTrainerNode(el, task){
  if (typeof html2canvas !== 'function') throw new Error('html2canvas not loaded');
  const doc = el.ownerDocument;
  const win = doc.defaultView;
  const bg = win ? win.getComputedStyle(doc.body).backgroundColor : '';
  const bgColor = (bg && bg !== 'rgba(0, 0, 0, 0)') ? bg : '#ffffff';
  const scale = Math.min(2, window.devicePixelRatio || 1);
  let hot = null;
  const mark = task ? 'c' + uid() : null;
  if (mark) el.setAttribute('data-bd-cap', mark);
  // html2canvas старается разобрать все стили страницы, в том числе внешние
  // (шрифты с Google Fonts и т.п.) — если у ученика/учителя в этот момент
  // плохая сеть, разбор может надолго зависнуть; ограничиваем снимок по
  // времени, чтобы кнопка не осталась «залипшей», а показывалась понятная
  // ошибка и можно было попробовать ещё раз
  const canvasPromise = html2canvas(el, {
    backgroundColor: bgColor,
    scale,
    useCORS: true,
    onclone: mark ? (cloneDoc) => {
      const c = cloneDoc.querySelector('[data-bd-cap="' + mark + '"]');
      if (c) hot = prepareTaskClone(c, task);
    } : undefined,
  });
  const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('capture timeout')), 20000));
  let canvas;
  try { canvas = await Promise.race([canvasPromise, timeoutPromise]); }
  finally { if (mark) el.removeAttribute('data-bd-cap'); }
  if (task && hot) {
    // html2canvas берёт размер холста не всегда по той же рамке, что
    // getBoundingClientRect в клоне (у столбиков холст уже рамки узла) —
    // доли пересчитываем к настоящему размеру снимка
    const cw = canvas.width / scale, ch = canvas.height / scale;
    const kx = hot.w / cw, ky = hot.h / ch;
    if (Math.abs(kx - 1) > 0.01 || Math.abs(ky - 1) > 0.01) {
      const fix = r => r && ({ x: r.x * kx, y: r.y * ky, w: r.w * kx, h: r.h * ky });
      hot.fields = hot.fields.map(fix); hot.opts = hot.opts.map(fix); hot.check = fix(hot.check);
    }
    hot.w = cw; hot.h = ch;
  }
  if (task && hot && hot.fields.length && hot.style) {
    // фон поля в тренажёре полупрозрачный (стекло поверх панели) — живое
    // поле с тем же rgba просвечивало бы нарисованный под ним «?». Берём
    // готовый цвет пикселя со снимка у левого края поля, внутри рамки
    try {
      const f = hot.fields[0];
      const px = canvas.getContext('2d').getImageData(
        Math.round((f.x * hot.w + 6) * scale), Math.round((f.y + f.h / 2) * hot.h * scale), 1, 1).data;
      hot.style.inBg = 'rgb(' + px[0] + ',' + px[1] + ',' + px[2] + ')';
    } catch (e) {}
  }
  if (task && hot) {
    // чего на снимке не нашлось (у ЕГЭ снимается одно условие, у столбиков —
    // сам пример), то дорисовываем строкой ниже: подпись, поле, кнопка
    const baked = bakeTaskRows(canvas, task, hot, bgColor, scale);
    if (baked) { canvas = baked.canvas; hot = baked.hot; }
  }
  return { dataUrl: canvas.toDataURL('image/png'), hot: (task && hot && hotIsUsable(task, hot)) ? hot : null };
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

/* ── Промпт №68: куда класть новое задание ──
   Раньше — в центр экрана с каскадом +28 на каждое следующее: задания
   ложились внахлёст, а при открытой поверх доски панели часть картинки
   пряталась под ней. Теперь ищем свободное место внутри того участка доски,
   который сейчас виден (с учётом прокрутки, масштаба, верхней панели, дока и
   панели тренажёров), — ближайшее к его центру. «Занято» — это другие
   картинки (задания): поверх рисунков и надписей класть можно, их легко
   подвинуть, а задание под заданием не видно вовсе. */
const TASK_GAP = 12;          // зазор между заданиями, в единицах доски
function taskObstacles(exceptId){
  if (!B || !Array.isArray(B.objects)) return [];
  const out = [];
  B.objects.forEach(o => {
    if (o.type !== 'image' || o.id === exceptId || !o.points || !o.points[0]) return;
    const bb = objectBBox(o);
    out.push({ x0: bb.minX, y0: bb.minY, x1: bb.maxX, y1: bb.maxY });
  });
  return out;
}
function rectHits(r, obs, gap){
  for (const o of obs){
    if (r.x < o.x1 + gap && r.x + r.w > o.x0 - gap && r.y < o.y1 + gap && r.y + r.h > o.y0 - gap) return o;
  }
  return null;
}
// видимый и не закрытый интерфейсом прямоугольник доски — в единицах доски
function visibleBoardRect(){
  // холст уже начинается правее панели (boardInset); на узком экране панель
  // лежит поверх холста — тогда её ширину вычитаем здесь
  const overlayW = (trainersPanelIsOpen() && !boardInset) ? trainersPanelEl.getBoundingClientRect().width : 0;
  const rail = document.getElementById('bdRail');
  const railW = (rail && rail.classList.contains('pos-left')) ? 64 : 12;
  const sx0 = Math.min(cssW - 80, overlayW + railW), sy0 = 62;
  const sx1 = Math.max(sx0 + 80, cssW - 16), sy1 = Math.max(sy0 + 80, cssH - 84);
  return { x: cam.x + sx0 / cam.zoom, y: cam.y + sy0 / cam.zoom, w: (sx1 - sx0) / cam.zoom, h: (sy1 - sy0) / cam.zoom };
}
// ближайшее к центру области свободное место (перебор по сетке), или null
function nearestFreeSpot(area, w, h, obs, cx, cy){
  const step = Math.max(8, 16 / cam.zoom);
  let best = null, bestD = Infinity;
  for (let x = area.x; x + w <= area.x + area.w + 0.01; x += step){
    for (let y = area.y; y + h <= area.y + area.h + 0.01; y += step){
      const d = (x + w / 2 - cx) ** 2 + (y + h / 2 - cy) ** 2;
      if (d >= bestD) continue;
      if (!rectHits({ x, y, w, h }, obs, TASK_GAP)){ best = { x, y, w, h }; bestD = d; }
    }
  }
  return best;
}
function findFreeSpotInView(w, h){
  const v = visibleBoardRect();
  const cx = v.x + v.w / 2, cy = v.y + v.h / 2;
  const obs = taskObstacles();
  const first = { x: cx - w / 2, y: cy - h / 2, w, h };
  if (!rectHits(first, obs, TASK_GAP)) return first;
  const inView = nearestFreeSpot(v, w, h, obs, cx, cy);
  if (inView) return inView;
  // на экране всё занято — ближайшее свободное место рядом с экраном;
  // камера потом подъедет к нему (revealWorldRect в insertTaskImage), чтобы
  // задание всё равно появилось на глазах, а не легло поверх другого
  const around = { x: v.x - v.w, y: v.y - v.h, w: v.w * 3, h: v.h * 3 };
  const near = nearestFreeSpot(around, w, h, obs, cx, cy);
  if (near) return near;
  // задание крупнее экрана или вокруг совсем тесно — в центр с каскадом
  const off = trainersInsertOffset; trainersInsertOffset += 28;
  return { x: cx - w / 2 + off, y: cy - h / 2 + off, w, h };
}

// рядом с заданием src, по направлению dir ('down'|'up'|'left'|'right'),
// вплотную (зазор TASK_GAP); если там уже лежит другое задание — отодвигаемся
// в том же направлении до первого свободного места
function findSpotBeside(src, w, h, dir){
  const bb = objectBBox(src);
  const obs = taskObstacles(src.id);
  let r;
  if (dir === 'up') r = { x: bb.minX, y: bb.minY - TASK_GAP - h, w, h };
  else if (dir === 'left') r = { x: bb.minX - TASK_GAP - w, y: bb.minY, w, h };
  else if (dir === 'right') r = { x: bb.maxX + TASK_GAP, y: bb.minY, w, h };
  else r = { x: bb.minX, y: bb.maxY + TASK_GAP, w, h };
  for (let guard = 0; guard < 500; guard++){
    const hit = rectHits(r, obs, TASK_GAP - 0.5);
    if (!hit) break;
    if (dir === 'up') r.y = hit.y0 - TASK_GAP - h;
    else if (dir === 'left') r.x = hit.x0 - TASK_GAP - w;
    else if (dir === 'right') r.x = hit.x1 + TASK_GAP;
    else r.y = hit.y1 + TASK_GAP;
  }
  return r;
}
// новое задание должно появиться на глазах: если оно вышло за край видимого
// участка — сдвигаем камеру ровно настолько, чтобы его стало видно целиком
function revealWorldRect(r){
  const v = visibleBoardRect();
  let dx = 0, dy = 0;
  if (r.w <= v.w){ if (r.x < v.x) dx = r.x - v.x; else if (r.x + r.w > v.x + v.w) dx = r.x + r.w - (v.x + v.w); }
  else dx = r.x - v.x;
  if (r.h <= v.h){ if (r.y < v.y) dy = r.y - v.y; else if (r.y + r.h > v.y + v.h) dy = r.y + r.h - (v.y + v.h); }
  else dy = r.y - v.y;
  if (!dx && !dy) return;
  cam.x += dx; cam.y += dy;
  clampCam(); scheduleRedraw(); rememberView();
}

// размер картинки задания на доске: предел крупнее, чем у обычной вставленной
// картинки (это не иллюстрация, а само задание — его читают и решают)
async function taskImageSize(dataUrl){
  const size = await loadImageSize(dataUrl);
  const maxDim = 520;
  let w = size.w, h = size.h;
  if (w > maxDim || h > maxDim){ const s = maxDim / Math.max(w, h); w *= s; h *= s; }
  return { w, h, natW: size.w, natH: size.h };
}

// вставка одной готовой картинки задания на доску — тот же формат объекта,
// что и у обычной вставленной картинки (см. imgModalInsert выше).
// place(w, h) → {x, y} — куда класть (по умолчанию — свободное место на экране)
async function insertTaskImage(dataUrl, task, gen, place){
  const sz = await taskImageSize(dataUrl);
  const spot = place ? place(sz.w, sz.h) : findFreeSpotInView(sz.w, sz.h);
  const pt = { x: spot.x, y: spot.y };
  // Промпт №66: задание с тренажёра сразу закреплено — ластиком его не
  // стереть и случайным касанием не сдвинуть (двигают его после двойного
  // клика, как любую закреплённую картинку; открепить — из меню)
  const obj = { id: uid(), type:'image', src: dataUrl, points:[pt], w: sz.w, h: sz.h, natW: sz.natW, natH: sz.natH, locked: true };
  if (task) obj.task = task;
  if (gen) obj.gen = gen;   // Промпт №68: из чего делать «ещё такое же»
  pushUndo();
  B.objects.push(obj);
  revealWorldRect({ x: pt.x, y: pt.y, w: sz.w, h: sz.h });
  return obj;
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
    const win = trainersIframe.contentWindow;
    for (const { el, restore } of nodes){
      try {
        // ответ читаем до снимка — пока на странице то же задание, что снимаем
        const info = trainerTaskInfo(win, trainersOpenId, el);
        const gen = trainerGenInfo(win, trainersOpenId, trainersOpenHref, el);
        const shot = await captureTrainerNode(el, info);
        await insertTaskImage(shot.dataUrl, (info && shot.hot) ? Object.assign({ v: 1 }, info, { hot: shot.hot }) : null, gen);
        added++;
        scheduleRedraw();   // каждое задание — на глазах, не дожидаясь остальных из пакета
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
    if (el.id === 'theoryContent') return null;
    const st = typeof win.tsGetState === 'function' ? plainCopy(win.tsGetState()) : null;
    if (!st) return null;
    if (trainerId === 'oge9'){
      // движки линейных и квадратных уравнений в №9 закрыты в своих функциях,
      // пример отдают через __boardLinP/__boardQuadP (oge9.html) — формы те же,
      // что у linear.html и quadratic.html
      if (el.id === 'live') return soloTaskInfo('linear', plainCopy(typeof win.__boardLinP === 'function' ? win.__boardLinP() : null));
      if (el.id === 'eqLine') return soloTaskInfo('quadratic', plainCopy(typeof win.__boardQuadP === 'function' ? win.__boardQuadP() : null));
    }
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
           | kind: 'engine', mode, lvl  // движки уравнений ОГЭ №9

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
function trainerGenInfo(win, tid, href, el){
  if (!win || !tid || !href || !el || el.id === 'theoryContent') return null;
  try {
    const base = { v: 1, tid, href, vw: Math.round(win.innerWidth || 0) || null };
    if (isEgeLikeTrainer(tid)){
      const card = el.closest ? el.closest('.added-task-card[data-idx]') : null;
      const n = trainerEval(win, 'S.n');
      const pid = trainerEval(win, card ? 'S.cards[' + Number(card.dataset.idx) + '].pid' : 'S.pid');
      if (n == null || pid == null) return null;
      return Object.assign(base, { kind: 'ege', n: Number(n), pid: String(pid) });
    }
    if (tid === 'oge9' && (el.id === 'live' || el.id === 'eqLine')){
      // пример движка живёт в замыкании, но уровень виден по кнопке уровней
      const st = typeof win.tsGetState === 'function' ? win.tsGetState() : null;
      const lvlBtn = el.ownerDocument.querySelector('#levels .lvl.active');
      const mode = (st && st.curMode) || (el.id === 'live' ? 'linear' : 'quadratic');
      return Object.assign(base, { kind: 'engine', mode, lvl: lvlBtn ? Number(lvlBtn.dataset.id) : null });
    }
    const api = win.__trainerState;
    const snap = stripTrainerSnap(api && api.get ? api.get() : (typeof win.tsGetState === 'function' ? win.tsGetState() : null));
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
async function genNewTaskInFrame(win, g){
  const doc = win.document;
  if (g.kind === 'ege'){
    win.eval('openTask(' + JSON.stringify(g.n) + ', pidAfter(' + JSON.stringify(g.pid) + ')); if (typeof render === "function") render();');
  } else if (g.kind === 'engine'){
    if (typeof win.openModeById !== 'function') throw new Error('нет openModeById');
    win.openModeById(g.mode);
    await genWait(150);
    if (g.lvl != null){
      const b = doc.querySelector('#levels .lvl[data-id="' + g.lvl + '"]');
      if (b && !b.classList.contains('active')) b.click();
      await genWait(80);
    }
    const rb = doc.getElementById('refreshBtn');
    if (!rb) throw new Error('нет кнопки нового примера');
    rb.click();
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

let genChain = Promise.resolve();   // по одному: кадр у тренажёра один
function makeSimilarTask(srcId, dir){
  const run = async () => {
    const src = taskObjById(srcId);
    if (!src || !src.gen || !B) throw new Error('нет задания');
    const g = src.gen;
    const boardAtStart = B;
    const frame = await genFrameFor(g.href, g.vw);
    const win = frame.contentWindow;
    await genNewTaskInFrame(win, g);
    const nodes = collectTrainerCaptureNodes(win.document, g.tid);
    const main = nodes.filter(n => n.el.id !== 'theoryContent' && !(n.el.closest && n.el.closest('.added-task-card')));
    nodes.forEach(n => { if (n !== main[0] && n.restore) n.restore(); });
    if (!main.length) throw new Error('в тренажёре не нашлось задания');
    const { el, restore } = main[0];
    try {
      const info = trainerTaskInfo(win, g.tid, el);
      const gen = trainerGenInfo(win, g.tid, g.href, el) || plainCopy(g);
      if (g.vw) gen.vw = g.vw;
      const shot = await captureTrainerNode(el, info);
      // пока снимали, могли уйти с доски или удалить исходное задание
      const srcNow = taskObjById(srcId);
      if (B !== boardAtStart || !srcNow) throw new Error('доска сменилась');
      const task = (info && shot.hot) ? Object.assign({ v: 1 }, info, { hot: shot.hot }) : null;
      const obj = await insertTaskImage(shot.dataUrl, task, gen, (w, h) => findSpotBeside(srcNow, w, h, dir));
      saveDB();
      scheduleRedraw();
      return obj;
    } finally {
      if (restore) restore();
    }
  };
  const p = genChain.then(run, run);
  genChain = p.catch(() => {});
  return p;
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
  meas.font = '600 ' + FONT + 'px ' + UI_FONT_FAMILY;
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
  c.fillStyle = bgColor; c.fillRect(0, 0, out.width, out.height);
  c.drawImage(canvas, 0, 0);
  c.scale(scale, scale);
  c.font = '600 ' + FONT + 'px ' + UI_FONT_FAMILY;
  c.textBaseline = 'middle';
  const frac = (x, y, w, h) => ({ x: x / totalW, y: y / totalH, w: w / totalW, h: h / totalH });
  const hot2 = { w: totalW, h: totalH, fields: [], opts: [], check: null, style: hot.style || {} };
  const box = (x, y, w, h, fill, stroke, r) => {
    c.beginPath(); roundRectPath(c, x, y, w, h, r || 10);
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

/* ── живые элементы поверх заданий ── */
const taskDrafts = new Map();   // id объекта → { vals: {fid: текст}, picks: [номера] }
const taskEls = new Map();      // id объекта → { root, sig, ... }
let taskLayerEl = null;
function taskLayer(){
  if (taskLayerEl) return taskLayerEl;
  const st = document.createElement('style');
  st.textContent = `
    /* Промпт №68: z-index:1 делает слой отдельным контекстом наложения. Без
       него z-index каждого задания (номер в B.objects, до сотен) спорил с
       интерфейсом на равных, и поле с «Проверить» вылезало поверх панели
       тренажёров (z 255), инструментов и окон. Теперь все живые элементы —
       сразу над холстом и под любой панелью */
    #bdTaskLayer{position:absolute;inset:0;left:var(--bd-inset,0px);z-index:1;pointer-events:none;overflow:hidden;}
    .bd-task{position:absolute;pointer-events:none;}
    .bd-task-in{position:absolute;box-sizing:border-box;pointer-events:auto;margin:0;padding:0 .35em;
      border:2px solid rgba(0,0,0,.2);background:#fff;color:#1c1c1e;text-align:center;outline:none;
      font-weight:600;font-family:inherit;font-size:inherit;line-height:1;min-width:0;}
    .bd-task-in:focus{border-color:var(--ink);}
    .bd-task-in.good{border-color:var(--ok)!important;background:rgba(36,138,61,.12)!important;color:var(--ok)!important;}
    .bd-task-in.bad{border-color:var(--teacher)!important;background:rgba(255,59,48,.10)!important;color:var(--teacher)!important;}
    .bd-task-btn{position:absolute;box-sizing:border-box;pointer-events:auto;margin:0;padding:0;border:none;
      background:var(--ink);color:#fff;font-weight:700;font-family:inherit;cursor:pointer;white-space:nowrap;overflow:hidden;}
    .bd-task-btn:disabled{filter:grayscale(.6) brightness(1.15);cursor:default;}
    .bd-task-opt{position:absolute;box-sizing:border-box;pointer-events:auto;margin:0;padding:0;cursor:pointer;
      background:transparent;border:2.5px solid transparent;border-radius:.45em;}
    .bd-task-opt:hover{background:rgba(46,125,224,.07);}
    .bd-task-opt.picked{border-color:var(--ink);background:rgba(46,125,224,.13);}
    .bd-task-opt.good{border-color:var(--ok);background:rgba(36,138,61,.18);}
    .bd-task-opt.bad{border-color:var(--teacher);background:rgba(255,59,48,.15);}
    .bd-task-opt.done{cursor:default;}
    .bd-task-reset{position:absolute;pointer-events:auto;width:24px;height:24px;border-radius:12px;border:none;
      background:var(--glass-strong);color:var(--pencil);box-shadow:0 1px 4px rgba(0,0,0,.25);font-size:14px;
      line-height:24px;padding:0;cursor:pointer;display:none;}
    .bd-task.answered .bd-task-reset{display:block;}
    .bd-task-msg{position:absolute;left:0;pointer-events:none;background:#1c1c1e;color:#fff;font-size:12.5px;
      padding:5px 9px;border-radius:8px;white-space:nowrap;opacity:0;transition:opacity .2s;}
    .bd-task-msg.show{opacity:.92;}
    .bd-task-more{position:absolute;left:calc(100% + 8px);top:18px;width:28px;height:28px;border-radius:14px;border:none;
      padding:0;pointer-events:auto;cursor:pointer;background:var(--glass-strong);color:var(--pencil);
      box-shadow:0 1px 5px rgba(0,0,0,.28);font-size:18px;font-weight:700;line-height:28px;opacity:.72;}
    .bd-task-more:hover,.bd-task-more.on{opacity:1;background:var(--ink);color:#fff;}
    .bd-task-more.busy{opacity:1;cursor:progress;animation:bdTaskBusy 1s linear infinite;}
    @keyframes bdTaskBusy{to{transform:rotate(360deg);}}
    .bd-task-dirs{position:absolute;left:calc(100% + 8px);top:52px;display:none;grid-template-columns:repeat(3,30px);
      grid-template-rows:repeat(3,30px);gap:3px;padding:6px;pointer-events:auto;border-radius:12px;
      background:var(--glass-strong);box-shadow:0 3px 14px rgba(0,0,0,.28);font-family:var(--font-ui);}
    .bd-task-dirs.open{display:grid;}
    .bd-task-dirs button{border:none;border-radius:8px;padding:0;cursor:pointer;background:var(--hover-1);
      color:var(--pencil);font-size:16px;font-weight:700;}
    .bd-task-dirs button:hover,.bd-task-dirs button:focus{background:var(--ink);color:#fff;outline:none;}
    .bd-task-dirs button.def{box-shadow:inset 0 0 0 2px var(--ink);}
    .bd-task-dirs .bd-task-dirs-mid{grid-area:2/2;display:flex;align-items:center;justify-content:center;
      font-size:9.5px;line-height:1.1;text-align:center;color:var(--muted-2);}
    [data-access="view"] .bd-task-more,[data-access="view"] .bd-task-dirs{display:none!important;}
    [data-access="view"] .bd-task-in,[data-access="view"] .bd-task-btn,
    [data-access="view"] .bd-task-opt,[data-access="view"] .bd-task-reset{pointer-events:none;}
  `;
  document.head.appendChild(st);
  taskLayerEl = document.createElement('div');
  taskLayerEl.id = 'bdTaskLayer';
  canvas.insertAdjacentElement('afterend', taskLayerEl);
  // колесо над полем или вариантом — всё равно масштаб/прокрутка доски
  taskLayerEl.addEventListener('wheel', (e) => {
    e.preventDefault();
    canvas.dispatchEvent(new WheelEvent('wheel', e));
  }, { passive: false });
  return taskLayerEl;
}
function taskObjById(id){ return B && Array.isArray(B.objects) ? B.objects.find(o => o.id === id) : null; }
function taskDraft(id){
  let d = taskDrafts.get(id);
  // picks === null — отметок ещё не трогали (берём их из последней проверки)
  if (!d){ d = { vals: {}, picks: null }; taskDrafts.set(id, d); }
  return d;
}
function taskPlace(elm, r){
  elm.style.left = (r.x * 100) + '%'; elm.style.top = (r.y * 100) + '%';
  elm.style.width = (r.w * 100) + '%'; elm.style.height = (r.h * 100) + '%';
}

function buildTaskOverlay(obj){
  const root = document.createElement('div');
  root.className = 'bd-task';
  root.dataset.id = obj.id;
  const rec = { root, inputs: [], opts: [], check: null, msg: null, sig: null };
  const id = obj.id;
  if (obj.gen) buildMoreButton(rec, id);
  // клик по живому элементу не должен начинать жест доски под ним
  root.addEventListener('pointerdown', (e) => e.stopPropagation());
  if (!obj.task || !obj.task.hot){
    const msg = document.createElement('div');
    msg.className = 'bd-task-msg';
    root.appendChild(msg);
    rec.msg = msg;
    taskLayer().appendChild(root);
    return rec;
  }
  const t = obj.task, hot = t.hot, sty = hot.style || {};
  if (sty.font) root.style.fontFamily = sty.font;
  if (t.kind === 'fields'){
    t.fields.forEach((f, i) => {
      const r = hot.fields[i]; if (!r) return;
      const inp = document.createElement('input');
      inp.type = 'text'; inp.className = 'bd-task-in'; inp.autocomplete = 'off'; inp.spellcheck = false;
      inp.setAttribute('inputmode', f.type === 'yesno' ? 'text' : 'decimal');
      inp.placeholder = '?';
      inp.dataset.fid = f.id;
      if (sty.inBg) inp.style.background = sty.inBg;
      if (sty.inFg) inp.style.color = sty.inFg;
      if (sty.inBorder) inp.style.borderColor = sty.inBorder;
      taskPlace(inp, r);
      inp.addEventListener('input', () => {
        taskDraft(id).vals[f.id] = inp.value;
        inp.classList.remove('bad');   // исправляет — красное снимаем, пока не проверит
      });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter'){ e.preventDefault(); taskCheck(id); } });
      root.appendChild(inp);
      rec.inputs.push(inp);
    });
  } else {
    hot.opts.forEach((r, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'bd-task-opt'; b.dataset.i = String(i);
      b.title = t.kind === 'multi' ? 'Отметить' : 'Выбрать этот вариант';
      taskPlace(b, r);
      b.addEventListener('click', () => taskPick(id, i));
      root.appendChild(b);
      rec.opts.push(b);
    });
  }
  if (hot.check && t.kind !== 'choice'){
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'bd-task-btn'; b.textContent = hot.checkText || 'Проверить';
    if (sty.btnBg) b.style.background = sty.btnBg;
    if (sty.btnFg) b.style.color = sty.btnFg;
    taskPlace(b, hot.check);
    b.addEventListener('click', () => taskCheck(id));
    root.appendChild(b);
    rec.check = b;
  }
  const reset = document.createElement('button');
  reset.type = 'button'; reset.className = 'bd-task-reset'; reset.textContent = '↺';
  reset.title = 'Стереть ответ и решать заново';
  reset.style.right = '-10px'; reset.style.top = '-10px';
  reset.addEventListener('click', () => taskReset(id));
  root.appendChild(reset);
  const msg = document.createElement('div');
  msg.className = 'bd-task-msg';
  root.appendChild(msg);
  rec.msg = msg;
  taskLayer().appendChild(root);
  return rec;
}

/* ── Промпт №68: кнопка «ещё такое же» и выбор, куда поставить ──
   По кнопке — крестик из четырёх стрелок; «вниз» выделена и в фокусе, так
   что Enter (или клик по ней) ставит новое задание вплотную под текущим. */
const DIR_ARROWS = { up: '↑', left: '←', right: '→', down: '↓' };
const DIR_AREAS = { up: '1/2', left: '2/1', right: '2/3', down: '3/2' };
const DIR_NAMES = { up: 'сверху', left: 'слева', right: 'справа', down: 'снизу' };
let openDirsRec = null;
function closeTaskDirs(){
  if (!openDirsRec) return;
  openDirsRec.dirs.classList.remove('open');
  openDirsRec.more.classList.remove('on');
  openDirsRec = null;
}
document.addEventListener('pointerdown', (e) => {
  if (openDirsRec && !openDirsRec.dirs.contains(e.target) && e.target !== openDirsRec.more) closeTaskDirs();
}, true);
function buildMoreButton(rec, id){
  const more = document.createElement('button');
  more.type = 'button'; more.className = 'bd-task-more'; more.textContent = '+';
  more.title = 'Ещё такое же задание (тот же тип и уровень)';
  const dirs = document.createElement('div');
  dirs.className = 'bd-task-dirs';
  const mid = document.createElement('div');
  mid.className = 'bd-task-dirs-mid'; mid.textContent = 'куда?';
  dirs.appendChild(mid);
  ['up', 'left', 'right', 'down'].forEach(dir => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.dir = dir; b.textContent = DIR_ARROWS[dir];
    b.title = 'Поставить ' + DIR_NAMES[dir] + (dir === 'down' ? ' (по умолчанию)' : '');
    b.style.gridArea = DIR_AREAS[dir];
    if (dir === 'down') b.classList.add('def');
    b.addEventListener('click', () => { closeTaskDirs(); runMoreTask(rec, id, dir); });
    dirs.appendChild(b);
  });
  dirs.addEventListener('keydown', (e) => {
    const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    if (map[e.key]){ e.preventDefault(); closeTaskDirs(); runMoreTask(rec, id, map[e.key]); }
    else if (e.key === 'Escape'){ e.preventDefault(); closeTaskDirs(); }
  });
  more.addEventListener('click', () => {
    if (more.classList.contains('busy')) return;
    if (openDirsRec === rec){ closeTaskDirs(); return; }
    closeTaskDirs();
    openDirsRec = rec;
    more.classList.add('on');
    dirs.classList.add('open');
    const def = dirs.querySelector('button.def');
    if (def) def.focus({ preventScroll: true });
  });
  rec.more = more; rec.dirs = dirs;
  rec.root.appendChild(more);
  rec.root.appendChild(dirs);
}
function runMoreTask(rec, id, dir){
  rec.more.classList.add('busy');
  rec.more.disabled = true;
  makeSimilarTask(id, dir)
    .catch(err => {
      console.error('[доска] «ещё такое же» не получилось', err);
      if (rec.msg && rec.root.isConnected) taskFlash(id, 'Не получилось сделать новое задание — попробуйте ещё раз');
    })
    .finally(() => { rec.more.classList.remove('busy'); rec.more.disabled = false; });
}

// привести живые элементы к состоянию объекта (после проверки, отмены,
// правки от собеседника)
function applyTaskState(rec, obj){
  if (!obj.task) return;
  const t = obj.task, st = t.st || null, d = taskDrafts.get(obj.id);
  rec.root.classList.toggle('answered', !!st);
  if (t.kind === 'fields'){
    rec.inputs.forEach(inp => {
      const fid = inp.dataset.fid;
      const val = st && st.vals && st.vals[fid] != null ? st.vals[fid] : (d && d.vals[fid] != null ? d.vals[fid] : '');
      if (document.activeElement !== inp) inp.value = val;
      const mark = st && st.marks ? st.marks[fid] : null;
      inp.classList.toggle('good', mark === true);
      inp.classList.toggle('bad', mark === false && inp.value === (st.vals || {})[fid]);
      inp.readOnly = !!(st && st.res === 'ok');
    });
    if (rec.check) rec.check.disabled = !!(st && st.res === 'ok');
  } else if (t.kind === 'choice'){
    rec.opts.forEach((b, i) => {
      const picked = !!st && st.pick === i;
      b.classList.toggle('good', picked && st.res === 'ok');
      b.classList.toggle('bad', picked && st.res === 'bad');
      b.classList.toggle('done', !!st && st.res === 'ok');
    });
  } else if (t.kind === 'multi'){
    const picks = st && st.res === 'ok' ? st.picks : ((d && d.picks) ? d.picks : (st ? st.picks : []));
    const checkedPicks = st ? st.picks : [];
    const samePicks = st && JSON.stringify((picks || []).slice().sort()) === JSON.stringify((checkedPicks || []).slice().sort());
    rec.opts.forEach((b, i) => {
      const on = (picks || []).indexOf(i) >= 0;
      b.classList.toggle('picked', on);
      // после проверки: отмеченное верно — зелёным, отмеченное зря — красным
      b.classList.toggle('good', !!(st && samePicks && on && t.correct.indexOf(i) >= 0 && st.res === 'ok'));
      b.classList.toggle('bad', !!(st && samePicks && on && st.res === 'bad' && t.correct.indexOf(i) < 0));
      b.classList.toggle('done', !!st && st.res === 'ok');
    });
    if (rec.check) rec.check.disabled = !!(st && st.res === 'ok');
  }
}

function taskMayAnswer(){ return boardAccess !== 'view'; }

function taskFlash(id, text){
  const rec = taskEls.get(id);
  if (!rec) return;
  rec.msg.textContent = text;
  const anchor = rec.inputs[0] || rec.check;
  rec.msg.style.top = anchor ? 'calc(' + anchor.style.top + ' + ' + anchor.style.height + ' + 6px)' : '100%';
  rec.msg.style.left = anchor ? anchor.style.left : '0';
  rec.msg.classList.add('show');
  clearTimeout(rec.msgTimer);
  rec.msgTimer = setTimeout(() => rec.msg.classList.remove('show'), 2600);
}

// записать итог в объект: это обычная правка доски — с отменой, сохранением
// и рассылкой собеседнику, как у любого штриха
function commitTaskState(obj, st){
  const rec = taskEls.get(obj.id);
  if (rec) rec.msg.classList.remove('show');
  pushUndo();
  obj.task.st = st;
  saveDB();
  scheduleRedraw();
}

function taskCheck(id){
  const obj = taskObjById(id);
  if (!obj || !obj.task || !taskMayAnswer()) return;
  const t = obj.task, prev = t.st || null;
  if (prev && prev.res === 'ok') return;
  if (t.kind === 'fields'){
    const rec = taskEls.get(id);
    const vals = {};
    t.fields.forEach(f => {
      const inp = rec && rec.inputs.find(x => x.dataset.fid === f.id);
      vals[f.id] = inp ? inp.value.trim() : '';
    });
    const marks = {};
    let unparsed = false;
    t.fields.forEach(f => { const r = taCheckField(f, vals[f.id]); if (r === null) unparsed = true; marks[f.id] = r; });
    if (unparsed){
      const empty = t.fields.some(f => !vals[f.id]);
      const f0 = t.fields.find(f => marks[f.id] === null) || t.fields[0];
      taskFlash(id, empty ? 'Сначала впишите ответ'
        : (f0.seq ? 'Цифры подряд, без запятых — например, 135'
          : (f0.type === 'nums' ? 'Числа через «;», например: −2; 5' : 'Запишите числом, например 2,5 или 3/4')));
      return;
    }
    const ok = t.fields.every(f => marks[f.id] === true);
    commitTaskState(obj, { res: ok ? 'ok' : 'bad', vals, marks, tries: ((prev && prev.tries) || 0) + 1 });
    const d = taskDrafts.get(id); if (d) d.vals = {};
    return;
  }
  if (t.kind === 'multi'){
    const d = taskDraft(id);
    const picks = (d.picks || (prev && prev.picks) || []).slice().sort((a, b) => a - b);
    if (!picks.length){ taskFlash(id, 'Отметьте верные утверждения'); return; }
    const ok = picks.length === t.correct.length && picks.every(i => t.correct.indexOf(i) >= 0);
    commitTaskState(obj, { res: ok ? 'ok' : 'bad', picks, tries: ((prev && prev.tries) || 0) + 1 });
    d.picks = picks.slice();
  }
}

function taskPick(id, i){
  const obj = taskObjById(id);
  if (!obj || !obj.task || !taskMayAnswer()) return;
  const t = obj.task, prev = t.st || null;
  if (prev && prev.res === 'ok') return;
  if (t.kind === 'choice'){
    // как в тренажёре: выбрал — сразу видно, верно ли; неверный можно
    // сменить на другой
    if (prev && prev.pick === i) return;
    commitTaskState(obj, { res: i === t.correct ? 'ok' : 'bad', pick: i, tries: ((prev && prev.tries) || 0) + 1 });
    return;
  }
  if (t.kind === 'multi'){
    // отметки — черновик до «Проверить», в доску не пишутся
    const d = taskDraft(id);
    if (!d.picks) d.picks = (prev && prev.picks) ? prev.picks.slice() : [];
    const k = d.picks.indexOf(i);
    if (k >= 0) d.picks.splice(k, 1); else d.picks.push(i);
    const rec = taskEls.get(id);
    if (rec) applyTaskState(rec, obj);
  }
}

function taskReset(id){
  const obj = taskObjById(id);
  if (!obj || !obj.task || !obj.task.st || !taskMayAnswer()) return;
  taskDrafts.delete(id);
  const rec = taskEls.get(id);
  if (rec) rec.inputs.forEach(inp => { inp.value = ''; });
  pushUndo();
  delete obj.task.st;
  saveDB();
  scheduleRedraw();
}

// вызывается на каждый кадр перерисовки: создать/подвинуть/убрать живые
// элементы у заданий, которые сейчас в кадре
function syncTaskOverlays(){
  const layer = taskLayer();
  const seen = new Set();
  if (boardActive && B && Array.isArray(B.objects)){
    const pad = 40 / cam.zoom;
    const vx0 = cam.x - pad, vy0 = cam.y - pad, vx1 = cam.x + cssW / cam.zoom + pad, vy1 = cam.y + cssH / cam.zoom + pad;
    for (let oi = 0; oi < B.objects.length; oi++){
      const o = B.objects[oi];
      if (o.type !== 'image' || !o.points || !o.points[0]) continue;
      // живые поля — у заданий с ответом; кнопка «ещё такое же» (промпт №68)
      // — у любого задания с тренажёра, даже если ответ доске не известен
      const live = !!(o.task && o.task.hot);
      if (!live && !o.gen) continue;
      const x = o.points[0].x, y = o.points[0].y;
      if (x + o.w < vx0 || x > vx1 || y + o.h < vy0 || y > vy1) continue;
      seen.add(o.id);
      let rec = taskEls.get(o.id);
      const shape = (live ? 'L' : '') + (o.gen ? 'G' : '');
      if (rec && rec.shape !== shape){ rec.root.remove(); taskEls.delete(o.id); rec = null; }
      if (!rec){ rec = buildTaskOverlay(o); rec.shape = shape; taskEls.set(o.id, rec); }
      const sig = live ? JSON.stringify(o.task.st || null) : '';
      if (live && rec.sig !== sig){
        // итог проверки сменился (своя проверка, отмена, ответ собеседника) —
        // черновые отметки утверждений больше не актуальны
        if (rec.sig !== null){ const d = taskDrafts.get(o.id); if (d) d.picks = null; }
        rec.sig = sig; applyTaskState(rec, o);
      }
      const p0 = worldToScreen(o.points[0]);
      const sw = o.w * cam.zoom, sh = o.h * cam.zoom;
      const root = rec.root;
      // задания внахлёст: живые элементы верхнего (позже добавленного) — сверху
      root.style.zIndex = String(oi + 1);
      root.style.left = p0.x + 'px'; root.style.top = p0.y + 'px';
      root.style.width = sw + 'px'; root.style.height = sh + 'px';
      // шрифт и скругления — в масштабе картинки: сколько экранных пикселей
      // приходится на один CSS-пиксель тренажёра
      if (!live) continue;
      const k = sw / (o.task.hot.w || sw);
      const sty = o.task.hot.style || {};
      const fh = (rec.inputs[0] && o.task.hot.fields[0]) ? o.task.hot.fields[0].h * sh : 0;
      root.style.fontSize = Math.max(6, fh ? fh * 0.46 : 16 * k) + 'px';
      rec.inputs.forEach(inp => { inp.style.borderRadius = ((sty.inRadius != null ? sty.inRadius : 10) * k) + 'px'; inp.style.borderWidth = Math.max(1, 2 * k) + 'px'; });
      if (rec.check){ rec.check.style.borderRadius = ((sty.btnRadius != null ? sty.btnRadius : 10) * k) + 'px'; rec.check.style.fontSize = Math.max(6, (o.task.hot.check.h * sh) * 0.4) + 'px'; }
      rec.opts.forEach(b => { b.style.borderRadius = (12 * k) + 'px'; b.style.borderWidth = Math.max(1.5, 2.5 * k) + 'px'; });
    }
  }
  taskEls.forEach((rec, id) => {
    if (seen.has(id)) return;
    // поле с фокусом не выдёргиваем посреди набора (кадр мог отсечь его на
    // долю секунды при прокрутке) — оно уберётся, когда фокус уйдёт
    if (rec.root.contains(document.activeElement) && boardActive && taskObjById(id)) return;
    rec.root.remove();
    taskEls.delete(id);
  });
  layer.style.display = boardActive ? '' : 'none';
}

// выгрузка PNG/PDF: живых элементов там нет — рисуем состояние на холсте
function drawTaskStateForExport(c, obj, x, y, w, h){
  const t = obj.task, st = t.st, hot = t.hot;
  if (!st || !hot) return;
  const R = r => ({ x: x + r.x * w, y: y + r.y * h, w: r.w * w, h: r.h * h });
  const OK = '#248A3D', BAD = '#FF3B30';
  c.save();
  if (t.kind === 'fields'){
    t.fields.forEach((f, i) => {
      const r = hot.fields[i]; if (!r) return;
      const q = R(r);
      const good = st.marks && st.marks[f.id] === true;
      c.fillStyle = good ? '#EAF5EC' : '#FDECEC';
      c.strokeStyle = good ? OK : BAD; c.lineWidth = Math.max(1, q.h * 0.06);
      c.beginPath(); roundRectPath(c, q.x, q.y, q.w, q.h, q.h * 0.2); c.fill(); c.stroke();
      c.fillStyle = good ? OK : BAD;
      c.font = '600 ' + Math.max(6, q.h * 0.46) + 'px ' + UI_FONT_FAMILY;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(String((st.vals || {})[f.id] || ''), q.x + q.w / 2, q.y + q.h / 2, q.w * 0.92);
    });
  } else {
    const picked = t.kind === 'choice' ? [st.pick] : (st.picks || []);
    picked.forEach(i => {
      const r = hot.opts[i]; if (!r) return;
      const q = R(r);
      const good = t.kind === 'choice' ? st.res === 'ok' : t.correct.indexOf(i) >= 0 && st.res === 'ok';
      c.fillStyle = good ? 'rgba(36,138,61,.18)' : (st.res === 'bad' ? 'rgba(255,59,48,.15)' : 'rgba(46,125,224,.13)');
      c.strokeStyle = good ? OK : (st.res === 'bad' ? BAD : '#2E7DE0');
      c.lineWidth = Math.max(1.5, q.h * 0.05);
      c.beginPath(); roundRectPath(c, q.x, q.y, q.w, q.h, Math.min(12, q.h * 0.25)); c.fill(); c.stroke();
    });
  }
  c.restore();
}

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
// Промпт №50: тот же бюджет байт, что и у основного undoStack доски (см.
// комментарий там) — панель заметок хранит те же полные JSON-снимки
// (во вкладке «Изображение» это ещё и картинки), поэтому подвержена той
// же болезни на разросшихся заметках
let rfUndoBytes = 0, rfRedoBytes = 0;
function rfResetTransient(){
  rfUndoStack.length = 0; rfRedoStack.length = 0; rfUndoBytes = 0; rfRedoBytes = 0;
  rfSelectedId = null; rfMultiSelectIds = [];
  rfDraft = null; rfCurvePts = null; rfCircleState = null; rfPolyState = null; rfPenStroke = null;
  rfArmedHandId = null; rfClearEditLock(); rfDragMode = null;
}
function rfPushUndo(){
  const snap = JSON.stringify(rfObjects());
  rfUndoStack.push(snap);
  const ref = { v: rfUndoBytes + snap.length };
  trimStackToBudget(rfUndoStack, ref);
  rfUndoBytes = ref.v;
  rfRedoStack.length = 0; rfRedoBytes = 0;
}
function rfDoUndo(){
  if (!rfUndoStack.length) return;
  const redoSnap = JSON.stringify(rfObjects());
  rfRedoStack.push(redoSnap);
  const rRef = { v: rfRedoBytes + redoSnap.length };
  trimStackToBudget(rfRedoStack, rRef);
  rfRedoBytes = rRef.v;
  const popped = rfUndoStack.pop();
  rfUndoBytes -= popped.length;
  rfSetObjects(JSON.parse(popped));
  rfSelectedId = null; rfMultiSelectIds = []; rfClearEditLock();
  rfScheduleRedraw(); saveDB();
}
function rfDoRedo(){
  if (!rfRedoStack.length) return;
  const undoSnap = JSON.stringify(rfObjects());
  rfUndoStack.push(undoSnap);
  const uRef = { v: rfUndoBytes + undoSnap.length };
  trimStackToBudget(rfUndoStack, uRef);
  rfUndoBytes = uRef.v;
  const popped = rfRedoStack.pop();
  rfRedoBytes -= popped.length;
  rfSetObjects(JSON.parse(popped));
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
  const bg = themeVar('--bg');
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
      if (textEditSession){ textEditSession.color = curColorTok; applyTextEditorLiveStyle(); }
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
  if (textEditSession){ textEditSession.color = curColorTok; applyTextEditorLiveStyle(); }
  B.recentColors = [hex].concat(B.recentColors.filter(t=>t!==hex)).slice(0,8);
  saveDB(); renderSwatches();
});

document.getElementById('widthMinus').addEventListener('click', () => { curWidth=clamp(curWidth-1,1,20); document.getElementById('widthVal').textContent=curWidth; });
document.getElementById('widthPlus').addEventListener('click', () => { curWidth=clamp(curWidth+1,1,20); document.getElementById('widthVal').textContent=curWidth; });
function setCurFontSize(v){
  v = clamp(Math.round(v), 8, 96);
  curFontSize = v;
  document.getElementById('fontSizeVal').textContent = v;
  if (textEditSession){
    textEditSession.fontSize = v;
    applyTextEditorLiveStyle();
  }
  return v;
}
document.getElementById('fontSizeMinus').addEventListener('click', () => setCurFontSize((textEditSession ? textEditSession.fontSize : curFontSize) - 2));
document.getElementById('fontSizePlus').addEventListener('click', () => setCurFontSize((textEditSession ? textEditSession.fontSize : curFontSize) + 2));

/* ═══════════════════════════════════════════════════════════════════════
   ПАНЕЛЬ РЕДАКТИРОВАНИЯ ТЕКСТА — форматирование (Ж/К/Ч/З), цвет фона,
   замок. Кнопки живут в #bdOptbar постоянно (см. openTextEditToolbar);
   слушатели вешаются один раз здесь и читают/пишут textEditSession.
   ═══════════════════════════════════════════════════════════════════════ */
function updateTextFmtButtons(){
  const s = textEditSession;
  document.getElementById('bdTextBold').classList.toggle('on', !!(s && s.bold));
  document.getElementById('bdTextItalic').classList.toggle('on', !!(s && s.italic));
  document.getElementById('bdTextUnderline').classList.toggle('on', !!(s && s.underline));
  document.getElementById('bdTextStrike').classList.toggle('on', !!(s && s.strike));
  document.getElementById('bdTextLockBtn').classList.toggle('on', !!(s && s.locked));
}
document.getElementById('bdTextBold').addEventListener('click', () => {
  if (!textEditSession) return;
  textEditSession.bold = curBold = !textEditSession.bold;
  applyTextEditorLiveStyle(); updateTextFmtButtons();
});
document.getElementById('bdTextItalic').addEventListener('click', () => {
  if (!textEditSession) return;
  textEditSession.italic = curItalic = !textEditSession.italic;
  applyTextEditorLiveStyle(); updateTextFmtButtons();
});
document.getElementById('bdTextUnderline').addEventListener('click', () => {
  if (!textEditSession) return;
  textEditSession.underline = curUnderline = !textEditSession.underline;
  applyTextEditorLiveStyle(); updateTextFmtButtons();
});
document.getElementById('bdTextStrike').addEventListener('click', () => {
  if (!textEditSession) return;
  textEditSession.strike = curStrike = !textEditSession.strike;
  applyTextEditorLiveStyle(); updateTextFmtButtons();
});
// замок текста — как и у закреплённых картинок, защищает ТОЛЬКО от ластика
// (см. eraseAt/rfEraseAt: они дженерик и пропускают любой obj.locked), а не
// от перемещения — та строгая «взвод двойным кликом» логика в pointerdown
// завязана именно на type==='image', текста не касается
document.getElementById('bdTextLockBtn').addEventListener('click', () => {
  if (!textEditSession) return;
  textEditSession.locked = !textEditSession.locked;
  updateTextFmtButtons();
});

const BG_SWATCH_PALETTE = ['#FFF59D', '#A5D6A7', '#90CAF9', '#F8BBD0', '#FFCC80', '#CE93D8'];
function renderBgSwatches(){
  const wrap = document.getElementById('bdBgSwatches');
  if (!wrap) return;
  const curBg = textEditSession ? textEditSession.bg : curBgTok;
  const items = [null].concat(BG_SWATCH_PALETTE);
  wrap.innerHTML = items.map(tok => {
    const active = (tok === curBg) ? ' active' : '';
    if (tok === null) return `<button class="bd-swatch bd-swatch-none${active}" data-tok="" title="Без фона"></button>`;
    return `<button class="bd-swatch${active}" data-tok="${escHtml(tok)}" style="background:${tok}"></button>`;
  }).join('');
  wrap.querySelectorAll('.bd-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      const tok = sw.dataset.tok || null;
      curBgTok = tok;
      if (textEditSession) textEditSession.bg = tok;
      renderBgSwatches();
      applyTextEditorLiveStyle();
    });
  });
}
document.getElementById('bdBgSwatchAdd').addEventListener('click', () => document.getElementById('bdBgColorInput').click());
document.getElementById('bdBgColorInput').addEventListener('input', (e) => {
  const hex = e.target.value;
  curBgTok = hex;
  if (textEditSession) textEditSession.bg = hex;
  renderBgSwatches();
  applyTextEditorLiveStyle();
});
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
// mousedown preventDefault здесь — чтобы клик по кнопкам зума не «крал»
// фокус у активного текстового редактора на доске (иначе blur сразу же
// подтверждал/закрывал попап редактирования текста при зуме колёсиком —
// см. syncTextEditorToCam(): попап должен просто следовать за камерой,
// оставаясь открытым, а не закрываться из-за смены зума)
document.getElementById('railZoomIn').addEventListener('mousedown', (e) => e.preventDefault());
document.getElementById('railZoomOut').addEventListener('mousedown', (e) => e.preventDefault());
document.getElementById('railZoomIn').addEventListener('click', () => setZoom(cam.zoom*1.25, cam.x+cssW/2/cam.zoom, cam.y+cssH/2/cam.zoom, cssW/2, cssH/2));
document.getElementById('railZoomOut').addEventListener('click', () => setZoom(cam.zoom/1.25, cam.x+cssW/2/cam.zoom, cam.y+cssH/2/cam.zoom, cssW/2, cssH/2));
document.getElementById('railZoomLabel').addEventListener('click', () => setZoom(1, cam.x+cssW/2/cam.zoom, cam.y+cssH/2/cam.zoom, cssW/2, cssH/2));
/* Выгрузка открытой доски в файл — прямо отсюда, не выходя из доски.
   Раньше это жило только в меню «⋯» у доски в списке: чтобы спасти работу,
   надо было сначала выйти из доски — а именно в момент сбоя сохранения
   выходить опаснее всего, несохранённое просто терялось. */
document.getElementById('railPaste')?.addEventListener('click', () => pasteClipboard());
document.getElementById('railBackup').addEventListener('click', () => {
  try {
    if (boardActive && B) exportBoardToFile(B);
    else exportAllBoardsArchive();
  } catch (e) { alert('Не удалось выгрузить доску: ' + (e && e.message || e)); }
});
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
/* ── сжатие картинки при вставке ──
   Скриншот с экрана ноутбука — это несколько мегабайт: в доске он хранится
   строкой прямо в данных, и десяток таких вставок раздувает всё хранилище.
   Для доски столько подробностей не нужно: ужимаем до разумного размера по
   длинной стороне и пережимаем. Прозрачность (PNG со скриншотом окна,
   логотип) сохраняем — такие картинки оставляем PNG, остальное уводим в
   JPEG, он для фотографий и скриншотов в разы легче. */
const IMG_MAX_SIDE = 1800;      // px по длинной стороне
const IMG_SIZE_LIMIT = 300 * 1024; // меньше этого не трогаем вообще

function loadImageEl(src){
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });
}
function hasTransparency(canvas, ctx){
  try {
    const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    // выборочно: проверять каждый пиксель большого изображения незачем
    const step = Math.max(4, Math.floor(d.length / 4 / 40000) * 4);
    for (let i = 3; i < d.length; i += step) if (d[i] < 250) return true;
    return false;
  } catch (e) { return true; }
}
async function shrinkImageDataUrl(src){
  try {
    if (typeof src !== 'string' || src.indexOf('data:image') !== 0) return src;
    if (src.length < IMG_SIZE_LIMIT) return src;          // и так небольшая
    if (src.indexOf('data:image/gif') === 0) return src;  // анимацию не трогаем
    const im = await loadImageEl(src);
    const w = im.naturalWidth || im.width, h = im.naturalHeight || im.height;
    if (!w || !h) return src;
    const k = Math.min(1, IMG_MAX_SIDE / Math.max(w, h));
    const cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(h * k));
    const cv = document.createElement('canvas');
    cv.width = cw; cv.height = ch;
    const cx = cv.getContext('2d');
    cx.drawImage(im, 0, 0, cw, ch);
    const out = hasTransparency(cv, cx) ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', 0.85);
    // если «сжатие» вдруг вышло тяжелее оригинала — оставляем оригинал
    return out.length < src.length ? out : src;
  } catch (e) { return src; }
}

function fileToDataUrl(fileOrBlob){
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(shrinkImageDataUrl(fr.result));
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

/* Проверка места ДО вставки: раньше о том, что картинка не влезла, можно
   было узнать только постфактум — по красному баннеру «не сохранилось»,
   когда работа уже была под угрозой. Теперь, если файл явно не помещается
   в оставшееся место, спрашиваем заранее и показываем конкретные цифры. */
async function imageFitsStorage(src){
  try {
    const imgBytes = (src && src.length) || 0;
    const info = await window.boardsStorageInfo();
    const quota = info.quota;
    if (!quota) return { ok: true };            // браузер оценку не дал — не мешаем
    const used = (info.usage != null ? info.usage : info.boardsBytes) || 0;
    const free = quota - used;
    if (imgBytes < free * 0.8) return { ok: true };
    return { ok: false, imgBytes, free, quota };
  } catch (e) { return { ok: true }; }
}

/* ═══ Промпт №44: обрезка картинки прямо в предпросмотре ═══
   Рамку тянут левой кнопкой мыши по самому предпросмотру. Храним её в долях
   от размера картинки (0..1), а не в пикселях экрана: предпросмотр может
   масштабироваться, а доли — нет. Режем при вставке, один раз, — на доску
   ложится уже обрезанная картинка, и лишние пиксели не занимают место.  */
let cropRect = null;   // {x, y, w, h} в долях от картинки

function setCropUI(){
  const box = document.getElementById('imgCropBox');
  const img = document.querySelector('#imgModalPreview img');
  const reset = document.getElementById('imgCropReset');
  if (!box || !img) return;
  if (!cropRect){
    box.style.display = 'none';
    if (reset) reset.style.display = 'none';
    return;
  }
  const host = document.getElementById('imgModalPreview').getBoundingClientRect();
  const r = img.getBoundingClientRect();
  box.style.display = 'block';
  box.style.left   = (r.left - host.left + cropRect.x * r.width) + 'px';
  box.style.top    = (r.top - host.top + cropRect.y * r.height) + 'px';
  box.style.width  = (cropRect.w * r.width) + 'px';
  box.style.height = (cropRect.h * r.height) + 'px';
  if (reset) reset.style.display = '';
}
function previewHTML(src){
  return `<img src="${src}" alt="">
    <div class="bd-crop-box" id="imgCropBox" style="display:none"></div>
    <div class="bd-crop-hint">Потяните рамку по картинке, чтобы обрезать</div>`;
}
// вырезаем выбранный кусок в новую картинку
function cropDataUrl(src, rect){
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => {
      try {
        const sx = Math.round(rect.x * im.naturalWidth);
        const sy = Math.round(rect.y * im.naturalHeight);
        const sw = Math.max(1, Math.round(rect.w * im.naturalWidth));
        const sh = Math.max(1, Math.round(rect.h * im.naturalHeight));
        const c = document.createElement('canvas');
        c.width = sw; c.height = sh;
        c.getContext('2d').drawImage(im, sx, sy, sw, sh, 0, 0, sw, sh);
        // PNG сохраняет прозрачность; для фотографий это тяжеловато, поэтому
        // непрозрачные куски отдаём JPEG — так же, как при обычной вставке
        resolve({ src: c.toDataURL(hasAlpha(c) ? 'image/png' : 'image/jpeg', 0.9), w: sw, h: sh });
      } catch (e) { resolve(null); }
    };
    im.onerror = () => resolve(null);
    im.src = src;
  });
}
function hasAlpha(canvas){
  try {
    const d = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < d.length; i += 4) if (d[i] !== 255) return true;
    return false;
  } catch (e) { return true; }
}
// поворот картинки на 90° — крутим сами пиксели, а не рисуем повёрнуто:
// доска умеет только прямые прямоугольники, а так поворот переживает и
// сохранение, и передачу ученику, и экспорт в PDF
function rotateDataUrl(src, dir){
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = im.naturalHeight; c.height = im.naturalWidth;
        const ctx2 = c.getContext('2d');
        if (dir > 0){ ctx2.translate(c.width, 0); ctx2.rotate(Math.PI / 2); }
        else { ctx2.translate(0, c.height); ctx2.rotate(-Math.PI / 2); }
        ctx2.drawImage(im, 0, 0);
        resolve({ src: c.toDataURL(hasAlpha(c) ? 'image/png' : 'image/jpeg', 0.92), w: c.width, h: c.height });
      } catch (e) { resolve(null); }
    };
    im.onerror = () => resolve(null);
    im.src = src;
  });
}

async function openImageModal(src, worldPt){
  const fit = await imageFitsStorage(src);
  if (!fit.ok) {
    const go = confirm('Этот файл весит ' + fmtMB(fit.imgBytes)
      + ', а свободного места в браузере осталось примерно ' + fmtMB(fit.free)
      + ' (всего около ' + fmtMB(fit.quota) + ').\n\n'
      + 'Скорее всего, доска после вставки перестанет сохраняться. Лучше сначала '
      + 'выгрузить доски в файлы (кнопка ⤓ слева) и удалить ненужные, либо вставить '
      + 'картинку поменьше.\n\nВсё равно вставить?');
    if (!go) return;
  }
  const size = await loadImageSize(src);
  pendingImage = { src, natW: size.w, natH: size.h, worldPt: worldPt || viewportCenterWorld() };
  cropRect = null;
  document.getElementById('imgModalPreview').innerHTML = previewHTML(src);
  setCropUI();
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
      cropRect = null;
      document.getElementById('imgModalPreview').innerHTML = previewHTML(it.src);
      setCropUI();
    });
  });
}

/* тянем рамку по предпросмотру */
(function initCropDrag(){
  const host = document.getElementById('imgModalPreview');
  if (!host) return;
  let start = null;
  const imgRect = () => { const im = host.querySelector('img'); return im ? im.getBoundingClientRect() : null; };
  const frac = (e, r) => ({
    x: clamp((e.clientX - r.left) / r.width, 0, 1),
    y: clamp((e.clientY - r.top) / r.height, 0, 1),
  });
  host.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const r = imgRect(); if (!r) return;
    host.setPointerCapture(e.pointerId);
    start = frac(e, r);
    cropRect = null; setCropUI();
    e.preventDefault();
  });
  host.addEventListener('pointermove', (e) => {
    if (!start) return;
    const r = imgRect(); if (!r) return;
    const p = frac(e, r);
    cropRect = { x: Math.min(start.x, p.x), y: Math.min(start.y, p.y),
                 w: Math.abs(p.x - start.x), h: Math.abs(p.y - start.y) };
    setCropUI();
  });
  const end = () => {
    start = null;
    // случайный клик без протяжки — это не обрезка, а промах
    if (cropRect && (cropRect.w < 0.02 || cropRect.h < 0.02)){ cropRect = null; setCropUI(); }
  };
  host.addEventListener('pointerup', end);
  host.addEventListener('pointercancel', end);
  window.addEventListener('resize', setCropUI);
  const reset = document.getElementById('imgCropReset');
  if (reset) reset.addEventListener('click', () => { cropRect = null; setCropUI(); });
})();

document.getElementById('imgModalClose').addEventListener('click', closeImageModal);
document.getElementById('imgModalBackdrop').addEventListener('click', (e) => { if (e.target.id==='imgModalBackdrop') closeImageModal(); });
document.getElementById('imgModalInsert').addEventListener('click', async () => {
  if (!pendingImage || !B) return;
  // Промпт №44: обрезаем ОДИН раз, прямо здесь — на доску ложится уже
  // обрезанная картинка, а не полная с невидимыми полями
  if (cropRect && cropRect.w > 0.02 && cropRect.h > 0.02){
    const cut = await cropDataUrl(pendingImage.src, cropRect);
    if (cut){ pendingImage.src = cut.src; pendingImage.natW = cut.w; pendingImage.natH = cut.h; }
    cropRect = null;
  }
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
  /* Промпт №44: сразу после вставки картинку почти всегда двигают и
     подгоняют по месту — поэтому включаем «руку» и «взводим» именно эту
     картинку: первый же клик по ней её потащит. Чтобы начать писать
     поверх, достаточно нажать ручку, как обычно. */
  const handBtn = document.querySelector('.bd-tool[data-tool="hand"]');
  if (handBtn) handBtn.click();
  selectedId = obj.id; multiSelectIds = [];
  armedHandId = obj.id;
  enterEditLock(obj, 'image');
  saveDB(); scheduleRedraw(); updateContextMenu();
  closeImageModal();
});

/* ═══ Промпт №44: поворот картинки на 90° ═══
   Ученик прислал фотографию боком — разворачиваем на месте, не выходя с
   доски. Габариты меняются местами вокруг центра, чтобы картинка осталась
   там же, где лежала, а не уехала. */
async function rotateSelectedImage(dir){
  const sel = getSelectedObjects();
  if (sel.length !== 1 || sel[0].type !== 'image') return;
  const obj = sel[0];
  const res = await rotateDataUrl(obj.src, dir);
  if (!res) return;
  pushUndo();
  const p = obj.points[0];
  const cx = p.x + obj.w / 2, cy = p.y + obj.h / 2;
  const nw = obj.h, nh = obj.w;
  obj.src = res.src;
  obj.natW = res.w; obj.natH = res.h;
  obj.w = nw; obj.h = nh;
  obj.points = [{ x: cx - nw / 2, y: cy - nh / 2 }];
  saveDB(); scheduleRedraw(); updateContextMenu();
}

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
  powers:'Действия со степенями', gcd:'Наибольший общий делитель (НОД)',
};
// подписи для «Подборки» — берём из списка панели тренажёров, чтобы название
// ЕГЭ-задания было записано на доске один в один как в реестре на главной
EGE_PROF_PANEL.forEach((title, i) => { TRAINER_NAMES['ege' + (i + 1)] = 'ЕГЭ профиль №' + (i + 1) + '. ' + title; });
EGE_BASE_PANEL.forEach((title, i) => { TRAINER_NAMES['egeb' + (i + 1)] = 'ЕГЭ база №' + (i + 1) + '. ' + title; });
Object.keys(OGE_PART2_PANEL).forEach(n => { TRAINER_NAMES['oge' + n] = '№' + n + '. ' + OGE_PART2_PANEL[n]; });
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

/* ═══════════════════════════════════════════════════════════════════════
   ФОРМУЛЫ (f(x)) — тот же приём, что и rasterizeBasketItem() выше: LaTeX
   рисуется движком KaTeX, уже встроенным в страницу (см. tex() в
   boards.html), в SVG <foreignObject>, а тот перерисовывается в PNG через
   canvas — получается обычная картинка на доске (type:'image'), поэтому
   перетаскивание/ресайз/ластик/замок/выделение достаются бесплатно от уже
   существующей инфраструктуры картинок; своё у формулы — только пометка
   isFormula:true и исходный latex (для повторного редактирования).
   ═══════════════════════════════════════════════════════════════════════ */
function rasterizeFormula(latex, fontSizePx){
  return new Promise((resolve, reject) => {
    let html;
    try { html = tex(latex); } catch(e){ html = escapeHtmlBd(latex); }
    const measure = document.createElement('div');
    measure.style.cssText = `position:fixed;left:-99999px;top:0;display:inline-block;font-size:${fontSizePx}px;line-height:1.25;`;
    measure.innerHTML = html;
    document.body.appendChild(measure);
    const w = Math.max(10, Math.ceil(measure.getBoundingClientRect().width));
    const h = Math.max(10, Math.ceil(measure.getBoundingClientRect().height));
    document.body.removeChild(measure);

    const pad = Math.max(2, Math.round(fontSizePx * 0.15));
    const W = w + pad*2, H = h + pad*2;
    const cs = getComputedStyle(document.documentElement);
    const pencil = cs.getPropertyValue('--pencil').trim() || '#1D1D1F';
    const katexCssText = (document.getElementById('katexCssBlock') || {}).textContent || '';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${W}px;height:${H}px;box-sizing:border-box;padding:${pad}px;font-size:${fontSizePx}px;line-height:1.25;color:${pencil};">
          <style>${katexCssText}.katex{visibility:visible;}</style>
          ${html}
        </div>
      </foreignObject>
    </svg>`;
    const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    const im = new Image();
    im.onload = () => {
      const scale = 2; // повыше плотность пикселей — иначе формула размывается при увеличении на доске
      const c = document.createElement('canvas');
      c.width = W * scale; c.height = H * scale;
      const cx = c.getContext('2d');
      cx.scale(scale, scale);
      cx.drawImage(im, 0, 0, W, H); // фон намеренно НЕ заливаем — формула, как и текст, должна быть прозрачной поверх доски
      try { resolve({ dataUrl: c.toDataURL('image/png'), w: W, h: H }); }
      catch(err){ reject(err); }
    };
    im.onerror = reject;
    im.src = svgUrl;
  });
}

let formulaEditState = null; // { objId, anchor, fontPx } — id редактируемого объекта-формулы (либо null для новой), точка вставки и размер шрифта — снимаются СРАЗУ при открытии, а не при подтверждении
function openFormulaEditor(existingObj){
  const editor = document.getElementById('bdFormulaEditor');
  const input = document.getElementById('bdFormulaInput');
  input.value = existingObj ? (existingObj.latex || '') : '';
  const fontPx = (textEditSession ? textEditSession.fontSize : curFontSize) || 22;
  // якорь для НОВОЙ формулы снимаем прямо сейчас, пока сессия редактирования
  // текста ещё точно жива — фокус вот-вот уйдёт в поле формулы, и это само
  // закроет/подтвердит открытый текст (как и смена инструмента), обнулив
  // textEditSession ещё до нажатия «подтвердить» в попапе формулы
  const anchor = (!existingObj && textEditSession)
    ? { x: textEditSession.worldPt.x, y: textEditSession.worldPt.y + fontPx*1.6 }
    : null;
  formulaEditState = { objId: existingObj ? existingObj.id : null, anchor, fontPx };
  editor.style.display = 'flex';
  updateFormulaPreview();
  setTimeout(() => { input.focus(); input.select(); }, 0);
}
function closeFormulaEditor(){
  document.getElementById('bdFormulaEditor').style.display = 'none';
  formulaEditState = null;
}
function updateFormulaPreview(){
  const input = document.getElementById('bdFormulaInput');
  const prev = document.getElementById('bdFormulaPreview');
  const v = input.value.trim();
  if (!v){ prev.innerHTML = ''; return; }
  try { prev.innerHTML = tex(input.value); } catch(e){ prev.textContent = input.value; }
}
function confirmFormulaEditor(){
  const state = formulaEditState;
  const input = document.getElementById('bdFormulaInput');
  const latex = input.value.trim();
  if (!latex || !state){ closeFormulaEditor(); return; }
  rasterizeFormula(latex, state.fontPx).then(({dataUrl, w, h}) => {
    if (state.objId){
      const obj = B.objects.find(o=>o.id===state.objId);
      if (obj){
        pushUndo();
        obj.src = dataUrl; obj.w = w; obj.h = h; obj.natW = w; obj.natH = h; obj.latex = latex;
        saveDB(); scheduleRedraw();
      }
    } else {
      // новая формула — рядом с текстом, который редактировался в момент
      // открытия попапа (якорь снят заранее в openFormulaEditor); если его
      // не было — просто в центре видимой области доски
      const pt = state.anchor || (() => { const c = screenToWorld(cssW/2, cssH/2); return { x: c.x - w/2, y: c.y - h/2 }; })();
      const obj = { id: uid(), type:'image', src: dataUrl, points:[pt], w, h, natW:w, natH:h, isFormula:true, latex };
      commitObject(obj);
    }
    closeFormulaEditor();
  }).catch(() => { closeFormulaEditor(); });
}
document.getElementById('bdFxBtn').addEventListener('click', () => openFormulaEditor(null));
document.getElementById('bdFormulaInput').addEventListener('input', updateFormulaPreview);
document.getElementById('bdFormulaOk').addEventListener('mousedown', (e) => e.preventDefault());
document.getElementById('bdFormulaCancel').addEventListener('mousedown', (e) => e.preventDefault());
document.getElementById('bdFormulaOk').addEventListener('click', () => confirmFormulaEditor());
document.getElementById('bdFormulaCancel').addEventListener('click', () => closeFormulaEditor());
document.getElementById('bdFormulaInput').addEventListener('keydown', (e) => {
  if (e.key === 'Escape'){ e.preventDefault(); closeFormulaEditor(); }
  else if (e.key === 'Enter'){ e.preventDefault(); confirmFormulaEditor(); }
});

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
  const items = (e.clipboardData && e.clipboardData.items) || [];
  for (const item of items){
    if (item.type && item.type.startsWith('image/')){
      const file = item.getAsFile();
      if (!file) continue;
      openImageModal(await fileToDataUrl(file));
      return;
    }
  }
  // Промпт №38: картинки в системном буфере нет — значит Ctrl+V относится к
  // нашему собственному буферу, и это тот самый перенос с доски на доску
  if (clipboardObjs && clipboardObjs.length){ e.preventDefault(); pasteClipboard(); }
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
  /* Промпт №38: копирование и вырезание с клавиатуры. Вставка (Ctrl+V) не
     здесь, а в обработчике события 'paste' ниже — иначе на одно нажатие
     сработали бы оба и вставилось бы дважды. */
  if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='c'){
    const sel = getSelectedObjects();
    if (sel.length){ e.preventDefault(); setClipboard(sel, B && B.name); }
    return;
  }
  if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='x'){
    const sel = getSelectedObjects();
    if (sel.length){ e.preventDefault(); setClipboard(sel, B && B.name); deleteSelected(); }
    return;
  }
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
  // меню стоит на экране (position:fixed), а p0/p1 — в координатах холста;
  // с промпта №68 холст может начинаться правее панели тренажёров
  p0.x += boardInset; p1.x += boardInset;
  let left = p1.x + 14;
  if (left + menuW > boardInset + cssW - 8) left = Math.max(boardInset + 8, p0.x - menuW - 14);
  let top = clamp(p0.y, 8, Math.max(8, cssH - menuH - 8));
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';

  const isSingleImage = sel.length===1 && sel[0].type==='image';
  document.getElementById('bdCtxGroup').disabled = sel.length < 2;
  document.getElementById('bdCtxSaveLib').disabled = !isSingleImage;
  document.getElementById('bdCtxSaveLib').style.display = (sel.length===1 && sel[0].type!=='image') ? 'none' : '';
  const rot = document.getElementById('bdCtxRotate');
  if (rot) rot.style.display = isSingleImage ? 'flex' : 'none';   // Промпт №44
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
    if (sel.length) setClipboard(sel, B && B.name);
  } else if (act === 'cut'){
    if (sel.length){ setClipboard(sel, B && B.name); deleteSelected(); }
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
  } else if (act === 'rotl'){
    rotateSelectedImage(-1);
  } else if (act === 'rotr'){
    rotateSelectedImage(1);
  } else if (act === 'pin'){
    if (sel.length===1 && sel[0].type==='image'){
      pushUndo(); sel[0].locked = !sel[0].locked; saveDB(); scheduleRedraw();
    }
  }
});
function pasteClipboard(){
  if (!mayDraw()) return;                             // Промпт №41
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
window.__w2s = function(p){ return worldToScreen(p); };   // для проверок
// Промпт №48: для проверки, что unloadBoard() реально чистит decoded-картинки,
// а не только obj/imageLib — сам imgCache наружу не отдаём (незачем), только
// булев ответ по конкретному src
window.__imgCacheHas = function(src){ return Object.prototype.hasOwnProperty.call(imgCache, src); };
// Промпт №50: для проверки, что бюджет байт реально ограничивает вес
// истории отмены на тяжёлых досках, а не только на глаз по .length стека
window.__undoStackInfo = function(){ return { count: undoStack.length, bytes: undoBytes, limit: UNDO_LIMIT, budget: UNDO_BYTES_BUDGET }; };
window.getCurrentBoard = function(){ return B; };
window.__applyDrop = function(st, t){ return applyDrop(st, t); };   // для проверок: перенос в папку без мыши
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
  // сначала дочитываем доски из IndexedDB (и, если надо, переносим туда
  // старые), и только потом рисуем список — иначе на экране мелькнул бы
  // пустой список или устаревшее содержимое
  idbLoadDB().then(() => {
    if (DB.sortMode && sortLabels[DB.sortMode]){
      sortMode = DB.sortMode;
      const lbl = document.getElementById('blSortLabel');
      if (lbl) lbl.textContent = sortLabels[sortMode];
    }
    loadClipboard();
    renderList();
    // Промпт №49: если открытие ИМЕННО этой доски роняет вкладку (браузер
    // сам её перезагружает после краша), в адресе остаётся #board=<id> — и
    // код ниже тут же открыл бы её снова, получая бесконечный цикл
    // крах → перезагрузка → снова открытие той же доски → снова крах, из
    // которого обычными действиями в интерфейсе не выбраться (человек не
    // успевает даже посмотреть на список досок). sessionStorage переживает
    // такую перезагрузку (это та же вкладка) — если в прошлый раз уже
    // начинали открывать эту доску через хэш и не успели пометить это как
    // «пережито», второй раз не повторяем попытку, а просто остаёмся на
    // списке и убираем хэш из адреса
    const m = /board=([^&]+)/.exec(location.hash);
    if (m && DB.boards.some(b=>b.id===m[1])) {
      let prevAttempt = null;
      try { prevAttempt = sessionStorage.getItem(AUTO_OPEN_GUARD_KEY); } catch(e){}
      if (prevAttempt === m[1]) {
        try { sessionStorage.removeItem(AUTO_OPEN_GUARD_KEY); } catch(e){}
        location.hash = '';
      } else {
        try { sessionStorage.setItem(AUTO_OPEN_GUARD_KEY, m[1]); } catch(e){}
        openBoard(m[1]);
        // крах (если это он) обычно случается в первые пару секунд — если
        // вкладка их пережила, считаем открытие благополучным и снимаем метку
        setTimeout(() => { try { sessionStorage.removeItem(AUTO_OPEN_GUARD_KEY); } catch(e){} }, 4000);
      }
    }
  });
};
if (!window.__hasCloudGate) window.boardsAppBoot();
// сохранение «на всякий случай» при уходе со страницы и при сворачивании
// вкладки — теперь тоже в IndexedDB (обычное сохранение и так идёт на каждое
// изменение, это лишь подстраховка)
window.addEventListener('beforeunload', () => { if (B) { rememberView(); idbSaveDB(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden && B) { rememberView(); idbSaveDB(); } });
