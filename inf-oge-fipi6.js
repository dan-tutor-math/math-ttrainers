/* Собрано tools/oge_fipi_export.py; ключи приняты ФИПИ. */
window.INF_OGE_FIPI.tasks['6'] = {
 "sections": [],
 "groups": [
  {
   "id": "k3.2",
   "title": "Язык программирования (Python, C++, Паскаль, Java, C#, Школьный Алгоритмический Язык). Система программирования",
   "kes": "3.2",
   "section": null
  }
 ],
 "protos": [
  {
   "id": "0693EB",
   "fipi": "0693EB",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;А или t&nbsp;&gt;&nbsp;11</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p>readln(s);</p> <p>readln(t);</p> <p>readln(A);</p> <p>if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;А OR t&nbsp;&gt;&nbsp;11 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; А || t &gt; 11)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(–9, 11); (2, 7); (5, 12); (2, –2); (7, –9); (12, 6); (9, –1); (7, 11); (11, –5).</p> <p>Укажите количество целых значений параметра <i>А</i>, при которых для указанных входных данных программа напечатает «YES» шесть раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; А…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "5"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 11. Достаточно одного из двух условий.",
    "Условие t &gt; 11 от A не зависит. Значения t в девяти парах: 11, 7, 12, −2, −9, 6, −1, 11, −5.<br>Больше 11 — только у пары:<br>(5, 12): 12 &gt; 11<br>Этот запуск даёт «YES» при любом A.<br>У пар (−9, 11) и (7, 11) t = 11, но 11 &gt; 11 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>Всего «YES» нужно шесть раз. Один уже есть, значит, от остальных восьми запусков нужно:<br>6 − 1 = 5 раз «YES»",
    "В остальных восьми запусках всё решает условие s &gt; A. Значения s в них: −9, 2, 2, 7, 12, 9, 7, 11.<br>По убыванию: 12, 11, 9, 7, 7, 2, 2, −9.",
    "Ровно пять значений должны быть больше A — это пять самых больших: 12, 11, 9, 7, 7.<br>Каждое из них больше A, значит, и наименьшее из них — 7 — больше A: 7 &gt; A, то есть A &lt; 7.<br>Следующее по величине значение 2 уже не должно быть больше A: 2 ≤ A, то есть A ≥ 2.",
    "Подходят целые A от 2 до 6: это 2, 3, 4, 5, 6.<br>Их количество: 6 − 2 + 1 = <b>5</b>"
   ],
   "answerTex": "5",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "07F3EA",
   "fipi": "07F3EA",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>если</u> <u>не</u> s &gt; -4 <u>или</u> t &lt; 3</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> if not(s&nbsp;&gt;&nbsp;-4) or (t&nbsp;&lt;&nbsp;3)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>IF NOT s&nbsp;&gt;&nbsp;-4 OR t&nbsp;&lt;&nbsp;3 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>if not (s &gt; -4) or (t &lt; 3):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> if (!(s &gt; -4) || (t &lt; 3))</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table> <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(2, –2); (5, 3); (14, 1); (–12, 5), (5, 7); (10, 3); (8, 2); (3, 0); (–4, 9).</p> <p>Сколько было запусков, при которых программа напечатала «YES»?</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t ввод s ввод t если не s &gt; -4 или t…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "6"
    }
   ],
   "steps": [
    "не (s &gt; −4) верно, когда s &gt; −4 неверно, то есть когда s ≤ −4.<br>Программа печатает «YES», если s ≤ −4 или t &lt; 3, иначе — «NO». Связка «или»: достаточно, чтобы выполнилось хотя бы одно условие.",
    "Пары (s, t) из условия — девять запусков:<br>(2, −2)<br>(5, 3)<br>(14, 1)<br>(−12, 5)<br>(5, 7)<br>(10, 3)<br>(8, 2)<br>(3, 0)<br>(−4, 9)",
    "Проверяем условие для каждой пары:<br>(2, −2): 2 ≤ −4 — неверно; −2 &lt; 3 — верно → YES<br>(5, 3): 5 ≤ −4 — неверно; 3 &lt; 3 — неверно (числа равны, знак строгий) → NO<br>(14, 1): 14 ≤ −4 — неверно; 1 &lt; 3 — верно → YES<br>(−12, 5): −12 ≤ −4 — верно; 5 &lt; 3 — неверно → YES<br>(5, 7): 5 ≤ −4 — неверно; 7 &lt; 3 — неверно → NO<br>(10, 3): 10 ≤ −4 — неверно; 3 &lt; 3 — неверно (числа равны, знак строгий) → NO<br>(8, 2): 8 ≤ −4 — неверно; 2 &lt; 3 — верно → YES<br>(3, 0): 3 ≤ −4 — неверно; 0 &lt; 3 — верно → YES<br>(−4, 9): −4 ≤ −4 — верно (числа равны, знак нестрогий — равенство подходит); 9 &lt; 3 — неверно → YES",
    "«YES» напечатано в запусках: (2, −2), (14, 1), (−12, 5), (8, 2), (3, 0), (−4, 9).<br>Их количество: <b>6</b>"
   ],
   "answerTex": "6",
   "hint": "Проверяем условие по очереди для каждой из девяти пар и считаем нужные ответы.",
   "group": "k3.2"
  },
  {
   "id": "16DCE2",
   "fipi": "16DCE2",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования.</p>  <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p> <u>цел</u> s, k</p> <p> <u>ввод</u> s</p> <p> <u>ввод</u> k</p> <p> <u>если</u> s &lt; 6 <u>и</u> k &lt; 6</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p> <u>все</u></p> <p><u>кон</u></p> </td> <td> <p>var s, k: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(k);</p> <p> if (s &lt; 6) and (k &lt; 6)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p>  </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM k, s AS INTEGER</p> <p>INPUT s</p> <p>INPUT k</p> <p>IF s &lt; 6 AND k &lt; 6 THEN </p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>END IF</p> </td> <td> <p>s = int(input())</p> <p>k = int(input())</p> <p>if s &lt; 6 and k &lt; 6:</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;) </p>  </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std;</p>  <p>int main() {</p> <p> int s, k;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; k;</p> <p> if (s &lt; 6 &amp;&amp; k &lt; 6)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p>}</p> </td> </tr> </table>   <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>k</i> вводились следующие пары чисел: </p> <p>(1, 1); (7, 9); (8, –12); (6, 6); (3, 11); (–10, –12); (–10, 11); (7, 1); (12, 7). </p> <p>Сколько было запусков, при которых программа напечатала «YES»?</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, k ввод s ввод k если s &lt; 6 и k &lt; 6 т…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "2"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &lt; 6 и k &lt; 6, иначе — «NO». Связка «и»: должны выполниться оба условия сразу.",
    "Пары (s, k) из условия — девять запусков:<br>(1, 1)<br>(7, 9)<br>(8, −12)<br>(6, 6)<br>(3, 11)<br>(−10, −12)<br>(−10, 11)<br>(7, 1)<br>(12, 7)",
    "Проверяем условие для каждой пары:<br>(1, 1): 1 &lt; 6 — верно; 1 &lt; 6 — верно → YES<br>(7, 9): 7 &lt; 6 — неверно; 9 &lt; 6 — неверно → NO<br>(8, −12): 8 &lt; 6 — неверно; −12 &lt; 6 — верно → NO<br>(6, 6): 6 &lt; 6 — неверно (числа равны, знак строгий); 6 &lt; 6 — неверно (числа равны, знак строгий) → NO<br>(3, 11): 3 &lt; 6 — верно; 11 &lt; 6 — неверно → NO<br>(−10, −12): −10 &lt; 6 — верно; −12 &lt; 6 — верно → YES<br>(−10, 11): −10 &lt; 6 — верно; 11 &lt; 6 — неверно → NO<br>(7, 1): 7 &lt; 6 — неверно; 1 &lt; 6 — верно → NO<br>(12, 7): 12 &lt; 6 — неверно; 7 &lt; 6 — неверно → NO",
    "«YES» напечатано в запусках: (1, 1), (−10, −12).<br>Их количество: <b>2</b>"
   ],
   "answerTex": "2",
   "hint": "Проверяем условие по очереди для каждой из девяти пар и считаем нужные ответы.",
   "group": "k3.2"
  },
  {
   "id": "189292",
   "fipi": "189292",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s </p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;A <u>или</u> t&nbsp;&gt;&nbsp;12</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12)</p> <p> then</p> <p> writeln('YES')</p> <p> else</p> <p> writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;A OR t&nbsp;&gt;&nbsp;12 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main() {</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; A || t &gt; 12)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(13, 2); (11, 12); (–12, 12); (2, –2); (–10, –10); (6, –5); (2, 8); (9, 10); (1, 13).</p> <p>Укажите наибольшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «YES» семь раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; A…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "1"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 12. Достаточно одного из двух условий.",
    "Условие t &gt; 12 от A не зависит. Значения t в девяти парах: 2, 12, 12, −2, −10, −5, 8, 10, 13.<br>Больше 12 — только у пары:<br>(1, 13): 13 &gt; 12<br>Этот запуск даёт «YES» при любом A.<br>У пар (11, 12) и (−12, 12) t = 12, но 12 &gt; 12 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>Всего «YES» нужно семь раз. Один уже есть, значит, от остальных восьми запусков нужно:<br>7 − 1 = 6 раз «YES»",
    "В остальных восьми запусках всё решает условие s &gt; A. Значения s в них: 13, 11, −12, 2, −10, 6, 2, 9.<br>По убыванию: 13, 11, 9, 6, 2, 2, −10, −12.",
    "Ровно шесть значений должны быть больше A — это шесть самых больших: 13, 11, 9, 6, 2, 2.<br>Каждое из них больше A, значит, и наименьшее из них — 2 — больше A: 2 &gt; A, то есть A &lt; 2.<br>Следующее по величине значение −10 уже не должно быть больше A: −10 ≤ A, то есть A ≥ −10.",
    "Подходят целые A от −10 до 1.<br>Наибольшее из них: <b>1</b>"
   ],
   "answerTex": "1",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "1B7480",
   "fipi": "1B7480",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;А <u>или</u> t&nbsp;&gt;&nbsp;11</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;А OR t&nbsp;&gt;&nbsp;11 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; А || t &gt; 11)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(–9, 11); (2, 7); (5, 12); (2, –2); (7, –9); (12, 6); (9, –1); (7, 11); (11, –5).</p> <p>Укажите наибольшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «YES» три раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; А…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "10"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 11. Достаточно одного из двух условий.",
    "Условие t &gt; 11 от A не зависит. Значения t в девяти парах: 11, 7, 12, −2, −9, 6, −1, 11, −5.<br>Больше 11 — только у пары:<br>(5, 12): 12 &gt; 11<br>Этот запуск даёт «YES» при любом A.<br>У пар (−9, 11) и (7, 11) t = 11, но 11 &gt; 11 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>Всего «YES» нужно три раза. Один уже есть, значит, от остальных восьми запусков нужно:<br>3 − 1 = 2 раза «YES»",
    "В остальных восьми запусках всё решает условие s &gt; A. Значения s в них: −9, 2, 2, 7, 12, 9, 7, 11.<br>По убыванию: 12, 11, 9, 7, 7, 2, 2, −9.",
    "Ровно два значения должны быть больше A — это два самых больших: 12, 11.<br>Каждое из них больше A, значит, и наименьшее из них — 11 — больше A: 11 &gt; A, то есть A &lt; 11.<br>Следующее по величине значение 9 уже не должно быть больше A: 9 ≤ A, то есть A ≥ 9.",
    "Подходят целые A от 9 до 10: это 9, 10.<br>Наибольшее из них: <b>10</b>"
   ],
   "answerTex": "10",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "249C36",
   "fipi": "249C36",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования.</p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;А или t&nbsp;&gt;&nbsp;11</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;А OR t&nbsp;&gt;&nbsp;11 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; А || t &gt; 11)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(–9, 11); (2, 7); (5, 12); (2, –2); (7, –9); (12, 6); (9, –1); (7, 11); (11, –5).</p> <p>Укажите количество целых значений параметра <i>А</i>, при которых для указанных входных данных программа напечатает «NO» шесть раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; А…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "2"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 11. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ A и t ≤ 11.",
    "Условие t &gt; 11 от A не зависит. Значения t в девяти парах: 11, 7, 12, −2, −9, 6, −1, 11, −5.<br>Больше 11 — только у пары:<br>(5, 12): 12 &gt; 11<br>Этот запуск даёт «YES» при любом A. На число «NO» он не влияет.<br>У пар (−9, 11) и (7, 11) t = 11, но 11 &gt; 11 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>«NO» дают только они: там, где s ≤ A. Значения s в них: −9, 2, 2, 7, 12, 9, 7, 11.<br>По возрастанию: −9, 2, 2, 7, 7, 9, 11, 12.",
    "Нужно ровно шесть «NO», то есть ровно шесть значений должны быть не больше A — это шесть самых маленьких: −9, 2, 2, 7, 7, 9.<br>Каждое из них не больше A, значит, и наибольшее из них — 9 — не больше A: 9 ≤ A, то есть A ≥ 9.<br>Следующее значение 11 уже должно дать «YES»: 11 &gt; A, то есть A &lt; 11.",
    "Подходят целые A от 9 до 10: это 9, 10.<br>Их количество: 10 − 9 + 1 = <b>2</b>"
   ],
   "answerTex": "2",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "2643B6",
   "fipi": "2643B6",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;А <u>или</u> t&nbsp;&gt;&nbsp;11</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;А OR t&nbsp;&gt;&nbsp;11 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p><u>&nbsp;</u></p> <p>if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; А || t &gt; 11)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(–9, 11); (2, 7); (5, 12); (2, –2); (7, –9); (12, 6); (9, –1); (7, 11); (11, –5).</p> <p>Укажите наименьшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «YES» три раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; А…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "9"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 11. Достаточно одного из двух условий.",
    "Условие t &gt; 11 от A не зависит. Значения t в девяти парах: 11, 7, 12, −2, −9, 6, −1, 11, −5.<br>Больше 11 — только у пары:<br>(5, 12): 12 &gt; 11<br>Этот запуск даёт «YES» при любом A.<br>У пар (−9, 11) и (7, 11) t = 11, но 11 &gt; 11 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>Всего «YES» нужно три раза. Один уже есть, значит, от остальных восьми запусков нужно:<br>3 − 1 = 2 раза «YES»",
    "В остальных восьми запусках всё решает условие s &gt; A. Значения s в них: −9, 2, 2, 7, 12, 9, 7, 11.<br>По убыванию: 12, 11, 9, 7, 7, 2, 2, −9.",
    "Ровно два значения должны быть больше A — это два самых больших: 12, 11.<br>Каждое из них больше A, значит, и наименьшее из них — 11 — больше A: 11 &gt; A, то есть A &lt; 11.<br>Следующее по величине значение 9 уже не должно быть больше A: 9 ≤ A, то есть A ≥ 9.",
    "Подходят целые A от 9 до 10: это 9, 10.<br>Наименьшее из них: <b>9</b>"
   ],
   "answerTex": "9",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "2E7C6B",
   "fipi": "2E7C6B",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s </p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;A <u>или</u> t&nbsp;&gt;&nbsp;12</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12)</p> <p> then</p> <p> writeln('YES')</p> <p> else</p> <p> writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;A OR t&nbsp;&gt;&nbsp;12 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main() {</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; A || t &gt; 12)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(13, 2); (11, 12); (–12, 12); (2, –2); (–10, –10); (6, –5); (2, 8); (9, 10); (1, 13).</p> <p>Укажите наибольшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «YES» четыре раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; A…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "8"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 12. Достаточно одного из двух условий.",
    "Условие t &gt; 12 от A не зависит. Значения t в девяти парах: 2, 12, 12, −2, −10, −5, 8, 10, 13.<br>Больше 12 — только у пары:<br>(1, 13): 13 &gt; 12<br>Этот запуск даёт «YES» при любом A.<br>У пар (11, 12) и (−12, 12) t = 12, но 12 &gt; 12 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>Всего «YES» нужно четыре раза. Один уже есть, значит, от остальных восьми запусков нужно:<br>4 − 1 = 3 раза «YES»",
    "В остальных восьми запусках всё решает условие s &gt; A. Значения s в них: 13, 11, −12, 2, −10, 6, 2, 9.<br>По убыванию: 13, 11, 9, 6, 2, 2, −10, −12.",
    "Ровно три значения должны быть больше A — это три самых больших: 13, 11, 9.<br>Каждое из них больше A, значит, и наименьшее из них — 9 — больше A: 9 &gt; A, то есть A &lt; 9.<br>Следующее по величине значение 6 уже не должно быть больше A: 6 ≤ A, то есть A ≥ 6.",
    "Подходят целые A от 6 до 8: это 6, 7, 8.<br>Наибольшее из них: <b>8</b>"
   ],
   "answerTex": "8",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "2F302E",
   "fipi": "2F302E",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования.</p>  <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p> <u>цел</u> s, k</p> <p> <u>ввод</u> s</p> <p> <u>ввод</u> k</p> <p> <u>если</u> mod(s, 6) = k</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p> <u>все</u></p> <p><u>кон</u></p> </td> <td> <p>var s, k: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(k);</p> <p> if s mod 6 = k</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p>  </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM k, s AS INTEGER</p> <p>INPUT s</p> <p>INPUT k</p> <p>IF s MOD 6 = k THEN </p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>END IF</p> </td> <td> <p>s = int(input())</p> <p>k = int(input())</p> <p>if s % 6 == k:</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;) </p>  </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std;</p>  <p>int main() {</p> <p> int s, k;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; k;</p> <p> if (s % 6 == k)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p>}</p> </td> </tr> </table>   <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>k</i> вводились следующие пары чисел: </p> <p>(6, 6); (7, 1); (16, 10); (20, 2); (10, 3); (12, 2); (2, 2); (0, 6); (4, 5). </p> <p>Сколько было запусков, при которых программа напечатала «YES»?</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, k ввод s ввод k если mod(s, 6) = k т…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "3"
    }
   ],
   "steps": [
    "s % 6 — это остаток от деления s на 6. Программа печатает «YES», если этот остаток равен k, иначе — «NO».<br>Остаток от деления на 6 всегда меньше 6, поэтому при k ≥ 6 «YES» не будет никогда.",
    "Пары (s, k) из условия — девять запусков:<br>(6, 6)<br>(7, 1)<br>(16, 10)<br>(20, 2)<br>(10, 3)<br>(12, 2)<br>(2, 2)<br>(0, 6)<br>(4, 5)",
    "Считаем остаток для каждой пары:<br>(6, 6): 6 = 6 · 1 + 0, остаток 0; 0 ≠ 6 → NO (6 ≥ 6, такого остатка не бывает)<br>(7, 1): 7 = 6 · 1 + 1, остаток 1; 1 = 1 → YES<br>(16, 10): 16 = 6 · 2 + 4, остаток 4; 4 ≠ 10 → NO (10 ≥ 6, такого остатка не бывает)<br>(20, 2): 20 = 6 · 3 + 2, остаток 2; 2 = 2 → YES<br>(10, 3): 10 = 6 · 1 + 4, остаток 4; 4 ≠ 3 → NO<br>(12, 2): 12 = 6 · 2 + 0, остаток 0; 0 ≠ 2 → NO<br>(2, 2): 2 = 6 · 0 + 2, остаток 2; 2 = 2 → YES<br>(0, 6): 0 = 6 · 0 + 0, остаток 0; 0 ≠ 6 → NO (6 ≥ 6, такого остатка не бывает)<br>(4, 5): 4 = 6 · 0 + 4, остаток 4; 4 ≠ 5 → NO",
    "«YES» напечатано в запусках: (7, 1), (20, 2), (2, 2).<br>Их количество: <b>3</b>"
   ],
   "answerTex": "3",
   "hint": "Для каждой пары находим остаток от деления и сравниваем его со вторым числом.",
   "group": "k3.2"
  },
  {
   "id": "3A01A3",
   "fipi": "3A01A3",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;10 <u>или</u> t&nbsp;&gt;&nbsp;А</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;10 OR t&nbsp;&gt;&nbsp;А THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; 10 || t &gt; А)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(1, 2); (11, 2); (1, 12); (11, 12); (–11, –12); (–11, 12); (–12, 11); (10, 10); (10, 5).</p> <p>Укажите количество целых значений параметра <i>А</i>, при которых для указанных входных данных программа напечатает «YES» семь раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; 1…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "3"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; 10 или t &gt; A. Достаточно одного из двух условий.",
    "Условие s &gt; 10 от A не зависит. Значения s в девяти парах: 1, 11, 1, 11, −11, −11, −12, 10, 10.<br>Больше 10 — только у пар:<br>(11, 2): 11 &gt; 10<br>(11, 12): 11 &gt; 10<br>Эти запуски дают «YES» при любом A.<br>У пар (10, 10) и (10, 5) s = 10, но 10 &gt; 10 — неверно: знак строгий, поэтому за счёт s «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 2 = 7<br>Всего «YES» нужно семь раз. Два уже есть, значит, от остальных семи запусков нужно:<br>7 − 2 = 5 раз «YES»",
    "В остальных семи запусках всё решает условие t &gt; A. Значения t в них: 2, 12, −12, 12, 11, 10, 5.<br>По убыванию: 12, 12, 11, 10, 5, 2, −12.",
    "Ровно пять значений должны быть больше A — это пять самых больших: 12, 12, 11, 10, 5.<br>Каждое из них больше A, значит, и наименьшее из них — 5 — больше A: 5 &gt; A, то есть A &lt; 5.<br>Следующее по величине значение 2 уже не должно быть больше A: 2 ≤ A, то есть A ≥ 2.",
    "Подходят целые A от 2 до 4: это 2, 3, 4.<br>Их количество: 4 − 2 + 1 = <b>3</b>"
   ],
   "answerTex": "3",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "3C5AB1",
   "fipi": "3C5AB1",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s </p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;A <u>или</u> t&nbsp;&gt;&nbsp;12</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var A, s, t: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12)</p> <p> then</p> <p> writeln('YES')</p> <p> else</p> <p> writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM A, s, t AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;A OR t&nbsp;&gt;&nbsp;12 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main() {</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; A || t &gt; 12)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(13, 2); (11, 12); (–12, 12); (2, –2); (–10, –10); (6, –5); (2, 8); (9, 10); (1, 13).</p> <p>Укажите наименьшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «YES» четыре раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; A…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "6"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 12. Достаточно одного из двух условий.",
    "Условие t &gt; 12 от A не зависит. Значения t в девяти парах: 2, 12, 12, −2, −10, −5, 8, 10, 13.<br>Больше 12 — только у пары:<br>(1, 13): 13 &gt; 12<br>Этот запуск даёт «YES» при любом A.<br>У пар (11, 12) и (−12, 12) t = 12, но 12 &gt; 12 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>Всего «YES» нужно четыре раза. Один уже есть, значит, от остальных восьми запусков нужно:<br>4 − 1 = 3 раза «YES»",
    "В остальных восьми запусках всё решает условие s &gt; A. Значения s в них: 13, 11, −12, 2, −10, 6, 2, 9.<br>По убыванию: 13, 11, 9, 6, 2, 2, −10, −12.",
    "Ровно три значения должны быть больше A — это три самых больших: 13, 11, 9.<br>Каждое из них больше A, значит, и наименьшее из них — 9 — больше A: 9 &gt; A, то есть A &lt; 9.<br>Следующее по величине значение 6 уже не должно быть больше A: 6 ≤ A, то есть A ≥ 6.",
    "Подходят целые A от 6 до 8: это 6, 7, 8.<br>Наименьшее из них: <b>6</b>"
   ],
   "answerTex": "6",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "3CB92A",
   "fipi": "3CB92A",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s </p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;A <u>или</u> t&nbsp;&gt;&nbsp;12</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12)</p> <p> then</p> <p> writeln('YES')</p> <p> else</p> <p> writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;A OR t&nbsp;&gt;&nbsp;12 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main() {</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; A || t &gt; 12)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(13, 2); (11, 12); (–12, 12); (2, –2); (–10, –10); (6, –5); (2, 8); (9, 10); (1, 13).</p> <p>Укажите наибольшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «NO» семь раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; A…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "12"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 12. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ A и t ≤ 12.",
    "Условие t &gt; 12 от A не зависит. Значения t в девяти парах: 2, 12, 12, −2, −10, −5, 8, 10, 13.<br>Больше 12 — только у пары:<br>(1, 13): 13 &gt; 12<br>Этот запуск даёт «YES» при любом A. На число «NO» он не влияет.<br>У пар (11, 12) и (−12, 12) t = 12, но 12 &gt; 12 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>«NO» дают только они: там, где s ≤ A. Значения s в них: 13, 11, −12, 2, −10, 6, 2, 9.<br>По возрастанию: −12, −10, 2, 2, 6, 9, 11, 13.",
    "Нужно ровно семь «NO», то есть ровно семь значений должны быть не больше A — это семь самых маленьких: −12, −10, 2, 2, 6, 9, 11.<br>Каждое из них не больше A, значит, и наибольшее из них — 11 — не больше A: 11 ≤ A, то есть A ≥ 11.<br>Следующее значение 13 уже должно дать «YES»: 13 &gt; A, то есть A &lt; 13.",
    "Подходят целые A от 11 до 12: это 11, 12.<br>Наибольшее из них: <b>12</b>"
   ],
   "answerTex": "12",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "3E3052",
   "fipi": "3E3052",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования.</p>  <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p> <u>цел</u> s, k</p> <p> <u>ввод</u> s</p> <p> <u>ввод</u> k</p> <p> <u>если</u> s &gt; 6 <u>и</u> k &gt; 6</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p> <u>все</u></p> <p><u>кон</u></p> </td> <td> <p>var s, k: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(k);</p> <p> if (s &gt; 6) and (k &gt; 6)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p>  </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM k, s AS INTEGER</p> <p>INPUT s</p> <p>INPUT k</p> <p>IF s &gt; 6 AND k &gt; 6 THEN </p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>END IF</p> </td> <td> <p>s = int(input())</p> <p>k = int(input())</p> <p>if s &gt; 6 and k &gt; 6:</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;) </p>  </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std;</p>  <p>int main() {</p> <p> int s, k;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; k;</p> <p> if (s &gt; 6 &amp;&amp; k &gt; 6)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p>}</p> </td> </tr> </table>   <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>k</i> вводились следующие пары чисел: </p> <p>(1, 1); (7, 9); (8, –12); (6, 6); (8, 11); (–10, -12); (–10, 11); (7, 1); (12, 7). </p> <p>Сколько было запусков, при которых программа напечатала «YES»?</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, k ввод s ввод k если s &gt; 6 и k &gt; 6 т…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "3"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; 6 и k &gt; 6, иначе — «NO». Связка «и»: должны выполниться оба условия сразу.",
    "Пары (s, k) из условия — девять запусков:<br>(1, 1)<br>(7, 9)<br>(8, −12)<br>(6, 6)<br>(8, 11)<br>(−10, −12)<br>(−10, 11)<br>(7, 1)<br>(12, 7)",
    "Проверяем условие для каждой пары:<br>(1, 1): 1 &gt; 6 — неверно; 1 &gt; 6 — неверно → NO<br>(7, 9): 7 &gt; 6 — верно; 9 &gt; 6 — верно → YES<br>(8, −12): 8 &gt; 6 — верно; −12 &gt; 6 — неверно → NO<br>(6, 6): 6 &gt; 6 — неверно (числа равны, знак строгий); 6 &gt; 6 — неверно (числа равны, знак строгий) → NO<br>(8, 11): 8 &gt; 6 — верно; 11 &gt; 6 — верно → YES<br>(−10, −12): −10 &gt; 6 — неверно; −12 &gt; 6 — неверно → NO<br>(−10, 11): −10 &gt; 6 — неверно; 11 &gt; 6 — верно → NO<br>(7, 1): 7 &gt; 6 — верно; 1 &gt; 6 — неверно → NO<br>(12, 7): 12 &gt; 6 — верно; 7 &gt; 6 — верно → YES",
    "«YES» напечатано в запусках: (7, 9), (8, 11), (12, 7).<br>Их количество: <b>3</b>"
   ],
   "answerTex": "3",
   "hint": "Проверяем условие по очереди для каждой из девяти пар и считаем нужные ответы.",
   "group": "k3.2"
  },
  {
   "id": "4100CF",
   "fipi": "4100CF",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s </p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;A <u>или</u> t&nbsp;&gt;&nbsp;12</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12)</p> <p> then</p> <p> writeln('YES')</p> <p> else</p> <p> writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;A OR t&nbsp;&gt;&nbsp;12 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main() {</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; A || t &gt; 12)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(13, 2); (11, 12); (–12, 12); (2, –2); (–10, –10); (6, –5); (2, 8); (9, 10); (1, 13).</p> <p>Укажите количество целых значений параметра <i>А</i>, при которых для указанных входных данных программа напечатает «NO» шесть раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; A…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "2"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 12. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ A и t ≤ 12.",
    "Условие t &gt; 12 от A не зависит. Значения t в девяти парах: 2, 12, 12, −2, −10, −5, 8, 10, 13.<br>Больше 12 — только у пары:<br>(1, 13): 13 &gt; 12<br>Этот запуск даёт «YES» при любом A. На число «NO» он не влияет.<br>У пар (11, 12) и (−12, 12) t = 12, но 12 &gt; 12 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>«NO» дают только они: там, где s ≤ A. Значения s в них: 13, 11, −12, 2, −10, 6, 2, 9.<br>По возрастанию: −12, −10, 2, 2, 6, 9, 11, 13.",
    "Нужно ровно шесть «NO», то есть ровно шесть значений должны быть не больше A — это шесть самых маленьких: −12, −10, 2, 2, 6, 9.<br>Каждое из них не больше A, значит, и наибольшее из них — 9 — не больше A: 9 ≤ A, то есть A ≥ 9.<br>Следующее значение 11 уже должно дать «YES»: 11 &gt; A, то есть A &lt; 11.",
    "Подходят целые A от 9 до 10: это 9, 10.<br>Их количество: 10 − 9 + 1 = <b>2</b>"
   ],
   "answerTex": "2",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "451E97",
   "fipi": "451E97",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s </p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;A <u>или</u> t&nbsp;&gt;&nbsp;12</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12)</p> <p> then</p> <p> writeln('YES')</p> <p> else</p> <p> writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;A OR t&nbsp;&gt;&nbsp;12 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main() {</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; A || t &gt; 12)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(13, 2); (11, 12); (–12, 12); (2, –2); (–10, –10); (6, –5); (2, 8); (9, 10); (1, 13).</p> <p>Укажите количество целых значений параметра <i>А</i>, при которых для указанных входных данных программа напечатает «YES» пять раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; A…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "4"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 12. Достаточно одного из двух условий.",
    "Условие t &gt; 12 от A не зависит. Значения t в девяти парах: 2, 12, 12, −2, −10, −5, 8, 10, 13.<br>Больше 12 — только у пары:<br>(1, 13): 13 &gt; 12<br>Этот запуск даёт «YES» при любом A.<br>У пар (11, 12) и (−12, 12) t = 12, но 12 &gt; 12 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>Всего «YES» нужно пять раз. Один уже есть, значит, от остальных восьми запусков нужно:<br>5 − 1 = 4 раза «YES»",
    "В остальных восьми запусках всё решает условие s &gt; A. Значения s в них: 13, 11, −12, 2, −10, 6, 2, 9.<br>По убыванию: 13, 11, 9, 6, 2, 2, −10, −12.",
    "Ровно четыре значения должны быть больше A — это четыре самых больших: 13, 11, 9, 6.<br>Каждое из них больше A, значит, и наименьшее из них — 6 — больше A: 6 &gt; A, то есть A &lt; 6.<br>Следующее по величине значение 2 уже не должно быть больше A: 2 ≤ A, то есть A ≥ 2.",
    "Подходят целые A от 2 до 5: это 2, 3, 4, 5.<br>Их количество: 5 − 2 + 1 = <b>4</b>"
   ],
   "answerTex": "4",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "46AA57",
   "fipi": "46AA57",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t</p> <p> <u>ввод</u> s</p> <p> <u>ввод</u> t</p> <p> <u>если</u> s&nbsp;&lt;&nbsp;-2 <u>или</u> <u>не</u> t&nbsp;&lt;&nbsp;4</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p> <u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t: integer;</p> <p>begin</p> <p>readln(s);</p> <p> readln(t);</p> <p> if (s&nbsp;&lt;&nbsp;-2) or not (t&nbsp;&lt;&nbsp;4)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>IF s&nbsp;&lt;&nbsp;-2 OR NOT t&nbsp;&lt;&nbsp;4 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>if (s&nbsp;&lt;&nbsp;-2) or not (t&nbsp;&lt;&nbsp;4):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> if ((s &lt; -2) || !(t &lt; 4))</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table> <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(2, 5); (–2, 4); (4, 1); (–11, –5); (3, –7); (1, 8); (8, 2); (3, 0); (23, 1).</p> <p>Сколько было запусков, при которых программа напечатала «YES»?</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t ввод s ввод t если s &lt; -2 или не t…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "4"
    }
   ],
   "steps": [
    "не (t &lt; 4) верно, когда t &lt; 4 неверно, то есть когда t ≥ 4.<br>Программа печатает «YES», если s &lt; −2 или t ≥ 4, иначе — «NO». Связка «или»: достаточно, чтобы выполнилось хотя бы одно условие.",
    "Пары (s, t) из условия — девять запусков:<br>(2, 5)<br>(−2, 4)<br>(4, 1)<br>(−11, −5)<br>(3, −7)<br>(1, 8)<br>(8, 2)<br>(3, 0)<br>(23, 1)",
    "Проверяем условие для каждой пары:<br>(2, 5): 2 &lt; −2 — неверно; 5 ≥ 4 — верно → YES<br>(−2, 4): −2 &lt; −2 — неверно (числа равны, знак строгий); 4 ≥ 4 — верно (числа равны, знак нестрогий — равенство подходит) → YES<br>(4, 1): 4 &lt; −2 — неверно; 1 ≥ 4 — неверно → NO<br>(−11, −5): −11 &lt; −2 — верно; −5 ≥ 4 — неверно → YES<br>(3, −7): 3 &lt; −2 — неверно; −7 ≥ 4 — неверно → NO<br>(1, 8): 1 &lt; −2 — неверно; 8 ≥ 4 — верно → YES<br>(8, 2): 8 &lt; −2 — неверно; 2 ≥ 4 — неверно → NO<br>(3, 0): 3 &lt; −2 — неверно; 0 ≥ 4 — неверно → NO<br>(23, 1): 23 &lt; −2 — неверно; 1 ≥ 4 — неверно → NO",
    "«YES» напечатано в запусках: (2, 5), (−2, 4), (−11, −5), (1, 8).<br>Их количество: <b>4</b>"
   ],
   "answerTex": "4",
   "hint": "Проверяем условие по очереди для каждой из девяти пар и считаем нужные ответы.",
   "group": "k3.2"
  },
  {
   "id": "4907E6",
   "fipi": "4907E6",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s </p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;A <u>или</u> t&nbsp;&gt;&nbsp;12</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12)</p> <p> then</p> <p> writeln('YES')</p> <p> else</p> <p> writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;A OR t&nbsp;&gt;&nbsp;12 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main() {</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; A || t &gt; 12)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(13, 2); (11, 12); (–12, 12); (2, –2); (–10, –10); (6, –5); (2, 8); (9, 10); (1, 13).</p> <p>Укажите наибольшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «YES» три раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; A…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "10"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 12. Достаточно одного из двух условий.",
    "Условие t &gt; 12 от A не зависит. Значения t в девяти парах: 2, 12, 12, −2, −10, −5, 8, 10, 13.<br>Больше 12 — только у пары:<br>(1, 13): 13 &gt; 12<br>Этот запуск даёт «YES» при любом A.<br>У пар (11, 12) и (−12, 12) t = 12, но 12 &gt; 12 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>Всего «YES» нужно три раза. Один уже есть, значит, от остальных восьми запусков нужно:<br>3 − 1 = 2 раза «YES»",
    "В остальных восьми запусках всё решает условие s &gt; A. Значения s в них: 13, 11, −12, 2, −10, 6, 2, 9.<br>По убыванию: 13, 11, 9, 6, 2, 2, −10, −12.",
    "Ровно два значения должны быть больше A — это два самых больших: 13, 11.<br>Каждое из них больше A, значит, и наименьшее из них — 11 — больше A: 11 &gt; A, то есть A &lt; 11.<br>Следующее по величине значение 9 уже не должно быть больше A: 9 ≤ A, то есть A ≥ 9.",
    "Подходят целые A от 9 до 10: это 9, 10.<br>Наибольшее из них: <b>10</b>"
   ],
   "answerTex": "10",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "4AC188",
   "fipi": "4AC188",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;А <u>или</u> t&nbsp;&gt;&nbsp;11</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;А OR t&nbsp;&gt;&nbsp;11 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; А || t &gt; 11)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(–9, 11); (2, 7); (5, 12); (2, –2); (7, –9); (12, 6); (9, –1); (7, 11); (11, –5).</p> <p>Укажите наименьшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «NO» три раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; А…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "2"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 11. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ A и t ≤ 11.",
    "Условие t &gt; 11 от A не зависит. Значения t в девяти парах: 11, 7, 12, −2, −9, 6, −1, 11, −5.<br>Больше 11 — только у пары:<br>(5, 12): 12 &gt; 11<br>Этот запуск даёт «YES» при любом A. На число «NO» он не влияет.<br>У пар (−9, 11) и (7, 11) t = 11, но 11 &gt; 11 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>«NO» дают только они: там, где s ≤ A. Значения s в них: −9, 2, 2, 7, 12, 9, 7, 11.<br>По возрастанию: −9, 2, 2, 7, 7, 9, 11, 12.",
    "Нужно ровно три «NO», то есть ровно три значения должны быть не больше A — это три самых маленьких: −9, 2, 2.<br>Каждое из них не больше A, значит, и наибольшее из них — 2 — не больше A: 2 ≤ A, то есть A ≥ 2.<br>Следующее значение 7 уже должно дать «YES»: 7 &gt; A, то есть A &lt; 7.",
    "Подходят целые A от 2 до 6: это 2, 3, 4, 5, 6.<br>Наименьшее из них: <b>2</b>"
   ],
   "answerTex": "2",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "4AFE17",
   "fipi": "4AFE17",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;А <u>или</u> t&nbsp;&gt;&nbsp;11</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;А OR t&nbsp;&gt;&nbsp;11 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; А || t &gt; 11)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table> <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(–9, 11); (2, 7); (5, 12); (2, –2); (7, –9); (12, 6); (9, –1); (7, 11); (11, –5).</p> <p>Укажите наибольшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «YES» четыре раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; А…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "8"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 11. Достаточно одного из двух условий.",
    "Условие t &gt; 11 от A не зависит. Значения t в девяти парах: 11, 7, 12, −2, −9, 6, −1, 11, −5.<br>Больше 11 — только у пары:<br>(5, 12): 12 &gt; 11<br>Этот запуск даёт «YES» при любом A.<br>У пар (−9, 11) и (7, 11) t = 11, но 11 &gt; 11 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>Всего «YES» нужно четыре раза. Один уже есть, значит, от остальных восьми запусков нужно:<br>4 − 1 = 3 раза «YES»",
    "В остальных восьми запусках всё решает условие s &gt; A. Значения s в них: −9, 2, 2, 7, 12, 9, 7, 11.<br>По убыванию: 12, 11, 9, 7, 7, 2, 2, −9.",
    "Ровно три значения должны быть больше A — это три самых больших: 12, 11, 9.<br>Каждое из них больше A, значит, и наименьшее из них — 9 — больше A: 9 &gt; A, то есть A &lt; 9.<br>Следующее по величине значение 7 уже не должно быть больше A: 7 ≤ A, то есть A ≥ 7.",
    "Подходят целые A от 7 до 8: это 7, 8.<br>Наибольшее из них: <b>8</b>"
   ],
   "answerTex": "8",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "4CC3AC",
   "fipi": "4CC3AC",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s </p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;A <u>или</u> t&nbsp;&gt;&nbsp;12</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12)</p> <p> then</p> <p> writeln('YES')</p> <p> else</p> <p> writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;A OR t&nbsp;&gt;&nbsp;12 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main() {</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; A || t &gt; 12)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(13, 2); (11, 12); (–12, 12); (2, –2); (–10, –10); (6, –5); (2, 8); (9, 10); (1, 13).</p> <p>Укажите наибольшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «NO» два раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; A…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "1"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 12. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ A и t ≤ 12.",
    "Условие t &gt; 12 от A не зависит. Значения t в девяти парах: 2, 12, 12, −2, −10, −5, 8, 10, 13.<br>Больше 12 — только у пары:<br>(1, 13): 13 &gt; 12<br>Этот запуск даёт «YES» при любом A. На число «NO» он не влияет.<br>У пар (11, 12) и (−12, 12) t = 12, но 12 &gt; 12 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>«NO» дают только они: там, где s ≤ A. Значения s в них: 13, 11, −12, 2, −10, 6, 2, 9.<br>По возрастанию: −12, −10, 2, 2, 6, 9, 11, 13.",
    "Нужно ровно два «NO», то есть ровно два значения должны быть не больше A — это два самых маленьких: −12, −10.<br>Каждое из них не больше A, значит, и наибольшее из них — −10 — не больше A: −10 ≤ A, то есть A ≥ −10.<br>Следующее значение 2 уже должно дать «YES»: 2 &gt; A, то есть A &lt; 2.",
    "Подходят целые A от −10 до 1.<br>Наибольшее из них: <b>1</b>"
   ],
   "answerTex": "1",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "4EA117",
   "fipi": "4EA117",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s </p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;A <u>или</u> t&nbsp;&gt;&nbsp;12</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12)</p> <p> then</p> <p> writeln('YES')</p> <p> else</p> <p> writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;A OR t&nbsp;&gt;&nbsp;12 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main() {</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; A || t &gt; 12)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(13, 2); (11, 12); (–12, 12); (2, –2); (–10, –10); (6, –5); (2, 8); (9, 10); (1, 13).</p> <p>Укажите наибольшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «NO» пять раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; A…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "8"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 12. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ A и t ≤ 12.",
    "Условие t &gt; 12 от A не зависит. Значения t в девяти парах: 2, 12, 12, −2, −10, −5, 8, 10, 13.<br>Больше 12 — только у пары:<br>(1, 13): 13 &gt; 12<br>Этот запуск даёт «YES» при любом A. На число «NO» он не влияет.<br>У пар (11, 12) и (−12, 12) t = 12, но 12 &gt; 12 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>«NO» дают только они: там, где s ≤ A. Значения s в них: 13, 11, −12, 2, −10, 6, 2, 9.<br>По возрастанию: −12, −10, 2, 2, 6, 9, 11, 13.",
    "Нужно ровно пять «NO», то есть ровно пять значений должны быть не больше A — это пять самых маленьких: −12, −10, 2, 2, 6.<br>Каждое из них не больше A, значит, и наибольшее из них — 6 — не больше A: 6 ≤ A, то есть A ≥ 6.<br>Следующее значение 9 уже должно дать «YES»: 9 &gt; A, то есть A &lt; 9.",
    "Подходят целые A от 6 до 8: это 6, 7, 8.<br>Наибольшее из них: <b>8</b>"
   ],
   "answerTex": "8",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "4ED09D",
   "fipi": "4ED09D",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s </p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;A <u>или</u> t&nbsp;&gt;&nbsp;12</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12)</p> <p> then</p> <p> writeln('YES')</p> <p> else</p> <p> writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;A OR t&nbsp;&gt;&nbsp;12 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main() {</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; A || t &gt; 12)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(13, 2); (11, 12); (–12, 12); (2, –2); (–10, –10); (6, –5); (2, 8); (9, 10); (1, 13).</p> <p>Укажите наименьшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «YES» пять раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; A…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "2"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 12. Достаточно одного из двух условий.",
    "Условие t &gt; 12 от A не зависит. Значения t в девяти парах: 2, 12, 12, −2, −10, −5, 8, 10, 13.<br>Больше 12 — только у пары:<br>(1, 13): 13 &gt; 12<br>Этот запуск даёт «YES» при любом A.<br>У пар (11, 12) и (−12, 12) t = 12, но 12 &gt; 12 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>Всего «YES» нужно пять раз. Один уже есть, значит, от остальных восьми запусков нужно:<br>5 − 1 = 4 раза «YES»",
    "В остальных восьми запусках всё решает условие s &gt; A. Значения s в них: 13, 11, −12, 2, −10, 6, 2, 9.<br>По убыванию: 13, 11, 9, 6, 2, 2, −10, −12.",
    "Ровно четыре значения должны быть больше A — это четыре самых больших: 13, 11, 9, 6.<br>Каждое из них больше A, значит, и наименьшее из них — 6 — больше A: 6 &gt; A, то есть A &lt; 6.<br>Следующее по величине значение 2 уже не должно быть больше A: 2 ≤ A, то есть A ≥ 2.",
    "Подходят целые A от 2 до 5: это 2, 3, 4, 5.<br>Наименьшее из них: <b>2</b>"
   ],
   "answerTex": "2",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "528BA9",
   "fipi": "528BA9",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, А</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;10 <u>или</u> t&nbsp;&gt;&nbsp;А</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, А: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, А AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT А</p> <p>IF s&nbsp;&gt;&nbsp;10 OR t&nbsp;&gt;&nbsp;А THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, А;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; 10 || t &gt; А)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table> <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(1, 2); (11, 2); (1, 12); (11, 12); (–11, –12); (–11, 12); (–12, 11); (10, 10); (10, 5).</p> <p>Укажите наименьшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «NO» два раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, А ввод s ввод t ввод A если s &gt; 1…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "2"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; 10 или t &gt; A. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ 10 и t ≤ A.",
    "Условие s &gt; 10 от A не зависит. Значения s в девяти парах: 1, 11, 1, 11, −11, −11, −12, 10, 10.<br>Больше 10 — только у пар:<br>(11, 2): 11 &gt; 10<br>(11, 12): 11 &gt; 10<br>Эти запуски дают «YES» при любом A. На число «NO» они не влияют.<br>У пар (10, 10) и (10, 5) s = 10, но 10 &gt; 10 — неверно: знак строгий, поэтому за счёт s «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 2 = 7<br>«NO» дают только они: там, где t ≤ A. Значения t в них: 2, 12, −12, 12, 11, 10, 5.<br>По возрастанию: −12, 2, 5, 10, 11, 12, 12.",
    "Нужно ровно два «NO», то есть ровно два значения должны быть не больше A — это два самых маленьких: −12, 2.<br>Каждое из них не больше A, значит, и наибольшее из них — 2 — не больше A: 2 ≤ A, то есть A ≥ 2.<br>Следующее значение 5 уже должно дать «YES»: 5 &gt; A, то есть A &lt; 5.",
    "Подходят целые A от 2 до 4: это 2, 3, 4.<br>Наименьшее из них: <b>2</b>"
   ],
   "answerTex": "2",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "59805A",
   "fipi": "59805A",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;А <u>или</u> t&nbsp;&gt;&nbsp;11</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;А OR t&nbsp;&gt;&nbsp;11 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p><u>&nbsp;</u></p> <p>if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; А || t &gt; 11)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table> <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(–9, 11); (2, 7); (5, 12); (2, –2); (7, –9); (12, 6); (9, –1); (7, 11); (11, –5).</p> <p>Укажите наименьшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «NO» три раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; А…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "2"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 11. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ A и t ≤ 11.",
    "Условие t &gt; 11 от A не зависит. Значения t в девяти парах: 11, 7, 12, −2, −9, 6, −1, 11, −5.<br>Больше 11 — только у пары:<br>(5, 12): 12 &gt; 11<br>Этот запуск даёт «YES» при любом A. На число «NO» он не влияет.<br>У пар (−9, 11) и (7, 11) t = 11, но 11 &gt; 11 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>«NO» дают только они: там, где s ≤ A. Значения s в них: −9, 2, 2, 7, 12, 9, 7, 11.<br>По возрастанию: −9, 2, 2, 7, 7, 9, 11, 12.",
    "Нужно ровно три «NO», то есть ровно три значения должны быть не больше A — это три самых маленьких: −9, 2, 2.<br>Каждое из них не больше A, значит, и наибольшее из них — 2 — не больше A: 2 ≤ A, то есть A ≥ 2.<br>Следующее значение 7 уже должно дать «YES»: 7 &gt; A, то есть A &lt; 7.",
    "Подходят целые A от 2 до 6: это 2, 3, 4, 5, 6.<br>Наименьшее из них: <b>2</b>"
   ],
   "answerTex": "2",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "5B58D0",
   "fipi": "5B58D0",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s </p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;A <u>или</u> t&nbsp;&gt;&nbsp;12</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12)</p> <p> then</p> <p> writeln('YES')</p> <p> else</p> <p> writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;A OR t&nbsp;&gt;&nbsp;12 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main() {</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; A || t &gt; 12)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(13, 2); (11, 12); (–12, 12); (2, –2); (–10, –10); (6, –5); (2, 8); (9, 10); (1, 13).</p> <p>Укажите количество целых значений параметра <i>А</i>, при которых для указанных входных данных программа напечатает «NO» пять раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; A…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "3"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 12. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ A и t ≤ 12.",
    "Условие t &gt; 12 от A не зависит. Значения t в девяти парах: 2, 12, 12, −2, −10, −5, 8, 10, 13.<br>Больше 12 — только у пары:<br>(1, 13): 13 &gt; 12<br>Этот запуск даёт «YES» при любом A. На число «NO» он не влияет.<br>У пар (11, 12) и (−12, 12) t = 12, но 12 &gt; 12 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>«NO» дают только они: там, где s ≤ A. Значения s в них: 13, 11, −12, 2, −10, 6, 2, 9.<br>По возрастанию: −12, −10, 2, 2, 6, 9, 11, 13.",
    "Нужно ровно пять «NO», то есть ровно пять значений должны быть не больше A — это пять самых маленьких: −12, −10, 2, 2, 6.<br>Каждое из них не больше A, значит, и наибольшее из них — 6 — не больше A: 6 ≤ A, то есть A ≥ 6.<br>Следующее значение 9 уже должно дать «YES»: 9 &gt; A, то есть A &lt; 9.",
    "Подходят целые A от 6 до 8: это 6, 7, 8.<br>Их количество: 8 − 6 + 1 = <b>3</b>"
   ],
   "answerTex": "3",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "5EDF5F",
   "fipi": "5EDF5F",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;10 <u>или</u> t&nbsp;&gt;&nbsp;А</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;10 OR t&nbsp;&gt;&nbsp;А THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; 10 || t &gt; А)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(1, 2); (11, 2); (1, 12); (11, 12); (–11, –12); (–11, 12); (–12, 11); (10, 10); (10, 5).</p> <p>Укажите целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «YES» пять раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; 1…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "10"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; 10 или t &gt; A. Достаточно одного из двух условий.",
    "Условие s &gt; 10 от A не зависит. Значения s в девяти парах: 1, 11, 1, 11, −11, −11, −12, 10, 10.<br>Больше 10 — только у пар:<br>(11, 2): 11 &gt; 10<br>(11, 12): 11 &gt; 10<br>Эти запуски дают «YES» при любом A.<br>У пар (10, 10) и (10, 5) s = 10, но 10 &gt; 10 — неверно: знак строгий, поэтому за счёт s «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 2 = 7<br>Всего «YES» нужно пять раз. Два уже есть, значит, от остальных семи запусков нужно:<br>5 − 2 = 3 раза «YES»",
    "В остальных семи запусках всё решает условие t &gt; A. Значения t в них: 2, 12, −12, 12, 11, 10, 5.<br>По убыванию: 12, 12, 11, 10, 5, 2, −12.",
    "Ровно три значения должны быть больше A — это три самых больших: 12, 12, 11.<br>Каждое из них больше A, значит, и наименьшее из них — 11 — больше A: 11 &gt; A, то есть A &lt; 11.<br>Следующее по величине значение 10 уже не должно быть больше A: 10 ≤ A, то есть A ≥ 10.",
    "Нужно 10 ≤ A и A &lt; 11 — подходит единственное целое A: <b>10</b>"
   ],
   "answerTex": "10",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "5F2A98",
   "fipi": "5F2A98",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>если</u> <u>не</u> (s&nbsp;&lt;= 2 <u>и</u> t&nbsp;&lt;&nbsp;3)</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> if not((s&nbsp;&lt;= 2) and (t&nbsp;&lt;&nbsp;3))</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>IF NOT(s&nbsp;&lt;= 2 AND t&nbsp;&lt;&nbsp;3) THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>if not ((s&nbsp;&lt;= 2) and (t&nbsp;&lt;&nbsp;3)):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> if (!(s &lt;= 2 &amp;&amp; t &lt; 3))</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table> <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(2, –2); (5, 3); (–4, 1); (–12, 5), (5, –7); (10, 3); (–8, 12); (3, 0); (2, 3).</p> <p>Сколько было запусков, при которых программа напечатала «YES»?</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t ввод s ввод t если не (s &lt;= 2 и t …",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "7"
    }
   ],
   "steps": [
    "Перед скобкой стоит «не»: программа печатает «NO», когда в скобках верно, и «YES», когда в скобках неверно.<br>В скобках: s ≤ 2 и t &lt; 3. Связка «и»: должны выполниться оба условия сразу.<br>Значит, «NO» — когда s ≤ 2 и t &lt; 3, в остальных запусках «YES».",
    "Пары (s, t) из условия — девять запусков:<br>(2, −2)<br>(5, 3)<br>(−4, 1)<br>(−12, 5)<br>(5, −7)<br>(10, 3)<br>(−8, 12)<br>(3, 0)<br>(2, 3)",
    "Проверяем условие в скобках для каждой пары:<br>(2, −2): 2 ≤ 2 — верно (числа равны, знак нестрогий — равенство подходит); −2 &lt; 3 — верно. В скобках верно, «не» меняет на обратное → NO<br>(5, 3): 5 ≤ 2 — неверно; 3 &lt; 3 — неверно (числа равны, знак строгий). В скобках неверно, «не» меняет на обратное → YES<br>(−4, 1): −4 ≤ 2 — верно; 1 &lt; 3 — верно. В скобках верно, «не» меняет на обратное → NO<br>(−12, 5): −12 ≤ 2 — верно; 5 &lt; 3 — неверно. В скобках неверно, «не» меняет на обратное → YES<br>(5, −7): 5 ≤ 2 — неверно; −7 &lt; 3 — верно. В скобках неверно, «не» меняет на обратное → YES<br>(10, 3): 10 ≤ 2 — неверно; 3 &lt; 3 — неверно (числа равны, знак строгий). В скобках неверно, «не» меняет на обратное → YES<br>(−8, 12): −8 ≤ 2 — верно; 12 &lt; 3 — неверно. В скобках неверно, «не» меняет на обратное → YES<br>(3, 0): 3 ≤ 2 — неверно; 0 &lt; 3 — верно. В скобках неверно, «не» меняет на обратное → YES<br>(2, 3): 2 ≤ 2 — верно (числа равны, знак нестрогий — равенство подходит); 3 &lt; 3 — неверно (числа равны, знак строгий). В скобках неверно, «не» меняет на обратное → YES",
    "«YES» напечатано в запусках: (5, 3), (−12, 5), (5, −7), (10, 3), (−8, 12), (3, 0), (2, 3).<br>Их количество: <b>7</b>"
   ],
   "answerTex": "7",
   "hint": "«Не» перед скобкой меняет ответ на противоположный: считаем, где верно условие в скобках, — там «NO».",
   "group": "k3.2"
  },
  {
   "id": "60A8EE",
   "fipi": "60A8EE",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования.</p>  <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p> <u>цел</u> s, k</p> <p> <u>ввод</u> s</p> <p> <u>ввод</u> k</p> <p> <u>если</u> mod(s, 7) = k</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p> <u>все</u></p> <p><u>кон</u></p> </td> <td> <p>var s, k: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(k);</p> <p> if s mod 7 = k</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p>  </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM k, s AS INTEGER</p> <p>INPUT s</p> <p>INPUT k</p> <p>IF s MOD 7 = k THEN </p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>END IF</p> </td> <td> <p>s = int(input())</p> <p>k = int(input())</p> <p>if s % 7 == k:</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;) </p>  </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std;</p>  <p>int main() {</p> <p> int s, k;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; k;</p> <p> if (s % 7 == k)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p>}</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>k</i> вводились следующие пары чисел: </p> <p>(2, 2); (7, 0); (14, 10); (22, 1); (10, 3); (12, 1); (9, 2); (5, 1); (2, 5). </p> <p>Сколько было запусков, при которых программа напечатала «YES»?</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, k ввод s ввод k если mod(s, 7) = k т…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "5"
    }
   ],
   "steps": [
    "s % 7 — это остаток от деления s на 7. Программа печатает «YES», если этот остаток равен k, иначе — «NO».<br>Остаток от деления на 7 всегда меньше 7, поэтому при k ≥ 7 «YES» не будет никогда.",
    "Пары (s, k) из условия — девять запусков:<br>(2, 2)<br>(7, 0)<br>(14, 10)<br>(22, 1)<br>(10, 3)<br>(12, 1)<br>(9, 2)<br>(5, 1)<br>(2, 5)",
    "Считаем остаток для каждой пары:<br>(2, 2): 2 = 7 · 0 + 2, остаток 2; 2 = 2 → YES<br>(7, 0): 7 = 7 · 1 + 0, остаток 0; 0 = 0 → YES<br>(14, 10): 14 = 7 · 2 + 0, остаток 0; 0 ≠ 10 → NO (10 ≥ 7, такого остатка не бывает)<br>(22, 1): 22 = 7 · 3 + 1, остаток 1; 1 = 1 → YES<br>(10, 3): 10 = 7 · 1 + 3, остаток 3; 3 = 3 → YES<br>(12, 1): 12 = 7 · 1 + 5, остаток 5; 5 ≠ 1 → NO<br>(9, 2): 9 = 7 · 1 + 2, остаток 2; 2 = 2 → YES<br>(5, 1): 5 = 7 · 0 + 5, остаток 5; 5 ≠ 1 → NO<br>(2, 5): 2 = 7 · 0 + 2, остаток 2; 2 ≠ 5 → NO",
    "«YES» напечатано в запусках: (2, 2), (7, 0), (22, 1), (10, 3), (9, 2).<br>Их количество: <b>5</b>"
   ],
   "answerTex": "5",
   "hint": "Для каждой пары находим остаток от деления и сравниваем его со вторым числом.",
   "group": "k3.2"
  },
  {
   "id": "627A25",
   "fipi": "627A25",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;А или t&nbsp;&gt;&nbsp;11</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;А OR t&nbsp;&gt;&nbsp;11 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; А || t &gt; 11)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(–9, 11); (2, 7); (5, 12); (2, –2); (7, –9); (12, 6); (9, –1); (7, 11); (11, –5).</p> <p>Укажите количество целых значений параметра <i>А</i>, при которых для указанных входных данных программа напечатает «NO» три раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; А…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "5"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 11. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ A и t ≤ 11.",
    "Условие t &gt; 11 от A не зависит. Значения t в девяти парах: 11, 7, 12, −2, −9, 6, −1, 11, −5.<br>Больше 11 — только у пары:<br>(5, 12): 12 &gt; 11<br>Этот запуск даёт «YES» при любом A. На число «NO» он не влияет.<br>У пар (−9, 11) и (7, 11) t = 11, но 11 &gt; 11 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>«NO» дают только они: там, где s ≤ A. Значения s в них: −9, 2, 2, 7, 12, 9, 7, 11.<br>По возрастанию: −9, 2, 2, 7, 7, 9, 11, 12.",
    "Нужно ровно три «NO», то есть ровно три значения должны быть не больше A — это три самых маленьких: −9, 2, 2.<br>Каждое из них не больше A, значит, и наибольшее из них — 2 — не больше A: 2 ≤ A, то есть A ≥ 2.<br>Следующее значение 7 уже должно дать «YES»: 7 &gt; A, то есть A &lt; 7.",
    "Подходят целые A от 2 до 6: это 2, 3, 4, 5, 6.<br>Их количество: 6 − 2 + 1 = <b>5</b>"
   ],
   "answerTex": "5",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "628BD0",
   "fipi": "628BD0",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;10 <u>или</u> t&nbsp;&gt;&nbsp;А</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p>readln(s);</p> <p>readln(t);</p> <p>readln(A);</p> <p>if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;10 OR t&nbsp;&gt;&nbsp;А THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; 10 || t &gt; А)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(1, 2); (11, 2); (1, 12); (11, 12); (–11, –12); (–11, 12); (–12, 11); (10, 10); (10, 5).</p> <p>Укажите количество целых значений параметра <i>А</i>, при которых для указанных входных данных программа напечатает «YES» шесть раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; 1…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "5"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; 10 или t &gt; A. Достаточно одного из двух условий.",
    "Условие s &gt; 10 от A не зависит. Значения s в девяти парах: 1, 11, 1, 11, −11, −11, −12, 10, 10.<br>Больше 10 — только у пар:<br>(11, 2): 11 &gt; 10<br>(11, 12): 11 &gt; 10<br>Эти запуски дают «YES» при любом A.<br>У пар (10, 10) и (10, 5) s = 10, но 10 &gt; 10 — неверно: знак строгий, поэтому за счёт s «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 2 = 7<br>Всего «YES» нужно шесть раз. Два уже есть, значит, от остальных семи запусков нужно:<br>6 − 2 = 4 раза «YES»",
    "В остальных семи запусках всё решает условие t &gt; A. Значения t в них: 2, 12, −12, 12, 11, 10, 5.<br>По убыванию: 12, 12, 11, 10, 5, 2, −12.",
    "Ровно четыре значения должны быть больше A — это четыре самых больших: 12, 12, 11, 10.<br>Каждое из них больше A, значит, и наименьшее из них — 10 — больше A: 10 &gt; A, то есть A &lt; 10.<br>Следующее по величине значение 5 уже не должно быть больше A: 5 ≤ A, то есть A ≥ 5.",
    "Подходят целые A от 5 до 9: это 5, 6, 7, 8, 9.<br>Их количество: 9 − 5 + 1 = <b>5</b>"
   ],
   "answerTex": "5",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "70B103",
   "fipi": "70B103",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, А</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;10 <u>или</u> t&nbsp;&gt;&nbsp;А</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, А: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, А AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;10 OR t&nbsp;&gt;&nbsp;А THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, А;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; 10 || t &gt; А)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table> <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(1, 2); (11, 2); (1, 12); (11, 12); (–11, –12); (–11, 12); (–12, 11); (10, 10); (10, 5).</p> <p>Укажите наименьшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «NO» семь раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, А ввод s ввод t ввод A если s &gt; 1…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "12"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; 10 или t &gt; A. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ 10 и t ≤ A.",
    "Условие s &gt; 10 от A не зависит. Значения s в девяти парах: 1, 11, 1, 11, −11, −11, −12, 10, 10.<br>Больше 10 — только у пар:<br>(11, 2): 11 &gt; 10<br>(11, 12): 11 &gt; 10<br>Эти запуски дают «YES» при любом A. На число «NO» они не влияют.<br>У пар (10, 10) и (10, 5) s = 10, но 10 &gt; 10 — неверно: знак строгий, поэтому за счёт s «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 2 = 7<br>«NO» дают только они: там, где t ≤ A. Значения t в них: 2, 12, −12, 12, 11, 10, 5.<br>По возрастанию: −12, 2, 5, 10, 11, 12, 12.",
    "Нужно семь «NO», то есть все семь значений должны быть не больше A. Значит, и самое большое из них — 12 — не больше A: 12 ≤ A, то есть A ≥ 12.<br>Наименьшее такое целое A: <b>12</b>"
   ],
   "answerTex": "12",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "7B7176",
   "fipi": "7B7176",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;10 <u>или</u> t&nbsp;&gt;&nbsp;А</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p>readln(s);</p> <p>readln(t);</p> <p>readln(A);</p> <p>if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;10 OR t&nbsp;&gt;&nbsp;А THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; 10 || t &gt; А)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table> <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(1, 2); (11, 2); (1, 12); (11, 12); (–11, –12); (–11, 12); (–12, 11); (10, 10); (10, 5).</p> <p>Укажите наибольшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «YES» шесть раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; 1…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "9"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; 10 или t &gt; A. Достаточно одного из двух условий.",
    "Условие s &gt; 10 от A не зависит. Значения s в девяти парах: 1, 11, 1, 11, −11, −11, −12, 10, 10.<br>Больше 10 — только у пар:<br>(11, 2): 11 &gt; 10<br>(11, 12): 11 &gt; 10<br>Эти запуски дают «YES» при любом A.<br>У пар (10, 10) и (10, 5) s = 10, но 10 &gt; 10 — неверно: знак строгий, поэтому за счёт s «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 2 = 7<br>Всего «YES» нужно шесть раз. Два уже есть, значит, от остальных семи запусков нужно:<br>6 − 2 = 4 раза «YES»",
    "В остальных семи запусках всё решает условие t &gt; A. Значения t в них: 2, 12, −12, 12, 11, 10, 5.<br>По убыванию: 12, 12, 11, 10, 5, 2, −12.",
    "Ровно четыре значения должны быть больше A — это четыре самых больших: 12, 12, 11, 10.<br>Каждое из них больше A, значит, и наименьшее из них — 10 — больше A: 10 &gt; A, то есть A &lt; 10.<br>Следующее по величине значение 5 уже не должно быть больше A: 5 ≤ A, то есть A ≥ 5.",
    "Подходят целые A от 5 до 9: это 5, 6, 7, 8, 9.<br>Наибольшее из них: <b>9</b>"
   ],
   "answerTex": "9",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "7D61A1",
   "fipi": "7D61A1",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;А <u>или</u> t&nbsp;&gt;&nbsp;11</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p>readln(s);</p> <p>readln(t);</p> <p>readln(A);</p> <p>if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;А OR t&nbsp;&gt;&nbsp;11 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; А || t &gt; 11)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table> <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(–9, 11); (2, 7); (5, 12); (2, –2); (7, –9); (12, 6); (9, –1); (7, 11); (11, –5).</p> <p>Укажите наибольшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «YES» шесть раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; А…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "6"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 11. Достаточно одного из двух условий.",
    "Условие t &gt; 11 от A не зависит. Значения t в девяти парах: 11, 7, 12, −2, −9, 6, −1, 11, −5.<br>Больше 11 — только у пары:<br>(5, 12): 12 &gt; 11<br>Этот запуск даёт «YES» при любом A.<br>У пар (−9, 11) и (7, 11) t = 11, но 11 &gt; 11 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>Всего «YES» нужно шесть раз. Один уже есть, значит, от остальных восьми запусков нужно:<br>6 − 1 = 5 раз «YES»",
    "В остальных восьми запусках всё решает условие s &gt; A. Значения s в них: −9, 2, 2, 7, 12, 9, 7, 11.<br>По убыванию: 12, 11, 9, 7, 7, 2, 2, −9.",
    "Ровно пять значений должны быть больше A — это пять самых больших: 12, 11, 9, 7, 7.<br>Каждое из них больше A, значит, и наименьшее из них — 7 — больше A: 7 &gt; A, то есть A &lt; 7.<br>Следующее по величине значение 2 уже не должно быть больше A: 2 ≤ A, то есть A ≥ 2.",
    "Подходят целые A от 2 до 6: это 2, 3, 4, 5, 6.<br>Наибольшее из них: <b>6</b>"
   ],
   "answerTex": "6",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "809053",
   "fipi": "809053",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>если</u>&nbsp;<u>не</u>&nbsp;(s&nbsp;&lt;&nbsp;-4&nbsp;<u>и</u>&nbsp;t&nbsp;&gt;= 3)</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> if not((s&nbsp;&lt;&nbsp;-4) and (t&nbsp;&gt;=3 ))</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>IF NOT (s&nbsp;&lt;&nbsp;-4 AND t&nbsp;&gt;= 3) THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>if not ((s&nbsp;&lt;&nbsp;-4) and (t&nbsp;&gt;= 3)):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> if !((s &lt; -4) &amp;&amp; (t &gt;= 3))</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table> <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(–5, –2); (5, 3); (–14, 3); (–12, 5), (5, –7); (10, 3); (–4, 3); (3, 0); (–4, 9).</p> <p>Сколько было запусков, при которых программа напечатала «NO»?</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t ввод s ввод t если не (s &lt; -4 и t …",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "2"
    }
   ],
   "steps": [
    "Перед скобкой стоит «не»: программа печатает «NO», когда в скобках верно, и «YES», когда в скобках неверно.<br>В скобках: s &lt; −4 и t ≥ 3. Связка «и»: должны выполниться оба условия сразу.<br>Значит, «NO» — когда s &lt; −4 и t ≥ 3, в остальных запусках «YES».",
    "Пары (s, t) из условия — девять запусков:<br>(−5, −2)<br>(5, 3)<br>(−14, 3)<br>(−12, 5)<br>(5, −7)<br>(10, 3)<br>(−4, 3)<br>(3, 0)<br>(−4, 9)",
    "Проверяем условие в скобках для каждой пары:<br>(−5, −2): −5 &lt; −4 — верно; −2 ≥ 3 — неверно. В скобках неверно, «не» меняет на обратное → YES<br>(5, 3): 5 &lt; −4 — неверно; 3 ≥ 3 — верно (числа равны, знак нестрогий — равенство подходит). В скобках неверно, «не» меняет на обратное → YES<br>(−14, 3): −14 &lt; −4 — верно; 3 ≥ 3 — верно (числа равны, знак нестрогий — равенство подходит). В скобках верно, «не» меняет на обратное → NO<br>(−12, 5): −12 &lt; −4 — верно; 5 ≥ 3 — верно. В скобках верно, «не» меняет на обратное → NO<br>(5, −7): 5 &lt; −4 — неверно; −7 ≥ 3 — неверно. В скобках неверно, «не» меняет на обратное → YES<br>(10, 3): 10 &lt; −4 — неверно; 3 ≥ 3 — верно (числа равны, знак нестрогий — равенство подходит). В скобках неверно, «не» меняет на обратное → YES<br>(−4, 3): −4 &lt; −4 — неверно (числа равны, знак строгий); 3 ≥ 3 — верно (числа равны, знак нестрогий — равенство подходит). В скобках неверно, «не» меняет на обратное → YES<br>(3, 0): 3 &lt; −4 — неверно; 0 ≥ 3 — неверно. В скобках неверно, «не» меняет на обратное → YES<br>(−4, 9): −4 &lt; −4 — неверно (числа равны, знак строгий); 9 ≥ 3 — верно. В скобках неверно, «не» меняет на обратное → YES",
    "«NO» напечатано в запусках: (−14, 3), (−12, 5).<br>Их количество: <b>2</b>"
   ],
   "answerTex": "2",
   "hint": "«Не» перед скобкой меняет ответ на противоположный: считаем, где верно условие в скобках, — там «NO».",
   "group": "k3.2"
  },
  {
   "id": "82A36E",
   "fipi": "82A36E",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s </p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;A <u>или</u> t&nbsp;&gt;&nbsp;12</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12)</p> <p> then</p> <p> writeln('YES')</p> <p> else</p> <p> writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;A OR t&nbsp;&gt;&nbsp;12 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main() {</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; A || t &gt; 12)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(13, 2); (11, 12); (–12, 12); (2, –2); (–10, –10); (6, –5); (2, 8); (9, 10); (1, 13).</p> <p>Укажите наименьшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «NO» шесть раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; A…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "9"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 12. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ A и t ≤ 12.",
    "Условие t &gt; 12 от A не зависит. Значения t в девяти парах: 2, 12, 12, −2, −10, −5, 8, 10, 13.<br>Больше 12 — только у пары:<br>(1, 13): 13 &gt; 12<br>Этот запуск даёт «YES» при любом A. На число «NO» он не влияет.<br>У пар (11, 12) и (−12, 12) t = 12, но 12 &gt; 12 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>«NO» дают только они: там, где s ≤ A. Значения s в них: 13, 11, −12, 2, −10, 6, 2, 9.<br>По возрастанию: −12, −10, 2, 2, 6, 9, 11, 13.",
    "Нужно ровно шесть «NO», то есть ровно шесть значений должны быть не больше A — это шесть самых маленьких: −12, −10, 2, 2, 6, 9.<br>Каждое из них не больше A, значит, и наибольшее из них — 9 — не больше A: 9 ≤ A, то есть A ≥ 9.<br>Следующее значение 11 уже должно дать «YES»: 11 &gt; A, то есть A &lt; 11.",
    "Подходят целые A от 9 до 10: это 9, 10.<br>Наименьшее из них: <b>9</b>"
   ],
   "answerTex": "9",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "8334E6",
   "fipi": "8334E6",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;А <u>или</u> t&nbsp;&gt;&nbsp;11</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p>readln(s);</p> <p>readln(t);</p> <p>readln(A);</p> <p>if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;А OR t&nbsp;&gt;&nbsp;11 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; А || t &gt; 11)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(–9, 11); (2, 7); (5, 12); (2, –2); (7, –9); (12, 6); (9, –1); (7, 11); (11, –5).</p> <p>Укажите наименьшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «YES» четыре раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; А…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "7"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 11. Достаточно одного из двух условий.",
    "Условие t &gt; 11 от A не зависит. Значения t в девяти парах: 11, 7, 12, −2, −9, 6, −1, 11, −5.<br>Больше 11 — только у пары:<br>(5, 12): 12 &gt; 11<br>Этот запуск даёт «YES» при любом A.<br>У пар (−9, 11) и (7, 11) t = 11, но 11 &gt; 11 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>Всего «YES» нужно четыре раза. Один уже есть, значит, от остальных восьми запусков нужно:<br>4 − 1 = 3 раза «YES»",
    "В остальных восьми запусках всё решает условие s &gt; A. Значения s в них: −9, 2, 2, 7, 12, 9, 7, 11.<br>По убыванию: 12, 11, 9, 7, 7, 2, 2, −9.",
    "Ровно три значения должны быть больше A — это три самых больших: 12, 11, 9.<br>Каждое из них больше A, значит, и наименьшее из них — 9 — больше A: 9 &gt; A, то есть A &lt; 9.<br>Следующее по величине значение 7 уже не должно быть больше A: 7 ≤ A, то есть A ≥ 7.",
    "Подходят целые A от 7 до 8: это 7, 8.<br>Наименьшее из них: <b>7</b>"
   ],
   "answerTex": "7",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "85F235",
   "fipi": "85F235",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s </p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;A <u>или</u> t&nbsp;&gt;&nbsp;12</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12)</p> <p> then</p> <p> writeln('YES')</p> <p> else</p> <p> writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;A OR t&nbsp;&gt;&nbsp;12 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main() {</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; A || t &gt; 12)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(13, 2); (11, 12); (–12, 12); (2, –2); (–10, –10); (6, –5); (2, 8); (9, 10); (1, 13).</p> <p>Укажите количество целых значений параметра <i>А</i>, при которых для указанных входных данных программа напечатает «YES» три раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; A…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "2"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 12. Достаточно одного из двух условий.",
    "Условие t &gt; 12 от A не зависит. Значения t в девяти парах: 2, 12, 12, −2, −10, −5, 8, 10, 13.<br>Больше 12 — только у пары:<br>(1, 13): 13 &gt; 12<br>Этот запуск даёт «YES» при любом A.<br>У пар (11, 12) и (−12, 12) t = 12, но 12 &gt; 12 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>Всего «YES» нужно три раза. Один уже есть, значит, от остальных восьми запусков нужно:<br>3 − 1 = 2 раза «YES»",
    "В остальных восьми запусках всё решает условие s &gt; A. Значения s в них: 13, 11, −12, 2, −10, 6, 2, 9.<br>По убыванию: 13, 11, 9, 6, 2, 2, −10, −12.",
    "Ровно два значения должны быть больше A — это два самых больших: 13, 11.<br>Каждое из них больше A, значит, и наименьшее из них — 11 — больше A: 11 &gt; A, то есть A &lt; 11.<br>Следующее по величине значение 9 уже не должно быть больше A: 9 ≤ A, то есть A ≥ 9.",
    "Подходят целые A от 9 до 10: это 9, 10.<br>Их количество: 10 − 9 + 1 = <b>2</b>"
   ],
   "answerTex": "2",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "863AB5",
   "fipi": "863AB5",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования.</p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;А <u>или</u> t&nbsp;&gt;&nbsp;11</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> «NO»</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p>readln(s);</p> <p>readln(t);</p> <p>readln(A);</p> <p>if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;А OR t&nbsp;&gt;&nbsp;11 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; А || t &gt; 11)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(–9, 11); (2, 7); (5, 12); (2, –2); (7, –9); (12, 6); (9, –1); (7, 11); (11, –5).</p> <p>Укажите количество целых значений параметра <i>А</i>, при которых для указанных входных данных программа напечатает «NO» пять раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; А…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "2"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 11. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ A и t ≤ 11.",
    "Условие t &gt; 11 от A не зависит. Значения t в девяти парах: 11, 7, 12, −2, −9, 6, −1, 11, −5.<br>Больше 11 — только у пары:<br>(5, 12): 12 &gt; 11<br>Этот запуск даёт «YES» при любом A. На число «NO» он не влияет.<br>У пар (−9, 11) и (7, 11) t = 11, но 11 &gt; 11 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>«NO» дают только они: там, где s ≤ A. Значения s в них: −9, 2, 2, 7, 12, 9, 7, 11.<br>По возрастанию: −9, 2, 2, 7, 7, 9, 11, 12.",
    "Нужно ровно пять «NO», то есть ровно пять значений должны быть не больше A — это пять самых маленьких: −9, 2, 2, 7, 7.<br>Каждое из них не больше A, значит, и наибольшее из них — 7 — не больше A: 7 ≤ A, то есть A ≥ 7.<br>Следующее значение 9 уже должно дать «YES»: 9 &gt; A, то есть A &lt; 9.",
    "Подходят целые A от 7 до 8: это 7, 8.<br>Их количество: 8 − 7 + 1 = <b>2</b>"
   ],
   "answerTex": "2",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "872BC3",
   "fipi": "872BC3",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;А <u>или</u> t&nbsp;&gt;&nbsp;11</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p>readln(s);</p> <p>readln(t);</p> <p>readln(A);</p> <p>if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;А OR t&nbsp;&gt;&nbsp;11 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; А || t &gt; 11)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(–9, 11); (2, 7); (5, 12); (2, –2); (7, –9); (12, 6); (9, –1); (7, 11); (11, –5).</p> <p>Укажите наименьшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «NO» пять раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; А…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "7"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 11. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ A и t ≤ 11.",
    "Условие t &gt; 11 от A не зависит. Значения t в девяти парах: 11, 7, 12, −2, −9, 6, −1, 11, −5.<br>Больше 11 — только у пары:<br>(5, 12): 12 &gt; 11<br>Этот запуск даёт «YES» при любом A. На число «NO» он не влияет.<br>У пар (−9, 11) и (7, 11) t = 11, но 11 &gt; 11 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>«NO» дают только они: там, где s ≤ A. Значения s в них: −9, 2, 2, 7, 12, 9, 7, 11.<br>По возрастанию: −9, 2, 2, 7, 7, 9, 11, 12.",
    "Нужно ровно пять «NO», то есть ровно пять значений должны быть не больше A — это пять самых маленьких: −9, 2, 2, 7, 7.<br>Каждое из них не больше A, значит, и наибольшее из них — 7 — не больше A: 7 ≤ A, то есть A ≥ 7.<br>Следующее значение 9 уже должно дать «YES»: 9 &gt; A, то есть A &lt; 9.",
    "Подходят целые A от 7 до 8: это 7, 8.<br>Наименьшее из них: <b>7</b>"
   ],
   "answerTex": "7",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "890295",
   "fipi": "890295",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;10 <u>или</u> t&nbsp;&gt;&nbsp;А</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;10 OR t&nbsp;&gt;&nbsp;А THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; 10 || t &gt; А)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table> <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(1, 2); (11, 2); (1, 12); (11, 12); (–11, –12); (–11, 12); (–12, 11); (10, 10); (10, 5).</p> <p>Укажите целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «NO» четыре раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; 1…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "10"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; 10 или t &gt; A. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ 10 и t ≤ A.",
    "Условие s &gt; 10 от A не зависит. Значения s в девяти парах: 1, 11, 1, 11, −11, −11, −12, 10, 10.<br>Больше 10 — только у пар:<br>(11, 2): 11 &gt; 10<br>(11, 12): 11 &gt; 10<br>Эти запуски дают «YES» при любом A. На число «NO» они не влияют.<br>У пар (10, 10) и (10, 5) s = 10, но 10 &gt; 10 — неверно: знак строгий, поэтому за счёт s «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 2 = 7<br>«NO» дают только они: там, где t ≤ A. Значения t в них: 2, 12, −12, 12, 11, 10, 5.<br>По возрастанию: −12, 2, 5, 10, 11, 12, 12.",
    "Нужно ровно четыре «NO», то есть ровно четыре значения должны быть не больше A — это четыре самых маленьких: −12, 2, 5, 10.<br>Каждое из них не больше A, значит, и наибольшее из них — 10 — не больше A: 10 ≤ A, то есть A ≥ 10.<br>Следующее значение 11 уже должно дать «YES»: 11 &gt; A, то есть A &lt; 11.",
    "Нужно 10 ≤ A и A &lt; 11 — подходит единственное целое A: <b>10</b>"
   ],
   "answerTex": "10",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "8B69A9",
   "fipi": "8B69A9",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t</p> <p> <u>ввод</u> s</p> <p> <u>ввод</u> t</p> <p> <u>если</u> s&nbsp;&gt;&nbsp;5 <u>или</u> <u>не</u> t&nbsp;&lt;&nbsp;3</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p> <u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> if (s&nbsp;&gt;&nbsp;5) or not (t&nbsp;&lt;&nbsp;3)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>IF s&nbsp;&gt;&nbsp;5 OR NOT t&nbsp;&lt;&nbsp;3 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;5) or not (t&nbsp;&lt;&nbsp;3):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> if ((s &gt; 5) || !(t &lt; 3))</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table> <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(2, –2); (–2, 4); (4, 1); (–12, 5); (0, –7); (1, 3); (8, 2); (3, 0); (23, 1).</p> <p>Сколько было запусков, при которых программа напечатала «NO»?</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t ввод s ввод t если s &gt; 5 или не t …",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "4"
    }
   ],
   "steps": [
    "не (t &lt; 3) верно, когда t &lt; 3 неверно, то есть когда t ≥ 3.<br>Программа печатает «YES», если s &gt; 5 или t ≥ 3, иначе — «NO». Связка «или»: достаточно, чтобы выполнилось хотя бы одно условие.",
    "Пары (s, t) из условия — девять запусков:<br>(2, −2)<br>(−2, 4)<br>(4, 1)<br>(−12, 5)<br>(0, −7)<br>(1, 3)<br>(8, 2)<br>(3, 0)<br>(23, 1)",
    "Проверяем условие для каждой пары:<br>(2, −2): 2 &gt; 5 — неверно; −2 ≥ 3 — неверно → NO<br>(−2, 4): −2 &gt; 5 — неверно; 4 ≥ 3 — верно → YES<br>(4, 1): 4 &gt; 5 — неверно; 1 ≥ 3 — неверно → NO<br>(−12, 5): −12 &gt; 5 — неверно; 5 ≥ 3 — верно → YES<br>(0, −7): 0 &gt; 5 — неверно; −7 ≥ 3 — неверно → NO<br>(1, 3): 1 &gt; 5 — неверно; 3 ≥ 3 — верно (числа равны, знак нестрогий — равенство подходит) → YES<br>(8, 2): 8 &gt; 5 — верно; 2 ≥ 3 — неверно → YES<br>(3, 0): 3 &gt; 5 — неверно; 0 ≥ 3 — неверно → NO<br>(23, 1): 23 &gt; 5 — верно; 1 ≥ 3 — неверно → YES",
    "«NO» напечатано в запусках: (2, −2), (4, 1), (0, −7), (3, 0).<br>Их количество: <b>4</b>"
   ],
   "answerTex": "4",
   "hint": "Проверяем условие по очереди для каждой из девяти пар и считаем нужные ответы.",
   "group": "k3.2"
  },
  {
   "id": "8E6CC4",
   "fipi": "8E6CC4",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;А <u>или</u> t&nbsp;&gt;&nbsp;11</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;А OR t&nbsp;&gt;&nbsp;11 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; А || t &gt; 11)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(–9, 11); (2, 7); (5, 12); (2, –2); (7, –9); (12, 6); (9, –1); (7, 11); (11, –5).</p> <p>Укажите наибольшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «NO» шесть раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; А…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "10"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 11. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ A и t ≤ 11.",
    "Условие t &gt; 11 от A не зависит. Значения t в девяти парах: 11, 7, 12, −2, −9, 6, −1, 11, −5.<br>Больше 11 — только у пары:<br>(5, 12): 12 &gt; 11<br>Этот запуск даёт «YES» при любом A. На число «NO» он не влияет.<br>У пар (−9, 11) и (7, 11) t = 11, но 11 &gt; 11 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>«NO» дают только они: там, где s ≤ A. Значения s в них: −9, 2, 2, 7, 12, 9, 7, 11.<br>По возрастанию: −9, 2, 2, 7, 7, 9, 11, 12.",
    "Нужно ровно шесть «NO», то есть ровно шесть значений должны быть не больше A — это шесть самых маленьких: −9, 2, 2, 7, 7, 9.<br>Каждое из них не больше A, значит, и наибольшее из них — 9 — не больше A: 9 ≤ A, то есть A ≥ 9.<br>Следующее значение 11 уже должно дать «YES»: 11 &gt; A, то есть A &lt; 11.",
    "Подходят целые A от 9 до 10: это 9, 10.<br>Наибольшее из них: <b>10</b>"
   ],
   "answerTex": "10",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "8FA506",
   "fipi": "8FA506",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s </p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;A <u>или</u> t&nbsp;&gt;&nbsp;12</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12)</p> <p> then</p> <p> writeln('YES')</p> <p> else</p> <p> writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;A OR t&nbsp;&gt;&nbsp;12 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main() {</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; A || t &gt; 12)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(13, 2); (11, 12); (–12, 12); (2, –2); (–10, –10); (6, –5); (2, 8); (9, 10); (1, 13).</p> <p>Укажите количество целых значений параметра <i>А</i>, при которых для указанных входных данных программа напечатает «YES» четыре раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; A…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "3"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 12. Достаточно одного из двух условий.",
    "Условие t &gt; 12 от A не зависит. Значения t в девяти парах: 2, 12, 12, −2, −10, −5, 8, 10, 13.<br>Больше 12 — только у пары:<br>(1, 13): 13 &gt; 12<br>Этот запуск даёт «YES» при любом A.<br>У пар (11, 12) и (−12, 12) t = 12, но 12 &gt; 12 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>Всего «YES» нужно четыре раза. Один уже есть, значит, от остальных восьми запусков нужно:<br>4 − 1 = 3 раза «YES»",
    "В остальных восьми запусках всё решает условие s &gt; A. Значения s в них: 13, 11, −12, 2, −10, 6, 2, 9.<br>По убыванию: 13, 11, 9, 6, 2, 2, −10, −12.",
    "Ровно три значения должны быть больше A — это три самых больших: 13, 11, 9.<br>Каждое из них больше A, значит, и наименьшее из них — 9 — больше A: 9 &gt; A, то есть A &lt; 9.<br>Следующее по величине значение 6 уже не должно быть больше A: 6 ≤ A, то есть A ≥ 6.",
    "Подходят целые A от 6 до 8: это 6, 7, 8.<br>Их количество: 8 − 6 + 1 = <b>3</b>"
   ],
   "answerTex": "3",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "93329D",
   "fipi": "93329D",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s </p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;A <u>или</u> t&nbsp;&gt;&nbsp;12</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12)</p> <p> then</p> <p> writeln('YES')</p> <p> else</p> <p> writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;A OR t&nbsp;&gt;&nbsp;12 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main() {</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; A || t &gt; 12)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(13, 2); (11, 12); (–12, 12); (2, –2); (–10, –10); (6, –5); (2, 8); (9, 10); (1, 13).</p> <p>Укажите наибольшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «YES» пять раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; A…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "5"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 12. Достаточно одного из двух условий.",
    "Условие t &gt; 12 от A не зависит. Значения t в девяти парах: 2, 12, 12, −2, −10, −5, 8, 10, 13.<br>Больше 12 — только у пары:<br>(1, 13): 13 &gt; 12<br>Этот запуск даёт «YES» при любом A.<br>У пар (11, 12) и (−12, 12) t = 12, но 12 &gt; 12 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>Всего «YES» нужно пять раз. Один уже есть, значит, от остальных восьми запусков нужно:<br>5 − 1 = 4 раза «YES»",
    "В остальных восьми запусках всё решает условие s &gt; A. Значения s в них: 13, 11, −12, 2, −10, 6, 2, 9.<br>По убыванию: 13, 11, 9, 6, 2, 2, −10, −12.",
    "Ровно четыре значения должны быть больше A — это четыре самых больших: 13, 11, 9, 6.<br>Каждое из них больше A, значит, и наименьшее из них — 6 — больше A: 6 &gt; A, то есть A &lt; 6.<br>Следующее по величине значение 2 уже не должно быть больше A: 2 ≤ A, то есть A ≥ 2.",
    "Подходят целые A от 2 до 5: это 2, 3, 4, 5.<br>Наибольшее из них: <b>5</b>"
   ],
   "answerTex": "5",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "99E798",
   "fipi": "99E798",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;А <u>или</u> t&nbsp;&gt;&nbsp;11</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;А OR t&nbsp;&gt;&nbsp;11 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; А || t &gt; 11)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table> <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(–9, 11); (2, 7); (5, 12); (2, –2); (7, –9); (12, 6); (9, –1); (7, 11); (11, –5).</p> <p>Укажите наибольшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «NO» пять раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; А…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "8"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 11. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ A и t ≤ 11.",
    "Условие t &gt; 11 от A не зависит. Значения t в девяти парах: 11, 7, 12, −2, −9, 6, −1, 11, −5.<br>Больше 11 — только у пары:<br>(5, 12): 12 &gt; 11<br>Этот запуск даёт «YES» при любом A. На число «NO» он не влияет.<br>У пар (−9, 11) и (7, 11) t = 11, но 11 &gt; 11 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>«NO» дают только они: там, где s ≤ A. Значения s в них: −9, 2, 2, 7, 12, 9, 7, 11.<br>По возрастанию: −9, 2, 2, 7, 7, 9, 11, 12.",
    "Нужно ровно пять «NO», то есть ровно пять значений должны быть не больше A — это пять самых маленьких: −9, 2, 2, 7, 7.<br>Каждое из них не больше A, значит, и наибольшее из них — 7 — не больше A: 7 ≤ A, то есть A ≥ 7.<br>Следующее значение 9 уже должно дать «YES»: 9 &gt; A, то есть A &lt; 9.",
    "Подходят целые A от 7 до 8: это 7, 8.<br>Наибольшее из них: <b>8</b>"
   ],
   "answerTex": "8",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "9A271F",
   "fipi": "9A271F",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;А <u>или</u> t&nbsp;&gt;&nbsp;11</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;А OR t&nbsp;&gt;&nbsp;11 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; А || t &gt; 11)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(–9, 11); (2, 7); (5, 12); (2, –2); (7, –9); (12, 6); (9, –1); (7, 11); (11, –5).</p> <p>Укажите наименьшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «NO» шесть раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; А…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "9"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 11. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ A и t ≤ 11.",
    "Условие t &gt; 11 от A не зависит. Значения t в девяти парах: 11, 7, 12, −2, −9, 6, −1, 11, −5.<br>Больше 11 — только у пары:<br>(5, 12): 12 &gt; 11<br>Этот запуск даёт «YES» при любом A. На число «NO» он не влияет.<br>У пар (−9, 11) и (7, 11) t = 11, но 11 &gt; 11 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>«NO» дают только они: там, где s ≤ A. Значения s в них: −9, 2, 2, 7, 12, 9, 7, 11.<br>По возрастанию: −9, 2, 2, 7, 7, 9, 11, 12.",
    "Нужно ровно шесть «NO», то есть ровно шесть значений должны быть не больше A — это шесть самых маленьких: −9, 2, 2, 7, 7, 9.<br>Каждое из них не больше A, значит, и наибольшее из них — 9 — не больше A: 9 ≤ A, то есть A ≥ 9.<br>Следующее значение 11 уже должно дать «YES»: 11 &gt; A, то есть A &lt; 11.",
    "Подходят целые A от 9 до 10: это 9, 10.<br>Наименьшее из них: <b>9</b>"
   ],
   "answerTex": "9",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "9BD91F",
   "fipi": "9BD91F",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s </p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;A <u>или</u> t&nbsp;&gt;&nbsp;12</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var A, s, t: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12)</p> <p> then</p> <p> writeln('YES')</p> <p> else</p> <p> writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;A OR t&nbsp;&gt;&nbsp;12 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main() {</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; A || t &gt; 12)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(13, 2); (11, 12); (–12, 12); (2, –2); (–10, –10); (6, –5); (2, 8); (9, 10); (1, 13).</p> <p>Укажите наименьшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «YES» один раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; A…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "13"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 12. Достаточно одного из двух условий.",
    "Условие t &gt; 12 от A не зависит. Значения t в девяти парах: 2, 12, 12, −2, −10, −5, 8, 10, 13.<br>Больше 12 — только у пары:<br>(1, 13): 13 &gt; 12<br>Этот запуск даёт «YES» при любом A.<br>У пар (11, 12) и (−12, 12) t = 12, но 12 &gt; 12 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>Всего «YES» нужно один раз. Один уже есть, значит, от остальных восьми запусков нужно:<br>1 − 1 = 0 раз «YES»",
    "В остальных восьми запусках всё решает условие s &gt; A. Значения s в них: 13, 11, −12, 2, −10, 6, 2, 9.<br>По убыванию: 13, 11, 9, 6, 2, 2, −10, −12.",
    "Ни одно из этих значений не должно быть больше A, то есть все они ≤ A. Значит, и самое большое из них — 13 — не больше A: 13 ≤ A, то есть A ≥ 13.<br>Наименьшее такое целое A: <b>13</b>"
   ],
   "answerTex": "13",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "9F42EE",
   "fipi": "9F42EE",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s </p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;A <u>или</u> t&nbsp;&gt;&nbsp;12</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;A OR t&nbsp;&gt;&nbsp;12 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main() {</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; A || t &gt; 12)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(13, 2); (11, 12); (–12, 12); (2, –2); (–10, –10); (6, –5); (2, 8); (9, 10); (1, 13).</p> <p>Укажите наибольшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «NO» четыре раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; A…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "5"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 12. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ A и t ≤ 12.",
    "Условие t &gt; 12 от A не зависит. Значения t в девяти парах: 2, 12, 12, −2, −10, −5, 8, 10, 13.<br>Больше 12 — только у пары:<br>(1, 13): 13 &gt; 12<br>Этот запуск даёт «YES» при любом A. На число «NO» он не влияет.<br>У пар (11, 12) и (−12, 12) t = 12, но 12 &gt; 12 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>«NO» дают только они: там, где s ≤ A. Значения s в них: 13, 11, −12, 2, −10, 6, 2, 9.<br>По возрастанию: −12, −10, 2, 2, 6, 9, 11, 13.",
    "Нужно ровно четыре «NO», то есть ровно четыре значения должны быть не больше A — это четыре самых маленьких: −12, −10, 2, 2.<br>Каждое из них не больше A, значит, и наибольшее из них — 2 — не больше A: 2 ≤ A, то есть A ≥ 2.<br>Следующее значение 6 уже должно дать «YES»: 6 &gt; A, то есть A &lt; 6.",
    "Подходят целые A от 2 до 5: это 2, 3, 4, 5.<br>Наибольшее из них: <b>5</b>"
   ],
   "answerTex": "5",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "A0712E",
   "fipi": "A0712E",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>если</u> <u>не</u> (s&nbsp;&gt;= 5 <u>и</u> t&nbsp;&lt;&nbsp;3)</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> if not ((s&nbsp;&gt;= 5) and (t&nbsp;&lt;&nbsp;3))</p> <p> then</p> <p>writeln('YES')</p> <p> else</p> <p> writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>IF NOT (s&nbsp;&gt;= 5 AND t&nbsp;&lt;&nbsp;3) THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>if not ((s&nbsp;&gt;= 5) and (t&nbsp;&lt;&nbsp;3)):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> if !((s &gt;= 5) &amp;&amp; (t &lt; 3))</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table> <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(2, –2); (5, 3); (14, 1); (–12, 5); (5, –7); (10, 3); (8, 2); (3, 0); (23, 9).</p> <p>Сколько было запусков, при которых программа напечатала «NO»?</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t ввод s ввод t если не (s &gt;= 5 и t …",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "3"
    }
   ],
   "steps": [
    "Перед скобкой стоит «не»: программа печатает «NO», когда в скобках верно, и «YES», когда в скобках неверно.<br>В скобках: s ≥ 5 и t &lt; 3. Связка «и»: должны выполниться оба условия сразу.<br>Значит, «NO» — когда s ≥ 5 и t &lt; 3, в остальных запусках «YES».",
    "Пары (s, t) из условия — девять запусков:<br>(2, −2)<br>(5, 3)<br>(14, 1)<br>(−12, 5)<br>(5, −7)<br>(10, 3)<br>(8, 2)<br>(3, 0)<br>(23, 9)",
    "Проверяем условие в скобках для каждой пары:<br>(2, −2): 2 ≥ 5 — неверно; −2 &lt; 3 — верно. В скобках неверно, «не» меняет на обратное → YES<br>(5, 3): 5 ≥ 5 — верно (числа равны, знак нестрогий — равенство подходит); 3 &lt; 3 — неверно (числа равны, знак строгий). В скобках неверно, «не» меняет на обратное → YES<br>(14, 1): 14 ≥ 5 — верно; 1 &lt; 3 — верно. В скобках верно, «не» меняет на обратное → NO<br>(−12, 5): −12 ≥ 5 — неверно; 5 &lt; 3 — неверно. В скобках неверно, «не» меняет на обратное → YES<br>(5, −7): 5 ≥ 5 — верно (числа равны, знак нестрогий — равенство подходит); −7 &lt; 3 — верно. В скобках верно, «не» меняет на обратное → NO<br>(10, 3): 10 ≥ 5 — верно; 3 &lt; 3 — неверно (числа равны, знак строгий). В скобках неверно, «не» меняет на обратное → YES<br>(8, 2): 8 ≥ 5 — верно; 2 &lt; 3 — верно. В скобках верно, «не» меняет на обратное → NO<br>(3, 0): 3 ≥ 5 — неверно; 0 &lt; 3 — верно. В скобках неверно, «не» меняет на обратное → YES<br>(23, 9): 23 ≥ 5 — верно; 9 &lt; 3 — неверно. В скобках неверно, «не» меняет на обратное → YES",
    "«NO» напечатано в запусках: (14, 1), (5, −7), (8, 2).<br>Их количество: <b>3</b>"
   ],
   "answerTex": "3",
   "hint": "«Не» перед скобкой меняет ответ на противоположный: считаем, где верно условие в скобках, — там «NO».",
   "group": "k3.2"
  },
  {
   "id": "A753F7",
   "fipi": "A753F7",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s </p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;A <u>или</u> t&nbsp;&gt;&nbsp;12</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot; <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12)</p> <p> then</p> <p> writeln('YES')</p> <p> else</p> <p> writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;A OR t&nbsp;&gt;&nbsp;12 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main() {</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; A || t &gt; 12)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(13, 2); (11, 12); (–12, 12); (2, –2); (–10, –10); (6, –5); (2, 8); (9, 10); (1, 13).</p> <p>Укажите наименьшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «YES» три раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; A…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "9"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 12. Достаточно одного из двух условий.",
    "Условие t &gt; 12 от A не зависит. Значения t в девяти парах: 2, 12, 12, −2, −10, −5, 8, 10, 13.<br>Больше 12 — только у пары:<br>(1, 13): 13 &gt; 12<br>Этот запуск даёт «YES» при любом A.<br>У пар (11, 12) и (−12, 12) t = 12, но 12 &gt; 12 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>Всего «YES» нужно три раза. Один уже есть, значит, от остальных восьми запусков нужно:<br>3 − 1 = 2 раза «YES»",
    "В остальных восьми запусках всё решает условие s &gt; A. Значения s в них: 13, 11, −12, 2, −10, 6, 2, 9.<br>По убыванию: 13, 11, 9, 6, 2, 2, −10, −12.",
    "Ровно два значения должны быть больше A — это два самых больших: 13, 11.<br>Каждое из них больше A, значит, и наименьшее из них — 11 — больше A: 11 &gt; A, то есть A &lt; 11.<br>Следующее по величине значение 9 уже не должно быть больше A: 9 ≤ A, то есть A ≥ 9.",
    "Подходят целые A от 9 до 10: это 9, 10.<br>Наименьшее из них: <b>9</b>"
   ],
   "answerTex": "9",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "A82596",
   "fipi": "A82596",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования.</p>  <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p> <u>цел</u> s, k</p> <p> <u>ввод</u> s</p> <p> <u>ввод</u> k</p> <p> <u>если</u> s &gt; 6 <u>и</u> k &lt; 6</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p> <u>все</u></p> <p><u>кон</u></p> </td> <td> <p>var s, k: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(k);</p> <p> if (s &gt; 6) and (k &lt; 6)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p>  </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM k, s AS INTEGER</p> <p>INPUT s</p> <p>INPUT k</p> <p>IF s &gt; 6 AND k &lt; 6 THEN </p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>END IF</p> </td> <td> <p>s = int(input())</p> <p>k = int(input())</p> <p>if s &gt; 6 and k &lt; 6:</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;) </p>  </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std;</p>  <p>int main() {</p> <p> int s, k;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; k;</p> <p> if (s &gt; 6 &amp;&amp; k &lt; 6)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p>}</p> </td> </tr> </table>   <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>k</i> вводились следующие пары чисел: </p> <p>(1, 1); (7, 0); (8, –12); (6, 6); (3, 11); (–10, –12); (10, 2); (7, 1); (12, 6). </p> <p>Сколько было запусков, при которых программа напечатала «YES»?</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, k ввод s ввод k если s &gt; 6 и k &lt; 6 т…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "4"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; 6 и k &lt; 6, иначе — «NO». Связка «и»: должны выполниться оба условия сразу.",
    "Пары (s, k) из условия — девять запусков:<br>(1, 1)<br>(7, 0)<br>(8, −12)<br>(6, 6)<br>(3, 11)<br>(−10, −12)<br>(10, 2)<br>(7, 1)<br>(12, 6)",
    "Проверяем условие для каждой пары:<br>(1, 1): 1 &gt; 6 — неверно; 1 &lt; 6 — верно → NO<br>(7, 0): 7 &gt; 6 — верно; 0 &lt; 6 — верно → YES<br>(8, −12): 8 &gt; 6 — верно; −12 &lt; 6 — верно → YES<br>(6, 6): 6 &gt; 6 — неверно (числа равны, знак строгий); 6 &lt; 6 — неверно (числа равны, знак строгий) → NO<br>(3, 11): 3 &gt; 6 — неверно; 11 &lt; 6 — неверно → NO<br>(−10, −12): −10 &gt; 6 — неверно; −12 &lt; 6 — верно → NO<br>(10, 2): 10 &gt; 6 — верно; 2 &lt; 6 — верно → YES<br>(7, 1): 7 &gt; 6 — верно; 1 &lt; 6 — верно → YES<br>(12, 6): 12 &gt; 6 — верно; 6 &lt; 6 — неверно (числа равны, знак строгий) → NO",
    "«YES» напечатано в запусках: (7, 0), (8, −12), (10, 2), (7, 1).<br>Их количество: <b>4</b>"
   ],
   "answerTex": "4",
   "hint": "Проверяем условие по очереди для каждой из девяти пар и считаем нужные ответы.",
   "group": "k3.2"
  },
  {
   "id": "A95F96",
   "fipi": "A95F96",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s </p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;A <u>или</u> t&nbsp;&gt;&nbsp;12</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;A OR t&nbsp;&gt;&nbsp;12 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main() {</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; A || t &gt; 12)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(13, 2); (11, 12); (–12, 12); (2, –2); (–10, –10); (6, –5); (2, 8); (9, 10); (1, 13).</p> <p>Укажите наименьшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «NO» семь раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; A…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "11"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 12. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ A и t ≤ 12.",
    "Условие t &gt; 12 от A не зависит. Значения t в девяти парах: 2, 12, 12, −2, −10, −5, 8, 10, 13.<br>Больше 12 — только у пары:<br>(1, 13): 13 &gt; 12<br>Этот запуск даёт «YES» при любом A. На число «NO» он не влияет.<br>У пар (11, 12) и (−12, 12) t = 12, но 12 &gt; 12 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>«NO» дают только они: там, где s ≤ A. Значения s в них: 13, 11, −12, 2, −10, 6, 2, 9.<br>По возрастанию: −12, −10, 2, 2, 6, 9, 11, 13.",
    "Нужно ровно семь «NO», то есть ровно семь значений должны быть не больше A — это семь самых маленьких: −12, −10, 2, 2, 6, 9, 11.<br>Каждое из них не больше A, значит, и наибольшее из них — 11 — не больше A: 11 ≤ A, то есть A ≥ 11.<br>Следующее значение 13 уже должно дать «YES»: 13 &gt; A, то есть A &lt; 13.",
    "Подходят целые A от 11 до 12: это 11, 12.<br>Наименьшее из них: <b>11</b>"
   ],
   "answerTex": "11",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "ABEB0C",
   "fipi": "ABEB0C",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;10 <u>или</u> t&nbsp;&gt;&nbsp;А</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;10 OR t&nbsp;&gt;&nbsp;А THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt;A;</p> <p> if (s &gt; 10 || t &gt; А)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table> <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(1, 2); (11, 2); (1, 12); (11, 12); (–11, –12); (–11, 12); (–12, 11); (10, 10); (10, 5).</p> <p>Укажите наименьшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «YES» семь раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; 1…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "2"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; 10 или t &gt; A. Достаточно одного из двух условий.",
    "Условие s &gt; 10 от A не зависит. Значения s в девяти парах: 1, 11, 1, 11, −11, −11, −12, 10, 10.<br>Больше 10 — только у пар:<br>(11, 2): 11 &gt; 10<br>(11, 12): 11 &gt; 10<br>Эти запуски дают «YES» при любом A.<br>У пар (10, 10) и (10, 5) s = 10, но 10 &gt; 10 — неверно: знак строгий, поэтому за счёт s «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 2 = 7<br>Всего «YES» нужно семь раз. Два уже есть, значит, от остальных семи запусков нужно:<br>7 − 2 = 5 раз «YES»",
    "В остальных семи запусках всё решает условие t &gt; A. Значения t в них: 2, 12, −12, 12, 11, 10, 5.<br>По убыванию: 12, 12, 11, 10, 5, 2, −12.",
    "Ровно пять значений должны быть больше A — это пять самых больших: 12, 12, 11, 10, 5.<br>Каждое из них больше A, значит, и наименьшее из них — 5 — больше A: 5 &gt; A, то есть A &lt; 5.<br>Следующее по величине значение 2 уже не должно быть больше A: 2 ≤ A, то есть A ≥ 2.",
    "Подходят целые A от 2 до 4: это 2, 3, 4.<br>Наименьшее из них: <b>2</b>"
   ],
   "answerTex": "2",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "ACA7A1",
   "fipi": "ACA7A1",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t</p> <p> <u>ввод</u> s</p> <p> <u>ввод</u> t</p> <p> <u>если</u> s&nbsp;&gt;&nbsp;10 <u>или</u> t&nbsp;&gt;&nbsp;10</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p> <u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p>&nbsp;if&nbsp;(s&nbsp;&gt;&nbsp;10)&nbsp;or&nbsp;(t&nbsp;&gt;&nbsp;10)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p>  </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>IF s&nbsp;&gt;&nbsp;10 OR t&nbsp;&gt;&nbsp;10 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;10):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> if (s &gt; 10 || t &gt; 10)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table> <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(1, 2); (11, 2); (1, 12); (11, 12); (–11, –12); (–11, 12); (–12, 11); (10, 10); (10, 5).</p> <p>Сколько было запусков, при которых программа напечатала «YES»?</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t ввод s ввод t если s &gt; 10 или t &gt; …",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "5"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; 10 или t &gt; 10, иначе — «NO». Связка «или»: достаточно, чтобы выполнилось хотя бы одно условие.",
    "Пары (s, t) из условия — девять запусков:<br>(1, 2)<br>(11, 2)<br>(1, 12)<br>(11, 12)<br>(−11, −12)<br>(−11, 12)<br>(−12, 11)<br>(10, 10)<br>(10, 5)",
    "Проверяем условие для каждой пары:<br>(1, 2): 1 &gt; 10 — неверно; 2 &gt; 10 — неверно → NO<br>(11, 2): 11 &gt; 10 — верно; 2 &gt; 10 — неверно → YES<br>(1, 12): 1 &gt; 10 — неверно; 12 &gt; 10 — верно → YES<br>(11, 12): 11 &gt; 10 — верно; 12 &gt; 10 — верно → YES<br>(−11, −12): −11 &gt; 10 — неверно; −12 &gt; 10 — неверно → NO<br>(−11, 12): −11 &gt; 10 — неверно; 12 &gt; 10 — верно → YES<br>(−12, 11): −12 &gt; 10 — неверно; 11 &gt; 10 — верно → YES<br>(10, 10): 10 &gt; 10 — неверно (числа равны, знак строгий); 10 &gt; 10 — неверно (числа равны, знак строгий) → NO<br>(10, 5): 10 &gt; 10 — неверно (числа равны, знак строгий); 5 &gt; 10 — неверно → NO",
    "«YES» напечатано в запусках: (11, 2), (1, 12), (11, 12), (−11, 12), (−12, 11).<br>Их количество: <b>5</b>"
   ],
   "answerTex": "5",
   "hint": "Проверяем условие по очереди для каждой из девяти пар и считаем нужные ответы.",
   "group": "k3.2"
  },
  {
   "id": "AD8712",
   "fipi": "AD8712",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования.</p>  <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p> <u>цел</u> s, k</p> <p> <u>ввод</u> s</p> <p> <u>ввод</u> k</p> <p> <u>если</u> mod(s, 9) = k</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p> <u>все</u></p> <p><u>кон</u></p> </td> <td> <p>var s, k: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(k);</p> <p> if s mod 9 = k</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p>  </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM k, s AS INTEGER</p> <p>INPUT s</p> <p>INPUT k</p> <p>IF s MOD 9 = k THEN </p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>END IF</p> </td> <td> <p>s = int(input())</p> <p>k = int(input())</p> <p>if s % 9 == k:</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;) </p>  </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std;</p>  <p>int main() {</p> <p> int s, k;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; k;</p> <p> if (s % 9 == k)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p>}</p> </td> </tr> </table>   <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>k</i> вводились следующие пары чисел: </p> <p>(9, 0); (10, 10); (18, 9); (22, 4); (27, 3); (12, 9); (29, 2); (4, 2); (3, 3). </p> <p>Сколько было запусков, при которых программа напечатала «YES»?</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, k ввод s ввод k если mod(s, 9) = k т…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "4"
    }
   ],
   "steps": [
    "s % 9 — это остаток от деления s на 9. Программа печатает «YES», если этот остаток равен k, иначе — «NO».<br>Остаток от деления на 9 всегда меньше 9, поэтому при k ≥ 9 «YES» не будет никогда.",
    "Пары (s, k) из условия — девять запусков:<br>(9, 0)<br>(10, 10)<br>(18, 9)<br>(22, 4)<br>(27, 3)<br>(12, 9)<br>(29, 2)<br>(4, 2)<br>(3, 3)",
    "Считаем остаток для каждой пары:<br>(9, 0): 9 = 9 · 1 + 0, остаток 0; 0 = 0 → YES<br>(10, 10): 10 = 9 · 1 + 1, остаток 1; 1 ≠ 10 → NO (10 ≥ 9, такого остатка не бывает)<br>(18, 9): 18 = 9 · 2 + 0, остаток 0; 0 ≠ 9 → NO (9 ≥ 9, такого остатка не бывает)<br>(22, 4): 22 = 9 · 2 + 4, остаток 4; 4 = 4 → YES<br>(27, 3): 27 = 9 · 3 + 0, остаток 0; 0 ≠ 3 → NO<br>(12, 9): 12 = 9 · 1 + 3, остаток 3; 3 ≠ 9 → NO (9 ≥ 9, такого остатка не бывает)<br>(29, 2): 29 = 9 · 3 + 2, остаток 2; 2 = 2 → YES<br>(4, 2): 4 = 9 · 0 + 4, остаток 4; 4 ≠ 2 → NO<br>(3, 3): 3 = 9 · 0 + 3, остаток 3; 3 = 3 → YES",
    "«YES» напечатано в запусках: (9, 0), (22, 4), (29, 2), (3, 3).<br>Их количество: <b>4</b>"
   ],
   "answerTex": "4",
   "hint": "Для каждой пары находим остаток от деления и сравниваем его со вторым числом.",
   "group": "k3.2"
  },
  {
   "id": "B15DF4",
   "fipi": "B15DF4",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования.</p>  <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p> <u>цел</u> s, k</p> <p> <u>ввод</u> s</p> <p> <u>ввод</u> k</p> <p> <u>если</u> mod(s, 5) = k</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p> <u>все</u></p> <p><u>кон</u></p> </td> <td> <p>var s, k: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(k);</p> <p> if s mod 5 = k</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p>  </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM k, s AS INTEGER</p> <p>INPUT s</p> <p>INPUT k</p> <p>IF s MOD 5 = k THEN </p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>END IF</p> </td> <td> <p>s = int(input())</p> <p>k = int(input())</p> <p>if s % 5 == k:</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;) </p>  </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std;</p>  <p>int main() {</p> <p> int s, k;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; k;</p> <p> if (s % 5 == k)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p>}</p> </td> </tr> </table>   <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>k</i> вводились следующие пары чисел: </p> <p>(1, 2); (5, 0); (18, 3); (21, 1); (10, 2); (12, 1); (9, 4); (5, 5); (3, 3). </p> <p>Сколько было запусков, при которых программа напечатала «YES»?</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, k ввод s ввод k если mod(s, 5) = k т…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "5"
    }
   ],
   "steps": [
    "s % 5 — это остаток от деления s на 5. Программа печатает «YES», если этот остаток равен k, иначе — «NO».<br>Остаток от деления на 5 всегда меньше 5, поэтому при k ≥ 5 «YES» не будет никогда.",
    "Пары (s, k) из условия — девять запусков:<br>(1, 2)<br>(5, 0)<br>(18, 3)<br>(21, 1)<br>(10, 2)<br>(12, 1)<br>(9, 4)<br>(5, 5)<br>(3, 3)",
    "Считаем остаток для каждой пары:<br>(1, 2): 1 = 5 · 0 + 1, остаток 1; 1 ≠ 2 → NO<br>(5, 0): 5 = 5 · 1 + 0, остаток 0; 0 = 0 → YES<br>(18, 3): 18 = 5 · 3 + 3, остаток 3; 3 = 3 → YES<br>(21, 1): 21 = 5 · 4 + 1, остаток 1; 1 = 1 → YES<br>(10, 2): 10 = 5 · 2 + 0, остаток 0; 0 ≠ 2 → NO<br>(12, 1): 12 = 5 · 2 + 2, остаток 2; 2 ≠ 1 → NO<br>(9, 4): 9 = 5 · 1 + 4, остаток 4; 4 = 4 → YES<br>(5, 5): 5 = 5 · 1 + 0, остаток 0; 0 ≠ 5 → NO (5 ≥ 5, такого остатка не бывает)<br>(3, 3): 3 = 5 · 0 + 3, остаток 3; 3 = 3 → YES",
    "«YES» напечатано в запусках: (5, 0), (18, 3), (21, 1), (9, 4), (3, 3).<br>Их количество: <b>5</b>"
   ],
   "answerTex": "5",
   "hint": "Для каждой пары находим остаток от деления и сравниваем его со вторым числом.",
   "group": "k3.2"
  },
  {
   "id": "B4730C",
   "fipi": "B4730C",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s </p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;A <u>или</u> t&nbsp;&gt;&nbsp;12</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12)</p> <p> then</p> <p> writeln('YES')</p> <p> else</p> <p> writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;A OR t&nbsp;&gt;&nbsp;12 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main() {</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; A || t &gt; 12)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(13, 2); (11, 12); (–12, 12); (2, –2); (–10, –10); (6, –5); (2, 8); (9, 10); (1, 13).</p> <p>Укажите наименьшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «YES» два раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; A…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "11"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 12. Достаточно одного из двух условий.",
    "Условие t &gt; 12 от A не зависит. Значения t в девяти парах: 2, 12, 12, −2, −10, −5, 8, 10, 13.<br>Больше 12 — только у пары:<br>(1, 13): 13 &gt; 12<br>Этот запуск даёт «YES» при любом A.<br>У пар (11, 12) и (−12, 12) t = 12, но 12 &gt; 12 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>Всего «YES» нужно два раза. Один уже есть, значит, от остальных восьми запусков нужно:<br>2 − 1 = 1 раз «YES»",
    "В остальных восьми запусках всё решает условие s &gt; A. Значения s в них: 13, 11, −12, 2, −10, 6, 2, 9.<br>По убыванию: 13, 11, 9, 6, 2, 2, −10, −12.",
    "Ровно одно значение должно быть больше A — это самое большое: 13.<br>Оно больше A: 13 &gt; A, то есть A &lt; 13.<br>Следующее по величине значение 11 уже не должно быть больше A: 11 ≤ A, то есть A ≥ 11.",
    "Подходят целые A от 11 до 12: это 11, 12.<br>Наименьшее из них: <b>11</b>"
   ],
   "answerTex": "11",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "B718B3",
   "fipi": "B718B3",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;10 <u>или</u> t&nbsp;&gt;&nbsp;А</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;10 OR t&nbsp;&gt;&nbsp;А THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; 10 || t &gt; А)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(1, 2); (11, 2); (1, 12); (11, 12); (–11, –12); (–11, 12); (–12, 11); (10, 10); (10, 5).</p> <p>Укажите количество целых значений параметра <i>А</i>, при которых для указанных входных данных программа напечатает «NO» три раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; 1…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "5"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; 10 или t &gt; A. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ 10 и t ≤ A.",
    "Условие s &gt; 10 от A не зависит. Значения s в девяти парах: 1, 11, 1, 11, −11, −11, −12, 10, 10.<br>Больше 10 — только у пар:<br>(11, 2): 11 &gt; 10<br>(11, 12): 11 &gt; 10<br>Эти запуски дают «YES» при любом A. На число «NO» они не влияют.<br>У пар (10, 10) и (10, 5) s = 10, но 10 &gt; 10 — неверно: знак строгий, поэтому за счёт s «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 2 = 7<br>«NO» дают только они: там, где t ≤ A. Значения t в них: 2, 12, −12, 12, 11, 10, 5.<br>По возрастанию: −12, 2, 5, 10, 11, 12, 12.",
    "Нужно ровно три «NO», то есть ровно три значения должны быть не больше A — это три самых маленьких: −12, 2, 5.<br>Каждое из них не больше A, значит, и наибольшее из них — 5 — не больше A: 5 ≤ A, то есть A ≥ 5.<br>Следующее значение 10 уже должно дать «YES»: 10 &gt; A, то есть A &lt; 10.",
    "Подходят целые A от 5 до 9: это 5, 6, 7, 8, 9.<br>Их количество: 9 − 5 + 1 = <b>5</b>"
   ],
   "answerTex": "5",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "B7252C",
   "fipi": "B7252C",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s </p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;A <u>или</u> t&nbsp;&gt;&nbsp;12</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12)</p> <p> then</p> <p> writeln('YES')</p> <p> else</p> <p> writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;A OR t&nbsp;&gt;&nbsp;12 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main() {</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; A || t &gt; 12)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(13, 2); (11, 12); (–12, 12); (2, –2); (–10, –10); (6, –5); (2, 8); (9, 10); (1, 13).</p> <p>Укажите наибольшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «YES» два раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; A…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "12"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 12. Достаточно одного из двух условий.",
    "Условие t &gt; 12 от A не зависит. Значения t в девяти парах: 2, 12, 12, −2, −10, −5, 8, 10, 13.<br>Больше 12 — только у пары:<br>(1, 13): 13 &gt; 12<br>Этот запуск даёт «YES» при любом A.<br>У пар (11, 12) и (−12, 12) t = 12, но 12 &gt; 12 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>Всего «YES» нужно два раза. Один уже есть, значит, от остальных восьми запусков нужно:<br>2 − 1 = 1 раз «YES»",
    "В остальных восьми запусках всё решает условие s &gt; A. Значения s в них: 13, 11, −12, 2, −10, 6, 2, 9.<br>По убыванию: 13, 11, 9, 6, 2, 2, −10, −12.",
    "Ровно одно значение должно быть больше A — это самое большое: 13.<br>Оно больше A: 13 &gt; A, то есть A &lt; 13.<br>Следующее по величине значение 11 уже не должно быть больше A: 11 ≤ A, то есть A ≥ 11.",
    "Подходят целые A от 11 до 12: это 11, 12.<br>Наибольшее из них: <b>12</b>"
   ],
   "answerTex": "12",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "BA5A68",
   "fipi": "BA5A68",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;10 <u>или</u> t&nbsp;&gt;&nbsp;А</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;10 OR t&nbsp;&gt;&nbsp;А THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; 10 || t &gt; А)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table> <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(1, 2); (11, 2); (1, 12); (11, 12); (–11, –12); (–11, 12); (–12, 11); (10, 10); (10, 5).</p> <p>Укажите наименьшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «YES» шесть раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; 1…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "5"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; 10 или t &gt; A. Достаточно одного из двух условий.",
    "Условие s &gt; 10 от A не зависит. Значения s в девяти парах: 1, 11, 1, 11, −11, −11, −12, 10, 10.<br>Больше 10 — только у пар:<br>(11, 2): 11 &gt; 10<br>(11, 12): 11 &gt; 10<br>Эти запуски дают «YES» при любом A.<br>У пар (10, 10) и (10, 5) s = 10, но 10 &gt; 10 — неверно: знак строгий, поэтому за счёт s «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 2 = 7<br>Всего «YES» нужно шесть раз. Два уже есть, значит, от остальных семи запусков нужно:<br>6 − 2 = 4 раза «YES»",
    "В остальных семи запусках всё решает условие t &gt; A. Значения t в них: 2, 12, −12, 12, 11, 10, 5.<br>По убыванию: 12, 12, 11, 10, 5, 2, −12.",
    "Ровно четыре значения должны быть больше A — это четыре самых больших: 12, 12, 11, 10.<br>Каждое из них больше A, значит, и наименьшее из них — 10 — больше A: 10 &gt; A, то есть A &lt; 10.<br>Следующее по величине значение 5 уже не должно быть больше A: 5 ≤ A, то есть A ≥ 5.",
    "Подходят целые A от 5 до 9: это 5, 6, 7, 8, 9.<br>Наименьшее из них: <b>5</b>"
   ],
   "answerTex": "5",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "BB9197",
   "fipi": "BB9197",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;10 <u>или</u> t&nbsp;&gt;&nbsp;А</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;10 OR t&nbsp;&gt;&nbsp;А THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; 10 || t &gt; А)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(1, 2); (11, 2); (1, 12); (11, 12); (–11, –12); (–11, 12); (–12, 11); (10, 10); (10, 5).</p> <p>Укажите количество целых значений параметра <i>А</i>, при которых для указанных входных данных программа напечатает «NO» два раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; 1…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "3"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; 10 или t &gt; A. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ 10 и t ≤ A.",
    "Условие s &gt; 10 от A не зависит. Значения s в девяти парах: 1, 11, 1, 11, −11, −11, −12, 10, 10.<br>Больше 10 — только у пар:<br>(11, 2): 11 &gt; 10<br>(11, 12): 11 &gt; 10<br>Эти запуски дают «YES» при любом A. На число «NO» они не влияют.<br>У пар (10, 10) и (10, 5) s = 10, но 10 &gt; 10 — неверно: знак строгий, поэтому за счёт s «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 2 = 7<br>«NO» дают только они: там, где t ≤ A. Значения t в них: 2, 12, −12, 12, 11, 10, 5.<br>По возрастанию: −12, 2, 5, 10, 11, 12, 12.",
    "Нужно ровно два «NO», то есть ровно два значения должны быть не больше A — это два самых маленьких: −12, 2.<br>Каждое из них не больше A, значит, и наибольшее из них — 2 — не больше A: 2 ≤ A, то есть A ≥ 2.<br>Следующее значение 5 уже должно дать «YES»: 5 &gt; A, то есть A &lt; 5.",
    "Подходят целые A от 2 до 4: это 2, 3, 4.<br>Их количество: 4 − 2 + 1 = <b>3</b>"
   ],
   "answerTex": "3",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "BE0FEB",
   "fipi": "BE0FEB",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s </p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;A <u>или</u> t&nbsp;&gt;&nbsp;12</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12)</p> <p> then</p> <p> writeln('YES')</p> <p> else</p> <p> writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;A OR t&nbsp;&gt;&nbsp;12 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main() {</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; A || t &gt; 12)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(13, 2); (11, 12); (–12, 12); (2, –2); (–10, –10); (6, –5); (2, 8); (9, 10); (1, 13).</p> <p>Укажите количество целых значений параметра <i>А</i>, при которых для указанных входных данных программа напечатает «NO» четыре раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; A…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "4"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 12. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ A и t ≤ 12.",
    "Условие t &gt; 12 от A не зависит. Значения t в девяти парах: 2, 12, 12, −2, −10, −5, 8, 10, 13.<br>Больше 12 — только у пары:<br>(1, 13): 13 &gt; 12<br>Этот запуск даёт «YES» при любом A. На число «NO» он не влияет.<br>У пар (11, 12) и (−12, 12) t = 12, но 12 &gt; 12 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>«NO» дают только они: там, где s ≤ A. Значения s в них: 13, 11, −12, 2, −10, 6, 2, 9.<br>По возрастанию: −12, −10, 2, 2, 6, 9, 11, 13.",
    "Нужно ровно четыре «NO», то есть ровно четыре значения должны быть не больше A — это четыре самых маленьких: −12, −10, 2, 2.<br>Каждое из них не больше A, значит, и наибольшее из них — 2 — не больше A: 2 ≤ A, то есть A ≥ 2.<br>Следующее значение 6 уже должно дать «YES»: 6 &gt; A, то есть A &lt; 6.",
    "Подходят целые A от 2 до 5: это 2, 3, 4, 5.<br>Их количество: 5 − 2 + 1 = <b>4</b>"
   ],
   "answerTex": "4",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "BE18F8",
   "fipi": "BE18F8",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>если</u> <u>не</u> (s&nbsp;&gt;=&nbsp;2 <u>и</u> t&nbsp;&lt;&nbsp;5)</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> if not((s&nbsp;&gt;=&nbsp;2) and (t&nbsp;&lt;&nbsp;5))</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>IF NOT (s&nbsp;&gt;=&nbsp;2 AND t&nbsp;&lt;&nbsp;5) THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>if not ((s&nbsp;&gt;=&nbsp;2) and (t&nbsp;&lt;&nbsp;5)):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> if !((s &gt;= 2) &amp;&amp; (t &lt; 5))</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table> <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(12, 5); (5, 3); (–4, 1); (2, –5); (5, –7); (10, 3); (18, 6); (3, 0); (2, 5).</p> <p>Сколько было запусков, при которых программа напечатала «YES»?</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t ввод s ввод t если не (s &gt;= 2 и t …",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "4"
    }
   ],
   "steps": [
    "Перед скобкой стоит «не»: программа печатает «NO», когда в скобках верно, и «YES», когда в скобках неверно.<br>В скобках: s ≥ 2 и t &lt; 5. Связка «и»: должны выполниться оба условия сразу.<br>Значит, «NO» — когда s ≥ 2 и t &lt; 5, в остальных запусках «YES».",
    "Пары (s, t) из условия — девять запусков:<br>(12, 5)<br>(5, 3)<br>(−4, 1)<br>(2, −5)<br>(5, −7)<br>(10, 3)<br>(18, 6)<br>(3, 0)<br>(2, 5)",
    "Проверяем условие в скобках для каждой пары:<br>(12, 5): 12 ≥ 2 — верно; 5 &lt; 5 — неверно (числа равны, знак строгий). В скобках неверно, «не» меняет на обратное → YES<br>(5, 3): 5 ≥ 2 — верно; 3 &lt; 5 — верно. В скобках верно, «не» меняет на обратное → NO<br>(−4, 1): −4 ≥ 2 — неверно; 1 &lt; 5 — верно. В скобках неверно, «не» меняет на обратное → YES<br>(2, −5): 2 ≥ 2 — верно (числа равны, знак нестрогий — равенство подходит); −5 &lt; 5 — верно. В скобках верно, «не» меняет на обратное → NO<br>(5, −7): 5 ≥ 2 — верно; −7 &lt; 5 — верно. В скобках верно, «не» меняет на обратное → NO<br>(10, 3): 10 ≥ 2 — верно; 3 &lt; 5 — верно. В скобках верно, «не» меняет на обратное → NO<br>(18, 6): 18 ≥ 2 — верно; 6 &lt; 5 — неверно. В скобках неверно, «не» меняет на обратное → YES<br>(3, 0): 3 ≥ 2 — верно; 0 &lt; 5 — верно. В скобках верно, «не» меняет на обратное → NO<br>(2, 5): 2 ≥ 2 — верно (числа равны, знак нестрогий — равенство подходит); 5 &lt; 5 — неверно (числа равны, знак строгий). В скобках неверно, «не» меняет на обратное → YES",
    "«YES» напечатано в запусках: (12, 5), (−4, 1), (18, 6), (2, 5).<br>Их количество: <b>4</b>"
   ],
   "answerTex": "4",
   "hint": "«Не» перед скобкой меняет ответ на противоположный: считаем, где верно условие в скобках, — там «NO».",
   "group": "k3.2"
  },
  {
   "id": "D00553",
   "fipi": "D00553",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;10 <u>или</u> t&nbsp;&gt;&nbsp;А</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;10 OR t&nbsp;&gt;&nbsp;А THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; 10 || t &gt; А)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(1, 2); (11, 2); (1, 12); (11, 12); (–11, –12); (–11, 12); (–12, 11); (10, 10); (10, 5).</p> <p>Укажите наибольшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «NO» три раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; 1…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "9"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; 10 или t &gt; A. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ 10 и t ≤ A.",
    "Условие s &gt; 10 от A не зависит. Значения s в девяти парах: 1, 11, 1, 11, −11, −11, −12, 10, 10.<br>Больше 10 — только у пар:<br>(11, 2): 11 &gt; 10<br>(11, 12): 11 &gt; 10<br>Эти запуски дают «YES» при любом A. На число «NO» они не влияют.<br>У пар (10, 10) и (10, 5) s = 10, но 10 &gt; 10 — неверно: знак строгий, поэтому за счёт s «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 2 = 7<br>«NO» дают только они: там, где t ≤ A. Значения t в них: 2, 12, −12, 12, 11, 10, 5.<br>По возрастанию: −12, 2, 5, 10, 11, 12, 12.",
    "Нужно ровно три «NO», то есть ровно три значения должны быть не больше A — это три самых маленьких: −12, 2, 5.<br>Каждое из них не больше A, значит, и наибольшее из них — 5 — не больше A: 5 ≤ A, то есть A ≥ 5.<br>Следующее значение 10 уже должно дать «YES»: 10 &gt; A, то есть A &lt; 10.",
    "Подходят целые A от 5 до 9: это 5, 6, 7, 8, 9.<br>Наибольшее из них: <b>9</b>"
   ],
   "answerTex": "9",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "D28837",
   "fipi": "D28837",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t</p> <p> <u>ввод</u> s</p> <p> <u>ввод</u> t</p> <p> <u>если</u> s&nbsp;&lt;&nbsp;4 <u>и</u> <u>не</u> t&nbsp;&lt;&nbsp;2</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p> <u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t: integer;</p> <p>begin</p> <p>readln(s);</p> <p> readln(t);</p> <p> if (s&nbsp;&lt;&nbsp;4) and not (t&nbsp;&lt;&nbsp;2)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>IF s&nbsp;&lt;&nbsp;4 AND NOT t&nbsp;&lt;&nbsp;2 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>if (s&nbsp;&lt;&nbsp;4) and not (t&nbsp;&lt;&nbsp;2):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> if ((s &lt; 4) &amp;&amp; !(t &lt; 2))</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table> <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(0, 2); (–1, 0); (2, 3); (4, 2); (3, 1); (–2, 7); (10, –2); (5, 4); (–7, 11).</p> <p>Сколько было запусков, при которых программа напечатала «YES»?</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t ввод s ввод t если s &lt; 4 и не t &lt; …",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "4"
    }
   ],
   "steps": [
    "не (t &lt; 2) верно, когда t &lt; 2 неверно, то есть когда t ≥ 2.<br>Программа печатает «YES», если s &lt; 4 и t ≥ 2, иначе — «NO». Связка «и»: должны выполниться оба условия сразу.",
    "Пары (s, t) из условия — девять запусков:<br>(0, 2)<br>(−1, 0)<br>(2, 3)<br>(4, 2)<br>(3, 1)<br>(−2, 7)<br>(10, −2)<br>(5, 4)<br>(−7, 11)",
    "Проверяем условие для каждой пары:<br>(0, 2): 0 &lt; 4 — верно; 2 ≥ 2 — верно (числа равны, знак нестрогий — равенство подходит) → YES<br>(−1, 0): −1 &lt; 4 — верно; 0 ≥ 2 — неверно → NO<br>(2, 3): 2 &lt; 4 — верно; 3 ≥ 2 — верно → YES<br>(4, 2): 4 &lt; 4 — неверно (числа равны, знак строгий); 2 ≥ 2 — верно (числа равны, знак нестрогий — равенство подходит) → NO<br>(3, 1): 3 &lt; 4 — верно; 1 ≥ 2 — неверно → NO<br>(−2, 7): −2 &lt; 4 — верно; 7 ≥ 2 — верно → YES<br>(10, −2): 10 &lt; 4 — неверно; −2 ≥ 2 — неверно → NO<br>(5, 4): 5 &lt; 4 — неверно; 4 ≥ 2 — верно → NO<br>(−7, 11): −7 &lt; 4 — верно; 11 ≥ 2 — верно → YES",
    "«YES» напечатано в запусках: (0, 2), (2, 3), (−2, 7), (−7, 11).<br>Их количество: <b>4</b>"
   ],
   "answerTex": "4",
   "hint": "Проверяем условие по очереди для каждой из девяти пар и считаем нужные ответы.",
   "group": "k3.2"
  },
  {
   "id": "D49648",
   "fipi": "D49648",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s </p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;A <u>или</u> t&nbsp;&gt;&nbsp;12</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12)</p> <p> then</p> <p> writeln('YES')</p> <p> else</p> <p> writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;A OR t&nbsp;&gt;&nbsp;12 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main() {</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; A || t &gt; 12)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(13, 2); (11, 12); (–12, 12); (2, –2); (–10, –10); (6, –5); (2, 8); (9, 10); (1, 13).</p> <p>Укажите наименьшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «NO» пять раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; A…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "6"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 12. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ A и t ≤ 12.",
    "Условие t &gt; 12 от A не зависит. Значения t в девяти парах: 2, 12, 12, −2, −10, −5, 8, 10, 13.<br>Больше 12 — только у пары:<br>(1, 13): 13 &gt; 12<br>Этот запуск даёт «YES» при любом A. На число «NO» он не влияет.<br>У пар (11, 12) и (−12, 12) t = 12, но 12 &gt; 12 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>«NO» дают только они: там, где s ≤ A. Значения s в них: 13, 11, −12, 2, −10, 6, 2, 9.<br>По возрастанию: −12, −10, 2, 2, 6, 9, 11, 13.",
    "Нужно ровно пять «NO», то есть ровно пять значений должны быть не больше A — это пять самых маленьких: −12, −10, 2, 2, 6.<br>Каждое из них не больше A, значит, и наибольшее из них — 6 — не больше A: 6 ≤ A, то есть A ≥ 6.<br>Следующее значение 9 уже должно дать «YES»: 9 &gt; A, то есть A &lt; 9.",
    "Подходят целые A от 6 до 8: это 6, 7, 8.<br>Наименьшее из них: <b>6</b>"
   ],
   "answerTex": "6",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "DDA24D",
   "fipi": "DDA24D",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;10 <u>или</u> t&nbsp;&gt;&nbsp;А</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;10 OR t&nbsp;&gt;&nbsp;А THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; 10 || t &gt; А)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(1, 2); (11, 2); (1, 12); (11, 12); (–11, –12); (–11, 12); (–12, 11); (10, 10); (10, 5).</p> <p>Укажите целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «NO» пять раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; 1…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "11"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; 10 или t &gt; A. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ 10 и t ≤ A.",
    "Условие s &gt; 10 от A не зависит. Значения s в девяти парах: 1, 11, 1, 11, −11, −11, −12, 10, 10.<br>Больше 10 — только у пар:<br>(11, 2): 11 &gt; 10<br>(11, 12): 11 &gt; 10<br>Эти запуски дают «YES» при любом A. На число «NO» они не влияют.<br>У пар (10, 10) и (10, 5) s = 10, но 10 &gt; 10 — неверно: знак строгий, поэтому за счёт s «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 2 = 7<br>«NO» дают только они: там, где t ≤ A. Значения t в них: 2, 12, −12, 12, 11, 10, 5.<br>По возрастанию: −12, 2, 5, 10, 11, 12, 12.",
    "Нужно ровно пять «NO», то есть ровно пять значений должны быть не больше A — это пять самых маленьких: −12, 2, 5, 10, 11.<br>Каждое из них не больше A, значит, и наибольшее из них — 11 — не больше A: 11 ≤ A, то есть A ≥ 11.<br>Следующее значение 12 уже должно дать «YES»: 12 &gt; A, то есть A &lt; 12.",
    "Нужно 11 ≤ A и A &lt; 12 — подходит единственное целое A: <b>11</b>"
   ],
   "answerTex": "11",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "DE3F55",
   "fipi": "DE3F55",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t</p> <p> <u>ввод</u> s</p> <p> <u>ввод</u> t</p> <p> <u>если</u> s&nbsp;&gt;&nbsp;-3 <u>и</u> <u>не</u> t&nbsp;&gt;&nbsp;5</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p> <u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> if (s&nbsp;&gt;&nbsp;-3) and not (t&nbsp;&gt;&nbsp;5)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>IF s&nbsp;&gt;&nbsp;-3 AND NOT t&nbsp;&gt;&nbsp;5 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;-3) and not (t&nbsp;&gt;&nbsp;5):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> if ((s &gt;-3) &amp;&amp; !(t &gt; 5))</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table> <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(–3, 5); (–2, 2); (–1, –3); (1, 0); (–4, –7); (2, 3); (3, 5); (5, –3); (6, –7).</p> <p>Сколько было запусков, при которых программа напечатала «NO»?</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t ввод s ввод t если s &gt; -3 и не t &gt;…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "2"
    }
   ],
   "steps": [
    "не (t &gt; 5) верно, когда t &gt; 5 неверно, то есть когда t ≤ 5.<br>Программа печатает «YES», если s &gt; −3 и t ≤ 5, иначе — «NO». Связка «и»: должны выполниться оба условия сразу.",
    "Пары (s, t) из условия — девять запусков:<br>(−3, 5)<br>(−2, 2)<br>(−1, −3)<br>(1, 0)<br>(−4, −7)<br>(2, 3)<br>(3, 5)<br>(5, −3)<br>(6, −7)",
    "Проверяем условие для каждой пары:<br>(−3, 5): −3 &gt; −3 — неверно (числа равны, знак строгий); 5 ≤ 5 — верно (числа равны, знак нестрогий — равенство подходит) → NO<br>(−2, 2): −2 &gt; −3 — верно; 2 ≤ 5 — верно → YES<br>(−1, −3): −1 &gt; −3 — верно; −3 ≤ 5 — верно → YES<br>(1, 0): 1 &gt; −3 — верно; 0 ≤ 5 — верно → YES<br>(−4, −7): −4 &gt; −3 — неверно; −7 ≤ 5 — верно → NO<br>(2, 3): 2 &gt; −3 — верно; 3 ≤ 5 — верно → YES<br>(3, 5): 3 &gt; −3 — верно; 5 ≤ 5 — верно (числа равны, знак нестрогий — равенство подходит) → YES<br>(5, −3): 5 &gt; −3 — верно; −3 ≤ 5 — верно → YES<br>(6, −7): 6 &gt; −3 — верно; −7 ≤ 5 — верно → YES",
    "«NO» напечатано в запусках: (−3, 5), (−4, −7).<br>Их количество: <b>2</b>"
   ],
   "answerTex": "2",
   "hint": "Проверяем условие по очереди для каждой из девяти пар и считаем нужные ответы.",
   "group": "k3.2"
  },
  {
   "id": "DFC815",
   "fipi": "DFC815",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;А <u>или</u> t&nbsp;&gt;&nbsp;11</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;А OR t&nbsp;&gt;&nbsp;11 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;А) or (t&nbsp;&gt;&nbsp;11):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; А || t &gt; 11)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(–9, 11); (2, 7); (5, 12); (2, –2); (7, –9); (12, 6); (9, –1); (7, 11); (11, –5).</p> <p>Укажите наибольшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «NO» три раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; А…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "6"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 11. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ A и t ≤ 11.",
    "Условие t &gt; 11 от A не зависит. Значения t в девяти парах: 11, 7, 12, −2, −9, 6, −1, 11, −5.<br>Больше 11 — только у пары:<br>(5, 12): 12 &gt; 11<br>Этот запуск даёт «YES» при любом A. На число «NO» он не влияет.<br>У пар (−9, 11) и (7, 11) t = 11, но 11 &gt; 11 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>«NO» дают только они: там, где s ≤ A. Значения s в них: −9, 2, 2, 7, 12, 9, 7, 11.<br>По возрастанию: −9, 2, 2, 7, 7, 9, 11, 12.",
    "Нужно ровно три «NO», то есть ровно три значения должны быть не больше A — это три самых маленьких: −9, 2, 2.<br>Каждое из них не больше A, значит, и наибольшее из них — 2 — не больше A: 2 ≤ A, то есть A ≥ 2.<br>Следующее значение 7 уже должно дать «YES»: 7 &gt; A, то есть A &lt; 7.",
    "Подходят целые A от 2 до 6: это 2, 3, 4, 5, 6.<br>Наибольшее из них: <b>6</b>"
   ],
   "answerTex": "6",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "E2A437",
   "fipi": "E2A437",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;10 <u>или</u> t&nbsp;&gt;&nbsp;А</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;10 OR t&nbsp;&gt;&nbsp;А THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; 10 || t &gt; А)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table> <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(1, 2); (11, 2); (1, 12); (11, 12); (–11, –12); (–11, 12); (–12, 11); (10, 10); (10, 5).</p> <p>Укажите целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «YES» четыре раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; 1…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "11"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; 10 или t &gt; A. Достаточно одного из двух условий.",
    "Условие s &gt; 10 от A не зависит. Значения s в девяти парах: 1, 11, 1, 11, −11, −11, −12, 10, 10.<br>Больше 10 — только у пар:<br>(11, 2): 11 &gt; 10<br>(11, 12): 11 &gt; 10<br>Эти запуски дают «YES» при любом A.<br>У пар (10, 10) и (10, 5) s = 10, но 10 &gt; 10 — неверно: знак строгий, поэтому за счёт s «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 2 = 7<br>Всего «YES» нужно четыре раза. Два уже есть, значит, от остальных семи запусков нужно:<br>4 − 2 = 2 раза «YES»",
    "В остальных семи запусках всё решает условие t &gt; A. Значения t в них: 2, 12, −12, 12, 11, 10, 5.<br>По убыванию: 12, 12, 11, 10, 5, 2, −12.",
    "Ровно два значения должны быть больше A — это два самых больших: 12, 12.<br>Каждое из них больше A, значит, и наименьшее из них — 12 — больше A: 12 &gt; A, то есть A &lt; 12.<br>Следующее по величине значение 11 уже не должно быть больше A: 11 ≤ A, то есть A ≥ 11.",
    "Нужно 11 ≤ A и A &lt; 12 — подходит единственное целое A: <b>11</b>"
   ],
   "answerTex": "11",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "E5DF04",
   "fipi": "E5DF04",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования.</p>  <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p> <u>цел</u> s, k</p> <p> <u>ввод</u> s</p> <p> <u>ввод</u> k</p> <p> <u>если</u> s &lt; 6 <u>и</u> k &gt; 6</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p> <u>все</u></p> <p><u>кон</u></p> </td> <td> <p>var s, k: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(k);</p> <p> if (s &lt; 6) and (k &gt; 6)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p>  </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM k, s AS INTEGER</p> <p>INPUT s</p> <p>INPUT k</p> <p>IF s &lt; 6 AND k &gt; 6 THEN </p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>END IF</p> </td> <td> <p>s = int(input())</p> <p>k = int(input())</p> <p>if s &lt; 6 and k &gt; 6:</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;) </p>  </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std;</p>  <p>int main() {</p> <p> int s, k;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; k;</p> <p> if (s &lt; 6 &amp;&amp; k &gt; 6)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p>}</p> </td> </tr> </table>   <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>k</i> вводились следующие пары чисел: </p> <p>(1, 11); (5, 9); (8, –12); (6, 6); (3, 11); (–10, –12); (–10, 11); (7, 1); (–12, 7). Сколько было запусков, при которых программа напечатала «YES»?</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, k ввод s ввод k если s &lt; 6 и k &gt; 6 т…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "5"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &lt; 6 и k &gt; 6, иначе — «NO». Связка «и»: должны выполниться оба условия сразу.",
    "Пары (s, k) из условия — девять запусков:<br>(1, 11)<br>(5, 9)<br>(8, −12)<br>(6, 6)<br>(3, 11)<br>(−10, −12)<br>(−10, 11)<br>(7, 1)<br>(−12, 7)",
    "Проверяем условие для каждой пары:<br>(1, 11): 1 &lt; 6 — верно; 11 &gt; 6 — верно → YES<br>(5, 9): 5 &lt; 6 — верно; 9 &gt; 6 — верно → YES<br>(8, −12): 8 &lt; 6 — неверно; −12 &gt; 6 — неверно → NO<br>(6, 6): 6 &lt; 6 — неверно (числа равны, знак строгий); 6 &gt; 6 — неверно (числа равны, знак строгий) → NO<br>(3, 11): 3 &lt; 6 — верно; 11 &gt; 6 — верно → YES<br>(−10, −12): −10 &lt; 6 — верно; −12 &gt; 6 — неверно → NO<br>(−10, 11): −10 &lt; 6 — верно; 11 &gt; 6 — верно → YES<br>(7, 1): 7 &lt; 6 — неверно; 1 &gt; 6 — неверно → NO<br>(−12, 7): −12 &lt; 6 — верно; 7 &gt; 6 — верно → YES",
    "«YES» напечатано в запусках: (1, 11), (5, 9), (3, 11), (−10, 11), (−12, 7).<br>Их количество: <b>5</b>"
   ],
   "answerTex": "5",
   "hint": "Проверяем условие по очереди для каждой из девяти пар и считаем нужные ответы.",
   "group": "k3.2"
  },
  {
   "id": "E9F941",
   "fipi": "E9F941",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;10 <u>или</u> t&nbsp;&gt;&nbsp;A</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;A)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;10 OR t&nbsp;&gt;&nbsp;A THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;A):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; 10 || t &gt; A)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(1, 2); (11, 2); (1, 12); (11, 12); (–11, –12); (–11, 12); (–12, 11); (10, 10); (10, 5).</p> <p>Укажите наименьшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «YES» два раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; 1…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "12"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; 10 или t &gt; A. Достаточно одного из двух условий.",
    "Условие s &gt; 10 от A не зависит. Значения s в девяти парах: 1, 11, 1, 11, −11, −11, −12, 10, 10.<br>Больше 10 — только у пар:<br>(11, 2): 11 &gt; 10<br>(11, 12): 11 &gt; 10<br>Эти запуски дают «YES» при любом A.<br>У пар (10, 10) и (10, 5) s = 10, но 10 &gt; 10 — неверно: знак строгий, поэтому за счёт s «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 2 = 7<br>Всего «YES» нужно два раза. Два уже есть, значит, от остальных семи запусков нужно:<br>2 − 2 = 0 раз «YES»",
    "В остальных семи запусках всё решает условие t &gt; A. Значения t в них: 2, 12, −12, 12, 11, 10, 5.<br>По убыванию: 12, 12, 11, 10, 5, 2, −12.",
    "Ни одно из этих значений не должно быть больше A, то есть все они ≤ A. Значит, и самое большое из них — 12 — не больше A: 12 ≤ A, то есть A ≥ 12.<br>Наименьшее такое целое A: <b>12</b>"
   ],
   "answerTex": "12",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  },
  {
   "id": "EB5DF6",
   "fipi": "EB5DF6",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t</p> <p> <u>ввод</u> s</p> <p> <u>ввод</u> t</p> <p> <u>если</u> s&nbsp;&lt;&nbsp;5 <u>и</u> <u>не</u> t&nbsp;&gt;&nbsp;3</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p> <u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> if (s&nbsp;&lt;&nbsp;5) and not (t&nbsp;&gt;&nbsp;3)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>IF s&nbsp;&lt;&nbsp;5 AND NOT t&nbsp;&gt;&nbsp;3 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>if (s&nbsp;&lt;&nbsp;5) and not (t&nbsp;&gt;&nbsp;3):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> if ((s &lt; 5) &amp;&amp; !(t &gt; 3))</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table> <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(2, –2); (–2, 4); (4, 1); (–12, 5); (0, –7); (1, 3); (8, 2); (3, 0); (23, 1).</p> <p>Сколько было запусков, при которых программа напечатала «NO»?</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t ввод s ввод t если s &lt; 5 и не t &gt; …",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "4"
    }
   ],
   "steps": [
    "не (t &gt; 3) верно, когда t &gt; 3 неверно, то есть когда t ≤ 3.<br>Программа печатает «YES», если s &lt; 5 и t ≤ 3, иначе — «NO». Связка «и»: должны выполниться оба условия сразу.",
    "Пары (s, t) из условия — девять запусков:<br>(2, −2)<br>(−2, 4)<br>(4, 1)<br>(−12, 5)<br>(0, −7)<br>(1, 3)<br>(8, 2)<br>(3, 0)<br>(23, 1)",
    "Проверяем условие для каждой пары:<br>(2, −2): 2 &lt; 5 — верно; −2 ≤ 3 — верно → YES<br>(−2, 4): −2 &lt; 5 — верно; 4 ≤ 3 — неверно → NO<br>(4, 1): 4 &lt; 5 — верно; 1 ≤ 3 — верно → YES<br>(−12, 5): −12 &lt; 5 — верно; 5 ≤ 3 — неверно → NO<br>(0, −7): 0 &lt; 5 — верно; −7 ≤ 3 — верно → YES<br>(1, 3): 1 &lt; 5 — верно; 3 ≤ 3 — верно (числа равны, знак нестрогий — равенство подходит) → YES<br>(8, 2): 8 &lt; 5 — неверно; 2 ≤ 3 — верно → NO<br>(3, 0): 3 &lt; 5 — верно; 0 ≤ 3 — верно → YES<br>(23, 1): 23 &lt; 5 — неверно; 1 ≤ 3 — верно → NO",
    "«NO» напечатано в запусках: (−2, 4), (−12, 5), (8, 2), (23, 1).<br>Их количество: <b>4</b>"
   ],
   "answerTex": "4",
   "hint": "Проверяем условие по очереди для каждой из девяти пар и считаем нужные ответы.",
   "group": "k3.2"
  },
  {
   "id": "EFDD84",
   "fipi": "EFDD84",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;10 <u>или</u> t&nbsp;&gt;&nbsp;А</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p>readln(s);</p> <p>readln(t);</p> <p>readln(A);</p> <p>if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;10 OR t&nbsp;&gt;&nbsp;А THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; 10 || t &gt; А)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(1, 2); (11, 2); (1, 12); (11, 12); (–11, –12); (–11, 12); (–12, 11); (10, 10); (10, 5).</p> <p>Укажите наименьшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «NO» три раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; 1…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "5"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; 10 или t &gt; A. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ 10 и t ≤ A.",
    "Условие s &gt; 10 от A не зависит. Значения s в девяти парах: 1, 11, 1, 11, −11, −11, −12, 10, 10.<br>Больше 10 — только у пар:<br>(11, 2): 11 &gt; 10<br>(11, 12): 11 &gt; 10<br>Эти запуски дают «YES» при любом A. На число «NO» они не влияют.<br>У пар (10, 10) и (10, 5) s = 10, но 10 &gt; 10 — неверно: знак строгий, поэтому за счёт s «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 2 = 7<br>«NO» дают только они: там, где t ≤ A. Значения t в них: 2, 12, −12, 12, 11, 10, 5.<br>По возрастанию: −12, 2, 5, 10, 11, 12, 12.",
    "Нужно ровно три «NO», то есть ровно три значения должны быть не больше A — это три самых маленьких: −12, 2, 5.<br>Каждое из них не больше A, значит, и наибольшее из них — 5 — не больше A: 5 ≤ A, то есть A ≥ 5.<br>Следующее значение 10 уже должно дать «YES»: 10 &gt; A, то есть A &lt; 10.",
    "Подходят целые A от 5 до 9: это 5, 6, 7, 8, 9.<br>Наименьшее из них: <b>5</b>"
   ],
   "answerTex": "5",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "F0B088",
   "fipi": "F0B088",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s </p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;A <u>или</u> t&nbsp;&gt;&nbsp;12</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12)</p> <p> then</p> <p> writeln('YES')</p> <p> else</p> <p> writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;A OR t&nbsp;&gt;&nbsp;12 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main() {</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; A || t &gt; 12)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(13, 2); (11, 12); (–12, 12); (2, –2); (–10, –10); (6, –5); (2, 8); (9, 10); (1, 13).</p> <p>Укажите наибольшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «NO» шесть раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; A…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "10"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 12. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ A и t ≤ 12.",
    "Условие t &gt; 12 от A не зависит. Значения t в девяти парах: 2, 12, 12, −2, −10, −5, 8, 10, 13.<br>Больше 12 — только у пары:<br>(1, 13): 13 &gt; 12<br>Этот запуск даёт «YES» при любом A. На число «NO» он не влияет.<br>У пар (11, 12) и (−12, 12) t = 12, но 12 &gt; 12 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>«NO» дают только они: там, где s ≤ A. Значения s в них: 13, 11, −12, 2, −10, 6, 2, 9.<br>По возрастанию: −12, −10, 2, 2, 6, 9, 11, 13.",
    "Нужно ровно шесть «NO», то есть ровно шесть значений должны быть не больше A — это шесть самых маленьких: −12, −10, 2, 2, 6, 9.<br>Каждое из них не больше A, значит, и наибольшее из них — 9 — не больше A: 9 ≤ A, то есть A ≥ 9.<br>Следующее значение 11 уже должно дать «YES»: 11 &gt; A, то есть A &lt; 11.",
    "Подходят целые A от 9 до 10: это 9, 10.<br>Наибольшее из них: <b>10</b>"
   ],
   "answerTex": "10",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "F470B2",
   "fipi": "F470B2",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s </p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;A <u>или</u> t&nbsp;&gt;&nbsp;12</p> <p> <u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p> <u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12)</p> <p> then</p> <p> writeln('YES')</p> <p> else</p> <p> writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;A OR t&nbsp;&gt;&nbsp;12 THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;A) or (t&nbsp;&gt;&nbsp;12):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main() {</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; A || t &gt; 12)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(13, 2); (11, 12); (–12, 12); (2, –2); (–10, –10); (6, –5); (2, 8); (9, 10); (1, 13).</p> <p>Укажите наименьшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «NO» четыре раза.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; A…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "2"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; A или t &gt; 12. Достаточно одного из двух условий.<br>«NO» печатается, только когда оба условия неверны: s ≤ A и t ≤ 12.",
    "Условие t &gt; 12 от A не зависит. Значения t в девяти парах: 2, 12, 12, −2, −10, −5, 8, 10, 13.<br>Больше 12 — только у пары:<br>(1, 13): 13 &gt; 12<br>Этот запуск даёт «YES» при любом A. На число «NO» он не влияет.<br>У пар (11, 12) и (−12, 12) t = 12, но 12 &gt; 12 — неверно: знак строгий, поэтому за счёт t «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 1 = 8<br>«NO» дают только они: там, где s ≤ A. Значения s в них: 13, 11, −12, 2, −10, 6, 2, 9.<br>По возрастанию: −12, −10, 2, 2, 6, 9, 11, 13.",
    "Нужно ровно четыре «NO», то есть ровно четыре значения должны быть не больше A — это четыре самых маленьких: −12, −10, 2, 2.<br>Каждое из них не больше A, значит, и наибольшее из них — 2 — не больше A: 2 ≤ A, то есть A ≥ 2.<br>Следующее значение 6 уже должно дать «YES»: 6 &gt; A, то есть A &lt; 6.",
    "Подходят целые A от 2 до 5: это 2, 3, 4, 5.<br>Наименьшее из них: <b>2</b>"
   ],
   "answerTex": "2",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом подбираем A под нужное число «NO».",
   "group": "k3.2"
  },
  {
   "id": "F78DBB",
   "fipi": "F78DBB",
   "ok": 1,
   "h": 0,
   "text": "<div class=\"soc-text\"><p>Ниже приведена программа, записанная на пяти языках программирования. </p> <table class=\"grid\"> <tr> <td> <p><b>Алгоритмический язык</b></p> </td> <td> <p><b>Паскаль</b></p> </td> </tr> <tr> <td> <p><u>алг</u></p> <p><u>нач</u></p> <p><u>цел</u> s, t, A</p> <p><u>ввод</u> s</p> <p><u>ввод</u> t</p> <p><u>ввод</u> A</p> <p><u>если</u> s&nbsp;&gt;&nbsp;10 <u>или</u> t&nbsp;&gt;&nbsp;А</p> <p><u>то</u> <u>вывод</u> &quot;YES&quot;</p> <p><u>иначе</u> <u>вывод</u> &quot;NO&quot;</p> <p><u>все</u> </p> <p><u>кон</u></p> </td> <td> <p>var s, t, A: integer;</p> <p>begin</p> <p> readln(s);</p> <p> readln(t);</p> <p> readln(A);</p> <p> if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А)</p> <p> then writeln('YES')</p> <p> else writeln('NO')</p> <p>end.</p> </td> </tr> <tr> <td> <p><b>Бейсик</b></p> </td> <td> <p><b>Python</b></p> </td> </tr> <tr> <td> <p>DIM s, t, A AS INTEGER</p> <p>INPUT s</p> <p>INPUT t</p> <p>INPUT A</p> <p>IF s&nbsp;&gt;&nbsp;10 OR t&nbsp;&gt;&nbsp;А THEN</p> <p> PRINT &quot;YES&quot;</p> <p>ELSE</p> <p> PRINT &quot;NO&quot;</p> <p>ENDIF</p> </td> <td> <p>s = int(input())</p> <p>t = int(input())</p> <p>A = int(input())</p> <p>if (s&nbsp;&gt;&nbsp;10) or (t&nbsp;&gt;&nbsp;А):</p> <p> print(&quot;YES&quot;)</p> <p>else:</p> <p> print(&quot;NO&quot;)</p> </td> </tr> <tr> <td colspan=\"2\"> <p><b>C++</b></p> </td> </tr> <tr> <td colspan=\"2\"> <p>#include &lt;iostream&gt;</p> <p>using namespace std; </p>  <p>int main(){</p> <p> int s, t, A;</p> <p> cin &gt;&gt; s;</p> <p> cin &gt;&gt; t;</p> <p> cin &gt;&gt; A;</p> <p> if (s &gt; 10 || t &gt; А)</p> <p> cout &lt;&lt; &quot;YES&quot; &lt;&lt; endl;</p> <p> else</p> <p> cout &lt;&lt; &quot;NO&quot; &lt;&lt; endl;</p> <p> return 0;</p> <p> }</p> </td> </tr> </table>  <p>Было проведено 9 запусков программы, при которых в качестве значений переменных <i>s</i> и <i>t</i> вводились следующие пары чисел:</p> <p>(1, 2); (11, 2); (1, 12); (11, 12); (–11, –12); (–11, 12); (–12, 11); (10, 10); (10, 5).</p> <p>Укажите наибольшее целое значение параметра <i>А</i>, при котором для указанных входных данных программа напечатает «YES» восемь раз.</p></div>",
   "peek": "Ниже приведена программа, записанная на пяти языках программирования. Алгоритмический язык Паскаль алг нач цел s, t, A ввод s ввод t ввод A если s &gt; 1…",
   "fields": [
    {
     "id": "a",
     "label": "Ответ:",
     "type": "plain",
     "value": "1"
    }
   ],
   "steps": [
    "Программа печатает «YES», если s &gt; 10 или t &gt; A. Достаточно одного из двух условий.",
    "Условие s &gt; 10 от A не зависит. Значения s в девяти парах: 1, 11, 1, 11, −11, −11, −12, 10, 10.<br>Больше 10 — только у пар:<br>(11, 2): 11 &gt; 10<br>(11, 12): 11 &gt; 10<br>Эти запуски дают «YES» при любом A.<br>У пар (10, 10) и (10, 5) s = 10, но 10 &gt; 10 — неверно: знак строгий, поэтому за счёт s «YES» эти запуски не получают.",
    "Остальных запусков:<br>9 − 2 = 7<br>Всего «YES» нужно восемь раз. Два уже есть, значит, от остальных семи запусков нужно:<br>8 − 2 = 6 раз «YES»",
    "В остальных семи запусках всё решает условие t &gt; A. Значения t в них: 2, 12, −12, 12, 11, 10, 5.<br>По убыванию: 12, 12, 11, 10, 5, 2, −12.",
    "Ровно шесть значений должны быть больше A — это шесть самых больших: 12, 12, 11, 10, 5, 2.<br>Каждое из них больше A, значит, и наименьшее из них — 2 — больше A: 2 &gt; A, то есть A &lt; 2.<br>Следующее по величине значение −12 уже не должно быть больше A: −12 ≤ A, то есть A ≥ −12.",
    "Подходят целые A от −12 до 1.<br>Наибольшее из них: <b>1</b>"
   ],
   "answerTex": "1",
   "hint": "Сначала отделяем запуски, где «YES» не зависит от A, потом смотрим, сколько «YES» должно дать условие с A.",
   "group": "k3.2"
  }
 ]
}
;
if(new URLSearchParams(location.search).get('all')==='1'){(window.INF_OGE_FIPI.tasks['6'].protos).forEach(p=>{const flags='Ключ принят ФИПИ'+(p.h?' · h: номер определён по признакам':'');p.src='Открытый банк заданий ФИПИ · '+flags;p.text='<div class="soc-note">'+flags+'</div>'+p.text;});}
