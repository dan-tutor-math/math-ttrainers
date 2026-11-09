"""
«Выгрузка открытой доски» (ветка fix/boards-render-objects, boards-core.js).

backToList() выгружает покинутую доску не сразу, а после записи на диск. Если
за это время ту же доску открыть снова, отложенная выгрузка снимала objects у
ОТКРЫТОЙ доски: кадр падал на B.objects.forEach, штрихи переставали
сохраняться. А openBoardReady, получив выгруженную доску, делал
«B.objects = B.objects || []» — доска выглядела пустой, и первое же
сохранение затирало урок на диске.

Проверяем:
  1. unloadBoard по открытой доске ничего не выгружает
  2. openBoardReady с выгруженной доской сначала читает её с диска, а не
     показывает пустой
  3. сохранение после такого открытия оставляет на диске все объекты

Запуск: python3 test_prompt_boards_unload_reopen.py
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt48_unload_on_close as T48

# свой порт: тест №48 может идти рядом
T48.PORT = 8967
T48.BASE = BASE = "http://127.0.0.1:8967"

READ_DISK = """() => new Promise((resolve, reject) => {
  const req = indexedDB.open('ogeBoardsDB', 1);
  req.onsuccess = () => {
    const g = req.result.transaction('state', 'readonly').objectStore('state').get('boarddata:bA');
    g.onsuccess = () => resolve(g.result && Array.isArray(g.result.objects) ? g.result.objects.length : -1);
    g.onerror = () => reject(g.error);
  };
  req.onerror = () => reject(req.error);
})"""


def run():
    failures = []

    def check(name, cond):
        print(f"[{'OK' if cond else 'FAIL'}] {name}")
        if not cond:
            failures.append(name)

    objs = [{"id": f"bA-o{i}", "type": "pen", "color": "#000", "width": 2,
             "points": [{"x": 10 * i, "y": 10}, {"x": 10 * i + 5, "y": 20}]} for i in range(3)]

    with T48.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_context().new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"{BASE}/boards.html")
        T48.seed_split_db(page, [T48.light_board("bA", "Урок")], {"bA": {"objects": objs, "imageLib": []}})
        page.reload()
        page.evaluate(T48.BOOT_JS)
        page.wait_for_function("window.getDB && window.getDB().boards.length === 1")

        print("1. Отложенная выгрузка не трогает открытую доску")
        page.evaluate("() => window.openBoard('bA')")
        page.wait_for_function("window.getCurrentBoard() && Array.isArray(window.getCurrentBoard().objects) && window.getCurrentBoard().objects.length === 3")
        page.evaluate("() => unloadBoard(window.getCurrentBoard())")
        check("1: objects открытой доски на месте",
              page.evaluate("() => Array.isArray(window.getCurrentBoard().objects) && window.getCurrentBoard().objects.length === 3"))
        page.evaluate("() => window.boardsRedraw()")
        page.wait_for_timeout(150)
        check("1: кадр после этого не упал", not errors)

        print("2. Открытие выгруженной доски читает её с диска")
        page.evaluate("() => window.backToList()")
        page.wait_for_function("window.getDB().boards[0].objects === undefined")
        page.evaluate("() => { const b = window.getDB().boards[0]; openBoardReady(b, 'bA'); }")
        page.wait_for_function("window.getCurrentBoard() && window.getCurrentBoard().id === 'bA' && Array.isArray(window.getCurrentBoard().objects)")
        page.wait_for_timeout(300)
        check("2: на доске три объекта, а не пусто",
              page.evaluate("() => window.getCurrentBoard().objects.length") == 3)

        print("3. Сохранение после такого открытия не затирает урок")
        page.evaluate("() => { touchBoard(window.getCurrentBoard()); saveDB(); }")
        page.wait_for_timeout(1200)
        check("3: на диске три объекта", page.evaluate(READ_DISK) == 3)
        check("нет ошибок на странице", not errors)
        if errors:
            print("   ", errors[:3])
        browser.close()

    print()
    print("ИТОГ: всё прошло" if not failures else f"ИТОГ: {len(failures)} проверок провалено — {failures}")
    return not failures


if __name__ == "__main__":
    sys.exit(0 if run() else 1)
