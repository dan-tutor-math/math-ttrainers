#!/usr/bin/env python3
"""ЕГЭ русский из банка ФИПИ → данные тренажёра.

    python3 tools/rus_ege_export.py [папка_репозитория]

Пишет в репозиторий тренажёров (по умолчанию ../тренажёры):
  rus-ege-fipi.js   — №1–26, window.RUS_EGE_FIPI (страница rus_ege.html)
  rus-ege27-fipi.js — №27, тексты для сочинения, window.RUS_EGE27 (rus_ege27.html)

Ключ берётся только из full_ege_rus/verify.json — то написание, которое принял сам
сайт ФИПИ (accepted/sent). Своих ключей в файл не пишем: неверный ключ хуже, чем
меньше заданий. Скрипт можно гонять сколько угодно раз — вывод детерминирован.
"""
import collections
import html as H
import json
from pathlib import Path
import re
import sys

# Одна и та же копия лежит в fipi-pilot/tools и в tools/ репозитория тренажёров:
# данные всегда берём из fipi-pilot, а пишем в репозиторий, из которого запущена копия
HERE = Path(__file__).resolve().parents[1]
ROOT = HERE if (HERE / 'full_ege_rus').exists() else Path.home() / 'Desktop' / 'папка' / 'fipi-pilot'
SRC = ROOT / 'full_ege_rus'
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else (HERE if (HERE / 'rus_ege.html').exists() else ROOT.parent / 'тренажёры')

# ФИПИ ключ принял, но по тексту он выглядит неверным (rejected_review.md, этап 5).
# Ученику такие задания не показываем — только в предпросмотре ?all=1.
SPORNO = {
    '79B0A0': '№26: ФИПИ не засчитывает 16 («Он» после «с ним»)',
    '6E2A0F': '№26: ФИПИ не засчитывает 26 («слову – словом»)',
    '682A9C': '№26: принят только набор 26, повтора в 6 не видно',
}
# По демоверсии 2027 (система оценивания): в №2–4, 9–21, 23, 24, 26 порядок
# символов не важен. Из них цифрами в поле набираются №15, 17–21 и 26
# (остальные — галочки или слово).
ANY_ORDER = {2, 3, 4} | set(range(9, 22)) | {23, 24, 26}

KEEP = {'b', 'strong', 'i', 'em', 'u', 'sup', 'sub', 'br', 'p', 'table', 'tbody', 'tr', 'td', 'th'}


def clean(h):
    """Вёрстка ФИПИ — выгрузка из Word. Оставляем смысловые теги без атрибутов, чтобы
    текст жил в стиле платформы и в тёмной теме (как tools/rus_export.py для ОГЭ)."""
    h = re.sub(r'<script.*?</script>|<style.*?</style>|<!--.*?-->', '', h, flags=re.S | re.I)
    h = re.sub(r'<m:math.*?</m:math>|<math.*?</math>', lambda m: re.sub(r'<[^>]+>', '', m.group(0)).strip(), h, flags=re.S | re.I)
    h = re.sub(r'<(/?)div\b[^>]*>', r'<\1p>', h, flags=re.I)

    def tag(m):
        close, name = m.group(1), m.group(2).lower()
        if name not in KEEP:
            return ''
        if name == 'br':
            return '<br>'
        span = re.search(r'colspan=["\']?(\d+)', m.group(0), re.I)
        return '<%s%s%s>' % (close, name, (' colspan="%s"' % span.group(1)) if span and not close else '')
    h = re.sub(r'<(/?)([a-zA-Z][a-zA-Z0-9:]*)\b[^>]*>', tag, h)
    h = h.replace('\xa0', ' ').replace('&nbsp;', ' ')
    h = re.sub(r'[ \t\r\n]+', ' ', h)
    h = re.sub(r'<p>\s*</p>', '', h)
    h = re.sub(r'(<br>\s*){3,}', '<br><br>', h)
    return h.strip()


def plain(h):
    return re.sub(r'\s+', ' ', H.unescape(re.sub(r'<[^>]+>', ' ', h))).replace('\xa0', ' ').strip()


def short_tasks(T, X, V, A):
    tasks, used = [], set()
    for t in T:
        if t['kind'] == 'long':
            continue
        q, n = t['id'], t['n']
        r = V.get(q) or {}
        ok = r.get('status') == 'accepted' and q not in SPORNO
        key = r.get('sent') if r.get('status') == 'accepted' else None
        if key is None:
            continue   # без принятого ключа задание не выгружаем вовсе
        item = {'id': q, 'n': n, 'k': t['kind'], 'q': clean(t['html']), 'a': key, 'ok': 1 if ok else 0}
        if t['heuristic']:
            item['h'] = 1   # номер КИМ-2027 подобран по умению, а не по форме — только ?all=1
        if t['kind'] == 'mask':
            item['o'] = [clean(v['html']) for v in t['variants']]
            assert len(item['o']) == len(key) == t['nopt'], q
        elif t['kind'] == 'match':
            item['m'] = max(int(x) for x in t['selects'][0]['values'])
            assert len(key) == t['nsel'], q
        elif A[q]['value_type'] == 'set':
            item['d'] = 1 if n in ANY_ORDER else 0
            if n == 26:
                # номера предложений бывают двузначными: «2526» — это 25 и 26
                units = (A[q].get('alt_units') or {}).get(key) or A[q].get('units')
                if not units or ''.join(units) != key:
                    units = list(key)   # перебор одиночных цифр: каждая цифра — номер
                item['u'] = [str(u) for u in units]
        if t['text_id']:
            item['t'] = t['text_id'][:10]
            used.add(t['text_id'])
        tasks.append(item)
    texts = {tid[:10]: clean(X[tid]['html']) for tid in sorted(used)}
    assert len(texts) == len(used), 'обрезанный id текста совпал у двух текстов'
    return tasks, texts


def essay_tasks(T, X):
    tasks, texts = [], {}
    for t in T:
        if t['kind'] != 'long':
            continue
        tid = t['text_id']
        body = clean(X[tid]['html'])
        txt = plain(X[tid]['html'])
        au = re.search(r'\((По [^()]+?)\*?\)', txt)
        first = re.search(r'\(1\)\s*(.+?)(?=\(2\)|$)', txt)
        texts[tid[:10]] = body
        tasks.append({'id': t['id'], 'q': clean(t['html']), 't': tid[:10],
                      'au': au.group(1) if au else '', 'f': first.group(1).strip() if first else ''})
    return tasks, texts


def write(path, var, comment, data):
    js = comment + 'window.%s = %s;\n' % (var, json.dumps(data, ensure_ascii=False, separators=(',', ':')))
    path.write_text(js, encoding='utf-8')
    return len(js.encode())


def main():
    T = json.loads((SRC / 'tasks.json').read_text())
    X = json.loads((SRC / 'texts.json').read_text())
    V = json.loads((SRC / 'verify.json').read_text())['tasks']
    A = json.loads((SRC / 'answers.json').read_text())
    tasks, texts = short_tasks(T, X, V, A)
    head = ('// Задания ЕГЭ по русскому языку из открытого банка ФИПИ (ege.fipi.ru), номера КИМ 2027.\n'
            '// Собрано скриптом ~/Desktop/папка/fipi-pilot/tools/rus_ege_export.py — руками не править.\n'
            '// a — ответ, принятый самим сайтом ФИПИ; ok: 0 — спорный ключ, h: 1 — номер по умению (только ?all=1).\n')
    size = write(OUT / 'rus-ege-fipi.js', 'RUS_EGE_FIPI', head,
                 {'source': 'ege.fipi.ru', 'proj': 'AF0ED3F2557F8FFC4C06F80B6803FD26', 'texts': texts, 'tasks': tasks})
    shown = [t for t in tasks if t['ok'] and not t.get('h')]
    print('rus-ege-fipi.js', round(size / 1024), 'КБ; заданий', len(tasks), 'ученику', len(shown), 'текстов', len(texts))
    print(' по номерам (ученику):', dict(sorted(collections.Counter(t['n'] for t in shown).items())))
    et, ex = essay_tasks(T, X)
    head27 = ('// №27 ЕГЭ по русскому: тексты для сочинения из открытого банка ФИПИ.\n'
              '// Собрано скриптом ~/Desktop/папка/fipi-pilot/tools/rus_ege_export.py — руками не править.\n')
    size = write(OUT / 'rus-ege27-fipi.js', 'RUS_EGE27', head27,
                 {'source': 'ege.fipi.ru', 'proj': 'AF0ED3F2557F8FFC4C06F80B6803FD26', 'texts': ex, 'tasks': et})
    print('rus-ege27-fipi.js', round(size / 1024), 'КБ; сочинений', len(et), 'без автора', sum(not t['au'] for t in et), 'без (1)', sum(not t['f'] for t in et))


if __name__ == '__main__':
    main()
