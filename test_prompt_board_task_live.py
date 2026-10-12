"""
Задания на общей доске: всё, что делает один, сразу видно у другого.

Живой случай: на облачной доске «Совместная работа» ученик вписывает ответ в
задание с тренажёра и жмёт «Проверить» — у учителя ни набранного, ни итога.
И наоборот. Причины: набранное до «Проверить» жило только в черновике на
своём экране (taskDrafts), а итог проверки и раскрытый разбор ехали вместе со
всей картинкой задания — заглушкой и через базу; запись ученика в
учительский объект база могла и не пустить.

Теперь состояние задания едет отдельным лёгким сообщением task_live.
Проверяем (учитель T — владелец, ученик S — «Только свои записи»):
  1. Ученик печатает — у учителя поле заполняется по символу.
  2. Неверная проверка ученика — у учителя красным; исправление ученика —
     у учителя новое значение и красное снято; верная — зелёным, поле
     закрыто. И в обратную сторону: учитель печатает и проверяет — у ученика.
  3. «Показать решение и ответ» — раскрывается и скрывается у обоих.
  4. Выбор варианта (choice) и отметки утверждений (multi) до и после
     «Проверить» — у собеседника.
  5. ↺ «решать заново» — сбрасывается у собеседника.
  6. Сообщение лёгкое: без картинки задания, меньше 2 КБ; набор — пачками,
     а не по сообщению на каждое событие.
  7. Запись ученика база не пустила — учитель (полный доступ) записывает
     итог сам; записала — учитель базу второй раз не трогает.
  8. Чужая доска в сообщении и своё же эхо не применяются.

Живой realtime из песочницы недоступен — заглушка supabase-js из
test_prompt53_cloud_stale_versions.py, сообщения между страницами
переносит сам тест. Совместный режим перепроверяется на сайте руками.
"""
import sys

from playwright.sync_api import sync_playwright

from test_prompt53_cloud_stale_versions import FAKE_LIB, PNG, local_server  # noqa: F401
from test_prompt_cloud_wheel_resize import open_board

# картинка тяжелее предела рассылки — как настоящий снимок задания
HEAVY_SRC = PNG + ("A" * 40000)


def fields_task(oid, y, answer="5"):
    return {"id": oid, "type": "image", "src": HEAVY_SRC, "points": [{"x": 100, "y": y}], "w": 400, "h": 200,
            "natW": 1, "natH": 1, "rv": 1, "rvBy": "T", "by": "T", "locked": True,
            "task": {"v": 1, "kind": "fields", "fields": [{"id": "a", "label": "", "type": "num", "value": answer}],
                     "hot": {"w": 400, "h": 200, "fields": [{"x": .1, "y": .6, "w": .3, "h": .2}],
                             "check": {"x": .5, "y": .6, "w": .3, "h": .2}, "checkText": "Проверить"}},
            "sol": {"src": PNG, "hot": {"x": .1, "y": .85, "w": .5, "h": .12}, "css": {"w": 400, "h": 200}, "open": False}}


def opts_task(oid, y, kind):
    t = {"v": 1, "kind": kind, "fields": [],
         "hot": {"w": 400, "h": 200, "opts": [{"x": .05, "y": .1 + i * .2, "w": .9, "h": .15} for i in range(4)],
                 "check": {"x": .6, "y": .85, "w": .3, "h": .12} if kind == "multi" else None}}
    if kind == "choice":
        t["correct"] = 2
    else:
        t["correct"] = [0, 2]
    return {"id": oid, "type": "image", "src": HEAVY_SRC, "points": [{"x": 100, "y": y}], "w": 400, "h": 200,
            "natW": 1, "natH": 1, "rv": 1, "rvBy": "T", "by": "T", "locked": True, "task": t}


OBJS = [fields_task("f1", 100), opts_task("c1", 360, "choice"), opts_task("m1", 620, "multi")]


class Relay:
    """Переносит рассылку одной страницы в другую (канал) и строки базы."""
    def __init__(self, a, b):
        self.pages = {"a": a, "b": b}
        self.pos = {"a": 0, "b": 0}

    def flush(self, frm):
        to = "b" if frm == "a" else "a"
        src, dst = self.pages[frm], self.pages[to]
        msgs = src.evaluate("() => window.__fake.sent")
        new = msgs[self.pos[frm]:]
        self.pos[frm] = len(msgs)
        rows = src.evaluate("() => Array.from(window.__fake.rows.entries())")
        dst.evaluate("(rows) => rows.forEach(([k, v]) => window.__fake.rows.set(k, v))", rows)
        for m in new:
            dst.evaluate("(m) => window.__fake.emit(m.event, m.payload)", m)
        return new


def focus(page, oid):
    page.evaluate(f"""() => {{ const o = getCurrentBoard().objects.find(x => x.id === '{oid}');
        setZoom(1, o.points[0].x + o.w / 2, o.points[0].y + o.h / 2, cssW / 2, cssH / 2); }}""")
    page.wait_for_timeout(150)


def inp(page, oid):
    return page.evaluate(f"""() => {{ const i = document.querySelector('.bd-task[data-id="{oid}"] .bd-task-in');
        return i ? {{ v: i.value, good: i.classList.contains('good'), bad: i.classList.contains('bad'), ro: i.readOnly }} : null; }}""")


def opt_classes(page, oid):
    return page.evaluate(f"""() => Array.from(document.querySelectorAll('.bd-task[data-id="{oid}"] .bd-task-opt'))
        .map(b => ['picked', 'good', 'bad'].filter(c => b.classList.contains(c)).join('+'))""")


def task_lives(page, start=0):
    return [m for m in page.evaluate("() => window.__fake.sent")[start:] if m["event"] == "task_live"]


def run():
    failures = []

    def check(name, cond, extra=""):
        print(f"[{'OK' if cond else 'FAIL'}] {name}" + (f" — {extra}" if extra and not cond else ""))
        if not cond:
            failures.append(name)

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        T = open_board(browser, "T", OBJS)
        S = open_board(browser, "S", OBJS)
        S.evaluate("() => window.setBoardAccess('own', 'S')")
        errors = []
        for pg in (T, S):
            pg.on("pageerror", lambda e: errors.append(str(e)))
        r = Relay(S, T)   # a = ученик, b = учитель
        for pg in (T, S):
            focus(pg, "f1")

        # ── 1. набор по символу ──
        start = len(S.evaluate("() => window.__fake.sent"))
        S.click('.bd-task[data-id="f1"] .bd-task-in')
        seen = []
        for ch in "12":
            S.keyboard.type(ch)
            S.wait_for_timeout(140)
            r.flush("a")
            T.wait_for_timeout(50)
            seen.append(inp(T, "f1")["v"])
        check("1. у учителя поле заполняется по символу", seen == ["1", "12"], str(seen))
        lives = task_lives(S, start)
        check("6. сообщение без картинки и меньше 2 КБ",
              all("src" not in str(m["payload"]) and len(str(m["payload"])) < 2000 for m in lives))
        # быстрый набор — пачкой
        n0 = len(task_lives(S))
        S.keyboard.type("3456", delay=5)
        S.wait_for_timeout(200)
        n1 = len(task_lives(S))
        check("6. быстрый набор — не сообщение на каждый символ", 1 <= n1 - n0 < 4, str(n1 - n0))
        r.flush("a")
        T.wait_for_timeout(50)
        check("6. после пачки у учителя последнее значение", inp(T, "f1")["v"] == "123456", str(inp(T, "f1")))

        # ── 2. неверная проверка, исправление, верная ──
        S.click('.bd-task[data-id="f1"] .bd-task-btn')
        S.wait_for_timeout(100)
        r.flush("a")
        T.wait_for_timeout(80)
        st = inp(T, "f1")
        check("2. неверный ответ ученика у учителя — красным", st["bad"] and st["v"] == "123456", str(st))
        check("2. итог лёг в объект у учителя",
              T.evaluate("() => getCurrentBoard().objects.find(o => o.id === 'f1').task.st.res") == "bad")
        S.click('.bd-task[data-id="f1"] .bd-task-in')
        S.keyboard.press("ControlOrMeta+a")
        S.keyboard.type("5")
        S.wait_for_timeout(150)
        r.flush("a")
        T.wait_for_timeout(50)
        st = inp(T, "f1")
        check("2. исправление ученика у учителя — новое значение, красное снято", st["v"] == "5" and not st["bad"], str(st))
        S.keyboard.press("Enter")
        S.wait_for_timeout(100)
        r.flush("a")
        T.wait_for_timeout(80)
        st = inp(T, "f1")
        check("2. верный ответ ученика у учителя — зелёным, поле закрыто", st["good"] and st["ro"] and st["v"] == "5", str(st))

        # ── 5. ↺ учителем — у ученика сброшено ──
        T.click('.bd-task[data-id="f1"] .bd-task-reset')
        T.wait_for_timeout(100)
        r.flush("b")
        S.wait_for_timeout(80)
        st = inp(S, "f1")
        check("5. ↺ учителя — у ученика поле пустое и открыто", st["v"] == "" and not st["good"] and not st["ro"], str(st))
        check("5. ↺ — итога нет и в объекте ученика",
              S.evaluate("() => !getCurrentBoard().objects.find(o => o.id === 'f1').task.st"))

        # ── 2б. в обратную сторону: учитель печатает и проверяет ──
        T.click('.bd-task[data-id="f1"] .bd-task-in')
        T.keyboard.type("7")
        T.wait_for_timeout(150)
        r.flush("b")
        S.wait_for_timeout(50)
        check("2. учитель печатает — у ученика по символу", inp(S, "f1")["v"] == "7", str(inp(S, "f1")))
        T.click('.bd-task[data-id="f1"] .bd-task-btn')
        T.wait_for_timeout(100)
        r.flush("b")
        S.wait_for_timeout(80)
        st = inp(S, "f1")
        check("2. проверка учителя — у ученика красным", st["bad"] and st["v"] == "7", str(st))

        # ── 3. решение и ответ ──
        T.click('.bd-task[data-id="f1"] .bd-task-solbtn')
        T.wait_for_timeout(100)
        r.flush("b")
        S.wait_for_timeout(80)
        check("3. учитель открыл разбор — у ученика открыт",
              S.evaluate("() => document.querySelector('.bd-task[data-id=\"f1\"] .bd-task-sol').classList.contains('open')"))
        S.click('.bd-task[data-id="f1"] .bd-task-solbtn')
        S.wait_for_timeout(100)
        r.flush("a")
        T.wait_for_timeout(80)
        check("3. ученик скрыл — у учителя скрыт",
              not T.evaluate("() => document.querySelector('.bd-task[data-id=\"f1\"] .bd-task-sol').classList.contains('open')"))

        # ── 4. варианты ──
        for pg in (T, S):
            focus(pg, "c1")
        S.click('.bd-task[data-id="c1"] .bd-task-opt[data-i="1"]')
        S.wait_for_timeout(100)
        r.flush("a")
        T.wait_for_timeout(80)
        check("4. ученик выбрал неверный вариант — у учителя красным", opt_classes(T, "c1")[1] == "bad", str(opt_classes(T, "c1")))
        S.click('.bd-task[data-id="c1"] .bd-task-opt[data-i="2"]')
        S.wait_for_timeout(100)
        r.flush("a")
        T.wait_for_timeout(80)
        check("4. верный — у учителя зелёным", opt_classes(T, "c1")[2] == "good", str(opt_classes(T, "c1")))

        for pg in (T, S):
            focus(pg, "m1")
        S.click('.bd-task[data-id="m1"] .bd-task-opt[data-i="0"]')
        S.click('.bd-task[data-id="m1"] .bd-task-opt[data-i="3"]')
        S.wait_for_timeout(100)
        r.flush("a")
        T.wait_for_timeout(80)
        check("4. отметки утверждений до «Проверить» — у учителя", opt_classes(T, "m1") == ["picked", "", "", "picked"],
              str(opt_classes(T, "m1")))
        S.click('.bd-task[data-id="m1"] .bd-task-btn')
        S.wait_for_timeout(100)
        r.flush("a")
        T.wait_for_timeout(80)
        check("4. после «Проверить» — у учителя отмеченное зря красным", opt_classes(T, "m1")[3] == "picked+bad",
              str(opt_classes(T, "m1")))

        # ── 8. чужая доска и своё эхо ──
        S.evaluate("""() => window.__fake.emit('task_live', { id: 'f1', b: 'другая', uid: 'T', vals: { a: '999' }, st: null })""")
        S.evaluate("""() => window.__fake.emit('task_live', { id: 'f1', b: 'cb1', uid: 'S', vals: { a: '888' }, st: null })""")
        for pg in (T, S):
            focus(pg, "f1")
        check("8. чужая доска и своё эхо не применяются", inp(S, "f1")["v"] == "7", str(inp(S, "f1")))

        # ── 7. страховка записи ──
        # 7а. запись ученика прошла: учитель базу второй раз не пишет
        S.evaluate("() => window.__cloudDiffTest.writesIdle()")
        r.flush("a")
        T.wait_for_timeout(200)
        ups0 = T.evaluate("() => window.__fake.log.filter(x => x[0] === 'upsert').length")
        T.wait_for_timeout(4600)
        ups1 = T.evaluate("() => window.__fake.log.filter(x => x[0] === 'upsert').length")
        check("7. запись ученика дошла — учитель базу не трогает", ups1 == ups0, f"{ups0} → {ups1}")

        # 7б. базу ученику не пустили
        S.evaluate("""() => { const of = window.SB.from.bind(window.SB);
            window.SB.from = (t) => { const b = of(t);
              b.upsert = () => ({ then: (res, rej) => Promise.resolve({ data: null, error: { message: 'rls' } }).then(res, rej) });
              return b; }; }""")
        T.click('.bd-task[data-id="f1"] .bd-task-reset')
        T.wait_for_timeout(100)
        r.flush("b")
        T.evaluate("() => window.__cloudDiffTest.writesIdle()")
        S.wait_for_timeout(100)
        S.click('.bd-task[data-id="f1"] .bd-task-in')
        S.keyboard.type("5")
        S.keyboard.press("Enter")
        S.wait_for_timeout(500)
        S.evaluate("() => window.__cloudDiffTest.writesIdle()")
        r.flush("a")
        check("7. живой итог у учителя и без записи в базу",
              T.evaluate("() => (getCurrentBoard().objects.find(o => o.id === 'f1').task.st || {}).res") == "ok")
        db_before = T.evaluate("() => (window.__fake.rows.get('f1').task.st || {}).res || null")
        T.wait_for_timeout(4800)
        T.evaluate("() => window.__cloudDiffTest.writesIdle()")
        db_after = T.evaluate("() => (window.__fake.rows.get('f1').task.st || {}).res || null")
        check("7. запись ученика не прошла — учитель записал итог сам", db_before != "ok" and db_after == "ok",
              f"{db_before} → {db_after}")

        check("нет ошибок JavaScript", not errors, "; ".join(errors[:3]))
        browser.close()

    print()
    if failures:
        print(f"Провалено: {len(failures)}")
        sys.exit(1)
    print("Все проверки пройдены")


if __name__ == "__main__":
    run()
