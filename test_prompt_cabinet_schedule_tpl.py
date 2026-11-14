"""
Расписание в кабинете, задача В1б: schedule-tpl.js (шаблоны недели, устойчивые
пары и группы), schedule-cloud.js, меню «Шаблон недели» в шапке schedule.js.

Supabase — заглушка, как в test_prompt_cabinet_schedule.py, плюс таблицы
student_groups, student_group_members, week_templates, template_slots,
template_slot_students, их каскады и «активный шаблон один». «Сегодня» —
среда 18.11.2026 (подмена Date), неделя 16–22.11.2026.

Проверяет:
  A. пара «Маша, Петя» заводится один раз (формат — пара, в базе состав);
  B. шаблон: создать, переименовать, слоты по дням (быстрый ввод), слот
     «Маша, Петя» сам становится парой (group_id), «кто в шаблоне» — Маша ×2;
  C. дублировать (копия со слотами и участниками), удалить копию;
  D. «Шаблон недели» в шапке → вставка в неделю: занятие, уже стоящее в то
     же время, не затирается (пропуск), создаются настоящие занятия
     (from_slot, формат, ученики); повторная вставка видит всё занятым;
  E. после перезагрузки занятия с форматом и учениками видны в «Строках» и
     в «Неделе»;
  F. правка пары: формат, добавить/убрать ученика — доходит до слота
     шаблона; быстрый ввод по названию пары и по тем же именам даёт пару
     (group_id); «Разъединить» — слот и занятия остаются;
  G. телефон 375 без прокрутки вбок, нет ошибок JS.

Запуск: python3 test_prompt_cabinet_schedule_tpl.py (сервер поднимается сам).
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
    student_groups: () => ({ id: uid4('grp'), name: '', format: 'pair', dur_min: null, note: '', archived_at: null }),
    week_templates: () => ({ id: uid4('tpl'), name: '', is_active: false, pos: 0 }),
    template_slots: () => ({ id: uid4('slot'), weekday: 1, start_min: null, dur_min: 60, format: 'single', is_event: false, title: '', note: '', group_id: null, pos: 0 }),
    template_slot_students: () => ({ id: uid4('tss'), student_id: null, guest_name: null, pos: 0 }),
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
          if (this.t === 'week_templates' && r.is_active && rows.some(x => x.owner === uid && x.is_active)) throw new Error('duplicate key value violates unique constraint week_templates_one_active');
          if (this.t === 'student_group_members' && rows.some(x => x.group_id === r.group_id && x.student_id === r.student_id)) throw new Error('duplicate key value violates unique constraint');
          if (this.t === 'lessons' && (r.dur_min < 5 || r.dur_min > 720 || (r.start_min != null && (r.start_min < 0 || r.start_min > 1439))))
            throw new Error('violates check constraint lessons_check');
        });
        list.forEach(r => rows.push(r));
        out = list;
      } else if (this.op === 'update'){
        out = rows.filter(match);
        out.forEach(r => Object.assign(r, this.payload, { updated_at: now() }));
        if (this.t === 'week_templates' && rows.filter(r => r.owner === uid && r.is_active).length > 1) throw new Error('duplicate key value violates unique constraint week_templates_one_active');
      } else if (this.op === 'upsert'){
        const p = Object.assign({}, this.payload, { owner: uid });
        let r = rows.find(x => x.owner === uid);
        if (r) Object.assign(r, p, { updated_at: now() }); else rows.push(Object.assign(p, { updated_at: now() }));
        out = [p];
      } else if (this.op === 'delete'){
        out = rows.filter(match);
        db[this.t] = rows.filter(r => out.indexOf(r) < 0);
        // каскады схемы: участники уходят с занятием; пара — с составом (а
        // group_id в слотах и занятиях обнуляется); шаблон — со слотами
        const gone = (tbl, col, ids) => { db[tbl] = (db[tbl] || []).filter(r => ids.indexOf(r[col]) < 0); };
        const ids = out.map(r => r.id);
        if (this.t === 'lessons') gone('lesson_students', 'lesson_id', ids);
        if (this.t === 'student_groups') {
          gone('student_group_members', 'group_id', ids);
          (db.template_slots || []).forEach(s => { if (ids.indexOf(s.group_id) >= 0) s.group_id = null; });
          (db.lessons || []).forEach(l => { if (ids.indexOf(l.group_id) >= 0) l.group_id = null; });
        }
        if (this.t === 'week_templates') {
          const sl = (db.template_slots || []).filter(s => ids.indexOf(s.template_id) >= 0).map(s => s.id);
          gone('template_slot_students', 'slot_id', sl); gone('template_slots', 'template_id', ids);
        }
        if (this.t === 'template_slots') gone('template_slot_students', 'slot_id', ids);
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


def lesson_row(lid, day, start, dur, fmt="single"):
    return {"id": lid, "owner": TEACHER["id"], "day": day, "start_min": start, "dur_min": dur, "format": fmt, "is_event": False, "title": "",
            "note": "", "board_id": None, "group_id": None, "from_slot": None, "ext_id": None,
            "created_at": "2026-01-01T00:00:00Z", "updated_at": "2026-01-01T00:00:00Z"}


def fresh_db():
    return {
        "students": [st_row("st-masha", "Маша Иванова", 90), st_row("st-petya", "Петя Сидоров"), st_row("st-vasya", "Вася Козлов"),
                     st_row("st-other", "Чужой Ученик", owner=OTHER_ID)],
        "teacher_settings": [], "boards": [],
        # во вторник 10:45–11:30 уже стоит занятие: слот шаблона 10:30–11:30 пересекается с ним
        "lessons": [lesson_row("les-seed", "2026-11-17", 645, 45)],
        "lesson_students": [{"id": "ls-seed", "owner": TEACHER["id"], "lesson_id": "les-seed", "student_id": "st-petya", "guest_name": None, "status": "plan", "pos": 0}],
        "student_groups": [], "student_group_members": [], "week_templates": [], "template_slots": [], "template_slot_students": [],
    }


STATE["db"] = json.dumps(fresh_db())


def db():
    return json.loads(STATE["db"])


def lessons():
    return sorted([l for l in db()["lessons"] if l["owner"] == TEACHER["id"]], key=lambda l: (l["day"], l["start_min"] or -1))


def tbl(name):
    return [r for r in db().get(name, []) if r["owner"] == TEACHER["id"]]


def slot_people(slot_id):
    return [p["student_id"] for p in sorted(tbl("template_slot_students"), key=lambda p: p["pos"]) if p["slot_id"] == slot_id]


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
        mode = lambda m: page.click(f".sc-modes button[data-mode={m}]")

        # новая строка в дне: «+ строка» → время пустое → всё одной строкой в имени
        def quick(card, text):
            page.click(f"{card} .rw-add")
            page.wait_for_selector(f"{card} .rw-row.draft .rw-in-names")
            page.fill(f"{card} .rw-row.draft .rw-in-time", "")
            page.focus(f"{card} .rw-row.draft .rw-in-names")
            page.keyboard.type(text)
            page.keyboard.press("Enter")

        # ── A. пара заводится один раз
        check("A0 в шапке недели — меню «Шаблон недели» (своё, не select)", page.is_visible("button#scTplMenu"))
        mode("groups")
        page.fill("#grpNames", "Маша")
        page.press("#grpNames", "Enter")
        page.wait_for_selector("#grpMsg:has-text('хотя бы двое')")
        check("A1 один ученик — не пара, ничего не создано", len(tbl("student_groups")) == 0)
        page.fill("#grpNames", "Маша, Петя")
        page.press("#grpNames", "Enter")
        wait_db(lambda: len(tbl("student_groups")) == 1, "пара в базе")
        G = tbl("student_groups")
        check("A2 «Маша, Петя» → пара «Маша Иванова + Петя Сидоров»",
              len(G) == 1 and G[0]["format"] == "pair" and G[0]["name"] == "Маша Иванова + Петя Сидоров", str(G))
        gid = G[0]["id"] if G else ""
        wait_db(lambda: len(tbl("student_group_members")) == 2, "состав")
        check("A3 состав — ссылки на учеников",
              sorted(m["student_id"] for m in tbl("student_group_members")) == ["st-masha", "st-petya"])
        page.fill("#grpNames", "Петя, Маша")
        page.press("#grpNames", "Enter")
        page.wait_for_selector("#grpMsg:has-text('уже есть')")
        check("A4 те же двое второй раз — «уже есть»", len(tbl("student_groups")) == 1)

        # ── B. шаблон
        mode("tpl")
        page.wait_for_selector("#tplNew")
        check("B0 шаблонов нет — пустое состояние", page.locator("#tplSel").count() == 0)
        page.click("#tplNew")
        wait_db(lambda: len(tbl("week_templates")) == 1, "шаблон")
        T = tbl("week_templates")
        check("B1 первый шаблон — активный", T and T[0]["is_active"] is True and T[0]["name"] == "Шаблон 1", str(T))
        tid = T[0]["id"]
        page.fill("#tplName", "Осенний")
        page.dispatch_event("#tplName", "change")
        wait_db(lambda: tbl("week_templates")[0]["name"] == "Осенний", "переименование")
        check("B2 переименован", tbl("week_templates")[0]["name"] == "Осенний")
        mon = ".sc-day[data-wd='1']"
        quick(mon, "15:00 Маша, Петя")
        wait_db(lambda: len(tbl("template_slots")) == 1, "слот пн")
        S = tbl("template_slots")
        s_mon = S[0] if S else {}
        check("B3 слот пн 15:00, 90 мин, пара, привязан к устойчивой паре",
              (s_mon.get("weekday"), s_mon.get("start_min"), s_mon.get("dur_min"), s_mon.get("format"), s_mon.get("group_id")) == (1, 900, 90, "pair", gid), str(S))
        wait_db(lambda: len(slot_people(s_mon.get("id"))) == 2, "участники слота")
        check("B4 участники слота — Маша и Петя", slot_people(s_mon["id"]) == ["st-masha", "st-petya"])
        page.wait_for_selector(f"{mon} .rw-row:not(.draft)")
        check("B5 строка слота: время и оба имени столбиком", page.inner_text(f"{mon} .rw-time") == "15:00" and "Петя Сидоров" in page.inner_text(f"{mon} .rw-row:not(.draft)")
              and page.locator(f"{mon} .rw-row:not(.draft) .rw-p").count() == 2)
        tue = ".sc-day[data-wd='2']"
        quick(tue, "10:30 Вася")
        wait_db(lambda: len(tbl("template_slots")) == 2, "слот вт")
        fri = ".sc-day[data-wd='5']"
        quick(fri, "18:00 Маша")
        wait_db(lambda: len(tbl("template_slots")) == 3, "слот пт")
        S = {(x["weekday"], x["start_min"]): x for x in tbl("template_slots")}
        check("B6 слоты вт 10:30 (60 мин, индивидуальное) и пт 18:00",
              (2, 630) in S and (5, 1080) in S and S[(2, 630)]["format"] == "single" and S[(2, 630)]["dur_min"] == 60 and S[(2, 630)]["group_id"] is None, str(S))
        page.keyboard.press("Escape")
        page.wait_for_function("() => document.querySelectorAll('.rw-row:not(.draft)').length === 3")
        page.click("#tplWho summary")
        who = " ".join(page.inner_text("#tplWho").split())
        check("B7 «кто в шаблоне»: Маша ×2, Петя ×1, Вася ×1", "Маша Иванова ×2" in who and "Петя Сидоров ×1" in who and "Вася Козлов ×1" in who, who)

        # ── C. дублировать и удалить копию
        page.click("#tplDup")
        wait_db(lambda: len(tbl("week_templates")) == 2 and len(tbl("template_slots")) == 6, "копия шаблона")
        T = tbl("week_templates")
        cp = [t for t in T if t["id"] != tid][0]
        cs = [x for x in tbl("template_slots") if x["template_id"] == cp["id"]]
        check("C1 копия: «Осенний (копия)», не активна, 3 слота",
              cp["name"] == "Осенний (копия)" and cp["is_active"] is False and len(cs) == 3, str(cp))
        wait_db(lambda: sum(len(slot_people(x["id"])) for x in cs) == 4, "участники копии")
        check("C2 в копии те же участники (4 записи), пара сохранена",
              sum(len(slot_people(x["id"])) for x in cs) == 4 and any(x["group_id"] == gid for x in cs))
        check("C3 в базе активен один шаблон", len([t for t in T if t["is_active"]]) == 1)
        page.click("#tplDel")
        check("C4 удаление шаблона спрашивает подтверждение", page.inner_text("#tplDel") == "Точно удалить?" and len(tbl("week_templates")) == 2)
        page.click("#tplDel")
        wait_db(lambda: len(tbl("week_templates")) == 1, "удаление копии")
        check("C5 копия удалена вместе со слотами", len(tbl("template_slots")) == 3 and page.input_value("#tplName") == "Осенний")

        # ── D. вставка в неделю
        mode("week")
        page.wait_for_selector(".sc-days")
        page.click("#scTplMenu")
        page.click(".gm-menu.on .gm-item:has-text('Осенний')")
        page.wait_for_selector(".sc-ins")
        rows = page.locator(".sc-ins-row")
        check("D1 окно вставки: 3 слота, один занят (вт 10:45)",
              rows.count() == 3 and page.locator(".sc-ins-row.busy").count() == 1 and "уже занято" in page.inner_text(".sc-ins-row.busy"), page.inner_text(".sc-ins"))
        check("D2 кнопка «Только свободные (2)»", "Только свободные (2)" in page.inner_text("#insFree"))
        page.click("#insFree")
        wait_db(lambda: len(lessons()) == 3, "вставленные занятия")
        L = lessons()
        mon_l = [l for l in L if l["day"] == "2026-11-16"]
        check("D3 созданы пн 15:00 (90, пара) и пт 18:00; вторник не затёрт",
              len(L) == 3 and mon_l and (mon_l[0]["start_min"], mon_l[0]["dur_min"], mon_l[0]["format"]) == (900, 90, "pair")
              and [l for l in L if l["day"] == "2026-11-17"][0]["id"] == "les-seed" and [l for l in L if l["day"] == "2026-11-20"], str(L))
        check("D4 занятие помнит слот и пару (from_slot, group_id)", mon_l and mon_l[0]["from_slot"] == s_mon["id"] and mon_l[0]["group_id"] == gid, str(mon_l))
        wait_db(lambda: len(people(mon_l[0]["id"])) == 2, "ученики занятия")
        check("D5 ученики занятия — Маша и Петя", [p["student_id"] for p in people(mon_l[0]["id"])] == ["st-masha", "st-petya"])
        check("D6 во вторнике по-прежнему одно занятие (seed)", len([l for l in L if l["day"] == "2026-11-17"]) == 1)
        page.click("#scTplMenu")
        page.click(".gm-menu.on .gm-item:has-text('Осенний')")
        page.wait_for_selector(".sc-ins")
        check("D7 повторная вставка: всё занято, «Только свободные» нет",
              page.locator(".sc-ins-row.busy").count() == 3 and page.locator("#insFree").count() == 0 and page.locator("#insAll").count() == 1)
        page.click("#insCancel")
        page.wait_for_selector(".sc-modal", state="detached")
        check("D8 отмена ничего не создала", len(lessons()) == 3)

        # ── E. после перезагрузки — оба вида
        open_schedule(page)
        mon_d = ".sc-day[data-day='2026-11-16']"
        check("E1 «Строки»: пн 15:00, Маша и Петя столбиком",
              page.inner_text(f"{mon_d} .rw-time") == "15:00" and "Маша Иванова" in page.inner_text(f"{mon_d} .rw-row") and "Петя Сидоров" in page.inner_text(f"{mon_d} .rw-row")
              and "multi" in page.get_attribute(f"{mon_d} .rw-row", "class"))
        check("E2 «Строки»: пт 18:00 Маша", page.inner_text(".sc-day[data-day='2026-11-20'] .rw-time") == "18:00")
        page.click(".sc-views button[data-v=grid]")
        page.wait_for_selector(".sc-grid")
        mid = mon_l[0]["id"]
        check("E3 «Неделя»: 3 плашки, у пары оба имени",
              page.locator(".sc-plate").count() == 3
              and "Петя Сидоров" in page.inner_text(f".sc-plate[data-id='{mid}']") and "Маша Иванова" in page.inner_text(f".sc-plate[data-id='{mid}']"))
        h = page.eval_on_selector(f".sc-plate[data-id='{mid}']", "e => e.getBoundingClientRect().height")
        check("E4 высота плашки пары = 90 минут (час 80px)", abs(h - (90 * 80 / 60 - 4)) < 2, str(h))
        page.click(".sc-views button[data-v=list]")
        page.wait_for_selector(".sc-days")

        # ── F. правка пары
        mode("groups")
        card = f".sc-grp[data-g='{gid}']"
        page.select_option(f"{card} .grp-fmt", "semi")
        wait_db(lambda: tbl("student_groups")[0]["format"] == "semi" and [x for x in tbl("template_slots") if x["id"] == s_mon["id"]][0]["format"] == "semi", "формат пары → слот")
        check("F1 формат пары → «Полупараллелка», слот шаблона следует", tbl("student_groups")[0]["format"] == "semi")
        check("F2 уже вставленное занятие не меняется (история)", [l for l in lessons() if l["id"] == mid][0]["format"] == "pair")
        page.fill(f"{card} .grp-add input", "Вася")
        page.press(f"{card} .grp-add input", "Enter")
        wait_db(lambda: len(tbl("student_group_members")) == 3 and len(slot_people(s_mon["id"])) == 3, "Вася в паре и в слоте")
        G = tbl("student_groups")[0]
        check("F3 добавили Васю: состав 3, слот шаблона тоже; полупараллелка осталась, имя обновилось",
              sorted(slot_people(s_mon["id"])) == ["st-masha", "st-petya", "st-vasya"] and G["format"] == "semi" and "Вася Козлов" in G["name"], str(G))
        page.click(f"{card} .sc-rm[data-rm=st-vasya]")
        wait_db(lambda: len(tbl("student_group_members")) == 2 and len(slot_people(s_mon["id"])) == 2, "Вася убран")
        check("F4 убрали Васю: пара и слот снова на двоих", sorted(slot_people(s_mon["id"])) == ["st-masha", "st-petya"])
        page.select_option(f"{card} .grp-fmt", "pair")
        wait_db(lambda: tbl("student_groups")[0]["format"] == "pair", "формат обратно")
        # быстрый ввод: те же имена и название пары
        mode("week")
        page.wait_for_selector(".sc-days")
        wed = ".sc-day[data-day='2026-11-18']"
        quick(wed, "16:00 Петя, Маша")
        wait_db(lambda: len(lessons()) == 4, "занятие по именам пары")
        W = [l for l in lessons() if l["day"] == "2026-11-18"]
        check("F5 те же имена в быстром вводе → занятие сразу «пара» с group_id и длительностью 90",
              W and (W[0]["format"], W[0]["group_id"], W[0]["dur_min"]) == ("pair", gid, 90), str(W))
        thu = ".sc-day[data-day='2026-11-19']"
        quick(thu, "12:00 Маша Иванова + Петя Сидоров")
        wait_db(lambda: len(lessons()) == 5, "занятие по названию пары")
        T4 = [l for l in lessons() if l["day"] == "2026-11-19"]
        check("F6 название пары в быстром вводе разворачивается в учеников",
              T4 and T4[0]["group_id"] == gid and [p["student_id"] for p in people(T4[0]["id"])] == ["st-masha", "st-petya"], str(T4))
        # разъединить
        mode("groups")
        page.click(f"{card} .grp-del")
        check("F7 «Разъединить» спрашивает подтверждение", "Точно" in page.inner_text(f"{card} .grp-del") and len(tbl("student_groups")) == 1)
        page.click(f"{card} .grp-del")
        wait_db(lambda: len(tbl("student_groups")) == 0, "пара удалена")
        check("F8 пара и состав удалены, слот и занятия остались",
              len(tbl("student_group_members")) == 0 and len(tbl("template_slots")) == 3 and len(lessons()) == 5
              and [x for x in tbl("template_slots") if x["id"] == s_mon["id"]][0]["group_id"] is None and len(slot_people(s_mon["id"])) == 2)
        mode("week")
        page.wait_for_selector(".sc-days")
        fr = ".sc-day[data-day='2026-11-21']"
        quick(fr, "20:00 Маша, Петя")
        wait_db(lambda: len(lessons()) == 6, "занятие после разъединения")
        SA = [l for l in lessons() if l["day"] == "2026-11-21"]
        check("F9 после «Разъединить» те же имена — пара по числу учеников, но без ссылки на группу",
              SA and (SA[0]["format"], SA[0]["group_id"]) == ("pair", None), str(SA))

        # ── F10. шаблон: тот же компонент строк — перетаскивание слота мышью
        mode("tpl")
        page.wait_for_selector(".sc-tpldays")
        tue_t = ".sc-day[data-wd='2']"
        src = page.locator(f"{tue_t} .rw-row .rw-time").bounding_box()
        page.mouse.move(src["x"] + 10, src["y"] + 8)
        page.mouse.down()
        page.mouse.move(src["x"] + 20, src["y"] + 20, steps=3)
        page.wait_for_selector(".rw-slot[data-day='4'][data-start='600']")
        t = page.locator(".rw-slot[data-day='4'][data-start='600']").bounding_box()
        page.mouse.move(t["x"] + t["width"] / 2, t["y"] + t["height"] / 2, steps=8)
        page.mouse.up()
        wait_db(lambda: [x for x in tbl("template_slots") if x["weekday"] == 4], "слот на четверг")
        TH = [x for x in tbl("template_slots") if x["weekday"] == 4]
        check("F10 слот шаблона перетащили на четверг 10:00", TH and TH[0]["start_min"] == 600, str(TH))
        page.click(f"{mon} .rw-time")
        page.fill(f"{mon} .rw-in-time", "1430")
        page.keyboard.press("Escape")
        page.click(f"{mon} .rw-time")
        page.fill(f"{mon} .rw-in-time", "1430")
        page.keyboard.press("Enter")
        wait_db(lambda: [x for x in tbl("template_slots") if x["id"] == s_mon["id"]][0]["start_min"] == 870, "время слота")
        check("F11 время слота правится на месте: «1430» → 14:30", [x for x in tbl("template_slots") if x["id"] == s_mon["id"]][0]["start_min"] == 870)
        page.keyboard.press("Escape")

        # ── G. телефон и ошибки
        ph = new_context(browser, viewport={"width": 375, "height": 800})
        pp = ph.new_page()
        pp.on("pageerror", lambda e: errors.append("phone: " + str(e)))
        signed_in(pp)
        open_schedule(pp)
        for m_ in ("tpl", "groups"):
            pp.click(f".sc-modes button[data-mode={m_}]")
            pp.wait_for_timeout(150)
            check(f"G {m_}: телефон 375 без прокрутки вбок", pp.evaluate("() => document.documentElement.scrollWidth <= window.innerWidth"))
        check("G9 нет ошибок JavaScript", not errors, "; ".join(errors))
        browser.close()

    print()
    print("ПРОВАЛЕНО: " + ", ".join(FAILS) if FAILS else "Все проверки прошли")
    sys.exit(1 if FAILS else 0)


main()
