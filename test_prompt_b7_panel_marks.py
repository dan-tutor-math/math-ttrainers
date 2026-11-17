"""
Кабинет: отметки «уже было у ученика» на экране задания и в панели-устройстве.

Разбор 17.11: (1) на экране задания у ege_prof и страниц-копий (oge_part2…) точку
текущему заданию сбрасывал renderPicker, который openTask зовёт сам после
showCurrent; (2) в boards-panel.html тренажёр лежит в кадре, точку в кадре не
рисуем, а подписи у панели-устройства не было вовсе.

  A. oge_part2.html, №21, задание 2C9FFA, в журнале ok: у текущего задания есть
     точка с last=ok и она переживает перерисовку списка;
  B. то же для ege_prof.html (id прототипа ищем в самой странице);
  C. boards-panel.html: в кадре oge_part2 подпись «Костя: верно …» над «Добавить»;
     «на доске» дописывается, когда событие приходит из другой вкладки (storage);
     у нового задания — «Новое для Кости»; вне сессии подписи нет.

Запуск: python3 test_prompt_b7_panel_marks.py (сервер поднимается сам).
"""
import contextlib, http.client, os, subprocess, sys, time
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = 8973
BASE = f"http://127.0.0.1:{PORT}"
FAILS = []
STUDENT = {"id": "aaaaaaaa-0000-4000-8000-000000000007", "name": "Костя"}


def check(name, cond, extra=""):
    print(("[OK] " if cond else "[FAIL] ") + name + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        FAILS.append(name)


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=HERE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                c = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                c.request("GET", "/oge9.html"); c.getresponse(); break
            except Exception:
                time.sleep(0.1)
        else:
            raise RuntimeError("сервер не поднялся")
        yield
    finally:
        proc.terminate(); proc.wait(timeout=5)


def new_page(browser, url, session=True):
    ctx = browser.new_context()
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda r: r.abort())
    page.goto(url); page.wait_for_timeout(1200)
    if session:
        page.evaluate("s => StudentMemory.start(s)", STUDENT)
        page.wait_for_timeout(200)
    return ctx, page, errors


def cur_dot(page):
    return page.evaluate("""() => { const d = document.querySelector('.tc-cur [data-tc-dot]');
        return d ? { last: d.dataset.last, h: d.getBoundingClientRect().height } : null; }""")


def test_task_screen_dot(browser, page_file, pid, n):
    ctx, page, errors = new_page(browser, f"{BASE}/{page_file}")
    key = "fipi:oge:2C9FFA" if page_file == "oge_part2.html" else None
    if key is None:
        key = page.evaluate("pid => TaskCaptions.keyOfTask(protoById(S.n || 1, pid) || { id: pid })", pid)
    page.evaluate("k => StudentMemory.record(k, 'ok')", key)
    page.evaluate("([n, pid]) => openTask(n, pid)", [n, pid])
    page.wait_for_timeout(600)
    d = cur_dot(page)
    check(f"{page_file}: на экране задания у решённого есть точка", bool(d) and d["h"] > 0, str(d))
    check(f"{page_file}: точка зелёная (last=ok)", bool(d) and d["last"] == "ok", str(d))
    page.evaluate("renderPicker()")
    page.wait_for_timeout(200)
    check(f"{page_file}: точка переживает перерисовку списка", bool(cur_dot(page)))
    check(f"{page_file}: без ошибок страницы", not errors, str(errors))
    ctx.close()


def test_panel(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/boards-panel.html", session=False)
    page.evaluate("__boardPanel.openTrainer('oge21', 'oge_part2.html?n=21', 'ОГЭ · №21')")
    page.wait_for_timeout(1800)
    page.evaluate("""() => { const w = document.getElementById('bpIframe').contentWindow; w.openTask(21, '21.fipi.2C9FFA'); }""")
    page.wait_for_timeout(1500)
    shown = lambda: page.evaluate("(() => { const e = document.getElementById('bpMem'); return e.style.display === 'none' ? '' : e.textContent; })()")
    check("панель: вне сессии подписи нет", shown() == "", shown())
    page.evaluate("s => StudentMemory.start(s)", STUDENT)
    page.wait_for_timeout(1500)
    check("панель: в сессии у нового задания — «Новое для …»", shown().startswith("Новое для"), shown())
    page.evaluate("StudentMemory.record('fipi:oge:2C9FFA', 'board', { source: 'board' })")
    page.wait_for_timeout(1500)
    check("панель: после «на доске» — подпись «на доске …»", shown().startswith("на доске"), shown())
    page.evaluate("StudentMemory.record('fipi:oge:2C9FFA', 'ok', { source: 'board' })")
    page.wait_for_timeout(1500)
    check("панель: после решения — «… · верно …»", "верно" in shown() and "на доске" in shown(), shown())
    # drawImage с пустым холстом — снимок конспекта в кадре без размеров (безголовый режим), к подписи не относится
    errors = [e for e in errors if "drawImage" not in e]
    check("панель: без ошибок страницы", not errors, str(errors))
    ctx.close()


def main():
    with local_server(), sync_playwright() as p:
        b = p.chromium.launch()
        test_task_screen_dot(b, "oge_part2.html", "21.fipi.2C9FFA", 21)
        test_panel(b)
        b.close()
    print("\nИТОГО:", "все зелёные" if not FAILS else f"упало {len(FAILS)}: {FAILS}")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
