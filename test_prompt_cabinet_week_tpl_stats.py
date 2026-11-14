"""
Сводки расписания и шаблона (сверка 14.11 со старым приложением,
old-app-gap.md, пункты 4 и 6; schedule-insights.js, сетка шаблона в
schedule.js/schedule-tpl.js).

Данные — stats_seed() из test_prompt_cabinet_stats.py («сегодня» — среда
18.11.2026). Неделя 16–22.11: 16 — Петя «пробное» (проведено, бесплатно),
17 — пара Ваня + Петя (проведено), 18 и 20 — Ваня (запланировано).
Активный шаблон «Осень»: Ваня — вт и чт 9:00, Петя — ср 10:00. У Пети в
ставке «2 раза в неделю», у Вани норма не вписана.

Проверяет:
  A. «Кто в этой неделе»: Ваня 3/2 (норма — из шаблона, сверх нормы),
     Петя 2/2; итог «4 из 4 занятий · всё на месте»; щелчок — подсветка
     ученика в строках и всплывашка «за месяц» (Ваня: 5 занятий, 1
     отмена/перенос — не в счёт, ссылка на карточку); двойной щелчок
     вписывает Петю в выбранную строку 18.11 (пишется в базу, формат —
     пара), повтор — «уже в этой строке»;
  B. «Статистика недели»: 4 часа, доход недели 7 000 ₽ (проведённое и
     запланированное), 1 750 ₽ за час; окно «Статистика по ученикам»:
     Ваня 3 занятия, 6 000 ₽; Петя 2, 1 000 ₽;
  C. итог месяца над неделей: ноябрь 13 000 ₽ · 8 занятий · 7 часов ·
     впереди 2 000 ₽; ✓ у 18.11 сразу меняет итог; «Пересчитать месяц»
     снимает ручной итог 05.11 (строка day_totals удалена);
  D. «−2 000 ₽» за прогул у 12.11 (неделя 09–15.11);
  E. шаблон: «Кто уже в шаблоне» — Ваня ×2 (нормы нет), Петя 1/2; итог
     «1 из 2 занятий · не хватает 1 · 5 500 ₽ в неделю · 22 000 ₽ в месяц»;
     «Статистика шаблона»: 3 часа, 1 833 ₽ за час, 22 000 ₽ в месяц;
     двойной щелчок вписывает Петю в слот вторника;
  F. шаблон в виде «Неделя»: сетка с семью днями без дат, плашки слотов
     без значков статуса; перетаскивание плашки на другой день и час
     меняет weekday и start_min слота; щелчок по пустому — новый слот и
     его карточка;
  G. телефон 375 px: блоки без прокрутки вбок; нет ошибок JavaScript;
  P. телефон 393 px (тёмная тема, касание): вкладки кабинета — одной
     строкой без прокрутки, «Занятия / Шаблоны недели / Пары и группы» —
     одной строкой, ‹ › «Сегодня» — в одном ряду, «Шаблон недели» и
     «Очистить неделю» — в одном ряду одинаковой ширины, имена в строках
     не обрезаются; у шаблона кнопки не вылезают за ячейки;
  H. «Статистика» (на чистых данных): средний чек 1 857 ₽ (13 000 на 7
     оплаченных участий), рабочих дней 6 — по 2 167 ₽ в день; у группы
     дохода «Учебный год» — 28 000 ₽ в месяц и прогноз ≈ 251 100 ₽ за
     период; щелчок по Ване в «По ученикам» — окно ученика: 4 занятия,
     1 пропуск, доход 8 000 ₽, оплачено 10 000 ₽, календарь отметок
     (03.11 — проведено, 12.11 — пропуск, 18.11 — запланировано); то же
     окно — кнопкой статистики в таблице учеников.

Запуск: python3 test_prompt_cabinet_week_tpl_stats.py (сервер поднимается сам).
"""
import json
import sys

from playwright.sync_api import sync_playwright

from test_prompt_cabinet_payments import B1, FIXED_NOW_JS, norm, wait_db
from test_prompt_cabinet_stats import stats_seed
from test_prompt_b1_student_memory import BASE, PETYA, STATE, VANYA, check, db, local_server


def txt(p, sel):
    return norm(p.inner_text(sel))


def main():
    errors = []
    STATE["db"] = json.dumps(stats_seed())
    STATE["offline"] = False
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = B1.new_context(browser, signed_in=True, bind="tab")
        ctx.add_init_script(FIXED_NOW_JS)
        # вид «Строки» по умолчанию — так проще щёлкать по строкам
        ctx.add_init_script("try{localStorage.setItem('cabinet:schedule:view','list')}catch(e){}")
        p = ctx.new_page()
        B1.PUMP["page"] = p
        p.on("pageerror", lambda e: errors.append(str(e)))
        p.set_viewport_size({"width": 1280, "height": 900})

        p.goto(f"{BASE}/cabinet.html#/schedule/2026-11-18")
        p.wait_for_selector("#scWho", timeout=10000)
        if p.locator(".sc-views button[data-v='list'].on").count() == 0:
            p.click(".sc-views button[data-v='list']")
        p.wait_for_selector(".sc-days")

        # ── A. «Кто в этой неделе» ──
        p.click("#scWho summary")
        v = txt(p, f"#scWho [data-who='{VANYA}']")
        pe = txt(p, f"#scWho [data-who='{PETYA}']")
        check("A1 Ваня 3/2 — сверх нормы (норма из шаблона)", "3/2" in v and "over" in p.get_attribute(f"#scWho [data-who='{VANYA}']", "class"), v)
        check("A2 Петя 2/2 — всё на месте", "2/2" in pe and "full" in p.get_attribute(f"#scWho [data-who='{PETYA}']", "class"), pe)
        check("A3 итог «4 из 4 занятий · всё на месте»", txt(p, "#scWhoSum") == "4 из 4 занятий · всё на месте", txt(p, "#scWhoSum"))
        p.click(f"#scWho [data-who='{VANYA}']")
        p.wait_for_selector(".si-pop #siPopN", timeout=5000)
        check("A4 подсветка Вани в строках недели", p.locator(f".rw-p.hl[data-sid='{VANYA}']").count() == 3, str(p.locator(f".rw-p.hl[data-sid='{VANYA}']").count()))
        # ноябрь у Вани: 03, 05, 10, 17 проведено + 07.10 не в счёт; 12 — прогул
        check("A5 всплывашка: 4 занятия в ноябре", txt(p, "#siPopN") == "4" and "в ноябре" in txt(p, ".si-pop"), txt(p, ".si-pop"))
        check("A6 1 отмена/перенос — не в счёт, ссылка на карточку", "1 отмена/перенос — не в счёт" in txt(p, ".si-pop") and
              p.get_attribute(".si-pop a", "href") == f"#/students/{VANYA}", txt(p, ".si-pop"))
        p.keyboard.press("Escape")
        # двойной щелчок: вписать Петю в строку 18.11
        p.click(".rw-row[data-id='L18'] .rw-time", position={"x": 2, "y": 2})
        if p.locator(".rw-in").count():
            p.keyboard.press("Escape")
        check("A7 строка 18.11 отмечена как «куда вписывать»", p.locator(".rw-row[data-id='L18'].picked").count() == 1)
        p.dblclick(f"#scWho [data-who='{PETYA}']")
        ok = wait_db(p, lambda d: any(x["lesson_id"] == "L18" and x["student_id"] == PETYA for x in d["lesson_students"]))
        L18 = next(l for l in db()["lessons"] if l["id"] == "L18")
        check("A8 Петя вписан в 18.11, формат — пара", ok and L18["format"] == "pair", str(L18))
        p.wait_for_function("() => /3\\/2/.test(document.querySelector('[data-who=\"%s\"]').innerText)" % PETYA)
        check("A9 Петя теперь 3/2", "3/2" in txt(p, f"#scWho [data-who='{PETYA}']"))
        p.dblclick(f"#scWho [data-who='{PETYA}']")
        p.wait_for_function("() => /уже в этой строке/.test(document.getElementById('toast').textContent)", timeout=4000)
        check("A10 повтор — «уже в этой строке»", True)

        # ── B. «Статистика недели» ── (Петя в 18.11 добавлен — планом +1 000? он по групповой цене)
        p.click("#scWeekStats summary")
        hrs, hour = txt(p, "#scWkHours"), txt(p, "#scWkHour")
        # 18.11 теперь пара: Ваня 2 000 + Петя 1 000 → неделя 8 000 за 4 часа
        check("B1 часов в неделю 4", "Часов в неделю 4" in hrs, hrs)
        check("B2 доход недели 8 000 ₽, 2 000 ₽ за час", "8 000 ₽" in hour and "2 000 ₽" in hour, hour)
        p.click("#scWeekStu")
        p.wait_for_selector("#siWeekTab")
        rv = txt(p, f"#siWeekTab tr[data-sid='{VANYA}']")
        rp = txt(p, f"#siWeekTab tr[data-sid='{PETYA}']")
        check("B3 Ваня: 3 занятия, 6 000 ₽", rv.endswith("3 — 6 000 ₽"), rv)
        check("B4 Петя: 3 занятия, 2 000 ₽", rp.endswith("3 — 2 000 ₽"), rp)
        p.click(".sc-ed-foot [data-close]")

        # ── C. итог месяца ──
        p.wait_for_function("() => document.querySelector('#scMonthSum')")
        check("C1 ноябрь 13 000 ₽", txt(p, "#scMonthSum") == "13 000 ₽", txt(p, "#scMonth"))
        sub = txt(p, "#scMonthSub")
        check("C2 8 занятий · 7 часов · впереди 2 000 ₽", "8 занятий" in sub and "7 часов" in sub and "впереди 2 000 ₽" in sub, sub)
        # ✓ у Вани 18.11 — итог месяца растёт сразу
        p.click(f".rw-row[data-id='L18'] .rw-p[data-sid='{VANYA}'] [data-pst]")
        p.wait_for_function("() => /15\\s000/.test(document.querySelector('#scMonthSum').innerText)", timeout=5000)
        check("C3 ✓ 18.11 → 15 000 ₽", True)
        p.click("#scRecalc")
        p.click(".sc-ask-btns .btn.danger")
        ok = wait_db(p, lambda d: not d.get("day_totals"))
        check("C4 «Пересчитать месяц» удалил ручной итог 05.11", ok, str(db().get("day_totals")))
        p.wait_for_function("() => /14\\s000/.test(document.querySelector('#scMonthSum').innerText)", timeout=5000)
        check("C5 итог без ручного — 14 000 ₽", True)

        # ── D. «−N» за прогул ──
        p.click("#scPrev")
        p.wait_for_selector(".sc-day[data-day='2026-11-12'] .sc-dlost")
        check("D1 12.11 — −2 000 ₽ за прогул", txt(p, ".sc-day[data-day='2026-11-12'] .sc-dlost") == "−2 000 ₽")

        # ── E. шаблон ──
        p.click(".sc-modes button[data-mode='tpl']")
        p.wait_for_selector("#tplWho")
        p.click("#tplWho summary")
        tv, tp = txt(p, f"#tplWho [data-who='{VANYA}']"), txt(p, f"#tplWho [data-who='{PETYA}']")
        check("E1 Ваня ×2 (нормы нет), Петя 1/2", "×2" in tv and "1/2" in tp, tv + " | " + tp)
        check("E2 итог шаблона с деньгами", txt(p, "#tplWhoSum") == "1 из 2 занятий · не хватает 1 · 5 500 ₽ в неделю · 22 000 ₽ в месяц", txt(p, "#tplWhoSum"))
        p.click("#tplStats summary")
        check("E3 статистика шаблона: 3 часа, 1 833 ₽ за час, 22 000 ₽", "3" in txt(p, "#tplHours") and "1 833 ₽" in txt(p, "#tplHour") and "22 000 ₽" in txt(p, "#tplMonth"),
              txt(p, "#tplStats"))
        p.click(".sc-tpldays .rw-row[data-id='s1'] .rw-time", position={"x": 2, "y": 2})
        if p.locator(".rw-in").count():
            p.keyboard.press("Escape")
        p.dblclick(f"#tplWho [data-who='{PETYA}']")
        ok = wait_db(p, lambda d: any(x["slot_id"] == "s1" and x["student_id"] == PETYA for x in d["template_slot_students"]))
        check("E4 Петя вписан в слот вторника", ok)

        # ── F. шаблон в виде «Неделя» ──
        p.click("#tplViews button[data-v='grid']")
        p.wait_for_selector(".sc-tplgrid .sc-grid")
        heads = p.eval_on_selector_all(".sc-tplgrid .sc-gday b", "els => els.map(e => e.innerText)")
        check("F1 семь дней Пн…Вс без дат", heads == ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"], str(heads))
        check("F2 плашки слотов без значков статуса", p.locator(".sc-tplgrid .sc-plate").count() == 3 and p.locator(".sc-tplgrid .sc-plate .rw-ic").count() == 0)
        # перетащить слот Пети (ср 10:00) на пятницу 12:00
        pl = p.locator(".sc-tplgrid .sc-plate[data-id='s3']").bounding_box()
        fri = p.locator(".sc-tplgrid .sc-col[data-day='5']").bounding_box()
        hh = p.evaluate("() => { const g = document.querySelector('.sc-tplgrid .sc-col'); return parseFloat(getComputedStyle(g).backgroundSize.split(' ')[1]); }")
        x0, y0 = pl["x"] + pl["width"] / 2, pl["y"] + 12
        p.mouse.move(x0, y0)
        p.mouse.down()
        p.mouse.move(x0 + 20, y0 + 10, steps=3)
        p.mouse.move(fri["x"] + fri["width"] / 2, y0 + 2 * hh, steps=8)
        p.mouse.up()
        ok = wait_db(p, lambda d: next(s for s in d["template_slots"] if s["id"] == "s3")["weekday"] == 5)
        s3 = next(s for s in db()["template_slots"] if s["id"] == "s3")
        check("F3 слот переехал на пятницу 12:00", ok and s3["start_min"] == 720, str(s3))
        # щелчок по пустому месту субботы — новый слот и карточка
        sat = p.locator(".sc-tplgrid .sc-col[data-day='6']").bounding_box()
        p.mouse.click(sat["x"] + sat["width"] / 2, sat["y"] + 2 * hh + 5)
        p.wait_for_selector("#slDay", timeout=5000)
        ok = wait_db(p, lambda d: any(s["weekday"] == 6 for s in d["template_slots"]))
        check("F4 новый слот в субботу и его карточка", ok)
        p.click("#slDone")
        p.screenshot(path="/tmp/tpl_grid.png", full_page=True)

        # ── G. телефон ──
        p.set_viewport_size({"width": 375, "height": 800})
        p.click("#tplViews button[data-v='list']")
        p.wait_for_selector(".sc-tpldays")
        w = p.evaluate("() => document.documentElement.scrollWidth")
        check("G1 шаблон на телефоне без прокрутки вбок", w <= 376, str(w))
        p.click(".sc-modes button[data-mode='week']")
        p.wait_for_selector("#scWho")
        p.screenshot(path="/tmp/week_phone.png", full_page=True)
        w = p.evaluate("() => document.documentElement.scrollWidth")
        check("G2 неделя на телефоне без прокрутки вбок", w <= 376, str(w))
        check("G3 нет ошибок JavaScript", not errors, str(errors))
        ctx.close()

        # ── H. «Статистика» на чистых данных ──
        d = stats_seed()
        d["teacher_settings"][0]["settings"]["incomeGroups"] = [{"id": "g1", "name": "Учебный год", "from": "2026-09-01", "to": "2027-05-31",
                                                                 "auto": True, "out": [], "members": [], "show": True}]
        STATE["db"] = json.dumps(d)
        ctx = B1.new_context(browser, signed_in=True, bind="tab")
        ctx.add_init_script(FIXED_NOW_JS)
        p = ctx.new_page()
        B1.PUMP["page"] = p
        p.on("pageerror", lambda e: errors.append(str(e)))
        p.set_viewport_size({"width": 1280, "height": 900})
        p.goto(f"{BASE}/cabinet.html#/stats")
        p.wait_for_selector("#stCheck", timeout=10000)
        check("H1 средний чек 1 857 ₽ за занятие", "1 857 ₽" in txt(p, "#stCheck") and "за занятие" in txt(p, "#stCheck"), txt(p, "#stCheck"))
        check("H2 рабочих дней 6 — по 2 167 ₽ в день", "Рабочих дней 6" in txt(p, "#stDays") and "по 2 167 ₽ в день" in txt(p, "#stDays"), txt(p, "#stDays"))
        p.click("#stGroups summary")
        fc = txt(p, ".st-gbox[data-gid='g1'] [data-gfc]")
        exp = round(28000 * 273 / 30.4375 / 100) * 100
        check("H3 группа: 28 000 ₽ в месяц, ≈ %s ₽ за период" % exp, fc.startswith("28 000 ₽ в месяц") and ("≈ " + f"{exp:,}".replace(",", " ") + " ₽ за период") in fc, fc)
        p.click(f"#stStudents .st-bar[data-k='{VANYA}']")
        p.wait_for_selector("#cstCal")
        check("H4 окно ученика: Ваня, ноябрь", txt(p, "#cstName") == "Ваня" and txt(p, "#cstLabel") == "ноябрь 2026", txt(p, "#cstLabel"))
        check("H5 4 занятия, 1 пропуск", "Занятий 4" in txt(p, "#cstLessons") and "Пропуски и переносы 1" in txt(p, "#cstOff"), txt(p, "#cstLessons") + " | " + txt(p, "#cstOff"))
        check("H6 доход 8 000 ₽, оплачено 10 000 ₽, потеряно 2 000 ₽", "8 000 ₽" in txt(p, "#cstInc") and "10 000 ₽" in txt(p, "#cstGot") and "2 000 ₽" in txt(p, "#cstLost"),
              txt(p, "#cstInc") + " | " + txt(p, "#cstGot"))
        cls = lambda day: p.get_attribute(f"#cstCal .cst-d[data-day='{day}']", "class")
        check("H7 календарь: 03.11 проведено, 12.11 пропуск, 18.11 план", "st-done" in cls("2026-11-03") and "st-skip" in cls("2026-11-12") and "st-plan" in cls("2026-11-18"),
              cls("2026-11-03") + " " + cls("2026-11-12") + " " + cls("2026-11-18"))
        p.click("#cstPrev")
        p.wait_for_function("() => document.querySelector('#cstLabel').innerText === 'октябрь 2026'")
        check("H8 ‹ — октябрь: 1 занятие", "Занятий 1" in txt(p, "#cstLessons"), txt(p, "#cstLessons"))
        p.keyboard.press("Escape")
        p.goto(f"{BASE}/cabinet.html#/students")
        p.wait_for_selector(f"tr[data-sid='{PETYA}'] [data-act='stats']", timeout=10000)
        p.click(f"tr[data-sid='{PETYA}'] [data-act='stats']")
        p.wait_for_selector("#cstCal")
        check("H9 кнопка в таблице учеников открывает окно Пети", txt(p, "#cstName") == "Петя" and "Занятий 4" in txt(p, "#cstLessons"), txt(p, "#cstLessons"))
        p.screenshot(path="/tmp/student_stats.png", full_page=False)
        check("H10 нет ошибок JavaScript", not errors, str(errors))
        ctx.close()

        # ── P. телефон ──
        # касание и плотность экрана телефона: кнопки дня видны без наведения
        _nc = browser.new_context
        browser.new_context = lambda **kw: _nc(**dict(kw, is_mobile=True, has_touch=True, device_scale_factor=2.75))
        mctx = B1.new_context(browser, signed_in=True, bind="tab")
        mctx.add_init_script(FIXED_NOW_JS)
        mctx.add_init_script("try{localStorage.setItem('theme','dark');localStorage.setItem('cabinet:schedule:view','list')}catch(e){}")
        p = mctx.new_page()
        B1.PUMP["page"] = p
        p.on("pageerror", lambda e: errors.append(str(e)))
        p.set_viewport_size({"width": 393, "height": 852})
        p.goto(f"{BASE}/cabinet.html#/schedule/2026-11-18")
        p.wait_for_selector(".sc-days", timeout=10000)
        tops = lambda sel: p.eval_on_selector_all(sel, "els => els.map(e => Math.round(e.getBoundingClientRect().top))")
        fits = lambda sel: p.eval_on_selector_all(sel, "els => els.every(e => e.scrollWidth <= e.clientWidth + 1)")
        check("P1 вкладки кабинета — одной строкой, без прокрутки", len(set(tops("#tabs a"))) == 1 and fits("#tabs"), str(tops("#tabs a")))
        check("P2 разделы расписания — одной строкой", len(set(tops(".sc-modes button"))) == 1, str(tops(".sc-modes button")))
        check("P3 ‹ › и «Сегодня» в одном ряду", len({abs(a - b) < 12 for a, b in [(tops("#scPrev")[0], tops("#scNext")[0]), (tops("#scNext")[0], tops("#scToday")[0])]}) == 1
              and abs(tops("#scPrev")[0] - tops("#scToday")[0]) < 12, str(tops("#scPrev") + tops("#scNext") + tops("#scToday")))
        w = p.eval_on_selector_all("#scTplMenu, .sc-head .sc-wclear", "els => els.map(e => [Math.round(e.getBoundingClientRect().top), Math.round(e.getBoundingClientRect().width)])")
        check("P4 «Шаблон недели» и «Очистить неделю» — в ряд, одной ширины", w[0][0] == w[1][0] and abs(w[0][1] - w[1][1]) <= 2, str(w))
        check("P5 имена в строках не обрезаны", fits(".rw-p .nm"))
        check("P6 страница без прокрутки вбок", p.evaluate("document.documentElement.scrollWidth") <= 393)
        p.click(".sc-modes button[data-mode='tpl']")
        p.wait_for_selector(".sc-tplbar")
        check("P7 кнопки шаблона не вылезают за свои ячейки", fits(".sc-tplbar .btn"))
        check("P8 нет ошибок JavaScript", not errors, str(errors))
        browser.close()
    print("FAILS:", len(B1.FAILS))
    sys.exit(1 if B1.FAILS else 0)


if __name__ == "__main__":
    main()
