"""
Промпт №59: ЕГЭ — в совместной сессии задание не показывалось у ученика.

Что было сломано: учитель открывает задание (с главной или карточкой в
списке прототипов) — у ученика страница переключалась на экран задания, но
карточка пустая: ни условия, ни «№1 · прототип 1 из 4». Появлялось только
после смены прототипа. Причина: при запуске страница стоит на первом
прототипе номера из адреса, но ничего не рисует (открыт список), а
tsApplyState звал openTask, только если номер или прототип ОТЛИЧАЛИСЬ.
Первый прототип совпадал — и условие так и не рисовалось.

Проверяем (на ege_base и ege_prof):
  A. ученик уже в сессии на том же номере, учитель открывает первый
     прототип — у ученика условие и заголовок те же, что у учителя;
  B. учитель уже стоит на первом прототипе, ученик подключается позже
     (снимок из базы) — у ученика условие нарисовано;
  C. смена прототипа и возврат к списку по-прежнему доезжают;
  D. снимок с неизвестным прототипом (банк у собеседника новее) не
     переоткрывает задание на каждом снимке — конспект урока не растёт.

Живой realtime из песочницы недоступен: заглушка supabase-js та же, что в
тесте №54. Живьём совместный режим нужно перепроверить на сайте.

Запуск: python3 test_prompt59_ege_first_proto_sync.py (сервер поднимается сам).
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt54_trainer_sync_and_cards as t54

PORT = 8980
t54.PORT = PORT
BASE = f"http://127.0.0.1:{PORT}"


def question(page):
    return page.evaluate("""() => ({
        text: document.getElementById('questionText').innerText.trim(),
        title: document.getElementById('taskTitle').textContent.trim(),
        onTask: document.getElementById('taskArea').style.display === 'block',
    })""")


def wait_code(page):
    page.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()", timeout=10000)
    return page.evaluate("() => window.TrainerSession.getCode()")


def wait_same_task(student, teacher, failures, label):
    want = question(teacher)
    try:
        student.wait_for_function(
            """(w) => { const q = document.getElementById('questionText').innerText.trim();
                        return document.getElementById('taskArea').style.display === 'block'
                          && q === w.text && document.getElementById('taskTitle').textContent.trim() === w.title; }""",
            arg=want, timeout=6000)
        return True
    except Exception:
        got = question(student)
        failures.append(f"{label}: у ученика «{got['title']}» / {len(got['text'])} симв. условия, "
                        f"у учителя «{want['title']}» / {len(want['text'])} симв.")
        return False


def check_page(browser, slug, n, failures, errors):
    # A. ученик уже на странице, учитель открывает первый прототип
    ctx = browser.new_context()
    teacher = t54.new_page(ctx, errors)
    teacher.goto(f"{BASE}/{slug}.html?n={n}")
    code = wait_code(teacher)
    student = t54.new_page(ctx, errors, latency=30)
    # так же, как рассылка 'navigate' с главной: номер в адресе и код
    student.goto(f"{BASE}/{slug}.html?n={n}&s={code}")
    wait_code(student)
    student.wait_for_timeout(900)
    teacher.click('#protoList .mode-card')
    tq = question(teacher)
    if not tq["text"]:
        failures.append(f"A/{slug}: у учителя самого пустое условие")
    if wait_same_task(student, teacher, failures, f"A/{slug} №{n}"):
        print(f"  A/{slug} №{n}: первый прототип у ученика нарисован ({tq['title']})")

    # C. смена прототипа и возврат к списку
    teacher.click('#nextProtoBtn')
    if wait_same_task(student, teacher, failures, f"C/{slug}: следующий прототип"):
        print(f"  C/{slug}: следующий прототип доехал ({question(teacher)['title']})")
    teacher.click('#prevProtoBtn')
    wait_same_task(student, teacher, failures, f"C/{slug}: возврат к первому прототипу")
    teacher.click('#backBtn')
    try:
        student.wait_for_function("() => document.getElementById('pickerArea').style.display === 'block'", timeout=5000)
    except Exception:
        failures.append(f"C/{slug}: возврат к списку прототипов не доехал")
    # и снова первый прототип из списка — теперь он у ученика уже был нарисован
    teacher.click('#protoList .mode-card')
    if wait_same_task(student, teacher, failures, f"C/{slug}: повторное открытие из списка"):
        print(f"  C/{slug}: список ↔ задание доезжают")
    ctx.close()

    # B. учитель уже на первом прототипе, ученик подключается позже
    ctx = browser.new_context()
    teacher = t54.new_page(ctx, errors)
    teacher.goto(f"{BASE}/{slug}.html?n={n}")
    code = wait_code(teacher)
    teacher.click('#protoList .mode-card')
    teacher.wait_for_timeout(1200)   # дать снимку уйти в «базу»
    student = t54.new_page(ctx, errors)
    student.goto(f"{BASE}/{slug}.html?n={n}&s={code}")
    wait_code(student)
    if wait_same_task(student, teacher, failures, f"B/{slug} №{n}"):
        print(f"  B/{slug} №{n}: подключившийся позже видит условие")

    # D. неизвестный прототип не переоткрывает задание на каждом снимке.
    # Считаем вызовы openTask: каждый лишний — это снимок в конспект урока
    res = student.evaluate("""() => {
        const s = tsGetState();
        const orig = window.openTask;
        let opened = 0;
        window.openTask = function(){ opened++; return orig.apply(this, arguments); };
        try {
            for (let i = 0; i < 5; i++) {
                tsApplyStateFromPeer(Object.assign({}, s, { egePid: 'нет-такого', __tsRev: 1000 + i, __tsBy: 'zzz' }));
            }
        } finally { window.openTask = orig; }
        return { opened, text: document.getElementById('questionText').innerText.trim().length };
    }""")
    if res["opened"] > 1:
        failures.append(f"D/{slug}: неизвестный прототип переоткрывал задание {res['opened']} раз из 5 снимков")
    if not res["text"]:
        failures.append(f"D/{slug}: после неизвестного прототипа условие пустое")
    print(f"  D/{slug}: openTask на 5 снимков с неизвестным прототипом — {res['opened']} раз, условие на месте")
    ctx.close()


def run():
    failures, errors = [], []
    with t54.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        for slug, n in (("ege_base", 1), ("ege_base", 6), ("ege_prof", 7)):
            check_page(browser, slug, n, failures, errors)
        browser.close()
    if errors:
        failures.extend("ошибка JS: " + e for e in errors)
    if failures:
        print("\nПРОВАЛ:")
        for f in failures:
            print("  - " + f)
        sys.exit(1)
    print("\nВсё прошло.")


if __name__ == "__main__":
    run()
