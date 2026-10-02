"""
Промпт №15 «работы», этап 0: база для работ по ссылке (домашние,
самостоятельные, контрольные) — works-schema.sql.

Браузера тут ещё нет, поэтому тест не на playwright: он поднимает
настоящий Postgres во временной папке, имитирует в нём то, что даёт
Supabase (роли anon и authenticated, схема auth с auth.uid() и
auth.users, раздача прав по умолчанию на всё новое в public — как в
Supabase), применяет works-schema.sql и проверяет права и функции под
разными ролями.

Проверяет:
  A. файл применяется, и повторный запуск ничего не ломает и не теряет;
     на всех четырёх таблицах включён RLS;
  B. учитель видит и правит только своё: чужую работу не видно, в чужую
     работу не вставить вариант, работу на чужое имя не создать;
  C. аноним (ученик по ссылке) не читает и не пишет ни одну таблицу и не
     зовёт служебную функцию кода;
  D. work_open по коду (строчные и пробелы тоже), неизвестный код — null;
     work_start: имя чистится от лишних пробелов, пустое и длиннее 60 —
     bad_name, дубли имён допустимы;
  E. work_save_answer: неверный секрет, задание не из варианта, неверный
     статус, слишком большой ответ — отказ; попытки, время и «смотрел
     подсказку / решение» только растут, ответ и статус — последние;
  F. work_resume отдаёт ответы, work_finish закрывает заход, после него
     сохранять нельзя, повторное завершение не сдвигает время;
  G. учитель видит заходы и ответы своих работ, чужие — нет; может удалить
     заход (ответы уходят следом), но не может писать заходы и ответы сам;
  H. закрытая работа: по ссылке только название, начать и сохранить нельзя;
  I. коды ссылок: 10 знаков из алфавита без 0/O/1/I/L, все разные;
  J. вошедший по email ученик (authenticated) решает чужую работу тем же
     путём, что аноним;
  K. потолок 1000 заходов на вариант;
  L. потолок размера заданий варианта (3 МБ);
  M. хранилище картинок заданий: бакет публичный, писать и удалять учитель
     может только в своей папке, аноним — ничего (этап 1).

Запуск: python3 test_prompt15_works_schema.py (нужен установленный
Postgres: initdb/pg_ctl/psql; в песочнице Claude он есть).
"""
import glob
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SCHEMA = os.path.join(HERE, 'works-schema.sql')

T1 = '11111111-1111-4111-8111-111111111111'   # учитель — автор работы
T2 = '22222222-2222-4222-8222-222222222222'   # другой учитель (или ученик с email)
ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

FAILS = []


def check(cond, msg):
    print(('  ok  ' if cond else '  FAIL ') + msg)
    if not cond:
        FAILS.append(msg)


def find_bin():
    for name in ('initdb', 'pg_ctl'):
        p = shutil.which(name)
        if p:
            return os.path.dirname(p)
    cands = sorted(glob.glob('/usr/lib/postgresql/*/bin'))
    if cands:
        return cands[-1]
    sys.exit('Не найден Postgres (initdb/pg_ctl) — тест базы работ без него не запустить')


BIN = find_bin()
AS_PG = ['runuser', '-u', 'postgres', '--'] if os.geteuid() == 0 else []


class PG:
    """Временный кластер на unix-сокете, без TCP — не мешает ничему вокруг."""

    def __init__(self):
        self.dir = tempfile.mkdtemp(prefix='works_pg_')
        os.chmod(self.dir, 0o777)
        self.data = os.path.join(self.dir, 'data')
        self.sock = self.dir
        if AS_PG:
            subprocess.run(['chown', 'postgres', self.dir], check=True)
        subprocess.run(AS_PG + [os.path.join(BIN, 'initdb'), '-D', self.data, '-U', 'tsuper',
                                '-A', 'trust', '-E', 'UTF8', '--locale=C.UTF-8'],
                       check=True, stdout=subprocess.DEVNULL)
        subprocess.run(AS_PG + [os.path.join(BIN, 'pg_ctl'), '-D', self.data, '-w', '-l',
                                os.path.join(self.dir, 'log'),
                                '-o', f"-k {self.sock} -c listen_addresses='' -p 54329", 'start'],
                       check=True, stdout=subprocess.DEVNULL)

    def stop(self):
        subprocess.run(AS_PG + [os.path.join(BIN, 'pg_ctl'), '-D', self.data, '-m', 'immediate', 'stop'],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        shutil.rmtree(self.dir, ignore_errors=True)

    def run(self, sql, role=None, uid=None):
        """Один сеанс psql. Возвращает (код, вывод, ошибки)."""
        pre = ''
        if uid:
            pre += f"set request.jwt.claim.sub = '{uid}';\n"
        if role:
            pre += f'set role {role};\n'
        p = subprocess.run(
            AS_PG + [os.path.join(BIN, 'psql'), '-h', self.sock, '-p', '54329', '-U', 'tsuper',
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


# То, что в Supabase есть «из коробки» и на что опирается works-schema.sql
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
-- как в Supabase: всё новое в public сразу доступно anon и authenticated,
-- защищает только RLS. Поэтому явные revoke в файле — проверяемая вещь
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
insert into auth.users values ('{T1}'), ('{T2}');
-- хранилище файлов Supabase — ровно то, на что опирается файл: бакеты,
-- объекты под RLS и storage.foldername (папки пути как массив)
create schema storage;
create table storage.buckets (id text primary key, name text not null, public boolean default false,
  file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id),
  name text not null, owner uuid default auth.uid(), unique (bucket_id, name));
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as
  $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
grant usage on schema storage to anon, authenticated;
grant all on storage.objects, storage.buckets to anon, authenticated;
grant execute on function storage.foldername(text) to anon, authenticated;
"""


def j(s):
    return json.loads(s) if s else None


def main():
    with open(SCHEMA, encoding='utf-8') as f:
        schema = f.read()
    pg = PG()
    try:
        pg.ok(SUPABASE_STUB)

        print('A. применение файла')
        code, _, err = pg.run(schema)
        check(code == 0, 'works-schema.sql применяется без ошибок' + ('' if code == 0 else f': {err}'))
        if code != 0:
            return
        rls = pg.ok("select string_agg(relname || '=' || relrowsecurity, ',' order by relname) from pg_class "
                    "where relname in ('works','work_variants','work_attempts','work_answers')")
        check(rls == 'work_answers=true,work_attempts=true,work_variants=true,works=true', f'RLS на всех таблицах ({rls})')

        print('B. учитель видит только своё')
        settings = json.dumps({'feedback': 'each', 'attempts': 2})
        wid = pg.ok(f"insert into works (kind, title, settings) values ('hw', 'Домашняя: НОК', '{settings}') returning id",
                    'authenticated', T1)
        check(bool(re.fullmatch(r'[0-9a-f-]{36}', wid)), 'учитель создал работу')
        owner = pg.ok(f"select owner from works where id = '{wid}'")
        check(owner == T1, 'владелец проставился сам (auth.uid())')
        blocks = json.dumps([
            {'id': 't1', 'type': 'task', 'mode': 'exam', 'gen': {'v': 1, 'tid': 'lcm', 'href': 'lcm.html', 'kind': 'state', 'snap': {'P': {'nums': [6, 8]}}}},
            {'id': 't2', 'type': 'task', 'mode': 'train', 'gen': {'v': 1, 'tid': 'ege_prof', 'href': 'ege_prof.html?n=7', 'kind': 'ege', 'n': 7, 'pid': '7.1'}},
        ], ensure_ascii=False)
        code1 = pg.ok(f"insert into work_variants (work_id, blocks) values ('{wid}', '{blocks}') returning code",
                      'authenticated', T1)
        check(bool(re.fullmatch(f'[{ALPHABET}]{{10}}', code1)), f'код ссылки сгенерировался ({code1})')
        n = pg.ok(f"update work_variants set num = 1 where code = '{code1}' returning num", 'authenticated', T1)
        check(n == '1', 'учитель правит свой вариант')
        check(pg.ok('select count(*) from works', 'authenticated', T2) == '0', 'другой учитель не видит чужую работу')
        check(pg.ok('select count(*) from work_variants', 'authenticated', T2) == '0', 'и чужие варианты')
        err = pg.fails(f"insert into work_variants (work_id, num) values ('{wid}', 2)", 'authenticated', T2)
        check(err is not None and 'row-level security' in err, 'в чужую работу вариант не вставить')
        upd = pg.ok(f"update works set title = 'взлом' where id = '{wid}' returning id", 'authenticated', T2)
        check(upd == '', 'чужую работу не переименовать')
        err = pg.fails(f"insert into works (owner, title) values ('{T1}', 'подкидыш')", 'authenticated', T2)
        check(err is not None and 'row-level security' in err, 'работу на чужое имя не создать')
        err = pg.fails(f"update works set owner = '{T2}' where id = '{wid}'", 'authenticated', T1)
        check(err is not None and 'row-level security' in err, 'свою работу не отдать другому (owner не меняется)')

        print('C. аноним в таблицы не ходит')
        for t in ('works', 'work_variants', 'work_attempts', 'work_answers'):
            err = pg.fails(f'select count(*) from {t}', 'anon')
            check(err is not None and 'permission denied' in err, f'anon не читает {t}')
        err = pg.fails("insert into works (title) values ('x')", 'anon')
        check(err is not None and 'permission denied' in err, 'anon не пишет works')
        err = pg.fails('select work_gen_code()', 'anon')
        check(err is not None and 'permission denied' in err, 'anon не зовёт work_gen_code')
        err = pg.fails(f"insert into work_attempts (work_id, variant_id, student_name) select work_id, id, 'x' from work_variants", 'authenticated', T1)
        check(err is not None and 'permission denied' in err, 'учитель не пишет заходы напрямую')

        print('D. открыть и начать по ссылке')
        o = j(pg.ok(f"select work_open('{code1}')", 'anon'))
        check(o and o['closed'] is False and o['work']['title'] == 'Домашняя: НОК', 'work_open отдаёт название')
        check(o and o['work']['settings'] == {'feedback': 'each', 'attempts': 2}, 'и настройки')
        check(o and [b['id'] for b in o['variant']['blocks']] == ['t1', 't2'], 'и задания варианта по порядку')
        check(o and 'owner' not in o['work'] and 'id' not in o['work'], 'без владельца и внутренних номеров')
        o2 = j(pg.ok(f"select work_open('  {code1.lower()} ')", 'anon'))
        check(o2 is not None and o2['variant']['code'] == code1, 'код строчными и с пробелами тоже открывается')
        check(pg.ok("select work_open('ZZZZZZZZZZ')", 'anon') == '', 'неизвестный код — null')
        for bad in ('', '   ', 'я' * 61):
            err = pg.fails(f"select work_start('{code1}', '{bad}')", 'anon')
            check(err is not None and 'bad_name' in err, f'имя «{bad[:5]}…» ({len(bad)} зн.) — bad_name')
        err = pg.fails("select work_start('ZZZZZZZZZZ', 'Маша')", 'anon')
        check(err is not None and 'work_not_found' in err, 'начать по неизвестному коду — work_not_found')
        s1 = j(pg.ok(f"select work_start('{code1}', '  Маша    Иванова ')", 'anon'))
        check(s1 and s1['name'] == 'Маша Иванова', 'имя чистится от лишних пробелов')
        s2 = j(pg.ok(f"select work_start('{code1}', 'Маша Иванова')", 'anon'))
        check(s2 and s2['attempt'] != s1['attempt'], 'дубль имени — отдельный заход')
        A1, K1 = s1['attempt'], s1['secret']

        print('E. сохранение ответа')
        def save(ans, att=None, sec=None, active='null', role='anon', uid=None):
            return f"select work_save_answer('{att or A1}', '{sec or K1}', '{json.dumps(ans, ensure_ascii=False)}'::jsonb, {active})"
        err = pg.fails(save({'task_id': 't1'}, sec='00000000-0000-4000-8000-000000000000'), 'anon')
        check(err is not None and 'attempt_not_found' in err, 'чужой секрет — attempt_not_found')
        err = pg.fails(save({'task_id': 't9'}), 'anon')
        check(err is not None and 'task_not_found' in err, 'задание не из варианта — task_not_found')
        err = pg.fails(save({'task_id': 't1', 'status': 'win'}), 'anon')
        check(err is not None and 'bad_answer' in err, 'неизвестный статус — bad_answer')
        err = pg.fails(save({'task_id': 't1', 'value': 'x' * 20001}), 'anon')
        check(err is not None and 'answer_too_big' in err, 'слишком большой ответ — answer_too_big')
        r = j(pg.ok(save({'task_id': 't1', 'status': 'pending', 'value': {'ans': '12'}, 'tries': 1,
                          'hint_used': True, 'time_ms': 5000}, active=7000), 'anon'))
        check(r == {'ok': True}, 'первая попытка сохранилась')
        pg.ok(save({'task_id': 't1', 'status': 'ok', 'value': {'ans': '24'}, 'tries': 0,
                    'hint_used': False, 'time_ms': 3000}, active=4000), 'anon')
        row = pg.ok(f"select status, value->>'ans', tries, hint_used, time_ms from work_answers where attempt_id = '{A1}' and task_id = 't1'")
        check(row == 'ok|24|1|t|5000', f'статус и ответ — последние, попытки/время/подсказка не убывают ({row})')
        act = pg.ok(f"select active_ms from work_attempts where id = '{A1}'")
        check(act == '7000', 'общее время в работе не убывает')
        pg.ok(save({'task_id': 't2', 'status': 'skipped'}), 'anon')

        print('F. продолжить и завершить')
        res = j(pg.ok(f"select work_resume('{A1}', '{K1}')", 'anon'))
        check(res and res['name'] == 'Маша Иванова' and res['code'] == code1 and res['finished_at'] is None,
              'work_resume: имя, код, не завершён')
        st = {a['task_id']: a['status'] for a in (res or {}).get('answers', [])}
        check(st == {'t1': 'ok', 't2': 'skipped'}, f'work_resume отдаёт ответы ({st})')
        err = pg.fails(f"select work_resume('{A1}', '{s2['secret']}')", 'anon')
        check(err is not None and 'attempt_not_found' in err, 'продолжить с чужим секретом нельзя')
        fin = j(pg.ok(f"select work_finish('{A1}', '{K1}', 9000)", 'anon'))
        check(fin and fin['finished_at'] is not None and fin['active_ms'] == 9000, 'work_finish закрыл заход и вернул итог')
        t_first = fin['finished_at']
        err = pg.fails(save({'task_id': 't2', 'status': 'ok'}), 'anon')
        check(err is not None and 'attempt_finished' in err, 'после завершения ответ не сохранить')
        fin2 = j(pg.ok(f"select work_finish('{A1}', '{K1}')", 'anon'))
        check(fin2['finished_at'] == t_first, 'повторное завершение не сдвигает время')

        print('G. результаты у учителя')
        check(pg.ok(f"select count(*) from work_attempts where work_id = '{wid}'", 'authenticated', T1) == '2',
              'учитель видит оба захода своей работы')
        check(pg.ok('select count(*) from work_answers', 'authenticated', T1) == '2', 'и ответы')
        check(pg.ok('select count(*) from work_attempts', 'authenticated', T2) == '0', 'чужой учитель заходов не видит')
        check(pg.ok('select count(*) from work_answers', 'authenticated', T2) == '0', 'и ответов')
        err = pg.fails(f"update work_answers set status = 'ok' where attempt_id = '{A1}'", 'authenticated', T1)
        check(err is not None and 'permission denied' in err, 'учитель не переписывает ответы ученика')
        dele = pg.ok(f"delete from work_attempts where id = '{s2['attempt']}' returning id", 'authenticated', T1)
        check(dele == s2['attempt'], 'учитель удаляет заход')
        none = pg.ok(f"delete from work_attempts where id = '{A1}' returning id", 'authenticated', T2)
        check(none == '', 'чужой учитель удалить заход не может')

        print('H. закрытая работа')
        s3 = j(pg.ok(f"select work_start('{code1}', 'Петя')", 'anon'))
        pg.ok(f"update works set closed = true where id = '{wid}'", 'authenticated', T1)
        oc = j(pg.ok(f"select work_open('{code1}')", 'anon'))
        check(oc and oc['closed'] is True and 'variant' not in oc and oc['work']['title'] == 'Домашняя: НОК',
              'закрытая: только название, без заданий')
        err = pg.fails(f"select work_start('{code1}', 'Вася')", 'anon')
        check(err is not None and 'work_closed' in err, 'закрытую не начать')
        err = pg.fails(save({'task_id': 't1', 'status': 'ok'}, att=s3['attempt'], sec=s3['secret']), 'anon')
        check(err is not None and 'work_closed' in err, 'в закрытой не сохранить ответ')
        pg.ok(f"update works set closed = false where id = '{wid}'", 'authenticated', T1)

        print('I. коды ссылок')
        pg.ok(f"insert into work_variants (work_id, num) select '{wid}', g from generate_series(2, 201) g",
              'authenticated', T1)
        codes = pg.ok(f"select code from work_variants where work_id = '{wid}'").split('\n')
        check(len(codes) == 201 and len(set(codes)) == 201, '201 вариант — 201 разный код')
        check(all(re.fullmatch(f'[{ALPHABET}]{{10}}', c) for c in codes), 'все коды из алфавита без 0/O/1/I/L')

        print('J. ученик, вошедший по email')
        s4 = j(pg.ok(f"select work_start('{code1}', 'Аня')", 'authenticated', T2))
        r = j(pg.ok(save({'task_id': 't1', 'status': 'bad', 'tries': 2}, att=s4['attempt'], sec=s4['secret']),
                    'authenticated', T2))
        check(r == {'ok': True}, 'authenticated решает чужую работу через функции')
        check(pg.ok('select count(*) from work_attempts', 'authenticated', T2) == '0',
              'но свои заходы в чужой работе напрямую не видит')

        print('K. потолок заходов')
        vid = pg.ok(f"select id from work_variants where code = '{code1}'")
        pg.ok(f"insert into work_attempts (work_id, variant_id, student_name) "
              f"select '{wid}', '{vid}', 'бот' || g from generate_series(1, 1000) g")
        err = pg.fails(f"select work_start('{code1}', 'Тысяча первый')", 'anon')
        check(err is not None and 'too_many_attempts' in err, 'на 1001-м заходе — too_many_attempts')

        print('L. потолок размера заданий')
        err = pg.fails(f"update work_variants set blocks = jsonb_build_array(repeat('x', 3000001)) where code = '{code1}'",
                       'authenticated', T1)
        check(err is not None and 'check constraint' in err, 'вариант больше 3 МБ не записать')

        print('M. картинки заданий (Storage)')
        b = pg.ok("select public || '|' || file_size_limit || '|' || array_to_string(allowed_mime_types, ',') from storage.buckets where id = 'work-images'")
        check(b == 'true|2097152|image/webp,image/png,image/jpeg', f'бакет work-images публичный, до 2 МБ, только картинки ({b})')
        out = pg.ok(f"insert into storage.objects (bucket_id, name) values ('work-images', '{T1}/abc.webp') returning name",
                    'authenticated', T1)
        check(out == f'{T1}/abc.webp', 'учитель кладёт картинку в свою папку')
        err = pg.fails(f"insert into storage.objects (bucket_id, name) values ('work-images', '{T2}/evil.webp')", 'authenticated', T1)
        check(err is not None and 'row-level security' in err, 'в чужую папку — нельзя')
        err = pg.fails(f"insert into storage.objects (bucket_id, name) values ('work-images', 'abc.webp')", 'authenticated', T1)
        check(err is not None and 'row-level security' in err, 'в корень бакета — нельзя')
        err = pg.fails(f"insert into storage.objects (bucket_id, name) values ('work-images', '{T1}/x.webp')", 'anon')
        check(err is not None and 'row-level security' in err, 'аноним не загружает')
        check(pg.ok("select count(*) from storage.objects", 'authenticated', T2) == '0', 'другой учитель чужих файлов не видит')
        gone = pg.ok(f"delete from storage.objects where name = '{T1}/abc.webp' returning name", 'authenticated', T2)
        check(gone == '', 'и не удаляет')
        gone = pg.ok(f"delete from storage.objects where name = '{T1}/abc.webp' returning name", 'authenticated', T1)
        check(gone == f'{T1}/abc.webp', 'свой файл учитель удаляет')

        print('A2. повторный запуск файла')
        before = pg.ok('select (select count(*) from works) || \'/\' || (select count(*) from work_variants) || \'/\' || '
                       '(select count(*) from work_attempts) || \'/\' || (select count(*) from work_answers)')
        code, _, err = pg.run(schema)
        check(code == 0, 'повторный запуск без ошибок' + ('' if code == 0 else f': {err}'))
        after = pg.ok('select (select count(*) from works) || \'/\' || (select count(*) from work_variants) || \'/\' || '
                      '(select count(*) from work_attempts) || \'/\' || (select count(*) from work_answers)')
        check(before == after, f'данные на месте ({after})')
        err = pg.fails('select count(*) from work_attempts', 'anon')
        check(err is not None and 'permission denied' in err, 'и права те же (anon в таблицы не пускают)')
        check(j(pg.ok(f"select work_open('{code1}')", 'anon')) is not None, 'а по ссылке открывается')
    finally:
        pg.stop()

    print()
    if FAILS:
        print(f'ПРОВАЛЕНО: {len(FAILS)}')
        for m in FAILS:
            print('  - ' + m)
        sys.exit(1)
    print('Все проверки пройдены')


if __name__ == '__main__':
    main()
