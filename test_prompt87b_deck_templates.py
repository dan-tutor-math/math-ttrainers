"""
Промпт №87б: свои шаблоны презентации — слайды, подложки, форматы
(deck-core.js, HANDOFF.md раздел 6б).

Проверяем:
  1. Правая кнопка по слайду (без перетаскивания) открывает меню слайда;
     с перетаскиванием — двигает доску, меню нет
  2. «Сохранить как шаблон»: шаблон с формой, подложкой и объектами;
     переживает перезагрузку (IndexedDB)
  3. Плитка шаблона в окне «Слайд» создаёт после текущего новый слайд того
     же формата и подложки, объекты — копии с новыми id на тех же местах
  4. «Пустой слайд» — новый слайд с подложкой «Пустой»
  5. Своя подложка: сохраняется и применяется
  6. Свой формат: сохраняется и применяется
  7. Удаление своего шаблона
"""
import os
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8992
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



def pop_open(page):
    if page.is_hidden("#deckSlidePop"):
        page.click("#deckSlideBtn")  # №104: «Слайд ▾» — меню, окно формата — его пункт
        page.click("#dtbPopSlide [data-sl='pop']")
    page.wait_for_selector("#deckSlidePop:not([hidden])")


def slide_center(page):
    return page.evaluate("""() => { const r = deckSlideRect(deckCur()), cv = document.getElementById('boardCv').getBoundingClientRect();
      return { x: (r.x + r.w * .7 - cam.x) * cam.zoom + cv.left, y: (r.y + r.h * .7 - cam.y) * cam.zoom + cv.top }; }""")


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
        # на слайде: штрих и прямоугольник, подложка «точки», формат 4:3
        page.mouse.move(480, 300)
        page.mouse.down()
        for i in range(10):
            page.mouse.move(480 + i * 14, 300 + (i % 2) * 10)
        page.mouse.up()
        page.evaluate("() => document.querySelector('[data-tool=quad]').click()")
        page.mouse.move(600, 380); page.mouse.down(); page.mouse.move(650, 420, steps=3); page.mouse.up()
        page.evaluate("() => document.querySelector('[data-tool=pen]').click()")
        pop_open(page)
        page.click("#deckSlidePop [data-fmt='56x42']")
        page.click("#deckSlidePop [data-bg='dots']")
        page.keyboard.press("Escape")
        page.wait_for_timeout(200)
        src = page.evaluate("""() => { const s = deckCur(), r = deckSlideRect(s);
          return deckSlotObjects(s).map(o => ({ t: o.type, id: o.id, x: o.points[0].x - r.x, y: o.points[0].y - r.y })); }""")
        check(len(src) == 2, f"на слайде два объекта ({len(src)})")

        # 1. правая кнопка: с перетаскиванием — двигает доску, без — меню
        c = slide_center(page)
        page.mouse.move(c["x"], c["y"])
        page.mouse.down(button="right")
        page.mouse.move(c["x"] + 40, c["y"] + 10, steps=4)
        page.mouse.up(button="right")
        page.wait_for_timeout(150)
        check(page.is_hidden("#deckMenu"), "правая кнопка с перетаскиванием меню не открывает")
        c = slide_center(page)
        page.mouse.click(c["x"], c["y"], button="right")
        page.wait_for_selector("#deckMenu:not([hidden])")
        check(page.is_visible("#deckMenu [data-act='tpl']"), "правая кнопка по слайду — меню с «Сохранить как шаблон»")

        # 2. сохранить как шаблон
        page.once("dialog", lambda d: d.accept("Мой план урока"))
        page.click("#deckMenu [data-act='tpl']")
        page.wait_for_function("() => deckPresets.slides.length === 1")
        t = page.evaluate("() => { const t = deckPresets.slides[0]; return { name: t.name, w: t.w, h: t.h, bg: t.bg.k, n: t.objects.length, prev: (t.preview || '').slice(0, 10) }; }")
        check(t == {"name": "Мой план урока", "w": 56, "h": 42, "bg": "dots", "n": 2, "prev": "data:image"}, f"шаблон сохранён целиком ({t})")
        check(page.is_visible("#deckToast"), "показано «Шаблон сохранён»")
        page.wait_for_timeout(500)
        page.reload()
        page.evaluate(BOOT_JS)
        page.wait_for_function("() => typeof B !== 'undefined' && B && B.kind === 'deck' && boardActive", timeout=5000)
        page.wait_for_function("() => deckPresetsLoaded")
        check(page.evaluate("() => deckPresets.slides.length") == 1, "шаблон пережил перезагрузку")

        # 3. новый слайд из шаблона
        pop_open(page)
        tiles = page.locator("#deckTplList .deck-tpl")
        check(tiles.count() == 2 and "Мой план урока" in tiles.nth(1).inner_text(), "в окне «Пустой слайд» и свой шаблон")
        tiles.nth(1).click()
        check(wait_no(page, "2 / 2"), "из шаблона создан второй слайд")
        res = page.evaluate("""() => { const s = deckCur(), r = deckSlideRect(s);
          return { w: s.w, h: s.h, bg: s.bg.k, objs: deckSlotObjects(s).map(o => ({ t: o.type, id: o.id, x: o.points[0].x - r.x, y: o.points[0].y - r.y })) }; }""")
        check(res["w"] == 56 and res["h"] == 42 and res["bg"] == "dots", f"формат и подложка из шаблона ({res['w']}×{res['h']}, {res['bg']})")
        same = len(res["objs"]) == 2 and all(abs(a["x"] - b["x"]) < .01 and abs(a["y"] - b["y"]) < .01 and a["t"] == b["t"] and a["id"] != b["id"] for a, b in zip(sorted(res["objs"], key=lambda o: o["t"]), sorted(src, key=lambda o: o["t"])))
        check(same, "объекты — копии с новыми id на тех же местах слайда")

        # 4. пустой слайд
        pop_open(page)
        page.locator("#deckTplList .deck-tpl").nth(0).click()
        check(wait_no(page, "3 / 3"), "«Пустой слайд» добавлен")
        e = page.evaluate("() => ({ bg: deckCur().bg.k, n: deckSlotObjects(deckCur()).length })")
        check(e == {"bg": "plain", "n": 0}, f"пустой слайд без объектов, подложка «Пустой» ({e})")

        # 5. своя подложка
        pop_open(page)
        page.click("#deckSlidePop [data-bg='grid']")
        page.click("#deckSlidePop [data-lc='#F2B8B5']")
        page.once("dialog", lambda d: d.accept("Розовая клетка"))
        page.click("#deckSaveBg")
        page.wait_for_function("() => deckPresets.bgs.length === 1")
        page.click("#deckSlidePop [data-bg='thin']")
        page.click("#deckMyBgs [data-ubg]")
        page.wait_for_timeout(150)
        check(page.evaluate("() => deckCur().bg") == {"k": "grid", "c": "#F2B8B5"}, "своя подложка применилась")

        # 6. свой формат
        page.click("#deckSlidePop [data-fmt='custom']")
        page.fill("#deckCW", "30"); page.fill("#deckCH", "15")
        page.click("#deckCApply")
        page.once("dialog", lambda d: d.accept("Полоса 30×15"))
        page.click("#deckSaveFmt")
        page.wait_for_function("() => deckPresets.formats.length === 1")
        page.click("#deckSlidePop [data-fmt='64x36']")
        page.click("#deckMyFmts [data-ufmt]")
        page.wait_for_timeout(150)
        check(page.evaluate("() => [deckCur().w, deckCur().h]") == [60, 30], "свой формат применился")
        check(page.get_attribute("#deckMyFmts [data-ufmt]", "aria-pressed") == "true", "свой формат отмечен")

        # 7. удаление своего шаблона
        page.once("dialog", lambda d: d.accept())
        page.locator("#deckTplList .deck-tpl.mine").hover()
        page.click("#deckTplList .deck-ux")
        page.wait_for_function("() => deckPresets.slides.length === 0")
        check(page.locator("#deckTplList .deck-tpl").count() == 1, "свой шаблон удалён, «Пустой слайд» на месте")

        check(not errors, f"нет ошибок на странице ({errors[:3]})")
        browser.close()

    if fails:
        print(f"\nПРОВАЛЕНО: {len(fails)}")
        sys.exit(1)
    print("\nВСЁ ПРОШЛО")


if __name__ == "__main__":
    main()
