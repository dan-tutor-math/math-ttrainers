"""
Тренажёр «ОГЭ обществознание», развёрнутые ответы — №1, 7, 8, 12, 17–20 КИМ 2027 на общей странице
предмета soc_oge.html (копия ege_prof.html, sync_ege_pages.py); soc_oge_long.html — только перенаправление
для старых ссылок. Краткий ответ и общая навигация — test_prompt_soc_oge.py.

Проверяет:
  1. данные: каждое задание экспорта (fipi-pilot/full_oge_soc/export_long.json) — на странице: условие,
     картинка и её файл, текст к №18–20, все требования, образец ответа; критерии ФИПИ номера и его
     максимум; №17 — одно задание демоверсии; нет «бланка», «$» и скриптов ФИПИ;
  2. задание: картинка на белой подложке, текст в окне с прокруткой, черновик сохраняется и
     возвращается после перезагрузки;
  3. «Сверить с образцом и критериями»: требования, образец свёрнут, критерии открыты, пометка у фото
     старого образца; счёт «решено / ошибок» не меняется; балл сохраняется, суммируется по номеру,
     оценённое задание открывается сразу с самопроверкой;
  4. навигация: виды внутри номера, ◀ ▶ заданий, №18 → №19 к тому же тексту, №8 → краткий №9 на той же
     странице; «Дополнительно к тексту» (№21) вне круга номеров, с кнопкой туда и обратно;
  5. старые адреса: soc_oge_long.html?n=7, ?n=7&t=…, ?n=21&t=… открывают то же; главная;
     черновики и оценки старой страницы переносятся один раз;
  6. телефон и тёмная тема: без ошибок JS и горизонтальной прокрутки, картинка не шире экрана.

Запуск: ~/.venvs/trainers/bin/python test_prompt_soc_oge_long.py (сервер поднимается сам).
"""
import contextlib
import html as H
import http.client
import json
import os
import re
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8996
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(os.path.dirname(HERE), "fipi-pilot", "full_oge_soc", "export_long.json")
LONG = [1, 7, 8, 12, 17, 18, 19, 20, 21]
COUNTS = {1: 74, 7: 134, 8: 97, 12: 81, 17: 1, 18: 127, 19: 127, 20: 127, 21: 127}
MAX = {1: 2, 7: 2, 8: 2, 12: 4, 17: 2, 18: 2, 19: 2, 20: 3, 21: 2}
FAILS = []


def check(cond, msg):
    print(("  ок  " if cond else "  ОШИБКА  ") + msg)
    if not cond:
        FAILS.append(msg)


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=HERE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                conn = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                conn.request("GET", "/soc_oge.html")
                conn.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        else:
            raise RuntimeError("локальный сервер не поднялся")
        yield
    finally:
        proc.terminate()


def new_page(browser, width=1280, height=900, theme=None):
    ctx = browser.new_context(viewport={"width": width, "height": height})
    if theme:
        ctx.add_init_script(f"localStorage.setItem('theme', '{theme}')")
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    return ctx, page, errors


def settle(page):
    page.wait_for_function("() => !window.__fipiBusy || !window.__fipiBusy()")
    page.wait_for_timeout(150)


def open_n(page, n, extra=""):
    page.goto(f"{BASE}/soc_oge.html?n={n}{extra}")
    settle(page)


def open_first_task(page, n):
    open_n(page, n)
    page.click("#protoList .mode-card")
    page.wait_for_selector("#taskArea", state="visible")
    page.wait_for_timeout(150)


def main():
    export = json.load(open(EXPORT, encoding="utf-8"))
    by_id = {t["id"]: t for t in export["tasks"]}

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx, page, errors = new_page(browser)

        print("1. данные: ничего не потеряно")
        open_n(page, 1)
        dump = page.evaluate("""async (nums) => {
          const out = {};
          for (const n of nums) {
            await new Promise(r => ensureFipi(n, r));
            out[n] = { points: task(n).points, label: numLabel(n), title: task(n).title, protos: protos(n).map(p => ({
              id: p.id, proof: !!p.proof, text: p.text, steps: p.steps, criteria: p.criteria, t: p.t || null, extra: p.extra || null, fipi: p.fipi || null, group: p.group || null, src: p.src || null,
            })) };
          }
          return out;
        }""", LONG)
        lost, imgs = [], set()
        for n in LONG:
            ps = dump[str(n)]["protos"]
            check(len(ps) == COUNTS[n], f"{dump[str(n)]['label']}: {COUNTS[n]} заданий")
            check(dump[str(n)]["points"] == MAX[n], f"{dump[str(n)]['label']}: максимум {MAX[n]}")
            for q in ps:
                t = by_id.get(q["id"])
                if not t or t["n"] != n or not q["proof"]:
                    lost.append(q["id"] + ": не тот номер")
                    continue
                if t["q"].replace("$", "&#36;") not in q["text"]:
                    lost.append(q["id"] + ": условие")
                if t.get("t") and export["texts"][t["t"]].replace("$", "&#36;") not in q["text"]:
                    lost.append(q["id"] + ": текст")
                joined = H.unescape(" ".join(q["steps"]))
                if any(r not in joined for r in t["r"]):
                    lost.append(q["id"] + ": требования")
                if t.get("s") and any(line and line not in joined for line in t["s"].split("\n")):
                    lost.append(q["id"] + ": образец")
                if not t.get("s"):
                    lost.append(q["id"] + ": в экспорте нет образца")
                if not q["criteria"] or q["criteria"][0][0] != MAX[n] or q["criteria"][-1][0] != "" and n != 14:
                    lost.append(q["id"] + ": критерии")
                if t.get("o26") and "старого образца" not in q["steps"][0]:
                    lost.append(q["id"] + ": пометка старого образца")
                if any(x in q["text"] for x in ("ShowPicture", "MsoNormal", "files_location", "бланке ответов", "$", "<script")):
                    lost.append(q["id"] + ": разметка")
                imgs.update(re.findall(r'src="(soc-oge-img/[^"]+)"', q["text"]))
        check(not lost, f"условия, тексты, требования, образцы и критерии целы ({lost[:4]})")
        check(sum(COUNTS.values()) == len(export["tasks"]) == 895, "на странице все 895 заданий")
        check(len(imgs) == 211, f"картинок №7 и №12 — 211 ({len(imgs)})")
        missing = [i for i in imgs if not os.path.exists(os.path.join(HERE, i))]
        check(not missing, f"все файлы картинок на месте ({missing[:2]})")
        demo = dump["17"]["protos"]
        check(len(demo) == 1 and demo[0]["id"] == "DEMO17" and "династ" in demo[0]["text"], "№17 — одно задание демоверсии ОГЭ-2027")
        check("демонстрационный вариант" in demo[0]["text"] and "демоверсии" in " ".join(str(x[1]) for x in demo[0]["criteria"]),
              "№17: подпись источника и пометка в критериях")
        crit = {n: [r[0] for r in dump[str(n)]["protos"][0]["criteria"] if r[0] != ""] for n in LONG}
        check(crit[12] == [4, 3, 2, 1, 0] and crit[20] == [3, 2, 1, 0] and crit[7] == [2, 1, 0], "шкала критериев номера: №12 — до 4, №20 — до 3")
        check("Шкала ориентировочная" in " ".join(str(r[1]) for r in dump["21"]["protos"][0]["criteria"]), "№21: шкала названа ориентировочной")

        print("2. задание и черновик")
        open_first_task(page, 7)
        img = page.locator("#questionText img.fig")
        check(img.count() == 1, "№7: картинка в условии")
        page.wait_for_function("document.querySelector('#questionText img.fig').complete")
        check(page.evaluate("document.querySelector('#questionText img.fig').naturalWidth > 0"), "картинка загрузилась")
        check(page.evaluate("getComputedStyle(document.querySelector('#questionText img.fig')).backgroundColor") == "rgb(255, 255, 255)", "картинка на белой подложке")
        pid7 = page.evaluate("S.pid")
        page.fill("#answerArea .proof-draft", "Мой черновик ответа")
        page.goto(f"{BASE}/soc_oge.html?n=7&t={pid7}")
        settle(page)
        page.wait_for_timeout(200)
        check(page.input_value("#answerArea .proof-draft") == "Мой черновик ответа", "черновик вернулся после перезагрузки")
        open_first_task(page, 18)
        box = page.locator("#questionText .soc-text-box")
        check(box.count() == 1 and page.evaluate("document.querySelector('.soc-text-body').scrollHeight > 0"), "№18: текст в своём окне")
        check(page.evaluate("getComputedStyle(document.querySelector('.soc-text-body')).overflowY") == "auto", "текст прокручивается отдельно")

        print("3. самопроверка")
        open_first_task(page, 12)
        btn = page.locator("#answerArea .check-btn")
        check(btn.inner_text().strip() == "Сверить с образцом и критериями", "кнопка самопроверки")
        check(not page.is_visible("#proofScore"), "до сверки балл ставить нельзя")
        before = (page.inner_text("#stSolved"), page.inner_text("#stErrors"))
        btn.click()
        page.wait_for_timeout(200)
        check("Что должно быть в ответе" in page.inner_text("#solSteps") and page.locator("#solSteps .soc-req").count() > 0, "требования из условия")
        check(page.evaluate("document.querySelector('#solSteps .soc-sample').open") is False, "образец свёрнут")
        check(page.evaluate("document.getElementById('critBox').open") and "максимум 4" in page.inner_text("#critSummary"), "критерии открыты, максимум 4")
        check((page.inner_text("#stSolved"), page.inner_text("#stErrors")) == before, "счёт не меняется")
        check(page.locator("#proofScore .proof-score-btn").count() == 5, "№12: баллы 0–4")
        page.click('#proofScore .proof-score-btn[data-b="3"]')
        page.wait_for_timeout(100)
        check("3 из 4" in page.inner_text("#proofScore"), "оценка сохранена: 3 из 4")
        pid = page.evaluate("S.pid")
        page.click("#nextBtn")
        page.wait_for_timeout(150)
        page.click("#answerArea .check-btn")
        page.click('#proofScore .proof-score-btn[data-b="2"]')
        page.wait_for_timeout(100)
        check("5 из 8" in page.inner_text("#proofScore"), "по номеру: 5 из 8")
        page.goto(f"{BASE}/soc_oge.html?n=12&t={pid}")
        settle(page)
        page.wait_for_timeout(200)
        check(page.evaluate("S.answered") and page.is_visible("#proofScore")
              and page.evaluate("document.querySelector('#proofScore .proof-score-btn.active').dataset.b") == "3",
              "оценённое задание открывается сразу с самопроверкой")
        check(page.evaluate("isSolved(S.pid)"), "оценённое задание отмечено решённым")
        old = next(q["id"] for q in dump["7"]["protos"] if "старого образца" in q["steps"][0])
        open_n(page, 7, f"&t={old}")
        page.wait_for_timeout(200)
        page.click("#answerArea .check-btn")
        page.wait_for_timeout(200)
        check("старого образца" in page.inner_text("#solSteps"), "№7: пометка у фото старого образца")
        page.locator("#solSteps .soc-sample summary").click()
        check(page.is_visible("#solSteps .soc-sample-text"), "образец открывается")

        print("4. навигация")
        open_first_task(page, 1)
        check(page.is_visible("#nextTypeBtn") and page.is_visible("#nextProtoBtn"), "№1: пары типов и заданий")
        q18 = dump["18"]["protos"][5]
        open_n(page, 18, f"&t={q18['id']}")
        page.wait_for_timeout(200)
        check(page.evaluate("S.pid") == q18["id"], "№18: открылось задание из адреса")
        page.click("#examNextBtn")
        page.wait_for_timeout(400)
        settle(page)
        check(page.evaluate("S.n") == 19 and page.evaluate("curProto.t") == q18["t"] and page.evaluate("S.screen") == "task", "№18 ▶ — №19 к тому же тексту")
        page.click("#examPrevBtn")
        page.wait_for_timeout(400)
        check(page.evaluate("S.n") == 18 and page.evaluate("curProto.t") == q18["t"], "◀ — обратно к №18 того же текста")
        open_first_task(page, 8)
        page.click("#examNextBtn")
        page.wait_for_timeout(400)
        settle(page)
        check(page.evaluate("S.n") == 9 and "soc_oge.html" in page.url, "№8 ▶ — краткий №9 на той же странице")
        open_n(page, 18, f"&t={q18['id']}")
        page.wait_for_timeout(200)
        check(page.is_visible("#extraTaskBtn") and "Дополнительное задание" in page.inner_text("#extraTaskBtn"), "у текста кнопка «Дополнительное задание к этому тексту»")
        page.click("#extraTaskBtn")
        page.wait_for_timeout(300)
        settle(page)
        check(page.evaluate("S.n") == 21 and page.evaluate("curProto.t") == q18["t"], "она открывает блок к тому же тексту")
        check(page.inner_text("#pageTitle").strip() == "ОГЭ обществознание · Дополнительно к тексту", "в заголовке без «№21»")
        check("в ОГЭ-2027 такого нет" in page.inner_text("#questionText"), "сказано, что в ОГЭ-2027 такого нет")
        check(page.is_disabled("#examPrevBtn") and page.is_disabled("#examNextBtn"), "блок вне круга номеров: стрелки у заголовка неактивны")
        page.click("#extraTaskBtn")
        page.wait_for_timeout(300)
        settle(page)
        check(page.evaluate("S.n") == 20 and page.evaluate("curProto.t") == q18["t"], "и обратно — к №20 того же текста")
        open_n(page, 20)
        check(page.is_disabled("#examNextBtn"), "№20 — последний номер: дальше блока нет")
        open_first_task(page, 17)
        check(not page.is_visible("#nextProtoBtn") and not page.is_visible("#nextTypeBtn"), "№17: одно задание, пар переходов нет")

        print("5. старые адреса и главная")
        tid = dump["7"]["protos"][9]["id"]
        page.goto(f"{BASE}/soc_oge_long.html?n=7&t={tid}")
        page.wait_for_url("**/soc_oge.html*")
        settle(page)
        page.wait_for_timeout(200)
        check(page.evaluate("S.n") == 7 and page.evaluate("S.pid") == tid, "soc_oge_long.html?n=7&t=… — то же задание")
        page.goto(f"{BASE}/soc_oge_long.html?n=19")
        page.wait_for_url("**/soc_oge.html*")
        settle(page)
        check(page.evaluate("S.n") == 19, "soc_oge_long.html?n=19 — тот же номер")
        x = dump["21"]["protos"][2]["id"]
        page.goto(f"{BASE}/soc_oge_long.html?n=21&t={x}")
        page.wait_for_url("**/soc_oge.html*")
        settle(page)
        page.wait_for_timeout(200)
        check(page.evaluate("S.n") == 21 and page.evaluate("S.pid") == x, "soc_oge_long.html?n=21&t=… — дополнительный блок")
        page.goto(f"{BASE}/index.html?subject=soc")
        page.wait_for_timeout(400)
        for n in (1, 7, 17, 18):
            check(page.locator(f'a.topic-item[href="soc_oge.html?n={n}"]').count() == 1, f"на главной №{n} ведёт на soc_oge.html?n={n}")
        ctx3, page3, err3 = new_page(browser)
        page3.goto(f"{BASE}/index.html")
        a = dump["8"]["protos"][1]["id"]
        page3.evaluate("""(id) => {
          localStorage.setItem('socOgeLong:scores', JSON.stringify({ [id]: 1 }));
          localStorage.setItem('socOgeLong:draft:' + id, JSON.stringify('старый черновик'));
        }""", a)
        open_n(page3, 8, f"&t={a}")
        page3.wait_for_timeout(200)
        check(page3.input_value("#answerArea .proof-draft") == "старый черновик", "черновик старой страницы на месте")
        check(page3.evaluate("document.querySelector('#proofScore .proof-score-btn.active').dataset.b") == "1", "оценка старой страницы на месте")
        check(page3.evaluate("localStorage.getItem('socOgeLong:scores') === null && Object.keys(localStorage).every(k => !k.startsWith('socOgeLong:'))"), "старые ключи сняты: сброс прогресса их не вернёт")
        ctx3.close()
        check(not errors, f"ошибок JS нет ({errors[:2]})")
        ctx.close()

        print("6. телефон и тёмная тема")
        ctx, page, errors = new_page(browser, 360, 800, theme="dark")
        for n in (1, 7, 12, 17, 18, 20, 21):
            open_first_task(page, n)
            page.click("#answerArea .check-btn")
            page.wait_for_timeout(150)
            sw = page.evaluate("document.documentElement.scrollWidth")
            check(sw <= 361, f"{n}: без горизонтальной прокрутки ({sw})")
        open_first_task(page, 7)
        page.wait_for_function("document.querySelector('#questionText img.fig').complete")
        check(page.evaluate("document.querySelector('#questionText img.fig').getBoundingClientRect().right <= innerWidth"), "картинка не шире экрана")
        wide = page.evaluate("""async () => {
          const bad = [];
          for (const n of [1, 8, 12, 19]) {
            await new Promise(r => ensureFipi(n, r));
            for (const p of protos(n)) {
              openTask(n, p.id);
              if (document.documentElement.scrollWidth > innerWidth) bad.push(p.id);
            }
          }
          return bad;
        }""")
        check(not wide, f"все задания №1, 8, 12, 19 помещаются в 360 px ({wide[:4]})")
        check(not errors, f"ошибок JS нет ({errors[:2]})")
        ctx.close()
        browser.close()

    print("\nИТОГ:", "всё ок" if not FAILS else f"{len(FAILS)} ошибок")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
