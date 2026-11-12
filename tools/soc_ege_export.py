#!/usr/bin/env python3
"""ЕГЭ обществознание, часть 1: проверенные ключи ФИПИ и повторяемая сборка.

python3 tools/soc_ege_export.py [--source ../fipi-pilot/full_ege_soc] [--check]
Копию скрипта из fipi-pilot/tools запускают с --target <копия репозитория>.
Исходные tasks/texts/verify.json и media не меняются.
"""
import argparse
import collections
import hashlib
import html
import json
from pathlib import Path
import re
import sys

SOURCE = 'Открытый банк заданий ФИПИ'
PROJ = '756DF168F63F9A6341711C61AA5EC578'
TITLES = {
    1: 'Понятия: исключение лишнего', 2: 'Человек и общество: суждения',
    3: 'Человек и общество: соответствие', 4: 'Человек и общество: применение знаний',
    5: 'Экономика: суждения', 6: 'Экономика: соответствие', 7: 'Экономика: применение знаний',
    8: 'Социальные отношения: суждения', 9: 'Анализ диаграммы опроса',
    10: 'Политика: суждения', 11: 'Политика: применение знаний',
    12: 'Конституция Российской Федерации', 13: 'Политика: соответствие',
    14: 'Право: суждения', 15: 'Право: соответствие', 16: 'Право: применение знаний',
}
SECTIONS = {'1': 'Человек и общество', '2': 'Экономика', '3': 'Социальные отношения',
            '4': 'Политика', '5': 'Право'}
KEEP = {'b', 'strong', 'i', 'em', 'u', 'sup', 'sub', 'br', 'p', 'table', 'tbody', 'tr', 'td', 'th'}
IMG = 'soc-ege-img'


def clean(markup):
    # Скрипт ФИПИ рисует изображение; сохраняем его место до удаления скриптов.
    markup = re.sub(r"<script[^>]*>\s*ShowPictureQ\(['\"]([^'\"]+)['\"](?:\s*,[^)]*)?\);?\s*</script>",
                    lambda m: '[[IMG:' + Path(m[1]).name + ']]', markup, flags=re.I)
    markup = re.sub(r'<script\b.*?</script>|<style\b.*?</style>|<!--.*?-->', '', markup, flags=re.I | re.S)
    markup = re.sub(r'<\?.*?\?>', '', markup, flags=re.S)
    markup = re.sub(r'<(/?)div\b[^>]*>', r'<\1p>', markup, flags=re.I)

    def tag(m):
        close, name = m[1], m[2].lower()
        if name not in KEEP:
            return ''
        if name == 'br':
            return '<br>'
        spans = ''.join(' %s="%s"' % (k, v) for k, v in re.findall(r'(colspan|rowspan)=[\"\']?(\d+)', m[0], re.I)) if not close else ''
        return '<' + close + name + spans + '>'
    markup = re.sub(r'<(/?)([a-zA-Z][a-zA-Z0-9:]*)\b[^>]*>', tag, markup)
    markup = re.sub(r'\s+', ' ', markup.replace('\xa0', ' '))
    markup = re.sub(r'<p>\s*(?:&nbsp;|\s)*</p>', '', markup)
    markup = re.sub(r'\[\[IMG:([^\]]+)\]\]', lambda m: '<img class="fig" src="%s/%s" alt="Иллюстрация к заданию">' % (IMG, m[1]), markup)
    return markup.strip().replace('$', '&#36;')


def stack_heads(q):
    # Между колонками ФИПИ бывает пустая ячейка: шапки раздаём непустым колонкам.
    m = re.search(r'<tr>((?:<td>(?:(?!<table|</td>).)*</td>)+)</tr>(?=<tr><td><table>)', q, re.S)
    if not m:
        return q
    heads = [c for c in re.findall(r'<td>(.*?)</td>', m[1], re.S) if re.sub(r'<[^>]+>|&nbsp;', '', c).strip()]
    pos, depth, k, out = m.end(), 0, 0, []
    for t in re.finditer(r'<(/?)(table|tr|td)\b[^>]*>', q[pos:]):
        name, close = t[2], t[1]
        if name == 'table':
            depth += -1 if close else 1
            if depth < 0:
                break
        if depth == 0 and name == 'tr' and close:
            break
        if depth == 0 and name == 'td' and not close and q[pos+t.end():].startswith('<table') and k < len(heads):
            out.append((pos+t.end(), '<div class="col-head">' + heads[k] + '</div>'))
            k += 1
    for at, ins in reversed(out):
        q = q[:at] + ins + q[at:]
    return q[:m.start()] + '<tr class="col-heads">' + q[m.start()+4:]


def peek(q):
    text = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', q))).strip()
    return html.escape(text[:150] + ('…' if len(text) > 150 else ''), quote=False)


def groups_for(tasks):
    names, codes = {}, {}
    for t in tasks:
        for kes in t.get('kes', []):
            m = re.match(r'([\d.]+)\s*(.*)', kes)
            if m:
                names[m[1].rstrip('.')] = m[2]
        first = re.match(r'([\d.]+)', (t.get('kes') or [''])[0])
        codes[t['id']] = first[1].rstrip('.') if first else ''
    counts = collections.Counter(codes.values())
    pick = {tid: 'k' + c if c and counts[c] >= 6 else 's' + (c.split('.')[0] or '0') for tid, c in codes.items()}
    gids = sorted(set(pick.values()), key=lambda g: (list(map(int, g[1:].split('.'))), g[0]))
    sections = sorted({g[1:].split('.')[0] for g in gids}, key=int)
    use_sections = len(sections) > 1
    groups = []
    for gid in gids:
        sec = gid[1:].split('.')[0]
        title = re.split(r'\.\s', re.sub(r'\s*\([^)]*\)', '', names.get(gid[1:], '')))[0].rstrip('.') if gid[0] == 'k' else 'Другие темы'
        if gid[0] == 's' and not any(g.startswith('k' + sec + '.') for g in gids):
            title = SECTIONS.get(sec, 'Другие темы')
        groups.append({'id': gid, 'title': title, 'section': 'r' + sec if use_sections else None})
    return ([{'id': 'r'+s, 'title': SECTIONS.get(s, 'Другое')} for s in sections] if use_sections else [], groups, pick)


def prototype(t, verified):
    a = str(verified.get('ok') or '')
    if not re.fullmatch(r'[1-9]+', a):
        raise ValueError(t['id'] + ': отсутствует принятый ФИПИ ключ')
    if verified.get('guid') != t['guid'] or verified.get('n') != t['num27']:
        raise ValueError(t['id'] + ': сверка относится к другому заданию/номеру')
    kind = {'checkbox': 'choice', 'select': 'match', 'text': 'sequence'}[t['input']]
    body = stack_heads(clean(t['stem_html']))
    if t['variants']:
        body += '<div class="soc-opts">' + ''.join('<div class="soc-opt"><b>%d)</b><span>%s</span></div>' % (v['n'], clean(v['html'])) for v in t['variants']) + '</div>'
    if any(IMG + '/' + Path(path).name not in body for path in t.get('images', [])):
        raise ValueError(t['id'] + ': потеряно место рисунка в условии')
    # Для соответствия порядок значим. В остальных кратких ответах — набор цифр.
    field = {'id': 'a', 'label': 'Ответ:', 'type': 'plain', 'value': a, 'seq': True,
             'anyOrder': kind != 'match', 'hint': 'Запишите выбранные цифры подряд, без пробелов и запятых.'}
    if kind == 'match':
        choices = sorted({v for s in t['selects'] for v in s['values']})
        field.update(exactLen=True, halfNote=t['num27'] in (6, 13, 15),
                     hint='Цифры под буквами подряд: %d цифр от %s до %s.' % (len(a), choices[0], choices[-1]))
    p = {'id': t['id'], 'fipi': t['id'], 'k': kind, 'ok': 1, 'h': int(t.get('conf27') == 'heur'),
         'text': '<div class="soc-text">' + body + '</div>', 'peek': peek(body), 'fields': [field],
         'steps': ['Соответствие: <b>' + ', '.join('АБВГДЕЖЗ'[i]+' — '+d for i, d in enumerate(a)) + '</b>.'] if kind == 'match' else ['Выбранные пункты: <b>' + ', '.join(a) + '</b>.'],
         'answerTex': a}
    return p


def js(obj):
    return json.dumps(obj, ensure_ascii=False, indent=1) + '\n'


def decorate(expr):
    # Флаги видны лишь в авторском предпросмотре; ключ остаётся принятым набором.
    return "if(new URLSearchParams(location.search).get('all')==='1'){(" + expr + ").forEach(p=>{const flags=(p.ok?'Ключ принят ФИПИ':'Ключ не проверен')+(p.h?' · h: номер определён эвристикой':'');p.src='" + SOURCE + " · '+flags;p.text='<div class=\"soc-note\">'+flags+'</div>'+p.text;});}\n"


def page(target, long=False):
    source = (target / 'soc_oge.html').read_text()
    start, end = '/* ═══════════════ настройки экзамена ═══════════════', '/* ═══════════════ конец настроек ═══════════════ */'
    i, j = source.index(start), source.index(end) + len(end)
    block = source[i:j].replace('soc_oge', 'soc_ege_long' if long else 'soc_ege').replace('SOC_OGE', 'SOC_EGE_LONG' if long else 'SOC_EGE').replace('soc-oge', 'soc-ege-long' if long else 'soc-ege').replace('ОГЭ', 'ЕГЭ')
    block = re.sub(r"idPrefix: 'soc'", "idPrefix: 'soce'", block)
    block = re.sub(r"  legacyKeys:.*\n", '', block)
    block = block.replace("proofLabel: 'Сверить с образцом и критериями'", "proofLabel: 'Сверить с критериями'")
    block = block.replace('(?n=1…20)', '(?n=17…25)' if long else '(?n=1…16)')
    # Только настройки новой страницы: поведение и подключения — точная копия образца.
    block = re.sub(r'/\* ═══════════════ настройки экзамена ═══════════════.*?const EXAM',
                   start + '\n   ЕГЭ обществознание 2027: ' + ('развёрнутые №17–25, самопроверка по критериям.' if long else 'краткие №1–16, ключи только из verify.json.') + '\n   Логика — ege_prof.html; сборка — tools/soc_ege_' + ('long_' if long else '') + 'export.py. */\nconst EXAM', block, flags=re.S)
    head, tail = source[:i], source[j:]
    for a,b in [('ОГЭ обществознание', 'ЕГЭ обществознание'), ('soc-oge-', 'soc-ege-long-' if long else 'soc-ege-')]:
        head, tail = head.replace(a,b), tail.replace(a,b)
    return head + block + tail


def media_files(source, tasks, texts=None):
    outputs = {}
    used = [p for t in tasks for p in t.get('images', [])]
    used += [p for t in (texts or {}).values() for p in t.get('images', [])]
    for path in used:
        data = (source / 'media' / path).read_bytes()
        name = IMG + '/' + Path(path).name
        if name in outputs and outputs[name] != data:
            raise ValueError('Одинаковые имена разных рисунков: ' + name)
        outputs[name] = data
    return outputs


def emit(target, outputs, check):
    bad = []
    for name, data in outputs.items():
        data = data.encode() if isinstance(data, str) else data
        path = target / name
        if check:
            if not path.exists() or path.read_bytes() != data:
                bad.append(name)
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
    if bad:
        raise SystemExit('Экспорт разошёлся: ' + ', '.join(bad))
    print('Готово: %d файлов, %s.' % (len(outputs), 'побайтно совпали' if check else 'собраны'))


def arguments():
    parser = argparse.ArgumentParser(description=__doc__)
    home = Path(__file__).resolve().parents[1]
    parser.add_argument('--target', type=Path, default=home if (home/'ege_prof.html').exists() else None)
    parser.add_argument('--source', type=Path, default=home.parent/'fipi-pilot'/'full_ege_soc')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    if args.target is None:
        parser.error('Для запуска вне репозитория явно укажите --target; основная копия не выбирается автоматически.')
    return args


def build(source, target):
    raw = json.loads((source/'tasks.json').read_text())
    verify = json.loads((source/'verify.json').read_text())
    tasks = [t for t in raw if t.get('num27') in TITLES]
    if len(tasks) != 1134 or len({t['id'] for t in tasks}) != 1134:
        raise ValueError('Ожидалось 1134 уникальных задания части 1')
    outputs = media_files(source, tasks)
    bank, files = {}, {}
    for n, title in TITLES.items():
        ts = [t for t in tasks if t['num27'] == n]
        sections, groups, pick = groups_for(ts)
        protos = [dict(prototype(t, verify[t['id']]), group=pick[t['id']]) for t in ts]
        rank = {g['id']: i for i,g in enumerate(groups)}
        protos.sort(key=lambda p: (rank[p['group']], p['id']))
        name = 'soc-ege-fipi%d.js' % n
        files[str(n)] = name
        data = {'sections': sections, 'groups': groups, 'protos': protos}
        expr = "window.SOC_EGE_FIPI.tasks['%d']" % n
        outputs[name] = '/* Собрано tools/soc_ege_export.py; ключи приняты ФИПИ. */\n' + expr + ' = ' + js(data) + ';\n' + decorate(expr+'.protos')
        # Внутренний part=2 включает поля seq и подсказки общего шаблона, как у ОГЭ.
        bank[str(n)] = {'title': title, 'part': 2, 'points': 1 if n in (1,3,9,12) else 2,
                        'protos': [dict(protos[0], src=SOURCE)]}
    outputs['soc-ege-bank.js'] = '/* Собрано tools/soc_ege_export.py; первое задание номера без дубля при загрузке. */\nwindow.SOC_EGE_BANK = ' + js({'tasks': bank}) + ';\n' + decorate('Object.values(window.SOC_EGE_BANK.tasks).flatMap(t=>t.protos)')
    outputs['soc-ege-fipi.js'] = '/* Оглавление банка ЕГЭ обществознания, часть 1. */\nwindow.SOC_EGE_FIPI = ' + js({'source': SOURCE, 'proj': PROJ, 'files': files, 'tasks': {}}) + ';\n'
    outputs['soc-ege-figs.js'] = '/* Изображения из банка лежат в soc-ege-img/. */\nwindow.SOC_EGE_FIGS = {};\n'
    outputs['soc_ege.html'] = page(target)
    return outputs


if __name__ == '__main__':
    args = arguments()
    emit(args.target, build(args.source, args.target), args.check)
