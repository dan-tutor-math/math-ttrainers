"""
Кабинет преподавателя, задача А4: cabinet.html, cabinet-cloud.js,
teacher-settings.js, кнопка «Кабинет» в капсуле на главной.

Supabase — заглушка (FAKE_SB_JS): та же поверхность, что зовёт cabinet-cloud.js
(auth, from(...).select/insert/update/upsert/eq/order/single/maybeSingle).
«База» — общий JSON у теста (маршрут https://fakesb.test/db): это и есть
«сервер», поэтому настройка, увиденная после перезагрузки с очищенным
localStorage, доказывает хранение на сервере. Права и схему по-настоящему
проверяет test_prompt_cabinet_schema.py на живом Postgres. Вход и запись в
живой базе перепроверяются на сайте руками.

Проверяет:
  A. вход: без сессии — форма, неверный пароль — ошибка, вход — компактное «Расписание»;
  B. ученик: добавить → карточка; правка имени, класса, экзамена, заметки,
     своей длительности, привязки досок; места под «Память заданий» и
     «Занятия», кнопка «Начать сессию»; значения лежат в базе;
  C. архив: ученик уходит из списка, виден по «Показать архив», возврат;
  D. настройки: привязка сессии, подписи, даты/счётчик, длительность (в т.ч.
     своя) — после перезагрузки с пустым localStorage значения те же (с сервера);
  E. «Расписание» открывается (подробно — test_prompt_cabinet_schedule.py);
  F. главная: четвёртой в капсуле кнопка «Кабинет» ведёт на кабинет;
  G. на узком экране вкладки в одну строку, палитры разделены по аккаунтам;
  H. первый вход по почте из списка, установка общего пароля и один вход с досками.

Запуск: python3 test_prompt_cabinet_page.py (сервер поднимается сам).
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
PORT = 8961
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
OTHER_ID = "22222222-2222-4222-8222-222222222222"
INVITED = {"id": "33333333-3333-4333-8333-333333333333", "email": "invited@example.test",
           "app_metadata": {"mathh_role": "teacher"}, "user_metadata": {}}

FAKE_SB_JS = r"""
(function(){
  const DB_URL = 'https://fakesb.test/db';
  const USERS = [__USERS__];
  const INVITED = __INVITED__;
  const invitedPassword = () => localStorage.getItem('__fakesb_invited_password');
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
  const PK = { students: 'id', teacher_settings: 'owner', boards: 'id' };
  class Q {
    constructor(t){ this.t = t; this.op = 'select'; this.f = []; this.ord = null; this.one = null; this.payload = null; this.conflict = null; }
    select(){ return this; }
    insert(r){ this.op = 'insert'; this.payload = r; return this; }
    update(o){ this.op = 'update'; this.payload = o; return this; }
    upsert(r, o){ this.op = 'upsert'; this.payload = r; this.conflict = o && o.onConflict; return this; }
    eq(c, v){ this.f.push([c, v]); return this; }
    order(c, o){ this.ord = [c, !(o && o.ascending === false)]; return this; }
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
      const vis = r => r.owner === uid;                       // RLS: только свои
      const match = r => vis(r) && this.f.every(([c, v]) => r[c] === v);
      let out;
      if (this.op === 'insert'){
        const list = (Array.isArray(this.payload) ? this.payload : [this.payload]).map(r => Object.assign({ boards: [], note: '', archived_at: null }, r, { owner: uid }));
        list.forEach(r => {
          if (this.t === 'students'){
            if (!r.name || r.name.length > 80) throw new Error('violates check constraint students_name_check');
            r.id = 'st-' + (rows.length + 1) + '-' + Math.random().toString(36).slice(2, 8); r.created_at = now(); r.updated_at = now();
          }
          rows.push(r);
        });
        out = list;
      } else if (this.op === 'update'){
        out = rows.filter(match);
        out.forEach(r => Object.assign(r, this.payload, { updated_at: now() }));
      } else if (this.op === 'upsert'){
        const p = Object.assign({}, this.payload, { owner: uid });
        let r = rows.find(x => x.owner === uid);
        if (r) Object.assign(r, p, { updated_at: now() }); else rows.push(Object.assign(p, { updated_at: now() }));
        out = [p];
      } else {
        out = rows.filter(match);
      }
      out = copy(out);
      if (this.ord){ const [c, asc] = this.ord; out.sort((a, b) => (a[c] < b[c] ? -1 : a[c] > b[c] ? 1 : 0) * (asc ? 1 : -1)); }
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
    function start(user){
      const s = { user: copy(user) };
      localStorage.setItem('__fakesb_session', JSON.stringify(s));
      listeners.forEach(cb => cb('SIGNED_IN', s));
      return { data: { user: s.user, session: s }, error: null };
    }
    const invitedUser = () => ({ ...INVITED, user_metadata: { has_password: !!invitedPassword() } });
    const auth = {
      async getSession(){ return { data: { session: sess() }, error: null }; },
      async getUser(){ return { data: { user: sess()?.user }, error: null }; },
      onAuthStateChange(cb){ listeners.push(cb); queueMicrotask(() => cb('INITIAL_SESSION', sess())); return { data: { subscription: { unsubscribe(){} } } }; },
      async signInWithPassword({ email, password }){
        if (email === INVITED.email && password === invitedPassword()) return start(invitedUser());
        const u = USERS.find(x => x.email === email && x.password === password);
        if (!u) return { data: {}, error: { message: 'Invalid login credentials' } };
        return start({ id: u.id, email: u.email });
      },
      async verifyOtp({ token_hash, type }){
        return token_hash === 'test-invite' && type === 'email' && !invitedPassword()
          ? start(invitedUser()) : { data: {}, error: { message: 'Invalid OTP' } };
      },
      async updateUser({ password, data }){
        if (sess()?.user.id !== INVITED.id || data.has_password !== true) return { error: { message: 'Cannot update' } };
        localStorage.setItem('__fakesb_invited_password', password);
        const s = { user: invitedUser() };
        localStorage.setItem('__fakesb_session', JSON.stringify(s));
        listeners.forEach(cb => cb('USER_UPDATED', s));
        return { data: s, error: null };
      },
      async signOut(){ localStorage.removeItem('__fakesb_session'); listeners.forEach(cb => cb('SIGNED_OUT', null)); return { error: null }; },
    };
    const functions = {
      async invoke(name, { body }){
        if (name !== 'email-login' || body.action !== 'login') throw new Error('Unexpected auth function');
        if (body.email === INVITED.email && !invitedPassword()) return { data: { ok: true, token_hash: 'test-invite' } };
        const protectedEmail = USERS.some(u => u.email === body.email) || body.email === INVITED.email;
        return { data: { ok: false, error: protectedEmail ? 'password_required' : 'not_allowed' } };
      },
    };
    const channel = () => { const ch = { on(){ return ch; }, subscribe(cb){ if (cb) setTimeout(() => cb('CLOSED'), 0); return ch; }, send(){ return Promise.resolve('ok'); }, unsubscribe(){ return Promise.resolve(); }, track(){}, presenceState(){ return {}; } }; return ch; };
    return { auth, functions, from: t => new Q(t), rpc: async () => ({ data: null, error: null }), channel, removeChannel(){ return Promise.resolve(); } };
  }
  window.supabase = { createClient };
})();
""".replace("__USERS__", json.dumps(TEACHER)).replace("__INVITED__", json.dumps(INVITED))

STATE = {"db": ""}
CORS = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS"}


def fresh_db():
    return {
        "students": [{"id": "st-other", "owner": OTHER_ID, "name": "Чужой Ученик", "grade": None, "exam": None, "note": "", "boards": [],
                      "archived_at": None, "created_at": "2026-01-01T00:00:00Z", "updated_at": "2026-01-01T00:00:00Z"}],
        "teacher_settings": [],
        "boards": [
            {"id": "b-1", "owner": TEACHER["id"], "title": "Доска Алгебра", "trashed_at": None},
            {"id": "b-2", "owner": TEACHER["id"], "title": "Доска Геометрия", "trashed_at": None},
            {"id": "b-3", "owner": TEACHER["id"], "title": "Удалённая", "trashed_at": "2026-02-01T00:00:00Z"},
        ],
    }


STATE["db"] = json.dumps(fresh_db())


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


def login(page):
    page.fill("#auEmail", TEACHER["email"])
    page.fill("#auPass", TEACHER["password"])
    page.click("#auGo")
    page.wait_for_selector("#tabs", state="visible", timeout=5000)


def main():
    errors = []
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = new_context(browser, viewport={"width": 1100, "height": 900})
        page = ctx.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)))

        # ── A. вход
        page.goto(f"{BASE}/cabinet.html")
        page.wait_for_selector("#scrAuth", state="visible", timeout=5000)
        check("A1 без сессии — форма входа", page.is_visible("#auGo"))
        page.fill("#auEmail", TEACHER["email"]); page.fill("#auPass", "wrong"); page.click("#auGo")
        page.wait_for_function("() => document.getElementById('auMsg').textContent.length > 0")
        check("A2 неверный пароль — понятная ошибка", "Не подошли" in page.inner_text("#auMsg"), page.inner_text("#auMsg"))
        login(page)
        # без вкладки в адресе кабинет открывает «Расписание»
        page.wait_for_selector("#tabSchedule", state="visible")
        check("A3a вход в кабинет — сразу «Расписание»", page.locator('#tabs a[data-tab="schedule"].on').count() == 1)
        check("A3b компактная шапка без заголовка, почты и клеток", page.evaluate("""email => {
          const head = document.querySelector('.cab-head');
          return head.getBoundingClientRect().bottom < 72 && !document.querySelector('.wrap > h1') &&
            !document.body.innerText.includes(email) && getComputedStyle(document.body).backgroundImage === 'none';
        }""", TEACHER["email"]))
        page.click('#tabs a[data-tab="students"]')
        page.wait_for_selector("#tabStudents", state="visible")
        page.wait_for_function("() => document.getElementById('csBody') && document.getElementById('csBody').textContent.trim().length > 0")
        check("A3 после входа — вкладка «Ученики», список пуст (чужой не виден)",
              "Учеников пока нет" in page.inner_text("#csBody") and "Чужой" not in page.inner_text("#stuHost"))

        # ── B. ученик
        # таблица учеников: добавили строкой и открыли карточку поверх списка
        page.click("#csAdd")
        page.fill("#csNew", "Маша Иванова")
        page.press("#csNew", "Enter")
        page.wait_for_selector("#csBody .cs-open", timeout=5000)
        page.click("#csBody .cs-open")
        page.wait_for_selector("#cSave", timeout=5000)
        check("B1 добавили — открылась карточка", page.input_value("#cName_in") == "Маша Иванова")
        card = page.get_by_role("dialog", name="Карточка ученика")
        check("B2 места «Память заданий» и «Занятия» и кнопка «Начать сессию»",
              "Память заданий" in card.inner_text() and "Занятия" in card.inner_text() and page.is_visible("#cSession"))
        check("B3 доски в списке: две, удалённой нет",
              page.locator("#cBoards input").count() == 2 and "Удалённая" not in page.inner_text("#cBoards"))
        check("B4 подсказка длительности = настройка по умолчанию (60)", page.get_attribute("#cDur", "placeholder") == "60")
        page.fill("#cName_in", "Мария Иванова")
        page.fill("#cGrade", "9")
        page.select_option("#cExam", "oge")
        page.fill("#cNote", "Слабо дроби")
        page.fill("#cDur", "90")
        page.locator("#cBoards input[value='b-2']").check()
        page.click("#cSave")
        page.wait_for_function("() => document.getElementById('cMsg').textContent === 'Сохранено'", timeout=5000)
        row = [s for s in db()["students"] if s["owner"] == TEACHER["id"]][0]
        check("B5 правки в базе",
              (row["name"], row["grade"], row["exam"], row["note"], row["dur_min"], row["boards"])
              == ("Мария Иванова", "9", "oge", "Слабо дроби", 90, ["b-2"]), str(row))
        page.click("a:has-text('← Ученики')")
        page.wait_for_selector("#csBody tr[data-sid]", timeout=5000)
        r0 = "#csBody tr[data-sid]"
        # таблица сперва рисует список из памяти, потом свежий из базы — ждём свежий
        # (заглушка базы отвечает по очереди, и обновление может прийти позже)
        page.wait_for_function("() => { const i = document.querySelector('#csBody tr[data-sid] [data-f=name]'); return i && i.value === 'Мария Иванова'; }", timeout=5000)
        check("B6 в списке новое имя, класс и экзамен",
              page.input_value(r0 + " [data-f=name]") == "Мария Иванова" and page.input_value(r0 + " [data-f=grade]") == "9"
              and page.input_value(r0 + " [data-f=exam]") == "oge")
        page.click(r0 + " .cs-open")
        page.wait_for_selector("#cSave")
        check("B7 карточка после возврата показывает сохранённое",
              page.input_value("#cDur") == "90" and page.locator("#cBoards input[value='b-2']").is_checked()
              and page.input_value("#cNote") == "Слабо дроби")
        page.fill("#cDur", "")
        page.click("#cSave")
        page.wait_for_function("() => document.getElementById('cMsg').textContent === 'Сохранено'")
        row = [s for s in db()["students"] if s["owner"] == TEACHER["id"]][0]
        check("B8 пустая длительность — null (по умолчанию)", row["dur_min"] is None)

        # ── C. архив
        page.click("#cArch")
        page.wait_for_function("() => document.getElementById('cArch').textContent.indexOf('Вернуть') >= 0", timeout=5000)
        row = [s for s in db()["students"] if s["owner"] == TEACHER["id"]][0]
        check("C1 архив: archived_at записан", bool(row["archived_at"]))
        page.click("a:has-text('← Ученики')")
        page.wait_for_function("() => document.getElementById('csBody') && document.getElementById('csBody').textContent.indexOf('Учеников пока нет') >= 0")
        check("C2 из списка ушёл", True)
        page.click("#csArch summary")
        page.wait_for_selector("#csArch .cs-aname", state="visible")
        check("C3 «Архив» — виден", "Мария Иванова" in page.inner_text("#csArch"))
        page.click("#csArch .cs-aname")
        page.wait_for_selector("#cArch")
        page.click("#cArch")
        page.wait_for_function("() => document.getElementById('cArch').textContent === 'В архив'", timeout=5000)
        row = [s for s in db()["students"] if s["owner"] == TEACHER["id"]][0]
        check("C4 возврат из архива", row["archived_at"] is None)

        # ── D. настройки
        page.click("#tabs a[data-tab=settings]")
        page.wait_for_selector("#tabSettings", state="visible")
        on = lambda key: page.eval_on_selector(f".seg[data-set={key}] button.on", "b => b.dataset.v")
        check("D1 по умолчанию: браузер, подписывать, 60", (on("sessionBind"), on("labels"), on("lessonMin")) == ("browser", "show", "60"))
        page.click(".seg[data-set=sessionBind] button[data-v=tab]")
        page.click(".seg[data-set=labels] button[data-v=hide_solved]")
        page.uncheck("#setDates")
        page.click("#segMin button[data-v='90']")
        page.wait_for_function("() => document.getElementById('saveNote').textContent === 'Сохранено'", timeout=5000)
        srv = [r for r in db()["teacher_settings"] if r["owner"] == TEACHER["id"]]
        check("D2 настройки на сервере одной строкой",
              len(srv) == 1 and srv[0]["settings"].get("sessionBind") == "tab" and srv[0]["settings"].get("labels") == "hide_solved"
              and srv[0]["settings"].get("labelDates") is False and srv[0]["settings"].get("lessonMin") == 90, str(srv))
        check("D3 копия в localStorage", "hide_solved" in (page.evaluate("() => localStorage.getItem('teacher:settings:v1')") or ""))
        page.click("#segMin button[data-v=custom]")
        page.fill("#customMin", "75")
        page.dispatch_event("#customMin", "change")
        page.wait_for_function("() => TeacherSettings.get().lessonMin === 75", timeout=5000)
        page.wait_for_function("() => document.getElementById('saveNote').textContent === 'Сохранено'", timeout=5000)
        check("D4 своя длительность 75 на сервере", [r for r in db()["teacher_settings"]][0]["settings"]["lessonMin"] == 75)

        account = page.locator("#cabAccount")
        check("D4a почта скрыта, пока аккаунт закрыт", not page.is_visible("#acctEmail"))
        account.locator("summary").click()
        check("D4b в аккаунте видны почта и выход", page.is_visible("#auOut") and page.inner_text("#acctEmail") == TEACHER["email"])
        page.keyboard.press("Escape")
        check("D4c Escape закрывает аккаунт и возвращает фокус", page.evaluate(
            "() => !document.querySelector('#cabAccount').open && document.activeElement === document.querySelector('#cabAccount summary')"))
        check("D4d палитры соответствуют каталогу", page.evaluate("""() => {
          const ids = [...document.querySelectorAll('#cabPalettes button')].map(b => b.dataset.palette);
          return ids.join() === ['neutral', ...MathhCatalog.subjects.map(s => s.id)].join();
        }"""))
        bg = lambda: page.evaluate("() => getComputedStyle(document.body).backgroundColor")
        neutral = bg()
        page.click('#cabPalettes button[data-palette="phys"]')
        page.wait_for_function("() => document.querySelector('#cabPaletteNote').textContent === 'Сохранено'")
        tinted = bg()
        saved = db()["teacher_settings"][0]["settings"]
        check("D4e предмет меняет только однотонный фон, выбор сохранён у учителя",
              tinted != neutral and saved.get("cabinetPalette") == {"owner": TEACHER["id"], "subject": "phys"}
              and saved["lessonMin"] == 75 and page.evaluate("() => getComputedStyle(document.body).backgroundImage === 'none'"))
        page.click('#cabThemes button[data-theme-choice="dark"]')
        check("D4f тёмная тема меняет фон и сохраняет предмет", bg() != tinted
              and page.locator("html").get_attribute("data-theme") == "dark"
              and page.locator('#cabPalettes button[data-palette="phys"]').get_attribute("aria-pressed") == "true")
        page.click('#cabThemes button[data-theme-choice="system"]')
        check("D4g системная тема возвращает выбор устройства", page.evaluate("() => localStorage.getItem('theme') === null"))
        # перезагрузка: сначала с копией, потом с пустой копией (значит, с сервера)
        page.reload()
        page.wait_for_selector("#tabs", state="visible")
        page.click("#tabs a[data-tab=settings]")
        page.wait_for_selector("#tabSettings", state="visible")
        check("D5 после перезагрузки настройки те же",
              (on("sessionBind"), on("labels"), page.is_checked("#setDates"), page.input_value("#customMin")) == ("tab", "hide_solved", False, "75"))
        page.evaluate("() => localStorage.removeItem('teacher:settings:v1')")
        page.reload()
        page.wait_for_selector("#tabs", state="visible")
        page.click("#tabs a[data-tab=settings]")
        page.wait_for_function("() => TeacherSettings.get().sessionBind === 'tab' && TeacherSettings.get().lessonMin === 75", timeout=5000)
        check("D6 при пустой копии настройки приходят с сервера", on("labels") == "hide_solved" and page.input_value("#customMin") == "75")
        check("D6a фон восстановлен с сервера", page.locator('#cabPalettes button[data-palette="phys"]').get_attribute("aria-pressed") == "true")
        page.click(".seg[data-set=sessionBind] button[data-v=browser]")
        page.wait_for_function("() => document.getElementById('saveNote').textContent === 'Сохранено'")
        check("D7 нормализация: мусор в настройках отбрасывается",
              page.evaluate("() => { const n = TeacherSettings.normalize({sessionBind:'x', labels:7, lessonMin:99999, labelDates:'да'}); return n.sessionBind === 'browser' && n.labels === 'show' && n.lessonMin === 60 && n.labelDates === true; }"))

        # ── E. расписание
        page.click("#tabs a[data-tab=schedule]")
        page.wait_for_selector("#tabSchedule", state="visible")
        # заглушку сменило расписание (В1а); подробно — test_prompt_cabinet_schedule.py
        page.wait_for_selector("#scHost .sc-views", timeout=5000)
        check("E1 «Расписание» открывается: шапка недели и переключатель вида", page.is_visible("#scRange"))
        page.set_viewport_size({"width": 1440, "height": 900})
        check("E2 расписание занимает почти всю доступную ширину", page.locator("#scHost").bounding_box()["width"] >= 1408)

        # ── F. главная
        page2 = ctx.new_page()
        page2.on("pageerror", lambda e: errors.append("index: " + str(e)))
        page2.goto(f"{BASE}/index.html")
        page2.wait_for_selector(".lg-side")
        labels = page2.eval_on_selector_all(".lg-side > a, .lg-side > button", "els => els.map(e => e.getAttribute('aria-label'))")
        check("F1 «Кабинет» четвёртой в капсуле (после Подборки, Досок, Работ)", labels[:4] == ["Доски", "Работы", "Кабинет", "Панель для доски"], str(labels))
        check("F2 значок кабинета нарисован", page2.evaluate("() => !!document.getElementById('mi-cabinet')"))
        page2.click(".cabinet-toggle")
        page2.wait_for_url("**/cabinet.html**")
        check("F3 кнопка ведёт на кабинет — в расписание", page2.url.endswith("cabinet.html#/schedule"), page2.url)

        # ── G. телефон без прокрутки вбок
        ph = new_context(browser, viewport={"width": 375, "height": 800})
        pp = ph.new_page()
        pp.on("pageerror", lambda e: errors.append("phone: " + str(e)))
        pp.goto(f"{BASE}/cabinet.html")
        pp.wait_for_selector("#scrAuth", state="visible")
        pp.evaluate("() => localStorage.setItem('__fakesb_session', JSON.stringify({user:{id:'%s',email:'t@t'}}))" % TEACHER["id"])
        pp.goto(f"{BASE}/cabinet.html#/students")
        pp.reload()                                   # смена одного хеша страницу не перезагружает
        pp.wait_for_selector("#tabs", state="visible")
        pp.click("#csBody .cs-open")
        pp.wait_for_selector("#cSave")
        check("G1 телефон 375: карточка без прокрутки вбок", pp.evaluate("() => document.documentElement.scrollWidth <= window.innerWidth"))
        pp.set_viewport_size({"width": 320, "height": 800})
        check("G2 телефон 320: все вкладки и стрелка видны в одной строке", pp.evaluate("""() => {
          const nav = document.querySelector('#tabs');
          const links = [...nav.querySelectorAll('a')];
          return nav.scrollWidth === nav.clientWidth &&
            links.every(link => link.getBoundingClientRect().top === links[0].getBoundingClientRect().top &&
              link.getBoundingClientRect().right <= innerWidth);
        }"""))
        pp.click("#tabs a[data-tab=settings]")
        pp.wait_for_function("() => document.querySelector('#cabPalettes button[data-palette=phys]').ariaPressed === 'true'")
        pp.click("#cabAccount summary")
        check("G3 телефон 320: аккаунт и настройки без прокрутки вбок",
              pp.is_visible("#acctEmail") and pp.evaluate("() => document.documentElement.scrollWidth <= window.innerWidth"))
        pp.evaluate("id => localStorage.setItem('__fakesb_session', JSON.stringify({user:{id,email:'other@example.test'}}))", OTHER_ID)
        pp.reload()
        pp.wait_for_selector("#tabSettings:not([hidden])")
        check("G4 чужой аккаунт не получает локальную палитру первого",
              pp.locator('#cabPalettes button[data-palette="neutral"]').get_attribute("aria-pressed") == "true")
        check("G5 нет ошибок JavaScript", not errors, "; ".join(errors))

        # ── H. первый вход с той же почтой, что на досках, и общий пароль
        invitation = new_context(browser, viewport={"width": 390, "height": 840})
        ip = invitation.new_page()
        ip.on("pageerror", lambda e: errors.append("auth: " + str(e)))
        ip.goto(f"{BASE}/cabinet.html")
        ip.fill("#auEmail", "unknown@example.test")
        ip.press("#auEmail", "Enter")
        ip.wait_for_function("() => document.querySelector('#auMsg').textContent.includes('не добавлена')")
        check("H1 почта вне списка доступа не входит", ip.is_visible("#scrAuth"))
        ip.fill("#auEmail", TEACHER["email"])
        ip.click("#auGo")
        ip.wait_for_function("() => document.querySelector('#auMsg').textContent.includes('задан пароль')")
        check("H2 для защищённого аккаунта фокус переходит на пароль", ip.evaluate("document.activeElement.id") == "auPass")
        ip.fill("#auEmail", INVITED["email"])
        ip.click("#auGo")
        ip.wait_for_selector("#cabPassword[open]", timeout=5000)
        check("H3 преподаватель из списка входит по почте и может задать пароль в кабинете", ip.is_visible("#tabSchedule"))
        ip.fill("#cabPasswordNew", "test-password")
        ip.fill("#cabPasswordAgain", "other-password")
        ip.click("#cabPasswordSave")
        check("H4 разные пароли не отправляются", "не совпадают" in ip.inner_text("#cabPasswordMsg"))
        ip.fill("#cabPasswordAgain", "test-password")
        ip.click("#cabPasswordSave")
        ip.wait_for_selector("#cabPassword", state="hidden")
        dp = invitation.new_page()
        dp.goto(f"{BASE}/boards.html")
        dp.wait_for_function("() => window.CURRENT_USER?.user_metadata?.has_password === true")
        check("H5 доски видят общий вход и заданный в кабинете пароль", dp.evaluate("window.CURRENT_USER.id") == INVITED["id"])
        dp.close()
        ip.click("#tabs a[data-tab=settings]")
        ip.click("#cabAccount summary")
        check("H6 пароль можно сменить из меню аккаунта", ip.inner_text("#auPassword") == "Сменить пароль")
        ip.click("#auOut")
        ip.wait_for_selector("#scrAuth:not([hidden])")
        ip.click("#auGo")
        ip.wait_for_function("() => document.querySelector('#auMsg').textContent.includes('задан пароль')")
        ip.fill("#auPass", "test-password")
        ip.click("#auGo")
        ip.wait_for_selector("#tabSettings:not([hidden])")
        check("H7 повторный вход с новым паролем открывает кабинет", not ip.is_visible("#cabPassword"))
        from_boards = new_context(browser, viewport={"width": 900, "height": 800})
        bp = from_boards.new_page()
        bp.goto(f"{BASE}/boards.html")
        bp.fill("#agEmail", INVITED["email"])
        bp.click("#agSend")
        bp.wait_for_function("() => window.CURRENT_USER?.id", timeout=5000)
        bp.goto(f"{BASE}/cabinet.html")
        bp.wait_for_selector("#tabSchedule:not([hidden])")
        check("H8 вход по почте с досок открывает кабинет с той же сессией", bp.text_content("#acctEmail") == INVITED["email"])
        check("H9 нет ошибок JavaScript при входе", not errors, "; ".join(errors))
        browser.close()

    print()
    print("ПРОВАЛЕНО: " + ", ".join(FAILS) if FAILS else "Все проверки прошли")
    sys.exit(1 if FAILS else 0)


main()
