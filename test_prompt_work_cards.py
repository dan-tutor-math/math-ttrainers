"""
Страница ученика work.html показывает блоки type:'card' (задача 63, S4a).

Блоки собираются по формату memory/works.md из пилотных карточек cards/oge9.json,
oge19.json, ege_prof.json: 17 карточек + (в смешанной работе) обычное задание-снимок.
Сервер работ — заглушка (как в test_prompt15_works_stage1), поэтому ответы идут в неё;
настоящую базу этот тест не проверяет.

Проверяет (ноутбук 1440 и телефон 390):
  1. «Списком»: все 17 карточек отрисованы CardRender, без снимков и кадров; ни одной
     страницы тренажёра не загружено (запросы *.html кроме work.html, iframe нет);
     файл карточек — один на slug (3 запроса cards/*.json на 17 заданий);
  2. пока файл карточек грузится — «Загружаю задание…» с резервом высоты, потом условие;
  3. прокрутка вниз-вверх: высота страницы и каждого задания не прыгает (≤ 2 px);
     карточка выше экрана выросла — читаемое не уехало (метод test_prompt_work_preload);
  4. «По одному»: листание 1→2→3→2, высота не прыгает за 1,5 с после показа;
  5. ответы: fields верно / неверно, choice, multi — статус, попытки, цвет вариантов;
     черновик переживает перезагрузку страницы;
  6. «A+» / «A−» меняют масштаб карточек (текст крупнее, высота растёт, нет горизонтальной
     прокрутки);
  7. «Тренировка»: кнопка открывает тренажёр по href и ставит то же место каталога (openAt);
  8. смешанная работа (задание-снимок + карточки) открывается, нумерация сквозная;
  9. нет ошибок JavaScript.

Запуск: ~/.venvs/trainers/bin/python test_prompt_work_cards.py
"""
import json
import sys

import test_prompt15_works_stage1 as s1
from test_prompt15_works_stage1 import sync_playwright, new_context, watch_errors, overflow_x

s1.PORT = 8974
s1.BASE = f"http://127.0.0.1:{s1.PORT}"
BASE = s1.BASE
# настоящая функция работы_save_answer знает только 'task' и 'video' (works-schema.sql) — карточки
# она отвергнет, пока SQL не обновят (в отчёте S4a). Заглушка здесь принимает и 'card', чтобы
# проверить страницу ученика отдельно от базы.
s1.FAKE_SB_JS = s1.FAKE_SB_JS.replace("['task', 'video'].indexOf(b.type || 'task')", "['task', 'video', 'card'].indexOf(b.type || 'task')")
assert "'card'" in s1.FAKE_SB_JS

FAILS = []
JUMP = 2


def check(name, cond, extra=""):
    print(("[OK] " if cond else "[FAIL] ") + name + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        FAILS.append(name)


PNG = ("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==")


def card_block(c, i, mode="exam", series=True):
    a = c["answer"]
    task = {k: json.loads(json.dumps(a[k])) for k in ("kind", "fields", "n", "correct") if k in a}
    fipi = c["id"].split(":", 1)[1]
    href = c["slug"] + ".html"
    b = {"id": f"c{i}", "type": "card", "card": c["id"], "slug": c["slug"], "tid": c["slug"], "href": href,
         "mode": mode, "name": f"Задание {fipi}", "task": task, "tkey": f"fipi:{c['exam']}:{fipi}"}
    if series:
        b["series"] = {"key": f"{c['slug']}:{c['proto']}", "pos": c["pos"], "fipi": fipi, "total": 1, "proto": c["proto"], "n": c["n"]}
    return b


def load_cards():
    out = {}
    for s in ("oge9", "oge19", "ege_prof"):
        out[s] = json.load(open(f"cards/{s}.json", encoding="utf-8"))["cards"]
    return out


def build_blocks(mixed=False, mode="exam"):
    cs = load_cards()
    pick = cs["oge9"][:6] + cs["oge19"][:6] + cs["ege_prof"][:5]
    blocks = [card_block(c, i, mode=mode) for i, c in enumerate(pick)]
    if mixed:
        old = {"id": "t0", "type": "task", "mode": "exam", "name": "Снимок", "tid": "oge9", "href": "oge9.html",
               "img": {"light": {"url": PNG}, "dark": {"url": PNG}}, "css": {"w": 440, "h": 120},
               "task": {"kind": "fields", "fields": [{"id": "main", "label": "Ответ:", "type": "num", "value": "5"}]}}
        blocks.insert(2, old)
    return blocks


def set_db(blocks, settings=None):
    db = {"works": [{"id": "w1", "owner": s1.TEACHER["id"], "kind": "hw", "title": "Карточки ФИПИ", "settings": settings or {}, "closed": False}],
          "work_variants": [{"id": "v1", "work_id": "w1", "code": "CARD000001", "num": 1, "blocks": blocks}],
          "work_attempts": [], "work_answers": [], "files": {}}
    s1.STATE["db"] = json.dumps(db)
    return f"{BASE}/work.html?c=CARD000001"


def student(browser, link, errors, tag, vp, mobile, reqs=None, held=None):
    ctx = new_context(browser, live=True, cards=True, viewport=vp, is_mobile=mobile, has_touch=mobile)
    if held is not None:
        ctx.route("**/cards/*.json", lambda route: held.append(route))
    sp = ctx.new_page()
    watch_errors(sp, errors, tag)
    if reqs is not None:
        sp.on("request", lambda r: reqs.append(r.url))
    sp.goto(link)
    sp.wait_for_selector("#scrStart:not([hidden])")
    sp.fill("#wName", "Петя")
    sp.click("#wStart")
    sp.wait_for_selector("#scrTask:not([hidden])")
    return ctx, sp


ST = """() => window.__work.views.map(v => ({ i: v.i, st: v.cstate || null, h: Math.round(v.root.getBoundingClientRect().height),
  imgs: v.wrap.querySelectorAll('.tc-card > img, .live-box').length, cr: !!v.wrap.querySelector('.cr'), k: v.k }))"""


def wait_all_ready(sp, n):
    sp.wait_for_function(f"() => window.__work.views.length === {n} && window.__work.views.every(v => v.cstate === 'ready')", timeout=30000)
    sp.wait_for_timeout(800)


def type_answer(sp, i, text):
    sp.evaluate("([i, t]) => { const v = window.__work.views.find(x => x.i === i); const inp = v.inputs[0]; inp.value = t; inp.dispatchEvent(new Event('input', { bubbles: true })); }", [i, text])


def run_list(browser, errors, tag, vp, mobile):
    print(f"\n— {tag} «Списком»")
    link = set_db(build_blocks(), {"view": "list", "viewSwitch": True})
    reqs = []
    ctx, sp = student(browser, link, errors, tag, vp, mobile, reqs)
    sp.click('#wView button[data-v="list"]')
    wait_all_ready(sp, 17)
    st = sp.evaluate(ST)
    check(f"{tag} 1 все 17 карточек отрисованы (CardRender), без снимков и кадров", len(st) == 17 and all(x["cr"] and x["imgs"] == 0 for x in st), str(st[:3]))
    pages = [u for u in reqs if u.split("?")[0].endswith(".html") and not u.split("?")[0].endswith("/work.html")]
    check(f"{tag} 1 ни одной страницы тренажёра не загружено", not pages, str(pages))
    check(f"{tag} 1 кадров на странице нет", sp.evaluate("() => document.querySelectorAll('iframe').length") == 0 or sp.evaluate("() => [...document.querySelectorAll('iframe')].every(f => !f.getAttribute('src'))"))
    js = [u.split("/")[-1].split("?")[0] for u in reqs if "/cards/" in u and u.split("?")[0].endswith(".json")]
    check(f"{tag} 1 файл карточек — один на slug (3 на 17 заданий)", sorted(js) == ["ege_prof.json", "oge19.json", "oge9.json"], str(js))
    # TeX у ЕГЭ — формулами KaTeX; рисунок у №12+ загружен
    check(f"{tag} 1 формулы KaTeX у ЕГЭ отрисованы", sp.evaluate("() => window.__work.views[16].wrap.querySelectorAll('.katex').length") > 0)
    # 3. прокрутка не меняет высоты
    h0 = sp.evaluate(ST)
    tot0 = sp.evaluate("() => document.documentElement.scrollHeight")
    for y in ("document.body.scrollHeight", "0", "document.body.scrollHeight", "0"):
        sp.evaluate(f"() => window.scrollTo(0, {y})"); sp.wait_for_timeout(500)
    h1 = sp.evaluate(ST)
    tot1 = sp.evaluate("() => document.documentElement.scrollHeight")
    dh = max(abs(a["h"] - b["h"]) for a, b in zip(h0, h1))
    check(f"{tag} 3 высота заданий при прокрутке не прыгает (≤ {JUMP} px)", dh <= JUMP and abs(tot0 - tot1) <= JUMP, f"{dh}, {tot0}→{tot1}")
    check(f"{tag} 3 карточки не перерисованы прокруткой", sp.evaluate("() => window.__work.views.every(v => v.cstate === 'ready')"))
    sp.evaluate("() => window.scrollTo(0, document.documentElement.scrollHeight)"); sp.wait_for_timeout(400)
    r = sp.evaluate("""() => { const vs = window.__work.views, last = vs[vs.length - 1]; const t0 = last.root.getBoundingClientRect().top;
      vs[0].cardEl.style.paddingBottom = '140px'; return new Promise(res => setTimeout(() => res([t0, last.root.getBoundingClientRect().top]), 600)); }""")
    check(f"{tag} 3 карточка выше экрана выросла — читаемое не уехало (±2 px)", abs(r[0] - r[1]) <= 2, str(r))
    sp.evaluate("() => { window.__work.views[0].cardEl.style.paddingBottom = ''; }")
    check(f"{tag} 6а страница не шире экрана", overflow_x(sp) <= 0, str(overflow_x(sp)))
    # 6. A+ / A−
    sp.evaluate("() => window.scrollTo(0, 0)"); sp.wait_for_timeout(200)
    k0 = sp.evaluate("() => window.__work.views[0].k"); hh0 = sp.evaluate("() => window.__work.views[0].root.getBoundingClientRect().height")
    sp.click("#wZoomIn"); sp.wait_for_timeout(400)
    k1 = sp.evaluate("() => window.__work.views[0].k"); hh1 = sp.evaluate("() => window.__work.views[0].root.getBoundingClientRect().height")
    check(f"{tag} 6 «A+» увеличивает текст карточки", k1 > k0 * 1.05 and hh1 > hh0, f"{k0}→{k1}, {hh0}→{hh1}")
    check(f"{tag} 6 после «A+» нет горизонтальной прокрутки", overflow_x(sp) <= 0, str(overflow_x(sp)))
    sp.click("#wZoomOut"); sp.click("#wZoomOut"); sp.wait_for_timeout(400)
    k2 = sp.evaluate("() => window.__work.views[0].k")
    check(f"{tag} 6 «A−» уменьшает текст", k2 < k0, f"{k0}→{k2}")
    sp.click("#wZoomIn"); sp.wait_for_timeout(300)

    # 5. ответы: fields (oge9 №0 = −0,9)
    type_answer(sp, 0, "5"); sp.click(".titem[data-i='0'] .b-check"); sp.wait_for_timeout(300)
    a = sp.evaluate("() => window.__work.S.answers['c0']")
    msg = sp.evaluate("() => document.querySelector(\".titem[data-i='0'] .wmsg\").textContent")
    check(f"{tag} 5 fields: неверный ответ — попытка записана, «Неверно»", a and a["tries"] == 1 and a["status"] in ("pending", "bad") and "Неверно" in msg, f"{a} {msg}")
    type_answer(sp, 0, "-0,9"); sp.click(".titem[data-i='0'] .b-check"); sp.wait_for_timeout(300)
    a = sp.evaluate("() => window.__work.S.answers['c0']")
    check(f"{tag} 5 fields: верный ответ −0,9 → ok", a and a["status"] == "ok" and a["tries"] == 2, str(a))
    check(f"{tag} 5 fields: после верного поле закрыто", sp.evaluate("() => window.__work.views[0].inputs[0].disabled"))
    # multi: oge19 №6 (индекс 6), верно — вариант 1 (correct [0]); сначала неверный
    sp.click(".titem[data-i='6'] .below-opt[data-i='1']"); sp.click(".titem[data-i='6'] .b-check"); sp.wait_for_timeout(300)
    a = sp.evaluate("() => window.__work.S.answers['c6']")
    check(f"{tag} 5 multi: неверный набор — не ok", a and a["status"] != "ok" and a["tries"] == 1, str(a))
    sp.click(".titem[data-i='6'] .below-opt[data-i='0']"); sp.click(".titem[data-i='6'] .b-check"); sp.wait_for_timeout(300)
    a = sp.evaluate("() => window.__work.S.answers['c6']")
    check(f"{tag} 5 multi: верный набор → ok", a and a["status"] == "ok", str(a))
    # черновик переживает перезагрузку
    type_answer(sp, 1, "42"); sp.wait_for_timeout(300)
    sp.reload(); sp.wait_for_selector("#scrTask:not([hidden])")
    wait_all_ready(sp, 17)
    sp.click('#wView button[data-v="list"]')
    sp.wait_for_timeout(500)
    d = sp.evaluate("() => window.__work.views[1].inputs[0].value")
    check(f"{tag} 5 черновик после перезагрузки на месте", d == "42", repr(d))
    a0 = sp.evaluate("() => window.__work.S.answers['c0']")
    check(f"{tag} 5 ответ после перезагрузки восстановлен из базы", a0 and a0["status"] == "ok", str(a0))
    ctx.close()


def run_choice(browser, errors, tag, vp, mobile):
    # choice: в пилоте карточек такого вида нет — берём условие oge19, ответ как у choice (3 варианта, верный №2)
    cs = load_cards()["oge19"]
    b = card_block(cs[0], 0)
    b["task"] = {"kind": "choice", "n": 3, "correct": 1}
    link = set_db([b], {"view": "list"})
    ctx, sp = student(browser, link, errors, tag + " choice", vp, mobile)
    sp.wait_for_function("() => window.__work.views.length === 1 && window.__work.views[0].cstate === 'ready'", timeout=20000)
    # у choice «Проверить» нет: выбор варианта — сам ответ, как у снимка
    sp.click(".below-opt[data-i='0']"); sp.wait_for_timeout(300)
    a = sp.evaluate("() => window.__work.S.answers['c0'] || null")
    ok_wrong = a and a["status"] in ("pending", "bad") and a["tries"] == 1
    check(f"{tag} 5 choice: неверный вариант — попытка записана, не ok", ok_wrong, str(a))
    sp.click(".below-opt[data-i='1']"); sp.wait_for_timeout(400)
    a = sp.evaluate("() => window.__work.S.answers['c0']")
    check(f"{tag} 5 choice: верный вариант → ok", a and a["status"] == "ok", f"{ok_wrong} {a}")
    ctx.close()


def run_one_mode(browser, errors, tag, vp, mobile):
    print(f"\n— {tag} «По одному»")
    link = set_db(build_blocks(), {"view": "one", "viewSwitch": True})
    ctx, sp = student(browser, link, errors, tag, vp, mobile)
    sp.wait_for_function("() => window.__work.views.length === 1 && window.__work.views[0].cstate === 'ready'", timeout=20000)
    HS = "() => { const v = window.__work.views[0]; return { i: v.i, st: v.cstate, h: Math.round(v.wrap.getBoundingClientRect().height), txt: !!v.wrap.querySelector('.cr') }; }"
    for i in (1, 2, 1, 14):
        sp.click(f".num[data-i='{i}']")
        sp.wait_for_timeout(150)
        a = sp.evaluate(HS)
        sp.wait_for_timeout(1500)
        b = sp.evaluate(HS)
        check(f"{tag} 4 №{i + 1}: карточка сразу, высота не прыгает (≤ {JUMP} px)", a["i"] == i and a["st"] == "ready" and a["txt"] and abs(a["h"] - b["h"]) <= JUMP, f"{a} {b}")
    check(f"{tag} 4 страница не шире экрана", overflow_x(sp) <= 0)
    ctx.close()


def run_placeholder(browser, errors):
    tag = "ноутбук"
    print("\n— «Загружаю задание…»")
    link = set_db(build_blocks(), {"view": "list"})
    held = []
    ctx = None
    ctx, sp = student(browser, link, errors, tag, {"width": 1440, "height": 950}, False, held=held)
    sp.wait_for_timeout(700)
    check("2 файлы карточек запрошены (удержаны тестом)", len(held) == 3, str(len(held)))
    s = sp.evaluate("() => window.__work.views.slice(0, 3).map(v => ({ st: v.cstate, wait: !!v.wrap.querySelector('.tc-wait'), h: Math.round(v.wrap.getBoundingClientRect().height) }))")
    check("2 пока файл карточек грузится — «Загружаю задание…» и резерв высоты (≥ 150 px)", all(x["wait"] and x["h"] >= 150 for x in s), str(s))
    for r in held:
        r.continue_()
    wait_all_ready(sp, 17)
    s2 = sp.evaluate("() => window.__work.views.slice(0, 3).map(v => ({ st: v.cstate, wait: !!v.wrap.querySelector('.tc-wait'), cr: !!v.wrap.querySelector('.cr') }))")
    check("2 после загрузки — условие карточки вместо заглушки", all((not x["wait"]) and x["cr"] for x in s2), str(s2))
    ctx.close()
    # сбой файла: сообщение и «Повторить»
    ctx = new_context(browser, live=True, cards=True, viewport={"width": 1440, "height": 950})
    state = {"fail": True}
    ctx.route("**/cards/oge9.json", lambda r: r.abort() if state["fail"] else r.continue_())
    sp = ctx.new_page(); watch_errors(sp, errors, "сбой")
    sp.goto(set_db(build_blocks(), {"view": "list"}))
    sp.wait_for_selector("#scrStart:not([hidden])"); sp.fill("#wName", "Петя"); sp.click("#wStart"); sp.wait_for_selector("#scrTask:not([hidden])")
    sp.wait_for_function("() => window.__work.views.length === 17 && window.__work.views[0].cstate === 'failed'", timeout=20000)
    check("2 файл не загрузился — сообщение с «Повторить», а не пустое место", sp.evaluate("() => !!window.__work.views[0].wrap.querySelector('.tc-err button')"))
    state["fail"] = False
    sp.click(".titem[data-i='0'] .tc-err button")
    sp.wait_for_function("() => window.__work.views[0].cstate === 'ready'", timeout=20000)
    check("2 «Повторить» — карточка открылась", sp.evaluate("() => !!window.__work.views[0].wrap.querySelector('.cr')"))
    ctx.close()


def run_train(browser, errors):
    print("\n— «Тренировка»")
    cs = load_cards()["oge9"]
    b = card_block(cs[1], 0, mode="train")     # p2, pos 0
    link = set_db([b], {"view": "list"})
    ctx, sp = student(browser, link, errors, "тренировка", {"width": 1440, "height": 950}, False)
    sp.wait_for_function("() => window.__work.views[0].cstate === 'ready'", timeout=20000)
    check("7 у «Тренировки» есть «Подсказки и решение»", sp.evaluate("() => !document.querySelector('.b-trainer').hidden"))
    sp.click(".b-trainer")
    sp.wait_for_function("""() => { const f = document.querySelector('.trainer-box iframe'); try { return !!(f && f.contentWindow && f.contentWindow.__trainerCatalog); } catch (e) { return false; } }""", timeout=30000)
    src = sp.evaluate("() => document.querySelector('.trainer-box iframe').getAttribute('src')")
    check("7 тренажёр открыт по href карточки", src == "oge9.html", src)
    # openAt поставил прототип p2: в кадре показано условие этого задания
    want = cs[1]["text"]
    sp.wait_for_timeout(5000)
    got = sp.evaluate("""() => { const w = document.querySelector('.trainer-box iframe').contentWindow; return w.document.body.innerText.replace(/\\s+/g, ' '); }""")
    import re
    plain = re.sub(r"\s+", "", re.sub(r"<[^>]+>", "", want))
    got = re.sub(r"\s+", "", got)
    check("7 в тренажёре то же место каталога (openAt): условие карточки на экране", plain in got, f"{plain!r} не найдено")
    ctx.close()


def run_mixed(browser, errors, tag, vp, mobile):
    print(f"\n— {tag} смешанная работа")
    link = set_db(build_blocks(mixed=True), {"view": "list"})
    ctx, sp = student(browser, link, errors, tag, vp, mobile)
    sp.wait_for_function("() => window.__work.views.length === 18 && window.__work.views.filter(v => v.b.type === 'card').every(v => v.cstate === 'ready')", timeout=30000)
    sp.wait_for_timeout(600)
    r = sp.evaluate("""() => window.__work.views.map(v => ({ t: v.b.type || 'task', img: v.wrap.querySelectorAll('.tc-box > img').length, cr: !!v.wrap.querySelector('.cr'), num: v.root.querySelector('.tnum').textContent }))""")
    check(f"{tag} 8 обычное задание-снимок осталось картинкой на своём месте (№3)", r[2]["t"] == "task" and r[2]["img"] == 1 and not r[2]["cr"], str(r[2]))
    check(f"{tag} 8 карточки вокруг — условием, нумерация сквозная", all(x["cr"] for k, x in enumerate(r) if k != 2) and r[17]["num"] == "Задание 18 из 18", str(r[17]))
    check(f"{tag} 8 страница не шире экрана", overflow_x(sp) <= 0)
    ctx.close()


def main():
    errors = []
    with s1.local_server():
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            run_placeholder(browser, errors)
            run_train(browser, errors)
            for tag, vp, mobile in (("ноутбук", {"width": 1440, "height": 950}, False), ("телефон", {"width": 390, "height": 844}, True)):
                run_list(browser, errors, tag, vp, mobile)
                run_choice(browser, errors, tag, vp, mobile)
                run_one_mode(browser, errors, tag, vp, mobile)
                run_mixed(browser, errors, tag, vp, mobile)
            browser.close()
    check("9 нет ошибок JavaScript", not errors, "; ".join(errors[:5]))
    print("\nИТОГО:", "ВСЁ ЗЕЛЁНОЕ" if not FAILS else f"ПРОВАЛЕНО: {len(FAILS)}")
    for f in FAILS:
        print("  -", f)
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
