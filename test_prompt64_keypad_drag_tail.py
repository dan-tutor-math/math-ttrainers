"""
Промпт №64: на телефоне после перетаскивания экранной клавиатуры вверх за ней
тянулся пустой «хвост» до низа экрана.

Причина: в @media(max-width:720px) у .keypad-float стоит bottom:16px, а
makeKeypadDraggable задавал только top/left. При заданных и top, и bottom
панель растягивается между ними. Теперь при начале перетаскивания bottom
сбрасывается в auto.

Проверяет во всех тренажёрах с плавающей клавиатурой (375×800):
  1. после перетаскивания за ✋ на 300 px вверх высота панели не меняется;
  2. панель действительно уехала вверх (а не осталась на месте);
  3. на широком экране перетаскивание тоже не меняет высоту.

Запуск: python3 test_prompt64_keypad_drag_tail.py (сервер поднимается сам).
"""
import contextlib
import http.client
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8985
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))

PAGES = ["addition", "addition_embed", "division", "division_embed", "ege_base", "ege_prof",
         "fraction_divide", "fraction_multiply", "linear", "multiplication",
         "multiplication_embed", "oge10", "oge12", "oge14", "oge1_5", "oge6", "oge7", "oge8",
         "oge9", "oge_part2", "powers", "quadratic", "subtraction", "subtraction_embed"]


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT)], cwd=HERE,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        for _ in range(50):
            try:
                conn = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                conn.request("GET", "/index.html")
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


def check(page, name, width, height, pre=""):
    page.set_viewport_size({"width": width, "height": height})
    page.goto(f"{BASE}/{name}.html")
    page.wait_for_timeout(300)
    # Сама клавиатура показывается только в режиме задания, а тип задания в
    # каждом тренажёре выбирается по-своему; баг чисто в раскладке, поэтому
    # показываем панель напрямую.
    # В ОГЭ №9 две клавиатуры внутри скрытых областей движков — их тоже
    # раскрываем, иначе fixed-панель внутри display:none не видна.
    if pre:
        # движки ОГЭ №9 вставляются в DOM только при открытии своего типа
        page.evaluate("(id) => openModeById(id)", "linear" if pre == "lin_" else "quadratic")
        page.wait_for_timeout(300)
    page.evaluate("""(pre) => {
        const f = document.getElementById(pre + 'keypadFloat');
        f.style.display = 'block';
        for (let el = f.parentElement; el && el !== document.body; el = el.parentElement)
            if (getComputedStyle(el).display === 'none') el.style.display = 'block';
    }""", pre)
    fl = page.locator(f"#{pre}keypadFloat")
    before = fl.bounding_box()
    hb = page.locator(f"#{pre}kpDragHandle").bounding_box()
    x, y = hb["x"] + hb["width"] / 2, hb["y"] + hb["height"] / 2
    dy = min(300, before["y"] - 20)
    page.mouse.move(x, y)
    page.mouse.down()
    for i in range(1, 11):
        page.mouse.move(x, y - dy * i / 10)
    page.mouse.up()
    after = fl.bounding_box()
    errs = []
    if abs(after["height"] - before["height"]) > 1:
        errs.append(f"{name}{'/' + pre if pre else ''} {width}px: высота {before['height']:.0f} → {after['height']:.0f}")
    if after["y"] > before["y"] - dy + 5:
        errs.append(f"{name}{'/' + pre if pre else ''} {width}px: панель не уехала вверх ({before['y']:.0f} → {after['y']:.0f})")
    return errs


def main():
    errors = []
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        for name in PAGES:
            if name == "oge9":
                errors += check(page, name, 375, 800, "lin_")
                errors += check(page, name, 375, 800, "quad_")
            else:
                errors += check(page, name, 375, 800)
        for name in ["division", "oge1_5", "ege_prof"]:
            errors += check(page, name, 1280, 900)
        browser.close()
    if errors:
        print("ОШИБКИ:")
        for e in errors:
            print(" -", e)
        sys.exit(1)
    print(f"OK: {len(PAGES)} тренажёров на 375 px и 3 на широком экране — хвоста нет")


if __name__ == "__main__":
    main()
