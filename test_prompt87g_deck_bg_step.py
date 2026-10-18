"""
Промпт №87г: шаг узора подложки, косая линейка, «−» у своего размера
(deck-core.js, HANDOFF.md раздел 6б).

Проверяем:
  1. Поля своего размера остаются открытыми при выборе другого формата
     (видно размер любого), «−» их прячет, «Свой…» открывает снова
  2. Ползунок шага: клетка 3 клетки (1,5 см) — линия сетки через 3 клетки,
     а не через 1; всё движение ползунка — один шаг отмены
  3. Линейка с шагом 2 — линии через 2 клетки
  4. Косая линейка (прописи): основные линии рабочей строки на месте,
     подпись ползунка — «Высота строки»
  5. У подложек без узора ползунка нет
"""
import os
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8994
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





# линия рисуется по половине пикселя — берём самый тёмный из трёх соседних
# по вертикали и по горизонтали, иначе проверка «мигает» от округления
PIX_JS = """([wx, wy]) => {
  const cv = document.getElementById('boardCv'), k = cv.width / cv.getBoundingClientRect().width;
  const sx = Math.round((wx - cam.x) * cam.zoom * k), sy = Math.round((wy - cam.y) * cam.zoom * k);
  const d = cv.getContext('2d').getImageData(sx - 1, sy - 1, 3, 3).data;
  let best = [255, 255, 255], bs = 999;
  for (let i = 0; i < d.length; i += 4){ const v = d[i] + d[i+1] + d[i+2]; if (v < bs){ bs = v; best = [d[i], d[i+1], d[i+2]]; } }
  return best;
}"""


def set_step(page, v):
    page.evaluate("""(v) => { const i = document.getElementById('deckStep');
      for (const x of [v - 0.5, v]){ i.value = x; i.dispatchEvent(new Event('input', { bubbles: true })); }
      i.dispatchEvent(new Event('change', { bubbles: true })); }""", v)
    page.wait_for_timeout(200)


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
        page.click("#deckSlideBtn")

        # 1. поля своего размера и «−»
        page.click("#deckSlidePop [data-fmt='custom']")
        page.click("#deckSlidePop [data-fmt='40x57']")
        page.wait_for_timeout(150)
        check(page.is_visible("#deckCustom") and page.input_value("#deckCW") == "20", "после «Своего» поля видны и показывают размер А4 (20 см)")
        page.click("#deckCustomHide")
        check(page.is_hidden("#deckCustom"), "«−» прячет поля")
        page.click("#deckSlidePop [data-fmt='custom']")
        check(page.is_visible("#deckCustom"), "«Свой…» открывает их снова")
        page.click("#deckSlidePop [data-fmt='64x36']")

        # 2. шаг клетки
        page.click("#deckSlidePop [data-bg='grid']")
        check(page.is_visible("#deckStepRow") and page.inner_text("#deckStepLabel") == "Размер клетки", "у клетки есть ползунок «Размер клетки»")
        undo0 = page.evaluate("() => undoStack.length")
        set_step(page, 3)
        st = page.evaluate("() => ({ s: deckCur().bg.s, u: undoStack.length, v: document.getElementById('deckStepV').textContent })")
        check(st["s"] == 3 and st["v"] == "1,5 см", f"шаг клетки 3 клетки = 1,5 см ({st})")
        check(st["u"] == undo0 + 1, f"движение ползунка — один шаг отмены ({st['u'] - undo0})")
        g = page.evaluate("() => { const r = deckSlideRect(deckCur()); return [r.x, r.y, B.cellSize]; }")
        x0, y0, cell = g
        paper = page.evaluate(PIX_JS, [x0 + cell * 7.5, y0 + cell * 4.5])
        on3 = page.evaluate(PIX_JS, [x0 + cell * 9, y0 + cell * 4.5])
        on1 = page.evaluate(PIX_JS, [x0 + cell * 7, y0 + cell * 4.5])
        diff = lambda a, b: sum(abs(a[i] - b[i]) for i in range(3))
        check(diff(on3, paper) > 6 and diff(on1, paper) <= 6, f"линия через 3 клетки есть, через 1 — нет ({paper} {on3} {on1})")
        page.keyboard.press("Escape")
        page.keyboard.press("Control+z")
        page.wait_for_timeout(150)
        check(page.evaluate("() => deckCur().bg.s") is None, "Ctrl+Z вернул шаг по умолчанию")

        # 3. линейка с шагом 2
        page.click("#deckSlideBtn")
        page.click("#deckSlidePop [data-bg='thin']")
        check(page.inner_text("#deckStepLabel") == "Между линиями", "у линейки — «Между линиями»")
        set_step(page, 2)
        paper = page.evaluate(PIX_JS, [x0 + cell * 7.5, y0 + cell * 5])
        on2 = page.evaluate(PIX_JS, [x0 + cell * 7.5, y0 + cell * 6])
        on1 = page.evaluate(PIX_JS, [x0 + cell * 7.5, y0 + cell * 7])
        check(diff(on2, paper) > 6 and diff(on1, paper) <= 6, f"линейка через 2 клетки ({paper} {on2} {on1})")

        # 4. косая линейка
        page.click("#deckSlidePop [data-bg='kosaya']")
        page.wait_for_timeout(300)   # холст перерисовывается в следующем кадре
        check(page.evaluate("() => deckCur().bg.k") == "kosaya" and page.inner_text("#deckStepLabel") == "Высота строки", "косая линейка, ползунок «Высота строки»")
        main1 = page.evaluate(PIX_JS, [x0 + cell * 20.3, y0 + cell * 2])
        main2 = page.evaluate(PIX_JS, [x0 + cell * 20.3, y0 + cell * 3])
        gap = page.evaluate(PIX_JS, [x0 + cell * 20.3, y0 + cell * 5.5])
        check(diff(main1, gap) > 6 and diff(main2, gap) > 6, f"основные линии рабочей строки на месте ({main1} {main2} {gap})")

        # 5. без узора — без ползунка
        page.click("#deckSlidePop [data-bg='plain']")
        check(page.is_hidden("#deckStepRow"), "у «Пустой» ползунка нет")

        check(not errors, f"нет ошибок на странице ({errors[:3]})")
        browser.close()

    if fails:
        print(f"\nПРОВАЛЕНО: {len(fails)}")
        sys.exit(1)
    print("\nВСЁ ПРОШЛО")


if __name__ == "__main__":
    main()
