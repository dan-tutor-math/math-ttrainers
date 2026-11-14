-- ============================================================
-- Кабинет преподавателя: ручной итог дня (задача В4(б), план
-- claude-notes/cabinet-plan.md; решение Даниила 13.11 —
-- payments-audit.md, раздел 5: «ручной итог дня — переносить»).
--
-- Выполнять ПОСЛЕ cabinet-schema.sql (и cabinet-payments.sql). Как
-- применить: Supabase → SQL Editor → вставить файл целиком → Run.
-- Повторный запуск безопасен: таблица создаётся «если нет», правила
-- доступа пересоздаются, данные не трогаются.
--
-- Почему отдельная таблица, а не teacher_settings.settings (jsonb):
-- настройки пишутся целиком из копии в браузере, и итог дня, вписанный на
-- телефоне, затёрся бы настройками с компьютера. Строка на день — ни с чем
-- не спорит, и её проще сводить со старым приложением (day.total, В4(в)).
--
-- Итог дня — исключение, а не правило: доход по-прежнему считается из
-- отметок занятий и оплат (payments.js). Строка есть — в доходе дня и в
-- статистике стоит её сумма вместо расчёта; удалили — снова расчёт.
-- ============================================================

create table if not exists public.day_totals (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day         date not null,
  amount      numeric(10,2) not null check (amount >= 0 and amount <= 10000000),
  note        text not null default '' check (char_length(note) <= 300),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (id, owner),
  -- один итог на день у преподавателя
  unique (owner, day)
);


-- ---------- отметка времени правки ----------

drop trigger if exists day_totals_touch on public.day_totals;
create trigger day_totals_touch before update on public.day_totals
  for each row execute function public.cabinet_touch();


-- ---------- права и правила доступа ----------

alter table public.day_totals enable row level security;

-- как в cabinet-schema.sql: anon — ничего, преподаватель — ровно нужное
revoke all on table public.day_totals from anon, authenticated;
grant select, insert, update, delete on table public.day_totals to authenticated;

drop policy if exists day_totals_owner on public.day_totals;
create policy day_totals_owner on public.day_totals for all to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
