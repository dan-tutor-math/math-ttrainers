"""
Промпт №81: три правки досок (boards.html / boards-core.js).

Проверяем:
  1. Окно вставки картинки помнит «Закрепить» и «Привязку к сетке» с прошлой
     вставки (и после перезагрузки); «Сохранить в библиотеку» — нет; просто
     открыть и закрыть окно — не выбор, состояние не меняется.
  2. Рамка обрезки в предпросмотре подвижная: внутри — перенос целиком (и
     упирается в край картинки), за край — тянется одна сторона, за угол —
     две, мимо рамки — новая; на доску ложится вырезанный кусок нужного размера.
  3. «Координатная прямая» рядом с «Прямой»: протяжкой, сразу со стрелкой и
     делениями через клетку, ноль у середины, подписи вкл/выкл; в панели —
     клеток в единичном отрезке и нумерация, меняют и только что начерченную;
     ручка нуля двигает деления, конец — нет; настройки и прямая переживают
     перезагрузку; работает и в заметках справочной панели; нет ошибок JS.

Запуск: python3 test_prompt81_board_axis_crop.py (сервер поднимается сам).
"""
import contextlib
import http.client
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 9001
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


BOOT_JS = """() => {
  const gate = document.getElementById('authGate');
  if (gate) gate.style.display = 'none';
  window.boardsAppBoot();
}"""

LITE = {
    "id": "bA", "name": "Урок", "folderId": None,
    "createdAt": 1000, "updatedAt": 1000, "lastOpenedAt": None, "rev": 1,
    "cellSize": 24, "sheetCols": 76, "sheetRows": 54, "pageOrder": "h",
    "recentColors": [], "colorUsage": {},
}

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

# картинка 400×300: левая половина красная, правая синяя — по вырезанному
# куску видно, откуда его взяли
IMG_JS = """() => { const c = document.createElement('canvas'); c.width = 400; c.height = 300;
  const x = c.getContext('2d'); x.fillStyle = '#d00'; x.fillRect(0, 0, 200, 300);
  x.fillStyle = '#00d'; x.fillRect(200, 0, 200, 300); return c.toDataURL('image/png'); }"""


def boot(page, seed):
    page.route("https://**/*", lambda r: r.abort())
    page.goto(f"{BASE}/boards.html")
    if seed:
        page.evaluate(SEED_JS, [[LITE], {"bA": {"objects": [], "imageLib": []}}])
        page.reload()
    page.evaluate(BOOT_JS)
    page.wait_for_function("() => window.getDB && window.getDB().boards.length >= 1")
    page.evaluate("() => window.openBoard('bA')")
    page.wait_for_function("() => window.getCurrentBoard() && Array.isArray(window.getCurrentBoard().objects)")
    page.wait_for_timeout(300)


def open_board(ctx, errors, w=1400, h=900):
    page = ctx.new_page()
    page.set_viewport_size({"width": w, "height": h})
    page.on("pageerror", lambda e: errors.append(str(e)))
    boot(page, True)
    return page


def reload_board(page):
    # ждём, пока автосохранение допишет доску, иначе перезагрузка унесёт штрихи
    page.wait_for_timeout(700)
    page.evaluate("() => window.idbSaveDB && window.idbSaveDB()")
    page.wait_for_timeout(300)
    page.reload()
    boot(page, False)


def pick_tool(page, t):
    page.click(f'#bdDock .bd-tool[data-tool="{t}"]')
    page.wait_for_timeout(60)


def w2s(page, x, y):
    return page.evaluate("""([x, y]) => { const r = canvas.getBoundingClientRect();
        return [r.left + (x - cam.x) * cam.zoom, r.top + (y - cam.y) * cam.zoom]; }""", [x, y])


def drag(page, a, b, steps=6):
    page.mouse.move(a[0], a[1])
    page.mouse.down()
    for i in range(1, steps + 1):
        page.mouse.move(a[0] + (b[0] - a[0]) * i / steps, a[1] + (b[1] - a[1]) * i / steps)
    page.mouse.up()
    page.wait_for_timeout(80)


def objs(page):
    return page.evaluate("() => JSON.parse(JSON.stringify(B.objects))")


def dark_px(page, sx, sy, w, h, thr=330):
    """сколько «чернильных» пикселей холста доски в прямоугольнике окна"""
    page.wait_for_timeout(120)
    return page.evaluate("""([sx, sy, w, h, thr]) => {
        const r = canvas.getBoundingClientRect();
        const k = canvas.width / r.width;
        const d = canvas.getContext('2d').getImageData(Math.round((sx - r.left) * k), Math.round((sy - r.top) * k),
                                                       Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k))).data;
        let n = 0;
        for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200 && d[i] + d[i + 1] + d[i + 2] < thr) n++;
        return n; }""", [sx, sy, w, h, thr])


def near(a, b, tol=0.6):
    return abs(a - b) <= tol


def open_modal(page):
    page.evaluate(f"async () => {{ await openImageModal(({IMG_JS})(), {{x: 600, y: 400}}); }}")
    page.wait_for_selector("#imgModalBackdrop.open")
    page.wait_for_function("() => { const im = document.querySelector('#imgModalPreview img'); return im && im.complete && im.naturalWidth > 0; }")
    page.wait_for_timeout(80)


def img_box(page):
    return page.evaluate("() => { const r = document.querySelector('#imgModalPreview img').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }")


def crop(page):
    return page.evaluate("() => cropRect && Object.assign({}, cropRect)")


def run():
    failures = []

    def check(name, cond, extra=""):
        print(f"[{'OK' if cond else 'FAIL'}] {name}" + (f"  ({extra})" if extra and not cond else ""))
        if not cond:
            failures.append(name)

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        errors = []
        ctx = browser.new_context()
        page = open_board(ctx, errors)

        # ═══ 1. окно вставки помнит «Закрепить» и «Привязку» ═════════════════
        open_modal(page)
        check("1. самый первый раз «Закрепить» выключено",
              not page.is_checked("#imgOptLock") and not page.is_checked("#imgOptSnap"))
        page.check("#imgOptLock")
        page.check("#imgOptSnap")
        page.check("#imgOptLib")
        page.click("#imgModalInsert")
        page.wait_for_timeout(150)
        o = objs(page)
        check("1. вставленная картинка закреплена", len(o) == 1 and o[0]["locked"] is True)
        open_modal(page)
        check("1. следующая картинка — галочка «Закрепить» уже стоит", page.is_checked("#imgOptLock"))
        check("1. «Привязка к сетке» тоже запомнилась", page.is_checked("#imgOptSnap"))
        check("1. «Сохранить в библиотеку» не запоминается", not page.is_checked("#imgOptLib"))
        page.uncheck("#imgOptLock")
        page.click("#imgModalClose")
        open_modal(page)
        check("1. открыть, снять галочку и закрыть без вставки — не выбор",
              page.is_checked("#imgOptLock"))
        page.uncheck("#imgOptLock")
        page.click("#imgModalInsert")
        page.wait_for_timeout(150)
        check("1. вставили открепленной — она открепленная", objs(page)[-1]["locked"] is False)
        open_modal(page)
        check("1. и следующая уже без галочки", not page.is_checked("#imgOptLock"))
        page.check("#imgOptLock")
        page.click("#imgModalInsert")
        page.wait_for_timeout(150)
        reload_board(page)
        open_modal(page)
        check("1. после перезагрузки страницы галочка на месте",
              page.is_checked("#imgOptLock") and page.is_checked("#imgOptSnap"))

        # ═══ 2. подвижная рамка обрезки ══════════════════════════════════════
        page.uncheck("#imgOptSnap")
        L, T, W, H = img_box(page)
        X = lambda f: L + W * f
        Y = lambda f: T + H * f
        drag(page, (X(0.2), Y(0.2)), (X(0.6), Y(0.6)))
        c0 = crop(page)
        check("2. рамка нарисована протяжкой", c0 and near(c0["x"], 0.2, 0.02) and near(c0["w"], 0.4, 0.02), str(c0))
        check("2. на рамке видны ручки краёв",
              page.locator("#imgCropBox i").count() == 8 and page.is_visible("#imgCropBox i.se"))
        page.mouse.move(X(0.4), Y(0.4))
        cur_in = page.evaluate("() => document.getElementById('imgModalPreview').style.cursor")
        page.mouse.move(X(0.6), Y(0.4))
        cur_e = page.evaluate("() => document.getElementById('imgModalPreview').style.cursor")
        page.mouse.move(X(0.6), Y(0.6))
        cur_se = page.evaluate("() => document.getElementById('imgModalPreview').style.cursor")
        check("2. курсор подсказывает: внутри — перенос, на краю и в углу — растяжка",
              cur_in == "move" and cur_e == "ew-resize" and cur_se == "nwse-resize", f"{cur_in} {cur_e} {cur_se}")
        drag(page, (X(0.4), Y(0.4)), (X(0.5), Y(0.3)))
        c1 = crop(page)
        check("2. за середину рамка едет целиком, размер прежний",
              c1 and near(c1["x"], 0.3, 0.02) and near(c1["y"], 0.1, 0.02)
              and near(c1["w"], c0["w"], 0.005) and near(c1["h"], c0["h"], 0.005), str(c1))
        drag(page, (X(0.5), Y(0.3)), (X(0.95), Y(0.5)))
        c2 = crop(page)
        check("2. перенос упирается в край картинки, рамка не сжимается",
              c2 and near(c2["x"] + c2["w"], 1.0, 0.005) and near(c2["w"], c0["w"], 0.005), str(c2))
        # правый край → левее, ширина меньше, левый край на месте
        right = c2["x"] + c2["w"]
        drag(page, (X(right), Y(c2["y"] + c2["h"] / 2)), (X(0.85), Y(c2["y"] + c2["h"] / 2)))
        c3 = crop(page)
        check("2. за правый край тянется только правая сторона",
              c3 and near(c3["x"], c2["x"], 0.005) and near(c3["x"] + c3["w"], 0.85, 0.02)
              and near(c3["y"], c2["y"], 0.005) and near(c3["h"], c2["h"], 0.005), str(c3))
        drag(page, (X(c3["x"]), Y(c3["y"])), (X(0.5), Y(0.05)))
        c4 = crop(page)
        check("2. за левый верхний угол тянутся две стороны, правый нижний на месте",
              c4 and near(c4["x"], 0.5, 0.02) and near(c4["y"], 0.05, 0.02)
              and near(c4["x"] + c4["w"], c3["x"] + c3["w"], 0.005)
              and near(c4["y"] + c4["h"], c3["y"] + c3["h"], 0.005), str(c4))
        drag(page, (X(c4["x"] + c4["w"]), Y(c4["y"] + c4["h"] / 2)), (X(0.1), Y(c4["y"] + c4["h"] / 2)))
        c5 = crop(page)
        check("2. край не выворачивается через противоположный — упирается в минимум",
              c5 and near(c5["x"], c4["x"], 0.005) and c5["w"] > 0.015 and c5["w"] < 0.03, str(c5))
        page.mouse.click(X(c5["x"] + c5["w"] / 2), Y(c5["y"] + c5["h"] / 2))
        page.wait_for_timeout(60)
        check("2. клик внутри рамки её не сбрасывает", crop(page) is not None)
        drag(page, (X(0.05), Y(0.6)), (X(0.35), Y(0.9)))
        c6 = crop(page)
        check("2. протяжка мимо рамки рисует новую",
              c6 and near(c6["x"], 0.05, 0.02) and near(c6["y"], 0.6, 0.02) and near(c6["w"], 0.3, 0.02), str(c6))
        page.mouse.click(X(0.9), Y(0.1))
        page.wait_for_timeout(60)
        check("2. клик мимо рамки без протяжки — рамки нет (как раньше)", crop(page) is None)
        drag(page, (X(0.05), Y(0.6)), (X(0.35), Y(0.9)))
        page.click("#imgModalInsert")
        page.wait_for_timeout(300)
        last = objs(page)[-1]
        check("2. на доску лёг вырезанный кусок (≈120×90 из 400×300)",
              abs(last["natW"] - 120) <= 3 and abs(last["natH"] - 90) <= 3, f'{last["natW"]}x{last["natH"]}')

        # ═══ 3. координатная прямая ══════════════════════════════════════════
        page.evaluate("() => { B.objects = []; selectedId = null; cam.x = 0; cam.y = 0; cam.zoom = 1; scheduleRedraw(); }")
        idx = page.evaluate("""() => { const t = [...document.querySelectorAll('#bdDock .bd-tool[data-tool]')].map(b => b.dataset.tool);
                               return [t.indexOf('line'), t.indexOf('axis')]; }""")
        check("3. кнопка «Координатная прямая» — сразу за «Прямой»", idx[1] == idx[0] + 1, str(idx))
        pick_tool(page, "axis")
        check("3. в панели инструмента — клеток в единичном отрезке и нумерация",
              page.is_visible("#bdAxisField") and page.is_visible("#toggleAxisNums")
              and page.inner_text("#axisCellsVal").strip() == "1"
              and page.evaluate("() => document.getElementById('toggleAxisNums').classList.contains('on')"))
        check("3. своих стрелок у неё в панели нет — стрелка всегда одна",
              not page.is_visible("#toggleArrowEnd"))
        a = w2s(page, 240, 480)
        b = w2s(page, 480, 480)
        page.mouse.move(*a)
        page.mouse.down()
        page.mouse.move(a[0] + 120, a[1])
        page.mouse.move(*b)
        page.wait_for_timeout(120)
        prev = dark_px(page, w2s(page, 312, 480)[0] - 1, a[1] - 5, 3, 3)
        check("3. во время протяжки уже видны деления", prev > 0 and len(objs(page)) == 0, str(prev))
        page.mouse.up()
        page.wait_for_timeout(120)
        o = objs(page)
        ax = o[0].get("axis") if len(o) == 1 else None
        check("3. построен 'line' со стрелкой и разметкой: 1 клетка, нумерация",
              ax and o[0]["type"] == "line" and o[0].get("arrowEnd") is True and not o[0].get("arrowStart")
              and ax["cells"] == 1 and ax["step"] == 24 and ax["nums"] is True, str(o))
        check("3. ноль — на делении у середины", ax and near(ax["z"], 120), str(ax))
        # деления: поперёк прямой на каждой клетке — чернила, между ними — пусто
        tick = dark_px(page, w2s(page, 312, 480)[0] - 1, a[1] - 5, 3, 3)
        gap = dark_px(page, w2s(page, 324, 480)[0] - 1, a[1] - 5, 3, 3)
        check("3. деления через каждую клетку", tick > 0 and gap == 0, f"{tick} {gap}")
        under = lambda wx: dark_px(page, w2s(page, wx, 480)[0] - 6, a[1] + 12, 12, 10)
        check("3. под делениями подписи (0 у середины, −1 левее, 1 правее)",
              under(360) > 0 and under(336) > 0 and under(384) > 0)
        page.click("#toggleAxisNums")
        page.wait_for_timeout(100)
        check("3. нумерацию выключили — у только что начерченной подписи пропали",
              objs(page)[0]["axis"]["nums"] is False and under(360) == 0)
        page.click("#toggleAxisNums")
        page.wait_for_timeout(100)
        check("3. включили снова — подписи вернулись", objs(page)[0]["axis"]["nums"] is True and under(360) > 0)
        page.click("#axisCellsPlus")
        page.wait_for_timeout(100)
        ax = objs(page)[0]["axis"]
        check("3. «+» — две клетки на единичный отрезок, ноль на месте",
              ax["cells"] == 2 and ax["step"] == 48 and near(ax["z"], 120) and page.inner_text("#axisCellsVal").strip() == "2", str(ax))
        check("3. деления теперь через две клетки",
              dark_px(page, w2s(page, 408, 480)[0] - 1, a[1] - 5, 3, 3) > 0
              and dark_px(page, w2s(page, 384, 480)[0] - 1, a[1] - 5, 3, 3) == 0)
        page.evaluate("() => doUndo()")
        page.wait_for_timeout(80)
        ax_u = objs(page)[0]["axis"] if objs(page) else None
        check("3. смена разметки отменяется одним Ctrl+Z", ax_u and ax_u["cells"] == 1, str(ax_u))
        # в панели после отмены по-прежнему «2» — применяем её к прямой снова
        page.evaluate("() => { const o = B.objects[0]; editLockId = o.id; selectedId = o.id; applyAxisOptsToLocked(); }")
        page.wait_for_timeout(80)
        # ручка нуля: тянем ноль на две клетки вправо — деления едут, концы нет
        z0 = w2s(page, 360, 480)
        drag(page, z0, (z0[0] + 48, z0[1] + 3))
        o = objs(page)[0]
        check("3. ручка нуля сдвигает ноль вдоль прямой, концы на месте",
              near(o["axis"]["z"], 168) and near(o["points"][0]["x"], 240) and near(o["points"][1]["x"], 480), str(o))
        # начало прямой левее на две клетки — ноль на доске там же, где был
        drag(page, a, (a[0] - 48, a[1]))
        o = objs(page)[0]
        zx = o["points"][0]["x"] + o["axis"]["z"]
        check("3. тянем начало — ноль остаётся на месте доски",
              near(o["points"][0]["x"], 192) and near(zx, 408), str(o))
        drag(page, b, (b[0] + 96, b[1]))
        o = objs(page)[0]
        check("3. тянем конец — ноль тоже на месте",
              near(o["points"][1]["x"], 576) and near(o["points"][0]["x"] + o["axis"]["z"], 408), str(o))
        # следующая прямая берёт текущие настройки
        page.mouse.click(700, 150)  # клик мимо снимает «замок», следующая протяжка — новая прямая
        drag(page, w2s(page, 240, 240), w2s(page, 480, 240))
        o = objs(page)
        check("3. следующая прямая — с той же разметкой (2 клетки)",
              len(o) == 2 and o[1].get("axis", {}).get("cells") == 2, str(o[-1]))
        reload_board(page)
        o = objs(page)
        check("3. прямые с разметкой пережили перезагрузку",
              len(o) == 2 and o[0].get("axis", {}).get("step") == 48 and near(o[0]["axis"]["z"], 216), str(o))
        pick_tool(page, "axis")
        check("3. настройки инструмента пережили перезагрузку",
              page.inner_text("#axisCellsVal").strip() == "2"
              and page.evaluate("() => document.getElementById('toggleAxisNums').classList.contains('on')"))
        # выгрузка PNG/PDF рисует той же renderObject — проверяем рисунок чужой камерой
        exp = page.evaluate("""() => { const o = B.objects[0]; const c = document.createElement('canvas'); c.width = 600; c.height = 200;
            const x = c.getContext('2d'); const cv = { x: 150, y: 400, zoom: 1 };
            const saved = cam; try { renderObject(x, o, cv); } catch (e) { return 'err ' + e; }
            return true; }""")
        check("3. объект рисуется функцией выгрузки без ошибок", exp is True, str(exp))
        # заметки справочной панели: тот же инструмент, та же протяжка
        rf = page.evaluate("""() => { try {
            rfShapeDrag = null;
            const sd = { type: DRAG_SHAPE_TOOLS['axis'], a: {x: 0, y: 0}, b: {x: 120, y: 0}, cells: 1, nums: false };
            const o = shapeFromDrag(sd, 1);
            return o && o.axis && o.axis.nums === false && o.axis.step === 24 && o.axis.z === 72; } catch (e) { return 'err ' + e; } }""")
        check("3. протяжка общая с заметками (shapeFromDrag), параметры из самой протяжки", rf is True, str(rf))

        check("нет ошибок JavaScript", not errors, "; ".join(errors[:3]))
        browser.close()

    print()
    print("ИТОГ:", "всё прошло" if not failures else f"провалено {len(failures)}: " + "; ".join(failures))
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(run())
