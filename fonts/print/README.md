# Шрифты для векторного PDF (work-pdf.js)

Делает tools/print/make_print_fonts.py (там же — почему TTF, а не woff2).
- onest-*.ttf — fonts/onest-static/*.woff2 без сжатия; Onest, SIL OFL — fonts/OFL-LICENSE.txt
- KaTeX_*.ttf — шрифты из katex-0.18.5.css (data:) без сжатия; KaTeX, MIT, шрифты — SIL OFL
- print-sym-400/700.ttf — DejaVu Sans 2.37 (npm dejavu-fonts-ttf@2.37.3), подмножество символов,
  которых нет в Onest (∠ √ ∞ ⋅ ⇒ ∥ ⩽ греческие, стрелки, операторы); лицензия — fonts/DEJAVU-LICENSE.txt.
  Им же 'WP Sym' в вёрстке листов печати (work-print.js), чтобы место символа на листе и в PDF совпало.
