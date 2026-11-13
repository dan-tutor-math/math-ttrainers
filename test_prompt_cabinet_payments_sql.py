"""
Кабинет преподавателя, задача В4(а): база cabinet-payments.sql — ставки по
датам, оплаты (абонемент / разовая), поля участника занятия для денег и
пропусков (оплачивается / причина / по вине преподавателя / отработка /
флаги), способ оплаты ученика.

Как test_prompt_cabinet_schema.py: настоящий Postgres во временной папке,
имитация Supabase (роли, auth.uid(), раздача прав по умолчанию), сначала
cabinet-schema.sql, потом этот файл — дважды.

Проверяет:
  A. файл применяется поверх схемы и повторно; RLS на новых таблицах;
  B. только своё: чужой не видит и не правит, на чужое имя не создать;
  C. к чужому не прицепиться: ставка и оплата чужому ученику, «оплатил» за
     чужое участие, отработка чужого пропуска — отказ;
  D. аноним ничего не читает и не пишет;
  E. правила оплат: абонемент без числа занятий / сгорания — отказ; по сроку
     без конца — отказ; разовая с числом занятий — отказ; ученик ИЛИ гость;
     одна оплата на участие; конец не раньше начала; ext_id уникален у
     владельца;
  F. ставки: одна на день у ученика, цена не меньше нуля;
  G. участник: bill только charge/free, флагов не больше 10, отработка
     ссылается на пропуск; по умолчанию by_teacher/makeup — false, flags — {};
  H. каскады: удалили занятие — оплата «за занятие» осталась деньгами
     (lesson_student_id = null), у отработки ссылка обнулилась, owner цел;
     удалили ученика — ушли его ставки и оплаты;
  I. pay_mode у ученика: pack / lesson / null;
  J. updated_at у оплаты обновляется сам.

Запуск: python3 test_prompt_cabinet_payments_sql.py. Нужен Postgres 15+
(PGBIN, как у test_prompt_cabinet_schema.py).
"""
import os
import sys

import test_prompt_cabinet_schema as S
from test_prompt_cabinet_schema import PG, SUPABASE_STUB, T1, T2, check, FAILS

HERE = os.path.dirname(os.path.abspath(__file__))
PAY = os.path.join(HERE, 'cabinet-payments.sql')


def main():
    schema = open(S.SCHEMA, encoding='utf-8').read()
    pay = open(PAY, encoding='utf-8').read()
    pg = PG()
    A = 'authenticated'
    try:
        pg.ok(SUPABASE_STUB)
        pg.ok(schema)

        print('A. применение файла')
        code, _, err = pg.run(pay)
        check(code == 0, 'cabinet-payments.sql применяется поверх схемы' + ('' if code == 0 else f': {err}'))
        if code != 0:
            return
        rls = pg.ok("select count(*) from pg_class where relname in ('student_rates','payments') and relrowsecurity "
                    "and relnamespace = 'public'::regnamespace")
        check(rls == '2', 'RLS на student_rates и payments')

        s1 = pg.ok("insert into students (name) values ('Маша') returning id", A, T1)
        s2 = pg.ok("insert into students (name) values ('Петя') returning id", A, T1)
        les = pg.ok("insert into lessons (day, start_min) values ('2026-11-17', 900) returning id", A, T1)
        p1 = pg.ok(f"insert into lesson_students (lesson_id, student_id, status) values ('{les}', '{s1}', 'skip') returning id", A, T1)
        p2 = pg.ok(f"insert into lesson_students (lesson_id, student_id, status) values ('{les}', '{s2}', 'done') returning id", A, T1)
        pk = pg.ok(f"insert into payments (student_id, kind, amount, lessons, burn) values ('{s1}', 'pack', 16000, 8, 'count') returning id", A, T1)

        code, _, err = pg.run(pay)
        check(code == 0, 'повторный запуск без ошибок' + ('' if code == 0 else f': {err}'))
        check(pg.ok('select count(*) from payments', A, T1) == '1', 'повторный запуск данные не потерял')

        print('B. только своё')
        r1 = pg.ok(f"insert into student_rates (student_id, valid_from, price, group_price) values ('{s1}', '2026-09-01', 2000, 1500) returning id", A, T1)
        check(pg.ok(f"select owner from payments where id = '{pk}'") == T1, 'владелец оплаты проставился сам')
        for t in ('payments', 'student_rates'):
            check(pg.ok(f'select count(*) from {t}', A, T2) == '0', f'{t}: другой не видит')
        check(pg.ok(f"update payments set amount = 1 where id = '{pk}' returning id", A, T2) == '', 'чужую оплату не править')
        check(pg.ok(f"delete from student_rates where id = '{r1}' returning id", A, T2) == '', 'чужую ставку не удалить')
        err = pg.fails(f"insert into payments (owner, student_id, kind, amount) values ('{T1}', '{s1}', 'single', 100)", A, T2)
        check(err is not None and 'row-level security' in err, 'на чужое имя оплату не создать')

        print('C. к чужому не прицепиться')
        s3 = pg.ok("insert into students (name) values ('Ученик T2') returning id", A, T2)
        les3 = pg.ok("insert into lessons (day) values ('2026-11-18') returning id", A, T2)
        p3 = pg.ok(f"insert into lesson_students (lesson_id, student_id) values ('{les3}', '{s3}') returning id", A, T2)
        check(pg.fails(f"insert into student_rates (student_id, valid_from, price) values ('{s1}', '2026-01-01', 1)", A, T2) is not None,
              'ставка чужому ученику — отказ')
        check(pg.fails(f"insert into payments (student_id, kind, amount) values ('{s1}', 'single', 1)", A, T2) is not None,
              'оплата чужому ученику — отказ')
        check(pg.fails(f"insert into payments (student_id, kind, amount, lesson_student_id) values ('{s3}', 'single', 1, '{p1}')", A, T2) is not None,
              '«оплатил» за чужое участие — отказ')
        check(pg.fails(f"update lesson_students set makeup = true, makeup_for = '{p1}' where id = '{p3}'", A, T2) is not None,
              'отработка чужого пропуска — отказ')

        print('D. аноним')
        for t in ('payments', 'student_rates'):
            check(pg.fails(f'select * from {t}', 'anon') is not None, f'{t}: аноним не читает')
        check(pg.fails(f"insert into payments (student_id, kind, amount) values ('{s1}', 'single', 1)", 'anon') is not None,
              'аноним не пишет оплату')
        check(pg.fails(f"select bill from lesson_students", 'anon') is not None, 'аноним не читает участников')

        print('E. правила оплат')
        bad = {
            'абонемент без числа занятий': f"('{s1}', 'pack', 100, null, 'count', null, null)",
            'абонемент без способа сгорания': f"('{s1}', 'pack', 100, 8, null, null, null)",
            'по сроку без конца': f"('{s1}', 'pack', 100, 8, 'date', '2026-11-01', null)",
            'разовая с числом занятий': f"('{s1}', 'single', 100, 4, null, null, null)",
            'отрицательная сумма': f"('{s1}', 'single', -5, null, null, null, null)",
            'конец раньше начала': f"('{s1}', 'pack', 100, 8, 'date', '2026-11-10', '2026-11-01')",
            'неизвестный вид': f"('{s1}', 'gift', 100, null, null, null, null)",
        }
        for name, vals in bad.items():
            check(pg.fails(f"insert into payments (student_id, kind, amount, lessons, burn, start_on, end_on) values {vals}", A, T1) is not None,
                  f'{name} — отказ')
        pd = pg.ok(f"insert into payments (student_id, kind, amount, lessons, burn, start_on, end_on) values ('{s1}', 'pack', 8000, 4, 'date', '2026-11-01', '2026-11-30') returning id", A, T1)
        check(bool(pd), 'абонемент по сроку с концом — можно')
        check(pg.fails(f"insert into payments (kind, amount) values ('single', 100)", A, T1) is not None, 'ни ученика, ни гостя — отказ')
        check(pg.fails(f"insert into payments (student_id, guest_name, kind, amount) values ('{s1}', 'Гость', 'single', 100)", A, T1) is not None,
              'и ученик, и гость — отказ')
        check(bool(pg.ok("insert into payments (guest_name, kind, amount) values ('Гость Гошин', 'single', 500) returning id", A, T1)),
              'оплата гостя — можно')
        ps = pg.ok(f"insert into payments (student_id, kind, amount, lesson_student_id) values ('{s2}', 'single', 2000, '{p2}') returning id", A, T1)
        check(bool(ps), '«оплатил» за занятие — можно')
        check(pg.fails(f"insert into payments (student_id, kind, amount, lesson_student_id) values ('{s2}', 'single', 2000, '{p2}')", A, T1) is not None,
              'вторая оплата за то же участие — отказ')
        check(pg.fails(f"insert into payments (student_id, kind, amount, lessons, burn, lesson_student_id) values ('{s2}', 'pack', 1, 1, 'count', '{p1}')", A, T1) is not None,
              'абонемент «за занятие» — отказ')
        check(pg.fails(f"update payments set adjust = 2 where id = '{ps}'", A, T1) is not None, 'правка «прошло» у разовой — отказ')
        check(pg.ok(f"update payments set adjust = -1, note = 'вернули занятие' where id = '{pk}' returning adjust", A, T1) == '-1',
              'правка «прошло» у абонемента — можно')
        pg.ok(f"update payments set ext_id = 'old-1' where id = '{pk}'", A, T1)
        check(pg.fails(f"update payments set ext_id = 'old-1' where id = '{pd}'", A, T1) is not None, 'ext_id у владельца уникален')
        pg.ok(f"insert into payments (guest_name, kind, amount, ext_id) values ('Кто-то', 'single', 1, 'old-1')", A, T2)
        check(True, 'у другого преподавателя тот же ext_id — можно')

        print('F. ставки')
        check(pg.fails(f"insert into student_rates (student_id, valid_from, price) values ('{s1}', '2026-09-01', 2500)", A, T1) is not None,
              'вторая ставка с того же дня — отказ')
        check(pg.fails(f"insert into student_rates (student_id, valid_from, price) values ('{s1}', '2026-10-01', -1)", A, T1) is not None,
              'отрицательная цена — отказ')
        pg.ok(f"insert into student_rates (student_id, valid_from, price) values ('{s1}', '2026-11-10', 2500)", A, T1)
        cur = pg.ok(f"select price from student_rates where student_id = '{s1}' and valid_from <= '2026-11-12' order by valid_from desc limit 1", A, T1)
        check(cur == '2500.00', f'действует ставка с наибольшей датой не позже дня ({cur})')
        check(pg.ok(f"select group_price is null from student_rates where student_id = '{s1}' and valid_from = '2026-11-10'", A, T1) == 't',
              'групповая цена необязательна')

        print('G. участник занятия')
        dflt = pg.ok(f"select by_teacher, makeup, flags, bill is null, reason is null from lesson_students where id = '{p1}'", A, T1)
        check(dflt == 'f|f|{}|t|t', f'значения по умолчанию ({dflt})')
        check(pg.fails(f"update lesson_students set bill = 'maybe' where id = '{p1}'", A, T1) is not None, 'bill только charge/free')
        check(pg.ok(f"update lesson_students set bill = 'charge', reason = 'не пришёл', flags = '{{trial}}' where id = '{p1}' returning bill", A, T1) == 'charge',
              'прогул «оплачивается» с причиной и флагом')
        many = '{' + ','.join(f'f{i}' for i in range(11)) + '}'
        check(pg.fails(f"update lesson_students set flags = '{many}' where id = '{p1}'", A, T1) is not None, 'флагов больше 10 — отказ')
        les2 = pg.ok("insert into lessons (day, start_min) values ('2026-11-20', 900) returning id", A, T1)
        mk = pg.ok(f"insert into lesson_students (lesson_id, student_id, makeup, makeup_for) values ('{les2}', '{s1}', true, '{p1}') returning id", A, T1)
        check(bool(mk), 'отработка со ссылкой на пропуск')
        check(pg.fails(f"update lesson_students set makeup_for = '00000000-0000-4000-8000-000000000000' where id = '{mk}'", A, T1) is not None,
              'ссылка на несуществующий пропуск — отказ')
        check(pg.ok(f"update lesson_students set by_teacher = true where id = '{p2}' returning by_teacher", A, T1) == 't',
              'отмена по вине преподавателя ставится')

        print('H. каскады')
        pg.ok(f"delete from lessons where id = '{les}'", A, T1)
        row = pg.ok(f"select lesson_student_id is null, owner, amount from payments where id = '{ps}'", A, T1)
        check(row == f't|{T1}|2000.00', f'удалили занятие — оплата осталась деньгами ({row})')
        row = pg.ok(f"select makeup_for is null, makeup, owner from lesson_students where id = '{mk}'", A, T1)
        check(row == f't|t|{T1}', f'у отработки ссылка обнулилась, owner цел ({row})')
        pg.ok(f"delete from students where id = '{s1}'", A, T1)
        check(pg.ok(f"select count(*) from student_rates where student_id = '{s1}'") == '0', 'удалили ученика — ставки ушли')
        check(pg.ok(f"select count(*) from payments where student_id = '{s1}'") == '0', 'и оплаты ушли')

        print('I. способ оплаты ученика')
        check(pg.ok(f"update students set pay_mode = 'lesson' where id = '{s2}' returning pay_mode", A, T1) == 'lesson', 'pay_mode = lesson')
        check(pg.fails(f"update students set pay_mode = 'card' where id = '{s2}'", A, T1) is not None, 'чужое значение — отказ')
        check(pg.ok(f"update students set pay_mode = null where id = '{s2}' returning pay_mode is null", A, T1) == 't', 'null — решает страница')

        print('J. отметка правки')
        before = pg.ok(f"select updated_at from payments where id = '{ps}'")
        pg.ok("select pg_sleep(0.02)")
        pg.ok(f"update payments set note = 'наличными' where id = '{ps}'", A, T1)
        check(pg.ok(f"select updated_at from payments where id = '{ps}'") != before, 'updated_at обновился сам')
    finally:
        pg.stop()
    print('\nВсе проверки прошли' if not FAILS else f'\nПадений: {len(FAILS)}')
    sys.exit(1 if FAILS else 0)


if __name__ == '__main__':
    main()
