"""
Промпт №68: живые задания на доске — где появляются, слои, сворачивание
панели тренажёров, кнопка «ещё такое же».

Проверяем:
  1. «Добавить на доску» кладёт задание в видимый участок доски (с учётом
     прокрутки и масштаба), правее открытой панели, на свободное место: не
     поверх уже лежащих заданий. Несколько подряд — не внахлёст.
  2. Слои: поле ответа и «Проверить» не вылезают поверх интерфейса —
     слой заданий отдельный контекст наложения; поле под левой колонкой
     инструментов и под панелью тренажёров (узкий экран, панель поверх) не
     перекрывает их.
  3. Панель тренажёров на широком экране встаёт рядом с доской: холст,
     левая колонка инструментов и док сдвигаются, колонка видна целиком,
     кнопки масштаба работают по центру оставшейся части, открытие панели
     не сдвигает то, что было на экране. «Свернуть» — полоса у левого края,
     тренажёр в кадре тот же (задание, набранный ответ), развернуть — клик
     по полосе. Крестик закрывает совсем.
  4. «Ещё такое же»: кнопка у задания, выбор направления (вниз выделено и в
     фокусе, Enter — вниз), новое задание того же типа/уровня вплотную
     снизу; если снизу занято — ниже занятого; вверх, влево, вправо.
     ОГЭ №6, сложение в столбик (уровень), ЕГЭ база (следующий прототип),
     движок линейных уравнений ОГЭ №9 (уровень), ОГЭ №8. Отмена убирает
     новое задание. Невидимый кадр генерации — без совместной сессии.
  5. Только просмотр — кнопки «ещё» нет.
  6. Нет ошибок JavaScript.

Запуск: python3 test_prompt68_board_task_layout.py (сервер поднимается сам).
Совместный режим отсюда не проверить (websocket до Supabase закрыт): новое
задание у собеседника на общей доске — перепроверить на сайте руками.
"""
import contextlib
import http.client
import json
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8989
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
# картинка-«препятствие» 1×1 (растягивается до w×h)
PIX = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

FRAME = "document.getElementById('bdTrainersIframe')"


def open_board(ctx, w=1400, h=900):
    page = ctx.new_page()
    page.set_viewport_size({"width": w, "height": h})
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
    page.wait_for_timeout(300)
    return page, errors


def open_panel(page):
    page.evaluate("() => setTrainersPanel('open')")
    page.wait_for_timeout(250)


def open_trainer(page, tid, href, prep_js=None):
    page.evaluate(f"() => openTrainerInPanel({json.dumps(tid)}, {json.dumps(href)}, {json.dumps(tid)})")
    page.wait_for_function(f"""() => {{ try {{ const f = {FRAME};
        return f.contentDocument.readyState === 'complete' && typeof f.contentWindow.tsGetState === 'function'; }}
        catch (e) {{ return false; }} }}""", timeout=20000)
    page.wait_for_timeout(500)
    if prep_js:
        page.evaluate(f"() => {FRAME}.contentWindow.eval({json.dumps(prep_js)})")
        page.wait_for_timeout(500)


def add_to_board(page):
    n = page.evaluate("() => getCurrentBoard().objects.length")
    page.evaluate("() => document.getElementById('bdTrainersAddBtn').click()")
    page.wait_for_function(f"() => getCurrentBoard().objects.length > {n} && !document.getElementById('bdTrainersAddBtn').disabled", timeout=30000)
    page.wait_for_timeout(300)
    return page.evaluate("() => getCurrentBoard().objects.length") - n


def obj(page, idx=-1):
    return page.evaluate(f"() => JSON.parse(JSON.stringify(getCurrentBoard().objects.slice({idx})[0], (k, v) => k === 'src' ? '…' : v))")


def rect(o):
    return (o["points"][0]["x"], o["points"][0]["y"], o["w"], o["h"])


def overlap(a, b):
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    return ax < bx + bw and ax + aw > bx and ay < by + bh and ay + ah > by


def screen_rect(page, o):
    """Прямоугольник объекта на экране (координаты окна)."""
    return page.evaluate(f"""() => {{ const o = getCurrentBoard().objects.find(x => x.id === {json.dumps(o['id'])});
        const cv = document.getElementById('boardCv').getBoundingClientRect();
        const p = window.__w2s(o.points[0]);
        return {{ x: cv.left + p.x, y: cv.top + p.y, w: o.w * cam.zoom, h: o.h * cam.zoom }}; }}""")


def more(page, o, dir_key=None, via_enter=False):
    """Нажать «ещё такое же» у задания o и выбрать направление."""
    n = page.evaluate("() => getCurrentBoard().objects.length")
    sel = f'.bd-task[data-id="{o["id"]}"]'
    page.wait_for_selector(f"{sel} .bd-task-more", state="attached", timeout=5000)
    page.evaluate(f"() => document.querySelector('{sel} .bd-task-more').click()")
    page.wait_for_timeout(120)
    if via_enter:
        page.keyboard.press("Enter")
    else:
        page.evaluate(f"() => document.querySelector('{sel} .bd-task-dirs button[data-dir=\"{dir_key}\"]').click()")
    page.wait_for_function(f"() => getCurrentBoard().objects.length > {n}", timeout=40000)
    page.wait_for_function(f"() => !document.querySelector('{sel} .bd-task-more').classList.contains('busy')", timeout=40000)
    page.wait_for_timeout(250)
    return obj(page)


def run():
    failures = []

    def check(name, cond):
        print(f"[{'OK' if cond else 'FAIL'}] {name}")
        if not cond:
            failures.append(name)

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context()
        page, errors = open_board(ctx)

        # ── 3. панель рядом с доской ─────────────────────────────────────
        page.evaluate("() => setZoom(1, 1000, 700, cssW / 2, cssH / 2)")
        # мировая точка в центре экрана до открытия панели
        before = page.evaluate("() => { const cv = document.getElementById('boardCv').getBoundingClientRect(); const s = window.__w2s({x: 1000, y: 700}); return cv.left + s.x; }")
        open_panel(page)
        lay = page.evaluate("""() => {
            const pr = document.getElementById('bdTrainersPanel').getBoundingClientRect();
            const cv = document.getElementById('boardCv').getBoundingClientRect();
            const rail = document.getElementById('bdRail').getBoundingClientRect();
            const s = window.__w2s({x: 1000, y: 700});
            return { pw: pr.width, pr: pr.right, cvl: cv.left, cvw: cv.width, railL: rail.left, railR: rail.right,
                     inner: innerWidth, cssW, pt: cv.left + s.x }; }""")
        check("3. холст начинается правее панели", abs(lay["cvl"] - lay["pr"]) < 2)
        check("3. ширина холста — оставшаяся часть экрана", abs(lay["cvw"] - (lay["inner"] - lay["pw"])) < 2 and abs(lay["cssW"] - lay["cvw"]) < 2)
        check("3. левая колонка инструментов видна целиком, не под панелью", lay["railL"] >= lay["pr"] + 4)
        check("3. открытие панели не сдвигает то, что было на экране", abs(lay["pt"] - before) < 1.5)
        # масштаб кнопкой — вокруг центра оставшейся части
        z = page.evaluate("""() => { const c = { x: cam.x + cssW / 2 / cam.zoom, y: cam.y + cssH / 2 / cam.zoom };
            document.getElementById('railZoomIn').click();
            const c2 = { x: cam.x + cssW / 2 / cam.zoom, y: cam.y + cssH / 2 / cam.zoom };
            return { zoom: cam.zoom, dx: Math.abs(c.x - c2.x), dy: Math.abs(c.y - c2.y) }; }""")
        check("3. «+» масштабирует доску при открытой панели, центр на месте", z["zoom"] > 1.2 and z["dx"] < 0.5 and z["dy"] < 0.5)
        dock_ok = page.evaluate("""() => { const d = document.getElementById('bdDock').getBoundingClientRect();
            const pr = document.getElementById('bdTrainersPanel').getBoundingClientRect();
            return d.left >= pr.right - 1 && d.right <= innerWidth + 1; }""")
        check("3. нижний док — в оставшейся части экрана", dock_ok)
        page.evaluate("() => setZoom(1, 1000, 700, cssW / 2, cssH / 2)")

        # ── 1. появление задания на экране ──────────────────────────────
        open_trainer(page, "oge6", "oge6.html", "document.querySelectorAll('.mode-card:not(.soon)')[1].click()")
        # препятствие ровно в центре видимой части
        page.evaluate(f"""() => {{ const B = getCurrentBoard(); const c = {{ x: cam.x + cssW / 2 / cam.zoom, y: cam.y + cssH / 2 / cam.zoom }};
            B.objects.push({{ id: 'obst', type: 'image', src: {json.dumps(PIX)}, points: [{{ x: c.x - 150, y: c.y - 120 }}], w: 300, h: 240, natW: 1, natH: 1 }});
            boardsRedraw(); }}""")
        pr_right = page.evaluate("() => document.getElementById('bdTrainersPanel').getBoundingClientRect().right")
        added, inside, right_of_panel, cam0 = [], True, True, page.evaluate("() => ({x: cam.x, y: cam.y})")
        for i in range(3):
            add_to_board(page)
            o = obj(page)
            added.append(o)
            vis = page.evaluate("() => visibleBoardRect()")
            r = rect(o)
            inside = inside and (r[0] >= vis["x"] - 0.5 and r[1] >= vis["y"] - 0.5 and r[0] + r[2] <= vis["x"] + vis["w"] + 0.5 and r[1] + r[3] <= vis["y"] + vis["h"] + 0.5)
            right_of_panel = right_of_panel and screen_rect(page, o)["x"] >= pr_right
        o1, o2, o3 = added
        obst = obj(page, 0)
        check("1. каждое задание появилось в видимом участке доски", inside)
        check("1. на экране — правее открытой панели", right_of_panel)
        rs = [rect(obst), rect(o1), rect(o2), rect(o3)]
        no_ov = all(not overlap(rs[i], rs[j]) for i in range(4) for j in range(i + 1, 4))
        check("1. не поверх препятствия и не внахлёст друг с другом", no_ov)
        if not no_ov:
            print(rs, page.evaluate("() => JSON.parse(JSON.stringify(getCurrentBoard().objects.map(o => [o.id, o.rotation, o.angle])))"))
        page.evaluate(f"() => {{ cam.x = {json.dumps(cam0)}.x; cam.y = {json.dumps(cam0)}.y; boardsRedraw(); }}")
        vis = page.evaluate("() => visibleBoardRect()")
        c = (vis["x"] + vis["w"] / 2, vis["y"] + vis["h"] / 2)
        d1 = ((o1["points"][0]["x"] + o1["w"] / 2 - c[0]) ** 2 + (o1["points"][0]["y"] + o1["h"] / 2 - c[1]) ** 2) ** .5
        check("1. первое — рядом с центром видимой части", d1 < 150 + max(o1["w"], o1["h"]))
        # прокрутка и масштаб: уехали в другой угол доски, уменьшили
        page.evaluate("() => setZoom(0.6, 2600, 1500, cssW / 2, cssH / 2)")
        page.wait_for_timeout(150)
        add_to_board(page)
        o4 = obj(page)
        vis = page.evaluate("() => visibleBoardRect()")
        r4 = rect(o4)
        check("1. после прокрутки и масштаба — снова на экране",
              r4[0] >= vis["x"] - 0.5 and r4[1] >= vis["y"] - 0.5 and r4[0] + r4[2] <= vis["x"] + vis["w"] + 0.5 and r4[1] + r4[3] <= vis["y"] + vis["h"] + 0.5)
        page.evaluate("() => setZoom(1, 1000, 700, cssW / 2, cssH / 2)")

        # ── 2. слои ─────────────────────────────────────────────────────
        zl = page.evaluate("() => getComputedStyle(document.getElementById('bdTaskLayer')).zIndex")
        check("2. слой заданий — отдельный контекст наложения (z-index 1)", zl == "1")
        # задание сдвигаем так, чтобы его поле оказалось под левой колонкой инструментов
        under = page.evaluate(f"""() => {{ const o = getCurrentBoard().objects.find(x => x.id === {json.dumps(o1['id'])});
            const rail = document.getElementById('bdRail').getBoundingClientRect();
            const cv = document.getElementById('boardCv').getBoundingClientRect();
            const f = o.task.hot.fields[0];
            const btn = document.getElementById('railZoomIn').getBoundingClientRect();
            const wantX = btn.left + btn.width / 2 - cv.left, wantY = btn.top + btn.height / 2 - cv.top;
            o.points[0].x = cam.x + wantX / cam.zoom - (f.x + f.w / 2) * o.w;
            o.points[0].y = cam.y + wantY / cam.zoom - (f.y + f.h / 2) * o.h;
            boardsRedraw();
            return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => {{
              const inp = document.querySelector('.bd-task[data-id="' + o.id + '"] .bd-task-in').getBoundingClientRect();
              const top = document.elementFromPoint(btn.left + btn.width / 2, btn.top + btn.height / 2);
              r({{ inputThere: Math.abs(inp.left + inp.width / 2 - (btn.left + btn.width / 2)) < 3, top: top ? (top.id || top.className) : null }});
            }})));
        }}""")
        check("2. поле задания под кнопкой масштаба не перекрывает её", under["inputThere"] and under["top"] == "railZoomIn")
        # на всякий случай — положение назад
        page.evaluate(f"""() => {{ const o = getCurrentBoard().objects.find(x => x.id === {json.dumps(o1['id'])});
            o.points[0].x = {o1['points'][0]['x']}; o.points[0].y = {o1['points'][0]['y']}; boardsRedraw(); }}""")

        # ── 3. свернуть / развернуть — тренажёр тот же ─────────────────
        page.evaluate(f"() => {{ const d = {FRAME}.contentDocument; d.getElementById('answerInput').value = '4321'; }}")
        task_before = page.evaluate(f"() => JSON.stringify({FRAME}.contentWindow.tsGetState().curTask)")
        page.evaluate("() => document.getElementById('bdTrainersCollapse').click()")
        page.wait_for_timeout(250)
        st = page.evaluate("""() => { const s = document.getElementById('bdTrainersStrip');
            const cv = document.getElementById('boardCv').getBoundingClientRect();
            const rail = document.getElementById('bdRail').getBoundingClientRect();
            return { panelOpen: document.getElementById('bdTrainersPanel').classList.contains('open'),
                     strip: s.classList.contains('show'), stripW: s.getBoundingClientRect().width, cvl: cv.left,
                     railL: rail.left, text: document.getElementById('bdTrainersStripText').textContent }; }""")
        check("3. «Свернуть» — панель спрятана, у левого края полоса", not st["panelOpen"] and st["strip"] and 20 <= st["stripW"] <= 40)
        check("3. в свёрнутом виде доска и инструменты правее полосы", abs(st["cvl"] - st["stripW"]) < 2 and st["railL"] >= st["stripW"])
        check("3. на полосе — название открытого тренажёра", st["text"] == "oge6")
        page.evaluate("() => document.getElementById('bdTrainersStrip').click()")
        page.wait_for_timeout(250)
        back = page.evaluate(f"""() => ({{ open: document.getElementById('bdTrainersPanel').classList.contains('open'),
            strip: document.getElementById('bdTrainersStrip').classList.contains('show'),
            task: JSON.stringify({FRAME}.contentWindow.tsGetState().curTask),
            val: {FRAME}.contentDocument.getElementById('answerInput').value,
            inFrame: document.getElementById('bdTrainersPanel').classList.contains('bd-trainers-in-frame') }})""")
        check("3. клик по полосе разворачивает панель", back["open"] and not back["strip"])
        check("3. после разворота — тот же тренажёр, задание и набранный ответ",
              back["inFrame"] and back["task"] == task_before and back["val"] == "4321")
        page.evaluate("() => document.getElementById('bdTrainersToggle').click()")
        page.wait_for_timeout(200)
        tg = page.evaluate("() => ({ open: document.getElementById('bdTrainersPanel').classList.contains('open'), strip: document.getElementById('bdTrainersStrip').classList.contains('show') })")
        check("3. кнопка «Тренажёры» вверху при открытом тренажёре сворачивает в полосу", not tg["open"] and tg["strip"])
        page.evaluate("() => document.getElementById('bdTrainersToggle').click()")
        page.wait_for_timeout(200)
        page.evaluate("() => document.getElementById('bdTrainersClose').click()")
        page.wait_for_timeout(250)
        cl = page.evaluate("() => ({ open: document.getElementById('bdTrainersPanel').classList.contains('open'), strip: document.getElementById('bdTrainersStrip').classList.contains('show'), cvl: document.getElementById('boardCv').getBoundingClientRect().left, inset: boardInset })")
        check("3. крестик закрывает совсем — ни панели, ни полосы, доска на всю ширину", not cl["open"] and not cl["strip"] and cl["cvl"] == 0 and cl["inset"] == 0)
        open_panel(page)
        still = page.evaluate(f"() => JSON.stringify({FRAME}.contentWindow.tsGetState().curTask)")
        check("3. и после крестика тренажёр не выгружен", still == task_before)

        # ── 4. «ещё такое же» ──────────────────────────────────────────
        page.evaluate("() => setTrainersPanel('collapsed')")
        page.wait_for_timeout(200)
        g1 = o1.get("gen") or {}
        check("4. у задания записано, из чего делать такое же", g1.get("kind") == "state" and g1.get("tid") == "oge6" and g1.get("href") == "oge6.html")
        page.evaluate(f"""() => {{ const o = getCurrentBoard().objects.find(x => x.id === {json.dumps(o1['id'])});
            setZoom(1, o.points[0].x + o.w / 2, o.points[0].y + o.h / 2, cssW / 2, cssH / 3); }}""")
        page.wait_for_timeout(200)
        sel1 = f'.bd-task[data-id="{o1["id"]}"]'
        page.evaluate(f"() => document.querySelector('{sel1} .bd-task-more').click()")
        page.wait_for_timeout(150)
        dirs = page.evaluate(f"""() => {{ const d = document.querySelector('{sel1} .bd-task-dirs');
            return {{ open: d.classList.contains('open'), n: d.querySelectorAll('button[data-dir]').length,
                      focus: document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.dir : null,
                      def: d.querySelector('button.def').dataset.dir }}; }}""")
        check("4. кнопка открывает выбор из четырёх направлений", dirs["open"] and dirs["n"] == 4)
        check("4. по умолчанию — вниз (выделено и в фокусе)", dirs["def"] == "down" and dirs["focus"] == "down")
        page.keyboard.press("Escape")
        page.wait_for_timeout(100)
        closed = page.evaluate(f"() => !document.querySelector('{sel1} .bd-task-dirs').classList.contains('open')")
        check("4. Esc закрывает выбор", closed)

        # освобождаем низ и бока у o1 от других заданий, чтобы проверить «вплотную»
        page.evaluate(f"""() => {{ const B = getCurrentBoard();
            B.objects = B.objects.filter(x => x.id === {json.dumps(o1['id'])});
            boardsRedraw(); }}""")
        n1 = more(page, o1, via_enter=True)
        GAP = 12
        r1, rn = rect(obj(page, 0)), rect(n1)
        check("4. Enter — новое задание вплотную снизу, по левому краю",
              abs(rn[0] - r1[0]) < 0.5 and abs(rn[1] - (r1[1] + r1[3] + GAP)) < 0.5)
        t1 = n1.get("task") or {}
        check("4. новое задание живое (есть ответ и поле)", t1.get("kind") == "fields" and len((t1.get("hot") or {}).get("fields", [])) == 1)
        check("4. тот же тип задания", (n1.get("gen") or {}).get("snap", {}).get("curMode") == g1["snap"]["curMode"])
        check("4. новое задание тоже закреплено и тоже с кнопкой «ещё»", n1.get("locked") is True and page.evaluate(f"() => !!document.querySelector('.bd-task[data-id=\"{n1['id']}\"] .bd-task-more')"))
        n2 = more(page, o1, "down")
        rn2 = rect(n2)
        check("4. снизу занято — ставится ниже занятого, в том же направлении", abs(rn2[0] - r1[0]) < 0.5 and abs(rn2[1] - (rn[1] + rn[3] + GAP)) < 0.5)
        n3 = more(page, o1, "right")
        rn3 = rect(n3)
        check("4. вправо — вплотную справа, по верхнему краю", abs(rn3[0] - (r1[0] + r1[2] + GAP)) < 0.5 and abs(rn3[1] - r1[1]) < 0.5)
        n4 = more(page, o1, "up")
        rn4 = rect(n4)
        check("4. вверх — вплотную сверху", abs(rn4[1] + rn4[3] + GAP - r1[1]) < 0.5 and abs(rn4[0] - r1[0]) < 0.5)
        # слева препятствие вплотную — новое встаёт левее него
        page.evaluate(f"""() => {{ const B = getCurrentBoard();
            B.objects.push({{ id: 'obstL', type: 'image', src: {json.dumps(PIX)}, points: [{{ x: {r1[0]} - 12 - 200, y: {r1[1]} }}], w: 200, h: 100, natW: 1, natH: 1 }});
            boardsRedraw(); }}""")
        n5 = more(page, o1, "left")
        rn5 = rect(n5)
        check("4. влево, место занято — сдвиг левее препятствия", abs(rn5[0] + rn5[2] + GAP - (r1[0] - 12 - 200)) < 0.5 and abs(rn5[1] - r1[1]) < 0.5)
        allr = [rect(x) for x in page.evaluate("() => JSON.parse(JSON.stringify(getCurrentBoard().objects, (k, v) => k === 'src' ? '…' : v))")]
        check("4. ни одно новое задание не легло внахлёст", all(not overlap(allr[i], allr[j]) for i in range(len(allr)) for j in range(i + 1, len(allr))))
        sr = screen_rect(page, n5)
        cvr = page.evaluate("() => document.getElementById('boardCv').getBoundingClientRect().toJSON()")
        check("4. новое задание показано на экране (камера подъехала)", sr["x"] >= cvr["left"] - 1 and sr["x"] + sr["w"] <= cvr["right"] + 1)
        cnt = page.evaluate("() => getCurrentBoard().objects.length")
        page.keyboard.press("Escape")
        page.evaluate("() => doUndo()")
        page.wait_for_timeout(200)
        check("4. отмена убирает новое задание", page.evaluate("() => getCurrentBoard().objects.length") == cnt - 1
              and page.evaluate(f"() => !getCurrentBoard().objects.some(o => o.id === {json.dumps(n5['id'])})"))

        # кадр генерации — без совместной сессии
        gf = page.evaluate("""() => { const fs = [...document.querySelectorAll('iframe.bd-gen-frame')];
            return fs.map(f => ({ src: f.getAttribute('src'), code: f.contentWindow.TrainerSession.getCode(),
                                  pos: getComputedStyle(f).left, op: getComputedStyle(f).opacity })); }""")
        check("4. невидимый кадр генерации один на тренажёр, за краем экрана",
              len(gf) == 1 and "bdgen=1" in gf[0]["src"] and gf[0]["pos"].startswith("-") and gf[0]["op"] == "0")
        check("4. в кадре генерации нет совместной сессии", gf[0]["code"] is None)

        # сложение в столбик: тот же уровень
        page.evaluate("() => { const B = getCurrentBoard(); B.objects = []; boardsRedraw(); }")
        open_panel(page)
        open_trainer(page, "add_col", "addition.html", "curLevel = 3; newProblem();")
        add_to_board(page)
        a1 = obj(page)
        page.evaluate("() => setTrainersPanel('collapsed')")
        page.wait_for_timeout(200)
        a2 = more(page, a1, "down")
        g_a = a2.get("gen") or {}
        check("4. столбики: новое задание того же уровня", g_a.get("snap", {}).get("curLevel") == 3)
        P2 = g_a.get("snap", {}).get("P") or {}
        check("4. столбики: ответ нового задания — сумма нового примера",
              (a2.get("task") or {}).get("fields", [{}])[0].get("value") == str(P2.get("topVal", 0) + P2.get("bottomVal", 0)))
        check("4. столбики: пример другой", json.dumps(P2, sort_keys=True) != json.dumps(a1["gen"]["snap"]["P"], sort_keys=True))

        # ЕГЭ база: следующий прототип того же номера
        open_panel(page)
        open_trainer(page, "egeb8", "ege_base.html?n=8", "document.querySelectorAll('.mode-card')[0].click()")
        add_to_board(page)
        e1 = obj(page)
        page.evaluate("() => setTrainersPanel('collapsed')")
        page.wait_for_timeout(200)
        want = page.evaluate(f"() => {FRAME}.contentWindow.eval('pidAfter(' + JSON.stringify({json.dumps(e1['gen']['pid'])}) + ')')")
        e2 = more(page, e1, "right")
        check("4. ЕГЭ база: следующий прототип того же номера",
              e2["gen"]["kind"] == "ege" and e2["gen"]["n"] == 8 and e2["gen"]["pid"] == want and e2["gen"]["pid"] != e1["gen"]["pid"])
        check("4. ЕГЭ база: у нового задания строка ответа", (e2.get("task") or {}).get("kind") == "fields")
        e3 = more(page, e2, "right")
        check("4. ЕГЭ база: дальше — по кругу за новым", e3["gen"]["pid"] == page.evaluate(f"() => {FRAME}.contentWindow.eval('pidAfter(' + JSON.stringify({json.dumps(e2['gen']['pid'])}) + ')')"))

        # ОГЭ №9, движок линейных уравнений, уровень «3. Скобки» (id 2)
        open_panel(page)
        open_trainer(page, "oge9", "oge9.html",
                     "openModeById('linear'); setTimeout(() => document.querySelector('#levels .lvl[data-id=\"2\"]').click(), 100);")
        page.wait_for_timeout(300)
        add_to_board(page)
        l1 = obj(page)
        check("4. ОГЭ №9: запомнен движок и уровень", (l1.get("gen") or {}).get("kind") == "engine" and l1["gen"]["lvl"] == 2)
        page.evaluate("() => setTrainersPanel('collapsed')")
        page.wait_for_timeout(200)
        l2 = more(page, l1, "down")
        lvl_in_frame = page.evaluate("""() => { const f = [...document.querySelectorAll('iframe.bd-gen-frame')].find(x => x.getAttribute('src').startsWith('oge9'));
            const b = f.contentDocument.querySelector('#levels .lvl.active'); return b ? Number(b.dataset.id) : null; }""")
        check("4. ОГЭ №9: новое уравнение того же уровня", l2["gen"]["lvl"] == 2 and lvl_in_frame == 2)
        check("4. ОГЭ №9: у нового уравнения есть ответ «x =»", (l2.get("task") or {}).get("fields", [{}])[0].get("label") == "x =")

        # ОГЭ №8 — своя система карточек
        open_panel(page)
        open_trainer(page, "oge8", "oge8.html", "document.querySelectorAll('.mode-card:not(.soon)')[0].click();")
        add_to_board(page)
        g8 = obj(page)
        page.evaluate("() => setTrainersPanel('collapsed')")
        page.wait_for_timeout(200)
        g8b = more(page, g8, "down")
        check("4. ОГЭ №8: новое задание того же типа с ответом",
              g8b["gen"]["snap"]["curMode"] == g8["gen"]["snap"]["curMode"] and (g8b.get("task") or {}).get("kind") == "fields")
        nframes = page.evaluate("() => document.querySelectorAll('iframe.bd-gen-frame').length")
        check("4. кадров генерации не больше трёх", nframes <= 3)

        # ── 5. только просмотр ──────────────────────────────────────────
        page.evaluate("() => document.documentElement.setAttribute('data-access', 'view')")
        hidden = page.evaluate(f"() => getComputedStyle(document.querySelector('.bd-task[data-id=\"{g8['id']}\"] .bd-task-more')).display === 'none'")
        check("5. только просмотр — кнопки «ещё» нет", hidden)
        page.evaluate("() => document.documentElement.setAttribute('data-access', 'full')")

        check("6. нет ошибок JavaScript на странице досок", not errors)
        if errors:
            print("\n".join(errors[:5]))
        page.close()

        # ── 2. узкий экран: панель поверх доски, поле задания под ней ──
        page, errors = open_board(ctx, 600, 800)
        open_panel(page)
        nar = page.evaluate("() => ({ inset: boardInset, cvl: document.getElementById('boardCv').getBoundingClientRect().left })")
        check("2. на узком экране панель поверх доски (без отступа)", nar["inset"] == 0 and nar["cvl"] == 0)
        open_trainer(page, "oge6", "oge6.html", "document.querySelectorAll('.mode-card:not(.soon)')[1].click()")
        add_to_board(page)
        on = obj(page)
        # кладём поле задания прямо под панель
        res = page.evaluate(f"""() => {{ const o = getCurrentBoard().objects.find(x => x.id === {json.dumps(on['id'])});
            const f = o.task.hot.fields[0];
            const px = 150, py = 400;
            o.points[0].x = cam.x + px / cam.zoom - (f.x + f.w / 2) * o.w;
            o.points[0].y = cam.y + py / cam.zoom - (f.y + f.h / 2) * o.h;
            boardsRedraw();
            return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => {{
              const top = document.elementFromPoint(px, py);
              const inp = document.querySelector('.bd-task[data-id="' + o.id + '"] .bd-task-in').getBoundingClientRect();
              r({{ inPanel: !!(top && top.closest('#bdTrainersPanel')), inputThere: Math.abs(inp.left + inp.width / 2 - px) < 3 }});
            }})));
        }}""")
        check("2. поле ответа под открытой панелью тренажёров — панель сверху", res["inputThere"] and res["inPanel"])
        check("6. нет ошибок JavaScript (узкий экран)", not errors)
        browser.close()

    print()
    if failures:
        print(f"Не прошло: {len(failures)}")
        for f in failures:
            print(" -", f)
        sys.exit(1)
    print("Все проверки прошли")


if __name__ == "__main__":
    run()
