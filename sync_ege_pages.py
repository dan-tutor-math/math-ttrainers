"""
Промпт №57: ЕГЭ профиль (ege_prof.html) и ЕГЭ база (ege_base.html) — одна и
та же страница с разными настройками. Логику правят в ege_prof.html, а
ege_base.html пересобирается этим скриптом:

    python3 sync_ege_pages.py          — пересобрать ege_base.html
    python3 sync_ege_pages.py --check  — только проверить, что страницы
                                         не разошлись (так делает тест №57)

Что отличается у базы (и только это):
  - блок настроек EXAM между «настройки экзамена» и «конец настроек» — у
    базы свой, он берётся из текущего ege_base.html и не перезаписывается;
  - «ЕГЭ профиль» → «ЕГЭ база» (заголовок вкладки, <h1>, комментарии);
  - ege-prof-… → ege-base-… (банк заданий и рисунки).
Всё остальное — байт в байт. Если понадобится различие в логике, его
заводят полем в EXAM, а не правкой одного из файлов.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PROF = os.path.join(HERE, 'ege_prof.html')
BASE = os.path.join(HERE, 'ege_base.html')
START = '/* ═══════════════ настройки экзамена ═══════════════'
END = '/* ═══════════════ конец настроек ═══════════════ */'
SUBS = [('ЕГЭ профиль', 'ЕГЭ база'), ('ege-prof-', 'ege-base-')]


def split(text, name):
    i = text.find(START)
    j = text.find(END)
    if i < 0 or j < 0 or j < i:
        raise SystemExit(f'{name}: не найден блок настроек EXAM')
    j += len(END)
    return text[:i], text[i:j], text[j:]


def build(prof_text, base_block):
    head, _, tail = split(prof_text, 'ege_prof.html')
    for a, b in SUBS:
        head = head.replace(a, b)
        tail = tail.replace(a, b)
    return head + base_block + tail


def main():
    prof = open(PROF, encoding='utf-8').read()
    base = open(BASE, encoding='utf-8').read()
    _, base_block, _ = split(base, 'ege_base.html')
    want = build(prof, base_block)
    if '--check' in sys.argv:
        if want != base:
            # первая строка расхождения — чтобы было видно, где именно
            a, b = want.splitlines(), base.splitlines()
            for n, (x, y) in enumerate(zip(a, b), 1):
                if x != y:
                    print(f'строка {n}:\n  ожидалось: {x[:160]}\n  в файле:   {y[:160]}')
                    break
            else:
                print(f'разная длина: {len(a)} и {len(b)} строк')
            raise SystemExit('ege_base.html разошёлся с ege_prof.html — запустите python3 sync_ege_pages.py')
        print('ege_base.html совпадает с ege_prof.html (кроме настроек)')
        return
    open(BASE, 'w', encoding='utf-8').write(want)
    print('ege_base.html пересобран')


if __name__ == '__main__':
    main()
