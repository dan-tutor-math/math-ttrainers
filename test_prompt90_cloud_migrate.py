"""
Промпт №90: все доски — на сервер (cloud-migrate.js) и уборка мусора в хранилище картинок.

Supabase подменён заглушкой (база и хранилище файлов). Проверяем: доски
браузера сами уезжают на сервер облачными — строка в boards, объекты в
board_objects, картинки уходят ключами img:, а не base64; после переноса
доска выгружается из памяти, в браузере у неё ключи и cloudBoardId.
Уборка: не идёт, пока не все доски на сервере; удаляет то, что назвал
сервер, кроме картинок панели заметок. Без хранилища картинок доска не
переносится вовсе.
"""
import os
import subprocess
import sys
import time
import contextlib
import http.client
import json
import base64

from playwright.sync_api import sync_playwright

PORT = 9002
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
  // список досок показывает вход в облако (boards-cloud.js); без него — сами
  document.getElementById('screenList').style.display = 'flex';
}
"""

fails = []

fails = []


def check(cond, msg):
    print(("OK   " if cond else "FAIL ") + msg)
    if not cond:
        fails.append(msg)


PNG = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP4z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==")
DATA = "data:image/png;base64," + base64.b64encode(PNG).decode()

STUB_JS = """(storageFails) => {
  window.CURRENT_USER = { id: 'u1' };
  window.IMG_BASE_URL = 'http://localhost:9002/fakestore/';
  const log = window.__log = { boards: [], rows: [], removed: [], up: [] };
  let n = 0;
  window.SB = {
    storage: { from: () => ({
      upload: async (path) => storageFails ? { data: null, error: { message: 'Bucket not found' } } : (log.up.push(path), { data: { path }, error: null }),
      remove: async (names) => { log.removed.push(...names); return { data: names, error: null }; },
    }) },
    from: (table) => ({
      insert: (row) => ({ select: () => ({ single: async () => { log.boards.push(row); return { data: { id: 'cb' + (++n) }, error: null }; } }) }),
      upsert: async (rows) => { log.rows.push(...rows); return { error: null }; },
    }),
    rpc: async (name) => ({ data: [{ name: 'u1/garbage.png' }, { name: 'u1/keep.png' }], error: null }),
  };
}"""


def stroke(page, x, y):
    page.evaluate("() => document.querySelector('[data-tool=pen]').click()")
    page.mouse.move(x, y)
    page.mouse.down()
    for i in range(8):
        page.mouse.move(x + i * 14, y + (i % 2) * 8)
    page.mouse.up()
    page.wait_for_timeout(300)


def new_board(page, with_image, src=None):
    page.click("#blCreateBoard")
    page.wait_for_timeout(600)
    stroke(page, 500, 400)
    if with_image:
        page.evaluate("(src) => { B.objects.push({ id: uid(), type: 'image', src, points: [{ x: 100, y: 100 }], w: 60, h: 60 }); saveDB(); }", src or DATA)
    page.wait_for_timeout(400)
    page.evaluate("() => backToList()")
    page.wait_for_timeout(500)


def main():
    exe = os.environ.get("PW_CHROMIUM") or None
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch(executable_path=exe)
        ctx = browser.new_context(viewport={"width": 1280, "height": 800})
        ctx.route("http://localhost:9002/fakestore/**", lambda r: r.fulfill(
            status=200, body=PNG, headers={"Content-Type": "image/png", "Access-Control-Allow-Origin": "*"}))
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"{BASE}/boards.html")
        page.evaluate(BOOT_JS)
        page.wait_for_timeout(400)
        new_board(page, True)
        new_board(page, False)

        page.evaluate(STUB_JS, False)
        res = page.evaluate("() => CloudMigrate.run()")
        log = page.evaluate("() => window.__log")
        print("перенос:", res, "строк boards:", len(log["boards"]), "объектов:", len(log["rows"]))
        check(res.get("moved") == 2 and len(log["boards"]) == 2, "обе доски перенесены, по строке в boards")
        rows_json = json.dumps(log["rows"])
        check(len(log["rows"]) >= 3 and "data:image" not in rows_json and '"img:u1/' in rows_json,
              "объекты ушли в board_objects, картинка — ключом img:, без base64")
        st = page.evaluate("""async () => { const out = [];
          for (const b of getDB().boards) { const h = await idbGet('boarddata:' + b.id);
            out.push([b.cloudBoardId || null, b.cloudRole || null, b.objects === undefined, JSON.stringify(h.objects).includes('data:image')]); }
          return out; }""")
        print("доски:", st)
        check(all(x[0] and x[1] == "owner" for x in st), "у досок в браузере cloudBoardId и роль владельца")
        check(all(x[2] for x in st) and not any(x[3] for x in st), "после переноса доски выгружены из памяти, на диске ключи, а не base64")
        check(page.evaluate("() => CloudMigrate.run()").get("moved") == 0, "повторный запуск ничего не переносит заново")

        # уборка: пока есть доска не на сервере — не идёт
        page.evaluate("() => { getDB().boards.push({ id: 'loc1', name: 'местная', createdAt: Date.now(), updatedAt: Date.now() }); }")
        g1 = page.evaluate("() => ImageStore.gc(true)")
        check(g1.get("skipped") == "не все доски на сервере" and not page.evaluate("() => window.__log.removed.length"),
              "уборка не идёт, пока не все доски на сервере")
        page.evaluate("""() => { getDB().boards = getDB().boards.filter(b => b.id !== 'loc1');
          getDB().boards[0].refPanel = { imageObjects: [{ id: 'r1', type: 'image', src: 'img:u1/keep.png' }] }; }""")
        g2 = page.evaluate("() => ImageStore.gc(true)")
        removed = page.evaluate("() => window.__log.removed")
        print("уборка:", g2, removed)
        check(removed == ["u1/garbage.png"], "уборка удалила мусор и не тронула картинку панели заметок")

        # без хранилища картинок доска с новой картинкой не переносится
        other = page.evaluate("() => { const c = document.createElement('canvas'); c.width = c.height = 3; c.getContext('2d').fillRect(0, 0, 2, 2); return c.toDataURL(); }")
        new_board(page, True, other)
        page.evaluate(STUB_JS, True)
        page.evaluate("() => CloudMigrate.run()")
        log2 = page.evaluate("() => window.__log")
        local = page.evaluate("() => getDB().boards.filter(b => !b.cloudBoardId).length")
        check(len(log2["boards"]) == 0 and len(log2["rows"]) == 0 and local == 1, "без хранилища картинок доска остаётся в браузере, в базу ничего не ушло")

        check(not errors, "без ошибок на странице" + (": " + "; ".join(errors[:3]) if errors else ""))
        browser.close()
    print("\nИТОГ:", "ВСЁ ХОРОШО" if not fails else f"ПРОВАЛОВ {len(fails)}")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
