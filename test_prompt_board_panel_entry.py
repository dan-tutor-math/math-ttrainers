"""
Вход на панель тренажёров для доски (boards-panel.html) с главной и из
списка досок.

Проверяет:
  1. Главная: в капсуле «Подборка · Доски · Работы» четвёртая кнопка
     «Панель для доски» → boards-panel.html; видна на компьютере и на
     телефоне, капсула на телефоне в одну строку и не налезает на заголовок
     и меню «⋯».
  2. Нажатие на главной открывает панель без входа: экран подключения
     (устройство ещё не подключено), а у подключённого — сразу список.
  3. Список досок: кнопка «Панель для доски» в ряду действий, ведёт туда же.
  4. На панели есть ссылка «На главную».
  5. Нет ошибок JavaScript.

Запуск: ~/.venvs/trainers/bin/python test_prompt_board_panel_entry.py
"""
import contextlib
import http.client
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 9218
BASE = f"http://127.0.0.1:{PORT}"
FAILS = []
ERRORS = []


def check(name, ok, info=""):
    print(("[OK] " if ok else "[FAIL] ") + name + ("" if ok else f" — {info}"))
    if not ok:
        FAILS.append(name)


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                conn = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                conn.request("GET", "/index.html")
                conn.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        yield
    finally:
        proc.terminate()
        proc.wait(timeout=5)


# список досок спрятан до подтверждения входа (boards-cloud.js) — как в
# test_prompt_boards_trash.py, показываем его сами
BOOT_JS = """() => { const g = document.getElementById('authGate'); if (g) g.style.display = 'none';
  document.getElementById('screenList').style.display = ''; window.boardsAppBoot(); }"""
SEED_JS = """([boards, payloads]) => new Promise((resolve, reject) => {
    const req = indexedDB.open('ogeBoardsDB', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('state');
    req.onsuccess = () => {
      const tx = req.result.transaction('state', 'readwrite');
      const st = tx.objectStore('state');
      st.put({ __v: 2, folders: [], boards, deleted: [], sortMode: 'my' }, 'db');
      Object.keys(payloads).forEach(id => st.put(payloads[id], 'boarddata:' + id));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
})"""
LITE = {"id": "bA", "name": "Урок", "folderId": None, "createdAt": 1000, "updatedAt": 1000,
        "lastOpenedAt": None, "rev": 1, "cellSize": 24, "sheetCols": 76, "sheetRows": 54,
        "pageOrder": "h", "recentColors": [], "colorUsage": {}, "view": {"x": 0, "y": 0, "zoom": 1}}
GEOM_JS = """() => { const r = e => e ? e.getBoundingClientRect() : null;
  const a = document.querySelector('a.panel-toggle'), cap = document.querySelector('.lg-side'),
        h1 = document.querySelector('h1'), menu = document.querySelector('.lg-menu');
  const A = r(a), C = r(cap), H = r(h1), M = r(menu);
  const hit = (p, q) => p && q && p.left < q.right && p.right > q.left && p.top < q.bottom && p.bottom > q.top;
  return { href: a && a.getAttribute('href'), visible: !!(A && A.width > 20 && A.height > 20),
           inCap: !!(A && C && A.left >= C.left - 1 && A.right <= C.right + 1 && A.top >= C.top - 1 && A.bottom <= C.bottom + 1),
           oneRow: !!(C && C.height < 80), overH1: hit(C, H), overMenu: hit(C, M),
           label: a && a.getAttribute('aria-label') }; }"""


def run():
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for label, kw in (("компьютер", {"viewport": {"width": 1280, "height": 800}}),
                          ("телефон", {"viewport": {"width": 375, "height": 800}, "is_mobile": True, "has_touch": True})):
            ctx = browser.new_context(**kw)
            ctx.route("https://**/*", lambda r: r.abort())
            page = ctx.new_page()
            page.on("pageerror", lambda e: ERRORS.append(f"главная: {e}"))
            page.goto(f"{BASE}/index.html")
            page.wait_for_timeout(800)
            g = page.evaluate(GEOM_JS)
            check(f"1. {label}: кнопка «Панель для доски» → boards-panel.html", g["href"] == "boards-panel.html" and g["label"] == "Панель для доски", str(g))
            check(f"1. {label}: видна и внутри капсулы", g["visible"] and g["inCap"], str(g))
            if label == "телефон":
                check("1. телефон: капсула в одну строку, не на заголовке и не на «⋯»", g["oneRow"] and not g["overH1"] and not g["overMenu"], str(g))
            page.click("a.panel-toggle")
            page.wait_for_function("() => location.pathname.endsWith('boards-panel.html') && window.__boardPanel")
            check(f"2. {label}: с главной — на панель, без входа (экран подключения)", page.evaluate("() => document.body.classList.contains('bp-pairing')"))
            page.evaluate("() => localStorage.setItem('bdPanel:link', JSON.stringify({ key: 'k'.repeat(43), devId: 'd', name: 't', local: true }))")
            page.go_back()
            page.wait_for_function("() => !!document.querySelector('a.panel-toggle')")
            page.click("a.panel-toggle")
            page.wait_for_function("() => location.pathname.endsWith('boards-panel.html') && window.__boardPanel")
            check(f"2. {label}: подключённое устройство — сразу список тренажёров",
                  not page.evaluate("() => document.body.classList.contains('bp-pairing')") and page.evaluate("() => document.querySelectorAll('.bd-trainers-item').length > 10"))
            check(f"4. {label}: на панели ссылка «На главную»", page.evaluate("() => !!document.querySelector('.bp-list a[href=\"index.html\"]')"))
            ctx.close()

        ctx = browser.new_context(viewport={"width": 375, "height": 800}, is_mobile=True, has_touch=True)
        ctx.route("https://**/*", lambda r: r.abort())
        page = ctx.new_page()
        page.on("pageerror", lambda e: ERRORS.append(f"доски: {e}"))
        page.goto(f"{BASE}/boards.html")
        page.evaluate(SEED_JS, [[LITE], {"bA": {"objects": [], "imageLib": []}}])
        page.reload()
        page.evaluate(BOOT_JS)
        page.wait_for_function("() => window.getDB && window.getDB().boards.length >= 1")
        page.wait_for_function("() => document.getElementById('blPanelLink').getBoundingClientRect().width > 0", timeout=8000)
        b = page.evaluate("""() => { const a = document.getElementById('blPanelLink'); const r = a && a.getBoundingClientRect();
            return { href: a && a.getAttribute('href'), w: r ? r.width : 0, text: a ? a.textContent.trim() : '',
                     deco: a ? getComputedStyle(a).textDecorationLine : '' }; }""")
        check("3. список досок: кнопка «Панель для доски» → boards-panel.html", b["href"] == "boards-panel.html" and "Панель для доски" in b["text"] and b["w"] > 40, str(b))
        check("3. без подчёркивания ссылки", b["deco"] == "none", b["deco"])
        page.click("#blPanelLink")
        page.wait_for_function("() => location.pathname.endsWith('boards-panel.html') && window.__boardPanel")
        check("3. из списка досок — на панель", True)
        ctx.close()

        check("5. нет ошибок JavaScript", not ERRORS, "\n".join(ERRORS[:5]))
        browser.close()


with local_server():
    run()
print("\nИТОГ: " + ("всё прошло" if not FAILS else f"упало {len(FAILS)}: " + "; ".join(FAILS)))
sys.exit(1 if FAILS else 0)
