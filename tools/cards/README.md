# Карточки заданий ФИПИ — сборщик (задача 63)

Задание ФИПИ → карточка: условие (HTML + формулы), рисунки отдельными файлами,
таблицы текстом, ответ в том же виде, что у блока работы. Схема —
`cards/_schema.json`, решение и почему — `memory/decisions.md` (раздел «Карточки ФИПИ»).
Рисует карточку `card-render.js` (один для конструктора, ученика и печати).

## Файлы

| Файл | Что |
|---|---|
| `cards/<slug>.json` | карточки одной страницы-экзамена (slug — имя страницы без .html: `oge9`, `ege_prof`) |
| `cards/<страница>_n<N>.json` | у больших страниц (rus_ege, rus_oge, soc_oge, soc_ege_long, eng_oge) — часть по номеру КИМ; slug = имя файла |
| `cards/index.json` | список частей по страницам: `{"v":1,"pages":{"rus_ege":[{"slug":"rus_ege_n19","n":[19]},…]}}` |
| `cards/img/<slug>/<ФИПИ>_<k>.png\|svg` | рисунки (у разбитой страницы — в папке страницы, не части) |
| `tools/cards/build.py` | сборщик (Playwright + локальный сервер) |
| `tools/cards/validate.py` | валидатор: схема, разметка, ответ, файлы рисунков |
| `tools/cards/core.py` | общие помощники для плагинов |
| `tools/cards/collect.js` | в браузере: живой узел задания → разметка карточки, ответ через `trainerTaskInfo` |
| `tools/cards/harness.html` | служебная страница: тренажёр в кадре + `trainer-tasks.js` (как конструктор) |
| `tools/cards/preview.html?slug=oge9&answer=1&solution=1` | просмотр карточек глазами |
| `tools/cards/reports/<slug>.md` | отчёт последней сборки: обработано / не обработано / причина |
| `tools/cards/families/<семья>.py` | плагины семей |

## Запуск

```
python tools/cards/build.py --family a_simple          # одна семья целиком
python tools/cards/build.py --slug oge9 --limit 10     # пилот: 10 заданий, разные прототипы
python tools/cards/split.py                            # после build.py: режет большие страницы на части, пишет index.json
python tools/cards/validate.py                         # все cards/*.json
python test_prompt_cards_pilot.py                      # пилот S0
```
Нужен Python с Playwright и Pillow (как у тестов `test_prompt*.py`).

## Разбиение на части (split.py)

build.py по-прежнему отдаёт файл на страницу (`cards/rus_ege.json`). Если страница тяжелее
250 КБ в сжатом виде и у неё несколько номеров КИМ, `split.py` режет её на `<страница>_n<N>.json`
(slug карточки = slug части), стирает исходный файл и обновляет `cards/index.json`. После каждой
пересборки такой страницы — `build.py`, затем `split.py` (`--check` скажет, если забыли).
Почему по номеру и по сжатому размеру: замер (Chromium, gzip, 4G 1,6 Мбит/с, процессор ×4) — разбор
JSON 15 мс даже у 5 МБ, всё время уходит на скачивание (rus_ege целиком 1,05 МБ → 5,8 с,
одна часть ~40 КБ → ~0,3 с). Работа из одного номера тянет одну часть; блок хранит slug части и
грузит `cards/<slug>.json` напрямую, поэтому ученику и печати список не нужен. Конструктор по
`index.json` берёт части нужного `?n=`; старый блок со slug страницы (сделан до разбиения)
собирается из всех её частей (works.html, work.html, work-print.js). `validate.py` бьёт, если
часть тяжелее 300 КБ в сжатом виде или index.json разошёлся с файлами. Для тестов —
`tools.cards.split.load_page(страница)` (все карточки) и `canon(cards)` (сравнение без slug).

## Плагин семьи: `tools/cards/families/<семья>.py`

Новая семья — новый файл; чужие плагины, `core.py`, `collect.js`, `build.py`
не трогать. Если общему коду чего-то не хватает — опции (`grab_opts`, `extra`)
или своя функция в своём файле; правка общего — только по согласованию.

```python
from tools.cards.core import Skip, card_base, collect_catalog, convert_html, in_page

FAMILY = "b_rus"                  # имя семьи = имя файла
PAGES = [                         # страницы семьи; один slug — ровно одна семья
    {"slug": "rus_oge", "href": "rus_oge.html?n=2", "deps": ["rus_oge.html", "rus-oge-fipi2.js"]},
    {"slug": "rus_oge", "href": "rus_oge.html?n=3", "deps": ["rus-oge-fipi3.js"]},
]
UI_TEXT = {}                      # {slug: [(текст на странице, текст в карточке)]} — что
                                  # карточка пишет иначе, чем страница (подписи «нажмите…»)

def collect(page, slug, limit=None):
    """page — Playwright Page с harness.html. Вернуть (raws, total):
    raws — сырые задания (dict), total — сколько заданий ФИПИ на странице."""
    raws, total = [], 0
    for p in PAGES:
        if p["slug"] == slug:
            r, t = collect_catalog(page, p["href"], limit=limit, extra=_extra)
            raws += r; total += t
    return raws, total

def _extra(page, raw):            # что добрать из банка страницы: разбор, ключ
    t = in_page(page, "RUS_FIPI.find(x => x.fipi === %r)" % raw["fipi"])
    if not t: raise Skip("нет в банке")
    raw["solution"] = convert_html(page, t["sol"])

def normalize(raw):
    """raw → карточка (dict по схеме). Не обработать — raise Skip("причина")."""
    card = card_base(raw)         # id, exam, n, proto, pos, text, figs, table, answer…
    card["solution"] = raw["solution"]["html"]
    return card
```

Что даёт `collect_catalog(page, href, limit, grab_opts, extra)`: открывает страницу
в кадре, обходит её `__trainerCatalog.list()` (только прототипы с номерами ФИПИ),
каждое задание открывает `openAt(proto, pos, n)` и снимает главный узел задания
(первый из `TRAINER_CAPTURE` в trainer-tasks.js — тот же, что снимает конструктор).
В каждом raw: `href tid slug n spec proto pos fipi html figs tables tex info sel`,
при сбое — `err` (тогда `card_base` бросит `Skip`).
- `html` — разметка карточки: KaTeX страницы развёрнут обратно в `$TeX$`, рисунки →
  `[[fig:k]]`, таблицы → `[[table:k]]`, кнопки/поля/«Источник» выброшены, классы
  страницы переведены в классы карточки (`collect.js`, `CLASS_MAP`).
- `info` — ответ живого задания (`trainerTaskInfo`): идёт в `answer` как есть.
- `grab_opts = {"drop": [селекторы интерфейса], "classMap": {"класс страницы": "c-…"}}` —
  если на странице есть свой интерфейс внутри узла или свои классы дробей.
- `limit` — пилот: прототипы через равный шаг, по кругу.

Рисунки сохраняет `build.py` (не плагин): `img` → PNG (GIF и JPEG перекодируются),
`canvas` → PNG, `svg` → .svg с вычисленными цветами. Плагину остаётся `card_base`.

Порядок сборки: collect → рисунки в файлы → normalize → `validate.check_card` →
`cards/<slug>.json` + отчёт `tools/cards/reports/<slug>.md`. `src` в файле — sha1
`deps`: изменилась страница или банк — карточки пересобрать (тест пилота ловит
расхождение свежей сборки с лежащей).

## Разметка карточки (кратко; полностью — `cards/_schema.json`)

- Теги: `b strong i em u s sub sup br p div span ol ul li nobr`; атрибут — только `class`.
- Классы: `c-eq` (формула отдельной строкой), `c-frac`/`c-num`/`c-den` (дробь
  вертикально), `c-op`, `c-line` (строка разбора). Новые классы — только с правкой
  `card-render.js`, `validate.py` и схемы (согласовать).
- Формулы TeX — `$…$` и `$$…$$`, при этом `math: "tex"`; литеральный `$` — `&#36;`.
- Ответ — объект `task` блока работы: `{kind:'fields', fields:[…]}`, `{kind:'choice', n, correct}`,
  `{kind:'multi', n, correct:[…]}`, `{kind:'long'}` + `value` (запись для бланка).
  У choice/multi варианты — `opts`, номера рисует рендерер; где стоит список — метка `[[opts]]`
  в тексте (у ФИПИ «В ответ запишите…» идёт после вариантов), без метки — после условия.
