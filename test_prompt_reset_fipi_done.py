"""
«Сбросить прогресс» на главной стирает и «ФИПИ решено N из M».

Раньше кнопка стирала только ключи ogeProg:, а fipi-mix.js хранит решённые
задания ФИПИ в fipiMix:done:<страница> — подпись в №7 оставалась после сброса.

Что проверяет:
- в №7 отмечаем решёнными два задания ФИПИ первого типа обычным путём страницы
  (FipiMix.markDone), на экране типов видно «ФИПИ решено 2 из …»;
- на главной «Сбросить прогресс» (подтверждение — «да») убирает fipiMix:done:*
  и ogeProg:*, а выбор «ФИПИ / наши» (fipiMix:filter) и тему оставляет;
- после этого в №7 подписи «ФИПИ решено» нет;
- если в хранилище только fipiMix:done:, сброс не говорит «прогресс уже пуст».

Сеть наружу отрезана. Запуск: python3 test_prompt_reset_fipi_done.py
"""
import contextlib
import http.client
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8952
BASE = f"http://127.0.0.1:{PORT}"
fails = []


def check(cond, msg):
    print(("[OK]   " if cond else "[FAIL] ") + msg)
    if not cond:
        fails.append(msg)


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                c = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                c.request("GET", "/index.html"); c.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        yield
    finally:
        proc.terminate(); proc.wait(timeout=5)


def fipi_label(page):
    page.goto(f"{BASE}/oge7.html")
    page.wait_for_selector(".mode-card")
    return page.evaluate("[...document.querySelectorAll('.fipi-count')].map(e => e.textContent).join(' | ')")


def mark_two_done(page):
    page.goto(f"{BASE}/oge7.html")
    page.wait_for_selector(".mode-card")
    # тип с банком ФИПИ — первый, у которого есть fipiList; два первых задания — «решены»
    page.evaluate("""() => {
        const m = MODES.find(x => x.fipiList && x.fipiList.length >= 2);
        FipiMix.markDone(FIPI_PAGE, m.id, { fipi: m.fipiList[0].fipi });
        FipiMix.markDone(FIPI_PAGE, m.id, { fipi: m.fipiList[1].fipi });
    }""")


def press_reset(page):
    msgs = []

    def on_dialog(d):
        msgs.append(d.message); d.accept()
    page.on("dialog", on_dialog)
    page.goto(f"{BASE}/index.html")
    page.wait_for_selector("#resetProgressBtn", state="attached")
    # кнопка живёт в меню «⋯» — жмём обработчик напрямую, меню здесь не проверяем
    page.evaluate("document.getElementById('resetProgressBtn').click()")
    page.wait_for_timeout(200)
    page.remove_listener("dialog", on_dialog)
    return msgs


with local_server(), sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context()
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda r: r.abort())

    # 1. Решили два задания ФИПИ — подпись есть
    page.goto(f"{BASE}/index.html")
    page.evaluate("localStorage.clear(); localStorage.setItem('theme','light');"
                  "localStorage.setItem('fipiMix:filter', JSON.stringify({fipi:true, own:false}));"
                  "localStorage.setItem('ogeProg:oge7:test', '1')")
    mark_two_done(page)
    before = fipi_label(page)
    check("ФИПИ решено 2 из" in before, f"до сброса в №7 есть «ФИПИ решено 2 из …»: {before!r}")

    # 2. Сброс на главной
    msgs = press_reset(page)
    check(any("Готово" in m for m in msgs), f"сброс прошёл до «Готово»: {msgs}")
    keys = page.evaluate("Object.keys(localStorage)")
    check(not any(k.startswith("fipiMix:done:") for k in keys), f"fipiMix:done:* стёрты: {keys}")
    check(not any(k.startswith("ogeProg:") for k in keys), "ogeProg:* стёрты, как раньше")
    check("fipiMix:filter" in keys, "выбор «ФИПИ / наши» остался")
    check("theme" in keys, "тема осталась")

    # 3. В №7 подписи больше нет
    after = fipi_label(page)
    check("ФИПИ решено" not in after, f"после сброса в №7 нет «ФИПИ решено»: {after!r}")

    # 4. Только fipiMix:done: в хранилище — сброс не считает прогресс пустым
    mark_two_done(page)
    page.evaluate("Object.keys(localStorage).filter(k => k.startsWith('ogeProg:')).forEach(k => localStorage.removeItem(k))")
    msgs = press_reset(page)
    check(not any("уже пуст" in m for m in msgs), f"при одних fipiMix:done: сброс не пишет «уже пуст»: {msgs}")
    check(not page.evaluate("Object.keys(localStorage).some(k => k.startsWith('fipiMix:done:'))"),
          "и стирает их")

    check(not errors, f"нет ошибок на страницах: {errors[:3]}")
    browser.close()

if fails:
    print(f"\nПровалено: {len(fails)}")
    sys.exit(1)
print("\nготово")
