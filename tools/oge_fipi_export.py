#!/usr/bin/env python3
"""ОГЭ физика и информатика: задания с кратким ответом из банка ФИПИ → страницы тренажёров.

python3 tools/oge_fipi_export.py phys|inf [--source ../fipi-pilot] [--check]

Берутся только задания, чей ответ принял сам сайт ФИПИ (full_oge_*/verify.json, поле ok),
номер КИМ 2027 — num27 из fipi-pilot/tools/classify_oge_*.py. Исходники выгрузки не меняются.
Пишет: <pref>-bank.js (первое задание номера), <pref>-fipi.js (оглавление), <pref>-fipi<N>.js
(задания номера, грузятся по требованию), <pref>-figs.js, <pref>-img/ (рисунки) и страницу
<slug>.html — копию ege_prof.html со своим блоком EXAM (как sync_ege_pages.py).
Информатика №11–12 (поиск по архиву 37–76 МБ) пока не выгружается: не решено, где хранить архивы."""
import argparse, html, json, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(ROOT))
import sync_ege_pages as sync  # общий шаблон страниц: голова и хвост ege_prof.html

SOURCE = 'Открытый банк заданий ФИПИ'
SUBJ = {
    'phys': dict(
        dir='full_oge_phys', proj='B24AFED7DE6AB5BC461219556CCA4F9B', slug='phys_oge', pref='phys-oge',
        var='PHYS_OGE', id='phys', title='ОГЭ физика', name='физика',
        titles={1: 'Физические понятия и величины', 2: 'Устройства и приборы', 3: 'Распознавание явлений',
                4: 'Текст с пропусками', 5: 'Объяснение явлений', 6: 'Механика: кинематика и силы',
                7: 'Механика: законы и энергия', 8: 'Тепловые явления', 9: 'Электричество и магнетизм',
                10: 'Оптика и волны', 11: 'Атом и ядро', 12: 'Изменение величин: механика и тепло',
                13: 'Изменение величин: электричество и ядро', 14: 'Графики и таблицы',
                15: 'Измерения и опыты', 16: 'Анализ опытов'},
        points={1: 2, 2: 2, 4: 2, 12: 2, 13: 2, 14: 2, 16: 2},
        sections={'1': 'Механические явления', '2': 'Тепловые явления', '3': 'Электромагнитные явления',
                  '4': 'Квантовые явления'},
    ),
    'inf': dict(
        dir='full_oge_inf', proj='74676951F093A0754D74F2D6E7955F06', slug='inf_oge', pref='inf-oge',
        var='INF_OGE', id='inf', title='ОГЭ информатика', name='информатика',
        titles={1: 'Объём текста в кодировке', 2: 'Расшифровка сообщения', 3: 'Истинность высказывания',
                4: 'Кратчайший путь', 5: 'Алгоритм для исполнителя', 6: 'Программа и запуски',
                7: 'Адрес файла в Интернете', 8: 'Запросы к поисковой системе', 9: 'Число путей в графе',
                10: 'Системы счисления'},
        points={},
        sections={'1': 'Цифровая грамотность', '2': 'Теоретические основы информатики',
                  '3': 'Алгоритмы и программирование', '4': 'Информационные технологии'},
    ),
}
KEEP = {'b', 'strong', 'i', 'em', 'u', 'sup', 'sub', 'br', 'p', 'table', 'tbody', 'tr', 'td', 'th'}


IMGMAP = {}   # имя рисунка на сайте → путь в выгрузке: выгружаем только те, на что ссылается текст


def img_name(path):
    # у ФИПИ встречаются одинаковые имена (innerimg0.gif) в папках разных заданий
    p = Path(path)
    name = p.name if p.name.startswith('xs3qstsrc') else p.parent.name[:12] + '_' + p.name
    if IMGMAP.setdefault(name, path) != path:
        raise ValueError('одинаковые имена разных рисунков: ' + name)
    return name


def pics(markup):
    return re.findall(r"ShowPictureQ\(['\"]([^'\"]+\.(?:gif|png|jpe?g|svg))['\"]", markup, re.I)


def clean(markup, img):
    # Рисунок ФИПИ ставит скрипт ShowPictureQ: сохраняем его место до удаления скриптов
    markup = re.sub(r"<script[^>]*>\s*ShowPictureQ\(['\"]([^'\"]+)['\"](?:\s*,[^)]*)?\);?\s*</script>",
                    lambda m: '[[IMG:' + img_name(m[1]) + ']]', markup, flags=re.I)
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
    markup = re.sub(r'\[\[IMG:([^\]]+)\]\]', lambda m: '<img class="fig" src="%s/%s" alt="Иллюстрация к заданию">' % (img, m[1]), markup)
    return markup.strip().replace('$', '&#36;')


def options(src, t, img):
    # Варианты выбора лежат в странице выгрузки рядом с галочками/кнопками, а не в условии:
    # берём HTML ячейки selectVariant<ID>(k), чтобы не потерять формулы и рисунки
    # (у галочек и у кнопок разметка строк разная, общая — таблица distractors-table:
    # текст варианта всегда в последней ячейке строки)
    raw = (src / 'pages' / t['page']).read_text(encoding='cp1251', errors='replace')
    i = raw.find("id='q%s'" % t['id'])
    if i < 0:
        i = raw.find('id="q%s"' % t['id'])
    j = raw.find('distractors-table', i)
    if i < 0 or j < 0 or 'selectVariant' + t['id'] not in raw[j:j + 400]:
        return []
    table = raw[j:raw.find('</table>', j)]
    out = []
    for row in re.findall(r'<tr\b.*?</tr>', table, re.S):
        cells = re.findall(r'<td\b[^>]*>(.*?)</td>', row, re.S)
        if cells:
            out.append(clean(cells[-1], img))
    return out


def grid_tables(q):
    # таблица с данными (расстояния, измерения, ключевые слова) — с сеткой; таблицы-раскладки
    # ФИПИ (рисунок, подписи под ним) остаются без линий: в них есть рисунок или одна строка
    def one(m):
        t = m[0]
        if '<img' in t or t.count('<tr') < 2 or '<table' in t[6:]:
            return t
        return '<table class="grid">' + t[len('<table>'):]
    return re.sub(r'<table>.*?</table>', one, q, flags=re.S)


def peek(q):
    text = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', q))).strip()
    return html.escape(text[:150] + ('…' if len(text) > 150 else ''), quote=False)


def kes_code(t):
    # у части заданий в КЭС указан только раздел («2 ТЕПЛОВЫЕ ЯВЛЕНИЯ») — тема «раздел целиком»
    m = re.match(r'(\d+)(?:\.(\d+))?', (t.get('kes') or [''])[0])
    return '%s.%s' % (m[1], m[2] or 0) if m else '0.0'


def kes_title(t):
    # Название темы — пункт КЭС ФИПИ до первой точки/двоеточия, без номера
    s = re.sub(r'^\d+(\.\d+)*\s*', '', (t.get('kes') or ['Другое'])[0]).strip()
    s = re.split(r'(?<=[а-яё])\. |: ', s)[0]
    if s.isupper():
        return 'Разные темы раздела'   # задание сразу на несколько пунктов КЭС
    return s[:1].upper() + s[1:]


def field_for(cfg, n, t, ok, key):
    word = bool(re.search(r'[А-Яа-яЁёA-Za-z]', ok))
    if t['input'] == 'radio':
        return {'id': 'a', 'label': 'Ответ:', 'type': 'yesno', 'value': ok, 'oneTry': True,
                'choices': [str(i) for i in range(1, len(t['variants']) + 1)]}
    if t['input'] == 'checkbox':
        return {'id': 'a', 'label': 'Ответ:', 'type': 'plain', 'value': ok, 'seq': True, 'anyOrder': True,
                'exactLen': True, 'hint': 'Запишите номера выбранных утверждений подряд, без пробелов и запятых.'}
    seq = (cfg['id'] == 'phys' and (t['kind'] != 'Краткий ответ' or n in (12, 13))) or \
          (cfg['id'] == 'inf' and n in (5, 7))
    if seq:
        f = {'id': 'a', 'label': 'Ответ:', 'type': 'plain', 'value': ok, 'seq': True, 'exactLen': n != 5,
             'hint': 'Запишите цифры подряд, без пробелов и запятых.'}
        if cfg['id'] == 'inf' and n == 5:
            # «Если таких алгоритмов более одного, запишите любой»: верны все программы,
            # найденные перебором (fipi-pilot/full_oge_inf/solve/auto.py), ФИПИ принял одну из них
            alts = [a for a in [key.get('ans')] + key.get('alts', []) if a and a != ok and re.fullmatch(r'[12]+', a)]
            if alts:
                f['alts'] = alts
        return f
    if word:
        return {'id': 'a', 'label': 'Ответ:', 'type': 'word', 'value': ok}
    return {'id': 'a', 'label': 'Ответ:', 'type': 'plain', 'value': ok}


def prototype(cfg, src, n, t, ver, key):
    ok = str(ver.get('ok') or '')
    if not ok or ver.get('guid') != t['guid']:
        raise ValueError(t['id'] + ': нет принятого ФИПИ ключа')
    img = cfg['pref'] + '-img'
    body = clean(t['stem_html'], img)
    if t['input'] in ('radio', 'checkbox'):
        opts = options(src, t, img)
        if not opts:
            raise ValueError(t['id'] + ': не найдены варианты ответа')
        body += '<div class="soc-opts">' + ''.join('<div class="soc-opt"><b>%d)</b><span>%s</span></div>' % (i + 1, o) for i, o in enumerate(opts)) + '</div>'
        if t['input'] == 'radio' and len(opts) != len(t['variants']):
            raise ValueError(t['id'] + ': число вариантов разошлось')
    body = grid_tables(body)
    for path in pics(t['stem_html']):
        if img + '/' + img_name(path) not in body:
            raise ValueError(t['id'] + ': потеряно место рисунка ' + path)
    f = field_for(cfg, n, t, ok, key)
    shown = html.escape(ok.replace('.', ','))
    return {'id': t['id'], 'fipi': t['id'], 'ok': 1, 'h': int(t.get('conf27') == 'heur'),
            'text': '<div class="soc-text">' + body + '</div>', 'peek': peek(body), 'fields': [f],
            'steps': ['Ответ, принятый открытым банком ФИПИ: <b>' + shown + '</b>.'], 'answerTex': shown}


def groups_for(cfg, ts):
    codes = {t['id']: kes_code(t) for t in ts}
    titles = {}
    for t in ts:
        titles.setdefault(codes[t['id']], kes_title(t))
    order = sorted(titles, key=lambda c: tuple(map(int, c.split('.'))))
    secs = sorted({c.split('.')[0] for c in order}, key=int)
    multi = len(secs) > 1
    groups = [{'id': 'k' + c, 'title': titles[c], 'kes': c, 'section': ('r' + c.split('.')[0]) if multi else None} for c in order]
    sections = [{'id': 'r' + s, 'title': cfg['sections'].get(s, 'Другое')} for s in secs] if multi else []
    return sections, groups, {tid: 'k' + c for tid, c in codes.items()}


def js(obj):
    return json.dumps(obj, ensure_ascii=False, indent=1) + '\n'


def decorate(expr):
    # Флаг h (номер определён по признакам текста) виден только в авторском предпросмотре ?all=1
    return ("if(new URLSearchParams(location.search).get('all')==='1'){(" + expr + ").forEach(p=>{const flags='Ключ принят ФИПИ'+(p.h?' · h: номер определён по признакам':'');p.src='" + SOURCE + " · '+flags;p.text='<div class=\"soc-note\">'+flags+'</div>'+p.text;});}\n")


def exam_block(cfg):
    v, s = cfg['var'], cfg['slug']
    nmax = max(cfg['titles'])
    return (sync.START + '\n   ' + cfg['title'] + ' 2027: краткие №1–' + str(nmax) + ', ключи только из verify.json.\n'
            '   Логика — ege_prof.html; сборка — tools/oge_fipi_export.py. */\n'
            'const EXAM = {\n'
            "  slug: '" + s + "',           // имя файла = слаг тренажёра в совместной сессии\n"
            "  idPrefix: '" + cfg['id'] + "',            // id позиции в каталоге, подборке и на доске\n"
            "  title: '" + cfg['title'] + "',\n"
            '  bank: window.' + v + '_BANK,\n'
            '  figs: window.' + v + '_FIGS,\n'
            '  fipi: window.' + v + '_FIPI,  // задания открытого банка ФИПИ, по файлу на номер\n'
            '  showPart: false,\n'
            "  part1Format: 'Запишите ответ так, как на бланке',\n"
            '  boardPinned: false,\n'
            '  calcShared: false,\n'
            '  noCalc: true,\n'
            '  noMathSyms: true,\n'
            '  refreshBtn: true,\n'
            "  backLabel: '← все задания',\n"
            "  subject: '" + cfg['id'] + "',          // цвет предмета, как на главной; поведение — как у обществознания\n"
            '  noKeypad: true,\n'
            '  optButtons: true,          // выбор 1–4 — нажатием на сам вариант\n'
            '  noAddRail: true,\n'
            '  noBoardGrid: true,\n'
            "  homeUrl: 'index.html?subject=" + cfg['id'] + "',\n"
            '};\n' + sync.END)


def page(cfg):
    prof = (ROOT / 'ege_prof.html').read_text(encoding='utf-8')
    subs = [('ЕГЭ профиль', cfg['title']), ('ege-prof-', cfg['pref'] + '-')]
    return sync.build(prof, exam_block(cfg), subs)


def build(cfg, src):
    tasks = json.loads((src / 'tasks.json').read_text(encoding='utf-8'))
    verify = json.loads((src / 'verify.json').read_text(encoding='utf-8'))
    keys = json.loads((src / 'answers.json').read_text(encoding='utf-8'))
    img = cfg['pref'] + '-img'
    outputs, bank, files, total = {}, {}, {}, 0
    for n, title in cfg['titles'].items():
        ts = [t for t in tasks if t.get('num27') == n and isinstance(verify.get(t['id'], {}).get('ok'), str)]
        if not ts:
            raise ValueError('пустой номер %d' % n)
        sections, groups, pick = groups_for(cfg, ts)
        protos = [dict(prototype(cfg, src, n, t, verify[t['id']], keys.get(t['id'], {})), group=pick[t['id']]) for t in ts]
        rank = {g['id']: i for i, g in enumerate(groups)}
        protos.sort(key=lambda p: (rank[p['group']], p['id']))
        for p in protos:
            for name in re.findall(r'src="%s/([^"]+)"' % re.escape(img), p['text']):
                outputs[img + '/' + name] = (src / 'media' / IMGMAP[name]).read_bytes()
        name = '%s-fipi%d.js' % (cfg['pref'], n)
        files[str(n)] = name
        expr = "window.%s_FIPI.tasks['%d']" % (cfg['var'], n)
        outputs[name] = '/* Собрано tools/oge_fipi_export.py; ключи приняты ФИПИ. */\n' + expr + ' = ' + js({'sections': sections, 'groups': groups, 'protos': protos}) + ';\n' + decorate(expr + '.protos')
        bank[str(n)] = {'title': title, 'part': 2, 'points': cfg['points'].get(n, 1), 'protos': [dict(protos[0], src=SOURCE)]}
        total += len(protos)
    v = cfg['var']
    outputs[cfg['pref'] + '-bank.js'] = '/* Собрано tools/oge_fipi_export.py; первое задание номера, остальные — в -fipiN.js. */\nwindow.' + v + '_BANK = ' + js({'tasks': bank}) + ';\n' + decorate('Object.values(window.' + v + "_BANK.tasks).flatMap(t=>t.protos)")
    outputs[cfg['pref'] + '-fipi.js'] = '/* Оглавление банка ФИПИ: ' + cfg['title'] + '. */\nwindow.' + v + '_FIPI = ' + js({'source': SOURCE, 'proj': cfg['proj'], 'files': files, 'tasks': {}}) + ';\n'
    outputs[cfg['pref'] + '-figs.js'] = '/* Рисунки из банка лежат в ' + img + '/. */\nwindow.' + v + '_FIGS = {};\n'
    outputs[cfg['slug'] + '.html'] = page(cfg)
    return outputs, total


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
        raise SystemExit('Экспорт разошёлся: ' + ', '.join(bad[:10]))
    return len(outputs)


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('subject', choices=sorted(SUBJ))
    ap.add_argument('--source', type=Path, default=ROOT.parent / 'fipi-pilot')
    ap.add_argument('--check', action='store_true')
    a = ap.parse_args()
    cfg = SUBJ[a.subject]
    outs, total = build(cfg, a.source / cfg['dir'])
    k = emit(ROOT, outs, a.check)
    print('%s: %d заданий, %d файлов, %s.' % (cfg['title'], total, k, 'побайтно совпали' if a.check else 'собраны'))
