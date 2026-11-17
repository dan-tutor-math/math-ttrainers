#!/usr/bin/env python3
"""Индекс каталога прототипов для конструктора вариантов: catalog-index.json.

~/.venvs/trainers/bin/python tools/build_catalog_index.py [--check]

Экрану конструктора нужен мгновенный предпросмотр («№9 · Линейные уравнения · ФИПИ 4–6 из 10»)
без загрузки кадра тренажёра на каждый номер. Источник — сами страницы: скрипт открывает
каждую в playwright и зовёт __trainerCatalog.list(n) (а не разбирает JS регулярками, чтобы
индекс не разошёлся с тем, что реально отдаёт страница). Страницы без каталога пропускаются
с пометкой в выводе — скрипт перезапускают после слияния этапа 2.

Формат (у страниц ОГЭ ч. 1 без номера в адресе n пустой: "oge9|"): { "<slug>|<n>": { "title": "...", "protos": [ { "id", "title", "fipi": [...], "hasGen" } ] } }
Порядок fipi — как в банке (тот же, что у openAt). Больше 400 КБ (LIMIT) — делим по экзаменам:
catalog-index-oge.json, catalog-index-ege.json (общий файл тогда удаляется).
--check — ничего не писать, вернуть 1, если файлы на диске отстали от страниц."""
import argparse, http.client, json, subprocess, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PORT = 9140
# было 300 КБ; с русским (этап 10б, ~3000 мест ФИПИ) общий файл ~316 КБ. Деление по
# экзаменам works.html пока не читает (берёт только catalog-index.json) — порог подняли,
# чтобы предпросмотр не сломался; учить works.html двум файлам — когда упрёмся в 400 КБ
LIMIT = 400 * 1024
# страницы, где каталог есть или появится на этапе 2 (демоверсии и работы не нужны)
# адрес страницы без номера уводит русский на главную (index.html) — открываем с номером
QUERY = {'rus_oge': '?n=2', 'rus_ege': '?n=1'}
PAGES = ['ege_prof', 'ege_base', 'soc_ege', 'soc_ege_long', 'soc_oge', 'eng_oge', 'phys_oge',
         'inf_oge', 'oge_part2', 'oge1_5', 'oge6', 'oge7', 'oge8', 'oge9', 'oge10', 'oge11', 'oge12', 'oge13',
         'oge14', 'oge15_18', 'oge19', 'rus_oge', 'rus_ege']

# в странице: все номера банка с названием и список прототипов из каталога
JS = """async () => {
  const out = {};
  // у русского номера в замыкании страницы — каталог сам отдаёт их списком nums()
  if (__trainerCatalog.nums) {
    for (const m of __trainerCatalog.nums()) {
      out[m.n] = { title: m.title, label: m.label, protos: await __trainerCatalog.list(m.n) };
    }
    return out;
  }
  // страницы ЕГЭ-семейства держат несколько номеров (NUMS, номер в адресе);
  // у страниц ОГЭ ч. 1 номер один на страницу — ключ «slug|» с пустым n
  if (typeof NUMS === 'undefined') {
    const slug = location.pathname.split('/').pop().replace(/\\.html?$/, '');
    const sp = window.ExamSpec && ExamSpec.find(slug);
    const protos = await __trainerCatalog.list();
    out[''] = { title: (sp ? 'ОГЭ ' + sp.label : document.title), label: (sp ? sp.label : slug), protos };
    return out;
  }
  for (const n of NUMS) {
    const protos = await __trainerCatalog.list(n);
    const t = (typeof task === 'function' && task(n)) || {};
    out[n] = { title: (t.title || ''), label: (typeof numLabel === 'function' ? numLabel(n) : '№' + n), protos };
  }
  return out;
}"""


def exam_of(slug):
    return 'oge' if slug.startswith('oge') or slug.endswith('_oge') else 'ege'


def server():
    p = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', str(ROOT)],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(50):
        try:
            c = http.client.HTTPConnection('127.0.0.1', PORT, timeout=0.2)
            c.request('GET', '/boards.html')
            c.getresponse()
            return p
        except Exception:
            time.sleep(0.1)
    p.kill()
    raise RuntimeError('локальный сервер не поднялся')


def slim(proto):
    return {'id': proto['id'], 'title': proto.get('title') or '',
            'fipi': [f for f in (proto.get('fipi') or [])], 'hasGen': bool(proto.get('hasGen'))}


def extract_page(browser, slug):
    """{ 'slug|n': запись } для одной страницы или None, если каталога на ней нет."""
    if not (ROOT / (slug + '.html')).exists():
        return None
    page = browser.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    try:
        page.goto(f'http://127.0.0.1:{PORT}/{slug}.html' + QUERY.get(slug, ''))
        try:
            page.wait_for_function('() => window.__trainerCatalog', timeout=8000)
        except Exception:
            return None
        data = page.evaluate(JS)
    finally:
        page.close()
    res = {}
    for n, rec in data.items():
        title = rec['title'] or rec['label']
        res[f'{slug}|{n}'] = {'title': title, 'protos': [slim(p) for p in rec['protos']]}
    return res


def extract_all(log=print):
    from playwright.sync_api import sync_playwright
    index, skipped = {}, []
    srv = server()
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            for slug in PAGES:
                r = extract_page(browser, slug)
                if r is None:
                    skipped.append(slug)
                    log(f'пропуск {slug}: каталога ещё нет')
                else:
                    index.update(r)
                    log(f'{slug}: номеров {len(r)}')
            browser.close()
    finally:
        srv.kill()
    return index, skipped


def dump(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(',', ':'), sort_keys=True) + '\n'


def files_for(index):
    """{ имя файла: текст }: один общий файл или, если он > 300 КБ, по экзаменам."""
    whole = dump(index)
    if len(whole.encode()) <= LIMIT:
        return {'catalog-index.json': whole}
    out = {}
    for ex in ('oge', 'ege'):
        part = {k: v for k, v in index.items() if exam_of(k.split('|')[0]) == ex}
        if part:
            out[f'catalog-index-{ex}.json'] = dump(part)
    return out


def load_on_disk():
    idx = {}
    for f in sorted(ROOT.glob('catalog-index*.json')):
        idx.update(json.loads(f.read_text(encoding='utf-8')))
    return idx


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()
    index, skipped = extract_all()
    files = files_for(index)
    if args.check:
        stale = load_on_disk() != index
        print('индекс отстал от страниц' if stale else 'индекс актуален')
        sys.exit(1 if stale else 0)
    for old in ROOT.glob('catalog-index*.json'):
        if old.name not in files:
            old.unlink()
    for name, text in files.items():
        (ROOT / name).write_text(text, encoding='utf-8')
        print(f'{name}: {len(text.encode()) // 1024} КБ')
    print(f'записей: {len(index)}; без каталога: {", ".join(skipped) or "нет"}')


if __name__ == '__main__':
    main()
