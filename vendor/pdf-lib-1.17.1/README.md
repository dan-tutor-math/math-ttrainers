# pdf-lib 1.17.1 + @pdf-lib/fontkit 1.1.1

Векторный PDF работы (work-pdf.js, задача 61 этап 2): текст со встроенными шрифтами.
Грузятся только при «Скачать PDF» / открытии окна печати.

- pdf-lib.min.js — npm pdf-lib@1.17.1, dist/pdf-lib.min.js; лицензия MIT — LICENSE-pdf-lib.md
- fontkit.umd.min.js — npm @pdf-lib/fontkit@1.1.1, dist/fontkit.umd.min.js; лицензия MIT — LICENSE-fontkit.txt (fontkit, Devon Govett; форк Hopding/fontkit)

Файлы как есть, без правок. Известное: fontkit зависает на woff2 с составными глифами —
поэтому шрифты для PDF лежат в fonts/print/ в TTF (tools/print/make_print_fonts.py).

SHA-256:
- pdf-lib.min.js: 0f9a5cad07941f0826586c94e089d89b918c46e5c17cf2d5a3c6f666e3bc694f
- fontkit.umd.min.js: d8df561b9fba98e24f2e5130e40948809281bbbc55a20c412359f1a0a5eb35a6
