"""
Тёмная тема: уровни поверхностей, настройки контраста и фона, светлые слайды
(subject-palette.js, board-canvas.js, deck-core.js; макеты 22.11).

Зачем. В тёмной теме фон, панели, карточки и слайд лежали в узкой полосе
почти чёрного: контраст с фоном 1,1–1,2, слайд сливался с фоном. Теперь
ступени светлоты с заданным контрастом, настройки «Контраст» (мягкий /
обычный / высокий), «Фон» (в тоне цвета / графит / чёрный) и «Слайды
презентаций в тёмной теме» (светлые по умолчанию / тёмные).

  1. контраст поверхностей с фоном не ниже порогов — у каждого уровня,
     у математики и русского
  2. «Графит» и «Чёрный»: чёрный фон темнее, графит почти без оттенка
  3. шрифты при крайних настройках — весь видимый текст ≥ 4,5
  4. светлая тема не меняется; фон тёмной математики по умолчанию прежний
  5. полоса браузера — в цвет тёмного фона
  6. презентация в тёмной теме: слайд светлый, перо тёмное; «Тёмные» —
     как раньше
  7. кабинет: три переключателя, выбор сохраняется в настройки аккаунта
  8. ошибок нет

Запуск: python3 test_prompt_dark_surfaces.py
"""
import http.server
import json
import os
import sys
import threading

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 8997
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

    def handle(self):
        try:
            super().handle()
        except Exception:
            pass


srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Quiet)
threading.Thread(target=srv.serve_forever, daemon=True).start()

# контраст поверхностей с фоном по вычисленным переменным
LEVELS = r"""() => {
  const s = getComputedStyle(document.documentElement), g = v => s.getPropertyValue(v).trim();
  const rgb = c => { if (c[0] === '#') return [1,3,5].map(i => parseInt(c.slice(i, i + 2), 16)); return c.match(/[\d.]+/g).slice(0, 3).map(Number); };
  const lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
  const L = c => { c = rgb(c); return .2126 * lin(c[0]) + .7152 * lin(c[1]) + .0722 * lin(c[2]); };
  const cr = (a, b) => { const x = L(a), y = L(b); return Math.round((Math.max(x, y) + .05) / (Math.min(x, y) + .05) * 100) / 100; };
  const bg = g('--bg');
  return { bg, panel: cr(g('--glass-strong'), bg), paper: cr(g('--paper'), bg), card: cr(g('--card'), bg),
           grid: cr(g('--grid'), g('--paper')), bgL: L(bg) };
}"""
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
    const t = n.textContent.trim(); if (t.length < 2 || /[☀-⟿\ud83c-\ud83e]/.test(t)) continue;
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
BOOT = """() => { const g = document.getElementById('authGate'); if (g) g.style.display = 'none';
  window.boardsAppBoot(); document.getElementById('screenList').style.display = 'flex'; }"""
# порог чуть ниже целевого: шаг подбора светлоты 0,2 %
MIN = {"soft": (1.22, 1.26, 1.32), "normal": (1.34, 1.40, 1.50), "high": (1.50, 1.63, 1.83)}


def run():
    errors = []
    with sync_playwright() as p:
        br = p.chromium.launch()
        ctx = br.new_context(viewport={"width": 1280, "height": 860})
        pg = ctx.new_page()
        pg.on("pageerror", lambda e: errors.append(f"{pg.url}: {e}"))
        pg.route("**/*", lambda r: r.continue_() if r.request.url.startswith(BASE) else r.abort())

        def open_(page, dark=None, palette=None, theme="dark"):
            pg.goto(BASE + "font-check.html")
            pg.evaluate("""([d, p, t]) => { localStorage.clear(); localStorage.setItem('theme', t);
                if (d) localStorage.setItem('mathh:dark', JSON.stringify(d));
                if (p) localStorage.setItem('mathh:palette', p); }""", [dark, palette, theme])
            pg.goto(BASE + page)
            pg.wait_for_function("window.MathhPalette")
            pg.wait_for_timeout(300)

        # 1
        for contrast in ("soft", "normal", "high"):
            for pal in (None, "rus"):
                open_("lcm.html", {"contrast": contrast}, pal)
                lv = pg.evaluate(LEVELS)
                mp, mpa, mc = MIN[contrast]
                ok = lv["panel"] >= mp and lv["paper"] >= mpa and lv["card"] >= mc
                check(f"1 {contrast} {pal or 'math'}: панель ≥ {mp}, бумага ≥ {mpa}, карточка ≥ {mc}", ok, lv)
        open_("lcm.html")
        lv = pg.evaluate(LEVELS)
        check("1 по умолчанию — «Обычный»", lv["paper"] >= 1.40 and lv["card"] >= 1.50, lv)
        check("1 клетка видна на бумаге (≥ 1,28)", lv["grid"] >= 1.28, lv)

        # 2
        open_("lcm.html", {"base": "tone"}, "rus"); tone = pg.evaluate(LEVELS)
        open_("lcm.html", {"base": "black"}, "rus"); black = pg.evaluate(LEVELS)
        open_("lcm.html", {"base": "graphite"}, "rus"); graph = pg.evaluate(LEVELS)
        check("2a «Чёрный» темнее фона в тоне цвета", black["bgL"] < tone["bgL"], f"{black['bg']} / {tone['bg']}")
        r, g, b = [int(graph["bg"][i:i + 2], 16) for i in (1, 3, 5)]
        check("2b «Графит» почти без оттенка", max(r, g, b) - min(r, g, b) <= 6, graph["bg"])
        check("2c уровни держатся и на графите", graph["card"] >= 1.50, graph)

        # 3
        for dark, pal in (({"contrast": "high", "base": "black"}, "rus"), ({"contrast": "soft", "base": "graphite"}, "phys"),
                          ({"contrast": "high"}, None)):
            open_("lcm.html", dark, pal)
            worst, what = pg.evaluate(MIN_CR)
            check(f"3 шрифты ≥ 4,5 при {dark} {pal or 'math'}", worst >= 4.5, f"{worst} «{what}»")

        # 4
        open_("lcm.html", {"contrast": "high", "base": "black"}, theme="light")
        bg = pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--bg').trim().toUpperCase()")
        check("4a светлая тема не меняется", bg == "#EEF1F7", bg)
        open_("lcm.html")
        bg = pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--bg').trim().toUpperCase()")
        check("4b фон тёмной математики по умолчанию прежний", bg == "#0B0E1A", bg)

        # 5
        open_("soc_oge.html", {"base": "black"})
        meta = pg.evaluate("document.querySelector('meta[name=theme-color]').content.toUpperCase()")
        bg = pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--bg').trim().toUpperCase()")
        check("5 полоса браузера в цвет фона", meta == bg, f"{meta} {bg}")

        # 6
        def deck(dark):
            open_("boards.html", dark)
            pg.evaluate(BOOT); pg.wait_for_timeout(300)
            pg.click("#blCreateDeck")
            pg.wait_for_function("() => typeof B !== 'undefined' && B && B.kind === 'deck' && boardActive")
            pg.wait_for_timeout(400)
            return (pg.evaluate("deckPaperColor(deckCur())").upper(), pg.evaluate("resolveColor('--pencil')").upper())
        paper, ink = deck(None)
        check("6a тёмная тема: слайд светлый", paper == "#FDFCF7", paper)
        check("6b перо на светлом слайде тёмное", ink == "#1D1D1F", ink)
        px = pg.evaluate("""() => { const r = deckSlideRect(deckCur()); const cv = document.getElementById('boardCv');
          const p = worldToScreen({ x: r.x + r.w * .37, y: r.y + r.h * .43 }); const k = cv.width / cv.getBoundingClientRect().width;
          return Array.from(cv.getContext('2d').getImageData(Math.round(p.x * k), Math.round(p.y * k), 1, 1).data).slice(0, 3); }""")
        check("6c на холсте слайд светлый", min(px) > 225, px)
        paper, ink = deck({"slides": "dark"})
        check("6d «Тёмные» — слайд цвета тёмной бумаги", paper == pg.evaluate("themeVar('--paper')").upper(), paper)
        check("6e перо на тёмном слайде светлое", ink == "#F2F3F5", ink)

        # 7 — вход подставлен: в CabinetCloud текущий пользователь и чтение настроек
        pg.goto(BASE + "font-check.html")
        pg.evaluate("""() => { localStorage.clear(); localStorage.setItem('theme', 'dark');
          localStorage.setItem('sb-x-auth-token', JSON.stringify({ user: { id: 'u1' } })); }""")
        pg.add_init_script("""(() => { let v; Object.defineProperty(window, 'CabinetCloud', { configurable: true,
          get() { return v; }, set(x) { v = x;
            x.currentUser = async () => ({ id: 'u1', email: 't@example.com', user_metadata: { has_password: true } });
            x.getSettings = async () => JSON.parse(localStorage.getItem('teacher:settings:v1') || 'null');
            x.saveSettings = async () => null;
            const orig = x.client; x.client = () => { const c = orig(); if (c && !c.__p) { c.__p = 1;
              c.auth.onAuthStateChange = () => ({ data: { subscription: { unsubscribe() {} } } }); } return c; };
          } }); })()""")
        pg.goto(BASE + "cabinet.html#/settings")
        pg.wait_for_selector("#cabDark .seg[data-dark=contrast] button", state="visible", timeout=10000)
        n = pg.evaluate("document.querySelectorAll('#cabDark .seg[data-dark] button').length")
        check("7a три переключателя (3 + 3 + 2 варианта)", n == 8, n)
        on = pg.evaluate("[...document.querySelectorAll('#cabDark .seg[data-dark] button.on')].map(b => b.dataset.v)")
        check("7b по умолчанию: обычный, в тоне цвета, светлые", on == ["normal", "tone", "light"], on)
        pg.click("#cabDark .seg[data-dark=contrast] [data-v=high]")
        pg.click("#cabDark .seg[data-dark=base] [data-v=black]")
        pg.wait_for_timeout(600)
        saved = pg.evaluate("(JSON.parse(localStorage.getItem('teacher:settings:v1') || '{}').darkTheme) || null")
        check("7c выбор сохранён в настройки аккаунта", saved and saved.get("owner") == "u1" and saved.get("contrast") == "high"
              and saved.get("base") == "black", saved)
        lv = pg.evaluate(LEVELS)
        check("7d и сразу применён на странице", lv["card"] >= 1.83, lv)

        br.close()
    check("8 ошибок нет", not errors, "; ".join(errors[:3]))


run()
srv.shutdown()
if failures:
    print(f"\nПРОВАЛЕНО: {len(failures)}")
    sys.exit(1)
print("\nготово")
