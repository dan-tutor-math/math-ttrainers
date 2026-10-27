"""
Сопряжение панели тренажёров: у каждой доски свой код и свои устройства.

Учитель занимался на доске «Семён Лис», открыл другую доску в другой
вкладке — а задания с телефона шли на первую, туда же всплывал запрос на
подключение. Теперь устройство подключают к доске, и оно шлёт на неё.

Проверяет (доски «Семён Лис» и «Анна» в двух вкладках одного браузера):
  1. У досок разные коды.
  2. Код доски «Семён Лис» — запрос только в её вкладке; задания — на неё,
     даже когда на экране вкладка «Анны».
  3. Та же панель подключается и к «Анне»: в панели список из двух досок,
     задания — на «Анну»; кнопкой в списке — снова на «Семёна», без кода.
  4. Одна доска в двух вкладках — принимает одна, задание ложится один
     раз; вкладку закрыли — приём подхватывает вторая.
  5. Вышли из доски в список — устройство этой доски видит «не в сети».
  6. Подключения этапа 1 (один код на компьютер) переходят к первой
     открытой доске, общие ключи убраны.
  7. Нет ошибок JavaScript.

Запуск: ~/.venvs/trainers/bin/python test_prompt_board_link_per_board.py
"""
import contextlib
import http.client
import json
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 9229
BASE = f"http://127.0.0.1:{PORT}"
FAILS = []
ERRORS = []
PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="


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
                conn.request("GET", "/boards.html")
                conn.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        yield
    finally:
        proc.terminate()
        proc.wait(timeout=5)


BOOT_JS = """() => { const g = document.getElementById('authGate'); if (g) g.style.display = 'none'; window.boardsAppBoot(); }"""
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


def lite(bid, name):
    return {"id": bid, "name": name, "folderId": None, "createdAt": 1000, "updatedAt": 1000,
            "lastOpenedAt": None, "rev": 1, "cellSize": 24, "sheetCols": 76, "sheetRows": 54,
            "pageOrder": "h", "recentColors": [], "colorUsage": {}, "view": {"x": 0, "y": 0, "zoom": 1}}


IMAGES = "window.getCurrentBoard().objects.filter(o => o.type === 'image')"


def watch(page, tag):
    page.on("pageerror", lambda e: ERRORS.append(f"{tag}: {e}"))


def board_tab(ctx, bid, tag):
    p = ctx.new_page()
    watch(p, tag)
    p.goto(f"{BASE}/boards.html")
    p.evaluate(BOOT_JS)
    p.wait_for_function("() => window.getDB && window.getDB().boards.length >= 2")
    p.evaluate(f"() => window.openBoard({json.dumps(bid)})")
    p.wait_for_function(f"() => window.getCurrentBoard() && window.getCurrentBoard().id === {json.dumps(bid)}")
    p.wait_for_timeout(300)
    return p


def count(p):
    return p.evaluate(f"() => {IMAGES}.length")


def status(panel):
    return panel.inner_text("#bpStatusText")


def wait_status(panel, text, timeout=12000):
    try:
        panel.wait_for_function(f"() => document.getElementById('bpStatusText').textContent.includes({json.dumps(text)})", timeout=timeout)
        return True
    except Exception:
        return False


def send(panel):
    panel.evaluate(f"() => {{ window.__r = null; __boardPanel.client.send('add-task', {{ img: {json.dumps(PNG)}, css: {{ w: 300, h: 120 }} }}).then(r => window.__r = r); }}")
    panel.wait_for_function("() => window.__r === 'ok'", timeout=20000)


def pair(panel, board, code, allow=True):
    panel.evaluate(f"() => {{ window.__p = null; __boardPanel.client.pair({json.dumps(code)}, 'Телефон').then(r => window.__p = r); }}")
    board.wait_for_selector("#linkAsk.show", timeout=8000)
    board.click("#linkAskAllow" if allow else "#linkAskDeny")
    panel.wait_for_function("() => window.__p !== null", timeout=10000)
    return panel.evaluate("() => window.__p")


def run():
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1300, "height": 850})
        ctx.route("https://**/*", lambda r: r.abort())
        seed = ctx.new_page()
        seed.goto(f"{BASE}/boards.html")
        seed.evaluate(SEED_JS, [[lite("bA", "Семён Лис"), lite("bB", "Анна")],
                                {"bA": {"objects": [], "imageLib": []}, "bB": {"objects": [], "imageLib": []}}])
        # этап 1: общий код и устройство на компьютер — должны перейти к первой открытой доске
        seed.evaluate("() => { localStorage.setItem('bdLink:code', JSON.stringify('ABCDEF')); localStorage.setItem('bdLink:devices', JSON.stringify([{ id: 'old1', name: 'Старый телефон', key: 'k'.repeat(43), addedAt: 1 }])); }")
        seed.close()

        ta = board_tab(ctx, "bA", "Семён Лис")
        ta.wait_for_function("() => boardLink.active", timeout=8000)
        mig = ta.evaluate("() => ({ devs: boardLink.devices().map(d => d.name), code: boardLink.code, g: localStorage.getItem('bdLink:devices'), gc: localStorage.getItem('bdLink:code') })")
        check("6. устройство этапа 1 перешло к первой открытой доске", mig["devs"] == ["Старый телефон"] and mig["code"] == "ABCDEF", str(mig))
        check("6. общие ключи этапа 1 убраны", mig["g"] is None and mig["gc"] is None, str(mig))

        tb = board_tab(ctx, "bB", "Анна")
        tb.wait_for_function("() => boardLink.active", timeout=8000)
        ca, cb = ta.evaluate("() => boardLink.code"), tb.evaluate("() => boardLink.code")
        check("1. у досок разные коды", ca != cb, f"{ca} / {cb}")
        check("1. у «Анны» своих устройств нет", tb.evaluate("() => boardLink.devices().length") == 0)

        # 2. подключение к «Семёну»
        panel = ctx.new_page()
        watch(panel, "панель")
        panel.goto(f"{BASE}/boards-panel.html")
        panel.wait_for_function("() => window.__boardPanel")
        tb.bring_to_front()
        r = pair(panel, ta, ca)
        check("2. код «Семёна» — подключено", r == "ok", r)
        check("2. запрос был только во вкладке «Семёна»", not tb.evaluate("() => document.getElementById('linkAsk').classList.contains('show')"))
        check("2. панель показывает доску «Семён Лис»", wait_status(panel, "«Семён Лис»"), status(panel))
        tb.bring_to_front()
        send(panel)
        check("2. задание — на «Семёна», хотя на экране «Анна»", count(ta) == 1 and count(tb) == 0, f"{count(ta)} / {count(tb)}")

        # 3. та же панель — к «Анне»
        r = pair(panel, tb, cb)
        check("3. код «Анны» — подключено", r == "ok", r)
        check("3. панель показывает «Анну»", wait_status(panel, "«Анна»"), status(panel))
        links = panel.evaluate("() => __boardPanel.client.links()")
        check("3. в панели список из двух досок", sorted(l["board"] for l in links) == ["Анна", "Семён Лис"], str(links))
        send(panel)
        check("3. задание — на «Анну»", count(ta) == 1 and count(tb) == 1, f"{count(ta)} / {count(tb)}")
        panel.click("#bpStatus")
        panel.wait_for_function("() => document.querySelectorAll('#bpBoards .bp-board').length === 2")
        panel.click("#bpBoards .bp-board:has-text('Семён Лис')")
        check("3. кнопкой в списке — снова «Семён», без кода", wait_status(panel, "Подключено к доске «Семён Лис»"), status(panel))
        send(panel)
        check("3. задание — на «Семёна»", count(ta) == 2 and count(tb) == 1, f"{count(ta)} / {count(tb)}")

        # 4. «Семён» во второй вкладке — без дублей; первую закрыли — приём у второй
        ta2 = board_tab(ctx, "bA", "Семён Лис 2")
        ta2.wait_for_timeout(800)
        act = [ta.evaluate("() => boardLink.active"), ta2.evaluate("() => boardLink.active")]
        check("4. одна доска в двух вкладках — принимает одна", act == [True, False], str(act))
        send(panel)
        # вкладки одной доски сами сводят её через хранилище — ждём, и в обеих
        # должно быть одно и то же: 3 задания с одинаковыми id (дубль дал бы 4)
        ta.wait_for_timeout(2500)
        ids = lambda p: sorted(p.evaluate(f"() => {IMAGES}.map(o => o.id)"))
        check("4. задание легло один раз", count(ta) == 3 and len(set(ids(ta))) == 3 and ids(ta2) in (ids(ta), ids(ta)[:2]), f"{ids(ta)} / {ids(ta2)}")
        ta.wait_for_timeout(900)   # сохранение доски отложено — до закрытия
        ta.close()
        ta2.wait_for_function("() => boardLink.active", timeout=8000)
        check("4. первую вкладку закрыли — приём подхватила вторая", True)
        n2 = count(ta2)
        send(panel)
        check("4. задание — во вторую вкладку", count(ta2) == n2 + 1, f"{n2} → {count(ta2)}")

        # 5. вышли из доски в список
        ta2.evaluate("() => backToList()")
        check("5. вышли из доски — у устройства «не в сети»", wait_status(panel, "не в сети", 12000), status(panel))
        check("5. вкладка в списке досок ничего не принимает", ta2.evaluate("() => !boardLink.active && boardLink.boardId === null"))

        check("7. нет ошибок JavaScript", not ERRORS, "\n".join(ERRORS[:5]))
        browser.close()


with local_server():
    run()
print("\nИТОГ: " + ("всё прошло" if not FAILS else f"упало {len(FAILS)}: " + "; ".join(FAILS)))
sys.exit(1 if FAILS else 0)
