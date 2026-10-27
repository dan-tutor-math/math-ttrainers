"""
Правка «банк ФИПИ №20»: в ОГЭ, часть 2 (oge_part2.html?n=20) — все задания №20
из открытого банка ФИПИ, собранные в группы по виду.

Проверяет:
  1. данные (oge-part2-fipi.js): 200 заданий, номера ФИПИ уникальны, у каждого
     задания есть группа, раздел, условие, поле ответа, решение по шагам; нет
     битых символов и голых «<» в условиях;
  2. ответы: КАЖДОЕ из 200 заданий — эталон из банка проходит проверку
     страницы (checkField), а испорченный ответ — нет; у «пар» порядок пар не
     важен, а x и y местами менять нельзя;
  3. список: демоверсия первой, разделы, карточки групп с числом заданий,
     подпись «… и открытый банк заданий ФИПИ», русские числительные;
  4. задание: шапка «<группа> · задание k из N», подпись источника с номером
     ФИПИ, ◀ ▶ и «Следующее задание» ходят только внутри группы;
  5. верный ответ засчитан, на карточке группы «✓ 1 из N»; запись, которую не
     разобрали, — просьба переписать, а не ошибка;
  6. «+3»: карточки той же группы и с подписью источника;
  7. подпись едет в «Подборку»; снимок совместной сессии у ученика открывает
     то же задание ФИПИ;
  8. без файла *-fipi.js — только демоверсия, как было; ЕГЭ не задело;
  9. проверка ответа на доске (trainer-tasks.js) понимает «пары»;
 10. sync_ege_pages.py --check; телефон 375 px — без прокрутки вбок.

Совместный режим здесь без сети: живьём (вебсокет к Supabase) его нужно
перепроверять на сайте руками.

Запуск: python3 test_prompt_fipi20.py (сервер поднимается сам).
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

PORT = 9151
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
TOTAL = 200
SRC_RE = re.compile(r"Источник: открытый банк заданий ФИПИ, задание ([0-9A-F]{6})")


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


def load_fipi():
    # оглавление + файлы номеров (с «раздельного файла» задания номера лежат отдельно)
    def body(name, marker):
        src = open(os.path.join(HERE, name), encoding="utf-8").read()
        return json.loads(src[src.index(marker) + len(marker):].rstrip().rstrip(";"))
    F = body("oge-part2-fipi.js", "window.OGE_PART2_FIPI = ")
    for n, name in F["files"].items():
        F["tasks"][n] = body(name, ".tasks['" + n + "'] = ")
    return F


def new_page(browser, url, wait=1200, width=1300, block_fipi=False):
    ctx = browser.new_context(viewport={"width": width, "height": 1000})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    if block_fipi:
        page.route("**/oge-part2-fipi*.js", lambda route: route.abort())
    page.goto(url)
    page.wait_for_timeout(wait)
    return ctx, page, errors


def test_data(F):
    t = F["tasks"]["20"]
    protos, groups = t["protos"], t["groups"]
    check(f"данные: {TOTAL} заданий №20", len(protos) == TOTAL, str(len(protos)))
    ids = [p["fipi"] for p in protos]
    check("данные: номера ФИПИ уникальны и шестизначные",
          len(set(ids)) == len(ids) and all(re.fullmatch(r"[0-9A-F]{6}", i) for i in ids))
    gids = {g["id"] for g in groups}
    secs = {s["id"] for s in t["sections"]}
    check("данные: у каждой группы раздел, название и идея",
          all(g["section"] in secs and g["title"] and g["hint"] for g in groups))
    check("данные: у каждого задания группа, условие, поле, ответ и решение",
          all(p["group"] in gids and p["text"] and len(p["fields"]) == 1 and p["answerTex"] and len(p["steps"]) >= 2
              for p in protos))
    check("данные: в каждой группе есть задания", all(any(p["group"] == g for p in protos) for g in gids))
    bad = [p["fipi"] for p in protos if "�" in p["text"] or re.search(r"<(?![a-z/])", p["text"])
           or p["text"].count("$") % 2]
    check("данные: условия без битых символов, голых «<» и непарных $", not bad, str(bad[:5]))
    check("данные: критерии ФИПИ на номер (2, 1, 0 баллов)", [c[0] for c in t["criteria"]] == [2, 1, 0])


def spoil(f):
    """испорченный ответ того же вида: на единицу больше первое число"""
    v = f["value"]
    m = re.search(r"-?\d+", v)
    return v[:m.start()] + str(int(m.group()) + 1) + v[m.end():]


def test_answers(browser, F):
    ctx, page, errors = new_page(browser, f"{BASE}/oge_part2.html?n=20")
    res = page.evaluate("""(spoiled) => protos(20).filter(p => p.fipi).map((p, i) => {
        const f = p.fields[0], st = { yn: {} };
        return [p.fipi, checkField(f, f.value, st), checkField(f, spoiled[p.fipi], st)];
    })""", {p["fipi"]: spoil(p["fields"][0]) for p in F["tasks"]["20"]["protos"]})
    good = [r for r in res if r[1] is True and r[2] is False]
    check(f"ответы: все {TOTAL} эталонов принимаются, испорченные — нет", len(good) == TOTAL,
          str([r for r in res if not (r[1] is True and r[2] is False)][:3]))
    pairs = page.evaluate("""() => {
        const f = { id: 'ans', type: 'pairs', value: '(-1; 4); (1; 4)' }, st = { yn: {} };
        return [checkField(f, '(1;4);(-1;4)', st), checkField(f, '(1; 4), (−1; 4)', st), checkField(f, '(4;1);(4;-1)', st),
                checkField(f, '(1;4)', st), checkField(f, '1; 4', st), checkField(f, '(2/3; 0); (1; 4)', st)];
    }""")
    check("пары: порядок пар не важен, x и y не путаются, без скобок — просьба переписать",
          pairs == [True, True, False, False, None, False], str(pairs))
    nums = page.evaluate("""() => {
        const f = { id: 'ans', type: 'nums', value: '4-√(7); 4+√(7)' }, st = { yn: {} };
        return [checkField(f, '4+√7; 4-√7', st), checkField(f, '4 + sqrt(7); 4 - корень(7)', st), checkField(f, '4+√7', st)];
    }""")
    check("корни: запись с √ в любом порядке", nums == [True, True, False], str(nums))
    check("ответы: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_picker_and_task(browser, F):
    t20 = F["tasks"]["20"]
    ctx, page, errors = new_page(browser, f"{BASE}/oge_part2.html?n=20")
    title = page.eval_on_selector('#pickerTitle', 'e => e.textContent')
    check("список: подпись с числом заданий и обоими источниками",
          title == f"Задания №20 · {TOTAL + 1} штука · демоверсия ОГЭ 2027 и открытый банк заданий ФИПИ", title)
    first = page.inner_text('#protoList .mode-card .mtitle')
    check("список: демоверсия первой", first == '№0. Задание из демоверсии ОГЭ 2027', first)
    secs = page.eval_on_selector_all('#protoList .proto-section', 'es => es.map(e => e.textContent)')
    check("список: разделы по порядку", secs == [s["title"] for s in t20["sections"]], str(secs))
    cards = page.eval_on_selector_all('#protoList .mode-card[data-gid]', 'es => es.map(e => [e.dataset.gid, e.querySelector(".mcount").textContent])')
    want = []
    for g in t20["groups"]:
        k = sum(p["group"] == g["id"] for p in t20["protos"])
        want.append([g["id"], f"{k} {'задание' if k % 10 == 1 and k % 100 != 11 else ('задания' if 2 <= k % 10 <= 4 and not 12 <= k % 100 <= 14 else 'заданий')}"])
    check("список: карточка на каждую группу с числом заданий", cards == want, str(cards[:3]))
    tall = page.evaluate("Math.max(...[...document.querySelectorAll('#protoList .mode-card')].map(e => e.offsetHeight))")
    check("список: системы в подписи карточки — в строку, карточки не раздуты", tall < 110, str(tall))

    # группа систем: «Сложение уравнений»
    g = next(g for g in t20["groups"] if g["id"] == "sys_add")
    items = [p for p in t20["protos"] if p["group"] == "sys_add"]
    page.click('.mode-card[data-gid="sys_add"]')
    page.wait_for_timeout(400)
    head = page.inner_text('#taskTitle')
    check("задание: шапка «группа · задание 1 из N»", head == f"{g['title']} · задание 1 из {len(items)}", head)
    note = page.inner_text('#egeQuestion')
    m = SRC_RE.search(note)
    check("задание: подпись источника с номером ФИПИ первого задания группы", m and m.group(1) == items[0]["fipi"], note[-80:])
    check("задание: кнопки «Предыдущее/Следующее задание»",
          page.inner_text('#nextProtoBtn') == 'Следующее задание ▶' and page.inner_text('#prevProtoBtn') == '◀ Предыдущее задание')
    seen = []
    for _ in range(len(items)):
        seen.append(page.evaluate("curProto.fipi"))
        page.click('#nextProtoBtn')
        page.wait_for_timeout(120)
    back = page.evaluate("curProto.fipi")
    check("◀ ▶: проходят группу по кругу и не выходят из неё",
          seen == [p["fipi"] for p in items] and back == items[0]["fipi"], str(seen[:3]))
    page.click('#prevProtoBtn')
    page.wait_for_timeout(150)
    check("◀: с первого — на последнее задание группы", page.evaluate("curProto.fipi") == items[-1]["fipi"])
    page.click('#nextProtoBtn')
    page.wait_for_timeout(150)

    # рядом с ◀ ▶ заданий — переход между типами (группами), как в №1–19
    check("задание: рядом кнопки «Предыдущий/Следующий тип»",
          page.is_visible('#prevTypeBtn') and page.is_visible('#nextTypeBtn')
          and page.inner_text('#nextTypeBtn') == 'Следующий тип ▶' and page.inner_text('#prevTypeBtn') == '◀ Предыдущий тип')
    gi = [x["id"] for x in t20["groups"]].index("sys_add")
    nxt = next(x for x in t20["groups"][gi + 1:] if any(p["group"] == x["id"] for p in t20["protos"]))
    page.click('#nextTypeBtn')
    page.wait_for_timeout(200)
    check("Следующий тип ▶: открывает следующую группу с первого задания",
          page.evaluate("curProto.group") == nxt["id"] and page.inner_text('#taskTitle').startswith(nxt["title"] + ' · задание 1 из'),
          page.inner_text('#taskTitle'))
    page.click('#prevTypeBtn')
    page.wait_for_timeout(200)
    check("◀ Предыдущий тип: возвращает в группу", page.evaluate("curProto.fipi") == items[0]["fipi"])

    # проверка: запись без скобок — просьба, неверно — ошибка, верно — засчитано
    page.fill('#answerArea input.answer-input', '1; 4')
    page.click('#answerArea .check-btn')
    page.wait_for_timeout(200)
    check("ответ: запись без скобок — просьба переписать, не ошибка",
          page.evaluate("totalErrors === 0 && !S.answered") and 'подсказано' in page.inner_text('#answerArea .answer-msg'))
    page.fill('#answerArea input.answer-input', spoil(items[0]["fields"][0]))
    page.click('#answerArea .check-btn')
    page.wait_for_timeout(200)
    check("ответ: неверный — ошибка", page.evaluate("totalErrors === 1 && !S.answered"))
    page.fill('#answerArea input.answer-input', items[0]["fields"][0]["value"])
    page.click('#answerArea .check-btn')
    page.wait_for_timeout(300)
    check("ответ: верный засчитан", page.evaluate("S.answered && S.correct && totalSolved === 1"))
    shown = page.evaluate("[...document.querySelectorAll('#solSteps .sol-step')].every(e => e.style.display === 'flex')")
    hint = page.inner_text('#solHint')
    check("разбор: идея группы, шаги, ответ и критерии",
          shown and g["hint"][:20].replace('$', '') in hint.replace('\n', '') or (shown and hint.startswith('Идея.')),
          hint[:80])
    check("разбор: критерии ФИПИ открыты", page.eval_on_selector('#critBox', 'e => e.style.display') == 'block')
    check("после ответа: «Следующее задание →»", page.inner_text('#nextBtn') == 'Следующее задание →')

    # «+3»: карточки той же группы с подписью источника
    page.click('#addRailToggle')
    page.click('.add-qty-btn[data-n="3"]')
    page.wait_for_timeout(500)
    cg = page.evaluate("S.cards.map(c => protoById(20, c.pid).group)")
    notes = page.eval_on_selector_all('.added-task-card .added-card-question', 'es => es.map(e => e.innerText)')
    check("«+3»: карточки той же группы", cg == ['sys_add'] * 3, str(cg))
    check("«+3»: у карточек подпись источника", len(notes) == 3 and all(SRC_RE.search(n) for n in notes))
    page.click('.added-task-card .added-refresh-btn')
    page.wait_for_timeout(300)
    check("⟳ карточки: другое задание той же группы", page.evaluate("protoById(20, S.cards[0].pid).group") == 'sys_add')

    rich = page.evaluate("window.Basket.extractFromSelectorsRich(['#egeQuestion']).text")
    check("подборка: подпись источника уходит вместе с заданием", 'Источник: открытый банк заданий ФИПИ' in rich, rich[-120:])
    st = page.evaluate("tsGetState()")
    pid = page.evaluate("S.pid")

    page.click('#backBtn')
    page.wait_for_timeout(300)
    done = page.inner_text('.mode-card[data-gid="sys_add"] .mdone')
    check("список: на карточке группы «✓ 1 из N»", done == f"✓ 1 из {len(items)}", done)
    page.click('.mode-card[data-gid="sys_add"]')
    page.wait_for_timeout(300)
    check("карточка группы открывает первое нерешённое", page.evaluate("curProto.fipi") == items[1]["fipi"])
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    # ученик: снимок учителя — то же задание и подпись
    ctx, page, errors = new_page(browser, f"{BASE}/oge_part2.html?n=20")
    page.evaluate("(s) => tsApplyState(s)", st)
    page.wait_for_timeout(500)
    note = page.inner_text('#egeQuestion')
    check("сессия: у ученика то же задание ФИПИ с подписью",
          page.evaluate("S.pid") == pid and SRC_RE.search(note) and page.inner_text('#taskTitle').startswith(g['title']), note[-60:])
    check("сессия: карточки «+» той же группы и у ученика",
          page.evaluate("S.cards.length === 3 && S.cards.every(c => protoById(20, c.pid).group === 'sys_add')"))
    check("сессия: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_without_fipi(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge_part2.html?n=20", block_fipi=True)
    title = page.eval_on_selector('#pickerTitle', 'e => e.textContent')
    n = page.evaluate("document.querySelectorAll('#protoList .mode-card').length")
    check("без файла ФИПИ: только демоверсия, подпись как раньше",
          n == 1 and title == 'Прототипы задания №20 · 1 штука · демоверсия ОГЭ 2027', title)
    page.click('#protoList .mode-card')
    page.wait_for_timeout(300)
    check("без файла ФИПИ: демоверсия открывается, подписи источника нет",
          page.inner_text('#taskTitle') == '№0. Задание из демоверсии ОГЭ 2027' and 'Источник' not in page.inner_text('#egeQuestion'))
    check("без файла ФИПИ: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()
    for url in ("ege_prof.html?n=7", "ege_base.html?n=3", "oge_part2.html?n=22"):
        ctx, page, errors = new_page(browser, f"{BASE}/{url}")
        t = page.eval_on_selector('#pickerTitle', 'e => e.textContent')
        check(f"{url}: список прототипов как раньше", t.startswith('Прототипы задания №')
              and not page.evaluate("document.querySelector('#protoList .proto-section')"), t)
        page.click('#protoList .mode-card')
        page.wait_for_timeout(300)
        check(f"{url}: кнопки «прототип», без подписи ФИПИ",
              'Источник' not in page.inner_text('#egeQuestion')
              and page.evaluate("getComputedStyle(nextProtoBtn).display === 'none' || nextProtoBtn.textContent === 'Следующий прототип ▶'"))
        check(f"{url}: без ошибок JS", not errors, str(errors[:1]))
        ctx.close()


def test_board_check(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/boards.html", wait=1500)
    r = page.evaluate("""() => {
        const f = { type: 'pairs', value: '(-1; 4); (1; 4)' };
        return [taCheckField(f, '(1;4);(-1;4)'), taCheckField(f, '(4;1);(4;-1)'), taCheckField(f, '1; 4')];
    }""")
    check("доска: проверка «пар» как в тренажёре", r == [True, False, None], str(r))
    ctx.close()


def test_phone(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge_part2.html?n=20", width=375)
    over = page.evaluate("document.documentElement.scrollWidth - innerWidth")
    page.click('.mode-card[data-gid="sys_mult"]')
    page.wait_for_timeout(400)
    over2 = page.evaluate("document.documentElement.scrollWidth - innerWidth")
    check("телефон 375: список и задание без прокрутки вбок", over <= 0 and over2 <= 0, f"{over} / {over2}")
    ctx.close()


def test_sync():
    r = subprocess.run([sys.executable, "sync_ege_pages.py", "--check"], cwd=HERE, capture_output=True, text=True)
    check("sync_ege_pages.py --check: страницы не разошлись", r.returncode == 0, r.stdout + r.stderr)


def main():
    F = load_fipi()
    test_data(F)
    test_sync()
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        test_answers(browser, F)
        test_picker_and_task(browser, F)
        test_without_fipi(browser)
        test_board_check(browser)
        test_phone(browser)
        browser.close()
    failed = [n for n, ok in results if not ok]
    print(f"\n{len(results) - len(failed)}/{len(results)} проверок прошло")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
