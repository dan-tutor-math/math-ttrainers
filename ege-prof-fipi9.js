/* ege-prof-fipi9.js — задания ЕГЭ профиль №9 из открытого банка ФИПИ.
   Собирается скриптом (fipi-pilot/tools/ege/export.py), руками не правится.
   Грузится страницей ege_prof.html только когда открыт этот номер (ensureFipi);
   формат и происхождение — в оглавлении ege-prof-fipi.js. */
(window.EGE_PROF_FIPI = window.EGE_PROF_FIPI || { tasks: {} }).tasks['9'] = {
 "sections": [
  {
   "id": "fg",
   "title": "По графику функции"
  },
  {
   "id": "dg",
   "title": "По графику производной"
  }
 ],
 "groups": [
  {
   "id": "tangent",
   "section": "fg",
   "title": "Производная по касательной",
   "hint": "$f'(x_0)$ — угловой коэффициент касательной: возьмите на ней два узла сетки и разделите разность ординат на разность абсцисс."
  },
  {
   "id": "marks",
   "section": "fg",
   "title": "Знак производной в отмеченных точках",
   "hint": "По графику $f$: функция возрастает — $f' > 0$, убывает — $f' < 0$. По графику $f'$: выше оси — функция возрастает, ниже — убывает."
  },
  {
   "id": "pick",
   "section": "fg",
   "title": "Где производная наибольшая или наименьшая",
   "hint": "Чем круче график поднимается, тем больше производная; где график опускается — производная отрицательна."
  },
  {
   "id": "extrema",
   "section": "dg",
   "title": "Точки экстремума по графику производной",
   "hint": "Экстремум — где $f'$ меняет знак: «+» на «−» — максимум, «−» на «+» — минимум. Касание оси без смены знака не считается."
  },
  {
   "id": "segment",
   "section": "dg",
   "title": "Наибольшее и наименьшее значение, нули производной",
   "hint": "Если на отрезке $f' > 0$, функция возрастает (максимум справа), если $f' < 0$ — убывает (максимум слева)."
  }
 ],
 "protos": [
  {
   "id": "9.fipi.D13540",
   "group": "tangent",
   "fipi": "D13540",
   "text": "На рисунке изображены график функции $y = f(x)$ и касательная к нему в точке с абсциссой ${x}_{0}$. Найдите значение производной функции $f(x)$ в точке ${x}_{0}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/D13540_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "-0,4",
   "steps": [
    "Производная в точке касания равна угловому коэффициенту касательной.",
    "Касательная проходит через узлы сетки $(-3;\\ 3)$ и $(2;\\ 1)$:",
    "$$f'(x_0) = \\dfrac{-2}{5} = -0{,}4$$"
   ]
  },
  {
   "id": "9.fipi.A558Fe",
   "group": "tangent",
   "fipi": "A558Fe",
   "text": "На рисунке изображены график функции $y = f\\left(x\\right)$ и касательная к нему в точке с абсциссой ${x}_{0}$. Найдите значение производной функции $f\\left(x\\right)$ в точке ${x}_{0}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/A558Fe_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "0,4",
   "steps": [
    "Производная в точке касания равна угловому коэффициенту касательной.",
    "Касательная проходит через узлы сетки $(-3;\\ 1)$ и $(2;\\ 3)$:",
    "$$f'(x_0) = \\dfrac{2}{5} = 0{,}4$$"
   ]
  },
  {
   "id": "9.fipi.57C40E",
   "group": "tangent",
   "fipi": "57C40E",
   "text": "На рисунке изображены график функции $y = f\\left(x\\right)$ и касательная к нему в точке с абсциссой ${x}_{0}$. Найдите значение производной функции $f\\left(x\\right)$ в точке ${x}_{0}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/57C40E_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "1,6",
   "steps": [
    "Производная в точке касания равна угловому коэффициенту касательной.",
    "Касательная проходит через узлы сетки $(-3;\\ -3)$ и $(2;\\ 5)$:",
    "$$f'(x_0) = \\dfrac{8}{5} = 1{,}6$$"
   ]
  },
  {
   "id": "9.fipi.626B77",
   "group": "tangent",
   "fipi": "626B77",
   "text": "На рисунке изображены график функции $y = f(x)$ и касательная к нему в точке с абсциссой ${x}_{0}$. Найдите значение производной функции $f(x)$ в точке ${x}_{0}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/626B77_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "1,5",
   "steps": [
    "Производная в точке касания равна угловому коэффициенту касательной.",
    "Касательная проходит через узлы сетки $(-3;\\ -4)$ и $(3;\\ 5)$:",
    "$$f'(x_0) = \\dfrac{9}{6} = 1{,}5$$"
   ]
  },
  {
   "id": "9.fipi.BA4FBA",
   "group": "tangent",
   "fipi": "BA4FBA",
   "text": "На рисунке изображены график функции $y = f\\left(x\\right)$ и касательная к нему в точке с абсциссой ${x}_{0}$. Найдите значение производной функции $f\\left(x\\right)$ в точке ${x}_{0}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/BA4FBA_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "0,25",
   "steps": [
    "Производная в точке касания равна угловому коэффициенту касательной.",
    "Касательная проходит через узлы сетки $(-4;\\ 1)$ и $(4;\\ 3)$:",
    "$$f'(x_0) = \\dfrac{2}{8} = 0{,}25$$"
   ]
  },
  {
   "id": "9.fipi.51B8B6",
   "group": "tangent",
   "fipi": "51B8B6",
   "text": "На рисунке изображены график функции $y = f\\left(x\\right)$ и касательная к нему в точке с абсциссой ${x}_{0}$. Найдите значение производной функции $f\\left(x\\right)$ в точке ${x}_{0}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/51B8B6_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "-1,25",
   "steps": [
    "Производная в точке касания равна угловому коэффициенту касательной.",
    "Касательная проходит через узлы сетки $(-3;\\ -2)$ и $(1;\\ -7)$:",
    "$$f'(x_0) = \\dfrac{-5}{4} = -1{,}25$$"
   ]
  },
  {
   "id": "9.fipi.F9EA20",
   "group": "tangent",
   "fipi": "F9EA20",
   "text": "На рисунке изображены график функции $y = f(x)$ и касательная к нему в точке с абсциссой ${x}_{0}$. Найдите значение производной функции $f(x)$ в точке ${x}_{0}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/F9EA20_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "-3",
   "steps": [
    "Производная в точке касания равна угловому коэффициенту касательной.",
    "Касательная проходит через узлы сетки $(-5;\\ 7)$ и $(-2;\\ -2)$:",
    "$$f'(x_0) = \\dfrac{-9}{3} = -3$$"
   ]
  },
  {
   "id": "9.fipi.497F54",
   "group": "tangent",
   "fipi": "497F54",
   "text": "На рисунке изображены график функции $y = f(x)$ и касательная к нему в точке с абсциссой ${x}_{0}$. Найдите значение производной функции $f(x)$ в точке ${x}_{0}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/497F54_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "-0,25",
   "steps": [
    "Производная в точке касания равна угловому коэффициенту касательной.",
    "Касательная проходит через узлы сетки $(-3;\\ 5)$ и $(5;\\ 3)$:",
    "$$f'(x_0) = \\dfrac{-2}{8} = -0{,}25$$"
   ]
  },
  {
   "id": "9.fipi.FEE4C3",
   "group": "tangent",
   "fipi": "FEE4C3",
   "text": "На рисунке изображены график функции $y = f(x)$ и касательная к нему в точке с абсциссой ${x}_{0}$. Найдите значение производной функции $f(x)$ в точке ${x}_{0}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/FEE4C3_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "1,4",
   "steps": [
    "Производная в точке касания равна угловому коэффициенту касательной.",
    "Касательная проходит через узлы сетки $(-5;\\ -2)$ и $(0;\\ 5)$:",
    "$$f'(x_0) = \\dfrac{7}{5} = 1{,}4$$"
   ]
  },
  {
   "id": "9.fipi.c6eA90",
   "group": "tangent",
   "fipi": "c6eA90",
   "text": "На рисунке изображены график функции $y = f(x)$ и касательная к нему в точке с абсциссой ${x}_{0}$. Найдите значение производной функции $f(x)$ в точке ${x}_{0}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/c6eA90_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "-1,5",
   "steps": [
    "Производная в точке касания равна угловому коэффициенту касательной.",
    "Касательная проходит через узлы сетки $(-3;\\ 8)$ и $(1;\\ 2)$:",
    "$$f'(x_0) = \\dfrac{-6}{4} = -1{,}5$$"
   ]
  },
  {
   "id": "9.fipi.C380E8",
   "group": "tangent",
   "fipi": "C380E8",
   "text": "На рисунке изображены график функции $y = f(x)$ и касательная к нему в точке с абсциссой ${x}_{0}$. Найдите значение производной функции $f(x)$ в точке ${x}_{0}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/C380E8_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "1,2",
   "steps": [
    "Производная в точке касания равна угловому коэффициенту касательной.",
    "Касательная проходит через узлы сетки $(-3;\\ 1)$ и $(2;\\ 7)$:",
    "$$f'(x_0) = \\dfrac{6}{5} = 1{,}2$$"
   ]
  },
  {
   "id": "9.fipi.6c0Ae4",
   "group": "tangent",
   "fipi": "6c0Ae4",
   "text": "На рисунке изображены график функции $y = f\\left(x\\right)$ и касательная к нему в точке с абсциссой ${x}_{0}$. Найдите значение производной функции $f\\left(x\\right)$ в точке ${x}_{0}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/6c0Ae4_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "1,5",
   "steps": [
    "Производная в точке касания равна угловому коэффициенту касательной.",
    "Касательная проходит через узлы сетки $(-3;\\ -2)$ и $(1;\\ 4)$:",
    "$$f'(x_0) = \\dfrac{6}{4} = 1{,}5$$"
   ]
  },
  {
   "id": "9.fipi.F25161",
   "group": "tangent",
   "fipi": "F25161",
   "text": "На рисунке изображены график функции $y = f(x)$ и касательная к нему в точке с абсциссой ${x}_{0}$. Найдите значение производной функции $f(x)$ в точке ${x}_{0}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/F25161_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "-1,25",
   "steps": [
    "Производная в точке касания равна угловому коэффициенту касательной.",
    "Касательная проходит через узлы сетки $(-5;\\ 7)$ и $(3;\\ -3)$:",
    "$$f'(x_0) = \\dfrac{-10}{8} = -1{,}25$$"
   ]
  },
  {
   "id": "9.fipi.D00D6F",
   "group": "tangent",
   "fipi": "D00D6F",
   "text": "На рисунке изображены график функции $y = f(x)$ и касательная к нему в точке с абсциссой ${x}_{0}$. Найдите значение производной функции $f(x)$ в точке ${x}_{0}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/D00D6F_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "-1,4",
   "steps": [
    "Производная в точке касания равна угловому коэффициенту касательной.",
    "Касательная проходит через узлы сетки $(2;\\ 3)$ и $(7;\\ -4)$:",
    "$$f'(x_0) = \\dfrac{-7}{5} = -1{,}4$$"
   ]
  },
  {
   "id": "9.fipi.D79C6E",
   "group": "tangent",
   "fipi": "D79C6E",
   "text": "На рисунке изображены график функции и касательная к нему в точке с абсциссой . Найдите значение производной функции в точке .<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/D79C6E_1.gif\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div><div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/D79C6E_2.gif\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div><div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/D79C6E_3.gif\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div><div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/D79C6E_4.gif\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div><div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/D79C6E_5.gif\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "1,8",
   "steps": [
    "Производная в точке касания равна угловому коэффициенту касательной.",
    "Касательная проходит через узлы сетки $(-4;\\ -2)$ и $(1;\\ 7)$:",
    "$$f'(x_0) = \\dfrac{9}{5} = 1{,}8$$"
   ]
  },
  {
   "id": "9.fipi.c1936D",
   "group": "tangent",
   "fipi": "c1936D",
   "text": "На рисунке изображены график функции $y = f\\left(x\\right)$ и касательная к нему в точке с абсциссой ${x}_{0}$. Найдите значение производной функции $f\\left(x\\right)$ в точке ${x}_{0}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/c1936D_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "-0,2",
   "steps": [
    "Производная в точке касания равна угловому коэффициенту касательной.",
    "Касательная проходит через узлы сетки $(-1;\\ 3)$ и $(4;\\ 2)$:",
    "$$f'(x_0) = \\dfrac{-1}{5} = -0{,}2$$"
   ]
  },
  {
   "id": "9.fipi.093E32",
   "group": "tangent",
   "fipi": "093E32",
   "text": "На рисунке изображены график функции $y = f(x)$ и касательная к нему в точке с абсциссой ${x}_{0}$. Найдите значение производной функции $f(x)$ в точке ${x}_{0}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/093E32_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "-2,5",
   "steps": [
    "Производная в точке касания равна угловому коэффициенту касательной.",
    "Касательная проходит через узлы сетки $(-3;\\ 3)$ и $(-1;\\ -2)$:",
    "$$f'(x_0) = \\dfrac{-5}{2} = -2{,}5$$"
   ]
  },
  {
   "id": "9.fipi.DDC830",
   "group": "tangent",
   "fipi": "DDC830",
   "text": "На рисунке изображены график функции $y = f(x)$ и касательная к нему в точке с абсциссой ${x}_{0}$. Найдите значение производной функции $f(x)$ в точке ${x}_{0}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/DDC830_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "1,4",
   "steps": [
    "Производная в точке касания равна угловому коэффициенту касательной.",
    "Касательная проходит через узлы сетки $(3;\\ 1)$ и $(8;\\ 8)$:",
    "$$f'(x_0) = \\dfrac{7}{5} = 1{,}4$$"
   ]
  },
  {
   "id": "9.fipi.7F208A",
   "group": "tangent",
   "fipi": "7F208A",
   "text": "На рисунке изображены график функции $y = f(x)$ и касательная к нему в точке с абсциссой ${x}_{0}$. Найдите значение производной функции $f(x)$ в точке ${x}_{0}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/7F208A_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "0,2",
   "steps": [
    "Производная в точке касания равна угловому коэффициенту касательной.",
    "Касательная проходит через узлы сетки $(-2;\\ 2)$ и $(3;\\ 3)$:",
    "$$f'(x_0) = \\dfrac{1}{5} = 0{,}2$$"
   ]
  },
  {
   "id": "9.fipi.71BC43",
   "group": "marks",
   "fipi": "71BC43",
   "text": "На рисунке изображён график функции $y = f(x)$. На оси абсцисс отмечено девять точек: ${x}_{1}$, ${x}_{2}$, ${x}_{3}$, ${x}_{4}$, ${x}_{5}$, ${x}_{6}$, ${x}_{7}$, ${x}_{8}$, ${x}_{9}$. Найдите количество отмеченных точек, в которых производная функции $f(x)$ отрицательна.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/71BC43_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "4",
   "steps": [
    "Производная отрицательна там, где функция убывает.",
    "Подходят точки $x_{1}, x_{3}, x_{4}, x_{6}$ — всего $4$."
   ]
  },
  {
   "id": "9.fipi.28FA05",
   "group": "marks",
   "fipi": "28FA05",
   "text": "На рисунке изображён график функции $y = f(x)$. На оси абсцисс отмечено восемь точек: ${x}_{1}$, ${x}_{2}$, ${x}_{3}$, ${x}_{4}$, ${x}_{5}$, ${x}_{6}$, ${x}_{7}$, ${x}_{8}$. Найдите количество отмеченных точек, в которых производная функции $f(x)$ положительна.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/28FA05_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "2",
   "steps": [
    "Производная положительна там, где функция возрастает.",
    "Подходят точки $x_{6}, x_{8}$ — всего $2$."
   ]
  },
  {
   "id": "9.fipi.95A978",
   "group": "marks",
   "fipi": "95A978",
   "text": "На рисунке изображён график функции $y = f(x)$. На оси абсцисс отмечено восемь точек: ${x}_{1}$, ${x}_{2}$, ${x}_{3}$, ${x}_{4}$, ${x}_{5}$, ${x}_{6}$, ${x}_{7}$, ${x}_{8}$. Найдите количество отмеченных точек, в которых производная функции $f(x)$ отрицательна.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/95A978_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "3",
   "steps": [
    "Производная отрицательна там, где функция убывает.",
    "Подходят точки $x_{3}, x_{4}, x_{7}$ — всего $3$."
   ]
  },
  {
   "id": "9.fipi.D143BD",
   "group": "marks",
   "fipi": "D143BD",
   "text": "На рисунке изображён график $y = f'(x)$ — производной функции $f(x)$. На оси абсцисс отмечено одиннадцать точек: ${x}_{1}$, ${x}_{2}$, ${x}_{3}$, ${x}_{4}$, ${x}_{5}$, ${x}_{6}$, ${x}_{7}$, ${x}_{8}$, ${x}_{9}$, ${x}_{10}$, ${x}_{11}$. Сколько из этих точек принадлежит промежуткам убывания функции $f(x)$?<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/D143BD_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "6",
   "steps": [
    "Функция убывает там, где производная отрицательна (график $f'$ ниже оси $x$).",
    "Подходят точки $x_{1}, x_{2}, x_{5}, x_{7}, x_{8}, x_{9}$ — всего $6$."
   ]
  },
  {
   "id": "9.fipi.57A7B1",
   "group": "marks",
   "fipi": "57A7B1",
   "text": "На рисунке изображён график $y = f'\\left(x\\right)$ — производной функции $f\\left(x\\right)$. На оси абсцисс отмечено девять точек: ${x}_{1}$, ${x}_{2}$, ${x}_{3}$, ${x}_{4}$, ${x}_{5}$, ${x}_{6}$, ${x}_{7}$, ${x}_{8}$, ${x}_{9}$. Сколько из этих точек принадлежит промежуткам убывания функции $f\\left(x\\right)$?<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/57A7B1_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "2",
   "steps": [
    "Функция убывает там, где производная отрицательна (график $f'$ ниже оси $x$).",
    "Подходят точки $x_{6}, x_{7}$ — всего $2$."
   ]
  },
  {
   "id": "9.fipi.C0261C",
   "group": "marks",
   "fipi": "C0261C",
   "text": "На рисунке изображён график $y = f\\, '(x)$ — производной функции $f(x)$. На оси абсцисс отмечено семь точек: ${x}_{1}$, ${x}_{2}$, ${x}_{3}$, ${x}_{4}$, ${x}_{5}$, ${x}_{6}$, ${x}_{7}$. Сколько из этих точек принадлежит промежуткам убывания функции $f(x)$?<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/C0261C_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "2",
   "steps": [
    "Функция убывает там, где производная отрицательна (график $f'$ ниже оси $x$).",
    "Подходят точки $x_{4}, x_{5}$ — всего $2$."
   ]
  },
  {
   "id": "9.fipi.0B2322",
   "group": "marks",
   "fipi": "0B2322",
   "text": "На рисунке изображён график функции $y = f(x)$. На оси абсцисс отмечено семь точек: ${x}_{1}$, ${x}_{2}$, ${x}_{3}$, ${x}_{4}$, ${x}_{5}$, ${x}_{6}$, ${x}_{7}$. Найдите количество отмеченных точек, в которых производная функции $f(x)$ положительна.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/0B2322_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "4",
   "steps": [
    "Производная положительна там, где функция возрастает.",
    "Подходят точки $x_{1}, x_{2}, x_{3}, x_{5}$ — всего $4$."
   ]
  },
  {
   "id": "9.fipi.026E2D",
   "group": "marks",
   "fipi": "026E2D",
   "text": "На рисунке изображён график $y = f\\, '(x)$ — производной функции $f(x)$. На оси абсцисс отмечено восемь точек: ${x}_{1}$, ${x}_{2}$, ${x}_{3}$, ${x}_{4}$, ${x}_{5}$, ${x}_{6}$, ${x}_{7}$, ${x}_{8}$. Сколько из этих точек принадлежит промежуткам возрастания функции $f(x)$?<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/026E2D_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "4",
   "steps": [
    "Функция возрастает там, где производная положительна (график $f'$ выше оси $x$).",
    "Подходят точки $x_{3}, x_{4}, x_{5}, x_{6}$ — всего $4$."
   ]
  },
  {
   "id": "9.fipi.FFE757",
   "group": "marks",
   "fipi": "FFE757",
   "text": "На рисунке изображён график функции $y = f(x)$. На оси абсцисс отмечено десять точек: ${x}_{1}$, ${x}_{2}$, ${x}_{3}$, ${x}_{4}$, ${x}_{5}$, ${x}_{6}$, ${x}_{7}$, ${x}_{8}$, ${x}_{9}$, ${x}_{10}$. Найдите количество отмеченных точек, в которых производная функции $f(x)$ отрицательна.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/FFE757_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "6",
   "steps": [
    "Производная отрицательна там, где функция убывает.",
    "Подходят точки $x_{2}, x_{3}, x_{5}, x_{6}, x_{8}, x_{10}$ — всего $6$."
   ]
  },
  {
   "id": "9.fipi.97B55A",
   "group": "marks",
   "fipi": "97B55A",
   "text": "На рисунке изображён график $y = f'(x)$ — производной функции $f(x)$. На оси абсцисс отмечено девять точек: ${x}_{1}$, ${x}_{2}$, ${x}_{3}$, ${x}_{4}$, ${x}_{5}$, ${x}_{6}$, ${x}_{7}$, ${x}_{8}$, ${x}_{9}$. Сколько из этих точек принадлежит промежуткам возрастания функции $f(x)$?<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/97B55A_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "4",
   "steps": [
    "Функция возрастает там, где производная положительна (график $f'$ выше оси $x$).",
    "Подходят точки $x_{1}, x_{2}, x_{4}, x_{6}$ — всего $4$."
   ]
  },
  {
   "id": "9.fipi.6796AE",
   "group": "marks",
   "fipi": "6796AE",
   "text": "На рисунке изображён график $y = f'(x)$ — производной функции $f(x)$. На оси абсцисс отмечено десять точек: ${x}_{1}$, ${x}_{2}$, ${x}_{3}$, ${x}_{4}$, ${x}_{5}$, ${x}_{6}$, ${x}_{7}$, ${x}_{8}$, ${x}_{9}$, ${x}_{10}$. Сколько из этих точек принадлежит промежуткам возрастания функции $f(x)?$<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/6796AE_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "6",
   "steps": [
    "Функция возрастает там, где производная положительна (график $f'$ выше оси $x$).",
    "Подходят точки $x_{2}, x_{3}, x_{5}, x_{6}, x_{9}, x_{10}$ — всего $6$."
   ]
  },
  {
   "id": "9.fipi.49c3eA",
   "group": "marks",
   "fipi": "49c3eA",
   "text": "На рисунке изображён график $y = f'(x)$ — производной функции $f(x)$. На оси абсцисс отмечено восемь точек: ${x}_{1}$, ${x}_{2}$, ${x}_{3}$, ${x}_{4}$, ${x}_{5}$, ${x}_{6}$, ${x}_{7}$, ${x}_{8}$. Сколько из этих точек принадлежит промежуткам убывания функции $f(x)?$<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/49c3eA_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "4",
   "steps": [
    "Функция убывает там, где производная отрицательна (график $f'$ ниже оси $x$).",
    "Подходят точки $x_{2}, x_{4}, x_{6}, x_{8}$ — всего $4$."
   ]
  },
  {
   "id": "9.fipi.984B6c",
   "group": "marks",
   "fipi": "984B6c",
   "text": "На рисунке изображён график $y = f'(x)$ — производной функции $f(x)$. На оси абсцисс отмечено девять точек: ${x}_{1}$, ${x}_{2}$, ${x}_{3}$, ${x}_{4}$, ${x}_{5}$, ${x}_{6}$, ${x}_{7}$, ${x}_{8}$, ${x}_{9}$. Сколько из этих точек принадлежит промежуткам убывания функции $f(x)?$<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/984B6c_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "5",
   "steps": [
    "Функция убывает там, где производная отрицательна (график $f'$ ниже оси $x$).",
    "Подходят точки $x_{1}, x_{2}, x_{3}, x_{6}, x_{7}$ — всего $5$."
   ]
  },
  {
   "id": "9.fipi.A62F87",
   "group": "marks",
   "fipi": "A62F87",
   "text": "На рисунке изображён график функции $y = f(x)$. На оси абсцисс отмечено десять точек: ${x}_{1}$, ${x}_{2}$, ${x}_{3}$, ${x}_{4}$, ${x}_{5}$, ${x}_{6}$, ${x}_{7}$, ${x}_{8}$, ${x}_{9}$, ${x}_{10}$. В ответе укажите количество точек (из отмеченных), в которых производная функции $f(x)$ отрицательна.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/A62F87_1.gif\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "7",
   "steps": [
    "Производная отрицательна там, где функция убывает.",
    "Подходят точки $x_{1}, x_{2}, x_{4}, x_{5}, x_{6}, x_{8}, x_{9}$ — всего $7$."
   ]
  },
  {
   "id": "9.fipi.655F85",
   "group": "marks",
   "fipi": "655F85",
   "text": "На рисунке изображён график функции $y = f(x)$. На оси абсцисс отмечено восемь точек: ${x}_{1}$, ${x}_{2}$, ${x}_{3}$, ${x}_{4}$, ${x}_{5}$, ${x}_{6}$, ${x}_{7}$, ${x}_{8}$. В ответе укажите количество точек (из отмеченных), в которых производная функции $f(x)$ положительна.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/655F85_1.gif\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "5",
   "steps": [
    "Производная положительна там, где функция возрастает.",
    "Подходят точки $x_{1}, x_{3}, x_{4}, x_{5}, x_{8}$ — всего $5$."
   ]
  },
  {
   "id": "9.fipi.875A8A",
   "group": "marks",
   "fipi": "875A8A",
   "text": "На рисунке изображён график функции $y = f\\left(x\\right)$. На оси абсцисс отмечено десять точек: ${x}_{1}$, ${x}_{2}$, ${x}_{3}$, ${x}_{4}$, ${x}_{5}$, ${x}_{6}$, ${x}_{7}$, ${x}_{8}$, ${x}_{9}$, ${x}_{10}$. Найдите количество отмеченных точек, в которых производная функции $f\\left(x\\right)$ положительна.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/875A8A_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "5",
   "steps": [
    "Производная положительна там, где функция возрастает.",
    "Подходят точки $x_{4}, x_{5}, x_{6}, x_{8}, x_{10}$ — всего $5$."
   ]
  },
  {
   "id": "9.fipi.F1BDF1",
   "group": "pick",
   "fipi": "F1BDF1",
   "text": "На рисунке изображён график функции $y = f(x)$. На оси абсцисс отмечены точки $-2$, $-1$, 3, 4. В какой из этих точек значение производной функции $f(x)$ наименьшее? В ответе укажите эту точку.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/F1BDF1_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "4",
   "steps": [
    "Производная — скорость роста функции: положительна, где функция возрастает, отрицательна, где убывает.",
    "В точке 4 функция убывает (производная отрицательна), в точке −2 — вершина (производная 0), в −1 и 3 функция возрастает или почти постоянна."
   ]
  },
  {
   "id": "9.fipi.56EA1A",
   "group": "pick",
   "fipi": "56EA1A",
   "text": "На рисунке изображён график функции $y = f(x)$. На оси абсцисс отмечены точки $-1$, 2, 3, 4. В какой из этих точек значение производной наибольшее? В ответе укажите эту точку.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/56EA1A_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "-1",
   "steps": [
    "Производная — скорость роста функции: положительна, где функция возрастает, отрицательна, где убывает.",
    "В точке −1 функция круто возрастает — производная положительна и наибольшая; в остальных точках функция убывает или почти постоянна."
   ]
  },
  {
   "id": "9.fipi.099555",
   "group": "pick",
   "fipi": "099555",
   "text": "На рисунке изображён график функции $y = f(x)$. На оси абсцисс отмечены точки $-2$, $-1$, 3, 4. В какой из этих точек значение производной наименьшее? В ответе укажите эту точку.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/099555_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "-1",
   "steps": [
    "Производная — скорость роста функции: положительна, где функция возрастает, отрицательна, где убывает.",
    "В точке −1 функция круто убывает сразу после вершины — производная отрицательна и по модулю наибольшая."
   ]
  },
  {
   "id": "9.fipi.A2E26B",
   "group": "pick",
   "fipi": "A2E26B",
   "text": "На рисунке изображён график функции $y = f\\left(x\\right)$. На оси абсцисс отмечены точки 1, 2, 3, 4. В какой из этих точек значение производной функции $f\\left(x\\right)$ наименьшее? В ответе укажите эту точку.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/A2E26B_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "2",
   "steps": [
    "Производная — скорость роста функции: положительна, где функция возрастает, отрицательна, где убывает.",
    "В точках 2 и 3 функция убывает; в точке 2 убывание круче — производная наименьшая; в точках 1 и 4 функция возрастает."
   ]
  },
  {
   "id": "9.fipi.B65F3D",
   "group": "pick",
   "fipi": "B65F3D",
   "text": "На рисунке изображён график функции $y = f(x)$. На оси абсцисс отмечены точки $-2$, 1, 3, 4. В какой из этих точек значение производной функции $f(x)$ наибольшее? В ответе укажите эту точку.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/B65F3D_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "4",
   "steps": [
    "Производная — скорость роста функции: положительна, где функция возрастает, отрицательна, где убывает.",
    "В точке 4 функция круто возрастает — производная наибольшая; в −2 и 3 функция убывает, в 1 возрастает медленнее."
   ]
  },
  {
   "id": "9.fipi.0ED279",
   "group": "extrema",
   "fipi": "0ED279",
   "text": "На рисунке изображён график $y = f'(x)$ — производной функции $f(x)$, определённой на интервале $(-19;\\, 3)$. Найдите количество точек экстремума функции $f(x)$, принадлежащих отрезку $[ -17;\\ -4]$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/0ED279_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "4",
   "steps": [
    "Точки экстремума — нули производной, в которых она меняет знак.",
    "На отрезке это точки $-15, -14, -12, -10$ — всего $4$."
   ]
  },
  {
   "id": "9.fipi.891127",
   "group": "extrema",
   "fipi": "891127",
   "text": "На рисунке изображён график $y = f'(x)$ — производной функции $f(x)$, определённой на интервале $(-20;\\, 4)$. Найдите количество точек экстремума функции $f(x)$, принадлежащих отрезку $[ -16;\\, 1]$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/891127_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "5",
   "steps": [
    "Точки экстремума — нули производной, в которых она меняет знак.",
    "На отрезке это точки $-14, -12, -9, -4, -2$ — всего $5$."
   ]
  },
  {
   "id": "9.fipi.4849A6",
   "group": "extrema",
   "fipi": "4849A6",
   "text": "На рисунке изображён график $y = f'(x)$ — производной функции $f(x)$, определённой на интервале $(-5;\\, 14)$. Найдите количество точек минимума функции $f(x)$, принадлежащих отрезку $[ -4;\\, 9]$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/4849A6_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "4",
   "steps": [
    "Точка минимума — где производная меняет знак с «−» на «+».",
    "На отрезке таких точек $4$."
   ]
  },
  {
   "id": "9.fipi.162BAA",
   "group": "extrema",
   "fipi": "162BAA",
   "text": "На рисунке изображён график $y = f'(x)$ — производной функции $f(x)$, определённой на интервале $(-15;\\, 5)$. Найдите количество точек максимума функции $f(x)$, принадлежащих отрезку $[ -11;\\, 4]$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/162BAA_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "2",
   "steps": [
    "Точка максимума — где производная меняет знак с «+» на «−».",
    "На отрезке таких точек $2$."
   ]
  },
  {
   "id": "9.fipi.396DA0",
   "group": "extrema",
   "fipi": "396DA0",
   "text": "На рисунке изображён график $y = f'(x)$ — производной функции $f(x)$, определённой на интервале $(-10;\\, 7)$. Найдите количество точек минимума функции $f(x)$, принадлежащих отрезку $[ -2;\\, 6]$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/396DA0_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "1",
   "steps": [
    "Точка минимума — где производная меняет знак с «−» на «+».",
    "На отрезке это точки $3$ — всего $1$."
   ]
  },
  {
   "id": "9.fipi.321FCD",
   "group": "extrema",
   "fipi": "321FCD",
   "text": "На рисунке изображён график $y = f'(x)$ — производной функции $f(x)$, определённой на интервале $(-12;\\, 12)$. Найдите количество точек максимума функции $f(x)$, принадлежащих отрезку $[ -6;\\, 11]$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/321FCD_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "5",
   "steps": [
    "Точка максимума — где производная меняет знак с «+» на «−».",
    "На отрезке таких точек $5$."
   ]
  },
  {
   "id": "9.fipi.FFB369",
   "group": "extrema",
   "fipi": "FFB369",
   "text": "На рисунке изображён график $y = f'(x)$ — производной функции $f(x)$, определённой на интервале $(-9;\\, 10)$. Найдите количество точек максимума функции $f(x)$, принадлежащих отрезку $[ -6;\\, 8]$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/FFB369_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "1",
   "steps": [
    "Точка максимума — где производная меняет знак с «+» на «−».",
    "На отрезке таких точек $1$."
   ]
  },
  {
   "id": "9.fipi.D65930",
   "group": "extrema",
   "fipi": "D65930",
   "text": "На рисунке изображён график $y = f'(x)$ — производной функции $f(x)$, определённой на интервале $(-12;\\, 11)$. Найдите количество точек максимума функции $f(x)$, принадлежащих отрезку $[ -11;\\, 5]$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/D65930_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "4",
   "steps": [
    "Точка максимума — где производная меняет знак с «+» на «−».",
    "На отрезке таких точек $4$."
   ]
  },
  {
   "id": "9.fipi.C97E7E",
   "group": "segment",
   "fipi": "C97E7E",
   "text": "На рисунке изображён график $y = f'\\left(x\\right)$ — производной функции $f\\left(x\\right)$, определённой на интервале $\\left(-9;\\, 4\\right)$. В какой точке отрезка $\\left[ -2;\\, 3\\right]$ функция $f\\left(x\\right)$ принимает наименьшее значение?<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/C97E7E_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "3",
   "steps": [
    "На отрезке $[-2;\\ 3]$ производная отрицательна — функция убывает, наименьшее значение в правом конце."
   ]
  },
  {
   "id": "9.fipi.B537B2",
   "group": "segment",
   "fipi": "B537B2",
   "text": "На рисунке изображён график $y = f'\\left(x\\right)$ — производной функции $f\\left(x\\right)$, определённой на интервале $\\left(-4;\\, 8\\right)$. В какой точке отрезка $\\left[ -2;\\, 3\\right]$ функция $f\\left(x\\right)$ принимает наибольшее значение?<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/B537B2_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "3",
   "steps": [
    "На отрезке $[-2;\\ 3]$ производная положительна — функция возрастает, наибольшее значение в правом конце."
   ]
  },
  {
   "id": "9.fipi.966E26",
   "group": "segment",
   "fipi": "966E26",
   "text": "На рисунке изображён график $y = f'(x)$ — производной функции $f(x)$, определённой на интервале $(-9;\\, 3)$. В какой точке отрезка $[ -7;\\ -5]$ функция $f(x)$ принимает наибольшее значение?<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/966E26_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "-7",
   "steps": [
    "На отрезке $[-7;\\ -5]$ производная отрицательна — функция убывает, наибольшее значение в левом конце."
   ]
  },
  {
   "id": "9.fipi.BE1DDB",
   "group": "segment",
   "fipi": "BE1DDB",
   "text": "На рисунке изображён график функции $y = f\\left(x\\right)$, определённой на интервале $\\left(-10;\\, 3\\right)$. Найдите количество корней уравнения $f'\\left(x\\right) = 0$, принадлежащих отрезку $\\left[ -7;\\, 2\\right]$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/BE1DDB_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "5",
   "steps": [
    "$f'(x) = 0$ в точках экстремума; на отрезке $[-7;\\ 2]$ это $-4$, $-2$, $-1$, $0$, $1$ — пять точек."
   ]
  },
  {
   "id": "9.fipi.B81155",
   "group": "segment",
   "fipi": "B81155",
   "text": "На рисунке изображён график $y = f'(x)$ — производной функции $f(x)$, определённой на интервале $(-4;\\, 8)$. Найдите точку экстремума функции $f(x)$, принадлежащую отрезку $[1;\\, 6]$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/B81155_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "4",
   "steps": [
    "На отрезке $[1;\\ 6]$ производная меняет знак один раз — в точке $4$."
   ]
  },
  {
   "id": "9.fipi.FFF1E1",
   "group": "segment",
   "fipi": "FFF1E1",
   "text": "На рисунке изображён график функции $y = f(x)$, определённой на интервале $(-5;\\, 4)$. Найдите корень уравнения $f'(x) = 0$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/FFF1E1_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "-2",
   "steps": [
    "$f'(x) = 0$ в точке минимума функции — у вершины графика, $x = -2$."
   ]
  },
  {
   "id": "9.fipi.FC5C6D",
   "group": "segment",
   "fipi": "FC5C6D",
   "text": "На рисунке изображён график $y = f'\\left(x\\right)$ — производной функции $f\\left(x\\right)$, определённой на интервале $\\left(-5;\\, 5\\right)$. Найдите точку максимума функции $f\\left(x\\right)$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/FC5C6D_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "2",
   "steps": [
    "Производная меняет знак с «+» на «−» в точке $2$ — это точка максимума."
   ]
  },
  {
   "id": "9.fipi.4DB285",
   "group": "segment",
   "fipi": "4DB285",
   "text": "На рисунке изображён график $y = f'(x)$ — производной функции $f(x)$, определённой на интервале $(-6;\\, 5)$. В какой точке отрезка $[ -5;\\ -2]$ функция $f(x)$ принимает наименьшее значение?<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/4DB285_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "-5",
   "steps": [
    "На отрезке $[-5;\\ -2]$ производная положительна — функция возрастает, наименьшее значение в левом конце."
   ]
  }
 ]
};
