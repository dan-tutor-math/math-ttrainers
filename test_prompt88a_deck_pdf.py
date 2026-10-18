"""
Промпт №88а: «PDF» на презентации не вешает вкладку (HANDOFF.md 6б).

Служебный объект слайдов стоит на (-1e7, -1e7). Раньше findContentSheets
брал его в рамку «всего нарисованного»: ~100 млн листов на перебор (на
сотне штрихов — минуты, вкладка висит) и лишний пустой лист в PDF.
Проверяем: листы считаются быстро, их столько, сколько занято штрихами.
"""
import os
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8997
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


def main():
    exe = os.environ.get("PW_CHROMIUM") or None
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch(executable_path=exe)
        page = browser.new_context(viewport={"width": 1280, "height": 800}).new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"{BASE}/boards.html")
        page.evaluate(BOOT_JS)
        page.wait_for_timeout(400)
        page.click("#blCreateDeck")
        page.wait_for_timeout(800)

        # пустая презентация: листов нет, и это быстро
        ms = page.evaluate("() => { const t = performance.now(); const n = findContentSheets().length; return [n, performance.now() - t]; }")
        check(ms[0] == 0 and ms[1] < 500, f"пустая презентация: листов 0 за {ms[1]:.0f} мс ")

        # штрих на слайде — один-два листа, тоже быстро
        page.evaluate("() => document.querySelector('[data-tool=pen]').click()")
        page.mouse.move(500, 350)
        page.mouse.down()
        for i in range(10):
            page.mouse.move(500 + i * 14, 350 + (i % 2) * 8)
        page.mouse.up()
        page.wait_for_timeout(300)
        ms = page.evaluate("() => { const t = performance.now(); const n = findContentSheets().length; return [n, performance.now() - t]; }")
        check(1 <= ms[0] <= 2 and ms[1] < 500, f"со штрихом: листов {ms[0]} за {ms[1]:.0f} мс")

        # кнопка «PDF» на панели открывает окно, страница отвечает
        page.evaluate("() => document.getElementById('railPdf').click()")
        page.wait_for_timeout(500)
        try:
            page.wait_for_function("() => true", timeout=3000)
            info = page.evaluate("() => document.getElementById('pdfPageInfo')?.textContent || ''")
            check("из" in info, f"окно PDF открылось: «{info}»")
        except Exception:
            check(False, "после «PDF» страница не отвечает")

        check(not errors, "без ошибок на странице" + (": " + "; ".join(errors[:3]) if errors else ""))
        browser.close()
    print("\nИТОГ:", "ВСЁ ХОРОШО" if not fails else f"ПРОВАЛОВ {len(fails)}")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
