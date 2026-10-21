"""
Корзина досок.

«Удалить» больше не стирает доску сразу: 5 дней она лежит в «Корзине»
(левая колонка), откуда её можно вернуть; потом — или по «Удалить
навсегда» — стирается целиком, а облачная своя ещё и на сервере
(boards-trash-schema.sql, хуки в boards-cloud.js).

Сервера в проверке нет: window.SB подменён заглушкой, которая записывает
вызовы функций базы (rpc) и отдаёт заданный список строк boards. Сам SQL
проверяется отдельно, на настоящем PostgreSQL (см. HANDOFF, «корзина досок»).

Проверяем:
  1. При старте просроченное (> 5 дней) стирается насовсем, на сервер уходит
     boards_delete_now, вход досылает boards_purge_trash; свежее — в корзине.
  2. «Удалить» в меню: без подтверждения, доска в корзине, внизу «Вернуть»;
     «Вернуть» возвращает. Своя облачная — boards_trash на сервер.
  3. Вторая карточка той же облачной доски: удаление одной сервер не трогает.
  4. Удаление папки: подтверждение, папка уходит, её доски — в корзину;
     восстановленная доска возвращается в «Все доски».
  5. В корзине щелчок отмечает, «Восстановить» (boards_restore), «Удалить
     навсегда» (boards_delete_now, след «cloud» против воскрешения).
  6. Импорт с сервера: удалённая на другом устройстве — в корзину здесь,
     возвращённая там — возвращается здесь; стёртая насовсем не заводится
     заново; доска, которой на сервере нет, — в корзину.
  7. Перетаскивание доски на «Корзину» слева.
  8. После перезагрузки корзина на месте, доска из корзины по адресу
     #board= не открывается.
"""
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8972
BASE = f"http://127.0.0.1:{PORT}"
DAY = 24 * 3600 * 1000


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


# Заглушка сервера: rpc записываются, boards отдаёт window.__rows
FAKE_SB_JS = """
() => {
  window.__rpcLog = [];
  window.__rows = [];
  const ok = (data) => Promise.resolve({ data, error: null });
  window.SB = {
    rpc: (name, args) => { window.__rpcLog.push([name, JSON.parse(JSON.stringify(args || {}))]); return ok(1); },
    from: (t) => ({
      select: () => {
        const p = ok(t === 'boards' ? window.__rows.slice() : []);
        p.eq = () => ok([]);
        return p;
      },
    }),
  };
  window.CURRENT_USER = { id: 'me', email: 'me@example.com' };
}
"""

BOOT_JS = """
() => {
  const gate = document.getElementById('authGate');
  if (gate) gate.style.display = 'none';
  document.getElementById('screenList').style.display = '';
  if (window.boardsAppBoot) window.boardsAppBoot();
}
"""

SEED_JS = """
(DAY) => new Promise((resolve, reject) => {
  const req = indexedDB.open('ogeBoardsDB', 1);
  req.onupgradeneeded = () => req.result.createObjectStore('state');
  req.onsuccess = () => {
    const tx = req.result.transaction('state', 'readwrite');
    const st = tx.objectStore('state');
    const now = Date.now();
    const lite = (id, name, extra) => Object.assign({ id, name, folderId: null, createdAt: 1000, updatedAt: 1000,
      lastOpenedAt: null, rev: 1, cellSize: 24, sheetCols: 76, sheetRows: 54, pageOrder: 'h',
      recentColors: [], colorUsage: {}, view: { x: 0, y: 0, zoom: 1 } }, extra || {});
    const boards = [
      lite('b1', 'Своя локальная'),
      lite('b2', 'В папке', { folderId: 'fA' }),
      lite('c1', 'Облачная моя', { cloudBoardId: 'cb1', cloudRole: 'owner' }),
      lite('c2', 'Облачная чужая', { cloudBoardId: 'cb2', cloudRole: 'editor' }),
      lite('d1', 'Дубль 1', { cloudBoardId: 'cbD', cloudRole: 'owner' }),
      lite('d2', 'Дубль 2', { cloudBoardId: 'cbD', cloudRole: 'owner' }),
      lite('e1', 'Пропала с сервера', { cloudBoardId: 'cbMissing', cloudRole: 'editor' }),
      lite('old', 'Старая в корзине', { cloudBoardId: 'cbOld', cloudRole: 'owner', trashedAt: now - 6 * DAY }),
      lite('fresh', 'Свежая в корзине', { trashedAt: now - 1 * DAY }),
    ];
    st.put({ __v: 2, folders: [{ id: 'fA', name: 'Архив', createdAt: 1000 }], boards, deleted: [], sortMode: 'my' }, 'db');
    boards.forEach(b => st.put({ objects: [{ id: 's_' + b.id, type: 'pen', points: [{x:1,y:1},{x:2,y:2}] }], imageLib: [] }, 'boarddata:' + b.id));
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  };
  req.onerror = () => reject(req.error);
})
"""


def read_payload(page, board_id):
    return page.evaluate(
        """(id) => new Promise((resolve, reject) => {
            const req = indexedDB.open('ogeBoardsDB');
            req.onsuccess = () => {
              const g = req.result.transaction('state', 'readonly').objectStore('state').get('boarddata:' + id);
              g.onsuccess = () => resolve(g.result || null);
              g.onerror = () => reject(g.error);
            };
            req.onerror = () => reject(req.error);
        })""",
        board_id,
    )


def card(bid):
    return f'#blGrid .bl-card[data-board="{bid}"]'


def run():
    failures = []

    def check(name, cond):
        status = "OK" if cond else "FAIL"
        print(f"[{status}] {name}")
        if not cond:
            failures.append(name)

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={"width": 1280, "height": 860})
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"{BASE}/boards.html")
        page.evaluate(SEED_JS, DAY)
        page.reload()
        page.wait_for_timeout(500)          # пусть настоящий вход отработает до подмены
        page.evaluate(FAKE_SB_JS)
        page.evaluate(BOOT_JS)
        page.wait_for_function("window.getDB && window.getDB().boards.length >= 8")
        page.wait_for_timeout(500)

        board = lambda bid: page.evaluate("(id) => window.getDB().boards.find(b => b.id === id) || null", bid)
        rpc = lambda: page.evaluate("() => window.__rpcLog")
        clear_rpc = lambda: page.evaluate("() => { window.__rpcLog.length = 0; }")
        visible = lambda: page.evaluate("() => [...document.querySelectorAll('#blGrid .bl-card[data-board]')].map(c => c.dataset.board)")

        # ── 1. старт ──
        check("просроченная (6 дней) доска стёрта насовсем", board("old") is None)
        check("…и её запись с диска", read_payload(page, "old") is None)
        log = rpc()
        check("на сервер ушло стирание просроченной своей облачной",
              any(n == "boards_delete_now" and "cbOld" in a.get("p_boards", []) for n, a in log))
        check("вход досылает boards_purge_trash", any(n == "boards_purge_trash" for n, a in log))
        check("свежая (1 день) — в корзине", (board("fresh") or {}).get("trashedAt", 0) > 0)
        check("в «Всех досках» корзины не видно", "fresh" not in visible() and "b1" in visible())
        check("счётчик «Корзина» = 1",
              page.inner_text('.bl-nav-item[data-nav="__trash"] .cnt') == "1")

        # ── 2. удаление из меню ──
        clear_rpc()
        dialogs = []
        page.on("dialog", lambda d: (dialogs.append(d.message), d.accept()))
        page.click(card("b1") + " .bl-card-menu")
        page.click('.bl-menu-pop button[data-act="delete"]')
        page.wait_for_timeout(300)
        check("доска удаляется без подтверждения", not dialogs)
        check("доска в корзине, из списка пропала", (board("b1") or {}).get("trashedAt", 0) > 0 and "b1" not in visible())
        check("штрихи на диске целы", len((read_payload(page, "b1") or {}).get("objects", [])) == 1)
        check("внизу «Доска в корзине» с «Вернуть»",
              page.evaluate("() => !document.getElementById('blToast').hidden") and "Доска в корзине" in page.inner_text("#blToast"))
        page.click("#blToastUndo")
        page.wait_for_timeout(200)
        check("«Вернуть» возвращает доску", not (board("b1") or {}).get("trashedAt") and "b1" in visible())
        check("локальная доска на сервер ничего не шлёт", rpc() == [])

        page.click(card("c1") + " .bl-card-menu")
        page.click('.bl-menu-pop button[data-act="delete"]')
        page.wait_for_timeout(400)
        check("своя облачная: boards_trash на сервер", ["boards_trash", {"p_boards": ["cb1"]}] in rpc())
        check("после ответа сервера флаг «не дошло» снят", not (board("c1") or {}).get("cloudTrashPending"))

        # ── 3. дубль ──
        clear_rpc()
        page.click(card("d1") + " .bl-card-menu")
        page.click('.bl-menu-pop button[data-act="delete"]')
        page.wait_for_timeout(300)
        check("дубль в корзине", (board("d1") or {}).get("trashedAt", 0) > 0)
        check("пока жива вторая карточка, сервер не трогаем", rpc() == [])

        # ── 4. папка ──
        dialogs.clear()
        page.click('#blGrid .bl-card[data-folder="fA"] .bl-card-menu')
        page.click('.bl-menu-pop button[data-act="delete"]')
        page.wait_for_timeout(300)
        check("удаление папки спрашивает подтверждение", len(dialogs) == 1 and "корзину" in dialogs[0])
        check("папка удалена", page.evaluate("() => !window.getDB().folders.some(f => f.id === 'fA')"))
        check("её доска — в корзине", (board("b2") or {}).get("trashedAt", 0) > 0)

        # ── 5. корзина ──
        clear_rpc()
        page.click('.bl-nav-item[data-nav="__trash"]')
        page.wait_for_selector(card("c1"))
        check("в корзине свежеудалённые сверху", visible()[:1] == ["b2"])
        check("подпись «удалится через 5 дней»", "удалится через 5 дней" in page.inner_text(card("c1")))
        page.click(card("c1"))
        check("в корзине щелчок отмечает, а не открывает",
              page.evaluate("() => window.__blSelection()") == ["b:c1"]
              and page.evaluate("() => document.getElementById('screenBoard').style.display !== 'block'"))
        check("на панели «Восстановить» и «Удалить навсегда», нет «В папку»",
              page.is_visible("#blSelRestore") and page.is_visible("#blSelPurge")
              and not page.is_visible("#blSelMove") and not page.is_visible("#blSelDelete") and not page.is_visible("#blSelTabs"))
        check("плашка «Вернуть» не наезжает на панель выбора", not page.is_visible("#blToast"))
        page.click(card("b2"), modifiers=["Meta"])
        page.click("#blSelRestore")
        page.wait_for_timeout(400)
        check("«Восстановить» вернула обе", not (board("c1") or {}).get("trashedAt") and not (board("b2") or {}).get("trashedAt"))
        check("доска из удалённой папки вернулась в «Все доски»", (board("b2") or {}).get("folderId") is None)
        check("своя облачная: boards_restore на сервер", ["boards_restore", {"p_boards": ["cb1"]}] in rpc())

        # навсегда: чужая облачная и дубль
        page.click('.bl-nav-item[data-nav="__root"]')
        page.click(card("c2") + " .bl-card-menu")
        page.click('.bl-menu-pop button[data-act="delete"]')
        page.click('.bl-nav-item[data-nav="__trash"]')
        page.wait_for_selector(card("c2"))
        clear_rpc()
        dialogs.clear()
        page.click(card("c2"))
        page.click(card("d1"))
        page.click("#blSelPurge")
        page.wait_for_timeout(400)
        check("«Удалить навсегда» спрашивает подтверждение", len(dialogs) == 1 and "навсегда" in dialogs[0])
        check("стёрты насовсем", board("c2") is None and board("d1") is None)
        check("записи с диска подчищены", read_payload(page, "c2") is None and read_payload(page, "d1") is None)
        check("на сервер — boards_delete_now только для чужой облачной (дубль жив)",
              rpc() == [["boards_delete_now", {"p_boards": ["cb2"]}]])
        check("след «cloud» против воскрешения",
              page.evaluate("() => window.getDB().deleted.some(d => d.kind === 'cloud' && d.id === 'cb2')"))

        # ── 6. импорт с сервера ──
        page.evaluate("""() => { window.__rows = [
            { id: 'cb1', title: 'Облачная моя', owner: 'me', created_at: '2026-01-01T00:00:00Z', trashed_at: new Date(Date.now() - 3600e3).toISOString() },
            { id: 'cb2', title: 'Облачная чужая', owner: 'x', created_at: '2026-01-01T00:00:00Z', trashed_at: null },
            { id: 'cbD', title: 'Дубль', owner: 'me', created_at: '2026-01-01T00:00:00Z', trashed_at: null },
            { id: 'cbNew', title: 'Новая общая', owner: 'x', created_at: '2026-01-01T00:00:00Z', trashed_at: null },
            { id: 'cbTr', title: 'В корзине у владельца', owner: 'x', created_at: '2026-01-01T00:00:00Z', trashed_at: new Date().toISOString() },
        ]; }""")
        page.evaluate("() => window.cloudImportSharedBoards()")
        page.wait_for_timeout(300)
        c1 = board("c1") or {}
        check("удалённая на другом устройстве — здесь в корзине (пометка «сервер»)",
              c1.get("trashedAt", 0) > 0 and c1.get("trashSource") == "server")
        check("стёртая здесь насовсем заново не заводится",
              not page.evaluate("() => window.getDB().boards.some(b => b.cloudBoardId === 'cb2')"))
        check("новая общая доска появилась",
              page.evaluate("() => window.getDB().boards.some(b => b.cloudBoardId === 'cbNew' && !b.trashedAt)"))
        check("доска из корзины владельца не заводится",
              not page.evaluate("() => window.getDB().boards.some(b => b.cloudBoardId === 'cbTr')"))
        e1 = board("e1") or {}
        check("доска, которой на сервере нет, — в корзину, а не насовсем",
              e1.get("trashedAt", 0) > 0 and e1.get("trashSource") == "server")
        page.evaluate("() => { window.__rows[0].trashed_at = null; }")
        page.evaluate("() => window.cloudImportSharedBoards()")
        page.wait_for_timeout(300)
        check("возвращённая на другом устройстве — возвращается и здесь", not (board("c1") or {}).get("trashedAt"))

        # просрочка доски, которую в корзину положил сервер, — без вызова сервера
        clear_rpc()
        page.evaluate(f"() => {{ window.getDB().boards.find(b => b.id === 'e1').trashedAt = Date.now() - 6 * {DAY}; }}")
        page.evaluate("() => window.__purgeExpiredTrash()")
        check("просроченная «серверная» стёрта здесь", board("e1") is None)
        check("…и на сервер ничего не ушло", rpc() == [])

        # ── 7. перетаскивание на «Корзину» ──
        page.click('.bl-nav-item[data-nav="__root"]')
        page.wait_for_selector(card("b1"))
        src = page.locator(card("b1")).bounding_box()
        dst = page.locator('.bl-nav-item[data-nav="__trash"]').bounding_box()
        page.mouse.move(src["x"] + src["width"] / 2, src["y"] + src["height"] / 2)
        page.mouse.down()
        page.mouse.move(src["x"] + 30, src["y"] + 30, steps=3)
        page.mouse.move(dst["x"] + dst["width"] / 2, dst["y"] + dst["height"] / 2, steps=8)
        page.mouse.up()
        page.wait_for_timeout(400)
        check("доска, брошенная на «Корзину», — в корзине", (board("b1") or {}).get("trashedAt", 0) > 0)

        # ── 8. перезагрузка ──
        page.wait_for_timeout(600)
        page.goto(f"{BASE}/boards.html#board=b1")
        page.wait_for_timeout(500)
        page.evaluate(FAKE_SB_JS)
        page.evaluate(BOOT_JS)
        page.wait_for_function("window.getDB && window.getDB().boards.length > 0")
        page.wait_for_timeout(600)
        check("после перезагрузки доска в корзине", (board("b1") or {}).get("trashedAt", 0) > 0)
        check("доска из корзины по адресу #board= не открывается",
              page.evaluate("() => document.getElementById('screenBoard').style.display !== 'block'"))
        check("в «Всех досках» её нет", "b1" not in visible())

        check("ошибок JavaScript нет", not errors)
        if errors:
            print("\n".join(errors))
        browser.close()

    print()
    print("ИТОГ: всё прошло" if not failures else f"ИТОГ: провалено {len(failures)}")
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(run())
