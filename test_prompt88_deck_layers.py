"""
Промпт №88: режимы «Конструктор» и «Урок» (deck-core.js, HANDOFF.md 6б).

Проверяем:
  1. Презентация открывается в «Конструкторе»; нарисованное там — заготовка
     (lay: 'base')
  2. В «Уроке» нарисованное — пометка (без lay); ластик заготовку не трогает,
     пометку стирает; выделение заготовку не берёт
  3. «Очистить пометки» стирает только пометки, Ctrl+Z их возвращает
  4. «Копия урока» — новая доска в списке со всеми объектами
  5. Снова «Конструктор» — заготовку можно выделить
  6. «Закрепить всё как заготовку» в меню слайда
  7. Ученик (доступ не full): переключателя нет, всегда «Урок»
"""
import os
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8996
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
    if not cond:
        fails.append(msg)


def slide_no(page):
    return page.inner_text("#deckNo").strip()


def wait_no(page, want, timeout=2000):
    t0 = time.time()
    while time.time() - t0 < timeout / 1000:
        if slide_no(page) == want:
            return True
        page.wait_for_timeout(50)
    return False



def stroke(page, x, y, n=10):
    page.mouse.move(x, y)
    page.mouse.down()
    for i in range(n):
        page.mouse.move(x + i * 14, y + (i % 2) * 8)
    page.mouse.up()
    page.wait_for_timeout(150)


def pens(page):
    return page.evaluate("() => B.objects.filter(o => o.type === 'pen').map(o => ({ id: o.id, lay: o.lay || null, p: JSON.stringify(o.points) }))")


def tool(page, t):
    page.evaluate(f"() => document.querySelector('[data-tool={t}]').click()")


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
        page.wait_for_selector("#blCreateDeck")
        page.click("#blCreateDeck")
        page.wait_for_function("() => typeof B !== 'undefined' && B && B.kind === 'deck' && boardActive")
        page.wait_for_timeout(300)

        # 1. конструктор
        check(page.evaluate("() => deckMode") == "edit" and page.get_attribute("#deckModeEdit", "aria-pressed") == "true", "открылась в «Конструкторе»")
        check(page.is_hidden("#deckLessonBtns"), "кнопок урока в конструкторе нет")
        stroke(page, 450, 300)
        a = pens(page)[0]
        check(a["lay"] == "base", f"в конструкторе — заготовка ({a['lay']})")

        # 2. урок
        page.click("#deckModeLesson")
        check(page.is_visible("#deckClearNotes") and page.is_visible("#deckCopyBtn"), "в уроке — «Очистить пометки» и «Копия урока»")
        stroke(page, 450, 480)
        b = [x for x in pens(page) if x["id"] != a["id"]][0]
        check(b["lay"] is None, "в уроке — пометка без lay")
        tool(page, "eraser")
        for (x0, y0) in [(440, 300), (440, 480)]:
            page.mouse.move(x0, y0 - 6)
            page.mouse.down()
            page.mouse.move(x0 + 160, y0 + 10, steps=12)
            page.mouse.up()
            page.wait_for_timeout(150)
        after = {x["id"]: x for x in pens(page)}
        check(a["id"] in after and after[a["id"]]["p"] == a["p"], "ластик в уроке заготовку не тронул")
        check(b["id"] not in after or after[b["id"]]["p"] != b["p"], "ластик пометку стёр")
        tool(page, "select")
        page.mouse.click(470, 304)
        page.wait_for_timeout(150)
        check(page.evaluate("(id) => selectedId !== id && !multiSelectIds.includes(id)", a["id"]), "выделение в уроке заготовку не берёт")

        # 3. очистить пометки
        tool(page, "pen")
        stroke(page, 600, 420)
        n0 = len(pens(page))
        page.click("#deckClearNotes")
        page.wait_for_timeout(200)
        left = pens(page)
        check(all(x["lay"] == "base" for x in left) and len(left) >= 1, f"остались только заготовки ({len(left)} из {n0})")
        page.keyboard.press("Control+z")
        page.wait_for_timeout(200)
        check(len(pens(page)) == n0, "Ctrl+Z вернул пометки")

        # 4. копия урока
        nb = page.evaluate("() => DB.boards.length")
        page.click("#deckCopyBtn")
        page.wait_for_timeout(200)
        cp = page.evaluate("""() => { const c = DB.boards[DB.boards.length - 1];
          return { n: DB.boards.length, name: c.name, kind: c.kind, objs: (c.objects || []).length, same: (c.objects || []).length === B.objects.length, id: c.id !== B.id }; }""")
        check(cp["n"] == nb + 1 and " · " in cp["name"] and cp["kind"] == "deck" and cp["same"] and cp["id"], f"копия урока в списке досок ({cp})")
        page.wait_for_timeout(700)
        disk = page.evaluate("""() => { const c = DB.boards[DB.boards.length - 1];
          return idbGet('boarddata:' + c.id).then(v => v && v.objects ? v.objects.length : -1); }""")
        check(disk == cp["objs"], f"копия записана на диск ({disk} объектов)")

        # 5. снова конструктор — заготовку можно выделить
        page.click("#deckModeEdit")
        tool(page, "select")
        page.mouse.click(470, 304)
        page.wait_for_timeout(150)
        check(page.evaluate("(id) => selectedId === id || multiSelectIds.includes(id)", a["id"]), "в конструкторе заготовку можно выделить")
        page.keyboard.press("Escape")

        # 6. закрепить всё как заготовку
        page.click("#deckModeLesson")
        tool(page, "pen")
        stroke(page, 620, 520)
        page.mouse.click(900, 350, button="right")
        page.wait_for_selector("#deckMenu:not([hidden])")
        check(page.is_visible("#deckMenu [data-act='base']"), "в меню слайда есть «Закрепить всё как заготовку»")
        page.click("#deckMenu [data-act='base']")
        page.wait_for_timeout(150)
        check(all(x["lay"] == "base" for x in pens(page)), "все объекты слайда стали заготовкой")

        # 7. ученик
        page.evaluate("() => window.setBoardAccess('own', 'u2')")
        page.wait_for_timeout(100)
        check(page.is_hidden("#deckModeSeg") and page.evaluate("() => deckLessonMode()"), "у ученика переключателя нет, всегда «Урок»")
        check(page.is_hidden("#deckCopyBtn") and page.is_visible("#deckClearNotes"), "у ученика — «Очистить пометки», без «Копии урока»")
        page.evaluate("() => window.setBoardAccess('full', null)")

        check(not errors, f"нет ошибок на странице ({errors[:3]})")
        browser.close()

    if fails:
        print(f"\nПРОВАЛЕНО: {len(fails)}")
        sys.exit(1)
    print("\nВСЁ ПРОШЛО")


if __name__ == "__main__":
    main()
