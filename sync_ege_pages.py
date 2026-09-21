"""
Промпт №57 (№61): ЕГЭ профиль (ege_prof.html), ЕГЭ база (ege_base.html) и
ОГЭ, часть 2 (oge_part2.html) — одна и та же страница с разными
настройками. Логику правят в ege_prof.html, а остальные файлы
пересобираются этим скриптом:

    python3 sync_ege_pages.py          — пересобрать ege_base.html и oge_part2.html
    python3 sync_ege_pages.py --check  — только проверить, что страницы
                                         не разошлись (так делают тесты №57 и №61)

Что отличается у каждой копии (и только это):
  - блок настроек EXAM между «настройки экзамена» и «конец настроек» — у
    каждой свой, он берётся из текущего файла копии и не перезаписывается;
  - название экзамена: «ЕГЭ профиль» → «ЕГЭ база» / «ОГЭ, часть 2»
    (заголовок вкладки, <h1>, комментарии);
  - файлы банка и рисунков: ege-prof-… → ege-base-… / oge-part2-….
Всё остальное — байт в байт. Если понадобится различие в логике, его
заводят полем в EXAM, а не правкой одного из файлов.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PROF = os.path.join(HERE, 'ege_prof.html')
START = '/* ═══════════════ настройки экзамена ═══════════════'
END = '/* ═══════════════ конец настроек ═══════════════ */'
TARGETS = [
    ('ege_base.html', [('ЕГЭ профиль', 'ЕГЭ база'), ('ege-prof-', 'ege-base-')]),
    ('oge_part2.html', [('ЕГЭ профиль', 'ОГЭ, часть 2'), ('ege-prof-', 'oge-part2-')]),
]


def split(text, name):
    i = text.find(START)
    j = text.find(END)
    if i < 0 or j < 0 or j < i:
        raise SystemExit(f'{name}: не найден блок настроек EXAM')
    j += len(END)
    return text[:i], text[i:j], text[j:]


def build(prof_text, block, subs):
    head, _, tail = split(prof_text, 'ege_prof.html')
    for a, b in subs:
        head = head.replace(a, b)
        tail = tail.replace(a, b)
    return head + block + tail


def main():
    prof = open(PROF, encoding='utf-8').read()
    check = '--check' in sys.argv
    bad = []
    for name, subs in TARGETS:
        path = os.path.join(HERE, name)
        cur = open(path, encoding='utf-8').read()
        _, block, _ = split(cur, name)
        want = build(prof, block, subs)
        if not check:
            open(path, 'w', encoding='utf-8').write(want)
            print(f'{name} пересобран')
            continue
        if want == cur:
            print(f'{name} совпадает с ege_prof.html (кроме настроек)')
            continue
        # первая строка расхождения — чтобы было видно, где именно
        a, b = want.splitlines(), cur.splitlines()
        for n, (x, y) in enumerate(zip(a, b), 1):
            if x != y:
                print(f'{name}, строка {n}:\n  ожидалось: {x[:160]}\n  в файле:   {y[:160]}')
                break
        else:
            print(f'{name}: разная длина: {len(a)} и {len(b)} строк')
        bad.append(name)
    if bad:
        raise SystemExit(', '.join(bad) + ' разошлись с ege_prof.html — запустите python3 sync_ege_pages.py')


if __name__ == '__main__':
    main()
