"""
Кнопка «−» на клавиатуре ответа (board-answer-pad.js) была узкой: у неё стоял
класс «mi», а в liquid-glass.css «.mi» — общий класс значков (width:1em), так что
кнопка сжималась до 1em вместо своей ячейки сетки. Класс переименован в «neg».

Проверяем на странице с теми же двумя файлами, что и на досках
(liquid-glass.css + board-answer-pad.js):
  1. «−» и «0» в одном ряду имеют одинаковую ширину и высоту.
  2. «−» по-прежнему красная и именно она вставляет дефис в поле.
  3. Ни у одной кнопки панели нет класса «mi» (иначе вернётся та же беда).

Запуск: python3 test_prompt110_pad_minus_width.py (сервер поднимается сам).
Совместный режим тут не затрагивается — websocket не нужен.
"""
import contextlib
import http.client
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8993
HERE = os.path.dirname(os.path.abspath(__file__))
HARNESS = """<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="liquid-glass.css">
<body style="margin:0;padding:200px 40px"><input id="a" style="width:260px;height:40px">
<script src="board-answer-pad.js"></script>
<script>
  // полная раскладка с цифрами — как у ученика на планшете
  try { localStorage.setItem('bdPadFull', '1'); } catch (e) {}
  BoardAnswerPad.attach(document.getElementById('a'), { onCheck() {} });
</script>"""


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", HERE],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2).request("GET", "/")
                break
            except Exception:
                time.sleep(0.1)
        yield
    finally:
        proc.terminate()
        proc.wait(timeout=5)


fails = []


def check(name, ok):
    print(("PASS " if ok else "FAIL ") + name)
    if not ok:
        fails.append(name)


with local_server(), sync_playwright() as p:
    br = p.chromium.launch()
    page = br.new_page(viewport={"width": 900, "height": 700})
    page.route("**/__harness.html", lambda r: r.fulfill(body=HARNESS, content_type="text/html"))
    page.goto(f"http://127.0.0.1:{PORT}/__harness.html")
    page.click("#a")
    page.wait_for_timeout(200)
    g = page.evaluate("""() => {
        const r = k => { const b = document.querySelector('#bdAnsPad button[data-k="' + k + '"]');
            const q = b.getBoundingClientRect(); return { w: Math.round(q.width), h: Math.round(q.height) }; };
        return { minus: r('-'), zero: r('0'),
                 mi: document.querySelectorAll('#bdAnsPad button.mi').length };
    }""")
    check(f"1. «−» шириной с «0» ({g['minus']['w']} против {g['zero']['w']})", g["minus"]["w"] == g["zero"]["w"])
    check("1. «−» той же высоты, что «0»", g["minus"]["h"] == g["zero"]["h"])
    check("3. у кнопок панели нет класса «mi»", g["mi"] == 0)
    color = page.evaluate("() => getComputedStyle(document.querySelector('#bdAnsPad button[data-k=\"-\"]')).color")
    check(f"2. «−» красная ({color})", color.startswith("rgb(255, 59, 48)"))
    page.click('#bdAnsPad button[data-k="-"]')
    check("2. «−» вставляет дефис в поле", page.input_value("#a") == "-")
    br.close()

print("\nОК" if not fails else f"\nПровалено: {len(fails)}")
sys.exit(1 if fails else 0)
