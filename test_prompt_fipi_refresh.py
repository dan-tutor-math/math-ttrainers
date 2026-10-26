"""
Правка «⟳ у вида с одним заданием ФИПИ»: в ОГЭ №6 у «Многоэтажной дроби» в банке
ФИПИ одно задание (D39BF5, 1/(1/30 + 1/42)). Пока оно не решено, правило
«сначала ФИПИ» (fipi-mix.js) отдавало его на каждое нажатие ⟳ — со стороны
выглядело, будто генератор пропал. Теперь, если единственное нерешённое
задание ФИПИ вида уже на экране, ⟳ даёт новое задание генератора («на основе
ФИПИ»), а при выходе в список типов задание ФИПИ снова встаёт первым.

Проверяет:
  1. генератор многоэтажной дроби жив и даёт разные примеры с верным ответом;
  2. ⟳ у «Многоэтажной дроби»: первым — ФИПИ D39BF5, дальше разные задания
     «на основе ФИПИ», без плашки «все решены» (ФИПИ ведь не решены);
  3. выход в список и новый заход — снова ФИПИ первым; карточка «1+ задание»,
     без «ФИПИ решено» (ничего не решено);
  4. решили ФИПИ — как раньше: ⟳ даёт плашку и «на основе ФИПИ»;
  5. фильтр «только ФИПИ» — ⟳ остаётся на единственном задании (пустого экрана
     нет, наши выключены сознательно);
  6. у вида с десятью заданиями ⟳ без решения по-прежнему идёт по заданиям
     ФИПИ, а не уходит в генератор (правка только про единственное задание);
  7. модуль напрямую: два нерешённых задания — выбор среди них, как раньше;
     одно, уже показанное, — генератор; после сброса списком — снова оно.

Совместный режим здесь без сети: живьём (вебсокет к Supabase) его нужно
перепроверять на сайте руками.

Запуск: python3 test_prompt_fipi_refresh.py (сервер поднимается сам).
"""
import contextlib
import http.client
import os
import re
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 9134
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))


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


def new_page(browser, url, width=1300):
    ctx = browser.new_context(viewport={"width": width, "height": 900})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    page.goto(url)
    page.wait_for_timeout(1200)
    return ctx, page, errors


def card(page, mid):
    return page.inner_text(f'.mode-card[data-id="{mid}"]')


def src(page):
    return page.inner_text('#sourceNote').strip() if page.is_visible('#sourceNote') else ''


def notice(page):
    return page.inner_text('#fipiNotice').strip() if page.is_visible('#fipiNotice') else ''


def prompt_of(page):
    return re.sub(r"\s+", " ", page.inner_text('#questionPromptText')).strip()


def refresh(page):
    page.click('#refreshBtn')
    page.wait_for_timeout(200)


def test_generator_alive(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge6.html")
    res = page.evaluate("""() => {
      const keys = new Set(); let bad = 0;
      for (let i = 0; i < 200; i++) {
        const t = gen_p9_nested();
        keys.add(t.prompt + '|' + t.correctValue);
        if (!isFinite(t.correctValue) || !t.explain) bad++;
      }
      return { n: keys.size, bad };
    }""")
    check("генератор многоэтажной дроби: много разных примеров, ответ конечный", res["n"] >= 30 and res["bad"] == 0, str(res))
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_single_fipi_refresh(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge6.html")
    check("карточка: «1+ задание», ничего не решено", "1+ задание" in card(page, "p9") and "решено" not in card(page, "p9"), card(page, "p9"))
    page.click('.mode-card[data-id="p9"]')
    page.wait_for_timeout(300)
    check("заход: первым задание ФИПИ D39BF5", "D39BF5" in src(page), src(page))
    seen, srcs, notes = set(), [], []
    for _ in range(8):
        refresh(page)
        seen.add(prompt_of(page))
        srcs.append(src(page))
        notes.append(notice(page))
    check("⟳: дальше только «на основе ФИПИ», ФИПИ не крутится", all(s == "Задание на основе ФИПИ" for s in srcs), str(srcs))
    check("⟳: примеры меняются (из 8 нажатий не меньше 5 разных)", len(seen) >= 5, str(len(seen)))
    check("⟳: плашки «все решены» нет — ФИПИ не решены", not any(notes), str(notes))
    ok = page.evaluate("""() => {
      const t = curTask; const d = document.createElement('div'); d.innerHTML = t.explain;
      return !t.fipi && d.querySelectorAll('.frac').length >= 6;
    }""")
    check("новое задание — с разбором столбиком, дроби вертикально", ok)

    # выход в список типов и новый заход: ФИПИ снова первым
    page.click('#backBtn')
    page.wait_for_timeout(200)
    check("список: карточка по-прежнему «1+ задание»", "1+ задание" in card(page, "p9") and "решено" not in card(page, "p9"), card(page, "p9"))
    page.click('.mode-card[data-id="p9"]')
    page.wait_for_timeout(300)
    # заход в тип восстанавливает последнее задание из прогресса (так было всегда),
    # поэтому ФИПИ возвращается на первом же ⟳ — пропуск после выхода забыт
    refresh(page)
    check("новый заход: после ⟳ задание ФИПИ D39BF5 снова первое", "D39BF5" in src(page), src(page))
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_solved_flow(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge6.html")
    page.click('.mode-card[data-id="p9"]')
    page.wait_for_timeout(300)
    page.fill('#answerInput', "17,5")
    page.click('#checkAnswerBtn')
    page.wait_for_timeout(200)
    check("решили ФИПИ: ответ 17,5 засчитан", page.evaluate("taskAnswered") is True)
    refresh(page)
    check("после решённого ФИПИ: плашка «Все 1 задание ФИПИ этого вида решены»",
          notice(page).startswith("Все 1 задание ФИПИ этого вида решены"), notice(page))
    check("после решённого ФИПИ: задание на основе ФИПИ", src(page) == "Задание на основе ФИПИ" and page.evaluate("!curTask.fipi"), src(page))
    refresh(page)
    check("дальше плашки уже нет", not notice(page), notice(page))
    page.click('#backBtn')
    page.wait_for_timeout(200)
    check("карточка: «ФИПИ решено 1 из 1»", "ФИПИ решено 1 из 1" in card(page, "p9"), card(page, "p9"))
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_only_fipi_filter(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge6.html")
    page.evaluate("localStorage.setItem('fipiMix:filter', JSON.stringify({fipi: true, own: false}))")
    page.reload()
    page.wait_for_timeout(1000)
    page.click('.mode-card[data-id="p9"]')
    page.wait_for_timeout(300)
    got = []
    for _ in range(3):
        refresh(page)
        got.append(src(page))
    check("«только ФИПИ»: ⟳ остаётся на единственном задании ФИПИ, экран не пустой",
          all("D39BF5" in s for s in got) and bool(prompt_of(page)), str(got))
    page.evaluate("localStorage.removeItem('fipiMix:filter')")
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_many_fipi_unchanged(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge6.html")
    page.click('.mode-card[data-id="p1"]')
    page.wait_for_timeout(300)
    srcs = [src(page)]
    for _ in range(5):
        refresh(page)
        srcs.append(src(page))
    check("у вида с десятью заданиями ⟳ без решения идёт по заданиям ФИПИ",
          all(s.startswith("Источник: открытый банк заданий ФИПИ") for s in srcs), str(srcs))
    ids = [s[-6:] for s in srcs]
    check("и подряд одно и то же не выдаёт", all(a != b for a, b in zip(ids, ids[1:])), str(ids))
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_module(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge6.html")
    res = page.evaluate("""() => {
      localStorage.removeItem('fipiMix:done:tst'); localStorage.removeItem('fipiMix:filter');
      const own = () => ({ own: true });
      const mk = id => ({ fipi: id, make: () => ({ id }) });
      const one = [mk('A')], two = [mk('A'), mk('B')];
      const out = {};
      out.first = FipiMix.next('tst', 'm', one, own).fipi;                       // ещё ничего не показано
      FipiMix.commit('tst', 'm', { fipi: 'A' }, one);                            // показали A
      const again = FipiMix.next('tst', 'm', one, own);
      out.again = again.own === true && again.basedOnFipi === true && !again.fipiNotice;
      FipiMix.commit('tst', 'm', again, one);                                    // наше не стирает «показанное»
      out.stay = FipiMix.next('tst', 'm', one, own).own === true;
      out.two = ['A', 'B'].includes(FipiMix.next('tst', 'm', two, own).fipi);    // из двух выбор, как раньше
      FipiMix.countLabel('tst', 'm', one);                                       // вышли в список
      out.reset = FipiMix.next('tst', 'm', one, own).fipi;
      FipiMix.markDone('tst', 'm', { fipi: 'A' });
      const done = FipiMix.next('tst', 'm', one, own);
      out.done = done.own === true && /Все 1 задание ФИПИ/.test(done.fipiNotice || '');
      localStorage.removeItem('fipiMix:done:tst');
      return out;
    }""")
    check("модуль: до показа единственное задание отдаётся", res["first"] == "A", str(res))
    check("модуль: показанное единственное — генератор, без плашки", res["again"] is True, str(res))
    check("модуль: наши задания не стирают «показанное», ФИПИ не возвращается по кругу", res["stay"] is True, str(res))
    check("модуль: из двух нерешённых выбор, как раньше", res["two"] is True, str(res))
    check("модуль: после выхода в список ФИПИ снова первым", res["reset"] == "A", str(res))
    check("модуль: решённое — плашка и генератор, как раньше", res["done"] is True, str(res))
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def main():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        test_generator_alive(browser)
        test_single_fipi_refresh(browser)
        test_solved_flow(browser)
        test_only_fipi_filter(browser)
        test_many_fipi_unchanged(browser)
        test_module(browser)
        browser.close()
    failed = [n for n, ok in results if not ok]
    print(f"\nИтого: {len(results) - len(failed)} из {len(results)}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
