"""
Промпт №11 нового списка: «общий экран» в совместной сессии — ученик видит страницу учителя
целиком, в том же масштабе и положении (stage.html + session-share.js).

Проверяем:
  A. Ученик по ссылке ?s=КОД попадает на сцену stage.html; страница в кадре
     сверстана под окно учителя: ширина вёрстки, положение заголовка,
     рабочей зоны и плавающих кнопок совпадают с учительскими до пикселя, а
     кадр вписан в экран телефона ученика целиком.
  B. Заметка учителя на доске лежит в кадре ученика ровно на том же месте
     (пиксель холста), прокрутка учителя повторяется.
  C. Учитель меняет размер окна — сцена меняет размер следом.
  D. Стрелки между номерами: ЕГЭ база (номер меняется без перезагрузки) и
     ОГЭ (переход на соседнюю страницу) — ученик на сцене переходит следом,
     адрес сцены повторяет страницу группы.
  E. Перезагрузка сцены у ученика возвращает его туда же, размер приходит снова.
  F. «Обычного режима» нет (промпт №82): кнопки нет, прежний выбор не
     действует, в панели ученика — «Выйти из сессии».
  G. Код, введённый в панели в обычном окне, тоже ведёт на сцену.
  H. Учитель на сцену не уходит; карточка «+1» (кадр) сценой себя не считает.
  I. Увеличение сцены: прокрутка появляется, «следить за учителем» подводит
     к месту, где он пишет.

Живой realtime из песочницы недоступен — заглушка Supabase из теста №54
(BroadcastChannel + localStorage). На сайте совместный режим — руками.

Запуск: python3 test_prompt11_shared_screen.py
"""
import contextlib
import http.client
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

import test_prompt54_trainer_sync_and_cards as t54

PORT = 8996
BASE = f"http://127.0.0.1:{PORT}"
failures, errors = [], []
SHOTS = "/tmp/claude-0/s"


def check(name, ok, detail=""):
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok else f"  [{detail}]"))
    if not ok:
        failures.append(f"{name}: {detail}")


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                c = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                c.request("GET", "/index.html")
                c.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        yield
    finally:
        proc.terminate()
        proc.wait(timeout=5)


# Заглушка №54 держит «базу» в localStorage и «канал» в BroadcastChannel —
# оба работают только между вкладками ОДНОГО контекста браузера. Но тогда у
# учителя и ученика общий localStorage, а в нём лежат роль и код сессии
# (trainerSession:*) и переключатель сцены (tsStage:*) — как будто они сидят в одном
# браузере. Поэтому ключи платформы у каждого участника получают свою
# приставку: база и канал общие, а «браузеры» — разные, как в жизни
PARTICIPANT_STORAGE = r"""
(() => {
  const tag = %s;
  const P = Storage.prototype, g = P.getItem, st = P.setItem, rm = P.removeItem;
  const own = (store, key) => store === window.localStorage && /^(trainerSession|examNav|tsStage)/.test(String(key));
  P.getItem = function (key) { return g.call(this, own(this, key) ? tag + key : key); };
  P.setItem = function (key, v) { return st.call(this, own(this, key) ? tag + key : key, v); };
  P.removeItem = function (key) { return rm.call(this, own(this, key) ? tag + key : key); };
})();
"""


def participant(ctx, tag, width, height):
    page = t54.new_page(ctx, errors)
    page.add_init_script(PARTICIPANT_STORAGE % repr(tag + ":"))
    page.set_viewport_size({"width": width, "height": height})
    return page


def stage_frame(page):
    """кадр, который сейчас на экране сцены (во время смены страницы их два)"""
    try:
        h = page.evaluate_handle("() => window.__stageActiveFrame && window.__stageActiveFrame()")
        el = h.as_element()
        return el.content_frame() if el else None
    except Exception:
        return None


def wait_stage(page, timeout=15000):
    """ждём сцену: адрес stage.html, кадр загружен, размер учителя пришёл"""
    page.wait_for_url("**/stage.html?*", timeout=timeout)
    # кадр открывают, когда размер учителя пришёл, а документ под него
    # сверстан (при необходимости после одной перезагрузки кадра)
    page.wait_for_function("() => window.__stageScale && document.getElementById('bar').title.indexOf('×') > 0"
                           " && !window.__stageActiveFrame().classList.contains('waiting')",
                           timeout=timeout)
    f = stage_frame(page)
    f.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()", timeout=timeout)
    return f


def layout_sig(target):
    """положение ключевых блоков страницы в координатах её окна"""
    return target.evaluate("""() => {
        const r = (sel) => { const e = document.querySelector(sel);
            if (!e || e.offsetParent === null && getComputedStyle(e).position !== 'fixed') return null;
            const b = e.getBoundingClientRect();
            return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; };
        return { cw: document.documentElement.clientWidth, ih: innerHeight,
                 h1: r('.wrap h1'), sheet: r('#workZone') || r('.sheet') || r('.panel'),
                 share: r('.ts-share-btn'), board: r('#boardVisibilityToggle'),
                 next: r('#examNextBtn') };
    }""")


def board_on(page):
    page.click("#boardVisibilityToggle")
    page.wait_for_function("() => document.documentElement.getAttribute('data-board') === 'on'")
    page.wait_for_timeout(200)


def part_a_to_e(browser):
    ctx = browser.new_context()
    teacher = participant(ctx, "T", 1400, 860)
    teacher.goto(f"{BASE}/ege_base.html?n=1")
    code = t54.wait_code(teacher)
    teacher.wait_for_function("() => typeof openTask === 'function'")
    teacher.click("#protoList .mode-card")
    teacher.wait_for_timeout(400)

    student = participant(ctx, "S", 390, 844)
    student.goto(f"{BASE}/ege_base.html?n=1&s={code}")
    try:
        f = wait_stage(student)
    except Exception as e:
        check("A: ученик по ссылке попал на сцену", False, f"{student.url} {e}")
        return
    check("A: ученик по ссылке попал на сцену", "stage.html" in student.url and f is not None, student.url)
    check("A: в кадре та же страница с кодом", "ege_base.html" in f.url and f"s={code}" in f.url, f.url)
    check("A: учитель остался у себя", "stage.html" not in teacher.url and "s=" not in teacher.url, teacher.url)

    f.wait_for_function("() => window.__examNav && window.__examNav.pid() && S.screen === 'task'", timeout=8000)
    # задание в кадре дорисовывается после подключения — ждём, пока вёрстка
    # сойдётся, но не дольше нескольких секунд: не сошлась — это провал
    t_sig, s_sig = layout_sig(teacher), layout_sig(f)
    for _ in range(25):
        if t_sig == s_sig:
            break
        student.wait_for_timeout(200)
        t_sig, s_sig = layout_sig(teacher), layout_sig(f)
    check("A: ширина и высота вёрстки как у учителя", (t_sig["cw"], t_sig["ih"]) == (s_sig["cw"], s_sig["ih"]),
          f"{t_sig['cw']}x{t_sig['ih']} / {s_sig['cw']}x{s_sig['ih']}")
    for k in ("h1", "sheet", "share", "board", "next"):
        check(f"A: «{k}» на том же месте, что у учителя", t_sig[k] == s_sig[k] and t_sig[k] is not None,
              f"{t_sig[k]} / {s_sig[k]}")
    scale = student.evaluate("() => window.__stageScale")
    want = min(390 / t_sig["cw"], 844 / t_sig["ih"])
    check("A: экран учителя вписан в телефон целиком", abs(scale - want) < 1e-3, f"{scale} ≠ {want}")
    box = student.evaluate("""() => { const b = window.__stageActiveFrame().getBoundingClientRect();
        return [b.left, b.top, b.width, b.height]; }""")
    check("A: кадр не вылезает за экран", box[0] >= -0.5 and box[1] >= -0.5 and box[0] + box[2] <= 390.5
          and box[1] + box[3] <= 844.5, str(box))
    same_task = teacher.evaluate("() => [S.n, S.pid]") == f.evaluate("() => [S.n, S.pid]")
    check("A: у ученика то же задание", same_task)

    # ── B. заметка на доске и прокрутка ──
    board_on(teacher)
    qx, qy = t54_center(teacher, "#questionText")
    teacher.mouse.move(qx - 80, qy)
    teacher.mouse.down()
    for i in range(1, 11):
        teacher.mouse.move(qx - 80 + i * 16, qy)
    teacher.mouse.up()
    teacher.wait_for_timeout(700)
    ts = teacher.evaluate("() => window.__boardGetState().strokes.map(s => s.sid)")
    ss = f.evaluate("() => window.__boardGetState().strokes.map(s => s.sid)")
    check("B: штрих учителя дошёл до ученика", len(ts) > 0 and set(ts) <= set(ss), f"{ts} / {ss}")
    # тот же пиксель окна: у учителя и в кадре ученика под ним чернила
    probe = """([x, y]) => {
        const c = document.getElementById('boardCanvas'); const r = c.getBoundingClientRect();
        const k = c.width / r.width; const ctx = c.getContext('2d');
        let dark = 0;
        for (let dy = -2; dy <= 2; dy++) {
          const d = ctx.getImageData(Math.round((x - r.left) * k), Math.round((y + dy - r.top) * k), 1, 1).data;
          if (d[3] > 100 && d[0] + d[1] + d[2] < 200) dark++;
        }
        return dark; }"""
    pt = [qx, qy]
    check("B: чернила у учителя в этой точке", teacher.evaluate(probe, pt) > 0)
    check("B: у ученика чернила в той же точке кадра", f.evaluate(probe, pt) > 0)
    off = [qx, qy + 40]
    check("B: и нет чернил там, где учитель не писал", f.evaluate(probe, off) == 0)

    teacher.screenshot(path=f"{SHOTS}/stage_teacher.png")
    student.screenshot(path=f"{SHOTS}/stage_student_phone.png")
    # задание короткое и в окно 1400×860 влезает целиком — для прокрутки
    # учитель делает окно ниже (заодно это ещё одна смена размера сцены)
    teacher.set_viewport_size({"width": 1400, "height": 420})
    f.wait_for_function("() => innerHeight === 420", timeout=5000)
    room = teacher.evaluate("() => document.documentElement.scrollHeight - innerHeight")
    target = min(200, room)
    teacher.evaluate(f"() => scrollTo(0, {target})")
    try:
        f.wait_for_function(f"() => Math.abs(scrollY - {target}) < 3", timeout=5000)
        ok = target > 40
    except Exception:
        ok = False
    check("B: прокрутка учителя повторяется в кадре", ok,
          f"цель {target}, у ученика {f.evaluate('() => scrollY')}")
    check("B: после прокрутки вёрстка по-прежнему совпадает",
          layout_sig(teacher)["sheet"] == layout_sig(f)["sheet"], f"{layout_sig(teacher)['sheet']} / {layout_sig(f)['sheet']}")
    teacher.evaluate("() => scrollTo(0, 0)")

    # ── C. учитель меняет окно ──
    teacher.set_viewport_size({"width": 1180, "height": 760})
    try:
        f.wait_for_function("() => document.documentElement.clientWidth === 1180 && innerHeight === 760", timeout=5000)
        ok = True
    except Exception:
        ok = False
    check("C: сцена поменяла размер вслед за окном учителя", ok,
          str(f.evaluate("() => [document.documentElement.clientWidth, innerHeight]")))
    scale = student.evaluate("() => window.__stageScale")
    check("C: масштаб пересчитан", abs(scale - min(390 / 1180, 844 / 760)) < 1e-3, str(scale))
    check("C: вёрстка снова совпадает", layout_sig(teacher)["sheet"] == layout_sig(f)["sheet"],
          f"{layout_sig(teacher)['sheet']} / {layout_sig(f)['sheet']}")

    # ── D. стрелки между номерами ──
    teacher.click("#examNextBtn")
    teacher.wait_for_function("() => S.n === 2")
    try:
        f.wait_for_function("() => S.n === 2", timeout=6000)
        ok = True
    except Exception:
        ok = False
    check("D: ЕГЭ база — стрелка переключила номер и у ученика", ok, str(f.evaluate("() => S.n")))
    same = teacher.evaluate("() => [S.n, S.pid, S.screen]") == f.evaluate("() => [S.n, S.pid, S.screen]")
    check("D: ЕГЭ база — тот же прототип и экран", same,
          f"{teacher.evaluate('() => [S.n, S.pid, S.screen]')} / {f.evaluate('() => [S.n, S.pid, S.screen]')}")

    # на ОГЭ через переход страницы: учитель уходит на №19, стрелкой назад — №15–18
    teacher.evaluate("() => window.TrainerSession.navigateTo('oge19.html')")
    teacher.wait_for_url("**/oge19.html", timeout=8000)
    t54.wait_code(teacher)
    try:
        student.wait_for_function("() => { try { return window.__stageActiveFrame().contentWindow.location.pathname.endsWith('/oge19.html'); } catch (e) { return false; } }", timeout=10000)
        ok = True
    except Exception:
        ok = False
    check("D: переход учителя на другой тренажёр — кадр ученика следом", ok, stage_frame(student).url)
    check("D: ученик остался на сцене", "stage.html" in student.url and "to=oge19.html" in student.url, student.url)
    teacher.wait_for_selector("#examPrevBtn")
    teacher.wait_for_timeout(300)
    teacher.click("#examPrevBtn")
    teacher.wait_for_url("**/oge15_18.html", timeout=8000)
    try:
        student.wait_for_function("() => { try { return window.__stageActiveFrame().contentWindow.location.pathname.endsWith('/oge15_18.html'); } catch (e) { return false; } }", timeout=10000)
        ok = True
    except Exception:
        ok = False
    check("D: ОГЭ — стрелка ◀ увела ученика на №15–18", ok, stage_frame(student).url)
    f = stage_frame(student)
    f.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()", timeout=8000)
    t54.wait_code(teacher)
    teacher.wait_for_timeout(800)
    try:
        f.wait_for_function("() => document.documentElement.clientWidth === 1180", timeout=6000)
        ok = True
    except Exception:
        ok = False
    check("D: на новой странице кадр снова размером с окно учителя", ok,
          str(f.evaluate("() => document.documentElement.clientWidth")))
    check("D: стрелки видны и у ученика — заголовок как у учителя",
          layout_sig(teacher)["h1"] == layout_sig(f)["h1"], f"{layout_sig(teacher)['h1']} / {layout_sig(f)['h1']}")

    # ── E. перезагрузка сцены ──
    student.reload()
    try:
        f = wait_stage(student)
        ok = f.url.split("?")[0].endswith("/oge15_18.html")
    except Exception as e:
        ok, f = False, None
    check("E: после перезагрузки сцена там же, где группа", ok, stage_frame(student).url if stage_frame(student) else student.url)
    if f:
        check("E: и размер учителя пришёл снова",
              f.evaluate("() => document.documentElement.clientWidth") == 1180)

    # ── I. увеличение и «следить за учителем» ──
    student.click("#zoomIn")
    student.click("#zoomIn")
    student.wait_for_timeout(300)
    z = student.evaluate("() => [window.__stageScale, getComputedStyle(document.getElementById('vp')).overflow]")
    check("I: увеличение сцены включает её прокрутку", z[1] == "auto", str(z))
    student.evaluate("() => document.getElementById('vp').scrollTo(0, 0)")
    student.wait_for_timeout(100)
    # учитель пишет внизу справа — сцена ученика должна туда подъехать
    board_on(teacher)
    bx, by = 1180 - 260, 760 - 190
    teacher.mouse.move(bx, by)
    teacher.mouse.down()
    for i in range(1, 12):
        teacher.mouse.move(bx + i * 10, by + (i % 3))
        teacher.wait_for_timeout(40)
    teacher.mouse.up()
    teacher.wait_for_timeout(1200)
    sc = student.evaluate("() => { const v = document.getElementById('vp'); return [v.scrollLeft, v.scrollTop]; }")
    check("I: сцена подъехала к месту, где пишет учитель", sc[0] > 20 or sc[1] > 20, str(sc))
    student.click("#zoomLabel")
    student.wait_for_timeout(200)
    check("I: «100%» возвращает весь экран учителя",
          student.evaluate("() => getComputedStyle(document.getElementById('vp')).overflow") == "hidden")

    # ── F. «Обычного режима» больше нет (промпт №82) ──
    # кнопки на сцене нет, а прежний выбор «off» не уводит со сцены
    check("F: на сцене нет кнопки «Обычный режим»", student.locator("#exitBtn").count() == 0)
    student.evaluate("() => localStorage.setItem('tsStage:pref', 'off')")
    student.reload()
    f = wait_stage(student)
    check("F: прежний выбор «обычного режима» не действует — ученик на сцене", f is not None, student.url)
    if f:
        f.click(".ts-share-btn")
        f.wait_for_timeout(200)
        check("F: в панели ученика на сцене нет «Обычного режима»", f.locator("#tsStageToggle").count() == 0)
        lv = f.locator("#tsLeave")
        check("F: в панели ученика — «Выйти из сессии»", lv.is_visible() and "Выйти" in lv.inner_text())

    # учительская панель кнопки выхода не показывает
    teacher.click(".ts-share-btn")
    check("H: у учителя кнопки «Выйти из сессии» нет", not teacher.locator("#tsLeave").is_visible())
    ctx.close()
    return code


def t54_center(page, sel):
    el = page.locator(sel).first
    el.scroll_into_view_if_needed()
    b = el.bounding_box()
    return b["x"] + b["width"] / 2, b["y"] + b["height"] / 2


def part_g_h(browser):
    ctx = browser.new_context()
    teacher = participant(ctx, "T2", 1280, 800)
    teacher.goto(f"{BASE}/oge6.html")
    code = t54.wait_code(teacher)

    # ── G. код набран в панели обычного окна ──
    student = participant(ctx, "S2", 1024, 700)
    student.goto(f"{BASE}/addition.html")
    t54.wait_code(student)
    student.click(".ts-share-btn")
    student.fill("#tsJoinInput", code)
    student.click("#tsJoin")
    try:
        f = wait_stage(student)
        ok = f.url.split("?")[0].endswith("/oge6.html")
    except Exception:
        ok = False
    check("G: код из панели ведёт на сцену, на страницу учителя", ok, student.url)

    # ── H. карточка «+1» у учителя сценой себя не считает ──
    teacher.click("#modesGrid .mode-card:not(.random):not(.demo)")
    teacher.wait_for_timeout(300)
    card = t54.add_one_card(teacher)
    check("H: карточка «+1» открылась", card is not None)
    if card:
        check("H: карточка — не сцена", card.evaluate(
            "() => !(window.TrainerSession.isStageFrame && window.TrainerSession.isStageFrame())") is True)
    check("H: учитель сам на сцену не ушёл", "stage.html" not in teacher.url, teacher.url)

    # ── код устарел (урок кончился) — со сцены на обычную страницу ──
    # (новый ученик: у этого браузера ещё нет роли и кода живой сессии)
    late = participant(ctx, "S3", 800, 600)
    late.goto(f"{BASE}/oge6.html?s=ZZZZ2222")
    try:
        late.wait_for_url(lambda u: "stage.html" not in u and "oge6.html" in u and "s=" not in u, timeout=15000)
        t54.wait_code(late)
        ok = late.evaluate("() => window.TrainerSession.isLeader()")
    except Exception:
        ok = False
    check("H: несуществующий код — ученик на обычной странице, без сцены", ok, late.url)

    # ── сцена без кода — понятное сообщение, а не пустой экран ──
    student.goto(f"{BASE}/stage.html")
    student.wait_for_timeout(300)
    check("H: сцена без кода объясняет, что делать", "Нет кода" in student.inner_text("#status"))
    # чужой адрес в ?to= не открывается в кадре
    student.goto(f"{BASE}/stage.html?s={code}&to=https://example.com/x.html")
    student.wait_for_timeout(300)
    src = student.evaluate("() => window.__stageActiveFrame().src")
    check("H: чужой адрес в ?to= не открывается", src.startswith(BASE + "/index.html"), src)
    ctx.close()


def run():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        print("A–F, I. Сцена: вёрстка, доска, прокрутка, размер, стрелки, перезагрузка, увеличение, обычный режим")
        part_a_to_e(browser)
        print("G, H. Код из панели, карточки, защита адреса")
        part_g_h(browser)
        browser.close()
    real_errors = [e for e in errors if "fonts.g" not in e]
    if real_errors:
        failures.append("ошибки JS на странице: " + " | ".join(real_errors[:5]))
    print()
    if failures:
        print("ПРОВАЛЫ:")
        for f in failures:
            print(" -", f)
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    run()
