"""
Промпт №12 (новый список): тренажёр «Свойства логарифмов» (10–11 класс) —
logarithms.html и logarithms-bank.js.

Проверяет:
  A. банк: у каждого из 10 свойств на каждом уровне А/Б/В по 300 заданий;
     условие, ответ, каждая строка решения и варианты выбора вычислены
     СВОИМ вычислителем по деревьям выражений (meta) — ответ равен условию,
     строки решения равны друг другу, неверные варианты не равны верному;
     эталон принимается проверкой страницы; у каждого свойства не меньше
     трёх типов заданий (вычислить / упростить / в обратную сторону /
     формула); в тексте нет undefined/NaN;
  B. экран плиток: 10 свойств + «Все свойства вперемешку», у каждой
     название, формула в математическом наборе (индексы, дроби) и пример;
     сетка без дыр на 6 и на 4 колонки, во всю ширину;
  C. анимации: в keyframes только transform и opacity; без наведения
     примеры стоят; наведение поднимает плитку и запускает пример; в
     начале анимации пример — это запись «откуда» (log₂(4·8): части по
     порядку), в конце — «куда»; после смены ширины окна тоже; на сенсорном
     экране примеры идут сами у видимых плиток и стоят за экраном; при
     «уменьшить движение» — ни одной анимации, запись законченная;
  D. выбор: плитка отмечается и снимается, «Начать» неактивна без выбора;
     два свойства — задания только по ним и вперемешку, одно — только по
     нему, плитка «вперемешку» — все свойства; адрес ?p=, перезагрузка;
  E. режимы: «Тренировка» с «Показать решение и ответ», «Экзамен» без неё,
     интерфейс тот же; у каждого шага решения — метка применённого
     свойства; шпаргалка формул только в «Тренировке»;
  F. каждое свойство на каждом уровне решается через интерфейс; две
     ошибки — верный ответ подставлен и разбор открыт; пропуск «?» в
     тождестве заполняется; уровень Б после трёх верных; ручной выбор;
  G. разбор записей: 5/3, −3/2, 0,5 = 1/2; 1,67 вместо 5/3 — просьба;
  H. карточки «+»: те же свойства и уровень, решаются;
  I. совместная сессия (заглушка Supabase из теста №54): отметки плиток,
     задание, ответ, возврат к плиткам у ученика те же;
  J. «В подборку» (индексы не склеиваются), главная (10 и 11 класс), доска:
     задание ложится живым (поле и выбор), −3/2 принимается, «ещё такое
     же» — та же тренировка и уровень;
  K. телефон 375 и 320 px, планшет 768: без прокрутки вбок;
  L. формулы через KaTeX: в 2400 заданиях без ошибок KaTeX и без старой
     разметки, корни — знаком KaTeX по размеру выражения, пропуск «?» в
     формуле и число в нём после ответа, тёмная тема.

Живой realtime из песочницы не проверить — совместный режим перепроверяется
на сайте руками.

Запуск: python3 test_prompt12_logarithms.py (сервер поднимается сам).
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

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from test_prompt54_trainer_sync_and_cards import FAKE_LIB  # noqa: E402

PORT = 8974
BASE = f"http://127.0.0.1:{PORT}"
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
    """Конспект урока снимает экран html2canvas'ом при каждой смене задания;
    тест меняет задания сотнями — снимки копились бы и вешали страницу."""
    page.evaluate("() => { if (window.TrainerSession && TrainerSession.setAutosaveHistory) TrainerSession.setAutosaveHistory(false); }")


def open_page(browser, width=1400, height=900, url="logarithms.html", reduced=None, fake=False, touch=False):
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
    page.wait_for_function("() => window.__trainerState && window.LOG_BANK")
    page.wait_for_timeout(300)
    quiet(page)
    return ctx, page, errors


# ─── независимая проверка задания по деревьям выражений ───
CHECK_JS = r"""
(function(){
  // свой вычислитель, не из банка: логарифм — только при допустимых
  // основании (> 0, ≠ 1) и аргументе (> 0), иначе NaN
  function ev(t, env){
    if (typeof t === 'number') return t;
    const e = x => ev(x, env);
    switch (t[0]){
      case 'v': return env[t[1]];
      case 'slot': return env.ANS;
      case 'log': { const b = e(t[1]), a = e(t[2]); if (!(b > 0) || Math.abs(b - 1) < 1e-12 || !(a > 0)) return NaN; return Math.log(a) / Math.log(b); }
      case 'lg': { const a = e(t[1]); return a > 0 ? Math.log(a) / Math.LN10 : NaN; }
      case 'pow': return Math.pow(e(t[1]), e(t[2]));
      case 'root': return Math.pow(e(t[2]), 1 / t[1]);
      case '/': return e(t[1]) / e(t[2]);
      case '*': return t.slice(1).reduce((s, x) => s * e(x), 1);
      case '+': return t.slice(1).reduce((s, x) => s + e(x), 0);
      case '-': return e(t[1]) - e(t[2]);
      case 'neg': return -e(t[1]);
    }
    return NaN;
  }
  const val = s => { s = String(s); if (s.indexOf('/') >= 0){ const [p, q] = s.split('/').map(Number); return p / q; } return Number(s); };
  const close = (u, v) => isFinite(u) && isFinite(v) && Math.abs(u - v) <= 1e-7 * Math.max(1, Math.abs(v));
  // буквы — случайные положительные числа больше 1 (основания ≠ 1)
  function envs(ans){
    const out = [];
    for (let i = 0; i < 4; i++){ const env = { ANS: ans }; 'abcxyn'.split('').forEach(k => { env[k] = 1.3 + Math.random() * 5.5; }); out.push(env); }
    return out;
  }
  function checkTask(t){
    const errs = [], m = t.meta;
    const E = envs(t.fields ? val(t.fields[0].value) : 0);
    if (t.kind === 'calc'){ if (!close(ev(m.expr, E[0]), val(t.fields[0].value))) errs.push('ответ ' + t.fields[0].value + ' ≠ ' + ev(m.expr, E[0])); }
    else if (t.kind === 'slot'){ E.forEach(env => { if (!close(ev(m.lhs, env), ev(m.rhs, env))) errs.push('тождество неверно при ответе ' + m.ans); }); }
    else {
      E.forEach(env => { if (!close(ev(m.expr, env), ev(m.opts[m.correct], env))) errs.push('верный вариант не равен выражению'); });
      m.opts.forEach((o, i) => { if (i !== m.correct && E.every(env => close(ev(o, env), ev(m.expr, env)))) errs.push('неверный вариант ' + i + ' тоже равен'); });
      if (t.choice.opts.length !== m.opts.length || new Set(t.choice.opts).size !== t.choice.opts.length) errs.push('варианты повторяются');
    }
    const ch = m.chain;
    for (let i = 1; i < ch.length; i++) E.forEach(env => { if (!close(ev(ch[i - 1], env), ev(ch[i], env))) errs.push('строка решения ' + i + ' не равна предыдущей'); });
    const last = ev(ch[ch.length - 1], E[0]);
    if (t.kind === 'calc' && !close(last, val(t.fields[0].value))) errs.push('решение кончается не ответом');
    if (t.kind === 'slot' && !close(last, ev(m.rhs, E[0]))) errs.push('решение не приходит к правой части');
    if (t.kind === 'choice' && !close(last, ev(m.expr, E[0]))) errs.push('решение не приходит к выражению');
    if ((t.steps || []).length !== ch.length - 1 || !t.steps.length) errs.push('шагов решения не столько, сколько строк');
    if (/undefined|NaN|Infinity/.test(t.text + t.steps.join('') + t.answer)) errs.push('undefined/NaN в тексте');
    return [...new Set(errs)];
  }
  return { ev, checkTask };
})()"""

# вписать верный ответ в задание (основное или карточку) и нажать «Проверить»
SOLVE_JS = """(idx) => {
  const t = idx >= 0 ? S.cards[idx].task : S.task;
  const q = idx >= 0 ? document.querySelector('.added-task-card[data-idx="' + idx + '"] .added-card-question') : document.getElementById('logQuestion');
  const a = idx >= 0 ? document.querySelector('.added-task-card[data-idx="' + idx + '"] .answer-area') : document.getElementById('answerArea');
  if (t.choice) { q.querySelector('.mcq-btn[data-i="' + t.choice.correct + '"]').click(); return 'choice'; }
  t.fields.forEach(f => { const i = a.querySelector('input[data-fid="' + f.id + '"]'); i.value = fieldShown(f); i.dispatchEvent(new Event('input', {bubbles:true})); });
  a.querySelector('.check-btn').click();
  return 'fields';
}"""
WRONG_JS = """(idx) => {
  const t = idx >= 0 ? S.cards[idx].task : S.task;
  const q = idx >= 0 ? document.querySelector('.added-task-card[data-idx="' + idx + '"] .added-card-question') : document.getElementById('logQuestion');
  const a = idx >= 0 ? document.querySelector('.added-task-card[data-idx="' + idx + '"] .answer-area') : document.getElementById('answerArea');
  if (t.choice) { const w = (t.choice.correct + 1 + (S.wrong || []).length) % t.choice.opts.length; q.querySelector('.mcq-btn[data-i="' + w + '"]').click(); return; }
  t.fields.forEach(f => { const i = a.querySelector('input[data-fid="' + f.id + '"]'); i.value = String(Math.round(valueOf(f.value) * 7 + 13)); });
  a.querySelector('.check-btn').click();
}"""


# ─── A. банк ───
def test_bank(browser):
    ctx, page, errors = open_page(browser)
    res = page.evaluate("""(CHECK) => {
      const C = eval(CHECK);
      const bad = {}; let n = 0; const types = {};
      const add = (k, m) => (bad[k] = bad[k] || []).push(m);
      for (const p of LOG_BANK.props) for (let L = 1; L <= 3; L++) for (let i = 0; i < 300; i++) {
        let t;
        try { t = LOG_BANK.generate([p.id], L); } catch (e) { add(p.id + L, 'исключение ' + e.message); continue; }
        n++;
        (types[p.id] = types[p.id] || new Set()).add(t.type);
        if (t.lvl !== L || t.pid !== p.id || !t.key) add(p.id + L, 'pid/lvl/key');
        if (JSON.stringify(t) !== JSON.stringify(JSON.parse(JSON.stringify(t)))) add(p.id + L, 'не данные');
        C.checkTask(t).forEach(e => add(p.id + L, e));
        if (t.fields) t.fields.forEach(f => { if (checkField(f, fieldShown(f)) !== true) add(p.id + L, 'эталон не принят: ' + f.value); });
      }
      return { n, props: LOG_BANK.props.length, fewTypes: Object.keys(types).filter(k => types[k].size < 3),
               bad: Object.keys(bad).map(k => k + ': ' + [...new Set(bad[k])].slice(0, 2).join(' | ')) };
    }""", CHECK_JS)
    check("A: 10 свойств", res["props"] == 10, str(res["props"]))
    check(f"A: {res['n']} заданий — ответ, строки решения и варианты сходятся с независимым вычислением", not res["bad"], "; ".join(res["bad"][:5]))
    check("A: у каждого свойства не меньше трёх типов заданий", not res["fewTypes"], str(res["fewTypes"]))
    # «вперемешку» — по кругу все выбранные и подряд одно свойство не повторяется
    mix = page.evaluate("""() => { const seq = []; for (let i = 0; i < 200; i++) seq.push(LOG_BANK.generate(['prod', 'quot', 'pow'], 2).pid);
        return { set: [...new Set(seq)].sort(), repeats: seq.filter((p, i) => i && p === seq[i - 1]).length }; }""")
    check("A: вперемешку — задания всех выбранных свойств, одно и то же подряд не идёт", mix["set"] == ["pow", "prod", "quot"] and mix["repeats"] == 0, str(mix))
    check("A: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── B, C. плитки и анимации ───
PROD_ORDER_JS = """(t) => {
  const tile = document.querySelector('.tile[data-pid="prod"]');
  tile.getAnimations({ subtree: true }).forEach(a => { a.pause(); a.currentTime = t; });
  const x = sel => { const e = [...tile.querySelectorAll('.demo ' + sel)].find(e => getComputedStyle(e).opacity > 0.5); return e ? e.getBoundingClientRect().left : null; };
  const ghost = ch => { const e = [...tile.querySelectorAll('.demo .ghost')].find(g => g.textContent === ch); return e ? { x: e.getBoundingClientRect().left, o: +getComputedStyle(e).opacity } : null; };
  return { l: x('[data-k="l"]'), b: x('[data-k="b"]'), c: x('[data-k="c"]'), l2: x('[data-k="l2"]'), pl: +getComputedStyle(tile.querySelector('.demo [data-k="pl"]')).opacity,
           res: +getComputedStyle(tile.querySelector('.demo [data-k="res"]')).opacity, p1: ghost('('), dot: ghost('·'), p2: ghost(')') };
}"""


def prod_frames(page):
    page.mouse.move(5, 5)
    loc = page.locator('.tile[data-pid="prod"]')
    loc.scroll_into_view_if_needed()
    page.wait_for_timeout(300)
    box = loc.bounding_box()
    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + 30)
    page.wait_for_timeout(400)
    start = page.evaluate(f"({PROD_ORDER_JS})(300)")
    # цикл 4,5 с: к 4 с итог уже виден, строка ещё не погасла
    end = page.evaluate(f"({PROD_ORDER_JS})(4000)")
    # пример начинает двигаться почти сразу после наведения: к 0,9 с «4»
    # уже в пути (не на месте «откуда» и не на месте «куда»)
    mid = page.evaluate(f"({PROD_ORDER_JS})(900)")
    start["moving"] = start["b"] + 1 < mid["b"] or mid["b"] < start["b"] - 1
    start["mid_b"] = mid["b"]; start["end_b"] = end["b"]
    ok_start = (start["p1"] and start["dot"] and start["p2"] and start["l"] < start["p1"]["x"] < start["b"] < start["dot"]["x"] < start["c"] < start["p2"]["x"]
                and start["p1"]["o"] > 0.9 and start["pl"] < 0.1 and start["res"] < 0.1 and abs(start["l2"] - start["l"]) < 2)
    ok_start = ok_start and start["moving"] and abs(start["mid_b"] - end["b"]) > 1
    ok_end = (end["p1"]["o"] < 0.05 and end["pl"] > 0.9 and end["res"] > 0.9 and end["l"] < end["b"] < end["l2"] < end["c"])
    return ok_start, ok_end, start, end


def test_tiles(browser):
    ctx, page, errors = open_page(browser, 1400, 900)
    info = page.evaluate("""() => {
      const tiles = [...document.querySelectorAll('#tiles .tile')];
      const box = document.getElementById('tiles').getBoundingClientRect();
      const rects = tiles.map(t => t.getBoundingClientRect());
      const area = rects.reduce((s, r) => s + r.width * r.height, 0);
      return { n: tiles.length, mix: !!document.querySelector('.tile.mix[data-pid="all"]'),
        cols: getComputedStyle(document.getElementById('tiles')).gridTemplateColumns.split(' ').length, width: box.width,
        // с перевода на KaTeX формула — .katex, индексы — .msupsub, дроби — .mfrac
        full: tiles.filter(t => !t.classList.contains('mix')).every(t => t.querySelector('.tile-title').textContent.trim() && t.querySelector('.tile-formula .katex .msupsub') && t.querySelector('.demo .demo-line')),
        fracs: ['quot', 'basepow', 'bothpow', 'change', 'swap'].every(id => document.querySelector('.tile[data-pid="' + id + '"] .tile-formula .katex .mfrac')),
        subs: document.querySelectorAll('.tile-formula .katex .msupsub').length,
        // без дыр: сумма площадей плиток плюс промежутки ≈ площадь сетки
        fill: area / (box.width * box.height) };
    }""")
    check("B: 10 плиток свойств и плитка «Все свойства вперемешку»", info["n"] == 11 and info["mix"], str(info["n"]))
    check("B: у каждой плитки — название, формула в наборе и пример", info["full"] and info["subs"] >= 15, str(info))
    check("B: дроби в формулах — вертикальные (частное, переход, степени в основании)", info["fracs"])
    check("B: 6 колонок во всю ширину, без дыр", info["cols"] == 6 and info["width"] > 1100 and info["fill"] > 0.9, str(info))

    props = page.evaluate("""() => {
      const out = new Set(); const names = new Set();
      document.querySelectorAll('.tile *').forEach(e => { const n = getComputedStyle(e).animationName; if (n && n !== 'none') n.split(',').forEach(x => names.add(x.trim())); });
      ['dmMove', 'dmIn', 'dmLate', 'dmOut', 'dmLine', 'mixCycle'].forEach(n => names.add(n));
      for (const sh of document.styleSheets) { let rules; try { rules = sh.cssRules; } catch (e) { continue; }
        for (const r of rules) if (r.type === 7 && names.has(r.name)) for (const k of r.cssRules) for (let i = 0; i < k.style.length; i++) out.add(k.style[i]); }
      return [...out];
    }""")
    check("C: анимации плиток — только transform и opacity", set(props) <= {"transform", "opacity"} and props, str(props))
    idle = page.evaluate("() => document.getElementById('tiles').getAnimations({ subtree: true }).filter(a => a.playState === 'running').length")
    check("C: без наведения примеры стоят", idle == 0, str(idle))
    ok_start, ok_end, start, end = prod_frames(page)
    lifted = page.evaluate("() => new DOMMatrix(getComputedStyle(document.querySelector('.tile[data-pid=\"prod\"]')).transform).m42")
    running = page.evaluate("() => document.querySelector('.tile[data-pid=\"prod\"]').getAnimations({ subtree: true }).length")
    check("C: наведение поднимает плитку и запускает пример", lifted < -3 and running >= 5, f"{lifted} {running}")
    dur = page.evaluate("() => getComputedStyle(document.querySelector('.tile[data-pid=prod] .demo .mvk')).animationDuration")
    check("C: начало примера — log₂(4·8): части по порядку, скобки видны; к 0,9 с части уже в пути", ok_start, str(start))
    check("C: цикл примера 4,5 с (×1,2 к первой версии)", dur == "4.5s", dur)
    check("C: конец примера — log₂4 + log₂8 = 2 + 3 = 5", ok_end, str(end))
    # ширина окна поменялась — пример не должен «рассыпаться»
    page.set_viewport_size({"width": 1100, "height": 900})
    page.wait_for_timeout(500)
    cols = page.evaluate("() => getComputedStyle(document.getElementById('tiles')).gridTemplateColumns.split(' ').length")
    ok_start2, _, start2, _ = prod_frames(page)
    fill = page.evaluate("""() => { const box = document.getElementById('tiles').getBoundingClientRect();
        return [...document.querySelectorAll('#tiles .tile')].reduce((s, t) => { const r = t.getBoundingClientRect(); return s + r.width * r.height; }, 0) / (box.width * box.height); }""")
    check("B: на 1100 px — 4 колонки без дыр", cols == 4 and fill > 0.9, f"{cols} {fill}")
    check("C: после смены ширины окна пример начинается верно", ok_start2, str(start2))
    # экран задания — ни одной анимации плиток
    page.mouse.move(5, 5)
    page.click('.tile.mix')
    page.wait_for_timeout(300)
    n_task = page.evaluate("() => document.getElementById('tiles').getAnimations({ subtree: true }).filter(a => a.playState === 'running').length")
    check("C: на экране задания анимации плиток не идут", n_task == 0, str(n_task))
    check("B, C: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    # сенсорный экран: у видимых плиток пример идёт сам, за экраном — пауза
    ctx, page, errors = open_page(browser, 400, 700, touch=True)
    page.wait_for_timeout(400)
    st = page.evaluate("""() => {
      const tiles = [...document.querySelectorAll('#tiles .tile')];
      const inView = t => { const r = t.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
      const run = t => t.getAnimations({ subtree: true }).some(a => a.playState === 'running');
      const vis = tiles.filter(inView), off = tiles.filter(t => t.getBoundingClientRect().top > innerHeight + 200);
      return { vis: vis.length, visRun: vis.filter(run).length, off: off.length, offRun: off.filter(run).length };
    }""")
    check("C: сенсорный экран — примеры идут у видимых плиток, за экраном на паузе", st["vis"] >= 1 and st["visRun"] >= st["vis"] - 1 and st["off"] >= 3 and st["offRun"] == 0, str(st))
    ctx.close()

    # «уменьшить движение»
    ctx, page, errors = open_page(browser, 1400, 900, reduced="reduce")
    box = page.locator('.tile[data-pid="prod"]').bounding_box()
    page.mouse.move(box["x"] + 60, box["y"] + 40)
    page.wait_for_timeout(300)
    r = page.evaluate("""() => { const t = document.querySelector('.tile[data-pid="prod"]');
      return { anims: document.getElementById('tiles').getAnimations({ subtree: true }).length, tf: getComputedStyle(t).transform,
        res: getComputedStyle(t.querySelector('.demo [data-k="res"]')).opacity, pl: getComputedStyle(t.querySelector('.demo [data-k="pl"]')).opacity,
        ghost: Math.max(...[...t.querySelectorAll('.demo .ghost')].map(g => +getComputedStyle(g).opacity)) }; }""")
    check("C: «уменьшить движение» — ни одной анимации, плитка не прыгает, пример законченный",
          r["anims"] == 0 and r["tf"] == "none" and r["res"] == "1" and r["pl"] == "1" and r["ghost"] == 0, str(r))
    ctx.close()


# ─── D, E. выбор свойств и режимы ───
def test_select_and_modes(browser):
    ctx, page, errors = open_page(browser, 1300, 1000)
    page.evaluate("() => { try { Object.keys(localStorage).filter(k => k.startsWith('ogeProg:logarithms')).forEach(k => localStorage.removeItem(k)); } catch (e) {} }")
    page.reload()
    page.wait_for_function("() => window.__trainerState")
    quiet(page)
    check("D: без выбора «Начать» неактивна", page.evaluate("() => document.getElementById('pkStart').disabled"))
    page.click('.tile[data-pid="prod"]')
    page.click('.tile[data-pid="change"]')
    page.click('.tile[data-pid="pow"]')
    page.click('.tile[data-pid="pow"]')     # сняли отметку
    s = page.evaluate("""() => ({ sel: S.sel, cls: [...document.querySelectorAll('.tile.sel')].map(t => t.dataset.pid),
        pressed: document.querySelector('.tile[data-pid="prod"]').getAttribute('aria-pressed'), bar: document.getElementById('pkBarInfo').textContent,
        dis: document.getElementById('pkStart').disabled })""")
    check("D: плитки отмечаются и снимаются, отметка видна", s["sel"] == ["prod", "change"] and s["cls"] == ["prod", "change"] and s["pressed"] == "true" and not s["dis"], str(s))
    check("D: панель показывает выбранное", "2 свойства" in s["bar"] and "логарифм произведения" in s["bar"], s["bar"])
    page.click("#pkStart")
    page.wait_for_timeout(200)
    r = page.evaluate("""() => { const pids = new Set([S.task.pid]); for (let i = 0; i < 60; i++) { newTask(); pids.add(S.task.pid); }
        return { screen: S.screen, props: S.props, pids: [...pids].sort(), url: location.search, title: document.getElementById('taskTitle').textContent,
                 chips: document.querySelectorAll('#runChips .run-chip').length }; }""")
    check("D: два свойства — задания только по ним, оба встречаются", r["screen"] == "task" and r["pids"] == ["change", "prod"] and "p=prod%2Cchange" in r["url"] or "p=prod,change" in r["url"], str(r))
    check("D: в шапке — «вперемешку» и метки выбранных свойств", "Вперемешку" in r["title"] and r["chips"] == 2, str(r))
    page.reload()
    page.wait_for_function("() => window.__trainerState")
    quiet(page)
    check("D: после перезагрузки — та же тренировка", page.evaluate("() => S.screen === 'task' && S.props.join() === 'prod,change'"))
    page.click("#backBtn")
    check("D: назад к плиткам — выбор сохранён", page.evaluate("() => S.screen === 'picker' && S.sel.join() === 'prod,change' && document.querySelectorAll('.tile.sel').length === 2"))
    page.click("#pkClear")
    page.click('.tile[data-pid="swap"]')
    page.click("#pkStart")
    one = page.evaluate("() => { const p = new Set(); for (let i = 0; i < 30; i++) { newTask(); p.add(S.task.pid); } return { p: [...p], title: document.getElementById('taskTitle').textContent, nav: document.getElementById('nextProtoBtn').offsetParent !== null }; }")
    check("D: одно свойство — только оно, соседние свойства стрелками", one["p"] == ["swap"] and one["title"] == "Перемена основания и аргумента" and one["nav"], str(one))
    page.click("#nextProtoBtn")
    check("D: «Следующее ▶» — следующее свойство", page.evaluate("() => S.props.join() === 'expswap'"))
    page.click("#backBtn")
    page.click(".tile.mix")
    allp = page.evaluate("() => { const p = new Set([S.task.pid]); for (let i = 0; i < 120; i++) { newTask(); p.add(S.task.pid); } return { n: p.size, props: S.props.length, url: location.search, title: document.getElementById('taskTitle').textContent }; }")
    check("D: «Все свойства вперемешку» — задания по всем десяти", allp["n"] == 10 and allp["props"] == 10 and "p=all" in allp["url"] and allp["title"] == "Все свойства вперемешку", str(allp))

    # E. режимы
    vis = lambda sel: page.evaluate(f"() => {{ const e = document.querySelector('{sel}'); return !!e && e.offsetParent !== null; }}")
    tabs = page.evaluate("() => [...document.querySelectorAll('.submode-tab')].map(b => b.textContent.trim())")
    check("E: ровно два режима — Тренировка и Экзамен", tabs == ["Тренировка", "Экзамен"], str(tabs))
    check("E: в «Тренировке» есть «Показать решение и ответ» и шпаргалка", vis("#showSolutionBtn") and vis("#refBtn"))
    page.click("#showSolutionBtn")
    steps = page.evaluate("""() => { const st = [...document.querySelectorAll('#solSteps .sol-step')];
        return { n: st.length, tagged: st.every(s => s.querySelector('.prop-tag')), props: st.filter(s => !s.querySelector('.prop-tag.aux')).length, ans: document.getElementById('solAnswer').textContent }; }""")
    check("E: решение по шагам, у каждого шага — метка свойства", vis("#mainPanel") and steps["n"] >= 1 and steps["tagged"] and steps["props"] >= 1 and "Ответ" in steps["ans"], str(steps))
    page.click("#refBtn")
    check("E: шпаргалка — формулы всех свойств тренировки", page.evaluate("() => document.querySelectorAll('#propRef .prop-ref-item').length") == 10 and vis("#propRef"))
    page.click("#tabExam")
    page.wait_for_timeout(100)
    check("E: в «Экзамене» нет кнопки решения, шпаргалки, решение закрыто", not vis("#showSolutionBtn") and not vis("#mainPanel") and not vis("#propRef") and not vis("#refBtn"))
    check("E: интерфейс тот же — условие, ответ, уровни", vis("#logQuestion") and vis("#levelRow") and (vis("#answerArea .check-btn") or vis("#logQuestion .mcq-btn")))
    page.click("#tabPractice")
    check("D, E: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── F. решение через интерфейс ───
def test_solve(browser):
    ctx, page, errors = open_page(browser, 1300, 1000)
    fails = page.evaluate("""(SOLVE) => {
      const solve = eval(SOLVE); const out = [];
      for (const p of LOG_BANK.props) for (let L = 1; L <= 3; L++) for (let k = 0; k < 4; k++) {
        startRun([p.id], L);
        const before = totalSolved;
        solve(-1);
        if (!(S.answered && S.correct && totalSolved === before + 1)) out.push(p.id + L + ': ' + S.task.peek);
      }
      return out;
    }""", SOLVE_JS)
    check("F: все 10 свойств на уровнях А, Б, В решаются верным ответом", not fails, "; ".join(fails[:4]))
    page.evaluate("() => { startRun(['quot'], 1); let i = 0; while (S.task.kind !== 'calc' && i++ < 50) newTask(); }")
    e0 = page.evaluate("() => totalErrors")
    page.evaluate(f"({WRONG_JS})(-1)")
    s1 = page.evaluate("() => ({ a: S.answered, w: S.hadWrong, bad: !!document.querySelector('#answerArea .answer-input.bad') })")
    page.evaluate(f"({WRONG_JS})(-1)")
    s2 = page.evaluate("() => ({ a: S.answered, c: S.correct, fixed: !!document.querySelector('#answerArea .answer-input.fixed'), sol: document.getElementById('mainPanel').offsetParent !== null, e: totalErrors, val: document.querySelector('#answerArea .answer-input').value, want: fieldShown(S.task.fields[0]) })")
    check("F: первая ошибка — красным, можно исправить", not s1["a"] and s1["w"] and s1["bad"], str(s1))
    check("F: вторая — верный ответ подставлен, разбор открыт", s2["a"] and not s2["c"] and s2["fixed"] and s2["sol"] and s2["val"] == s2["want"] and s2["e"] == e0 + 2, str(s2))
    page.evaluate("() => { startRun(['prod'], 2); let i = 0; while (S.task.kind !== 'slot' && i++ < 80) newTask(); }")
    before = page.inner_text("#logQuestion .log-expr .slot")
    page.evaluate(f"({SOLVE_JS})(-1)")
    after = page.evaluate("() => ({ txt: document.querySelector('#logQuestion .log-expr .slot').textContent, filled: document.querySelector('#logQuestion .log-expr .slot').classList.contains('filled'), want: S.task.fields[0].value })")
    check("F: пропуск «?» после ответа заполнен верным числом", before == "?" and after["filled"] and after["txt"].replace("−", "-") == after["want"].replace("/", ""), str(after))
    # выбор формулы у «Логарифма степени» на уровне А — одно-единственное
    # задание; после промпта №18 нового списка (no-repeat.js) уже показанное
    # не вернётся, пока не перебраны остальные, — поэтому историю сбрасываем
    page.evaluate("() => { NoRepeat.reset(); startRun(['pow'], 1); let i = 0; while (!S.task.choice && i++ < 80) newTask(); }")
    page.evaluate(f"({WRONG_JS})(-1)")
    page.evaluate(f"({WRONG_JS})(-1)")
    c = page.evaluate("() => ({ a: S.answered, bad: document.querySelectorAll('#logQuestion .mcq-btn.bad').length, fixed: document.querySelectorAll('#logQuestion .mcq-btn.fixed').length })")
    check("F: выбор формулы — две ошибки, верный вариант показан", c["a"] and c["bad"] == 2 and c["fixed"] == 1, str(c))
    # уровни
    page.evaluate("() => { levelProg = {}; startRun(['change'], 1); }")
    for k in range(3):
        page.evaluate(f"({SOLVE_JS})(-1)")
        if k < 2:
            page.click("#nextBtn")
    up = page.evaluate("() => ({ up: S.lvlUp, msg: document.getElementById('levelUp').textContent })")
    page.click("#nextBtn")
    after = page.evaluate("() => ({ lvl: S.lvl, tl: S.task.lvl, chipA: document.querySelector('.lvl-chip[data-lvl=\"1\"]').classList.contains('done'), saved: progOf('change') })")
    check("F: после трёх верных на А — «Уровень А пройден»", up["up"] and "пройден" in up["msg"], str(up))
    check("F: следующее задание — уровень Б, А отмечен пройденным", after["lvl"] == 2 and after["tl"] == 2 and after["chipA"] and after["saved"]["lvl"] == 2, str(after))
    page.click('.lvl-chip[data-lvl="3"]')
    check("F: уровень выбирается вручную", page.evaluate("() => S.lvl === 3 && S.task.lvl === 3"))
    page.click("#backBtn")
    badge = page.evaluate("() => document.querySelector('.tile[data-pid=\"change\"] .tile-badges').textContent")
    check("F: на плитке — сколько решено и уровень", "✓" in badge and "В" in badge, badge)
    check("F: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── G. разбор записей ───
def test_parse(browser):
    ctx, page, errors = open_page(browser)
    r = page.evaluate("""() => {
      const f = v => ({ id: 'a', label: '', type: 'num', value: v });
      return { a: checkField(f('5/3'), '5/3'), b: checkField(f('-3/2'), '−3/2'), c: checkField(f('-3/2'), '-1,5'), d: checkField(f('1/2'), '0,5'),
               e: checkField(f('5/3'), '1,67'), g: checkField(f('5/3'), '10/6'), h: checkField(f('-2'), '2'), i: checkField(f('3'), 'три'), j: checkField(f('3'), ''),
               k: checkField(f('7/2'), '3 1/2'), l: checkField(f('-3'), '– 3') };
    }""")
    check("G: 5/3, −3/2, −1,5, 0,5 = 1/2, 10/6, 3 1/2 — верно", all(r[k] is True for k in "abcdgk"), str(r))
    check("G: 1,67 вместо 5/3 — просьба записать точно, не ошибка", isinstance(r["e"], str) and "дроб" in r["e"], str(r["e"]))
    check("G: знак потерян — ошибка; не число и пусто — просьба", r["h"] is False and isinstance(r["i"], str) and isinstance(r["j"], str), str(r))
    page.evaluate("() => { startRun(['change'], 2); let i = 0; while (!(S.task.fields && S.task.fields[0].value.indexOf('/') > 0 && S.task.fields[0].value.split('/')[1] === '3') && i++ < 200) newTask(); }")
    want = page.evaluate("() => S.task.fields[0].value")
    if "/" in want and want.split("/")[1] == "3":
        e0 = page.evaluate("() => totalErrors")
        p, q = [int(x) for x in want.split("/")]
        page.fill("#answerArea input", f"{p / q:.2f}".replace(".", ","))
        page.click("#answerArea .check-btn")
        msg = page.inner_text("#answerArea .answer-msg")
        check("G: на экране — подсказка под полем, ошибок не прибавилось", "дроб" in msg and page.evaluate("() => totalErrors") == e0 and not page.evaluate("() => S.hadWrong"), msg)
    ctx.close()


# ─── H. карточки «+» ───
def test_cards(browser):
    ctx, page, errors = open_page(browser, 1300, 1000)
    page.evaluate("() => startRun(['prod', 'quot'], 2)")
    page.click("#addRailToggle")
    page.click('.add-qty-btn[data-n="3"]')
    page.wait_for_timeout(200)
    c = page.evaluate("() => ({ n: S.cards.length, same: S.cards.every(c => ['prod', 'quot'].indexOf(c.task.pid) >= 0 && c.task.lvl === 2), keys: new Set([S.task.key].concat(S.cards.map(c => c.task.key))).size, dom: document.querySelectorAll('.added-task-card').length })")
    check("H: «+3» — три карточки той же тренировки и уровня", c["n"] == 3 and c["same"] and c["keys"] == 4 and c["dom"] == 3, str(c))
    s0 = page.evaluate("() => totalSolved")
    page.evaluate(f"({SOLVE_JS})(1)")
    cs = page.evaluate("() => ({ a: S.cards[1].answered, ok: S.cards[1].correct, sol: getComputedStyle(document.querySelector('.added-task-card[data-idx=\"1\"] .added-explain')).display, tags: document.querySelectorAll('.added-task-card[data-idx=\"1\"] .prop-tag').length, st: tsGetState().cards[1].answered, solved: totalSolved })")
    check("H: карточка решается, открывает разбор с метками свойств и попадает в снимок", cs["a"] and cs["ok"] and cs["sol"] == "block" and cs["tags"] >= 1 and cs["st"] and cs["solved"] == s0 + 1, str(cs))
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

    teacher = mk("logarithms.html")
    teacher.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()", timeout=10000)
    code = teacher.evaluate("() => window.TrainerSession.getCode()")
    student = mk(f"logarithms.html?s={code}")
    student.wait_for_timeout(1500)
    check("I: ученик на экране плиток вместе с учителем", student.evaluate("() => S.screen") == "picker")
    teacher.click('.tile[data-pid="basepow"]')
    teacher.click('.tile[data-pid="swap"]')
    teacher.wait_for_timeout(1000)
    check("I: отметки плиток учителя видны у ученика", student.evaluate("() => [...document.querySelectorAll('.tile.sel')].map(t => t.dataset.pid).join()") == "basepow,swap")
    teacher.click("#pkStart")
    teacher.evaluate("() => { let i = 0; while (S.task.kind === 'choice' && i++ < 50) newTask(); }")
    teacher.wait_for_timeout(1200)
    same = lambda: student.evaluate("() => S.task && S.task.key") == teacher.evaluate("() => S.task.key")
    check("I: у ученика та же тренировка и то же задание", student.evaluate("() => S.screen === 'task' && S.props.join() === 'basepow,swap'") and same()
          and student.inner_text("#logQuestion") == teacher.inner_text("#logQuestion"))
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
    teacher.click('.lvl-chip[data-lvl="3"]')
    teacher.wait_for_timeout(1200)
    check("I: смена уровня и режима доехала", same() and student.evaluate("() => S.lvl === 3 && S.task.lvl === 3 && S.mode === 'exam'"))
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
    page.evaluate("() => { Basket.clear(); startRun(['prod'], 1); let i = 0; while (S.task.kind !== 'calc' && i++ < 50) newTask(); }")
    page.click("#basketAddBtn")
    it = page.evaluate("() => Basket.all().slice(-1)[0]")
    check("J: «В подборку» — задание со свойством и уровнем", it and it["trainerId"] == "logarithms" and "Логарифм произведения · уровень А" == it["modeTitle"], str(it)[:200])
    # формулы KaTeX «Подборка» уносит исходником TeX (basket-tex) и рисует
    # заново тем же KaTeX — индексы не склеиваются: \log_{2}
    glued = re.search(r"(?<!\\)log\d", it["text"])
    check("J: в подборке индексы не склеиваются: формула уходит исходником KaTeX",
          not glued and "basket-tex" in it["html"] and ("\\log_{" in it["text"] or "\\lg" in it["text"]), it["text"][:120])
    page.evaluate("() => { Basket.clear(); NoRepeat.reset(); startRun(['change'], 1); let i = 0; while (!S.task.choice && i++ < 80) newTask(); }")  # сброс истории — см. выбор формулы выше
    page.click("#basketAddBtn")
    it = page.evaluate("() => Basket.all().slice(-1)[0]")
    check("J: у выбора формулы — варианты списком, формулы (с дробями) — KaTeX", "basket-opt" in it["html"] and "basket-tex" in it["html"] and "frac{" in it["text"] and "<button" not in it["html"], it["html"][:200])
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
        links[sub] = page.evaluate("() => [...document.querySelectorAll('.topic')].filter(t => (t.querySelector('.section-title') || {}).textContent === 'Логарифмы').map(t => t.querySelector('a').getAttribute('href'))")
    check("J: на главной «Логарифмы» в 10 и 11 классе — одна страница logarithms.html",
          links == {"g10": ["logarithms.html"], "g11": ["logarithms.html"]}, str(links))
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
    inlist = page.evaluate("() => [...document.querySelectorAll('.bd-trainers-item')].some(b => b.dataset.id === 'logarithms' && b.dataset.href === 'logarithms.html')")
    check("J: «Свойства логарифмов» в панели тренажёров на доске", inlist)
    page.evaluate("() => openTrainerInPanel('logarithms', 'logarithms.html', 'Свойства логарифмов')")
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

    # задание с дробным отрицательным ответом: log по основанию 1/4 от степени двойки
    o = add("startRun(['basepow'], 3); (function(){ let i = 0; while (!(S.task.fields && /^-\\d+\\/\\d+$/.test(S.task.fields[0].value)) && i++ < 300) newTask(); })()")
    want = page.evaluate(f"() => {FRAME}.contentWindow.eval('S.task.fields[0].value')")
    check("J: задание легло на доску живым — поле с ответом тренажёра", bool(o.get("task")) and o["task"]["kind"] == "fields" and o["task"]["fields"][0]["value"] == want, str(o.get("task"))[:200])
    page.evaluate("() => { document.getElementById('bdTrainersPanel').classList.remove('open'); boardsRedraw(); }")
    page.wait_for_timeout(300)
    sel = f'.bd-task[data-id="{o["id"]}"]'
    page.locator(f"{sel} .bd-task-in").first.fill(want.replace("-", "−"))
    page.click(f"{sel} .bd-task-btn")
    page.wait_for_timeout(300)
    st = page.evaluate(f"() => getCurrentBoard().objects.find(x => x.id === {json.dumps(o['id'])}).task.st")
    check("J: на доске ответ «" + want.replace("-", "−") + "» принят", bool(st) and st.get("res") == "ok", str(st))
    page.evaluate("() => document.getElementById('bdTrainersPanel').classList.add('open')")
    o3 = add("NoRepeat.reset(); startRun(['quot', 'swap'], 1); (function(){ let i = 0; while (!S.task.choice && i++ < 200) newTask(); })()")  # сброс истории — см. выбор формулы выше
    check("J: выбор формулы лёг с живыми вариантами", o3.get("task") and o3["task"]["kind"] == "choice" and o3["task"]["n"] == 4 and len(o3["task"]["hot"]["opts"]) == 4, str(o3.get("task"))[:200])
    check("J: у задания запомнено, как сделать ещё такое же", o3.get("gen") and o3["gen"]["kind"] == "state" and o3["gen"]["snap"].get("props") == ["quot", "swap"], str(o3.get("gen"))[:200])
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
    check("J: «ещё такое же» — та же тренировка и уровень", o4.get("gen") and o4["gen"]["snap"]["props"] == ["quot", "swap"] and o4["gen"]["snap"]["lvl"] == 1 and o4.get("task"), str(o4.get("gen"))[:200])
    check("J: доска без ошибок JS", not berr, str(berr[:1]))
    ctx.close()


# ─── L. формулы через KaTeX (после промпта №79: «арифметические корни
#        неправильно отображаются» — свой наборщик рисовал черту корня из CSS) ───
def test_katex(browser):
    ctx, page, errors = open_page(browser)
    page.wait_for_function("() => document.documentElement.classList.contains('katex-fonts-ready')", timeout=5000)
    r = page.evaluate("""() => { const out = { n: 0, err: [], old: 0, rootTasks: 0, rootOk: 0 };
      const hasRoot = x => Array.isArray(x) && (x[0] === 'root' || x.some(hasRoot));
      for (const p of LOG_BANK.props) for (let L = 1; L <= 4; L++) for (let i = 0; i < 60; i++) {
        const t = LOG_BANK.generate([p.id], L); out.n++;
        const all = t.text + t.steps.join('') + t.answer + (t.choice ? t.choice.opts.join('') : '') + (t.slotEq || '') + (t.filledHTML || '');
        if (/katex-error/.test(all)) out.err.push(t.peek);
        // старой разметки наборщика в задании больше нет
        if (/class="(rt|rad|frac|pw|lg)"/.test(all)) out.old++;
        if ((t.meta.chain || []).some(hasRoot)) { out.rootTasks++; if (/class="[^"]*\\bsqrt\\b/.test(all)) out.rootOk++; }
      } return out; }""")
    check(f"L: {r['n']} заданий — формулы рисует KaTeX без ошибок, старой разметки нет", not r["err"] and r["old"] == 0, str(r["err"][:2]) + f" old={r['old']}")
    check(f"L: корни ({r['rootTasks']} заданий с корнем) — знаком корня KaTeX", r["rootTasks"] > 20 and r["rootOk"] == r["rootTasks"], str(r))
    # корень на экране: черта над подкоренным выражением и знак — одна высота
    # newTask, а не ⟳: ⟳ держит вид задания, а корни — только в одном виде
    page.evaluate("() => { startRun(['bothpow'], 3); let i = 0; while (!/sqrt/.test(S.task.text) && i++ < 300) newTask(); }")
    g = page.evaluate("""() => { const sq = document.querySelector('#logQuestion .log-expr .sqrt'); if (!sq) return null;
        const svg = sq.querySelector('svg'), r = sq.getBoundingClientRect(), rs = svg && svg.getBoundingClientRect();
        return { w: r.width, h: r.height, svg: !!svg, inside: rs && rs.left >= r.left - 1 && rs.right <= r.right + 1 }; }""")
    check("L: корень в условии — знак и черта KaTeX (svg) по размеру выражения", g and g["svg"] and g["inside"] and g["w"] > 10, str(g))
    # пропуск «?»: рамка в формуле, после ответа — верное число в той же рамке
    page.evaluate("() => { startRun(['pow'], 2); drawTask(LOG_BANK.generate(S.props, 2, { type: 'simp' }), true); }")
    before = page.evaluate("() => { const s = document.querySelector('#logQuestion .log-expr .katex .slot'); return s ? s.textContent.trim() : null; }")
    page.evaluate(f"() => ({SOLVE_JS})(-1)")
    after = page.evaluate("() => { const s = document.querySelector('#logQuestion .log-expr .katex .slot.filled'); return s ? s.textContent : null; }")
    want = page.evaluate("() => S.task.fields[0].value")
    check("L: пропуск «?» в формуле, после ответа — верное число в рамке", before == "?" and after and all(ch in after for ch in want.replace("-", "").replace("/", "")), f"{before} → {after} ({want})")
    # тёмная тема — формулы цветом текста, не чёрным
    page.evaluate("() => document.documentElement.setAttribute('data-theme', 'dark')")
    col = page.evaluate("() => [getComputedStyle(document.querySelector('#logQuestion .log-expr .katex')).color, getComputedStyle(document.querySelector('#logQuestion .log-expr')).color]")
    check("L: тёмная тема — формула цветом текста страницы", col[0] == col[1], str(col))
    check("L: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── K. телефон и планшет ───
def test_phone(browser):
    for w in (375, 320, 768):
        ctx, page, errors = open_page(browser, w, 800)
        over = page.evaluate("() => document.documentElement.scrollWidth - innerWidth")
        cut = page.evaluate("""() => [...document.querySelectorAll('.tile, .tile-formula .f1')].filter(t => { const r = t.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1; }).length""")
        check(f"K: {w} px — плитки и формулы не выходят за край", over <= 0 and cut == 0, f"{over} {cut}")
        # рамка самого текста заголовка, а не блока h1 (он во всю ширину)
        head = page.evaluate("""() => { const rg = document.createRange(); rg.selectNodeContents(document.getElementById('pageTitle')); const h = rg.getBoundingClientRect();
            return [...document.querySelectorAll('.home-btn, .theme-toggle, .focus-toggle, .ts-share-btn')].filter(b => { const r = b.getBoundingClientRect(); return r.width && r.bottom > h.top && r.top < h.bottom && r.right > h.left && r.left < h.right; }).length; }""")
        check(f"K: {w} px — заголовок не под кнопками в углах", head == 0, str(head))
        bad = []
        for pid in ("bothpow", "change", "swap", "expswap", "prod", "pow"):
            for lvl in (1, 2, 3):
                page.evaluate(f"() => {{ startRun(['{pid}'], {lvl}); S.sol = true; render(); }}")
                page.wait_for_timeout(60)
                o = page.evaluate("() => document.documentElement.scrollWidth - innerWidth")
                if o > 0:
                    bad.append(f"{pid}{lvl}:{o}")
        check(f"K: {w} px — задания с решением без прокрутки вбок", not bad, str(bad))
        check(f"K: {w} px — без ошибок JS", not errors, str(errors[:1]))
        ctx.close()


def run():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        for t in (test_bank, test_tiles, test_select_and_modes, test_solve, test_parse, test_cards, test_session, test_platform, test_katex, test_phone):
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
