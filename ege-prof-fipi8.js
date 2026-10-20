/* ege-prof-fipi8.js — задания ЕГЭ профиль №8 из открытого банка ФИПИ.
   Собирается скриптом (fipi-pilot/tools/ege/export.py), руками не правится.
   Грузится страницей ege_prof.html только когда открыт этот номер (ensureFipi);
   формат и происхождение — в оглавлении ege-prof-fipi.js. */
(window.EGE_PROF_FIPI = window.EGE_PROF_FIPI || { tasks: {} }).tasks['8'] = {
 "sections": [
  {
   "id": "trig",
   "title": "Тригонометрия"
  },
  {
   "id": "alg",
   "title": "Логарифмы, степени, корни"
  }
 ],
 "groups": [
  {
   "id": "trig_deg",
   "section": "trig",
   "title": "Формулы приведения и синус двойного угла (градусы)",
   "hint": "$\\sin(90^\\circ - x) = \\cos x$, $\\cos(90^\\circ - x) = \\sin x$, $2\\sin x\\cos x = \\sin 2x$ — числитель и знаменатель становятся одинаковыми."
  },
  {
   "id": "trig_double",
   "section": "trig",
   "title": "Двойной угол: $\\cos^2$, $\\sin^2$, $\\sin \\cdot \\cos$",
   "hint": "$\\cos^2x - \\sin^2x = 2\\cos^2 x - 1 = 1 - 2\\sin^2 x = \\cos 2x$, $2\\sin x\\cos x = \\sin 2x$. Двойной угол — табличный."
  },
  {
   "id": "trig_value",
   "section": "trig",
   "title": "Значения тригонометрических функций",
   "hint": "Табличные значения; если дан синус или косинус — основное тождество $\\sin^2\\alpha + \\cos^2\\alpha = 1$ и знак по четверти."
  },
  {
   "id": "log",
   "section": "alg",
   "title": "Логарифмы",
   "hint": "$\\log_a b + \\log_a c = \\log_a bc$, $\\log_a b - \\log_a c = \\log_a \\dfrac{b}{c}$, $\\dfrac{\\log_c b}{\\log_c a} = \\log_a b$, $\\log_a a^k = k$."
  },
  {
   "id": "power",
   "section": "alg",
   "title": "Степени",
   "hint": "Приведите к одному основанию: при умножении показатели складываются, при делении вычитаются, при возведении в степень перемножаются."
  },
  {
   "id": "root",
   "section": "alg",
   "title": "Корни",
   "hint": "Корни одной степени перемножаются под одним знаком; корни разных степеней удобно записать степенями с дробным показателем."
  }
 ],
 "protos": [
  {
   "id": "8.fipi.2D494A",
   "group": "trig_deg",
   "fipi": "2D494A",
   "text": "Найдите значение выражения $\\dfrac{2\\sin 136^\\circ}{\\sin 68^\\circ \\cdot \\sin 22^\\circ}$.",
   "answer": "4",
   "steps": [
    "Формула приведения: $$\\sin 22^\\circ = \\sin(90^\\circ - 68^\\circ) = \\cos 68^\\circ$$",
    "Синус двойного угла: $$\\sin 68^\\circ \\cdot \\cos 68^\\circ = \\dfrac{1}{2}\\sin 136^\\circ$$",
    "$$\\dfrac{2\\sin 136^\\circ}{\\dfrac{1}{2}\\sin 136^\\circ} = 4$$"
   ]
  },
  {
   "id": "8.fipi.76A1FD",
   "group": "trig_deg",
   "fipi": "76A1FD",
   "text": "Найдите значение выражения $\\dfrac{14\\sin 51^\\circ \\cdot \\cos 51^\\circ}{\\sin 102^\\circ}$.",
   "answer": "7",
   "steps": [
    "Синус двойного угла: $$\\sin 51^\\circ \\cdot \\cos 51^\\circ = \\dfrac{1}{2}\\sin 102^\\circ$$",
    "$$\\dfrac{14 \\cdot \\dfrac{1}{2}\\sin 102^\\circ}{\\sin 102^\\circ} = 7$$"
   ]
  },
  {
   "id": "8.fipi.9945B8",
   "group": "trig_deg",
   "fipi": "9945B8",
   "text": "Найдите значение выражения $\\dfrac{4\\sin 41^\\circ \\cdot \\cos 41^\\circ}{\\sin 82^\\circ}$.",
   "answer": "2",
   "steps": [
    "Синус двойного угла: $$\\sin 41^\\circ \\cdot \\cos 41^\\circ = \\dfrac{1}{2}\\sin 82^\\circ$$",
    "$$\\dfrac{4 \\cdot \\dfrac{1}{2}\\sin 82^\\circ}{\\sin 82^\\circ} = 2$$"
   ]
  },
  {
   "id": "8.fipi.24F9AF",
   "group": "trig_deg",
   "fipi": "24F9AF",
   "text": "Найдите значение выражения $\\dfrac{8\\sin 64^\\circ \\cdot \\cos 64^\\circ}{\\sin 128^\\circ}$.",
   "answer": "4",
   "steps": [
    "Синус двойного угла: $$\\sin 64^\\circ \\cdot \\cos 64^\\circ = \\dfrac{1}{2}\\sin 128^\\circ$$",
    "$$\\dfrac{8 \\cdot \\dfrac{1}{2}\\sin 128^\\circ}{\\sin 128^\\circ} = 4$$"
   ]
  },
  {
   "id": "8.fipi.223ec5",
   "group": "trig_deg",
   "fipi": "223ec5",
   "text": "Найдите значение выражения $\\dfrac{8\\sin 82^\\circ \\cdot \\cos 82^\\circ}{\\sin 164^\\circ}$.",
   "answer": "4",
   "steps": [
    "Синус двойного угла: $$\\sin 82^\\circ \\cdot \\cos 82^\\circ = \\dfrac{1}{2}\\sin 164^\\circ$$",
    "$$\\dfrac{8 \\cdot \\dfrac{1}{2}\\sin 164^\\circ}{\\sin 164^\\circ} = 4$$"
   ]
  },
  {
   "id": "8.fipi.DcF3c4",
   "group": "trig_deg",
   "fipi": "DcF3c4",
   "text": "Найдите значение выражения $\\dfrac{2\\sin 70^\\circ}{\\cos 35^\\circ \\cdot \\cos 55^\\circ}$.",
   "answer": "4",
   "steps": [
    "Формула приведения: $$\\cos 55^\\circ = \\cos(90^\\circ - 35^\\circ) = \\sin 35^\\circ$$",
    "Синус двойного угла: $$\\sin 35^\\circ \\cdot \\cos 35^\\circ = \\dfrac{1}{2}\\sin 70^\\circ$$",
    "$$\\dfrac{2\\sin 70^\\circ}{\\dfrac{1}{2}\\sin 70^\\circ} = 4$$"
   ]
  },
  {
   "id": "8.fipi.10c0e6",
   "group": "trig_deg",
   "fipi": "10c0e6",
   "text": "Найдите значение выражения $\\dfrac{4\\sin 154^\\circ}{\\sin 77^\\circ \\cdot \\sin 13^\\circ}$.",
   "answer": "8",
   "steps": [
    "Формула приведения: $$\\sin 13^\\circ = \\sin(90^\\circ - 77^\\circ) = \\cos 77^\\circ$$",
    "Синус двойного угла: $$\\sin 77^\\circ \\cdot \\cos 77^\\circ = \\dfrac{1}{2}\\sin 154^\\circ$$",
    "$$\\dfrac{4\\sin 154^\\circ}{\\dfrac{1}{2}\\sin 154^\\circ} = 8$$"
   ]
  },
  {
   "id": "8.fipi.8F25eA",
   "group": "trig_deg",
   "fipi": "8F25eA",
   "text": "Найдите значение выражения $\\dfrac{10\\sin 72^\\circ \\cdot \\cos 72^\\circ}{\\sin 144^\\circ}$.",
   "answer": "5",
   "steps": [
    "Синус двойного угла: $$\\sin 72^\\circ \\cdot \\cos 72^\\circ = \\dfrac{1}{2}\\sin 144^\\circ$$",
    "$$\\dfrac{10 \\cdot \\dfrac{1}{2}\\sin 144^\\circ}{\\sin 144^\\circ} = 5$$"
   ]
  },
  {
   "id": "8.fipi.042F86",
   "group": "trig_deg",
   "fipi": "042F86",
   "text": "Найдите значение выражения $\\dfrac{3\\sin 68^\\circ}{\\cos 34^\\circ \\cdot \\cos 56^\\circ}$.",
   "answer": "6",
   "steps": [
    "Формула приведения: $$\\cos 56^\\circ = \\cos(90^\\circ - 34^\\circ) = \\sin 34^\\circ$$",
    "Синус двойного угла: $$\\sin 34^\\circ \\cdot \\cos 34^\\circ = \\dfrac{1}{2}\\sin 68^\\circ$$",
    "$$\\dfrac{3\\sin 68^\\circ}{\\dfrac{1}{2}\\sin 68^\\circ} = 6$$"
   ]
  },
  {
   "id": "8.fipi.83B485",
   "group": "trig_deg",
   "fipi": "83B485",
   "text": "Найдите значение выражения $\\dfrac{3\\sin 164^\\circ}{\\sin 82^\\circ \\cdot \\sin 8^\\circ}$.",
   "answer": "6",
   "steps": [
    "Формула приведения: $$\\sin 8^\\circ = \\sin(90^\\circ - 82^\\circ) = \\cos 82^\\circ$$",
    "Синус двойного угла: $$\\sin 82^\\circ \\cdot \\cos 82^\\circ = \\dfrac{1}{2}\\sin 164^\\circ$$",
    "$$\\dfrac{3\\sin 164^\\circ}{\\dfrac{1}{2}\\sin 164^\\circ} = 6$$"
   ]
  },
  {
   "id": "8.fipi.133372",
   "group": "trig_double",
   "fipi": "133372",
   "text": "Найдите значение выражения $2\\sqrt{3}\\cos^{2} \\dfrac{13\\pi}{12} - \\sqrt{3}$.",
   "answer": "1,5",
   "steps": [
    "$\\cos^2 x = \\dfrac{1 + \\cos 2x}{2}$, поэтому $2\\cos^2 x - 1 = \\cos 2x$.",
    "$$2\\sqrt{3}\\cos^{2} \\dfrac{13\\pi}{12} - \\sqrt{3} = \\sqrt{3}\\left(2\\cos^{2} \\dfrac{13\\pi}{12} - 1\\right) = \\sqrt{3}\\cos \\dfrac{13\\pi}{6}$$",
    "$$\\cos \\dfrac{13\\pi}{6} = \\cos \\dfrac{\\pi}{6} = \\dfrac{\\sqrt{3}}{2}$$ $$\\sqrt{3} \\cdot \\dfrac{\\sqrt{3}}{2} = 1{,}5$$"
   ]
  },
  {
   "id": "8.fipi.23C8BB",
   "group": "trig_double",
   "fipi": "23C8BB",
   "text": "Найдите значение выражения $4\\sqrt{2} - 8\\sqrt{2}\\sin^{2} \\dfrac{7\\pi}{8}$.",
   "answer": "4",
   "steps": [
    "$1 - 2\\sin^2 x = \\cos 2x$.",
    "$$4\\sqrt{2} - 8\\sqrt{2}\\sin^{2} \\dfrac{7\\pi}{8} = 4\\sqrt{2}\\left(1 - 2\\sin^{2} \\dfrac{7\\pi}{8}\\right) = 4\\sqrt{2}\\cos \\dfrac{7\\pi}{4}$$",
    "$$\\cos \\dfrac{7\\pi}{4} = \\dfrac{\\sqrt{2}}{2}$$ $$4\\sqrt{2} \\cdot \\dfrac{\\sqrt{2}}{2} = 4$$"
   ]
  },
  {
   "id": "8.fipi.9302BE",
   "group": "trig_double",
   "fipi": "9302BE",
   "text": "Найдите значение выражения $6\\sqrt{3}\\cos^{2} \\dfrac{11\\pi}{12} - 3\\sqrt{3}$.",
   "answer": "4,5",
   "steps": [
    "$\\cos^2 x = \\dfrac{1 + \\cos 2x}{2}$, поэтому $2\\cos^2 x - 1 = \\cos 2x$.",
    "$$6\\sqrt{3}\\cos^{2} \\dfrac{11\\pi}{12} - 3\\sqrt{3} = 3\\sqrt{3}\\left(2\\cos^{2} \\dfrac{11\\pi}{12} - 1\\right) = 3\\sqrt{3}\\cos \\dfrac{11\\pi}{6}$$",
    "$$\\cos \\dfrac{11\\pi}{6} = \\dfrac{\\sqrt{3}}{2}$$ $$3\\sqrt{3} \\cdot \\dfrac{\\sqrt{3}}{2} = 4{,}5$$"
   ]
  },
  {
   "id": "8.fipi.818625",
   "group": "trig_double",
   "fipi": "818625",
   "text": "Найдите значение выражения $4\\sqrt{3}\\cos^{2} \\dfrac{23\\pi}{12} - 4\\sqrt{3}\\sin^{2} \\dfrac{23\\pi}{12}$.",
   "answer": "6",
   "steps": [
    "Косинус двойного угла: $\\cos^2 x - \\sin^2 x = \\cos 2x$.",
    "$$4\\sqrt{3}\\left(\\cos^{2} \\dfrac{23\\pi}{12} - \\sin^{2} \\dfrac{23\\pi}{12}\\right) = 4\\sqrt{3}\\cos \\dfrac{23\\pi}{6}$$",
    "$$\\cos \\dfrac{23\\pi}{6} = \\cos \\dfrac{11\\pi}{6} = \\dfrac{\\sqrt{3}}{2}$$ $$4\\sqrt{3} \\cdot \\dfrac{\\sqrt{3}}{2} = 6$$"
   ]
  },
  {
   "id": "8.fipi.0444D9",
   "group": "trig_double",
   "fipi": "0444D9",
   "text": "Найдите значение выражения $5\\sqrt{2}\\sin \\dfrac{3\\pi}{8} \\cdot \\cos \\dfrac{3\\pi}{8}$.",
   "answer": "2,5",
   "steps": [
    "Синус двойного угла: $\\sin x \\cos x = \\dfrac{1}{2}\\sin 2x$.",
    "$$5\\sqrt{2}\\sin \\dfrac{3\\pi}{8} \\cdot \\cos \\dfrac{3\\pi}{8} = \\dfrac{5\\sqrt{2}}{2}\\sin \\dfrac{3\\pi}{4}$$",
    "$$\\sin \\dfrac{3\\pi}{4} = \\dfrac{\\sqrt{2}}{2}$$ $$\\dfrac{5\\sqrt{2}}{2} \\cdot \\dfrac{\\sqrt{2}}{2} = 2{,}5$$"
   ]
  },
  {
   "id": "8.fipi.7E8850",
   "group": "trig_double",
   "fipi": "7E8850",
   "text": "Найдите значение выражения $3\\sqrt{3} - 6\\sqrt{3}\\sin^{2} \\dfrac{13\\pi}{12}$.",
   "answer": "4,5",
   "steps": [
    "$1 - 2\\sin^2 x = \\cos 2x$.",
    "$$3\\sqrt{3} - 6\\sqrt{3}\\sin^{2} \\dfrac{13\\pi}{12} = 3\\sqrt{3}\\left(1 - 2\\sin^{2} \\dfrac{13\\pi}{12}\\right) = 3\\sqrt{3}\\cos \\dfrac{13\\pi}{6}$$",
    "$$\\cos \\dfrac{13\\pi}{6} = \\cos \\dfrac{\\pi}{6} = \\dfrac{\\sqrt{3}}{2}$$ $$3\\sqrt{3} \\cdot \\dfrac{\\sqrt{3}}{2} = 4{,}5$$"
   ]
  },
  {
   "id": "8.fipi.e09A5B",
   "group": "trig_double",
   "fipi": "e09A5B",
   "text": "Найдите значение выражения $8\\sqrt{3}\\cos^{2} \\dfrac{\\pi}{12} - 4\\sqrt{3}$.",
   "answer": "6",
   "steps": [
    "$\\cos^2 x = \\dfrac{1 + \\cos 2x}{2}$, поэтому $2\\cos^2 x - 1 = \\cos 2x$.",
    "$$8\\sqrt{3}\\cos^{2} \\dfrac{\\pi}{12} - 4\\sqrt{3} = 4\\sqrt{3}\\left(2\\cos^{2} \\dfrac{\\pi}{12} - 1\\right) = 4\\sqrt{3}\\cos \\dfrac{\\pi}{6}$$",
    "$$\\cos \\dfrac{\\pi}{6} = \\dfrac{\\sqrt{3}}{2}$$ $$4\\sqrt{3} \\cdot \\dfrac{\\sqrt{3}}{2} = 6$$"
   ]
  },
  {
   "id": "8.fipi.F6A6E0",
   "group": "trig_double",
   "fipi": "F6A6E0",
   "text": "Найдите значение выражения $3\\sin \\dfrac{13\\pi}{12} \\cdot \\cos \\dfrac{13\\pi}{12}$.",
   "answer": "0,75",
   "steps": [
    "Синус двойного угла: $\\sin x \\cos x = \\dfrac{1}{2}\\sin 2x$.",
    "$$3\\sin \\dfrac{13\\pi}{12} \\cdot \\cos \\dfrac{13\\pi}{12} = \\dfrac{3}{2}\\sin \\dfrac{13\\pi}{6}$$",
    "$$\\sin \\dfrac{13\\pi}{6} = \\sin \\dfrac{\\pi}{6} = \\dfrac{1}{2}$$ $$\\dfrac{3}{2} \\cdot \\dfrac{1}{2} = 0{,}75$$"
   ]
  },
  {
   "id": "8.fipi.A7C3EB",
   "group": "trig_double",
   "fipi": "A7C3EB",
   "text": "Найдите значение выражения $5\\sqrt{2}\\cos^{2} \\dfrac{7\\pi}{8} - 5\\sqrt{2}\\sin^{2} \\dfrac{7\\pi}{8}$.",
   "answer": "5",
   "steps": [
    "Косинус двойного угла: $\\cos^2 x - \\sin^2 x = \\cos 2x$.",
    "$$5\\sqrt{2}\\left(\\cos^{2} \\dfrac{7\\pi}{8} - \\sin^{2} \\dfrac{7\\pi}{8}\\right) = 5\\sqrt{2}\\cos \\dfrac{7\\pi}{4}$$",
    "$$\\cos \\dfrac{7\\pi}{4} = \\dfrac{\\sqrt{2}}{2}$$ $$5\\sqrt{2} \\cdot \\dfrac{\\sqrt{2}}{2} = 5$$"
   ]
  },
  {
   "id": "8.fipi.11A20A",
   "group": "trig_double",
   "fipi": "11A20A",
   "text": "Найдите значение выражения $\\sqrt{2}\\sin \\dfrac{7\\pi}{8} \\cdot \\cos \\dfrac{7\\pi}{8}$.",
   "answer": "-0,5",
   "steps": [
    "Синус двойного угла: $\\sin x \\cos x = \\dfrac{1}{2}\\sin 2x$.",
    "$$\\sqrt{2}\\sin \\dfrac{7\\pi}{8} \\cdot \\cos \\dfrac{7\\pi}{8} = \\dfrac{\\sqrt{2}}{2}\\sin \\dfrac{7\\pi}{4}$$",
    "$$\\sin \\dfrac{7\\pi}{4} = -\\dfrac{\\sqrt{2}}{2}$$ $$\\dfrac{\\sqrt{2}}{2} \\cdot \\left(-\\dfrac{\\sqrt{2}}{2}\\right) = -0{,}5$$"
   ]
  },
  {
   "id": "8.fipi.0DC0A0",
   "group": "trig_double",
   "fipi": "0DC0A0",
   "text": "Найдите значение выражения $\\sqrt{2} - 2\\sqrt{2}\\sin^{2} \\dfrac{15\\pi}{8}$.",
   "answer": "1",
   "steps": [
    "$1 - 2\\sin^2 x = \\cos 2x$.",
    "$$\\sqrt{2} - 2\\sqrt{2}\\sin^{2} \\dfrac{15\\pi}{8} = \\sqrt{2}\\left(1 - 2\\sin^{2} \\dfrac{15\\pi}{8}\\right) = \\sqrt{2}\\cos \\dfrac{15\\pi}{4}$$",
    "$$\\cos \\dfrac{15\\pi}{4} = \\cos \\dfrac{7\\pi}{4} = \\dfrac{\\sqrt{2}}{2}$$ $$\\sqrt{2} \\cdot \\dfrac{\\sqrt{2}}{2} = 1$$"
   ]
  },
  {
   "id": "8.fipi.A68E99",
   "group": "trig_double",
   "fipi": "A68E99",
   "text": "Найдите значение выражения $3\\sqrt{2}\\cos^{2} \\dfrac{9\\pi}{8} - 3\\sqrt{2}\\sin^{2} \\dfrac{9\\pi}{8}$.",
   "answer": "3",
   "steps": [
    "Косинус двойного угла: $\\cos^2 x - \\sin^2 x = \\cos 2x$.",
    "$$3\\sqrt{2}\\left(\\cos^{2} \\dfrac{9\\pi}{8} - \\sin^{2} \\dfrac{9\\pi}{8}\\right) = 3\\sqrt{2}\\cos \\dfrac{9\\pi}{4}$$",
    "$$\\cos \\dfrac{9\\pi}{4} = \\cos \\dfrac{\\pi}{4} = \\dfrac{\\sqrt{2}}{2}$$ $$3\\sqrt{2} \\cdot \\dfrac{\\sqrt{2}}{2} = 3$$"
   ]
  },
  {
   "id": "8.fipi.E74193",
   "group": "trig_value",
   "fipi": "E74193",
   "text": "Найдите значение выражения $6\\cos 2\\alpha$, если $\\sin \\alpha = -0{,}8$.",
   "answer": "-1,68",
   "steps": [
    "$\\cos 2\\alpha = 1 - 2\\sin^2\\alpha$:",
    "$$6\\left(1 - 2 \\cdot (-0{,}8)^2\\right) = 6(1 - 1{,}28) = -1{,}68$$"
   ]
  },
  {
   "id": "8.fipi.F6158A",
   "group": "trig_value",
   "fipi": "F6158A",
   "text": "Найдите значение выражения $3\\cos 2\\alpha$, если $\\sin \\alpha = 0{,}2$.",
   "answer": "2,76",
   "steps": [
    "$\\cos 2\\alpha = 1 - 2\\sin^2\\alpha$:",
    "$$3\\left(1 - 2 \\cdot 0{,}2^2\\right) = 3 \\cdot 0{,}92 = 2{,}76$$"
   ]
  },
  {
   "id": "8.fipi.c1228A",
   "group": "trig_value",
   "fipi": "c1228A",
   "text": "Найдите значение выражения $\\operatorname{tg} \\alpha$, если $\\cos \\alpha = \\dfrac{5\\sqrt{26}}{26}$ и $\\alpha \\in\\left(0;\\, \\dfrac{\\pi}{2}\\right)$.",
   "answer": "0,2",
   "steps": [
    "$\\alpha$ в первой четверти — синус положителен:",
    "$$\\sin\\alpha = \\sqrt{1 - \\dfrac{25 \\cdot 26}{676}} = \\sqrt{\\dfrac{26}{676}} = \\dfrac{\\sqrt{26}}{26}$$ $$\\operatorname{tg}\\alpha = \\dfrac{\\sin\\alpha}{\\cos\\alpha} = \\dfrac{\\sqrt{26}}{26} : \\dfrac{5\\sqrt{26}}{26} = \\dfrac{1}{5} = 0{,}2$$"
   ]
  },
  {
   "id": "8.fipi.9017F9",
   "group": "trig_value",
   "fipi": "9017F9",
   "text": "Найдите значение выражения $26\\sqrt{2}\\cos\\dfrac{\\pi}{4}\\cos\\dfrac{4\\pi}{3}$.",
   "answer": "-13",
   "steps": [
    "$$\\cos \\dfrac{\\pi}{4} = \\dfrac{\\sqrt{2}}{2}$$ $$\\cos \\dfrac{4\\pi}{3} = -\\dfrac{1}{2}$$ $$26\\sqrt{2} \\cdot \\dfrac{\\sqrt{2}}{2} \\cdot \\left(-\\dfrac{1}{2}\\right) = -13$$"
   ]
  },
  {
   "id": "8.fipi.75591A",
   "group": "trig_value",
   "fipi": "75591A",
   "text": "Найдите значение выражения $3\\cos 2\\alpha$, если $\\cos \\alpha = -0{,}8$.",
   "answer": "0,84",
   "steps": [
    "$\\cos 2\\alpha = 2\\cos^2\\alpha - 1$:",
    "$$3\\left(2 \\cdot (-0{,}8)^2 - 1\\right) = 3 \\cdot 0{,}28 = 0{,}84$$"
   ]
  },
  {
   "id": "8.fipi.A3FD10",
   "group": "trig_value",
   "fipi": "A3FD10",
   "text": "Найдите $\\operatorname{tg}\\alpha$, если $\\sin\\alpha = \\dfrac{\\sqrt{26}}{26}$ и $\\alpha \\in \\left(0;\\ \\dfrac{\\pi}{2}\\right)$.",
   "answer": "0,2",
   "steps": [
    "$\\alpha$ в первой четверти — косинус положителен:",
    "$$\\cos\\alpha = \\sqrt{1 - \\dfrac{26}{676}} = \\dfrac{5\\sqrt{26}}{26}$$ $$\\operatorname{tg}\\alpha = \\dfrac{\\sqrt{26}}{26} : \\dfrac{5\\sqrt{26}}{26} = 0{,}2$$"
   ]
  },
  {
   "id": "8.fipi.4B912B",
   "group": "trig_value",
   "fipi": "4B912B",
   "text": "Найдите $\\sin\\alpha$, если $\\cos\\alpha = -\\dfrac{\\sqrt{21}}{5}$ и $\\alpha \\in \\left(\\dfrac{\\pi}{2};\\ \\pi\\right)$.",
   "answer": "0,4",
   "steps": [
    "$\\alpha$ во второй четверти — синус положителен:",
    "$$\\sin\\alpha = \\sqrt{1 - \\dfrac{21}{25}} = \\sqrt{\\dfrac{4}{25}} = 0{,}4$$"
   ]
  },
  {
   "id": "8.fipi.5CBA9F",
   "group": "trig_value",
   "fipi": "5CBA9F",
   "text": "Найдите значение выражения $3\\cos 2\\alpha$, если $\\sin \\alpha = 0{,}6$.",
   "answer": "0,84",
   "steps": [
    "$\\cos 2\\alpha = 1 - 2\\sin^2\\alpha$:",
    "$$3\\left(1 - 2 \\cdot 0{,}6^2\\right) = 3 \\cdot 0{,}28 = 0{,}84$$"
   ]
  },
  {
   "id": "8.fipi.967F93",
   "group": "trig_value",
   "fipi": "967F93",
   "text": "Найдите $\\operatorname{tg} \\alpha$, если $\\cos \\alpha = -\\dfrac{\\sqrt{26}}{26}$ и $\\alpha \\in\\left(\\dfrac{\\pi}{2};\\, \\pi \\right)$.",
   "answer": "-5",
   "steps": [
    "$\\alpha$ во второй четверти — синус положителен:",
    "$$\\sin\\alpha = \\sqrt{1 - \\dfrac{26}{676}} = \\sqrt{\\dfrac{650}{676}} = \\dfrac{5\\sqrt{26}}{26}$$ $$\\operatorname{tg}\\alpha = \\dfrac{5\\sqrt{26}}{26} : \\left(-\\dfrac{\\sqrt{26}}{26}\\right) = -5$$"
   ]
  },
  {
   "id": "8.fipi.DC6B69",
   "group": "trig_value",
   "fipi": "DC6B69",
   "text": "Найдите значение выражения $18\\sqrt{2}\\operatorname{tg} \\dfrac{\\pi}{4}\\sin \\dfrac{\\pi}{4}$.",
   "answer": "18",
   "steps": [
    "$$\\operatorname{tg} \\dfrac{\\pi}{4} = 1$$ $$\\sin \\dfrac{\\pi}{4} = \\dfrac{\\sqrt{2}}{2}$$ $$18\\sqrt{2} \\cdot 1 \\cdot \\dfrac{\\sqrt{2}}{2} = 18$$"
   ]
  },
  {
   "id": "8.fipi.2D68F1",
   "group": "log",
   "fipi": "2D68F1",
   "text": "Найдите значение выражения $\\log_{3} 162 - \\log_{3} 2$.",
   "answer": "4",
   "steps": [
    "Разность логарифмов — логарифм частного:",
    "$$\\log_{3} 162 - \\log_{3} 2 = \\log_{3} \\dfrac{162}{2} = \\log_{3} 81$$ $$\\log_{3} 81 = 4$$"
   ]
  },
  {
   "id": "8.fipi.110B03",
   "group": "log",
   "fipi": "110B03",
   "text": "Найдите значение выражения $\\log_{2} 6{,}4 + \\log_{2} 10$.",
   "answer": "6",
   "steps": [
    "Сумма логарифмов — логарифм произведения:",
    "$$\\log_{2} 6{,}4 + \\log_{2} 10 = \\log_{2} 64$$ $$\\log_{2} 64 = 6$$"
   ]
  },
  {
   "id": "8.fipi.3F52B8",
   "group": "log",
   "fipi": "3F52B8",
   "text": "Найдите значение выражения $6\\log_{\\sqrt[6]{13}} 13$.",
   "answer": "36",
   "steps": [
    "$\\sqrt[6]{13} = 13^{\\frac{1}{6}}$, а $\\log_{a^k} b = \\dfrac{1}{k}\\log_a b$:",
    "$$\\log_{13^{\\frac{1}{6}}} 13 = 6\\log_{13} 13 = 6$$ $$6 \\cdot 6 = 36$$"
   ]
  },
  {
   "id": "8.fipi.55491F",
   "group": "log",
   "fipi": "55491F",
   "text": "Найдите значение выражения $\\log_{2} 6{,}4 + \\log_{2} 5$.",
   "answer": "5",
   "steps": [
    "Сумма логарифмов — логарифм произведения:",
    "$$\\log_{2} 6{,}4 + \\log_{2} 5 = \\log_{2} 32$$ $$\\log_{2} 32 = 5$$"
   ]
  },
  {
   "id": "8.fipi.AA2E29",
   "group": "log",
   "fipi": "AA2E29",
   "text": "Найдите значение выражения $\\log_{0{,}7} 10 - \\log_{0{,}7} 7$.",
   "answer": "-1",
   "steps": [
    "Разность логарифмов — логарифм частного:",
    "$$\\log_{0{,}7} 10 - \\log_{0{,}7} 7 = \\log_{0{,}7} \\dfrac{10}{7}$$ $$\\dfrac{10}{7} = 0{,}7^{-1}$$ $$\\log_{0{,}7} 0{,}7^{-1} = -1$$"
   ]
  },
  {
   "id": "8.fipi.58ABD6",
   "group": "log",
   "fipi": "58ABD6",
   "text": "Найдите значение выражения $6\\log_{7} \\sqrt[3]{7}$.",
   "answer": "2",
   "steps": [
    "$\\sqrt[3]{7} = 7^{\\frac{1}{3}}$:",
    "$$6\\log_{7} 7^{\\frac{1}{3}} = 6 \\cdot \\dfrac{1}{3} = 2$$"
   ]
  },
  {
   "id": "8.fipi.5085A6",
   "group": "log",
   "fipi": "5085A6",
   "text": "Найдите значение выражения $\\log_{0{,}6} 50 - \\log_{0{,}6} 18$.",
   "answer": "-2",
   "steps": [
    "Разность логарифмов — логарифм частного:",
    "$$\\log_{0{,}6} \\dfrac{50}{18} = \\log_{0{,}6} \\dfrac{25}{9}$$ $$\\dfrac{25}{9} = \\left(\\dfrac{3}{5}\\right)^{-2} = 0{,}6^{-2}$$ $$\\log_{0{,}6} 0{,}6^{-2} = -2$$"
   ]
  },
  {
   "id": "8.fipi.4D0B96",
   "group": "log",
   "fipi": "4D0B96",
   "text": "Найдите значение выражения $\\dfrac{\\log_{9} 28}{\\log_{9} 7} + \\log_{7} \\dfrac{7}{4}$.",
   "answer": "2",
   "steps": [
    "Отношение логарифмов с одинаковым основанием — переход к новому основанию:",
    "$$\\dfrac{\\log_{9} 28}{\\log_{9} 7} = \\log_{7} 28$$",
    "Сумма логарифмов — логарифм произведения:",
    "$$\\log_{7} 28 + \\log_{7} \\dfrac{7}{4} = \\log_{7} \\left(28 \\cdot \\dfrac{7}{4}\\right) = \\log_{7} 49 = 2$$"
   ]
  },
  {
   "id": "8.fipi.D0019C",
   "group": "log",
   "fipi": "D0019C",
   "text": "Найдите значение выражения $\\log_{2} 96 - \\log_{2} 3$.",
   "answer": "5",
   "steps": [
    "Разность логарифмов — логарифм частного:",
    "$$\\log_{2} \\dfrac{96}{3} = \\log_{2} 32 = 5$$"
   ]
  },
  {
   "id": "8.fipi.F13332",
   "group": "log",
   "fipi": "F13332",
   "text": "Найдите значение выражения $8\\log_{5} \\sqrt[4]{5}$.",
   "answer": "2",
   "steps": [
    "$\\sqrt[4]{5} = 5^{\\frac{1}{4}}$:",
    "$$8\\log_{5} 5^{\\frac{1}{4}} = 8 \\cdot \\dfrac{1}{4} = 2$$"
   ]
  },
  {
   "id": "8.fipi.DB6A39",
   "group": "log",
   "fipi": "DB6A39",
   "text": "Найдите значение выражения $\\dfrac{\\log_{6} 17}{\\log_{36} 17}$.",
   "answer": "2",
   "steps": [
    "$\\log_{36} 17 = \\log_{6^2} 17 = \\dfrac{1}{2}\\log_{6} 17$:",
    "$$\\dfrac{\\log_{6} 17}{\\dfrac{1}{2}\\log_{6} 17} = 2$$"
   ]
  },
  {
   "id": "8.fipi.424680",
   "group": "log",
   "fipi": "424680",
   "text": "Найдите значение выражения $\\dfrac{\\log_{7} 32}{\\log_{7} 2}$.",
   "answer": "5",
   "steps": [
    "Отношение логарифмов с одинаковым основанием — переход к новому основанию:",
    "$$\\dfrac{\\log_{7} 32}{\\log_{7} 2} = \\log_{2} 32 = 5$$"
   ]
  },
  {
   "id": "8.fipi.5A7C8F",
   "group": "log",
   "fipi": "5A7C8F",
   "text": "Найдите значение выражения $\\log_{2} 56 - \\log_{2} 7$.",
   "answer": "3",
   "steps": [
    "Разность логарифмов — логарифм частного:",
    "$$\\log_{2} \\dfrac{56}{7} = \\log_{2} 8 = 3$$"
   ]
  },
  {
   "id": "8.fipi.330712",
   "group": "power",
   "fipi": "330712",
   "text": "Найдите значение выражения $\\dfrac{{14}^{6{,}4} \\cdot {7}^{-5{,}4}}{{2}^{4{,}4}}$.",
   "answer": "28",
   "steps": [
    "$14 = 2 \\cdot 7$:",
    "$$14^{6{,}4} = 2^{6{,}4} \\cdot 7^{6{,}4}$$ $$\\dfrac{2^{6{,}4} \\cdot 7^{6{,}4} \\cdot 7^{-5{,}4}}{2^{4{,}4}} = 2^{6{,}4 - 4{,}4} \\cdot 7^{6{,}4 - 5{,}4}$$ $$2^{2} \\cdot 7^{1} = 28$$"
   ]
  },
  {
   "id": "8.fipi.0E5270",
   "group": "power",
   "fipi": "0E5270",
   "text": "Найдите значение выражения ${({64}^{9})}^{3}:{({16}^{5})}^{8}$.",
   "answer": "4",
   "steps": [
    "Приведём к основанию 2: $64 = 2^6$, $16 = 2^4$.",
    "$$(64^{9})^{3} = 2^{6 \\cdot 9 \\cdot 3} = 2^{162}$$ $$(16^{5})^{8} = 2^{4 \\cdot 5 \\cdot 8} = 2^{160}$$ $$2^{162} : 2^{160} = 2^{2} = 4$$"
   ]
  },
  {
   "id": "8.fipi.41CD19",
   "group": "power",
   "fipi": "41CD19",
   "text": "Найдите значение выражения ${({4}^{15})}^{5}:{4}^{73}$.",
   "answer": "16",
   "steps": [
    "$$(4^{15})^{5} = 4^{75}$$ $$4^{75} : 4^{73} = 4^{2} = 16$$"
   ]
  },
  {
   "id": "8.fipi.224219",
   "group": "power",
   "fipi": "224219",
   "text": "Найдите значение выражения ${5}^{0{,}06} \\cdot {25}^{0{,}97}$.",
   "answer": "25",
   "steps": [
    "$25 = 5^2$:",
    "$$5^{0{,}06} \\cdot 25^{0{,}97} = 5^{0{,}06} \\cdot 5^{1{,}94}$$ $$5^{0{,}06 + 1{,}94} = 5^{2} = 25$$"
   ]
  },
  {
   "id": "8.fipi.CCEA21",
   "group": "power",
   "fipi": "CCEA21",
   "text": "Найдите значение выражения $\\dfrac{{81}^{2{,}6}}{{9}^{3{,}7}}$.",
   "answer": "27",
   "steps": [
    "Приведём к основанию 3: $81 = 3^4$, $9 = 3^2$.",
    "$$\\dfrac{3^{4 \\cdot 2{,}6}}{3^{2 \\cdot 3{,}7}} = \\dfrac{3^{10{,}4}}{3^{7{,}4}}$$ $$3^{3} = 27$$"
   ]
  },
  {
   "id": "8.fipi.C1F1E2",
   "group": "power",
   "fipi": "C1F1E2",
   "text": "Найдите значение выражения ${4}^{\\dfrac{1}{5}} \\cdot {16}^{\\dfrac{9}{10}}$.",
   "answer": "16",
   "steps": [
    "Приведём к основанию 2: $4 = 2^2$, $16 = 2^4$.",
    "$$2^{\\frac{2}{5}} \\cdot 2^{\\frac{36}{10}} = 2^{\\frac{2}{5} + \\frac{18}{5}}$$ $$2^{4} = 16$$"
   ]
  },
  {
   "id": "8.fipi.95FEEB",
   "group": "power",
   "fipi": "95FEEB",
   "text": "Найдите значение выражения ${({2}^{16})}^{5}:{2}^{74}$.",
   "answer": "64",
   "steps": [
    "$$(2^{16})^{5} = 2^{80}$$ $$2^{80} : 2^{74} = 2^{6} = 64$$"
   ]
  },
  {
   "id": "8.fipi.61C181",
   "group": "power",
   "fipi": "61C181",
   "text": "Найдите значение выражения $\\dfrac{{3}^{9{,}2}}{{9}^{2{,}6}}$.",
   "answer": "81",
   "steps": [
    "$9 = 3^2$:",
    "$$\\dfrac{3^{9{,}2}}{3^{2 \\cdot 2{,}6}} = \\dfrac{3^{9{,}2}}{3^{5{,}2}}$$ $$3^{4} = 81$$"
   ]
  },
  {
   "id": "8.fipi.ECE840",
   "group": "root",
   "fipi": "ECE840",
   "text": "Найдите значение выражения $\\dfrac{{\\left(3\\sqrt{8}\\right)}^{2}}{6}$.",
   "answer": "12",
   "steps": [
    "$$(3\\sqrt{8})^{2} = 9 \\cdot 8 = 72$$ $$\\dfrac{72}{6} = 12$$"
   ]
  },
  {
   "id": "8.fipi.68CF2D",
   "group": "root",
   "fipi": "68CF2D",
   "text": "Найдите значение выражения $\\dfrac{\\sqrt[3]{36} \\cdot \\sqrt[5]{36}}{\\sqrt[30]{36}}$.",
   "answer": "6",
   "steps": [
    "Запишем корни степенями с основанием 36:",
    "$$\\dfrac{36^{\\frac{1}{3}} \\cdot 36^{\\frac{1}{5}}}{36^{\\frac{1}{30}}} = 36^{\\frac{1}{3} + \\frac{1}{5} - \\frac{1}{30}}$$ $$\\dfrac{1}{3} + \\dfrac{1}{5} - \\dfrac{1}{30} = \\dfrac{10 + 6 - 1}{30} = \\dfrac{1}{2}$$ $$36^{\\frac{1}{2}} = 6$$"
   ]
  },
  {
   "id": "8.fipi.91B7CF",
   "group": "root",
   "fipi": "91B7CF",
   "text": "Найдите значение выражения $(\\sqrt{96} - \\sqrt{24}) \\cdot \\sqrt{6}$.",
   "answer": "12",
   "steps": [
    "Раскроем скобки:",
    "$$\\sqrt{96} \\cdot \\sqrt{6} - \\sqrt{24} \\cdot \\sqrt{6} = \\sqrt{576} - \\sqrt{144}$$ $$24 - 12 = 12$$"
   ]
  },
  {
   "id": "8.fipi.7AC894",
   "group": "root",
   "fipi": "7AC894",
   "text": "Найдите значение выражения $\\dfrac{\\sqrt[3]{121} \\cdot \\sqrt[4]{121}}{\\sqrt[12]{121}}$.",
   "answer": "11",
   "steps": [
    "Запишем корни степенями с основанием 121:",
    "$$121^{\\frac{1}{3} + \\frac{1}{4} - \\frac{1}{12}}$$ $$\\dfrac{1}{3} + \\dfrac{1}{4} - \\dfrac{1}{12} = \\dfrac{4 + 3 - 1}{12} = \\dfrac{1}{2}$$ $$121^{\\frac{1}{2}} = 11$$"
   ]
  },
  {
   "id": "8.fipi.7CD29A",
   "group": "root",
   "fipi": "7CD29A",
   "text": "Найдите значение выражения $\\dfrac{{(5\\sqrt{6})}^{2}}{10}$.",
   "answer": "15",
   "steps": [
    "$$(5\\sqrt{6})^{2} = 25 \\cdot 6 = 150$$ $$\\dfrac{150}{10} = 15$$"
   ]
  },
  {
   "id": "8.fipi.334A92",
   "group": "root",
   "fipi": "334A92",
   "text": "Найдите значение выражения $\\dfrac{\\sqrt[4]{8} \\cdot \\sqrt[4]{48}}{\\sqrt[4]{24}}$.",
   "answer": "2",
   "steps": [
    "Корни одной степени перемножаются и делятся под одним знаком:",
    "$$\\sqrt[4]{\\dfrac{8 \\cdot 48}{24}} = \\sqrt[4]{16} = 2$$"
   ]
  },
  {
   "id": "8.fipi.572E60",
   "group": "root",
   "fipi": "572E60",
   "text": "Найдите значение выражения $\\dfrac{\\sqrt[3]{400} \\cdot \\sqrt[3]{25}}{\\sqrt[3]{80}}$.",
   "answer": "5",
   "steps": [
    "Корни одной степени перемножаются и делятся под одним знаком:",
    "$$\\sqrt[3]{\\dfrac{400 \\cdot 25}{80}} = \\sqrt[3]{125} = 5$$"
   ]
  }
 ]
};
