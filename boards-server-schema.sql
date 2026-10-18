-- ============================================================
-- Доски на сервере, шаг 2 (промпт №90): уборка мусора в хранилище
-- картинок. Запускать ПОСЛЕ board-images-schema.sql.
--
-- Как применить: Supabase → SQL Editor → вставить файл целиком → Run.
-- Повторный запуск безопасен.
--
-- board_images_garbage — список файлов этого учителя в бакете
-- board-images старше min_age_days дней, на которые не ссылается ни один
-- объект ни одной доски в базе (ни картинка, ни разбор задания). Сайт раз в
-- сутки берёт этот список и удаляет файлы через Storage API (удалять строки
-- storage.objects напрямую Supabase не даёт). Учитываются и картинки в
-- шаблонах презентаций (deck_templates, deck-templates-schema.sql — запускать
-- раньше этого файла). Функция смотрит доски ВСЕХ
-- пользователей: картинку, скопированную в чужую общую доску, она не
-- назовёт мусором. Только чтение — сама ничего не удаляет.
-- ============================================================

create or replace function public.board_images_garbage(min_age_days int default 30)
returns table (name text)
language sql
stable
security definer
set search_path = public, storage
as $$
  select o.name
  from storage.objects o
  where o.bucket_id = 'board-images'
    and (storage.foldername(o.name))[1] = (select auth.uid())::text
    and o.created_at < now() - make_interval(days => greatest(min_age_days, 7))
    and not exists (
      select 1 from public.board_objects bo
      where bo.data->>'src' = 'img:' || o.name
         or bo.data->'sol'->>'src' = 'img:' || o.name
    )
    -- картинки в своих шаблонах презентаций (подложки, слайды целиком)
    and not exists (
      select 1 from public.deck_templates t
      where position(('img:' || o.name) in t.data::text) > 0
    )
  limit 500;
$$;

revoke all on function public.board_images_garbage(int) from public, anon;
grant execute on function public.board_images_garbage(int) to authenticated;

-- чтобы проверка «ссылается ли доска» не перебирала всю таблицу
create index if not exists board_objects_img_src_idx
  on public.board_objects ((data->>'src')) where (data->>'src') like 'img:%';
create index if not exists board_objects_img_sol_idx
  on public.board_objects ((data->'sol'->>'src')) where (data->'sol'->>'src') like 'img:%';
