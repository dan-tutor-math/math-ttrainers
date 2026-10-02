-- ============================================================
-- Работы по ссылке: домашние, самостоятельные, контрольные
-- (промпт №15 «работы», этап 0 — только база).
--
-- Как применить: Supabase → SQL Editor → вставить файл целиком → Run.
-- Повторный запуск безопасен: таблицы создаются «если нет», функции и
-- правила доступа пересоздаются. Данные при повторном запуске не трогаются.
--
-- Устройство:
--   works          — работа учителя: тип, название, настройки (ползунок
--                    «результат сразу / в конце», число попыток)
--   work_variants  — вариант работы со своим кодом ссылки и своим списком
--                    заданий (blocks); вариант 1 — исходный, «Новый
--                    вариант» добавляет 2, 3, …
--   work_attempts  — один заход ученика по ссылке: имя и секрет устройства
--   work_answers   — ответ на одно задание внутри захода
--
-- Почему ученик не ходит в таблицы напрямую: у него нет входа, он аноним
-- с публичным ключом. Дать anon право читать work_attempts значило бы
-- показать любому все имена и ответы всех учеников. Поэтому у anon прав на
-- таблицы нет вовсе, а всё, что нужно ученику, — пять функций ниже
-- (security definer): они пускают только по коду ссылки и секрету захода.
-- Учитель (вход по email, роль authenticated) читает и правит СВОЁ
-- обычными запросами под правилами RLS.
-- ============================================================


-- ---------- служебные функции ----------

-- Код ссылки: 10 знаков из того же алфавита, что у кода совместной сессии
-- (session-share.js, CODE_ALPHABET) — без 0/O/1/I/L, код могут продиктовать
-- голосом. 31^10 ≈ 8·10^14 — перебором не угадать. Случайность — из
-- gen_random_uuid (криптостойкий генератор, есть в Postgres без
-- расширений); random() для ссылок не годится — он предсказуем.
-- security definer — потому что проверка «такого кода ещё нет» должна видеть
-- коды ВСЕХ учителей, а под RLS учитель видит только свои.
create or replace function public.work_gen_code()
returns text
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  -- байты 6 и 8 у uuid v4 частично заняты номером версии и варианта
  idx constant int[] := array[0, 1, 2, 3, 4, 5, 10, 11, 12, 13];
  b bytea;
  c text;
  i int;
begin
  loop
    b := uuid_send(gen_random_uuid());
    c := '';
    foreach i in array idx loop
      c := c || substr(alphabet, (get_byte(b, i) % 31) + 1, 1);
    end loop;
    exit when not exists (select 1 from public.work_variants v where v.code = c);
  end loop;
  return c;
end $$;

create or replace function public.work_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end $$;


-- ---------- таблицы ----------

create table if not exists public.works (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- 'lesson' — задел под интерактивные уроки (этап 4): у урока те же
  -- варианты, ссылка и заходы, только в blocks кроме заданий будут
  -- текст и видео. Отдельные таблицы под уроки не понадобятся
  type        text not null default 'work' check (type in ('work', 'lesson')),
  -- hw — домашняя, sr — самостоятельная, kr — контрольная,
  -- custom — своё название (лежит в title)
  kind        text not null default 'hw' check (kind in ('hw', 'sr', 'kr', 'custom')),
  title       text not null default '' check (char_length(title) <= 200),
  -- { feedback: 'each' | 'end', attempts: число | null (∞) } — форму
  -- проверяет страница, база хранит как есть: новая настройка не должна
  -- требовать правки базы
  settings    jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  -- закрытая работа: по ссылке не начать и не сохранить ответ, результаты
  -- остаются (контрольную «собрали»)
  closed      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists works_owner_created on public.works (owner, created_at desc);

create table if not exists public.work_variants (
  id          uuid primary key default gen_random_uuid(),
  work_id     uuid not null references public.works(id) on delete cascade,
  num         int  not null default 1 check (num between 1 and 999),
  code        text not null unique default public.work_gen_code(),
  -- задания по порядку: [{ id, type: 'task', mode: 'train' | 'exam', gen: {…рецепт…}, … }].
  -- id задания постоянный: по нему привязаны ответы, поэтому перестановка
  -- заданий после того, как ученики начали, ответы не перепутает.
  -- Рецепт — тот же объект gen, что у «ещё такое же» на досках
  -- (trainerGenInfo в boards-core.js): тренажёр, адрес, снимок состояния.
  -- Сам тренажёр в базу не копируется — правки тренажёров попадают в
  -- работы сами. Потолок 3 МБ — защита от случайной картинки внутри
  -- снимка: такой вариант грузился бы у ученика на телефоне вечность
  blocks      jsonb not null default '[]'::jsonb
              check (jsonb_typeof(blocks) = 'array' and octet_length(blocks::text) <= 3000000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (work_id, num)
);
create index if not exists work_variants_work on public.work_variants (work_id);

create table if not exists public.work_attempts (
  id           uuid primary key default gen_random_uuid(),
  -- work_id дублирует вариант ради правил доступа и выборки «все заходы
  -- по работе» одним условием, без соединения с вариантами
  work_id      uuid not null references public.works(id) on delete cascade,
  variant_id   uuid not null references public.work_variants(id) on delete cascade,
  -- вход только по имени, дубли допустимы (решение Даниила): две «Маши»
  -- различаются временем начала
  student_name text not null check (char_length(student_name) between 1 and 60),
  -- секрет устройства: выдаётся один раз при начале и лежит у ученика в
  -- браузере. По нему и только по нему можно продолжить и сохранять ответы.
  -- Склеивать заходы по имени нельзя — при дублях две разные Маши слились бы
  secret       uuid not null default gen_random_uuid(),
  started_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  finished_at  timestamptz,
  -- время, пока вкладка была на экране (считает страница), а не «от начала
  -- до конца»: ученик мог открыть работу и уйти ужинать
  active_ms    bigint not null default 0 check (active_ms >= 0)
);
create index if not exists work_attempts_work on public.work_attempts (work_id, started_at desc);
create index if not exists work_attempts_variant on public.work_attempts (variant_id);

create table if not exists public.work_answers (
  attempt_id     uuid not null references public.work_attempts(id) on delete cascade,
  task_id        text not null check (char_length(task_id) between 1 and 64),
  -- pending — ещё решает (были неверные попытки, но они не кончились);
  -- ok — верно; bad — неверно окончательно (попытки кончились или при
  -- «результат в конце» сдан неверный ответ); skipped — «Пропустить»
  status         text not null default 'pending' check (status in ('pending', 'ok', 'bad', 'skipped')),
  value          jsonb,   -- что ввёл или выбрал ученик, как отдал тренажёр
  tries          int not null default 0 check (tries between 0 and 1000),
  hint_used      boolean not null default false,
  solution_shown boolean not null default false,
  time_ms        bigint not null default 0 check (time_ms >= 0),
  updated_at     timestamptz not null default now(),
  primary key (attempt_id, task_id)
);


drop trigger if exists works_touch on public.works;
create trigger works_touch before update on public.works
  for each row execute function public.work_touch();
drop trigger if exists work_variants_touch on public.work_variants;
create trigger work_variants_touch before update on public.work_variants
  for each row execute function public.work_touch();


-- ---------- права и правила доступа ----------

alter table public.works         enable row level security;
alter table public.work_variants enable row level security;
alter table public.work_attempts enable row level security;
alter table public.work_answers  enable row level security;

-- Supabase по умолчанию раздаёт anon и authenticated все права на новые
-- таблицы в public, а защищает только RLS. Здесь права выставлены явно:
-- anon — ничего (всё через функции), учитель — ровно то, что нужно.
-- Явно — ещё и потому, что в сентябре права anon на таблицы однажды
-- «пропали» и совместный доступ лёг (HANDOFF, «Грабли»): так видно, что
-- должно быть, и повторный запуск файла возвращает как надо.
revoke all on table public.works, public.work_variants, public.work_attempts, public.work_answers from anon;
revoke all on table public.works, public.work_variants, public.work_attempts, public.work_answers from authenticated;
grant select, insert, update, delete on table public.works, public.work_variants to authenticated;
-- заходы и ответы пишет только ученик через функции; учитель их читает и
-- может удалить (свои пробные заходы, ошибочные)
grant select, delete on table public.work_attempts, public.work_answers to authenticated;

drop policy if exists works_owner on public.works;
create policy works_owner on public.works
  for all to authenticated
  using (owner = (select auth.uid()))
  with check (owner = (select auth.uid()));

drop policy if exists work_variants_owner on public.work_variants;
create policy work_variants_owner on public.work_variants
  for all to authenticated
  using (exists (select 1 from public.works w where w.id = work_id and w.owner = (select auth.uid())))
  with check (exists (select 1 from public.works w where w.id = work_id and w.owner = (select auth.uid())));

drop policy if exists work_attempts_owner_read on public.work_attempts;
create policy work_attempts_owner_read on public.work_attempts
  for select to authenticated
  using (exists (select 1 from public.works w where w.id = work_id and w.owner = (select auth.uid())));
drop policy if exists work_attempts_owner_delete on public.work_attempts;
create policy work_attempts_owner_delete on public.work_attempts
  for delete to authenticated
  using (exists (select 1 from public.works w where w.id = work_id and w.owner = (select auth.uid())));

drop policy if exists work_answers_owner_read on public.work_answers;
create policy work_answers_owner_read on public.work_answers
  for select to authenticated
  using (exists (select 1 from public.work_attempts a join public.works w on w.id = a.work_id
                 where a.id = attempt_id and w.owner = (select auth.uid())));
drop policy if exists work_answers_owner_delete on public.work_answers;
create policy work_answers_owner_delete on public.work_answers
  for delete to authenticated
  using (exists (select 1 from public.work_attempts a join public.works w on w.id = a.work_id
                 where a.id = attempt_id and w.owner = (select auth.uid())));


-- ---------- функции для ученика ----------
-- Ошибки — коротким кодом в тексте исключения (work_not_found,
-- work_closed, bad_name, attempt_not_found, attempt_finished, …):
-- страница переводит код в понятную фразу, а не показывает ученику
-- английский текст базы.

-- Открыть работу по коду ссылки: название, настройки, задания варианта.
-- Нет такого кода — null. Закрытая — только название и closed, без заданий.
create or replace function public.work_open(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case when w.closed then
           jsonb_build_object('closed', true,
             'work', jsonb_build_object('type', w.type, 'kind', w.kind, 'title', w.title))
         else
           jsonb_build_object('closed', false,
             'work', jsonb_build_object('type', w.type, 'kind', w.kind, 'title', w.title, 'settings', w.settings),
             'variant', jsonb_build_object('num', v.num, 'code', v.code, 'blocks', v.blocks))
         end
  from public.work_variants v
  join public.works w on w.id = v.work_id
  -- код могут набрать руками строчными и с пробелами
  where v.code = upper(btrim(coalesce(p_code, '')))
$$;

-- Начать: ученик ввёл имя. Возвращает номер захода и секрет — страница
-- кладёт их себе в браузер, по ним продолжение и сохранение.
create or replace function public.work_start(p_code text, p_name text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v record;
  nm text;
  a record;
begin
  select v2.id, v2.work_id, w.closed into v
    from public.work_variants v2 join public.works w on w.id = v2.work_id
   where v2.code = upper(btrim(coalesce(p_code, '')));
  if not found then raise exception 'work_not_found'; end if;
  if v.closed then raise exception 'work_closed'; end if;

  nm := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  if char_length(nm) < 1 or char_length(nm) > 60 then raise exception 'bad_name'; end if;

  -- ссылка публичная: без потолка кто угодно мог бы забить базу пустыми
  -- заходами. Тысяча на вариант — с огромным запасом для живого класса
  if (select count(*) from public.work_attempts x where x.variant_id = v.id) >= 1000 then
    raise exception 'too_many_attempts';
  end if;

  insert into public.work_attempts (work_id, variant_id, student_name)
  values (v.work_id, v.id, nm)
  returning id, secret, started_at into a;

  return jsonb_build_object('attempt', a.id, 'secret', a.secret, 'started_at', a.started_at, 'name', nm);
end $$;

-- Продолжить на том же устройстве: заход и все сохранённые ответы.
-- Нужен и после «Завершить» — показать ученику итог.
create or replace function public.work_resume(p_attempt uuid, p_secret uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  a record;
begin
  select x.id, x.student_name, x.started_at, x.finished_at, x.active_ms, v.code
    into a
    from public.work_attempts x join public.work_variants v on v.id = x.variant_id
   where x.id = p_attempt and x.secret = p_secret;
  -- чужой номер захода и неверный секрет неразличимы — иначе по ответу
  -- можно было бы перебирать существующие заходы
  if not found then raise exception 'attempt_not_found'; end if;

  return jsonb_build_object(
    'attempt', a.id, 'name', a.student_name, 'code', a.code,
    'started_at', a.started_at, 'finished_at', a.finished_at, 'active_ms', a.active_ms,
    'answers', coalesce((
      select jsonb_agg(jsonb_build_object(
               'task_id', r.task_id, 'status', r.status, 'value', r.value, 'tries', r.tries,
               'hint_used', r.hint_used, 'solution_shown', r.solution_shown, 'time_ms', r.time_ms)
             order by r.task_id)
        from public.work_answers r where r.attempt_id = a.id), '[]'::jsonb));
end $$;

-- Сохранить ответ на одно задание. p_answer:
--   { task_id, status, value, tries, hint_used, solution_shown, time_ms }
-- p_active_ms — сколько всего ученик пробыл в работе (для учителя).
create or replace function public.work_save_answer(p_attempt uuid, p_secret uuid, p_answer jsonb, p_active_ms bigint default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  a record;
  tid text;
  st text;
  n_tries int;
  n_time bigint;
begin
  select x.id, x.finished_at, v.blocks, w.closed
    into a
    from public.work_attempts x
    join public.work_variants v on v.id = x.variant_id
    join public.works w on w.id = x.work_id
   where x.id = p_attempt and x.secret = p_secret
   for update of x;
  if not found then raise exception 'attempt_not_found'; end if;
  -- после «Завершить» ответы не меняются: иначе в контрольной можно было бы
  -- увидеть итог и переписать неверное
  if a.finished_at is not null then raise exception 'attempt_finished'; end if;
  if a.closed then raise exception 'work_closed'; end if;
  if p_answer is null or jsonb_typeof(p_answer) <> 'object' then raise exception 'bad_answer'; end if;

  tid := p_answer->>'task_id';
  -- ответ только на задание, которое есть в варианте этого захода: иначе
  -- через функцию можно было бы набить захода сколько угодно строк
  if tid is null or not exists (
       select 1 from jsonb_array_elements(a.blocks) e
        where e->>'id' = tid and coalesce(e->>'type', 'task') = 'task') then
    raise exception 'task_not_found';
  end if;

  st := coalesce(p_answer->>'status', 'pending');
  if st not in ('pending', 'ok', 'bad', 'skipped') then raise exception 'bad_answer'; end if;
  if octet_length(coalesce(p_answer->'value', 'null'::jsonb)::text) > 20000 then
    raise exception 'answer_too_big';
  end if;
  n_tries := case when jsonb_typeof(p_answer->'tries') = 'number'
                  then least(greatest((p_answer->>'tries')::numeric, 0), 1000)::int else 0 end;
  n_time  := case when jsonb_typeof(p_answer->'time_ms') = 'number'
                  then greatest((p_answer->>'time_ms')::numeric, 0)::bigint else 0 end;

  insert into public.work_answers as r
         (attempt_id, task_id, status, value, tries, hint_used, solution_shown, time_ms, updated_at)
  values (a.id, tid, st, p_answer->'value', n_tries,
          coalesce((p_answer->>'hint_used')::boolean, false),
          coalesce((p_answer->>'solution_shown')::boolean, false),
          n_time, now())
  on conflict (attempt_id, task_id) do update set
    status = excluded.status,
    value = excluded.value,
    -- попытки, время и «смотрел подсказку / решение» только растут:
    -- сохранение из старой вкладки или повтор запроса после обрыва связи
    -- не должны стирать то, что уже было. Статус и ответ — последние
    -- (при «результат в конце» ответ можно менять до «Завершить»)
    tries = greatest(r.tries, excluded.tries),
    hint_used = r.hint_used or excluded.hint_used,
    solution_shown = r.solution_shown or excluded.solution_shown,
    time_ms = greatest(r.time_ms, excluded.time_ms),
    updated_at = now();

  update public.work_attempts
     set last_seen_at = now(),
         active_ms = greatest(active_ms, coalesce(p_active_ms, 0))
   where id = a.id;

  return jsonb_build_object('ok', true);
end $$;

-- Завершить работу. Повторный вызов ничего не ломает (время завершения —
-- первое). Возвращает то же, что work_resume, — страница сразу рисует итог.
create or replace function public.work_finish(p_attempt uuid, p_secret uuid, p_active_ms bigint default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
begin
  update public.work_attempts
     set finished_at = coalesce(finished_at, now()),
         last_seen_at = now(),
         active_ms = greatest(active_ms, coalesce(p_active_ms, 0))
   where id = p_attempt and secret = p_secret;
  if not found then raise exception 'attempt_not_found'; end if;
  return public.work_resume(p_attempt, p_secret);
end $$;


-- Функции по умолчанию может вызывать кто угодно (PUBLIC) — выставляем явно.
-- work_gen_code нужен authenticated: это значение по умолчанию у кода
-- варианта, а значение по умолчанию считается с правами того, кто вставляет.
revoke all on function public.work_gen_code() from public, anon, authenticated;
grant execute on function public.work_gen_code() to authenticated;

revoke all on function public.work_open(text) from public;
revoke all on function public.work_start(text, text) from public;
revoke all on function public.work_resume(uuid, uuid) from public;
revoke all on function public.work_save_answer(uuid, uuid, jsonb, bigint) from public;
revoke all on function public.work_finish(uuid, uuid, bigint) from public;
-- authenticated тоже: ученик может оказаться вошедшим по email (общие доски
-- в том же браузере) — тогда он не anon, а работу решать всё равно должен
grant execute on function public.work_open(text) to anon, authenticated;
grant execute on function public.work_start(text, text) to anon, authenticated;
grant execute on function public.work_resume(uuid, uuid) to anon, authenticated;
grant execute on function public.work_save_answer(uuid, uuid, jsonb, bigint) to anon, authenticated;
grant execute on function public.work_finish(uuid, uuid, bigint) to anon, authenticated;

-- ---------- картинки заданий (Storage) — этап 1 ----------
-- Задание в работе ученик видит картинкой — тем же снимком карточки, что
-- кладётся на доску (captureTrainerNode в trainer-tasks.js), а поля ответа
-- лежат поверх неё. Картинки — не в таблице, а в хранилище файлов: в jsonb
-- варианта они раздували бы каждую выдачу work_open и базу (500 МБ на
-- бесплатном тарифе), а файл хранилища браузер ученика ещё и кэширует.
--
-- Бакет публичный: читать по прямой ссылке может кто угодно — ученик без
-- входа. Имя файла — хэш содержимого, ссылку не угадать, а сама картинка —
-- это только условие задачи. Писать может лишь вошедший учитель и только в
-- папку со своим id: «<id учителя>/<хэш>.webp». Удалять — тоже только своё.
-- Перезаписи нет: одинаковое содержимое = одно и то же имя.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('work-images', 'work-images', true, 2097152, array['image/webp', 'image/png', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists work_images_insert_own on storage.objects;
create policy work_images_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'work-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
-- select нужен самой библиотеке при загрузке (проверка, есть ли файл), а
-- учителю — чтобы видеть свои файлы; читать картинки ученику он не нужен:
-- публичный бакет отдаёт их по прямой ссылке мимо этих правил
drop policy if exists work_images_select_own on storage.objects;
create policy work_images_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'work-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists work_images_delete_own on storage.objects;
create policy work_images_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'work-images' and (storage.foldername(name))[1] = (select auth.uid())::text);


-- Проверка после запуска (должно вернуть null, а не ошибку прав):
--   select public.work_open('НЕТТАКОГО');
