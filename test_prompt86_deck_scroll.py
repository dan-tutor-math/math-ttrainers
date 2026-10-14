"""
Промпт №86: сплошная прокрутка ленты презентации (deck-core.js, HANDOFF.md
раздел 6б).

Проверяем:
  1. Третья кнопка в полосе листания включает сплошную прокрутку, слой
     глубины при этом скрыт, текущий слайд остаётся текущим
  2. Колесо прокручивает плавно (камера едет понемногу), а не листает;
     счётчик показывает слайд у середины
  3. Слайды разного формата (16:9 и А4 книжный) стоят столбиком друг под
     другом, слоты на полотне не двигаются
  4. Штрих на втором и на третьем слайде ложится в слот своего слайда
  5. Выделение и перетаскивание объекта на другом слайде работают
  6. PageDown — к следующему слайду; переключение обратно на «по одному» —
     на том же слайде
"""
import os
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8990
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



PT_JS = """([i, fx, fy]) => {
  const L = deckScrollLayout(), cur = deckCur(), oc = L.off.get(cur.id);
  const s = deckSlides()[i], o = L.off.get(s.id), r = deckSlideRect(s);
  const dx = r.x + r.w * fx + o.x, dy = r.y + r.h * fy + o.y;
  const cv = document.getElementById('boardCv').getBoundingClientRect();
  return { x: (dx - (cam.x + oc.x)) * cam.zoom + cv.left, y: (dy - (cam.y + oc.y)) * cam.zoom + cv.top };
}"""


def wheel(page, dy, n=1):
    page.evaluate("""([dy, n]) => new Promise(res => {
      const cv = document.getElementById('boardCv'); let k = 0;
      const tick = () => {
        cv.dispatchEvent(new WheelEvent('wheel', { deltaY: dy, clientX: 700, clientY: 400, bubbles: true, cancelable: true }));
        if (++k < n) setTimeout(tick, 16); else setTimeout(res, 120);
      };
      tick();
    })""", [dy, n])


def stroke(page, p):
    page.mouse.move(p["x"], p["y"])
    page.mouse.down()
    for i in range(8):
        page.mouse.move(p["x"] + i * 12, p["y"] + (i % 2) * 8)
    page.mouse.up()
    page.wait_for_timeout(150)


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
        page.click("#deckAdd")
        page.click("#deckAdd")
        page.wait_for_timeout(300)
        # второй слайд — А4 книжный (формат по слайдам, промпт №87 даст кнопку)
        page.evaluate("() => { const d = B.objects.find(o => o.type === 'deck'); d.slides[1].w = 40; d.slides[1].h = 57; saveDB(); }")
        slots0 = page.evaluate("() => B.objects.find(o => o.type === 'deck').slides.map(s => s.slot)")
        page.locator("#deckStripList .deck-thumb").nth(0).click()
        check(wait_no(page, "1 / 3"), "стоим на первом слайде")
        page.wait_for_timeout(400)

        # 1. включаем сплошную прокрутку
        page.click("#deckFlowS")
        page.wait_for_timeout(300)
        st = page.evaluate("() => ({ f: deckFlow(), layer: document.getElementById('deckDepth').hidden, cur: deckCurIndex(), pressed: document.getElementById('deckFlowS').getAttribute('aria-pressed') })")
        check(st["f"] == "scroll" and st["layer"] and st["cur"] == 0 and st["pressed"] == "true", f"сплошная прокрутка включена, слой глубины скрыт ({st})")

        # 3. столбик: А4 под 16:9, слоты те же
        lay = page.evaluate("""() => { const L = deckScrollLayout(); return deckSlides().map(s => { const o = L.off.get(s.id); return [Math.round(o.top), Math.round(o.h)]; }); }""")
        check(lay[1][0] > lay[0][0] + lay[0][1] and lay[2][0] > lay[1][0] + lay[1][1], f"слайды столбиком один под другим ({lay})")
        check(lay[1][1] > lay[0][1], "А4 книжный выше слайда 16:9")
        check(page.evaluate("() => B.objects.find(o => o.type === 'deck').slides.map(s => s.slot)") == slots0, "слоты на полотне не сдвинулись")

        # 2. колесо прокручивает плавно
        y0 = page.evaluate("() => cam.y")
        wheel(page, 60)
        y1 = page.evaluate("() => cam.y")
        z = page.evaluate("() => cam.zoom")
        check(0 < (y1 - y0) * z < 120 and slide_no(page) == "1 / 3", f"один щелчок колеса — небольшой сдвиг, слайд тот же ({(y1 - y0) * z:.0f} px)")
        wheel(page, 120, 8)
        check(slide_no(page) == "2 / 3", f"прокрутили дальше — у середины второй слайд ({slide_no(page)})")

        # 4. штрих на втором слайде
        pt = page.evaluate(PT_JS, [1, .3, .5])
        stroke(page, pt)
        res = page.evaluate("() => { const o = B.objects.filter(o => o.type === 'pen').pop(); return [deckSlotOf(o), deckSlides()[1].slot]; }")
        check(res[0] == res[1], f"штрих лёг в слот второго слайда ({res})")
        wheel(page, 120, 10)
        check(slide_no(page) == "3 / 3", f"докрутили до третьего ({slide_no(page)})")
        pt = page.evaluate(PT_JS, [2, .3, .4])
        stroke(page, pt)
        res = page.evaluate("() => { const o = B.objects.filter(o => o.type === 'pen').pop(); return [deckSlotOf(o), deckSlides()[2].slot]; }")
        check(res[0] == res[1], f"штрих лёг в слот третьего слайда ({res})")

        # 5. выделить и перетащить штрих на третьем слайде
        before = page.evaluate("() => B.objects.filter(o => o.type === 'pen').pop().points[0].x")
        page.evaluate("() => document.querySelector('[data-tool=select]').click()")
        page.mouse.move(pt["x"] + 12, pt["y"] + 8)
        page.mouse.down()
        page.mouse.move(pt["x"] + 40, pt["y"] + 20, steps=4)
        page.mouse.move(pt["x"] + 72, pt["y"] + 30, steps=4)
        page.mouse.up()
        page.wait_for_timeout(200)
        after = page.evaluate("() => { const o = B.objects.filter(o => o.type === 'pen').pop(); return [o.points[0].x, deckSlotOf(o), deckSlides()[2].slot]; }")
        check(abs(after[0] - before) > 10 and after[1] == after[2], f"штрих перетащили, он остался на третьем слайде ({before:.0f} → {after[0]:.0f})")
        page.keyboard.press("Escape")

        # 6. PageUp и обратно на «по одному»
        page.keyboard.press("PageUp")
        check(wait_no(page, "2 / 3"), f"PageUp → 2 / 3 ({slide_no(page)})")
        top = page.evaluate("""() => { const L = deckScrollLayout(), o = L.off.get(deckCur().id), oc = o;
          return Math.round((o.top - (cam.y + oc.y)) * cam.zoom) - deckArea().y; }""")
        check(abs(top - 12) <= 2, f"верх слайда — у верха свободной области ({top})")
        page.click("#deckFlowV")
        page.wait_for_timeout(300)
        check(slide_no(page) == "2 / 3" and page.evaluate("() => deckFlow()") == "v", "вернулись на «по одному» — тот же слайд")
        check(not page.evaluate("() => document.getElementById('deckDepth').hidden"), "слой глубины снова виден")

        check(not errors, f"нет ошибок на странице ({errors[:3]})")
        browser.close()

    if fails:
        print(f"\nПРОВАЛЕНО: {len(fails)}")
        sys.exit(1)
    print("\nВСЁ ПРОШЛО")


if __name__ == "__main__":
    main()
