"""
Промпт №11 нового списка, часть 3: доска учителя у ученика на общем экране.

Учитель в совместной сессии переходит на «Доски» и открывает любую свою
доску — ученик без входа по email видит ту же доску: содержимое, камеру,
панель тренажёров слева, штрих прямо в момент письма; ничего не пишет в
собственное хранилище досок; учитель на списке досок — «Учитель выбирает
доску…». Всё идёт каналом совместной сессии (board-stage.js), без базы.

Проверяем:
  A. Переход группы на доски с главной (кнопка «Доски») — ученик на сцене
     следом; без экрана входа; ждёт, пока учитель выбирает доску.
  B. Учитель открыл доску (штрихи, текст, картинка ~0,4 МБ — едет частями) —
     у ученика те же объекты в том же порядке, картинка собрана, камера та
     же; холст ученика почти попиксельно совпадает с учительским.
  C. Живое: штрих виден у ученика ДО отпускания пера; после — объектом.
     Сдвиг и масштаб камеры, отмена (удаление) доезжают.
  D. Панель тренажёров слева у учителя — у ученика холст начинается там же.
  E. Ученик не управляет: колесо не двигает его камеру; ничего не пишет в
     IndexedDB (своих досок ученика не трогает).
  F. Учитель вернулся к списку — «Учитель выбирает доску…»; открыл другую
     доску — ученик видит её. «К тренажёрам» — ученик возвращается на главную.
  G. Ученик в обычном режиме (без сцены) тоже видит доску, без входа.
  H. Ученик подключился позже / перезагрузил страницу — получает доску целиком.
  I. Браузер ученика с прошлого урока сам открыл доски (без ссылки) — его не
     уводит на сцену учителя, он попадает к экрану входа в свои доски.

Заглушка Supabase — из теста №54 (с ручками теста доработки сцены).
Запуск: python3 test_prompt11_board_stage.py
"""
import io
import sys

from playwright.sync_api import sync_playwright

import test_prompt11_shared_screen as t11
import test_prompt11_stage_polish as P
import test_prompt54_trainer_sync_and_cards as t54

PORT = 8998
t11.PORT = PORT
t11.BASE = P.BASE = BASE = f"http://127.0.0.1:{PORT}"
failures = t11.failures
errors = t11.errors
check = t11.check

DPR = 1   # плотность холста в тесте (контекст без device_scale_factor)
BOOT_JS = """() => { const g = document.getElementById('authGate'); if (g) g.style.display = 'none'; window.boardsAppBoot(); }"""

# две доски учителя: «Урок» — штрихи, текст и картинка; «Вторая» — один штрих
SEED_JS = """() => new Promise((resolve, reject) => {
  // картинка ~0,4 МБ: шум не сжимается, поэтому PNG выходит тяжёлым
  const cv = document.createElement('canvas'); cv.width = 360; cv.height = 300;
  const cx = cv.getContext('2d'); const d = cx.createImageData(360, 300);
  let s = 7; for (let i = 0; i < d.data.length; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d.data[i] = i % 4 === 3 ? 255 : (s >> 16) & 255; }
  cx.putImageData(d, 0, 0);
  cx.fillStyle = '#e33'; cx.fillRect(40, 40, 120, 90);
  const src = cv.toDataURL('image/png');
  const pen = (id, x, y, n) => ({ id, type: 'pen', color: '--pencil', width: 4, points: Array.from({ length: n }, (_, i) => ({ x: x + i * 6, y: y + Math.sin(i / 3) * 20 })) });
  const lite = (id, name) => ({ id, name, folderId: null, createdAt: 1000, updatedAt: 1000, lastOpenedAt: null, rev: 1,
    cellSize: 24, sheetCols: 76, sheetRows: 54, pageOrder: 'h', recentColors: [], colorUsage: {} });
  const objsA = [];
  for (let k = 0; k < 40; k++) objsA.push(pen('p' + k, 2380 + (k % 8) * 70, 1260 + Math.floor(k / 8) * 60, 30));
  objsA.push({ id: 'img1', type: 'image', src, points: [{ x: 2400, y: 1600 }], w: 360, h: 300, natW: 360, natH: 300 });
  objsA.push({ id: 't1', type: 'text', content: 'Задача 1', color: '--pencil', size: 30, points: [{ x: 2400, y: 1180 }] });
  const req = indexedDB.open('ogeBoardsDB', 1);
  req.onupgradeneeded = () => req.result.createObjectStore('state');
  req.onsuccess = () => {
    const tx = req.result.transaction('state', 'readwrite');
    const st = tx.objectStore('state');
    st.put({ __v: 2, folders: [], deleted: [], sortMode: 'my', boards: [lite('bA', 'Урок'), lite('bB', 'Вторая')] }, 'db');
    st.put({ objects: objsA, imageLib: [] }, 'boarddata:bA');
    st.put({ objects: [pen('q1', 2500, 1400, 40)], imageLib: [] }, 'boarddata:bB');
    tx.oncomplete = () => resolve(src.length);
    tx.onerror = () => reject(tx.error);
  };
  req.onerror = () => reject(req.error);
})"""

# сколько раз страница ученика что-то записала в IndexedDB (во всех кадрах)
COUNT_PUTS = """
(() => {
  const P = IDBObjectStore.prototype, put = P.put, add = P.add, del = P.delete;
  const bump = () => { try { window.top.__idbWrites = (window.top.__idbWrites || 0) + 1; } catch (e) {} };
  P.put = function () { bump(); return put.apply(this, arguments); };
  P.add = function () { bump(); return add.apply(this, arguments); };
  P.delete = function () { bump(); return del.apply(this, arguments); };
})();
"""

VIEW_STATE = """() => { const B = window.getCurrentBoard ? window.getCurrentBoard() : null;
  return { ids: B && B.objects ? B.objects.map(o => o.id) : [], active: typeof boardActive !== 'undefined' && boardActive,
           cam: [+cam.x.toFixed(1), +cam.y.toFixed(1), +cam.zoom.toFixed(3)], inset: boardInset,
           wait: !document.getElementById('bdViewerWait').classList.contains('hidden'),
           waitText: document.getElementById('bdViewerWaitText').textContent,
           img: (B && B.objects ? (B.objects.find(o => o.id === 'img1') || {}).src || '' : '').length }; }"""
TEACHER_STATE = """() => { const B = window.getCurrentBoard();
  return { ids: B && B.objects ? B.objects.map(o => o.id) : [], cam: [+cam.x.toFixed(1), +cam.y.toFixed(1), +cam.zoom.toFixed(3)],
           inset: boardInset }; }"""


def frame(page):
    return t11.stage_frame(page)


def wait_js(target, js, timeout=8000, arg=None):
    try:
        if arg is None:
            target.wait_for_function(js, timeout=timeout)
        else:
            target.wait_for_function(js, arg=arg, timeout=timeout)
        return True
    except Exception:
        return False


def canvas_png(target):
    import base64
    data = target.evaluate("() => document.getElementById('boardCv').toDataURL('image/png')")
    return base64.b64decode(data.split(",", 1)[1])


def crop_left(png, css_px):
    """срезать слева css_px CSS-пикселей: холст ученика во всё окно, у
    учителя — окно минус панель тренажёров, плотность у обоих одна (DPR)"""
    from PIL import Image
    im = Image.open(io.BytesIO(png))
    out = io.BytesIO()
    im.crop((round(css_px * DPR), 0, im.size[0], im.size[1])).save(out, "PNG")
    return out.getvalue()


def diff_share(a_png, b_png):
    from PIL import Image, ImageChops
    a = Image.open(io.BytesIO(a_png)).convert("RGB")
    b = Image.open(io.BytesIO(b_png)).convert("RGB")
    if a.size != b.size:
        return 1.0, f"{a.size} ≠ {b.size}"
    d = ImageChops.difference(a, b).convert("L").point(lambda v: 255 if v > 40 else 0)
    n = d.histogram()[255]
    return n / (a.size[0] * a.size[1]), f"{a.size}"


def teacher_boards(ctx):
    t = P.participant(ctx, "T", 1300, 820)
    t.goto(f"{BASE}/boards.html")
    t.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()")
    img_len = t.evaluate(SEED_JS)
    t.reload()
    t.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()")
    t.evaluate(BOOT_JS)
    t.wait_for_function("() => window.getDB && window.getDB().boards.length >= 2")
    return t, img_len


def run_main(browser):
    ctx = browser.new_context()
    teacher, img_len = teacher_boards(ctx)
    code = teacher.evaluate("() => TrainerSession.getCode()")

    # ── A. переход группы на доски с главной ──
    teacher.evaluate("() => TrainerSession.navigateTo('index.html')")
    teacher.wait_for_url("**/index.html")
    t54.wait_code(teacher)
    student = P.participant(ctx, "S", 1000, 700)
    student.add_init_script(COUNT_PUTS)
    student.goto(f"{BASE}/index.html?s={code}")
    t11.wait_stage(student)
    student.wait_for_timeout(1200)
    teacher.click("a.boards-toggle")
    teacher.wait_for_url("**/boards.html")
    teacher.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()")
    teacher.evaluate(BOOT_JS)
    ok = wait_js(student, """() => { const f = __stageActiveFrame(); try {
        return f.contentWindow.location.pathname.endsWith('/boards.html') && !f.classList.contains('waiting'); } catch (e) { return false; } }""", 12000)
    check("A: «Доски» у учителя — ученик на сцене тоже на досках", ok)
    f = frame(student)
    check("A: у ученика нет экрана входа", f.evaluate("() => !document.getElementById('authGate')"))
    check("A: у ученика режим просмотра", f.evaluate("() => document.documentElement.classList.contains('bd-viewer')"))
    ok = wait_js(f, "() => document.getElementById('bdViewerWaitText').textContent.indexOf('выбирает') >= 0", 8000)
    check("A: учитель на списке — «Учитель выбирает доску…»", ok, f.evaluate(VIEW_STATE)["waitText"])
    student.evaluate("() => { window.__idbWrites = 0; }")

    # ── B. учитель открыл доску ──
    teacher.evaluate("() => window.openBoard('bA')")
    teacher.wait_for_function("() => window.getCurrentBoard() && window.getCurrentBoard().id === 'bA' && boardActive")
    teacher.wait_for_timeout(400)
    tids = teacher.evaluate(TEACHER_STATE)["ids"]
    ok = wait_js(f, "ids => { const B = window.getCurrentBoard(); return B && B.objects && B.objects.map(o => o.id).join() === ids.join(); }",
                 12000, tids)
    check("B: у ученика те же объекты в том же порядке", ok, str(f.evaluate(VIEW_STATE)["ids"][:5]))
    ok = wait_js(f, f"() => ((window.getCurrentBoard().objects.find(o => o.id === 'img1') || {{}}).src || '').length === {img_len}", 12000)
    check(f"B: картинка ({round(img_len / 1024)} КБ) собрана из частей целиком", ok, str(f.evaluate(VIEW_STATE)["img"]))
    ok = wait_js(f, "() => document.getElementById('bdViewerWait').classList.contains('hidden')", 5000)
    check("B: заставка ожидания убрана", ok)
    ts, vs = teacher.evaluate(TEACHER_STATE), f.evaluate(VIEW_STATE)
    check("B: камера та же", ts["cam"] == vs["cam"], f"{ts['cam']} / {vs['cam']}")
    student.wait_for_timeout(500)
    share, info = diff_share(canvas_png(teacher), canvas_png(f))
    check("B: холст ученика совпадает с учительским (отличий меньше 1 %)", share < 0.01, f"{share:.4f} {info}")

    # ── C. живой штрих, камера, отмена ──
    r = teacher.evaluate("() => { const b = document.getElementById('boardCv').getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; }")
    x0, y0 = r[0] + r[2] * 0.35, r[1] + r[3] * 0.55
    teacher.mouse.move(x0, y0)
    teacher.mouse.down()
    for i in range(1, 14):
        teacher.mouse.move(x0 + i * 12, y0 + (i % 4) * 5)
        teacher.wait_for_timeout(20)
    ok = wait_js(f, "() => window.__bdView && window.__bdView.livePts() > 5", 4000)
    check("C: штрих виден у ученика, пока учитель ещё пишет", ok)
    teacher.mouse.up()
    teacher.wait_for_timeout(300)
    tids = teacher.evaluate(TEACHER_STATE)["ids"]
    ok = wait_js(f, "ids => window.getCurrentBoard().objects.map(o => o.id).join() === ids.join()", 5000, tids)
    check("C: после отпускания — штрих объектом, как у учителя", ok)
    check("C: живой штрих убран", f.evaluate("() => window.__bdView.livePts()") == 0)

    # ── J. перо у ученика идёт плавно, а не пачками ──
    # каждый кадр отрисовки ученика записываем, сколько точек живого штриха
    # уже видно; учитель пишет в обычном темпе (точка раз в ~8 мс)
    # Сеть неровная: у учителя сообщения уходят залпом раз в 90 мс — так
    # мобильный интернет отдаёт пакеты пачками. Первый штрих — «разогрев»
    # (ученик подстраивает задержку под свою сеть), второй меряем
    teacher.evaluate("() => { window.__fakeBurstMs = 90; }")
    x1, y1 = r[0] + r[2] * 0.3, r[1] + r[3] * 0.3

    def stroke(dy):
        teacher.mouse.move(x1, y1 + dy)
        teacher.mouse.down()
        for i in range(1, 61):
            teacher.mouse.move(x1 + i * 6, y1 + dy + (i % 10) * 3)
            teacher.wait_for_timeout(8)

    stroke(-60)
    teacher.wait_for_timeout(400)
    teacher.mouse.up()
    teacher.wait_for_timeout(600)
    f.evaluate("""() => { window.__penRec = []; const tick = () => {
        window.__penRec.push([performance.now(), window.__bdView.livePts()]);
        window.__penRecRaf = requestAnimationFrame(tick); }; tick(); }""")
    stroke(0)
    teacher.wait_for_timeout(450)
    rec = f.evaluate("() => { cancelAnimationFrame(window.__penRecRaf); return window.__penRec; }")
    print(f"       (задержка проигрывания у ученика: {round(f.evaluate('() => window.__bdView.playout()'))} мс)")
    counts = [c for _, c in rec]
    steps = [b - a for a, b in zip(counts, counts[1:]) if b > a]
    total = max(counts) if counts else 0
    print(f"       (штрих: {total} точек, показаны за {len(steps)} шагов, самый крупный шаг — {max(steps) if steps else 0})")
    check("J: у ученика видна почти вся линия ещё до отпускания пера", total >= 50, str(total))
    check("J: линия дорастает мелкими шагами (по 1–3 точки), а не пачками", steps and max(steps) <= 3,
          f"шаги: {steps[:40]}")
    check("J: и почти каждый кадр — без застываний", len(steps) >= total * 0.5, f"{len(steps)} шагов на {total} точек")
    teacher.mouse.up()
    teacher.wait_for_timeout(400)
    tids = teacher.evaluate(TEACHER_STATE)["ids"]
    ok = wait_js(f, "ids => window.getCurrentBoard().objects.map(o => o.id).join() === ids.join()", 5000, tids)
    check("J: после отпускания — штрих объектом", ok)
    teacher.evaluate("() => { window.__fakeBurstMs = 0; }")

    # ── K. фигура видна, пока учитель её тянет ──
    teacher.click('.bd-tool[data-tool="quad"]')
    x2, y2 = r[0] + r[2] * 0.55, r[1] + r[3] * 0.25
    teacher.mouse.move(x2, y2)
    teacher.mouse.down()
    for i in range(1, 12):
        teacher.mouse.move(x2 + i * 14, y2 + i * 9)
        teacher.wait_for_timeout(15)
    ok = wait_js(f, "() => { const s = window.__bdView.liveShape(); return !!(s && s.shapeDrag && s.shapeDrag.b); }", 3000)
    check("K: прямоугольник у ученика виден, пока учитель тянет", ok)
    tb = teacher.evaluate("() => shapeDrag && shapeDrag.b")
    ok = wait_js(f, "b => shapeDrag && shapeDrag.b && Math.abs(shapeDrag.b.x - b.x) < 0.5 && Math.abs(shapeDrag.b.y - b.y) < 0.5", 3000, tb)
    check("K: и угол там же, где у учителя под рукой", ok)
    teacher.mouse.up()
    teacher.wait_for_timeout(400)
    tids = teacher.evaluate(TEACHER_STATE)["ids"]
    ok = wait_js(f, "ids => window.getCurrentBoard().objects.map(o => o.id).join() === ids.join() && !window.__bdView.liveShape() && !shapeDrag", 5000, tids)
    check("K: отпустил — предпросмотр ушёл, прямоугольник пришёл объектом", ok)
    # прямая — через черновик движка (другой путь, чем прямоугольник)
    teacher.click('.bd-tool[data-tool="line"]')
    teacher.mouse.move(x2, y2 + 200)
    teacher.mouse.down()
    for i in range(1, 10):
        teacher.mouse.move(x2 + i * 15, y2 + 200 - i * 6)
        teacher.wait_for_timeout(15)
    ok = wait_js(f, "() => { const s = window.__bdView.liveShape(); return !!(s && s.draft && s.draft.type === 'line'); }", 3000)
    check("K: прямая у ученика видна, пока учитель тянет", ok)
    teacher.mouse.up()
    teacher.wait_for_timeout(400)
    ok = wait_js(f, "() => !window.__bdView.liveShape() && !draft", 3000)
    check("K: прямая отпущена — предпросмотр ушёл", ok)

    # ── L. текст виден, пока учитель печатает ──
    teacher.click('.bd-tool[data-tool="text"]')
    teacher.mouse.click(x2, y2 + 320)
    teacher.wait_for_function("() => !!textEditSession")
    teacher.keyboard.type("Привет", delay=40)
    ok = wait_js(f, "() => { const t = window.__bdView.liveText(); return !!(t && t.content === 'Привет'); }", 3000)
    check("L: набираемый текст у ученика — буква в букву", ok, str(f.evaluate("() => window.__bdView.liveText()")))
    teacher.keyboard.type(", класс", delay=30)
    ok = wait_js(f, "() => { const t = window.__bdView.liveText(); return !!(t && t.content === 'Привет, класс'); }", 3000)
    check("L: и дальше по мере набора", ok)
    # на холсте ученика текст действительно нарисован (там, где поле учителя)
    ok = f.evaluate("""() => { const t = window.__bdView.liveText(); const c = document.getElementById('boardCv');
        const p = worldToScreen(t.pt); const k = c.width / c.getBoundingClientRect().width;
        const d = c.getContext('2d').getImageData(Math.round(p.x * k), Math.round(p.y * k), Math.round(90 * k), Math.round(30 * k)).data;
        let dark = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i+1] + d[i+2] < 300) dark++; return dark > 20; }""")
    check("L: на холсте ученика текст нарисован на месте поля учителя", ok)
    teacher.evaluate("() => confirmTextEditor()")
    teacher.wait_for_timeout(400)
    ok = wait_js(f, "() => !window.__bdView.liveText() && window.getCurrentBoard().objects.some(o => o.type === 'text' && o.content === 'Привет, класс')", 4000)
    check("L: подтвердил — у ученика текст стал объектом, живого больше нет", ok)
    # правка существующего текста: у ученика старый прячется, виден набираемый
    teacher.evaluate("() => openTextEditor(getCurrentBoard().objects.find(o => o.id === 't1'))")
    teacher.keyboard.press("End")
    teacher.keyboard.type("!!", delay=30)
    ok = wait_js(f, "() => { const t = window.__bdView.liveText(); return !!(t && t.objId === 't1' && t.content === 'Задача 1!!'); }", 3000)
    check("L: правка старого текста видна по ходу", ok, str(f.evaluate("() => window.__bdView.liveText()")))
    teacher.evaluate("() => confirmTextEditor()")
    ok = wait_js(f, "() => !window.__bdView.liveText() && (window.getCurrentBoard().objects.find(o => o.id === 't1') || {}).content === 'Задача 1!!'", 4000)
    check("L: подтвердил правку — у ученика текст обновился", ok)
    teacher.click('.bd-tool[data-tool="pen"]')
    teacher.evaluate("() => { setZoom(1.6, cam.x + 300, cam.y + 200, 300, 200); }")
    teacher.wait_for_timeout(300)
    tc = teacher.evaluate(TEACHER_STATE)["cam"]
    ok = wait_js(f, "c => { return [+cam.x.toFixed(1), +cam.y.toFixed(1), +cam.zoom.toFixed(3)].join() === c.join(); }", 4000, tc)
    check("C: масштаб и сдвиг камеры учителя повторяются", ok, f"{tc} / {f.evaluate(VIEW_STATE)['cam']}")
    teacher.evaluate("() => doUndo()")
    teacher.wait_for_timeout(300)
    tids = teacher.evaluate(TEACHER_STATE)["ids"]
    ok = wait_js(f, "ids => window.getCurrentBoard().objects.map(o => o.id).join() === ids.join()", 5000, tids)
    check("C: отмена у учителя (штрих удалён) — и у ученика", ok)
    # перенос объекта: у ученика он едет следом ещё до отпускания
    teacher.evaluate("() => { const o = getCurrentBoard().objects.find(x => x.id === 't1'); o.points[0].x += 240; o.points[0].y += 60; saveDB(); scheduleRedraw(); }")
    ok = wait_js(f, "() => { const o = getCurrentBoard().objects.find(x => x.id === 't1'); return o && o.points[0].x === 2640; }", 4000)
    check("C: правка объекта (перенос текста) доезжает", ok)

    # ── D. панель тренажёров слева ──
    teacher.evaluate("() => setTrainersPanel('open')")
    teacher.wait_for_timeout(500)
    ti = teacher.evaluate(TEACHER_STATE)["inset"]
    # у ученика панели нет вовсе — ни содержимого, ни пустой полосы: холст во
    # всё окно, а камера сдвинута на ширину панели, чтобы доска стояла на тех
    # же местах экрана, что у учителя
    tcam = teacher.evaluate(TEACHER_STATE)["cam"]
    want_x = round(tcam[0] - ti / tcam[2], 1)
    ok = ti > 0 and wait_js(f, f"() => boardInset === 0 && Math.abs(cam.x - ({want_x})) < 0.2", 4000)
    check("D: панель тренажёров у учителя — у ученика её нет, холст во всё окно", ok,
          f"{ti} / {f.evaluate(VIEW_STATE)}")
    # в панели учитель открыл тренажёр — это кадр со своей страницей
    # тренажёра, но участником сессии он быть не должен: ученика не уводит с
    # доски, строка сессии и размер сцены — прежние
    code0 = teacher.evaluate("() => TrainerSession.getCode()")
    size0 = student.evaluate("() => window.__stageScale")
    teacher.evaluate("() => openTrainerInPanel('oge8', 'oge8.html', 'ОГЭ №8')")
    teacher.wait_for_function("() => { try { return document.getElementById('bdTrainersIframe').contentWindow.TrainerSession; } catch (e) { return false; } }", timeout=8000)
    teacher.wait_for_timeout(3500)
    fr = t11.stage_frame(student)
    check("D: тренажёр в панели учителя не уводит ученика с доски",
          fr is not None and fr.url.split("?")[0].endswith("/boards.html"), fr.url if fr else student.url)
    row = teacher.evaluate("c => JSON.parse(localStorage.getItem('fakeTrainerSessions'))[c].trainer", code0)
    check("D: строка сессии по-прежнему «доски»", row == "boards", row)
    check("D: размер сцены не сменился на размер панели", abs(student.evaluate("() => window.__stageScale") - size0) < 1e-6)
    check("D: тренажёр в панели сессию не ведёт", teacher.evaluate(
        "() => document.getElementById('bdTrainersIframe').contentWindow.TrainerSession.getCode()") is None)
    rt = teacher.evaluate("() => { const b = document.getElementById('boardCv').getBoundingClientRect(); return [b.left, b.width]; }")
    rs = f.evaluate("() => { const b = document.getElementById('boardCv').getBoundingClientRect(); return [b.left, b.width, innerWidth]; }")
    check("D: у ученика холст с левого края во всю ширину окна", rs[0] == 0 and rs[1] == rs[2], str(rs))
    check("D: (у учителя холст начинается за панелью)", rt[0] == ti, str(rt))
    student.wait_for_timeout(400)
    # правее панели — попиксельно то же, что у учителя
    share, info = diff_share(canvas_png(teacher), crop_left(canvas_png(f), ti))
    check("D: правее панели картинка у ученика та же, что у учителя (отличий меньше 1 %)", share < 0.01, f"{share:.4f} {info}")
    # курсор учителя над панелью ученику не показываем (панели у него нет)
    teacher.mouse.move(ti + 200, 300)
    ok = wait_js(student, "() => document.getElementById('cursor').classList.contains('on')", 3000)
    check("D: курсор учителя над доской — виден", ok)
    teacher.mouse.move(max(20, ti // 2), 300)
    ok = wait_js(student, "() => !document.getElementById('cursor').classList.contains('on')", 3000)
    check("D: курсор над панелью тренажёров — у ученика спрятан", ok)
    teacher.evaluate("() => setTrainersPanel('closed')")
    teacher.wait_for_timeout(400)

    # ── E. ученик не управляет и ничего не пишет ──
    before = f.evaluate(VIEW_STATE)["cam"]
    fr = student.evaluate("() => { const b = __stageActiveFrame().getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }")
    student.mouse.move(fr[0], fr[1])
    student.mouse.wheel(0, 400)
    student.keyboard.press("Control+z")
    student.wait_for_timeout(400)
    check("E: колесо ученика камеру не двигает", f.evaluate(VIEW_STATE)["cam"] == before)
    check("E: ученик не пишет в IndexedDB (свои доски не тронуты)", student.evaluate("() => window.__idbWrites || 0") == 0,
          str(student.evaluate("() => window.__idbWrites || 0")))

    # ── H. ученик перезагрузил страницу — получает доску целиком ──
    student.reload()
    t11.wait_stage(student, timeout=15000)
    f = frame(student)
    tids = teacher.evaluate(TEACHER_STATE)["ids"]
    ok = wait_js(f, "ids => { const B = window.getCurrentBoard(); return B && B.objects && B.objects.map(o => o.id).join() === ids.join(); }", 12000, tids)
    check("H: после перезагрузки у ученика снова вся доска", ok)
    ok = wait_js(f, f"() => ((window.getCurrentBoard().objects.find(o => o.id === 'img1') || {{}}).src || '').length === {img_len}", 12000)
    check("H: и картинка", ok)

    # ── F. список, другая доска, «К тренажёрам» ──
    teacher.evaluate("() => backToList()")
    ok = wait_js(f, "() => !document.getElementById('bdViewerWait').classList.contains('hidden')"
                    " && document.getElementById('bdViewerWaitText').textContent.indexOf('выбирает') >= 0", 5000)
    check("F: учитель вернулся к списку — у ученика «Учитель выбирает доску…»", ok)
    teacher.evaluate("() => window.openBoard('bB')")
    ok = wait_js(f, "() => { const B = window.getCurrentBoard(); return B && B.objects && B.objects.map(o => o.id).join() === 'q1'"
                    " && document.getElementById('bdViewerWait').classList.contains('hidden'); }", 8000)
    check("F: открыл другую доску — ученик видит её", ok)
    teacher.evaluate("() => backToList()")
    teacher.wait_for_timeout(300)
    teacher.click("#blToIndex")
    teacher.wait_for_url("**/index.html")
    ok = wait_js(student, """() => { const f = __stageActiveFrame(); try {
        return f.contentWindow.location.pathname.endsWith('/index.html') && !f.classList.contains('waiting'); } catch (e) { return false; } }""", 10000)
    check("F: «К тренажёрам» у учителя — ученик вернулся на главную", ok)
    check("E: за всё время ученик ничего не записал в IndexedDB", student.evaluate("() => window.__idbWrites || 0") == 0,
          str(student.evaluate("() => window.__idbWrites || 0")))
    ctx.close()


def run_plain(browser):
    """G. ученик в обычном режиме и ученик, подключившийся позже"""
    ctx = browser.new_context()
    teacher, img_len = teacher_boards(ctx)
    code = teacher.evaluate("() => TrainerSession.getCode()")
    teacher.evaluate("() => window.openBoard('bA')")
    teacher.wait_for_function("() => window.getCurrentBoard() && window.getCurrentBoard().id === 'bA' && boardActive")
    plain = P.participant(ctx, "Q", 900, 640)
    plain.add_init_script("try { localStorage.setItem('Q:tsStage:direct', '1'); } catch (e) {}")
    plain.goto(f"{BASE}/boards.html?s={code}")
    check("G: ученик в обычном режиме — без сцены", "stage.html" not in plain.url, plain.url)
    tids = teacher.evaluate(TEACHER_STATE)["ids"]
    ok = wait_js(plain, "ids => { const B = window.getCurrentBoard(); return B && B.objects && B.objects.map(o => o.id).join() === ids.join(); }", 12000, tids)
    check("G: видит доску учителя (подключился позже, получил целиком)", ok)
    check("G: без экрана входа", plain.evaluate("() => !document.getElementById('authGate')"))
    check("G: камера та же", plain.evaluate(VIEW_STATE)["cam"] == teacher.evaluate(TEACHER_STATE)["cam"])

    # Браузер ученика с прошлого урока (роль «присоединившийся») открыл доски
    # сам, без ссылки: он идёт в свои общие доски по email — сцена учителя
    # его не перехватывает, и строка сессии учителя не трогается
    own = P.participant(ctx, "R", 1000, 700)
    own.add_init_script(f"""try {{ localStorage.setItem('R:trainerSession:global', '{code}');
        localStorage.setItem('R:trainerSession:global:role', 'follower'); }} catch (e) {{}}""")
    own.goto(f"{BASE}/boards.html")
    own.wait_for_timeout(2500)
    check("I: ученик сам открыл доски — остался на досках, не на сцене",
          own.url.endswith("/boards.html"), own.url)
    check("I: совместная сессия там не запущена", own.evaluate("() => window.TrainerSession.getCode()") is None)
    check("I: экран входа в свои доски на месте", own.evaluate(
        "() => { const g = document.getElementById('authGate'); return !!g && getComputedStyle(g).display !== 'none'; }"))
    row = teacher.evaluate("c => JSON.parse(localStorage.getItem('fakeTrainerSessions'))[c].trainer", code)
    check("I: строка сессии учителя не тронута", row == "boards", row)
    ctx.close()


def run():
    with t11.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        print("A–F, H. Доска учителя на сцене")
        run_main(browser)
        print("G, I. Ученик в обычном режиме; ученик сам открыл доски")
        run_plain(browser)
        browser.close()
    real = [e for e in errors if "fonts.g" not in e]
    if real:
        failures.append("ошибки JS на странице: " + " | ".join(real[:5]))
    print()
    if failures:
        print("ПРОВАЛЫ:")
        for f in failures:
            print(" -", f)
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    run()
