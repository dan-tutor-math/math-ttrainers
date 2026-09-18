"""
Промпт №49: если открытие какой-то ОДНОЙ доски роняет вкладку (браузер сам
её перезагружает после краша — OOM и т.п.), в адресе остаётся #board=<id>.
Код на старте страницы читает этот хэш и тут же открывает ту же доску
снова — получается бесконечный цикл крах → перезагрузка → снова открытие
той же доски → снова крах, из которого нельзя выбраться обычными
действиями в интерфейсе (человек не успевает даже увидеть список досок).
Поймали это живьём на реальной доске пользователя в этой же сессии.

Метка в sessionStorage переживает такую перезагрузку (это та же вкладка) —
если предыдущая попытка открыть ИМЕННО эту доску по хэшу не была помечена
как «пережитая» (обычно доступно через 4 секунды после начала открытия),
следующий заход не повторяет попытку, а остаётся на списке и убирает хэш.

Настоящий краш-перезапуск браузера всегда полностью перезагружает вкладку
(заново выполняет весь JS с нуля, __boardsBooted снова false) — поэтому
здесь везде используется page.reload() с заранее выставленным хэшем, а не
page.goto() с другим хэшем той же страницы: смена только хэша у Playwright
(как и у настоящего браузера) может остаться навигацией внутри того же
документа без перезапуска скриптов, и не воспроизводит настоящий краш.

Проверяем:
  1. Обычный (первый) заход по хэшу с доской в адресе — доска открывается
     как и раньше, никакой регрессии для нормального использования.
  2. Если «перезагрузить» страницу ДО того, как истекли контрольные 4
     секунды (эмулируем крах: та же sessionStorage, тот же хэш) — второй
     раз доска НЕ открывается автоматически, а хэш очищается — цикл рвётся.
  3. Если между двумя заходами подождать больше 4 секунд (эмулируем
     благополучное открытие) — следующая перезагрузка с тем же хэшем
     снова открывает доску как обычно, никакой лишней «блокировки навсегда».
"""
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8977
BASE = f"http://127.0.0.1:{PORT}"


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        for _ in range(50):
            try:
                conn = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                conn.request("GET", "/boards.html")
                conn.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        else:
            raise RuntimeError("локальный сервер не поднялся")
        yield
    finally:
        proc.terminate()
        proc.wait(timeout=5)


BOOT_JS = """
() => {
  const gate = document.getElementById('authGate');
  if (gate) gate.style.display = 'none';
  window.boardsAppBoot();
}
"""


def light_board(board_id, name):
    return {
        "id": board_id, "name": name, "folderId": None,
        "createdAt": 1000, "updatedAt": 1000, "lastOpenedAt": None, "rev": 1,
        "cellSize": 24, "sheetCols": 76, "sheetRows": 54, "pageOrder": "h",
        "recentColors": [], "colorUsage": {},
    }


def seed_split_db(page, index_boards, payloads):
    page.evaluate(
        """([index_boards, payloads]) => new Promise((resolve, reject) => {
            const req = indexedDB.open('ogeBoardsDB', 1);
            req.onupgradeneeded = () => {
              const idb = req.result;
              if (!idb.objectStoreNames.contains('state')) idb.createObjectStore('state');
            };
            req.onsuccess = () => {
              const tx = req.result.transaction('state', 'readwrite');
              const store = tx.objectStore('state');
              store.put({ __v: 2, folders: [], boards: index_boards, deleted: [], sortMode: 'my' }, 'db');
              Object.keys(payloads).forEach(id => store.put(payloads[id], 'boarddata:' + id));
              tx.oncomplete = () => resolve(true);
              tx.onerror = () => reject(tx.error);
            };
            req.onerror = () => reject(req.error);
        })""",
        [index_boards, payloads],
    )


def goto_with_hash(page, url_hash):
    """Полная перезагрузка страницы с заданным хэшем в адресе — так, как
    это делает настоящий краш-перезапуск браузера (весь JS выполняется
    заново, __boardsBooted снова false). Просто page.goto(url#hash) при уже
    открытом том же документе может остаться навигацией внутри документа
    без перезапуска скриптов — этого недостаточно для проверки защиты."""
    page.evaluate(f"() => {{ location.hash = {url_hash!r}; }}")
    page.reload()


def run():
    failures = []

    def check(name, cond):
        status = "OK" if cond else "FAIL"
        print(f"[{status}] {name}")
        if not cond:
            failures.append(name)

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        page = context.new_page()
        page.goto(f"{BASE}/boards.html")

        index_boards = [light_board("bH", "Тяжёлая доска")]
        payloads = {"bH": {"objects": [{"id": "o0", "type": "pen", "points": [{"x": 1, "y": 1}, {"x": 2, "y": 2}]}], "imageLib": []}}
        seed_split_db(page, index_boards, payloads)

        # ── 1. обычный первый заход с доской в адресе — открывается как обычно ──
        goto_with_hash(page, "board=bH")
        page.evaluate(BOOT_JS)
        page.wait_for_function("window.getCurrentBoard() && window.getCurrentBoard().id === 'bH'", timeout=5000)
        check("первый заход по хэшу открывает доску как обычно", page.evaluate("() => window.getCurrentBoard().id") == "bH")
        guard_set = page.evaluate("() => sessionStorage.getItem('boardsAutoOpenAttempt')")
        check("метка попытки выставлена сразу после открытия (ещё не прошло 4 сек)", guard_set == "bH")

        # ── 2. «краш» ДО истечения 4 секунд — полная перезагрузка той же
        # вкладки с тем же хэшем (sessionStorage переживает такую
        # перезагрузку — как при настоящем краш-перезапуске) ────────────────
        page.reload()  # хэш от шага 1 уже в адресе, менять не нужно
        page.evaluate(BOOT_JS)
        page.wait_for_timeout(300)
        opened_again = page.evaluate("() => window.getCurrentBoard()")
        check("после «краш»-перезагрузки (в пределах 4 сек) доска НЕ открывается автоматически повторно", opened_again is None)
        hash_cleared = page.evaluate("() => location.hash")
        check("хэш при этом очищен — обычный F5 больше не вернёт в тот же цикл", hash_cleared == "")
        guard_cleared = page.evaluate("() => sessionStorage.getItem('boardsAutoOpenAttempt')")
        check("метка попытки снята после срабатывания защиты", guard_cleared is None)

        # ── 3. благополучный сценарий: открыли доску, подождали дольше 4 сек
        # (успела «пережить» открытие) — следующая перезагрузка с тем же
        # хэшем открывает доску нормально, никакой лишней блокировки ────────
        goto_with_hash(page, "board=bH")
        page.evaluate(BOOT_JS)
        page.wait_for_function("window.getCurrentBoard() && window.getCurrentBoard().id === 'bH'", timeout=5000)
        page.wait_for_timeout(4300)  # переживаем контрольные 4 секунды
        guard_after_survive = page.evaluate("() => sessionStorage.getItem('boardsAutoOpenAttempt')")
        check("метка снята сама по себе после успешного открытия (пережили 4 сек)", guard_after_survive is None)

        page.reload()  # хэш от шага 3 уже в адресе
        page.evaluate(BOOT_JS)
        page.wait_for_function("window.getCurrentBoard() && window.getCurrentBoard().id === 'bH'", timeout=5000)
        check("после благополучного открытия обычная перезагрузка снова открывает доску (не заблокировано навсегда)", page.evaluate("() => window.getCurrentBoard().id") == "bH")

        context.close()
        browser.close()

    print()
    if failures:
        print(f"ИТОГ: {len(failures)} проверок провалено — {failures}")
    else:
        print("ИТОГ: всё прошло")
    return not failures


if __name__ == "__main__":
    ok = run()
    sys.exit(0 if ok else 1)
