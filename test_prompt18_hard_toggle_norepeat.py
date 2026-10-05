"""
Промпт №18 нового списка: ОГЭ №8 (и «Степени» — копия №8) — галочка
«Нулевые и отрицательные степени», реже трудные задания, защита от
повторяющихся и похожих заданий во всех тренажёрах с генераторами.

Проверяет:
  A. галочка: в строке режимов под названием, рядом с «Обучение /
     Тренировка / Экзамен»; по умолчанию выключена; нажатие ставит галочку
     и сразу даёт новое задание; выбор помнится при смене типа (◀ ▶, «все
     типы»), режима и после перезагрузки; у корней и №14–16 неактивна;
     в «Степенях» — своя, со своим ключом;
  B. генераторы №1–16: без галочки ни одной нулевой или отрицательной
     степени — ни в условии, ни в итоге, ни в решении; ответ, пересчитанный
     здесь по записи формулы, верный (и у трудных заданий); с галочкой
     трудных ≈ 30 % (было ≈ 47 %), у №14–16 их нет;
  C. без повторов в №8: 30 заданий подряд, «+10», «Следующий пример»,
     небольшой №4 (перебор записей по кругу), заменяемое задание не
     возвращается;
  D. сессия и снимок: галочка в tsGetState, чужой снимок её ставит, но
     в localStorage не пишет; снимок без поля — выключена; учитель ставит —
     у ученика ставится (заглушка Supabase из теста №54);
  E. доска: в «ещё такое же» уходит галочка; новое задание — с ней,
     без неё трудных нет, и оно не повторяет снятое;
  F. другие тренажёры: модуль подключён во всех с генераторами (список —
     в HANDOFF.md), подряд нет повторов и одинаковых ответов там, где
     вариантов много; карточки «+» (отдельные кадры) не повторяют друг
     друга; «Проценты», логарифмы, тригонометрия — через банк;
  G. no-repeat.js сам по себе: перебор всех вариантов до повтора, ответ
     подряд, постоянный генератор и постоянный ответ не жгут пробы,
     история переживает перезагрузку, avoid;
  H. телефон 375 px: галочка под вкладками, видна целиком, без прокрутки
     вбок.

Живой realtime из песочницы не проверить — совместный режим перепроверяется
на сайте руками.

Запуск: python3 test_prompt18_hard_toggle_norepeat.py (сервер поднимается сам).
"""
import contextlib
import http.client
import math
import os
import re
import subprocess
import sys
import time
from fractions import Fraction

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from test_prompt54_trainer_sync_and_cards import FAKE_LIB  # noqa: E402

PORT = 9018
BASE = f"http://127.0.0.1:{PORT}"

results = []


def check(name, ok, extra=""):
    results.append((name, ok))
    print(f"[{'OK' if ok else 'FAIL'}] {name}" + (f": {extra}" if extra and not ok else ""))


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


def open_page(browser, url="oge8.html", width=1300, height=1000, ctx=None, fake=False):
    own = ctx is None
    if own:
        ctx = browser.new_context(viewport={"width": width, "height": height})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    if fake:
        page.add_init_script("try { localStorage.setItem('tsStage:direct', '1'); } catch (e) {}")
        page.route("**/supabase-js.umd.js", lambda route: route.fulfill(
            status=200, content_type="application/javascript", body=FAKE_LIB))
        page.route("**/fonts.googleapis.com/**", lambda route: route.abort())
        page.route("**/fonts.gstatic.com/**", lambda route: route.abort())
    else:
        page.route("https://**/*", lambda route: route.abort())
    page.goto(f"{BASE}/{url}")
    page.wait_for_function("() => typeof tsGetState === 'function' && window.NoRepeat")
    page.wait_for_timeout(300)
    return ctx, page, errors


def open_type(page, mid):
    page.evaluate(f"() => {{ curMode = '{mid}'; openTask(); }}")
    page.wait_for_timeout(150)


# ─── пересчёт ответа по записи формулы (KaTeX кладёт TeX в annotation) ───
def brace(s, i):
    """s[i] == '{' → индекс парной '}'"""
    depth = 0
    for j in range(i, len(s)):
        if s[j] == "{":
            depth += 1
        elif s[j] == "}":
            depth -= 1
            if depth == 0:
                return j
    raise ValueError("нет парной скобки: " + s)


def tex_to_py(t):
    t = t.replace(r"\left(", "(").replace(r"\right)", ")").replace(r"\cdot", "*").replace(" : ", "/")
    while r"\dfrac{" in t:
        i = t.index(r"\dfrac{")
        a0 = i + len(r"\dfrac")
        a1 = brace(t, a0)
        b1 = brace(t, a1 + 1)
        t = t[:i] + "((" + t[a0 + 1:a1] + ")/(" + t[a1 + 2:b1] + "))" + t[b1 + 1:]
    while r"\sqrt{" in t:
        i = t.index(r"\sqrt{")
        a0 = i + len(r"\sqrt")
        a1 = brace(t, a0)
        t = t[:i] + "SQ(" + t[a0 + 1:a1] + ")" + t[a1 + 1:]
    t = re.sub(r"\^\{(-?\d+)\}", r"**(\1)", t)
    t = re.sub(r"(?<![\w.])(\d+)", r"F(\1)", t)
    return t


def eval_task(prompt_tex, vals):
    expr = tex_to_py(prompt_tex[0])
    env = {"F": Fraction, "SQ": lambda x: math.sqrt(x)}
    for k, v in vals.items():
        env[k] = v
    return eval(expr, {"__builtins__": {}}, env)


def parse_vals(text, texs):
    """при a = 5 и b = √3 → {'a': Fraction(5), 'b': 1.732…}"""
    out = {}
    m = re.search(r"при (.*)$", text)
    if not m:
        return out
    tail = m.group(1)
    for name, raw in re.findall(r"([ab])\s*=\s*([−\-]?\d+)", tail):
        out[name] = Fraction(int(raw.replace("−", "-")))
    if "b" not in out and len(texs) > 1:
        sq = re.match(r"\\sqrt\{(\d+)\}", texs[1])
        if sq:
            out["b"] = math.sqrt(int(sq.group(1)))
    return out


EXPS_JS = r"""(args) => {
  const [ids, n, hard] = args;
  const res = {};
  hardCtl.set(hard, { persist: false });
  for (const id of ids) {
    const m = ALL_MODES.find(x => x.id === id);
    res[id] = [];
    for (let i = 0; i < n; i++) {
      const t = m.gen(wantHard(m));
      const d = document.createElement('div'); d.innerHTML = t.prompt;
      const texs = [...d.querySelectorAll('annotation')].map(a => a.textContent);
      const ex = document.createElement('div'); ex.innerHTML = t.explain;
      const etex = [...ex.querySelectorAll('annotation')].map(a => a.textContent).join(' ');
      d.querySelectorAll('.katex').forEach(k => k.remove());
      res[id].push({ exps: t.exps, v: t.correctValue, texs, text: d.textContent.trim(), etex, hard: hasNonNat(t) });
    }
  }
  return res;
}"""


def nonpos_exps(s):
    return [int(x) for x in re.findall(r"\^\{(-?\d+)\}", s) if int(x) <= 0]


# ─── A. галочка ───
def test_toggle_ui(browser):
    ctx, page, errors = open_page(browser)
    open_type(page, "p1")
    info = page.evaluate("""() => {
      const el = document.getElementById('hardToggle');
      const row = document.getElementById('submodeRow');
      const tabs = row.querySelector('.submode-tabs').getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const h1 = document.querySelector('.wrap h1').getBoundingClientRect();
      const title = document.getElementById('taskTitle').getBoundingClientRect();
      return { inRow: el.parentElement === row, afterTabs: row.querySelector('.submode-tabs').nextElementSibling === el,
               role: el.getAttribute('role'), checked: el.getAttribute('aria-checked'),
               label: el.textContent.trim(), box: !!el.querySelector('.ht-box'),
               below: r.top > h1.bottom && r.top > title.bottom, sameLine: Math.abs((r.top + r.bottom) / 2 - (tabs.top + tabs.bottom) / 2) < 12,
               visible: r.width > 100 && r.height > 15, ls: localStorage.getItem('hardToggle:oge8') };
    }""")
    check("A: галочка в строке режимов, сразу после вкладок", info["inRow"] and info["afterTabs"], str(info))
    check("A: подпись «Нулевые и отрицательные степени», квадратик", info["label"] == "Нулевые и отрицательные степени" and info["box"], info["label"])
    check("A: под названием, в одну линию с вкладками режимов", info["below"] and info["sameLine"] and info["visible"], str(info))
    check("A: по умолчанию выключена", info["role"] == "checkbox" and info["checked"] == "false" and info["ls"] is None, str(info))
    before = page.evaluate("() => curTask.prompt")
    page.click("#hardToggle")
    page.wait_for_timeout(200)
    st = page.evaluate("() => ({ c: document.getElementById('hardToggle').getAttribute('aria-checked'), ls: localStorage.getItem('hardToggle:oge8'), p: curTask.prompt, mark: getComputedStyle(document.querySelector('#hardToggle .ht-box svg')).opacity })")
    check("A: нажатие ставит галочку и запоминает", st["c"] == "true" and st["ls"] == "1" and st["mark"] == "1", str(st))
    check("A: нажатие сразу даёт новое задание", st["p"] != before)
    page.click("#nextTypeBtn")
    page.wait_for_timeout(150)
    page.click("#tabPractice")
    page.click("#tabExam")
    page.click("#backBtn")
    page.click('.mode-card[data-id="p3"]')
    page.wait_for_timeout(150)
    check("A: после ▶, смены режима и «все типы» — галочка стоит",
          page.evaluate("() => hardCtl.get() && document.getElementById('hardToggle').getAttribute('aria-checked') === 'true'"))
    page.reload()
    page.wait_for_function("() => typeof tsGetState === 'function'")
    page.click('.mode-card[data-id="p2"]')
    page.wait_for_timeout(150)
    check("A: после перезагрузки — стоит", page.evaluate("() => hardCtl.get()"))
    # где галочка ничего не меняет — неактивна, нажатие не действует
    for mid, why in (("p20", "корни"), ("p14", "№14"), ("demo2027", "демоверсия")):
        open_type(page, mid)
        r = page.evaluate("() => { const el = document.getElementById('hardToggle'); const p = curTask.prompt; el.click(); return { off: el.classList.contains('ht-off'), on: hardCtl.get(), same: curTask.prompt === p, title: el.title }; }")
        check(f"A: {why} — галочка неактивна, нажатие ничего не меняет", r["off"] and r["on"] and r["same"] and r["title"], str(r))
    for mid in ("random", "p13"):
        open_type(page, mid)
        check(f"A: {mid} — галочка активна", not page.evaluate("() => document.getElementById('hardToggle').classList.contains('ht-off')"))
    page.click("#hardToggle")
    check("A: снять галочку", page.evaluate("() => !hardCtl.get() && localStorage.getItem('hardToggle:oge8') === '0'"))
    check("A: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    ctx, page, errors = open_page(browser, url="powers.html")
    page.click('.mode-card[data-id="p4"]')
    page.wait_for_timeout(150)
    page.click("#hardToggle")
    r = page.evaluate("() => ({ on: hardCtl.get(), ls: localStorage.getItem('hardToggle:powers'), o8: localStorage.getItem('hardToggle:oge8'), state: tsGetState().hardNums })")
    check("A: «Степени» — своя галочка, свой ключ", r == {"on": True, "ls": "1", "o8": None, "state": True}, str(r))
    check("A: «Степени» — без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── B. генераторы ───
def test_generators(browser):
    for url in ("oge8.html", "powers.html"):
        ctx, page, errors = open_page(browser, url=url)
        ids = [f"p{i}" for i in range(1, 17)]
        off = page.evaluate(EXPS_JS, [ids, 200, False])
        on = page.evaluate(EXPS_JS, [ids, 150, True])
        tag = "B" if url == "oge8.html" else "B (Степени)"
        bad_nat, bad_val = [], []
        for mid, items in off.items():
            for t in items:
                neg = [e for e in t["exps"] if e <= 0] + nonpos_exps(" ".join(t["texs"])) + nonpos_exps(t["etex"])
                if neg or t["hard"]:
                    bad_nat.append((mid, t["exps"], t["texs"][0]))
        for mid, items in list(off.items()) + list(on.items()):
            for t in items:
                vals = parse_vals(t["text"], t["texs"])
                try:
                    v = eval_task(t["texs"], vals)
                except Exception as e:  # noqa: BLE001
                    bad_val.append((mid, "eval", str(e), t["texs"][0]))
                    continue
                if abs(float(v) - t["v"]) > 1e-6 * max(1, abs(t["v"])):
                    bad_val.append((mid, float(v), t["v"], t["texs"][0], vals))
        check(f"{tag}: без галочки — ни одной степени ≤ 0 (условие, итог, решение), 16 типов × 200", not bad_nat, str(bad_nat[:3]))
        check(f"{tag}: ответ сходится с формулой — и без галочки, и с ней", not bad_val, str(bad_val[:3]))
        n_on = sum(len(v) for v in on.values())
        share = sum(t["hard"] for v in on.values() for t in v) / n_on
        check(f"{tag}: с галочкой трудных ≈ 30 % (было ≈ 47 %)", 0.24 <= share <= 0.36, f"{share:.3f}")
        per = {k: sum(t["hard"] for t in v) / len(v) for k, v in on.items()}
        check(f"{tag}: у №1–13 трудные бывают у каждого типа, у №14–16 — никогда",
              all(0.15 <= per[f"p{i}"] <= 0.6 for i in range(1, 14)) and all(per[f"p{i}"] == 0 for i in (14, 15, 16)), str(per))
        # №4 и №13 без галочки — натуральная запись (раньше там всегда был минус)
        p4 = {t["texs"][0] for t in off["p4"]}
        check(f"{tag}: №4 без галочки — показатели натуральные, «a¹» не пишется",
              all("-" not in x and "a^{1}" not in x for x in p4) and len(p4) >= 5, str(sorted(p4)[:4]))
        p11 = [t["texs"][0] for t in off["p11"]]
        check(f"{tag}: №11 без галочки — 1/cᵐ · cⁿ", all(x.startswith(r"\dfrac{1}{") and "left(" not in x for x in p11), p11[0])
        check(f"{tag}: без ошибок JS", not errors, str(errors[:1]))
        ctx.close()


# ─── C. без повторов в №8 ───
def keys_js(expr):
    return f"(() => {{ const t = {expr}; const k = nrKeys(t); return [NoRepeat.hash(k.exact), String(k.answer), k.shape ? NoRepeat.hash(k.shape) : null]; }})()"


def test_norepeat_oge8(browser):
    ctx, page, errors = open_page(browser)
    open_type(page, "p1")
    ks = []
    for _ in range(30):
        page.evaluate("() => newTask()")
        ks.append(page.evaluate(keys_js("curTask")))
    ex = [k[0] for k in ks]
    sh = [k[2] for k in ks]
    ans_close = [i for i in range(1, len(ks)) for j in range(max(0, i - 3), i) if ks[i][1] == ks[j][1]]
    check("C: №1 — 30 «Следующий пример» без повторов и без «того же с другим a»",
          len(set(ex)) == 30 and len(set(sh)) == 30, f"{len(set(ex))}/{len(set(sh))}")
    check("C: ответ не повторяется среди трёх соседних", not ans_close, str(ans_close[:3]))
    # «+10»: одиннадцать заданий на экране — разные, ответы соседей разные
    page.evaluate("() => appendAddedTasks(10)")
    batch = page.evaluate("() => [curTask].concat(addedTasks.map(b => b.task)).map(t => { const k = nrKeys(t); return [NoRepeat.hash(k.exact), String(k.answer), NoRepeat.hash(k.shape)]; })")
    near = [i for i in range(1, len(batch)) for j in range(max(0, i - 3), i) if batch[i][1] == batch[j][1]]
    check("C: «+10» — 11 разных заданий, разные записи, соседние ответы разные",
          len({b[0] for b in batch}) == 11 and len({b[2] for b in batch}) == 11 and not near, str(batch[:2]))
    old = {b[0] for b in batch}
    page.evaluate("() => nextBatchAll()")
    batch2 = page.evaluate("() => [curTask].concat(addedTasks.map(b => b.task)).map(t => NoRepeat.hash(nrKeys(t).exact))")
    check("C: ⟳ всей страницы — новая партия не повторяет прежнюю", not (old & set(batch2)) and len(set(batch2)) == 11)
    page.evaluate("() => clearAddedTasks()")
    # небольшой №4 без галочки: семь записей — по кругу, без повтора, пока не перебраны все
    open_type(page, "p4")
    page.evaluate("() => NoRepeat.reset('oge8:p4')")
    # задание, что уже на экране, — первое в ряду (его новое тоже не повторяет)
    shapes = [page.evaluate("() => nrKeys(curTask).shape")]
    for _ in range(13):
        page.evaluate("() => newTask()")
        shapes.append(page.evaluate("() => nrKeys(curTask).shape"))
    # строже «первые семь все разные» нельзя: правило «не тот же ответ среди
    # трёх соседних» важнее похожести, а у двух записей №4 ответы ±128 —
    # иногда запись возвращается через одно задание (≈ 15 % прогонов)
    check("C: №4 — все 7 записей встречаются уже среди первых 12 заданий (перебор по кругу)",
          len(set(shapes[:12])) == 7, str(shapes[:12]))
    check("C: №4 — одна и та же запись два раза подряд не выпадает",
          all(shapes[i] != shapes[i - 1] for i in range(1, 14)), str(shapes))
    # заменяемое задание не возвращается, даже если пришло не из этой вкладки
    open_type(page, "p2")
    page.evaluate("() => NoRepeat.reset('oge8:p2')")
    cur = page.evaluate(keys_js("curTask"))
    again = []
    for _ in range(12):
        page.evaluate("() => { const was = curTask; NoRepeat.reset('oge8:p2'); newTask(); window.__was = was; }")
        again.append(page.evaluate("() => NoRepeat.hash(nrKeys(curTask).exact) === NoRepeat.hash(nrKeys(window.__was).exact) || nrKeys(curTask).answer === nrKeys(window.__was).answer"))
    check("C: новое задание не совпадает с тем, что заменяет (avoid), даже без истории", not any(again), str(cur))
    check("C: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── D. сессия и снимок ───
def test_session(browser):
    ctx, page, errors = open_page(browser)
    open_type(page, "p5")
    r = page.evaluate("""() => {
      const s0 = tsGetState().hardNums;
      const snap = tsGetState(); snap.hardNums = true;
      tsApplyState(snap);
      const a = { on: hardCtl.get(), ui: document.getElementById('hardToggle').getAttribute('aria-checked'), ls: localStorage.getItem('hardToggle:oge8'), st: tsGetState().hardNums };
      const old = tsGetState(); delete old.hardNums;
      tsApplyState(old);
      return { s0, a, after: hardCtl.get() };
    }""")
    check("D: галочка в снимке сессии (выключена)", r["s0"] is False, str(r))
    check("D: чужой снимок ставит галочку, но не пишет её в localStorage",
          r["a"] == {"on": True, "ui": "true", "ls": None, "st": True}, str(r["a"]))
    check("D: снимок без поля (вкладка до промпта №18) — выключена", r["after"] is False)
    check("D: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    ctx = browser.new_context(viewport={"width": 1300, "height": 1000})
    errs = []
    teacher = open_page(browser, ctx=ctx, fake=True)[1]
    teacher.on("pageerror", lambda e: errs.append(str(e)))
    teacher.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()", timeout=10000)
    code = teacher.evaluate("() => window.TrainerSession.getCode()")
    teacher.click('.mode-card[data-id="p3"]')
    teacher.wait_for_timeout(400)
    student = open_page(browser, ctx=ctx, fake=True, url=f"oge8.html?s={code}")[1]
    student.on("pageerror", lambda e: errs.append(str(e)))
    student.wait_for_timeout(1500)
    teacher.click("#hardToggle")
    teacher.wait_for_timeout(1500)
    s = student.evaluate("() => ({ on: hardCtl.get(), ui: document.getElementById('hardToggle').getAttribute('aria-checked'), m: curMode, t: curTask && curTask.prompt })")
    t = teacher.evaluate("() => ({ on: hardCtl.get(), t: curTask.prompt })")
    check("D: учитель поставил галочку — у ученика она стоит, задание то же",
          s["on"] and s["ui"] == "true" and s["m"] == "p3" and s["t"] == t["t"], str(s)[:200])
    teacher.click("#hardToggle")
    teacher.wait_for_timeout(1500)
    check("D: учитель снял — у ученика снята", student.evaluate("() => !hardCtl.get()"))
    check("D: сессия без ошибок JS", not errs, str(errs[:1]))
    ctx.close()


# ─── E. доска: «ещё такое же» ───
def test_board(browser):
    ctx, page, errors = open_page(browser)
    page.add_script_tag(url="trainer-tasks.js")
    page.wait_for_function("() => typeof trainerGenInfo === 'function'")
    page.click('.mode-card[data-id="p4"]')
    page.wait_for_timeout(150)
    page.click("#hardToggle")
    page.wait_for_timeout(150)
    gen = page.evaluate("() => trainerGenInfo(window, 'oge8', 'oge8.html', document.getElementById('questionPanel'))")
    check("E: в рецепт «ещё такое же» уходит галочка", gen and gen["kind"] == "state" and gen["snap"].get("hardNums") is True and gen["snap"]["curMode"] == "p4", str(gen and gen.get("snap", {}).get("hardNums")))
    # дальше — так же, как доска в невидимом кадре: применить снимок и newTask()
    page.evaluate("() => hardCtl.set(false, { persist: false })")

    def run(snap, n):
        out = []
        for _ in range(n):
            src = page.evaluate("() => NoRepeat.hash(nrKeys(curTask).exact)")
            page.evaluate("(g) => genNewTaskInFrame(window, g)", {"kind": "state", "snap": snap, "tid": "oge8", "href": "oge8.html"})
            page.wait_for_timeout(420)
            out.append(page.evaluate("() => [hasNonNat(curTask), NoRepeat.hash(nrKeys(curTask).exact), curMode]") + [src])
        return out
    hard_runs = run(gen["snap"], 14)
    check("E: с галочкой — среди новых заданий есть трудные, тип тот же",
          any(r[0] for r in hard_runs) and all(r[2] == "p4" for r in hard_runs), str([r[0] for r in hard_runs]))
    check("E: новое задание не повторяет то, с которого делали", all(r[1] != r[3] for r in hard_runs))
    snap_off = dict(gen["snap"], hardNums=False)
    off_runs = run(snap_off, 10)
    check("E: без галочки — трудных нет", not any(r[0] for r in off_runs), str([r[0] for r in off_runs]))
    old = dict(gen["snap"])
    old.pop("hardNums")
    check("E: рецепт без поля (задание на доске до промпта №18) — без трудных", not any(r[0] for r in run(old, 6)))
    check("E: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── F. другие тренажёры ───
GEN_PAGES = {
    # страница: как зовётся генерация (поиск в коде)
    "oge1_5": "NoRepeat.pick('oge1_5:'", "oge6": "NoRepeat.pick('oge6:'", "oge7": "NoRepeat.pick('oge7:'",
    "oge8": "NoRepeat.pick('oge8:'", "oge9": "NoRepeat.pick('oge9:'", "oge10": "NoRepeat.pick('oge10:'",
    "oge11": "NoRepeat.pick('oge11:'", "oge12": "NoRepeat.pick('oge12:'", "oge13": "NoRepeat.pick('oge13:'",
    "oge14": "NoRepeat.pick('oge14:'", "oge15_18": "NoRepeat.pick('oge15_18:'", "oge19": "NoRepeat.pick('oge19:'",
    "powers": "NoRepeat.pick('powers:'",
    "addition": "NoRepeat.pick('addition:'", "subtraction": "NoRepeat.pick('subtraction:'",
    "multiplication": "NoRepeat.pick('multiplication:'", "division": "NoRepeat.pick('division:'",
    "linear": "NoRepeat.pick('linear:'", "quadratic": "NoRepeat.pick('quadratic:'",
    "fraction_multiply": "NoRepeat.pick('fraction_multiply:'", "fraction_divide": "NoRepeat.pick('fraction_divide:'",
    "gcd": "NoRepeat.pick('gcd:'", "lcm": "NoRepeat.pick('lcm:'",
}
BANK_PAGES = {"percent": "percent-bank.js", "logarithms": "logarithms-bank.js", "trig_equations": "trig-bank.js"}


def test_other_trainers(browser):
    bad = []
    for slug, needle in GEN_PAGES.items():
        src = open(os.path.join(HERE, slug + ".html"), encoding="utf-8").read()
        if '<script src="no-repeat.js"></script>' not in src or needle not in src:
            bad.append(slug)
    for slug, bank in BANK_PAGES.items():
        src = open(os.path.join(HERE, slug + ".html"), encoding="utf-8").read()
        bsrc = open(os.path.join(HERE, bank), encoding="utf-8").read()
        if '<script src="no-repeat.js"></script>' not in src or "NoRepeat.pick(" not in bsrc:
            bad.append(slug)
    check("F: модуль подключён во всех 26 тренажёрах с генераторами", not bad, str(bad))

    # ОГЭ: типы с большим числом вариантов — 25 подряд без повторов и без одинаковых ответов подряд
    cases = [("oge6", "p1", "open"), ("oge9", "p12", "open"), ("oge12", "f3", "open"), ("oge14", "t4", "open"),
             ("oge15_18", "tri", "open"), ("oge7", "point_on_line_decimal", "start"), ("oge10", "type1", "start"),
             ("oge1_5", "tariff1", "open")]
    for slug, mid, how in cases:
        ctx, page, errors = open_page(browser, url=slug + ".html")
        opener = "startMode(id)" if how == "start" else "(curMode = id, openTask())"
        r = page.evaluate("""([id, n]) => {
          %s;
          const ks = [];
          for (let i = 0; i < n; i++) { newTask(); const k = NoRepeat.keysOf(curTask); ks.push([NoRepeat.hash(k.exact), k.answer]); }
          return ks;
        }""" % opener.replace("id", "id"), [mid, 25])
        rep = len(r) - len({k[0] for k in r})
        same = [i for i in range(1, len(r)) if r[i][1] is not None and r[i][1] == r[i - 1][1]]
        check(f"F: {slug} {mid} — 25 подряд без повторов и одинаковых ответов подряд", rep == 0 and not same and not errors, f"повторов {rep}, ответов {same[:3]} {errors[:1]}")
        ctx.close()

    # пошаговые: пример целиком и ответ (как у «ответа сразу»)
    for slug in ("addition", "multiplication", "linear", "quadratic", "fraction_multiply", "gcd"):
        ctx, page, errors = open_page(browser, url=slug + ".html")
        r = page.evaluate("""(n) => { const ks = []; for (let i = 0; i < n; i++) { newProblem(); const k = nrKeysP(P); ks.push([k.exact, k.answer]); } return ks; }""", 25)
        rep = len(r) - len({k[0] for k in r})
        same = [i for i in range(1, len(r)) if r[i][1] and r[i][1] == r[i - 1][1]]
        noans = sum(1 for k in r if not k[1])
        check(f"F: {slug} — 25 примеров подряд без повторов и одинаковых ответов подряд", rep == 0 and not same and noans == 0 and not errors,
              f"повторов {rep}, ответов {same[:3]}, без ответа {noans} {errors[:1]}")
        ctx.close()

    # банки
    ctx, page, errors = open_page(browser, url="percent.html")
    r = page.evaluate("""() => { const ks = []; for (let i = 0; i < 20; i++) { const t = PERCENT_BANK.generate('of-num', 2); ks.push([t.text, t.answer]); } return ks; }""")
    check("F: «Проценты» — 20 подряд без повторов и одинаковых ответов подряд",
          len({k[0] for k in r}) == 20 and all(r[i][1] != r[i - 1][1] for i in range(1, 20)) and not errors, str(errors[:1]))
    ctx.close()
    ctx, page, errors = open_page(browser, url="logarithms.html")
    r = page.evaluate("""() => { const ks = []; for (let i = 0; i < 20; i++) { const t = LOG_BANK.generate(['prod', 'quot'], 2); ks.push([t.text, t.answer, t.pid]); } return ks; }""")
    check("F: логарифмы — 20 подряд без повторов и одинаковых ответов подряд",
          len({k[0] for k in r}) == 20 and all(r[i][1] != r[i - 1][1] for i in range(1, 20)) and not errors, str(errors[:1]))
    check("F: логарифмы — свойство подряд не повторяется (как и было)", all(r[i][2] != r[i - 1][2] for i in range(1, 20)), str([k[2] for k in r]))
    ctx.close()
    ctx, page, errors = open_page(browser, url="trig_equations.html")
    r = page.evaluate("""() => { const ks = []; for (let i = 0; i < 15; i++) { const t = TRIG_BANK.generate(['shift']); ks.push([t.text, t.answer]); } return ks; }""")
    check("F: тригонометрия — 15 подряд без повторов и одинаковых ответов подряд",
          len({k[0] for k in r}) == 15 and all(r[i][1] != r[i - 1][1] for i in range(1, 15)) and not errors, str(errors[:1]))
    ctx.close()

    # карточки «+» в ОГЭ №6 — отдельные кадры той же вкладки: общий sessionStorage
    ctx, page, errors = open_page(browser, url="oge6.html")
    page.click('.mode-card[data-id="p3"]')
    page.wait_for_timeout(300)
    page.click("#addRailToggle")
    page.click('.add-qty-btn[data-n="5"]')
    page.wait_for_function("""() => [...document.querySelectorAll('.tm-card iframe')].filter(f => { try { const st = f.contentWindow.__trainerState.get(); return !!(st && st.curTask); } catch (e) { return false; } }).length === 5""", timeout=20000)
    page.wait_for_timeout(500)
    prompts = page.evaluate("""() => {
      const out = [NoRepeat.hash(NoRepeat.keysOf(curTask).exact)];
      document.querySelectorAll('.tm-card iframe').forEach(f => { try { const t = f.contentWindow.__trainerState.get().curTask; if (t) out.push(NoRepeat.hash(NoRepeat.keysOf(t).exact)); } catch (e) {} });
      return out;
    }""")
    check("F: ОГЭ №6, «+» пять карточек — шесть разных заданий", len(prompts) == 6 and len(set(prompts)) == 6, str(len(prompts)))
    check("F: карточки без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── G. no-repeat.js сам по себе ───
def test_module(browser):
    ctx, page, errors = open_page(browser, url="oge6.html")
    r = page.evaluate("""() => {
      NoRepeat.reset();
      const R = {};
      // пять вариантов: пять разных подряд, шестой — самый давний
      const five = ['a', 'b', 'c', 'd', 'e'];
      const seq = [];
      for (let i = 0; i < 10; i++) seq.push(NoRepeat.pick('t:five', () => ({ prompt: five[Math.floor(Math.random() * 5)] })).prompt);
      R.first5 = new Set(seq.slice(0, 5)).size;
      R.cycle = seq.slice(5).join('') === seq.slice(0, 5).join('');
      // ответы из двух значений: подряд одинаковых нет
      const ans = [];
      for (let i = 0; i < 20; i++) ans.push(NoRepeat.pick('t:ans', () => ({ prompt: 'q' + Math.random(), correctValue: Math.random() < 0.5 ? 1 : 2 }), { win: { answer: 1 } }).correctValue);
      R.alt = ans.every((v, i) => !i || v !== ans[i - 1]);
      // постоянный генератор (демоверсия) — не жжёт все пробы
      let calls = 0;
      for (let i = 0; i < 5; i++) NoRepeat.pick('t:const', () => { calls++; return { prompt: 'demo', correctValue: 49 }; });
      R.constCalls = calls;
      // постоянный ответ у типа (№13 «Система не имеет решений») — задания разные, проб немного
      calls = 0; const ex = [];
      for (let i = 0; i < 10; i++) ex.push(NoRepeat.pick('t:constAns', () => { calls++; return { prompt: 'x' + Math.floor(Math.random() * 1000), options: ['нет решений', '1', '2'], correctIndex: 0 }; }).prompt);
      R.constAnsCalls = calls; R.constAnsUniq = new Set(ex).size;
      // avoid: то, что на экране, не возвращается
      const avoidHits = [];
      for (let i = 0; i < 20; i++) { NoRepeat.reset('t:avoid'); avoidHits.push(NoRepeat.pick('t:avoid', () => ({ prompt: Math.random() < 0.5 ? 'A' : 'B' }), { avoid: [{ prompt: 'A' }] }).prompt); }
      R.avoid = avoidHits.every(p => p === 'B');
      // «похожее» по ключу страницы
      const sh = [];
      for (let i = 0; i < 4; i++) sh.push(NoRepeat.pick('t:shape', () => { const s = 1 + Math.floor(Math.random() * 4); return { prompt: 's' + s + ' a=' + Math.random(), s }; }, { keys: t => ({ exact: t.prompt, shape: 's' + t.s }) }).s);
      R.shapes = new Set(sh).size;
      R.stored = NoRepeat._read('t:five').length;
      return R;
    }""")
    check("G: пять вариантов — пять разных, потом по кругу с самого давнего", r["first5"] == 5 and r["cycle"], str(r))
    check("G: одинаковых ответов подряд нет", r["alt"])
    check("G: постоянный генератор — не больше двенадцати проб на задание", r["constCalls"] <= 60, str(r["constCalls"]))
    check("G: постоянный ответ типа — задания разные, проб немного", r["constAnsUniq"] == 10 and r["constAnsCalls"] <= 170, str(r))
    check("G: avoid — задание с экрана не возвращается", r["avoid"])
    check("G: «похожие» по ключу страницы не повторяются, пока есть другие", r["shapes"] == 4, str(r["shapes"]))
    page.reload()
    page.wait_for_function("() => window.NoRepeat")
    check("G: история переживает перезагрузку (sessionStorage)", page.evaluate("() => NoRepeat._read('t:five').length") == r["stored"] == 10)
    check("G: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── H. телефон ───
def test_phone(browser):
    for url in ("oge8.html", "powers.html"):
        ctx, page, errors = open_page(browser, url=url, width=375, height=800)
        page.click('.mode-card[data-id="p1"]')
        page.wait_for_timeout(300)
        r = page.evaluate("""() => {
          const el = document.getElementById('hardToggle').getBoundingClientRect();
          const tabs = document.querySelector('#submodeRow .submode-tabs').getBoundingClientRect();
          const row = document.getElementById('submodeRow');
          return { below: el.top >= tabs.bottom - 1, inside: el.right <= window.innerWidth && el.left >= 0,
                   notClipped: row.scrollHeight <= row.clientHeight + 1, over: document.documentElement.scrollWidth - window.innerWidth };
        }""")
        check(f"H: {url} 375px — галочка под вкладками, видна целиком, без прокрутки вбок",
              r["below"] and r["inside"] and r["notClipped"] and r["over"] <= 0, str(r))
        page.click("#hardToggle")
        check(f"H: {url} 375px — нажимается", page.evaluate("() => hardCtl.get()"))
        check(f"H: {url} без ошибок JS", not errors, str(errors[:1]))
        ctx.close()


def run():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        test_toggle_ui(browser)
        test_generators(browser)
        test_norepeat_oge8(browser)
        test_session(browser)
        test_board(browser)
        test_other_trainers(browser)
        test_module(browser)
        test_phone(browser)
        browser.close()
    bad = [n for n, ok in results if not ok]
    print()
    if bad:
        print(f"ПРОВАЛЫ ({len(bad)} из {len(results)}):")
        for n in bad:
            print("  -", n)
        sys.exit(1)
    print(f"ИТОГ: всё прошло ({len(results)} проверок)")


if __name__ == "__main__":
    run()
