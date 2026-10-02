"""
Промпт №15 «работы», этап 1: вкладка «Работы» (works.html), страница
ученика (work.html), общий модуль заданий trainer-tasks.js, works-cloud.js.

Supabase здесь — заглушка библиотеки (FAKE_SB_JS ниже): та же поверхность,
что зовут страницы (auth, from(...).select/insert/update/delete, rpc,
storage), логика функций — копия works-schema.sql в упрощённом виде, а
«база» — общий для всех вкладок и контекстов браузера JSON у теста
(маршрут https://fakesb.test/db). Права и функции по-настоящему проверяет
test_prompt15_works_schema.py на живом Postgres; здесь — страницы.

Проверяет:
  A. вход: без сессии — форма, неверный пароль — понятная ошибка, вход —
     пустой список работ; на главной есть кнопка «Работы»;
  B. конструктор: каталог тренажёров (тот же, что на досках), тренажёр в
     кадре, «Добавить в работу» с шести разных тренажёров (поле, выбор,
     утверждения, «Проценты», ЕГЭ база со строкой ответа под снимком,
     столбик) — у каждого задания ответ, рецепт без вёрстки, места полей,
     картинки светлой и тёмной темы, кадр после снимка в своей теме;
     «Обновить пример»; теория без ответа не добавляется; порядок ↑↓,
     режим, удаление; тип, ползунок, попытки (при «в конце» неактивны);
     сохранение — картинки ушли в хранилище, ссылка с кодом;
  C. ученик (телефон 390): имя, задания по одному, поля поверх картинки,
     неверно → «осталось попыток» → неверно окончательно и верный ответ;
     верно с первого раза; выбор варианта; утверждения; «Пропустить»;
     нечитаемая запись не тратит попытку; «Подсказки и решение» в
     Тренировке — тренажёр с тем же заданием, отметка у учителя;
     завершение с подтверждением, итог, после сдачи ответы не меняются;
  D. продолжение: перезагрузка — тот же заход и итог; «это не я» — новый
     заход; второй ученик с тем же именем — отдельный заход;
  E. «только в конце»: без вердиктов до сдачи, ответ меняется, попыток нет,
     после сдачи — итог и верные ответы;
  F. результаты у учителя: строки заходов, итоги, ячейки, подробности,
     удаление захода; «Закрыть приём» — по ссылке не начать;
  G. нет связи: ответ копится и уходит, когда связь вернулась;
  H. вёрстка: телефон 375 и 320 без прокрутки вбок, тёмная тема у
     ученика — тёмная картинка задания;
  I. нет ошибок JavaScript на страницах;
  J. «то же задание» по снимку exact открывается в каждом из шести тренажёров
     неотвеченным.

Живой Supabase отсюда не проверить — вход, запись и хранилище картинок
перепроверяются на сайте руками.

Запуск: python3 test_prompt15_works_stage1.py (сервер поднимается сам).
"""
import contextlib
import http.client
import json
import os
import re
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = 8960
BASE = f"http://127.0.0.1:{PORT}"
FAILS = []


def check(name, cond, extra=""):
    print(("[OK] " if cond else "[FAIL] ") + name + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        FAILS.append(name)


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=HERE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                conn = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                conn.request("GET", "/works.html")
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


TEACHER = {"id": "11111111-1111-4111-8111-111111111111", "email": "teacher@test.ru", "password": "secret1"}

# ── заглушка supabase-js ─────────────────────────────────────────────
FAKE_SB_JS = r"""
(function(){
  const DB_URL = 'https://fakesb.test/db';
  const USERS = [__USERS__];
  async function load(){ const r = await fetch(DB_URL); return await r.json(); }
  async function store(db){ await fetch(DB_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(db) }); }
  let chain = Promise.resolve();
  // по одной операции: «прочитал базу — поменял — записал» без гонок
  function tx(fn){
    const p = chain.then(async () => {
      if (window.__fakeNetDown) throw new TypeError('Failed to fetch');
      const db = await load(); const r = await fn(db); await store(db); return r;
    });
    chain = p.catch(() => {});
    return p;
  }
  const uuid = () => crypto.randomUUID();
  const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const code10 = () => Array.from({ length: 10 }, () => ALPHA[Math.random() * 31 | 0]).join('');
  const now = () => new Date().toISOString();
  const sess = () => { try { return JSON.parse(localStorage.getItem('__fakesb_session') || 'null'); } catch (e) { return null; } };
  const copy = x => JSON.parse(JSON.stringify(x));
  function own(db, uid){
    const works = new Set(db.works.filter(w => w.owner === uid).map(w => w.id));
    const atts = new Set(db.work_attempts.filter(a => works.has(a.work_id)).map(a => a.id));
    return { works: r => r.owner === uid, work_variants: r => works.has(r.work_id), work_attempts: r => works.has(r.work_id), work_answers: r => atts.has(r.attempt_id) };
  }
  class Q {
    constructor(t){ this.t = t; this.op = 'select'; this.f = []; this.cols = '*'; this.ord = null; this.one = null; this.payload = null; }
    select(c){ this.cols = c || '*'; return this; }
    insert(r){ this.op = 'insert'; this.payload = r; return this; }
    update(o){ this.op = 'update'; this.payload = o; return this; }
    delete(){ this.op = 'delete'; return this; }
    eq(c, v){ this.f.push([c, v]); return this; }
    order(c, o){ this.ord = [c, !(o && o.ascending === false)]; return this; }
    single(){ this.one = 'single'; return this; }
    maybeSingle(){ this.one = 'maybe'; return this; }
    then(res, rej){ return this.exec().then(res, rej); }
    async exec(){
      try { const data = await tx(db => this.run(db)); return { data, error: null }; }
      catch (e) { if (e instanceof TypeError) throw e; return { data: null, error: { message: e.message } }; }
    }
    run(db){
      const s = sess(); const uid = s ? s.user.id : null;
      if (!uid) throw new Error('permission denied for table ' + this.t);
      const vis = own(db, uid)[this.t];
      const match = r => vis(r) && this.f.every(([c, v]) => r[c] === v);
      let out;
      if (this.op === 'insert'){
        const rows = (Array.isArray(this.payload) ? this.payload : [this.payload]).map(r => Object.assign({}, r));
        rows.forEach(r => {
          r.id = r.id || uuid(); r.created_at = now(); r.updated_at = now();
          if (this.t === 'works'){ r.owner = r.owner || uid; r.closed = !!r.closed; r.settings = r.settings || {}; }
          if (this.t === 'work_variants'){ r.code = code10(); r.num = r.num || 1; r.blocks = r.blocks || []; }
          if (!vis(Object.assign({}, r)) && !(this.t === 'work_variants' && db.works.some(w => w.id === r.work_id && w.owner === uid)) && !(this.t === 'works' && r.owner === uid))
            throw new Error('new row violates row-level security policy');
          db[this.t].push(r);
        });
        out = rows;
      } else if (this.op === 'update'){
        out = db[this.t].filter(match);
        out.forEach(r => Object.assign(r, this.payload, { updated_at: now() }));
      } else if (this.op === 'delete'){
        const gone = db[this.t].filter(match);
        const ids = new Set(gone.map(r => r.id));
        db[this.t] = db[this.t].filter(r => !ids.has(r.id));
        if (this.t === 'works'){
          db.work_variants = db.work_variants.filter(r => !ids.has(r.work_id));
          const at = new Set(db.work_attempts.filter(r => ids.has(r.work_id)).map(r => r.id));
          db.work_attempts = db.work_attempts.filter(r => !ids.has(r.work_id));
          db.work_answers = db.work_answers.filter(r => !at.has(r.attempt_id));
        }
        if (this.t === 'work_attempts') db.work_answers = db.work_answers.filter(r => !ids.has(r.attempt_id));
        out = gone;
      } else {
        out = db[this.t].filter(match);
      }
      out = copy(out);
      if (this.ord){ const [c, asc] = this.ord; out.sort((a, b) => (a[c] < b[c] ? -1 : a[c] > b[c] ? 1 : 0) * (asc ? 1 : -1)); }
      if (this.op === 'select' || this.cols !== '*'){
        out.forEach(r => {
          if (this.t === 'works'){
            if (this.cols.indexOf('work_variants(') >= 0) r.work_variants = copy(db.work_variants.filter(v => v.work_id === r.id));
            if (this.cols.indexOf('work_attempts(') >= 0) r.work_attempts = copy(db.work_attempts.filter(v => v.work_id === r.id));
          }
          if (this.t === 'work_attempts' && this.cols.indexOf('work_answers(') >= 0) r.work_answers = copy(db.work_answers.filter(v => v.attempt_id === r.id));
        });
      }
      if (this.one){
        if (out.length === 1) return out[0];
        if (this.one === 'maybe' && !out.length) return null;
        throw new Error('JSON object requested, multiple (or no) rows returned');
      }
      return out;
    }
  }
  // функции для ученика — как в works-schema.sql
  const RPC = {
    work_open(db, a){
      const v = db.work_variants.find(x => x.code === String(a.p_code || '').trim().toUpperCase());
      if (!v) return null;
      const w = db.works.find(x => x.id === v.work_id);
      if (w.closed) return { closed: true, work: { type: 'work', kind: w.kind, title: w.title } };
      return { closed: false, work: { type: 'work', kind: w.kind, title: w.title, settings: w.settings }, variant: { num: v.num, code: v.code, blocks: v.blocks } };
    },
    work_start(db, a){
      const v = db.work_variants.find(x => x.code === String(a.p_code || '').trim().toUpperCase());
      if (!v) throw new Error('work_not_found');
      const w = db.works.find(x => x.id === v.work_id);
      if (w.closed) throw new Error('work_closed');
      const nm = String(a.p_name || '').trim().replace(/\s+/g, ' ');
      if (nm.length < 1 || nm.length > 60) throw new Error('bad_name');
      const r = { id: uuid(), work_id: w.id, variant_id: v.id, student_name: nm, secret: uuid(), started_at: now(), last_seen_at: now(), finished_at: null, active_ms: 0 };
      db.work_attempts.push(r);
      return { attempt: r.id, secret: r.secret, started_at: r.started_at, name: nm };
    },
    work_resume(db, a){
      const x = db.work_attempts.find(r => r.id === a.p_attempt && r.secret === a.p_secret);
      if (!x) throw new Error('attempt_not_found');
      const v = db.work_variants.find(r => r.id === x.variant_id);
      return { attempt: x.id, name: x.student_name, code: v.code, started_at: x.started_at, finished_at: x.finished_at, active_ms: x.active_ms,
        answers: db.work_answers.filter(r => r.attempt_id === x.id).map(r => ({ task_id: r.task_id, status: r.status, value: r.value, tries: r.tries, hint_used: r.hint_used, solution_shown: r.solution_shown, time_ms: r.time_ms })) };
    },
    work_save_answer(db, a){
      const x = db.work_attempts.find(r => r.id === a.p_attempt && r.secret === a.p_secret);
      if (!x) throw new Error('attempt_not_found');
      if (x.finished_at) throw new Error('attempt_finished');
      const w = db.works.find(r => r.id === x.work_id);
      if (w.closed) throw new Error('work_closed');
      const v = db.work_variants.find(r => r.id === x.variant_id);
      const p = a.p_answer || {};
      if (!v.blocks.some(b => b.id === p.task_id)) throw new Error('task_not_found');
      if (['pending', 'ok', 'bad', 'skipped'].indexOf(p.status || 'pending') < 0) throw new Error('bad_answer');
      let r = db.work_answers.find(z => z.attempt_id === x.id && z.task_id === p.task_id);
      if (!r){ r = { attempt_id: x.id, task_id: p.task_id, status: 'pending', value: null, tries: 0, hint_used: false, solution_shown: false, time_ms: 0 }; db.work_answers.push(r); }
      r.status = p.status || 'pending'; r.value = p.value == null ? null : p.value;
      r.tries = Math.max(r.tries, p.tries || 0); r.hint_used = r.hint_used || !!p.hint_used; r.solution_shown = r.solution_shown || !!p.solution_shown;
      r.time_ms = Math.max(r.time_ms, p.time_ms || 0); r.updated_at = now();
      x.last_seen_at = now(); x.active_ms = Math.max(x.active_ms, a.p_active_ms || 0);
      return { ok: true };
    },
    work_finish(db, a){
      const x = db.work_attempts.find(r => r.id === a.p_attempt && r.secret === a.p_secret);
      if (!x) throw new Error('attempt_not_found');
      x.finished_at = x.finished_at || now(); x.active_ms = Math.max(x.active_ms, a.p_active_ms || 0);
      return RPC.work_resume(db, a);
    },
  };
  async function rpc(name, args){
    try { const data = await tx(db => RPC[name](db, args || {})); return { data, error: null }; }
    catch (e) { if (e instanceof TypeError) throw e; return { data: null, error: { message: e.message } }; }
  }
  window.__fakeFiles = window.__fakeFiles || {};
  function bucket(name){
    return {
      async upload(path, blob){
        if (window.__fakeNetDown) throw new TypeError('Failed to fetch');
        const url = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
        const s = sess();
        if (!s || path.split('/')[0] !== s.user.id) return { data: null, error: { message: 'new row violates row-level security policy', statusCode: '403' } };
        return await tx(db => {
          db.files = db.files || {};
          if (db.files[path]){ window.__fakeFiles[path] = db.files[path].url; return { data: null, error: { message: 'The resource already exists', statusCode: '409' } }; }
          db.files[path] = { url, type: blob.type, size: blob.size };
          window.__fakeFiles[path] = url;
          return { data: { path }, error: null };
        });
      },
      getPublicUrl(path){ return { data: { publicUrl: window.__fakeFiles[path] || ('https://fakesb.test/missing/' + path) } }; },
    };
  }
  function createClient(){
    const listeners = [];
    const auth = {
      async getSession(){ return { data: { session: sess() }, error: null }; },
      async getUser(){ const s = sess(); return { data: { user: s ? s.user : null }, error: null }; },
      onAuthStateChange(cb){ listeners.push(cb); return { data: { subscription: { unsubscribe(){} } } }; },
      async signInWithPassword({ email, password }){
        const u = USERS.find(x => x.email === email && x.password === password);
        if (!u) return { data: {}, error: { message: 'Invalid login credentials' } };
        const s = { user: { id: u.id, email: u.email } };
        localStorage.setItem('__fakesb_session', JSON.stringify(s));
        listeners.forEach(cb => cb('SIGNED_IN', s));
        return { data: { user: s.user, session: s }, error: null };
      },
      async signOut(){ localStorage.removeItem('__fakesb_session'); listeners.forEach(cb => cb('SIGNED_OUT', null)); return { error: null }; },
    };
    // каналы realtime работам не нужны; заглушка — для session-share.js на главной
    const channel = () => { const ch = { on(){ return ch; }, subscribe(cb){ if (cb) setTimeout(() => cb('CLOSED'), 0); return ch; }, send(){ return Promise.resolve('ok'); }, unsubscribe(){ return Promise.resolve(); }, track(){}, presenceState(){ return {}; } }; return ch; };
    return { auth, from: t => new Q(t), rpc, storage: { from: bucket }, channel, removeChannel(){ return Promise.resolve(); } };
  }
  window.supabase = { createClient };
})();
""".replace("__USERS__", json.dumps(TEACHER))

EMPTY_DB = {"works": [], "work_variants": [], "work_attempts": [], "work_answers": [], "files": {}}
STATE = {"db": json.dumps(EMPTY_DB)}
CORS = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS"}


def db():
    return json.loads(STATE["db"])


def handle_db(route, request):
    if request.method == "GET":
        route.fulfill(status=200, content_type="application/json", body=STATE["db"], headers=CORS)
    elif request.method == "POST":
        STATE["db"] = request.post_data or STATE["db"]
        route.fulfill(status=200, content_type="application/json", body="{}", headers=CORS)
    else:
        route.fulfill(status=204, headers=CORS)


def new_context(browser, **kw):
    ctx = browser.new_context(**kw)
    ctx.route("https://**/*", lambda r: r.abort())
    ctx.route("https://fakesb.test/db", handle_db)
    ctx.route("**/supabase-js.umd.js", lambda r: r.fulfill(status=200, content_type="application/javascript", body=FAKE_SB_JS))
    return ctx


def watch_errors(page, errors, tag):
    page.on("pageerror", lambda e: errors.append(f"{tag}: {e}"))


def wait_frame_trainer(page):
    page.wait_for_function("""() => { try { const f = document.getElementById('trFrame');
        return f.contentDocument.readyState === 'complete' && typeof f.contentWindow.tsGetState === 'function'; }
        catch (e) { return false; } }""", timeout=20000)
    page.wait_for_timeout(500)


def open_in_frame(page, tid, prep_js):
    page.evaluate(f"""() => {{ const b = document.querySelector('.cat-item[data-id="{tid}"]'); b.click(); }}""")
    wait_frame_trainer(page)
    if prep_js:
        page.evaluate(f"() => document.getElementById('trFrame').contentWindow.eval({json.dumps(prep_js)})")
        page.wait_for_timeout(500)


def add_task(page, expect):
    page.click("#addBtn")
    page.wait_for_function(f"() => window.__works.E.blocks.length >= {expect}", timeout=40000)
    page.wait_for_function("() => !document.getElementById('addBtn').disabled", timeout=20000)
    page.wait_for_timeout(200)


def back_to_catalog(page):
    page.click("#catBack")
    page.wait_for_timeout(150)


def blocks(page):
    return page.evaluate("() => JSON.parse(JSON.stringify(window.__works.E.blocks, (k, v) => (typeof v === 'string' && v.startsWith('data:')) ? 'data:…' + v.slice(5, 20) : v))")


def correct_input(task):
    """Верная запись ответа для задания — как вписал бы ученик."""
    if task["kind"] == "fields":
        return {f["id"]: (f["value"] or "нет корней") for f in task["fields"]}
    return None


def wrong_input(task):
    return {f["id"]: "987654" for f in task["fields"]}


def type_fields(page, vals):
    for fid, v in vals.items():
        sel = f'#wCard input[data-fid="{fid}"], #wBelow input[data-fid="{fid}"]'
        page.fill(sel, str(v))


def press_check(page):
    """«Проверить» / «Ответить»: на самой карточке, а если её там нет — под ней."""
    if page.locator("#wCard .tc-btn:not([disabled])").count():
        page.click("#wCard .tc-btn")
    else:
        page.click("#wCheck")


def cur_task_id(page):
    return page.evaluate("() => { const w = window.__work; const bl = w.S.blocks.filter(b => (b.type || 'task') === 'task'); return bl[w.S.cur].id; }")


def ans_of(page, tid):
    return page.evaluate(f"() => window.__work.S.answers[{json.dumps(tid)}] || null")


def overflow_x(page):
    return page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")


def run():
    errors = []
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()

        # ═══ A. вход ═══
        print("\n— A. вход")
        tctx = new_context(browser, viewport={"width": 1440, "height": 950})
        tp = tctx.new_page()
        watch_errors(tp, errors, "works")
        tp.goto(f"{BASE}/index.html")
        has_btn = tp.evaluate("() => { const a = document.querySelector('a.works-toggle'); return a ? a.getAttribute('href') : null; }")
        check("A1 на главной кнопка «Работы» ведёт на works.html", has_btn == "works.html", str(has_btn))
        tp.goto(f"{BASE}/works.html")
        tp.wait_for_selector("#scrAuth:not([hidden])")
        check("A2 без входа — форма входа", tp.is_visible("#auEmail"))
        tp.fill("#auEmail", TEACHER["email"]); tp.fill("#auPass", "wrong")
        tp.click("#auGo")
        tp.wait_for_function("() => document.getElementById('auMsg').textContent.length > 0")
        check("A3 неверный пароль — понятная ошибка", "Не подошли" in tp.inner_text("#auMsg"), tp.inner_text("#auMsg"))
        tp.fill("#auPass", TEACHER["password"])
        tp.click("#auGo")
        tp.wait_for_selector("#scrList:not([hidden])")
        check("A4 вход — список работ, пока пустой", "Работ пока нет" in tp.inner_text("#workList"))
        check("A5 видно, кто вошёл", TEACHER["email"] in tp.inner_text("#acct"))

        # ═══ B. конструктор ═══
        print("\n— B. конструктор")
        tp.click("#newWork")
        tp.wait_for_selector("#scrEdit:not([hidden])")
        cat_ids = tp.evaluate("() => [...document.querySelectorAll('.cat-item')].map(b => b.dataset.id)")
        check("B1 каталог — тот же, что на досках (ОГЭ, ЕГЭ, основа)", all(x in cat_ids for x in ["oge6", "ege1", "egeb8", "percent", "lcm", "trig_equations"]) and len(cat_ids) > 60, str(len(cat_ids)))
        tp.fill("#catSearch", "проц")
        found = tp.evaluate("() => [...document.querySelectorAll('.cat-item')].map(b => b.dataset.id)")
        check("B2 поиск по каталогу", "percent" in found and len(found) <= 3, str(found))
        tp.fill("#catSearch", "")

        # 1) ОГЭ №6 — поле (тип 2: у «Демоверсии» задание одно, обновлять нечего)
        open_in_frame(tp, "oge6", "document.querySelectorAll('.mode-card:not(.soon)')[2].click()")
        check("B3 тренажёр открыт в кадре, кнопки снизу", tp.is_visible("#addBtn") and tp.is_visible("#refreshBtn2"))
        before = tp.evaluate("() => JSON.stringify(document.getElementById('trFrame').contentWindow.tsGetState().curTask)")
        tp.click("#refreshBtn2"); tp.wait_for_timeout(400)
        after = tp.evaluate("() => JSON.stringify(document.getElementById('trFrame').contentWindow.tsGetState().curTask)")
        check("B4 «Обновить пример» даёт другое задание", before != after)
        frame_theme_before = tp.evaluate("() => document.getElementById('trFrame').contentDocument.documentElement.getAttribute('data-theme')")
        add_task(tp, 1)
        frame_theme_after = tp.evaluate("() => document.getElementById('trFrame').contentDocument.documentElement.getAttribute('data-theme')")
        check("B5 после снимка кадр вернулся в свою тему", frame_theme_before == frame_theme_after, f"{frame_theme_before} → {frame_theme_after}")
        back_to_catalog(tp)
        # 2) ОГЭ №7 — выбор варианта
        open_in_frame(tp, "oge7", "document.querySelectorAll('.mode-card:not(.soon)')[3].click()")
        add_task(tp, 2); back_to_catalog(tp)
        # 3) ОГЭ №19 — утверждения
        open_in_frame(tp, "oge19", "document.querySelectorAll('.mode-card:not(.soon)')[1].click()")
        add_task(tp, 3); back_to_catalog(tp)
        # 4) Проценты
        open_in_frame(tp, "percent", "openProto('parts', 2)")
        add_task(tp, 4); back_to_catalog(tp)
        # 5) ЕГЭ база №8 — снимается одно условие, строка ответа дорисована под ним
        open_in_frame(tp, "egeb8", "document.querySelectorAll('.mode-card')[0].click()")
        add_task(tp, 5); back_to_catalog(tp)
        # 6) сложение в столбик
        open_in_frame(tp, "add_col", "curLevel = 3; newProblem();")
        add_task(tp, 6)
        # теория №1–5 без ответа — не добавляется
        back_to_catalog(tp)
        open_in_frame(tp, "oge1_5", None)
        n_before = tp.evaluate("() => window.__works.E.blocks.length")
        tp.click("#addBtn"); tp.wait_for_timeout(1200)
        n_after = tp.evaluate("() => window.__works.E.blocks.length")
        check("B6 на экране выбора / без ответа — задание не добавляется", n_before == n_after == 6, f"{n_before} → {n_after}")

        bl = blocks(tp)
        kinds = [b["task"]["kind"] for b in bl]
        check("B7 у каждого задания есть ответ: поле, выбор, утверждения…", kinds == ["fields", "choice", "multi", "fields", "fields", "fields"], str(kinds))
        check("B8 рецепт задания без вёрстки (gen без html)", all(b.get("gen") and "html" not in b["gen"] and b["gen"].get("tid") == b["tid"] for b in bl))
        check("B9 картинки светлой и тёмной темы у всех", all(b["img"]["light"]["url"].startswith(("data:", "http")) and b["img"]["dark"]["url"] for b in bl))
        check("B10 места живых полей найдены у всех шести", all(b.get("hot") for b in bl), str([bool(b.get('hot')) for b in bl]))
        check("B11 карточка не шире ~480 CSS-пикселей (смотрят с телефона)", all(b["css"]["w"] <= 440 + 40 for b in bl), str([round(b['css']['w']) for b in bl]))
        light_dark_differ = tp.evaluate("() => window.__works.E.blocks.every(b => b.img.light.url !== b.img.dark.url)")
        check("B12 светлая и тёмная картинки разные", light_dark_differ)
        tp.wait_for_function("() => window.__works.E.blocks.every(b => !b._up)", timeout=30000)
        check("B13 картинки ушли в хранилище в фоне", len(db()["files"]) >= 10, str(len(db()["files"])))

        # порядок, режим, удаление
        tp.evaluate("() => document.querySelector('.ti[data-id] [data-a=\"down\"]').click()")
        ids_now = tp.evaluate("() => window.__works.E.blocks.map(b => b.task.kind)")
        check("B14 ↓ меняет порядок", ids_now[:2] == ["choice", "fields"], str(ids_now))
        tp.evaluate("() => document.querySelector('.ti[data-id] [data-a=\"up\"]:not(:disabled)').click()")
        ids_now = tp.evaluate("() => window.__works.E.blocks.map(b => b.task.kind)")
        check("B15 ↑ возвращает", ids_now[:2] == ["fields", "choice"], str(ids_now))
        tp.evaluate("() => document.querySelectorAll('.ti')[3].querySelector('[data-m=\"train\"]').click()")
        check("B16 режим «Тренировка» у задания", tp.evaluate("() => window.__works.E.blocks[3].mode") == "train")
        # лишнее задание и удаление
        back_to_catalog(tp)
        open_in_frame(tp, "add_col", "curLevel = 2; newProblem();")
        tp.click("#addBtn")
        tp.wait_for_function("() => window.__works.E.blocks.length >= 7", timeout=40000)
        tp.wait_for_function("() => !document.getElementById('addBtn').disabled", timeout=20000)
        tp.evaluate("() => document.querySelectorAll('.ti')[6].querySelector('[data-a=\"rm\"]').click()")
        check("B17 ✕ убирает задание", tp.evaluate("() => window.__works.E.blocks.length") == 6)

        tp.fill("#wkTitle", "Проверочная по разным темам")
        tp.click('#wkKind button[data-k="kr"]')
        tp.click('#wkTries button[data-t="2"]')
        check("B18 попытки выбираются при «после каждого»", tp.evaluate("() => window.__works.E.settings.attempts") == 2)
        tp.click("#wkFeedback")
        check("B19 ползунок → «только в конце», попытки неактивны",
              tp.evaluate("() => window.__works.E.settings.feedback") == "end" and tp.evaluate("() => [...document.querySelectorAll('#wkTries button')].every(b => b.disabled)"))
        tp.click('.switch .side[data-v="each"]')
        check("B20 клик по подписи слева возвращает «после каждого»", tp.evaluate("() => window.__works.E.settings.feedback") == "each")
        tp.click('#wkKind button[data-k="custom"]')
        check("B21 «Другое» — поле своего названия", tp.is_visible("#wkKindName"))
        tp.fill("#wkKindName", "Зачёт")
        tp.click("#wkSave")
        tp.wait_for_function("() => !document.getElementById('wkLinkBox').hidden", timeout=20000)
        link = tp.input_value("#wkLink")
        m = re.search(r"work\.html\?c=([A-Z2-9]{10})$", link)
        check("B22 сохранение — ссылка с кодом", bool(m), link)
        code = m.group(1) if m else ""
        d = db()
        w = d["works"][0] if d["works"] else {}
        v = d["work_variants"][0] if d["work_variants"] else {}
        check("B23 в базе: тип, название, настройки",
              w.get("kind") == "custom" and w.get("title") == "Проверочная по разным темам"
              and w.get("settings", {}).get("feedback") == "each" and w.get("settings", {}).get("attempts") == 2
              and w.get("settings", {}).get("kindName") == "Зачёт", json.dumps(w, ensure_ascii=False)[:300])
        check("B24 в базе: 6 заданий без служебных полей и без картинок внутри",
              len(v.get("blocks", [])) == 6 and not any(k.startswith("_") for b in v["blocks"] for k in b)
              and all(not b["img"]["light"]["url"].startswith("data:image/png") for b in v["blocks"]), "")
        check("B25 адрес — «Сохранено», без пометки о несохранённом", "#/edit/" in tp.url and "Сохранено" in tp.inner_text("#wkSaved"))
        tasks = v.get("blocks", [])

        # ═══ C. ученик ═══
        print("\n— C. ученик")
        sctx = new_context(browser, viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        sp = sctx.new_page()
        watch_errors(sp, errors, "work")
        sp.goto(link.replace("http://127.0.0.1:%d" % PORT, BASE))
        sp.wait_for_selector("#scrStart:not([hidden])")
        check("C1 стартовый экран: тип и название", sp.inner_text("#wKind").strip().lower() == "зачёт" and "Проверочная" in sp.inner_text("#wTitle"))
        check("C2 сказано про попытки и «сразу»", "Попыток на задание: 2" in sp.inner_text("#startMeta") and "сразу" in sp.inner_text("#startMeta"))
        sp.click("#wStart")
        check("C3 без имени не начать", "имя" in sp.inner_text("#startMsg"))
        sp.fill("#wName", "  Маша   Иванова ")
        sp.click("#wStart")
        sp.wait_for_selector("#scrTask:not([hidden])")
        check("C4 задания по одному: «Задание 1 из 6», шесть номеров", sp.inner_text("#wTaskNum") == "Задание 1 из 6" and sp.locator(".num").count() == 6)
        check("C5 поле ответа — живое поверх картинки", sp.locator("#wCard .tc-in").count() == 1 and sp.locator("#wCard img").count() == 1)
        check("C5b одна «Проверить»: на карточке, без дубля снизу", sp.locator("#wCard .tc-btn").count() == 1 and sp.is_hidden("#wCheck"))
        t1 = tasks[0]["task"]
        # нечитаемая запись — попытка не тратится
        type_fields(sp, {t1["fields"][0]["id"]: "абв"})
        press_check(sp)
        check("C6 нечитаемая запись — просьба, попытка не потрачена", "разобрать" in sp.inner_text("#wMsg") and ans_of(sp, tasks[0]["id"]) is None)
        type_fields(sp, wrong_input(t1)); press_check(sp); sp.wait_for_timeout(200)
        check("C7 неверно — «попробуй ещё», попыток 1 из 2", "Неверно" in sp.inner_text("#wMsg") and "1 из 2" in sp.inner_text("#wTries"))
        type_fields(sp, {t1["fields"][0]["id"]: "123123"}); press_check(sp); sp.wait_for_timeout(200)
        a1 = ans_of(sp, tasks[0]["id"])
        check("C8 вторая неверная — окончательно, показан верный ответ", a1 and a1["status"] == "bad" and a1["tries"] == 2 and not sp.is_hidden("#wKey")
              and str(t1["fields"][0]["value"]) in sp.inner_text("#wKey"), str(a1))
        check("C9 поле заблокировано, номер красный, «Дальше»", sp.is_disabled("#wCard .tc-in") and "bad" in sp.get_attribute(".num[data-i='0']", "class") and sp.is_visible("#wNext"))
        sp.click("#wNext")
        # 2) выбор варианта — сам ответ
        t2 = tasks[1]["task"]
        sp.click(f"#wCard .tc-opt[data-i='{t2['correct']}']"); sp.wait_for_timeout(250)
        a2 = ans_of(sp, tasks[1]["id"])
        check("C10 выбор верного варианта — сразу «Верно!»", a2 and a2["status"] == "ok" and "Верно" in sp.inner_text("#wMsg"), str(a2))
        sp.click("#wNext")
        # 3) утверждения — отметить верные и «Проверить»
        t3 = tasks[2]["task"]
        for i in t3["correct"]:
            sp.click(f"#wCard .tc-opt[data-i='{i}']")
        if sp.locator("#wCard .tc-btn").count():
            sp.click("#wCard .tc-btn")
        else:
            press_check(sp)
        sp.wait_for_timeout(250)
        a3 = ans_of(sp, tasks[2]["id"])
        check("C11 утверждения — верно", a3 and a3["status"] == "ok", str(a3))
        sp.click("#wNext")
        # 4) Тренировка: подсказки в тренажёре
        check("C12 у задания «Тренировка» — кнопка подсказок, у экзамена её нет",
              sp.is_visible("#wTrainer") and sp.inner_text("#wMode") == "Тренировка")
        sp.click("#wTrainer")
        sp.wait_for_function("""() => { try { const f = document.getElementById('wTrainerFrame');
            return f.contentWindow && typeof f.contentWindow.tsGetState === 'function'; } catch (e) { return false; } }""", timeout=20000)
        sp.wait_for_timeout(1200)
        same = sp.evaluate("""() => { const w = document.getElementById('wTrainerFrame').contentWindow;
            return w.eval('[S.task ? S.task.key : null, !!S.answered, S.pctScreen || null]'); }""")
        check("C13 в тренажёре — ТО ЖЕ задание, не отвеченное", tasks[3].get("exact") and same[0] == tasks[3]["exact"]["task"]["key"] and same[1] is False,
              f"{same} / {(tasks[3].get('exact') or {}).get('task', {}).get('key')}")
        a4 = ans_of(sp, tasks[3]["id"])
        check("C14 отметка «открывал подсказки»", a4 and a4["hint_used"] is True, str(a4))
        sp.click("#wTrainerClose")
        type_fields(sp, correct_input(tasks[3]["task"])); press_check(sp); sp.wait_for_timeout(250)
        check("C15 «Проценты» — верно", (ans_of(sp, tasks[3]["id"]) or {}).get("status") == "ok")
        sp.click("#wNext")
        # 5) пропустить
        check("C16 у экзамена нет кнопки подсказок", sp.is_hidden("#wTrainer"))
        sp.click("#wSkip"); sp.wait_for_timeout(250)
        check("C17 «Пропустить» — задание пропущено, следующее", (ans_of(sp, tasks[4]["id"]) or {}).get("status") == "skipped" and sp.inner_text("#wTaskNum") == "Задание 6 из 6")
        type_fields(sp, correct_input(tasks[5]["task"])); press_check(sp); sp.wait_for_timeout(250)
        check("C18 столбик — верно", (ans_of(sp, tasks[5]["id"]) or {}).get("status") == "ok")
        sp.wait_for_function("() => window.__work.queue.length === 0", timeout=10000)
        rows = [a for a in db()["work_answers"]]
        check("C19 ответы в базе", len(rows) >= 6 and {r["status"] for r in rows} >= {"ok", "bad", "skipped"}, str([(r['task_id'][-4:], r['status']) for r in rows]))
        # вернуться к пропущенному через номер
        sp.click(".num[data-i='4']")
        check("C20 к пропущенному — по номеру", sp.inner_text("#wTaskNum") == "Задание 5 из 6" and "Пропущено" in sp.inner_text("#wMsg"))
        sp.click("#wFinish")
        check("C21 «Завершить» — подтверждение со счётом нерешённых", "Не решено заданий: 1" in sp.inner_text("#wConfirmText"))
        sp.click("#wConfirmYes")
        sp.wait_for_selector("#scrDone:not([hidden])")
        check("C22 итог: верно 4 из 6", sp.inner_text("#dScore") == "Верно: 4 из 6", sp.inner_text("#dScore"))
        check("C23 в итоге — верные ответы к ошибкам", str(t1["fields"][0]["value"]) in sp.inner_text("#dList"))
        check("C24 в базе заход завершён", db()["work_attempts"][0]["finished_at"] is not None and db()["work_attempts"][0]["student_name"] == "Маша Иванова")
        sp.locator(".res-item .open").first.click()
        check("C25 после сдачи задание видно, но поле не изменить", sp.is_disabled("#wCard .tc-in") and sp.is_hidden("#wCheck"))

        # ═══ D. продолжение ═══
        print("\n— D. продолжение")
        sp.reload()
        sp.wait_for_selector("#scrDone:not([hidden])")
        check("D1 перезагрузка — тот же заход, сразу итог", sp.inner_text("#dScore") == "Верно: 4 из 6")
        sp.click("#wNotMe")
        sp.wait_for_selector("#scrStart:not([hidden])")
        check("D2 «это не я» — снова ввод имени", sp.is_visible("#wName"))
        sp.fill("#wName", "Маша Иванова"); sp.click("#wStart")
        sp.wait_for_selector("#scrTask:not([hidden])")
        check("D3 дубль имени — отдельный заход", len(db()["work_attempts"]) == 2)
        type_fields(sp, correct_input(t1)); press_check(sp); sp.wait_for_timeout(200)
        sp.wait_for_function("() => window.__work.queue.length === 0", timeout=10000)
        sp.reload(); sp.wait_for_selector("#scrTask:not([hidden])")
        check("D4 перезагрузка посреди работы — тот же заход, ответ на месте",
              (ans_of(sp, tasks[0]["id"]) or {}).get("status") == "ok" and "ok" in sp.get_attribute(".num[data-i='0']", "class"))

        # ═══ G. нет связи ═══
        print("\n— G. нет связи")
        sp.click(".num[data-i='1']")
        sp.evaluate("() => { window.__fakeNetDown = true; }")
        sp.click(f"#wCard .tc-opt[data-i='{(t2['correct'] + 1) % t2['n']}']"); sp.wait_for_timeout(600)
        check("G1 нет связи — плашка, ответ в очереди", sp.is_visible("#netBanner") and sp.evaluate("() => window.__work.queue.length") >= 1)
        sp.evaluate("() => { window.__fakeNetDown = false; window.dispatchEvent(new Event('online')); }")
        sp.wait_for_function("() => window.__work.queue.length === 0", timeout=15000)
        att2 = db()["work_attempts"][1]["id"]
        r2 = [a for a in db()["work_answers"] if a["attempt_id"] == att2 and a["task_id"] == tasks[1]["id"]]
        check("G2 связь вернулась — ответ дошёл, плашка ушла", r2 and r2[0]["tries"] == 1 and sp.is_hidden("#netBanner"), str(r2))

        # ═══ H. вёрстка ═══
        print("\n— H. вёрстка")
        for wdt in (375, 320):
            sp.set_viewport_size({"width": wdt, "height": 760}); sp.wait_for_timeout(250)
            check(f"H1 телефон {wdt}: без прокрутки вбок", overflow_x(sp) <= 0, str(overflow_x(sp)))
            box = sp.evaluate("() => { const r = document.getElementById('wCard').getBoundingClientRect(); return [r.left, r.right, innerWidth]; }")
            check(f"H2 телефон {wdt}: карточка в экране", box[0] >= 0 and box[1] <= box[2] + 0.5, str(box))
        sp.click("#themeToggle"); sp.wait_for_timeout(200)
        src = sp.evaluate("() => document.querySelector('#wCard img').src")
        b_now = [b for b in tasks if b["id"] == cur_task_id(sp)][0]
        check("H3 тёмная тема — тёмная картинка задания", src == b_now["img"]["dark"]["url"])
        sp.click("#themeToggle")

        # ═══ E. только в конце ═══
        print("\n— E. только в конце")
        tp.click('.switch .side[data-v="end"]')
        tp.click("#wkSave")
        tp.wait_for_function("() => document.getElementById('wkSaved').textContent.indexOf('Сохранено') === 0", timeout=20000)
        ectx = new_context(browser, viewport={"width": 1200, "height": 900})
        ep = ectx.new_page()
        watch_errors(ep, errors, "work-end")
        ep.goto(f"{BASE}/work.html?c={code.lower()}")
        ep.wait_for_selector("#scrStart:not([hidden])")
        check("E1 код строчными тоже открывается; сказано «в конце»", "в конце" in ep.inner_text("#startMeta"))
        ep.fill("#wName", "Петя"); ep.click("#wStart")
        ep.wait_for_selector("#scrTask:not([hidden])")
        check("E2 попыток не показываем", ep.inner_text("#wTries") == "")
        type_fields(ep, wrong_input(t1)); press_check(ep); ep.wait_for_timeout(300)
        check("E3 неверный ответ — без вердикта, «Ответ сохранён»", "сохранён" in ep.inner_text("#wMsg") and "Неверно" not in ep.inner_text("#wMsg"))
        ep.wait_for_timeout(700)
        check("E4 сам переходит к следующему, номер — «отвечено», не красный",
              ep.inner_text("#wTaskNum") == "Задание 2 из 6" and "done" in ep.get_attribute(".num[data-i='0']", "class") and "bad" not in ep.get_attribute(".num[data-i='0']", "class"))
        ep.click(".num[data-i='0']")
        check("E5 ответ можно изменить — поле открыто", not ep.is_disabled("#wCard .tc-in") and ep.input_value("#wCard .tc-in") == "987654")
        type_fields(ep, correct_input(t1)); press_check(ep); ep.wait_for_timeout(900)
        ep.click(f"#wCard .tc-opt[data-i='{t2['correct']}']"); ep.wait_for_timeout(900)
        ep.click("#wFinish"); ep.click("#wConfirmYes")
        ep.wait_for_selector("#scrDone:not([hidden])")
        check("E6 после сдачи — итог (верно 2 из 6)", ep.inner_text("#dScore") == "Верно: 2 из 6", ep.inner_text("#dScore"))
        ep.locator(".res-item .open").first.click()
        check("E7 после сдачи вердикт виден: верно", "good" in ep.get_attribute("#wCard .tc-in", "class"))

        # ═══ F. результаты ═══
        print("\n— F. результаты у учителя")
        wid = db()["works"][0]["id"]
        tp.evaluate(f"() => {{ location.hash = '#/results/{wid}'; }}")
        tp.wait_for_selector("#scrResults:not([hidden])")
        rows_n = tp.locator("#rsTable tbody tr").count()
        check("F1 строка на каждый заход (3)", rows_n == 3, str(rows_n))
        first = tp.inner_text("#rsTable tbody tr:nth-child(1)")
        check("F2 имя, «сдал(а)», итог 4 / 6", "Маша Иванова" in first and "сдал" in first and "4 / 6" in first, first)
        cells = tp.evaluate("() => [...document.querySelectorAll('#rsTable tbody tr:nth-child(1) .cell')].map(c => c.className.replace('cell ', ''))")
        check("F3 ячейки: ✗ ✓ ✓ ✓ ⏭ ✓", cells == ["bad", "ok", "ok", "ok", "skipped", "ok"], str(cells))
        check("F4 у задания с подсказками — 💡", tp.locator("#rsTable tbody tr:nth-child(1) .cell .aid").count() == 1)
        tp.click("#rsTable tbody tr:nth-child(1) .cell >> nth=0")
        det = tp.inner_text("#rsDetail")
        check("F5 подробности: ответ, верный, попытки", "123123" in det and "Попыток: 2" in det and str(t1["fields"][0]["value"]) in det, det)
        tp.once("dialog", lambda dlg: dlg.accept())
        tp.click("#rsTable tbody tr:nth-child(2) [data-del]")
        tp.wait_for_timeout(600)
        check("F6 удаление захода", tp.locator("#rsTable tbody tr").count() == 2 and len(db()["work_attempts"]) == 2)
        tp.click("#rsClose"); tp.wait_for_timeout(500)
        check("F7 «Закрыть приём»", db()["works"][0]["closed"] is True and tp.inner_text("#rsClose") == "Открыть приём")
        cctx = new_context(browser, viewport={"width": 800, "height": 800})
        cp = cctx.new_page()
        cp.goto(f"{BASE}/work.html?c={code}")
        cp.wait_for_selector("#scrError:not([hidden])")
        check("F8 по закрытой ссылке — «приём закрыт»", "закрыл" in cp.inner_text("#errText"))
        cp.goto(f"{BASE}/work.html?c=ZZZZZZZZZZ")
        cp.wait_for_selector("#scrError:not([hidden])")
        check("F9 чужой код — «не найдена»", "не найдена" in cp.inner_text("#errText"))
        tp.evaluate("() => { location.hash = '#/'; }")
        tp.wait_for_selector("#scrList:not([hidden])")
        card = tp.inner_text("#workList")
        check("F10 карточка в списке: тип, «приём закрыт», сколько начали", "ЗАЧЁТ" in card.upper() and "ПРИЁМ ЗАКРЫТ" in card.upper() and "Начали: 2" in card, card)
        tp.set_viewport_size({"width": 375, "height": 800}); tp.wait_for_timeout(200)
        check("H4 список работ на телефоне без прокрутки вбок", overflow_x(tp) <= 0, str(overflow_x(tp)))

        # ═══ J. «то же задание» в тренажёре — для всех шести ═══
        print("\n— J. то же задание в тренажёре (снимок exact)")
        # тренажёр открыт сам по себе — без библиотеки Supabase совместная
        # сессия встаёт пустышкой и в базу не ходит
        jctx = browser.new_context(viewport={"width": 900, "height": 900})
        jctx.route("https://**/*", lambda r: r.abort())
        jctx.route("**/supabase-js.umd.js", lambda r: r.fulfill(status=200, content_type="application/javascript", body="/* нет библиотеки */"))
        jp = jctx.new_page()
        watch_errors(jp, errors, "trainer-exact")
        KEYS = ["curTask", "task", "P", "egeN", "egePid", "pid", "lvl", "curMode", "props"]
        for b in tasks:
            ex = b.get("exact")
            if not ex:
                check(f"J {b['tid']}: есть снимок задания", False)
                continue
            jp.goto(f"{BASE}/{b['href']}")
            jp.wait_for_function("() => typeof window.tsGetState === 'function' && document.readyState === 'complete'", timeout=20000)
            jp.wait_for_timeout(500)
            jp.evaluate("(s) => window.tsApplyState(JSON.parse(JSON.stringify(s)))", ex)
            jp.wait_for_timeout(500)
            st = jp.evaluate("() => JSON.parse(JSON.stringify(window.tsGetState()))")
            diff = [k for k in KEYS if k in ex and json.dumps(st.get(k), sort_keys=True) != json.dumps(ex.get(k), sort_keys=True)]
            answered = any(st.get(k) for k in ("answered", "taskAnswered"))
            check(f"J {b['tid']}: в тренажёре то же задание, не отвеченное", not diff and not answered, f"расходятся: {diff}, отвечено: {answered}")

        browser.close()

    print("\n— I. ошибки JavaScript")
    check("I1 нет ошибок JavaScript", not errors, "; ".join(errors[:5]))


if __name__ == "__main__":
    run()
    print()
    if FAILS:
        print(f"ПРОВАЛЕНО: {len(FAILS)}")
        for f in FAILS:
            print("  - " + f)
        sys.exit(1)
    print("Все проверки прошли")
