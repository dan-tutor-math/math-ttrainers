-- ============================================================
-- Вход по списку почт (промпт №83): кого пускать на платформу и в какой
-- роли — преподаватель или ученик.
--
-- Как применить: Supabase → SQL Editor → вставить файл целиком → Run.
-- Повторный запуск безопасен: таблица создаётся «если нет», права
-- выставляются заново, перенос старых аккаунтов дописывает только тех,
-- кого в списке ещё нет.
--
-- Устройство:
--   access_emails — одна строка на почту: роль, подпись («Маша, 9 класс»),
--                   кто добавил, id аккаунта, когда последний раз входил.
--
-- Почему у браузера нет НИКАКИХ прав на таблицу: всё — добавить, убрать,
-- сменить роль, показать список — делает серверная функция email-login
-- (supabase/functions/email-login). Она сама проверяет, кто зовёт:
-- владелец платформы (app_metadata.is_owner) видит и правит всех,
-- преподаватель — только добавленных им учеников. Правила RLS для этого
-- тоже можно было написать, но тогда одна и та же проверка жила бы в двух
-- местах, а функции всё равно нужен ключ сервера — без него аккаунт не
-- создать и вход без письма не выдать.
-- ============================================================

create table if not exists public.access_emails (
  -- почта всегда строчными: люди присылают «Masha@Mail.ru», а Supabase
  -- хранит вход строчными — без этого одна почта была бы двумя строками
  email         text primary key check (email = lower(email) and email like '%@%'),
  role          text not null default 'student' check (role in ('teacher', 'student')),
  label         text check (label is null or length(label) <= 120),
  added_by      uuid,
  user_id       uuid,
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);
create index if not exists access_emails_added_by on public.access_emails (added_by);
create index if not exists access_emails_user_id on public.access_emails (user_id);

alter table public.access_emails enable row level security;

-- Supabase по умолчанию раздаёт anon и authenticated все права на новые
-- таблицы в public. Здесь — явно ничего: список почт с подписями не должен
-- читать никто, кроме функции (у неё ключ сервера, RLS её не держит)
revoke all on table public.access_emails from anon;
revoke all on table public.access_emails from authenticated;

-- Перенос: все, кто уже входил на платформу до нового входа, попадают в
-- список учениками — иначе они просто перестали бы входить (письма для
-- входа больше нет). Владелец в список не попадает: его аккаунт по одной
-- почте не открывается никогда, только паролем. Роль преподавателя
-- назначается потом руками в панели «Доступ».
insert into public.access_emails (email, role, label, user_id, created_at)
select lower(u.email), 'student', 'аккаунт до нового входа', u.id, coalesce(u.created_at, now())
from auth.users u
where u.email is not null
  and coalesce((u.raw_app_meta_data ->> 'is_owner')::boolean, false) = false
on conflict (email) do nothing;
