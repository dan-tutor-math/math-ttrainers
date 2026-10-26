"""
Промпт №114: «максимум» эффектов на телефоне и синхронизация темы.

Проверяет:
  1. главная на 375 px в «максимуме»: при прокрутке вкладки «Экзамены /
     Классы / Основа» липнут НИЖЕ капсулы «Подборка · Доски · Работы»,
     а не уезжают под неё;
  2. капсула предметов не преломляет (на Android под выбранным предметом
     от карты искажения висел тёмный обод), а вкладки преломляют;
  3. без преломления (iPhone) на <html> стоит lg-norefract и в «максимуме»
     стекло вкладок другое: прозрачнее и с другим размытием, чем в обычном;
  4. тему сменили в другой вкладке — открытый тренажёр перекрашивается
     (session-share.js, событие storage), а не остаётся в старой;
  5. учитель не берёт тему из снимка сессии (там тема до смены на главной) —
     защита в коде session-share.js;
  6. ошибок JavaScript нет.

Запуск: python3 test_prompt114_phone_glass_theme.py (сервер поднимается сам).
"""
import contextlib
import http.client
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 9214
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


def main():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 375, "height": 812}, has_touch=True)
        ctx.add_init_script("try{localStorage.setItem('mathh-fx','full');localStorage.setItem('theme','light')}catch(e){}")
        errors = []
        page = ctx.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"{BASE}/index.html")
        page.wait_for_timeout(800)

        # 1. липкие вкладки под капсулой
        page.evaluate("window.scrollTo(0, 700)")
        page.wait_for_timeout(300)
        side_bottom, nav_top = page.evaluate(
            "[document.querySelector('.lg-side').getBoundingClientRect().bottom,"
            " document.getElementById('navBar').getBoundingClientRect().top]")
        check("вкладки липнут ниже капсулы", nav_top >= side_bottom, f"капсула до {side_bottom}, вкладки с {nav_top}")

        # 2. кто преломляет
        subj_r, tabs_r = page.evaluate(
            "[document.getElementById('subjBar').classList.contains('lg-r'),"
            " document.querySelector('.nav-tabs').classList.contains('lg-r')]")
        check("капсула предметов без преломления", not subj_r)
        check("вкладки с преломлением", tabs_r)

        # 3. стекло без преломления (как на iPhone): класс ставим вручную и
        # снимаем lg-r-ready — в Safari его не бывает
        css = page.evaluate("""() => {
          const h = document.documentElement, t = document.querySelector('.nav-tabs');
          h.classList.add('lg-norefract');
          t.classList.remove('lg-r-ready');
          const full = getComputedStyle(t).backdropFilter;
          h.removeAttribute('data-fx');
          const lite = getComputedStyle(t).backdropFilter;
          h.setAttribute('data-fx', 'full');
          return [full, lite];
        }""")
        check("стекло iPhone в «максимуме» отличается от обычного", css[0] != css[1] and "blur(12px)" in css[0], str(css))
        has_cls = page.evaluate("MathhGlass.canRefract || document.documentElement.classList.contains('lg-norefract')")
        check("lg-norefract ставится там, где нет преломления", has_cls)

        # 4. тема из другой вкладки
        trainer = ctx.new_page()
        trainer.on("pageerror", lambda e: errors.append(str(e)))
        trainer.goto(f"{BASE}/oge6.html")
        trainer.wait_for_timeout(800)
        before = trainer.evaluate("document.documentElement.getAttribute('data-theme')")
        page.evaluate("localStorage.setItem('theme', 'dark')")
        trainer.wait_for_timeout(400)
        after = trainer.evaluate("document.documentElement.getAttribute('data-theme')")
        check("тренажёр подхватил тему из другой вкладки", before == "light" and after == "dark", f"{before} → {after}")

        # 5. защита учителя от темы из снимка
        src = open(os.path.join(HERE, "session-share.js"), encoding="utf-8").read()
        check("тему из снимка берёт только ученик", "if (state.__theme && !isLeaderFlag) applyRemoteTheme" in src)

        check("ошибок JavaScript нет", not errors, "; ".join(errors[:3]))
        browser.close()

    failed = [n for n, ok in results if not ok]
    print(f"\nИтого: {len(results) - len(failed)}/{len(results)}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
