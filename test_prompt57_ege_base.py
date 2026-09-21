"""
Промпт №57: тренажёр «ЕГЭ база» (ege_base.html) — задания демоверсии 2027.

Проверяет:
  1. страницы ЕГЭ база и ЕГЭ профиль не разошлись: ege_base.html совпадает
     с ege_prof.html всюду, кроме блока настроек EXAM (sync_ege_pages.py);
  2. каталог: вкладка «ЕГЭ база» больше не «скоро», в ней 21 карточка,
     названия те же, что в банке и в панели тренажёров на доске;
  3. страница: номер из адреса, заголовок без «части», список прототипов, у
     похожих прототипов — разные короткие описания;
  4. банк целиком: 21 позиция, 80 прототипов; эталон и все ответы «<или>»
     проходят проверку, формулы рисуются KaTeX без ошибок, рисунки на месте;
     в №19 список верных ответов совпадает с полным перебором;
  5. ответы цифрами подряд: «21» вместо «12» в №8 засчитывается, «1, 2» —
     просьба переписать, а не ошибка; соответствие с перестановкой — ошибка;
     другой верный ответ из ключа ФИПИ засчитывается и виден в разборе;
  6. таблицы, столбцы соответствия и рисунок внутри столбца на месте;
  7. база отдельно от профиля: свой прогресс, своя подборка (egeb…), свой
     слаг сессии; «+1» и клавиатура без π работают;
  8. доска: задание с картой-картинкой (№9) снимается на доску; реестр
     доски знает все 21 номер.

Совместный режим здесь на заглушке: живьём (вебсокет к Supabase) его нужно
перепроверять на сайте руками.

Запуск: python3 test_prompt57_ege_base.py (сервер поднимается сам).
"""
import contextlib
import http.client
import itertools
import math
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8978
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))


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


results = []


def check(name, ok, extra=""):
    results.append((name, ok))
    print(f"[{'OK' if ok else 'FAIL'}] {name}" + (f": {extra}" if extra and not ok else ""))


def new_page(browser, url, wait=1400, width=1300):
    ctx = browser.new_context(viewport={"width": width, "height": 1000})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    page.goto(url)
    page.wait_for_timeout(wait)
    return ctx, page, errors


def open_proto(page, pid):
    page.click(f'.mode-card[data-pid="{pid}"]')
    page.wait_for_timeout(250)


def answer(page, value):
    page.fill('#answerArea input.answer-input', value)
    page.click('#answerArea .check-btn')
    page.wait_for_timeout(150)


def test_pages_in_sync():
    r = subprocess.run([sys.executable, os.path.join(HERE, 'sync_ege_pages.py'), '--check'],
                       capture_output=True, text=True)
    check("страницы: ЕГЭ база совпадает с профилем, кроме настроек", r.returncode == 0,
          (r.stdout + r.stderr)[-400:])


def test_catalog(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/index.html")
    page.click('.nav-tab[data-id="exams"]')
    page.click('.nav-subtab[data-id="ege_base"]')
    page.wait_for_timeout(200)
    hrefs = page.eval_on_selector_all('#topics a.topic-item', 'els => els.map(e => e.getAttribute("href"))')
    check("каталог: 21 карточка ЕГЭ базы", len(hrefs) == 21, str(len(hrefs)))
    check("каталог: ссылки с номером задания",
          hrefs[:1] == ['ege_base.html?n=1'] and hrefs[-1:] == ['ege_base.html?n=21'], str(hrefs[:2]))
    soon = page.eval_on_selector_all('#topics .coming-soon-tab', 'els => els.length')
    check("каталог: вкладка больше не «скоро»", soon == 0)
    titles = page.evaluate("EGE_BASE_TITLES")
    ctx.close()

    ctx, page, errors2 = new_page(browser, f"{BASE}/ege_base.html?n=1")
    bank = page.evaluate("Object.keys(BANK).map(Number).sort((a,b)=>a-b).map(n => BANK[n].title)")
    check("каталог: названия совпадают с банком", titles == bank, str([t for t in zip(titles, bank) if t[0] != t[1]][:2]))
    ctx.close()
    check("каталог: без ошибок JS", not errors and not errors2, str((errors or errors2)[:1]))
    return titles


def test_page(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/ege_base.html?n=7")
    check("страница: номер из адреса", page.evaluate("S.n") == 7)
    check("страница: заголовок «ЕГЭ база · №7»", page.inner_text('#pageTitle') == 'ЕГЭ база · №7',
          page.inner_text('#pageTitle'))
    sub = page.inner_text('#pageSub')
    check("страница: у базы нет «части» в подзаголовке", 'часть' not in sub and '1 балл' in sub, sub)
    check("страница: сначала список прототипов", page.eval_on_selector('#pickerArea', 'e => e.style.display') != 'none'
          and page.eval_on_selector_all('#protoList .mode-card', 'e => e.length') == 4)
    page.goto(f"{BASE}/ege_base.html?n=2")
    page.wait_for_timeout(1000)
    peeks = page.eval_on_selector_all('#protoList .mpeek', 'els => els.map(e => e.textContent.trim())')
    check("страница: у похожих прототипов разные описания в списке", len(set(peeks)) == 3, str(peeks))
    open_proto(page, '2.1')
    check("страница: слаг сессии и префикс подборки свои", page.evaluate("EXAM.slug") == 'ege_base'
          and page.evaluate("EXAM.idPrefix") == 'egeb')
    check("страница: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


BANK_JS = """() => {
  const bad = { answer: [], alts: [], katex: [], figs: [], fmt: [] };
  const nums = Object.keys(BANK).map(Number);
  let protos = 0;
  const box = document.createElement('div');
  box.style.cssText = 'position:absolute;left:-9999px;top:0;width:800px';
  document.body.appendChild(box);
  for (const n of nums) {
    S.n = n;
    for (const p of BANK[n].protos) {
      protos++;
      const keys = [];
      if (p.fig) keys.push(p.fig);
      [p.text, p.peek || ''].concat(p.steps || []).forEach(s => {
        (String(s).match(/\\[\\[fig:([\\w.-]+)\\]\\]/g) || []).forEach(x => keys.push(x.slice(6, -2)));
      });
      keys.forEach(k => { if (!FIGS[k]) bad.figs.push(p.id + ':' + k); });
      const parts = [p.text, p.peek || '', p.hint || ''].concat(p.steps || []);
      box.innerHTML = parts.map(rich).join('') + answerLine(p);
      if (box.querySelector('.katex-error')) bad.katex.push(p.id);
      const f = fieldsOf(p)[0];
      if (checkField(f, p.answer, S) !== true) bad.answer.push(p.id);
      (p.alts || []).forEach(a => { if (checkField(f, a, S) !== true) bad.alts.push(p.id + '/' + a); });
      if (p.anyOrder) {
        const rev = String(p.answer).split('').reverse().join('');
        if (checkField(f, rev, S) !== true) bad.alts.push(p.id + '/обратный порядок');
      }
      if (p.seq) {
        // «1, 2» — не ошибка, а просьба переписать; пробелы не мешают
        if (checkField(f, String(p.answer).split('').join(', '), S) !== null) bad.fmt.push(p.id + '/запятые');
        if (checkField(f, String(p.answer).split('').join(' '), S) !== true) bad.fmt.push(p.id + '/пробелы');
      }
    }
  }
  box.remove();
  return { protos, nums: nums.length, bad };
}"""


def test_bank(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/ege_base.html?n=1")
    rep = page.evaluate(BANK_JS)
    check("банк: 21 позиция", rep["nums"] == 21, str(rep["nums"]))
    check("банк: 80 прототипов демоверсии", rep["protos"] == 80, str(rep["protos"]))
    check("банк: эталонные ответы проходят проверку", not rep["bad"]["answer"], str(rep["bad"]["answer"]))
    check("банк: ответы «<или>» и перестановки засчитываются", not rep["bad"]["alts"], str(rep["bad"]["alts"]))
    check("банк: последовательность цифр — запятые просят переписать, пробелы не мешают",
          not rep["bad"]["fmt"], str(rep["bad"]["fmt"]))
    check("банк: формулы рисуются без ошибок", not rep["bad"]["katex"], str(rep["bad"]["katex"]))
    check("банк: все рисунки на месте", not rep["bad"]["figs"], str(rep["bad"]["figs"]))
    used = page.evaluate("""() => { const s = new Set();
      Object.values(BANK).forEach(t => t.protos.forEach(p => {
        if (p.fig) s.add(p.fig);
        (p.text.match(/\\[\\[fig:([\\w.-]+)\\]\\]/g) || []).forEach(x => s.add(x.slice(6, -2)));
      })); return Object.keys(FIGS).filter(k => !s.has(k)); }""")
    check("банк: лишних рисунков нет", not used, str(used))

    # №19: список верных ответов из ключа ФИПИ — полный (сверка с перебором)
    got = page.evaluate("() => ['19.1','19.2','19.3','19.4'].map(id => { const p = BANK[19].protos.find(x => x.id === id); return [p.answer].concat(p.alts || []).map(Number).sort((a,b)=>a-b); })")
    want = [
        [n for n in range(1000, 10000) if n % 45 == 0 and len(set(str(n))) == 4 and all(int(d) % 2 == 0 for d in str(n))],
        sorted(int(''.join(p)) for p in itertools.permutations('1368')
               if int(''.join(p)) > 1500 and sorted(str(2 * int(''.join(p)))) == sorted('2367')),
        [n for n in range(1000, 10000) if n % 12 == 0 and math.prod(int(d) for d in str(n)) == 10],
        sorted({int(''.join(c for i, c in enumerate('45341527') if i not in drop))
                for drop in itertools.combinations(range(8), 3)
                if int(''.join(c for i, c in enumerate('45341527') if i not in drop)) % 22 == 0}),
    ]
    check("банк: в №19 перечислены все верные числа (перебор)", got == want, str(got))
    check("банк: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_answers(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/ege_base.html?n=8")
    open_proto(page, '8.1')
    hint = page.inner_text('#answerArea .field-hint')
    check("ответ: под полем подсказка про запись цифрами подряд", 'подряд' in hint, hint)
    answer(page, '1, 2')
    msg = page.inner_text('#answerArea .answer-msg')
    check("ответ: «1, 2» — просьба переписать, а не ошибка",
          'подряд' in msg and page.evaluate("totalErrors") == 0 and not page.evaluate("S.answered"), msg)
    answer(page, '21')
    check("ответ: в №8 порядок цифр не важен — «21» засчитано", page.evaluate("S.correct") is True)
    check("ответ: в разборе сказано, что порядок не важен", 'порядок цифр не важен' in page.inner_text('#solAnswer'))

    page.goto(f"{BASE}/ege_base.html?n=2")
    page.wait_for_timeout(1000)
    open_proto(page, '2.1')
    answer(page, '2134')
    check("ответ: в соответствии порядок важен — перестановка неверна",
          page.evaluate("S.marks.main") == 'bad' and page.evaluate("totalErrors") == 1)

    page.goto(f"{BASE}/ege_base.html?n=19")
    page.wait_for_timeout(1000)
    open_proto(page, '19.2')
    answer(page, '3816')
    check("ответ: другой верный ответ из ключа ФИПИ засчитан", page.evaluate("S.correct") is True)
    check("ответ: в разборе перечислены и другие верные ответы", '3816' in page.inner_text('#solAnswer'))

    page.goto(f"{BASE}/ege_base.html?n=15")
    page.wait_for_timeout(1000)
    open_proto(page, '15.4')
    answer(page, '27 840')
    check("ответ: число с пробелом между разрядами засчитано", page.evaluate("S.correct") is True)

    page.goto(f"{BASE}/ege_base.html?n=5")
    page.wait_for_timeout(1000)
    open_proto(page, '5.1')
    answer(page, '0.97')
    check("ответ: десятичная точка вместо запятой засчитана", page.evaluate("S.correct") is True)
    check("ответ: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_layout(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/ege_base.html?n=6")
    open_proto(page, '6.2')
    rows = page.eval_on_selector_all('#questionText table.ege-table tr', 'e => e.length')
    check("вёрстка: таблица сумок — заголовок и шесть строк", rows == 7, str(rows))
    page.goto(f"{BASE}/ege_base.html?n=18")
    page.wait_for_timeout(1000)
    open_proto(page, '18.2')
    cols = page.eval_on_selector_all('#questionText .ege-match > div', 'e => e.length')
    fig = page.eval_on_selector_all('#questionText .ege-match .ege-fig svg', 'e => e.length')
    check("вёрстка: два столбца соответствия, рисунок решений внутри", cols == 2 and fig == 1, f"{cols} {fig}")
    side = page.evaluate("""() => { const c = document.querySelectorAll('#questionText .ege-match > div');
      return c[1].getBoundingClientRect().left > c[0].getBoundingClientRect().right - 1; }""")
    check("вёрстка: на широком экране столбцы рядом", side)
    page.set_viewport_size({"width": 390, "height": 844})
    page.wait_for_timeout(200)
    stacked = page.evaluate("""() => { const c = document.querySelectorAll('#questionText .ege-match > div');
      return c[1].getBoundingClientRect().top >= c[0].getBoundingClientRect().bottom - 1; }""")
    check("вёрстка: на телефоне столбцы друг под другом", stacked)
    page.goto(f"{BASE}/ege_base.html?n=6")
    page.wait_for_timeout(1000)
    open_proto(page, '6.1')
    over = page.evaluate("document.documentElement.scrollWidth > window.innerWidth + 1")
    check("вёрстка: широкая таблица на телефоне не распирает страницу", not over)
    check("вёрстка: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_separate_from_profile(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/ege_base.html?n=8")
    open_proto(page, '8.2')
    answer(page, '12')
    keys = page.evaluate("Object.keys(localStorage).filter(k => k.startsWith('ogeProg:'))")
    check("отдельно: прогресс базы — под своим ключом",
          'ogeProg:ege_base:solved' in keys and not any(k.startswith('ogeProg:ege_prof') for k in keys), str(keys))
    page.evaluate("localStorage.removeItem('ogeBasket:v1')")
    page.click('#basketAddBtn')
    page.wait_for_timeout(200)
    item = page.evaluate("(JSON.parse(localStorage.getItem('ogeBasket:v1') || '[]') || [])[0] || null")
    check("отдельно: подборка подписана номером базы (egeb8)", bool(item) and item.get('trainerId') == 'egeb8',
          str(item and item.get('trainerId')))
    page.goto(f"{BASE}/ege_prof.html?n=8")
    page.wait_for_timeout(1000)
    solved = page.evaluate("solvedIds")
    check("отдельно: решённое в базе не отмечено в профиле", solved == [], str(solved))

    page.goto(f"{BASE}/ege_base.html?n=12")
    page.wait_for_timeout(1000)
    open_proto(page, '12.1')
    page.click('#addRailToggle')
    page.click('.add-qty-btn[data-n="2"]')
    page.wait_for_timeout(300)
    check("карточки: «+2» добавил следующие прототипы", page.evaluate("S.cards.map(c => c.pid).join()") == '12.2,12.3')
    keys = page.eval_on_selector_all('#keypadButtons button', 'es => es.map(e => e.dataset.key)')
    check("клавиатура: в базе без π и корня (ответ — число с бланка)", 'π' not in keys and '0' in keys)
    check("отдельно: без ошибок JS", not errors, str(errors[:1]))
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


def test_boards(browser, titles):
    ctx, page, errors = new_page(browser, f"{BASE}/boards.html", wait=1800)
    got = page.evaluate("""() => ({
      capture: !!(TRAINER_CAPTURE['egeb1'] && TRAINER_CAPTURE['egeb21']),
      panel: (TRAINERS_PANEL_GROUPS.find(g => g.title === 'ЕГЭ база') || {items: []}).items,
      name: TRAINER_NAMES['egeb19'] || ''
    })""")
    check("доски: снимок задания настроен для ЕГЭ базы", got["capture"])
    check("доски: в панели 21 номер базы с названиями как на главной",
          [i["name"].split('. ', 1)[1] for i in got["panel"]] == titles, str(len(got["panel"])))
    check("доски: подпись для подборки", got["name"].startswith('ЕГЭ база №19'), got["name"])
    ctx.close()

    # сам снимок: у №9 рисунок — карта-картинка внутри SVG; html2canvas
    # должен её снять, а не упасть и не положить на доску пустое место
    ctx = browser.new_context()
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    page.goto(f"{BASE}/boards.html")
    board = {"id": "bB", "name": "ЕГЭ база", "folderId": None, "createdAt": 1000, "updatedAt": 1000,
             "lastOpenedAt": None, "rev": 1, "cellSize": 24, "sheetCols": 76, "sheetRows": 54,
             "pageOrder": "h", "recentColors": [], "colorUsage": {}, "view": {"x": 0, "y": 0, "zoom": 1}}
    page.evaluate(SEED_JS, [[board], {"bB": {"objects": [], "imageLib": []}}])
    page.reload()
    page.evaluate(BOOT_JS)
    page.wait_for_function("() => window.getDB && window.getDB().boards.length >= 1")
    page.evaluate("() => window.openBoard('bB')")
    page.wait_for_function("() => window.getCurrentBoard() && window.getCurrentBoard().id === 'bB'")
    page.evaluate("() => document.getElementById('bdTrainersToggle').click()")
    page.wait_for_timeout(400)
    page.evaluate('() => document.querySelector(\'.bd-trainers-item[data-id="egeb9"]\').click()')
    page.wait_for_timeout(3000)
    page.frame_locator('#bdTrainersIframe').locator('.mode-card').first.click()
    page.wait_for_timeout(1500)
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
    check("доски: задание с картой легло на доску картинкой", ok and obj and obj["type"] == "image", str(obj))
    check("доски: снимок не пустой (карта уместилась)",
          bool(obj) and obj["w"] > 40 and obj["h"] > 40 and obj["len"] > 20000, str(obj))
    check("доски: снимок без ошибок JS", not [e for e in errors if "drawImage" not in e], str(errors[:1]))
    ctx.close()


def run():
    test_pages_in_sync()
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        titles = test_catalog(browser)
        test_page(browser)
        test_bank(browser)
        test_answers(browser)
        test_layout(browser)
        test_separate_from_profile(browser)
        test_boards(browser, titles)
        browser.close()
    print()
    failed = [name for name, ok in results if not ok]
    if failed:
        print("ПРОВАЛЫ:", "; ".join(failed))
        sys.exit(1)
    print(f"ИТОГ: всё прошло ({len(results)} проверок)")


if __name__ == "__main__":
    run()
