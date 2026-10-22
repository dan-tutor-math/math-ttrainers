"""
Правка «банк ФИПИ ЕГЭ профиль, часть 2»: в ЕГЭ профиль (ege_prof.html) —
задания №14 (уравнения) и №16 (неравенства) из открытого банка ФИПИ, номера
ЕГЭ-2027 (в банке ФИПИ это прежние №13 и №15). У ФИПИ для развёрнутого ответа
проверки нет: ответы сверены с самим условием скриптом (fipi-pilot/tools/ege/
p2common.py), здесь проверяется, что страница их принимает.

Проверяет:
  1. данные: 60 заданий №14 и 63 задания №16; у каждого группа, условие, поле
     ответа с эталоном, answerTex, решение; критерии ФИПИ на номер; непарных $ нет;
  2. формулы: условия, решения, ответы и идеи групп — KaTeX без ошибок;
  3. ответы: КАЖДЫЙ эталон принят своим полем, испорченный — нет;
  4. логарифм в ответе: log_3(84), log3(84), 2log_2(8), lg, ln; промежуток
     с логарифмом; подсказка поля «log_3(5)», а у параметра — прежняя;
  5. задание №16 с логарифмом в ответе: ученик вводит ответ — засчитан,
     в разборе ответ и критерии; задание №14: корни б) в другом порядке —
     засчитаны, пункт а) — «проверьте по решению»;
  6. демоверсия в №14 и №16 по-прежнему первой;
  7. ege_base.html и oge_part2.html не разошлись с профилем (sync_ege_pages.py);
  8. телефон 375 px — без прокрутки вбок.

Запуск: python3 test_prompt_fipi_ege_p2.py (сервер поднимается сам).
"""
import contextlib
import http.client
import json
import math
import os
import re
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 9163
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
COUNTS = {"14": 60, "16": 63}


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=HERE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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
    def body(name, marker):
        src = open(os.path.join(HERE, name), encoding="utf-8").read()
        return json.loads(src[src.index(marker) + len(marker):].rstrip().rstrip(";"))
    F = body("ege-prof-fipi.js", "window.EGE_PROF_FIPI = ")
    for n in COUNTS:
        F["tasks"][n] = body(F["files"][n], ".tasks['" + n + "'] = ")
    return F


def new_page(browser, url, wait=1200, width=1300):
    ctx = browser.new_context(viewport={"width": width, "height": 1000})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    page.goto(url)
    page.wait_for_timeout(wait)
    return ctx, page, errors


def dollars_ok(s):
    return re.sub(r"<[^>]+>", "", s).count("$") % 2 == 0


def test_data(F):
    for n, cnt in COUNTS.items():
        t = F["tasks"][n]
        ps = t["protos"]
        gids = {g["id"] for g in t["groups"]}
        check(f"данные №{n}: {cnt} заданий", len(ps) == cnt, str(len(ps)))
        bad = [p["fipi"] for p in ps if not (
            p["group"] in gids and p["text"] and p["steps"] and p.get("answerTex")
            and p["id"] == f"{n}.fipi.{p['fipi']}" and "answer" not in p
            and len(p["fields"]) == 1 and p["fields"][0]["value"] and p["fields"][0]["tex"])]
        check(f"данные №{n}: у каждого группа, условие, поле ответа, answerTex, решение", not bad, str(bad[:5]))
        bad = [p["fipi"] for p in ps if not dollars_ok(p["text"]) or not dollars_ok(p["answerTex"])
               or any(not dollars_ok(s) for s in p["steps"]) or "⟦" in p["text"]]
        check(f"данные №{n}: нет непарных $ и картинок-меток", not bad, str(bad[:5]))
        check(f"данные №{n}: критерии ФИПИ на номер (2, 1, 0 баллов)",
              [c[0] for c in t.get("criteria", [])] == [2, 1, 0])
    ok14 = all("<br>б)" in p["text"] and p["fields"][0]["type"] == "nums" and p.get("manual")
               for p in F["tasks"]["14"]["protos"])
    check("данные №14: пункт б) с новой строки, поле «корни», пункт а) — по решению", ok14)
    check("данные №16: поле «множество»", all(p["fields"][0]["type"] == "set" for p in F["tasks"]["16"]["protos"]))


def test_katex(browser, F):
    ctx, page, errors = new_page(browser, f"{BASE}/ege_prof.html?n=14")
    chunks = []
    for n in COUNTS:
        t = F["tasks"][n]
        for g in t["groups"]:
            chunks += [(n, "группа " + g["id"], g["title"]), (n, "идея " + g["id"], g["hint"])]
        for c in t["criteria"]:
            chunks.append((n, "критерий", c[1]))
        for p in t["protos"]:
            chunks += [(n, p["fipi"], p["text"]), (n, p["fipi"], p["answerTex"]),
                       (n, p["fipi"], "$" + p["fields"][0]["tex"] + "$")]
            chunks += [(n, p["fipi"], s) for s in p["steps"]]
    bad = page.evaluate("""(chunks) => {
        const out = [];
        for (const [n, who, s] of chunks) {
            const parts = s.split(/(\\$\\$[\\s\\S]*?\\$\\$|\\$[^$]*\\$)/).filter(x => x.startsWith('$'));
            for (const m of parts) {
                const disp = m.startsWith('$$');
                const src = m.slice(disp ? 2 : 1, disp ? -2 : -1);
                try { katex.renderToString(src, { throwOnError: true, displayMode: disp }); }
                catch (e) { out.push(n + ' ' + who + ': ' + src.slice(0, 60) + ' — ' + String(e).slice(0, 80)); }
            }
        }
        return out;
    }""", chunks)
    check(f"формулы: все {len(chunks)} кусков — KaTeX без ошибок", not bad, str(bad[:4]))
    ctx.close()


def test_answers(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/ege_prof.html?n=14")
    for n in COUNTS:
        page.evaluate("(n) => new Promise(r => ensureFipi(n, r))", int(n))
        res = page.evaluate("""(n) => { S.n = n; return protos(n).filter(p => p.fipi).map(p => {
            const f = fieldsOf(p)[0], st = { yn: {} }, v = String(f.value);
            // порча: у корней — без последнего (или чужой корень), у множества — другой промежуток
            let wrong;
            if (f.type === 'nums') { const it = v.split(';'); wrong = it.length > 1 ? it.slice(0, -1).join(';') : '100'; }
            else wrong = v === '(0;1)' ? '(0;2)' : '(0;1)';
            return [p.fipi, checkField(f, v, st), checkField(f, wrong, st)];
        }); }""", int(n))
        bad = [r for r in res if r[1:] != [True, False]]
        check(f"ответы №{n}: все {len(res)} эталонов приняты, испорченные — нет",
              len(res) == COUNTS[n] and not bad, str(bad[:3]))
    check("ответы: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_log(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/ege_prof.html?n=16")
    v = page.evaluate("""() => [evalExpr('log_3(84)'), evalExpr('log3(84)'), evalExpr('2log_2(8)'),
        evalExpr('lg100'), evalExpr('ln(1)'), evalExpr('log_(1/2)8'), evalExpr('log_1(5)'), evalExpr('log_3(-1)')]""")
    exp = [math.log(84, 3), math.log(84, 3), 6, 2, 0, -3]
    check("логарифм: log_3(84), log3(84), 2log_2(8), lg100, ln(1), log_(1/2)8",
          all(abs(a - b) < 1e-9 for a, b in zip(v[:6], exp)), str(v))
    check("логарифм: основание 1 и отрицательный аргумент — не разобраны", all(a is None or (isinstance(a, float) and math.isnan(a)) for a in v[6:]), str(v[6:]))
    same = page.evaluate("""() => sameSets(parseSet('(0; log_5(3)]; [log3(5); 2)'), parseSet('(0;log_5(3)]; [log_3(5);2)'))""")
    check("логарифм: промежуток с логарифмом разбирается и сравнивается", same)
    hints = page.evaluate("""() => [fieldHint({type: 'set', value: '(-∞;1]; [4;log_3(84))'}),
        fieldHint({type: 'set', value: 'a<-1; a=7'}), fieldHint({type: 'set', value: '(1;4]'})]""")
    check("подсказка поля: с логарифмом — «log_3(5)», у параметра и обычного — прежние",
          "log_3(5)" in hints[0] and "a &lt;" in hints[1] and "log" not in hints[2], str(hints))
    check("логарифм: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def open_fipi(page, n, fipi):
    page.evaluate("(a) => window.__examNav.open(a[0], a[1])", [n, f"{n}.fipi.{fipi}"])
    page.wait_for_timeout(700)


def test_flow(browser, F):
    ctx, page, errors = new_page(browser, f"{BASE}/ege_prof.html?n=16")
    page.evaluate("localStorage.removeItem('ogeProg:ege_prof:solved')")
    first = page.inner_text('#protoList .mode-card .mtitle')
    check("список №16: демоверсия первой", first == 'Прототип 1', first)
    open_fipi(page, 16, "FFCBEB")
    check("№16 FFCBEB открыто, подсказка поля про логарифм",
          page.evaluate("curProto.fipi") == "FFCBEB" and "log_3(5)" in page.inner_text('#answerArea'))
    page.fill('input[data-fid="ans"]', 'x<=1; 4<=x<log_3(84)')
    page.click('#answerArea .check-btn')
    page.wait_for_timeout(250)
    check("№16: ответ с логарифмом засчитан", page.evaluate("S.answered && S.correct") is True)
    check("№16: в разборе ответ и критерии ФИПИ",
          "log" in page.inner_html('#mainPanel') and page.eval_on_selector_all('#critTable tr', 'e => e.length') == 3)
    page.goto(f"{BASE}/ege_prof.html?n=14")
    page.wait_for_timeout(1200)
    first = page.inner_text('#protoList .mode-card .mtitle')
    check("список №14: демоверсия первой", first == 'Прототип 1', first)
    open_fipi(page, 14, "A1A34D")
    q = page.inner_text('#egeQuestion')
    check("№14: условие а) и б) на разных строках, подпись источника",
          "б)" in q and "задание A1A34D" in q)
    page.fill('input[data-fid="b"]', '9π/2; 7π/2; 17π/4')
    page.click('#answerArea .check-btn')
    page.wait_for_timeout(250)
    check("№14: корни б) в другом порядке засчитаны", page.evaluate("S.answered && S.correct") is True)
    check("№14: «пункт а — по решению» в разборе", "проверьте по решению" in page.inner_text('body'))
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_sync():
    r = subprocess.run([sys.executable, "sync_ege_pages.py", "--check"], cwd=HERE, capture_output=True, text=True)
    check("ege_base.html и oge_part2.html совпадают с профилем", r.returncode == 0, r.stdout + r.stderr)


def test_phone(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/ege_prof.html?n=16", width=375)
    over = page.evaluate("document.documentElement.scrollWidth - innerWidth")
    open_fipi(page, 16, "259766")
    over2 = page.evaluate("document.documentElement.scrollWidth - innerWidth")
    check("телефон 375: список и задание №16 без прокрутки вбок", over <= 0 and over2 <= 0, f"{over} / {over2}")
    ctx.close()


def main():
    F = load_fipi()
    test_data(F)
    test_sync()
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        test_katex(browser, F)
        test_answers(browser)
        test_log(browser)
        test_flow(browser, F)
        test_phone(browser)
        browser.close()
    failed = [n for n, ok in results if not ok]
    print(f"\n{len(results) - len(failed)}/{len(results)} проверок прошло")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
