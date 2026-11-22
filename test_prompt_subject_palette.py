"""
Цвет всего интерфейса по предмету (subject-palette.js).

Зачем. Синий был прописан в :root каждой страницы, и обществознание,
английский, доски, кабинет, «Работы» оставались синими. Теперь общий
скрипт ставит html[data-palette] и перекрывает --ink и его производные.
Решение Даниила 18.11: педагог может выбрать предмет палитры сам, выбор
хранится в teacher_settings.cabinetPalette (копия в localStorage),
ученик в сессии видит цвет педагога.

  A. «По предмету»: обществознание зелёное (светлая и тёмная тема),
     математика и русский — свои цвета без перекрытия
  B. выбор без входа (mathh:palette): математика красная, русский синий
  C. выбор аккаунта (cabinetPalette с owner = вошедший) — берётся;
     чужого аккаунта — нет
  D. доски/кабинет/«Работы» в режиме «по предмету» — цвет последнего
     открытого предмета
  E. палитра педагога в сессии (setRemote) перекрывает выбор
  F. фон «по предмету» (bg-style.js) идёт от палитры: клетка у математики
  G. пункт «Цвет» в меню «⋯» главной переключает палитру по кругу
  H. кабинет: «Цвет интерфейса», первый вариант «По предмету»
  J. тёмная тема в тоне предмета: фон и карточки не тёмно-синие (кроме
     математики), полоса браузера (theme-color) — в тон фона
  K. основной предмет (teacher_settings.mainSubject): доски/«Работы» берут
     его, главная на новом устройстве открывается им; блок в кабинете
  L. презентации: новая фигура и шапка таблицы — цветом предмета, первый
     быстрый стиль — предмет; у математики — прежний синий Office
  M. шрифты на цветных тёмных темах: цветной текст, белый на цветных
     кнопках и серый — не ниже 4,5 (до правки 3,2–4,3); светлая тема и
     тёмная математика — без изменений
  I. без ошибок в консоли

Запуск: python3 test_prompt_subject_palette.py
"""
import http.server
import json
import os
import sys
import threading

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 8993
BASE = f"http://127.0.0.1:{PORT}/"
failures = []


def check(name, ok, info=""):
    print(("OK   " if ok else "FAIL ") + name + ("" if ok else f"  [{info}]"))
    if not ok:
        failures.append(name)


class Quiet(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, *a):
        pass


srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Quiet)
threading.Thread(target=srv.serve_forever, daemon=True).start()

BOOT_JS = """() => { const g = document.getElementById('authGate'); if (g) g.style.display = 'none';
  window.boardsAppBoot(); document.getElementById('screenList').style.display = 'flex'; }"""
INK = "getComputedStyle(document.documentElement).getPropertyValue('--ink').trim().toUpperCase()"


def run():
    errors = []
    with sync_playwright() as p:
        br = p.chromium.launch()
        ctx = br.new_context()
        # сеть наружу не нужна: Supabase и шрифты — мимо
        ctx.route("**/*", lambda r: r.continue_() if r.request.url.startswith(BASE) else r.abort())
        pg = ctx.new_page()
        pg.on("pageerror", lambda e: errors.append(f"{pg.url}: {e}"))

        def open_(page, store=None, session=None, theme="light"):
            pg.goto(BASE + "index.html?subject=math")
            pg.evaluate("""([s, t]) => { localStorage.clear(); sessionStorage.clear();
                localStorage.setItem('theme', t);
                for (const k in s) localStorage.setItem(k, s[k]); }""", [store or {}, theme])
            if session:
                pg.evaluate("s => { for (const k in s) sessionStorage.setItem(k, s[k]); }", session)
            pg.goto(BASE + page)
            pg.wait_for_function("window.MathhPalette")
            return pg.evaluate(INK), pg.evaluate("document.documentElement.getAttribute('data-palette')")

        # A
        ink, attr = open_("soc_oge.html")
        check("A1 обществознание зелёное (своя палитра страницы)", ink == "#17694F" and attr is None, f"{ink} {attr}")
        ink, attr = open_("soc_oge.html", theme="dark")
        # заливка в тёмной теме затемнена до белого текста ≥ 4,6 (пункт M)
        check("A2 обществознание в тёмной теме", ink == "#2B8367", ink)
        ink, attr = open_("lcm.html")
        check("A3 математика без перекрытия", ink == "#004C99" and attr is None, f"{ink} {attr}")
        ink, attr = open_("rus_oge.html")
        check("A4 русский свой красный", ink == "#9E2A47" and attr is None, f"{ink} {attr}")
        ink, attr = open_("eng_oge.html")
        check("A5 английский фиолетовый", ink == "#5B3596", ink)

        # B
        ink, attr = open_("lcm.html", {"mathh:palette": "rus"})
        check("B1 математика в палитре русского", ink == "#9E2A47" and attr == "rus", f"{ink} {attr}")
        ink, attr = open_("rus_oge.html", {"mathh:palette": "math"})
        check("B2 русский в палитре математики", ink == "#004C99" and attr == "math", f"{ink} {attr}")
        ink, _ = open_("lcm.html", {"mathh:palette": "rus"}, theme="dark")
        check("B3 тёмная тема палитры русского", ink == "#C74868", ink)

        # C
        auth = json.dumps({"user": {"id": "u1"}})
        ts = lambda owner, subj: json.dumps({"cabinetPalette": {"owner": owner, "subject": subj}})
        ink, _ = open_("lcm.html", {"sb-x-auth-token": auth, "teacher:settings:v1": ts("u1", "eng")})
        check("C1 выбор своего аккаунта", ink == "#5B3596", ink)
        ink, _ = open_("lcm.html", {"sb-x-auth-token": auth, "teacher:settings:v1": ts("u2", "eng")})
        check("C2 выбор чужого аккаунта не берётся", ink == "#004C99", ink)
        ink, _ = open_("soc_oge.html", {"sb-x-auth-token": auth, "teacher:settings:v1": ts("u1", "neutral"),
                                        "mathh:palette": "rus"})
        check("C3 «по предмету» аккаунта сильнее выбора устройства", ink == "#17694F", ink)

        # D
        for page in ("works.html", "cabinet.html", "boards.html", "notes.html"):
            open_("soc_oge.html")
            pg.goto(BASE + page)
            pg.wait_for_function("window.MathhPalette")
            ink = pg.evaluate(INK)
            check(f"D {page} — цвет последнего предмета (общество)", ink == "#17694F", ink)
        ink, attr = open_("works.html")
        check("D works.html без предмета — синий", ink == "#004C99" and attr is None, f"{ink} {attr}")

        # E
        ink, _ = open_("lcm.html", {"mathh:palette": "rus"}, {"mathh:palette:remote": "phys"})
        check("E1 палитра педагога в сессии", ink == "#A3480F", ink)
        pg.evaluate("MathhPalette.setRemote(null)")
        check("E2 без сессии — свой выбор", pg.evaluate(INK) == "#9E2A47", pg.evaluate(INK))

        # F
        open_("rus_oge.html", {"mathh:palette": "math"})
        check("F1 русский в палитре математики — клетка", pg.evaluate("document.documentElement.dataset.bg") == "grid",
              pg.evaluate("document.documentElement.dataset.bg"))
        open_("lcm.html", {"mathh:palette": "rus"})
        check("F2 математика в палитре русского — чистый фон", pg.evaluate("document.documentElement.dataset.bg") == "none",
              pg.evaluate("document.documentElement.dataset.bg"))

        # G
        open_("index.html?subject=math")
        pg.wait_for_selector("#paletteToggle", state="attached")
        label = lambda: pg.evaluate("document.getElementById('paletteToggle').getAttribute('aria-label')")
        check("G1 пункт «Цвет: по предмету»", label() == "Цвет: по предмету", label())
        pg.click("#lgMenuToggle")
        pg.click("#paletteToggle")
        check("G2 первый щелчок — математика", label() == "Цвет: математика" and pg.evaluate("localStorage.getItem('mathh:palette')") == "math", label())
        pg.click("#paletteToggle")
        check("G3 второй — информатика, интерфейс перекрашен",
              label() == "Цвет: информатика" and pg.evaluate(INK) == "#0B6577", f"{label()} {pg.evaluate(INK)}")
        pg.goto(BASE + "lcm.html")
        pg.wait_for_function("window.MathhPalette")
        check("G4 выбор действует на тренажёре", pg.evaluate(INK) == "#0B6577", pg.evaluate(INK))

        # H
        open_("cabinet.html")
        txt = pg.evaluate("document.getElementById('cabPaletteLabel').textContent")
        first = pg.evaluate("document.querySelector('#cabPalettes button').textContent")
        check("H кабинет: «Цвет интерфейса» / «По предмету»", txt == "Цвет интерфейса" and first == "По предмету", f"{txt} {first}")

        # J
        open_("soc_oge.html", theme="dark")
        bg = pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--bg').trim().toUpperCase()")
        card = pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--card').trim()")
        def rgb(h): h = h.lstrip('#'); return [int(h[i:i+2], 16) for i in (0, 2, 4)]
        r, g, b = rgb(bg)
        check("J1 тёмный фон обществознания зеленоватый, не синий", bg != "#0B0E1A" and g > r and g >= b, bg)
        check("J2 карточки обществознания не тёмно-синие", "30,37,64" not in card.replace(" ", ""), card)
        meta = pg.evaluate("document.querySelector('meta[name=theme-color]').content.toUpperCase()")
        check("J3 полоса браузера в тон фона", meta == bg, f"{meta} {bg}")
        open_("lcm.html", theme="dark")
        bg = pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--bg').trim().toUpperCase()")
        check("J4 у математики тёмная тема прежняя", bg == "#0B0E1A", bg)
        open_("lcm.html", {"mathh:palette": "rus"}, theme="dark")
        bg = pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--bg').trim().toUpperCase()")
        r, g, b = rgb(bg)
        check("J5 математика в палитре русского — бордовая ночь", r > b and r > g, bg)
        pg.evaluate("document.documentElement.setAttribute('data-theme','light')")
        meta = pg.evaluate("document.querySelector('meta[name=theme-color]').content.toUpperCase()")
        check("J6 светлая тема — полоса как в странице", meta == "#0B0E1A", meta)

        # K
        main = lambda subj: json.dumps({"mainSubject": {"owner": "u1", "subject": subj}})
        open_("soc_oge.html", {"sb-x-auth-token": auth, "teacher:settings:v1": main("eng")})
        pg.goto(BASE + "works.html")
        pg.wait_for_function("window.MathhPalette")
        check("K1 «Работы» — основной предмет, а не последний", pg.evaluate(INK) == "#5B3596", pg.evaluate(INK))
        open_("works.html", {"sb-x-auth-token": auth, "teacher:settings:v1": json.dumps({"mainSubject": {"owner": "u2", "subject": "eng"}})})
        check("K2 основной предмет чужого аккаунта не берётся", pg.evaluate(INK) == "#004C99", pg.evaluate(INK))
        open_("index.html", {"sb-x-auth-token": auth, "teacher:settings:v1": main("rus")})
        check("K3 главная на новом устройстве — основной предмет",
              pg.evaluate("document.documentElement.dataset.subject") == "rus", pg.evaluate("document.documentElement.dataset.subject"))
        open_("cabinet.html")
        n = pg.evaluate("document.querySelectorAll('#cabMainSubjects button').length")
        first = pg.evaluate("document.querySelector('#cabMainSubjects button').textContent")
        check("K4 кабинет: «Основной предмет» — «Не задан» и 6 предметов", n == 7 and first == "Не задан", f"{n} {first}")

        # L
        def deck_shape(store):
            open_("boards.html", store)
            pg.evaluate(BOOT_JS)
            pg.click("#blCreateDeck")
            pg.wait_for_function("() => typeof B !== 'undefined' && B && B.kind === 'deck' && boardActive && typeof DTB_QUICK_STYLES !== 'undefined'")
            return pg.evaluate("""() => { const r = deckSlideRect(deckCur());
              const o = bxInsert('rect', { x: r.x + r.w / 2, y: r.y + r.h / 2 }); bxCloseEditor && bxCloseEditor(false);
              const t = bxInsert('table', { x: r.x + 100, y: r.y + 100 }); bxCloseEditor && bxCloseEditor(false);
              return [o.fill.c, t.cells[0][0].fill.c, DTB_QUICK_STYLES[0].f]; }""")
        fill, hdr, q0 = deck_shape({"mathh:palette": "rus"})
        check("L1 фигура в палитре русского — бордовая", fill == "#9E2A47", fill)
        check("L2 шапка таблицы — бордовая", hdr == "#9E2A47", hdr)
        check("L3 первый быстрый стиль — русский", q0 == "#9E2A47", q0)
        fill, hdr, q0 = deck_shape({})
        check("L4 у математики — синий Office", fill == "#4472C4" and hdr == "#4472C4" and q0 == "#4472C4", f"{fill} {hdr} {q0}")

        # M
        MIN_CR = r"""() => {
          const parse = c => { const m = c.match(/[\d.]+/g); return m ? m.map(Number).concat(m.length === 3 ? [1] : []) : null; };
          const lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
          const L = c => .2126 * lin(c[0]) + .7152 * lin(c[1]) + .0722 * lin(c[2]);
          const over = (t, b) => [0,1,2].map(i => t[i] * t[3] + b[i] * (1 - t[3])).concat([1]);
          const hx = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
          const root = [1,3,5].map(i => parseInt(hx.slice(i, i + 2), 16)).concat([1]);
          let worst = 99, what = '';
          const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
          while ((n = w.nextNode())) {
            const t = n.textContent.trim(); if (t.length < 2 || /[\u2600-\u27ff\ud83c-\ud83e]/.test(t)) continue;
            const el = n.parentElement, r = el.getBoundingClientRect();
            if (!r.width || r.bottom < 0 || r.top > innerHeight) continue;
            const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
            const chain = []; for (let e = el; e && e.nodeType === 1; e = e.parentElement) chain.push(e);
            let bg = root.slice();
            for (let i = chain.length - 1; i >= 0; i--) { const b = parse(getComputedStyle(chain[i]).backgroundColor); if (b && b[3] > 0) bg = over(b, bg); }
            const fg = over(parse(cs.color), bg);
            const c = (Math.max(L(fg), L(bg)) + .05) / (Math.min(L(fg), L(bg)) + .05);
            if (c < worst) { worst = c; what = t.slice(0, 20); }
          }
          return [Math.round(worst * 100) / 100, what];
        }"""
        for page, pal in (("lcm.html", "rus"), ("lcm.html", "soc"), ("lcm.html", "eng"), ("lcm.html", "phys"),
                          ("soc_oge.html", None), ("index.html?subject=rus", None)):
            open_(page, {"mathh:palette": pal} if pal else {}, theme="dark")
            pg.wait_for_timeout(500)
            worst, what = pg.evaluate(MIN_CR)
            check(f"M1 {page} {pal or ''} тёмная: весь текст ≥ 4,5", worst >= 4.5, f"{worst} «{what}»")
        open_("lcm.html", {"mathh:palette": "rus"})
        lab = pg.evaluate("getComputedStyle(document.querySelector('.calc-tool-btn, .ans-label, label') || document.body).color")
        check("M2 светлая тема: --ink-text не задан, цвет как был", pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--ink-text').trim()") == "", lab)
        open_("lcm.html", theme="dark")
        check("M3 тёмная математика без изменений", pg.evaluate(INK) == "#2E7DE0" and
              pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--ink-text').trim()") == "", pg.evaluate(INK))

        br.close()
    check("I без ошибок на страницах", not errors, "; ".join(errors[:3]))


run()
srv.shutdown()
if failures:
    print(f"\nПРОВАЛЕНО: {len(failures)}")
    sys.exit(1)
print("\nготово")
