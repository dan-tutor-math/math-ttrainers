-- ============================================================
-- Кабинет преподавателя: ученики, память заданий, настройки, расписание
-- (план claude-notes/cabinet-plan.md, задача А3; решения по расписанию —
-- claude-notes/schedule-audit.md).
--
-- Как применить: Supabase → SQL Editor → вставить файл целиком → Run.
-- Повторный запуск безопасен: таблицы создаются «если нет», триггеры,
-- права и правила доступа пересоздаются. Данные не трогаются.
--
-- Устройство:
--   students                — ученик преподавателя
--   student_task_log        — память заданий: только добавление и удаление
--   teacher_settings        — настройки, строка на преподавателя (jsonb)
--   student_groups          — устойчивые пары и группы
--   student_group_members   — кто в паре / группе
--   week_templates          — шаблоны недели
--   template_slots          — занятие в шаблоне (день недели + время)
--   template_slot_students  — кто в слоте шаблона
--   lessons                 — занятие (или событие «не урок») в календаре
--   lesson_students         — участник занятия со своим статусом
--   ext_sync                — последнее согласованное состояние старого
--                             приложения расписания (синхронизация, В5)
--
-- Доступ: только вошедший преподаватель (authenticated), только свои
-- строки (owner = auth.uid()). У anon прав нет никаких: ученик кабинет не
-- видит. Серверных функций нет (план: обычный Postgres, переедет на свой
-- сервер вместе с базой).
--
-- Почему у каждой таблицы свой owner, даже у дочерних: правило доступа
-- тогда — одно простое условие без соединений, а связь «ребёнок того же
-- владельца, что и родитель» держит составной внешний ключ (parent_id,
-- owner) → parent(id, owner). Внешний ключ RLS не проверяет: без owner в
-- ключе можно было бы, зная чужой id, прицепить свою строку к чужому
-- ученику — и она всплыла бы в чужом журнале.
--
-- Почему время занятия — день + минута суток, а не timestamptz: шаблон
-- недели и старое приложение живут по настенному времени («15:00»), а
-- timestamptz съезжал бы при переходе часов и смене часового пояса.
-- Часовой пояс преподавателя (для будущей подписки iCal) — в настройках.
-- ============================================================


-- ---------- служебное ----------

create or replace function public.cabinet_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end $$;
-- Supabase раздаёт новые функции всем ролям; триггерной функции права
-- на вызов не нужны вовсе (триггер срабатывает без проверки EXECUTE)
revoke all on function public.cabinet_touch() from public, anon, authenticated;


-- ---------- ученики ----------

create table if not exists public.students (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 80),
  -- класс текстом: «9», «11», «студент», «взрослый»
  grade       text check (grade is null or char_length(grade) <= 20),
  -- экзамен: 'oge', 'ege_prof', 'ege_base', 'rus_oge'… — список держит
  -- страница, база не должна требовать правки ради нового экзамена
  exam        text check (exam is null or char_length(exam) <= 40),
  note        text not null default '' check (char_length(note) <= 5000),
  -- id досок ученика. Текстом: тип boards.id в репозитории не записан
  -- (таблицы досок заводили руками), а связь хранится у ученика, чтобы
  -- не трогать формат досок (план, Б3)
  boards      text[] not null default '{}' check (cardinality(boards) <= 200),
  -- почта аккаунта ученика, если он входит на платформу; строчными, как
  -- в access_emails
  account_email text check (account_email is null or (account_email = lower(account_email) and account_email like '%@%')),
  -- своя длительность занятия; null — длительность из настроек
  dur_min     smallint check (dur_min is null or dur_min between 5 and 720),
  -- архив, а не удаление: удаление унесёт каскадом журнал и занятия
  archived_at timestamptz,
  -- имя ученика в старом приложении расписания — там ученик в занятии
  -- текст, а не ссылка (синхронизация, В5). Уникально у владельца: по нему
  -- строка старого приложения находит ученика
  ext_name    text check (ext_name is null or char_length(ext_name) between 1 and 80),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (id, owner)
);
create index if not exists students_owner on public.students (owner, archived_at);
create unique index if not exists students_ext_name on public.students (owner, ext_name) where ext_name is not null;


-- ---------- память заданий ----------

-- Журнал только на добавление (события хранятся раздельно, у каждого своя
-- дата — план, «Что решено»). Править строку нельзя никому; удаление —
-- это «забыть задание / вид / номер» (сброс памяти, Б6).
-- id задаёт клиент: очередь записи переживает обрыв сети и может отправить
-- событие дважды — второй раз insert … on conflict (id) do nothing не
-- создаст дубль. lesson_id объявлен ниже, после таблицы занятий.
create table if not exists public.student_task_log (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  student_id  uuid not null,
  -- «fipi:<экзамен>:<номер>» или «gen:<страница>:<вид>» (task-key.js, А1).
  -- Проверяется только «приставка:остальное» — новый вид ключа не должен
  -- требовать правки базы
  task_key    text not null check (char_length(task_key) between 3 and 200 and task_key ~ '^[a-z0-9_]+:.+$'),
  -- hw — выдано в ДЗ, board — на доске, ok / bad — решено верно / неверно
  event       text not null check (event in ('hw', 'board', 'ok', 'bad')),
  -- где произошло; src_ref — адрес страницы, id доски или работы
  source      text not null check (source in ('trainer', 'board', 'work')),
  src_ref     text check (src_ref is null or char_length(src_ref) <= 300),
  -- когда это было на самом деле: очередь могла отправить позже
  at          timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  foreign key (student_id, owner) references public.students (id, owner) on delete cascade
);
create index if not exists student_task_log_key on public.student_task_log (student_id, task_key);


-- ---------- настройки ----------

-- Одна строка на преподавателя. Всё в jsonb: новая настройка не должна
-- требовать миграции; форму проверяет страница (teacher-settings.js).
-- Ключи на сейчас:
--   sessionBind  'tab' | 'browser'        — привязка сессии ученика
--   marks        'show' | 'off' | 'hide'  — подписи: подписывать / нет / скрывать решённые
--   marksDates, marksCount  boolean       — даты и счётчик в подписи
--   lessonMin    45 | 60 | 90 | число     — длительность занятия по умолчанию
--   gridStep     15                       — шаг сетки расписания, минут
--   formatLabels { pair, group, semi }    — свои названия форматов
--   scheduleView 'grid' | 'list'          — вид расписания
--   tz           'Europe/Moscow'          — часовой пояс (для iCal)
--   oldAppUrl    адрес старого приложения (код доступа — только в браузере!)
create table if not exists public.teacher_settings (
  owner       uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  settings    jsonb not null default '{}'::jsonb
              check (jsonb_typeof(settings) = 'object' and octet_length(settings::text) <= 65536),
  updated_at  timestamptz not null default now()
);


-- ---------- устойчивые пары и группы ----------

-- Заводятся один раз и подставляются в шаблон и в занятие целиком
-- (решение Даниила 13.11): одни и те же ученики сразу подписаны «пара» или
-- «группа», разъединить / добавить / сменить формат — правка здесь.
-- Форматы: pair — вдвоём «час в час», group — группа, semi —
-- полупараллелка (двое параллельно, преподаватель переходит)
create table if not exists public.student_groups (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null default '' check (char_length(name) <= 80),
  format      text not null default 'pair' check (format in ('pair', 'group', 'semi')),
  dur_min     smallint check (dur_min is null or dur_min between 5 and 720),
  note        text not null default '' check (char_length(note) <= 2000),
  archived_at timestamptz,
  ext_id      text check (ext_id is null or char_length(ext_id) between 1 and 100),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (id, owner)
);
create unique index if not exists student_groups_ext on public.student_groups (owner, ext_id) where ext_id is not null;

create table if not exists public.student_group_members (
  group_id    uuid not null,
  student_id  uuid not null,
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pos         smallint not null default 0,
  primary key (group_id, student_id),
  foreign key (group_id, owner)   references public.student_groups (id, owner) on delete cascade,
  foreign key (student_id, owner) references public.students (id, owner) on delete cascade
);
create index if not exists student_group_members_student on public.student_group_members (student_id);


-- ---------- шаблоны недели ----------

-- «Вставить шаблон в неделю» создаёт настоящие занятия (без правил повтора
-- с исключениями — schedule-audit.md): шаблон живёт отдельно и правится
-- отдельно, занятия помнят, из какого слота пришли (lessons.from_slot)
create table if not exists public.week_templates (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null default '' check (char_length(name) <= 80),
  -- активный шаблон (activeTpl старого приложения) — не больше одного
  is_active   boolean not null default false,
  pos         smallint not null default 0,
  ext_id      text check (ext_id is null or char_length(ext_id) between 1 and 100),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (id, owner)
);
create unique index if not exists week_templates_one_active on public.week_templates (owner) where is_active;
create unique index if not exists week_templates_ext on public.week_templates (owner, ext_id) where ext_id is not null;

create table if not exists public.template_slots (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null,
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- 1 — понедельник … 7 — воскресенье (ISO)
  weekday     smallint not null check (weekday between 1 and 7),
  start_min   smallint check (start_min is null or start_min between 0 and 1439),
  dur_min     smallint not null default 60 check (dur_min between 5 and 720),
  format      text not null default 'single' check (format in ('single', 'pair', 'group', 'semi')),
  is_event    boolean not null default false,
  title       text not null default '' check (char_length(title) <= 200),
  note        text not null default '' check (char_length(note) <= 2000),
  -- устойчивая пара/группа слота; удалили группу — слот остаётся
  group_id    uuid references public.student_groups (id) on delete set null,
  pos         smallint not null default 0,
  ext_id      text check (ext_id is null or char_length(ext_id) between 1 and 100),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (id, owner),
  foreign key (template_id, owner) references public.week_templates (id, owner) on delete cascade
);
create index if not exists template_slots_tpl on public.template_slots (template_id, weekday, start_min);
create unique index if not exists template_slots_ext on public.template_slots (owner, ext_id) where ext_id is not null;

-- Участник слота: ученик ИЛИ имя гостя. Гость — незнакомое имя из старого
-- приложения: заводить ученика молча нельзя (schedule-audit.md, В5), а
-- терять имя при обратной записи — тоже
create table if not exists public.template_slot_students (
  id          uuid primary key default gen_random_uuid(),
  slot_id     uuid not null,
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  student_id  uuid,
  guest_name  text check (guest_name is null or char_length(btrim(guest_name)) between 1 and 80),
  pos         smallint not null default 0,
  check ((student_id is null) <> (guest_name is null)),
  unique (slot_id, student_id),
  foreign key (slot_id, owner)    references public.template_slots (id, owner) on delete cascade,
  foreign key (student_id, owner) references public.students (id, owner) on delete cascade
);
create index if not exists template_slot_students_student on public.template_slot_students (student_id);


-- ---------- занятия ----------

create table if not exists public.lessons (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day         date not null,
  -- минута суток начала; null — время не указано (в старом приложении
  -- время вписывается руками и бывает пустым)
  start_min   smallint check (start_min is null or start_min between 0 and 1439),
  -- длительность ставит страница из ученика / группы / настроек; 60 —
  -- только запасное значение базы
  dur_min     smallint not null default 60 check (dur_min between 5 and 720),
  -- single — индивидуальное, pair — пара, group — группа, semi —
  -- полупараллелка. Названия форматов меняются в настройках
  format      text not null default 'single' check (format in ('single', 'pair', 'group', 'semi')),
  -- событие, а не урок (ev старого приложения): «врач», «вебинар» —
  -- в title, участников и статусов нет
  is_event    boolean not null default false,
  title       text not null default '' check (char_length(title) <= 200),
  note        text not null default '' check (char_length(note) <= 2000),
  board_id    text check (board_id is null or char_length(board_id) <= 100),
  group_id    uuid references public.student_groups (id) on delete set null,
  from_slot   uuid references public.template_slots (id) on delete set null,
  -- id строки занятия в старом приложении (синхронизация, В5)
  ext_id      text check (ext_id is null or char_length(ext_id) between 1 and 100),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (id, owner)
);
create index if not exists lessons_owner_day on public.lessons (owner, day, start_min);
create unique index if not exists lessons_ext on public.lessons (owner, ext_id) where ext_id is not null;

-- Участник занятия со своим статусом (как sts у полупараллелки в старом
-- приложении, теперь у любого формата). Свой id — чтобы оплатам (В4) было
-- на что сослаться: «это занятие этого ученика оплачено абонементом N»
create table if not exists public.lesson_students (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null,
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  student_id  uuid,
  guest_name  text check (guest_name is null or char_length(btrim(guest_name)) between 1 and 80),
  -- plan — запланировано, done — проведено, skip — прогул, move — перенос
  status      text not null default 'plan' check (status in ('plan', 'done', 'skip', 'move')),
  pos         smallint not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check ((student_id is null) <> (guest_name is null)),
  unique (lesson_id, student_id),
  foreign key (lesson_id, owner)  references public.lessons (id, owner) on delete cascade,
  foreign key (student_id, owner) references public.students (id, owner) on delete cascade
);
create index if not exists lesson_students_student on public.lesson_students (student_id);

-- Занятие в журнале памяти (В2: «что решали на этом занятии»). Удалили
-- занятие — события остаются, ссылка обнуляется
alter table public.student_task_log
  add column if not exists lesson_id uuid references public.lessons (id) on delete set null;
create index if not exists student_task_log_lesson on public.student_task_log (lesson_id) where lesson_id is not null;


-- ---------- синхронизация со старым приложением ----------

-- Последнее согласованное состояние старого приложения (ответ его /data:
-- {rev, data}). По нему кабинет сводит правки по дням, как mergeStates
-- старого приложения: база / моё / чужое — без базы не отличить «удалено
-- в кабинете» от «добавлено в старом». Код доступа к старому приложению
-- сюда НЕ кладётся — только в браузере (schedule-audit.md).
create table if not exists public.ext_sync (
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source      text not null default 'old_app' check (source ~ '^[a-z0-9_]{1,40}$'),
  rev         bigint,
  base        jsonb not null default '{}'::jsonb
              check (jsonb_typeof(base) = 'object' and octet_length(base::text) <= 5000000),
  synced_at   timestamptz,
  updated_at  timestamptz not null default now(),
  primary key (owner, source)
);


-- ---------- отметка времени правки ----------

do $$
declare t text;
begin
  foreach t in array array['students', 'teacher_settings', 'student_groups', 'week_templates',
                           'template_slots', 'lessons', 'lesson_students', 'ext_sync'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_touch', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.cabinet_touch()',
                   t || '_touch', t);
  end loop;
end $$;


-- ---------- права и правила доступа ----------

alter table public.students               enable row level security;
alter table public.student_task_log       enable row level security;
alter table public.teacher_settings       enable row level security;
alter table public.student_groups         enable row level security;
alter table public.student_group_members  enable row level security;
alter table public.week_templates         enable row level security;
alter table public.template_slots         enable row level security;
alter table public.template_slot_students enable row level security;
alter table public.lessons                enable row level security;
alter table public.lesson_students        enable row level security;
alter table public.ext_sync               enable row level security;

-- Supabase по умолчанию раздаёт anon и authenticated все права на новые
-- таблицы в public, а защищает только RLS. Права выставлены явно (как в
-- works-schema.sql): anon — ничего, преподаватель — ровно нужное.
revoke all on table public.students, public.student_task_log, public.teacher_settings,
  public.student_groups, public.student_group_members, public.week_templates,
  public.template_slots, public.template_slot_students, public.lessons,
  public.lesson_students, public.ext_sync from anon, authenticated;
grant select, insert, update, delete on table public.students, public.teacher_settings,
  public.student_groups, public.student_group_members, public.week_templates,
  public.template_slots, public.template_slot_students, public.lessons,
  public.lesson_students, public.ext_sync to authenticated;
-- журнал: без update — события не переписываются, только забываются
grant select, insert, delete on table public.student_task_log to authenticated;

-- Таблицы, где «своё» — это просто owner (связь с родителем держат
-- составные внешние ключи)
do $$
declare t text;
begin
  foreach t in array array['students', 'teacher_settings', 'student_group_members', 'week_templates',
                           'template_slot_students', 'lesson_students', 'ext_sync', 'student_groups'] loop
    execute format('drop policy if exists %I on public.%I', t || '_owner', t);
    execute format('create policy %I on public.%I for all to authenticated '
                   'using (owner = (select auth.uid())) with check (owner = (select auth.uid()))',
                   t || '_owner', t);
  end loop;
end $$;

-- Ссылки «на удаление — обнулить» (group_id, from_slot, lesson_id) —
-- обычные внешние ключи, им составной ключ не подходит (обнулился бы и
-- owner). Поэтому «ссылка только на своё» проверяет правило доступа
drop policy if exists template_slots_owner on public.template_slots;
create policy template_slots_owner on public.template_slots
  for all to authenticated
  using (owner = (select auth.uid()))
  with check (owner = (select auth.uid())
    and (template_slots.group_id is null or exists (select 1 from public.student_groups g
         where g.id = template_slots.group_id and g.owner = (select auth.uid()))));

drop policy if exists lessons_owner on public.lessons;
create policy lessons_owner on public.lessons
  for all to authenticated
  using (owner = (select auth.uid()))
  with check (owner = (select auth.uid())
    and (lessons.group_id is null or exists (select 1 from public.student_groups g
         where g.id = lessons.group_id and g.owner = (select auth.uid())))
    and (lessons.from_slot is null or exists (select 1 from public.template_slots s
         where s.id = lessons.from_slot and s.owner = (select auth.uid()))));

drop policy if exists student_task_log_owner on public.student_task_log;
drop policy if exists student_task_log_read on public.student_task_log;
create policy student_task_log_read on public.student_task_log
  for select to authenticated
  using (owner = (select auth.uid()));
drop policy if exists student_task_log_add on public.student_task_log;
create policy student_task_log_add on public.student_task_log
  for insert to authenticated
  with check (owner = (select auth.uid())
    and (student_task_log.lesson_id is null or exists (select 1 from public.lessons l
         where l.id = student_task_log.lesson_id and l.owner = (select auth.uid()))));
drop policy if exists student_task_log_forget on public.student_task_log;
create policy student_task_log_forget on public.student_task_log
  for delete to authenticated
  using (owner = (select auth.uid()));
