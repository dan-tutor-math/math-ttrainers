"""
Правка «банк ФИПИ №19»: в oge19 появился тип «Задания из открытого банка ФИПИ».

Проверяет:
  1. данные банка (oge19-fipi-bank.js): 150 заданий, 122 утверждения, у каждого
     задания с одним ответом ровно одно верное утверждение, ответ для бланка
     совпадает с разметкой, все ответы отмечены как принятые сайтом ФИПИ;
  2. экран выбора: третья карточка «Задания из открытого банка ФИПИ» с подписью
     источника, демоверсия и прежний тип на месте;
  3. задание: условие как у ФИПИ, три утверждения ровно в порядке задания из
     банка, под ними подпись «Источник: открытый банк заданий ФИПИ, задание …»;
  4. верный ответ засчитан и разбор показывает номер(а), неверный — ошибка;
  5. в прежнем типе подписи источника нет;
  6. подпись едет в «Подборку» вместе с заданием (она внутри #questionPanel);
  7. совместная сессия: ученик из снимка учителя получает то же задание ФИПИ
     с той же подписью;
  8. если файл банка не загрузился, типа нет, а тренажёр работает без ошибок.

Совместный режим здесь без сети: живьём (вебсокет к Supabase) его нужно
перепроверять на сайте руками.

Запуск: python3 test_prompt_fipi19.py (сервер поднимается сам).
"""
import contextlib
import http.client
import json
import os
import re
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 9131
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
SRC_RE = re.compile(r"^Источник: открытый банк заданий ФИПИ, задание ([0-9A-F]{6})$")


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT)], cwd=HERE,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        for _ in range(50):
            try:
                conn = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                conn.request("GET", "/index.html")
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


results = []


def check(name, ok, extra=""):
    results.append((name, ok))
    print(f"[{'OK' if ok else 'FAIL'}] {name}" + (f": {extra}" if extra and not ok else ""))


def load_bank():
    # банк — обычный JS с одним присваиванием; берём JSON после «=»
    src = open(os.path.join(HERE, "oge19-fipi-bank.js"), encoding="utf-8").read()
    body = src[src.index("window.OGE19_FIPI = ") + len("window.OGE19_FIPI = "):].rstrip().rstrip(";")
    return json.loads(body)


def new_page(browser, url, wait=1200, block_bank=False):
    ctx = browser.new_context(viewport={"width": 1300, "height": 1000})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    if block_bank:
        page.route("**/oge19-fipi-bank.js", lambda route: route.abort())
    page.goto(url)
    page.wait_for_timeout(wait)
    return ctx, page, errors


def test_bank_data(bank):
    st, tasks = bank["statements"], bank["tasks"]
    check("банк: 150 заданий и 122 утверждения", len(tasks) == 150 and len(st) == 122, f"{len(tasks)} / {len(st)}")
    check("банк: у каждого утверждения текст, верность и пояснение",
          all(s["text"] and isinstance(s["isTrue"], bool) and s["explain"] for s in st))
    check("банк: пояснение начинается с того же «Верно/Неверно», что и разметка",
          all(s["explain"].startswith("Верно") == s["isTrue"] for s in st))
    check("банк: номера ФИПИ уникальны", len({t["fipi"] for t in tasks}) == 150)
    check("банк: в каждом задании три утверждения из банка",
          all(len(t["s"]) == 3 and all(0 <= i < len(st) for i in t["s"]) for t in tasks))
    single_ok = all(sum(st[i]["isTrue"] for i in t["s"]) == 1 for t in tasks if not t["multi"])
    check("банк: в заданиях с одним ответом ровно одно верное утверждение", single_ok)
    ans_ok = all(t["answer"] == "".join(str(k + 1) for k, i in enumerate(t["s"]) if st[i]["isTrue"]) for t in tasks)
    check("банк: ответ для бланка совпадает с разметкой", ans_ok)
    check("банк: все ответы приняты сайтом ФИПИ", all(t["checked"] for t in tasks))
    check("банк: нет битых символов в текстах", not any("�" in s["text"] for s in st))


def test_picker_and_task(browser, bank):
    ctx, page, errors = new_page(browser, f"{BASE}/oge19.html")
    cards = page.eval_on_selector_all('#modesGrid .mode-card', 'es => es.map(e => [e.dataset.id, e.innerText])')
    check("выбор: демоверсия, прежний тип и тип ФИПИ", [c[0] for c in cards] == ['demo2027', 'geom', 'fipi'], str(cards))
    fipi_card = dict(cards).get('fipi', '')
    check("выбор: на карточке название и источник",
          'Задания из открытого банка ФИПИ' in fipi_card and 'источник: открытый банк заданий ФИПИ' in fipi_card
          and '150 заданий' in fipi_card, fipi_card)

    page.click('.mode-card[data-id="fipi"]')
    page.wait_for_timeout(500)
    by_id = {t["fipi"]: t for t in bank["tasks"]}
    ok_all = True
    for k in range(12):  # несколько заданий подряд — разные ветки (один ответ / несколько)
        note = page.inner_text('#sourceNote').strip()
        m = SRC_RE.match(note)
        visible = page.eval_on_selector('#sourceNote', 'e => getComputedStyle(e).display') != 'none'
        if not (m and visible and m.group(1) in by_id):
            ok_all = False
            check("задание: подпись источника с номером ФИПИ", False, note)
            break
        t = by_id[m.group(1)]
        shown = page.eval_on_selector_all('#stmtList .stext', 'es => es.map(e => e.textContent)')
        want = [bank["statements"][i]["text"] for i in t["s"]]
        prompt = page.inner_text('#questionPromptText')
        if shown != want or (('Какие' in prompt) != t["multi"]) or 'истинн' not in prompt:
            ok_all = False
            check("задание: утверждения и условие как у ФИПИ", False, f"{t['fipi']}: {shown} / {prompt}")
            break
        if k == 0:
            # неверный ответ: отмечаем первое неверное утверждение
            wrong = next(j for j, i in enumerate(t["s"]) if not bank["statements"][i]["isTrue"])
            page.click(f'#stmtList .stmt[data-i="{wrong}"]')
            page.click('#checkBtn')
            page.wait_for_timeout(300)
            check("ответ: неверный засчитан ошибкой", page.evaluate("totalErrors") == 1)
        else:
            for j, i in enumerate(t["s"]):
                if bank["statements"][i]["isTrue"]:
                    page.click(f'#stmtList .stmt[data-i="{j}"]')
            errs_before = page.evaluate("totalErrors")
            page.click('#checkBtn')
            page.wait_for_timeout(300)
            if not page.evaluate("taskAnswered") or page.evaluate("totalErrors") != errs_before:
                ok_all = False
                check("ответ: верный засчитан", False, t["fipi"])
                break
            nums = ", ".join(str(j + 1) for j, i in enumerate(t["s"]) if bank["statements"][i]["isTrue"])
            if nums not in page.inner_text('#explainBox'):
                ok_all = False
                check("ответ: разбор с номерами верных", False, nums)
                break
        page.click('#refreshBtn')
        page.wait_for_timeout(250)
    check("задание: 12 заданий подряд — подпись, порядок утверждений, условие, проверка", ok_all)

    rich = page.evaluate("window.Basket.extractFromSelectorsRich(['#questionPanel']).text")
    check("подборка: подпись источника уходит вместе с заданием", 'Источник: открытый банк заданий ФИПИ' in rich, rich[-120:])

    st = page.evaluate("window.__trainerState.get()")
    check("сессия: задание с номером ФИПИ в общем снимке", st.get("curMode") == 'fipi' and st["curTask"].get("fipi") in by_id)

    page.click('#backBtn')
    page.wait_for_timeout(200)
    page.click('.mode-card[data-id="geom"]')
    page.wait_for_timeout(400)
    hidden = page.eval_on_selector('#sourceNote', 'e => getComputedStyle(e).display') == 'none'
    check("прежний тип: подписи источника нет", hidden and page.evaluate("curTask.statements.length") == 5)
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    # ученик: снимок учителя — то же задание ФИПИ и та же подпись
    ctx, page, errors = new_page(browser, f"{BASE}/oge19.html")
    page.evaluate("(s) => window.__trainerState.apply(s)", st)
    page.wait_for_timeout(400)
    note = page.inner_text('#sourceNote').strip()
    shown = page.eval_on_selector_all('#stmtList .stext', 'es => es.map(e => e.textContent)')
    check("сессия: у ученика то же задание и подпись",
          note.endswith(st["curTask"]["fipi"]) and shown == [s["text"] for s in st["curTask"]["statements"]], note)
    check("сессия: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_without_bank(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge19.html", block_bank=True)
    ids = page.eval_on_selector_all('#modesGrid .mode-card', 'es => es.map(e => e.dataset.id)')
    check("без файла банка: типа ФИПИ нет, остальные на месте", ids == ['demo2027', 'geom'], str(ids))
    page.click('.mode-card[data-id="geom"]')
    page.wait_for_timeout(400)
    check("без файла банка: прежний тип работает", page.evaluate("curTask.statements.length") == 5)
    check("без файла банка: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def main():
    bank = load_bank()
    test_bank_data(bank)
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        test_picker_and_task(browser, bank)
        test_without_bank(browser)
        browser.close()
    failed = [n for n, ok in results if not ok]
    print(f"\n{len(results) - len(failed)}/{len(results)} проверок прошло")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
