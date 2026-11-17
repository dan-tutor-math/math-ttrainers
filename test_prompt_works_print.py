"""
Этап 9 конструктора: печать варианта (задания, бланк, ключ), баллы в
«Результатах», таймер работы.

Облако — заглушка из теста этапа 1 (test_prompt15_works_stage1.py). Работы
засеваются прямо в «базу» заглушки: тренажёры в кадре здесь не нужны.

Проверяет:
  P. печать работы из 2 вариантов: окно настроек; в разметке печати
     2 страницы заданий с шапкой «Название · Вариант N», полями «Фамилия, имя»
     и «Класс», номерами и картинками; бланк с клетками (у развёрнутого —
     «решение на отдельном листе»); ключ с ответами обоих вариантов и баллами
     из ExamSpec (ОГЭ №9 — 1, ОГЭ №20 — 2, вне экзамена — 1, без ответа — «—»);
     при печати видно только лист, на экране листа нет;
  R. «Результаты»: «баллов: a из b, без развёрнутых», счёт «X / Y» на месте,
     «после времени» — только у сданного позже лимита;
  T. таймер 1 мин: на старте сказано про время, отсчёт идёт, после
     перезагрузки продолжается от started_at, ответ из очереди уходит до
     сдачи, на нуле работа сдана (finish вызван один раз), заход после конца
     времени — сразу итог;
  N. работа без таймера — отсчёта нет; ключ ученика (correctText) — общий;
  E. нет ошибок JavaScript.

Запуск: python3 test_prompt_works_print.py
"""
import json
import sys
import time
from datetime import datetime, timedelta, timezone

import test_prompt15_works_stage1 as S1
from test_prompt15_works_stage1 import (
    BASE, TEACHER, local_server, sync_playwright, new_context, watch_errors, db,
    type_fields, press_check,
)

FAILS = []


def check(name, cond, extra=""):
    print(("[OK] " if cond else "[FAIL] ") + name + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        FAILS.append(name)


PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
W1, W2, W3 = "aaaaaaaa-0000-4000-8000-000000000001", "aaaaaaaa-0000-4000-8000-000000000002", "aaaaaaaa-0000-4000-8000-000000000003"


def iso(dt):
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def task(bid, tid, value, src=None, with_task=True):
    b = {"id": bid, "type": "task", "tid": tid, "mode": "exam", "name": tid,
         "img": {"light": {"url": PNG}, "dark": {"url": PNG}}, "css": {"w": 480, "h": 200}}
    if with_task:
        b["task"] = {"kind": "fields", "fields": [{"id": "a", "type": "num", "label": "Ответ:", "value": value}]}
    if src:
        b["src"] = src
    return b


def seed():
    now = datetime.now(timezone.utc)
    v1 = [task("t1", "oge9", "4"), task("t2", "oge20", None, with_task=False), task("t3", "percent", "15")]
    v2 = [task("u1", "oge9", "7", "t1"), task("u2", "oge20", None, "t2", with_task=False), task("u3", "percent", "25", "t3")]
    base = {"owner": TEACHER["id"], "closed": False, "created_at": iso(now), "updated_at": iso(now)}
    d = {
        "works": [
            dict(base, id=W1, title="Контрольная", kind="kr", settings={"feedback": "each", "attempts": 2, "timeLimit": 20}),
            dict(base, id=W2, title="На время", kind="sr", settings={"feedback": "each", "attempts": 2, "timeLimit": 1}),
            dict(base, id=W3, title="Без времени", kind="hw", settings={"feedback": "each", "attempts": 2}),
        ],
        "work_variants": [
            {"id": "v1", "work_id": W1, "num": 1, "code": "PRINTV0001", "blocks": v1},
            {"id": "v2", "work_id": W1, "num": 2, "code": "PRINTV0002", "blocks": v2},
            {"id": "v3", "work_id": W2, "num": 1, "code": "TIMER00001", "blocks": [task("x1", "oge9", "4"), task("x2", "percent", "15")]},
            {"id": "v4", "work_id": W3, "num": 1, "code": "NOTIME0001", "blocks": [task("y1", "oge9", "4")]},
        ],
        "work_attempts": [
            # сдал за 10 минут — в лимит 20
            {"id": "a1", "work_id": W1, "variant_id": "v1", "student_name": "Аня", "secret": "s1",
             "started_at": iso(now - timedelta(minutes=60)), "last_seen_at": iso(now), "finished_at": iso(now - timedelta(minutes=50)), "active_ms": 600000},
            # сдал через 40 минут — после времени
            {"id": "a2", "work_id": W1, "variant_id": "v2", "student_name": "Боря", "secret": "s2",
             "started_at": iso(now - timedelta(minutes=60)), "last_seen_at": iso(now), "finished_at": iso(now - timedelta(minutes=20)), "active_ms": 2400000},
        ],
        "work_answers": [
            {"attempt_id": "a1", "task_id": "t1", "status": "ok", "value": {"vals": {"a": "4"}}, "tries": 1, "hint_used": False, "solution_shown": False, "time_ms": 1000, "updated_at": iso(now)},
            {"attempt_id": "a1", "task_id": "t3", "status": "bad", "value": {"vals": {"a": "1"}}, "tries": 2, "hint_used": False, "solution_shown": False, "time_ms": 1000, "updated_at": iso(now)},
            {"attempt_id": "a2", "task_id": "u1", "status": "ok", "value": {"vals": {"a": "7"}}, "tries": 1, "hint_used": False, "solution_shown": False, "time_ms": 1000, "updated_at": iso(now)},
            {"attempt_id": "a2", "task_id": "u3", "status": "ok", "value": {"vals": {"a": "25"}}, "tries": 1, "hint_used": False, "solution_shown": False, "time_ms": 1000, "updated_at": iso(now)},
        ],
        "files": {},
    }
    S1.STATE["db"] = json.dumps(d)


def set_db(fn):
    d = db(); fn(d); S1.STATE["db"] = json.dumps(d)


# считает вызовы C.finish на странице ученика (works-cloud.js кладёт WorksCloud в window)
COUNT_FINISH = """
(() => {
  let wc;
  Object.defineProperty(window, 'WorksCloud', { configurable: true, get(){ return wc; }, set(v){
    const f = v.finish;
    v.finish = function(){ window.__finishN = (window.__finishN || 0) + 1; return f.apply(this, arguments); };
    wc = v;
  } });
})();
"""


def timer_left(page):
    """Секунды на таймере (из текста «⏱ m:ss»)."""
    t = page.inner_text("#wTimer").replace("⏱", "").strip()
    parts = [int(x) for x in t.split(":")]
    s = 0
    for x in parts:
        s = s * 60 + x
    return s


def run():
    errors = []
    seed()
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()

        # ═══ P. печать ═══
        print("\n— P. печать работы из 2 вариантов")
        tctx = new_context(browser, viewport={"width": 1440, "height": 950})
        tp = tctx.new_page()
        watch_errors(tp, errors, "works")
        tp.goto(f"{BASE}/works.html")
        tp.wait_for_selector("#scrAuth:not([hidden])")
        tp.fill("#auEmail", TEACHER["email"]); tp.fill("#auPass", TEACHER["password"]); tp.click("#auGo")
        tp.wait_for_selector("#scrList:not([hidden])")
        tp.evaluate(f"() => {{ location.hash = '#/edit/{W1}'; }}")
        tp.wait_for_selector("#scrEdit:not([hidden])")
        tp.wait_for_function("() => window.__works.E.variants.length === 2")
        tp.evaluate("() => { window.__printed = 0; window.print = () => { window.__printed++; }; }")
        check("P1 кнопка «Печать» рядом с «Сохранить»", tp.evaluate("() => document.getElementById('wkPrint').parentElement === document.getElementById('wkSave').parentElement"))
        tp.click("#wkPrint")
        tp.wait_for_selector("#wpDlg")
        check("P2 окно: «Задания», «Бланк ответов», «Ключ для учителя»", all(x in tp.inner_text("#wpDlg") for x in ["Задания", "Бланк ответов", "Ключ для учителя", "Скачать PDF", "Книжная", "Альбомная"]))
        tp.uncheck("#wpTasks"); tp.click("#wpGo")
        check("P3 ничего не отмечено — просьба отметить, печати нет", "Отметьте" in tp.inner_text("#wpNote") and tp.evaluate("() => window.__printed") == 0)
        tp.check("#wpTasks"); tp.check("#wpBlank"); tp.check("#wpKey"); tp.click("#wpGo")
        tp.wait_for_function("() => window.__printed === 1", timeout=8000)
        check("P4 окно закрылось, вызвана печать браузера", tp.locator("#wpDlg").count() == 0)
        pr = tp.evaluate("""() => {
          const R = document.getElementById('wpPrint');
          // раздел = первый лист с шапкой и следующие за ним без шапки (задания могут занять несколько листов)
          const group = cls => { const out = []; R.querySelectorAll('.wp-sheet.' + cls).forEach(s => {
            const h = s.querySelector('.wp-head');
            if (h) out.push({ head: h.innerText, who: (s.querySelector('.wp-who') || {}).innerText || '', sheets: [s] }); else out[out.length - 1].sheets.push(s); }); return out; };
          const tasks = group('wp-tasks').map(g => ({ head: g.head, who: g.who,
            nums: g.sheets.flatMap(s => [...s.querySelectorAll('.wp-n')].map(n => n.textContent)), imgs: g.sheets.reduce((a, s) => a + s.querySelectorAll('.wp-task img').length, 0) }));
          const blanks = group('wp-blank').map(g => ({ head: g.head,
            rows: g.sheets.flatMap(s => [...s.querySelectorAll('.wp-brow')].map(r => ({ n: r.querySelector('.n').textContent, cells: r.querySelectorAll('.wp-cells i').length, long: !!r.querySelector('.wp-long') }))) }));
          const keys = [...R.querySelectorAll('.wp-kt')].map(t => ({ cap: t.caption.textContent,
            rows: [...t.tBodies[0].rows].map(r => [...r.cells].map(c => c.textContent)), total: t.tFoot.rows[0].cells[2].textContent }));
          return { tasks, blanks, keys, pages: R.querySelectorAll('.wp-page').length, keyPages: R.querySelectorAll('.wp-key').length,
            foot: [...R.querySelectorAll('.wp-foot')].map(f => f.textContent) };
        }""")
        check("P5 две страницы заданий, шапка «Название · Вариант N»",
              len(pr["tasks"]) == 2 and pr["tasks"][0]["head"] == "Контрольная · Вариант 1" and pr["tasks"][1]["head"] == "Контрольная · Вариант 2", str([t["head"] for t in pr["tasks"]]))
        check("P6 поля «Фамилия, имя» и «Класс»", all("Фамилия, имя" in t["who"] and "Класс" in t["who"] for t in pr["tasks"]))
        check("P7 задания по порядку с номерами и картинками", all(t["nums"] == ["1", "2", "3"] and t["imgs"] == 3 for t in pr["tasks"]), str(pr["tasks"]))
        b0 = pr["blanks"][0]["rows"] if pr["blanks"] else []
        check("P8 бланк на каждый вариант, клетки для ответа", len(pr["blanks"]) == 2 and [r["n"] for r in b0] == ["1", "2", "3"] and b0[0]["cells"] > 5 and b0[2]["cells"] > 5, str(pr["blanks"]))
        check("P9 развёрнутое (ОГЭ №20) — «решение на отдельном листе»", b0 and b0[1]["long"] and b0[1]["cells"] == 0)
        k = pr["keys"]
        check("P10 ключ — оба варианта на одной странице", pr["keyPages"] == 1 and [x["cap"] for x in k] == ["Вариант 1", "Вариант 2"], str(k))
        check("P11 ответы варианта 1: 4, —, 15", k and [r[1] for r in k[0]["rows"]] == ["4", "—", "15"], str(k and k[0]["rows"]))
        check("P12 ответы варианта 2: 7, —, 25", len(k) > 1 and [r[1] for r in k[1]["rows"]] == ["7", "—", "25"], str(len(k) > 1 and k[1]["rows"]))
        check("P13 баллы из ExamSpec: ОГЭ №9 — 1, №20 — 2, вне экзамена — 1; всего 4",
              k and [r[2] for r in k[0]["rows"]] == ["1", "2", "1"] and k[0]["total"] == "4", str(k and k[0]))
        check("P14 листы пронумерованы «Страница i из N», ключ на одном листе", pr["pages"] >= 5 and len(pr["foot"]) >= 2 and pr["foot"][-1].split()[1] == pr["foot"][-1].split()[3], str(pr["foot"][-2:]))
        check("P15 на экране листа не видно", tp.evaluate("() => getComputedStyle(document.getElementById('wpPrint')).display") == "none")
        tp.emulate_media(media="print")
        vis = tp.evaluate("() => ({ sheet: getComputedStyle(document.getElementById('wpPrint')).display, app: getComputedStyle(document.querySelector('.wrap') || document.body.firstElementChild).display })")
        check("P16 при печати — только лист", vis["sheet"] == "block" and vis["app"] == "none", str(vis))
        tp.evaluate("() => window.dispatchEvent(new Event('afterprint'))")
        vis2 = tp.evaluate("() => getComputedStyle(document.getElementById('wpPrint')).display")
        check("P17 после печати Ctrl+P печатает страницу, а не старый лист", vis2 == "none", vis2)
        tp.emulate_media(media="screen")

        # ═══ R. результаты ═══
        print("\n— R. баллы и «после времени» в «Результатах»")
        tp.evaluate("() => { window.__works.E.dirty = false; }")
        tp.evaluate(f"() => {{ location.hash = '#/results/{W1}'; }}")
        tp.wait_for_selector("#scrResults:not([hidden])")
        rows = tp.evaluate("""() => [...document.querySelectorAll('#rsTable tbody tr')].map(r => ({
          nm: r.querySelector('td.nm').innerText, score: r.querySelector('td.score').innerText,
          pts: (r.querySelector('td.score .pts') || {}).textContent || '', hint: (r.querySelector('td.score .pts') || {}).title || '' }))""")
        by = {r["nm"].split("\n")[0]: r for r in rows}
        a, b = by.get("Аня", {}), by.get("Боря", {})
        check("R1 Аня: 1 из 2 баллов, без развёрнутых", a.get("pts") == "баллов: 1 из 2, без развёрнутых", str(a))
        check("R2 Боря: 2 из 2", b.get("pts") == "баллов: 2 из 2, без развёрнутых", str(b))
        check("R3 счёт «X / Y» на месте (конец ячейки)", a.get("score", "").endswith("1 / 3") and b.get("score", "").endswith("2 / 3"), str([a.get("score"), b.get("score")]))
        check("R4 подсказка: частичных нет, развёрнутые не в сумме", "частичных нет" in a.get("hint", "") or "развёрнутые" in a.get("hint", "").lower(), a.get("hint"))
        check("R5 «после времени» — у Бори, у Ани нет", "после времени" in b.get("nm", "") and "после времени" not in a.get("nm", ""), str([a.get("nm"), b.get("nm")]))
        tp.evaluate(f"() => {{ location.hash = '#/edit/{W1}'; }}")
        tp.wait_for_selector("#scrEdit:not([hidden])")
        check("R6 настройка «Время на работу»: 20 мин и подсказка про честный таймер",
              "active" in (tp.get_attribute('#wkTime button[data-m="20"]', "class") or "") and "сервер время не проверяет" in tp.inner_text("#timeHint"))
        tp.click('#wkTime button[data-m="0"]')
        check("R7 «выкл» убирает лимит", "timeLimit" not in tp.evaluate("() => window.__works.E.settings"))
        tp.fill("#wkTimeOwn", "35")
        check("R8 своё время — 35 минут", tp.evaluate("() => window.__works.E.settings.timeLimit") == 35)
        tp.evaluate("() => { window.__works.E.dirty = false; }")

        # ═══ T. таймер ═══
        print("\n— T. таймер 1 минута")
        sctx = new_context(browser, viewport={"width": 1000, "height": 900})
        sctx.add_init_script(COUNT_FINISH)
        sp = sctx.new_page()
        watch_errors(sp, errors, "work")
        sp.goto(f"{BASE}/work.html?c=TIMER00001")
        sp.wait_for_selector("#scrStart:not([hidden])")
        check("T1 на старте сказано про время", "Время на работу: 1 мин" in sp.inner_text("#startMeta"), sp.inner_text("#startMeta"))
        check("T2 до «Начать» отсчёта нет", sp.is_hidden("#wTimer"))
        sp.fill("#wName", "Таймер Тест"); sp.click("#wStart")
        sp.wait_for_selector("#scrTask:not([hidden])")
        sp.wait_for_selector("#wTimer:not([hidden])")
        l1 = timer_left(sp)
        check("T3 отсчёт показан, не больше минуты", 50 <= l1 <= 60, str(l1))
        check("T4 меньше 5 минут — предупреждение", "warn" in (sp.get_attribute("#wTimer", "class") or ""))
        sp.wait_for_timeout(2500)
        l2 = timer_left(sp)
        check("T5 отсчёт идёт", l2 < l1, f"{l1} → {l2}")
        sp.reload()
        sp.wait_for_selector("#scrTask:not([hidden])")
        sp.wait_for_selector("#wTimer:not([hidden])")
        l3 = timer_left(sp)
        check("T6 после перезагрузки — от started_at, не с начала", l3 <= l2, f"{l2} → {l3}")
        # ответ без связи — ляжет в очередь; к концу времени связь есть
        sp.evaluate("() => { window.__fakeNetDown = true; }")
        type_fields(sp, {"a": "4"}); press_check(sp)
        sp.wait_for_function("() => window.__work.queue.length > 0", timeout=5000)
        check("T7 ответ в очереди (нет связи)", sp.evaluate("() => window.__work.queue.length") > 0)
        # время почти вышло: начало захода — 58 секунд назад (в базе и на странице)
        att = db()["work_attempts"][-1]
        started = iso(datetime.now(timezone.utc) - timedelta(seconds=58))
        set_db(lambda d: [x.update(started_at=started) for x in d["work_attempts"] if x["id"] == att["id"]])
        sp.evaluate(f"() => {{ window.__work.S.att.startedAt = {json.dumps(started)}; window.__fakeNetDown = false; }}")
        sp.wait_for_selector("#scrDone:not([hidden])", timeout=15000)
        sp.wait_for_timeout(2500)
        check("T8 на нуле работа сдана — итог на экране", sp.is_visible("#scrDone") and sp.is_hidden("#wTimer"))
        check("T9 finish вызван один раз", sp.evaluate("() => window.__finishN") == 1, str(sp.evaluate("() => window.__finishN")))
        a_db = [x for x in db()["work_attempts"] if x["id"] == att["id"]][0]
        ans = [x for x in db()["work_answers"] if x["attempt_id"] == att["id"] and x["task_id"] == "x1"]
        check("T10 в базе заход завершён", a_db["finished_at"] is not None)
        check("T11 ответ из очереди ушёл до сдачи", len(ans) == 1 and ans[0]["status"] == "ok", str(ans))
        # заход, открытый после конца времени: не завершён, но время вышло
        sp.evaluate("() => { localStorage.clear(); }")
        sp.goto(f"{BASE}/work.html?c=TIMER00001")
        sp.wait_for_selector("#scrStart:not([hidden])")
        sp.fill("#wName", "Опоздавший"); sp.click("#wStart")
        sp.wait_for_selector("#scrTask:not([hidden])")
        att2 = db()["work_attempts"][-1]
        old = iso(datetime.now(timezone.utc) - timedelta(minutes=5))
        set_db(lambda d: [x.update(started_at=old) for x in d["work_attempts"] if x["id"] == att2["id"]])
        sp.reload()
        sp.wait_for_selector("#scrDone:not([hidden])", timeout=10000)
        check("T12 заход после конца времени — сразу итог", sp.is_visible("#scrDone") and sp.is_hidden("#scrTask"))
        check("T13 и он сдан в базе, finish один раз", [x for x in db()["work_attempts"] if x["id"] == att2["id"]][0]["finished_at"] is not None
              and sp.evaluate("() => window.__finishN") == 1)

        # ═══ N. без таймера ═══
        print("\n— N. работа без таймера")
        sp.goto(f"{BASE}/work.html?c=NOTIME0001")
        sp.wait_for_selector("#scrStart:not([hidden])")
        check("N1 на старте про время ничего", "Время на работу" not in sp.inner_text("#startMeta"))
        sp.fill("#wName", "Без таймера"); sp.click("#wStart")
        sp.wait_for_selector("#scrTask:not([hidden])")
        sp.wait_for_timeout(1500)
        check("N2 отсчёта нет", sp.is_hidden("#wTimer"))
        check("N3 верный ответ ученика — общий correctText", sp.evaluate("() => typeof WorkPrint.correctText === 'function' && WorkPrint.correctText({ kind: 'fields', fields: [{ id: 'a', label: 'x =', value: '3' }] })") == "x = 3")

        print("\n— E. ошибки JavaScript")
        check("E1 нет ошибок JavaScript", not errors, "\n".join(errors[:5]))
        browser.close()

    print()
    if FAILS:
        print("Не прошло: " + ", ".join(FAILS))
        sys.exit(1)
    print("Все проверки прошли")


if __name__ == "__main__":
    run()
