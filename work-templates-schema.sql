-- ============================================================
-- Шаблоны работ (конструктор вариантов, этап 8): экран «Собрать
-- вариант» в works.html — «Сохранить как шаблон». Привязаны к
-- аккаунту — идут за преподавателем на любой компьютер.
--
-- Как применить: Supabase → SQL Editor → вставить файл целиком → Run.
-- Повторный запуск безопасен: таблица создаётся «если нет», функции,
-- триггеры и правила доступа пересоздаются. Данные не трогаются.
--
-- Пока таблицы нет, сайт работает и без неё: шаблоны хранятся только в
-- браузере (localStorage) с пометкой «только на этом компьютере». После
-- запуска файла то, что сохранено в браузере, при следующем открытии
-- экрана «Собрать вариант» само уедет в облако.
--
-- Устройство: одна строка — один шаблон. title — название; items —
-- строки Набора как есть с сайта ({ exam, slug, n, proto, count, source,
-- next_pos, next_fipi, … }): next_pos — с какого места банка продолжать
-- (сдвигается при «Сохранить» работы, собранной из шаблона), next_fipi —
-- номер ФИПИ на этом месте (по нему ищется место, если банк перевыгрузят);
-- settings — общие настройки экрана (по сколько, источник, вариантов).
-- id задаёт сайт (uuid), чтобы шаблон из браузера лёг в облако под тем
-- же id. В список работ (works) шаблон не попадает.
-- ============================================================

create table if not exists public.work_templates (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 80),
  items       jsonb not null default '[]'::jsonb,
  settings    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- строк в шаблоне не больше, чем помещается в Набор (VB_MAX = 30)
  constraint work_templates_items check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 30),
  constraint work_templates_size check (octet_length(items::text) + octet_length(settings::text) < 200000)
);

create index if not exists work_templates_owner_idx on public.work_templates (owner, created_at);

create or replace function public.work_templates_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists work_templates_touch on public.work_templates;
create trigger work_templates_touch
  before update on public.work_templates
  for each row execute function public.work_templates_touch();

-- не больше 100 шаблонов на учителя (сайт проверяет то же, здесь — страховка)
create or replace function public.work_templates_limit()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (select count(*) from public.work_templates where owner = new.owner) >= 100 then
    raise exception 'too_many_templates';
  end if;
  return new;
end $$;

revoke all on function public.work_templates_limit() from public, anon, authenticated;
revoke all on function public.work_templates_touch() from public, anon, authenticated;

drop trigger if exists work_templates_limit on public.work_templates;
create trigger work_templates_limit
  before insert on public.work_templates
  for each row execute function public.work_templates_limit();


-- ---------- права и правила доступа ----------

alter table public.work_templates enable row level security;

-- права выставлены явно (как в works-schema.sql): anon — ничего, вошедший —
-- читает и правит своё. Кто чей — проверяет база (RLS), а не сайт
revoke all on table public.work_templates from anon;
revoke all on table public.work_templates from authenticated;
grant select, insert, update, delete on table public.work_templates to authenticated;

drop policy if exists work_templates_owner on public.work_templates;
create policy work_templates_owner on public.work_templates
  for all to authenticated
  using (owner = (select auth.uid()))
  with check (owner = (select auth.uid()));
