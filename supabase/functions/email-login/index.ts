// ============================================================
// email-login — серверная функция Supabase (Edge Function), промпт №83.
//
// Вход на платформу по одной почте, без пароля и без письма, — для тех,
// кого владелец (или преподаватель — своих учеников) внёс в список
// public.access_emails (access-schema.sql). И всё управление этим списком.
//
// Почему функция, а не код на сайте: впустить человека без пароля и без
// письма, создать ему аккаунт заранее (чтобы сразу дать доступ к доске)
// может только сервер с секретным ключом проекта. Ключ берётся из
// окружения функции — Supabase кладёт его туда сам; ни в репозитории, ни на
// сайте его нет.
//
// Как выдаётся вход: generateLink({ type: 'magiclink' }) у администратора
// делает ровно то, что письмо со ссылкой, но НИЧЕГО не отправляет — только
// возвращает одноразовый hashed_token. Сайт тут же меняет его на обычную
// сессию (auth.verifyOtp с token_hash). Писем нет, значит нет и лимита
// встроенной почты Supabase (несколько писем в час на весь проект) и часа
// жизни ссылки — то самое «ограничение в часах» старого входа.
//
// Действия (POST, JSON { action, ... }):
//   login          { email }               — кто угодно, без входа
//   add            { emails, role, label } — владелец; преподаватель — только учеников
//   remove         { email }               — владелец; преподаватель — своих учеников
//   set_role       { email, role }         — владелец
//   reset_password { email }               — владелец; преподаватель — своих учеников
//   list           {}                      — владелец — всех; преподаватель — своих
//
// Ответ всегда 200 с { ok: true, ... } или { ok: false, error }: у
// supabase-js на ответ не из 2xx вместо тела — общий FunctionsHttpError,
// а сайту нужно различать «почты нет в списке» и «нужен пароль».
//
// Развёртывание: Supabase → Edge Functions → Deploy a new function → Via
// Editor, имя email-login, вставить этот файл целиком. В настройках функции
// ВЫКЛЮЧИТЬ «Verify JWT» (Enforce JWT verification): вход зовут ещё не
// вошедшие, а публичный ключ формата sb_publishable_… — не JWT, проверка на
// входе отбила бы всех. Кто зовёт управляющие действия, функция проверяет
// сама, по токену из заголовка Authorization.
// ============================================================

// deno-lint-ignore-file no-explicit-any

// Статический импорт, а не await import() внутри блока запуска: Supabase
// собирает функцию в один пакет только из импортов, видных при сборке.
// Node-тест эту строку вырезает и подсовывает свою заглушку клиента
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

// почта — без пробелов, с одной «@» и точкой в домене. Строже не надо:
// настоящую проверку делает сам Supabase при создании аккаунта
const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
export function normEmail(s: unknown): string {
  return String(s ?? '').trim().toLowerCase();
}
// «через запятую или каждая с новой строки» — как присылают в мессенджере;
// заодно отрезаем <угловые скобки> вида «Маша <masha@mail.ru>»
export function splitEmails(input: unknown): string[] {
  const raw = Array.isArray(input) ? input.join('\n') : String(input ?? '');
  const out: string[] = [];
  for (const part of raw.split(/[\s,;]+/)) {
    const e = normEmail(part.replace(/^[<(]+|[>).]+$/g, ''));
    if (e && !out.includes(e)) out.push(e);
  }
  return out.slice(0, 200);
}

const BAN_FOREVER = '876000h'; // ~100 лет: у Supabase нет «навсегда», есть длительность
const LABEL_MAX = 120;

function randomPassword(): string {
  const a = new Uint8Array(24);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

function cleanLabel(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  const s = String(v ?? '').trim().slice(0, LABEL_MAX);
  return s || null;
}

const isOwnerUser = (u: any) => !!(u && u.app_metadata && u.app_metadata.is_owner);
const hasPassword = (u: any) => !!(u && u.user_metadata && u.user_metadata.has_password);

export async function handle(req: Request, admin: any): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405);

  let body: any = {};
  try { body = await req.json(); } catch (_) { return json({ ok: false, error: 'bad_request' }); }

  try {
    switch (body && body.action) {
      case 'login': return json(await login(admin, body));
      case 'add': return json(await add(admin, req, body));
      case 'remove': return json(await remove(admin, req, body));
      case 'set_role': return json(await setRole(admin, req, body));
      case 'reset_password': return json(await resetPassword(admin, req, body));
      case 'list': return json(await list(admin, req));
      default: return json({ ok: false, error: 'bad_action' });
    }
  } catch (e) {
    console.error('[email-login]', e);
    return json({ ok: false, error: 'server', message: String((e as any)?.message || e) });
  }
}

// ---------- общее ----------

async function getRow(admin: any, email: string) {
  const { data, error } = await admin.from('access_emails').select('*').eq('email', email).maybeSingle();
  if (error) throw new Error('access_emails: ' + error.message);
  return data;
}

// Кто зовёт управляющее действие. Токен — тот, что supabase-js сам кладёт
// в Authorization у вошедшего. Роль берём из таблицы, а не из app_metadata
// токена: убранного из списка преподавателя его старый токен (живёт до
// часа) не должен пускать в управление
async function getCaller(admin: any, req: Request) {
  const auth = req.headers.get('Authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (token.split('.').length !== 3) return null; // публичный ключ, не вход
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data || !data.user) return null;
  const user = data.user;
  const row = user.email ? await getRow(admin, normEmail(user.email)) : null;
  return {
    user,
    isOwner: isOwnerUser(user),
    isTeacher: !!(row && row.role === 'teacher'),
  };
}

// id аккаунта по почте. В profiles почта может лежать не строчными —
// поэтому ilike, а «_» и «%» в почте (у «_» это обычный символ адреса)
// экранируем, чтобы они не стали шаблоном
async function findUserIdByEmail(admin: any, email: string): Promise<string | null> {
  const pattern = email.replace(/[\\%_]/g, (m) => '\\' + m);
  const { data } = await admin.from('profiles').select('id').ilike('email', pattern).limit(1);
  return data && data[0] ? data[0].id : null;
}

// Аккаунт для почты: создать, а если уже есть — найти. Создаём сразу
// подтверждённым (email_confirm): иначе Supabase ждал бы перехода по письму
async function ensureUser(admin: any, email: string): Promise<any> {
  const created = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (!created.error && created.data && created.data.user) return created.data.user;
  const id = await findUserIdByEmail(admin, email);
  if (id) {
    const got = await admin.auth.admin.getUserById(id);
    if (!got.error && got.data && got.data.user) return got.data.user;
  }
  // профиля нет (старый аккаунт без строки в profiles) — generateLink
  // тоже возвращает пользователя; одноразовый код при этом никуда не уходит
  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (!link.error && link.data && link.data.user) return link.data.user;
  throw new Error('не удалось создать или найти аккаунт: ' + ((created.error && created.error.message) || 'нет ответа'));
}

// Привести аккаунт в соответствие со строкой списка: роль — в app_metadata
// (её сайт читает из самого входа, без лишнего запроса; app_metadata
// человек сам себе не поменяет), снять блокировку, если почту вернули в
// список, и строка в profiles — по ней «Совместная работа» ищет почту
async function syncUser(admin: any, user: any, row: any) {
  const patch: any = {};
  const am = user.app_metadata || {};
  if (am.mathh_role !== row.role) patch.app_metadata = { ...am, mathh_role: row.role };
  if (user.banned_until && new Date(user.banned_until).getTime() > Date.now()) patch.ban_duration = 'none';
  if (Object.keys(patch).length) {
    const { error } = await admin.auth.admin.updateUserById(user.id, patch);
    if (error) throw new Error('обновление аккаунта: ' + error.message);
  }
  await admin.from('profiles').upsert({ id: user.id, email: row.email }, { onConflict: 'id' });
  if (row.user_id !== user.id) {
    await admin.from('access_emails').update({ user_id: user.id }).eq('email', row.email);
    row.user_id = user.id;
  }
}

// Может ли этот вызывающий трогать эту строку
function canManage(caller: any, row: any): boolean {
  if (!caller || !row) return false;
  if (caller.isOwner) return true;
  return caller.isTeacher && row.role === 'student' && row.added_by === caller.user.id;
}

// ---------- действия ----------

async function login(admin: any, body: any) {
  const email = normEmail(body.email);
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'bad_email' };
  const row = await getRow(admin, email);
  if (!row) {
    // Владельца в списке нет (его вход — только паролем). Без этой проверки
    // он, забыв ввести пароль, читал бы «почта не добавлена на платформу»
    const id = await findUserIdByEmail(admin, email);
    const u = id ? (await admin.auth.admin.getUserById(id)).data?.user : null;
    if (u && (isOwnerUser(u) || hasPassword(u))) return { ok: false, error: 'password_required' };
    return { ok: false, error: 'not_allowed' };
  }

  const user = await ensureUser(admin, email);
  // Владелец — только паролем, всегда. Кто задал пароль — тоже: иначе
  // пароль ничего бы не защищал, по одной почте вошёл бы любой
  if (isOwnerUser(user) || hasPassword(user)) return { ok: false, error: 'password_required' };

  await syncUser(admin, user, row);
  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  const hashed = link.data && link.data.properties && link.data.properties.hashed_token;
  if (link.error || !hashed) throw new Error('generateLink: ' + ((link.error && link.error.message) || 'нет кода'));
  await admin.from('access_emails').update({ last_login_at: new Date().toISOString() }).eq('email', email);
  return { ok: true, token_hash: hashed, role: row.role };
}

async function add(admin: any, req: Request, body: any) {
  const caller = await getCaller(admin, req);
  if (!caller || (!caller.isOwner && !caller.isTeacher)) return { ok: false, error: 'forbidden' };
  // преподаватель добавляет только учеников — роль из запроса ему не важна
  const role = caller.isOwner && body.role === 'teacher' ? 'teacher' : 'student';
  const label = cleanLabel(body.label);
  const emails = splitEmails(body.emails);
  if (!emails.length) return { ok: false, error: 'no_emails' };
  const myEmail = normEmail(caller.user.email);

  const results: any[] = [];
  for (const email of emails) {
    if (!EMAIL_RE.test(email)) { results.push({ email, status: 'bad_email' }); continue; }
    if (email === myEmail) { results.push({ email, status: 'self' }); continue; }
    try {
      let row = await getRow(admin, email);
      let status = 'added';
      if (row) {
        if (canManage(caller, row)) {
          const upd: any = {};
          if (caller.isOwner && row.role !== role) upd.role = role;
          if (label !== undefined && label !== null) upd.label = label;
          if (Object.keys(upd).length) {
            const { error } = await admin.from('access_emails').update(upd).eq('email', email);
            if (error) throw new Error(error.message);
            row = { ...row, ...upd };
          }
          status = Object.keys(upd).length ? 'updated' : 'exists';
        } else {
          // ученик другого преподавателя: список не трогаем, но аккаунт уже
          // есть — к доске его добавить можно (status 'exists' + user_id)
          status = 'exists';
        }
      } else {
        row = { email, role, label: label ?? null, added_by: caller.user.id, user_id: null };
        const { error } = await admin.from('access_emails').insert(row);
        if (error) throw new Error(error.message);
      }
      const user = await ensureUser(admin, email);
      if (isOwnerUser(user)) {
        // почта владельца в списке не нужна — его вход только паролем
        await admin.from('access_emails').delete().eq('email', email);
        results.push({ email, status: 'self' });
        continue;
      }
      if (canManage(caller, row)) await syncUser(admin, user, row);
      results.push({ email, status, user_id: user.id, role: row.role });
    } catch (e) {
      results.push({ email, status: 'error', message: String((e as any)?.message || e) });
    }
  }
  return { ok: true, results };
}

async function remove(admin: any, req: Request, body: any) {
  const caller = await getCaller(admin, req);
  const email = normEmail(body.email);
  const row = await getRow(admin, email);
  if (!row) return { ok: true }; // уже нет — то, чего и хотели
  if (!canManage(caller, row)) return { ok: false, error: 'forbidden' };
  const { error } = await admin.from('access_emails').delete().eq('email', email);
  if (error) throw new Error(error.message);
  // Блокировка, а не удаление аккаунта: доски и работы человека остаются,
  // а вернуть его — просто снова добавить почту (syncUser снимет блок).
  // Блок нужен, потому что уже выданный вход сам не кончается: без него
  // убранный человек сидел бы на платформе, пока не нажмёт «Выйти»
  if (row.user_id) await admin.auth.admin.updateUserById(row.user_id, { ban_duration: BAN_FOREVER });
  return { ok: true };
}

async function setRole(admin: any, req: Request, body: any) {
  const caller = await getCaller(admin, req);
  if (!caller || !caller.isOwner) return { ok: false, error: 'forbidden' };
  const email = normEmail(body.email);
  const role = body.role === 'teacher' ? 'teacher' : 'student';
  const row = await getRow(admin, email);
  if (!row) return { ok: false, error: 'not_found' };
  const { error } = await admin.from('access_emails').update({ role }).eq('email', email);
  if (error) throw new Error(error.message);
  if (row.user_id) {
    const got = await admin.auth.admin.getUserById(row.user_id);
    if (got.data && got.data.user) await syncUser(admin, got.data.user, { ...row, role });
  }
  return { ok: true };
}

async function resetPassword(admin: any, req: Request, body: any) {
  const caller = await getCaller(admin, req);
  const email = normEmail(body.email);
  const row = await getRow(admin, email);
  if (!row) return { ok: false, error: 'not_found' };
  if (!canManage(caller, row)) return { ok: false, error: 'forbidden' };
  const user = row.user_id ? (await admin.auth.admin.getUserById(row.user_id)).data?.user : null;
  if (!user) return { ok: true };
  // Старый пароль затираем случайным (его никто не знает) и снимаем
  // пометку — функция снова пустит по почте, а красная плашка попросит
  // задать новый пароль
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: randomPassword(),
    user_metadata: { ...(user.user_metadata || {}), has_password: false },
  });
  if (error) throw new Error(error.message);
  return { ok: true };
}

async function list(admin: any, req: Request) {
  const caller = await getCaller(admin, req);
  if (!caller || (!caller.isOwner && !caller.isTeacher)) return { ok: false, error: 'forbidden' };
  let q = admin.from('access_emails').select('*').order('created_at', { ascending: false });
  if (!caller.isOwner) q = q.eq('added_by', caller.user.id).eq('role', 'student');
  const { data: rows, error } = await q;
  if (error) throw new Error(error.message);

  // пароль задан ли, заблокирован ли, кто добавил — из аккаунтов. Людей на
  // платформе сотни, не тысячи: страница по 1000 — один-два запроса
  const users = new Map<string, any>();
  for (let page = 1; page <= 20; page++) {
    const { data, error: uErr } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (uErr || !data || !data.users) break;
    data.users.forEach((u: any) => users.set(u.id, u));
    if (data.users.length < 1000) break;
  }
  const out = (rows || []).map((r: any) => {
    const u = r.user_id ? users.get(r.user_id) : null;
    const by = r.added_by ? users.get(r.added_by) : null;
    return {
      email: r.email, role: r.role, label: r.label,
      created_at: r.created_at, last_login_at: r.last_login_at,
      has_password: hasPassword(u),
      added_by_me: r.added_by === caller.user.id,
      added_by_email: by ? by.email : null,
      can_manage: canManage(caller, r),
    };
  });
  return { ok: true, rows: out, me: { owner: caller.isOwner, teacher: caller.isTeacher } };
}

// ---------- запуск в Supabase ----------

// В Supabase (Deno) поднимаем сервер; в node-тесте (test_prompt83) Deno нет,
// и тест зовёт handle() со своей заглушкой клиента. Deno берём через globalThis под своим именем: объявлять глобальный Deno
// заново (declare const) в самом Deno — ошибка повторного объявления
const DenoRt = (globalThis as any).Deno;
if (DenoRt && DenoRt.serve) {
  const url = DenoRt.env.get('SUPABASE_URL');
  // новый формат ключей — словарь SUPABASE_SECRET_KEYS, старый —
  // SUPABASE_SERVICE_ROLE_KEY; у проекта может быть любой из двух
  let key = '';
  try { key = (JSON.parse(DenoRt.env.get('SUPABASE_SECRET_KEYS') || '{}') || {}).default || ''; } catch (_) { /* старый формат */ }
  if (!key) key = DenoRt.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  DenoRt.serve((req: Request) => handle(req, admin));
}
