"""
Кабинет, задача Б6: «Память заданий» в карточке ученика (cabinet-log.js).

Supabase — заглушка из test_prompt_b1_student_memory.py (общая «база» —
JSON у теста). Сессия идёт с ДРУГИМ учеником (Петя), карточка открыта у Вани:
журнал карточки грузится для Вани, а не для сессии.

Проверяет:
  A. события ФИПИ с датами («в ДЗ 10.01», «решали 19.01, верно») и
     сгенерированные по видам со счётчиком и датой последнего раза;
  B. фильтр «решено неверно» — остаются только задания с неверным
     последним решением;
  C. «Забыть выбранные»: отмена ничего не трогает, подтверждение удаляет
     только отмеченные строки (на сервере и в копии браузера);
  D. «Забыть вид» — вид и его вложенные ключи, соседний вид цел;
  E. «Забыть номер» — все виды страницы; строки Пети и чужие не тронуты;
     сессия с Петей осталась;
  F. нет ошибок JavaScript.

Запуск: python3 test_prompt_b6_student_log.py (сервер поднимается сам).
"""
import json
import sys

from playwright.sync_api import sync_playwright

import test_prompt_b1_student_memory as B1
from test_prompt_b1_student_memory import (BASE, PETYA, STATE, TEACHER, VANYA, check, db, fresh_db,
                                           local_server, new_context)


def seed():
    d = fresh_db()
    mk = lambda i, sid, k, e, at: {"id": i, "owner": TEACHER["id"], "student_id": sid, "task_key": k, "event": e,
                                   "source": "trainer", "src_ref": "x", "at": at}
    d["student_task_log"] += [
        mk("m1", VANYA, "fipi:oge:2933FB", "ok", "2026-02-01T10:00:00Z"),
        mk("m2", VANYA, "fipi:oge:2933FB", "bad", "2026-03-01T10:00:00Z"),
        mk("m3", VANYA, "gen:oge6:p1", "bad", "2026-03-05T10:00:00Z"),
        mk("m4", PETYA, "fipi:oge:5", "ok", "2026-03-06T10:00:00Z"),
        mk("m5", PETYA, "gen:oge9:3", "ok", "2026-03-06T11:00:00Z"),
    ]
    return d


def keys_of(sid):
    return sorted({r["task_key"] for r in db()["student_task_log"] if r["student_id"] == sid})


def main():
    errors = []
    STATE["db"] = json.dumps(seed())
    STATE["offline"] = False
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = new_context(browser, signed_in=True, bind="tab")
        p = ctx.new_page()
        p.on("pageerror", lambda e: errors.append(str(e)))
        p.goto(f"{BASE}/cabinet.html")
        p.wait_for_function("() => !!window.StudentMemory", timeout=10000)
        # сессия — с Петей
        p.evaluate("([id, name]) => StudentMemory.start({id, name})", [PETYA, "Петя"])
        p.goto(f"{BASE}/cabinet.html#/students/{VANYA}")
        p.wait_for_selector(".mrow", timeout=10000)

        row = lambda k: p.locator('.mrow[data-key="%s"]' % k)
        txt = lambda k: row(k).inner_text()

        # A
        t5 = txt("fipi:oge:5")
        check("A1 ФИПИ: в ДЗ 10.01 и решали 19.01, верно", "в ДЗ 10.01" in t5 and "решали 19.01, верно" in t5 and "решали 21.02, верно" in t5, t5)
        check("A2 события по порядку дат", t5.index("10.01") < t5.index("19.01") < t5.index("21.02"), t5)
        check("A3 группа экзамена", "ОГЭ, математика" in p.inner_text("#memBox"))
        t3 = txt("gen:oge9:3")
        check("A4 вид со счётчиком и датой последнего раза", "верно 1" in t3 and "неверно 1" in t3 and "последний раз 02.02" in t3, t3)
        check("A5 журнал Вани, а не Пети (сессия с Петей)", row("fipi:oge:5").count() == 1 and "Петя" not in p.inner_text("#memBox")
              and p.evaluate("() => StudentMemory.current().name") == "Петя")

        # B
        p.check("#mBad")
        shown = p.eval_on_selector_all(".mrow", "els => els.map(e => e.dataset.key).sort()")
        check("B1 фильтр: только неверные", shown == ["fipi:oge:2933FB", "gen:oge6:p1"], str(shown))
        p.uncheck("#mBad")
        check("B2 фильтр снят — всё на месте", p.locator(".mrow").count() == 5)

        # C
        p.check('[data-sel="fipi:oge:5"]')
        p.check('[data-sel="gen:oge6:p1"]')
        check("C1 «Забыть выбранные» со счётчиком", "(2)" in p.inner_text("#mForgetSel"))
        p.click("#mForgetSel")
        check("C2 подтверждение показано", p.locator(".mconf").count() == 1)
        p.click('[data-act="no"]')
        check("C3 отмена ничего не удалила", "fipi:oge:5" in keys_of(VANYA) and "gen:oge6:p1" in keys_of(VANYA))
        p.click("#mForgetSel")
        p.click('[data-act="yes"]')
        p.wait_for_function("() => !document.querySelector('.mrow[data-key=\"fipi:oge:5\"]')", timeout=8000)
        ks = keys_of(VANYA)
        check("C4 на сервере удалены ровно отмеченные", "fipi:oge:5" not in ks and "gen:oge6:p1" not in ks
              and "fipi:oge:2933FB" in ks and "gen:oge9:3" in ks and "gen:oge9:4" in ks, str(ks))
        mem = p.evaluate("(id) => StudentMemory.keys({studentId: id})", VANYA)
        check("C5 копия в браузере обновлена", "fipi:oge:5" not in mem and "gen:oge6:p1" not in mem and "fipi:oge:2933FB" in mem, str(mem))
        check("C6 у Пети строки целы", keys_of(PETYA) == ["fipi:oge:5", "gen:oge9:3"], str(keys_of(PETYA)))

        # D
        p.click('[data-forget="gen:oge9:3"]')
        p.click('[data-act="yes"]')
        p.wait_for_function("() => !document.querySelector('.mrow[data-key=\"gen:oge9:3\"]')", timeout=8000)
        ks = keys_of(VANYA)
        check("D1 вид и вложенный ключ удалены, соседний вид цел", "gen:oge9:3" not in ks and "gen:oge9:3:x" not in ks and "gen:oge9:4" in ks, str(ks))

        # E
        p.click('[data-forget="gen:oge9"]')
        p.click('[data-act="yes"]')
        p.wait_for_function("() => !document.querySelector('.mrow[data-key=\"gen:oge9:4\"]')", timeout=8000)
        ks = keys_of(VANYA)
        check("E1 номер забыт целиком, ФИПИ цел", ks == ["fipi:oge:2933FB"], str(ks))
        check("E2 у Пети по-прежнему всё", keys_of(PETYA) == ["fipi:oge:5", "gen:oge9:3"])
        check("E3 чужие строки не тронуты", len([r for r in db()["student_task_log"] if r["student_id"] == "st-other"]) == 0
              and len(db()["students"]) == 3)
        check("E4 сессия с Петей осталась", p.evaluate("() => StudentMemory.current().name") == "Петя")

        check("F нет ошибок JavaScript", not errors, "; ".join(errors))
        browser.close()
    print("\nИТОГ:", "всё зелёное" if not B1.FAILS else "есть падения: " + ", ".join(B1.FAILS))
    sys.exit(1 if B1.FAILS else 0)


if __name__ == "__main__":
    main()
