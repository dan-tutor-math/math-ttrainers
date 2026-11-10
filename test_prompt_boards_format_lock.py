"""
Замок на запись хранилища досок (boards-core.js, boardsStorageLocked).

Вкладка со старым кодом после деплоя читает хранилище, сливает со своей
памятью и пишет обратно по-старому. Когда формат хранилища сменится (номер
IDB_INDEX_VERSION станет больше 2), такая вкладка затёрла бы урок. Поэтому
код заранее учится отказываться писать, если на диске формат новее, чем он
понимает: поднимает флаг boardsStorageLocked и показывает плашку bdOutdated.

Случаи:
  А. На диске 'db' с __v: 3 и доска с тремя объектами — после загрузки флаг
     поднят, плашка видна (и в показе презентации тоже), список показан;
     после правки и saveDB на диске по-прежнему __v: 3 и три объекта
  Б. Загрузились с __v: 2, открыли доску, соседняя вкладка (тест) кладёт
     'db' с __v: 3; правка и saveDB — на диске __v: 3, boarddata не тронута,
     плашка видна
  Б2. То же, но прямая запись boarddata (idbPut) — проверка в её транзакции
  В. Обычная работа с __v: 2 — объект сохраняется, плашки нет
  Г. «Пересобрать хранилище» при замке ничего не пишет
  Д. Страница просмотра (?s=КОД) — плашки нет
  Е. Пересборка: соседняя вкладка обновилась после копирования основной базы —
     основную базу не удаляем, формат нового кода не откатывается

Запуск: ~/.venvs/trainers/bin/python test_prompt_boards_format_lock.py
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt48_unload_on_close as T48

# свой порт: соседние тесты могут идти рядом
T48.PORT = 9251
T48.BASE = BASE = "http://127.0.0.1:9251"

OBJS = [{"id": f"bA-o{i}", "type": "pen", "color": "#000", "width": 2,
         "points": [{"x": 10 * i, "y": 10}, {"x": 10 * i + 5, "y": 20}]} for i in range(3)]

# сырое чтение хранилища мимо кода страницы: что реально лежит на диске
READ_DISK = """() => new Promise((resolve, reject) => {
  const req = indexedDB.open('ogeBoardsDB', 1);
  req.onsuccess = () => {
    const st = req.result.transaction('state', 'readonly').objectStore('state');
    const a = st.get('db'), b = st.get('boarddata:bA');
    b.onsuccess = () => {
      const db = a.result, bd = b.result;
      resolve({
        v: db ? db.__v : null,
        boards: db && Array.isArray(db.boards) ? db.boards.length : -1,
        objs: bd && Array.isArray(bd.objects) ? bd.objects.length : -1,
      });
      req.result.close();
    };
    b.onerror = () => reject(b.error);
  };
  req.onerror = () => reject(req.error);
})"""

# «соседняя вкладка обновилась»: та же запись 'db', но с номером формата 3
BUMP_TO_V3 = """() => new Promise((resolve, reject) => {
  const req = indexedDB.open('ogeBoardsDB', 1);
  req.onsuccess = () => {
    const tx = req.result.transaction('state', 'readwrite');
    const st = tx.objectStore('state');
    const g = st.get('db');
    g.onsuccess = () => { st.put(Object.assign({}, g.result, { __v: 3 }), 'db'); };
    tx.oncomplete = () => { req.result.close(); resolve(true); };
    tx.onerror = () => reject(tx.error);
  };
  req.onerror = () => reject(req.error);
})"""

LOCKED = "() => typeof boardsStorageLocked !== 'undefined' && boardsStorageLocked === true"
BANNER_VISIBLE = """() => { const el = document.getElementById('bdOutdated');
  if (!el) return false; const r = el.getBoundingClientRect();
  return getComputedStyle(el).display !== 'none' && r.width > 0 && r.height > 0; }"""
# правка открытой доски так же, как её делает рисование: объект + saveDB
ADD_AND_SAVE = """() => { const b = window.getCurrentBoard();
  b.objects.push({ id: 'new-' + Date.now(), type: 'pen', color: '#000', width: 2,
    points: [{ x: 1, y: 1 }, { x: 2, y: 2 }] });
  touchBoard(b); saveDB(); }"""


def seed(page, v):
    T48.seed_split_db(page, [T48.light_board("bA", "Урок")], {"bA": {"objects": OBJS, "imageLib": []}})
    if v != 2:
        page.evaluate(BUMP_TO_V3)


def boot(page):
    page.reload()
    page.evaluate(T48.BOOT_JS)
    page.wait_for_function("window.getDB && Array.isArray(window.getDB().boards) && window.getDB().boards.length === 1")
    page.wait_for_timeout(300)


def open_board(page):
    page.evaluate("() => window.openBoard('bA')")
    page.wait_for_function("window.getCurrentBoard() && window.getCurrentBoard().id === 'bA'"
                           " && Array.isArray(window.getCurrentBoard().objects)"
                           " && window.getCurrentBoard().objects.length === 3", timeout=5000)


def run():
    failures = []

    def check(name, cond):
        print(f"[{'OK' if cond else 'FAIL'}] {name}")
        if not cond:
            failures.append(name)

    def case(browser, title, fn):
        print(title)
        ctx = browser.new_context()
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        # confirm пересборки и alert замка — соглашаемся, как человек
        page.on("dialog", lambda d: d.accept())
        page.goto(f"{BASE}/boards.html")
        try:
            fn(page)
        except Exception as e:   # тест на старом коде может упасть по таймауту — это тоже провал случая
            check(f"{title.split('.')[0]}: случай дошёл до конца ({type(e).__name__}: {str(e)[:120]})", False)
        check(f"{title.split('.')[0]}: нет ошибок на странице", not errors)
        if errors:
            print("   ", errors[:3])
        ctx.close()

    def case_a(page):
        seed(page, 3)
        boot(page)
        check("А: флаг boardsStorageLocked поднят", page.evaluate(LOCKED))
        check("А: плашка bdOutdated видна", page.evaluate(BANNER_VISIBLE))
        check("А: текст плашки про обновление",
              "Перезагрузите страницу" in (page.evaluate("() => (document.getElementById('bdOutdated') || {}).textContent || ''")))
        check("А: список досок показан", "Урок" in page.inner_text("#screenList"))
        open_board(page)
        page.evaluate(ADD_AND_SAVE)
        page.wait_for_timeout(1500)
        disk = page.evaluate(READ_DISK)
        check(f"А: на диске по-прежнему __v: 3 и три объекта ({disk})", disk["v"] == 3 and disk["objs"] == 3)
        # показ презентации прячет всё на #screenBoard, кроме списка — плашка
        # живёт вне его и должна остаться видна
        page.evaluate("() => document.documentElement.classList.add('deck-show')")
        check("А: в показе презентации плашка видна", page.evaluate(BANNER_VISIBLE))
        page.evaluate("() => document.documentElement.classList.remove('deck-show')")
        check("А: страница сама не перезагрузилась", page.evaluate("() => !!window.getCurrentBoard()"))

    def case_b(page):
        seed(page, 2)
        boot(page)
        open_board(page)
        check("Б: до обновления соседней вкладки замка нет", not page.evaluate(LOCKED))
        page.evaluate(BUMP_TO_V3)
        page.evaluate(ADD_AND_SAVE)
        page.wait_for_timeout(1500)
        disk = page.evaluate(READ_DISK)
        check(f"Б: на диске __v: 3 ({disk})", disk["v"] == 3)
        check("Б: boarddata не изменена — три объекта", disk["objs"] == 3)
        check("Б: флаг поднят", page.evaluate(LOCKED))
        check("Б: плашка видна", page.evaluate(BANNER_VISIBLE))
        # следующие сохранения (уход в список, вид доски) тоже ничего не пишут
        page.evaluate("() => window.backToList()")
        page.wait_for_timeout(800)
        disk = page.evaluate(READ_DISK)
        check(f"Б: после выхода в список на диске то же ({disk})", disk["v"] == 3 and disk["objs"] == 3)

    def case_b2(page):
        # третья дыра: тяжёлая часть доски пишется своей транзакцией, мимо
        # индекса — номер формата должен сверяться и в ней, даже когда флаг
        # ещё не поднят
        seed(page, 2)
        boot(page)
        open_board(page)
        page.evaluate(BUMP_TO_V3)
        r = page.evaluate("() => idbPut('boarddata:bA', { objects: [], imageLib: [] })")
        check(f"Б2: запись boarddata при новом индексе отклонена (ответ {r})", r is False)
        disk = page.evaluate(READ_DISK)
        check(f"Б2: boarddata не тронута ({disk})", disk["objs"] == 3 and disk["v"] == 3)
        check("Б2: флаг поднят той же транзакцией", page.evaluate(LOCKED))

    def case_v(page):
        seed(page, 2)
        boot(page)
        open_board(page)
        page.evaluate(ADD_AND_SAVE)
        page.wait_for_timeout(1500)
        disk = page.evaluate(READ_DISK)
        check(f"В: объект сохранился, формат 2 ({disk})", disk["v"] == 2 and disk["objs"] == 4)
        check("В: флага нет", not page.evaluate(LOCKED))
        check("В: плашки нет", page.evaluate("() => !document.getElementById('bdOutdated')"))

    def case_g(page):
        seed(page, 3)
        boot(page)
        check("Г: замок поднят", page.evaluate(LOCKED))
        page.evaluate("() => rebuildStorage()")
        page.wait_for_timeout(1500)
        disk = page.evaluate(READ_DISK)
        check(f"Г: хранилище не переписано ({disk})", disk["v"] == 3 and disk["objs"] == 3)
        dbs = page.evaluate("() => indexedDB.databases().then(l => l.map(d => d.name))")
        check(f"Г: временной базы пересборки нет ({dbs})", "ogeBoardsDB_rebuild" not in dbs)
        check("Г: этап пересборки не записан",
              page.evaluate("() => localStorage.getItem('boardsRebuildStage')") is None)

    def case_d(page):
        seed(page, 3)
        page.goto(f"{BASE}/boards.html?s=TEST01")
        page.wait_for_timeout(1500)
        # возврат на вкладку перечитывает хранилище — и тут плашки быть не должно
        page.evaluate("() => { document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('focus')); }")
        page.wait_for_timeout(800)
        check("Д: страница просмотра", page.evaluate("() => window.__boardViewer === true"))
        check("Д: плашки bdOutdated нет", page.evaluate("() => !document.getElementById('bdOutdated')"))
        disk = page.evaluate(READ_DISK)
        check(f"Д: хранилище не тронуто ({disk})", disk["v"] == 3 and disk["objs"] == 3)

    def case_e(page):
        seed(page, 2)
        boot(page)
        # соседняя вкладка с новым кодом успевает записать индекс __v: 3 в основную
        # базу СРАЗУ ПОСЛЕ того, как пересборка скопировала её во временную, —
        # в копии остаётся старый формат, и проверка одной копии это не ловит
        page.evaluate("() => { const orig = rawIdbCopy; let done = false;"
                      " rawIdbCopy = async (...a) => { const r = await orig(...a);"
                      " if (!done) { done = true; await (" + BUMP_TO_V3 + ")(); } return r; }; }")
        page.evaluate("() => { window.__rb = rebuildStorage(); }")
        page.wait_for_timeout(3500)
        disk = None
        for _ in range(8):   # на старом коде страница после пересборки перезагружается
            try:
                disk = page.evaluate(READ_DISK)
                break
            except Exception:
                page.wait_for_timeout(500)
        check(f"Е: формат нового кода не откатился, доска цела ({disk})", bool(disk) and disk["v"] == 3 and disk["objs"] == 3)
        check("Е: замок поднят", page.evaluate(LOCKED))
        check("Е: плашка bdOutdated видна", page.evaluate(BANNER_VISIBLE))
        dbs = page.evaluate("() => indexedDB.databases().then(l => l.map(d => d.name))")
        check(f"Е: временной базы пересборки нет ({dbs})", "ogeBoardsDB_rebuild" not in dbs)
        check("Е: этап пересборки не записан",
              page.evaluate("() => localStorage.getItem('boardsRebuildStage')") is None)

    with T48.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        case(browser, "А. На диске формат новее", case_a)
        case(browser, "Б. Соседняя вкладка обновилась посреди работы", case_b)
        case(browser, "Б2. Запись тяжёлой части при новом индексе", case_b2)
        case(browser, "В. Обычная работа с __v: 2", case_v)
        case(browser, "Г. Пересборка хранилища при замке", case_g)
        case(browser, "Д. Страница просмотра ?s=КОД", case_d)
        case(browser, "Е. Пересборка: соседняя вкладка обновилась после копирования", case_e)
        browser.close()

    print()
    print("ИТОГ: всё прошло" if not failures else f"ИТОГ: {len(failures)} проверок провалено — {failures}")
    return not failures


if __name__ == "__main__":
    sys.exit(0 if run() else 1)
