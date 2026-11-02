"""
Промпт №115: презентация у ученика по ссылке — кадр вместо камеры, режимы
показа, предпросмотр у учителя (board-stage.js, deck-core.js, deck-toolbar.js,
stage.html; HANDOFF.md, раздел 6б).

Проверяем (учитель и ученик — две страницы, канал сессии подменён):
  1. «Только слайд»: слайд по центру, поля равны с точностью до 2 px при
     окнах 1280×800, 800×1000, 390×844 (меряем по пикселям холста), после
     изменения окна вписывание пересчитывается; приближение учителя ученику
     не передаётся; по умолчанию режим именно этот
  2. «Слайд с полем» с двумя размерами поля; ползунок меню двигает кадр
  3. «Как у меня»: камера как у учителя, как было
  4. Старый формат bd_view (без кадра): ученик идёт за x, y, zoom; новый
     учитель кроме кадра продолжает слать x, y, zoom
  5. Сплошная прокрутка и листание вбок: кадр — рамка текущего слайда; за
     краем «Только слайд» соседей нет, в «Слайд с полем» есть
  6. Показ учителя: кадр вписан, фон тёмный
  7. Обычная доска: кадра нет, камера как у учителя
  8. Кнопка и меню: одна строка, лента, полоса показа, «⋯»; запоминание
  9. Предпросмотр: закрыт по умолчанию, пропорции окна ученика, живое
     обновление, не чаще 200 мс и только пока открыт, перетаскивание и
     запоминание положения, переключатель учеников; без учеников 16:9 и подпись
 10. Сцена: окно страницы — окно ученика, пока идёт кадр; курсор учителя
     переведён на слайд и спрятан вне кадра; «Как у меня» и обычная доска —
     снова окно учителя и сдвиг на панель, как было

Живой realtime отсюда недоступен (заглушка Supabase из теста №78) — на сайте
совместный режим перепроверяется руками.

Запуск: ~/.venvs/trainers/bin/python test_prompt115_deck_viewer_frame.py
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt11_shared_screen as t11
import test_prompt11_board_stage as BS
import test_prompt78_demo_fixes as D

PORT = 9231
t11.PORT = PORT
t11.BASE = D.BASE = BS.BASE = BASE = f"http://127.0.0.1:{PORT}"
D.P.BASE = BASE
failures = t11.failures
errors = t11.errors
check = t11.check
wait_js = BS.wait_js

# слайды без узора: край бумаги на холсте ищем по цвету. Второй — книжный А4,
# на нём пометка; третий — тёмный, он нужен соседом в сплошной прокрутке
SEED_JS = """() => new Promise((resolve, reject) => {
  const lite = (id, name, extra) => Object.assign({ id, name, folderId: null, createdAt: 1000, updatedAt: 1000, lastOpenedAt: null, rev: 1,
    cellSize: 24, sheetCols: 76, sheetRows: 54, pageOrder: 'h', recentColors: [], colorUsage: {} }, extra || {});
  const deck = { id: 'deck', type: 'deck', points: [{ x: -1e7, y: -1e7 }], slides: [
    { id: 'sA', slot: 0, w: 64, h: 36, bg: { k: 'plain' } },
    { id: 'sB', slot: 1, w: 40, h: 57, bg: { k: 'plain' } },
    { id: 'sC', slot: 2, w: 64, h: 36, bg: { k: 'dark' } } ] };
  const pitch = 128 * 24;
  const mark = { id: 'm1', type: 'quad', rect: true, color: '#E0322B', width: 6,
    points: [{ x: 100, y: pitch + 100 }, { x: 400, y: pitch + 100 }, { x: 400, y: pitch + 300 }, { x: 100, y: pitch + 300 }] };
  const pen = { id: 'p1', type: 'pen', color: '--pencil', width: 3, points: [{ x: 2000, y: 1500 }, { x: 2100, y: 1550 }] };
  const req = indexedDB.open('ogeBoardsDB', 1);
  req.onupgradeneeded = () => req.result.createObjectStore('state');
  req.onsuccess = () => {
    const tx = req.result.transaction('state', 'readwrite');
    const st = tx.objectStore('state');
    st.put({ __v: 2, folders: [], deleted: [], sortMode: 'my', boards: [
      lite('bPlain', 'Обычная'), lite('bDeck', 'Урок', { kind: 'deck' }) ] }, 'db');
    st.put({ objects: [pen], imageLib: [] }, 'boarddata:bPlain');
    st.put({ objects: [deck, mark], imageLib: [] }, 'boarddata:bDeck');
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  };
  req.onerror = () => reject(req.error);
})"""

# Поля слайда на холсте — по пикселям, а не из cam: иначе проверялась бы та же
# формула, что её считает. Бумага — цвет середины слайда; идём к ней от края
EDGES_JS = """() => {
  const cv = document.getElementById('boardCv'), k = cv.width / cv.getBoundingClientRect().width;
  const W = cv.width, H = cv.height, c = cv.getContext('2d');
  const r = deckSlideRect(deckCur());
  const mx = Math.round(((r.x + r.w / 2) - cam.x) * cam.zoom * k), my = Math.round(((r.y + r.h * 0.9) - cam.y) * cam.zoom * k);
  const paper = c.getImageData(mx, my, 1, 1).data;
  const same = (d, i) => Math.abs(d[i] - paper[0]) < 4 && Math.abs(d[i + 1] - paper[1]) < 4 && Math.abs(d[i + 2] - paper[2]) < 4;
  const row = c.getImageData(0, my, W, 1).data, col = c.getImageData(mx, 0, 1, H).data;
  let L = 0, Rr = W - 1, T = 0, Bb = H - 1;
  while (L < W && !same(row, L * 4)) L++;
  while (Rr >= 0 && !same(row, Rr * 4)) Rr--;
  while (T < H && !same(col, T * 4)) T++;
  while (Bb >= 0 && !same(col, Bb * 4)) Bb--;
  return { l: L / k, r: (W - 1 - Rr) / k, t: T / k, b: (H - 1 - Bb) / k, w: W / k, h: H / k };
}"""
CAM_JS = "() => ({ x: cam.x, y: cam.y, zoom: cam.zoom })"
# цвет холста ученика в точке доски
PIX_JS = """([wx, wy]) => {
  const cv = document.getElementById('boardCv'), k = cv.width / cv.getBoundingClientRect().width;
  const d = cv.getContext('2d').getImageData(Math.round((wx - cam.x) * cam.zoom * k), Math.round((wy - cam.y) * cam.zoom * k), 1, 1).data;
  return [d[0], d[1], d[2]];
}"""


def near(a, b, eps):
    return abs(a - b) <= eps


def settled(st, ms=350):
    st.wait_for_timeout(ms)
    st.evaluate("() => scheduleRedraw()")
    st.wait_for_timeout(120)


def set_mode(teacher, mode, margin=None):
    js = "([m, g]) => { localStorage.setItem('boardsDeckStudentView', m); if (g != null) localStorage.setItem('boardsDeckStudentMargin', String(g)); scheduleRedraw(); }"
    teacher.evaluate(js, [mode, margin])


def open_teacher(ctx, tag="T", w=1300, h=820):
    teacher = D.participant(ctx, tag, w, h)
    teacher.goto(f"{BASE}/boards.html")
    teacher.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()")
    teacher.evaluate(SEED_JS)
    teacher.reload()
    teacher.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()")
    teacher.evaluate(BS.BOOT_JS)
    teacher.wait_for_function("() => window.getDB && window.getDB().boards.length >= 2")
    teacher.evaluate("() => window.openBoard('bDeck')")
    teacher.wait_for_function("() => boardActive && getCurrentBoard().id === 'bDeck' && typeof deckCur === 'function' && typeof deckStudentFrame === 'function'")
    teacher.evaluate("() => deckGo(0)")
    teacher.wait_for_timeout(300)
    return teacher, teacher.evaluate("() => TrainerSession.getCode()")


def open_student(ctx, code, tag, w, h):
    st = D.participant(ctx, tag, w, h)
    st.add_init_script(f"try {{ localStorage.setItem('{tag}:tsStage:direct', '1'); }} catch (e) {{}}")
    st.goto(f"{BASE}/boards.html?s={code}")
    ok = wait_js(st, "() => window.deckViewerMode === true && boardActive && deckCur() && __bdView.frame()", 20000)
    check(f"ученик {tag}: презентация с кадром открылась", ok)
    return st


def run_main(browser):
    ctx = browser.new_context()
    teacher, code = open_teacher(ctx)
    st = open_student(ctx, code, "S", 1280, 800)

    print("1. Только слайд")
    check("1: по умолчанию «Только слайд»", teacher.evaluate("() => deckStudentMode()") == "slide")
    view = st.evaluate("() => __bdView.view()")
    check("1: в bd_view и кадр, и x, y, zoom", all(k in view for k in ("fr", "x", "y", "zoom")) and view.get("fm") == "slide", str(view))
    for w, h in [(1280, 800), (800, 1000), (390, 844)]:
        st.set_viewport_size({"width": w, "height": h})
        settled(st)
        e = st.evaluate(EDGES_JS)
        tag = f"1: окно {w}×{h}"
        check(f"{tag}: поля слева и справа равны", near(e["l"], e["r"], 2), str(e))
        check(f"{tag}: поля сверху и снизу равны", near(e["t"], e["b"], 2), str(e))
        check(f"{tag}: слайд вписан — по одной оси без поля", min(e["l"], e["t"]) <= 2, str(e))
        check(f"{tag}: холст под окно", near(e["w"], w, 1) and near(e["h"], h, 1), str(e))
    # книжный слайд в широком окне: поля по бокам, а не сверху
    teacher.evaluate("() => deckGo(1, 0)")
    ok = wait_js(st, "() => deckCur().id === 'sB' && __bdView.view().ds === 'sB'", 5000)
    check("1: учитель перелистнул — кадр следующего слайда", ok)
    st.set_viewport_size({"width": 1280, "height": 800})
    settled(st)
    # низ книжного слайда: пометка в верхней части, цвет бумаги чистый
    e = st.evaluate(EDGES_JS)
    check("1: книжный А4 по центру", near(e["l"], e["r"], 2) and near(e["t"], e["b"], 2) and e["l"] > 200, str(e))
    teacher.evaluate("() => deckGo(0, 0)")
    wait_js(st, "() => __bdView.view().ds === 'sA'", 5000)
    settled(st)

    cam0 = st.evaluate(CAM_JS)
    x0 = st.evaluate("() => __bdView.view().x")
    teacher.evaluate("() => { cam.zoom *= 1.7; cam.x += 40; clampCam(); scheduleRedraw(); }")
    ok = wait_js(st, f"() => __bdView.view().x !== {x0}", 5000)
    check("1: приближение учителя дошло до ученика в x, y, zoom", ok)
    st.wait_for_timeout(200)
    check("1: но на камеру ученика не повлияло", st.evaluate(CAM_JS) == cam0, str(st.evaluate(CAM_JS)))
    teacher.evaluate("() => deckResetZoom()")
    teacher.wait_for_timeout(200)

    print("2. Слайд с полем")
    results = []
    for pct in (10, 30):
        set_mode(teacher, "margin", pct)
        ok = wait_js(st, f"() => __bdView.view().fm === 'margin' && __bdView.view().fr.w > {64 * 24 + 2 * 36 * 24 * pct / 100 - 1}", 5000)
        check(f"2: поле {pct} % дошло", ok, str(st.evaluate("() => __bdView.view()")))
        for w, h in [(1280, 800), (390, 844)]:
            st.set_viewport_size({"width": w, "height": h})
            settled(st)
            e = st.evaluate(EDGES_JS)
            z = st.evaluate("() => cam.zoom")
            m = 36 * 24 * pct / 100 * z
            check(f"2: {pct} %, {w}×{h}: по центру", near(e["l"], e["r"], 2) and near(e["t"], e["b"], 2), str(e))
            check(f"2: {pct} %, {w}×{h}: поле нужного размера", min(e["l"], e["t"]) >= m - 3 and near(min(e["l"], e["t"]), m, 3), f"{e} m={m}")
        results.append(e["l"])
    check("2: поле больше — слайд мельче", results[1] > results[0], str(results))
    st.set_viewport_size({"width": 1280, "height": 800})
    settled(st)
    bg = st.evaluate("() => { const c = document.getElementById('boardCv').getContext('2d').getImageData(3, 3, 1, 1).data; return [c[0], c[1], c[2]]; }")
    expected = st.evaluate("() => { const e = document.createElement('canvas').getContext('2d'); e.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg'); e.fillRect(0, 0, 1, 1); const d = e.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]]; }")
    check("2: поле того же цвета, что фон вокруг слайда у учителя", bg == expected, f"{bg} {expected}")

    print("3. Как у меня")
    set_mode(teacher, "mine")
    ok = wait_js(st, "() => __bdView.view().fm === 'mine' && !__bdView.view().fr && !__bdView.frame()", 5000)
    check("3: кадра в bd_view нет", ok)
    teacher.evaluate("() => { cam.zoom *= 1.5; clampCam(); scheduleRedraw(); }")
    teacher.wait_for_timeout(400)
    tc, sc = teacher.evaluate(CAM_JS), st.evaluate(CAM_JS)
    check("3: камера ученика равна камере учителя", near(tc["x"], sc["x"], .02) and near(tc["y"], sc["y"], .02) and near(tc["zoom"], sc["zoom"], .001), f"{tc} {sc}")
    teacher.evaluate("() => deckResetZoom()")

    print("4. Старый формат bd_view")
    set_mode(teacher, "slide")
    wait_js(st, "() => __bdView.frame()", 5000)
    teacher.evaluate("() => TrainerSession.broadcastEvent('bd_view', { x: 12.5, y: 34.5, zoom: 0.5, inset: 0, ds: 'sA', fl: 'v' })")
    ok = wait_js(st, "() => cam.x === 12.5 && cam.y === 34.5 && cam.zoom === 0.5", 5000)
    check("4: ученик без кадра идёт за x, y, zoom", ok, str(st.evaluate(CAM_JS)))
    check("4: и слайд рисуется", st.evaluate("() => deckCur().id") == "sA")
    # камера упрётся в слайд и не изменится — новый вид уйдёт от смены поля
    set_mode(teacher, "margin", 17)
    check("4: снова новый формат — снова кадр", wait_js(st, "() => !!__bdView.frame()", 5000))
    set_mode(teacher, "slide")

    print("5. Листание вбок и сплошная прокрутка")
    teacher.evaluate("() => deckSetFlow('h')")
    wait_js(st, "() => __bdView.view().fl === 'h'", 5000)
    settled(st)
    e = st.evaluate(EDGES_JS)
    check("5: вбок — слайд по центру", near(e["l"], e["r"], 2) and near(e["t"], e["b"], 2), str(e))
    check("5: вбок — кадр равен рамке", st.evaluate("() => { const f = __bdView.frame(), r = deckSlideRect(deckCur()); return f.x === r.x && f.y === r.y && f.w === r.w && f.h === r.h; }"))
    teacher.evaluate("() => { deckSetFlow('scroll'); deckGo(2); }")
    ok = wait_js(st, "() => __bdView.view().fl === 'scroll' && __bdView.view().ds === 'sC'", 5000)
    check("5: прокрутка дошла, текущий — третий слайд", ok, str(st.evaluate("() => __bdView.view()")))
    st.set_viewport_size({"width": 390, "height": 844})
    settled(st)
    r = st.evaluate("() => deckSlideRect(deckCur())")
    z = st.evaluate("() => cam.zoom")
    check("5: прокрутка — вписан по ширине узкого окна", near(r["w"] * z, 390, 1), str(z))
    above = st.evaluate(PIX_JS, [r["x"] + r["w"] / 2, r["y"] - 60 / z])
    expected_bg = st.evaluate("() => { const e = document.createElement('canvas').getContext('2d'); e.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg'); e.fillRect(0, 0, 1, 1); const d = e.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]]; }")
    check("5: «Только слайд» — выше слайда только фон, соседа нет", above == expected_bg, f"{above} {expected_bg}")
    set_mode(teacher, "margin", 30)
    wait_js(st, "() => __bdView.view().fm === 'margin'", 5000)
    settled(st)
    z = st.evaluate("() => cam.zoom")
    above = st.evaluate(PIX_JS, [r["x"] + r["w"] / 2, r["y"] - 4 * 24])
    check("5: «Слайд с полем» — в поле сосед из столбика (не фон)", above != expected_bg, f"{above}")
    set_mode(teacher, "slide")
    teacher.evaluate("() => { deckSetFlow('v'); deckGo(0); }")
    st.set_viewport_size({"width": 1280, "height": 800})
    wait_js(st, "() => __bdView.view().fl === 'v' && __bdView.view().ds === 'sA' && __bdView.view().fm === 'slide'", 5000)

    print("6. Показ учителя")
    teacher.evaluate("() => dtbShowStart(false)")
    ok = wait_js(st, "() => document.documentElement.classList.contains('deck-show') && __bdView.frame()", 5000)
    check("6: показ дошёл, кадр остаётся", ok)
    st.set_viewport_size({"width": 800, "height": 1000})
    settled(st)
    e = st.evaluate(EDGES_JS)
    check("6: в показе слайд по центру", near(e["l"], e["r"], 2) and near(e["t"], e["b"], 2), str(e))
    corner = st.evaluate("() => { const c = document.getElementById('boardCv').getContext('2d').getImageData(3, 3, 1, 1).data; return [c[0], c[1], c[2]]; }")
    check("6: за краем слайда тёмный фон показа", corner == [18, 20, 24], str(corner))
    teacher.evaluate("() => dtbShowStop()")
    wait_js(st, "() => !document.documentElement.classList.contains('deck-show')", 5000)
    st.set_viewport_size({"width": 1280, "height": 800})

    print("7. Обычная доска")
    teacher.evaluate("() => { backToList(); }")
    teacher.wait_for_timeout(300)
    teacher.evaluate("() => window.openBoard('bPlain')")
    ok = wait_js(st, "() => { const B = getCurrentBoard(); return B && B.objects.length === 1 && B.objects[0].id === 'p1' && boardActive && !window.deckViewerMode; }", 15000)
    check("7: у ученика обычная доска", ok)
    teacher.evaluate("() => { cam.x = 321; cam.y = 123; cam.zoom = 1.25; scheduleRedraw(); }")
    ok = wait_js(st, "() => cam.x === 321 && cam.y === 123 && cam.zoom === 1.25", 5000)
    check("7: камера как у учителя", ok, str(st.evaluate(CAM_JS)))
    v = st.evaluate("() => __bdView.view()")
    check("7: в bd_view нет ни кадра, ни режима", "fr" not in v and "fm" not in v, str(v))
    check("7: кадр не применяется", st.evaluate("() => __bdView.frame()") is None)
    ctx.close()


def run_ui(browser):
    print("8. Кнопка и меню «Ученик видит»")
    ctx = browser.new_context()
    teacher, code = open_teacher(ctx, w=1500, h=860)
    teacher.evaluate("() => { localStorage.removeItem('boardsDeckStudentView'); localStorage.removeItem('boardsDeckStudentMargin'); localStorage.removeItem('boardsDeckPreviewPos'); }")
    teacher.evaluate("() => dtbLayout()")
    check("8: кнопка в полосе видна и подписана", teacher.evaluate("() => { const b = document.getElementById('dtb-student'); return !!b && !b.classList.contains('dtb-off') && !b.closest('[hidden]') && b.getBoundingClientRect().width > 0 && b.getAttribute('aria-label') === 'Ученик видит' && /Ученик видит/.test(b.title); }"))
    check("8: предпросмотр закрыт по умолчанию", teacher.evaluate("() => !document.getElementById('dtbSvPreview') || document.getElementById('dtbSvPreview').hidden"))
    teacher.click("#dtb-student")
    check("8: меню открылось", teacher.is_visible("#dtbSvPop"))
    text = teacher.inner_text("#dtbSvPop")
    for label in ("Только слайд", "Слайд с полем", "Как у меня", "Предпросмотр ученика"):
        check(f"8: в меню «{label}»", label in text)
    check("8: отмечено «Только слайд»", teacher.get_attribute("[data-sv=slide]", "aria-checked") == "true")
    check("8: ползунок поля заперт вне «Слайд с полем»", teacher.is_disabled("#dtbSvMargin"))
    teacher.click("[data-sv=margin]")
    check("8: режим в localStorage", teacher.evaluate("() => localStorage.getItem('boardsDeckStudentView')") == "margin")
    check("8: ползунок открылся", not teacher.is_disabled("#dtbSvMargin"))
    teacher.evaluate("() => { const i = document.getElementById('dtbSvMargin'); i.value = 25; i.dispatchEvent(new Event('input', { bubbles: true })); }")
    check("8: поле в localStorage", teacher.evaluate("() => localStorage.getItem('boardsDeckStudentMargin')") == "25")
    check("8: подпись поля", "25 %" in teacher.inner_text("#dtbSvMarginVal"))
    w = teacher.evaluate("() => deckStudentFrame().w - deckSlideRect(deckCur()).w")
    check("8: кадр шире слайда на два поля", near(w, 2 * 36 * 24 * .25, .01), str(w))
    teacher.mouse.click(700, 400)
    check("8: щелчок мимо закрывает меню", not teacher.is_visible("#dtbSvPop"))
    teacher.reload()
    teacher.evaluate(BS.BOOT_JS)
    wait_js(teacher, "() => boardActive && typeof deckStudentMode === 'function' && isDeckBoard()", 8000)
    check("8: после перезагрузки режим и поле те же", teacher.evaluate("() => deckStudentMode() + deckStudentMargin()") == "margin25")
    teacher.evaluate("() => { localStorage.setItem('boardsDeckStudentView', 'slide'); }")

    # лента: вкладка «Показ»
    teacher.evaluate("() => { localStorage.setItem('boardsDeckBarStyle', 'ribbon'); dtbApplyStyle(document.getElementById('deckNav')); }")
    teacher.wait_for_timeout(150)
    tab = teacher.query_selector(".dtb-tabs [data-tab='show']") or teacher.query_selector(".dtb-tabs button:has-text('Показ')")
    if tab:
        tab.click()
        teacher.wait_for_timeout(100)
    check("8: в ленте на вкладке «Показ»", teacher.evaluate("() => { const b = document.getElementById('dtb-student'); return !!b.closest('.dtb-grp[data-g=\"show\"]') && b.getBoundingClientRect().width > 0; }"))
    teacher.evaluate("() => { localStorage.setItem('boardsDeckBarStyle', 'line'); dtbApplyStyle(document.getElementById('deckNav')); dtbLayout(); }")

    # узкое окно: уходит в «⋯», меню открывается под «⋯»
    teacher.set_viewport_size({"width": 700, "height": 800})
    teacher.wait_for_timeout(200)
    teacher.evaluate("() => dtbLayout()")
    gone = teacher.evaluate("() => document.getElementById('dtb-student').classList.contains('dtb-off')")
    check("8: на узком экране кнопка уходит в «⋯»", gone)
    teacher.click("#dtbMoreBtn")
    teacher.click("#dtbMoreMenu >> text=Ученик видит")
    check("8: из «⋯» меню открывается", teacher.is_visible("#dtbSvPop"))
    teacher.keyboard.press("Escape")
    check("8: Esc закрывает меню", not teacher.is_visible("#dtbSvPop"))
    teacher.set_viewport_size({"width": 1500, "height": 860})
    teacher.wait_for_timeout(200)

    # полоса показа
    teacher.evaluate("() => dtbShowStart(false)")
    teacher.wait_for_timeout(300)
    teacher.mouse.move(600, 500)
    teacher.click("#dtbShowBar [data-sh=student]")
    check("8: в показе меню открывается из полосы", teacher.is_visible("#dtbSvPop"))
    box = teacher.evaluate("() => { const r = document.getElementById('dtbSvPop').getBoundingClientRect(); return [r.top, r.bottom, innerHeight]; }")
    check("8: меню целиком в окне", box[0] >= 0 and box[1] <= box[2], str(box))
    no = teacher.inner_text("#dtbShowNo")
    teacher.click("#dtbSvPop [data-sv=slide]")
    check("8: щелчок в меню не листает показ", teacher.inner_text("#dtbShowNo") == no)
    teacher.keyboard.press("Escape")
    check("8: Esc закрыл меню, а не показ", teacher.evaluate("() => dtbShowOn()"))
    teacher.evaluate("() => dtbShowStop()")
    teacher.wait_for_timeout(200)

    print("9. Предпросмотр")
    teacher.click("#dtb-student")
    teacher.click("#dtbSvPreviewBtn")
    teacher.keyboard.press("Escape")
    check("9: окно открылось", teacher.is_visible("#dtbSvPreview"))
    aspect = "() => { const c = document.getElementById('dtbSvCanvas'); return c.width / c.height; }"
    wait_js(teacher, "() => document.getElementById('dtbSvNote').textContent.length > 0", 3000)
    check("9: без учеников — 16:9", near(teacher.evaluate(aspect), 16 / 9, .03), str(teacher.evaluate(aspect)))
    check("9: подпись «ученик не подключён»", teacher.inner_text("#dtbSvNote") == "ученик не подключён", teacher.inner_text("#dtbSvNote"))

    st = open_student(ctx, code, "S", 800, 1000)
    ok = wait_js(teacher, f"() => {{ const c = document.getElementById('dtbSvCanvas'); return Math.abs(c.width / c.height - {800 / 1000}) < .02; }}", 8000)
    check("9: пропорции окна ученика 800×1000", ok, str(teacher.evaluate(aspect)))
    check("9: подпись с размером", "800×1000" in teacher.inner_text("#dtbSvNote"), teacher.inner_text("#dtbSvNote"))
    st.set_viewport_size({"width": 390, "height": 844})
    ok = wait_js(teacher, f"() => {{ const c = document.getElementById('dtbSvCanvas'); return Math.abs(c.width / c.height - {390 / 844}) < .02; }}", 5000)
    check("9: окно ученика изменилось — пропорции следом", ok, str(teacher.evaluate(aspect)))
    st.set_viewport_size({"width": 1280, "height": 800})
    ok = wait_js(teacher, f"() => {{ const c = document.getElementById('dtbSvCanvas'); return Math.abs(c.width / c.height - 1.6) < .02; }}", 5000)
    check("9: и обратно", ok)

    # событие размера не чаще раза в 300 мс: дёргаем окно ученика часто
    st.evaluate("""() => { window.__sizes = 0; const o = TrainerSession.broadcastEvent; TrainerSession.broadcastEvent = function (n) { if (n === 'bd_vsize') window.__sizes++; return o.apply(this, arguments); }; }""")
    st.evaluate("""() => new Promise((res) => { let i = 0; const orig = window.innerWidth; const t = setInterval(() => {
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: orig + (++i) });
        window.dispatchEvent(new Event('resize'));
        if (i >= 30) { clearInterval(t); delete window.innerWidth; res(true); } }, 30); })""")
    n = st.evaluate("() => window.__sizes")
    check("9: размер уходит не чаще раза в 300 мс", 1 <= n <= 5, str(n))

    # что нарисовано: бумага слайда и пометка на нём
    teacher.evaluate("() => deckGo(1, 0)")
    teacher.wait_for_timeout(500)
    has = teacher.evaluate("""() => { const c = document.getElementById('dtbSvCanvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let red = 0, white = 0; for (let i = 0; i < d.length; i += 4) { if (d[i] > 180 && d[i + 1] < 90 && d[i + 2] < 90) red++; if (d[i] > 245 && d[i + 1] > 245 && d[i + 2] > 245) white++; }
      return [red, white]; }""")
    check("9: видно слайд с пометкой", has[0] > 0 and has[1] > 100, str(has))
    # центр кадра: совпадает с тем, как вписывается у ученика
    pv = teacher.evaluate("() => { const c = document.getElementById('dtbSvCanvas'); const cm = deckFrameCam(deckStudentFrame(), parseFloat(c.style.width), parseFloat(c.style.height)); const r = deckSlideRect(deckCur()); return [(r.x - cm.x) * cm.zoom, parseFloat(c.style.width) - (r.x + r.w - cm.x) * cm.zoom]; }")
    check("9: в окне кадр по центру", near(pv[0], pv[1], 1), str(pv))

    # новая пометка на слайде появляется сама
    pre = teacher.evaluate("() => document.getElementById('dtbSvCanvas').toDataURL().length")
    teacher.evaluate("""() => { const r = deckSlideRect(deckCur()); B.objects.push({ id: 'live1', type: 'quad', rect: true, color: '#1E5AE0', width: 14,
        points: [{ x: r.x + 300, y: r.y + 500 }, { x: r.x + 800, y: r.y + 500 }, { x: r.x + 800, y: r.y + 900 }, { x: r.x + 300, y: r.y + 900 }] }); scheduleRedraw(); }""")
    teacher.wait_for_timeout(450)
    check("9: пометка учителя видна без открытия заново", teacher.evaluate("() => document.getElementById('dtbSvCanvas').toDataURL().length") != pre)

    # частота: учитель перерисовывает каждый кадр — окно не чаще раза в 200 мс
    rate = teacher.evaluate("""() => new Promise((res) => { const c = document.getElementById('dtbSvCanvas'), x = c.getContext('2d');
        let n = 0; const o = x.clearRect; x.clearRect = function () { n++; return o.apply(this, arguments); };
        const end = performance.now() + 1500; (function tick() { scheduleRedraw(); if (performance.now() < end) requestAnimationFrame(tick); else { delete x.clearRect; res(n); } })(); })""")
    check("9: не чаще одной перерисовки в 200 мс", 1 <= rate <= 9, str(rate))

    # перетаскивание и запоминание
    head = teacher.evaluate("() => { const r = document.getElementById('dtbSvPHead').getBoundingClientRect(); return [r.left + 50, r.top + 10]; }")
    teacher.mouse.move(*head)
    teacher.mouse.down()
    teacher.mouse.move(300, 300, steps=4)
    teacher.mouse.up()
    pos = teacher.evaluate("() => JSON.parse(localStorage.getItem('boardsDeckPreviewPos'))")
    check("9: положение запомнено", near(pos["x"], 250, 6) and near(pos["y"], 290, 6), str(pos))
    teacher.click("#dtbSvPClose")
    check("9: закрывается крестиком", not teacher.is_visible("#dtbSvPreview"))
    rate = teacher.evaluate("""() => new Promise((res) => { const c = document.getElementById('dtbSvCanvas'), x = c.getContext('2d');
        let n = 0; const o = x.clearRect; x.clearRect = function () { n++; return o.apply(this, arguments); };
        const end = performance.now() + 600; (function tick() { scheduleRedraw(); if (performance.now() < end) requestAnimationFrame(tick); else { delete x.clearRect; res(n); } })(); })""")
    check("9: закрытое окно не рисует совсем", rate == 0, str(rate))
    teacher.click("#dtb-student")
    teacher.click("#dtbSvPreviewBtn")
    teacher.keyboard.press("Escape")
    p2 = teacher.evaluate("() => { const r = document.getElementById('dtbSvPreview').getBoundingClientRect(); return [r.left, r.top]; }")
    check("9: открылось там же", near(p2[0], pos["x"], 2) and near(p2[1], pos["y"], 2), f"{p2} {pos}")

    # второй ученик — переключатель
    st2 = open_student(ctx, code, "Q", 390, 844)
    ok = wait_js(teacher, "() => { const s = document.getElementById('dtbSvWhoSel'); return !s.hidden && s.options.length === 2; }", 12000)
    check("9: двое учеников — переключатель", ok)
    a0 = teacher.evaluate(aspect)
    opts = teacher.evaluate("() => [...document.getElementById('dtbSvWhoSel').options].map(o => o.value)")
    cur = teacher.evaluate("() => document.getElementById('dtbSvWhoSel').value")
    other = [o for o in opts if o != cur][0]
    teacher.select_option("#dtbSvWhoSel", other)
    teacher.wait_for_timeout(300)
    a1 = teacher.evaluate(aspect)
    check("9: переключили — другие пропорции", abs(a0 - a1) > .3, f"{a0} {a1}")
    # «Как у меня» в предпросмотре: прямая камера и окно того же ученика
    set_mode(teacher, "mine")
    teacher.wait_for_timeout(350)
    check("9: «Как у меня» не ломает окно", abs(teacher.evaluate(aspect) - a1) < .02)
    set_mode(teacher, "slide")
    teacher.evaluate("() => backToList()")
    ok = wait_js(teacher, "() => document.getElementById('dtbSvPreview').hidden", 3000)
    check("9: ушли с презентации — окно закрылось", ok)
    st.close(); st2.close()
    ctx.close()


def run_stage(browser):
    print("10. Сцена")
    ctx = browser.new_context()
    teacher, code = open_teacher(ctx, w=1300, h=820)
    teacher.evaluate("() => { localStorage.setItem('boardsDeckStudentView', 'slide'); scheduleRedraw(); }")
    st = D.participant(ctx, "Z", 800, 1000)
    st.goto(f"{BASE}/stage.html?s={code}&to=boards.html")
    frame = None
    for _ in range(200):
        frame = t11.stage_frame(st)
        try:
            if frame and frame.evaluate("() => window.deckViewerMode === true && !!window.__bdView && !!__bdView.frame() && innerWidth === 800"):
                break
        except Exception:
            pass
        st.wait_for_timeout(100)
    check("10: кадр страницы размером с окно ученика", frame is not None and frame.evaluate("() => [innerWidth, innerHeight].join()") == "800,1000",
          frame.evaluate("() => [innerWidth, innerHeight].join()") if frame else "нет кадра")
    check("10: масштаб сцены 1", st.evaluate("() => window.__stageScale") == 1, str(st.evaluate("() => window.__stageScale")))
    frame.wait_for_timeout(300)
    frame.evaluate("() => scheduleRedraw()")
    frame.wait_for_timeout(150)
    e = frame.evaluate(EDGES_JS)
    check("10: слайд по центру окна ученика и по его ширине", near(e["l"], e["r"], 2) and near(e["t"], e["b"], 2) and e["l"] <= 2, str(e))

    # курсор: точка слайда у учителя → та же точка слайда у ученика
    frame.evaluate("""() => { window.__cur = []; const o = window.parent.postMessage.bind(window.parent);
      window.parent.postMessage = function (m, t) { if (m && m.type === 'cursor') window.__cur.push(m); return o(m, t); }; }""")
    mapped = frame.evaluate("() => __tsCursorMap ? 1 : 0")
    check("10: перевод курсора подключён", mapped == 1)
    r = teacher.evaluate("() => { const r = deckSlideRect(deckCur()); return { sx: boardInset + (r.x + r.w / 2 - cam.x) * cam.zoom, sy: (r.y + r.h / 2 - cam.y) * cam.zoom }; }")
    m = frame.evaluate("([x, y]) => __tsCursorMap(x, y)", [r["sx"], r["sy"]])
    check("10: середина слайда учителя — середина слайда ученика", near(m["x"], 400, 2) and near(m["y"], 500, 2), str(m))
    check("10: мимо кадра (над лентой) — стрелка спрятана", frame.evaluate("() => __tsCursorMap(2, 2)") is None)
    teacher.mouse.move(r["sx"], r["sy"])
    ok = wait_js(st, "() => document.getElementById('cursor').classList.contains('on')", 4000)
    check("10: курсор дошёл до сцены", ok)
    tr = st.evaluate("() => document.getElementById('cursor').style.transform")
    check("10: стрелка на середине слайда ученика", "400px" in tr and "500px" in tr, tr)

    print("10б. «Как у меня» на сцене — как раньше")
    teacher.evaluate("() => { localStorage.setItem('boardsDeckStudentView', 'mine'); scheduleRedraw(); }")
    ok = wait_js(frame, "() => innerWidth === 1300 && innerHeight === 820", 5000)
    check("10б: снова окно учителя", ok, frame.evaluate("() => [innerWidth, innerHeight].join()"))
    check("10б: масштаб сцены — окно учителя в окно ученика", near(st.evaluate("() => window.__stageScale"), 800 / 1300, .001), str(st.evaluate("() => window.__stageScale")))
    teacher.wait_for_timeout(300)
    tc, sc = teacher.evaluate("() => ({ x: cam.x, y: cam.y, zoom: cam.zoom, ins: boardInset })"), frame.evaluate(CAM_JS)
    check("10б: камера со сдвигом на панель", near(sc["x"], tc["x"] - tc["ins"] / tc["zoom"], .05) and near(sc["zoom"], tc["zoom"], .001), f"{tc} {sc}")
    check("10б: курсор без перевода", frame.evaluate("() => __tsCursorMap(5, 5) === undefined"))

    print("10в. Обычная доска на сцене")
    teacher.evaluate("() => { localStorage.setItem('boardsDeckStudentView', 'slide'); scheduleRedraw(); }")
    wait_js(frame, "() => innerWidth === 800", 5000)
    teacher.evaluate("() => { backToList(); }")
    teacher.wait_for_timeout(300)
    teacher.evaluate("() => window.openBoard('bPlain')")
    ok = wait_js(frame, "() => { const B = getCurrentBoard(); return B && B.objects.length === 1 && boardActive && !window.deckViewerMode && innerWidth === 1300 && innerHeight === 820; }", 15000)
    check("10в: обычная доска — снова окно учителя", ok, frame.evaluate("() => [innerWidth, innerHeight, !!window.deckViewerMode].join()"))
    ctx.close()


def run():
    with t11.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        run_main(browser)
        run_ui(browser)
        run_stage(browser)
        browser.close()
    real = [e for e in errors if "fonts.g" not in e]
    if real:
        failures.append("ошибки JS на странице: " + " | ".join(real[:5]))
    print()
    if failures:
        print("ПРОВАЛЫ:")
        for x in failures:
            print(" -", x)
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    run()
