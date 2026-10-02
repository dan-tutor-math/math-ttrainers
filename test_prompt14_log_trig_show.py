"""
Промпт №14 «логарифмы и тригонометрия» (пришёл после №13 «раскладка
заданий»; не путать с №14 нового списка — клавиатурой): logarithms.html,
logarithms-bank.js, trig_equations.html, tile-demo.js/.css, boards-core.js.

Проверяет:
  A. банк логарифмов, уровень Г: для каждого свойства и для случайных
     наборов (до всех десяти) — ответ равен выражению, каждая строка
     решения равна предыдущей (общая цепочка meta.chain) и каждый «кирпич»
     решён верно сам по себе (meta.blocks), итог кирпичей со знаками = ответ;
     в каждом примере задействованы ВСЕ выбранные свойства, одно свойство —
     не меньше трёх раз; у каждого шага решения метка свойства; ответ —
     целое или дробь со знаменателем до 4, не больше 60 по модулю;
     generate(…, { type }) на уровнях А–В отдаёт задание того же вида;
  B. страница логарифмов: ⟳ в шапке задания (тот же уровень, вид и
     свойства, ключ новый, пройденный уровень не поднимает), ⟳ карточки —
     тот же вид; кнопка уровня Г, переход В → Г после трёх верных, метки
     свойств у каждого шага в решении уровня Г, «Подборка»;
  C. «Показать свойство»: только в «Тренировке» (в «Экзамене» ни кнопки, ни
     панели), свойства — метки шагов задания, по очереди (фишки, «2 из 3»,
     переход по фишке), анимация только transform/opacity и один проход —
     в начале части в пути, в конце запись законченная; числа примера не
     из задания: на уровнях А–В ни основание, ни аргументы, ни итог, на
     уровне Г итог никогда не равен ответу; «на буквах», «другой пример»,
     «ещё раз», закрытие, новое задание закрывает; «уменьшить движение» —
     ничего не едет и само не листается; телефон 375/320 — строка примера
     целиком в полосе, без прокрутки вбок;
  D. тригонометрия: ⟳ — то же уравнение по типу и в смешанной тренировке,
     ⟳ карточки тоже; «Показать формулу» у каждой из 27 плиток: пример
     рисуется, функция та же, что в уравнении, числовые примеры не
     совпадают с заданием (частный случай, приведение, аргумент π(x − a)/b,
     отбор корней), в «Экзамене» нет;
  E. совместная сессия (заглушка Supabase из теста №54): учитель открыл
     анимацию — у ученика тот же пример, «на буквах» и закрытие доезжают;
  F. доска, «ещё такое же» («+»): логарифмы — тот же уровень (в том числе
     Г), тот же вид и те же свойства, и у задания из карточки «+» — вид
     карточки; тригонометрия в смешанной тренировке — тот же тип уравнения;
     «Обновить пример» в панели — та же ⟳;
  G. «+» во всех остальных тренажёрах панели (ОГЭ, основа, НОД/НОК,
     «Проценты», движки ОГЭ №9): новое задание того же типа и уровня, и
     после второго задания другого уровня (кадр доски один на тренажёр).

Живой realtime из песочницы не проверить — совместный режим
перепроверяется на сайте руками.

Запуск: python3 test_prompt14_log_trig_show.py [A B …] (сервер поднимается
сам; без аргументов — все блоки).
"""
import contextlib
import http.client
import json
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from test_prompt54_trainer_sync_and_cards import FAKE_LIB  # noqa: E402
from test_prompt12_logarithms import CHECK_JS, SOLVE_JS  # noqa: E402

PORT = 8987
BASE = f"http://127.0.0.1:{PORT}"
FRAME = "document.getElementById('bdTrainersIframe')"
results = []


def check(name, ok, extra=""):
    results.append((name, bool(ok)))
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


def open_page(browser, url, width=1300, height=1000, reduced=None, wait="() => window.__trainerState"):
    ctx = browser.new_context(viewport={"width": width, "height": height}, reduced_motion=reduced or "no-preference")
    # наружу — ничего: иначе страница заводит сессию в настоящей базе (раздел 8 HANDOFF)
    ctx.route("https://**/*", lambda r: r.abort())
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(f"{BASE}/{url}")
    page.wait_for_function(wait)
    page.wait_for_timeout(300)
    # конспект урока снимает экран при каждой смене задания — тест их меняет сотнями
    page.evaluate("() => { if (window.TrainerSession && TrainerSession.setAutosaveHistory) TrainerSession.setAutosaveHistory(false); }")
    return ctx, page, errors


def open_show(page):
    """Открыть «Показать свойство» и дождаться панели. Кнопку жмём скриптом:
    под ней в этот момент плавно меняет высоту панель задания
    (setupAutoHeightAnimation), и щелчок мышью изредка уходил мимо."""
    page.evaluate("() => { if (!(S.show && S.task && S.show.key === S.task.key)) document.getElementById('propShowBtn').click(); }")
    page.wait_for_function("() => !!document.querySelector('#propShow .pshow')", timeout=5000)


# ─── A. банк, уровень Г ───
BLOCKS_JS = r"""(CHECK) => {
  const C = eval(CHECK);
  const close = (u, v) => isFinite(u) && isFinite(v) && Math.abs(u - v) <= 1e-7 * Math.max(1, Math.abs(v));
  const val = s => { s = String(s); if (s.indexOf('/') >= 0){ const [p, q] = s.split('/').map(Number); return p / q; } return Number(s); };
  const env = { ANS: 0 };
  const ids = LOG_BANK.props.map(p => p.id);
  const out = { n: 0, errs: [], lvlBad: 0, missProps: [], fewSingle: [], untagged: 0, ansBad: [], samples: [] };
  const sets = [];
  ids.forEach(id => { for (let i = 0; i < 60; i++) sets.push([id]); });
  for (let i = 0; i < 400; i++) { const k = 2 + (i % 9); sets.push(ids.slice().sort(() => Math.random() - .5).slice(0, k)); }
  for (let i = 0; i < 40; i++) sets.push(ids.slice());
  sets.forEach(sel => {
    const t = LOG_BANK.generate(sel, 4); out.n++;
    if (t.lvl !== 4 || t.type !== 'calc' || t.kind !== 'calc') { out.lvlBad++; return; }
    const e = C.checkTask(t);
    const blocks = t.meta.blocks || [];
    let sum = 0;
    blocks.forEach((b, bi) => {
      for (let j = 1; j < b.chain.length; j++) if (!close(C.ev(b.chain[j - 1], env), C.ev(b.chain[j], env))) e.push('кирпич ' + bi + ': строка ' + j + ' не равна предыдущей');
      if (!close(C.ev(b.chain[b.chain.length - 1], env), val(b.val))) e.push('кирпич ' + bi + ' кончается не своим значением');
      sum += b.sign * val(b.val);
    });
    if (!close(sum, val(t.fields[0].value))) e.push('сумма кирпичей ' + sum + ' ≠ ответ ' + t.fields[0].value);
    if (blocks.length < 3) e.push('кирпичей меньше трёх');
    if (e.length) out.errs.push(e.join('; ') + ' | ' + t.peek);
    if (!sel.every(s => t.props.indexOf(s) >= 0)) out.missProps.push(sel.join() + ' → ' + t.props.join());
    if (sel.length === 1) {
      const uses = t.steps.filter(h => h.indexOf(LOG_BANK.propById(sel[0]).title.toLowerCase()) >= 0).length;
      if (uses < 3) out.fewSingle.push(sel[0] + ': ' + uses);
    }
    if (t.steps.some(h => h.indexOf('prop-tag') < 0)) out.untagged++;
    const [p, q] = String(t.fields[0].value).split('/').map(Number);
    if ((q || 1) > 4 || Math.abs(p / (q || 1)) > 60) out.ansBad.push(t.fields[0].value);
    if (out.samples.length < 3 && sel.length > 3) out.samples.push(t.peek + ' = ' + t.fields[0].value);
  });
  return out;
}"""

TYPES_JS = r"""() => {
  const bad = [];
  let n = 0;
  LOG_BANK.props.forEach(p => { for (let L = 1; L <= 3; L++) {
    const types = new Set();
    for (let i = 0; i < 150; i++) types.add(LOG_BANK.generate([p.id], L).type);
    types.forEach(ty => { for (let i = 0; i < 8; i++) { n++; const t = LOG_BANK.generate([p.id], L, { type: ty });
      if (t.type !== ty || t.lvl !== L || t.pid !== p.id) bad.push(p.id + L + ':' + ty + '→' + t.type + '/' + t.lvl); } });
  } });
  // смешанная тренировка: вид ищется у всех свойств тренировки
  for (let i = 0; i < 60; i++) { n++; const t = LOG_BANK.generate(['unit', 'change'], 1, { type: 'know' });
    if (t.type !== 'know' || ['unit', 'change'].indexOf(t.pid) < 0) bad.push('unit,change:know→' + t.pid + '/' + t.type); }
  return { n, bad: bad.slice(0, 5), nbad: bad.length };
}"""


def test_bank(browser):
    ctx, page, errors = open_page(browser, "logarithms.html")
    r = page.evaluate(BLOCKS_JS, CHECK_JS)
    check(f"A: уровень Г — {r['n']} примеров, все уровня Г и вида «вычислить»", r["lvlBad"] == 0, str(r["lvlBad"]))
    check("A: ответ = выражение, строки решения и каждый кирпич верны, сумма кирпичей = ответ", not r["errs"], "; ".join(r["errs"][:3]))
    check("A: в каждом примере задействованы все выбранные свойства", not r["missProps"], "; ".join(r["missProps"][:3]))
    check("A: одно свойство — применяется не меньше трёх раз", not r["fewSingle"], "; ".join(r["fewSingle"][:5]))
    check("A: у каждого шага решения метка", r["untagged"] == 0, str(r["untagged"]))
    check("A: ответ — целое или дробь со знаменателем до 4, не больше 60", not r["ansBad"], str(r["ansBad"][:5]))
    t = page.evaluate(TYPES_JS)
    check(f"A: generate(…, {{ type }}) на уровнях А–В — тот же вид ({t['n']} заданий)", t["nbad"] == 0, str(t["bad"]))
    print("    пример уровня Г:", r["samples"][:1])
    check("A: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── B. ⟳, уровень Г, карточки ───
def test_page(browser):
    ctx, page, errors = open_page(browser, "logarithms.html")
    page.evaluate("() => startRun(['prod', 'quot', 'swap'], 2)")
    vis = page.evaluate("() => { const b = document.getElementById('refreshBtn'); const r = b.getBoundingClientRect(); return !!(r.width && b.closest('.corner')); }")
    check("B: ⟳ в шапке задания, рядом с 📥", vis)
    bad = []
    for lvl in (1, 2, 3, 4):
        page.evaluate(f"() => setLevel({lvl})")
        for _ in range(12):
            before = page.evaluate("() => ({ k: S.task.key, l: S.task.lvl, t: S.task.type, p: S.props.join() })")
            page.click("#refreshBtn")
            after = page.evaluate("() => ({ k: S.task.key, l: S.task.lvl, t: S.task.type, p: S.props.join(), pid: S.task.pid })")
            if after["k"] == before["k"] or after["l"] != before["l"] or after["t"] != before["t"] or after["p"] != before["p"] or after["pid"] not in ("prod", "quot", "swap"):
                bad.append(f"{before} → {after}")
    check("B: ⟳ — новое задание того же уровня, вида и на те же свойства (А–Г)", not bad, "; ".join(bad[:3]))
    # пройденный уровень ⟳ не поднимает, «Следующее задание» — поднимает
    page.evaluate("() => setLevel(3)")
    for _ in range(3):
        page.evaluate(f"() => {{ ({SOLVE_JS})(-1); if (S.lvlUp) return; newTask(); }}")
    up = page.evaluate("() => S.lvlUp")
    page.click("#refreshBtn")
    still = page.evaluate("() => [S.lvl, S.task.lvl, S.lvlUp]")
    page.evaluate("() => newTask()")
    nxt = page.evaluate("() => [S.lvl, S.task.lvl, document.querySelector('.lvl-chip.active').textContent]")
    check("B: после трёх верных на В — уровень пройден; ⟳ остаётся на В, «Следующее» открывает Г",
          up and still == [3, 3, True] and nxt == [4, 4, "Г"], f"{up} {still} {nxt}")
    lab = page.evaluate("() => document.querySelector('#logQuestion .log-kind').textContent")
    check("B: подпись задания — «… · уровень Г»", "уровень Г" in lab, lab)
    page.evaluate("() => { S.sol = true; render(); }")
    sol = page.evaluate("() => ({ steps: document.querySelectorAll('#solSteps .sol-step').length, tags: document.querySelectorAll('#solSteps .sol-step .prop-tag').length, blk: document.querySelectorAll('#solSteps .blk-no').length })")
    check("B: решение уровня Г — у каждого шага метка, кирпичи пронумерованы", sol["steps"] > 3 and sol["tags"] == sol["steps"] and sol["blk"] >= 3, str(sol))
    # карточки «+»: ⟳ у карточки — тот же уровень и вид
    page.evaluate("() => setLevel(2)")
    page.click("#addRailToggle")
    page.click('.add-qty-btn[data-n="2"]')
    bad = []
    for _ in range(10):
        b0 = page.evaluate("() => ({ k: S.cards[1].task.key, l: S.cards[1].task.lvl, t: S.cards[1].task.type })")
        page.click('.added-task-card[data-idx="1"] .added-refresh-btn')
        a0 = page.evaluate("() => ({ k: S.cards[1].task.key, l: S.cards[1].task.lvl, t: S.cards[1].task.type })")
        if a0["k"] == b0["k"] or a0["l"] != b0["l"] or a0["t"] != b0["t"]:
            bad.append(f"{b0}→{a0}")
    check("B: ⟳ карточки — тот же уровень и вид", not bad, "; ".join(bad[:2]))
    page.evaluate("() => { Basket.clear(); setLevel(4); }")
    page.click("#basketAddBtn")
    it = page.evaluate("() => Basket.all()[0]")
    check("B: «В подборку» из уровня Г — смешанная тренировка и уровень Г", it and it["modeTitle"].endswith("уровень Г") and "Вперемешку" in it["modeTitle"], str(it and it["modeTitle"]))
    page.evaluate("() => Basket.clear()")
    check("B: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── C. «Показать свойство» ───
PANEL_JS = """() => { const p = document.getElementById('propShow'); const b = document.getElementById('propShowBtn');
  return { btn: !!b.getClientRects().length, btnText: b.textContent, open: !!p.getClientRects().length && !!p.querySelector('.pshow'),
           label: (p.querySelector('.pshow-label') || {}).textContent || '', title: (p.querySelector('.pshow-title') || {}).textContent || '',
           chips: p.querySelectorAll('.pshow-chip').length, on: [...p.querySelectorAll('.pshow-chip')].findIndex(c => c.classList.contains('on')),
           demo: (p.querySelector('.demo .demo-line') || {}).textContent || '', mv: !!p.querySelector('.demo .mv'),
           formula: (p.querySelector('.pshow-formula') || {}).innerHTML || '', show: S.show ? JSON.parse(JSON.stringify(S.show)) : null }; }"""

# анимации полосы: имена keyframes, что в них меняется, сколько проходов
ANIM_JS = """() => { const anims = document.querySelector('#propShow .pshow-strip').getAnimations({ subtree: true });
  const props = new Set(), names = new Set(), iters = new Set();
  anims.forEach(a => { names.add(a.animationName); iters.add(a.effect.getComputedTiming().iterations);
    a.effect.getKeyframes().forEach(k => Object.keys(k).forEach(x => { if (!['offset', 'computedOffset', 'easing', 'composite'].includes(x)) props.add(x); })); });
  return { n: anims.length, names: [...names], props: [...props], iters: [...iters] }; }"""

# «обе части»: неподвижная левая часть, «=» и результат
KEEP_JS = """() => { const line = document.querySelector('#propShow .demo-line'); const keep = line.querySelector('.keep');
  const eq = keep && keep.nextElementSibling;
  return { left: keep ? keep.textContent.replace(/\\s+/g, '') : '', eq: eq ? eq.textContent : '', text: line.textContent.replace(/\\s+/g, '') }; }"""
# первый кадр: каждая едущая часть стоит поверх такой же части левой половины
START_JS = """() => { const strip = document.querySelector('#propShow .pshow-strip');
  strip.getAnimations({ subtree: true }).forEach(a => { a.pause(); a.currentTime = 0; });
  const line = strip.querySelector('.demo-line'), stat = [...line.querySelector('.keep').children];
  const bad = []; let n = 0;
  line.querySelectorAll(':scope > .mvk').forEach(e => { n++; const r = e.getBoundingClientRect();
    const ok = stat.some(x => { const q = x.getBoundingClientRect(); return x.textContent === e.textContent && Math.abs(q.left - r.left) < 1.5 && Math.abs(q.top - r.top) < 1.5; });
    if (!ok) bad.push(e.textContent); });
  strip.getAnimations({ subtree: true }).forEach(a => a.finish());
  return { n, bad }; }"""
TR_JS = """() => [...document.querySelectorAll('#propShow .demo .mvk')].map(e => getComputedStyle(e).transform)"""


def test_show(browser):
    ctx, page, errors = open_page(browser, "logarithms.html")
    page.evaluate("() => startRun(['prod'], 1)")
    p = page.evaluate(PANEL_JS)
    check("C: в «Тренировке» кнопка «Показать свойство» есть, панель закрыта", p["btn"] and not p["open"] and "Показать свойство" in p["btnText"], str(p))
    page.click("#tabExam")
    p = page.evaluate(PANEL_JS)
    check("C: в «Экзамене» кнопки нет", not p["btn"], str(p))
    page.click("#tabPractice")
    open_show(page)
    page.wait_for_timeout(250)
    p = page.evaluate(PANEL_JS)
    check("C: по кнопке — панель со свойством задания (как на плитке: метка, название, формула, пример)",
          p["open"] and p["title"] == "Логарифм произведения" and p["chips"] == 0 and "log" in p["formula"] and p["demo"], str(p))
    a = page.evaluate(ANIM_JS)
    check("C: анимация — только transform и opacity, один проход", a["n"] > 3 and set(a["props"]) <= {"transform", "opacity"} and a["iters"] == [1], str(a))
    mid = page.evaluate(TR_JS)
    page.wait_for_timeout(4700)
    end = page.evaluate(TR_JS)
    check("C: в начале части в пути, после прохода запись законченная",
          any(t != "none" for t in mid) and all(t == "none" for t in end), f"{mid} / {end}")
    fin = page.evaluate(KEEP_JS)
    check("C: после прохода видна вся формула: левая часть, «=», правая", fin["left"] and fin["eq"] == "=" and fin["text"].startswith(fin["left"]) and len(fin["text"]) > len(fin["left"]) + 2, str(fin))
    st = page.evaluate(START_JS)
    check("C: в первом кадре части стоят точно на левой части и выезжают из неё", st["n"] > 0 and st["bad"] == [], str(st))
    check("C: кнопка теперь «Скрыть свойство»", "Скрыть" in page.evaluate("() => document.getElementById('propShowBtn').textContent"))
    page.click("#tabExam")
    p = page.evaluate(PANEL_JS)
    check("C: переход в «Экзамен» закрывает панель", not p["open"] and not p["show"], str(p))
    page.click("#tabPractice")

    # несколько свойств в задании — по очереди
    page.evaluate("() => { startRun(['swap'], 3); let i = 0; while (S.task.props.length < 2 && i++ < 200) newTask(); }")
    props = page.evaluate("() => S.task.props")
    open_show(page)
    page.wait_for_timeout(200)
    p0 = page.evaluate(PANEL_JS)
    page.wait_for_timeout(5600)
    p1 = page.evaluate(PANEL_JS)
    check(f"C: в задании {len(props)} свойства — фишки, «1 из …», через проход — следующее",
          len(props) >= 2 and p0["chips"] == len(props) and p0["label"] == f"Свойство 1 из {len(props)}" and p0["on"] == 0 and p1["on"] == 1 and p1["label"].startswith("Свойство 2"),
          f"{props} {p0['label']} {p0['on']} → {p1['label']} {p1['on']}")
    page.click('#propShow .pshow-chip[data-i="0"]')
    page.wait_for_timeout(150)
    p2 = page.evaluate(PANEL_JS)
    check("C: фишка — сразу к своему свойству", p2["on"] == 0 and p2["show"]["start"] == 0, str(p2["show"]))

    # «на буквах», «другой пример», «ещё раз» — про выбранное свойство, а не
    # с первого (так было до правки: выбрал второе — показывало первое)
    page.click('#propShow .pshow-chip[data-i="1"]')
    page.wait_for_timeout(150)
    page.click('#propShow .pshow-seg button[data-v="let"]')
    page.wait_for_timeout(150)
    p3 = page.evaluate(PANEL_JS)
    check("C: «на буквах» — общий вид буквами, без чисел примера", p3["show"]["mode"] == "let" and p3["mv"] and not p3["formula"] and all(it["p"] is None for it in p3["show"]["items"]), str(p3["show"]))
    check("C: «на буквах» — остаётся выбранное (второе) свойство", p3["on"] == 1 and p3["label"].startswith("Свойство 2"), f"{p3['on']} {p3['label']}")
    page.click('#propShow .pshow-seg button[data-v="num"]')
    page.wait_for_timeout(150)
    check("C: «на числах» — тоже второе свойство", page.evaluate(PANEL_JS)["on"] == 1)
    a1 = page.evaluate("() => S.show.items.map(it => JSON.stringify(it))")
    changed, kept, stays = False, True, True
    for _ in range(6):
        page.click("#propShow .pshow-reroll")
        page.wait_for_timeout(80)
        a2 = page.evaluate("() => S.show.items.map(it => JSON.stringify(it))")
        stays = stays and page.evaluate(PANEL_JS)["on"] == 1
        kept = kept and all(a2[k] == a1[k] for k in range(len(a1)) if k != 1)
        if a2[1] != a1[1]:
            changed = True
            break
    check("C: «Другой пример» — новые числа у выбранного свойства, остальные не тронуты, на экране оно же", changed and kept and stays, f"{changed} {kept} {stays}")
    n0 = page.evaluate("() => S.show.n")
    page.click("#propShow .pshow-replay")
    page.wait_for_timeout(100)
    check("C: «Ещё раз» — проход заново того же свойства", page.evaluate("() => S.show.n") == n0 + 1 and page.evaluate(PANEL_JS)["on"] == 1)
    page.click("#propShow .pshow-x")
    check("C: ✕ закрывает", not page.evaluate(PANEL_JS)["open"])
    open_show(page)
    page.click("#refreshBtn")
    check("C: новое задание закрывает панель", not page.evaluate(PANEL_JS)["open"])

    # числа примера не из задания
    r = page.evaluate("""() => { const res = { n: 0, hard: [], eq: 0, l4hits: 0, l4n: 0, same: [] };
      for (let L = 1; L <= 4; L++) for (let i = 0; i < 300; i++) {
        const sel = L < 4 ? [PROP_IDS[i % 10]] : PROP_IDS.slice().sort(() => Math.random() - .5).slice(0, 1 + i % 10);
        const t = LOG_BANK.generate(sel, L), avoid = taskNums(t), ans = taskAnswer(t);
        showItems(t, 'num').forEach(it => { res.n++; const c = demoClash(DEMO_NUM[it.pid].key(it.p), avoid, ans);
          if (c.resEq) res.eq++;
          if (L < 4 && c.hard) res.hard.push(it.pid + JSON.stringify(it.p) + ' | ' + t.peek);
          if (L === 4) { res.l4n++; if (c.hard) res.l4hits++; }
          const html = plainText(DEMO_NUM[it.pid].spec(it.p).from);
          if (plainText(t.text).indexOf(html) >= 0) res.same.push(html); }); }
      return res; }""")
    check(f"C: уровни А–В — основание, аргументы и итог примера не из задания ({r['n']} примеров)", not r["hard"], "; ".join(r["hard"][:3]))
    check("C: итог примера никогда не равен ответу задания (и на уровне Г)", r["eq"] == 0, str(r["eq"]))
    check(f"C: уровень Г — совпадения отдельных чисел редки ({r['l4hits']} из {r['l4n']})", r["l4hits"] <= r["l4n"] * 0.08, str(r["l4hits"]))
    check("C: запись примера ни разу не совпала с заданием", not r["same"], str(r["same"][:3]))
    # все десять свойств рисуются в обоих видах
    bad = page.evaluate("""() => { const bad = []; for (const id of PROP_IDS) for (const m of ['num', 'let']) {
        const it = { pid: id, p: m === 'num' ? DEMO_NUM[id].gen() : null }, v = showView(it, m);
        if (!v.spec.from || !v.spec.to || v.spec.from === v.spec.to || /undefined|NaN/.test(v.spec.from + v.spec.to)) bad.push(id + m); }
      return bad; }""")
    check("C: пример каждого из 10 свойств — и на числах, и на буквах", not bad, str(bad))
    # логика формулы после прохода: «левая часть = результат», результат не
    # повторяет левую часть (так было у основного тождества: «… = … = b») и
    # в строке ровно одна левая часть
    bad = []
    for pid in ["ident", "unit", "prod", "quot", "pow", "basepow", "bothpow", "change", "swap", "expswap"]:
        for mode in ("num", "let"):
            r = page.evaluate(f"""() => {{ startRun(['{pid}'], 1); S.show = {{ key: S.task.key, mode: '{mode}', items: showItems(S.task, '{mode}'), start: 0, n: 0 }}; render();
                document.querySelector('#propShow .pshow-strip').getAnimations({{ subtree: true }}).forEach(a => a.finish());
                const line = document.querySelector('#propShow .demo-line'), keep = line.querySelector('.keep');
                const right = [...line.children].filter(e => e !== keep && !e.classList.contains('ghost')).slice(1).map(e => e.textContent).join('').replace(/\\s+/g, '');
                return {{ left: keep.textContent.replace(/\\s+/g, ''), right }}; }}""")
            if not r["right"] or r["right"].startswith(r["left"]) or r["left"] in r["right"]:
                bad.append(f"{pid}/{mode}: {r}")
    check("C: после прохода — «левая часть = результат», результат не повторяет левую часть", not bad, "; ".join(bad[:3]))
    check("C: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    # уменьшить движение: ничего не едет и само не листается
    ctx, page, errors = open_page(browser, "logarithms.html", reduced="reduce")
    page.evaluate("() => { startRun(['swap'], 3); let i = 0; while (S.task.props.length < 2 && i++ < 200) newTask(); }")
    open_show(page)
    page.wait_for_timeout(300)
    a = page.evaluate(ANIM_JS)
    tr = page.evaluate(TR_JS)
    page.wait_for_timeout(5800)
    check("C: «уменьшить движение» — анимаций нет, запись законченная, свойство не листается само",
          a["n"] == 0 and all(t == "none" for t in tr) and page.evaluate(PANEL_JS)["on"] == 0, f"{a} {tr}")
    ctx.close()

    # телефон
    for w in (375, 320):
        ctx, page, errors = open_page(browser, "logarithms.html", width=w, height=800)
        bad = []
        for sel, lvl in ((["prod"], 1), (["quot"], 2), (["change"], 2), (["expswap"], 1), (["bothpow"], 1), (["swap"], 3), (["prod", "pow", "change"], 4)):
            page.evaluate(f"() => startRun({json.dumps(sel)}, {lvl})")
            # на телефоне кнопку может прикрывать клавиатура — жмём скриптом
            page.evaluate("() => document.getElementById('propShowBtn').click()")
            page.wait_for_timeout(250)
            for i in range(page.evaluate("() => S.show.items.length")):
                page.evaluate(f"() => {{ const c = document.querySelector('#propShow .pshow-chip[data-i=\"{i}\"]'); if (c) c.click(); }}")
                page.wait_for_timeout(120)
                m = page.evaluate("""() => { const s = document.querySelector('#propShow .pshow-strip').getBoundingClientRect();
                    const l = document.querySelector('#propShow .demo-line').getBoundingClientRect();
                    return { over: document.documentElement.scrollWidth - innerWidth, inside: l.left >= s.left - 1 && l.right <= s.right + 1 }; }""")
                if m["over"] > 0 or not m["inside"]:
                    bad.append(f"{sel}{lvl}#{i}:{m}")
            page.evaluate("() => document.getElementById('propShowBtn').click()")
        check(f"C: {w} px — пример целиком в полосе, без прокрутки вбок", not bad, "; ".join(bad[:3]))
        over = []
        for i in range(40):
            page.evaluate(f"() => {{ startRun(PROP_IDS.slice().sort(() => Math.random() - .5).slice(0, {1 + i % 10}), 4); S.sol = true; render(); }}")
            # разбор выезжает анимацией — меряем, когда встал на место
            page.wait_for_timeout(450)
            o = page.evaluate("""() => { const o = document.documentElement.scrollWidth - innerWidth; if (o <= 0) return null;
                const all = [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1);
                return o + ': ' + S.task.peek + ' | ' + all.filter(e => !all.some(x => x !== e && e.contains(x))).slice(0, 3).map(e => e.className + ':' + e.textContent.slice(0, 20)).join(', '); }""")
            if o:
                over.append(o)
        check(f"C: {w} px — длинные примеры уровня Г с решением без прокрутки вбок", not over, "; ".join(over[:2]))
        check(f"C: {w} px — без ошибок JS", not errors, str(errors[:1]))
        ctx.close()


# ─── D. тригонометрия ───
def test_trig(browser):
    ctx, page, errors = open_page(browser, "trig_equations.html")
    page.evaluate("() => startRun(['kx', 'fac', 'circ', 'egeArg'])")
    bad = []
    for _ in range(20):
        b0 = page.evaluate("() => ({ k: S.task.key, pid: S.task.pid, p: S.props.join() })")
        page.click("#refreshBtn")
        a0 = page.evaluate("() => ({ k: S.task.key, pid: S.task.pid, p: S.props.join() })")
        if a0["k"] == b0["k"] or a0["pid"] != b0["pid"] or a0["p"] != b0["p"]:
            bad.append(f"{b0}→{a0}")
        page.evaluate("() => newTask()")
    check("D: ⟳ — другое уравнение того же типа и в смешанной тренировке", not bad, "; ".join(bad[:2]))
    page.click("#addRailToggle")
    page.click('.add-qty-btn[data-n="1"]')
    bad = []
    for _ in range(10):
        b0 = page.evaluate("() => S.cards[0].task.pid")
        page.click('.added-task-card[data-idx="0"] .added-refresh-btn')
        if page.evaluate("() => S.cards[0].task.pid") != b0:
            bad.append(b0)
    check("D: ⟳ карточки — тот же тип", not bad, str(bad))
    page.evaluate("() => clearCards()")

    ids = page.evaluate("() => TRIG_BANK.tiles.map(t => t.id)")
    bad, clash = [], []
    for tid in ids:
        for k in range(6):
            page.evaluate(f"() => startRun(['{tid}'])")
            if k == 0:
                open_show(page)
                page.wait_for_timeout(120)
                p = page.evaluate(PANEL_JS)
                f = page.evaluate("() => (String(S.task.peek).match(/ctg|sin|cos|tg/) || [''])[0]")
                if not (p["open"] and p["demo"] and "Формула" in p["label"]):
                    bad.append(f"{tid}: {p}")
                # функция примера — та же, что в уравнении (у простейших и составного аргумента)
                if tid in ("arc", "shift", "kx", "xk", "lin", "tc2", "quad") and f and ("arc" + f if tid != "quad" else f) not in p["demo"]:
                    bad.append(f"{tid}: функция {f} — в примере {p['demo'][:40]}")
            r = page.evaluate("""() => { const t = S.task, it = showItemsFor(t)[0], D = TRIG_SHOW[t.pid];
                const v = showView(it), plainFrom = v.spec.from.replace(/<[^>]+>/g, '').replace(/\\s+/g, '');
                const out = { pid: t.pid, peek: t.peek, clash: '' };
                const peek = String(t.peek).replace(/\\s+/g, '');
                if (t.pid === 'spec') { const c = SPEC_CASES[it.p.i], g = t.meta.good.list[0]; const ga = (g.c + g.a) / Math.PI, gp = g.p / Math.PI;
                  if (near(c.p, gp) && near(modP(c.a, c.p), modP(ga, gp))) out.clash = 'тот же частный случай'; }
                if (t.pid === 'red' && peek.indexOf(RED_CASES[it.p.i].key) >= 0) out.clash = 'та же формула приведения';
                if (t.pid === 'egeArg') { const used = (peek.match(/\\d+/g) || []).map(Number); if (used.indexOf(it.p.s) >= 0 || used.indexOf(it.p.d) >= 0 || egeArgRoot(it.p.s, it.p.d) === t.meta.good.num) out.clash = 'числа из уравнения'; }
                if (['circ', 'enum', 'ab', 'ineq'].indexOf(t.pid) >= 0) { const ex = (t.pid === 'ineq' ? INEQ_DEMOS : SEL_DEMOS[t.pid])[it.p.i];
                  if (sameSeg(ex.seg, taskSeg(t)) && ex.roots.length === taskRoots(t).length && ex.roots.every(r => taskRoots(t).some(q => near(q, r)))) out.clash = 'тот же отбор'; }
                // у формул (cos 2x = 1 − 2 sin² x) запись и должна быть из задания — сверяем только числовые примеры
                if (D.num && plainFrom && peek.indexOf(plainFrom) >= 0) out.clash = 'запись совпала';
                return out; }""")
            if r["clash"]:
                clash.append(f"{r['pid']}: {r['clash']} | {r['peek']}")
    check("D: «Показать формулу» у каждой из 27 плиток — пример рисуется, функция та же, что в уравнении", not bad, "; ".join(bad[:3]))
    check("D: числовые примеры (частные случаи, приведение, π(x − a)/b, отбор корней) не совпадают с заданием", not clash, "; ".join(clash[:3]))
    page.click("#tabExam")
    check("D: в «Экзамене» кнопки нет", not page.evaluate(PANEL_JS)["btn"])
    a = None
    page.click("#tabPractice")
    page.evaluate("() => startRun(['sin'])")
    open_show(page)
    page.wait_for_timeout(200)
    a = page.evaluate(ANIM_JS)
    check("D: анимация формулы — только transform и opacity, один проход", a["n"] > 3 and set(a["props"]) <= {"transform", "opacity"} and a["iters"] == [1], str(a))
    check("D: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    for w in (375, 320):
        ctx, page, errors = open_page(browser, "trig_equations.html", width=w, height=800)
        bad = []
        for tid in ids:
            page.evaluate(f"() => startRun(['{tid}'])")
            page.evaluate("() => document.getElementById('propShowBtn').click()")
            page.wait_for_timeout(120)
            m = page.evaluate("""() => { const s = document.querySelector('#propShow .pshow-strip').getBoundingClientRect();
                const l = document.querySelector('#propShow .demo-line').getBoundingClientRect();
                return { over: document.documentElement.scrollWidth - innerWidth, inside: l.left >= s.left - 1 && l.right <= s.right + 1 }; }""")
            if m["over"] > 0 or not m["inside"]:
                bad.append(f"{tid}:{m}")
        check(f"D: {w} px — формула целиком в полосе, без прокрутки вбок", not bad, "; ".join(bad[:4]))
        check(f"D: {w} px — без ошибок JS", not errors, str(errors[:1]))
        ctx.close()


# ─── E. совместная сессия ───
def test_session(browser):
    ctx = browser.new_context(viewport={"width": 1300, "height": 1000})
    errors = []

    def mk(url):
        page = ctx.new_page()
        page.add_init_script("try { localStorage.setItem('tsStage:pref', 'off'); } catch (e) {}")
        page.route("**/supabase-js.umd.js", lambda route: route.fulfill(status=200, content_type="application/javascript", body=FAKE_LIB))
        page.route("**/fonts.googleapis.com/**", lambda route: route.abort())
        page.route("**/fonts.gstatic.com/**", lambda route: route.abort())
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"{BASE}/{url}")
        page.wait_for_function("() => window.__trainerState")
        return page

    for url, start in (("logarithms.html", "startRun(['swap'], 3); let i = 0; while (S.task.props.length < 2 && i++ < 200) newTask();"),
                       ("trig_equations.html", "startRun(['circ'])")):
        teacher = mk(url)
        teacher.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()", timeout=10000)
        code = teacher.evaluate("() => window.TrainerSession.getCode()")
        student = mk(f"{url}?s={code}")
        student.wait_for_timeout(1500)
        teacher.evaluate(f"() => {{ {start} }}")
        teacher.wait_for_timeout(1200)
        open_show(teacher)
        teacher.wait_for_timeout(1200)
        demo = lambda pg: pg.evaluate("() => { const l = document.querySelector('#propShow .demo-line'); return l ? l.textContent : null; }")
        same = student.evaluate("() => JSON.stringify(S.show)") == teacher.evaluate("() => JSON.stringify(S.show)")
        check(f"E: {url}: учитель открыл анимацию — у ученика тот же пример", same and demo(student) and demo(student) == demo(teacher), f"{demo(student)} / {demo(teacher)}")
        if url == "logarithms.html":
            teacher.click('#propShow .pshow-seg button[data-v="let"]')
            teacher.wait_for_timeout(1200)
            check("E: «на буквах» доехало до ученика", student.evaluate("() => S.show && S.show.mode") == "let" and demo(student) == demo(teacher))
        teacher.click("#propShow .pshow-x")
        teacher.wait_for_timeout(1200)
        check(f"E: {url}: закрыл учитель — закрылось у ученика", student.evaluate("() => !S.show && !document.querySelector('#propShow .pshow')"))
        teacher.close()
        student.close()
    check("E: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── F, G. доска: «ещё такое же» ───
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


def open_board(browser):
    ctx = browser.new_context(viewport={"width": 1400, "height": 900})
    ctx.route("https://**/*", lambda r: r.abort())
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(f"{BASE}/boards.html")
    page.evaluate(SEED_JS, [[LITE], {"bA": {"objects": [], "imageLib": []}}])
    page.reload()
    page.evaluate(BOOT_JS)
    page.wait_for_function("() => window.getDB && window.getDB().boards.length >= 1")
    page.evaluate("() => window.openBoard('bA')")
    page.wait_for_function("() => window.getCurrentBoard() && Array.isArray(window.getCurrentBoard().objects)")
    page.evaluate("() => setTrainersPanel('open')")
    page.wait_for_timeout(300)
    return ctx, page, errors


def open_trainer(page, tid, href):
    page.evaluate("() => setTrainersPanel('open')")
    page.evaluate(f"() => openTrainerInPanel({json.dumps(tid)}, {json.dumps(href)}, {json.dumps(tid)})")
    page.wait_for_function(f"""() => {{ try {{ const f = {FRAME};
        return f.contentDocument.readyState === 'complete' && typeof f.contentWindow.tsGetState === 'function'; }}
        catch (e) {{ return false; }} }}""", timeout=20000)
    page.wait_for_timeout(500)


def fx(page, expr):
    return page.evaluate(f"() => {FRAME}.contentWindow.eval({json.dumps(expr)})")


def add_to_board(page, selector=None):
    n = page.evaluate("() => getCurrentBoard().objects.length")
    page.evaluate("() => setTrainersPanel('open')")
    page.click("#bdTrainersAddBtn")
    page.wait_for_function(f"() => getCurrentBoard().objects.length > {n} && !document.getElementById('bdTrainersAddBtn').disabled", timeout=30000)
    page.wait_for_timeout(200)
    objs = page.evaluate("() => getCurrentBoard().objects.map(o => o.id)")
    return objs[n:]


def plus(page, oid):
    """«ещё такое же» вниз; возвращает подпись нового задания в кадре доски."""
    page.evaluate("() => setTrainersPanel('collapsed')")
    page.evaluate(f"""() => {{ const o = getCurrentBoard().objects.find(x => x.id === {json.dumps(oid)});
        if (window.revealWorldRect) revealWorldRect({{ x: o.x, y: o.y, w: o.w, h: o.h }}); boardsRedraw(); }}""")
    page.wait_for_timeout(200)
    n = page.evaluate("() => getCurrentBoard().objects.length")
    sel = f'.bd-task[data-id="{oid}"]'
    ok = page.evaluate(f"() => {{ const b = document.querySelector('{sel} .bd-task-more'); if (!b) return false; b.click(); return true; }}")
    if not ok:
        return None
    page.wait_for_timeout(150)
    page.evaluate(f"() => document.querySelector('{sel} .bd-task-dirs button[data-dir=\"down\"]').click()")
    page.wait_for_function(f"() => getCurrentBoard().objects.length > {n}", timeout=40000)
    page.wait_for_timeout(200)
    return page.evaluate("() => getCurrentBoard().objects.slice(-1)[0].id")


def gen_eval(page, expr):
    return page.evaluate("(e) => { const fr = [...document.querySelectorAll('iframe.bd-gen-frame')].slice(-1)[0]; try { return fr.contentWindow.eval(e); } catch (err) { return 'ERR ' + err.message; } }", expr)


def test_board(browser):
    ctx, page, errors = open_board(browser)
    open_trainer(page, "logarithms", "logarithms.html")
    sig = "S.task.lvl + '/' + S.task.type + '/' + S.props.join()"
    bad = []
    # уровень Б: каждый вид задания на prod, потом уровень Г смешанной тренировки
    for lvl, props in ((2, ["prod"]), (1, ["quot", "swap"]), (3, ["pow"]), (4, ["prod", "change", "swap"])):
        fx(page, f"startRun({json.dumps(props)}, {lvl})")
        types = sorted(set(fx(page, f"(function(){{ const s = new Set(); for (let i = 0; i < 80; i++) s.add(LOG_BANK.generate({json.dumps(props)}, {lvl}).type); return [...s]; }})()")))
        for ty in types[:3]:
            fx(page, f"drawTask(LOG_BANK.generate(S.props, {lvl}, {{ type: {json.dumps(ty)} }}), true)")
            want = fx(page, sig)
            label = fx(page, "document.querySelector('#logQuestion .log-kind').textContent")
            oid = add_to_board(page)[0]
            g = page.evaluate(f"() => getCurrentBoard().objects.find(o => o.id === {json.dumps(oid)}).gen.snap")
            got = []
            for _ in range(2):
                nid = plus(page, oid)
                got.append(gen_eval(page, sig) if nid else "нет +")
                html = page.evaluate(f"() => getCurrentBoard().objects.find(o => o.id === {json.dumps(nid)}).gen.html") if nid else ""
                if label not in (html or ""):
                    got.append("на картинке не «" + label + "»")
            if any(x != want for x in got) or g.get("lvl") != lvl or g.get("type") != ty:
                bad.append(f"{want} → {got} (снимок {g})")
    check("F: логарифмы — «+» того же уровня (А–Г), того же вида и на те же свойства", not bad, "; ".join(bad[:3]))
    # задание из карточки «+»: вид карточки, а не основного
    fx(page, "startRun(['prod', 'quot'], 2); drawTask(LOG_BANK.generate(S.props, 2, { type: 'calc' }), true)")
    fx(page, "S.cards = [freshCard(LOG_BANK.generate(S.props, 2, { type: 'rev' }))]; renderCards(true); render()")
    ids = add_to_board(page)
    snaps = page.evaluate(f"() => {json.dumps(ids)}.map(id => getCurrentBoard().objects.find(o => o.id === id).gen.snap.type)")
    card_obj = ids[snaps.index("rev")] if "rev" in snaps else None
    nid = plus(page, card_obj) if card_obj else None
    check("F: у задания из карточки «+» — вид карточки, «+» даёт тот же", sorted(snaps) == ["calc", "rev"] and nid and gen_eval(page, "S.task.type") == "rev", f"{snaps} {gen_eval(page, 'S.task.type')}")
    fx(page, "clearCards()")
    # «Обновить пример» в панели — та же ⟳
    fx(page, "startRun(['quot', 'swap'], 3)")
    w0 = fx(page, sig)
    page.evaluate("() => setTrainersPanel('open')")
    page.click("#bdTrainersRefreshBtn")
    page.wait_for_timeout(300)
    check("F: «Обновить пример» в панели — тот же уровень и вид", fx(page, sig) == w0, f"{w0} → {fx(page, sig)}")

    # тригонометрия, смешанная тренировка
    open_trainer(page, "trig_equations", "trig_equations.html")
    bad = []
    for _ in range(3):
        fx(page, "startRun(['kx', 'fac', 'quad', 'circ'])")
        want = fx(page, "S.task.pid")
        oid = add_to_board(page)[0]
        for _ in range(2):
            nid = plus(page, oid)
            got = gen_eval(page, "S.task.pid") if nid else "нет +"
            if got != want:
                bad.append(f"{want} → {got}")
    check("F: тригонометрия — «+» того же типа уравнения и в смешанной тренировке", not bad, "; ".join(bad[:3]))
    check("F: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


MODE = "document.querySelectorAll('.mode-card:not(.soon):not(.demo)')[%d].click()"
OGE_SIG = "(function(){ const m = tsGetState().curMode; return m && typeof m === 'object' ? (m.id || JSON.stringify(m).slice(0, 40)) : String(m); })()"
LVL = "document.querySelectorAll('#levels .lvl:not(.custom):not(.sec)')[%d].click()"
ALL_CASES = (
    [(t, t + ".html", MODE % 2, MODE % 3, OGE_SIG) for t in ["oge1_5", "oge6", "oge7", "oge10", "oge13", "oge14", "oge15_18", "oge8", "oge12", "powers"]]
    + [(t, t + ".html", MODE % 0, MODE % 1, OGE_SIG) for t in ["oge9", "oge11"]]
    + [(tid, href, LVL % 2, LVL % 3, "String(curLevel)") for tid, href in (
        ("add_col", "addition.html"), ("sub_col", "subtraction.html"), ("mul_col", "multiplication.html"), ("div_col", "division.html"),
        ("linear", "linear.html"), ("quadratic", "quadratic.html"), ("frac_mul", "fraction_multiply.html"), ("frac_div", "fraction_divide.html"))]
    + [(t, t + ".html", "document.querySelectorAll('#sections .lvl')[1].click(); " + LVL % 2,
        "document.querySelectorAll('#sections .lvl')[2].click(); " + LVL % 1, "curSection + '/' + curLevel") for t in ("gcd", "lcm")]
    + [("percent", "percent.html", "openProto('parts', 2)", "openProto(PERCENT_BANK.protos ? PERCENT_BANK.protos[5].id : 'parts', 3)", "S.task.pid + '/' + S.task.lvl"),
       ("oge9", "oge9.html", "openModeById('linear'); setTimeout(() => document.querySelector('#levels .lvl[data-id=\"3\"]').click(), 200)",
        "openModeById('quadratic'); setTimeout(() => document.querySelector('#levels .lvl[data-id=\"2\"]').click(), 200)",
        "(tsGetState().curMode && (tsGetState().curMode.id || tsGetState().curMode)) + '/' + (document.querySelector('#levels .lvl.active') || { dataset: {} }).dataset.id")]
)


def test_all_trainers(browser):
    bad, errs = [], []
    for tid, href, prep1, prep2, sig in ALL_CASES:
        ctx, page, errors = open_board(browser)
        try:
            open_trainer(page, tid, href)
            for prep in (prep1, prep2):
                fx(page, prep)
                page.wait_for_timeout(700)
                want = fx(page, sig)
                oid = add_to_board(page)[0]
                nid = plus(page, oid)
                got = gen_eval(page, sig) if nid else "нет +"
                if got != want:
                    bad.append(f"{tid}: {want} → {got}")
        except Exception as e:  # noqa: BLE001
            bad.append(f"{tid}: {repr(e)[:120]}")
        errs += errors
        ctx.close()
    check(f"G: «+» во всех остальных тренажёрах ({len(ALL_CASES)} случаев) — тот же тип и уровень, и для второго задания другого уровня", not bad, "; ".join(bad[:4]))
    check("G: без ошибок JS", not errs, str(errs[:1]))


BLOCKS = {"A": test_bank, "B": test_page, "C": test_show, "D": test_trig, "E": test_session, "F": test_board, "G": test_all_trainers}


def run():
    want = [a.upper() for a in sys.argv[1:]] or list(BLOCKS)
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        for k in want:
            try:
                BLOCKS[k](browser)
            except Exception as e:  # noqa: BLE001
                check(f"{k}: исключение", False, repr(e)[:300])
        browser.close()
    failed = [n for n, ok in results if not ok]
    print()
    print("ИТОГ:", "всё прошло" if not failed else f"упало {len(failed)} из {len(results)}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    run()
