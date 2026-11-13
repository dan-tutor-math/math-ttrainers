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

        # ── B. «Строки» и быстрый ввод
        check("B1 семь дней, вид «Строки»", page.locator(".sc-day").count() == 7 and page.is_visible(".sc-views button.on[data-v=list]"))
        check("B2 шапка недели", "16 – 22 ноября 2026" in page.inner_text("#scRange"), page.inner_text("#scRange"))
        mon = f".sc-day[data-day='{WEEK}']"
        page.click(f"{mon} .sc-plus")
        page.fill(f"{mon} .sc-quick input", "15:00 Маша, Петя")
        page.press(f"{mon} .sc-quick input", "Enter")
        wait_db(lambda: len(lessons()) == 1, "занятие в базе")
        L = lessons()
        ok = len(L) == 1 and (L[0]["day"], L[0]["start_min"], L[0]["dur_min"], L[0]["format"]) == (WEEK, 900, 90, "pair")
        check("B3 занятие: пн 15:00, 90 мин (своя у Маши), пара", ok, str(L))
        # участники пишутся вторым запросом после занятия — ждём и их, иначе тест гоняется с записью
        if L: wait_db(lambda: len(people(L[0]["id"])) == 2, "участники в базе")
        P = people(L[0]["id"]) if L else []
        check("B4 участники — ссылки на учеников", [p["student_id"] for p in P] == ["st-masha", "st-petya"], str(P))
        page.wait_for_selector(f"{mon} .sc-row")
        check("B5 строка «15:00 – 16:30 Маша Иванова Петя Сидоров»",
              page.inner_text(f"{mon} .sc-time") == "15:00 – 16:30" and "Петя Сидоров" in page.inner_text(f"{mon} .sc-row"),
              page.inner_text(f"{mon} .sc-row"))
        check("B6 форма быстрого ввода осталась открытой и пустой",
              page.is_visible(f"{mon} .sc-quick input") and page.input_value(f"{mon} .sc-quick input") == "")

        tue = ".sc-day[data-day='2026-11-17']"
        page.click(f"{tue} .sc-plus")
        page.fill(f"{tue} .sc-quick input", "10:30-11:15 Петя, Вася")
        page.press(f"{tue} .sc-quick input", "Enter")
        page.wait_for_selector(f"{tue} .sc-ask")
        check("B7 незнакомое имя — вопрос, ничего не создано молча",
              "Вася" in page.inner_text(f"{tue} .sc-ask") and len(lessons()) == 1 and len(db()["students"]) == 4)
        page.click(f"{tue} .sc-ask button[data-act=guest]")
        wait_db(lambda: len(lessons()) == 2, "второе занятие")
        L2 = [l for l in lessons() if l["day"] == "2026-11-17"]
        P2 = people(L2[0]["id"]) if L2 else []
        check("B8 гость: guest_name, ученик не заведён, 10:30–11:15",
              L2 and (L2[0]["start_min"], L2[0]["dur_min"]) == (630, 45) and [p.get("guest_name") for p in P2] == [None, "Вася"]
              and len(db()["students"]) == 4, str(L2) + str(P2))
        page.wait_for_selector(f"{tue} .sc-row .sc-guest")
        page.fill(f"{tue} .sc-quick input", "12 Коля")
        page.press(f"{tue} .sc-quick input", "Enter")
        page.wait_for_selector(f"{tue} .sc-ask button[data-act=create]")
        page.click(f"{tue} .sc-ask button[data-act=create]")
        wait_db(lambda: len(lessons()) == 3, "третье занятие")
        kolya = [s for s in db()["students"] if s["name"] == "Коля"]
        L3 = [l for l in lessons() if l["start_min"] == 720]
        check("B9 «Завести ученика»: Коля в учениках, занятие 12:00 на 60 мин, индивидуальное",
              len(kolya) == 1 and L3 and (L3[0]["dur_min"], L3[0]["format"]) == (60, "single")
              and people(L3[0]["id"])[0]["student_id"] == kolya[0]["id"], str(L3))
        page.wait_for_function(f"() => document.querySelectorAll(\"{tue} .sc-row\").length === 2")
        check("B10 во вторнике 12:00 раньше… нет: 10:30 раньше 12:00",
              page.locator(f"{tue} .sc-time").all_inner_texts() == ["10:30 – 11:15", "12:00 – 13:00"],
              str(page.locator(f"{tue} .sc-time").all_inner_texts()))

        # ── C. статус и формат
        masha_btn = f"{mon} .sc-p:has-text('Маша Иванова') .sc-st"
        page.click(masha_btn)
        mid = L[0]["id"]
        wait_db(lambda: people(mid)[0]["status"] == "done", "статус done")
        check("C1 одно нажатие — ✓ проведено (в базе)", people(mid)[0]["status"] == "done" and page.inner_text(masha_btn) == "✓")
        petya_btn = f"{mon} .sc-p:has-text('Петя Сидоров') .sc-st"
        page.click(petya_btn)
        page.click(petya_btn)
        wait_db(lambda: people(mid)[1]["status"] == "skip", "статус skip")
        check("C2 два нажатия — ✕ пропуск, у каждого свой статус",
              (people(mid)[0]["status"], people(mid)[1]["status"]) == ("done", "skip") and page.inner_text(petya_btn) == "✕")
        tid = L2[0]["id"]
        page.select_option(f"{tue} select.sc-fmt[data-id='{tid}']", "semi")
        wait_db(lambda: [l for l in lessons() if l["id"] == tid][0]["format"] == "semi", "формат semi")
        check("C3 формат сменён на полупараллелку (в базе, обводка пунктиром)",
              [l for l in lessons() if l["id"] == tid][0]["format"] == "semi"
              and "fmt-semi" in page.get_attribute(f"{tue} .sc-row[data-id='{tid}']", "class"))

        # ── D. «Неделя»
        page.click(".sc-views button[data-v=grid]")
        page.wait_for_selector(".sc-grid")
        check("D1 сетка: 7 колонок, 3 плашки", page.locator(".sc-col").count() == 7 and page.locator(".sc-plate").count() == 3)
        h = page.eval_on_selector(f".sc-plate[data-id='{mid}']", "e => e.getBoundingClientRect().height")
        check("D2 плашка 90 минут выше плашки 45 минут вдвое",
              abs(h - 2 * page.eval_on_selector(f".sc-plate[data-id='{tid}']", "e => e.getBoundingClientRect().height")) < 2, str(h))
        check("D3 подпись формата на плашке: «Пара», «Полупараллелка»",
              "Пара" in page.inner_text(f".sc-plate[data-id='{mid}'] .sc-pf") and "Полупараллелка" in page.inner_text(f".sc-plate[data-id='{tid}'] .sc-pf"))
        a = int(page.get_attribute(".sc-grid", "data-a"))
        wed = page.locator(".sc-col[data-day='2026-11-18']").bounding_box()
        page.mouse.click(wed["x"] + wed["width"] / 2, wed["y"] + (17 * 60 - a) + 5)
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
        colw = wed["width"]
        page.mouse.move(pl["x"] + pl["width"] / 2, pl["y"] + 20)
        page.mouse.down()
        page.mouse.move(pl["x"] + pl["width"] / 2 + colw * 0.5, pl["y"] + 30, steps=4)
        page.mouse.move(pl["x"] + pl["width"] / 2 + colw, pl["y"] + 20 + 37, steps=6)   # +37px → шаг 15: +30 минут
        page.mouse.up()
        wait_db(lambda: [l for l in lessons() if l["id"] == wid][0]["day"] == "2026-11-19", "перенос на четверг")
        W = [l for l in lessons() if l["id"] == wid][0]
        check("D6 перетащили на четверг и на 30 минут позже (шаг 15)", (W["day"], W["start_min"], W["dur_min"]) == ("2026-11-19", 1050, 60), str(W))
        page.wait_for_selector(f".sc-col[data-day='2026-11-19'] .sc-plate[data-id='{wid}']")
        rz = page.locator(f".sc-plate[data-id='{wid}'] .sc-rz").bounding_box()
        page.mouse.move(rz["x"] + rz["width"] / 2, rz["y"] + rz["height"] / 2)
        page.mouse.down()
        page.mouse.move(rz["x"] + rz["width"] / 2, rz["y"] + 20, steps=3)
        page.mouse.move(rz["x"] + rz["width"] / 2, rz["y"] + 4 + 47, steps=5)            # +47px → +45 минут
        page.mouse.up()
        wait_db(lambda: [l for l in lessons() if l["id"] == wid][0]["dur_min"] == 105, "растягивание")
        W = [l for l in lessons() if l["id"] == wid][0]
        check("D7 растянули до 105 минут (17:30 – 19:15)", (W["start_min"], W["dur_min"]) == (1050, 105), str(W))
        page.wait_for_function(f"() => document.querySelector(\".sc-plate[data-id='{wid}'] .sc-pt\").textContent === '17:30 – 19:15'")
        check("D8 подпись плашки «17:30 – 19:15»", True)
        # карточка занятия: клик по плашке, смена формата
        pm = page.locator(f".sc-plate[data-id='{mid}']").bounding_box()
        page.mouse.click(pm["x"] + 20, pm["y"] + 30)
        page.wait_for_selector(".sc-side #spEdit")      # В2: щелчок открывает боковую панель, правка — по кнопке
        page.click("#spEdit")
        page.wait_for_selector(".sc-modal #edFmt button")
        check("D9 карточка: ученики со статусами", page.locator(".sc-edp").count() == 2 and "проведено" in page.inner_text(".sc-edpeople"))
        page.click("#edFmt button[data-v=group]")
        wait_db(lambda: [l for l in lessons() if l["id"] == mid][0]["format"] == "group", "формат group")
        check("D10 формат из карточки — «Группа» (в базе и на плашке)",
              "Группа" in page.inner_text(f".sc-plate[data-id='{mid}'] .sc-pf"))
        page.click("#edFmt button[data-v=pair]")
        wait_db(lambda: [l for l in lessons() if l["id"] == mid][0]["format"] == "pair", "формат pair")
        page.keyboard.press("Escape")
        page.wait_for_selector(".sc-modal", state="detached")
        check("D11 свободные окна видны: в субботу плашек нет", page.locator(".sc-col[data-day='2026-11-21'] .sc-plate").count() == 0)

        # ── E. перезагрузка
        page.reload()
        page.wait_for_selector(".sc-grid", timeout=5000)
        check("E1 вид «Неделя» запомнился", page.is_visible(".sc-views button.on[data-v=grid]"))
        check("E2 после перезагрузки 4 плашки, четверг 17:30 – 19:15",
              page.locator(".sc-plate").count() == 4
              and page.inner_text(f".sc-col[data-day='2026-11-19'] .sc-plate[data-id='{wid}'] .sc-pt") == "17:30 – 19:15")
        hh = page.eval_on_selector(f".sc-plate[data-id='{wid}']", "e => e.getBoundingClientRect().height")
        check("E3 высота плашки = 105 минут", abs(hh - 105) < 2, str(hh))
        check("E4 подписи форматов после перезагрузки",
              "Пара" in page.inner_text(f".sc-plate[data-id='{mid}']") and "Полупараллелка" in page.inner_text(f".sc-plate[data-id='{tid}']"))
        page.click(".sc-views button[data-v=list]")
        page.wait_for_selector(".sc-days")
        check("E5 «Строки» после перезагрузки: статусы ✓ и ✕",
              page.inner_text(masha_btn) == "✓" and page.inner_text(petya_btn) == "✕")
        check("E6 гость и формат на месте",
              page.locator(f"{tue} .sc-guest").count() == 1
              and page.eval_on_selector(f"{tue} select.sc-fmt[data-id='{tid}']", "s => s.value") == "semi")
        check("E7 четверг: «17:30 – 19:15 Петя Сидоров»",
              page.inner_text(".sc-day[data-day='2026-11-19'] .sc-time") == "17:30 – 19:15")

        # ── F. неделя, удаление, названия форматов
        page.click("#scNext")
        page.wait_for_function("() => document.getElementById('scRange').textContent.indexOf('23 – 29 ноября') >= 0")
        page.wait_for_selector(".sc-days")
        check("F1 › — следующая неделя пустая", page.locator(".sc-row").count() == 0 and "/schedule/2026-11-23" in page.url)
        page.click("#scPrev")
        page.wait_for_selector(".sc-row")
        check("F2 ‹ — назад, занятия на месте", page.locator(".sc-row").count() == 4)
        page.click("#scToday")
        page.wait_for_function("() => location.hash === '#/schedule'")
        page.wait_for_selector("#scToday[aria-current]")
        page.wait_for_selector(".sc-day.today")
        check("F3 «Сегодня» — неделя 16–22 ноября, подсвечена среда 18-го",
              page.evaluate("() => Schedule._st.week") == WEEK and page.get_attribute(".sc-day.today", "data-day") == "2026-11-18")
        open_schedule(page)
        page.click(f".sc-day[data-day='2026-11-17'] .sc-time >> text=12:00 – 13:00")
        page.wait_for_selector("#spEdit")
        page.click("#spEdit")
        page.wait_for_selector("#edDel")
        page.click("#edDel")
        check("F4 удаление спрашивает подтверждение", page.inner_text("#edDel") == "Точно удалить?" and len(lessons()) == 4)
        page.click("#edDel")
        wait_db(lambda: len(lessons()) == 3, "удаление")
        check("F5 занятие удалено вместе с участниками",
              len(lessons()) == 3 and not [p for p in db()["lesson_students"] if p["lesson_id"] not in {l["id"] for l in lessons()}])
        page.click("#tabs a[data-tab=settings]")
        page.wait_for_selector("#fmtNames input[data-fmt=semi]")
        page.fill("#fmtNames input[data-fmt=semi]", "Параллель")
        page.dispatch_event("#fmtNames input[data-fmt=semi]", "change")
        wait_db(lambda: db()["teacher_settings"][0]["settings"]["formatLabels"]["semi"] == "Параллель", "название формата")
        open_schedule(page)
        check("F6 своё название формата в расписании",
              "Параллель" in page.eval_on_selector(f"{tue} select.sc-fmt[data-id='{tid}']", "s => s.options[s.selectedIndex].text"))

        # ── G. телефон
        ph = new_context(browser, viewport={"width": 375, "height": 800})
        pp = ph.new_page()
        pp.on("pageerror", lambda e: errors.append("phone: " + str(e)))
        signed_in(pp)
        open_schedule(pp)
        check("G1 телефон: по умолчанию «Строки»", pp.is_visible(".sc-views button.on[data-v=list]") and pp.locator(".sc-row").count() == 3)
        check("G2 телефон 375: без прокрутки вбок", pp.evaluate("() => document.documentElement.scrollWidth <= window.innerWidth"))
        pp.click(".sc-views button[data-v=grid]")
        pp.wait_for_selector(".sc-grid")
        check("G3 телефон, «Неделя»: сетка листается внутри, страница — нет",
              pp.evaluate("() => document.documentElement.scrollWidth <= window.innerWidth"))
        check("G4 нет ошибок JavaScript", not errors, "; ".join(errors))
        browser.close()

    print()
    print("ПРОВАЛЕНО: " + ", ".join(FAILS) if FAILS else "Все проверки прошли")
    sys.exit(1 if FAILS else 0)


main()
