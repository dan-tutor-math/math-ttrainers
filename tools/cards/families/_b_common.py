"""Общее для плагинов формы Б (b_*.py): мелкие помощники над разметкой банков.
Имя с «_» — сборщик не принимает файл за плагин семьи."""
import re

INLINE_ALT = "в строке"
_VF = re.compile(r'<span class="vf">\s*<span>(.*?)</span>\s*<span>(.*?)</span>\s*</span>', re.S)


def vf_fix(html):
    """Дробь банка .vf (два span подряд) → с классами num/den: collect.js переводит их в c-num/c-den."""
    return _VF.sub(r'<span class="vf"><span class="num">\1</span><span class="den">\2</span></span>', html or "")


def flatten_tables(html):
    """Таблица-обёртка условия (ячейки с текстом и рисунком) → блоки div: в карточке
    таблица — только настоящая таблица данных."""
    html = re.sub(r"<table[^>]*>|</table>|<tbody>|</tbody>|<tr[^>]*>|</tr>", "", html)
    return re.sub(r"<td[^>]*>", "<div>", html).replace("</td>", "</div>")


def conv(page, html, root_dir=None, opts=None):
    """html банка → {html, figs, tables, tex}; относительные src рисунков — от корня сайта."""
    from tools.cards.core import convert_html
    html = vf_fix(html)
    # картинка-«буква» посреди предложения: рендерер пока ставит рисунки блоком, поэтому
    # помечаем её в alt (INLINE_ALT) — когда рендерер научится ставить такие в строку, он
    # найдёт их по этой метке без пересборки
    html = re.sub(r'(<img class="fipi-inline"[^>]*?)alt="[^"]*"', r'\1alt="%s"' % INLINE_ALT, html)
    html = re.sub(r'src="(?!/|https?:|data:)', 'src="/', html)
    return convert_html(page, html, opts)
