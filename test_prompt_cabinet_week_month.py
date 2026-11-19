"""
Расписание, вид «Строки»: недели месяца списком (старое приложение: «все
недели месяца на одном поле, текущая развёрнута, остальные сворачиваются»).
Настройка «Вид → Показ в „Строках“» возвращает одну неделю.

Данные — stats_seed() («сегодня» — среда 18.11.2026): неделя 16–22.11 текущая.

Проверяет:
  A. ноябрь 2026 — шесть недель (26.10 … 30.11), развёрнута только текущая,
     в свёрнутых дней нет; шапка «Ноябрь 2026»;
  B. щелчок по шапке недели 09.11 разворачивает её, текущая остаётся
     открытой; в 12.11 виден «−2 000 ₽» за прогул; щелчок снова — сворачивает;
  C. у каждой недели свои «Кто в этой неделе» и «Статистика недели»
     (у текущей id прежние, у остальных — с датой), у каждой свои
     «Шаблон» и «Очистить»; в шапке страницы этих кнопок нет;
  D. правка в соседней неделе (статус в 12.11) сохраняется в базу;
  E. ‹ › листают месяцы: декабрь 2026 — пять недель;
  F. «Вид → Только одна неделя»: список недель исчезает, остаётся неделя
     16–22.11 со стрелками по неделям; вид «Неделя» теперь «Планер»;
     «Весь месяц» возвращает список; нет ошибок JavaScript.
"""
import json
import sys

from playwright.sync_api import sync_playwright
from playwright.sync_api import expect

from test_prompt_cabinet_payments import B1, FIXED_NOW_JS, norm, wait_db
from test_prompt_cabinet_stats import stats_seed
from test_prompt_b1_student_memory import BASE, STATE, check, db, local_server


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
        # после FIXED_NOW_JS: он по умолчанию ставит «одна неделя» для старых тестов
        ctx.add_init_script("try{localStorage.setItem('cabinet:schedule:view','list');localStorage.setItem('cabinet:schedule:look',JSON.stringify({span:'month'}))}catch(e){}")
        p = ctx.new_page()
        B1.PUMP["page"] = p
        p.on("pageerror", lambda e: errors.append(str(e)))
        p.set_viewport_size({"width": 1280, "height": 900})
        p.goto(f"{BASE}/cabinet.html#/schedule/2026-11-18")
        p.wait_for_selector(".sc-weeks .sc-wk", timeout=10000)

        # ── A ──
        weeks = p.eval_on_selector_all(".sc-wk", "els => els.map(e => [e.dataset.wk, e.classList.contains('open')])")
        check("A1 шесть недель ноября 26.10 … 30.11", [w[0] for w in weeks] == ["2026-10-26", "2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23", "2026-11-30"], str(weeks))
        check("A2 развёрнута только текущая 16.11", [w[0] for w in weeks if w[1]] == ["2026-11-16"], str(weeks))
        check("A3 в свёрнутой неделе дней нет", p.locator(".sc-wk[data-wk='2026-11-09'] .sc-day").count() == 0)
        check("A4 в развёрнутой — семь дней", p.locator(".sc-wk[data-wk='2026-11-16'] .sc-day").count() == 7)
        check("A5 шапка «Ноябрь 2026»", txt(p, "#scRange") == "Ноябрь 2026", txt(p, "#scRange"))
        check("A6 заголовок недели «Неделя 16.11 – 22.11»", "Неделя 16.11 – 22.11" in txt(p, ".sc-wk[data-wk='2026-11-16'] .sc-wkh"), txt(p, ".sc-wk[data-wk='2026-11-16'] .sc-wkh"))

        # ── B ──
        p.click(".sc-wk[data-wk='2026-11-09'] .sc-wkh b")
        p.wait_for_selector(".sc-wk[data-wk='2026-11-09'] .sc-day")
        check("B1 09.11 развёрнулась, 16.11 осталась открытой", p.locator(".sc-wk.open").count() == 2)
        p.wait_for_selector(".sc-day[data-day='2026-11-12'] .sc-dlost")
        check("B2 в 12.11 — «−2 000 ₽» за прогул", txt(p, ".sc-day[data-day='2026-11-12'] .sc-dlost") == "−2 000 ₽")

        # ── C ──
        check("C1 у недели 09.11 свои «Кто в этой неделе» и «Статистика»", p.locator(".sc-wk[data-wk='2026-11-09'] .si-box").count() == 2)
        check("C2 у текущей id прежние, у соседней — с датой", p.locator("#scWho").count() == 1 and p.locator("#scWho_2026-11-09").count() == 1)
        check("C3 у каждой развёрнутой недели свои «Шаблон» и «Очистить»",
              p.locator(".sc-wk[data-wk='2026-11-09'] .sc-tplbtn").count() == 1 and p.locator(".sc-wk[data-wk='2026-11-09'] .sc-wclear").count() == 1)
        check("C4 в шапке страницы этих кнопок нет", p.locator(".sc-head .sc-tplbtn, .sc-head .sc-wclear").count() == 0)
        p.click(".sc-wk[data-wk='2026-11-09'] .sc-wclear")
        p.wait_for_selector(".sc-ask-btns .btn.danger")
        check("C5 «Очистить» у недели 09.11 спрашивает про неё", "9" in txt(p, ".sc-ask-text") and "ноября" in txt(p, ".sc-ask-text"), txt(p, ".sc-ask-text"))
        p.click(".sc-ask-btns .btn.quiet")

        # ── D ──
        before = [x["status"] for x in db()["lesson_students"]]
        btn = p.locator(".sc-day[data-day='2026-11-12'] .rw-row [data-rst], .sc-day[data-day='2026-11-12'] .rw-row [data-pst]").first
        btn.click()
        ok = wait_db(p, lambda d: [x["status"] for x in d["lesson_students"]] != before)
        check("D1 статус в соседней неделе (12.11) записался в базу", ok)

        # ── свернуть ──
        p.click(".sc-wk[data-wk='2026-11-09'] .sc-wkh b")
        check("B3 повторный щелчок сворачивает", p.locator(".sc-wk[data-wk='2026-11-09'] .sc-day").count() == 0)

        # ── E ──
        p.click("#scNext")
        p.wait_for_function("() => document.querySelector('#scRange').innerText.indexOf('Декабрь') === 0", timeout=8000)
        p.wait_for_selector(".sc-weeks .sc-wk")
        n = p.locator(".sc-wk").count()
        check("E1 декабрь 2026 — пять недель", n == 5, str(n))
        p.click("#scPrev")
        p.wait_for_function("() => document.querySelector('#scRange').innerText.indexOf('Ноябрь') === 0", timeout=8000)
        p.wait_for_selector(".sc-weeks .sc-wk")
        check("E2 назад — ноябрь, шесть недель", p.locator(".sc-wk").count() == 6)

        # ── F ──
        check("F0 вид «Неделя» теперь «Планер»", txt(p, ".sc-views button[data-v=grid]") == "Планер")
        p.click("#scLook")
        p.get_by_text("Только одна неделя").click()
        p.wait_for_selector(".sc-days:not(.sc-weeks .sc-days)", timeout=8000)
        p.wait_for_function("() => !document.querySelector('.sc-weeks')", timeout=8000)
        check("F1 «Только одна неделя»: списка недель нет, дни одной недели", p.locator(".sc-weeks").count() == 0 and p.locator(".sc-day").count() == 7)
        check("F2 в шапке стрелки по неделям", "ноября" in txt(p, "#scRange") and p.locator(".sc-head .sc-tplbtn").count() == 1, txt(p, "#scRange"))
        # меню остаётся открытым (keep) — переключаем прямо в нём
        p.get_by_text("Весь месяц").click()
        p.wait_for_selector(".sc-weeks .sc-wk", timeout=8000)
        check("F3 «Весь месяц» вернул список недель", p.locator(".sc-wk").count() >= 5)
        look_button = p.locator("#scLook")
        look_menu = p.locator(".gm-look.on")
        look_button.click()
        expect(look_menu).to_have_count(0)
        look_button.click()
        expect(look_button).to_have_attribute("aria-expanded", "true")
        p.evaluate("window.scrollBy(0, 550)")
        p.wait_for_function("window.scrollY > 0")
        expect(look_menu).to_be_in_viewport()
        p.evaluate("window.scrollTo(0, 0)")
        look_button.click()
        expect(look_button).to_have_attribute("aria-expanded", "false")
        expect(look_menu).to_have_count(0)

        # Двойной щелчок в прежнюю точку не должен вызвать очистку недели.
        grid_button = p.locator('.sc-views button[data-v="grid"]')
        list_button = p.locator('.sc-views button[data-v="list"]')
        for width in (1280, 820, 375, 320):
            p.set_viewport_size({"width": width, "height": 900})
            grid_button.scroll_into_view_if_needed()
            before = grid_button.bounding_box()
            before_look = look_button.bounding_box()
            lesson_ids = [x["id"] for x in db()["lessons"]]
            p.mouse.dblclick(before["x"] + before["width"] / 2, before["y"] + before["height"] / 2, delay=90)
            expect(p.locator(".sc-gwrap")).to_be_visible()
            after = grid_button.bounding_box()
            after_look = look_button.bounding_box()
            assert abs(before["x"] - after["x"]) < 1 and abs(before["y"] - after["y"]) < 1, (width, before, after)
            assert abs(before_look["x"] - after_look["x"]) < 1, (width, before_look, after_look)
            expect(p.locator(".sc-ask-btns")).to_have_count(0)
            assert [x["id"] for x in db()["lessons"]] == lesson_ids
            assert p.evaluate("document.documentElement.scrollWidth <= innerWidth"), width
            list_button.click()
            expect(p.locator(".sc-weeks")).to_be_visible()
        print("[OK] Меню «Вид» закрывается повторным нажатием и остаётся при прокрутке")
        print("[OK] Переключатель на месте при двойном щелчке на ширинах 320–1280")
        check("G нет ошибок JavaScript", not errors, "; ".join(errors))
        browser.close()
    sys.exit(1 if B1.FAILS else 0)


if __name__ == "__main__":
    main()
