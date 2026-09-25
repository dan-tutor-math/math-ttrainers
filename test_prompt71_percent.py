"""
Промпт №71: новый тренажёр «Проценты» (5–6 класс) — percent.html и
percent-bank.js.

Проверяет:
  A. банк: у каждого из 25 прототипов на каждом уровне А/Б/В по 400
     заданий, и ответ каждого пересчитан НЕЗАВИСИМО от генератора по
     исходным числам (meta) — формулы здесь свои; эталоны — «удобные»
     числа, в тексте нет undefined/NaN, у всех есть решение;
  B. экран плиток: 25 плиток, 8 групп и фильтр по ним; сетка на всю ширину
     (на 1400 px — не меньше 5 колонок, без пустых ячеек-дыр), разные
     размеры плиток; у каждой — название, пример и рисунок;
  C. анимации: только transform и opacity в keyframes рисунков; идут у
     видимых плиток и стоят на паузе у плиток за экраном; на экране задания
     не идёт ни одна; при «уменьшить движение» — ни одной анимации, а
     рисунок стоит в конечном кадре (видим); наведение поднимает плитку;
  D. плитка открывает тренажёр прототипа (?p= в адресе), назад к плиткам,
     соседние типы; два режима — «Тренировка» с кнопкой «Показать решение и
     ответ» и «Экзамен» без неё, интерфейс одинаковый;
  E. каждый прототип на каждом уровне решается через интерфейс верным
     ответом (поля и выбор), счёт растёт; две ошибки — верный ответ
     подставлен и разбор открыт; уровень Б открывается после трёх верных и
     следующее задание — уже Б; уровень можно выбрать вручную;
  F. разбор записей: 3/25 и «1 1/5», сократимая дробь и десятичная вместо
     обыкновенной — просьба, не ошибка; «33 1/3» и 100/3, 33,3 — просьба;
     «25%» с единицей; «45/100» там, где нужна десятичная;
  G. карточка «+1»: тот же прототип и уровень, решается, в снимке сессии;
  H. совместная сессия (заглушка Supabase из теста №54): ученик видит те же
     плитки → то же задание, смена задания, возврат к плиткам;
  I. «В подборку», главная (Основа, 5 и 6 класс), панель тренажёров на
     доске: задание кладётся живым (поля и выбор), ответ проверяется, «ещё
     такое же» даёт задание того же прототипа и уровня;
  J. телефон 375 и 320 px, планшет 768: без прокрутки вбок на плитках и в
     заданиях с рисунками.

Живой realtime из песочницы не проверить — совместный режим перепроверяется
на сайте руками.

Запуск: python3 test_prompt71_percent.py (сервер поднимается сам).
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

PORT = 8992
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


def open_page(browser, width=1400, height=900, url="percent.html", reduced=None, fake=False):
    ctx = browser.new_context(viewport={"width": width, "height": height}, reduced_motion=reduced or "no-preference")
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    if fake:
        page.route("**/supabase-js.umd.js", lambda route: route.fulfill(
            status=200, content_type="application/javascript", body=FAKE_LIB))
        page.route("**/fonts.googleapis.com/**", lambda route: route.abort())
        page.route("**/fonts.gstatic.com/**", lambda route: route.abort())
    else:
        page.route("https://**/*", lambda route: route.abort())
    page.goto(f"{BASE}/{url}")
    page.wait_for_function("() => window.__trainerState && window.PERCENT_BANK")
    page.wait_for_timeout(300)
    quiet(page)
    return ctx, page, errors


def quiet(page):
    """Конспект урока снимает html2canvas'ом экран при каждой смене задания
    (так и задумано, как в ЕГЭ). В тестах задания меняются сотнями подряд —
    снимки копились бы в очереди и вешали страницу, поэтому выключаем."""
    page.evaluate("() => { if (window.TrainerSession && TrainerSession.setAutosaveHistory) TrainerSession.setAutosaveHistory(false); }")


# независимая проверка ответов по meta — своими формулами, не генератора
CHECK_JS = r"""
(function(){
  const val = s => { s = String(s); if (s.indexOf('/') >= 0){ const [a, b] = s.split('/').map(Number); return a / b; } return Number(s); };
  const close = (a, b) => Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(b));
  const prod = arr => arr.reduce((s, x) => s * x, 1);
  // ожидаемые ответы: массив чисел по полям или { choice: номер }
  function expect(t){
    const m = t.meta, L = t.lvl;
    switch (t.pid){
      case 'pct-dec': return [m.p / 100];
      case 'pct-frac': return [m.p / 100];
      case 'frac-pct': return [m.num / m.den * 100];
      case 'share-fig': { const v = m.part / m.whole * 100; return t.fields.length === 2 ? [v, 100 - v] : [v]; }
      case 'share-units': { const v = m.part / m.whole * 100; return t.fields.length === 2 ? [v, v - 100] : [v]; }
      case 'of-num': { const v = m.x * m.p / 100; return t.fields.length === 2 ? [v, m.x - v] : [v]; }
      case 'num-by-pct': return [m.part / (m.p / 100)];
      case 'pct-of': return [m.part / m.whole * 100];
      case 'pct-change': return [Math.abs(m.now - m.was) / m.was * 100];
      case 'proportion':
        if (m.kind === 'whole') return [m.part * 100 / m.p];
        if (m.kind === 'part') return [m.x * m.p / 100];
        if (m.kind === 'pct') return [m.part / m.whole * 100];
        return [m.X * m.partA / m.A, m.partA / m.A * 100];
      case 'incdec': return [m.x * (1 + m.p / 100)];
      case 'reverse':
        if (m.r !== undefined) return [m.r / (1 + m.p / 100)];
        return [m.p > 0 ? m.p / (100 + m.p) * 100 : -m.p / (100 + m.p) * 100];
      case 'chain': {
        const k = prod(m.ch.map(c => 1 + c / 100));
        if (m.x !== undefined) return [m.x * k];
        if (m.ch.every(c => c < 0)) return [100 - k * 100];
        return [Math.abs(k - 1) * 100];
      }
      case 'swap': { const v = m.a * m.b / 100; return [m.op === '-' ? 0 : (m.op === '+' ? 2 * v : v)]; }
      case 'compare': { const a = m.a1 * m.b1, b = m.a2 * m.b2; return { choice: close(a, b) ? 1 : (a > b ? 0 : 2) }; }
      case 'better':
        if (m.c1 !== undefined) return { choice: m.c1 === m.c2 ? 2 : (m.c1 < m.c2 ? 0 : 1) };
        if (m.k1 !== undefined) return { choice: close(m.k1, m.k2) ? 2 : (m.k1 < m.k2 ? 0 : 1) };
        return { choice: close(m.dealPct, m.d) ? 2 : (m.dealPct > m.d ? 0 : 1) };
      case 'parts': {
        const restPct = 100 - m.known.reduce((s, x) => s + x, 0);
        if (m.rest === undefined) return [restPct];
        const whole = m.rest / (restPct / 100);
        return t.fields.length === 2 ? [whole, whole * m.known[0] / 100] : [whole];
      }
      case 'pct-of-pct':
        if (m.total !== undefined) return [m.total * m.p1 / 100 * m.p2 / 100];
        return [m.left / ((1 - m.p1 / 100) * (1 - m.p2 / 100))];
      case 'pie':
        if (m.known) return [(100 - m.known.reduce((s, x) => s + x, 0)) * 3.6];
        if (m.total !== undefined && m.deg !== undefined) return [m.total * m.deg / 360];
        if (m.total !== undefined) return [m.total * m.p / 100, m.p * 3.6];
        if (m.deg !== undefined) return [m.deg / 3.6];
        return [m.p * 3.6];
      case 'conc':
        if (m.s !== undefined && m.m !== undefined) return [m.s / m.m * 100];
        if (m.m !== undefined) return [m.m * m.p / 100];
        return [m.s / (m.p / 100)];
      case 'mixing':
        if (m.s !== undefined) return [m.s / m.m * 100];
        return [m.m * m.p1 / m.p2 - m.m];
      case 'drying':
        if (m.s !== undefined) return [m.s / m.m * 100];
        if (m.m !== undefined) return [m.m - m.m * m.p1 / m.p2];
        return [m.M * (100 - m.w1) / (100 - m.w2)];
      case 'deposit':
        if (m.both) return [m.S + 2 * m.S * m.p / 100, m.S * Math.pow(1 + m.p / 100, 2)];
        if (m.simple === false) return [m.S * Math.pow(1 + m.p / 100, m.n)];
        if (m.simple) return [m.S + m.n * m.S * m.p / 100];
        if (m.n === 1) return [m.S * m.p / 100, m.S * (1 + m.p / 100)];
        if (m.S !== undefined) return [(m.after - m.S) / m.S * 100];
        return [m.after / (1 + m.p / 100)];
      case 'tax':
        if (m.net !== undefined) return [m.net / 0.87];
        if (m.tax) return [m.S * 0.13, m.S * 0.87];
        return [m.S * (1 + m.p / 100)];
      case 'hard':
        if (m.mult) return [Math.abs(prod(m.mult) - 1) * 100];
        if (m.n !== undefined) return [(m.n - m.m) / m.n * 100];
        if (m.left !== undefined) return [m.left / ((1 - m.p1 / 100) * (1 - m.p2 / 100))];
        return [m.p * 3.6];
    }
    return null;
  }
  function checkTask(t){
    const errs = [];
    const e = expect(t);
    if (!e) return ['нет формулы для ' + t.pid];
    if (e.choice !== undefined){
      if (!t.choice) return ['ожидался выбор'];
      if (t.choice.correct !== e.choice) errs.push('выбор ' + t.choice.correct + ' вместо ' + e.choice);
    } else {
      if (!t.fields || t.fields.length !== e.length) return ['полей ' + (t.fields || []).length + ' вместо ' + e.length];
      t.fields.forEach((f, i) => {
        const v = val(f.value);
        if (!isFinite(v)) errs.push('эталон не число: ' + f.value);
        else if (!close(v, e[i])) errs.push('поле ' + f.id + ': ' + f.value + ' вместо ' + e[i]);
        if (f.type === 'frac' && f.value.indexOf('/') < 0) errs.push('frac без дроби');
        if (!f.exactFrac && f.type === 'num'){
          // «удобные» ответы: не больше трёх знаков после запятой
          const s = String(f.value); const d = s.indexOf('.') >= 0 ? s.split('.')[1].length : 0;
          if (d > 3) errs.push('длинная дробь ' + s);
        }
        if (v < 0) errs.push('отрицательный ответ ' + f.value);
      });
    }
    if (!t.text || /undefined|NaN|Infinity/.test(t.text + (t.steps || []).join('') + t.answer)) errs.push('в тексте undefined/NaN');
    if (!(t.steps || []).length) errs.push('нет решения');
    return errs;
  }
  return { expect, checkTask };
})()"""

# вписать верный ответ в задание (основное или карточку) и нажать «Проверить»
SOLVE_JS = """(idx) => {
  const t = idx >= 0 ? S.cards[idx].task : S.task;
  const q = idx >= 0 ? document.querySelector('.added-task-card[data-idx="' + idx + '"] .added-card-question') : document.getElementById('pctQuestion');
  const a = idx >= 0 ? document.querySelector('.added-task-card[data-idx="' + idx + '"] .answer-area') : document.getElementById('answerArea');
  if (t.choice) { q.querySelector('.mcq-btn[data-i="' + t.choice.correct + '"]').click(); return 'choice'; }
  t.fields.forEach(f => { const i = a.querySelector('input[data-fid="' + f.id + '"]'); i.value = fieldShown(f); i.dispatchEvent(new Event('input', {bubbles:true})); });
  a.querySelector('.check-btn').click();
  return 'fields';
}"""
# заведомо неверный ответ
WRONG_JS = """(idx) => {
  const t = idx >= 0 ? S.cards[idx].task : S.task;
  const q = idx >= 0 ? document.querySelector('.added-task-card[data-idx="' + idx + '"] .added-card-question') : document.getElementById('pctQuestion');
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
      const bad = {}; let n = 0; const lvls = {};
      for (const p of PERCENT_BANK.protos) for (let L = 1; L <= 3; L++) for (let i = 0; i < 400; i++) {
        let t;
        try { t = PERCENT_BANK.generate(p.id, L); } catch (e) { (bad[p.id + L] = bad[p.id + L] || []).push('исключение ' + e.message); continue; }
        n++;
        if (t.lvl !== L || t.pid !== p.id || !t.key) (bad[p.id + L] = bad[p.id + L] || []).push('pid/lvl/key');
        if (JSON.stringify(t) !== JSON.stringify(JSON.parse(JSON.stringify(t)))) (bad[p.id + L] = bad[p.id + L] || []).push('не данные');
        const errs = C.checkTask(t);
        if (errs.length) (bad[p.id + L] = bad[p.id + L] || []).push(errs.join('; '));
        // эталон проходит собственную проверку страницы
        if (t.fields) t.fields.forEach(f => { if (checkField(f, fieldShown(f)) !== true) (bad[p.id + L] = bad[p.id + L] || []).push('эталон не принят: ' + f.value); });
      }
      return { n, protos: PERCENT_BANK.protos.length, groups: PERCENT_BANK.groups.length,
               bad: Object.keys(bad).map(k => k + ': ' + [...new Set(bad[k])].slice(0, 2).join(' | ')) };
    }""", CHECK_JS)
    check("A: 25 прототипов в 8 группах", res["protos"] == 25 and res["groups"] == 8, str(res["protos"]))
    check(f"A: {res['n']} заданий — ответы сходятся с независимым пересчётом, эталоны принимаются", not res["bad"], "; ".join(res["bad"][:5]))
    check("A: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── B, C. плитки и анимации ───
def test_tiles(browser):
    ctx, page, errors = open_page(browser, 1400, 900)
    info = page.evaluate("""() => {
      const tiles = [...document.querySelectorAll('#tiles .tile')];
      const cols = getComputedStyle(document.getElementById('tiles')).gridTemplateColumns.split(' ').length;
      const box = document.getElementById('tiles').getBoundingClientRect();
      // дыры: ячейки сетки, которые не накрыта ни одна плитка (кроме последней строки)
      const rects = tiles.map(t => t.getBoundingClientRect());
      const rowsTop = [...new Set(rects.map(r => Math.round(r.top)))].sort((a, b) => a - b);
      return { n: tiles.length, cols, width: box.width,
        sizes: { w: tiles.filter(t => t.classList.contains('w')).length, l: tiles.filter(t => t.classList.contains('l')).length },
        full: tiles.every(t => t.querySelector('.tile-title').textContent.trim() && t.querySelector('.tile-ex').textContent.trim() && t.querySelector('.tile-art .a').children.length),
        bottom: Math.max(...rects.map(r => r.bottom)), lastRowFilled: (() => {
          const maxB = Math.max(...rects.map(r => r.bottom));
          const last = rects.filter(r => Math.abs(r.bottom - maxB) < 2);
          return last.reduce((s, r) => s + r.width, 0) / box.width;
        })(),
        chips: document.querySelectorAll('#pkFilters .pk-chip').length };
    }""")
    check("B: 25 плиток с названием, примером и рисунком", info["n"] == 25 and info["full"])
    check("B: сетка во всю ширину — не меньше 5 колонок и шире 1100 px", info["cols"] >= 5 and info["width"] > 1100, f"{info['cols']} кол., {info['width']}")
    check("B: плитки разного размера (широкие и большие)", info["sizes"]["w"] >= 3 and info["sizes"]["l"] >= 2, str(info["sizes"]))
    check("B: нижний ряд заполнен (нет пустого хвоста)", info["lastRowFilled"] > 0.9, str(info["lastRowFilled"]))
    check("B: фильтр — «Все» и 8 групп", info["chips"] == 9)
    page.click('#pkFilters .pk-chip[data-group="mix"]')
    vis = page.evaluate("() => [...document.querySelectorAll('#tiles .tile')].filter(t => !t.hidden).map(t => t.dataset.pid)")
    check("B: фильтр «Растворы и смеси» оставляет три плитки", sorted(vis) == ["conc", "drying", "mixing"], str(vis))
    page.click('#pkFilters .pk-chip[data-group="all"]')

    # C. keyframes рисунков — только transform/opacity
    props = page.evaluate("""() => {
      const out = new Set(); const names = new Set();
      document.querySelectorAll('.tile-art *').forEach(e => { const n = getComputedStyle(e).animationName; if (n && n !== 'none') n.split(',').forEach(x => names.add(x.trim())); });
      for (const sh of document.styleSheets) { let rules; try { rules = sh.cssRules; } catch (e) { continue; }
        for (const r of rules) if (r.type === 7 && names.has(r.name)) for (const k of r.cssRules) for (let i = 0; i < k.style.length; i++) out.add(k.style[i]); }
      return { props: [...out], names: [...names].length };
    }""")
    check("C: анимации рисунков — только transform и opacity", props["names"] >= 20 and set(props["props"]) <= {"transform", "opacity"}, str(props))
    page.wait_for_timeout(400)
    st = page.evaluate("""() => {
      const tiles = [...document.querySelectorAll('#tiles .tile')];
      const inView = t => { const r = t.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
      const states = t => t.getAnimations({ subtree: true }).map(a => a.playState);
      const vis = tiles.filter(inView), off = tiles.filter(t => !inView(t) && t.getBoundingClientRect().top > innerHeight + 200);
      return { visRunning: vis.filter(t => t.classList.contains('live') && states(t).includes('running')).length, vis: vis.length,
               offRunning: off.filter(t => states(t).includes('running')).length, off: off.length };
    }""")
    check("C: у видимых плиток анимации идут", st["visRunning"] >= st["vis"] - 1 and st["vis"] >= 6, str(st))
    check("C: плитки за экраном стоят на паузе", st["off"] >= 3 and st["offRunning"] == 0, str(st))
    # наведение — плитка поднимается
    box = page.locator('.tile[data-pid="pct-dec"]').bounding_box()
    page.mouse.move(box["x"] + 40, box["y"] + 40)
    page.wait_for_timeout(450)
    lifted = page.evaluate("() => new DOMMatrix(getComputedStyle(document.querySelector('.tile[data-pid=\"pct-dec\"]')).transform).m42")
    check("C: при наведении плитка поднимается", lifted < -3, str(lifted))
    # экран задания — ни одной анимации плиток
    page.click('.tile[data-pid="of-num"]')
    page.wait_for_timeout(300)
    n_task = page.evaluate("() => document.getElementById('tiles').getAnimations({ subtree: true }).filter(a => a.playState === 'running').length")
    check("C: на экране задания анимации плиток не идут", n_task == 0, str(n_task))
    check("B, C: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    # «уменьшить движение»
    ctx, page, errors = open_page(browser, 1400, 900, reduced="reduce")
    r = page.evaluate("""() => ({
      anims: document.getElementById('tiles').getAnimations({ subtree: true }).length,
      // конечный кадр: закрашенная четверть круга и «0,37» видны
      q: getComputedStyle(document.querySelector('.art-ring .q')).opacity,
      l2: getComputedStyle(document.querySelector('.art-decshift .l2')).opacity,
      fill: new DOMMatrix(getComputedStyle(document.querySelector('.art-barpart .fil')).transform).a,
    })""")
    check("C: «уменьшить движение» — анимаций нет, рисунки в конечном кадре", r["anims"] == 0 and r["q"] == "1" and r["l2"] == "1" and abs(r["fill"] - 1) < 1e-6, str(r))
    box = page.locator('.tile[data-pid="pct-dec"]').bounding_box()
    page.mouse.move(box["x"] + 40, box["y"] + 40)
    page.wait_for_timeout(300)
    t = page.evaluate("() => getComputedStyle(document.querySelector('.tile[data-pid=\"pct-dec\"]')).transform")
    check("C: «уменьшить движение» — плитка при наведении не прыгает", t == "none", t)
    ctx.close()


# ─── D, E. тренажёр прототипа ───
def test_trainer(browser):
    ctx, page, errors = open_page(browser, 1300, 1000)
    page.evaluate("() => { try { Object.keys(localStorage).filter(k => k.startsWith('ogeProg:percent')).forEach(k => localStorage.removeItem(k)); } catch (e) {} }")
    page.reload()
    page.wait_for_function("() => window.__trainerState")
    quiet(page)
    page.click('.tile[data-pid="of-num"]')
    page.wait_for_timeout(200)
    d = page.evaluate("() => ({ screen: S.screen, pid: S.pid, url: location.search, title: document.getElementById('taskTitle').textContent, lvl: S.task.lvl, tabs: [...document.querySelectorAll('.submode-tab')].map(b => b.textContent.trim()) })")
    check("D: плитка открывает тренажёр прототипа (адрес ?p=)", d["screen"] == "task" and d["pid"] == "of-num" and "p=of-num" in d["url"] and d["title"] == "Процент от числа", str(d))
    check("D: ровно два режима — Тренировка и Экзамен", d["tabs"] == ["Тренировка", "Экзамен"], str(d["tabs"]))
    check("D: первый вход — уровень А", d["lvl"] == 1)
    vis = lambda sel: page.evaluate(f"() => {{ const e = document.querySelector('{sel}'); return !!e && e.offsetParent !== null; }}")
    check("D: в «Тренировке» есть «Показать решение и ответ»", vis("#showSolutionBtn"))
    page.click("#showSolutionBtn")
    check("D: кнопка открывает решение и ответ", vis("#mainPanel") and "Ответ" in page.inner_text("#solAnswer"))
    page.click("#tabExam")
    page.wait_for_timeout(100)
    check("D: в «Экзамене» кнопки нет и решение закрыто", not vis("#showSolutionBtn") and not vis("#mainPanel"))
    check("D: интерфейс тот же — условие, поле, «Проверить»", vis("#pctQuestion") and vis("#answerArea .check-btn") and vis("#levelRow"))
    page.click("#tabPractice")

    # E. все прототипы и уровни — верным ответом
    fails = page.evaluate("""(SOLVE) => {
      const solve = eval(SOLVE); const out = [];
      for (const p of PERCENT_BANK.protos) for (let L = 1; L <= 3; L++) for (let k = 0; k < 3; k++) {
        setLevel(L); openProto(p.id, L);
        const before = totalSolved;
        solve(-1);
        if (!(S.answered && S.correct && totalSolved === before + 1)) out.push(p.id + L + ': ' + S.task.text.replace(/<[^>]+>/g, '').slice(0, 60));
      }
      return out;
    }""", SOLVE_JS)
    check("E: все 25 прототипов на уровнях А, Б, В решаются верным ответом", not fails, "; ".join(fails[:4]))

    # две ошибки подряд
    page.evaluate("() => openProto('conc', 1)")
    e0 = page.evaluate("() => totalErrors")
    page.evaluate(f"({WRONG_JS})(-1)")
    s1 = page.evaluate("() => ({ a: S.answered, w: S.hadWrong, bad: !!document.querySelector('#answerArea .answer-input.bad'), next: document.getElementById('nextBtn').offsetParent !== null })")
    page.evaluate(f"({WRONG_JS})(-1)")
    s2 = page.evaluate("() => ({ a: S.answered, c: S.correct, fixed: !!document.querySelector('#answerArea .answer-input.fixed'), sol: document.getElementById('mainPanel').offsetParent !== null, e: totalErrors, val: document.querySelector('#answerArea .answer-input').value, want: fieldShown(S.task.fields[0]) })")
    check("E: первая ошибка — красным, можно исправить", not s1["a"] and s1["w"] and s1["bad"] and not s1["next"], str(s1))
    check("E: вторая — верный ответ подставлен, разбор открыт", s2["a"] and not s2["c"] and s2["fixed"] and s2["sol"] and s2["val"] == s2["want"] and s2["e"] == e0 + 2, str(s2))
    # выбор варианта: две ошибки
    page.evaluate("() => { do { openProto('compare', 2); } while (!S.task.choice); }")
    page.evaluate(f"({WRONG_JS})(-1)")
    page.evaluate(f"({WRONG_JS})(-1)")
    c = page.evaluate("() => ({ a: S.answered, bad: document.querySelectorAll('#pctQuestion .mcq-btn.bad').length, fixed: document.querySelectorAll('#pctQuestion .mcq-btn.fixed').length, slot: document.querySelector('#pctQuestion .slot').textContent })")
    check("E: выбор знака — две ошибки, верный вариант показан", c["a"] and c["bad"] == 2 and c["fixed"] == 1 and c["slot"] in (">", "=", "<"), str(c))

    # уровни: три верных — уровень Б
    page.evaluate("() => { levelProg = {}; setLevel(1); openProto('pct-of', 1); }")
    for k in range(3):
        page.evaluate(f"({SOLVE_JS})(-1)")
        if k < 2:
            page.click("#nextBtn")
    up = page.evaluate("() => ({ up: S.lvlUp, msg: document.getElementById('levelUp').offsetParent !== null && document.getElementById('levelUp').textContent })")
    page.click("#nextBtn")
    after = page.evaluate("() => ({ lvl: S.lvl, tl: S.task.lvl, chipA: document.querySelector('.lvl-chip[data-lvl=\"1\"]').classList.contains('done'), active: document.querySelector('.lvl-chip.active').textContent, saved: progOf('pct-of') })")
    check("E: после трёх верных на А — «Уровень А пройден»", up["up"] and "пройден" in (up["msg"] or ""), str(up))
    check("E: следующее задание — уровень Б, А отмечен пройденным", after["lvl"] == 2 and after["tl"] == 2 and after["chipA"] and after["active"] == "Б" and after["saved"]["lvl"] == 2, str(after))
    page.click('.lvl-chip[data-lvl="3"]')
    check("E: уровень выбирается вручную", page.evaluate("() => S.lvl === 3 && S.task.lvl === 3"))
    page.reload()
    page.wait_for_function("() => window.__trainerState")
    page.wait_for_timeout(200)
    check("E: после перезагрузки — тот же прототип и уровень", page.evaluate("() => S.screen === 'task' && S.pid === 'pct-of' && S.lvl === 3"))
    page.click("#backBtn")
    check("D: «← все типы задач» — обратно к плиткам, адрес без ?p=", page.evaluate("() => S.screen === 'picker' && !location.search.includes('p=') && document.getElementById('pickerArea').offsetParent !== null"))
    badge = page.evaluate("() => document.querySelector('.tile[data-pid=\"pct-of\"] .tile-badges').textContent")
    check("D: на плитке — сколько решено и уровень", "✓" in badge and "В" in badge, badge)
    page.click('.tile[data-pid="hard"]')
    page.click("#nextProtoBtn")
    check("D: «Следующий тип» по кругу — с последнего на первый", page.evaluate("() => S.pid === PERCENT_BANK.protos[0].id"))
    check("D, E: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── F. разбор записей ───
def test_parse(browser):
    ctx, page, errors = open_page(browser)
    r = page.evaluate("""() => {
      const f = (type, value, extra) => Object.assign({ id: 'a', label: '', type, value }, extra || {});
      const c = (fl, raw) => checkField(fl, raw);
      const fr = f('frac', '3/25'), fr2 = f('frac', '6/5'), dec = f('dec', '0.45'), ex = f('num', '100/3', { exactFrac: true, unit: '%' }), pc = f('num', '25', { unit: '%' }), rub = f('num', '43500', { unit: '₽' });
      return {
        frOk: c(fr, '3/25'), frMixed: c(fr2, '1 1/5'), frImproper: c(fr2, '6/5'), frRed: c(fr, '12/100'), frDec: c(fr, '0,12'), frWrong: c(fr, '3/20'),
        decOk: c(dec, '0,45'), decDot: c(dec, '0.45'), decFrac: c(dec, '45/100'), decWrong: c(dec, '4,5'),
        exMixed: c(ex, '33 1/3'), exFrac: c(ex, '100/3'), exRound: c(ex, '33,3'), exPct: c(ex, '33 1/3 %'),
        pc: c(pc, '25%'), pcSp: c(pc, '25 %'), rubSp: c(rub, '43 500'), rubUnit: c(rub, '43500 ₽'), empty: c(pc, ''), junk: c(pc, 'абв'),
      };
    }""")
    check("F: дробь 3/25, смешанное 1 1/5 и неправильная 6/5 — верно", r["frOk"] is True and r["frMixed"] is True and r["frImproper"] is True, str(r))
    check("F: сократимая дробь и десятичная вместо обыкновенной — просьба, не ошибка", isinstance(r["frRed"], str) and "сократить" in r["frRed"] and isinstance(r["frDec"], str), str(r))
    check("F: неверная дробь — ошибка", r["frWrong"] is False)
    check("F: десятичная 0,45 и 0.45 верно, 45/100 — просьба, 4,5 — ошибка", r["decOk"] is True and r["decDot"] is True and isinstance(r["decFrac"], str) and r["decWrong"] is False, str(r))
    check("F: «33 1/3», 100/3 и «33 1/3 %» верно, 33,3 — просьба записать точно", r["exMixed"] is True and r["exFrac"] is True and r["exPct"] is True and isinstance(r["exRound"], str), str(r))
    check("F: знак % и ₽ и пробелы в разрядах не мешают", r["pc"] is True and r["pcSp"] is True and r["rubSp"] is True and r["rubUnit"] is True, str(r))
    check("F: пустое и не число — просьба", isinstance(r["empty"], str) and isinstance(r["junk"], str))
    # просьба не меняет счёт
    page.evaluate("() => { do { openProto('pct-frac', 2); } while (S.task.fields[0].value.split('/')[1] === '1'); }")
    e0 = page.evaluate("() => totalErrors")
    page.fill("#answerArea input", "0,5")
    page.click("#answerArea .check-btn")
    msg = page.inner_text("#answerArea .answer-msg")
    check("F: на экране — подсказка под полем, ошибок не прибавилось", "обыкновенная" in msg and page.evaluate("() => totalErrors") == e0 and not page.evaluate("() => S.hadWrong"), msg)
    ctx.close()


# ─── G. карточки «+» ───
def test_cards(browser):
    ctx, page, errors = open_page(browser, 1300, 1000)
    page.evaluate("() => openProto('pie', 2)")
    page.click("#addRailToggle")
    page.click('.add-qty-btn[data-n="2"]')
    page.wait_for_timeout(200)
    c = page.evaluate("() => ({ n: S.cards.length, same: S.cards.every(c => c.task.pid === 'pie' && c.task.lvl === 2), keys: new Set([S.task.key].concat(S.cards.map(c => c.task.key))).size, dom: document.querySelectorAll('.added-task-card').length, fig: document.querySelectorAll('.added-task-card .pct-fig svg').length })")
    check("G: «+2» — две карточки того же прототипа и уровня, свои задания и рисунки", c["n"] == 2 and c["same"] and c["keys"] == 3 and c["dom"] == 2 and c["fig"] == 2, str(c))
    page.fill('.added-task-card[data-idx="0"] input >> nth=0', "123")
    page.click('#addRailBody .add-qty-btn[data-n="1"]')
    kept = page.input_value('.added-task-card[data-idx="0"] input >> nth=0')
    check("G: добавление новой карточки не стирает набранное в стоящей", kept == "123", kept)
    s0 = page.evaluate("() => totalSolved")
    page.evaluate(f"({SOLVE_JS})(1)")
    cs = page.evaluate("() => ({ a: S.cards[1].answered, ok: S.cards[1].correct, sol: getComputedStyle(document.querySelector('.added-task-card[data-idx=\"1\"] .added-explain')).display, st: tsGetState().cards[1].answered, solved: totalSolved })")
    check("G: карточка решается, открывает разбор и попадает в снимок сессии", cs["a"] and cs["ok"] and cs["sol"] == "block" and cs["st"] and cs["solved"] == s0 + 1, str(cs))
    check("G: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── H. совместная сессия ───
def test_session(browser):
    ctx = browser.new_context(viewport={"width": 1300, "height": 1000})
    errors = []

    def mk(url):
        page = ctx.new_page()
        page.route("**/supabase-js.umd.js", lambda route: route.fulfill(
            status=200, content_type="application/javascript", body=FAKE_LIB))
        page.route("**/fonts.googleapis.com/**", lambda route: route.abort())
        page.route("**/fonts.gstatic.com/**", lambda route: route.abort())
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"{BASE}/{url}")
        page.wait_for_function("() => window.__trainerState")
        return page

    teacher = mk("percent.html")
    teacher.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()", timeout=10000)
    code = teacher.evaluate("() => window.TrainerSession.getCode()")
    student = mk(f"percent.html?s={code}")
    student.wait_for_timeout(1500)
    check("H: ученик на экране плиток вместе с учителем", student.evaluate("() => S.screen") == "picker")
    teacher.click('.tile[data-pid="mixing"]')
    teacher.wait_for_timeout(1200)
    same = lambda: student.evaluate("() => S.task && S.task.key") == teacher.evaluate("() => S.task.key")
    check("H: учитель открыл плитку — у ученика тот же тренажёр и то же задание",
          student.evaluate("() => S.screen") == "task" and student.evaluate("() => S.pid") == "mixing" and same()
          and student.inner_text("#pctQuestion") == teacher.inner_text("#pctQuestion"))
    teacher.fill("#answerArea input", "17")
    teacher.wait_for_timeout(900)
    check("H: набранное учителем видно у ученика", student.input_value("#answerArea input") == "17")
    teacher.click("#answerArea .check-btn")
    teacher.wait_for_timeout(900)
    check("H: проверка доехала (отметка ошибки)", student.evaluate("() => S.hadWrong") and student.evaluate("() => S.marks.a") == "bad")
    # ученик исправляет — ответ и проверка доезжают до учителя, эхо не откатывает
    right = student.evaluate("() => fieldShown(S.task.fields[0])")
    student.fill("#answerArea input", right)
    student.click("#answerArea .check-btn")
    teacher.wait_for_timeout(1200)
    check("H: верный ответ ученика доехал до учителя и не откатился",
          teacher.evaluate("() => S.answered && S.correct") and student.evaluate("() => S.answered && S.correct")
          and teacher.input_value("#answerArea input") == right)
    teacher.click("#tabExam")
    teacher.click('.lvl-chip[data-lvl="3"]')
    teacher.wait_for_timeout(1200)
    check("H: смена уровня и режима доехала — новое задание уровня В", same() and student.evaluate("() => S.lvl === 3 && S.task.lvl === 3 && S.mode === 'exam'"))
    teacher.click("#backBtn")
    teacher.wait_for_timeout(1000)
    check("H: учитель вернулся к плиткам — ученик тоже", student.evaluate("() => S.screen") == "picker"
          and student.evaluate("() => document.getElementById('pickerArea').offsetParent !== null"))
    check("H: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── I. подборка, главная, доска ───
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
    page.evaluate("() => { Basket.clear(); openProto('frac-pct', 2); }")
    page.click("#basketAddBtn")
    it = page.evaluate("() => Basket.all().slice(-1)[0]")
    check("I: «В подборку» — задание процентов с уровнем", it and it["trainerId"] == "percent" and "уровень Б" in it["modeTitle"] and it["text"], str(it)[:200])
    page.evaluate("() => { Basket.clear(); do { openProto('compare', 1); } while (!S.task.choice); }")
    page.click("#basketAddBtn")
    it = page.evaluate("() => Basket.all().slice(-1)[0]")
    check("I: в подборке у сравнения — варианты списком, без кнопок", "basket-opt" in it["html"] and "<button" not in it["html"], it["html"][:200])
    page.evaluate("() => Basket.clear()")
    ctx.close()

    ctx = browser.new_context(viewport={"width": 1200, "height": 900})
    page = ctx.new_page()
    page.route("https://**/*", lambda r: r.abort())
    page.goto(f"{BASE}/index.html")
    links = {}
    for tab, sub in [("base", None), ("grades", "g5"), ("grades", "g6")]:
        page.click(f'.nav-tab[data-id="{tab}"]')
        if sub:
            page.click(f'.nav-subtab[data-id="{sub}"]')
        page.wait_for_timeout(100)
        links[sub or tab] = page.evaluate("() => [...document.querySelectorAll('.topic')].filter(t => (t.querySelector('.section-title') || {}).textContent === 'Проценты').map(t => t.querySelector('a').getAttribute('href'))")
    check("I: на главной «Проценты» в Основе, 5 и 6 классе — одна страница percent.html",
          links == {"base": ["percent.html"], "g5": ["percent.html"], "g6": ["percent.html"]}, str(links))
    ctx.close()

    # доска: панель тренажёров
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
    inlist = page.evaluate("() => [...document.querySelectorAll('.bd-trainers-item')].some(b => b.dataset.id === 'percent' && b.dataset.href === 'percent.html')")
    check("I: «Проценты» в панели тренажёров на доске", inlist)
    page.evaluate("() => openTrainerInPanel('percent', 'percent.html', 'Проценты')")
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

    o = add("openProto('parts', 3)")   # два поля: бюджет и на еду
    # S в кадре — const верхнего уровня, свойством окна она не видна
    want = page.evaluate(f"() => {FRAME}.contentWindow.eval('S.task.fields.map(f => f.value)')")
    ok_task = o.get("task") and o["task"]["kind"] == "fields" and [f["value"] for f in o["task"]["fields"]] == want and o.get("locked")
    check("I: задание легло на доску живым — два поля с ответами тренажёра", bool(ok_task), str(o.get("task"))[:200])
    page.evaluate("() => { document.getElementById('bdTrainersPanel').classList.remove('open'); boardsRedraw(); }")
    page.wait_for_timeout(300)
    sel = f'.bd-task[data-id="{o["id"]}"]'
    ins = page.locator(f"{sel} .bd-task-in")
    check("I: на доске два живых поля", ins.count() == 2, str(ins.count()))
    ins.nth(0).fill(want[0])
    ins.nth(1).fill(str(int(want[1]) + 1000))
    page.click(f"{sel} .bd-task-btn")
    page.wait_for_timeout(300)
    st = page.evaluate(f"() => getCurrentBoard().objects.find(x => x.id === {json.dumps(o['id'])}).task.st")
    f0, f1 = o["task"]["fields"][0]["id"], o["task"]["fields"][1]["id"]
    check("I: на доске проверка — верное поле зелёным, неверное красным",
          bool(st) and st.get("res") == "bad" and st["marks"].get(f0) is True and st["marks"].get(f1) is False, str(st))
    # промпт №70: карточка и перестройка под ширину в невидимом кадре
    w0 = page.evaluate(f"() => getCurrentBoard().objects.find(x => x.id === {json.dumps(o['id'])}).css.w")
    r = page.evaluate(f"""async () => {{ const o = getCurrentBoard().objects.find(x => x.id === {json.dumps(o['id'])});
        const s = o.w / o.css.w; await reflowTaskWidth(o.id, (o.css.w + 260) * s, 'ie');
        const n = getCurrentBoard().objects.find(x => x.id === o.id);
        return {{ card: !!n.card, w: n.css.w, cw: n.css.cw, hot: !!(n.task && n.task.hot && n.task.hot.fields.length === 2) }}; }}""")
    check("I: задание — карточка; ширина перестраивается, живые поля на месте", r["card"] and r["w"] > w0 + 200 and r["hot"], f"{w0} → {r}")
    # смешанное число на доске
    page.evaluate("() => document.getElementById('bdTrainersPanel').classList.add('open')")
    o2 = add("do { openProto('frac-pct', 3); } while (!S.task.fields[0].exactFrac)")
    page.evaluate("() => { document.getElementById('bdTrainersPanel').classList.remove('open'); boardsRedraw(); }")
    page.wait_for_timeout(300)
    mixed = page.evaluate(f"() => {FRAME}.contentWindow.eval('fieldShown(S.task.fields[0])')")
    ok_mixed = page.evaluate("(a) => { const o = getCurrentBoard().objects.find(x => x.id === a[0]); return taCheckField(o.task.fields[0], a[1]); }", [o2["id"], mixed])
    check("I: доска принимает смешанное число «" + mixed + "»", ok_mixed is True, str(ok_mixed))
    # выбор знака
    page.evaluate("() => document.getElementById('bdTrainersPanel').classList.add('open')")
    o3 = add("do { openProto('compare', 2); } while (!S.task.choice)")
    check("I: сравнение легло с живыми вариантами", o3.get("task") and o3["task"]["kind"] == "choice" and o3["task"]["n"] == 3 and len(o3["task"]["hot"]["opts"]) == 3, str(o3.get("task"))[:200])
    check("I: у задания запомнено, как сделать ещё такое же", o3.get("gen") and o3["gen"]["kind"] == "state" and o3["gen"]["snap"].get("pid") == "compare", str(o3.get("gen"))[:200])
    # «ещё такое же»
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
    check("I: «ещё такое же» — то же сравнение того же уровня", o4.get("gen") and o4["gen"]["snap"]["pid"] == "compare" and o4["gen"]["snap"]["lvl"] == 2 and o4.get("task"), str(o4.get("gen"))[:200])
    check("I: доска без ошибок JS", not berr, str(berr[:1]))
    ctx.close()


# ─── J. телефон и планшет ───
def test_phone(browser):
    for w in (375, 320, 768):
        ctx, page, errors = open_page(browser, w, 800)
        over = page.evaluate("() => document.documentElement.scrollWidth - innerWidth")
        cut = page.evaluate("""() => [...document.querySelectorAll('.tile')].filter(t => { const r = t.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1; }).length""")
        check(f"J: {w} px — плитки без прокрутки вбок и не выходят за край", over <= 0 and cut == 0, f"{over} {cut}")
        bad = []
        for pid, lvl in [("pie", 2), ("share-fig", 1), ("parts", 3), ("compare", 3), ("proportion", 3), ("deposit", 3), ("frac-pct", 3)]:
            page.evaluate(f"() => {{ openProto('{pid}', {lvl}); S.sol = true; render(); }}")
            page.wait_for_timeout(120)
            o = page.evaluate("() => document.documentElement.scrollWidth - innerWidth")
            if o > 0:
                bad.append(f"{pid}:{o}")
        check(f"J: {w} px — задания с рисунками и решением без прокрутки вбок", not bad, str(bad))
        check(f"J: {w} px — без ошибок JS", not errors, str(errors[:1]))
        ctx.close()


def run():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        for t in (test_bank, test_tiles, test_trainer, test_parse, test_cards, test_session, test_platform, test_phone):
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
