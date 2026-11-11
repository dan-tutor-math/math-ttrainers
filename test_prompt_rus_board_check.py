"""
Живая проверка русского (и обществознания, английского) на доске.

Задания русского ОГЭ из панели «Тренажёры» ложились на доску мёртвой
картинкой: у rus_oge.html не было хука __boardTaskInfo, а снимок прятал
«Проверить». Теперь (часть 1 промпта «проверка ответов на доске»):
  1. Из панели по одному заданию каждого номера №2–12 ложится живое задание
     (у объекта есть task и места hot): варианты (mask) — kind 'multi',
     отметки нажатием на сам вариант, потом «Проверить»; №4 — цифры подряд,
     порядок важен; №5 и №7 — цифры в любом порядке; слово — kind 'fields'
     type 'word' norm 'ru'.
  2. Неверный ответ — «неверно» и красным, верный — «верно» и зелёным.
  3. Слово: «Обеим», «обеим », «ОБЕИМ», «е» вместо «ё» — верно; запасной
     ответ alt — верно; другое слово — неверно. Поле слова — обычная
     клавиатура (inputmode text), у цифр — цифровая.
  4. Ответы сохраняются после закрытия и повторного открытия доски.
  5. Задание с ok: 0 (ответ не сверен с ФИПИ) ложится картинкой без task.
  6. Обществознание: №2 (term) проверяется; №3 — флаг anyCols доезжает до
     доски, «перестановка внутри колонок» верна, между колонками — нет;
     №4 (выбор из 1–4) — на доске выбирается нажатием на вариант (kind 'choice',
     проверка сразу по нажатию, строки «Ответ: 1 2 3 4» на снимке нет); если
     на снимке вариантов нет — запасной путь, поле с цифрой (часть 2).
  7. Английский №29 (слова) проверяется на доске.
  8. Без ошибок JavaScript.

Запуск: python3 test_prompt_rus_board_check.py (сервер поднимается сам).
Совместный режим (ученик отмечает — учитель видит) отсюда не проверить:
websocket до Supabase из песочницы закрыт — перепроверяется на сайте руками.
"""
import contextlib
import http.client
import json
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8987
BASE = f"http://127.0.0.1:{PORT}"
FRAME = "document.getElementById('bdTrainersIframe')"


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                conn = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                conn.request("GET", "/boards.html")
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


BOOT_JS = """() => { const g = document.getElementById('authGate'); if (g) g.style.display = 'none'; window.boardsAppBoot(); }"""
SEED_JS = """([boards, payloads]) => new Promise((resolve, reject) => {
    const req = indexedDB.open('ogeBoardsDB', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('state');
    req.onsuccess = () => {
      const tx = req.result.transaction('state', 'readwrite');
      const st = tx.objectStore('state');
      st.put({ __v: 2, folders: [], boards, deleted: [], sortMode: 'my' }, 'db');
      Object.keys(payloads).forEach(id => st.put(payloads[id], 'boarddata:' + id));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
})"""
LITE = {"id": "bA", "name": "Урок", "folderId": None, "createdAt": 1000, "updatedAt": 1000,
        "lastOpenedAt": None, "rev": 1, "cellSize": 24, "sheetCols": 76, "sheetRows": 54,
        "pageOrder": "h", "recentColors": [], "colorUsage": {}, "view": {"x": 0, "y": 0, "zoom": 1}}

failures = []


def check(name, cond, extra=""):
    print(f"[{'OK' if cond else 'FAIL'}] {name}" + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        failures.append(name)


def load_rus():
    s = open("rus-oge-fipi.js", encoding="utf8").read()
    return json.loads(s[s.index("{"):s.rindex("}") + 1])["tasks"]


def open_board(ctx):
    page = ctx.new_page()
    page.set_viewport_size({"width": 1400, "height": 900})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda r: r.abort())
    page.goto(f"{BASE}/boards.html")
    page.evaluate(SEED_JS, [[LITE], {"bA": {"objects": [], "imageLib": []}}])
    page.reload()
    page.evaluate(BOOT_JS)
    page.wait_for_function("() => window.getDB && window.getDB().boards.length >= 1")
    page.evaluate("() => window.openBoard('bA')")
    page.wait_for_function("() => window.getCurrentBoard() && Array.isArray(window.getCurrentBoard().objects)")
    return page, errors


def open_panel(page):
    page.evaluate("() => document.getElementById('bdTrainersPanel').classList.add('open')")


def close_panel(page):
    page.evaluate("() => { document.getElementById('bdTrainersPanel').classList.remove('open'); boardsRedraw(); }")
    page.wait_for_timeout(250)


def open_trainer(page, tid, href, wait_fn, prep_js=None):
    open_panel(page)
    page.evaluate(f"() => openTrainerInPanel({json.dumps(tid)}, {json.dumps(href)}, {json.dumps(tid)})")
    page.wait_for_function(f"""() => {{ try {{ const f = {FRAME}; const w = f.contentWindow, d = f.contentDocument;
        return d.readyState === 'complete' && location.origin && w.location.href.indexOf({json.dumps(href.split('?')[0])}) >= 0 && ({wait_fn}); }}
        catch (e) {{ return false; }} }}""", timeout=20000)
    page.wait_for_timeout(500)
    if prep_js:
        page.evaluate(f"() => {FRAME}.contentWindow.eval({json.dumps(prep_js)})")
        page.wait_for_timeout(900)


RUS_READY = "!!d.getElementById('taskArea') && d.getElementById('taskArea').style.display !== 'none'"
EGE_READY = "!!d.querySelector('.mode-card')"


def add_to_board(page):
    n0 = page.evaluate("() => getCurrentBoard().objects.length")
    page.evaluate("() => document.getElementById('bdTrainersAddBtn').click()")
    page.wait_for_function(f"() => getCurrentBoard().objects.length > {n0} && !document.getElementById('bdTrainersAddBtn').disabled",
                           timeout=40000)
    page.wait_for_timeout(300)
    close_panel(page)
    return page.evaluate("() => JSON.parse(JSON.stringify(getCurrentBoard().objects.slice(-1)[0], (k, v) => k === 'src' ? '…' : v))")


def obj(page, oid):
    return page.evaluate(f"() => JSON.parse(JSON.stringify(getCurrentBoard().objects.find(o => o.id === {json.dumps(oid)}), (k, v) => k === 'src' ? '…' : v))")


def focus_on(page, oid):
    page.evaluate(f"""() => {{ const o = getCurrentBoard().objects.find(x => x.id === {json.dumps(oid)});
        setZoom(1, o.points[0].x + o.w / 2, o.points[0].y + o.h / 2, cssW / 2, cssH / 2); }}""")
    page.wait_for_timeout(250)


def sel(oid):
    return f'.bd-task[data-id="{oid}"]'


def st(page, oid):
    return (obj(page, oid).get("task") or {}).get("st") or {}


def fill_check(page, oid, values):
    """values — по порядку полей; Enter в последнем поле = «Проверить»."""
    ins = page.locator(f"{sel(oid)} .bd-task-in")
    for i, v in enumerate(values):
        ins.nth(i).fill(v)
    # Enter, а не клик: у цифровых полей открыта клавиатура ответа доски и
    # может закрывать «Проверить» (так же нажимает ученик)
    ins.nth(len(values) - 1).press("Enter")
    page.wait_for_timeout(200)
    return st(page, oid)


def in_classes(page, oid):
    return page.evaluate(f"""() => [...document.querySelectorAll('{sel(oid)} .bd-task-in')]
        .map(i => ({{ good: i.classList.contains('good'), bad: i.classList.contains('bad'), im: i.getAttribute('inputmode'), v: i.value }}))""")


def opt_classes(page, oid):
    return page.evaluate(f"""() => [...document.querySelectorAll('{sel(oid)} .bd-task-opt')]
        .map(b => ['picked', 'good', 'bad'].filter(c => b.classList.contains(c)))""")


def pick(page, oid, idxs):
    for i in idxs:
        page.click(f'{sel(oid)} .bd-task-opt[data-i="{i}"]')
        page.wait_for_timeout(80)


def rus_case(page, t):
    """Одно задание русского: на доску, неверно, верно. → id объекта."""
    n = t["n"]
    open_trainer(page, f"rus{n}", f"rus_oge.html?n={n}&t={t['id']}", RUS_READY)
    shown = page.evaluate(f"() => {FRAME}.contentWindow.__rusOge.S.list[{FRAME}.contentWindow.__rusOge.S.idx].id")
    check(f"№{n}: в кадре открыто нужное задание", shown == t["id"], shown)
    o = add_to_board(page)
    task = o.get("task") or {}
    check(f"№{n}: у объекта есть task и места на снимке (hot)", bool(task) and bool(task.get("hot")), str(task)[:200])
    if not task or not task.get("hot"):
        return o["id"]
    focus_on(page, o["id"])
    oid = o["id"]
    if t["k"] == "mask":
        correct = [i for i, c in enumerate(t["a"]) if c == "1"]
        wrong = [i for i in range(len(t["a"])) if i not in correct]
        check(f"№{n}: варианты — несколько отметок (multi)", task["kind"] == "multi" and task["n"] == len(t["a"])
              and task["correct"] == correct and len(task["hot"]["opts"]) == len(t["a"]) and task["hot"].get("check"), str(task)[:200])
        # неверно: все верные + один лишний
        pick(page, oid, correct + wrong[:1])
        cls = opt_classes(page, oid)
        check(f"№{n}: отметки — черновик, до «Проверить» в доску не пишутся",
              sum(1 for c in cls if "picked" in c) == len(correct) + 1 and not st(page, oid), str(cls))
        page.click(f"{sel(oid)} .bd-task-btn")
        page.wait_for_timeout(200)
        s = st(page, oid)
        cls = opt_classes(page, oid)
        check(f"№{n}: неверный выбор — «неверно», лишний вариант красным", s.get("res") == "bad" and "bad" in cls[wrong[0]], f"{s} {cls}")
        pick(page, oid, wrong[:1])     # снять лишнюю отметку
        page.click(f"{sel(oid)} .bd-task-btn")
        page.wait_for_timeout(200)
        s = st(page, oid)
        cls = opt_classes(page, oid)
        check(f"№{n}: верный выбор — «верно», отмеченные зелёным", s.get("res") == "ok" and all("good" in cls[i] for i in correct), f"{s} {cls}")
        return oid
    f = task["fields"][0]
    if t["k"] == "match":
        check("№4: поле цифр подряд, порядок важен", f["type"] == "plain" and f.get("seq") and not f.get("anyOrder") and f["value"] == t["a"], str(f))
        check("№4: поле с цифровой клавиатурой", in_classes(page, oid)[0]["im"] == "decimal")
        s = fill_check(page, oid, [t["a"][::-1]])
        check("№4: те же цифры в другом порядке — неверно", s.get("res") == "bad" and in_classes(page, oid)[0]["bad"], str(s))
        s = fill_check(page, oid, [t["a"]])
        check("№4: верный порядок — верно и зелёным", s.get("res") == "ok" and in_classes(page, oid)[0]["good"], str(s))
        return oid
    if n in (5, 7):
        check(f"№{n}: цифры в любом порядке", f["type"] == "plain" and f.get("seq") and f.get("anyOrder"), str(f))
        s = fill_check(page, oid, [t["a"][:-1]])
        check(f"№{n}: не все цифры — неверно", s.get("res") == "bad" and in_classes(page, oid)[0]["bad"], str(s))
        s = fill_check(page, oid, [t["a"][::-1]])
        check(f"№{n}: цифры в обратном порядке — верно и зелёным", s.get("res") == "ok" and in_classes(page, oid)[0]["good"], str(s))
        return oid
    check(f"№{n}: слово — поле word с правилом русского", f["type"] == "word" and f.get("norm") == "ru" and f["value"] == t["a"], str(f))
    check(f"№{n}: поле слова — обычная клавиатура (inputmode text)", in_classes(page, oid)[0]["im"] == "text")
    s = fill_check(page, oid, ["квазиответ"])
    check(f"№{n}: другое слово — неверно и красным", s.get("res") == "bad" and in_classes(page, oid)[0]["bad"], str(s))
    s = fill_check(page, oid, ["  " + t["a"].upper().replace("Ё", "Е") + " "])
    check(f"№{n}: заглавными, с пробелами, «е» вместо «ё» — верно и зелёным", s.get("res") == "ok" and in_classes(page, oid)[0]["good"], str(s))
    return oid


def word_variants(page, T):
    """Поблажки к слову — на отдельных заданиях №8 «обеим» и №9 с alt."""
    t = next(x for x in T if x["id"] == "278E49")          # №8, ответ «обеим»
    open_trainer(page, "rus8", f"rus_oge.html?n=8&t={t['id']}", RUS_READY)
    o = add_to_board(page)
    oid = o["id"]
    focus_on(page, oid)
    results = {}
    for v in ["Обеим", "обеим ", "ОБЕИМ", "обоим"]:
        results[v] = fill_check(page, oid, [v]).get("res")
        if results[v] == "ok":
            page.click(f"{sel(oid)} .bd-task-reset")
            page.wait_for_timeout(150)
    check("слово: «Обеим», «обеим », «ОБЕИМ» — верно; «обоим» — неверно",
          results == {"Обеим": "ok", "обеим ": "ok", "ОБЕИМ": "ok", "обоим": "bad"}, str(results))

    t = next(x for x in T if x["id"] == "1836AF")          # №9, «посёлок вдали», alt «посёлок вдалеке»
    open_trainer(page, "rus9", f"rus_oge.html?n=9&t={t['id']}", RUS_READY)
    o = add_to_board(page)
    oid = o["id"]
    focus_on(page, oid)
    s1 = fill_check(page, oid, ["поселок вдали"]).get("res")
    page.click(f"{sel(oid)} .bd-task-reset")
    page.wait_for_timeout(150)
    s2 = fill_check(page, oid, ["Посёлок вдалеке"]).get("res")
    check("слово: «е» вместо «ё» — верно; запасной ответ из alt — верно", s1 == "ok" and s2 == "ok", f"{s1} {s2}")


def soc_eng_cases(page):
    out = {}
    # ── обществознание №2: term ──
    open_trainer(page, "soc2", "soc_oge.html?n=2", EGE_READY, "document.querySelectorAll('.mode-card')[0].click()")
    o = add_to_board(page)
    task = o.get("task") or {}
    f = (task.get("fields") or [{}])[0]
    check("обществознание №2: живое задание с полем term", task.get("kind") == "fields" and f.get("type") == "term" and bool(task.get("hot")), str(task)[:200])
    if task.get("hot"):
        oid = o["id"]
        focus_on(page, oid)
        check("обществознание №2: поле — обычная клавиатура", in_classes(page, oid)[0]["im"] == "text")
        s = fill_check(page, oid, ["квазитермин"])
        check("обществознание №2: другое слово — неверно", s.get("res") == "bad", str(s))
        s = fill_check(page, oid, [f["value"].upper().replace("Ё", "Е") + "."])
        check("обществознание №2: слово заглавными, с точкой — верно", s.get("res") == "ok", str(s))
        out["soc2"] = oid

    # ── №3: anyCols ──
    open_trainer(page, "soc3", "soc_oge.html?n=3", EGE_READY, "document.querySelectorAll('.mode-card')[0].click()")
    o = add_to_board(page)
    task = o.get("task") or {}
    f = (task.get("fields") or [{}])[0]
    check("обществознание №3: флаг anyCols доехал до доски", f.get("anyCols") is True and f.get("seq") is True, str(f))
    if task.get("hot") and len(f.get("value", "")) == 4:
        oid = o["id"]
        focus_on(page, oid)
        v = f["value"]
        cross = v[2] + v[1] + v[0] + v[3]          # цифра сходства ушла в различия
        s = fill_check(page, oid, [cross])
        check(f"обществознание №3: обмен между колонками ({cross} при {v}) — неверно", s.get("res") == "bad", str(s))
        inside = v[1] + v[0] + v[3] + v[2]
        s = fill_check(page, oid, [inside])
        check(f"обществознание №3: порядок внутри колонок не важен ({inside} при {v}) — верно", s.get("res") == "ok", str(s))
        out["soc3"] = oid
    # то же правилом проверки: «4132» при ключе «1423» (пример из промпта)
    r = page.evaluate("() => taCheckField({ type: 'plain', seq: true, exactLen: true, anyCols: true, value: '1423' }, '4132')")
    check("обществознание №3: «4132» при ключе «1423» — верно", r is True, str(r))

    # ── №4: выбор из 1–4 ──
    open_trainer(page, "soc4", "soc_oge.html?n=4", EGE_READY, "document.querySelectorAll('.mode-card')[0].click()")
    o = add_to_board(page)
    task = o.get("task") or {}
    check("обществознание №4: задание живое", bool(task) and bool(task.get("hot")), str(task)[:200])
    check("обществознание №4: варианты нажатием — kind choice, 4 варианта на снимке, кнопки «Проверить» нет",
          task.get("kind") == "choice" and task.get("n") == 4 and len((task.get("hot") or {}).get("opts") or []) == 4
          and not (task.get("hot") or {}).get("check"), str(task)[:300])
    # запасной путь: вариантов на снимке нет (нет пометки data-bd-opt) — поле с цифрой
    open_panel(page)       # кадр виден: на скрытом (панель закрыта) вариантов «нет» по замеру
    page.wait_for_timeout(400)
    fb = page.evaluate(f"""() => {{ const w = {FRAME}.contentWindow, el = w.document.getElementById('egeQuestion');
        const a = trainerTaskInfo(w, 'soc4', el);
        el.querySelectorAll('[data-bd-opt]').forEach(e => e.removeAttribute('data-bd-opt'));
        const b = trainerTaskInfo(w, 'soc4', el);
        return [a && a.kind, b && b.kind, b && b.fields && b.fields[0].type, b && b.fields && b.fields[0].choices && b.fields[0].choices.length]; }}""")
    check("обществознание №4: есть варианты на снимке — choice, нет — поле yesno с цифрами", fb == ["choice", "fields", "yesno", 4], str(fb))
    close_panel(page)
    if task.get("hot"):
        oid = o["id"]
        focus_on(page, oid)
        if task["kind"] == "choice":           # варианты нажатием (часть 2)
            right = task["correct"]
            wrong = 0 if right else 1
            page.click(f'{sel(oid)} .bd-task-opt[data-i="{wrong}"]')
            page.wait_for_timeout(200)
            s1 = st(page, oid).get("res")
            page.click(f'{sel(oid)} .bd-task-opt[data-i="{right}"]')
            page.wait_for_timeout(200)
            s2 = st(page, oid).get("res")
        else:                                   # поле с номером варианта
            f = task["fields"][0]
            check("обществознание №4: поле yesno с вариантами-цифрами", f.get("type") == "yesno" and f.get("choices"), str(f))
            right = f["value"]
            wrong = next(c for c in f["choices"] if c != right)
            s1 = fill_check(page, oid, [wrong]).get("res")
            s2 = fill_check(page, oid, [right]).get("res")
        check("обществознание №4: неверный вариант — неверно, верный — верно", s1 == "bad" and s2 == "ok", f"{s1} {s2}")
        out["soc4"] = oid

    # ── английский №29: слова ──
    open_trainer(page, "eng29", "eng_oge.html?n=29", EGE_READY, "document.querySelectorAll('.mode-card')[0].click()")
    o = add_to_board(page)
    task = o.get("task") or {}
    fs = task.get("fields") or []
    check("английский №29: живое задание, поля word (правило en)",
          bool(task.get("hot")) and fs and all(f["type"] == "word" and f.get("norm") == "en" for f in fs), str(task)[:200])
    if task.get("hot") and fs:
        oid = o["id"]
        focus_on(page, oid)
        check("английский №29: поля — обычная клавиатура", all(c["im"] == "text" for c in in_classes(page, oid)))
        vals = [f["value"] for f in fs]
        s = fill_check(page, oid, ["zzz"] + vals[1:])
        check("английский №29: одно слово неверно — неверно", s.get("res") == "bad", str(s))
        s = fill_check(page, oid, [v.upper() + " " for v in vals])
        check("английский №29: все слова (заглавными, с пробелом) — верно", s.get("res") == "ok", str(s))
        out["eng29"] = oid
    return out


def main():
    T = load_rus()
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context()
        page, errors = open_board(ctx)

        # ── 1–3. по одному заданию каждого номера №2–12 ──
        picks = {}
        for n in range(2, 13):
            cand = [t for t in T if t["n"] == n and t.get("ok")]
            if n == 12:   # в №12 есть и варианты, и слово — берём оба
                picks["12m"] = next(t for t in cand if t["k"] == "mask")
                picks["12w"] = next(t for t in cand if t["k"] == "text")
            elif n == 4:  # порядок проверяем на ответе без повторов цифр
                picks[n] = next(t for t in cand if len(set(t["a"])) == len(t["a"]))
            elif n in (5, 7):
                picks[n] = next(t for t in cand if len(t["a"]) >= 2 and not t.get("alt"))
            else:
                picks[n] = cand[0]
        ids = {}
        for key, t in picks.items():
            ids[key] = rus_case(page, t)

        word_variants(page, T)

        # ── 5. ok: 0 — картинкой ──
        t0 = next(t for t in T if not t.get("ok"))
        open_trainer(page, f"rus{t0['n']}", f"rus_oge.html?all=1&n={t0['n']}&t={t0['id']}", RUS_READY)
        o = add_to_board(page)
        check("ok: 0 — задание ложится картинкой без проверки", o.get("src") and not o.get("task"), str(o)[:200])
        strip_live = page.evaluate(f"() => getComputedStyle({FRAME}.contentDocument.getElementById('checkBtn')).display !== 'none'")
        check("живая страница русского не тронута — «Проверить» на месте", strip_live)

        soc = soc_eng_cases(page)

        # ── 4. сохранение и повторное открытие доски ──
        page.wait_for_timeout(800)
        page.evaluate("() => backToList()")
        page.wait_for_timeout(900)
        page.evaluate("() => window.openBoard('bA')")
        page.wait_for_function("() => window.getCurrentBoard() && Array.isArray(window.getCurrentBoard().objects) && getCurrentBoard().objects.length > 10 && viewReady")
        bad_after = []
        for key, oid in list(ids.items()) + list(soc.items()):
            if st(page, oid).get("res") != "ok":
                bad_after.append(key)
        check("после повторного открытия доски итоги проверок на месте", not bad_after, str(bad_after))
        # и живые элементы показывают их: поле — зелёным, варианты — отмеченными
        oid = ids[8]
        focus_on(page, oid)
        page.wait_for_function(f"() => !!document.querySelector('{sel(oid)} .bd-task-in')", timeout=10000)
        c8 = in_classes(page, oid)[0]
        check("после перезагрузки: слово в поле, поле зелёное", c8["good"] and c8["v"] != "", str(c8))
        oid = ids[2]
        focus_on(page, oid)
        page.wait_for_function(f"() => document.querySelectorAll('{sel(oid)} .bd-task-opt').length > 0", timeout=10000)
        cls = opt_classes(page, oid)
        correct = [i for i, c in enumerate(picks[2]["a"]) if c == "1"]
        check("после перезагрузки: отмеченные варианты №2 зелёные", all("good" in cls[i] for i in correct), str(cls))

        check("нет ошибок JavaScript", not errors, "; ".join(errors[:3]))
        browser.close()

    print()
    if failures:
        print("ПРОВАЛЕНО:", len(failures))
        for f in failures:
            print("  -", f)
        sys.exit(1)
    print("Все проверки прошли")


if __name__ == "__main__":
    main()
