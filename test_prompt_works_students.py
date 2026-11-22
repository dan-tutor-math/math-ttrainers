"""
Работы: «Для учеников» — подбор заданий под одного или нескольких учеников без сессии.

Заглушка Supabase и вход учителя — из test_prompt15_works_stage1.py. Список
учеников и загрузка журнала подменены (StudentMemory.listStudents / loadLog),
журналы — локальные копии StudentMemory (record со studentId).
Проверяет:
  A. без сессии и без выбора: строка «Для учеников» видна (есть ученики), чипов и точек нет;
  B. выбран один ученик: чип, точка у его решённого задания, всплывашка с его именем
     и «забыть»; сессии при этом нет (StudentMemory.current() — null);
  C. два ученика: точки у заданий хоть одного, во всплывашке строка на каждого
     («не было» у второго), без «забыть»; в settings только id;
  D. «не брать решённые»: TaskCaptions.hasEvents — по любому из выбранных;
  E. «Выдано: Ваня, Петя» пишет hw обоим;
  F. сборка варианта из работы предлагает «Выбранные в работе»;
  G. убрали ученика — точки по оставшемуся; убрали всех — подписи молчат;
  I. группы («сортировки» кабинета, settings.studentCats): свой список и по классу
     в выпадающем списке, выбор группы добавляет всех, подпись «Группа «…»»;
  J. «Сохранить группой»: свежие настройки с сервера, новая группа kind:list с id учеников;
  K. кадр тренажёра в панели добавления получает тех же учеников: на карточке
     типа «Решено всеми K из N · Ваня 1, Петя 0»;
  H. нет ошибок JavaScript.

Запуск: ~/.venvs/trainers/bin/python test_prompt_works_students.py
"""
from test_prompt15_works_stage1 import (
    BASE, TEACHER, local_server, sync_playwright, new_context, watch_errors, open_in_frame,
)

FAILS = []
VANYA = {"id": "aaaaaaaa-0000-4000-8000-0000000000a1", "name": "Ваня"}
PETYA = {"id": "aaaaaaaa-0000-4000-8000-0000000000a2", "name": "Петя", "grade": "9"}
KOLYA = {"id": "aaaaaaaa-0000-4000-8000-0000000000a3", "name": "Коля", "grade": "9"}
K1, K2, K3 = "fipi:oge:AAA111", "fipi:oge:BBB222", "fipi:oge:CCC333"


def check(name, cond, extra=""):
    print(("[OK] " if cond else "[FAIL] ") + name + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        FAILS.append(name)


def dots(page):
    return page.evaluate("Array.from(document.querySelectorAll('#wkTasks [data-tc-dot]')).length")


def pop_text(page, idx):
    page.evaluate("i => document.querySelectorAll('#wkTasks [data-tc-dot]')[i].click()", idx)
    page.wait_for_timeout(150)
    t = page.evaluate("document.querySelector('.tc-pop') ? document.querySelector('.tc-pop').innerText : ''")
    forget = page.evaluate("!!document.querySelector('.tc-pop [data-tc-forget]')")
    page.mouse.click(5, 5)
    page.wait_for_timeout(100)
    return t, forget


def chips(page):
    return page.evaluate("Array.from(document.querySelectorAll('#wkFor .mem-chip')).map(c => c.firstChild.textContent)")


def to_types(page, reopen):
    """Кадр: к списку типов («← все типы») — карточки рисуются заново со свежим счётом."""
    fr = "document.getElementById('trFrame').contentWindow.document"
    page.wait_for_timeout(300)
    if reopen:
        page.evaluate(f"() => {fr}.querySelector('.mode-card[data-id=\"p1\"]').click()")
        page.wait_for_timeout(300)
    page.evaluate(f"() => {fr}.getElementById('backBtn').click()")
    page.wait_for_function(f"() => {{ const c = {fr}.querySelector('.mode-card[data-id=\"p1\"]'); return c && c.offsetParent; }}", timeout=10000)


def run():
    errors = []
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = new_context(browser, viewport={"width": 1440, "height": 950})
        pg = ctx.new_page()
        watch_errors(pg, errors, "works")
        pg.goto(f"{BASE}/works.html")
        pg.wait_for_selector("#scrAuth:not([hidden])")
        # ученики кабинета и журнал — без сети
        pg.evaluate("""([a, b, c]) => {
            StudentMemory.listStudents = async () => [a, b, c];
            StudentMemory.loadLog = async () => null;
            // настройки кабинета: сервер заглушки их не знает — подменяем облако
            window.__saved = null;
            window.__remote = { studentCats: [
                { id: 'pair1', name: 'Пара вторник', kind: 'list', v: '', members: [a.id, b.id] },
                { id: 'g9', name: '9 класс', kind: 'grade', v: '9', members: [] } ] };
            CabinetCloud.getSettings = async () => JSON.parse(JSON.stringify(window.__remote));
            CabinetCloud.saveSettings = async st => { window.__saved = st; window.__remote = st; return null; };
        }""", [VANYA, PETYA, KOLYA])
        pg.fill("#auEmail", TEACHER["email"]); pg.fill("#auPass", TEACHER["password"]); pg.click("#auGo")
        pg.wait_for_selector("#scrList:not([hidden])")
        pg.click("#newWork"); pg.wait_for_selector("#scrEdit:not([hidden])")
        pg.wait_for_function("() => document.querySelectorAll('#wkForAdd option').length === 6", timeout=5000)

        # журналы: Ване K1 верно, Пете K2 неверно
        pg.evaluate("""([a, b, k1, k2]) => {
            StudentMemory.record(k1, 'ok', { studentId: a });
            StudentMemory.record(k2, 'bad', { studentId: b });
        }""", [VANYA["id"], PETYA["id"], K1, K2])
        pg.evaluate("""([k1, k2, k3]) => { const E = window.__works.E;
            const mk = (id, k) => ({ id, type: 'task', mode: 'exam', tid: 'oge6', tkey: k });
            E.variants[0].blocks.push(mk('t1', k1), mk('t2', k2), mk('t3', k3));
            window.__works.renderTasks();
        }""", [K1, K2, K3])

        # ═══ A ═══
        print("\n— A. без выбора")
        check("A1 строка «Для учеников» видна", pg.is_visible("#wkMemRow"))
        check("A2 чипов нет", chips(pg) == [], str(chips(pg)))
        check("A3 точек нет", dots(pg) == 0, str(dots(pg)))
        check("A4 сессии нет", pg.evaluate("StudentMemory.current()") is None)

        # ═══ B ═══
        print("\n— B. один ученик")
        pg.select_option("#wkForAdd", VANYA["id"])
        pg.wait_for_timeout(300)
        check("B1 чип «Ваня»", chips(pg) == ["Ваня"], str(chips(pg)))
        check("B2 точка у решённого Ваней", dots(pg) == 1, str(dots(pg)))
        t, forget = pop_text(pg, 0)
        check("B3 всплывашка про Ваню", "Ваня" in t and "верно" in t.lower(), t)
        check("B4 у одного ученика можно «забыть»", forget)
        check("B5 сессия не началась", pg.evaluate("StudentMemory.current()") is None)
        check("B6 переключатель подписей виден", pg.evaluate("document.querySelectorAll('#wkCapToggle button').length") == 3)

        # ═══ C ═══
        print("\n— C. два ученика")
        pg.select_option("#wkForAdd", PETYA["id"])
        pg.wait_for_timeout(300)
        check("C1 два чипа", chips(pg) == ["Ваня", "Петя"], str(chips(pg)))
        check("C2 точки у K1 и K2", dots(pg) == 2, str(dots(pg)))
        t, forget = pop_text(pg, 1)
        check("C3 во всплывашке K2 оба ученика", "Ваня" in t and "Петя" in t and "не было" in t and "неверно" in t.lower(), t)
        check("C4 «забыть» при нескольких нет", not forget)
        st = pg.evaluate("() => window.__works.E.settings")
        check("C5 в settings id выбранных", st.get("pickFor") == [VANYA["id"], PETYA["id"]], str(st))
        check("C6 имён в settings нет", "Ваня" not in str(st) and "Петя" not in str(st))

        # ═══ D ═══
        print("\n— D. не брать решённые")
        hv = pg.evaluate("ks => ks.map(k => TaskCaptions.hasEvents(k))", [K1, K2, K3])
        check("D1 решённое хоть кем-то — пропускается, нетронутое — нет", hv == [True, True, False], str(hv))

        # ═══ E ═══
        print("\n— E. «Выдано»")
        check("E1 кнопка «Выдано: Ваня, Петя»", "Выдано: Ваня, Петя" in pg.inner_text("#wkIssued"), pg.inner_text("#wkIssued"))
        pg.click("#wkIssued")
        pg.wait_for_timeout(200)
        rows = pg.evaluate("StudentMemory.queue().filter(r => r.event === 'hw').map(r => r.student_id + ' ' + r.task_key)")
        want = sorted(f"{s['id']} {k}" for s in (VANYA, PETYA) for k in (K1, K2, K3))
        check("E2 hw каждому по каждому заданию", sorted(rows) == want, str(rows))

        # ═══ F ═══
        print("\n— F. сборка варианта")
        pg.evaluate("() => window.__works.openBuild('cur')")
        pg.wait_for_selector("#scrBuild:not([hidden])")
        pg.wait_for_function("() => document.getElementById('bdFor').value === '@pick'", timeout=5000)
        txt = pg.evaluate("document.querySelector('#bdFor option[value=\"@pick\"]').textContent")
        check("F1 «Выбранные в работе: Ваня, Петя»", "Ваня, Петя" in txt, txt)
        pg.evaluate("() => { document.getElementById('scrBuild').hidden = true; document.getElementById('scrEdit').hidden = false; window.__works.renderTasks(); }")

        # ═══ G ═══
        print("\n— G. убрать учеников")
        pg.click('#wkFor .mem-chip[data-id="%s"] button' % VANYA["id"])
        pg.wait_for_timeout(300)
        check("G1 остался Петя", chips(pg) == ["Петя"], str(chips(pg)))
        check("G2 точки по журналу Пети (K2 неверно, у всех трёх «В ДЗ»)", dots(pg) == 3, str(dots(pg)))
        t, _ = pop_text(pg, 1)
        check("G3 всплывашка про Петю", t.startswith("У Петя"), t)
        pg.click('#wkFor .mem-chip[data-id="%s"] button' % PETYA["id"])
        pg.wait_for_timeout(300)
        check("G4 без выбранных и без сессии подписи молчат", dots(pg) == 0 and not pg.evaluate("TaskCaptions.active()"))
        check("G5 pickFor убран из settings", "pickFor" not in pg.evaluate("() => window.__works.E.settings"))

        # ═══ I ═══
        print("\n— I. группы")
        opts = pg.evaluate("Array.from(document.querySelectorAll('#wkForAdd optgroup[label=\"Группы\"] option')).map(o => o.textContent)")
        check("I1 в списке обе группы с числом учеников", opts == ["Пара вторник (2)", "9 класс (2)"], str(opts))
        pg.select_option("#wkForAdd", "g:pair1")
        pg.wait_for_timeout(300)
        check("I2 группа добавила обоих", chips(pg) == ["Ваня", "Петя"], str(chips(pg)))
        check("I3 подпись «Группа «Пара вторник»»", "Пара вторник" in pg.inner_text("#wkGroupName"), pg.inner_text("#wkGroupName"))
        check("I4 «Сохранить группой» скрыта — такая группа есть", pg.is_hidden("#wkGroupSave"))
        check("I5 пара уже выбрана — её нет в списке", "Пара вторник (2)" not in pg.inner_text("#wkForAdd"))

        # ═══ J ═══
        print("\n— J. сохранить группой")
        pg.click('#wkFor .mem-chip[data-id="%s"] button' % PETYA["id"])
        pg.select_option("#wkForAdd", KOLYA["id"])
        pg.wait_for_timeout(200)
        check("J1 кнопка «Сохранить группой» видна", pg.is_visible("#wkGroupSave"))
        pg.once("dialog", lambda d: d.accept("Ваня и Коля"))
        pg.click("#wkGroupSave")
        pg.wait_for_function("() => !!window.__saved", timeout=5000)
        saved = pg.evaluate("() => window.__saved.studentCats")
        new = [c for c in saved if c["name"] == "Ваня и Коля"]
        check("J2 старые группы на месте", [c["id"] for c in saved][:2] == ["pair1", "g9"], str(saved))
        check("J3 новая группа — свой список с id", len(new) == 1 and new[0]["kind"] == "list" and sorted(new[0]["members"]) == sorted([VANYA["id"], KOLYA["id"]]), str(new))
        pg.wait_for_timeout(200)
        check("J4 теперь подписано «Группа «Ваня и Коля»», кнопка скрыта", "Ваня и Коля" in pg.inner_text("#wkGroupName") and pg.is_hidden("#wkGroupSave"))

        # ═══ K ═══
        print("\n— K. кадр тренажёра")
        for c in chips(pg):
            pg.click('#wkFor .mem-chip:first-child button'); pg.wait_for_timeout(100)
        pg.select_option("#wkForAdd", "g:pair1")
        pg.wait_for_timeout(300)
        open_in_frame(pg, "oge6", "document.querySelector('.mode-card[data-id=\"p1\"]').click()")
        FR = "document.getElementById('trFrame').contentWindow"
        who = pg.evaluate(f"() => {FR}.TaskCaptions.students().map(s => s.name)")
        check("K1 в кадре те же ученики", who == ["Ваня", "Петя"], str(who))
        num = pg.evaluate(f"() => {FR}.tsGetState().curTask.fipi")
        pg.evaluate("([k, a]) => StudentMemory.record(k, 'ok', { studentId: a })", [f"fipi:oge:{num}", VANYA["id"]])
        to_types(pg, False)
        card = pg.evaluate(f"() => {FR}.document.querySelector('.mode-card[data-id=\"p1\"]').innerText.replace(/\\s+/g, ' ')")
        check("K2 карточка: решено всеми 0, Ваня 1, Петя 0", "Решено всеми 0 из" in card and "Ваня 1, Петя 0" in card, card)
        pg.evaluate("([k, b]) => StudentMemory.record(k, 'ok', { studentId: b })", [f"fipi:oge:{num}", PETYA["id"]])
        to_types(pg, True)
        card = pg.evaluate(f"() => {FR}.document.querySelector('.mode-card[data-id=\"p1\"]').innerText.replace(/\\s+/g, ' ')")
        check("K3 оба решили: решено всеми 1, Ваня 1, Петя 1", "Решено всеми 1 из" in card and "Ваня 1, Петя 1" in card, card)
        check("K4 сессии так и нет", pg.evaluate("StudentMemory.current()") is None)

        check("H нет ошибок JavaScript", not errors, str(errors[:2]))
        browser.close()


if __name__ == "__main__":
    run()
    print("\nИтого:", "всё зелёное" if not FAILS else f"упало {len(FAILS)}: {FAILS}")
    raise SystemExit(1 if FAILS else 0)
