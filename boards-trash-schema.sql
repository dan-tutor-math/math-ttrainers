-- ============================================================
-- Корзина досок на сервере («„корзина досок“»). Запускать после
-- boards-server-schema.sql.
--
-- Как применить: Supabase → SQL Editor → вставить файл целиком → Run.
-- Повторный запуск безопасен. Пока файл не запущен, сайт работает: доски
-- уходят в корзину и удаляются в браузере, а сервер не трогается, как
-- раньше (вызовы ниже просто не находятся, сайт повторит их позже).
--
-- Зачем. Удаление в списке досок раньше было только в браузере: строка
-- доски, все её объекты и картинки оставались на сервере навсегда, а
-- облачная доска при следующем открытии страницы ещё и возвращалась в
-- список (cloudImportSharedBoards). Теперь:
--   - удалили свою доску — на сервере у неё ставится trashed_at, 5 дней её
--     можно восстановить;
--   - через 5 дней (или «Удалить навсегда») стираются строка доски, все её
--     объекты, доступы и всё, что ссылается на неё внешним ключом.
--     Картинки, на которые больше никто не ссылается, потом забирает
--     обычная уборка board_images_garbage (boards-server-schema.sql);
--   - чужая доска (поделились со мной) на сервере не трогается: «удалить
--     навсегда» убирает только мой доступ к ней.
--
-- Сравнение id везде через ::text: тип boards.id в репозитории не записан
-- (схему заводили руками в Supabase), а text ↔ uuid без приведения дают
-- ошибку «operator does not exist». Так — только в маленьких boards и
-- board_access; объекты стираются по индексу (board_rows_delete).
-- ============================================================

alter table public.boards add column if not exists trashed_at timestamptz;

-- Удалить строки одной доски из таблицы tbl по столбцу col. Значение
-- приводится к типу СТОЛБЦА ($1::uuid), а не столбец к тексту: раньше было
-- «col::text = $1», индекс по board_id так не работает, и каждая доска
-- стиралась полным проходом по board_objects (дважды). На настоящей базе
-- это упёрлось в statement timeout (57014) — «Удалить навсегда» не проходило
-- и доски возвращались на других устройствах («„воскрешение досок“»).
create or replace function public.board_rows_delete(p_tbl regclass, p_col name, p_board text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_type text;
begin
  select format_type(a.atttypid, a.atttypmod) into v_type
    from pg_attribute a
   where a.attrelid = p_tbl and a.attname = p_col and not a.attisdropped;
  if v_type is null then return; end if;
  execute format('delete from %s where %I = $1::%s', p_tbl, p_col, v_type) using p_board;
end $$;

revoke all on function public.board_rows_delete(regclass, name, text) from public, anon, authenticated;

-- Полное удаление одной доски. Без проверки прав — её зовут только функции
-- ниже, которые сами проверили, что доска моя. Наружу не выдаётся.
create or replace function public.board_purge_internal(p_board text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  -- всё, что ссылается на boards внешним ключом (board_objects,
  -- board_access, invites и то, что добавят потом), — иначе удаление строки
  -- доски упрётся в ключ без каскада. Перечень берём из самой базы, а не
  -- пишем руками: так не пропустим таблицу, о которой в коде не знаем
  for r in
    select distinct c.conrelid::regclass as tbl, a.attname as col
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    where c.contype = 'f' and c.confrelid = 'public.boards'::regclass
  loop
    perform public.board_rows_delete(r.tbl, r.col, p_board);
  end loop;
  -- и те же таблицы, если в них board_id без внешнего ключа (по индексу
  -- это мгновенно, даже если ключ есть и строки уже стёрты выше)
  if to_regclass('public.board_objects') is not null then
    perform public.board_rows_delete('public.board_objects', 'board_id', p_board);
  end if;
  if to_regclass('public.board_access') is not null then
    perform public.board_rows_delete('public.board_access', 'board_id', p_board);
  end if;
  -- журнал удалённых объектов (HANDOFF, раздел 7; в базе может не быть) —
  -- удаление объектов выше как раз наполнило бы его копией всей доски
  if to_regclass('public.board_objects_deleted') is not null then
    perform public.board_rows_delete('public.board_objects_deleted', 'board_id', p_board);
  end if;
  perform public.board_rows_delete('public.boards', 'id', p_board);
end $$;

revoke all on function public.board_purge_internal(text) from public, anon, authenticated;

-- В корзину. Своя доска — trashed_at = сейчас (повторный вызов время не
-- сдвигает). Чужую не трогаем: решать её судьбу владельцу.
create or replace function public.boards_trash(p_boards text[])
returns int
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  if auth.uid() is null then return 0; end if;
  update public.boards set trashed_at = coalesce(trashed_at, now())
   where id::text = any(p_boards) and owner = auth.uid();
  get diagnostics n = row_count;
  return n;
end $$;

-- Из корзины обратно.
create or replace function public.boards_restore(p_boards text[])
returns int
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  if auth.uid() is null then return 0; end if;
  update public.boards set trashed_at = null
   where id::text = any(p_boards) and owner = auth.uid();
  get diagnostics n = row_count;
  return n;
end $$;

-- «Удалить навсегда» (и автоматически через 5 дней корзины). Своя доска
-- стирается целиком, у чужой убирается только мой доступ. Доски, которой
-- уже нет, просто пропускаются — сайт повторяет вызов, пока не убедится.
create or replace function public.boards_delete_now(p_boards text[])
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  b text;
  n int := 0;
  v_owner uuid;
begin
  if auth.uid() is null then return 0; end if;
  foreach b in array coalesce(p_boards, '{}') loop
    select owner into v_owner from public.boards where id::text = b;
    if not found then continue; end if;
    if v_owner = auth.uid() then
      perform public.board_purge_internal(b);
      n := n + 1;
    elsif to_regclass('public.board_access') is not null then
      delete from public.board_access where board_id::text = b and user_id = auth.uid();
    end if;
  end loop;
  return n;
end $$;

-- Подстраховка на сервере: всё МОЁ, что лежит в корзине дольше 5 дней,
-- стирается при любом входе на страницу досок — даже если браузер, где
-- доску удалили, больше не открывали.
create or replace function public.boards_purge_trash()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  b text;
  n int := 0;
begin
  if auth.uid() is null then return 0; end if;
  for b in
    select id::text from public.boards
     where owner = auth.uid() and trashed_at is not null
       and trashed_at < now() - interval '5 days'
  loop
    perform public.board_purge_internal(b);
    n := n + 1;
  end loop;
  return n;
end $$;

revoke all on function public.boards_trash(text[]) from public, anon;
revoke all on function public.boards_restore(text[]) from public, anon;
revoke all on function public.boards_delete_now(text[]) from public, anon;
revoke all on function public.boards_purge_trash() from public, anon;
grant execute on function public.boards_trash(text[]) to authenticated;
grant execute on function public.boards_restore(text[]) to authenticated;
grant execute on function public.boards_delete_now(text[]) to authenticated;
grant execute on function public.boards_purge_trash() to authenticated;
