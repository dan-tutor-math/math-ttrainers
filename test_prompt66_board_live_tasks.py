"""
Промпт №66: задания, добавленные на доску из панели «Тренажёры», —
закреплены и «живые».

Проверяем:
  1. Задание кладётся закреплённым (locked) — ластик его не стирает.
  2. Поле ответа (ОГЭ №6): поверх картинки лежит настоящее поле ровно там,
     где на снимке поле тренажёра. Неверный ответ — красным, верный —
     зелёным и поле больше не правится. Непонятная запись — подсказка, а не
     «неверно». Enter работает как «Проверить».
  3. Варианты (ОГЭ №7): клик по варианту на картинке сразу проверяет; после
     неверного можно выбрать другой, после верного — нельзя.
  4. Утверждения (ОГЭ №19): отметки — черновик, итог — по «Проверить».
  5. ОГЭ №8: основное задание и добавленные «+» карточки — у каждой свой ответ.
  6. ЕГЭ (условие без поля) и столбики/уравнения — строка «Ответ: [поле]
     [Проверить]» дорисована под снимком; деление с остатком — два поля,
     порядок цифр в ЕГЭ базе (anyOrder), корни через «;». ОГЭ №9 —
     уравнения из закрытых движков. Доказательство (№24) — без поля.
  7. Проверка — обычная правка доски: отмена возвращает как было, после
     сохранения и повторного открытия доски ответ на месте, ↺ сбрасывает.
  8. Только просмотр — поля и варианты не нажимаются.
  9. Масштаб доски — живые элементы едут вместе с картинкой.
 10. Выгрузка в PNG рисует введённый ответ прямо на картинке.
 11. Разбор записей: 3/4, 72√3, «нет корней», единицы, множества.

Запуск: python3 test_prompt66_board_live_tasks.py (сервер поднимается сам).
Совместный режим (ответ ученика у учителя) отсюда не проверить — websocket
до Supabase из песочницы закрыт; это перепроверяется на сайте руками.
"""
import contextlib
import http.client
import json
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8971
BASE = f"http://127.0.0.1:{PORT}"


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
LITE = {"id": "bA", "name": "Урок", "folderId": None, "createdAt": 1000, "updatedAt": 1000,
        "lastOpenedAt": None, "rev": 1, "cellSize": 24, "sheetCols": 76, "sheetRows": 54,
        "pageOrder": "h", "recentColors": [], "colorUsage": {}, "view": {"x": 0, "y": 0, "zoom": 1}}

FRAME = "document.getElementById('bdTrainersIframe')"


def open_board(ctx):
    page = ctx.new_page()
    page.set_viewport_size({"width": 1400, "height": 900})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda r: r.abort())
    page.goto(f"{BASE}/boards.html")
    page.evaluate(SEED_JS, [[LITE], {"bA": {"objects": [], "imageLib": []}}])
    page.reload()
    page.evaluate(BOOT_JS)
    page.wait_for_function("() => window.getDB && window.getDB().boards.length >= 1")
    page.evaluate("() => window.openBoard('bA')")
    page.wait_for_function("() => window.getCurrentBoard() && Array.isArray(window.getCurrentBoard().objects)")
    page.evaluate("() => { document.getElementById('bdTrainersPanel').classList.add('open'); }")
    return page, errors


def open_trainer(page, tid, href, prep_js=None):
    """Открыть тренажёр в панели и подготовить задание (prep_js — внутри кадра)."""
    page.evaluate(f"() => openTrainerInPanel({json.dumps(tid)}, {json.dumps(href)}, 'x')")
    page.wait_for_function(f"""() => {{ try {{ const f = {FRAME};
        return f.contentDocument.readyState === 'complete' && typeof f.contentWindow.tsGetState === 'function'; }}
        catch (e) {{ return false; }} }}""", timeout=20000)
    page.wait_for_timeout(500)
    if prep_js:
        page.evaluate(f"() => {FRAME}.contentWindow.eval({json.dumps(prep_js)})")
        page.wait_for_timeout(500)


def add_to_board(page, expect_count):
    page.evaluate("() => document.getElementById('bdTrainersAddBtn').click()")
    page.wait_for_function(f"() => getCurrentBoard().objects.length >= {expect_count}", timeout=30000)
    page.wait_for_timeout(300)


def close_panel(page):
    page.evaluate("() => { document.getElementById('bdTrainersPanel').classList.remove('open'); boardsRedraw(); }")
    page.wait_for_timeout(250)


def last_obj(page, idx=-1):
    return page.evaluate(f"() => JSON.parse(JSON.stringify(getCurrentBoard().objects.slice({idx})[0], (k, v) => k === 'src' ? '…' : v))")


def overlay(page, obj_id):
    return f'.bd-task[data-id="{obj_id}"]'


def focus_on(page, obj_id):
    """Камеру — на задание: центр задания в центр экрана, масштаб 1."""
    page.evaluate(f"""() => {{ const o = getCurrentBoard().objects.find(x => x.id === {json.dumps(obj_id)});
        setZoom(1, o.points[0].x + o.w / 2, o.points[0].y + o.h / 2, cssW / 2, cssH / 2); }}""")
    page.wait_for_timeout(200)


def run():
    failures = []

    def check(name, cond):
        print(f"[{'OK' if cond else 'FAIL'}] {name}")
        if not cond:
            failures.append(name)

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(accept_downloads=True)
        page, errors = open_board(ctx)

        # ── 1–2. ОГЭ №6: поле ответа ────────────────────────────────────
        open_trainer(page, "oge6", "oge6.html",
                     "document.querySelectorAll('.mode-card:not(.soon)')[1].click()")
        # учитель уже ответил в тренажёре (неверно) — на доску задание всё
        # равно должно лечь чистым
        page.evaluate(f"""() => {{ const w = {FRAME}.contentWindow, d = w.document;
            d.getElementById('answerInput').value = '999'; d.getElementById('checkAnswerBtn').click(); }}""")
        right = page.evaluate(f"() => {FRAME}.contentWindow.tsGetState().curTask.correctValue")
        add_to_board(page, 1)
        close_panel(page)
        o = last_obj(page)
        check("1. задание с тренажёра легло закреплённым", o.get("locked") is True)
        t = o.get("task") or {}
        check("2. у задания записан верный ответ", t.get("kind") == "fields" and t["fields"][0]["value"] == str(right).rstrip("0").rstrip(".") or (t.get("fields") and float(t["fields"][0]["value"]) == float(right)))
        hot = t.get("hot") or {}
        check("2. поле и «Проверить» найдены на самом снимке", len(hot.get("fields", [])) == 1 and hot.get("check") is not None)

        # поле лежит там, где на картинке поле тренажёра
        geo = page.evaluate(f"""() => {{
            const o = getCurrentBoard().objects.slice(-1)[0];
            const inp = document.querySelector('.bd-task[data-id="' + o.id + '"] .bd-task-in');
            const cv = document.getElementById('boardCv').getBoundingClientRect();
            const p0 = window.__w2s(o.points[0]);
            const r = inp.getBoundingClientRect(), f = o.task.hot.fields[0];
            return {{ dx: Math.abs((r.left - cv.left) - (p0.x + f.x * o.w)), dy: Math.abs((r.top - cv.top) - (p0.y + f.y * o.h)),
                     dw: Math.abs(r.width - f.w * o.w) }};
        }}""")
        check("2. живое поле совпадает с полем на картинке", geo["dx"] < 2 and geo["dy"] < 2 and geo["dw"] < 2)

        sel = overlay(page, o["id"])
        page.fill(f"{sel} .bd-task-in", "абв")
        page.click(f"{sel} .bd-task-btn")
        page.wait_for_timeout(200)
        st = last_obj(page)["task"].get("st")
        msg_shown = page.evaluate(f"() => document.querySelector('{sel} .bd-task-msg').classList.contains('show')")
        check("2. непонятная запись — подсказка, а не «неверно»", st is None and msg_shown)

        page.fill(f"{sel} .bd-task-in", "12345")
        page.click(f"{sel} .bd-task-btn")
        page.wait_for_timeout(200)
        st = last_obj(page)["task"].get("st") or {}
        bad_cls = page.evaluate(f"() => document.querySelector('{sel} .bd-task-in').classList.contains('bad')")
        check("2. неверный ответ — отметка и красное поле", st.get("res") == "bad" and bad_cls)

        page.fill(f"{sel} .bd-task-in", str(right).replace(".", ","))
        page.press(f"{sel} .bd-task-in", "Enter")
        page.wait_for_timeout(200)
        st = last_obj(page)["task"].get("st") or {}
        cls = page.evaluate(f"() => {{ const i = document.querySelector('{sel} .bd-task-in'); return {{ good: i.classList.contains('good'), ro: i.readOnly }}; }}")
        check("2. верный ответ (с запятой, по Enter) — зелёным, поле больше не правится", st.get("res") == "ok" and cls["good"] and cls["ro"])
        check("2. попытки считаются", st.get("tries") == 2)

        # ластик по центру задания его не трогает
        n_before = page.evaluate("() => getCurrentBoard().objects.length")
        page.evaluate("""() => { const o = getCurrentBoard().objects.slice(-1)[0];
            eraseAt({ x: o.points[0].x + o.w / 2, y: o.points[0].y + o.h / 2 }); }""")
        check("1. ластик не стирает задание", page.evaluate("() => getCurrentBoard().objects.length") == n_before)

        # ── 7. отмена, ↺, повторное открытие ────────────────────────────
        page.evaluate("() => doUndo()")
        page.wait_for_timeout(200)
        st = last_obj(page)["task"].get("st") or {}
        check("7. отмена возвращает прошлую проверку", st.get("res") == "bad")
        page.evaluate("() => doRedo()")
        page.wait_for_timeout(200)
        check("7. повтор возвращает верный ответ", (last_obj(page)["task"].get("st") or {}).get("res") == "ok")

        # ── 3. ОГЭ №7: варианты ─────────────────────────────────────────
        page.evaluate("() => document.getElementById('bdTrainersPanel').classList.add('open')")
        open_trainer(page, "oge7", "oge7.html",
                     "document.querySelectorAll('.mode-card:not(.soon)')[3].click()")
        correct = page.evaluate(f"() => {FRAME}.contentWindow.tsGetState().curTask.correctIndex")
        add_to_board(page, 2)
        close_panel(page)
        o7 = last_obj(page)
        t7 = o7.get("task") or {}
        check("3. варианты найдены на снимке (4 шт.)", t7.get("kind") == "choice" and len((t7.get("hot") or {}).get("opts", [])) == 4)
        sel7 = overlay(page, o7["id"])
        wrong = (correct + 1) % 4
        page.click(f"{sel7} .bd-task-opt >> nth={wrong}")
        page.wait_for_timeout(200)
        st = last_obj(page)["task"].get("st") or {}
        wcls = page.evaluate(f"(i) => document.querySelectorAll('{sel7} .bd-task-opt')[i].classList.contains('bad')", wrong)
        check("3. неверный вариант — красным", st.get("res") == "bad" and st.get("pick") == wrong and wcls)
        page.click(f"{sel7} .bd-task-opt >> nth={correct}")
        page.wait_for_timeout(200)
        st = last_obj(page)["task"].get("st") or {}
        check("3. верный вариант — зелёным", st.get("res") == "ok" and st.get("pick") == correct)
        page.click(f"{sel7} .bd-task-opt >> nth={wrong}")
        page.wait_for_timeout(200)
        check("3. после верного выбор больше не меняется", (last_obj(page)["task"].get("st") or {}).get("pick") == correct)

        # ── 4. ОГЭ №19: утверждения ─────────────────────────────────────
        page.evaluate("() => document.getElementById('bdTrainersPanel').classList.add('open')")
        open_trainer(page, "oge19", "oge19.html",
                     "document.querySelectorAll('.mode-card:not(.soon)')[1].click()")
        truth = page.evaluate(f"() => {FRAME}.contentWindow.tsGetState().curTask.statements.map((s, i) => s.isTrue ? i : -1).filter(i => i >= 0)")
        n19 = page.evaluate(f"() => {FRAME}.contentWindow.tsGetState().curTask.statements.length")
        add_to_board(page, 3)
        close_panel(page)
        o19 = last_obj(page)
        sel19 = overlay(page, o19["id"])
        t19 = o19.get("task") or {}
        check("4. утверждения и «Проверить» найдены на снимке",
              t19.get("kind") == "multi" and len(t19["hot"]["opts"]) == n19 and t19["hot"].get("check") is not None)
        falsy = [i for i in range(n19) if i not in truth]
        if falsy:
            page.click(f"{sel19} .bd-task-opt >> nth={falsy[0]}")
            page.wait_for_timeout(150)
            check("4. отметка — только черновик, в доску не пишется", last_obj(page)["task"].get("st") is None)
            page.click(f"{sel19} .bd-task-btn")
            page.wait_for_timeout(200)
            check("4. лишнее утверждение — «неверно»", (last_obj(page)["task"].get("st") or {}).get("res") == "bad")
            page.click(f"{sel19} .bd-task-opt >> nth={falsy[0]}")   # снять лишнее
        for i in truth:
            page.click(f"{sel19} .bd-task-opt >> nth={i}")
        page.click(f"{sel19} .bd-task-btn")
        page.wait_for_timeout(200)
        st = last_obj(page)["task"].get("st") or {}
        check("4. верный набор — «верно»", st.get("res") == "ok" and sorted(st.get("picks", [])) == sorted(truth))

        # ── 5. ОГЭ №8 с карточками «+» ─────────────────────────────────
        page.evaluate("() => document.getElementById('bdTrainersPanel').classList.add('open')")
        open_trainer(page, "oge8", "oge8.html",
                     "document.querySelectorAll('.mode-card:not(.soon)')[0].click(); appendAddedTasks(2);")
        vals8 = page.evaluate(f"""() => {{ const s = {FRAME}.contentWindow.tsGetState();
            return [s.curTask.correctValue].concat(s.addedTasks.map(b => b.task.correctValue)); }}""")
        add_to_board(page, 6)
        close_panel(page)
        got8 = page.evaluate("() => getCurrentBoard().objects.slice(-3).map(o => o.task && Number(o.task.fields[0].value))")
        check("5. у основного задания и каждой карточки «+» свой ответ", got8 == [float(v) for v in vals8])
        hot8 = page.evaluate("() => getCurrentBoard().objects.slice(-3).map(o => o.task.hot.fields.length)")
        check("5. поле ответа найдено и в карточках", hot8 == [1, 1, 1])

        # ── 6. ЕГЭ и столбики — дорисованная строка ответа ──────────────
        page.evaluate("() => document.getElementById('bdTrainersPanel').classList.add('open')")
        open_trainer(page, "egeb8", "ege_base.html?n=8",
                     "document.querySelectorAll('.mode-card')[0].click()")
        info = page.evaluate(f"() => {{ const w = {FRAME}.contentWindow; return w.eval('fieldsOf(protoById(S.n, S.pid))[0]'); }}")
        n_now = page.evaluate("() => getCurrentBoard().objects.length")
        add_to_board(page, n_now + 1)
        close_panel(page)
        ob = last_obj(page)
        tb = ob.get("task") or {}
        check("6. ЕГЭ база: строка ответа дорисована под условием",
              tb.get("kind") == "fields" and len(tb["hot"]["fields"]) == 1 and tb["hot"]["fields"][0]["y"] > 0.3)
        check("6. картинка стала выше на строку ответа", ob["natH"] > 60)
        if info.get("seq") and info.get("anyOrder"):
            shuffled = " ".join(reversed(list(str(info["value"]))))
            selb = overlay(page, ob["id"])
            page.fill(f"{selb} .bd-task-in", shuffled)
            page.click(f"{selb} .bd-task-btn")
            page.wait_for_timeout(200)
            check("6. ЕГЭ база №8: порядок цифр не важен, пробелы не мешают",
                  (last_obj(page)["task"].get("st") or {}).get("res") == "ok")

        page.evaluate("() => document.getElementById('bdTrainersPanel').classList.add('open')")
        open_trainer(page, "div_col", "division.html", "curLevel = 3; newProblem();")
        P = page.evaluate(f"() => {FRAME}.contentWindow.tsGetState().P")
        n_now = page.evaluate("() => getCurrentBoard().objects.length")
        add_to_board(page, n_now + 1)
        close_panel(page)
        od = last_obj(page)
        fields = [f["id"] for f in od["task"]["fields"]] if od.get("task") else []
        check("6. деление с остатком — два поля: частное и остаток",
              (fields == ["q", "r"]) if int(P["r"]) > 0 else (fields == ["main"]))
        check("6. поля под делением дорисованы", len(od["task"]["hot"]["fields"]) == len(fields))
        seld = overlay(page, od["id"])
        ins = page.query_selector_all(f"{seld} .bd-task-in")
        ins[0].fill(str(P["q"]))
        if len(ins) > 1:
            ins[1].fill(str(P["r"]))
        page.click(f"{seld} .bd-task-btn")
        page.wait_for_timeout(200)
        check("6. деление: верный ответ принят", (last_obj(page)["task"].get("st") or {}).get("res") == "ok")

        page.evaluate("() => document.getElementById('bdTrainersPanel').classList.add('open')")
        open_trainer(page, "quadratic", "quadratic.html", "curLevel = 3; newProblem();")
        roots = page.evaluate(f"() => {FRAME}.contentWindow.tsGetState().P.roots")
        n_now = page.evaluate("() => getCurrentBoard().objects.length")
        add_to_board(page, n_now + 1)
        close_panel(page)
        oq = last_obj(page)
        selq = overlay(page, oq["id"])
        page.fill(f"{selq} .bd-task-in", "; ".join(str(r) for r in reversed(roots)))
        page.click(f"{selq} .bd-task-btn")
        page.wait_for_timeout(200)
        check("6. квадратное: корни через «;» в любом порядке", (last_obj(page)["task"].get("st") or {}).get("res") == "ok")

        # ОГЭ №9: движки уравнений закрыты в своих функциях — пример отдают
        # через __boardLinP/__boardQuadP. Демоверсия: 3(x + 8) − 2(x − 8) = 8
        page.evaluate("() => document.getElementById('bdTrainersPanel').classList.add('open')")
        open_trainer(page, "oge9", "oge9.html", "document.querySelectorAll('.mode-card:not(.soon)')[0].click()")
        n_now = page.evaluate("() => getCurrentBoard().objects.length")
        add_to_board(page, n_now + 1)
        close_panel(page)
        o9 = last_obj(page)
        check("6. ОГЭ №9, линейное уравнение демоверсии: ответ −32",
              bool(o9.get("task")) and float(o9["task"]["fields"][0]["value"]) == -32)
        page.evaluate("() => document.getElementById('bdTrainersPanel').classList.add('open')")
        open_trainer(page, "oge9", "oge9.html", "document.querySelectorAll('.mode-card:not(.soon)')[2].click()")
        n_now = page.evaluate("() => getCurrentBoard().objects.length")
        add_to_board(page, n_now + 1)
        close_panel(page)
        o9q = last_obj(page)
        check("6. ОГЭ №9, квадратное уравнение: корни записаны", bool(o9q.get("task")) and o9q["task"]["fields"][0]["type"] == "nums")

        # ОГЭ №24 (доказательство) — просто закреплённая картинка
        page.evaluate("() => document.getElementById('bdTrainersPanel').classList.add('open')")
        open_trainer(page, "oge24", "oge_part2.html?n=24", "document.querySelectorAll('.mode-card')[0].click()")
        n_now = page.evaluate("() => getCurrentBoard().objects.length")
        add_to_board(page, n_now + 1)
        close_panel(page)
        op = last_obj(page)
        check("6. доказательство — закреплено, но без поля ответа", op.get("locked") is True and not op.get("task"))

        # ── 7. сохранение и повторное открытие ─────────────────────────
        page.evaluate("() => backToList()")
        page.wait_for_timeout(700)
        page.evaluate("() => window.openBoard('bA')")
        page.wait_for_function("() => window.getCurrentBoard() && Array.isArray(window.getCurrentBoard().objects) && getCurrentBoard().objects.length > 3")
        focus_on(page, o["id"])
        page.wait_for_function(f"() => !!document.querySelector('.bd-task[data-id=\"{o['id']}\"] .bd-task-in')", timeout=10000)
        after = page.evaluate(f"""() => {{ const i = document.querySelector('.bd-task[data-id="{o['id']}"] .bd-task-in');
            return {{ val: i.value, good: i.classList.contains('good') }}; }}""")
        check("7. после повторного открытия доски ответ на месте", after["good"] and after["val"] == str(right).replace(".", ","))

        page.click(f"{sel} .bd-task-reset")
        page.wait_for_timeout(200)
        cleared = page.evaluate(f"""() => {{ const o = getCurrentBoard().objects.find(x => x.id === {json.dumps(o['id'])});
            const i = document.querySelector('{sel} .bd-task-in');
            return {{ st: o.task.st || null, val: i.value, ro: i.readOnly }}; }}""")
        check("7. ↺ стирает ответ — решать заново", cleared["st"] is None and cleared["val"] == "" and not cleared["ro"])

        # ── 9. масштаб ────────────────────────────────────────────────
        w1 = page.evaluate(f"() => document.querySelector('{sel}').getBoundingClientRect().width")
        page.evaluate("() => document.getElementById('bdCtxZoomIn').click()")
        page.wait_for_timeout(250)
        w2 = page.evaluate(f"() => document.querySelector('{sel}').getBoundingClientRect().width")
        check("9. живые элементы масштабируются вместе с доской", abs(w2 / w1 - 1.25) < 0.02)

        # ── 10. выгрузка: ответ нарисован на картинке ───────────────────
        # задания легли каскадом внахлёст — жмём Enter в поле, а не кнопку
        page.fill(f"{sel} .bd-task-in", "12345")
        page.press(f"{sel} .bd-task-in", "Enter")
        page.wait_for_timeout(200)
        drawn = page.evaluate("""() => {
            const o = getCurrentBoard().objects.find(x => x.task && x.task.st && x.task.st.vals && x.task.st.vals.main === '12345');
            const off = document.createElement('canvas'); off.width = Math.ceil(o.w) + 20; off.height = Math.ceil(o.h) + 20;
            const c = off.getContext('2d');
            const f = o.task.hot.fields[0];
            const fakeCam = { x: o.points[0].x - 10, y: o.points[0].y - 10, zoom: 1 };
            const px = () => c.getImageData(Math.round(10 + (f.x + f.w * 0.04) * o.w), Math.round(10 + (f.y + f.h * 0.5) * o.h), 1, 1).data;
            // задания лежат каскадом внахлёст — рисуем одно это, остальные прячем
            const B = getCurrentBoard(), all = B.objects;
            B.objects = [o];
            try { render(c, off.width, off.height, fakeCam, false, 1); } finally { B.objects = all; }
            const p = px();
            const r = { r: p[0], g: p[1], b: p[2], has: !!o };
            window.boardsRedraw();
            return r;
        }""")
        check("10. в выгрузке неверный ответ нарисован розовым полем", drawn["r"] > 230 and drawn["g"] < 240 and drawn["b"] < 240)

        # ── 8. только просмотр ─────────────────────────────────────────
        page.evaluate("() => window.setBoardAccess('view', 'u1')")
        page.wait_for_timeout(100)
        pe = page.evaluate(f"() => getComputedStyle(document.querySelector('{sel} .bd-task-in')).pointerEvents")
        check("8. в режиме «только просмотр» поле не нажимается", pe == "none")
        page.evaluate("() => window.setBoardAccess('full', null)")

        # ── 11. разбор записей ───────────────────────────────────────────
        cases = page.evaluate("""() => {
            const f = (type, value, extra) => Object.assign({ id: 'm', type, value }, extra || {});
            return {
              frac: taCheckField(f('num', '0.75'), '3/4'),
              comma: taCheckField(f('num', '2.5'), '2,5'),
              root: taCheckField(f('num', '72√3'), '72корень3'),
              unit: taCheckField(f('num', '195', { unit: 'мм' }), '195 мм'),
              noRoots: taCheckField(f('nums', ''), 'нет корней'),
              noRootsWrong: taCheckField(f('nums', '2; -2'), 'нет корней'),
              dupRoot: taCheckField(f('nums', '-1; -1'), '-1'),
              set: taCheckField(f('set', '(-∞; 2); 5'), '5; (-inf; 2)'),
              seqBad: taCheckField(f('plain', '135', { seq: true }), '1, 3, 5'),
              garbage: taCheckField(f('num', '3'), 'три'),
              wrong: taCheckField(f('num', '3'), '4'),
            };
        }""")
        check("11. 3/4 = 0,75", cases["frac"] is True)
        check("11. запятая в десятичной дроби", cases["comma"] is True)
        check("11. корень словом", cases["root"] is True)
        check("11. единицы после числа не мешают", cases["unit"] is True)
        check("11. «нет корней» — когда корней нет", cases["noRoots"] is True and cases["noRootsWrong"] is False)
        check("11. двойной корень можно написать один раз", cases["dupRoot"] is True)
        check("11. множества сравниваются по смыслу", cases["set"] is True)
        check("11. «1, 3, 5» в последовательности — просьба переписать", cases["seqBad"] is None)
        check("11. слово вместо числа — просьба переписать", cases["garbage"] is None)
        check("11. неверное число — неверно", cases["wrong"] is False)

        check("нет ошибок JavaScript на странице досок", not errors)
        if errors:
            print("   ", errors[:3])
        browser.close()

    print()
    if failures:
        print(f"ПРОВАЛЕНО: {len(failures)}")
        for f in failures:
            print("  -", f)
        sys.exit(1)
    print("Все проверки прошли")


if __name__ == "__main__":
    run()
