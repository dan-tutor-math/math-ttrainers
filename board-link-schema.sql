-- ============================================================
-- Крупные задания с вынесенной панели тренажёров на доску (промпт
-- «сопряжение панели», этап 3, board-link.js).
--
-- Как применить: Supabase → SQL Editor → вставить файл целиком → Run.
-- Повторный запуск безопасен. ЗАПУСКАЕТ ВЛАДЕЛЕЦ ПРОЕКТА РУКАМИ: из
-- песочницы Claude Supabase недоступен, файл там не проверялся.
-- Пока файл не запущен, сопряжение с телефоном работает, но задания
-- крупнее ~200 КБ даже после сжатия в WebP до доски не дойдут (панель будет
-- показывать «ждут отправки»).
--
-- Зачем. Задание с телефона идёт на доску через Realtime, а у него лимит
-- одного сообщения — 256 КБ на плане Free. Снимок задания с разбором и
-- вёрсткой бывает больше даже в WebP. Тогда панель кладёт задание файлом
-- сюда, а по каналу шлёт только его имя; доска скачивает файл.
--
-- Почему права такие (анонимная роль anon может класть, читать, удалять):
-- панель на телефоне и доска заходят в Supabase без входа (анонимным
-- клиентом, как совместная сессия), отдельного пользователя у них нет.
-- Защищает другое:
--   - файл зашифрован (AES-GCM) ключом устройства — общим секретом панели
--     и доски, выведенным по ECDH при подключении. Чужой, даже скачав
--     файл, задания не прочитает;
--   - имя файла случайное (32 знака), только в папке v1/;
--   - только application/octet-stream и не больше 6 МБ.
-- Бакет закрытый (public = false): открытой ссылки на файл нет.
--
-- Чистка по таймауту. Панель удаляет свой файл, как только доска ответила
-- (ack / placed / cancelled). Брошенные (панель закрыли раньше) доска
-- удаляет сама: при запуске и раз в полчаса — всё в v1/ старше часа
-- (sweepBlobs в board-link.js). Через Storage API, а не SQL-запросом к
-- storage.objects: Supabase предупреждает, что удаление строки SQL-ом
-- оставляет сам файл лежать в хранилище.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('board-link', 'board-link', false, 6291456, array['application/octet-stream'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists board_link_insert on storage.objects;
create policy board_link_insert on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'board-link' and (storage.foldername(name))[1] = 'v1');

drop policy if exists board_link_select on storage.objects;
create policy board_link_select on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'board-link' and (storage.foldername(name))[1] = 'v1');

drop policy if exists board_link_delete on storage.objects;
create policy board_link_delete on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'board-link' and (storage.foldername(name))[1] = 'v1');
