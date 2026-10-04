"""
Промпт №13 (новый список): тренажёр «Тригонометрические уравнения»
(10–11 класс) — trig_equations.html и trig-bank.js, плюс вынос движка
плиток с примером в общие tile-demo.js и tile-demo.css (логарифмы
переведены на них — их тест №12 должен остаться зелёным).

Проверяет:
  A. банк: у каждой из 27 плиток по 40 заданий, каждое проверено ЧИСЛЕННО
     своим кодом (numpy): корни верного ответа — это ровно все корни
     уравнения в окне (с учётом ОДЗ), на отрезке — ровно корни на отрезке,
     ответ-число — крайний корень; уравнение, которое видит ученик,
     обращается в ноль в корнях ответа; ни один неверный вариант не равен
     верному; вариантов четыре и все разные; задание — чистые данные, без
     undefined/NaN;
  B. экран плиток: пять плашек-уровней по порядку, в каждой свои плитки и
     «вперемешку» уровня; у плиток — название, формула в наборе, пример, у
     больших — рисунок; в каждой плашке нет дыр на 6 и на 4 колонки;
  C. анимации: в keyframes только transform и opacity; при открытии
     плитки выезжают по очереди и затихают; без наведения стоят; наведение
     поднимает плитку и запускает пример и рисунок; первый кадр примера
     «sin x = ½» — запись «откуда», через 0,9 с части в пути, последний —
     «x = (−1)ⁿ π/6 + πn»; после смены ширины тоже; сенсорный экран;
     «уменьшить движение» — ничего не движется, запись законченная;
  D. выбор: отметки из разных плашек, «Начать» — задания только по ним;
     адрес, перезагрузка, возврат к плиткам; соседний тип стрелкой;
     «вперемешку» уровня — все типы уровня, ?p=lvl2;
  E. режимы «Тренировка» и «Экзамен», решение по шагам, шпаргалка;
  F. каждая плитка решается через интерфейс; две ошибки — верный вариант
     показан, разбор открыт; ответ-число — две ошибки, число подставлено;
  H. карточки «+»; I. совместная сессия (заглушка Supabase из теста №54);
  J. «В подборку», главная (10 и 11 класс), доска: задание ложится живым
     (выбор и поле), «ещё такое же» — та же тренировка;
  K. телефон 375 и 320 px, планшет 768: без прокрутки вбок.

Живой realtime из песочницы не проверить — совместный режим перепроверяется
на сайте руками.

Запуск: python3 test_prompt13_trig_equations.py (сервер поднимается сам).
"""
import contextlib
import http.client
import json
import math
import os
import subprocess
import sys
import time

import numpy as np
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from test_prompt54_trainer_sync_and_cards import FAKE_LIB  # noqa: E402

PORT = 8975
BASE = f"http://127.0.0.1:{PORT}"
PAGE = "trig_equations.html"
results = []


def check(name, ok, extra=""):
    results.append((name, ok))
    print(f"[{'OK' if ok else 'FAIL'}] {name}" + (f": {extra}" if extra and not ok else ""))


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


def quiet(page):
    """Конспект урока снимает экран при каждой смене задания — в тесте их сотни."""
    page.evaluate("() => { if (window.TrainerSession && TrainerSession.setAutosaveHistory) TrainerSession.setAutosaveHistory(false); }")


def open_page(browser, width=1400, height=900, url=PAGE, reduced=None, fake=False, touch=False, settle=True):
    opts = {"viewport": {"width": width, "height": height}, "reduced_motion": reduced or "no-preference"}
    if touch:
        opts.update(has_touch=True, is_mobile=True)
    ctx = browser.new_context(**opts)
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    if fake:
        page.route("**/supabase-js.umd.js", lambda route: route.fulfill(status=200, content_type="application/javascript", body=FAKE_LIB))
        page.route("**/fonts.googleapis.com/**", lambda route: route.abort())
        page.route("**/fonts.gstatic.com/**", lambda route: route.abort())
    else:
        page.route("https://**/*", lambda route: route.abort())
    page.goto(f"{BASE}/{url}")
    page.wait_for_function("() => window.__trainerState && window.TRIG_BANK")
    # появление экрана плиток идёт ~1,5 с — дожидаемся, чтобы замеры были по месту
    page.wait_for_timeout(1900 if settle else 100)
    quiet(page)
    return ctx, page, errors


# ─── численная проверка задания (своя, не из банка) ───
NS = {"sin": np.sin, "cos": np.cos, "tan": np.tan, "cot": lambda v: np.cos(v) / np.sin(v), "sqrt": np.sqrt, "pi": np.pi}


def f_of(e):
    code = compile(e, "<expr>", "eval")

    def f(x):
        with np.errstate(all="ignore"):
            return eval(code, {"__builtins__": {}}, dict(NS, x=x))  # noqa: S307 — строки из своего банка
    return f


def one(f, x):
    return float(f(np.array([float(x)]))[0])


def ok_cond(conds, x):
    for c in conds:
        v = one(f_of(c["e"]), x)
        if not math.isfinite(v):
            return False
        if c["t"] == "ne" and abs(v) < 1e-7:
            return False
        if c["t"] == "ge" and v < -1e-9:
            return False
    return True


def numeric_roots(zero, conds, lo, hi, step=1.5e-4):
    """Все корни на [lo; hi]: смена знака (простые) и минимумы |f| около нуля
    (двойные, как у sin x = 1). Потом отсев по ОДЗ."""
    f = f_of(zero)
    xs = np.arange(lo, hi, step)
    y = f(xs)
    y = np.where(np.isfinite(y), y, np.nan)
    roots = []
    for i in np.where(y[:-1] * y[1:] < 0)[0]:
        a, b = xs[i], xs[i + 1]
        fa = one(f, a)
        for _ in range(60):
            m = (a + b) / 2
            fm = one(f, m)
            if fa * fm <= 0:
                b = m
            else:
                a, fa = m, fm
        roots.append((a + b) / 2)
    ay = np.abs(y)
    for i in np.where((ay[1:-1] <= ay[:-2]) & (ay[1:-1] <= ay[2:]) & (ay[1:-1] < 1e-6))[0] + 1:
        a, b = xs[i - 1], xs[i + 1]
        for _ in range(80):
            m1, m2 = a + (b - a) / 3, b - (b - a) / 3
            if abs(one(f, m1)) < abs(one(f, m2)):
                b = m2
            else:
                a = m1
        roots.append((a + b) / 2)
    roots = sorted(r for r in roots if abs(one(f, r)) < 1e-7 and ok_cond(conds, r))
    out = []
    for r in roots:
        if not out or abs(r - out[-1]) > 1e-5:
            out.append(r)
    return out


def expand(series, lo, hi):
    pts = []
    for s in series:
        A, C, P = s["a"], s["c"], s["p"]
        if A is None or not math.isfinite(A):
            return None
        n0 = math.floor((lo - C - abs(A)) / P) - 2
        n1 = math.ceil((hi - C + abs(A)) / P) + 2
        for n in range(n0, n1 + 1):
            if s["sg"] == "pm":
                vals = [C + A + P * n, C - A + P * n]
            elif s["sg"] == "alt":
                vals = [C + (A if n % 2 == 0 else -A) + P * n]
            else:
                vals = [C + A + P * n]
            pts += [v for v in vals if lo < v < hi]
    pts.sort()
    out = []
    for r in pts:
        if not out or abs(r - out[-1]) > 1e-5:
            out.append(r)
    return out


def same(a, b):
    return a is not None and b is not None and len(a) == len(b) and all(abs(x - y) < 1e-4 for x, y in zip(a, b))


WIN = (-30.3, 30.7)


def check_task(t):
    m, errs = t["meta"], []
    eqf = f_of(m["eq"])
    g = m["good"]
    if "num" in g:
        big = numeric_roots(m["zero"], m["cond"], -60.3, 60.7)
        pos = [r for r in big if r > 1e-9]
        neg = [r for r in big if r < -1e-9]
        want = g["num"]
        if not ((pos and abs(min(pos) - want) < 1e-6) or (neg and abs(max(neg) - want) < 1e-6)):
            errs.append(f"ответ {want} — не крайний корень")
        if abs(one(eqf, want)) > 1e-7:
            errs.append("уравнение не равно нулю в ответе")
        return errs

    def key(o):
        if "list" in o:
            return expand(o["list"], *WIN)
        return [r * math.pi for r in o["roots"]]
    if m.get("seg"):
        lo, hi = m["seg"][0] * math.pi, m["seg"][1] * math.pi
        num = [r for r in numeric_roots(m["zero"], m["cond"], lo - 0.01, hi + 0.01) if lo - 1e-7 <= r <= hi + 1e-7]
    else:
        num = numeric_roots(m["zero"], m["cond"], *WIN)
    gk = key(g)
    if not same(gk, num):
        errs.append(f"корни ответа {None if gk is None else [round(x, 3) for x in gk[:6]]} ≠ численным {[round(x, 3) for x in num[:6]]}")
    for x in gk or []:
        v = one(eqf, x)
        # √h при h = 0 численно даёт √(−0,0…1) = nan — это корень
        if not math.isfinite(v) and any(c["t"] == "ge" and abs(one(f_of(c["e"]), x)) < 1e-9 for c in m["cond"]):
            continue
        if not abs(v) < 1e-6:
            errs.append(f"уравнение не обращается в ноль в корне {x:.4f}")
            break
    for i, o in enumerate(t["optData"]):
        if i != t["choice"]["correct"] and same(key(o), gk):
            errs.append(f"неверный вариант {i} равен верному")
    if len(t["choice"]["opts"]) != 4 or len(set(t["choice"]["opts"])) != 4:
        errs.append("вариантов не четыре разных")
    return errs


# ─── A. банк ───
def test_bank(browser):
    ctx, page, errors = open_page(browser, settle=False)
    res = page.evaluate("""() => {
      const out = [], bad = [];
      for (const tile of TRIG_BANK.tiles) for (let i = 0; i < 40; i++) {
        let t;
        try { t = TRIG_BANK.generate([tile.id]); } catch (e) { bad.push(tile.id + ': исключение ' + e.message); break; }
        if (t.pid !== tile.id || t.lvl !== tile.lvl || !t.key) bad.push(tile.id + ': pid/lvl/key');
        if (JSON.stringify(t) !== JSON.stringify(JSON.parse(JSON.stringify(t)))) bad.push(tile.id + ': не данные');
        if (/undefined|NaN|Infinity/.test(t.text + t.steps.join('') + t.answer + (t.choice ? t.choice.opts.join('') : ''))) bad.push(tile.id + ': undefined/NaN');
        if (!t.steps.length) bad.push(tile.id + ': нет решения');
        if (t.fields) t.fields.forEach(f => { if (checkField(f, fieldShown(f)) !== true) bad.push(tile.id + ': эталон не принят ' + f.value); });
        out.push(t);
      }
      return { tasks: out, bad: [...new Set(bad)], tiles: TRIG_BANK.tiles.length,
               levels: TRIG_BANK.levels.map(l => TRIG_BANK.tiles.filter(t => t.lvl === l.id).length) };
    }""")
    check("A: 27 плиток в пяти уровнях (7, 6, 7, 3, 4)", res["tiles"] == 27 and res["levels"] == [7, 6, 7, 3, 4], str(res["levels"]))
    check("A: задания — данные, с решением, без undefined/NaN, эталон ответа принимается", not res["bad"], "; ".join(res["bad"][:4]))
    bad = {}
    kinds = {"choice": 0, "calc": 0}
    for t in res["tasks"]:
        kinds[t["kind"]] += 1
        e = check_task(t) if t["kind"] == "choice" or "num" in t["meta"]["good"] else ["?"]
        if e:
            bad.setdefault(t["pid"], []).append(t["peek"] + ": " + e[0])
    check(f"A: {len(res['tasks'])} заданий — ответ совпадает с численными корнями уравнения, неверные варианты не равны верному",
          not bad, "; ".join(f"{k}: {v[0]}" for k, v in list(bad.items())[:4]))
    check("A: есть и выбор серии, и ответ-число (формат ЕГЭ)", kinds["choice"] > 900 and kinds["calc"] >= 40, str(kinds))
    mix = page.evaluate("""() => { const ids = TRIG_BANK.tiles.filter(t => t.lvl === 3).map(t => t.id); const seq = []; for (let i = 0; i < 300; i++) seq.push(TRIG_BANK.generate(ids).pid);
        return { n: new Set(seq).size, want: ids.length, repeats: seq.filter((p, i) => i && p === seq[i - 1]).length }; }""")
    check("A: вперемешку — все типы, один и тот же подряд не идёт", mix["n"] == mix["want"] and mix["repeats"] == 0, str(mix))
    check("A: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── B, C. плашки, плитки, анимации ───
HOLES_JS = """() => {
  // каждая клетка сетки плашки должна лежать внутри какой-нибудь плитки
  return [...document.querySelectorAll('#levels .tiles')].map(g => {
    const box = g.getBoundingClientRect(), cs = getComputedStyle(g);
    const cols = cs.gridTemplateColumns.split(' ').length, gap = parseFloat(cs.columnGap) || 0;
    const rowH = parseFloat(cs.gridAutoRows), rgap = parseFloat(cs.rowGap) || 0;
    const rows = Math.round((box.height + rgap) / (rowH + rgap));
    const cw = (box.width - gap * (cols - 1)) / cols;
    const rects = [...g.children].map(t => t.getBoundingClientRect());
    let holes = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = box.left + c * (cw + gap) + cw / 2, y = box.top + r * (rowH + rgap) + rowH / 2;
      if (!rects.some(q => x > q.left && x < q.right && y > q.top && y < q.bottom)) holes++;
    }
    return { lvl: g.dataset.lvl, cols, rows, holes };
  });
}"""

SIN_FRAME_JS = """(t) => {
  const tile = document.querySelector('.tile[data-pid="sin"]');
  tile.getAnimations({ subtree: true }).forEach(a => { a.pause(); a.currentTime = t; });
  const vis = sel => [...tile.querySelectorAll('.demo ' + sel)].find(e => +getComputedStyle(e).opacity > 0.5);
  const x = sel => { const e = vis(sel); return e ? e.getBoundingClientRect().left : null; };
  const ghost = txt => { const e = [...tile.querySelectorAll('.demo .ghost')].find(g => g.textContent.replace(/\\s/g, '') === txt); return e ? { x: e.getBoundingClientRect().left, o: +getComputedStyle(e).opacity } : null; };
  const op = sel => +getComputedStyle(tile.querySelector('.demo ' + sel)).opacity;
  const spin = tile.querySelector('.viz .spin');
  return { x: x('[data-k="x"]'), eq: x('[data-k="eq"]'), a: x('[data-k="a"]'), f: ghost('sin'), v: ghost('12'),
           s: op('[data-k="s"]'), res: op('[data-k="res"]'), ang: new DOMMatrix(getComputedStyle(spin).transform).b };
}"""


def sin_frames(page):
    page.mouse.move(5, 5)
    loc = page.locator('.tile[data-pid="sin"]')
    loc.scroll_into_view_if_needed()
    page.wait_for_timeout(300)
    box = loc.bounding_box()
    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + 40)
    page.wait_for_timeout(400)
    start = page.evaluate(f"({SIN_FRAME_JS})(300)")
    mid = page.evaluate(f"({SIN_FRAME_JS})(900)")
    end = page.evaluate(f"({SIN_FRAME_JS})(4000)")
    # начало: «sin x = ½» — sin слева от x, ½ справа от «=», (−1)ⁿ и итог не видны, луч не повёрнут
    ok_start = (start["f"] and start["v"] and start["f"]["o"] > 0.9 and start["f"]["x"] < start["x"] < start["eq"] < start["v"]["x"]
                and start["s"] < 0.1 and start["res"] < 0.1 and abs(start["ang"]) < 0.02)
    moving = abs(mid["x"] - start["x"]) > 1 and abs(mid["x"] - end["x"]) > 1
    # конец: «x = (−1)ⁿ π/6 + πn», sin и ½ растаяли, луч на π/6 (sin 30° = 0,5 → b = −0,5)
    ok_end = (end["f"]["o"] < 0.05 and end["v"]["o"] < 0.05 and end["x"] < end["eq"] < end["a"] and end["s"] > 0.9 and end["res"] > 0.9
              and abs(end["ang"] + 0.5) < 0.02)
    return ok_start and moving, ok_end, start, mid, end


def test_tiles(browser):
    # появление: сразу после открытия плитки выезжают, потом всё стоит
    ctx, page, errors = open_page(browser, 1400, 900, settle=False)
    entering = page.evaluate("() => document.getElementById('levels').getAnimations({ subtree: true }).filter(a => a.animationName === 'tileIn' && a.playState === 'running').length")
    page.wait_for_timeout(2000)
    idle = page.evaluate("() => document.getElementById('levels').getAnimations({ subtree: true }).filter(a => a.playState === 'running').length")
    check("C: при открытии плитки выезжают по очереди, потом всё стоит", entering >= 10 and idle == 0, f"{entering} {idle}")
    info = page.evaluate("""() => {
      const lv = [...document.querySelectorAll('#levels .lvl')];
      return { levels: lv.map(l => l.querySelector('.lvl-title').textContent),
        nums: lv.map(l => l.querySelector('.lvl-num').textContent).join(''),
        tiles: lv.map(l => l.querySelectorAll('.tile:not(.mix)').length), mix: lv.map(l => l.querySelectorAll('.tile.mix').length),
        full: [...document.querySelectorAll('#levels .tile:not(.mix)')].every(t => t.querySelector('.tile-title').textContent.trim() && t.querySelector('.tile-formula .f1').innerHTML.trim() && t.querySelector('.demo .demo-line')),
        typeset: document.querySelectorAll('#levels .tile-formula .fn').length, fracs: document.querySelectorAll('#levels .tile-formula .frac').length,
        viz: [...document.querySelectorAll('#levels .tile.l')].every(t => t.querySelector('.viz svg')), big: document.querySelectorAll('#levels .tile.l').length,
        width: document.querySelector('#levels .tiles').getBoundingClientRect().width };
    }""")
    check("B: пять плашек-уровней по порядку, от простейших до №14", info["nums"] == "12345" and info["levels"][0] == "Простейшие уравнения" and "14" in info["levels"][4], str(info["levels"]))
    check("B: в плашках 7, 6, 7, 3, 4 плиток и по одной «вперемешку»", info["tiles"] == [7, 6, 7, 3, 4] and info["mix"] == [1] * 5, str(info))
    check("B: у каждой плитки — название, формула в наборе (sin, дроби вертикально) и пример", info["full"] and info["typeset"] >= 25 and info["fracs"] >= 8, str(info))
    check("B: у больших плиток — рисунок (окружность, числовая прямая)", info["big"] == 8 and info["viz"], str(info))
    holes = page.evaluate(HOLES_JS)
    check("B: 6 колонок во всю ширину, ни в одной плашке нет дыр", all(h["cols"] == 6 and h["holes"] == 0 for h in holes) and info["width"] > 1100, str(holes))

    props = page.evaluate("""() => {
      const out = new Set(), names = new Set(['tileIn', 'headIn', 'vzSpin', 'vzPulse', 'vzFade', 'vzSlide', 'dmMove', 'dmIn', 'dmLate', 'dmOut', 'dmLine', 'mixCycle']);
      for (const sh of document.styleSheets) { let rules; try { rules = sh.cssRules; } catch (e) { continue; }
        const walk = rs => { for (const r of rs) { if (r.type === 7 && names.has(r.name)) for (const k of r.cssRules) for (let i = 0; i < k.style.length; i++) out.add(k.style[i]); if (r.cssRules && r.type !== 7) walk(r.cssRules); } };
        walk(rules); }
      return [...out];
    }""")
    check("C: анимации плиток, рисунков и появления — только transform и opacity", props and set(props) <= {"transform", "opacity"}, str(props))
    ok_start, ok_end, start, mid, end = sin_frames(page)
    lifted = page.evaluate("() => new DOMMatrix(getComputedStyle(document.querySelector('.tile[data-pid=\"sin\"]')).transform).m42")
    running = page.evaluate("() => document.querySelector('.tile[data-pid=\"sin\"]').getAnimations({ subtree: true }).map(a => a.animationName)")
    check("C: наведение поднимает плитку, запускает пример и рисунок", lifted < -3 and "dmMove" in running and "vzSpin" in running and "vzPulse" in running, f"{lifted} {running}")
    check("C: начало примера — «sin x = ½», через 0,9 с части уже в пути", ok_start, f"{start} / {mid}")
    check("C: конец — «x = (−1)ⁿ π/6 + πn», луч повернулся на π/6", ok_end, str(end))
    dur = page.evaluate("() => getComputedStyle(document.querySelector('.tile[data-pid=sin] .demo .mvk')).animationDuration")
    check("C: цикл примера 4,5 с — как в стандарте плиток", dur == "4.5s", dur)
    page.set_viewport_size({"width": 1100, "height": 900})
    page.wait_for_timeout(600)
    holes = page.evaluate(HOLES_JS)
    check("B: на 1100 px — 4 колонки, ни в одной плашке нет дыр", all(h["cols"] == 4 and h["holes"] == 0 for h in holes), str(holes))
    ok_start2, _, start2, mid2, _ = sin_frames(page)
    check("C: после смены ширины окна пример начинается верно", ok_start2, f"{start2} / {mid2}")
    page.set_viewport_size({"width": 740, "height": 900})
    page.wait_for_timeout(400)
    holes = page.evaluate(HOLES_JS)
    check("B: на 740 px — 2 колонки без дыр", all(h["cols"] == 2 and h["holes"] == 0 for h in holes), str(holes))
    page.set_viewport_size({"width": 1400, "height": 900})
    page.mouse.move(5, 5)
    page.click('.tile.mix[data-lvl="1"]')
    page.wait_for_timeout(1200)
    n_task = page.evaluate("() => document.getElementById('levels').getAnimations({ subtree: true }).filter(a => a.playState === 'running').length")
    check("C: на экране задания анимации плиток не идут", n_task == 0, str(n_task))
    page.click("#backBtn")
    page.wait_for_timeout(150)
    again = page.evaluate("() => document.getElementById('levels').getAnimations({ subtree: true }).filter(a => a.animationName === 'tileIn').length")
    check("C: при возврате к плиткам они снова выезжают", again >= 10, str(again))
    check("B, C: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    # сенсорный экран: у видимых плиток пример и рисунок идут сами, за экраном — пауза
    ctx, page, errors = open_page(browser, 400, 700, touch=True)
    st = page.evaluate("""() => {
      const tiles = [...document.querySelectorAll('#levels .tile')];
      const inView = t => { const r = t.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
      const run = t => t.getAnimations({ subtree: true }).some(a => a.playState === 'running');
      const vis = tiles.filter(inView), off = tiles.filter(t => t.getBoundingClientRect().top > innerHeight + 200);
      return { vis: vis.length, visRun: vis.filter(run).length, off: off.length, offRun: off.filter(run).length };
    }""")
    check("C: сенсорный экран — примеры идут у видимых плиток, за экраном на паузе", st["vis"] >= 1 and st["visRun"] >= st["vis"] - 1 and st["off"] >= 5 and st["offRun"] == 0, str(st))
    ctx.close()

    # «уменьшить движение»
    ctx, page, errors = open_page(browser, 1400, 900, reduced="reduce", settle=False)
    entering = page.evaluate("() => document.getElementById('levels').getAnimations({ subtree: true }).length")
    box = page.locator('.tile[data-pid="sin"]').bounding_box()
    page.mouse.move(box["x"] + 60, box["y"] + 40)
    page.wait_for_timeout(300)
    r = page.evaluate("""() => { const t = document.querySelector('.tile[data-pid="sin"]');
      return { anims: document.getElementById('levels').getAnimations({ subtree: true }).length, tf: getComputedStyle(t).transform,
        res: getComputedStyle(t.querySelector('.demo [data-k="res"]')).opacity, s: getComputedStyle(t.querySelector('.demo [data-k="s"]')).opacity,
        ghost: Math.max(...[...t.querySelectorAll('.demo .ghost')].map(g => +getComputedStyle(g).opacity)),
        pts: [...t.querySelectorAll('.viz .pulse')].every(p => getComputedStyle(p).opacity === '1') }; }""")
    check("C: «уменьшить движение» — ни одной анимации (и при открытии), пример и рисунок законченные",
          entering == 0 and r["anims"] == 0 and r["tf"] == "none" and r["res"] == "1" and r["s"] == "1" and r["ghost"] == 0 and r["pts"], f"{entering} {r}")
    ctx.close()


# ─── D, E. выбор и режимы ───
def test_select_and_modes(browser):
    ctx, page, errors = open_page(browser, 1300, 1000)
    page.evaluate("() => { try { Object.keys(localStorage).filter(k => k.startsWith('ogeProg:trig_equations')).forEach(k => localStorage.removeItem(k)); } catch (e) {} }")
    page.reload()
    page.wait_for_function("() => window.__trainerState")
    page.wait_for_timeout(1800)
    quiet(page)
    check("D: без выбора «Начать» неактивна", page.evaluate("() => document.getElementById('pkStart').disabled"))
    for pid in ("sin", "fac", "frac", "tg", "tg"):
        page.click(f'.tile[data-pid="{pid}"]')
    s = page.evaluate("""() => ({ sel: S.sel, cls: [...document.querySelectorAll('.tile.sel')].map(t => t.dataset.pid),
        pressed: document.querySelector('.tile[data-pid="fac"]').getAttribute('aria-pressed'), bar: document.getElementById('pkBarInfo').textContent,
        dis: document.getElementById('pkStart').disabled })""")
    check("D: плитки из разных плашек отмечаются и снимаются", s["sel"] == ["sin", "fac", "frac"] and s["cls"] == ["sin", "fac", "frac"] and s["pressed"] == "true" and not s["dis"], str(s))
    check("D: панель показывает выбранное", "3 типа" in s["bar"] and "Разложение на множители" in s["bar"], s["bar"])
    page.click("#pkStart")
    page.wait_for_timeout(200)
    r = page.evaluate("""() => { const pids = new Set([S.task.pid]); for (let i = 0; i < 60; i++) { newTask(); pids.add(S.task.pid); }
        return { screen: S.screen, pids: [...pids].sort(), url: location.search, title: document.getElementById('taskTitle').textContent,
                 chips: document.querySelectorAll('#runChips .run-chip').length }; }""")
    check("D: задания только по отмеченным, все встречаются", r["screen"] == "task" and r["pids"] == ["fac", "frac", "sin"] and ("p=sin%2Cfac%2Cfrac" in r["url"] or "p=sin,fac,frac" in r["url"]), str(r))
    check("D: в шапке — «вперемешку» и метки типов", "Вперемешку" in r["title"] and r["chips"] == 3, str(r))
    page.reload()
    page.wait_for_function("() => window.__trainerState")
    quiet(page)
    check("D: после перезагрузки — та же тренировка", page.evaluate("() => S.screen === 'task' && S.props.join() === 'sin,fac,frac'"))
    page.click("#backBtn")
    page.wait_for_timeout(1700)
    check("D: назад к плиткам — выбор сохранён", page.evaluate("() => S.screen === 'picker' && S.sel.join() === 'sin,fac,frac' && document.querySelectorAll('.tile.sel').length === 3"))
    page.click("#pkClear")
    page.click('.tile[data-pid="kx"]')
    page.click("#pkStart")
    one = page.evaluate("() => { const p = new Set(); for (let i = 0; i < 20; i++) { newTask(); p.add(S.task.pid); } return { p: [...p], title: document.getElementById('taskTitle').textContent, nav: document.getElementById('nextProtoBtn').offsetParent !== null, sub: document.getElementById('pageSub').textContent }; }")
    check("D: один тип — только он, соседние типы стрелками, в подписи уровень", one["p"] == ["kx"] and one["title"] == "Аргумент kx" and one["nav"] and "уровень 2" in one["sub"], str(one))
    page.click("#nextProtoBtn")
    check("D: «Следующий ▶» — следующий тип", page.evaluate("() => S.props.join() === 'xk'"))
    page.click("#backBtn")
    page.wait_for_timeout(1700)
    page.click('.tile.mix[data-lvl="2"]')
    allp = page.evaluate("() => { const p = new Set([S.task.pid]); for (let i = 0; i < 120; i++) { newTask(); p.add(S.task.pid); } return { n: p.size, props: S.props.length, url: location.search, title: document.getElementById('taskTitle').textContent, sel: S.sel.join() }; }")
    check("D: «вперемешку» уровня 2 — все шесть типов уровня, ?p=lvl2, выбор на плитках не тронут", allp["n"] == 6 and allp["props"] == 6 and "p=lvl2" in allp["url"] and allp["title"] == "Уровень 2 вперемешку" and allp["sel"] == "xk", str(allp))

    vis = lambda sel: page.evaluate(f"() => {{ const e = document.querySelector('{sel}'); return !!e && e.offsetParent !== null; }}")
    tabs = page.evaluate("() => [...document.querySelectorAll('.submode-tab')].map(b => b.textContent.trim())")
    check("E: ровно два режима — Тренировка и Экзамен", tabs == ["Тренировка", "Экзамен"], str(tabs))
    check("E: в «Тренировке» есть «Показать решение и ответ» и шпаргалка", vis("#showSolutionBtn") and vis("#refBtn"))
    page.click("#showSolutionBtn")
    steps = page.evaluate("() => ({ n: document.querySelectorAll('#solSteps .sol-step').length, ans: document.getElementById('solAnswer').textContent })")
    check("E: решение по шагам и ответ", vis("#mainPanel") and steps["n"] >= 1 and "Ответ" in steps["ans"], str(steps))
    page.click("#refBtn")
    check("E: шпаргалка — формулы всех типов тренировки", page.evaluate("() => document.querySelectorAll('#propRef .prop-ref-item').length") == 6 and vis("#propRef"))
    page.click("#tabExam")
    page.wait_for_timeout(100)
    check("E: в «Экзамене» нет кнопки решения, шпаргалки, решение закрыто", not vis("#showSolutionBtn") and not vis("#mainPanel") and not vis("#propRef") and not vis("#refBtn"))
    check("E: интерфейс тот же — условие и ответ", vis("#trigQuestion") and (vis("#answerArea .check-btn") or vis("#trigQuestion .mcq-btn")))
    check("D, E: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── F. решение через интерфейс ───
SOLVE_JS = """(idx) => {
  const t = idx >= 0 ? S.cards[idx].task : S.task;
  const q = idx >= 0 ? document.querySelector('.added-task-card[data-idx="' + idx + '"] .added-card-question') : document.getElementById('trigQuestion');
  const a = idx >= 0 ? document.querySelector('.added-task-card[data-idx="' + idx + '"] .answer-area') : document.getElementById('answerArea');
  if (t.choice) { q.querySelector('.mcq-btn[data-i="' + t.choice.correct + '"]').click(); return 'choice'; }
  t.fields.forEach(f => { const i = a.querySelector('input[data-fid="' + f.id + '"]'); i.value = fieldShown(f); i.dispatchEvent(new Event('input', {bubbles:true})); });
  a.querySelector('.check-btn').click();
  return 'fields';
}"""
WRONG_JS = """(idx) => {
  const t = idx >= 0 ? S.cards[idx].task : S.task;
  const q = idx >= 0 ? document.querySelector('.added-task-card[data-idx="' + idx + '"] .added-card-question') : document.getElementById('trigQuestion');
  const a = idx >= 0 ? document.querySelector('.added-task-card[data-idx="' + idx + '"] .answer-area') : document.getElementById('answerArea');
  if (t.choice) { const w = (t.choice.correct + 1 + (S.wrong || []).length) % t.choice.opts.length; q.querySelector('.mcq-btn[data-i="' + w + '"]').click(); return; }
  t.fields.forEach(f => { const i = a.querySelector('input[data-fid="' + f.id + '"]'); i.value = String(Math.round(valueOf(f.value) * 7 + 13)); });
  a.querySelector('.check-btn').click();
}"""


def test_solve(browser):
    ctx, page, errors = open_page(browser, 1300, 1000)
    fails = page.evaluate("""(SOLVE) => {
      const solve = eval(SOLVE); const out = [];
      for (const tile of TRIG_BANK.tiles) for (let k = 0; k < 3; k++) {
        startRun([tile.id]);
        const before = totalSolved;
        solve(-1);
        if (!(S.answered && S.correct && totalSolved === before + 1)) out.push(tile.id + ': ' + S.task.peek);
      }
      return out;
    }""", SOLVE_JS)
    check("F: все 27 типов решаются верным ответом через интерфейс", not fails, "; ".join(fails[:4]))
    page.evaluate("() => startRun(['cos'])")
    e0 = page.evaluate("() => totalErrors")
    page.evaluate(f"({WRONG_JS})(-1)")
    s1 = page.evaluate("() => ({ a: S.answered, w: S.hadWrong, bad: document.querySelectorAll('#trigQuestion .mcq-btn.bad').length })")
    page.evaluate(f"({WRONG_JS})(-1)")
    s2 = page.evaluate("() => ({ a: S.answered, c: S.correct, bad: document.querySelectorAll('#trigQuestion .mcq-btn.bad').length, fixed: document.querySelectorAll('#trigQuestion .mcq-btn.fixed').length, sol: document.getElementById('mainPanel').offsetParent !== null, e: totalErrors })")
    check("F: первая ошибка — вариант красным, можно выбрать ещё", not s1["a"] and s1["w"] and s1["bad"] == 1, str(s1))
    check("F: вторая — верный вариант показан, разбор открыт", s2["a"] and not s2["c"] and s2["bad"] == 2 and s2["fixed"] == 1 and s2["sol"] and s2["e"] == e0 + 2, str(s2))
    page.evaluate("() => startRun(['egeArg'])")
    page.evaluate(f"({WRONG_JS})(-1)")
    page.evaluate(f"({WRONG_JS})(-1)")
    f2 = page.evaluate("() => ({ a: S.answered, fixed: !!document.querySelector('#answerArea .answer-input.fixed'), val: document.querySelector('#answerArea .answer-input').value, want: fieldShown(S.task.fields[0]) })")
    check("F: ответ-число (ЕГЭ) — после двух ошибок число подставлено", f2["a"] and f2["fixed"] and f2["val"] == f2["want"], str(f2))
    r = page.evaluate("""() => { const f = { id: 'a', value: '-4' }; return [checkField(f, '−4'), checkField(f, '-4'), checkField(f, '4'), checkField(f, '')]; }""")
    check("F: ответ-число: «−4» и «-4» верно, «4» — ошибка, пусто — просьба", r[0] is True and r[1] is True and r[2] is False and isinstance(r[3], str), str(r))
    page.evaluate("() => { startRun(['quad']); }")
    page.evaluate(f"({SOLVE_JS})(-1)")
    badge = None
    page.click("#backBtn")
    page.wait_for_timeout(300)
    badge = page.evaluate("() => document.querySelector('.tile[data-pid=\"quad\"] .tile-badges').textContent")
    check("F: на плитке — сколько решено", "✓" in badge, badge)
    check("F: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── H. карточки «+» ───
def test_cards(browser):
    ctx, page, errors = open_page(browser, 1300, 1000)
    page.evaluate("() => startRun(['tg', 'hom'])")
    page.click("#addRailToggle")
    page.click('.add-qty-btn[data-n="3"]')
    page.wait_for_timeout(200)
    c = page.evaluate("() => ({ n: S.cards.length, same: S.cards.every(c => ['tg', 'hom'].indexOf(c.task.pid) >= 0), keys: new Set([S.task.key].concat(S.cards.map(c => c.task.key))).size, dom: document.querySelectorAll('.added-task-card').length })")
    check("H: «+3» — три карточки той же тренировки", c["n"] == 3 and c["same"] and c["keys"] == 4 and c["dom"] == 3, str(c))
    s0 = page.evaluate("() => totalSolved")
    page.evaluate(f"({SOLVE_JS})(1)")
    cs = page.evaluate("() => ({ a: S.cards[1].answered, ok: S.cards[1].correct, sol: getComputedStyle(document.querySelector('.added-task-card[data-idx=\"1\"] .added-explain')).display, st: tsGetState().cards[1].answered, solved: totalSolved })")
    check("H: карточка решается, открывает разбор и попадает в снимок", cs["a"] and cs["ok"] and cs["sol"] == "block" and cs["st"] and cs["solved"] == s0 + 1, str(cs))
    check("H: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── I. совместная сессия ───
def test_session(browser):
    ctx = browser.new_context(viewport={"width": 1300, "height": 1000})
    errors = []

    def mk(url):
        page = ctx.new_page()
        page.add_init_script("try { localStorage.setItem('tsStage:direct', '1'); } catch (e) {}")
        page.route("**/supabase-js.umd.js", lambda route: route.fulfill(status=200, content_type="application/javascript", body=FAKE_LIB))
        page.route("**/fonts.googleapis.com/**", lambda route: route.abort())
        page.route("**/fonts.gstatic.com/**", lambda route: route.abort())
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"{BASE}/{url}")
        page.wait_for_function("() => window.__trainerState")
        return page

    teacher = mk(PAGE)
    teacher.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()", timeout=10000)
    code = teacher.evaluate("() => window.TrainerSession.getCode()")
    student = mk(f"{PAGE}?s={code}")
    student.wait_for_timeout(1800)
    check("I: ученик на экране плиток вместе с учителем", student.evaluate("() => S.screen") == "picker")
    teacher.click('.tile[data-pid="shift"]')
    teacher.click('.tile[data-pid="egeArg"]')
    teacher.wait_for_timeout(1000)
    check("I: отметки плиток учителя видны у ученика", student.evaluate("() => [...document.querySelectorAll('.tile.sel')].map(t => t.dataset.pid).join()") == "shift,egeArg")
    teacher.click("#pkStart")
    teacher.evaluate("() => { let i = 0; while (S.task.kind === 'choice' && i++ < 50) newTask(); }")
    teacher.wait_for_timeout(1200)
    same = lambda: student.evaluate("() => S.task && S.task.key") == teacher.evaluate("() => S.task.key")
    check("I: у ученика та же тренировка и то же задание", student.evaluate("() => S.screen === 'task' && S.props.join() === 'shift,egeArg'") and same()
          and student.inner_text("#trigQuestion") == teacher.inner_text("#trigQuestion"))
    teacher.fill("#answerArea input", "17")
    teacher.wait_for_timeout(900)
    check("I: набранное учителем видно у ученика", student.input_value("#answerArea input") == "17")
    right = student.evaluate("() => fieldShown(S.task.fields[0])")
    student.fill("#answerArea input", right)
    student.click("#answerArea .check-btn")
    teacher.wait_for_timeout(1200)
    check("I: верный ответ ученика доехал до учителя и не откатился",
          teacher.evaluate("() => S.answered && S.correct") and student.evaluate("() => S.answered && S.correct"))
    teacher.click("#tabExam")
    teacher.click("#nextBtn")
    teacher.evaluate("() => { let i = 0; while (!S.task.choice && i++ < 50) newTask(); }")
    teacher.wait_for_timeout(1200)
    check("I: новое задание и режим доехали", same() and student.evaluate("() => S.mode === 'exam' && !!S.task.choice"))
    student.evaluate(f"({SOLVE_JS})(-1)")
    teacher.wait_for_timeout(1200)
    check("I: выбор варианта учеником виден у учителя", teacher.evaluate("() => S.answered && S.correct && !!document.querySelector('#trigQuestion .mcq-btn.good')"))
    teacher.click("#backBtn")
    teacher.wait_for_timeout(1000)
    check("I: учитель вернулся к плиткам — ученик тоже", student.evaluate("() => S.screen === 'picker' && document.getElementById('pickerArea').offsetParent !== null"))
    check("I: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── J. подборка, главная, доска ───
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
FRAME = "document.getElementById('bdTrainersIframe')"


def test_platform(browser):
    ctx, page, errors = open_page(browser)
    page.evaluate("() => { Basket.clear(); startRun(['sin']); }")
    page.click("#basketAddBtn")
    it = page.evaluate("() => Basket.all().slice(-1)[0]")
    check("J: «В подборку» — задание с уровнем и типом, варианты списком", it and it["trainerId"] == "trig_equations" and it["modeTitle"] == "Уровень 1 · sin x = a"
          and "sin" in it["text"] and "<button" not in it["html"], str(it)[:200])
    page.evaluate("() => Basket.clear()")
    ctx.close()

    ctx = browser.new_context(viewport={"width": 1200, "height": 900})
    page = ctx.new_page()
    page.route("https://**/*", lambda r: r.abort())
    page.goto(f"{BASE}/index.html")
    links = {}
    for sub in ("g10", "g11"):
        page.click('.nav-tab[data-id="grades"]')
        page.click(f'.nav-subtab[data-id="{sub}"]')
        page.wait_for_timeout(100)
        links[sub] = page.evaluate("() => [...document.querySelectorAll('.topic')].map(t => [(t.querySelector('.section-title') || {}).textContent, t.querySelector('a').getAttribute('href')])")
    check("J: на главной в 10 и 11 классе — «Тригонометрия» первой, потом «Логарифмы»",
          all(links[s][:2] == [["Тригонометрия", PAGE], ["Логарифмы", "logarithms.html"]] for s in links), str(links))
    ctx.close()

    ctx = browser.new_context(viewport={"width": 1400, "height": 900})
    page = ctx.new_page()
    berr = []
    page.on("pageerror", lambda e: berr.append(str(e)))
    page.route("https://**/*", lambda r: r.abort())
    page.goto(f"{BASE}/boards.html")
    page.evaluate(SEED_JS, [[LITE], {"bA": {"objects": [], "imageLib": []}}])
    page.reload()
    page.evaluate(BOOT_JS)
    page.wait_for_function("() => window.getDB && window.getDB().boards.length >= 1")
    page.evaluate("() => window.openBoard('bA')")
    page.wait_for_function("() => window.getCurrentBoard() && Array.isArray(window.getCurrentBoard().objects)")
    page.evaluate("() => { document.getElementById('bdTrainersPanel').classList.add('open'); }")
    inlist = page.evaluate(f"() => [...document.querySelectorAll('.bd-trainers-item')].some(b => b.dataset.id === 'trig_equations' && b.dataset.href === '{PAGE}')")
    check("J: «Тригонометрические уравнения» в панели тренажёров на доске", inlist)
    page.evaluate(f"() => openTrainerInPanel('trig_equations', '{PAGE}', 'Тригонометрические уравнения')")
    page.wait_for_function(f"""() => {{ try {{ const f = {FRAME}; return f.contentDocument.readyState === 'complete' && typeof f.contentWindow.tsGetState === 'function'; }} catch (e) {{ return false; }} }}""", timeout=20000)
    page.wait_for_timeout(500)

    def add(prep):
        n = page.evaluate("() => getCurrentBoard().objects.length")
        page.evaluate(f"() => {FRAME}.contentWindow.eval({json.dumps(prep)})")
        page.wait_for_timeout(500)
        page.evaluate("() => document.getElementById('bdTrainersAddBtn').click()")
        page.wait_for_function(f"() => getCurrentBoard().objects.length > {n}", timeout=30000)
        page.wait_for_timeout(300)
        return page.evaluate("() => JSON.parse(JSON.stringify(getCurrentBoard().objects.slice(-1)[0], (k, v) => k === 'src' ? '…' : v))")

    o = add("startRun(['egeArg']); (function(){ let i = 0; while (!(S.task.fields && +S.task.fields[0].value < 0) && i++ < 200) newTask(); })()")
    want = page.evaluate(f"() => {FRAME}.contentWindow.eval('S.task.fields[0].value')")
    check("J: задание с ответом-числом легло на доску живым полем", bool(o.get("task")) and o["task"]["kind"] == "fields" and o["task"]["fields"][0]["value"] == want, str(o.get("task"))[:200])
    page.evaluate("() => { document.getElementById('bdTrainersPanel').classList.remove('open'); boardsRedraw(); }")
    page.wait_for_timeout(300)
    sel = f'.bd-task[data-id="{o["id"]}"]'
    page.locator(f"{sel} .bd-task-in").first.fill(want.replace("-", "−"))
    page.click(f"{sel} .bd-task-btn")
    page.wait_for_timeout(300)
    st = page.evaluate(f"() => getCurrentBoard().objects.find(x => x.id === {json.dumps(o['id'])}).task.st")
    check("J: на доске ответ «" + want.replace("-", "−") + "» принят", bool(st) and st.get("res") == "ok", str(st))
    page.evaluate("() => document.getElementById('bdTrainersPanel').classList.add('open')")
    o3 = add("startRun(['quad', 'red']);")
    check("J: выбор серии лёг с живыми вариантами", o3.get("task") and o3["task"]["kind"] == "choice" and o3["task"]["n"] == 4 and len(o3["task"]["hot"]["opts"]) == 4, str(o3.get("task"))[:200])
    check("J: у задания запомнено, как сделать ещё такое же", o3.get("gen") and o3["gen"]["kind"] == "state" and o3["gen"]["snap"].get("props") == ["quad", "red"], str(o3.get("gen"))[:200])
    page.evaluate("() => { document.getElementById('bdTrainersPanel').classList.remove('open'); boardsRedraw(); }")
    page.wait_for_timeout(300)
    n = page.evaluate("() => getCurrentBoard().objects.length")
    s3 = f'.bd-task[data-id="{o3["id"]}"]'
    page.evaluate(f"() => document.querySelector('{s3} .bd-task-more').click()")
    page.wait_for_timeout(150)
    page.evaluate(f"() => document.querySelector('{s3} .bd-task-dirs button[data-dir=\"down\"]').click()")
    page.wait_for_function(f"() => getCurrentBoard().objects.length > {n}", timeout=40000)
    page.wait_for_timeout(300)
    o4 = page.evaluate("() => JSON.parse(JSON.stringify(getCurrentBoard().objects.slice(-1)[0], (k, v) => k === 'src' ? '…' : v))")
    check("J: «ещё такое же» — та же тренировка", o4.get("gen") and o4["gen"]["snap"]["props"] == ["quad", "red"] and o4.get("task"), str(o4.get("gen"))[:200])
    check("J: доска без ошибок JS", not berr, str(berr[:1]))
    ctx.close()


# ─── K. телефон и планшет ───
def test_phone(browser):
    for w in (375, 320, 768):
        ctx, page, errors = open_page(browser, w, 800)
        over = page.evaluate("() => document.documentElement.scrollWidth - innerWidth")
        cut = page.evaluate("""() => [...document.querySelectorAll('.tile, .tile-formula .f1, .lvl-head')].filter(t => { const r = t.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1; }).length""")
        check(f"K: {w} px — плашки, плитки и формулы не выходят за край", over <= 0 and cut == 0, f"{over} {cut}")
        head = page.evaluate("""() => { const rg = document.createRange(); rg.selectNodeContents(document.getElementById('pageTitle')); const h = rg.getBoundingClientRect();
            return [...document.querySelectorAll('.home-btn, .theme-toggle, .focus-toggle, .ts-share-btn')].filter(b => { const r = b.getBoundingClientRect(); return r.width && r.bottom > h.top && r.top < h.bottom && r.right > h.left && r.left < h.right; }).length; }""")
        check(f"K: {w} px — заголовок не под кнопками в углах", head == 0, str(head))
        bad = []
        for pid in [t for t in page.evaluate("() => TRIG_BANK.tiles.map(t => t.id)")]:
            for _ in range(2):
                page.evaluate(f"() => {{ startRun(['{pid}']); S.sol = true; render(); }}")
                page.wait_for_timeout(40)
                o = page.evaluate("() => document.documentElement.scrollWidth - innerWidth")
                if o > 0:
                    bad.append(f"{pid}:{o}")
        check(f"K: {w} px — задания с решением без прокрутки вбок", not bad, str(bad[:6]))
        check(f"K: {w} px — без ошибок JS", not errors, str(errors[:1]))
        ctx.close()


def run():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        for t in (test_bank, test_tiles, test_select_and_modes, test_solve, test_cards, test_session, test_platform, test_phone):
            try:
                t(browser)
            except Exception as e:  # noqa: BLE001
                check(f"{t.__name__}: исключение", False, repr(e)[:300])
        browser.close()
    failed = [n for n, ok in results if not ok]
    print()
    print("ИТОГ:", "всё прошло" if not failed else f"упало {len(failed)} из {len(results)}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    run()
