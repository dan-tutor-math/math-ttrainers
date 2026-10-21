"""
Множественный выбор в списке досок.

⌘/Ctrl+щелчок по карточкам отмечает несколько досок (и папок), Shift+щелчок —
подряд, ⌘/Ctrl+A — всё видимое, Esc — снять. Снизу панель: «В папку»,
«Открыть во вкладках», «Удалить». Выделенные можно перетащить на папку
всей пачкой. Для планшета — кнопка «Выбрать».

Проверяем:
  1. ⌘+щелчок и Ctrl+щелчок отмечают и снимают отметку, доска при этом НЕ
     открывается; панель показывает «Выбрано: 2 доски».
  2. Пока что-то выделено, обычный щелчок тоже отмечает, а не открывает.
  3. Shift+щелчок выделяет подряд; Esc снимает всё; ⌘+A выделяет всё.
  4. «В папку» переносит всю пачку, штрихи выгруженных досок на диске целы.
  5. Перетаскивание одной из выделенных на папку уносит все выделенные.
  6. «Удалить» удаляет пачку (после подтверждения), записи досок с диска
     подчищены, в списке «удалённых» они есть.
  7. «Открыть во вкладках» открывает каждую доску в новой вкладке на этой
     самой доске; если браузер заблокировал часть вкладок — окно со
     ссылками на остальные.
  8. Кнопка «Выбрать» включает выбор обычными щелчками, «Готово» выключает.
  9. Без выделения обычный щелчок по-прежнему открывает доску.
"""
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8971
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
                conn.request("GET", "/boards.html")
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


BOOT_JS = """
() => {
  const gate = document.getElementById('authGate');
  if (gate) gate.style.display = 'none';
  // входа по почте в проверке нет — снимаем то, что поставил showGate()
  // (boards-cloud.js), как это сделал бы hideGate() после входа
  document.getElementById('screenList').style.display = '';
  if (window.boardsAppBoot) window.boardsAppBoot();
}
"""

SEED_JS = """
() => new Promise((resolve, reject) => {
  const req = indexedDB.open('ogeBoardsDB', 1);
  req.onupgradeneeded = () => req.result.createObjectStore('state');
  req.onsuccess = () => {
    const tx = req.result.transaction('state', 'readwrite');
    const st = tx.objectStore('state');
    const lite = (id, name, folderId) => ({ id, name, folderId: folderId || null, createdAt: 1000, updatedAt: 1000,
      lastOpenedAt: null, rev: 1, cellSize: 24, sheetCols: 76, sheetRows: 54, pageOrder: 'h',
      recentColors: [], colorUsage: {}, view: { x: 0, y: 0, zoom: 1 } });
    const ids = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6'];
    st.put({ __v: 2,
             folders: [{ id: 'fA', name: 'Архив', createdAt: 1000 }, { id: 'fB', name: 'Уроки', createdAt: 1000 }],
             boards: ids.map((id, i) => lite(id, 'Доска ' + (i + 1))).concat([lite('bIn', 'Внутри уроков', 'fB')]),
             deleted: [], sortMode: 'my' }, 'db');
    ids.concat(['bIn']).forEach(id => st.put({ objects: [{ id: 's_' + id, type: 'pen', points: [{x:1,y:1},{x:2,y:2}] }], imageLib: [] }, 'boarddata:' + id));
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  };
  req.onerror = () => reject(req.error);
})
"""


def read_payload(page, board_id):
    return page.evaluate(
        """(id) => new Promise((resolve, reject) => {
            const req = indexedDB.open('ogeBoardsDB');
            req.onsuccess = () => {
              const g = req.result.transaction('state', 'readonly').objectStore('state').get('boarddata:' + id);
              g.onsuccess = () => resolve(g.result || null);
              g.onerror = () => reject(g.error);
            };
            req.onerror = () => reject(req.error);
        })""",
        board_id,
    )


def card(bid):
    return f'#blGrid .bl-card[data-board="{bid}"] .bl-card-name'


def run():
    failures = []

    def check(name, cond):
        status = "OK" if cond else "FAIL"
        print(f"[{status}] {name}")
        if not cond:
            failures.append(name)

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={"width": 1280, "height": 860})
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"{BASE}/boards.html")
        page.evaluate(SEED_JS)
        page.reload()
        page.evaluate(BOOT_JS)
        page.wait_for_function("window.getDB && window.getDB().boards.length === 7")
        page.wait_for_selector(card("b1"))

        sel = lambda: sorted(page.evaluate("() => window.__blSelection()"))
        board_open = lambda: page.evaluate("() => document.getElementById('screenBoard').style.display === 'block'")
        bar_visible = lambda: page.evaluate("() => !document.getElementById('blSelBar').hidden")

        # ── 1. ⌘ и Ctrl ──
        check("панели выбора сначала нет", not bar_visible())
        page.click(card("b1"), modifiers=["Meta"])
        page.click(card("b2"), modifiers=["Control"])
        check("⌘/Ctrl+щелчок отметили две доски", sel() == ["b:b1", "b:b2"])
        check("доска при этом не открылась", not board_open())
        check("панель выбора видна", bar_visible())
        check("в панели «Выбрано: 2 доски»", page.inner_text("#blSelCount") == "Выбрано: 2 доски")
        check("отмеченные карточки подсвечены",
              page.evaluate("() => document.querySelectorAll('#blGrid .bl-card.bl-selected').length") == 2)
        page.click(card("b2"), modifiers=["Meta"])
        check("повторный ⌘+щелчок снимает отметку", sel() == ["b:b1"])

        # ── 2. обычный щелчок при активном выборе ──
        page.click(card("b3"))
        check("обычный щелчок при выборе отмечает, а не открывает", sel() == ["b:b1", "b:b3"] and not board_open())

        # ── 3. Shift, Esc, ⌘+A ──
        page.click(card("b5"), modifiers=["Shift"])
        check("Shift+щелчок выделяет подряд от последней отметки", sel() == ["b:b1", "b:b3", "b:b4", "b:b5"])
        page.keyboard.press("Escape")
        check("Esc снимает выделение и прячет панель", sel() == [] and not bar_visible())
        page.click("#blTitle")   # фокус на страницу, не в поле поиска
        page.keyboard.press("Meta+a")
        check("⌘+A выделяет всё видимое (2 папки и 6 досок)", len(sel()) == 8)
        check("в панели доски и папки посчитаны",
              page.inner_text("#blSelCount") == "Выбрано: 6 досок и 2 папки")
        page.click("#blSelCancel")
        check("крестик снимает выделение", sel() == [])

        # ── 4. «В папку» ──
        page.click(card("b1"), modifiers=["Meta"])
        page.click(card("b2"), modifiers=["Meta"])
        page.click("#blSelMove")
        page.wait_for_selector("#blSelFolderPop")
        page.click('#blSelFolderPop button[data-folder="fA"]')
        page.wait_for_timeout(600)
        fid = page.evaluate("() => Object.fromEntries(window.getDB().boards.map(b => [b.id, b.folderId]))")
        check("«В папку» перенесла обе доски в «Архив»", fid["b1"] == "fA" and fid["b2"] == "fA")
        check("остальные доски остались на месте", fid["b3"] is None and fid["b4"] is None)
        check("после переноса выделение снято", sel() == [] and not bar_visible())
        check("штрихи перенесённых досок на диске целы",
              len((read_payload(page, "b1") or {}).get("objects", [])) == 1
              and len((read_payload(page, "b2") or {}).get("objects", [])) == 1)

        # «Новая папка…» из того же списка
        page.click(card("b6"), modifiers=["Meta"])
        page.once("dialog", lambda d: d.accept("Свежая"))
        page.click("#blSelMove")
        page.click('#blSelFolderPop button[data-folder="__new"]')
        page.wait_for_timeout(300)
        new_f = page.evaluate("() => window.getDB().folders.find(f => f.name === 'Свежая')")
        check("«Новая папка…» создаёт папку и кладёт туда доску",
              bool(new_f) and page.evaluate("(id) => window.getDB().boards.find(b => b.id === 'b6').folderId === id", new_f["id"]))

        # ── 5. перетаскивание пачки на папку ──
        page.click(card("b3"), modifiers=["Meta"])
        page.click(card("b4"), modifiers=["Meta"])
        src = page.locator('#blGrid .bl-card[data-board="b3"]').bounding_box()
        dst = page.locator('#blGrid .bl-card[data-folder="fB"]').bounding_box()
        page.mouse.move(src["x"] + src["width"] / 2, src["y"] + src["height"] / 2)
        page.mouse.down()
        page.mouse.move(src["x"] + src["width"] / 2 + 20, src["y"] + src["height"] / 2 + 10, steps=3)
        ghost_count = page.evaluate("() => (document.querySelector('.bl-drag-ghost .bl-drag-count') || {}).textContent || ''")
        page.mouse.move(dst["x"] + dst["width"] / 2, dst["y"] + dst["height"] / 2, steps=8)
        page.mouse.up()
        page.wait_for_timeout(500)
        check("у перетаскиваемой пачки счётчик «2»", ghost_count == "2")
        fid = page.evaluate("() => Object.fromEntries(window.getDB().boards.map(b => [b.id, b.folderId]))")
        check("перетаскивание одной из выделенных унесло обе в папку «Уроки»", fid["b3"] == "fB" and fid["b4"] == "fB")
        check("после переноса пачки ничего не открылось", not board_open())

        # ── 6. удаление пачки (две доски внутри «Уроков») ──
        page.click('#blGrid .bl-card[data-folder="fB"] .bl-card-name')   # заходим в папку
        page.wait_for_selector(card("b3"))
        page.click(card("b3"), modifiers=["Meta"])
        page.click(card("b4"), modifiers=["Meta"])
        msgs = []
        page.once("dialog", lambda d: (msgs.append(d.message), d.accept()))
        page.click("#blSelDelete")
        page.wait_for_timeout(600)
        ids = page.evaluate("() => window.getDB().boards.map(b => b.id)")
        check("подтверждение называет число досок", bool(msgs) and "2 доски" in msgs[0])
        check("обе выделенные доски удалены", "b3" not in ids and "b4" not in ids)
        check("третья доска в папке осталась", "bIn" in ids)
        check("удалённые попали в список «удалённых»",
              page.evaluate("() => ['b3','b4'].every(id => window.getDB().deleted.some(d => d.id === id))"))
        check("записи удалённых досок подчищены с диска", read_payload(page, "b3") is None and read_payload(page, "b4") is None)

        # отказ от подтверждения ничего не удаляет
        page.click(card("bIn"), modifiers=["Meta"])
        page.once("dialog", lambda d: d.dismiss())
        page.click("#blSelDelete")
        page.wait_for_timeout(200)
        check("«Отмена» в подтверждении ничего не удаляет",
              page.evaluate("() => window.getDB().boards.some(b => b.id === 'bIn')"))
        page.keyboard.press("Escape")

        # ── 7. открыть во вкладках ──
        page.click('.bl-nav-item[data-nav="fA"]')
        page.wait_for_selector(card("b1"))
        page.click(card("b1"), modifiers=["Meta"])
        page.click(card("b2"), modifiers=["Meta"])
        new_pages = []
        context.on("page", lambda pg: new_pages.append(pg))
        page.click("#blSelTabs")
        for _ in range(50):
            if len(new_pages) >= 2:
                break
            page.wait_for_timeout(100)
        check("открылись две новые вкладки", len(new_pages) == 2)
        opened_ids = []
        for pg in new_pages:
            pg.wait_for_load_state()
            pg.evaluate(BOOT_JS)
            try:
                pg.wait_for_function("window.getCurrentBoard && window.getCurrentBoard() && document.getElementById('screenBoard').style.display === 'block'", timeout=8000)
                opened_ids.append(pg.evaluate("() => window.getCurrentBoard().id"))
            except Exception:
                opened_ids.append(None)
        check("каждая вкладка открыта на своей доске", sorted(opened_ids) == ["b1", "b2"])
        check("адреса вкладок — boards.html#board=<id>",
              all("boards.html#board=" in pg.url for pg in new_pages))
        check("исходная вкладка осталась на списке", not board_open())
        check("после открытия выделение снято", sel() == [])
        for pg in new_pages:
            pg.close()

        # браузер заблокировал всё, кроме первой вкладки
        page.evaluate("""() => {
            const real = window.open.bind(window);
            let n = 0;
            window.__opened = [];
            window.open = (url, t) => { n++; window.__opened.push(url); return n === 1 ? { opener: 1 } : null; };
        }""")
        page.click(card("b1"), modifiers=["Meta"])
        page.click(card("b2"), modifiers=["Meta"])
        page.click("#blSelTabs")
        page.wait_for_selector("#blTabsModal")
        links = page.evaluate("() => [...document.querySelectorAll('#blTabsModal .bl-tabs-link')].map(a => a.getAttribute('href'))")
        check("при блокировке — окно со ссылкой на неоткрытую доску",
              len(links) == 1 and links[0].endswith("#board=" + page.evaluate("() => window.__opened[1].split('#board=')[1]")))
        check("в окне сказано, сколько открылось", "Открылась 1 вкладка из 2" in page.inner_text("#blTabsModal"))
        page.click("#blTabsClose")
        check("«Готово» закрывает окно и снимает выделение",
              page.evaluate("() => !document.getElementById('blTabsModal')") and sel() == [])

        # ── 8. кнопка «Выбрать» ──
        page.click('.bl-nav-item[data-nav="__root"]')
        page.wait_for_selector(card("b5"))
        page.click("#blSelectBtn")
        check("«Выбрать» показывает панель и кружки на карточках",
              bar_visible() and page.evaluate("() => document.getElementById('blGrid').classList.contains('bl-selecting')"))
        check("кнопка стала «Готово»", page.inner_text("#blSelectBtn").strip() == "Готово")
        check("пока ничего не отмечено, действия выключены",
              page.evaluate("() => ['blSelMove','blSelTabs','blSelDelete'].every(id => document.getElementById(id).disabled)"))
        page.click(card("b5"))
        check("в режиме «Выбрать» обычный щелчок отмечает", sel() == ["b:b5"] and not board_open())
        page.click(card("b5"))
        check("…и снимает отметку, режим при этом остаётся", sel() == [] and bar_visible())
        page.click("#blSelectBtn")
        check("«Готово» выключает режим", not bar_visible() and page.inner_text("#blSelectBtn").strip() == "Выбрать")

        # папку в папку не кладём — «В папку» выключена, если выбраны одни папки
        page.click('#blGrid .bl-card[data-folder="fA"] .bl-card-name', modifiers=["Meta"])
        check("одни папки: «В папку» и «Во вкладках» выключены, «Удалить» — нет",
              page.evaluate("() => document.getElementById('blSelMove').disabled && document.getElementById('blSelTabs').disabled && !document.getElementById('blSelDelete').disabled"))
        page.keyboard.press("Escape")

        # ── 9. без выделения щелчок открывает ──
        page.click(card("b5"))
        page.wait_for_function("document.getElementById('screenBoard').style.display === 'block'")
        check("без выделения обычный щелчок открывает доску", page.evaluate("() => window.getCurrentBoard().id") == "b5")
        check("панель выбора на доске не видна",
              page.evaluate("() => document.getElementById('blSelBar').offsetParent === null"))

        check("ошибок JavaScript нет", not errors)
        if errors:
            print("\n".join(errors))
        browser.close()

    print()
    print("ИТОГ: всё прошло" if not failures else f"ИТОГ: провалено {len(failures)}")
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(run())
