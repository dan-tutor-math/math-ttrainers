"""
Кабинет преподавателя, задача В4(б): база cabinet-stats.sql — ручной итог
дня (day_totals).

Как test_prompt_cabinet_payments_sql.py: настоящий Postgres во временной
папке, имитация Supabase, сначала cabinet-schema.sql и cabinet-payments.sql,
потом этот файл — дважды.

Проверяет:
  A. файл применяется поверх схемы и повторно, данные целы; RLS включён;
  B. только своё: другой преподаватель не видит, не правит, не удаляет и не
     создаёт на чужое имя; аноним не читает и не пишет;
  C. правила: один итог на день у преподавателя (у другого тот же день —
     можно), сумма не меньше нуля;
  D. updated_at обновляется сам.

Запуск: python3 test_prompt_cabinet_stats_sql.py. Нужен Postgres 15+
(PGBIN, как у test_prompt_cabinet_schema.py).
"""
import os
import sys

import test_prompt_cabinet_schema as S
from test_prompt_cabinet_schema import PG, SUPABASE_STUB, T1, T2, check, FAILS

HERE = os.path.dirname(os.path.abspath(__file__))
PAY = os.path.join(HERE, 'cabinet-payments.sql')
STATS = os.path.join(HERE, 'cabinet-stats.sql')


def main():
    schema = open(S.SCHEMA, encoding='utf-8').read()
    pay = open(PAY, encoding='utf-8').read()
    stats = open(STATS, encoding='utf-8').read()
    pg = PG()
    A = 'authenticated'
    try:
        pg.ok(SUPABASE_STUB)
        pg.ok(schema)
        pg.ok(pay)

        print('A. применение файла')
        code, _, err = pg.run(stats)
        check(code == 0, 'cabinet-stats.sql применяется поверх схемы' + ('' if code == 0 else f': {err}'))
        if code != 0:
            return
        check(pg.ok("select relrowsecurity from pg_class where relname = 'day_totals' and relnamespace = 'public'::regnamespace") == 't',
              'RLS на day_totals')
        d1 = pg.ok("insert into day_totals (day, amount) values ('2026-11-05', 3000) returning id", A, T1)
        code, _, err = pg.run(stats)
        check(code == 0, 'повторный запуск без ошибок' + ('' if code == 0 else f': {err}'))
        check(pg.ok('select count(*) from day_totals', A, T1) == '1', 'повторный запуск данные не потерял')
        check(pg.ok(f"select owner from day_totals where id = '{d1}'") == T1, 'владелец проставился сам')

        print('B. только своё')
        check(pg.ok('select count(*) from day_totals', A, T2) == '0', 'другой не видит')
        check(pg.ok(f"update day_totals set amount = 1 where id = '{d1}' returning id", A, T2) == '', 'чужой итог не править')
        check(pg.ok(f"delete from day_totals where id = '{d1}' returning id", A, T2) == '', 'чужой итог не удалить')
        err = pg.fails(f"insert into day_totals (owner, day, amount) values ('{T1}', '2026-11-06', 1)", A, T2)
        check(err is not None and 'row-level security' in err, 'на чужое имя не создать')
        check(pg.fails('select * from day_totals', 'anon') is not None, 'аноним не читает')
        check(pg.fails("insert into day_totals (day, amount) values ('2026-11-07', 1)", 'anon') is not None, 'аноним не пишет')

        print('C. правила')
        check(pg.fails("insert into day_totals (day, amount) values ('2026-11-05', 10)", A, T1) is not None, 'второй итог на тот же день — отказ')
        check(bool(pg.ok("insert into day_totals (day, amount) values ('2026-11-05', 10) returning id", A, T2)), 'у другого преподавателя тот же день — можно')
        check(pg.fails("insert into day_totals (day, amount) values ('2026-11-08', -1)", A, T1) is not None, 'отрицательная сумма — отказ')

        print('D. updated_at')
        before = pg.ok(f"select updated_at from day_totals where id = '{d1}'")
        pg.ok("select pg_sleep(0.02)")
        pg.ok(f"update day_totals set amount = 3500 where id = '{d1}'", A, T1)
        check(pg.ok(f"select updated_at from day_totals where id = '{d1}'") != before, 'updated_at обновился сам')
    finally:
        pg.stop()
    print('\nВсе проверки прошли' if not FAILS else f'\nПадений: {len(FAILS)}')
    sys.exit(1 if FAILS else 0)


if __name__ == '__main__':
    main()
