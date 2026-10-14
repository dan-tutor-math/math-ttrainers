-- ============================================================
-- Свои шаблоны презентаций (промпт №87в): слайды целиком, подложки,
-- форматы. Привязаны к аккаунту — идут за преподавателем на любой
-- компьютер и планшет.
--
-- Как применить: Supabase → SQL Editor → вставить файл целиком → Run.
-- Повторный запуск безопасен: таблица создаётся «если нет», функция и
-- правила доступа пересоздаются. Данные при повторном запуске не трогаются.
--
-- Пока таблицы нет, сайт работает как раньше: шаблоны хранятся только в
-- браузере (IndexedDB). После запуска файла то, что уже сохранено в
-- браузере, при следующем открытии презентации само уедет в облако.
--
-- Устройство: одна строка — один шаблон. kind — вид ('slide' | 'bg' |
-- 'format'), name — название, data — содержимое как есть с сайта (формат,
-- подложка, объекты слайда, маленькая картинка-превью; у подложки и слайда
-- может быть картинка base64). id задаёт сайт (uuid), чтобы шаблон,
-- сохранённый без связи, потом лёг в облако под тем же id.
-- shared — задел под общую библиотеку школы; пока не используется, и чужие
-- шаблоны никто не видит.
-- ============================================================

create table if not exists public.deck_templates (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind        text not null check (kind in ('slide', 'bg', 'format')),
  name        text not null check (char_length(name) between 1 and 80),
  data        jsonb not null default '{}'::jsonb,
  shared      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- шаблон с фото-подложкой весит как фото; больше 15 МБ — это уже ошибка
  -- (сайт сжимает картинки до 1600 px), а не шаблон
  constraint deck_templates_size check (octet_length(data::text) < 15000000)
);

create index if not exists deck_templates_owner_idx on public.deck_templates (owner, kind, created_at desc);

create or replace function public.deck_templates_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists deck_templates_touch on public.deck_templates;
create trigger deck_templates_touch
  before update on public.deck_templates
  for each row execute function public.deck_templates_touch();


-- ---------- права и правила доступа ----------

alter table public.deck_templates enable row level security;

-- права выставлены явно (как в works-schema.sql): anon — ничего, вошедший —
-- читает и правит своё. Кто чей — проверяет база (RLS), а не сайт
revoke all on table public.deck_templates from anon;
revoke all on table public.deck_templates from authenticated;
grant select, insert, update, delete on table public.deck_templates to authenticated;

drop policy if exists deck_templates_owner on public.deck_templates;
create policy deck_templates_owner on public.deck_templates
  for all to authenticated
  using (owner = (select auth.uid()))
  with check (owner = (select auth.uid()));
