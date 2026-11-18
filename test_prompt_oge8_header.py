"""
Шапка задания ОГЭ №8 (18.11.2026, правки Даниила по скриншоту):
  1. шапка задания не уезжает влево: левый край — как у условия;
  2. «◀ Тип / Тип ▶» — коротко; стрелки заданий по бокам темы
     («◀ тема · задание N ▶»), тема без переноса, счётчик растёт и падает;
  3. условие не уже ряда «Обучение … Нулевые и отрицательные степени»,
     даже если в памяти сохранена узкая ширина рабочей зоны;
  4. справочные материалы выше клавиатуры и в открытом, и в свёрнутом
     виде, ничем не перекрыты; на узком экране клавиатура уходит вниз.

Запуск: ~/.venvs/trainers/bin/python test_prompt_oge8_header.py
"""
import contextlib
import http.client
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 9461
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
        yield
    finally:
        proc.terminate()
        proc.wait(timeout=5)


results = []


def check(name, ok, info=""):
    results.append(ok)
    print(("[OK] " if ok else "[FAIL] ") + name + ("" if ok else f": {info}"))


RECT = """s => { const e = document.querySelector(s); if (!e) return null;
  const r = e.getBoundingClientRect(); return {l: r.left, r: r.right, t: r.top, b: r.bottom, h: r.height}; }"""


def open_exam(page):
    page.goto(f"{BASE}/oge8.html", wait_until="load")
    page.wait_for_timeout(500)
    page.locator(".mode-card[data-id]:not(.random)").first.click()
    page.wait_for_timeout(500)
    page.click("#tabExam")
    page.wait_for_timeout(400)


def main():
    errors = []
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1600, "height": 900})
        # узкая ширина зоны в памяти — как на скриншоте Даниила
        ctx.add_init_script("try{localStorage.setItem('oge8:workZoneW','560')}catch(e){}")
        page = ctx.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)))
        open_exam(page)
        r = lambda s: page.evaluate(RECT, s)

        head, card, row = r("#taskArea .task-head"), r("#questionPanel"), r("#submodeRow")
        check("шапка не уезжает влево", abs(head["l"] - card["l"]) < 1.5, f"{head} / {card}")
        check("условие не уже ряда режимов", card["l"] <= row["l"] + 1 and card["r"] >= row["r"] - 1, f"{card} / {row}")

        check("кнопки типов короткие",
              page.inner_text("#prevTypeBtn").strip() == "◀ Тип" and page.inner_text("#nextTypeBtn").strip() == "Тип ▶")
        prev, title, nxt = r("#tnPrevTask"), r("#taskTitle"), r("#tnNextTask")
        check("стрелки по бокам темы", prev["r"] <= title["l"] and title["r"] <= nxt["l"]
              and abs(prev["t"] - nxt["t"]) < 1, f"{prev} {title} {nxt}")
        check("тема в одну строку", title["h"] < 26, str(title))
        check("счётчик «задание 1»", page.inner_text("#tnCount") == "задание 1", page.inner_text("#tnCount"))
        page.click("#tnNextTask"); page.wait_for_timeout(300)
        page.click("#tnNextTask"); page.wait_for_timeout(300)
        check("после двух «▶» — «задание 3»", page.inner_text("#tnCount") == "задание 3", page.inner_text("#tnCount"))
        page.click("#tnPrevTask"); page.wait_for_timeout(300)
        check("«◀» — «задание 2»", page.inner_text("#tnCount") == "задание 2", page.inner_text("#tnCount"))

        book, kp = r("#ogeReferenceToggle"), r("#keypadFloat")
        check("клавиатура открыта — справочник выше неё", book["b"] <= kp["t"], f"{book} / {kp}")
        hit = page.evaluate("""() => { const b = document.getElementById('ogeReferenceToggle').getBoundingClientRect();
          const e = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
          return !!e && !!e.closest('#ogeReferenceToggle'); }""")
        check("справочник ничем не накрыт", hit)
        page.click("#kpClose"); page.wait_for_timeout(200)
        book, tg = r("#ogeReferenceToggle"), r("#kpToggle")
        check("клавиатура свёрнута — кнопка ⌨ ниже справочника", book["b"] <= tg["t"], f"{book} / {tg}")

        page.set_viewport_size({"width": 1000, "height": 800})
        page.wait_for_timeout(300)
        tg = r("#kpToggle")
        check("узкий экран: ⌨ у нижнего края", tg["b"] > 700, str(tg))
        check("без ошибок JS", not errors, "; ".join(errors))
        browser.close()

    failed = results.count(False)
    print(f"{len(results) - failed} из {len(results)} проверок прошли")
    if failed:
        sys.exit(1)
    print("готово")


if __name__ == "__main__":
    main()
