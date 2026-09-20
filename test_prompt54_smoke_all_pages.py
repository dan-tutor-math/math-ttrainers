"""
Промпт №54: дымовая проверка всех страниц платформы.

Открывает каждую страницу (21 тренажёр, главную, доски и «калькуляторы в
столбик» *_embed.html) и падает, если на какой-нибудь случилась ошибка
JavaScript. На тренажёрах дополнительно проверяет, что мост состояния для
совместной сессии и «+ примеров» на месте (window.__trainerState).

Зачем: большинство правок раскатываются сразу на все тренажёры скриптом,
а открыть руками 25 страниц после каждой — никто не станет. Этот тест —
первое, что стоит прогнать после любой массовой правки.

Сеть к Supabase и Google Fonts отрезана: страницы должны открываться без
ошибок и без неё (совместный режим просто не подключится).

Запуск: python3 test_prompt54_smoke_all_pages.py (сервер поднимается сам).
"""
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8971
BASE = f"http://127.0.0.1:{PORT}"

TRAINERS = [
    "oge1_5", "oge6", "oge7", "oge8", "oge9", "oge10", "oge11", "oge12", "oge13",
    "oge14", "oge15_18", "oge19", "powers",
    "addition", "subtraction", "multiplication", "division",
    "linear", "quadratic", "fraction_multiply", "fraction_divide",
]
OTHER = ["index", "boards", "addition_embed", "subtraction_embed",
         "multiplication_embed", "division_embed"]


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


def run():
    failures = []
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        for slug in TRAINERS + OTHER:
            ctx = browser.new_context()
            page = ctx.new_page()
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.route("https://**/*", lambda route: route.abort())
            page.goto(f"{BASE}/{slug}.html")
            page.wait_for_timeout(1200)
            bridge = page.evaluate("() => !!window.__trainerState") if slug in TRAINERS else None
            # у тренажёров из семейства ОГЭ №8 своя система карточек, без моста
            needs_bridge = slug in TRAINERS and slug not in ("oge8", "oge12", "powers")
            ok = not errors and (not needs_bridge or bridge)
            print(f"[{'OK' if ok else 'FAIL'}] {slug}" + (f": {errors[:2]}" if errors else "")
                  + ("" if not needs_bridge or bridge else ": нет window.__trainerState"))
            if not ok:
                failures.append(slug)
            ctx.close()
        browser.close()
    print()
    if failures:
        print("ПРОВАЛЫ:", ", ".join(failures))
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    run()
