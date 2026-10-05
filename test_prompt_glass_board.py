"""
Жидкое стекло на доске (boards.html): док инструментов в режиме «максимум».

Что проверяет:
- в «максимуме» у дока прозрачное преломляющее стекло отдельным слоем, на
  самом доке своего фона и размытия нет;
- выбранный инструмент подсвечивает «капля»: стоит ровно на нём, а при
  переключении перетекает к новому — по кадрам, вытягиваясь по ходу
  движения, и встаёт ровно на новый инструмент; так же при переключении
  клавишей;
- инструменты увеличиваются под курсором, док растёт вместе с ними, а
  панель настроек инструмента (цвет, толщина) держит прежний зазор до дока;
- при наведении над инструментом появляется его название (без пояснения
  после тире), системная подсказка title на это время снята;
- в обычном режиме всё как было: капли нет, у выбранного инструмента свой
  фон, title на месте, док со своим стеклом;
- нет ошибок JavaScript.

Запуск: python3 test_prompt_glass_board.py (сервер поднимается сам).
"""
import contextlib
import http.client
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8974
BASE = f"http://127.0.0.1:{PORT}"
fails = []


def check(cond, msg):
    print(("[OK]   " if cond else "[FAIL] ") + msg)
    if not cond:
        fails.append(msg)


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                c = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                c.request("GET", "/boards.html"); c.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        yield
    finally:
        proc.terminate(); proc.wait(timeout=5)


BOOT_JS = """() => {
  const gate = document.getElementById('authGate');
  if (gate) gate.style.display = 'none';
  window.boardsAppBoot();
}"""

LITE = {
    "id": "bA", "name": "Урок", "folderId": None,
    "createdAt": 1000, "updatedAt": 1000, "lastOpenedAt": None, "rev": 1,
    "cellSize": 24, "sheetCols": 76, "sheetRows": 54, "pageOrder": "h",
    "recentColors": [], "colorUsage": {},
}

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


def open_board(browser, fx):
    ctx = browser.new_context(viewport={"width": 1400, "height": 900})
    ctx.add_init_script(f"localStorage.setItem('mathh-fx','{fx}');localStorage.setItem('theme','light')")
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda r: r.abort())
    page.goto(f"{BASE}/boards.html")
    page.evaluate(SEED_JS, [[LITE], {"bA": {"objects": [], "imageLib": []}}])
    page.reload()
    page.evaluate(BOOT_JS)
    page.wait_for_function("() => window.getDB && window.getDB().boards.length >= 1")
    page.evaluate("() => window.openBoard('bA')")
    page.wait_for_function("() => window.getCurrentBoard() && Array.isArray(window.getCurrentBoard().objects)")
    page.wait_for_timeout(700)
    return ctx, page, errors


PILL = """(() => { const p = document.querySelector('#bdDockTools > .lg-pill');
  const m = /translate\\(([-\\d.]+)px, ?([-\\d.]+)px\\) scale\\(([-\\d.]+), ?([-\\d.]+)\\)/.exec(p.style.transform) || [];
  return { x: +m[1], y: +m[2], sx: +m[3], sy: +m[4], w: parseFloat(p.style.width), h: parseFloat(p.style.height),
           op: getComputedStyle(p).opacity, disp: getComputedStyle(p).display }; })()"""
TOOL = """(t => { const b = document.querySelector('#bdDock .bd-tool[data-tool="' + t + '"]');
  return { x: b.offsetLeft, y: b.offsetTop, w: b.offsetWidth, h: b.offsetHeight }; })"""


def center(page, sel):
    return page.evaluate(f"(()=>{{const e=document.querySelector('{sel}').getBoundingClientRect();return [e.left+e.width/2,e.top+e.height/2]}})()")


def run():
    with local_server(), sync_playwright() as p:
        b = p.chromium.launch()

        # ── «максимум» ──
        ctx, page, errors = open_board(b, "full")
        dock = page.evaluate("""(()=>{const d=document.getElementById('bdDock'), g=d.querySelector(':scope > .lg-glass');
            return {bg:getComputedStyle(d).backgroundColor, bf:getComputedStyle(d).backdropFilter,
                    gl:getComputedStyle(g).display, gbf:getComputedStyle(g).backdropFilter}})()""")
        check(dock["bg"] in ("rgba(0, 0, 0, 0)", "transparent") and dock["bf"] == "none",
              f"у самого дока нет своего фона и размытия ({dock['bg']}, {dock['bf']})")
        check(dock["gl"] == "block" and "url(" in dock["gbf"], f"стекло дока — отдельный слой с преломлением ({dock['gbf']})")

        pen = page.evaluate(TOOL + "('pen')")
        pl = page.evaluate(PILL)
        check(pl["disp"] == "block" and pl["op"] == "1" and abs(pl["x"] - pen["x"]) < 0.5 and abs(pl["w"] - pen["w"]) < 0.5,
              f"капля стоит на выбранном инструменте «Ручка» ({pl['x']}, {pen['x']})")
        check(page.evaluate("getComputedStyle(document.querySelector('.bd-tool[data-tool=pen]')).backgroundColor") in ("rgba(0, 0, 0, 0)", "transparent"),
              "у выбранного инструмента нет своего фона — его подсвечивает капля")

        # переключение: капля перетекает по кадрам
        page.mouse.move(700, 300)
        page.evaluate("document.querySelector('.bd-tool[data-tool=ellipse]').click()")
        frames = page.evaluate("""() => new Promise(res => { const out = []; const t0 = performance.now();
            (function f(){ const p = document.querySelector('#bdDockTools > .lg-pill');
              const m = /translate\\(([-\\d.]+)px, ?([-\\d.]+)px\\) scale\\(([-\\d.]+), ?([-\\d.]+)\\)/.exec(p.style.transform);
              out.push([+m[1], +m[3]]); if (performance.now() - t0 < 900) requestAnimationFrame(f); else res(out); })(); })""")
        ell = page.evaluate(TOOL + "('ellipse')")
        xs = [f[0] for f in frames]
        between = [x for x in xs if pen["x"] + 4 < x < ell["x"] - 4]
        check(len(between) >= 4, f"капля едет к новому инструменту через промежуточные положения ({len(between)} кадров в пути)")
        check(max(f[1] for f in frames) > 1.05, f"по ходу движения капля вытягивается (до {max(f[1] for f in frames):.2f})")
        check(abs(xs[-1] - ell["x"]) < 0.5 and abs(frames[-1][1] - 1) < 0.01, "капля встаёт ровно на новый инструмент и снова круглая")

        # клавиша инструмента — тоже перетекание
        page.keyboard.press("1"); page.wait_for_timeout(900)
        hand = page.evaluate(TOOL + "('hand')")
        check(abs(page.evaluate(PILL)["x"] - hand["x"]) < 0.5, "переключение клавишей — капля переезжает на «Руку»")
        page.keyboard.press("3"); page.wait_for_timeout(900)

        # увеличение под курсором; панель настроек держит зазор
        gap0 = page.evaluate("document.getElementById('bdDock').getBoundingClientRect().top - document.querySelector('.bd-optbar').getBoundingClientRect().bottom")
        w0 = page.evaluate("document.getElementById('bdDock').getBoundingClientRect().width")
        c = center(page, ".bd-tool[data-tool=line]")
        page.mouse.move(c[0], c[1]); page.wait_for_timeout(700)
        lw = page.evaluate("document.querySelector('.bd-tool[data-tool=line]').getBoundingClientRect().width")
        base = page.evaluate("document.querySelector('.bd-tool[data-tool=hand]').getBoundingClientRect().width")
        w1 = page.evaluate("document.getElementById('bdDock').getBoundingClientRect().width")
        check(lw > base * 1.25 and w1 > w0 + 10, f"инструмент под курсором вырос, док раздвинулся ({base:.0f}→{lw:.0f}, док {w0:.0f}→{w1:.0f})")
        gap1 = page.evaluate("document.getElementById('bdDock').getBoundingClientRect().top - document.querySelector('.bd-optbar').getBoundingClientRect().bottom")
        check(abs(gap1 - gap0) < 1.5, f"панель настроек держит зазор до выросшего дока ({gap0:.1f} → {gap1:.1f})")

        # название над инструментом
        tip = page.evaluate("""(()=>{const t=document.querySelector('.lg-ftip'), r=t.getBoundingClientRect(),
            b=document.querySelector('.bd-tool[data-tool=line]').getBoundingClientRect();
            return {text:t.textContent, on:t.classList.contains('is-on'), above:r.bottom<=b.top+1,
                    title:document.querySelector('.bd-tool[data-tool=line]').hasAttribute('title')}})()""")
        check(tip["on"] and tip["text"] == "Прямая (5)" and tip["above"], f"над инструментом появилось его название ({tip})")
        check(not tip["title"], "системная подсказка title на это время снята")
        c2 = center(page, ".bd-tool[data-tool=axis]")
        page.mouse.move(c2[0], c2[1]); page.wait_for_timeout(300)
        check(page.evaluate("document.querySelector('.lg-ftip').textContent") == "Координатная прямая",
              "в названии нет пояснения после тире")
        page.mouse.move(700, 300); page.wait_for_timeout(900)
        check(not page.evaluate("document.querySelector('.lg-ftip').classList.contains('is-on')"), "курсор ушёл — название спряталось")
        check(not errors, f"нет ошибок JavaScript в максимуме ({errors[:2]})")
        ctx.close()

        # ── обычный режим: всё как было ──
        ctx, page, errors = open_board(b, "lite")
        check(page.evaluate("getComputedStyle(document.querySelector('#bdDockTools > .lg-pill')).display") == "none",
              "в обычном режиме капли нет")
        check(page.evaluate("getComputedStyle(document.querySelector('.bd-tool[data-tool=pen]')).backgroundColor") not in ("rgba(0, 0, 0, 0)", "transparent"),
              "в обычном режиме у выбранного инструмента свой фон")
        check(page.evaluate("getComputedStyle(document.getElementById('bdDock')).backdropFilter") != "none"
              and page.evaluate("getComputedStyle(document.querySelector('#bdDock > .lg-glass')).display") == "none",
              "в обычном режиме у дока прежнее стекло")
        c = center(page, ".bd-tool[data-tool=line]")
        page.mouse.move(c[0], c[1]); page.wait_for_timeout(500)
        check(page.evaluate("document.querySelector('.bd-tool[data-tool=line]').hasAttribute('title')")
              and page.evaluate("document.querySelector('.bd-tool[data-tool=line]').style.getPropertyValue('--lg-mag')") == "",
              "в обычном режиме инструменты не растут, title на месте")
        check(not errors, f"нет ошибок JavaScript в обычном режиме ({errors[:2]})")
        ctx.close()
        b.close()

    print()
    if fails:
        print("ПРОВАЛЫ:\n- " + "\n- ".join(fails))
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    run()
