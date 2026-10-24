"""
Промпт №87: формат и подложка слайда (deck-core.js, HANDOFF.md раздел 6б).

Проверяем:
  1. Кнопка «Слайд» открывает окно; «А4 книжный» меняет формат только
     текущего слайда, объекты не сдвигаются, миниатюра становится книжной
  2. «Свой…» в сантиметрах: 30 × 20 см → 60 × 40 клеток
  3. Подложка «на все слайды»: тонкая линейка — на холсте есть
     горизонтальные линии и нет вертикальных
  4. Тёмная подложка: слайд тёмный, перо по умолчанию рисуется светлым
  5. Цвет линий сохраняется в slide.bg.c
  6. Своя картинка: закреплённое изображение во весь слайд в самом низу,
     его не выделить рамкой; смена подложки убирает картинку
  7. Всё отменяется (Ctrl+Z)
"""
import struct
import zlib
import os
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8991
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




def png_bytes(w=8, h=6, rgb=(200, 40, 40)):
    raw = b"".join(b"\x00" + bytes(rgb) * w for _ in range(h))
    def chunk(t, d):
        c = struct.pack(">I", len(d)) + t + d
        return c + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b""))


PIX_JS = """([wx, wy]) => {
  const cv = document.getElementById('boardCv'), k = cv.width / cv.getBoundingClientRect().width;
  const sx = Math.round((wx - cam.x) * cam.zoom * k), sy = Math.round((wy - cam.y) * cam.zoom * k);
  const d = cv.getContext('2d').getImageData(sx, sy, 1, 1).data;
  return [d[0], d[1], d[2], d[3]];
}"""


def cur(page):
    return page.evaluate("() => { const s = deckCur(); return { w: s.w, h: s.h, bg: s.bg, r: deckSlideRect(s), cell: B.cellSize }; }")


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
        page.mouse.move(520, 330)
        page.mouse.down()
        for i in range(10):
            page.mouse.move(520 + i * 15, 330 + (i % 2) * 10)
        page.mouse.up()
        page.click("#deckAdd")
        page.locator("#deckStripList .deck-thumb").nth(0).click()
        check(wait_no(page, "1 / 2"), "на первом слайде, штрих нарисован")
        pts0 = page.evaluate("() => JSON.stringify(B.objects.filter(o => o.type === 'pen').map(o => o.points))")

        # 1. А4 книжный только для текущего
        page.click("#deckSlideBtn")  # №104: «Слайд ▾» — меню, окно формата — его пункт
        page.click("#dtbPopSlide [data-sl='pop']")
        check(page.is_visible("#deckSlidePop"), "окно «Слайд» открылось")
        check(page.is_hidden("#deckCustom"), "поля своего размера скрыты, пока не нажали «Свой…»")
        page.click("#deckSlidePop [data-fmt='40x57']")
        page.wait_for_timeout(1300)
        sizes = page.evaluate("() => deckSlides().map(s => [s.w, s.h])")
        check(sizes == [[40, 57], [64, 36]], f"А4 книжный только у текущего ({sizes})")
        check(page.evaluate("() => JSON.stringify(B.objects.filter(o => o.type === 'pen').map(o => o.points))") == pts0, "объекты не сдвинулись")
        th = page.evaluate("() => { const c = document.querySelector('#deckStripList .deck-thumb canvas'); return [parseFloat(c.style.width), parseFloat(c.style.height)]; }")
        check(th[1] > th[0], f"миниатюра стала книжной ({th})")

        # 2. свой формат в сантиметрах
        page.click("#deckSlidePop [data-fmt='custom']")
        page.fill("#deckCW", "30")
        page.fill("#deckCH", "20")
        page.click("#deckCApply")
        page.wait_for_timeout(200)
        c = cur(page)
        check(c["w"] == 60 and c["h"] == 40, f"30 × 20 см → 60 × 40 клеток ({c['w']} × {c['h']})")
        check(page.get_attribute("#deckSlidePop [data-fmt='custom']", "aria-pressed") == "true", "отмечено «Свой…»")

        # 3. тонкая линейка на все слайды
        page.check("#deckSlidePop input[name='deckScope'][value='all']")
        page.click("#deckSlidePop [data-bg='thin']")
        page.wait_for_timeout(300)
        kinds = page.evaluate("() => deckSlides().map(s => s.bg.k)")
        check(kinds == ["thin", "thin"], f"тонкая линейка на всех слайдах ({kinds})")
        c = cur(page)
        r, cell = c["r"], c["cell"]
        paper = page.evaluate(PIX_JS, [r["x"] + cell * 10.5, r["y"] + cell * 10.5])
        hline = page.evaluate(PIX_JS, [r["x"] + cell * 10.5, r["y"] + cell * 10])
        vline = page.evaluate(PIX_JS, [r["x"] + cell * 10, r["y"] + cell * 10.5])
        diff = lambda a, b: sum(abs(a[i] - b[i]) for i in range(3))
        check(diff(hline, paper) > 6 and diff(vline, paper) <= 6, f"есть горизонтальная линия, нет вертикальной ({paper} {hline} {vline})")

        # 4. тёмная подложка — только текущий
        page.check("#deckSlidePop input[name='deckScope'][value='one']")
        page.click("#deckSlidePop [data-bg='dark']")
        page.wait_for_timeout(300)
        px = page.evaluate(PIX_JS, [r["x"] + cell * 30.5, r["y"] + cell * 30.5])
        check(sum(px[:3]) < 200, f"слайд тёмный ({px})")
        ink = page.evaluate("() => { scheduleRedraw(); return new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => res(resolveColor('--pencil'))))); }")
        check(ink.upper() == "#F2F3F5", f"перо по умолчанию на тёмном светлое ({ink})")
        check(page.evaluate("() => deckSlides()[1].bg.k") == "thin", "второй слайд остался в линейку")

        # 5. цвет линий
        page.click("#deckSlidePop [data-bg='grid']")
        page.click("#deckSlidePop [data-lc='#F2B8B5']")
        page.wait_for_timeout(200)
        check(cur(page)["bg"] == {"k": "grid", "c": "#F2B8B5"}, f"цвет линий сохранён ({cur(page)['bg']})")

        # 6. своя картинка
        page.set_input_files("#deckBgFile", files=[{"name": "fon.png", "mimeType": "image/png", "buffer": png_bytes()}])
        page.wait_for_function("() => deckCur().bg.k === 'img'", timeout=5000)
        page.wait_for_timeout(300)
        img = page.evaluate("""() => { const s = deckCur(), o = B.objects.find(x => x.id === s.bg.img), r = deckSlideRect(s);
          return { ok: !!o, locked: o && o.locked, bgOf: o && o.bgOf === s.id, idx: B.objects.indexOf(o), deckIdx: B.objects.findIndex(x => x.type === 'deck'),
                   fit: o && o.points[0].x === r.x && o.points[0].y === r.y && o.w === r.w && o.h === r.h, touch: o && mayTouch(o) }; }""")
        check(img["ok"] and img["locked"] and img["bgOf"] and img["fit"], f"картинка-подложка во весь слайд ({img})")
        check(img["idx"] == img["deckIdx"] + 1, "картинка в самом низу слайда")
        check(img["touch"] is False, "картинку-подложку не выделить и не сдвинуть")
        page.click("#deckSlidePop [data-bg='plain']")
        page.wait_for_timeout(200)
        check(page.evaluate("() => !B.objects.some(o => o.bgOf)"), "смена подложки убрала картинку")

        # 7. отмена
        page.keyboard.press("Escape")
        page.wait_for_timeout(100)
        check(page.is_hidden("#deckSlidePop"), "Esc закрывает окно")
        page.keyboard.press("Control+z")
        page.wait_for_timeout(200)
        check(page.evaluate("() => deckCur().bg.k") == "img", "Ctrl+Z вернул картинку-подложку")
        # правок было восемь: формат, свой, линейка, тёмный, клетка, цвет, картинка, белый
        for _ in range(7):
            page.keyboard.press("Control+z")
        page.wait_for_timeout(300)
        sizes = page.evaluate("() => deckSlides().map(s => [s.w, s.h, s.bg.k])")
        check(sizes[0][:2] == [64, 36] and sizes[0][2] == "grid", f"отмена вернула исходный формат и подложку ({sizes})")

        check(not errors, f"нет ошибок на странице ({errors[:3]})")
        browser.close()

    if fails:
        print(f"\nПРОВАЛЕНО: {len(fails)}")
        sys.exit(1)
    print("\nВСЁ ПРОШЛО")


if __name__ == "__main__":
    main()
