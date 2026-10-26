"""
№113: доски и презентации — разные виды списка (+ «Бета»), удалённое не возвращается.

Раньше «Презентации» были пунктом слева, а в «Всех досках», «Недавних», папках,
поиске и корзине презентации лежали вперемешку с досками. Теперь над заголовком
переключатель: «Основные доски» (по умолчанию) · «Все доски и презентации» ·
«Презентации» с подписью «Бета».

Проверяем:
  1. По умолчанию открыты основные доски: презентаций нет ни в корне, ни в
     «Недавних», ни в папке, ни в поиске, ни в корзине; счётчики считают только доски.
  2. «Презентации»: только они, плоским списком из всех папок, адрес #decks,
     обе кнопки создания видны во всех видах (у презентации — «Бета»), в корзине — только
     удалённые презентации, подпись «Бета» у вкладки и в заголовке.
  3. «Все доски и презентации»: и то и другое, папки на месте.
  4. Перезагрузка: без #decks — снова доски; с #decks — презентации.
  5. Удаление папки в виде «Основные доски» уносит в корзину и презентацию внутри.
  6. Возврат удалённого: корзина в одной вкладке не отменяется сохранением из
     другой; стёртое насовсем не возвращается; список DB.deleted не раздувается.
  Сервер (Supabase) в проверке не участвует.
"""
import sys
sys.path.insert(0, '.')
from test_prompt_boards_trash import local_server, BASE, sync_playwright, FAKE_SB_JS, BOOT_JS, DAY

SEED = """
() => new Promise((resolve, reject) => {
  const req = indexedDB.open('ogeBoardsDB', 1);
  req.onupgradeneeded = () => req.result.createObjectStore('state');
  req.onsuccess = () => {
    const tx = req.result.transaction('state', 'readwrite');
    const st = tx.objectStore('state');
    const now = Date.now();
    const lite = (id, name, extra) => Object.assign({ id, name, folderId: null, createdAt: 1000, updatedAt: 1000,
      lastOpenedAt: null, rev: 1, cellSize: 24, sheetCols: 76, sheetRows: 54, pageOrder: 'h',
      recentColors: [], colorUsage: {}, view: { x: 0, y: 0, zoom: 1 } }, extra || {});
    const boards = [
      lite('b1', 'Обычная доска', { lastOpenedAt: now - 1000 }),
      lite('b2', 'Доска в папке', { folderId: 'fA' }),
      lite('p1', 'Моя презентация', { kind: 'deck', lastOpenedAt: now - 2000 }),
      lite('p2', 'Презентация в папке', { kind: 'deck', folderId: 'fA' }),
      lite('pt', 'Презентация в корзине', { kind: 'deck', trashedAt: now - DAYMS }),
      lite('bt', 'Доска в корзине', { trashedAt: now - DAYMS }),
    ];
    st.put({ __v: 2, folders: [{ id: 'fA', name: 'Архив', createdAt: 1000 }], boards, deleted: [], sortMode: 'my' }, 'db');
    boards.forEach(b => st.put({ objects: [], imageLib: [] }, 'boarddata:' + b.id));
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  };
  req.onerror = () => reject(req.error);
})
""".replace('DAYMS', str(DAY))


def run():
    failures = []

    def check(name, cond):
        print(f"[{'OK' if cond else 'FAIL'}] {name}")
        if not cond:
            failures.append(name)

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1280, "height": 860})
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))

        def boot(pg, hash_=""):
            pg.goto("about:blank")   # иначе смена одного адреса #… — не перезагрузка
            pg.goto(f"{BASE}/boards.html{hash_}")
            pg.wait_for_timeout(500)
            pg.evaluate(FAKE_SB_JS)
            pg.evaluate(BOOT_JS)
            pg.wait_for_function("window.getDB && window.getDB().boards.length >= 4")
            pg.wait_for_timeout(500)

        page.goto(f"{BASE}/boards.html")
        page.evaluate(SEED)
        boot(page)

        ids = lambda pg: pg.evaluate("() => [...document.querySelectorAll('#blGrid .bl-card[data-board]')].map(c => c.dataset.board).sort()")
        folders = lambda pg: pg.evaluate("() => [...document.querySelectorAll('#blGrid .bl-card.folder')].map(c => c.dataset.folder)")
        cnt = lambda pg, nav: pg.inner_text(f'.bl-nav-item[data-nav="{nav}"] .cnt')
        nav = lambda pg, v: (pg.click(f'.bl-nav-item[data-nav="{v}"]'), pg.wait_for_timeout(150))
        kind = lambda pg, k: (pg.click(f'#blKindSwitch [data-kind="{k}"]'), pg.wait_for_timeout(200))
        vis = lambda pg, sel: pg.evaluate("(s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none'; }", sel)

        # ── 1. по умолчанию — доски ──
        check("переключатель на месте, три вкладки", page.evaluate("() => document.querySelectorAll('#blKindSwitch [data-kind]').length") == 3)
        check("открыт вид «Основные доски»", page.evaluate("() => document.querySelector('#blKindSwitch .active').dataset.kind") == "boards")
        check("у вкладки «Презентации» подпись «Бета»", "бета" in page.inner_text('#blKindSwitch [data-kind="decks"]').lower())
        check("в корне только доски (без презентаций)", ids(page) == ["b1"])
        check("счётчик «Все доски» = 2 (без презентаций)", cnt(page, "__root") == "2")
        check("слева нет пункта «Презентации»", page.evaluate("() => !document.querySelector('.bl-nav-item[data-nav=\"__decks\"]')"))
        nav(page, "__recent")
        check("«Недавние»: только доска", ids(page) == ["b1"])
        nav(page, "fA")
        check("папка: только доска", ids(page) == ["b2"])
        check("счётчик папки = 1", cnt(page, "fA") == "1")
        nav(page, "__trash")
        check("корзина: только доска", ids(page) == ["bt"])
        check("счётчик корзины = 1", cnt(page, "__trash") == "1")
        nav(page, "__root")
        page.fill("#blSearch", "презентац")
        page.wait_for_timeout(250)
        check("поиск «презентац» презентацию не находит", ids(page) == [])
        page.fill("#blSearch", "")
        page.wait_for_timeout(250)
        check("обе кнопки создания видны, у презентации «Бета»",
              vis(page, "#blCreateDeck") and vis(page, "#blCreateBoard") and "бета" in page.inner_text("#blCreateDeck").lower())

        # ── 2. «Презентации» ──
        kind(page, "decks")
        check("вид «Презентации»: все презентации плоским списком", ids(page) == ["p1", "p2"])
        check("…папок в этом виде нет", folders(page) == [])
        check("адрес #decks", page.evaluate("() => location.hash") == "#decks")
        check("обе кнопки создания видны и в виде «Презентации»", vis(page, "#blCreateBoard") and vis(page, "#blCreateDeck"))
        check("в заголовке «Бета»", "бета" in page.inner_text("#blTitle").lower())
        check("карточка помечена «бета»", "бета" in page.inner_text('#blGrid .bl-card[data-board="p1"] .bl-card-meta'))
        check("счётчик «Все доски» считает презентации = 2", cnt(page, "__root") == "2")
        nav(page, "__trash")
        check("корзина презентаций: только презентация", ids(page) == ["pt"])
        nav(page, "__recent")
        check("«Недавние» в этом виде: только презентация", ids(page) == ["p1"])
        nav(page, "fA")
        check("папка в этом виде: только презентация", ids(page) == ["p2"])
        nav(page, "__root")

        # ── 3. «Все доски и презентации» ──
        kind(page, "all")
        check("вид «Все»: доски и презентации вместе", ids(page) == ["b1", "p1"])
        check("…и папка на месте", folders(page) == ["fA"])
        check("адрес без #decks", page.evaluate("() => location.hash") == "")
        nav(page, "fA")
        check("папка в виде «Все»: обе", ids(page) == ["b2", "p2"])
        nav(page, "__root")

        # ── 4. перезагрузка ──
        boot(page)
        check("после перезагрузки снова «Основные доски»", ids(page) == ["b1"])
        boot(page, "#decks")
        check("с адресом #decks открываются презентации", ids(page) == ["p1", "p2"])
        boot(page)

        # ── 4б. создать презентацию из «Основных досок», выйти — она в «Презентациях» ──
        check("в «Основных досках» открыта вкладка досок", page.evaluate("() => document.querySelector('#blKindSwitch .active').dataset.kind") == "boards")
        page.click("#blCreateDeck")
        page.wait_for_function("() => boardActive && getCurrentBoard().kind === 'deck'", timeout=8000)
        page.evaluate("() => backToList()")
        page.wait_for_timeout(400)
        check("после выхода из новой презентации открыт вид «Презентации»",
              page.evaluate("() => document.querySelector('#blKindSwitch .active').dataset.kind") == "decks" and page.evaluate("() => location.hash") == "#decks")
        check("…и она в списке", len(ids(page)) == 3)
        boot(page)

        # доска, созданная в виде «Презентации», после выхода — в «Основных досках»
        kind(page, "decks")
        page.click("#blCreateBoard")
        page.wait_for_function("() => boardActive && getCurrentBoard().kind !== 'deck'", timeout=8000)
        page.evaluate("() => backToList()")
        page.wait_for_timeout(400)
        check("после выхода из новой доски открыт вид «Основные доски»",
              page.evaluate("() => document.querySelector('#blKindSwitch .active').dataset.kind") == "boards")
        boot(page)

        # ── 5. удаление папки в виде «Основные доски» ──
        page.once("dialog", lambda d: d.accept())
        page.click('#blGrid .bl-card.folder[data-folder="fA"] .bl-card-menu')
        page.click('.bl-menu-pop button[data-act="delete"]')
        page.wait_for_timeout(300)
        tr = page.evaluate("() => window.getDB().boards.filter(b => b.trashedAt).map(b => b.id).sort()")
        check("папка удалена: в корзину ушли и доска, и презентация внутри", "b2" in tr and "p2" in tr)
        kind(page, "decks")
        nav(page, "__trash")
        check("презентация из удалённой папки — в корзине презентаций", "p2" in ids(page))

        # ── 6. удалённое не возвращается ──
        page.goto(f"{BASE}/boards.html")
        page.evaluate(SEED)
        boot(page)
        p2 = ctx.new_page()
        boot(p2)
        page.evaluate("() => { window.trashBoards(['b1']); window.saveDB(); }")
        page.wait_for_timeout(400)
        p2.evaluate("() => { window.getDB().folders.push({ id: 'fz', name: 'z', createdAt: 1 }); window.saveDB(); }")
        p2.wait_for_timeout(700)
        boot(page)
        check("доска в корзине вкладки 1 не возвращается сохранением из вкладки 2",
              page.evaluate("() => !!window.getDB().boards.find(b => b.id === 'b1').trashedAt"))
        page.evaluate("() => { window.purgeBoards(['b1']); window.saveDB(); }")
        page.wait_for_timeout(400)
        p2.evaluate("() => window.saveDB()")
        p2.wait_for_timeout(700)
        boot(page)
        check("стёртая насовсем не возвращается", page.evaluate("() => !window.getDB().boards.some(b => b.id === 'b1')"))
        n0 = page.evaluate("() => window.getDB().deleted.length")
        for _ in range(6):
            page.evaluate("() => window.saveDB()")
            p2.evaluate("() => window.saveDB()")
            page.wait_for_timeout(150)
        n1 = page.evaluate("() => window.getDB().deleted.length")
        check(f"список удалённых не раздувается ({n0} → {n1})", n1 == n0 and n1 <= 3)

        check("ошибок JavaScript нет", not errors)
        if errors:
            print(errors[:3])
        browser.close()

    print()
    print("ИТОГ:", "всё прошло" if not failures else f"провалов: {len(failures)}")
    for f in failures:
        print(" -", f)
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    run()
