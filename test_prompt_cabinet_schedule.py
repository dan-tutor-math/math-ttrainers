"""
Расписание в кабинете, задача В1а: schedule.js, schedule-cloud.js,
schedule.css, вкладка «Расписание» в cabinet.html.

Supabase — заглушка (FAKE_SB_JS), как в test_prompt_cabinet_page.py, плюс
то, что зовёт schedule-cloud.js: gte/lte/in, delete, вставка списком,
каскад lesson_students при удалении занятия, unique (lesson_id, student_id).
«База» — общий JSON у теста (https://fakesb.test/db): после перезагрузки
страница видит только то, что легло в «сервер». Права и схему по-настоящему
проверяет test_prompt_cabinet_schema.py.

Проверяет:
  A. разбор быстрого ввода и поиск ученика по имени;
  B. «Строки»: «15:00 Маша, Петя» → занятие-пара, длительность ученика (90);
     незнакомое имя — вопрос, «Оставить гостем» (guest_name, ученик не
     заводится), «Завести ученика»; время «с – по» из «10:30-11:15»;
  C. статус ученика одним нажатием ○ → ✓ → ✕, формат через список;
  D. «Неделя»: клик по пустому окну — новое занятие (длительность из
     настройки), перетаскивание на другой день и время, растягивание —
     шаг 15 минут; карточка занятия: смена формата; полупараллелка и пара
     подписаны на плашке; свободные окна — пустые клетки;
  E. после перезагрузки всё на месте в обоих видах, вид запомнился;
  F. неделя ‹ › и «Сегодня», удаление занятия, свои названия форматов;
  G. телефон 375: по умолчанию «Строки», без прокрутки вбок; нет ошибок JS.

Запуск: python3 test_prompt_cabinet_schedule.py (сервер поднимается сам).
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
PORT = 8962
BASE = f"http://127.0.0.1:{PORT}"
FAILS = []
WEEK = "2026-11-16"          # понедельник
TEACHER = {"id": "11111111-1111-4111-8111-111111111111", "email": "teacher@test.ru", "password": "secret1"}
OTHER_ID = "22222222-2222-4222-8222-222222222222"


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
  let seq = 0;
  const uid4 = p => p + '-' + (++seq) + '-' + Math.random().toString(36).slice(2, 8);
  const DEF = {
    students: () => ({ id: uid4('st'), boards: [], note: '', archived_at: null, dur_min: null, grade: null, exam: null }),
    lessons: () => ({ id: uid4('les'), start_min: null, dur_min: 60, format: 'single', is_event: false, title: '', note: '',
                      board_id: null, group_id: null, from_slot: null, ext_id: null }),
    lesson_students: () => ({ id: uid4('ls'), status: 'plan', pos: 0, student_id: null, guest_name: null }),
  };
  class Q {
    constructor(t){ this.t = t; this.op = 'select'; this.f = []; this.ord = []; this.one = null; this.payload = null; }
    select(){ return this; }
    insert(r){ this.op = 'insert'; this.payload = r; return this; }
    update(o){ this.op = 'update'; this.payload = o; return this; }
    upsert(r){ this.op = 'upsert'; this.payload = r; return this; }
    delete(){ this.op = 'delete'; return this; }
    eq(c, v){ this.f.push(r => r[c] === v); return this; }
    gte(c, v){ this.f.push(r => r[c] >= v); return this; }
    lte(c, v){ this.f.push(r => r[c] <= v); return this; }
    in(c, vs){ this.f.push(r => vs.indexOf(r[c]) >= 0); return this; }
    order(c, o){ this.ord.push([c, !(o && o.ascending === false)]); return this; }
    single(){ this.one = 'single'; return this; }
    maybeSingle(){ this.one = 'maybe'; return this; }
    then(res, rej){
      return tx(db => this.run(db)).then(data => ({ data, error: null }), e => ({ data: null, error: { message: e.message } })).then(res, rej);
    }
    run(db){
      const s = sess(); const uid = s ? s.user.id : null;
      if (!uid) throw new Error('permission denied for table ' + this.t);
      db[this.t] = db[this.t] || [];
      const rows = db[this.t];
      const match = r => r.owner === uid && this.f.every(f => f(r));   // RLS: только свои
      let out;
      if (this.op === 'insert'){
        const list = (Array.isArray(this.payload) ? this.payload : [this.payload])
          .map(r => Object.assign((DEF[this.t] || (() => ({})))(), r, { owner: uid, created_at: now(), updated_at: now() }));
        list.forEach(r => {
          if (this.t === 'students' && (!r.name || r.name.length > 80)) throw new Error('violates check constraint students_name_check');
          if (this.t === 'lesson_students'){
            if ((r.student_id == null) === (r.guest_name == null)) throw new Error('violates check constraint lesson_students_check');
            if (!(db.lessons || []).some(l => l.id === r.lesson_id && l.owner === uid)) throw new Error('violates foreign key constraint');
            if (r.student_id && rows.concat(list.filter(x => x !== r && list.indexOf(x) < list.indexOf(r)))
                  .some(x => x.lesson_id === r.lesson_id && x.student_id === r.student_id)) throw new Error('duplicate key value violates unique constraint');
          }
          if (this.t === 'lessons' && (r.dur_min < 5 || r.dur_min > 720 || (r.start_min != null && (r.start_min < 0 || r.start_min > 1439))))
            throw new Error('violates check constraint lessons_check');
        });
        list.forEach(r => rows.push(r));
        out = list;
      } else if (this.op === 'update'){
        out = rows.filter(match);
        out.forEach(r => Object.assign(r, this.payload, { updated_at: now() }));
      } else if (this.op === 'upsert'){
        const p = Object.assign({}, this.payload, { owner: uid });
        let r = rows.find(x => x.owner === uid);
        if (r) Object.assign(r, p, { updated_at: now() }); else rows.push(Object.assign(p, { updated_at: now() }));
        out = [p];
      } else if (this.op === 'delete'){
        out = rows.filter(match);
        db[this.t] = rows.filter(r => out.indexOf(r) < 0);
        // каскад: участники уходят вместе с занятием
        if (this.t === 'lessons') db.lesson_students = (db.lesson_students || []).filter(p => !out.some(l => l.id === p.lesson_id));
      } else {
        out = rows.filter(match);
      }
      out = copy(out);
      if (this.ord.length) out.sort((a, b) => {
        for (const [c, asc] of this.ord){
          const x = a[c] == null ? -Infinity : a[c], y = b[c] == null ? -Infinity : b[c];
          if (x < y) return asc ? -1 : 1;
          if (x > y) return asc ? 1 : -1;
        }
        return 0;
      });
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

STATE = {"db": ""}
CORS = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS"}


def st_row(sid, name, dur=None, archived=None, owner=TEACHER["id"]):
    return {"id": sid, "owner": owner, "name": name, "grade": None, "exam": None, "note": "", "boards": [], "dur_min": dur,
            "archived_at": archived, "created_at": "2026-01-01T00:00:00Z", "updated_at": "2026-01-01T00:00:00Z"}


def fresh_db():
    return {
        "students": [st_row("st-masha", "Маша Иванова", 90), st_row("st-petya", "Петя Сидоров"),
                     st_row("st-old", "Маша Старая", archived="2026-02-01T00:00:00Z"),
                     st_row("st-other", "Чужой Ученик", owner=OTHER_ID)],
        "teacher_settings": [], "lessons": [], "lesson_students": [], "boards": [],
    }


STATE["db"] = json.dumps(fresh_db())


def db():
    return json.loads(STATE["db"])


def lessons():
    return sorted([l for l in db()["lessons"] if l["owner"] == TEACHER["id"]], key=lambda l: (l["day"], l["start_min"] or -1))


def people(lesson_id):
    return sorted([p for p in db()["lesson_students"] if p["lesson_id"] == lesson_id], key=lambda p: p["pos"])


def handle_db(route, request):
    if request.method == "GET":
        route.fulfill(status=200, content_type="application/json", body=STATE["db"], headers=CORS)
    elif request.method == "POST":
        STATE["db"] = request.post_data or STATE["db"]
        route.fulfill(status=200, content_type="application/json", body="{}", headers=CORS)
    else:
        route.fulfill(status=204, headers=CORS)


# «сегодня» в браузере — среда 18.11.2026, 12:00 по местному времени, часы
# идут дальше. Без этого «Сегодня», подсветка дня и неделя по умолчанию
# зависели бы от дня запуска теста
FIXED_NOW_JS = r"""
(() => {
  const R = Date, OFF = new R(2026, 10, 18, 12, 0, 0).getTime() - R.now();
  class D extends R {
    constructor(...a){ if (a.length) super(...a); else super(R.now() + OFF); }
    static now(){ return R.now() + OFF; }
  }
  window.Date = D;
})();
"""


def new_context(browser, **kw):
    ctx = browser.new_context(**kw)
    ctx.add_init_script(FIXED_NOW_JS)
    ctx.route("https://**/*", lambda r: r.abort())
    ctx.route("https://fakesb.test/db", handle_db)
    ctx.route("**/supabase-js.umd.js", lambda r: r.fulfill(status=200, content_type="application/javascript", body=FAKE_SB_JS))
    return ctx


def signed_in(page, view=None):
    page.goto(f"{BASE}/cabinet.html")
    page.evaluate("(a) => { localStorage.setItem('__fakesb_session', JSON.stringify({user:{id:a[0],email:'t@t'}}));"
                  " if (a[1]) localStorage.setItem('cabinet:schedule:view', a[1]); }", [TEACHER["id"], view])


PAGE = {"p": None}


def wait_db(cond, what, timeout=5.0):
    # ждать через страницу, а не time.sleep: заглушку базы обслуживает этот же
    # поток Python (ctx.route), во сне её запросы стоят
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            if cond():
                return True
        except Exception:
            pass
        PAGE["p"].wait_for_timeout(50)
    print("   (ждали: " + what + ")")
    return False


def open_schedule(page, week=WEEK):
    page.goto(f"{BASE}/cabinet.html#/schedule/{week}")
    # переход только по хешу страницу не перезагружает — вход и вид читаются при загрузке
    page.reload()
    page.wait_for_selector("#scHost .sc-body", timeout=5000)
    page.wait_for_function("() => !document.querySelector('#scBody .empty') || document.querySelector('#scBody .empty').textContent.indexOf('Загружаем') < 0")


def main():
    errors = []
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = new_context(browser, viewport={"width": 1280, "height": 1500})
        page = ctx.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)))
        PAGE["p"] = page
        signed_in(page, "list")
        open_schedule(page)

        # ── A. разбор ввода
        pq = page.evaluate("""() => [Schedule.parseQuick('15:00 Маша, Петя'), Schedule.parseQuick('9.30-11 Вася'),
                                     Schedule.parseQuick('15 Петя,петя'), Schedule.parseQuick('Маша'), Schedule.parseQuick('25:00 Маша')]""")
        check("A1 «15:00 Маша, Петя»", pq[0] == {"start": 900, "end": None, "names": ["Маша", "Петя"]}, str(pq[0]))
        check("A2 «9.30-11 Вася» — с и по", pq[1] == {"start": 570, "end": 660, "names": ["Вася"]}, str(pq[1]))
        check("A3 «15 Петя,петя» — без повтора", pq[2] == {"start": 900, "end": None, "names": ["Петя"]}, str(pq[2]))
        check("A4 без времени", pq[3]["start"] is None and pq[3]["names"] == ["Маша"])
        check("A5 неверное время не принимается за время", pq[4]["start"] is None)
        mt = page.evaluate("""() => { const L = [{id:1,name:'Маша Иванова'},{id:2,name:'Маша Петрова'},{id:3,name:'Пётр Сидоров'}];
                                       return [Schedule.matchName('маша иванова', L).length, Schedule.matchName('Маша', L).length,
                                               Schedule.matchName('Петр', L).map(s => s.id), Schedule.matchName('Вася', L).length]; }""")
        check("A6 поиск ученика: полное имя, неоднозначно, ё/е, нет", mt == [1, 2, [3], 0], str(mt))

        # ── B. «Строки»: дни карточками, строка добавляется и правится на месте
        check("B1 семь дней карточками, вид «Строки»", page.locator(".sc-day").count() == 7 and page.is_visible(".sc-views button.on[data-v=list]"))
        check("B2 шапка недели", "16 – 22 ноября 2026" in page.inner_text("#scRange"), page.inner_text("#scRange"))
        mon = f".sc-day[data-day='{WEEK}']"
        tue = ".sc-day[data-day='2026-11-17']"
        focused = lambda cls: page.wait_for_function(f"() => document.activeElement && document.activeElement.classList.contains('{cls}')", timeout=4000)
        check("B2a постоянных полей ввода нет", page.locator(".sc-days input").count() == 0)
        page.click(f".rw-add[data-add='{WEEK}']")
        focused("rw-in-time")
        page.keyboard.type("1500")
        page.keyboard.press("Enter")
        focused("rw-in-names")
        page.keyboard.type("Маша, Петя")
        page.keyboard.press("Enter")
        wait_db(lambda: len(lessons()) == 1, "занятие в базе")
        L = lessons()
        ok = len(L) == 1 and (L[0]["day"], L[0]["start_min"], L[0]["dur_min"], L[0]["format"]) == (WEEK, 900, 90, "pair")
        check("B3 «1500» → 15:00, 90 мин (своя у Маши), пара", ok, str(L))
        if L: wait_db(lambda: len(people(L[0]["id"])) == 2, "участники в базе")
        P = people(L[0]["id"]) if L else []
        check("B4 участники — ссылки на учеников", [p["student_id"] for p in P] == ["st-masha", "st-petya"], str(P))
        mid = L[0]["id"]
        row = lambda day, lid: f".sc-day[data-day='{day}'] .rw-row[data-id='{lid}']"
        page.wait_for_selector(row(WEEK, mid))
        check("B5 строка «15:00», имена столбиком (пара)",
              page.inner_text(row(WEEK, mid) + " .rw-time") == "15:00" and page.locator(row(WEEK, mid) + " .rw-p").count() == 2
              and "multi" in page.get_attribute(row(WEEK, mid), "class"), page.inner_text(row(WEEK, mid)))
        focused("rw-in-names")
        check("B6 Enter — новая строка ниже, время после занятия (16:30)",
              page.input_value(f"{mon} .rw-row.draft .rw-in-time") == "16:30" and page.input_value(f"{mon} .rw-row.draft .rw-in-names") == "")
        page.keyboard.press("Escape")
        page.wait_for_selector(f"{mon} .rw-row.draft", state="detached")

        page.click(".rw-add[data-add='2026-11-17']")
        focused("rw-in-time")
        page.keyboard.press("Enter")                      # без времени — сразу к именам, время можно написать в строке
        focused("rw-in-names")
        page.keyboard.type("10:30-11:15 Петя, Вася")
        page.keyboard.press("Enter")
        page.wait_for_selector(f"{tue} .sc-ask")
        check("B7 незнакомое имя — вопрос под строкой, ничего не создано молча",
              "Вася" in page.inner_text(f"{tue} .sc-ask") and len(lessons()) == 1 and len(db()["students"]) == 4)
        page.click(f"{tue} .sc-ask button[data-act=guest]")
        wait_db(lambda: len(lessons()) == 2, "второе занятие")
        L2 = [l for l in lessons() if l["day"] == "2026-11-17"]
        tid = L2[0]["id"] if L2 else None
        wait_db(lambda: len(people(tid)) == 2, "участники второго")
        P2 = people(tid) if L2 else []
        check("B8 гость: guest_name, ученик не заведён, 10:30–11:15",
              L2 and (L2[0]["start_min"], L2[0]["dur_min"]) == (630, 45) and [p.get("guest_name") for p in P2] == [None, "Вася"]
              and len(db()["students"]) == 4, str(L2) + str(P2))
        page.wait_for_selector(f"{tue} .rw-row.draft .rw-in-names")
        focused("rw-in-names")
        page.keyboard.press("ArrowLeft")                  # ← в пустом имени — к времени
        focused("rw-in-time")
        page.fill(f"{tue} .rw-row.draft .rw-in-time", "12")
        page.keyboard.press("Enter")
        focused("rw-in-names")
        page.keyboard.type("Коля")
        page.keyboard.press("Enter")
        page.wait_for_selector(f"{tue} .sc-ask button[data-act=create]")
        page.click(f"{tue} .sc-ask button[data-act=create]")
        wait_db(lambda: len(lessons()) == 3, "третье занятие")
        kolya = [s for s in db()["students"] if s["name"] == "Коля"]
        L3 = [l for l in lessons() if l["start_min"] == 720]
        if L3: wait_db(lambda: len(people(L3[0]["id"])) == 1, "участник третьего")
        check("B9 «12» → 12:00, «Завести ученика»: Коля, 60 мин, индивидуальное",
              len(kolya) == 1 and L3 and (L3[0]["dur_min"], L3[0]["format"]) == (60, "single")
              and people(L3[0]["id"])[0]["student_id"] == kolya[0]["id"], str(L3))
        kid = L3[0]["id"] if L3 else None
        page.keyboard.press("Escape")
        page.wait_for_function(f"() => document.querySelectorAll(\"{tue} .rw-row:not(.draft)\").length === 2")
        check("B10 во вторнике 10:30 раньше 12:00",
              page.locator(f"{tue} .rw-time").all_inner_texts() == ["10:30", "12:00"], str(page.locator(f"{tue} .rw-time").all_inner_texts()))

        # ── C. статусы и правка на месте
        masha_st = f"{row(WEEK, mid)} .rw-p:has-text('Маша Иванова') [data-pst]"
        petya_st = f"{row(WEEK, mid)} .rw-p:has-text('Петя Сидоров') [data-pst]"
        page.click(masha_st)
        wait_db(lambda: people(mid)[0]["status"] == "done", "статус done")
        check("C1 одно нажатие — проведено (в базе, значок-галочка)",
              people(mid)[0]["status"] == "done" and "st-done" in page.get_attribute(masha_st, "class"))
        page.click(petya_st)
        page.click(petya_st)
        wait_db(lambda: people(mid)[1]["status"] == "move", "статус move")
        check("C2 второе нажатие — перенос (порядок Даниила: проведено → перенос → отменено)", people(mid)[1]["status"] == "move")
        page.click(petya_st)
        wait_db(lambda: people(mid)[1]["status"] == "skip", "статус skip")
        check("C3 третье — отменено, у каждого свой статус; имя зачёркнуто",
              (people(mid)[0]["status"], people(mid)[1]["status"]) == ("done", "skip")
              and page.locator(f"{row(WEEK, mid)} .rw-p:has-text('Петя Сидоров') .nm.x").count() == 1)
        page.click(f"{row('2026-11-17', tid)} [data-rst]")
        wait_db(lambda: [p["status"] for p in people(tid)] == ["done", "done"], "статус всем")
        check("C4 статус всей строки одним нажатием (пара — обоим)", [p["status"] for p in people(tid)] == ["done", "done"])
        page.click(f"{row('2026-11-17', kid)} .rw-time")
        focused("rw-in-time")
        page.fill(f"{row('2026-11-17', kid)} .rw-in-time", "1315")
        page.keyboard.press("Enter")
        wait_db(lambda: [l for l in lessons() if l["id"] == kid][0]["start_min"] == 795, "время 13:15")
        check("C5 время правится на месте: «1315» → 13:15", [l for l in lessons() if l["id"] == kid][0]["start_min"] == 795)
        focused("rw-in-names")                            # Enter во времени — к именам той же строки
        page.fill(f"{row('2026-11-17', kid)} .rw-in-names", "Коля, Петя")
        page.keyboard.press("Enter")
        wait_db(lambda: len(people(kid)) == 2, "Петя добавлен")
        wait_db(lambda: [l for l in lessons() if l["id"] == kid][0]["format"] == "pair", "формат pair")
        check("C6 имена правятся на месте: «Коля, Петя» — Петя добавлен, формат «пара»",
              [p["student_id"] for p in people(kid)] == [kolya[0]["id"], "st-petya"] and [l for l in lessons() if l["id"] == kid][0]["format"] == "pair")
        page.keyboard.press("Escape")
        page.click(f"{row('2026-11-17', kid)} .rw-names")
        page.fill(f"{row('2026-11-17', kid)} .rw-in-names", "Коля")
        page.keyboard.press("Tab")
        page.mouse.click(5, 5)
        wait_db(lambda: len(people(kid)) == 1, "Петя убран")
        check("C7 убрать имя из строки — участник удалён", [p["student_id"] for p in people(kid)] == [kolya[0]["id"]])

        # ── D. «Неделя»
        page.click(".sc-views button[data-v=grid]")
        page.wait_for_selector(".sc-grid")
        HH0 = page.evaluate("() => { const c = document.querySelector('.sc-col'); return parseFloat(getComputedStyle(c).backgroundSize.split(' ')[1]); }")
        PXM = HH0 / 60
        check("D1 сетка: 7 колонок, 3 плашки", page.locator(".sc-col").count() == 7 and page.locator(".sc-plate").count() == 3)
        h = page.eval_on_selector(f".sc-plate[data-id='{mid}']", "e => e.getBoundingClientRect().height")
        h2 = page.eval_on_selector(f".sc-plate[data-id='{tid}']", "e => e.getBoundingClientRect().height")
        check("D2 высота по длительности (90 и 45 минут)", abs((h - h2) - 45 * PXM) < 2, f"{h} {h2}")
        check("D2a масштаб по умолчанию: в плашке 45 минут видно имя (час ≥ 77px)", HH0 >= 77, str(HH0))
        check("D3 цвет плашки — статус: оба проведены — зелёная; имена не на строке времени",
              "st-done" in page.get_attribute(f".sc-plate[data-id='{tid}']", "class")
              and "Петя" not in page.inner_text(f".sc-plate[data-id='{tid}'] .sc-ph"))
        a = int(page.get_attribute(".sc-grid", "data-a"))
        wed = page.locator(".sc-col[data-day='2026-11-18']").bounding_box()
        page.mouse.move(wed["x"] + wed["width"] / 2, wed["y"] + (17 * 60 - a) * PXM + 12)
        check("D3a наведение на пустое — подсветка получаса «+ 17:00»", page.inner_text(".sc-col[data-day='2026-11-18'] .sc-hv") == "+ 17:00")
        page.mouse.click(wed["x"] + wed["width"] / 2, wed["y"] + (17 * 60 - a) * PXM + 12)
        page.wait_for_selector(".sc-modal #edNames")
        check("D4 клик по пустому окну ср 17:00 — новое занятие с 17:00 до 18:00",
              (page.input_value("#edDay"), page.input_value("#edStart"), page.input_value("#edEnd")) == ("2026-11-18", "17:00", "18:00"),
              str((page.input_value("#edDay"), page.input_value("#edStart"), page.input_value("#edEnd"))))
        page.fill("#edNames", "Петя")
        page.click("#edCreate")
        wait_db(lambda: len(lessons()) == 4, "занятие из сетки")
        W = [l for l in lessons() if l["day"] == "2026-11-18"]
        check("D5 занятие из сетки в базе: ср 17:00, 60 мин", W and (W[0]["start_min"], W[0]["dur_min"]) == (1020, 60), str(W))
        page.wait_for_selector(".sc-modal", state="detached")
        wid = W[0]["id"]
        pl = page.locator(f".sc-plate[data-id='{wid}']").bounding_box()
        colw = wed["width"] + 8
        page.mouse.move(pl["x"] + pl["width"] / 2, pl["y"] + 30)
        page.mouse.down()
        page.mouse.move(pl["x"] + pl["width"] / 2 + colw * 0.5, pl["y"] + 40, steps=4)
        page.mouse.move(pl["x"] + pl["width"] / 2 + colw, pl["y"] + 30 + 34, steps=6)   # +34px → шаг 15: +30 минут
        page.mouse.up()
        wait_db(lambda: [l for l in lessons() if l["id"] == wid][0]["day"] == "2026-11-19", "перенос на четверг")
        W = [l for l in lessons() if l["id"] == wid][0]
        check("D6 перетащили на четверг и на 30 минут позже (шаг 15)", (W["day"], W["start_min"], W["dur_min"]) == ("2026-11-19", 1050, 60), str(W))
        page.wait_for_selector(f".sc-col[data-day='2026-11-19'] .sc-plate[data-id='{wid}']")
        rz = page.locator(f".sc-plate[data-id='{wid}'] .sc-rz").bounding_box()
        page.mouse.move(rz["x"] + rz["width"] / 2, rz["y"] + rz["height"] / 2)
        page.mouse.down()
        page.mouse.move(rz["x"] + rz["width"] / 2, rz["y"] + 20, steps=3)
        page.mouse.move(rz["x"] + rz["width"] / 2, rz["y"] + 4 + 60, steps=5)            # +60px → +45 минут
        page.mouse.up()
        wait_db(lambda: [l for l in lessons() if l["id"] == wid][0]["dur_min"] == 105, "растягивание")
        W = [l for l in lessons() if l["id"] == wid][0]
        check("D7 растянули до 105 минут", (W["start_min"], W["dur_min"]) == (1050, 105), str(W))
        page.wait_for_function(f"() => document.querySelector(\".sc-plate[data-id='{wid}'] .sc-pt\").textContent === '17:30'")
        check("D8 на плашке — только начало «17:30» (по умолчанию)", True)
        pm = page.locator(f".sc-plate[data-id='{mid}']").bounding_box()
        page.mouse.click(pm["x"] + pm["width"] - 20, pm["y"] + pm["height"] - 14)
        page.wait_for_selector(".sc-side #spEdit")
        page.click("#spEdit")
        page.wait_for_selector(".sc-modal #edFmt button")
        check("D9 карточка: ученики со статусами", page.locator(".sc-edp").count() == 2 and "проведено" in page.inner_text(".sc-edpeople"))
        page.click("#edFmt button[data-v=group]")
        wait_db(lambda: [l for l in lessons() if l["id"] == mid][0]["format"] == "group", "формат group")
        check("D10 формат из карточки — «Группа» в базе", [l for l in lessons() if l["id"] == mid][0]["format"] == "group")
        page.click("#edFmt button[data-v=pair]")
        wait_db(lambda: [l for l in lessons() if l["id"] == mid][0]["format"] == "pair", "формат pair")
        page.keyboard.press("Escape")
        page.wait_for_selector(".sc-modal", state="detached")
        page.keyboard.press("Escape")
        page.wait_for_selector(".sc-side", state="detached")
        check("D11 свободные окна видны: в субботу плашек нет", page.locator(".sc-col[data-day='2026-11-21'] .sc-plate").count() == 0)
        # имя → карточка ученика
        page.click(f".sc-plate[data-id='{mid}'] [data-p$='|{P[1]['id']}']")
        page.wait_for_selector(".sc-scard")
        check("D12 щелчок по имени — карточка ученика: имя, статус, «К оплатам»",
              "Петя Сидоров" in page.inner_text(".sc-scard") and page.locator(".sc-scard [data-set=skip].on").count() == 1
              and page.locator(".sc-scard a[href='#/payments/st-petya']").count() == 1)
        page.click(".sc-scard [data-set=move]")
        wait_db(lambda: people(mid)[1]["status"] == "move", "статус из карточки")
        page.click(".sc-scard [data-set=skip]")
        wait_db(lambda: people(mid)[1]["status"] == "skip", "статус из карточки обратно")
        check("D13 статус из карточки ученика пишется в базу", people(mid)[1]["status"] == "skip")
        page.keyboard.press("Escape")
        page.wait_for_selector(".sc-scard", state="detached")
        page.click(f".sc-plate[data-id='{mid}'] [data-exp]")
        page.wait_for_selector(f".sc-plate.open[data-id='{mid}'] .sc-plist")
        check("D14 стрелка раскрывает пару: список всех со своими статусами",
              page.locator(f".sc-plate[data-id='{mid}'] .sc-plist .sc-prow").count() == 2 and page.locator(f".sc-plate[data-id='{mid}'] [data-pst]").count() == 2)
        page.click(f".sc-plate[data-id='{mid}'] [data-exp]")
        page.wait_for_selector(f".sc-plate.open[data-id='{mid}']", state="detached")
        # меню «Вид»
        page.click("#scLook")
        page.wait_for_selector(".gm-menu.on")
        check("D15 «Вид» — своё меню с примерами плашек (не select)",
              page.locator(".gm-menu .sc-lookpv").count() >= 6 and page.locator("select").count() == 0)
        page.click(".gm-menu .gm-item:has-text('Начало и конец')")
        page.wait_for_function(f"() => document.querySelector(\".sc-plate[data-id='{wid}'] .sc-pt\").textContent === '17:30–19:15'")
        page.click(".gm-menu .gm-item:has-text('Число')")
        page.wait_for_selector(f".sc-plate[data-id='{mid}'] .sc-pc")
        check("D16 «Начало и конец» и «Число»: 17:30–19:15, «1 из 2»",
              page.inner_text(f".sc-plate[data-id='{mid}'] .sc-pc") == "1 из 2")
        page.click(".gm-menu .gm-item:has-text('Только начало')")
        page.click(".gm-menu .gm-item:has-text('Имена')")
        page.keyboard.press("Escape")
        page.wait_for_selector(".gm-menu", state="detached")
        check("D17 вид запомнился на устройстве", page.evaluate("() => JSON.parse(localStorage.getItem('cabinet:schedule:look')).grp") == "names")
        # высота часа — за линию часа, как в таблице
        sat = page.locator(".sc-col[data-day='2026-11-21']").bounding_box()
        y_line = sat["y"] + 1 + 2 * HH0
        page.mouse.move(sat["x"] + 40, y_line)
        check("D18 у линии часа курсор «↕»", page.evaluate("() => document.querySelector('.sc-grid').classList.contains('rs')"))
        page.mouse.down()
        page.mouse.move(sat["x"] + 40, y_line + 20, steps=3)
        page.mouse.move(sat["x"] + 40, y_line + 40, steps=3)
        page.mouse.up()
        hh2 = page.evaluate("() => JSON.parse(localStorage.getItem('cabinet:schedule:look')).hh")
        check("D19 как в таблице: линию 2-го часа потянули на 40px — час вырос на 40px", hh2 == HH0 + 40, str(hh2))
        page.click("#scLook")
        page.click(".gm-menu .gm-item:has-text('Масштаб по умолчанию')")
        page.wait_for_selector(".gm-menu", state="detached")
        check("D20 масштаб по умолчанию — подбирается сам", page.evaluate("() => JSON.parse(localStorage.getItem('cabinet:schedule:look')).hh") is None)

        # ── E. перезагрузка
        page.reload()
        page.wait_for_selector(".sc-grid", timeout=5000)
        check("E1 вид «Неделя» запомнился", page.is_visible(".sc-views button.on[data-v=grid]"))
        check("E2 после перезагрузки 4 плашки, четверг 17:30",
              page.locator(".sc-plate").count() == 4
              and page.inner_text(f".sc-col[data-day='2026-11-19'] .sc-plate[data-id='{wid}'] .sc-pt") == "17:30")
        hh = page.eval_on_selector(f".sc-plate[data-id='{wid}']", "e => e.getBoundingClientRect().height")
        check("E3 высота плашки = 105 минут", abs(hh - (105 * PXM - 4)) < 2, str(hh))
        page.click(".sc-views button[data-v=list]")
        page.wait_for_selector(".sc-days")
        check("E5 «Строки» после перезагрузки: статусы на месте",
              "st-done" in page.get_attribute(masha_st, "class") and "st-skip" in page.get_attribute(petya_st, "class"))
        check("E6 гость на месте", page.locator(f"{tue} .rw-guest").count() == 1)
        check("E7 четверг: «17:30»", page.inner_text(".sc-day[data-day='2026-11-19'] .rw-time") == "17:30")

        # ── F. неделя, удаление, названия форматов
        page.click("#scNext")
        page.wait_for_function("() => document.getElementById('scRange').textContent.indexOf('23 – 29 ноября') >= 0")
        page.wait_for_selector(".sc-days")
        check("F1 › — следующая неделя пустая", page.locator(".rw-row").count() == 0 and "/schedule/2026-11-23" in page.url)
        page.click("#scPrev")
        page.wait_for_selector(".rw-row")
        check("F2 ‹ — назад, занятия на месте", page.locator(".rw-row").count() == 4)
        page.click("#scToday")
        page.wait_for_function("() => location.hash === '#/schedule'")
        page.wait_for_selector("#scToday[aria-current]")
        page.wait_for_selector(".sc-day.today")
        check("F3 «Сегодня» — неделя 16–22 ноября, подсвечена среда 18-го",
              page.evaluate("() => Schedule._st.week") == WEEK and page.get_attribute(".sc-day.today", "data-day") == "2026-11-18")
        open_schedule(page)
        page.hover(row('2026-11-17', kid))
        page.click(f"{row('2026-11-17', kid)} .rw-more")
        page.wait_for_selector(".gm-menu.on")
        page.click(".gm-menu .gm-item:has-text('Удалить строку')")
        page.wait_for_selector(".gm-menu .gm-item:has-text('Точно удалить?')")
        check("F4 удаление строки спрашивает подтверждение", len(lessons()) == 4)
        page.click(".gm-menu .gm-item:has-text('Точно удалить?')")
        wait_db(lambda: len(lessons()) == 3, "удаление")
        check("F5 занятие удалено вместе с участниками",
              len(lessons()) == 3 and not [p for p in db()["lesson_students"] if p["lesson_id"] not in {l["id"] for l in lessons()}])
        page.click("#tabs a[data-tab=settings]")
        page.wait_for_selector("#fmtNames input[data-fmt=semi]")
        page.fill("#fmtNames input[data-fmt=semi]", "Параллель")
        page.dispatch_event("#fmtNames input[data-fmt=semi]", "change")
        wait_db(lambda: db()["teacher_settings"][0]["settings"]["formatLabels"]["semi"] == "Параллель", "название формата")
        open_schedule(page)
        page.hover(row('2026-11-17', tid))
        page.click(f"{row('2026-11-17', tid)} .rw-more")
        page.click(".gm-menu .gm-item:has-text('Открыть занятие')")
        page.wait_for_selector("#spEdit")
        page.click("#spEdit")
        page.wait_for_selector("#edFmt button")
        check("F6 своё название формата в карточке занятия", "Параллель" in page.inner_text("#edFmt"))
        page.keyboard.press("Escape")
        page.wait_for_selector(".sc-modal", state="detached")
        page.keyboard.press("Escape")
        page.wait_for_selector(".sc-side", state="detached")

        # ── H. перетаскивание строк мышью
        def drag_to(src, target_sel, wait_slot=False):
            b = page.locator(src).bounding_box()
            page.mouse.move(b["x"] + b["width"] * 0.6, b["y"] + b["height"] / 2)
            page.mouse.down()
            page.mouse.move(b["x"] + b["width"] * 0.6 + 10, b["y"] + b["height"] / 2 + 10, steps=3)
            if wait_slot:
                page.wait_for_selector(target_sel)
            t = page.locator(target_sel).bounding_box()
            page.mouse.move(t["x"] + t["width"] / 2, t["y"] + t["height"] / 2, steps=8)
            page.mouse.up()
        drag_to(f"{row('2026-11-17', tid)} .rw-p:has-text('Вася')", row('2026-11-19', wid))
        wait_db(lambda: len(people(wid)) == 2, "Вася переехал")
        wait_db(lambda: [l for l in lessons() if l["id"] == tid][0]["format"] == "single", "формат вт — индивидуальное")
        vasya = [p for p in people(wid) if p.get("guest_name") == "Вася"]
        check("H1 одно имя из пары — на строку другого дня: ученик переехал со статусом, пара стала индивидуальным",
              vasya and vasya[0]["status"] == "done" and len(people(tid)) == 1
              and [l for l in lessons() if l["id"] == tid][0]["format"] == "single", str(people(wid)))
        page.wait_for_selector(f"{row('2026-11-19', wid)}.multi")
        drag_to(row('2026-11-19', wid) + " .rw-time", ".rw-slot[data-day='2026-11-20'][data-start='600']", wait_slot=True)
        wait_db(lambda: [l for l in lessons() if l["id"] == wid][0]["day"] == "2026-11-20", "строка на пятницу 10:00")
        W = [l for l in lessons() if l["id"] == wid][0]
        check("H2 строку — на свободный час другого дня: пт 10:00", (W["day"], W["start_min"]) == ("2026-11-20", 600), str(W))
        page.wait_for_selector(row('2026-11-20', wid))
        drag_to(row(WEEK, mid) + " .rw-time", row('2026-11-20', wid))
        wait_db(lambda: not [l for l in lessons() if l["id"] == mid], "пн слилось в пт")
        names_w = sorted([p.get("student_id") or p.get("guest_name") for p in people(wid)])
        check("H3 строку на строку — ученики слились (Петя второй раз не встал), опустевшее занятие удалено, формат «группа»",
              names_w == sorted(["st-petya", "Вася", "st-masha"]) and [l for l in lessons() if l["id"] == wid][0]["format"] == "group", str(names_w))
        masha_row = [p for p in people(wid) if p.get("student_id") == "st-masha"]
        check("H4 статус Маши переехал вместе с ней", masha_row and masha_row[0]["status"] == "done")
        # накладка по времени — одна рамка, получасовая строка сдвинута
        sat = ".sc-day[data-day='2026-11-21']"
        page.click(".rw-add[data-add='2026-11-21']")
        focused("rw-in-time")
        page.keyboard.type("1600")
        page.keyboard.press("Enter")
        page.keyboard.type("Маша")
        page.keyboard.press("Enter")
        wait_db(lambda: len([l for l in lessons() if l["day"] == "2026-11-21"]) == 1, "сб 16:00")
        focused("rw-in-names")
        page.fill(f"{sat} .rw-row.draft .rw-in-time", "1630")
        page.focus(f"{sat} .rw-row.draft .rw-in-names")
        page.keyboard.type("Петя")
        page.keyboard.press("Enter")
        wait_db(lambda: len([l for l in lessons() if l["day"] == "2026-11-21"]) == 2, "сб 16:30")
        page.keyboard.press("Escape")
        page.wait_for_selector(f"{sat} .rw-frame .rw-row.half")
        check("H5 занятия внахлёст (16:00 и 16:30) — одна рамка без подписи, 16:30 сдвинута вправо",
              page.locator(f"{sat} .rw-frame .rw-row").count() == 2 and "полупараллел" not in page.inner_text(f"{sat} .rw-frame").lower())

        # ── G. телефон: долгое нажатие пальцем
        ph = new_context(browser, viewport={"width": 375, "height": 800}, has_touch=True, is_mobile=True)
        pp = ph.new_page()
        PAGE["p"] = pp
        pp.on("pageerror", lambda e: errors.append("phone: " + str(e)))
        signed_in(pp)
        open_schedule(pp)
        n_rows = len(lessons())
        check("G1 телефон: по умолчанию «Строки», дни в одну колонку", pp.is_visible(".sc-views button.on[data-v=list]") and pp.locator(".rw-row").count() == n_rows)
        check("G2 телефон 375: без прокрутки вбок", pp.evaluate("() => document.documentElement.scrollWidth <= window.innerWidth"))
        pp.evaluate("() => window.scrollTo(0, 0)")
        pp.click("#scToday")
        pp.wait_for_selector(".sc-day.today.sc-flash")
        pp.wait_for_function("() => { const r = document.querySelector('.sc-day.today').getBoundingClientRect(); return r.top >= 0 && r.top < 300; }", timeout=4000)
        check("G2a «Сегодня» на телефоне: страница сама долистала до среды, день вспыхнул", True)
        cdp = ph.new_cdp_session(pp)
        src = row('2026-11-17', tid) + " .rw-time"
        pp.eval_on_selector(src, "e => e.scrollIntoView({ block: 'center' })")
        b = pp.locator(src).bounding_box()
        x, y = b["x"] + b["width"] / 2, b["y"] + b["height"] / 2
        cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x, "y": y}]})
        pp.wait_for_timeout(650)                          # долгое нажатие
        cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": x, "y": y + 6}]})
        pp.wait_for_selector(".rw-slot[data-day='2026-11-17'][data-start='900']", timeout=3000)
        t = pp.locator(".rw-slot[data-day='2026-11-17'][data-start='900']").bounding_box()
        for i in range(1, 9):
            cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": x + (t["x"] + 30 - x) * i / 8, "y": y + (t["y"] + t["height"] / 2 - y) * i / 8}]})
            pp.wait_for_timeout(30)
        cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
        wait_db(lambda: [l for l in lessons() if l["id"] == tid][0]["start_min"] == 900, "перенос пальцем")
        check("G3 палец: долгое нажатие и перетаскивание на свободный час — вт 15:00",
              [l for l in lessons() if l["id"] == tid][0]["start_min"] == 900)
        pp.click(".sc-views button[data-v=grid]")
        pp.wait_for_selector(".sc-grid")
        check("G3a телефон, «Неделя»: сетка листается внутри, страница — нет",
              pp.evaluate("() => document.documentElement.scrollWidth <= window.innerWidth"))
        first = pp.evaluate("""() => { const gw = document.querySelector('.sc-gwrap'), ps = Array.from(document.querySelectorAll('.sc-plate'));
                                      const top = Math.min.apply(null, ps.map(p => p.offsetTop)); return [top - gw.scrollTop, gw.scrollTop]; }""")
        check("G3b «Неделя» открылась с самого раннего занятого часа (пустое утро пролистано)", first[1] > 0 and 0 <= first[0] < 90, str(first))
        check("G4 нет ошибок JavaScript", not errors, "; ".join(errors))
        browser.close()

    print()
    print("ПРОВАЛЕНО: " + ", ".join(FAILS) if FAILS else "Все проверки прошли")
    sys.exit(1 if FAILS else 0)


main()
