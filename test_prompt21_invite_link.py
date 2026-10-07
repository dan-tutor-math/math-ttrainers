"""
Промпт №21 нового списка: совместный доступ — «Скопировать код» и рабочая
ссылка-приглашение.

Раньше в панели копировалась только ссылка, а переход по ссылке сразу уводил
на сцену; если код не подходил (опечатка, учитель сменил код, урок кончился),
ученик молча оказывался на обычной странице со своей новой сессией — снаружи
«ссылка ничего не делает». Учитель, вставивший свою ссылку в свою же вкладку,
становился учеником собственного занятия.

Проверяем:
  A. Панель: «Скопировать код» (только код) и «Скопировать ссылку», обе с
     «Скопировано»; нажатие на сам код тоже копирует; без navigator.clipboard
     копирование идёт запасным способом.
  B. Ссылка на тренажёр с компьютера: окно «Подключиться к сессии?» с
     названием тренажёра и кодом, само никуда не уводит; «Подключиться» —
     сцена, подключение к коду, состояние учителя у ученика, учитель видит
     ученика.
  C. Повторный переход по той же ссылке в той же вкладке — без окна, сразу
     на сцену.
  D. Платформа уже открыта в соседней вкладке: окно, подключение во второй
     вкладке, первая осталась со своей сессией.
  E. «Отмена» — обычная страница без кода, своя сессия, без сцены.
  F. Завершённое занятие — «Это занятие уже завершено», «Остаться» —
     обычная страница.
  G. Неверный код — «Сессия не найдена», поле для кода; код, набранный
     вручную (строчными, с пробелами), подключает сразу.
  H. Учитель ушёл, строка осталась — окно подключения с пометкой «Учитель
     сейчас не на связи».
  I. Учитель вставил свою ссылку в свою вкладку — остаётся учителем, без
     окна, код тот же, ?s= из адреса убран.
  J. Вход по коду вручную в панели: вставили ссылку целиком — подключение,
     окно второй раз не спрашивает.
  K. Адрес сцены с неверным кодом — «Сессия не найдена» на сцене, «Открыть
     страницу без сессии» — обычная страница.
  L. Доски: в окне — название открытой доски, экрана входа нет (ученику
     аккаунт не нужен), подключение — доска учителя на сцене; в панели досок
     обе кнопки копирования; «Отмена» — обычные доски.
  M. Телефон: окно целиком на экране, кнопки под палец, касание
     «Подключиться» — сцена.

Живой realtime из песочницы недоступен — заглушка Supabase из теста №54
(BroadcastChannel + localStorage) без ключа tsInvite:auto, которым она
соглашается за остальные тесты. На сайте совместный режим — руками.

Запуск: python3 test_prompt21_invite_link.py
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt54_trainer_sync_and_cards as t54
import test_prompt11_shared_screen as t11
import test_prompt11_board_stage as BS

PORT = 8921
t11.PORT = PORT
t11.BASE = BASE = f"http://127.0.0.1:{PORT}"
failures = t11.failures
errors = t11.errors
check = t11.check

AUTO = "try { localStorage.setItem('tsInvite:auto', '1'); } catch (e) {}"
assert AUTO in t54.FAKE_LIB
FAKE = t54.FAKE_LIB.replace(AUTO, "")
# Проба «учитель на связи?» закрывает свой канал, как только услышала
# учителя, — а её собственное сообщение в заглушке ещё может ждать отправки
# в setTimeout, и закрытый BroadcastChannel бросает ошибку. Настоящий канал
# supabase-js после removeChannel молча ничего не шлёт — заглушка так же
SEND_OLD = "setTimeout(() => bc.postMessage(m), window.__fakeLatency || 0)"
assert SEND_OLD in FAKE
FAKE = FAKE.replace(SEND_OLD, "setTimeout(() => { try { bc.postMessage(m); } catch (e) {} }, window.__fakeLatency || 0)")

# было ли у этой вкладки окно приглашения (пишется в sessionStorage — он
# переживает переходы внутри вкладки, в том числе уход на сцену)
SAW_INVITE = """(() => {
  if (window.top !== window) return;
  const mark = () => { if (document.getElementById('tsInvite')) { try { sessionStorage.setItem('sawInvite', '1'); } catch (e) {} } };
  const start = () => new MutationObserver(mark).observe(document.documentElement, { childList: true, subtree: true });
  if (document.documentElement) start(); else document.addEventListener('DOMContentLoaded', start);
})();"""

INVITE_INFO = """() => { const e = document.getElementById('tsInvite'); if (!e) return null;
  const t = id => { const x = e.querySelector('#' + id); return x && !x.hidden ? x.textContent.replace(/\\s+/g, ' ').trim() : null; };
  return { state: e.dataset.state, h: t('tsInvH'), name: t('tsInvName'), text: t('tsInvText'), main: t('tsInvMain'),
           second: t('tsInvSecond'), away: t('tsInvAway'), form: !e.querySelector('#tsInvForm').hidden }; }"""


def participant(ctx, tag, w, h):
    page = t11.participant(ctx, tag, w, h)
    # свой маршрут поверх маршрута теста №54: последний зарегистрированный — первый
    page.route("**/supabase-js.umd.js", lambda route: route.fulfill(
        status=200, content_type="application/javascript", body=FAKE))
    page.add_init_script(SAW_INVITE)
    return page


def wait_invite(page, state, timeout=12000):
    try:
        page.wait_for_function("s => { const e = document.getElementById('tsInvite'); return !!e && e.dataset.state === s; }",
                               arg=state, timeout=timeout)
        return page.evaluate(INVITE_INFO)
    except Exception:
        return None


def row_exists(page, code):
    page.wait_for_function("c => !!JSON.parse(localStorage.getItem('fakeTrainerSessions') || '{}')[c]", arg=code, timeout=8000)


def teacher_on(ctx, slug, w=1300, h=820, tag="T"):
    t = participant(ctx, tag, w, h)
    t.goto(f"{BASE}/{slug}.html")
    code = t54.wait_code(t)
    row_exists(t, code)
    return t, code, t.evaluate("() => TrainerSession.getShareUrl()")


def frame_code(page):
    f = t11.stage_frame(page)
    return f.evaluate("() => window.TrainerSession.getCode()") if f else None


def open_panel(page):
    page.evaluate("() => { const p = document.querySelector('.ts-share-pop'); if (!p.classList.contains('open')) document.querySelector('.ts-share-btn').click(); }")
    page.wait_for_function("() => document.querySelector('.ts-share-pop').classList.contains('open')")


def part_a(browser):
    print("A. «Скопировать код» и «Скопировать ссылку»")
    ctx = browser.new_context(permissions=["clipboard-read", "clipboard-write"])
    teacher, code, link = teacher_on(ctx, "oge8")
    open_panel(teacher)
    labels = teacher.evaluate("() => [document.getElementById('tsCopyCode'), document.getElementById('tsCopy')].map(b => b && b.textContent.trim())")
    check("A: в панели две кнопки — «Скопировать код» и «Скопировать ссылку»", labels == ["Скопировать код", "Скопировать ссылку"], labels)
    teacher.click("#tsCopyCode")
    teacher.wait_for_timeout(150)
    clip = teacher.evaluate("() => navigator.clipboard.readText()")
    check("A: «Скопировать код» — в буфере только код", clip == code, clip)
    toast = teacher.evaluate("() => { const t = document.getElementById('tsCopyToast'); return [t.classList.contains('on'), t.textContent, getComputedStyle(t).opacity]; }")
    check("A: после копирования кода — «Скопировано»", toast[0] and toast[1] == "Скопировано", toast)
    teacher.wait_for_timeout(1800)
    check("A: «Скопировано» прячется само",
          not teacher.evaluate("() => document.getElementById('tsCopyToast').classList.contains('on')"))
    teacher.click("#tsCopy")
    teacher.wait_for_timeout(150)
    clip = teacher.evaluate("() => navigator.clipboard.readText()")
    check("A: «Скопировать ссылку» — ссылка с ?s=КОД", clip == link and f"?s={code}" in clip, clip)
    check("A: после копирования ссылки — тоже «Скопировано»",
          teacher.evaluate("() => document.getElementById('tsCopyToast').classList.contains('on') && document.getElementById('tsCopyToast').textContent === 'Скопировано'"))
    # нажатие на сам код
    teacher.evaluate("() => navigator.clipboard.writeText('—')")
    teacher.click("#tsCode")
    teacher.wait_for_timeout(150)
    check("A: нажатие на код в панели тоже копирует код", teacher.evaluate("() => navigator.clipboard.readText()") == code)
    # без navigator.clipboard (старый Safari, страница без https) — запасной способ
    teacher.evaluate("() => { window.__realRead = navigator.clipboard.readText.bind(navigator.clipboard);"
                     " navigator.clipboard.writeText = () => Promise.reject(new Error('blocked')); }")
    teacher.evaluate("() => document.execCommand && true")
    teacher.wait_for_timeout(1600)
    teacher.click("#tsCopyCode")
    teacher.wait_for_timeout(200)
    clip = teacher.evaluate("() => window.__realRead()")
    check("A: без navigator.clipboard код всё равно копируется", clip == code, clip)
    check("A: и тоже «Скопировано»",
          teacher.evaluate("() => document.getElementById('tsCopyToast').textContent === 'Скопировано'"))
    ctx.close()


def part_b_to_k(browser):
    ctx = browser.new_context()
    teacher, code, link = teacher_on(ctx, "oge8")

    print("B. Ссылка на тренажёр с компьютера")
    student = participant(ctx, "S", 1100, 750)
    student.goto(link)
    info = wait_invite(student, "ok")
    check("B: окно «Подключиться к сессии?»", bool(info) and info["h"] == "Подключиться к сессии?", info)
    check("B: в окне название тренажёра", bool(info) and info["name"] == "ОГЭ №8 — упрощение выражений", info and info["name"])
    check("B: в окне код сессии", bool(info) and code in (info["text"] or ""), info and info["text"])
    check("B: кнопки «Подключиться» и «Отмена»", bool(info) and info["main"] == "Подключиться" and info["second"] == "Отмена", info)
    student.wait_for_timeout(1200)
    check("B: учитель на связи — пометки «не на связи» нет", student.evaluate("() => document.getElementById('tsInvAway').hidden"))
    check("B: до ответа никуда не уводит", "stage.html" not in student.url and f"s={code}" in student.url, student.url)
    check("B: до ответа к сессии не подключается", student.evaluate("() => window.TrainerSession.getCode()") is None)
    student.click("#tsInvMain")
    try:
        f = t11.wait_stage(student)
        got = f.evaluate("() => window.TrainerSession.getCode()")
    except Exception as e:
        f, got = None, str(e)[:120]
    check("B: «Подключиться» — сцена и подключение к коду учителя", got == code, got)
    try:
        teacher.wait_for_function("() => window.TrainerSession.hasViewers()", timeout=8000)
        seen = True
    except Exception:
        seen = False
    check("B: учитель видит ученика на связи", seen)
    if f:
        same = f.evaluate("() => JSON.stringify(window.tsGetState().curTask)") == teacher.evaluate("() => JSON.stringify(window.tsGetState().curTask)")
        check("B: у ученика то же состояние, что у учителя", same)
        check("B: в кадре сцены окно не спрашивает", f.evaluate("() => !document.getElementById('tsInvite')"))

    print("C. Повторный переход по той же ссылке")
    student.evaluate("() => sessionStorage.removeItem('sawInvite')")
    student.goto(link)
    try:
        t11.wait_stage(student)
        got = frame_code(student)
    except Exception as e:
        got = str(e)[:120]
    check("C: снова сцена с тем же кодом", got == code, got)
    check("C: второй раз окно не спрашивает", student.evaluate("() => sessionStorage.getItem('sawInvite')") is None)

    print("D. Платформа уже открыта в соседней вкладке")
    home = participant(ctx, "S2", 1100, 750)
    home.goto(f"{BASE}/index.html")
    own2 = t54.wait_code(home)
    tab2 = participant(ctx, "S2", 1100, 750)
    tab2.goto(link)
    info = wait_invite(tab2, "ok")
    check("D: во второй вкладке — окно подключения", bool(info))
    tab2.click("#tsInvMain")
    try:
        t11.wait_stage(tab2)
        got = frame_code(tab2)
    except Exception as e:
        got = str(e)[:120]
    check("D: вторая вкладка подключилась", got == code, got)
    check("D: первая вкладка — со своей сессией, учитель в ней",
          home.evaluate("() => [TrainerSession.getCode(), TrainerSession.isLeader()]") == [own2, True])

    print("E. «Отмена»")
    cancel = participant(ctx, "S3", 1100, 750)
    cancel.goto(link)
    wait_invite(cancel, "ok")
    cancel.click("#tsInvSecond")
    try:
        cancel.wait_for_url(lambda u: "oge8.html" in u and "s=" not in u, timeout=10000)
        own = t54.wait_code(cancel)
        cancel.wait_for_timeout(600)
        ok = own != code and cancel.evaluate("() => TrainerSession.isLeader()") and "stage.html" not in cancel.url
    except Exception:
        ok = False
    check("E: «Отмена» — обычная страница со своей сессией, без сцены", ok, cancel.url)
    check("E: после «Отмены» окна нет", cancel.evaluate("() => !document.getElementById('tsInvite')"))

    print("F. Завершённое занятие")
    t2, code2, link2 = teacher_on(ctx, "oge9", tag="T2")
    t2.evaluate("() => TrainerSession.endSession()")
    t2.wait_for_function("c => TrainerSession.getCode() && TrainerSession.getCode() !== c", arg=code2)
    late = participant(ctx, "S4", 1100, 750)
    late.goto(link2)
    info = wait_invite(late, "ended")
    check("F: «Это занятие уже завершено»", bool(info) and info["h"] == "Это занятие уже завершено", info)
    check("F: с кнопками «На главную» и «Остаться на этой странице»",
          bool(info) and info["main"] == "На главную" and info["second"] == "Остаться на этой странице", info)
    check("F: и полем для другого кода", bool(info) and info["form"], info)
    late.click("#tsInvSecond")
    try:
        late.wait_for_url(lambda u: "oge9.html" in u and "s=" not in u, timeout=10000)
        own = t54.wait_code(late)
        ok = own != code2 and late.evaluate("() => TrainerSession.isLeader()")
    except Exception:
        ok = False
    check("F: «Остаться» — обычная страница, к завершённому не подключается", ok, late.url)

    print("G. Неверный код")
    wrong = participant(ctx, "S5", 1100, 750)
    wrong.goto(f"{BASE}/oge8.html?s=ZZZZ2222")
    check("G: сначала «Проверяем ссылку…»", bool(wait_invite(wrong, "checking", 3000)))
    info = wait_invite(wrong, "not_found")
    check("G: «Сессия не найдена» с кодом из ссылки",
          bool(info) and info["h"] == "Сессия не найдена" and "ZZZZ2222" in (info["text"] or ""), info)
    check("G: поле для кода есть", bool(info) and info["form"], info)
    wrong.fill("#tsInvInput", "  " + code[:4].lower() + " " + code[4:].lower() + " ")
    wrong.click("#tsInvInputBtn")
    try:
        t11.wait_stage(wrong)
        got = frame_code(wrong)
    except Exception as e:
        got = str(e)[:120]
    check("G: код, набранный вручную (строчными, с пробелами), подключает сразу", got == code, got)

    print("H. Учитель ушёл, строка сессии осталась")
    t3, code3, link3 = teacher_on(ctx, "oge6", tag="T3")
    t3.close()
    away = participant(ctx, "S6", 1100, 750)
    away.goto(link3)
    info = wait_invite(away, "ok")
    check("H: окно подключения с названием", bool(info) and info["name"] == "ОГЭ №6 — вычисления", info)
    away.wait_for_timeout(2000)
    check("H: пока проба идёт, пометки нет (сокет бывает холодным)", away.evaluate("() => document.getElementById('tsInvAway').hidden"))
    try:
        away.wait_for_function("() => !document.getElementById('tsInvAway').hidden", timeout=9000)
        ok = True
    except Exception:
        ok = False
    check("H: пометка «Учитель сейчас не на связи»", ok)

    print("I. Учитель открыл свою ссылку в своей вкладке")
    teacher.evaluate("() => sessionStorage.removeItem('sawInvite')")
    teacher.goto(link)
    t54.wait_code(teacher)
    teacher.wait_for_timeout(1200)
    st = teacher.evaluate("() => [TrainerSession.getCode(), TrainerSession.isLeader(), location.search.indexOf('s=') < 0, !!document.getElementById('tsInvite')]")
    check("I: остался учителем той же сессии, без окна, ?s= из адреса убран", st == [code, True, True, False], st)
    check("I: на сцену не ушёл", "stage.html" not in teacher.url, teacher.url)
    try:
        teacher.wait_for_function("() => window.TrainerSession.hasViewers()", timeout=8000)
        ok = True
    except Exception:
        ok = False
    check("I: ученики по-прежнему у него на связи", ok)

    print("J. Вход по коду вручную в панели")
    manual = participant(ctx, "S7", 1100, 750)
    manual.goto(f"{BASE}/index.html")
    t54.wait_code(manual)
    open_panel(manual)
    manual.fill("#tsJoinInput", " " + link + " ")
    manual.click("#tsJoin")
    try:
        t11.wait_stage(manual)
        got = frame_code(manual)
    except Exception as e:
        got = str(e)[:120]
    check("J: вставили ссылку целиком в поле кода — подключение", got == code, got)
    check("J: окно приглашения второй раз не спрашивает", manual.evaluate("() => sessionStorage.getItem('sawInvite')") is None)

    print("K. Адрес сцены с неверным кодом")
    st_page = participant(ctx, "S8", 1000, 700)
    st_page.goto(f"{BASE}/stage.html?s=ZZZZ3333&to=oge8.html")
    try:
        st_page.wait_for_function("() => document.getElementById('ended').classList.contains('on')"
                                  " && document.getElementById('endedTitle').textContent === 'Сессия не найдена'", timeout=15000)
        ok = True
    except Exception:
        ok = False
    check("K: на сцене — «Сессия не найдена», а не пустой экран", ok)
    st_page.click("#endedStay")
    try:
        st_page.wait_for_url(lambda u: "oge8.html" in u and "s=" not in u and "stage.html" not in u, timeout=10000)
        t54.wait_code(st_page)
        ok = st_page.evaluate("() => TrainerSession.isLeader()")
    except Exception:
        ok = False
    check("K: «Открыть страницу без сессии» — обычная страница", ok, st_page.url)
    ctx.close()


def part_l(browser):
    print("L. Доски")
    ctx = browser.new_context()
    t = participant(ctx, "T", 1300, 820)
    t.goto(f"{BASE}/boards.html")
    t.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()")
    t.evaluate(BS.SEED_JS)
    t.reload()
    code = t54.wait_code(t)
    t.evaluate(BS.BOOT_JS)
    t.wait_for_function("() => window.getDB && window.getDB().boards.length >= 2")
    t.evaluate("() => window.openBoard('bA')")
    t.wait_for_function("() => window.getCurrentBoard() && window.getCurrentBoard().id === 'bA' && boardActive")
    # название открытой доски уходит в строку сессии (раз в секунду)
    try:
        t.wait_for_function("c => { const r = JSON.parse(localStorage.getItem('fakeTrainerSessions') || '{}')[c];"
                            " return r && r.state && r.state.__title === 'Доска «Урок»'; }", arg=code, timeout=6000)
        ok = True
    except Exception:
        ok = False
    check("L: название открытой доски попадает в строку сессии", ok)
    link = t.evaluate("() => TrainerSession.getShareUrl()")
    check("L: ссылка с досок — boards.html?s=КОД", link.endswith(f"/boards.html?s={code}"), link)
    open_panel(t)
    check("L: в панели досок обе кнопки копирования",
          t.evaluate("() => !!document.getElementById('tsCopyCode') && !!document.getElementById('tsCopy')"))

    s = participant(ctx, "S", 1100, 750)
    s.goto(link)
    info = wait_invite(s, "ok")
    check("L: окно с названием доски", bool(info) and info["name"] == "Доска «Урок»", info and info["name"])
    gate = s.evaluate("() => { const g = document.getElementById('authGate'); return !!g && getComputedStyle(g).display !== 'none'; }")
    check("L: экрана входа нет — ученику аккаунт не нужен", not gate)
    s.click("#tsInvMain")
    try:
        t11.wait_stage(s)
        f = t11.stage_frame(s)
        tids = t.evaluate(BS.TEACHER_STATE)["ids"]
        ok = BS.wait_js(f, "ids => { const B = window.getCurrentBoard(); return B && B.objects && B.objects.map(o => o.id).join() === ids.join(); }",
                        15000, tids)
    except Exception:
        ok = False
    check("L: «Подключиться» — доска учителя у ученика на сцене", ok)

    s2 = participant(ctx, "S2", 1100, 750)
    s2.goto(link)
    wait_invite(s2, "ok")
    s2.click("#tsInvSecond")
    try:
        s2.wait_for_url(lambda u: u.endswith("/boards.html"), timeout=10000)
        s2.wait_for_timeout(800)
        ok = s2.evaluate("() => !window.__boardViewer && !!document.getElementById('authGate')")
    except Exception:
        ok = False
    check("L: «Отмена» — обычные доски (свой вход), не просмотр учителя", ok, s2.url)
    ctx.close()


def part_m(browser):
    print("M. Телефон")
    ctx = browser.new_context(is_mobile=True, has_touch=True, viewport={"width": 390, "height": 844}, device_scale_factor=2)
    teacher, code, link = teacher_on(ctx, "oge8")
    phone = participant(ctx, "S", 390, 844)
    phone.goto(link)
    info = wait_invite(phone, "ok")
    check("M: на телефоне — окно подключения", bool(info), info)
    box = phone.evaluate("""() => { const c = document.querySelector('#tsInvite .ts-inv-card').getBoundingClientRect();
        const b = document.getElementById('tsInvMain').getBoundingClientRect();
        return { l: c.left, r: c.right, t: c.top, b: c.bottom, w: innerWidth, h: innerHeight, bh: b.height, bw: b.width }; }""")
    check("M: окно целиком на экране", box["l"] >= 0 and box["r"] <= box["w"] and box["t"] >= 0 and box["b"] <= box["h"], box)
    check("M: кнопка «Подключиться» под палец (не ниже 44 px)", box["bh"] >= 44 and box["bw"] >= 200, box)
    phone.tap("#tsInvMain")
    try:
        t11.wait_stage(phone)
        got = frame_code(phone)
    except Exception as e:
        got = str(e)[:120]
    check("M: касание «Подключиться» — сцена с кодом учителя", got == code, got)
    ctx.close()


def run():
    with t11.local_server():
        with sync_playwright() as p:
            browser = p.chromium.launch()
            for part in (part_a, part_b_to_k, part_l, part_m):
                try:
                    part(browser)
                except Exception as e:
                    failures.append(f"{part.__name__}: {e}")
                    print("  FAIL исключение:", e)
            browser.close()
    real_errors = [e for e in errors if "ResizeObserver" not in e]
    print()
    if real_errors:
        print("ОШИБКИ JS:")
        for e in real_errors[:20]:
            print(" -", e)
    if failures or real_errors:
        print(f"ИТОГ: {len(failures)} провалов, {len(real_errors)} ошибок JS")
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    run()
