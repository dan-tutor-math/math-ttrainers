"""
Действия дня в расписании и шаблоне недели (old-app-gap.md, раздел 14, п. 3):
schedule.js (dayActions / bindDayActions / paintHours / плашка буфера),
schedule-tpl.js (ScheduleTpl.dayKind), schedule-cloud.js (addLessons,
deleteLessons, addSlots, deleteSlots — пакетом).

Supabase — та же заглушка, что в test_prompt_cabinet_schedule_tpl.py (берём
её текст оттуда, чтобы не держать две копии). «Сегодня» — среда 18.11.2026,
неделя 16–22.11.2026.

Проверяет:
  A. ⧉ копирует день в localStorage, плашка «Скопирован день …», ↓ становится
     доступной;
  B. ↓ в пустой день — без вопроса, пакетом (занятия одним запросом,
     участники другим), без статусов;
  C. ↓ в занятый день — своё окно «заменить N занятий?», «Заменить»;
  D. буфер между вкладками: копия в другой вкладке видна сразу (storage);
     «Отменить» на плашке чистит буфер;
  E. ✕ очистить день: «Отмена» и Esc ничего не удаляют, подтверждение —
     удаляет, предупреждение об отметках;
  F. событие: «13:00 ◆ Врач» в быстром вводе, ◆ в шапке дня → окно
     «Событие», правка названия в окне занятия;
  G. ▤ все часы: виртуальные окна 9–21 без записи в базу, щелчок — быстрый
     ввод с временем, повторно — свернуть;
  H. шаблон: день расписания → день шаблона и обратно, очистить день
     шаблона, ▤ и событие в шаблоне, очистить шаблон;
  I. очистить неделю — только эта неделя; «Неделя» — кнопки в шапке дня;
     телефон 375 без прокрутки вбок; нет ошибок JS; нет браузерных confirm.

Запуск: python3 test_prompt_cabinet_day_tools.py (сервер поднимается сам).
"""
import contextlib
import http.client
import json
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = 8967
BASE = f"http://127.0.0.1:{PORT}"
FAILS = []
WEEK = "2026-11-16"
TEACHER = {"id": "11111111-1111-4111-8111-111111111111", "email": "teacher@test.ru", "password": "secret1"}
OTHER_ID = "22222222-2222-4222-8222-222222222222"
T = TEACHER["id"]


def check(name, cond, extra=""):
    print(("[OK] " if cond else "[FAIL] ") + name + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        FAILS.append(name)


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=HERE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                conn = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                conn.request("GET", "/cabinet.html")
                conn.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        else:
            raise RuntimeError("локальный сервер не поднялся")
        yield
    finally:
        proc.terminate()
        proc.wait(timeout=5)


_src = open(os.path.join(HERE, "test_prompt_cabinet_schedule_tpl.py"), encoding="utf-8").read()
FAKE_SB_JS = _src.split('FAKE_SB_JS = r"""', 1)[1].split('"""', 1)[0].replace("__USERS__", json.dumps(TEACHER))

STATE = {"db": "", "posts": 0}
CORS = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS"}


def st_row(sid, name, owner=T):
    return {"id": sid, "owner": owner, "name": name, "grade": None, "exam": None, "note": "", "boards": [], "dur_min": None,
            "archived_at": None, "created_at": "2026-01-01T00:00:00Z", "updated_at": "2026-01-01T00:00:00Z"}


def lesson_row(lid, day, start, dur, fmt="single"):
    return {"id": lid, "owner": T, "day": day, "start_min": start, "dur_min": dur, "format": fmt, "is_event": False, "title": "",
            "note": "", "board_id": None, "group_id": None, "from_slot": None, "ext_id": None,
            "created_at": "2026-01-01T00:00:00Z", "updated_at": "2026-01-01T00:00:00Z"}


def part(pid, lid, sid, status="plan", pos=0):
    return {"id": pid, "owner": T, "lesson_id": lid, "student_id": sid, "guest_name": None, "status": status, "pos": pos}


def fresh_db():
    return {
        "students": [st_row("st-masha", "Маша Иванова"), st_row("st-petya", "Петя Сидоров"), st_row("st-vasya", "Вася Козлов"),
                     st_row("st-other", "Чужой Ученик", owner=OTHER_ID)],
        "teacher_settings": [], "boards": [],
        "lessons": [lesson_row("les-a", "2026-11-17", 600, 60), lesson_row("les-b", "2026-11-17", 900, 90, "pair"),
                    lesson_row("les-c", "2026-11-18", 720, 60),
                    lesson_row("les-next", "2026-11-24", 600, 60)],   # следующая неделя — «очистить неделю» не трогает
        "lesson_students": [part("ls-a", "les-a", "st-masha", "done"), part("ls-b1", "les-b", "st-masha"), part("ls-b2", "les-b", "st-petya", pos=1),
                            part("ls-c", "les-c", "st-petya"), part("ls-n", "les-next", "st-petya")],
        "student_groups": [], "student_group_members": [],
        "week_templates": [{"id": "tpl-1", "owner": T, "name": "Осенний", "is_active": True, "pos": 0}],
        "template_slots": [{"id": "slot-thu", "owner": T, "template_id": "tpl-1", "weekday": 4, "start_min": 960, "dur_min": 60, "format": "single",
                            "is_event": False, "title": "", "note": "", "group_id": None, "pos": 0}],
        "template_slot_students": [{"id": "tss-1", "owner": T, "slot_id": "slot-thu", "student_id": "st-vasya", "guest_name": None, "pos": 0}],
    }


STATE["db"] = json.dumps(fresh_db())


def db():
    return json.loads(STATE["db"])


def tbl(name):
    return [r for r in db().get(name, []) if r["owner"] == T]


def on_day(day):
    return sorted([l for l in tbl("lessons") if l["day"] == day], key=lambda l: l["start_min"] if l["start_min"] is not None else -1)


def people(lesson_id):
    return sorted([p for p in tbl("lesson_students") if p["lesson_id"] == lesson_id], key=lambda p: p["pos"])


def slots(wd=None):
    return sorted([s for s in tbl("template_slots") if wd is None or s["weekday"] == wd], key=lambda s: s["start_min"] if s["start_min"] is not None else -1)


def handle_db(route, request):
    if request.method == "GET":
        route.fulfill(status=200, content_type="application/json", body=STATE["db"], headers=CORS)
    elif request.method == "POST":
        STATE["db"] = request.post_data or STATE["db"]
        STATE["posts"] += 1
        route.fulfill(status=200, content_type="application/json", body="{}", headers=CORS)
    else:
        route.fulfill(status=204, headers=CORS)


FIXED_NOW_JS = r"""
(() => {
  const R = Date, OFF = new R(2026, 10, 18, 12, 0, 0).getTime() - R.now();
  class D extends R {
    constructor(...a){ if (a.length) super(...a); else super(R.now() + OFF); }
    static now(){ return R.now() + OFF; }
  }
  window.Date = D;
  // браузерные окна запрещены: всё — свои стеклянные
  window.__nativeAsk = 0;
  window.confirm = () => { window.__nativeAsk++; return true; };
  window.alert = () => { window.__nativeAsk++; };
  window.prompt = () => { window.__nativeAsk++; return null; };
})();
"""


def new_context(browser, **kw):
    ctx = browser.new_context(**kw)
    ctx.add_init_script(FIXED_NOW_JS)
    ctx.route("https://**/*", lambda r: r.abort())
    ctx.route("https://fakesb.test/db", handle_db)
    ctx.route("**/supabase-js.umd.js", lambda r: r.fulfill(status=200, content_type="application/javascript", body=FAKE_SB_JS))
    return ctx


PAGE = {"p": None}


def wait_db(cond, what, timeout=5.0):
    # ждать через страницу: заглушку базы обслуживает этот же поток Python
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            if cond():
                return True
        except Exception:
            pass
        PAGE["p"].wait_for_timeout(50)
    print("   (ждали: " + what + ")")
    return False


def open_schedule(page, week=WEEK):
    page.goto(f"{BASE}/cabinet.html#/schedule/{week}")
    page.reload()
    page.wait_for_selector("#scHost .sc-body", timeout=5000)
    page.wait_for_function("() => !document.querySelector('#scBody .empty') || document.querySelector('#scBody .empty').textContent.indexOf('Загружаем') < 0")


def da(day, act):
    return f"#scHost [data-dact={act}][data-ref='week:{day}']"


def ta(wd, act):
    return f"#scHost [data-dact={act}][data-ref='tpl:{wd}']"


def ask_click(page, label):
    page.wait_for_selector(".sc-modal .sc-ask-btns", timeout=3000)
    page.click(f".sc-modal .sc-ask-btns button:text-is('{label}')")


def idle(page):
    # действие дня закончилось — кнопки снова доступны
    page.wait_for_function("() => document.querySelector('#scHost .sc-dacts') && !document.querySelector('#scHost [data-dact=event][disabled]')")


def main():
    errors = []
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = new_context(browser, viewport={"width": 1280, "height": 1400})
        page = ctx.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)))
        PAGE["p"] = page
        page.goto(f"{BASE}/cabinet.html")
        page.evaluate("(id) => { localStorage.setItem('__fakesb_session', JSON.stringify({user:{id,email:'t@t'}}));"
                      " localStorage.setItem('cabinet:schedule:view', 'list'); }", T)
        open_schedule(page)
        TUE, WED, THU, FRI, SAT, SUN, MON = "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22", "2026-11-16"

        # ── A. копировать
        check("A1 в шапке дня кнопки ⧉ ↓ ◆ ▤ ✕", all(page.is_visible(da(TUE, a)) for a in ["copy", "paste", "event", "hours", "clear"]))
        check("A2 ↓ недоступна, пока буфер пуст; ⧉ пустого дня недоступна", page.is_disabled(da(FRI, "paste")) and page.is_disabled(da(FRI, "copy")))
        page.click(da(TUE, "copy"))
        clip = page.evaluate("() => JSON.parse(localStorage.getItem('cabinet:schedule:dayclip'))")
        check("A3 буфер в localStorage: 2 строки дня", clip and len(clip["items"]) == 2 and clip["label"] == "Вт, 17 ноября", str(clip))
        check("A4 в буфере нет статусов и id", clip and all("status" not in json.dumps(i) and "id" not in i for i in clip["items"]))
        page.wait_for_selector("#scClip")
        check("A5 плашка «Скопирован день Вт, 17 ноября»", "Скопирован день Вт, 17 ноября" in page.inner_text("#scClip"))
        check("A6 ↓ стала доступна", page.is_enabled(da(FRI, "paste")))

        # ── B. вставить в пустой день — пакетом
        posts0 = STATE["posts"]
        page.click(da(FRI, "paste"))
        wait_db(lambda: len(on_day(FRI)) == 2 and sum(len(people(l["id"])) for l in on_day(FRI)) == 3, "вставка в пятницу")
        idle(page)
        fr = on_day(FRI)
        check("B1 в пятнице 2 занятия, время и формат как во вторнике",
              [(l["start_min"], l["dur_min"], l["format"]) for l in fr] == [(600, 60, "single"), (900, 90, "pair")], str(fr))
        check("B2 участники на месте, статусы — «план»",
              [p["student_id"] for p in people(fr[1]["id"])] == ["st-masha", "st-petya"] and all(p["status"] == "plan" for l in fr for p in people(l["id"])))
        check("B3 пакетом: два запроса записи (занятия + участники)", STATE["posts"] - posts0 == 2, f"записей: {STATE['posts'] - posts0}")
        check("B4 без вопроса: окна нет", page.query_selector(".sc-modal") is None)
        check("B5 в «Строках» пятницы 2 строки", page.locator(f"section[data-day='{FRI}'] .sc-row").count() == 2)

        # ── C. вставить в занятый день — свой вопрос
        page.click(da(WED, "paste"))
        page.wait_for_selector(".sc-modal .sc-ask-text")
        txt = page.inner_text(".sc-modal .sc-ask-text")
        check("C1 вопрос «заменить 1 занятие»", "уже 1 занятие" in txt and page.is_visible(".sc-modal button:text-is('Заменить 1 занятие')"), txt)
        check("C2 окно — стеклянная панель", page.evaluate("() => document.querySelector('.sc-modal .sc-sheet').classList.contains('panel')"))
        ask_click(page, "Заменить 1 занятие")
        wait_db(lambda: len(on_day(WED)) == 2 and not any(l["id"] == "les-c" for l in tbl("lessons")), "замена среды")
        idle(page)
        check("C3 среда заменена: прежнего занятия нет, 2 новых", [l["start_min"] for l in on_day(WED)] == [600, 900])

        # ── D. между вкладками
        page2 = ctx.new_page()
        page2.on("pageerror", lambda e: errors.append("вкладка 2: " + str(e)))
        page2.goto(f"{BASE}/cabinet.html#/schedule/{WEEK}")
        page2.wait_for_selector(f"#scHost section[data-day='{WED}'] .sc-row")
        check("D1 во второй вкладке тоже видна плашка буфера", "Вт, 17 ноября" in (page2.inner_text("#scClip") if page2.query_selector("#scClip") else ""))
        page2.click(da(WED, "copy"))
        page.wait_for_function("() => document.getElementById('scClip') && document.getElementById('scClip').textContent.indexOf('Ср, 18 ноября') >= 0", timeout=3000)
        check("D2 копия из другой вкладки сразу на плашке первой", True)
        page2.close()
        page.click("#scClipX")
        page.wait_for_function("() => !document.getElementById('scClip')")
        check("D3 «Отменить» чистит буфер, ↓ снова недоступна",
              page.evaluate("() => localStorage.getItem('cabinet:schedule:dayclip')") is None and page.is_disabled(da(FRI, "paste")))

        # ── E. очистить день
        page.click(da(TUE, "clear"))
        page.wait_for_selector(".sc-modal .sc-ask-text")
        check("E1 вопрос «Удалить 2 занятия» с предупреждением об отметках",
              "Удалить 2 занятия" in page.inner_text(".sc-modal .sc-ask-text") and page.is_visible(".sc-modal .sc-ask-warn"))
        ask_click(page, "Отмена")
        page.click(da(TUE, "clear"))
        page.wait_for_selector(".sc-modal .sc-ask-text")
        page.keyboard.press("Escape")
        page.wait_for_timeout(200)
        check("E2 «Отмена» и Esc ничего не удаляют", len(on_day(TUE)) == 2 and page.query_selector(".sc-modal") is None)
        page.click(da(TUE, "clear"))
        ask_click(page, "Удалить 2 занятия")
        wait_db(lambda: len(on_day(TUE)) == 0, "вторник очищен")
        idle(page)
        check("E3 вторник очищен, участники ушли каскадом",
              len(on_day(TUE)) == 0 and not any(p["lesson_id"] in ("les-a", "les-b") for p in tbl("lesson_students")))
        check("E4 в «Строках» вторника пусто", page.locator(f"section[data-day='{TUE}'] .sc-row").count() == 0)

        # ── F. события
        page.click(f".sc-plus[data-day='{THU}']")
        page.fill(f".sc-quick[data-day='{THU}'] input", "13:00 ◆ Врач")
        page.press(f".sc-quick[data-day='{THU}'] input", "Enter")
        wait_db(lambda: len(on_day(THU)) == 1, "событие в четверг")
        ev = on_day(THU)[0] if on_day(THU) else {}
        check("F1 «13:00 ◆ Врач» → событие без учеников", ev.get("is_event") is True and ev.get("title") == "Врач" and ev.get("start_min") == 780
              and not people(ev.get("id")), str(ev))
        page.wait_for_selector(f"section[data-day='{THU}'] .sc-ev")
        check("F2 в строке — «Врач»", page.inner_text(f"section[data-day='{THU}'] .sc-ev") == "Врач")
        page.click(da(SAT, "event"))
        page.wait_for_selector("#edKind button.on[data-k=event]")
        check("F3 ◆ открывает окно с выбранным «Событие»", page.get_attribute("#edNames", "placeholder").startswith("Созвон"))
        page.fill("#edStart", "18:00")
        page.fill("#edNames", "Вебинар, ОГЭ")
        page.click("#edCreate")
        wait_db(lambda: len(on_day(SAT)) == 1, "событие в субботу")
        sat = on_day(SAT)[0] if on_day(SAT) else {}
        check("F4 событие из окна: название с запятой целиком, время 18:00", sat.get("is_event") is True and sat.get("title") == "Вебинар, ОГЭ"
              and sat.get("start_min") == 1080, str(sat))
        page.wait_for_function("() => !document.querySelector('.sc-modal')")
        page.click(f"section[data-day='{SAT}'] .sc-time")
        page.click("#spEdit")
        page.wait_for_selector("#edTitle")
        check("F5 окно события: название вместо формата и учеников", page.input_value("#edTitle") == "Вебинар, ОГЭ" and page.query_selector("#edFmt") is None)
        page.fill("#edTitle", "Вебинар ФИПИ")
        page.press("#edTitle", "Tab")
        wait_db(lambda: on_day(SAT)[0]["title"] == "Вебинар ФИПИ", "название события")
        check("F6 название события правится", on_day(SAT)[0]["title"] == "Вебинар ФИПИ")
        page.click("#edDone")
        page.keyboard.press("Escape")
        page.wait_for_function("() => !document.querySelector('.sc-side')")

        # ── G. все часы
        n_les = len(tbl("lessons"))
        page.click(da(MON, "hours"))
        page.wait_for_selector(f"section[data-day='{MON}'] .sc-vrow")
        vt = page.eval_on_selector_all(f"section[data-day='{MON}'] .sc-vrow .sc-time", "els => els.map(e => e.textContent)")
        check("G1 пустой понедельник: 13 окон 09:00…21:00", vt == [f"{h:02d}:00" for h in range(9, 22)], str(vt))
        check("G2 окна не пишутся в базу", len(tbl("lessons")) == n_les)
        page.click(da(WED, "hours"))
        page.wait_for_selector(f"section[data-day='{WED}'] .sc-vrow")
        wt = page.eval_on_selector_all(f"section[data-day='{WED}'] .sc-row", "els => els.map(e => e.classList.contains('sc-vrow') ? e.textContent.slice(0,5) : 'L')")
        check("G3 среда: занятые часы без окон, окна между строками по времени",
              wt == ["09:00", "L", "11:00", "12:00", "13:00", "14:00", "L", "17:00", "18:00", "19:00", "20:00", "21:00"], str(wt))
        page.click(f"section[data-day='{MON}'] .sc-vrow:nth-child(2) .sc-time")
        q = f".sc-quick[data-day='{MON}'] input"
        check("G4 щелчок по окну 10:00 — быстрый ввод «10:00 »", page.input_value(q) == "10:00 ")
        page.type(q, "Петя")
        page.press(q, "Enter")
        wait_db(lambda: len(on_day(MON)) == 1, "занятие из окна")
        check("G5 занятие в 10:00 у Пети", on_day(MON) and on_day(MON)[0]["start_min"] == 600 and people(on_day(MON)[0]["id"])[0]["student_id"] == "st-petya")
        page.wait_for_function(f"() => document.querySelectorAll(\"section[data-day='{MON}'] .sc-vrow\").length === 12")
        check("G6 окно 10:00 занято — осталось 12", True)
        page.click(da(MON, "hours"))
        page.wait_for_function(f"() => !document.querySelector(\"section[data-day='{MON}'] .sc-vrow\")")
        check("G7 повторно — свернулось", True)
        page.click(da(WED, "hours"))

        # ── H. шаблон
        page.click(da(FRI, "copy"))
        page.click(".sc-modes button[data-mode=tpl]")
        page.wait_for_selector(ta(2, "paste"))
        check("H1 в шаблоне — те же кнопки дня и «Очистить шаблон»", page.is_visible(ta(4, "copy")) and page.is_visible("[data-wclear='tpl:']"))
        posts0 = STATE["posts"]
        page.click(ta(2, "paste"))
        wait_db(lambda: len(slots(2)) == 2, "день расписания → вторник шаблона")
        idle(page)
        s2 = slots(2)
        sp = [p["student_id"] for p in sorted(tbl("template_slot_students"), key=lambda p: p["pos"]) if s2 and p["slot_id"] == s2[1]["id"]]
        check("H2 пятница расписания → вторник шаблона: слоты, формат, ученики",
              [(s["start_min"], s["format"], s["template_id"]) for s in s2] == [(600, "single", "tpl-1"), (900, "pair", "tpl-1")] and sp == ["st-masha", "st-petya"], str(s2))
        check("H3 слоты тоже пакетом (2 записи)", STATE["posts"] - posts0 == 2, f"записей: {STATE['posts'] - posts0}")
        page.click(ta(4, "copy"))
        check("H4 плашка — «четверг шаблона «Осенний»»", "четверг шаблона «Осенний»" in page.inner_text("#scClip"))
        page.click(".sc-modes button[data-mode=week]")
        page.click(da(SUN, "paste"))
        wait_db(lambda: len(on_day(SUN)) == 1, "день шаблона → воскресенье")
        idle(page)
        su = on_day(SUN)
        check("H5 день шаблона → воскресенье расписания: Вася в 16:00",
              su and su[0]["start_min"] == 960 and [p["student_id"] for p in people(su[0]["id"])] == ["st-vasya"], str(su))
        page.click(".sc-modes button[data-mode=tpl]")
        page.click(ta(2, "clear"))
        ask_click(page, "Удалить 2 слота")
        wait_db(lambda: len(slots(2)) == 0, "очистить вторник шаблона")
        idle(page)
        check("H6 день шаблона очищен, участники слотов ушли", len(slots(2)) == 0 and len(tbl("template_slot_students")) == 1)
        page.click(ta(1, "hours"))
        page.wait_for_selector("section[data-wd='1'] .sc-vrow")
        check("H7 ▤ в шаблоне: 13 окон", page.locator("section[data-wd='1'] .sc-vrow").count() == 13 and len(slots()) == 1)
        page.click("section[data-wd='1'] .sc-vrow:first-child .sc-time")
        qq = ".sc-quick[data-wd='1'] input"
        check("H8 окно шаблона → быстрый ввод «09:00 »", page.input_value(qq) == "09:00 ")
        page.type(qq, "◆ Созвон")
        page.press(qq, "Enter")
        wait_db(lambda: len(slots(1)) == 1, "событие в шаблоне")
        s1 = slots(1)[0] if slots(1) else {}
        check("H9 событие в шаблоне", s1.get("is_event") is True and s1.get("title") == "Созвон" and s1.get("start_min") == 540, str(s1))
        page.click(ta(3, "event"))
        check("H10 ◆ в шаблоне — быстрый ввод «◆ »", page.input_value(".sc-quick[data-wd='3'] input") == "◆ ")
        page.click("[data-wclear='tpl:']")
        ask_click(page, "Удалить 2 слота")
        wait_db(lambda: len(slots()) == 0, "очистить шаблон")
        check("H11 шаблон очищен целиком, сам шаблон остался", len(slots()) == 0 and len(tbl("week_templates")) == 1)
        idle(page)

        # ── I. очистить неделю, «Неделя», телефон
        page.click(".sc-modes button[data-mode=week]")
        nweek = len([l for l in tbl("lessons") if WEEK <= l["day"] <= SUN])
        page.click("[data-wclear='week:']")
        page.wait_for_selector(".sc-modal .sc-ask-text")
        check("I1 вопрос «очистить неделю» с числом занятий", f"Удалить {nweek} " in page.inner_text(".sc-modal .sc-ask-text"), page.inner_text(".sc-modal .sc-ask-text"))
        page.click(".sc-modal .sc-ask-btns button.danger")
        wait_db(lambda: not [l for l in tbl("lessons") if WEEK <= l["day"] <= SUN], "неделя очищена")
        check("I2 неделя пуста, следующая неделя не тронута", [l["id"] for l in tbl("lessons")] == ["les-next"])
        idle(page)
        check("I3 после очистки «Очистить неделю» недоступна", page.is_disabled("[data-wclear='week:']"))
        page.reload()
        page.wait_for_selector("#scHost .sc-body")
        page.click(".sc-views button[data-v=grid]")
        page.wait_for_selector(".sc-gday .sc-dacts")
        check("I4 «Неделя»: ⧉ ↓ ◆ ✕ в шапке дня, без ▤",
              page.locator(".sc-gday [data-dact=paste]").count() == 7 and page.locator(".sc-gday [data-dact=hours]").count() == 0)
        page.click(".sc-views button[data-v=list]")
        check("I5 нет браузерных confirm/alert/prompt", page.evaluate("() => window.__nativeAsk") == 0)

        ph = new_context(browser, viewport={"width": 375, "height": 812}, is_mobile=True, has_touch=True)
        pp = ph.new_page()
        pp.on("pageerror", lambda e: errors.append("телефон: " + str(e)))
        PAGE["p"] = pp
        pp.goto(f"{BASE}/cabinet.html")
        pp.evaluate("(id) => { localStorage.setItem('__fakesb_session', JSON.stringify({user:{id,email:'t@t'}})); }", T)
        open_schedule(pp)
        pp.click(da(MON, "hours"))
        pp.wait_for_selector(".sc-vrow")
        sw = pp.evaluate("() => [document.documentElement.scrollWidth, window.innerWidth]")
        check("I6 телефон 375: без прокрутки вбок с кнопками дня и окнами", sw[0] <= sw[1], str(sw))
        ph.close()

        check("I7 нет ошибок JS", not errors, "; ".join(errors[:3]))
        browser.close()

    print("ПРОВАЛЕНО: " + ", ".join(FAILS) if FAILS else "Все проверки прошли")
    sys.exit(1 if FAILS else 0)


main()
