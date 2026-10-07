"""
«Вид доски и несколько вкладок»: доска всё равно открывалась не там, где
закончили, если досок открыто несколько вкладок (так бывает на уроке).

Что было. Вкладка, где доска открыта давно, держит в памяти СВОЮ камеру —
место, где в ней работали последний раз. При сворачивании, переключении на
другую вкладку и закрытии она записывала эту камеру видом доски с ТЕКУЩИМ
временем (rememberView(true) писал без проверки, двигалась ли камера), и
этот старый вид становился «самым свежим» — перебивал место, где на самом
деле закончили в другой вкладке. Плюс сама старая вкладка, когда на неё
возвращались, показывала доску там, где её бросили.

Проверяем:
  A. Старая вкладка, свернувшись или закрывшись, не затирает свежий вид:
     доска в новой вкладке открывается там, где закончили во второй.
  B. На старую вкладку вернулись — камера переехала туда, где закончили в
     другой вкладке (и это не записалось как новое движение).
  C. Пока старая вкладка в фоне, свежий вид из соседней она подхватывает
     сразу (сообщение storage), и закрытие её потом ничего не портит.
  D. Видимая вкладка рядом (два окна бок о бок) по чужой прокрутке не
     прыгает — только когда на неё вернутся.
  E. Своё несохранённое движение (до паузы автосохранения) при сворачивании
     и закрытии по-прежнему записывается (регрессия «вставка и вид доски»).
  F. Если в этой вкладке камеру уже двигали после чужого вида — чужой не
     подхватывается, своё главнее.
  G. Нет ошибок JavaScript.

Realtime отсюда не проверить (websocket к Supabase закрыт) — урок с учеником
Даниил перепроверяет на сайте.

Запуск: python3 test_prompt_view_tabs.py (сервер поднимается сам).
"""
import contextlib
import http.client
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 9087
BASE = f"http://127.0.0.1:{PORT}"
fails = []


def check(msg, cond, extra=""):
    print(("[OK]   " if cond else "[FAIL] ") + msg + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        fails.append(msg)


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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


BOOT_JS = """() => {
  const gate = document.getElementById('authGate');
  if (gate) gate.style.display = 'none';
  window.boardsAppBoot();
}"""


def lite(bid, name):
    return {"id": bid, "name": name, "folderId": None,
            "createdAt": 1000, "updatedAt": 1000, "lastOpenedAt": None, "rev": 1,
            "cellSize": 24, "sheetCols": 76, "sheetRows": 54, "pageOrder": "h",
            "recentColors": [], "colorUsage": {}}


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

# Безголовый браузер считает видимыми все вкладки сразу, поэтому «свернули» и
# «вернулись» изображаем сами: подменяем document.hidden и шлём событие
HIDE_JS = """(h) => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => h ? 'hidden' : 'visible' });
  document.dispatchEvent(new Event('visibilitychange'));
}"""


def boot(page, seed=False):
    page.route("https://**/*", lambda r: r.abort())
    page.goto(f"{BASE}/boards.html")
    if seed:
        page.evaluate(SEED_JS, [[lite("bA", "Урок"), lite("bB", "Другая")],
                                {"bA": {"objects": [], "imageLib": []}, "bB": {"objects": [], "imageLib": []}}])
        page.reload()
    page.wait_for_function("() => typeof window.boardsAppBoot === 'function'")
    page.evaluate(BOOT_JS)
    page.wait_for_function("() => window.getDB && window.getDB().boards.length >= 2")


def new_page(ctx, errors):
    page = ctx.new_page()
    page.set_viewport_size({"width": 1400, "height": 900})
    page.on("pageerror", lambda e: errors.append(str(e)))
    return page


def open_b(page, bid):
    page.evaluate(f"() => window.openBoard('{bid}')")
    page.wait_for_function(f"() => window.getCurrentBoard() && window.getCurrentBoard().id === '{bid}' && boardActive && Array.isArray(window.getCurrentBoard().objects)")
    page.wait_for_timeout(250)


def back(page):
    page.click("#bdBack")
    page.wait_for_timeout(400)


def scroll(page, dx, dy):
    page.mouse.move(700, 450)
    page.mouse.wheel(dx, dy)
    page.wait_for_timeout(100)


def settle(page):
    page.wait_for_timeout(900)       # дольше паузы автосохранения вида (700 мс)


def hide(page, h):
    page.evaluate(HIDE_JS, h)
    page.wait_for_timeout(250)


def view_center(page):
    """какая точка доски сейчас посередине окна"""
    return page.evaluate("() => [cam.x + (window.innerWidth/2 - boardInset)/cam.zoom, cam.y + cssH/2/cam.zoom, cam.zoom]")


def close_to(a, b, tol=0.6):
    return all(abs(x - y) <= tol for x, y in zip(a, b))


def ls_view(page, bid="bA"):
    return page.evaluate(f"() => (JSON.parse(localStorage.getItem('boardsViews') || '{{}}'))['{bid}'] || null")


def run(browser):
    errors = []
    ctx = browser.new_context()

    # ── A. старая вкладка сворачивается и закрывается ──
    tab1 = new_page(ctx, errors)
    boot(tab1, seed=True)
    open_b(tab1, "bA")
    scroll(tab1, -1800, 1300)
    settle(tab1)
    p1 = view_center(tab1)

    tab2 = new_page(ctx, errors)
    boot(tab2)
    open_b(tab2, "bA")
    check("A: во второй вкладке доска открылась там, где закончили в первой", close_to(p1, view_center(tab2)),
          f"{p1} / {view_center(tab2)}")
    scroll(tab2, 2600, -900)
    settle(tab2)
    p2 = view_center(tab2)
    back(tab2)

    # первая вкладка всё это время была в фоне — изображаем, что её свернули
    # (в браузере это переключение вкладок) и закрыли
    hide(tab1, True)
    stored = ls_view(tab2)
    check("A: свёрнутая старая вкладка не переписала вид своим старым",
          stored and abs(stored["cx"] - p2[0]) < 0.6, f"{stored} / {p2}")
    tab1.close(run_before_unload=True)
    time.sleep(0.3)
    open_b(tab2, "bA")
    check("A: после закрытия старой вкладки доска открылась там, где закончили", close_to(p2, view_center(tab2)),
          f"{p2} / {view_center(tab2)}")

    # ── B. вернулись на старую вкладку ──
    tab1 = new_page(ctx, errors)
    boot(tab1)
    open_b(tab1, "bA")                          # tab1 — на p2
    hide(tab1, True)                            # ушли с неё…
    scroll(tab2, -700, -1500)                   # …и поработали во второй
    settle(tab2)
    p3 = view_center(tab2)
    back(tab2)
    hide(tab1, False)                           # вернулись на первую
    tab1.wait_for_timeout(300)
    check("B: старая вкладка при возвращении переехала туда, где закончили", close_to(p3, view_center(tab1)),
          f"{p3} / {view_center(tab1)}")
    at_before = ls_view(tab1)["at"]
    tab1.wait_for_timeout(900)
    check("B: переезд не записался как новое движение", ls_view(tab1)["at"] == at_before,
          f"{at_before} → {ls_view(tab1)['at']}")

    # ── C. старая вкладка в фоне подхватывает свежий вид сразу ──
    hide(tab1, True)
    open_b(tab2, "bA")
    scroll(tab2, 1500, 2100)
    settle(tab2)
    p4 = view_center(tab2)
    back(tab2)
    tab1.wait_for_timeout(300)
    check("C: фоновая вкладка подхватила свежий вид без возвращения на неё", close_to(p4, view_center(tab1)),
          f"{p4} / {view_center(tab1)}")
    tab1.close(run_before_unload=True)
    time.sleep(0.3)
    open_b(tab2, "bA")
    check("C: после закрытия фоновой вкладки доска там же", close_to(p4, view_center(tab2)),
          f"{p4} / {view_center(tab2)}")
    back(tab2)

    # ── D. видимая вкладка рядом не прыгает ──
    tab1 = new_page(ctx, errors)
    boot(tab1)
    open_b(tab1, "bA")
    hide(tab1, False)
    mine = view_center(tab1)
    open_b(tab2, "bA")
    scroll(tab2, -2200, 600)
    settle(tab2)
    p5 = view_center(tab2)
    back(tab2)
    tab1.wait_for_timeout(300)
    check("D: видимая соседняя вкладка не прыгнула от чужой прокрутки", close_to(mine, view_center(tab1)),
          f"{mine} / {view_center(tab1)}")
    hide(tab1, True)
    hide(tab1, False)
    check("D: а когда на неё вернулись — переехала", close_to(p5, view_center(tab1)),
          f"{p5} / {view_center(tab1)}")

    # ── E. своё несохранённое движение при сворачивании и закрытии ──
    scroll(tab1, 900, 900)
    tab1.wait_for_timeout(50)                   # меньше паузы автосохранения
    p6 = view_center(tab1)
    hide(tab1, True)
    stored = ls_view(tab1)
    check("E: при сворачивании своё свежее движение записалось сразу",
          stored and abs(stored["cx"] - p6[0]) < 0.6 and abs(stored["cy"] - p6[1]) < 0.6, f"{stored} / {p6}")
    hide(tab1, False)
    scroll(tab1, -400, 1200)
    tab1.wait_for_timeout(50)
    p7 = view_center(tab1)
    tab1.close(run_before_unload=True)
    time.sleep(0.3)
    open_b(tab2, "bA")
    check("E: при закрытии своё свежее движение записалось", close_to(p7, view_center(tab2)),
          f"{p7} / {view_center(tab2)}")
    back(tab2)

    # ── F. своё движение главнее чужого ──
    tab1 = new_page(ctx, errors)
    boot(tab1)
    open_b(tab1, "bA")
    open_b(tab2, "bA")
    scroll(tab2, 1300, -300)
    settle(tab2)
    back(tab2)
    # в первой подвинули камеру мимо rememberView (жест, клавиши), до
    # отрисовки — камера уже не та, что была запомнена
    tab1.evaluate("() => { cam.x += 333; }")
    p8 = view_center(tab1)
    hide(tab1, True)
    hide(tab1, False)
    check("F: в вкладке, где камеру уже двигали, чужой вид не подхватился", close_to(p8, view_center(tab1)),
          f"{p8} / {view_center(tab1)}")
    tab1.close(run_before_unload=True)
    time.sleep(0.3)
    open_b(tab2, "bA")
    check("F: и её движение записалось как последнее", close_to(p8, view_center(tab2)),
          f"{p8} / {view_center(tab2)}")

    # ── G ──
    check("G: нет ошибок JavaScript", not errors, "; ".join(errors[:3]))
    ctx.close()


def main():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            run(browser)
        finally:
            browser.close()
    print()
    if fails:
        print(f"НЕ ПРОШЛО: {len(fails)}")
        sys.exit(1)
    print("ВСЁ ПРОШЛО")


if __name__ == "__main__":
    main()
