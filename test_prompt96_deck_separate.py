"""
Промпт №96: презентации отделены от досок (boards-core.js, deck-core.js,
board-stage.js; HANDOFF.md раздел 6б).

Проверяем:
  1. На странице досок модуль презентаций не загружен, пока презентацию не
     открыли: тега deck-core.js нет, deckOnOpen не определён
  2. Обычная доска открывается и рисует, модуль так и не загружен
  3. Раздел «Презентации» в списке: счётчик, только презентации из всех папок,
     адрес #decks; после перезагрузки с #decks открыт этот раздел
  4. «Создать презентацию» подгружает модуль и открывает презентацию
  5. Перезагрузка с #board=<id презентации> открывает её (модуль грузится
     при старте); «Назад к доскам» из раздела «Презентации» — снова #decks
  6. Модуль не загрузился (нет сети) — сообщение, остаёмся на списке
  7. Ученик в совместной сессии (доска учителя, board-stage.js): модуль
     подгружается сам, слайд — учительский (бумага тёмного слайда тёмная),
     учитель листает — у ученика следующий слайд; ни ленты, ни полосы
     листания у ученика нет, isDeckBoard() у него ложь

Живой realtime отсюда недоступен (заглушка Supabase из теста №78) — на
сайте совместный режим перепроверяется руками.

Запуск: python3 test_prompt96_deck_separate.py
"""
import sys
import time

from playwright.sync_api import sync_playwright

import test_prompt11_shared_screen as t11
import test_prompt11_board_stage as BS
import test_prompt78_demo_fixes as D

PORT = 8996
t11.PORT = PORT
t11.BASE = D.BASE = BS.BASE = BASE = f"http://127.0.0.1:{PORT}"
D.P.BASE = BASE
failures = t11.failures
errors = t11.errors
check = t11.check
wait_js = BS.wait_js

BOOT_JS = """() => {
  const gate = document.getElementById('authGate');
  if (gate) gate.style.display = 'none';
  window.boardsAppBoot();
  document.getElementById('screenList').style.display = 'flex';
}"""

# две обычные доски (одна в папке) и презентация в папке: два слайда,
# второй тёмный, на втором прямоугольник
SEED_JS = """() => new Promise((resolve, reject) => {
  const lite = (id, name, extra) => Object.assign({ id, name, folderId: null, createdAt: 1000, updatedAt: 1000, lastOpenedAt: null, rev: 1,
    cellSize: 24, sheetCols: 76, sheetRows: 54, pageOrder: 'h', recentColors: [], colorUsage: {} }, extra || {});
  const deck = { id: 'deck', type: 'deck', points: [{ x: -1e7, y: -1e7 }], slides: [
    { id: 'sA', slot: 0, w: 64, h: 36, bg: { k: 'grid' } },
    { id: 'sB', slot: 1, w: 64, h: 36, bg: { k: 'dark' } } ] };
  const pitch = 128 * 24;
  const rect = { id: 'r1', type: 'quad', rect: true, color: '--pencil', width: 3,
    points: [{ x: 200, y: pitch + 200 }, { x: 500, y: pitch + 200 }, { x: 500, y: pitch + 400 }, { x: 200, y: pitch + 400 }] };
  const pen = { id: 'p1', type: 'pen', color: '--pencil', width: 3, points: [{ x: 2000, y: 1500 }, { x: 2100, y: 1550 }] };
  const req = indexedDB.open('ogeBoardsDB', 1);
  req.onupgradeneeded = () => req.result.createObjectStore('state');
  req.onsuccess = () => {
    const tx = req.result.transaction('state', 'readwrite');
    const st = tx.objectStore('state');
    st.put({ __v: 2, folders: [{ id: 'fA', name: 'Папка А' }], deleted: [], sortMode: 'my', boards: [
      lite('bPlain', 'Обычная'), lite('bInFolder', 'В папке', { folderId: 'fA' }),
      lite('bDeck', 'Урок слайдами', { kind: 'deck', folderId: 'fA' }) ] }, 'db');
    st.put({ objects: [pen], imageLib: [] }, 'boarddata:bPlain');
    st.put({ objects: [], imageLib: [] }, 'boarddata:bInFolder');
    st.put({ objects: [deck, rect], imageLib: [] }, 'boarddata:bDeck');
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  };
  req.onerror = () => reject(req.error);
})"""

PIX_JS = """([wx, wy]) => {
  const cv = document.getElementById('boardCv'), k = cv.width / cv.getBoundingClientRect().width;
  const sx = Math.round((wx - cam.x) * cam.zoom * k), sy = Math.round((wy - cam.y) * cam.zoom * k);
  const d = cv.getContext('2d').getImageData(sx, sy, 1, 1).data;
  return [d[0], d[1], d[2], d[3]];
}"""

DECK_LOADED = "() => typeof deckOnOpen === 'function'"
DECK_TAG = "() => !!document.querySelector('script[src=\"deck-core.js\"]')"


def boot(page):
    page.evaluate(BOOT_JS)
    page.wait_for_function("() => window.getDB && window.getDB().boards.length >= 3")
    page.wait_for_timeout(200)


def nav_cards(page):
    return page.evaluate("() => [...document.querySelectorAll('#blGrid .bl-card')].map(c => c.textContent.replace(/\\s+/g, ' ').trim())")


def run_single(browser):
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(f"{BASE}/boards.html")
    page.evaluate(SEED_JS)
    page.reload()
    boot(page)

    print("1. Модуль презентаций не загружен")
    check("1: тега deck-core.js нет", not page.evaluate(DECK_TAG))
    check("1: deckOnOpen не определён", not page.evaluate(DECK_LOADED))

    print("2. Обычная доска без модуля")
    page.evaluate("() => openBoard('bPlain')")
    page.wait_for_function("() => window.getCurrentBoard() && window.getCurrentBoard().id === 'bPlain' && boardActive")
    page.wait_for_timeout(300)
    check("2: обычная доска открыта", page.evaluate("() => getCurrentBoard().id") == "bPlain")
    check("2: полосы листания нет", page.evaluate("() => document.getElementById('deckNav').hidden"))
    check("2: модуль так и не загружен", not page.evaluate(DECK_LOADED) and not page.evaluate(DECK_TAG))
    page.click("#bdBack") if page.query_selector("#bdBack") else page.evaluate("() => backToList()")
    page.wait_for_timeout(200)

    print("3. Раздел «Презентации»")
    item = page.query_selector(".bl-nav-item[data-nav='__decks']")
    check("3: пункт «Презентации» есть", item is not None)
    cnt = page.inner_text(".bl-nav-item[data-nav='__decks'] .cnt").strip() if item else ""
    check("3: счётчик 1", cnt == "1", cnt)
    page.click(".bl-nav-item[data-nav='__decks']")
    page.wait_for_timeout(200)
    cards = nav_cards(page)
    check("3: видна только презентация (она в папке)", len(cards) == 1 and "Урок слайдами" in cards[0], str(cards))
    check("3: заголовок «Презентации»", "Презентации" in page.inner_text("#blTitle"))
    check("3: адрес #decks", page.evaluate("() => location.hash") == "#decks")
    check("3: модуль не загружен от просмотра списка", not page.evaluate(DECK_LOADED))
    page.reload()
    boot(page)
    check("3: после перезагрузки с #decks — раздел «Презентации»",
          page.evaluate("() => document.querySelector('.bl-nav-item.active')?.dataset.nav") == "__decks")
    page.click(".bl-nav-item[data-nav='__root']")
    page.wait_for_timeout(150)
    check("3: «Все доски» снимают #decks", page.evaluate("() => location.hash") == "")

    print("4. «Создать презентацию»")
    n0 = page.evaluate("() => getDB().boards.length")
    page.click("#blCreateDeck")
    ok = wait_js(page, "() => boardActive && getCurrentBoard().kind === 'deck' && !document.getElementById('deckNav').hidden", 5000)
    check("4: презентация создана и открыта, полоса листания видна", ok)
    check("4: модуль загружен один раз", page.evaluate("() => document.querySelectorAll('script[src=\"deck-core.js\"]').length") == 1)
    check("4: досок стало на одну больше", page.evaluate("() => getDB().boards.length") == n0 + 1)
    check("4: «+ слайд» работает", page.evaluate("() => { deckAddSlide(); return deckSlides().length; }") == 2)
    page.evaluate("() => backToList()")
    page.wait_for_timeout(200)

    print("5. Перезагрузка прямо в презентацию")
    page.evaluate("() => { curFolderId = '__decks'; renderList(); }")
    page.evaluate("() => openBoard('bDeck')")
    page.wait_for_function("() => boardActive && getCurrentBoard().id === 'bDeck'")
    page.evaluate("() => deckGo(1)")
    page.wait_for_timeout(300)
    page.evaluate("() => backToList()")
    page.wait_for_timeout(200)
    check("5: «Назад к доскам» из раздела «Презентации» — снова #decks", page.evaluate("() => location.hash") == "#decks")
    page.evaluate("() => openBoard('bDeck')")
    page.wait_for_function("() => boardActive && getCurrentBoard().id === 'bDeck'")
    page.wait_for_timeout(1200)
    page.reload()
    page.evaluate(BOOT_JS)
    ok = wait_js(page, "() => typeof deckOnOpen === 'function' && boardActive && getCurrentBoard().id === 'bDeck'", 6000)
    check("5: #board=<презентация> открывает её после перезагрузки", ok)
    page.wait_for_timeout(400)
    check("5: на том же слайде (2 / 2)", page.inner_text("#deckNo").strip() == "2 / 2", page.inner_text("#deckNo"))

    print("6. Модуль не загрузился")
    page2 = ctx.new_page()
    page2.on("pageerror", lambda e: errors.append(str(e)))
    page2.route("**/deck-core.js", lambda route: route.abort())
    page2.goto(f"{BASE}/boards.html")
    boot(page2)
    msgs = []
    page2.on("dialog", lambda d: (msgs.append(d.message), d.accept()))
    page2.evaluate("() => openBoard('bDeck')")
    page2.wait_for_timeout(1200)
    check("6: сообщение о связи", any("загрузить презентации" in m for m in msgs), str(msgs))
    check("6: остались на списке", not page2.evaluate("() => boardActive"))
    page2.close()
    ctx.close()


def run_stage(browser):
    print("7. Ученик в совместной сессии")
    ctx = browser.new_context()
    teacher = D.participant(ctx, "T", 1300, 820)
    teacher.goto(f"{BASE}/boards.html")
    teacher.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()")
    teacher.evaluate(SEED_JS)
    teacher.reload()
    teacher.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()")
    teacher.evaluate(BS.BOOT_JS)
    teacher.wait_for_function("() => window.getDB && window.getDB().boards.length >= 3")
    code = teacher.evaluate("() => TrainerSession.getCode()")
    teacher.evaluate("() => window.openBoard('bDeck')")
    teacher.wait_for_function("() => boardActive && getCurrentBoard().id === 'bDeck' && typeof deckCur === 'function'")
    teacher.evaluate("() => deckGo(0)")
    teacher.wait_for_timeout(300)

    st = D.participant(ctx, "S", 1000, 700)
    st.add_init_script("try { localStorage.setItem('S:tsStage:direct', '1'); } catch (e) {}")
    st.goto(f"{BASE}/boards.html?s={code}")
    ok = wait_js(st, "() => { const B = window.getCurrentBoard(); return B && B.objects && B.objects.length === 2 && boardActive; }", 20000)
    check("7: ученик получил доску учителя", ok)
    ok = wait_js(st, "() => window.deckViewerMode === true && getCurrentBoard().kind === 'deck'", 6000)
    check("7: модуль презентаций у ученика подгрузился сам", ok)
    check("7: isDeckBoard() у ученика — ложь", st.evaluate("() => isDeckBoard()") is False)
    ok = wait_js(st, "() => deckCur() && deckCur().id === 'sA'", 4000)
    check("7: у ученика первый слайд, как у учителя", ok, st.evaluate("() => deckCur() && deckCur().id"))

    teacher.evaluate("() => deckGo(1, 1)")
    ok = wait_js(st, "() => deckCur() && deckCur().id === 'sB'", 5000)
    check("7: учитель перелистнул — у ученика второй слайд", ok, st.evaluate("() => deckCur() && deckCur().id"))
    st.wait_for_timeout(500)
    st.evaluate("() => scheduleRedraw()")
    st.wait_for_timeout(200)
    r = st.evaluate("() => deckSlideRect(deckCur())")
    px = st.evaluate(PIX_JS, [r["x"] + r["w"] * 0.8, r["y"] + r["h"] * 0.8])
    check("7: бумага тёмного слайда у ученика тёмная", sum(px[:3]) < 200, str(px))
    hidden = st.evaluate("() => ['deckNav', 'deckStrip', 'deckScrub'].every(id => { const e = document.getElementById(id); return !e || e.hidden || !e.getBoundingClientRect().width; })")
    check("7: у ученика нет ленты, полосы листания и ползунка", hidden)
    cam0 = st.evaluate("() => [cam.x, cam.y, cam.zoom].join(',')")
    st.keyboard.press("PageDown")
    st.wait_for_timeout(300)
    check("7: PageDown у ученика ничего не листает", st.evaluate("() => [cam.x, cam.y, cam.zoom].join(',')") == cam0)

    # №105: учитель включил режим показа — у ученика тоже только слайд
    teacher.evaluate("() => dtbShowStart(false)")
    ok = wait_js(st, "() => document.documentElement.classList.contains('deck-show')", 5000)
    check("7 (№105): учитель в показе — у ученика вид показа", ok)
    teacher.evaluate("() => dtbShowStop()")
    ok = wait_js(st, "() => !document.documentElement.classList.contains('deck-show')", 5000)
    check("7 (№105): учитель вышел из показа — у ученика снято", ok)

    teacher.evaluate("() => { backToList(); }")
    teacher.wait_for_timeout(300)
    teacher.evaluate("() => window.openBoard('bPlain')")
    ok = wait_js(st, "() => { const B = getCurrentBoard(); return B && B.objects && B.objects.length === 1 && B.objects[0].id === 'p1' && boardActive; }", 15000)
    check("7: учитель открыл обычную доску — у ученика она", ok)
    check("7: и режим презентации у ученика снят", st.evaluate("() => !window.deckViewerMode && getCurrentBoard().kind !== 'deck'"))
    ctx.close()


def run():
    with t11.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        run_single(browser)
        run_stage(browser)
        browser.close()
    real = [e for e in errors if "fonts.g" not in e]
    if real:
        failures.append("ошибки JS на странице: " + " | ".join(real[:5]))
    print()
    if failures:
        print("ПРОВАЛЫ:")
        for x in failures:
            print(" -", x)
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    run()
