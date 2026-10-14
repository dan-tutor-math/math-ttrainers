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
  7. В «максимуме» стопка при быстром листании идёт за ручкой непрерывно
     (дробное положение) и примагничивается у отметки слайда
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

        # 6б. ручка ползунка непрозрачна и над отметками
        kn = page.evaluate("""() => { const k = document.getElementById('deckKnob'), cs = getComputedStyle(k);
          const t = document.querySelector('#deckScrub .deck-scrub-tick');
          return { bg: cs.backgroundColor, z: parseInt(cs.zIndex) || 0, tz: t ? (parseInt(getComputedStyle(t).zIndex) || 0) : -1 }; }""")
        check(not kn["bg"].startswith("rgba") and kn["z"] > kn["tz"], f"ручка непрозрачна и над отметками ({kn})")

        # 6в. щелчок по процентам масштаба — «вписан», а не 100 %
        page.evaluate("() => { setZoom(cam.zoom * 1.6, cam.x, cam.y, 0, 0); clampCam(); scheduleRedraw(); }")
        page.wait_for_timeout(200)
        page.click("#railZoomLabel")
        page.wait_for_timeout(700)
        zz = page.evaluate("() => [cam.zoom, deckFitZoom(deckCur()), deckFitted]")
        check(abs(zz[0] - zz[1]) < 1e-6 and zz[2] and abs(zz[0] - 1) > .05, f"щелчок по процентам — слайд вписан ({zz[0]:.3f}, вписан {zz[1]:.3f})")

        # 7. «максимум»: стопка идёт за ручкой непрерывно, у отметки — примагничивается
        page.wait_for_timeout(300)
        sc = page.locator("#deckScrub").bounding_box()
        k = page.locator("#deckKnob").bounding_box()
        step = sc["height"] / 4          # пять слайдов — четыре промежутка
        page.mouse.move(k["x"] + 16, k["y"] + 22)
        page.mouse.down()
        page.mouse.move(k["x"] + 16, k["y"] + 22 + 10, steps=2)
        # вход в обзор плавный: отдаление идёт кадр за кадром, без скачка
        zs = page.evaluate("""() => new Promise(res => { const out = []; let n = 0;
          const tick = () => { out.push(deckFx ? +deckFx.z.toFixed(3) : null); if (++n < 8) requestAnimationFrame(tick); else res(out); };
          requestAnimationFrame(tick); })""")
        mono = all(v is not None for v in zs) and all(zs[i] >= zs[i + 1] for i in range(len(zs) - 1)) and zs[0] > .6 and zs[-1] < zs[0]
        check(mono, f"вход в обзор плавный, по кадрам: {zs}")
        page.wait_for_timeout(700)       # вошли в обзор
        y_mid = sc["y"] + step * 2.4     # между третьим и четвёртым
        page.mouse.move(k["x"] + 16, y_mid, steps=6)
        page.wait_for_timeout(120)
        st = page.evaluate("""() => ({ pos: deckFastPos, follow: deckFastFollow,
          inst: document.querySelector('#deckDepth .deck-card.k0, #deckDepth .deck-card.k1').classList.contains('instant') })""")
        check(st["pos"] is not None and 2.3 < st["pos"] < 2.5 and st["follow"] and st["inst"],
              f"между отметками стопка стоит дробно и идёт ровно за ручкой ({st})")
        page.mouse.move(k["x"] + 16, sc["y"] + step * 3 + 3, steps=3)
        page.wait_for_timeout(120)
        st = page.evaluate("() => ({ pos: deckFastPos, follow: deckFastFollow })")
        check(st["pos"] == 3 and not st["follow"], f"у отметки — примагнитилась к слайду ({st})")
        check(slide_no(page) == "4 / 5", f"текущий — четвёртый ({slide_no(page)})")
        page.mouse.up()
        page.wait_for_function("() => deckFastPos === null && !deckFast && !deckSlideHidden()", timeout=3000)
        check(True, "отпустили — плавно вернулись в обычный вид")

        check(not errors, f"нет ошибок на странице ({errors[:3]})")
        browser.close()

    if fails:
        print(f"\nПРОВАЛЕНО: {len(fails)}")
        sys.exit(1)
    print("\nВСЁ ПРОШЛО")


if __name__ == "__main__":
    main()
