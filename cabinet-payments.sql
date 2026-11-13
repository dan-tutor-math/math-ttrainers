-- ============================================================
-- Кабинет преподавателя: оплаты и ставки (задача В4(а), план
-- claude-notes/cabinet-plan.md; разбор и ответы Даниила —
-- claude-notes/payments-audit.md, разделы 3 и 5).
--
-- Выполнять ПОСЛЕ cabinet-schema.sql. Как применить: Supabase → SQL
-- Editor → вставить файл целиком → Run. Повторный запуск безопасен:
-- таблицы и поля добавляются «если нет», правила доступа пересоздаются,
-- данные не трогаются. Нужен Postgres 15+ (у Supabase он такой):
-- «on delete set null (столбец)» в составных ключах.
--
-- Главный принцип: деньги считаются из отметок занятий и оплат, итоги
-- в базе не хранятся. Остаток абонемента, долг и «почему столько»
-- страница считает сама (payments.js), поэтому здесь только исходные
-- факты: ставка с какой даты, кто сколько заплатил, что было на занятии.
--
-- Устройство:
--   student_rates     — ставка ученика с даты (обычная и групповая)
--   payments          — оплата: абонемент на N занятий или разовая
--                       (за конкретное занятие или просто деньги)
--   students.pay_mode — как платит ученик: абонементом или за занятие
--   lesson_students   — + оплачивается ли это занятие, причина пропуска,
--                       отмена по вине преподавателя, отработка, флаги
--
-- Флаги преподавателя («пробное», «благотворительное»…) — справочник в
-- teacher_settings.settings.pay.flags (у каждого свои), на участнике
-- занятия — только их id. Отдельная таблица не нужна: флагов единицы.
-- ============================================================


-- ---------- ученик: как платит ----------

-- pack — абонементом, lesson — за каждое занятие (кнопка «оплатил» у
-- занятия). null — страница решает сама: есть абонементы — pack, иначе lesson
alter table public.students
  add column if not exists pay_mode text check (pay_mode is null or pay_mode in ('pack', 'lesson'));


-- ---------- ставки по датам ----------

-- Цена занятия = строка с наибольшим valid_from ≤ дня занятия. Смена
-- ставки — новая строка (прошлое не пересчитывается); «пересчитать
-- прошлое» — поменять valid_from. Так устроено и в старом приложении
-- (rates: «цена ДО даты»), только граница — начало, а не конец.
-- group_price — цена, когда ученик в паре, группе или полупараллелке
-- (у каждого участника своя, решение Даниила 13.11); null — как price.
-- per_week и monthly — для «в месяц» (В4(б)), здесь только место
create table if not exists public.student_rates (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  student_id  uuid not null,
  valid_from  date not null,
  price       numeric(10,2) not null check (price >= 0),
  group_price numeric(10,2) check (group_price is null or group_price >= 0),
  per_week    numeric(3,1) check (per_week is null or per_week between 0 and 30),
  monthly     numeric(10,2) check (monthly is null or monthly >= 0),
  note        text not null default '' check (char_length(note) <= 500),
  ext_id      text check (ext_id is null or char_length(ext_id) between 1 and 100),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- две ставки с одного дня — непонятно, какая действует
  unique (student_id, valid_from),
  foreign key (student_id, owner) references public.students (id, owner) on delete cascade
);
create unique index if not exists student_rates_ext on public.student_rates (owner, ext_id) where ext_id is not null;


-- ---------- участник занятия: деньги и пропуски ----------

-- Свой уникальный ключ (id, owner): на участника ссылаются оплата «за это
-- занятие» и отработка — составным ключом, чтобы нельзя было сослаться на
-- чужого (RLS внешние ключи не проверяет)
create unique index if not exists lesson_students_id_owner on public.lesson_students (id, owner);

alter table public.lesson_students
  -- ручное исключение из правила: charge — это занятие оплачивается (даже
  -- прогул), free — бесплатное. null — по правилу (проведено — платно,
  -- перенос — нет, прогул — по настройке pay.skipRule)
  add column if not exists bill       text check (bill is null or bill in ('charge', 'free')),
  -- причина пропуска; null — причина по умолчанию из настроек
  add column if not exists reason     text check (reason is null or char_length(reason) <= 200),
  -- отмена по вине преподавателя: не считается, рядом «назначить отработку»
  add column if not exists by_teacher boolean not null default false,
  -- это занятие — отработка (обычное занятие, но в статистике ученика
  -- считается отдельно); makeup_for — какой пропуск оно отрабатывает
  add column if not exists makeup     boolean not null default false,
  add column if not exists makeup_for uuid,
  -- флаги преподавателя (id из teacher_settings.settings.pay.flags)
  add column if not exists flags      text[] not null default '{}'
                                      check (cardinality(flags) <= 10);

-- Удалили пропущенное занятие — у отработки ссылка обнуляется, а сама
-- отработка остаётся. set null (makeup_for): обнулить только ссылку, а не
-- owner из составного ключа (Postgres 15+)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'lesson_students_makeup_for_fkey') then
    alter table public.lesson_students
      add constraint lesson_students_makeup_for_fkey foreign key (makeup_for, owner)
      references public.lesson_students (id, owner) on delete set null (makeup_for);
  end if;
end $$;
create index if not exists lesson_students_makeup_for on public.lesson_students (makeup_for) where makeup_for is not null;


-- ---------- оплаты ----------

-- kind:
--   pack   — абонемент на lessons занятий. Сгорает по числу занятий
--            (burn = 'count', по умолчанию: конец — день N-го занятия)
--            или по сроку (burn = 'date': с start по end_on, что не
--            успели — сгорает). Начало — start_on, иначе день оплаты
--   single — разовая оплата, учёт отдельно от абонементов (решение
--            Даниила 13.11). lesson_student_id — «оплатил» за конкретное
--            занятие; null — просто деньги в счёт занятий (баланс в рублях)
-- adjust — ручная правка «прошло» у абонемента (+ списать, − вернуть) с
-- причиной в note: заменяет adj / carry старого приложения.
-- ext_id — id оплаты старого приложения (синхронизация, В4(в)).
-- Ученик или гость — как у участника занятия: гость из старого
-- приложения не должен терять оплату
create table if not exists public.payments (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  student_id  uuid,
  guest_name  text check (guest_name is null or char_length(btrim(guest_name)) between 1 and 80),
  kind        text not null default 'pack' check (kind in ('pack', 'single')),
  paid_on     date not null default current_date,
  amount      numeric(10,2) not null check (amount >= 0),
  lessons     smallint check (lessons is null or lessons between 1 and 500),
  burn        text check (burn is null or burn in ('count', 'date')),
  start_on    date,
  end_on      date,
  adjust      smallint not null default 0 check (adjust between -500 and 500),
  lesson_student_id uuid,
  payer       text check (payer is null or char_length(payer) <= 80),
  method      text check (method is null or char_length(method) <= 40),
  note        text not null default '' check (char_length(note) <= 1000),
  archived_at timestamptz,
  ext_id      text check (ext_id is null or char_length(ext_id) between 1 and 100),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check ((student_id is null) <> (guest_name is null)),
  -- абонемент: число занятий и способ сгорания обязательны; по сроку —
  -- нужен конец. Разовая: ни занятий, ни сгорания, ни правки
  check (kind <> 'pack' or (lessons is not null and burn is not null and lesson_student_id is null)),
  check (kind <> 'pack' or burn <> 'date' or end_on is not null),
  check (kind <> 'single' or (lessons is null and burn is null and adjust = 0)),
  check (end_on is null or start_on is null or end_on >= start_on),
  foreign key (student_id, owner) references public.students (id, owner) on delete cascade,
  -- удалили занятие — оплата не пропадает, становится деньгами в счёт занятий
  foreign key (lesson_student_id, owner) references public.lesson_students (id, owner) on delete set null (lesson_student_id)
);
create index if not exists payments_student on public.payments (owner, student_id, paid_on);
-- «оплатил» у занятия — одна оплата на участие (кнопка — переключатель)
create unique index if not exists payments_lesson on public.payments (lesson_student_id) where lesson_student_id is not null;
create unique index if not exists payments_ext on public.payments (owner, ext_id) where ext_id is not null;


-- ---------- отметка времени правки ----------

do $$
declare t text;
begin
  foreach t in array array['student_rates', 'payments'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_touch', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.cabinet_touch()',
                   t || '_touch', t);
  end loop;
end $$;


-- ---------- права и правила доступа ----------

alter table public.student_rates enable row level security;
alter table public.payments      enable row level security;

-- как в cabinet-schema.sql: anon — ничего, преподаватель — ровно нужное
revoke all on table public.student_rates, public.payments from anon, authenticated;
grant select, insert, update, delete on table public.student_rates, public.payments to authenticated;

-- Связь «того же владельца» держат составные внешние ключи, поэтому
-- правило — простое owner = auth.uid()
do $$
declare t text;
begin
  foreach t in array array['student_rates', 'payments'] loop
    execute format('drop policy if exists %I on public.%I', t || '_owner', t);
    execute format('create policy %I on public.%I for all to authenticated '
                   'using (owner = (select auth.uid())) with check (owner = (select auth.uid()))',
                   t || '_owner', t);
  end loop;
end $$;
