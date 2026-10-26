"""
Сопряжение панели тренажёров с доской, этап 2: ручное размещение задания
с призраком (boards-core.js — placeTaskManually; кнопка «Добавить вручную»
во встроенной панели и в boards-panel.html).

Проверяет:
  1. «Добавить вручную» во встроенной панели: панель свёрнута, на доске
     призрак — картинка задания (полупрозрачная, пунктир), рядом «Закрепить»
     и «Отмена». Призрака нет в B.objects, в сохранённой базе (IndexedDB), в
     отмене; пока его двигают и растягивают, ни saveDB, ни pushUndo не
     зовутся — значит, и в облако / совместную сессию он не уходит (они
     живут от сохранения доски).
  2. Призрак двигается мышью и растягивается за угол с сохранением
     пропорций; при прокрутке доски едет вместе с ней.
  3. «Закрепить» — обычное задание ровно там и такого размера, где был
     призрак, с теми же полями, что у обычной вставки; новая стопка; панель
     вернулась; масштаб запомнен (B.taskScale).
  4. Следующее «Добавить на доску» — в эту стопку и в этом масштабе; новая
     стопка в другом месте доски — тоже в запомненном масштабе.
  5. «Отмена» (кнопка и Esc) — ничего не вставлено, панель вернулась.
  6. Растянули вставленное задание за угол — масштаб запомнен, следующее
     задание стопки берёт его.
  7. С вкладки-панели: «Добавить вручную» → призрак с подписью устройства,
     панель «Размещаем на доске…»; пришедшее в это время обычное задание
     ждёт в очереди и не трогает призрак; «Отмена» → панель «Отменено на
     доске», очередь доехала; второй раз «Закрепить» → «Закреплено на доске».
  8. Нет ошибок JavaScript.

Запуск: ~/.venvs/trainers/bin/python test_prompt_board_manual_place.py
"""
import contextlib
import http.client
import json
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 9214
BASE = f"http://127.0.0.1:{PORT}"
FAILS = []
ERRORS = []
PICK = "document.querySelectorAll('.mode-card:not(.soon):not(.demo)')[1].click()"


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
        else:
            raise RuntimeError("локальный сервер не поднялся")
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
IDB_JS = """() => new Promise((resolve) => {
    const req = indexedDB.open('ogeBoardsDB', 1);
    req.onsuccess = () => {
      const tx = req.result.transaction('state', 'readonly');
      const st = tx.objectStore('state');
      const a = st.get('db'), b = st.get('boarddata:bA');
      tx.oncomplete = () => resolve(JSON.stringify(a.result || null) + JSON.stringify(b.result || null));
    };
})"""
LITE = {"id": "bA", "name": "Урок", "folderId": None, "createdAt": 1000, "updatedAt": 1000,
        "lastOpenedAt": None, "rev": 1, "cellSize": 24, "sheetCols": 76, "sheetRows": 54,
        "pageOrder": "h", "recentColors": [], "colorUsage": {}, "view": {"x": 0, "y": 0, "zoom": 1}}
IMAGES = "window.getCurrentBoard().objects.filter(o => o.type === 'image')"


def watch(page, tag):
    page.on("pageerror", lambda e: ERRORS.append(f"{tag}: {e}"))


def count(board):
    return board.evaluate(f"() => {IMAGES}.length")


def wait_count(board, n, timeout=20000):
    board.wait_for_function(f"() => {IMAGES}.length === {n}", timeout=timeout)


def ghost(board):
    return board.evaluate("""() => placeGhost ? { x: placeGhost.x, y: placeGhost.y, w: placeGhost.w, h: placeGhost.h,
        src: placeGhost.img.src, rect: (() => { const r = placeGhost.el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })() } : null""")


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
        board.evaluate("() => setTrainersPanel('open')")
        board.evaluate("() => openTrainerInPanel('oge6', 'oge6.html', 'oge6')")
        board.wait_for_function("""() => { try { const f = document.getElementById('bdTrainersIframe');
            return f.contentDocument.readyState === 'complete' && typeof f.contentWindow.tsGetState === 'function'; }
            catch (e) { return false; } }""", timeout=20000)
        board.evaluate(f"() => document.getElementById('bdTrainersIframe').contentWindow.eval({json.dumps(PICK)})")
        board.wait_for_timeout(800)
        # шпионы: сохранение и отмена не должны зваться, пока живёт призрак
        board.evaluate("""() => { window.__saves = 0; window.__undos = 0;
            const s = saveDB, u = pushUndo;
            saveDB = function(){ window.__saves++; return s.apply(this, arguments); };
            pushUndo = function(){ window.__undos++; return u.apply(this, arguments); }; }""")

        # 1. призрак
        board.click("#bdTrainersManualBtn")
        board.wait_for_function("() => !!placeGhost", timeout=20000)
        board.wait_for_timeout(400)
        g = ghost(board)
        check("1. призрак на экране", g and g["rect"]["w"] > 50 and g["rect"]["h"] > 20, str(g and g["rect"]))
        check("1. в призраке — картинка задания", g and g["src"].startswith("data:image/png"), g and g["src"][:30])
        st = board.evaluate("""() => { const e = placeGhost.el, i = placeGhost.img;
            return { outline: getComputedStyle(e).outlineStyle, op: +getComputedStyle(i).opacity,
                     pin: !!document.querySelector('.bd-ghost-bar .bd-ghost-pin'), cancel: !!document.querySelector('.bd-ghost-bar .bd-ghost-cancel') }; }""")
        check("1. полупрозрачный, с пунктиром", st["outline"] == "dashed" and 0.3 < st["op"] < 0.9, str(st))
        check("1. рядом «Закрепить» и «Отмена»", st["pin"] and st["cancel"], str(st))
        check("1. встроенная панель свёрнута", board.evaluate("() => !trainersPanelIsOpen() && document.getElementById('bdTrainersStrip').classList.contains('show')"))
        check("1. призрака нет в B.objects", count(board) == 0)
        src = g["src"]
        check("1. картинки призрака нет в данных доски", src not in board.evaluate("() => JSON.stringify(window.getCurrentBoard())"))
        board.wait_for_timeout(500)
        check("1. картинки призрака нет в сохранённой базе", src not in board.evaluate(IDB_JS))

        # 2. двигаем и растягиваем
        r = g["rect"]
        zoom = board.evaluate("() => cam.zoom")
        board.mouse.move(r["x"] + r["w"] / 2, r["y"] + r["h"] / 2)
        board.mouse.down()
        board.mouse.move(r["x"] + r["w"] / 2 + 60, r["y"] + r["h"] / 2 + 40, steps=6)
        board.mouse.up()
        g2 = ghost(board)
        check("2. призрак сдвинулся мышью", abs(g2["x"] - g["x"] - 60 / zoom) < 2 and abs(g2["y"] - g["y"] - 40 / zoom) < 2, f"{g['x']},{g['y']} → {g2['x']},{g2['y']}")
        r = g2["rect"]
        board.mouse.move(r["x"] + r["w"], r["y"] + r["h"])
        board.mouse.down()
        board.mouse.move(r["x"] + r["w"] + 90, r["y"] + r["h"] + 30, steps=6)
        board.mouse.up()
        g3 = ghost(board)
        check("2. растянут за угол", g3["w"] > g2["w"] * 1.1, f"{g2['w']} → {g3['w']}")
        check("2. пропорции сохранены", abs(g3["w"] / g3["h"] - g2["w"] / g2["h"]) < 0.01, f"{g2['w']/g2['h']} / {g3['w']/g3['h']}")
        check("2. левый верхний угол на месте", abs(g3["x"] - g2["x"]) < 0.5 and abs(g3["y"] - g2["y"]) < 0.5)
        board.evaluate("() => { cam.x += 50; scheduleRedraw(); }")
        board.wait_for_timeout(150)
        g4 = ghost(board)
        check("2. при прокрутке доски призрак едет вместе с ней", abs(g4["rect"]["x"] - (g3["rect"]["x"] - 50 * zoom)) < 1.5, f"{g3['rect']['x']} → {g4['rect']['x']}")
        check("2. пока двигали — ни saveDB, ни pushUndo", board.evaluate("() => [__saves, __undos]") == [0, 0], str(board.evaluate("() => [__saves, __undos]")))
        check("2. призрака по-прежнему нет в B.objects", count(board) == 0)

        # 3. закрепить
        board.click(".bd-ghost-bar .bd-ghost-pin")
        wait_count(board, 1)
        o = board.evaluate(f"() => {IMAGES}[0]")
        check("3. задание там, где был призрак", abs(o["points"][0]["x"] - g4["x"]) < 0.01 and abs(o["points"][0]["y"] - g4["y"]) < 0.01, f"{o['points'][0]} / {g4['x']},{g4['y']}")
        check("3. и такого же размера", abs(o["w"] - g4["w"]) < 0.01 and abs(o["h"] - g4["h"]) < 0.01)
        for k in ("task", "gen", "css", "card", "stack", "gap", "locked", "addedAt"):
            check(f"3. есть поле {k}", k in o, str(sorted(o.keys())))
        check("3. новая стопка с этого места", o["stack"]["i"] == 0 and abs(o["stack"]["x0"] - o["points"][0]["x"]) < 0.01)
        check("3. призрак убран", board.evaluate("() => !placeGhost && !document.querySelector('.bd-ghost')"))
        board.wait_for_function("() => trainersPanelIsOpen()", timeout=5000)
        check("3. панель вернулась", True)
        k_pin = o["w"] / o["css"]["w"]
        check("3. масштаб запомнен (B.taskScale)", abs(board.evaluate("() => window.getCurrentBoard().taskScale") - k_pin) < 1e-9)
        check("3. одна запись в отмене — само закрепление", board.evaluate("() => __undos") == 1, str(board.evaluate("() => __undos")))

        # 4. следующее — в стопку и в масштабе; новая стопка — тоже в нём
        board.evaluate("() => document.getElementById('bdTrainersRefreshBtn').click()")
        board.wait_for_timeout(500)
        board.click("#bdTrainersAddBtn")
        wait_count(board, 2)
        o2 = board.evaluate(f"() => {IMAGES}[1]")
        check("4. следующее — в той же стопке", o2["stack"]["id"] == o["stack"]["id"], f"{o['stack']} / {o2['stack']}")
        check("4. следующее — в выбранном масштабе", abs(o2["w"] / o2["css"]["w"] - k_pin) < 1e-6, f"{o2['w']/o2['css']['w']} / {k_pin}")
        board.evaluate("() => { cam.x += 6000; cam.y += 3000; clampCam(); scheduleRedraw(); }")
        board.wait_for_timeout(200)
        board.evaluate("() => document.getElementById('bdTrainersRefreshBtn').click()")
        board.wait_for_timeout(500)
        board.click("#bdTrainersAddBtn")
        wait_count(board, 3)
        o3 = board.evaluate(f"() => {IMAGES}[2]")
        check("4. в другом месте доски — новая стопка", o3["stack"]["id"] != o["stack"]["id"])
        check("4. новая стопка — в запомненном масштабе", abs(o3["w"] / o3["css"]["w"] - k_pin) < 1e-6, f"{o3['w']/o3['css']['w']} / {k_pin}")

        # 5. отмена — кнопкой и Esc
        for how in ("кнопка", "Esc"):
            n = count(board)
            board.click("#bdTrainersManualBtn")
            board.wait_for_function("() => !!placeGhost", timeout=20000)
            board.wait_for_timeout(200)
            if how == "кнопка":
                board.click(".bd-ghost-bar .bd-ghost-cancel")
            else:
                board.keyboard.press("Escape")
            board.wait_for_function("() => !placeGhost", timeout=5000)
            board.wait_for_timeout(300)
            check(f"5. «Отмена» ({how}) — ничего не вставлено", count(board) == n)
            check(f"5. «Отмена» ({how}) — панель вернулась", board.evaluate("() => trainersPanelIsOpen()"))
            check(f"5. «Отмена» ({how}) — призрак убран", not board.evaluate("() => !!document.querySelector('.bd-ghost')"))

        # 6. растянули вставленное — масштаб запомнен, следующее в стопке берёт его
        k6 = board.evaluate(f"""() => {{ const im = {IMAGES}; const o = im[im.length - 1];
            pushUndo(); dragMode = 'handle'; dragHandleRole = 'se'; dragObjId = o.id;
            applyHandle(o, 'se', {{ x: o.points[0].x + o.w * 1.4, y: o.points[0].y + o.h * 1.4 }});
            canvas.dispatchEvent(new PointerEvent('pointerup', {{ bubbles: true, pointerId: 1, clientX: 10, clientY: 10 }}));
            return o.w / o.css.w; }}""")
        check("6. растянули задание — масштаб запомнен", abs(board.evaluate("() => window.getCurrentBoard().taskScale") - k6) < 1e-9 and abs(k6 - k_pin) > 1e-3, f"{k6} / {k_pin}")
        board.evaluate("() => document.getElementById('bdTrainersRefreshBtn').click()")
        board.wait_for_timeout(500)
        n = count(board)
        board.click("#bdTrainersAddBtn")
        wait_count(board, n + 1)
        o6 = board.evaluate(f"() => {IMAGES}[{n}]")
        check("6. следующее — в новом масштабе", abs(o6["w"] / o6["css"]["w"] - k6) < 1e-6, f"{o6['w']/o6['css']['w']} / {k6}")

        # 7. с вкладки-панели
        board.evaluate("() => { boardLink.linkLocalPanel(); setTrainersPanel('collapsed'); }")
        panel = ctx.new_page()
        watch(panel, "панель")
        panel.goto(f"{BASE}/boards-panel.html")
        panel.wait_for_function("() => window.__boardPanel")
        panel.wait_for_function("() => document.getElementById('bpStatusText').textContent.includes('Подключено')", timeout=10000)
        panel.evaluate("() => __boardPanel.openTrainer('oge6', 'oge6.html', 'oge6')")
        panel.wait_for_function("""() => { try { const f = document.getElementById('bpIframe');
            return f.contentDocument.readyState === 'complete' && typeof f.contentWindow.tsGetState === 'function'; }
            catch (e) { return false; } }""", timeout=20000)
        panel.evaluate(f"() => document.getElementById('bpIframe').contentWindow.eval({json.dumps(PICK)})")
        panel.wait_for_timeout(800)
        n = count(board)
        panel.click("#bpManualBtn")
        board.wait_for_function("() => !!placeGhost", timeout=20000)
        check("7. с вкладки — призрак на доске", True)
        check("7. подпись устройства на призраке", "Вкладка этого браузера" in board.inner_text(".bd-ghost-who"), board.inner_text(".bd-ghost-who"))
        panel.wait_for_function("() => document.getElementById('bpPending').textContent.includes('Размещаем на доске')", timeout=8000)
        check("7. панель — «Размещаем на доске…»", True)
        gsrc = board.evaluate("() => placeGhost.img.src")
        # пока размещают — обычное задание с панели ждёт
        panel.evaluate("() => document.getElementById('bpRefreshBtn').click()")
        panel.wait_for_timeout(500)
        panel.click("#bpAddBtn")
        board.wait_for_selector("#linkQueue.show", timeout=15000)
        check("7. пришедшее во время размещения — в очереди", "ещё 1 в очереди" in board.inner_text("#linkQueue"), board.inner_text("#linkQueue"))
        check("7. призрак не заменён", board.evaluate("() => placeGhost && placeGhost.img.src") == gsrc)
        check("7. ничего не вставлено", count(board) == n)
        board.click(".bd-ghost-bar .bd-ghost-cancel")
        panel.wait_for_function("() => document.getElementById('bpToast').textContent.includes('Отменено на доске')", timeout=8000)
        check("7. «Отмена» — панель «Отменено на доске»", True)
        wait_count(board, n + 1, 8000)
        check("7. после отмены очередь доехала (обычное задание легло)", True)
        check("7. призрак с вкладки убран", not board.evaluate("() => !!document.querySelector('.bd-ghost')"))
        panel.wait_for_timeout(300)
        panel.evaluate("() => document.getElementById('bpRefreshBtn').click()")
        panel.wait_for_timeout(500)
        panel.click("#bpManualBtn")
        board.wait_for_function("() => !!placeGhost", timeout=20000)
        board.wait_for_timeout(200)
        board.click(".bd-ghost-bar .bd-ghost-pin")
        wait_count(board, n + 2)
        panel.wait_for_function("() => document.getElementById('bpToast').textContent.includes('Закреплено на доске')", timeout=8000)
        check("7. «Закрепить» — задание легло, панель «Закреплено на доске»", True)

        check("8. нет ошибок JavaScript", not ERRORS, "\n".join(ERRORS[:5]))
        browser.close()


with local_server():
    run()
print("\nИТОГ: " + ("всё прошло" if not FAILS else f"упало {len(FAILS)}: " + "; ".join(FAILS)))
sys.exit(1 if FAILS else 0)
