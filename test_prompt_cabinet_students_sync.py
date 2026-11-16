"""
Ученики кабинета и старого приложения расписания совпадают (16.11.2026,
«в старом 23 ученика и 10 в архиве, в кабинете 22 и 7»), schedule-sync.js.

Старое приложение — заглушка /data из test_prompt_cabinet_sync.py, Supabase —
заглушка из test_prompt_b1_student_memory.py. Дата — среда 18.11.2026.

Что ломалось (воспроизведено этим тестом на коде до правки):
  - новый ученик старого (Костя, Даша2, Елизавета) в кабинете не заводился —
    только строчка «завести ученика» в настройках;
  - архивные ученики старого при импорте по умолчанию не заводились (галочка
    снята) — архив кабинета меньше архива старого;
  - ученики сводились по имени: переименование в старом вместе с любой другой
    правкой учеников (новый ученик) отправляло ученика кабинета в архив, а новое
    имя — в «завести ученика», то есть второй записью;
  - архив из кабинета писал в старое arch: true вместо даты — «в архиве с …»
    в старом падало.

Проверяет:
  A. импорт: у каждого ученика старого постоянный id; все ученики старого есть в
     кабинете, архивные — в архиве, счётчики совпадают; похожий ученик кабинета
     («Андрей Ребенков» ~ «Андрей») — пара на решение, не заведён и не отправлен
     в старое; дубль внутри кабинета («Лиза К» ~ «Лиза») — в списке, сам не слит;
  B. новый ученик в старом заводится сам, привязан к занятию, ставка пришла;
  C. «Вернуть» из архива в старом — та же запись кабинета, id в старом тот же,
     новых записей нет нигде;
  D. архив и «Вернуть» в кабинете — в старом дата / null у той же записи;
  E. переименование в старом + новый ученик разом — та же запись переименована,
     не в архиве, занятия на месте; новый заведён;
  F. «Это один ученик» — связь без новой записи, имя из старого;
  G. «Слить» (с подтверждением) — занятие и оплата переходят, второй в архиве,
     не удалён; без подтверждения ничего не меняется;
  H. повторная синхронизация ничего не пишет, учеников не прибавляется;
  I. arch: true в старом чинится в дату;
  J. база до правки (v1, s:<имя>) переводится на id; переименованный до
     перехода ученик не уходит в архив и не дублируется — пара на решение;
  K. данные не теряются: строки учеников кабинета не удалены, ставки целы;
  L. нет ошибок JavaScript.

Запуск: ~/.venvs/trainers/bin/python test_prompt_cabinet_students_sync.py
"""
import copy
import json
import sys

from playwright.sync_api import sync_playwright

import test_prompt_b1_student_memory as B1
import test_prompt_cabinet_sync as T
from test_prompt_b1_student_memory import BASE, PETYA, STATE, TEACHER, VANYA, check, db, fresh_db, local_server

ANDREY = "aaaaaaaa-0000-4000-8000-0000000000a1"
LIZA = "aaaaaaaa-0000-4000-8000-0000000000a2"
LIZA_K = "aaaaaaaa-0000-4000-8000-0000000000a3"


def stu(i, n, **kw):
    s = {"id": i, "owner": TEACHER["id"], "name": n, "grade": None, "exam": "oge", "note": "", "boards": [],
         "dur_min": None, "account_email": None, "archived_at": None, "ext_name": None,
         "created_at": "2026-01-01T00:00:00Z", "updated_at": "2026-01-01T00:00:00Z"}
    s.update(kw)
    return s


def old_st(n, price="1500", per="1", arch=None, **kw):
    s = {"name": n, "tag": "уч. год", "price": price, "per": per, "monthly": None}
    if arch:
        s["arch"] = arch
    s.update(kw)
    return s


def mine(d):
    return [s for s in d["students"] if s.get("owner") == TEACHER["id"]]


def by_name(d, n):
    return [s for s in mine(d) if s["name"] == n]


def old_by(n):
    return [s for s in T.OLD["data"]["students"] if s["name"] == n]


def link(d):
    es = d.get("ext_sync", [])
    return (es[0]["base"].get("link") or {}) if es else {}


def sync(p):
    T.run_sync(p)
    T.wait_sync(p, timeout=15000)


def new_ctx(pw, errors):
    br = pw.chromium.launch()
    ctx = B1.new_context(br, signed_in=True, bind="tab")
    ctx.route("https://fakesb.test/db", T.handle_sb)
    ctx.route(T.OLD_URL + "/data", T.handle_old)
    ctx.add_init_script(T.FIXED_NOW_JS)
    ctx.add_init_script("window.SCHEDULE_SYNC_DELAY = 1e9;")      # синхронизируем вручную
    p = ctx.new_page()
    p.on("pageerror", lambda e: errors.append(str(e)))
    p.set_viewport_size({"width": 1280, "height": 900})
    B1.PUMP["page"] = p
    return br, p


def connect(p):
    p.goto(f"{BASE}/cabinet.html#/settings")
    p.wait_for_selector("#syncBox")
    p.click("#syncBox summary")
    p.fill("#syUrl", T.OLD_URL + "/")
    p.fill("#syCode", T.CODE)
    p.click("#sySave")


def phase_main(pw, errors):
    d0 = fresh_db()
    d0["students"] = [s for s in d0["students"] if s["owner"] != TEACHER["id"]] + [
        stu(VANYA, "Ваня"), stu(PETYA, "Петя"),
        stu(ANDREY, "Андрей Ребенков"),              # завели в кабинете полным именем, в старом «Андрей»
        stu(LIZA, "Лиза"), stu(LIZA_K, "Лиза К"),    # «Лиза К» — дубль Лизы, с занятием и оплатой
    ]
    d0["lessons"] = [{"id": "L-k", "owner": TEACHER["id"], "day": "2026-11-17", "start_min": 600, "dur_min": 60, "format": "single",
                      "is_event": False, "title": "", "note": "", "group_id": None, "ext_id": None}]
    d0["lesson_students"] = [{"id": "LS-k", "owner": TEACHER["id"], "lesson_id": "L-k", "student_id": LIZA_K, "guest_name": None,
                              "status": "done", "pos": 0, "flags": []}]
    d0["payments"] = [{"id": "P-k", "owner": TEACHER["id"], "student_id": LIZA_K, "guest_name": None, "kind": "single", "paid_on": "2026-11-17",
                       "amount": 1800, "lessons": None, "burn": None, "start_on": None, "end_on": None, "adjust": 0,
                       "lesson_student_id": "LS-k", "payer": None, "archived_at": None, "ext_id": None}]
    d0["student_rates"] = [{"id": "R-v", "owner": TEACHER["id"], "student_id": VANYA, "valid_from": "2000-01-01", "price": 2000, "per_week": 1, "monthly": None}]
    STATE["db"] = json.dumps(d0)
    T.OLD["rev"] = 1000
    T.OLD["data"] = {
        "students": [old_st("Маша"), old_st("Петя"), old_st("Ваня", "2000"), old_st("Андрей", "1800"), old_st("Лиза", "1800"),
                     old_st("Лена", "1800", arch="2026-10-01"), old_st("Оля", "1800", arch="2026-10-02")],
        "schedule": {"2026-11-16": {"rows": [{"time": "15:00", "names": "Маша, Петя", "id": "r1"},
                                             {"time": "17:00", "names": "Андрей", "id": "r9"}], "total": None}},
        "templates": [], "payments": [], "notes": "",
    }
    br, p = new_ctx(pw, errors)
    connect(p)
    p.wait_for_selector(".sy-modal #syGo", timeout=10000)
    txt = p.inner_text(".sy-modal")
    check("A0 предпросмотр: архивные тоже заводятся, Андрей — «похож»", "Лена" in txt and "Оля" in txt and "Похожи" in txt and "Андрей Ребенков" in txt, txt)
    p.click("#syGo")
    p.wait_for_function("() => ScheduleSync.state.status === 'ok' && !ScheduleSync.state.busy", timeout=15000)
    d = db()
    ids = [s.get("id") for s in T.OLD["data"]["students"]]
    check("A1 у каждого ученика старого постоянный id, без повторов", all(ids) and len(set(ids)) == len(ids), str(ids))
    old_arch = [s["name"] for s in T.OLD["data"]["students"] if s.get("arch")]
    cab_arch = [s["name"] for s in mine(d) if s.get("archived_at")]
    check("A2 архив: счётчики совпадают (Лена, Оля)", sorted(old_arch) == sorted(cab_arch) == ["Лена", "Оля"], f"{old_arch} / {cab_arch}")
    L = link(d)
    linked_names = sorted(s["name"] for s in mine(d) if s["id"] in L.values())
    old_names = sorted(s["name"] for s in T.OLD["data"]["students"] if s["name"] != "Андрей")
    check("A3 все ученики старого (кроме «похожего» Андрея) привязаны по id", linked_names == old_names, f"{linked_names} / {old_names}")
    check("A4 Андрей не заведён вторым, «Андрей Ребенков» не отправлен в старое",
          not by_name(d, "Андрей") and len(by_name(d, "Андрей Ребенков")) == 1 and not old_by("Андрей Ребенков"))
    pairs = p.evaluate("() => ScheduleSync.state.pairs")
    check("A5 пара на решение: Андрей ~ Андрей Ребенков", len(pairs) == 1 and pairs[0]["n"] == "Андрей" and pairs[0]["cands"][0]["id"] == ANDREY, str(pairs))
    dups = p.evaluate("() => ScheduleSync.state.dups")
    check("A6 дубль Лиза ← Лиза К в списке, сам не слит", len(dups) == 1 and dups[0]["keep"]["id"] == LIZA and dups[0]["drop"]["id"] == LIZA_K
          and not [s for s in mine(d) if s["id"] == LIZA_K][0].get("archived_at"), str(dups))
    check("A7 «Лиза К» не отправлена в список старого", not old_by("Лиза К") and len(T.OLD["data"]["students"]) == 7)
    check("A8 в настройках видны пара и дубль с кнопками", p.locator('.sy-pair [data-act="link"]').count() == 1 and p.locator('.sy-dup [data-act="merge"]').count() == 1,
          p.inner_text("#syPairs"))
    n_cab = len(mine(d))

    # ── B. новый ученик в старом ──
    T.old_edit(lambda o: (o["students"].append(old_st("Костя", "1800", "1")),
                          o["schedule"]["2026-11-16"]["rows"].append({"time": "18:00", "names": "Костя", "id": "r2"})))
    sync(p)
    d = db()
    k = by_name(d, "Костя")
    check("B1 Костя заведён сам, один, привязан", len(k) == 1 and k[0]["id"] in link(d).values() and k[0].get("ext_name") == "Костя", str(k))
    lk = T.by_ext(d, "r2")
    check("B2 занятие Кости — на ученике, не гость", lk and T.ppl(d, lk["id"])[0]["student_id"] == (k[0]["id"] if k else None), str(lk))
    rk = [r for r in d.get("student_rates", []) if k and r["student_id"] == k[0]["id"]]
    check("B3 ставка Кости из старого: 1800, раз в неделю", len(rk) == 1 and rk[0]["price"] == 1800 and rk[0]["per_week"] == 1, str(rk))
    check("B4 нет незнакомых имён", p.evaluate("() => ScheduleSync.state.unknown") == [])

    # ── C. «Вернуть» из архива в старом ──
    lena_id = old_by("Лена")[0]["id"]
    lena_cab = by_name(d, "Лена")[0]["id"]
    n_old, n_cab = len(T.OLD["data"]["students"]), len(mine(d))
    T.old_edit(lambda o: [s.update({"arch": None}) for s in o["students"] if s["name"] == "Лена"])
    sync(p)
    d = db()
    lc = by_name(d, "Лена")
    check("C1 та же запись кабинета вышла из архива", len(lc) == 1 and lc[0]["id"] == lena_cab and not lc[0].get("archived_at"), str(lc))
    check("C2 новых записей нет нигде, id в старом тот же", len(mine(d)) == n_cab and len(T.OLD["data"]["students"]) == n_old
          and old_by("Лена")[0]["id"] == lena_id)
    T.old_edit(lambda o: [s.update({"arch": "2026-11-18"}) for s in o["students"] if s["name"] == "Лена"])
    sync(p)
    T.old_edit(lambda o: [s.update({"arch": None}) for s in o["students"] if s["name"] == "Лена"])
    sync(p)
    d = db()
    check("C3 архив → вернуть ещё раз: всё та же одна запись", len(by_name(d, "Лена")) == 1 and not by_name(d, "Лена")[0].get("archived_at")
          and len(old_by("Лена")) == 1 and len(mine(d)) == n_cab)

    # ── D. архив и «Вернуть» в кабинете ──
    masha = by_name(d, "Маша")[0]["id"]
    masha_old = old_by("Маша")[0]["id"]
    p.evaluate(f"() => CabinetCloud.setArchived('{masha}', true)")
    sync(p)
    check("D1 в старом — дата архива, не true", old_by("Маша")[0].get("arch") == "2026-11-18", str(old_by("Маша")))
    p.evaluate(f"() => CabinetCloud.setArchived('{masha}', false)")
    sync(p)
    check("D2 «Вернуть» в кабинете: в старом arch снят у той же записи", len(old_by("Маша")) == 1 and not old_by("Маша")[0].get("arch")
          and old_by("Маша")[0]["id"] == masha_old and len(T.OLD["data"]["students"]) == n_old)

    # ── E. переименование в старом + новый ученик в одной синхронизации ──
    def ren(o):
        for s in o["students"]:
            if s["name"] == "Петя":
                s["name"] = "Пётр"
        o["schedule"]["2026-11-16"]["rows"][0]["names"] = "Маша, Пётр"
        o["students"].append(old_st("Даша2", "1800"))
    T.old_edit(ren)
    sync(p)
    d = db()
    pe = [s for s in mine(d) if s["id"] == PETYA][0]
    check("E1 та же запись (Петя) переименована в «Пётр», не в архиве", pe["name"] == "Пётр" and not pe.get("archived_at") and pe.get("ext_name") == "Пётр", str(pe))
    l1 = T.by_ext(d, "r1")
    check("E2 занятие 16.11 — по-прежнему на этой записи", l1 and PETYA in [x["student_id"] for x in T.ppl(d, l1["id"])])
    check("E3 Даша2 заведена, Пётр вторым не заведён", len(by_name(d, "Даша2")) == 1 and len(by_name(d, "Пётр")) == 1
          and p.evaluate("() => ScheduleSync.state.unknown") == [])

    # ── F. «Это один ученик» ──
    n_cab, n_old = len(mine(d)), len(T.OLD["data"]["students"])
    p.click('.sy-pair[data-cab="%s"] [data-act="link"]' % ANDREY)
    p.wait_for_function("() => !ScheduleSync.state.busy && ScheduleSync.state.pairs.length === 0", timeout=15000)
    d = db()
    an = [s for s in mine(d) if s["id"] == ANDREY][0]
    andrey_old = old_by("Андрей")[0]["id"] if old_by("Андрей") else None
    check("F1 связаны без новой записи, имя из старого", an["name"] == "Андрей" and link(d).get(andrey_old) == ANDREY
          and len(mine(d)) == n_cab and len(T.OLD["data"]["students"]) == n_old, str(an))
    l9 = T.by_ext(d, "r9")
    check("F2 занятие Андрея — на этой записи", l9 and T.ppl(d, l9["id"])[0]["student_id"] == ANDREY, str(l9))

    # ── G. слияние дубля — только по подтверждению ──
    p.once("dialog", lambda dl: dl.dismiss())
    p.click('.sy-dup [data-act="merge"]')
    p.wait_for_timeout(400)
    d = db()
    check("G1 «Отмена» — ничего не слито", [x for x in d["lesson_students"] if x["id"] == "LS-k"][0]["student_id"] == LIZA_K
          and not [s for s in mine(d) if s["id"] == LIZA_K][0].get("archived_at"))
    p.once("dialog", lambda dl: dl.accept())
    p.click('.sy-dup [data-act="merge"]')
    try:
        p.wait_for_function("() => !ScheduleSync.state.busy && ScheduleSync.state.dups.length === 0", timeout=15000)
    except Exception:
        print("DEBUG", p.inner_text("#toast"), p.evaluate("() => JSON.stringify(ScheduleSync.state)"))
        raise
    d = db()
    lk2 = [s for s in mine(d) if s["id"] == LIZA_K]
    check("G2 занятие и оплата перешли к Лизе", [x for x in d["lesson_students"] if x["id"] == "LS-k"][0]["student_id"] == LIZA
          and [x for x in d["payments"] if x["id"] == "P-k"][0]["student_id"] == LIZA)
    check("G3 «Лиза К» в архиве, не удалена, без привязки", len(lk2) == 1 and lk2[0].get("archived_at") and not lk2[0].get("ext_name"), str(lk2))
    rk17 = T.OLD["data"]["schedule"].get("2026-11-17", {}).get("rows", [])
    check("G4 в старом занятие 17.11 — на Лизе", any(r["names"] == "Лиза" for r in rk17), str(rk17))

    # ── H. повторная синхронизация ничего не пишет ──
    n_cab, n_old = len(mine(d)), len(T.OLD["data"]["students"])
    put0 = T.LOG["put"]
    sync(p)
    sync(p)
    d = db()
    check("H1 повтор: в старое ничего, учеников столько же", T.LOG["put"] == put0 and p.evaluate("() => ScheduleSync.state.lastMine") == 0
          and len(mine(d)) == n_cab and len(T.OLD["data"]["students"]) == n_old, f"put {T.LOG['put']} vs {put0}")
    act_old = sorted(s["name"] for s in T.OLD["data"]["students"] if not s.get("arch"))
    act_cab = sorted(s["name"] for s in mine(d) if not s.get("archived_at"))
    arch_old = sum(1 for s in T.OLD["data"]["students"] if s.get("arch"))
    arch_cab_linked = sum(1 for s in mine(d) if s.get("archived_at") and s["id"] in link(d).values())
    check("H2 действующие совпадают поимённо, архив старого = архив кабинета (привязанные)", act_old == act_cab and arch_old == arch_cab_linked,
          f"{act_old} / {act_cab}; {arch_old} / {arch_cab_linked}")

    # ── I. arch: true в старом чинится ──
    T.old_edit(lambda o: [s.update({"arch": True}) for s in o["students"] if s["name"] == "Оля"])
    sync(p)
    check("I1 arch: true → дата", old_by("Оля")[0].get("arch") == "2026-11-18", str(old_by("Оля")))

    # ── K. данные не потеряны ──
    d = db()
    check("K1 ни одна запись ученика не удалена", all(any(s["id"] == x for s in mine(d)) for x in [VANYA, PETYA, ANDREY, LIZA, LIZA_K]))
    rv = [r for r in d.get("student_rates", []) if r["student_id"] == VANYA]
    check("K2 ставка Вани цела", len(rv) == 1 and rv[0]["price"] == 2000, str(rv))
    br.close()


def phase_legacy(pw, errors):
    # база до правки: v1, разделы учеников по имени; с тех пор в старом Петю
    # переименовали в Пётр и добавили Костю — раньше это давало архив + дубль
    d0 = fresh_db()
    d0["students"] = [s for s in d0["students"] if s["owner"] != TEACHER["id"]] + [
        stu(VANYA, "Ваня", ext_name="Ваня"), stu(PETYA, "Петя", ext_name="Петя")]
    d0["lessons"] = [{"id": "L-1", "owner": TEACHER["id"], "day": "2026-11-16", "start_min": 900, "dur_min": 60, "format": "pair",
                      "is_event": False, "title": "", "note": "", "group_id": None, "ext_id": "r1"}]
    d0["lesson_students"] = [{"id": "LS-1", "owner": TEACHER["id"], "lesson_id": "L-1", "student_id": VANYA, "guest_name": None, "status": "plan", "pos": 0, "flags": []},
                             {"id": "LS-2", "owner": TEACHER["id"], "lesson_id": "L-1", "student_id": PETYA, "guest_name": None, "status": "plan", "pos": 1, "flags": []}]
    T.OLD["rev"] = 2000
    T.OLD["data"] = {
        "students": [old_st("Ваня", "2000"), old_st("Пётр")],
        "schedule": {"2026-11-16": {"rows": [{"time": "15:00", "names": "Ваня, Пётр", "id": "r1"}], "total": None}},
        "templates": [], "payments": [], "notes": "",
    }
    base_u = {"s:ваня": {"n": "Ваня", "a": False}, "s:петя": {"n": "Петя", "a": False},
              "d:2026-11-16": [{"id": "r1", "t": 900, "d": 60, "f": "pair", "ev": False, "ti": "", "p": [["Ваня", "plan"], ["Петя", "plan"]], "g": None}]}
    d0["ext_sync"] = [{"owner": TEACHER["id"], "source": "old_app", "rev": 1999, "base": {"v": 1, "u": base_u, "pay": 1}, "synced_at": "2026-11-15T10:00:00Z"}]
    STATE["db"] = json.dumps(d0)
    br, p = new_ctx(pw, errors)
    connect(p)
    try:
        p.wait_for_function("() => ScheduleSync.state.status === 'ok' && !ScheduleSync.state.busy", timeout=15000)
    except Exception:
        print("DEBUG", p.evaluate("() => JSON.stringify(ScheduleSync.state)"), p.locator(".sy-modal").count() and p.inner_text(".sy-modal"))
        raise
    d = db()
    pe = [s for s in mine(d) if s["id"] == PETYA][0]
    check("J1 Петя не в архиве, Пётр вторым не заведён", not pe.get("archived_at") and not by_name(d, "Пётр"), str(mine(d)))
    pairs = p.evaluate("() => ScheduleSync.state.pairs")
    check("J2 пара на решение: Пётр ~ Петя (по общему занятию)", len(pairs) == 1 and pairs[0]["n"] == "Пётр" and pairs[0]["cands"][0]["id"] == PETYA, str(pairs))
    es = d["ext_sync"][0]["base"]
    check("J3 база переведена на id (v2), Ваня привязан", es.get("v") == 2 and not any(k == "s:ваня" for k in es["u"])
          and es["link"].get(T.OLD["data"]["students"][0]["id"]) == VANYA, str(es)[:300])
    check("J4 Петя не отправлен в старое заново", [s["name"] for s in T.OLD["data"]["students"]] == ["Ваня", "Пётр"], str(T.OLD["data"]["students"]))
    p.click('.sy-pair[data-cab="%s"] [data-act="link"]' % PETYA)
    p.wait_for_function("() => !ScheduleSync.state.busy && ScheduleSync.state.pairs.length === 0", timeout=15000)
    d = db()
    pe = [s for s in mine(d) if s["id"] == PETYA][0]
    check("J5 «Это один ученик»: та же запись теперь «Пётр», занятие на ней", pe["name"] == "Пётр" and not pe.get("archived_at")
          and len(mine(d)) == 2 and [x["student_id"] for x in T.ppl(d, "L-1")] == [VANYA, PETYA], str(pe))
    br.close()


def main():
    errors = []
    with local_server(), sync_playwright() as pw:
        phase_main(pw, errors)
        phase_legacy(pw, errors)
    check("L1 нет ошибок JavaScript", not errors, str(errors[:3]))
    if B1.FAILS:
        print("\nЕСТЬ ОШИБКИ:", len(B1.FAILS))
        sys.exit(1)
    print("\nготово")


if __name__ == "__main__":
    main()
