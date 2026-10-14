"""
Промпт №85в: соседние слайды в глубине, обзор, быстрое листание ползунком
(deck-core.js, HANDOFF.md раздел 6б).

Проверяем:
  1. Позади холста слой #deckDepth: у текущего слайда видны соседи
     (картинки .deck-card k1), сам текущий картинкой не показан — его рисует
     холст, а холст вне слайда прозрачный
  2. Вид зависит от масштаба: при «вписан» соседи без наклона, при
     отдалении до 50% — наклон (rotateX в transform)
  3. Перелистывание: 0,3 с текущий слайд — картинка в слое (холст его не
     рисует), потом снова холст
  4. Ползунок справа: нажатие без движения не включает быстрое листание,
     сдвиг — включает, слайд меняется следом, отпустили — выключилось
  5. Щелчок по выглядывающему соседу открывает его
  6. Размытие соседей — только в режиме «максимум эффектов»
"""
import os
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8986
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



def cards(page):
    return page.evaluate("""() => [...document.querySelectorAll('#deckDepth .deck-card')].map(el => ({
        k: (el.className.match(/k(\\d)/) || [])[1], op: parseFloat(el.style.opacity), t: el.style.transform }))""")


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
        for _ in range(4):
            page.click("#deckAdd")
        page.wait_for_timeout(500)
        page.locator("#deckStripList .deck-thumb").nth(2).click()
        check(wait_no(page, "3 / 5"), "открыт третий слайд из пяти")
        page.wait_for_timeout(600)

        # 1. соседи позади
        cs = cards(page)
        k1 = [c for c in cs if c["k"] == "1"]
        k0 = [c for c in cs if c["k"] == "0"]
        check(page.is_visible("#deckDepth"), "слой глубины виден")
        check(len(k1) == 2 and all(c["op"] > .3 for c in k1), f"оба соседа видны ({k1})")
        check(len(k0) == 1 and k0[0]["op"] == 0, "текущий слайд картинкой не показан — его рисует холст")
        alpha = page.evaluate("""() => { const cv = document.getElementById('boardCv');
          return cv.getContext('2d').getImageData(4, Math.round(cv.height / 2), 1, 1).data[3]; }""")
        check(alpha == 0, f"холст вне слайда прозрачный (альфа {alpha})")
        check(all("rotate" not in c["t"] for c in k1), "при «вписан» соседи без наклона")

        # 2. отдаление → наклон
        page.evaluate("() => { setZoom(cam.zoom * 0.5, cam.x, cam.y, 0, 0); clampCam(); scheduleRedraw(); }")
        page.wait_for_timeout(500)
        zf = page.evaluate("() => deckZf")
        check(.45 <= zf <= .55, f"отдалили до половины ({zf:.2f})")
        cs = cards(page)
        check(any(c["k"] == "1" and "rotateX" in c["t"] for c in cs), "в обзоре соседи наклонены")
        check(any(c["k"] == "2" and c["op"] > .2 for c in cs), "в обзоре видны и вторые соседи")
        page.evaluate("() => { setZoom(cam.zoom * 4, cam.x, cam.y, 0, 0); clampCam(); scheduleRedraw(); }")
        page.wait_for_timeout(300)
        page.evaluate("() => { const s = deckCur(); deckFitCam(s, 1); clampCam(); scheduleRedraw(); }")
        page.wait_for_timeout(400)
        check(abs(page.evaluate("() => deckZf") - 1) < .01, "вернулись к «вписан»")

        # 3. перелистывание с анимацией
        page.keyboard.press("PageDown")
        page.wait_for_timeout(60)
        mid = page.evaluate("() => ({ hidden: deckSlideHidden(), op: parseFloat(document.querySelector('#deckDepth .deck-card.k0').style.opacity) })")
        check(mid["hidden"] and mid["op"] == 1, f"во время листания слайд — картинка в слое ({mid})")
        page.wait_for_timeout(500)
        check(not page.evaluate("() => deckSlideHidden()"), "после анимации слайд снова рисует холст")
        check(slide_no(page) == "4 / 5", f"PageDown → 4 / 5 ({slide_no(page)})")

        # 4. ползунок
        k = page.locator("#deckKnob").bounding_box()
        page.mouse.move(k["x"] + 16, k["y"] + 22)
        page.mouse.down()
        page.wait_for_timeout(150)
        check(not page.evaluate("() => deckFast"), "нажатие на ручку быстрое листание не включает")
        sc = page.locator("#deckScrub").bounding_box()
        # чуть сдвинули — обзор начинается плавно: через 150 мс текущий слайд
        # ещё на полпути к обзорному масштабу, а не сразу маленький
        page.mouse.move(k["x"] + 16, k["y"] + 14, steps=2)
        page.wait_for_timeout(150)
        a = page.evaluate("""() => { const m = getComputedStyle(document.querySelector('#deckDepth .deck-card.k0')).transform;
          const v = (m.match(/matrix\(([^)]+)\)/) || [])[1]; return v ? parseFloat(v.split(',')[0]) : -1; }""")
        check(0.55 < a < 0.97, f"вход в обзор плавный: через 150 мс масштаб слайда {a:.2f}")
        page.mouse.move(k["x"] + 16, sc["y"] + 2, steps=8)
        page.wait_for_timeout(200)
        check(page.evaluate("() => deckFast"), "сдвиг ручки включает быстрое листание")
        check(slide_no(page) == "1 / 5", f"ручка наверху — первый слайд ({slide_no(page)})")
        page.mouse.up()
        page.wait_for_timeout(250)
        check(page.evaluate("() => !deckFast && deckSlideHidden()"), "отпустили — обзор плавно возвращается (слайд ещё картинкой)")
        page.wait_for_timeout(500)
        check(not page.evaluate("() => deckFast || deckSlideHidden()"), "через 0,6 с быстрое листание выключилось полностью")

        # 5. щелчок по выглядывающему соседу (нижнему)
        pt = page.evaluate("""() => {
          const cur = deckCur(), r = deckSlideRect(cur), cv = document.getElementById('boardCv').getBoundingClientRect();
          const bottom = (r.y + r.h - cam.y) * cam.zoom + cv.top;
          return { x: (r.x + r.w / 2 - cam.x) * cam.zoom + cv.left, y: bottom + 18 };
        }""")
        page.mouse.click(pt["x"], pt["y"])
        check(wait_no(page, "2 / 5"), f"щелчок по нижнему соседу → 2 / 5 ({slide_no(page)})")
        page.wait_for_timeout(500)

        # 6. размытие — только в «максимуме»
        f0 = page.evaluate("() => getComputedStyle(document.querySelector('#deckDepth .deck-card.k1')).filter")
        page.evaluate("() => document.documentElement.setAttribute('data-fx', 'full')")
        f1 = page.evaluate("() => getComputedStyle(document.querySelector('#deckDepth .deck-card.k1')).filter")
        check(f0 == "none" and "blur" in f1, f"размытие только в «максимуме» ({f0} / {f1})")

        check(not errors, f"нет ошибок на странице ({errors[:3]})")
        browser.close()

    if fails:
        print(f"\nПРОВАЛЕНО: {len(fails)}")
        sys.exit(1)
    print("\nВСЁ ПРОШЛО")


if __name__ == "__main__":
    main()
