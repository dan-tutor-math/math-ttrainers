/* ege-prof-fipi1.js — задания ЕГЭ профиль №1 из открытого банка ФИПИ.
   Собирается скриптом (fipi-pilot/tools/ege/export.py), руками не правится.
   Грузится страницей ege_prof.html только когда открыт этот номер (ensureFipi);
   формат и происхождение — в оглавлении ege-prof-fipi.js. */
(window.EGE_PROF_FIPI = window.EGE_PROF_FIPI || { tasks: {} }).tasks['1'] = {
 "sections": [
  {
   "id": "pl",
   "title": "Планиметрия"
  }
 ],
 "groups": [
  {
   "id": "triangle",
   "section": "pl",
   "title": "Углы треугольника",
   "hint": "Сумма углов треугольника $180^\\circ$, внешний угол — смежный с внутренним. В прямоугольном: медиана к гипотенузе равна её половине, биссектриса прямого угла даёт $45^\\circ$."
  },
  {
   "id": "trig",
   "section": "pl",
   "title": "Синус и косинус в прямоугольном треугольнике",
   "hint": "$\\sin A$ — противолежащий катет к гипотенузе, $\\cos A$ — прилежащий к гипотенузе. Недостающий катет — по теореме Пифагора."
  },
  {
   "id": "circle",
   "section": "pl",
   "title": "Углы и окружность",
   "hint": "Вписанный угол вдвое меньше центрального на ту же дугу; вписанные углы на одну дугу равны; у вписанного четырёхугольника противоположные углы в сумме $180^\\circ$; радиус в точку касания перпендикулярен касательной."
  },
  {
   "id": "quad",
   "section": "pl",
   "title": "Четырёхугольник, описанный около окружности",
   "hint": "Суммы противоположных сторон равны: $AB + CD = BC + AD$ — это половина периметра."
  },
  {
   "id": "area",
   "section": "pl",
   "title": "Площади",
   "hint": "Площадь через разные стороны и высоты к ним одна и та же; средняя линия отсекает подобный треугольник с площадью в 4 раза меньше."
  }
 ],
 "protos": [
  {
   "id": "1.fipi.2933FB",
   "group": "triangle",
   "fipi": "2933FB",
   "text": "В треугольнике $ABC$ стороны $AC$ и $BC$ равны, угол $C$ равен $168^\\circ$, угол $CBD$ внешний. Найдите величину угла $CBD$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/2933FB_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "174",
   "steps": [
    "Углы при основании равны: $$\\angle B = \\dfrac{180^\\circ - 168^\\circ}{2} = 6^\\circ$$",
    "Внешний угол: $$180^\\circ - 6^\\circ = 174^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.1DD37A",
   "group": "triangle",
   "fipi": "1DD37A",
   "text": "В треугольнике $ABC$ сторона $AB$ равна $3\\sqrt{2}$, угол $C$ равен $135^\\circ$. Найдите радиус описанной около этого треугольника окружности.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/1DD37A_1.gif\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "3",
   "steps": [
    "По теореме синусов $\\dfrac{AB}{\\sin C} = 2R$:",
    "$$R = \\dfrac{3 \\sqrt{2}}{2\\sin 135^\\circ} = \\dfrac{3 \\sqrt{2}}{2 \\cdot \\frac{\\sqrt{2}}{2}} = 3$$"
   ]
  },
  {
   "id": "1.fipi.018816",
   "group": "triangle",
   "fipi": "018816",
   "text": "Острый угол $B$ прямоугольного треугольника $ABC$ равен $9^\\circ$. Найдите величину угла между высотой $CH$ и медианой $CM$, проведёнными из вершины прямого угла $C$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/018816_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "72",
   "steps": [
    "Медиана к гипотенузе равна её половине: $MC = MB$, поэтому $\\angle MCB = \\angle B = 9^\\circ$.",
    "В треугольнике $CHB$: $\\angle HCB = 90^\\circ - 9^\\circ = 81^\\circ$.",
    "$$|9^\\circ - 81^\\circ| = 72^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.B54D55",
   "group": "triangle",
   "fipi": "B54D55",
   "text": "Острый угол $B$ прямоугольного треугольника $ABC$ равен $21^\\circ$. Найдите величину угла между биссектрисой $CD$ и медианой $CM$, проведёнными из вершины прямого угла $C$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/B54D55_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "24",
   "steps": [
    "Медиана к гипотенузе равна её половине: $MC = MB$, поэтому $\\angle MCB = \\angle B = 21^\\circ$.",
    "Биссектриса делит прямой угол пополам: $\\angle DCB = 45^\\circ$.",
    "$$|45^\\circ - 21^\\circ| = 24^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.78e8A7",
   "group": "triangle",
   "fipi": "78e8A7",
   "text": "Острый угол $B$ прямоугольного треугольника $ABC$ равен $25^\\circ$. Найдите величину угла между высотой $CH$ и биссектрисой $CD$, проведёнными из вершины прямого угла $C$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/78e8A7_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "20",
   "steps": [
    "В треугольнике $CHB$: $\\angle HCB = 90^\\circ - 25^\\circ = 65^\\circ$.",
    "Биссектриса делит прямой угол пополам: $\\angle DCB = 45^\\circ$.",
    "$$|45^\\circ - 65^\\circ| = 20^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.6709ee",
   "group": "triangle",
   "fipi": "6709ee",
   "text": "В треугольнике $ABC$ угол $C$ равен $54^\\circ$, $AD$ — биссектриса, угол $CAD$ равен $30^\\circ$. Найдите величину угла $B$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/6709ee_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "66",
   "steps": [
    "$AD$ — биссектриса: $\\angle A = 2 \\cdot 30^\\circ = 60^\\circ$.",
    "$$\\angle B = 180^\\circ - 54^\\circ - 60^\\circ = 66^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.B4C261",
   "group": "triangle",
   "fipi": "B4C261",
   "text": "В треугольнике $ABC$ стороны $AC$ и $BC$ равны. Внешний угол при вершине $B$ равен $107^\\circ$. Найдите угол $C$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/B4C261_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "34",
   "steps": [
    "$$\\angle B = 180^\\circ - 107^\\circ = 73^\\circ$$",
    "$\\angle A = \\angle B$, поэтому $$\\angle C = 180^\\circ - 2 \\cdot 73^\\circ = 34^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.5B6e6D",
   "group": "triangle",
   "fipi": "5B6e6D",
   "text": "Острый угол $B$ прямоугольного треугольника $ABC$ равен $65^\\circ$. Найдите величину угла между высотой $CH$ и медианой $CM$, проведёнными из вершины прямого угла $C$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/5B6e6D_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "40",
   "steps": [
    "Медиана к гипотенузе равна её половине: $MC = MB$, поэтому $\\angle MCB = \\angle B = 65^\\circ$.",
    "В треугольнике $CHB$: $\\angle HCB = 90^\\circ - 65^\\circ = 25^\\circ$.",
    "$$|65^\\circ - 25^\\circ| = 40^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.997361",
   "group": "triangle",
   "fipi": "997361",
   "text": "В треугольнике $ABC$ угол $C$ равен $54^\\circ$, $AD$ — биссектриса, угол $BAD$ равен $23^\\circ$. Найдите величину угла $ADB$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/997361_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "77",
   "steps": [
    "$AD$ — биссектриса: $\\angle A = 2 \\cdot 23^\\circ = 46^\\circ$.",
    "$$\\angle B = 180^\\circ - 54^\\circ - 46^\\circ = 80^\\circ$$",
    "$$\\angle ADB = 180^\\circ - 80^\\circ - 23^\\circ = 77^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.82F839",
   "group": "triangle",
   "fipi": "82F839",
   "text": "В треугольнике $ABC$ угол $C$ равен $55^\\circ$, $AD$ — биссектриса, угол $CAD$ равен $29^\\circ$. Найдите величину угла $ABD$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/82F839_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "67",
   "steps": [
    "$AD$ — биссектриса: $\\angle A = 2 \\cdot 29^\\circ = 58^\\circ$.",
    "$$\\angle B = 180^\\circ - 55^\\circ - 58^\\circ = 67^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.D68789",
   "group": "triangle",
   "fipi": "D68789",
   "text": "Острый угол $B$ прямоугольного треугольника $ABC$ равен $70^\\circ$. Найдите величину угла между биссектрисой $CD$ и медианой $CM$, проведёнными из вершины прямого угла $C$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/D68789_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "25",
   "steps": [
    "Медиана к гипотенузе равна её половине: $MC = MB$, поэтому $\\angle MCB = \\angle B = 70^\\circ$.",
    "Биссектриса делит прямой угол пополам: $\\angle DCB = 45^\\circ$.",
    "$$|45^\\circ - 70^\\circ| = 25^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.8D3587",
   "group": "triangle",
   "fipi": "8D3587",
   "text": "В треугольнике $ABC$ сторона $AB$ равна $2\\sqrt{3}$, угол $С$ равен $120^\\circ$. Найдите радиус описанной около этого треугольника окружности.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/8D3587_1.gif\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "2",
   "steps": [
    "По теореме синусов $\\dfrac{AB}{\\sin C} = 2R$:",
    "$$R = \\dfrac{2 \\sqrt{3}}{2\\sin 120^\\circ} = \\dfrac{2 \\sqrt{3}}{2 \\cdot \\frac{\\sqrt{3}}{2}} = 2$$"
   ]
  },
  {
   "id": "1.fipi.A33A46",
   "group": "trig",
   "fipi": "A33A46",
   "text": "В треугольнике $ABC$ угол $C$ равен $90^\\circ$, $AB = 10$, $BC = \\sqrt{19}$. Найдите $\\cos A$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/A33A46_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "0,9",
   "steps": [
    "По теореме Пифагора: $$AC = \\sqrt{10^2 - 19} = 9$$",
    "$$\\cos A = \\dfrac{AC}{AB} = \\dfrac{9}{10} = 0{,}9$$"
   ]
  },
  {
   "id": "1.fipi.7FA4FB",
   "group": "trig",
   "fipi": "7FA4FB",
   "text": "В треугольнике $ABC$ угол $C$ равен $90^\\circ$, $AB = 10$, $AC = \\sqrt{51}$. Найдите $\\sin A$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/7FA4FB_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "0,7",
   "steps": [
    "По теореме Пифагора: $$BC = \\sqrt{10^2 - 51} = 7$$",
    "$$\\sin A = \\dfrac{BC}{AB} = \\dfrac{7}{10} = 0{,}7$$"
   ]
  },
  {
   "id": "1.fipi.FFBD0F",
   "group": "trig",
   "fipi": "FFBD0F",
   "text": "В треугольнике $ABC$ угол $C$ равен $90^\\circ$, $AB = 10$, $AC = \\sqrt{91}$. Найдите $\\sin A$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/FFBD0F_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "0,3",
   "steps": [
    "По теореме Пифагора: $$BC = \\sqrt{10^2 - 91} = 3$$",
    "$$\\sin A = \\dfrac{BC}{AB} = \\dfrac{3}{10} = 0{,}3$$"
   ]
  },
  {
   "id": "1.fipi.847B0B",
   "group": "trig",
   "fipi": "847B0B",
   "text": "В треугольнике $ABC$ угол $C$ равен $90^\\circ$, $AB = 5$, $BC = 4$. Найдите $\\cos A$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/847B0B_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "0,6",
   "steps": [
    "По теореме Пифагора: $$AC = \\sqrt{5^2 - 16} = 3$$",
    "$$\\cos A = \\dfrac{AC}{AB} = \\dfrac{3}{5} = 0{,}6$$"
   ]
  },
  {
   "id": "1.fipi.80A34C",
   "group": "circle",
   "fipi": "80A34C",
   "text": "Отрезки $AC$ и $BD$ — диаметры окружности с центром $O$. Угол $ACB$ равен $41^\\circ$. Найдите величину угла $AOD$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/80A34C_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "98",
   "steps": [
    "Вписанный угол $ACB$ опирается на дугу $AB$, центральный $AOB = 2 \\cdot 41^\\circ = 82^\\circ$.",
    "Углы $AOB$ и $AOD$ смежные: $$180^\\circ - 82^\\circ = 98^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.84E9F2",
   "group": "circle",
   "fipi": "84E9F2",
   "text": "Найдите величину угла $ACO$, если его сторона $CA$ касается окружности с центром $O$, отрезок $CO$ пересекает окружность в точке $B$ (см. рисунок), а дуга $AB$ окружности, заключённая внутри этого угла, равна $66^\\circ$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/84E9F2_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "24",
   "steps": [
    "Радиус $OA$ перпендикулярен касательной: $\\angle OAC = 90^\\circ$. Центральный угол $AOB$ равен дуге: $66^\\circ$.",
    "$$\\angle ACO = 90^\\circ - 66^\\circ = 24^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.C7D60A",
   "group": "circle",
   "fipi": "C7D60A",
   "text": "Четырёхугольник $ABCD$ вписан в окружность. Угол $ABC$ равен $103^\\circ$, угол $CAD$ равен $42^\\circ$. Найдите угол $ABD$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/C7D60A_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "61",
   "steps": [
    "Вписанные углы $CAD$ и $CBD$ опираются на одну дугу $CD$ — они равны.",
    "$$\\angle ABD = \\angle ABC - \\angle CBD = 103^\\circ - 42^\\circ = 61^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.3CF402",
   "group": "circle",
   "fipi": "3CF402",
   "text": "Четырёхугольник $ABCD$ вписан в окружность. Угол $ABD$ равен $61^\\circ$, угол $CAD$ равен $37^\\circ$. Найдите угол $ABC$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/3CF402_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "98",
   "steps": [
    "Вписанные углы $CAD$ и $CBD$ опираются на одну дугу $CD$ — они равны.",
    "$$\\angle ABC = \\angle ABD + \\angle DBC = 61^\\circ + 37^\\circ = 98^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.8CB50E",
   "group": "circle",
   "fipi": "8CB50E",
   "text": "Отрезки $AC$ и $BD$ — диаметры окружности с центром $O$. Угол $ACB$ равен $59^\\circ$. Найдите угол $AOD$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/8CB50E_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "62",
   "steps": [
    "Вписанный угол $ACB$ опирается на дугу $AB$, центральный $AOB = 2 \\cdot 59^\\circ = 118^\\circ$.",
    "Углы $AOB$ и $AOD$ смежные: $$180^\\circ - 118^\\circ = 62^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.79D7B4",
   "group": "circle",
   "fipi": "79D7B4",
   "text": "Два угла вписанного в окружность четырёхугольника равны $59^\\circ$ и $102^\\circ$. Найдите бо́льший из оставшихся углов. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/79D7B4_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "121",
   "steps": [
    "Сумма противоположных углов вписанного четырёхугольника равна $180^\\circ$, поэтому оставшиеся углы:",
    "$$180^\\circ - 59^\\circ = 121^\\circ$$ $$180^\\circ - 102^\\circ = 78^\\circ$$",
    "Больший из них $121^\\circ$."
   ]
  },
  {
   "id": "1.fipi.732EBF",
   "group": "circle",
   "fipi": "732EBF",
   "text": "Четырёхугольник $ABCD$ вписан в окружность. Угол $ABC$ равен $120^\\circ$, угол $ABD$ равен $43^\\circ$. Найдите угол $CAD$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/732EBF_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "77",
   "steps": [
    "Вписанные углы $CAD$ и $CBD$ опираются на одну дугу $CD$ — они равны.",
    "$$\\angle CAD = \\angle CBD = \\angle ABC - \\angle ABD = 120^\\circ - 43^\\circ = 77^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.BC72B9",
   "group": "circle",
   "fipi": "BC72B9",
   "text": "Отрезки $AC$ и $BD$ — диаметры окружности с центром $O$. Угол $AOD$ равен $16^\\circ$. Найдите вписанный угол $ACB$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/BC72B9_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "82",
   "steps": [
    "Смежный с $AOD$ центральный угол $AOB = 180^\\circ - 16^\\circ = 164^\\circ$.",
    "Вписанный угол $ACB$ опирается на ту же дугу $AB$ — он вдвое меньше: $$164^\\circ : 2 = 82^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.9C6FBB",
   "group": "circle",
   "fipi": "9C6FBB",
   "text": "Четырёхугольник $ABCD$ вписан в окружность. Угол $ABC$ равен $98^\\circ$, угол $CAD$ равен $44^\\circ$. Найдите угол $ABD$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/9C6FBB_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "54",
   "steps": [
    "Вписанные углы $CAD$ и $CBD$ опираются на одну дугу $CD$ — они равны.",
    "$$\\angle ABD = \\angle ABC - \\angle CBD = 98^\\circ - 44^\\circ = 54^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.CE4D1D",
   "group": "circle",
   "fipi": "CE4D1D",
   "text": "Четырёхугольник $ABCD$ вписан в окружность. Угол $BAD$ равен $136^\\circ$. Найдите угол $BCD$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/CE4D1D_1.gif\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "44",
   "steps": [
    "Сумма противоположных углов вписанного четырёхугольника равна $180^\\circ$: $$180^\\circ - 136^\\circ = 44^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.6C9E2A",
   "group": "circle",
   "fipi": "6C9E2A",
   "text": "Четырёхугольник $ABCD$ вписан в окружность. Угол $ABD$ равен $62^\\circ$, угол $CAD$ равен $41^\\circ$. Найдите угол $ABC$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/6C9E2A_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "103",
   "steps": [
    "Вписанные углы $CAD$ и $CBD$ опираются на одну дугу $CD$ — они равны.",
    "$$\\angle ABC = \\angle ABD + \\angle DBC = 62^\\circ + 41^\\circ = 103^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.907C53",
   "group": "circle",
   "fipi": "907C53",
   "text": "Найдите центральный угол, если он на $28^\\circ$ больше острого вписанного угла, опирающегося на ту же дугу. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/907C53_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "56",
   "steps": [
    "Центральный угол вдвое больше вписанного, опирающегося на ту же дугу: если вписанный $x$, центральный $2x$.",
    "$$2x - x = 28$$ $$x = 28$$ Центральный угол: $2 \\cdot 28 = 56^\\circ$."
   ]
  },
  {
   "id": "1.fipi.FDDACE",
   "group": "circle",
   "fipi": "FDDACE",
   "text": "Отрезки $AC$ и $BD$ — диаметры окружности с центром $O$. Угол $ACB$ равен $32^\\circ$. Найдите угол $AOD$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/FDDACE_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "116",
   "steps": [
    "Вписанный угол $ACB$ опирается на дугу $AB$, центральный $AOB = 2 \\cdot 32^\\circ = 64^\\circ$.",
    "Углы $AOB$ и $AOD$ смежные: $$180^\\circ - 64^\\circ = 116^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.A9DCC5",
   "group": "circle",
   "fipi": "A9DCC5",
   "text": "Два угла вписанного в окружность четырёхугольника равны $99^\\circ$ и $117^\\circ$. Найдите бо́льший из оставшихся углов. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/A9DCC5_1.gif\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "81",
   "steps": [
    "Сумма противоположных углов вписанного четырёхугольника равна $180^\\circ$, поэтому оставшиеся углы:",
    "$$180^\\circ - 99^\\circ = 81^\\circ$$ $$180^\\circ - 117^\\circ = 63^\\circ$$",
    "Больший из них $81^\\circ$."
   ]
  },
  {
   "id": "1.fipi.FFE399",
   "group": "circle",
   "fipi": "FFE399",
   "text": "Отрезки $AC$ и $BD$ — диаметры окружности с центром $O$. Угол $ACB$ равен $61^\\circ$. Найдите угол $AOD$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/FFE399_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "58",
   "steps": [
    "Вписанный угол $ACB$ опирается на дугу $AB$, центральный $AOB = 2 \\cdot 61^\\circ = 122^\\circ$.",
    "Углы $AOB$ и $AOD$ смежные: $$180^\\circ - 122^\\circ = 58^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.CC7A9E",
   "group": "circle",
   "fipi": "CC7A9E",
   "text": "Угол $ACO$ равен $57^\\circ$. Его сторона $CA$ касается окружности с центром в точке $O$. Отрезок $CO$ пересекает окружность в точке $B$ (см. рисунок). Найдите градусную меру дуги $AB$ окружности, заключённой внутри этого угла. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/CC7A9E_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "33",
   "steps": [
    "Радиус $OA$ перпендикулярен касательной, поэтому $$\\angle AOC = 90^\\circ - 57^\\circ = 33^\\circ$$",
    "Дуга $AB$ равна центральному углу: $33^\\circ$."
   ]
  },
  {
   "id": "1.fipi.0005E9",
   "group": "circle",
   "fipi": "0005E9",
   "text": "Найдите угол $ACO$, если его сторона $CA$ касается окружности с центром $O$, отрезок $CO$ пересекает окружность в точке $B$ (см. рис.), а дуга $AB$ окружности, заключённая внутри этого угла, равна $17^\\circ$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/0005E9_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "73",
   "steps": [
    "Радиус $OA$ перпендикулярен касательной: $\\angle OAC = 90^\\circ$. Центральный угол $AOB$ равен дуге: $17^\\circ$.",
    "$$\\angle ACO = 90^\\circ - 17^\\circ = 73^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.30B4E7",
   "group": "circle",
   "fipi": "30B4E7",
   "text": "Центральный угол на $32^\\circ$ больше острого вписанного угла, опирающегося на ту же дугу окружности. Найдите вписанный угол. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/30B4E7_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "32",
   "steps": [
    "Центральный угол вдвое больше вписанного, опирающегося на ту же дугу: если вписанный $x$, центральный $2x$.",
    "$$2x - x = 32$$ $$x = 32$$"
   ]
  },
  {
   "id": "1.fipi.01BE6F",
   "group": "circle",
   "fipi": "01BE6F",
   "text": "Найдите величину центрального угла, если он на $69^\\circ$ больше острого вписанного угла, опирающегося на ту же дугу. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/01BE6F_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "138",
   "steps": [
    "Центральный угол вдвое больше вписанного, опирающегося на ту же дугу: если вписанный $x$, центральный $2x$.",
    "$$2x - x = 69$$ $$x = 69$$ Центральный угол: $2 \\cdot 69 = 138^\\circ$."
   ]
  },
  {
   "id": "1.fipi.AD5F64",
   "group": "circle",
   "fipi": "AD5F64",
   "text": "Отрезки $AC$ и $BD$ — диаметры окружности с центром $O$. Угол $AOD$ равен $114^\\circ$. Найдите величину вписанного угла $ACB$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/AD5F64_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "33",
   "steps": [
    "Смежный с $AOD$ центральный угол $AOB = 180^\\circ - 114^\\circ = 66^\\circ$.",
    "Вписанный угол $ACB$ опирается на ту же дугу $AB$ — он вдвое меньше: $$66^\\circ : 2 = 33^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.9B7E69",
   "group": "circle",
   "fipi": "9B7E69",
   "text": "Отрезки $AC$ и $BD$ — диаметры окружности с центром $O$. Угол $AOD$ равен $130^\\circ$. Найдите вписанный угол $ACB$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/9B7E69_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "25",
   "steps": [
    "Смежный с $AOD$ центральный угол $AOB = 180^\\circ - 130^\\circ = 50^\\circ$.",
    "Вписанный угол $ACB$ опирается на ту же дугу $AB$ — он вдвое меньше: $$50^\\circ : 2 = 25^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.3D4E60",
   "group": "circle",
   "fipi": "3D4E60",
   "text": "Центральный угол на $29^\\circ$ больше острого вписанного угла, опирающегося на ту же дугу окружности. Найдите величину вписанного угла. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/3D4E60_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "29",
   "steps": [
    "Центральный угол вдвое больше вписанного, опирающегося на ту же дугу: если вписанный $x$, центральный $2x$.",
    "$$2x - x = 29$$ $$x = 29$$"
   ]
  },
  {
   "id": "1.fipi.D7423F",
   "group": "circle",
   "fipi": "D7423F",
   "text": "Четырёхугольник $ABCD$ вписан в окружность. Угол $ABD$ равен $58^\\circ$, угол $CAD$ равен $39^\\circ$. Найдите угол $ABC$. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/D7423F_1.gif\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "97",
   "steps": [
    "Вписанные углы $CAD$ и $CBD$ опираются на одну дугу $CD$ — они равны.",
    "$$\\angle ABC = \\angle ABD + \\angle DBC = 58^\\circ + 39^\\circ = 97^\\circ$$"
   ]
  },
  {
   "id": "1.fipi.21628C",
   "group": "circle",
   "fipi": "21628C",
   "text": "Угол $ACO$ равен $62^\\circ$. Его сторона $CA$ касается окружности с центром в точке $O$. Отрезок $CO$ пересекает окружность в точке $B$ (см. рис.). Найдите градусную меру дуги $AB$ окружности, заключённой внутри этого угла. Ответ дайте в градусах.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/21628C_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "28",
   "steps": [
    "Радиус $OA$ перпендикулярен касательной, поэтому $$\\angle AOC = 90^\\circ - 62^\\circ = 28^\\circ$$",
    "Дуга $AB$ равна центральному углу: $28^\\circ$."
   ]
  },
  {
   "id": "1.fipi.B77903",
   "group": "quad",
   "fipi": "B77903",
   "text": "В четырёхугольник $ABCD$, периметр которого равен 24, вписана окружность, $AB = 5$. Найдите длину стороны $CD$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/B77903_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "7",
   "steps": [
    "В описанном четырёхугольнике суммы противоположных сторон равны: $AB + CD = BC + AD$.",
    "$$AB + CD = 24 : 2 = 12$$ $$CD = 12 - 5 = 7$$"
   ]
  },
  {
   "id": "1.fipi.AAB5B7",
   "group": "quad",
   "fipi": "AAB5B7",
   "text": "В четырёхугольник $ABCD$ вписана окружность, $AB = 14$, $CD = 17$. Найдите периметр четырёхугольника $ABCD$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/AAB5B7_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "62",
   "steps": [
    "В описанном четырёхугольнике суммы противоположных сторон равны: $AB + CD = BC + AD$.",
    "$$P = 2(AB + CD) = 2 \\cdot (14 + 17) = 62$$"
   ]
  },
  {
   "id": "1.fipi.Dec61F",
   "group": "quad",
   "fipi": "Dec61F",
   "text": "В четырёхугольник $ABCD$ вписана окружность, $AB = 9$, $CD = 17$. Найдите периметр четырёхугольника $ABCD$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/Dec61F_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "52",
   "steps": [
    "В описанном четырёхугольнике суммы противоположных сторон равны: $AB + CD = BC + AD$.",
    "$$P = 2(AB + CD) = 2 \\cdot (9 + 17) = 52$$"
   ]
  },
  {
   "id": "1.fipi.4e31DD",
   "group": "quad",
   "fipi": "4e31DD",
   "text": "В четырёхугольник $ABCD$ вписана окружность, $AB = 6$, $BC = 4$, $CD = 9$. Найдите длину четвёртой стороны четырёхугольника.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/4e31DD_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "11",
   "steps": [
    "В описанном четырёхугольнике суммы противоположных сторон равны: $AB + CD = BC + AD$.",
    "$$AD = 6 + 9 - 4 = 11$$"
   ]
  },
  {
   "id": "1.fipi.2AcFD0",
   "group": "quad",
   "fipi": "2AcFD0",
   "text": "В четырёхугольник $ABCD$, периметр которого равен 22, вписана окружность, $AB = 8$. Найдите длину стороны $CD$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/2AcFD0_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "3",
   "steps": [
    "В описанном четырёхугольнике суммы противоположных сторон равны: $AB + CD = BC + AD$.",
    "$$AB + CD = 22 : 2 = 11$$ $$CD = 11 - 8 = 3$$"
   ]
  },
  {
   "id": "1.fipi.485B9F",
   "group": "quad",
   "fipi": "485B9F",
   "text": "В четырёхугольник $ABCD$ вписана окружность, $AB = 10$, $BC = 6$, $CD = 15$. Найдите длину четвёртой стороны четырёхугольника.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/485B9F_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "19",
   "steps": [
    "В описанном четырёхугольнике суммы противоположных сторон равны: $AB + CD = BC + AD$.",
    "$$AD = 10 + 15 - 6 = 19$$"
   ]
  },
  {
   "id": "1.fipi.59978F",
   "group": "quad",
   "fipi": "59978F",
   "text": "В четырёхугольник $ABCD$ вписана окружность, $AB = 10$, $CD = 17$. Найдите периметр четырёхугольника $ABCD$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/59978F_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "54",
   "steps": [
    "В описанном четырёхугольнике суммы противоположных сторон равны: $AB + CD = BC + AD$.",
    "$$P = 2(AB + CD) = 2 \\cdot (10 + 17) = 54$$"
   ]
  },
  {
   "id": "1.fipi.eA748e",
   "group": "quad",
   "fipi": "eA748e",
   "text": "В четырёхугольник $ABCD$, периметр которого равен 30, вписана окружность, $AB = 9$. Найдите длину стороны $CD$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/eA748e_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "6",
   "steps": [
    "В описанном четырёхугольнике суммы противоположных сторон равны: $AB + CD = BC + AD$.",
    "$$AB + CD = 30 : 2 = 15$$ $$CD = 15 - 9 = 6$$"
   ]
  },
  {
   "id": "1.fipi.F12D1C",
   "group": "area",
   "fipi": "F12D1C",
   "text": "Площадь параллелограмма $ABCD$ равна 28. Точка $E$ — середина стороны $AD$. Найдите площадь трапеции $BCDE$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/F12D1C_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "21",
   "steps": [
    "$S_{ABE} = \\dfrac{1}{2} \\cdot AE \\cdot h = \\dfrac{1}{4} \\cdot 28 = 7$ (основание $AE$ — половина $AD$).",
    "$$S_{BCDE} = 28 - 7 = 21$$"
   ]
  },
  {
   "id": "1.fipi.5B3F1A",
   "group": "area",
   "fipi": "5B3F1A",
   "text": "Площадь треугольника $ABC$ равна 24, $DE$ — средняя линия, параллельная стороне $AB$. Найдите площадь трапеции $ABED$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/5B3F1A_1.gif\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "18",
   "steps": [
    "Треугольник $CDE$ подобен $ABC$ с коэффициентом $\\dfrac{1}{2}$, площадь — в $4$ раза меньше:",
    "$$S_{CDE} = 24 : 4 = 6$$ $$S_{ABED} = 24 - 6 = 18$$"
   ]
  },
  {
   "id": "1.fipi.282EDC",
   "group": "area",
   "fipi": "282EDC",
   "text": "Площадь параллелограмма $ABCD$ равна 24. Точка $E$ — середина стороны $AD$. Найдите площадь трапеции $BCDE$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/282EDC_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "18",
   "steps": [
    "$S_{ABE} = \\dfrac{1}{2} \\cdot AE \\cdot h = \\dfrac{1}{4} \\cdot 24 = 6$ (основание $AE$ — половина $AD$).",
    "$$S_{BCDE} = 24 - 6 = 18$$"
   ]
  },
  {
   "id": "1.fipi.3B5E5D",
   "group": "area",
   "fipi": "3B5E5D",
   "text": "Две стороны треугольника равны 15 и 18. Высота, опущенная на бо́льшую из этих сторон, равна 10. Найдите длину высоты, опущенной на меньшую из этих сторон треугольника.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/3B5E5D_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "12",
   "steps": [
    "Площадь треугольника можно найти через любую сторону и высоту к ней:",
    "$$15 \\cdot h = 18 \\cdot 10$$ $$h = 12$$"
   ]
  },
  {
   "id": "1.fipi.CA58AE",
   "group": "area",
   "fipi": "CA58AE",
   "text": "Две стороны треугольника равны 21 и 28. Высота, опущенная на бо́льшую из этих сторон, равна 15. Найдите высоту, опущенную на меньшую из этих сторон треугольника.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/CA58AE_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "20",
   "steps": [
    "Площадь треугольника можно найти через любую сторону и высоту к ней:",
    "$$21 \\cdot h = 28 \\cdot 15$$ $$h = 20$$"
   ]
  },
  {
   "id": "1.fipi.697AC9",
   "group": "area",
   "fipi": "697AC9",
   "text": "Стороны параллелограмма равны 18 и 20. Высота, опущенная на меньшую из этих сторон, равна 10. Найдите длину высоты, опущенной на бо́льшую сторону параллелограмма.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/697AC9_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "9",
   "steps": [
    "Площадь параллелограмма — сторона на высоту к ней, через любую сторону:",
    "$$20 \\cdot h = 18 \\cdot 10$$ $$h = 9$$"
   ]
  },
  {
   "id": "1.fipi.F34697",
   "group": "area",
   "fipi": "F34697",
   "text": "Площадь треугольника $ABC$ равна 24, $DE$ — средняя линия, параллельная стороне $AB$. Найдите площадь треугольника $CDE$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/F34697_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "6",
   "steps": [
    "Треугольник $CDE$ подобен $ABC$ с коэффициентом $\\dfrac{1}{2}$, площадь — в $4$ раза меньше:",
    "$$S_{CDE} = 24 : 4 = 6$$"
   ]
  },
  {
   "id": "1.fipi.DF24E0",
   "group": "area",
   "fipi": "DF24E0",
   "text": "Стороны параллелограмма равны 24 и 27. Высота, опущенная на меньшую из этих сторон, равна 18. Найдите высоту, опущенную на бо́льшую сторону параллелограмма.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/DF24E0_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "16",
   "steps": [
    "Площадь параллелограмма — сторона на высоту к ней, через любую сторону:",
    "$$27 \\cdot h = 24 \\cdot 18$$ $$h = 16$$"
   ]
  },
  {
   "id": "1.fipi.B3E586",
   "group": "area",
   "fipi": "B3E586",
   "text": "Площадь параллелограмма $ABCD$ равна 60. Точка $E$ — середина стороны $AD$. Найдите площадь треугольника $ABE$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/B3E586_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "15",
   "steps": [
    "Треугольник $ABE$ и параллелограмм имеют общую высоту, а основание $AE$ — половина $AD$:",
    "$$S_{ABE} = \\dfrac{1}{2} \\cdot \\dfrac{1}{2} \\cdot 60 = 15$$"
   ]
  },
  {
   "id": "1.fipi.EE7C83",
   "group": "area",
   "fipi": "EE7C83",
   "text": "Площадь треугольника $ABC$ равна 60, $DE$ — средняя линия, параллельная стороне $AB$. Найдите площадь трапеции $ABED$.<div class=\"ege-fig\"><img src=\"ege-prof-fipi-img/EE7C83_1.png\" alt=\"Рисунок к заданию\" style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;background:#fff;border-radius:6px;padding:4px;box-sizing:border-box\"></div>",
   "answer": "45",
   "steps": [
    "Треугольник $CDE$ подобен $ABC$ с коэффициентом $\\dfrac{1}{2}$, площадь — в $4$ раза меньше:",
    "$$S_{CDE} = 60 : 4 = 15$$ $$S_{ABED} = 60 - 15 = 45$$"
   ]
  }
 ]
};
