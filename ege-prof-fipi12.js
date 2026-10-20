/* ege-prof-fipi12.js — задания ЕГЭ профиль №12 из открытого банка ФИПИ.
   Собирается скриптом (fipi-pilot/tools/ege/export.py), руками не правится.
   Грузится страницей ege_prof.html только когда открыт этот номер (ensureFipi);
   формат и происхождение — в оглавлении ege-prof-fipi.js. */
(window.EGE_PROF_FIPI = window.EGE_PROF_FIPI || { tasks: {} }).tasks['12'] = {
 "sections": [
  {
   "id": "gr",
   "title": "Графики функций"
  }
 ],
 "groups": [
  {
   "id": "lin",
   "section": "gr",
   "title": "Линейная функция $f(x) = kx + b$",
   "hint": "$b$ — точка пересечения с осью $y$, $k$ — на сколько растёт $y$ при росте $x$ на 1."
  },
  {
   "id": "par",
   "section": "gr",
   "title": "Парабола $f(x) = ax^2 + bx + c$",
   "hint": "Если видны нули $x_1$, $x_2$, удобно $f(x) = a(x - x_1)(x - x_2)$; $a$ найдите по ещё одной точке."
  },
  {
   "id": "hyp",
   "section": "gr",
   "title": "Гипербола $f(x) = \\dfrac{k}{x}$",
   "hint": "$k = x \\cdot y$ для любой точки графика."
  },
  {
   "id": "sqrt",
   "section": "gr",
   "title": "$f(x) = a\\sqrt{x}$",
   "hint": "Возьмите точку с $x = 1$ (или $x = 4$): $a = \\dfrac{y}{\\sqrt{x}}$."
  },
  {
   "id": "exp",
   "section": "gr",
   "title": "Показательная $f(x) = a^x$",
   "hint": "График проходит через $(0;\\ 1)$; основание $a$ — по точке с $x = 1$ или $x = -1$."
  },
  {
   "id": "log",
   "section": "gr",
   "title": "Логарифмическая $f(x) = \\log_a x$",
   "hint": "График проходит через $(1;\\ 0)$; основание — по точке с $y = 1$ ($a = x$) или $y = -1$ ($a = \\dfrac{1}{x}$)."
  },
  {
   "id": "inter",
   "section": "gr",
   "title": "Точка пересечения двух графиков",
   "hint": "Восстановите обе функции по точкам, приравняйте их. Один корень — известная точка $A$, второй — искомая $B$."
  }
 ],
 "protos": [
  {
   "id": "12.fipi.9CC815",
   "group": "lin",
   "fipi": "9CC815",
   "text": "На рисунке изображён график функции вида $f(x) = kx + b$. Найдите значение $f(7)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/9CC815_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "13",
   "steps": [
    "Прямая проходит через точки $(0;\\ -1)$ и $(1;\\ 1)$: $b = -1$, $k = 2$, то есть $f(x) = 2x - 1$.",
    "$$f(7) = 2 \\cdot 7 - 1 = 13$$"
   ]
  },
  {
   "id": "12.fipi.87429D",
   "group": "lin",
   "fipi": "87429D",
   "text": "На рисунке изображён график функции вида $f(x) = kx + b$. Найдите значение $f(5)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/87429D_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "11",
   "steps": [
    "Прямая проходит через точки $(0;\\ 1)$ и $(1;\\ 3)$: $b = 1$, $k = 2$, то есть $f(x) = 2x + 1$.",
    "$$f(5) = 2 \\cdot 5 + 1 = 11$$"
   ]
  },
  {
   "id": "12.fipi.CFEAE8",
   "group": "lin",
   "fipi": "CFEAE8",
   "text": "На рисунке изображён график функции вида $f(x) = kx + b$. Найдите значение $f(4)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/CFEAE8_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "9",
   "steps": [
    "Прямая проходит через точки $(0;\\ 1)$ и $(1;\\ 3)$: $b = 1$, $k = 2$, то есть $f(x) = 2x + 1$.",
    "$$f(4) = 2 \\cdot 4 + 1 = 9$$"
   ]
  },
  {
   "id": "12.fipi.5BF069",
   "group": "lin",
   "fipi": "5BF069",
   "text": "На рисунке изображён график функции вида $f(x) = kx + b$. Найдите значение $f(6)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/5BF069_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "11",
   "steps": [
    "Прямая проходит через точки $(0;\\ -1)$ и $(1;\\ 1)$: $b = -1$, $k = 2$, то есть $f(x) = 2x - 1$.",
    "$$f(6) = 2 \\cdot 6 - 1 = 11$$"
   ]
  },
  {
   "id": "12.fipi.BC2802",
   "group": "par",
   "fipi": "BC2802",
   "text": "На рисунке изображён график функции вида $f\\left(x\\right) = a{x}^{2} + bx + c$. Найдите значение $f\\left(-2\\right)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/BC2802_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "12",
   "steps": [
    "Парабола проходит через $(0;\\ 2)$ и пересекает ось $x$ в точках $1$ и $2$: $f(x) = a(x - 1)(x - 2)$.",
    "При $x = 0$: $a \\cdot 2 = 2$, $a = 1$, то есть $f(x) = x^{2} - 3x + 2$.",
    "$$f(-2) = (-2 - 1)(-2 - 2) = 12$$"
   ]
  },
  {
   "id": "12.fipi.ABA2A7",
   "group": "par",
   "fipi": "ABA2A7",
   "text": "На рисунке изображён график функции вида $f\\left(x\\right) = a{x}^{2} + bx + c$. Найдите значение $f\\left(-2\\right)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/ABA2A7_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "18",
   "steps": [
    "Парабола проходит через $(0;\\ 4)$ и пересекает ось $x$ в точках $1$ и $4$: $f(x) = a(x - 1)(x - 4)$.",
    "При $x = 0$: $a \\cdot 4 = 4$, $a = 1$, то есть $f(x) = x^{2} - 5x + 4$.",
    "$$f(-2) = (-2 - 1)(-2 - 4) = 18$$"
   ]
  },
  {
   "id": "12.fipi.12736C",
   "group": "par",
   "fipi": "12736C",
   "text": "На рисунке изображён график функции вида $f(x) = a{x}^{2} + bx + c$. Найдите значение $f(-3)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/12736C_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "20",
   "steps": [
    "Парабола проходит через $(0;\\ 2)$ и пересекает ось $x$ в точках $1$ и $2$: $f(x) = a(x - 1)(x - 2)$.",
    "При $x = 0$: $a \\cdot 2 = 2$, $a = 1$, то есть $f(x) = x^{2} - 3x + 2$.",
    "$$f(-3) = (-3 - 1)(-3 - 2) = 20$$"
   ]
  },
  {
   "id": "12.fipi.90227A",
   "group": "hyp",
   "fipi": "90227A",
   "text": "На рисунке изображён график функции вида $f(x) = \\dfrac{k}{x}$. Найдите значение $f(10)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/90227A_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "0,5",
   "steps": [
    "График проходит через точку $(5;\\ 1)$: $k = 5 \\cdot 1 = 5$.",
    "$$f(10) = \\dfrac{5}{10} = 0{,}5$$"
   ]
  },
  {
   "id": "12.fipi.08C3D9",
   "group": "hyp",
   "fipi": "08C3D9",
   "text": "На рисунке изображён график функции вида $f(x) = \\dfrac{k}{x}$. Найдите значение $f(10)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/08C3D9_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "0,2",
   "steps": [
    "График проходит через точку $(2;\\ 1)$: $k = 2 \\cdot 1 = 2$.",
    "$$f(10) = \\dfrac{2}{10} = 0{,}2$$"
   ]
  },
  {
   "id": "12.fipi.AFF75F",
   "group": "hyp",
   "fipi": "AFF75F",
   "text": "На рисунке изображён график функции вида $f(x) = \\dfrac{k}{x}$. Найдите значение $f(10)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/AFF75F_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "-0,4",
   "steps": [
    "График проходит через точку $(-2;\\ 2)$: $k = -2 \\cdot 2 = -4$.",
    "$$f(10) = \\dfrac{-4}{10} = -0{,}4$$"
   ]
  },
  {
   "id": "12.fipi.30F054",
   "group": "hyp",
   "fipi": "30F054",
   "text": "На рисунке изображён график функции вида $f(x) = \\dfrac{k}{x}$. Найдите значение $f(20)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/30F054_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "0,2",
   "steps": [
    "График проходит через точку $(2;\\ 2)$: $k = 2 \\cdot 2 = 4$.",
    "$$f(20) = \\dfrac{4}{20} = 0{,}2$$"
   ]
  },
  {
   "id": "12.fipi.D6A2A2",
   "group": "hyp",
   "fipi": "D6A2A2",
   "text": "На рисунке изображён график функции вида $f(x) = \\dfrac{k}{x}$. Найдите значение $f(10)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/D6A2A2_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "-0,2",
   "steps": [
    "График проходит через точку $(-2;\\ 1)$: $k = -2 \\cdot 1 = -2$.",
    "$$f(10) = \\dfrac{-2}{10} = -0{,}2$$"
   ]
  },
  {
   "id": "12.fipi.06DEEE",
   "group": "hyp",
   "fipi": "06DEEE",
   "text": "На рисунке изображён график функции вида $f(x) = \\dfrac{k}{x}$. Найдите значение $f(10)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/06DEEE_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "-0,1",
   "steps": [
    "График проходит через точку $(-1;\\ 1)$: $k = -1 \\cdot 1 = -1$.",
    "$$f(10) = \\dfrac{-1}{10} = -0{,}1$$"
   ]
  },
  {
   "id": "12.fipi.31336D",
   "group": "hyp",
   "fipi": "31336D",
   "text": "На рисунке изображён график функции вида $f(x) = \\dfrac{k}{x}$. Найдите значение $f(10)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/31336D_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "0,1",
   "steps": [
    "График проходит через точку $(1;\\ 1)$: $k = 1 \\cdot 1 = 1$.",
    "$$f(10) = \\dfrac{1}{10} = 0{,}1$$"
   ]
  },
  {
   "id": "12.fipi.E88A8D",
   "group": "hyp",
   "fipi": "E88A8D",
   "text": "На рисунке изображён график функции вида $f\\left(x\\right) = \\dfrac{k}{x}$. Найдите значение $f\\left(30\\right)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/E88A8D_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "0,1",
   "steps": [
    "График проходит через точку $(3;\\ 1)$: $k = 3 \\cdot 1 = 3$.",
    "$$f(30) = \\dfrac{3}{30} = 0{,}1$$"
   ]
  },
  {
   "id": "12.fipi.A49974",
   "group": "sqrt",
   "fipi": "A49974",
   "text": "На рисунке изображён график функции вида $f(x) = a\\sqrt{x}$. Найдите значение $f(36)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/A49974_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "-18",
   "steps": [
    "График проходит через точку $(1;\\ -3)$: $a\\sqrt{1} = -3$, значит, $a = -3$.",
    "$$f(36) = -3\\sqrt{36} = -3 \\cdot 6 = -18$$"
   ]
  },
  {
   "id": "12.fipi.5F9519",
   "group": "sqrt",
   "fipi": "5F9519",
   "text": "На рисунке изображён график функции вида $f(x) = a\\sqrt{x}$. Найдите значение $f(25)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/5F9519_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "20",
   "steps": [
    "График проходит через точку $(1;\\ 4)$: $a\\sqrt{1} = 4$, значит, $a = 4$.",
    "$$f(25) = 4\\sqrt{25} = 4 \\cdot 5 = 20$$"
   ]
  },
  {
   "id": "12.fipi.67A21A",
   "group": "sqrt",
   "fipi": "67A21A",
   "text": "На рисунке изображён график функции вида $f(x) = a\\sqrt{x}$. Найдите значение $f(64)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/67A21A_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "16",
   "steps": [
    "График проходит через точку $(1;\\ 2)$: $a\\sqrt{1} = 2$, значит, $a = 2$.",
    "$$f(64) = 2\\sqrt{64} = 2 \\cdot 8 = 16$$"
   ]
  },
  {
   "id": "12.fipi.e2F2DA",
   "group": "sqrt",
   "fipi": "e2F2DA",
   "text": "На рисунке изображён график функции вида $f(x) = a\\sqrt{x}$. Найдите значение $f(36)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/e2F2DA_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "18",
   "steps": [
    "График проходит через точку $(1;\\ 3)$: $a\\sqrt{1} = 3$, значит, $a = 3$.",
    "$$f(36) = 3\\sqrt{36} = 3 \\cdot 6 = 18$$"
   ]
  },
  {
   "id": "12.fipi.713053",
   "group": "sqrt",
   "fipi": "713053",
   "text": "На рисунке изображён график функции вида $f(x) = a\\sqrt{x}$. Найдите значение $f(36)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/713053_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "-24",
   "steps": [
    "График проходит через точку $(1;\\ -4)$: $a\\sqrt{1} = -4$, значит, $a = -4$.",
    "$$f(36) = -4\\sqrt{36} = -4 \\cdot 6 = -24$$"
   ]
  },
  {
   "id": "12.fipi.09eF38",
   "group": "sqrt",
   "fipi": "09eF38",
   "text": "На рисунке изображён график функции вида $f(x) = a\\sqrt{x}$. Найдите значение $f(49)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/09eF38_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "21",
   "steps": [
    "График проходит через точку $(1;\\ 3)$: $a\\sqrt{1} = 3$, значит, $a = 3$.",
    "$$f(49) = 3\\sqrt{49} = 3 \\cdot 7 = 21$$"
   ]
  },
  {
   "id": "12.fipi.F469FF",
   "group": "exp",
   "fipi": "F469FF",
   "text": "На рисунке изображён график функции вида $f\\left(x\\right) = {a}^{x}$. Найдите значение $f\\left(-3\\right)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/F469FF_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "64",
   "steps": [
    "График проходит через точку $(-1;\\ 4)$: $a^{-1} = 4$, значит, $a = 0{,}25$.",
    "$$f(-3) = (0{,}25)^{-3} = 64$$"
   ]
  },
  {
   "id": "12.fipi.EC397F",
   "group": "exp",
   "fipi": "EC397F",
   "text": "На рисунке изображён график функции вида $f\\left(x\\right) = {a}^{x}$. Найдите значение $f\\left(5\\right)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/EC397F_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "32",
   "steps": [
    "График проходит через точку $(1;\\ 2)$: $a^{1} = 2$, значит, $a = 2$.",
    "$$f(5) = 2^{5} = 32$$"
   ]
  },
  {
   "id": "12.fipi.783DBA",
   "group": "exp",
   "fipi": "783DBA",
   "text": "На рисунке изображён график функции вида $f(x) = {a}^{x}$. Найдите значение $f(-3)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/783DBA_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "8",
   "steps": [
    "График проходит через точку $(-1;\\ 2)$: $a^{-1} = 2$, значит, $a = 0{,}5$.",
    "$$f(-3) = (0{,}5)^{-3} = 8$$"
   ]
  },
  {
   "id": "12.fipi.492E2A",
   "group": "exp",
   "fipi": "492E2A",
   "text": "На рисунке изображён график функции вида $f(x) = {a}^{x}$. Найдите значение $f(2)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/492E2A_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "25",
   "steps": [
    "График проходит через точку $(1;\\ 5)$: $a^{1} = 5$, значит, $a = 5$.",
    "$$f(2) = 5^{2} = 25$$"
   ]
  },
  {
   "id": "12.fipi.38A32C",
   "group": "exp",
   "fipi": "38A32C",
   "text": "На рисунке изображён график функции вида $f\\left(x\\right) = {a}^{x}$. Найдите значение $f\\left(4\\right)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/38A32C_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "16",
   "steps": [
    "График проходит через точку $(1;\\ 2)$: $a^{1} = 2$, значит, $a = 2$.",
    "$$f(4) = 2^{4} = 16$$"
   ]
  },
  {
   "id": "12.fipi.91C2AD",
   "group": "exp",
   "fipi": "91C2AD",
   "text": "На рисунке изображён график функции вида $f(x) = {a}^{x}$. Найдите значение $f(-3)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/91C2AD_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "27",
   "steps": [
    "График проходит через точку $(-1;\\ 3)$: $a^{-1} = 3$, значит, $a = \\dfrac{1}{3}$.",
    "$$f(-3) = (\\dfrac{1}{3})^{-3} = 27$$"
   ]
  },
  {
   "id": "12.fipi.8BF7C8",
   "group": "exp",
   "fipi": "8BF7C8",
   "text": "На рисунке изображён график функции вида $f(x) = {a}^{x}$. Найдите значение $f(3)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/8BF7C8_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "27",
   "steps": [
    "График проходит через точку $(1;\\ 3)$: $a^{1} = 3$, значит, $a = 3$.",
    "$$f(3) = 3^{3} = 27$$"
   ]
  },
  {
   "id": "12.fipi.7C4A3A",
   "group": "exp",
   "fipi": "7C4A3A",
   "text": "На рисунке изображён график функции вида $f(x) = {a}^{x}$. Найдите значение $f(-4)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/7C4A3A_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "16",
   "steps": [
    "График проходит через точку $(-1;\\ 2)$: $a^{-1} = 2$, значит, $a = 0{,}5$.",
    "$$f(-4) = (0{,}5)^{-4} = 16$$"
   ]
  },
  {
   "id": "12.fipi.62A335",
   "group": "exp",
   "fipi": "62A335",
   "text": "На рисунке изображён график функции вида $f\\left(x\\right) = {a}^{x}$. Найдите значение $f\\left(-2\\right)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/62A335_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "16",
   "steps": [
    "График проходит через точку $(-1;\\ 4)$: $a^{-1} = 4$, значит, $a = 0{,}25$.",
    "$$f(-2) = (0{,}25)^{-2} = 16$$"
   ]
  },
  {
   "id": "12.fipi.DA4F4F",
   "group": "log",
   "fipi": "DA4F4F",
   "text": "На рисунке изображён график функции вида $f(x) = \\log_{a} x$. Найдите значение $f(8)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/DA4F4F_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "-3",
   "steps": [
    "График проходит через точку $(2;\\ -1)$: $\\log_a 2 = -1$, значит, $a = 0{,}5$.",
    "$$f(8) = \\log_{0{,}5} 8 = -3$$"
   ]
  },
  {
   "id": "12.fipi.ECB413",
   "group": "log",
   "fipi": "ECB413",
   "text": "На рисунке изображён график функции вида $f(x) = \\log_{a} x$. Найдите значение $f(8)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/ECB413_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "3",
   "steps": [
    "График проходит через точку $(2;\\ 1)$: $\\log_a 2 = 1$, значит, $a = 2$.",
    "$$f(8) = \\log_{2} 8 = 3$$"
   ]
  },
  {
   "id": "12.fipi.A75DDE",
   "group": "log",
   "fipi": "A75DDE",
   "text": "На рисунке изображён график функции вида $f(x) = \\log_{a} x$. Найдите значение $f(25)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/A75DDE_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "-2",
   "steps": [
    "График проходит через точку $(5;\\ -1)$: $\\log_a 5 = -1$, значит, $a = 0{,}2$.",
    "$$f(25) = \\log_{0{,}2} 25 = -2$$"
   ]
  },
  {
   "id": "12.fipi.97C4EA",
   "group": "log",
   "fipi": "97C4EA",
   "text": "На рисунке изображён график функции вида $f(x) = \\log_{a} x$. Найдите значение $f(16)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/97C4EA_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "4",
   "steps": [
    "График проходит через точку $(2;\\ 1)$: $\\log_a 2 = 1$, значит, $a = 2$.",
    "$$f(16) = \\log_{2} 16 = 4$$"
   ]
  },
  {
   "id": "12.fipi.ABB360",
   "group": "log",
   "fipi": "ABB360",
   "text": "На рисунке изображён график функции вида $f(x) = \\log_{a} x$. Найдите значение $f(32)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/ABB360_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "5",
   "steps": [
    "График проходит через точку $(2;\\ 1)$: $\\log_a 2 = 1$, значит, $a = 2$.",
    "$$f(32) = \\log_{2} 32 = 5$$"
   ]
  },
  {
   "id": "12.fipi.196238",
   "group": "log",
   "fipi": "196238",
   "text": "На рисунке изображён график функции вида $f(x) = \\log_{a} x$. Найдите значение $f(16)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/196238_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "-4",
   "steps": [
    "График проходит через точку $(2;\\ -1)$: $\\log_a 2 = -1$, значит, $a = 0{,}5$.",
    "$$f(16) = \\log_{0{,}5} 16 = -4$$"
   ]
  },
  {
   "id": "12.fipi.CA314B",
   "group": "inter",
   "fipi": "CA314B",
   "text": "На рисунке изображены графики функций видов $f(x) = \\dfrac{k}{x}$ и $g(x) = ax + b$, пересекающиеся в точках $A$ и $B$. Найдите абсциссу точки $B$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/CA314B_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "8",
   "steps": [
    "Гипербола проходит через $A(-4;\\ -2)$: $k = -4 \\cdot (-2) = 8$.",
    "Прямая проходит через $A(-4;\\ -2)$ и $(0;\\ -1)$: $g(x) = \\dfrac{x}{4} - 1$.",
    "$$\\dfrac{8}{x} = \\dfrac{x}{4} - 1$$ $$x^{2} - 4x - 32 = 0$$",
    "Корни: $-4, 8$. Корень $-4$ — абсцисса точки $A$, значит, у $B$ абсцисса $8$."
   ]
  },
  {
   "id": "12.fipi.92c1FD",
   "group": "inter",
   "fipi": "92c1FD",
   "text": "На рисунке изображены графики функций $f\\left(x\\right) = \\dfrac{k}{x}$ и $g\\left(x\\right) = ax + b$, пересекающиеся в точках $A$ и $B$. Найдите абсциссу точки $B$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/92c1FD_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "10",
   "steps": [
    "Гипербола проходит через $A(-5;\\ -2)$: $k = -5 \\cdot (-2) = 10$.",
    "Прямая проходит через $A(-5;\\ -2)$ и $(0;\\ -1)$: $g(x) = \\dfrac{x}{5} - 1$.",
    "$$\\dfrac{10}{x} = \\dfrac{x}{5} - 1$$ $$x^{2} - 5x - 50 = 0$$",
    "Корни: $-5, 10$. Корень $-5$ — абсцисса точки $A$, значит, у $B$ абсцисса $10$."
   ]
  },
  {
   "id": "12.fipi.68Ac00",
   "group": "inter",
   "fipi": "68Ac00",
   "text": "На рисунке изображены графики функций $f\\left(x\\right) = a{x}^{2} + bx + c$ и $g\\left(x\\right) = kx$, пересекающиеся в точках $A$ и $B$. Найдите абсциссу точки $B$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/68Ac00_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "5",
   "steps": [
    "Парабола пересекает ось $x$ в точках $0$ и $2$ и проходит через $(3;\\ 3)$: $f(x) = x^{2} - 2x$.",
    "Прямая $g(x) = kx$ проходит через $(1;\\ 3)$: $g(x) = 3x$.",
    "$$x^{2} - 2x = 3x$$ $$x^{2} - 5x = 0$$",
    "Корни $0$ и $5$. Корень $0$ — абсцисса точки $A$, значит, у $B$ абсцисса $5$."
   ]
  },
  {
   "id": "12.fipi.02A17e",
   "group": "inter",
   "fipi": "02A17e",
   "text": "На рисунке изображены графики функций $f\\left(x\\right) = \\dfrac{k}{x}$ и $g\\left(x\\right) = ax + b$, пересекающиеся в точках $A$ и $B$. Найдите абсциссу точки $B$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/02A17e_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "9",
   "steps": [
    "Гипербола проходит через $A(-3;\\ -3)$: $k = -3 \\cdot (-3) = 9$.",
    "Прямая проходит через $A(-3;\\ -3)$ и $(0;\\ -2)$: $g(x) = \\dfrac{x}{3} - 2$.",
    "$$\\dfrac{9}{x} = \\dfrac{x}{3} - 2$$ $$x^{2} - 6x - 27 = 0$$",
    "Корни: $-3, 9$. Корень $-3$ — абсцисса точки $A$, значит, у $B$ абсцисса $9$."
   ]
  },
  {
   "id": "12.fipi.656B14",
   "group": "inter",
   "fipi": "656B14",
   "text": "На рисунке изображены графики функций видов $f(x) = a\\sqrt{x}$ и $g(x) = kx$, пересекающиеся в точках $A$ и $B$. Найдите абсциссу точки $B$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/656B14_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "100",
   "steps": [
    "$f(x) = a\\sqrt{x}$ проходит через $(1;\\ 2)$: $a = 2$. $g(x) = kx$ проходит через $(5;\\ 1)$: $k = 0{,}2$.",
    "$$2\\sqrt{x} = 0{,}2x$$ $$\\sqrt{x} = 10$$ $$x = 100$$",
    "Точка $A$ — начало координат, у $B$ абсцисса $100$."
   ]
  },
  {
   "id": "12.fipi.3D9010",
   "group": "inter",
   "fipi": "3D9010",
   "text": "На рисунке изображены графики функций видов $f(x) = a{x}^{2} + bx + c$ и $g(x) = kx$, пересекающиеся в точках $A$ и $B$. Найдите абсциссу точки $B$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/3D9010_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "4",
   "steps": [
    "Парабола пересекает ось $x$ в точках $0$ и $1$ и проходит через $(2;\\ 2)$: $f(x) = x^{2} - x$.",
    "Прямая $g(x) = kx$ проходит через $(1;\\ 3)$: $g(x) = 3x$.",
    "$$x^{2} - x = 3x$$ $$x^{2} - 4x = 0$$",
    "Корни $0$ и $4$. Корень $0$ — абсцисса точки $A$, значит, у $B$ абсцисса $4$."
   ]
  },
  {
   "id": "12.fipi.6FA927",
   "group": "inter",
   "fipi": "6FA927",
   "text": "На рисунке изображены графики функций видов $f(x) = \\dfrac{k}{x}$ и $g(x) = ax + b$, пересекающиеся в точках $A$ и $B$. Найдите абсциссу точки $B$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/6FA927_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "8",
   "steps": [
    "Гипербола проходит через $A(-2;\\ -4)$: $k = -2 \\cdot (-4) = 8$.",
    "Прямая проходит через $A(-2;\\ -4)$ и $(0;\\ -3)$: $g(x) = \\dfrac{x}{2} - 3$.",
    "$$\\dfrac{8}{x} = \\dfrac{x}{2} - 3$$ $$x^{2} - 6x - 16 = 0$$",
    "Корни: $-2, 8$. Корень $-2$ — абсцисса точки $A$, значит, у $B$ абсцисса $8$."
   ]
  },
  {
   "id": "12.fipi.7D21DC",
   "group": "inter",
   "fipi": "7D21DC",
   "text": "На рисунке изображены графики двух линейных функций, пересекающиеся в точке $A$. Найдите абсциссу точки $A$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/7D21DC_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "3",
   "steps": [
    "Первая прямая через $(-3;\\ 0)$ и $(0;\\ 3)$: $y = x + 3$. Вторая через $(0;\\ 0)$ и $(1;\\ 2)$: $y = 2x$.",
    "$$x + 3 = 2x$$ $$x = 3$$"
   ]
  },
  {
   "id": "12.fipi.D5DBD8",
   "group": "inter",
   "fipi": "D5DBD8",
   "text": "На рисунке изображены графики функций видов $f(x) = \\dfrac{k}{x}$ и $g(x) = ax + b$, пересекающиеся в точках $A$ и $B$. Найдите абсциссу точки $B$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/D5DBD8_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "6",
   "steps": [
    "Гипербола проходит через $A(-4;\\ -3)$: $k = -4 \\cdot (-3) = 12$.",
    "Прямая проходит через $A(-4;\\ -3)$ и $(0;\\ -1)$: $g(x) = \\dfrac{x}{2} - 1$.",
    "$$\\dfrac{12}{x} = \\dfrac{x}{2} - 1$$ $$x^{2} - 2x - 24 = 0$$",
    "Корни: $-4, 6$. Корень $-4$ — абсцисса точки $A$, значит, у $B$ абсцисса $6$."
   ]
  },
  {
   "id": "12.fipi.6F2D5E",
   "group": "inter",
   "fipi": "6F2D5E",
   "text": "На рисунке изображены графики функций видов $f(x) = \\dfrac{k}{x}$ и $g(x) = ax + b$, пересекающиеся в точках $A$ и $B$. Найдите абсциссу точки $B$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/6F2D5E_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "12",
   "steps": [
    "Гипербола проходит через $A(-3;\\ -4)$: $k = -3 \\cdot (-4) = 12$.",
    "Прямая проходит через $A(-3;\\ -4)$ и $(0;\\ -3)$: $g(x) = \\dfrac{x}{3} - 3$.",
    "$$\\dfrac{12}{x} = \\dfrac{x}{3} - 3$$ $$x^{2} - 9x - 36 = 0$$",
    "Корни: $-3, 12$. Корень $-3$ — абсцисса точки $A$, значит, у $B$ абсцисса $12$."
   ]
  },
  {
   "id": "12.fipi.82DA5C",
   "group": "inter",
   "fipi": "82DA5C",
   "text": "На рисунке изображены графики функций видов $f(x) = a{x}^{2} + bx + c$ и $g(x) = kx$, пересекающиеся в точках $A$ и $B$. Найдите абсциссу точки $B$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/82DA5C_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "7",
   "steps": [
    "Парабола пересекает ось $x$ в точках $0$ и $4$ и проходит через $(5;\\ 5)$: $f(x) = x^{2} - 4x$.",
    "Прямая $g(x) = kx$ проходит через $(1;\\ 3)$: $g(x) = 3x$.",
    "$$x^{2} - 4x = 3x$$ $$x^{2} - 7x = 0$$",
    "Корни $0$ и $7$. Корень $0$ — абсцисса точки $A$, значит, у $B$ абсцисса $7$."
   ]
  },
  {
   "id": "12.fipi.E18EA6",
   "group": "inter",
   "fipi": "E18EA6",
   "text": "На рисунке изображены графики функций $f\\left(x\\right) = a{x}^{2} + bx + c$ и $g\\left(x\\right) = kx$, пересекающиеся в точках $A$ и $B$. Найдите абсциссу точки $B$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/E18EA6_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "5",
   "steps": [
    "Парабола пересекает ось $x$ в точках $0$ и $1$ и проходит через $(2;\\ 2)$: $f(x) = x^{2} - x$.",
    "Прямая $g(x) = kx$ проходит через $(1;\\ 4)$: $g(x) = 4x$.",
    "$$x^{2} - x = 4x$$ $$x^{2} - 5x = 0$$",
    "Корни $0$ и $5$. Корень $0$ — абсцисса точки $A$, значит, у $B$ абсцисса $5$."
   ]
  },
  {
   "id": "12.fipi.87FAA1",
   "group": "inter",
   "fipi": "87FAA1",
   "text": "На рисунке изображены графики функций видов $f(x) = \\dfrac{k}{x}$ и $g(x) = ax + b$, пересекающиеся в точках $A$ и $B$. Найдите абсциссу точки $B$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/87FAA1_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "12",
   "steps": [
    "Гипербола проходит через $A(-4;\\ -3)$: $k = -4 \\cdot (-3) = 12$.",
    "Прямая проходит через $A(-4;\\ -3)$ и $(0;\\ -2)$: $g(x) = \\dfrac{x}{4} - 2$.",
    "$$\\dfrac{12}{x} = \\dfrac{x}{4} - 2$$ $$x^{2} - 8x - 48 = 0$$",
    "Корни: $-4, 12$. Корень $-4$ — абсцисса точки $A$, значит, у $B$ абсцисса $12$."
   ]
  },
  {
   "id": "12.fipi.4e7ec1",
   "group": "inter",
   "fipi": "4e7ec1",
   "text": "На рисунке изображены графики функций $f\\left(x\\right) = \\dfrac{k}{x}$ и $g\\left(x\\right) = ax + b$, пересекающиеся в точках $A$ и $B$. Найдите абсциссу точки $B$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/4e7ec1_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "10",
   "steps": [
    "Гипербола проходит через $A(-2;\\ -5)$: $k = -2 \\cdot (-5) = 10$.",
    "Прямая проходит через $A(-2;\\ -5)$ и $(0;\\ -4)$: $g(x) = \\dfrac{x}{2} - 4$.",
    "$$\\dfrac{10}{x} = \\dfrac{x}{2} - 4$$ $$x^{2} - 8x - 20 = 0$$",
    "Корни: $-2, 10$. Корень $-2$ — абсцисса точки $A$, значит, у $B$ абсцисса $10$."
   ]
  },
  {
   "id": "12.fipi.1DC3CC",
   "group": "inter",
   "fipi": "1DC3CC",
   "text": "На рисунке изображены графики двух линейных функций, пересекающиеся в точке $A$. Найдите абсциссу точки $A$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/1DC3CC_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "4",
   "steps": [
    "Первая прямая через $(-4;\\ 0)$ и $(0;\\ 4)$: $y = x + 4$. Вторая через $(0;\\ 0)$ и $(1;\\ 2)$: $y = 2x$.",
    "$$x + 4 = 2x$$ $$x = 4$$"
   ]
  },
  {
   "id": "12.fipi.8BE0C0",
   "group": "inter",
   "fipi": "8BE0C0",
   "text": "На рисунке изображены графики функций $f\\left(x\\right) = a\\sqrt{x}$ и $g\\left(x\\right) = kx$, пересекающиеся в точках $A$ и $B$. Найдите абсциссу точки $B$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/8BE0C0_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "36",
   "steps": [
    "$f(x) = a\\sqrt{x}$ проходит через $(1;\\ 3)$: $a = 3$. $g(x) = kx$ проходит через $(2;\\ 1)$: $k = 0{,}5$.",
    "$$3\\sqrt{x} = 0{,}5x$$ $$\\sqrt{x} = 6$$ $$x = 36$$",
    "Точка $A$ — начало координат, у $B$ абсцисса $36$."
   ]
  },
  {
   "id": "12.fipi.8ADFCC",
   "group": "inter",
   "fipi": "8ADFCC",
   "text": "На рисунке изображены графики функций видов $f(x) = a{x}^{2} + bx + c$ и $g(x) = kx$, пересекающиеся в точках $A$ и $B$. Найдите абсциссу точки $B$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/8ADFCC_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "6",
   "steps": [
    "Парабола пересекает ось $x$ в точках $0$ и $3$ и проходит через $(4;\\ 4)$: $f(x) = x^{2} - 3x$.",
    "Прямая $g(x) = kx$ проходит через $(1;\\ 3)$: $g(x) = 3x$.",
    "$$x^{2} - 3x = 3x$$ $$x^{2} - 6x = 0$$",
    "Корни $0$ и $6$. Корень $0$ — абсцисса точки $A$, значит, у $B$ абсцисса $6$."
   ]
  },
  {
   "id": "12.fipi.448E90",
   "group": "inter",
   "fipi": "448E90",
   "text": "На рисунке изображены графики функций видов $f(x) = a\\sqrt{x}$ и $g(x) = kx$, пересекающиеся в точках $A$ и $B$. Найдите абсциссу точки $B$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/448E90_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "16",
   "steps": [
    "$f(x) = a\\sqrt{x}$ проходит через $(1;\\ 2)$: $a = 2$. $g(x) = kx$ проходит через $(2;\\ 1)$: $k = 0{,}5$.",
    "$$2\\sqrt{x} = 0{,}5x$$ $$\\sqrt{x} = 4$$ $$x = 16$$",
    "Точка $A$ — начало координат, у $B$ абсцисса $16$."
   ]
  },
  {
   "id": "12.fipi.0B896F",
   "group": "inter",
   "fipi": "0B896F",
   "text": "На рисунке изображены графики функций видов $f(x) = a\\sqrt{x}$ и $g(x) = kx$, пересекающиеся в точках $A$ и $B$. Найдите абсциссу точки $B$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/0B896F_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "36",
   "steps": [
    "$f(x) = a\\sqrt{x}$ проходит через $(1;\\ 2)$: $a = 2$. $g(x) = kx$ проходит через $(3;\\ 1)$: $k = \\dfrac{1}{3}$.",
    "$$2\\sqrt{x} = \\dfrac{1}{3}x$$ $$\\sqrt{x} = 6$$ $$x = 36$$",
    "Точка $A$ — начало координат, у $B$ абсцисса $36$."
   ]
  },
  {
   "id": "12.fipi.6E8B6F",
   "group": "inter",
   "fipi": "6E8B6F",
   "text": "На рисунке изображены графики функций видов $f(x) = a\\sqrt{x}$ и $g(x) = kx$, пересекающиеся в точках $A$ и $B$. Найдите абсциссу точки $B$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/6E8B6F_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "25",
   "steps": [
    "$f(x) = a\\sqrt{x}$ проходит через $(1;\\ 5)$: $a = 5$. $g(x) = kx$ проходит через $(1;\\ 1)$: $k = 1$.",
    "$$5\\sqrt{x} = 1x$$ $$\\sqrt{x} = 5$$ $$x = 25$$",
    "Точка $A$ — начало координат, у $B$ абсцисса $25$."
   ]
  },
  {
   "id": "12.fipi.DDA73A",
   "group": "inter",
   "fipi": "DDA73A",
   "text": "На рисунке изображены графики функций $f\\left(x\\right) = a{x}^{2} + bx + c$ и $g\\left(x\\right) = kx$, пересекающиеся в точках $A$ и $B$. Найдите абсциссу точки $B$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/DDA73A_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "6",
   "steps": [
    "Парабола пересекает ось $x$ в точках $0$ и $1$ и проходит через $(2;\\ 2)$: $f(x) = x^{2} - x$.",
    "Прямая $g(x) = kx$ проходит через $(1;\\ 5)$: $g(x) = 5x$.",
    "$$x^{2} - x = 5x$$ $$x^{2} - 6x = 0$$",
    "Корни $0$ и $6$. Корень $0$ — абсцисса точки $A$, значит, у $B$ абсцисса $6$."
   ]
  },
  {
   "id": "12.fipi.913A8E",
   "group": "inter",
   "fipi": "913A8E",
   "text": "На рисунке изображены графики функций видов $f(x) = \\dfrac{k}{x}$ и $g(x) = ax + b$, пересекающиеся в точках $A$ и $B$. Найдите абсциссу точки $B$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/913A8E_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "6",
   "steps": [
    "Гипербола проходит через $A(-2;\\ -3)$: $k = -2 \\cdot (-3) = 6$.",
    "Прямая проходит через $A(-2;\\ -3)$ и $(0;\\ -2)$: $g(x) = \\dfrac{x}{2} - 2$.",
    "$$\\dfrac{6}{x} = \\dfrac{x}{2} - 2$$ $$x^{2} - 4x - 12 = 0$$",
    "Корни: $-2, 6$. Корень $-2$ — абсцисса точки $A$, значит, у $B$ абсцисса $6$."
   ]
  }
 ]
};
