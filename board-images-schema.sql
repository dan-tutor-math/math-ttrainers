-- ============================================================
-- Картинки досок — файлами в хранилище Supabase (промпт №89, переезд
-- досок на сервер, шаг 1). Сайт сам заливает каждую картинку доски сюда
-- и оставляет в доске короткую ссылку (image-store.js).
--
-- Как применить: Supabase → SQL Editor → вставить файл целиком → Run.
-- Повторный запуск безопасен. Пока файл не запущен, сайт работает как
-- раньше: картинки остаются внутри досок.
--
-- Бакет публичный: файл открывается по ссылке без входа — так ученик в
-- совместной сессии видит картинки учителя. Имя файла —
-- <id пользователя>/<sha-256 содержимого>, угадать его нельзя. Заливать
-- и удалять можно только в свою папку (<id пользователя>/…).
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('board-images', 'board-images', true, 15728640,
        array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists board_images_insert on storage.objects;
create policy board_images_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'board-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- чтение своих файлов через API (сама картинка по публичной ссылке
-- отдаётся и без этого правила; оно нужно, чтобы повторная заливка той же
-- картинки получала понятный ответ «уже есть»)
drop policy if exists board_images_select on storage.objects;
create policy board_images_select on storage.objects
  for select to authenticated
  using (bucket_id = 'board-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists board_images_delete on storage.objects;
create policy board_images_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'board-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
