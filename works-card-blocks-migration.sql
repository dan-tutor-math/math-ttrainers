-- Миграция (задача 63): work_save_answer принимает ответы на блоки type:'card'.
-- Раньше блок искался только среди 'task' и 'video' — на карточку сервер
-- отвечал task_not_found. Выполнить в Supabase SQL Editor один раз.
-- Проверка: select public.work_save_answer(gen_random_uuid(), gen_random_uuid(), '{}'::jsonb)
-- должна вернуть attempt_not_found (не ошибку синтаксиса и не права).
-- Права (revoke/grant) у функции уже выставлены: create or replace их не трогает,
-- но на всякий случай подтверждаем ниже.

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
  bt text;
begin
  select x.id, x.finished_at, v.blocks, w.closed
    into a
    from public.work_attempts x
    join public.work_variants v on v.id = x.variant_id
    join public.works w on w.id = x.work_id
   where x.id = p_attempt and x.secret = p_secret
   for update of x;
  if not found then raise exception 'attempt_not_found'; end if;
  if p_answer is null or jsonb_typeof(p_answer) <> 'object' then raise exception 'bad_answer'; end if;

  tid := p_answer->>'task_id';
  -- ответ только на блок, который есть в варианте этого захода: иначе
  -- через функцию можно было бы набить захода сколько угодно строк.
  -- Блок — задание ('task'), карточка ФИПИ ('card', задача 63: то же задание,
  -- только без снимка) или видео ('video', «видео в работах»): у видео
  -- в той же строке хранится, сколько ученик посмотрел
  select coalesce(e->>'type', 'task') into bt
    from jsonb_array_elements(a.blocks) e
   where e->>'id' = tid and coalesce(e->>'type', 'task') in ('task', 'card', 'video')
   limit 1;
  if tid is null or bt is null then raise exception 'task_not_found'; end if;

  -- после «Завершить» ответы не меняются: иначе в контрольной можно было бы
  -- увидеть итог и переписать неверное. Видео — не ответ: досмотреть разбор
  -- после сдачи можно, и учитель это увидит
  if a.finished_at is not null and bt <> 'video' then raise exception 'attempt_finished'; end if;
  if a.closed then raise exception 'work_closed'; end if;

  st := coalesce(p_answer->>'status', 'pending');
  if st not in ('pending', 'ok', 'bad', 'skipped') then raise exception 'bad_answer'; end if;
  -- у видео только «открывал» (pending) и «досмотрел» (ok)
  if bt = 'video' and st not in ('pending', 'ok') then raise exception 'bad_answer'; end if;
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
    -- у видео «досмотрел» не откатывается, а value ({ w: секунд посмотрено,
    -- d: длина отрывка }) берётся с большим w: ролик пересматривают с
    -- другого устройства или со старой вкладки, где посмотрено меньше
    status = case when bt = 'video' and r.status = 'ok' then 'ok' else excluded.status end,
    value = case when bt = 'video'
                  and (case when jsonb_typeof(r.value->'w') = 'number' then (r.value->>'w')::numeric else 0 end)
                    > (case when jsonb_typeof(excluded.value->'w') = 'number' then (excluded.value->>'w')::numeric else 0 end)
                 then r.value else excluded.value end,
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

revoke all on function public.work_save_answer(uuid, uuid, jsonb, bigint) from public;
grant execute on function public.work_save_answer(uuid, uuid, jsonb, bigint) to anon, authenticated;
