"""
Уборка картинок досок не стирает то, что держит браузер (image-store.js,
localRefs / syncKeep / gc; таблица board_image_keep в boards-server-schema.sql).

Ссылок из буфера досок, версий доски, библиотеки картинок и панели заметок
в базе нет. Проверяем на заглушке Supabase (таблица и функция уборки
эмулируются как на сервере):
- устройство отмечает все эти ссылки в board_image_keep своим device;
- уборка удаляет только мусор: ни свои ссылки, ни ссылку другого
  устройства не трогает, а строку, не обновлявшуюся 60+ дней, не считает;
- убрали картинку из библиотеки и сменили буфер — их строки стёрты;
- у выгруженной доски библиотека читается с диска;
- таблицы нет — уборка всё равно не трогает ссылки этого браузера.
"""
import os
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 9021
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
  document.getElementById('screenList').style.display = 'flex';
}
"""

fails = []


def check(cond, msg):
    print(("OK   " if cond else "FAIL ") + msg)
    if not cond:
        fails.append(msg)


# заглушка Supabase: таблица board_image_keep и функция уборки — как на сервере
STUB_JS = """(noTable) => {
  window.CURRENT_USER = { id: 'u1' };
  window.IMG_BASE_URL = 'http://localhost:9021/fakestore/';
  const DAY = 24 * 3600 * 1000;
  const log = window.__log = { removed: [], rows: [
    { user_id: 'u1', device: 'other', name: 'u1/otherdev.png', seen_at: new Date().toISOString() },
    { user_id: 'u1', device: 'old', name: 'u1/stale.png', seen_at: new Date(Date.now() - 90 * DAY).toISOString() },
  ] };
  const CANDIDATES = ['u1/garbage.png', 'u1/clip.png', 'u1/lib.png', 'u1/ver.png', 'u1/versol.png',
                      'u1/panel.png', 'u1/otherdev.png', 'u1/stale.png'];
  function delBuilder() {
    const f = [];
    const b = {
      eq(c, v) { f.push(r => r[c] === v); return b; },
      lt(c, v) { f.push(r => r[c] < v); return b; },
      then(ok, bad) { log.rows = log.rows.filter(r => !f.every(fn => fn(r))); return Promise.resolve({ error: null }).then(ok, bad); },
    };
    return b;
  }
  window.SB = {
    storage: { from: () => ({
      upload: async (path) => ({ data: { path }, error: null }),
      remove: async (names) => { log.removed.push(...names); return { data: names, error: null }; },
    }) },
    from: (table) => noTable ? ({
      upsert: async () => ({ error: { message: 'relation "board_image_keep" does not exist' } }),
      delete: () => delBuilder(),
    }) : ({
      upsert: async (rows) => {
        rows.forEach(row => {
          const i = log.rows.findIndex(r => r.user_id === row.user_id && r.device === row.device && r.name === row.name);
          if (i >= 0) log.rows[i] = row; else log.rows.push(row);
        });
        return { error: null };
      },
      delete: () => delBuilder(),
    }),
    rpc: async () => ({ data: CANDIDATES
      .filter(n => !log.rows.some(r => r.name === n && Date.now() - Date.parse(r.seen_at) < 60 * DAY))
      .map(name => ({ name })), error: null }),
  };
}"""

SETUP_JS = """async () => {
  B.cloudBoardId = 'cb1';
  B.imageLib = [{ id: 'l1', src: 'img:u1/lib.png', createdAt: Date.now() }];
  B.refPanel.imageObjects = [{ id: 'p1', type: 'image', src: 'img:u1/panel.png' }];
  setClipboard([{ id: 'c1', type: 'image', src: 'img:u1/clip.png', points: [{ x: 0, y: 0 }], w: 10, h: 10 }], 'доска');
  await idbPut('cloudver:cb1', { list: [{ slot: 0, at: Date.now() }], pool: [] });
  await idbPut('cloudver:cb1:0', { at: Date.now(), objects: [
    { id: 'v1', type: 'image', src: 'img:u1/ver.png', sol: { src: 'img:u1/versol.png' } }] });
  saveDB();
  await new Promise(r => setTimeout(r, 400));
}"""

MINE = ["u1/clip.png", "u1/lib.png", "u1/panel.png", "u1/ver.png", "u1/versol.png"]


def main():
    exe = os.environ.get("PW_CHROMIUM") or None
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch(executable_path=exe)
        ctx = browser.new_context(viewport={"width": 1280, "height": 800})
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"{BASE}/boards.html")
        page.evaluate(BOOT_JS)
        page.wait_for_timeout(400)
        page.click("#blCreateBoard")
        page.wait_for_timeout(700)
        page.evaluate(STUB_JS, False)
        page.evaluate(SETUP_JS)

        refs = sorted(page.evaluate("async () => Array.from(await ImageStore.localRefs())"))
        print("ссылки браузера:", refs)
        check(refs == MINE, "найдены буфер, библиотека, панель заметок, версия и разбор в версии")

        g = page.evaluate("() => ImageStore.gc(true)")
        log = page.evaluate("() => window.__log")
        print("уборка:", g, log["removed"])
        dev = page.evaluate("() => localStorage.getItem('boardsImgDevice')")
        mine_rows = sorted(r["name"] for r in log["rows"] if r["device"] == dev)
        check(g.get("kept") is True and mine_rows == MINE, "ссылки этого устройства отмечены на сервере своим device")
        check(sorted(log["removed"]) == ["u1/garbage.png", "u1/stale.png"],
              "уборка удалила только мусор и файл со строкой старше 60 дней")
        names = [r["name"] for r in log["rows"]]
        check("u1/otherdev.png" in names and "u1/stale.png" not in names,
              "строка другого устройства цела, устаревшая строка стёрта")

        # убрали картинку из библиотеки и скопировали другое — строки обновились
        page.evaluate("""async () => { B.imageLib = []; saveDB();
          setClipboard([{ id: 'c2', type: 'image', src: 'img:u1/clip2.png', points: [{ x: 0, y: 0 }], w: 10, h: 10 }], 'доска');
          await new Promise(r => setTimeout(r, 400)); }""")
        check(page.evaluate("() => ImageStore.keepTick()") is True, "новый буфер замечен часовой проверкой")
        log = page.evaluate("() => window.__log")
        mine_rows = sorted(r["name"] for r in log["rows"] if r["device"] == dev)
        print("строки устройства:", mine_rows)
        check(mine_rows == ["u1/clip2.png", "u1/panel.png", "u1/ver.png", "u1/versol.png"],
              "старый буфер и убранная из библиотеки картинка больше не держатся")

        # выгруженная доска: библиотека — с диска
        page.evaluate("""async () => { B.imageLib = [{ id: 'l2', src: 'img:u1/lib2.png', createdAt: Date.now() }]; saveDB();
          await new Promise(r => setTimeout(r, 400)); backToList(); await new Promise(r => setTimeout(r, 1200)); }""")
        st = page.evaluate("async () => ({ unloaded: getDB().boards[0].imageLib === undefined, refs: Array.from(await ImageStore.localRefs()) })")
        print("выгружена:", st)
        check(st["unloaded"] and "u1/lib2.png" in st["refs"], "у выгруженной доски библиотека прочитана с диска")

        # таблицы на сервере нет — свои ссылки всё равно не удаляются
        page.evaluate(STUB_JS, True)
        g = page.evaluate("() => ImageStore.gc(true)")
        removed = sorted(page.evaluate("() => window.__log.removed"))
        print("без таблицы:", g, removed)
        check(g.get("kept") is False and "u1/garbage.png" in removed
              and not any(n in removed for n in ["u1/clip2.png", "u1/lib2.png", "u1/panel.png", "u1/ver.png"]),
              "без таблицы уборка идёт, но ссылки этого браузера не трогает")

        check(not errors, "без ошибок на странице" + (": " + "; ".join(errors[:3]) if errors else ""))
        browser.close()
    print("\nИТОГ:", "ВСЁ ХОРОШО" if not fails else f"ПРОВАЛОВ {len(fails)}")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
