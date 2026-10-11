"""
Промпт №83: вход по списку почт — серверная часть.

  1. access-schema.sql на временном Postgres с имитацией Supabase (как в
     тесте №15 «работы»): применяется дважды; у anon и authenticated нет
     прав на таблицу; старые аккаунты переносятся учениками, владелец — нет;
     почта только строчными; роль только teacher/student.
  2. Логика функции supabase/functions/email-login/index.ts в node с
     заглушкой клиента Supabase (в песочнице нет ни Deno, ни сети до
     Supabase):
     A. вход: почты нет в списке — not_allowed; есть — аккаунт создаётся,
        выдаётся token_hash, роль уходит в app_metadata, last_login_at;
        «Masha@Mail.RU » — та же почта; кривая почта — bad_email;
     B. владелец и тот, кто задал пароль, по одной почте не входят —
        password_required;
     C. управление без входа и учеником — forbidden; владелец добавляет
        пачку «через запятую и с новой строки», роль и подпись, аккаунты
        создаются сразу (user_id есть — можно звать к доске);
     D. преподаватель добавляет только учеников (роль из запроса не
        слушается), видит в списке только своих, не может убрать или
        сбросить чужого, ученика другого преподавателя получает как
        «exists» с user_id и не перехватывает;
     E. убрать — строка уходит, аккаунт блокируется (не удаляется), вход —
        not_allowed; вернуть — блок снимается, вход снова есть;
     F. смена роли владельцем — в таблице и в app_metadata; преподаватель,
        которого сделали учеником, теряет управление сразу (роль берётся из
        таблицы, а не из старого токена);
     G. сброс пароля — пароль затёрт, has_password снят, вход по почте
        снова работает;
     H. список: has_password, кто добавил, can_manage; CORS на OPTIONS.

Запуск: python3 test_prompt83_access_server.py
"""
import json
import os
import re
import subprocess
import sys
import tempfile

import test_prompt15_works_schema as W

HERE = os.path.dirname(os.path.abspath(__file__))
SCHEMA = os.path.join(HERE, 'access-schema.sql')
FUNC = os.path.join(HERE, 'supabase', 'functions', 'email-login', 'index.ts')

FAILS = []


def check(cond, msg):
    print(('  ok  ' if cond else '  FAIL ') + msg)
    if not cond:
        FAILS.append(msg)


OWNER = '00000000-0000-4000-8000-000000000001'
OLD = '00000000-0000-4000-8000-000000000002'
OLD2 = '00000000-0000-4000-8000-000000000003'


def test_schema():
    print('— access-schema.sql')
    pg = W.PG()
    try:
        pg.ok(W.SUPABASE_STUB)
        # в заглушке auth.users только id — добавляем то, что читает перенос
        pg.ok("""alter table auth.users add column email text, add column raw_app_meta_data jsonb,
                 add column created_at timestamptz default now();""")
        pg.ok(f"""insert into auth.users (id, email, raw_app_meta_data) values
                 ('{OWNER}', 'Owner@Mathh.ru', '{{"is_owner": true}}'),
                 ('{OLD}', 'Old.Student@Mail.ru', '{{}}'),
                 ('{OLD2}', 'second@mail.ru', null);""")
        sql = open(SCHEMA, encoding='utf-8').read()
        pg.ok(sql)
        pg.ok("update public.access_emails set role = 'teacher', label = 'правка руками' where email = 'second@mail.ru';")
        pg.ok(sql)  # повторный запуск
        rows = pg.ok("select email || '|' || role || '|' || coalesce(user_id::text, '') || '|' || coalesce(label, '') from public.access_emails order by email;").splitlines()
        check(rows == [f'old.student@mail.ru|student|{OLD}|аккаунт до нового входа',
                       f'second@mail.ru|teacher|{OLD2}|правка руками'],
              f'перенос: старые аккаунты учениками, владельца нет, повторный запуск не перетёр правку ({rows})')
        check(pg.ok("select relrowsecurity from pg_class where relname = 'access_emails';") == 't', 'RLS включён')
        for role in ('anon', 'authenticated'):
            err = pg.fails('select * from public.access_emails;', role=role, uid=OLD)
            check(err is not None and 'permission denied' in err, f'{role}: чтение запрещено')
            err = pg.fails("insert into public.access_emails (email) values ('x@y.ru');", role=role, uid=OLD)
            check(err is not None and 'permission denied' in err, f'{role}: запись запрещена')
        check(pg.fails("insert into public.access_emails (email) values ('Big@Mail.ru');") is not None,
              'почта не строчными — отказ')
        check(pg.fails("insert into public.access_emails (email, role) values ('a@b.ru', 'admin');") is not None,
              'роль не teacher/student — отказ')
    finally:
        pg.stop()


# ---------- функция в node ----------

FAKE_ADMIN = r"""
const S = { users: new Map(), rows: new Map(), profiles: new Map(), tokens: new Map(), seq: 0, links: 0 };
globalThis.S = S;
const clone = v => v == null ? v : JSON.parse(JSON.stringify(v));
function tableOf(t){ if (t === 'access_emails') return S.rows; if (t === 'profiles') return S.profiles; throw new Error('таблица ' + t); }
function keyOf(t, r){ return t === 'access_emails' ? r.email : r.id; }
function from(table){
  const q = { op: 'select', f: [], one: false, lim: 0, payload: null, ord: null };
  const b = {
    select(){ return b; }, order(k, o){ q.ord = [k, o]; return b; }, limit(n){ q.lim = n; return b; },
    eq(k, v){ q.f.push(r => r[k] === v); return b; },
    ilike(k, p){ let src = '';
      for (let i = 0; i < p.length; i++){ const c = p[i];
        if (c === '\\') { i++; src += p[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
        else if (c === '%') src += '.*'; else if (c === '_') src += '.';
        else src += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
      const re = new RegExp('^' + src + '$', 'i');
      q.f.push(r => re.test(r[k] || '')); return b; },
    maybeSingle(){ q.one = true; return b; },
    insert(p){ q.op = 'insert'; q.payload = p; return b; },
    update(p){ q.op = 'update'; q.payload = p; return b; },
    upsert(p){ q.op = 'upsert'; q.payload = p; return b; },
    delete(){ q.op = 'delete'; return b; },
    then(res, rej){ return Promise.resolve().then(run).then(res, rej); },
  };
  function run(){
    const T = tableOf(table);
    const match = () => [...T.values()].filter(r => q.f.every(f => f(r)));
    if (q.op === 'insert'){ const k = keyOf(table, q.payload);
      if (T.has(k)) return { data: null, error: { message: 'duplicate key' } };
      T.set(k, { created_at: new Date(Date.now() + (S.seq++)).toISOString(), last_login_at: null, ...clone(q.payload) });
      return { data: null, error: null }; }
    if (q.op === 'upsert'){ const k = keyOf(table, q.payload); T.set(k, { ...(T.get(k) || {}), ...clone(q.payload) }); return { data: null, error: null }; }
    if (q.op === 'update'){ match().forEach(r => Object.assign(r, clone(q.payload))); return { data: null, error: null }; }
    if (q.op === 'delete'){ match().forEach(r => T.delete(keyOf(table, r))); return { data: null, error: null }; }
    let rows = match().map(clone);
    if (q.ord) rows.sort((a, b) => (a[q.ord[0]] < b[q.ord[0]] ? -1 : 1) * (q.ord[1] && q.ord[1].ascending === false ? -1 : 1));
    if (q.lim) rows = rows.slice(0, q.lim);
    if (q.one) return { data: rows[0] || null, error: null };
    return { data: rows, error: null };
  }
  return b;
}
function newUser(email, extra){
  const id = 'u' + (++S.seq);
  const u = { id, email, app_metadata: {}, user_metadata: {}, banned_until: null, password: null, ...(extra || {}) };
  S.users.set(id, u);
  return u;
}
globalThis.newUser = newUser;
const admin = {
  from,
  auth: {
    async getUser(token){ const id = S.tokens.get(token); const u = id && S.users.get(id);
      return u ? { data: { user: clone(u) }, error: null } : { data: { user: null }, error: { message: 'bad jwt' } }; },
    admin: {
      async createUser({ email, email_confirm }){
        if ([...S.users.values()].some(u => u.email.toLowerCase() === email.toLowerCase()))
          return { data: { user: null }, error: { message: 'A user with this email address has already been registered' } };
        const u = newUser(email, { confirmed: !!email_confirm });
        S.profiles.set(u.id, { id: u.id, email }); // как триггер на auth.users
        return { data: { user: clone(u) }, error: null };
      },
      async getUserById(id){ const u = S.users.get(id); return { data: { user: clone(u) || null }, error: u ? null : { message: 'nf' } }; },
      async generateLink({ type, email }){
        const u = [...S.users.values()].find(x => x.email.toLowerCase() === email.toLowerCase());
        if (!u) return { data: null, error: { message: 'User not found' } };
        S.links++;
        return { data: { user: clone(u), properties: { hashed_token: 'h-' + u.id + '-' + S.links } }, error: null };
      },
      async updateUserById(id, p){
        const u = S.users.get(id); if (!u) return { data: null, error: { message: 'nf' } };
        if (p.app_metadata) u.app_metadata = { ...u.app_metadata, ...p.app_metadata };
        if (p.user_metadata) u.user_metadata = { ...u.user_metadata, ...p.user_metadata };
        if (p.password) u.password = p.password;
        if (p.ban_duration === 'none') u.banned_until = null;
        else if (p.ban_duration) u.banned_until = new Date(Date.now() + 1e12).toISOString();
        return { data: { user: clone(u) }, error: null };
      },
      async listUsers({ page, perPage }){ const all = [...S.users.values()].map(clone);
        return { data: { users: all.slice((page - 1) * perPage, page * perPage) }, error: null }; },
    },
  },
};
globalThis.admin = admin;
"""

HARNESS = r"""
const { handle } = await import(process.argv[2]);
const out = [];
async function call(body, token, method){
  const headers = { 'Content-Type': 'application/json' };
  headers.Authorization = 'Bearer ' + (token || 'sb_publishable_xxx');
  const req = new Request('https://x.test/functions/v1/email-login', { method: method || 'POST', headers,
    body: method === 'OPTIONS' ? undefined : JSON.stringify(body) });
  const res = await handle(req, admin);
  if (method === 'OPTIONS') return { status: res.status, cors: res.headers.get('Access-Control-Allow-Origin') };
  return res.json();
}
const R = {};
const owner = newUser('owner@mathh.ru', { app_metadata: { is_owner: true } });
S.profiles.set(owner.id, { id: owner.id, email: 'owner@mathh.ru' });
S.tokens.set('a.owner.t', owner.id);

R.notAllowed = await call({ action: 'login', email: 'nobody@mail.ru' });
R.badEmail = await call({ action: 'login', email: 'не почта' });
R.ownerLogin0 = await call({ action: 'login', email: 'owner@mathh.ru' });
R.addAnon = await call({ action: 'add', emails: 'a@b.ru' });
R.addBatch = await call({ action: 'add', emails: 'Eng.Teacher@Mail.ru,\n rus_teacher@mail.ru ; кривая, owner@mathh.ru', role: 'teacher', label: 'Преподаватель' }, 'a.owner.t');
R.rowsAfterBatch = [...S.rows.values()].map(r => [r.email, r.role, r.label, !!r.user_id]);
R.usersAfterBatch = [...S.users.values()].map(u => u.email).sort();

const eng = [...S.users.values()].find(u => u.email === 'eng.teacher@mail.ru');
R.engLogin = await call({ action: 'login', email: ' ENG.teacher@mail.RU ' });
R.engMeta = S.users.get(eng.id).app_metadata;
R.engLastLogin = !!S.rows.get('eng.teacher@mail.ru').last_login_at;
S.tokens.set('a.eng.t', eng.id);
const rus = [...S.users.values()].find(u => u.email === 'rus_teacher@mail.ru');
S.tokens.set('a.rus.t', rus.id);

// преподаватель: только ученики, только свои
R.engAdd = await call({ action: 'add', emails: 'pupil1@mail.ru\npupil2@mail.ru', role: 'teacher', label: 'Петя' }, 'a.eng.t');
R.engAddRoles = ['pupil1@mail.ru', 'pupil2@mail.ru'].map(e => S.rows.get(e).role + ':' + (S.rows.get(e).added_by === eng.id));
R.rusAddOther = await call({ action: 'add', emails: 'pupil1@mail.ru', label: 'чужой' }, 'a.rus.t');
R.pupil1AfterRus = [S.rows.get('pupil1@mail.ru').added_by === eng.id, S.rows.get('pupil1@mail.ru').label];
R.rusAddTeacher = await call({ action: 'add', emails: 'eng.teacher@mail.ru', role: 'student' }, 'a.rus.t');
R.engRoleAfterRus = S.rows.get('eng.teacher@mail.ru').role;
R.rusRemoveOther = await call({ action: 'remove', email: 'pupil1@mail.ru' }, 'a.rus.t');
R.rusResetOther = await call({ action: 'reset_password', email: 'pupil1@mail.ru' }, 'a.rus.t');
R.rusSetRole = await call({ action: 'set_role', email: 'pupil1@mail.ru', role: 'teacher' }, 'a.rus.t');
R.rusList = await call({ action: 'list' }, 'a.rus.t');
R.engList = await call({ action: 'list' }, 'a.eng.t');
R.ownerList = await call({ action: 'list' }, 'a.owner.t');

// ученик в управление не пускается
const p1 = [...S.users.values()].find(u => u.email === 'pupil1@mail.ru');
R.pupilLogin = await call({ action: 'login', email: 'pupil1@mail.ru' });
S.tokens.set('a.p1.t', p1.id);
R.pupilAdd = await call({ action: 'add', emails: 'x@mail.ru' }, 'a.p1.t');
R.pupilList = await call({ action: 'list' }, 'a.p1.t');

// пароль задан — только паролем
S.users.get(eng.id).user_metadata.has_password = true;
R.engLoginPw = await call({ action: 'login', email: 'eng.teacher@mail.ru' });
R.ownerListPw = (await call({ action: 'list' }, 'a.owner.t')).rows.find(r => r.email === 'eng.teacher@mail.ru').has_password;
R.ownerReset = await call({ action: 'reset_password', email: 'eng.teacher@mail.ru' }, 'a.owner.t');
R.engAfterReset = [S.users.get(eng.id).user_metadata.has_password, (S.users.get(eng.id).password || '').length];
R.engLoginAfterReset = await call({ action: 'login', email: 'eng.teacher@mail.ru' });

// убрать и вернуть
R.engRemovePupil2 = await call({ action: 'remove', email: 'pupil2@mail.ru' }, 'a.eng.t');
const p2 = [...S.users.values()].find(u => u.email === 'pupil2@mail.ru');
R.afterRemove = [S.rows.has('pupil2@mail.ru'), S.users.has(p2.id), !!S.users.get(p2.id).banned_until];
R.loginRemoved = await call({ action: 'login', email: 'pupil2@mail.ru' });
R.readd = await call({ action: 'add', emails: 'pupil2@mail.ru' }, 'a.eng.t');
R.afterReadd = [!!S.users.get(p2.id).banned_until, R.readd.results[0].user_id === p2.id];
R.loginReadd = await call({ action: 'login', email: 'pupil2@mail.ru' });

// смена роли: rus стал учеником — управление пропадает сразу, хотя
// app_metadata в его старом токене ещё «teacher»
R.setRole = await call({ action: 'set_role', email: 'rus_teacher@mail.ru', role: 'student' }, 'a.owner.t');
R.rusMeta = S.users.get(rus.id).app_metadata.mathh_role;
R.rusAddAfter = await call({ action: 'add', emails: 'y@mail.ru' }, 'a.rus.t');

// старый аккаунт без строки в profiles: перенос записал user_id, вход работает
const legacy = newUser('Legacy@Mail.ru');
S.rows.set('legacy@mail.ru', { email: 'legacy@mail.ru', role: 'student', label: 'аккаунт до нового входа', user_id: legacy.id, added_by: null, created_at: '2026-01-01' });
R.legacyLogin = await call({ action: 'login', email: 'legacy@mail.ru' });
R.legacyProfile = (S.profiles.get(legacy.id) || {}).email;

R.options = await call(null, null, 'OPTIONS');
R.badAction = await call({ action: 'drop_table' });
console.log(JSON.stringify(R));
"""


def test_function():
    print('— функция email-login (node)')
    src = open(FUNC, encoding='utf-8').read()
    imp = "import { createClient } from 'npm:@supabase/supabase-js@2';"
    check(imp in src, 'импорт клиента статический (Supabase собирает только видимые импорты)')
    check('service_role' not in re.sub(r'//.*', '', src).replace('SUPABASE_SERVICE_ROLE_KEY', ''),
          'в коде функции нет ключа — только чтение из окружения')
    tmp = tempfile.mkdtemp(prefix='email_login_')
    mod = os.path.join(tmp, 'fn.mts')
    with open(mod, 'w', encoding='utf-8') as f:
        f.write(src.replace(imp, 'const createClient = null as any;'))
    harness = os.path.join(tmp, 'run.mjs')
    with open(harness, 'w', encoding='utf-8') as f:
        f.write(FAKE_ADMIN + HARNESS)
    p = subprocess.run(['node', '--experimental-strip-types', '--no-warnings', harness, 'file://' + mod],
                       capture_output=True, text=True, timeout=60)
    if p.returncode != 0:
        print(p.stderr)
        check(False, 'node-харнесс отработал')
        return
    R = json.loads(p.stdout.strip().splitlines()[-1])

    check(R['notAllowed'] == {'ok': False, 'error': 'not_allowed'}, 'A: почты нет в списке — not_allowed')
    check(R['badEmail'] == {'ok': False, 'error': 'bad_email'}, 'A: кривая почта — bad_email')
    check(R['ownerLogin0'] == {'ok': False, 'error': 'password_required'},
          'B: владельца в списке нет — по почте не войти, подсказка «нужен пароль»')
    check(R['addAnon'] == {'ok': False, 'error': 'forbidden'}, 'C: добавить без входа — forbidden')
    st = {r['email']: r['status'] for r in R['addBatch']['results']}
    check(st == {'eng.teacher@mail.ru': 'added', 'rus_teacher@mail.ru': 'added', 'кривая': 'bad_email',
                 'owner@mathh.ru': 'self'}, f'C: пачка через запятую и с новой строки ({st})')
    check(sorted(R['rowsAfterBatch']) == [['eng.teacher@mail.ru', 'teacher', 'Преподаватель', True],
                                          ['rus_teacher@mail.ru', 'teacher', 'Преподаватель', True]],
          f'C: роль и подпись, аккаунт создан сразу ({R["rowsAfterBatch"]})')
    check(R['engLogin'].get('ok') and R['engLogin'].get('token_hash', '').startswith('h-') and R['engLogin'].get('role') == 'teacher',
          f'A: вход по почте с пробелами и заглавными — token_hash ({R["engLogin"]})')
    check(R['engMeta'].get('mathh_role') == 'teacher', 'A: роль в app_metadata')
    check(R['engLastLogin'], 'A: last_login_at записан')

    check(R['engAddRoles'] == ['student:true', 'student:true'], f'D: преподаватель добавляет только учеников ({R["engAddRoles"]})')
    r = R['rusAddOther']['results'][0]
    check(r['status'] == 'exists' and r.get('user_id'), f'D: чужой ученик — exists с user_id ({r})')
    check(R['pupil1AfterRus'] == [True, 'Петя'], 'D: чужого ученика не перехватить и не переподписать')
    check(R['rusAddTeacher']['results'][0]['status'] == 'exists' and R['engRoleAfterRus'] == 'teacher',
          'D: преподаватель не превратит коллегу в ученика')
    check(R['rusRemoveOther'] == {'ok': False, 'error': 'forbidden'}, 'D: чужого ученика не убрать')
    check(R['rusResetOther'] == {'ok': False, 'error': 'forbidden'}, 'D: чужому ученику не сбросить пароль')
    check(R['rusSetRole'] == {'ok': False, 'error': 'forbidden'}, 'D: роль меняет только владелец')
    check(R['rusList']['ok'] and R['rusList']['rows'] == [], 'D: в списке у преподавателя только свои (пусто)')
    check(sorted(x['email'] for x in R['engList']['rows']) == ['pupil1@mail.ru', 'pupil2@mail.ru'],
          'D: у второго — его двое')
    check(len(R['ownerList']['rows']) == 4 and R['ownerList']['me'] == {'owner': True, 'teacher': False},
          'H: владелец видит всех')
    pr = next(x for x in R['ownerList']['rows'] if x['email'] == 'pupil1@mail.ru')
    check(pr['added_by_email'] == 'eng.teacher@mail.ru' and pr['can_manage'] is True and pr['has_password'] is False,
          f'H: кто добавил, can_manage, has_password ({pr})')

    check(R['pupilLogin'].get('ok') and R['pupilLogin'].get('role') == 'student', 'A: ученик входит по почте')
    check(R['pupilAdd'] == {'ok': False, 'error': 'forbidden'} and R['pupilList'] == {'ok': False, 'error': 'forbidden'},
          'C: ученику управление закрыто')

    check(R['engLoginPw'] == {'ok': False, 'error': 'password_required'}, 'B: задан пароль — по одной почте не войти')
    check(R['ownerListPw'] is True, 'H: в списке видно, что пароль задан')
    check(R['ownerReset'] == {'ok': True} and R['engAfterReset'][0] is False and R['engAfterReset'][1] >= 32,
          f'G: сброс пароля — затёрт случайным, пометка снята ({R["engAfterReset"]})')
    check(R['engLoginAfterReset'].get('ok') is True, 'G: после сброса снова по почте')

    check(R['engRemovePupil2'] == {'ok': True} and R['afterRemove'] == [False, True, True],
          f'E: убрать — строки нет, аккаунт цел и заблокирован ({R["afterRemove"]})')
    check(R['loginRemoved'] == {'ok': False, 'error': 'not_allowed'}, 'E: убранный не входит')
    check(R['afterReadd'] == [False, True] and R['loginReadd'].get('ok') is True, 'E: вернули — блок снят, тот же аккаунт, вход есть')

    check(R['setRole'] == {'ok': True} and R['rusMeta'] == 'student', 'F: роль сменилась в таблице и app_metadata')
    check(R['rusAddAfter'] == {'ok': False, 'error': 'forbidden'}, 'F: бывший преподаватель сразу без управления')

    check(R['legacyLogin'].get('ok') is True and R['legacyProfile'] == 'legacy@mail.ru',
          'A: старый аккаунт входит, строка profiles дописана')
    check(R['options'] == {'status': 200, 'cors': '*'}, 'H: CORS на OPTIONS')
    check(R['badAction'] == {'ok': False, 'error': 'bad_action'}, 'неизвестное действие — bad_action')


if __name__ == '__main__':
    test_schema()
    test_function()
    print()
    if FAILS:
        print(f'ПРОВАЛЕНО: {len(FAILS)}')
        for f in FAILS:
            print(' -', f)
        sys.exit(1)
    print('Всё прошло')
