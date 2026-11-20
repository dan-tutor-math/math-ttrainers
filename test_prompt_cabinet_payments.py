"""
Оплаты кабинета, задача В4(а): вкладка «Оплаты», отметки оплаты в
расписании, настройки оплат (cabinet-payments.js, payments.js, schedule.js).

Supabase — заглушка из test_prompt_b1_student_memory.py плюс gte/lte (как в
test_prompt_cabinet_links.py). «Сегодня» — среда 18.11.2026, 12:00.

Данные: Ваня платит абонементом на 5 занятий от 01.11 (10 000 ₽), ставка
2 000 ₽; проведено 03, 05, 10 и 17.11 (пара с Петей), прогул 12.11 —
бесплатен по правилу, на 18.11 (сегодня) и 20.11 занятия запланированы. Петя платит за
каждое занятие: ставка 1 500 ₽, в паре 1 000 ₽; 11.11 — «оплатил» 1 500 ₽,
13.11 — не оплачено, 16.11 — флаг «пробное» (бесплатно), 17.11 — пара.

Проверяет:
  A. список: «Должны 2 500 ₽», «Скоро кончится 1», «Получено в ноябре
     10 000 ₽» по абонементам и 1 500 ₽ по разовым; у Вани шкала 4 из 5 и напоминание, у Пети —
     долг; должник выше;
  B. ученик Петя: долг и число неоплаченных, выписка объясняет — флаг
     «пробное», «оплачено за занятие», «без оплаты» с суммой;
  C. «+ оплата» у Вани: подставлена прошлая (10 000, 5 занятий), подсказка о
     сгорании по числу и по сроку, «По сроку» показывает дату конца;
     сохранено — новый абонемент в базе, в списке «ещё 1 в очереди»;
  D. ставка с даты: Пете 2 000 ₽ с 15.11 — долг пересчитан (13.11 по старой
     1 500, пара 17.11 — по новой 2 000), прошлое не тронуто;
  E. способ оплаты ученика пишется в students.pay_mode;
  F. расписание: у Пети «₽ оплатил» на проведённом, у Вани (абонемент) нет;
     щелчок — разовая оплата за это участие по ставке; снять — двумя
     щелчками; флаг «(пробное)» у имени;
  G. перенос и отмена без причины: подпись «без оплаты», карточка —
     «Оплачивается» (bill), причина из списка или свой текст, очистка причины,
     «По моей вине» (by_teacher), «Назначить
     отработку» — новое занятие с пометкой makeup и ссылкой на пропуск;
  H. боковая панель: остаток ученика, флаги переключаются;
  I. настройки: правило прогула и флаг из шаблона сохраняются в
     teacher_settings.settings.pay;
  J. файл SQL ещё не выполнен (база отвечает «нет столбца / таблицы»):
     расписание работает как раньше, вкладка просит выполнить SQL;
  K. нет ошибок JavaScript.

Запуск: python3 test_prompt_cabinet_payments.py (сервер поднимается сам).
"""
import json
import re
import sys

from playwright.sync_api import sync_playwright
from playwright.sync_api import expect

import test_prompt_b1_student_memory as B1
from test_prompt_b1_student_memory import BASE, PETYA, STATE, TEACHER, VANYA, check, db, fresh_db, local_server

FIXED_NOW_JS = r"""
(() => {
  const R = Date, OFF = new R(2026, 10, 18, 12, 0, 0).getTime() - R.now();
  class D extends R {
    constructor(...a){ if (a.length) super(...a); else super(R.now() + OFF); }
    static now(){ return R.now() + OFF; }
  }
  window.Date = D;
  // старые тесты проверяют показ одной недели («Вид → Показ в „Строках“»); список месяца — в test_prompt_cabinet_week_month.py
  try { if (!localStorage.getItem('cabinet:schedule:look')) localStorage.setItem('cabinet:schedule:look', JSON.stringify({ span: 'week' })); } catch (e) {}
})();
"""
B1.FAKE_SB_JS = B1.FAKE_SB_JS.replace(
    "    in(c, vs){",
    "    gte(c, v){ this.f.push(r => r[c] >= v); return this; }\n    lte(c, v){ this.f.push(r => r[c] <= v); return this; }\n    in(c, vs){", 1)

# «SQL не выполнен»: запросы с новыми столбцами и к новым таблицам отвечают
# ошибкой, как PostgREST (42703 / 42P01)
NO_SQL_JS = r"""
(() => {
  let real;
  Object.defineProperty(window, 'supabase', { configurable: true, get(){ return real; }, set(v){
    const cc = v.createClient;
    real = Object.assign({}, v, { createClient(...a){
      const c = cc(...a), from = c.from.bind(c);
      c.from = t => {
        const q = from(t), sel = q.select.bind(q), th = q.then.bind(q);
        let cols = '';
        q.select = x => { cols = String(x || ''); return sel(x); };
        q.then = (res, rej) => {
          if (t === 'payments' || t === 'student_rates') return Promise.resolve({ data: null, error: { code: '42P01', message: 'relation "public.' + t + '" does not exist' } }).then(res, rej);
          if (/\bbill\b|pay_mode/.test(cols)) return Promise.resolve({ data: null, error: { code: '42703', message: 'column lesson_students.bill does not exist' } }).then(res, rej);
          return th(res, rej);
        };
        return q;
      };
      return c;
    } });
  } });
})();
"""

OWNER = TEACHER["id"]


def lesson(i, day, start, fmt="single"):
    return {"id": i, "owner": OWNER, "day": day, "start_min": start, "dur_min": 60, "format": fmt, "is_event": False,
            "title": "", "note": "", "board_id": None, "group_id": None, "from_slot": None, "ext_id": None,
            "created_at": "2026-01-01T00:00:00Z", "updated_at": "2026-01-01T00:00:00Z"}


def person(i, les, sid, status, pos=0, **kw):
    r = {"id": i, "owner": OWNER, "lesson_id": les, "student_id": sid, "guest_name": None, "status": status, "pos": pos,
         "bill": None, "reason": None, "by_teacher": False, "makeup": False, "makeup_for": None, "flags": []}
    r.update(kw)
    return r


def pay(i, sid, kind, paid_on, amount, **kw):
    r = {"id": i, "owner": OWNER, "student_id": sid, "guest_name": None, "kind": kind, "paid_on": paid_on, "amount": amount,
         "lessons": None, "burn": None, "start_on": None, "end_on": None, "adjust": 0, "lesson_student_id": None,
         "payer": None, "method": None, "note": "", "archived_at": None, "ext_id": None, "created_at": paid_on + "T10:00:00Z"}
    r.update(kw)
    return r


def seed():
    d = fresh_db()
    d["student_task_log"] = []
    d["students"][1]["pay_mode"] = "lesson"
    d["teacher_settings"] = [{"owner": OWNER, "settings": {"sessionBind": "tab", "pay": {
        "reason": "болезнь", "flags": [{"id": "trial", "name": "пробное", "free": True}],
    }}}]
    d["lessons"] = [lesson("L03", "2026-11-03", 900), lesson("L05", "2026-11-05", 900), lesson("L10", "2026-11-10", 900),
                    lesson("L11", "2026-11-11", 600), lesson("L12", "2026-11-12", 900), lesson("L13", "2026-11-13", 600),
                    lesson("L16", "2026-11-16", 600), lesson("L17", "2026-11-17", 900, "pair"), lesson("L18", "2026-11-18", 900),
                    lesson("L20", "2026-11-20", 900)]
    d["lesson_students"] = [
        person("v03", "L03", VANYA, "done"), person("v05", "L05", VANYA, "done"), person("v10", "L10", VANYA, "done"),
        person("v12", "L12", VANYA, "skip"), person("v17", "L17", VANYA, "done", 0), person("p17", "L17", PETYA, "done", 1),
        person("v18", "L18", VANYA, "plan"), person("v20", "L20", VANYA, "plan"),
        person("p11", "L11", PETYA, "done"), person("p13", "L13", PETYA, "done"), person("p16", "L16", PETYA, "done", flags=["trial"]),
    ]
    d["student_rates"] = [
        {"id": "r1", "owner": OWNER, "student_id": VANYA, "valid_from": "2026-09-01", "price": 2000, "group_price": None, "per_week": None, "monthly": None, "note": ""},
        {"id": "r2", "owner": OWNER, "student_id": PETYA, "valid_from": "2026-09-01", "price": 1500, "group_price": 1000, "per_week": None, "monthly": None, "note": ""},
    ]
    d["payments"] = [
        pay("pk1", VANYA, "pack", "2026-11-01", 10000, lessons=5, burn="count", payer="мама"),
        pay("ps1", PETYA, "single", "2026-11-11", 1500, lesson_student_id="p11"),
    ]
    return d


def norm(t):
    return re.sub(r"\s+", " ", t.replace(" ", " "))


def wait_db(page, fn, timeout=6000):
    for _ in range(timeout // 150):
        if fn(db()):
            return True
        page.wait_for_timeout(150)
    return fn(db())



def open_lesson(p, lid):
    # «Строки» (редизайн 14.11): панель занятия — из меню «⋯» строки
    sel = f'.rw-row[data-id="{lid}"]'
    if p.locator(".sc-side").count():                 # открытая панель закрывает правый край строк
        p.keyboard.press("Escape")
        p.wait_for_selector(".sc-side", state="detached")
    p.hover(sel)
    p.click(sel + " .rw-more")
    p.click(".gm-menu.on .gm-item:has-text('Открыть занятие')")

def check_payment_controls(browser):
    d = seed()
    # Абонемент без остатка, пара в долг и занятие до первой ставки.
    d["payments"][0]["lessons"] = 3
    d["lessons"].append(lesson("L08", "2026-08-31", 600))
    d["lesson_students"].append(person("p08", "L08", PETYA, "done"))
    STATE["db"] = json.dumps(d)
    ctx = B1.new_context(browser, bar_open=False)
    ctx.add_init_script(FIXED_NOW_JS)
    p = ctx.new_page()
    errors = []
    p.on("pageerror", lambda e: errors.append(str(e)))
    p.goto(f"{BASE}/cabinet.html#/payments")
    rows = p.locator(".pay-row")
    filters = p.get_by_role("group", name="Виды оплат")
    expect(filters.get_by_role("button", name="Абонементы", exact=True)).to_have_attribute("aria-pressed", "true")
    expect(rows).to_have_count(1)
    expect(rows).to_contain_text("Ваня")
    filters.get_by_text("Разовые").click()
    expect(rows).to_have_count(1)
    rows.locator("a.nm").first.click()
    expect(p.locator("#payUnpaidHistory")).to_be_visible()
    open_statement(p)
    expect(p.locator(".pay-line-action")).to_have_count(3)
    pair = p.locator('[data-part="p17"]')
    pair.locator("button").evaluate("(b) => { b.click(); b.click(); }")
    expect(pair).to_have_count(0)
    expect(p.locator("#psDebt")).to_contain_text("1 500")
    receipts = [x for x in db()["payments"] if x.get("lesson_student_id") == "p17"]
    assert len(receipts) == 1 and receipts[0]["amount"] == 1000
    assert receipts[0]["paid_on"] == "2026-11-17" and receipts[0]["student_id"] == PETYA
    p.locator('[data-part="p08"] input').fill("850")
    p.locator('[data-part="p08"] button').click()
    expect(p.locator('[data-part="p08"]')).to_have_count(0)
    assert next(x for x in db()["payments"] if x.get("lesson_student_id") == "p08")["amount"] == 850
    p.get_by_text("← Оплаты", exact=True).click()
    expect(filters.get_by_text("Разовые")).to_have_attribute("aria-pressed", "true")
    filters.get_by_text("Абонементы", exact=True).click()
    expect(rows).to_have_count(1)
    p.goto(f"{BASE}/cabinet.html#/settings")
    toggle = p.get_by_role("checkbox", name="Учитывать долги за разовые занятия")
    expect(toggle).to_be_checked()
    toggle.uncheck()
    assert wait_db(p, lambda data: data["teacher_settings"][0]["settings"]["pay"].get("trackSingleDebt") is False)
    p.reload()
    expect(toggle).not_to_be_checked()
    p.goto(f"{BASE}/cabinet.html#/stats")
    expect(p.locator("#stDebt")).to_contain_text("2 000")
    p.goto(f"{BASE}/cabinet.html#/payments")
    p.locator("#payDebt summary").click()
    expect(p.locator("#payDebt")).to_contain_text("2 000")
    expect(p.locator("#payGot b")).to_have_text("10 000 ₽")
    p.set_viewport_size({"width": 375, "height": 812})
    panel = p.locator(".pay-overdue-list")
    rect = panel.bounding_box()
    assert rect is not None and rect["x"] >= 0 and rect["x"] + rect["width"] <= 375
    assert rect["y"] + rect["height"] <= p.locator("#paySoon").bounding_box()["y"]
    p.locator("#payDebt summary").click()
    filters.get_by_text("Разовые").click()
    expect(p.locator("#payGot b")).to_have_text("2 500 ₽")
    rows.locator("a.nm").first.click()
    expect(p.locator("#psDebt")).to_have_text("Долги за разовые занятия не учитываются")
    expect(p.locator(".pay-line-action")).to_have_count(1)
    open_statement(p)
    button = p.locator('[data-part="p13"] button')
    button.scroll_into_view_if_needed()
    rect = button.bounding_box()
    assert rect["x"] >= 0 and rect["x"] + rect["width"] <= 375
    p.goto(f"{BASE}/cabinet.html#/settings")
    toggle.check()
    assert wait_db(p, lambda data: data["teacher_settings"][0]["settings"]["pay"].get("trackSingleDebt") is True)
    p.goto(f"{BASE}/cabinet.html#/payments")
    p.locator("#payDebt summary").click()
    expect(p.locator("#payDebt")).to_contain_text("3 500")
    expect(p.locator("#payDebt b")).to_have_text("2")
    expect(panel.get_by_role("listitem")).to_have_count(2)
    expect(panel.get_by_role("link", name="Петя")).to_be_visible()
    assert not errors, errors
    ctx.close()
    print("[OK] Фильтры, разовые долги, абонементы и оплата из выписки на телефоне")

def open_statement(page):
    page.locator("#psLines details").evaluate_all("(groups) => groups.forEach(group => group.open = true)")

def check_new_payment_layout(browser):
    data = seed()
    data["lesson_students"].append(person("p20", "L20", PETYA, "plan", 1))
    STATE["db"] = json.dumps(data)
    ctx = B1.new_context(browser, bar_open=False)
    ctx.add_init_script(FIXED_NOW_JS)
    page = ctx.new_page()
    page.set_default_timeout(8000)
    B1.PUMP["page"] = page
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    url = f"{BASE}/cabinet.html#/payments"
    page.set_viewport_size({"width": 1440, "height": 900})
    page.goto(url)
    pack = page.locator('[data-pay-pack="pk1"]')
    meter = pack.get_by_role("progressbar")
    expect(meter).to_have_attribute("aria-valuenow", "4")
    expect(pack.locator(".pay-remaining")).to_have_count(0)
    def assert_inputs_aligned(fields):
        positions = [pack.locator(f'[data-pay-edit="{field}"]').bounding_box()["y"] for field in fields]
        assert max(positions) - min(positions) < 1, positions

    assert_inputs_aligned(["payer", "amount", "lessons", "used"])
    total = page.locator("#payGot b").inner_text()
    page.locator("#payView summary").click()
    remainder = page.get_by_role("checkbox", name="Остаток занятий")
    remainder.check()
    expect(pack.locator(".pay-remaining")).to_have_text("осталось 1 из 5")
    assert_inputs_aligned(["payer", "amount", "lessons", "used"])
    page.reload()
    expect(pack.locator(".pay-remaining")).to_be_visible()
    page.locator("#payView summary").click()
    remainder.uncheck()
    page.get_by_role("checkbox", name="Подпись родителя", exact=True).uncheck()
    expect(pack.locator(".pay-payer")).to_be_hidden()
    page.get_by_role("checkbox", name="Подпись родителя", exact=True).check()
    expect(pack.locator(".pay-payer")).to_be_visible()
    page.locator("#payView summary").click()

    pack.locator('[data-pay-period="pk1"]').click()
    calendar = page.get_by_role("dialog", name="Период абонемента")
    expect(calendar).to_be_visible()
    expect(calendar.locator(".pay-calendar-legend span")).to_have_count(5)
    expect(calendar.locator('[data-pay-day="2026-11-17"] .pay-dot.done')).to_be_visible()
    calendar.get_by_role("button", name="Конец", exact=True).click()
    calendar.locator('[data-pay-day="2026-11-20"]').click()
    calendar.get_by_role("button", name="Готово", exact=True).click()
    expect(pack.locator('[data-pay-period="pk1"]')).to_contain_text("20.11")
    assert wait_db(page, lambda d: d["payments"][0]["end_on"] == "2026-11-20")

    page.once("dialog", lambda dialog: dialog.accept())
    pack.get_by_role("button", name="Абонемент истёк").click()
    expect(pack.get_by_text("Истёк", exact=True)).to_be_visible()
    expect(pack.get_by_role("button", name="В архив")).to_be_visible()
    page.reload()
    pack.get_by_role("button", name="Вернуть").click()
    expect(pack.locator('[data-pay-period="pk1"]')).to_contain_text("20.11")
    expect(pack.get_by_text("Действует", exact=True)).to_be_visible()

    page.goto(f"{BASE}/cabinet.html#/schedule/2026-11-16")
    page.evaluate("() => localStorage.setItem('cabinet:schedule:view','list')")
    page.reload()
    page.locator('.rw-row[data-id="L18"] [data-rst]').click()
    assert wait_db(page, lambda d: next(x for x in d["lesson_students"] if x["id"] == "v18")["status"] == "done")
    page.goto(url)
    expect(meter).to_have_attribute("aria-valuenow", "5")
    expect(pack.get_by_text("Завершён", exact=True)).to_be_visible()
    used = pack.locator('[data-pay-edit="used"]')
    used.fill("4")
    used.press("Enter")
    expect(meter).to_have_attribute("aria-valuenow", "4")
    assert wait_db(page, lambda d: d["payments"][0]["adjust"] == -1)
    used.fill("5")
    used.press("Enter")
    expect(meter).to_have_attribute("aria-valuenow", "5")
    pack.get_by_role("button", name="В архив").click()
    expect(pack).to_have_count(0)
    expect(page.locator("#payGot b")).to_have_text(total)
    expect(page.locator("#payArchive summary")).to_contain_text("1")
    page.locator("#payArchive summary").click()
    archived_row = page.locator('[data-archived-payment="pk1"]')
    expect(archived_row.locator('[data-col="Начало"]')).to_have_text("01.11.2026")
    expect(archived_row.locator('[data-col="Окончание"]')).to_have_text("20.11.2026")
    page.locator('[data-pay-unarchive="pk1"]').click()
    expect(pack).to_be_visible()
    expect(meter).to_have_attribute("aria-valuenow", "5")
    expect(page.locator("#payGot b")).to_have_text(total)

    page.locator('[data-pay-filter="lesson"]').click()
    petya = page.locator(f'.pay-row[data-sid="{PETYA}"]')
    petya.locator(".pay-add").click()
    form = page.locator(".pay-form")
    expect(form.locator('[name="paid_on"]')).to_have_value("2026-11-17")
    expect(form.locator('[name="amount"]')).to_have_value("1000")
    form.locator("[data-choose-lesson]").click()
    page.get_by_role("menuitem", name="20.11.2026 · по расписанию · 1 500 ₽").click()
    expect(form.locator('[name="paid_on"]')).to_have_value("2026-11-20")
    expect(form.locator('[name="amount"]')).to_have_value("1500")
    form.get_by_role("button", name="Сохранить оплату").click()
    assert wait_db(page, lambda d: any(p.get("lesson_student_id") == "p20" and p["paid_on"] == "2026-11-20" and p["amount"] == 1500 for p in d["payments"]))
    petya.locator("a.nm").first.click()
    sections = ["#paySingleHistory", "#payPaidHistory", "#payUnpaidHistory"]
    for selector in sections:
        section = page.locator(selector)
        expect(section).not_to_have_attribute("open", "")
        section.locator("summary").first.click()
    expect(page.locator("#payPaidHistory")).to_contain_text("Запланировано — оплачено за занятие")
    expect(page.locator("#payUnpaidHistory .pay-history").first).to_be_visible()

    page.get_by_text("← Оплаты", exact=True).click()
    page.locator('[data-pay-filter="pack"]').click()
    page.set_viewport_size({"width": 320, "height": 740})
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    expect(pack.locator(".nm")).to_have_css("font-size", "18px")
    expect(pack.locator('[data-pay-edit="amount"]')).to_have_css("font-variant-numeric", "tabular-nums")
    expect(page.locator("#payGot b")).to_have_css("font-size", "22px")
    assert_inputs_aligned(["amount", "lessons", "used"])
    pack.locator('[data-pay-period="pk1"]').click()
    expect(calendar.get_by_role("button", name="Готово")).to_be_visible()
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    assert not errors, errors
    ctx.close()
    print("[OK] Календарь, рост шкалы, архив, разовые по дате и ставке занятия, истории и 320 px")

def check_archived_pack_keeps_lessons(browser):
    data = seed()
    dates = ["2026-09-18", "2026-09-22", "2026-09-24", "2026-09-29", "2026-10-01", "2026-10-05", "2026-10-06", "2026-10-13"]
    data["lessons"] = [lesson(f"archived-lesson-{i}", day, 900) for i, day in enumerate(dates)]
    data["lesson_students"] = [person(f"archived-person-{i}", row["id"], VANYA, "done")
                               for i, row in enumerate(data["lessons"])]
    data["payments"] = [
        dict(pay("archived-pack", VANYA, "pack", "2026-09-18", 14000, lessons=8, burn="count"),
             archived_at="2026-09-25T10:00:00Z"),
        pay("next-pack", VANYA, "pack", "2026-10-28", 16000, lessons=8, burn="count", start_on="2026-10-27"),
        dict(pay("older-receipt", PETYA, "pack", "2026-09-10", 6000, lessons=4, burn="date",
                 start_on="2026-10-01", end_on="2026-10-07"), archived_at="2026-10-08T10:00:00Z"),
        pay("newer-receipt", PETYA, "pack", "2026-11-02", 8000, lessons=4, burn="count"),
    ]
    data["teacher_settings"][0]["settings"]["pay"]["outside"] = "debt"
    STATE["db"] = json.dumps(data)
    ctx = B1.new_context(browser, bar_open=False)
    ctx.add_init_script(FIXED_NOW_JS)
    page = ctx.new_page()
    B1.PUMP["page"] = page
    page.goto(f"{BASE}/cabinet.html#/payments")
    expect(page.locator('[data-pay-pack="next-pack"]')).to_be_visible()
    expect(page.locator("#payDebt")).to_be_hidden()
    pack_table = page.get_by_role("table", name="Абонементы", exact=True)
    assert pack_table.locator("[data-pay-sort]").count() == 8
    assert pack_table.locator("[data-pay-pack]").evaluate_all("(rows) => rows.map(r => r.dataset.payPack)") == ["newer-receipt", "next-pack"]
    date_sort = pack_table.get_by_role("columnheader", name="Дата оплаты")
    expect(date_sort).to_have_attribute("aria-sort", "descending")
    date_sort.get_by_role("button").click()
    expect(date_sort).to_have_attribute("aria-sort", "ascending")
    arrow = date_sort.locator("span")
    expect(arrow).to_have_text("↑")
    expect(date_sort.get_by_role("button")).to_have_css("background-color", "rgba(0, 0, 0, 0)")
    expect(date_sort.get_by_role("button")).not_to_be_focused()
    expect(pack_table.locator("[data-pay-pack]").first).to_have_attribute("data-pay-pack", "next-pack")
    pack_table.get_by_role("button", name="Сумма, ₽").click()
    expect(pack_table.locator("[data-pay-pack]").first).to_have_attribute("data-pay-pack", "next-pack")
    pack_table.get_by_role("button", name="Сумма, ₽").press("Enter")
    expect(pack_table.get_by_role("button", name="Сумма, ₽")).to_be_focused()
    expect(pack_table.locator("[data-pay-pack]").first).to_have_attribute("data-pay-pack", "newer-receipt")

    page.locator("#payArchive summary").click()
    archive = page.get_by_role("table", name="Архив оплат", exact=True)
    expect(archive.locator("[data-archived-payment]").first).to_have_attribute("data-archived-payment", "archived-pack")
    archive.get_by_role("button", name="Дата оплаты").click()
    expect(archive.locator("[data-archived-payment]").first).to_have_attribute("data-archived-payment", "older-receipt")
    archive.get_by_role("button", name="Начало").click()
    expect(archive.locator("[data-archived-payment]").first).to_have_attribute("data-archived-payment", "older-receipt")
    archive.get_by_role("button", name="Начало").click()
    expect(archive.locator("[data-archived-payment]").first).to_have_attribute("data-archived-payment", "archived-pack")
    archive.get_by_role("button", name="Окончание").click()
    expect(archive.locator("[data-archived-payment]").first).to_have_attribute("data-archived-payment", "archived-pack")
    archive.get_by_role("button", name="Окончание").click()
    expect(archive.locator("[data-archived-payment]").first).to_have_attribute("data-archived-payment", "older-receipt")
    expect(pack_table.get_by_role("columnheader", name="Сумма, ₽")).to_have_attribute("aria-sort", "ascending")
    page.set_viewport_size({"width":320,"height":740})
    expect(archive.get_by_role("button", name="Дата оплаты")).to_be_visible()
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    record = archive.locator('[data-archived-payment="archived-pack"]')
    expect(record.locator('[data-col="Дата оплаты"]')).to_have_text("18.09.2026")
    expect(record.locator('[data-col="Начало"]')).to_have_text("18.09.2026")
    expect(record.locator('[data-col="Окончание"]')).to_have_text("13.10.2026")
    record.locator("a.nm").click()
    expect(page.locator("#psDebt")).to_contain_text("Долга нет")
    archived = page.locator('[data-pid="archived-pack"]')
    expect(archived).to_contain_text("Период с 18.09.2026 по 13.10.2026")
    expect(archived).to_contain_text("прошло 8")
    expect(page.locator('[data-pid="next-pack"]')).to_contain_text("дата окончания не указана")
    assert not page.locator(".pay-line.debt").count()
    ctx.close()
    print("[OK] Сортировка оплат и архива в обе стороны, три даты, карточка и отсутствие ложного долга")


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

        # ── A. список ──
        p.goto(f"{BASE}/cabinet.html#/payments")
        p.wait_for_selector(".pay-row", timeout=10000)
        p.locator("#payDebt summary").click()
        check("A1 «Должны 2 500 ₽», Петя", "2 500 ₽" in norm(p.inner_text("#payDebt")) and "Петя" in p.inner_text("#payDebt"), norm(p.inner_text("#payDebt")))
        p.locator("#payDebt summary").click()
        check("A2 «Скоро кончится» — 1 (Ваня)", "1" in p.inner_text("#paySoon b") and "Ваня" in p.inner_text("#paySoon"), p.inner_text("#paySoon"))
        check("A3 «Получено в ноябре 10 000 ₽» по абонементам", "ноябре" in p.inner_text("#payGot") and "10 000 ₽" in norm(p.inner_text("#payGot")), norm(p.inner_text("#payGot")))
        vrow = norm(p.inner_text(f'.pay-row[data-sid="{VANYA}"]'))
        check("A4 Ваня: шкала 4 из 5 и подпись остатка скрыта", "осталось 1 из 5" not in vrow and p.locator('[data-pay-pack="pk1"] .pay-bar').get_attribute("aria-valuenow") == "4", vrow)
        p.locator('[data-pay-filter="lesson"]').click()
        prow = norm(p.inner_text(f'.pay-row[data-sid="{PETYA}"]'))
        check("A5 Петя: разовая оплата, долг 2 500 ₽", "1 500 ₽" in prow and "долг 2 500 ₽" in prow, prow)
        order = p.eval_on_selector_all(".pay-row", "els => els.map(e => e.dataset.sid)")
        check("A6 должник первым", order[0] == PETYA, str(order))

        # ── B. Петя: выписка ──
        p.click(f'.pay-row[data-sid="{PETYA}"] a.nm')
        p.wait_for_selector("#psLines")
        open_statement(p)
        check("B1 долг и два неоплаченных занятия", "Долг 2 500 ₽ · 2 занятия без оплаты" in norm(p.inner_text("#psDebt")), norm(p.inner_text("#psDebt")))
        lines = norm(p.inner_text("#psLines"))
        check("B2 флаг «пробное» — бесплатно", "флаг «пробное»" in lines, lines)
        check("B3 11.11 — оплачено за занятие", "оплачено за занятие, 1 500 ₽" in lines, lines)
        check("B4 13.11 по ставке, пара 17.11 по групповой", "без оплаты: 1 500 ₽" in lines and "без оплаты: 1 000 ₽" in lines and "баланс −2 500 ₽" in lines, lines)

        # ── D. ставка с даты ──
        p.click("#psRateBtn")
        p.fill("#psRateForm [name=valid_from]", "2026-11-15")
        p.fill("#psRateForm [name=price]", "2000")
        p.fill("#psRateForm [name=group_price]", "")
        p.click("#psRateForm [type=submit]")
        p.wait_for_function("() => /3\\s500/.test(document.querySelector('#psDebt') ? document.querySelector('#psDebt').innerText : '')", timeout=6000)
        lines = norm(p.inner_text("#psLines"))
        check("D1 новая ставка в базе", any(r["valid_from"] == "2026-11-15" and r["price"] == 2000 and r["group_price"] is None for r in db()["student_rates"]))
        check("D2 долг пересчитан: 1 500 + 2 000", "Долг 3 500 ₽" in norm(p.inner_text("#psDebt")) and "без оплаты: 2 000 ₽" in lines and "без оплаты: 1 500 ₽" in lines, lines)

        # ── E. способ оплаты ──
        p.goto(f"{BASE}/cabinet.html#/payments/{VANYA}")
        p.wait_for_selector("#psMode")
        p.click('#psMode button[data-mode="lesson"]')
        check("E1 pay_mode = lesson в базе", wait_db(p, lambda d: next(s for s in d["students"] if s["id"] == VANYA).get("pay_mode") == "lesson"))
        p.wait_for_selector('#psMode button[data-mode="pack"]')
        p.click('#psMode button[data-mode="pack"]')
        check("E2 и обратно — pack", wait_db(p, lambda d: next(s for s in d["students"] if s["id"] == VANYA).get("pay_mode") == "pack"))

        # ── C. + оплата с подстановкой ──
        p.goto(f"{BASE}/cabinet.html#/payments")
        p.locator('[data-pay-filter="pack"]').click()
        p.wait_for_selector(f'.pay-row[data-sid="{VANYA}"] .pay-add')
        p.click(f'.pay-row[data-sid="{VANYA}"] .pay-add')
        p.wait_for_selector(".pay-form")
        check("C1 подставлена прошлая: 10 000 и 5 занятий", p.input_value(".pay-form [name=amount]") == "10000" and p.input_value(".pay-form [name=lessons]") == "5")
        check("C2 «Кто платил» — как в прошлый раз", p.input_value(".pay-form [name=payer]") == "мама")
        hint = p.inner_text(".pay-burnhint")
        check("C3 подсказка: можно по числу и по сроку", "По числу занятий" in hint and "По сроку" in hint, hint)
        check("C4 по умолчанию — по числу занятий, даты конца нет", p.locator(".pay-endf").is_hidden())
        p.click('.pay-burn button[data-burn="date"]')
        check("C5 «По сроку» — поле «Действует до» (через месяц)", p.locator(".pay-endf").is_visible() and p.input_value(".pay-form [name=end_on]") == "2026-12-18")
        p.click('.pay-burn button[data-burn="count"]')
        p.click(".pay-form [type=submit]")
        ok = wait_db(p, lambda d: len([x for x in d["payments"] if x["student_id"] == VANYA and x["kind"] == "pack"]) == 2)
        new = [x for x in db()["payments"] if x["student_id"] == VANYA and x["id"] != "pk1"]
        check("C6 новый абонемент в базе", ok and new and new[0]["lessons"] == 5 and new[0]["burn"] == "count" and new[0]["paid_on"] == "2026-11-18" and new[0]["amount"] == 10000, str(new))
        expect(p.locator(f'.pay-row[data-sid="{VANYA}"]').get_by_text("В очереди", exact=True)).to_be_visible()

        # ── F. расписание: «оплатил» и флаг ──
        p.goto(f"{BASE}/cabinet.html#/schedule/2026-11-16")
        p.evaluate("() => localStorage.setItem('cabinet:schedule:view', 'list')")
        p.reload()
        p.wait_for_selector(".rw-row", timeout=10000)
        p.wait_for_selector('.sc-paid[data-paid="p17"]', timeout=6000)
        check("F1 у Вани (абонемент) кнопки «оплатил» нет", p.locator('.sc-paid[data-paid="v17"]').count() == 0)
        check("F2 флаг «(пробное)» у Пети 16.11", "(пробное)" in p.inner_text('.rw-row[data-id="L16"]'))
        check("F3 на пробном (бесплатном) «оплатил» нет", p.locator('.sc-paid[data-paid="p16"]').count() == 0)
        p.click('.sc-paid[data-paid="p17"]')
        ok = wait_db(p, lambda d: any(x.get("lesson_student_id") == "p17" for x in d["payments"]))
        row = next((x for x in db()["payments"] if x.get("lesson_student_id") == "p17"), {})
        check("F4 «оплатил» — разовая за это участие по ставке и дате занятия", ok and row.get("kind") == "single"
              and row.get("amount") == 2000 and row.get("paid_on") == "2026-11-17" and row.get("student_id") == PETYA, str(row))
        p.wait_for_function("() => document.querySelector('.sc-paid[data-paid=\"p17\"]').classList.contains('on')")
        p.click('.sc-paid[data-paid="p17"]')
        check("F5 первый щелчок по оплаченному — «снять?», оплата цела", p.inner_text('.sc-paid[data-paid="p17"]') == "снять?" and any(x.get("lesson_student_id") == "p17" for x in db()["payments"]))
        p.click('.sc-paid[data-paid="p17"]')
        check("F6 второй — оплата снята", wait_db(p, lambda d: not any(x.get("lesson_student_id") == "p17" for x in d["payments"])))

        # ── G. прогул и карточка ──
        st_btn = '.rw-row[data-id="L18"] [data-rst]'
        p.click(st_btn)
        p.wait_for_function("() => document.querySelector('%s').classList.contains('st-done')" % st_btn)
        p.click(st_btn)                                   # проведено → перенос → отменено (порядок Даниила 14.11)
        p.wait_for_function("() => document.querySelector('%s').classList.contains('st-move')" % st_btn)
        why = p.locator('.sc-why[data-why="v18"]')
        expect(why).to_have_text("без оплаты")
        why.click()
        expect(p.locator("#pcReasons .on")).to_have_count(0)
        p.get_by_role("button", name="Своя причина").click()
        expect(p.locator("#pcCustom")).to_have_value("")
        p.fill("#pcCustom", "  Совпало с олимпиадой  ")
        p.locator("#pcCustomForm").get_by_role("button", name="Сохранить").click()
        expect(why).to_have_text("Совпало с олимпиадой · без оплаты")
        assert wait_db(p, lambda d: any(x["id"] == "v18" and x.get("reason") == "Совпало с олимпиадой" for x in d["lesson_students"]))
        p.keyboard.press("Escape")
        why.click()
        expect(p.locator("#pcReasons .on")).to_have_text("Совпало с олимпиадой")
        p.click("#pcClearReason")
        expect(why).to_have_text("без оплаты")
        assert wait_db(p, lambda d: any(x["id"] == "v18" and x.get("reason") is None for x in d["lesson_students"]))
        p.keyboard.press("Escape")
        p.click(st_btn)
        check("G1 прогул в базе", wait_db(p, lambda d: next(x for x in d["lesson_students"] if x["id"] == "v18")["status"] == "skip"))
        p.wait_for_selector('.sc-why[data-why="v18"]')
        check("G2 отмена без причины: «без оплаты»", why.inner_text() == "без оплаты", why.inner_text())
        check("G3 карточка сама не открылась", p.locator(".pay-card").count() == 0)
        p.click('.sc-why[data-why="v18"]')
        p.wait_for_selector(".pay-card")
        p.click('#pcBill button[data-bill="charge"]')
        lsr = lambda: next(x for x in db()["lesson_students"] if x["id"] == "v18")
        check("G4 «Оплачивается» — bill = charge", wait_db(p, lambda d: next(x for x in d["lesson_students"] if x["id"] == "v18").get("bill") == "charge"))
        p.click('#pcReasons button[data-reason="болезнь"]')
        check("G5 причина «болезнь» сохраняется только при выборе", wait_db(p, lambda d: lsr().get("reason") == "болезнь"))
        expect(why).to_have_text("болезнь · оплачивается")
        p.click("#pcTeacher")
        check("G7 «По моей вине» — by_teacher, исключение снято", wait_db(p, lambda d: next(x for x in d["lesson_students"] if x["id"] == "v18").get("by_teacher") is True and next(x for x in d["lesson_students"] if x["id"] == "v18").get("bill") is None))
        p.wait_for_selector("#pcMakeup")
        check("G8 рядом кнопка «Назначить отработку» с пояснением", "отработк" in (p.get_attribute("#pcMakeup", "title") or ""))
        p.click("#pcMakeup")
        p.wait_for_selector(".sc-modal #edNewForm")
        check("G9 окно «Отработка», имя подставлено, день — следующий", "Отработка" in p.inner_text(".sc-modal .sc-ed-head") and p.input_value("#edNames") == "Ваня" and p.input_value("#edDay") == "2026-11-19")
        p.fill("#edStart", "16:00")
        p.click("#edCreate")
        ok = wait_db(p, lambda d: any(x.get("makeup") and x.get("makeup_for") == "v18" for x in d["lesson_students"]))
        mk = next((x for x in db()["lesson_students"] if x.get("makeup_for") == "v18"), {})
        mles = next((l for l in db()["lessons"] if l["id"] == mk.get("lesson_id")), {})
        check("G10 отработка — занятие с пометкой и ссылкой на пропуск", ok and mk.get("student_id") == VANYA and mles.get("day") == "2026-11-19" and mles.get("start_min") == 960, str(mk) + str(mles))
        p.wait_for_selector(".sc-mk")
        check("G11 у имени пометка «отработка»", "отработка" in p.inner_text(".sc-mk"))

        # ── H. боковая панель ──
        open_lesson(p, "L17")
        p.wait_for_selector(".sc-sp-pick")
        p.click(f'.sc-sp-pick button[data-pick="{PETYA}"]')
        p.wait_for_selector("#spPay")
        p.wait_for_function("() => /долг/.test(document.querySelector('#spSum').innerText)", timeout=6000)
        check("H1 в панели — способ оплаты и долг", "Платит за занятие" in p.inner_text("#spSum") and "долг" in p.inner_text("#spSum"), p.inner_text("#spSum"))
        check("H2 «оплатил» есть и в панели", p.locator("#spPaid").count() == 1)
        p.click('#spPay button[data-flag="trial"]')
        check("H3 флаг ставится из панели", wait_db(p, lambda d: next(x for x in d["lesson_students"] if x["id"] == "p17")["flags"] == ["trial"]))
        p.wait_for_function("() => document.querySelector('#spPay button[data-flag=\"trial\"]').classList.contains('on')")
        p.click("#spMakeup")
        check("H4 галочка «Отработка» пишет makeup", wait_db(p, lambda d: next(x for x in d["lesson_students"] if x["id"] == "p17").get("makeup") is True))
        p.keyboard.press("Escape")

        # ── I. настройки ──
        p.goto(f"{BASE}/cabinet.html#/settings")
        p.wait_for_selector("#psSkip")
        check("I1 шаблон «пробное» уже заведён — его кнопки нет", p.locator('[data-tpl="trial"]').count() == 0 and p.locator('[data-tpl="charity"]').count() == 1)
        p.click('#psSkip button[data-v="charge"]')
        settings = lambda d: (d["teacher_settings"][0]["settings"] if d["teacher_settings"] else {}).get("pay", {})
        check("I2 правило прогула сохранилось", wait_db(p, lambda d: settings(d).get("skipRule") == "charge"))
        p.click('[data-tpl="charity"]')
        check("I3 флаг «благотворительное» (бесплатно) добавлен", wait_db(p, lambda d: any(f["id"] == "charity" and f["free"] for f in settings(d).get("flags", []))))
        check("I4 прежний флаг на месте", any(f["id"] == "trial" for f in settings(db()).get("flags", [])))
        check("I5 общей причины в настройках нет", p.locator("#psReason").count() == 0)

        check("K нет ошибок JavaScript", not errors, "; ".join(errors))

        # ── J. SQL ещё не выполнен ──
        STATE["db"] = json.dumps(seed())
        ctx2 = B1.new_context(browser, signed_in=True, bind="tab")
        ctx2.add_init_script(FIXED_NOW_JS)
        ctx2.add_init_script(NO_SQL_JS)
        q = ctx2.new_page()
        errs2 = []
        q.on("pageerror", lambda e: errs2.append(str(e)))
        q.goto(f"{BASE}/cabinet.html#/schedule/2026-11-16")
        q.evaluate("() => localStorage.setItem('cabinet:schedule:view', 'list')")
        q.reload()
        q.wait_for_selector(".rw-row", timeout=10000)
        check("J1 расписание без новых столбцов работает", q.locator(".rw-row").count() == 4 and q.locator(".sc-paid").count() == 0, q.inner_text("#scHost")[:300])
        q.click('.rw-row[data-id="L18"] [data-rst]')
        check("J2 отметка ставится", wait_db(q, lambda d: next(x for x in d["lesson_students"] if x["id"] == "v18")["status"] == "done"))
        q.goto(f"{BASE}/cabinet.html#/payments")
        q.wait_for_function("() => /cabinet-payments\\.sql/.test(document.querySelector('#payHost').innerText)", timeout=8000)
        check("J3 вкладка просит выполнить cabinet-payments.sql", True)
        check("J4 нет ошибок JavaScript", not errs2, "; ".join(errs2))
        ctx.close()
        ctx2.close()
        check_payment_controls(browser)
        check_new_payment_layout(browser)
        check_archived_pack_keeps_lessons(browser)
        browser.close()
    print("\nИТОГ:", "всё зелёное" if not B1.FAILS else "есть падения: " + ", ".join(B1.FAILS))
    sys.exit(1 if B1.FAILS else 0)


if __name__ == "__main__":
    main()
