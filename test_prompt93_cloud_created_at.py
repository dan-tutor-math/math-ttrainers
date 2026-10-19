"""
Промпт №93: у досок, подтянутых из облака (cloudImportSharedBoards),
«Создана» совпадала с моментом открытия страницы — заглушке ставили
nowTs(). Теперь время берётся из boards.created_at. Проверяем:

  1. Новая заглушка получает время создания из базы.
  2. Заглушка, заведённая раньше с временем «сейчас», чинится на месте.
  3. Доска, перенесённая из браузера (№90), сохраняет своё более раннее
     время — строка в базе моложе её.
  4. Повторный импорт ничего не дублирует.
"""
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8993
BASE = f"http://127.0.0.1:{PORT}"


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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

# база: три доски; select/eq возвращают строки как Supabase
FAKE_SB_JS = """
(rows) => {
  window.CURRENT_USER = { id: 'me', email: 't@t' };
  const q = (data) => {
    const p = Promise.resolve({ data, error: null });
    return { select: () => q(data), eq: () => q(data), then: p.then.bind(p), catch: p.catch.bind(p) };
  };
  window.SB = { from: (t) => t === 'boards' ? q(rows) : q([]) };
}
"""

T_RITA = "2026-09-01T10:00:00Z"
T_YULIA = "2026-08-15T12:30:00Z"
T_MIGR = "2026-10-15T09:00:00Z"


def run():
    failures = []

    def check(name, cond, extra=""):
        print(f"[{'OK' if cond else 'FAIL'}] {name}{(' — ' + str(extra)) if extra else ''}")
        if not cond:
            failures.append(name)

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(f"{BASE}/boards.html")
        page.evaluate(BOOT_JS)
        page.wait_for_function("window.getDB && Array.isArray(window.getDB().boards)")
        page.wait_for_timeout(300)

        # до импорта: заглушка Юли со временем «сейчас» (как до №93) и
        # перенесённая доска со своим старым временем
        page.evaluate("""() => {
            const DB = window.getDB(); const now = Date.now();
            DB.boards.push({ id: 'sY', name: 'Юля', createdAt: now, updatedAt: now, cloudBoardId: 'cy', cloudRole: 'editor' });
            DB.boards.push({ id: 'mG', name: 'Своя', createdAt: Date.parse('2026-03-01T00:00:00Z'), updatedAt: now, cloudBoardId: 'cm', cloudRole: 'owner' });
        }""")
        rows = [
            {"id": "cr", "title": "Рита1", "owner": "other", "created_at": T_RITA},
            {"id": "cy", "title": "Юля", "owner": "other", "created_at": T_YULIA},
            {"id": "cm", "title": "Своя", "owner": "me", "created_at": T_MIGR},
        ]
        page.evaluate(FAKE_SB_JS, rows)
        page.evaluate("() => window.cloudImportSharedBoards()")
        got = page.evaluate("""() => Object.fromEntries(window.getDB().boards
            .filter(b => b.cloudBoardId).map(b => [b.cloudBoardId, new Date(b.createdAt).toISOString()]))""")
        check("1. новая заглушка — время создания из базы", got.get("cr") == "2026-09-01T10:00:00.000Z", got.get("cr"))
        check("2. старая заглушка исправлена на время из базы", got.get("cy") == "2026-08-15T12:30:00.000Z", got.get("cy"))
        check("3. перенесённая доска сохранила своё более раннее время", got.get("cm") == "2026-03-01T00:00:00.000Z", got.get("cm"))

        page.evaluate("() => window.cloudImportSharedBoards()")
        n = page.evaluate("() => window.getDB().boards.filter(b => b.cloudBoardId === 'cr').length")
        check("4. повторный импорт не дублирует", n == 1, n)
        browser.close()

    print()
    if failures:
        print(f"ПРОВАЛЕНО: {len(failures)}")
        sys.exit(1)
    print("Все проверки пройдены")


if __name__ == "__main__":
    run()
