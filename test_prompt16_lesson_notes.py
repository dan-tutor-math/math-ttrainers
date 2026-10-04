"""
Промпт №16 (новый список): конспект сессии при работе в тренажёрах,
редактор конспекта, режимы ластика.

Проверяем:
  A. Ластик в тренажёре: переключатель «Область / Штрих» в окошке ластика,
     значок режима на кнопке, режим помнится; «по штрихам» удаляет задетый
     штрих целиком и не трогает соседний, Ctrl+Z возвращает; «по области»
     по-прежнему кладёт растровый штрих-ластик.
  B. ОГЭ №6 (тренажёр без своего снимка): «Обновить» без работы — страницы
     нет; записи — страница с картинкой задания и отдельными штрихами,
     записи с доски убраны; неверный ответ — «ответ неверный», верный —
     «ответ верный»; подписи (тренажёр, прототип).
  C. Записи далеко сбоку и внизу — масштаб уменьшается, всё на листе,
     задание сверху по центру; растровый ластик режет штрих на куски.
  D. Столбик (сложение): «Обновить пример» — страница, подпись уровня.
  E. ОГЭ №8 (свой snapshotAndClear): карточка «+» — забираются только её
     записи; смена типа — все.
  F. ЕГЭ профиль: верный ответ, «Следующий прототип» — «ответ верный».
  G. Совместный доступ (isShared): страница есть, но записи сами не
     стираются; на ОГЭ №8 прежняя история урока работает как раньше.
  H. Сессии: переживают перезагрузку; «Начать новую», «Завершить»
     (пустая удаляется), три часа тишины — новая сессия.
  I. Редактор: страницы, ручка, выделение и перенос, размер за угол,
     текст, копировать/вставить, удаление, отмена, ластик обоих режимов,
     пустая страница, порядок, удаление страницы, автосохранение,
     переименование, PDF, список сессий (открыть, переименовать, удалить).
  J. «Сохранить как доску»: доска появляется в досках, по листу на
     страницу, со штрихами и картинкой.

Сеть к Supabase отрезана: совместный режим в песочнице не проверить —
isShared подменяется прямо в странице. Живьём перепроверять на сайте.

Запуск: python3 test_prompt16_lesson_notes.py (сервер поднимается сам).
"""
import contextlib
import http.client
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8959
BASE = f"http://127.0.0.1:{PORT}"
failures = []


def check(name, cond, extra=""):
    print(f"[{'OK' if cond else 'FAIL'}] {name}" + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        failures.append(name)


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                c = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                c.request("GET", "/index.html"); c.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        yield
    finally:
        proc.terminate(); proc.wait(timeout=5)


def new_page(ctx, errors):
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.route("https://**/*", lambda r: r.abort())
    return pg


def open_trainer(pg, slug):
    pg.goto(f"{BASE}/{slug}.html")
    pg.wait_for_function("() => window.LessonNotes && window.__boardTakeStrokes")
    pg.wait_for_timeout(500)


def board_on(pg):
    if pg.evaluate("() => document.documentElement.getAttribute('data-board') !== 'on'"):
        pg.click("#boardVisibilityToggle")
    pg.wait_for_timeout(100)


def draw(pg, pts):
    pg.mouse.move(*pts[0]); pg.mouse.down()
    for p in pts[1:]:
        pg.mouse.move(*p, steps=6)
    pg.mouse.up()
    pg.wait_for_timeout(60)


def strokes(pg):
    return pg.evaluate("() => { const s = window.__boardGetState(); return [s.strokes.length, s.bgStrokes.length]; }")


def wait_chain(pg):
    pg.evaluate("() => window.LessonNotes._chain()")
    pg.wait_for_timeout(100)


PAGES_JS = """async () => {
  const s = await NotesStore.currentSession();
  if (!s) return { sid: null, pages: [] };
  const pages = await NotesStore.getPages(s.id);
  return { sid: s.id, pages: pages.map(p => ({ id: p.id, trainer: p.trainer, title: p.trainerTitle, proto: p.proto,
    result: p.result, objs: p.objects.map(o => ({ type: o.type, x: o.points[0].x, y: o.points[0].y, w: o.w, h: o.h,
    n: o.points.length, xs: o.points.map(q => q.x), ys: o.points.map(q => q.y), lnTask: !!o.lnTask, src: o.src ? o.src.slice(0, 22) : null })) })) };
}"""


def pages(pg):
    return pg.evaluate(PAGES_JS)


def rect(pg, sel):
    return pg.evaluate("s => { const r = document.querySelector(s).getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }", sel)


def test_eraser(ctx, errors):
    print("A. Ластик по штрихам в тренажёре")
    pg = new_page(ctx, errors)
    open_trainer(pg, "addition")
    board_on(pg)
    x, y, w, h = rect(pg, "#mainSheet")
    draw(pg, [(x + 300, y + 100), (x + 500, y + 100)])
    draw(pg, [(x + 300, y + 200), (x + 500, y + 200)])
    check("A: два штриха на листе", strokes(pg)[0] == 2)
    check("A: по умолчанию режим «Область», значок на кнопке",
          pg.evaluate("() => document.querySelector('.board-tool-btn.eraser').dataset.eraserMode === 'area' && !!document.querySelector('.be-badge')"))
    pg.hover(".board-tool-btn.eraser")
    pg.wait_for_timeout(150)
    check("A: в окошке ластика есть переключатель режимов", pg.is_visible(".be-mode[data-eraser-mode='stroke']"))
    pg.screenshot(path="/tmp/test16_eraser_flyout.png")
    pg.click(".be-mode[data-eraser-mode='stroke']")
    check("A: «Штрих» включил ластик и режим по штрихам",
          pg.evaluate("() => document.querySelector('.board-tool-btn.eraser').classList.contains('active') && window.__boardEraserMode() === 'stroke' && localStorage.getItem('boardEraserMode') === 'stroke'"))
    check("A: значок режима сменился", pg.evaluate("() => document.querySelector('.be-badge').textContent === '〰'"))
    draw(pg, [(x + 400, y + 80), (x + 400, y + 125)])   # пересекаем только верхний штрих
    st = pg.evaluate("() => window.__boardGetState().strokes.map(s => ({ tool: s.tool, y: s.points[0].y }))")
    check("A: задетый штрих удалён целиком, второй цел, своего штриха ластик не оставил",
          len(st) == 1 and st[0]["tool"] == "pen" and st[0]["y"] > 150, str(st))
    pg.keyboard.press("Control+z")
    pg.wait_for_timeout(100)
    check("A: Ctrl+Z возвращает стёртый штрих", strokes(pg)[0] == 2)
    pg.reload(); pg.wait_for_function("() => window.__boardEraserMode"); pg.wait_for_timeout(300)
    check("A: режим ластика помнится после перезагрузки", pg.evaluate("() => window.__boardEraserMode() === 'stroke'"))
    pg.evaluate("() => window.__boardEraserMode('area')")
    board_on(pg)
    x, y, w, h = rect(pg, "#mainSheet")
    draw(pg, [(x + 300, y + 100), (x + 500, y + 100)])
    pg.click(".board-tool-btn.eraser")
    draw(pg, [(x + 400, y + 80), (x + 400, y + 125)])
    st = pg.evaluate("() => window.__boardGetState().strokes.map(s => s.tool)")
    check("A: «Область» — прежний растровый ластик (штрих-ластик поверх)", st == ["pen", "eraser"], str(st))
    pg.evaluate("() => localStorage.removeItem('boardEraserMode')")
    pg.close()


def test_oge6(ctx, errors):
    print("B. ОГЭ №6: когда страница сохраняется и что на ней")
    pg = new_page(ctx, errors)
    open_trainer(pg, "oge6")
    pg.click("#pickerArea .mode-card[data-id]:not(.random):not(.soon)")
    pg.wait_for_timeout(300)
    pg.click("#refreshBtn"); wait_chain(pg)
    check("B: без работы с заданием страница не сохраняется", len(pages(pg)["pages"]) == 0)
    check("B: кнопка «Конспект» на странице", pg.is_visible("#lnBtn"))

    board_on(pg)
    x, y, w, h = rect(pg, "#questionPanel")
    draw(pg, [(x + 500, y + 40), (x + 600, y + 90)])      # поверх задания
    draw(pg, [(x - 150, y + 30), (x - 80, y + 120)])     # вокруг (фон)
    check("B: записи есть на листе и на фоне", strokes(pg) == [1, 1], str(strokes(pg)))
    title = pg.evaluate("() => document.getElementById('taskTitle').textContent.trim()")
    pg.click("#refreshBtn"); wait_chain(pg)
    P = pages(pg)["pages"]
    check("B: записи → страница в конспекте", len(P) == 1)
    p = P[0]
    check("B: только записи → «только записи»", p["result"] == "notes", p["result"])
    check("B: подписи — тренажёр и прототип", "ОГЭ №6" in p["title"] and p["proto"] == title, f"{p['title']} / {p['proto']}")
    types = [o["type"] for o in p["objs"]]
    check("B: задание — отдельная картинка, штрихи — отдельные штрихи", types == ["image", "pen", "pen"], str(types))
    check("B: картинка задания настоящая (png)", p["objs"][0]["src"].startswith("data:image/png") and p["objs"][0]["lnTask"])
    check("B: записи с доски убраны — новое задание на чистом месте", strokes(pg) == [0, 0], str(strokes(pg)))
    img = p["objs"][0]
    # штрих поверх задания лёг поверх картинки, тот, что слева, — левее неё
    over = next(o for o in p["objs"][1:] if min(o["xs"]) > img["x"])
    left = next(o for o in p["objs"][1:] if max(o["xs"]) < img["x"])
    check("B: штрих поверх задания — поверх картинки", img["x"] < min(over["xs"]) < img["x"] + img["w"] and img["y"] < min(over["ys"]) < img["y"] + img["h"])
    check("B: штрих вокруг задания — рядом с ней, слева", left is not None)

    # неверный ответ
    pg.fill("#answerInput", "123456"); pg.click("#checkAnswerBtn")
    pg.click("#refreshBtn"); wait_chain(pg)
    P = pages(pg)["pages"]
    check("B: неверный ответ — «ответ неверный»", len(P) == 2 and P[1]["result"] == "bad", str([q["result"] for q in P]))
    # верный ответ
    val = pg.evaluate("() => String(curTask.correctValue).replace('.', ',')")
    pg.fill("#answerInput", val); pg.click("#checkAnswerBtn")
    pg.wait_for_timeout(200)
    pg.click("#nextBtn"); wait_chain(pg)
    P = pages(pg)["pages"]
    check("B: верный ответ и «Следующий пример» — «ответ верный»", len(P) == 3 and P[2]["result"] == "ok", str([q["result"] for q in P]))
    check("B: счётчик на кнопке — 3", pg.evaluate("() => document.querySelector('#lnBtn .ln-count').textContent") == "3")
    # введённый, но не проверенный ответ
    pg.fill("#answerInput", "7")
    pg.click("#refreshBtn"); wait_chain(pg)
    P = pages(pg)["pages"]
    check("B: ответ введён, но не проверен — «ответ не дан»", len(P) == 4 and P[3]["result"] == "none", str([q["result"] for q in P]))
    pg.click("#lnBtn")
    pg.wait_for_timeout(200)
    check("B: окошко конспекта: сессия и 4 страницы", "4 страницы" in pg.inner_text("#lnPop"))
    pg.screenshot(path="/tmp/test16_trainer_pop.png")
    pg.click("#lnBtn")

    print("C. Записи далеко — всё помещается; растровый ластик режет штрих")
    board_on(pg)
    x, y, w, h = rect(pg, "#questionPanel")
    draw(pg, [(20, 120), (60, 760)])                         # далеко слева и вниз
    draw(pg, [(x + 200, y + 60), (x + 600, y + 60)])         # длинная прямая
    pg.click(".board-tool-btn.eraser")
    draw(pg, [(x + 400, y + 30), (x + 400, y + 95)])         # перерезали её ластиком
    pg.click(".board-tool-btn.pen-main")
    pg.click("#refreshBtn"); wait_chain(pg)
    p = pages(pg)["pages"][-1]
    W, H = 1824, 1296
    allx = [v for o in p["objs"] for v in (o["xs"] if o["type"] != "image" else [o["x"], o["x"] + o["w"]])]
    ally = [v for o in p["objs"] for v in (o["ys"] if o["type"] != "image" else [o["y"], o["y"] + o["h"]])]
    check("C: всё на листе (уменьшено, не обрезано)", min(allx) >= 0 and max(allx) <= W and min(ally) >= 0 and max(ally) <= H, f"{min(allx)}..{max(allx)} / {min(ally)}..{max(ally)}")
    img = p["objs"][0]
    check("C: задание по центру листа", abs(img["x"] + img["w"] / 2 - W / 2) < 2)
    pens = [o for o in p["objs"] if o["type"] == "pen"]
    check("C: перерезанная прямая — два куска, дальний штрих — один", len(pens) == 3, str(len(pens)))
    pg.close()


def test_addition(ctx, errors):
    print("D. Сложение в столбик")
    pg = new_page(ctx, errors)
    open_trainer(pg, "addition")
    pg.evaluate("() => NotesStore.startNew()")
    board_on(pg)
    x, y, w, h = rect(pg, "#mainSheet")
    draw(pg, [(x + 600, y + 150), (x + 700, y + 220)])
    pg.click("#refreshBtn"); wait_chain(pg)
    P = pages(pg)["pages"]
    check("D: страница по «Обновить пример»", len(P) == 1 and P[0]["trainer"] == "addition")
    check("D: подпись уровня", P and P[0]["proto"] == "Уровень 1", P and P[0]["proto"])
    check("D: записи убраны", strokes(pg) == [0, 0])
    pg.close()


def test_oge8(ctx, errors):
    print("E. ОГЭ №8: карточка «+» и смена типа")
    pg = new_page(ctx, errors)
    open_trainer(pg, "oge8")
    pg.evaluate("() => NotesStore.startNew()")
    pg.click("#pickerArea .mode-card[data-id]:not(.random):not(.soon)")
    pg.wait_for_timeout(300)
    pg.evaluate("() => document.querySelector('.add-qty-btn[data-n=\"1\"]').click()")
    pg.wait_for_timeout(400)
    board_on(pg)
    cx, cy, cw, ch = rect(pg, ".added-task-card[data-idx='0']")
    mx, my, mw, mh = rect(pg, "#card1Wrapper")
    draw(pg, [(cx + 200, cy + 30), (cx + 300, cy + 60)])
    draw(pg, [(mx + 200, my + 30), (mx + 300, my + 60)])
    n0 = sum(strokes(pg))
    pg.evaluate("() => document.querySelector('.added-task-card[data-idx=\"0\"] .added-refresh-btn').click()")
    wait_chain(pg)
    P = pages(pg)["pages"]
    check("E: ⟳ карточки — страница с её записью", len(P) == 1 and len([o for o in P[0]["objs"] if o["type"] == "pen"]) == 1)
    check("E: запись над основным заданием осталась", n0 == 2 and sum(strokes(pg)) == 1, str(strokes(pg)))
    pg.click("#nextTypeBtn"); wait_chain(pg)
    P = pages(pg)["pages"]
    check("E: смена типа — страница со всем заданием", len(P) == 2 and P[1]["result"] == "notes")
    check("E: записи убраны", sum(strokes(pg)) == 0)
    pg.close()


def test_ege(ctx, errors):
    print("F. ЕГЭ профиль")
    pg = new_page(ctx, errors)
    open_trainer(pg, "ege_prof")
    pg.evaluate("() => NotesStore.startNew()")
    pg.click(".mode-card:not(.soon)")
    pg.wait_for_timeout(400)
    val = pg.evaluate("() => fieldsOf(protoById(S.n, S.pid))[0].value")
    pg.fill("#answerArea input.answer-input", str(val))
    pg.click("#answerArea .check-btn")
    pg.wait_for_timeout(200)
    pg.click("#nextProtoBtn"); wait_chain(pg)
    P = pages(pg)["pages"]
    check("F: верный ответ — «ответ верный»", len(P) == 1 and P[0]["result"] == "ok", str([q["result"] for q in P]))
    check("F: подпись прототипа", P and "прототип 1" in P[0]["proto"], P and P[0]["proto"])
    pg.close()


def test_shared(ctx, errors):
    print("G. Совместный доступ")
    pg = new_page(ctx, errors)
    open_trainer(pg, "oge6")
    pg.evaluate("() => NotesStore.startNew()")
    pg.evaluate("() => { TrainerSession.isShared = () => true; }")
    pg.click("#pickerArea .mode-card[data-id]:not(.random):not(.soon)")
    board_on(pg)
    x, y, w, h = rect(pg, "#questionPanel")
    draw(pg, [(x + 500, y + 40), (x + 600, y + 90)])
    pg.click("#refreshBtn"); wait_chain(pg)
    check("G: в совместном доступе страница в конспект уходит", len(pages(pg)["pages"]) == 1)
    check("G: но записи сами не стираются (как было)", strokes(pg) == [1, 0], str(strokes(pg)))
    pg.click("#lnBtn"); pg.wait_for_timeout(150)
    check("G: в окошке — пояснение про совместный доступ", pg.is_visible("#lnPop .ln-note.on"))
    pg.close()

    pg = new_page(ctx, errors)
    open_trainer(pg, "oge8")
    pg.evaluate("() => NotesStore.startNew()")
    pg.evaluate("() => { TrainerSession.isShared = () => true; }")
    pg.click("#pickerArea .mode-card[data-id]:not(.random):not(.soon)")
    pg.wait_for_timeout(300)
    board_on(pg)
    x, y, w, h = rect(pg, "#card1Wrapper")
    draw(pg, [(x + 300, y + 30), (x + 400, y + 60)])
    draw(pg, [(x - 150, y + 30), (x - 80, y + 120)])
    pg.click("#nextTypeBtn")
    pg.wait_for_function("() => LessonHistory.getCount() === 1", timeout=15000)
    wait_chain(pg)
    pg.wait_for_timeout(300)
    check("G: ОГЭ №8: прежняя история урока сняла задание", pg.evaluate("() => LessonHistory.getCount()") == 1)
    check("G: ОГЭ №8: прежняя очистка над заданием, фон не тронут", strokes(pg) == [0, 1], str(strokes(pg)))
    check("G: ОГЭ №8: и страница в конспекте", len(pages(pg)["pages"]) == 1)
    pg.close()

    pg = new_page(ctx, errors)
    open_trainer(pg, "oge8")
    pg.evaluate("() => NotesStore.startNew()")
    pg.click("#pickerArea .mode-card[data-id]:not(.random):not(.soon)")
    pg.wait_for_timeout(300)
    board_on(pg)
    x, y, w, h = rect(pg, "#card1Wrapper")
    draw(pg, [(x + 300, y + 30), (x + 400, y + 60)])
    pg.click("#nextTypeBtn"); wait_chain(pg); pg.wait_for_timeout(800)
    check("G: вне совместного доступа второй (старый) снимок не делается", pg.evaluate("() => LessonHistory.getCount()") == 0)
    pg.close()


def test_sessions(ctx, errors):
    print("H. Сессии")
    pg = new_page(ctx, errors)
    open_trainer(pg, "oge6")
    sid = pg.evaluate("async () => (await NotesStore.startNew()).id")
    pg.click("#pickerArea .mode-card[data-id]:not(.random):not(.soon)")
    board_on(pg)
    x, y, w, h = rect(pg, "#questionPanel")
    draw(pg, [(x + 500, y + 40), (x + 600, y + 90)])
    pg.click("#refreshBtn"); wait_chain(pg)
    pg.reload(); pg.wait_for_function("() => window.LessonNotes"); pg.wait_for_timeout(500)
    P = pages(pg)
    check("H: сессия и страница пережили перезагрузку", P["sid"] == sid and len(P["pages"]) == 1)
    pg.click("#lnBtn"); pg.click("#lnPop [data-act='new']"); pg.wait_for_timeout(300)
    P2 = pages(pg)
    check("H: «Начать новую сессию» — новая, пустая", P2["sid"] and P2["sid"] != sid and len(P2["pages"]) == 0)
    sid2 = P2["sid"]
    pg.click("#lnPop [data-act='end']"); pg.wait_for_timeout(300)
    gone = pg.evaluate("async (id) => !(await NotesStore.getSession(id))", sid2)
    check("H: «Завершить» пустую сессию — её нет в списке", gone and pages(pg)["sid"] is None)
    pg.click("#lnBtn")
    if not pg.is_visible("#questionPanel"):
        pg.click("#pickerArea .mode-card[data-id]:not(.random):not(.soon)")
        pg.wait_for_timeout(300)
    board_on(pg)
    x, y, w, h = rect(pg, "#questionPanel")
    draw(pg, [(x + 500, y + 40), (x + 600, y + 90)])
    pg.click("#refreshBtn"); wait_chain(pg)
    P3 = pages(pg)
    check("H: после завершения следующая страница — уже в новой сессии", P3["sid"] not in (None, sid, sid2) and len(P3["pages"]) == 1)
    # три часа тишины
    pg.evaluate("() => { const c = JSON.parse(localStorage.getItem('lnCurrent:v1')); c.at -= 3.1 * 3600 * 1000; localStorage.setItem('lnCurrent:v1', JSON.stringify(c)); }")
    board_on(pg)
    draw(pg, [(x + 500, y + 40), (x + 600, y + 90)])
    pg.click("#refreshBtn"); wait_chain(pg)
    P4 = pages(pg)
    check("H: после трёх часов тишины — новая сессия", P4["sid"] != P3["sid"] and len(P4["pages"]) == 1)
    old_ended = pg.evaluate("async (id) => !!(await NotesStore.getSession(id)).endedAt", P3["sid"])
    check("H: старая сессия помечена завершённой", old_ended)
    pg.close()
    return P4["sid"]


def ed_point(ed, x, y):
    p = ed.evaluate("([x, y]) => window.__notesEditor.toScreen({ x, y })", [x, y])
    return (p["x"], p["y"])


def ed_state(ed):
    return ed.evaluate("""() => { const s = window.__notesEditor.state();
      return { n: s.pages.length, cur: s.cur, sel: s.selected, objs: s.pages[s.cur] ? s.pages[s.cur].objects.map(o => ({ id: o.id, type: o.type,
        x: o.points[0].x, y: o.points[0].y, w: o.w, h: o.h, n: o.points.length, content: o.content || null })) : [] }; }""")


def test_editor(ctx, errors, sid):
    print("I. Редактор конспекта")
    # три страницы в сессии: накидаем их тренажёром
    tr = new_page(ctx, errors)
    open_trainer(tr, "oge6")
    sid = tr.evaluate("async () => (await NotesStore.startNew()).id")
    tr.click("#pickerArea .mode-card[data-id]:not(.random):not(.soon)")
    board_on(tr)
    for i in range(3):
        x, y, w, h = rect(tr, "#questionPanel")
        draw(tr, [(x + 450, y + 40 + i * 10), (x + 650, y + 70)])
        tr.click("#refreshBtn"); wait_chain(tr)
    ed = new_page(ctx, errors)
    ed.goto(f"{BASE}/notes.html?s={sid}")
    ed.wait_for_function("() => window.__notesEditor && window.__notesEditor.state().pages.length === 3")
    ed.wait_for_timeout(400)
    ed.screenshot(path="/tmp/test16_editor.png")
    check("I: три страницы слева, открыта первая", ed.locator(".pg-item").count() == 3 and ed_state(ed)["cur"] == 0)
    check("I: подпись страницы — время, тренажёр, результат", "ОГЭ №6" in ed.inner_text(".pg-item >> nth=0") and "только записи" in ed.inner_text(".pg-item >> nth=0"))

    # ручка
    ed.click("[data-tool='pen']")
    n0 = len(ed_state(ed)["objs"])
    a, b = ed_point(ed, 200, 900), ed_point(ed, 500, 1000)
    draw(ed, [a, b])
    s = ed_state(ed)
    check("I: ручка добавляет штрих", len(s["objs"]) == n0 + 1 and s["objs"][-1]["type"] == "pen")
    # выделение и перенос картинки задания
    ed.click("[data-tool='select']")
    img = s["objs"][0]
    c = ed_point(ed, img["x"] + img["w"] / 2, img["y"] + img["h"] / 2)
    c2 = ed_point(ed, img["x"] + img["w"] / 2 + 100, img["y"] + img["h"] / 2 + 200)
    draw(ed, [c, c2])
    s2 = ed_state(ed)
    check("I: задание выделяется и переносится", abs(s2["objs"][0]["x"] - img["x"] - 100) < 2 and abs(s2["objs"][0]["y"] - img["y"] - 200) < 2, f"{img['x']}→{s2['objs'][0]['x']}")
    # размер за угол (правый нижний)
    im2 = s2["objs"][0]
    se = ed_point(ed, im2["x"] + im2["w"], im2["y"] + im2["h"])
    se2 = ed_point(ed, im2["x"] + im2["w"] * 0.5, im2["y"] + im2["h"] * 0.5)
    draw(ed, [se, se2])
    s3 = ed_state(ed)
    check("I: размер за угол — пропорционально", abs(s3["objs"][0]["w"] - im2["w"] * 0.5) < im2["w"] * 0.05 and abs(s3["objs"][0]["w"] / s3["objs"][0]["h"] - im2["w"] / im2["h"]) < 0.02)
    # отмена
    ed.keyboard.press("Control+z")
    check("I: Ctrl+Z отменяет размер", abs(ed_state(ed)["objs"][0]["w"] - im2["w"]) < 1)
    ed.keyboard.press("Control+Shift+z")
    check("I: Ctrl+Shift+Z возвращает", abs(ed_state(ed)["objs"][0]["w"] - s3["objs"][0]["w"]) < 1)
    # текст
    ed.click("[data-tool='text']")
    t = ed_point(ed, 1200, 1000)
    ed.mouse.click(*t)
    ed.wait_for_selector(".txt-edit")
    ed.keyboard.type("Проверка 2x+1")
    ed.keyboard.press("Escape")
    s4 = ed_state(ed)
    txt = [o for o in s4["objs"] if o["type"] == "text"]
    check("I: текст добавляется", len(txt) == 1 and txt[0]["content"] == "Проверка 2x+1", str(txt))
    # копировать и вставить
    ed.click("[data-tool='select']")
    tp = ed_point(ed, txt[0]["x"] + 10, txt[0]["y"] + 10)
    ed.mouse.click(*tp)
    ed.keyboard.press("Control+c")
    ed.keyboard.press("Control+v")
    s5 = ed_state(ed)
    check("I: Ctrl+C / Ctrl+V — копия рядом", len([o for o in s5["objs"] if o["type"] == "text"]) == 2)
    # удаление выделенного
    ed.keyboard.press("Delete")
    check("I: Delete удаляет выделенное", len([o for o in ed_state(ed)["objs"] if o["type"] == "text"]) == 1)
    # выделение рамкой
    p1, p2 = ed_point(ed, 150, 850), ed_point(ed, 560, 1060)
    draw(ed, [p1, p2])
    sel = ed_state(ed)["sel"]
    check("I: выделение рамкой берёт штрих", len(sel) == 1)
    # ластик по области режет штрих
    ed.click("[data-tool='eraser']")
    ed.click("[data-ermode='area']")
    before = len([o for o in ed_state(ed)["objs"] if o["type"] == "pen"])
    draw(ed, [ed_point(ed, 350, 850), ed_point(ed, 350, 1080)])
    after = len([o for o in ed_state(ed)["objs"] if o["type"] == "pen"])
    check("I: ластик «Область» режет штрих на два", after == before + 1, f"{before}→{after}")
    ed.click("[data-ermode='stroke']")
    draw(ed, [ed_point(ed, 230, 870), ed_point(ed, 260, 960)])
    after2 = len([o for o in ed_state(ed)["objs"] if o["type"] == "pen"])
    check("I: ластик «Штрих» удаляет кусок целиком", after2 == after - 1, f"{after}→{after2}")
    check("I: ластик не трогает картинку задания", ed_state(ed)["objs"][0]["type"] == "image")
    # автосохранение
    ed.wait_for_timeout(900)
    saved = ed.evaluate("async (id) => { const ps = await NotesStore.getPages(id); return ps[0].objects.map(o => o.type); }", sid)
    check("I: правки сохранены сами", saved.count("text") == 1 and saved[0] == "image")
    # пустая страница после текущей
    ed.click("#pgAdd")
    ed.wait_for_timeout(300)
    s6 = ed_state(ed)
    check("I: «+ Пустая страница» — после текущей, и она открыта", s6["n"] == 4 and s6["cur"] == 1 and s6["objs"] == [])
    # вставка на другой странице
    ed.keyboard.press("Control+v")
    check("I: скопированное вставляется и на другой странице", len(ed_state(ed)["objs"]) == 1)
    # порядок: пустую — вниз
    ed.hover(".pg-item.sel")
    ed.click(".pg-item.sel [data-pact='down']")
    ed.wait_for_timeout(300)
    order = ed.evaluate("async (id) => (await NotesStore.getSession(id)).pageIds", sid)
    ids = ed.evaluate("() => window.__notesEditor.state().pages.map(p => p.id)")
    check("I: порядок страниц меняется и сохраняется", order == ids and ed_state(ed)["cur"] == 2)
    # удаление страницы
    ed.click(".pg-item.sel [data-pact='del']")
    ed.click(".pg-item.sel [data-pact='del-yes']")
    ed.wait_for_timeout(300)
    check("I: страница удаляется (с подтверждением)", ed_state(ed)["n"] == 3 and len(ed.evaluate("async (id) => (await NotesStore.getSession(id)).pageIds", sid)) == 3)
    # навигация
    ed.keyboard.press("PageUp")
    check("I: PageUp — предыдущая страница", ed_state(ed)["cur"] == 1)
    # новая страница из тренажёра появляется сама
    x, y, w, h = rect(tr, "#questionPanel")
    draw(tr, [(x + 450, y + 40), (x + 650, y + 70)])
    tr.click("#refreshBtn"); wait_chain(tr)
    ed.wait_for_function("() => window.__notesEditor.state().pages.length === 4", timeout=5000)
    check("I: страница из тренажёра появилась в открытом конспекте", ed_state(ed)["n"] == 4)
    # переименование
    ed.fill("#edTitle", "Урок с Ваней")
    ed.keyboard.press("Enter")
    ed.wait_for_timeout(300)
    check("I: сессия переименована", ed.evaluate("async (id) => (await NotesStore.getSession(id)).name", sid) == "Урок с Ваней")
    # PDF
    with ed.expect_download(timeout=30000) as dl:
        ed.click("#edPdf")
    d = dl.value
    path = "/tmp/test16_konspekt.pdf"
    d.save_as(path)
    data = open(path, "rb").read()
    npages = data.count(b"/Type /Page") - data.count(b"/Type /Pages")
    check("I: «Собрать PDF» — файл, по странице на страницу конспекта", data[:4] == b"%PDF" and npages == 4, f"страниц: {npages}")
    check("I: имя файла — по названию сессии", d.suggested_filename == "Урок с Ваней.pdf", d.suggested_filename)
    # перезагрузка: всё на месте
    ed.reload()
    ed.wait_for_function("() => window.__notesEditor && window.__notesEditor.state().pages.length === 4")
    check("I: после перезагрузки страницы и название на месте", ed.input_value("#edTitle") == "Урок с Ваней")
    return ed, tr, sid


def test_board(ctx, errors, ed, sid):
    print("J. Сохранить как доску")
    with ctx.expect_page() as pinfo:
        ed.click("#edBoard")
    bp = pinfo.value
    bp.on("pageerror", lambda e: errors.append("boards: " + str(e)))
    bp.route("https://**/*", lambda r: r.abort())
    bid = ed.evaluate("() => window.__lastBoardId")
    bp.wait_for_load_state()
    bp.evaluate("() => { const g = document.getElementById('authGate'); if (g) g.style.display = 'none'; window.boardsAppBoot(); }")
    bp.wait_for_function("id => window.getDB && window.getDB().boards.some(b => b.id === id)", arg=bid, timeout=10000)
    bp.wait_for_function("id => window.getCurrentBoard && window.getCurrentBoard() && window.getCurrentBoard().id === id", arg=bid, timeout=10000)
    b = bp.evaluate("""() => { const b = window.getCurrentBoard();
      const rows = new Set(b.objects.map(o => Math.floor(o.points[0].y / 1296)));
      return { name: b.name, n: b.objects.length, images: b.objects.filter(o => o.type === 'image').length,
               pens: b.objects.filter(o => o.type === 'pen').length, rows: [...rows].sort(), cols: [...new Set(b.objects.map(o => Math.floor(o.points[0].x / 1824)))] }; }""")
    check("J: доска с названием сессии открылась", b["name"] == "Урок с Ваней", b["name"])
    check("J: на доске картинки заданий и штрихи", b["images"] == 4 and b["pens"] >= 4, str(b))
    check("J: по листу на страницу, друг под другом", b["cols"] == [100] and len(b["rows"]) >= 3, str(b))
    bp.wait_for_timeout(800)
    on_disk = bp.evaluate("""(id) => new Promise(res => { const r = indexedDB.open('ogeBoardsDB'); r.onsuccess = () => {
        const g = r.result.transaction('state').objectStore('state').get('boarddata:' + id); g.onsuccess = () => res(g.result ? g.result.objects.length : 0); }; })""", bid)
    check("J: доска записана в хранилище досок", on_disk == b["n"])
    left = ed.evaluate("async () => (await NotesStore.takeOutbox()).length")
    check("J: в «ящике» конспекта доска не осталась", left == 0)
    bp.close()


def test_list(ctx, errors, sid):
    print("I. Список сессий")
    pg = new_page(ctx, errors)
    pg.goto(f"{BASE}/notes.html")
    pg.wait_for_selector(".sl-row")
    rows = pg.locator(".sl-row").count()
    check("I: в списке сессии с датой и числом страниц", rows >= 2 and "4 страницы" in pg.inner_text(f".sl-row[data-id='{sid}']"))
    pg.screenshot(path="/tmp/test16_list.png")
    pg.click(f".sl-row[data-id='{sid}'] [data-act='rename']")
    pg.fill(".sl-name-input", "Новое имя")
    pg.keyboard.press("Enter")
    pg.wait_for_timeout(300)
    check("I: переименование из списка", "Новое имя" in pg.inner_text(f".sl-row[data-id='{sid}']"))
    other = pg.evaluate("id => [...document.querySelectorAll('.sl-row')].map(r => r.dataset.id).find(x => x !== id)", sid)
    pg.click(f".sl-row[data-id='{other}'] [data-act='del']")
    pg.click(f".sl-row[data-id='{other}'] [data-act='del-yes']")
    pg.wait_for_timeout(400)
    gone = pg.evaluate("async id => !(await NotesStore.getSession(id)) && (await NotesStore.getPages(id)).length === 0", other)
    check("I: удаление сессии вместе со страницами", gone and pg.locator(f".sl-row[data-id='{other}']").count() == 0)
    pg.click(f".sl-row[data-id='{sid}'] .sl-main")
    pg.wait_for_function("() => window.__notesEditor && window.__notesEditor.state().pages.length === 4")
    check("I: «Открыть» ведёт в редактор сессии", "notes.html?s=" in pg.url)
    pg.close()


def run():
    errors = []
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1280, "height": 800}, accept_downloads=True)
        test_eraser(ctx, errors)
        test_oge6(ctx, errors)
        test_addition(ctx, errors)
        test_oge8(ctx, errors)
        test_ege(ctx, errors)
        test_shared(ctx, errors)
        sid = test_sessions(ctx, errors)
        ed, tr, sid = test_editor(ctx, errors, sid)
        test_board(ctx, errors, ed, sid)
        test_list(ctx, errors, sid)
        browser.close()
    check("ошибок JavaScript нет", not errors, "; ".join(errors[:4]))
    print()
    if failures:
        print("ПРОВАЛЫ:"); [print(" -", f) for f in failures]
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    run()
