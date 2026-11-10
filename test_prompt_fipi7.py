"""
Правка «банк ФИПИ №7»: в oge7 — задания №7 из открытого банка ФИПИ (выбор
ответа). Их виды — ровно наши типы, поэтому список один: у каждого типа
сначала задания ФИПИ, когда решены — наши «на основе ФИПИ» (fipi-mix.js,
правило из №9). В банке только числа задания: условие, шаги и решение строит
та же функция страницы (build_<тип>), что и генератор. В банке 182 задания: 72 без чертежа и 110 с нашей числовой прямой.
Все 16 видов строятся через build_, варианты сохраняют порядок ФИПИ.

Проверяет:
  1. данные банка (oge7-fipi-bank.js): 182 задания, номера уникальны, 16
     видов; верный вариант каждого пересчитан здесь заново по числам
     (Fraction, квадраты), он ровно один и совпадает с ans;
  2. страница строит каждое задание банка: тот же верный вариант, четыре
     варианта, числа ФИПИ в условии, дроби вертикально (KaTeX), без «/»;
     генераторы шести типов (по 150) — ровно один верный вариант;
  3. экран выбора: «10+ заданий» у типов с банком, у типов с прямой подписи
     нет, фильтр «Задания ФИПИ / На основе ФИПИ»;
  4. тип: сначала все задания ФИПИ своего вида без повторов, с подписью
     источника; неверный вариант — ошибка; потом плашка и задания «на основе
     ФИПИ», на карточке «ФИПИ решено 10 из 10»; подпись едет в «Подборку»;
     ученик из снимка учителя получает то же задание с подписью;
  5. карточки «+»: задания ФИПИ своего вида, без повторов между собой и с
     основным, с подписью; решённое в карточке засчитано в «ФИПИ решено»;
  6. без файла банка — подписей и фильтра нет; неподтверждённые задания
     ученик не видит, ?all=1 — с пометкой; телефон 375 px.

Совместный режим здесь без сети: живьём (вебсокет к Supabase) его нужно
перепроверять на сайте руками.

Запуск: python3 test_prompt_fipi7.py (сервер поднимается сам).
"""
import ast, hashlib
from pathlib import Path
import contextlib
import http.client
import json
import os
import re
import subprocess
import sys
import time
from fractions import Fraction as F

from playwright.sync_api import sync_playwright

PORT = 9137
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
SRC_RE = re.compile(r"^Источник: открытый банк заданий ФИПИ, задание ([0-9A-Za-z]{6})")
KINDS = {"int_bracket": 10, "sqrt_bracket": 15, "between_fracs": 13,
         "decimal_interval": 12, "segment_member": 10, "sqrt_segment": 12}


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


def load_bank():
    src = open(os.path.join(HERE, "oge7-fipi-bank.js"), encoding="utf-8").read()
    body = src[src.index("window.OGE7_FIPI = ") + len("window.OGE7_FIPI = "):].rstrip().rstrip(";")
    return json.loads(body)


def dec(s):
    return F(s.replace(",", "."))


def right(g, a):
    """Какие варианты верны — своими формулами, не теми, что у страницы."""
    if g == "int_bracket":
        x = F(a[0], a[1])
        return [lo < x < hi for lo, hi in a[2]]
    if g == "sqrt_bracket":
        return [lo * lo < a[0] < hi * hi for lo, hi in a[1]]
    if g == "between_fracs":
        lo, hi = sorted([F(a[0], a[1]), F(a[2], a[3])])
        return [lo < dec(v) < hi for v in a[4]]
    if g == "decimal_interval":
        x = F(a[0], a[1])
        return [dec(lo) <= x <= dec(hi) for lo, hi in a[2]]
    if g == "segment_member":
        return [a[2] <= F(p, a[0]) <= a[2] + 1 for p in a[1]]
    if g == "sqrt_segment":
        return [a[1] ** 2 <= r <= (a[1] + 1) ** 2 for r in a[0]]
    d=a[0]
    def number(v):
        return F(v[0],v[1]) if isinstance(v,list) else F(str(v))
    def expr(s,env):
        s=re.sub(r'(?<=[a-z0-9)])(?=[a-z(])','*',s.replace('−','-').replace('^','**').replace(' ',''))
        def visit(x):
            if isinstance(x,ast.Name):return env[x.id]
            if isinstance(x,ast.Constant):return F(x.value)
            if isinstance(x,ast.UnaryOp):return -visit(x.operand)
            l,r=visit(x.left),visit(x.right)
            return l+r if isinstance(x.op,ast.Add) else l-r if isinstance(x.op,ast.Sub) else l*r if isinstance(x.op,ast.Mult) else l/r if isinstance(x.op,ast.Div) else l**int(r)
        return visit(ast.parse(s,mode='eval').body)
    def ineq(s,env):
        l,op,r=re.fullmatch(r'(.*?)([<>≤≥])(.*)',s).groups();v=expr(l,env)-expr(r,env)
        return v<0 if op=='<' else v>0 if op=='>' else v<=0 if op=='≤' else v>=0
    if g.startswith('point_on_line_'):
        lo,hi=map(number,d['point_A_interval']);return [lo<number(v)<hi for v in d['values']]
    if g=='sqrt_choice':
        lo,hi=map(number,d['point_A_interval']);return [lo*lo<n<hi*hi for n in d['radicands']]
    if g in ('point_value_at_letter','sqrt_point_at_letter'):
        return [(number(d['points'][l][0])**2<d['radicand']<number(d['points'][l][1])**2) if g.startswith('sqrt') else (number(d['points'][l][0])<number(d['target'])<number(d['points'][l][1])) for l in d['options']]
    if g=='decimal_order':
        i=sorted(map(number,d['values'])).index(number(d['target']));return [l==d['order'][i] for l in d['options']]
    if g.startswith('sign_diff_'):
        env={k:F(i*3+1) for i,k in enumerate(d['order'])};out=[expr(o,env)>0 if g.endswith('positive') else expr(o,env)<0 for o in d['options'][:3]];return out+[not any(out)]
    if g=='ineq_single':
        lo,hi=map(number,d['point_a_interval']);return [ineq(o,{'a':(lo+hi)/2}) for o in d['options']]
    if g=='ineq_double':
        env={k:F(sign)*(5 if k==d['abs_greater'] else 2) for k,sign in d['signs'].items()};return [ineq(o,env) for o in d['options']]
    raise KeyError(g)


def test_bank_data(bank):
    tasks = bank["tasks"]
    check("банк: 182 задания, номера ФИПИ уникальны", len(tasks) == 182 and len({t["fipi"] for t in tasks}) == 182)
    expected={**KINDS,**NEW_KINDS}
    check('банк: 16 видов, все ответы приняты',len({t['g'] for t in tasks})==16 and all(t['checked'] for t in tasks))
    check('банк: числа по всем типам', {g:sum(t['g']==g for t in tasks) for g in expected}==expected)
    cnt = {g: sum(t["g"] == g for t in tasks) for g in KINDS}
    check("банк: шесть видов без чертежа, сколько ожидалось", cnt == KINDS, str(cnt))
    bad = [(t["fipi"], r) for t in tasks for r in [right(t["g"], t["args"])]
           if sum(r) != 1 or r.index(True) + 1 != t["ans"]]
    check("банк: верный вариант пересчитан по числам, он ровно один", not bad, str(bad[:3]))
    n = sum(t["checked"] for t in tasks)
    print(f"[--] банк: ответов принято сайтом ФИПИ {n} из {len(tasks)}")


def new_page(browser, url, wait=1200, block_bank=False, width=1300, init=None):
    ctx = browser.new_context(viewport={"width": width, "height": 1000})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    if block_bank:
        page.route("**/oge7-fipi-bank.js", lambda route: route.abort())
    if init:
        page.add_init_script(init)
    page.goto(url)
    page.wait_for_timeout(wait)
    return ctx, page, errors


# что видит ученик: условие и решение без разметки, число вертикальных дробей KaTeX
LOOK_JS = """(t) => {
  const txt = h => { const d = document.createElement('div'); d.innerHTML = h;
    d.querySelectorAll('.katex-mathml').forEach(e => e.remove()); return d.textContent; };
  const d = document.createElement('div'); d.innerHTML = t.prompt + t.explain;
  return { prompt: txt(t.prompt), explain: txt(t.explain), opts: t.options.length,
           ci: t.correctIndex, vfrac: d.querySelectorAll('.mfrac').length,
           sqrt: d.querySelectorAll('.sqrt').length };
}"""


def test_builders(browser, bank):
    ctx, page, errors = new_page(browser, f"{BASE}/oge7.html")
    bad = []
    for t in bank["tasks"]:
        r = page.evaluate("(t) => FIPI_BUILD[t.g](...t.args)", t)
        c = page.evaluate(LOOK_JS, r)
        a = t["args"]
        if t["g"] not in KINDS:
            if c["ci"]+1 != t["ans"] or c["opts"]!=4 or not r.get("numline") or "<img" in r["numline"] or re.search(r"NaN|undefined|Infinity",r["prompt"]+r["explain"]):bad.append((t["fipi"],t["g"],c))
            continue
        nums = {"int_bracket": a[:2], "sqrt_bracket": a[:1], "between_fracs": a[:4],
                "decimal_interval": a[:2], "segment_member": a[1], "sqrt_segment": a[0]}[t["g"]]
        frac = t["g"] in ("int_bracket", "between_fracs", "decimal_interval", "segment_member")
        if (c["ci"] + 1 != t["ans"] or c["opts"] != 4 or not all(str(x) in c["prompt"] for x in nums)
                or "/" in c["prompt"] + c["explain"] or (frac and not c["vfrac"]) or (not frac and not c["sqrt"])):
            bad.append((t["fipi"], t["g"], c))
    check("страница: каждое задание банка — тот же верный вариант, числа ФИПИ, дроби вертикально", not bad, str(bad[:2]))
    gbad = []
    for g in KINDS:
        for _ in range(150):
            r = page.evaluate(f"() => gen_{g}()")
            ok = page.evaluate("""(r) => r.options.length === 4 && r.correctIndex >= 0
                && new Set(r.options).size === 4""", r)
            if not ok:
                gbad.append((g, r["options"], r["correctIndex"]))
                break
    check("генераторы шести типов через build_: верный вариант найден, варианты разные", not gbad, str(gbad[:2]))
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def card(page, mid):
    return page.inner_text(f'.mode-card[data-id="{mid}"]')


def src(page):
    return page.inner_text('#sourceNote').strip() if page.is_visible('#sourceNote') else ''


def notice(page):
    return page.inner_text('#fipiNotice').strip() if page.is_visible('#fipiNotice') else ''


def pick(page, i):
    page.click(f'#mcqOptions .mcq-btn[data-i="{i}"]')
    page.wait_for_timeout(150)


def test_picker(browser, q=""):
    ctx, page, errors = new_page(browser, f"{BASE}/oge7.html{q}")
    check("выбор: «10+ заданий» у «Между какими целыми»", "10+ заданий" in card(page, "int_bracket"), card(page, "int_bracket"))
    check("выбор: «15+ заданий» у корня между числами", "15+ заданий" in card(page, "sqrt_bracket"), card(page, "sqrt_bracket"))
    check("выбор: у прямой есть ФИПИ, у №0 подписи нет",
          "10+ заданий" in card(page, "sqrt_choice") and "задани" not in card(page, "demo2027"))
    check("фильтр: значок над списком", page.is_visible('#fipiFilter .fm-btn'))
    page.click('#fipiFilter .fm-btn')
    page.wait_for_timeout(100)
    labels = page.eval_on_selector_all('.fm-pop label', 'ls => ls.map(l => [l.innerText.trim(), l.querySelector("input").checked])')
    check("фильтр: «Задания ФИПИ» и «На основе ФИПИ», обе включены",
          labels == [["Задания ФИПИ", True], ["На основе ФИПИ", True]], str(labels))
    page.click('.fm-pop input[data-k="own"]')
    page.wait_for_timeout(100)
    check("фильтр: «только ФИПИ» — «10 заданий ФИПИ»", "10 заданий ФИПИ" in card(page, "int_bracket"), card(page, "int_bracket"))
    page.evaluate("localStorage.removeItem('fipiMix:filter')")
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_task_flow(browser, bank, q=""):
    ctx, page, errors = new_page(browser, f"{BASE}/oge7.html{q}")
    by_id = {t["fipi"]: t for t in bank["tasks"]}
    group = [t for t in bank["tasks"] if t["g"] == "int_bracket"]
    page.click('.mode-card[data-id="int_bracket"]')
    page.wait_for_timeout(300)
    seen, ok_all = [], True
    for k in range(len(group)):
        m = SRC_RE.match(src(page))
        t = by_id.get(m.group(1)) if m else None
        prompt = page.inner_text('#questionPromptText')
        if not t or t["g"] != "int_bracket" or not all(str(x) in prompt for x in t["args"][:2]) or notice(page):
            ok_all = False
            check("тип: задание ФИПИ своего вида с подписью", False, f"{src(page)} | {prompt}")
            break
        seen.append(t["fipi"])
        if k == 0:
            pick(page, t["ans"] % 4)
            check("ответ: неверный вариант — ошибка", page.evaluate("totalErrors") == 1)
            page.click('#changeAnswerBtn') if page.is_visible('#changeAnswerBtn') else None
            page.wait_for_timeout(100)
        pick(page, t["ans"] - 1)
        page.wait_for_timeout(300)
        if not page.evaluate("taskAnswered"):
            ok_all = False
            check("ответ: верный вариант засчитан", False, str(t["ans"]))
            break
        page.click('#refreshBtn')
        page.wait_for_timeout(150)
    check("тип: сначала все 10 заданий ФИПИ, без повторов", ok_all and len(set(seen)) == len(group), str(len(set(seen))))
    check("после ФИПИ: плашка «Все 10 заданий ФИПИ этого вида решены»",
          notice(page).startswith("Все 10 заданий ФИПИ этого вида решены"), notice(page))
    check("после ФИПИ: задание на основе ФИПИ", src(page) == "Задание на основе ФИПИ" and page.evaluate("!curTask.fipi"), src(page))
    page.click('#backBtn')
    page.wait_for_timeout(150)
    check("карточка типа: «ФИПИ решено 10 из 10»", "ФИПИ решено 10 из 10" in card(page, "int_bracket"), card(page, "int_bracket"))

    page.click('.mode-card[data-id="sqrt_bracket"]'); page.wait_for_timeout(300)
    rich = page.evaluate("window.Basket.extractFromSelectorsRich(['#questionPanel']).text")
    check("подборка: подпись источника уходит вместе с заданием", "Источник: открытый банк заданий ФИПИ" in rich)
    st = page.evaluate("window.__trainerState.get()")
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    ctx, page, errors = new_page(browser, f"{BASE}/oge7.html{q}")
    page.evaluate("(s) => window.__trainerState.apply(s)", st)
    page.wait_for_timeout(400)
    check("сессия: у ученика то же задание и подпись",
          page.evaluate("curTask.prompt") == st["curTask"]["prompt"] and st["curTask"]["fipi"] in src(page), src(page))
    check("сессия: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_cards(browser, bank, q=""):
    ctx, page, errors = new_page(browser, f"{BASE}/oge7.html{q}")
    page.click('.mode-card[data-id="sqrt_segment"]'); page.wait_for_timeout(300)
    if not page.evaluate("document.getElementById('addRail').classList.contains('open')"):
        page.click("#addRailToggle")
    page.click('.add-qty-btn[data-n="5"]')
    page.wait_for_timeout(300)
    ids = page.evaluate("TaskCards._cards().map(c => c.task.fipi || '')")
    main = page.evaluate("curTask.fipi")
    kind = {t["fipi"]: t["g"] for t in bank["tasks"]}
    check("«+5»: задания ФИПИ своего вида, без повторов и не как основное",
          len(ids) == 5 and all(kind.get(i) == "sqrt_segment" for i in ids) and len(set(ids)) == 5 and main not in ids,
          f"{ids} / {main}")
    notes = page.eval_on_selector_all('.tc-card .source-note', 'es => es.map(e => e.textContent)')
    check("карточки: подпись источника под вариантами", len(notes) == 5 and all(SRC_RE.match(n) for n in notes), str(notes[:2]))
    ci = page.evaluate("TaskCards._cards()[0].task.correctIndex")
    page.click(f'.tc-card:nth-child(1) .mcq-btn[data-i="{ci}"]')
    page.wait_for_timeout(200)
    page.click('#backBtn'); page.wait_for_timeout(150)
    check("решённое в карточке засчитано: «ФИПИ решено 1 из 12»",
          "ФИПИ решено 1 из 12" in card(page, "sqrt_segment"), card(page, "sqrt_segment"))
    check("карточки: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_without_bank_and_unchecked(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge7.html", block_bank=True)
    page.click('.mode-card[data-id="int_bracket"]'); page.wait_for_timeout(300)
    check("без файла банка: наши задания без подписи, фильтра нет",
          not src(page) and not page.query_selector('#fipiFilter .fm-btn') and page.evaluate("!!curTask.prompt"))
    check("без файла банка: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()
    hide = """Object.defineProperty(window, 'OGE7_FIPI', { configurable: true,
          set(v) { v.tasks.forEach(t => t.checked = t.g !== 'sqrt_bracket');
                   Object.defineProperty(window, 'OGE7_FIPI', { value: v, writable: true }); } });"""
    ctx, page, errors = new_page(browser, f"{BASE}/oge7.html", init=hide)
    check("неподтверждённые задания ученик не видит, принятые видит",
          "задани" not in card(page, "sqrt_bracket") and "10+ заданий" in card(page, "int_bracket"),
          card(page, "sqrt_bracket"))
    page.click('.mode-card[data-id="int_bracket"]'); page.wait_for_timeout(300)
    check("принятое задание — подпись без пометки", SRC_RE.match(src(page)) and "не сверен" not in src(page), src(page))
    ctx.close()
    ctx, page, errors = new_page(browser, f"{BASE}/oge7.html?all=1", init=hide)
    page.click('.mode-card[data-id="sqrt_bracket"]'); page.wait_for_timeout(300)
    check("?all=1: неподтверждённое задание видно с пометкой", "ещё не сверен" in src(page), src(page))
    ctx.close()


def test_phone(browser, q=""):
    ctx, page, errors = new_page(browser, f"{BASE}/oge7.html{q}", width=375)
    page.click('.mode-card[data-id="between_fracs"]'); page.wait_for_timeout(300)
    w = page.evaluate("() => document.documentElement.scrollWidth")
    check("телефон 375 px: задание с подписью без прокрутки вбок", w <= 375 and bool(src(page)), str(w))
    ctx.close()


NEW_KINDS={'sign_diff_negative':7,'point_on_line_decimal':15,'sqrt_choice':10,'sqrt_point_at_letter':15,'ineq_double':12,'point_value_at_letter':10,'decimal_order':12,'point_on_line_int':12,'ineq_single':12,'sign_diff_positive':5}

def generator_contract():
    src=Path(HERE,'oge7.html').read_text();code=src[src.index('const ri ='):src.index('const MODES =')]
    expected=json.loads(Path(HERE,'test_prompt_fipi7_generators.json').read_text())
    js="const crypto=require('crypto');let seed=9137;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);const katex={renderToString:s=>'$'+s+'$'};"+code+'\nconst out={};\n'
    js+='\n'.join(f"out['{name}']=Array.from({{length:100}},()=>{name}());" for name in expected)
    js+="\nprocess.stdout.write(JSON.stringify(Object.fromEntries(Object.entries(out).map(([k,v])=>[k,crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex')]))));"
    r=subprocess.run(['node','-e',js],capture_output=True,text=True);assert not r.returncode,r.stderr
    check('генераторы: 1700 результатов совпали с исходными',json.loads(r.stdout)==expected)

def test_all_answers_and_new_types(browser,bank):
    ctx,page,errors=new_page(browser,f"{BASE}/oge7.html",width=375)
    page.evaluate("startMode('point_on_line_decimal');playMedalAnimation=()=>{}")
    bad=page.evaluate("(tasks)=>{const bad=[];for(const t of tasks){curMode=t.g;curProg=freshProg();curTask=Object.assign(FIPI_BUILD[t.g](...t.args),{fipi:t.fipi});taskAnswered=false;hadWrongPick=false;optionsLocked=false;renderCurrentTask();const b=els.mcqOptions.querySelectorAll('.mcq-btn')[t.ans-1];b.click();if(!taskAnswered || !b.classList.contains('correct'))bad.push([t.fipi,'ответ']);if(document.documentElement.scrollWidth>innerWidth+1)bad.push([t.fipi,'375 px']);}return bad}",bank['tasks'])
    check('каждый из 182 ответов засчитан; все условия на 375 px',not bad,str(bad[:3]))
    for g,n in NEW_KINDS.items():
        page.evaluate('(g)=>{curMode=g;curProg=freshProg();newTask();}',g)
        check(g+': после ФИПИ генератор и плашка',page.evaluate('!curTask.fipi && curTask.basedOnFipi && !!curTask.fipiNotice'))
    # Участник получает готовые варианты, прямую и разбор из снимка.
    page.evaluate("localStorage.setItem('fipiMix:filter',JSON.stringify({fipi:true,own:false}));startMode('sqrt_choice');newTask()")
    state=page.evaluate('tsGetState()');ctx2,peer,err2=new_page(browser,f"{BASE}/oge7.html",width=375)
    peer.evaluate('(s)=>tsApplyState(s)',state)
    check('новый вид: снимок передал то же задание и прямую',page.evaluate('curTask')==peer.evaluate('curTask') and page.inner_html('#questionNumlineHost')==peer.inner_html('#questionNumlineHost'))
    page.evaluate("keypadOpen=false;syncKeypadVisibility()") if page.evaluate("typeof keypadOpen !== 'undefined'") else None
    page.screenshot(path='/private/tmp/oge7-fipi-phone.png',full_page=True)
    check('новые виды: без ошибок JS',not errors+err2,str(errors+err2))
    ctx2.close();ctx.close()

def main():
    generator_contract()
    bank = load_bank()
    test_bank_data(bank)
    # пока сайт ФИПИ не сверил ответы, страница показывает задания банка только с ?all=1
    q = "" if all(t["checked"] for t in bank["tasks"]) else "?all=1"
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        test_builders(browser, bank)
        test_all_answers_and_new_types(browser,bank)
        test_picker(browser, q)
        test_task_flow(browser, bank, q)
        test_cards(browser, bank, q)
        test_without_bank_and_unchecked(browser)
        test_phone(browser, q)
        browser.close()
    failed = [n for n, ok in results if not ok]
    print(f"\n{len(results) - len(failed)}/{len(results)} проверок прошло")
    if not failed:print('готово')
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
