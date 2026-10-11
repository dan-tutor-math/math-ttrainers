"""
Промпт №83: вход по списку почт — страница досок.

Вместо ссылок-приглашений и писем со ссылкой для входа: владелец вносит
почты в список (окно «Доступ»), человек открывает сайт, вводит почту,
«Войти» — и он внутри. Преподавателю без пароля — красная плашка «Добавьте
пароль» слева сверху; после пароля вход по одной почте для него закрыт.

Заглушка supabase-js — своя: база в памяти страницы (переживает
перезагрузку через localStorage), а functions.invoke зовёт НАСТОЯЩИЙ
handle() из supabase/functions/email-login/index.ts (типы TypeScript
срезает node), с той же заглушкой «администратора» из
test_prompt83_access_server.py. Так проверяется связка сайт ↔ функция
целиком, без сети.

Проверяем:
  A. форма: только почта, пароль и «Войти» — ни «прислать ссылку», ни
     приглашений; ?invite= из адреса убирается; почты нет в списке —
     «не добавлена»; функция не отвечает — понятное «нет связи»;
  B. владелец паролем: «доступ» в плашке, красной плашки нет; окно
     «Доступ»: пачка почт с ролью «Преподаватель» и подписью, итог
     «Добавлено: 2», кривая почта остаётся в поле с пояснением, список
     «Преподаватели · 2»;
  C. преподаватель по одной почте (verifyOtp с type 'email'): внутри,
     красная плашка видна, не перекрывает «К тренажёрам» ни «Назад к
     доскам» и рейл доски; «доступ» есть, роли выбрать нельзя; добавляет
     ученика — «Мои ученики · 1»;
  D. «Добавить пароль»: несовпадение и короткий — ошибки; верный —
     плашка исчезает, «сменить пароль»; выход; по одной почте — «задан
     пароль, введите его»; паролем — внутри без плашки;
  E. «Совместная работа»: преподаватель зовёт к доске почту, которой нет
     на платформе, — она добавляется учеником и сразу получает доступ к
     доске; ученик позвать новую почту не может;
  F. ученик по почте: без плашки и без «доступа»;
  G. владелец: смена роли, сброс пароля (вход по почте снова есть),
     «Убрать» с подтверждением — убранный не входит;
  H. телефон: плашка и окно «Доступ» в экране, без горизонтальной
     прокрутки; тёмная тема — снимки.

Запуск: python3 test_prompt83_email_access.py
"""
import contextlib
import http.client
import json
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

import test_prompt83_access_server as SRV

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = 8983
BASE = f"http://127.0.0.1:{PORT}"
SHOTS = os.environ.get('SHOTS_DIR', '/tmp/p83_shots')

failures = []
errors = []


def check(cond, msg):
    print(('  ok  ' if cond else '  FAIL ') + msg)
    if not cond:
        failures.append(msg)


def function_js():
    """handle() из функции — в обычный JS для страницы"""
    src = open(SRV.FUNC, encoding='utf-8').read()
    src = src.replace("import { createClient } from 'npm:@supabase/supabase-js@2';", 'const createClient = null as any;')
    js = subprocess.run(
        ['node', '-e', "const m=require('node:module');let s='';process.stdin.on('data',d=>s+=d);"
                       "process.stdin.on('end',()=>process.stdout.write(m.stripTypeScriptTypes(s)))"],
        input=src, capture_output=True, text=True, check=True).stdout
    js = js.replace('export async function', 'async function').replace('export function', 'function')
    return '(function(){\n' + js + '\nwindow.__emailLoginHandle = handle;\n})();\n'


FAKE_LIB = r"""
(function(){
  const LS = 'sb-fake-auth-token';
  const KEYS = { access_emails: ['email'], profiles: ['id'], board_access: ['board_id', 'user_id'], boards: ['id'] };
  const clone = v => v == null ? v : JSON.parse(JSON.stringify(v));
  let st;
  try { st = JSON.parse(localStorage.getItem('__fakeSB') || 'null'); } catch (e) {}
  if (!st) st = { db: { access_emails: [], profiles: [], board_access: [], boards: [] }, users: {}, tokens: {}, used: {}, seq: 10, links: 0 };
  const S = window.__fake = { st, invokes: [], verify: [], down: false };
  const save = () => { try { localStorage.setItem('__fakeSB', JSON.stringify(st)); } catch (e) {} };
  S.save = save;
  S.newUser = (email, extra) => { const id = 'u' + (++st.seq);
    st.users[id] = { id, email, app_metadata: {}, user_metadata: {}, banned_until: null, password: null, ...(extra || {}) };
    save(); return st.users[id]; };

  function builder(table){
    const q = { op: 'select', f: [], one: false, lim: 0, payload: null, ord: null, sel: false, opts: null };
    const T = () => (st.db[table] = st.db[table] || []);
    const keyEq = (a, b) => (KEYS[table] || ['id']).every(k => a[k] === b[k]);
    const b = {
      select(){ if (q.op !== 'select') q.sel = true; return b; },
      order(k, o){ q.ord = [k, o]; return b; }, limit(n){ q.lim = n; return b; }, range(){ return b; },
      eq(k, v){ q.f.push(r => r[k] === v); return b; },
      in(k, arr){ q.f.push(r => arr.includes(r[k])); return b; },
      ilike(k, p){ let src = '';
        for (let i = 0; i < p.length; i++){ const c = p[i];
          if (c === '\\') { i++; src += p[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
          else if (c === '%') src += '.*'; else if (c === '_') src += '.';
          else src += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
        const re = new RegExp('^' + src + '$', 'i'); q.f.push(r => re.test(r[k] || '')); return b; },
      maybeSingle(){ q.one = true; return b; }, single(){ q.one = true; return b; },
      insert(p){ q.op = 'insert'; q.payload = p; return b; },
      update(p){ q.op = 'update'; q.payload = p; return b; },
      upsert(p, o){ q.op = 'upsert'; q.payload = p; q.opts = o; return b; },
      delete(){ q.op = 'delete'; return b; },
      then(res, rej){ return Promise.resolve().then(run).then(r => { save(); return r; }).then(res, rej); },
    };
    function run(){
      const rows = T();
      const match = () => rows.filter(r => q.f.every(f => f(r)));
      if (q.op === 'insert'){
        const list = (Array.isArray(q.payload) ? q.payload : [q.payload]).map(clone);
        for (const r of list){
          if (table === 'boards' && !r.id) r.id = 'cb' + (++st.seq);
          if (rows.some(x => keyEq(x, r))) return { data: null, error: { message: 'duplicate key value' } };
          rows.push({ created_at: new Date(Date.now() + (st.seq++)).toISOString(), last_login_at: null, ...r });
        }
        return { data: q.one ? list[0] : list, error: null };
      }
      if (q.op === 'upsert'){
        (Array.isArray(q.payload) ? q.payload : [q.payload]).forEach(p => {
          const ex = rows.find(x => keyEq(x, p));
          if (ex) Object.assign(ex, clone(p)); else rows.push(clone(p));
        });
        return { data: null, error: null };
      }
      if (q.op === 'update'){ match().forEach(r => Object.assign(r, clone(q.payload))); return { data: null, error: null }; }
      if (q.op === 'delete'){ const m = match(); st.db[table] = rows.filter(r => !m.includes(r)); return { data: null, error: null }; }
      let out = match().map(clone);
      if (q.ord) out.sort((a, b2) => (a[q.ord[0]] < b2[q.ord[0]] ? -1 : 1) * (q.ord[1] && q.ord[1].ascending === false ? -1 : 1));
      if (q.lim) out = out.slice(0, q.lim);
      if (q.one) return { data: out[0] || null, error: null };
      return { data: out, error: null, count: out.length };
    }
    return b;
  }
  const findByEmail = email => Object.values(st.users).find(u => u.email.toLowerCase() === String(email).toLowerCase());

  // «администратор» для функции — как в test_prompt83_access_server.py
  const admin = window.__fakeAdmin = {
    from: builder,
    auth: {
      async getUser(token){ const u = st.users[st.tokens[token]];
        return u ? { data: { user: clone(u) }, error: null } : { data: { user: null }, error: { message: 'bad jwt' } }; },
      admin: {
        async createUser({ email }){
          if (findByEmail(email)) return { data: { user: null }, error: { message: 'already been registered' } };
          const u = S.newUser(email);
          st.db.profiles.push({ id: u.id, email }); save();
          return { data: { user: clone(u) }, error: null };
        },
        async getUserById(id){ const u = st.users[id]; return { data: { user: clone(u) || null }, error: u ? null : { message: 'nf' } }; },
        async generateLink({ email }){ const u = findByEmail(email);
          if (!u) return { data: null, error: { message: 'User not found' } };
          st.links++; save();
          return { data: { user: clone(u), properties: { hashed_token: 'h-' + u.id + '-' + st.links } }, error: null }; },
        async updateUserById(id, p){ const u = st.users[id]; if (!u) return { data: null, error: { message: 'nf' } };
          if (p.app_metadata) u.app_metadata = { ...u.app_metadata, ...p.app_metadata };
          if (p.user_metadata) u.user_metadata = { ...u.user_metadata, ...p.user_metadata };
          if (p.password) u.password = p.password;
          if (p.ban_duration === 'none') u.banned_until = null;
          else if (p.ban_duration) u.banned_until = new Date(Date.now() + 1e12).toISOString();
          save(); return { data: { user: clone(u) }, error: null }; },
        async listUsers({ page, perPage }){ const all = Object.values(st.users).map(clone);
          return { data: { users: all.slice((page - 1) * perPage, page * perPage) }, error: null }; },
      },
    },
  };

  let session = null;
  try { session = JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) {}
  const listeners = [];
  const emit = ev => listeners.forEach(cb => { try { cb(ev, session); } catch (e) { console.error(e); } });
  function setSession(u){
    const tok = 'a.' + u.id + '.' + (++st.seq);
    st.tokens[tok] = u.id; save();
    session = { access_token: tok, user: clone(u) };
    localStorage.setItem(LS, JSON.stringify(session));
  }
  const auth = {
    onAuthStateChange(cb){ listeners.push(cb); setTimeout(() => cb('INITIAL_SESSION', session), 0);
      return { data: { subscription: { unsubscribe(){} } } }; },
    async getSession(){ return { data: { session }, error: null }; },
    async getUser(){ const u = session && st.users[session.user.id];
      return u ? { data: { user: clone(u) }, error: null } : { data: { user: null }, error: { message: 'no session' } }; },
    async signInWithPassword({ email, password }){
      const u = findByEmail(email);
      if (!u || !u.password || u.password !== password || u.banned_until) return { data: {}, error: { message: 'Invalid login credentials' } };
      setSession(u); emit('SIGNED_IN'); return { data: { session }, error: null };
    },
    async verifyOtp({ token_hash, type }){
      S.verify.push(type);
      if (type !== 'email') return { data: {}, error: { message: 'bad type' } };
      const m = /^h-(u\d+)-(\d+)$/.exec(token_hash || '');
      if (!m || st.used[token_hash] || +m[2] !== st.links) return { data: {}, error: { message: 'Token has expired or is invalid' } };
      st.used[token_hash] = 1;
      setSession(st.users[m[1]]); emit('SIGNED_IN'); return { data: { session }, error: null };
    },
    async updateUser({ password, data }){
      const u = session && st.users[session.user.id];
      if (!u) return { data: {}, error: { message: 'no session' } };
      if (password){ if (password === u.password) return { data: {}, error: { message: 'New password should be different from the old password.' } };
        u.password = password; }
      if (data) u.user_metadata = { ...u.user_metadata, ...data };
      save(); session.user = clone(u); localStorage.setItem(LS, JSON.stringify(session));
      emit('USER_UPDATED'); return { data: { user: clone(u) }, error: null };
    },
    async signOut(){ session = null; localStorage.removeItem(LS); emit('SIGNED_OUT'); return { error: null }; },
  };
  window.supabase = { createClient(){
    return {
      auth, from: builder,
      rpc: async () => ({ data: null, error: null }),
      functions: { async invoke(name, { body }){
        S.invokes.push(body && body.action);
        if (S.down) return { data: null, error: { message: 'Failed to send a request to the Edge Function' } };
        const req = new Request('https://fake.test/functions/v1/' + name, { method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (session ? session.access_token : 'sb_publishable_x') },
          body: JSON.stringify(body) });
        const res = await window.__emailLoginHandle(req, admin);
        return { data: await res.json(), error: null };
      } },
      channel(){ const ch = { on(){ return ch; }, subscribe(cb){ if (cb) setTimeout(() => cb('SUBSCRIBED'), 0); return ch; },
        send(){ return Promise.resolve('ok'); }, unsubscribe(){} }; return ch; },
      removeChannel(){},
    };
  } };
})();
"""

SEED = r"""
(() => {
  if (localStorage.getItem('__fakeSB')) return;
  const st = { db: { access_emails: [], profiles: [{ id: 'u1', email: 'owner@mathh.ru' }], board_access: [],
               boards: [] }, users: { u1: { id: 'u1', email: 'owner@mathh.ru', app_metadata: { is_owner: true },
               user_metadata: { has_password: true }, banned_until: null, password: 'ownerpw' } },
               tokens: {}, used: {}, seq: 10, links: 0 };
  localStorage.setItem('__fakeSB', JSON.stringify(st));
})();
"""


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT)], cwd=HERE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                conn = http.client.HTTPConnection('127.0.0.1', PORT, timeout=0.2)
                conn.request('GET', '/boards.html')
                conn.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        yield
    finally:
        proc.terminate()
        proc.wait(timeout=5)


def rect(page, sel):
    return page.evaluate("""s => { const e = document.querySelector(s); if (!e) return null;
        const r = e.getBoundingClientRect(); return r.width ? [r.left, r.top, r.right, r.bottom] : null; }""", sel)


def overlap(a, b):
    return bool(a and b and a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3])


def visible(page, sel):
    return page.evaluate("""s => { const e = document.querySelector(s); if (!e) return false;
        const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
        return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; }""", sel)


COVERS = """() => { const pb = document.getElementById('agPwBanner'); const b = pb.getBoundingClientRect();
  if (!b.width) return ['плашки не видно']; const out = [];
  for (const el of document.querySelectorAll('#screenList button, #screenList a, #screenList input, #screenList .bl-title,'
      + ' #screenBoard button, #screenBoard a, #screenBoard input, .bd-rail, #bdShareBtn, #lgMenuToggle')) {
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    if (getComputedStyle(el).visibility === 'hidden') continue;
    if (r.left < b.right - 1 && b.left < r.right - 1 && r.top < b.bottom - 1 && b.top < r.bottom - 1)
      out.push(el.id || String(el.className).slice(0, 30) || el.tagName); }
  return out; }"""


def covers(page):
    return page.evaluate(COVERS)


def gate_error(page):
    return page.evaluate("() => { const e = document.getElementById('agError'); return e.hidden ? '' : e.textContent; }")


def wait_gate_form(page):
    page.wait_for_function("() => { const g = document.getElementById('authGate'); const s = document.getElementById('agStep1');"
                           " return g && g.style.display !== 'none' && !s.hidden; }")


def wait_inside(page):
    page.wait_for_function("() => document.getElementById('authGate').style.display === 'none' && window.CURRENT_USER")
    page.wait_for_timeout(150)


def login(page, email, password=''):
    wait_gate_form(page)
    # старый текст ошибки остаётся в скрытом блоке — стираем, чтобы ожидание
    # ниже не сработало на прошлой ошибке раньше ответа
    page.evaluate("() => { document.getElementById('agError').textContent = ''; }")
    page.fill('#agEmail', email)
    page.fill('#agPassword', password)
    page.click('#agSend')


def sign_out(page):
    page.evaluate("() => document.getElementById('agSignOut').click()")
    wait_gate_form(page)


def open_access(page):
    page.click('#agOpenAccess')
    page.wait_for_function("() => document.getElementById('agAccess').classList.contains('open')"
                           " && !/Загрузка/.test(document.getElementById('agAccList').textContent)")


def acc_msg(page):
    return page.evaluate("() => { const m = document.getElementById('agAccMsg'); return m.hidden ? '' : m.textContent; }")


def new_page(ctx, path='/boards.html'):
    page = ctx.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.route('**/supabase-js.umd.js', lambda r: r.fulfill(status=200, content_type='application/javascript',
                                                             body=FAKE_LIB + FUNC_JS))
    page.route('https://fonts.googleapis.com/**', lambda r: r.abort())
    page.route('https://fonts.gstatic.com/**', lambda r: r.abort())
    page.goto(BASE + path)
    return page


FUNC_JS = ''


def run():
    global FUNC_JS
    FUNC_JS = function_js()
    os.makedirs(SHOTS, exist_ok=True)
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={'width': 1280, 'height': 800})
        ctx.add_init_script(SEED)
        ctx.add_init_script("try { localStorage.setItem('theme', 'light'); } catch (e) {}")

        print('A. форма входа')
        page = new_page(ctx, '/boards.html?invite=old-link-123')
        wait_gate_form(page)
        check('invite' not in page.url, f'?invite= убран из адреса ({page.url})')
        check(page.locator('#agSendLink').count() == 0 and page.locator('#agInviteInvalid').count() == 0
              and page.locator('#agCreateInvite').count() == 0, 'ни «прислать ссылку», ни приглашений')
        check(visible(page, '#agEmail') and visible(page, '#agPassword') and visible(page, '#agSend'), 'почта, пароль, «Войти»')
        page.screenshot(path=f'{SHOTS}/a_gate.png')
        login(page, 'stranger@mail.ru')
        page.wait_for_function("() => !document.getElementById('agError').hidden")
        check('не добавлена' in gate_error(page), f'почты нет в списке — «не добавлена» ({gate_error(page)})')
        page.evaluate("() => { window.__fake.down = true; }")
        login(page, 'stranger@mail.ru')
        page.wait_for_function("() => /связаться/.test(document.getElementById('agError').textContent)")
        check('связаться с сервером' in gate_error(page), 'функция не отвечает — «не получилось связаться»')
        page.evaluate("() => { window.__fake.down = false; }")
        login(page, 'owner@mathh.ru')
        page.wait_for_function("() => /пароль/.test(document.getElementById('agError').textContent)")
        check('задан пароль' in gate_error(page), 'владелец по одной почте — «задан пароль, введите его»')

        print('B. владелец')
        login(page, 'owner@mathh.ru', 'ownerpw')
        wait_inside(page)
        check(visible(page, '#agOpenAccess'), '«доступ» в плашке')
        check(not visible(page, '#agPwBanner'), 'красной плашки у владельца нет')
        open_access(page)
        check(visible(page, '#agAccRole'), 'владелец выбирает роль')
        page.fill('#agAccEmails', 'Eng.Teacher@Mail.ru,\nrus.teacher@mail.ru кривая-почта')
        page.fill('#agAccLabel', 'Преподаватель языков')
        page.select_option('#agAccRole', 'teacher')
        page.click('#agAccAdd')
        page.wait_for_function("() => /Добавлено/.test(document.getElementById('agAccMsg').textContent)")
        msg = acc_msg(page)
        check('Добавлено: 2' in msg and 'кривая-почта — не похоже на почту' in msg, f'итог добавления ({msg!r})')
        check(page.input_value('#agAccEmails') == 'кривая-почта', 'в поле осталась только кривая почта')
        page.wait_for_function("() => /Преподаватели · 2/.test(document.getElementById('agAccList').textContent)")
        lst = page.inner_text('#agAccList')
        check('eng.teacher@mail.ru' in lst and 'Преподаватель языков' in lst and 'ещё не входил' in lst,
              'список: почта строчными, подпись, «ещё не входил»')
        page.screenshot(path=f'{SHOTS}/b_access_owner.png')
        page.keyboard.press('Escape')
        sign_out(page)

        print('C. преподаватель по почте')
        login(page, 'eng.teacher@mail.ru')
        wait_inside(page)
        check(page.evaluate("() => window.__fake.verify.slice(-1)[0]") == 'email', 'вход: verifyOtp с type email')
        check(page.evaluate("() => window.mathhRole()") == 'teacher', 'роль преподавателя')
        page.wait_for_function("() => document.getElementById('agPwBanner').classList.contains('open')")
        check(visible(page, '#agPwBanner'), 'красная плашка видна')
        check(page.evaluate("() => getComputedStyle(document.getElementById('agPwBanner')).borderTopColor") == 'rgb(255, 59, 48)',
              'рамка красная')
        page.wait_for_timeout(600)
        b = rect(page, '#agPwBanner')
        check(b and b[0] < 640 and b[1] < 80, f'плашка слева сверху ({b})')
        check(not covers(page), f'в списке плашка ничего не перекрывает ({covers(page)})')
        page.screenshot(path=f'{SHOTS}/c_teacher_list.png')
        check(visible(page, '#agOpenAccess'), '«доступ» есть у преподавателя')
        open_access(page)
        check(not visible(page, '#agAccRole'), 'роль преподаватель не выбирает')
        page.fill('#agAccEmails', 'pupil@mail.ru')
        page.click('#agAccAdd')
        page.wait_for_function("() => /Мои ученики · 1/.test(document.getElementById('agAccList').textContent)")
        check(page.evaluate("() => window.__fake.st.db.access_emails.find(r => r.email === 'pupil@mail.ru').role") == 'student',
              'добавлен учеником')
        page.screenshot(path=f'{SHOTS}/c_access_teacher.png')
        page.keyboard.press('Escape')

        # доска: плашка не на «Назад к доскам» и не на рейле
        page.evaluate("""() => { const db = window.getDB(); const id = 'bT' + Date.now();
            db.boards.push({ id, name: 'Урок', folderId: null, createdAt: Date.now(), updatedAt: Date.now(),
              lastOpenedAt: null, rev: 1, cellSize: 24, sheetCols: 76, sheetRows: 54, pageOrder: 'h', objects: [],
              recentColors: [], colorUsage: {}, view: { x: 0, y: 0, zoom: 1 } });
            window.saveDB(); window.openBoard(id); }""")
        page.wait_for_timeout(700)
        b = rect(page, '#agPwBanner')
        bb = rect(page, '#bdBack')
        check(b and bb and b[0] > bb[2] and abs((b[1] + b[3]) / 2 - (bb[1] + bb[3]) / 2) < 3,
              f'на доске — в верхней строке правее «Назад к доскам» ({b}, {bb})')
        check(not covers(page), f'на доске плашка ничего не перекрывает ({covers(page)})')
        page.screenshot(path=f'{SHOTS}/c_teacher_board.png')

        print('D. пароль преподавателя')
        page.click('#agPwBanner')
        page.wait_for_function("() => document.getElementById('agPwModal').classList.contains('open')")
        page.fill('#agPw1', 'secret1')
        page.fill('#agPw2', 'secret2')
        page.click('#agPwSave')
        check('не совпадают' in page.inner_text('#agPwMsg'), 'пароли не совпадают — ошибка')
        page.fill('#agPw1', '123')
        page.fill('#agPw2', '123')
        page.click('#agPwSave')
        check('не короче 6' in page.inner_text('#agPwMsg'), 'короткий — ошибка')
        page.screenshot(path=f'{SHOTS}/d_pw_modal.png')
        page.fill('#agPw1', 'secret1')
        page.fill('#agPw2', 'secret1')
        page.click('#agPwSave')
        page.wait_for_function("() => !document.getElementById('agPwBanner').classList.contains('open')")
        check(page.inner_text('#agSetPassword') == 'сменить пароль', 'плашка ушла, «сменить пароль»')
        check(page.evaluate("() => window.__fake.st.users[window.CURRENT_USER.id].user_metadata.has_password") is True,
              'has_password в аккаунте')
        page.wait_for_function("() => !document.getElementById('agPwModal').classList.contains('open')")
        sign_out(page)
        login(page, 'eng.teacher@mail.ru')
        page.wait_for_function("() => /пароль/.test(document.getElementById('agError').textContent)")
        check('задан пароль' in gate_error(page), 'по одной почте больше нельзя — «задан пароль»')
        login(page, 'eng.teacher@mail.ru', 'secret1')
        wait_inside(page)
        check(not visible(page, '#agPwBanner'), 'паролем — внутри, без плашки')

        print('E. «Совместная работа» — новая почта')
        page.evaluate("""() => { window.__fake.st.db.boards.push({ id: 'cbT', owner: window.CURRENT_USER.id, title: 'Общая' });
            window.__fake.save();
            const db = window.getDB(); const id = 'bS' + Date.now();
            db.boards.push({ id, name: 'Общая', folderId: null, createdAt: Date.now(), updatedAt: Date.now(),
              lastOpenedAt: null, rev: 1, cellSize: 24, sheetCols: 76, sheetRows: 54, pageOrder: 'h', objects: [],
              recentColors: [], colorUsage: {}, view: { x: 0, y: 0, zoom: 1 }, cloudBoardId: 'cbT', cloudRole: 'owner' });
            window.saveDB(); window.openBoard(id); }""")
        page.wait_for_timeout(400)
        page.click('#bdShareBtn')
        page.wait_for_selector('#bdShareEmail')
        page.fill('#bdShareEmail', 'New.Pupil@mail.ru')
        page.click('#bdShareAddBtn')
        page.wait_for_function("() => /new\\.pupil@mail\\.ru/.test(document.getElementById('bdSharePop').textContent)", timeout=5000)
        st = page.evaluate("""() => { const s = window.__fake.st; const row = s.db.access_emails.find(r => r.email === 'new.pupil@mail.ru');
            const acc = s.db.board_access.find(a => a.board_id === 'cbT'); return { role: row && row.role,
            uid: row && row.user_id, acc: acc && acc.user_id }; }""")
        check(st['role'] == 'student' and st['uid'] and st['acc'] == st['uid'],
              f'почта добавлена учеником и сразу получила доступ к доске ({st})')
        page.screenshot(path=f'{SHOTS}/e_share.png')
        page.click('#bdShareBtn')
        sign_out(page)

        print('F. ученик')
        login(page, 'new.pupil@mail.ru')
        wait_inside(page)
        check(page.evaluate("() => window.mathhRole()") == 'student', 'роль ученика')
        check(not visible(page, '#agPwBanner') and not visible(page, '#agOpenAccess'), 'ни плашки, ни «доступа»')
        res = page.evaluate("() => window.mathhAddAccess('hack@mail.ru', 'teacher')")
        check(res == {'ok': False, 'error': 'forbidden'}, 'ученику функция добавлять не даёт')
        sign_out(page)

        print('G. владелец: роль, сброс, убрать')
        login(page, 'owner@mathh.ru', 'ownerpw')
        wait_inside(page)
        open_access(page)
        lst = page.inner_text('#agAccList')
        check('пароль задан' in lst and 'добавил(а) eng.teacher@mail.ru' in lst, 'видно «пароль задан» и кто добавил')
        page.select_option('.ag-acc-item[data-email="rus.teacher@mail.ru"] select', 'student')
        page.wait_for_function("() => /Ученики · 3/.test(document.getElementById('agAccList').textContent)")
        check(page.evaluate("() => Object.values(window.__fake.st.users).find(u => u.email === 'rus.teacher@mail.ru').app_metadata.mathh_role") == 'student',
              'роль сменилась и в аккаунте')
        page.click('.ag-acc-item[data-email="eng.teacher@mail.ru"] button[data-act="reset"]')
        page.wait_for_function("() => /пароль сброшен/.test(document.getElementById('agAccMsg').textContent)")
        check('пароль задан' not in page.inner_text('.ag-acc-item[data-email="eng.teacher@mail.ru"]'), 'сброс: «пароль задан» ушло')
        page.click('.ag-acc-item[data-email="pupil@mail.ru"] button[data-act="remove-ask"]')
        check(page.locator('.ag-acc-item[data-email="pupil@mail.ru"] button.confirm').count() == 1, '«Убрать» спрашивает «Точно?»')
        check(page.evaluate("() => !!window.__fake.st.db.access_emails.find(r => r.email === 'pupil@mail.ru')"),
              'до второго нажатия ничего не убрано')
        page.click('.ag-acc-item[data-email="pupil@mail.ru"] button.confirm')
        page.wait_for_function("() => /вход закрыт/.test(document.getElementById('agAccMsg').textContent)")
        page.wait_for_function("() => !document.querySelector('.ag-acc-item[data-email=\"pupil@mail.ru\"]')")
        check(True, 'строка исчезла')
        page.fill('#agAccFilter', 'eng')
        check(page.locator('.ag-acc-item').count() == 1, 'поиск по почте')
        page.fill('#agAccFilter', '')
        page.keyboard.press('Escape')
        sign_out(page)
        login(page, 'pupil@mail.ru')
        page.wait_for_function("() => /не добавлена/.test(document.getElementById('agError').textContent)")
        check(True, 'убранный ученик не входит')
        login(page, 'eng.teacher@mail.ru')
        wait_inside(page)
        page.wait_for_function("() => document.getElementById('agPwBanner').classList.contains('open')")
        check(True, 'после сброса — снова по почте, снова красная плашка')

        print('H. телефон и тёмная тема')
        phone = browser.new_context(viewport={'width': 375, 'height': 740}, is_mobile=True, has_touch=True)
        phone.add_init_script(SEED)
        phone.add_init_script("try { localStorage.setItem('theme', 'dark'); } catch (e) {}")
        pp = new_page(phone)
        pp.evaluate("""(st) => { localStorage.setItem('__fakeSB', st); }""",
                    page.evaluate("() => localStorage.getItem('__fakeSB')"))
        pp.reload()
        login(pp, 'eng.teacher@mail.ru')
        wait_inside(pp)
        pp.wait_for_function("() => document.getElementById('agPwBanner').classList.contains('open')")
        pp.wait_for_timeout(700)
        b = rect(pp, '#agPwBanner')
        check(b and b[0] >= 0 and b[2] <= 375, f'плашка в экране телефона ({b})')
        check(not covers(pp), f'телефон, список: ничего не перекрывает ({covers(pp)})')
        pp.screenshot(path=f'{SHOTS}/h_phone_banner_dark.png')
        pp.evaluate("""() => { const db = window.getDB(); const id = 'bP' + Date.now();
            db.boards.push({ id, name: 'Урок', folderId: null, createdAt: Date.now(), updatedAt: Date.now(),
              lastOpenedAt: null, rev: 1, cellSize: 24, sheetCols: 76, sheetRows: 54, pageOrder: 'h', objects: [],
              recentColors: [], colorUsage: {}, view: { x: 0, y: 0, zoom: 1 } });
            window.saveDB(); window.openBoard(id); }""")
        pp.wait_for_timeout(800)
        b = rect(pp, '#agPwBanner')
        check(b and b[0] >= 0 and b[2] <= 375, f'телефон, доска: плашка в экране ({b})')
        check(not covers(pp), f'телефон, доска: ничего не перекрывает ({covers(pp)})')
        pp.screenshot(path=f'{SHOTS}/h_phone_board_dark.png')
        pp.evaluate("() => document.getElementById('bdBack').click()")
        pp.wait_for_timeout(500)
        pp.evaluate("() => document.getElementById('agOpenAccess').click()")
        pp.wait_for_function("() => document.getElementById('agAccess').classList.contains('open')"
                             " && !/Загрузка/.test(document.getElementById('agAccList').textContent)")
        sw = pp.evaluate("() => document.documentElement.scrollWidth")
        card = rect(pp, '#agAccess .ag-card')
        check(sw <= 375 and card and card[0] >= 0 and card[2] <= 375, f'окно «Доступ» в экране ({card}, scrollWidth {sw})')
        pp.screenshot(path=f'{SHOTS}/h_phone_access_dark.png')
        pp.evaluate("() => document.getElementById('agAccess').classList.remove('open')")
        pp.click('#agPwBanner')
        pp.wait_for_function("() => document.getElementById('agPwModal').classList.contains('open')")
        pp.screenshot(path=f'{SHOTS}/h_phone_pw_dark.png')
        phone.close()

        browser.close()

    real_errors = [e for e in errors if 'fonts' not in e]
    check(not real_errors, f'без ошибок JavaScript ({real_errors[:3]})')


if __name__ == '__main__':
    run()
    print()
    if failures:
        print(f'ПРОВАЛЕНО: {len(failures)}')
        for f in failures:
            print(' -', f)
        sys.exit(1)
    print('Всё прошло')
