"""
Удалённые доски снова появлялись в списке («„воскрешение досок“»).

Сервера в проверке нет: window.SB подменён заглушкой, как в
test_prompt_boards_trash.py. Заглушка умеет и сбоить: window.__rpcFail —
имена функций, которые отвечают ошибкой PGRST202 (так отвечает Supabase,
когда boards-trash-schema.sql не запущен), window.__selectFail — запрос
boards с trashed_at отвечает 42703 (колонки нет).

Проверяем:
  A. Гонка: импорт с сервера закончился раньше, чем список досок дочитан из
     IndexedDB. Раньше импорт видел пустой стартовый список — без карточек и
     следов удаления — и заводил удалённые доски заново (дубли). Теперь ждёт
     boardsBootReady. Заодно: след «cloud» без подтверждения сервера не
     истекает через 90 дней, подтверждённый — истекает; вход досылает
     стирание только неподтверждённых.
  B. Уже воскресшие карточки-заглушки (живые, ни разу не открытые) чинятся
     при импорте: у стёртой насовсем, у положенной в корзину, у открытой
     доски и лишние дубли — уходят, по одной карточке на облачную доску.
  C. Сбой сервера виден: плашка над списком и console.error с текстом
     ошибки; флаги «не дошло» остаются, след — неподтверждённым; когда
     сервер ожил, вход досылает и плашка уходит.
  D. Раздел «С сервера»: мои облачные доски, ни разу не открытые здесь
     (так видны удалённые до корзины), метка на карточке, «Удалить
     навсегда» только после подтверждения.
"""
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8974
BASE = f"http://127.0.0.1:{PORT}"
DAY = 24 * 3600 * 1000


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


FAKE_SB_JS = """
(rows) => {
  window.__rpcLog = [];
  window.__rows = rows || [];
  window.__rpcFail = window.__rpcFail || [];
  window.__selectFail = window.__selectFail || false;
  const ok = (data) => Promise.resolve({ data, error: null });
  window.SB = {
    rpc: (name, args) => {
      window.__rpcLog.push([name, JSON.parse(JSON.stringify(args || {}))]);
      if ((window.__rpcFailIds || []).some(id => ((args || {}).p_boards || []).includes(id)))
        return Promise.resolve({ data: null, error: { code: '57014', message: 'canceling statement due to statement timeout' } });
      if (window.__rpcFail.includes(name))
        return Promise.resolve({ data: null, error: { code: 'PGRST202', message: 'Could not find the function public.' + name + ' in the schema cache' } });
      return ok(1);
    },
    from: (t) => ({
      select: (cols) => {
        const p = (t === 'boards' && window.__selectFail && /trashed_at/.test(cols || ''))
          ? Promise.resolve({ data: null, error: { code: '42703', message: 'column boards.trashed_at does not exist' } })
          : ok(t === 'boards' ? window.__rows.map(r => Object.assign({}, r)) : []);
        p.eq = () => ok([]);
        return p;
      },
    }),
  };
  window.CURRENT_USER = { id: 'me', email: 'me@example.com' };
}
"""

BOOT_JS = """
() => {
  const gate = document.getElementById('authGate');
  if (gate) gate.style.display = 'none';
  document.getElementById('screenList').style.display = '';
  if (window.boardsAppBoot) window.boardsAppBoot();
}
"""

# boards — [id, name, extra], deleted — следы удаления
SEED_JS = """
({ boards, deleted }) => new Promise((resolve, reject) => {
  const req = indexedDB.open('ogeBoardsDB', 1);
  req.onupgradeneeded = () => req.result.createObjectStore('state');
  req.onsuccess = () => {
    const tx = req.result.transaction('state', 'readwrite');
    const st = tx.objectStore('state');
    st.clear();
    const list = boards.map(([id, name, extra]) => Object.assign({ id, name, folderId: null, createdAt: 1000, updatedAt: 1000,
      lastOpenedAt: null, rev: 1, cellSize: 24, sheetCols: 76, sheetRows: 54, pageOrder: 'h',
      recentColors: [], colorUsage: {}, view: { x: 0, y: 0, zoom: 1 } }, extra || {}));
    st.put({ __v: 2, folders: [], boards: list, deleted, sortMode: 'my' }, 'db');
    list.forEach(b => st.put({ objects: [], imageLib: [] }, 'boarddata:' + b.id));
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  };
  req.onerror = () => reject(req.error);
})
"""

READ_STORED_JS = """
() => new Promise((resolve, reject) => {
  const req = indexedDB.open('ogeBoardsDB');
  req.onsuccess = () => {
    const g = req.result.transaction('state', 'readonly').objectStore('state').get('db');
    g.onsuccess = () => resolve(g.result || null);
    g.onerror = () => reject(g.error);
  };
  req.onerror = () => reject(req.error);
})
"""


def row(cid, owner="me", trashed=None):
    return {"id": cid, "title": "Доска " + cid, "owner": owner,
            "created_at": "2026-01-01T00:00:00Z", "trashed_at": trashed}


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
        errors, console_errors = [], []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
        dialogs = []
        dialog_answer = {"accept": True}

        def on_dialog(d):
            dialogs.append(d.message)
            d.accept() if dialog_answer["accept"] else d.dismiss()
        page.on("dialog", on_dialog)

        cards_of = lambda cid: page.evaluate(
            "(c) => window.getDB().boards.filter(b => b.cloudBoardId === c).map(b => ({ id: b.id, trashedAt: b.trashedAt || 0 }))", cid)
        live_of = lambda cid: [c for c in cards_of(cid) if not c["trashedAt"]]
        trace = lambda cid: page.evaluate(
            "(c) => (window.getDB().deleted || []).find(d => d.kind === 'cloud' && d.id === c) || null", cid)
        rpc = lambda: page.evaluate("() => window.__rpcLog")
        clear_rpc = lambda: page.evaluate("() => { window.__rpcLog.length = 0; }")

        def fresh(seed, rows, before_boot=None):
            page.goto(f"{BASE}/boards.html")
            page.evaluate(SEED_JS, seed)
            page.reload()
            page.wait_for_timeout(500)       # пусть настоящий вход отработает до подмены
            page.evaluate(FAKE_SB_JS, rows)
            if before_boot:
                before_boot()
            page.evaluate(BOOT_JS)
            page.wait_for_function("window.getDB && window.getDB().boards.length > 0")
            page.wait_for_timeout(500)

        # ── A. гонка импорта с загрузкой списка ──
        now = int(time.time() * 1000)
        seed_a = {
            "boards": [
                ["keep", "Открытая облачная", {"cloudBoardId": "cb_keep", "cloudRole": "owner", "lastOpenedAt": now - DAY}],
                ["tr", "В корзине", {"cloudBoardId": "cb_tr", "cloudRole": "owner", "trashedAt": now - DAY, "trashSource": "", "cloudTrashPending": True}],
            ],
            "deleted": [
                {"kind": "cloud", "id": "cb_gone", "at": now - 100 * DAY},                    # старый след, без подтверждения
                {"kind": "cloud", "id": "cb_conf", "at": now - 100 * DAY, "pending": False},  # подтверждён давно
            ],
        }
        # SQL не запущен: строки «в корзине» и «стёртой» на сервере без trashed_at
        rows_a = [row("cb_keep"), row("cb_tr"), row("cb_gone"), row("cb_new")]

        def import_before_boot():
            # импорт стартует раньше загрузки списка (как в onAuthStateChange:
            # boardsAppBoot и cloudImportSharedBoards зовутся подряд), и его
            # запись успевает уйти раньше, чем список дочитан
            page.evaluate("() => { window.cloudImportSharedBoards(); }")
            page.wait_for_timeout(700)
        fresh(seed_a, rows_a, import_before_boot)
        page.wait_for_timeout(800)
        check("A: доска из корзины не воскресла живой карточкой", live_of("cb_tr") == [] and len(cards_of("cb_tr")) == 1)
        check("A: стёртая насовсем не заведена заново", cards_of("cb_gone") == [])
        check("A: у открытой доски одна карточка", len(cards_of("cb_keep")) == 1)
        check("A: новая доска с сервера заведена один раз", len(cards_of("cb_new")) == 1)
        stored = page.evaluate(READ_STORED_JS)
        stored_new = [b for b in stored["boards"] if b.get("cloudBoardId") == "cb_new"]
        stored_tr = [b for b in stored["boards"] if b.get("cloudBoardId") == "cb_tr" and not b.get("trashedAt")]
        check("A: и в хранилище нет дублей и живой копии удалённой", len(stored_new) == 1 and stored_tr == [])
        check("A: след без подтверждения сервера не истёк за 100 дней", trace("cb_gone") is not None)
        check("A: вход дослал стирание неподтверждённого, подтверждённое не трогал",
              any(n == "boards_delete_now" and a["p_boards"] == ["cb_gone"] for n, a in rpc()))
        check("A: после ответа сервера след подтверждён", (trace("cb_gone") or {}).get("pending") is False)
        check("A: вход дослал boards_trash для «не дошло»",
              any(n == "boards_trash" and "cb_tr" in a["p_boards"] for n, a in rpc()))
        page.evaluate("() => window.saveDB()")
        page.wait_for_timeout(500)
        check("A: давно подтверждённый след забыт (90 дней)", trace("cb_conf") is None)
        # строка «стёртой» всё ещё приходит — старый след продлевается
        page.evaluate(f"() => {{ window.getDB().deleted.find(d => d.id === 'cb_gone').at = Date.now() - 80 * {DAY}; }}")
        page.evaluate("() => window.cloudImportSharedBoards()")
        page.wait_for_timeout(400)
        check("A: пока строка видна на сервере, след продлевается",
              (trace("cb_gone") or {}).get("at", 0) > now - DAY)

        # ── D. раздел «С сервера» (на том же состоянии) ──
        nav = '.bl-nav-item[data-nav="__fromServer"]'
        check("D: в левой колонке «С сервера» с числом 1",
              page.is_visible(nav) and page.inner_text(nav + " .cnt") == "1")
        new_id = cards_of("cb_new")[0]["id"]
        new_card = f'#blGrid .bl-card[data-board="{new_id}"]'
        check("D: на карточке метка «с сервера, здесь не открывалась»",
              "здесь не открывалась" in page.inner_text(new_card))
        check("D: у открытой доски метки нет",
              "здесь не открывалась" not in page.inner_text('#blGrid .bl-card[data-board="keep"]'))
        page.click(nav)
        page.wait_for_selector(new_card)
        shown = page.evaluate("() => [...document.querySelectorAll('#blGrid .bl-card[data-board]')].map(c => c.dataset.board)")
        check("D: в разделе только неоткрытая моя облачная", shown == [new_id])
        page.click(new_card + " .bl-card-name", modifiers=["Meta"])
        check("D: на панели есть «Удалить навсегда»", page.is_visible("#blSelPurge"))
        clear_rpc()
        dialogs.clear()
        dialog_answer["accept"] = False
        page.click("#blSelPurge")
        page.wait_for_timeout(300)
        check("D: без подтверждения ничего не стёрто",
              len(dialogs) == 1 and "на сервере" in dialogs[0] and len(cards_of("cb_new")) == 1 and rpc() == [])
        dialog_answer["accept"] = True
        page.click("#blSelPurge")
        page.wait_for_timeout(400)
        check("D: после подтверждения — стёрта и на сервер ушёл boards_delete_now",
              cards_of("cb_new") == [] and rpc() == [["boards_delete_now", {"p_boards": ["cb_new"]}]])
        check("D: раздел опустел, пункт «С сервера» исчезнет при уходе",
              "Таких досок больше нет" in page.inner_text("#blGrid"))
        page.click('.bl-nav-item[data-nav="__root"]')
        check("D: пункта «С сервера» больше нет", not page.is_visible(nav))

        # ── B. уже воскресшие заглушки чинятся ──
        seed_b = {
            "boards": [
                ["orig", "Удалил человек", {"cloudBoardId": "cb_T", "cloudRole": "owner", "trashedAt": now - DAY, "trashSource": ""}],
                ["stubT", "Воскресла", {"cloudBoardId": "cb_T", "cloudRole": "owner"}],
                ["stubG", "Стёрта насовсем", {"cloudBoardId": "cb_G", "cloudRole": "owner"}],
                ["s1", "Дубль 1", {"cloudBoardId": "cb_S", "cloudRole": "editor"}],
                ["s2", "Дубль 2", {"cloudBoardId": "cb_S", "cloudRole": "editor"}],
                ["op", "Открытая", {"cloudBoardId": "cb_O", "cloudRole": "owner", "lastOpenedAt": now - DAY}],
                ["stubO", "Заглушка открытой", {"cloudBoardId": "cb_O", "cloudRole": "owner"}],
            ],
            "deleted": [{"kind": "cloud", "id": "cb_G", "at": now - DAY, "pending": True}],
        }
        fresh(seed_b, [row("cb_T"), row("cb_G"), row("cb_S", owner="x"), row("cb_O")])
        page.evaluate("() => window.cloudImportSharedBoards()")
        page.wait_for_timeout(500)
        ids = lambda: sorted(page.evaluate("() => window.getDB().boards.map(b => b.id)"))
        check("B: остались orig, s1, op — заглушки убраны", ids() == ["op", "orig", "s1"])
        check("B: удалённая человеком осталась в корзине", (cards_of("cb_T") or [{}])[0].get("trashedAt", 0) > 0)
        page.evaluate("() => window.cloudImportSharedBoards()")
        page.wait_for_timeout(400)
        check("B: повторный импорт ничего не добавляет", ids() == ["op", "orig", "s1"])

        # ── C. сбой сервера виден ──
        console_errors.clear()
        seed_c = {"boards": [["mine", "Моя облачная", {"cloudBoardId": "cb_M", "cloudRole": "owner", "lastOpenedAt": now - DAY}]],
                  "deleted": []}

        def fail_server():
            page.evaluate("() => { window.__rpcFail = ['boards_trash', 'boards_restore', 'boards_delete_now', 'boards_purge_trash']; window.__selectFail = true; }")
        fresh(seed_c, [row("cb_M")], fail_server)
        page.evaluate("() => window.cloudImportSharedBoards()")
        page.wait_for_timeout(400)
        check("C: плашка над списком видна", page.is_visible("#blCloudWarn"))
        check("C: в плашке — про boards-trash-schema.sql", "boards-trash-schema.sql" in page.inner_text("#blCloudWarn"))
        check("C: в консоли ошибка запроса с trashed_at",
              any("select trashed_at" in t and "42703" in t for t in console_errors))
        console_errors.clear()
        page.click('#blGrid .bl-card[data-board="mine"] .bl-card-menu')
        page.click('.bl-menu-pop button[data-act="delete"]')
        page.wait_for_timeout(400)
        check("C: в консоли ошибка boards_trash с текстом",
              any("boards_trash" in t and "PGRST202" in t and "Could not find the function" in t for t in console_errors))
        check("C: флаг «не дошло» остался", page.evaluate("() => window.getDB().boards.find(b => b.id === 'mine').cloudTrashPending === true"))
        check("C: в подробностях плашки — boards_trash", "boards_trash" in page.inner_text("#blCloudWarn"))
        page.click('.bl-nav-item[data-nav="__trash"]')
        page.wait_for_selector('#blGrid .bl-card[data-board="mine"]')
        page.click('#blGrid .bl-card[data-board="mine"]')
        dialog_answer["accept"] = True
        page.click("#blSelPurge")
        page.wait_for_timeout(400)
        check("C: стирание не прошло — след остался неподтверждённым", (trace("cb_M") or {}).get("pending") is True)
        page.evaluate("() => { window.__rpcFail = []; window.__selectFail = false; }")
        clear_rpc()
        page.evaluate("() => window.cloudTrashReconcile()")
        page.evaluate("() => window.cloudImportSharedBoards()")
        page.wait_for_timeout(500)
        check("C: сервер ожил — вход дослал стирание", ["boards_delete_now", {"p_boards": ["cb_M"]}] in rpc())
        check("C: след подтверждён", (trace("cb_M") or {}).get("pending") is False)
        check("C: доска не вернулась", cards_of("cb_M") == [])
        check("C: плашка ушла", not page.is_visible("#blCloudWarn"))

        # стирание — по одной доске за вызов: тайм-аут одной (57014) не валит
        # остальные, прошедшие подтверждаются
        page.evaluate("""() => { window.noteDeleted('cloud', 'cb_x', { pending: true });
                                  window.noteDeleted('cloud', 'cb_y', { pending: true });
                                  window.__rpcFailIds = ['cb_x']; }""")
        clear_rpc()
        console_errors.clear()
        page.evaluate("() => window.cloudTrashReconcile()")
        page.wait_for_timeout(400)
        dels = [a["p_boards"] for n, a in rpc() if n == "boards_delete_now"]
        check("C: boards_delete_now — по одной доске за вызов", sorted(dels) == [["cb_x"], ["cb_y"]])
        check("C: прошедшая подтверждена, упавшая ждёт повтора",
              (trace("cb_y") or {}).get("pending") is False and (trace("cb_x") or {}).get("pending") is True)
        check("C: тайм-аут виден в плашке и консоли",
              page.is_visible("#blCloudWarn") and "57014" in page.inner_text("#blCloudWarn")
              and any("57014" in t for t in console_errors))

        check("ошибок JavaScript нет", not errors)
        if errors:
            print("\n".join(errors))
        browser.close()

    print()
    print("ИТОГ: всё прошло" if not failures else f"ИТОГ: провалено {len(failures)}")
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(run())
