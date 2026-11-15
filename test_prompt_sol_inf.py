"""ОГЭ информатика: у каждого задания ФИПИ настоящий разбор, а не строка с ключом.
Запуск: ~/.venvs/trainers/bin/python test_prompt_sol_inf.py. Realtime — заглушка.

Проверяет:
A  у всех заданий №1–10 в банке: шагов не меньше двух, есть «Идея», заглушки
   «Ответ, принятый открытым банком ФИПИ» нет; последний шаг заканчивается ключом задания;
   шаги совпадают с fipi-pilot/sol/inf-oge/<номер>.json (если папка рядом есть)
B  «Тренировка» → «Показать решение и ответ»: видны «Идея», все шаги и строка ответа,
   в шагах нет сырого TeX и видимых тегов; «Обучение» — шаги открываются по одному
C  после верного ответа разбор открыт целиком; 375 px — без горизонтальной прокрутки
D  ошибок JS нет"""
import html
import json
import re
from pathlib import Path

from playwright.sync_api import sync_playwright
import test_prompt54_trainer_sync_and_cards as t54
import test_prompt_oge_phys_inf as base

HERE = Path(__file__).resolve().parent
SOL = HERE.parent / 'fipi-pilot' / 'sol' / 'inf-oge'
BASE = base.BASE
fails = []


def check(ok, msg):
    print(('  ok  ' if ok else '  FAIL ') + msg, flush=True)
    if not ok:
        fails.append(msg)


def norm(s):
    # ключ сравниваем как на странице: без тегов, пробелов и регистра
    return re.sub(r'\s+', '', html.unescape(re.sub(r'<[^>]+>', '', s))).lower()


def main():
    with t54.local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        errors = []
        ctx, page = base.fresh(browser, errors)

        print('A: разбор у каждого задания', flush=True)
        page.goto(f'{BASE}/inf_oge.html?n=1')
        base.settle(page)
        data = page.evaluate('''async () => { const out = {};
          for (let n = 1; n <= 10; n++) { await new Promise(r => ensureFipi(n, r));
            out[n] = protos(n).map(p => ({id: p.id, steps: p.steps || [], hint: p.hint || '', value: p.fields[0].value})); }
          return out; }''')
        picks = {}
        for n in range(1, 11):
            ps = data[str(n)]
            stub = [p['id'] for p in ps if any('принятый открытым банком' in s for s in p['steps'])]
            short = [p['id'] for p in ps if len(p['steps']) < 2 or not p['hint'].strip()]
            key = []
            for p in ps:
                m = re.findall(r'<b>(.*?)</b>', p['steps'][-1]) if p['steps'] else []
                if not m or norm(m[-1]) != norm(p['value'].replace('_', ' ')):
                    key.append(p['id'])
            check(ps and not stub and not short and not key,
                  f'№{n}: {len(ps)} заданий — заглушек {len(stub)}, без шагов или идеи {len(short)}, последний шаг не с ключом {len(key)} {(stub + short + key)[:3]}')
            if SOL.exists():
                src = json.loads((SOL / f'{n}.json').read_text(encoding='utf-8'))
                diff = [p['id'] for p in ps if src.get(p['id'], {}).get('steps') != p['steps']]
                check(not diff, f'№{n}: шаги в банке совпадают с sol/inf-oge/{n}.json ({diff[:3]})')
            # для экранных проверок — самое длинное и самое короткое задание номера
            by = sorted(ps, key=lambda p: sum(map(len, p['steps'])))
            picks[n] = [by[-1], by[0]]

        print('B: показ на странице', flush=True)
        for n in range(1, 11):
            p = picks[n][0]
            ctx.close()
            ctx, page = base.fresh(browser, errors)
            base.open_proto(page, 'inf_oge', n, p['id'])
            page.evaluate("switchMode('practice')")
            check(page.locator('#showSolutionBtn').is_visible(), f'№{n} {p["id"]}: кнопка «Показать решение и ответ» видна')
            page.click('#showSolutionBtn')
            page.wait_for_timeout(250)
            st = page.evaluate('''() => { const vis = e => !!e && e.getBoundingClientRect().height > 0;
              const steps = [...document.querySelectorAll('#solSteps .sol-step')];
              return {total: steps.length, shown: steps.filter(vis).length,
                      hint: vis(document.getElementById('solHint')) ? document.getElementById('solHint').innerText : '',
                      text: steps.map(s => s.querySelector('.body').innerText).join('\\n'),
                      ans: [...document.querySelectorAll('.sol-answer, #solAnswer')].filter(vis).map(e => e.innerText).join(' '),
                      wide: steps.some(s => s.querySelector('.body').scrollWidth > s.querySelector('.body').clientWidth + 1)}; }''')
            check(st['total'] == len(p['steps']) and st['shown'] == st['total'], f'№{n}: видны все шаги ({st["shown"]} из {len(p["steps"])})')
            check(st['hint'].startswith('Идея') and len(st['hint']) > 12, f'№{n}: строка «Идея» видна')
            check(not re.search(r'<\w+>|&lt;|&gt;|&amp;|\$|\\\\[a-z]+', st['text']), f'№{n}: в шагах нет видимых тегов, сущностей и сырого TeX')
            check(norm(p['value'].replace('_', ' ')) in norm(st['ans']), f'№{n}: строка ответа показывает ключ «{p["value"]}»')
            check(not st['wide'], f'№{n}: самый длинный разбор не требует прокрутки вбок на 1440 px')

        n, p = 6, picks[6][0]
        ctx.close()
        ctx, page = base.fresh(browser, errors)
        base.open_proto(page, 'inf_oge', n, p['id'])
        page.evaluate("switchMode('learn')")
        page.wait_for_timeout(150)
        vis = "() => [...document.querySelectorAll('#solSteps .sol-step')].filter(e => e.getBoundingClientRect().height > 0).length"
        one = page.evaluate(vis)
        page.click('#nextStepBtn')
        page.wait_for_timeout(150)
        check(one == 1 and page.evaluate(vis) == 2, f'«Обучение» №{n}: шаги открываются по одному ({one} → {page.evaluate(vis)})')

        print('C: после ответа и телефон', flush=True)
        n, p = 10, picks[10][1]
        ctx.close()
        ctx, page = base.fresh(browser, errors)
        base.open_proto(page, 'inf_oge', n, p['id'])
        page.fill('#answerArea input.answer-input', p['value'])
        page.click('#answerArea .check-btn')
        page.wait_for_timeout(250)
        check(page.evaluate('S.correct') and page.evaluate(vis) == len(p['steps']), f'№{n}: после верного ответа разбор открыт целиком')
        for n in (2, 5, 8, 10):
            p = picks[n][0]
            ctx.close()
            ctx, page = base.fresh(browser, errors, width=375)
            base.open_proto(page, 'inf_oge', n, p['id'])
            page.evaluate("switchMode('practice')")
            page.click('#showSolutionBtn')
            page.wait_for_timeout(250)
            w = page.evaluate('[document.documentElement.scrollWidth, innerWidth]')
            check(w[0] <= w[1], f'№{n} 375 px: с открытым разбором нет горизонтальной прокрутки страницы ({w})')
        ctx.close()

        print('D: ошибки', flush=True)
        check(not errors, f'ошибок JS нет ({errors[:3]})')
        browser.close()
    print('Готово.' if not fails else 'ПРОВАЛЕНО: %d' % len(fails))
    raise SystemExit(1 if fails else 0)


if __name__ == '__main__':
    main()
