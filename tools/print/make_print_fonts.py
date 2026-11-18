"""Шрифты для векторного PDF (задача 61, этап 2): fonts/print/*.ttf.

Почему TTF, а не woff2 сайта: pdf-lib встраивает шрифт через fontkit, а
fontkit 1.1.1 на woff2 с составными глифами (й, Ё) зависает при сохранении
PDF. Здесь woff2 распаковываются без потерь (те же глифы и метрики, что
видит браузер при вёрстке листа) и кладутся рядом в fonts/print/.

- onest-<набор>-<вес>.ttf — из fonts/onest-static/ (Onest, SIL OFL)
- KaTeX_<семья>-<начертание>.ttf — из data: в katex-0.18.5.css (KaTeX, SIL OFL / MIT)
- print-sym-400/700.ttf — DejaVu Sans, только символы, которых нет в Onest
  (∠ √ ∞ ⋅ ⇒ ∥ ⩽ греческие, стрелки, мат. операторы), без таблиц
  OpenType-вёрстки; источник — npm dejavu-fonts-ttf@2.37.3, лицензия —
  fonts/DEJAVU-LICENSE.txt. Путь к TTF DejaVu — аргумент --dejavu.

Запуск: python tools/print/make_print_fonts.py --dejavu <папка ttf DejaVu>
Нужен fontTools с brotli (pip install fonttools brotli)."""
import argparse, base64, glob, io, os, re, sys
from fontTools.ttLib import TTFont
from fontTools import subset

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "fonts", "print")
SYM = ("U+0300-036F,U+0370-03FF,U+0460-052F,U+2010-2027,U+2030-205E,U+2100-214F,U+2190-21FF,"
       "U+2200-22FF,U+2300-23FF,U+25A0-25FF,U+27C0-27EF,U+2980-29FF,U+2A00-2AFF")

def to_ttf(src, dst):
    f = TTFont(src); f.flavor = None; f.save(dst)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--dejavu", help="папка с DejaVuSans.ttf и DejaVuSans-Bold.ttf")
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    for p in sorted(glob.glob(os.path.join(ROOT, "fonts", "onest-static", "onest-*.woff2"))):
        to_ttf(p, os.path.join(OUT, os.path.basename(p)[:-6] + ".ttf"))
    css = open(os.path.join(ROOT, "katex-0.18.5.css"), encoding="utf-8").read()
    for m in re.finditer(r"font-family:(KaTeX_\w+);font-style:(\w+);font-weight:(\w+);src:url\(data:font/woff2;base64,([^)]+)\)", css):
        fam, st, w = m.group(1), m.group(2), m.group(3)
        name = fam + "-" + ("Bold" if w in ("700", "bold") else "Regular") + ("Italic" if st == "italic" else "")
        to_ttf(io.BytesIO(base64.b64decode(m.group(4))), os.path.join(OUT, name.replace("RegularItalic", "Italic") + ".ttf"))
    if a.dejavu:
        for w, fn in (("400", "DejaVuSans.ttf"), ("700", "DejaVuSans-Bold.ttf")):
            o = subset.Options(); o.layout_features = []; o.hinting = False; o.notdef_outline = True
            f = TTFont(os.path.join(a.dejavu, fn)); s = subset.Subsetter(o)
            s.populate(unicodes=subset.parse_unicodes(SYM)); s.subset(f); f.save(os.path.join(OUT, "print-sym-%s.ttf" % w))
    print("\n".join(sorted(os.listdir(OUT))))

if __name__ == "__main__":
    main()
