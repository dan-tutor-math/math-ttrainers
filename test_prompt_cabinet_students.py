"""
Вкладка «Ученики» кабинета таблицей (cabinet-students.js), как плашка
«Доход / расход» старого приложения расписания.

Заглушка и данные — из test_prompt_cabinet_stats.py («сегодня» — среда
18.11.2026): ставки Ваня 2 000, Петя 1 500 (в ставке «2 в неделю»),
активный шаблон — Ваня 2 раза, Петя 1. Группа дохода «уч. год» — все сами.

Проверяет:
  A. таблица: 2 ученика, «в месяц» Ваня 16 000 (2 по шаблону × 2 000 × 4),
     Петя 12 000, итог 28 000 ₽, кнопка «Добавить ученика», группа «уч. год»;
  B. имя, класс и экзамен правятся в ячейке и пишутся в students;
  C. цена: новая ставка с сегодняшнего дня, прошлая цела; «раз в неделю»
     переносится в новую строку ставки; «в месяц» и итог пересчитаны;
  D. «раз в неделю» и своя сумма «в месяц» пишутся в ставку на сегодня, своя
     подсвечена и идёт в итог; стёрли — считается само;
  E. → открывает карточку ученика;
  F. сортировки: «9 класс» по классу (сама), свой список, «Без сортировки»,
     итог по выбранной; пишутся в settings.studentCats; изменить, удалить;
  G. «Добавить ученика» в сортировке «9 класс» — новый сразу с классом 9;
  H. группа дохода из ячейки: снять — ученик в out группы;
  I. архив: ⇩ дважды — archived_at, в «Архиве», «Вернуть»;
  J. сортировка по столбцу «В месяц»;
  K. телефон 375: страница не листается вбок;
  L. нет ошибок JavaScript.

Запуск: ~/.venvs/trainers/bin/python test_prompt_cabinet_students.py
"""
import json
import sys

from playwright.sync_api import sync_playwright

import test_prompt_cabinet_stats as ST
from test_prompt_cabinet_payments import B1, FIXED_NOW_JS, OWNER, norm, wait_db
from test_prompt_b1_student_memory import BASE, PETYA, STATE, VANYA, check, db, local_server


def seed():
    d = ST.stats_seed()
    d["teacher_settings"][0]["settings"]["incomeGroups"] = [
        {"id": "g1", "name": "уч. год", "members": [], "out": [], "from": "2026-09-01", "to": "2027-05-31", "auto": True}]
    return d


def row(sid):
    return f'#csBody tr[data-sid="{sid}"]'


def cell(sid, f):
    return f'{row(sid)} [data-f="{f}"]'


def total(p):
    return norm(p.inner_text("#csTotal"))


def put(p, sel, val):
    p.fill(sel, val)
    p.press(sel, "Enter")


def settings():
    return next(s for s in db()["teacher_settings"] if s["owner"] == OWNER)["settings"]


def main():
    errors = []
    STATE["db"] = json.dumps(seed())
    STATE["offline"] = False
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = B1.new_context(browser, signed_in=True, bind="tab")
        ctx.add_init_script(FIXED_NOW_JS)
        p = ctx.new_page()
        B1.PUMP["page"] = p
        p.on("pageerror", lambda e: errors.append(str(e)))
        p.set_viewport_size({"width": 1280, "height": 900})

        # ── A ──
        p.goto(f"{BASE}/cabinet.html#/students")
        p.wait_for_selector(cell(PETYA, "monthly"), timeout=10000)
        check("A1 две строки, Ваня и Петя", p.locator("#csBody tr[data-sid]").count() == 2)
        check("A2 Ваня: цена 2000, в месяц 16 000 (по шаблону)",
              p.input_value(cell(VANYA, "price")) == "2000" and norm(p.get_attribute(cell(VANYA, "monthly"), "placeholder")) == "16 000",
              p.get_attribute(cell(VANYA, "monthly"), "placeholder"))
        check("A3 Петя: раз в неделю 2, в месяц 12 000",
              p.input_value(cell(PETYA, "per_week")) == "2" and norm(p.get_attribute(cell(PETYA, "monthly"), "placeholder")) == "12 000")
        check("A4 итог 28 000 ₽", total(p) == "28 000 ₽", total(p))
        check("A5 кнопка «Добавить ученика» и широкая страница",
              p.is_visible("#csAdd") and p.evaluate("() => document.querySelector('.wrap').classList.contains('cs-wide')"))
        check("A6 группа «уч. год» у обоих", all("уч. год" in p.inner_text(f"{row(s)} .cs-grp") for s in (VANYA, PETYA)))

        # ── B ──
        put(p, cell(PETYA, "name"), "Пётр")
        check("B1 имя в базе", wait_db(p, lambda d: next(s for s in d["students"] if s["id"] == PETYA)["name"] == "Пётр"))
        put(p, cell(VANYA, "grade"), "9")
        check("B2 класс в базе", wait_db(p, lambda d: next(s for s in d["students"] if s["id"] == VANYA)["grade"] == "9"))
        p.select_option(cell(PETYA, "exam"), "ege_prof")
        check("B3 экзамен в базе", wait_db(p, lambda d: next(s for s in d["students"] if s["id"] == PETYA)["exam"] == "ege_prof"))

        # ── C ──
        put(p, cell(VANYA, "price"), "2500")
        ok = wait_db(p, lambda d: any(r["student_id"] == VANYA and r["valid_from"] == "2026-11-18" and r["price"] == 2500 for r in d["student_rates"]))
        check("C1 новая ставка Вани с 18.11, прошлая 2 000 цела",
              ok and any(r["id"] == "r1" and r["price"] == 2000 for r in db()["student_rates"]))
        p.wait_for_function("() => /32\\s000/.test(document.querySelector('#csTotal').textContent)")
        check("C2 Ваня в месяц 20 000, итог 32 000 ₽",
              norm(p.get_attribute(cell(VANYA, "monthly"), "placeholder")) == "20 000" and total(p) == "32 000 ₽", total(p))
        put(p, cell(PETYA, "price"), "1800")
        ok = wait_db(p, lambda d: any(r["student_id"] == PETYA and r["valid_from"] == "2026-11-18" and r["price"] == 1800 and r.get("per_week") == 2 for r in d["student_rates"]))
        check("C3 новая ставка Пети — «2 в неделю» перенесено", ok, str([r for r in db()["student_rates"] if r["student_id"] == PETYA]))
        p.wait_for_function("() => /34\\s400/.test(document.querySelector('#csTotal').textContent)")
        check("C4 Петя 14 400, итог 34 400 ₽", norm(p.get_attribute(cell(PETYA, "monthly"), "placeholder")) == "14 400", total(p))

        # ── D ──
        put(p, cell(VANYA, "per_week"), "1")
        check("D1 «раз в неделю» = 1 в ставке на сегодня",
              wait_db(p, lambda d: any(r["student_id"] == VANYA and r["valid_from"] == "2026-11-18" and r.get("per_week") == 1 for r in d["student_rates"])))
        p.wait_for_function("() => /24\\s400/.test(document.querySelector('#csTotal').textContent)")
        check("D2 Ваня 10 000, итог 24 400", norm(p.get_attribute(cell(VANYA, "monthly"), "placeholder")) == "10 000", total(p))
        put(p, cell(PETYA, "monthly"), "13000")
        check("D3 своя сумма Пети в базе",
              wait_db(p, lambda d: any(r["student_id"] == PETYA and r["valid_from"] == "2026-11-18" and r.get("monthly") == 13000 for r in d["student_rates"])))
        p.wait_for_function("() => /23\\s000/.test(document.querySelector('#csTotal').textContent)")
        check("D4 своя подсвечена, итог 23 000", "manual" in p.get_attribute(cell(PETYA, "monthly"), "class"), total(p))
        put(p, cell(PETYA, "monthly"), "")
        check("D5 стёрли — снова само (monthly = null)",
              wait_db(p, lambda d: any(r["student_id"] == PETYA and r["valid_from"] == "2026-11-18" and r.get("monthly") is None for r in d["student_rates"])))
        p.wait_for_function("() => /24\\s400/.test(document.querySelector('#csTotal').textContent)")
        check("D6 итог снова 24 400", total(p) == "24 400 ₽", total(p))

        # ── E ──
        p.click(f"{row(VANYA)} .cs-open")
        p.wait_for_selector("#cSave", timeout=5000)
        check("E1 → открыл карточку Вани", p.input_value("#cName_in") == "Ваня" and p.input_value("#cGrade") == "9")
        p.click("a:has-text('← Ученики')")
        p.wait_for_selector(cell(VANYA, "price"))

        # ── F ──
        p.click("#csCatAdd")
        p.click('#csEKind button[data-k="grade"]')
        p.select_option("#csEV", "9")
        check("F1 название подставилось — «9 класс»", p.input_value("#csEName") == "9 класс", p.input_value("#csEName"))
        p.click("#csEOk")
        p.wait_for_function("() => document.querySelectorAll('#csBody tr[data-sid]').length === 1")
        cats = settings().get("studentCats") if wait_db(p, lambda d: settings().get("studentCats")) else []
        check("F2 сортировка в settings.studentCats", cats and cats[0]["kind"] == "grade" and cats[0]["v"] == "9", str(cats))
        check("F3 в «9 класс» только Ваня, итог 10 000",
              p.locator(row(VANYA)).count() == 1 and total(p) == "10 000 ₽" and "9 класс" in norm(p.text_content("#csTotalBox")), total(p))
        p.click("#csCatAdd")
        p.fill("#csEName", "Мои")
        p.check(f'#csEMem input[value="{PETYA}"]')
        p.click("#csEOk")
        p.wait_for_function(f"() => document.querySelectorAll('#csBody tr[data-sid]').length === 1 && document.querySelector('#csBody tr[data-sid=\"{PETYA}\"]')")
        check("F4 свой список «Мои» — Петя", wait_db(p, lambda d: any(c["name"] == "Мои" and c["members"] == [PETYA] for c in settings().get("studentCats", []))))
        none = norm(p.inner_text('#csCats [data-cat="_none"]'))
        check("F5 «Без сортировки 0»", none == "Без сортировки 0", none)
        p.click('#csCats [data-cat=""]')
        check("F6 «Все» — оба", p.locator("#csBody tr[data-sid]").count() == 2)
        # изменить: нажать выбранную сортировку ещё раз
        p.click('#csCats .cs-chip:has-text("Мои")')
        p.click('#csCats .cs-chip:has-text("Мои")')
        p.wait_for_selector("#csEDel")
        p.fill("#csEName", "Мои ученики")
        p.click("#csEOk")
        check("F7 переименована", wait_db(p, lambda d: any(c["name"] == "Мои ученики" for c in settings().get("studentCats", []))))
        p.click('#csCats .cs-chip:has-text("Мои ученики")')
        p.click("#csEDel")
        p.click("#csEDel")
        check("F8 удалена — осталась одна сортировка", wait_db(p, lambda d: len(settings().get("studentCats", [])) == 1))
        check("F9 ученики не тронуты", len([s for s in db()["students"] if s.get("owner") == OWNER]) == 2)

        # ── G ──
        p.click('#csCats .cs-chip:has-text("9 класс")')
        p.click("#csAdd")
        p.fill("#csNew", "Оля")
        p.press("#csNew", "Enter")
        ok = wait_db(p, lambda d: any(s.get("name") == "Оля" and s.get("grade") == "9" for s in d["students"]))
        olya = next((s["id"] for s in db()["students"] if s.get("name") == "Оля"), "")
        check("G1 Оля добавлена с классом 9 и видна в «9 класс»", ok and p.locator(row(olya)).count() == 1)
        check("G2 курсор — в цене новой строки", p.evaluate(f"() => document.activeElement === document.querySelector('{cell(olya, 'price')}')"))

        # ── H ──
        p.click('#csCats [data-cat=""]')
        p.click(f"{row(VANYA)} .cs-grp")
        p.wait_for_selector(".cs-menu")
        p.uncheck(".cs-menu input")
        check("H1 Ваня убран из «уч. год» (out)", wait_db(p, lambda d: VANYA in settings()["incomeGroups"][0]["out"]))
        p.keyboard.press("Escape")
        check("H2 в ячейке Вани — прочерк", p.inner_text(f"{row(VANYA)} .cs-grp").strip() == "—", p.inner_text(f"{row(VANYA)} .cs-grp"))

        # ── I ──
        p.click(f'{row(olya)} [data-act="arch"]')
        p.click(f'{row(olya)} [data-act="arch"]')
        check("I1 Оля в архиве", wait_db(p, lambda d: bool(next(s for s in d["students"] if s["id"] == olya).get("archived_at"))))
        p.wait_for_selector("#csArch")
        check("I2 строки нет, есть «Архив 1 ученик»", p.locator(row(olya)).count() == 0 and "1 ученик" in norm(p.inner_text("#csArch summary")))
        p.click("#csArch summary")
        p.click('#csArch [data-act="unarch"]')
        check("I3 вернули", wait_db(p, lambda d: next(s for s in d["students"] if s["id"] == olya).get("archived_at") is None))
        p.wait_for_selector(row(olya))

        # ── J ──
        p.click('.cs-sort[data-sort="month"]')
        order = p.eval_on_selector_all("#csBody tr[data-sid]", "els => els.map(e => e.dataset.sid)")
        check("J1 по «В месяц» — Петя (14 400) первым", order[0] == PETYA, str(order))
        p.click('.cs-sort[data-sort="name"]')

        # ── K ──
        ph = B1.new_context(browser, signed_in=True, bind="tab")
        ph.add_init_script(FIXED_NOW_JS)
        pp = ph.new_page()
        pp.on("pageerror", lambda e: errors.append("phone: " + str(e)))
        pp.set_viewport_size({"width": 375, "height": 800})
        B1.PUMP["page"] = pp
        pp.goto(f"{BASE}/cabinet.html#/students")
        pp.wait_for_selector(cell(PETYA, "price"), timeout=10000)
        check("K1 телефон 375: страница не листается вбок", pp.evaluate("() => document.documentElement.scrollWidth <= window.innerWidth"))
        check("K2 итог виден", pp.is_visible("#csTotal"))

        check("L1 нет ошибок JavaScript", not errors, "; ".join(errors))
        browser.close()
    fails = B1.FAILS
    print("\n" + ("готово" if not fails else f"ОШИБОК: {len(fails)}"))
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
