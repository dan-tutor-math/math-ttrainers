"""
Задания одного тренажёра ложатся на доску одного размера — и ширины
карточки, и масштаба (промпт «сопряжение панели», после этапа 3).

Сценарий учителя: ОГЭ №8 с телефона — задание на доску; потом «+1» (на
экране два задания) и «Добавить» — второе (карточка «+») ложилось своей,
«телефонной» шириной; после смены типа ширина тоже сбрасывалась.

Проверяет (вкладка-панель с шириной телефона, доска в той же вкладке
браузера):
  1. Доска присылает панели тренажёр и ширину карточки последнего задания
     стопки (pong: ref = { tid, w }).
  2. Пакет из двух (основное и карточка «+») — оба той же ширины и того же
     масштаба, что первое.
  3. Другой тип того же номера — та же ширина и масштаб.
  4. Встроенная панель: то же для пакета «+1».
  5. Другой тренажёр (ОГЭ №6) ширину ОГЭ №8 не перенимает.
  6. Столбики (сложение) ширину не запоминают — у них она зависит от цифр.
  7. Нет ошибок JavaScript.

Запуск: ~/.venvs/trainers/bin/python test_prompt_board_task_width_same.py
"""
import contextlib
import http.client
import json
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 9228
BASE = f"http://127.0.0.1:{PORT}"
FAILS = []
ERRORS = []
PICK = "document.querySelectorAll('.mode-card:not(.soon):not(.demo)')[%d].click()"


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
LITE = {"id": "bA", "name": "Урок", "folderId": None, "createdAt": 1000, "updatedAt": 1000,
        "lastOpenedAt": None, "rev": 1, "cellSize": 24, "sheetCols": 76, "sheetRows": 54,
        "pageOrder": "h", "recentColors": [], "colorUsage": {}, "view": {"x": 0, "y": 0, "zoom": 1}}
IMAGES = "window.getCurrentBoard().objects.filter(o => o.type === 'image')"
SUMMARY = f"""() => {IMAGES}.map(o => ({{ tid: o.gen && o.gen.tid, node: o.gen && o.gen.node, cw: o.css && o.css.cw,
    w: o.css && o.css.w, k: o.css ? o.w / o.css.w : null, stack: o.stack && o.stack.id }}))"""


def watch(page, tag):
    page.on("pageerror", lambda e: ERRORS.append(f"{tag}: {e}"))


def count(board):
    return board.evaluate(f"() => {IMAGES}.length")


def wait_count(board, n, timeout=25000):
    board.wait_for_function(f"() => {IMAGES}.length === {n}", timeout=timeout)


def frame_ready(page, sel):
    page.wait_for_function(f"""() => {{ try {{ const f = document.querySelector({json.dumps(sel)});
        return f.contentDocument.readyState === 'complete' && typeof f.contentWindow.tsGetState === 'function'; }}
        catch (e) {{ return false; }} }}""", timeout=25000)
    page.wait_for_timeout(600)


def in_frame(page, sel, js):
    return page.evaluate(f"() => document.querySelector({json.dumps(sel)}).contentWindow.eval({json.dumps(js)})")


def same(a, b, name):
    check(f"{name}: ширина карточки та же", abs(a["w"] - b["w"]) < 1.5, f"{a['w']} / {b['w']}")
    check(f"{name}: масштаб тот же", abs(a["k"] - b["k"]) < 1e-6, f"{a['k']} / {b['k']}")


def run():
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1400, "height": 900})
        ctx.route("https://**/*", lambda r: r.abort())
        board = ctx.new_page()
        watch(board, "доска")
        board.goto(f"{BASE}/boards.html")
        board.evaluate(SEED_JS, [[LITE], {"bA": {"objects": [], "imageLib": []}}])
        board.reload()
        board.evaluate(BOOT_JS)
        board.wait_for_function("() => window.getDB && window.getDB().boards.length >= 1")
        board.evaluate("() => window.openBoard('bA')")
        board.wait_for_function("() => window.getCurrentBoard() && Array.isArray(window.getCurrentBoard().objects)")
        board.wait_for_function("() => boardLink && boardLink.active", timeout=8000)
        board.evaluate("() => boardLink.linkLocalPanel()")

        panel = ctx.new_page()
        watch(panel, "панель")
        panel.set_viewport_size({"width": 390, "height": 820})
        panel.goto(f"{BASE}/boards-panel.html")
        panel.wait_for_function("() => window.__boardPanel && document.getElementById('bpStatusText').textContent.includes('Подключено')", timeout=15000)
        panel.evaluate("() => __boardPanel.openTrainer('oge8', 'oge8.html', 'oge8')")
        frame_ready(panel, "#bpIframe")
        in_frame(panel, "#bpIframe", PICK % 0)
        panel.wait_for_timeout(800)

        # 1. первое задание
        panel.click("#bpAddBtn")
        wait_count(board, 1)
        s = board.evaluate(SUMMARY)
        panel.wait_for_timeout(2800)   # доска присылает ширину стопки в pong
        ref = panel.evaluate("() => __boardPanel.client.state().board.ref")
        check("1. доска прислала тренажёр и ширину карточки", ref and ref.get("tid") == "oge8" and abs(ref.get("w", 0) - s[0]["w"]) < 0.5, str(ref))

        # 2. «+1» и «Добавить» — два задания
        in_frame(panel, "#bpIframe", "appendAddedTasks(1)")
        panel.wait_for_timeout(1500)
        panel.click("#bpAddBtn")
        wait_count(board, 3)
        s = board.evaluate(SUMMARY)
        check("2. в пакете основное и карточка «+»", s[1]["node"] != s[2]["node"], f"{s[1]['node']} / {s[2]['node']}")
        same(s[0], s[1], "2. основное")
        same(s[0], s[2], "2. карточка «+»")
        check("2. все в одной стопке", len({x["stack"] for x in s}) == 1, str([x["stack"] for x in s]))
        panel.wait_for_timeout(2800)

        # 3. другой тип того же номера
        in_frame(panel, "#bpIframe", "document.getElementById('nextTypeBtn').click()")
        panel.wait_for_timeout(1200)
        panel.click("#bpAddBtn")
        board.wait_for_function(f"() => {IMAGES}.length >= 4", timeout=25000)
        s = board.evaluate(SUMMARY)
        same(s[0], s[3], "3. другой тип")

        # 5. другой тренажёр ширину не перенимает
        panel.wait_for_timeout(2800)
        panel.evaluate("() => __boardPanel.openTrainer('oge6', 'oge6.html', 'oge6')")
        frame_ready(panel, "#bpIframe")
        in_frame(panel, "#bpIframe", PICK % 1)
        panel.wait_for_timeout(800)
        sent = panel.evaluate(f"""async () => {{ const f = document.getElementById('bpIframe'); const ref = __boardPanel.client.state().board.ref; let cw = 'x';
            await ttSnapTrainerTasks(f.contentWindow, 'oge6', 'oge6.html', {{ widthFor: (gen) => (cw = ttWidthLike(ref && ref.tid, ref && ref.w, gen)), scale: 2, onShot: async () => {{}} }});
            return {{ ref, cw }}; }}""")
        check("5. ОГЭ №6 после ОГЭ №8 — своя ширина", sent["ref"] and sent["ref"]["tid"] == "oge8" and sent["cw"] is None, str(sent))

        # 6. столбики ширину не запоминают
        col = panel.evaluate("""async () => { await __boardPanel.openTrainer('add_col', 'addition.html', 'add_col'); return true; }""")
        frame_ready(panel, "#bpIframe")
        cws = panel.evaluate("""async () => { const f = document.getElementById('bpIframe'); const out = [];
            await ttSnapTrainerTasks(f.contentWindow, 'add_col', 'addition.html', { widthFor: () => null, scale: 2, onShot: async (it) => { out.push(it.cw); } });
            return out; }""")
        check("6. столбик: ширина не запоминается", cws and all(c is None for c in cws), str(cws))

        # 4. встроенная панель: пакет «+1»
        b2 = ctx.new_page()
        watch(b2, "доска 2")
        board.close()
        b2.goto(f"{BASE}/boards.html")
        b2.evaluate(SEED_JS, [[dict(LITE, id="bB", name="Встроенная")], {"bB": {"objects": [], "imageLib": []}}])
        b2.reload()
        b2.evaluate(BOOT_JS)
        b2.wait_for_function("() => window.getDB && window.getDB().boards.length >= 1")
        b2.evaluate("() => window.openBoard('bB')")
        b2.wait_for_function("() => window.getCurrentBoard() && Array.isArray(window.getCurrentBoard().objects)")
        b2.evaluate("() => { setTrainersPanel('open'); openTrainerInPanel('oge8', 'oge8.html', 'oge8'); }")
        frame_ready(b2, "#bdTrainersIframe")
        in_frame(b2, "#bdTrainersIframe", PICK % 0)
        b2.wait_for_timeout(800)
        b2.click("#bdTrainersAddBtn")
        wait_count(b2, 1)
        in_frame(b2, "#bdTrainersIframe", "appendAddedTasks(1)")
        b2.wait_for_timeout(1500)
        b2.click("#bdTrainersAddBtn")
        wait_count(b2, 3)
        s = b2.evaluate(SUMMARY)
        same(s[0], s[1], "4. встроенная: основное")
        same(s[0], s[2], "4. встроенная: карточка «+»")

        check("7. нет ошибок JavaScript", not ERRORS, "\n".join(ERRORS[:5]))
        browser.close()


with local_server():
    run()
print("\nИТОГ: " + ("всё прошло" if not FAILS else f"упало {len(FAILS)}: " + "; ".join(FAILS)))
sys.exit(1 if FAILS else 0)
