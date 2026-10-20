/* ege-prof-fipi3.js — задания ЕГЭ профиль №3 из открытого банка ФИПИ.
   Собирается скриптом (fipi-pilot/tools/ege/export.py), руками не правится.
   Грузится страницей ege_prof.html только когда открыт этот номер (ensureFipi);
   формат и происхождение — в оглавлении ege-prof-fipi.js. */
(window.EGE_PROF_FIPI = window.EGE_PROF_FIPI || { tasks: {} }).tasks['3'] = {
 "sections": [
  {
   "id": "st",
   "title": "Стереометрия"
  }
 ],
 "groups": [
  {
   "id": "poly",
   "section": "st",
   "title": "Объём многогранника из вершин параллелепипеда или призмы",
   "hint": "Определите, что за тело: пирамида ($V = \\dfrac{1}{3}S h$) или половина параллелепипеда. Основание и высоту берите из рёбер исходного тела."
  },
  {
   "id": "prism_cut",
   "section": "st",
   "title": "Призма, отсечённая плоскостью",
   "hint": "Средняя линия основания: площадь основания отсечённой призмы в 4 раза меньше, периметр вдвое меньше, высота та же."
  },
  {
   "id": "bodies",
   "section": "st",
   "title": "Тела вращения",
   "hint": "Выразите оба объёма (или площади) через один радиус и найдите отношение."
  }
 ],
 "protos": [
  {
   "id": "3.fipi.BE03FA",
   "group": "poly",
   "fipi": "BE03FA",
   "text": "Найдите объём многогранника, вершинами которого являются вершины $A$, $B$, $C$, ${C}_{1}$ правильной треугольной призмы $ABC{A}_{1}{B}_{1}{C}_{1}$, площадь основания которой равна 6, а боковое ребро равно 9.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/BE03FA_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "18",
   "steps": [
    "Многогранник $ A, B, C, C_1 $ — пирамида с основанием $ABC$ (или $A_1B_1C_1$) и высотой, равной боковому ребру.",
    "$$V = \\dfrac{1}{3} \\cdot 6 \\cdot 9 = 18$$"
   ]
  },
  {
   "id": "3.fipi.ADF4FE",
   "group": "poly",
   "fipi": "ADF4FE",
   "text": "В прямоугольном параллелепипеде $ABCD{A}_{1}{B}_{1}{C}_{1}{D}_{1}$ известно, что $AB = 8$, $BC = 7$, $A{A}_{1} = 6$. Найдите объём многогранника, вершинами которого являются точки A, B, C, A1, B1, C1.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/ADF4FE_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "168",
   "steps": [
    "Многогранник $ A, B, C, A_1, B_1, C_1 $ — треугольная призма, ровно половина параллелепипеда (плоскость проходит через его диагональ).",
    "$$V = \\dfrac{8 \\cdot 7 \\cdot 6}{2} = 168$$"
   ]
  },
  {
   "id": "3.fipi.29FE0E",
   "group": "poly",
   "fipi": "29FE0E",
   "text": "Найдите объём многогранника, вершинами которого являются вершины $A$, $B$, $C$, $D$, ${B}_{1}$ прямоугольного параллелепипеда $ABCD{A}_{1}{B}_{1}{C}_{1}{D}_{1}$, у которого $AB = 9$, $BC = 3$, $B{B}_{1} = 8$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/29FE0E_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "72",
   "steps": [
    "Многогранник $ A, B, C, D, B_1 $ — четырёхугольная пирамида: основание — прямоугольник $9 \\times 3$, высота — боковое ребро $8$.",
    "$$V = \\dfrac{1}{3} \\cdot 9 \\cdot 3 \\cdot 8 = 72$$"
   ]
  },
  {
   "id": "3.fipi.F277BE",
   "group": "poly",
   "fipi": "F277BE",
   "text": "Дана правильная треугольная призма $ABC{A}_{1}{B}_{1}{C}_{1}$, площадь основания которой равна 8, а боковое ребро равно 6. Найдите объём многогранника, вершинами которого являются точки $A$, $C$, ${A}_{1}$, ${B}_{1}$, ${C}_{1}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/F277BE_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "32",
   "steps": [
    "Многогранник $ A, C, A_1, B_1, C_1 $ — это призма, от которой отрезана треугольная пирамида с вершиной $B$; у пирамиды то же основание и та же высота, её объём — треть объёма призмы.",
    "$$V_{\\text{призмы}} = 8 \\cdot 6 = 48$$ $$V = 48 - \\dfrac{1}{3} \\cdot 48 = 32$$"
   ]
  },
  {
   "id": "3.fipi.B28DB5",
   "group": "poly",
   "fipi": "B28DB5",
   "text": "В прямоугольном параллелепипеде $ABCD{A}_{1}{B}_{1}{C}_{1}{D}_{1}$ известно, что $AB = 6$, $BC = 5$, $A{A}_{1} = 4$. Найдите объём многогранника, вершинами которого являются точки $A$, $B$, $C$, ${B}_{1}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/B28DB5_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "20",
   "steps": [
    "Многогранник $ A, B, C, B_1 $ — треугольная пирамида: в основании прямоугольный треугольник с катетами $6$ и $5$, высота — боковое ребро $4$.",
    "$$V = \\dfrac{1}{3} \\cdot \\dfrac{6 \\cdot 5}{2} \\cdot 4 = 20$$"
   ]
  },
  {
   "id": "3.fipi.68281C",
   "group": "poly",
   "fipi": "68281C",
   "text": "Найдите объём многогранника, вершинами которого являются вершины $A$, $B$, $C$, $D$, ${A}_{1}$ прямоугольного параллелепипеда $ABCD{A}_{1}{B}_{1}{C}_{1}{D}_{1}$, у которого $AB = 3$, $AD = 9$, $A{A}_{1} = 4$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/68281C_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "36",
   "steps": [
    "Многогранник $ A, B, C, D, A_1 $ — четырёхугольная пирамида: основание — прямоугольник $3 \\times 9$, высота — боковое ребро $4$.",
    "$$V = \\dfrac{1}{3} \\cdot 3 \\cdot 9 \\cdot 4 = 36$$"
   ]
  },
  {
   "id": "3.fipi.06E32C",
   "group": "poly",
   "fipi": "06E32C",
   "text": "В прямоугольном параллелепипеде $ABCD{A}_{1}{B}_{1}{C}_{1}{D}_{1}$ известно, что $AB = 7$, $BC = 6$, $A{A}_{1} = 5$. Найдите объём многогранника, вершинами которого являются точки $A$, $B$, $C$, ${B}_{1}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/06E32C_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "35",
   "steps": [
    "Многогранник $ A, B, C, B_1 $ — треугольная пирамида: в основании прямоугольный треугольник с катетами $7$ и $6$, высота — боковое ребро $5$.",
    "$$V = \\dfrac{1}{3} \\cdot \\dfrac{7 \\cdot 6}{2} \\cdot 5 = 35$$"
   ]
  },
  {
   "id": "3.fipi.2D6929",
   "group": "poly",
   "fipi": "2D6929",
   "text": "В прямоугольном параллелепипеде $ABCD{A}_{1}{B}_{1}{C}_{1}{D}_{1}$ известно, что $BC = 9$, $CD = 3$, $C{C}_{1} = 7$. Найдите объём многогранника, вершинами которого являются точки A, B, C, D, C1.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/2D6929_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "63",
   "steps": [
    "Многогранник $ A, B, C, D, C_1 $ — четырёхугольная пирамида: основание — прямоугольник $3 \\times 9$, высота — боковое ребро $7$.",
    "$$V = \\dfrac{1}{3} \\cdot 3 \\cdot 9 \\cdot 7 = 63$$"
   ]
  },
  {
   "id": "3.fipi.32AF22",
   "group": "poly",
   "fipi": "32AF22",
   "text": "В прямоугольном параллелепипеде $ABCD{A}_{1}{B}_{1}{C}_{1}{D}_{1}$ известно, что $AB = 5$, $BC = 4$, $A{A}_{1} = 3$. Найдите объём многогранника, вершинами которого являются точки $A$, $B$, $C$, $D$, ${A}_{1}$, ${B}_{1}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/32AF22_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "30",
   "steps": [
    "Многогранник $ A, B, C, D, A_1, B_1 $ — треугольная призма, ровно половина параллелепипеда (плоскость проходит через его диагональ).",
    "$$V = \\dfrac{5 \\cdot 4 \\cdot 3}{2} = 30$$"
   ]
  },
  {
   "id": "3.fipi.E1E5D0",
   "group": "poly",
   "fipi": "E1E5D0",
   "text": "Найдите объём многогранника, вершинами которого являются вершины $A$, $B$, $C$, ${B}_{1}$ правильной треугольной призмы $ABC{A}_{1}{B}_{1}{C}_{1}$, площадь основания которой равна 3, а боковое ребро равно 8.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/E1E5D0_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "8",
   "steps": [
    "Многогранник $ A, B, C, B_1 $ — пирамида с основанием $ABC$ (или $A_1B_1C_1$) и высотой, равной боковому ребру.",
    "$$V = \\dfrac{1}{3} \\cdot 3 \\cdot 8 = 8$$"
   ]
  },
  {
   "id": "3.fipi.467AAF",
   "group": "poly",
   "fipi": "467AAF",
   "text": "В прямоугольном параллелепипеде $ABCD{A}_{1}{B}_{1}{C}_{1}{D}_{1}$ известно, что $AB = 9$, $BC = 7$, $A{A}_{1} = 6$. Найдите объём многогранника, вершинами которого являются точки $A$, $B$, $C$, ${B}_{1}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/467AAF_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "63",
   "steps": [
    "Многогранник $ A, B, C, B_1 $ — треугольная пирамида: в основании прямоугольный треугольник с катетами $9$ и $7$, высота — боковое ребро $6$.",
    "$$V = \\dfrac{1}{3} \\cdot \\dfrac{9 \\cdot 7}{2} \\cdot 6 = 63$$"
   ]
  },
  {
   "id": "3.fipi.370392",
   "group": "poly",
   "fipi": "370392",
   "text": "Дана правильная треугольная призма $ABC{A}_{1}{B}_{1}{C}_{1}$, площадь основания которой равна 4, а боковое ребро равно 6. Найдите объём многогранника, вершинами которого являются точки $B$, $C$, ${A}_{1}$, ${B}_{1}$, ${C}_{1}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/370392_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "16",
   "steps": [
    "Многогранник $ B, C, A_1, B_1, C_1 $ — это призма, от которой отрезана треугольная пирамида с вершиной $A$; у пирамиды то же основание и та же высота, её объём — треть объёма призмы.",
    "$$V_{\\text{призмы}} = 4 \\cdot 6 = 24$$ $$V = 24 - \\dfrac{1}{3} \\cdot 24 = 16$$"
   ]
  },
  {
   "id": "3.fipi.B1EBED",
   "group": "poly",
   "fipi": "B1EBED",
   "text": "В прямоугольном параллелепипеде $ABCD{A}_{1}{B}_{1}{C}_{1}{D}_{1}$ известно, что $AB = 7$, $BC = 6$, $A{A}_{1} = 5$. Найдите объём многогранника, вершинами которого являются точки A, B, C, A1, B1, C1.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/B1EBED_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "105",
   "steps": [
    "Многогранник $ A, B, C, A_1, B_1, C_1 $ — треугольная призма, ровно половина параллелепипеда (плоскость проходит через его диагональ).",
    "$$V = \\dfrac{7 \\cdot 6 \\cdot 5}{2} = 105$$"
   ]
  },
  {
   "id": "3.fipi.2359E0",
   "group": "poly",
   "fipi": "2359E0",
   "text": "Найдите объём многогранника, вершинами которого являются вершины $A$, $B$, $C$, ${C}_{1}$ правильной треугольной призмы $ABC{A}_{1}{B}_{1}{C}_{1}$, площадь основания которой равна 7, а боковое ребро равно 9.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/2359E0_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "21",
   "steps": [
    "Многогранник $ A, B, C, C_1 $ — пирамида с основанием $ABC$ (или $A_1B_1C_1$) и высотой, равной боковому ребру.",
    "$$V = \\dfrac{1}{3} \\cdot 7 \\cdot 9 = 21$$"
   ]
  },
  {
   "id": "3.fipi.793F38",
   "group": "poly",
   "fipi": "793F38",
   "text": "В прямоугольном параллелепипеде $ABCD{A}_{1}{B}_{1}{C}_{1}{D}_{1}$ известно, что $AB = 6$, $BC = 5$, $A{A}_{1} = 4$. Найдите объём многогранника, вершинами которого являются точки $A$, $B$, $C$, $D$, ${A}_{1}$, ${B}_{1}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/793F38_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "60",
   "steps": [
    "Многогранник $ A, B, C, D, A_1, B_1 $ — треугольная призма, ровно половина параллелепипеда (плоскость проходит через его диагональ).",
    "$$V = \\dfrac{6 \\cdot 5 \\cdot 4}{2} = 60$$"
   ]
  },
  {
   "id": "3.fipi.E5413A",
   "group": "poly",
   "fipi": "E5413A",
   "text": "В прямоугольном параллелепипеде $ABCD{A}_{1}{B}_{1}{C}_{1}{D}_{1}$ известно, что $AB = 9$, $BC = 6$, $A{A}_{1} = 5$. Найдите объём многогранника, вершинами которого являются точки $A$, $B$, $C$, ${B}_{1}$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/E5413A_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "45",
   "steps": [
    "Многогранник $ A, B, C, B_1 $ — треугольная пирамида: в основании прямоугольный треугольник с катетами $9$ и $6$, высота — боковое ребро $5$.",
    "$$V = \\dfrac{1}{3} \\cdot \\dfrac{9 \\cdot 6}{2} \\cdot 5 = 45$$"
   ]
  },
  {
   "id": "3.fipi.91Be4D",
   "group": "prism_cut",
   "fipi": "91Be4D",
   "text": "Площадь боковой поверхности треугольной призмы равна 48. Через среднюю линию основания призмы проведена плоскость, параллельная боковому ребру. Найдите площадь боковой поверхности отсечённой треугольной призмы.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/91Be4D_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "24",
   "steps": [
    "Средняя линия отсекает от основания треугольник, подобный ему с коэффициентом $\\dfrac{1}{2}$: площадь основания в 4 раза меньше, а стороны — вдвое; высота призмы та же.",
    "Боковая поверхность — периметр основания на высоту, периметр вдвое меньше:",
    "$$48 : 2 = 24$$"
   ]
  },
  {
   "id": "3.fipi.5C9973",
   "group": "prism_cut",
   "fipi": "5C9973",
   "text": "Через среднюю линию основания треугольной призмы, объём которой равен 52, проведена плоскость, параллельная боковому ребру. Найдите объём отсечённой треугольной призмы.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/5C9973_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "13",
   "steps": [
    "Средняя линия отсекает от основания треугольник, подобный ему с коэффициентом $\\dfrac{1}{2}$: площадь основания в 4 раза меньше, а стороны — вдвое; высота призмы та же.",
    "Объём — площадь основания на высоту, площадь в 4 раза меньше:",
    "$$52 : 4 = 13$$"
   ]
  },
  {
   "id": "3.fipi.817F71",
   "group": "prism_cut",
   "fipi": "817F71",
   "text": "Через среднюю линию основания треугольной призмы проведена плоскость, параллельная боковому ребру. Найдите объём этой призмы, если объём отсечённой треугольной призмы равен 15.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/817F71_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "60",
   "steps": [
    "Средняя линия отсекает от основания треугольник, подобный ему с коэффициентом $\\dfrac{1}{2}$: площадь основания в 4 раза меньше, а стороны — вдвое; высота призмы та же.",
    "Объём — площадь основания на высоту, площадь в 4 раза меньше:",
    "$$15 \\cdot 4 = 60$$"
   ]
  },
  {
   "id": "3.fipi.0762B2",
   "group": "prism_cut",
   "fipi": "0762B2",
   "text": "Через среднюю линию основания треугольной призмы проведена плоскость, параллельная боковому ребру. Найдите объём этой призмы, если объём отсечённой треугольной призмы равен 24.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/0762B2_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "96",
   "steps": [
    "Средняя линия отсекает от основания треугольник, подобный ему с коэффициентом $\\dfrac{1}{2}$: площадь основания в 4 раза меньше, а стороны — вдвое; высота призмы та же.",
    "Объём — площадь основания на высоту, площадь в 4 раза меньше:",
    "$$24 \\cdot 4 = 96$$"
   ]
  },
  {
   "id": "3.fipi.6F27B9",
   "group": "prism_cut",
   "fipi": "6F27B9",
   "text": "Через среднюю линию основания правильной треугольной призмы, объём которой равен 84, проведена плоскость, параллельная боковому ребру. Найдите объём отсечённой треугольной призмы.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/6F27B9_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "21",
   "steps": [
    "Средняя линия отсекает от основания треугольник, подобный ему с коэффициентом $\\dfrac{1}{2}$: площадь основания в 4 раза меньше, а стороны — вдвое; высота призмы та же.",
    "Объём — площадь основания на высоту, площадь в 4 раза меньше:",
    "$$84 : 4 = 21$$"
   ]
  },
  {
   "id": "3.fipi.F3Fc26",
   "group": "prism_cut",
   "fipi": "F3Fc26",
   "text": "Объём куба равен 144. Найдите объём треугольной призмы, отсекаемой от куба плоскостью, проходящей через середины двух рёбер, выходящих из одной вершины, и параллельной третьему ребру, выходящему из этой же вершины.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/F3Fc26_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "18",
   "steps": [
    "Основание призмы — прямоугольный треугольник с катетами $\\dfrac{a}{2}$, его площадь $\\dfrac{a^2}{8}$, высота — ребро $a$:",
    "$$V = \\dfrac{a^3}{8} = 144 : 8 = 18$$"
   ]
  },
  {
   "id": "3.fipi.2F9BDB",
   "group": "prism_cut",
   "fipi": "2F9BDB",
   "text": "Площадь боковой поверхности треугольной призмы равна 54. Через среднюю линию основания призмы проведена плоскость, параллельная боковому ребру. Найдите площадь боковой поверхности отсечённой треугольной призмы.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/2F9BDB_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "27",
   "steps": [
    "Средняя линия отсекает от основания треугольник, подобный ему с коэффициентом $\\dfrac{1}{2}$: площадь основания в 4 раза меньше, а стороны — вдвое; высота призмы та же.",
    "Боковая поверхность — периметр основания на высоту, периметр вдвое меньше:",
    "$$54 : 2 = 27$$"
   ]
  },
  {
   "id": "3.fipi.1F4550",
   "group": "prism_cut",
   "fipi": "1F4550",
   "text": "Площадь боковой поверхности треугольной призмы равна 24. Через среднюю линию основания призмы проведена плоскость, параллельная боковому ребру. Найдите площадь боковой поверхности отсечённой треугольной призмы.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/1F4550_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "12",
   "steps": [
    "Средняя линия отсекает от основания треугольник, подобный ему с коэффициентом $\\dfrac{1}{2}$: площадь основания в 4 раза меньше, а стороны — вдвое; высота призмы та же.",
    "Боковая поверхность — периметр основания на высоту, периметр вдвое меньше:",
    "$$24 : 2 = 12$$"
   ]
  },
  {
   "id": "3.fipi.68cAA2",
   "group": "prism_cut",
   "fipi": "68cAA2",
   "text": "Через среднюю линию основания треугольной призмы, объём которой равен 24, проведена плоскость, параллельная боковому ребру. Найдите объём отсечённой треугольной призмы.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/68cAA2_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "6",
   "steps": [
    "Средняя линия отсекает от основания треугольник, подобный ему с коэффициентом $\\dfrac{1}{2}$: площадь основания в 4 раза меньше, а стороны — вдвое; высота призмы та же.",
    "Объём — площадь основания на высоту, площадь в 4 раза меньше:",
    "$$24 : 4 = 6$$"
   ]
  },
  {
   "id": "3.fipi.F51D9A",
   "group": "prism_cut",
   "fipi": "F51D9A",
   "text": "Объём куба равен 80. Найдите объём треугольной призмы, отсекаемой от куба плоскостью, проходящей через середины двух рёбер, выходящих из одной вершины, и параллельной третьему ребру, выходящему из этой же вершины.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/F51D9A_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "10",
   "steps": [
    "Основание призмы — прямоугольный треугольник с катетами $\\dfrac{a}{2}$, его площадь $\\dfrac{a^2}{8}$, высота — ребро $a$:",
    "$$V = \\dfrac{a^3}{8} = 80 : 8 = 10$$"
   ]
  },
  {
   "id": "3.fipi.e3e194",
   "group": "prism_cut",
   "fipi": "e3e194",
   "text": "Через среднюю линию основания треугольной призмы проведена плоскость, параллельная боковому ребру. Площадь боковой поверхности отсечённой треугольной призмы равна 18. Найдите площадь боковой поверхности исходной призмы.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/e3e194_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "36",
   "steps": [
    "Средняя линия отсекает от основания треугольник, подобный ему с коэффициентом $\\dfrac{1}{2}$: площадь основания в 4 раза меньше, а стороны — вдвое; высота призмы та же.",
    "Боковая поверхность — периметр основания на высоту, периметр вдвое меньше:",
    "$$18 \\cdot 2 = 36$$"
   ]
  },
  {
   "id": "3.fipi.0989E5",
   "group": "prism_cut",
   "fipi": "0989E5",
   "text": "Через среднюю линию основания треугольной призмы проведена плоскость, параллельная боковому ребру. Найдите объём этой призмы, если объём отсечённой треугольной призмы равен 5.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/0989E5_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "20",
   "steps": [
    "Средняя линия отсекает от основания треугольник, подобный ему с коэффициентом $\\dfrac{1}{2}$: площадь основания в 4 раза меньше, а стороны — вдвое; высота призмы та же.",
    "Объём — площадь основания на высоту, площадь в 4 раза меньше:",
    "$$5 \\cdot 4 = 20$$"
   ]
  },
  {
   "id": "3.fipi.5C56EC",
   "group": "prism_cut",
   "fipi": "5C56EC",
   "text": "Через среднюю линию основания треугольной призмы проведена плоскость, параллельная боковому ребру. Площадь боковой поверхности отсечённой треугольной призмы равна 36. Найдите площадь боковой поверхности исходной призмы.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/5C56EC_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "72",
   "steps": [
    "Средняя линия отсекает от основания треугольник, подобный ему с коэффициентом $\\dfrac{1}{2}$: площадь основания в 4 раза меньше, а стороны — вдвое; высота призмы та же.",
    "Боковая поверхность — периметр основания на высоту, периметр вдвое меньше:",
    "$$36 \\cdot 2 = 72$$"
   ]
  },
  {
   "id": "3.fipi.843F31",
   "group": "prism_cut",
   "fipi": "843F31",
   "text": "Через среднюю линию основания треугольной призмы проведена плоскость, параллельная боковому ребру. Найдите объём этой призмы, если объём отсечённой треугольной призмы равен 7.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/843F31_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "28",
   "steps": [
    "Средняя линия отсекает от основания треугольник, подобный ему с коэффициентом $\\dfrac{1}{2}$: площадь основания в 4 раза меньше, а стороны — вдвое; высота призмы та же.",
    "Объём — площадь основания на высоту, площадь в 4 раза меньше:",
    "$$7 \\cdot 4 = 28$$"
   ]
  },
  {
   "id": "3.fipi.69588c",
   "group": "prism_cut",
   "fipi": "69588c",
   "text": "Через среднюю линию основания треугольной призмы, объём которой равен 48, проведена плоскость, параллельная боковому ребру. Найдите объём отсечённой треугольной призмы.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/69588c_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "12",
   "steps": [
    "Средняя линия отсекает от основания треугольник, подобный ему с коэффициентом $\\dfrac{1}{2}$: площадь основания в 4 раза меньше, а стороны — вдвое; высота призмы та же.",
    "Объём — площадь основания на высоту, площадь в 4 раза меньше:",
    "$$48 : 4 = 12$$"
   ]
  },
  {
   "id": "3.fipi.37164B",
   "group": "bodies",
   "fipi": "37164B",
   "text": "Цилиндр и конус имеют общие основание и высоту. Высота цилиндра равна радиусу основания. Площадь боковой поверхности цилиндра равна $5\\sqrt{2}$. Найдите площадь боковой поверхности конуса.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/37164B_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "5",
   "steps": [
    "Пусть $r = h$. Образующая конуса $l = \\sqrt{r^2 + h^2} = r\\sqrt{2}$.",
    "$$S_{\\text{цил}} = 2\\pi r h = 2\\pi r^2$$ $$S_{\\text{кон}} = \\pi r l = \\pi r^2\\sqrt{2}$$ $$\\dfrac{S_{\\text{цил}}}{S_{\\text{кон}}} = \\dfrac{2}{\\sqrt{2}} = \\sqrt{2}$$",
    "$$S_{\\text{кон}} = \\dfrac{5\\sqrt{2}}{\\sqrt{2}} = 5$$"
   ]
  },
  {
   "id": "3.fipi.6D5AF2",
   "group": "bodies",
   "fipi": "6D5AF2",
   "text": "Шар, объём которого равен 18, вписан в цилиндр. Найдите объём цилиндра.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/6D5AF2_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "27",
   "steps": [
    "У цилиндра, описанного около шара, радиус $r$ и высота $2r$:",
    "$$V_{\\text{шар}} = \\dfrac{4}{3}\\pi r^3$$ $$V_{\\text{цил}} = \\pi r^2 \\cdot 2r = 2\\pi r^3 = \\dfrac{3}{2}V_{\\text{шар}}$$",
    "$$\\dfrac{3}{2} \\cdot 18 = 27$$"
   ]
  },
  {
   "id": "3.fipi.Dc980A",
   "group": "bodies",
   "fipi": "Dc980A",
   "text": "Около конуса описана сфера (сфера содержит окружность основания конуса и его вершину). Центр сферы находится в центре основания конуса. Радиус сферы равен $84\\sqrt{2}$. Найдите длину образующей конуса.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/Dc980A_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "168",
   "steps": [
    "Центр сферы — центр основания, поэтому радиус основания и высота конуса равны радиусу сферы $R$; образующая $l = \\sqrt{R^2 + R^2} = R\\sqrt{2}$.",
    "$$l = 84\\sqrt{2} \\cdot \\sqrt{2} = 168$$"
   ]
  },
  {
   "id": "3.fipi.D5AC0C",
   "group": "bodies",
   "fipi": "D5AC0C",
   "text": "Цилиндр вписан в прямоугольный параллелепипед. Радиус основания и высота цилиндра равны 2. Найдите объём параллелепипеда.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/D5AC0C_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "32",
   "steps": [
    "Основание параллелепипеда — квадрат со стороной $2r = 4$, высота $2$:",
    "$$V = 4 \\cdot 4 \\cdot 2 = 32$$"
   ]
  },
  {
   "id": "3.fipi.F4F51D",
   "group": "bodies",
   "fipi": "F4F51D",
   "text": "Дано два цилиндра. Объём первого цилиндра равен 15. У второго цилиндра высота в 3 раза меньше, а радиус основания в 2 раза больше, чем у первого. Найдите объём второго цилиндра.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/F4F51D_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "20",
   "steps": [
    "$V = \\pi r^2 h$: радиус в квадрате даёт множитель $2^2 = 4$, высота делится на $3$.",
    "$$15 \\cdot \\dfrac{4}{3} = 20$$"
   ]
  },
  {
   "id": "3.fipi.26B211",
   "group": "bodies",
   "fipi": "26B211",
   "text": "Цилиндр и конус имеют общие основание и высоту. Объём цилиндра равен 30. Найдите объём конуса.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/26B211_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "10",
   "steps": [
    "Объём конуса — треть объёма цилиндра с тем же основанием и высотой: $V_{\\text{кон}} = \\dfrac{1}{3}\\pi r^2 h$, $V_{\\text{цил}} = \\pi r^2 h$.",
    "$$30 : 3 = 10$$"
   ]
  },
  {
   "id": "3.fipi.80631B",
   "group": "bodies",
   "fipi": "80631B",
   "text": "Конус вписан в шар. Радиус основания конуса равен радиусу шара. Объём шара равен 60. Найдите объём конуса.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/80631B_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "15",
   "steps": [
    "Основание конуса проходит через центр шара, высота конуса равна радиусу $R$: $V_{\\text{кон}} = \\dfrac{1}{3}\\pi R^3$, $V_{\\text{шар}} = \\dfrac{4}{3}\\pi R^3$ — в 4 раза больше.",
    "$$60 : 4 = 15$$"
   ]
  },
  {
   "id": "3.fipi.135723",
   "group": "bodies",
   "fipi": "135723",
   "text": "Цилиндр и конус имеют общие основание и высоту. Высота цилиндра равна радиусу основания. Площадь боковой поверхности конуса равна $3\\sqrt{2}$. Найдите площадь боковой поверхности цилиндра.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/135723_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "6",
   "steps": [
    "Пусть $r = h$. Образующая конуса $l = \\sqrt{r^2 + h^2} = r\\sqrt{2}$.",
    "$$S_{\\text{цил}} = 2\\pi r h = 2\\pi r^2$$ $$S_{\\text{кон}} = \\pi r l = \\pi r^2\\sqrt{2}$$ $$\\dfrac{S_{\\text{цил}}}{S_{\\text{кон}}} = \\dfrac{2}{\\sqrt{2}} = \\sqrt{2}$$",
    "$$S_{\\text{цил}} = 3\\sqrt{2} \\cdot \\sqrt{2} = 6$$"
   ]
  },
  {
   "id": "3.fipi.E71725",
   "group": "bodies",
   "fipi": "E71725",
   "text": "Во сколько раз уменьшится объём конуса, если его высота уменьшится в 9 раз, а радиус основания останется прежним?<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/E71725_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "9",
   "steps": [
    "$V = \\dfrac{1}{3}\\pi r^2 h$ — объём пропорционален высоте: уменьшится во столько же раз."
   ]
  },
  {
   "id": "3.fipi.841122",
   "group": "bodies",
   "fipi": "841122",
   "text": "Цилиндр и конус имеют общие основание и высоту. Объём конуса равен 12. Найдите объём цилиндра.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/841122_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "36",
   "steps": [
    "Объём конуса — треть объёма цилиндра с тем же основанием и высотой: $V_{\\text{кон}} = \\dfrac{1}{3}\\pi r^2 h$, $V_{\\text{цил}} = \\pi r^2 h$.",
    "$$12 \\cdot 3 = 36$$"
   ]
  },
  {
   "id": "3.fipi.1E28D8",
   "group": "bodies",
   "fipi": "1E28D8",
   "text": "Шар вписан в цилиндр. Площадь полной поверхности цилиндра равна 30. Найдите площадь поверхности шара.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/1E28D8_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "20",
   "steps": [
    "Радиус цилиндра $r$, высота $2r$: $$S_{\\text{цил}} = 2\\pi r^2 + 2\\pi r \\cdot 2r = 6\\pi r^2$$ $$S_{\\text{шар}} = 4\\pi r^2 = \\dfrac{2}{3}S_{\\text{цил}}$$",
    "$$\\dfrac{2}{3} \\cdot 30 = 20$$"
   ]
  },
  {
   "id": "3.fipi.41E054",
   "group": "bodies",
   "fipi": "41E054",
   "text": "Цилиндр и конус имеют общие основание и высоту. Объём цилиндра равен 6. Найдите объём конуса.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/41E054_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "2",
   "steps": [
    "Объём конуса — треть объёма цилиндра с тем же основанием и высотой: $V_{\\text{кон}} = \\dfrac{1}{3}\\pi r^2 h$, $V_{\\text{цил}} = \\pi r^2 h$.",
    "$$6 : 3 = 2$$"
   ]
  },
  {
   "id": "3.fipi.1D9551",
   "group": "bodies",
   "fipi": "1D9551",
   "text": "Конус вписан в шар. Радиус основания конуса равен радиусу шара. Объём конуса равен 12. Найдите объём шара.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/1D9551_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "48",
   "steps": [
    "Основание конуса проходит через центр шара, высота конуса равна радиусу $R$: $V_{\\text{кон}} = \\dfrac{1}{3}\\pi R^3$, $V_{\\text{шар}} = \\dfrac{4}{3}\\pi R^3$ — в 4 раза больше.",
    "$$12 \\cdot 4 = 48$$"
   ]
  },
  {
   "id": "3.fipi.DFC057",
   "group": "bodies",
   "fipi": "DFC057",
   "text": "Цилиндр и конус имеют общие основание и высоту. Объём конуса равен 6. Найдите объём цилиндра.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/DFC057_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "18",
   "steps": [
    "Объём конуса — треть объёма цилиндра с тем же основанием и высотой: $V_{\\text{кон}} = \\dfrac{1}{3}\\pi r^2 h$, $V_{\\text{цил}} = \\pi r^2 h$.",
    "$$6 \\cdot 3 = 18$$"
   ]
  },
  {
   "id": "3.fipi.48EB9B",
   "group": "bodies",
   "fipi": "48EB9B",
   "text": "Шар, объём которого равен 24, вписан в цилиндр. Найдите объём цилиндра.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/48EB9B_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "36",
   "steps": [
    "У цилиндра, описанного около шара, радиус $r$ и высота $2r$:",
    "$$V_{\\text{шар}} = \\dfrac{4}{3}\\pi r^3$$ $$V_{\\text{цил}} = \\pi r^2 \\cdot 2r = 2\\pi r^3 = \\dfrac{3}{2}V_{\\text{шар}}$$",
    "$$\\dfrac{3}{2} \\cdot 24 = 36$$"
   ]
  },
  {
   "id": "3.fipi.FcFB97",
   "group": "bodies",
   "fipi": "FcFB97",
   "text": "Площадь сечения шара плоскостью, проходящей через центр шара, равна 12. Найдите площадь поверхности шара.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/FcFB97_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "48",
   "steps": [
    "Сечение через центр — круг радиуса $R$: $\\pi R^2$. Поверхность шара $4\\pi R^2$ — в 4 раза больше:",
    "$$12 \\cdot 4 = 48$$"
   ]
  },
  {
   "id": "3.fipi.61D99A",
   "group": "bodies",
   "fipi": "61D99A",
   "text": "Дано два цилиндра. Объём первого цилиндра равен 18. У второго цилиндра высота в 3 раза меньше, а радиус основания в 2 раза больше, чем у первого. Найдите объём второго цилиндра.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/61D99A_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "24",
   "steps": [
    "$V = \\pi r^2 h$: радиус в квадрате даёт множитель $2^2 = 4$, высота делится на $3$.",
    "$$18 \\cdot \\dfrac{4}{3} = 24$$"
   ]
  },
  {
   "id": "3.fipi.DB4Ae5",
   "group": "bodies",
   "fipi": "DB4Ae5",
   "text": "Около конуса описана сфера (сфера содержит окружность основания конуса и его вершину). Центр сферы находится в центре основания конуса. Образующая конуса равна $9\\sqrt{2}$. Найдите радиус сферы.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/DB4Ae5_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "9",
   "steps": [
    "Центр сферы — центр основания, поэтому радиус основания и высота конуса равны радиусу сферы $R$; образующая $l = \\sqrt{R^2 + R^2} = R\\sqrt{2}$.",
    "$$R = \\dfrac{9\\sqrt{2}}{\\sqrt{2}} = 9$$"
   ]
  },
  {
   "id": "3.fipi.cD7468",
   "group": "bodies",
   "fipi": "cD7468",
   "text": "Цилиндр и конус имеют общие основание и высоту. Высота цилиндра равна радиусу основания. Площадь боковой поверхности цилиндра равна $3\\sqrt{2}$. Найдите площадь боковой поверхности конуса.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/cD7468_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "3",
   "steps": [
    "Пусть $r = h$. Образующая конуса $l = \\sqrt{r^2 + h^2} = r\\sqrt{2}$.",
    "$$S_{\\text{цил}} = 2\\pi r h = 2\\pi r^2$$ $$S_{\\text{кон}} = \\pi r l = \\pi r^2\\sqrt{2}$$ $$\\dfrac{S_{\\text{цил}}}{S_{\\text{кон}}} = \\dfrac{2}{\\sqrt{2}} = \\sqrt{2}$$",
    "$$S_{\\text{кон}} = \\dfrac{3\\sqrt{2}}{\\sqrt{2}} = 3$$"
   ]
  },
  {
   "id": "3.fipi.936F6F",
   "group": "bodies",
   "fipi": "936F6F",
   "text": "Шар вписан в цилиндр. Площадь полной поверхности цилиндра равна 21. Найдите площадь поверхности шара.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/936F6F_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "14",
   "steps": [
    "Радиус цилиндра $r$, высота $2r$: $$S_{\\text{цил}} = 2\\pi r^2 + 2\\pi r \\cdot 2r = 6\\pi r^2$$ $$S_{\\text{шар}} = 4\\pi r^2 = \\dfrac{2}{3}S_{\\text{цил}}$$",
    "$$\\dfrac{2}{3} \\cdot 21 = 14$$"
   ]
  },
  {
   "id": "3.fipi.E45C62",
   "group": "bodies",
   "fipi": "E45C62",
   "text": "Цилиндр и конус имеют общие основание и высоту. Высота цилиндра равна радиусу основания. Площадь боковой поверхности конуса равна $3\\sqrt{2}$. Найдите площадь боковой поверхности цилиндра.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/E45C62_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "6",
   "steps": [
    "Пусть $r = h$. Образующая конуса $l = \\sqrt{r^2 + h^2} = r\\sqrt{2}$.",
    "$$S_{\\text{цил}} = 2\\pi r h = 2\\pi r^2$$ $$S_{\\text{кон}} = \\pi r l = \\pi r^2\\sqrt{2}$$ $$\\dfrac{S_{\\text{цил}}}{S_{\\text{кон}}} = \\dfrac{2}{\\sqrt{2}} = \\sqrt{2}$$",
    "$$S_{\\text{цил}} = 3\\sqrt{2} \\cdot \\sqrt{2} = 6$$"
   ]
  },
  {
   "id": "3.fipi.47F68F",
   "group": "bodies",
   "fipi": "47F68F",
   "text": "Около конуса описана сфера (сфера содержит окружность основания конуса и его вершину). Центр сферы находится в центре основания конуса. Образующая конуса равна $18\\sqrt{2}$. Найдите радиус сферы.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/47F68F_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "18",
   "steps": [
    "Центр сферы — центр основания, поэтому радиус основания и высота конуса равны радиусу сферы $R$; образующая $l = \\sqrt{R^2 + R^2} = R\\sqrt{2}$.",
    "$$R = \\dfrac{18\\sqrt{2}}{\\sqrt{2}} = 18$$"
   ]
  },
  {
   "id": "3.fipi.B4FF85",
   "group": "bodies",
   "fipi": "B4FF85",
   "text": "Цилиндр, объём которого равен 18, описан около шара. Найдите объём шара.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/B4FF85_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "12",
   "steps": [
    "У цилиндра, описанного около шара, радиус $r$ и высота $2r$: $V_{\\text{цил}} = 2\\pi r^3$, $V_{\\text{шар}} = \\dfrac{4}{3}\\pi r^3 = \\dfrac{2}{3}V_{\\text{цил}}$.",
    "$$\\dfrac{2}{3} \\cdot 18 = 12$$"
   ]
  },
  {
   "id": "3.fipi.D8F984",
   "group": "bodies",
   "fipi": "D8F984",
   "text": "Цилиндр и конус имеют общие основание и высоту. Объём цилиндра равен 18. Найдите объём конуса.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/D8F984_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "6",
   "steps": [
    "Объём конуса — треть объёма цилиндра с тем же основанием и высотой: $V_{\\text{кон}} = \\dfrac{1}{3}\\pi r^2 h$, $V_{\\text{цил}} = \\pi r^2 h$.",
    "$$18 : 3 = 6$$"
   ]
  },
  {
   "id": "3.fipi.C59282",
   "group": "bodies",
   "fipi": "C59282",
   "text": "Цилиндр и конус имеют общие основание и высоту. Объём конуса равен 9. Найдите объём цилиндра.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/C59282_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "27",
   "steps": [
    "Объём конуса — треть объёма цилиндра с тем же основанием и высотой: $V_{\\text{кон}} = \\dfrac{1}{3}\\pi r^2 h$, $V_{\\text{цил}} = \\pi r^2 h$.",
    "$$9 \\cdot 3 = 27$$"
   ]
  },
  {
   "id": "3.fipi.33B18F",
   "group": "bodies",
   "fipi": "33B18F",
   "text": "Во сколько раз увеличится объём конуса, если радиус его основания увеличится в 11 раз, а высота останется прежней?<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/33B18F_1.gif\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "121",
   "steps": [
    "$V = \\dfrac{1}{3}\\pi r^2 h$ — объём пропорционален квадрату радиуса:",
    "$$11^2 = 121$$"
   ]
  }
 ]
};
