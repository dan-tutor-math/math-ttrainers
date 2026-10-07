"""
Общая доска: записи ученика у учителя съезжали с рисунка.

Живой случай: ученик обводит штрихами рисунок на картинке (страница
задачника на всю доску) — у него всё точно по линиям, а у учителя те же
штрихи на несколько пикселей выше рисунка.

Причина: картинка у учителя и у ученика была РАЗНОГО размера. Размер
картинки меняют колесом (на тачпаде Mac — обычной прокруткой двумя
пальцами над выделенной картинкой). Колесо звало pushUndo один раз на
серию прокруток (флаг держится полсекунды), а облачный модуль закрывает
снимок «как было» через 250 мс после сохранения. Прокрутка с паузой
250–500 мс (инерция тачпада) — и остаток серии менял картинку только на
экране учителя: собеседнику не уходил, в базу не писался, номер версии не
рос. При следующем входе загрузка видела ту же версию и верила, что
содержимое то же, — расхождение жило вечно.

Проверяем:
  1. Прокрутка колесом с паузами на общей доске: в базе и в рассылке —
     ровно тот размер и место, что на экране.
  2. Разошедшаяся копия (та же версия, другой размер) при входе на доску
     заменяется копией из базы — той, что видят остальные.
  3. Сверка содержимого не путается в порядке ключей (jsonb) и в
     undefined, а разный src различает.
  4. На своей (необщей) доске серия прокруток — по-прежнему один шаг отмены.

Живой realtime из песочницы недоступен — заглушка supabase-js из
test_prompt53_cloud_stale_versions.py. Совместный режим перепроверяется на
сайте руками.
"""
import sys

from playwright.sync_api import sync_playwright

from test_prompt53_cloud_stale_versions import BASE, FAKE_LIB, PNG, local_server
# у заглушки №10 есть постраничная выдача и подсчёт строк — без них загрузка
# доски при входе (а её и проверяем в п. 2) не считает ответ базы полным
import test_prompt10_shared_board_load as t10


def img(obj_id, w, rv, x=200, y=200, by="T"):
    return {"id": obj_id, "type": "image", "src": PNG, "points": [{"x": x, "y": y}],
            "w": w, "h": w, "natW": 1, "natH": 1, "rv": rv, "rvBy": by, "by": by}


def open_board(browser, uid, local_objects, server_objects=None, cloud=True):
    page = browser.new_context(viewport={"width": 1200, "height": 800}).new_page()
    page.route("**/supabase-js.umd.js", lambda route: route.fulfill(
        status=200, content_type="application/javascript", body=FAKE_LIB))
    page.goto(f"{BASE}/boards.html")
    page.evaluate(
        """([objects, cloud]) => new Promise((resolve, reject) => {
            const req = indexedDB.open('ogeBoardsDB', 1);
            req.onupgradeneeded = () => req.result.createObjectStore('state');
            req.onsuccess = () => {
              const tx = req.result.transaction('state', 'readwrite');
              const st = tx.objectStore('state');
              const b = { id: 'bShared', name: 'Общая', folderId: null, createdAt: 1000, updatedAt: 1000,
                lastOpenedAt: null, rev: 1, cellSize: 24, sheetCols: 76, sheetRows: 54, pageOrder: 'h',
                recentColors: [], colorUsage: {}, view: { x: 0, y: 0, zoom: 1 } };
              if (cloud){ b.cloudBoardId = 'cb1'; b.cloudRole = 'owner'; }
              st.put({ __v: 2, folders: [], deleted: [], sortMode: 'my', boards: [b] }, 'db');
              st.put({ objects, imageLib: [] }, 'boarddata:bShared');
              tx.oncomplete = () => resolve(true);
              tx.onerror = () => reject(tx.error);
            };
            req.onerror = () => reject(req.error);
        })""", [local_objects, cloud])
    page.reload()
    page.evaluate("""([uid, objects]) => {
        window.CURRENT_USER = { id: uid, email: uid + '@test' };
        objects.forEach(o => window.__fake.rows.set(o.id, JSON.parse(JSON.stringify(o))));
        const gate = document.getElementById('authGate');
        if (gate) gate.style.display = 'none';
        window.boardsAppBoot();
    }""", [uid, local_objects if server_objects is None else server_objects])
    page.wait_for_function("window.getDB && window.getDB().boards.length >= 1")
    page.evaluate("() => window.openBoard('bShared')")
    if cloud:
        page.wait_for_function("""() => { const b = window.getCurrentBoard();
            return b && b.id === 'bShared' && Array.isArray(b.objects) && window.__fake.handlers.length > 0; }""")
    else:
        page.wait_for_function("""() => { const b = window.getCurrentBoard();
            return b && b.id === 'bShared' && Array.isArray(b.objects); }""")
    page.wait_for_timeout(300)
    return page


LOCAL = """(id) => { const o = window.getCurrentBoard().objects.find(x => x.id === id);
                     return o ? { w: o.w, h: o.h, x: o.points[0].x, y: o.points[0].y } : null; }"""
DB = """(id) => { const o = window.__fake.rows.get(id);
                  return o ? { w: o.w, h: o.h, x: o.points[0].x, y: o.points[0].y } : null; }"""


def wheel_bursts(page, bursts, pause):
    """Серии прокруток над выделенной картинкой с паузой между сериями."""
    page.evaluate("() => { selectedId = 'img1'; multiSelectIds = []; scheduleRedraw(); }")
    page.mouse.move(300, 300)
    for _ in range(bursts):
        for _ in range(5):
            page.mouse.wheel(0, -40)
            page.wait_for_timeout(16)
        page.wait_for_timeout(pause)


def run():
    failures = []

    def check(name, cond, extra=""):
        print(f"[{'OK' if cond else 'FAIL'}] {name}" + (f" — {extra}" if extra and not cond else ""))
        if not cond:
            failures.append(name)

    def close(a, b):
        return a and b and all(abs(a[k] - b[k]) < 1e-6 for k in ("w", "h", "x", "y"))

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()

        # ── 1. прокрутка с паузами на общей доске ──
        tp = open_board(browser, "T", [img("img1", 300, 1)])
        wheel_bursts(tp, 3, 350)          # пауза дольше 250 мс, короче 500 мс
        tp.wait_for_timeout(600)
        tp.evaluate("() => window.__cloudDiffTest.writesIdle()")
        loc, db = tp.evaluate(LOCAL, "img1"), tp.evaluate(DB, "img1")
        check("1. картинка правда изменилась", loc and loc["w"] > 400, str(loc))
        check("1. в базе тот же размер и место, что на экране", close(loc, db), f"{loc} / {db}")
        sent = tp.evaluate("""() => { const d = window.__fake.diffsSent();
            const last = d.filter(x => x.updated.some(u => u.id === 'img1')).pop();
            if (!last) return null;
            const a = last.updated.find(u => u.id === 'img1').after;
            return a.__heavy ? 'heavy' : { w: a.w, h: a.h, x: a.points[0].x, y: a.points[0].y }; }""")
        check("1. последняя рассылка несёт итоговый размер", sent == "heavy" or close(loc, sent), str(sent))
        rv_local = tp.evaluate("() => window.getCurrentBoard().objects.find(o => o.id === 'img1').rv")
        rv_db = tp.evaluate("() => window.__fake.rows.get('img1').rv")
        check("1. версия у себя и в базе одна", rv_local == rv_db, f"{rv_local} / {rv_db}")

        # одна непрерывная серия — по-прежнему одна правка
        before = len(tp.evaluate("() => window.__fake.diffsSent()"))
        wheel_bursts(tp, 1, 0)
        tp.wait_for_timeout(600)
        after = len(tp.evaluate("() => window.__fake.diffsSent()"))
        check("1. непрерывная серия прокруток — одна рассылка", after - before == 1, f"{after - before}")

        # ── 3. сверка содержимого ──
        res = tp.evaluate("""() => {
            const same = window.__cloudDiffTest.sameContent;
            const a = { id: 'a', type: 'image', src: 'S', points: [{ x: 1, y: 2 }], w: 3, h: 4, locked: undefined };
            const b = { h: 4, w: 3, points: [{ y: 2, x: 1 }], src: 'S', type: 'image', id: 'a' };
            const c = Object.assign({}, b, { src: 'T' });
            const d = Object.assign({}, b, { points: [{ x: 1, y: 2.5 }] });
            return [same(a, b), same(a, c), same(a, d)];
        }""")
        check("3. другой порядок ключей и undefined — одно и то же", res[0] is True)
        check("3. другой src — разное", res[1] is False)
        check("3. другая точка — разное", res[2] is False)

        # ── 4. своя доска: серия прокруток — один шаг отмены ──
        lp = open_board(browser, "T", [img("img1", 300, 1)], cloud=False)
        n0 = lp.evaluate("() => undoStack.length")
        lp.evaluate("() => { selectedId = 'img1'; multiSelectIds = []; scheduleRedraw(); }")
        lp.mouse.move(300, 300)
        for _ in range(3):
            for _ in range(5):
                lp.mouse.wheel(0, -40)
                lp.wait_for_timeout(16)
            lp.wait_for_timeout(300)
        n1 = lp.evaluate("() => undoStack.length")
        check("4. своя доска: серия прокруток с паузами — один шаг отмены", n1 - n0 == 1, f"{n1 - n0}")
        check("4. на своей доске облачный модуль молчит",
              lp.evaluate("() => window.boardsCloudGestureIdle()") is False)

        browser.close()


    # ── 2. разошедшаяся копия лечится при входе ──
    with t10.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1200, "height": 800})
        sp = t10.open_shared(ctx, "T", [img("img1", 500, 2, x=150, y=170)],
                             [img("img1", 300, 2, x=200, y=200)])
        want = {"w": 300, "h": 300, "x": 200, "y": 200}
        got = sp.evaluate(LOCAL, "img1")
        check("2. при входе взята копия из базы (та же версия, другой размер)", close(got, want), str(got))
        sp.evaluate("() => window.__cloudDiffTest.writesIdle()")
        check("2. база не перезаписана разошедшейся копией", close(sp.evaluate(DB, "img1"), want))
        # одинаковая копия той же версии (в базе — другой порядок ключей, как
        # у jsonb) не подменяется: тяжёлые картинки зря не клонируются и доска
        # зря не переписывается на диск
        reordered = ("{ by: 'T', rvBy: 'T', rv: 3, natH: 1, natW: 1, h: 300, w: 300,"
                     " points: [{ y: 200, x: 200 }], src: '" + PNG + "', type: 'image', id: 'img2' }")
        sp2 = t10.open_shared(browser.new_context(), "T", [img("img2", 300, 3)], [img("img2", 300, 3)],
                              setup_js="() => { window.__fake.rows.set('img2', " + reordered + ");"
                                       " window.__quiet = 0; const q = window.boardsPersistQuiet;"
                                       " window.boardsPersistQuiet = (b) => { window.__quiet++; q(b); }; }")
        check("2. одинаковая копия той же версии не подменяется при входе",
              sp2.evaluate("() => window.__quiet") == 0, str(sp2.evaluate("() => window.__quiet")))
        browser.close()

    print()
    if failures:
        print(f"ПРОВАЛЕНО: {len(failures)}")
        sys.exit(1)
    print("Все проверки пройдены")


if __name__ == "__main__":
    run()
