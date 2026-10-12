"""
ОГЭ №12: галочка «Дробные числа и большие ответы» — как «Нулевые и
отрицательные степени» в №8 (общий компонент hard-toggle.js).

Проверяет:
  A. галочка в строке режимов, по умолчанию выключена; нажатие ставит её
     и сразу даёт новое задание; выбор помнится при ◀ ▶, «все типы» и после
     перезагрузки (свой ключ hardToggle:oge12, №8 не трогает); в демоверсии
     неактивна, в «Случайно» активна;
  B. генераторы №1–10 без галочки: все данные и ответ целые, не больше 999
     (в №8–10 — не больше 99 999: формула сама меньше не даёт); ответ,
     пересчитанный здесь по ПОКАЗАННЫМ в условии числам, совпадает с
     правильным;
  C. с галочкой: в трудных заданиях есть десятичная дробь или число больше
     999, все числа не больше 999 999 и не больше двух знаков после запятой
     (раньше S = 9,375 показывалась как 9,38 — ответ не сходился), ответ
     по показанным числам верный; доля трудных в «Случайно» ≈ 50 %;
  D. сессия и доска: галочка в tsGetState, чужой снимок ставит её без
     записи в localStorage, снимок без поля — выключена; «ещё такое же» на
     доске — с галочкой из рецепта;
  E. задание, сохранённое до галочки (версия 2), придумывается заново;
  F. телефон 375 px: галочка под вкладками, видна целиком, без прокрутки
     вбок.

Живой realtime из песочницы не проверить — совместный режим перепроверяется
на сайте руками.

Запуск: python3 test_prompt_oge12_fraction_toggle.py (сервер поднимается сам).
"""
import contextlib
import http.client
import os
import re
import subprocess
import sys
import time
from fractions import Fraction

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = 9112
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


def open_page(browser, width=1300, height=1000, ctx=None):
    if ctx is None:
        ctx = browser.new_context(viewport={"width": width, "height": height})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    page.goto(f"{BASE}/oge12.html")
    page.wait_for_function("() => typeof tsGetState === 'function' && window.HardToggle && window.NoRepeat")
    page.wait_for_timeout(300)
    return ctx, page, errors


def open_type(page, mid):
    page.evaluate(f"() => {{ curMode = '{mid}'; openTask(); }}")
    page.wait_for_timeout(150)


# ─── числа, ПОКАЗАННЫЕ в условии: KaTeX кладёт TeX в annotation ───
def shown(prompt):
    out = {}
    for t in re.findall(r'<annotation encoding="application/x-tex">([\s\S]*?)</annotation>', prompt):
        m = re.fullmatch(r"\s*([A-Za-z_\\{}0-9]+?)\s*=\s*\(?(-?[\d{},]+)\)?\s*", t.replace("&amp;", "&"))
        if m:
            name = m.group(1).replace("\\", "").replace("{", "").replace("}", "")
            out[name] = Fraction(m.group(2).replace("{,}", "."))
    sm = re.search(r"\\sin\\alpha = \\dfrac\{(\d+)\}\{(\d+)\}", prompt)
    if sm:
        out["sin"] = Fraction(int(sm.group(1)), int(sm.group(2)))
    return out


def answer_from_shown(mid, v):
    """ответ, посчитанный по показанным числам — так, как его посчитает ученик"""
    if mid == "f1":
        return Fraction(5, 9) * (v["t_F"] - 32)
    if mid == "f2":
        return Fraction(9, 5) * v["t_C"] + 32
    if mid == "f3":
        return v["P"] / v["I"] ** 2
    if mid == "f4":
        return v["a"] / v["omega"] ** 2
    if mid == "f5":
        return 2 * v["S"] / (v["d_2"] * v["sin"])
    if mid == "f6":
        return v["P"] / (Fraction(98, 10) * v["h"])
    if mid == "f7":
        sq = 2 * v["E"] / v["m"]
        r = Fraction(round(float(sq) ** 0.5 * 100), 100)
        return r if r * r == sq else None
    if mid == "f8":
        return 1000 * Fraction(98, 10) * v["V"]
    if mid == "f9":
        return 6500 + 4000 * v["n"]
    if mid == "f10":
        return 6000 + 4100 * v["n"]


MODES = [f"f{i}" for i in range(1, 11)]
BIG = {"f8", "f9", "f10"}


def test_toggle_ui(browser):
    ctx, page, errors = open_page(browser)
    page.click('.mode-card[data-id="f5"]')
    page.wait_for_timeout(300)
    r = page.evaluate("""() => {
      const el = document.getElementById('hardToggle');
      const row = document.getElementById('submodeRow');
      const r = el.getBoundingClientRect();
      return { inRow: el.parentElement === row, checked: el.getAttribute('aria-checked'), text: el.textContent.trim(),
               visible: r.width > 100 && r.height > 15, off: el.classList.contains('ht-off'), ls: localStorage.getItem('hardToggle:oge12') };
    }""")
    check("A: галочка в строке режимов, видна, по умолчанию выключена",
          r["inRow"] and r["visible"] and r["checked"] == "false" and not r["off"] and r["ls"] is None, str(r))
    check("A: подпись про дробные числа", "Дробные числа" in r["text"], r["text"])
    p0 = page.evaluate("() => curTask.prompt")
    page.click("#hardToggle")
    page.wait_for_timeout(300)
    st = page.evaluate("() => ({ c: document.getElementById('hardToggle').getAttribute('aria-checked'), ls: localStorage.getItem('hardToggle:oge12'), o8: localStorage.getItem('hardToggle:oge8'), p: curTask.prompt })")
    check("A: нажатие ставит галочку и даёт новое задание",
          st["c"] == "true" and st["ls"] == "1" and st["p"] != p0, str(st)[:200])
    check("A: ключ свой — галочку №8 не трогает", st["o8"] is None)
    page.click("#nextTypeBtn")
    page.wait_for_timeout(200)
    check("A: ◀ ▶ — галочка остаётся", page.evaluate("() => hardCtl.get() && curMode === 'f6'"))
    page.reload()
    page.wait_for_function("() => typeof tsGetState === 'function' && window.HardToggle")
    page.wait_for_timeout(300)
    page.click('.mode-card[data-id="f1"]')
    page.wait_for_timeout(200)
    check("A: после перезагрузки — галочка стоит",
          page.evaluate("() => hardCtl.get() && document.getElementById('hardToggle').getAttribute('aria-checked') === 'true'"))
    open_type(page, "demo2027")
    r = page.evaluate("() => { const el = document.getElementById('hardToggle'); const p = curTask.prompt; el.click(); return { off: el.classList.contains('ht-off'), on: hardCtl.get(), same: curTask.prompt === p }; }")
    check("A: в демоверсии неактивна, нажатие ничего не меняет", r["off"] and r["on"] and r["same"], str(r))
    open_type(page, "random")
    check("A: в «Случайно» активна", not page.evaluate("() => document.getElementById('hardToggle').classList.contains('ht-off')"))
    page.click("#hardToggle")
    check("A: снять галочку", page.evaluate("() => !hardCtl.get() && localStorage.getItem('hardToggle:oge12') === '0'"))
    check("A: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_generators(browser):
    ctx, page, errors = open_page(browser)
    N = 300
    for mid in MODES:
        for hard in (False, True):
            tasks = page.evaluate(f"""() => {{
              const m = ALL_MODES.find(x => x.id === '{mid}');
              const out = [];
              for (let i = 0; i < {N}; i++) {{
                const t = m.gen({str(hard).lower()});
                out.push({{ prompt: t.prompt, correct: t.correctValue, nums: t.nums,
                           easy: isEasyTask(t, m.spec), hardOk: isHardTask(t, m.spec) }});
              }}
              return out;
            }}""")
            bad_ans, bad_kind, bad_nums = [], [], []
            for t in tasks:
                v = shown(t["prompt"])
                try:
                    want = answer_from_shown(mid, v)
                except Exception as e:  # noqa: BLE001
                    want = None
                if want is None or abs(float(want) - t["correct"]) > 1e-9:
                    bad_ans.append((t["prompt"][-160:], t["correct"]))
                nums = [Fraction(str(x)) for x in t["nums"]]
                if hard:
                    if not t["hardOk"]:
                        bad_kind.append(t["nums"])
                    if any(abs(x) > 999999 or (x * 100).denominator != 1 for x in nums):
                        bad_nums.append(t["nums"])
                else:
                    cap = 99999 if mid in BIG else 999
                    if not t["easy"]:
                        bad_kind.append(t["nums"])
                    if any(x.denominator != 1 or abs(x) > cap for x in nums) or abs(t["correct"]) > cap:
                        bad_nums.append(t["nums"])
                    # g = 9,8 и ρ = 1000 — постоянные самой формулы, sin α — дробь по природе
                    shown_vals = [x for k, x in v.items() if k not in ("sin", "g", "rho")]
                    if any(x.denominator != 1 or abs(x) > cap for x in shown_vals):
                        bad_nums.append(("показано", {k: str(x) for k, x in v.items()}))
            tag = "с галочкой" if hard else "без галочки"
            check(f"{'C' if hard else 'B'}: {mid} {tag} — ответ по показанным числам верный",
                  not bad_ans, str(bad_ans[:2]))
            if hard:
                check(f"C: {mid} с галочкой — трудное (дробь или больше 999), ≤ 999 999, ≤ 2 знаков",
                      not bad_kind and not bad_nums, str((bad_kind + bad_nums)[:3]))
            else:
                check(f"B: {mid} без галочки — только целые, ответ ≤ {'99 999' if mid in BIG else '999'}",
                      not bad_kind and not bad_nums, str((bad_kind + bad_nums)[:3]))
            distinct = len({t["prompt"] for t in tasks})
            check(f"{'C' if hard else 'B'}: {mid} {tag} — разнообразие ({distinct} разных из {N})", distinct >= 8, str(distinct))

    # доля трудных в «Случайно» с галочкой и их отсутствие без неё
    open_type(page, "random")
    r = page.evaluate("""() => {
      const cnt = on => { hardCtl.set(on, { persist: false }); let h = 0, n = 0;
        for (let i = 0; i < 600; i++) { newTask(); n++;
          if (curTask.nums && curTask.nums.some(x => Math.abs(x - Math.round(x)) > 1e-9 || Math.abs(x) > 999)) h++; }
        return h / n; };
      return { off: cnt(false), on: cnt(true) };
    }""")
    # без галочки «больше 999» бывает только в №8–10 (≈ 30 % заданий «Случайно»), дробей нет вовсе
    r2 = page.evaluate("""() => { hardCtl.set(false, { persist: false }); let d = 0;
      for (let i = 0; i < 400; i++) { newTask(); if (curTask.nums.some(x => Math.abs(x - Math.round(x)) > 1e-9)) d++; } return d; }""")
    check("C: «Случайно» без галочки — ни одной дроби", r2 == 0, str(r2))
    check("C: «Случайно» с галочкой — трудных заметно больше (≈ половина сверх обычных)", r["on"] - r["off"] > 0.25, str(r))
    check("B/C: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_session_board(browser):
    ctx, page, errors = open_page(browser)
    open_type(page, "f3")
    r = page.evaluate("""() => {
      const s0 = tsGetState().hardNums;
      const snap = tsGetState(); snap.hardNums = true;
      tsApplyState(snap);
      const a = { on: hardCtl.get(), ui: document.getElementById('hardToggle').getAttribute('aria-checked'), ls: localStorage.getItem('hardToggle:oge12'), st: tsGetState().hardNums };
      const old = tsGetState(); delete old.hardNums;
      tsApplyState(old);
      return { s0, a, after: hardCtl.get() };
    }""")
    check("D: галочка в снимке сессии (выключена)", r["s0"] is False, str(r))
    check("D: чужой снимок ставит галочку, но не пишет её в localStorage",
          r["a"] == {"on": True, "ui": "true", "ls": None, "st": True}, str(r["a"]))
    check("D: снимок без поля — выключена", r["after"] is False)

    page.add_script_tag(url="trainer-tasks.js")
    page.wait_for_function("() => typeof trainerGenInfo === 'function'")
    page.click("#hardToggle")
    page.wait_for_timeout(200)
    gen = page.evaluate("() => trainerGenInfo(window, 'oge12', 'oge12.html', document.getElementById('questionPanel'))")
    check("D: в рецепт «ещё такое же» уходит галочка",
          bool(gen) and gen["kind"] == "state" and gen["snap"].get("hardNums") is True and gen["snap"]["curMode"] == "f3", str(gen and gen.get("snap", {}).get("hardNums")))
    page.evaluate("() => hardCtl.set(false, { persist: false })")

    def run(snap, n):
        out = []
        for _ in range(n):
            page.evaluate("(g) => genNewTaskInFrame(window, g)", {"kind": "state", "snap": snap, "tid": "oge12", "href": "oge12.html"})
            page.wait_for_timeout(350)
            out.append(page.evaluate("() => [isHardTask(curTask, ALL_MODES.find(x => x.id === 'f3').spec), curMode]"))
        return out
    on = run(gen["snap"], 12)
    check("D: доска с галочкой — есть трудные, тип тот же", any(x[0] for x in on) and all(x[1] == "f3" for x in on), str(on))
    off = run(dict(gen["snap"], hardNums=False), 8)
    check("D: доска без галочки — трудных нет", not any(x[0] for x in off), str(off))
    check("D: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_old_saved(browser):
    ctx, page, errors = open_page(browser)
    page.evaluate("""() => {
      const old = { task: { prompt: 'СТАРОЕ ЗАДАНИЕ 361,25', correctValue: 5, explain: '' }, answered: false, hadWrongPick: false,
        pickedIndex: null, solvedInBatch: 0, errorsInBatch: 0, history: [], medals: { gold: 1, silver: 0, bronze: 0 },
        taskRenderVersion: 2, lastActiveAt: Date.now() };
      localStorage.setItem('ogeProg:oge12:f3', JSON.stringify(old));
    }""")
    page.reload()
    page.wait_for_function("() => typeof tsGetState === 'function'")
    page.wait_for_timeout(300)
    page.click('.mode-card[data-id="f3"]')
    page.wait_for_timeout(300)
    r = page.evaluate("() => ({ p: curTask.prompt, easy: isEasyTask(curTask, ALL_MODES.find(x => x.id === 'f3').spec), gold: curProg.medals.gold })")
    check("E: задание, сохранённое до галочки, придумано заново и целое; медали на месте",
          "СТАРОЕ" not in r["p"] and r["easy"] and r["gold"] == 1, str(r)[:200])
    check("E: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_phone(browser):
    ctx, page, errors = open_page(browser, width=375, height=800)
    page.click('.mode-card[data-id="f1"]')
    page.wait_for_timeout(300)
    r = page.evaluate("""() => {
      const el = document.getElementById('hardToggle').getBoundingClientRect();
      const tabs = document.querySelector('#submodeRow .submode-tabs').getBoundingClientRect();
      const row = document.getElementById('submodeRow');
      return { below: el.top >= tabs.bottom - 1, inside: el.right <= window.innerWidth && el.left >= 0,
               notClipped: row.scrollHeight <= row.clientHeight + 1, over: document.documentElement.scrollWidth - window.innerWidth };
    }""")
    check("F: 375px — галочка под вкладками, видна целиком, без прокрутки вбок",
          r["below"] and r["inside"] and r["notClipped"] and r["over"] <= 0, str(r))
    page.click("#hardToggle")
    check("F: 375px — нажимается", page.evaluate("() => hardCtl.get()"))
    check("F: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def run():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        test_toggle_ui(browser)
        test_generators(browser)
        test_session_board(browser)
        test_old_saved(browser)
        test_phone(browser)
        browser.close()
    bad = [n for n, ok in results if not ok]
    print()
    if bad:
        print(f"ПРОВАЛЫ ({len(bad)} из {len(results)}):")
        for n in bad:
            print("  -", n)
        sys.exit(1)
    print(f"ИТОГ: всё прошло ({len(results)} проверок)")


if __name__ == "__main__":
    run()
