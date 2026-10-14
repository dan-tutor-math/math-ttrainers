"""
Промпт №88б: кнопка «Пересобрать хранилище» (HANDOFF.md, раздел 6).

Проверяем: файл-страховка скачивается и это архив всех досок; после
пересборки и перезагрузки доски, их штрихи и посторонние записи хранилища
(история версий, буфер) на месте, временная база удалена; пересборка,
оборванная после удаления старой базы, доводится до конца при следующей
загрузке страницы.
"""
import os
import subprocess
import sys
import time
import contextlib
import http.client
import json

from playwright.sync_api import sync_playwright

PORT = 8998
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


def check(cond, msg):
    print(("OK   " if cond else "FAIL ") + msg)

fails = []


def check(cond, msg):
    print(("OK   " if cond else "FAIL ") + msg)
    if not cond:
        fails.append(msg)


def stroke(page, x, y):
    page.evaluate("() => document.querySelector('[data-tool=pen]').click()")
    page.mouse.move(x, y)
    page.mouse.down()
    for i in range(10):
        page.mouse.move(x + i * 14, y + (i % 2) * 8)
    page.mouse.up()
    page.wait_for_timeout(400)


STATE_JS = """async () => {
  const idx = await idbGet('db');
  const out = { boards: [], extra: await idbGet('cloudver:test'), dbs: (await indexedDB.databases()).map(d => d.name),
                stage: localStorage.getItem('boardsRebuildStage') };
  for (const b of idx.boards){ const h = await idbGet('boarddata:' + b.id); out.boards.push([b.name, b.kind || '', (h && h.objects || []).filter(o => o.type === 'pen').length]); }
  out.boards.sort();
  return out;
}"""


def boot(page):
    page.evaluate(BOOT_JS)
    page.wait_for_timeout(700)


def main():
    exe = os.environ.get("PW_CHROMIUM") or None
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch(executable_path=exe)
        ctx = browser.new_context(viewport={"width": 1280, "height": 800}, accept_downloads=True)
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("dialog", lambda d: d.accept())
        page.goto(f"{BASE}/boards.html")
        boot(page)

        # обычная доска и презентация со штрихами, плюс посторонняя запись
        page.click("#blCreateBoard")
        page.wait_for_timeout(600)
        stroke(page, 500, 400)
        page.evaluate("() => backToList()")
        page.wait_for_timeout(400)
        page.click("#blCreateDeck")
        page.wait_for_timeout(700)
        stroke(page, 520, 420)
        stroke(page, 520, 470)
        page.evaluate("() => backToList()")
        page.wait_for_timeout(600)
        page.evaluate("() => idbPut('cloudver:test', { keep: 'x'.repeat(5000) })")
        before = page.evaluate(STATE_JS)
        print("до:", before["boards"])
        check(len(before["boards"]) == 2, "две доски до пересборки")

        # пересборка: файл-страховка, потом перезагрузка страницы
        with page.expect_download(timeout=20000) as dl:
            page.click("#blRebuild")
        path = dl.value.path()
        arch = json.load(open(path, encoding="utf-8"))
        check(arch.get("__kind") == "boards-archive" and len(arch["boards"]) == 2
              and sum(len([o for o in b["objects"] if o["type"] == "pen"]) for b in arch["boards"]) == 3,
              "файл-страховка: архив двух досок со всеми штрихами")
        page.wait_for_event("load", timeout=20000)
        page.wait_for_timeout(500)
        boot(page)
        after = page.evaluate(STATE_JS)
        print("после:", after["boards"], after["dbs"])
        check(after["boards"] == before["boards"], "после пересборки доски и штрихи те же")
        check(bool(after["extra"]) and len(after["extra"]["keep"]) == 5000, "посторонняя запись (история версий) сохранилась")
        check("ogeBoardsDB_rebuild" not in after["dbs"], "временная база удалена")
        check(after["stage"] is None, "метка шага снята")
        check(page.evaluate("() => document.querySelectorAll('.bl-card[data-board]').length") >= 2, "список досок показан")

        # оборванная пересборка: записи только во временной базе, старой нет
        page.evaluate("""async () => {
          const tmp = await rawIdbOpen('ogeBoardsDB_rebuild');
          await rawIdbCopy(await idbOpen(), tmp);
          tmp.close();
          localStorage.setItem('boardsRebuildStage', 'copied');
          idbCurrentDb.close(); idbPromise = null;
          await rawIdbDelete('ogeBoardsDB');
        }""")
        page.reload()
        page.wait_for_timeout(500)
        boot(page)
        page.wait_for_timeout(500)
        resumed = page.evaluate(STATE_JS)
        print("после обрыва:", resumed["boards"], resumed["dbs"])
        check(resumed["boards"] == before["boards"], "оборванная пересборка доведена: доски на месте")
        check("ogeBoardsDB_rebuild" not in resumed["dbs"] and resumed["stage"] is None, "и временная база убрана")

        check(not errors, "без ошибок на странице" + (": " + "; ".join(errors[:3]) if errors else ""))
        browser.close()
    print("\nИТОГ:", "ВСЁ ХОРОШО" if not fails else f"ПРОВАЛОВ {len(fails)}")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
