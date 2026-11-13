"""
Синхронизация кабинета со старым приложением расписания, задача В5 плана
кабинета (schedule-sync.js).

Старое приложение — заглушка /data на https://old.test (GET {rev, data},
PUT {base, data} → {ok, rev} или 409 со свежими данными, как в Worker).
Настоящего Worker и настоящего кода доступа нет: код — выдуманная строка.
Supabase — заглушка из test_prompt_b1_student_memory.py (+ gte/lte/lt).
Дата в браузере подменена: среда 18.11.2026, 12:00.

Проверяет:
  A. первая синхронизация = импорт с предпросмотром: совпавшие по имени,
     новый ученик (заводится по галочке), гость только из строк, прошлые
     занятия; после «Импортировать» — занятия, статусы, длительность,
     полупараллелка, шаблон недели (активный), история; в старое ушли id
     строкам без id (и оплате), а цвет полупараллелки, пометка в скобках,
     пустая строка-окно и поля оплаты не тронуты;
  B. правка в кабинете (статус, новое занятие) сама уходит в старое;
  C. правка в старом приходит в кабинет;
  D. правки разных дней в обоих местах сводятся без вопросов;
  E. один день правили в обоих местах — окно с обоими вариантами, выбор
     «из старого» применяется;
  F. 409 (записал кто-то ещё) — повторное сведение, обе правки на месте;
  G. незнакомое имя → гость и предложение завести; «Завести ученика»
     переводит гостя в ученика; переименование в кабинете доходит до строк
     старого;
  H. код доступа не уходит в Supabase (ни в одном запросе к базе), только в
     заголовке x-code к старому приложению;
  I. нет ошибок JavaScript.

Запуск: python3 test_prompt_cabinet_sync.py (сервер поднимается сам).
"""
import copy
import json
import sys

from playwright.sync_api import sync_playwright

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
})();
"""

B1.FAKE_SB_JS = B1.FAKE_SB_JS.replace(
    "    in(c, vs){",
    "    gte(c, v){ this.f.push(r => r[c] >= v); return this; }\n"
    "    lte(c, v){ this.f.push(r => r[c] <= v); return this; }\n"
    "    lt(c, v){ this.f.push(r => r[c] < v); return this; }\n"
    "    in(c, vs){", 1)

CODE = "fake-code-for-test-7Q"           # выдуманный, не настоящий код
OLD_URL = "https://old.test"
CORS = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, x-code",
        "Access-Control-Allow-Methods": "GET, PUT, OPTIONS"}

OLD0 = {
    "students": [
        {"name": "Маша", "tag": "уч. год", "price": "1500", "per": "2", "monthly": None},
        {"name": "Петя", "tag": "уч. год", "price": "1500", "per": "2", "monthly": None},
        {"name": "Ваня", "tag": "уч. год", "price": "2000", "per": "1", "monthly": None},
    ],
    "schedule": {
        "2026-08-03": {"rows": [{"time": "10:00", "names": "Ваня", "id": "h1", "st": "done"}], "total": None},
        "2026-11-16": {"rows": [{"time": "15:00", "names": "Маша, Петя", "id": "r1", "st": "done"},
                                {"time": "17:00", "names": "Ваня (онлайн)", "id": "r2"}], "total": None},
        "2026-11-17": {"rows": [{"time": "10:00", "names": "Гоша"},
                                {"time": "12:00", "names": ""}], "total": None},
        "2026-11-19": {"rows": [{"time": "16:00", "names": "Ваня", "id": "r3", "dur": 90}], "total": None},
        "2026-11-20": {"rows": [{"time": "18:00", "names": "Маша", "id": "r4", "stg": True, "stgC": "#e2766c"},
                                {"time": "18:30", "names": "Петя", "id": "r5", "stg": True, "stgC": "#e2766c"}], "total": None},
    },
    "templates": [{"id": "tA", "name": "Основной", "days": [[{"time": "15:00", "names": "Маша, Петя", "id": "s1"}], [], [], [], [], [], []]}],
    "activeTpl": "tA",
    "payments": [{"student": "Маша", "date": "2026-11-01", "sum": "12000", "count": "8"}],
    "notes": "заметка",
}
OLD = {"rev": 1000, "data": copy.deepcopy(OLD0)}
LOG = {"put": 0, "c409": 0, "codes": set(), "sb_bodies": [], "conflict_once": None}


def handle_old(route, request):
    if request.method == "OPTIONS":
        route.fulfill(status=204, headers=CORS)
        return
    LOG["codes"].add(request.headers.get("x-code", ""))
    if request.headers.get("x-code") != CODE:
        route.fulfill(status=401, content_type="application/json", body=json.dumps({"error": "wrong-code"}), headers=CORS)
        return
    if request.method == "GET":
        route.fulfill(status=200, content_type="application/json", body=json.dumps(OLD), headers=CORS)
        return
    body = json.loads(request.post_data or "{}")
    LOG["put"] += 1
    if LOG["conflict_once"]:
        # «другое устройство» успело записать раньше
        LOG["conflict_once"](OLD["data"])
        LOG["conflict_once"] = None
        OLD["rev"] += 1
    if OLD["rev"] > body.get("base", 0):
        LOG["c409"] += 1
        route.fulfill(status=409, content_type="application/json", body=json.dumps({"conflict": True, "rev": OLD["rev"], "data": OLD["data"]}), headers=CORS)
        return
    OLD["rev"] += 1
    OLD["data"] = body["data"]
    route.fulfill(status=200, content_type="application/json", body=json.dumps({"ok": True, "rev": OLD["rev"]}), headers=CORS)


def jsonb(x):
    # как Postgres хранит jsonb: ключи объекта по длине, потом по байтам —
    # порядок, в котором их записала страница, не сохраняется
    if isinstance(x, list):
        return [jsonb(v) for v in x]
    if isinstance(x, dict):
        return {k: jsonb(x[k]) for k in sorted(x, key=lambda k: (len(k.encode()), k.encode()))}
    return x


def handle_sb(route, request):
    if request.method == "POST":
        LOG["sb_bodies"].append(request.post_data or "")
    B1.handle_db(route, request)
    if request.method == "POST":                # заглушка пишет всю базу разом
        d = json.loads(B1.STATE["db"])
        for r in d.get("ext_sync", []):
            r["base"] = jsonb(r.get("base"))
        B1.STATE["db"] = json.dumps(d)


def old_edit(fn):
    fn(OLD["data"])
    OLD["rev"] += 1


def les(d, day, start=None):
    return [l for l in d["lessons"] if l["day"] == day and (start is None or l["start_min"] == start)]


def ppl(d, lesson_id):
    return sorted([p for p in d["lesson_students"] if p["lesson_id"] == lesson_id], key=lambda p: p["pos"])


def by_ext(d, ext):
    xs = [l for l in d["lessons"] if l.get("ext_id") == ext]
    return xs[0] if xs else None


def row(day, rid):
    rs = [r for r in OLD["data"]["schedule"].get(day, {}).get("rows", []) if r.get("id") == rid]
    return rs[0] if rs else None


def run_sync(p):
    p.evaluate("() => { window.__syncDone = false; ScheduleSync.sync().then(() => { window.__syncDone = true; }); }")


def wait_sync(p, timeout=10000):
    p.wait_for_function("() => window.__syncDone === true", timeout=timeout)


def main():
    errors = []
    d0 = fresh_db()
    STATE["db"] = json.dumps(d0)
    STATE["offline"] = False
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = B1.new_context(browser, signed_in=True, bind="tab")
        ctx.route("https://fakesb.test/db", handle_sb)
        ctx.route(OLD_URL + "/data", handle_old)
        ctx.add_init_script(FIXED_NOW_JS)
        ctx.add_init_script("window.SCHEDULE_SYNC_DELAY = 300;")
        p = ctx.new_page()
        p.on("pageerror", lambda e: errors.append(str(e)))
        p.set_viewport_size({"width": 1280, "height": 900})
        B1.PUMP["page"] = p          # wait_until из B1 ждёт через эту страницу

        # ── A. импорт с предпросмотром ──
        p.goto(f"{BASE}/cabinet.html#/settings")
        p.wait_for_selector("#syncBox")
        check("A0 до настройки: «Не настроено», к старому не ходили", "Не настроено" in (p.text_content("#syState") or "") and not LOG["codes"])
        p.click("#syncBox summary")
        p.fill("#syUrl", OLD_URL + "/")
        p.fill("#syCode", CODE)
        p.click("#sySave")
        p.wait_for_selector(".sy-modal #syGo", timeout=10000)
        txt = p.inner_text(".sy-modal")
        check("A1 предпросмотр: занятия окна и шаблон", "Занятия: 6" in txt and "Шаблонов недели: 1" in txt, txt)
        check("A2 Ваня и Петя совпали по имени", "Ваня" in txt.split("свяжем по имени")[1].split("\n")[0] and "Петя" in txt.split("свяжем по имени")[1].split("\n")[0], txt)
        check("A3 Маша — новая, отмечена «завести»", p.is_checked('.sy-modal [data-new="Маша"]'))
        check("A4 Гоша — только в строках, останется гостем", "останутся гостями" in txt and "Гоша" in txt.split("останутся гостями")[1], txt)
        check("A5 прошлые занятия — галочка", p.is_checked("#syHist") and "прошлые занятия: 1" in txt, txt)
        check("A6 до подтверждения ничего не записано", not [x for x in db().get("lessons", [])] and LOG["put"] == 0)
        p.click("#syGo")
        p.wait_for_function("() => ScheduleSync.state.status === 'ok' && !ScheduleSync.state.busy", timeout=15000)
        d = db()
        masha = [s for s in d["students"] if s["name"] == "Маша"]
        check("A7 Маша заведена и привязана", len(masha) == 1 and masha[0].get("ext_name") == "Маша", str(masha))
        MASHA = masha[0]["id"] if masha else None
        vanya = [s for s in d["students"] if s["id"] == VANYA][0]
        check("A8 Ваня привязан по имени (ext_name)", vanya.get("ext_name") == "Ваня", str(vanya))
        l1 = by_ext(d, "r1")
        check("A9 16.11 15:00 пара: Маша и Петя, проведено", l1 and l1["start_min"] == 900 and l1["format"] == "pair"
              and [(x["student_id"], x["status"]) for x in ppl(d, l1["id"])] == [(MASHA, "done"), (PETYA, "done")], str(l1))
        l3 = by_ext(d, "r3")
        check("A10 длительность 90 из dur", l3 and l3["dur_min"] == 90 and l3["day"] == "2026-11-19")
        l4, l5 = by_ext(d, "r4"), by_ext(d, "r5")
        check("A11 полупараллелка → формат semi", l4 and l5 and l4["format"] == "semi" and l5["format"] == "semi")
        g = les(d, "2026-11-17")
        check("A12 Гоша — гость, не ученик", len(g) == 1 and ppl(d, g[0]["id"])[0]["guest_name"] == "Гоша"
              and ppl(d, g[0]["id"])[0]["student_id"] is None and not [s for s in d["students"] if s["name"] == "Гоша"], str(g))
        check("A13 прошлое занятие 03.08 перенесено", len(les(d, "2026-08-03")) == 1)
        tp = d.get("week_templates", [])
        slots = d.get("template_slots", [])
        check("A14 шаблон «Основной» активный, слот пн 15:00 на двоих", len(tp) == 1 and tp[0]["name"] == "Основной" and tp[0]["is_active"]
              and len(slots) == 1 and slots[0]["weekday"] == 1 and slots[0]["start_min"] == 900
              and len([x for x in d["template_slot_students"] if x["slot_id"] == slots[0]["id"]]) == 2, str(tp) + str(slots))
        es = d.get("ext_sync", [])
        check("A15 база сведения сохранена (ext_sync)", len(es) == 1 and es[0]["rev"] == OLD["rev"] and "d:2026-11-16" in es[0]["base"]["u"], str(es)[:300])
        g_row = OLD["data"]["schedule"]["2026-11-17"]["rows"]
        check("A16 в старое ушли id строкам без id, пустая строка-окно на месте", LOG["put"] >= 1 and g_row[0].get("id") and g_row[0]["names"] == "Гоша"
              and g_row[1] == {"time": "12:00", "names": ""}, str(g_row))
        # оплаты с В4(в) сводятся (test_prompt_cabinet_pay_sync.py): оплате без id
        # старого кабинет выдаёт id, остальные поля не трогает
        pays_no_id = [{k: v for k, v in x.items() if k != "id"} for x in OLD["data"]["payments"]]
        check("A17 скобки, цвет полупараллелки, оплаты, заметки не тронуты", row("2026-11-16", "r2")["names"] == "Ваня (онлайн)"
              and row("2026-11-20", "r4")["stgC"] == "#e2766c" and pays_no_id == OLD0["payments"] and OLD["data"]["payments"][0].get("id")
              and OLD["data"]["notes"] == "заметка", str(OLD["data"]["payments"]))
        check("A18 незнакомое имя Гоша предложено завести", p.locator('.sy-unk[data-name="Гоша"] [data-act="adopt"]').count() == 1, p.inner_text("#syUnknown"))
        r2_id = by_ext(d, "r2")["id"]

        # ── B. правка в кабинете уходит в старое (сама, после правки) ──
        put0 = LOG["put"]
        p.evaluate(f"""async () => {{
            const ps = (await window.supabase.createClient().from('lesson_students').select('*').eq('lesson_id', '{r2_id}'));
            await ScheduleCloud.setStatus(ps.data[0].id, 'done');
            await ScheduleCloud.addLesson({{ day: '2026-11-21', start_min: 600, dur_min: 60, format: 'single' }}, [{{ student_id: '{VANYA}' }}]);
        }}""")
        B1.wait_until(lambda: LOG["put"] > put0 and row("2026-11-16", "r2") and row("2026-11-16", "r2").get("st") == "done"
                      and OLD["data"]["schedule"].get("2026-11-21"), timeout=10)
        r2 = row("2026-11-16", "r2")
        check("B1 статус ✓ дошёл до старого, пометка в скобках цела", r2 and r2.get("st") == "done" and r2["names"] == "Ваня (онлайн)", str(r2))
        n21 = OLD["data"]["schedule"].get("2026-11-21", {}).get("rows", [])
        check("B2 новое занятие 21.11 в старом: 10:00 Ваня, с id", len(n21) == 1 and n21[0]["time"] == "10:00" and n21[0]["names"] == "Ваня"
              and n21[0].get("id", "").startswith("r") and not n21[0].get("fmt"), str(n21))
        p.wait_for_function("() => !ScheduleSync.state.busy", timeout=8000)
        check("B3 у нового занятия кабинета ext_id = id строки", by_ext(db(), n21[0]["id"]) is not None if n21 else False)

        # ── C. правка в старом приходит в кабинет ──
        p.evaluate("() => { window.SCHEDULE_SYNC_DELAY = 1e9; }")   # дальше синхронизируем вручную
        old_edit(lambda o: o["schedule"]["2026-11-19"]["rows"][0].update({"names": "Ваня, Петя"}))
        run_sync(p)
        wait_sync(p)
        d = db()
        l3 = by_ext(d, "r3")
        check("C1 Петя добавлен к занятию 19.11", [x["student_id"] for x in ppl(d, l3["id"])] == [VANYA, PETYA], str(ppl(d, l3["id"])))

        # ── D. разные дни в обоих местах ──
        put0 = LOG["put"]
        p.evaluate(f"() => ScheduleCloud.deleteLesson('{r2_id}')")
        old_edit(lambda o: o["schedule"]["2026-11-20"]["rows"][0].update({"time": "18:15"}))
        run_sync(p)
        wait_sync(p)
        d = db()
        check("D1 удаление в кабинете дошло: в старом 16.11 нет r2", row("2026-11-16", "r2") is None and row("2026-11-16", "r1") is not None)
        check("D2 правка старого дошла: r4 в 18:15", by_ext(d, "r4")["start_min"] == 18 * 60 + 15)
        check("D3 цвет полупараллелки r4 сохранился после правки времени", row("2026-11-20", "r4").get("stgC") == "#e2766c" and row("2026-11-20", "r4").get("stg") is True)
        check("D4 без окна конфликта", p.locator(".sy-modal").count() == 0)

        # ── E. один день в обоих местах — выбор ──
        l3 = by_ext(db(), "r3")
        p.evaluate(f"() => ScheduleCloud.updateLesson('{l3['id']}', {{ dur_min: 45 }})")
        old_edit(lambda o: o["schedule"]["2026-11-19"]["rows"][0].update({"time": "17:00"}))
        run_sync(p)
        p.wait_for_selector(".sy-modal [data-pick]", timeout=10000)
        txt = p.inner_text(".sy-modal")
        check("E1 окно: оба варианта дня 19.11", "В кабинете" in txt and "В старом приложении" in txt and "16:00" in txt and "17:00" in txt
              and "45 мин" in txt and "четверг, 19 ноября" in txt, txt)
        p.click('.sy-modal [data-pick="theirs"]')
        wait_sync(p)
        l3 = by_ext(db(), "r3")
        check("E2 выбран вариант старого: 17:00, 90 мин", l3["start_min"] == 17 * 60 and l3["dur_min"] == 90, str(l3))
        check("E3 в старом день 19.11 как был", row("2026-11-19", "r3")["time"] == "17:00" and row("2026-11-19", "r3")["dur"] == 90)

        # ── F. 409 ──
        l21 = les(db(), "2026-11-21")[0]
        p.evaluate(f"""async () => {{
            const ps = await window.supabase.createClient().from('lesson_students').select('*').eq('lesson_id', '{l21['id']}');
            await ScheduleCloud.setStatus(ps.data[0].id, 'skip');
        }}""")
        LOG["conflict_once"] = lambda o: o["schedule"].update({"2026-11-23": {"rows": [{"time": "11:00", "names": "Маша", "id": "r9"}], "total": None}})
        c0 = LOG["c409"]
        run_sync(p)
        wait_sync(p)
        d = db()
        r21 = OLD["data"]["schedule"]["2026-11-21"]["rows"][0]
        check("F1 409 получен и обработан", LOG["c409"] == c0 + 1)
        check("F2 правка кабинета (✕ 21.11) в старом после повтора", r21.get("st") == "skip", str(r21))
        check("F3 запись «другого устройства» (23.11) цела и пришла в кабинет", row("2026-11-23", "r9") is not None and by_ext(d, "r9") is not None)

        # ── G. незнакомое имя → гость; завести; переименование ──
        old_edit(lambda o: o["schedule"].update({"2026-11-24": {"rows": [{"time": "09:00", "names": "Даша", "id": "r10"}], "total": None}}))
        run_sync(p)
        wait_sync(p)
        d = db()
        l10 = by_ext(d, "r10")
        check("G1 Даша — гость, ученик молча не заведён", ppl(d, l10["id"])[0]["guest_name"] == "Даша" and not [s for s in d["students"] if s["name"] == "Даша"])
        p.wait_for_selector('.sy-unk[data-name="Даша"]')
        check("G2 Даша в списке «завести ученика»", "Даша" in p.inner_text("#syUnknown"))
        p.click('.sy-unk[data-name="Гоша"] [data-act="adopt"]')
        B1.wait_until(lambda: [s for s in db()["students"] if s["name"] == "Гоша"], timeout=8)
        d = db()
        gosha = [s for s in d["students"] if s["name"] == "Гоша"][0]
        gl = les(d, "2026-11-17")[0]
        check("G3 «Завести ученика»: Гоша — ученик, гость переведён", gosha.get("ext_name") == "Гоша" and ppl(d, gl["id"])[0]["student_id"] == gosha["id"]
              and ppl(d, gl["id"])[0]["guest_name"] is None, str(ppl(d, gl["id"])))
        p.evaluate(f"() => CabinetCloud.updateStudent('{PETYA}', {{ name: 'Пётр' }})")
        run_sync(p)
        wait_sync(p)
        names16 = row("2026-11-16", "r1")["names"]
        check("G4 переименование в кабинете: в строках старого", names16 == "Маша, Пётр" and row("2026-11-19", "r3")["names"] == "Ваня, Пётр", names16)
        check("G5 и в списке учеников и шаблоне старого", any(s["name"] == "Пётр" for s in OLD["data"]["students"]) and not any(s["name"] == "Петя" for s in OLD["data"]["students"])
              and OLD["data"]["templates"][0]["days"][0][0]["names"] == "Маша, Пётр")
        petya = [s for s in db()["students"] if s["id"] == PETYA][0]
        check("G6 привязка ученика обновлена", petya.get("ext_name") == "Пётр")
        run_sync(p)
        wait_sync(p)
        check("G7 повторная синхронизация ничего не пишет", p.evaluate("() => ScheduleSync.state.lastMine") == 0
              and p.evaluate("() => ScheduleSync.state.lastTheirs") == 0, str(p.evaluate("() => [ScheduleSync.state.lastMine, ScheduleSync.state.lastTheirs]")))

        # ── H. код не уходит в Supabase ──
        check("H1 код только в x-code к старому приложению", LOG["codes"] == {CODE})
        check("H2 ни один запрос к базе не содержит код", not any(CODE in b for b in LOG["sb_bodies"]) and CODE not in STATE["db"])
        check("H3 код лежит в localStorage этого браузера", p.evaluate("() => localStorage.getItem('cabinet:sync:code')") == CODE)

        # ── проверка: расписание кабинета открывается и показывает импорт ──
        p.goto(f"{BASE}/cabinet.html#/schedule/2026-11-16")
        try:
            p.wait_for_function("() => (document.getElementById('scHost').innerText || '').includes('Маша')", timeout=10000)
        except Exception:
            pass
        check("I0 расписание кабинета открывается, импорт виден", "Маша" in p.inner_text("#scHost"), p.inner_text("#scHost")[:400])

        check("I1 нет ошибок JavaScript", not errors, "; ".join(errors))
        browser.close()

    fails = B1.FAILS
    print(("\nПРОВАЛЕНО: " + ", ".join(fails)) if fails else "\nВсё прошло")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
