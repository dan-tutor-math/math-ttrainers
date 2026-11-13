"""
Статистика кабинета, задача В4(б): вкладка «Статистика» (cabinet-stats.js),
«в месяц» у ученика (payments.js, cabinet-payments.js), доход дня и ручной
итог дня в расписании (schedule.js, таблица day_totals из cabinet-stats.sql).

Заглушка Supabase и данные — из test_prompt_cabinet_payments.py («сегодня» —
среда 18.11.2026). Добавлено: 07.10 у Вани проведено (прошлый период),
10.11 у Вани — отработка, ручной итог дня 05.11 = 3 000 ₽ (по отметкам там
2 000), активный шаблон недели (Ваня — вт и чт, Петя — ср), у Пети в ставке
«2 занятия в неделю».

Ноябрь по отметкам: Ваня 03, 05, 10, 17 — 4 × 2 000; Петя 11 и 13 — по
1 500, 17 (пара) — 1 000, 16 — «пробное» (бесплатно); итого 12 000, с ручным
итогом 05.11 — 13 000. Прогул 12.11 — потеряно 2 000. Запланировано 18 и
20.11 — ожидается 4 000. Получено 11 500. Проведено 7 занятий, 7 часов.

Проверяет:
  A. месяц: доход 13 000 (+550% к октябрю, ожидается 4 000, ручной итог —
     1 день), получено 11 500, должны 4 500 (Петя 2 500 и Ваня — 07.10 до
     абонемента), занятий 7 и отработка,
     часов 7, час 1 857, потеряно 2 000;
  B. столбики: по месяцам (полгода, ноябрь 13 000, октябрь 2 000), по
     ученикам (Ваня: отработок 1, пропусков 1), по дням недели (вт 7 000);
  C. неделя 16–22.11 = 3 000, стрелка назад — 09–15.11 = 5 000; свой период;
  D. группа дохода: заводится, имя и состав пишутся в
     teacher_settings.settings.incomeGroups; фильтр — доход Пети 4 000 и
     предупреждение про ручные итоги; «в месяц» — итог по группе;
  E. «в месяц»: ×4 — Ваня 16 000 (2 по шаблону), Петя 12 000 (2 в ставке);
     «по шаблону» — Петя 6 000, способ в settings.pay.monthMode;
  F. шаблон недели: 3 часа, 5 500 в неделю, 1 833 за час, 22 000 в месяц;
  G. калькулятор: «Крепкий середняк» — 10 учеников, 160 000; пропуски 20% —
     12 учеников;
  H. ученик на вкладке «Оплаты»: «В месяц», своя сумма пишется в
     student_rates.monthly и важнее расчёта;
  I. расписание: доход дня по отметкам и «ожидается», доход недели; ручной
     итог дня — пишется в day_totals, «✎», «По отметкам» — строка удалена;
     в виде «Неделя» сумма дня тоже есть;
  J. телефон 375 px: статистика без горизонтальной прокрутки;
  K. cabinet-stats.sql не выполнен: расписание и статистика работают, итог
     дня просит выполнить SQL;
  L. нет ошибок JavaScript.

Запуск: python3 test_prompt_cabinet_stats.py (сервер поднимается сам).
"""
import json
import sys

from playwright.sync_api import sync_playwright

import test_prompt_cabinet_payments as PT
from test_prompt_cabinet_payments import B1, FIXED_NOW_JS, OWNER, lesson, norm, person, seed, wait_db
from test_prompt_b1_student_memory import BASE, PETYA, STATE, VANYA, check, db, local_server

# день итогов не выполнен в базе: запросы к day_totals отвечают «нет таблицы»
NO_DT_JS = PT.NO_SQL_JS.replace(
    "if (t === 'payments' || t === 'student_rates')", "if (t === 'day_totals')").replace(
    "if (/\\bbill\\b|pay_mode/.test(cols))", "if (false)")


def slot(i, wd, start, sid, fmt="single"):
    return ({"id": i, "owner": OWNER, "template_id": "T1", "weekday": wd, "start_min": start, "dur_min": 60, "format": fmt,
             "is_event": False, "title": "", "note": "", "group_id": None, "pos": 0},
            {"id": i + "p", "owner": OWNER, "slot_id": i, "student_id": sid, "guest_name": None, "pos": 0})


def stats_seed():
    d = seed()
    d["lessons"].append(lesson("O07", "2026-10-07", 900))
    d["lesson_students"].append(person("v07", "O07", VANYA, "done"))
    next(x for x in d["lesson_students"] if x["id"] == "v10")["makeup"] = True
    next(r for r in d["student_rates"] if r["student_id"] == PETYA)["per_week"] = 2
    d["day_totals"] = [{"id": "dt1", "owner": OWNER, "day": "2026-11-05", "amount": 3000, "note": ""}]
    d["week_templates"] = [{"id": "T1", "owner": OWNER, "name": "Осень", "is_active": True, "pos": 0, "created_at": "2026-09-01T00:00:00Z"}]
    sl = [slot("s1", 2, 900, VANYA), slot("s2", 4, 900, VANYA), slot("s3", 3, 600, PETYA)]
    d["template_slots"] = [a for a, _ in sl]
    d["template_slot_students"] = [b for _, b in sl]
    return d


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
        p = ctx.new_page()
        B1.PUMP["page"] = p
        p.on("pageerror", lambda e: errors.append(str(e)))
        p.set_viewport_size({"width": 1280, "height": 900})

        # ── A. месяц ──
        p.goto(f"{BASE}/cabinet.html#/stats")
        p.wait_for_selector("#stIncome", timeout=10000)
        check("A0 вкладка «Статистика» в меню и выбрана", p.locator('#tabs a[data-tab="stats"].on').count() == 1)
        check("A1 период — ноябрь 2026", txt(p, "#stLabel") == "ноябрь 2026", txt(p, "#stLabel"))
        inc = txt(p, "#stIncome")
        check("A2 доход 13 000 ₽, +550% к октябрю", "13 000 ₽" in inc and "+550%" in inc, inc)
        check("A3 ожидается 4 000, ручной итог — 1 день", "ожидается ещё 4 000 ₽" in inc and "ручной итог: 1 день" in inc, inc)
        check("A4 получено 11 500 ₽", "11 500 ₽" in txt(p, "#stGot"), txt(p, "#stGot"))
        # 07.10 у Вани проведено до абонемента от 01.11 — долг 2 000 (Payments.calc)
        check("A5 должны сейчас 4 500 ₽ — Ваня и Петя", "4 500 ₽" in txt(p, "#stDebt") and "Ваня, Петя" in txt(p, "#stDebt"), txt(p, "#stDebt"))
        les = txt(p, "#stLessons")
        check("A6 занятий 7, отработок 1", "Занятий 7" in les and "отработок 1" in les, les)
        check("A7 часов 7", txt(p, "#stHours").startswith("Часов 7 "), txt(p, "#stHours"))
        check("A8 стоимость часа 1 857 ₽", "1 857 ₽" in txt(p, "#stHour"), txt(p, "#stHour"))
        check("A9 потеряно на пропусках 2 000 ₽", "2 000 ₽" in txt(p, "#stLost") and "1 неоплаченный пропуск" in txt(p, "#stLost"), txt(p, "#stLost"))

        # ── B. столбики ──
        months = p.eval_on_selector_all("#stMonths .st-bar", "els => els.map(e => [e.dataset.k, e.innerText.replace(/\\s+/g, ' ')])")
        check("B1 по месяцам — полгода, июнь…ноябрь", [m[0] for m in months] == ["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"], str(months))
        check("B2 ноябрь 13 000 / 11 500, октябрь 2 000", "13 000 ₽ / 11 500 ₽" in months[-1][1] and "2 000 ₽" in months[-2][1], str(months))
        studs = p.eval_on_selector_all("#stStudents .st-bar", "els => els.map(e => [e.dataset.k, e.innerText.replace(/\\s+/g, ' ')])")
        check("B3 по ученикам: Ваня первым, 8 000, отработок 1, пропусков 1", studs and studs[0][0] == VANYA and "8 000 ₽" in studs[0][1] and "отработок 1" in studs[0][1] and "пропусков 1" in studs[0][1], str(studs))
        check("B4 Петя 4 000 ₽", len(studs) == 2 and "4 000 ₽" in studs[1][1], str(studs))
        tue = txt(p, '#stDow .st-bar[data-k="1"]')
        check("B5 вторник 7 000 ₽ · 3 занятия", "7 000 ₽" in tue and "3 занятия" in tue, tue)

        # ── C. неделя, назад, свой ──
        p.click('#stPer button[data-p="week"]')
        p.wait_for_function("() => document.querySelector('#stLabel').innerText.indexOf('16.11') === 0")
        check("C1 неделя 16–22.11: доход 3 000 ₽", "3 000 ₽" in txt(p, "#stIncome") and txt(p, "#stLabel") == "16.11 — 22.11.2026", txt(p, "#stIncome"))
        p.click("#stPrev")
        p.wait_for_function("() => document.querySelector('#stLabel').innerText.indexOf('09.11') === 0")
        check("C2 прошлая неделя 09–15.11: 5 000 ₽", "5 000 ₽" in txt(p, "#stIncome"), txt(p, "#stIncome"))
        p.click('#stPer button[data-p="custom"]')
        p.fill("#stFrom", "2026-10-01")
        p.dispatch_event("#stFrom", "change")
        p.wait_for_selector("#stTo")
        p.fill("#stTo", "2026-10-31")
        p.dispatch_event("#stTo", "change")
        p.wait_for_function("() => /2\\s000\\s₽/.test(document.querySelector('#stIncome b').innerText)")
        check("C3 свой период — октябрь: 2 000 ₽", "Доход (начислено) 2 000 ₽" in txt(p, "#stIncome"), txt(p, "#stIncome"))
        p.click('#stPer button[data-p="month"]')
        p.wait_for_function("() => /13\\s000/.test(document.querySelector('#stIncome b').innerText)")

        # ── D. группа дохода ──
        p.click("#stGroups summary")
        p.click("#stAddGrp")
        p.wait_for_selector("#stGroups [data-gid] [data-gf=name]")
        p.fill("#stGroups [data-gid] [data-gf=name]", "ОГЭ")
        p.dispatch_event("#stGroups [data-gid] [data-gf=name]", "change")
        p.wait_for_selector(f'#stGroups [data-gm="{PETYA}"]')
        p.check(f'#stGroups [data-gm="{PETYA}"]')
        grp_ok = wait_db(p, lambda d: any(g.get("name") == "ОГЭ" and g.get("members") == [PETYA]
                                          for g in ((d["teacher_settings"] or [{}])[0].get("settings", {}).get("incomeGroups") or [])))
        check("D1 группа «ОГЭ» с Петей в teacher_settings.settings.incomeGroups", grp_ok, str((db()["teacher_settings"] or [{}])[0].get("settings", {}).get("incomeGroups")))
        check("D2 группа осталась открытой после перерисовки", p.locator("#stGroups[open]").count() == 1)
        gid = p.get_attribute("#stGroups [data-gid]", "data-gid")
        p.select_option("#stGrp", gid)
        p.wait_for_function("() => /4\\s000/.test(document.querySelector('#stIncome b').innerText)")
        check("D3 фильтр по группе: доход Пети 4 000 ₽", "Доход (начислено) 4 000 ₽" in txt(p, "#stIncome"), txt(p, "#stIncome"))
        check("D4 предупреждение: ручные итоги дней в группе не учитываются", p.locator(".st-warn", has_text="Ручные итоги").count() == 1)
        check("D5 «в месяц» — итог по группе «ОГЭ»: 12 000 ₽", "по группе «ОГЭ»: 12 000 ₽" in txt(p, "#stMonthTotal"), txt(p, "#stMonthTotal"))
        p.select_option("#stGrp", "")
        p.wait_for_function("() => /13\\s000/.test(document.querySelector('#stIncome b').innerText)")

        # ── E. «в месяц» ──
        mv = txt(p, f'#stMonthly .st-mrow[data-sid="{VANYA}"]')
        check("E1 ×4: Ваня 16 000 ₽ — 2 в неделю по шаблону", "16 000 ₽" in mv and "2 в неделю (по шаблону)" in mv, mv)
        check("E2 ×4: Петя 12 000 ₽ (2 в ставке)", "12 000 ₽" in txt(p, f'#stMonthly .st-mrow[data-sid="{PETYA}"]'))
        check("E3 итого 28 000 ₽", "28 000 ₽" in txt(p, "#stMonthTotal"), txt(p, "#stMonthTotal"))
        p.click('#stMonthMode button[data-v="tpl"]')
        p.wait_for_function("() => /22\\s000/.test(document.querySelector('#stMonthTotal').innerText)")
        check("E4 по шаблону: Петя 6 000 ₽, итого 22 000", "6 000 ₽" in txt(p, f'#stMonthly .st-mrow[data-sid="{PETYA}"]'), txt(p, "#stMonthly"))
        check("E5 способ — в settings.pay.monthMode", wait_db(p, lambda d: (d["teacher_settings"] or [{}])[0].get("settings", {}).get("pay", {}).get("monthMode") == "tpl"))
        p.click('#stMonthMode button[data-v="x4"]')
        wait_db(p, lambda d: (d["teacher_settings"] or [{}])[0].get("settings", {}).get("pay", {}).get("monthMode") == "x4")

        # ── F. шаблон недели ──
        p.click("#stTpl summary")
        check("F1 3 часа в неделю", txt(p, "#stTplHours").startswith("Часов в неделю 3 "), txt(p, "#stTplHours"))
        check("F2 1 833 ₽ за час, 5 500 в неделю", "1 833 ₽" in txt(p, "#stTplHour") and "5 500 ₽" in txt(p, "#stTplHour"), txt(p, "#stTplHour"))
        check("F3 в месяц по шаблону 22 000 ₽", "22 000 ₽" in txt(p, "#stTplMonth"), txt(p, "#stTplMonth"))

        # ── G. калькулятор ──
        p.click("#stCalc summary")
        p.click('#stCalc [data-preset="2"]')
        s = txt(p, "#stCalcSum")
        check("G1 «Крепкий середняк»: 10 учеников, 160 000 ₽", "Нужно 10 учеников" in s and "160 000 ₽" in s and "2 000 ₽ за час" in s, s)
        p.fill('#stCalc [data-sc="skip"]', "20")
        s = txt(p, "#stCalcSum")
        check("G2 пропуски 20%: 12 учеников и потери", "Нужно 12 учеников" in s and "теряется" in s, s)
        check("G3 поле ввода не потеряло фокус", p.evaluate("() => document.activeElement && document.activeElement.dataset.sc") == "skip")
        p.click("#stMine")
        check("G4 «Мои цифры»: цена 1 800 (средняя ставка)", p.input_value('#stCalc [data-sc="price"]') == "1800", p.input_value('#stCalc [data-sc="price"]'))

        # ── J. телефон ──
        p.set_viewport_size({"width": 375, "height": 800})
        p.wait_for_timeout(200)
        sw = p.evaluate("() => document.documentElement.scrollWidth")
        check("J1 375 px: без горизонтальной прокрутки", sw <= 375, str(sw))
        p.set_viewport_size({"width": 1280, "height": 900})

        # ── H. «в месяц» у ученика ──
        p.goto(f"{BASE}/cabinet.html#/payments/{VANYA}")
        p.wait_for_selector("#psMonth")
        check("H1 «В месяц: 16 000 ₽»", "В месяц: 16 000 ₽" in txt(p, "#psMonth"), txt(p, "#psMonth"))
        p.click("#psMonBtn")
        p.fill("#psMonForm [name=monthly]", "20000")
        p.click("#psMonForm [type=submit]")
        check("H2 своя сумма — в student_rates.monthly", wait_db(p, lambda d: next(r for r in d["student_rates"] if r["student_id"] == VANYA).get("monthly") == 20000))
        p.wait_for_function("() => /20\\s000/.test((document.querySelector('#psMonth') || {}).innerText || '')")
        check("H3 показано «вписано вручную»", "вписано вручную" in txt(p, "#psMonth"), txt(p, "#psMonth"))

        # ── I. расписание: доход дня и ручной итог ──
        p.goto(f"{BASE}/cabinet.html#/schedule/2026-11-16")
        p.evaluate("() => localStorage.setItem('cabinet:schedule:view', 'list')")
        p.reload()
        p.wait_for_selector('.sc-dsum[data-dsum="2026-11-17"]', timeout=10000)
        check("I1 17.11 по отметкам — 3 000 ₽", txt(p, '.sc-dsum[data-dsum="2026-11-17"]') == "3 000 ₽", txt(p, '.sc-dsum[data-dsum="2026-11-17"]'))
        check("I2 18.11 — 0 ₽ и «+2 000 ₽» ожидается", txt(p, '.sc-dsum[data-dsum="2026-11-18"]') == "0 ₽ +2 000 ₽", txt(p, '.sc-dsum[data-dsum="2026-11-18"]'))
        check("I3 доход недели 3 000 ₽", txt(p, "#scWeekSum") == "3 000 ₽ за неделю", txt(p, "#scWeekSum"))
        check("I4 у свободного дня суммы нет", p.locator('.sc-dsum[data-dsum="2026-11-19"]').count() == 0)
        p.click('.sc-dsum[data-dsum="2026-11-17"]')
        p.wait_for_selector('.sc-dtf[data-dtf="2026-11-17"]')
        check("I5 в форме — сумма по отметкам", p.input_value('.sc-dtf [name=amount]') == "3000")
        p.fill('.sc-dtf [name=amount]', "4500")
        p.press('.sc-dtf [name=amount]', "Enter")
        check("I6 итог дня — в day_totals", wait_db(p, lambda d: any(r["day"] == "2026-11-17" and r["amount"] == 4500 for r in d["day_totals"])))
        p.wait_for_function("() => /4\\s500/.test(document.querySelector('.sc-dsum[data-dsum=\"2026-11-17\"]').innerText)")
        check("I7 «4 500 ₽ ✎», неделя 4 500", txt(p, '.sc-dsum[data-dsum="2026-11-17"]') == "4 500 ₽ ✎" and txt(p, "#scWeekSum") == "4 500 ₽ за неделю", txt(p, "#scWeekSum"))
        p.click('.sc-dsum[data-dsum="2026-11-17"]')
        p.click('.sc-dtf [data-dtauto]')
        check("I8 «По отметкам» — строка удалена", wait_db(p, lambda d: not any(r["day"] == "2026-11-17" for r in d["day_totals"])))
        p.wait_for_function("() => /^3\\s000\\s₽$/.test(document.querySelector('.sc-dsum[data-dsum=\"2026-11-17\"]').innerText.trim())")
        check("I9 снова 3 000 ₽ по отметкам", True)
        p.goto(f"{BASE}/cabinet.html#/schedule/2026-11-02")
        p.wait_for_selector('.sc-dsum[data-dsum="2026-11-05"]', timeout=10000)
        check("I10 05.11 — ручной итог 3 000 ₽ ✎", txt(p, '.sc-dsum[data-dsum="2026-11-05"]') == "3 000 ₽ ✎", txt(p, '.sc-dsum[data-dsum="2026-11-05"]'))
        p.evaluate("() => localStorage.setItem('cabinet:schedule:view', 'grid')")
        p.goto(f"{BASE}/cabinet.html#/schedule/2026-11-16")
        p.reload()
        p.wait_for_selector(".sc-grid", timeout=10000)
        check("I11 вид «Неделя»: сумма дня в шапке", txt(p, '.sc-gmoney .sc-dsum[data-dsum="2026-11-17"]') == "3 000 ₽")
        p.close()

        # ── K. cabinet-stats.sql не выполнен ──
        STATE["db"] = json.dumps(stats_seed())
        ctx2 = B1.new_context(browser, signed_in=True, bind="tab")
        ctx2.add_init_script(FIXED_NOW_JS)
        ctx2.add_init_script(NO_DT_JS)
        q = ctx2.new_page()
        B1.PUMP["page"] = q
        q.on("pageerror", lambda e: errors.append(str(e)))
        q.goto(f"{BASE}/cabinet.html#/stats")
        q.wait_for_selector("#stIncome", timeout=10000)
        check("K1 статистика без day_totals — по отметкам 12 000 ₽", "Доход (начислено) 12 000 ₽" in txt(q, "#stIncome"), txt(q, "#stIncome"))
        q.evaluate("() => localStorage.setItem('cabinet:schedule:view', 'list')")
        q.goto(f"{BASE}/cabinet.html#/schedule/2026-11-16")
        q.wait_for_selector('.sc-dsum[data-dsum="2026-11-17"]', timeout=10000)
        q.click('.sc-dsum[data-dsum="2026-11-17"]')
        q.fill('.sc-dtf [name=amount]', "100")
        q.press('.sc-dtf [name=amount]', "Enter")
        q.wait_for_function("() => /cabinet-stats\\.sql/.test(document.getElementById('toast').innerText)", timeout=6000)
        check("K2 сохранить итог дня — просит выполнить cabinet-stats.sql", True)
        check("K3 занятия недели на месте", q.locator(".sc-body [data-id]").count() >= 3)
        browser.close()

    check("L1 нет ошибок JavaScript", not errors, "; ".join(errors[:3]))
    print("FAILS:", len(B1.FAILS))
    sys.exit(1 if B1.FAILS else 0)


if __name__ == "__main__":
    main()
