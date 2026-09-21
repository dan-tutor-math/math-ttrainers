"""
Промпт №62: кнопка «История решённого» прилипала к плашкам статистики.

В ЕГЭ профиле (и собранных из него ЕГЭ базе и ОГЭ, часть 2) у кнопки был
отступ сверху 2px, а у .stats стоит overflow:hidden (ради плавного
сворачивания в режиме «свернуть подсказки»), который срезает нижнюю тень
карточек. В итоге кнопка визуально наползала на статистику. В ОГЭ-тренажёрах
отступ 18px — выравниваем под них.

Вторая часть: у плашек статистики («решено», «ошибок», «серия») была своя
тень, а тот же overflow:hidden срезал её снизу и по углам — оставались
полоски по бокам. Тень убрана во всех тренажёрах, плашки теперь в один ряд с
кнопками калькулятора (у тех тени нет).

Проверяет:
  1. на страницах с кнопкой истории между низом .stats и верхом кнопки не
     меньше 12px и кнопка не пересекается ни с одной плашкой;
  2. на всех страницах со статистикой ни у одной плашки .stat нет тени
     (в том числе у встроенных движков ОГЭ №9, которые появляются после
     выбора типа);
  3. всё это на ширине компьютера и телефона (390px).

Запуск: python3 test_prompt62_history_toggle_gap.py (сервер поднимается сам).
"""
import contextlib
import glob
import http.client
import os
import re
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8982
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
MIN_GAP = 12


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT)],
        cwd=HERE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
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


# черновики вида oge8-1.html не публикуются — их не проверяем.
# Возвращает страницы со статистикой и отдельно — те, где есть ещё и история
def pages():
    stats, hist = [], set()
    for p in sorted(glob.glob(os.path.join(HERE, "*.html"))):
        name = os.path.basename(p)
        if re.search(r"-\d+\.html$", name):
            continue
        src = open(p, encoding="utf-8").read()
        if 'class="stat"' not in src and 'class=\\"stat\\"' not in src:
            continue
        stats.append(name)
        if 'id="exampleHistoryToggle"' in src:
            hist.add(name)
    return stats, hist


# у страницы может быть несколько пар «статистика → история» (в ОГЭ №9 свои
# у встроенных движков линейных и квадратных уравнений), поэтому меряем все
# видимые .stats, за которыми следующей кнопкой идёт история
MEASURE_JS = """() => {
  const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const out = [];
  document.querySelectorAll('.stats').forEach(stats => {
    if (!vis(stats)) return;
    let t = stats.nextElementSibling;
    while (t && !vis(t)) t = t.nextElementSibling;
    if (!t || !t.classList.contains('example-history-toggle')) return;
    const s = stats.getBoundingClientRect();
    const r = t.getBoundingClientRect();
    const overlap = [...stats.querySelectorAll('.stat')].some(el => {
      const c = el.getBoundingClientRect();
      return c.bottom > r.top && c.top < r.bottom && c.right > r.left && c.left < r.right;
    });
    out.push({ id: t.id, gap: Math.round((r.top - s.bottom) * 10) / 10, overlap });
  });
  return out;
}"""

# карточки берём по порядковому номеру: в ЕГЭ-страницах у них нет data-id.
# «Случайный» тип пропускаем — он открывает один из тех же экранов
CARDS_JS = """() => [...document.querySelectorAll('.mode-card')]
  .map((c, i) => ({ i, ok: !c.classList.contains('soon') && c.dataset.id !== 'random' }))
  .filter(x => x.ok).map(x => x.i)"""

CLICK_JS = "i => document.querySelectorAll('.mode-card')[i].click()"

MAX_CARDS = 4

# computed-стиль есть и у скрытых элементов, поэтому проверяем все плашки в DOM
SHADOW_JS = """() => [...document.querySelectorAll('.stat')]
  .map(el => getComputedStyle(el).boxShadow).filter(v => v && v !== 'none')"""


def main():
    names, with_hist = pages()
    check("нашлись страницы со статистикой", len(names) >= 25, str(names))
    check("нашлись страницы с историей", len(with_hist) >= 15, str(sorted(with_hist)))
    for must in ("ege_prof.html", "ege_base.html", "oge_part2.html"):
        check(f"{must} в списке проверки", must in with_hist)

    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        for width, label in ((1280, "десктоп"), (390, "телефон")):
            for name in names:
                ctx = browser.new_context(viewport={"width": width, "height": 900})
                page = ctx.new_page()
                page.route("https://**/*", lambda route: route.abort())
                page.goto(f"{BASE}/{name}")
                page.wait_for_timeout(800)
                shadows = page.evaluate(SHADOW_JS)
                pairs = page.evaluate(MEASURE_JS)
                # в тренажёрах с выбором типа статистика живёт в экране
                # задания, он скрыт, пока не выбран тип, — открываем по
                # очереди несколько первых типов
                ids = page.evaluate(CARDS_JS)[:MAX_CARDS]
                for cid in ids:
                    page.goto(f"{BASE}/{name}")
                    page.wait_for_timeout(600)
                    page.evaluate(CLICK_JS, cid)
                    page.wait_for_timeout(400)
                    pairs += [dict(p, card=cid) for p in page.evaluate(MEASURE_JS)]
                    shadows += page.evaluate(SHADOW_JS)
                check(f"{label} {name}: у плашек статистики нет тени",
                      not shadows, str(shadows[:2]))
                if name in with_hist:
                    bad = [p for p in pairs if p["gap"] < MIN_GAP or p["overlap"]]
                    check(f"{label} {name}: история не липнет к статистике ({len(pairs)} шт.)",
                          bool(pairs) and not bad, str(bad))
                ctx.close()
        browser.close()

    failed = [n for n, ok in results if not ok]
    print(f"\nИтого: {len(results) - len(failed)}/{len(results)}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
