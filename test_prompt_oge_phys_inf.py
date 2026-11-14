"""ОГЭ физика и информатика из банка ФИПИ: числа заданий, ключи, рисунки, ответы, каталог.
Запуск: ~/.venvs/trainers/bin/python test_prompt_oge_phys_inf.py. Realtime — заглушка.

Проверяет:
A  на каждой странице все номера, число заданий = принятым ФИПИ ключам verify.json по num27,
   каждый ключ проходит собственную проверку страницы, рисунки из условий лежат на диске
B  выбор 1 из 4 — нажатием на вариант (data-bd-opt), верный ответ засчитан
C  числовой ответ с запятой, последовательность цифр, «любой порядок» у двух утверждений
D  предметы на главной и в меню номеров; ошибок JS нет; 375 px — без горизонтальной прокрутки"""
import json
from pathlib import Path
import re

from playwright.sync_api import sync_playwright
import test_prompt54_trainer_sync_and_cards as t54

HERE = Path(__file__).resolve().parent
PILOT = HERE.parent / 'fipi-pilot'
BASE = f'http://127.0.0.1:{t54.PORT}'
SUBJ = {
    'phys_oge': ('full_oge_phys', range(1, 17)),
    'inf_oge': ('full_oge_inf', range(1, 11)),
}
fails = []


def check(ok, msg):
    print(('  ok  ' if ok else '  FAIL ') + msg, flush=True)
    if not ok:
        fails.append(msg)


def fresh(browser, errors, width=1440):
    ctx = browser.new_context(viewport={'width': width, 'height': 1000})
    page = t54.new_page(ctx, errors)
    page.route('https://**/*', lambda r: r.abort())
    return ctx, page


def settle(page):
    page.wait_for_function('() => !!window.__examNav && !__fipiBusy()')


def expected(folder, nums):
    tasks = json.loads((PILOT / folder / 'tasks.json').read_text())
    ver = json.loads((PILOT / folder / 'verify.json').read_text())
    return {n: sum(1 for t in tasks if t.get('num27') == n and isinstance(ver.get(t['id'], {}).get('ok'), str)) for n in nums}


def open_proto(page, slug, n, pid):
    # прошлое задание помнится в sessionStorage (память номера), страница вернулась бы к нему
    page.evaluate('() => { try { sessionStorage.clear(); } catch (e) {} }')
    page.goto(f'{BASE}/{slug}.html?n={n}&t={pid}')
    settle(page)
    try:
        page.wait_for_function('id=>S.pid===id', arg=pid, timeout=8000)
    except Exception:
        raise SystemExit('не открылось %s №%s %s: %s' % (slug, n, pid, page.evaluate('({pid:S.pid,n:S.n,screen:S.screen,url:location.href})')))
    page.wait_for_timeout(150)


def main():
    global_ctx = None
    with t54.local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        errors = []
        ctx, page = fresh(browser, errors)

        print('A: номера, ключи, рисунки', flush=True)
        samples = {}
        for slug, (folder, nums) in SUBJ.items():
            page.goto(f'{BASE}/{slug}.html?n=1')
            settle(page)
            want = expected(folder, nums)
            data = page.evaluate('''async nums => { const out = {};
              for (const n of nums) { await new Promise(r=>ensureFipi(n,r));
                out[n] = protos(n).map(p=>{ const f=p.fields[0];
                  const ok = checkField(f, f.value, {yn:{[f.id]: f.value}}) === true;
                  return {id:p.id, type:f.type, seq:!!f.seq, any:!!f.anyOrder, value:f.value, ok,
                          imgs:[...p.text.matchAll(/src="([^"]+)"/g)].map(m=>m[1])}; }); }
              return out; }''', list(nums))
            got = {int(k): len(v) for k, v in data.items()}
            check(got == want, f'{slug}: заданий по номерам = принятым ключам ФИПИ ({sum(got.values())})')
            bad = [p['id'] for v in data.values() for p in v if not p['ok']]
            check(not bad, f'{slug}: каждый ключ проходит проверку страницы (не прошли: {bad[:5]})')
            missing = [s for v in data.values() for p in v for s in p['imgs'] if not (HERE / s).exists()]
            check(not missing, f'{slug}: все рисунки условий на месте (нет: {missing[:3]})')
            for n, v in data.items():
                for p in v:
                    kind = 'yesno' if p['type'] == 'yesno' else 'any' if p['any'] else 'seq' if p['seq'] else 'num' if re.fullmatch(r'-?[\d,.]+', p['value']) else 'word'
                    samples.setdefault((slug, kind), (int(n), p))

        print('B: выбор нажатием на вариант', flush=True)
        n, p = samples[('phys_oge', 'yesno')]
        open_proto(page, 'phys_oge', n, p['id'])
        btns = page.locator('#questionText .soc-opts > div.soc-opt.opt-btn[role=button][data-bd-opt]')
        check(btns.count() >= 3, f'физика №{n}: варианты — кнопки ({btns.count()})')
        before = page.evaluate('[totalSolved,totalErrors]')
        page.click(f'#questionText .soc-opts > .soc-opt[data-val="{p["value"]}"]')
        page.wait_for_timeout(200)
        check(page.evaluate('S.answered && S.correct') and page.evaluate('totalSolved') == before[0] + 1, 'верный вариант засчитан')

        print('C: числа, последовательности, любой порядок', flush=True)
        def answer(slug, kind, text_fn):
            nonlocal ctx, page
            n, p = samples[(slug, kind)]
            ctx.close()
            ctx, page = fresh(browser, errors)   # чистый браузер: страница помнит прошлое задание
            open_proto(page, slug, n, p['id'])
            page.fill('#answerArea input.answer-input', text_fn(p['value']))
            page.click('#answerArea .check-btn')
            page.wait_for_timeout(200)
            return n, p, page.evaluate('S.answered && S.correct')
        n, p, ok = answer('phys_oge', 'num', lambda v: v.replace('.', ','))
        check(ok, f'физика №{n}: число «{p["value"]}» засчитано')
        n, p, ok = answer('phys_oge', 'seq', lambda v: v)
        check(ok, f'физика №{n}: последовательность «{p["value"]}» засчитана')
        n, p, ok = answer('phys_oge', 'any', lambda v: v[::-1])
        check(ok, f'физика №{n}: два утверждения в обратном порядке «{p["value"][::-1]}» засчитаны')
        n, p, ok = answer('inf_oge', 'word', lambda v: v.lower())
        check(ok, f'информатика №{n}: слово «{p["value"].lower()}» без учёта регистра засчитано')
        n, p, ok = answer('inf_oge', 'num', lambda v: v)
        check(ok, f'информатика №{n}: число «{p["value"]}» засчитано')
        n, p, ok = answer('inf_oge', 'seq', lambda v: v)
        check(ok, f'информатика №{n}: последовательность «{p["value"]}» засчитана')
        # исполнитель: «запишите любой алгоритм» — верна и другая найденная программа
        ex = page.evaluate("""async () => { await new Promise(r=>ensureFipi(5,r));
            const p = protos(5).find(p=>(p.fields[0].alts||[]).length); return p && {id:p.id, alt:p.fields[0].alts[0]}; }""")
        if ex:
            ctx.close()
            ctx, page = fresh(browser, errors)
            open_proto(page, 'inf_oge', 5, ex['id'])
            page.fill('#answerArea input.answer-input', ex['alt'])
            page.click('#answerArea .check-btn')
            page.wait_for_timeout(200)
            check(page.evaluate('S.correct'), f'информатика №5: другой верный алгоритм {ex["alt"]} засчитан')

        print('D: главная, меню, телефон', flush=True)
        for sid, title, cnt in (('phys', 'Физика', 16), ('inf', 'Информатика', 10)):
            page.goto(f'{BASE}/index.html?subject={sid}')
            page.wait_for_timeout(400)
            check(page.evaluate("document.documentElement.dataset.subject") == sid, f'главная ?subject={sid} — цвет предмета')
            ex = page.evaluate("id => MathhCatalog.exams.filter(e=>e.subject===id).map(e=>e.groups.flatMap(g=>g.items).length)", sid)
            check(ex == [cnt], f'{title}: в каталоге ОГЭ {cnt} номеров ({ex})')
            check(page.locator(f'.subj-btn[data-id="{sid}"]').count() == 1, f'{title}: кнопка предмета на главной')
        for slug, nmax in (('phys_oge', 16), ('inf_oge', 10)):
            page.goto(f'{BASE}/{slug}.html?n=2')
            settle(page)
            items = page.evaluate("() => (window.__examNav && window.__examNav.positions ? window.__examNav.positions().length : null)")
            check(page.evaluate("document.documentElement.dataset.examSubject") == slug.split('_')[0], f'{slug}: меню номеров в цвете предмета')
        ctx.close()
        ctx, page = fresh(browser, errors, width=375)
        for slug in SUBJ:
            n, p = samples[(slug, 'num')]
            ctx.close()
            ctx, page = fresh(browser, errors, width=375)
            open_proto(page, slug, n, p['id'])
            w = page.evaluate('[document.documentElement.scrollWidth, innerWidth]')
            check(w[0] <= w[1], f'{slug} 375 px: без горизонтальной прокрутки ({w})')
        ctx.close()
        check(not errors, f'ошибок JS нет ({errors[:3]})')
        browser.close()
    print('Готово.' if not fails else 'ПРОВАЛЕНО: %d' % len(fails))
    raise SystemExit(1 if fails else 0)


if __name__ == '__main__':
    main()
