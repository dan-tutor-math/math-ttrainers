"""
Промпт №55: тренажёр «ЕГЭ профиль» (ege_prof.html) — задания демоверсии 2027.

Проверяет:
  1. каталог: вкладка «ЕГЭ профиль» больше не «скоро», в ней 20 карточек,
     каждая ведёт в ege_prof.html?n=<номер>;
  2. страница открывается по номеру из адреса, переключение номера и
     прототипа работает и переписывает адрес;
  3. часть 1: непонятная запись ответа — это не ошибка, а просьба записать
     иначе; первая неверная попытка красит поле, вторая подставляет верный
     ответ и открывает разбор; верный ответ помечает прототип решённым;
  4. часть 2: поля «да/нет», число точной записью и множество; ответ
     засчитывается по значению, а не по строке (169/5 = 33,8; (1;4] = 1<x≤4);
  5. режимы: «Обучение» открывает решение по шагам, «Тренировка» — кнопкой,
     в «Экзамене» решения нет, пока не ответишь;
  6. мост состояния: снимок одной вкладки переносит на другую номер,
     прототип, режим и результат проверки (это же ест совместная сессия);
  7. подборка и доска: условие с формулами уходит «В подборку» и снимается
     на доску картинкой вместе с рисунком;
  8. банк целиком: у каждого из прототипов эталонный ответ проходит
     собственную проверку, а все условия, шаги и критерии рисуются KaTeX без
     ошибок разметки; у каждой ссылки на рисунок есть сам рисунок.

Совместный режим здесь на заглушке: живьём (вебсокет к Supabase) его нужно
перепроверять на сайте руками.

Запуск: python3 test_prompt55_ege_prof.py (сервер поднимается сам).
"""
import contextlib
import http.client
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8975
BASE = f"http://127.0.0.1:{PORT}"


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT)],
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


results = []


def check(name, ok, extra=""):
    results.append((name, ok))
    print(f"[{'OK' if ok else 'FAIL'}] {name}" + (f": {extra}" if extra and not ok else ""))


def new_page(browser, url, wait=1400):
    ctx = browser.new_context()
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    page.goto(url)
    page.wait_for_timeout(wait)
    return ctx, page, errors


RESET_BTN_JS = """() => {
  const b = document.getElementById('resetProgressBtn');
  if (!b) return null;
  const r = b.getBoundingClientRect();
  const theme = document.getElementById('themeToggle').getBoundingClientRect();
  return { w: Math.round(r.width), h: Math.round(r.height),
           sameRow: Math.abs(r.top - theme.top) < 1, leftOfTheme: r.right < theme.left,
           text: b.textContent.trim(), svg: !!b.querySelector('svg') };
}"""


def test_catalog(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/index.html")
    page.click('.nav-tab[data-id="exams"]')
    page.click('.nav-subtab[data-id="ege_prof"]')
    page.wait_for_timeout(200)
    hrefs = page.eval_on_selector_all('#topics a.topic-item', 'els => els.map(e => e.getAttribute("href"))')
    check("каталог: 20 карточек ЕГЭ профиля", len(hrefs) == 20, str(len(hrefs)))
    check("каталог: ссылки с номером задания",
          hrefs[:2] == ['ege_prof.html?n=1', 'ege_prof.html?n=2'] and hrefs[-1] == 'ege_prof.html?n=20',
          str(hrefs[:3]))
    soon = page.eval_on_selector_all('#topics .coming-soon-tab', 'els => els.length')
    check("каталог: вкладка больше не «скоро»", soon == 0)

    # сброс прогресса — квадратная кнопка третьей в верхнем ряду справа,
    # а не подписанная ссылка под заголовком
    btn = page.evaluate(RESET_BTN_JS)
    check("главная: сброс прогресса стал квадратной кнопкой со значком",
          bool(btn) and btn["w"] == 40 and btn["h"] == 40 and btn["svg"] and btn["text"] == "",
          str(btn))
    check("главная: кнопка сброса в одном ряду с темой и совместным доступом",
          bool(btn) and btn["sameRow"] and btn["leftOfTheme"], str(btn))
    check("каталог: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def open_proto(page, i=1):
    """Открыть i-й прототип со страницы выбора (как в ОГЭ: сначала список)."""
    page.click(f'.mode-card:nth-of-type({i})')
    page.wait_for_timeout(250)


def test_navigation(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/ege_prof.html?n=7")
    check("адрес ?n=7 открывает №7", page.evaluate("S.n") == 7)
    check("заголовок по номеру", "№7" in page.inner_text("#pageTitle"))
    check("сначала открывается список прототипов",
          page.evaluate("S.screen") == "picker"
          and page.eval_on_selector('#taskArea', 'e => e.style.display') == 'none')
    check("в списке три прототипа №7", page.eval_on_selector_all('.mode-card', 'e => e.length') == 3)

    open_proto(page, 3)
    check("карточка прототипа открывает задание",
          page.evaluate("S.pid") == "7.3" and page.evaluate("S.screen") == "task"
          and page.eval_on_selector('#pickerArea', 'e => e.style.display') == 'none')

    page.click('#nextProtoBtn')
    page.wait_for_timeout(250)
    check("«Следующий прототип» листает по кругу", page.evaluate("S.pid") == "7.1")
    page.click('#prevProtoBtn')
    page.wait_for_timeout(250)
    check("«Предыдущий прототип» возвращает назад", page.evaluate("S.pid") == "7.3")

    page.click('#backBtn')
    page.wait_for_timeout(250)
    check("«← все прототипы» возвращает к списку",
          page.evaluate("S.screen") == "picker"
          and page.eval_on_selector('#pickerArea', 'e => e.style.display') != 'none')
    check("номер задания остаётся в адресе", page.url.endswith("n=7"), page.url)

    page.goto(f"{BASE}/ege_prof.html?n=13")
    page.wait_for_timeout(1200)
    open_proto(page, 1)
    check("у единственного прототипа переходов нет",
          page.eval_on_selector('#nextProtoBtn', 'e => e.style.display') == 'none'
          and page.eval_on_selector('#prevProtoBtn', 'e => e.style.display') == 'none')
    check("навигация: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_part1_flow(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/ege_prof.html?n=4")
    page.evaluate("localStorage.removeItem('ogeProg:ege_prof:solved')")
    open_proto(page, 1)

    page.fill('input[data-fid="main"]', '3/10')
    page.click('#answerArea .check-btn')
    page.wait_for_timeout(150)
    check("часть 1: дробь 3/10 — просьба записать иначе, а не ошибка",
          "целое число" in page.inner_text('#answerArea .answer-msg') and page.evaluate("totalErrors") == 0)

    page.fill('input[data-fid="main"]', '0,7')
    page.click('#answerArea .check-btn')
    page.wait_for_timeout(150)
    check("часть 1: первая неверная попытка — красное поле",
          page.evaluate("S.hadWrong") is True and not page.evaluate("S.answered")
          and page.eval_on_selector('input[data-fid="main"]', 'e => e.classList.contains("bad")'))
    check("часть 1: решение пока не показано", page.eval_on_selector('#mainPanel', 'e => e.style.display') == 'none')

    page.fill('input[data-fid="main"]', '0,71')
    page.click('#answerArea .check-btn')
    page.wait_for_timeout(150)
    check("часть 1: вторая неверная — подставлен верный ответ",
          page.eval_on_selector('input[data-fid="main"]', 'e => e.value') == '0,3'
          and page.evaluate("S.answered") is True and page.evaluate("S.correct") is False)
    check("часть 1: разбор открылся", page.eval_on_selector('#mainPanel', 'e => e.style.display') == 'block')
    check("часть 1: ответ в разборе", "0,3" in page.inner_text('#solAnswer'))

    page.click('#nextBtn')
    page.wait_for_timeout(200)
    check("«следующий прототип» листает внутри номера", page.evaluate("S.pid") == "4.2")

    page.fill('input[data-fid="main"]', '0,38')
    page.click('#answerArea .check-btn')
    page.wait_for_timeout(200)
    check("часть 1: верный ответ засчитан",
          page.evaluate("S.correct") is True and page.evaluate("totalSolved") == 1)
    check("часть 1: прототип отмечен решённым",
          "4.2" in page.evaluate("localStorage.getItem('ogeProg:ege_prof:solved')"))
    check("часть 1: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_part2_flow(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/ege_prof.html?n=18")
    # 18.2: ответ 169/5 — принимаем и дробью, и десятичной записью
    open_proto(page, 2)
    page.fill('input[data-fid="b"]', '33,8')
    page.click('#answerArea .check-btn')
    page.wait_for_timeout(200)
    check("часть 2: 33,8 засчитано вместо 169/5", page.evaluate("S.correct") is True)

    page.goto(f"{BASE}/ege_prof.html?n=15")
    page.wait_for_timeout(1200)
    open_proto(page, 1)
    page.fill('input[data-fid="b"]', '72*sqrt3')
    page.click('#answerArea .check-btn')
    page.wait_for_timeout(200)
    check("часть 2: 72*sqrt3 засчитано вместо 72√3", page.evaluate("S.correct") is True)

    page.goto(f"{BASE}/ege_prof.html?n=16")
    page.wait_for_timeout(1200)
    open_proto(page, 1)
    page.fill('input[data-fid="ans"]', '1<x<=4')
    page.click('#answerArea .check-btn')
    page.wait_for_timeout(200)
    check("часть 2: неравенство 1<x<=4 засчитано вместо (1;4]", page.evaluate("S.correct") is True)

    page.goto(f"{BASE}/ege_prof.html?n=14")
    page.wait_for_timeout(1200)
    open_proto(page, 1)
    page.fill('input[data-fid="b"]', '-7π/2; -5π/2; -15π/4')
    page.click('#answerArea .check-btn')
    page.wait_for_timeout(200)
    check("часть 2: корни в другом порядке засчитаны", page.evaluate("S.correct") is True)

    page.goto(f"{BASE}/ege_prof.html?n=20")
    page.wait_for_timeout(1200)
    open_proto(page, 1)
    page.click('.yn-group[data-fid="a"] .yn-btn[data-val="да"]')
    page.click('.yn-group[data-fid="b"] .yn-btn[data-val="да"]')
    page.fill('input[data-fid="c"]', '150')
    page.click('#answerArea .check-btn')
    page.wait_for_timeout(200)
    check("часть 2: неверное «да» помечено, верные — нет",
          page.evaluate("S.marks.b") == 'bad' and page.evaluate("S.marks.a") == 'good'
          and page.evaluate("S.marks.c") == 'good')
    check("часть 2: критерии ФИПИ есть в разборе",
          page.eval_on_selector_all('#critTable tr', 'e => e.length') == 5)
    check("часть 2: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_modes(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/ege_prof.html?n=11")
    open_proto(page, 1)
    check("экзамен: решения не видно", page.eval_on_selector('#mainPanel', 'e => e.style.display') == 'none')

    page.click('#tabPractice')
    page.wait_for_timeout(150)
    check("тренировка: есть кнопка «Показать решение и ответ»",
          page.eval_on_selector('#card1BtnRow', 'e => e.style.display') != 'none')
    page.click('#showSolutionBtn')
    page.wait_for_timeout(150)
    shown = page.eval_on_selector_all('#solSteps .sol-step', 'els => els.filter(e => e.style.display !== "none").length')
    check("тренировка: решение раскрывается целиком", shown == page.evaluate("curProto.steps.length"))
    page.click('#showSolutionBtn')
    page.wait_for_timeout(150)
    check("тренировка: решение прячется обратно",
          page.eval_on_selector('#mainPanel', 'e => e.style.display') == 'none')

    page.click('#tabLearn')
    page.wait_for_timeout(150)
    shown = page.eval_on_selector_all('#solSteps .sol-step', 'els => els.filter(e => e.style.display !== "none").length')
    check("обучение: сначала один шаг и идея", shown == 1
          and page.eval_on_selector('#solHint', 'e => e.style.display') != 'none')
    check("обучение: ответ ещё закрыт", page.eval_on_selector('#solAnswer', 'e => e.style.display') == 'none')
    total = page.evaluate("curProto.steps.length")
    for _ in range(total - 1):
        page.click('#nextStepBtn')
        page.wait_for_timeout(80)
    shown = page.eval_on_selector_all('#solSteps .sol-step', 'els => els.filter(e => e.style.display !== "none").length')
    check("обучение: шаги открываются по одному до конца", shown == total)
    check("обучение: в конце показан ответ",
          page.eval_on_selector('#solAnswer', 'e => e.style.display') == 'block')
    check("режимы: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_state_bridge(browser):
    ctx1, teacher, err1 = new_page(browser, f"{BASE}/ege_prof.html?n=1")
    ctx2, student, err2 = new_page(browser, f"{BASE}/ege_prof.html?n=12")

    teacher.goto(f"{BASE}/ege_prof.html?n=12")
    teacher.wait_for_timeout(1200)
    open_proto(teacher, 3)
    teacher.click('#tabPractice')
    teacher.fill('input[data-fid="main"]', '64')
    teacher.click('#answerArea .check-btn')
    teacher.wait_for_timeout(200)

    snapshot = teacher.evaluate("JSON.parse(JSON.stringify(tsGetState()))")
    student.evaluate("s => tsApplyState(s)", snapshot)
    student.wait_for_timeout(300)
    check("мост: номер и прототип переехали",
          student.evaluate("S.n") == 12 and student.evaluate("S.pid") == "12.3")
    check("мост: режим переехал", student.evaluate("S.mode") == 'practice')
    check("мост: результат проверки переехал",
          student.evaluate("S.answered") is True and student.evaluate("S.marks.main") == 'good')
    check("мост: у второй вкладки открылся тот же разбор",
          student.eval_on_selector('#mainPanel', 'e => e.style.display') == 'block')
    check("мост: без ошибок JS", not err1 and not err2, str((err1 or err2)[:1]))
    ctx1.close(); ctx2.close()


def test_bank(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/ege_prof.html?n=1")
    report = page.evaluate("""() => {
      const bad = { answer: [], katex: [], figs: [], fields: [] };
      const nums = Object.keys(BANK).map(Number);
      let protos = 0;
      const box = document.createElement('div');
      box.style.cssText = 'position:absolute;left:-9999px;top:0;width:800px';
      document.body.appendChild(box);
      for (const n of nums) {
        const t = BANK[n];
        for (const p of t.protos) {
          protos++;
          // рисунки, на которые ссылается прототип, должны существовать
          const keys = [];
          if (p.fig) keys.push(p.fig);
          (p.steps || []).forEach(s => { const m = s.match(/\\[\\[fig:([\\w.-]+)\\]\\]/g) || []; m.forEach(x => keys.push(x.slice(6, -2))); });
          keys.forEach(k => { if (!FIGS[k]) bad.figs.push(p.id + ':' + k); });
          // вся разметка прототипа должна отрисоваться KaTeX без ошибок
          const parts = [p.text, p.hint || '', p.answerTex || '', p.manual || ''].concat(p.steps || [])
            .concat((p.criteria || []).map(c => c[1]));
          box.innerHTML = parts.map(rich).join('');
          if (box.querySelector('.katex-error')) bad.katex.push(p.id);
          // эталонный ответ обязан проходить собственную проверку
          if (t.part === 1) {
            const f = { id: 'main', type: 'plain', value: p.answer };
            if (checkField(f, p.answer, S) !== true) bad.answer.push(p.id);
          } else {
            if (!p.fields || !p.fields.length) { bad.fields.push(p.id); continue; }
            for (const f of p.fields) {
              if (f.type === 'yesno') {
                S.yn[f.id] = f.value;
                if (checkField(f, null, S) !== true) bad.answer.push(p.id + '/' + f.id);
                S.yn = {};
              } else if (checkField(f, f.value, S) !== true) {
                bad.answer.push(p.id + '/' + f.id);
              }
            }
          }
        }
      }
      box.remove();
      return { protos, nums: nums.length, bad };
    }""")
    check("банк: 20 позиций", report["nums"] == 20, str(report["nums"]))
    check("банк: 49 прототипов демоверсии", report["protos"] == 49, str(report["protos"]))
    check("банк: эталонные ответы проходят проверку", not report["bad"]["answer"], str(report["bad"]["answer"]))
    check("банк: формулы рисуются без ошибок", not report["bad"]["katex"], str(report["bad"]["katex"]))
    check("банк: все рисунки на месте", not report["bad"]["figs"], str(report["bad"]["figs"]))
    check("банк: у заданий части 2 есть поля ответа", not report["bad"]["fields"], str(report["bad"]["fields"]))

    # разбор записи ответа: то, ради чего сравниваем значения, а не строки
    cases = page.evaluate("""() => ({
      expr: [evalExpr('72√3'), evalExpr('169/5'), evalExpr('-15π/4'), evalExpr('√6/3'), evalExpr('2^3')],
      bad: [evalExpr('72√'), evalExpr('abc'), evalExpr('')].map(v => Number.isNaN(v)),
      sets: [
        sameSets(parseSet('(-∞;0); 1/3; (2/3;+∞)'), parseSet('x<0; x=1/3; x>2/3')),
        sameSets(parseSet('(1;4]'), parseSet('(1;4)')),
        sameSets(parseSet('a<-2; -2<a<-1; a=0; a>1'), parseSet('a<-2;-2<a<-1;a=0;a>1')),
        sameSets(parseSet('(1;3);[3;4]'), parseSet('(1;4]'))
      ],
      plain: [parsePlain('259 200'), parsePlain('-0,2'), parsePlain('1/5')]
    })""")
    ok_expr = (abs(cases["expr"][0] - 124.70765814495915) < 1e-9 and abs(cases["expr"][1] - 33.8) < 1e-12
               and abs(cases["expr"][2] + 11.780972450961723) < 1e-9
               and abs(cases["expr"][3] - 0.816496580927726) < 1e-9 and cases["expr"][4] == 8)
    check("разбор: точные записи считаются верно", ok_expr, str(cases["expr"]))
    check("разбор: мусор не проходит за число", all(cases["bad"]), str(cases["bad"]))
    check("разбор: множества сравниваются по смыслу",
          cases["sets"] == [True, False, True, True], str(cases["sets"]))
    check("разбор: часть 1 — только целое или десятичная дробь",
          cases["plain"][0] == 259200 and cases["plain"][1] == -0.2 and cases["plain"][2] is None,
          str(cases["plain"]))
    check("банк: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_basket(browser):
    """«В подборку» кладёт условие с формулами — и оно читается на главной."""
    ctx = browser.new_context()
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    page.goto(f"{BASE}/ege_prof.html?n=8")
    page.wait_for_timeout(1400)
    open_proto(page, 1)
    page.evaluate("localStorage.removeItem('ogeBasket:v1')")
    page.click('#basketAddBtn')
    page.wait_for_timeout(300)
    item = page.evaluate("() => (JSON.parse(localStorage.getItem('ogeBasket:v1') || '[]') || [])[0] || null")
    check("подборка: задание сохранено с номером тренажёра",
          bool(item) and item.get("trainerId") == "ege8", str(item and item.get("trainerId")))
    check("подборка: формула ушла исходником, а не вёрсткой KaTeX",
          bool(item) and "basket-tex" in (item.get("html") or ""), "")

    page.goto(f"{BASE}/index.html")
    page.wait_for_timeout(800)
    page.click('#basketToggle')
    page.wait_for_timeout(400)
    src = page.eval_on_selector('.basket-item-src', 'e => e.textContent')
    check("подборка: подписана названием задания ЕГЭ", "№8" in src, src)
    check("подборка: формула нарисовалась без ошибок",
          page.eval_on_selector_all('.basket-item .katex-error', 'e => e.length') == 0
          and page.eval_on_selector_all('.basket-item .katex', 'e => e.length') > 0)
    check("подборка: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


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

BOOT_JS = """() => {
  const gate = document.getElementById('authGate');
  if (gate) gate.style.display = 'none';
  window.boardsAppBoot();
}"""


def test_board_capture(browser):
    """Задание ЕГЭ снимается на доску картинкой — вместе с рисунком.

    Рисунки здесь не картинки, а встроенный SVG с цветами через переменные
    страницы; html2canvas рисует такой SVG отдельной картинкой, где переменных
    уже нет, поэтому в ege-prof-figs.js у каждого цвета есть запасное значение.
    Этот тест и следит, что снимок получается непустым."""
    ctx = browser.new_context()
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    page.goto(f"{BASE}/boards.html")
    board = {"id": "bE", "name": "ЕГЭ", "folderId": None, "createdAt": 1000, "updatedAt": 1000,
             "lastOpenedAt": None, "rev": 1, "cellSize": 24, "sheetCols": 76, "sheetRows": 54,
             "pageOrder": "h", "recentColors": [], "colorUsage": {}, "view": {"x": 0, "y": 0, "zoom": 1}}
    page.evaluate(SEED_JS, [[board], {"bE": {"objects": [], "imageLib": []}}])
    page.reload()
    page.evaluate(BOOT_JS)
    page.wait_for_function("() => window.getDB && window.getDB().boards.length >= 1")
    page.evaluate("() => window.openBoard('bE')")
    page.wait_for_function("() => window.getCurrentBoard() && window.getCurrentBoard().id === 'bE'")

    page.evaluate("() => document.getElementById('bdTrainersToggle').click()")
    page.wait_for_timeout(400)
    page.evaluate('() => document.querySelector(\'.bd-trainers-item[data-id="ege1"]\').click()')
    page.wait_for_timeout(3000)
    # в панели тренажёр открывается на списке прототипов — выбираем первый
    page.frame_locator('#bdTrainersIframe').locator('.mode-card').first.click()
    page.wait_for_timeout(1200)
    page.evaluate("() => document.getElementById('bdTrainersAddBtn').click()")
    try:
        page.wait_for_function("() => (window.getCurrentBoard().objects || []).length > 0", timeout=25000)
        ok = True
    except Exception:
        ok = False
    obj = page.evaluate("""() => {
      const o = (window.getCurrentBoard().objects || [])[0];
      if (!o) return null;
      const src = o.src || (window.getCurrentBoard().imageLib || []).map(i => i.src).find(Boolean) || '';
      return { type: o.type, w: o.w || 0, h: o.h || 0, len: String(src).length };
    }""")
    check("доски: задание ЕГЭ легло на доску картинкой",
          ok and obj and obj["type"] == "image", str(obj))
    check("доски: снимок не пустой (рисунок уместился)",
          bool(obj) and obj["w"] > 40 and obj["h"] > 40 and obj["len"] > 5000, str(obj))
    check("доски: снимок без ошибок JS",
          not [e for e in errors if "drawImage" not in e], str(errors[:1]))
    ctx.close()


def test_boards_registry(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/boards.html", wait=1800)
    got = page.evaluate("""() => ({
      capture: !!(TRAINER_CAPTURE['ege1'] && TRAINER_CAPTURE['ege20']),
      panel: (TRAINERS_PANEL_GROUPS.find(g => g.title === 'ЕГЭ профиль') || {items: []}).items.length,
      name: TRAINER_NAMES['ege19'] || ''
    })""")
    check("доски: снимок задания настроен для ЕГЭ", got["capture"])
    check("доски: в панели тренажёров 20 номеров ЕГЭ", got["panel"] == 20, str(got["panel"]))
    check("доски: подпись для подборки", "№19" in got["name"], got["name"])
    check("доски: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def run():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        test_catalog(browser)
        test_navigation(browser)
        test_part1_flow(browser)
        test_part2_flow(browser)
        test_modes(browser)
        test_state_bridge(browser)
        test_bank(browser)
        test_basket(browser)
        test_board_capture(browser)
        test_boards_registry(browser)
        browser.close()
    print()
    failed = [name for name, ok in results if not ok]
    if failed:
        print("ПРОВАЛЫ:", "; ".join(failed))
        sys.exit(1)
    print(f"ИТОГ: всё прошло ({len(results)} проверок)")


if __name__ == "__main__":
    run()
