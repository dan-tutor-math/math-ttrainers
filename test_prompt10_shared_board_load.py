"""
Промпт №10 (новый список): на общей доске при входе пропадали все записи.

Живой случай: заходишь на общую доску — в первую секунду всё на месте, через
секунду доска пустая. Так при каждой перезагрузке, и нарисованное поверх
пустой доски после выхода и входа тоже пропадает.

Причина. При открытии общей доски boards-cloud.js забирал объекты из базы
ОДНИМ запросом и целиком ЗАМЕНЯЛ ими то, что уже лежало на доске из
локальной копии. А база (PostgREST у Supabase) отдаёт за один запрос не
больше 1000 строк — настройка «Max rows» по умолчанию. Пока на доске было
меньше тысячи объектов, всё работало; месяцы занятий с одной ученицей
перевалили за тысячу штрихов, и с этого момента при каждом входе доска
показывала только первую тысячу строк базы (старое, где-то далеко), а всё
свежее — задания, решения, новые штрихи — исчезало с экрана. В базе при этом
оно лежало целым.

Живой realtime из песочницы недоступен, поэтому вместо supabase-js — та же
заглушка, что в test_prompt53, но с постраничной выдачей, подсчётом строк и
тем же потолком в 1000 строк на запрос, что у настоящей базы.

Проверяем:
  1. Доска из 1500 объектов открывается целиком, ничего не удаляется
  2. Новый штрих после перезагрузки на месте
  3. База пустая, а на устройстве доска есть — доска не пустеет, содержимое
     возвращается в базу
  4. Удалённое собеседником (в базе было, теперь нет) — убирается; ни разу не
     доехавшее до базы — остаётся и дописывается; у ученицы при первом входе
     чужое старьё не воскрешается
  5. Жест, начатый до конца загрузки, не рассылает «удаление» всего, чего
     нет в ответе базы
  6. Сбой одной из страниц ответа — ничего не удаляется, повтор догружает
  7. Сверка раз в полминуты тоже постраничная, запросы по номерам — кусками
  8. Соседняя вкладка не подменяет общую доску своей копией с диска
  9. Пришедшее из базы записывается на диск без подъёма rev
 10. Версии: снимок при входе, «Вернуть пропавшее», «Откатить», отмена,
     картинки в версиях не дублируются
 11. Второй участник входит, пока первый на доске, — у первого ничего не
     удаляется, второй получает всё
 12. Выход и повторный вход — всё на месте, в базу не ушло ни одного удаления
"""
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8971
BASE = f"http://127.0.0.1:{PORT}"

def make_png(seed, size=24):
    # настоящая картинка с шумом: в пул версий идут только крупные картинки
    import base64, random, struct, zlib
    rnd = random.Random(seed)
    raw = b"".join(b"\x00" + bytes(rnd.randrange(256) for _ in range(size * 3)) for _ in range(size))
    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    png = (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
           + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b""))
    return "data:image/png;base64," + base64.b64encode(png).decode()


PNG = make_png(1)
PNG2 = make_png(2)

# заглушка supabase-js: база в памяти страницы, канал без сети. В отличие от
# test_prompt53 — постраничная выдача (.range/.order), подсчёт строк
# ({count:'exact'}) и потолок строк на запрос, как у настоящей базы
FAKE_LIB = r"""
(function(){
  const F = window.__fake = {
    rows: new Map(),
    maxRows: 1000,
    delays: { upsert: [], delete: [], select: [] },
    selectErrors: [],          // по одному на запрос select: true — сбой
    sent: [], handlers: [], log: [], selects: [], maxIn: 0,
    emit(kind, payload){
      F.handlers.forEach(h => {
        if (kind === 'postgres_changes' && h.type === 'postgres_changes') h.cb(payload);
        else if (h.type === 'broadcast' && h.filter && h.filter.event === kind) h.cb({ payload });
      });
    },
    diffsSent(){ return F.sent.filter(m => m.event === 'board_diff').map(m => m.payload.diff); },
    deletes(){ return F.log.filter(l => l[0] === 'delete'); },
  };
  const wait = (op) => new Promise(r => setTimeout(r, F.delays[op].length ? F.delays[op].shift() : 0));
  const clone = (v) => JSON.parse(JSON.stringify(v));
  function builder(table){
    const q = { table, op: null, sel: '', filters: {}, rows: null, order: null, range: null, count: null, head: false };
    const b = {
      select(s, opts){ if (!q.op) q.op = 'select'; q.sel = s || '*';
        if (opts) { q.count = opts.count || null; q.head = !!opts.head; } return b; },
      upsert(rows){ q.op = 'upsert'; q.rows = clone(rows); return b; },
      insert(rows){ q.op = 'insert'; q.rows = rows; return b; },
      delete(){ q.op = 'delete'; return b; },
      eq(k, v){ q.filters[k] = [v]; return b; },
      in(k, arr){ q.filters[k] = arr.slice(); F.maxIn = Math.max(F.maxIn, arr.length); return b; },
      order(col){ q.order = col; return b; },
      range(a, z){ q.range = [a, z]; return b; },
      single(){ return b; }, maybeSingle(){ return b; },
      then(res, rej){ return run().then(res, rej); },
    };
    async function run(){
      if (table !== 'board_objects') return { data: [], error: null };
      if (q.op === 'upsert'){
        await wait('upsert');
        q.rows.forEach(r => F.rows.set(r.obj_id, r.data));
        F.log.push(['upsert', q.rows.map(r => r.obj_id)]);
        return { data: null, error: null };
      }
      if (q.op === 'delete'){
        await wait('delete');
        (q.filters.obj_id || []).forEach(id => F.rows.delete(id));
        F.log.push(['delete', q.filters.obj_id]);
        return { data: null, error: null };
      }
      await wait('select');
      if (F.selectErrors.length && F.selectErrors.shift()) {
        F.selects.push({ sel: q.sel, range: q.range, error: true });
        return { data: null, error: { message: 'сбой сети (заглушка)' }, count: null };
      }
      let ids = Array.from(F.rows.keys());
      if (q.filters.obj_id) ids = ids.filter(id => q.filters.obj_id.includes(id));
      if (q.order) ids.sort();
      const total = ids.length;
      if (q.range) ids = ids.slice(q.range[0], q.range[1] + 1);
      ids = ids.slice(0, F.maxRows);          // потолок строк, как у PostgREST
      F.selects.push({ sel: q.sel, range: q.range, n: ids.length });
      const data = ids.map(id => {
        const d = clone(F.rows.get(id));
        if (/rv:data->rv/.test(q.sel)) return { obj_id: id, rv: d.rv === undefined ? null : d.rv };
        if (/data/.test(q.sel)) return { obj_id: id, data: d };
        return { obj_id: id };
      });
      return { data: q.head ? null : data, error: null, count: q.count ? total : null };
    }
    return b;
  }
  const auth = new Proxy({
    onAuthStateChange(){ return { data: { subscription: { unsubscribe(){} } } }; },
  }, { get(t, k){ return t[k] || (async () => ({ data: {}, error: null })); } });
  window.supabase = { createClient(){
    return {
      auth, from: builder,
      rpc: async () => ({ data: null, error: null }),
      channel(){
        const ch = {
          on(type, filter, cb){ F.handlers.push({ type, filter, cb }); return ch; },
          subscribe(){ return ch; },
          send(msg){ F.sent.push(clone(msg)); return Promise.resolve('ok'); },
        };
        return ch;
      },
      removeChannel(){ F.handlers = []; },
    };
  } };
})();
"""


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


def pen(i, by="T", rv=1, prefix="p"):
    # номера с ведущими нулями — чтобы порядок строк в базе был предсказуемым
    return {"id": f"{prefix}{i:05d}", "type": "pen", "color": "--pencil", "width": 2,
            "points": [{"x": 10 + i % 300, "y": 10 + i // 300}, {"x": 12 + i % 300, "y": 12 + i // 300}],
            "rv": rv, "rvBy": by, "by": by}


def img(obj_id, src=PNG, by="T"):
    return {"id": obj_id, "type": "image", "src": src, "points": [{"x": 40, "y": 40}],
            "w": 50, "h": 50, "natW": 1, "natH": 1, "rv": 1, "rvBy": by, "by": by}


SEED_IDB = """([objects, role, seen]) => new Promise((resolve, reject) => {
    const req = indexedDB.open('ogeBoardsDB', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('state');
    req.onsuccess = () => {
      const tx = req.result.transaction('state', 'readwrite');
      const st = tx.objectStore('state');
      st.put({ __v: 2, folders: [], deleted: [], sortMode: 'my', boards: [{
        id: 'bShared', name: 'Общая', folderId: null, createdAt: 1000, updatedAt: 1000,
        lastOpenedAt: null, rev: 1, cellSize: 24, sheetCols: 76, sheetRows: 54, pageOrder: 'h',
        recentColors: [], colorUsage: {}, view: { x: 0, y: 0, zoom: 1 },
        cloudBoardId: 'cb1', cloudRole: role }] }, 'db');
      st.put({ objects, imageLib: [] }, 'boarddata:bShared');
      if (seen) st.put({ ids: seen, at: 1 }, 'cloudseen:cb1');
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
})"""

LOADED = "() => window.__cloudDiffTest && window.__cloudDiffTest.loadState && window.__cloudDiffTest.loadState() === 'done'"


def new_page(context):
    page = context.new_page()
    page.route("**/supabase-js.umd.js", lambda route: route.fulfill(
        status=200, content_type="application/javascript", body=FAKE_LIB))
    page.on("dialog", lambda d: d.accept())
    return page


def boot(page, uid, server_objects, setup_js=None):
    page.evaluate("""([uid, objects]) => {
        window.CURRENT_USER = { id: uid, email: uid + '@test' };
        objects.forEach(o => window.__fake.rows.set(o.id, JSON.parse(JSON.stringify(o))));
        const gate = document.getElementById('authGate');
        if (gate) gate.style.display = 'none';
    }""", [uid, server_objects])
    if setup_js:
        page.evaluate(setup_js)
    page.evaluate("() => window.boardsAppBoot()")
    page.wait_for_function("window.getDB && window.getDB().boards.length >= 1")


def open_shared(context, uid, local_objects, server_objects, role="owner", seen=None,
                setup_js=None, wait_loaded=True, seed=True):
    page = new_page(context)
    page.goto(f"{BASE}/boards.html")
    if seed:
        page.evaluate(SEED_IDB, [local_objects, role, seen])
    page.reload()
    boot(page, uid, server_objects, setup_js)
    page.evaluate("() => window.openBoard('bShared')")
    page.wait_for_function("""() => { const b = window.getCurrentBoard();
        return b && b.id === 'bShared' && Array.isArray(b.objects) && window.__fake.handlers.length > 0; }""",
                           timeout=15000)
    if wait_loaded:
        page.wait_for_function(LOADED, timeout=15000)
        page.wait_for_timeout(150)
    return page


def board_ids(page):
    return set(page.evaluate("() => window.getCurrentBoard().objects.map(o => o.id)"))


def server_ids(page):
    return set(page.evaluate("() => Array.from(window.__fake.rows.keys())"))


def server_rows(page):
    return page.evaluate("() => Array.from(window.__fake.rows.values())")


def idb_board(page):
    return page.evaluate("""() => new Promise(res => {
        const r = indexedDB.open('ogeBoardsDB', 1);
        r.onsuccess = () => {
          const st = r.result.transaction('state').objectStore('state');
          const a = st.get('boarddata:bShared'), b = st.get('db');
          a.onsuccess = () => { b.onsuccess = () => res({
            n: (a.result && a.result.objects || []).length,
            rev: b.result.boards.find(x => x.id === 'bShared').rev }); };
        };
    })""")


def idb_keys(page, prefix):
    return page.evaluate("""(prefix) => new Promise(res => {
        const r = indexedDB.open('ogeBoardsDB', 1);
        r.onsuccess = () => {
          const q = r.result.transaction('state').objectStore('state').getAllKeys();
          q.onsuccess = () => res(q.result.filter(k => String(k).startsWith(prefix)));
        };
    })""", prefix)


def idb_get(page, key):
    return page.evaluate("""(key) => new Promise(res => {
        const r = indexedDB.open('ogeBoardsDB', 1);
        r.onsuccess = () => {
          const q = r.result.transaction('state').objectStore('state').get(key);
          q.onsuccess = () => res(q.result);
        };
    })""", key)


# жест так, как его видит облачный модуль: начало (pushUndo), правка,
# сохранение и отпускание пера
BEGIN = "() => window.pushUndo()"
END = "() => { window.saveDB(); window.dispatchEvent(new Event('pointerup')); }"
ADD = "(o) => { window.getCurrentBoard().objects.push(JSON.parse(JSON.stringify(o))); }"
IDLE = "() => window.__cloudDiffTest.writesIdle()"


def run():
    failures = []

    def check(cond, label):
        print(("[OK] " if cond else "[FAIL] ") + label)
        if not cond:
            failures.append(label)

    many = [pen(i) for i in range(1500)]
    all_ids = {o["id"] for o in many}

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()

        # ── 1, 2, 12. Большая доска, новый штрих, выход и вход ─────────────
        ctx = browser.new_context(viewport={"width": 1280, "height": 800})
        page = open_shared(ctx, "T", many, many)
        check(board_ids(page) == all_ids, "1. доска из 1500 объектов открылась целиком")
        check(not page.evaluate("() => window.__fake.deletes().length"), "1. в базу не ушло ни одного удаления")
        check(all(not d.get("removed") for d in page.evaluate("() => window.__fake.diffsSent()")),
              "1. собеседнику не разослано ни одного удаления")
        big_sel = [s for s in page.evaluate("() => window.__fake.selects") if s.get("range")]
        check(len(big_sel) >= 2 and all(s["range"] for s in big_sel),
              "1. объекты забираются постранично")

        page.evaluate(BEGIN)
        page.evaluate(ADD, pen(99999, prefix="new"))
        page.evaluate(END)
        page.evaluate(IDLE)
        check("new99999" in server_ids(page), "2. новый штрих записан в базу")
        rows_after = server_rows(page)
        page.wait_for_timeout(500)
        page.close()

        page = open_shared(ctx, "T", None, rows_after, seed=False)
        check("new99999" in board_ids(page) and len(board_ids(page)) == 1501,
              "2. после перезагрузки новый штрих на месте, всего 1501")
        # 12. выход в список и снова вход
        page.evaluate("() => document.getElementById('bdBack').click()")
        page.wait_for_timeout(400)
        page.evaluate("() => window.openBoard('bShared')")
        page.wait_for_function(LOADED, timeout=15000)
        page.wait_for_timeout(150)
        check(len(board_ids(page)) == 1501, "12. выход и повторный вход — все 1501 на месте")
        check(not page.evaluate("() => window.__fake.deletes().length"), "12. при выходе и входе удалений в базу нет")

        # 8. соседняя вкладка записала на диск доску с большим rev и пустыми штрихами
        page.evaluate("""() => new Promise(res => {
            const r = indexedDB.open('ogeBoardsDB', 1);
            r.onsuccess = () => {
              const tx = r.result.transaction('state', 'readwrite');
              const st = tx.objectStore('state');
              const g = st.get('db');
              g.onsuccess = () => {
                const d = g.result; d.boards.find(b => b.id === 'bShared').rev = 999;
                st.put(d, 'db'); st.put({ objects: [], imageLib: [] }, 'boarddata:bShared');
              };
              tx.oncomplete = () => res(true);
            };
        })""")
        page.evaluate("() => window.refreshFromStore()")
        page.wait_for_timeout(300)
        page.evaluate(BEGIN)
        page.evaluate(ADD, pen(88888, prefix="new"))
        page.evaluate(END)
        page.evaluate(IDLE)
        check(len(board_ids(page)) == 1502, "8. копия соседней вкладки не подменила общую доску")
        check(not page.evaluate("() => window.__fake.deletes().length")
              and all(not d.get("removed") for d in page.evaluate("() => window.__fake.diffsSent()")),
              "8. и не ушла в базу удалением")
        page.close()
        ctx.close()

        # ── 3. База пустая, а на устройстве доска есть ──────────────────────
        ctx = browser.new_context()
        local = [pen(i) for i in range(40)]
        page = open_shared(ctx, "T", local, [], seen=[o["id"] for o in local])
        check(len(board_ids(page)) == 40, "3. пустой ответ базы не опустошил доску")
        page.evaluate(IDLE)
        check(len(server_ids(page)) == 40, "3. содержимое доски вернулось в базу")
        vers = page.evaluate("() => window.__cloudVersions.list()")
        check(len(vers) >= 1 and vers[0]["count"] == 40, "3. перед сверкой снята версия доски")
        page.close()
        ctx.close()

        # ── 4. Удалённое собеседником и не доехавшее до базы ─────────────
        ctx = browser.new_context()
        A, B_, C, D = pen(1, prefix="A"), pen(2, prefix="B"), pen(3, by="S", prefix="C"), pen(4, prefix="D")
        page = open_shared(ctx, "T", [A, B_, C], [D], seen=["A00001", "D00004"])
        ids = board_ids(page)
        check("A00001" not in ids, "4. объект, удалённый собеседником, убран")
        check("B00002" in ids and "C00003" in ids and "D00004" in ids,
              "4. не доехавшие до базы объекты остались, новое из базы пришло")
        page.evaluate(IDLE)
        check({"B00002", "C00003", "D00004"} <= server_ids(page) and "A00001" not in server_ids(page),
              "4. не доехавшие дописаны в базу, удалённый не воскрес")
        page.close()
        ctx.close()

        ctx = browser.new_context()
        X, Y, Z = pen(1, by="T", prefix="X"), pen(2, by="S", prefix="Y"), pen(3, prefix="Z")
        page = open_shared(ctx, "S", [X, Y], [Z], role="editor", seen=None)
        ids = board_ids(page)
        check("X00001" not in ids, "4. у ученицы при первом входе чужое старьё не воскресает")
        check("Y00002" in ids and "Z00003" in ids, "4. у ученицы её незаписанное осталось")
        page.evaluate(IDLE)
        check("Y00002" in server_ids(page) and "X00001" not in server_ids(page),
              "4. в базу ушло только её собственное")
        page.close()
        ctx.close()

        # ── 5. Жест, начатый до конца загрузки ──────────────────────────
        ctx = browser.new_context()
        server_part = many[:1200]
        page = open_shared(ctx, "T", many, server_part, seen=[o["id"] for o in many],
                           setup_js="() => { window.__fake.delays.select = [900, 900, 900, 900]; }",
                           wait_loaded=False)
        page.evaluate(BEGIN)
        page.evaluate(ADD, pen(77777, prefix="new"))
        page.wait_for_function(LOADED, timeout=15000)
        page.evaluate(END)
        page.evaluate(IDLE)
        diffs = page.evaluate("() => window.__fake.diffsSent()")
        removed = sum(len(d.get("removed") or []) for d in diffs)
        check("new77777" in server_ids(page), "5. штрих, начатый во время загрузки, записан")
        # 300 объектов нет в базе, но они были «видны» там — это законное
        # удаление собеседником; убирается только локально, не рассылкой
        check(removed == 0 and not page.evaluate("() => window.__fake.deletes().length"),
              "5. разница с ответом базы не ушла удалением ни в канал, ни в базу")
        page.close()
        ctx.close()

        # ── 6. Сбой одной из страниц ответа ───────────────────────────────
        ctx = browser.new_context()
        local_part = many[:1200]
        page = open_shared(ctx, "T", local_part, many, seen=[o["id"] for o in local_part],
                           setup_js="() => { window.__fake.selectErrors = [false, true]; }",
                           wait_loaded=False)
        page.wait_for_timeout(700)
        n_mid = len(board_ids(page))
        check(n_mid >= 1200, f"6. при сбое страницы ничего не удалено ({n_mid})")
        check(not page.evaluate("() => window.__fake.deletes().length"), "6. и в базу удалений нет")
        page.wait_for_function(LOADED, timeout=15000)
        page.wait_for_timeout(150)
        check(board_ids(page) == all_ids, "6. повтор догрузил всё")

        # ── 7. Сверка постраничная, запросы по номерам — кусками ─────────
        page.evaluate("""() => { for (let i = 0; i < 400; i++) {
            const id = 'zz' + String(i).padStart(4, '0');
            window.__fake.rows.set(id, { id, type: 'pen', points: [{x:1,y:1},{x:2,y:2}], rv: 1, rvBy: 'S', by: 'S' });
        } }""")
        page.evaluate("() => window.__cloudDiffTest.reconcileNow()")
        page.wait_for_function("() => window.getCurrentBoard().objects.length === 1900", timeout=10000)
        check(len(board_ids(page)) == 1900, "7. сверка нашла объекты за пределами первой тысячи")
        check(page.evaluate("() => window.__fake.maxIn") <= 200, "7. запросы по списку номеров — кусками")

        # ── 9. Пришедшее из базы записано на диск без подъёма rev ─────────
        page.wait_for_timeout(2200)
        disk = idb_board(page)
        check(disk["n"] == 1900, f"9. на диске общая доска свежая ({disk['n']})")
        check(disk["rev"] == 1, f"9. rev не поднят ({disk['rev']})")
        page.close()
        ctx.close()

        # ── 10. Версии и восстановление ─────────────────────────────────
        ctx = browser.new_context(viewport={"width": 1280, "height": 800})
        objs = [pen(i) for i in range(30)] + [img("im1"), img("im2"), img("im3", PNG2)]
        page = open_shared(ctx, "T", objs, [])
        page.evaluate(IDLE)
        page.evaluate("() => window.__cloudVersions.saveNow('test')")
        vers = page.evaluate("() => window.__cloudVersions.list()")
        check(len(vers) >= 1, "10. версия сохранена")
        # в версиях картинок нет — только ссылки на общий пул
        ver_keys = [k for k in idb_keys(page, "cloudver:cb1:")]
        heavy_in_ver = any("data:image" in str(idb_get(page, k)) for k in ver_keys)
        check(ver_keys and not heavy_in_ver, "10. в записях версий картинки не дублируются")
        check(len(idb_keys(page, "cloudimg:cb1:")) == 2, "10. в пуле ровно две разные картинки")

        # стираем 10 штрихов и картинку своим жестом
        page.evaluate(BEGIN)
        page.evaluate("""() => { const b = window.getCurrentBoard();
            b.objects = b.objects.filter(o => !(/^p0000/.test(o.id) || o.id === 'im1')); }""")
        page.evaluate(END)
        page.evaluate(IDLE)
        check(len(board_ids(page)) == 22, "10. стёрли 11 объектов")
        page.evaluate(BEGIN)
        page.evaluate(ADD, pen(55555, prefix="late"))
        page.evaluate(END)
        page.evaluate(IDLE)

        page.click("#bdShareBtn")
        page.wait_for_selector("#bdShareVersBtn")
        page.click("#bdShareVersBtn")
        page.wait_for_selector(".bd-ver-missing")
        page.locator(".bd-ver-missing").first.click()
        page.wait_for_function("() => window.getCurrentBoard().objects.length === 34", timeout=5000)
        page.evaluate(IDLE)
        ids = board_ids(page)
        check("im1" in ids and "p00000" in ids and "late55555" in ids,
              "10. «Вернуть пропавшее» вернуло стёртое и не тронуло новое")
        check({"im1", "p00000"} <= server_ids(page), "10. возвращённое записано в базу")
        restored = page.evaluate("() => window.getCurrentBoard().objects.find(o => o.id === 'im1').src")
        check(restored == PNG, "10. картинка восстановлена из пула")

        page.evaluate("() => window.doUndo()")
        page.evaluate(IDLE)
        check(len(board_ids(page)) == 23 and "im1" not in board_ids(page), "10. отмена убирает возвращённое")

        page.click("#bdShareBtn") if not page.evaluate(
            "() => document.getElementById('bdSharePop').classList.contains('open')") else None
        page.wait_for_selector("#bdShareVersBtn")
        page.click("#bdShareVersBtn")
        page.wait_for_selector(".bd-ver-rollback")
        # версию «test» (её сохранили до стирания) ищем по подписи
        btn = page.locator(".bd-ver-row", has_text="вручную").locator(".bd-ver-rollback").first
        btn.click()
        btn.click()   # второе нажатие — подтверждение
        page.wait_for_function("() => window.getCurrentBoard().objects.length === 33", timeout=5000)
        page.evaluate(IDLE)
        ids = board_ids(page)
        check("late55555" not in ids and "im1" in ids, "10. «Откатить» вернуло доску ровно к версии")
        check("late55555" not in server_ids(page), "10. откат дошёл до базы")
        page.close()
        ctx.close()

        # ── 11. Второй участник входит, пока первый на доске ─────────────
        ctx_t = browser.new_context()
        ctx_s = browser.new_context()
        teacher = open_shared(ctx_t, "T", many, many)
        student = open_shared(ctx_s, "S", [], server_rows(teacher), role="editor", seen=None)
        check(board_ids(student) == all_ids, "11. второй участник получил всю доску")
        student.evaluate(IDLE)
        check(not student.evaluate("() => window.__fake.diffsSent().length")
              and not student.evaluate("() => window.__fake.deletes().length"),
              "11. вход второго участника ничего не разослал и не удалил")
        # то, что ученица нарисовала, доезжает до учителя обычным путём
        student.evaluate(BEGIN)
        student.evaluate(ADD, pen(1, by="S", prefix="stu"))
        student.evaluate(END)
        student.evaluate(IDLE)
        diff = student.evaluate("() => window.__fake.diffsSent().slice(-1)[0]")
        teacher.evaluate("(d) => window.__fake.emit('board_diff', { diff: d, uid: 'S' })", diff)
        check("stu00001" in board_ids(teacher) and len(board_ids(teacher)) == 1501,
              "11. одновременная работа: штрих ученицы у учителя, у него ничего не пропало")
        teacher.close()
        student.close()
        ctx_t.close()
        ctx_s.close()

        browser.close()

    print()
    if failures:
        print(f"Провалено проверок: {len(failures)}")
        for f in failures:
            print(" -", f)
        sys.exit(1)
    print("Все проверки пройдены")


if __name__ == "__main__":
    run()
