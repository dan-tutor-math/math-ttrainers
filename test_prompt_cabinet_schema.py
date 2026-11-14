"""
Кабинет преподавателя, задача А3 (claude-notes/cabinet-plan.md): база
cabinet-schema.sql — ученики, память заданий, настройки, расписание.

Браузера тут нет, поэтому тест не на playwright (как
test_prompt15_works_schema.py): поднимает настоящий Postgres во временной
папке, имитирует в нём то, что даёт Supabase (роли anon и authenticated,
auth.uid(), auth.users, раздача прав по умолчанию на всё новое в public),
применяет файл и проверяет права под разными ролями.

Проверяет:
  A. файл применяется, повторный запуск ничего не ломает и не теряет;
     RLS на всех 11 таблицах;
  B. преподаватель видит и правит только своё, на чужое имя не создать;
  C. к чужому не прицепиться: журнал, участник занятия, член группы, слот
     шаблона на чужого ученика / занятие / группу / шаблон — отказ;
  D. аноним не читает и не пишет ни одну таблицу; триггерную функцию
     никто не зовёт;
  E. журнал памяти: добавление, повтор из очереди не создаёт дубль, правка
     запрещена, удаление (сброс памяти) — только своё; проверка ключа и
     события;
  F. каскады: удалили занятие — в журнале ссылка обнулилась; удалили
     ученика — ушли его журнал, участие и членство, занятие осталось;
     удалили группу — у занятия и слота ссылка обнулилась;
  G. шаблоны: активный только один, день недели 1–7, слот уходит с
     шаблоном;
  H. участники: статусы, ученик ИЛИ гость, ученик в занятии один раз;
  I. внешние id (синхронизация): уникальны у владельца, у разных — нет;
  J. настройки: строка на преподавателя, только объект, updated_at
     обновляется сам;
  K. ext_sync: потолок 5 МБ, чужое не видно.

Запуск: python3 test_prompt_cabinet_schema.py. Нужен Postgres
(initdb/pg_ctl/psql в PATH или в PGBIN). На маке — пакет pgserver в venv
на python3.12, его pgserver/pginstall/bin — в PGBIN (memory/grabli/cloud.md).
"""
import glob
import os
import re
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SCHEMA = os.path.join(HERE, 'cabinet-schema.sql')

T1 = '11111111-1111-4111-8111-111111111111'   # преподаватель
T2 = '22222222-2222-4222-8222-222222222222'   # другой преподаватель

TABLES = ['students', 'student_task_log', 'teacher_settings', 'student_groups', 'student_group_members',
          'week_templates', 'template_slots', 'template_slot_students', 'lessons', 'lesson_students', 'ext_sync']

FAILS = []


def check(cond, msg):
    print(('  ok  ' if cond else '  FAIL ') + msg)
    if not cond:
        FAILS.append(msg)


def find_bin():
    env = os.environ.get('PGBIN')
    if env and os.path.exists(os.path.join(env, 'initdb')):
        return env
    p = shutil.which('initdb')
    if p:
        return os.path.dirname(p)
    cands = sorted(glob.glob('/usr/lib/postgresql/*/bin'))
    if cands:
        return cands[-1]
    sys.exit('Не найден Postgres (initdb/pg_ctl) — задай PGBIN')


BIN = find_bin()
AS_PG = ['runuser', '-u', 'postgres', '--'] if os.geteuid() == 0 else []
PORT = '54331'


class PG:
    """Временный кластер на unix-сокете, без TCP — не мешает ничему вокруг."""

    def __init__(self):
        # короткий путь: у unix-сокета потолок ~100 знаков
        self.dir = tempfile.mkdtemp(prefix='cab_pg_', dir='/tmp')
        os.chmod(self.dir, 0o777)
        self.data = os.path.join(self.dir, 'data')
        if AS_PG:
            subprocess.run(['chown', 'postgres', self.dir], check=True)
        subprocess.run(AS_PG + [os.path.join(BIN, 'initdb'), '-D', self.data, '-U', 'tsuper',
                                '-A', 'trust', '-E', 'UTF8', '--locale=C'],
                       check=True, stdout=subprocess.DEVNULL)
        subprocess.run(AS_PG + [os.path.join(BIN, 'pg_ctl'), '-D', self.data, '-w', '-l',
                                os.path.join(self.dir, 'log'),
                                '-o', f"-k {self.dir} -c listen_addresses='' -p {PORT}", 'start'],
                       check=True, stdout=subprocess.DEVNULL)

    def stop(self):
        subprocess.run(AS_PG + [os.path.join(BIN, 'pg_ctl'), '-D', self.data, '-m', 'immediate', 'stop'],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        shutil.rmtree(self.dir, ignore_errors=True)

    def run(self, sql, role=None, uid=None):
        pre = ''
        if uid:
            pre += f"set request.jwt.claim.sub = '{uid}';\n"
        if role:
            pre += f'set role {role};\n'
        p = subprocess.run(
            AS_PG + [os.path.join(BIN, 'psql'), '-h', self.dir, '-p', PORT, '-U', 'tsuper',
                     '-d', 'postgres', '-X', '-q', '-t', '-A', '-v', 'ON_ERROR_STOP=1'],
            input=pre + sql, capture_output=True, text=True)
        return p.returncode, p.stdout.strip(), p.stderr.strip()

    def ok(self, sql, role=None, uid=None):
        code, out, err = self.run(sql, role, uid)
        if code != 0:
            raise AssertionError(f'запрос упал: {err}\n{sql}')
        return out

    def fails(self, sql, role=None, uid=None):
        code, out, err = self.run(sql, role, uid)
        return err if code != 0 else None


SUPABASE_STUB = f"""
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
grant usage on schema public to anon, authenticated;
-- как в Supabase: всё новое в public сразу доступно anon и authenticated
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
insert into auth.users values ('{T1}'), ('{T2}');
"""


def main():
    with open(SCHEMA, encoding='utf-8') as f:
        schema = f.read()
    pg = PG()
    A = 'authenticated'
    try:
        pg.ok(SUPABASE_STUB)

        print('A. применение файла')
        code, _, err = pg.run(schema)
        check(code == 0, 'cabinet-schema.sql применяется без ошибок' + ('' if code == 0 else f': {err}'))
        if code != 0:
            return
        names = "','".join(TABLES)
        rls = pg.ok(f"select count(*) from pg_class where relname in ('{names}') and relrowsecurity "
                    "and relnamespace = 'public'::regnamespace")
        check(rls == str(len(TABLES)), f'RLS на всех {len(TABLES)} таблицах ({rls})')

        print('B. только своё')
        s1 = pg.ok("insert into students (name, grade, exam, boards) values ('Маша', '9', 'oge', '{b1,b2}') returning id", A, T1)
        check(bool(re.fullmatch(r'[0-9a-f-]{36}', s1)), 'преподаватель завёл ученика')
        check(pg.ok(f"select owner from students where id = '{s1}'") == T1, 'владелец проставился сам')
        check(pg.ok('select count(*) from students', A, T2) == '0', 'другой преподаватель не видит чужого ученика')
        check(pg.ok(f"update students set name = 'X' where id = '{s1}' returning id", A, T2) == '',
              'и не правит его')
        check(pg.ok(f"delete from students where id = '{s1}' returning id", A, T2) == '', 'и не удаляет')
        err = pg.fails(f"insert into students (owner, name) values ('{T1}', 'Подкидыш')", A, T2)
        check(err is not None and 'row-level security' in err, 'на чужое имя ученика не создать')
        err = pg.fails(f"update students set owner = '{T2}' where id = '{s1}'", A, T1)
        check(err is not None and 'row-level security' in err, 'своего ученика не отдать другому')
        check(pg.fails("insert into students (name) values ('   ')", A, T1) is not None, 'пустое имя — отказ')
        check(pg.fails("insert into students (name, account_email) values ('Петя', 'Petya@Mail.ru')", A, T1) is not None,
              'почта не строчными — отказ')

        # общие данные для дальнейшего
        s2 = pg.ok("insert into students (name, ext_name) values ('Петя', 'Петя') returning id", A, T1)
        g1 = pg.ok("insert into student_groups (name, format) values ('Маша и Петя', 'pair') returning id", A, T1)
        pg.ok(f"insert into student_group_members (group_id, student_id, pos) values ('{g1}', '{s1}', 0), ('{g1}', '{s2}', 1)", A, T1)
        tp = pg.ok("insert into week_templates (name, is_active) values ('Осень', true) returning id", A, T1)
        sl = pg.ok(f"insert into template_slots (template_id, weekday, start_min, dur_min, format, group_id) "
                   f"values ('{tp}', 2, 900, 90, 'pair', '{g1}') returning id", A, T1)
        pg.ok(f"insert into template_slot_students (slot_id, student_id) values ('{sl}', '{s1}'), ('{sl}', '{s2}')", A, T1)
        les = pg.ok(f"insert into lessons (day, start_min, dur_min, format, group_id, from_slot, board_id) "
                    f"values ('2026-11-17', 900, 90, 'pair', '{g1}', '{sl}', 'brd-1') returning id", A, T1)
        pg.ok(f"insert into lesson_students (lesson_id, student_id) values ('{les}', '{s1}'), ('{les}', '{s2}')", A, T1)
        check(pg.ok(f"select count(*) from lesson_students where lesson_id = '{les}'", A, T1) == '2',
              'занятие пары с двумя участниками из шаблона и группы')
        for t in TABLES:
            if t in ('student_task_log', 'teacher_settings', 'ext_sync'):
                continue
            check(pg.ok(f'select count(*) from {t}', A, T2) == '0', f'{t}: другой не видит')

        print('C. к чужому не прицепиться')
        s3 = pg.ok("insert into students (name) values ('Чужой ученик T2') returning id", A, T2)
        err = pg.fails(f"insert into student_task_log (student_id, task_key, event, source) "
                       f"values ('{s1}', 'fipi:oge:123', 'ok', 'trainer')", A, T2)
        check(err is not None, 'журнал на чужого ученика — отказ')
        err = pg.fails(f"insert into lesson_students (lesson_id, student_id) values ('{les}', '{s3}')", A, T2)
        check(err is not None, 'своего ученика в чужое занятие — отказ')
        l2 = pg.ok("insert into lessons (day) values ('2026-11-18') returning id", A, T2)
        err = pg.fails(f"insert into lesson_students (lesson_id, student_id) values ('{l2}', '{s1}')", A, T2)
        check(err is not None, 'чужого ученика в своё занятие — отказ')
        err = pg.fails(f"insert into lessons (day, group_id) values ('2026-11-18', '{g1}')", A, T2)
        check(err is not None and 'row-level security' in err, 'занятие с чужой группой — отказ')
        err = pg.fails(f"insert into lessons (day, from_slot) values ('2026-11-18', '{sl}')", A, T2)
        check(err is not None and 'row-level security' in err, 'занятие из чужого слота — отказ')
        err = pg.fails(f"insert into student_task_log (student_id, task_key, event, source, lesson_id) "
                       f"values ('{s3}', 'gen:oge9:lin', 'ok', 'board', '{les}')", A, T2)
        check(err is not None and 'row-level security' in err, 'журнал с чужим занятием — отказ')
        err = pg.fails(f"insert into student_group_members (group_id, student_id) values ('{g1}', '{s3}')", A, T2)
        check(err is not None, 'в чужую группу — отказ')
        err = pg.fails(f"insert into template_slots (template_id, weekday) values ('{tp}', 1)", A, T2)
        check(err is not None, 'слот в чужой шаблон — отказ')
        tp2 = pg.ok("insert into week_templates (name) values ('Мой') returning id", A, T2)
        err = pg.fails(f"insert into template_slots (template_id, weekday, group_id) values ('{tp2}', 1, '{g1}')", A, T2)
        check(err is not None and 'row-level security' in err, 'слот с чужой группой — отказ')
        err = pg.fails(f"update lessons set group_id = '{g1}' where id = '{l2}'", A, T2)
        check(err is not None and 'row-level security' in err, 'и правкой чужую группу не подставить')

        print('D. аноним')
        for t in TABLES:
            err = pg.fails(f'select count(*) from {t}', 'anon')
            check(err is not None and 'permission denied' in err, f'anon не читает {t}')
        err = pg.fails("insert into students (owner, name) values (null, 'x')", 'anon')
        check(err is not None and 'permission denied' in err, 'anon не пишет')
        priv = pg.ok("select has_function_privilege('anon', 'public.cabinet_touch()', 'execute')::text || "
                     "has_function_privilege('authenticated', 'public.cabinet_touch()', 'execute')::text")
        check(priv == 'falsefalse', 'служебную функцию не зовёт никто')

        print('E. журнал памяти')
        lid = 'aaaaaaaa-0000-4000-8000-000000000001'
        ins = (f"insert into student_task_log (id, student_id, task_key, event, source, src_ref, lesson_id, at) "
               f"values ('{lid}', '{s1}', 'fipi:oge:6A1B2C', 'ok', 'board', 'brd-1', '{les}', '2026-11-17 15:20+03') "
               f"on conflict (id) do nothing returning id")
        check(pg.ok(ins, A, T1) == lid, 'событие записалось')
        check(pg.ok(ins, A, T1) == '', 'повтор из очереди молча пропущен')
        check(pg.ok(f"select count(*) from student_task_log where id = '{lid}'", A, T1) == '1', 'дубля нет')
        pg.ok(f"insert into student_task_log (student_id, task_key, event, source) values "
              f"('{s1}', 'gen:oge9:lin', 'hw', 'work'), ('{s1}', 'gen:oge9:lin', 'bad', 'trainer'), "
              f"('{s2}', 'fipi:oge:6A1B2C', 'board', 'board')", A, T1)
        err = pg.fails(f"update student_task_log set event = 'bad' where id = '{lid}'", A, T1)
        check(err is not None and 'permission denied' in err, 'событие не переписать')
        check(pg.fails(f"insert into student_task_log (student_id, task_key, event, source) "
                       f"values ('{s1}', 'fipi:oge:1', 'seen', 'trainer')", A, T1) is not None, 'неизвестное событие — отказ')
        check(pg.fails(f"insert into student_task_log (student_id, task_key, event, source) "
                       f"values ('{s1}', 'просто текст', 'ok', 'trainer')", A, T1) is not None, 'ключ без приставки — отказ')
        check(pg.fails(f"insert into student_task_log (student_id, task_key, event, source) "
                       f"values ('{s1}', 'gen:x:y', 'ok', 'phone')", A, T1) is not None, 'неизвестный источник — отказ')
        check(pg.ok(f"delete from student_task_log where student_id = '{s1}' returning id", A, T2) == '',
              'чужой журнал не стереть')
        n = pg.ok(f"with d as (delete from student_task_log where student_id = '{s1}' and task_key = 'gen:oge9:lin' "
                  f"returning 1) select count(*) from d", A, T1)
        check(n == '2', 'сброс памяти: «забыть вид» стёр 2 события')
        check(pg.ok('select count(*) from student_task_log', A, T1) == '2', 'остальное на месте')
        idx = pg.ok("select indexdef from pg_indexes where indexname = 'student_task_log_key'")
        check('(student_id, task_key)' in idx, 'индекс (ученик, ключ)')

        print('F. каскады')
        pg.ok(f"delete from lessons where id = '{les}'", A, T1)
        check(pg.ok(f"select lesson_id is null from student_task_log where id = '{lid}'", A, T1) == 't',
              'удалили занятие — событие осталось, ссылка обнулилась')
        check(pg.ok('select count(*) from lesson_students', A, T1) == '0', 'участники ушли с занятием')
        les = pg.ok(f"insert into lessons (day, start_min, group_id, from_slot) values ('2026-11-24', 900, '{g1}', '{sl}') returning id", A, T1)
        pg.ok(f"insert into lesson_students (lesson_id, student_id) values ('{les}', '{s1}'), ('{les}', '{s2}')", A, T1)
        pg.ok(f"delete from students where id = '{s2}'", A, T1)
        check(pg.ok(f"select count(*) from student_task_log where student_id = '{s2}'") == '0', 'удалили ученика — его журнал ушёл')
        check(pg.ok(f"select count(*) from lesson_students where lesson_id = '{les}'", A, T1) == '1', 'и участие, занятие осталось')
        check(pg.ok(f"select count(*) from student_group_members where group_id = '{g1}'", A, T1) == '1', 'и членство в группе')
        check(pg.ok(f"select count(*) from template_slot_students where slot_id = '{sl}'", A, T1) == '1', 'и место в шаблоне')
        pg.ok(f"delete from student_groups where id = '{g1}'", A, T1)
        check(pg.ok(f"select (group_id is null)::text from lessons where id = '{les}'", A, T1) == 'true',
              'удалили группу — у занятия ссылка обнулилась')
        check(pg.ok(f"select (group_id is null)::text from template_slots where id = '{sl}'", A, T1) == 'true', 'и у слота')

        print('G. шаблоны')
        err = pg.fails("insert into week_templates (name, is_active) values ('Весна', true)", A, T1)
        check(err is not None and 'duplicate' in err, 'второй активный шаблон — отказ')
        pg.ok("insert into week_templates (name, is_active) values ('Активный T2', true)", A, T2)
        check(True, 'у другого преподавателя свой активный')
        check(pg.fails(f"insert into template_slots (template_id, weekday) values ('{tp}', 8)", A, T1) is not None,
              'день недели 8 — отказ')
        check(pg.fails(f"insert into template_slots (template_id, weekday, format) values ('{tp}', 1, 'duo')", A, T1) is not None,
              'неизвестный формат — отказ')
        pg.ok(f"delete from week_templates where id = '{tp}'", A, T1)
        check(pg.ok('select count(*) from template_slots', A, T1) == '0', 'слоты ушли с шаблоном')
        check(pg.ok(f"select (from_slot is null)::text from lessons where id = '{les}'", A, T1) == 'true',
              'занятие из шаблона осталось, ссылка на слот обнулилась')

        print('H. участники занятия')
        pg.ok(f"insert into lesson_students (lesson_id, guest_name, status) values ('{les}', 'Оля (пробное)', 'done')", A, T1)
        check(True, 'гость по имени')
        check(pg.fails(f"insert into lesson_students (lesson_id, student_id, guest_name) values ('{les}', '{s1}', 'Маша')", A, T1)
              is not None, 'и ученик, и гость сразу — отказ')
        check(pg.fails(f"insert into lesson_students (lesson_id) values ('{les}')", A, T1) is not None, 'ни ученика, ни гостя — отказ')
        check(pg.fails(f"insert into lesson_students (lesson_id, student_id) values ('{les}', '{s1}')", A, T1) is not None,
              'ученик в занятии дважды — отказ')
        for st in ('done', 'skip', 'move', 'plan'):
            pg.ok(f"update lesson_students set status = '{st}' where lesson_id = '{les}' and student_id = '{s1}'", A, T1)
        check(True, 'статусы plan / done / skip / move')
        check(pg.fails(f"update lesson_students set status = 'cancel' where lesson_id = '{les}'", A, T1) is not None,
              'неизвестный статус — отказ')
        ev = pg.ok("insert into lessons (day, start_min, dur_min, is_event, title) values ('2026-11-24', 600, 45, true, 'Врач') returning id", A, T1)
        check(bool(ev), 'событие «не урок»')
        check(pg.fails("insert into lessons (day, dur_min) values ('2026-11-24', 0)", A, T1) is not None, 'длительность 0 — отказ')
        check(pg.fails("insert into lessons (day, start_min) values ('2026-11-24', 1440)", A, T1) is not None, 'начало 24:00 — отказ')

        print('I. внешние id')
        pg.ok("insert into lessons (day, ext_id) values ('2026-11-25', 'row-7')", A, T1)
        err = pg.fails("insert into lessons (day, ext_id) values ('2026-11-26', 'row-7')", A, T1)
        check(err is not None and 'duplicate' in err, 'одинаковый ext_id у одного владельца — отказ')
        pg.ok("insert into lessons (day, ext_id) values ('2026-11-26', 'row-7')", A, T2)
        check(True, 'у другого преподавателя тот же ext_id можно')
        pg.ok("insert into students (name, ext_name) values ('Петя', 'Петя')", A, T1)
        err = pg.fails("insert into students (name, ext_name) values ('Петя Б.', 'Петя')", A, T1)
        check(err is not None and 'duplicate' in err, 'ext_name ученика уникален у владельца')

        print('J. настройки')
        pg.ok("""insert into teacher_settings (settings) values ('{"sessionBind":"tab","lessonMin":60}')""", A, T1)
        err = pg.fails("insert into teacher_settings (settings) values ('{}')", A, T1)
        check(err is not None and 'duplicate' in err, 'строка настроек одна на преподавателя')
        pg.ok("""insert into teacher_settings (settings) values ('{"lessonMin":90}')
                 on conflict (owner) do update set settings = excluded.settings""", A, T1)
        check(pg.ok("select settings->>'lessonMin' from teacher_settings", A, T1) == '90', 'upsert меняет настройки')
        check(pg.ok('select count(*) from teacher_settings', A, T2) == '0', 'чужие настройки не видно')
        check(pg.fails("update teacher_settings set settings = '[1]'", A, T1) is not None, 'настройки — только объект')
        pg.ok("update teacher_settings set updated_at = '2020-01-01'")
        pg.ok("""update teacher_settings set settings = settings || '{"marks":"hide"}'""", A, T1)
        check(pg.ok("select (updated_at > '2021-01-01')::text from teacher_settings", A, T1) == 'true',
              'updated_at обновился сам')

        print('K. синхронизация')
        pg.ok("""insert into ext_sync (rev, base, synced_at) values (45, '{"schedule":{}}', now())""", A, T1)
        check(pg.ok('select rev from ext_sync', A, T1) == '45', 'состояние старого приложения сохранено')
        check(pg.ok('select count(*) from ext_sync', A, T2) == '0', 'чужое не видно')
        err = pg.fails("update ext_sync set base = jsonb_build_object('x', repeat('a', 5000001))", A, T1)
        check(err is not None, 'больше 5 МБ — отказ')

        print('A2. повторный запуск')
        before = pg.ok('select ' + ' || \',\' || '.join(f'(select count(*) from {t})' for t in TABLES))
        code, _, err = pg.run(schema)
        check(code == 0, 'повторный запуск без ошибок' + ('' if code == 0 else f': {err}'))
        after = pg.ok('select ' + ' || \',\' || '.join(f'(select count(*) from {t})' for t in TABLES))
        check(before == after, f'данные на месте ({after})')
        err = pg.fails('select count(*) from students', 'anon')
        check(err is not None and 'permission denied' in err, 'права после повтора те же')
        err = pg.fails(f"update student_task_log set event = 'bad' where id = '{lid}'", A, T1)
        check(err is not None and 'permission denied' in err, 'журнал после повтора всё так же не правится')
    finally:
        pg.stop()

    print()
    if FAILS:
        print(f'ПРОВАЛЕНО: {len(FAILS)}')
        sys.exit(1)
    print('Все проверки прошли')


if __name__ == '__main__':
    main()
