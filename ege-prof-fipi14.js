/* ege-prof-fipi14.js — задания ЕГЭ профиль №14 из открытого банка ФИПИ.
   Собирается скриптом (fipi-pilot/tools/ege/export.py), руками не правится.
   Грузится страницей ege_prof.html только когда открыт этот номер (ensureFipi);
   формат и происхождение — в оглавлении ege-prof-fipi.js. */
(window.EGE_PROF_FIPI = window.EGE_PROF_FIPI || { tasks: {} }).tasks['14'] = {
 "sections": [
  {
   "id": "trig",
   "title": "Тригонометрические уравнения"
  },
  {
   "id": "exp",
   "title": "Показательные и логарифмические уравнения"
  }
 ],
 "groups": [
  {
   "id": "quad",
   "section": "trig",
   "title": "Сведение к квадратному уравнению",
   "hint": "Формулы приведения и $\\cos 2x = 1 - 2\\sin^2 x = 2\\cos^2 x - 1$ сводят уравнение к квадратному относительно $\\sin x$ или $\\cos x$. Корни, по модулю большие единицы, не подходят."
  },
  {
   "id": "factor",
   "section": "trig",
   "title": "Разложение на множители",
   "hint": "После формул приведения и $\\sin 2x = 2\\sin x\\cos x$ у слагаемых появляется общий множитель: выносим его и приравниваем к нулю каждый множитель. Делить на общий множитель нельзя — потеряются корни."
  },
  {
   "id": "sum",
   "section": "trig",
   "title": "Синус и косинус суммы",
   "hint": "Раскройте $\\sin(x \\pm \\alpha)$ и $\\cos(x \\pm \\alpha)$ по формулам суммы: часть слагаемых сократится, и останется простейшее уравнение (часто относительно $\\operatorname{tg} x$) или произведение, равное нулю."
  },
  {
   "id": "exptrig",
   "section": "exp",
   "title": "Показательные уравнения с тригонометрией",
   "hint": "Приведите степени к одному основанию. Равенство $a^{f} = a^{g}$ равносильно $f = g$, а уравнение вида $A\\cdot a^{2t} + B\\cdot a^{t} + C = 0$ — квадратное относительно $a^{t}$."
  },
  {
   "id": "logtrig",
   "section": "exp",
   "title": "Логарифмы и дроби с тригонометрией",
   "hint": "Дробь равна нулю, когда числитель равен нулю, а знаменатель определён и не равен нулю. Сначала выпишите ограничения, потом решайте числитель и отбрасывайте лишнее."
  },
  {
   "id": "exp",
   "section": "exp",
   "title": "Показательные уравнения",
   "hint": "Замена $t = a^{x}$ ($t > 0$): уравнение становится алгебраическим относительно $t$. После него возвращаемся к $x$ и сравниваем корни с концами отрезка."
  }
 ],
 "criteria": [
  [
   2,
   "Обоснованно получены верные ответы в обоих пунктах"
  ],
  [
   1,
   "Обоснованно получен верный ответ в пункте <i>а</i> <b>ИЛИ</b> получены неверные ответы из-за вычислительной ошибки, но при этом имеется верная последовательность всех шагов решения обоих пунктов: пункта <i>а</i> и пункта <i>б</i>"
  ],
  [
   0,
   "Решение не соответствует ни одному из критериев, перечисленных выше"
  ]
 ],
 "protos": [
  {
   "id": "14.fipi.0448F1",
   "group": "quad",
   "fipi": "0448F1",
   "text": "а) Решите уравнение $\\cos 2x + \\cos (-x) = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[ -\\dfrac{7\\pi}{2};\\ -2\\pi ]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "-3π; -7π/3",
     "tex": "-3\\pi;\\ -\\dfrac{7\\pi}{3}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{3} + 2\\pi k,\\ k \\in \\mathbb Z$; $-\\dfrac{\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z$; $\\pi + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $-3\\pi;\\ -\\dfrac{7\\pi}{3}$",
   "steps": [
    "а) Так как $\\cos(-x) = \\cos x$ и $\\cos 2x = 2\\cos^2 x - 1$, получаем: $$2\\cos^2 x - 1 + \\cos x = 0$$ $$2\\cos^2 x + \\cos x - 1 = 0$$ $$(2\\cos x - 1)(\\cos x + 1) = 0$$",
    "Значит, $\\cos x = \\dfrac{1}{2}$, откуда $$x = \\dfrac{\\pi}{3} + 2\\pi k,\\ k \\in \\mathbb Z,$$ $$x = -\\dfrac{\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z,$$ или $\\cos x = -1$, откуда $$x = \\pi + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[ -\\dfrac{7\\pi}{2};\\ -2\\pi ]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{3} + 2\\pi k$: $$-\\dfrac{7\\pi}{2} \\le \\dfrac{\\pi}{3} + 2\\pi k \\le -2\\pi$$ $$-\\dfrac{23}{12} \\le k \\le -\\dfrac{7}{6}$$ $$\\text{целых } k \\text{ нет}$$",
    "Серия $-\\dfrac{\\pi}{3} + 2\\pi n$: $$-\\dfrac{7\\pi}{2} \\le -\\dfrac{\\pi}{3} + 2\\pi n \\le -2\\pi$$ $$-\\dfrac{19}{12} \\le n \\le -\\dfrac{5}{6}$$ $$n = -1$$ $$x = -\\dfrac{7\\pi}{3}$$",
    "Серия $\\pi + 2\\pi m$: $$-\\dfrac{7\\pi}{2} \\le \\pi + 2\\pi m \\le -2\\pi$$ $$-\\dfrac{9}{4} \\le m \\le -\\dfrac{3}{2}$$ $$m = -2$$ $$x = -3\\pi$$ Получаем числа: $$-3\\pi;\\ -\\dfrac{7\\pi}{3}.$$"
   ]
  },
  {
   "id": "14.fipi.209e7e",
   "group": "quad",
   "fipi": "209e7e",
   "text": "а) Решите уравнение $2\\cos x - 2\\sqrt{3}\\cos (-x) - 4\\sin^{2} x = \\sqrt{3} - 4$.<br>б) Найдите все корни этого уравнения, принадлежащие отрезку $[2\\pi;\\, \\dfrac{7\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "13π/6; 8π/3; 10π/3",
     "tex": "\\dfrac{13\\pi}{6};\\ \\dfrac{8\\pi}{3};\\ \\dfrac{10\\pi}{3}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{6} + 2\\pi k,\\ k \\in \\mathbb Z$; $-\\dfrac{\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z$; $\\dfrac{2\\pi}{3} + 2\\pi m,\\ m \\in \\mathbb Z$; $-\\dfrac{2\\pi}{3} + 2\\pi l,\\ l \\in \\mathbb Z$<br>б) $\\dfrac{13\\pi}{6};\\ \\dfrac{8\\pi}{3};\\ \\dfrac{10\\pi}{3}$",
   "steps": [
    "а) Так как $\\cos(-x) = \\cos x$ и $\\sin^2 x = 1 - \\cos^2 x$, получаем: $$2\\cos x - 2\\sqrt3\\cos x - 4 + 4\\cos^2 x = \\sqrt3 - 4$$ $$4\\cos^2 x + \\left(2 - 2\\sqrt3\\right)\\cos x - \\sqrt3 = 0$$ $$\\left(2\\cos x - \\sqrt3\\right)(2\\cos x + 1) = 0$$",
    "Значит, $\\cos x = \\dfrac{\\sqrt3}{2}$, откуда $$x = \\pm\\dfrac{\\pi}{6} + 2\\pi k,\\ k \\in \\mathbb Z,$$ или $\\cos x = -\\dfrac{1}{2}$, откуда $$x = \\pm\\dfrac{2\\pi}{3} + 2\\pi m,\\ m \\in \\mathbb Z.$$ Для отбора запишем серии по отдельности: $$x = \\dfrac{\\pi}{6} + 2\\pi k;\\quad x = -\\dfrac{\\pi}{6} + 2\\pi n;$$ $$x = \\dfrac{2\\pi}{3} + 2\\pi m;\\quad x = -\\dfrac{2\\pi}{3} + 2\\pi l.$$",
    "б) Отберём корни, принадлежащие отрезку $[2\\pi;\\, \\dfrac{7\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{6} + 2\\pi k$: $$2\\pi \\le \\dfrac{\\pi}{6} + 2\\pi k \\le \\dfrac{7\\pi}{2}$$ $$\\dfrac{11}{12} \\le k \\le \\dfrac{5}{3}$$ $$k = 1$$ $$x = \\dfrac{13\\pi}{6}$$",
    "Серия $-\\dfrac{\\pi}{6} + 2\\pi n$: $$2\\pi \\le -\\dfrac{\\pi}{6} + 2\\pi n \\le \\dfrac{7\\pi}{2}$$ $$\\dfrac{13}{12} \\le n \\le \\dfrac{11}{6}$$ $$\\text{целых } n \\text{ нет}$$",
    "Серия $\\dfrac{2\\pi}{3} + 2\\pi m$: $$2\\pi \\le \\dfrac{2\\pi}{3} + 2\\pi m \\le \\dfrac{7\\pi}{2}$$ $$\\dfrac{2}{3} \\le m \\le \\dfrac{17}{12}$$ $$m = 1$$ $$x = \\dfrac{8\\pi}{3}$$",
    "Серия $-\\dfrac{2\\pi}{3} + 2\\pi l$: $$2\\pi \\le -\\dfrac{2\\pi}{3} + 2\\pi l \\le \\dfrac{7\\pi}{2}$$ $$\\dfrac{4}{3} \\le l \\le \\dfrac{25}{12}$$ $$l = 2$$ $$x = \\dfrac{10\\pi}{3}$$ Получаем числа: $$\\dfrac{13\\pi}{6};\\ \\dfrac{8\\pi}{3};\\ \\dfrac{10\\pi}{3}.$$"
   ]
  },
  {
   "id": "14.fipi.2D54B0",
   "group": "quad",
   "fipi": "2D54B0",
   "text": "а) Решите уравнение $\\cos 2x - 3\\sin (-x) - 2 = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[3\\pi;\\, \\dfrac{9\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "25π/6; 9π/2",
     "tex": "\\dfrac{25\\pi}{6};\\ \\dfrac{9\\pi}{2}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{2} + 2\\pi k,\\ k \\in \\mathbb Z$; $\\dfrac{\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z$; $\\dfrac{5\\pi}{6} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $\\dfrac{25\\pi}{6};\\ \\dfrac{9\\pi}{2}$",
   "steps": [
    "а) Так как $\\sin(-x) = -\\sin x$ и $\\cos 2x = 1 - 2\\sin^2 x$, получаем: $$1 - 2\\sin^2 x + 3\\sin x - 2 = 0$$ $$2\\sin^2 x - 3\\sin x + 1 = 0$$ $$(\\sin x - 1)(2\\sin x - 1) = 0$$",
    "Значит, $\\sin x = 1$, откуда $$x = \\dfrac{\\pi}{2} + 2\\pi k,\\ k \\in \\mathbb Z,$$ или $\\sin x = \\dfrac{1}{2}$, откуда $$x = \\dfrac{\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z,$$ $$x = \\dfrac{5\\pi}{6} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[3\\pi;\\, \\dfrac{9\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{2} + 2\\pi k$: $$3\\pi \\le \\dfrac{\\pi}{2} + 2\\pi k \\le \\dfrac{9\\pi}{2}$$ $$\\dfrac{5}{4} \\le k \\le 2$$ $$k = 2$$ $$x = \\dfrac{9\\pi}{2}$$",
    "Серия $\\dfrac{\\pi}{6} + 2\\pi n$: $$3\\pi \\le \\dfrac{\\pi}{6} + 2\\pi n \\le \\dfrac{9\\pi}{2}$$ $$\\dfrac{17}{12} \\le n \\le \\dfrac{13}{6}$$ $$n = 2$$ $$x = \\dfrac{25\\pi}{6}$$",
    "Серия $\\dfrac{5\\pi}{6} + 2\\pi m$: $$3\\pi \\le \\dfrac{5\\pi}{6} + 2\\pi m \\le \\dfrac{9\\pi}{2}$$ $$\\dfrac{13}{12} \\le m \\le \\dfrac{11}{6}$$ $$\\text{целых } m \\text{ нет}$$ Получаем числа: $$\\dfrac{25\\pi}{6};\\ \\dfrac{9\\pi}{2}.$$"
   ]
  },
  {
   "id": "14.fipi.34BB16",
   "group": "quad",
   "fipi": "34BB16",
   "text": "а) Решите уравнение $2 + 2\\cos (\\pi - 2x) + \\sqrt{8}\\sin x = \\sqrt{6} + \\sqrt{12}\\sin x$.<br>б) Найдите все корни этого уравнения, принадлежащие отрезку $[3\\pi;\\, \\dfrac{9\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "13π/4; 15π/4; 13π/3",
     "tex": "\\dfrac{13\\pi}{4};\\ \\dfrac{15\\pi}{4};\\ \\dfrac{13\\pi}{3}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{3} + 2\\pi k,\\ k \\in \\mathbb Z$; $\\dfrac{2\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z$; $-\\dfrac{\\pi}{4} + 2\\pi m,\\ m \\in \\mathbb Z$; $-\\dfrac{3\\pi}{4} + 2\\pi l,\\ l \\in \\mathbb Z$<br>б) $\\dfrac{13\\pi}{4};\\ \\dfrac{15\\pi}{4};\\ \\dfrac{13\\pi}{3}$",
   "steps": [
    "а) Так как $\\cos(\\pi - 2x) = -\\cos 2x = 2\\sin^2 x - 1$, $\\sqrt8 = 2\\sqrt2$, $\\sqrt{12} = 2\\sqrt3$, получаем: $$2 + 4\\sin^2 x - 2 + 2\\sqrt2\\sin x = \\sqrt6 + 2\\sqrt3\\sin x$$ $$4\\sin^2 x + \\left(2\\sqrt2 - 2\\sqrt3\\right)\\sin x - \\sqrt6 = 0$$ $$\\left(2\\sin x - \\sqrt3\\right)\\left(2\\sin x + \\sqrt2\\right) = 0$$",
    "Значит, $\\sin x = \\dfrac{\\sqrt3}{2}$, откуда $$x = \\dfrac{\\pi}{3} + 2\\pi k,\\ k \\in \\mathbb Z,$$ $$x = \\dfrac{2\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z,$$ или $\\sin x = -\\dfrac{\\sqrt2}{2}$, откуда $$x = -\\dfrac{\\pi}{4} + 2\\pi m,\\ m \\in \\mathbb Z,$$ $$x = -\\dfrac{3\\pi}{4} + 2\\pi l,\\ l \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[3\\pi;\\, \\dfrac{9\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{3} + 2\\pi k$: $$3\\pi \\le \\dfrac{\\pi}{3} + 2\\pi k \\le \\dfrac{9\\pi}{2}$$ $$\\dfrac{4}{3} \\le k \\le \\dfrac{25}{12}$$ $$k = 2$$ $$x = \\dfrac{13\\pi}{3}$$",
    "Серия $\\dfrac{2\\pi}{3} + 2\\pi n$: $$3\\pi \\le \\dfrac{2\\pi}{3} + 2\\pi n \\le \\dfrac{9\\pi}{2}$$ $$\\dfrac{7}{6} \\le n \\le \\dfrac{23}{12}$$ $$\\text{целых } n \\text{ нет}$$",
    "Серия $-\\dfrac{\\pi}{4} + 2\\pi m$: $$3\\pi \\le -\\dfrac{\\pi}{4} + 2\\pi m \\le \\dfrac{9\\pi}{2}$$ $$\\dfrac{13}{8} \\le m \\le \\dfrac{19}{8}$$ $$m = 2$$ $$x = \\dfrac{15\\pi}{4}$$",
    "Серия $-\\dfrac{3\\pi}{4} + 2\\pi l$: $$3\\pi \\le -\\dfrac{3\\pi}{4} + 2\\pi l \\le \\dfrac{9\\pi}{2}$$ $$\\dfrac{15}{8} \\le l \\le \\dfrac{21}{8}$$ $$l = 2$$ $$x = \\dfrac{13\\pi}{4}$$ Получаем числа: $$\\dfrac{13\\pi}{4};\\ \\dfrac{15\\pi}{4};\\ \\dfrac{13\\pi}{3}.$$"
   ]
  },
  {
   "id": "14.fipi.E4EA28",
   "group": "quad",
   "fipi": "E4EA28",
   "text": "а) Решите уравнение $\\sqrt{3}\\operatorname{tg}^{2} x - 4\\operatorname{tg} x + \\sqrt{3} = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[\\pi;\\, \\dfrac{5\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "7π/6; 4π/3; 13π/6; 7π/3",
     "tex": "\\dfrac{7\\pi}{6};\\ \\dfrac{4\\pi}{3};\\ \\dfrac{13\\pi}{6};\\ \\dfrac{7\\pi}{3}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{3} + \\pi k,\\ k \\in \\mathbb Z$; $\\dfrac{\\pi}{6} + \\pi n,\\ n \\in \\mathbb Z$<br>б) $\\dfrac{7\\pi}{6};\\ \\dfrac{4\\pi}{3};\\ \\dfrac{13\\pi}{6};\\ \\dfrac{7\\pi}{3}$",
   "steps": [
    "а) Сделаем замену $t = \\operatorname{tg} x$: $$\\sqrt3t^2 - 4t + \\sqrt3 = 0$$ $$D = 16 - 4 \\cdot \\sqrt3 \\cdot \\sqrt3 = 4$$ $$t = \\dfrac{4 \\pm 2}{2\\sqrt3}$$ $$t_1 = \\sqrt3,\\quad t_2 = \\dfrac{1}{\\sqrt3}$$",
    "Значит, $\\operatorname{tg} x = \\sqrt3$, откуда $$x = \\dfrac{\\pi}{3} + \\pi k,\\ k \\in \\mathbb Z,$$ или $\\operatorname{tg} x = \\dfrac{\\sqrt3}{3}$, откуда $$x = \\dfrac{\\pi}{6} + \\pi n,\\ n \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[\\pi;\\, \\dfrac{5\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{3} + \\pi k$: $$\\pi \\le \\dfrac{\\pi}{3} + \\pi k \\le \\dfrac{5\\pi}{2}$$ $$\\dfrac{2}{3} \\le k \\le \\dfrac{13}{6}$$ $$k = 1;\\ 2$$ $$x = \\dfrac{4\\pi}{3};\\ \\dfrac{7\\pi}{3}$$",
    "Серия $\\dfrac{\\pi}{6} + \\pi n$: $$\\pi \\le \\dfrac{\\pi}{6} + \\pi n \\le \\dfrac{5\\pi}{2}$$ $$\\dfrac{5}{6} \\le n \\le \\dfrac{7}{3}$$ $$n = 1;\\ 2$$ $$x = \\dfrac{7\\pi}{6};\\ \\dfrac{13\\pi}{6}$$ Получаем числа: $$\\dfrac{7\\pi}{6};\\ \\dfrac{4\\pi}{3};\\ \\dfrac{13\\pi}{6};\\ \\dfrac{7\\pi}{3}.$$"
   ]
  },
  {
   "id": "14.fipi.E0B0CA",
   "group": "quad",
   "fipi": "E0B0CA",
   "text": "а) Решите уравнение $2\\cos^{2} x + 3\\sin (x + \\pi) - 3 = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[2\\pi;\\, \\dfrac{7\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "19π/6; 7π/2",
     "tex": "\\dfrac{19\\pi}{6};\\ \\dfrac{7\\pi}{2}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $-\\dfrac{\\pi}{2} + 2\\pi k,\\ k \\in \\mathbb Z$; $-\\dfrac{\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z$; $-\\dfrac{5\\pi}{6} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $\\dfrac{19\\pi}{6};\\ \\dfrac{7\\pi}{2}$",
   "steps": [
    "а) Так как $\\sin(x + \\pi) = -\\sin x$ и $\\cos^2 x = 1 - \\sin^2 x$, получаем: $$2 - 2\\sin^2 x - 3\\sin x - 3 = 0$$ $$2\\sin^2 x + 3\\sin x + 1 = 0$$ $$(\\sin x + 1)(2\\sin x + 1) = 0$$",
    "Значит, $\\sin x = -1$, откуда $$x = -\\dfrac{\\pi}{2} + 2\\pi k,\\ k \\in \\mathbb Z,$$ или $\\sin x = -\\dfrac{1}{2}$, откуда $$x = -\\dfrac{\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z,$$ $$x = -\\dfrac{5\\pi}{6} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[2\\pi;\\, \\dfrac{7\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $-\\dfrac{\\pi}{2} + 2\\pi k$: $$2\\pi \\le -\\dfrac{\\pi}{2} + 2\\pi k \\le \\dfrac{7\\pi}{2}$$ $$\\dfrac{5}{4} \\le k \\le 2$$ $$k = 2$$ $$x = \\dfrac{7\\pi}{2}$$",
    "Серия $-\\dfrac{\\pi}{6} + 2\\pi n$: $$2\\pi \\le -\\dfrac{\\pi}{6} + 2\\pi n \\le \\dfrac{7\\pi}{2}$$ $$\\dfrac{13}{12} \\le n \\le \\dfrac{11}{6}$$ $$\\text{целых } n \\text{ нет}$$",
    "Серия $-\\dfrac{5\\pi}{6} + 2\\pi m$: $$2\\pi \\le -\\dfrac{5\\pi}{6} + 2\\pi m \\le \\dfrac{7\\pi}{2}$$ $$\\dfrac{17}{12} \\le m \\le \\dfrac{13}{6}$$ $$m = 2$$ $$x = \\dfrac{19\\pi}{6}$$ Получаем числа: $$\\dfrac{19\\pi}{6};\\ \\dfrac{7\\pi}{2}.$$"
   ]
  },
  {
   "id": "14.fipi.46249A",
   "group": "quad",
   "fipi": "46249A",
   "text": "а) Решите уравнение $2\\cos^{2} x + 3\\sin (-x) - 3 = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[2\\pi;\\, \\dfrac{7\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "19π/6; 7π/2",
     "tex": "\\dfrac{19\\pi}{6};\\ \\dfrac{7\\pi}{2}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $-\\dfrac{\\pi}{2} + 2\\pi k,\\ k \\in \\mathbb Z$; $-\\dfrac{\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z$; $-\\dfrac{5\\pi}{6} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $\\dfrac{19\\pi}{6};\\ \\dfrac{7\\pi}{2}$",
   "steps": [
    "а) Так как $\\sin(-x) = -\\sin x$ и $\\cos^2 x = 1 - \\sin^2 x$, получаем: $$2 - 2\\sin^2 x - 3\\sin x - 3 = 0$$ $$2\\sin^2 x + 3\\sin x + 1 = 0$$ $$(\\sin x + 1)(2\\sin x + 1) = 0$$",
    "Значит, $\\sin x = -1$, откуда $$x = -\\dfrac{\\pi}{2} + 2\\pi k,\\ k \\in \\mathbb Z,$$ или $\\sin x = -\\dfrac{1}{2}$, откуда $$x = -\\dfrac{\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z,$$ $$x = -\\dfrac{5\\pi}{6} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[2\\pi;\\, \\dfrac{7\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $-\\dfrac{\\pi}{2} + 2\\pi k$: $$2\\pi \\le -\\dfrac{\\pi}{2} + 2\\pi k \\le \\dfrac{7\\pi}{2}$$ $$\\dfrac{5}{4} \\le k \\le 2$$ $$k = 2$$ $$x = \\dfrac{7\\pi}{2}$$",
    "Серия $-\\dfrac{\\pi}{6} + 2\\pi n$: $$2\\pi \\le -\\dfrac{\\pi}{6} + 2\\pi n \\le \\dfrac{7\\pi}{2}$$ $$\\dfrac{13}{12} \\le n \\le \\dfrac{11}{6}$$ $$\\text{целых } n \\text{ нет}$$",
    "Серия $-\\dfrac{5\\pi}{6} + 2\\pi m$: $$2\\pi \\le -\\dfrac{5\\pi}{6} + 2\\pi m \\le \\dfrac{7\\pi}{2}$$ $$\\dfrac{17}{12} \\le m \\le \\dfrac{13}{6}$$ $$m = 2$$ $$x = \\dfrac{19\\pi}{6}$$ Получаем числа: $$\\dfrac{19\\pi}{6};\\ \\dfrac{7\\pi}{2}.$$"
   ]
  },
  {
   "id": "14.fipi.34CAC3",
   "group": "quad",
   "fipi": "34CAC3",
   "text": "а) Решите уравнение $2\\sin^{2} x + \\cos (-x) - 1 = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[ -\\dfrac{9\\pi}{2};\\ -3\\pi ]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "-4π; -10π/3",
     "tex": "-4\\pi;\\ -\\dfrac{10\\pi}{3}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $2\\pi k,\\ k \\in \\mathbb Z$; $\\dfrac{2\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z$; $-\\dfrac{2\\pi}{3} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $-4\\pi;\\ -\\dfrac{10\\pi}{3}$",
   "steps": [
    "а) Так как $\\cos(-x) = \\cos x$ и $\\sin^2 x = 1 - \\cos^2 x$, получаем: $$2 - 2\\cos^2 x + \\cos x - 1 = 0$$ $$2\\cos^2 x - \\cos x - 1 = 0$$ $$(\\cos x - 1)(2\\cos x + 1) = 0$$",
    "Значит, $\\cos x = 1$, откуда $$x = 2\\pi k,\\ k \\in \\mathbb Z,$$ или $\\cos x = -\\dfrac{1}{2}$, откуда $$x = \\dfrac{2\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z,$$ $$x = -\\dfrac{2\\pi}{3} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[ -\\dfrac{9\\pi}{2};\\ -3\\pi ]$, с помощью двойных неравенств.",
    "Серия $2\\pi k$: $$-\\dfrac{9\\pi}{2} \\le 2\\pi k \\le -3\\pi$$ $$-\\dfrac{9}{4} \\le k \\le -\\dfrac{3}{2}$$ $$k = -2$$ $$x = -4\\pi$$",
    "Серия $\\dfrac{2\\pi}{3} + 2\\pi n$: $$-\\dfrac{9\\pi}{2} \\le \\dfrac{2\\pi}{3} + 2\\pi n \\le -3\\pi$$ $$-\\dfrac{31}{12} \\le n \\le -\\dfrac{11}{6}$$ $$n = -2$$ $$x = -\\dfrac{10\\pi}{3}$$",
    "Серия $-\\dfrac{2\\pi}{3} + 2\\pi m$: $$-\\dfrac{9\\pi}{2} \\le -\\dfrac{2\\pi}{3} + 2\\pi m \\le -3\\pi$$ $$-\\dfrac{23}{12} \\le m \\le -\\dfrac{7}{6}$$ $$\\text{целых } m \\text{ нет}$$ Получаем числа: $$-4\\pi;\\ -\\dfrac{10\\pi}{3}.$$"
   ]
  },
  {
   "id": "14.fipi.A67297",
   "group": "quad",
   "fipi": "A67297",
   "text": "а) Решите уравнение $2\\sin x + 2\\sqrt{3}\\sin (-x) - 4\\cos^{2} x = \\sqrt{3} - 4$.<br>б) Найдите все корни этого уравнения, принадлежащие отрезку $[2\\pi;\\, \\dfrac{7\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "7π/3; 8π/3; 19π/6",
     "tex": "\\dfrac{7\\pi}{3};\\ \\dfrac{8\\pi}{3};\\ \\dfrac{19\\pi}{6}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{3} + 2\\pi k,\\ k \\in \\mathbb Z$; $\\dfrac{2\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z$; $-\\dfrac{\\pi}{6} + 2\\pi m,\\ m \\in \\mathbb Z$; $-\\dfrac{5\\pi}{6} + 2\\pi l,\\ l \\in \\mathbb Z$<br>б) $\\dfrac{7\\pi}{3};\\ \\dfrac{8\\pi}{3};\\ \\dfrac{19\\pi}{6}$",
   "steps": [
    "а) Так как $\\sin(-x) = -\\sin x$ и $\\cos^2 x = 1 - \\sin^2 x$, получаем: $$2\\sin x - 2\\sqrt3\\sin x - 4 + 4\\sin^2 x = \\sqrt3 - 4$$ $$4\\sin^2 x + \\left(2 - 2\\sqrt3\\right)\\sin x - \\sqrt3 = 0$$ $$\\left(2\\sin x - \\sqrt3\\right)(2\\sin x + 1) = 0$$",
    "Значит, $\\sin x = \\dfrac{\\sqrt3}{2}$, откуда $$x = \\dfrac{\\pi}{3} + 2\\pi k,\\ k \\in \\mathbb Z,$$ $$x = \\dfrac{2\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z,$$ или $\\sin x = -\\dfrac{1}{2}$, откуда $$x = -\\dfrac{\\pi}{6} + 2\\pi m,\\ m \\in \\mathbb Z,$$ $$x = -\\dfrac{5\\pi}{6} + 2\\pi l,\\ l \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[2\\pi;\\, \\dfrac{7\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{3} + 2\\pi k$: $$2\\pi \\le \\dfrac{\\pi}{3} + 2\\pi k \\le \\dfrac{7\\pi}{2}$$ $$\\dfrac{5}{6} \\le k \\le \\dfrac{19}{12}$$ $$k = 1$$ $$x = \\dfrac{7\\pi}{3}$$",
    "Серия $\\dfrac{2\\pi}{3} + 2\\pi n$: $$2\\pi \\le \\dfrac{2\\pi}{3} + 2\\pi n \\le \\dfrac{7\\pi}{2}$$ $$\\dfrac{2}{3} \\le n \\le \\dfrac{17}{12}$$ $$n = 1$$ $$x = \\dfrac{8\\pi}{3}$$",
    "Серия $-\\dfrac{\\pi}{6} + 2\\pi m$: $$2\\pi \\le -\\dfrac{\\pi}{6} + 2\\pi m \\le \\dfrac{7\\pi}{2}$$ $$\\dfrac{13}{12} \\le m \\le \\dfrac{11}{6}$$ $$\\text{целых } m \\text{ нет}$$",
    "Серия $-\\dfrac{5\\pi}{6} + 2\\pi l$: $$2\\pi \\le -\\dfrac{5\\pi}{6} + 2\\pi l \\le \\dfrac{7\\pi}{2}$$ $$\\dfrac{17}{12} \\le l \\le \\dfrac{13}{6}$$ $$l = 2$$ $$x = \\dfrac{19\\pi}{6}$$ Получаем числа: $$\\dfrac{7\\pi}{3};\\ \\dfrac{8\\pi}{3};\\ \\dfrac{19\\pi}{6}.$$"
   ]
  },
  {
   "id": "14.fipi.72Beec",
   "group": "quad",
   "fipi": "72Beec",
   "text": "а) Решите уравнение $2 - 2\\cos (\\pi - 2x) + \\sqrt{8}\\cos x = \\sqrt{6} + \\sqrt{12}\\cos x$.<br>б) Найдите все корни этого уравнения, принадлежащие отрезку $[3\\pi;\\, \\dfrac{9\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "13π/4; 23π/6; 25π/6",
     "tex": "\\dfrac{13\\pi}{4};\\ \\dfrac{23\\pi}{6};\\ \\dfrac{25\\pi}{6}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{6} + 2\\pi k,\\ k \\in \\mathbb Z$; $-\\dfrac{\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z$; $\\dfrac{3\\pi}{4} + 2\\pi m,\\ m \\in \\mathbb Z$; $-\\dfrac{3\\pi}{4} + 2\\pi l,\\ l \\in \\mathbb Z$<br>б) $\\dfrac{13\\pi}{4};\\ \\dfrac{23\\pi}{6};\\ \\dfrac{25\\pi}{6}$",
   "steps": [
    "а) Так как $\\cos(\\pi - 2x) = -\\cos 2x = 1 - 2\\cos^2 x$, $\\sqrt8 = 2\\sqrt2$, $\\sqrt{12} = 2\\sqrt3$, получаем: $$2 - 2 + 4\\cos^2 x + 2\\sqrt2\\cos x = \\sqrt6 + 2\\sqrt3\\cos x$$ $$4\\cos^2 x + \\left(2\\sqrt2 - 2\\sqrt3\\right)\\cos x - \\sqrt6 = 0$$ $$\\left(2\\cos x - \\sqrt3\\right)\\left(2\\cos x + \\sqrt2\\right) = 0$$",
    "Значит, $\\cos x = \\dfrac{\\sqrt3}{2}$, откуда $$x = \\dfrac{\\pi}{6} + 2\\pi k,\\ k \\in \\mathbb Z,$$ $$x = -\\dfrac{\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z,$$ или $\\cos x = -\\dfrac{\\sqrt2}{2}$, откуда $$x = \\dfrac{3\\pi}{4} + 2\\pi m,\\ m \\in \\mathbb Z,$$ $$x = -\\dfrac{3\\pi}{4} + 2\\pi l,\\ l \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[3\\pi;\\, \\dfrac{9\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{6} + 2\\pi k$: $$3\\pi \\le \\dfrac{\\pi}{6} + 2\\pi k \\le \\dfrac{9\\pi}{2}$$ $$\\dfrac{17}{12} \\le k \\le \\dfrac{13}{6}$$ $$k = 2$$ $$x = \\dfrac{25\\pi}{6}$$",
    "Серия $-\\dfrac{\\pi}{6} + 2\\pi n$: $$3\\pi \\le -\\dfrac{\\pi}{6} + 2\\pi n \\le \\dfrac{9\\pi}{2}$$ $$\\dfrac{19}{12} \\le n \\le \\dfrac{7}{3}$$ $$n = 2$$ $$x = \\dfrac{23\\pi}{6}$$",
    "Серия $\\dfrac{3\\pi}{4} + 2\\pi m$: $$3\\pi \\le \\dfrac{3\\pi}{4} + 2\\pi m \\le \\dfrac{9\\pi}{2}$$ $$\\dfrac{9}{8} \\le m \\le \\dfrac{15}{8}$$ $$\\text{целых } m \\text{ нет}$$",
    "Серия $-\\dfrac{3\\pi}{4} + 2\\pi l$: $$3\\pi \\le -\\dfrac{3\\pi}{4} + 2\\pi l \\le \\dfrac{9\\pi}{2}$$ $$\\dfrac{15}{8} \\le l \\le \\dfrac{21}{8}$$ $$l = 2$$ $$x = \\dfrac{13\\pi}{4}$$ Получаем числа: $$\\dfrac{13\\pi}{4};\\ \\dfrac{23\\pi}{6};\\ \\dfrac{25\\pi}{6}.$$"
   ]
  },
  {
   "id": "14.fipi.78516c",
   "group": "quad",
   "fipi": "78516c",
   "text": "а) Решите уравнение $1 - \\cos 2x + \\sqrt{2}\\sin x = \\sqrt{2} - 2\\sin (x + \\pi)$.<br>б) Найдите все корни этого уравнения, принадлежащие отрезку $[ - 3\\pi;\\ -\\dfrac{3\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "-11π/4; -9π/4; -3π/2",
     "tex": "-\\dfrac{11\\pi}{4};\\ -\\dfrac{9\\pi}{4};\\ -\\dfrac{3\\pi}{2}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{2} + 2\\pi k,\\ k \\in \\mathbb Z$; $-\\dfrac{\\pi}{4} + 2\\pi n,\\ n \\in \\mathbb Z$; $-\\dfrac{3\\pi}{4} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $-\\dfrac{11\\pi}{4};\\ -\\dfrac{9\\pi}{4};\\ -\\dfrac{3\\pi}{2}$",
   "steps": [
    "а) Так как $1 - \\cos 2x = 2\\sin^2 x$ и $\\sin(x + \\pi) = -\\sin x$, получаем: $$2\\sin^2 x + \\sqrt2\\sin x = \\sqrt2 + 2\\sin x$$ $$2\\sin^2 x + \\left(\\sqrt2 - 2\\right)\\sin x - \\sqrt2 = 0$$ $$(\\sin x - 1)\\left(2\\sin x + \\sqrt2\\right) = 0$$",
    "Значит, $\\sin x = 1$, откуда $$x = \\dfrac{\\pi}{2} + 2\\pi k,\\ k \\in \\mathbb Z,$$ или $\\sin x = -\\dfrac{\\sqrt2}{2}$, откуда $$x = -\\dfrac{\\pi}{4} + 2\\pi n,\\ n \\in \\mathbb Z,$$ $$x = -\\dfrac{3\\pi}{4} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[ - 3\\pi;\\ -\\dfrac{3\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{2} + 2\\pi k$: $$-3\\pi \\le \\dfrac{\\pi}{2} + 2\\pi k \\le -\\dfrac{3\\pi}{2}$$ $$-\\dfrac{7}{4} \\le k \\le -1$$ $$k = -1$$ $$x = -\\dfrac{3\\pi}{2}$$",
    "Серия $-\\dfrac{\\pi}{4} + 2\\pi n$: $$-3\\pi \\le -\\dfrac{\\pi}{4} + 2\\pi n \\le -\\dfrac{3\\pi}{2}$$ $$-\\dfrac{11}{8} \\le n \\le -\\dfrac{5}{8}$$ $$n = -1$$ $$x = -\\dfrac{9\\pi}{4}$$",
    "Серия $-\\dfrac{3\\pi}{4} + 2\\pi m$: $$-3\\pi \\le -\\dfrac{3\\pi}{4} + 2\\pi m \\le -\\dfrac{3\\pi}{2}$$ $$-\\dfrac{9}{8} \\le m \\le -\\dfrac{3}{8}$$ $$m = -1$$ $$x = -\\dfrac{11\\pi}{4}$$ Получаем числа: $$-\\dfrac{11\\pi}{4};\\ -\\dfrac{9\\pi}{4};\\ -\\dfrac{3\\pi}{2}.$$"
   ]
  },
  {
   "id": "14.fipi.716236",
   "group": "quad",
   "fipi": "716236",
   "text": "а) Решите уравнение $1 - \\cos 2x + \\sqrt{3}\\sin x = \\sqrt{3} - 2\\sin (x - \\pi)$.<br>б) Найдите все корни этого уравнения, принадлежащие отрезку $[ - 5\\pi;\\ -\\dfrac{7\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "-14π/3; -13π/3; -7π/2",
     "tex": "-\\dfrac{14\\pi}{3};\\ -\\dfrac{13\\pi}{3};\\ -\\dfrac{7\\pi}{2}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{2} + 2\\pi k,\\ k \\in \\mathbb Z$; $-\\dfrac{\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z$; $-\\dfrac{2\\pi}{3} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $-\\dfrac{14\\pi}{3};\\ -\\dfrac{13\\pi}{3};\\ -\\dfrac{7\\pi}{2}$",
   "steps": [
    "а) Так как $1 - \\cos 2x = 2\\sin^2 x$ и $\\sin(x - \\pi) = -\\sin x$, получаем: $$2\\sin^2 x + \\sqrt3\\sin x = \\sqrt3 + 2\\sin x$$ $$2\\sin^2 x + \\left(\\sqrt3 - 2\\right)\\sin x - \\sqrt3 = 0$$ $$(\\sin x - 1)\\left(2\\sin x + \\sqrt3\\right) = 0$$",
    "Значит, $\\sin x = 1$, откуда $$x = \\dfrac{\\pi}{2} + 2\\pi k,\\ k \\in \\mathbb Z,$$ или $\\sin x = -\\dfrac{\\sqrt3}{2}$, откуда $$x = -\\dfrac{\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z,$$ $$x = -\\dfrac{2\\pi}{3} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[ - 5\\pi;\\ -\\dfrac{7\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{2} + 2\\pi k$: $$-5\\pi \\le \\dfrac{\\pi}{2} + 2\\pi k \\le -\\dfrac{7\\pi}{2}$$ $$-\\dfrac{11}{4} \\le k \\le -2$$ $$k = -2$$ $$x = -\\dfrac{7\\pi}{2}$$",
    "Серия $-\\dfrac{\\pi}{3} + 2\\pi n$: $$-5\\pi \\le -\\dfrac{\\pi}{3} + 2\\pi n \\le -\\dfrac{7\\pi}{2}$$ $$-\\dfrac{7}{3} \\le n \\le -\\dfrac{19}{12}$$ $$n = -2$$ $$x = -\\dfrac{13\\pi}{3}$$",
    "Серия $-\\dfrac{2\\pi}{3} + 2\\pi m$: $$-5\\pi \\le -\\dfrac{2\\pi}{3} + 2\\pi m \\le -\\dfrac{7\\pi}{2}$$ $$-\\dfrac{13}{6} \\le m \\le -\\dfrac{17}{12}$$ $$m = -2$$ $$x = -\\dfrac{14\\pi}{3}$$ Получаем числа: $$-\\dfrac{14\\pi}{3};\\ -\\dfrac{13\\pi}{3};\\ -\\dfrac{7\\pi}{2}.$$"
   ]
  },
  {
   "id": "14.fipi.24AAD1",
   "group": "factor",
   "fipi": "24AAD1",
   "text": "а) Решите уравнение $\\cos 2x + \\sqrt{2}\\cos (x + \\pi) + 1 = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[ -4\\pi;\\ -\\dfrac{5\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "-15π/4; -7π/2; -5π/2",
     "tex": "-\\dfrac{15\\pi}{4};\\ -\\dfrac{7\\pi}{2};\\ -\\dfrac{5\\pi}{2}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{2} + \\pi k,\\ k \\in \\mathbb Z$; $\\dfrac{\\pi}{4} + 2\\pi n,\\ n \\in \\mathbb Z$; $-\\dfrac{\\pi}{4} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $-\\dfrac{15\\pi}{4};\\ -\\dfrac{7\\pi}{2};\\ -\\dfrac{5\\pi}{2}$",
   "steps": [
    "а) Запишем исходное уравнение в виде: $$2\\cos^2 x - 1 - \\sqrt2\\cos x + 1 = 0$$ $$2\\cos^2 x - \\sqrt2\\cos x = 0$$ $$\\cos x \\cdot \\left(2\\cos x - \\sqrt2\\right) = 0$$",
    "Значит, $\\cos x = 0$, откуда $$x = \\dfrac{\\pi}{2} + \\pi k,\\ k \\in \\mathbb Z,$$ или $\\cos x = \\dfrac{\\sqrt2}{2}$, откуда $$x = \\dfrac{\\pi}{4} + 2\\pi n,\\ n \\in \\mathbb Z,$$ $$x = -\\dfrac{\\pi}{4} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[ -4\\pi;\\ -\\dfrac{5\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{2} + \\pi k$: $$-4\\pi \\le \\dfrac{\\pi}{2} + \\pi k \\le -\\dfrac{5\\pi}{2}$$ $$-\\dfrac{9}{2} \\le k \\le -3$$ $$k = -4;\\ -3$$ $$x = -\\dfrac{7\\pi}{2};\\ -\\dfrac{5\\pi}{2}$$",
    "Серия $\\dfrac{\\pi}{4} + 2\\pi n$: $$-4\\pi \\le \\dfrac{\\pi}{4} + 2\\pi n \\le -\\dfrac{5\\pi}{2}$$ $$-\\dfrac{17}{8} \\le n \\le -\\dfrac{11}{8}$$ $$n = -2$$ $$x = -\\dfrac{15\\pi}{4}$$",
    "Серия $-\\dfrac{\\pi}{4} + 2\\pi m$: $$-4\\pi \\le -\\dfrac{\\pi}{4} + 2\\pi m \\le -\\dfrac{5\\pi}{2}$$ $$-\\dfrac{15}{8} \\le m \\le -\\dfrac{9}{8}$$ $$\\text{целых } m \\text{ нет}$$ Получаем числа: $$-\\dfrac{15\\pi}{4};\\ -\\dfrac{7\\pi}{2};\\ -\\dfrac{5\\pi}{2}.$$"
   ]
  },
  {
   "id": "14.fipi.A1A34D",
   "group": "factor",
   "fipi": "A1A34D",
   "text": "а) Решите уравнение $\\sin 2x + \\sqrt{2}\\cos (x + \\pi) = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[3\\pi;\\, \\dfrac{9\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "7π/2; 17π/4; 9π/2",
     "tex": "\\dfrac{7\\pi}{2};\\ \\dfrac{17\\pi}{4};\\ \\dfrac{9\\pi}{2}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{2} + \\pi k,\\ k \\in \\mathbb Z$; $\\dfrac{\\pi}{4} + 2\\pi n,\\ n \\in \\mathbb Z$; $\\dfrac{3\\pi}{4} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $\\dfrac{7\\pi}{2};\\ \\dfrac{17\\pi}{4};\\ \\dfrac{9\\pi}{2}$",
   "steps": [
    "а) Так как $\\sin 2x = 2\\sin x\\cos x$ и $\\cos(x + \\pi) = -\\cos x$, получаем: $$2\\sin x\\cos x - \\sqrt2\\cos x = 0$$ $$\\cos x \\cdot \\left(2\\sin x - \\sqrt2\\right) = 0$$",
    "Значит, $\\cos x = 0$, откуда $$x = \\dfrac{\\pi}{2} + \\pi k,\\ k \\in \\mathbb Z,$$ или $\\sin x = \\dfrac{\\sqrt2}{2}$, откуда $$x = \\dfrac{\\pi}{4} + 2\\pi n,\\ n \\in \\mathbb Z,$$ $$x = \\dfrac{3\\pi}{4} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[3\\pi;\\, \\dfrac{9\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{2} + \\pi k$: $$3\\pi \\le \\dfrac{\\pi}{2} + \\pi k \\le \\dfrac{9\\pi}{2}$$ $$\\dfrac{5}{2} \\le k \\le 4$$ $$k = 3;\\ 4$$ $$x = \\dfrac{7\\pi}{2};\\ \\dfrac{9\\pi}{2}$$",
    "Серия $\\dfrac{\\pi}{4} + 2\\pi n$: $$3\\pi \\le \\dfrac{\\pi}{4} + 2\\pi n \\le \\dfrac{9\\pi}{2}$$ $$\\dfrac{11}{8} \\le n \\le \\dfrac{17}{8}$$ $$n = 2$$ $$x = \\dfrac{17\\pi}{4}$$",
    "Серия $\\dfrac{3\\pi}{4} + 2\\pi m$: $$3\\pi \\le \\dfrac{3\\pi}{4} + 2\\pi m \\le \\dfrac{9\\pi}{2}$$ $$\\dfrac{9}{8} \\le m \\le \\dfrac{15}{8}$$ $$\\text{целых } m \\text{ нет}$$ Получаем числа: $$\\dfrac{7\\pi}{2};\\ \\dfrac{17\\pi}{4};\\ \\dfrac{9\\pi}{2}.$$"
   ]
  },
  {
   "id": "14.fipi.4EFD3D",
   "group": "factor",
   "fipi": "4EFD3D",
   "text": "а) Решите уравнение $\\sin 2x + \\sqrt{2}\\sin (x + \\pi) = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[ - 4\\pi;\\ -\\dfrac{5\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "-4π; -15π/4; -3π",
     "tex": "-4\\pi;\\ -\\dfrac{15\\pi}{4};\\ -3\\pi"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\pi k,\\ k \\in \\mathbb Z$; $\\dfrac{\\pi}{4} + 2\\pi n,\\ n \\in \\mathbb Z$; $-\\dfrac{\\pi}{4} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $-4\\pi;\\ -\\dfrac{15\\pi}{4};\\ -3\\pi$",
   "steps": [
    "а) Так как $\\sin 2x = 2\\sin x\\cos x$ и $\\sin(x + \\pi) = -\\sin x$, получаем: $$2\\sin x\\cos x - \\sqrt2\\sin x = 0$$ $$\\sin x \\cdot \\left(2\\cos x - \\sqrt2\\right) = 0$$",
    "Значит, $\\sin x = 0$, откуда $$x = \\pi k,\\ k \\in \\mathbb Z,$$ или $\\cos x = \\dfrac{\\sqrt2}{2}$, откуда $$x = \\dfrac{\\pi}{4} + 2\\pi n,\\ n \\in \\mathbb Z,$$ $$x = -\\dfrac{\\pi}{4} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[ - 4\\pi;\\ -\\dfrac{5\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\pi k$: $$-4\\pi \\le \\pi k \\le -\\dfrac{5\\pi}{2}$$ $$-4 \\le k \\le -\\dfrac{5}{2}$$ $$k = -4;\\ -3$$ $$x = -4\\pi;\\ -3\\pi$$",
    "Серия $\\dfrac{\\pi}{4} + 2\\pi n$: $$-4\\pi \\le \\dfrac{\\pi}{4} + 2\\pi n \\le -\\dfrac{5\\pi}{2}$$ $$-\\dfrac{17}{8} \\le n \\le -\\dfrac{11}{8}$$ $$n = -2$$ $$x = -\\dfrac{15\\pi}{4}$$",
    "Серия $-\\dfrac{\\pi}{4} + 2\\pi m$: $$-4\\pi \\le -\\dfrac{\\pi}{4} + 2\\pi m \\le -\\dfrac{5\\pi}{2}$$ $$-\\dfrac{15}{8} \\le m \\le -\\dfrac{9}{8}$$ $$\\text{целых } m \\text{ нет}$$ Получаем числа: $$-4\\pi;\\ -\\dfrac{15\\pi}{4};\\ -3\\pi.$$"
   ]
  },
  {
   "id": "14.fipi.8413F6",
   "group": "factor",
   "fipi": "8413F6",
   "text": "а) Решите уравнение $\\cos 2x + \\sqrt{3}\\sin \\left(\\dfrac{\\pi}{2} + x\\right) + 1 = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[ -3\\pi;\\ -\\dfrac{3\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "-17π/6; -5π/2; -3π/2",
     "tex": "-\\dfrac{17\\pi}{6};\\ -\\dfrac{5\\pi}{2};\\ -\\dfrac{3\\pi}{2}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{2} + \\pi k,\\ k \\in \\mathbb Z$; $\\dfrac{5\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z$; $-\\dfrac{5\\pi}{6} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $-\\dfrac{17\\pi}{6};\\ -\\dfrac{5\\pi}{2};\\ -\\dfrac{3\\pi}{2}$",
   "steps": [
    "а) Так как $\\sin\\left(\\dfrac{\\pi}{2} + x\\right) = \\cos x$ и $\\cos 2x = 2\\cos^2 x - 1$, получаем: $$2\\cos^2 x - 1 + \\sqrt3\\cos x + 1 = 0$$ $$\\cos x \\cdot \\left(2\\cos x + \\sqrt3\\right) = 0$$",
    "Значит, $\\cos x = 0$, откуда $$x = \\dfrac{\\pi}{2} + \\pi k,\\ k \\in \\mathbb Z,$$ или $\\cos x = -\\dfrac{\\sqrt3}{2}$, откуда $$x = \\dfrac{5\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z,$$ $$x = -\\dfrac{5\\pi}{6} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[ -3\\pi;\\ -\\dfrac{3\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{2} + \\pi k$: $$-3\\pi \\le \\dfrac{\\pi}{2} + \\pi k \\le -\\dfrac{3\\pi}{2}$$ $$-\\dfrac{7}{2} \\le k \\le -2$$ $$k = -3;\\ -2$$ $$x = -\\dfrac{5\\pi}{2};\\ -\\dfrac{3\\pi}{2}$$",
    "Серия $\\dfrac{5\\pi}{6} + 2\\pi n$: $$-3\\pi \\le \\dfrac{5\\pi}{6} + 2\\pi n \\le -\\dfrac{3\\pi}{2}$$ $$-\\dfrac{23}{12} \\le n \\le -\\dfrac{7}{6}$$ $$\\text{целых } n \\text{ нет}$$",
    "Серия $-\\dfrac{5\\pi}{6} + 2\\pi m$: $$-3\\pi \\le -\\dfrac{5\\pi}{6} + 2\\pi m \\le -\\dfrac{3\\pi}{2}$$ $$-\\dfrac{13}{12} \\le m \\le -\\dfrac{1}{3}$$ $$m = -1$$ $$x = -\\dfrac{17\\pi}{6}$$ Получаем числа: $$-\\dfrac{17\\pi}{6};\\ -\\dfrac{5\\pi}{2};\\ -\\dfrac{3\\pi}{2}.$$"
   ]
  },
  {
   "id": "14.fipi.3BB500",
   "group": "factor",
   "fipi": "3BB500",
   "text": "а) Решите уравнение $2\\sin^{2} \\left(\\dfrac{\\pi}{2} - x\\right) + \\sin 2x = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[3\\pi;\\, \\dfrac{9\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "7π/2; 15π/4; 9π/2",
     "tex": "\\dfrac{7\\pi}{2};\\ \\dfrac{15\\pi}{4};\\ \\dfrac{9\\pi}{2}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{2} + \\pi k,\\ k \\in \\mathbb Z$; $-\\dfrac{\\pi}{4} + \\pi n,\\ n \\in \\mathbb Z$<br>б) $\\dfrac{7\\pi}{2};\\ \\dfrac{15\\pi}{4};\\ \\dfrac{9\\pi}{2}$",
   "steps": [
    "а) Так как $\\sin\\left(\\dfrac{\\pi}{2} - x\\right) = \\cos x$ и $\\sin 2x = 2\\sin x\\cos x$, получаем: $$2\\cos^2 x + 2\\sin x\\cos x = 0$$ $$2\\cos x \\cdot (\\cos x + \\sin x) = 0$$",
    "Значит, $\\cos x = 0$, откуда $$x = \\dfrac{\\pi}{2} + \\pi k,\\ k \\in \\mathbb Z,$$ или $\\sin x = -\\cos x$, то есть $\\operatorname{tg} x = -1$ (при $\\cos x = 0$ это равенство не выполняется), откуда $$x = -\\dfrac{\\pi}{4} + \\pi n,\\ n \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[3\\pi;\\, \\dfrac{9\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{2} + \\pi k$: $$3\\pi \\le \\dfrac{\\pi}{2} + \\pi k \\le \\dfrac{9\\pi}{2}$$ $$\\dfrac{5}{2} \\le k \\le 4$$ $$k = 3;\\ 4$$ $$x = \\dfrac{7\\pi}{2};\\ \\dfrac{9\\pi}{2}$$",
    "Серия $-\\dfrac{\\pi}{4} + \\pi n$: $$3\\pi \\le -\\dfrac{\\pi}{4} + \\pi n \\le \\dfrac{9\\pi}{2}$$ $$\\dfrac{13}{4} \\le n \\le \\dfrac{19}{4}$$ $$n = 4$$ $$x = \\dfrac{15\\pi}{4}$$ Получаем числа: $$\\dfrac{7\\pi}{2};\\ \\dfrac{15\\pi}{4};\\ \\dfrac{9\\pi}{2}.$$"
   ]
  },
  {
   "id": "14.fipi.30EEA9",
   "group": "factor",
   "fipi": "30EEA9",
   "text": "а) Решите уравнение $2\\sqrt{3}\\sin^{2} \\left(x + \\dfrac{3\\pi}{2}\\right) + \\sin 2x = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[ -4\\pi;\\ -\\dfrac{5\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "-7π/2; -10π/3; -5π/2",
     "tex": "-\\dfrac{7\\pi}{2};\\ -\\dfrac{10\\pi}{3};\\ -\\dfrac{5\\pi}{2}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{2} + \\pi k,\\ k \\in \\mathbb Z$; $-\\dfrac{\\pi}{3} + \\pi n,\\ n \\in \\mathbb Z$<br>б) $-\\dfrac{7\\pi}{2};\\ -\\dfrac{10\\pi}{3};\\ -\\dfrac{5\\pi}{2}$",
   "steps": [
    "а) Так как $\\sin\\left(x + \\dfrac{3\\pi}{2}\\right) = -\\cos x$ и $\\sin 2x = 2\\sin x\\cos x$, получаем: $$2\\sqrt3\\cos^2 x + 2\\sin x\\cos x = 0$$ $$2\\cos x \\cdot \\left(\\sqrt3\\cos x + \\sin x\\right) = 0$$",
    "Значит, $\\cos x = 0$, откуда $$x = \\dfrac{\\pi}{2} + \\pi k,\\ k \\in \\mathbb Z,$$ или $\\sin x = -\\sqrt3\\cos x$, то есть $\\operatorname{tg} x = -\\sqrt3$, откуда $$x = -\\dfrac{\\pi}{3} + \\pi n,\\ n \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[ -4\\pi;\\ -\\dfrac{5\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{2} + \\pi k$: $$-4\\pi \\le \\dfrac{\\pi}{2} + \\pi k \\le -\\dfrac{5\\pi}{2}$$ $$-\\dfrac{9}{2} \\le k \\le -3$$ $$k = -4;\\ -3$$ $$x = -\\dfrac{7\\pi}{2};\\ -\\dfrac{5\\pi}{2}$$",
    "Серия $-\\dfrac{\\pi}{3} + \\pi n$: $$-4\\pi \\le -\\dfrac{\\pi}{3} + \\pi n \\le -\\dfrac{5\\pi}{2}$$ $$-\\dfrac{11}{3} \\le n \\le -\\dfrac{13}{6}$$ $$n = -3$$ $$x = -\\dfrac{10\\pi}{3}$$ Получаем числа: $$-\\dfrac{7\\pi}{2};\\ -\\dfrac{10\\pi}{3};\\ -\\dfrac{5\\pi}{2}.$$"
   ]
  },
  {
   "id": "14.fipi.8EB2DA",
   "group": "factor",
   "fipi": "8EB2DA",
   "text": "а) Решите уравнение $2\\sin^{2} \\left(\\dfrac{3\\pi}{2} + x\\right) + \\cos (\\pi - x) = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[ -2\\pi;\\ -\\dfrac{\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "-5π/3; -3π/2; -π/2",
     "tex": "-\\dfrac{5\\pi}{3};\\ -\\dfrac{3\\pi}{2};\\ -\\dfrac{\\pi}{2}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{2} + \\pi k,\\ k \\in \\mathbb Z$; $\\dfrac{\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z$; $-\\dfrac{\\pi}{3} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $-\\dfrac{5\\pi}{3};\\ -\\dfrac{3\\pi}{2};\\ -\\dfrac{\\pi}{2}$",
   "steps": [
    "а) Так как $\\sin\\left(\\dfrac{3\\pi}{2} + x\\right) = -\\cos x$ и $\\cos(\\pi - x) = -\\cos x$, получаем: $$2\\cos^2 x - \\cos x = 0$$ $$\\cos x \\cdot (2\\cos x - 1) = 0$$",
    "Значит, $\\cos x = 0$, откуда $$x = \\dfrac{\\pi}{2} + \\pi k,\\ k \\in \\mathbb Z,$$ или $\\cos x = \\dfrac{1}{2}$, откуда $$x = \\dfrac{\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z,$$ $$x = -\\dfrac{\\pi}{3} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[ -2\\pi;\\ -\\dfrac{\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{2} + \\pi k$: $$-2\\pi \\le \\dfrac{\\pi}{2} + \\pi k \\le -\\dfrac{\\pi}{2}$$ $$-\\dfrac{5}{2} \\le k \\le -1$$ $$k = -2;\\ -1$$ $$x = -\\dfrac{3\\pi}{2};\\ -\\dfrac{\\pi}{2}$$",
    "Серия $\\dfrac{\\pi}{3} + 2\\pi n$: $$-2\\pi \\le \\dfrac{\\pi}{3} + 2\\pi n \\le -\\dfrac{\\pi}{2}$$ $$-\\dfrac{7}{6} \\le n \\le -\\dfrac{5}{12}$$ $$n = -1$$ $$x = -\\dfrac{5\\pi}{3}$$",
    "Серия $-\\dfrac{\\pi}{3} + 2\\pi m$: $$-2\\pi \\le -\\dfrac{\\pi}{3} + 2\\pi m \\le -\\dfrac{\\pi}{2}$$ $$-\\dfrac{5}{6} \\le m \\le -\\dfrac{1}{12}$$ $$\\text{целых } m \\text{ нет}$$ Получаем числа: $$-\\dfrac{5\\pi}{3};\\ -\\dfrac{3\\pi}{2};\\ -\\dfrac{\\pi}{2}.$$"
   ]
  },
  {
   "id": "14.fipi.0AD550",
   "group": "factor",
   "fipi": "0AD550",
   "text": "а) Решите уравнение $\\cos 2x - \\sqrt{2}\\cos \\left(\\dfrac{3\\pi}{2} + x\\right) - 1 = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[\\dfrac{3\\pi}{2};\\, 3\\pi ]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "7π/4; 2π; 3π",
     "tex": "\\dfrac{7\\pi}{4};\\ 2\\pi;\\ 3\\pi"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\pi k,\\ k \\in \\mathbb Z$; $-\\dfrac{\\pi}{4} + 2\\pi n,\\ n \\in \\mathbb Z$; $-\\dfrac{3\\pi}{4} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $\\dfrac{7\\pi}{4};\\ 2\\pi;\\ 3\\pi$",
   "steps": [
    "а) Так как $\\cos\\left(\\dfrac{3\\pi}{2} + x\\right) = \\sin x$ и $\\cos 2x = 1 - 2\\sin^2 x$, получаем: $$1 - 2\\sin^2 x - \\sqrt2\\sin x - 1 = 0$$ $$-\\sin x \\cdot \\left(2\\sin x + \\sqrt2\\right) = 0$$",
    "Значит, $\\sin x = 0$, откуда $$x = \\pi k,\\ k \\in \\mathbb Z,$$ или $\\sin x = -\\dfrac{\\sqrt2}{2}$, откуда $$x = -\\dfrac{\\pi}{4} + 2\\pi n,\\ n \\in \\mathbb Z,$$ $$x = -\\dfrac{3\\pi}{4} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[\\dfrac{3\\pi}{2};\\, 3\\pi ]$, с помощью двойных неравенств.",
    "Серия $\\pi k$: $$\\dfrac{3\\pi}{2} \\le \\pi k \\le 3\\pi$$ $$\\dfrac{3}{2} \\le k \\le 3$$ $$k = 2;\\ 3$$ $$x = 2\\pi;\\ 3\\pi$$",
    "Серия $-\\dfrac{\\pi}{4} + 2\\pi n$: $$\\dfrac{3\\pi}{2} \\le -\\dfrac{\\pi}{4} + 2\\pi n \\le 3\\pi$$ $$\\dfrac{7}{8} \\le n \\le \\dfrac{13}{8}$$ $$n = 1$$ $$x = \\dfrac{7\\pi}{4}$$",
    "Серия $-\\dfrac{3\\pi}{4} + 2\\pi m$: $$\\dfrac{3\\pi}{2} \\le -\\dfrac{3\\pi}{4} + 2\\pi m \\le 3\\pi$$ $$\\dfrac{9}{8} \\le m \\le \\dfrac{15}{8}$$ $$\\text{целых } m \\text{ нет}$$ Получаем числа: $$\\dfrac{7\\pi}{4};\\ 2\\pi;\\ 3\\pi.$$"
   ]
  },
  {
   "id": "14.fipi.685C13",
   "group": "factor",
   "fipi": "685C13",
   "text": "а) Решите уравнение $\\cos 2x - \\sqrt{2}\\sin (x + \\pi) - 1 = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[ - \\dfrac{7\\pi}{2};\\ -2\\pi ]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "-13π/4; -3π; -2π",
     "tex": "-\\dfrac{13\\pi}{4};\\ -3\\pi;\\ -2\\pi"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\pi k,\\ k \\in \\mathbb Z$; $\\dfrac{\\pi}{4} + 2\\pi n,\\ n \\in \\mathbb Z$; $\\dfrac{3\\pi}{4} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $-\\dfrac{13\\pi}{4};\\ -3\\pi;\\ -2\\pi$",
   "steps": [
    "а) Так как $\\sin(x + \\pi) = -\\sin x$ и $\\cos 2x = 1 - 2\\sin^2 x$, получаем: $$1 - 2\\sin^2 x + \\sqrt2\\sin x - 1 = 0$$ $$\\sin x \\cdot \\left(\\sqrt2 - 2\\sin x\\right) = 0$$",
    "Значит, $\\sin x = 0$, откуда $$x = \\pi k,\\ k \\in \\mathbb Z,$$ или $\\sin x = \\dfrac{\\sqrt2}{2}$, откуда $$x = \\dfrac{\\pi}{4} + 2\\pi n,\\ n \\in \\mathbb Z,$$ $$x = \\dfrac{3\\pi}{4} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[ - \\dfrac{7\\pi}{2};\\ -2\\pi ]$, с помощью двойных неравенств.",
    "Серия $\\pi k$: $$-\\dfrac{7\\pi}{2} \\le \\pi k \\le -2\\pi$$ $$-\\dfrac{7}{2} \\le k \\le -2$$ $$k = -3;\\ -2$$ $$x = -3\\pi;\\ -2\\pi$$",
    "Серия $\\dfrac{\\pi}{4} + 2\\pi n$: $$-\\dfrac{7\\pi}{2} \\le \\dfrac{\\pi}{4} + 2\\pi n \\le -2\\pi$$ $$-\\dfrac{15}{8} \\le n \\le -\\dfrac{9}{8}$$ $$\\text{целых } n \\text{ нет}$$",
    "Серия $\\dfrac{3\\pi}{4} + 2\\pi m$: $$-\\dfrac{7\\pi}{2} \\le \\dfrac{3\\pi}{4} + 2\\pi m \\le -2\\pi$$ $$-\\dfrac{17}{8} \\le m \\le -\\dfrac{11}{8}$$ $$m = -2$$ $$x = -\\dfrac{13\\pi}{4}$$ Получаем числа: $$-\\dfrac{13\\pi}{4};\\ -3\\pi;\\ -2\\pi.$$"
   ]
  },
  {
   "id": "14.fipi.712A7B",
   "group": "factor",
   "fipi": "712A7B",
   "text": "а) Решите уравнение $\\sqrt{2}\\sin \\left(x + \\dfrac{\\pi}{4}\\right) + 2\\sin^{2} x = \\sin x + 2$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[2\\pi;\\, \\dfrac{7\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "7π/3; 5π/2; 7π/2",
     "tex": "\\dfrac{7\\pi}{3};\\ \\dfrac{5\\pi}{2};\\ \\dfrac{7\\pi}{2}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{2} + \\pi k,\\ k \\in \\mathbb Z$; $\\dfrac{\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z$; $-\\dfrac{\\pi}{3} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $\\dfrac{7\\pi}{3};\\ \\dfrac{5\\pi}{2};\\ \\dfrac{7\\pi}{2}$",
   "steps": [
    "а) По формуле синуса суммы $$\\sqrt2\\sin\\left(x + \\dfrac{\\pi}{4}\\right) = \\sin x + \\cos x,$$ поэтому: $$\\sin x + \\cos x + 2\\sin^2 x = \\sin x + 2$$ $$\\cos x + 2 - 2\\cos^2 x - 2 = 0$$ $$\\cos x \\cdot (1 - 2\\cos x) = 0$$",
    "Значит, $\\cos x = 0$, откуда $$x = \\dfrac{\\pi}{2} + \\pi k,\\ k \\in \\mathbb Z,$$ или $\\cos x = \\dfrac{1}{2}$, откуда $$x = \\dfrac{\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z,$$ $$x = -\\dfrac{\\pi}{3} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[2\\pi;\\, \\dfrac{7\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{2} + \\pi k$: $$2\\pi \\le \\dfrac{\\pi}{2} + \\pi k \\le \\dfrac{7\\pi}{2}$$ $$\\dfrac{3}{2} \\le k \\le 3$$ $$k = 2;\\ 3$$ $$x = \\dfrac{5\\pi}{2};\\ \\dfrac{7\\pi}{2}$$",
    "Серия $\\dfrac{\\pi}{3} + 2\\pi n$: $$2\\pi \\le \\dfrac{\\pi}{3} + 2\\pi n \\le \\dfrac{7\\pi}{2}$$ $$\\dfrac{5}{6} \\le n \\le \\dfrac{19}{12}$$ $$n = 1$$ $$x = \\dfrac{7\\pi}{3}$$",
    "Серия $-\\dfrac{\\pi}{3} + 2\\pi m$: $$2\\pi \\le -\\dfrac{\\pi}{3} + 2\\pi m \\le \\dfrac{7\\pi}{2}$$ $$\\dfrac{7}{6} \\le m \\le \\dfrac{23}{12}$$ $$\\text{целых } m \\text{ нет}$$ Получаем числа: $$\\dfrac{7\\pi}{3};\\ \\dfrac{5\\pi}{2};\\ \\dfrac{7\\pi}{2}.$$"
   ]
  },
  {
   "id": "14.fipi.8A88E1",
   "group": "factor",
   "fipi": "8A88E1",
   "text": "а) Решите уравнение $2\\sin^{2} x + \\sqrt{2}\\sin \\left(x + \\dfrac{\\pi}{4}\\right) = \\cos x$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[ -2\\pi;\\ -\\dfrac{\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "-2π; -π; -5π/6",
     "tex": "-2\\pi;\\ -\\pi;\\ -\\dfrac{5\\pi}{6}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\pi k,\\ k \\in \\mathbb Z$; $-\\dfrac{\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z$; $-\\dfrac{5\\pi}{6} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $-2\\pi;\\ -\\pi;\\ -\\dfrac{5\\pi}{6}$",
   "steps": [
    "а) По формуле синуса суммы $$\\sqrt2\\sin\\left(x + \\dfrac{\\pi}{4}\\right) = \\sin x + \\cos x,$$ поэтому: $$2\\sin^2 x + \\sin x + \\cos x = \\cos x$$ $$2\\sin^2 x + \\sin x = 0$$ $$\\sin x \\cdot (2\\sin x + 1) = 0$$",
    "Значит, $\\sin x = 0$, откуда $$x = \\pi k,\\ k \\in \\mathbb Z,$$ или $\\sin x = -\\dfrac{1}{2}$, откуда $$x = -\\dfrac{\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z,$$ $$x = -\\dfrac{5\\pi}{6} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[ -2\\pi;\\ -\\dfrac{\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\pi k$: $$-2\\pi \\le \\pi k \\le -\\dfrac{\\pi}{2}$$ $$-2 \\le k \\le -\\dfrac{1}{2}$$ $$k = -2;\\ -1$$ $$x = -2\\pi;\\ -\\pi$$",
    "Серия $-\\dfrac{\\pi}{6} + 2\\pi n$: $$-2\\pi \\le -\\dfrac{\\pi}{6} + 2\\pi n \\le -\\dfrac{\\pi}{2}$$ $$-\\dfrac{11}{12} \\le n \\le -\\dfrac{1}{6}$$ $$\\text{целых } n \\text{ нет}$$",
    "Серия $-\\dfrac{5\\pi}{6} + 2\\pi m$: $$-2\\pi \\le -\\dfrac{5\\pi}{6} + 2\\pi m \\le -\\dfrac{\\pi}{2}$$ $$-\\dfrac{7}{12} \\le m \\le \\dfrac{1}{6}$$ $$m = 0$$ $$x = -\\dfrac{5\\pi}{6}$$ Получаем числа: $$-2\\pi;\\ -\\pi;\\ -\\dfrac{5\\pi}{6}.$$"
   ]
  },
  {
   "id": "14.fipi.DCD2BC",
   "group": "factor",
   "fipi": "DCD2BC",
   "text": "а) Решите уравнение $2\\cos x - \\sqrt{3}\\sin^{2} x = 2\\cos^{3} x$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[ -\\dfrac{7\\pi}{2};\\ -2\\pi ]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "-3π; -13π/6; -2π",
     "tex": "-3\\pi;\\ -\\dfrac{13\\pi}{6};\\ -2\\pi"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\pi k,\\ k \\in \\mathbb Z$; $\\dfrac{\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z$; $-\\dfrac{\\pi}{6} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $-3\\pi;\\ -\\dfrac{13\\pi}{6};\\ -2\\pi$",
   "steps": [
    "а) Перенесём всё в левую часть и вынесем $2\\cos x$ у первой пары слагаемых: $$2\\cos x - 2\\cos^3 x - \\sqrt3\\sin^2 x = 0$$ $$2\\cos x\\left(1 - \\cos^2 x\\right) - \\sqrt3\\sin^2 x = 0$$ $$2\\cos x\\sin^2 x - \\sqrt3\\sin^2 x = 0$$ $$\\sin^2 x \\cdot \\left(2\\cos x - \\sqrt3\\right) = 0$$",
    "Значит, $\\sin x = 0$, откуда $$x = \\pi k,\\ k \\in \\mathbb Z,$$ или $\\cos x = \\dfrac{\\sqrt3}{2}$, откуда $$x = \\dfrac{\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z,$$ $$x = -\\dfrac{\\pi}{6} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[ -\\dfrac{7\\pi}{2};\\ -2\\pi ]$, с помощью двойных неравенств.",
    "Серия $\\pi k$: $$-\\dfrac{7\\pi}{2} \\le \\pi k \\le -2\\pi$$ $$-\\dfrac{7}{2} \\le k \\le -2$$ $$k = -3;\\ -2$$ $$x = -3\\pi;\\ -2\\pi$$",
    "Серия $\\dfrac{\\pi}{6} + 2\\pi n$: $$-\\dfrac{7\\pi}{2} \\le \\dfrac{\\pi}{6} + 2\\pi n \\le -2\\pi$$ $$-\\dfrac{11}{6} \\le n \\le -\\dfrac{13}{12}$$ $$\\text{целых } n \\text{ нет}$$",
    "Серия $-\\dfrac{\\pi}{6} + 2\\pi m$: $$-\\dfrac{7\\pi}{2} \\le -\\dfrac{\\pi}{6} + 2\\pi m \\le -2\\pi$$ $$-\\dfrac{5}{3} \\le m \\le -\\dfrac{11}{12}$$ $$m = -1$$ $$x = -\\dfrac{13\\pi}{6}$$ Получаем числа: $$-3\\pi;\\ -\\dfrac{13\\pi}{6};\\ -2\\pi.$$"
   ]
  },
  {
   "id": "14.fipi.E6F116",
   "group": "factor",
   "fipi": "E6F116",
   "text": "а) Решите уравнение $2\\cos^{3} x - \\cos^{2} x + 2\\cos x - 1 = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[2\\pi;\\, \\dfrac{7\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "7π/3",
     "tex": "\\dfrac{7\\pi}{3}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{3} + 2\\pi k,\\ k \\in \\mathbb Z$; $-\\dfrac{\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z$<br>б) $\\dfrac{7\\pi}{3}$",
   "steps": [
    "а) Сгруппируем слагаемые: $$\\cos^2 x\\,(2\\cos x - 1) + (2\\cos x - 1) = 0$$ $$(2\\cos x - 1)\\left(\\cos^2 x + 1\\right) = 0$$",
    "Так как $\\cos^2 x + 1 > 0$, получаем $\\cos x = \\dfrac{1}{2}$, откуда $$x = \\dfrac{\\pi}{3} + 2\\pi k,\\ k \\in \\mathbb Z,$$ $$x = -\\dfrac{\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[2\\pi;\\, \\dfrac{7\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{3} + 2\\pi k$: $$2\\pi \\le \\dfrac{\\pi}{3} + 2\\pi k \\le \\dfrac{7\\pi}{2}$$ $$\\dfrac{5}{6} \\le k \\le \\dfrac{19}{12}$$ $$k = 1$$ $$x = \\dfrac{7\\pi}{3}$$",
    "Серия $-\\dfrac{\\pi}{3} + 2\\pi n$: $$2\\pi \\le -\\dfrac{\\pi}{3} + 2\\pi n \\le \\dfrac{7\\pi}{2}$$ $$\\dfrac{7}{6} \\le n \\le \\dfrac{23}{12}$$ $$\\text{целых } n \\text{ нет}$$ Получаем числа: $$\\dfrac{7\\pi}{3}.$$"
   ]
  },
  {
   "id": "14.fipi.74C1A9",
   "group": "factor",
   "fipi": "74C1A9",
   "text": "а) Решите уравнение $2\\cos^{3} x + \\sqrt{3}\\cos^{2} x + 2\\cos x + \\sqrt{3} = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[ -2\\pi;\\ -\\dfrac{\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "-7π/6; -5π/6",
     "tex": "-\\dfrac{7\\pi}{6};\\ -\\dfrac{5\\pi}{6}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{5\\pi}{6} + 2\\pi k,\\ k \\in \\mathbb Z$; $-\\dfrac{5\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z$<br>б) $-\\dfrac{7\\pi}{6};\\ -\\dfrac{5\\pi}{6}$",
   "steps": [
    "а) Сгруппируем слагаемые: $$\\cos^2 x\\left(2\\cos x + \\sqrt3\\right) + \\left(2\\cos x + \\sqrt3\\right) = 0$$ $$\\left(2\\cos x + \\sqrt3\\right)\\left(\\cos^2 x + 1\\right) = 0$$",
    "Так как $\\cos^2 x + 1 > 0$, получаем $\\cos x = -\\dfrac{\\sqrt3}{2}$, откуда $$x = \\dfrac{5\\pi}{6} + 2\\pi k,\\ k \\in \\mathbb Z,$$ $$x = -\\dfrac{5\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[ -2\\pi;\\ -\\dfrac{\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{5\\pi}{6} + 2\\pi k$: $$-2\\pi \\le \\dfrac{5\\pi}{6} + 2\\pi k \\le -\\dfrac{\\pi}{2}$$ $$-\\dfrac{17}{12} \\le k \\le -\\dfrac{2}{3}$$ $$k = -1$$ $$x = -\\dfrac{7\\pi}{6}$$",
    "Серия $-\\dfrac{5\\pi}{6} + 2\\pi n$: $$-2\\pi \\le -\\dfrac{5\\pi}{6} + 2\\pi n \\le -\\dfrac{\\pi}{2}$$ $$-\\dfrac{7}{12} \\le n \\le \\dfrac{1}{6}$$ $$n = 0$$ $$x = -\\dfrac{5\\pi}{6}$$ Получаем числа: $$-\\dfrac{7\\pi}{6};\\ -\\dfrac{5\\pi}{6}.$$"
   ]
  },
  {
   "id": "14.fipi.1D3525",
   "group": "factor",
   "fipi": "1D3525",
   "text": "а) Решите уравнение $\\sin 2x + 2\\sin (-x) + \\cos (-x) - 1 = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[2\\pi;\\, \\dfrac{7\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "2π; 19π/6",
     "tex": "2\\pi;\\ \\dfrac{19\\pi}{6}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $2\\pi k,\\ k \\in \\mathbb Z$; $-\\dfrac{\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z$; $-\\dfrac{5\\pi}{6} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $2\\pi;\\ \\dfrac{19\\pi}{6}$",
   "steps": [
    "а) Так как $\\sin(-x) = -\\sin x$, $\\cos(-x) = \\cos x$ и $\\sin 2x = 2\\sin x\\cos x$, получаем: $$2\\sin x\\cos x - 2\\sin x + \\cos x - 1 = 0$$ $$2\\sin x\\,(\\cos x - 1) + (\\cos x - 1) = 0$$ $$(\\cos x - 1)(2\\sin x + 1) = 0$$",
    "Значит, $\\cos x = 1$, откуда $$x = 2\\pi k,\\ k \\in \\mathbb Z,$$ или $\\sin x = -\\dfrac{1}{2}$, откуда $$x = -\\dfrac{\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z,$$ $$x = -\\dfrac{5\\pi}{6} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[2\\pi;\\, \\dfrac{7\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $2\\pi k$: $$2\\pi \\le 2\\pi k \\le \\dfrac{7\\pi}{2}$$ $$1 \\le k \\le \\dfrac{7}{4}$$ $$k = 1$$ $$x = 2\\pi$$",
    "Серия $-\\dfrac{\\pi}{6} + 2\\pi n$: $$2\\pi \\le -\\dfrac{\\pi}{6} + 2\\pi n \\le \\dfrac{7\\pi}{2}$$ $$\\dfrac{13}{12} \\le n \\le \\dfrac{11}{6}$$ $$\\text{целых } n \\text{ нет}$$",
    "Серия $-\\dfrac{5\\pi}{6} + 2\\pi m$: $$2\\pi \\le -\\dfrac{5\\pi}{6} + 2\\pi m \\le \\dfrac{7\\pi}{2}$$ $$\\dfrac{17}{12} \\le m \\le \\dfrac{13}{6}$$ $$m = 2$$ $$x = \\dfrac{19\\pi}{6}$$ Получаем числа: $$2\\pi;\\ \\dfrac{19\\pi}{6}.$$"
   ]
  },
  {
   "id": "14.fipi.9D14AA",
   "group": "factor",
   "fipi": "9D14AA",
   "text": "а) Решите уравнение $\\sin 2x - \\sin (-x) + 2\\cos (-x) + 1 = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[\\dfrac{3\\pi}{2};\\, 3\\pi ]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "3π/2; 8π/3",
     "tex": "\\dfrac{3\\pi}{2};\\ \\dfrac{8\\pi}{3}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{2\\pi}{3} + 2\\pi k,\\ k \\in \\mathbb Z$; $-\\dfrac{2\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z$; $-\\dfrac{\\pi}{2} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $\\dfrac{3\\pi}{2};\\ \\dfrac{8\\pi}{3}$",
   "steps": [
    "а) Так как $\\sin(-x) = -\\sin x$, $\\cos(-x) = \\cos x$ и $\\sin 2x = 2\\sin x\\cos x$, получаем: $$2\\sin x\\cos x + \\sin x + 2\\cos x + 1 = 0$$ $$\\sin x\\,(2\\cos x + 1) + (2\\cos x + 1) = 0$$ $$(2\\cos x + 1)(\\sin x + 1) = 0$$",
    "Значит, $\\cos x = -\\dfrac{1}{2}$, откуда $$x = \\dfrac{2\\pi}{3} + 2\\pi k,\\ k \\in \\mathbb Z,$$ $$x = -\\dfrac{2\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z,$$ или $\\sin x = -1$, откуда $$x = -\\dfrac{\\pi}{2} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[\\dfrac{3\\pi}{2};\\, 3\\pi ]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{2\\pi}{3} + 2\\pi k$: $$\\dfrac{3\\pi}{2} \\le \\dfrac{2\\pi}{3} + 2\\pi k \\le 3\\pi$$ $$\\dfrac{5}{12} \\le k \\le \\dfrac{7}{6}$$ $$k = 1$$ $$x = \\dfrac{8\\pi}{3}$$",
    "Серия $-\\dfrac{2\\pi}{3} + 2\\pi n$: $$\\dfrac{3\\pi}{2} \\le -\\dfrac{2\\pi}{3} + 2\\pi n \\le 3\\pi$$ $$\\dfrac{13}{12} \\le n \\le \\dfrac{11}{6}$$ $$\\text{целых } n \\text{ нет}$$",
    "Серия $-\\dfrac{\\pi}{2} + 2\\pi m$: $$\\dfrac{3\\pi}{2} \\le -\\dfrac{\\pi}{2} + 2\\pi m \\le 3\\pi$$ $$1 \\le m \\le \\dfrac{7}{4}$$ $$m = 1$$ $$x = \\dfrac{3\\pi}{2}$$ Получаем числа: $$\\dfrac{3\\pi}{2};\\ \\dfrac{8\\pi}{3}.$$"
   ]
  },
  {
   "id": "14.fipi.2CCC19",
   "group": "factor",
   "fipi": "2CCC19",
   "text": "а) Решите уравнение $2\\sin^{2} x + \\sqrt{2}\\sin (2\\pi - x) + \\sqrt{3}\\sin 2x = \\sqrt{6}\\cos x$.<br>б) Найдите все корни этого уравнения, принадлежащие отрезку $[ - \\pi;\\, \\dfrac{\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "-π/3; π/4",
     "tex": "-\\dfrac{\\pi}{3};\\ \\dfrac{\\pi}{4}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{4} + 2\\pi k,\\ k \\in \\mathbb Z$; $\\dfrac{3\\pi}{4} + 2\\pi n,\\ n \\in \\mathbb Z$; $-\\dfrac{\\pi}{3} + \\pi m,\\ m \\in \\mathbb Z$<br>б) $-\\dfrac{\\pi}{3};\\ \\dfrac{\\pi}{4}$",
   "steps": [
    "а) Так как $\\sin(2\\pi - x) = -\\sin x$ и $\\sin 2x = 2\\sin x\\cos x$, получаем: $$2\\sin^2 x - \\sqrt2\\sin x + 2\\sqrt3\\sin x\\cos x - \\sqrt6\\cos x = 0$$ $$\\sin x\\left(2\\sin x - \\sqrt2\\right) + \\sqrt3\\cos x\\left(2\\sin x - \\sqrt2\\right) = 0$$ $$\\left(2\\sin x - \\sqrt2\\right)\\left(\\sin x + \\sqrt3\\cos x\\right) = 0$$",
    "Значит, $\\sin x = \\dfrac{\\sqrt2}{2}$, откуда $$x = \\dfrac{\\pi}{4} + 2\\pi k,\\ k \\in \\mathbb Z,$$ $$x = \\dfrac{3\\pi}{4} + 2\\pi n,\\ n \\in \\mathbb Z,$$ или $\\sin x = -\\sqrt3\\cos x$, то есть $\\operatorname{tg} x = -\\sqrt3$, откуда $$x = -\\dfrac{\\pi}{3} + \\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[ - \\pi;\\, \\dfrac{\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{4} + 2\\pi k$: $$-\\pi \\le \\dfrac{\\pi}{4} + 2\\pi k \\le \\dfrac{\\pi}{2}$$ $$-\\dfrac{5}{8} \\le k \\le \\dfrac{1}{8}$$ $$k = 0$$ $$x = \\dfrac{\\pi}{4}$$",
    "Серия $\\dfrac{3\\pi}{4} + 2\\pi n$: $$-\\pi \\le \\dfrac{3\\pi}{4} + 2\\pi n \\le \\dfrac{\\pi}{2}$$ $$-\\dfrac{7}{8} \\le n \\le -\\dfrac{1}{8}$$ $$\\text{целых } n \\text{ нет}$$",
    "Серия $-\\dfrac{\\pi}{3} + \\pi m$: $$-\\pi \\le -\\dfrac{\\pi}{3} + \\pi m \\le \\dfrac{\\pi}{2}$$ $$-\\dfrac{2}{3} \\le m \\le \\dfrac{5}{6}$$ $$m = 0$$ $$x = -\\dfrac{\\pi}{3}$$ Получаем числа: $$-\\dfrac{\\pi}{3};\\ \\dfrac{\\pi}{4}.$$"
   ]
  },
  {
   "id": "14.fipi.913eF3",
   "group": "factor",
   "fipi": "913eF3",
   "text": "а) Решите уравнение $\\sin 2x + 2\\sqrt{2}\\cos \\left(x - \\dfrac{\\pi}{4}\\right) + 1 = 0$.<br>б) Найдите все корни этого уравнения, принадлежащие отрезку $[ - \\dfrac{15\\pi}{2};\\ -6\\pi ]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "-29π/4; -25π/4",
     "tex": "-\\dfrac{29\\pi}{4};\\ -\\dfrac{25\\pi}{4}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $-\\dfrac{\\pi}{4} + \\pi k,\\ k \\in \\mathbb Z$<br>б) $-\\dfrac{29\\pi}{4};\\ -\\dfrac{25\\pi}{4}$",
   "steps": [
    "а) По формуле косинуса разности $$2\\sqrt2\\cos\\left(x - \\dfrac{\\pi}{4}\\right) = 2(\\cos x + \\sin x),$$ а $$\\sin 2x + 1 = \\sin^2 x + 2\\sin x\\cos x + \\cos^2 x = (\\sin x + \\cos x)^2.$$",
    "Получаем: $$(\\sin x + \\cos x)^2 + 2(\\sin x + \\cos x) = 0$$ $$(\\sin x + \\cos x)(\\sin x + \\cos x + 2) = 0$$ Второй множитель положителен, так как $\\sin x \\ge -1$ и $\\cos x \\ge -1$ и они не равны $-1$ одновременно. Значит, $\\sin x + \\cos x = 0$, то есть $\\operatorname{tg} x = -1$, откуда $$x = -\\dfrac{\\pi}{4} + \\pi k,\\ k \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[ - \\dfrac{15\\pi}{2};\\ -6\\pi ]$, с помощью двойных неравенств.",
    "Серия $-\\dfrac{\\pi}{4} + \\pi k$: $$-\\dfrac{15\\pi}{2} \\le -\\dfrac{\\pi}{4} + \\pi k \\le -6\\pi$$ $$-\\dfrac{29}{4} \\le k \\le -\\dfrac{23}{4}$$ $$k = -7;\\ -6$$ $$x = -\\dfrac{29\\pi}{4};\\ -\\dfrac{25\\pi}{4}$$ Получаем числа: $$-\\dfrac{29\\pi}{4};\\ -\\dfrac{25\\pi}{4}.$$"
   ]
  },
  {
   "id": "14.fipi.c19c6e",
   "group": "factor",
   "fipi": "c19c6e",
   "text": "а) Решите уравнение $\\cos^{2} x + \\sin^{2} \\left(x - \\dfrac{\\pi}{4}\\right) = \\dfrac{1}{2}$.<br>б) Найдите все корни этого уравнения, принадлежащие отрезку $[5\\pi;\\, 6\\pi ]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "21π/4; 11π/2",
     "tex": "\\dfrac{21\\pi}{4};\\ \\dfrac{11\\pi}{2}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{2} + \\pi k,\\ k \\in \\mathbb Z$; $\\dfrac{\\pi}{4} + \\pi n,\\ n \\in \\mathbb Z$<br>б) $\\dfrac{21\\pi}{4};\\ \\dfrac{11\\pi}{2}$",
   "steps": [
    "а) Понизим степень: $$\\cos^2 x = \\dfrac{1 + \\cos 2x}{2}$$ $$\\sin^2\\left(x - \\dfrac{\\pi}{4}\\right) = \\dfrac{1 - \\cos\\left(2x - \\dfrac{\\pi}{2}\\right)}{2} = \\dfrac{1 - \\sin 2x}{2}$$ Тогда: $$\\dfrac{1 + \\cos 2x}{2} + \\dfrac{1 - \\sin 2x}{2} = \\dfrac{1}{2}$$ $$\\sin 2x - \\cos 2x = 1$$",
    "Так как $\\sin 2x = 2\\sin x\\cos x$ и $\\cos 2x = 1 - 2\\sin^2 x$: $$2\\sin x\\cos x - 1 + 2\\sin^2 x = 1$$ $$2\\sin x\\cos x - 2\\left(1 - \\sin^2 x\\right) = 0$$ $$2\\sin x\\cos x - 2\\cos^2 x = 0$$ $$2\\cos x\\,(\\sin x - \\cos x) = 0$$",
    "Значит, $\\cos x = 0$, откуда $$x = \\dfrac{\\pi}{2} + \\pi k,\\ k \\in \\mathbb Z,$$ или $\\sin x = \\cos x$, то есть $\\operatorname{tg} x = 1$, откуда $$x = \\dfrac{\\pi}{4} + \\pi n,\\ n \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[5\\pi;\\, 6\\pi ]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{2} + \\pi k$: $$5\\pi \\le \\dfrac{\\pi}{2} + \\pi k \\le 6\\pi$$ $$\\dfrac{9}{2} \\le k \\le \\dfrac{11}{2}$$ $$k = 5$$ $$x = \\dfrac{11\\pi}{2}$$",
    "Серия $\\dfrac{\\pi}{4} + \\pi n$: $$5\\pi \\le \\dfrac{\\pi}{4} + \\pi n \\le 6\\pi$$ $$\\dfrac{19}{4} \\le n \\le \\dfrac{23}{4}$$ $$n = 5$$ $$x = \\dfrac{21\\pi}{4}$$ Получаем числа: $$\\dfrac{21\\pi}{4};\\ \\dfrac{11\\pi}{2}.$$"
   ]
  },
  {
   "id": "14.fipi.5e5cF2",
   "group": "sum",
   "fipi": "5e5cF2",
   "text": "а) Решите уравнение $2\\sin \\left(x - \\dfrac{\\pi}{4}\\right) + 2\\sqrt{2}\\cos \\left(\\dfrac{\\pi}{2} + x\\right) = 0$.<br>б) Найдите все корни этого уравнения, принадлежащие отрезку $[ -4\\pi;\\ -\\dfrac{5\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "-13π/4",
     "tex": "-\\dfrac{13\\pi}{4}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $-\\dfrac{\\pi}{4} + \\pi k,\\ k \\in \\mathbb Z$<br>б) $-\\dfrac{13\\pi}{4}$",
   "steps": [
    "а) По формуле синуса разности и формуле приведения $\\cos\\left(\\dfrac{\\pi}{2} + x\\right) = -\\sin x$: $$2\\left(\\dfrac{\\sqrt2}{2}\\sin x - \\dfrac{\\sqrt2}{2}\\cos x\\right) - 2\\sqrt2\\sin x = 0$$ $$\\sqrt2\\sin x - \\sqrt2\\cos x - 2\\sqrt2\\sin x = 0$$ $$-\\sqrt2\\sin x - \\sqrt2\\cos x = 0$$ $$\\sin x = -\\cos x$$",
    "При $\\cos x = 0$ равенство не выполняется (тогда и $\\sin x = 0$, что невозможно), поэтому делим на $\\cos x$: $$\\operatorname{tg} x = -1$$ $$x = -\\dfrac{\\pi}{4} + \\pi k,\\ k \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[ -4\\pi;\\ -\\dfrac{5\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $-\\dfrac{\\pi}{4} + \\pi k$: $$-4\\pi \\le -\\dfrac{\\pi}{4} + \\pi k \\le -\\dfrac{5\\pi}{2}$$ $$-\\dfrac{15}{4} \\le k \\le -\\dfrac{9}{4}$$ $$k = -3$$ $$x = -\\dfrac{13\\pi}{4}$$ Получаем числа: $$-\\dfrac{13\\pi}{4}.$$"
   ]
  },
  {
   "id": "14.fipi.5Ae77D",
   "group": "sum",
   "fipi": "5Ae77D",
   "text": "а) Решите уравнение $2\\cos \\left(x - \\dfrac{\\pi}{4}\\right) - 2\\sqrt{2}\\sin \\left(\\dfrac{\\pi}{2} + x\\right) = 0$.<br>б) Найдите все корни этого уравнения, принадлежащие отрезку $[ - \\dfrac{17\\pi}{2};\\ -7\\pi ]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "-31π/4",
     "tex": "-\\dfrac{31\\pi}{4}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{4} + \\pi k,\\ k \\in \\mathbb Z$<br>б) $-\\dfrac{31\\pi}{4}$",
   "steps": [
    "а) По формуле косинуса разности и формуле приведения $\\sin\\left(\\dfrac{\\pi}{2} + x\\right) = \\cos x$: $$2\\left(\\dfrac{\\sqrt2}{2}\\cos x + \\dfrac{\\sqrt2}{2}\\sin x\\right) - 2\\sqrt2\\cos x = 0$$ $$\\sqrt2\\sin x - \\sqrt2\\cos x = 0$$ $$\\sin x = \\cos x$$",
    "При $\\cos x = 0$ равенство не выполняется, поэтому делим на $\\cos x$: $$\\operatorname{tg} x = 1$$ $$x = \\dfrac{\\pi}{4} + \\pi k,\\ k \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[ - \\dfrac{17\\pi}{2};\\ -7\\pi ]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{4} + \\pi k$: $$-\\dfrac{17\\pi}{2} \\le \\dfrac{\\pi}{4} + \\pi k \\le -7\\pi$$ $$-\\dfrac{35}{4} \\le k \\le -\\dfrac{29}{4}$$ $$k = -8$$ $$x = -\\dfrac{31\\pi}{4}$$ Получаем числа: $$-\\dfrac{31\\pi}{4}.$$"
   ]
  },
  {
   "id": "14.fipi.9B4DBD",
   "group": "sum",
   "fipi": "9B4DBD",
   "text": "а) Решите уравнение $2\\sin \\left(x + \\dfrac{\\pi}{3}\\right) + 2\\sin (\\pi + x) = 0$.<br>б) Найдите все корни этого уравнения, принадлежащие отрезку $[5\\pi;\\, \\dfrac{13\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "16π/3; 19π/3",
     "tex": "\\dfrac{16\\pi}{3};\\ \\dfrac{19\\pi}{3}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{3} + \\pi k,\\ k \\in \\mathbb Z$<br>б) $\\dfrac{16\\pi}{3};\\ \\dfrac{19\\pi}{3}$",
   "steps": [
    "а) По формуле синуса суммы и формуле приведения $\\sin(\\pi + x) = -\\sin x$: $$2\\left(\\dfrac{1}{2}\\sin x + \\dfrac{\\sqrt3}{2}\\cos x\\right) - 2\\sin x = 0$$ $$\\sqrt3\\cos x - \\sin x = 0$$ $$\\sin x = \\sqrt3\\cos x$$",
    "При $\\cos x = 0$ равенство не выполняется, поэтому делим на $\\cos x$: $$\\operatorname{tg} x = \\sqrt3$$ $$x = \\dfrac{\\pi}{3} + \\pi k,\\ k \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[5\\pi;\\, \\dfrac{13\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{3} + \\pi k$: $$5\\pi \\le \\dfrac{\\pi}{3} + \\pi k \\le \\dfrac{13\\pi}{2}$$ $$\\dfrac{14}{3} \\le k \\le \\dfrac{37}{6}$$ $$k = 5;\\ 6$$ $$x = \\dfrac{16\\pi}{3};\\ \\dfrac{19\\pi}{3}$$ Получаем числа: $$\\dfrac{16\\pi}{3};\\ \\dfrac{19\\pi}{3}.$$"
   ]
  },
  {
   "id": "14.fipi.889715",
   "group": "sum",
   "fipi": "889715",
   "text": "а) Решите уравнение $2\\sin \\left(x + \\dfrac{\\pi}{6}\\right) - 2\\sqrt{3}\\sin (\\pi - x) = 0$.<br>б) Найдите все корни этого уравнения, принадлежащие отрезку $[7\\pi;\\, \\dfrac{17\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "43π/6; 49π/6",
     "tex": "\\dfrac{43\\pi}{6};\\ \\dfrac{49\\pi}{6}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{6} + \\pi k,\\ k \\in \\mathbb Z$<br>б) $\\dfrac{43\\pi}{6};\\ \\dfrac{49\\pi}{6}$",
   "steps": [
    "а) По формуле синуса суммы и формуле приведения $\\sin(\\pi - x) = \\sin x$: $$2\\left(\\dfrac{\\sqrt3}{2}\\sin x + \\dfrac{1}{2}\\cos x\\right) - 2\\sqrt3\\sin x = 0$$ $$\\cos x - \\sqrt3\\sin x = 0$$ $$\\sqrt3\\sin x = \\cos x$$",
    "При $\\cos x = 0$ равенство не выполняется, поэтому делим на $\\cos x$: $$\\operatorname{tg} x = \\dfrac{\\sqrt3}{3}$$ $$x = \\dfrac{\\pi}{6} + \\pi k,\\ k \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[7\\pi;\\, \\dfrac{17\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{6} + \\pi k$: $$7\\pi \\le \\dfrac{\\pi}{6} + \\pi k \\le \\dfrac{17\\pi}{2}$$ $$\\dfrac{41}{6} \\le k \\le \\dfrac{25}{3}$$ $$k = 7;\\ 8$$ $$x = \\dfrac{43\\pi}{6};\\ \\dfrac{49\\pi}{6}$$ Получаем числа: $$\\dfrac{43\\pi}{6};\\ \\dfrac{49\\pi}{6}.$$"
   ]
  },
  {
   "id": "14.fipi.F98Be9",
   "group": "sum",
   "fipi": "F98Be9",
   "text": "а) Решите уравнение $2\\sin \\left(x - \\dfrac{\\pi}{6}\\right) - 2\\sqrt{3}\\cos \\left(\\dfrac{\\pi}{2} - x\\right) = 0$.<br>б) Найдите все корни этого уравнения, принадлежащие отрезку $[ -6\\pi;\\ -\\dfrac{9\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "-31π/6",
     "tex": "-\\dfrac{31\\pi}{6}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $-\\dfrac{\\pi}{6} + \\pi k,\\ k \\in \\mathbb Z$<br>б) $-\\dfrac{31\\pi}{6}$",
   "steps": [
    "а) По формуле синуса разности и формуле приведения $\\cos\\left(\\dfrac{\\pi}{2} - x\\right) = \\sin x$: $$2\\left(\\dfrac{\\sqrt3}{2}\\sin x - \\dfrac{1}{2}\\cos x\\right) - 2\\sqrt3\\sin x = 0$$ $$-\\sqrt3\\sin x - \\cos x = 0$$ $$\\sqrt3\\sin x = -\\cos x$$",
    "При $\\cos x = 0$ равенство не выполняется, поэтому делим на $\\cos x$: $$\\operatorname{tg} x = -\\dfrac{\\sqrt3}{3}$$ $$x = -\\dfrac{\\pi}{6} + \\pi k,\\ k \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[ -6\\pi;\\ -\\dfrac{9\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $-\\dfrac{\\pi}{6} + \\pi k$: $$-6\\pi \\le -\\dfrac{\\pi}{6} + \\pi k \\le -\\dfrac{9\\pi}{2}$$ $$-\\dfrac{35}{6} \\le k \\le -\\dfrac{13}{3}$$ $$k = -5$$ $$x = -\\dfrac{31\\pi}{6}$$ Получаем числа: $$-\\dfrac{31\\pi}{6}.$$"
   ]
  },
  {
   "id": "14.fipi.350814",
   "group": "sum",
   "fipi": "350814",
   "text": "а) Решите уравнение $4\\cos \\left(x + \\dfrac{\\pi}{4}\\right) + 2\\sqrt{2}\\cos (\\pi - x) = 2$.<br>б) Найдите все корни этого уравнения, принадлежащие отрезку $[\\dfrac{17\\pi}{2};\\, 10\\pi ]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "37π/4; 39π/4",
     "tex": "\\dfrac{37\\pi}{4};\\ \\dfrac{39\\pi}{4}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $-\\dfrac{\\pi}{4} + 2\\pi n,\\ n \\in \\mathbb Z$; $-\\dfrac{3\\pi}{4} + 2\\pi k,\\ k \\in \\mathbb Z$<br>б) $\\dfrac{37\\pi}{4};\\ \\dfrac{39\\pi}{4}$",
   "steps": [
    "а) По формуле косинуса суммы и формуле приведения $\\cos(\\pi - x) = -\\cos x$: $$4\\left(\\dfrac{\\sqrt2}{2}\\cos x - \\dfrac{\\sqrt2}{2}\\sin x\\right) - 2\\sqrt2\\cos x = 2$$ $$2\\sqrt2\\cos x - 2\\sqrt2\\sin x - 2\\sqrt2\\cos x = 2$$ $$-2\\sqrt2\\sin x = 2$$",
    "Значит, $\\sin x = -\\dfrac{\\sqrt2}{2}$, откуда $$x = -\\dfrac{\\pi}{4} + 2\\pi n,\\ n \\in \\mathbb Z,$$ $$x = -\\dfrac{3\\pi}{4} + 2\\pi k,\\ k \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[\\dfrac{17\\pi}{2};\\, 10\\pi ]$, с помощью двойных неравенств.",
    "Серия $-\\dfrac{\\pi}{4} + 2\\pi n$: $$\\dfrac{17\\pi}{2} \\le -\\dfrac{\\pi}{4} + 2\\pi n \\le 10\\pi$$ $$\\dfrac{35}{8} \\le n \\le \\dfrac{41}{8}$$ $$n = 5$$ $$x = \\dfrac{39\\pi}{4}$$",
    "Серия $-\\dfrac{3\\pi}{4} + 2\\pi k$: $$\\dfrac{17\\pi}{2} \\le -\\dfrac{3\\pi}{4} + 2\\pi k \\le 10\\pi$$ $$\\dfrac{37}{8} \\le k \\le \\dfrac{43}{8}$$ $$k = 5$$ $$x = \\dfrac{37\\pi}{4}$$ Получаем числа: $$\\dfrac{37\\pi}{4};\\ \\dfrac{39\\pi}{4}.$$"
   ]
  },
  {
   "id": "14.fipi.89582D",
   "group": "sum",
   "fipi": "89582D",
   "text": "а) Решите уравнение $4\\cos \\left(x - \\dfrac{\\pi}{4}\\right) + 2\\sqrt{2}\\sin \\left(\\dfrac{3\\pi}{2} - x\\right) = \\sqrt{6}$.<br>б) Найдите все корни этого уравнения, принадлежащие отрезку $[4\\pi;\\, \\dfrac{11\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "13π/3; 14π/3",
     "tex": "\\dfrac{13\\pi}{3};\\ \\dfrac{14\\pi}{3}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{3} + 2\\pi k,\\ k \\in \\mathbb Z$; $\\dfrac{2\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z$<br>б) $\\dfrac{13\\pi}{3};\\ \\dfrac{14\\pi}{3}$",
   "steps": [
    "а) По формуле косинуса разности и формуле приведения $\\sin\\left(\\dfrac{3\\pi}{2} - x\\right) = -\\cos x$: $$4\\left(\\dfrac{\\sqrt2}{2}\\cos x + \\dfrac{\\sqrt2}{2}\\sin x\\right) - 2\\sqrt2\\cos x = \\sqrt6$$ $$2\\sqrt2\\sin x = \\sqrt6$$",
    "Значит, $\\sin x = \\dfrac{\\sqrt3}{2}$, откуда $$x = \\dfrac{\\pi}{3} + 2\\pi k,\\ k \\in \\mathbb Z,$$ $$x = \\dfrac{2\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[4\\pi;\\, \\dfrac{11\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{3} + 2\\pi k$: $$4\\pi \\le \\dfrac{\\pi}{3} + 2\\pi k \\le \\dfrac{11\\pi}{2}$$ $$\\dfrac{11}{6} \\le k \\le \\dfrac{31}{12}$$ $$k = 2$$ $$x = \\dfrac{13\\pi}{3}$$",
    "Серия $\\dfrac{2\\pi}{3} + 2\\pi n$: $$4\\pi \\le \\dfrac{2\\pi}{3} + 2\\pi n \\le \\dfrac{11\\pi}{2}$$ $$\\dfrac{5}{3} \\le n \\le \\dfrac{29}{12}$$ $$n = 2$$ $$x = \\dfrac{14\\pi}{3}$$ Получаем числа: $$\\dfrac{13\\pi}{3};\\ \\dfrac{14\\pi}{3}.$$"
   ]
  },
  {
   "id": "14.fipi.6671FD",
   "group": "sum",
   "fipi": "6671FD",
   "text": "а) Решите уравнение $2\\sin \\left(x + \\dfrac{\\pi}{6}\\right) - 2\\sqrt{3}\\cos^{2} x = \\cos x - 2\\sqrt{3}$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[ -\\dfrac{5\\pi}{2};\\ -\\pi ]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "-13π/6; -2π; -π",
     "tex": "-\\dfrac{13\\pi}{6};\\ -2\\pi;\\ -\\pi"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\pi k,\\ k \\in \\mathbb Z$; $-\\dfrac{\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z$; $-\\dfrac{5\\pi}{6} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $-\\dfrac{13\\pi}{6};\\ -2\\pi;\\ -\\pi$",
   "steps": [
    "а) По формуле синуса суммы $$2\\sin\\left(x + \\dfrac{\\pi}{6}\\right) = \\sqrt3\\sin x + \\cos x,$$ поэтому: $$\\sqrt3\\sin x + \\cos x - 2\\sqrt3\\cos^2 x = \\cos x - 2\\sqrt3$$ $$\\sqrt3\\sin x - 2\\sqrt3\\left(1 - \\sin^2 x\\right) + 2\\sqrt3 = 0$$ $$\\sqrt3\\sin x + 2\\sqrt3\\sin^2 x = 0$$ $$\\sqrt3\\sin x \\cdot (2\\sin x + 1) = 0$$",
    "Значит, $\\sin x = 0$, откуда $$x = \\pi k,\\ k \\in \\mathbb Z,$$ или $\\sin x = -\\dfrac{1}{2}$, откуда $$x = -\\dfrac{\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z,$$ $$x = -\\dfrac{5\\pi}{6} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[ -\\dfrac{5\\pi}{2};\\ -\\pi ]$, с помощью двойных неравенств.",
    "Серия $\\pi k$: $$-\\dfrac{5\\pi}{2} \\le \\pi k \\le -\\pi$$ $$-\\dfrac{5}{2} \\le k \\le -1$$ $$k = -2;\\ -1$$ $$x = -2\\pi;\\ -\\pi$$",
    "Серия $-\\dfrac{\\pi}{6} + 2\\pi n$: $$-\\dfrac{5\\pi}{2} \\le -\\dfrac{\\pi}{6} + 2\\pi n \\le -\\pi$$ $$-\\dfrac{7}{6} \\le n \\le -\\dfrac{5}{12}$$ $$n = -1$$ $$x = -\\dfrac{13\\pi}{6}$$",
    "Серия $-\\dfrac{5\\pi}{6} + 2\\pi m$: $$-\\dfrac{5\\pi}{2} \\le -\\dfrac{5\\pi}{6} + 2\\pi m \\le -\\pi$$ $$-\\dfrac{5}{6} \\le m \\le -\\dfrac{1}{12}$$ $$\\text{целых } m \\text{ нет}$$ Получаем числа: $$-\\dfrac{13\\pi}{6};\\ -2\\pi;\\ -\\pi.$$"
   ]
  },
  {
   "id": "14.fipi.2247B7",
   "group": "sum",
   "fipi": "2247B7",
   "text": "а) Решите уравнение $2\\sin \\left(x + \\dfrac{\\pi}{3}\\right) + \\cos 2x = \\sqrt{3}\\cos x + 1$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[ -3\\pi;\\ -\\dfrac{3\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "-3π; -2π; -11π/6",
     "tex": "-3\\pi;\\ -2\\pi;\\ -\\dfrac{11\\pi}{6}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\pi k,\\ k \\in \\mathbb Z$; $\\dfrac{\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z$; $\\dfrac{5\\pi}{6} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $-3\\pi;\\ -2\\pi;\\ -\\dfrac{11\\pi}{6}$",
   "steps": [
    "а) По формуле синуса суммы $$2\\sin\\left(x + \\dfrac{\\pi}{3}\\right) = \\sin x + \\sqrt3\\cos x,$$ поэтому: $$\\sin x + \\sqrt3\\cos x + \\cos 2x = \\sqrt3\\cos x + 1$$ $$\\sin x + 1 - 2\\sin^2 x - 1 = 0$$ $$\\sin x \\cdot (1 - 2\\sin x) = 0$$",
    "Значит, $\\sin x = 0$, откуда $$x = \\pi k,\\ k \\in \\mathbb Z,$$ или $\\sin x = \\dfrac{1}{2}$, откуда $$x = \\dfrac{\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z,$$ $$x = \\dfrac{5\\pi}{6} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[ -3\\pi;\\ -\\dfrac{3\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\pi k$: $$-3\\pi \\le \\pi k \\le -\\dfrac{3\\pi}{2}$$ $$-3 \\le k \\le -\\dfrac{3}{2}$$ $$k = -3;\\ -2$$ $$x = -3\\pi;\\ -2\\pi$$",
    "Серия $\\dfrac{\\pi}{6} + 2\\pi n$: $$-3\\pi \\le \\dfrac{\\pi}{6} + 2\\pi n \\le -\\dfrac{3\\pi}{2}$$ $$-\\dfrac{19}{12} \\le n \\le -\\dfrac{5}{6}$$ $$n = -1$$ $$x = -\\dfrac{11\\pi}{6}$$",
    "Серия $\\dfrac{5\\pi}{6} + 2\\pi m$: $$-3\\pi \\le \\dfrac{5\\pi}{6} + 2\\pi m \\le -\\dfrac{3\\pi}{2}$$ $$-\\dfrac{23}{12} \\le m \\le -\\dfrac{7}{6}$$ $$\\text{целых } m \\text{ нет}$$ Получаем числа: $$-3\\pi;\\ -2\\pi;\\ -\\dfrac{11\\pi}{6}.$$"
   ]
  },
  {
   "id": "14.fipi.D7FC6F",
   "group": "sum",
   "fipi": "D7FC6F",
   "text": "а) Решите уравнение $2\\sin \\left(x + \\dfrac{\\pi}{3}\\right) - \\sqrt{3}\\cos 2x = \\sin x + \\sqrt{3}$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[ -2\\pi;\\ -\\dfrac{\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "-5π/3; -3π/2; -π/2",
     "tex": "-\\dfrac{5\\pi}{3};\\ -\\dfrac{3\\pi}{2};\\ -\\dfrac{\\pi}{2}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{2} + \\pi k,\\ k \\in \\mathbb Z$; $\\dfrac{\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z$; $-\\dfrac{\\pi}{3} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $-\\dfrac{5\\pi}{3};\\ -\\dfrac{3\\pi}{2};\\ -\\dfrac{\\pi}{2}$",
   "steps": [
    "а) По формуле синуса суммы $$2\\sin\\left(x + \\dfrac{\\pi}{3}\\right) = \\sin x + \\sqrt3\\cos x,$$ поэтому: $$\\sin x + \\sqrt3\\cos x - \\sqrt3\\cos 2x = \\sin x + \\sqrt3$$ $$\\sqrt3\\left(\\cos x - \\cos 2x - 1\\right) = 0$$ $$\\cos x - 2\\cos^2 x + 1 - 1 = 0$$ $$\\cos x \\cdot (1 - 2\\cos x) = 0$$",
    "Значит, $\\cos x = 0$, откуда $$x = \\dfrac{\\pi}{2} + \\pi k,\\ k \\in \\mathbb Z,$$ или $\\cos x = \\dfrac{1}{2}$, откуда $$x = \\dfrac{\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z,$$ $$x = -\\dfrac{\\pi}{3} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[ -2\\pi;\\ -\\dfrac{\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{2} + \\pi k$: $$-2\\pi \\le \\dfrac{\\pi}{2} + \\pi k \\le -\\dfrac{\\pi}{2}$$ $$-\\dfrac{5}{2} \\le k \\le -1$$ $$k = -2;\\ -1$$ $$x = -\\dfrac{3\\pi}{2};\\ -\\dfrac{\\pi}{2}$$",
    "Серия $\\dfrac{\\pi}{3} + 2\\pi n$: $$-2\\pi \\le \\dfrac{\\pi}{3} + 2\\pi n \\le -\\dfrac{\\pi}{2}$$ $$-\\dfrac{7}{6} \\le n \\le -\\dfrac{5}{12}$$ $$n = -1$$ $$x = -\\dfrac{5\\pi}{3}$$",
    "Серия $-\\dfrac{\\pi}{3} + 2\\pi m$: $$-2\\pi \\le -\\dfrac{\\pi}{3} + 2\\pi m \\le -\\dfrac{\\pi}{2}$$ $$-\\dfrac{5}{6} \\le m \\le -\\dfrac{1}{12}$$ $$\\text{целых } m \\text{ нет}$$ Получаем числа: $$-\\dfrac{5\\pi}{3};\\ -\\dfrac{3\\pi}{2};\\ -\\dfrac{\\pi}{2}.$$"
   ]
  },
  {
   "id": "14.fipi.B8F61F",
   "group": "sum",
   "fipi": "B8F61F",
   "text": "а) Решите уравнение $2\\sin \\left(2x + \\dfrac{\\pi}{6}\\right) - \\cos x = \\sqrt{3}\\sin 2x - 1$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[\\dfrac{5\\pi}{2};\\, 4\\pi ]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "5π/2; 7π/2; 11π/3",
     "tex": "\\dfrac{5\\pi}{2};\\ \\dfrac{7\\pi}{2};\\ \\dfrac{11\\pi}{3}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{2} + \\pi k,\\ k \\in \\mathbb Z$; $\\dfrac{\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z$; $-\\dfrac{\\pi}{3} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $\\dfrac{5\\pi}{2};\\ \\dfrac{7\\pi}{2};\\ \\dfrac{11\\pi}{3}$",
   "steps": [
    "а) По формуле синуса суммы $$2\\sin\\left(2x + \\dfrac{\\pi}{6}\\right) = \\sqrt3\\sin 2x + \\cos 2x,$$ поэтому: $$\\sqrt3\\sin 2x + \\cos 2x - \\cos x = \\sqrt3\\sin 2x - 1$$ $$\\cos 2x - \\cos x + 1 = 0$$ $$2\\cos^2 x - 1 - \\cos x + 1 = 0$$ $$\\cos x \\cdot (2\\cos x - 1) = 0$$",
    "Значит, $\\cos x = 0$, откуда $$x = \\dfrac{\\pi}{2} + \\pi k,\\ k \\in \\mathbb Z,$$ или $\\cos x = \\dfrac{1}{2}$, откуда $$x = \\dfrac{\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z,$$ $$x = -\\dfrac{\\pi}{3} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[\\dfrac{5\\pi}{2};\\, 4\\pi ]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{2} + \\pi k$: $$\\dfrac{5\\pi}{2} \\le \\dfrac{\\pi}{2} + \\pi k \\le 4\\pi$$ $$2 \\le k \\le \\dfrac{7}{2}$$ $$k = 2;\\ 3$$ $$x = \\dfrac{5\\pi}{2};\\ \\dfrac{7\\pi}{2}$$",
    "Серия $\\dfrac{\\pi}{3} + 2\\pi n$: $$\\dfrac{5\\pi}{2} \\le \\dfrac{\\pi}{3} + 2\\pi n \\le 4\\pi$$ $$\\dfrac{13}{12} \\le n \\le \\dfrac{11}{6}$$ $$\\text{целых } n \\text{ нет}$$",
    "Серия $-\\dfrac{\\pi}{3} + 2\\pi m$: $$\\dfrac{5\\pi}{2} \\le -\\dfrac{\\pi}{3} + 2\\pi m \\le 4\\pi$$ $$\\dfrac{17}{12} \\le m \\le \\dfrac{13}{6}$$ $$m = 2$$ $$x = \\dfrac{11\\pi}{3}$$ Получаем числа: $$\\dfrac{5\\pi}{2};\\ \\dfrac{7\\pi}{2};\\ \\dfrac{11\\pi}{3}.$$"
   ]
  },
  {
   "id": "14.fipi.9BA813",
   "group": "sum",
   "fipi": "9BA813",
   "text": "а) Решите уравнение $\\sin x + 2\\sin \\left(2x + \\dfrac{\\pi}{6}\\right) = \\sqrt{3}\\sin 2x + 1$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[ -\\dfrac{7\\pi}{2};\\ -2\\pi ]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "-19π/6; -3π; -2π",
     "tex": "-\\dfrac{19\\pi}{6};\\ -3\\pi;\\ -2\\pi"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\pi k,\\ k \\in \\mathbb Z$; $\\dfrac{\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z$; $\\dfrac{5\\pi}{6} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $-\\dfrac{19\\pi}{6};\\ -3\\pi;\\ -2\\pi$",
   "steps": [
    "а) По формуле синуса суммы $$2\\sin\\left(2x + \\dfrac{\\pi}{6}\\right) = \\sqrt3\\sin 2x + \\cos 2x,$$ поэтому: $$\\sin x + \\sqrt3\\sin 2x + \\cos 2x = \\sqrt3\\sin 2x + 1$$ $$\\sin x + 1 - 2\\sin^2 x - 1 = 0$$ $$\\sin x \\cdot (1 - 2\\sin x) = 0$$",
    "Значит, $\\sin x = 0$, откуда $$x = \\pi k,\\ k \\in \\mathbb Z,$$ или $\\sin x = \\dfrac{1}{2}$, откуда $$x = \\dfrac{\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z,$$ $$x = \\dfrac{5\\pi}{6} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[ -\\dfrac{7\\pi}{2};\\ -2\\pi ]$, с помощью двойных неравенств.",
    "Серия $\\pi k$: $$-\\dfrac{7\\pi}{2} \\le \\pi k \\le -2\\pi$$ $$-\\dfrac{7}{2} \\le k \\le -2$$ $$k = -3;\\ -2$$ $$x = -3\\pi;\\ -2\\pi$$",
    "Серия $\\dfrac{\\pi}{6} + 2\\pi n$: $$-\\dfrac{7\\pi}{2} \\le \\dfrac{\\pi}{6} + 2\\pi n \\le -2\\pi$$ $$-\\dfrac{11}{6} \\le n \\le -\\dfrac{13}{12}$$ $$\\text{целых } n \\text{ нет}$$",
    "Серия $\\dfrac{5\\pi}{6} + 2\\pi m$: $$-\\dfrac{7\\pi}{2} \\le \\dfrac{5\\pi}{6} + 2\\pi m \\le -2\\pi$$ $$-\\dfrac{13}{6} \\le m \\le -\\dfrac{17}{12}$$ $$m = -2$$ $$x = -\\dfrac{19\\pi}{6}$$ Получаем числа: $$-\\dfrac{19\\pi}{6};\\ -3\\pi;\\ -2\\pi.$$"
   ]
  },
  {
   "id": "14.fipi.FDA042",
   "group": "exptrig",
   "fipi": "FDA042",
   "text": "а) Решите уравнение $\\dfrac{{9}^{\\sin 2x} - {3}^{2\\sqrt{2}\\sin x}}{\\sqrt{11\\sin x}} = 0$.<br>б) Найдите все корни этого уравнения, принадлежащие отрезку $[\\dfrac{7\\pi}{2};\\, 5\\pi ]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "17π/4",
     "tex": "\\dfrac{17\\pi}{4}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{4} + 2\\pi k,\\ k \\in \\mathbb Z$<br>б) $\\dfrac{17\\pi}{4}$",
   "steps": [
    "а) Уравнение определено при $\\sin x > 0$. Дробь равна нулю, когда равен нулю числитель: $$9^{\\sin 2x} = 3^{2\\sqrt2\\sin x}$$ $$3^{2\\sin 2x} = 3^{2\\sqrt2\\sin x}$$ $$\\sin 2x = \\sqrt2\\sin x$$ $$2\\sin x\\cos x - \\sqrt2\\sin x = 0$$ $$\\sin x \\cdot \\left(2\\cos x - \\sqrt2\\right) = 0$$",
    "Так как $\\sin x > 0$, остаётся $\\cos x = \\dfrac{\\sqrt2}{2}$, откуда $x = \\pm\\dfrac{\\pi}{4} + 2\\pi k$. Условию $\\sin x > 0$ удовлетворяет только серия $$x = \\dfrac{\\pi}{4} + 2\\pi k,\\ k \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[\\dfrac{7\\pi}{2};\\, 5\\pi ]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{4} + 2\\pi k$: $$\\dfrac{7\\pi}{2} \\le \\dfrac{\\pi}{4} + 2\\pi k \\le 5\\pi$$ $$\\dfrac{13}{8} \\le k \\le \\dfrac{19}{8}$$ $$k = 2$$ $$x = \\dfrac{17\\pi}{4}$$ Получаем числа: $$\\dfrac{17\\pi}{4}.$$"
   ]
  },
  {
   "id": "14.fipi.A6BC58",
   "group": "exptrig",
   "fipi": "A6BC58",
   "text": "а) Решите уравнение $\\dfrac{{4}^{\\sin 2x} - {2}^{2\\sqrt{3}\\sin x}}{\\sqrt{7\\sin x}} = 0$.<br>б) Найдите все его корни, принадлежащие отрезку $[ - \\dfrac{13\\pi}{2};\\ -5\\pi ]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "-35π/6",
     "tex": "-\\dfrac{35\\pi}{6}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{6} + 2\\pi k,\\ k \\in \\mathbb Z$<br>б) $-\\dfrac{35\\pi}{6}$",
   "steps": [
    "а) Уравнение определено при $\\sin x > 0$. Дробь равна нулю, когда равен нулю числитель: $$4^{\\sin 2x} = 2^{2\\sqrt3\\sin x}$$ $$2^{2\\sin 2x} = 2^{2\\sqrt3\\sin x}$$ $$\\sin 2x = \\sqrt3\\sin x$$ $$2\\sin x\\cos x - \\sqrt3\\sin x = 0$$ $$\\sin x \\cdot \\left(2\\cos x - \\sqrt3\\right) = 0$$",
    "Так как $\\sin x > 0$, остаётся $\\cos x = \\dfrac{\\sqrt3}{2}$, откуда $x = \\pm\\dfrac{\\pi}{6} + 2\\pi k$. Условию $\\sin x > 0$ удовлетворяет только серия $$x = \\dfrac{\\pi}{6} + 2\\pi k,\\ k \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[ - \\dfrac{13\\pi}{2};\\ -5\\pi ]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{6} + 2\\pi k$: $$-\\dfrac{13\\pi}{2} \\le \\dfrac{\\pi}{6} + 2\\pi k \\le -5\\pi$$ $$-\\dfrac{10}{3} \\le k \\le -\\dfrac{31}{12}$$ $$k = -3$$ $$x = -\\dfrac{35\\pi}{6}$$ Получаем числа: $$-\\dfrac{35\\pi}{6}.$$"
   ]
  },
  {
   "id": "14.fipi.617B18",
   "group": "exptrig",
   "fipi": "617B18",
   "text": "а) Решите уравнение $8 \\cdot {16}^{\\sin^{2} x} - 2 \\cdot {4}^{\\cos 2x} = 63$.<br>б) Найдите все корни этого уравнения, принадлежащие отрезку $[\\dfrac{7\\pi}{2};\\, 5\\pi ]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "11π/3; 13π/3; 14π/3",
     "tex": "\\dfrac{11\\pi}{3};\\ \\dfrac{13\\pi}{3};\\ \\dfrac{14\\pi}{3}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{3} + \\pi k,\\ k \\in \\mathbb Z$; $-\\dfrac{\\pi}{3} + \\pi n,\\ n \\in \\mathbb Z$<br>б) $\\dfrac{11\\pi}{3};\\ \\dfrac{13\\pi}{3};\\ \\dfrac{14\\pi}{3}$",
   "steps": [
    "а) Приведём степени к основанию 4. Так как $16^{\\sin^2 x} = 4^{2\\sin^2 x}$ и $\\cos 2x = 1 - 2\\sin^2 x$: $$4^{\\cos 2x} = \\dfrac{4}{4^{2\\sin^2 x}}$$ Пусть $t = 4^{2\\sin^2 x}$, $t > 0$: $$8t - \\dfrac{8}{t} = 63$$ $$8t^2 - 63t - 8 = 0$$ $$D = 3969 + 256 = 4225 = 65^2$$ $$t_1 = 8,\\quad t_2 = -\\dfrac{1}{8}$$",
    "Корень $t_2 < 0$ не подходит. Значит: $$4^{2\\sin^2 x} = 8$$ $$2^{4\\sin^2 x} = 2^3$$ $$\\sin^2 x = \\dfrac{3}{4}$$ $$\\sin x = \\pm\\dfrac{\\sqrt3}{2}$$ откуда $$x = \\dfrac{\\pi}{3} + \\pi k,\\ k \\in \\mathbb Z,$$ $$x = -\\dfrac{\\pi}{3} + \\pi n,\\ n \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[\\dfrac{7\\pi}{2};\\, 5\\pi ]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{3} + \\pi k$: $$\\dfrac{7\\pi}{2} \\le \\dfrac{\\pi}{3} + \\pi k \\le 5\\pi$$ $$\\dfrac{19}{6} \\le k \\le \\dfrac{14}{3}$$ $$k = 4$$ $$x = \\dfrac{13\\pi}{3}$$",
    "Серия $-\\dfrac{\\pi}{3} + \\pi n$: $$\\dfrac{7\\pi}{2} \\le -\\dfrac{\\pi}{3} + \\pi n \\le 5\\pi$$ $$\\dfrac{23}{6} \\le n \\le \\dfrac{16}{3}$$ $$n = 4;\\ 5$$ $$x = \\dfrac{11\\pi}{3};\\ \\dfrac{14\\pi}{3}$$ Получаем числа: $$\\dfrac{11\\pi}{3};\\ \\dfrac{13\\pi}{3};\\ \\dfrac{14\\pi}{3}.$$"
   ]
  },
  {
   "id": "14.fipi.AD8FD9",
   "group": "exptrig",
   "fipi": "AD8FD9",
   "text": "а) Решите уравнение $4 \\cdot {16}^{\\sin^{2} x} - 6 \\cdot {4}^{\\cos 2x} = 29$.<br>б) Найдите все корни этого уравнения, принадлежащие отрезку $[\\dfrac{3\\pi}{2};\\, 3\\pi ]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "5π/3; 7π/3; 8π/3",
     "tex": "\\dfrac{5\\pi}{3};\\ \\dfrac{7\\pi}{3};\\ \\dfrac{8\\pi}{3}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{3} + \\pi k,\\ k \\in \\mathbb Z$; $-\\dfrac{\\pi}{3} + \\pi n,\\ n \\in \\mathbb Z$<br>б) $\\dfrac{5\\pi}{3};\\ \\dfrac{7\\pi}{3};\\ \\dfrac{8\\pi}{3}$",
   "steps": [
    "а) Приведём степени к основанию 4. Так как $16^{\\sin^2 x} = 4^{2\\sin^2 x}$ и $\\cos 2x = 1 - 2\\sin^2 x$: $$4^{\\cos 2x} = \\dfrac{4}{4^{2\\sin^2 x}}$$ Пусть $t = 4^{2\\sin^2 x}$, $t > 0$: $$4t - \\dfrac{24}{t} = 29$$ $$4t^2 - 29t - 24 = 0$$ $$D = 841 + 384 = 1225 = 35^2$$ $$t_1 = 8,\\quad t_2 = -\\dfrac{3}{4}$$",
    "Корень $t_2 < 0$ не подходит. Значит: $$4^{2\\sin^2 x} = 8$$ $$2^{4\\sin^2 x} = 2^3$$ $$\\sin^2 x = \\dfrac{3}{4}$$ $$\\sin x = \\pm\\dfrac{\\sqrt3}{2}$$ откуда $$x = \\dfrac{\\pi}{3} + \\pi k,\\ k \\in \\mathbb Z,$$ $$x = -\\dfrac{\\pi}{3} + \\pi n,\\ n \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[\\dfrac{3\\pi}{2};\\, 3\\pi ]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{3} + \\pi k$: $$\\dfrac{3\\pi}{2} \\le \\dfrac{\\pi}{3} + \\pi k \\le 3\\pi$$ $$\\dfrac{7}{6} \\le k \\le \\dfrac{8}{3}$$ $$k = 2$$ $$x = \\dfrac{7\\pi}{3}$$",
    "Серия $-\\dfrac{\\pi}{3} + \\pi n$: $$\\dfrac{3\\pi}{2} \\le -\\dfrac{\\pi}{3} + \\pi n \\le 3\\pi$$ $$\\dfrac{11}{6} \\le n \\le \\dfrac{10}{3}$$ $$n = 2;\\ 3$$ $$x = \\dfrac{5\\pi}{3};\\ \\dfrac{8\\pi}{3}$$ Получаем числа: $$\\dfrac{5\\pi}{3};\\ \\dfrac{7\\pi}{3};\\ \\dfrac{8\\pi}{3}.$$"
   ]
  },
  {
   "id": "14.fipi.1CAE46",
   "group": "exptrig",
   "fipi": "1CAE46",
   "text": "а) Решите уравнение ${16}^{\\sin x} + {16}^{\\sin \\, (x + \\pi)} = \\dfrac{17}{4}$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[\\dfrac{3\\pi}{2};\\, 3\\pi ]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "11π/6; 13π/6; 17π/6",
     "tex": "\\dfrac{11\\pi}{6};\\ \\dfrac{13\\pi}{6};\\ \\dfrac{17\\pi}{6}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{6} + \\pi k,\\ k \\in \\mathbb Z$; $-\\dfrac{\\pi}{6} + \\pi n,\\ n \\in \\mathbb Z$<br>б) $\\dfrac{11\\pi}{6};\\ \\dfrac{13\\pi}{6};\\ \\dfrac{17\\pi}{6}$",
   "steps": [
    "а) Так как $\\sin(x + \\pi) = -\\sin x$, уравнение имеет вид: $$16^{\\sin x} + \\dfrac{1}{16^{\\sin x}} = \\dfrac{17}{4}$$ Пусть $t = 16^{\\sin x}$, $t > 0$: $$4t^2 - 17t + 4 = 0$$ $$t_1 = 4,\\quad t_2 = \\dfrac{1}{4}$$",
    "Значит, $16^{\\sin x} = 4$, откуда $\\sin x = \\dfrac{1}{2}$, или $16^{\\sin x} = \\dfrac{1}{4}$, откуда $\\sin x = -\\dfrac{1}{2}$. Получаем: $$x = \\dfrac{\\pi}{6} + \\pi k,\\ k \\in \\mathbb Z,$$ $$x = -\\dfrac{\\pi}{6} + \\pi n,\\ n \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[\\dfrac{3\\pi}{2};\\, 3\\pi ]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{6} + \\pi k$: $$\\dfrac{3\\pi}{2} \\le \\dfrac{\\pi}{6} + \\pi k \\le 3\\pi$$ $$\\dfrac{4}{3} \\le k \\le \\dfrac{17}{6}$$ $$k = 2$$ $$x = \\dfrac{13\\pi}{6}$$",
    "Серия $-\\dfrac{\\pi}{6} + \\pi n$: $$\\dfrac{3\\pi}{2} \\le -\\dfrac{\\pi}{6} + \\pi n \\le 3\\pi$$ $$\\dfrac{5}{3} \\le n \\le \\dfrac{19}{6}$$ $$n = 2;\\ 3$$ $$x = \\dfrac{11\\pi}{6};\\ \\dfrac{17\\pi}{6}$$ Получаем числа: $$\\dfrac{11\\pi}{6};\\ \\dfrac{13\\pi}{6};\\ \\dfrac{17\\pi}{6}.$$"
   ]
  },
  {
   "id": "14.fipi.F438D2",
   "group": "exptrig",
   "fipi": "F438D2",
   "text": "а) Решите уравнение ${16}^{\\cos x} + {16}^{\\cos \\, (\\pi - x)} = \\dfrac{17}{4}$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[\\pi;\\, \\dfrac{5\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "4π/3; 5π/3; 7π/3",
     "tex": "\\dfrac{4\\pi}{3};\\ \\dfrac{5\\pi}{3};\\ \\dfrac{7\\pi}{3}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{3} + \\pi k,\\ k \\in \\mathbb Z$; $-\\dfrac{\\pi}{3} + \\pi n,\\ n \\in \\mathbb Z$<br>б) $\\dfrac{4\\pi}{3};\\ \\dfrac{5\\pi}{3};\\ \\dfrac{7\\pi}{3}$",
   "steps": [
    "а) Так как $\\cos(\\pi - x) = -\\cos x$, уравнение имеет вид: $$16^{\\cos x} + \\dfrac{1}{16^{\\cos x}} = \\dfrac{17}{4}$$ Пусть $t = 16^{\\cos x}$, $t > 0$: $$4t^2 - 17t + 4 = 0$$ $$t_1 = 4,\\quad t_2 = \\dfrac{1}{4}$$",
    "Значит, $16^{\\cos x} = 4$, откуда $\\cos x = \\dfrac{1}{2}$, или $16^{\\cos x} = \\dfrac{1}{4}$, откуда $\\cos x = -\\dfrac{1}{2}$. Получаем: $$x = \\dfrac{\\pi}{3} + \\pi k,\\ k \\in \\mathbb Z,$$ $$x = -\\dfrac{\\pi}{3} + \\pi n,\\ n \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[\\pi;\\, \\dfrac{5\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{3} + \\pi k$: $$\\pi \\le \\dfrac{\\pi}{3} + \\pi k \\le \\dfrac{5\\pi}{2}$$ $$\\dfrac{2}{3} \\le k \\le \\dfrac{13}{6}$$ $$k = 1;\\ 2$$ $$x = \\dfrac{4\\pi}{3};\\ \\dfrac{7\\pi}{3}$$",
    "Серия $-\\dfrac{\\pi}{3} + \\pi n$: $$\\pi \\le -\\dfrac{\\pi}{3} + \\pi n \\le \\dfrac{5\\pi}{2}$$ $$\\dfrac{4}{3} \\le n \\le \\dfrac{17}{6}$$ $$n = 2$$ $$x = \\dfrac{5\\pi}{3}$$ Получаем числа: $$\\dfrac{4\\pi}{3};\\ \\dfrac{5\\pi}{3};\\ \\dfrac{7\\pi}{3}.$$"
   ]
  },
  {
   "id": "14.fipi.54D407",
   "group": "exptrig",
   "fipi": "54D407",
   "text": "а) Решите уравнение ${16}^{\\sin x} - 6 \\cdot {4}^{\\sin x} + 8 = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[ -5\\pi;\\ -\\dfrac{7\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "-23π/6; -7π/2",
     "tex": "-\\dfrac{23\\pi}{6};\\ -\\dfrac{7\\pi}{2}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{6} + 2\\pi k,\\ k \\in \\mathbb Z$; $\\dfrac{5\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z$; $\\dfrac{\\pi}{2} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $-\\dfrac{23\\pi}{6};\\ -\\dfrac{7\\pi}{2}$",
   "steps": [
    "а) Так как $16^{\\sin x} = \\left(4^{\\sin x}\\right)^2$, сделаем замену $t = 4^{\\sin x}$, $t > 0$: $$t^2 - 6t + 8 = 0$$ $$t_1 = 2,\\quad t_2 = 4$$",
    "Значит, $4^{\\sin x} = 2$, откуда $\\sin x = \\dfrac{1}{2}$: $$x = \\dfrac{\\pi}{6} + 2\\pi k,\\ k \\in \\mathbb Z,$$ $$x = \\dfrac{5\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z,$$ или $4^{\\sin x} = 4$, откуда $\\sin x = 1$: $$x = \\dfrac{\\pi}{2} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[ -5\\pi;\\ -\\dfrac{7\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{6} + 2\\pi k$: $$-5\\pi \\le \\dfrac{\\pi}{6} + 2\\pi k \\le -\\dfrac{7\\pi}{2}$$ $$-\\dfrac{31}{12} \\le k \\le -\\dfrac{11}{6}$$ $$k = -2$$ $$x = -\\dfrac{23\\pi}{6}$$",
    "Серия $\\dfrac{5\\pi}{6} + 2\\pi n$: $$-5\\pi \\le \\dfrac{5\\pi}{6} + 2\\pi n \\le -\\dfrac{7\\pi}{2}$$ $$-\\dfrac{35}{12} \\le n \\le -\\dfrac{13}{6}$$ $$\\text{целых } n \\text{ нет}$$",
    "Серия $\\dfrac{\\pi}{2} + 2\\pi m$: $$-5\\pi \\le \\dfrac{\\pi}{2} + 2\\pi m \\le -\\dfrac{7\\pi}{2}$$ $$-\\dfrac{11}{4} \\le m \\le -2$$ $$m = -2$$ $$x = -\\dfrac{7\\pi}{2}$$ Получаем числа: $$-\\dfrac{23\\pi}{6};\\ -\\dfrac{7\\pi}{2}.$$"
   ]
  },
  {
   "id": "14.fipi.0C47ED",
   "group": "exptrig",
   "fipi": "0C47ED",
   "text": "а) Решите уравнение $9 \\cdot {81}^{\\cos x} - 28 \\cdot {9}^{\\cos x} + 3 = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[\\dfrac{5\\pi}{2};\\, 4\\pi ]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "3π; 11π/3",
     "tex": "3\\pi;\\ \\dfrac{11\\pi}{3}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{3} + 2\\pi k,\\ k \\in \\mathbb Z$; $-\\dfrac{\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z$; $\\pi + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $3\\pi;\\ \\dfrac{11\\pi}{3}$",
   "steps": [
    "а) Так как $81^{\\cos x} = \\left(9^{\\cos x}\\right)^2$, сделаем замену $t = 9^{\\cos x}$, $t > 0$: $$9t^2 - 28t + 3 = 0$$ $$D = 784 - 108 = 676 = 26^2$$ $$t_1 = 3,\\quad t_2 = \\dfrac{1}{9}$$",
    "Значит, $9^{\\cos x} = 3$, откуда $\\cos x = \\dfrac{1}{2}$: $$x = \\dfrac{\\pi}{3} + 2\\pi k,\\ k \\in \\mathbb Z,$$ $$x = -\\dfrac{\\pi}{3} + 2\\pi n,\\ n \\in \\mathbb Z,$$ или $9^{\\cos x} = \\dfrac{1}{9}$, откуда $\\cos x = -1$: $$x = \\pi + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[\\dfrac{5\\pi}{2};\\, 4\\pi ]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{3} + 2\\pi k$: $$\\dfrac{5\\pi}{2} \\le \\dfrac{\\pi}{3} + 2\\pi k \\le 4\\pi$$ $$\\dfrac{13}{12} \\le k \\le \\dfrac{11}{6}$$ $$\\text{целых } k \\text{ нет}$$",
    "Серия $-\\dfrac{\\pi}{3} + 2\\pi n$: $$\\dfrac{5\\pi}{2} \\le -\\dfrac{\\pi}{3} + 2\\pi n \\le 4\\pi$$ $$\\dfrac{17}{12} \\le n \\le \\dfrac{13}{6}$$ $$n = 2$$ $$x = \\dfrac{11\\pi}{3}$$",
    "Серия $\\pi + 2\\pi m$: $$\\dfrac{5\\pi}{2} \\le \\pi + 2\\pi m \\le 4\\pi$$ $$\\dfrac{3}{4} \\le m \\le \\dfrac{3}{2}$$ $$m = 1$$ $$x = 3\\pi$$ Получаем числа: $$3\\pi;\\ \\dfrac{11\\pi}{3}.$$"
   ]
  },
  {
   "id": "14.fipi.51D289",
   "group": "exptrig",
   "fipi": "51D289",
   "text": "а) Решите уравнение $27 \\cdot {81}^{\\sin x} - 12 \\cdot {9}^{\\sin x} + 1 = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[\\dfrac{3\\pi}{2};\\, 3\\pi ]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "3π/2; 11π/6",
     "tex": "\\dfrac{3\\pi}{2};\\ \\dfrac{11\\pi}{6}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $-\\dfrac{\\pi}{6} + 2\\pi k,\\ k \\in \\mathbb Z$; $-\\dfrac{5\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z$; $-\\dfrac{\\pi}{2} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $\\dfrac{3\\pi}{2};\\ \\dfrac{11\\pi}{6}$",
   "steps": [
    "а) Так как $81^{\\sin x} = \\left(9^{\\sin x}\\right)^2$, сделаем замену $t = 9^{\\sin x}$, $t > 0$: $$27t^2 - 12t + 1 = 0$$ $$D = 144 - 108 = 36$$ $$t_1 = \\dfrac{1}{3},\\quad t_2 = \\dfrac{1}{9}$$",
    "Значит, $9^{\\sin x} = \\dfrac{1}{3}$, откуда $\\sin x = -\\dfrac{1}{2}$: $$x = -\\dfrac{\\pi}{6} + 2\\pi k,\\ k \\in \\mathbb Z,$$ $$x = -\\dfrac{5\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z,$$ или $9^{\\sin x} = \\dfrac{1}{9}$, откуда $\\sin x = -1$: $$x = -\\dfrac{\\pi}{2} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[\\dfrac{3\\pi}{2};\\, 3\\pi ]$, с помощью двойных неравенств.",
    "Серия $-\\dfrac{\\pi}{6} + 2\\pi k$: $$\\dfrac{3\\pi}{2} \\le -\\dfrac{\\pi}{6} + 2\\pi k \\le 3\\pi$$ $$\\dfrac{5}{6} \\le k \\le \\dfrac{19}{12}$$ $$k = 1$$ $$x = \\dfrac{11\\pi}{6}$$",
    "Серия $-\\dfrac{5\\pi}{6} + 2\\pi n$: $$\\dfrac{3\\pi}{2} \\le -\\dfrac{5\\pi}{6} + 2\\pi n \\le 3\\pi$$ $$\\dfrac{7}{6} \\le n \\le \\dfrac{23}{12}$$ $$\\text{целых } n \\text{ нет}$$",
    "Серия $-\\dfrac{\\pi}{2} + 2\\pi m$: $$\\dfrac{3\\pi}{2} \\le -\\dfrac{\\pi}{2} + 2\\pi m \\le 3\\pi$$ $$1 \\le m \\le \\dfrac{7}{4}$$ $$m = 1$$ $$x = \\dfrac{3\\pi}{2}$$ Получаем числа: $$\\dfrac{3\\pi}{2};\\ \\dfrac{11\\pi}{6}.$$"
   ]
  },
  {
   "id": "14.fipi.53A21E",
   "group": "exptrig",
   "fipi": "53A21E",
   "text": "а) Решите уравнение ${\\left(\\dfrac{1}{49}\\right)}^{\\sin \\, (x + \\pi)} = {7}^{2\\sqrt{3}\\sin \\, \\left(\\dfrac{\\pi}{2} - x\\right)}$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[3\\pi;\\, \\dfrac{9\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "10π/3; 13π/3",
     "tex": "\\dfrac{10\\pi}{3};\\ \\dfrac{13\\pi}{3}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{3} + \\pi k,\\ k \\in \\mathbb Z$<br>б) $\\dfrac{10\\pi}{3};\\ \\dfrac{13\\pi}{3}$",
   "steps": [
    "а) Так как $\\sin(x + \\pi) = -\\sin x$ и $\\sin\\left(\\dfrac{\\pi}{2} - x\\right) = \\cos x$, левая часть равна $$\\left(\\dfrac{1}{49}\\right)^{-\\sin x} = 49^{\\sin x} = 7^{2\\sin x},$$ и уравнение принимает вид: $$7^{2\\sin x} = 7^{2\\sqrt3\\cos x}$$ $$\\sin x = \\sqrt3\\cos x$$",
    "При $\\cos x = 0$ равенство не выполняется, поэтому делим на $\\cos x$: $$\\operatorname{tg} x = \\sqrt3$$ $$x = \\dfrac{\\pi}{3} + \\pi k,\\ k \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[3\\pi;\\, \\dfrac{9\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{3} + \\pi k$: $$3\\pi \\le \\dfrac{\\pi}{3} + \\pi k \\le \\dfrac{9\\pi}{2}$$ $$\\dfrac{8}{3} \\le k \\le \\dfrac{25}{6}$$ $$k = 3;\\ 4$$ $$x = \\dfrac{10\\pi}{3};\\ \\dfrac{13\\pi}{3}$$ Получаем числа: $$\\dfrac{10\\pi}{3};\\ \\dfrac{13\\pi}{3}.$$"
   ]
  },
  {
   "id": "14.fipi.4FF160",
   "group": "exptrig",
   "fipi": "4FF160",
   "text": "а) Решите уравнение ${49}^{\\sin x} = {\\left(\\dfrac{1}{7}\\right)}^{-\\sqrt{2}\\sin 2x}$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[2\\pi;\\, \\dfrac{7\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "2π; 9π/4; 3π",
     "tex": "2\\pi;\\ \\dfrac{9\\pi}{4};\\ 3\\pi"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\pi k,\\ k \\in \\mathbb Z$; $\\dfrac{\\pi}{4} + 2\\pi n,\\ n \\in \\mathbb Z$; $-\\dfrac{\\pi}{4} + 2\\pi m,\\ m \\in \\mathbb Z$<br>б) $2\\pi;\\ \\dfrac{9\\pi}{4};\\ 3\\pi$",
   "steps": [
    "а) Приведём обе части к основанию 7: $$7^{2\\sin x} = 7^{\\sqrt2\\sin 2x}$$ $$2\\sin x = 2\\sqrt2\\sin x\\cos x$$ $$2\\sin x \\cdot \\left(1 - \\sqrt2\\cos x\\right) = 0$$",
    "Значит, $\\sin x = 0$, откуда $$x = \\pi k,\\ k \\in \\mathbb Z,$$ или $\\cos x = \\dfrac{\\sqrt2}{2}$, откуда $$x = \\dfrac{\\pi}{4} + 2\\pi n,\\ n \\in \\mathbb Z,$$ $$x = -\\dfrac{\\pi}{4} + 2\\pi m,\\ m \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[2\\pi;\\, \\dfrac{7\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\pi k$: $$2\\pi \\le \\pi k \\le \\dfrac{7\\pi}{2}$$ $$2 \\le k \\le \\dfrac{7}{2}$$ $$k = 2;\\ 3$$ $$x = 2\\pi;\\ 3\\pi$$",
    "Серия $\\dfrac{\\pi}{4} + 2\\pi n$: $$2\\pi \\le \\dfrac{\\pi}{4} + 2\\pi n \\le \\dfrac{7\\pi}{2}$$ $$\\dfrac{7}{8} \\le n \\le \\dfrac{13}{8}$$ $$n = 1$$ $$x = \\dfrac{9\\pi}{4}$$",
    "Серия $-\\dfrac{\\pi}{4} + 2\\pi m$: $$2\\pi \\le -\\dfrac{\\pi}{4} + 2\\pi m \\le \\dfrac{7\\pi}{2}$$ $$\\dfrac{9}{8} \\le m \\le \\dfrac{15}{8}$$ $$\\text{целых } m \\text{ нет}$$ Получаем числа: $$2\\pi;\\ \\dfrac{9\\pi}{4};\\ 3\\pi.$$"
   ]
  },
  {
   "id": "14.fipi.638272",
   "group": "logtrig",
   "fipi": "638272",
   "text": "а) Решите уравнение $\\dfrac{{\\log}_{2}^{2}(\\sin x) + \\log_{2} (\\sin x)}{2\\cos x + \\sqrt{3}} = 0$.<br>б) Найдите все корни этого уравнения, принадлежащие отрезку $[0;\\, \\dfrac{3\\pi}{2}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "π/6; π/2",
     "tex": "\\dfrac{\\pi}{6};\\ \\dfrac{\\pi}{2}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{2} + 2\\pi k,\\ k \\in \\mathbb Z$; $\\dfrac{\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z$<br>б) $\\dfrac{\\pi}{6};\\ \\dfrac{\\pi}{2}$",
   "steps": [
    "а) Уравнение определено при $\\sin x > 0$ и $2\\cos x + \\sqrt3 \\ne 0$. Числитель равен нулю: $$\\log_2(\\sin x) \\cdot \\left(\\log_2(\\sin x) + 1\\right) = 0$$ $$\\log_2(\\sin x) = 0 \\quad\\text{или}\\quad \\log_2(\\sin x) = -1$$ $$\\sin x = 1 \\quad\\text{или}\\quad \\sin x = \\dfrac{1}{2}$$",
    "Если $\\sin x = 1$, то $x = \\dfrac{\\pi}{2} + 2\\pi k$; здесь $\\cos x = 0$, знаменатель не равен нулю. Если $\\sin x = \\dfrac{1}{2}$, то $x = \\dfrac{\\pi}{6} + 2\\pi n$ (здесь $\\cos x = \\dfrac{\\sqrt3}{2}$ — подходит) или $x = \\dfrac{5\\pi}{6} + 2\\pi m$ (здесь $\\cos x = -\\dfrac{\\sqrt3}{2}$, знаменатель обращается в нуль — не подходит). Получаем: $$x = \\dfrac{\\pi}{2} + 2\\pi k,\\ k \\in \\mathbb Z,$$ $$x = \\dfrac{\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[0;\\, \\dfrac{3\\pi}{2}]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{2} + 2\\pi k$: $$0 \\le \\dfrac{\\pi}{2} + 2\\pi k \\le \\dfrac{3\\pi}{2}$$ $$-\\dfrac{1}{4} \\le k \\le \\dfrac{1}{2}$$ $$k = 0$$ $$x = \\dfrac{\\pi}{2}$$",
    "Серия $\\dfrac{\\pi}{6} + 2\\pi n$: $$0 \\le \\dfrac{\\pi}{6} + 2\\pi n \\le \\dfrac{3\\pi}{2}$$ $$-\\dfrac{1}{12} \\le n \\le \\dfrac{2}{3}$$ $$n = 0$$ $$x = \\dfrac{\\pi}{6}$$ Получаем числа: $$\\dfrac{\\pi}{6};\\ \\dfrac{\\pi}{2}.$$"
   ]
  },
  {
   "id": "14.fipi.B2FAAF",
   "group": "logtrig",
   "fipi": "B2FAAF",
   "text": "а) Решите уравнение $\\dfrac{{\\log}_{2}^{2}(\\sin x) + \\log_{2} (\\sin x)}{2\\cos x - \\sqrt{3}} = 0$.<br>б) Найдите все корни этого уравнения, принадлежащие отрезку $[\\dfrac{\\pi}{2};\\, 2\\pi ]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "π/2; 5π/6",
     "tex": "\\dfrac{\\pi}{2};\\ \\dfrac{5\\pi}{6}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{\\pi}{2} + 2\\pi k,\\ k \\in \\mathbb Z$; $\\dfrac{5\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z$<br>б) $\\dfrac{\\pi}{2};\\ \\dfrac{5\\pi}{6}$",
   "steps": [
    "а) Уравнение определено при $\\sin x > 0$ и $2\\cos x - \\sqrt3 \\ne 0$. Числитель равен нулю: $$\\log_2(\\sin x) \\cdot \\left(\\log_2(\\sin x) + 1\\right) = 0$$ $$\\log_2(\\sin x) = 0 \\quad\\text{или}\\quad \\log_2(\\sin x) = -1$$ $$\\sin x = 1 \\quad\\text{или}\\quad \\sin x = \\dfrac{1}{2}$$",
    "Если $\\sin x = 1$, то $x = \\dfrac{\\pi}{2} + 2\\pi k$; здесь $\\cos x = 0$, знаменатель не равен нулю. Если $\\sin x = \\dfrac{1}{2}$, то $x = \\dfrac{\\pi}{6} + 2\\pi m$ (здесь $\\cos x = \\dfrac{\\sqrt3}{2}$, знаменатель обращается в нуль — не подходит) или $x = \\dfrac{5\\pi}{6} + 2\\pi n$ (здесь $\\cos x = -\\dfrac{\\sqrt3}{2}$ — подходит). Получаем: $$x = \\dfrac{\\pi}{2} + 2\\pi k,\\ k \\in \\mathbb Z,$$ $$x = \\dfrac{5\\pi}{6} + 2\\pi n,\\ n \\in \\mathbb Z.$$",
    "б) Отберём корни, принадлежащие отрезку $[\\dfrac{\\pi}{2};\\, 2\\pi ]$, с помощью двойных неравенств.",
    "Серия $\\dfrac{\\pi}{2} + 2\\pi k$: $$\\dfrac{\\pi}{2} \\le \\dfrac{\\pi}{2} + 2\\pi k \\le 2\\pi$$ $$0 \\le k \\le \\dfrac{3}{4}$$ $$k = 0$$ $$x = \\dfrac{\\pi}{2}$$",
    "Серия $\\dfrac{5\\pi}{6} + 2\\pi n$: $$\\dfrac{\\pi}{2} \\le \\dfrac{5\\pi}{6} + 2\\pi n \\le 2\\pi$$ $$-\\dfrac{1}{6} \\le n \\le \\dfrac{7}{12}$$ $$n = 0$$ $$x = \\dfrac{5\\pi}{6}$$ Получаем числа: $$\\dfrac{\\pi}{2};\\ \\dfrac{5\\pi}{6}.$$"
   ]
  },
  {
   "id": "14.fipi.F22045",
   "group": "exp",
   "fipi": "F22045",
   "text": "а) Решите уравнение ${8}^{x} - 3 \\cdot {2}^{x + 2} + {2}^{5 - x} = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[\\log_{4} 5;\\, \\sqrt{3}]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "3/2",
     "tex": "\\dfrac{3}{2}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $1$; $\\dfrac{3}{2}$<br>б) $\\dfrac{3}{2}$",
   "steps": [
    "а) Пусть $t = 2^x$, $t > 0$. Тогда $8^x = t^3$, $2^{x + 2} = 4t$, $2^{5 - x} = \\dfrac{32}{t}$: $$t^3 - 12t + \\dfrac{32}{t} = 0$$ $$t^4 - 12t^2 + 32 = 0$$ $$\\left(t^2 - 4\\right)\\left(t^2 - 8\\right) = 0$$",
    "Так как $t > 0$, получаем $t = 2$ или $t = 2\\sqrt2$: $$2^x = 2,\\quad x = 1$$ $$2^x = 2^{\\frac{3}{2}},\\quad x = \\dfrac{3}{2}$$",
    "б) Сравним корни с концами отрезка. $$\\log_4 5 > \\log_4 4 = 1,$$ поэтому корень $1$ отрезку не принадлежит.",
    "$$\\dfrac{3}{2} = \\log_4 8 > \\log_4 5$$ $$\\left(\\dfrac{3}{2}\\right)^2 = \\dfrac{9}{4} < 3,\\ \\text{поэтому}\\ \\dfrac{3}{2} < \\sqrt3$$ Значит, отрезку принадлежит только $\\dfrac{3}{2}$."
   ]
  },
  {
   "id": "14.fipi.EE74FD",
   "group": "exp",
   "fipi": "EE74FD",
   "text": "а) Решите уравнение ${8}^{x} - 9 \\cdot {2}^{x + 1} + {2}^{5 - x} = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[\\log_{5} 2;\\, \\log_{5} 20]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "1/2",
     "tex": "\\dfrac{1}{2}"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{1}{2}$; $2$<br>б) $\\dfrac{1}{2}$",
   "steps": [
    "а) Пусть $t = 2^x$, $t > 0$. Тогда $8^x = t^3$, $2^{x + 1} = 2t$, $2^{5 - x} = \\dfrac{32}{t}$: $$t^3 - 18t + \\dfrac{32}{t} = 0$$ $$t^4 - 18t^2 + 32 = 0$$ $$\\left(t^2 - 2\\right)\\left(t^2 - 16\\right) = 0$$",
    "Так как $t > 0$, получаем $t = \\sqrt2$ или $t = 4$: $$2^x = 2^{\\frac{1}{2}},\\quad x = \\dfrac{1}{2}$$ $$2^x = 4,\\quad x = 2$$",
    "б) Сравним корни с концами отрезка. $$\\dfrac{1}{2} = \\log_5 \\sqrt5,\\quad 2 < \\sqrt5 < 20,$$ поэтому $\\log_5 2 < \\dfrac{1}{2} < \\log_5 20$ — корень $\\dfrac{1}{2}$ отрезку принадлежит.",
    "$$2 = \\log_5 25 > \\log_5 20,$$ поэтому корень $2$ отрезку не принадлежит. Значит, отрезку принадлежит только $\\dfrac{1}{2}$."
   ]
  },
  {
   "id": "14.fipi.D1D574",
   "group": "exp",
   "fipi": "D1D574",
   "text": "а) Решите уравнение ${27}^{x} - 4 \\cdot {3}^{x + 2} + {3}^{5 - x} = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[\\log_{7} 4;\\, \\log_{7} 16]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "1",
     "tex": "1"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $1$; $\\dfrac{3}{2}$<br>б) $1$",
   "steps": [
    "а) Пусть $t = 3^x$, $t > 0$. Тогда $27^x = t^3$, $3^{x + 2} = 9t$, $3^{5 - x} = \\dfrac{243}{t}$: $$t^3 - 36t + \\dfrac{243}{t} = 0$$ $$t^4 - 36t^2 + 243 = 0$$ $$\\left(t^2 - 9\\right)\\left(t^2 - 27\\right) = 0$$",
    "Так как $t > 0$, получаем $t = 3$ или $t = 3\\sqrt3$: $$3^x = 3,\\quad x = 1$$ $$3^x = 3^{\\frac{3}{2}},\\quad x = \\dfrac{3}{2}$$",
    "б) Сравним корни с концами отрезка. $$1 = \\log_7 7,\\quad 4 < 7 < 16,$$ поэтому $\\log_7 4 < 1 < \\log_7 16$ — корень $1$ отрезку принадлежит.",
    "$$\\dfrac{3}{2} = \\log_7 \\sqrt{343},\\quad 343 > 256 = 16^2,$$ поэтому $\\dfrac{3}{2} > \\log_7 16$ — корень $\\dfrac{3}{2}$ отрезку не принадлежит. Значит, отрезку принадлежит только $1$."
   ]
  },
  {
   "id": "14.fipi.0BD320",
   "group": "exp",
   "fipi": "0BD320",
   "text": "а) Решите уравнение ${27}^{x} - 28 \\cdot {3}^{x + 1} + {3}^{5 - x} = 0$.<br>б) Укажите корни этого уравнения, принадлежащие отрезку $[\\sqrt{3};\\, \\log_{2} 5]$.",
   "fields": [
    {
     "id": "b",
     "label": "б)",
     "type": "nums",
     "value": "2",
     "tex": "2"
    }
   ],
   "manual": "Пункт <i>а</i> (серии корней) проверьте по решению.",
   "answerTex": "а) $\\dfrac{1}{2}$; $2$<br>б) $2$",
   "steps": [
    "а) Пусть $t = 3^x$, $t > 0$. Тогда $27^x = t^3$, $3^{x + 1} = 3t$, $3^{5 - x} = \\dfrac{243}{t}$: $$t^3 - 84t + \\dfrac{243}{t} = 0$$ $$t^4 - 84t^2 + 243 = 0$$ $$\\left(t^2 - 3\\right)\\left(t^2 - 81\\right) = 0$$",
    "Так как $t > 0$, получаем $t = \\sqrt3$ или $t = 9$: $$3^x = 3^{\\frac{1}{2}},\\quad x = \\dfrac{1}{2}$$ $$3^x = 9,\\quad x = 2$$",
    "б) Сравним корни с концами отрезка. $$\\dfrac{1}{2} < 1 < \\sqrt3,$$ поэтому корень $\\dfrac{1}{2}$ отрезку не принадлежит.",
    "$$2 > \\sqrt3,\\ \\text{так как}\\ 4 > 3$$ $$2 = \\log_2 4 < \\log_2 5$$ Значит, отрезку принадлежит только $2$."
   ]
  }
 ]
};
