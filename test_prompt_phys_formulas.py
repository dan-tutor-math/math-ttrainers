"""ОГЭ физика: формулы ФИПИ в условиях не теряются при выгрузке (корень, дробь, степень, индекс, ядро).
Запуск: ~/.venvs/trainers/bin/python test_prompt_phys_formulas.py. Realtime — заглушка.

Раньше MathML вырезался, и «в √2 раза» превращалось в «в 2 раза», «Дж/(кг·°С)» — в «Дж кг⋅°С».

Проверяет:
A  у каждого задания, где в исходнике ФИПИ есть формула со структурой, в условии на сайте есть $…$;
   все формулы всех номеров собираются KaTeX без ошибок; в условиях нет остатков MathML
B  F7869E (№6): на экране корень из двух, слов «в 2 раза» в условии нет; ключ 2 засчитан
C  ядро (№11), дробная единица (№8), вектор (№7) нарисованы формулой, а не буквами подряд
D  короткая подпись карточки — без сырого TeX; 375 px — без горизонтальной прокрутки; ошибок JS нет
E  информатика не задета: в её условиях нет $ (там формулы — одиночные знаки)"""
import json
import re
from pathlib import Path

from playwright.sync_api import sync_playwright
import test_prompt54_trainer_sync_and_cards as t54
import test_prompt_oge_phys_inf as base

HERE = Path(__file__).resolve().parent
PILOT = HERE.parent / 'fipi-pilot'
BASE = base.BASE
STRUCT = re.compile(r'<m:(?:mfrac|msup|msub|msqrt|mroot|mover|mmultiscripts|menclose)\b')
fails = []


def check(ok, msg):
    print(('  ok  ' if ok else '  FAIL ') + msg, flush=True)
    if not ok:
        fails.append(msg)


def main():
    with t54.local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        errors = []
        ctx, page = base.fresh(browser, errors)

        print('A: формулы есть и собираются', flush=True)
        page.goto(f'{BASE}/phys_oge.html?n=1')
        base.settle(page)
        data = page.evaluate('''async () => { const out = {}; const bad = [];
          for (let n = 1; n <= 16; n++) { await new Promise(r => ensureFipi(n, r));
            for (const p of protos(n)) { out[p.id] = {n, text: p.text, peek: p.peek, value: p.fields[0].value};
              for (const m of p.text.matchAll(/\\$([^$]+)\\$/g)) {
                try { katex.renderToString(m[1], {throwOnError: true, strict: 'error'}); }
                catch (e) { bad.push(p.id + ': ' + m[1] + ' — ' + e.message.slice(0, 60)); } } } }
          return {out, bad}; }''')
        site, bad = data['out'], data['bad']
        formulas = sum(len(re.findall(r'\$[^$]+\$', p['text'])) for p in site.values())
        check(len(site) == 1099 and formulas > 200, f'на сайте {len(site)} заданий физики, формул в условиях {formulas}')
        check(not bad, f'все формулы собираются KaTeX в строгом режиме ({bad[:3]})')
        if PILOT.exists():
            src = {t['id']: t for t in json.loads((PILOT / 'full_oge_phys' / 'tasks.json').read_text(encoding='utf-8'))}
            need = [i for i in site if STRUCT.search(src[i]['stem_html'])]
            lost = [i for i in need if '$' not in site[i]['text']]
            check(len(need) > 90 and not lost, f'исходников с формулой со структурой {len(need)}, без формулы на сайте {len(lost)} {lost[:5]}')
        left = [i for i, p in site.items() if re.search(r'<m:|<math|mfrac|mmultiscripts', p['text'])]
        check(not left, f'остатков MathML в условиях нет ({left[:3]})')
        raw = [i for i, p in site.items() if re.search(r'\$|\\\\(?:dfrac|text|vec|sqrt)', p['peek'] or '')]
        check(not raw, f'в коротких подписях нет сырого TeX ({raw[:3]})')

        print('B: задание с корнем', flush=True)
        p = site['F7869E']
        check('\\sqrt{2}' in p['text'] and not re.search(r'в\s+2\s*(?:&nbsp;)?\s*раза', re.sub(r'\$[^$]+\$', '', p['text'])),
              'F7869E: в условии корень из двух, а не «в 2 раза»')
        # память номера и разбор адреса живут в контексте: задание открываем в чистом, как в остальных тестах
        ctx.close()
        ctx, page = base.fresh(browser, errors)
        base.open_proto(page, 'phys_oge', p['n'], 'F7869E')
        shown = page.evaluate("() => ({sq: document.querySelectorAll('#questionText .katex .sqrt').length, t: document.getElementById('questionText').innerText})")
        check(shown['sq'] == 1 and '$' not in shown['t'] and '\\sqrt' not in shown['t'].split('annotation')[0][:400], 'F7869E: на экране нарисован знак корня')
        page.fill('#answerArea input.answer-input', p['value'])
        page.click('#answerArea .check-btn')
        page.wait_for_timeout(200)
        check(p['value'] == '2' and page.evaluate('S.correct'), 'F7869E: ключ 2 засчитан')

        print('C: ядро, дробная единица, вектор', flush=True)
        kinds = {
            'ядро': lambda s: re.search(r'\{\}\^\{\d+\}_\{\d+\}\\text', s),
            'дробная единица': lambda s: re.search(r'\\dfrac\{\\text\{Дж\}\}', s),
            'вектор': lambda s: '\\vec{' in s,
        }
        for name, test in kinds.items():
            pid = next(i for i, q in sorted(site.items()) if test(q['text']))
            ctx.close()
            ctx, page = base.fresh(browser, errors)
            base.open_proto(page, 'phys_oge', site[pid]['n'], pid)
            st = page.evaluate("() => { const q = document.getElementById('questionText'); return {k: q.querySelectorAll('.katex').length, err: q.querySelectorAll('.katex-error').length, t: q.innerText}; }")
            check(st['k'] >= 1 and st['err'] == 0 and '$' not in st['t'], f'{name}: №{site[pid]["n"]} {pid} — формула нарисована ({st["k"]} шт.)')

        print('D: телефон', flush=True)
        for pid in ('F7869E', next(i for i, q in sorted(site.items()) if q['text'].count('$') >= 8)):
            ctx.close()
            ctx, page = base.fresh(browser, errors, width=375)
            base.open_proto(page, 'phys_oge', site[pid]['n'], pid)
            w = page.evaluate('[document.documentElement.scrollWidth, innerWidth]')
            check(w[0] <= w[1], f'375 px, {pid}: без горизонтальной прокрутки ({w})')

        print('E: информатика', flush=True)
        ctx.close()
        ctx, page = base.fresh(browser, errors)
        page.goto(f'{BASE}/inf_oge.html?n=1')
        base.settle(page)
        n = page.evaluate('''async () => { let k = 0;
          for (let n = 1; n <= 10; n++) { await new Promise(r => ensureFipi(n, r)); k += protos(n).filter(p => p.text.includes('$')).length; }
          return k; }''')
        check(n == 0, f'в условиях информатики нет $ ({n})')
        ctx.close()
        check(not errors, f'ошибок JS нет ({errors[:3]})')
        browser.close()
    print('Готово.' if not fails else 'ПРОВАЛЕНО: %d' % len(fails))
    raise SystemExit(1 if fails else 0)


if __name__ == '__main__':
    main()
