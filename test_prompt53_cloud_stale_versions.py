"""
Промпт №53: на общей доске действия откатывались сами.

Живой случай: учитель увеличивает картинку — через секунду она сама
возвращается к прежнему размеру; удаляет картинку — через секунду она
появляется снова. Только в совместной работе и только когда ученица в это
время пишет. Причина — до участника доезжала СТАРАЯ версия объекта
(запоздавший ответ базы, своё эхо, запросы к базе вне очереди), её
применяли поверх новой, а если это случалось посреди жеста ученицы — она
ещё и отправляла это старьё обратно как свою правку.

Живой realtime из песочницы недоступен, поэтому вместо supabase-js
подставляется заглушка: база — словарь в памяти страницы, канал — список
обработчиков, в который тест сам вбрасывает сообщения «от собеседника».
Задержки ответов базы задаются тестом — так воспроизводятся гонки.

Проверяем, со стороны ученицы (uid S):
  1. Заглушка картинки v2 пришла, а в базе ещё v1 — v1 не применяется,
     повтор забирает v2, как только она записана.
  2. Картинка, догруженная посреди жеста ученицы, НЕ уходит в её рассылку
     как её собственная правка.
  3. Удалённая картинка не воскресает: ни от запоздавшего ответа базы, ни
     от старой копии в чужом сообщении, ни по сигналу «записано».
Со стороны учителя (uid T):
  4. Своё эхо и чужая старая версия из postgres_changes не откатывают
     второй подряд размер.
  5. Запросы к базе идут по очереди: медленная первая запись не затирает
     вторую, удаление не опережает предыдущее сохранение.
  6. Отмена удаления возвращает картинку с более новой версией, и
     запоздавшее удаление из postgres_changes её не сносит.
"""
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8968
BASE = f"http://127.0.0.1:{PORT}"

PNG = ("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==")

# заглушка supabase-js: база в памяти страницы, канал без сети
FAKE_LIB = r"""
(function(){
  const F = window.__fake = {
    rows: new Map(),          // obj_id -> data (одна общая доска cb1)
    delays: { upsert: [], delete: [], select: [] },
    sent: [], handlers: [], log: [],
    emit(kind, payload){
      F.handlers.forEach(h => {
        if (kind === 'postgres_changes' && h.type === 'postgres_changes') h.cb(payload);
        else if (h.type === 'broadcast' && h.filter && h.filter.event === kind) h.cb({ payload });
      });
    },
    diffsSent(){ return F.sent.filter(m => m.event === 'board_diff').map(m => m.payload.diff); },
  };
  const wait = (op) => new Promise(r => setTimeout(r, F.delays[op].length ? F.delays[op].shift() : 0));
  const clone = (v) => JSON.parse(JSON.stringify(v));
  function builder(table){
    const q = { table, op: null, sel: '', filters: {}, rows: null };
    const b = {
      select(s){ if (!q.op) q.op = 'select'; q.sel = s || '*'; return b; },
      upsert(rows){ q.op = 'upsert'; q.rows = clone(rows); return b; },
      insert(rows){ q.op = 'insert'; q.rows = rows; return b; },
      delete(){ q.op = 'delete'; return b; },
      eq(k, v){ q.filters[k] = [v]; return b; },
      in(k, arr){ q.filters[k] = arr.slice(); return b; },
      order(){ return b; }, single(){ return b; }, maybeSingle(){ return b; },
      then(res, rej){ return run().then(res, rej); },
    };
    async function run(){
      if (table !== 'board_objects') return { data: [], error: null };
      if (q.op === 'upsert'){
        await wait('upsert');
        q.rows.forEach(r => F.rows.set(r.obj_id, r.data));
        F.log.push(['upsert', q.rows.map(r => r.obj_id + '@' + (r.data.rv || 0))]);
        return { data: null, error: null };
      }
      if (q.op === 'delete'){
        await wait('delete');
        (q.filters.obj_id || []).forEach(id => F.rows.delete(id));
        F.log.push(['delete', q.filters.obj_id]);
        return { data: null, error: null };
      }
      await wait('select');
      let ids = Array.from(F.rows.keys());
      if (q.filters.obj_id) ids = ids.filter(id => q.filters.obj_id.includes(id));
      const data = ids.map(id => {
        const d = clone(F.rows.get(id));
        if (/rv:data->rv/.test(q.sel)) return { obj_id: id, rv: d.rv === undefined ? null : d.rv };
        if (/data/.test(q.sel)) return { obj_id: id, data: d };
        return { obj_id: id };
      });
      return { data, error: null };
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


def img(obj_id, w, rv, by="T"):
    return {"id": obj_id, "type": "image", "src": PNG, "points": [{"x": 40, "y": 40}],
            "w": w, "h": w, "natW": 1, "natH": 1, "rv": rv, "rvBy": by}


def open_shared_board(context, uid, objects):
    page = context.new_page()
    page.route("**/supabase-js.umd.js", lambda route: route.fulfill(
        status=200, content_type="application/javascript", body=FAKE_LIB))
    page.goto(f"{BASE}/boards.html")
    page.evaluate(
        """(objects) => new Promise((resolve, reject) => {
            const req = indexedDB.open('ogeBoardsDB', 1);
            req.onupgradeneeded = () => req.result.createObjectStore('state');
            req.onsuccess = () => {
              const tx = req.result.transaction('state', 'readwrite');
              const st = tx.objectStore('state');
              st.put({ __v: 2, folders: [], deleted: [], sortMode: 'my', boards: [{
                id: 'bShared', name: 'Общая', folderId: null, createdAt: 1000, updatedAt: 1000,
                lastOpenedAt: null, rev: 1, cellSize: 24, sheetCols: 76, sheetRows: 54, pageOrder: 'h',
                recentColors: [], colorUsage: {}, view: { x: 0, y: 0, zoom: 1 },
                cloudBoardId: 'cb1', cloudRole: 'owner' }] }, 'db');
              st.put({ objects, imageLib: [] }, 'boarddata:bShared');
              tx.oncomplete = () => resolve(true);
              tx.onerror = () => reject(tx.error);
            };
            req.onerror = () => reject(req.error);
        })""", objects)
    page.reload()
    page.evaluate("""([uid, objects]) => {
        window.CURRENT_USER = { id: uid, email: uid + '@test' };
        objects.forEach(o => window.__fake.rows.set(o.id, JSON.parse(JSON.stringify(o))));
        const gate = document.getElementById('authGate');
        if (gate) gate.style.display = 'none';
        window.boardsAppBoot();
    }""", [uid, objects])
    page.wait_for_function("window.getDB && window.getDB().boards.length >= 1")
    page.evaluate("() => window.openBoard('bShared')")
    page.wait_for_function("""() => { const b = window.getCurrentBoard();
        return b && b.id === 'bShared' && Array.isArray(b.objects) && window.__fake.handlers.length > 0; }""")
    page.wait_for_timeout(200)
    return page


GET = """(id) => { const o = window.getCurrentBoard().objects.find(x => x.id === id);
                   return o ? { w: o.w, rv: o.rv || 0 } : null; }"""

# жест так, как его видит облачный модуль: начало (pushUndo), правка,
# сохранение и отпускание пера
BEGIN = "() => window.pushUndo()"
END = "() => { window.saveDB(); window.dispatchEvent(new Event('pointerup')); }"


def run():
    failures = []

    def check(name, cond):
        print(f"[{'OK' if cond else 'FAIL'}] {name}")
        if not cond:
            failures.append(name)

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()

        # ════════ сторона ученицы ════════
        st = open_shared_board(browser.new_context(), "S",
                               [img("img1", 100, 1), {"id": "p0", "type": "pen", "color": "--pencil",
                                "points": [{"x": 1, "y": 1}, {"x": 2, "y": 2}], "rv": 1, "rvBy": "S"}])
        check("ученица: доска открылась с картинкой", st.evaluate(GET, "img1") == {"w": 100, "rv": 1})

        # ученица начала писать и не отрывает перо
        st.evaluate(BEGIN)
        st.evaluate("""() => { window.__stroke = { id: 'sStroke', type: 'pen', color: '--pencil',
                         points: [{x: 5, y: 5}, {x: 6, y: 6}] };
                       window.getCurrentBoard().objects.push(window.__stroke); }""")
        # учитель увеличил картинку: заглушка v2, а в базе ещё v1
        st.evaluate("""() => window.__fake.emit('board_diff', { uid: 'T',
            diff: { added: [], removed: [], updated: [{ id: 'img1', after: { id: 'img1', __heavy: true, rv: 2, rvBy: 'T' } }] } })""")
        st.wait_for_timeout(120)
        check("1. пока в базе прошлая версия — она не применяется", st.evaluate(GET, "img1")["w"] == 100)
        # запись учителя дошла до базы
        st.evaluate(f"() => window.__fake.rows.set('img1', {img('img1', 200, 2)})".replace("True", "true"))
        st.wait_for_timeout(500)
        check("1. повтор забрал новую версию", st.evaluate(GET, "img1") == {"w": 200, "rv": 2})

        # ученица отпускает перо
        st.evaluate(END)
        st.wait_for_timeout(100)
        diffs = st.evaluate("() => window.__fake.diffsSent()")
        mine = diffs[-1] if diffs else {"added": [], "updated": [], "removed": []}
        sent_ids = [o["id"] for o in mine["added"]] + [u["id"] for u in mine["updated"]]
        check("2. ученица отправила свой штрих", "sStroke" in sent_ids)
        check("2. картинка учителя НЕ ушла от ученицы как её правка", "img1" not in sent_ids)

        # ── 3. удаление и запоздавшие копии ──
        st.evaluate("""() => window.__fake.emit('board_diff', { uid: 'T',
            diff: { added: [], removed: [], updated: [{ id: 'img1', after: { id: 'img1', __heavy: true, rv: 3, rvBy: 'T' } }] } })""")
        st.wait_for_timeout(50)
        st.evaluate("() => window.__fake.emit('board_diff', { uid: 'T', diff: { added: [], updated: [], removed: [{ id: 'img1', rv: 3 }] } })")
        check("3. картинка удалена у ученицы", st.evaluate(GET, "img1") is None)
        # запоздавшая запись размера всё-таки легла в базу — повтор её увидит
        st.evaluate(f"() => window.__fake.rows.set('img1', {img('img1', 300, 3)})")
        st.wait_for_timeout(1200)
        check("3. запоздавший ответ базы не воскресил картинку", st.evaluate(GET, "img1") is None)
        st.evaluate(f"""() => window.__fake.emit('board_diff', {{ uid: 'X',
            diff: {{ added: [{img('img1', 300, 3)}], updated: [], removed: [] }} }})""")
        check("3. старая копия в чужом сообщении не воскресила картинку", st.evaluate(GET, "img1") is None)
        st.evaluate("() => window.__fake.emit('board_ready', { uid: 'X', ids: ['img1'], revs: { img1: 3 } })")
        st.evaluate(f"""() => window.__fake.emit('postgres_changes', {{ eventType: 'UPDATE',
            new: {{ obj_id: 'img1', updated_by: 'X', data: {img('img1', 300, 3)} }} }})""")
        st.wait_for_timeout(600)
        check("3. сигнал «записано» и postgres_changes не воскресили картинку", st.evaluate(GET, "img1") is None)
        # а вот настоящая отмена удаления (версия новее) — возвращает
        st.evaluate(f"""() => window.__fake.emit('board_diff', {{ uid: 'T',
            diff: {{ added: [{img('img1', 300, 4)}], updated: [], removed: [] }} }})""")
        check("3. отмена удаления у собеседника возвращает картинку", st.evaluate(GET, "img1") == {"w": 300, "rv": 4})

        # ════════ сторона учителя ════════
        tp = open_shared_board(browser.new_context(), "T", [img("img2", 100, 1)])
        # первая запись в базу медленная, вторая быстрая
        tp.evaluate("() => { window.__fake.delays.upsert = [700, 0]; }")
        tp.evaluate(BEGIN)
        tp.evaluate("() => { window.getCurrentBoard().objects.find(o => o.id === 'img2').w = 150; }")
        tp.evaluate(END)
        tp.evaluate(BEGIN)
        tp.evaluate("() => { window.getCurrentBoard().objects.find(o => o.id === 'img2').w = 200; }")
        tp.evaluate(END)
        check("4. у учителя картинка 200, версия выросла дважды", tp.evaluate(GET, "img2") == {"w": 200, "rv": 3})
        # своё эхо первой правки и чужая старая версия
        tp.evaluate(f"""() => {{
            window.__fake.emit('postgres_changes', {{ eventType: 'UPDATE',
              new: {{ obj_id: 'img2', updated_by: 'T', data: {img('img2', 150, 2)} }} }});
            window.__fake.emit('postgres_changes', {{ eventType: 'UPDATE',
              new: {{ obj_id: 'img2', updated_by: 'S', data: {img('img2', 150, 2, 'S')} }} }});
            window.__fake.emit('board_diff', {{ uid: 'S',
              diff: {{ added: [], removed: [], updated: [{{ id: 'img2', after: {img('img2', 100, 1, 'S')} }}] }} }});
        }}""")
        check("4. эхо и старые версии не откатили размер", tp.evaluate(GET, "img2") == {"w": 200, "rv": 3})
        tp.evaluate("() => window.__cloudDiffTest.writesIdle()")
        check("5. медленная первая запись не затёрла вторую в базе",
              tp.evaluate("() => window.__fake.rows.get('img2').w") == 200)

        # удаление сразу после медленного сохранения
        tp.evaluate("() => { window.__fake.delays.upsert = [600]; }")
        tp.evaluate(BEGIN)
        tp.evaluate("() => { window.getCurrentBoard().objects.find(o => o.id === 'img2').w = 250; }")
        tp.evaluate(END)
        tp.evaluate(BEGIN)
        tp.evaluate("() => { const b = window.getCurrentBoard(); b.objects = b.objects.filter(o => o.id !== 'img2'); }")
        tp.evaluate(END)
        tp.evaluate("() => window.__cloudDiffTest.writesIdle()")
        check("5. удаление не опередило сохранение: в базе картинки нет",
              tp.evaluate("() => window.__fake.rows.has('img2')") is False)
        order = tp.evaluate("() => window.__fake.log.map(e => e[0])")
        check("5. порядок запросов к базе: сохранения, затем удаление", order[-1] == "delete")

        # ── 6. отмена удаления ──
        tp.evaluate("() => window.doUndo()")
        back = tp.evaluate(GET, "img2")
        check("6. отмена вернула картинку", back is not None and back["w"] == 250)
        check("6. у вернувшейся картинки версия новее удалённой", back is not None and back["rv"] > 4)
        tp.evaluate("() => window.__cloudDiffTest.writesIdle()")
        check("6. вернувшаяся картинка записана в базу", tp.evaluate("() => window.__fake.rows.has('img2')"))
        tp.evaluate("() => window.__fake.emit('postgres_changes', { eventType: 'DELETE', old: { obj_id: 'img2' } })")
        tp.wait_for_timeout(700)
        check("6. запоздавшее удаление из postgres_changes её не снесло", tp.evaluate(GET, "img2") is not None)
        # а настоящее удаление собеседником через postgres_changes работает
        tp.evaluate("() => { window.__fake.rows.delete('img2'); window.__fake.emit('postgres_changes', { eventType: 'DELETE', old: { obj_id: 'img2' } }); }")
        tp.wait_for_timeout(700)
        check("6. настоящее удаление через postgres_changes применяется", tp.evaluate(GET, "img2") is None)

        browser.close()

    print()
    if failures:
        print(f"ПРОВАЛЕНО: {len(failures)}")
        sys.exit(1)
    print("Все проверки пройдены")


if __name__ == "__main__":
    run()
