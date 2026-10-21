"""
Корзина досок на сервере — boards-trash-schema.sql.

Без браузера, как test_prompt15_works_schema.py: поднимает настоящий
Postgres во временной папке, имитирует то, что даёт Supabase (роли anon и
authenticated, auth.uid(), раздача прав по умолчанию на всё новое в
public), заводит таблицы досок так, как они устроены в базе (boards,
board_objects, board_access, invites — внешние ключи БЕЗ каскада, под RLS;
журнал board_objects_deleted с триггером), применяет файл и проверяет.

Проверяет:
  A. файл применяется, повторный запуск ничего не ломает;
  B. boards_trash помечает только мою доску, чужую не трогает, повторный
     вызов время не сдвигает; boards_restore возвращает;
  C. boards_purge_trash стирает только МОЁ и только старше 5 дней;
  D. boards_delete_now: моя доска — строка, объекты, доступы, приглашения
     и журнал удалённого стёрты целиком (несмотря на ключи без каскада);
     чужая — убран только мой доступ, сама доска и её объекты целы;
     несуществующий id пропускается без ошибки;
  E. служебную board_purge_internal не позвать ни анониму, ни вошедшему;
     анониму не позвать ни одну функцию корзины.

Запуск: python3 test_prompt_boards_trash_sql.py (нужен установленный
Postgres: initdb/pg_ctl/psql; в песочнице Claude он есть).
"""
import glob
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SCHEMA = os.path.join(HERE, 'boards-trash-schema.sql')

ME = '11111111-1111-4111-8111-111111111111'
OTHER = '22222222-2222-4222-8222-222222222222'
B_MINE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
B_FOREIGN = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
B_OLD = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
B_FRESH = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
B_OTHER_OLD = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'

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
    sys.exit('Не найден Postgres (initdb/pg_ctl) — тест корзины без него не запустить')


BIN = find_bin()
AS_PG = ['runuser', '-u', 'postgres', '--'] if os.geteuid() == 0 else []


class PG:
    """Временный кластер на unix-сокете, без TCP — не мешает ничему вокруг."""

    def __init__(self):
        self.dir = tempfile.mkdtemp(prefix='trash_pg_')
        os.chmod(self.dir, 0o777)
        self.data = os.path.join(self.dir, 'data')
        if AS_PG:
            subprocess.run(['chown', 'postgres', self.dir], check=True)
        subprocess.run(AS_PG + [os.path.join(BIN, 'initdb'), '-D', self.data, '-U', 'tsuper',
                                '-A', 'trust', '-E', 'UTF8', '--locale=C.UTF-8'],
                       check=True, stdout=subprocess.DEVNULL)
        subprocess.run(AS_PG + [os.path.join(BIN, 'pg_ctl'), '-D', self.data, '-w', '-l',
                                os.path.join(self.dir, 'log'),
                                '-o', f"-k {self.dir} -c listen_addresses='' -p 54331", 'start'],
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
            AS_PG + [os.path.join(BIN, 'psql'), '-h', self.dir, '-p', '54331', '-U', 'tsuper',
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


# То, что в Supabase есть «из коробки», и таблицы досок, как они заведены в
# базе: внешние ключи без каскада (поэтому функция и ищет их сама), RLS —
# владелец и те, кому дали доступ
SUPABASE_STUB = f"""
create role anon nologin;
create role authenticated nologin;
create schema auth;
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;

create table public.boards (id uuid primary key default gen_random_uuid(), owner uuid not null,
  title text, created_at timestamptz default now());
create table public.board_objects (board_id uuid not null references public.boards(id), obj_id text not null,
  data jsonb, updated_by uuid, primary key (board_id, obj_id));
create table public.board_access (board_id uuid not null references public.boards(id), user_id uuid not null,
  role text, primary key (board_id, user_id));
create table public.invites (id serial primary key, board_id uuid references public.boards(id));
alter table public.boards enable row level security;
alter table public.board_objects enable row level security;
alter table public.board_access enable row level security;
create policy boards_sel on public.boards for select using (owner = auth.uid()
  or exists (select 1 from public.board_access a where a.board_id = id and a.user_id = auth.uid()));
create policy access_sel on public.board_access for select using (user_id = auth.uid());

create table public.board_objects_deleted (id bigserial primary key, board_id text not null, obj_id text not null,
  data jsonb, deleted_at timestamptz not null default now(), deleted_by uuid);
create function public.board_objects_log_delete() returns trigger language plpgsql security definer
  set search_path = public as $$
begin
  insert into public.board_objects_deleted (board_id, obj_id, data, deleted_by)
  values (old.board_id::text, old.obj_id::text, old.data, auth.uid());
  return old;
end $$;
create trigger board_objects_log_delete after delete on public.board_objects
  for each row execute function public.board_objects_log_delete();
"""

SEED = f"""
insert into public.boards (id, owner, title) values
  ('{B_MINE}', '{ME}', 'моя'),
  ('{B_FOREIGN}', '{OTHER}', 'чужая'),
  ('{B_OLD}', '{ME}', 'моя старая в корзине'),
  ('{B_FRESH}', '{ME}', 'моя свежая в корзине'),
  ('{B_OTHER_OLD}', '{OTHER}', 'чужая старая в корзине');
insert into public.board_objects (board_id, obj_id, data) values
  ('{B_MINE}', 'o1', '{{}}'), ('{B_MINE}', 'o2', '{{}}'),
  ('{B_FOREIGN}', 'o1', '{{}}'), ('{B_OLD}', 'o1', '{{}}'), ('{B_OTHER_OLD}', 'o1', '{{}}');
insert into public.board_access (board_id, user_id, role) values
  ('{B_MINE}', '{OTHER}', 'editor'), ('{B_FOREIGN}', '{ME}', 'editor');
insert into public.invites (board_id) values ('{B_MINE}');
"""


def main():
    with open(SCHEMA, encoding='utf-8') as f:
        schema = f.read()
    pg = PG()
    try:
        pg.ok(SUPABASE_STUB)

        print('A. применение файла')
        code, _, err = pg.run(schema)
        check(code == 0, 'boards-trash-schema.sql применяется' + ('' if code == 0 else f': {err}'))
        if code != 0:
            return
        code, _, err = pg.run(schema)
        check(code == 0, 'повторный запуск безопасен' + ('' if code == 0 else f': {err}'))
        pg.ok(SEED)
        pg.ok(f"update public.boards set trashed_at = now() - interval '6 days' where id in ('{B_OLD}', '{B_OTHER_OLD}');"
              f"update public.boards set trashed_at = now() - interval '1 day' where id = '{B_FRESH}';")

        print('B. в корзину и обратно')
        n = pg.ok(f"select public.boards_trash(array['{B_MINE}', '{B_FOREIGN}'])", 'authenticated', ME)
        check(n == '1', f'boards_trash пометил только мою ({n})')
        t1 = pg.ok(f"select trashed_at from public.boards where id = '{B_MINE}'")
        check(bool(t1), 'у моей стоит trashed_at')
        check(pg.ok(f"select trashed_at is null from public.boards where id = '{B_FOREIGN}'") == 't', 'чужая не тронута')
        pg.ok(f"select public.boards_trash(array['{B_MINE}'])", 'authenticated', ME)
        check(pg.ok(f"select trashed_at from public.boards where id = '{B_MINE}'") == t1, 'повторный вызов время не сдвигает')
        n = pg.ok(f"select public.boards_restore(array['{B_MINE}', '{B_FOREIGN}'])", 'authenticated', ME)
        check(n == '1' and pg.ok(f"select trashed_at is null from public.boards where id = '{B_MINE}'") == 't',
              'boards_restore вернул мою')

        print('C. уборка просроченной корзины')
        n = pg.ok("select public.boards_purge_trash()", 'authenticated', ME)
        check(n == '1', f'стёрта одна — моя старше 5 дней ({n})')
        left = pg.ok("select string_agg(title, ',' order by title) from public.boards")
        check('моя старая в корзине' not in left, 'моей старой нет')
        check('моя свежая в корзине' in left, 'свежая (1 день) на месте')
        check('чужая старая в корзине' in left, 'чужую просроченную не трогаем — её уберёт владелец')
        check(pg.ok(f"select count(*) from public.board_objects where board_id = '{B_OLD}'") == '0', 'объекты старой стёрты')

        print('D. удалить навсегда')
        n = pg.ok(f"select public.boards_delete_now(array['{B_FOREIGN}'])", 'authenticated', ME)
        check(n == '0', 'чужая доска не стирается')
        check(pg.ok(f"select count(*) from public.board_access where board_id = '{B_FOREIGN}' and user_id = '{ME}'") == '0',
              'у чужой убран мой доступ')
        check(pg.ok(f"select count(*) from public.boards where id = '{B_FOREIGN}'") == '1'
              and pg.ok(f"select count(*) from public.board_objects where board_id = '{B_FOREIGN}'") == '1',
              'сама чужая доска и её объекты целы')
        n = pg.ok(f"select public.boards_delete_now(array['{B_MINE}', '99999999-9999-4999-8999-999999999999'])",
                  'authenticated', ME)
        check(n == '1', f'моя стёрта, несуществующая пропущена ({n})')
        counts = pg.ok(f"select (select count(*) from public.boards where id = '{B_MINE}') || ',' ||"
                       f" (select count(*) from public.board_objects where board_id = '{B_MINE}') || ',' ||"
                       f" (select count(*) from public.board_access where board_id = '{B_MINE}') || ',' ||"
                       f" (select count(*) from public.invites where board_id = '{B_MINE}') || ',' ||"
                       f" (select count(*) from public.board_objects_deleted where board_id = '{B_MINE}')")
        check(counts == '0,0,0,0,0', f'строка, объекты, доступы, приглашения, журнал — всё стёрто ({counts})')
        n = pg.ok(f"select public.boards_delete_now(array['{B_OTHER_OLD}'])", 'authenticated', OTHER)
        check(n == '1', 'владелец чужой старой стирает её сам')

        print('E. права')
        err = pg.fails("select public.board_purge_internal('x')", 'authenticated', ME)
        check(err is not None and 'permission denied' in err, 'служебную функцию не позвать вошедшему')
        err = pg.fails("select public.board_purge_internal('x')", 'anon')
        check(err is not None and 'permission denied' in err, 'и анониму')
        for fn in ("boards_trash(array['x'])", "boards_restore(array['x'])",
                   "boards_delete_now(array['x'])", "boards_purge_trash()"):
            err = pg.fails(f"select public.{fn}", 'anon')
            check(err is not None and 'permission denied' in err, f'аноним не зовёт {fn.split("(")[0]}')
    finally:
        pg.stop()


if __name__ == '__main__':
    main()
    print()
    if FAILS:
        print(f'ИТОГ: провалено {len(FAILS)}')
        sys.exit(1)
    print('ИТОГ: всё прошло')
