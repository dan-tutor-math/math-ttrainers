"""
Синхронизация оплат и ставок кабинета со старым приложением расписания,
задача В4(в) плана кабинета (schedule-sync.js, правила подсчёта — payments.js).

Старое приложение — заглушка /data (как в test_prompt_cabinet_sync.py), код —
выдуманная строка. Supabase — заглушка из test_prompt_b1_student_memory.py;
база сведения (ext_sync.base) хранится с переставленными ключами, как jsonb.
Дата в браузере: среда 18.11.2026, 12:00.

Данные похожи на настоящие (формат оплат старого index.ts): у Маши три
абонемента — истёкший руками и в архиве, закрытый следующей оплатой с
переносом перебора (carry 1) и текущий; у Пети абонемент «Абонемент истёк»
15.11, занятие до первой оплаты, после конца и «(пробное)»; у Вани оплат нет;
оплата Гоши — его нет в списке учеников; одна строка таблицы недописана.

Проверяет:
  0. расписание уже синхронизировано без оплат (таблиц оплат ещё нет — как
     до В4(в)): база без разделов оплат, оплаты старого не тронуты;
  A. первый запуск после обновления: предпросмотр импорта оплат сам при
     открытии кабинета; «Позже» — расписание сводится, оплат нет, статус
     «оплаты ждут импорта», сами больше не спрашиваем; «Синхронизировать
     сейчас» — снова предпросмотр, «Импортировать оплаты» — оплаты, ставки,
     перенос перебора (adjust), ручной конец, архив, гость, флаг «(пробное)»;
  N. цифры кабинета как в старом: у Маши осталось 3 из 8 и долга нет, у Пети
     сгорело 2 и долга нет (занятие до оплаты, после конца и пробное не в
     счёт), у Вани без оплат долга нет; на вкладке «Оплаты» — то же;
  B. кабинет → старое: новая оплата, ставка с даты, «как платит», правка
     прошло (adj с учётом принесённого переноса), флаг у имени, новая оплата
     закрывает прошлый абонемент в старом (closed auto), payFlags;
  C. старое → кабинет: новая оплата, сумма, ставка, ручной конец, удаление
     оплаты — только после вопроса;
  D. одну оплату правили в обоих местах — окно выбора; удаление в кабинете —
     вопрос, «Вернуть оплату» возвращает;
  E. повторная синхронизация ничего не пишет (jsonb не даёт ложных правок);
  H. код доступа не уходит в Supabase; нет ошибок JavaScript.

Запуск: ~/.venvs/trainers/bin/python test_prompt_cabinet_pay_sync.py
"""
import copy
import json
import re
import sys

from playwright.sync_api import sync_playwright

import test_prompt_b1_student_memory as B1
import test_prompt_cabinet_sync as SY          # даёт gte/lte/lt заглушке и jsonb в handle_sb
from test_prompt_b1_student_memory import BASE, PETYA, STATE, TEACHER, VANYA, check, db, fresh_db, local_server

# «таблиц оплат ещё нет» (cabinet-payments.sql не выполнен) — пока стоит флаг
B1.FAKE_SB_JS = B1.FAKE_SB_JS.replace(
    "    run(db){\n",
    "    run(db){\n"
    "      if (localStorage.getItem('__noPay') && (this.t === 'payments' || this.t === 'student_rates')) throw new Error('relation \"public.' + this.t + '\" does not exist');\n", 1)
assert "__noPay" in B1.FAKE_SB_JS

CODE, OLD_URL, CORS = SY.CODE, SY.OLD_URL, SY.CORS
OWNER = TEACHER["id"]


def r(rid, time, names, st=None):
    o = {"time": time, "names": names, "id": rid}
    if st:
        o["st"] = st
    return o


def day(*rows):
    return {"rows": list(rows), "total": None}


OLD0 = {
    "students": [
        {"name": "Маша", "tag": "уч. год", "price": "1500", "per": "2", "monthly": None, "rates": [{"until": "2026-10-01", "price": "1200"}]},
        {"name": "Петя", "tag": "уч. год", "price": "2000", "per": "1", "monthly": None},
        {"name": "Ваня", "tag": "уч. год", "price": "1800", "per": "2", "monthly": None},
    ],
    "schedule": {
        "2026-10-21": day(r("m1", "15:00", "Маша", "done")),
        "2026-10-23": day(r("m2", "15:00", "Маша", "done")),
        "2026-10-25": day(r("p0", "11:00", "Петя", "done")),
        "2026-10-28": day(r("m3", "15:00", "Маша", "done")),
        "2026-10-30": day(r("m4", "15:00", "Маша", "done")),
        "2026-11-02": day(r("v1", "12:00", "Ваня", "done"), r("m5", "15:00", "Маша", "done")),
        "2026-11-03": day(r("p1", "11:00", "Петя", "done")),
        "2026-11-06": day(r("m6", "15:00", "Маша", "done")),
        "2026-11-09": day(r("v2", "12:00", "Ваня", "done"), r("m7", "15:00", "Маша", "skip")),
        "2026-11-10": dict(day(r("p2", "11:00", "Петя", "done")), total="3000"),
        "2026-11-11": day(r("m8", "15:00", "Маша", "done")),
        "2026-11-12": day(r("p3", "11:00", "Петя (пробное)", "done")),
        "2026-11-13": day(r("m9", "15:00", "Маша", "done")),
        "2026-11-16": day(r("m10", "15:00", "Маша", "done")),
        "2026-11-17": day(r("p4", "11:00", "Петя", "done")),
        "2026-11-20": day(r("m11", "15:00", "Маша")),
        "2026-11-23": day(r("m12", "15:00", "Маша")),
    },
    "templates": [{"id": "tA", "name": "Основной", "days": [[], [], [r("s1", "15:00", "Маша")], [], [], [], []]}],
    "activeTpl": "tA",
    "payments": [
        {"id": "pB", "student": "Маша", "parent": "мама", "date": "2026-11-04", "amount": "12000", "lessons": "8", "remind": "2026-11-27", "done": False},
        {"student": "Гоша", "parent": "", "date": "2026-11-10", "amount": "12000", "lessons": "8", "remind": "", "done": False},
        {"student": "", "parent": "", "date": "2026-11-18", "amount": "", "lessons": "8", "remind": "", "done": False},
        {"id": "pC", "student": "Петя", "parent": "", "date": "2026-11-01", "amount": "8000", "lessons": "4", "remind": "", "done": False,
         "closed": "2026-11-15", "closedBy": "manual"},
        {"id": "pA", "student": "Маша", "parent": "мама", "date": "2026-10-20", "amount": "6000", "lessons": "4", "remind": "2026-10-30", "done": False,
         "closed": "2026-11-03", "closedBy": "auto", "closedFor": "pB", "carry": 1, "carryTo": "pB", "overOk": True},
        {"id": "pD", "student": "Маша", "parent": "мама", "date": "2026-09-01", "amount": "9600", "lessons": "8", "remind": "", "done": False,
         "closed": "2026-10-19", "closedBy": "manual", "arch": "2026-10-25"},
    ],
    "incomeGroups": [{"name": "Учебный год", "from": "2026-09-01", "to": "2027-05-31", "members": ["Маша"]}],
    "notes": "заметка",
}
OLD = {"rev": 500, "data": copy.deepcopy(OLD0)}
LOG = {"put": 0, "codes": set()}


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
    if OLD["rev"] > body.get("base", 0):
        route.fulfill(status=409, content_type="application/json", body=json.dumps({"conflict": True, "rev": OLD["rev"], "data": OLD["data"]}), headers=CORS)
        return
    LOG["put"] += 1
    OLD["rev"] += 1
    OLD["data"] = body["data"]
    route.fulfill(status=200, content_type="application/json", body=json.dumps({"ok": True, "rev": OLD["rev"]}), headers=CORS)


def old_edit(fn):
    fn(OLD["data"])
    OLD["rev"] += 1


def opay(pid):
    xs = [x for x in OLD["data"]["payments"] if x.get("id") == pid]
    return xs[0] if xs else None


def ostudent(name):
    return [s for s in OLD["data"]["students"] if s["name"] == name][0]


def cpay(d, ext):
    xs = [x for x in d.get("payments", []) if x.get("ext_id") == ext]
    return xs[0] if xs else None


def rates(d, sid):
    return sorted([(x["valid_from"], x["price"]) for x in d.get("student_rates", []) if x["student_id"] == sid])


def norm(t):
    return re.sub(r"\s+", " ", (t or "").replace(" ", " "))


def seed():
    d = fresh_db()
    d["student_task_log"] = []
    d["teacher_settings"] = [{"owner": OWNER, "settings": {"sessionBind": "tab", "pay": {"flags": [{"id": "trial", "name": "пробное", "free": True}]}}}]
    return d


def run_sync(p):
    p.evaluate("() => { window.__syncDone = false; ScheduleSync.sync().then(() => { window.__syncDone = true; }); }")


def wait_sync(p, timeout=15000):
    p.wait_for_function("() => window.__syncDone === true", timeout=timeout)


def idle(p, timeout=15000):
    p.wait_for_function("() => !ScheduleSync.state.busy && ['ok', 'wait_pay', 'error'].includes(ScheduleSync.state.status)", timeout=timeout)


NUMBERS_JS = """async () => {
  const data = await Payments.loadAll(), st = await CabinetCloud.listStudents(), set = await CabinetCloud.getSettings();
  const per = Payments.split(data, st), out = {};
  st.forEach(s => {
    const c = Payments.calc(Object.assign({}, per[s.id], { settings: set }));
    out[s.name] = { debt: c.debt, debtLessons: c.debtLessons, left: c.current ? c.current.left : null, cap: c.current ? c.current.cap : null,
      burned: c.packs.map(k => k.burned), used: c.packs.map(k => k.used) };
  });
  return out;
}"""


def main():
    errors = []
    STATE["db"] = json.dumps(seed())
    STATE["offline"] = False
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = B1.new_context(browser, signed_in=True, bind="tab")
        ctx.route("https://fakesb.test/db", SY.handle_sb)
        ctx.route(OLD_URL + "/data", handle_old)
        ctx.add_init_script(SY.FIXED_NOW_JS)
        ctx.add_init_script("window.SCHEDULE_SYNC_DELAY = 1e9;")      # синхронизируем руками
        ctx.add_init_script("if (!sessionStorage.getItem('__np')) { sessionStorage.setItem('__np', '1'); localStorage.setItem('__noPay', '1'); }")
        p = ctx.new_page()
        p.on("pageerror", lambda e: errors.append(str(e)))
        p.set_viewport_size({"width": 1280, "height": 900})
        B1.PUMP["page"] = p

        # ── 0. расписание синхронизировано до В4(в): таблиц оплат нет ──
        p.goto(f"{BASE}/cabinet.html#/settings")
        p.wait_for_selector("#syncBox")
        p.click("#syncBox summary")
        p.fill("#syUrl", OLD_URL)
        p.fill("#syCode", CODE)
        p.click("#sySave")
        p.wait_for_selector(".sy-modal #syGo", timeout=10000)
        txt0 = p.inner_text(".sy-modal")
        check("00 импорт расписания без оплат: про оплаты ни слова", "Оплаты из старого" not in txt0, txt0)
        p.click("#syGo")
        idle(p)
        d = db()
        es = d["ext_sync"][0]
        check("01 база без разделов оплат и без отметки pay", not es["base"].get("pay") and not [k for k in es["base"]["u"] if k[:2] in ("$:", "r:")], str(list(es["base"].keys())))
        check("02 оплаты старого не тронуты (id не раздавали)", OLD["data"]["payments"] == OLD0["payments"])
        check("03 Маша заведена", any(s["name"] == "Маша" for s in d["students"]))
        MASHA = [s for s in d["students"] if s["name"] == "Маша"][0]["id"]

        # ── A. обновление: таблицы есть, первый запуск ──
        p.evaluate("() => localStorage.removeItem('__noPay')")
        p.reload()                       # тот же адрес с якорем goto не перезагружает
        p.wait_for_selector(".sy-modal #syPayGo", timeout=15000)
        txt = norm(p.inner_text(".sy-modal"))
        check("A1 предпросмотр оплат сам при открытии: 5 оплат на 47 600 ₽, 3 ставки",
              "Оплаты из старого приложения: 5 на 47 600 ₽" in txt and "Ставки учеников: 3" in txt and "Ручных итогов дня: 1" in txt, txt)
        check("A2 Гоша придёт на имя (гостем)", "как гости" in txt and "Гоша" in txt.split("как гости")[1], txt)
        check("A3 до подтверждения оплат в кабинете нет", not db().get("payments"))
        p.click("#syPayNo")
        idle(p)
        d = db()
        check("A4 «Позже»: оплат и ставок нет, статус «оплаты ждут импорта»", not d.get("payments") and not d.get("student_rates")
              and p.evaluate("() => ScheduleSync.state.status") == "wait_pay" and "ждут импорта" in (p.text_content("#syState") or ""), p.text_content("#syState"))
        check("A5 база без отметки pay", not d["ext_sync"][0]["base"].get("pay"))
        p3 = [x for x in d["lessons"] if x.get("ext_id") == "p3"][0]
        p3p = [x for x in d["lesson_students"] if x["lesson_id"] == p3["id"]][0]
        check("A6 флаг «(пробное)» у Пети 12.11 пришёл в кабинет (флаги — часть дня)", p3p.get("flags") == ["trial"] and p3p["student_id"] == PETYA, str(p3p))
        p.evaluate("() => { window.__syncDone = false; ScheduleSync.syncAuto().then(() => { window.__syncDone = true; }); }")
        wait_sync(p)
        check("A7 сама больше не спрашивает (до перезагрузки)", p.locator(".sy-modal").count() == 0 and not db().get("payments"))
        run_sync(p)
        p.wait_for_selector(".sy-modal #syPayGo", timeout=10000)
        p.click("#syPayGo")
        wait_sync(p)
        d = db()
        check("A8 статус ok, база с отметкой pay и разделами оплат", p.evaluate("() => ScheduleSync.state.status") == "ok" and d["ext_sync"][0]["base"].get("pay") == 1
              and "$:pA" in d["ext_sync"][0]["base"]["u"] and "r:маша" in d["ext_sync"][0]["base"]["u"])
        pa, pb, pc, pd = cpay(d, "pA"), cpay(d, "pB"), cpay(d, "pC"), cpay(d, "pD")
        gid = [x.get("id") for x in OLD["data"]["payments"] if x["student"] == "Гоша"][0]
        pg = cpay(d, gid) if gid else None
        check("A9 пять оплат, недописанная строка не пришла", len(d.get("payments", [])) == 5 and all([pa, pb, pc, pd, pg]), str(d.get("payments"))[:500])
        check("A10 Гоше выдан id в старом, в кабинете — гость", gid and pg["guest_name"] == "Гоша" and pg["student_id"] is None and pg["kind"] == "pack" and pg["lessons"] == 8)
        check("A11 перенос перебора: у pA adjust −1, у pB +1", pa["adjust"] == -1 and pb["adjust"] == 1, f"{pa['adjust']} {pb['adjust']}")
        check("A12 поля: сумма, занятий, дата, кто платил", pb["amount"] == 12000 and pb["lessons"] == 8 and pb["paid_on"] == "2026-11-04" and pb["payer"] == "мама"
              and pb["student_id"] == MASHA and pb["kind"] == "pack" and pb["burn"] == "count")
        check("A13 «Абонемент истёк» → end_on; закрытый следующей (auto) — без конца", pc["end_on"] == "2026-11-15" and pa["end_on"] is None and pc["student_id"] == PETYA)
        check("A14 архив старого → archived_at", pd["archived_at"] and pd["archived_at"].startswith("2026-10-25") and pd["end_on"] == "2026-10-19" and pb["archived_at"] is None)
        check("A15 ставки Маши: 1 200 с начала, 1 500 с 01.10, раз в неделю 2", rates(d, MASHA) == [("2000-01-01", 1200), ("2026-10-01", 1500)]
              and [x for x in d["student_rates"] if x["student_id"] == MASHA and x["valid_from"] == "2026-10-01"][0]["per_week"] == 2, str(rates(d, MASHA)))
        check("A15а ручной итог дня 10.11 → day_totals", [(x["day"], x["amount"]) for x in d.get("day_totals", [])] == [("2026-11-10", 3000)], str(d.get("day_totals")))
        check("A16 ставки Пети и Вани", rates(d, PETYA) == [("2000-01-01", 2000)] and rates(d, VANYA) == [("2000-01-01", 1800)])
        check("A17 старое: payFlags для «(пробное)», группы дохода и заметки не тронуты",
              OLD["data"].get("payFlags") == [{"name": "пробное", "free": True}] and OLD["data"]["incomeGroups"] == OLD0["incomeGroups"] and OLD["data"]["notes"] == "заметка")
        check("A18 у оплат старого поля не тронуты (кроме id Гоше)", opay("pA") == OLD0["payments"][4] and opay("pB") == OLD0["payments"][0] and opay("pD") == OLD0["payments"][5])
        check("A19 Гоша предложен в «завести ученика»", "Гоша" in (p.text_content("#syUnknown") or ""), p.text_content("#syUnknown"))

        # ── N. цифры как в старом приложении ──
        n = p.evaluate(NUMBERS_JS)
        m, pt, v = n.get("Маша", {}), n.get("Петя", {}), n.get("Ваня", {})
        check("N1 Маша: осталось 3 из 8, долга нет (как в старом: прошло 4 + перенос 1)", m.get("left") == 3 and m.get("cap") == 8 and m.get("debt") == 0, str(m))
        check("N2 Петя: сгорело 2, долга нет (до оплаты, после конца, пробное — не в счёт)", pt.get("debt") == 0 and pt.get("burned") == [2] and pt.get("used") == [2]
              and pt.get("left") is None, str(pt))
        check("N3 Ваня без оплат — долга нет", v.get("debt") == 0 and v.get("debtLessons") == 0, str(v))
        p.goto(f"{BASE}/cabinet.html#/payments")
        p.wait_for_selector(f'.pay-row[data-sid="{MASHA}"]', timeout=10000)
        mrow = norm(p.inner_text(f'.pay-row[data-sid="{MASHA}"]'))
        check("N4 вкладка «Оплаты»: Маша — осталось 3 из 8, должников нет", "осталось 3 из 8" in mrow and "никто" in p.inner_text("#payDebt"), mrow + " | " + p.inner_text("#payDebt"))
        idle(p)
        p.goto(f"{BASE}/cabinet.html#/settings")
        p.wait_for_selector("#syncBox")
        idle(p)

        # ── B. кабинет → старое ──
        m10 = [x for x in db()["lessons"] if x.get("ext_id") == "m10"][0]
        m10p = [x for x in db()["lesson_students"] if x["lesson_id"] == m10["id"]][0]
        nv = p.evaluate(f"""async () => {{
            const P = window.Payments;
            const v = await P.addPayment({{ student_id: '{VANYA}', kind: 'pack', paid_on: '2026-11-18', amount: 14400, lessons: 8, burn: 'count', payer: 'папа' }});
            const ex = (await window.supabase.createClient().from('student_rates').select('*').eq('student_id', '{VANYA}')).data;
            await P.setRate('{VANYA}', {{ valid_from: '2026-12-01', price: 2000 }}, ex);
            await P.setMode('{PETYA}', 'lesson');
            const mr = (await window.supabase.createClient().from('student_rates').select('*').eq('student_id', '{MASHA}')).data.find(x => x.valid_from === '2026-10-01');
            await P.setRateExtra(mr.id, {{ monthly: 13000 }});
            await P.setDayTotal('2026-11-11', 2500);
            await P.setDayTotal('2026-11-10', '');
            await P.updatePayment('{pb['id']}', {{ adjust: 2 }});
            await ScheduleCloud.setPart('{m10p['id']}', {{ flags: ['trial'] }});
            const m = await P.addPayment({{ student_id: '{MASHA}', kind: 'pack', paid_on: '2026-11-18', amount: 12000, lessons: 8, burn: 'count' }});
            return [v.id, m.id];
        }}""")
        run_sync(p)
        wait_sync(p)
        d = db()
        vx = [x for x in d["payments"] if x["id"] == nv[0]][0]
        mx = [x for x in d["payments"] if x["id"] == nv[1]][0]
        ov, om = opay(vx.get("ext_id")), opay(mx.get("ext_id"))
        check("B1 новая оплата Вани в старом: сумма, занятий, кто платил, id = ext_id", ov and ov["student"] == "Ваня" and ov["amount"] == "14400"
              and ov["lessons"] == "8" and ov["parent"] == "папа" and ov["date"] == "2026-11-18", str(ov))
        check("B2 ставка Вани с 01.12: в старом 2000, раньше 1800", ostudent("Ваня")["price"] == "2000" and ostudent("Ваня").get("rates") == [{"until": "2026-12-01", "price": "1800"}],
              str(ostudent("Ваня")))
        check("B3 «как платит» Петя → payMode в старом", ostudent("Петя").get("payMode") == "lesson")
        check("B3а ручное «в месяц» Маши (В4(б)) → monthly в старом", ostudent("Маша").get("monthly") == 13000 and ostudent("Маша")["per"] == "2", str(ostudent("Маша")))
        check("B4 правка «прошло» +2 у pB: adj = 2 − принесённый перенос 1", opay("pB").get("adj") == 1 and opay("pA").get("carryTo") == "pB", str(opay("pB")))
        check("B5 флаг у имени: «Маша (пробное)» в строке 16.11", OLD["data"]["schedule"]["2026-11-16"]["rows"][0]["names"] == "Маша (пробное)",
              OLD["data"]["schedule"]["2026-11-16"]["rows"][0]["names"])
        check("B6 новая оплата Маши закрыла pB в старом (closed auto накануне)", opay("pB").get("closed") == "2026-11-17" and opay("pB").get("closedBy") == "auto"
              and opay("pB").get("closedFor") == mx.get("ext_id") and om and om["student"] == "Маша", str(opay("pB")))
        check("B6а ручной итог дня: 11.11 → 2500 в старом, 10.11 снят (расчёт)", OLD["data"]["schedule"]["2026-11-11"].get("total") == 2500
              and OLD["data"]["schedule"]["2026-11-10"].get("total") is None and OLD["data"]["schedule"]["2026-11-10"]["rows"], str(OLD["data"]["schedule"]["2026-11-10"]))
        check("B7 заметки и группы дохода старого целы", OLD["data"]["notes"] == "заметка" and OLD["data"]["incomeGroups"] == OLD0["incomeGroups"])

        # ── C. старое → кабинет ──
        def c_edit(o):
            o["payments"].insert(0, {"id": "pE", "student": "Петя", "parent": "", "date": "2026-11-17", "amount": "8000", "lessons": "4", "remind": "", "done": False})
            [x for x in o["payments"] if x.get("id") == gid][0]["amount"] = "13000"
            [x for x in o["students"] if x["name"] == "Маша"][0]["price"] = "1600"
            [x for x in o["payments"] if x.get("id") == "pC"][0]["closed"] = "2026-11-14"
            o["payments"] = [x for x in o["payments"] if x.get("id") != "pD"]
            o["schedule"]["2026-11-13"]["total"] = "4100"
        old_edit(c_edit)
        run_sync(p)
        p.wait_for_selector(".sy-modal [data-pick]", timeout=10000)
        txt = norm(p.inner_text(".sy-modal"))
        check("C1 удаление в старом — вопрос с оплатой", "Оплату удалили в старом приложении" in txt and "01.09.2026" in txt and "9 600" in txt, txt)
        p.click('.sy-modal [data-pick="del"]')
        wait_sync(p)
        d = db()
        pe = cpay(d, "pE")
        check("C2 новая оплата Пети пришла", pe and pe["student_id"] == PETYA and pe["amount"] == 8000 and pe["lessons"] == 4 and pe["paid_on"] == "2026-11-17")
        check("C3 сумма Гоши 13 000", cpay(d, gid)["amount"] == 13000)
        check("C4 ставка Маши с 01.10 → 1 600", rates(d, MASHA) == [("2000-01-01", 1200), ("2026-10-01", 1600)], str(rates(d, MASHA)))
        check("C5 ручной конец pC → 14.11", cpay(d, "pC")["end_on"] == "2026-11-14")
        check("C6 «Удалить и там»: pD удалена в кабинете", cpay(d, "pD") is None)
        check("C6а итог дня 13.11 из старого → day_totals", sorted((x["day"], x["amount"]) for x in d.get("day_totals", [])) == [("2026-11-11", 2500), ("2026-11-13", 4100)], str(d.get("day_totals")))
        check("C7 «как платит» Пети не сброшен", [s for s in d["students"] if s["id"] == PETYA][0].get("pay_mode") == "lesson")

        # ── D. конфликт одной оплаты и удаление в кабинете ──
        gx = cpay(db(), gid)
        p.evaluate(f"() => Payments.updatePayment('{gx['id']}', {{ amount: 15000 }})")
        old_edit(lambda o: [x for x in o["payments"] if x.get("id") == gid][0].update({"amount": "14000"}))
        run_sync(p)
        p.wait_for_selector(".sy-modal [data-pick]", timeout=10000)
        txt = norm(p.inner_text(".sy-modal"))
        check("D1 окно: оплату Гоши правили в обоих местах, обе суммы", "Правили в обоих местах" in txt and "Оплату (Гоша)" in txt and "15 000" in txt and "14 000" in txt, txt)
        p.click('.sy-modal [data-pick="theirs"]')
        wait_sync(p)
        check("D2 выбран вариант старого: 14 000 в обоих местах", cpay(db(), gid)["amount"] == 14000 and opay(gid)["amount"] == "14000")
        p.evaluate(f"() => Payments.deletePayment('{nv[0]}')")
        run_sync(p)
        p.wait_for_selector(".sy-modal [data-pick]", timeout=10000)
        txt = norm(p.inner_text(".sy-modal"))
        check("D3 удаление в кабинете — вопрос", "Оплату удалили в кабинете" in txt and "Ваня" in txt and "14 400" in txt, txt)
        p.click('.sy-modal [data-pick="keep"]')
        wait_sync(p)
        back = cpay(db(), vx["ext_id"])
        check("D4 «Вернуть оплату»: снова в кабинете, в старом на месте", back is not None and back["amount"] == 14400 and opay(vx["ext_id"]) is not None)

        # ── E. повтор ничего не пишет ──
        put0 = LOG["put"]
        run_sync(p)
        wait_sync(p)
        check("E1 повторная синхронизация: ни в старое, ни в кабинет", p.evaluate("() => [ScheduleSync.state.lastMine, ScheduleSync.state.lastTheirs]") == [0, 0]
              and LOG["put"] == put0 and p.locator(".sy-modal").count() == 0, str(p.evaluate("() => [ScheduleSync.state.lastMine, ScheduleSync.state.lastTheirs]")))
        p.reload()
        p.wait_for_selector("#syncBox")
        idle(p)
        check("E2 после перезагрузки (база из jsonb) — тоже без правок и вопросов", p.evaluate("() => [ScheduleSync.state.lastMine, ScheduleSync.state.lastTheirs]") == [0, 0]
              and p.locator(".sy-modal").count() == 0 and LOG["put"] == put0, str(p.evaluate("() => [ScheduleSync.state.status, ScheduleSync.state.lastMine, ScheduleSync.state.lastTheirs]")))

        # ── H ──
        check("H1 код только в x-code к старому приложению", LOG["codes"] == {CODE})
        check("H2 ни один запрос к базе не содержит код", not any(CODE in b for b in SY.LOG["sb_bodies"]) and CODE not in STATE["db"])
        check("H3 нет ошибок JavaScript", not errors, "; ".join(errors))
        browser.close()

    fails = B1.FAILS
    print(("\nПРОВАЛЕНО: " + ", ".join(fails)) if fails else "\nВсё прошло")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
