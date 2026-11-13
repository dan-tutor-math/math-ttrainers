"""
Кабинет, задача Б1: student-memory.js — сессия с учеником и память заданий.

Supabase — заглушка (как в test_prompt_cabinet_page.py, плюс range/in/like/
delete и upsert с ignoreDuplicates). «База» — JSON у теста
(https://fakesb.test/db); STATE["offline"] обрывает «сеть»: запрос к базе
падает так же, как fetch без связи. Живая база и совместный режим
перепроверяются на сайте руками.

Проверяет:
  A. режим «вкладка»: две вкладки держат двух разных учеников, перезагрузка
     ученика не теряет; вкладка «＋ Новая сессия» (копия sessionStorage, свой
     код) — без ученика; смена кода в той же вкладке ученика не теряет;
  B. режим «браузер»: один ученик на все вкладки, плашка соседней вкладки
     меняется сама;
  C. обрыв сети: событие лежит в очереди, переживает перезагрузку, уходит
     после появления связи; повтор того же события в 10 минут не пишется;
     повтор отправки той же строки дубля не даёт; страница без Supabase
     (neg_pos) пишет в очередь, отправляет кабинет;
  D. журнал грузится при старте; сводка по ключу и по виду; «забыть»
     задание и вид — строки уходят с сервера и из копии; пауза не пишет;
  E. follower (роль в вкладке, ?s= в адресе): current() пусто, плашки нет,
     запись отклонена, к журналу запросов нет;
  F. главная: вошедшему — «Начать сессию с учеником» и список, без входа —
     ничего; карточка ученика в кабинете — «Начать / Закончить сессию»;
  G. нет ошибок JavaScript.

Запуск: python3 test_prompt_b1_student_memory.py (сервер поднимается сам).
"""
import contextlib
import http.client
import json
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = 8963
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
                conn.request("GET", "/cabinet.html")
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
VANYA = "aaaaaaaa-0000-4000-8000-000000000001"
PETYA = "aaaaaaaa-0000-4000-8000-000000000002"

FAKE_SB_JS = r"""
(function(){
  const DB_URL = 'https://fakesb.test/db';
  const USERS = [__USERS__];
  async function load(){ return await (await fetch(DB_URL)).json(); }
  async function store(db){ await fetch(DB_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(db) }); }
  let chain = Promise.resolve();
  function tx(fn){
    const p = chain.then(async () => { const db = await load(); const r = await fn(db); await store(db); return r; });
    chain = p.catch(() => {});
    return p;
  }
  const now = () => new Date().toISOString();
  const sess = () => { try { return JSON.parse(localStorage.getItem('__fakesb_session') || 'null'); } catch (e) { return null; } };
  const copy = x => JSON.parse(JSON.stringify(x));
  window.__sbCalls = window.__sbCalls || [];
  class Q {
    constructor(t){ this.t = t; this.op = 'select'; this.f = []; this.ord = null; this.one = null; this.payload = null; this.opts = null; this.rng = null; }
    select(){ return this; }
    insert(r){ this.op = 'insert'; this.payload = r; return this; }
    update(o){ this.op = 'update'; this.payload = o; return this; }
    upsert(r, o){ this.op = 'upsert'; this.payload = r; this.opts = o || {}; return this; }
    delete(){ this.op = 'delete'; return this; }
    eq(c, v){ this.f.push(r => r[c] === v); return this; }
    in(c, vs){ this.f.push(r => vs.indexOf(r[c]) >= 0); return this; }
    like(c, pat){
      const re = new RegExp('^' + pat.replace(/\\([\\%_])|([%_])|([.*+?^${}()|[\]])/g, (m, esc, wild, sp) => esc ? '\\' + esc : wild ? (wild === '%' ? '.*' : '.') : '\\' + sp) + '$');
      this.f.push(r => re.test(r[c])); return this;
    }
    order(c, o){ this.ord = [c, !(o && o.ascending === false)]; return this; }
    range(a, b){ this.rng = [a, b]; return this; }
    single(){ this.one = 'single'; return this; }
    maybeSingle(){ this.one = 'maybe'; return this; }
    then(res, rej){
      window.__sbCalls.push(this.t + ':' + this.op);
      return tx(db => this.run(db)).then(data => ({ data, error: null }), e => ({ data: null, error: { message: e.message } })).then(res, rej);
    }
    run(db){
      const s = sess(); const uid = s ? s.user.id : null;
      if (!uid) throw new Error('permission denied for table ' + this.t);
      db[this.t] = db[this.t] || [];
      const rows = db[this.t];
      const match = r => r.owner === uid && this.f.every(fn => fn(r));
      let out;
      if (this.op === 'insert'){
        const list = (Array.isArray(this.payload) ? this.payload : [this.payload]).map(r => Object.assign({}, r, { owner: uid }));
        list.forEach(r => { if (!r.id) r.id = 'id-' + Math.random().toString(36).slice(2, 10); rows.push(r); });
        out = list;
      } else if (this.op === 'update'){
        out = rows.filter(match);
        out.forEach(r => Object.assign(r, this.payload, { updated_at: now() }));
      } else if (this.op === 'upsert' && this.t === 'student_task_log'){
        out = [];
        (Array.isArray(this.payload) ? this.payload : [this.payload]).forEach(p => {
          if (!db.students.some(st => st.id === p.student_id && st.owner === uid)) throw new Error('insert or update on table "student_task_log" violates foreign key constraint');
          if (rows.some(x => x.id === p.id)) return;          // on conflict do nothing
          const r = Object.assign({}, p, { owner: uid, created_at: now() }); rows.push(r); out.push(r);
        });
      } else if (this.op === 'upsert'){
        const p = Object.assign({}, this.payload, { owner: uid });
        let r = rows.find(x => x.owner === uid);
        if (r) Object.assign(r, p); else rows.push(p);
        out = [p];
      } else if (this.op === 'delete'){
        out = rows.filter(match);
        db[this.t] = rows.filter(r => !match(r));
      } else {
        out = rows.filter(match);
      }
      out = copy(out);
      if (this.ord){ const [c, asc] = this.ord; out.sort((a, b) => (a[c] < b[c] ? -1 : a[c] > b[c] ? 1 : 0) * (asc ? 1 : -1)); }
      if (this.rng) out = out.slice(this.rng[0], this.rng[1] + 1);
      if (this.one){
        if (out.length === 1) return out[0];
        if (this.one === 'maybe' && !out.length) return null;
        throw new Error('JSON object requested, multiple (or no) rows returned');
      }
      return out;
    }
  }
  function createClient(){
    const listeners = [];
    const auth = {
      async getSession(){ return { data: { session: sess() }, error: null }; },
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
    const channel = () => { const ch = { on(){ return ch; }, subscribe(cb){ if (cb) setTimeout(() => cb('CLOSED'), 0); return ch; }, send(){ return Promise.resolve('ok'); }, unsubscribe(){ return Promise.resolve(); }, track(){}, presenceState(){ return {}; } }; return ch; };
    return { auth, from: t => new Q(t), rpc: async () => ({ data: null, error: null }), channel, removeChannel(){ return Promise.resolve(); } };
  }
  window.supabase = { createClient };
})();
""".replace("__USERS__", json.dumps(TEACHER))

CORS = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS"}
SESSION_JSON = json.dumps({"user": {"id": TEACHER["id"], "email": TEACHER["email"]}})


def fresh_db():
    st = lambda i, n: {"id": i, "owner": TEACHER["id"], "name": n, "grade": None, "exam": "oge", "note": "", "boards": [],
                       "dur_min": None, "account_email": None, "archived_at": None,
                       "created_at": "2026-01-01T00:00:00Z", "updated_at": "2026-01-01T00:00:00Z"}
    log = lambda i, k, e, at: {"id": i, "owner": TEACHER["id"], "student_id": VANYA, "task_key": k, "event": e,
                               "source": "trainer", "src_ref": "oge9.html", "at": at}
    return {
        "students": [st(VANYA, "Ваня"), st(PETYA, "Петя"),
                     {"id": "st-other", "owner": "22222222-2222-4222-8222-222222222222", "name": "Чужой", "archived_at": None}],
        "teacher_settings": [], "boards": [],
        "student_task_log": [
            log("l1", "fipi:oge:5", "ok", "2026-01-19T10:00:00Z"),
            log("l2", "fipi:oge:5", "ok", "2026-02-21T10:00:00Z"),
            log("l3", "fipi:oge:5", "hw", "2026-01-10T10:00:00Z"),
            log("l4", "gen:oge9:3", "bad", "2026-02-01T10:00:00Z"),
            log("l5", "gen:oge9:3:x", "ok", "2026-02-02T10:00:00Z"),
            log("l6", "gen:oge9:4", "ok", "2026-02-03T10:00:00Z"),
        ],
    }


STATE = {"db": json.dumps(fresh_db()), "offline": False}


def db():
    return json.loads(STATE["db"])


def handle_db(route, request):
    if STATE["offline"]:
        route.abort("internetdisconnected")
        return
    if request.method == "GET":
        route.fulfill(status=200, content_type="application/json", body=STATE["db"], headers=CORS)
    elif request.method == "POST":
        STATE["db"] = request.post_data or STATE["db"]
        route.fulfill(status=200, content_type="application/json", body="{}", headers=CORS)
    else:
        route.fulfill(status=204, headers=CORS)


def new_context(browser, signed_in=True, bind="tab"):
    ctx = browser.new_context(viewport={"width": 1100, "height": 800})
    ctx.route("https://**/*", lambda r: r.abort())
    ctx.route("https://fakesb.test/db", handle_db)
    ctx.route("**/supabase-js.umd.js", lambda r: r.fulfill(status=200, content_type="application/javascript", body=FAKE_SB_JS))
    init = "try{localStorage.setItem('teacher:settings:v1', JSON.stringify({sessionBind:%s}));" % json.dumps(bind)
    if signed_in:
        init += "localStorage.setItem('__fakesb_session', %s);" % json.dumps(SESSION_JSON)
    init += "}catch(e){}"
    # настройку и вход ставим один раз: init-скрипт идёт на каждой загрузке,
    # а тест меняет настройку по ходу
    ctx.add_init_script("if(!sessionStorage.getItem('__t_init')){sessionStorage.setItem('__t_init','1');if(!localStorage.getItem('__t_once')){localStorage.setItem('__t_once','1');" + init + "}}")
    return ctx


def open_page(ctx, path, errors):
    p = ctx.new_page()
    p.on("pageerror", lambda e: errors.append(path + ": " + str(e)))
    p.goto(f"{BASE}/{path}")
    p.wait_for_function("() => !!window.StudentMemory", timeout=10000)
    if PUMP["page"] is None or PUMP["page"].is_closed():
        PUMP["page"] = p
    return p


def cur(p):
    return p.evaluate("() => { const c = StudentMemory.current(); return c ? c.name : null; }")


def bar(p):
    return p.evaluate("() => { const b = document.getElementById('smBar'); return b ? b.innerText : ''; }")


def server_log(student=VANYA):
    return [r for r in db().get("student_task_log", []) if r["student_id"] == student]


# Ждать только через wait_for_timeout страницы: time.sleep в синхронном
# playwright не обслуживает маршруты, и запросы к заглушке базы висят
PUMP = {"page": None}


def nap(sec):
    PUMP["page"].wait_for_timeout(int(sec * 1000))


def wait_until(fn, timeout=8.0):
    end = time.time() + timeout
    while time.time() < end:
        if fn():
            return True
        nap(0.15)
    return fn()


def main():
    errors = []
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()

        # ── A. режим «вкладка»
        ctx = new_context(browser, bind="tab")
        a = open_page(ctx, "cabinet.html", errors)
        b = open_page(ctx, "cabinet.html", errors)
        a.evaluate("StudentMemory.start({id:%s, name:'Ваня'})" % json.dumps(VANYA))
        b.evaluate("StudentMemory.start({id:%s, name:'Петя'})" % json.dumps(PETYA))
        nap(0.5)
        check("A1 вкладка: в первой Ваня, во второй Петя", cur(a) == "Ваня" and cur(b) == "Петя", f"{cur(a)} / {cur(b)}")
        check("A2 плашка «Сессия: Ваня · пауза · закончить»",
              "Ваня" in bar(a) and "пауза" in bar(a) and "закончить" in bar(a), bar(a))
        a.reload(); a.wait_for_function("() => !!window.StudentMemory")
        check("A3 перезагрузка вкладки ученика не теряет", cur(a) == "Ваня")
        # вкладка «＋ Новая сессия»: копия sessionStorage открывшей, но свой код
        a.evaluate("""() => { sessionStorage.setItem('tsTab:code','AAAA2222');
            localStorage.setItem('tsSessions:v1', JSON.stringify([{code:'AAAA2222', n:1, updatedAt:Date.now()}]));
            StudentMemory.start({id:%s, name:'Ваня'}); }""" % json.dumps(VANYA))
        tab_copy = a.evaluate("() => sessionStorage.getItem('studentMem:tab')")
        c = ctx.new_page()
        c.on("pageerror", lambda e: errors.append("copy: " + str(e)))
        c.add_init_script("if(location.search.indexOf('copy')>=0 && !sessionStorage.getItem('__copied')){sessionStorage.setItem('__copied','1');sessionStorage.setItem('studentMem:tab', %s);sessionStorage.setItem('tsTab:code','BBBB3333');}" % json.dumps(tab_copy))
        c.goto(f"{BASE}/cabinet.html?copy=1")
        c.wait_for_function("() => !!window.StudentMemory")
        check("A4 «＋ Новая сессия» (копия хранилища, свой код) — без ученика", cur(c) is None, str(cur(c)))
        # та же вкладка сменила код (старого кода в списке больше нет) — ученик остаётся
        a.evaluate("""() => { sessionStorage.setItem('tsTab:code','CCCC4444');
            localStorage.setItem('tsSessions:v1', JSON.stringify([{code:'CCCC4444', n:1, updatedAt:Date.now()}])); }""")
        check("A5 смена кода в той же вкладке — ученик тот же", cur(a) == "Ваня" and cur(b) == "Петя")
        c.close()

        # ── B. режим «браузер»
        a.evaluate("() => TeacherSettings.set({sessionBind:'browser'})")
        nap(0.3)
        a.evaluate("StudentMemory.start({id:%s, name:'Ваня'})" % json.dumps(VANYA))
        nap(0.3)
        check("B1 браузер: вторая вкладка видит того же ученика", cur(b) == "Ваня", str(cur(b)))
        b.evaluate("StudentMemory.start({id:%s, name:'Петя'})" % json.dumps(PETYA))
        ok = wait_until(lambda: cur(a) == "Петя" and "Петя" in bar(a), 4)
        check("B2 браузер: ученик один на все вкладки, плашка соседней сменилась сама", ok, bar(a))
        b.evaluate("StudentMemory.end()")
        # в кабинете вместо плашки сессии — выбор ученика (data-picker)
        ok = wait_until(lambda: cur(a) is None and "Сессия:" not in bar(a) and "Начать сессию" in bar(a), 4)
        check("B3 «закончить» в одной вкладке — сессии нет и в другой", ok, bar(a))
        b.close()

        # ── D. журнал, сводки, пауза, «забыть»
        a.evaluate("StudentMemory.start({id:%s, name:'Ваня'})" % json.dumps(VANYA))
        s = a.evaluate("() => StudentMemory.summary('fipi:oge:5')")
        check("D1 журнал загружен при старте: fipi:oge:5 — решено 2 раза, в ДЗ 1",
              s and s["ok"]["n"] == 2 and s["hw"]["n"] == 1 and s["total"] == 3 and s["bad"] is None, json.dumps(s)[:300])
        k = a.evaluate("() => StudentMemory.kindSummary('gen:oge9:3')")
        check("D2 сводка по виду gen:oge9:3 — 2 события (bad и ok), вид 9.4 не входит",
              k and k["total"] == 2 and k["ok"]["n"] == 1 and k["bad"]["n"] == 1 and k["keys"] == 2, json.dumps(k)[:300])
        copy_len = a.evaluate("() => (localStorage.getItem('studentMem:log:' + %s) || '').length" % json.dumps(VANYA))
        check("D3 сжатая копия журнала в localStorage", 0 < copy_len < 400, str(copy_len))
        a.evaluate("StudentMemory.pause(true)")
        r = a.evaluate("() => StudentMemory.record('fipi:oge:77', 'ok')")
        check("D4 пауза — запись не идёт", r["reason"] == "paused" and "пауз" in bar(a), json.dumps(r))
        a.evaluate("StudentMemory.pause(false)")
        n = a.evaluate("() => StudentMemory.forget(['fipi:oge:5'])")
        check("D5 «забыть» задание: строки ушли с сервера и из копии",
              n == 3 and not [x for x in server_log() if x["task_key"] == "fipi:oge:5"]
              and a.evaluate("() => StudentMemory.summary('fipi:oge:5').total") == 0, str(n))
        a.evaluate("() => StudentMemory.forget(['gen:oge9:3'], {prefix:true})")
        keys_left = sorted(x["task_key"] for x in server_log())
        check("D6 «забыть вид»: ушли gen:oge9:3 и gen:oge9:3:x, gen:oge9:4 остался",
              keys_left == ["gen:oge9:4"] and a.evaluate("() => StudentMemory.keys()") == ["gen:oge9:4"], str(keys_left))

        # ── C. обрыв сети
        STATE["offline"] = True
        r = a.evaluate("() => StudentMemory.record('fipi:oge:101', 'ok', {source:'trainer', srcRef:'oge9.html'})")
        nap(1.0)
        q = a.evaluate("() => StudentMemory.queue()")
        check("C1 без сети: событие в очереди, на сервере нет",
              r["ok"] and len(q) == 1 and q[0]["task_key"] == "fipi:oge:101" and q[0]["event"] == "ok"
              and not [x for x in server_log() if x["task_key"] == "fipi:oge:101"], json.dumps(q)[:300])
        r2 = a.evaluate("() => StudentMemory.record('fipi:oge:101', 'ok')")
        check("C2 то же событие второй раз за 10 минут не пишется", r2["reason"] == "throttled", json.dumps(r2))
        r3 = a.evaluate("() => StudentMemory.record('fipi:oge:101', 'board')")
        check("C3 другое событие по тому же заданию пишется", r3["ok"])
        s = a.evaluate("() => StudentMemory.summary('fipi:oge:101')")
        check("C4 подпись видит событие сразу, до отправки", s["ok"]["n"] == 1 and s["board"]["n"] == 1)
        a.reload(); a.wait_for_function("() => !!window.StudentMemory")
        nap(1.0)
        check("C5 очередь пережила перезагрузку без сети", a.evaluate("() => StudentMemory.queue().length") == 2)
        STATE["offline"] = False
        a.reload(); a.wait_for_function("() => !!window.StudentMemory")
        ok = wait_until(lambda: len([x for x in server_log() if x["task_key"] == "fipi:oge:101"]) == 2
                        and a.evaluate("() => StudentMemory.queue().length") == 0)
        check("C6 связь вернулась — очередь ушла на сервер и опустела", ok,
              str([x["task_key"] for x in server_log()]))
        row = [x for x in server_log() if x["task_key"] == "fipi:oge:101" and x["event"] == "ok"][0]
        check("C7 в строке ученик, ключ, событие, источник, время",
              row["source"] == "trainer" and row["src_ref"] == "oge9.html" and row["at"] and "lesson_id" not in row, json.dumps(row))
        # повтор отправки той же строки (две вкладки, обрыв после записи) — без дубля
        a.evaluate("""(row) => { localStorage.setItem('studentMem:queue:v1', JSON.stringify([row])); return StudentMemory.flush(); }""",
                   {k: row[k] for k in ("id", "student_id", "task_key", "event", "source", "src_ref", "at")})
        nap(0.5)
        check("C8 повтор той же строки дубля не даёт",
              len([x for x in server_log() if x["id"] == row["id"]]) == 1 and a.evaluate("() => StudentMemory.queue().length") == 0)
        # страница без Supabase (neg_pos) пишет в очередь, отправляет кабинет
        a.evaluate("() => TeacherSettings.set({sessionBind:'browser'})")
        a.evaluate("StudentMemory.start({id:%s, name:'Ваня'})" % json.dumps(VANYA))
        r_page = open_page(ctx, "neg_pos.html", errors)
        r_page.wait_for_load_state("load")
        r = r_page.evaluate("() => [StudentMemory.record('fipi:rus:900', 'hw'), !!window.supabase, location.pathname]")
        check("C9а страница осталась neg_pos.html и без Supabase", r[1] is False and r[2].endswith("neg_pos.html"), str(r))
        r = r[0]
        ok = wait_until(lambda: [x for x in server_log() if x["task_key"] == "fipi:rus:900"])
        check("C9 тренажёр без Supabase (neg_pos) пишет в очередь, отправляет вкладка кабинета", r["ok"] and ok, json.dumps(r))
        r_page.close()
        a.close()
        ctx.close()

        # ── E. follower
        ctx = new_context(browser, bind="browser")
        f = ctx.new_page()
        f.on("pageerror", lambda e: errors.append("follower: " + str(e)))
        f.add_init_script("""sessionStorage.setItem('tsTab:role','follower');
            localStorage.setItem('studentMem:browser', JSON.stringify({student:{id:%s,name:'Ваня'}, paused:false, startedAt:1}));
            localStorage.removeItem('studentMem:log:%s');""" % (json.dumps(VANYA), VANYA))
        # кабинет: на нём нет session-share.js, который без живого канала
        # сбросил бы роль, и есть выбор ученика — он у follower тоже не рисуется.
        # rus_oge.html для этого не годится: он уводит на главную
        f.goto(f"{BASE}/cabinet.html")
        f.wait_for_function("() => !!window.StudentMemory")
        PUMP["page"] = f
        nap(1.0)
        rf = f.evaluate("() => StudentMemory.record('fipi:rus:1', 'ok')")
        check("E1 follower: ученика нет, плашки нет, запись отклонена",
              cur(f) is None and bar(f) == "" and f.locator("#smBar").count() == 0 and rf["reason"] == "follower", json.dumps(rf))
        check("E2 follower: ничего не грузит (нет копии журнала, нет очереди)",
              f.evaluate("() => localStorage.getItem('studentMem:log:%s') === null && StudentMemory.queue().length === 0" % VANYA))
        g = ctx.new_page()
        g.on("pageerror", lambda e: errors.append("follower2: " + str(e)))
        g.goto(f"{BASE}/cabinet.html?s=ABCD2345")
        g.wait_for_function("() => !!window.StudentMemory")
        PUMP["page"] = g
        nap(1.0)
        calls = g.evaluate("() => (window.__sbCalls || []).filter(c => c.indexOf('student_task_log') === 0)")
        check("E3 вход по ссылке ?s=: плашки нет, к журналу запросов нет",
              cur(g) is None and g.locator("#smBar").count() == 0 and calls == [], str(calls))
        ctx.close()

        # ── F. главная и карточка
        ctx = new_context(browser, signed_in=False, bind="browser")
        h = open_page(ctx, "index.html", errors)
        PUMP["page"] = h
        nap(1.0)
        check("F1 главная без входа — кнопки выбора ученика нет", h.locator("#smBar").count() == 0)
        ctx.close()
        ctx = new_context(browser, signed_in=True, bind="browser")
        h = open_page(ctx, "index.html", errors)
        PUMP["page"] = h
        h.wait_for_selector("#smBar [data-sm=pick]", timeout=5000)
        h.click("#smBar [data-sm=pick]")
        h.wait_for_selector("#smMenu [data-sm=start]", timeout=5000)
        names = h.locator("#smMenu [data-sm=start]").all_inner_texts()
        check("F2 главная: список своих учеников (чужого нет)", names == ["Ваня", "Петя"], str(names))
        h.click("#smMenu [data-sm=start][data-name='Петя']")
        ok = wait_until(lambda: "Сессия: Петя" in bar(h), 4)
        check("F3 выбрали ученика — плашка «Сессия: Петя»", ok, bar(h))
        h.click("#smBar [data-sm=end]")
        ok = wait_until(lambda: "Начать сессию" in bar(h), 4)
        check("F4 «закончить» — снова выбор ученика", ok, bar(h))
        k = open_page(ctx, "cabinet.html#/students/" + VANYA, errors)
        k.wait_for_selector("#cSession", timeout=8000)
        check("F5 карточка: «Начать сессию» включена", k.is_enabled("#cSession") and k.inner_text("#cSession") == "Начать сессию")
        k.click("#cSession")
        ok = wait_until(lambda: k.inner_text("#cSession") == "Закончить сессию" and "Сессия: Ваня" in bar(k), 4)
        check("F6 карточка: сессия с Ваней, кнопка «Закончить сессию»", ok, k.inner_text("#cSession") + " | " + bar(k))
        ok = wait_until(lambda: "Сессия: Ваня" in bar(h), 4)
        check("F7 главная в соседней вкладке показывает Ваню", ok, bar(h))
        k.click("#cSession")
        ok = wait_until(lambda: k.inner_text("#cSession") == "Начать сессию" and cur(k) is None, 4)
        check("F8 «Закончить сессию» из карточки", ok)
        ctx.close()
        browser.close()

    check("G нет ошибок JavaScript", not errors, "; ".join(errors)[:600])
    print()
    print("ИТОГ:", "всё зелёное" if not FAILS else f"упало {len(FAILS)}: " + ", ".join(FAILS))
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
