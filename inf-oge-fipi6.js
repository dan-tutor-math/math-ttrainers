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
    "Ответ, принятый открытым банком ФИПИ: <b>5</b>."
   ],
   "answerTex": "5",
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
    "Ответ, принятый открытым банком ФИПИ: <b>6</b>."
   ],
   "answerTex": "6",
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
    "Ответ, принятый открытым банком ФИПИ: <b>2</b>."
   ],
   "answerTex": "2",
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
    "Ответ, принятый открытым банком ФИПИ: <b>1</b>."
   ],
   "answerTex": "1",
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
    "Ответ, принятый открытым банком ФИПИ: <b>10</b>."
   ],
   "answerTex": "10",
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
    "Ответ, принятый открытым банком ФИПИ: <b>2</b>."
   ],
   "answerTex": "2",
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
    "Ответ, принятый открытым банком ФИПИ: <b>9</b>."
   ],
   "answerTex": "9",
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
    "Ответ, принятый открытым банком ФИПИ: <b>8</b>."
   ],
   "answerTex": "8",
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
    "Ответ, принятый открытым банком ФИПИ: <b>3</b>."
   ],
   "answerTex": "3",
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
    "Ответ, принятый открытым банком ФИПИ: <b>3</b>."
   ],
   "answerTex": "3",
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
    "Ответ, принятый открытым банком ФИПИ: <b>6</b>."
   ],
   "answerTex": "6",
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
    "Ответ, принятый открытым банком ФИПИ: <b>12</b>."
   ],
   "answerTex": "12",
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
    "Ответ, принятый открытым банком ФИПИ: <b>3</b>."
   ],
   "answerTex": "3",
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
    "Ответ, принятый открытым банком ФИПИ: <b>2</b>."
   ],
   "answerTex": "2",
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
    "Ответ, принятый открытым банком ФИПИ: <b>4</b>."
   ],
   "answerTex": "4",
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
    "Ответ, принятый открытым банком ФИПИ: <b>4</b>."
   ],
   "answerTex": "4",
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
    "Ответ, принятый открытым банком ФИПИ: <b>10</b>."
   ],
   "answerTex": "10",
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
    "Ответ, принятый открытым банком ФИПИ: <b>2</b>."
   ],
   "answerTex": "2",
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
    "Ответ, принятый открытым банком ФИПИ: <b>8</b>."
   ],
   "answerTex": "8",
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
    "Ответ, принятый открытым банком ФИПИ: <b>1</b>."
   ],
   "answerTex": "1",
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
    "Ответ, принятый открытым банком ФИПИ: <b>8</b>."
   ],
   "answerTex": "8",
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
    "Ответ, принятый открытым банком ФИПИ: <b>2</b>."
   ],
   "answerTex": "2",
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
    "Ответ, принятый открытым банком ФИПИ: <b>2</b>."
   ],
   "answerTex": "2",
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
    "Ответ, принятый открытым банком ФИПИ: <b>2</b>."
   ],
   "answerTex": "2",
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
    "Ответ, принятый открытым банком ФИПИ: <b>3</b>."
   ],
   "answerTex": "3",
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
    "Ответ, принятый открытым банком ФИПИ: <b>10</b>."
   ],
   "answerTex": "10",
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
    "Ответ, принятый открытым банком ФИПИ: <b>7</b>."
   ],
   "answerTex": "7",
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
    "Ответ, принятый открытым банком ФИПИ: <b>5</b>."
   ],
   "answerTex": "5",
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
    "Ответ, принятый открытым банком ФИПИ: <b>5</b>."
   ],
   "answerTex": "5",
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
    "Ответ, принятый открытым банком ФИПИ: <b>5</b>."
   ],
   "answerTex": "5",
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
    "Ответ, принятый открытым банком ФИПИ: <b>12</b>."
   ],
   "answerTex": "12",
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
    "Ответ, принятый открытым банком ФИПИ: <b>9</b>."
   ],
   "answerTex": "9",
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
    "Ответ, принятый открытым банком ФИПИ: <b>6</b>."
   ],
   "answerTex": "6",
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
    "Ответ, принятый открытым банком ФИПИ: <b>2</b>."
   ],
   "answerTex": "2",
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
    "Ответ, принятый открытым банком ФИПИ: <b>9</b>."
   ],
   "answerTex": "9",
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
    "Ответ, принятый открытым банком ФИПИ: <b>7</b>."
   ],
   "answerTex": "7",
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
    "Ответ, принятый открытым банком ФИПИ: <b>2</b>."
   ],
   "answerTex": "2",
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
    "Ответ, принятый открытым банком ФИПИ: <b>2</b>."
   ],
   "answerTex": "2",
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
    "Ответ, принятый открытым банком ФИПИ: <b>7</b>."
   ],
   "answerTex": "7",
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
    "Ответ, принятый открытым банком ФИПИ: <b>10</b>."
   ],
   "answerTex": "10",
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
    "Ответ, принятый открытым банком ФИПИ: <b>4</b>."
   ],
   "answerTex": "4",
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
    "Ответ, принятый открытым банком ФИПИ: <b>10</b>."
   ],
   "answerTex": "10",
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
    "Ответ, принятый открытым банком ФИПИ: <b>3</b>."
   ],
   "answerTex": "3",
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
    "Ответ, принятый открытым банком ФИПИ: <b>5</b>."
   ],
   "answerTex": "5",
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
    "Ответ, принятый открытым банком ФИПИ: <b>8</b>."
   ],
   "answerTex": "8",
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
    "Ответ, принятый открытым банком ФИПИ: <b>9</b>."
   ],
   "answerTex": "9",
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
    "Ответ, принятый открытым банком ФИПИ: <b>13</b>."
   ],
   "answerTex": "13",
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
    "Ответ, принятый открытым банком ФИПИ: <b>5</b>."
   ],
   "answerTex": "5",
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
    "Ответ, принятый открытым банком ФИПИ: <b>3</b>."
   ],
   "answerTex": "3",
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
    "Ответ, принятый открытым банком ФИПИ: <b>9</b>."
   ],
   "answerTex": "9",
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
    "Ответ, принятый открытым банком ФИПИ: <b>4</b>."
   ],
   "answerTex": "4",
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
    "Ответ, принятый открытым банком ФИПИ: <b>11</b>."
   ],
   "answerTex": "11",
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
    "Ответ, принятый открытым банком ФИПИ: <b>2</b>."
   ],
   "answerTex": "2",
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
    "Ответ, принятый открытым банком ФИПИ: <b>5</b>."
   ],
   "answerTex": "5",
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
    "Ответ, принятый открытым банком ФИПИ: <b>4</b>."
   ],
   "answerTex": "4",
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
    "Ответ, принятый открытым банком ФИПИ: <b>5</b>."
   ],
   "answerTex": "5",
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
    "Ответ, принятый открытым банком ФИПИ: <b>11</b>."
   ],
   "answerTex": "11",
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
    "Ответ, принятый открытым банком ФИПИ: <b>5</b>."
   ],
   "answerTex": "5",
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
    "Ответ, принятый открытым банком ФИПИ: <b>12</b>."
   ],
   "answerTex": "12",
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
    "Ответ, принятый открытым банком ФИПИ: <b>5</b>."
   ],
   "answerTex": "5",
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
    "Ответ, принятый открытым банком ФИПИ: <b>3</b>."
   ],
   "answerTex": "3",
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
    "Ответ, принятый открытым банком ФИПИ: <b>4</b>."
   ],
   "answerTex": "4",
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
    "Ответ, принятый открытым банком ФИПИ: <b>4</b>."
   ],
   "answerTex": "4",
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
    "Ответ, принятый открытым банком ФИПИ: <b>9</b>."
   ],
   "answerTex": "9",
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
    "Ответ, принятый открытым банком ФИПИ: <b>4</b>."
   ],
   "answerTex": "4",
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
    "Ответ, принятый открытым банком ФИПИ: <b>6</b>."
   ],
   "answerTex": "6",
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
    "Ответ, принятый открытым банком ФИПИ: <b>11</b>."
   ],
   "answerTex": "11",
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
    "Ответ, принятый открытым банком ФИПИ: <b>2</b>."
   ],
   "answerTex": "2",
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
    "Ответ, принятый открытым банком ФИПИ: <b>6</b>."
   ],
   "answerTex": "6",
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
    "Ответ, принятый открытым банком ФИПИ: <b>11</b>."
   ],
   "answerTex": "11",
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
    "Ответ, принятый открытым банком ФИПИ: <b>5</b>."
   ],
   "answerTex": "5",
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
    "Ответ, принятый открытым банком ФИПИ: <b>12</b>."
   ],
   "answerTex": "12",
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
    "Ответ, принятый открытым банком ФИПИ: <b>4</b>."
   ],
   "answerTex": "4",
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
    "Ответ, принятый открытым банком ФИПИ: <b>5</b>."
   ],
   "answerTex": "5",
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
    "Ответ, принятый открытым банком ФИПИ: <b>10</b>."
   ],
   "answerTex": "10",
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
    "Ответ, принятый открытым банком ФИПИ: <b>2</b>."
   ],
   "answerTex": "2",
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
    "Ответ, принятый открытым банком ФИПИ: <b>1</b>."
   ],
   "answerTex": "1",
   "group": "k3.2"
  }
 ]
}
;
if(new URLSearchParams(location.search).get('all')==='1'){(window.INF_OGE_FIPI.tasks['6'].protos).forEach(p=>{const flags='Ключ принят ФИПИ'+(p.h?' · h: номер определён по признакам':'');p.src='Открытый банк заданий ФИПИ · '+flags;p.text='<div class="soc-note">'+flags+'</div>'+p.text;});}
