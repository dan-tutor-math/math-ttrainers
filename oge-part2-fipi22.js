/* oge-part2-fipi22.js — задания ОГЭ №22 из открытого банка ФИПИ.
   Собирается скриптом (fipi-pilot/tools/n20_export.py), руками не правится.
   Грузится страницей oge_part2.html только когда открыт №22 (ensureFipi);
   формат и происхождение — в оглавлении oge-part2-fipi.js. */
(function(){ var F = window.OGE_PART2_FIGS = window.OGE_PART2_FIGS || {}; var add = {"22.fipi.90FF4E":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 228 264\" role=\"img\" aria-label=\"График функции\" style=\"max-width:228px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"200\" height=\"240\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V240\"/><path d=\"M20 0V240\"/><path d=\"M40 0V240\"/><path d=\"M60 0V240\"/><path d=\"M80 0V240\"/><path d=\"M100 0V240\"/><path d=\"M120 0V240\"/><path d=\"M140 0V240\"/><path d=\"M160 0V240\"/><path d=\"M180 0V240\"/><path d=\"M200 0V240\"/><path d=\"M0 240 H200\"/><path d=\"M0 220 H200\"/><path d=\"M0 200 H200\"/><path d=\"M0 180 H200\"/><path d=\"M0 160 H200\"/><path d=\"M0 140 H200\"/><path d=\"M0 120 H200\"/><path d=\"M0 100 H200\"/><path d=\"M0 80 H200\"/><path d=\"M0 60 H200\"/><path d=\"M0 40 H200\"/><path d=\"M0 20 H200\"/><path d=\"M0 0 H200\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M140 0V240\"/><path d=\"M0 160H200\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"171\">-7</text><text x=\"20\" y=\"171\">-6</text><text x=\"40\" y=\"171\">-5</text><text x=\"60\" y=\"171\">-4</text><text x=\"80\" y=\"171\">-3</text><text x=\"100\" y=\"171\">-2</text><text x=\"120\" y=\"171\">-1</text><text x=\"160\" y=\"171\">1</text><text x=\"180\" y=\"171\">2</text><text x=\"200\" y=\"171\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"137\" y=\"243\">-4</text><text x=\"137\" y=\"223\">-3</text><text x=\"137\" y=\"203\">-2</text><text x=\"137\" y=\"183\">-1</text><text x=\"137\" y=\"143\">1</text><text x=\"137\" y=\"123\">2</text><text x=\"137\" y=\"103\">3</text><text x=\"137\" y=\"83\">4</text><text x=\"137\" y=\"63\">5</text><text x=\"137\" y=\"43\">6</text><text x=\"137\" y=\"23\">7</text><text x=\"137\" y=\"3\">8</text></g><path d=\"M60.0 180.0 L62.0 183.8 L64.0 187.2 L66.0 190.2 L68.0 192.8 L70.0 195.0 L72.0 196.8 L74.0 198.2 L76.0 199.2 L78.0 199.8 L80.0 200.0 L82.0 199.8 L84.0 199.2 L86.0 198.2 L88.0 196.8 L90.0 195.0 L92.0 192.8 L94.0 190.2 L96.0 187.2 L98.0 183.8 L100.0 180.0 L102.0 175.8 L104.0 171.2 L106.0 166.2 L108.0 160.8 L110.0 155.0 L112.0 148.8 L114.0 142.2 L116.0 135.2 L118.0 127.8 L120.0 120.0 L122.0 111.8 L124.0 103.2 L126.0 94.2 L128.0 84.8 L130.0 75.0 L132.0 64.8 L134.0 54.2 L136.0 43.2 L138.0 31.8 L140.0 20.0 L142.0 7.8 L144.0 -4.8M0.0 100.0 L30.0 70.0 L60.0 40.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"40.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"60.0\" cy=\"180.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.675547":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 308 244\" role=\"img\" aria-label=\"График функции\" style=\"max-width:308px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"280\" height=\"220\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V220\"/><path d=\"M20 0V220\"/><path d=\"M40 0V220\"/><path d=\"M60 0V220\"/><path d=\"M80 0V220\"/><path d=\"M100 0V220\"/><path d=\"M120 0V220\"/><path d=\"M140 0V220\"/><path d=\"M160 0V220\"/><path d=\"M180 0V220\"/><path d=\"M200 0V220\"/><path d=\"M220 0V220\"/><path d=\"M240 0V220\"/><path d=\"M260 0V220\"/><path d=\"M280 0V220\"/><path d=\"M0 220 H280\"/><path d=\"M0 200 H280\"/><path d=\"M0 180 H280\"/><path d=\"M0 160 H280\"/><path d=\"M0 140 H280\"/><path d=\"M0 120 H280\"/><path d=\"M0 100 H280\"/><path d=\"M0 80 H280\"/><path d=\"M0 60 H280\"/><path d=\"M0 40 H280\"/><path d=\"M0 20 H280\"/><path d=\"M0 0 H280\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M220 0V220\"/><path d=\"M0 40H280\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-11</text><text x=\"20\" y=\"51\">-10</text><text x=\"40\" y=\"51\">-9</text><text x=\"60\" y=\"51\">-8</text><text x=\"80\" y=\"51\">-7</text><text x=\"100\" y=\"51\">-6</text><text x=\"120\" y=\"51\">-5</text><text x=\"140\" y=\"51\">-4</text><text x=\"160\" y=\"51\">-3</text><text x=\"180\" y=\"51\">-2</text><text x=\"200\" y=\"51\">-1</text><text x=\"240\" y=\"51\">1</text><text x=\"260\" y=\"51\">2</text><text x=\"280\" y=\"51\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"217\" y=\"223\">-9</text><text x=\"217\" y=\"203\">-8</text><text x=\"217\" y=\"183\">-7</text><text x=\"217\" y=\"163\">-6</text><text x=\"217\" y=\"143\">-5</text><text x=\"217\" y=\"123\">-4</text><text x=\"217\" y=\"103\">-3</text><text x=\"217\" y=\"83\">-2</text><text x=\"217\" y=\"63\">-1</text><text x=\"217\" y=\"23\">1</text><text x=\"217\" y=\"3\">2</text></g><path d=\"M18.0 -6.2 L20.0 0.0 L22.0 5.8 L24.0 11.2 L26.0 16.2 L28.0 20.8 L30.0 25.0 L32.0 28.8 L34.0 32.2 L36.0 35.2 L38.0 37.8 L40.0 40.0 L42.0 41.8 L44.0 43.2 L46.0 44.2 L48.0 44.8 L50.0 45.0 L52.0 44.8 L54.0 44.2 L56.0 43.2 L58.0 41.8 L60.0 40.0M60.0 40.0 L62.0 49.8 L64.0 59.2 L66.0 68.2 L68.0 76.8 L70.0 85.0 L72.0 92.8 L74.0 100.2 L76.0 107.2 L78.0 113.8 L80.0 120.0 L82.0 125.8 L84.0 131.2 L86.0 136.2 L88.0 140.8 L90.0 145.0 L92.0 148.8 L94.0 152.2 L96.0 155.2 L98.0 157.8 L100.0 160.0 L102.0 161.8 L104.0 163.2 L106.0 164.2 L108.0 164.8 L110.0 165.0 L112.0 164.8 L114.0 164.2 L116.0 163.2 L118.0 161.8 L120.0 160.0 L122.0 157.8 L124.0 155.2 L126.0 152.2 L128.0 148.8 L130.0 145.0 L132.0 140.8 L134.0 136.2 L136.0 131.2 L138.0 125.8 L140.0 120.0 L142.0 113.8 L144.0 107.2 L146.0 100.2 L148.0 92.8 L150.0 85.0 L152.0 76.8 L154.0 68.2 L156.0 59.2 L158.0 49.8 L160.0 40.0 L162.0 29.8 L164.0 19.2 L166.0 8.2 L168.0 -3.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"40.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.6DCB49":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 248 444\" role=\"img\" aria-label=\"График функции\" style=\"max-width:248px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"220\" height=\"420\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V420\"/><path d=\"M20 0V420\"/><path d=\"M40 0V420\"/><path d=\"M60 0V420\"/><path d=\"M80 0V420\"/><path d=\"M100 0V420\"/><path d=\"M120 0V420\"/><path d=\"M140 0V420\"/><path d=\"M160 0V420\"/><path d=\"M180 0V420\"/><path d=\"M200 0V420\"/><path d=\"M220 0V420\"/><path d=\"M0 420 H220\"/><path d=\"M0 400 H220\"/><path d=\"M0 380 H220\"/><path d=\"M0 360 H220\"/><path d=\"M0 340 H220\"/><path d=\"M0 320 H220\"/><path d=\"M0 300 H220\"/><path d=\"M0 280 H220\"/><path d=\"M0 260 H220\"/><path d=\"M0 240 H220\"/><path d=\"M0 220 H220\"/><path d=\"M0 200 H220\"/><path d=\"M0 180 H220\"/><path d=\"M0 160 H220\"/><path d=\"M0 140 H220\"/><path d=\"M0 120 H220\"/><path d=\"M0 100 H220\"/><path d=\"M0 80 H220\"/><path d=\"M0 60 H220\"/><path d=\"M0 40 H220\"/><path d=\"M0 20 H220\"/><path d=\"M0 0 H220\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V420\"/><path d=\"M0 180H220\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"191\">-5</text><text x=\"20\" y=\"191\">-4</text><text x=\"40\" y=\"191\">-3</text><text x=\"60\" y=\"191\">-2</text><text x=\"80\" y=\"191\">-1</text><text x=\"120\" y=\"191\">1</text><text x=\"140\" y=\"191\">2</text><text x=\"160\" y=\"191\">3</text><text x=\"180\" y=\"191\">4</text><text x=\"200\" y=\"191\">5</text><text x=\"220\" y=\"191\">6</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"423\">-12</text><text x=\"97\" y=\"383\">-10</text><text x=\"97\" y=\"343\">-8</text><text x=\"97\" y=\"303\">-6</text><text x=\"97\" y=\"263\">-4</text><text x=\"97\" y=\"223\">-2</text><text x=\"97\" y=\"143\">2</text><text x=\"97\" y=\"103\">4</text><text x=\"97\" y=\"63\">6</text><text x=\"97\" y=\"23\">8</text></g><path d=\"M0.0 180.0 L2.0 170.2 L4.0 160.8 L6.0 151.8 L8.0 143.2 L10.0 135.0 L12.0 127.2 L14.0 119.8 L16.0 112.8 L18.0 106.2 L20.0 100.0 L22.0 94.2 L24.0 88.8 L26.0 83.8 L28.0 79.2 L30.0 75.0 L32.0 71.2 L34.0 67.8 L36.0 64.8 L38.0 62.2 L40.0 60.0 L42.0 58.2 L44.0 56.8 L46.0 55.8 L48.0 55.2 L50.0 55.0 L52.0 55.2 L54.0 55.8 L56.0 56.8 L58.0 58.2 L60.0 60.0 L62.0 62.2 L64.0 64.8 L66.0 67.8 L68.0 71.2 L70.0 75.0 L72.0 79.2 L74.0 83.8 L76.0 88.8 L78.0 94.2 L80.0 100.0 L82.0 106.2 L84.0 112.8 L86.0 119.8 L88.0 127.2 L90.0 135.0 L92.0 143.2 L94.0 151.8 L96.0 160.8 L98.0 170.2 L100.0 180.0M100.0 180.0 L102.0 193.8 L104.0 207.2 L106.0 220.2 L108.0 232.8 L110.0 245.0 L112.0 256.8 L114.0 268.2 L116.0 279.2 L118.0 289.8 L120.0 300.0 L122.0 309.8 L124.0 319.2 L126.0 328.2 L128.0 336.8 L130.0 345.0 L132.0 352.8 L134.0 360.2 L136.0 367.2 L138.0 373.8 L140.0 380.0 L142.0 385.8 L144.0 391.2 L146.0 396.2 L148.0 400.8 L150.0 405.0 L152.0 408.8 L154.0 412.2 L156.0 415.2 L158.0 417.8 L160.0 420.0 L162.0 421.8 L164.0 423.2 L166.0 424.2 L168.0 424.8 L170.0 425.0 L172.0 424.8 L174.0 424.2 L176.0 423.2 L178.0 421.8 L180.0 420.0 L182.0 417.8 L184.0 415.2 L186.0 412.2 L188.0 408.8 L190.0 405.0 L192.0 400.8 L194.0 396.2 L196.0 391.2 L198.0 385.8 L200.0 380.0 L202.0 373.8 L204.0 367.2 L206.0 360.2 L208.0 352.8 L210.0 345.0 L212.0 336.8 L214.0 328.2 L216.0 319.2 L218.0 309.8 L220.0 300.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"180.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.F98AF0":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 268 284\" role=\"img\" aria-label=\"График функции\" style=\"max-width:268px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"240\" height=\"260\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V260\"/><path d=\"M20 0V260\"/><path d=\"M40 0V260\"/><path d=\"M60 0V260\"/><path d=\"M80 0V260\"/><path d=\"M100 0V260\"/><path d=\"M120 0V260\"/><path d=\"M140 0V260\"/><path d=\"M160 0V260\"/><path d=\"M180 0V260\"/><path d=\"M200 0V260\"/><path d=\"M220 0V260\"/><path d=\"M240 0V260\"/><path d=\"M0 260 H240\"/><path d=\"M0 240 H240\"/><path d=\"M0 220 H240\"/><path d=\"M0 200 H240\"/><path d=\"M0 180 H240\"/><path d=\"M0 160 H240\"/><path d=\"M0 140 H240\"/><path d=\"M0 120 H240\"/><path d=\"M0 100 H240\"/><path d=\"M0 80 H240\"/><path d=\"M0 60 H240\"/><path d=\"M0 40 H240\"/><path d=\"M0 20 H240\"/><path d=\"M0 0 H240\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V260\"/><path d=\"M0 220H240\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"231\">-3</text><text x=\"20\" y=\"231\">-2</text><text x=\"40\" y=\"231\">-1</text><text x=\"80\" y=\"231\">1</text><text x=\"100\" y=\"231\">2</text><text x=\"120\" y=\"231\">3</text><text x=\"140\" y=\"231\">4</text><text x=\"160\" y=\"231\">5</text><text x=\"180\" y=\"231\">6</text><text x=\"200\" y=\"231\">7</text><text x=\"220\" y=\"231\">8</text><text x=\"240\" y=\"231\">9</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"263\">-2</text><text x=\"57\" y=\"243\">-1</text><text x=\"57\" y=\"203\">1</text><text x=\"57\" y=\"183\">2</text><text x=\"57\" y=\"163\">3</text><text x=\"57\" y=\"143\">4</text><text x=\"57\" y=\"123\">5</text><text x=\"57\" y=\"103\">6</text><text x=\"57\" y=\"83\">7</text><text x=\"57\" y=\"63\">8</text><text x=\"57\" y=\"43\">9</text><text x=\"57\" y=\"23\">10</text><text x=\"57\" y=\"3\">11</text></g><path d=\"M64.0 264.8 L66.0 257.8 L68.0 251.2 L70.0 245.0 L72.0 239.2 L74.0 233.8 L76.0 228.8 L78.0 224.2 L80.0 220.0 L82.0 216.2 L84.0 212.8 L86.0 209.8 L88.0 207.2 L90.0 205.0 L92.0 203.2 L94.0 201.8 L96.0 200.8 L98.0 200.2 L100.0 200.0 L102.0 200.2 L104.0 200.8 L106.0 201.8 L108.0 203.2 L110.0 205.0 L112.0 207.2 L114.0 209.8 L116.0 212.8 L118.0 216.2 L120.0 220.0M120.0 220.0 L122.0 208.2 L124.0 196.8 L126.0 185.8 L128.0 175.2 L130.0 165.0 L132.0 155.2 L134.0 145.8 L136.0 136.8 L138.0 128.2 L140.0 120.0 L142.0 112.2 L144.0 104.8 L146.0 97.8 L148.0 91.2 L150.0 85.0 L152.0 79.2 L154.0 73.8 L156.0 68.8 L158.0 64.2 L160.0 60.0 L162.0 56.2 L164.0 52.8 L166.0 49.8 L168.0 47.2 L170.0 45.0 L172.0 43.2 L174.0 41.8 L176.0 40.8 L178.0 40.2 L180.0 40.0 L182.0 40.2 L184.0 40.8 L186.0 41.8 L188.0 43.2 L190.0 45.0 L192.0 47.2 L194.0 49.8 L196.0 52.8 L198.0 56.2 L200.0 60.0 L202.0 64.2 L204.0 68.8 L206.0 73.8 L208.0 79.2 L210.0 85.0 L212.0 91.2 L214.0 97.8 L216.0 104.8 L218.0 112.2 L220.0 120.0 L222.0 128.2 L224.0 136.8 L226.0 145.8 L228.0 155.2 L230.0 165.0 L232.0 175.2 L234.0 185.8 L236.0 196.8 L238.0 208.2 L240.0 220.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"120.0\" cy=\"220.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.F486F7":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 264\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"240\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V240\"/><path d=\"M20 0V240\"/><path d=\"M40 0V240\"/><path d=\"M60 0V240\"/><path d=\"M80 0V240\"/><path d=\"M100 0V240\"/><path d=\"M120 0V240\"/><path d=\"M140 0V240\"/><path d=\"M160 0V240\"/><path d=\"M0 240 H160\"/><path d=\"M0 220 H160\"/><path d=\"M0 200 H160\"/><path d=\"M0 180 H160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V240\"/><path d=\"M0 180H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"191\">-5</text><text x=\"20\" y=\"191\">-4</text><text x=\"40\" y=\"191\">-3</text><text x=\"60\" y=\"191\">-2</text><text x=\"80\" y=\"191\">-1</text><text x=\"120\" y=\"191\">1</text><text x=\"140\" y=\"191\">2</text><text x=\"160\" y=\"191\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"243\">-3</text><text x=\"97\" y=\"223\">-2</text><text x=\"97\" y=\"203\">-1</text><text x=\"97\" y=\"163\">1</text><text x=\"97\" y=\"143\">2</text><text x=\"97\" y=\"123\">3</text><text x=\"97\" y=\"103\">4</text><text x=\"97\" y=\"83\">5</text><text x=\"97\" y=\"63\">6</text><text x=\"97\" y=\"43\">7</text><text x=\"97\" y=\"23\">8</text><text x=\"97\" y=\"3\">9</text></g><path d=\"M0.0 180.0 L2.0 170.2 L4.0 160.8 L6.0 151.8 L8.0 143.2 L10.0 135.0 L12.0 127.2 L14.0 119.8 L16.0 112.8 L18.0 106.2 L20.0 100.0 L22.0 94.2 L24.0 88.8 L26.0 83.8 L28.0 79.2 L30.0 75.0 L32.0 71.2 L34.0 67.8 L36.0 64.8 L38.0 62.2 L40.0 60.0 L42.0 58.2 L44.0 56.8 L46.0 55.8 L48.0 55.2 L50.0 55.0 L52.0 55.2 L54.0 55.8 L56.0 56.8 L58.0 58.2 L60.0 60.0 L62.0 62.2 L64.0 64.8 L66.0 67.8 L68.0 71.2 L70.0 75.0 L72.0 79.2 L74.0 83.8 L76.0 88.8 L78.0 94.2 L80.0 100.0 L82.0 106.2 L84.0 112.8 L86.0 119.8 L88.0 127.2 L90.0 135.0 L92.0 143.2 L94.0 151.8 L96.0 160.8 L98.0 170.2 L100.0 180.0M100.0 180.0 L102.0 181.8 L104.0 183.2 L106.0 184.2 L108.0 184.8 L110.0 185.0 L112.0 184.8 L114.0 184.2 L116.0 183.2 L118.0 181.8 L120.0 180.0 L122.0 177.8 L124.0 175.2 L126.0 172.2 L128.0 168.8 L130.0 165.0 L132.0 160.8 L134.0 156.2 L136.0 151.2 L138.0 145.8 L140.0 140.0 L142.0 133.8 L144.0 127.2 L146.0 120.2 L148.0 112.8 L150.0 105.0 L152.0 96.8 L154.0 88.2 L156.0 79.2 L158.0 69.8 L160.0 60.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"180.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.A58BF6":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 288 244\" role=\"img\" aria-label=\"График функции\" style=\"max-width:288px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"260\" height=\"220\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V220\"/><path d=\"M20 0V220\"/><path d=\"M40 0V220\"/><path d=\"M60 0V220\"/><path d=\"M80 0V220\"/><path d=\"M100 0V220\"/><path d=\"M120 0V220\"/><path d=\"M140 0V220\"/><path d=\"M160 0V220\"/><path d=\"M180 0V220\"/><path d=\"M200 0V220\"/><path d=\"M220 0V220\"/><path d=\"M240 0V220\"/><path d=\"M260 0V220\"/><path d=\"M0 220 H260\"/><path d=\"M0 200 H260\"/><path d=\"M0 180 H260\"/><path d=\"M0 160 H260\"/><path d=\"M0 140 H260\"/><path d=\"M0 120 H260\"/><path d=\"M0 100 H260\"/><path d=\"M0 80 H260\"/><path d=\"M0 60 H260\"/><path d=\"M0 40 H260\"/><path d=\"M0 20 H260\"/><path d=\"M0 0 H260\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M200 0V220\"/><path d=\"M0 180H260\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"191\">-10</text><text x=\"20\" y=\"191\">-9</text><text x=\"40\" y=\"191\">-8</text><text x=\"60\" y=\"191\">-7</text><text x=\"80\" y=\"191\">-6</text><text x=\"100\" y=\"191\">-5</text><text x=\"120\" y=\"191\">-4</text><text x=\"140\" y=\"191\">-3</text><text x=\"160\" y=\"191\">-2</text><text x=\"180\" y=\"191\">-1</text><text x=\"220\" y=\"191\">1</text><text x=\"240\" y=\"191\">2</text><text x=\"260\" y=\"191\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"197\" y=\"223\">-2</text><text x=\"197\" y=\"203\">-1</text><text x=\"197\" y=\"163\">1</text><text x=\"197\" y=\"143\">2</text><text x=\"197\" y=\"123\">3</text><text x=\"197\" y=\"103\">4</text><text x=\"197\" y=\"83\">5</text><text x=\"197\" y=\"63\">6</text><text x=\"197\" y=\"43\">7</text><text x=\"197\" y=\"23\">8</text><text x=\"197\" y=\"3\">9</text></g><path d=\"M8.0 223.2 L10.0 215.0 L12.0 207.2 L14.0 199.8 L16.0 192.8 L18.0 186.2 L20.0 180.0 L22.0 174.2 L24.0 168.8 L26.0 163.8 L28.0 159.2 L30.0 155.0 L32.0 151.2 L34.0 147.8 L36.0 144.8 L38.0 142.2 L40.0 140.0 L42.0 138.2 L44.0 136.8 L46.0 135.8 L48.0 135.2 L50.0 135.0 L52.0 135.2 L54.0 135.8 L56.0 136.8 L58.0 138.2 L60.0 140.0 L62.0 142.2 L64.0 144.8 L66.0 147.8 L68.0 151.2 L70.0 155.0 L72.0 159.2 L74.0 163.8 L76.0 168.8 L78.0 174.2 L80.0 180.0M80.0 180.0 L82.0 170.2 L84.0 160.8 L86.0 151.8 L88.0 143.2 L90.0 135.0 L92.0 127.2 L94.0 119.8 L96.0 112.8 L98.0 106.2 L100.0 100.0 L102.0 94.2 L104.0 88.8 L106.0 83.8 L108.0 79.2 L110.0 75.0 L112.0 71.2 L114.0 67.8 L116.0 64.8 L118.0 62.2 L120.0 60.0 L122.0 58.2 L124.0 56.8 L126.0 55.8 L128.0 55.2 L130.0 55.0 L132.0 55.2 L134.0 55.8 L136.0 56.8 L138.0 58.2 L140.0 60.0 L142.0 62.2 L144.0 64.8 L146.0 67.8 L148.0 71.2 L150.0 75.0 L152.0 79.2 L154.0 83.8 L156.0 88.8 L158.0 94.2 L160.0 100.0 L162.0 106.2 L164.0 112.8 L166.0 119.8 L168.0 127.2 L170.0 135.0 L172.0 143.2 L174.0 151.8 L176.0 160.8 L178.0 170.2 L180.0 180.0 L182.0 190.2 L184.0 200.8 L186.0 211.8 L188.0 223.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"180.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.1D2900":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V160\"/><path d=\"M0 60H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"71\">-4</text><text x=\"20\" y=\"71\">-3</text><text x=\"40\" y=\"71\">-2</text><text x=\"60\" y=\"71\">-1</text><text x=\"100\" y=\"71\">1</text><text x=\"120\" y=\"71\">2</text><text x=\"140\" y=\"71\">3</text><text x=\"160\" y=\"71\">4</text><text x=\"180\" y=\"71\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"163\">-5</text><text x=\"77\" y=\"143\">-4</text><text x=\"77\" y=\"123\">-3</text><text x=\"77\" y=\"103\">-2</text><text x=\"77\" y=\"83\">-1</text><text x=\"77\" y=\"43\">1</text><text x=\"77\" y=\"23\">2</text><text x=\"77\" y=\"3\">3</text></g><path d=\"M24.0 160.8 L26.0 151.8 L28.0 143.2 L30.0 135.0 L32.0 127.2 L34.0 119.8 L36.0 112.8 L38.0 106.2 L40.0 100.0 L42.0 94.2 L44.0 88.8 L46.0 83.8 L48.0 79.2 L50.0 75.0 L52.0 71.2 L54.0 67.8 L56.0 64.8 L58.0 62.2 L60.0 60.0 L62.0 58.2 L64.0 56.8 L66.0 55.8 L68.0 55.2 L70.0 55.0 L72.0 55.2 L74.0 55.8 L76.0 56.8 L78.0 58.2 L80.0 60.0M80.0 60.0 L82.0 65.8 L84.0 71.2 L86.0 76.2 L88.0 80.8 L90.0 85.0 L92.0 88.8 L94.0 92.2 L96.0 95.2 L98.0 97.8 L100.0 100.0 L102.0 101.8 L104.0 103.2 L106.0 104.2 L108.0 104.8 L110.0 105.0 L112.0 104.8 L114.0 104.2 L116.0 103.2 L118.0 101.8 L120.0 100.0 L122.0 97.8 L124.0 95.2 L126.0 92.2 L128.0 88.8 L130.0 85.0 L132.0 80.8 L134.0 76.2 L136.0 71.2 L138.0 65.8 L140.0 60.0 L142.0 53.8 L144.0 47.2 L146.0 40.2 L148.0 32.8 L150.0 25.0 L152.0 16.8 L154.0 8.2 L156.0 -0.8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"60.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.5A5902":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 204\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"180\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V180\"/><path d=\"M20 0V180\"/><path d=\"M40 0V180\"/><path d=\"M60 0V180\"/><path d=\"M80 0V180\"/><path d=\"M100 0V180\"/><path d=\"M120 0V180\"/><path d=\"M140 0V180\"/><path d=\"M160 0V180\"/><path d=\"M180 0V180\"/><path d=\"M0 180 H180\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V180\"/><path d=\"M0 120H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-5</text><text x=\"20\" y=\"131\">-4</text><text x=\"40\" y=\"131\">-3</text><text x=\"60\" y=\"131\">-2</text><text x=\"80\" y=\"131\">-1</text><text x=\"120\" y=\"131\">1</text><text x=\"140\" y=\"131\">2</text><text x=\"160\" y=\"131\">3</text><text x=\"180\" y=\"131\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"183\">-3</text><text x=\"97\" y=\"163\">-2</text><text x=\"97\" y=\"143\">-1</text><text x=\"97\" y=\"103\">1</text><text x=\"97\" y=\"83\">2</text><text x=\"97\" y=\"63\">3</text><text x=\"97\" y=\"43\">4</text><text x=\"97\" y=\"23\">5</text><text x=\"97\" y=\"3\">6</text></g><path d=\"M6.0 185.8 L8.0 175.2 L10.0 165.0 L12.0 155.2 L14.0 145.8 L16.0 136.8 L18.0 128.2 L20.0 120.0 L22.0 112.2 L24.0 104.8 L26.0 97.8 L28.0 91.2 L30.0 85.0 L32.0 79.2 L34.0 73.8 L36.0 68.8 L38.0 64.2 L40.0 60.0 L42.0 56.2 L44.0 52.8 L46.0 49.8 L48.0 47.2 L50.0 45.0 L52.0 43.2 L54.0 41.8 L56.0 40.8 L58.0 40.2 L60.0 40.0 L62.0 40.2 L64.0 40.8 L66.0 41.8 L68.0 43.2 L70.0 45.0 L72.0 47.2 L74.0 49.8 L76.0 52.8 L78.0 56.2 L80.0 60.0 L82.0 64.2 L84.0 68.8 L86.0 73.8 L88.0 79.2 L90.0 85.0 L92.0 91.2 L94.0 97.8 L96.0 104.8 L98.0 112.2 L100.0 120.0M100.0 120.0 L102.0 123.8 L104.0 127.2 L106.0 130.2 L108.0 132.8 L110.0 135.0 L112.0 136.8 L114.0 138.2 L116.0 139.2 L118.0 139.8 L120.0 140.0 L122.0 139.8 L124.0 139.2 L126.0 138.2 L128.0 136.8 L130.0 135.0 L132.0 132.8 L134.0 130.2 L136.0 127.2 L138.0 123.8 L140.0 120.0 L142.0 115.8 L144.0 111.2 L146.0 106.2 L148.0 100.8 L150.0 95.0 L152.0 88.8 L154.0 82.2 L156.0 75.2 L158.0 67.8 L160.0 60.0 L162.0 51.8 L164.0 43.2 L166.0 34.2 L168.0 24.8 L170.0 15.0 L172.0 4.8 L174.0 -5.8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.447D77":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 228 204\" role=\"img\" aria-label=\"График функции\" style=\"max-width:228px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"200\" height=\"180\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V180\"/><path d=\"M20 0V180\"/><path d=\"M40 0V180\"/><path d=\"M60 0V180\"/><path d=\"M80 0V180\"/><path d=\"M100 0V180\"/><path d=\"M120 0V180\"/><path d=\"M140 0V180\"/><path d=\"M160 0V180\"/><path d=\"M180 0V180\"/><path d=\"M200 0V180\"/><path d=\"M0 180 H200\"/><path d=\"M0 160 H200\"/><path d=\"M0 140 H200\"/><path d=\"M0 120 H200\"/><path d=\"M0 100 H200\"/><path d=\"M0 80 H200\"/><path d=\"M0 60 H200\"/><path d=\"M0 40 H200\"/><path d=\"M0 20 H200\"/><path d=\"M0 0 H200\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V180\"/><path d=\"M0 40H200\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-3</text><text x=\"20\" y=\"51\">-2</text><text x=\"40\" y=\"51\">-1</text><text x=\"80\" y=\"51\">1</text><text x=\"100\" y=\"51\">2</text><text x=\"120\" y=\"51\">3</text><text x=\"140\" y=\"51\">4</text><text x=\"160\" y=\"51\">5</text><text x=\"180\" y=\"51\">6</text><text x=\"200\" y=\"51\">7</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"183\">-7</text><text x=\"57\" y=\"163\">-6</text><text x=\"57\" y=\"143\">-5</text><text x=\"57\" y=\"123\">-4</text><text x=\"57\" y=\"103\">-3</text><text x=\"57\" y=\"83\">-2</text><text x=\"57\" y=\"63\">-1</text><text x=\"57\" y=\"23\">1</text><text x=\"57\" y=\"3\">2</text></g><path d=\"M100.0 140.0 L102.0 132.2 L104.0 124.8 L106.0 117.8 L108.0 111.2 L110.0 105.0 L112.0 99.2 L114.0 93.8 L116.0 88.8 L118.0 84.2 L120.0 80.0 L122.0 76.2 L124.0 72.8 L126.0 69.8 L128.0 67.2 L130.0 65.0 L132.0 63.2 L134.0 61.8 L136.0 60.8 L138.0 60.2 L140.0 60.0 L142.0 60.2 L144.0 60.8 L146.0 61.8 L148.0 63.2 L150.0 65.0 L152.0 67.2 L154.0 69.8 L156.0 72.8 L158.0 76.2 L160.0 80.0 L162.0 84.2 L164.0 88.8 L166.0 93.8 L168.0 99.2 L170.0 105.0 L172.0 111.2 L174.0 117.8 L176.0 124.8 L178.0 132.2 L180.0 140.0 L182.0 148.2 L184.0 156.8 L186.0 165.8 L188.0 175.2 L190.0 185.0M0.0 20.0 L50.0 70.0 L100.0 120.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"120.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"100.0\" cy=\"140.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.E4D078":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 204\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"180\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V180\"/><path d=\"M20 0V180\"/><path d=\"M40 0V180\"/><path d=\"M60 0V180\"/><path d=\"M80 0V180\"/><path d=\"M100 0V180\"/><path d=\"M120 0V180\"/><path d=\"M140 0V180\"/><path d=\"M160 0V180\"/><path d=\"M180 0V180\"/><path d=\"M0 180 H180\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V180\"/><path d=\"M0 60H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"71\">-4</text><text x=\"20\" y=\"71\">-3</text><text x=\"40\" y=\"71\">-2</text><text x=\"60\" y=\"71\">-1</text><text x=\"100\" y=\"71\">1</text><text x=\"120\" y=\"71\">2</text><text x=\"140\" y=\"71\">3</text><text x=\"160\" y=\"71\">4</text><text x=\"180\" y=\"71\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"183\">-6</text><text x=\"77\" y=\"163\">-5</text><text x=\"77\" y=\"143\">-4</text><text x=\"77\" y=\"123\">-3</text><text x=\"77\" y=\"103\">-2</text><text x=\"77\" y=\"83\">-1</text><text x=\"77\" y=\"43\">1</text><text x=\"77\" y=\"23\">2</text><text x=\"77\" y=\"3\">3</text></g><path d=\"M6.0 185.8 L8.0 175.2 L10.0 165.0 L12.0 155.2 L14.0 145.8 L16.0 136.8 L18.0 128.2 L20.0 120.0 L22.0 112.2 L24.0 104.8 L26.0 97.8 L28.0 91.2 L30.0 85.0 L32.0 79.2 L34.0 73.8 L36.0 68.8 L38.0 64.2 L40.0 60.0 L42.0 56.2 L44.0 52.8 L46.0 49.8 L48.0 47.2 L50.0 45.0 L52.0 43.2 L54.0 41.8 L56.0 40.8 L58.0 40.2 L60.0 40.0 L62.0 40.2 L64.0 40.8 L66.0 41.8 L68.0 43.2 L70.0 45.0 L72.0 47.2 L74.0 49.8 L76.0 52.8 L78.0 56.2 L80.0 60.0M80.0 60.0 L82.0 67.8 L84.0 75.2 L86.0 82.2 L88.0 88.8 L90.0 95.0 L92.0 100.8 L94.0 106.2 L96.0 111.2 L98.0 115.8 L100.0 120.0 L102.0 123.8 L104.0 127.2 L106.0 130.2 L108.0 132.8 L110.0 135.0 L112.0 136.8 L114.0 138.2 L116.0 139.2 L118.0 139.8 L120.0 140.0 L122.0 139.8 L124.0 139.2 L126.0 138.2 L128.0 136.8 L130.0 135.0 L132.0 132.8 L134.0 130.2 L136.0 127.2 L138.0 123.8 L140.0 120.0 L142.0 115.8 L144.0 111.2 L146.0 106.2 L148.0 100.8 L150.0 95.0 L152.0 88.8 L154.0 82.2 L156.0 75.2 L158.0 67.8 L160.0 60.0 L162.0 51.8 L164.0 43.2 L166.0 34.2 L168.0 24.8 L170.0 15.0 L172.0 4.8 L174.0 -5.8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"60.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.F708B3":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 248 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:248px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"220\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M220 0V160\"/><path d=\"M0 160 H220\"/><path d=\"M0 140 H220\"/><path d=\"M0 120 H220\"/><path d=\"M0 100 H220\"/><path d=\"M0 80 H220\"/><path d=\"M0 60 H220\"/><path d=\"M0 40 H220\"/><path d=\"M0 20 H220\"/><path d=\"M0 0 H220\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V160\"/><path d=\"M0 60H220\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"71\">-3</text><text x=\"20\" y=\"71\">-2</text><text x=\"40\" y=\"71\">-1</text><text x=\"80\" y=\"71\">1</text><text x=\"100\" y=\"71\">2</text><text x=\"120\" y=\"71\">3</text><text x=\"140\" y=\"71\">4</text><text x=\"160\" y=\"71\">5</text><text x=\"180\" y=\"71\">6</text><text x=\"200\" y=\"71\">7</text><text x=\"220\" y=\"71\">8</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"163\">-5</text><text x=\"57\" y=\"143\">-4</text><text x=\"57\" y=\"123\">-3</text><text x=\"57\" y=\"103\">-2</text><text x=\"57\" y=\"83\">-1</text><text x=\"57\" y=\"43\">1</text><text x=\"57\" y=\"23\">2</text><text x=\"57\" y=\"3\">3</text></g><path d=\"M92.0 -7.2 L94.0 0.2 L96.0 7.2 L98.0 13.8 L100.0 20.0 L102.0 25.8 L104.0 31.2 L106.0 36.2 L108.0 40.8 L110.0 45.0 L112.0 48.8 L114.0 52.2 L116.0 55.2 L118.0 57.8 L120.0 60.0 L122.0 61.8 L124.0 63.2 L126.0 64.2 L128.0 64.8 L130.0 65.0 L132.0 64.8 L134.0 64.2 L136.0 63.2 L138.0 61.8 L140.0 60.0M140.0 60.0 L142.0 65.8 L144.0 71.2 L146.0 76.2 L148.0 80.8 L150.0 85.0 L152.0 88.8 L154.0 92.2 L156.0 95.2 L158.0 97.8 L160.0 100.0 L162.0 101.8 L164.0 103.2 L166.0 104.2 L168.0 104.8 L170.0 105.0 L172.0 104.8 L174.0 104.2 L176.0 103.2 L178.0 101.8 L180.0 100.0 L182.0 97.8 L184.0 95.2 L186.0 92.2 L188.0 88.8 L190.0 85.0 L192.0 80.8 L194.0 76.2 L196.0 71.2 L198.0 65.8 L200.0 60.0 L202.0 53.8 L204.0 47.2 L206.0 40.2 L208.0 32.8 L210.0 25.0 L212.0 16.8 L214.0 8.2 L216.0 -0.8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"140.0\" cy=\"60.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.D35EB0":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V160\"/><path d=\"M0 80H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"91\">-5</text><text x=\"20\" y=\"91\">-4</text><text x=\"40\" y=\"91\">-3</text><text x=\"60\" y=\"91\">-2</text><text x=\"80\" y=\"91\">-1</text><text x=\"120\" y=\"91\">1</text><text x=\"140\" y=\"91\">2</text><text x=\"160\" y=\"91\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"163\">-4</text><text x=\"97\" y=\"143\">-3</text><text x=\"97\" y=\"123\">-2</text><text x=\"97\" y=\"103\">-1</text><text x=\"97\" y=\"63\">1</text><text x=\"97\" y=\"43\">2</text><text x=\"97\" y=\"23\">3</text><text x=\"97\" y=\"3\">4</text></g><path d=\"M40.0 170.0 L42.0 164.1 L44.0 158.4 L46.0 152.9 L48.0 147.6 L50.0 142.5 L52.0 137.6 L54.0 132.9 L56.0 128.4 L58.0 124.1 L60.0 120.0M60.0 120.0 L62.0 116.1 L64.0 112.4 L66.0 108.9 L68.0 105.6 L70.0 102.5 L72.0 99.6 L74.0 96.9 L76.0 94.4 L78.0 92.1 L80.0 90.0 L82.0 88.1 L84.0 86.4 L86.0 84.9 L88.0 83.6 L90.0 82.5 L92.0 81.6 L94.0 80.9 L96.0 80.4 L98.0 80.1 L100.0 80.0M100.0 80.0 L102.0 79.9 L104.0 79.6 L106.0 79.1 L108.0 78.4 L110.0 77.5 L112.0 76.4 L114.0 75.1 L116.0 73.6 L118.0 71.9 L120.0 70.0 L122.0 67.9 L124.0 65.6 L126.0 63.1 L128.0 60.4 L130.0 57.5 L132.0 54.4 L134.0 51.1 L136.0 47.6 L138.0 43.9 L140.0 40.0 L142.0 35.9 L144.0 31.6 L146.0 27.1 L148.0 22.4 L150.0 17.5 L152.0 12.4 L154.0 7.1 L156.0 1.6 L158.0 -4.1 L160.0 -10.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"120.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"100.0\" cy=\"80.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.5BD2BC":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V160\"/><path d=\"M0 120H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-4</text><text x=\"20\" y=\"131\">-3</text><text x=\"40\" y=\"131\">-2</text><text x=\"60\" y=\"131\">-1</text><text x=\"100\" y=\"131\">1</text><text x=\"120\" y=\"131\">2</text><text x=\"140\" y=\"131\">3</text><text x=\"160\" y=\"131\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"163\">-2</text><text x=\"77\" y=\"143\">-1</text><text x=\"77\" y=\"103\">1</text><text x=\"77\" y=\"83\">2</text><text x=\"77\" y=\"63\">3</text><text x=\"77\" y=\"43\">4</text><text x=\"77\" y=\"23\">5</text><text x=\"77\" y=\"3\">6</text></g><path d=\"M60.0 120.0 L62.0 112.2 L64.0 104.8 L66.0 97.8 L68.0 91.2 L70.0 85.0 L72.0 79.2 L74.0 73.8 L76.0 68.8 L78.0 64.2 L80.0 60.0 L82.0 56.2 L84.0 52.8 L86.0 49.8 L88.0 47.2 L90.0 45.0 L92.0 43.2 L94.0 41.8 L96.0 40.8 L98.0 40.2 L100.0 40.0 L102.0 40.2 L104.0 40.8 L106.0 41.8 L108.0 43.2 L110.0 45.0 L112.0 47.2 L114.0 49.8 L116.0 52.8 L118.0 56.2 L120.0 60.0 L122.0 64.2 L124.0 68.8 L126.0 73.8 L128.0 79.2 L130.0 85.0 L132.0 91.2 L134.0 97.8 L136.0 104.8 L138.0 112.2 L140.0 120.0 L142.0 128.2 L144.0 136.8 L146.0 145.8 L148.0 155.2 L150.0 165.0M0.0 20.0 L30.0 50.0 L60.0 80.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"80.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"60.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.9E02BA":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 204\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"180\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V180\"/><path d=\"M20 0V180\"/><path d=\"M40 0V180\"/><path d=\"M60 0V180\"/><path d=\"M80 0V180\"/><path d=\"M100 0V180\"/><path d=\"M120 0V180\"/><path d=\"M140 0V180\"/><path d=\"M160 0V180\"/><path d=\"M180 0V180\"/><path d=\"M0 180 H180\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V180\"/><path d=\"M0 140H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"151\">-3</text><text x=\"20\" y=\"151\">-2</text><text x=\"40\" y=\"151\">-1</text><text x=\"80\" y=\"151\">1</text><text x=\"100\" y=\"151\">2</text><text x=\"120\" y=\"151\">3</text><text x=\"140\" y=\"151\">4</text><text x=\"160\" y=\"151\">5</text><text x=\"180\" y=\"151\">6</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"183\">-2</text><text x=\"57\" y=\"163\">-1</text><text x=\"57\" y=\"123\">1</text><text x=\"57\" y=\"103\">2</text><text x=\"57\" y=\"83\">3</text><text x=\"57\" y=\"63\">4</text><text x=\"57\" y=\"43\">5</text><text x=\"57\" y=\"23\">6</text><text x=\"57\" y=\"3\">7</text></g><path d=\"M80.0 40.0 L82.0 47.8 L84.0 55.2 L86.0 62.2 L88.0 68.8 L90.0 75.0 L92.0 80.8 L94.0 86.2 L96.0 91.2 L98.0 95.8 L100.0 100.0 L102.0 103.8 L104.0 107.2 L106.0 110.2 L108.0 112.8 L110.0 115.0 L112.0 116.8 L114.0 118.2 L116.0 119.2 L118.0 119.8 L120.0 120.0 L122.0 119.8 L124.0 119.2 L126.0 118.2 L128.0 116.8 L130.0 115.0 L132.0 112.8 L134.0 110.2 L136.0 107.2 L138.0 103.8 L140.0 100.0 L142.0 95.8 L144.0 91.2 L146.0 86.2 L148.0 80.8 L150.0 75.0 L152.0 68.8 L154.0 62.2 L156.0 55.2 L158.0 47.8 L160.0 40.0 L162.0 31.8 L164.0 23.2 L166.0 14.2 L168.0 4.8 L170.0 -5.0M0.0 160.0 L40.0 120.0 L80.0 80.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"80.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"80.0\" cy=\"40.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.9600B6":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V160\"/><path d=\"M0 100H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"111\">-5</text><text x=\"20\" y=\"111\">-4</text><text x=\"40\" y=\"111\">-3</text><text x=\"60\" y=\"111\">-2</text><text x=\"80\" y=\"111\">-1</text><text x=\"120\" y=\"111\">1</text><text x=\"140\" y=\"111\">2</text><text x=\"160\" y=\"111\">3</text><text x=\"180\" y=\"111\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"163\">-3</text><text x=\"97\" y=\"143\">-2</text><text x=\"97\" y=\"123\">-1</text><text x=\"97\" y=\"83\">1</text><text x=\"97\" y=\"63\">2</text><text x=\"97\" y=\"43\">3</text><text x=\"97\" y=\"23\">4</text><text x=\"97\" y=\"3\">5</text></g><path d=\"M58.0 166.2 L60.0 160.0 L62.0 154.1 L64.0 148.6 L66.0 143.4 L68.0 138.4 L70.0 133.8 L72.0 129.4 L74.0 125.3 L76.0 121.6 L78.0 118.2 L80.0 115.0M80.0 115.0 L82.0 112.2 L84.0 109.6 L86.0 107.3 L88.0 105.4 L90.0 103.8 L92.0 102.4 L94.0 101.3 L96.0 100.6 L98.0 100.2 L100.0 100.0M100.0 100.0 L102.0 99.8 L104.0 99.4 L106.0 98.7 L108.0 97.6 L110.0 96.2 L112.0 94.6 L114.0 92.7 L116.0 90.4 L118.0 87.8 L120.0 85.0 L122.0 81.8 L124.0 78.4 L126.0 74.7 L128.0 70.6 L130.0 66.2 L132.0 61.6 L134.0 56.7 L136.0 51.4 L138.0 45.9 L140.0 40.0 L142.0 33.8 L144.0 27.4 L146.0 20.7 L148.0 13.6 L150.0 6.2 L152.0 -1.4 L154.0 -9.4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"115.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"100.0\" cy=\"100.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.6E2FBC":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 248 284\" role=\"img\" aria-label=\"График функции\" style=\"max-width:248px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"220\" height=\"260\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V260\"/><path d=\"M20 0V260\"/><path d=\"M40 0V260\"/><path d=\"M60 0V260\"/><path d=\"M80 0V260\"/><path d=\"M100 0V260\"/><path d=\"M120 0V260\"/><path d=\"M140 0V260\"/><path d=\"M160 0V260\"/><path d=\"M180 0V260\"/><path d=\"M200 0V260\"/><path d=\"M220 0V260\"/><path d=\"M0 260 H220\"/><path d=\"M0 240 H220\"/><path d=\"M0 220 H220\"/><path d=\"M0 200 H220\"/><path d=\"M0 180 H220\"/><path d=\"M0 160 H220\"/><path d=\"M0 140 H220\"/><path d=\"M0 120 H220\"/><path d=\"M0 100 H220\"/><path d=\"M0 80 H220\"/><path d=\"M0 60 H220\"/><path d=\"M0 40 H220\"/><path d=\"M0 20 H220\"/><path d=\"M0 0 H220\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V260\"/><path d=\"M0 40H220\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-3</text><text x=\"20\" y=\"51\">-2</text><text x=\"40\" y=\"51\">-1</text><text x=\"80\" y=\"51\">1</text><text x=\"100\" y=\"51\">2</text><text x=\"120\" y=\"51\">3</text><text x=\"140\" y=\"51\">4</text><text x=\"160\" y=\"51\">5</text><text x=\"180\" y=\"51\">6</text><text x=\"200\" y=\"51\">7</text><text x=\"220\" y=\"51\">8</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"263\">-11</text><text x=\"57\" y=\"243\">-10</text><text x=\"57\" y=\"223\">-9</text><text x=\"57\" y=\"203\">-8</text><text x=\"57\" y=\"183\">-7</text><text x=\"57\" y=\"163\">-6</text><text x=\"57\" y=\"143\">-5</text><text x=\"57\" y=\"123\">-4</text><text x=\"57\" y=\"103\">-3</text><text x=\"57\" y=\"83\">-2</text><text x=\"57\" y=\"63\">-1</text><text x=\"57\" y=\"23\">1</text><text x=\"57\" y=\"3\">2</text></g><path d=\"M10.0 -5.0 L12.0 4.8 L14.0 14.2 L16.0 23.2 L18.0 31.8 L20.0 40.0 L22.0 47.8 L24.0 55.2 L26.0 62.2 L28.0 68.8 L30.0 75.0 L32.0 80.8 L34.0 86.2 L36.0 91.2 L38.0 95.8 L40.0 100.0 L42.0 103.8 L44.0 107.2 L46.0 110.2 L48.0 112.8 L50.0 115.0 L52.0 116.8 L54.0 118.2 L56.0 119.2 L58.0 119.8 L60.0 120.0 L62.0 119.8 L64.0 119.2 L66.0 118.2 L68.0 116.8 L70.0 115.0 L72.0 112.8 L74.0 110.2 L76.0 107.2 L78.0 103.8 L80.0 100.0 L82.0 95.8 L84.0 91.2 L86.0 86.2 L88.0 80.8 L90.0 75.0 L92.0 68.8 L94.0 62.2 L96.0 55.2 L98.0 47.8 L100.0 40.0M100.0 40.0 L102.0 51.8 L104.0 63.2 L106.0 74.2 L108.0 84.8 L110.0 95.0 L112.0 104.8 L114.0 114.2 L116.0 123.2 L118.0 131.8 L120.0 140.0 L122.0 147.8 L124.0 155.2 L126.0 162.2 L128.0 168.8 L130.0 175.0 L132.0 180.8 L134.0 186.2 L136.0 191.2 L138.0 195.8 L140.0 200.0 L142.0 203.8 L144.0 207.2 L146.0 210.2 L148.0 212.8 L150.0 215.0 L152.0 216.8 L154.0 218.2 L156.0 219.2 L158.0 219.8 L160.0 220.0 L162.0 219.8 L164.0 219.2 L166.0 218.2 L168.0 216.8 L170.0 215.0 L172.0 212.8 L174.0 210.2 L176.0 207.2 L178.0 203.8 L180.0 200.0 L182.0 195.8 L184.0 191.2 L186.0 186.2 L188.0 180.8 L190.0 175.0 L192.0 168.8 L194.0 162.2 L196.0 155.2 L198.0 147.8 L200.0 140.0 L202.0 131.8 L204.0 123.2 L206.0 114.2 L208.0 104.8 L210.0 95.0 L212.0 84.8 L214.0 74.2 L216.0 63.2 L218.0 51.8 L220.0 40.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"40.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.85AFB6":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 248 324\" role=\"img\" aria-label=\"График функции\" style=\"max-width:248px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"220\" height=\"300\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V300\"/><path d=\"M20 0V300\"/><path d=\"M40 0V300\"/><path d=\"M60 0V300\"/><path d=\"M80 0V300\"/><path d=\"M100 0V300\"/><path d=\"M120 0V300\"/><path d=\"M140 0V300\"/><path d=\"M160 0V300\"/><path d=\"M180 0V300\"/><path d=\"M200 0V300\"/><path d=\"M220 0V300\"/><path d=\"M0 300 H220\"/><path d=\"M0 280 H220\"/><path d=\"M0 260 H220\"/><path d=\"M0 240 H220\"/><path d=\"M0 220 H220\"/><path d=\"M0 200 H220\"/><path d=\"M0 180 H220\"/><path d=\"M0 160 H220\"/><path d=\"M0 140 H220\"/><path d=\"M0 120 H220\"/><path d=\"M0 100 H220\"/><path d=\"M0 80 H220\"/><path d=\"M0 60 H220\"/><path d=\"M0 40 H220\"/><path d=\"M0 20 H220\"/><path d=\"M0 0 H220\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M140 0V300\"/><path d=\"M0 240H220\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"251\">-7</text><text x=\"20\" y=\"251\">-6</text><text x=\"40\" y=\"251\">-5</text><text x=\"60\" y=\"251\">-4</text><text x=\"80\" y=\"251\">-3</text><text x=\"100\" y=\"251\">-2</text><text x=\"120\" y=\"251\">-1</text><text x=\"160\" y=\"251\">1</text><text x=\"180\" y=\"251\">2</text><text x=\"200\" y=\"251\">3</text><text x=\"220\" y=\"251\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"137\" y=\"303\">-3</text><text x=\"137\" y=\"283\">-2</text><text x=\"137\" y=\"263\">-1</text><text x=\"137\" y=\"223\">1</text><text x=\"137\" y=\"203\">2</text><text x=\"137\" y=\"183\">3</text><text x=\"137\" y=\"163\">4</text><text x=\"137\" y=\"143\">5</text><text x=\"137\" y=\"123\">6</text><text x=\"137\" y=\"103\">7</text><text x=\"137\" y=\"83\">8</text><text x=\"137\" y=\"63\">9</text><text x=\"137\" y=\"43\">10</text><text x=\"137\" y=\"23\">11</text><text x=\"137\" y=\"3\">12</text></g><path d=\"M0.0 100.0 L2.0 88.2 L4.0 76.8 L6.0 65.8 L8.0 55.2 L10.0 45.0 L12.0 35.2 L14.0 25.8 L16.0 16.8 L18.0 8.2 L20.0 0.0 L22.0 -7.8M98.0 -7.8 L100.0 0.0 L102.0 8.2 L104.0 16.8 L106.0 25.8 L108.0 35.2 L110.0 45.0 L112.0 55.2 L114.0 65.8 L116.0 76.8 L118.0 88.2 L120.0 100.0 L122.0 112.2 L124.0 124.8 L126.0 137.8 L128.0 151.2 L130.0 165.0 L132.0 179.2 L134.0 193.8 L136.0 208.8 L138.0 224.2 L140.0 240.0M140.0 240.0 L142.0 243.8 L144.0 247.2 L146.0 250.2 L148.0 252.8 L150.0 255.0 L152.0 256.8 L154.0 258.2 L156.0 259.2 L158.0 259.8 L160.0 260.0 L162.0 259.8 L164.0 259.2 L166.0 258.2 L168.0 256.8 L170.0 255.0 L172.0 252.8 L174.0 250.2 L176.0 247.2 L178.0 243.8 L180.0 240.0 L182.0 235.8 L184.0 231.2 L186.0 226.2 L188.0 220.8 L190.0 215.0 L192.0 208.8 L194.0 202.2 L196.0 195.2 L198.0 187.8 L200.0 180.0 L202.0 171.8 L204.0 163.2 L206.0 154.2 L208.0 144.8 L210.0 135.0 L212.0 124.8 L214.0 114.2 L216.0 103.2 L218.0 91.8 L220.0 80.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"140.0\" cy=\"240.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.43A519":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 228 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:228px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"200\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M0 160 H200\"/><path d=\"M0 140 H200\"/><path d=\"M0 120 H200\"/><path d=\"M0 100 H200\"/><path d=\"M0 80 H200\"/><path d=\"M0 60 H200\"/><path d=\"M0 40 H200\"/><path d=\"M0 20 H200\"/><path d=\"M0 0 H200\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M140 0V160\"/><path d=\"M0 40H200\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-7</text><text x=\"20\" y=\"51\">-6</text><text x=\"40\" y=\"51\">-5</text><text x=\"60\" y=\"51\">-4</text><text x=\"80\" y=\"51\">-3</text><text x=\"100\" y=\"51\">-2</text><text x=\"120\" y=\"51\">-1</text><text x=\"160\" y=\"51\">1</text><text x=\"180\" y=\"51\">2</text><text x=\"200\" y=\"51\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"137\" y=\"163\">-6</text><text x=\"137\" y=\"143\">-5</text><text x=\"137\" y=\"123\">-4</text><text x=\"137\" y=\"103\">-3</text><text x=\"137\" y=\"83\">-2</text><text x=\"137\" y=\"63\">-1</text><text x=\"137\" y=\"23\">1</text><text x=\"137\" y=\"3\">2</text></g><path d=\"M40.0 165.0 L42.0 160.1 L44.0 155.2 L46.0 150.5 L48.0 145.8 L50.0 141.2 L52.0 136.8 L54.0 132.4 L56.0 128.2 L58.0 124.0 L60.0 120.0M60.0 120.0 L62.0 116.1 L64.0 112.2 L66.0 108.5 L68.0 104.8 L70.0 101.2 L72.0 97.8 L74.0 94.5 L76.0 91.2 L78.0 88.0 L80.0 85.0 L82.0 82.0 L84.0 79.2 L86.0 76.5 L88.0 73.8 L90.0 71.2 L92.0 68.8 L94.0 66.4 L96.0 64.2 L98.0 62.0 L100.0 60.0 L102.0 58.0 L104.0 56.2 L106.0 54.5 L108.0 52.8 L110.0 51.2 L112.0 49.8 L114.0 48.4 L116.0 47.2 L118.0 46.1 L120.0 45.0 L122.0 44.1 L124.0 43.2 L126.0 42.5 L128.0 41.8 L130.0 41.2 L132.0 40.8 L134.0 40.5 L136.0 40.2 L138.0 40.0 L140.0 40.0M140.0 40.0 L142.0 40.0 L144.0 39.8 L146.0 39.5 L148.0 39.2 L150.0 38.8 L152.0 38.2 L154.0 37.5 L156.0 36.8 L158.0 35.9 L160.0 35.0 L162.0 34.0 L164.0 32.8 L166.0 31.5 L168.0 30.2 L170.0 28.8 L172.0 27.2 L174.0 25.6 L176.0 23.8 L178.0 22.0 L180.0 20.0 L182.0 17.9 L184.0 15.8 L186.0 13.6 L188.0 11.2 L190.0 8.8 L192.0 6.2 L194.0 3.5 L196.0 0.8 L198.0 -2.1 L200.0 -5.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"120.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"140.0\" cy=\"40.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.68001C":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 228 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:228px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"200\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M0 160 H200\"/><path d=\"M0 140 H200\"/><path d=\"M0 120 H200\"/><path d=\"M0 100 H200\"/><path d=\"M0 80 H200\"/><path d=\"M0 60 H200\"/><path d=\"M0 40 H200\"/><path d=\"M0 20 H200\"/><path d=\"M0 0 H200\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V160\"/><path d=\"M0 80H200\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"91\">-3</text><text x=\"20\" y=\"91\">-2</text><text x=\"40\" y=\"91\">-1</text><text x=\"80\" y=\"91\">1</text><text x=\"100\" y=\"91\">2</text><text x=\"120\" y=\"91\">3</text><text x=\"140\" y=\"91\">4</text><text x=\"160\" y=\"91\">5</text><text x=\"180\" y=\"91\">6</text><text x=\"200\" y=\"91\">7</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"163\">-4</text><text x=\"57\" y=\"143\">-3</text><text x=\"57\" y=\"123\">-2</text><text x=\"57\" y=\"103\">-1</text><text x=\"57\" y=\"63\">1</text><text x=\"57\" y=\"43\">2</text><text x=\"57\" y=\"23\">3</text><text x=\"57\" y=\"3\">4</text></g><path d=\"M120.0 100.0 L122.0 103.8 L124.0 107.2 L126.0 110.2 L128.0 112.8 L130.0 115.0 L132.0 116.8 L134.0 118.2 L136.0 119.2 L138.0 119.8 L140.0 120.0 L142.0 119.8 L144.0 119.2 L146.0 118.2 L148.0 116.8 L150.0 115.0 L152.0 112.8 L154.0 110.2 L156.0 107.2 L158.0 103.8 L160.0 100.0 L162.0 95.8 L164.0 91.2 L166.0 86.2 L168.0 80.8 L170.0 75.0 L172.0 68.8 L174.0 62.2 L176.0 55.2 L178.0 47.8 L180.0 40.0 L182.0 31.8 L184.0 23.2 L186.0 14.2 L188.0 4.8 L190.0 -5.0M60.0 120.0 L120.0 60.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"120.0\" cy=\"60.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"120.0\" cy=\"100.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.32AB12":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V160\"/><path d=\"M0 100H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"111\">-5</text><text x=\"20\" y=\"111\">-4</text><text x=\"40\" y=\"111\">-3</text><text x=\"60\" y=\"111\">-2</text><text x=\"80\" y=\"111\">-1</text><text x=\"120\" y=\"111\">1</text><text x=\"140\" y=\"111\">2</text><text x=\"160\" y=\"111\">3</text><text x=\"180\" y=\"111\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"163\">-3</text><text x=\"97\" y=\"143\">-2</text><text x=\"97\" y=\"123\">-1</text><text x=\"97\" y=\"83\">1</text><text x=\"97\" y=\"63\">2</text><text x=\"97\" y=\"43\">3</text><text x=\"97\" y=\"23\">4</text><text x=\"97\" y=\"3\">5</text></g><path d=\"M64.0 164.8 L66.0 157.8 L68.0 151.2 L70.0 145.0 L72.0 139.2 L74.0 133.8 L76.0 128.8 L78.0 124.2 L80.0 120.0M80.0 120.0 L82.0 116.2 L84.0 112.8 L86.0 109.8 L88.0 107.2 L90.0 105.0 L92.0 103.2 L94.0 101.8 L96.0 100.8 L98.0 100.2 L100.0 100.0M100.0 100.0 L102.0 99.8 L104.0 99.2 L106.0 98.2 L108.0 96.8 L110.0 95.0 L112.0 92.8 L114.0 90.2 L116.0 87.2 L118.0 83.8 L120.0 80.0 L122.0 75.8 L124.0 71.2 L126.0 66.2 L128.0 60.8 L130.0 55.0 L132.0 48.8 L134.0 42.2 L136.0 35.2 L138.0 27.8 L140.0 20.0 L142.0 11.8 L144.0 3.2 L146.0 -5.8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"120.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"100.0\" cy=\"100.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.36C01E":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M120 0V160\"/><path d=\"M0 120H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-6</text><text x=\"20\" y=\"131\">-5</text><text x=\"40\" y=\"131\">-4</text><text x=\"60\" y=\"131\">-3</text><text x=\"80\" y=\"131\">-2</text><text x=\"100\" y=\"131\">-1</text><text x=\"140\" y=\"131\">1</text><text x=\"160\" y=\"131\">2</text><text x=\"180\" y=\"131\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"117\" y=\"163\">-2</text><text x=\"117\" y=\"143\">-1</text><text x=\"117\" y=\"103\">1</text><text x=\"117\" y=\"83\">2</text><text x=\"117\" y=\"63\">3</text><text x=\"117\" y=\"43\">4</text><text x=\"117\" y=\"23\">5</text><text x=\"117\" y=\"3\">6</text></g><path d=\"M24.0 164.8 L26.0 157.8 L28.0 151.2 L30.0 145.0 L32.0 139.2 L34.0 133.8 L36.0 128.8 L38.0 124.2 L40.0 120.0 L42.0 116.2 L44.0 112.8 L46.0 109.8 L48.0 107.2 L50.0 105.0 L52.0 103.2 L54.0 101.8 L56.0 100.8 L58.0 100.2 L60.0 100.0 L62.0 100.2 L64.0 100.8 L66.0 101.8 L68.0 103.2 L70.0 105.0 L72.0 107.2 L74.0 109.8 L76.0 112.8 L78.0 116.2 L80.0 120.0M80.0 120.0 L82.0 112.2 L84.0 104.8 L86.0 97.8 L88.0 91.2 L90.0 85.0 L92.0 79.2 L94.0 73.8 L96.0 68.8 L98.0 64.2 L100.0 60.0 L102.0 56.2 L104.0 52.8 L106.0 49.8 L108.0 47.2 L110.0 45.0 L112.0 43.2 L114.0 41.8 L116.0 40.8 L118.0 40.2 L120.0 40.0 L122.0 40.2 L124.0 40.8 L126.0 41.8 L128.0 43.2 L130.0 45.0 L132.0 47.2 L134.0 49.8 L136.0 52.8 L138.0 56.2 L140.0 60.0 L142.0 64.2 L144.0 68.8 L146.0 73.8 L148.0 79.2 L150.0 85.0 L152.0 91.2 L154.0 97.8 L156.0 104.8 L158.0 112.2 L160.0 120.0 L162.0 128.2 L164.0 136.8 L166.0 145.8 L168.0 155.2 L170.0 165.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.DB3225":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V160\"/><path d=\"M0 60H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"71\">-3</text><text x=\"20\" y=\"71\">-2</text><text x=\"40\" y=\"71\">-1</text><text x=\"80\" y=\"71\">1</text><text x=\"100\" y=\"71\">2</text><text x=\"120\" y=\"71\">3</text><text x=\"140\" y=\"71\">4</text><text x=\"160\" y=\"71\">5</text><text x=\"180\" y=\"71\">6</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"163\">-5</text><text x=\"57\" y=\"143\">-4</text><text x=\"57\" y=\"123\">-3</text><text x=\"57\" y=\"103\">-2</text><text x=\"57\" y=\"83\">-1</text><text x=\"57\" y=\"43\">1</text><text x=\"57\" y=\"23\">2</text><text x=\"57\" y=\"3\">3</text></g><path d=\"M100.0 100.0 L102.0 103.8 L104.0 107.2 L106.0 110.2 L108.0 112.8 L110.0 115.0 L112.0 116.8 L114.0 118.2 L116.0 119.2 L118.0 119.8 L120.0 120.0 L122.0 119.8 L124.0 119.2 L126.0 118.2 L128.0 116.8 L130.0 115.0 L132.0 112.8 L134.0 110.2 L136.0 107.2 L138.0 103.8 L140.0 100.0 L142.0 95.8 L144.0 91.2 L146.0 86.2 L148.0 80.8 L150.0 75.0 L152.0 68.8 L154.0 62.2 L156.0 55.2 L158.0 47.8 L160.0 40.0 L162.0 31.8 L164.0 23.2 L166.0 14.2 L168.0 4.8 L170.0 -5.0M50.0 130.0 L100.0 80.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"80.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"100.0\" cy=\"100.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.B817D5":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 244\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"220\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V220\"/><path d=\"M20 0V220\"/><path d=\"M40 0V220\"/><path d=\"M60 0V220\"/><path d=\"M80 0V220\"/><path d=\"M100 0V220\"/><path d=\"M120 0V220\"/><path d=\"M140 0V220\"/><path d=\"M160 0V220\"/><path d=\"M180 0V220\"/><path d=\"M0 220 H180\"/><path d=\"M0 200 H180\"/><path d=\"M0 180 H180\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M120 0V220\"/><path d=\"M0 180H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"191\">-6</text><text x=\"20\" y=\"191\">-5</text><text x=\"40\" y=\"191\">-4</text><text x=\"60\" y=\"191\">-3</text><text x=\"80\" y=\"191\">-2</text><text x=\"100\" y=\"191\">-1</text><text x=\"140\" y=\"191\">1</text><text x=\"160\" y=\"191\">2</text><text x=\"180\" y=\"191\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"117\" y=\"223\">-2</text><text x=\"117\" y=\"203\">-1</text><text x=\"117\" y=\"163\">1</text><text x=\"117\" y=\"143\">2</text><text x=\"117\" y=\"123\">3</text><text x=\"117\" y=\"103\">4</text><text x=\"117\" y=\"83\">5</text><text x=\"117\" y=\"63\">6</text><text x=\"117\" y=\"43\">7</text><text x=\"117\" y=\"23\">8</text><text x=\"117\" y=\"3\">9</text></g><path d=\"M8.0 223.2 L10.0 215.0 L12.0 207.2 L14.0 199.8 L16.0 192.8 L18.0 186.2 L20.0 180.0 L22.0 174.2 L24.0 168.8 L26.0 163.8 L28.0 159.2 L30.0 155.0 L32.0 151.2 L34.0 147.8 L36.0 144.8 L38.0 142.2 L40.0 140.0 L42.0 138.2 L44.0 136.8 L46.0 135.8 L48.0 135.2 L50.0 135.0 L52.0 135.2 L54.0 135.8 L56.0 136.8 L58.0 138.2 L60.0 140.0 L62.0 142.2 L64.0 144.8 L66.0 147.8 L68.0 151.2 L70.0 155.0 L72.0 159.2 L74.0 163.8 L76.0 168.8 L78.0 174.2 L80.0 180.0M80.0 180.0 L82.0 170.2 L84.0 160.8 L86.0 151.8 L88.0 143.2 L90.0 135.0 L92.0 127.2 L94.0 119.8 L96.0 112.8 L98.0 106.2 L100.0 100.0 L102.0 94.2 L104.0 88.8 L106.0 83.8 L108.0 79.2 L110.0 75.0 L112.0 71.2 L114.0 67.8 L116.0 64.8 L118.0 62.2 L120.0 60.0 L122.0 58.2 L124.0 56.8 L126.0 55.8 L128.0 55.2 L130.0 55.0 L132.0 55.2 L134.0 55.8 L136.0 56.8 L138.0 58.2 L140.0 60.0 L142.0 62.2 L144.0 64.8 L146.0 67.8 L148.0 71.2 L150.0 75.0 L152.0 79.2 L154.0 83.8 L156.0 88.8 L158.0 94.2 L160.0 100.0 L162.0 106.2 L164.0 112.8 L166.0 119.8 L168.0 127.2 L170.0 135.0 L172.0 143.2 L174.0 151.8 L176.0 160.8 L178.0 170.2 L180.0 180.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"180.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.AD9AD9":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V160\"/><path d=\"M0 120H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-3</text><text x=\"20\" y=\"131\">-2</text><text x=\"40\" y=\"131\">-1</text><text x=\"80\" y=\"131\">1</text><text x=\"100\" y=\"131\">2</text><text x=\"120\" y=\"131\">3</text><text x=\"140\" y=\"131\">4</text><text x=\"160\" y=\"131\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"163\">-2</text><text x=\"57\" y=\"143\">-1</text><text x=\"57\" y=\"103\">1</text><text x=\"57\" y=\"83\">2</text><text x=\"57\" y=\"63\">3</text><text x=\"57\" y=\"43\">4</text><text x=\"57\" y=\"23\">5</text><text x=\"57\" y=\"3\">6</text></g><path d=\"M0.0 165.0 L2.0 162.0 L4.0 159.2 L6.0 156.4 L8.0 153.8 L10.0 151.2 L12.0 148.8 L14.0 146.4 L16.0 144.2 L18.0 142.1 L20.0 140.0 L22.0 138.1 L24.0 136.2 L26.0 134.4 L28.0 132.8 L30.0 131.2 L32.0 129.8 L34.0 128.5 L36.0 127.2 L38.0 126.1 L40.0 125.0 L42.0 124.0 L44.0 123.2 L46.0 122.5 L48.0 121.8 L50.0 121.2 L52.0 120.8 L54.0 120.5 L56.0 120.2 L58.0 120.1 L60.0 120.0M60.0 120.0 L62.0 119.9 L64.0 119.8 L66.0 119.5 L68.0 119.2 L70.0 118.8 L72.0 118.2 L74.0 117.6 L76.0 116.8 L78.0 116.0 L80.0 115.0 L82.0 113.9 L84.0 112.8 L86.0 111.5 L88.0 110.2 L90.0 108.8 L92.0 107.2 L94.0 105.5 L96.0 103.8 L98.0 102.0 L100.0 100.0M100.0 100.0 L102.0 98.0 L104.0 95.8 L106.0 93.6 L108.0 91.2 L110.0 88.8 L112.0 86.2 L114.0 83.6 L116.0 80.8 L118.0 78.0 L120.0 75.0 L122.0 71.9 L124.0 68.8 L126.0 65.6 L128.0 62.2 L130.0 58.8 L132.0 55.2 L134.0 51.5 L136.0 47.8 L138.0 44.0 L140.0 40.0 L142.0 36.0 L144.0 31.8 L146.0 27.6 L148.0 23.2 L150.0 18.8 L152.0 14.2 L154.0 9.5 L156.0 4.8 L158.0 -0.1 L160.0 -5.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"100.0\" cy=\"100.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.880BD7":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 244\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"220\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V220\"/><path d=\"M20 0V220\"/><path d=\"M40 0V220\"/><path d=\"M60 0V220\"/><path d=\"M80 0V220\"/><path d=\"M100 0V220\"/><path d=\"M120 0V220\"/><path d=\"M140 0V220\"/><path d=\"M160 0V220\"/><path d=\"M180 0V220\"/><path d=\"M0 220 H180\"/><path d=\"M0 200 H180\"/><path d=\"M0 180 H180\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V220\"/><path d=\"M0 180H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"191\">-3</text><text x=\"20\" y=\"191\">-2</text><text x=\"40\" y=\"191\">-1</text><text x=\"80\" y=\"191\">1</text><text x=\"100\" y=\"191\">2</text><text x=\"120\" y=\"191\">3</text><text x=\"140\" y=\"191\">4</text><text x=\"160\" y=\"191\">5</text><text x=\"180\" y=\"191\">6</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"223\">-2</text><text x=\"57\" y=\"203\">-1</text><text x=\"57\" y=\"163\">1</text><text x=\"57\" y=\"143\">2</text><text x=\"57\" y=\"123\">3</text><text x=\"57\" y=\"103\">4</text><text x=\"57\" y=\"83\">5</text><text x=\"57\" y=\"63\">6</text><text x=\"57\" y=\"43\">7</text><text x=\"57\" y=\"23\">8</text><text x=\"57\" y=\"3\">9</text></g><path d=\"M24.0 228.6 L26.0 223.4 L28.0 218.4 L30.0 213.8 L32.0 209.4 L34.0 205.3 L36.0 201.6 L38.0 198.2 L40.0 195.0 L42.0 192.2 L44.0 189.6 L46.0 187.3 L48.0 185.4 L50.0 183.8 L52.0 182.4 L54.0 181.4 L56.0 180.6 L58.0 180.2 L60.0 180.0M60.0 180.0 L62.0 179.8 L64.0 179.4 L66.0 178.6 L68.0 177.6 L70.0 176.2 L72.0 174.6 L74.0 172.7 L76.0 170.4 L78.0 167.8 L80.0 165.0 L82.0 161.8 L84.0 158.4 L86.0 154.7 L88.0 150.6 L90.0 146.2 L92.0 141.6 L94.0 136.7 L96.0 131.4 L98.0 125.9 L100.0 120.0 L102.0 113.8 L104.0 107.4 L106.0 100.7 L108.0 93.6 L110.0 86.2 L112.0 78.6 L114.0 70.6 L116.0 62.4 L118.0 53.8 L120.0 45.0M120.0 45.0 L122.0 35.8 L124.0 26.4 L126.0 16.7 L128.0 6.6 L130.0 -3.8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"180.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"120.0\" cy=\"45.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.89C3D3":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 228 204\" role=\"img\" aria-label=\"График функции\" style=\"max-width:228px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"200\" height=\"180\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V180\"/><path d=\"M20 0V180\"/><path d=\"M40 0V180\"/><path d=\"M60 0V180\"/><path d=\"M80 0V180\"/><path d=\"M100 0V180\"/><path d=\"M120 0V180\"/><path d=\"M140 0V180\"/><path d=\"M160 0V180\"/><path d=\"M180 0V180\"/><path d=\"M200 0V180\"/><path d=\"M0 180 H200\"/><path d=\"M0 160 H200\"/><path d=\"M0 140 H200\"/><path d=\"M0 120 H200\"/><path d=\"M0 100 H200\"/><path d=\"M0 80 H200\"/><path d=\"M0 60 H200\"/><path d=\"M0 40 H200\"/><path d=\"M0 20 H200\"/><path d=\"M0 0 H200\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M140 0V180\"/><path d=\"M0 40H200\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-7</text><text x=\"20\" y=\"51\">-6</text><text x=\"40\" y=\"51\">-5</text><text x=\"60\" y=\"51\">-4</text><text x=\"80\" y=\"51\">-3</text><text x=\"100\" y=\"51\">-2</text><text x=\"120\" y=\"51\">-1</text><text x=\"160\" y=\"51\">1</text><text x=\"180\" y=\"51\">2</text><text x=\"200\" y=\"51\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"137\" y=\"183\">-7</text><text x=\"137\" y=\"163\">-6</text><text x=\"137\" y=\"143\">-5</text><text x=\"137\" y=\"123\">-4</text><text x=\"137\" y=\"103\">-3</text><text x=\"137\" y=\"83\">-2</text><text x=\"137\" y=\"63\">-1</text><text x=\"137\" y=\"23\">1</text><text x=\"137\" y=\"3\">2</text></g><path d=\"M60.0 60.0 L62.0 67.8 L64.0 75.2 L66.0 82.2 L68.0 88.8 L70.0 95.0 L72.0 100.8 L74.0 106.2 L76.0 111.2 L78.0 115.8 L80.0 120.0 L82.0 123.8 L84.0 127.2 L86.0 130.2 L88.0 132.8 L90.0 135.0 L92.0 136.8 L94.0 138.2 L96.0 139.2 L98.0 139.8 L100.0 140.0 L102.0 139.8 L104.0 139.2 L106.0 138.2 L108.0 136.8 L110.0 135.0 L112.0 132.8 L114.0 130.2 L116.0 127.2 L118.0 123.8 L120.0 120.0 L122.0 115.8 L124.0 111.2 L126.0 106.2 L128.0 100.8 L130.0 95.0 L132.0 88.8 L134.0 82.2 L136.0 75.2 L138.0 67.8 L140.0 60.0 L142.0 51.8 L144.0 43.2 L146.0 34.2 L148.0 24.8 L150.0 15.0 L152.0 4.8 L154.0 -5.8M0.0 180.0 L30.0 150.0 L60.0 120.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"120.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"60.0\" cy=\"60.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.5E5852":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 228 364\" role=\"img\" aria-label=\"График функции\" style=\"max-width:228px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"200\" height=\"340\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V340\"/><path d=\"M20 0V340\"/><path d=\"M40 0V340\"/><path d=\"M60 0V340\"/><path d=\"M80 0V340\"/><path d=\"M100 0V340\"/><path d=\"M120 0V340\"/><path d=\"M140 0V340\"/><path d=\"M160 0V340\"/><path d=\"M180 0V340\"/><path d=\"M200 0V340\"/><path d=\"M0 340 H200\"/><path d=\"M0 320 H200\"/><path d=\"M0 300 H200\"/><path d=\"M0 280 H200\"/><path d=\"M0 260 H200\"/><path d=\"M0 240 H200\"/><path d=\"M0 220 H200\"/><path d=\"M0 200 H200\"/><path d=\"M0 180 H200\"/><path d=\"M0 160 H200\"/><path d=\"M0 140 H200\"/><path d=\"M0 120 H200\"/><path d=\"M0 100 H200\"/><path d=\"M0 80 H200\"/><path d=\"M0 60 H200\"/><path d=\"M0 40 H200\"/><path d=\"M0 20 H200\"/><path d=\"M0 0 H200\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M120 0V340\"/><path d=\"M0 240H200\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"251\">-6</text><text x=\"20\" y=\"251\">-5</text><text x=\"40\" y=\"251\">-4</text><text x=\"60\" y=\"251\">-3</text><text x=\"80\" y=\"251\">-2</text><text x=\"100\" y=\"251\">-1</text><text x=\"140\" y=\"251\">1</text><text x=\"160\" y=\"251\">2</text><text x=\"180\" y=\"251\">3</text><text x=\"200\" y=\"251\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"117\" y=\"323\">-4</text><text x=\"117\" y=\"283\">-2</text><text x=\"117\" y=\"203\">2</text><text x=\"117\" y=\"163\">4</text><text x=\"117\" y=\"123\">6</text><text x=\"117\" y=\"83\">8</text><text x=\"117\" y=\"43\">10</text><text x=\"117\" y=\"3\">12</text></g><path d=\"M0.0 120.0 L2.0 110.2 L4.0 100.8 L6.0 91.8 L8.0 83.2 L10.0 75.0 L12.0 67.2 L14.0 59.8 L16.0 52.8 L18.0 46.2 L20.0 40.0 L22.0 34.2 L24.0 28.8 L26.0 23.8 L28.0 19.2 L30.0 15.0 L32.0 11.2 L34.0 7.8 L36.0 4.8 L38.0 2.2 L40.0 0.0 L42.0 -1.8 L44.0 -3.2 L46.0 -4.2 L48.0 -4.8 L50.0 -5.0 L52.0 -4.8 L54.0 -4.2 L56.0 -3.2 L58.0 -1.8 L60.0 0.0 L62.0 2.2 L64.0 4.8 L66.0 7.8 L68.0 11.2 L70.0 15.0 L72.0 19.2 L74.0 23.8 L76.0 28.8 L78.0 34.2 L80.0 40.0 L82.0 46.2 L84.0 52.8 L86.0 59.8 L88.0 67.2 L90.0 75.0 L92.0 83.2 L94.0 91.8 L96.0 100.8 L98.0 110.2 L100.0 120.0 L102.0 130.2 L104.0 140.8 L106.0 151.8 L108.0 163.2 L110.0 175.0 L112.0 187.2 L114.0 199.8 L116.0 212.8 L118.0 226.2 L120.0 240.0M120.0 240.0 L122.0 245.8 L124.0 251.2 L126.0 256.2 L128.0 260.8 L130.0 265.0 L132.0 268.8 L134.0 272.2 L136.0 275.2 L138.0 277.8 L140.0 280.0 L142.0 281.8 L144.0 283.2 L146.0 284.2 L148.0 284.8 L150.0 285.0 L152.0 284.8 L154.0 284.2 L156.0 283.2 L158.0 281.8 L160.0 280.0 L162.0 277.8 L164.0 275.2 L166.0 272.2 L168.0 268.8 L170.0 265.0 L172.0 260.8 L174.0 256.2 L176.0 251.2 L178.0 245.8 L180.0 240.0 L182.0 233.8 L184.0 227.2 L186.0 220.2 L188.0 212.8 L190.0 205.0 L192.0 196.8 L194.0 188.2 L196.0 179.2 L198.0 169.8 L200.0 160.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"120.0\" cy=\"240.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.91BF55":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 268 284\" role=\"img\" aria-label=\"График функции\" style=\"max-width:268px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"240\" height=\"260\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V260\"/><path d=\"M20 0V260\"/><path d=\"M40 0V260\"/><path d=\"M60 0V260\"/><path d=\"M80 0V260\"/><path d=\"M100 0V260\"/><path d=\"M120 0V260\"/><path d=\"M140 0V260\"/><path d=\"M160 0V260\"/><path d=\"M180 0V260\"/><path d=\"M200 0V260\"/><path d=\"M220 0V260\"/><path d=\"M240 0V260\"/><path d=\"M0 260 H240\"/><path d=\"M0 240 H240\"/><path d=\"M0 220 H240\"/><path d=\"M0 200 H240\"/><path d=\"M0 180 H240\"/><path d=\"M0 160 H240\"/><path d=\"M0 140 H240\"/><path d=\"M0 120 H240\"/><path d=\"M0 100 H240\"/><path d=\"M0 80 H240\"/><path d=\"M0 60 H240\"/><path d=\"M0 40 H240\"/><path d=\"M0 20 H240\"/><path d=\"M0 0 H240\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V260\"/><path d=\"M0 40H240\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-3</text><text x=\"20\" y=\"51\">-2</text><text x=\"40\" y=\"51\">-1</text><text x=\"80\" y=\"51\">1</text><text x=\"100\" y=\"51\">2</text><text x=\"120\" y=\"51\">3</text><text x=\"140\" y=\"51\">4</text><text x=\"160\" y=\"51\">5</text><text x=\"180\" y=\"51\">6</text><text x=\"200\" y=\"51\">7</text><text x=\"220\" y=\"51\">8</text><text x=\"240\" y=\"51\">9</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"263\">-11</text><text x=\"57\" y=\"243\">-10</text><text x=\"57\" y=\"223\">-9</text><text x=\"57\" y=\"203\">-8</text><text x=\"57\" y=\"183\">-7</text><text x=\"57\" y=\"163\">-6</text><text x=\"57\" y=\"143\">-5</text><text x=\"57\" y=\"123\">-4</text><text x=\"57\" y=\"103\">-3</text><text x=\"57\" y=\"83\">-2</text><text x=\"57\" y=\"63\">-1</text><text x=\"57\" y=\"23\">1</text><text x=\"57\" y=\"3\">2</text></g><path d=\"M30.0 -5.0 L32.0 4.8 L34.0 14.2 L36.0 23.2 L38.0 31.8 L40.0 40.0 L42.0 47.8 L44.0 55.2 L46.0 62.2 L48.0 68.8 L50.0 75.0 L52.0 80.8 L54.0 86.2 L56.0 91.2 L58.0 95.8 L60.0 100.0 L62.0 103.8 L64.0 107.2 L66.0 110.2 L68.0 112.8 L70.0 115.0 L72.0 116.8 L74.0 118.2 L76.0 119.2 L78.0 119.8 L80.0 120.0 L82.0 119.8 L84.0 119.2 L86.0 118.2 L88.0 116.8 L90.0 115.0 L92.0 112.8 L94.0 110.2 L96.0 107.2 L98.0 103.8 L100.0 100.0 L102.0 95.8 L104.0 91.2 L106.0 86.2 L108.0 80.8 L110.0 75.0 L112.0 68.8 L114.0 62.2 L116.0 55.2 L118.0 47.8 L120.0 40.0M120.0 40.0 L122.0 51.8 L124.0 63.2 L126.0 74.2 L128.0 84.8 L130.0 95.0 L132.0 104.8 L134.0 114.2 L136.0 123.2 L138.0 131.8 L140.0 140.0 L142.0 147.8 L144.0 155.2 L146.0 162.2 L148.0 168.8 L150.0 175.0 L152.0 180.8 L154.0 186.2 L156.0 191.2 L158.0 195.8 L160.0 200.0 L162.0 203.8 L164.0 207.2 L166.0 210.2 L168.0 212.8 L170.0 215.0 L172.0 216.8 L174.0 218.2 L176.0 219.2 L178.0 219.8 L180.0 220.0 L182.0 219.8 L184.0 219.2 L186.0 218.2 L188.0 216.8 L190.0 215.0 L192.0 212.8 L194.0 210.2 L196.0 207.2 L198.0 203.8 L200.0 200.0 L202.0 195.8 L204.0 191.2 L206.0 186.2 L208.0 180.8 L210.0 175.0 L212.0 168.8 L214.0 162.2 L216.0 155.2 L218.0 147.8 L220.0 140.0 L222.0 131.8 L224.0 123.2 L226.0 114.2 L228.0 104.8 L230.0 95.0 L232.0 84.8 L234.0 74.2 L236.0 63.2 L238.0 51.8 L240.0 40.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"120.0\" cy=\"40.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.E1EE5C":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M120 0V160\"/><path d=\"M0 120H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-6</text><text x=\"20\" y=\"131\">-5</text><text x=\"40\" y=\"131\">-4</text><text x=\"60\" y=\"131\">-3</text><text x=\"80\" y=\"131\">-2</text><text x=\"100\" y=\"131\">-1</text><text x=\"140\" y=\"131\">1</text><text x=\"160\" y=\"131\">2</text><text x=\"180\" y=\"131\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"117\" y=\"163\">-2</text><text x=\"117\" y=\"143\">-1</text><text x=\"117\" y=\"103\">1</text><text x=\"117\" y=\"83\">2</text><text x=\"117\" y=\"63\">3</text><text x=\"117\" y=\"43\">4</text><text x=\"117\" y=\"23\">5</text><text x=\"117\" y=\"3\">6</text></g><path d=\"M60.0 80.0 L62.0 76.2 L64.0 72.8 L66.0 69.8 L68.0 67.2 L70.0 65.0 L72.0 63.2 L74.0 61.8 L76.0 60.8 L78.0 60.2 L80.0 60.0 L82.0 60.2 L84.0 60.8 L86.0 61.8 L88.0 63.2 L90.0 65.0 L92.0 67.2 L94.0 69.8 L96.0 72.8 L98.0 76.2 L100.0 80.0 L102.0 84.2 L104.0 88.8 L106.0 93.8 L108.0 99.2 L110.0 105.0 L112.0 111.2 L114.0 117.8 L116.0 124.8 L118.0 132.2 L120.0 140.0 L122.0 148.2 L124.0 156.8 L126.0 165.8M0.0 60.0 L30.0 90.0 L60.0 120.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"120.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"60.0\" cy=\"80.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.5C9FAE":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 248 364\" role=\"img\" aria-label=\"График функции\" style=\"max-width:248px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"220\" height=\"340\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V340\"/><path d=\"M20 0V340\"/><path d=\"M40 0V340\"/><path d=\"M60 0V340\"/><path d=\"M80 0V340\"/><path d=\"M100 0V340\"/><path d=\"M120 0V340\"/><path d=\"M140 0V340\"/><path d=\"M160 0V340\"/><path d=\"M180 0V340\"/><path d=\"M200 0V340\"/><path d=\"M220 0V340\"/><path d=\"M0 340 H220\"/><path d=\"M0 320 H220\"/><path d=\"M0 300 H220\"/><path d=\"M0 280 H220\"/><path d=\"M0 260 H220\"/><path d=\"M0 240 H220\"/><path d=\"M0 220 H220\"/><path d=\"M0 200 H220\"/><path d=\"M0 180 H220\"/><path d=\"M0 160 H220\"/><path d=\"M0 140 H220\"/><path d=\"M0 120 H220\"/><path d=\"M0 100 H220\"/><path d=\"M0 80 H220\"/><path d=\"M0 60 H220\"/><path d=\"M0 40 H220\"/><path d=\"M0 20 H220\"/><path d=\"M0 0 H220\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M120 0V340\"/><path d=\"M0 220H220\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"231\">-6</text><text x=\"20\" y=\"231\">-5</text><text x=\"40\" y=\"231\">-4</text><text x=\"60\" y=\"231\">-3</text><text x=\"80\" y=\"231\">-2</text><text x=\"100\" y=\"231\">-1</text><text x=\"140\" y=\"231\">1</text><text x=\"160\" y=\"231\">2</text><text x=\"180\" y=\"231\">3</text><text x=\"200\" y=\"231\">4</text><text x=\"220\" y=\"231\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"117\" y=\"343\">-6</text><text x=\"117\" y=\"303\">-4</text><text x=\"117\" y=\"263\">-2</text><text x=\"117\" y=\"183\">2</text><text x=\"117\" y=\"143\">4</text><text x=\"117\" y=\"103\">6</text><text x=\"117\" y=\"63\">8</text><text x=\"117\" y=\"23\">10</text></g><path d=\"M0.0 220.0 L2.0 208.2 L4.0 196.8 L6.0 185.8 L8.0 175.2 L10.0 165.0 L12.0 155.2 L14.0 145.8 L16.0 136.8 L18.0 128.2 L20.0 120.0 L22.0 112.2 L24.0 104.8 L26.0 97.8 L28.0 91.2 L30.0 85.0 L32.0 79.2 L34.0 73.8 L36.0 68.8 L38.0 64.2 L40.0 60.0 L42.0 56.2 L44.0 52.8 L46.0 49.8 L48.0 47.2 L50.0 45.0 L52.0 43.2 L54.0 41.8 L56.0 40.8 L58.0 40.2 L60.0 40.0 L62.0 40.2 L64.0 40.8 L66.0 41.8 L68.0 43.2 L70.0 45.0 L72.0 47.2 L74.0 49.8 L76.0 52.8 L78.0 56.2 L80.0 60.0 L82.0 64.2 L84.0 68.8 L86.0 73.8 L88.0 79.2 L90.0 85.0 L92.0 91.2 L94.0 97.8 L96.0 104.8 L98.0 112.2 L100.0 120.0 L102.0 128.2 L104.0 136.8 L106.0 145.8 L108.0 155.2 L110.0 165.0 L112.0 175.2 L114.0 185.8 L116.0 196.8 L118.0 208.2 L120.0 220.0M120.0 220.0 L122.0 227.8 L124.0 235.2 L126.0 242.2 L128.0 248.8 L130.0 255.0 L132.0 260.8 L134.0 266.2 L136.0 271.2 L138.0 275.8 L140.0 280.0 L142.0 283.8 L144.0 287.2 L146.0 290.2 L148.0 292.8 L150.0 295.0 L152.0 296.8 L154.0 298.2 L156.0 299.2 L158.0 299.8 L160.0 300.0 L162.0 299.8 L164.0 299.2 L166.0 298.2 L168.0 296.8 L170.0 295.0 L172.0 292.8 L174.0 290.2 L176.0 287.2 L178.0 283.8 L180.0 280.0 L182.0 275.8 L184.0 271.2 L186.0 266.2 L188.0 260.8 L190.0 255.0 L192.0 248.8 L194.0 242.2 L196.0 235.2 L198.0 227.8 L200.0 220.0 L202.0 211.8 L204.0 203.2 L206.0 194.2 L208.0 184.8 L210.0 175.0 L212.0 164.8 L214.0 154.2 L216.0 143.2 L218.0 131.8 L220.0 120.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"120.0\" cy=\"220.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.32C5AB":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 268 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:268px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"240\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M220 0V160\"/><path d=\"M240 0V160\"/><path d=\"M0 160 H240\"/><path d=\"M0 140 H240\"/><path d=\"M0 120 H240\"/><path d=\"M0 100 H240\"/><path d=\"M0 80 H240\"/><path d=\"M0 60 H240\"/><path d=\"M0 40 H240\"/><path d=\"M0 20 H240\"/><path d=\"M0 0 H240\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V160\"/><path d=\"M0 120H240\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-3</text><text x=\"20\" y=\"131\">-2</text><text x=\"40\" y=\"131\">-1</text><text x=\"80\" y=\"131\">1</text><text x=\"100\" y=\"131\">2</text><text x=\"120\" y=\"131\">3</text><text x=\"140\" y=\"131\">4</text><text x=\"160\" y=\"131\">5</text><text x=\"180\" y=\"131\">6</text><text x=\"200\" y=\"131\">7</text><text x=\"220\" y=\"131\">8</text><text x=\"240\" y=\"131\">9</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"163\">-2</text><text x=\"57\" y=\"143\">-1</text><text x=\"57\" y=\"103\">1</text><text x=\"57\" y=\"83\">2</text><text x=\"57\" y=\"63\">3</text><text x=\"57\" y=\"43\">4</text><text x=\"57\" y=\"23\">5</text><text x=\"57\" y=\"3\">6</text></g><path d=\"M118.0 166.2 L120.0 160.0 L122.0 154.2 L124.0 148.8 L126.0 143.8 L128.0 139.2 L130.0 135.0 L132.0 131.2 L134.0 127.8 L136.0 124.8 L138.0 122.2 L140.0 120.0 L142.0 118.2 L144.0 116.8 L146.0 115.8 L148.0 115.2 L150.0 115.0 L152.0 115.2 L154.0 115.8 L156.0 116.8 L158.0 118.2 L160.0 120.0M160.0 120.0 L162.0 114.2 L164.0 108.8 L166.0 103.8 L168.0 99.2 L170.0 95.0 L172.0 91.2 L174.0 87.8 L176.0 84.8 L178.0 82.2 L180.0 80.0 L182.0 78.2 L184.0 76.8 L186.0 75.8 L188.0 75.2 L190.0 75.0 L192.0 75.2 L194.0 75.8 L196.0 76.8 L198.0 78.2 L200.0 80.0 L202.0 82.2 L204.0 84.8 L206.0 87.8 L208.0 91.2 L210.0 95.0 L212.0 99.2 L214.0 103.8 L216.0 108.8 L218.0 114.2 L220.0 120.0 L222.0 126.2 L224.0 132.8 L226.0 139.8 L228.0 147.2 L230.0 155.0 L232.0 163.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"160.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.A2BECD":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V160\"/><path d=\"M0 120H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-3</text><text x=\"20\" y=\"131\">-2</text><text x=\"40\" y=\"131\">-1</text><text x=\"80\" y=\"131\">1</text><text x=\"100\" y=\"131\">2</text><text x=\"120\" y=\"131\">3</text><text x=\"140\" y=\"131\">4</text><text x=\"160\" y=\"131\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"163\">-2</text><text x=\"57\" y=\"143\">-1</text><text x=\"57\" y=\"103\">1</text><text x=\"57\" y=\"83\">2</text><text x=\"57\" y=\"63\">3</text><text x=\"57\" y=\"43\">4</text><text x=\"57\" y=\"23\">5</text><text x=\"57\" y=\"3\">6</text></g><path d=\"M24.0 168.6 L26.0 163.4 L28.0 158.4 L30.0 153.8 L32.0 149.4 L34.0 145.3 L36.0 141.6 L38.0 138.2 L40.0 135.0 L42.0 132.2 L44.0 129.6 L46.0 127.4 L48.0 125.4 L50.0 123.8 L52.0 122.4 L54.0 121.3 L56.0 120.6 L58.0 120.2 L60.0 120.0M60.0 120.0 L62.0 119.8 L64.0 119.4 L66.0 118.7 L68.0 117.6 L70.0 116.2 L72.0 114.6 L74.0 112.7 L76.0 110.4 L78.0 107.8 L80.0 105.0 L82.0 101.8 L84.0 98.4 L86.0 94.7 L88.0 90.6 L90.0 86.2 L92.0 81.6 L94.0 76.7 L96.0 71.4 L98.0 65.8 L100.0 60.0M100.0 60.0 L102.0 53.8 L104.0 47.4 L106.0 40.7 L108.0 33.6 L110.0 26.2 L112.0 18.6 L114.0 10.6 L116.0 2.4 L118.0 -6.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"100.0\" cy=\"60.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.D89894":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 248 444\" role=\"img\" aria-label=\"График функции\" style=\"max-width:248px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"220\" height=\"420\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V420\"/><path d=\"M20 0V420\"/><path d=\"M40 0V420\"/><path d=\"M60 0V420\"/><path d=\"M80 0V420\"/><path d=\"M100 0V420\"/><path d=\"M120 0V420\"/><path d=\"M140 0V420\"/><path d=\"M160 0V420\"/><path d=\"M180 0V420\"/><path d=\"M200 0V420\"/><path d=\"M220 0V420\"/><path d=\"M0 420 H220\"/><path d=\"M0 400 H220\"/><path d=\"M0 380 H220\"/><path d=\"M0 360 H220\"/><path d=\"M0 340 H220\"/><path d=\"M0 320 H220\"/><path d=\"M0 300 H220\"/><path d=\"M0 280 H220\"/><path d=\"M0 260 H220\"/><path d=\"M0 240 H220\"/><path d=\"M0 220 H220\"/><path d=\"M0 200 H220\"/><path d=\"M0 180 H220\"/><path d=\"M0 160 H220\"/><path d=\"M0 140 H220\"/><path d=\"M0 120 H220\"/><path d=\"M0 100 H220\"/><path d=\"M0 80 H220\"/><path d=\"M0 60 H220\"/><path d=\"M0 40 H220\"/><path d=\"M0 20 H220\"/><path d=\"M0 0 H220\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M120 0V420\"/><path d=\"M0 240H220\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"251\">-6</text><text x=\"20\" y=\"251\">-5</text><text x=\"40\" y=\"251\">-4</text><text x=\"60\" y=\"251\">-3</text><text x=\"80\" y=\"251\">-2</text><text x=\"100\" y=\"251\">-1</text><text x=\"140\" y=\"251\">1</text><text x=\"160\" y=\"251\">2</text><text x=\"180\" y=\"251\">3</text><text x=\"200\" y=\"251\">4</text><text x=\"220\" y=\"251\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"117\" y=\"403\">-8</text><text x=\"117\" y=\"363\">-6</text><text x=\"117\" y=\"323\">-4</text><text x=\"117\" y=\"283\">-2</text><text x=\"117\" y=\"203\">2</text><text x=\"117\" y=\"163\">4</text><text x=\"117\" y=\"123\">6</text><text x=\"117\" y=\"83\">8</text><text x=\"117\" y=\"43\">10</text><text x=\"117\" y=\"3\">12</text></g><path d=\"M0.0 120.0 L2.0 110.2 L4.0 100.8 L6.0 91.8 L8.0 83.2 L10.0 75.0 L12.0 67.2 L14.0 59.8 L16.0 52.8 L18.0 46.2 L20.0 40.0 L22.0 34.2 L24.0 28.8 L26.0 23.8 L28.0 19.2 L30.0 15.0 L32.0 11.2 L34.0 7.8 L36.0 4.8 L38.0 2.2 L40.0 0.0 L42.0 -1.8 L44.0 -3.2 L46.0 -4.2 L48.0 -4.8 L50.0 -5.0 L52.0 -4.8 L54.0 -4.2 L56.0 -3.2 L58.0 -1.8 L60.0 0.0 L62.0 2.2 L64.0 4.8 L66.0 7.8 L68.0 11.2 L70.0 15.0 L72.0 19.2 L74.0 23.8 L76.0 28.8 L78.0 34.2 L80.0 40.0 L82.0 46.2 L84.0 52.8 L86.0 59.8 L88.0 67.2 L90.0 75.0 L92.0 83.2 L94.0 91.8 L96.0 100.8 L98.0 110.2 L100.0 120.0 L102.0 130.2 L104.0 140.8 L106.0 151.8 L108.0 163.2 L110.0 175.0 L112.0 187.2 L114.0 199.8 L116.0 212.8 L118.0 226.2 L120.0 240.0M120.0 240.0 L122.0 249.8 L124.0 259.2 L126.0 268.2 L128.0 276.8 L130.0 285.0 L132.0 292.8 L134.0 300.2 L136.0 307.2 L138.0 313.8 L140.0 320.0 L142.0 325.8 L144.0 331.2 L146.0 336.2 L148.0 340.8 L150.0 345.0 L152.0 348.8 L154.0 352.2 L156.0 355.2 L158.0 357.8 L160.0 360.0 L162.0 361.8 L164.0 363.2 L166.0 364.2 L168.0 364.8 L170.0 365.0 L172.0 364.8 L174.0 364.2 L176.0 363.2 L178.0 361.8 L180.0 360.0 L182.0 357.8 L184.0 355.2 L186.0 352.2 L188.0 348.8 L190.0 345.0 L192.0 340.8 L194.0 336.2 L196.0 331.2 L198.0 325.8 L200.0 320.0 L202.0 313.8 L204.0 307.2 L206.0 300.2 L208.0 292.8 L210.0 285.0 L212.0 276.8 L214.0 268.2 L216.0 259.2 L218.0 249.8 L220.0 240.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"120.0\" cy=\"240.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.C7E39A":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V160\"/><path d=\"M0 100H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"111\">-5</text><text x=\"20\" y=\"111\">-4</text><text x=\"40\" y=\"111\">-3</text><text x=\"60\" y=\"111\">-2</text><text x=\"80\" y=\"111\">-1</text><text x=\"120\" y=\"111\">1</text><text x=\"140\" y=\"111\">2</text><text x=\"160\" y=\"111\">3</text><text x=\"180\" y=\"111\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"163\">-3</text><text x=\"97\" y=\"143\">-2</text><text x=\"97\" y=\"123\">-1</text><text x=\"97\" y=\"83\">1</text><text x=\"97\" y=\"63\">2</text><text x=\"97\" y=\"43\">3</text><text x=\"97\" y=\"23\">4</text><text x=\"97\" y=\"3\">5</text></g><path d=\"M48.0 167.6 L50.0 162.5 L52.0 157.6 L54.0 152.9 L56.0 148.4 L58.0 144.1 L60.0 140.0 L62.0 136.1 L64.0 132.4 L66.0 128.9 L68.0 125.6 L70.0 122.5 L72.0 119.6 L74.0 116.9 L76.0 114.4 L78.0 112.1 L80.0 110.0M80.0 110.0 L82.0 108.1 L84.0 106.4 L86.0 104.9 L88.0 103.6 L90.0 102.5 L92.0 101.6 L94.0 100.9 L96.0 100.4 L98.0 100.1 L100.0 100.0M100.0 100.0 L102.0 99.9 L104.0 99.6 L106.0 99.1 L108.0 98.4 L110.0 97.5 L112.0 96.4 L114.0 95.1 L116.0 93.6 L118.0 91.9 L120.0 90.0 L122.0 87.9 L124.0 85.6 L126.0 83.1 L128.0 80.4 L130.0 77.5 L132.0 74.4 L134.0 71.1 L136.0 67.6 L138.0 63.9 L140.0 60.0 L142.0 55.9 L144.0 51.6 L146.0 47.1 L148.0 42.4 L150.0 37.5 L152.0 32.4 L154.0 27.1 L156.0 21.6 L158.0 15.9 L160.0 10.0 L162.0 3.9 L164.0 -2.4 L166.0 -8.9\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"110.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"100.0\" cy=\"100.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.7D78E6":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 308 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:308px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"280\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M220 0V160\"/><path d=\"M240 0V160\"/><path d=\"M260 0V160\"/><path d=\"M280 0V160\"/><path d=\"M0 160 H280\"/><path d=\"M0 140 H280\"/><path d=\"M0 120 H280\"/><path d=\"M0 100 H280\"/><path d=\"M0 80 H280\"/><path d=\"M0 60 H280\"/><path d=\"M0 40 H280\"/><path d=\"M0 20 H280\"/><path d=\"M0 0 H280\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M220 0V160\"/><path d=\"M0 40H280\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-11</text><text x=\"20\" y=\"51\">-10</text><text x=\"40\" y=\"51\">-9</text><text x=\"60\" y=\"51\">-8</text><text x=\"80\" y=\"51\">-7</text><text x=\"100\" y=\"51\">-6</text><text x=\"120\" y=\"51\">-5</text><text x=\"140\" y=\"51\">-4</text><text x=\"160\" y=\"51\">-3</text><text x=\"180\" y=\"51\">-2</text><text x=\"200\" y=\"51\">-1</text><text x=\"240\" y=\"51\">1</text><text x=\"260\" y=\"51\">2</text><text x=\"280\" y=\"51\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"217\" y=\"163\">-6</text><text x=\"217\" y=\"143\">-5</text><text x=\"217\" y=\"123\">-4</text><text x=\"217\" y=\"103\">-3</text><text x=\"217\" y=\"83\">-2</text><text x=\"217\" y=\"63\">-1</text><text x=\"217\" y=\"23\">1</text><text x=\"217\" y=\"3\">2</text></g><path d=\"M24.0 -4.8 L26.0 2.2 L28.0 8.8 L30.0 15.0 L32.0 20.8 L34.0 26.2 L36.0 31.2 L38.0 35.8 L40.0 40.0 L42.0 43.8 L44.0 47.2 L46.0 50.2 L48.0 52.8 L50.0 55.0 L52.0 56.8 L54.0 58.2 L56.0 59.2 L58.0 59.8 L60.0 60.0 L62.0 59.8 L64.0 59.2 L66.0 58.2 L68.0 56.8 L70.0 55.0 L72.0 52.8 L74.0 50.2 L76.0 47.2 L78.0 43.8 L80.0 40.0M80.0 40.0 L82.0 47.8 L84.0 55.2 L86.0 62.2 L88.0 68.8 L90.0 75.0 L92.0 80.8 L94.0 86.2 L96.0 91.2 L98.0 95.8 L100.0 100.0 L102.0 103.8 L104.0 107.2 L106.0 110.2 L108.0 112.8 L110.0 115.0 L112.0 116.8 L114.0 118.2 L116.0 119.2 L118.0 119.8 L120.0 120.0 L122.0 119.8 L124.0 119.2 L126.0 118.2 L128.0 116.8 L130.0 115.0 L132.0 112.8 L134.0 110.2 L136.0 107.2 L138.0 103.8 L140.0 100.0 L142.0 95.8 L144.0 91.2 L146.0 86.2 L148.0 80.8 L150.0 75.0 L152.0 68.8 L154.0 62.2 L156.0 55.2 L158.0 47.8 L160.0 40.0 L162.0 31.8 L164.0 23.2 L166.0 14.2 L168.0 4.8 L170.0 -5.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"40.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.7B9160":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 248 364\" role=\"img\" aria-label=\"График функции\" style=\"max-width:248px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"220\" height=\"340\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V340\"/><path d=\"M20 0V340\"/><path d=\"M40 0V340\"/><path d=\"M60 0V340\"/><path d=\"M80 0V340\"/><path d=\"M100 0V340\"/><path d=\"M120 0V340\"/><path d=\"M140 0V340\"/><path d=\"M160 0V340\"/><path d=\"M180 0V340\"/><path d=\"M200 0V340\"/><path d=\"M220 0V340\"/><path d=\"M0 340 H220\"/><path d=\"M0 320 H220\"/><path d=\"M0 300 H220\"/><path d=\"M0 280 H220\"/><path d=\"M0 260 H220\"/><path d=\"M0 240 H220\"/><path d=\"M0 220 H220\"/><path d=\"M0 200 H220\"/><path d=\"M0 180 H220\"/><path d=\"M0 160 H220\"/><path d=\"M0 140 H220\"/><path d=\"M0 120 H220\"/><path d=\"M0 100 H220\"/><path d=\"M0 80 H220\"/><path d=\"M0 60 H220\"/><path d=\"M0 40 H220\"/><path d=\"M0 20 H220\"/><path d=\"M0 0 H220\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V340\"/><path d=\"M0 120H220\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-5</text><text x=\"20\" y=\"131\">-4</text><text x=\"40\" y=\"131\">-3</text><text x=\"60\" y=\"131\">-2</text><text x=\"80\" y=\"131\">-1</text><text x=\"120\" y=\"131\">1</text><text x=\"140\" y=\"131\">2</text><text x=\"160\" y=\"131\">3</text><text x=\"180\" y=\"131\">4</text><text x=\"200\" y=\"131\">5</text><text x=\"220\" y=\"131\">6</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"323\">-10</text><text x=\"97\" y=\"283\">-8</text><text x=\"97\" y=\"243\">-6</text><text x=\"97\" y=\"203\">-4</text><text x=\"97\" y=\"163\">-2</text><text x=\"97\" y=\"83\">2</text><text x=\"97\" y=\"43\">4</text><text x=\"97\" y=\"3\">6</text></g><path d=\"M0.0 220.0 L2.0 208.2 L4.0 196.8 L6.0 185.8 L8.0 175.2 L10.0 165.0 L12.0 155.2 L14.0 145.8 L16.0 136.8 L18.0 128.2 L20.0 120.0 L22.0 112.2 L24.0 104.8 L26.0 97.8 L28.0 91.2 L30.0 85.0 L32.0 79.2 L34.0 73.8 L36.0 68.8 L38.0 64.2 L40.0 60.0 L42.0 56.2 L44.0 52.8 L46.0 49.8 L48.0 47.2 L50.0 45.0 L52.0 43.2 L54.0 41.8 L56.0 40.8 L58.0 40.2 L60.0 40.0 L62.0 40.2 L64.0 40.8 L66.0 41.8 L68.0 43.2 L70.0 45.0 L72.0 47.2 L74.0 49.8 L76.0 52.8 L78.0 56.2 L80.0 60.0 L82.0 64.2 L84.0 68.8 L86.0 73.8 L88.0 79.2 L90.0 85.0 L92.0 91.2 L94.0 97.8 L96.0 104.8 L98.0 112.2 L100.0 120.0M100.0 120.0 L102.0 131.8 L104.0 143.2 L106.0 154.2 L108.0 164.8 L110.0 175.0 L112.0 184.8 L114.0 194.2 L116.0 203.2 L118.0 211.8 L120.0 220.0 L122.0 227.8 L124.0 235.2 L126.0 242.2 L128.0 248.8 L130.0 255.0 L132.0 260.8 L134.0 266.2 L136.0 271.2 L138.0 275.8 L140.0 280.0 L142.0 283.8 L144.0 287.2 L146.0 290.2 L148.0 292.8 L150.0 295.0 L152.0 296.8 L154.0 298.2 L156.0 299.2 L158.0 299.8 L160.0 300.0 L162.0 299.8 L164.0 299.2 L166.0 298.2 L168.0 296.8 L170.0 295.0 L172.0 292.8 L174.0 290.2 L176.0 287.2 L178.0 283.8 L180.0 280.0 L182.0 275.8 L184.0 271.2 L186.0 266.2 L188.0 260.8 L190.0 255.0 L192.0 248.8 L194.0 242.2 L196.0 235.2 L198.0 227.8 L200.0 220.0 L202.0 211.8 L204.0 203.2 L206.0 194.2 L208.0 184.8 L210.0 175.0 L212.0 164.8 L214.0 154.2 L216.0 143.2 L218.0 131.8 L220.0 120.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.A8A167":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 284\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"260\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V260\"/><path d=\"M20 0V260\"/><path d=\"M40 0V260\"/><path d=\"M60 0V260\"/><path d=\"M80 0V260\"/><path d=\"M100 0V260\"/><path d=\"M120 0V260\"/><path d=\"M140 0V260\"/><path d=\"M160 0V260\"/><path d=\"M180 0V260\"/><path d=\"M0 260 H180\"/><path d=\"M0 240 H180\"/><path d=\"M0 220 H180\"/><path d=\"M0 200 H180\"/><path d=\"M0 180 H180\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V260\"/><path d=\"M0 220H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"231\">-3</text><text x=\"20\" y=\"231\">-2</text><text x=\"40\" y=\"231\">-1</text><text x=\"80\" y=\"231\">1</text><text x=\"100\" y=\"231\">2</text><text x=\"120\" y=\"231\">3</text><text x=\"140\" y=\"231\">4</text><text x=\"160\" y=\"231\">5</text><text x=\"180\" y=\"231\">6</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"263\">-2</text><text x=\"57\" y=\"243\">-1</text><text x=\"57\" y=\"203\">1</text><text x=\"57\" y=\"183\">2</text><text x=\"57\" y=\"163\">3</text><text x=\"57\" y=\"143\">4</text><text x=\"57\" y=\"123\">5</text><text x=\"57\" y=\"103\">6</text><text x=\"57\" y=\"83\">7</text><text x=\"57\" y=\"63\">8</text><text x=\"57\" y=\"43\">9</text><text x=\"57\" y=\"23\">10</text><text x=\"57\" y=\"3\">11</text></g><path d=\"M30.0 265.0 L32.0 259.2 L34.0 253.8 L36.0 248.8 L38.0 244.2 L40.0 240.0 L42.0 236.2 L44.0 232.8 L46.0 229.8 L48.0 227.2 L50.0 225.0 L52.0 223.2 L54.0 221.8 L56.0 220.8 L58.0 220.2 L60.0 220.0M60.0 220.0 L62.0 219.8 L64.0 219.2 L66.0 218.2 L68.0 216.8 L70.0 215.0 L72.0 212.8 L74.0 210.2 L76.0 207.2 L78.0 203.8 L80.0 200.0 L82.0 195.8 L84.0 191.2 L86.0 186.2 L88.0 180.8 L90.0 175.0 L92.0 168.8 L94.0 162.2 L96.0 155.2 L98.0 147.8 L100.0 140.0 L102.0 131.8 L104.0 123.2 L106.0 114.2 L108.0 104.8 L110.0 95.0 L112.0 84.8 L114.0 74.2 L116.0 63.2 L118.0 51.8 L120.0 40.0M120.0 40.0 L122.0 27.8 L124.0 15.2 L126.0 2.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"220.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"120.0\" cy=\"40.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.C6653F":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 228 264\" role=\"img\" aria-label=\"График функции\" style=\"max-width:228px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"200\" height=\"240\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V240\"/><path d=\"M20 0V240\"/><path d=\"M40 0V240\"/><path d=\"M60 0V240\"/><path d=\"M80 0V240\"/><path d=\"M100 0V240\"/><path d=\"M120 0V240\"/><path d=\"M140 0V240\"/><path d=\"M160 0V240\"/><path d=\"M180 0V240\"/><path d=\"M200 0V240\"/><path d=\"M0 240 H200\"/><path d=\"M0 220 H200\"/><path d=\"M0 200 H200\"/><path d=\"M0 180 H200\"/><path d=\"M0 160 H200\"/><path d=\"M0 140 H200\"/><path d=\"M0 120 H200\"/><path d=\"M0 100 H200\"/><path d=\"M0 80 H200\"/><path d=\"M0 60 H200\"/><path d=\"M0 40 H200\"/><path d=\"M0 20 H200\"/><path d=\"M0 0 H200\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V240\"/><path d=\"M0 200H200\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"211\">-3</text><text x=\"20\" y=\"211\">-2</text><text x=\"40\" y=\"211\">-1</text><text x=\"80\" y=\"211\">1</text><text x=\"100\" y=\"211\">2</text><text x=\"120\" y=\"211\">3</text><text x=\"140\" y=\"211\">4</text><text x=\"160\" y=\"211\">5</text><text x=\"180\" y=\"211\">6</text><text x=\"200\" y=\"211\">7</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"243\">-2</text><text x=\"57\" y=\"223\">-1</text><text x=\"57\" y=\"183\">1</text><text x=\"57\" y=\"163\">2</text><text x=\"57\" y=\"143\">3</text><text x=\"57\" y=\"123\">4</text><text x=\"57\" y=\"103\">5</text><text x=\"57\" y=\"83\">6</text><text x=\"57\" y=\"63\">7</text><text x=\"57\" y=\"43\">8</text><text x=\"57\" y=\"23\">9</text><text x=\"57\" y=\"3\">10</text></g><path d=\"M16.0 248.4 L18.0 244.1 L20.0 240.0 L22.0 236.1 L24.0 232.4 L26.0 228.9 L28.0 225.6 L30.0 222.5 L32.0 219.6 L34.0 216.9 L36.0 214.4 L38.0 212.1 L40.0 210.0 L42.0 208.1 L44.0 206.4 L46.0 204.9 L48.0 203.6 L50.0 202.5 L52.0 201.6 L54.0 200.9 L56.0 200.4 L58.0 200.1 L60.0 200.0M60.0 200.0 L62.0 199.9 L64.0 199.6 L66.0 199.1 L68.0 198.4 L70.0 197.5 L72.0 196.4 L74.0 195.1 L76.0 193.6 L78.0 191.9 L80.0 190.0 L82.0 187.9 L84.0 185.6 L86.0 183.1 L88.0 180.4 L90.0 177.5 L92.0 174.4 L94.0 171.1 L96.0 167.6 L98.0 163.9 L100.0 160.0 L102.0 155.9 L104.0 151.6 L106.0 147.1 L108.0 142.4 L110.0 137.5 L112.0 132.4 L114.0 127.1 L116.0 121.6 L118.0 115.9 L120.0 110.0 L122.0 103.9 L124.0 97.6 L126.0 91.1 L128.0 84.4 L130.0 77.5 L132.0 70.4 L134.0 63.1 L136.0 55.6 L138.0 47.9 L140.0 40.0M140.0 40.0 L142.0 31.9 L144.0 23.6 L146.0 15.1 L148.0 6.4 L150.0 -2.5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"200.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"140.0\" cy=\"40.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.E05C3B":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V160\"/><path d=\"M0 80H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"91\">-3</text><text x=\"20\" y=\"91\">-2</text><text x=\"40\" y=\"91\">-1</text><text x=\"80\" y=\"91\">1</text><text x=\"100\" y=\"91\">2</text><text x=\"120\" y=\"91\">3</text><text x=\"140\" y=\"91\">4</text><text x=\"160\" y=\"91\">5</text><text x=\"180\" y=\"91\">6</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"163\">-4</text><text x=\"57\" y=\"143\">-3</text><text x=\"57\" y=\"123\">-2</text><text x=\"57\" y=\"103\">-1</text><text x=\"57\" y=\"63\">1</text><text x=\"57\" y=\"43\">2</text><text x=\"57\" y=\"23\">3</text><text x=\"57\" y=\"3\">4</text></g><path d=\"M100.0 100.0 L102.0 96.2 L104.0 92.8 L106.0 89.8 L108.0 87.2 L110.0 85.0 L112.0 83.2 L114.0 81.8 L116.0 80.8 L118.0 80.2 L120.0 80.0 L122.0 80.2 L124.0 80.8 L126.0 81.8 L128.0 83.2 L130.0 85.0 L132.0 87.2 L134.0 89.8 L136.0 92.8 L138.0 96.2 L140.0 100.0 L142.0 104.2 L144.0 108.8 L146.0 113.8 L148.0 119.2 L150.0 125.0 L152.0 131.2 L154.0 137.8 L156.0 144.8 L158.0 152.2 L160.0 160.0 L162.0 168.2M0.0 20.0 L50.0 70.0 L100.0 120.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"120.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"100.0\" cy=\"100.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.E73835":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M120 0V160\"/><path d=\"M0 100H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"111\">-6</text><text x=\"20\" y=\"111\">-5</text><text x=\"40\" y=\"111\">-4</text><text x=\"60\" y=\"111\">-3</text><text x=\"80\" y=\"111\">-2</text><text x=\"100\" y=\"111\">-1</text><text x=\"140\" y=\"111\">1</text><text x=\"160\" y=\"111\">2</text><text x=\"180\" y=\"111\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"117\" y=\"163\">-3</text><text x=\"117\" y=\"143\">-2</text><text x=\"117\" y=\"123\">-1</text><text x=\"117\" y=\"83\">1</text><text x=\"117\" y=\"63\">2</text><text x=\"117\" y=\"43\">3</text><text x=\"117\" y=\"23\">4</text><text x=\"117\" y=\"3\">5</text></g><path d=\"M60.0 120.0 L62.0 112.2 L64.0 104.8 L66.0 97.8 L68.0 91.2 L70.0 85.0 L72.0 79.2 L74.0 73.8 L76.0 68.8 L78.0 64.2 L80.0 60.0 L82.0 56.2 L84.0 52.8 L86.0 49.8 L88.0 47.2 L90.0 45.0 L92.0 43.2 L94.0 41.8 L96.0 40.8 L98.0 40.2 L100.0 40.0 L102.0 40.2 L104.0 40.8 L106.0 41.8 L108.0 43.2 L110.0 45.0 L112.0 47.2 L114.0 49.8 L116.0 52.8 L118.0 56.2 L120.0 60.0 L122.0 64.2 L124.0 68.8 L126.0 73.8 L128.0 79.2 L130.0 85.0 L132.0 91.2 L134.0 97.8 L136.0 104.8 L138.0 112.2 L140.0 120.0 L142.0 128.2 L144.0 136.8 L146.0 145.8 L148.0 155.2 L150.0 165.0M0.0 20.0 L30.0 50.0 L60.0 80.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"80.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"60.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.0B2341":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 244\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"220\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V220\"/><path d=\"M20 0V220\"/><path d=\"M40 0V220\"/><path d=\"M60 0V220\"/><path d=\"M80 0V220\"/><path d=\"M100 0V220\"/><path d=\"M120 0V220\"/><path d=\"M140 0V220\"/><path d=\"M160 0V220\"/><path d=\"M180 0V220\"/><path d=\"M0 220 H180\"/><path d=\"M0 200 H180\"/><path d=\"M0 180 H180\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M120 0V220\"/><path d=\"M0 40H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-6</text><text x=\"20\" y=\"51\">-5</text><text x=\"40\" y=\"51\">-4</text><text x=\"60\" y=\"51\">-3</text><text x=\"80\" y=\"51\">-2</text><text x=\"100\" y=\"51\">-1</text><text x=\"140\" y=\"51\">1</text><text x=\"160\" y=\"51\">2</text><text x=\"180\" y=\"51\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"117\" y=\"223\">-9</text><text x=\"117\" y=\"203\">-8</text><text x=\"117\" y=\"183\">-7</text><text x=\"117\" y=\"163\">-6</text><text x=\"117\" y=\"143\">-5</text><text x=\"117\" y=\"123\">-4</text><text x=\"117\" y=\"103\">-3</text><text x=\"117\" y=\"83\">-2</text><text x=\"117\" y=\"63\">-1</text><text x=\"117\" y=\"23\">1</text><text x=\"117\" y=\"3\">2</text></g><path d=\"M8.0 -3.2 L10.0 5.0 L12.0 12.8 L14.0 20.2 L16.0 27.2 L18.0 33.8 L20.0 40.0 L22.0 45.8 L24.0 51.2 L26.0 56.2 L28.0 60.8 L30.0 65.0 L32.0 68.8 L34.0 72.2 L36.0 75.2 L38.0 77.8 L40.0 80.0 L42.0 81.8 L44.0 83.2 L46.0 84.2 L48.0 84.8 L50.0 85.0 L52.0 84.8 L54.0 84.2 L56.0 83.2 L58.0 81.8 L60.0 80.0 L62.0 77.8 L64.0 75.2 L66.0 72.2 L68.0 68.8 L70.0 65.0 L72.0 60.8 L74.0 56.2 L76.0 51.2 L78.0 45.8 L80.0 40.0M80.0 40.0 L82.0 49.8 L84.0 59.2 L86.0 68.2 L88.0 76.8 L90.0 85.0 L92.0 92.8 L94.0 100.2 L96.0 107.2 L98.0 113.8 L100.0 120.0 L102.0 125.8 L104.0 131.2 L106.0 136.2 L108.0 140.8 L110.0 145.0 L112.0 148.8 L114.0 152.2 L116.0 155.2 L118.0 157.8 L120.0 160.0 L122.0 161.8 L124.0 163.2 L126.0 164.2 L128.0 164.8 L130.0 165.0 L132.0 164.8 L134.0 164.2 L136.0 163.2 L138.0 161.8 L140.0 160.0 L142.0 157.8 L144.0 155.2 L146.0 152.2 L148.0 148.8 L150.0 145.0 L152.0 140.8 L154.0 136.2 L156.0 131.2 L158.0 125.8 L160.0 120.0 L162.0 113.8 L164.0 107.2 L166.0 100.2 L168.0 92.8 L170.0 85.0 L172.0 76.8 L174.0 68.2 L176.0 59.2 L178.0 49.8 L180.0 40.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"40.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.772C4F":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V160\"/><path d=\"M0 60H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"71\">-4</text><text x=\"20\" y=\"71\">-3</text><text x=\"40\" y=\"71\">-2</text><text x=\"60\" y=\"71\">-1</text><text x=\"100\" y=\"71\">1</text><text x=\"120\" y=\"71\">2</text><text x=\"140\" y=\"71\">3</text><text x=\"160\" y=\"71\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"163\">-5</text><text x=\"77\" y=\"143\">-4</text><text x=\"77\" y=\"123\">-3</text><text x=\"77\" y=\"103\">-2</text><text x=\"77\" y=\"83\">-1</text><text x=\"77\" y=\"43\">1</text><text x=\"77\" y=\"23\">2</text><text x=\"77\" y=\"3\">3</text></g><path d=\"M0.0 65.0 L2.0 65.1 L4.0 65.3 L6.0 65.4 L8.0 65.6 L10.0 65.7 L12.0 65.9 L14.0 66.1 L16.0 66.2 L18.0 66.5 L20.0 66.7 L22.0 66.9 L24.0 67.1 L26.0 67.4 L28.0 67.7 L30.0 68.0 L32.0 68.3 L34.0 68.7 L36.0 69.1 L38.0 69.5 L40.0 70.0 L42.0 70.5 L44.0 71.1 L46.0 71.8 L48.0 72.5 L50.0 73.3 L52.0 74.3 L54.0 75.4 L56.0 76.7 L58.0 78.2 L60.0 80.0 L62.0 82.2 L64.0 85.0 L66.0 88.6 L68.0 93.3 L70.0 100.0 L72.0 110.0M72.0 110.0 L74.0 126.7 L76.0 160.0M84.0 160.0 L86.0 126.7 L88.0 110.0M88.0 110.0 L90.0 100.0 L92.0 93.3 L94.0 88.6 L96.0 85.0 L98.0 82.2 L100.0 80.0 L102.0 78.2 L104.0 76.7 L106.0 75.4 L108.0 74.3 L110.0 73.3 L112.0 72.5 L114.0 71.8 L116.0 71.1 L118.0 70.5 L120.0 70.0 L122.0 69.5 L124.0 69.1 L126.0 68.7 L128.0 68.3 L130.0 68.0 L132.0 67.7 L134.0 67.4 L136.0 67.1 L138.0 66.9 L140.0 66.7 L142.0 66.5 L144.0 66.2 L146.0 66.1 L148.0 65.9 L150.0 65.7 L152.0 65.6 L154.0 65.4 L156.0 65.3 L158.0 65.1 L160.0 65.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"72.0\" cy=\"110.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"88.0\" cy=\"110.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.B4CE4A":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 248 324\" role=\"img\" aria-label=\"График функции\" style=\"max-width:248px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"220\" height=\"300\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V300\"/><path d=\"M20 0V300\"/><path d=\"M40 0V300\"/><path d=\"M60 0V300\"/><path d=\"M80 0V300\"/><path d=\"M100 0V300\"/><path d=\"M120 0V300\"/><path d=\"M140 0V300\"/><path d=\"M160 0V300\"/><path d=\"M180 0V300\"/><path d=\"M200 0V300\"/><path d=\"M220 0V300\"/><path d=\"M0 300 H220\"/><path d=\"M0 280 H220\"/><path d=\"M0 260 H220\"/><path d=\"M0 240 H220\"/><path d=\"M0 220 H220\"/><path d=\"M0 200 H220\"/><path d=\"M0 180 H220\"/><path d=\"M0 160 H220\"/><path d=\"M0 140 H220\"/><path d=\"M0 120 H220\"/><path d=\"M0 100 H220\"/><path d=\"M0 80 H220\"/><path d=\"M0 60 H220\"/><path d=\"M0 40 H220\"/><path d=\"M0 20 H220\"/><path d=\"M0 0 H220\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M140 0V300\"/><path d=\"M0 240H220\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"251\">-7</text><text x=\"20\" y=\"251\">-6</text><text x=\"40\" y=\"251\">-5</text><text x=\"60\" y=\"251\">-4</text><text x=\"80\" y=\"251\">-3</text><text x=\"100\" y=\"251\">-2</text><text x=\"120\" y=\"251\">-1</text><text x=\"160\" y=\"251\">1</text><text x=\"180\" y=\"251\">2</text><text x=\"200\" y=\"251\">3</text><text x=\"220\" y=\"251\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"137\" y=\"303\">-3</text><text x=\"137\" y=\"283\">-2</text><text x=\"137\" y=\"263\">-1</text><text x=\"137\" y=\"223\">1</text><text x=\"137\" y=\"203\">2</text><text x=\"137\" y=\"183\">3</text><text x=\"137\" y=\"163\">4</text><text x=\"137\" y=\"143\">5</text><text x=\"137\" y=\"123\">6</text><text x=\"137\" y=\"103\">7</text><text x=\"137\" y=\"83\">8</text><text x=\"137\" y=\"63\">9</text><text x=\"137\" y=\"43\">10</text><text x=\"137\" y=\"23\">11</text><text x=\"137\" y=\"3\">12</text></g><path d=\"M0.0 100.0 L2.0 88.2 L4.0 76.8 L6.0 65.8 L8.0 55.2 L10.0 45.0 L12.0 35.2 L14.0 25.8 L16.0 16.8 L18.0 8.2 L20.0 0.0 L22.0 -7.8M98.0 -7.8 L100.0 0.0 L102.0 8.2 L104.0 16.8 L106.0 25.8 L108.0 35.2 L110.0 45.0 L112.0 55.2 L114.0 65.8 L116.0 76.8 L118.0 88.2 L120.0 100.0 L122.0 112.2 L124.0 124.8 L126.0 137.8 L128.0 151.2 L130.0 165.0 L132.0 179.2 L134.0 193.8 L136.0 208.8 L138.0 224.2 L140.0 240.0M140.0 240.0 L142.0 243.8 L144.0 247.2 L146.0 250.2 L148.0 252.8 L150.0 255.0 L152.0 256.8 L154.0 258.2 L156.0 259.2 L158.0 259.8 L160.0 260.0 L162.0 259.8 L164.0 259.2 L166.0 258.2 L168.0 256.8 L170.0 255.0 L172.0 252.8 L174.0 250.2 L176.0 247.2 L178.0 243.8 L180.0 240.0 L182.0 235.8 L184.0 231.2 L186.0 226.2 L188.0 220.8 L190.0 215.0 L192.0 208.8 L194.0 202.2 L196.0 195.2 L198.0 187.8 L200.0 180.0 L202.0 171.8 L204.0 163.2 L206.0 154.2 L208.0 144.8 L210.0 135.0 L212.0 124.8 L214.0 114.2 L216.0 103.2 L218.0 91.8 L220.0 80.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"140.0\" cy=\"240.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.152E49":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 264\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"240\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V240\"/><path d=\"M20 0V240\"/><path d=\"M40 0V240\"/><path d=\"M60 0V240\"/><path d=\"M80 0V240\"/><path d=\"M100 0V240\"/><path d=\"M120 0V240\"/><path d=\"M140 0V240\"/><path d=\"M160 0V240\"/><path d=\"M180 0V240\"/><path d=\"M0 240 H180\"/><path d=\"M0 220 H180\"/><path d=\"M0 200 H180\"/><path d=\"M0 180 H180\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V240\"/><path d=\"M0 40H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-4</text><text x=\"20\" y=\"51\">-3</text><text x=\"40\" y=\"51\">-2</text><text x=\"60\" y=\"51\">-1</text><text x=\"100\" y=\"51\">1</text><text x=\"120\" y=\"51\">2</text><text x=\"140\" y=\"51\">3</text><text x=\"160\" y=\"51\">4</text><text x=\"180\" y=\"51\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"243\">-10</text><text x=\"77\" y=\"223\">-9</text><text x=\"77\" y=\"203\">-8</text><text x=\"77\" y=\"183\">-7</text><text x=\"77\" y=\"163\">-6</text><text x=\"77\" y=\"143\">-5</text><text x=\"77\" y=\"123\">-4</text><text x=\"77\" y=\"103\">-3</text><text x=\"77\" y=\"83\">-2</text><text x=\"77\" y=\"63\">-1</text><text x=\"77\" y=\"23\">1</text><text x=\"77\" y=\"3\">2</text></g><path d=\"M40.0 245.0 L42.0 237.2 L44.0 229.8 L46.0 222.8 L48.0 216.2 L50.0 210.0 L52.0 204.2 L54.0 198.8 L56.0 193.8 L58.0 189.2 L60.0 185.0 L62.0 181.2 L64.0 177.8 L66.0 174.8 L68.0 172.2 L70.0 170.0 L72.0 168.2 L74.0 166.8 L76.0 165.8 L78.0 165.2 L80.0 165.0 L82.0 165.2 L84.0 165.8 L86.0 166.8 L88.0 168.2 L90.0 170.0 L92.0 172.2 L94.0 174.8 L96.0 177.8 L98.0 181.2 L100.0 185.0M100.0 185.0 L102.0 189.2 L104.0 193.8 L106.0 198.8 L108.0 204.2 L110.0 210.0 L112.0 216.2 L114.0 222.8 L116.0 229.8 L118.0 237.2 L120.0 245.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"185.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.2A2D4E":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V160\"/><path d=\"M0 120H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-4</text><text x=\"20\" y=\"131\">-3</text><text x=\"40\" y=\"131\">-2</text><text x=\"60\" y=\"131\">-1</text><text x=\"100\" y=\"131\">1</text><text x=\"120\" y=\"131\">2</text><text x=\"140\" y=\"131\">3</text><text x=\"160\" y=\"131\">4</text><text x=\"180\" y=\"131\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"163\">-2</text><text x=\"77\" y=\"143\">-1</text><text x=\"77\" y=\"103\">1</text><text x=\"77\" y=\"83\">2</text><text x=\"77\" y=\"63\">3</text><text x=\"77\" y=\"43\">4</text><text x=\"77\" y=\"23\">5</text><text x=\"77\" y=\"3\">6</text></g><path d=\"M36.0 168.4 L38.0 164.1 L40.0 160.0 L42.0 156.1 L44.0 152.4 L46.0 148.9 L48.0 145.6 L50.0 142.5 L52.0 139.6 L54.0 136.9 L56.0 134.4 L58.0 132.1 L60.0 130.0 L62.0 128.1 L64.0 126.4 L66.0 124.9 L68.0 123.6 L70.0 122.5 L72.0 121.6 L74.0 120.9 L76.0 120.4 L78.0 120.1 L80.0 120.0M80.0 120.0 L82.0 119.9 L84.0 119.6 L86.0 119.1 L88.0 118.4 L90.0 117.5 L92.0 116.4 L94.0 115.1 L96.0 113.6 L98.0 111.9 L100.0 110.0M100.0 110.0 L102.0 107.9 L104.0 105.6 L106.0 103.1 L108.0 100.4 L110.0 97.5 L112.0 94.4 L114.0 91.1 L116.0 87.6 L118.0 83.9 L120.0 80.0 L122.0 75.9 L124.0 71.6 L126.0 67.1 L128.0 62.4 L130.0 57.5 L132.0 52.4 L134.0 47.1 L136.0 41.6 L138.0 35.9 L140.0 30.0 L142.0 23.9 L144.0 17.6 L146.0 11.1 L148.0 4.4 L150.0 -2.5 L152.0 -9.6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"100.0\" cy=\"110.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.DF7E4D":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 204\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"180\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V180\"/><path d=\"M20 0V180\"/><path d=\"M40 0V180\"/><path d=\"M60 0V180\"/><path d=\"M80 0V180\"/><path d=\"M100 0V180\"/><path d=\"M120 0V180\"/><path d=\"M140 0V180\"/><path d=\"M160 0V180\"/><path d=\"M0 180 H160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V180\"/><path d=\"M0 40H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-3</text><text x=\"20\" y=\"51\">-2</text><text x=\"40\" y=\"51\">-1</text><text x=\"80\" y=\"51\">1</text><text x=\"100\" y=\"51\">2</text><text x=\"120\" y=\"51\">3</text><text x=\"140\" y=\"51\">4</text><text x=\"160\" y=\"51\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"183\">-7</text><text x=\"57\" y=\"163\">-6</text><text x=\"57\" y=\"143\">-5</text><text x=\"57\" y=\"123\">-4</text><text x=\"57\" y=\"103\">-3</text><text x=\"57\" y=\"83\">-2</text><text x=\"57\" y=\"63\">-1</text><text x=\"57\" y=\"23\">1</text><text x=\"57\" y=\"3\">2</text></g><path d=\"M10.0 185.0 L12.0 175.2 L14.0 165.8 L16.0 156.8 L18.0 148.2 L20.0 140.0 L22.0 132.2 L24.0 124.8 L26.0 117.8 L28.0 111.2 L30.0 105.0 L32.0 99.2 L34.0 93.8 L36.0 88.8 L38.0 84.2 L40.0 80.0 L42.0 76.2 L44.0 72.8 L46.0 69.8 L48.0 67.2 L50.0 65.0 L52.0 63.2 L54.0 61.8 L56.0 60.8 L58.0 60.2 L60.0 60.0 L62.0 60.2 L64.0 60.8 L66.0 61.8 L68.0 63.2 L70.0 65.0 L72.0 67.2 L74.0 69.8 L76.0 72.8 L78.0 76.2 L80.0 80.0 L82.0 84.2 L84.0 88.8 L86.0 93.8 L88.0 99.2 L90.0 105.0 L92.0 111.2 L94.0 117.8 L96.0 124.8 L98.0 132.2 L100.0 140.0M100.0 140.0 L102.0 148.2 L104.0 156.8 L106.0 165.8 L108.0 175.2 L110.0 185.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"140.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.C0BD4C":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M120 0V160\"/><path d=\"M0 120H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-6</text><text x=\"20\" y=\"131\">-5</text><text x=\"40\" y=\"131\">-4</text><text x=\"60\" y=\"131\">-3</text><text x=\"80\" y=\"131\">-2</text><text x=\"100\" y=\"131\">-1</text><text x=\"140\" y=\"131\">1</text><text x=\"160\" y=\"131\">2</text><text x=\"180\" y=\"131\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"117\" y=\"163\">-2</text><text x=\"117\" y=\"143\">-1</text><text x=\"117\" y=\"103\">1</text><text x=\"117\" y=\"83\">2</text><text x=\"117\" y=\"63\">3</text><text x=\"117\" y=\"43\">4</text><text x=\"117\" y=\"23\">5</text><text x=\"117\" y=\"3\">6</text></g><path d=\"M20.0 0.0 L22.0 9.8 L24.0 19.2 L26.0 28.2 L28.0 36.8 L30.0 45.0 L32.0 52.8 L34.0 60.2 L36.0 67.2 L38.0 73.8 L40.0 80.0 L42.0 85.8 L44.0 91.2 L46.0 96.2 L48.0 100.8 L50.0 105.0 L52.0 108.8 L54.0 112.2 L56.0 115.2 L58.0 117.8 L60.0 120.0M60.0 120.0 L62.0 118.2 L64.0 116.8 L66.0 115.8 L68.0 115.2 L70.0 115.0 L72.0 115.2 L74.0 115.8 L76.0 116.8 L78.0 118.2 L80.0 120.0M80.0 120.0 L82.0 117.8 L84.0 115.2 L86.0 112.2 L88.0 108.8 L90.0 105.0 L92.0 100.8 L94.0 96.2 L96.0 91.2 L98.0 85.8 L100.0 80.0 L102.0 73.8 L104.0 67.2 L106.0 60.2 L108.0 52.8 L110.0 45.0 L112.0 36.8 L114.0 28.2 L116.0 19.2 L118.0 9.8 L120.0 0.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"80.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.632946":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 228 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:228px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"200\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M0 160 H200\"/><path d=\"M0 140 H200\"/><path d=\"M0 120 H200\"/><path d=\"M0 100 H200\"/><path d=\"M0 80 H200\"/><path d=\"M0 60 H200\"/><path d=\"M0 40 H200\"/><path d=\"M0 20 H200\"/><path d=\"M0 0 H200\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M140 0V160\"/><path d=\"M0 80H200\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"91\">-7</text><text x=\"20\" y=\"91\">-6</text><text x=\"40\" y=\"91\">-5</text><text x=\"60\" y=\"91\">-4</text><text x=\"80\" y=\"91\">-3</text><text x=\"100\" y=\"91\">-2</text><text x=\"120\" y=\"91\">-1</text><text x=\"160\" y=\"91\">1</text><text x=\"180\" y=\"91\">2</text><text x=\"200\" y=\"91\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"137\" y=\"163\">-4</text><text x=\"137\" y=\"143\">-3</text><text x=\"137\" y=\"123\">-2</text><text x=\"137\" y=\"103\">-1</text><text x=\"137\" y=\"63\">1</text><text x=\"137\" y=\"43\">2</text><text x=\"137\" y=\"23\">3</text><text x=\"137\" y=\"3\">4</text></g><path d=\"M0.0 117.1 L2.0 117.1 L4.0 117.1 L6.0 117.0 L8.0 117.0 L10.0 116.9 L12.0 116.9 L14.0 116.8 L16.0 116.8 L18.0 116.7 L20.0 116.7 L22.0 116.6 L24.0 116.6 L26.0 116.5 L28.0 116.4 L30.0 116.4 L32.0 116.3 L34.0 116.2 L36.0 116.2 L38.0 116.1 L40.0 116.0 L42.0 115.9 L44.0 115.8 L46.0 115.7 L48.0 115.7 L50.0 115.6 L52.0 115.5 L54.0 115.3 L56.0 115.2 L58.0 115.1 L60.0 115.0M60.0 115.0 L62.0 114.9 L64.0 114.7 L66.0 114.6 L68.0 114.4 L70.0 114.3 L72.0 114.1 L74.0 113.9 L76.0 113.8 L78.0 113.5 L80.0 113.3 L82.0 113.1 L84.0 112.9 L86.0 112.6 L88.0 112.3 L90.0 112.0 L92.0 111.7 L94.0 111.3 L96.0 110.9 L98.0 110.5 L100.0 110.0 L102.0 109.5 L104.0 108.9 L106.0 108.2 L108.0 107.5 L110.0 106.7 L112.0 105.7 L114.0 104.6 L116.0 103.3 L118.0 101.8 L120.0 100.0 L122.0 97.8 L124.0 95.0 L126.0 91.4 L128.0 86.7 L130.0 80.0 L132.0 70.0 L134.0 53.3 L136.0 20.0M148.0 170.0 L150.0 160.0 L152.0 153.3 L154.0 148.6 L156.0 145.0 L158.0 142.2 L160.0 140.0 L162.0 138.2 L164.0 136.7 L166.0 135.4 L168.0 134.3 L170.0 133.3 L172.0 132.5 L174.0 131.8 L176.0 131.1 L178.0 130.5 L180.0 130.0 L182.0 129.5 L184.0 129.1 L186.0 128.7 L188.0 128.3 L190.0 128.0 L192.0 127.7 L194.0 127.4 L196.0 127.1 L198.0 126.9 L200.0 126.7\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"115.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.46EEF6":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 228 284\" role=\"img\" aria-label=\"График функции\" style=\"max-width:228px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"200\" height=\"260\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V260\"/><path d=\"M20 0V260\"/><path d=\"M40 0V260\"/><path d=\"M60 0V260\"/><path d=\"M80 0V260\"/><path d=\"M100 0V260\"/><path d=\"M120 0V260\"/><path d=\"M140 0V260\"/><path d=\"M160 0V260\"/><path d=\"M180 0V260\"/><path d=\"M200 0V260\"/><path d=\"M0 260 H200\"/><path d=\"M0 240 H200\"/><path d=\"M0 220 H200\"/><path d=\"M0 200 H200\"/><path d=\"M0 180 H200\"/><path d=\"M0 160 H200\"/><path d=\"M0 140 H200\"/><path d=\"M0 120 H200\"/><path d=\"M0 100 H200\"/><path d=\"M0 80 H200\"/><path d=\"M0 60 H200\"/><path d=\"M0 40 H200\"/><path d=\"M0 20 H200\"/><path d=\"M0 0 H200\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M140 0V260\"/><path d=\"M0 220H200\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"231\">-7</text><text x=\"20\" y=\"231\">-6</text><text x=\"40\" y=\"231\">-5</text><text x=\"60\" y=\"231\">-4</text><text x=\"80\" y=\"231\">-3</text><text x=\"100\" y=\"231\">-2</text><text x=\"120\" y=\"231\">-1</text><text x=\"160\" y=\"231\">1</text><text x=\"180\" y=\"231\">2</text><text x=\"200\" y=\"231\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"137\" y=\"263\">-2</text><text x=\"137\" y=\"243\">-1</text><text x=\"137\" y=\"203\">1</text><text x=\"137\" y=\"183\">2</text><text x=\"137\" y=\"163\">3</text><text x=\"137\" y=\"143\">4</text><text x=\"137\" y=\"123\">5</text><text x=\"137\" y=\"103\">6</text><text x=\"137\" y=\"83\">7</text><text x=\"137\" y=\"63\">8</text><text x=\"137\" y=\"43\">9</text><text x=\"137\" y=\"23\">10</text><text x=\"137\" y=\"3\">11</text></g><path d=\"M60.0 40.0 L62.0 51.8 L64.0 63.2 L66.0 74.2 L68.0 84.8 L70.0 95.0 L72.0 104.8 L74.0 114.2 L76.0 123.2 L78.0 131.8 L80.0 140.0 L82.0 147.8 L84.0 155.2 L86.0 162.2 L88.0 168.8 L90.0 175.0 L92.0 180.8 L94.0 186.2 L96.0 191.2 L98.0 195.8 L100.0 200.0 L102.0 203.8 L104.0 207.2 L106.0 210.2 L108.0 212.8 L110.0 215.0 L112.0 216.8 L114.0 218.2 L116.0 219.2 L118.0 219.8 L120.0 220.0 L122.0 219.8 L124.0 219.2 L126.0 218.2 L128.0 216.8 L130.0 215.0 L132.0 212.8 L134.0 210.2 L136.0 207.2 L138.0 203.8 L140.0 200.0 L142.0 195.8 L144.0 191.2 L146.0 186.2 L148.0 180.8 L150.0 175.0 L152.0 168.8 L154.0 162.2 L156.0 155.2 L158.0 147.8 L160.0 140.0 L162.0 131.8 L164.0 123.2 L166.0 114.2 L168.0 104.8 L170.0 95.0 L172.0 84.8 L174.0 74.2 L176.0 63.2 L178.0 51.8 L180.0 40.0 L182.0 27.8 L184.0 15.2 L186.0 2.2M0.0 117.1 L2.0 115.7 L4.0 114.1 L6.0 112.5 L8.0 110.9 L10.0 109.2 L12.0 107.5 L14.0 105.7 L16.0 103.9 L18.0 102.0 L20.0 100.0 L22.0 98.0 L24.0 95.9 L26.0 93.7 L28.0 91.4 L30.0 89.1 L32.0 86.7 L34.0 84.2 L36.0 81.5 L38.0 78.8 L40.0 76.0 L42.0 73.1 L44.0 70.0 L46.0 66.8 L48.0 63.5 L50.0 60.0 L52.0 56.4 L54.0 52.6 L56.0 48.6 L58.0 44.4 L60.0 40.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"40.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.13A5FD":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V160\"/><path d=\"M0 120H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-3</text><text x=\"20\" y=\"131\">-2</text><text x=\"40\" y=\"131\">-1</text><text x=\"80\" y=\"131\">1</text><text x=\"100\" y=\"131\">2</text><text x=\"120\" y=\"131\">3</text><text x=\"140\" y=\"131\">4</text><text x=\"160\" y=\"131\">5</text><text x=\"180\" y=\"131\">6</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"163\">-2</text><text x=\"57\" y=\"143\">-1</text><text x=\"57\" y=\"103\">1</text><text x=\"57\" y=\"83\">2</text><text x=\"57\" y=\"63\">3</text><text x=\"57\" y=\"43\">4</text><text x=\"57\" y=\"23\">5</text><text x=\"57\" y=\"3\">6</text></g><path d=\"M50.0 165.0 L100.0 40.0M100.0 40.0 L110.0 75.0 L120.0 110.0M120.0 80.0 L150.0 50.0 L180.0 20.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"40.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"120.0\" cy=\"80.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"120.0\" cy=\"110.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.AB4DF3":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V160\"/><path d=\"M0 80H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"91\">-4</text><text x=\"20\" y=\"91\">-3</text><text x=\"40\" y=\"91\">-2</text><text x=\"60\" y=\"91\">-1</text><text x=\"100\" y=\"91\">1</text><text x=\"120\" y=\"91\">2</text><text x=\"140\" y=\"91\">3</text><text x=\"160\" y=\"91\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"163\">-4</text><text x=\"77\" y=\"143\">-3</text><text x=\"77\" y=\"123\">-2</text><text x=\"77\" y=\"103\">-1</text><text x=\"77\" y=\"63\">1</text><text x=\"77\" y=\"43\">2</text><text x=\"77\" y=\"23\">3</text><text x=\"77\" y=\"3\">4</text></g><path d=\"M0.0 85.0 L2.0 85.1 L4.0 85.3 L6.0 85.4 L8.0 85.6 L10.0 85.7 L12.0 85.9 L14.0 86.1 L16.0 86.2 L18.0 86.5 L20.0 86.7 L22.0 86.9 L24.0 87.1 L26.0 87.4 L28.0 87.7 L30.0 88.0 L32.0 88.3 L34.0 88.7 L36.0 89.1 L38.0 89.5 L40.0 90.0 L42.0 90.5 L44.0 91.1 L46.0 91.8 L48.0 92.5 L50.0 93.3 L52.0 94.3 L54.0 95.4 L56.0 96.7 L58.0 98.2 L60.0 100.0 L62.0 102.2 L64.0 105.0 L66.0 108.6 L68.0 113.3 L70.0 120.0M70.0 120.0 L72.0 130.0 L74.0 146.7M86.0 146.7 L88.0 130.0 L90.0 120.0M90.0 120.0 L92.0 113.3 L94.0 108.6 L96.0 105.0 L98.0 102.2 L100.0 100.0 L102.0 98.2 L104.0 96.7 L106.0 95.4 L108.0 94.3 L110.0 93.3 L112.0 92.5 L114.0 91.8 L116.0 91.1 L118.0 90.5 L120.0 90.0 L122.0 89.5 L124.0 89.1 L126.0 88.7 L128.0 88.3 L130.0 88.0 L132.0 87.7 L134.0 87.4 L136.0 87.1 L138.0 86.9 L140.0 86.7 L142.0 86.5 L144.0 86.2 L146.0 86.1 L148.0 85.9 L150.0 85.7 L152.0 85.6 L154.0 85.4 L156.0 85.3 L158.0 85.1 L160.0 85.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"70.0\" cy=\"120.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"90.0\" cy=\"120.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.CB85F6":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V160\"/><path d=\"M0 120H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-3</text><text x=\"20\" y=\"131\">-2</text><text x=\"40\" y=\"131\">-1</text><text x=\"80\" y=\"131\">1</text><text x=\"100\" y=\"131\">2</text><text x=\"120\" y=\"131\">3</text><text x=\"140\" y=\"131\">4</text><text x=\"160\" y=\"131\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"163\">-2</text><text x=\"57\" y=\"143\">-1</text><text x=\"57\" y=\"103\">1</text><text x=\"57\" y=\"83\">2</text><text x=\"57\" y=\"63\">3</text><text x=\"57\" y=\"43\">4</text><text x=\"57\" y=\"23\">5</text><text x=\"57\" y=\"3\">6</text></g><path d=\"M16.0 168.4 L18.0 164.1 L20.0 160.0 L22.0 156.1 L24.0 152.4 L26.0 148.9 L28.0 145.6 L30.0 142.5 L32.0 139.6 L34.0 136.9 L36.0 134.4 L38.0 132.1 L40.0 130.0 L42.0 128.1 L44.0 126.4 L46.0 124.9 L48.0 123.6 L50.0 122.5 L52.0 121.6 L54.0 120.9 L56.0 120.4 L58.0 120.1 L60.0 120.0M60.0 120.0 L62.0 119.9 L64.0 119.6 L66.0 119.1 L68.0 118.4 L70.0 117.5 L72.0 116.4 L74.0 115.1 L76.0 113.6 L78.0 111.9 L80.0 110.0 L82.0 107.9 L84.0 105.6 L86.0 103.1 L88.0 100.4 L90.0 97.5 L92.0 94.4 L94.0 91.1 L96.0 87.6 L98.0 83.9 L100.0 80.0M100.0 80.0 L102.0 75.9 L104.0 71.6 L106.0 67.1 L108.0 62.4 L110.0 57.5 L112.0 52.4 L114.0 47.1 L116.0 41.6 L118.0 35.9 L120.0 30.0 L122.0 23.9 L124.0 17.6 L126.0 11.1 L128.0 4.4 L130.0 -2.5 L132.0 -9.6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"100.0\" cy=\"80.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.EB0FF0":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 264\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"240\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V240\"/><path d=\"M20 0V240\"/><path d=\"M40 0V240\"/><path d=\"M60 0V240\"/><path d=\"M80 0V240\"/><path d=\"M100 0V240\"/><path d=\"M120 0V240\"/><path d=\"M140 0V240\"/><path d=\"M160 0V240\"/><path d=\"M180 0V240\"/><path d=\"M0 240 H180\"/><path d=\"M0 220 H180\"/><path d=\"M0 200 H180\"/><path d=\"M0 180 H180\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V240\"/><path d=\"M0 40H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-5</text><text x=\"20\" y=\"51\">-4</text><text x=\"40\" y=\"51\">-3</text><text x=\"60\" y=\"51\">-2</text><text x=\"80\" y=\"51\">-1</text><text x=\"120\" y=\"51\">1</text><text x=\"140\" y=\"51\">2</text><text x=\"160\" y=\"51\">3</text><text x=\"180\" y=\"51\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"243\">-10</text><text x=\"97\" y=\"223\">-9</text><text x=\"97\" y=\"203\">-8</text><text x=\"97\" y=\"183\">-7</text><text x=\"97\" y=\"163\">-6</text><text x=\"97\" y=\"143\">-5</text><text x=\"97\" y=\"123\">-4</text><text x=\"97\" y=\"103\">-3</text><text x=\"97\" y=\"83\">-2</text><text x=\"97\" y=\"63\">-1</text><text x=\"97\" y=\"23\">1</text><text x=\"97\" y=\"3\">2</text></g><path d=\"M60.0 245.0 L62.0 237.2 L64.0 229.8 L66.0 222.8 L68.0 216.2 L70.0 210.0 L72.0 204.2 L74.0 198.8 L76.0 193.8 L78.0 189.2 L80.0 185.0M80.0 185.0 L82.0 181.2 L84.0 177.8 L86.0 174.8 L88.0 172.2 L90.0 170.0 L92.0 168.2 L94.0 166.8 L96.0 165.8 L98.0 165.2 L100.0 165.0 L102.0 165.2 L104.0 165.8 L106.0 166.8 L108.0 168.2 L110.0 170.0 L112.0 172.2 L114.0 174.8 L116.0 177.8 L118.0 181.2 L120.0 185.0 L122.0 189.2 L124.0 193.8 L126.0 198.8 L128.0 204.2 L130.0 210.0 L132.0 216.2 L134.0 222.8 L136.0 229.8 L138.0 237.2 L140.0 245.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"185.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.E993F3":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V160\"/><path d=\"M0 120H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-4</text><text x=\"20\" y=\"131\">-3</text><text x=\"40\" y=\"131\">-2</text><text x=\"60\" y=\"131\">-1</text><text x=\"100\" y=\"131\">1</text><text x=\"120\" y=\"131\">2</text><text x=\"140\" y=\"131\">3</text><text x=\"160\" y=\"131\">4</text><text x=\"180\" y=\"131\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"163\">-2</text><text x=\"77\" y=\"143\">-1</text><text x=\"77\" y=\"103\">1</text><text x=\"77\" y=\"83\">2</text><text x=\"77\" y=\"63\">3</text><text x=\"77\" y=\"43\">4</text><text x=\"77\" y=\"23\">5</text><text x=\"77\" y=\"3\">6</text></g><path d=\"M50.0 165.0 L52.0 159.2 L54.0 153.8 L56.0 148.8 L58.0 144.2 L60.0 140.0 L62.0 136.2 L64.0 132.8 L66.0 129.8 L68.0 127.2 L70.0 125.0 L72.0 123.2 L74.0 121.8 L76.0 120.8 L78.0 120.2 L80.0 120.0M80.0 120.0 L82.0 119.8 L84.0 119.2 L86.0 118.2 L88.0 116.8 L90.0 115.0 L92.0 112.8 L94.0 110.2 L96.0 107.2 L98.0 103.8 L100.0 100.0M100.0 100.0 L102.0 95.8 L104.0 91.2 L106.0 86.2 L108.0 80.8 L110.0 75.0 L112.0 68.8 L114.0 62.2 L116.0 55.2 L118.0 47.8 L120.0 40.0 L122.0 31.8 L124.0 23.2 L126.0 14.2 L128.0 4.8 L130.0 -5.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"100.0\" cy=\"100.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.625FF0":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 228 264\" role=\"img\" aria-label=\"График функции\" style=\"max-width:228px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"200\" height=\"240\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V240\"/><path d=\"M20 0V240\"/><path d=\"M40 0V240\"/><path d=\"M60 0V240\"/><path d=\"M80 0V240\"/><path d=\"M100 0V240\"/><path d=\"M120 0V240\"/><path d=\"M140 0V240\"/><path d=\"M160 0V240\"/><path d=\"M180 0V240\"/><path d=\"M200 0V240\"/><path d=\"M0 240 H200\"/><path d=\"M0 220 H200\"/><path d=\"M0 200 H200\"/><path d=\"M0 180 H200\"/><path d=\"M0 160 H200\"/><path d=\"M0 140 H200\"/><path d=\"M0 120 H200\"/><path d=\"M0 100 H200\"/><path d=\"M0 80 H200\"/><path d=\"M0 60 H200\"/><path d=\"M0 40 H200\"/><path d=\"M0 20 H200\"/><path d=\"M0 0 H200\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M140 0V240\"/><path d=\"M0 40H200\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-7</text><text x=\"20\" y=\"51\">-6</text><text x=\"40\" y=\"51\">-5</text><text x=\"60\" y=\"51\">-4</text><text x=\"80\" y=\"51\">-3</text><text x=\"100\" y=\"51\">-2</text><text x=\"120\" y=\"51\">-1</text><text x=\"160\" y=\"51\">1</text><text x=\"180\" y=\"51\">2</text><text x=\"200\" y=\"51\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"137\" y=\"243\">-10</text><text x=\"137\" y=\"223\">-9</text><text x=\"137\" y=\"203\">-8</text><text x=\"137\" y=\"183\">-7</text><text x=\"137\" y=\"163\">-6</text><text x=\"137\" y=\"143\">-5</text><text x=\"137\" y=\"123\">-4</text><text x=\"137\" y=\"103\">-3</text><text x=\"137\" y=\"83\">-2</text><text x=\"137\" y=\"63\">-1</text><text x=\"137\" y=\"23\">1</text><text x=\"137\" y=\"3\">2</text></g><path d=\"M50.0 242.5 L52.0 233.6 L54.0 224.9 L56.0 216.4 L58.0 208.1 L60.0 200.0M60.0 200.0 L62.0 192.1 L64.0 184.4 L66.0 176.9 L68.0 169.6 L70.0 162.5 L72.0 155.6 L74.0 148.9 L76.0 142.4 L78.0 136.1 L80.0 130.0 L82.0 124.1 L84.0 118.4 L86.0 112.9 L88.0 107.6 L90.0 102.5 L92.0 97.6 L94.0 92.9 L96.0 88.4 L98.0 84.1 L100.0 80.0 L102.0 76.1 L104.0 72.4 L106.0 68.9 L108.0 65.6 L110.0 62.5 L112.0 59.6 L114.0 56.9 L116.0 54.4 L118.0 52.1 L120.0 50.0 L122.0 48.1 L124.0 46.4 L126.0 44.9 L128.0 43.6 L130.0 42.5 L132.0 41.6 L134.0 40.9 L136.0 40.4 L138.0 40.1 L140.0 40.0M140.0 40.0 L142.0 39.9 L144.0 39.6 L146.0 39.1 L148.0 38.4 L150.0 37.5 L152.0 36.4 L154.0 35.1 L156.0 33.6 L158.0 31.9 L160.0 30.0 L162.0 27.9 L164.0 25.6 L166.0 23.1 L168.0 20.4 L170.0 17.5 L172.0 14.4 L174.0 11.1 L176.0 7.6 L178.0 3.9 L180.0 0.0 L182.0 -4.1 L184.0 -8.4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"200.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"140.0\" cy=\"40.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.6250F0":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 204\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"180\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V180\"/><path d=\"M20 0V180\"/><path d=\"M40 0V180\"/><path d=\"M60 0V180\"/><path d=\"M80 0V180\"/><path d=\"M100 0V180\"/><path d=\"M120 0V180\"/><path d=\"M140 0V180\"/><path d=\"M160 0V180\"/><path d=\"M180 0V180\"/><path d=\"M0 180 H180\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V180\"/><path d=\"M0 40H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-5</text><text x=\"20\" y=\"51\">-4</text><text x=\"40\" y=\"51\">-3</text><text x=\"60\" y=\"51\">-2</text><text x=\"80\" y=\"51\">-1</text><text x=\"120\" y=\"51\">1</text><text x=\"140\" y=\"51\">2</text><text x=\"160\" y=\"51\">3</text><text x=\"180\" y=\"51\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"183\">-7</text><text x=\"97\" y=\"163\">-6</text><text x=\"97\" y=\"143\">-5</text><text x=\"97\" y=\"123\">-4</text><text x=\"97\" y=\"103\">-3</text><text x=\"97\" y=\"83\">-2</text><text x=\"97\" y=\"63\">-1</text><text x=\"97\" y=\"23\">1</text><text x=\"97\" y=\"3\">2</text></g><path d=\"M64.0 184.8 L66.0 177.8 L68.0 171.2 L70.0 165.0 L72.0 159.2 L74.0 153.8 L76.0 148.8 L78.0 144.2 L80.0 140.0M80.0 140.0 L82.0 136.2 L84.0 132.8 L86.0 129.8 L88.0 127.2 L90.0 125.0 L92.0 123.2 L94.0 121.8 L96.0 120.8 L98.0 120.2 L100.0 120.0 L102.0 120.2 L104.0 120.8 L106.0 121.8 L108.0 123.2 L110.0 125.0 L112.0 127.2 L114.0 129.8 L116.0 132.8 L118.0 136.2 L120.0 140.0 L122.0 144.2 L124.0 148.8 L126.0 153.8 L128.0 159.2 L130.0 165.0 L132.0 171.2 L134.0 177.8 L136.0 184.8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"140.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.6D7DF6":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 204\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"180\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V180\"/><path d=\"M20 0V180\"/><path d=\"M40 0V180\"/><path d=\"M60 0V180\"/><path d=\"M80 0V180\"/><path d=\"M100 0V180\"/><path d=\"M120 0V180\"/><path d=\"M140 0V180\"/><path d=\"M160 0V180\"/><path d=\"M180 0V180\"/><path d=\"M0 180 H180\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V180\"/><path d=\"M0 60H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"71\">-4</text><text x=\"20\" y=\"71\">-3</text><text x=\"40\" y=\"71\">-2</text><text x=\"60\" y=\"71\">-1</text><text x=\"100\" y=\"71\">1</text><text x=\"120\" y=\"71\">2</text><text x=\"140\" y=\"71\">3</text><text x=\"160\" y=\"71\">4</text><text x=\"180\" y=\"71\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"183\">-6</text><text x=\"77\" y=\"163\">-5</text><text x=\"77\" y=\"143\">-4</text><text x=\"77\" y=\"123\">-3</text><text x=\"77\" y=\"103\">-2</text><text x=\"77\" y=\"83\">-1</text><text x=\"77\" y=\"43\">1</text><text x=\"77\" y=\"23\">2</text><text x=\"77\" y=\"3\">3</text></g><path d=\"M6.0 185.8 L8.0 175.2 L10.0 165.0 L12.0 155.2 L14.0 145.8 L16.0 136.8 L18.0 128.2 L20.0 120.0 L22.0 112.2 L24.0 104.8 L26.0 97.8 L28.0 91.2 L30.0 85.0 L32.0 79.2 L34.0 73.8 L36.0 68.8 L38.0 64.2 L40.0 60.0 L42.0 56.2 L44.0 52.8 L46.0 49.8 L48.0 47.2 L50.0 45.0 L52.0 43.2 L54.0 41.8 L56.0 40.8 L58.0 40.2 L60.0 40.0 L62.0 40.2 L64.0 40.8 L66.0 41.8 L68.0 43.2 L70.0 45.0 L72.0 47.2 L74.0 49.8 L76.0 52.8 L78.0 56.2 L80.0 60.0M80.0 60.0 L82.0 67.8 L84.0 75.2 L86.0 82.2 L88.0 88.8 L90.0 95.0 L92.0 100.8 L94.0 106.2 L96.0 111.2 L98.0 115.8 L100.0 120.0 L102.0 123.8 L104.0 127.2 L106.0 130.2 L108.0 132.8 L110.0 135.0 L112.0 136.8 L114.0 138.2 L116.0 139.2 L118.0 139.8 L120.0 140.0 L122.0 139.8 L124.0 139.2 L126.0 138.2 L128.0 136.8 L130.0 135.0 L132.0 132.8 L134.0 130.2 L136.0 127.2 L138.0 123.8 L140.0 120.0 L142.0 115.8 L144.0 111.2 L146.0 106.2 L148.0 100.8 L150.0 95.0 L152.0 88.8 L154.0 82.2 L156.0 75.2 L158.0 67.8 L160.0 60.0 L162.0 51.8 L164.0 43.2 L166.0 34.2 L168.0 24.8 L170.0 15.0 L172.0 4.8 L174.0 -5.8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"60.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.46800C":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 284\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"260\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V260\"/><path d=\"M20 0V260\"/><path d=\"M40 0V260\"/><path d=\"M60 0V260\"/><path d=\"M80 0V260\"/><path d=\"M100 0V260\"/><path d=\"M120 0V260\"/><path d=\"M140 0V260\"/><path d=\"M160 0V260\"/><path d=\"M180 0V260\"/><path d=\"M0 260 H180\"/><path d=\"M0 240 H180\"/><path d=\"M0 220 H180\"/><path d=\"M0 200 H180\"/><path d=\"M0 180 H180\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V260\"/><path d=\"M0 220H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"231\">-4</text><text x=\"20\" y=\"231\">-3</text><text x=\"40\" y=\"231\">-2</text><text x=\"60\" y=\"231\">-1</text><text x=\"100\" y=\"231\">1</text><text x=\"120\" y=\"231\">2</text><text x=\"140\" y=\"231\">3</text><text x=\"160\" y=\"231\">4</text><text x=\"180\" y=\"231\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"263\">-2</text><text x=\"77\" y=\"243\">-1</text><text x=\"77\" y=\"203\">1</text><text x=\"77\" y=\"183\">2</text><text x=\"77\" y=\"163\">3</text><text x=\"77\" y=\"143\">4</text><text x=\"77\" y=\"123\">5</text><text x=\"77\" y=\"103\">6</text><text x=\"77\" y=\"83\">7</text><text x=\"77\" y=\"63\">8</text><text x=\"77\" y=\"43\">9</text><text x=\"77\" y=\"23\">10</text><text x=\"77\" y=\"3\">11</text></g><path d=\"M60.0 40.0 L62.0 51.8 L64.0 63.2 L66.0 74.2 L68.0 84.8 L70.0 95.0 L72.0 104.8 L74.0 114.2 L76.0 123.2 L78.0 131.8 L80.0 140.0 L82.0 147.8 L84.0 155.2 L86.0 162.2 L88.0 168.8 L90.0 175.0 L92.0 180.8 L94.0 186.2 L96.0 191.2 L98.0 195.8 L100.0 200.0 L102.0 203.8 L104.0 207.2 L106.0 210.2 L108.0 212.8 L110.0 215.0 L112.0 216.8 L114.0 218.2 L116.0 219.2 L118.0 219.8 L120.0 220.0 L122.0 219.8 L124.0 219.2 L126.0 218.2 L128.0 216.8 L130.0 215.0 L132.0 212.8 L134.0 210.2 L136.0 207.2 L138.0 203.8 L140.0 200.0 L142.0 195.8 L144.0 191.2 L146.0 186.2 L148.0 180.8 L150.0 175.0 L152.0 168.8 L154.0 162.2 L156.0 155.2 L158.0 147.8 L160.0 140.0 L162.0 131.8 L164.0 123.2 L166.0 114.2 L168.0 104.8 L170.0 95.0 L172.0 84.8 L174.0 74.2 L176.0 63.2 L178.0 51.8 L180.0 40.0M0.0 175.0 L2.0 173.8 L4.0 172.6 L6.0 171.4 L8.0 170.0 L10.0 168.6 L12.0 167.1 L14.0 165.5 L16.0 163.8 L18.0 161.9 L20.0 160.0 L22.0 157.9 L24.0 155.7 L26.0 153.3 L28.0 150.8 L30.0 148.0 L32.0 145.0 L34.0 141.7 L36.0 138.2 L38.0 134.3 L40.0 130.0 L42.0 125.3 L44.0 120.0 L46.0 114.1 L48.0 107.5 L50.0 100.0 L52.0 91.4 L54.0 81.5 L56.0 70.0 L58.0 56.4 L60.0 40.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"40.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.768602":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V160\"/><path d=\"M0 100H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"111\">-4</text><text x=\"20\" y=\"111\">-3</text><text x=\"40\" y=\"111\">-2</text><text x=\"60\" y=\"111\">-1</text><text x=\"100\" y=\"111\">1</text><text x=\"120\" y=\"111\">2</text><text x=\"140\" y=\"111\">3</text><text x=\"160\" y=\"111\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"163\">-3</text><text x=\"77\" y=\"143\">-2</text><text x=\"77\" y=\"123\">-1</text><text x=\"77\" y=\"83\">1</text><text x=\"77\" y=\"63\">2</text><text x=\"77\" y=\"43\">3</text><text x=\"77\" y=\"23\">4</text><text x=\"77\" y=\"3\">5</text></g><path d=\"M0.0 105.0 L2.0 105.1 L4.0 105.3 L6.0 105.4 L8.0 105.6 L10.0 105.7 L12.0 105.9 L14.0 106.1 L16.0 106.2 L18.0 106.5 L20.0 106.7 L22.0 106.9 L24.0 107.1 L26.0 107.4 L28.0 107.7 L30.0 108.0 L32.0 108.3 L34.0 108.7 L36.0 109.1 L38.0 109.5 L40.0 110.0 L42.0 110.5 L44.0 111.1 L46.0 111.8 L48.0 112.5 L50.0 113.3 L52.0 114.3 L54.0 115.4 L56.0 116.7 L58.0 118.2 L60.0 120.0M60.0 120.0 L62.0 122.2 L64.0 125.0 L66.0 128.6 L68.0 133.3 L70.0 140.0 L72.0 150.0 L74.0 166.7M86.0 166.7 L88.0 150.0 L90.0 140.0 L92.0 133.3 L94.0 128.6 L96.0 125.0 L98.0 122.2 L100.0 120.0M100.0 120.0 L102.0 118.2 L104.0 116.7 L106.0 115.4 L108.0 114.3 L110.0 113.3 L112.0 112.5 L114.0 111.8 L116.0 111.1 L118.0 110.5 L120.0 110.0 L122.0 109.5 L124.0 109.1 L126.0 108.7 L128.0 108.3 L130.0 108.0 L132.0 107.7 L134.0 107.4 L136.0 107.1 L138.0 106.9 L140.0 106.7 L142.0 106.5 L144.0 106.2 L146.0 106.1 L148.0 105.9 L150.0 105.7 L152.0 105.6 L154.0 105.4 L156.0 105.3 L158.0 105.1 L160.0 105.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"120.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"100.0\" cy=\"120.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.B3D80F":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V160\"/><path d=\"M0 40H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-4</text><text x=\"20\" y=\"51\">-3</text><text x=\"40\" y=\"51\">-2</text><text x=\"60\" y=\"51\">-1</text><text x=\"100\" y=\"51\">1</text><text x=\"120\" y=\"51\">2</text><text x=\"140\" y=\"51\">3</text><text x=\"160\" y=\"51\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"163\">-6</text><text x=\"77\" y=\"143\">-5</text><text x=\"77\" y=\"123\">-4</text><text x=\"77\" y=\"103\">-3</text><text x=\"77\" y=\"83\">-2</text><text x=\"77\" y=\"63\">-1</text><text x=\"77\" y=\"23\">1</text><text x=\"77\" y=\"3\">2</text></g><path d=\"M0.0 45.0 L2.0 45.1 L4.1 45.3 L6.1 45.4 L8.1 45.6 L10.1 45.7 L12.2 45.9 L14.2 46.1 L16.2 46.3 L18.2 46.5 L20.3 46.7 L22.3 46.9 L24.3 47.2 L26.4 47.5 L28.4 47.7 L30.4 48.1 L32.4 48.4 L34.5 48.8 L36.5 49.2 L38.5 49.6 L40.5 50.1 L42.6 50.7 L44.6 51.3 L46.6 52.0 L48.6 52.8 L50.7 53.6 L52.7 54.7 L54.7 55.8 L56.8 57.2 L58.8 58.9 L60.8 60.8 L62.8 63.3 L64.9 66.4 L66.9 70.5 L68.9 76.1 L70.9 84.2 L73.0 96.9 L75.0 120.0M75.0 120.0 L76.2 146.7M83.8 146.7 L85.0 120.0M85.0 120.0 L87.0 96.9 L89.1 84.2 L91.1 76.1 L93.1 70.5 L95.1 66.4 L97.2 63.3 L99.2 60.8 L101.2 58.9 L103.2 57.2 L105.3 55.8 L107.3 54.7 L109.3 53.6 L111.4 52.8 L113.4 52.0 L115.4 51.3 L117.4 50.7 L119.5 50.1 L121.5 49.6 L123.5 49.2 L125.5 48.8 L127.6 48.4 L129.6 48.1 L131.6 47.7 L133.6 47.5 L135.7 47.2 L137.7 46.9 L139.7 46.7 L141.8 46.5 L143.8 46.3 L145.8 46.1 L147.8 45.9 L149.9 45.7 L151.9 45.6 L153.9 45.4 L155.9 45.3 L158.0 45.1 L160.0 45.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"75.0\" cy=\"120.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"85.0\" cy=\"120.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.20CD08":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V160\"/><path d=\"M0 120H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-4</text><text x=\"20\" y=\"131\">-3</text><text x=\"40\" y=\"131\">-2</text><text x=\"60\" y=\"131\">-1</text><text x=\"100\" y=\"131\">1</text><text x=\"120\" y=\"131\">2</text><text x=\"140\" y=\"131\">3</text><text x=\"160\" y=\"131\">4</text><text x=\"180\" y=\"131\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"163\">-2</text><text x=\"77\" y=\"143\">-1</text><text x=\"77\" y=\"103\">1</text><text x=\"77\" y=\"83\">2</text><text x=\"77\" y=\"63\">3</text><text x=\"77\" y=\"43\">4</text><text x=\"77\" y=\"23\">5</text><text x=\"77\" y=\"3\">6</text></g><path d=\"M0.0 125.0 L2.0 125.1 L4.0 125.3 L6.0 125.4 L8.0 125.6 L10.0 125.7 L12.0 125.9 L14.0 126.1 L16.0 126.2 L18.0 126.5 L20.0 126.7 L22.0 126.9 L24.0 127.1 L26.0 127.4 L28.0 127.7 L30.0 128.0 L32.0 128.3 L34.0 128.7 L36.0 129.1 L38.0 129.5 L40.0 130.0 L42.0 130.5 L44.0 131.1 L46.0 131.8 L48.0 132.5 L50.0 133.3 L52.0 134.3 L54.0 135.4 L56.0 136.7 L58.0 138.2 L60.0 140.0 L62.0 142.2 L64.0 145.0 L66.0 148.6 L68.0 153.3 L70.0 160.0M84.1 22.0 L86.1 54.7 L88.2 71.0 L90.2 80.8 L92.2 87.3 L94.3 92.0M94.3 92.0 L96.3 95.5 L98.4 98.2 L100.4 100.4 L102.4 102.2 L104.5 103.7 L106.5 104.9 L108.6 106.0 L110.6 106.9 L112.7 107.8 L114.7 108.5 L116.7 109.1 L118.8 109.7 L120.8 110.2 L122.9 110.7 L124.9 111.1 L126.9 111.5 L129.0 111.8 L131.0 112.2 L133.1 112.5 L135.1 112.7 L137.1 113.0 L139.2 113.2 L141.2 113.5 L143.3 113.7 L145.3 113.9 L147.3 114.1 L149.4 114.2 L151.4 114.4 L153.5 114.6 L155.5 114.7 L157.6 114.8 L159.6 115.0 L161.6 115.1 L163.7 115.2 L165.7 115.3 L167.8 115.4 L169.8 115.5 L171.8 115.6 L173.9 115.7 L175.9 115.8 L178.0 115.9 L180.0 116.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"94.3\" cy=\"92.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.C1600B":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 204\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"180\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V180\"/><path d=\"M20 0V180\"/><path d=\"M40 0V180\"/><path d=\"M60 0V180\"/><path d=\"M80 0V180\"/><path d=\"M100 0V180\"/><path d=\"M120 0V180\"/><path d=\"M140 0V180\"/><path d=\"M160 0V180\"/><path d=\"M0 180 H160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V180\"/><path d=\"M0 40H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-5</text><text x=\"20\" y=\"51\">-4</text><text x=\"40\" y=\"51\">-3</text><text x=\"60\" y=\"51\">-2</text><text x=\"80\" y=\"51\">-1</text><text x=\"120\" y=\"51\">1</text><text x=\"140\" y=\"51\">2</text><text x=\"160\" y=\"51\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"183\">-7</text><text x=\"97\" y=\"163\">-6</text><text x=\"97\" y=\"143\">-5</text><text x=\"97\" y=\"123\">-4</text><text x=\"97\" y=\"103\">-3</text><text x=\"97\" y=\"83\">-2</text><text x=\"97\" y=\"63\">-1</text><text x=\"97\" y=\"23\">1</text><text x=\"97\" y=\"3\">2</text></g><path d=\"M0.0 150.0 L30.0 120.0 L60.0 90.0M60.0 90.0 L70.0 110.0 L80.0 130.0M80.0 130.0 L120.0 90.0 L160.0 50.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"90.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"80.0\" cy=\"130.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.C69602":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V160\"/><path d=\"M0 120H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-5</text><text x=\"20\" y=\"131\">-4</text><text x=\"40\" y=\"131\">-3</text><text x=\"60\" y=\"131\">-2</text><text x=\"80\" y=\"131\">-1</text><text x=\"120\" y=\"131\">1</text><text x=\"140\" y=\"131\">2</text><text x=\"160\" y=\"131\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"163\">-2</text><text x=\"97\" y=\"143\">-1</text><text x=\"97\" y=\"103\">1</text><text x=\"97\" y=\"83\">2</text><text x=\"97\" y=\"63\">3</text><text x=\"97\" y=\"43\">4</text><text x=\"97\" y=\"23\">5</text><text x=\"97\" y=\"3\">6</text></g><path d=\"M0.0 56.0 L2.0 55.9 L4.0 55.8 L6.0 55.7 L8.0 55.7 L10.0 55.6 L12.0 55.5 L14.0 55.3 L16.0 55.2 L18.0 55.1 L20.0 55.0 L22.0 54.9 L24.0 54.7 L26.0 54.6 L28.0 54.4 L30.0 54.3 L32.0 54.1 L34.0 53.9 L36.0 53.7 L38.0 53.5 L40.0 53.3 L42.0 53.1 L44.0 52.9 L46.0 52.6 L48.0 52.3 L50.0 52.0 L52.0 51.7 L54.0 51.3 L56.0 50.9 L58.0 50.5 L60.0 50.0M60.0 50.0 L62.0 49.5 L64.0 48.9 L66.0 48.2 L68.0 47.5 L70.0 46.7 L72.0 45.7 L74.0 44.6 L76.0 43.3 L78.0 41.8 L80.0 40.0 L82.0 37.8 L84.0 35.0 L86.0 31.4 L88.0 26.7 L90.0 20.0 L92.0 10.0 L94.0 -6.7M104.0 160.0 L106.0 126.7 L108.0 110.0 L110.0 100.0 L112.0 93.3 L114.0 88.6 L116.0 85.0 L118.0 82.2 L120.0 80.0 L122.0 78.2 L124.0 76.7 L126.0 75.4 L128.0 74.3 L130.0 73.3 L132.0 72.5 L134.0 71.8 L136.0 71.1 L138.0 70.5 L140.0 70.0 L142.0 69.5 L144.0 69.1 L146.0 68.7 L148.0 68.3 L150.0 68.0 L152.0 67.7 L154.0 67.4 L156.0 67.1 L158.0 66.9 L160.0 66.7\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"50.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.68EB0C":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 248 224\" role=\"img\" aria-label=\"График функции\" style=\"max-width:248px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"220\" height=\"200\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V200\"/><path d=\"M20 0V200\"/><path d=\"M40 0V200\"/><path d=\"M60 0V200\"/><path d=\"M80 0V200\"/><path d=\"M100 0V200\"/><path d=\"M120 0V200\"/><path d=\"M140 0V200\"/><path d=\"M160 0V200\"/><path d=\"M180 0V200\"/><path d=\"M200 0V200\"/><path d=\"M220 0V200\"/><path d=\"M0 200 H220\"/><path d=\"M0 180 H220\"/><path d=\"M0 160 H220\"/><path d=\"M0 140 H220\"/><path d=\"M0 120 H220\"/><path d=\"M0 100 H220\"/><path d=\"M0 80 H220\"/><path d=\"M0 60 H220\"/><path d=\"M0 40 H220\"/><path d=\"M0 20 H220\"/><path d=\"M0 0 H220\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M160 0V200\"/><path d=\"M0 160H220\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"171\">-8</text><text x=\"20\" y=\"171\">-7</text><text x=\"40\" y=\"171\">-6</text><text x=\"60\" y=\"171\">-5</text><text x=\"80\" y=\"171\">-4</text><text x=\"100\" y=\"171\">-3</text><text x=\"120\" y=\"171\">-2</text><text x=\"140\" y=\"171\">-1</text><text x=\"180\" y=\"171\">1</text><text x=\"200\" y=\"171\">2</text><text x=\"220\" y=\"171\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"157\" y=\"203\">-2</text><text x=\"157\" y=\"183\">-1</text><text x=\"157\" y=\"143\">1</text><text x=\"157\" y=\"123\">2</text><text x=\"157\" y=\"103\">3</text><text x=\"157\" y=\"83\">4</text><text x=\"157\" y=\"63\">5</text><text x=\"157\" y=\"43\">6</text><text x=\"157\" y=\"23\">7</text><text x=\"157\" y=\"3\">8</text></g><path d=\"M0.0 57.5 L2.0 57.5 L4.0 57.4 L6.0 57.4 L8.0 57.4 L10.0 57.3 L12.0 57.3 L14.0 57.3 L16.0 57.2 L18.0 57.2 L20.0 57.1 L22.0 57.1 L24.0 57.1 L26.0 57.0 L28.0 57.0 L30.0 56.9 L32.0 56.9 L34.0 56.8 L36.0 56.8 L38.0 56.7 L40.0 56.7 L42.0 56.6 L44.0 56.6 L46.0 56.5 L48.0 56.4 L50.0 56.4 L52.0 56.3 L54.0 56.2 L56.0 56.2 L58.0 56.1 L60.0 56.0M60.0 56.0 L62.0 55.9 L64.0 55.8 L66.0 55.7 L68.0 55.7 L70.0 55.6 L72.0 55.5 L74.0 55.3 L76.0 55.2 L78.0 55.1 L80.0 55.0 L82.0 54.9 L84.0 54.7 L86.0 54.6 L88.0 54.4 L90.0 54.3 L92.0 54.1 L94.0 53.9 L96.0 53.8 L98.0 53.5 L100.0 53.3 L102.0 53.1 L104.0 52.9 L106.0 52.6 L108.0 52.3 L110.0 52.0 L112.0 51.7 L114.0 51.3 L116.0 50.9 L118.0 50.5 L120.0 50.0 L122.0 49.5 L124.0 48.9 L126.0 48.2 L128.0 47.5 L130.0 46.7 L132.0 45.7 L134.0 44.6 L136.0 43.3 L138.0 41.8 L140.0 40.0 L142.0 37.8 L144.0 35.0 L146.0 31.4 L148.0 26.7 L150.0 20.0 L152.0 10.0 L154.0 -6.7M164.0 160.0 L166.0 126.7 L168.0 110.0 L170.0 100.0 L172.0 93.3 L174.0 88.6 L176.0 85.0 L178.0 82.2 L180.0 80.0 L182.0 78.2 L184.0 76.7 L186.0 75.4 L188.0 74.3 L190.0 73.3 L192.0 72.5 L194.0 71.8 L196.0 71.1 L198.0 70.5 L200.0 70.0 L202.0 69.5 L204.0 69.1 L206.0 68.7 L208.0 68.3 L210.0 68.0 L212.0 67.7 L214.0 67.4 L216.0 67.1 L218.0 66.9 L220.0 66.7\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"56.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.35020B":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 248 284\" role=\"img\" aria-label=\"График функции\" style=\"max-width:248px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"220\" height=\"260\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V260\"/><path d=\"M20 0V260\"/><path d=\"M40 0V260\"/><path d=\"M60 0V260\"/><path d=\"M80 0V260\"/><path d=\"M100 0V260\"/><path d=\"M120 0V260\"/><path d=\"M140 0V260\"/><path d=\"M160 0V260\"/><path d=\"M180 0V260\"/><path d=\"M200 0V260\"/><path d=\"M220 0V260\"/><path d=\"M0 260 H220\"/><path d=\"M0 240 H220\"/><path d=\"M0 220 H220\"/><path d=\"M0 200 H220\"/><path d=\"M0 180 H220\"/><path d=\"M0 160 H220\"/><path d=\"M0 140 H220\"/><path d=\"M0 120 H220\"/><path d=\"M0 100 H220\"/><path d=\"M0 80 H220\"/><path d=\"M0 60 H220\"/><path d=\"M0 40 H220\"/><path d=\"M0 20 H220\"/><path d=\"M0 0 H220\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V260\"/><path d=\"M0 220H220\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"231\">-3</text><text x=\"20\" y=\"231\">-2</text><text x=\"40\" y=\"231\">-1</text><text x=\"80\" y=\"231\">1</text><text x=\"100\" y=\"231\">2</text><text x=\"120\" y=\"231\">3</text><text x=\"140\" y=\"231\">4</text><text x=\"160\" y=\"231\">5</text><text x=\"180\" y=\"231\">6</text><text x=\"200\" y=\"231\">7</text><text x=\"220\" y=\"231\">8</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"263\">-2</text><text x=\"57\" y=\"243\">-1</text><text x=\"57\" y=\"203\">1</text><text x=\"57\" y=\"183\">2</text><text x=\"57\" y=\"163\">3</text><text x=\"57\" y=\"143\">4</text><text x=\"57\" y=\"123\">5</text><text x=\"57\" y=\"103\">6</text><text x=\"57\" y=\"83\">7</text><text x=\"57\" y=\"63\">8</text><text x=\"57\" y=\"43\">9</text><text x=\"57\" y=\"23\">10</text><text x=\"57\" y=\"3\">11</text></g><path d=\"M10.0 265.0 L12.0 255.2 L14.0 245.8 L16.0 236.8 L18.0 228.2 L20.0 220.0 L22.0 212.2 L24.0 204.8 L26.0 197.8 L28.0 191.2 L30.0 185.0 L32.0 179.2 L34.0 173.8 L36.0 168.8 L38.0 164.2 L40.0 160.0 L42.0 156.2 L44.0 152.8 L46.0 149.8 L48.0 147.2 L50.0 145.0 L52.0 143.2 L54.0 141.8 L56.0 140.8 L58.0 140.2 L60.0 140.0 L62.0 140.2 L64.0 140.8 L66.0 141.8 L68.0 143.2 L70.0 145.0 L72.0 147.2 L74.0 149.8 L76.0 152.8 L78.0 156.2 L80.0 160.0 L82.0 164.2 L84.0 168.8 L86.0 173.8 L88.0 179.2 L90.0 185.0 L92.0 191.2 L94.0 197.8 L96.0 204.8 L98.0 212.2 L100.0 220.0M100.0 220.0 L102.0 208.2 L104.0 196.8 L106.0 185.8 L108.0 175.2 L110.0 165.0 L112.0 155.2 L114.0 145.8 L116.0 136.8 L118.0 128.2 L120.0 120.0 L122.0 112.2 L124.0 104.8 L126.0 97.8 L128.0 91.2 L130.0 85.0 L132.0 79.2 L134.0 73.8 L136.0 68.8 L138.0 64.2 L140.0 60.0 L142.0 56.2 L144.0 52.8 L146.0 49.8 L148.0 47.2 L150.0 45.0 L152.0 43.2 L154.0 41.8 L156.0 40.8 L158.0 40.2 L160.0 40.0 L162.0 40.2 L164.0 40.8 L166.0 41.8 L168.0 43.2 L170.0 45.0 L172.0 47.2 L174.0 49.8 L176.0 52.8 L178.0 56.2 L180.0 60.0 L182.0 64.2 L184.0 68.8 L186.0 73.8 L188.0 79.2 L190.0 85.0 L192.0 91.2 L194.0 97.8 L196.0 104.8 L198.0 112.2 L200.0 120.0 L202.0 128.2 L204.0 136.8 L206.0 145.8 L208.0 155.2 L210.0 165.0 L212.0 175.2 L214.0 185.8 L216.0 196.8 L218.0 208.2 L220.0 220.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"220.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.3D9A0A":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 228 364\" role=\"img\" aria-label=\"График функции\" style=\"max-width:228px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"200\" height=\"340\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V340\"/><path d=\"M20 0V340\"/><path d=\"M40 0V340\"/><path d=\"M60 0V340\"/><path d=\"M80 0V340\"/><path d=\"M100 0V340\"/><path d=\"M120 0V340\"/><path d=\"M140 0V340\"/><path d=\"M160 0V340\"/><path d=\"M180 0V340\"/><path d=\"M200 0V340\"/><path d=\"M0 340 H200\"/><path d=\"M0 320 H200\"/><path d=\"M0 300 H200\"/><path d=\"M0 280 H200\"/><path d=\"M0 260 H200\"/><path d=\"M0 240 H200\"/><path d=\"M0 220 H200\"/><path d=\"M0 200 H200\"/><path d=\"M0 180 H200\"/><path d=\"M0 160 H200\"/><path d=\"M0 140 H200\"/><path d=\"M0 120 H200\"/><path d=\"M0 100 H200\"/><path d=\"M0 80 H200\"/><path d=\"M0 60 H200\"/><path d=\"M0 40 H200\"/><path d=\"M0 20 H200\"/><path d=\"M0 0 H200\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M120 0V340\"/><path d=\"M0 240H200\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"251\">-6</text><text x=\"20\" y=\"251\">-5</text><text x=\"40\" y=\"251\">-4</text><text x=\"60\" y=\"251\">-3</text><text x=\"80\" y=\"251\">-2</text><text x=\"100\" y=\"251\">-1</text><text x=\"140\" y=\"251\">1</text><text x=\"160\" y=\"251\">2</text><text x=\"180\" y=\"251\">3</text><text x=\"200\" y=\"251\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"117\" y=\"323\">-4</text><text x=\"117\" y=\"283\">-2</text><text x=\"117\" y=\"203\">2</text><text x=\"117\" y=\"163\">4</text><text x=\"117\" y=\"123\">6</text><text x=\"117\" y=\"83\">8</text><text x=\"117\" y=\"43\">10</text><text x=\"117\" y=\"3\">12</text></g><path d=\"M0.0 120.0 L2.0 110.2 L4.0 100.8 L6.0 91.8 L8.0 83.2 L10.0 75.0 L12.0 67.2 L14.0 59.8 L16.0 52.8 L18.0 46.2 L20.0 40.0 L22.0 34.2 L24.0 28.8 L26.0 23.8 L28.0 19.2 L30.0 15.0 L32.0 11.2 L34.0 7.8 L36.0 4.8 L38.0 2.2 L40.0 0.0 L42.0 -1.8 L44.0 -3.2 L46.0 -4.2 L48.0 -4.8 L50.0 -5.0 L52.0 -4.8 L54.0 -4.2 L56.0 -3.2 L58.0 -1.8 L60.0 0.0 L62.0 2.2 L64.0 4.8 L66.0 7.8 L68.0 11.2 L70.0 15.0 L72.0 19.2 L74.0 23.8 L76.0 28.8 L78.0 34.2 L80.0 40.0 L82.0 46.2 L84.0 52.8 L86.0 59.8 L88.0 67.2 L90.0 75.0 L92.0 83.2 L94.0 91.8 L96.0 100.8 L98.0 110.2 L100.0 120.0 L102.0 130.2 L104.0 140.8 L106.0 151.8 L108.0 163.2 L110.0 175.0 L112.0 187.2 L114.0 199.8 L116.0 212.8 L118.0 226.2 L120.0 240.0M120.0 240.0 L122.0 245.8 L124.0 251.2 L126.0 256.2 L128.0 260.8 L130.0 265.0 L132.0 268.8 L134.0 272.2 L136.0 275.2 L138.0 277.8 L140.0 280.0 L142.0 281.8 L144.0 283.2 L146.0 284.2 L148.0 284.8 L150.0 285.0 L152.0 284.8 L154.0 284.2 L156.0 283.2 L158.0 281.8 L160.0 280.0 L162.0 277.8 L164.0 275.2 L166.0 272.2 L168.0 268.8 L170.0 265.0 L172.0 260.8 L174.0 256.2 L176.0 251.2 L178.0 245.8 L180.0 240.0 L182.0 233.8 L184.0 227.2 L186.0 220.2 L188.0 212.8 L190.0 205.0 L192.0 196.8 L194.0 188.2 L196.0 179.2 L198.0 169.8 L200.0 160.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"120.0\" cy=\"240.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.FCB77C":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 248 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:248px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"220\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M220 0V160\"/><path d=\"M0 160 H220\"/><path d=\"M0 140 H220\"/><path d=\"M0 120 H220\"/><path d=\"M0 100 H220\"/><path d=\"M0 80 H220\"/><path d=\"M0 60 H220\"/><path d=\"M0 40 H220\"/><path d=\"M0 20 H220\"/><path d=\"M0 0 H220\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M160 0V160\"/><path d=\"M0 120H220\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-8</text><text x=\"20\" y=\"131\">-7</text><text x=\"40\" y=\"131\">-6</text><text x=\"60\" y=\"131\">-5</text><text x=\"80\" y=\"131\">-4</text><text x=\"100\" y=\"131\">-3</text><text x=\"120\" y=\"131\">-2</text><text x=\"140\" y=\"131\">-1</text><text x=\"180\" y=\"131\">1</text><text x=\"200\" y=\"131\">2</text><text x=\"220\" y=\"131\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"157\" y=\"163\">-2</text><text x=\"157\" y=\"143\">-1</text><text x=\"157\" y=\"103\">1</text><text x=\"157\" y=\"83\">2</text><text x=\"157\" y=\"63\">3</text><text x=\"157\" y=\"43\">4</text><text x=\"157\" y=\"23\">5</text><text x=\"157\" y=\"3\">6</text></g><path d=\"M60.0 40.0 L62.0 47.8 L64.0 55.2 L66.0 62.2 L68.0 68.8 L70.0 75.0 L72.0 80.8 L74.0 86.2 L76.0 91.2 L78.0 95.8 L80.0 100.0 L82.0 103.8 L84.0 107.2 L86.0 110.2 L88.0 112.8 L90.0 115.0 L92.0 116.8 L94.0 118.2 L96.0 119.2 L98.0 119.8 L100.0 120.0 L102.0 119.8 L104.0 119.2 L106.0 118.2 L108.0 116.8 L110.0 115.0 L112.0 112.8 L114.0 110.2 L116.0 107.2 L118.0 103.8 L120.0 100.0 L122.0 95.8 L124.0 91.2 L126.0 86.2 L128.0 80.8 L130.0 75.0 L132.0 68.8 L134.0 62.2 L136.0 55.2 L138.0 47.8 L140.0 40.0 L142.0 31.8 L144.0 23.2 L146.0 14.2 L148.0 4.8 L150.0 -5.0M0.0 70.0 L2.0 69.4 L4.0 68.7 L6.0 68.1 L8.0 67.4 L10.0 66.7 L12.0 65.9 L14.0 65.2 L16.0 64.4 L18.0 63.7 L20.0 62.9 L22.0 62.0 L24.0 61.2 L26.0 60.3 L28.0 59.4 L30.0 58.5 L32.0 57.5 L34.0 56.5 L36.0 55.5 L38.0 54.4 L40.0 53.3 L42.0 52.2 L44.0 51.0 L46.0 49.8 L48.0 48.6 L50.0 47.3 L52.0 45.9 L54.0 44.5 L56.0 43.1 L58.0 41.6 L60.0 40.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"40.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.0D3070":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 248 444\" role=\"img\" aria-label=\"График функции\" style=\"max-width:248px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"220\" height=\"420\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V420\"/><path d=\"M20 0V420\"/><path d=\"M40 0V420\"/><path d=\"M60 0V420\"/><path d=\"M80 0V420\"/><path d=\"M100 0V420\"/><path d=\"M120 0V420\"/><path d=\"M140 0V420\"/><path d=\"M160 0V420\"/><path d=\"M180 0V420\"/><path d=\"M200 0V420\"/><path d=\"M220 0V420\"/><path d=\"M0 420 H220\"/><path d=\"M0 400 H220\"/><path d=\"M0 380 H220\"/><path d=\"M0 360 H220\"/><path d=\"M0 340 H220\"/><path d=\"M0 320 H220\"/><path d=\"M0 300 H220\"/><path d=\"M0 280 H220\"/><path d=\"M0 260 H220\"/><path d=\"M0 240 H220\"/><path d=\"M0 220 H220\"/><path d=\"M0 200 H220\"/><path d=\"M0 180 H220\"/><path d=\"M0 160 H220\"/><path d=\"M0 140 H220\"/><path d=\"M0 120 H220\"/><path d=\"M0 100 H220\"/><path d=\"M0 80 H220\"/><path d=\"M0 60 H220\"/><path d=\"M0 40 H220\"/><path d=\"M0 20 H220\"/><path d=\"M0 0 H220\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M120 0V420\"/><path d=\"M0 240H220\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"251\">-6</text><text x=\"20\" y=\"251\">-5</text><text x=\"40\" y=\"251\">-4</text><text x=\"60\" y=\"251\">-3</text><text x=\"80\" y=\"251\">-2</text><text x=\"100\" y=\"251\">-1</text><text x=\"140\" y=\"251\">1</text><text x=\"160\" y=\"251\">2</text><text x=\"180\" y=\"251\">3</text><text x=\"200\" y=\"251\">4</text><text x=\"220\" y=\"251\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"117\" y=\"403\">-8</text><text x=\"117\" y=\"363\">-6</text><text x=\"117\" y=\"323\">-4</text><text x=\"117\" y=\"283\">-2</text><text x=\"117\" y=\"203\">2</text><text x=\"117\" y=\"163\">4</text><text x=\"117\" y=\"123\">6</text><text x=\"117\" y=\"83\">8</text><text x=\"117\" y=\"43\">10</text><text x=\"117\" y=\"3\">12</text></g><path d=\"M0.0 120.0 L2.0 110.2 L4.0 100.8 L6.0 91.8 L8.0 83.2 L10.0 75.0 L12.0 67.2 L14.0 59.8 L16.0 52.8 L18.0 46.2 L20.0 40.0 L22.0 34.2 L24.0 28.8 L26.0 23.8 L28.0 19.2 L30.0 15.0 L32.0 11.2 L34.0 7.8 L36.0 4.8 L38.0 2.2 L40.0 0.0 L42.0 -1.8 L44.0 -3.2 L46.0 -4.2 L48.0 -4.8 L50.0 -5.0 L52.0 -4.8 L54.0 -4.2 L56.0 -3.2 L58.0 -1.8 L60.0 0.0 L62.0 2.2 L64.0 4.8 L66.0 7.8 L68.0 11.2 L70.0 15.0 L72.0 19.2 L74.0 23.8 L76.0 28.8 L78.0 34.2 L80.0 40.0 L82.0 46.2 L84.0 52.8 L86.0 59.8 L88.0 67.2 L90.0 75.0 L92.0 83.2 L94.0 91.8 L96.0 100.8 L98.0 110.2 L100.0 120.0 L102.0 130.2 L104.0 140.8 L106.0 151.8 L108.0 163.2 L110.0 175.0 L112.0 187.2 L114.0 199.8 L116.0 212.8 L118.0 226.2 L120.0 240.0M120.0 240.0 L122.0 249.8 L124.0 259.2 L126.0 268.2 L128.0 276.8 L130.0 285.0 L132.0 292.8 L134.0 300.2 L136.0 307.2 L138.0 313.8 L140.0 320.0 L142.0 325.8 L144.0 331.2 L146.0 336.2 L148.0 340.8 L150.0 345.0 L152.0 348.8 L154.0 352.2 L156.0 355.2 L158.0 357.8 L160.0 360.0 L162.0 361.8 L164.0 363.2 L166.0 364.2 L168.0 364.8 L170.0 365.0 L172.0 364.8 L174.0 364.2 L176.0 363.2 L178.0 361.8 L180.0 360.0 L182.0 357.8 L184.0 355.2 L186.0 352.2 L188.0 348.8 L190.0 345.0 L192.0 340.8 L194.0 336.2 L196.0 331.2 L198.0 325.8 L200.0 320.0 L202.0 313.8 L204.0 307.2 L206.0 300.2 L208.0 292.8 L210.0 285.0 L212.0 276.8 L214.0 268.2 L216.0 259.2 L218.0 249.8 L220.0 240.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"120.0\" cy=\"240.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.076977":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 204\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"180\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V180\"/><path d=\"M20 0V180\"/><path d=\"M40 0V180\"/><path d=\"M60 0V180\"/><path d=\"M80 0V180\"/><path d=\"M100 0V180\"/><path d=\"M120 0V180\"/><path d=\"M140 0V180\"/><path d=\"M160 0V180\"/><path d=\"M180 0V180\"/><path d=\"M0 180 H180\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V180\"/><path d=\"M0 120H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-5</text><text x=\"20\" y=\"131\">-4</text><text x=\"40\" y=\"131\">-3</text><text x=\"60\" y=\"131\">-2</text><text x=\"80\" y=\"131\">-1</text><text x=\"120\" y=\"131\">1</text><text x=\"140\" y=\"131\">2</text><text x=\"160\" y=\"131\">3</text><text x=\"180\" y=\"131\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"183\">-3</text><text x=\"97\" y=\"163\">-2</text><text x=\"97\" y=\"143\">-1</text><text x=\"97\" y=\"103\">1</text><text x=\"97\" y=\"83\">2</text><text x=\"97\" y=\"63\">3</text><text x=\"97\" y=\"43\">4</text><text x=\"97\" y=\"23\">5</text><text x=\"97\" y=\"3\">6</text></g><path d=\"M6.0 185.8 L8.0 175.2 L10.0 165.0 L12.0 155.2 L14.0 145.8 L16.0 136.8 L18.0 128.2 L20.0 120.0 L22.0 112.2 L24.0 104.8 L26.0 97.8 L28.0 91.2 L30.0 85.0 L32.0 79.2 L34.0 73.8 L36.0 68.8 L38.0 64.2 L40.0 60.0 L42.0 56.2 L44.0 52.8 L46.0 49.8 L48.0 47.2 L50.0 45.0 L52.0 43.2 L54.0 41.8 L56.0 40.8 L58.0 40.2 L60.0 40.0 L62.0 40.2 L64.0 40.8 L66.0 41.8 L68.0 43.2 L70.0 45.0 L72.0 47.2 L74.0 49.8 L76.0 52.8 L78.0 56.2 L80.0 60.0 L82.0 64.2 L84.0 68.8 L86.0 73.8 L88.0 79.2 L90.0 85.0 L92.0 91.2 L94.0 97.8 L96.0 104.8 L98.0 112.2 L100.0 120.0M100.0 120.0 L102.0 123.8 L104.0 127.2 L106.0 130.2 L108.0 132.8 L110.0 135.0 L112.0 136.8 L114.0 138.2 L116.0 139.2 L118.0 139.8 L120.0 140.0 L122.0 139.8 L124.0 139.2 L126.0 138.2 L128.0 136.8 L130.0 135.0 L132.0 132.8 L134.0 130.2 L136.0 127.2 L138.0 123.8 L140.0 120.0 L142.0 115.8 L144.0 111.2 L146.0 106.2 L148.0 100.8 L150.0 95.0 L152.0 88.8 L154.0 82.2 L156.0 75.2 L158.0 67.8 L160.0 60.0 L162.0 51.8 L164.0 43.2 L166.0 34.2 L168.0 24.8 L170.0 15.0 L172.0 4.8 L174.0 -5.8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.7AC574":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V160\"/><path d=\"M0 60H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"71\">-4</text><text x=\"20\" y=\"71\">-3</text><text x=\"40\" y=\"71\">-2</text><text x=\"60\" y=\"71\">-1</text><text x=\"100\" y=\"71\">1</text><text x=\"120\" y=\"71\">2</text><text x=\"140\" y=\"71\">3</text><text x=\"160\" y=\"71\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"163\">-5</text><text x=\"77\" y=\"143\">-4</text><text x=\"77\" y=\"123\">-3</text><text x=\"77\" y=\"103\">-2</text><text x=\"77\" y=\"83\">-1</text><text x=\"77\" y=\"43\">1</text><text x=\"77\" y=\"23\">2</text><text x=\"77\" y=\"3\">3</text></g><path d=\"M0.0 65.0 L2.0 65.1 L4.1 65.3 L6.1 65.4 L8.1 65.6 L10.2 65.7 L12.2 65.9 L14.3 66.1 L16.3 66.3 L18.3 66.5 L20.4 66.7 L22.4 66.9 L24.4 67.2 L26.5 67.5 L28.5 67.8 L30.6 68.1 L32.6 68.4 L34.6 68.8 L36.7 69.2 L38.7 69.7 L40.7 70.2 L42.8 70.7 L44.8 71.4 L46.9 72.1 L48.9 72.9 L50.9 73.8 L53.0 74.8 L55.0 76.0 L57.0 77.4 L59.1 79.1 L61.1 81.2 L63.1 83.7 L65.2 87.0 L67.2 91.3 L69.3 97.2 L71.3 106.0 L73.3 120.0M73.3 120.0 L75.0 140.0M85.0 140.0 L86.7 120.0M86.7 120.0 L88.7 106.0 L90.7 97.2 L92.8 91.3 L94.8 87.0 L96.9 83.7 L98.9 81.2 L100.9 79.1 L103.0 77.4 L105.0 76.0 L107.0 74.8 L109.1 73.8 L111.1 72.9 L113.1 72.1 L115.2 71.4 L117.2 70.7 L119.3 70.2 L121.3 69.7 L123.3 69.2 L125.4 68.8 L127.4 68.4 L129.4 68.1 L131.5 67.8 L133.5 67.5 L135.6 67.2 L137.6 66.9 L139.6 66.7 L141.7 66.5 L143.7 66.3 L145.7 66.1 L147.8 65.9 L149.8 65.7 L151.9 65.6 L153.9 65.4 L155.9 65.3 L158.0 65.1 L160.0 65.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"73.3\" cy=\"120.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"86.7\" cy=\"120.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.B80D72":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V160\"/><path d=\"M0 120H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-3</text><text x=\"20\" y=\"131\">-2</text><text x=\"40\" y=\"131\">-1</text><text x=\"80\" y=\"131\">1</text><text x=\"100\" y=\"131\">2</text><text x=\"120\" y=\"131\">3</text><text x=\"140\" y=\"131\">4</text><text x=\"160\" y=\"131\">5</text><text x=\"180\" y=\"131\">6</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"163\">-2</text><text x=\"57\" y=\"143\">-1</text><text x=\"57\" y=\"103\">1</text><text x=\"57\" y=\"83\">2</text><text x=\"57\" y=\"63\">3</text><text x=\"57\" y=\"43\">4</text><text x=\"57\" y=\"23\">5</text><text x=\"57\" y=\"3\">6</text></g><path d=\"M46.0 -5.8 L48.0 4.8 L50.0 15.0 L52.0 24.8 L54.0 34.2 L56.0 43.2 L58.0 51.8 L60.0 60.0 L62.0 67.8 L64.0 75.2 L66.0 82.2 L68.0 88.8 L70.0 95.0 L72.0 100.8 L74.0 106.2 L76.0 111.2 L78.0 115.8 L80.0 120.0M80.0 120.0 L82.0 116.2 L84.0 112.8 L86.0 109.8 L88.0 107.2 L90.0 105.0 L92.0 103.2 L94.0 101.8 L96.0 100.8 L98.0 100.2 L100.0 100.0 L102.0 100.2 L104.0 100.8 L106.0 101.8 L108.0 103.2 L110.0 105.0 L112.0 107.2 L114.0 109.8 L116.0 112.8 L118.0 116.2 L120.0 120.0M120.0 120.0 L122.0 115.8 L124.0 111.2 L126.0 106.2 L128.0 100.8 L130.0 95.0 L132.0 88.8 L134.0 82.2 L136.0 75.2 L138.0 67.8 L140.0 60.0 L142.0 51.8 L144.0 43.2 L146.0 34.2 L148.0 24.8 L150.0 15.0 L152.0 4.8 L154.0 -5.8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"120.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.1CE27B":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V160\"/><path d=\"M0 120H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-5</text><text x=\"20\" y=\"131\">-4</text><text x=\"40\" y=\"131\">-3</text><text x=\"60\" y=\"131\">-2</text><text x=\"80\" y=\"131\">-1</text><text x=\"120\" y=\"131\">1</text><text x=\"140\" y=\"131\">2</text><text x=\"160\" y=\"131\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"163\">-2</text><text x=\"97\" y=\"143\">-1</text><text x=\"97\" y=\"103\">1</text><text x=\"97\" y=\"83\">2</text><text x=\"97\" y=\"63\">3</text><text x=\"97\" y=\"43\">4</text><text x=\"97\" y=\"23\">5</text><text x=\"97\" y=\"3\">6</text></g><path d=\"M60.0 60.0 L62.0 56.2 L64.0 52.8 L66.0 49.8 L68.0 47.2 L70.0 45.0 L72.0 43.2 L74.0 41.8 L76.0 40.8 L78.0 40.2 L80.0 40.0 L82.0 40.2 L84.0 40.8 L86.0 41.8 L88.0 43.2 L90.0 45.0 L92.0 47.2 L94.0 49.8 L96.0 52.8 L98.0 56.2 L100.0 60.0 L102.0 64.2 L104.0 68.8 L106.0 73.8 L108.0 79.2 L110.0 85.0 L112.0 91.2 L114.0 97.8 L116.0 104.8 L118.0 112.2 L120.0 120.0 L122.0 128.2 L124.0 136.8 L126.0 145.8 L128.0 155.2 L130.0 165.0M0.0 40.0 L30.0 70.0 L60.0 100.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"100.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"60.0\" cy=\"60.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.158C7B":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 308 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:308px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"280\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M220 0V160\"/><path d=\"M240 0V160\"/><path d=\"M260 0V160\"/><path d=\"M280 0V160\"/><path d=\"M0 160 H280\"/><path d=\"M0 140 H280\"/><path d=\"M0 120 H280\"/><path d=\"M0 100 H280\"/><path d=\"M0 80 H280\"/><path d=\"M0 60 H280\"/><path d=\"M0 40 H280\"/><path d=\"M0 20 H280\"/><path d=\"M0 0 H280\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M140 0V160\"/><path d=\"M0 100H280\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"111\">-7</text><text x=\"20\" y=\"111\">-6</text><text x=\"40\" y=\"111\">-5</text><text x=\"60\" y=\"111\">-4</text><text x=\"80\" y=\"111\">-3</text><text x=\"100\" y=\"111\">-2</text><text x=\"120\" y=\"111\">-1</text><text x=\"160\" y=\"111\">1</text><text x=\"180\" y=\"111\">2</text><text x=\"200\" y=\"111\">3</text><text x=\"220\" y=\"111\">4</text><text x=\"240\" y=\"111\">5</text><text x=\"260\" y=\"111\">6</text><text x=\"280\" y=\"111\">7</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"137\" y=\"163\">-3</text><text x=\"137\" y=\"143\">-2</text><text x=\"137\" y=\"123\">-1</text><text x=\"137\" y=\"83\">1</text><text x=\"137\" y=\"63\">2</text><text x=\"137\" y=\"43\">3</text><text x=\"137\" y=\"23\">4</text><text x=\"137\" y=\"3\">5</text></g><path d=\"M0.0 112.9 L2.0 113.0 L4.0 113.2 L6.0 113.4 L8.0 113.6 L10.0 113.8 L12.0 114.1 L14.0 114.3 L16.0 114.5 L18.0 114.8 L20.0 115.0 L22.0 115.3 L24.0 115.5 L26.0 115.8 L28.0 116.1 L30.0 116.4 L32.0 116.7 L34.0 117.0 L36.0 117.3 L38.0 117.6 L40.0 118.0 L42.0 118.4 L44.0 118.8 L46.0 119.1 L48.0 119.6 L50.0 120.0M50.0 120.0 L95.0 110.0 L140.0 100.0M158.0 0.0 L160.0 10.0 L162.0 18.2 L164.0 25.0 L166.0 30.8 L168.0 35.7 L170.0 40.0 L172.0 43.8 L174.0 47.1 L176.0 50.0 L178.0 52.6 L180.0 55.0 L182.0 57.1 L184.0 59.1 L186.0 60.9 L188.0 62.5 L190.0 64.0 L192.0 65.4 L194.0 66.7 L196.0 67.9 L198.0 69.0 L200.0 70.0 L202.0 71.0 L204.0 71.9 L206.0 72.7 L208.0 73.5 L210.0 74.3 L212.0 75.0 L214.0 75.7 L216.0 76.3 L218.0 76.9 L220.0 77.5 L222.0 78.0 L224.0 78.6 L226.0 79.1 L228.0 79.5 L230.0 80.0M230.0 80.0 L255.0 74.4 L280.0 68.9\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"50.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"140.0\" cy=\"100.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"230.0\" cy=\"80.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.381A79":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 204\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"180\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V180\"/><path d=\"M20 0V180\"/><path d=\"M40 0V180\"/><path d=\"M60 0V180\"/><path d=\"M80 0V180\"/><path d=\"M100 0V180\"/><path d=\"M120 0V180\"/><path d=\"M140 0V180\"/><path d=\"M160 0V180\"/><path d=\"M0 180 H160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V180\"/><path d=\"M0 40H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-4</text><text x=\"20\" y=\"51\">-3</text><text x=\"40\" y=\"51\">-2</text><text x=\"60\" y=\"51\">-1</text><text x=\"100\" y=\"51\">1</text><text x=\"120\" y=\"51\">2</text><text x=\"140\" y=\"51\">3</text><text x=\"160\" y=\"51\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"183\">-7</text><text x=\"77\" y=\"163\">-6</text><text x=\"77\" y=\"143\">-5</text><text x=\"77\" y=\"123\">-4</text><text x=\"77\" y=\"103\">-3</text><text x=\"77\" y=\"83\">-2</text><text x=\"77\" y=\"63\">-1</text><text x=\"77\" y=\"23\">1</text><text x=\"77\" y=\"3\">2</text></g><path d=\"M0.0 45.0 L2.0 45.1 L4.1 45.3 L6.1 45.4 L8.2 45.6 L10.2 45.7 L12.3 45.9 L14.3 46.1 L16.3 46.3 L18.4 46.5 L20.4 46.7 L22.5 47.0 L24.5 47.2 L26.5 47.5 L28.6 47.8 L30.6 48.1 L32.7 48.5 L34.7 48.8 L36.8 49.2 L38.8 49.7 L40.8 50.2 L42.9 50.8 L44.9 51.4 L47.0 52.1 L49.0 52.9 L51.1 53.8 L53.1 54.9 L55.1 56.1 L57.2 57.5 L59.2 59.2 L61.3 61.3 L63.3 64.0 L65.3 67.3 L67.4 71.7 L69.4 77.8 L71.5 86.9 L73.5 101.7 L75.6 130.0M75.6 130.0 L76.7 160.0M83.3 160.0 L84.4 130.0M84.4 130.0 L86.5 101.7 L88.5 86.9 L90.6 77.8 L92.6 71.7 L94.7 67.3 L96.7 64.0 L98.7 61.3 L100.8 59.2 L102.8 57.5 L104.9 56.1 L106.9 54.9 L108.9 53.8 L111.0 52.9 L113.0 52.1 L115.1 51.4 L117.1 50.8 L119.2 50.2 L121.2 49.7 L123.2 49.2 L125.3 48.8 L127.3 48.5 L129.4 48.1 L131.4 47.8 L133.5 47.5 L135.5 47.2 L137.5 47.0 L139.6 46.7 L141.6 46.5 L143.7 46.3 L145.7 46.1 L147.7 45.9 L149.8 45.7 L151.8 45.6 L153.9 45.4 L155.9 45.3 L158.0 45.1 L160.0 45.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"75.6\" cy=\"130.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"84.4\" cy=\"130.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.4773B7":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 228 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:228px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"200\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M0 160 H200\"/><path d=\"M0 140 H200\"/><path d=\"M0 120 H200\"/><path d=\"M0 100 H200\"/><path d=\"M0 80 H200\"/><path d=\"M0 60 H200\"/><path d=\"M0 40 H200\"/><path d=\"M0 20 H200\"/><path d=\"M0 0 H200\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V160\"/><path d=\"M0 100H200\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"111\">-5</text><text x=\"20\" y=\"111\">-4</text><text x=\"40\" y=\"111\">-3</text><text x=\"60\" y=\"111\">-2</text><text x=\"80\" y=\"111\">-1</text><text x=\"120\" y=\"111\">1</text><text x=\"140\" y=\"111\">2</text><text x=\"160\" y=\"111\">3</text><text x=\"180\" y=\"111\">4</text><text x=\"200\" y=\"111\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"163\">-3</text><text x=\"97\" y=\"143\">-2</text><text x=\"97\" y=\"123\">-1</text><text x=\"97\" y=\"83\">1</text><text x=\"97\" y=\"63\">2</text><text x=\"97\" y=\"43\">3</text><text x=\"97\" y=\"23\">4</text><text x=\"97\" y=\"3\">5</text></g><path d=\"M0.0 110.0 L2.0 110.2 L4.0 110.4 L6.0 110.6 L8.0 110.9 L10.0 111.1 L12.0 111.4 L14.0 111.6 L16.0 111.9 L18.0 112.2 L20.0 112.5 L22.0 112.8 L24.0 113.2 L26.0 113.5 L28.0 113.9 L30.0 114.3 L32.0 114.7 L34.0 115.2 L36.0 115.6 L38.0 116.1 L40.0 116.7 L42.0 117.2 L44.0 117.9 L46.0 118.5 L48.0 119.2 L50.0 120.0M50.0 120.0 L75.0 110.0 L100.0 100.0M110.0 0.0 L112.0 16.7 L114.0 28.6 L116.0 37.5 L118.0 44.4 L120.0 50.0 L122.0 54.5 L124.0 58.3 L126.0 61.5 L128.0 64.3 L130.0 66.7 L132.0 68.8 L134.0 70.6 L136.0 72.2 L138.0 73.7 L140.0 75.0 L142.0 76.2 L144.0 77.3 L146.0 78.3 L148.0 79.2 L150.0 80.0M150.0 80.0 L175.0 70.0 L200.0 60.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"50.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"100.0\" cy=\"100.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"150.0\" cy=\"80.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.F0A0B3":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 264\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"240\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V240\"/><path d=\"M20 0V240\"/><path d=\"M40 0V240\"/><path d=\"M60 0V240\"/><path d=\"M80 0V240\"/><path d=\"M100 0V240\"/><path d=\"M120 0V240\"/><path d=\"M140 0V240\"/><path d=\"M160 0V240\"/><path d=\"M0 240 H160\"/><path d=\"M0 220 H160\"/><path d=\"M0 200 H160\"/><path d=\"M0 180 H160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V240\"/><path d=\"M0 180H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"191\">-5</text><text x=\"20\" y=\"191\">-4</text><text x=\"40\" y=\"191\">-3</text><text x=\"60\" y=\"191\">-2</text><text x=\"80\" y=\"191\">-1</text><text x=\"120\" y=\"191\">1</text><text x=\"140\" y=\"191\">2</text><text x=\"160\" y=\"191\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"243\">-3</text><text x=\"97\" y=\"223\">-2</text><text x=\"97\" y=\"203\">-1</text><text x=\"97\" y=\"163\">1</text><text x=\"97\" y=\"143\">2</text><text x=\"97\" y=\"123\">3</text><text x=\"97\" y=\"103\">4</text><text x=\"97\" y=\"83\">5</text><text x=\"97\" y=\"63\">6</text><text x=\"97\" y=\"43\">7</text><text x=\"97\" y=\"23\">8</text><text x=\"97\" y=\"3\">9</text></g><path d=\"M0.0 180.0 L2.0 170.2 L4.0 160.8 L6.0 151.8 L8.0 143.2 L10.0 135.0 L12.0 127.2 L14.0 119.8 L16.0 112.8 L18.0 106.2 L20.0 100.0 L22.0 94.2 L24.0 88.8 L26.0 83.8 L28.0 79.2 L30.0 75.0 L32.0 71.2 L34.0 67.8 L36.0 64.8 L38.0 62.2 L40.0 60.0 L42.0 58.2 L44.0 56.8 L46.0 55.8 L48.0 55.2 L50.0 55.0 L52.0 55.2 L54.0 55.8 L56.0 56.8 L58.0 58.2 L60.0 60.0 L62.0 62.2 L64.0 64.8 L66.0 67.8 L68.0 71.2 L70.0 75.0 L72.0 79.2 L74.0 83.8 L76.0 88.8 L78.0 94.2 L80.0 100.0 L82.0 106.2 L84.0 112.8 L86.0 119.8 L88.0 127.2 L90.0 135.0 L92.0 143.2 L94.0 151.8 L96.0 160.8 L98.0 170.2 L100.0 180.0M100.0 180.0 L102.0 181.8 L104.0 183.2 L106.0 184.2 L108.0 184.8 L110.0 185.0 L112.0 184.8 L114.0 184.2 L116.0 183.2 L118.0 181.8 L120.0 180.0 L122.0 177.8 L124.0 175.2 L126.0 172.2 L128.0 168.8 L130.0 165.0 L132.0 160.8 L134.0 156.2 L136.0 151.2 L138.0 145.8 L140.0 140.0 L142.0 133.8 L144.0 127.2 L146.0 120.2 L148.0 112.8 L150.0 105.0 L152.0 96.8 L154.0 88.2 L156.0 79.2 L158.0 69.8 L160.0 60.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"180.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.7493BA":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 228 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:228px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"200\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M0 160 H200\"/><path d=\"M0 140 H200\"/><path d=\"M0 120 H200\"/><path d=\"M0 100 H200\"/><path d=\"M0 80 H200\"/><path d=\"M0 60 H200\"/><path d=\"M0 40 H200\"/><path d=\"M0 20 H200\"/><path d=\"M0 0 H200\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V160\"/><path d=\"M0 80H200\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"91\">-3</text><text x=\"20\" y=\"91\">-2</text><text x=\"40\" y=\"91\">-1</text><text x=\"80\" y=\"91\">1</text><text x=\"100\" y=\"91\">2</text><text x=\"120\" y=\"91\">3</text><text x=\"140\" y=\"91\">4</text><text x=\"160\" y=\"91\">5</text><text x=\"180\" y=\"91\">6</text><text x=\"200\" y=\"91\">7</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"163\">-4</text><text x=\"57\" y=\"143\">-3</text><text x=\"57\" y=\"123\">-2</text><text x=\"57\" y=\"103\">-1</text><text x=\"57\" y=\"63\">1</text><text x=\"57\" y=\"43\">2</text><text x=\"57\" y=\"23\">3</text><text x=\"57\" y=\"3\">4</text></g><path d=\"M60.0 160.0 L120.0 100.0M120.0 80.0 L130.0 95.0 L140.0 110.0M140.0 110.0 L170.0 65.0 L200.0 20.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"120.0\" cy=\"100.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"120.0\" cy=\"80.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"140.0\" cy=\"110.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.EF61B5":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 228 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:228px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"200\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M0 160 H200\"/><path d=\"M0 140 H200\"/><path d=\"M0 120 H200\"/><path d=\"M0 100 H200\"/><path d=\"M0 80 H200\"/><path d=\"M0 60 H200\"/><path d=\"M0 40 H200\"/><path d=\"M0 20 H200\"/><path d=\"M0 0 H200\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M120 0V160\"/><path d=\"M0 120H200\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-6</text><text x=\"20\" y=\"131\">-5</text><text x=\"40\" y=\"131\">-4</text><text x=\"60\" y=\"131\">-3</text><text x=\"80\" y=\"131\">-2</text><text x=\"100\" y=\"131\">-1</text><text x=\"140\" y=\"131\">1</text><text x=\"160\" y=\"131\">2</text><text x=\"180\" y=\"131\">3</text><text x=\"200\" y=\"131\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"117\" y=\"163\">-2</text><text x=\"117\" y=\"143\">-1</text><text x=\"117\" y=\"103\">1</text><text x=\"117\" y=\"83\">2</text><text x=\"117\" y=\"63\">3</text><text x=\"117\" y=\"43\">4</text><text x=\"117\" y=\"23\">5</text><text x=\"117\" y=\"3\">6</text></g><path d=\"M36.0 -4.8 L38.0 7.8 L40.0 20.0 L42.0 31.8 L44.0 43.2 L46.0 54.2 L48.0 64.8 L50.0 75.0 L52.0 84.8 L54.0 94.2 L56.0 103.2 L58.0 111.8 L60.0 120.0M60.0 120.0 L62.0 112.2 L64.0 104.8 L66.0 97.8 L68.0 91.2 L70.0 85.0 L72.0 79.2 L74.0 73.8 L76.0 68.8 L78.0 64.2 L80.0 60.0 L82.0 56.2 L84.0 52.8 L86.0 49.8 L88.0 47.2 L90.0 45.0 L92.0 43.2 L94.0 41.8 L96.0 40.8 L98.0 40.2 L100.0 40.0 L102.0 40.2 L104.0 40.8 L106.0 41.8 L108.0 43.2 L110.0 45.0 L112.0 47.2 L114.0 49.8 L116.0 52.8 L118.0 56.2 L120.0 60.0 L122.0 64.2 L124.0 68.8 L126.0 73.8 L128.0 79.2 L130.0 85.0 L132.0 91.2 L134.0 97.8 L136.0 104.8 L138.0 112.2 L140.0 120.0M140.0 120.0 L142.0 111.8 L144.0 103.2 L146.0 94.2 L148.0 84.8 L150.0 75.0 L152.0 64.8 L154.0 54.2 L156.0 43.2 L158.0 31.8 L160.0 20.0 L162.0 7.8 L164.0 -4.8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"140.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.4FBE10":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 268 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:268px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"240\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M220 0V160\"/><path d=\"M240 0V160\"/><path d=\"M0 160 H240\"/><path d=\"M0 140 H240\"/><path d=\"M0 120 H240\"/><path d=\"M0 100 H240\"/><path d=\"M0 80 H240\"/><path d=\"M0 60 H240\"/><path d=\"M0 40 H240\"/><path d=\"M0 20 H240\"/><path d=\"M0 0 H240\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M120 0V160\"/><path d=\"M0 100H240\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"111\">-6</text><text x=\"20\" y=\"111\">-5</text><text x=\"40\" y=\"111\">-4</text><text x=\"60\" y=\"111\">-3</text><text x=\"80\" y=\"111\">-2</text><text x=\"100\" y=\"111\">-1</text><text x=\"140\" y=\"111\">1</text><text x=\"160\" y=\"111\">2</text><text x=\"180\" y=\"111\">3</text><text x=\"200\" y=\"111\">4</text><text x=\"220\" y=\"111\">5</text><text x=\"240\" y=\"111\">6</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"117\" y=\"163\">-3</text><text x=\"117\" y=\"143\">-2</text><text x=\"117\" y=\"123\">-1</text><text x=\"117\" y=\"83\">1</text><text x=\"117\" y=\"63\">2</text><text x=\"117\" y=\"43\">3</text><text x=\"117\" y=\"23\">4</text><text x=\"117\" y=\"3\">5</text></g><path d=\"M0.0 110.0 L2.0 110.2 L4.0 110.3 L6.0 110.5 L8.0 110.7 L10.0 110.9 L12.0 111.1 L14.0 111.3 L16.0 111.5 L18.0 111.8 L20.0 112.0 L22.0 112.2 L24.0 112.5 L26.0 112.8 L28.0 113.0 L30.0 113.3 L32.0 113.6 L34.0 114.0 L36.0 114.3 L38.0 114.6 L40.0 115.0 L42.0 115.4 L44.0 115.8 L46.0 116.2 L48.0 116.7 L50.0 117.1 L52.0 117.6 L54.0 118.2 L56.0 118.8 L58.0 119.4 L60.0 120.0M60.0 120.0 L90.0 110.0 L120.0 100.0M132.0 0.0 L134.0 14.3 L136.0 25.0 L138.0 33.3 L140.0 40.0 L142.0 45.5 L144.0 50.0 L146.0 53.8 L148.0 57.1 L150.0 60.0 L152.0 62.5 L154.0 64.7 L156.0 66.7 L158.0 68.4 L160.0 70.0 L162.0 71.4 L164.0 72.7 L166.0 73.9 L168.0 75.0 L170.0 76.0 L172.0 76.9 L174.0 77.8 L176.0 78.6 L178.0 79.3 L180.0 80.0M180.0 80.0 L210.0 70.0 L240.0 60.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"120.0\" cy=\"100.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"180.0\" cy=\"80.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.4CB11B":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V160\"/><path d=\"M0 40H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-5</text><text x=\"20\" y=\"51\">-4</text><text x=\"40\" y=\"51\">-3</text><text x=\"60\" y=\"51\">-2</text><text x=\"80\" y=\"51\">-1</text><text x=\"120\" y=\"51\">1</text><text x=\"140\" y=\"51\">2</text><text x=\"160\" y=\"51\">3</text><text x=\"180\" y=\"51\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"163\">-6</text><text x=\"97\" y=\"143\">-5</text><text x=\"97\" y=\"123\">-4</text><text x=\"97\" y=\"103\">-3</text><text x=\"97\" y=\"83\">-2</text><text x=\"97\" y=\"63\">-1</text><text x=\"97\" y=\"23\">1</text><text x=\"97\" y=\"3\">2</text></g><path d=\"M0.0 116.0 L2.0 115.9 L4.0 115.8 L6.0 115.7 L8.0 115.7 L10.0 115.6 L12.0 115.5 L14.0 115.3 L16.0 115.2 L18.0 115.1 L20.0 115.0 L22.0 114.9 L24.0 114.7 L26.0 114.6 L28.0 114.4 L30.0 114.3 L32.0 114.1 L34.0 113.9 L36.0 113.8 L38.0 113.5 L40.0 113.3 L42.0 113.1 L44.0 112.9 L46.0 112.6 L48.0 112.3 L50.0 112.0 L52.0 111.7 L54.0 111.3 L56.0 110.9 L58.0 110.5 L60.0 110.0 L62.0 109.5 L64.0 108.9 L66.0 108.2 L68.0 107.5 L70.0 106.7 L72.0 105.7 L74.0 104.6 L76.0 103.3 L78.0 101.8 L80.0 100.0M80.0 100.0 L82.0 97.8 L84.0 95.0 L86.0 91.4 L88.0 86.7 L90.0 80.0 L92.0 70.0 L94.0 53.3 L96.0 20.0M108.0 170.0 L110.0 160.0 L112.0 153.3 L114.0 148.6 L116.0 145.0 L118.0 142.2 L120.0 140.0 L122.0 138.2 L124.0 136.7 L126.0 135.4 L128.0 134.3 L130.0 133.3 L132.0 132.5 L134.0 131.8 L136.0 131.1 L138.0 130.5 L140.0 130.0 L142.0 129.5 L144.0 129.1 L146.0 128.7 L148.0 128.3 L150.0 128.0 L152.0 127.7 L154.0 127.4 L156.0 127.1 L158.0 126.9 L160.0 126.7 L162.0 126.5 L164.0 126.2 L166.0 126.1 L168.0 125.9 L170.0 125.7 L172.0 125.6 L174.0 125.4 L176.0 125.3 L178.0 125.1 L180.0 125.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"100.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.F3131F":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 204\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"180\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V180\"/><path d=\"M20 0V180\"/><path d=\"M40 0V180\"/><path d=\"M60 0V180\"/><path d=\"M80 0V180\"/><path d=\"M100 0V180\"/><path d=\"M120 0V180\"/><path d=\"M140 0V180\"/><path d=\"M160 0V180\"/><path d=\"M180 0V180\"/><path d=\"M0 180 H180\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M120 0V180\"/><path d=\"M0 140H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"151\">-6</text><text x=\"20\" y=\"151\">-5</text><text x=\"40\" y=\"151\">-4</text><text x=\"60\" y=\"151\">-3</text><text x=\"80\" y=\"151\">-2</text><text x=\"100\" y=\"151\">-1</text><text x=\"140\" y=\"151\">1</text><text x=\"160\" y=\"151\">2</text><text x=\"180\" y=\"151\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"117\" y=\"183\">-2</text><text x=\"117\" y=\"163\">-1</text><text x=\"117\" y=\"123\">1</text><text x=\"117\" y=\"103\">2</text><text x=\"117\" y=\"83\">3</text><text x=\"117\" y=\"63\">4</text><text x=\"117\" y=\"43\">5</text><text x=\"117\" y=\"23\">6</text><text x=\"117\" y=\"3\">7</text></g><path d=\"M60.0 60.0 L62.0 56.2 L64.0 52.8 L66.0 49.8 L68.0 47.2 L70.0 45.0 L72.0 43.2 L74.0 41.8 L76.0 40.8 L78.0 40.2 L80.0 40.0 L82.0 40.2 L84.0 40.8 L86.0 41.8 L88.0 43.2 L90.0 45.0 L92.0 47.2 L94.0 49.8 L96.0 52.8 L98.0 56.2 L100.0 60.0 L102.0 64.2 L104.0 68.8 L106.0 73.8 L108.0 79.2 L110.0 85.0 L112.0 91.2 L114.0 97.8 L116.0 104.8 L118.0 112.2 L120.0 120.0 L122.0 128.2 L124.0 136.8 L126.0 145.8 L128.0 155.2 L130.0 165.0 L132.0 175.2 L134.0 185.8M0.0 60.0 L30.0 90.0 L60.0 120.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"120.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"60.0\" cy=\"60.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.02F213":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M120 0V160\"/><path d=\"M0 40H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-6</text><text x=\"20\" y=\"51\">-5</text><text x=\"40\" y=\"51\">-4</text><text x=\"60\" y=\"51\">-3</text><text x=\"80\" y=\"51\">-2</text><text x=\"100\" y=\"51\">-1</text><text x=\"140\" y=\"51\">1</text><text x=\"160\" y=\"51\">2</text><text x=\"180\" y=\"51\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"117\" y=\"163\">-6</text><text x=\"117\" y=\"143\">-5</text><text x=\"117\" y=\"123\">-4</text><text x=\"117\" y=\"103\">-3</text><text x=\"117\" y=\"83\">-2</text><text x=\"117\" y=\"63\">-1</text><text x=\"117\" y=\"23\">1</text><text x=\"117\" y=\"3\">2</text></g><path d=\"M24.0 -4.8 L26.0 2.2 L28.0 8.8 L30.0 15.0 L32.0 20.8 L34.0 26.2 L36.0 31.2 L38.0 35.8 L40.0 40.0 L42.0 43.8 L44.0 47.2 L46.0 50.2 L48.0 52.8 L50.0 55.0 L52.0 56.8 L54.0 58.2 L56.0 59.2 L58.0 59.8 L60.0 60.0 L62.0 59.8 L64.0 59.2 L66.0 58.2 L68.0 56.8 L70.0 55.0 L72.0 52.8 L74.0 50.2 L76.0 47.2 L78.0 43.8 L80.0 40.0M80.0 40.0 L82.0 47.8 L84.0 55.2 L86.0 62.2 L88.0 68.8 L90.0 75.0 L92.0 80.8 L94.0 86.2 L96.0 91.2 L98.0 95.8 L100.0 100.0 L102.0 103.8 L104.0 107.2 L106.0 110.2 L108.0 112.8 L110.0 115.0 L112.0 116.8 L114.0 118.2 L116.0 119.2 L118.0 119.8 L120.0 120.0 L122.0 119.8 L124.0 119.2 L126.0 118.2 L128.0 116.8 L130.0 115.0 L132.0 112.8 L134.0 110.2 L136.0 107.2 L138.0 103.8 L140.0 100.0 L142.0 95.8 L144.0 91.2 L146.0 86.2 L148.0 80.8 L150.0 75.0 L152.0 68.8 L154.0 62.2 L156.0 55.2 L158.0 47.8 L160.0 40.0 L162.0 31.8 L164.0 23.2 L166.0 14.2 L168.0 4.8 L170.0 -5.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"40.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.D69F19":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 308 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:308px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"280\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M220 0V160\"/><path d=\"M240 0V160\"/><path d=\"M260 0V160\"/><path d=\"M280 0V160\"/><path d=\"M0 160 H280\"/><path d=\"M0 140 H280\"/><path d=\"M0 120 H280\"/><path d=\"M0 100 H280\"/><path d=\"M0 80 H280\"/><path d=\"M0 60 H280\"/><path d=\"M0 40 H280\"/><path d=\"M0 20 H280\"/><path d=\"M0 0 H280\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M140 0V160\"/><path d=\"M0 100H280\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"111\">-7</text><text x=\"20\" y=\"111\">-6</text><text x=\"40\" y=\"111\">-5</text><text x=\"60\" y=\"111\">-4</text><text x=\"80\" y=\"111\">-3</text><text x=\"100\" y=\"111\">-2</text><text x=\"120\" y=\"111\">-1</text><text x=\"160\" y=\"111\">1</text><text x=\"180\" y=\"111\">2</text><text x=\"200\" y=\"111\">3</text><text x=\"220\" y=\"111\">4</text><text x=\"240\" y=\"111\">5</text><text x=\"260\" y=\"111\">6</text><text x=\"280\" y=\"111\">7</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"137\" y=\"163\">-3</text><text x=\"137\" y=\"143\">-2</text><text x=\"137\" y=\"123\">-1</text><text x=\"137\" y=\"83\">1</text><text x=\"137\" y=\"63\">2</text><text x=\"137\" y=\"43\">3</text><text x=\"137\" y=\"23\">4</text><text x=\"137\" y=\"3\">5</text></g><path d=\"M0.0 111.4 L2.0 111.6 L4.0 111.8 L6.0 111.9 L8.0 112.1 L10.0 112.3 L12.0 112.5 L14.0 112.7 L16.0 112.9 L18.0 113.1 L20.0 113.3 L22.0 113.6 L24.0 113.8 L26.0 114.0 L28.0 114.3 L30.0 114.5 L32.0 114.8 L34.0 115.1 L36.0 115.4 L38.0 115.7 L40.0 116.0 L42.0 116.3 L44.0 116.7 L46.0 117.0 L48.0 117.4 L50.0 117.8 L52.0 118.2 L54.0 118.6 L56.0 119.0 L58.0 119.5 L60.0 120.0M60.0 120.0 L100.0 110.0 L140.0 100.0M156.0 0.0 L158.0 11.1 L160.0 20.0 L162.0 27.3 L164.0 33.3 L166.0 38.5 L168.0 42.9 L170.0 46.7 L172.0 50.0 L174.0 52.9 L176.0 55.6 L178.0 57.9 L180.0 60.0 L182.0 61.9 L184.0 63.6 L186.0 65.2 L188.0 66.7 L190.0 68.0 L192.0 69.2 L194.0 70.4 L196.0 71.4 L198.0 72.4 L200.0 73.3 L202.0 74.2 L204.0 75.0 L206.0 75.8 L208.0 76.5 L210.0 77.1 L212.0 77.8 L214.0 78.4 L216.0 78.9 L218.0 79.5 L220.0 80.0M220.0 80.0 L250.0 72.5 L280.0 65.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"140.0\" cy=\"100.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"220.0\" cy=\"80.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.929B17":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V160\"/><path d=\"M0 80H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"91\">-4</text><text x=\"20\" y=\"91\">-3</text><text x=\"40\" y=\"91\">-2</text><text x=\"60\" y=\"91\">-1</text><text x=\"100\" y=\"91\">1</text><text x=\"120\" y=\"91\">2</text><text x=\"140\" y=\"91\">3</text><text x=\"160\" y=\"91\">4</text><text x=\"180\" y=\"91\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"163\">-4</text><text x=\"77\" y=\"143\">-3</text><text x=\"77\" y=\"123\">-2</text><text x=\"77\" y=\"103\">-1</text><text x=\"77\" y=\"63\">1</text><text x=\"77\" y=\"43\">2</text><text x=\"77\" y=\"23\">3</text><text x=\"77\" y=\"3\">4</text></g><path d=\"M40.0 165.0 L42.0 157.2 L44.0 149.8 L46.0 142.8 L48.0 136.2 L50.0 130.0 L52.0 124.2 L54.0 118.8 L56.0 113.8 L58.0 109.2 L60.0 105.0 L62.0 101.2 L64.0 97.8 L66.0 94.8 L68.0 92.2 L70.0 90.0 L72.0 88.2 L74.0 86.8 L76.0 85.8 L78.0 85.2 L80.0 85.0 L82.0 85.2 L84.0 85.8 L86.0 86.8 L88.0 88.2 L90.0 90.0 L92.0 92.2 L94.0 94.8 L96.0 97.8 L98.0 101.2 L100.0 105.0M100.0 105.0 L102.0 109.2 L104.0 113.8 L106.0 118.8 L108.0 124.2 L110.0 130.0 L112.0 136.2 L114.0 142.8 L116.0 149.8 L118.0 157.2 L120.0 165.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"105.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.E23414":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 228 204\" role=\"img\" aria-label=\"График функции\" style=\"max-width:228px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"200\" height=\"180\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V180\"/><path d=\"M20 0V180\"/><path d=\"M40 0V180\"/><path d=\"M60 0V180\"/><path d=\"M80 0V180\"/><path d=\"M100 0V180\"/><path d=\"M120 0V180\"/><path d=\"M140 0V180\"/><path d=\"M160 0V180\"/><path d=\"M180 0V180\"/><path d=\"M200 0V180\"/><path d=\"M0 180 H200\"/><path d=\"M0 160 H200\"/><path d=\"M0 140 H200\"/><path d=\"M0 120 H200\"/><path d=\"M0 100 H200\"/><path d=\"M0 80 H200\"/><path d=\"M0 60 H200\"/><path d=\"M0 40 H200\"/><path d=\"M0 20 H200\"/><path d=\"M0 0 H200\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V180\"/><path d=\"M0 120H200\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-3</text><text x=\"20\" y=\"131\">-2</text><text x=\"40\" y=\"131\">-1</text><text x=\"80\" y=\"131\">1</text><text x=\"100\" y=\"131\">2</text><text x=\"120\" y=\"131\">3</text><text x=\"140\" y=\"131\">4</text><text x=\"160\" y=\"131\">5</text><text x=\"180\" y=\"131\">6</text><text x=\"200\" y=\"131\">7</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"183\">-3</text><text x=\"57\" y=\"163\">-2</text><text x=\"57\" y=\"143\">-1</text><text x=\"57\" y=\"103\">1</text><text x=\"57\" y=\"83\">2</text><text x=\"57\" y=\"63\">3</text><text x=\"57\" y=\"43\">4</text><text x=\"57\" y=\"23\">5</text><text x=\"57\" y=\"3\">6</text></g><path d=\"M60.0 160.0 L120.0 40.0M120.0 40.0 L130.0 70.0 L140.0 100.0M140.0 140.0 L170.0 95.0 L200.0 50.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"120.0\" cy=\"40.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"140.0\" cy=\"140.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"140.0\" cy=\"100.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.E88E19":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 248 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:248px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"220\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M220 0V160\"/><path d=\"M0 160 H220\"/><path d=\"M0 140 H220\"/><path d=\"M0 120 H220\"/><path d=\"M0 100 H220\"/><path d=\"M0 80 H220\"/><path d=\"M0 60 H220\"/><path d=\"M0 40 H220\"/><path d=\"M0 20 H220\"/><path d=\"M0 0 H220\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V160\"/><path d=\"M0 120H220\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-3</text><text x=\"20\" y=\"131\">-2</text><text x=\"40\" y=\"131\">-1</text><text x=\"80\" y=\"131\">1</text><text x=\"100\" y=\"131\">2</text><text x=\"120\" y=\"131\">3</text><text x=\"140\" y=\"131\">4</text><text x=\"160\" y=\"131\">5</text><text x=\"180\" y=\"131\">6</text><text x=\"200\" y=\"131\">7</text><text x=\"220\" y=\"131\">8</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"163\">-2</text><text x=\"57\" y=\"143\">-1</text><text x=\"57\" y=\"103\">1</text><text x=\"57\" y=\"83\">2</text><text x=\"57\" y=\"63\">3</text><text x=\"57\" y=\"43\">4</text><text x=\"57\" y=\"23\">5</text><text x=\"57\" y=\"3\">6</text></g><path d=\"M120.0 120.0 L122.0 112.2 L124.0 104.8 L126.0 97.8 L128.0 91.2 L130.0 85.0 L132.0 79.2 L134.0 73.8 L136.0 68.8 L138.0 64.2 L140.0 60.0 L142.0 56.2 L144.0 52.8 L146.0 49.8 L148.0 47.2 L150.0 45.0 L152.0 43.2 L154.0 41.8 L156.0 40.8 L158.0 40.2 L160.0 40.0 L162.0 40.2 L164.0 40.8 L166.0 41.8 L168.0 43.2 L170.0 45.0 L172.0 47.2 L174.0 49.8 L176.0 52.8 L178.0 56.2 L180.0 60.0 L182.0 64.2 L184.0 68.8 L186.0 73.8 L188.0 79.2 L190.0 85.0 L192.0 91.2 L194.0 97.8 L196.0 104.8 L198.0 112.2 L200.0 120.0 L202.0 128.2 L204.0 136.8 L206.0 145.8 L208.0 155.2 L210.0 165.0M60.0 20.0 L120.0 80.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"120.0\" cy=\"80.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"120.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.6DF71A":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 268 284\" role=\"img\" aria-label=\"График функции\" style=\"max-width:268px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"240\" height=\"260\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V260\"/><path d=\"M20 0V260\"/><path d=\"M40 0V260\"/><path d=\"M60 0V260\"/><path d=\"M80 0V260\"/><path d=\"M100 0V260\"/><path d=\"M120 0V260\"/><path d=\"M140 0V260\"/><path d=\"M160 0V260\"/><path d=\"M180 0V260\"/><path d=\"M200 0V260\"/><path d=\"M220 0V260\"/><path d=\"M240 0V260\"/><path d=\"M0 260 H240\"/><path d=\"M0 240 H240\"/><path d=\"M0 220 H240\"/><path d=\"M0 200 H240\"/><path d=\"M0 180 H240\"/><path d=\"M0 160 H240\"/><path d=\"M0 140 H240\"/><path d=\"M0 120 H240\"/><path d=\"M0 100 H240\"/><path d=\"M0 80 H240\"/><path d=\"M0 60 H240\"/><path d=\"M0 40 H240\"/><path d=\"M0 20 H240\"/><path d=\"M0 0 H240\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V260\"/><path d=\"M0 220H240\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"231\">-3</text><text x=\"20\" y=\"231\">-2</text><text x=\"40\" y=\"231\">-1</text><text x=\"80\" y=\"231\">1</text><text x=\"100\" y=\"231\">2</text><text x=\"120\" y=\"231\">3</text><text x=\"140\" y=\"231\">4</text><text x=\"160\" y=\"231\">5</text><text x=\"180\" y=\"231\">6</text><text x=\"200\" y=\"231\">7</text><text x=\"220\" y=\"231\">8</text><text x=\"240\" y=\"231\">9</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"263\">-2</text><text x=\"57\" y=\"243\">-1</text><text x=\"57\" y=\"203\">1</text><text x=\"57\" y=\"183\">2</text><text x=\"57\" y=\"163\">3</text><text x=\"57\" y=\"143\">4</text><text x=\"57\" y=\"123\">5</text><text x=\"57\" y=\"103\">6</text><text x=\"57\" y=\"83\">7</text><text x=\"57\" y=\"63\">8</text><text x=\"57\" y=\"43\">9</text><text x=\"57\" y=\"23\">10</text><text x=\"57\" y=\"3\">11</text></g><path d=\"M30.0 265.0 L32.0 255.2 L34.0 245.8 L36.0 236.8 L38.0 228.2 L40.0 220.0 L42.0 212.2 L44.0 204.8 L46.0 197.8 L48.0 191.2 L50.0 185.0 L52.0 179.2 L54.0 173.8 L56.0 168.8 L58.0 164.2 L60.0 160.0 L62.0 156.2 L64.0 152.8 L66.0 149.8 L68.0 147.2 L70.0 145.0 L72.0 143.2 L74.0 141.8 L76.0 140.8 L78.0 140.2 L80.0 140.0 L82.0 140.2 L84.0 140.8 L86.0 141.8 L88.0 143.2 L90.0 145.0 L92.0 147.2 L94.0 149.8 L96.0 152.8 L98.0 156.2 L100.0 160.0 L102.0 164.2 L104.0 168.8 L106.0 173.8 L108.0 179.2 L110.0 185.0 L112.0 191.2 L114.0 197.8 L116.0 204.8 L118.0 212.2 L120.0 220.0M120.0 220.0 L122.0 208.2 L124.0 196.8 L126.0 185.8 L128.0 175.2 L130.0 165.0 L132.0 155.2 L134.0 145.8 L136.0 136.8 L138.0 128.2 L140.0 120.0 L142.0 112.2 L144.0 104.8 L146.0 97.8 L148.0 91.2 L150.0 85.0 L152.0 79.2 L154.0 73.8 L156.0 68.8 L158.0 64.2 L160.0 60.0 L162.0 56.2 L164.0 52.8 L166.0 49.8 L168.0 47.2 L170.0 45.0 L172.0 43.2 L174.0 41.8 L176.0 40.8 L178.0 40.2 L180.0 40.0 L182.0 40.2 L184.0 40.8 L186.0 41.8 L188.0 43.2 L190.0 45.0 L192.0 47.2 L194.0 49.8 L196.0 52.8 L198.0 56.2 L200.0 60.0 L202.0 64.2 L204.0 68.8 L206.0 73.8 L208.0 79.2 L210.0 85.0 L212.0 91.2 L214.0 97.8 L216.0 104.8 L218.0 112.2 L220.0 120.0 L222.0 128.2 L224.0 136.8 L226.0 145.8 L228.0 155.2 L230.0 165.0 L232.0 175.2 L234.0 185.8 L236.0 196.8 L238.0 208.2 L240.0 220.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"120.0\" cy=\"220.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.396E17":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 228 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:228px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"200\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M0 160 H200\"/><path d=\"M0 140 H200\"/><path d=\"M0 120 H200\"/><path d=\"M0 100 H200\"/><path d=\"M0 80 H200\"/><path d=\"M0 60 H200\"/><path d=\"M0 40 H200\"/><path d=\"M0 20 H200\"/><path d=\"M0 0 H200\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V160\"/><path d=\"M0 80H200\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"91\">-3</text><text x=\"20\" y=\"91\">-2</text><text x=\"40\" y=\"91\">-1</text><text x=\"80\" y=\"91\">1</text><text x=\"100\" y=\"91\">2</text><text x=\"120\" y=\"91\">3</text><text x=\"140\" y=\"91\">4</text><text x=\"160\" y=\"91\">5</text><text x=\"180\" y=\"91\">6</text><text x=\"200\" y=\"91\">7</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"163\">-4</text><text x=\"57\" y=\"143\">-3</text><text x=\"57\" y=\"123\">-2</text><text x=\"57\" y=\"103\">-1</text><text x=\"57\" y=\"63\">1</text><text x=\"57\" y=\"43\">2</text><text x=\"57\" y=\"23\">3</text><text x=\"57\" y=\"3\">4</text></g><path d=\"M0.0 93.3 L2.0 93.1 L4.0 92.9 L6.0 92.6 L8.0 92.3 L10.0 92.0 L12.0 91.7 L14.0 91.3 L16.0 90.9 L18.0 90.5 L20.0 90.0 L22.0 89.5 L24.0 88.9 L26.0 88.2 L28.0 87.5 L30.0 86.7 L32.0 85.7 L34.0 84.6 L36.0 83.3 L38.0 81.8 L40.0 80.0 L42.0 77.8 L44.0 75.0 L46.0 71.4 L48.0 66.7 L50.0 60.0 L52.0 50.0 L54.0 33.3 L56.0 0.0M66.0 166.7 L68.0 150.0 L70.0 140.0 L72.0 133.3 L74.0 128.6 L76.0 125.0 L78.0 122.2 L80.0 120.0 L82.0 118.2 L84.0 116.7 L86.0 115.4 L88.0 114.3 L90.0 113.3 L92.0 112.5 L94.0 111.8 L96.0 111.1 L98.0 110.5 L100.0 110.0 L102.0 109.5 L104.0 109.1 L106.0 108.7 L108.0 108.3 L110.0 108.0 L112.0 107.7 L114.0 107.4 L116.0 107.1 L118.0 106.9 L120.0 106.7 L122.0 106.5 L124.0 106.2 L126.0 106.1 L128.0 105.9 L130.0 105.7 L132.0 105.6 L134.0 105.4 L136.0 105.3 L138.0 105.1 L140.0 105.0M140.0 105.0 L142.0 104.9 L144.0 104.8 L146.0 104.7 L148.0 104.5 L150.0 104.4 L152.0 104.3 L154.0 104.3 L156.0 104.2 L158.0 104.1 L160.0 104.0 L162.0 103.9 L164.0 103.8 L166.0 103.8 L168.0 103.7 L170.0 103.6 L172.0 103.6 L174.0 103.5 L176.0 103.4 L178.0 103.4 L180.0 103.3 L182.0 103.3 L184.0 103.2 L186.0 103.2 L188.0 103.1 L190.0 103.1 L192.0 103.0 L194.0 103.0 L196.0 102.9 L198.0 102.9 L200.0 102.9\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"140.0\" cy=\"105.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.41D023":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V160\"/><path d=\"M0 80H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"91\">-3</text><text x=\"20\" y=\"91\">-2</text><text x=\"40\" y=\"91\">-1</text><text x=\"80\" y=\"91\">1</text><text x=\"100\" y=\"91\">2</text><text x=\"120\" y=\"91\">3</text><text x=\"140\" y=\"91\">4</text><text x=\"160\" y=\"91\">5</text><text x=\"180\" y=\"91\">6</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"163\">-4</text><text x=\"57\" y=\"143\">-3</text><text x=\"57\" y=\"123\">-2</text><text x=\"57\" y=\"103\">-1</text><text x=\"57\" y=\"63\">1</text><text x=\"57\" y=\"43\">2</text><text x=\"57\" y=\"23\">3</text><text x=\"57\" y=\"3\">4</text></g><path d=\"M50.0 140.0 L100.0 90.0M100.0 90.0 L110.0 100.0 L120.0 110.0M120.0 120.0 L150.0 90.0 L180.0 60.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"90.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"120.0\" cy=\"120.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"120.0\" cy=\"110.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.0DC82F":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 204\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"180\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V180\"/><path d=\"M20 0V180\"/><path d=\"M40 0V180\"/><path d=\"M60 0V180\"/><path d=\"M80 0V180\"/><path d=\"M100 0V180\"/><path d=\"M120 0V180\"/><path d=\"M140 0V180\"/><path d=\"M160 0V180\"/><path d=\"M180 0V180\"/><path d=\"M0 180 H180\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V180\"/><path d=\"M0 80H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"91\">-3</text><text x=\"20\" y=\"91\">-2</text><text x=\"40\" y=\"91\">-1</text><text x=\"80\" y=\"91\">1</text><text x=\"100\" y=\"91\">2</text><text x=\"120\" y=\"91\">3</text><text x=\"140\" y=\"91\">4</text><text x=\"160\" y=\"91\">5</text><text x=\"180\" y=\"91\">6</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"183\">-5</text><text x=\"57\" y=\"163\">-4</text><text x=\"57\" y=\"143\">-3</text><text x=\"57\" y=\"123\">-2</text><text x=\"57\" y=\"103\">-1</text><text x=\"57\" y=\"63\">1</text><text x=\"57\" y=\"43\">2</text><text x=\"57\" y=\"23\">3</text><text x=\"57\" y=\"3\">4</text></g><path d=\"M50.0 175.0 L100.0 50.0M100.0 50.0 L110.0 80.0 L120.0 110.0M120.0 140.0 L150.0 110.0 L180.0 80.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"50.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"120.0\" cy=\"140.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"120.0\" cy=\"110.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.03E125":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 228 264\" role=\"img\" aria-label=\"График функции\" style=\"max-width:228px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"200\" height=\"240\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V240\"/><path d=\"M20 0V240\"/><path d=\"M40 0V240\"/><path d=\"M60 0V240\"/><path d=\"M80 0V240\"/><path d=\"M100 0V240\"/><path d=\"M120 0V240\"/><path d=\"M140 0V240\"/><path d=\"M160 0V240\"/><path d=\"M180 0V240\"/><path d=\"M200 0V240\"/><path d=\"M0 240 H200\"/><path d=\"M0 220 H200\"/><path d=\"M0 200 H200\"/><path d=\"M0 180 H200\"/><path d=\"M0 160 H200\"/><path d=\"M0 140 H200\"/><path d=\"M0 120 H200\"/><path d=\"M0 100 H200\"/><path d=\"M0 80 H200\"/><path d=\"M0 60 H200\"/><path d=\"M0 40 H200\"/><path d=\"M0 20 H200\"/><path d=\"M0 0 H200\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V240\"/><path d=\"M0 100H200\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"111\">-3</text><text x=\"20\" y=\"111\">-2</text><text x=\"40\" y=\"111\">-1</text><text x=\"80\" y=\"111\">1</text><text x=\"100\" y=\"111\">2</text><text x=\"120\" y=\"111\">3</text><text x=\"140\" y=\"111\">4</text><text x=\"160\" y=\"111\">5</text><text x=\"180\" y=\"111\">6</text><text x=\"200\" y=\"111\">7</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"243\">-7</text><text x=\"57\" y=\"223\">-6</text><text x=\"57\" y=\"203\">-5</text><text x=\"57\" y=\"183\">-4</text><text x=\"57\" y=\"163\">-3</text><text x=\"57\" y=\"143\">-2</text><text x=\"57\" y=\"123\">-1</text><text x=\"57\" y=\"83\">1</text><text x=\"57\" y=\"63\">2</text><text x=\"57\" y=\"43\">3</text><text x=\"57\" y=\"23\">4</text><text x=\"57\" y=\"3\">5</text></g><path d=\"M80.0 50.0 L110.0 125.0 L140.0 200.0M140.0 200.0 L170.0 170.0 L200.0 140.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"120.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"80.0\" cy=\"50.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"140.0\" cy=\"200.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.70822B":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V160\"/><path d=\"M0 120H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-3</text><text x=\"20\" y=\"131\">-2</text><text x=\"40\" y=\"131\">-1</text><text x=\"80\" y=\"131\">1</text><text x=\"100\" y=\"131\">2</text><text x=\"120\" y=\"131\">3</text><text x=\"140\" y=\"131\">4</text><text x=\"160\" y=\"131\">5</text><text x=\"180\" y=\"131\">6</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"163\">-2</text><text x=\"57\" y=\"143\">-1</text><text x=\"57\" y=\"103\">1</text><text x=\"57\" y=\"83\">2</text><text x=\"57\" y=\"63\">3</text><text x=\"57\" y=\"43\">4</text><text x=\"57\" y=\"23\">5</text><text x=\"57\" y=\"3\">6</text></g><path d=\"M0.0 126.7 L2.0 126.9 L4.0 127.1 L6.0 127.4 L8.0 127.7 L10.0 128.0 L12.0 128.3 L14.0 128.7 L16.0 129.1 L18.0 129.5 L20.0 130.0 L22.0 130.5 L24.0 131.1 L26.0 131.8 L28.0 132.5 L30.0 133.3 L32.0 134.3 L34.0 135.4 L36.0 136.7 L38.0 138.2 L40.0 140.0 L42.0 142.2 L44.0 145.0 L46.0 148.6 L48.0 153.3 L50.0 160.0M64.0 20.0 L66.0 53.3 L68.0 70.0 L70.0 80.0 L72.0 86.7 L74.0 91.4 L76.0 95.0 L78.0 97.8 L80.0 100.0 L82.0 101.8 L84.0 103.3 L86.0 104.6 L88.0 105.7 L90.0 106.7 L92.0 107.5 L94.0 108.2 L96.0 108.9 L98.0 109.5 L100.0 110.0 L102.0 110.5 L104.0 110.9 L106.0 111.3 L108.0 111.7 L110.0 112.0 L112.0 112.3 L114.0 112.6 L116.0 112.9 L118.0 113.1 L120.0 113.3M120.0 113.3 L122.0 113.5 L124.0 113.8 L126.0 113.9 L128.0 114.1 L130.0 114.3 L132.0 114.4 L134.0 114.6 L136.0 114.7 L138.0 114.9 L140.0 115.0 L142.0 115.1 L144.0 115.2 L146.0 115.3 L148.0 115.5 L150.0 115.6 L152.0 115.7 L154.0 115.7 L156.0 115.8 L158.0 115.9 L160.0 116.0 L162.0 116.1 L164.0 116.2 L166.0 116.2 L168.0 116.3 L170.0 116.4 L172.0 116.4 L174.0 116.5 L176.0 116.6 L178.0 116.6 L180.0 116.7\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"120.0\" cy=\"113.3\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.2C1121":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V160\"/><path d=\"M0 60H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"71\">-5</text><text x=\"20\" y=\"71\">-4</text><text x=\"40\" y=\"71\">-3</text><text x=\"60\" y=\"71\">-2</text><text x=\"80\" y=\"71\">-1</text><text x=\"120\" y=\"71\">1</text><text x=\"140\" y=\"71\">2</text><text x=\"160\" y=\"71\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"163\">-5</text><text x=\"97\" y=\"143\">-4</text><text x=\"97\" y=\"123\">-3</text><text x=\"97\" y=\"103\">-2</text><text x=\"97\" y=\"83\">-1</text><text x=\"97\" y=\"43\">1</text><text x=\"97\" y=\"23\">2</text><text x=\"97\" y=\"3\">3</text></g><path d=\"M46.0 169.4 L48.0 161.4 L50.0 153.8 L52.0 146.4 L54.0 139.3 L56.0 132.6 L58.0 126.2 L60.0 120.0M60.0 120.0 L62.0 114.1 L64.0 108.6 L66.0 103.3 L68.0 98.4 L70.0 93.8 L72.0 89.4 L74.0 85.3 L76.0 81.6 L78.0 78.2 L80.0 75.0 L82.0 72.2 L84.0 69.6 L86.0 67.3 L88.0 65.4 L90.0 63.8 L92.0 62.4 L94.0 61.3 L96.0 60.6 L98.0 60.1 L100.0 60.0M100.0 60.0 L102.0 59.9 L104.0 59.4 L106.0 58.7 L108.0 57.6 L110.0 56.2 L112.0 54.6 L114.0 52.7 L116.0 50.4 L118.0 47.9 L120.0 45.0 L122.0 41.8 L124.0 38.4 L126.0 34.6 L128.0 30.6 L130.0 26.2 L132.0 21.6 L134.0 16.7 L136.0 11.4 L138.0 5.8 L140.0 0.0 L142.0 -6.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"120.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"100.0\" cy=\"60.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.DE232E":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V160\"/><path d=\"M0 120H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-4</text><text x=\"20\" y=\"131\">-3</text><text x=\"40\" y=\"131\">-2</text><text x=\"60\" y=\"131\">-1</text><text x=\"100\" y=\"131\">1</text><text x=\"120\" y=\"131\">2</text><text x=\"140\" y=\"131\">3</text><text x=\"160\" y=\"131\">4</text><text x=\"180\" y=\"131\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"163\">-2</text><text x=\"77\" y=\"143\">-1</text><text x=\"77\" y=\"103\">1</text><text x=\"77\" y=\"83\">2</text><text x=\"77\" y=\"63\">3</text><text x=\"77\" y=\"43\">4</text><text x=\"77\" y=\"23\">5</text><text x=\"77\" y=\"3\">6</text></g><path d=\"M0.0 125.0 L2.0 125.1 L4.0 125.3 L6.0 125.4 L8.0 125.6 L10.0 125.7 L12.0 125.9 L14.0 126.1 L16.0 126.2 L18.0 126.5 L20.0 126.7 L22.0 126.9 L24.0 127.1 L26.0 127.4 L28.0 127.7 L30.0 128.0 L32.0 128.3 L34.0 128.7 L36.0 129.1 L38.0 129.5 L40.0 130.0 L42.0 130.5 L44.0 131.1 L46.0 131.8 L48.0 132.5 L50.0 133.3 L52.0 134.3 L54.0 135.4 L56.0 136.7 L58.0 138.2 L60.0 140.0 L62.0 142.2 L64.0 145.0 L66.0 148.6 L68.0 153.3 L70.0 160.0M84.1 22.0 L86.1 54.7 L88.2 71.0 L90.2 80.8 L92.2 87.3 L94.3 92.0 L96.3 95.5 L98.4 98.2 L100.4 100.4 L102.4 102.2 L104.5 103.7 L106.5 104.9 L108.6 106.0M108.6 106.0 L110.6 106.9 L112.7 107.8 L114.7 108.5 L116.7 109.1 L118.8 109.7 L120.8 110.2 L122.9 110.7 L124.9 111.1 L126.9 111.5 L129.0 111.8 L131.0 112.2 L133.1 112.5 L135.1 112.7 L137.1 113.0 L139.2 113.2 L141.2 113.5 L143.3 113.7 L145.3 113.9 L147.3 114.1 L149.4 114.2 L151.4 114.4 L153.5 114.6 L155.5 114.7 L157.6 114.8 L159.6 115.0 L161.6 115.1 L163.7 115.2 L165.7 115.3 L167.8 115.4 L169.8 115.5 L171.8 115.6 L173.9 115.7 L175.9 115.8 L178.0 115.9 L180.0 116.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"108.6\" cy=\"106.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.C16D27":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M120 0V160\"/><path d=\"M0 80H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"91\">-6</text><text x=\"20\" y=\"91\">-5</text><text x=\"40\" y=\"91\">-4</text><text x=\"60\" y=\"91\">-3</text><text x=\"80\" y=\"91\">-2</text><text x=\"100\" y=\"91\">-1</text><text x=\"140\" y=\"91\">1</text><text x=\"160\" y=\"91\">2</text><text x=\"180\" y=\"91\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"117\" y=\"163\">-4</text><text x=\"117\" y=\"143\">-3</text><text x=\"117\" y=\"123\">-2</text><text x=\"117\" y=\"103\">-1</text><text x=\"117\" y=\"63\">1</text><text x=\"117\" y=\"43\">2</text><text x=\"117\" y=\"23\">3</text><text x=\"117\" y=\"3\">4</text></g><path d=\"M60.0 120.0 L62.0 112.2 L64.0 104.8 L66.0 97.8 L68.0 91.2 L70.0 85.0 L72.0 79.2 L74.0 73.8 L76.0 68.8 L78.0 64.2 L80.0 60.0 L82.0 56.2 L84.0 52.8 L86.0 49.8 L88.0 47.2 L90.0 45.0 L92.0 43.2 L94.0 41.8 L96.0 40.8 L98.0 40.2 L100.0 40.0 L102.0 40.2 L104.0 40.8 L106.0 41.8 L108.0 43.2 L110.0 45.0 L112.0 47.2 L114.0 49.8 L116.0 52.8 L118.0 56.2 L120.0 60.0 L122.0 64.2 L124.0 68.8 L126.0 73.8 L128.0 79.2 L130.0 85.0 L132.0 91.2 L134.0 97.8 L136.0 104.8 L138.0 112.2 L140.0 120.0 L142.0 128.2 L144.0 136.8 L146.0 145.8 L148.0 155.2 L150.0 165.0M0.0 0.0 L30.0 30.0 L60.0 60.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"60.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"60.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.C1F62D":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 228 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:228px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"200\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M0 160 H200\"/><path d=\"M0 140 H200\"/><path d=\"M0 120 H200\"/><path d=\"M0 100 H200\"/><path d=\"M0 80 H200\"/><path d=\"M0 60 H200\"/><path d=\"M0 40 H200\"/><path d=\"M0 20 H200\"/><path d=\"M0 0 H200\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V160\"/><path d=\"M0 100H200\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"111\">-5</text><text x=\"20\" y=\"111\">-4</text><text x=\"40\" y=\"111\">-3</text><text x=\"60\" y=\"111\">-2</text><text x=\"80\" y=\"111\">-1</text><text x=\"120\" y=\"111\">1</text><text x=\"140\" y=\"111\">2</text><text x=\"160\" y=\"111\">3</text><text x=\"180\" y=\"111\">4</text><text x=\"200\" y=\"111\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"163\">-3</text><text x=\"97\" y=\"143\">-2</text><text x=\"97\" y=\"123\">-1</text><text x=\"97\" y=\"83\">1</text><text x=\"97\" y=\"63\">2</text><text x=\"97\" y=\"43\">3</text><text x=\"97\" y=\"23\">4</text><text x=\"97\" y=\"3\">5</text></g><path d=\"M0.0 108.0 L2.0 108.2 L4.0 108.3 L6.0 108.5 L8.0 108.7 L10.0 108.9 L12.0 109.1 L14.0 109.3 L16.0 109.5 L18.0 109.8 L20.0 110.0 L22.0 110.3 L24.0 110.5 L26.0 110.8 L28.0 111.1 L30.0 111.4 L32.0 111.8 L34.0 112.1 L36.0 112.5 L38.0 112.9 L40.0 113.3 L42.0 113.8 L44.0 114.3 L46.0 114.8 L48.0 115.4 L50.0 116.0 L52.0 116.7 L54.0 117.4 L56.0 118.2 L58.0 119.0 L60.0 120.0M60.0 120.0 L80.0 110.0 L100.0 100.0M108.0 0.0 L110.0 20.0 L112.0 33.3 L114.0 42.9 L116.0 50.0 L118.0 55.6 L120.0 60.0 L122.0 63.6 L124.0 66.7 L126.0 69.2 L128.0 71.4 L130.0 73.3 L132.0 75.0 L134.0 76.5 L136.0 77.8 L138.0 78.9 L140.0 80.0M140.0 80.0 L170.0 65.0 L200.0 50.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"100.0\" cy=\"100.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"140.0\" cy=\"80.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.CC5028":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 248 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:248px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"220\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M220 0V160\"/><path d=\"M0 160 H220\"/><path d=\"M0 140 H220\"/><path d=\"M0 120 H220\"/><path d=\"M0 100 H220\"/><path d=\"M0 80 H220\"/><path d=\"M0 60 H220\"/><path d=\"M0 40 H220\"/><path d=\"M0 20 H220\"/><path d=\"M0 0 H220\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V160\"/><path d=\"M0 120H220\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-3</text><text x=\"20\" y=\"131\">-2</text><text x=\"40\" y=\"131\">-1</text><text x=\"80\" y=\"131\">1</text><text x=\"100\" y=\"131\">2</text><text x=\"120\" y=\"131\">3</text><text x=\"140\" y=\"131\">4</text><text x=\"160\" y=\"131\">5</text><text x=\"180\" y=\"131\">6</text><text x=\"200\" y=\"131\">7</text><text x=\"220\" y=\"131\">8</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"163\">-2</text><text x=\"57\" y=\"143\">-1</text><text x=\"57\" y=\"103\">1</text><text x=\"57\" y=\"83\">2</text><text x=\"57\" y=\"63\">3</text><text x=\"57\" y=\"43\">4</text><text x=\"57\" y=\"23\">5</text><text x=\"57\" y=\"3\">6</text></g><path d=\"M0.0 73.3 L2.0 73.1 L4.0 72.9 L6.0 72.6 L8.0 72.3 L10.0 72.0 L12.0 71.7 L14.0 71.3 L16.0 70.9 L18.0 70.5 L20.0 70.0 L22.0 69.5 L24.0 68.9 L26.0 68.2 L28.0 67.5 L30.0 66.7 L32.0 65.7 L34.0 64.6 L36.0 63.3 L38.0 61.8 L40.0 60.0 L42.0 57.8 L44.0 55.0 L46.0 51.4 L48.0 46.7 L50.0 40.0 L52.0 30.0 L54.0 13.3M66.0 146.7 L68.0 130.0 L70.0 120.0 L72.0 113.3 L74.0 108.6 L76.0 105.0 L78.0 102.2 L80.0 100.0 L82.0 98.2 L84.0 96.7 L86.0 95.4 L88.0 94.3 L90.0 93.3 L92.0 92.5 L94.0 91.8 L96.0 91.1 L98.0 90.5 L100.0 90.0 L102.0 89.5 L104.0 89.1 L106.0 88.7 L108.0 88.3 L110.0 88.0 L112.0 87.7 L114.0 87.4 L116.0 87.1 L118.0 86.9 L120.0 86.7 L122.0 86.5 L124.0 86.2 L126.0 86.1 L128.0 85.9 L130.0 85.7 L132.0 85.6 L134.0 85.4 L136.0 85.3 L138.0 85.1 L140.0 85.0 L142.0 84.9 L144.0 84.8 L146.0 84.7 L148.0 84.5 L150.0 84.4 L152.0 84.3 L154.0 84.3 L156.0 84.2 L158.0 84.1 L160.0 84.0M160.0 84.0 L162.0 83.9 L164.0 83.8 L166.0 83.8 L168.0 83.7 L170.0 83.6 L172.0 83.6 L174.0 83.5 L176.0 83.4 L178.0 83.4 L180.0 83.3 L182.0 83.3 L184.0 83.2 L186.0 83.2 L188.0 83.1 L190.0 83.1 L192.0 83.0 L194.0 83.0 L196.0 82.9 L198.0 82.9 L200.0 82.9 L202.0 82.8 L204.0 82.8 L206.0 82.7 L208.0 82.7 L210.0 82.7 L212.0 82.6 L214.0 82.6 L216.0 82.6 L218.0 82.5 L220.0 82.5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"160.0\" cy=\"84.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.90DE2C":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V160\"/><path d=\"M0 120H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-4</text><text x=\"20\" y=\"131\">-3</text><text x=\"40\" y=\"131\">-2</text><text x=\"60\" y=\"131\">-1</text><text x=\"100\" y=\"131\">1</text><text x=\"120\" y=\"131\">2</text><text x=\"140\" y=\"131\">3</text><text x=\"160\" y=\"131\">4</text><text x=\"180\" y=\"131\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"163\">-2</text><text x=\"77\" y=\"143\">-1</text><text x=\"77\" y=\"103\">1</text><text x=\"77\" y=\"83\">2</text><text x=\"77\" y=\"63\">3</text><text x=\"77\" y=\"43\">4</text><text x=\"77\" y=\"23\">5</text><text x=\"77\" y=\"3\">6</text></g><path d=\"M0.0 125.0 L2.0 125.1 L4.0 125.3 L6.0 125.4 L8.0 125.6 L10.0 125.7 L12.0 125.9 L14.0 126.1 L16.0 126.2 L18.0 126.5 L20.0 126.7 L22.0 126.9 L24.0 127.1 L26.0 127.4 L28.0 127.7 L30.0 128.0 L32.0 128.3 L34.0 128.7 L36.0 129.1 L38.0 129.5 L40.0 130.0 L42.0 130.5 L44.0 131.1 L46.0 131.8 L48.0 132.5 L50.0 133.3 L52.0 134.3 L54.0 135.4 L56.0 136.7 L58.0 138.2 L60.0 140.0 L62.0 142.2 L64.0 145.0 L66.0 148.6 L68.0 153.3 L70.0 160.0M84.0 20.0 L86.0 53.3 L88.0 70.0 L90.0 80.0 L92.0 86.7 L94.0 91.4 L96.0 95.0 L98.0 97.8 L100.0 100.0 L102.0 101.8 L104.0 103.3 L106.0 104.6 L108.0 105.7 L110.0 106.7 L112.0 107.5M112.0 107.5 L114.0 108.2 L116.0 108.9 L118.0 109.5 L120.0 110.0 L122.0 110.5 L124.0 110.9 L126.0 111.3 L128.0 111.7 L130.0 112.0 L132.0 112.3 L134.0 112.6 L136.0 112.9 L138.0 113.1 L140.0 113.3 L142.0 113.5 L144.0 113.8 L146.0 113.9 L148.0 114.1 L150.0 114.3 L152.0 114.4 L154.0 114.6 L156.0 114.7 L158.0 114.9 L160.0 115.0 L162.0 115.1 L164.0 115.2 L166.0 115.3 L168.0 115.5 L170.0 115.6 L172.0 115.7 L174.0 115.7 L176.0 115.8 L178.0 115.9 L180.0 116.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"112.0\" cy=\"107.5\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.693B2F":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 204\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"180\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V180\"/><path d=\"M20 0V180\"/><path d=\"M40 0V180\"/><path d=\"M60 0V180\"/><path d=\"M80 0V180\"/><path d=\"M100 0V180\"/><path d=\"M120 0V180\"/><path d=\"M140 0V180\"/><path d=\"M160 0V180\"/><path d=\"M0 180 H160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V180\"/><path d=\"M0 40H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-5</text><text x=\"20\" y=\"51\">-4</text><text x=\"40\" y=\"51\">-3</text><text x=\"60\" y=\"51\">-2</text><text x=\"80\" y=\"51\">-1</text><text x=\"120\" y=\"51\">1</text><text x=\"140\" y=\"51\">2</text><text x=\"160\" y=\"51\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"183\">-7</text><text x=\"97\" y=\"163\">-6</text><text x=\"97\" y=\"143\">-5</text><text x=\"97\" y=\"123\">-4</text><text x=\"97\" y=\"103\">-3</text><text x=\"97\" y=\"83\">-2</text><text x=\"97\" y=\"63\">-1</text><text x=\"97\" y=\"23\">1</text><text x=\"97\" y=\"3\">2</text></g><path d=\"M60.0 100.0 L62.0 96.2 L64.0 92.8 L66.0 89.8 L68.0 87.2 L70.0 85.0 L72.0 83.2 L74.0 81.8 L76.0 80.8 L78.0 80.2 L80.0 80.0 L82.0 80.2 L84.0 80.8 L86.0 81.8 L88.0 83.2 L90.0 85.0 L92.0 87.2 L94.0 89.8 L96.0 92.8 L98.0 96.2 L100.0 100.0 L102.0 104.2 L104.0 108.8 L106.0 113.8 L108.0 119.2 L110.0 125.0 L112.0 131.2 L114.0 137.8 L116.0 144.8 L118.0 152.2 L120.0 160.0 L122.0 168.2 L124.0 176.8 L126.0 185.8M0.0 80.0 L30.0 110.0 L60.0 140.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"140.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"60.0\" cy=\"100.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.8A552E":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 308 244\" role=\"img\" aria-label=\"График функции\" style=\"max-width:308px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"280\" height=\"220\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V220\"/><path d=\"M20 0V220\"/><path d=\"M40 0V220\"/><path d=\"M60 0V220\"/><path d=\"M80 0V220\"/><path d=\"M100 0V220\"/><path d=\"M120 0V220\"/><path d=\"M140 0V220\"/><path d=\"M160 0V220\"/><path d=\"M180 0V220\"/><path d=\"M200 0V220\"/><path d=\"M220 0V220\"/><path d=\"M240 0V220\"/><path d=\"M260 0V220\"/><path d=\"M280 0V220\"/><path d=\"M0 220 H280\"/><path d=\"M0 200 H280\"/><path d=\"M0 180 H280\"/><path d=\"M0 160 H280\"/><path d=\"M0 140 H280\"/><path d=\"M0 120 H280\"/><path d=\"M0 100 H280\"/><path d=\"M0 80 H280\"/><path d=\"M0 60 H280\"/><path d=\"M0 40 H280\"/><path d=\"M0 20 H280\"/><path d=\"M0 0 H280\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M220 0V220\"/><path d=\"M0 180H280\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"191\">-11</text><text x=\"20\" y=\"191\">-10</text><text x=\"40\" y=\"191\">-9</text><text x=\"60\" y=\"191\">-8</text><text x=\"80\" y=\"191\">-7</text><text x=\"100\" y=\"191\">-6</text><text x=\"120\" y=\"191\">-5</text><text x=\"140\" y=\"191\">-4</text><text x=\"160\" y=\"191\">-3</text><text x=\"180\" y=\"191\">-2</text><text x=\"200\" y=\"191\">-1</text><text x=\"240\" y=\"191\">1</text><text x=\"260\" y=\"191\">2</text><text x=\"280\" y=\"191\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"217\" y=\"223\">-2</text><text x=\"217\" y=\"203\">-1</text><text x=\"217\" y=\"163\">1</text><text x=\"217\" y=\"143\">2</text><text x=\"217\" y=\"123\">3</text><text x=\"217\" y=\"103\">4</text><text x=\"217\" y=\"83\">5</text><text x=\"217\" y=\"63\">6</text><text x=\"217\" y=\"43\">7</text><text x=\"217\" y=\"23\">8</text><text x=\"217\" y=\"3\">9</text></g><path d=\"M18.0 226.2 L20.0 220.0 L22.0 214.2 L24.0 208.8 L26.0 203.8 L28.0 199.2 L30.0 195.0 L32.0 191.2 L34.0 187.8 L36.0 184.8 L38.0 182.2 L40.0 180.0 L42.0 178.2 L44.0 176.8 L46.0 175.8 L48.0 175.2 L50.0 175.0 L52.0 175.2 L54.0 175.8 L56.0 176.8 L58.0 178.2 L60.0 180.0M60.0 180.0 L62.0 170.2 L64.0 160.8 L66.0 151.8 L68.0 143.2 L70.0 135.0 L72.0 127.2 L74.0 119.8 L76.0 112.8 L78.0 106.2 L80.0 100.0 L82.0 94.2 L84.0 88.8 L86.0 83.8 L88.0 79.2 L90.0 75.0 L92.0 71.2 L94.0 67.8 L96.0 64.8 L98.0 62.2 L100.0 60.0 L102.0 58.2 L104.0 56.8 L106.0 55.8 L108.0 55.2 L110.0 55.0 L112.0 55.2 L114.0 55.8 L116.0 56.8 L118.0 58.2 L120.0 60.0 L122.0 62.2 L124.0 64.8 L126.0 67.8 L128.0 71.2 L130.0 75.0 L132.0 79.2 L134.0 83.8 L136.0 88.8 L138.0 94.2 L140.0 100.0 L142.0 106.2 L144.0 112.8 L146.0 119.8 L148.0 127.2 L150.0 135.0 L152.0 143.2 L154.0 151.8 L156.0 160.8 L158.0 170.2 L160.0 180.0 L162.0 190.2 L164.0 200.8 L166.0 211.8 L168.0 223.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"180.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.B745DE":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 228 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:228px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"200\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M0 160 H200\"/><path d=\"M0 140 H200\"/><path d=\"M0 120 H200\"/><path d=\"M0 100 H200\"/><path d=\"M0 80 H200\"/><path d=\"M0 60 H200\"/><path d=\"M0 40 H200\"/><path d=\"M0 20 H200\"/><path d=\"M0 0 H200\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M140 0V160\"/><path d=\"M0 120H200\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-7</text><text x=\"20\" y=\"131\">-6</text><text x=\"40\" y=\"131\">-5</text><text x=\"60\" y=\"131\">-4</text><text x=\"80\" y=\"131\">-3</text><text x=\"100\" y=\"131\">-2</text><text x=\"120\" y=\"131\">-1</text><text x=\"160\" y=\"131\">1</text><text x=\"180\" y=\"131\">2</text><text x=\"200\" y=\"131\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"137\" y=\"163\">-2</text><text x=\"137\" y=\"143\">-1</text><text x=\"137\" y=\"103\">1</text><text x=\"137\" y=\"83\">2</text><text x=\"137\" y=\"63\">3</text><text x=\"137\" y=\"43\">4</text><text x=\"137\" y=\"23\">5</text><text x=\"137\" y=\"3\">6</text></g><path d=\"M32.0 -3.2 L34.0 8.2 L36.0 19.2 L38.0 29.8 L40.0 40.0 L42.0 49.8 L44.0 59.2 L46.0 68.2 L48.0 76.8 L50.0 85.0 L52.0 92.8 L54.0 100.2 L56.0 107.2 L58.0 113.8 L60.0 120.0M60.0 120.0 L62.0 114.2 L64.0 108.8 L66.0 103.8 L68.0 99.2 L70.0 95.0 L72.0 91.2 L74.0 87.8 L76.0 84.8 L78.0 82.2 L80.0 80.0 L82.0 78.2 L84.0 76.8 L86.0 75.8 L88.0 75.2 L90.0 75.0 L92.0 75.2 L94.0 75.8 L96.0 76.8 L98.0 78.2 L100.0 80.0 L102.0 82.2 L104.0 84.8 L106.0 87.8 L108.0 91.2 L110.0 95.0 L112.0 99.2 L114.0 103.8 L116.0 108.8 L118.0 114.2 L120.0 120.0M120.0 120.0 L122.0 113.8 L124.0 107.2 L126.0 100.2 L128.0 92.8 L130.0 85.0 L132.0 76.8 L134.0 68.2 L136.0 59.2 L138.0 49.8 L140.0 40.0 L142.0 29.8 L144.0 19.2 L146.0 8.2 L148.0 -3.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"120.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.DA94D8":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V160\"/><path d=\"M0 100H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"111\">-5</text><text x=\"20\" y=\"111\">-4</text><text x=\"40\" y=\"111\">-3</text><text x=\"60\" y=\"111\">-2</text><text x=\"80\" y=\"111\">-1</text><text x=\"120\" y=\"111\">1</text><text x=\"140\" y=\"111\">2</text><text x=\"160\" y=\"111\">3</text><text x=\"180\" y=\"111\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"163\">-3</text><text x=\"97\" y=\"143\">-2</text><text x=\"97\" y=\"123\">-1</text><text x=\"97\" y=\"83\">1</text><text x=\"97\" y=\"63\">2</text><text x=\"97\" y=\"43\">3</text><text x=\"97\" y=\"23\">4</text><text x=\"97\" y=\"3\">5</text></g><path d=\"M0.0 104.0 L2.0 104.1 L4.0 104.2 L6.1 104.3 L8.1 104.4 L10.1 104.4 L12.1 104.6 L14.1 104.7 L16.2 104.8 L18.2 104.9 L20.2 105.0 L22.2 105.1 L24.2 105.3 L26.3 105.4 L28.3 105.6 L30.3 105.7 L32.3 105.9 L34.3 106.1 L36.4 106.3 L38.4 106.5 L40.4 106.7 L42.4 106.9 L44.4 107.2 L46.5 107.5 L48.5 107.8 L50.5 108.1 L52.5 108.4 L54.5 108.8 L56.6 109.2 L58.6 109.7 L60.6 110.2 L62.6 110.7 L64.6 111.3 L66.7 112.0M66.7 112.0 L68.8 112.8 L70.8 113.7 L72.9 114.8 L75.0 116.0 L77.1 117.5 L79.2 119.2 L81.2 121.3 L83.3 124.0 L85.4 127.4 L87.5 132.0 L89.6 138.4 L91.7 148.0 L93.8 164.0M104.0 0.0 L106.0 33.3 L108.0 50.0 L110.0 60.0 L112.0 66.7 L114.0 71.4 L116.0 75.0 L118.0 77.8 L120.0 80.0 L122.0 81.8 L124.0 83.3 L126.0 84.6 L128.0 85.7 L130.0 86.7 L132.0 87.5 L134.0 88.2 L136.0 88.9 L138.0 89.5 L140.0 90.0 L142.0 90.5 L144.0 90.9 L146.0 91.3 L148.0 91.7 L150.0 92.0 L152.0 92.3 L154.0 92.6 L156.0 92.9 L158.0 93.1 L160.0 93.3 L162.0 93.5 L164.0 93.8 L166.0 93.9 L168.0 94.1 L170.0 94.3 L172.0 94.4 L174.0 94.6 L176.0 94.7 L178.0 94.9 L180.0 95.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"66.7\" cy=\"112.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.942ADF":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 204\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"180\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V180\"/><path d=\"M20 0V180\"/><path d=\"M40 0V180\"/><path d=\"M60 0V180\"/><path d=\"M80 0V180\"/><path d=\"M100 0V180\"/><path d=\"M120 0V180\"/><path d=\"M140 0V180\"/><path d=\"M160 0V180\"/><path d=\"M180 0V180\"/><path d=\"M0 180 H180\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V180\"/><path d=\"M0 40H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-4</text><text x=\"20\" y=\"51\">-3</text><text x=\"40\" y=\"51\">-2</text><text x=\"60\" y=\"51\">-1</text><text x=\"100\" y=\"51\">1</text><text x=\"120\" y=\"51\">2</text><text x=\"140\" y=\"51\">3</text><text x=\"160\" y=\"51\">4</text><text x=\"180\" y=\"51\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"183\">-7</text><text x=\"77\" y=\"163\">-6</text><text x=\"77\" y=\"143\">-5</text><text x=\"77\" y=\"123\">-4</text><text x=\"77\" y=\"103\">-3</text><text x=\"77\" y=\"83\">-2</text><text x=\"77\" y=\"63\">-1</text><text x=\"77\" y=\"23\">1</text><text x=\"77\" y=\"3\">2</text></g><path d=\"M44.0 184.8 L46.0 177.8 L48.0 171.2 L50.0 165.0 L52.0 159.2 L54.0 153.8 L56.0 148.8 L58.0 144.2 L60.0 140.0 L62.0 136.2 L64.0 132.8 L66.0 129.8 L68.0 127.2 L70.0 125.0 L72.0 123.2 L74.0 121.8 L76.0 120.8 L78.0 120.2 L80.0 120.0 L82.0 120.2 L84.0 120.8 L86.0 121.8 L88.0 123.2 L90.0 125.0 L92.0 127.2 L94.0 129.8 L96.0 132.8 L98.0 136.2 L100.0 140.0M100.0 140.0 L102.0 144.2 L104.0 148.8 L106.0 153.8 L108.0 159.2 L110.0 165.0 L112.0 171.2 L114.0 177.8 L116.0 184.8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"140.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.67EDD6":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 248 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:248px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"220\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M220 0V160\"/><path d=\"M0 160 H220\"/><path d=\"M0 140 H220\"/><path d=\"M0 120 H220\"/><path d=\"M0 100 H220\"/><path d=\"M0 80 H220\"/><path d=\"M0 60 H220\"/><path d=\"M0 40 H220\"/><path d=\"M0 20 H220\"/><path d=\"M0 0 H220\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V160\"/><path d=\"M0 120H220\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-3</text><text x=\"20\" y=\"131\">-2</text><text x=\"40\" y=\"131\">-1</text><text x=\"80\" y=\"131\">1</text><text x=\"100\" y=\"131\">2</text><text x=\"120\" y=\"131\">3</text><text x=\"140\" y=\"131\">4</text><text x=\"160\" y=\"131\">5</text><text x=\"180\" y=\"131\">6</text><text x=\"200\" y=\"131\">7</text><text x=\"220\" y=\"131\">8</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"163\">-2</text><text x=\"57\" y=\"143\">-1</text><text x=\"57\" y=\"103\">1</text><text x=\"57\" y=\"83\">2</text><text x=\"57\" y=\"63\">3</text><text x=\"57\" y=\"43\">4</text><text x=\"57\" y=\"23\">5</text><text x=\"57\" y=\"3\">6</text></g><path d=\"M140.0 100.0 L142.0 103.8 L144.0 107.2 L146.0 110.2 L148.0 112.8 L150.0 115.0 L152.0 116.8 L154.0 118.2 L156.0 119.2 L158.0 119.8 L160.0 120.0 L162.0 119.8 L164.0 119.2 L166.0 118.2 L168.0 116.8 L170.0 115.0 L172.0 112.8 L174.0 110.2 L176.0 107.2 L178.0 103.8 L180.0 100.0 L182.0 95.8 L184.0 91.2 L186.0 86.2 L188.0 80.8 L190.0 75.0 L192.0 68.8 L194.0 62.2 L196.0 55.2 L198.0 47.8 L200.0 40.0 L202.0 31.8 L204.0 23.2 L206.0 14.2 L208.0 4.8 L210.0 -5.0M70.0 150.0 L140.0 80.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"140.0\" cy=\"80.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"140.0\" cy=\"100.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.34C6D0":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 308 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:308px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"280\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M220 0V160\"/><path d=\"M240 0V160\"/><path d=\"M260 0V160\"/><path d=\"M280 0V160\"/><path d=\"M0 160 H280\"/><path d=\"M0 140 H280\"/><path d=\"M0 120 H280\"/><path d=\"M0 100 H280\"/><path d=\"M0 80 H280\"/><path d=\"M0 60 H280\"/><path d=\"M0 40 H280\"/><path d=\"M0 20 H280\"/><path d=\"M0 0 H280\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M220 0V160\"/><path d=\"M0 120H280\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-11</text><text x=\"20\" y=\"131\">-10</text><text x=\"40\" y=\"131\">-9</text><text x=\"60\" y=\"131\">-8</text><text x=\"80\" y=\"131\">-7</text><text x=\"100\" y=\"131\">-6</text><text x=\"120\" y=\"131\">-5</text><text x=\"140\" y=\"131\">-4</text><text x=\"160\" y=\"131\">-3</text><text x=\"180\" y=\"131\">-2</text><text x=\"200\" y=\"131\">-1</text><text x=\"240\" y=\"131\">1</text><text x=\"260\" y=\"131\">2</text><text x=\"280\" y=\"131\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"217\" y=\"163\">-2</text><text x=\"217\" y=\"143\">-1</text><text x=\"217\" y=\"103\">1</text><text x=\"217\" y=\"83\">2</text><text x=\"217\" y=\"63\">3</text><text x=\"217\" y=\"43\">4</text><text x=\"217\" y=\"23\">5</text><text x=\"217\" y=\"3\">6</text></g><path d=\"M24.0 164.8 L26.0 157.8 L28.0 151.2 L30.0 145.0 L32.0 139.2 L34.0 133.8 L36.0 128.8 L38.0 124.2 L40.0 120.0 L42.0 116.2 L44.0 112.8 L46.0 109.8 L48.0 107.2 L50.0 105.0 L52.0 103.2 L54.0 101.8 L56.0 100.8 L58.0 100.2 L60.0 100.0 L62.0 100.2 L64.0 100.8 L66.0 101.8 L68.0 103.2 L70.0 105.0 L72.0 107.2 L74.0 109.8 L76.0 112.8 L78.0 116.2 L80.0 120.0M80.0 120.0 L82.0 112.2 L84.0 104.8 L86.0 97.8 L88.0 91.2 L90.0 85.0 L92.0 79.2 L94.0 73.8 L96.0 68.8 L98.0 64.2 L100.0 60.0 L102.0 56.2 L104.0 52.8 L106.0 49.8 L108.0 47.2 L110.0 45.0 L112.0 43.2 L114.0 41.8 L116.0 40.8 L118.0 40.2 L120.0 40.0 L122.0 40.2 L124.0 40.8 L126.0 41.8 L128.0 43.2 L130.0 45.0 L132.0 47.2 L134.0 49.8 L136.0 52.8 L138.0 56.2 L140.0 60.0 L142.0 64.2 L144.0 68.8 L146.0 73.8 L148.0 79.2 L150.0 85.0 L152.0 91.2 L154.0 97.8 L156.0 104.8 L158.0 112.2 L160.0 120.0 L162.0 128.2 L164.0 136.8 L166.0 145.8 L168.0 155.2 L170.0 165.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.38C1D6":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 228 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:228px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"200\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M0 160 H200\"/><path d=\"M0 140 H200\"/><path d=\"M0 120 H200\"/><path d=\"M0 100 H200\"/><path d=\"M0 80 H200\"/><path d=\"M0 60 H200\"/><path d=\"M0 40 H200\"/><path d=\"M0 20 H200\"/><path d=\"M0 0 H200\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V160\"/><path d=\"M0 120H200\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-3</text><text x=\"20\" y=\"131\">-2</text><text x=\"40\" y=\"131\">-1</text><text x=\"80\" y=\"131\">1</text><text x=\"100\" y=\"131\">2</text><text x=\"120\" y=\"131\">3</text><text x=\"140\" y=\"131\">4</text><text x=\"160\" y=\"131\">5</text><text x=\"180\" y=\"131\">6</text><text x=\"200\" y=\"131\">7</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"163\">-2</text><text x=\"57\" y=\"143\">-1</text><text x=\"57\" y=\"103\">1</text><text x=\"57\" y=\"83\">2</text><text x=\"57\" y=\"63\">3</text><text x=\"57\" y=\"43\">4</text><text x=\"57\" y=\"23\">5</text><text x=\"57\" y=\"3\">6</text></g><path d=\"M0.0 165.0 L2.0 162.0 L4.0 159.2 L6.0 156.4 L8.0 153.8 L10.0 151.2 L12.0 148.8 L14.0 146.4 L16.0 144.2 L18.0 142.1 L20.0 140.0 L22.0 138.1 L24.0 136.2 L26.0 134.4 L28.0 132.8 L30.0 131.2 L32.0 129.8 L34.0 128.5 L36.0 127.2 L38.0 126.1 L40.0 125.0 L42.0 124.0 L44.0 123.2 L46.0 122.5 L48.0 121.8 L50.0 121.2 L52.0 120.8 L54.0 120.5 L56.0 120.2 L58.0 120.1 L60.0 120.0M60.0 120.0 L62.0 119.9 L64.0 119.8 L66.0 119.5 L68.0 119.2 L70.0 118.8 L72.0 118.2 L74.0 117.6 L76.0 116.8 L78.0 116.0 L80.0 115.0 L82.0 113.9 L84.0 112.8 L86.0 111.5 L88.0 110.2 L90.0 108.8 L92.0 107.2 L94.0 105.5 L96.0 103.8 L98.0 102.0 L100.0 100.0 L102.0 98.0 L104.0 95.8 L106.0 93.6 L108.0 91.2 L110.0 88.8 L112.0 86.2 L114.0 83.6 L116.0 80.8 L118.0 78.0 L120.0 75.0 L122.0 71.9 L124.0 68.8 L126.0 65.6 L128.0 62.2 L130.0 58.8 L132.0 55.2 L134.0 51.5 L136.0 47.8 L138.0 44.0 L140.0 40.0M140.0 40.0 L142.0 36.0 L144.0 31.8 L146.0 27.6 L148.0 23.2 L150.0 18.8 L152.0 14.2 L154.0 9.5 L156.0 4.8 L158.0 -0.1 L160.0 -5.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"140.0\" cy=\"40.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.8E25DC":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M120 0V160\"/><path d=\"M0 100H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"111\">-6</text><text x=\"20\" y=\"111\">-5</text><text x=\"40\" y=\"111\">-4</text><text x=\"60\" y=\"111\">-3</text><text x=\"80\" y=\"111\">-2</text><text x=\"100\" y=\"111\">-1</text><text x=\"140\" y=\"111\">1</text><text x=\"160\" y=\"111\">2</text><text x=\"180\" y=\"111\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"117\" y=\"163\">-3</text><text x=\"117\" y=\"143\">-2</text><text x=\"117\" y=\"123\">-1</text><text x=\"117\" y=\"83\">1</text><text x=\"117\" y=\"63\">2</text><text x=\"117\" y=\"43\">3</text><text x=\"117\" y=\"23\">4</text><text x=\"117\" y=\"3\">5</text></g><path d=\"M0.0 103.3 L2.0 103.4 L4.0 103.4 L6.0 103.5 L8.0 103.6 L10.0 103.6 L12.0 103.7 L14.0 103.8 L16.0 103.8 L18.0 103.9 L20.0 104.0 L22.0 104.1 L24.0 104.2 L26.0 104.3 L28.0 104.3 L30.0 104.4 L32.0 104.5 L34.0 104.7 L36.0 104.8 L38.0 104.9 L40.0 105.0 L42.0 105.1 L44.0 105.3 L46.0 105.4 L48.0 105.6 L50.0 105.7 L52.0 105.9 L54.0 106.1 L56.0 106.2 L58.0 106.5 L60.0 106.7 L62.0 106.9 L64.0 107.1 L66.0 107.4 L68.0 107.7 L70.0 108.0M70.0 108.0 L72.0 108.3 L74.0 108.7 L76.0 109.1 L78.0 109.5 L80.0 110.0 L82.0 110.5 L84.0 111.1 L86.0 111.8 L88.0 112.5 L90.0 113.3 L92.0 114.3 L94.0 115.4 L96.0 116.7 L98.0 118.2 L100.0 120.0 L102.0 122.2 L104.0 125.0 L106.0 128.6 L108.0 133.3 L110.0 140.0 L112.0 150.0 L114.0 166.7M124.0 0.0 L126.0 33.3 L128.0 50.0 L130.0 60.0 L132.0 66.7 L134.0 71.4 L136.0 75.0 L138.0 77.8 L140.0 80.0 L142.0 81.8 L144.0 83.3 L146.0 84.6 L148.0 85.7 L150.0 86.7 L152.0 87.5 L154.0 88.2 L156.0 88.9 L158.0 89.5 L160.0 90.0 L162.0 90.5 L164.0 90.9 L166.0 91.3 L168.0 91.7 L170.0 92.0 L172.0 92.3 L174.0 92.6 L176.0 92.9 L178.0 93.1 L180.0 93.3\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"70.0\" cy=\"108.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.8D22D9":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V160\"/><path d=\"M0 120H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-5</text><text x=\"20\" y=\"131\">-4</text><text x=\"40\" y=\"131\">-3</text><text x=\"60\" y=\"131\">-2</text><text x=\"80\" y=\"131\">-1</text><text x=\"120\" y=\"131\">1</text><text x=\"140\" y=\"131\">2</text><text x=\"160\" y=\"131\">3</text><text x=\"180\" y=\"131\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"163\">-2</text><text x=\"97\" y=\"143\">-1</text><text x=\"97\" y=\"103\">1</text><text x=\"97\" y=\"83\">2</text><text x=\"97\" y=\"63\">3</text><text x=\"97\" y=\"43\">4</text><text x=\"97\" y=\"23\">5</text><text x=\"97\" y=\"3\">6</text></g><path d=\"M32.0 -3.2 L34.0 8.2 L36.0 19.2 L38.0 29.8 L40.0 40.0 L42.0 49.8 L44.0 59.2 L46.0 68.2 L48.0 76.8 L50.0 85.0 L52.0 92.8 L54.0 100.2 L56.0 107.2 L58.0 113.8 L60.0 120.0M60.0 120.0 L62.0 114.2 L64.0 108.8 L66.0 103.8 L68.0 99.2 L70.0 95.0 L72.0 91.2 L74.0 87.8 L76.0 84.8 L78.0 82.2 L80.0 80.0 L82.0 78.2 L84.0 76.8 L86.0 75.8 L88.0 75.2 L90.0 75.0 L92.0 75.2 L94.0 75.8 L96.0 76.8 L98.0 78.2 L100.0 80.0 L102.0 82.2 L104.0 84.8 L106.0 87.8 L108.0 91.2 L110.0 95.0 L112.0 99.2 L114.0 103.8 L116.0 108.8 L118.0 114.2 L120.0 120.0M120.0 120.0 L122.0 113.8 L124.0 107.2 L126.0 100.2 L128.0 92.8 L130.0 85.0 L132.0 76.8 L134.0 68.2 L136.0 59.2 L138.0 49.8 L140.0 40.0 L142.0 29.8 L144.0 19.2 L146.0 8.2 L148.0 -3.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"120.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.F92250":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 268 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:268px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"240\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M220 0V160\"/><path d=\"M240 0V160\"/><path d=\"M0 160 H240\"/><path d=\"M0 140 H240\"/><path d=\"M0 120 H240\"/><path d=\"M0 100 H240\"/><path d=\"M0 80 H240\"/><path d=\"M0 60 H240\"/><path d=\"M0 40 H240\"/><path d=\"M0 20 H240\"/><path d=\"M0 0 H240\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M120 0V160\"/><path d=\"M0 100H240\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"111\">-6</text><text x=\"20\" y=\"111\">-5</text><text x=\"40\" y=\"111\">-4</text><text x=\"60\" y=\"111\">-3</text><text x=\"80\" y=\"111\">-2</text><text x=\"100\" y=\"111\">-1</text><text x=\"140\" y=\"111\">1</text><text x=\"160\" y=\"111\">2</text><text x=\"180\" y=\"111\">3</text><text x=\"200\" y=\"111\">4</text><text x=\"220\" y=\"111\">5</text><text x=\"240\" y=\"111\">6</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"117\" y=\"163\">-3</text><text x=\"117\" y=\"143\">-2</text><text x=\"117\" y=\"123\">-1</text><text x=\"117\" y=\"83\">1</text><text x=\"117\" y=\"63\">2</text><text x=\"117\" y=\"43\">3</text><text x=\"117\" y=\"23\">4</text><text x=\"117\" y=\"3\">5</text></g><path d=\"M0.0 111.7 L2.0 111.9 L4.0 112.1 L6.0 112.3 L8.0 112.5 L10.0 112.7 L12.0 113.0 L14.0 113.2 L16.0 113.5 L18.0 113.7 L20.0 114.0 L22.0 114.3 L24.0 114.6 L26.0 114.9 L28.0 115.2 L30.0 115.6 L32.0 115.9 L34.0 116.3 L36.0 116.7 L38.0 117.1 L40.0 117.5 L42.0 117.9 L44.0 118.4 L46.0 118.9 L48.0 119.4 L50.0 120.0M50.0 120.0 L85.0 110.0 L120.0 100.0M134.0 0.0 L136.0 12.5 L138.0 22.2 L140.0 30.0 L142.0 36.4 L144.0 41.7 L146.0 46.2 L148.0 50.0 L150.0 53.3 L152.0 56.2 L154.0 58.8 L156.0 61.1 L158.0 63.2 L160.0 65.0 L162.0 66.7 L164.0 68.2 L166.0 69.6 L168.0 70.8 L170.0 72.0 L172.0 73.1 L174.0 74.1 L176.0 75.0 L178.0 75.9 L180.0 76.7 L182.0 77.4 L184.0 78.1 L186.0 78.8 L188.0 79.4 L190.0 80.0M190.0 80.0 L215.0 72.9 L240.0 65.7\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"50.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"120.0\" cy=\"100.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"190.0\" cy=\"80.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.B50355":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 268 284\" role=\"img\" aria-label=\"График функции\" style=\"max-width:268px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"240\" height=\"260\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V260\"/><path d=\"M20 0V260\"/><path d=\"M40 0V260\"/><path d=\"M60 0V260\"/><path d=\"M80 0V260\"/><path d=\"M100 0V260\"/><path d=\"M120 0V260\"/><path d=\"M140 0V260\"/><path d=\"M160 0V260\"/><path d=\"M180 0V260\"/><path d=\"M200 0V260\"/><path d=\"M220 0V260\"/><path d=\"M240 0V260\"/><path d=\"M0 260 H240\"/><path d=\"M0 240 H240\"/><path d=\"M0 220 H240\"/><path d=\"M0 200 H240\"/><path d=\"M0 180 H240\"/><path d=\"M0 160 H240\"/><path d=\"M0 140 H240\"/><path d=\"M0 120 H240\"/><path d=\"M0 100 H240\"/><path d=\"M0 80 H240\"/><path d=\"M0 60 H240\"/><path d=\"M0 40 H240\"/><path d=\"M0 20 H240\"/><path d=\"M0 0 H240\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M120 0V260\"/><path d=\"M0 220H240\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"231\">-6</text><text x=\"20\" y=\"231\">-5</text><text x=\"40\" y=\"231\">-4</text><text x=\"60\" y=\"231\">-3</text><text x=\"80\" y=\"231\">-2</text><text x=\"100\" y=\"231\">-1</text><text x=\"140\" y=\"231\">1</text><text x=\"160\" y=\"231\">2</text><text x=\"180\" y=\"231\">3</text><text x=\"200\" y=\"231\">4</text><text x=\"220\" y=\"231\">5</text><text x=\"240\" y=\"231\">6</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"117\" y=\"263\">-2</text><text x=\"117\" y=\"243\">-1</text><text x=\"117\" y=\"203\">1</text><text x=\"117\" y=\"183\">2</text><text x=\"117\" y=\"163\">3</text><text x=\"117\" y=\"143\">4</text><text x=\"117\" y=\"123\">5</text><text x=\"117\" y=\"103\">6</text><text x=\"117\" y=\"83\">7</text><text x=\"117\" y=\"63\">8</text><text x=\"117\" y=\"43\">9</text><text x=\"117\" y=\"23\">10</text><text x=\"117\" y=\"3\">11</text></g><path d=\"M30.0 -5.0 L32.0 12.8 L34.0 30.2 L36.0 47.2 L38.0 63.8 L40.0 80.0 L42.0 95.8 L44.0 111.2 L46.0 126.2 L48.0 140.8 L50.0 155.0 L52.0 168.8 L54.0 182.2 L56.0 195.2 L58.0 207.8 L60.0 220.0M60.0 220.0 L62.0 208.2 L64.0 196.8 L66.0 185.8 L68.0 175.2 L70.0 165.0 L72.0 155.2 L74.0 145.8 L76.0 136.8 L78.0 128.2 L80.0 120.0 L82.0 112.2 L84.0 104.8 L86.0 97.8 L88.0 91.2 L90.0 85.0 L92.0 79.2 L94.0 73.8 L96.0 68.8 L98.0 64.2 L100.0 60.0 L102.0 56.2 L104.0 52.8 L106.0 49.8 L108.0 47.2 L110.0 45.0 L112.0 43.2 L114.0 41.8 L116.0 40.8 L118.0 40.2 L120.0 40.0 L122.0 40.2 L124.0 40.8 L126.0 41.8 L128.0 43.2 L130.0 45.0 L132.0 47.2 L134.0 49.8 L136.0 52.8 L138.0 56.2 L140.0 60.0 L142.0 64.2 L144.0 68.8 L146.0 73.8 L148.0 79.2 L150.0 85.0 L152.0 91.2 L154.0 97.8 L156.0 104.8 L158.0 112.2 L160.0 120.0 L162.0 128.2 L164.0 136.8 L166.0 145.8 L168.0 155.2 L170.0 165.0 L172.0 175.2 L174.0 185.8 L176.0 196.8 L178.0 208.2 L180.0 220.0M180.0 220.0 L182.0 207.8 L184.0 195.2 L186.0 182.2 L188.0 168.8 L190.0 155.0 L192.0 140.8 L194.0 126.2 L196.0 111.2 L198.0 95.8 L200.0 80.0 L202.0 63.8 L204.0 47.2 L206.0 30.2 L208.0 12.8 L210.0 -5.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"220.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"180.0\" cy=\"220.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.1D555C":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 268 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:268px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"240\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M220 0V160\"/><path d=\"M240 0V160\"/><path d=\"M0 160 H240\"/><path d=\"M0 140 H240\"/><path d=\"M0 120 H240\"/><path d=\"M0 100 H240\"/><path d=\"M0 80 H240\"/><path d=\"M0 60 H240\"/><path d=\"M0 40 H240\"/><path d=\"M0 20 H240\"/><path d=\"M0 0 H240\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V160\"/><path d=\"M0 60H240\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"71\">-3</text><text x=\"20\" y=\"71\">-2</text><text x=\"40\" y=\"71\">-1</text><text x=\"80\" y=\"71\">1</text><text x=\"100\" y=\"71\">2</text><text x=\"120\" y=\"71\">3</text><text x=\"140\" y=\"71\">4</text><text x=\"160\" y=\"71\">5</text><text x=\"180\" y=\"71\">6</text><text x=\"200\" y=\"71\">7</text><text x=\"220\" y=\"71\">8</text><text x=\"240\" y=\"71\">9</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"163\">-5</text><text x=\"57\" y=\"143\">-4</text><text x=\"57\" y=\"123\">-3</text><text x=\"57\" y=\"103\">-2</text><text x=\"57\" y=\"83\">-1</text><text x=\"57\" y=\"43\">1</text><text x=\"57\" y=\"23\">2</text><text x=\"57\" y=\"3\">3</text></g><path d=\"M112.0 -7.2 L114.0 0.2 L116.0 7.2 L118.0 13.8 L120.0 20.0 L122.0 25.8 L124.0 31.2 L126.0 36.2 L128.0 40.8 L130.0 45.0 L132.0 48.8 L134.0 52.2 L136.0 55.2 L138.0 57.8 L140.0 60.0 L142.0 61.8 L144.0 63.2 L146.0 64.2 L148.0 64.8 L150.0 65.0 L152.0 64.8 L154.0 64.2 L156.0 63.2 L158.0 61.8 L160.0 60.0M160.0 60.0 L162.0 65.8 L164.0 71.2 L166.0 76.2 L168.0 80.8 L170.0 85.0 L172.0 88.8 L174.0 92.2 L176.0 95.2 L178.0 97.8 L180.0 100.0 L182.0 101.8 L184.0 103.2 L186.0 104.2 L188.0 104.8 L190.0 105.0 L192.0 104.8 L194.0 104.2 L196.0 103.2 L198.0 101.8 L200.0 100.0 L202.0 97.8 L204.0 95.2 L206.0 92.2 L208.0 88.8 L210.0 85.0 L212.0 80.8 L214.0 76.2 L216.0 71.2 L218.0 65.8 L220.0 60.0 L222.0 53.8 L224.0 47.2 L226.0 40.2 L228.0 32.8 L230.0 25.0 L232.0 16.8 L234.0 8.2 L236.0 -0.8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"160.0\" cy=\"60.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.2E135D":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 248 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:248px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"220\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M220 0V160\"/><path d=\"M0 160 H220\"/><path d=\"M0 140 H220\"/><path d=\"M0 120 H220\"/><path d=\"M0 100 H220\"/><path d=\"M0 80 H220\"/><path d=\"M0 60 H220\"/><path d=\"M0 40 H220\"/><path d=\"M0 20 H220\"/><path d=\"M0 0 H220\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V160\"/><path d=\"M0 120H220\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-3</text><text x=\"20\" y=\"131\">-2</text><text x=\"40\" y=\"131\">-1</text><text x=\"80\" y=\"131\">1</text><text x=\"100\" y=\"131\">2</text><text x=\"120\" y=\"131\">3</text><text x=\"140\" y=\"131\">4</text><text x=\"160\" y=\"131\">5</text><text x=\"180\" y=\"131\">6</text><text x=\"200\" y=\"131\">7</text><text x=\"220\" y=\"131\">8</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"163\">-2</text><text x=\"57\" y=\"143\">-1</text><text x=\"57\" y=\"103\">1</text><text x=\"57\" y=\"83\">2</text><text x=\"57\" y=\"63\">3</text><text x=\"57\" y=\"43\">4</text><text x=\"57\" y=\"23\">5</text><text x=\"57\" y=\"3\">6</text></g><path d=\"M56.0 -4.8 L58.0 7.8 L60.0 20.0 L62.0 31.8 L64.0 43.2 L66.0 54.2 L68.0 64.8 L70.0 75.0 L72.0 84.8 L74.0 94.2 L76.0 103.2 L78.0 111.8 L80.0 120.0M80.0 120.0 L82.0 112.2 L84.0 104.8 L86.0 97.8 L88.0 91.2 L90.0 85.0 L92.0 79.2 L94.0 73.8 L96.0 68.8 L98.0 64.2 L100.0 60.0 L102.0 56.2 L104.0 52.8 L106.0 49.8 L108.0 47.2 L110.0 45.0 L112.0 43.2 L114.0 41.8 L116.0 40.8 L118.0 40.2 L120.0 40.0 L122.0 40.2 L124.0 40.8 L126.0 41.8 L128.0 43.2 L130.0 45.0 L132.0 47.2 L134.0 49.8 L136.0 52.8 L138.0 56.2 L140.0 60.0 L142.0 64.2 L144.0 68.8 L146.0 73.8 L148.0 79.2 L150.0 85.0 L152.0 91.2 L154.0 97.8 L156.0 104.8 L158.0 112.2 L160.0 120.0M160.0 120.0 L162.0 111.8 L164.0 103.2 L166.0 94.2 L168.0 84.8 L170.0 75.0 L172.0 64.8 L174.0 54.2 L176.0 43.2 L178.0 31.8 L180.0 20.0 L182.0 7.8 L184.0 -4.8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"160.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.92985D":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V160\"/><path d=\"M0 40H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-4</text><text x=\"20\" y=\"51\">-3</text><text x=\"40\" y=\"51\">-2</text><text x=\"60\" y=\"51\">-1</text><text x=\"100\" y=\"51\">1</text><text x=\"120\" y=\"51\">2</text><text x=\"140\" y=\"51\">3</text><text x=\"160\" y=\"51\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"163\">-6</text><text x=\"77\" y=\"143\">-5</text><text x=\"77\" y=\"123\">-4</text><text x=\"77\" y=\"103\">-3</text><text x=\"77\" y=\"83\">-2</text><text x=\"77\" y=\"63\">-1</text><text x=\"77\" y=\"23\">1</text><text x=\"77\" y=\"3\">2</text></g><path d=\"M0.0 45.0 L2.0 45.1 L4.0 45.3 L6.0 45.4 L8.0 45.6 L10.0 45.7 L12.0 45.9 L14.1 46.1 L16.1 46.3 L18.1 46.5 L20.1 46.7 L22.1 46.9 L24.1 47.2 L26.1 47.4 L28.1 47.7 L30.1 48.0 L32.1 48.4 L34.1 48.7 L36.1 49.1 L38.1 49.6 L40.2 50.0 L42.2 50.6 L44.2 51.2 L46.2 51.8 L48.2 52.6 L50.2 53.4 L52.2 54.4 L54.2 55.5 L56.2 56.8 L58.2 58.4 L60.2 60.2 L62.2 62.5 L64.2 65.4 L66.3 69.1 L68.3 74.1 L70.3 81.1 L72.3 91.8 L74.3 110.0M74.3 110.0 L75.7 133.3M84.3 133.3 L85.7 110.0M85.7 110.0 L87.7 91.8 L89.7 81.1 L91.7 74.1 L93.7 69.1 L95.8 65.4 L97.8 62.5 L99.8 60.2 L101.8 58.4 L103.8 56.8 L105.8 55.5 L107.8 54.4 L109.8 53.4 L111.8 52.6 L113.8 51.8 L115.8 51.2 L117.8 50.6 L119.8 50.0 L121.9 49.6 L123.9 49.1 L125.9 48.7 L127.9 48.4 L129.9 48.0 L131.9 47.7 L133.9 47.4 L135.9 47.2 L137.9 46.9 L139.9 46.7 L141.9 46.5 L143.9 46.3 L145.9 46.1 L148.0 45.9 L150.0 45.7 L152.0 45.6 L154.0 45.4 L156.0 45.3 L158.0 45.1 L160.0 45.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"74.3\" cy=\"110.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"85.7\" cy=\"110.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.64F750":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M120 0V160\"/><path d=\"M0 120H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-6</text><text x=\"20\" y=\"131\">-5</text><text x=\"40\" y=\"131\">-4</text><text x=\"60\" y=\"131\">-3</text><text x=\"80\" y=\"131\">-2</text><text x=\"100\" y=\"131\">-1</text><text x=\"140\" y=\"131\">1</text><text x=\"160\" y=\"131\">2</text><text x=\"180\" y=\"131\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"117\" y=\"163\">-2</text><text x=\"117\" y=\"143\">-1</text><text x=\"117\" y=\"103\">1</text><text x=\"117\" y=\"83\">2</text><text x=\"117\" y=\"63\">3</text><text x=\"117\" y=\"43\">4</text><text x=\"117\" y=\"23\">5</text><text x=\"117\" y=\"3\">6</text></g><path d=\"M60.0 100.0 L62.0 103.8 L64.0 107.2 L66.0 110.2 L68.0 112.8 L70.0 115.0 L72.0 116.8 L74.0 118.2 L76.0 119.2 L78.0 119.8 L80.0 120.0 L82.0 119.8 L84.0 119.2 L86.0 118.2 L88.0 116.8 L90.0 115.0 L92.0 112.8 L94.0 110.2 L96.0 107.2 L98.0 103.8 L100.0 100.0 L102.0 95.8 L104.0 91.2 L106.0 86.2 L108.0 80.8 L110.0 75.0 L112.0 68.8 L114.0 62.2 L116.0 55.2 L118.0 47.8 L120.0 40.0 L122.0 31.8 L124.0 23.2 L126.0 14.2 L128.0 4.8 L130.0 -5.0M0.0 110.0 L2.0 109.8 L4.0 109.7 L6.0 109.5 L8.0 109.3 L10.0 109.1 L12.0 108.9 L14.0 108.7 L16.0 108.5 L18.0 108.2 L20.0 108.0 L22.0 107.8 L24.0 107.5 L26.0 107.2 L28.0 107.0 L30.0 106.7 L32.0 106.4 L34.0 106.0 L36.0 105.7 L38.0 105.4 L40.0 105.0 L42.0 104.6 L44.0 104.2 L46.0 103.8 L48.0 103.3 L50.0 102.9 L52.0 102.4 L54.0 101.8 L56.0 101.2 L58.0 100.6 L60.0 100.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"100.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.FE4FAA":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 284\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"260\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V260\"/><path d=\"M20 0V260\"/><path d=\"M40 0V260\"/><path d=\"M60 0V260\"/><path d=\"M80 0V260\"/><path d=\"M100 0V260\"/><path d=\"M120 0V260\"/><path d=\"M140 0V260\"/><path d=\"M160 0V260\"/><path d=\"M180 0V260\"/><path d=\"M0 260 H180\"/><path d=\"M0 240 H180\"/><path d=\"M0 220 H180\"/><path d=\"M0 200 H180\"/><path d=\"M0 180 H180\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V260\"/><path d=\"M0 220H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"231\">-5</text><text x=\"20\" y=\"231\">-4</text><text x=\"40\" y=\"231\">-3</text><text x=\"60\" y=\"231\">-2</text><text x=\"80\" y=\"231\">-1</text><text x=\"120\" y=\"231\">1</text><text x=\"140\" y=\"231\">2</text><text x=\"160\" y=\"231\">3</text><text x=\"180\" y=\"231\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"263\">-2</text><text x=\"97\" y=\"243\">-1</text><text x=\"97\" y=\"203\">1</text><text x=\"97\" y=\"183\">2</text><text x=\"97\" y=\"163\">3</text><text x=\"97\" y=\"143\">4</text><text x=\"97\" y=\"123\">5</text><text x=\"97\" y=\"103\">6</text><text x=\"97\" y=\"83\">7</text><text x=\"97\" y=\"63\">8</text><text x=\"97\" y=\"43\">9</text><text x=\"97\" y=\"23\">10</text><text x=\"97\" y=\"3\">11</text></g><path d=\"M60.0 40.0 L62.0 51.8 L64.0 63.2 L66.0 74.2 L68.0 84.8 L70.0 95.0 L72.0 104.8 L74.0 114.2 L76.0 123.2 L78.0 131.8 L80.0 140.0 L82.0 147.8 L84.0 155.2 L86.0 162.2 L88.0 168.8 L90.0 175.0 L92.0 180.8 L94.0 186.2 L96.0 191.2 L98.0 195.8 L100.0 200.0 L102.0 203.8 L104.0 207.2 L106.0 210.2 L108.0 212.8 L110.0 215.0 L112.0 216.8 L114.0 218.2 L116.0 219.2 L118.0 219.8 L120.0 220.0 L122.0 219.8 L124.0 219.2 L126.0 218.2 L128.0 216.8 L130.0 215.0 L132.0 212.8 L134.0 210.2 L136.0 207.2 L138.0 203.8 L140.0 200.0 L142.0 195.8 L144.0 191.2 L146.0 186.2 L148.0 180.8 L150.0 175.0 L152.0 168.8 L154.0 162.2 L156.0 155.2 L158.0 147.8 L160.0 140.0 L162.0 131.8 L164.0 123.2 L166.0 114.2 L168.0 104.8 L170.0 95.0 L172.0 84.8 L174.0 74.2 L176.0 63.2 L178.0 51.8 L180.0 40.0M0.0 148.0 L2.0 146.5 L4.0 145.0 L6.0 143.4 L8.0 141.7 L10.0 140.0 L12.0 138.2 L14.0 136.3 L16.0 134.3 L18.0 132.2 L20.0 130.0 L22.0 127.7 L24.0 125.3 L26.0 122.7 L28.0 120.0 L30.0 117.1 L32.0 114.1 L34.0 110.9 L36.0 107.5 L38.0 103.9 L40.0 100.0 L42.0 95.9 L44.0 91.4 L46.0 86.7 L48.0 81.5 L50.0 76.0 L52.0 70.0 L54.0 63.5 L56.0 56.4 L58.0 48.6 L60.0 40.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"40.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.2F87A2":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 248 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:248px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"220\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M220 0V160\"/><path d=\"M0 160 H220\"/><path d=\"M0 140 H220\"/><path d=\"M0 120 H220\"/><path d=\"M0 100 H220\"/><path d=\"M0 80 H220\"/><path d=\"M0 60 H220\"/><path d=\"M0 40 H220\"/><path d=\"M0 20 H220\"/><path d=\"M0 0 H220\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V160\"/><path d=\"M0 120H220\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-3</text><text x=\"20\" y=\"131\">-2</text><text x=\"40\" y=\"131\">-1</text><text x=\"80\" y=\"131\">1</text><text x=\"100\" y=\"131\">2</text><text x=\"120\" y=\"131\">3</text><text x=\"140\" y=\"131\">4</text><text x=\"160\" y=\"131\">5</text><text x=\"180\" y=\"131\">6</text><text x=\"200\" y=\"131\">7</text><text x=\"220\" y=\"131\">8</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"163\">-2</text><text x=\"57\" y=\"143\">-1</text><text x=\"57\" y=\"103\">1</text><text x=\"57\" y=\"83\">2</text><text x=\"57\" y=\"63\">3</text><text x=\"57\" y=\"43\">4</text><text x=\"57\" y=\"23\">5</text><text x=\"57\" y=\"3\">6</text></g><path d=\"M98.0 166.2 L100.0 160.0 L102.0 154.2 L104.0 148.8 L106.0 143.8 L108.0 139.2 L110.0 135.0 L112.0 131.2 L114.0 127.8 L116.0 124.8 L118.0 122.2 L120.0 120.0 L122.0 118.2 L124.0 116.8 L126.0 115.8 L128.0 115.2 L130.0 115.0 L132.0 115.2 L134.0 115.8 L136.0 116.8 L138.0 118.2 L140.0 120.0M140.0 120.0 L142.0 114.2 L144.0 108.8 L146.0 103.8 L148.0 99.2 L150.0 95.0 L152.0 91.2 L154.0 87.8 L156.0 84.8 L158.0 82.2 L160.0 80.0 L162.0 78.2 L164.0 76.8 L166.0 75.8 L168.0 75.2 L170.0 75.0 L172.0 75.2 L174.0 75.8 L176.0 76.8 L178.0 78.2 L180.0 80.0 L182.0 82.2 L184.0 84.8 L186.0 87.8 L188.0 91.2 L190.0 95.0 L192.0 99.2 L194.0 103.8 L196.0 108.8 L198.0 114.2 L200.0 120.0 L202.0 126.2 L204.0 132.8 L206.0 139.8 L208.0 147.2 L210.0 155.0 L212.0 163.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"140.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.E4E1A2":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V160\"/><path d=\"M0 80H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"91\">-5</text><text x=\"20\" y=\"91\">-4</text><text x=\"40\" y=\"91\">-3</text><text x=\"60\" y=\"91\">-2</text><text x=\"80\" y=\"91\">-1</text><text x=\"120\" y=\"91\">1</text><text x=\"140\" y=\"91\">2</text><text x=\"160\" y=\"91\">3</text><text x=\"180\" y=\"91\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"163\">-4</text><text x=\"97\" y=\"143\">-3</text><text x=\"97\" y=\"123\">-2</text><text x=\"97\" y=\"103\">-1</text><text x=\"97\" y=\"63\">1</text><text x=\"97\" y=\"43\">2</text><text x=\"97\" y=\"23\">3</text><text x=\"97\" y=\"3\">4</text></g><path d=\"M60.0 165.0 L62.0 157.2 L64.0 149.8 L66.0 142.8 L68.0 136.2 L70.0 130.0 L72.0 124.2 L74.0 118.8 L76.0 113.8 L78.0 109.2 L80.0 105.0M80.0 105.0 L82.0 101.2 L84.0 97.8 L86.0 94.8 L88.0 92.2 L90.0 90.0 L92.0 88.2 L94.0 86.8 L96.0 85.8 L98.0 85.2 L100.0 85.0 L102.0 85.2 L104.0 85.8 L106.0 86.8 L108.0 88.2 L110.0 90.0 L112.0 92.2 L114.0 94.8 L116.0 97.8 L118.0 101.2 L120.0 105.0 L122.0 109.2 L124.0 113.8 L126.0 118.8 L128.0 124.2 L130.0 130.0 L132.0 136.2 L134.0 142.8 L136.0 149.8 L138.0 157.2 L140.0 165.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"105.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.8228A6":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 224\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"200\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V200\"/><path d=\"M20 0V200\"/><path d=\"M40 0V200\"/><path d=\"M60 0V200\"/><path d=\"M80 0V200\"/><path d=\"M100 0V200\"/><path d=\"M120 0V200\"/><path d=\"M140 0V200\"/><path d=\"M160 0V200\"/><path d=\"M180 0V200\"/><path d=\"M0 200 H180\"/><path d=\"M0 180 H180\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V200\"/><path d=\"M0 80H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"91\">-3</text><text x=\"20\" y=\"91\">-2</text><text x=\"40\" y=\"91\">-1</text><text x=\"80\" y=\"91\">1</text><text x=\"100\" y=\"91\">2</text><text x=\"120\" y=\"91\">3</text><text x=\"140\" y=\"91\">4</text><text x=\"160\" y=\"91\">5</text><text x=\"180\" y=\"91\">6</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"203\">-6</text><text x=\"57\" y=\"183\">-5</text><text x=\"57\" y=\"163\">-4</text><text x=\"57\" y=\"143\">-3</text><text x=\"57\" y=\"123\">-2</text><text x=\"57\" y=\"103\">-1</text><text x=\"57\" y=\"63\">1</text><text x=\"57\" y=\"43\">2</text><text x=\"57\" y=\"23\">3</text><text x=\"57\" y=\"3\">4</text></g><path d=\"M40.0 200.0 L80.0 100.0M80.0 50.0 L100.0 100.0 L120.0 150.0M120.0 150.0 L150.0 105.0 L180.0 60.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"100.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"80.0\" cy=\"50.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"120.0\" cy=\"150.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.4296C4":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V160\"/><path d=\"M0 100H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"111\">-3</text><text x=\"20\" y=\"111\">-2</text><text x=\"40\" y=\"111\">-1</text><text x=\"80\" y=\"111\">1</text><text x=\"100\" y=\"111\">2</text><text x=\"120\" y=\"111\">3</text><text x=\"140\" y=\"111\">4</text><text x=\"160\" y=\"111\">5</text><text x=\"180\" y=\"111\">6</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"163\">-3</text><text x=\"57\" y=\"143\">-2</text><text x=\"57\" y=\"123\">-1</text><text x=\"57\" y=\"83\">1</text><text x=\"57\" y=\"63\">2</text><text x=\"57\" y=\"43\">3</text><text x=\"57\" y=\"23\">4</text><text x=\"57\" y=\"3\">5</text></g><path d=\"M100.0 50.0 L110.0 80.0 L120.0 110.0M120.0 110.0 L150.0 5.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"40.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"100.0\" cy=\"50.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"120.0\" cy=\"110.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.FD51C3":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 248 364\" role=\"img\" aria-label=\"График функции\" style=\"max-width:248px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"220\" height=\"340\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V340\"/><path d=\"M20 0V340\"/><path d=\"M40 0V340\"/><path d=\"M60 0V340\"/><path d=\"M80 0V340\"/><path d=\"M100 0V340\"/><path d=\"M120 0V340\"/><path d=\"M140 0V340\"/><path d=\"M160 0V340\"/><path d=\"M180 0V340\"/><path d=\"M200 0V340\"/><path d=\"M220 0V340\"/><path d=\"M0 340 H220\"/><path d=\"M0 320 H220\"/><path d=\"M0 300 H220\"/><path d=\"M0 280 H220\"/><path d=\"M0 260 H220\"/><path d=\"M0 240 H220\"/><path d=\"M0 220 H220\"/><path d=\"M0 200 H220\"/><path d=\"M0 180 H220\"/><path d=\"M0 160 H220\"/><path d=\"M0 140 H220\"/><path d=\"M0 120 H220\"/><path d=\"M0 100 H220\"/><path d=\"M0 80 H220\"/><path d=\"M0 60 H220\"/><path d=\"M0 40 H220\"/><path d=\"M0 20 H220\"/><path d=\"M0 0 H220\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M120 0V340\"/><path d=\"M0 220H220\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"231\">-6</text><text x=\"20\" y=\"231\">-5</text><text x=\"40\" y=\"231\">-4</text><text x=\"60\" y=\"231\">-3</text><text x=\"80\" y=\"231\">-2</text><text x=\"100\" y=\"231\">-1</text><text x=\"140\" y=\"231\">1</text><text x=\"160\" y=\"231\">2</text><text x=\"180\" y=\"231\">3</text><text x=\"200\" y=\"231\">4</text><text x=\"220\" y=\"231\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"117\" y=\"343\">-6</text><text x=\"117\" y=\"303\">-4</text><text x=\"117\" y=\"263\">-2</text><text x=\"117\" y=\"183\">2</text><text x=\"117\" y=\"143\">4</text><text x=\"117\" y=\"103\">6</text><text x=\"117\" y=\"63\">8</text><text x=\"117\" y=\"23\">10</text></g><path d=\"M0.0 220.0 L2.0 208.2 L4.0 196.8 L6.0 185.8 L8.0 175.2 L10.0 165.0 L12.0 155.2 L14.0 145.8 L16.0 136.8 L18.0 128.2 L20.0 120.0 L22.0 112.2 L24.0 104.8 L26.0 97.8 L28.0 91.2 L30.0 85.0 L32.0 79.2 L34.0 73.8 L36.0 68.8 L38.0 64.2 L40.0 60.0 L42.0 56.2 L44.0 52.8 L46.0 49.8 L48.0 47.2 L50.0 45.0 L52.0 43.2 L54.0 41.8 L56.0 40.8 L58.0 40.2 L60.0 40.0 L62.0 40.2 L64.0 40.8 L66.0 41.8 L68.0 43.2 L70.0 45.0 L72.0 47.2 L74.0 49.8 L76.0 52.8 L78.0 56.2 L80.0 60.0 L82.0 64.2 L84.0 68.8 L86.0 73.8 L88.0 79.2 L90.0 85.0 L92.0 91.2 L94.0 97.8 L96.0 104.8 L98.0 112.2 L100.0 120.0 L102.0 128.2 L104.0 136.8 L106.0 145.8 L108.0 155.2 L110.0 165.0 L112.0 175.2 L114.0 185.8 L116.0 196.8 L118.0 208.2 L120.0 220.0M120.0 220.0 L122.0 227.8 L124.0 235.2 L126.0 242.2 L128.0 248.8 L130.0 255.0 L132.0 260.8 L134.0 266.2 L136.0 271.2 L138.0 275.8 L140.0 280.0 L142.0 283.8 L144.0 287.2 L146.0 290.2 L148.0 292.8 L150.0 295.0 L152.0 296.8 L154.0 298.2 L156.0 299.2 L158.0 299.8 L160.0 300.0 L162.0 299.8 L164.0 299.2 L166.0 298.2 L168.0 296.8 L170.0 295.0 L172.0 292.8 L174.0 290.2 L176.0 287.2 L178.0 283.8 L180.0 280.0 L182.0 275.8 L184.0 271.2 L186.0 266.2 L188.0 260.8 L190.0 255.0 L192.0 248.8 L194.0 242.2 L196.0 235.2 L198.0 227.8 L200.0 220.0 L202.0 211.8 L204.0 203.2 L206.0 194.2 L208.0 184.8 L210.0 175.0 L212.0 164.8 L214.0 154.2 L216.0 143.2 L218.0 131.8 L220.0 120.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"120.0\" cy=\"220.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.B6A5C4":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V160\"/><path d=\"M0 60H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"71\">-4</text><text x=\"20\" y=\"71\">-3</text><text x=\"40\" y=\"71\">-2</text><text x=\"60\" y=\"71\">-1</text><text x=\"100\" y=\"71\">1</text><text x=\"120\" y=\"71\">2</text><text x=\"140\" y=\"71\">3</text><text x=\"160\" y=\"71\">4</text><text x=\"180\" y=\"71\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"163\">-5</text><text x=\"77\" y=\"143\">-4</text><text x=\"77\" y=\"123\">-3</text><text x=\"77\" y=\"103\">-2</text><text x=\"77\" y=\"83\">-1</text><text x=\"77\" y=\"43\">1</text><text x=\"77\" y=\"23\">2</text><text x=\"77\" y=\"3\">3</text></g><path d=\"M24.0 160.8 L26.0 151.8 L28.0 143.2 L30.0 135.0 L32.0 127.2 L34.0 119.8 L36.0 112.8 L38.0 106.2 L40.0 100.0 L42.0 94.2 L44.0 88.8 L46.0 83.8 L48.0 79.2 L50.0 75.0 L52.0 71.2 L54.0 67.8 L56.0 64.8 L58.0 62.2 L60.0 60.0 L62.0 58.2 L64.0 56.8 L66.0 55.8 L68.0 55.2 L70.0 55.0 L72.0 55.2 L74.0 55.8 L76.0 56.8 L78.0 58.2 L80.0 60.0M80.0 60.0 L82.0 65.8 L84.0 71.2 L86.0 76.2 L88.0 80.8 L90.0 85.0 L92.0 88.8 L94.0 92.2 L96.0 95.2 L98.0 97.8 L100.0 100.0 L102.0 101.8 L104.0 103.2 L106.0 104.2 L108.0 104.8 L110.0 105.0 L112.0 104.8 L114.0 104.2 L116.0 103.2 L118.0 101.8 L120.0 100.0 L122.0 97.8 L124.0 95.2 L126.0 92.2 L128.0 88.8 L130.0 85.0 L132.0 80.8 L134.0 76.2 L136.0 71.2 L138.0 65.8 L140.0 60.0 L142.0 53.8 L144.0 47.2 L146.0 40.2 L148.0 32.8 L150.0 25.0 L152.0 16.8 L154.0 8.2 L156.0 -0.8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"60.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.BCD2CD":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V160\"/><path d=\"M0 120H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-5</text><text x=\"20\" y=\"131\">-4</text><text x=\"40\" y=\"131\">-3</text><text x=\"60\" y=\"131\">-2</text><text x=\"80\" y=\"131\">-1</text><text x=\"120\" y=\"131\">1</text><text x=\"140\" y=\"131\">2</text><text x=\"160\" y=\"131\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"163\">-2</text><text x=\"97\" y=\"143\">-1</text><text x=\"97\" y=\"103\">1</text><text x=\"97\" y=\"83\">2</text><text x=\"97\" y=\"63\">3</text><text x=\"97\" y=\"43\">4</text><text x=\"97\" y=\"23\">5</text><text x=\"97\" y=\"3\">6</text></g><path d=\"M60.0 100.0 L62.0 103.8 L64.0 107.2 L66.0 110.2 L68.0 112.8 L70.0 115.0 L72.0 116.8 L74.0 118.2 L76.0 119.2 L78.0 119.8 L80.0 120.0 L82.0 119.8 L84.0 119.2 L86.0 118.2 L88.0 116.8 L90.0 115.0 L92.0 112.8 L94.0 110.2 L96.0 107.2 L98.0 103.8 L100.0 100.0 L102.0 95.8 L104.0 91.2 L106.0 86.2 L108.0 80.8 L110.0 75.0 L112.0 68.8 L114.0 62.2 L116.0 55.2 L118.0 47.8 L120.0 40.0 L122.0 31.8 L124.0 23.2 L126.0 14.2 L128.0 4.8 L130.0 -5.0M0.0 100.0 L30.0 70.0 L60.0 40.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"40.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"60.0\" cy=\"100.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.2939C4":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V160\"/><path d=\"M0 120H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-4</text><text x=\"20\" y=\"131\">-3</text><text x=\"40\" y=\"131\">-2</text><text x=\"60\" y=\"131\">-1</text><text x=\"100\" y=\"131\">1</text><text x=\"120\" y=\"131\">2</text><text x=\"140\" y=\"131\">3</text><text x=\"160\" y=\"131\">4</text><text x=\"180\" y=\"131\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"163\">-2</text><text x=\"77\" y=\"143\">-1</text><text x=\"77\" y=\"103\">1</text><text x=\"77\" y=\"83\">2</text><text x=\"77\" y=\"63\">3</text><text x=\"77\" y=\"43\">4</text><text x=\"77\" y=\"23\">5</text><text x=\"77\" y=\"3\">6</text></g><path d=\"M0.0 125.0 L2.0 125.1 L4.0 125.3 L6.0 125.4 L8.0 125.6 L10.0 125.7 L12.0 125.9 L14.0 126.1 L16.0 126.2 L18.0 126.5 L20.0 126.7 L22.0 126.9 L24.0 127.1 L26.0 127.4 L28.0 127.7 L30.0 128.0 L32.0 128.3 L34.0 128.7 L36.0 129.1 L38.0 129.5 L40.0 130.0 L42.0 130.5 L44.0 131.1 L46.0 131.8 L48.0 132.5 L50.0 133.3 L52.0 134.3 L54.0 135.4 L56.0 136.7 L58.0 138.2 L60.0 140.0 L62.0 142.2 L64.0 145.0 L66.0 148.6 L68.0 153.3 L70.0 160.0M84.2 24.0 L86.2 56.0 L88.3 72.0 L90.4 81.6 L92.5 88.0 L94.6 92.6 L96.7 96.0 L98.8 98.7 L100.8 100.8 L102.9 102.5 L105.0 104.0M105.0 104.0 L107.0 105.2 L109.1 106.2 L111.1 107.1 L113.1 107.9 L115.1 108.6 L117.2 109.2 L119.2 109.8 L121.2 110.3 L123.2 110.8 L125.3 111.2 L127.3 111.5 L129.3 111.9 L131.4 112.2 L133.4 112.5 L135.4 112.8 L137.4 113.0 L139.5 113.3 L141.5 113.5 L143.5 113.7 L145.5 113.9 L147.6 114.1 L149.6 114.3 L151.6 114.4 L153.6 114.6 L155.7 114.7 L157.7 114.9 L159.7 115.0 L161.8 115.1 L163.8 115.2 L165.8 115.3 L167.8 115.4 L169.9 115.5 L171.9 115.6 L173.9 115.7 L175.9 115.8 L178.0 115.9 L180.0 116.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"105.0\" cy=\"104.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.2029CA":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 248 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:248px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"220\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M220 0V160\"/><path d=\"M0 160 H220\"/><path d=\"M0 140 H220\"/><path d=\"M0 120 H220\"/><path d=\"M0 100 H220\"/><path d=\"M0 80 H220\"/><path d=\"M0 60 H220\"/><path d=\"M0 40 H220\"/><path d=\"M0 20 H220\"/><path d=\"M0 0 H220\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M160 0V160\"/><path d=\"M0 120H220\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-8</text><text x=\"20\" y=\"131\">-7</text><text x=\"40\" y=\"131\">-6</text><text x=\"60\" y=\"131\">-5</text><text x=\"80\" y=\"131\">-4</text><text x=\"100\" y=\"131\">-3</text><text x=\"120\" y=\"131\">-2</text><text x=\"140\" y=\"131\">-1</text><text x=\"180\" y=\"131\">1</text><text x=\"200\" y=\"131\">2</text><text x=\"220\" y=\"131\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"157\" y=\"163\">-2</text><text x=\"157\" y=\"143\">-1</text><text x=\"157\" y=\"103\">1</text><text x=\"157\" y=\"83\">2</text><text x=\"157\" y=\"63\">3</text><text x=\"157\" y=\"43\">4</text><text x=\"157\" y=\"23\">5</text><text x=\"157\" y=\"3\">6</text></g><path d=\"M0.0 97.5 L2.0 97.5 L4.0 97.4 L6.0 97.4 L8.0 97.4 L10.0 97.3 L12.0 97.3 L14.0 97.3 L16.0 97.2 L18.0 97.2 L20.0 97.1 L22.0 97.1 L24.0 97.1 L26.0 97.0 L28.0 97.0 L30.0 96.9 L32.0 96.9 L34.0 96.8 L36.0 96.8 L38.0 96.7 L40.0 96.7 L42.0 96.6 L44.0 96.6 L46.0 96.5 L48.0 96.4 L50.0 96.4 L52.0 96.3 L54.0 96.2 L56.0 96.2 L58.0 96.1 L60.0 96.0M60.0 96.0 L62.0 95.9 L64.0 95.8 L66.0 95.7 L68.0 95.7 L70.0 95.6 L72.0 95.5 L74.0 95.3 L76.0 95.2 L78.0 95.1 L80.0 95.0 L82.0 94.9 L84.0 94.7 L86.0 94.6 L88.0 94.4 L90.0 94.3 L92.0 94.1 L94.0 93.9 L96.0 93.8 L98.0 93.5 L100.0 93.3 L102.0 93.1 L104.0 92.9 L106.0 92.6 L108.0 92.3 L110.0 92.0 L112.0 91.7 L114.0 91.3 L116.0 90.9 L118.0 90.5 L120.0 90.0 L122.0 89.5 L124.0 88.9 L126.0 88.2 L128.0 87.5 L130.0 86.7 L132.0 85.7 L134.0 84.6 L136.0 83.3 L138.0 81.8 L140.0 80.0 L142.0 77.8 L144.0 75.0 L146.0 71.4 L148.0 66.7 L150.0 60.0 L152.0 50.0 L154.0 33.3 L156.0 0.0M166.0 166.7 L168.0 150.0 L170.0 140.0 L172.0 133.3 L174.0 128.6 L176.0 125.0 L178.0 122.2 L180.0 120.0 L182.0 118.2 L184.0 116.7 L186.0 115.4 L188.0 114.3 L190.0 113.3 L192.0 112.5 L194.0 111.8 L196.0 111.1 L198.0 110.5 L200.0 110.0 L202.0 109.5 L204.0 109.1 L206.0 108.7 L208.0 108.3 L210.0 108.0 L212.0 107.7 L214.0 107.4 L216.0 107.1 L218.0 106.9 L220.0 106.7\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"96.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.DC01C3":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V160\"/><path d=\"M0 100H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"111\">-5</text><text x=\"20\" y=\"111\">-4</text><text x=\"40\" y=\"111\">-3</text><text x=\"60\" y=\"111\">-2</text><text x=\"80\" y=\"111\">-1</text><text x=\"120\" y=\"111\">1</text><text x=\"140\" y=\"111\">2</text><text x=\"160\" y=\"111\">3</text><text x=\"180\" y=\"111\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"163\">-3</text><text x=\"97\" y=\"143\">-2</text><text x=\"97\" y=\"123\">-1</text><text x=\"97\" y=\"83\">1</text><text x=\"97\" y=\"63\">2</text><text x=\"97\" y=\"43\">3</text><text x=\"97\" y=\"23\">4</text><text x=\"97\" y=\"3\">5</text></g><path d=\"M0.0 104.0 L2.0 104.1 L4.0 104.2 L6.1 104.3 L8.1 104.4 L10.1 104.4 L12.1 104.6 L14.1 104.7 L16.1 104.8 L18.2 104.9 L20.2 105.0 L22.2 105.1 L24.2 105.3 L26.2 105.4 L28.2 105.6 L30.3 105.7 L32.3 105.9 L34.3 106.1 L36.3 106.3 L38.3 106.5 L40.4 106.7 L42.4 106.9 L44.4 107.2 L46.4 107.5 L48.4 107.8 L50.4 108.1 L52.5 108.4 L54.5 108.8 L56.5 109.2 L58.5 109.6 L60.5 110.1 L62.5 110.7 L64.6 111.3 L66.6 112.0 L68.6 112.7 L70.6 113.6 L72.6 114.6 L74.6 115.8 L76.7 117.1M76.7 117.1 L78.8 118.9 L80.9 121.0 L83.0 123.6 L85.2 126.9 L87.3 131.4 L89.4 137.7 L91.5 147.1 L93.6 162.9M104.0 0.0 L106.0 33.3 L108.0 50.0 L110.0 60.0 L112.0 66.7 L114.0 71.4 L116.0 75.0 L118.0 77.8 L120.0 80.0 L122.0 81.8 L124.0 83.3 L126.0 84.6 L128.0 85.7 L130.0 86.7 L132.0 87.5 L134.0 88.2 L136.0 88.9 L138.0 89.5 L140.0 90.0 L142.0 90.5 L144.0 90.9 L146.0 91.3 L148.0 91.7 L150.0 92.0 L152.0 92.3 L154.0 92.6 L156.0 92.9 L158.0 93.1 L160.0 93.3 L162.0 93.5 L164.0 93.8 L166.0 93.9 L168.0 94.1 L170.0 94.3 L172.0 94.4 L174.0 94.6 L176.0 94.7 L178.0 94.9 L180.0 95.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"76.7\" cy=\"117.1\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.93A1CB":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V160\"/><path d=\"M0 120H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-3</text><text x=\"20\" y=\"131\">-2</text><text x=\"40\" y=\"131\">-1</text><text x=\"80\" y=\"131\">1</text><text x=\"100\" y=\"131\">2</text><text x=\"120\" y=\"131\">3</text><text x=\"140\" y=\"131\">4</text><text x=\"160\" y=\"131\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"163\">-2</text><text x=\"57\" y=\"143\">-1</text><text x=\"57\" y=\"103\">1</text><text x=\"57\" y=\"83\">2</text><text x=\"57\" y=\"63\">3</text><text x=\"57\" y=\"43\">4</text><text x=\"57\" y=\"23\">5</text><text x=\"57\" y=\"3\">6</text></g><path d=\"M80.0 80.0 L82.0 83.8 L84.0 87.2 L86.0 90.2 L88.0 92.8 L90.0 95.0 L92.0 96.8 L94.0 98.2 L96.0 99.2 L98.0 99.8 L100.0 100.0 L102.0 99.8 L104.0 99.2 L106.0 98.2 L108.0 96.8 L110.0 95.0 L112.0 92.8 L114.0 90.2 L116.0 87.2 L118.0 83.8 L120.0 80.0 L122.0 75.8 L124.0 71.2 L126.0 66.2 L128.0 60.8 L130.0 55.0 L132.0 48.8 L134.0 42.2 L136.0 35.2 L138.0 27.8 L140.0 20.0 L142.0 11.8 L144.0 3.2 L146.0 -5.8M0.0 120.0 L40.0 80.0 L80.0 40.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"40.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"80.0\" cy=\"80.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.644EC3":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V160\"/><path d=\"M0 100H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"111\">-4</text><text x=\"20\" y=\"111\">-3</text><text x=\"40\" y=\"111\">-2</text><text x=\"60\" y=\"111\">-1</text><text x=\"100\" y=\"111\">1</text><text x=\"120\" y=\"111\">2</text><text x=\"140\" y=\"111\">3</text><text x=\"160\" y=\"111\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"163\">-3</text><text x=\"77\" y=\"143\">-2</text><text x=\"77\" y=\"123\">-1</text><text x=\"77\" y=\"83\">1</text><text x=\"77\" y=\"63\">2</text><text x=\"77\" y=\"43\">3</text><text x=\"77\" y=\"23\">4</text><text x=\"77\" y=\"3\">5</text></g><path d=\"M0.0 107.5 L2.0 107.7 L4.0 107.9 L6.0 108.1 L8.0 108.3 L10.0 108.6 L12.0 108.8 L14.0 109.1 L16.0 109.4 L18.0 109.7 L20.0 110.0 L22.0 110.3 L24.0 110.7 L26.0 111.1 L28.0 111.5 L30.0 112.0 L32.0 112.5 L34.0 113.0 L36.0 113.6 L38.0 114.3 L40.0 115.0 L42.0 115.8 L44.0 116.7 L46.0 117.6 L48.0 118.8 L50.0 120.0M50.0 120.0 L65.0 110.0 L80.0 100.0M86.0 0.0 L88.0 25.0 L90.0 40.0 L92.0 50.0 L94.0 57.1 L96.0 62.5 L98.0 66.7 L100.0 70.0 L102.0 72.7 L104.0 75.0 L106.0 76.9 L108.0 78.6 L110.0 80.0M110.0 80.0 L135.0 63.3 L160.0 46.7\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"50.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"80.0\" cy=\"100.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"110.0\" cy=\"80.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.B1979C":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 248 364\" role=\"img\" aria-label=\"График функции\" style=\"max-width:248px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"220\" height=\"340\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V340\"/><path d=\"M20 0V340\"/><path d=\"M40 0V340\"/><path d=\"M60 0V340\"/><path d=\"M80 0V340\"/><path d=\"M100 0V340\"/><path d=\"M120 0V340\"/><path d=\"M140 0V340\"/><path d=\"M160 0V340\"/><path d=\"M180 0V340\"/><path d=\"M200 0V340\"/><path d=\"M220 0V340\"/><path d=\"M0 340 H220\"/><path d=\"M0 320 H220\"/><path d=\"M0 300 H220\"/><path d=\"M0 280 H220\"/><path d=\"M0 260 H220\"/><path d=\"M0 240 H220\"/><path d=\"M0 220 H220\"/><path d=\"M0 200 H220\"/><path d=\"M0 180 H220\"/><path d=\"M0 160 H220\"/><path d=\"M0 140 H220\"/><path d=\"M0 120 H220\"/><path d=\"M0 100 H220\"/><path d=\"M0 80 H220\"/><path d=\"M0 60 H220\"/><path d=\"M0 40 H220\"/><path d=\"M0 20 H220\"/><path d=\"M0 0 H220\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V340\"/><path d=\"M0 120H220\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-5</text><text x=\"20\" y=\"131\">-4</text><text x=\"40\" y=\"131\">-3</text><text x=\"60\" y=\"131\">-2</text><text x=\"80\" y=\"131\">-1</text><text x=\"120\" y=\"131\">1</text><text x=\"140\" y=\"131\">2</text><text x=\"160\" y=\"131\">3</text><text x=\"180\" y=\"131\">4</text><text x=\"200\" y=\"131\">5</text><text x=\"220\" y=\"131\">6</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"323\">-10</text><text x=\"97\" y=\"283\">-8</text><text x=\"97\" y=\"243\">-6</text><text x=\"97\" y=\"203\">-4</text><text x=\"97\" y=\"163\">-2</text><text x=\"97\" y=\"83\">2</text><text x=\"97\" y=\"43\">4</text><text x=\"97\" y=\"3\">6</text></g><path d=\"M0.0 220.0 L2.0 208.2 L4.0 196.8 L6.0 185.8 L8.0 175.2 L10.0 165.0 L12.0 155.2 L14.0 145.8 L16.0 136.8 L18.0 128.2 L20.0 120.0 L22.0 112.2 L24.0 104.8 L26.0 97.8 L28.0 91.2 L30.0 85.0 L32.0 79.2 L34.0 73.8 L36.0 68.8 L38.0 64.2 L40.0 60.0 L42.0 56.2 L44.0 52.8 L46.0 49.8 L48.0 47.2 L50.0 45.0 L52.0 43.2 L54.0 41.8 L56.0 40.8 L58.0 40.2 L60.0 40.0 L62.0 40.2 L64.0 40.8 L66.0 41.8 L68.0 43.2 L70.0 45.0 L72.0 47.2 L74.0 49.8 L76.0 52.8 L78.0 56.2 L80.0 60.0 L82.0 64.2 L84.0 68.8 L86.0 73.8 L88.0 79.2 L90.0 85.0 L92.0 91.2 L94.0 97.8 L96.0 104.8 L98.0 112.2 L100.0 120.0M100.0 120.0 L102.0 131.8 L104.0 143.2 L106.0 154.2 L108.0 164.8 L110.0 175.0 L112.0 184.8 L114.0 194.2 L116.0 203.2 L118.0 211.8 L120.0 220.0 L122.0 227.8 L124.0 235.2 L126.0 242.2 L128.0 248.8 L130.0 255.0 L132.0 260.8 L134.0 266.2 L136.0 271.2 L138.0 275.8 L140.0 280.0 L142.0 283.8 L144.0 287.2 L146.0 290.2 L148.0 292.8 L150.0 295.0 L152.0 296.8 L154.0 298.2 L156.0 299.2 L158.0 299.8 L160.0 300.0 L162.0 299.8 L164.0 299.2 L166.0 298.2 L168.0 296.8 L170.0 295.0 L172.0 292.8 L174.0 290.2 L176.0 287.2 L178.0 283.8 L180.0 280.0 L182.0 275.8 L184.0 271.2 L186.0 266.2 L188.0 260.8 L190.0 255.0 L192.0 248.8 L194.0 242.2 L196.0 235.2 L198.0 227.8 L200.0 220.0 L202.0 211.8 L204.0 203.2 L206.0 194.2 L208.0 184.8 L210.0 175.0 L212.0 164.8 L214.0 154.2 L216.0 143.2 L218.0 131.8 L220.0 120.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.2C6E96":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V160\"/><path d=\"M0 120H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-5</text><text x=\"20\" y=\"131\">-4</text><text x=\"40\" y=\"131\">-3</text><text x=\"60\" y=\"131\">-2</text><text x=\"80\" y=\"131\">-1</text><text x=\"120\" y=\"131\">1</text><text x=\"140\" y=\"131\">2</text><text x=\"160\" y=\"131\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"163\">-2</text><text x=\"97\" y=\"143\">-1</text><text x=\"97\" y=\"103\">1</text><text x=\"97\" y=\"83\">2</text><text x=\"97\" y=\"63\">3</text><text x=\"97\" y=\"43\">4</text><text x=\"97\" y=\"23\">5</text><text x=\"97\" y=\"3\">6</text></g><path d=\"M60.0 100.0 L62.0 103.8 L64.0 107.2 L66.0 110.2 L68.0 112.8 L70.0 115.0 L72.0 116.8 L74.0 118.2 L76.0 119.2 L78.0 119.8 L80.0 120.0 L82.0 119.8 L84.0 119.2 L86.0 118.2 L88.0 116.8 L90.0 115.0 L92.0 112.8 L94.0 110.2 L96.0 107.2 L98.0 103.8 L100.0 100.0 L102.0 95.8 L104.0 91.2 L106.0 86.2 L108.0 80.8 L110.0 75.0 L112.0 68.8 L114.0 62.2 L116.0 55.2 L118.0 47.8 L120.0 40.0 L122.0 31.8 L124.0 23.2 L126.0 14.2 L128.0 4.8 L130.0 -5.0M0.0 112.0 L2.0 111.8 L4.0 111.7 L6.0 111.5 L8.0 111.3 L10.0 111.1 L12.0 110.9 L14.0 110.7 L16.0 110.5 L18.0 110.2 L20.0 110.0 L22.0 109.7 L24.0 109.5 L26.0 109.2 L28.0 108.9 L30.0 108.6 L32.0 108.2 L34.0 107.9 L36.0 107.5 L38.0 107.1 L40.0 106.7 L42.0 106.2 L44.0 105.7 L46.0 105.2 L48.0 104.6 L50.0 104.0 L52.0 103.3 L54.0 102.6 L56.0 101.8 L58.0 101.0 L60.0 100.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"100.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.DCCD98":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V160\"/><path d=\"M0 80H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"91\">-3</text><text x=\"20\" y=\"91\">-2</text><text x=\"40\" y=\"91\">-1</text><text x=\"80\" y=\"91\">1</text><text x=\"100\" y=\"91\">2</text><text x=\"120\" y=\"91\">3</text><text x=\"140\" y=\"91\">4</text><text x=\"160\" y=\"91\">5</text><text x=\"180\" y=\"91\">6</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"163\">-4</text><text x=\"57\" y=\"143\">-3</text><text x=\"57\" y=\"123\">-2</text><text x=\"57\" y=\"103\">-1</text><text x=\"57\" y=\"63\">1</text><text x=\"57\" y=\"43\">2</text><text x=\"57\" y=\"23\">3</text><text x=\"57\" y=\"3\">4</text></g><path d=\"M50.0 115.0 L100.0 40.0M100.0 80.0 L110.0 95.0 L120.0 110.0M120.0 110.0 L150.0 20.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"40.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"100.0\" cy=\"80.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"120.0\" cy=\"110.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.F8D6E6":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V160\"/><path d=\"M0 40H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-4</text><text x=\"20\" y=\"51\">-3</text><text x=\"40\" y=\"51\">-2</text><text x=\"60\" y=\"51\">-1</text><text x=\"100\" y=\"51\">1</text><text x=\"120\" y=\"51\">2</text><text x=\"140\" y=\"51\">3</text><text x=\"160\" y=\"51\">4</text><text x=\"180\" y=\"51\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"163\">-6</text><text x=\"77\" y=\"143\">-5</text><text x=\"77\" y=\"123\">-4</text><text x=\"77\" y=\"103\">-3</text><text x=\"77\" y=\"83\">-2</text><text x=\"77\" y=\"63\">-1</text><text x=\"77\" y=\"23\">1</text><text x=\"77\" y=\"3\">2</text></g><path d=\"M40.0 165.0 L42.0 157.2 L44.0 149.8 L46.0 142.8 L48.0 136.2 L50.0 130.0 L52.0 124.2 L54.0 118.8 L56.0 113.8 L58.0 109.2 L60.0 105.0 L62.0 101.2 L64.0 97.8 L66.0 94.8 L68.0 92.2 L70.0 90.0 L72.0 88.2 L74.0 86.8 L76.0 85.8 L78.0 85.2 L80.0 85.0 L82.0 85.2 L84.0 85.8 L86.0 86.8 L88.0 88.2 L90.0 90.0 L92.0 92.2 L94.0 94.8 L96.0 97.8 L98.0 101.2 L100.0 105.0M100.0 105.0 L102.0 109.2 L104.0 113.8 L106.0 118.8 L108.0 124.2 L110.0 130.0 L112.0 136.2 L114.0 142.8 L116.0 149.8 L118.0 157.2 L120.0 165.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"105.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.59A6E0":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 244\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"220\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V220\"/><path d=\"M20 0V220\"/><path d=\"M40 0V220\"/><path d=\"M60 0V220\"/><path d=\"M80 0V220\"/><path d=\"M100 0V220\"/><path d=\"M120 0V220\"/><path d=\"M140 0V220\"/><path d=\"M160 0V220\"/><path d=\"M180 0V220\"/><path d=\"M0 220 H180\"/><path d=\"M0 200 H180\"/><path d=\"M0 180 H180\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M120 0V220\"/><path d=\"M0 40H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-6</text><text x=\"20\" y=\"51\">-5</text><text x=\"40\" y=\"51\">-4</text><text x=\"60\" y=\"51\">-3</text><text x=\"80\" y=\"51\">-2</text><text x=\"100\" y=\"51\">-1</text><text x=\"140\" y=\"51\">1</text><text x=\"160\" y=\"51\">2</text><text x=\"180\" y=\"51\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"117\" y=\"223\">-9</text><text x=\"117\" y=\"203\">-8</text><text x=\"117\" y=\"183\">-7</text><text x=\"117\" y=\"163\">-6</text><text x=\"117\" y=\"143\">-5</text><text x=\"117\" y=\"123\">-4</text><text x=\"117\" y=\"103\">-3</text><text x=\"117\" y=\"83\">-2</text><text x=\"117\" y=\"63\">-1</text><text x=\"117\" y=\"23\">1</text><text x=\"117\" y=\"3\">2</text></g><path d=\"M50.0 223.8 L52.0 213.4 L54.0 203.3 L56.0 193.6 L58.0 184.2 L60.0 175.0M60.0 175.0 L62.0 166.2 L64.0 157.6 L66.0 149.4 L68.0 141.4 L70.0 133.8 L72.0 126.4 L74.0 119.3 L76.0 112.6 L78.0 106.2 L80.0 100.0 L82.0 94.1 L84.0 88.6 L86.0 83.3 L88.0 78.4 L90.0 73.8 L92.0 69.4 L94.0 65.3 L96.0 61.6 L98.0 58.2 L100.0 55.0 L102.0 52.1 L104.0 49.6 L106.0 47.4 L108.0 45.4 L110.0 43.8 L112.0 42.4 L114.0 41.3 L116.0 40.6 L118.0 40.1 L120.0 40.0M120.0 40.0 L122.0 39.9 L124.0 39.4 L126.0 38.7 L128.0 37.6 L130.0 36.2 L132.0 34.6 L134.0 32.6 L136.0 30.4 L138.0 27.9 L140.0 25.0 L142.0 21.8 L144.0 18.4 L146.0 14.6 L148.0 10.6 L150.0 6.2 L152.0 1.6 L154.0 -3.3 L156.0 -8.6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"175.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"120.0\" cy=\"40.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.C415E2":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 284\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"260\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V260\"/><path d=\"M20 0V260\"/><path d=\"M40 0V260\"/><path d=\"M60 0V260\"/><path d=\"M80 0V260\"/><path d=\"M100 0V260\"/><path d=\"M120 0V260\"/><path d=\"M140 0V260\"/><path d=\"M160 0V260\"/><path d=\"M180 0V260\"/><path d=\"M0 260 H180\"/><path d=\"M0 240 H180\"/><path d=\"M0 220 H180\"/><path d=\"M0 200 H180\"/><path d=\"M0 180 H180\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M120 0V260\"/><path d=\"M0 40H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-6</text><text x=\"20\" y=\"51\">-5</text><text x=\"40\" y=\"51\">-4</text><text x=\"60\" y=\"51\">-3</text><text x=\"80\" y=\"51\">-2</text><text x=\"100\" y=\"51\">-1</text><text x=\"140\" y=\"51\">1</text><text x=\"160\" y=\"51\">2</text><text x=\"180\" y=\"51\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"117\" y=\"263\">-11</text><text x=\"117\" y=\"243\">-10</text><text x=\"117\" y=\"223\">-9</text><text x=\"117\" y=\"203\">-8</text><text x=\"117\" y=\"183\">-7</text><text x=\"117\" y=\"163\">-6</text><text x=\"117\" y=\"143\">-5</text><text x=\"117\" y=\"123\">-4</text><text x=\"117\" y=\"103\">-3</text><text x=\"117\" y=\"83\">-2</text><text x=\"117\" y=\"63\">-1</text><text x=\"117\" y=\"23\">1</text><text x=\"117\" y=\"3\">2</text></g><path d=\"M54.0 257.8 L56.0 244.8 L58.0 232.2 L60.0 220.0M60.0 220.0 L62.0 208.2 L64.0 196.8 L66.0 185.8 L68.0 175.2 L70.0 165.0 L72.0 155.2 L74.0 145.8 L76.0 136.8 L78.0 128.2 L80.0 120.0 L82.0 112.2 L84.0 104.8 L86.0 97.8 L88.0 91.2 L90.0 85.0 L92.0 79.2 L94.0 73.8 L96.0 68.8 L98.0 64.2 L100.0 60.0 L102.0 56.2 L104.0 52.8 L106.0 49.8 L108.0 47.2 L110.0 45.0 L112.0 43.2 L114.0 41.8 L116.0 40.8 L118.0 40.2 L120.0 40.0M120.0 40.0 L122.0 39.8 L124.0 39.2 L126.0 38.2 L128.0 36.8 L130.0 35.0 L132.0 32.8 L134.0 30.2 L136.0 27.2 L138.0 23.8 L140.0 20.0 L142.0 15.8 L144.0 11.2 L146.0 6.2 L148.0 0.8 L150.0 -5.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"220.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"120.0\" cy=\"40.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.95BEE9":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V160\"/><path d=\"M0 80H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"91\">-4</text><text x=\"20\" y=\"91\">-3</text><text x=\"40\" y=\"91\">-2</text><text x=\"60\" y=\"91\">-1</text><text x=\"100\" y=\"91\">1</text><text x=\"120\" y=\"91\">2</text><text x=\"140\" y=\"91\">3</text><text x=\"160\" y=\"91\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"163\">-4</text><text x=\"77\" y=\"143\">-3</text><text x=\"77\" y=\"123\">-2</text><text x=\"77\" y=\"103\">-1</text><text x=\"77\" y=\"63\">1</text><text x=\"77\" y=\"43\">2</text><text x=\"77\" y=\"23\">3</text><text x=\"77\" y=\"3\">4</text></g><path d=\"M0.0 85.0 L2.0 85.1 L4.0 85.3 L6.1 85.4 L8.1 85.6 L10.1 85.7 L12.1 85.9 L14.1 86.1 L16.2 86.3 L18.2 86.5 L20.2 86.7 L22.2 86.9 L24.2 87.2 L26.3 87.4 L28.3 87.7 L30.3 88.0 L32.3 88.4 L34.3 88.8 L36.4 89.2 L38.4 89.6 L40.4 90.1 L42.4 90.6 L44.4 91.2 L46.5 91.9 L48.5 92.7 L50.5 93.6 L52.5 94.6 L54.5 95.7 L56.6 97.1 L58.6 98.7 L60.6 100.6 L62.6 103.0 L64.6 106.1 L66.7 110.0M66.7 110.0 L68.9 116.0 L71.1 125.0 L73.3 140.0 L75.6 170.0M84.4 170.0 L86.7 140.0 L88.9 125.0 L91.1 116.0 L93.3 110.0M93.3 110.0 L95.4 106.1 L97.4 103.0 L99.4 100.6 L101.4 98.7 L103.4 97.1 L105.5 95.7 L107.5 94.6 L109.5 93.6 L111.5 92.7 L113.5 91.9 L115.6 91.2 L117.6 90.6 L119.6 90.1 L121.6 89.6 L123.6 89.2 L125.7 88.8 L127.7 88.4 L129.7 88.0 L131.7 87.7 L133.7 87.4 L135.8 87.2 L137.8 86.9 L139.8 86.7 L141.8 86.5 L143.8 86.3 L145.9 86.1 L147.9 85.9 L149.9 85.7 L151.9 85.6 L153.9 85.4 L156.0 85.3 L158.0 85.1 L160.0 85.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"66.7\" cy=\"110.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"93.3\" cy=\"110.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.333EE6":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 248 284\" role=\"img\" aria-label=\"График функции\" style=\"max-width:248px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"220\" height=\"260\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V260\"/><path d=\"M20 0V260\"/><path d=\"M40 0V260\"/><path d=\"M60 0V260\"/><path d=\"M80 0V260\"/><path d=\"M100 0V260\"/><path d=\"M120 0V260\"/><path d=\"M140 0V260\"/><path d=\"M160 0V260\"/><path d=\"M180 0V260\"/><path d=\"M200 0V260\"/><path d=\"M220 0V260\"/><path d=\"M0 260 H220\"/><path d=\"M0 240 H220\"/><path d=\"M0 220 H220\"/><path d=\"M0 200 H220\"/><path d=\"M0 180 H220\"/><path d=\"M0 160 H220\"/><path d=\"M0 140 H220\"/><path d=\"M0 120 H220\"/><path d=\"M0 100 H220\"/><path d=\"M0 80 H220\"/><path d=\"M0 60 H220\"/><path d=\"M0 40 H220\"/><path d=\"M0 20 H220\"/><path d=\"M0 0 H220\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M160 0V260\"/><path d=\"M0 220H220\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"231\">-8</text><text x=\"20\" y=\"231\">-7</text><text x=\"40\" y=\"231\">-6</text><text x=\"60\" y=\"231\">-5</text><text x=\"80\" y=\"231\">-4</text><text x=\"100\" y=\"231\">-3</text><text x=\"120\" y=\"231\">-2</text><text x=\"140\" y=\"231\">-1</text><text x=\"180\" y=\"231\">1</text><text x=\"200\" y=\"231\">2</text><text x=\"220\" y=\"231\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"157\" y=\"263\">-2</text><text x=\"157\" y=\"243\">-1</text><text x=\"157\" y=\"203\">1</text><text x=\"157\" y=\"183\">2</text><text x=\"157\" y=\"163\">3</text><text x=\"157\" y=\"143\">4</text><text x=\"157\" y=\"123\">5</text><text x=\"157\" y=\"103\">6</text><text x=\"157\" y=\"83\">7</text><text x=\"157\" y=\"63\">8</text><text x=\"157\" y=\"43\">9</text><text x=\"157\" y=\"23\">10</text><text x=\"157\" y=\"3\">11</text></g><path d=\"M60.0 40.0 L62.0 51.8 L64.0 63.2 L66.0 74.2 L68.0 84.8 L70.0 95.0 L72.0 104.8 L74.0 114.2 L76.0 123.2 L78.0 131.8 L80.0 140.0 L82.0 147.8 L84.0 155.2 L86.0 162.2 L88.0 168.8 L90.0 175.0 L92.0 180.8 L94.0 186.2 L96.0 191.2 L98.0 195.8 L100.0 200.0 L102.0 203.8 L104.0 207.2 L106.0 210.2 L108.0 212.8 L110.0 215.0 L112.0 216.8 L114.0 218.2 L116.0 219.2 L118.0 219.8 L120.0 220.0 L122.0 219.8 L124.0 219.2 L126.0 218.2 L128.0 216.8 L130.0 215.0 L132.0 212.8 L134.0 210.2 L136.0 207.2 L138.0 203.8 L140.0 200.0 L142.0 195.8 L144.0 191.2 L146.0 186.2 L148.0 180.8 L150.0 175.0 L152.0 168.8 L154.0 162.2 L156.0 155.2 L158.0 147.8 L160.0 140.0 L162.0 131.8 L164.0 123.2 L166.0 114.2 L168.0 104.8 L170.0 95.0 L172.0 84.8 L174.0 74.2 L176.0 63.2 L178.0 51.8 L180.0 40.0 L182.0 27.8 L184.0 15.2 L186.0 2.2M0.0 107.5 L2.0 106.1 L4.0 104.6 L6.0 103.1 L8.0 101.6 L10.0 100.0 L12.0 98.4 L14.0 96.7 L16.0 95.0 L18.0 93.2 L20.0 91.4 L22.0 89.6 L24.0 87.6 L26.0 85.7 L28.0 83.6 L30.0 81.5 L32.0 79.4 L34.0 77.1 L36.0 74.8 L38.0 72.5 L40.0 70.0 L42.0 67.5 L44.0 64.8 L46.0 62.1 L48.0 59.3 L50.0 56.4 L52.0 53.3 L54.0 50.2 L56.0 46.9 L58.0 43.5 L60.0 40.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"40.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.3B00E8":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 348 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:348px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"320\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M220 0V160\"/><path d=\"M240 0V160\"/><path d=\"M260 0V160\"/><path d=\"M280 0V160\"/><path d=\"M300 0V160\"/><path d=\"M320 0V160\"/><path d=\"M0 160 H320\"/><path d=\"M0 140 H320\"/><path d=\"M0 120 H320\"/><path d=\"M0 100 H320\"/><path d=\"M0 80 H320\"/><path d=\"M0 60 H320\"/><path d=\"M0 40 H320\"/><path d=\"M0 20 H320\"/><path d=\"M0 0 H320\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M160 0V160\"/><path d=\"M0 100H320\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"111\">-8</text><text x=\"20\" y=\"111\">-7</text><text x=\"40\" y=\"111\">-6</text><text x=\"60\" y=\"111\">-5</text><text x=\"80\" y=\"111\">-4</text><text x=\"100\" y=\"111\">-3</text><text x=\"120\" y=\"111\">-2</text><text x=\"140\" y=\"111\">-1</text><text x=\"180\" y=\"111\">1</text><text x=\"200\" y=\"111\">2</text><text x=\"220\" y=\"111\">3</text><text x=\"240\" y=\"111\">4</text><text x=\"260\" y=\"111\">5</text><text x=\"280\" y=\"111\">6</text><text x=\"300\" y=\"111\">7</text><text x=\"320\" y=\"111\">8</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"157\" y=\"163\">-3</text><text x=\"157\" y=\"143\">-2</text><text x=\"157\" y=\"123\">-1</text><text x=\"157\" y=\"83\">1</text><text x=\"157\" y=\"63\">2</text><text x=\"157\" y=\"43\">3</text><text x=\"157\" y=\"23\">4</text><text x=\"157\" y=\"3\">5</text></g><path d=\"M0.0 113.8 L2.0 113.9 L4.0 114.1 L6.0 114.3 L8.0 114.5 L10.0 114.7 L12.0 114.9 L14.0 115.1 L16.0 115.3 L18.0 115.5 L20.0 115.7 L22.0 115.9 L24.0 116.2 L26.0 116.4 L28.0 116.7 L30.0 116.9 L32.0 117.2 L34.0 117.5 L36.0 117.7 L38.0 118.0 L40.0 118.3 L42.0 118.6 L44.0 119.0 L46.0 119.3 L48.0 119.6 L50.0 120.0M50.0 120.0 L105.0 110.0 L160.0 100.0M180.0 -10.0 L182.0 0.0 L184.0 8.3 L186.0 15.4 L188.0 21.4 L190.0 26.7 L192.0 31.2 L194.0 35.3 L196.0 38.9 L198.0 42.1 L200.0 45.0 L202.0 47.6 L204.0 50.0 L206.0 52.2 L208.0 54.2 L210.0 56.0 L212.0 57.7 L214.0 59.3 L216.0 60.7 L218.0 62.1 L220.0 63.3 L222.0 64.5 L224.0 65.6 L226.0 66.7 L228.0 67.6 L230.0 68.6 L232.0 69.4 L234.0 70.3 L236.0 71.1 L238.0 71.8 L240.0 72.5 L242.0 73.2 L244.0 73.8 L246.0 74.4 L248.0 75.0 L250.0 75.6 L252.0 76.1 L254.0 76.6 L256.0 77.1 L258.0 77.6 L260.0 78.0 L262.0 78.4 L264.0 78.8 L266.0 79.2 L268.0 79.6 L270.0 80.0M270.0 80.0 L295.0 75.5 L320.0 70.9\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"50.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"160.0\" cy=\"100.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"270.0\" cy=\"80.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.769468":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 224\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"200\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V200\"/><path d=\"M20 0V200\"/><path d=\"M40 0V200\"/><path d=\"M60 0V200\"/><path d=\"M80 0V200\"/><path d=\"M100 0V200\"/><path d=\"M120 0V200\"/><path d=\"M140 0V200\"/><path d=\"M160 0V200\"/><path d=\"M180 0V200\"/><path d=\"M0 200 H180\"/><path d=\"M0 180 H180\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V200\"/><path d=\"M0 40H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-4</text><text x=\"20\" y=\"51\">-3</text><text x=\"40\" y=\"51\">-2</text><text x=\"60\" y=\"51\">-1</text><text x=\"100\" y=\"51\">1</text><text x=\"120\" y=\"51\">2</text><text x=\"140\" y=\"51\">3</text><text x=\"160\" y=\"51\">4</text><text x=\"180\" y=\"51\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"203\">-8</text><text x=\"77\" y=\"183\">-7</text><text x=\"77\" y=\"163\">-6</text><text x=\"77\" y=\"143\">-5</text><text x=\"77\" y=\"123\">-4</text><text x=\"77\" y=\"103\">-3</text><text x=\"77\" y=\"83\">-2</text><text x=\"77\" y=\"63\">-1</text><text x=\"77\" y=\"23\">1</text><text x=\"77\" y=\"3\">2</text></g><path d=\"M0.0 135.0 L2.0 134.9 L4.0 134.7 L6.0 134.6 L8.0 134.4 L10.0 134.3 L12.0 134.1 L14.0 133.9 L16.0 133.8 L18.0 133.5 L20.0 133.3 L22.0 133.1 L24.0 132.9 L26.0 132.6 L28.0 132.3 L30.0 132.0 L32.0 131.7 L34.0 131.3 L36.0 130.9 L38.0 130.5 L40.0 130.0 L42.0 129.5 L44.0 128.9 L46.0 128.2 L48.0 127.5 L50.0 126.7 L52.0 125.7 L54.0 124.6 L56.0 123.3 L58.0 121.8 L60.0 120.0 L62.0 117.8 L64.0 115.0 L66.0 111.4 L68.0 106.7 L70.0 100.0 L72.0 90.0 L74.0 73.3 L76.0 40.0M86.0 206.7 L88.0 190.0 L90.0 180.0 L92.0 173.3 L94.0 168.6 L96.0 165.0 L98.0 162.2 L100.0 160.0M100.0 160.0 L102.0 158.2 L104.0 156.7 L106.0 155.4 L108.0 154.3 L110.0 153.3 L112.0 152.5 L114.0 151.8 L116.0 151.1 L118.0 150.5 L120.0 150.0 L122.0 149.5 L124.0 149.1 L126.0 148.7 L128.0 148.3 L130.0 148.0 L132.0 147.7 L134.0 147.4 L136.0 147.1 L138.0 146.9 L140.0 146.7 L142.0 146.5 L144.0 146.2 L146.0 146.1 L148.0 145.9 L150.0 145.7 L152.0 145.6 L154.0 145.4 L156.0 145.3 L158.0 145.1 L160.0 145.0 L162.0 144.9 L164.0 144.8 L166.0 144.7 L168.0 144.5 L170.0 144.4 L172.0 144.3 L174.0 144.3 L176.0 144.2 L178.0 144.1 L180.0 144.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"160.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.B0AF6B":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V160\"/><path d=\"M0 40H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-5</text><text x=\"20\" y=\"51\">-4</text><text x=\"40\" y=\"51\">-3</text><text x=\"60\" y=\"51\">-2</text><text x=\"80\" y=\"51\">-1</text><text x=\"120\" y=\"51\">1</text><text x=\"140\" y=\"51\">2</text><text x=\"160\" y=\"51\">3</text><text x=\"180\" y=\"51\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"163\">-6</text><text x=\"97\" y=\"143\">-5</text><text x=\"97\" y=\"123\">-4</text><text x=\"97\" y=\"103\">-3</text><text x=\"97\" y=\"83\">-2</text><text x=\"97\" y=\"63\">-1</text><text x=\"97\" y=\"23\">1</text><text x=\"97\" y=\"3\">2</text></g><path d=\"M60.0 165.0 L62.0 157.2 L64.0 149.8 L66.0 142.8 L68.0 136.2 L70.0 130.0 L72.0 124.2 L74.0 118.8 L76.0 113.8 L78.0 109.2 L80.0 105.0M80.0 105.0 L82.0 101.2 L84.0 97.8 L86.0 94.8 L88.0 92.2 L90.0 90.0 L92.0 88.2 L94.0 86.8 L96.0 85.8 L98.0 85.2 L100.0 85.0 L102.0 85.2 L104.0 85.8 L106.0 86.8 L108.0 88.2 L110.0 90.0 L112.0 92.2 L114.0 94.8 L116.0 97.8 L118.0 101.2 L120.0 105.0 L122.0 109.2 L124.0 113.8 L126.0 118.8 L128.0 124.2 L130.0 130.0 L132.0 136.2 L134.0 142.8 L136.0 149.8 L138.0 157.2 L140.0 165.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"105.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.1A7E63":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V160\"/><path d=\"M0 120H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-5</text><text x=\"20\" y=\"131\">-4</text><text x=\"40\" y=\"131\">-3</text><text x=\"60\" y=\"131\">-2</text><text x=\"80\" y=\"131\">-1</text><text x=\"120\" y=\"131\">1</text><text x=\"140\" y=\"131\">2</text><text x=\"160\" y=\"131\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"163\">-2</text><text x=\"97\" y=\"143\">-1</text><text x=\"97\" y=\"103\">1</text><text x=\"97\" y=\"83\">2</text><text x=\"97\" y=\"63\">3</text><text x=\"97\" y=\"43\">4</text><text x=\"97\" y=\"23\">5</text><text x=\"97\" y=\"3\">6</text></g><path d=\"M20.0 0.0 L22.0 9.8 L24.0 19.2 L26.0 28.2 L28.0 36.8 L30.0 45.0 L32.0 52.8 L34.0 60.2 L36.0 67.2 L38.0 73.8 L40.0 80.0 L42.0 85.8 L44.0 91.2 L46.0 96.2 L48.0 100.8 L50.0 105.0 L52.0 108.8 L54.0 112.2 L56.0 115.2 L58.0 117.8 L60.0 120.0M60.0 120.0 L62.0 118.2 L64.0 116.8 L66.0 115.8 L68.0 115.2 L70.0 115.0 L72.0 115.2 L74.0 115.8 L76.0 116.8 L78.0 118.2 L80.0 120.0M80.0 120.0 L82.0 117.8 L84.0 115.2 L86.0 112.2 L88.0 108.8 L90.0 105.0 L92.0 100.8 L94.0 96.2 L96.0 91.2 L98.0 85.8 L100.0 80.0 L102.0 73.8 L104.0 67.2 L106.0 60.2 L108.0 52.8 L110.0 45.0 L112.0 36.8 L114.0 28.2 L116.0 19.2 L118.0 9.8 L120.0 0.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"80.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.C1266B":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 224\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"200\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V200\"/><path d=\"M20 0V200\"/><path d=\"M40 0V200\"/><path d=\"M60 0V200\"/><path d=\"M80 0V200\"/><path d=\"M100 0V200\"/><path d=\"M120 0V200\"/><path d=\"M140 0V200\"/><path d=\"M160 0V200\"/><path d=\"M0 200 H160\"/><path d=\"M0 180 H160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V200\"/><path d=\"M0 40H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-3</text><text x=\"20\" y=\"51\">-2</text><text x=\"40\" y=\"51\">-1</text><text x=\"80\" y=\"51\">1</text><text x=\"100\" y=\"51\">2</text><text x=\"120\" y=\"51\">3</text><text x=\"140\" y=\"51\">4</text><text x=\"160\" y=\"51\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"203\">-8</text><text x=\"57\" y=\"183\">-7</text><text x=\"57\" y=\"163\">-6</text><text x=\"57\" y=\"143\">-5</text><text x=\"57\" y=\"123\">-4</text><text x=\"57\" y=\"103\">-3</text><text x=\"57\" y=\"83\">-2</text><text x=\"57\" y=\"63\">-1</text><text x=\"57\" y=\"23\">1</text><text x=\"57\" y=\"3\">2</text></g><path d=\"M0.0 133.3 L2.0 133.1 L4.0 132.9 L6.0 132.6 L8.0 132.3 L10.0 132.0 L12.0 131.7 L14.0 131.3 L16.0 130.9 L18.0 130.5 L20.0 130.0 L22.0 129.5 L24.0 128.9 L26.0 128.2 L28.0 127.5 L30.0 126.7 L32.0 125.7 L34.0 124.6 L36.0 123.3 L38.0 121.8 L40.0 120.0 L42.0 117.8 L44.0 115.0 L46.0 111.4 L48.0 106.7 L50.0 100.0 L52.0 90.0 L54.0 73.3 L56.0 40.0M66.0 206.7 L68.0 190.0 L70.0 180.0 L72.0 173.3 L74.0 168.6 L76.0 165.0 L78.0 162.2 L80.0 160.0 L82.0 158.2 L84.0 156.7 L86.0 155.4 L88.0 154.3 L90.0 153.3 L92.0 152.5 L94.0 151.8 L96.0 151.1 L98.0 150.5 L100.0 150.0M100.0 150.0 L102.0 149.5 L104.0 149.1 L106.0 148.7 L108.0 148.3 L110.0 148.0 L112.0 147.7 L114.0 147.4 L116.0 147.1 L118.0 146.9 L120.0 146.7 L122.0 146.5 L124.0 146.2 L126.0 146.1 L128.0 145.9 L130.0 145.7 L132.0 145.6 L134.0 145.4 L136.0 145.3 L138.0 145.1 L140.0 145.0 L142.0 144.9 L144.0 144.8 L146.0 144.7 L148.0 144.5 L150.0 144.4 L152.0 144.3 L154.0 144.3 L156.0 144.2 L158.0 144.1 L160.0 144.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"150.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.EFF36A":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V160\"/><path d=\"M0 120H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-5</text><text x=\"20\" y=\"131\">-4</text><text x=\"40\" y=\"131\">-3</text><text x=\"60\" y=\"131\">-2</text><text x=\"80\" y=\"131\">-1</text><text x=\"120\" y=\"131\">1</text><text x=\"140\" y=\"131\">2</text><text x=\"160\" y=\"131\">3</text><text x=\"180\" y=\"131\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"163\">-2</text><text x=\"97\" y=\"143\">-1</text><text x=\"97\" y=\"103\">1</text><text x=\"97\" y=\"83\">2</text><text x=\"97\" y=\"63\">3</text><text x=\"97\" y=\"43\">4</text><text x=\"97\" y=\"23\">5</text><text x=\"97\" y=\"3\">6</text></g><path d=\"M80.0 80.0 L82.0 83.8 L84.0 87.2 L86.0 90.2 L88.0 92.8 L90.0 95.0 L92.0 96.8 L94.0 98.2 L96.0 99.2 L98.0 99.8 L100.0 100.0 L102.0 99.8 L104.0 99.2 L106.0 98.2 L108.0 96.8 L110.0 95.0 L112.0 92.8 L114.0 90.2 L116.0 87.2 L118.0 83.8 L120.0 80.0 L122.0 75.8 L124.0 71.2 L126.0 66.2 L128.0 60.8 L130.0 55.0 L132.0 48.8 L134.0 42.2 L136.0 35.2 L138.0 27.8 L140.0 20.0 L142.0 11.8 L144.0 3.2 L146.0 -5.8M0.0 104.0 L2.0 103.7 L4.0 103.3 L6.0 103.0 L8.0 102.6 L10.0 102.2 L12.0 101.8 L14.0 101.4 L16.0 101.0 L18.0 100.5 L20.0 100.0 L22.0 99.5 L24.0 98.9 L26.0 98.4 L28.0 97.8 L30.0 97.1 L32.0 96.5 L34.0 95.8 L36.0 95.0 L38.0 94.2 L40.0 93.3 L42.0 92.4 L44.0 91.4 L46.0 90.4 L48.0 89.2 L50.0 88.0 L52.0 86.7 L54.0 85.2 L56.0 83.6 L58.0 81.9 L60.0 80.0 L62.0 77.9 L64.0 75.6 L66.0 72.9 L68.0 70.0 L70.0 66.7 L72.0 62.9 L74.0 58.5 L76.0 53.3 L78.0 47.3 L80.0 40.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"40.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"80.0\" cy=\"80.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.7FE635":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 204\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"180\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V180\"/><path d=\"M20 0V180\"/><path d=\"M40 0V180\"/><path d=\"M60 0V180\"/><path d=\"M80 0V180\"/><path d=\"M100 0V180\"/><path d=\"M120 0V180\"/><path d=\"M140 0V180\"/><path d=\"M160 0V180\"/><path d=\"M0 180 H160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V180\"/><path d=\"M0 40H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-5</text><text x=\"20\" y=\"51\">-4</text><text x=\"40\" y=\"51\">-3</text><text x=\"60\" y=\"51\">-2</text><text x=\"80\" y=\"51\">-1</text><text x=\"120\" y=\"51\">1</text><text x=\"140\" y=\"51\">2</text><text x=\"160\" y=\"51\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"183\">-7</text><text x=\"97\" y=\"163\">-6</text><text x=\"97\" y=\"143\">-5</text><text x=\"97\" y=\"123\">-4</text><text x=\"97\" y=\"103\">-3</text><text x=\"97\" y=\"83\">-2</text><text x=\"97\" y=\"63\">-1</text><text x=\"97\" y=\"23\">1</text><text x=\"97\" y=\"3\">2</text></g><path d=\"M50.0 185.0 L52.0 175.2 L54.0 165.8 L56.0 156.8 L58.0 148.2 L60.0 140.0M60.0 140.0 L62.0 132.2 L64.0 124.8 L66.0 117.8 L68.0 111.2 L70.0 105.0 L72.0 99.2 L74.0 93.8 L76.0 88.8 L78.0 84.2 L80.0 80.0 L82.0 76.2 L84.0 72.8 L86.0 69.8 L88.0 67.2 L90.0 65.0 L92.0 63.2 L94.0 61.8 L96.0 60.8 L98.0 60.2 L100.0 60.0 L102.0 60.2 L104.0 60.8 L106.0 61.8 L108.0 63.2 L110.0 65.0 L112.0 67.2 L114.0 69.8 L116.0 72.8 L118.0 76.2 L120.0 80.0 L122.0 84.2 L124.0 88.8 L126.0 93.8 L128.0 99.2 L130.0 105.0 L132.0 111.2 L134.0 117.8 L136.0 124.8 L138.0 132.2 L140.0 140.0 L142.0 148.2 L144.0 156.8 L146.0 165.8 L148.0 175.2 L150.0 185.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"140.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.D22637":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V160\"/><path d=\"M0 100H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"111\">-5</text><text x=\"20\" y=\"111\">-4</text><text x=\"40\" y=\"111\">-3</text><text x=\"60\" y=\"111\">-2</text><text x=\"80\" y=\"111\">-1</text><text x=\"120\" y=\"111\">1</text><text x=\"140\" y=\"111\">2</text><text x=\"160\" y=\"111\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"163\">-3</text><text x=\"97\" y=\"143\">-2</text><text x=\"97\" y=\"123\">-1</text><text x=\"97\" y=\"83\">1</text><text x=\"97\" y=\"63\">2</text><text x=\"97\" y=\"43\">3</text><text x=\"97\" y=\"23\">4</text><text x=\"97\" y=\"3\">5</text></g><path d=\"M26.0 168.4 L28.0 164.8 L30.0 161.2 L32.0 157.8 L34.0 154.4 L36.0 151.2 L38.0 148.1 L40.0 145.0 L42.0 142.1 L44.0 139.2 L46.0 136.4 L48.0 133.8 L50.0 131.2 L52.0 128.8 L54.0 126.4 L56.0 124.2 L58.0 122.0 L60.0 120.0M60.0 120.0 L62.0 118.0 L64.0 116.2 L66.0 114.5 L68.0 112.8 L70.0 111.2 L72.0 109.8 L74.0 108.5 L76.0 107.2 L78.0 106.1 L80.0 105.0 L82.0 104.0 L84.0 103.2 L86.0 102.4 L88.0 101.8 L90.0 101.2 L92.0 100.8 L94.0 100.5 L96.0 100.2 L98.0 100.1 L100.0 100.0M100.0 100.0 L102.0 99.9 L104.0 99.8 L106.0 99.5 L108.0 99.2 L110.0 98.8 L112.0 98.2 L114.0 97.6 L116.0 96.8 L118.0 96.0 L120.0 95.0 L122.0 93.9 L124.0 92.8 L126.0 91.5 L128.0 90.2 L130.0 88.8 L132.0 87.2 L134.0 85.5 L136.0 83.8 L138.0 82.0 L140.0 80.0 L142.0 78.0 L144.0 75.8 L146.0 73.6 L148.0 71.2 L150.0 68.8 L152.0 66.2 L154.0 63.5 L156.0 60.8 L158.0 58.0 L160.0 55.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"120.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"100.0\" cy=\"100.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.D28F33":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V160\"/><path d=\"M0 120H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-4</text><text x=\"20\" y=\"131\">-3</text><text x=\"40\" y=\"131\">-2</text><text x=\"60\" y=\"131\">-1</text><text x=\"100\" y=\"131\">1</text><text x=\"120\" y=\"131\">2</text><text x=\"140\" y=\"131\">3</text><text x=\"160\" y=\"131\">4</text><text x=\"180\" y=\"131\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"163\">-2</text><text x=\"77\" y=\"143\">-1</text><text x=\"77\" y=\"103\">1</text><text x=\"77\" y=\"83\">2</text><text x=\"77\" y=\"63\">3</text><text x=\"77\" y=\"43\">4</text><text x=\"77\" y=\"23\">5</text><text x=\"77\" y=\"3\">6</text></g><path d=\"M32.0 -3.2 L34.0 8.2 L36.0 19.2 L38.0 29.8 L40.0 40.0 L42.0 49.8 L44.0 59.2 L46.0 68.2 L48.0 76.8 L50.0 85.0 L52.0 92.8 L54.0 100.2 L56.0 107.2 L58.0 113.8 L60.0 120.0M60.0 120.0 L62.0 114.2 L64.0 108.8 L66.0 103.8 L68.0 99.2 L70.0 95.0 L72.0 91.2 L74.0 87.8 L76.0 84.8 L78.0 82.2 L80.0 80.0 L82.0 78.2 L84.0 76.8 L86.0 75.8 L88.0 75.2 L90.0 75.0 L92.0 75.2 L94.0 75.8 L96.0 76.8 L98.0 78.2 L100.0 80.0 L102.0 82.2 L104.0 84.8 L106.0 87.8 L108.0 91.2 L110.0 95.0 L112.0 99.2 L114.0 103.8 L116.0 108.8 L118.0 114.2 L120.0 120.0M120.0 120.0 L122.0 113.8 L124.0 107.2 L126.0 100.2 L128.0 92.8 L130.0 85.0 L132.0 76.8 L134.0 68.2 L136.0 59.2 L138.0 49.8 L140.0 40.0 L142.0 29.8 L144.0 19.2 L146.0 8.2 L148.0 -3.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"120.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.CE2631":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 248 444\" role=\"img\" aria-label=\"График функции\" style=\"max-width:248px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"220\" height=\"420\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V420\"/><path d=\"M20 0V420\"/><path d=\"M40 0V420\"/><path d=\"M60 0V420\"/><path d=\"M80 0V420\"/><path d=\"M100 0V420\"/><path d=\"M120 0V420\"/><path d=\"M140 0V420\"/><path d=\"M160 0V420\"/><path d=\"M180 0V420\"/><path d=\"M200 0V420\"/><path d=\"M220 0V420\"/><path d=\"M0 420 H220\"/><path d=\"M0 400 H220\"/><path d=\"M0 380 H220\"/><path d=\"M0 360 H220\"/><path d=\"M0 340 H220\"/><path d=\"M0 320 H220\"/><path d=\"M0 300 H220\"/><path d=\"M0 280 H220\"/><path d=\"M0 260 H220\"/><path d=\"M0 240 H220\"/><path d=\"M0 220 H220\"/><path d=\"M0 200 H220\"/><path d=\"M0 180 H220\"/><path d=\"M0 160 H220\"/><path d=\"M0 140 H220\"/><path d=\"M0 120 H220\"/><path d=\"M0 100 H220\"/><path d=\"M0 80 H220\"/><path d=\"M0 60 H220\"/><path d=\"M0 40 H220\"/><path d=\"M0 20 H220\"/><path d=\"M0 0 H220\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V420\"/><path d=\"M0 180H220\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"191\">-5</text><text x=\"20\" y=\"191\">-4</text><text x=\"40\" y=\"191\">-3</text><text x=\"60\" y=\"191\">-2</text><text x=\"80\" y=\"191\">-1</text><text x=\"120\" y=\"191\">1</text><text x=\"140\" y=\"191\">2</text><text x=\"160\" y=\"191\">3</text><text x=\"180\" y=\"191\">4</text><text x=\"200\" y=\"191\">5</text><text x=\"220\" y=\"191\">6</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"423\">-12</text><text x=\"97\" y=\"383\">-10</text><text x=\"97\" y=\"343\">-8</text><text x=\"97\" y=\"303\">-6</text><text x=\"97\" y=\"263\">-4</text><text x=\"97\" y=\"223\">-2</text><text x=\"97\" y=\"143\">2</text><text x=\"97\" y=\"103\">4</text><text x=\"97\" y=\"63\">6</text><text x=\"97\" y=\"23\">8</text></g><path d=\"M0.0 180.0 L2.0 170.2 L4.0 160.8 L6.0 151.8 L8.0 143.2 L10.0 135.0 L12.0 127.2 L14.0 119.8 L16.0 112.8 L18.0 106.2 L20.0 100.0 L22.0 94.2 L24.0 88.8 L26.0 83.8 L28.0 79.2 L30.0 75.0 L32.0 71.2 L34.0 67.8 L36.0 64.8 L38.0 62.2 L40.0 60.0 L42.0 58.2 L44.0 56.8 L46.0 55.8 L48.0 55.2 L50.0 55.0 L52.0 55.2 L54.0 55.8 L56.0 56.8 L58.0 58.2 L60.0 60.0 L62.0 62.2 L64.0 64.8 L66.0 67.8 L68.0 71.2 L70.0 75.0 L72.0 79.2 L74.0 83.8 L76.0 88.8 L78.0 94.2 L80.0 100.0 L82.0 106.2 L84.0 112.8 L86.0 119.8 L88.0 127.2 L90.0 135.0 L92.0 143.2 L94.0 151.8 L96.0 160.8 L98.0 170.2 L100.0 180.0M100.0 180.0 L102.0 193.8 L104.0 207.2 L106.0 220.2 L108.0 232.8 L110.0 245.0 L112.0 256.8 L114.0 268.2 L116.0 279.2 L118.0 289.8 L120.0 300.0 L122.0 309.8 L124.0 319.2 L126.0 328.2 L128.0 336.8 L130.0 345.0 L132.0 352.8 L134.0 360.2 L136.0 367.2 L138.0 373.8 L140.0 380.0 L142.0 385.8 L144.0 391.2 L146.0 396.2 L148.0 400.8 L150.0 405.0 L152.0 408.8 L154.0 412.2 L156.0 415.2 L158.0 417.8 L160.0 420.0 L162.0 421.8 L164.0 423.2 L166.0 424.2 L168.0 424.8 L170.0 425.0 L172.0 424.8 L174.0 424.2 L176.0 423.2 L178.0 421.8 L180.0 420.0 L182.0 417.8 L184.0 415.2 L186.0 412.2 L188.0 408.8 L190.0 405.0 L192.0 400.8 L194.0 396.2 L196.0 391.2 L198.0 385.8 L200.0 380.0 L202.0 373.8 L204.0 367.2 L206.0 360.2 L208.0 352.8 L210.0 345.0 L212.0 336.8 L214.0 328.2 L216.0 319.2 L218.0 309.8 L220.0 300.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"180.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.EC2E37":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 188 224\" role=\"img\" aria-label=\"График функции\" style=\"max-width:188px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"160\" height=\"200\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V200\"/><path d=\"M20 0V200\"/><path d=\"M40 0V200\"/><path d=\"M60 0V200\"/><path d=\"M80 0V200\"/><path d=\"M100 0V200\"/><path d=\"M120 0V200\"/><path d=\"M140 0V200\"/><path d=\"M160 0V200\"/><path d=\"M0 200 H160\"/><path d=\"M0 180 H160\"/><path d=\"M0 160 H160\"/><path d=\"M0 140 H160\"/><path d=\"M0 120 H160\"/><path d=\"M0 100 H160\"/><path d=\"M0 80 H160\"/><path d=\"M0 60 H160\"/><path d=\"M0 40 H160\"/><path d=\"M0 20 H160\"/><path d=\"M0 0 H160\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V200\"/><path d=\"M0 160H160\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"171\">-5</text><text x=\"20\" y=\"171\">-4</text><text x=\"40\" y=\"171\">-3</text><text x=\"60\" y=\"171\">-2</text><text x=\"80\" y=\"171\">-1</text><text x=\"120\" y=\"171\">1</text><text x=\"140\" y=\"171\">2</text><text x=\"160\" y=\"171\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"203\">-2</text><text x=\"97\" y=\"183\">-1</text><text x=\"97\" y=\"143\">1</text><text x=\"97\" y=\"123\">2</text><text x=\"97\" y=\"103\">3</text><text x=\"97\" y=\"83\">4</text><text x=\"97\" y=\"63\">5</text><text x=\"97\" y=\"43\">6</text><text x=\"97\" y=\"23\">7</text><text x=\"97\" y=\"3\">8</text></g><path d=\"M60.0 40.0 L62.0 47.8 L64.0 55.2 L66.0 62.2 L68.0 68.8 L70.0 75.0 L72.0 80.8 L74.0 86.2 L76.0 91.2 L78.0 95.8 L80.0 100.0 L82.0 103.8 L84.0 107.2 L86.0 110.2 L88.0 112.8 L90.0 115.0 L92.0 116.8 L94.0 118.2 L96.0 119.2 L98.0 119.8 L100.0 120.0 L102.0 119.8 L104.0 119.2 L106.0 118.2 L108.0 116.8 L110.0 115.0 L112.0 112.8 L114.0 110.2 L116.0 107.2 L118.0 103.8 L120.0 100.0 L122.0 95.8 L124.0 91.2 L126.0 86.2 L128.0 80.8 L130.0 75.0 L132.0 68.8 L134.0 62.2 L136.0 55.2 L138.0 47.8 L140.0 40.0 L142.0 31.8 L144.0 23.2 L146.0 14.2 L148.0 4.8 L150.0 -5.0M0.0 136.0 L2.0 135.5 L4.0 135.0 L6.0 134.5 L8.0 133.9 L10.0 133.3 L12.0 132.7 L14.0 132.1 L16.0 131.4 L18.0 130.7 L20.0 130.0 L22.0 129.2 L24.0 128.4 L26.0 127.6 L28.0 126.7 L30.0 125.7 L32.0 124.7 L34.0 123.6 L36.0 122.5 L38.0 121.3 L40.0 120.0 L42.0 118.6 L44.0 117.1 L46.0 115.6 L48.0 113.8 L50.0 112.0 L52.0 110.0 L54.0 107.8 L56.0 105.5 L58.0 102.9 L60.0 100.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"100.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"60.0\" cy=\"40.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.E34C3B":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 284\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"260\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V260\"/><path d=\"M20 0V260\"/><path d=\"M40 0V260\"/><path d=\"M60 0V260\"/><path d=\"M80 0V260\"/><path d=\"M100 0V260\"/><path d=\"M120 0V260\"/><path d=\"M140 0V260\"/><path d=\"M160 0V260\"/><path d=\"M180 0V260\"/><path d=\"M0 260 H180\"/><path d=\"M0 240 H180\"/><path d=\"M0 220 H180\"/><path d=\"M0 200 H180\"/><path d=\"M0 180 H180\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M100 0V260\"/><path d=\"M0 40H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-5</text><text x=\"20\" y=\"51\">-4</text><text x=\"40\" y=\"51\">-3</text><text x=\"60\" y=\"51\">-2</text><text x=\"80\" y=\"51\">-1</text><text x=\"120\" y=\"51\">1</text><text x=\"140\" y=\"51\">2</text><text x=\"160\" y=\"51\">3</text><text x=\"180\" y=\"51\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"97\" y=\"263\">-11</text><text x=\"97\" y=\"243\">-10</text><text x=\"97\" y=\"223\">-9</text><text x=\"97\" y=\"203\">-8</text><text x=\"97\" y=\"183\">-7</text><text x=\"97\" y=\"163\">-6</text><text x=\"97\" y=\"143\">-5</text><text x=\"97\" y=\"123\">-4</text><text x=\"97\" y=\"103\">-3</text><text x=\"97\" y=\"83\">-2</text><text x=\"97\" y=\"63\">-1</text><text x=\"97\" y=\"23\">1</text><text x=\"97\" y=\"3\">2</text></g><path d=\"M0.0 44.0 L2.0 44.1 L4.1 44.2 L6.1 44.3 L8.1 44.4 L10.2 44.5 L12.2 44.6 L14.3 44.7 L16.3 44.8 L18.3 44.9 L20.4 45.0 L22.4 45.2 L24.4 45.3 L26.5 45.4 L28.5 45.6 L30.6 45.8 L32.6 45.9 L34.6 46.1 L36.7 46.3 L38.7 46.5 L40.7 46.8 L42.8 47.0 L44.8 47.2 L46.9 47.5 L48.9 47.8 L50.9 48.2 L53.0 48.5 L55.0 48.9 L57.0 49.3 L59.1 49.8 L61.1 50.3 L63.1 50.9 L65.2 51.5 L67.2 52.2 L69.3 53.0 L71.3 53.9 L73.3 55.0 L75.4 56.2 L77.4 57.7 L79.4 59.5 L81.5 61.6 L83.5 64.3 L85.6 67.7 L87.6 72.2 L89.6 78.6 L91.7 88.0 L93.7 103.5 L95.7 133.9 L97.8 220.0M108.0 -10.0 L110.0 0.0 L112.0 6.7 L114.0 11.4 L116.0 15.0 L118.0 17.8 L120.0 20.0 L122.0 21.8 L124.0 23.3 L126.0 24.6 L128.0 25.7 L130.0 26.7 L132.0 27.5 L134.0 28.2 L136.0 28.9 L138.0 29.5 L140.0 30.0 L142.0 30.5 L144.0 30.9 L146.0 31.3 L148.0 31.7 L150.0 32.0 L152.0 32.3 L154.0 32.6 L156.0 32.9 L158.0 33.1 L160.0 33.3 L162.0 33.5 L164.0 33.8 L166.0 33.9 L168.0 34.1 L170.0 34.3 L172.0 34.4 L174.0 34.6 L176.0 34.7 L178.0 34.9 L180.0 35.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"97.8\" cy=\"220.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.E13E3C":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 248 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:248px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"220\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M220 0V160\"/><path d=\"M0 160 H220\"/><path d=\"M0 140 H220\"/><path d=\"M0 120 H220\"/><path d=\"M0 100 H220\"/><path d=\"M0 80 H220\"/><path d=\"M0 60 H220\"/><path d=\"M0 40 H220\"/><path d=\"M0 20 H220\"/><path d=\"M0 0 H220\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M160 0V160\"/><path d=\"M0 120H220\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-8</text><text x=\"20\" y=\"131\">-7</text><text x=\"40\" y=\"131\">-6</text><text x=\"60\" y=\"131\">-5</text><text x=\"80\" y=\"131\">-4</text><text x=\"100\" y=\"131\">-3</text><text x=\"120\" y=\"131\">-2</text><text x=\"140\" y=\"131\">-1</text><text x=\"180\" y=\"131\">1</text><text x=\"200\" y=\"131\">2</text><text x=\"220\" y=\"131\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"157\" y=\"163\">-2</text><text x=\"157\" y=\"143\">-1</text><text x=\"157\" y=\"103\">1</text><text x=\"157\" y=\"83\">2</text><text x=\"157\" y=\"63\">3</text><text x=\"157\" y=\"43\">4</text><text x=\"157\" y=\"23\">5</text><text x=\"157\" y=\"3\">6</text></g><path d=\"M0.0 57.5 L2.0 57.5 L4.0 57.4 L6.0 57.4 L8.0 57.4 L10.0 57.3 L12.0 57.3 L14.0 57.3 L16.0 57.2 L18.0 57.2 L20.0 57.1 L22.0 57.1 L24.0 57.1 L26.0 57.0 L28.0 57.0 L30.0 56.9 L32.0 56.9 L34.0 56.8 L36.0 56.8 L38.0 56.7 L40.0 56.7 L42.0 56.6 L44.0 56.6 L46.0 56.5 L48.0 56.4 L50.0 56.4 L52.0 56.3 L54.0 56.2 L56.0 56.2 L58.0 56.1 L60.0 56.0M60.0 56.0 L62.0 55.9 L64.0 55.8 L66.0 55.7 L68.0 55.7 L70.0 55.6 L72.0 55.5 L74.0 55.3 L76.0 55.2 L78.0 55.1 L80.0 55.0 L82.0 54.9 L84.0 54.7 L86.0 54.6 L88.0 54.4 L90.0 54.3 L92.0 54.1 L94.0 53.9 L96.0 53.7 L98.0 53.5 L100.0 53.3 L102.0 53.1 L104.0 52.9 L106.0 52.6 L108.0 52.3 L110.0 52.0 L112.0 51.7 L114.0 51.3 L116.0 50.9 L118.0 50.5 L120.0 50.0 L122.0 49.5 L124.0 48.9 L126.0 48.2 L128.0 47.5 L130.0 46.7 L132.0 45.7 L134.0 44.6 L136.0 43.3 L138.0 41.8 L140.0 40.0 L142.0 37.8 L144.0 35.0 L146.0 31.4 L148.0 26.7 L150.0 20.0 L152.0 10.0 L154.0 -6.7M164.0 160.0 L166.0 126.7 L168.0 110.0 L170.0 100.0 L172.0 93.3 L174.0 88.6 L176.0 85.0 L178.0 82.2 L180.0 80.0 L182.0 78.2 L184.0 76.7 L186.0 75.4 L188.0 74.3 L190.0 73.3 L192.0 72.5 L194.0 71.8 L196.0 71.1 L198.0 70.5 L200.0 70.0 L202.0 69.5 L204.0 69.1 L206.0 68.7 L208.0 68.3 L210.0 68.0 L212.0 67.7 L214.0 67.4 L216.0 67.1 L218.0 66.9 L220.0 66.7\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"56.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.38ED33":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 204\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"180\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V180\"/><path d=\"M20 0V180\"/><path d=\"M40 0V180\"/><path d=\"M60 0V180\"/><path d=\"M80 0V180\"/><path d=\"M100 0V180\"/><path d=\"M120 0V180\"/><path d=\"M140 0V180\"/><path d=\"M160 0V180\"/><path d=\"M180 0V180\"/><path d=\"M0 180 H180\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V180\"/><path d=\"M0 140H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"151\">-3</text><text x=\"20\" y=\"151\">-2</text><text x=\"40\" y=\"151\">-1</text><text x=\"80\" y=\"151\">1</text><text x=\"100\" y=\"151\">2</text><text x=\"120\" y=\"151\">3</text><text x=\"140\" y=\"151\">4</text><text x=\"160\" y=\"151\">5</text><text x=\"180\" y=\"151\">6</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"183\">-2</text><text x=\"57\" y=\"163\">-1</text><text x=\"57\" y=\"123\">1</text><text x=\"57\" y=\"103\">2</text><text x=\"57\" y=\"83\">3</text><text x=\"57\" y=\"63\">4</text><text x=\"57\" y=\"43\">5</text><text x=\"57\" y=\"23\">6</text><text x=\"57\" y=\"3\">7</text></g><path d=\"M100.0 80.0 L102.0 83.8 L104.0 87.2 L106.0 90.2 L108.0 92.8 L110.0 95.0 L112.0 96.8 L114.0 98.2 L116.0 99.2 L118.0 99.8 L120.0 100.0 L122.0 99.8 L124.0 99.2 L126.0 98.2 L128.0 96.8 L130.0 95.0 L132.0 92.8 L134.0 90.2 L136.0 87.2 L138.0 83.8 L140.0 80.0 L142.0 75.8 L144.0 71.2 L146.0 66.2 L148.0 60.8 L150.0 55.0 L152.0 48.8 L154.0 42.2 L156.0 35.2 L158.0 27.8 L160.0 20.0 L162.0 11.8 L164.0 3.2 L166.0 -5.8M0.0 140.0 L50.0 90.0 L100.0 40.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"100.0\" cy=\"40.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"100.0\" cy=\"80.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.83223D":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 228 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:228px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"200\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M0 160 H200\"/><path d=\"M0 140 H200\"/><path d=\"M0 120 H200\"/><path d=\"M0 100 H200\"/><path d=\"M0 80 H200\"/><path d=\"M0 60 H200\"/><path d=\"M0 40 H200\"/><path d=\"M0 20 H200\"/><path d=\"M0 0 H200\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M140 0V160\"/><path d=\"M0 120H200\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-7</text><text x=\"20\" y=\"131\">-6</text><text x=\"40\" y=\"131\">-5</text><text x=\"60\" y=\"131\">-4</text><text x=\"80\" y=\"131\">-3</text><text x=\"100\" y=\"131\">-2</text><text x=\"120\" y=\"131\">-1</text><text x=\"160\" y=\"131\">1</text><text x=\"180\" y=\"131\">2</text><text x=\"200\" y=\"131\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"137\" y=\"163\">-2</text><text x=\"137\" y=\"143\">-1</text><text x=\"137\" y=\"103\">1</text><text x=\"137\" y=\"83\">2</text><text x=\"137\" y=\"63\">3</text><text x=\"137\" y=\"43\">4</text><text x=\"137\" y=\"23\">5</text><text x=\"137\" y=\"3\">6</text></g><path d=\"M60.0 40.0 L62.0 47.8 L64.0 55.2 L66.0 62.2 L68.0 68.8 L70.0 75.0 L72.0 80.8 L74.0 86.2 L76.0 91.2 L78.0 95.8 L80.0 100.0 L82.0 103.8 L84.0 107.2 L86.0 110.2 L88.0 112.8 L90.0 115.0 L92.0 116.8 L94.0 118.2 L96.0 119.2 L98.0 119.8 L100.0 120.0 L102.0 119.8 L104.0 119.2 L106.0 118.2 L108.0 116.8 L110.0 115.0 L112.0 112.8 L114.0 110.2 L116.0 107.2 L118.0 103.8 L120.0 100.0 L122.0 95.8 L124.0 91.2 L126.0 86.2 L128.0 80.8 L130.0 75.0 L132.0 68.8 L134.0 62.2 L136.0 55.2 L138.0 47.8 L140.0 40.0 L142.0 31.8 L144.0 23.2 L146.0 14.2 L148.0 4.8 L150.0 -5.0M0.0 74.3 L2.0 73.6 L4.0 72.9 L6.0 72.2 L8.0 71.5 L10.0 70.8 L12.0 70.0 L14.0 69.2 L16.0 68.4 L18.0 67.5 L20.0 66.7 L22.0 65.8 L24.0 64.8 L26.0 63.9 L28.0 62.9 L30.0 61.8 L32.0 60.7 L34.0 59.6 L36.0 58.5 L38.0 57.3 L40.0 56.0 L42.0 54.7 L44.0 53.3 L46.0 51.9 L48.0 50.4 L50.0 48.9 L52.0 47.3 L54.0 45.6 L56.0 43.8 L58.0 42.0 L60.0 40.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"40.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.778885":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 268 284\" role=\"img\" aria-label=\"График функции\" style=\"max-width:268px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"240\" height=\"260\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V260\"/><path d=\"M20 0V260\"/><path d=\"M40 0V260\"/><path d=\"M60 0V260\"/><path d=\"M80 0V260\"/><path d=\"M100 0V260\"/><path d=\"M120 0V260\"/><path d=\"M140 0V260\"/><path d=\"M160 0V260\"/><path d=\"M180 0V260\"/><path d=\"M200 0V260\"/><path d=\"M220 0V260\"/><path d=\"M240 0V260\"/><path d=\"M0 260 H240\"/><path d=\"M0 240 H240\"/><path d=\"M0 220 H240\"/><path d=\"M0 200 H240\"/><path d=\"M0 180 H240\"/><path d=\"M0 160 H240\"/><path d=\"M0 140 H240\"/><path d=\"M0 120 H240\"/><path d=\"M0 100 H240\"/><path d=\"M0 80 H240\"/><path d=\"M0 60 H240\"/><path d=\"M0 40 H240\"/><path d=\"M0 20 H240\"/><path d=\"M0 0 H240\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M160 0V260\"/><path d=\"M0 220H240\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"231\">-8</text><text x=\"20\" y=\"231\">-7</text><text x=\"40\" y=\"231\">-6</text><text x=\"60\" y=\"231\">-5</text><text x=\"80\" y=\"231\">-4</text><text x=\"100\" y=\"231\">-3</text><text x=\"120\" y=\"231\">-2</text><text x=\"140\" y=\"231\">-1</text><text x=\"180\" y=\"231\">1</text><text x=\"200\" y=\"231\">2</text><text x=\"220\" y=\"231\">3</text><text x=\"240\" y=\"231\">4</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"157\" y=\"263\">-2</text><text x=\"157\" y=\"243\">-1</text><text x=\"157\" y=\"203\">1</text><text x=\"157\" y=\"183\">2</text><text x=\"157\" y=\"163\">3</text><text x=\"157\" y=\"143\">4</text><text x=\"157\" y=\"123\">5</text><text x=\"157\" y=\"103\">6</text><text x=\"157\" y=\"83\">7</text><text x=\"157\" y=\"63\">8</text><text x=\"157\" y=\"43\">9</text><text x=\"157\" y=\"23\">10</text><text x=\"157\" y=\"3\">11</text></g><path d=\"M30.0 -5.0 L32.0 12.8 L34.0 30.2 L36.0 47.2 L38.0 63.8 L40.0 80.0 L42.0 95.8 L44.0 111.2 L46.0 126.2 L48.0 140.8 L50.0 155.0 L52.0 168.8 L54.0 182.2 L56.0 195.2 L58.0 207.8 L60.0 220.0M60.0 220.0 L62.0 208.2 L64.0 196.8 L66.0 185.8 L68.0 175.2 L70.0 165.0 L72.0 155.2 L74.0 145.8 L76.0 136.8 L78.0 128.2 L80.0 120.0 L82.0 112.2 L84.0 104.8 L86.0 97.8 L88.0 91.2 L90.0 85.0 L92.0 79.2 L94.0 73.8 L96.0 68.8 L98.0 64.2 L100.0 60.0 L102.0 56.2 L104.0 52.8 L106.0 49.8 L108.0 47.2 L110.0 45.0 L112.0 43.2 L114.0 41.8 L116.0 40.8 L118.0 40.2 L120.0 40.0 L122.0 40.2 L124.0 40.8 L126.0 41.8 L128.0 43.2 L130.0 45.0 L132.0 47.2 L134.0 49.8 L136.0 52.8 L138.0 56.2 L140.0 60.0 L142.0 64.2 L144.0 68.8 L146.0 73.8 L148.0 79.2 L150.0 85.0 L152.0 91.2 L154.0 97.8 L156.0 104.8 L158.0 112.2 L160.0 120.0 L162.0 128.2 L164.0 136.8 L166.0 145.8 L168.0 155.2 L170.0 165.0 L172.0 175.2 L174.0 185.8 L176.0 196.8 L178.0 208.2 L180.0 220.0M180.0 220.0 L182.0 207.8 L184.0 195.2 L186.0 182.2 L188.0 168.8 L190.0 155.0 L192.0 140.8 L194.0 126.2 L196.0 111.2 L198.0 95.8 L200.0 80.0 L202.0 63.8 L204.0 47.2 L206.0 30.2 L208.0 12.8 L210.0 -5.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"220.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"180.0\" cy=\"220.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.7AC286":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 248 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:248px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"220\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M220 0V160\"/><path d=\"M0 160 H220\"/><path d=\"M0 140 H220\"/><path d=\"M0 120 H220\"/><path d=\"M0 100 H220\"/><path d=\"M0 80 H220\"/><path d=\"M0 60 H220\"/><path d=\"M0 40 H220\"/><path d=\"M0 20 H220\"/><path d=\"M0 0 H220\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V160\"/><path d=\"M0 120H220\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-3</text><text x=\"20\" y=\"131\">-2</text><text x=\"40\" y=\"131\">-1</text><text x=\"80\" y=\"131\">1</text><text x=\"100\" y=\"131\">2</text><text x=\"120\" y=\"131\">3</text><text x=\"140\" y=\"131\">4</text><text x=\"160\" y=\"131\">5</text><text x=\"180\" y=\"131\">6</text><text x=\"200\" y=\"131\">7</text><text x=\"220\" y=\"131\">8</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"163\">-2</text><text x=\"57\" y=\"143\">-1</text><text x=\"57\" y=\"103\">1</text><text x=\"57\" y=\"83\">2</text><text x=\"57\" y=\"63\">3</text><text x=\"57\" y=\"43\">4</text><text x=\"57\" y=\"23\">5</text><text x=\"57\" y=\"3\">6</text></g><path d=\"M140.0 60.0 L142.0 63.8 L144.0 67.2 L146.0 70.2 L148.0 72.8 L150.0 75.0 L152.0 76.8 L154.0 78.2 L156.0 79.2 L158.0 79.8 L160.0 80.0 L162.0 79.8 L164.0 79.2 L166.0 78.2 L168.0 76.8 L170.0 75.0 L172.0 72.8 L174.0 70.2 L176.0 67.2 L178.0 63.8 L180.0 60.0 L182.0 55.8 L184.0 51.2 L186.0 46.2 L188.0 40.8 L190.0 35.0 L192.0 28.8 L194.0 22.2 L196.0 15.2 L198.0 7.8 L200.0 0.0 L202.0 -8.2M70.0 110.0 L140.0 40.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"140.0\" cy=\"40.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"140.0\" cy=\"60.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.2CBB87":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 268 284\" role=\"img\" aria-label=\"График функции\" style=\"max-width:268px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"240\" height=\"260\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V260\"/><path d=\"M20 0V260\"/><path d=\"M40 0V260\"/><path d=\"M60 0V260\"/><path d=\"M80 0V260\"/><path d=\"M100 0V260\"/><path d=\"M120 0V260\"/><path d=\"M140 0V260\"/><path d=\"M160 0V260\"/><path d=\"M180 0V260\"/><path d=\"M200 0V260\"/><path d=\"M220 0V260\"/><path d=\"M240 0V260\"/><path d=\"M0 260 H240\"/><path d=\"M0 240 H240\"/><path d=\"M0 220 H240\"/><path d=\"M0 200 H240\"/><path d=\"M0 180 H240\"/><path d=\"M0 160 H240\"/><path d=\"M0 140 H240\"/><path d=\"M0 120 H240\"/><path d=\"M0 100 H240\"/><path d=\"M0 80 H240\"/><path d=\"M0 60 H240\"/><path d=\"M0 40 H240\"/><path d=\"M0 20 H240\"/><path d=\"M0 0 H240\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M60 0V260\"/><path d=\"M0 40H240\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-3</text><text x=\"20\" y=\"51\">-2</text><text x=\"40\" y=\"51\">-1</text><text x=\"80\" y=\"51\">1</text><text x=\"100\" y=\"51\">2</text><text x=\"120\" y=\"51\">3</text><text x=\"140\" y=\"51\">4</text><text x=\"160\" y=\"51\">5</text><text x=\"180\" y=\"51\">6</text><text x=\"200\" y=\"51\">7</text><text x=\"220\" y=\"51\">8</text><text x=\"240\" y=\"51\">9</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"57\" y=\"263\">-11</text><text x=\"57\" y=\"243\">-10</text><text x=\"57\" y=\"223\">-9</text><text x=\"57\" y=\"203\">-8</text><text x=\"57\" y=\"183\">-7</text><text x=\"57\" y=\"163\">-6</text><text x=\"57\" y=\"143\">-5</text><text x=\"57\" y=\"123\">-4</text><text x=\"57\" y=\"103\">-3</text><text x=\"57\" y=\"83\">-2</text><text x=\"57\" y=\"63\">-1</text><text x=\"57\" y=\"23\">1</text><text x=\"57\" y=\"3\">2</text></g><path d=\"M64.0 -4.8 L66.0 2.2 L68.0 8.8 L70.0 15.0 L72.0 20.8 L74.0 26.2 L76.0 31.2 L78.0 35.8 L80.0 40.0 L82.0 43.8 L84.0 47.2 L86.0 50.2 L88.0 52.8 L90.0 55.0 L92.0 56.8 L94.0 58.2 L96.0 59.2 L98.0 59.8 L100.0 60.0 L102.0 59.8 L104.0 59.2 L106.0 58.2 L108.0 56.8 L110.0 55.0 L112.0 52.8 L114.0 50.2 L116.0 47.2 L118.0 43.8 L120.0 40.0M120.0 40.0 L122.0 51.8 L124.0 63.2 L126.0 74.2 L128.0 84.8 L130.0 95.0 L132.0 104.8 L134.0 114.2 L136.0 123.2 L138.0 131.8 L140.0 140.0 L142.0 147.8 L144.0 155.2 L146.0 162.2 L148.0 168.8 L150.0 175.0 L152.0 180.8 L154.0 186.2 L156.0 191.2 L158.0 195.8 L160.0 200.0 L162.0 203.8 L164.0 207.2 L166.0 210.2 L168.0 212.8 L170.0 215.0 L172.0 216.8 L174.0 218.2 L176.0 219.2 L178.0 219.8 L180.0 220.0 L182.0 219.8 L184.0 219.2 L186.0 218.2 L188.0 216.8 L190.0 215.0 L192.0 212.8 L194.0 210.2 L196.0 207.2 L198.0 203.8 L200.0 200.0 L202.0 195.8 L204.0 191.2 L206.0 186.2 L208.0 180.8 L210.0 175.0 L212.0 168.8 L214.0 162.2 L216.0 155.2 L218.0 147.8 L220.0 140.0 L222.0 131.8 L224.0 123.2 L226.0 114.2 L228.0 104.8 L230.0 95.0 L232.0 84.8 L234.0 74.2 L236.0 63.2 L238.0 51.8 L240.0 40.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"120.0\" cy=\"40.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.24E78D":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V160\"/><path d=\"M0 120H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-4</text><text x=\"20\" y=\"131\">-3</text><text x=\"40\" y=\"131\">-2</text><text x=\"60\" y=\"131\">-1</text><text x=\"100\" y=\"131\">1</text><text x=\"120\" y=\"131\">2</text><text x=\"140\" y=\"131\">3</text><text x=\"160\" y=\"131\">4</text><text x=\"180\" y=\"131\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"163\">-2</text><text x=\"77\" y=\"143\">-1</text><text x=\"77\" y=\"103\">1</text><text x=\"77\" y=\"83\">2</text><text x=\"77\" y=\"63\">3</text><text x=\"77\" y=\"43\">4</text><text x=\"77\" y=\"23\">5</text><text x=\"77\" y=\"3\">6</text></g><path d=\"M0.0 125.0 L2.0 125.1 L4.0 125.3 L6.0 125.4 L8.0 125.6 L10.0 125.7 L12.0 125.9 L14.0 126.1 L16.0 126.2 L18.0 126.5 L20.0 126.7 L22.0 126.9 L24.0 127.1 L26.0 127.4 L28.0 127.7 L30.0 128.0 L32.0 128.3 L34.0 128.7 L36.0 129.1 L38.0 129.5 L40.0 130.0 L42.0 130.5 L44.0 131.1 L46.0 131.8 L48.0 132.5 L50.0 133.3 L52.0 134.3 L54.0 135.4 L56.0 136.7 L58.0 138.2 L60.0 140.0 L62.0 142.2 L64.0 145.0 L66.0 148.6 L68.0 153.3 L70.0 160.0M84.3 26.7 L86.4 57.8 L88.6 73.3 L90.7 82.7 L92.9 88.9 L95.0 93.3 L97.1 96.7M97.1 96.7 L99.2 99.1 L101.2 101.1 L103.2 102.8 L105.2 104.1 L107.2 105.3 L109.3 106.3 L111.3 107.2 L113.3 108.0 L115.3 108.7 L117.4 109.3 L119.4 109.8 L121.4 110.3 L123.4 110.8 L125.4 111.2 L127.5 111.6 L129.5 111.9 L131.5 112.2 L133.5 112.5 L135.5 112.8 L137.6 113.1 L139.6 113.3 L141.6 113.5 L143.6 113.7 L145.6 113.9 L147.7 114.1 L149.7 114.3 L151.7 114.4 L153.7 114.6 L155.7 114.7 L157.8 114.9 L159.8 115.0 L161.8 115.1 L163.8 115.2 L165.9 115.3 L167.9 115.4 L169.9 115.6 L171.9 115.6 L173.9 115.7 L176.0 115.8 L178.0 115.9 L180.0 116.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"97.1\" cy=\"96.7\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.5A6286":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 208 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:208px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"180\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M0 160 H180\"/><path d=\"M0 140 H180\"/><path d=\"M0 120 H180\"/><path d=\"M0 100 H180\"/><path d=\"M0 80 H180\"/><path d=\"M0 60 H180\"/><path d=\"M0 40 H180\"/><path d=\"M0 20 H180\"/><path d=\"M0 0 H180\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M80 0V160\"/><path d=\"M0 120H180\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"131\">-4</text><text x=\"20\" y=\"131\">-3</text><text x=\"40\" y=\"131\">-2</text><text x=\"60\" y=\"131\">-1</text><text x=\"100\" y=\"131\">1</text><text x=\"120\" y=\"131\">2</text><text x=\"140\" y=\"131\">3</text><text x=\"160\" y=\"131\">4</text><text x=\"180\" y=\"131\">5</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"77\" y=\"163\">-2</text><text x=\"77\" y=\"143\">-1</text><text x=\"77\" y=\"103\">1</text><text x=\"77\" y=\"83\">2</text><text x=\"77\" y=\"63\">3</text><text x=\"77\" y=\"43\">4</text><text x=\"77\" y=\"23\">5</text><text x=\"77\" y=\"3\">6</text></g><path d=\"M44.0 168.6 L46.0 163.4 L48.0 158.4 L50.0 153.8 L52.0 149.4 L54.0 145.3 L56.0 141.6 L58.0 138.2 L60.0 135.0 L62.0 132.2 L64.0 129.6 L66.0 127.4 L68.0 125.4 L70.0 123.8 L72.0 122.4 L74.0 121.3 L76.0 120.6 L78.0 120.2 L80.0 120.0M80.0 120.0 L82.0 119.8 L84.0 119.4 L86.0 118.7 L88.0 117.6 L90.0 116.2 L92.0 114.6 L94.0 112.7 L96.0 110.4 L98.0 107.8 L100.0 105.0M100.0 105.0 L102.0 101.8 L104.0 98.4 L106.0 94.7 L108.0 90.6 L110.0 86.2 L112.0 81.6 L114.0 76.7 L116.0 71.4 L118.0 65.8 L120.0 60.0 L122.0 53.8 L124.0 47.4 L126.0 40.7 L128.0 33.6 L130.0 26.2 L132.0 18.6 L134.0 10.6 L136.0 2.4 L138.0 -6.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"100.0\" cy=\"105.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>","22.fipi.E0478E":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 388 184\" role=\"img\" aria-label=\"График функции\" style=\"max-width:388px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"360\" height=\"160\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V160\"/><path d=\"M20 0V160\"/><path d=\"M40 0V160\"/><path d=\"M60 0V160\"/><path d=\"M80 0V160\"/><path d=\"M100 0V160\"/><path d=\"M120 0V160\"/><path d=\"M140 0V160\"/><path d=\"M160 0V160\"/><path d=\"M180 0V160\"/><path d=\"M200 0V160\"/><path d=\"M220 0V160\"/><path d=\"M240 0V160\"/><path d=\"M260 0V160\"/><path d=\"M280 0V160\"/><path d=\"M300 0V160\"/><path d=\"M320 0V160\"/><path d=\"M340 0V160\"/><path d=\"M360 0V160\"/><path d=\"M0 160 H360\"/><path d=\"M0 140 H360\"/><path d=\"M0 120 H360\"/><path d=\"M0 100 H360\"/><path d=\"M0 80 H360\"/><path d=\"M0 60 H360\"/><path d=\"M0 40 H360\"/><path d=\"M0 20 H360\"/><path d=\"M0 0 H360\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M180 0V160\"/><path d=\"M0 100H360\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"20\" y=\"111\">-8</text><text x=\"60\" y=\"111\">-6</text><text x=\"100\" y=\"111\">-4</text><text x=\"140\" y=\"111\">-2</text><text x=\"220\" y=\"111\">2</text><text x=\"260\" y=\"111\">4</text><text x=\"300\" y=\"111\">6</text><text x=\"340\" y=\"111\">8</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"177\" y=\"163\">-3</text><text x=\"177\" y=\"143\">-2</text><text x=\"177\" y=\"123\">-1</text><text x=\"177\" y=\"83\">1</text><text x=\"177\" y=\"63\">2</text><text x=\"177\" y=\"43\">3</text><text x=\"177\" y=\"23\">4</text><text x=\"177\" y=\"3\">5</text></g><path d=\"M0.0 113.3 L2.0 113.5 L4.0 113.6 L6.0 113.8 L8.0 114.0 L10.0 114.1 L12.0 114.3 L14.0 114.5 L16.0 114.6 L18.0 114.8 L20.0 115.0 L22.0 115.2 L24.0 115.4 L26.0 115.6 L28.0 115.8 L30.0 116.0 L32.0 116.2 L34.0 116.4 L36.0 116.7 L38.0 116.9 L40.0 117.1 L42.0 117.4 L44.0 117.6 L46.0 117.9 L48.0 118.2 L50.0 118.5 L52.0 118.8 L54.0 119.0 L56.0 119.4 L58.0 119.7 L60.0 120.0M60.0 120.0 L120.0 110.0 L180.0 100.0M202.0 -9.1 L204.0 0.0 L206.0 7.7 L208.0 14.3 L210.0 20.0 L212.0 25.0 L214.0 29.4 L216.0 33.3 L218.0 36.8 L220.0 40.0 L222.0 42.9 L224.0 45.5 L226.0 47.8 L228.0 50.0 L230.0 52.0 L232.0 53.8 L234.0 55.6 L236.0 57.1 L238.0 58.6 L240.0 60.0 L242.0 61.3 L244.0 62.5 L246.0 63.6 L248.0 64.7 L250.0 65.7 L252.0 66.7 L254.0 67.6 L256.0 68.4 L258.0 69.2 L260.0 70.0 L262.0 70.7 L264.0 71.4 L266.0 72.1 L268.0 72.7 L270.0 73.3 L272.0 73.9 L274.0 74.5 L276.0 75.0 L278.0 75.5 L280.0 76.0 L282.0 76.5 L284.0 76.9 L286.0 77.4 L288.0 77.8 L290.0 78.2 L292.0 78.6 L294.0 78.9 L296.0 79.3 L298.0 79.7 L300.0 80.0M300.0 80.0 L330.0 75.0 L360.0 70.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"60.0\" cy=\"120.0\" r=\"3.4\" fill=\"currentColor\"/><circle cx=\"180.0\" cy=\"100.0\" r=\"3.4\" fill=\"var(--fig-bg,#fff)\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"300.0\" cy=\"80.0\" r=\"3.4\" fill=\"currentColor\"/></svg>","22.fipi.6B948F":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-14 -8 288 244\" role=\"img\" aria-label=\"График функции\" style=\"max-width:288px;width:100%;height:auto;font-family:sans-serif;font-size:10px\"><rect x=\"0\" y=\"0\" width=\"260\" height=\"220\" fill=\"var(--fig-bg,none)\"/><g stroke=\"var(--fig-grid,#b9bcc4)\" stroke-width=\"0.6\" fill=\"none\"><path d=\"M0 0V220\"/><path d=\"M20 0V220\"/><path d=\"M40 0V220\"/><path d=\"M60 0V220\"/><path d=\"M80 0V220\"/><path d=\"M100 0V220\"/><path d=\"M120 0V220\"/><path d=\"M140 0V220\"/><path d=\"M160 0V220\"/><path d=\"M180 0V220\"/><path d=\"M200 0V220\"/><path d=\"M220 0V220\"/><path d=\"M240 0V220\"/><path d=\"M260 0V220\"/><path d=\"M0 220 H260\"/><path d=\"M0 200 H260\"/><path d=\"M0 180 H260\"/><path d=\"M0 160 H260\"/><path d=\"M0 140 H260\"/><path d=\"M0 120 H260\"/><path d=\"M0 100 H260\"/><path d=\"M0 80 H260\"/><path d=\"M0 60 H260\"/><path d=\"M0 40 H260\"/><path d=\"M0 20 H260\"/><path d=\"M0 0 H260\"/></g><g stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"><path d=\"M200 0V220\"/><path d=\"M0 40H260\"/></g><g fill=\"currentColor\" text-anchor=\"middle\"><text x=\"0\" y=\"51\">-10</text><text x=\"20\" y=\"51\">-9</text><text x=\"40\" y=\"51\">-8</text><text x=\"60\" y=\"51\">-7</text><text x=\"80\" y=\"51\">-6</text><text x=\"100\" y=\"51\">-5</text><text x=\"120\" y=\"51\">-4</text><text x=\"140\" y=\"51\">-3</text><text x=\"160\" y=\"51\">-2</text><text x=\"180\" y=\"51\">-1</text><text x=\"220\" y=\"51\">1</text><text x=\"240\" y=\"51\">2</text><text x=\"260\" y=\"51\">3</text></g><g fill=\"currentColor\" text-anchor=\"end\"><text x=\"197\" y=\"223\">-9</text><text x=\"197\" y=\"203\">-8</text><text x=\"197\" y=\"183\">-7</text><text x=\"197\" y=\"163\">-6</text><text x=\"197\" y=\"143\">-5</text><text x=\"197\" y=\"123\">-4</text><text x=\"197\" y=\"103\">-3</text><text x=\"197\" y=\"83\">-2</text><text x=\"197\" y=\"63\">-1</text><text x=\"197\" y=\"23\">1</text><text x=\"197\" y=\"3\">2</text></g><path d=\"M8.0 -3.2 L10.0 5.0 L12.0 12.8 L14.0 20.2 L16.0 27.2 L18.0 33.8 L20.0 40.0 L22.0 45.8 L24.0 51.2 L26.0 56.2 L28.0 60.8 L30.0 65.0 L32.0 68.8 L34.0 72.2 L36.0 75.2 L38.0 77.8 L40.0 80.0 L42.0 81.8 L44.0 83.2 L46.0 84.2 L48.0 84.8 L50.0 85.0 L52.0 84.8 L54.0 84.2 L56.0 83.2 L58.0 81.8 L60.0 80.0 L62.0 77.8 L64.0 75.2 L66.0 72.2 L68.0 68.8 L70.0 65.0 L72.0 60.8 L74.0 56.2 L76.0 51.2 L78.0 45.8 L80.0 40.0M80.0 40.0 L82.0 49.8 L84.0 59.2 L86.0 68.2 L88.0 76.8 L90.0 85.0 L92.0 92.8 L94.0 100.2 L96.0 107.2 L98.0 113.8 L100.0 120.0 L102.0 125.8 L104.0 131.2 L106.0 136.2 L108.0 140.8 L110.0 145.0 L112.0 148.8 L114.0 152.2 L116.0 155.2 L118.0 157.8 L120.0 160.0 L122.0 161.8 L124.0 163.2 L126.0 164.2 L128.0 164.8 L130.0 165.0 L132.0 164.8 L134.0 164.2 L136.0 163.2 L138.0 161.8 L140.0 160.0 L142.0 157.8 L144.0 155.2 L146.0 152.2 L148.0 148.8 L150.0 145.0 L152.0 140.8 L154.0 136.2 L156.0 131.2 L158.0 125.8 L160.0 120.0 L162.0 113.8 L164.0 107.2 L166.0 100.2 L168.0 92.8 L170.0 85.0 L172.0 76.8 L174.0 68.2 L176.0 59.2 L178.0 49.8 L180.0 40.0 L182.0 29.8 L184.0 19.2 L186.0 8.2 L188.0 -3.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"80.0\" cy=\"40.0\" r=\"3.4\" fill=\"currentColor\"/></svg>"}; for (var k in add) F[k] = add[k]; })();
(window.OGE_PART2_FIPI = window.OGE_PART2_FIPI || { tasks: {} }).tasks['22'] = {
 "sections": [
  {
   "id": "piece",
   "title": "Кусочные функции"
  },
  {
   "id": "abs",
   "title": "Функции с модулем"
  },
  {
   "id": "frac",
   "title": "Дробно-рациональные функции"
  },
  {
   "id": "maxq",
   "title": "Наибольшее число общих точек"
  }
 ],
 "groups": [
  {
   "id": "lin3",
   "section": "piece",
   "title": "Ломаная из трёх прямых",
   "hint": "График — ломаная: на каждом из трёх промежутков своя прямая. Найдите значения функции на границах промежутков — в них стыкуются прямые. Горизонтальная прямая $y = m$ пересекает каждую звено ломаной не больше одного раза; считайте точки при движении $y = m$ снизу вверх."
  },
  {
   "id": "par_lin",
   "section": "piece",
   "title": "Парабола и прямая (кусочная функция)",
   "hint": "Постройте обе части по своим условиям: парабола по вершине и граничной точке, прямая — по двум точкам. Обратите внимание, какие точки на стыке закрашены, а какие выколоты: от этого зависят значения $m$, при которых число точек меняется скачком."
  },
  {
   "id": "par_hyp",
   "section": "piece",
   "title": "Парабола и гипербола (кусочная функция)",
   "hint": "Одна часть графика — парабола, другая — гипербола $y = \\dfrac{k}{x}$. Для каждой найдите значения на границе промежутка и (у параболы) вершину. Двигайте прямую $y = m$ и считайте, сколько раз она пересекает каждую часть."
  },
  {
   "id": "modx",
   "section": "abs",
   "title": "Раскрытие модуля $|x|$: две параболы, склеенные в нуле",
   "hint": "При $x \\ge 0$ имеем $|x| = x$, при $x < 0$ — $|x| = -x$. На каждом из промежутков получается парабола, обе проходят через начало координат. Постройте нужные части парабол и считайте точки пересечения с $y = m$."
  },
  {
   "id": "abs_parab",
   "section": "abs",
   "title": "Парабола с модулем линейного выражения",
   "hint": "Модуль $|x - b|$ раскрываем по знаку выражения под модулем: при $x \\ge b$ — без изменения, при $x < b$ — со сменой знака. Получаются две параболы, которые стыкуются в точке $x = b$. Постройте нужные части и считайте точки пересечения с прямой $y = m$."
  },
  {
   "id": "hyper_abs",
   "section": "abs",
   "title": "Гипербола с модулем",
   "hint": "Обозначьте $a = \\dfrac{x}{c}$, $b = \\dfrac{c}{x}$: выражение $\\dfrac{|a - b| + a + b}{2}$ равно наибольшему из чисел $a$ и $b$. Сравните $a$ и $b$ отдельно при $x > 0$ и $x < 0$ — так раскрывается модуль."
  },
  {
   "id": "frac_abs",
   "section": "frac",
   "title": "Дробь с модулем: сокращение и выколотая точка",
   "hint": "Разложите числитель на множители и сократите дробь, помня, что корень знаменателя не входит в область определения — эта точка на графике выколота. Затем раскройте модуль: получатся две параболы. Значение, в котором точка выколота, прямая $y = m$ не пересекает."
  },
  {
   "id": "shift_hyp",
   "section": "frac",
   "title": "Гипербола с выколотой точкой",
   "hint": "Сократите дробь: получится $y = c - \\dfrac{1}{x}$ — гипербола с горизонтальной асимптотой $y = c$. Значение $y = c$ график не принимает никогда, а ещё одна точка выколота — в ней сокращённый множитель обращал знаменатель в нуль."
  },
  {
   "id": "k_frac",
   "section": "frac",
   "title": "Прямая $y = kx$ и сократимая дробь",
   "hint": "Сократите дробь и запишите, какие точки выколоты. Прямая $y = kx$ проходит через начало координат и вращается вокруг него: для пересечения с графиком решаем $\\dfrac{y}{x} = k$. Учтите, что выколотая точка не даёт пересечения."
  },
  {
   "id": "k_abs_frac",
   "section": "frac",
   "title": "Прямая $y = kx$, дробь с модулем",
   "hint": "Раскройте модуль отдельно при $x > 0$ и при $x < 0$ и сократите дробь. Прямая $y = kx$ проходит через начало координат; число её общих точек с графиком — число решений уравнения $\\dfrac{f(x)}{x} = k$ при $x \\ne 0$ (если $x = 0$ не входит в область определения)."
  },
  {
   "id": "abs_quad",
   "section": "maxq",
   "title": "Модуль квадратного трёхчлена: наибольшее число общих точек",
   "hint": "Часть параболы ниже оси $Ox$ зеркально отражается вверх. Получается «буква W»: наибольшее число пересечений с горизонтальной прямой — когда она проходит между вершиной отражённой части и осью $Ox$."
  }
 ],
 "criteria": [
  [
   2,
   "График построен верно, верно найдены искомые значения параметра"
  ],
  [
   1,
   "График построен верно, но искомые значения параметра найдены неверно или не найдены"
  ],
  [
   0,
   "Решение не соответствует ни одному из критериев, перечисленных выше"
  ]
 ],
 "protos": [
  {
   "id": "22.fipi.13A5FD",
   "group": "lin3",
   "fipi": "13A5FD",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}2{,}5x - 1 \\\\ - 3{,}5x + 11 \\\\ x - 1\\end{cases}\\begin{cases} \\\\ \\\\ \\end{cases}\\begin{cases}x \\lt 2, \\\\ 2 \\le x \\le 3, \\\\ x \\gt 3.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "0,5≤m≤2; m=4",
     "tex": "0{,}5 \\le m \\le 2;\\ m = 4"
    }
   ],
   "answerTex": "$0{,}5 \\le m \\le 2$; $m = 4$",
   "steps": [
    "При $x \\lt 2$ график — прямая $y = 2{,}5x - 1$: с ростом $x$ значения растут.",
    "При $2 \\le x \\le 3$ график — прямая $y = -3{,}5x + 11$: с ростом $x$ значения убывают.",
    "При $x \\gt 3$ график — прямая $y = x - 1$: с ростом $x$ значения растут.",
    "При $x = 2$ функция определена: $y(2) = 4$, точка $(2;\\ 4)$ входит в график (оба куска сходятся в ней).",
    "При $x = 3$ функция определена: $y(3) = 0{,}5$, точка $(3;\\ 0{,}5)$ входит в график; значение справа $2$ — точка $(3;\\ 2)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.13A5FD]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0{,}5$: одна общая точка (на $x \\lt 2$ — 1, на $2 \\le x \\le 3$ — 0, на $x \\gt 3$ — 0).",
    "$0{,}5 \\le m \\le 2$: 2 общие точки (на $x \\lt 2$ — 1, на $2 \\le x \\le 3$ — 1, на $x \\gt 3$ — 0).",
    "$2 \\lt m \\lt 4$: 3 общие точки (на $x \\lt 2$ — 1, на $2 \\le x \\le 3$ — 1, на $x \\gt 3$ — 1).",
    "$m = 4$: 2 общие точки (на $x \\lt 2$ — 0, на $2 \\le x \\le 3$ — 1, на $x \\gt 3$ — 1).",
    "$m \\gt 4$: одна общая точка (на $x \\lt 2$ — 0, на $2 \\le x \\le 3$ — 0, на $x \\gt 3$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $0{,}5 \\le m \\le 2$ и $m = 4$."
   ]
  },
  {
   "id": "22.fipi.C1600B",
   "group": "lin3",
   "fipi": "C1600B",
   "text": "Постройте график функции $$y = \\begin{cases}x - 0{,}5,x \\lt - 2, \\\\ - 2x - 6{,}5, - 2 \\le x \\le - 1, \\\\ x - 3{,}5,x \\gt - 1,\\end{cases}$$ и определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-4,5; m=-2,5",
     "tex": "m = -4{,}5;\\ m = -2{,}5"
    }
   ],
   "answerTex": "$m = -4{,}5$; $m = -2{,}5$",
   "steps": [
    "При $x \\lt -2$ график — прямая $y = x - 0{,}5$: с ростом $x$ значения растут.",
    "При $-2 \\le x \\lt -1$ график — прямая $y = -2x - 6{,}5$: с ростом $x$ значения убывают.",
    "При $x \\ge -1$ график — прямая $y = x - 3{,}5$: с ростом $x$ значения растут.",
    "При $x = -2$ функция определена: $y(-2) = -2{,}5$, точка $(-2;\\ -2{,}5)$ входит в график (оба куска сходятся в ней).",
    "При $x = -1$ функция определена: $y(-1) = -4{,}5$, точка $(-1;\\ -4{,}5)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.C1600B]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -4{,}5$: одна общая точка (на $x \\lt -2$ — 1, на $-2 \\le x \\lt -1$ — 0, на $x \\ge -1$ — 0).",
    "$m = -4{,}5$: 2 общие точки (на $x \\lt -2$ — 1, на $-2 \\le x \\lt -1$ — 0, на $x \\ge -1$ — 1).",
    "$-4{,}5 \\lt m \\lt -2{,}5$: 3 общие точки (на $x \\lt -2$ — 1, на $-2 \\le x \\lt -1$ — 1, на $x \\ge -1$ — 1).",
    "$m = -2{,}5$: 2 общие точки (на $x \\lt -2$ — 0, на $-2 \\le x \\lt -1$ — 1, на $x \\ge -1$ — 1).",
    "$m \\gt -2{,}5$: одна общая точка (на $x \\lt -2$ — 0, на $-2 \\le x \\lt -1$ — 0, на $x \\ge -1$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -4{,}5$ и $m = -2{,}5$."
   ]
  },
  {
   "id": "22.fipi.7493BA",
   "group": "lin3",
   "fipi": "7493BA",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}x - 4 \\\\ - 1{,}5x + 4{,}5 \\\\ 1{,}5x - 7{,}5\\end{cases}\\begin{cases} \\\\ \\\\ \\end{cases}\\begin{cases}x \\lt 3, \\\\ 3 \\le x \\le 4, \\\\ x \\gt 4.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-1,5; -1≤m≤0",
     "tex": "m = -1{,}5;\\ -1 \\le m \\le 0"
    }
   ],
   "answerTex": "$m = -1{,}5$; $-1 \\le m \\le 0$",
   "steps": [
    "При $x \\lt 3$ график — прямая $y = x - 4$: с ростом $x$ значения растут.",
    "При $3 \\le x \\lt 4$ график — прямая $y = -1{,}5x + 4{,}5$: с ростом $x$ значения убывают.",
    "При $x \\ge 4$ график — прямая $y = 1{,}5x - 7{,}5$: с ростом $x$ значения растут.",
    "При $x = 3$ функция определена: $y(3) = 0$, точка $(3;\\ 0)$ входит в график; значение слева $-1$ — точка $(3;\\ -1)$ выколота.",
    "При $x = 4$ функция определена: $y(4) = -1{,}5$, точка $(4;\\ -1{,}5)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.7493BA]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -1{,}5$: одна общая точка (на $x \\lt 3$ — 1, на $3 \\le x \\lt 4$ — 0, на $x \\ge 4$ — 0).",
    "$m = -1{,}5$: 2 общие точки (на $x \\lt 3$ — 1, на $3 \\le x \\lt 4$ — 0, на $x \\ge 4$ — 1).",
    "$-1{,}5 \\lt m \\lt -1$: 3 общие точки (на $x \\lt 3$ — 1, на $3 \\le x \\lt 4$ — 1, на $x \\ge 4$ — 1).",
    "$-1 \\le m \\le 0$: 2 общие точки (на $x \\lt 3$ — 0, на $3 \\le x \\lt 4$ — 1, на $x \\ge 4$ — 1).",
    "$m \\gt 0$: одна общая точка (на $x \\lt 3$ — 0, на $3 \\le x \\lt 4$ — 0, на $x \\ge 4$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -1{,}5$ и $-1 \\le m \\le 0$."
   ]
  },
  {
   "id": "22.fipi.E23414",
   "group": "lin3",
   "fipi": "E23414",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}2x - 2 \\\\ - 3x + 13 \\\\ 1{,}5x - 7\\end{cases}\\begin{cases} \\\\ \\\\ \\end{cases}\\begin{cases}x \\lt 3, \\\\ 3 \\le x \\le 4, \\\\ x \\gt 4.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "-1<m<1; m=4",
     "tex": "-1 \\lt m \\lt 1;\\ m = 4"
    }
   ],
   "answerTex": "$-1 \\lt m \\lt 1$; $m = 4$",
   "steps": [
    "При $x \\lt 3$ график — прямая $y = 2x - 2$: с ростом $x$ значения растут.",
    "При $3 \\le x \\le 4$ график — прямая $y = -3x + 13$: с ростом $x$ значения убывают.",
    "При $x \\gt 4$ график — прямая $y = 1{,}5x - 7$: с ростом $x$ значения растут.",
    "При $x = 3$ функция определена: $y(3) = 4$, точка $(3;\\ 4)$ входит в график (оба куска сходятся в ней).",
    "При $x = 4$ функция определена: $y(4) = 1$, точка $(4;\\ 1)$ входит в график; значение справа $-1$ — точка $(4;\\ -1)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.E23414]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\le -1$: одна общая точка (на $x \\lt 3$ — 1, на $3 \\le x \\le 4$ — 0, на $x \\gt 4$ — 0).",
    "$-1 \\lt m \\lt 1$: 2 общие точки (на $x \\lt 3$ — 1, на $3 \\le x \\le 4$ — 0, на $x \\gt 4$ — 1).",
    "$1 \\le m \\lt 4$: 3 общие точки (на $x \\lt 3$ — 1, на $3 \\le x \\le 4$ — 1, на $x \\gt 4$ — 1).",
    "$m = 4$: 2 общие точки (на $x \\lt 3$ — 0, на $3 \\le x \\le 4$ — 1, на $x \\gt 4$ — 1).",
    "$m \\gt 4$: одна общая точка (на $x \\lt 3$ — 0, на $3 \\le x \\le 4$ — 0, на $x \\gt 4$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $-1 \\lt m \\lt 1$ и $m = 4$."
   ]
  },
  {
   "id": "22.fipi.41D023",
   "group": "lin3",
   "fipi": "41D023",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}x - 2{,}5 \\\\ - x + 1{,}5 \\\\ x - 5\\end{cases}\\begin{cases} \\\\ \\\\ \\end{cases}\\begin{cases}x \\lt 2, \\\\ 2 \\le x \\le 3, \\\\ x \\gt 3.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "-2<m<-1,5; m=-0,5",
     "tex": "-2 \\lt m \\lt -1{,}5;\\ m = -0{,}5"
    }
   ],
   "answerTex": "$-2 \\lt m \\lt -1{,}5$; $m = -0{,}5$",
   "steps": [
    "При $x \\lt 2$ график — прямая $y = x - 2{,}5$: с ростом $x$ значения растут.",
    "При $2 \\le x \\le 3$ график — прямая $y = -x + 1{,}5$: с ростом $x$ значения убывают.",
    "При $x \\gt 3$ график — прямая $y = x - 5$: с ростом $x$ значения растут.",
    "При $x = 2$ функция определена: $y(2) = -0{,}5$, точка $(2;\\ -0{,}5)$ входит в график (оба куска сходятся в ней).",
    "При $x = 3$ функция определена: $y(3) = -1{,}5$, точка $(3;\\ -1{,}5)$ входит в график; значение справа $-2$ — точка $(3;\\ -2)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.41D023]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\le -2$: одна общая точка (на $x \\lt 2$ — 1, на $2 \\le x \\le 3$ — 0, на $x \\gt 3$ — 0).",
    "$-2 \\lt m \\lt -1{,}5$: 2 общие точки (на $x \\lt 2$ — 1, на $2 \\le x \\le 3$ — 0, на $x \\gt 3$ — 1).",
    "$-1{,}5 \\le m \\lt -0{,}5$: 3 общие точки (на $x \\lt 2$ — 1, на $2 \\le x \\le 3$ — 1, на $x \\gt 3$ — 1).",
    "$m = -0{,}5$: 2 общие точки (на $x \\lt 2$ — 0, на $2 \\le x \\le 3$ — 1, на $x \\gt 3$ — 1).",
    "$m \\gt -0{,}5$: одна общая точка (на $x \\lt 2$ — 0, на $2 \\le x \\le 3$ — 0, на $x \\gt 3$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $-2 \\lt m \\lt -1{,}5$ и $m = -0{,}5$."
   ]
  },
  {
   "id": "22.fipi.0DC82F",
   "group": "lin3",
   "fipi": "0DC82F",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}2{,}5x - 3{,}5 \\\\ - 3x + 7{,}5 \\\\ x - 6\\end{cases}\\begin{cases} \\\\ \\\\ \\end{cases}\\begin{cases}x \\lt 2, \\\\ 2 \\le x \\le 3, \\\\ x \\gt 3.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "-3<m<-1,5; m=1,5",
     "tex": "-3 \\lt m \\lt -1{,}5;\\ m = 1{,}5"
    }
   ],
   "answerTex": "$-3 \\lt m \\lt -1{,}5$; $m = 1{,}5$",
   "steps": [
    "При $x \\lt 2$ график — прямая $y = 2{,}5x - 3{,}5$: с ростом $x$ значения растут.",
    "При $2 \\le x \\le 3$ график — прямая $y = -3x + 7{,}5$: с ростом $x$ значения убывают.",
    "При $x \\gt 3$ график — прямая $y = x - 6$: с ростом $x$ значения растут.",
    "При $x = 2$ функция определена: $y(2) = 1{,}5$, точка $(2;\\ 1{,}5)$ входит в график (оба куска сходятся в ней).",
    "При $x = 3$ функция определена: $y(3) = -1{,}5$, точка $(3;\\ -1{,}5)$ входит в график; значение справа $-3$ — точка $(3;\\ -3)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.0DC82F]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\le -3$: одна общая точка (на $x \\lt 2$ — 1, на $2 \\le x \\le 3$ — 0, на $x \\gt 3$ — 0).",
    "$-3 \\lt m \\lt -1{,}5$: 2 общие точки (на $x \\lt 2$ — 1, на $2 \\le x \\le 3$ — 0, на $x \\gt 3$ — 1).",
    "$-1{,}5 \\le m \\lt 1{,}5$: 3 общие точки (на $x \\lt 2$ — 1, на $2 \\le x \\le 3$ — 1, на $x \\gt 3$ — 1).",
    "$m = 1{,}5$: 2 общие точки (на $x \\lt 2$ — 0, на $2 \\le x \\le 3$ — 1, на $x \\gt 3$ — 1).",
    "$m \\gt 1{,}5$: одна общая точка (на $x \\lt 2$ — 0, на $2 \\le x \\le 3$ — 0, на $x \\gt 3$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $-3 \\lt m \\lt -1{,}5$ и $m = 1{,}5$."
   ]
  },
  {
   "id": "22.fipi.03E125",
   "group": "lin3",
   "fipi": "03E125",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}4x - 5 \\\\ - 2{,}5x + 5 \\\\ x - 9\\end{cases}\\begin{cases} \\\\ \\\\ \\end{cases}\\begin{cases}x \\lt 1, \\\\ 1 \\le x \\le 4, \\\\ x \\gt 4.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-5; -1≤m≤2,5",
     "tex": "m = -5;\\ -1 \\le m \\le 2{,}5"
    }
   ],
   "answerTex": "$m = -5$; $-1 \\le m \\le 2{,}5$",
   "steps": [
    "При $x \\lt 1$ график — прямая $y = 4x - 5$: с ростом $x$ значения растут.",
    "При $1 \\le x \\lt 4$ график — прямая $y = -2{,}5x + 5$: с ростом $x$ значения убывают.",
    "При $x \\ge 4$ график — прямая $y = x - 9$: с ростом $x$ значения растут.",
    "При $x = 1$ функция определена: $y(1) = 2{,}5$, точка $(1;\\ 2{,}5)$ входит в график; значение слева $-1$ — точка $(1;\\ -1)$ выколота.",
    "При $x = 4$ функция определена: $y(4) = -5$, точка $(4;\\ -5)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.03E125]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -5$: одна общая точка (на $x \\lt 1$ — 1, на $1 \\le x \\lt 4$ — 0, на $x \\ge 4$ — 0).",
    "$m = -5$: 2 общие точки (на $x \\lt 1$ — 1, на $1 \\le x \\lt 4$ — 0, на $x \\ge 4$ — 1).",
    "$-5 \\lt m \\lt -1$: 3 общие точки (на $x \\lt 1$ — 1, на $1 \\le x \\lt 4$ — 1, на $x \\ge 4$ — 1).",
    "$-1 \\le m \\le 2{,}5$: 2 общие точки (на $x \\lt 1$ — 0, на $1 \\le x \\lt 4$ — 1, на $x \\ge 4$ — 1).",
    "$m \\gt 2{,}5$: одна общая точка (на $x \\lt 1$ — 0, на $1 \\le x \\lt 4$ — 0, на $x \\ge 4$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -5$ и $-1 \\le m \\le 2{,}5$."
   ]
  },
  {
   "id": "22.fipi.8228A6",
   "group": "lin3",
   "fipi": "8228A6",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}2{,}5x - 3{,}5 \\\\ - 2{,}5x + 4 \\\\ 1{,}5x - 8\\end{cases}\\begin{cases} \\\\ \\\\ \\end{cases}\\begin{cases}x \\lt 1, \\\\ 1 \\le x \\le 3, \\\\ x \\gt 3.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-3,5; -1≤m≤1,5",
     "tex": "m = -3{,}5;\\ -1 \\le m \\le 1{,}5"
    }
   ],
   "answerTex": "$m = -3{,}5$; $-1 \\le m \\le 1{,}5$",
   "steps": [
    "При $x \\lt 1$ график — прямая $y = 2{,}5x - 3{,}5$: с ростом $x$ значения растут.",
    "При $1 \\le x \\lt 3$ график — прямая $y = -2{,}5x + 4$: с ростом $x$ значения убывают.",
    "При $x \\ge 3$ график — прямая $y = 1{,}5x - 8$: с ростом $x$ значения растут.",
    "При $x = 1$ функция определена: $y(1) = 1{,}5$, точка $(1;\\ 1{,}5)$ входит в график; значение слева $-1$ — точка $(1;\\ -1)$ выколота.",
    "При $x = 3$ функция определена: $y(3) = -3{,}5$, точка $(3;\\ -3{,}5)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.8228A6]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -3{,}5$: одна общая точка (на $x \\lt 1$ — 1, на $1 \\le x \\lt 3$ — 0, на $x \\ge 3$ — 0).",
    "$m = -3{,}5$: 2 общие точки (на $x \\lt 1$ — 1, на $1 \\le x \\lt 3$ — 0, на $x \\ge 3$ — 1).",
    "$-3{,}5 \\lt m \\lt -1$: 3 общие точки (на $x \\lt 1$ — 1, на $1 \\le x \\lt 3$ — 1, на $x \\ge 3$ — 1).",
    "$-1 \\le m \\le 1{,}5$: 2 общие точки (на $x \\lt 1$ — 0, на $1 \\le x \\lt 3$ — 1, на $x \\ge 3$ — 1).",
    "$m \\gt 1{,}5$: одна общая точка (на $x \\lt 1$ — 0, на $1 \\le x \\lt 3$ — 0, на $x \\ge 3$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -3{,}5$ и $-1 \\le m \\le 1{,}5$."
   ]
  },
  {
   "id": "22.fipi.4296C4",
   "group": "lin3",
   "fipi": "4296C4",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}3x - 3 \\\\ - 3x + 8{,}5 \\\\ 3{,}5x - 11\\end{cases}\\begin{cases} \\\\ \\\\ \\end{cases}\\begin{cases}x \\lt 2, \\\\ 2 \\le x \\le 3, \\\\ x \\gt 3.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-0,5; 2,5<m<3",
     "tex": "m = -0{,}5;\\ 2{,}5 \\lt m \\lt 3"
    }
   ],
   "answerTex": "$m = -0{,}5$; $2{,}5 \\lt m \\lt 3$",
   "steps": [
    "При $x \\lt 2$ график — прямая $y = 3x - 3$: с ростом $x$ значения растут.",
    "При $2 \\le x \\lt 3$ график — прямая $y = -3x + 8{,}5$: с ростом $x$ значения убывают.",
    "При $x \\ge 3$ график — прямая $y = 3{,}5x - 11$: с ростом $x$ значения растут.",
    "При $x = 2$ функция определена: $y(2) = 2{,}5$, точка $(2;\\ 2{,}5)$ входит в график; значение слева $3$ — точка $(2;\\ 3)$ выколота.",
    "При $x = 3$ функция определена: $y(3) = -0{,}5$, точка $(3;\\ -0{,}5)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.4296C4]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -0{,}5$: одна общая точка (на $x \\lt 2$ — 1, на $2 \\le x \\lt 3$ — 0, на $x \\ge 3$ — 0).",
    "$m = -0{,}5$: 2 общие точки (на $x \\lt 2$ — 1, на $2 \\le x \\lt 3$ — 0, на $x \\ge 3$ — 1).",
    "$-0{,}5 \\lt m \\le 2{,}5$: 3 общие точки (на $x \\lt 2$ — 1, на $2 \\le x \\lt 3$ — 1, на $x \\ge 3$ — 1).",
    "$2{,}5 \\lt m \\lt 3$: 2 общие точки (на $x \\lt 2$ — 1, на $2 \\le x \\lt 3$ — 0, на $x \\ge 3$ — 1).",
    "$m \\ge 3$: одна общая точка (на $x \\lt 2$ — 0, на $2 \\le x \\lt 3$ — 0, на $x \\ge 3$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -0{,}5$ и $2{,}5 \\lt m \\lt 3$."
   ]
  },
  {
   "id": "22.fipi.DCCD98",
   "group": "lin3",
   "fipi": "DCCD98",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}1{,}5x - 1 \\\\ - 1{,}5x + 3 \\\\ 3x - 10{,}5\\end{cases}\\begin{cases} \\\\ \\\\ \\end{cases}\\begin{cases}x \\lt 2, \\\\ 2 \\le x \\le 3, \\\\ x \\gt 3.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-1,5; 0<m<2",
     "tex": "m = -1{,}5;\\ 0 \\lt m \\lt 2"
    }
   ],
   "answerTex": "$m = -1{,}5$; $0 \\lt m \\lt 2$",
   "steps": [
    "При $x \\lt 2$ график — прямая $y = 1{,}5x - 1$: с ростом $x$ значения растут.",
    "При $2 \\le x \\lt 3$ график — прямая $y = -1{,}5x + 3$: с ростом $x$ значения убывают.",
    "При $x \\ge 3$ график — прямая $y = 3x - 10{,}5$: с ростом $x$ значения растут.",
    "При $x = 2$ функция определена: $y(2) = 0$, точка $(2;\\ 0)$ входит в график; значение слева $2$ — точка $(2;\\ 2)$ выколота.",
    "При $x = 3$ функция определена: $y(3) = -1{,}5$, точка $(3;\\ -1{,}5)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.DCCD98]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -1{,}5$: одна общая точка (на $x \\lt 2$ — 1, на $2 \\le x \\lt 3$ — 0, на $x \\ge 3$ — 0).",
    "$m = -1{,}5$: 2 общие точки (на $x \\lt 2$ — 1, на $2 \\le x \\lt 3$ — 0, на $x \\ge 3$ — 1).",
    "$-1{,}5 \\lt m \\le 0$: 3 общие точки (на $x \\lt 2$ — 1, на $2 \\le x \\lt 3$ — 1, на $x \\ge 3$ — 1).",
    "$0 \\lt m \\lt 2$: 2 общие точки (на $x \\lt 2$ — 1, на $2 \\le x \\lt 3$ — 0, на $x \\ge 3$ — 1).",
    "$m \\ge 2$: одна общая точка (на $x \\lt 2$ — 0, на $2 \\le x \\lt 3$ — 0, на $x \\ge 3$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -1{,}5$ и $0 \\lt m \\lt 2$."
   ]
  },
  {
   "id": "22.fipi.90FF4E",
   "group": "par_lin",
   "fipi": "90FF4E",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}x^{2} + 6x + 7 \\\\ x + 10\\end{cases}\\begin{cases} \\\\ \\end{cases}\\begin{cases}x \\ge - 4, \\\\ x \\lt - 4.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-2; -1<m<6",
     "tex": "m = -2;\\ -1 \\lt m \\lt 6"
    }
   ],
   "answerTex": "$m = -2$; $-1 \\lt m \\lt 6$",
   "steps": [
    "При $x \\lt -4$ график — прямая $y = x + 10$: с ростом $x$ значения растут.",
    "При $x \\ge -4$ график — парабола $y = x^{2} + 6x + 7$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{6}{2 \\cdot 1} = -3$, $y_0 = (-3)^{2} + 6 \\cdot (-3) + 7 = -2$.",
    "Вершина $(-3;\\ -2)$ лежит на этом промежутке и входит в график.",
    "При $x = -4$ функция определена: $y(-4) = -1$, точка $(-4;\\ -1)$ входит в график; значение слева $6$ — точка $(-4;\\ 6)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.90FF4E]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -2$: одна общая точка (на $x \\lt -4$ — 1, на $x \\ge -4$ — 0).",
    "$m = -2$: 2 общие точки (на $x \\lt -4$ — 1, на $x \\ge -4$ — 1).",
    "$-2 \\lt m \\le -1$: 3 общие точки (на $x \\lt -4$ — 1, на $x \\ge -4$ — 2).",
    "$-1 \\lt m \\lt 6$: 2 общие точки (на $x \\lt -4$ — 1, на $x \\ge -4$ — 1).",
    "$m \\ge 6$: одна общая точка (на $x \\lt -4$ — 0, на $x \\ge -4$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -2$ и $-1 \\lt m \\lt 6$."
   ]
  },
  {
   "id": "22.fipi.447D77",
   "group": "par_lin",
   "fipi": "447D77",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}- x^{2} + 8x - 17 \\\\ - x - 2\\end{cases}\\begin{cases} \\\\ \\end{cases}\\begin{cases}x \\ge 2, \\\\ x \\lt 2.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "-5≤m≤-4; m=-1",
     "tex": "-5 \\le m \\le -4;\\ m = -1"
    }
   ],
   "answerTex": "$-5 \\le m \\le -4$; $m = -1$",
   "steps": [
    "При $x \\lt 2$ график — прямая $y = -x - 2$: с ростом $x$ значения убывают.",
    "При $x \\ge 2$ график — парабола $y = -x^{2} + 8x - 17$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{8}{2 \\cdot (-1)} = 4$, $y_0 = -4^{2} + 8 \\cdot 4 - 17 = -1$.",
    "Вершина $(4;\\ -1)$ лежит на этом промежутке и входит в график.",
    "При $x = 2$ функция определена: $y(2) = -5$, точка $(2;\\ -5)$ входит в график; значение слева $-4$ — точка $(2;\\ -4)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.447D77]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -5$: одна общая точка (на $x \\lt 2$ — 0, на $x \\ge 2$ — 1).",
    "$-5 \\le m \\le -4$: 2 общие точки (на $x \\lt 2$ — 0, на $x \\ge 2$ — 2).",
    "$-4 \\lt m \\lt -1$: 3 общие точки (на $x \\lt 2$ — 1, на $x \\ge 2$ — 2).",
    "$m = -1$: 2 общие точки (на $x \\lt 2$ — 1, на $x \\ge 2$ — 1).",
    "$m \\gt -1$: одна общая точка (на $x \\lt 2$ — 1, на $x \\ge 2$ — 0).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $-5 \\le m \\le -4$ и $m = -1$."
   ]
  },
  {
   "id": "22.fipi.5BD2BC",
   "group": "par_lin",
   "fipi": "5BD2BC",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}- x^{2} + 2x + 3 \\\\ - x + 1\\end{cases}\\begin{cases} \\\\ \\end{cases}\\begin{cases}x \\ge - 1, \\\\ x \\lt - 1.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "0≤m≤2; m=4",
     "tex": "0 \\le m \\le 2;\\ m = 4"
    }
   ],
   "answerTex": "$0 \\le m \\le 2$; $m = 4$",
   "steps": [
    "При $x \\lt -1$ график — прямая $y = -x + 1$: с ростом $x$ значения убывают.",
    "При $x \\ge -1$ график — парабола $y = -x^{2} + 2x + 3$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{2}{2 \\cdot (-1)} = 1$, $y_0 = -1^{2} + 2 \\cdot 1 + 3 = 4$.",
    "Вершина $(1;\\ 4)$ лежит на этом промежутке и входит в график.",
    "При $x = -1$ функция определена: $y(-1) = 0$, точка $(-1;\\ 0)$ входит в график; значение слева $2$ — точка $(-1;\\ 2)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.5BD2BC]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: одна общая точка (на $x \\lt -1$ — 0, на $x \\ge -1$ — 1).",
    "$0 \\le m \\le 2$: 2 общие точки (на $x \\lt -1$ — 0, на $x \\ge -1$ — 2).",
    "$2 \\lt m \\lt 4$: 3 общие точки (на $x \\lt -1$ — 1, на $x \\ge -1$ — 2).",
    "$m = 4$: 2 общие точки (на $x \\lt -1$ — 1, на $x \\ge -1$ — 1).",
    "$m \\gt 4$: одна общая точка (на $x \\lt -1$ — 1, на $x \\ge -1$ — 0).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $0 \\le m \\le 2$ и $m = 4$."
   ]
  },
  {
   "id": "22.fipi.9E02BA",
   "group": "par_lin",
   "fipi": "9E02BA",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}x^{2} - 6x + 10 \\\\ x + 2\\end{cases}\\begin{cases} \\\\ \\end{cases}\\begin{cases}x \\ge 1, \\\\ x \\lt 1.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=1; 3≤m≤5",
     "tex": "m = 1;\\ 3 \\le m \\le 5"
    }
   ],
   "answerTex": "$m = 1$; $3 \\le m \\le 5$",
   "steps": [
    "При $x \\lt 1$ график — прямая $y = x + 2$: с ростом $x$ значения растут.",
    "При $x \\ge 1$ график — парабола $y = x^{2} - 6x + 10$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-6}{2 \\cdot 1} = 3$, $y_0 = 3^{2} - 6 \\cdot 3 + 10 = 1$.",
    "Вершина $(3;\\ 1)$ лежит на этом промежутке и входит в график.",
    "При $x = 1$ функция определена: $y(1) = 5$, точка $(1;\\ 5)$ входит в график; значение слева $3$ — точка $(1;\\ 3)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.9E02BA]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 1$: одна общая точка (на $x \\lt 1$ — 1, на $x \\ge 1$ — 0).",
    "$m = 1$: 2 общие точки (на $x \\lt 1$ — 1, на $x \\ge 1$ — 1).",
    "$1 \\lt m \\lt 3$: 3 общие точки (на $x \\lt 1$ — 1, на $x \\ge 1$ — 2).",
    "$3 \\le m \\le 5$: 2 общие точки (на $x \\lt 1$ — 0, на $x \\ge 1$ — 2).",
    "$m \\gt 5$: одна общая точка (на $x \\lt 1$ — 0, на $x \\ge 1$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = 1$ и $3 \\le m \\le 5$."
   ]
  },
  {
   "id": "22.fipi.68001C",
   "group": "par_lin",
   "fipi": "68001C",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}x^{2} - 8x + 14 \\\\ x - 2\\end{cases}\\begin{cases} \\\\ \\end{cases}\\begin{cases}x \\ge 3, \\\\ x \\lt 3.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-2; -1<m<1",
     "tex": "m = -2;\\ -1 \\lt m \\lt 1"
    }
   ],
   "answerTex": "$m = -2$; $-1 \\lt m \\lt 1$",
   "steps": [
    "При $x \\lt 3$ график — прямая $y = x - 2$: с ростом $x$ значения растут.",
    "При $x \\ge 3$ график — парабола $y = x^{2} - 8x + 14$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-8}{2 \\cdot 1} = 4$, $y_0 = 4^{2} - 8 \\cdot 4 + 14 = -2$.",
    "Вершина $(4;\\ -2)$ лежит на этом промежутке и входит в график.",
    "При $x = 3$ функция определена: $y(3) = -1$, точка $(3;\\ -1)$ входит в график; значение слева $1$ — точка $(3;\\ 1)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.68001C]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -2$: одна общая точка (на $x \\lt 3$ — 1, на $x \\ge 3$ — 0).",
    "$m = -2$: 2 общие точки (на $x \\lt 3$ — 1, на $x \\ge 3$ — 1).",
    "$-2 \\lt m \\le -1$: 3 общие точки (на $x \\lt 3$ — 1, на $x \\ge 3$ — 2).",
    "$-1 \\lt m \\lt 1$: 2 общие точки (на $x \\lt 3$ — 1, на $x \\ge 3$ — 1).",
    "$m \\ge 1$: одна общая точка (на $x \\lt 3$ — 0, на $x \\ge 3$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -2$ и $-1 \\lt m \\lt 1$."
   ]
  },
  {
   "id": "22.fipi.DB3225",
   "group": "par_lin",
   "fipi": "DB3225",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}x^{2} - 6x + 6 \\\\ x - 3\\end{cases}\\begin{cases} \\\\ \\end{cases}\\begin{cases}x \\ge 2, \\\\ x \\lt 2.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-3; -2<m<-1",
     "tex": "m = -3;\\ -2 \\lt m \\lt -1"
    }
   ],
   "answerTex": "$m = -3$; $-2 \\lt m \\lt -1$",
   "steps": [
    "При $x \\lt 2$ график — прямая $y = x - 3$: с ростом $x$ значения растут.",
    "При $x \\ge 2$ график — парабола $y = x^{2} - 6x + 6$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-6}{2 \\cdot 1} = 3$, $y_0 = 3^{2} - 6 \\cdot 3 + 6 = -3$.",
    "Вершина $(3;\\ -3)$ лежит на этом промежутке и входит в график.",
    "При $x = 2$ функция определена: $y(2) = -2$, точка $(2;\\ -2)$ входит в график; значение слева $-1$ — точка $(2;\\ -1)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.DB3225]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -3$: одна общая точка (на $x \\lt 2$ — 1, на $x \\ge 2$ — 0).",
    "$m = -3$: 2 общие точки (на $x \\lt 2$ — 1, на $x \\ge 2$ — 1).",
    "$-3 \\lt m \\le -2$: 3 общие точки (на $x \\lt 2$ — 1, на $x \\ge 2$ — 2).",
    "$-2 \\lt m \\lt -1$: 2 общие точки (на $x \\lt 2$ — 1, на $x \\ge 2$ — 1).",
    "$m \\ge -1$: одна общая точка (на $x \\lt 2$ — 0, на $x \\ge 2$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -3$ и $-2 \\lt m \\lt -1$."
   ]
  },
  {
   "id": "22.fipi.89C3D3",
   "group": "par_lin",
   "fipi": "89C3D3",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}x^{2} + 4x - 1 \\\\ x\\end{cases}\\begin{cases} \\\\ \\end{cases}\\begin{cases}x \\ge - 4, \\\\ x \\lt - 4.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-5; -4≤m≤-1",
     "tex": "m = -5;\\ -4 \\le m \\le -1"
    }
   ],
   "answerTex": "$m = -5$; $-4 \\le m \\le -1$",
   "steps": [
    "При $x \\lt -4$ график — прямая $y = x$: с ростом $x$ значения растут.",
    "При $x \\ge -4$ график — парабола $y = x^{2} + 4x - 1$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{4}{2 \\cdot 1} = -2$, $y_0 = (-2)^{2} + 4 \\cdot (-2) - 1 = -5$.",
    "Вершина $(-2;\\ -5)$ лежит на этом промежутке и входит в график.",
    "При $x = -4$ функция определена: $y(-4) = -1$, точка $(-4;\\ -1)$ входит в график; значение слева $-4$ — точка $(-4;\\ -4)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.89C3D3]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -5$: одна общая точка (на $x \\lt -4$ — 1, на $x \\ge -4$ — 0).",
    "$m = -5$: 2 общие точки (на $x \\lt -4$ — 1, на $x \\ge -4$ — 1).",
    "$-5 \\lt m \\lt -4$: 3 общие точки (на $x \\lt -4$ — 1, на $x \\ge -4$ — 2).",
    "$-4 \\le m \\le -1$: 2 общие точки (на $x \\lt -4$ — 0, на $x \\ge -4$ — 2).",
    "$m \\gt -1$: одна общая точка (на $x \\lt -4$ — 0, на $x \\ge -4$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -5$ и $-4 \\le m \\le -1$."
   ]
  },
  {
   "id": "22.fipi.E1EE5C",
   "group": "par_lin",
   "fipi": "E1EE5C",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}- x^{2} - 4x - 1 \\\\ - x - 3\\end{cases}\\begin{cases} \\\\ \\end{cases}\\begin{cases}x \\ge - 3, \\\\ x \\lt - 3.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "0<m<2; m=3",
     "tex": "0 \\lt m \\lt 2;\\ m = 3"
    }
   ],
   "answerTex": "$0 \\lt m \\lt 2$; $m = 3$",
   "steps": [
    "При $x \\lt -3$ график — прямая $y = -x - 3$: с ростом $x$ значения убывают.",
    "При $x \\ge -3$ график — парабола $y = -x^{2} - 4x - 1$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-4}{2 \\cdot (-1)} = -2$, $y_0 = -(-2)^{2} - 4 \\cdot (-2) - 1 = 3$.",
    "Вершина $(-2;\\ 3)$ лежит на этом промежутке и входит в график.",
    "При $x = -3$ функция определена: $y(-3) = 2$, точка $(-3;\\ 2)$ входит в график; значение слева $0$ — точка $(-3;\\ 0)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.E1EE5C]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\le 0$: одна общая точка (на $x \\lt -3$ — 0, на $x \\ge -3$ — 1).",
    "$0 \\lt m \\lt 2$: 2 общие точки (на $x \\lt -3$ — 1, на $x \\ge -3$ — 1).",
    "$2 \\le m \\lt 3$: 3 общие точки (на $x \\lt -3$ — 1, на $x \\ge -3$ — 2).",
    "$m = 3$: 2 общие точки (на $x \\lt -3$ — 1, на $x \\ge -3$ — 1).",
    "$m \\gt 3$: одна общая точка (на $x \\lt -3$ — 1, на $x \\ge -3$ — 0).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $0 \\lt m \\lt 2$ и $m = 3$."
   ]
  },
  {
   "id": "22.fipi.E05C3B",
   "group": "par_lin",
   "fipi": "E05C3B",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}- x^{2} + 6x - 9 \\\\ - x\\end{cases}\\begin{cases} \\\\ \\end{cases}\\begin{cases}x \\ge 2, \\\\ x \\lt 2.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "-2<m<-1; m=0",
     "tex": "-2 \\lt m \\lt -1;\\ m = 0"
    }
   ],
   "answerTex": "$-2 \\lt m \\lt -1$; $m = 0$",
   "steps": [
    "При $x \\lt 2$ график — прямая $y = -x$: с ростом $x$ значения убывают.",
    "При $x \\ge 2$ график — парабола $y = -x^{2} + 6x - 9$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{6}{2 \\cdot (-1)} = 3$, $y_0 = -3^{2} + 6 \\cdot 3 - 9 = 0$.",
    "Вершина $(3;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = 2$ функция определена: $y(2) = -1$, точка $(2;\\ -1)$ входит в график; значение слева $-2$ — точка $(2;\\ -2)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.E05C3B]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\le -2$: одна общая точка (на $x \\lt 2$ — 0, на $x \\ge 2$ — 1).",
    "$-2 \\lt m \\lt -1$: 2 общие точки (на $x \\lt 2$ — 1, на $x \\ge 2$ — 1).",
    "$-1 \\le m \\lt 0$: 3 общие точки (на $x \\lt 2$ — 1, на $x \\ge 2$ — 2).",
    "$m = 0$: 2 общие точки (на $x \\lt 2$ — 1, на $x \\ge 2$ — 1).",
    "$m \\gt 0$: одна общая точка (на $x \\lt 2$ — 1, на $x \\ge 2$ — 0).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $-2 \\lt m \\lt -1$ и $m = 0$."
   ]
  },
  {
   "id": "22.fipi.E73835",
   "group": "par_lin",
   "fipi": "E73835",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}- x^{2} - 2x + 2 \\\\ - x - 2\\end{cases}\\begin{cases} \\\\ \\end{cases}\\begin{cases}x \\ge - 3, \\\\ x \\lt - 3.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "-1≤m≤1; m=3",
     "tex": "-1 \\le m \\le 1;\\ m = 3"
    }
   ],
   "answerTex": "$-1 \\le m \\le 1$; $m = 3$",
   "steps": [
    "При $x \\lt -3$ график — прямая $y = -x - 2$: с ростом $x$ значения убывают.",
    "При $x \\ge -3$ график — парабола $y = -x^{2} - 2x + 2$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-2}{2 \\cdot (-1)} = -1$, $y_0 = -(-1)^{2} - 2 \\cdot (-1) + 2 = 3$.",
    "Вершина $(-1;\\ 3)$ лежит на этом промежутке и входит в график.",
    "При $x = -3$ функция определена: $y(-3) = -1$, точка $(-3;\\ -1)$ входит в график; значение слева $1$ — точка $(-3;\\ 1)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.E73835]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -1$: одна общая точка (на $x \\lt -3$ — 0, на $x \\ge -3$ — 1).",
    "$-1 \\le m \\le 1$: 2 общие точки (на $x \\lt -3$ — 0, на $x \\ge -3$ — 2).",
    "$1 \\lt m \\lt 3$: 3 общие точки (на $x \\lt -3$ — 1, на $x \\ge -3$ — 2).",
    "$m = 3$: 2 общие точки (на $x \\lt -3$ — 1, на $x \\ge -3$ — 1).",
    "$m \\gt 3$: одна общая точка (на $x \\lt -3$ — 1, на $x \\ge -3$ — 0).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $-1 \\le m \\le 1$ и $m = 3$."
   ]
  },
  {
   "id": "22.fipi.1CE27B",
   "group": "par_lin",
   "fipi": "1CE27B",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}- x^{2} - 2x + 3 \\\\ - x - 1\\end{cases}\\begin{cases} \\\\ \\end{cases}\\begin{cases}x \\ge - 2, \\\\ x \\lt - 2.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "1<m<3; m=4",
     "tex": "1 \\lt m \\lt 3;\\ m = 4"
    }
   ],
   "answerTex": "$1 \\lt m \\lt 3$; $m = 4$",
   "steps": [
    "При $x \\lt -2$ график — прямая $y = -x - 1$: с ростом $x$ значения убывают.",
    "При $x \\ge -2$ график — парабола $y = -x^{2} - 2x + 3$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-2}{2 \\cdot (-1)} = -1$, $y_0 = -(-1)^{2} - 2 \\cdot (-1) + 3 = 4$.",
    "Вершина $(-1;\\ 4)$ лежит на этом промежутке и входит в график.",
    "При $x = -2$ функция определена: $y(-2) = 3$, точка $(-2;\\ 3)$ входит в график; значение слева $1$ — точка $(-2;\\ 1)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.1CE27B]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\le 1$: одна общая точка (на $x \\lt -2$ — 0, на $x \\ge -2$ — 1).",
    "$1 \\lt m \\lt 3$: 2 общие точки (на $x \\lt -2$ — 1, на $x \\ge -2$ — 1).",
    "$3 \\le m \\lt 4$: 3 общие точки (на $x \\lt -2$ — 1, на $x \\ge -2$ — 2).",
    "$m = 4$: 2 общие точки (на $x \\lt -2$ — 1, на $x \\ge -2$ — 1).",
    "$m \\gt 4$: одна общая точка (на $x \\lt -2$ — 1, на $x \\ge -2$ — 0).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $1 \\lt m \\lt 3$ и $m = 4$."
   ]
  },
  {
   "id": "22.fipi.F3131F",
   "group": "par_lin",
   "fipi": "F3131F",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}- x^{2} - 4x + 1 \\\\ - x - 2\\end{cases}\\begin{cases} \\\\ \\end{cases}\\begin{cases}x \\ge - 3, \\\\ x \\lt - 3.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "1<m<4; m=5",
     "tex": "1 \\lt m \\lt 4;\\ m = 5"
    }
   ],
   "answerTex": "$1 \\lt m \\lt 4$; $m = 5$",
   "steps": [
    "При $x \\lt -3$ график — прямая $y = -x - 2$: с ростом $x$ значения убывают.",
    "При $x \\ge -3$ график — парабола $y = -x^{2} - 4x + 1$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-4}{2 \\cdot (-1)} = -2$, $y_0 = -(-2)^{2} - 4 \\cdot (-2) + 1 = 5$.",
    "Вершина $(-2;\\ 5)$ лежит на этом промежутке и входит в график.",
    "При $x = -3$ функция определена: $y(-3) = 4$, точка $(-3;\\ 4)$ входит в график; значение слева $1$ — точка $(-3;\\ 1)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.F3131F]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\le 1$: одна общая точка (на $x \\lt -3$ — 0, на $x \\ge -3$ — 1).",
    "$1 \\lt m \\lt 4$: 2 общие точки (на $x \\lt -3$ — 1, на $x \\ge -3$ — 1).",
    "$4 \\le m \\lt 5$: 3 общие точки (на $x \\lt -3$ — 1, на $x \\ge -3$ — 2).",
    "$m = 5$: 2 общие точки (на $x \\lt -3$ — 1, на $x \\ge -3$ — 1).",
    "$m \\gt 5$: одна общая точка (на $x \\lt -3$ — 1, на $x \\ge -3$ — 0).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $1 \\lt m \\lt 4$ и $m = 5$."
   ]
  },
  {
   "id": "22.fipi.E88E19",
   "group": "par_lin",
   "fipi": "E88E19",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}- x^{2} + 10x - 21 \\\\ - x + 5\\end{cases}\\begin{cases} \\\\ \\end{cases}\\begin{cases}x \\ge 3, \\\\ x \\lt 3.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "0≤m≤2; m=4",
     "tex": "0 \\le m \\le 2;\\ m = 4"
    }
   ],
   "answerTex": "$0 \\le m \\le 2$; $m = 4$",
   "steps": [
    "При $x \\lt 3$ график — прямая $y = -x + 5$: с ростом $x$ значения убывают.",
    "При $x \\ge 3$ график — парабола $y = -x^{2} + 10x - 21$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{10}{2 \\cdot (-1)} = 5$, $y_0 = -5^{2} + 10 \\cdot 5 - 21 = 4$.",
    "Вершина $(5;\\ 4)$ лежит на этом промежутке и входит в график.",
    "При $x = 3$ функция определена: $y(3) = 0$, точка $(3;\\ 0)$ входит в график; значение слева $2$ — точка $(3;\\ 2)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.E88E19]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: одна общая точка (на $x \\lt 3$ — 0, на $x \\ge 3$ — 1).",
    "$0 \\le m \\le 2$: 2 общие точки (на $x \\lt 3$ — 0, на $x \\ge 3$ — 2).",
    "$2 \\lt m \\lt 4$: 3 общие точки (на $x \\lt 3$ — 1, на $x \\ge 3$ — 2).",
    "$m = 4$: 2 общие точки (на $x \\lt 3$ — 1, на $x \\ge 3$ — 1).",
    "$m \\gt 4$: одна общая точка (на $x \\lt 3$ — 1, на $x \\ge 3$ — 0).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $0 \\le m \\le 2$ и $m = 4$."
   ]
  },
  {
   "id": "22.fipi.C16D27",
   "group": "par_lin",
   "fipi": "C16D27",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}- x^{2} - 2x + 1 \\\\ - x - 2\\end{cases}\\begin{cases} \\\\ \\end{cases}\\begin{cases}x \\ge - 3, \\\\ x \\lt - 3.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "-2≤m≤1; m=2",
     "tex": "-2 \\le m \\le 1;\\ m = 2"
    }
   ],
   "answerTex": "$-2 \\le m \\le 1$; $m = 2$",
   "steps": [
    "При $x \\lt -3$ график — прямая $y = -x - 2$: с ростом $x$ значения убывают.",
    "При $x \\ge -3$ график — парабола $y = -x^{2} - 2x + 1$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-2}{2 \\cdot (-1)} = -1$, $y_0 = -(-1)^{2} - 2 \\cdot (-1) + 1 = 2$.",
    "Вершина $(-1;\\ 2)$ лежит на этом промежутке и входит в график.",
    "При $x = -3$ функция определена: $y(-3) = -2$, точка $(-3;\\ -2)$ входит в график; значение слева $1$ — точка $(-3;\\ 1)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.C16D27]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -2$: одна общая точка (на $x \\lt -3$ — 0, на $x \\ge -3$ — 1).",
    "$-2 \\le m \\le 1$: 2 общие точки (на $x \\lt -3$ — 0, на $x \\ge -3$ — 2).",
    "$1 \\lt m \\lt 2$: 3 общие точки (на $x \\lt -3$ — 1, на $x \\ge -3$ — 2).",
    "$m = 2$: 2 общие точки (на $x \\lt -3$ — 1, на $x \\ge -3$ — 1).",
    "$m \\gt 2$: одна общая точка (на $x \\lt -3$ — 1, на $x \\ge -3$ — 0).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $-2 \\le m \\le 1$ и $m = 2$."
   ]
  },
  {
   "id": "22.fipi.693B2F",
   "group": "par_lin",
   "fipi": "693B2F",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}- x^{2} - 2x - 3 \\\\ - x - 7\\end{cases}\\begin{cases} \\\\ \\end{cases}\\begin{cases}x \\ge - 2, \\\\ x \\lt - 2.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "-5<m<-3; m=-2",
     "tex": "-5 \\lt m \\lt -3;\\ m = -2"
    }
   ],
   "answerTex": "$-5 \\lt m \\lt -3$; $m = -2$",
   "steps": [
    "При $x \\lt -2$ график — прямая $y = -x - 7$: с ростом $x$ значения убывают.",
    "При $x \\ge -2$ график — парабола $y = -x^{2} - 2x - 3$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-2}{2 \\cdot (-1)} = -1$, $y_0 = -(-1)^{2} - 2 \\cdot (-1) - 3 = -2$.",
    "Вершина $(-1;\\ -2)$ лежит на этом промежутке и входит в график.",
    "При $x = -2$ функция определена: $y(-2) = -3$, точка $(-2;\\ -3)$ входит в график; значение слева $-5$ — точка $(-2;\\ -5)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.693B2F]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\le -5$: одна общая точка (на $x \\lt -2$ — 0, на $x \\ge -2$ — 1).",
    "$-5 \\lt m \\lt -3$: 2 общие точки (на $x \\lt -2$ — 1, на $x \\ge -2$ — 1).",
    "$-3 \\le m \\lt -2$: 3 общие точки (на $x \\lt -2$ — 1, на $x \\ge -2$ — 2).",
    "$m = -2$: 2 общие точки (на $x \\lt -2$ — 1, на $x \\ge -2$ — 1).",
    "$m \\gt -2$: одна общая точка (на $x \\lt -2$ — 1, на $x \\ge -2$ — 0).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $-5 \\lt m \\lt -3$ и $m = -2$."
   ]
  },
  {
   "id": "22.fipi.67EDD6",
   "group": "par_lin",
   "fipi": "67EDD6",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}x^{2} - 10x + 25 \\\\ x - 2\\end{cases}\\begin{cases} \\\\ \\end{cases}\\begin{cases}x \\ge 4, \\\\ x \\lt 4.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=0; 1<m<2",
     "tex": "m = 0;\\ 1 \\lt m \\lt 2"
    }
   ],
   "answerTex": "$m = 0$; $1 \\lt m \\lt 2$",
   "steps": [
    "При $x \\lt 4$ график — прямая $y = x - 2$: с ростом $x$ значения растут.",
    "При $x \\ge 4$ график — парабола $y = x^{2} - 10x + 25$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-10}{2 \\cdot 1} = 5$, $y_0 = 5^{2} - 10 \\cdot 5 + 25 = 0$.",
    "Вершина $(5;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = 4$ функция определена: $y(4) = 1$, точка $(4;\\ 1)$ входит в график; значение слева $2$ — точка $(4;\\ 2)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.67EDD6]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: одна общая точка (на $x \\lt 4$ — 1, на $x \\ge 4$ — 0).",
    "$m = 0$: 2 общие точки (на $x \\lt 4$ — 1, на $x \\ge 4$ — 1).",
    "$0 \\lt m \\le 1$: 3 общие точки (на $x \\lt 4$ — 1, на $x \\ge 4$ — 2).",
    "$1 \\lt m \\lt 2$: 2 общие точки (на $x \\lt 4$ — 1, на $x \\ge 4$ — 1).",
    "$m \\ge 2$: одна общая точка (на $x \\lt 4$ — 0, на $x \\ge 4$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = 0$ и $1 \\lt m \\lt 2$."
   ]
  },
  {
   "id": "22.fipi.BCD2CD",
   "group": "par_lin",
   "fipi": "BCD2CD",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}x^{2} + 2x + 1 \\\\ x + 6\\end{cases}\\begin{cases} \\\\ \\end{cases}\\begin{cases}x \\ge - 2, \\\\ x \\lt - 2.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=0; 1<m<4",
     "tex": "m = 0;\\ 1 \\lt m \\lt 4"
    }
   ],
   "answerTex": "$m = 0$; $1 \\lt m \\lt 4$",
   "steps": [
    "При $x \\lt -2$ график — прямая $y = x + 6$: с ростом $x$ значения растут.",
    "При $x \\ge -2$ график — парабола $y = x^{2} + 2x + 1$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{2}{2 \\cdot 1} = -1$, $y_0 = (-1)^{2} + 2 \\cdot (-1) + 1 = 0$.",
    "Вершина $(-1;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = -2$ функция определена: $y(-2) = 1$, точка $(-2;\\ 1)$ входит в график; значение слева $4$ — точка $(-2;\\ 4)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.BCD2CD]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: одна общая точка (на $x \\lt -2$ — 1, на $x \\ge -2$ — 0).",
    "$m = 0$: 2 общие точки (на $x \\lt -2$ — 1, на $x \\ge -2$ — 1).",
    "$0 \\lt m \\le 1$: 3 общие точки (на $x \\lt -2$ — 1, на $x \\ge -2$ — 2).",
    "$1 \\lt m \\lt 4$: 2 общие точки (на $x \\lt -2$ — 1, на $x \\ge -2$ — 1).",
    "$m \\ge 4$: одна общая точка (на $x \\lt -2$ — 0, на $x \\ge -2$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = 0$ и $1 \\lt m \\lt 4$."
   ]
  },
  {
   "id": "22.fipi.93A1CB",
   "group": "par_lin",
   "fipi": "93A1CB",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}x^{2} - 4x + 5 \\\\ x + 3\\end{cases}\\begin{cases} \\\\ \\end{cases}\\begin{cases}x \\ge 1, \\\\ x \\lt 1.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=1; 2<m<4",
     "tex": "m = 1;\\ 2 \\lt m \\lt 4"
    }
   ],
   "answerTex": "$m = 1$; $2 \\lt m \\lt 4$",
   "steps": [
    "При $x \\lt 1$ график — прямая $y = x + 3$: с ростом $x$ значения растут.",
    "При $x \\ge 1$ график — парабола $y = x^{2} - 4x + 5$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-4}{2 \\cdot 1} = 2$, $y_0 = 2^{2} - 4 \\cdot 2 + 5 = 1$.",
    "Вершина $(2;\\ 1)$ лежит на этом промежутке и входит в график.",
    "При $x = 1$ функция определена: $y(1) = 2$, точка $(1;\\ 2)$ входит в график; значение слева $4$ — точка $(1;\\ 4)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.93A1CB]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 1$: одна общая точка (на $x \\lt 1$ — 1, на $x \\ge 1$ — 0).",
    "$m = 1$: 2 общие точки (на $x \\lt 1$ — 1, на $x \\ge 1$ — 1).",
    "$1 \\lt m \\le 2$: 3 общие точки (на $x \\lt 1$ — 1, на $x \\ge 1$ — 2).",
    "$2 \\lt m \\lt 4$: 2 общие точки (на $x \\lt 1$ — 1, на $x \\ge 1$ — 1).",
    "$m \\ge 4$: одна общая точка (на $x \\lt 1$ — 0, на $x \\ge 1$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = 1$ и $2 \\lt m \\lt 4$."
   ]
  },
  {
   "id": "22.fipi.38ED33",
   "group": "par_lin",
   "fipi": "38ED33",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}x^{2} - 6x + 11 \\\\ x + 3\\end{cases}\\begin{cases} \\\\ \\end{cases}\\begin{cases}x \\ge 2, \\\\ x \\lt 2.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=2; 3<m<5",
     "tex": "m = 2;\\ 3 \\lt m \\lt 5"
    }
   ],
   "answerTex": "$m = 2$; $3 \\lt m \\lt 5$",
   "steps": [
    "При $x \\lt 2$ график — прямая $y = x + 3$: с ростом $x$ значения растут.",
    "При $x \\ge 2$ график — парабола $y = x^{2} - 6x + 11$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-6}{2 \\cdot 1} = 3$, $y_0 = 3^{2} - 6 \\cdot 3 + 11 = 2$.",
    "Вершина $(3;\\ 2)$ лежит на этом промежутке и входит в график.",
    "При $x = 2$ функция определена: $y(2) = 3$, точка $(2;\\ 3)$ входит в график; значение слева $5$ — точка $(2;\\ 5)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.38ED33]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 2$: одна общая точка (на $x \\lt 2$ — 1, на $x \\ge 2$ — 0).",
    "$m = 2$: 2 общие точки (на $x \\lt 2$ — 1, на $x \\ge 2$ — 1).",
    "$2 \\lt m \\le 3$: 3 общие точки (на $x \\lt 2$ — 1, на $x \\ge 2$ — 2).",
    "$3 \\lt m \\lt 5$: 2 общие точки (на $x \\lt 2$ — 1, на $x \\ge 2$ — 1).",
    "$m \\ge 5$: одна общая точка (на $x \\lt 2$ — 0, на $x \\ge 2$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = 2$ и $3 \\lt m \\lt 5$."
   ]
  },
  {
   "id": "22.fipi.7AC286",
   "group": "par_lin",
   "fipi": "7AC286",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}x^{2} - 10x + 27 \\\\ x\\end{cases}\\begin{cases} \\\\ \\end{cases}\\begin{cases}x \\ge 4, \\\\ x \\lt 4.\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=2; 3<m<4",
     "tex": "m = 2;\\ 3 \\lt m \\lt 4"
    }
   ],
   "answerTex": "$m = 2$; $3 \\lt m \\lt 4$",
   "steps": [
    "При $x \\lt 4$ график — прямая $y = x$: с ростом $x$ значения растут.",
    "При $x \\ge 4$ график — парабола $y = x^{2} - 10x + 27$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-10}{2 \\cdot 1} = 5$, $y_0 = 5^{2} - 10 \\cdot 5 + 27 = 2$.",
    "Вершина $(5;\\ 2)$ лежит на этом промежутке и входит в график.",
    "При $x = 4$ функция определена: $y(4) = 3$, точка $(4;\\ 3)$ входит в график; значение слева $4$ — точка $(4;\\ 4)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.7AC286]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 2$: одна общая точка (на $x \\lt 4$ — 1, на $x \\ge 4$ — 0).",
    "$m = 2$: 2 общие точки (на $x \\lt 4$ — 1, на $x \\ge 4$ — 1).",
    "$2 \\lt m \\le 3$: 3 общие точки (на $x \\lt 4$ — 1, на $x \\ge 4$ — 2).",
    "$3 \\lt m \\lt 4$: 2 общие точки (на $x \\lt 4$ — 1, на $x \\ge 4$ — 1).",
    "$m \\ge 4$: одна общая точка (на $x \\lt 4$ — 0, на $x \\ge 4$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = 2$ и $3 \\lt m \\lt 4$."
   ]
  },
  {
   "id": "22.fipi.46EEF6",
   "group": "par_hyp",
   "fipi": "46EEF6",
   "text": "Постройте график функции $$y = \\begin{cases}x^{2} + 2x + 1x \\ge - 4, \\\\ - \\dfrac{36}{x}x \\lt - 4.\\end{cases}$$ и определите, при каких значениях $m$ прямая $y = m$ имеет с графиком одну или две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=0; m≥9",
     "tex": "m = 0;\\ m \\ge 9"
    }
   ],
   "answerTex": "$m = 0$; $m \\ge 9$",
   "steps": [
    "При $x \\lt -4$ график — гипербола $y = - \\dfrac{36}{x}$.",
    "При $x \\ge -4$ график — парабола $y = x^{2} + 2x + 1$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{2}{2 \\cdot 1} = -1$, $y_0 = (-1)^{2} + 2 \\cdot (-1) + 1 = 0$.",
    "Вершина $(-1;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = -4$ функция определена: $y(-4) = 9$, точка $(-4;\\ 9)$ входит в график (оба куска сходятся в ней).",
    "При $x \\to -\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.46EEF6]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: нет общих точек.",
    "$m = 0$: одна общая точка (на $x \\lt -4$ — 0, на $x \\ge -4$ — 1).",
    "$0 \\lt m \\lt 9$: 3 общие точки (на $x \\lt -4$ — 1, на $x \\ge -4$ — 2).",
    "$m = 9$: 2 общие точки (на $x \\lt -4$ — 0, на $x \\ge -4$ — 2).",
    "$m \\gt 9$: одна общая точка (на $x \\lt -4$ — 0, на $x \\ge -4$ — 1).",
    "Прямая $y = m$ имеет с графиком одну или две общие точки при $m = 0$ и $m \\ge 9$."
   ]
  },
  {
   "id": "22.fipi.46800C",
   "group": "par_hyp",
   "fipi": "46800C",
   "text": "Постройте график функции $$y = \\begin{cases}x^{2} - 4x + 4x \\ge - 1, \\\\ - \\dfrac{9}{x}x \\lt - 1.\\end{cases}$$ и определите, при каких значениях $m$ прямая $y = m$ имеет с графиком одну или две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=0; m≥9",
     "tex": "m = 0;\\ m \\ge 9"
    }
   ],
   "answerTex": "$m = 0$; $m \\ge 9$",
   "steps": [
    "При $x \\lt -1$ график — гипербола $y = - \\dfrac{9}{x}$.",
    "При $x \\ge -1$ график — парабола $y = x^{2} - 4x + 4$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-4}{2 \\cdot 1} = 2$, $y_0 = 2^{2} - 4 \\cdot 2 + 4 = 0$.",
    "Вершина $(2;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = -1$ функция определена: $y(-1) = 9$, точка $(-1;\\ 9)$ входит в график (оба куска сходятся в ней).",
    "При $x \\to -\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.46800C]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: нет общих точек.",
    "$m = 0$: одна общая точка (на $x \\lt -1$ — 0, на $x \\ge -1$ — 1).",
    "$0 \\lt m \\lt 9$: 3 общие точки (на $x \\lt -1$ — 1, на $x \\ge -1$ — 2).",
    "$m = 9$: 2 общие точки (на $x \\lt -1$ — 0, на $x \\ge -1$ — 2).",
    "$m \\gt 9$: одна общая точка (на $x \\lt -1$ — 0, на $x \\ge -1$ — 1).",
    "Прямая $y = m$ имеет с графиком одну или две общие точки при $m = 0$ и $m \\ge 9$."
   ]
  },
  {
   "id": "22.fipi.FCB77C",
   "group": "par_hyp",
   "fipi": "FCB77C",
   "text": "Постройте график функции $$y = \\begin{cases}x^{2} + 6x + 9x \\ge - 5, \\\\ - \\dfrac{20}{x}x \\lt - 5.\\end{cases}$$ и определите, при каких значениях $m$ прямая $y = m$ имеет с графиком одну или две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=0; m≥4",
     "tex": "m = 0;\\ m \\ge 4"
    }
   ],
   "answerTex": "$m = 0$; $m \\ge 4$",
   "steps": [
    "При $x \\lt -5$ график — гипербола $y = - \\dfrac{20}{x}$.",
    "При $x \\ge -5$ график — парабола $y = x^{2} + 6x + 9$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{6}{2 \\cdot 1} = -3$, $y_0 = (-3)^{2} + 6 \\cdot (-3) + 9 = 0$.",
    "Вершина $(-3;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = -5$ функция определена: $y(-5) = 4$, точка $(-5;\\ 4)$ входит в график (оба куска сходятся в ней).",
    "При $x \\to -\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.FCB77C]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: нет общих точек.",
    "$m = 0$: одна общая точка (на $x \\lt -5$ — 0, на $x \\ge -5$ — 1).",
    "$0 \\lt m \\lt 4$: 3 общие точки (на $x \\lt -5$ — 1, на $x \\ge -5$ — 2).",
    "$m = 4$: 2 общие точки (на $x \\lt -5$ — 0, на $x \\ge -5$ — 2).",
    "$m \\gt 4$: одна общая точка (на $x \\lt -5$ — 0, на $x \\ge -5$ — 1).",
    "Прямая $y = m$ имеет с графиком одну или две общие точки при $m = 0$ и $m \\ge 4$."
   ]
  },
  {
   "id": "22.fipi.64F750",
   "group": "par_hyp",
   "fipi": "64F750",
   "text": "Постройте график функции $$y = \\begin{cases}x^{2} + 4x + 4x \\ge - 3, \\\\ - \\dfrac{3}{x}x \\lt - 3.\\end{cases}$$ и определите, при каких значениях $m$ прямая $y = m$ имеет с графиком одну или две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=0; m≥1",
     "tex": "m = 0;\\ m \\ge 1"
    }
   ],
   "answerTex": "$m = 0$; $m \\ge 1$",
   "steps": [
    "При $x \\lt -3$ график — гипербола $y = - \\dfrac{3}{x}$.",
    "При $x \\ge -3$ график — парабола $y = x^{2} + 4x + 4$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{4}{2 \\cdot 1} = -2$, $y_0 = (-2)^{2} + 4 \\cdot (-2) + 4 = 0$.",
    "Вершина $(-2;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = -3$ функция определена: $y(-3) = 1$, точка $(-3;\\ 1)$ входит в график (оба куска сходятся в ней).",
    "При $x \\to -\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.64F750]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: нет общих точек.",
    "$m = 0$: одна общая точка (на $x \\lt -3$ — 0, на $x \\ge -3$ — 1).",
    "$0 \\lt m \\lt 1$: 3 общие точки (на $x \\lt -3$ — 1, на $x \\ge -3$ — 2).",
    "$m = 1$: 2 общие точки (на $x \\lt -3$ — 0, на $x \\ge -3$ — 2).",
    "$m \\gt 1$: одна общая точка (на $x \\lt -3$ — 0, на $x \\ge -3$ — 1).",
    "Прямая $y = m$ имеет с графиком одну или две общие точки при $m = 0$ и $m \\ge 1$."
   ]
  },
  {
   "id": "22.fipi.FE4FAA",
   "group": "par_hyp",
   "fipi": "FE4FAA",
   "text": "Постройте график функции $$y = \\begin{cases}x^{2} - 2x + 1x \\ge - 2, \\\\ - \\dfrac{18}{x}x \\lt - 2.\\end{cases}$$ и определите, при каких значениях $m$ прямая $y = m$ имеет с графиком одну или две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=0; m≥9",
     "tex": "m = 0;\\ m \\ge 9"
    }
   ],
   "answerTex": "$m = 0$; $m \\ge 9$",
   "steps": [
    "При $x \\lt -2$ график — гипербола $y = - \\dfrac{18}{x}$.",
    "При $x \\ge -2$ график — парабола $y = x^{2} - 2x + 1$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-2}{2 \\cdot 1} = 1$, $y_0 = 1^{2} - 2 \\cdot 1 + 1 = 0$.",
    "Вершина $(1;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = -2$ функция определена: $y(-2) = 9$, точка $(-2;\\ 9)$ входит в график (оба куска сходятся в ней).",
    "При $x \\to -\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.FE4FAA]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: нет общих точек.",
    "$m = 0$: одна общая точка (на $x \\lt -2$ — 0, на $x \\ge -2$ — 1).",
    "$0 \\lt m \\lt 9$: 3 общие точки (на $x \\lt -2$ — 1, на $x \\ge -2$ — 2).",
    "$m = 9$: 2 общие точки (на $x \\lt -2$ — 0, на $x \\ge -2$ — 2).",
    "$m \\gt 9$: одна общая точка (на $x \\lt -2$ — 0, на $x \\ge -2$ — 1).",
    "Прямая $y = m$ имеет с графиком одну или две общие точки при $m = 0$ и $m \\ge 9$."
   ]
  },
  {
   "id": "22.fipi.2C6E96",
   "group": "par_hyp",
   "fipi": "2C6E96",
   "text": "Постройте график функции $$y = \\begin{cases}x^{2} + 2x + 1x \\ge - 2, \\\\ - \\dfrac{2}{x}x \\lt - 2.\\end{cases}$$ и определите, при каких значениях $m$ прямая $y = m$ имеет с графиком одну или две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=0; m≥1",
     "tex": "m = 0;\\ m \\ge 1"
    }
   ],
   "answerTex": "$m = 0$; $m \\ge 1$",
   "steps": [
    "При $x \\lt -2$ график — гипербола $y = - \\dfrac{2}{x}$.",
    "При $x \\ge -2$ график — парабола $y = x^{2} + 2x + 1$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{2}{2 \\cdot 1} = -1$, $y_0 = (-1)^{2} + 2 \\cdot (-1) + 1 = 0$.",
    "Вершина $(-1;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = -2$ функция определена: $y(-2) = 1$, точка $(-2;\\ 1)$ входит в график (оба куска сходятся в ней).",
    "При $x \\to -\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.2C6E96]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: нет общих точек.",
    "$m = 0$: одна общая точка (на $x \\lt -2$ — 0, на $x \\ge -2$ — 1).",
    "$0 \\lt m \\lt 1$: 3 общие точки (на $x \\lt -2$ — 1, на $x \\ge -2$ — 2).",
    "$m = 1$: 2 общие точки (на $x \\lt -2$ — 0, на $x \\ge -2$ — 2).",
    "$m \\gt 1$: одна общая точка (на $x \\lt -2$ — 0, на $x \\ge -2$ — 1).",
    "Прямая $y = m$ имеет с графиком одну или две общие точки при $m = 0$ и $m \\ge 1$."
   ]
  },
  {
   "id": "22.fipi.333EE6",
   "group": "par_hyp",
   "fipi": "333EE6",
   "text": "Постройте график функции $$y = \\begin{cases}x^{2} + 4x + 4x \\ge - 5, \\\\ - \\dfrac{45}{x}x \\lt - 5.\\end{cases}$$ и определите, при каких значениях $m$ прямая $y = m$ имеет с графиком одну или две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=0; m≥9",
     "tex": "m = 0;\\ m \\ge 9"
    }
   ],
   "answerTex": "$m = 0$; $m \\ge 9$",
   "steps": [
    "При $x \\lt -5$ график — гипербола $y = - \\dfrac{45}{x}$.",
    "При $x \\ge -5$ график — парабола $y = x^{2} + 4x + 4$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{4}{2 \\cdot 1} = -2$, $y_0 = (-2)^{2} + 4 \\cdot (-2) + 4 = 0$.",
    "Вершина $(-2;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = -5$ функция определена: $y(-5) = 9$, точка $(-5;\\ 9)$ входит в график (оба куска сходятся в ней).",
    "При $x \\to -\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.333EE6]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: нет общих точек.",
    "$m = 0$: одна общая точка (на $x \\lt -5$ — 0, на $x \\ge -5$ — 1).",
    "$0 \\lt m \\lt 9$: 3 общие точки (на $x \\lt -5$ — 1, на $x \\ge -5$ — 2).",
    "$m = 9$: 2 общие точки (на $x \\lt -5$ — 0, на $x \\ge -5$ — 2).",
    "$m \\gt 9$: одна общая точка (на $x \\lt -5$ — 0, на $x \\ge -5$ — 1).",
    "Прямая $y = m$ имеет с графиком одну или две общие точки при $m = 0$ и $m \\ge 9$."
   ]
  },
  {
   "id": "22.fipi.EFF36A",
   "group": "par_hyp",
   "fipi": "EFF36A",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}x^{2} + 1 \\\\ - \\dfrac{4}{x}\\end{cases}\\begin{cases} \\\\ \\begin{cases} \\\\ \\end{cases}\\end{cases}\\begin{cases}x \\ge - 1, \\\\ x \\lt - 1.\\begin{cases} \\\\ \\end{cases}\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "0<m<1; m≥4",
     "tex": "0 \\lt m \\lt 1;\\ m \\ge 4"
    }
   ],
   "answerTex": "$0 \\lt m \\lt 1$; $m \\ge 4$",
   "steps": [
    "При $x \\lt -1$ график — гипербола $y = - \\dfrac{4}{x}$.",
    "При $x \\ge -1$ график — парабола $y = x^{2} + 1$, ветви направлены вверх. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 1$.",
    "Вершина $(0;\\ 1)$ лежит на этом промежутке и входит в график.",
    "При $x = -1$ функция определена: $y(-1) = 2$, точка $(-1;\\ 2)$ входит в график; значение слева $4$ — точка $(-1;\\ 4)$ выколота.",
    "При $x \\to -\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.EFF36A]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\le 0$: нет общих точек.",
    "$0 \\lt m \\lt 1$: одна общая точка (на $x \\lt -1$ — 1, на $x \\ge -1$ — 0).",
    "$m = 1$: 2 общие точки (на $x \\lt -1$ — 1, на $x \\ge -1$ — 1).",
    "$1 \\lt m \\le 2$: 3 общие точки (на $x \\lt -1$ — 1, на $x \\ge -1$ — 2).",
    "$2 \\lt m \\lt 4$: 2 общие точки (на $x \\lt -1$ — 1, на $x \\ge -1$ — 1).",
    "$m \\ge 4$: одна общая точка (на $x \\lt -1$ — 0, на $x \\ge -1$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно одну общую точку при $0 \\lt m \\lt 1$ и $m \\ge 4$."
   ]
  },
  {
   "id": "22.fipi.EC2E37",
   "group": "par_hyp",
   "fipi": "EC2E37",
   "text": "Постройте график функции $$y = \\begin{cases}\\begin{cases}x^{2} + 2 \\\\ - \\dfrac{6}{x}\\end{cases}\\begin{cases} \\\\ \\begin{cases} \\\\ \\end{cases}\\end{cases}\\begin{cases}x \\ge - 2, \\\\ x \\lt - 2.\\begin{cases} \\\\ \\end{cases}\\end{cases}\\end{cases}$$ Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "0<m<2; m>6",
     "tex": "0 \\lt m \\lt 2;\\ m \\gt 6"
    }
   ],
   "answerTex": "$0 \\lt m \\lt 2$; $m \\gt 6$",
   "steps": [
    "При $x \\lt -2$ график — гипербола $y = - \\dfrac{6}{x}$.",
    "При $x \\ge -2$ график — парабола $y = x^{2} + 2$, ветви направлены вверх. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 2$.",
    "Вершина $(0;\\ 2)$ лежит на этом промежутке и входит в график.",
    "При $x = -2$ функция определена: $y(-2) = 6$, точка $(-2;\\ 6)$ входит в график; значение слева $3$ — точка $(-2;\\ 3)$ выколота.",
    "При $x \\to -\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.EC2E37]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\le 0$: нет общих точек.",
    "$0 \\lt m \\lt 2$: одна общая точка (на $x \\lt -2$ — 1, на $x \\ge -2$ — 0).",
    "$m = 2$: 2 общие точки (на $x \\lt -2$ — 1, на $x \\ge -2$ — 1).",
    "$2 \\lt m \\lt 3$: 3 общие точки (на $x \\lt -2$ — 1, на $x \\ge -2$ — 2).",
    "$3 \\le m \\le 6$: 2 общие точки (на $x \\lt -2$ — 0, на $x \\ge -2$ — 2).",
    "$m \\gt 6$: одна общая точка (на $x \\lt -2$ — 0, на $x \\ge -2$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно одну общую точку при $0 \\lt m \\lt 2$ и $m \\gt 6$."
   ]
  },
  {
   "id": "22.fipi.83223D",
   "group": "par_hyp",
   "fipi": "83223D",
   "text": "Постройте график функции $$y = \\begin{cases}x^{2} + 4x + 4x \\ge - 4, \\\\ - \\dfrac{16}{x}x \\lt - 4.\\end{cases}$$ и определите, при каких значениях $m$ прямая $y = m$ имеет с графиком одну или две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=0; m≥4",
     "tex": "m = 0;\\ m \\ge 4"
    }
   ],
   "answerTex": "$m = 0$; $m \\ge 4$",
   "steps": [
    "При $x \\lt -4$ график — гипербола $y = - \\dfrac{16}{x}$.",
    "При $x \\ge -4$ график — парабола $y = x^{2} + 4x + 4$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{4}{2 \\cdot 1} = -2$, $y_0 = (-2)^{2} + 4 \\cdot (-2) + 4 = 0$.",
    "Вершина $(-2;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = -4$ функция определена: $y(-4) = 4$, точка $(-4;\\ 4)$ входит в график (оба куска сходятся в ней).",
    "При $x \\to -\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.83223D]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: нет общих точек.",
    "$m = 0$: одна общая точка (на $x \\lt -4$ — 0, на $x \\ge -4$ — 1).",
    "$0 \\lt m \\lt 4$: 3 общие точки (на $x \\lt -4$ — 1, на $x \\ge -4$ — 2).",
    "$m = 4$: 2 общие точки (на $x \\lt -4$ — 0, на $x \\ge -4$ — 2).",
    "$m \\gt 4$: одна общая точка (на $x \\lt -4$ — 0, на $x \\ge -4$ — 1).",
    "Прямая $y = m$ имеет с графиком одну или две общие точки при $m = 0$ и $m \\ge 4$."
   ]
  },
  {
   "id": "22.fipi.6DCB49",
   "group": "modx",
   "fipi": "6DCB49",
   "text": "Постройте график функции $y = |x|⋅(x - 1) - 6x$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-12,25; m=6,25",
     "tex": "m = -12{,}25;\\ m = 6{,}25"
    }
   ],
   "answerTex": "$m = -12{,}25$; $m = 6{,}25$",
   "steps": [
    "Если $x \\ge 0$, то выражение под модулем неотрицательно: $|x| = x$. Тогда $y = x \\cdot (x - 1) - 6x = x^{2} - 7x$.",
    "Если $x \\lt 0$, то выражение под модулем отрицательно: $|x| = -x$. Тогда $y = (-x) \\cdot (x - 1) - 6x = -x^{2} - 5x$.",
    "При $x \\lt 0$ график — парабола $y = -x^{2} - 5x$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-5}{2 \\cdot (-1)} = -2{,}5$, $y_0 = -(-2{,}5)^{2} - 5 \\cdot (-2{,}5) = 6{,}25$.",
    "Вершина $(-2{,}5;\\ 6{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 0$ график — парабола $y = x^{2} - 7x$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-7}{2 \\cdot 1} = 3{,}5$, $y_0 = 3{,}5^{2} - 7 \\cdot 3{,}5 = -12{,}25$.",
    "Вершина $(3{,}5;\\ -12{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.6DCB49]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -12{,}25$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -12{,}25$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$-12{,}25 \\lt m \\lt 6{,}25$: 3 общие точки.",
    "$m = 6{,}25$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$m \\gt 6{,}25$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -12{,}25$ и $m = 6{,}25$."
   ]
  },
  {
   "id": "22.fipi.F486F7",
   "group": "modx",
   "fipi": "F486F7",
   "text": "Постройте график функции $y = x|x| + 2|x| - 3x$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-0,25; m=6,25",
     "tex": "m = -0{,}25;\\ m = 6{,}25"
    }
   ],
   "answerTex": "$m = -0{,}25$; $m = 6{,}25$",
   "steps": [
    "Если $x \\ge 0$, то выражение под модулем неотрицательно: $|x| = x$. Тогда $y = x \\cdot x + 2x - 3x = x^{2} - x$.",
    "Если $x \\lt 0$, то выражение под модулем отрицательно: $|x| = -x$. Тогда $y = x \\cdot (-x) + 2 \\cdot (-x) - 3x = -x^{2} - 5x$.",
    "При $x \\lt 0$ график — парабола $y = -x^{2} - 5x$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-5}{2 \\cdot (-1)} = -2{,}5$, $y_0 = -(-2{,}5)^{2} - 5 \\cdot (-2{,}5) = 6{,}25$.",
    "Вершина $(-2{,}5;\\ 6{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 0$ график — парабола $y = x^{2} - x$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-1}{2 \\cdot 1} = 0{,}5$, $y_0 = 0{,}5^{2} - 0{,}5 = -0{,}25$.",
    "Вершина $(0{,}5;\\ -0{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.F486F7]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -0{,}25$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -0{,}25$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$-0{,}25 \\lt m \\lt 6{,}25$: 3 общие точки.",
    "$m = 6{,}25$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$m \\gt 6{,}25$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -0{,}25$ и $m = 6{,}25$."
   ]
  },
  {
   "id": "22.fipi.1D2900",
   "group": "modx",
   "fipi": "1D2900",
   "text": "Постройте график функции $y = |x|⋅(x - 1) - 2x$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-2,25; m=0,25",
     "tex": "m = -2{,}25;\\ m = 0{,}25"
    }
   ],
   "answerTex": "$m = -2{,}25$; $m = 0{,}25$",
   "steps": [
    "Если $x \\ge 0$, то выражение под модулем неотрицательно: $|x| = x$. Тогда $y = x \\cdot (x - 1) - 2x = x^{2} - 3x$.",
    "Если $x \\lt 0$, то выражение под модулем отрицательно: $|x| = -x$. Тогда $y = (-x) \\cdot (x - 1) - 2x = -x^{2} - x$.",
    "При $x \\lt 0$ график — парабола $y = -x^{2} - x$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-1}{2 \\cdot (-1)} = -0{,}5$, $y_0 = -(-0{,}5)^{2} - (-0{,}5) = 0{,}25$.",
    "Вершина $(-0{,}5;\\ 0{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 0$ график — парабола $y = x^{2} - 3x$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-3}{2 \\cdot 1} = 1{,}5$, $y_0 = 1{,}5^{2} - 3 \\cdot 1{,}5 = -2{,}25$.",
    "Вершина $(1{,}5;\\ -2{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.1D2900]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -2{,}25$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -2{,}25$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$-2{,}25 \\lt m \\lt 0{,}25$: 3 общие точки.",
    "$m = 0{,}25$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$m \\gt 0{,}25$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -2{,}25$ и $m = 0{,}25$."
   ]
  },
  {
   "id": "22.fipi.5A5902",
   "group": "modx",
   "fipi": "5A5902",
   "text": "Постройте график функции $y = |x|⋅(x + 1) - 3x$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-1; m=4",
     "tex": "m = -1;\\ m = 4"
    }
   ],
   "answerTex": "$m = -1$; $m = 4$",
   "steps": [
    "Если $x \\ge 0$, то выражение под модулем неотрицательно: $|x| = x$. Тогда $y = x \\cdot (x + 1) - 3x = x^{2} - 2x$.",
    "Если $x \\lt 0$, то выражение под модулем отрицательно: $|x| = -x$. Тогда $y = (-x) \\cdot (x + 1) - 3x = -x^{2} - 4x$.",
    "При $x \\lt 0$ график — парабола $y = -x^{2} - 4x$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-4}{2 \\cdot (-1)} = -2$, $y_0 = -(-2)^{2} - 4 \\cdot (-2) = 4$.",
    "Вершина $(-2;\\ 4)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 0$ график — парабола $y = x^{2} - 2x$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-2}{2 \\cdot 1} = 1$, $y_0 = 1^{2} - 2 \\cdot 1 = -1$.",
    "Вершина $(1;\\ -1)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.5A5902]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -1$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -1$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$-1 \\lt m \\lt 4$: 3 общие точки.",
    "$m = 4$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$m \\gt 4$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -1$ и $m = 4$."
   ]
  },
  {
   "id": "22.fipi.E4D078",
   "group": "modx",
   "fipi": "E4D078",
   "text": "Постройте график функции $y = |x|⋅(x - 1) - 3x$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-4; m=1",
     "tex": "m = -4;\\ m = 1"
    }
   ],
   "answerTex": "$m = -4$; $m = 1$",
   "steps": [
    "Если $x \\ge 0$, то выражение под модулем неотрицательно: $|x| = x$. Тогда $y = x \\cdot (x - 1) - 3x = x^{2} - 4x$.",
    "Если $x \\lt 0$, то выражение под модулем отрицательно: $|x| = -x$. Тогда $y = (-x) \\cdot (x - 1) - 3x = -x^{2} - 2x$.",
    "При $x \\lt 0$ график — парабола $y = -x^{2} - 2x$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-2}{2 \\cdot (-1)} = -1$, $y_0 = -(-1)^{2} - 2 \\cdot (-1) = 1$.",
    "Вершина $(-1;\\ 1)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 0$ график — парабола $y = x^{2} - 4x$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-4}{2 \\cdot 1} = 2$, $y_0 = 2^{2} - 4 \\cdot 2 = -4$.",
    "Вершина $(2;\\ -4)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.E4D078]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -4$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -4$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$-4 \\lt m \\lt 1$: 3 общие точки.",
    "$m = 1$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$m \\gt 1$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -4$ и $m = 1$."
   ]
  },
  {
   "id": "22.fipi.85AFB6",
   "group": "modx",
   "fipi": "85AFB6",
   "text": "Постройте график функции $y = |x|⋅(x + 3) - 5x$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-1; m=16",
     "tex": "m = -1;\\ m = 16"
    }
   ],
   "answerTex": "$m = -1$; $m = 16$",
   "steps": [
    "Если $x \\ge 0$, то выражение под модулем неотрицательно: $|x| = x$. Тогда $y = x \\cdot (x + 3) - 5x = x^{2} - 2x$.",
    "Если $x \\lt 0$, то выражение под модулем отрицательно: $|x| = -x$. Тогда $y = (-x) \\cdot (x + 3) - 5x = -x^{2} - 8x$.",
    "При $x \\lt 0$ график — парабола $y = -x^{2} - 8x$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-8}{2 \\cdot (-1)} = -4$, $y_0 = -(-4)^{2} - 8 \\cdot (-4) = 16$.",
    "Вершина $(-4;\\ 16)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 0$ график — парабола $y = x^{2} - 2x$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-2}{2 \\cdot 1} = 1$, $y_0 = 1^{2} - 2 \\cdot 1 = -1$.",
    "Вершина $(1;\\ -1)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.85AFB6]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -1$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -1$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$-1 \\lt m \\lt 16$: 3 общие точки.",
    "$m = 16$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$m \\gt 16$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -1$ и $m = 16$."
   ]
  },
  {
   "id": "22.fipi.5E5852",
   "group": "modx",
   "fipi": "5E5852",
   "text": "Постройте график функции $y = x|x| + 2|x| - 5x$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-2,25; m=12,25",
     "tex": "m = -2{,}25;\\ m = 12{,}25"
    }
   ],
   "answerTex": "$m = -2{,}25$; $m = 12{,}25$",
   "steps": [
    "Если $x \\ge 0$, то выражение под модулем неотрицательно: $|x| = x$. Тогда $y = x \\cdot x + 2x - 5x = x^{2} - 3x$.",
    "Если $x \\lt 0$, то выражение под модулем отрицательно: $|x| = -x$. Тогда $y = x \\cdot (-x) + 2 \\cdot (-x) - 5x = -x^{2} - 7x$.",
    "При $x \\lt 0$ график — парабола $y = -x^{2} - 7x$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-7}{2 \\cdot (-1)} = -3{,}5$, $y_0 = -(-3{,}5)^{2} - 7 \\cdot (-3{,}5) = 12{,}25$.",
    "Вершина $(-3{,}5;\\ 12{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 0$ график — парабола $y = x^{2} - 3x$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-3}{2 \\cdot 1} = 1{,}5$, $y_0 = 1{,}5^{2} - 3 \\cdot 1{,}5 = -2{,}25$.",
    "Вершина $(1{,}5;\\ -2{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.5E5852]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -2{,}25$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -2{,}25$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$-2{,}25 \\lt m \\lt 12{,}25$: 3 общие точки.",
    "$m = 12{,}25$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$m \\gt 12{,}25$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -2{,}25$ и $m = 12{,}25$."
   ]
  },
  {
   "id": "22.fipi.5C9FAE",
   "group": "modx",
   "fipi": "5C9FAE",
   "text": "Постройте график функции $y = x|x| + |x| - 5x$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-4; m=9",
     "tex": "m = -4;\\ m = 9"
    }
   ],
   "answerTex": "$m = -4$; $m = 9$",
   "steps": [
    "Если $x \\ge 0$, то выражение под модулем неотрицательно: $|x| = x$. Тогда $y = x \\cdot x + x - 5x = x^{2} - 4x$.",
    "Если $x \\lt 0$, то выражение под модулем отрицательно: $|x| = -x$. Тогда $y = x \\cdot (-x) + (-x) - 5x = -x^{2} - 6x$.",
    "При $x \\lt 0$ график — парабола $y = -x^{2} - 6x$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-6}{2 \\cdot (-1)} = -3$, $y_0 = -(-3)^{2} - 6 \\cdot (-3) = 9$.",
    "Вершина $(-3;\\ 9)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 0$ график — парабола $y = x^{2} - 4x$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-4}{2 \\cdot 1} = 2$, $y_0 = 2^{2} - 4 \\cdot 2 = -4$.",
    "Вершина $(2;\\ -4)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.5C9FAE]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -4$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -4$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$-4 \\lt m \\lt 9$: 3 общие точки.",
    "$m = 9$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$m \\gt 9$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -4$ и $m = 9$."
   ]
  },
  {
   "id": "22.fipi.D89894",
   "group": "modx",
   "fipi": "D89894",
   "text": "Постройте график функции $y = x|x| + |x| - 6x$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-6,25; m=12,25",
     "tex": "m = -6{,}25;\\ m = 12{,}25"
    }
   ],
   "answerTex": "$m = -6{,}25$; $m = 12{,}25$",
   "steps": [
    "Если $x \\ge 0$, то выражение под модулем неотрицательно: $|x| = x$. Тогда $y = x \\cdot x + x - 6x = x^{2} - 5x$.",
    "Если $x \\lt 0$, то выражение под модулем отрицательно: $|x| = -x$. Тогда $y = x \\cdot (-x) + (-x) - 6x = -x^{2} - 7x$.",
    "При $x \\lt 0$ график — парабола $y = -x^{2} - 7x$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-7}{2 \\cdot (-1)} = -3{,}5$, $y_0 = -(-3{,}5)^{2} - 7 \\cdot (-3{,}5) = 12{,}25$.",
    "Вершина $(-3{,}5;\\ 12{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 0$ график — парабола $y = x^{2} - 5x$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-5}{2 \\cdot 1} = 2{,}5$, $y_0 = 2{,}5^{2} - 5 \\cdot 2{,}5 = -6{,}25$.",
    "Вершина $(2{,}5;\\ -6{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.D89894]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -6{,}25$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -6{,}25$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$-6{,}25 \\lt m \\lt 12{,}25$: 3 общие точки.",
    "$m = 12{,}25$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$m \\gt 12{,}25$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -6{,}25$ и $m = 12{,}25$."
   ]
  },
  {
   "id": "22.fipi.7B9160",
   "group": "modx",
   "fipi": "7B9160",
   "text": "Постройте график функции $y = x|x| - |x| - 5x$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-9; m=4",
     "tex": "m = -9;\\ m = 4"
    }
   ],
   "answerTex": "$m = -9$; $m = 4$",
   "steps": [
    "Если $x \\ge 0$, то выражение под модулем неотрицательно: $|x| = x$. Тогда $y = x \\cdot x - x - 5x = x^{2} - 6x$.",
    "Если $x \\lt 0$, то выражение под модулем отрицательно: $|x| = -x$. Тогда $y = x \\cdot (-x) - (-x) - 5x = -x^{2} - 4x$.",
    "При $x \\lt 0$ график — парабола $y = -x^{2} - 4x$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-4}{2 \\cdot (-1)} = -2$, $y_0 = -(-2)^{2} - 4 \\cdot (-2) = 4$.",
    "Вершина $(-2;\\ 4)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 0$ график — парабола $y = x^{2} - 6x$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-6}{2 \\cdot 1} = 3$, $y_0 = 3^{2} - 6 \\cdot 3 = -9$.",
    "Вершина $(3;\\ -9)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.7B9160]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -9$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -9$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$-9 \\lt m \\lt 4$: 3 общие точки.",
    "$m = 4$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$m \\gt 4$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -9$ и $m = 4$."
   ]
  },
  {
   "id": "22.fipi.B4CE4A",
   "group": "modx",
   "fipi": "B4CE4A",
   "text": "Постройте график функции $y = x|x| + 3|x| - 5x$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-1; m=16",
     "tex": "m = -1;\\ m = 16"
    }
   ],
   "answerTex": "$m = -1$; $m = 16$",
   "steps": [
    "Если $x \\ge 0$, то выражение под модулем неотрицательно: $|x| = x$. Тогда $y = x \\cdot x + 3x - 5x = x^{2} - 2x$.",
    "Если $x \\lt 0$, то выражение под модулем отрицательно: $|x| = -x$. Тогда $y = x \\cdot (-x) + 3 \\cdot (-x) - 5x = -x^{2} - 8x$.",
    "При $x \\lt 0$ график — парабола $y = -x^{2} - 8x$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-8}{2 \\cdot (-1)} = -4$, $y_0 = -(-4)^{2} - 8 \\cdot (-4) = 16$.",
    "Вершина $(-4;\\ 16)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 0$ график — парабола $y = x^{2} - 2x$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-2}{2 \\cdot 1} = 1$, $y_0 = 1^{2} - 2 \\cdot 1 = -1$.",
    "Вершина $(1;\\ -1)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.B4CE4A]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -1$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -1$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$-1 \\lt m \\lt 16$: 3 общие точки.",
    "$m = 16$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$m \\gt 16$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -1$ и $m = 16$."
   ]
  },
  {
   "id": "22.fipi.6D7DF6",
   "group": "modx",
   "fipi": "6D7DF6",
   "text": "Постройте график функции $y = x|x| - |x| - 3x$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-4; m=1",
     "tex": "m = -4;\\ m = 1"
    }
   ],
   "answerTex": "$m = -4$; $m = 1$",
   "steps": [
    "Если $x \\ge 0$, то выражение под модулем неотрицательно: $|x| = x$. Тогда $y = x \\cdot x - x - 3x = x^{2} - 4x$.",
    "Если $x \\lt 0$, то выражение под модулем отрицательно: $|x| = -x$. Тогда $y = x \\cdot (-x) - (-x) - 3x = -x^{2} - 2x$.",
    "При $x \\lt 0$ график — парабола $y = -x^{2} - 2x$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-2}{2 \\cdot (-1)} = -1$, $y_0 = -(-1)^{2} - 2 \\cdot (-1) = 1$.",
    "Вершина $(-1;\\ 1)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 0$ график — парабола $y = x^{2} - 4x$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-4}{2 \\cdot 1} = 2$, $y_0 = 2^{2} - 4 \\cdot 2 = -4$.",
    "Вершина $(2;\\ -4)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.6D7DF6]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -4$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -4$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$-4 \\lt m \\lt 1$: 3 общие точки.",
    "$m = 1$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$m \\gt 1$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -4$ и $m = 1$."
   ]
  },
  {
   "id": "22.fipi.3D9A0A",
   "group": "modx",
   "fipi": "3D9A0A",
   "text": "Постройте график функции $y = |x|⋅(x + 2) - 5x$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-2,25; m=12,25",
     "tex": "m = -2{,}25;\\ m = 12{,}25"
    }
   ],
   "answerTex": "$m = -2{,}25$; $m = 12{,}25$",
   "steps": [
    "Если $x \\ge 0$, то выражение под модулем неотрицательно: $|x| = x$. Тогда $y = x \\cdot (x + 2) - 5x = x^{2} - 3x$.",
    "Если $x \\lt 0$, то выражение под модулем отрицательно: $|x| = -x$. Тогда $y = (-x) \\cdot (x + 2) - 5x = -x^{2} - 7x$.",
    "При $x \\lt 0$ график — парабола $y = -x^{2} - 7x$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-7}{2 \\cdot (-1)} = -3{,}5$, $y_0 = -(-3{,}5)^{2} - 7 \\cdot (-3{,}5) = 12{,}25$.",
    "Вершина $(-3{,}5;\\ 12{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 0$ график — парабола $y = x^{2} - 3x$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-3}{2 \\cdot 1} = 1{,}5$, $y_0 = 1{,}5^{2} - 3 \\cdot 1{,}5 = -2{,}25$.",
    "Вершина $(1{,}5;\\ -2{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.3D9A0A]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -2{,}25$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -2{,}25$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$-2{,}25 \\lt m \\lt 12{,}25$: 3 общие точки.",
    "$m = 12{,}25$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$m \\gt 12{,}25$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -2{,}25$ и $m = 12{,}25$."
   ]
  },
  {
   "id": "22.fipi.0D3070",
   "group": "modx",
   "fipi": "0D3070",
   "text": "Постройте график функции $y = |x|⋅(x + 1) - 6x$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-6,25; m=12,25",
     "tex": "m = -6{,}25;\\ m = 12{,}25"
    }
   ],
   "answerTex": "$m = -6{,}25$; $m = 12{,}25$",
   "steps": [
    "Если $x \\ge 0$, то выражение под модулем неотрицательно: $|x| = x$. Тогда $y = x \\cdot (x + 1) - 6x = x^{2} - 5x$.",
    "Если $x \\lt 0$, то выражение под модулем отрицательно: $|x| = -x$. Тогда $y = (-x) \\cdot (x + 1) - 6x = -x^{2} - 7x$.",
    "При $x \\lt 0$ график — парабола $y = -x^{2} - 7x$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-7}{2 \\cdot (-1)} = -3{,}5$, $y_0 = -(-3{,}5)^{2} - 7 \\cdot (-3{,}5) = 12{,}25$.",
    "Вершина $(-3{,}5;\\ 12{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 0$ график — парабола $y = x^{2} - 5x$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-5}{2 \\cdot 1} = 2{,}5$, $y_0 = 2{,}5^{2} - 5 \\cdot 2{,}5 = -6{,}25$.",
    "Вершина $(2{,}5;\\ -6{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.0D3070]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -6{,}25$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -6{,}25$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$-6{,}25 \\lt m \\lt 12{,}25$: 3 общие точки.",
    "$m = 12{,}25$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$m \\gt 12{,}25$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -6{,}25$ и $m = 12{,}25$."
   ]
  },
  {
   "id": "22.fipi.076977",
   "group": "modx",
   "fipi": "076977",
   "text": "Постройте график функции $y = x|x| + |x| - 3x$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-1; m=4",
     "tex": "m = -1;\\ m = 4"
    }
   ],
   "answerTex": "$m = -1$; $m = 4$",
   "steps": [
    "Если $x \\ge 0$, то выражение под модулем неотрицательно: $|x| = x$. Тогда $y = x \\cdot x + x - 3x = x^{2} - 2x$.",
    "Если $x \\lt 0$, то выражение под модулем отрицательно: $|x| = -x$. Тогда $y = x \\cdot (-x) + (-x) - 3x = -x^{2} - 4x$.",
    "При $x \\lt 0$ график — парабола $y = -x^{2} - 4x$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-4}{2 \\cdot (-1)} = -2$, $y_0 = -(-2)^{2} - 4 \\cdot (-2) = 4$.",
    "Вершина $(-2;\\ 4)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 0$ график — парабола $y = x^{2} - 2x$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-2}{2 \\cdot 1} = 1$, $y_0 = 1^{2} - 2 \\cdot 1 = -1$.",
    "Вершина $(1;\\ -1)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.076977]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -1$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -1$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$-1 \\lt m \\lt 4$: 3 общие точки.",
    "$m = 4$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$m \\gt 4$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -1$ и $m = 4$."
   ]
  },
  {
   "id": "22.fipi.F0A0B3",
   "group": "modx",
   "fipi": "F0A0B3",
   "text": "Постройте график функции $y = |x|⋅(x + 2) - 3x$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-0,25; m=6,25",
     "tex": "m = -0{,}25;\\ m = 6{,}25"
    }
   ],
   "answerTex": "$m = -0{,}25$; $m = 6{,}25$",
   "steps": [
    "Если $x \\ge 0$, то выражение под модулем неотрицательно: $|x| = x$. Тогда $y = x \\cdot (x + 2) - 3x = x^{2} - x$.",
    "Если $x \\lt 0$, то выражение под модулем отрицательно: $|x| = -x$. Тогда $y = (-x) \\cdot (x + 2) - 3x = -x^{2} - 5x$.",
    "При $x \\lt 0$ график — парабола $y = -x^{2} - 5x$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-5}{2 \\cdot (-1)} = -2{,}5$, $y_0 = -(-2{,}5)^{2} - 5 \\cdot (-2{,}5) = 6{,}25$.",
    "Вершина $(-2{,}5;\\ 6{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 0$ график — парабола $y = x^{2} - x$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-1}{2 \\cdot 1} = 0{,}5$, $y_0 = 0{,}5^{2} - 0{,}5 = -0{,}25$.",
    "Вершина $(0{,}5;\\ -0{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.F0A0B3]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -0{,}25$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -0{,}25$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$-0{,}25 \\lt m \\lt 6{,}25$: 3 общие точки.",
    "$m = 6{,}25$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$m \\gt 6{,}25$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -0{,}25$ и $m = 6{,}25$."
   ]
  },
  {
   "id": "22.fipi.FD51C3",
   "group": "modx",
   "fipi": "FD51C3",
   "text": "Постройте график функции $y = |x|⋅(x + 1) - 5x$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-4; m=9",
     "tex": "m = -4;\\ m = 9"
    }
   ],
   "answerTex": "$m = -4$; $m = 9$",
   "steps": [
    "Если $x \\ge 0$, то выражение под модулем неотрицательно: $|x| = x$. Тогда $y = x \\cdot (x + 1) - 5x = x^{2} - 4x$.",
    "Если $x \\lt 0$, то выражение под модулем отрицательно: $|x| = -x$. Тогда $y = (-x) \\cdot (x + 1) - 5x = -x^{2} - 6x$.",
    "При $x \\lt 0$ график — парабола $y = -x^{2} - 6x$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-6}{2 \\cdot (-1)} = -3$, $y_0 = -(-3)^{2} - 6 \\cdot (-3) = 9$.",
    "Вершина $(-3;\\ 9)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 0$ график — парабола $y = x^{2} - 4x$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-4}{2 \\cdot 1} = 2$, $y_0 = 2^{2} - 4 \\cdot 2 = -4$.",
    "Вершина $(2;\\ -4)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.FD51C3]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -4$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -4$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$-4 \\lt m \\lt 9$: 3 общие точки.",
    "$m = 9$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$m \\gt 9$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -4$ и $m = 9$."
   ]
  },
  {
   "id": "22.fipi.B6A5C4",
   "group": "modx",
   "fipi": "B6A5C4",
   "text": "Постройте график функции $y = x|x| - |x| - 2x$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-2,25; m=0,25",
     "tex": "m = -2{,}25;\\ m = 0{,}25"
    }
   ],
   "answerTex": "$m = -2{,}25$; $m = 0{,}25$",
   "steps": [
    "Если $x \\ge 0$, то выражение под модулем неотрицательно: $|x| = x$. Тогда $y = x \\cdot x - x - 2x = x^{2} - 3x$.",
    "Если $x \\lt 0$, то выражение под модулем отрицательно: $|x| = -x$. Тогда $y = x \\cdot (-x) - (-x) - 2x = -x^{2} - x$.",
    "При $x \\lt 0$ график — парабола $y = -x^{2} - x$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-1}{2 \\cdot (-1)} = -0{,}5$, $y_0 = -(-0{,}5)^{2} - (-0{,}5) = 0{,}25$.",
    "Вершина $(-0{,}5;\\ 0{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 0$ график — парабола $y = x^{2} - 3x$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-3}{2 \\cdot 1} = 1{,}5$, $y_0 = 1{,}5^{2} - 3 \\cdot 1{,}5 = -2{,}25$.",
    "Вершина $(1{,}5;\\ -2{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.B6A5C4]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -2{,}25$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -2{,}25$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$-2{,}25 \\lt m \\lt 0{,}25$: 3 общие точки.",
    "$m = 0{,}25$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$m \\gt 0{,}25$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -2{,}25$ и $m = 0{,}25$."
   ]
  },
  {
   "id": "22.fipi.B1979C",
   "group": "modx",
   "fipi": "B1979C",
   "text": "Постройте график функции $y = |x|⋅(x - 1) - 5x$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-9; m=4",
     "tex": "m = -9;\\ m = 4"
    }
   ],
   "answerTex": "$m = -9$; $m = 4$",
   "steps": [
    "Если $x \\ge 0$, то выражение под модулем неотрицательно: $|x| = x$. Тогда $y = x \\cdot (x - 1) - 5x = x^{2} - 6x$.",
    "Если $x \\lt 0$, то выражение под модулем отрицательно: $|x| = -x$. Тогда $y = (-x) \\cdot (x - 1) - 5x = -x^{2} - 4x$.",
    "При $x \\lt 0$ график — парабола $y = -x^{2} - 4x$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-4}{2 \\cdot (-1)} = -2$, $y_0 = -(-2)^{2} - 4 \\cdot (-2) = 4$.",
    "Вершина $(-2;\\ 4)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 0$ график — парабола $y = x^{2} - 6x$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-6}{2 \\cdot 1} = 3$, $y_0 = 3^{2} - 6 \\cdot 3 = -9$.",
    "Вершина $(3;\\ -9)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.B1979C]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -9$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -9$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$-9 \\lt m \\lt 4$: 3 общие точки.",
    "$m = 4$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$m \\gt 4$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -9$ и $m = 4$."
   ]
  },
  {
   "id": "22.fipi.CE2631",
   "group": "modx",
   "fipi": "CE2631",
   "text": "Постройте график функции $y = x|x| - |x| - 6x$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно две общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-12,25; m=6,25",
     "tex": "m = -12{,}25;\\ m = 6{,}25"
    }
   ],
   "answerTex": "$m = -12{,}25$; $m = 6{,}25$",
   "steps": [
    "Если $x \\ge 0$, то выражение под модулем неотрицательно: $|x| = x$. Тогда $y = x \\cdot x - x - 6x = x^{2} - 7x$.",
    "Если $x \\lt 0$, то выражение под модулем отрицательно: $|x| = -x$. Тогда $y = x \\cdot (-x) - (-x) - 6x = -x^{2} - 5x$.",
    "При $x \\lt 0$ график — парабола $y = -x^{2} - 5x$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-5}{2 \\cdot (-1)} = -2{,}5$, $y_0 = -(-2{,}5)^{2} - 5 \\cdot (-2{,}5) = 6{,}25$.",
    "Вершина $(-2{,}5;\\ 6{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 0$ график — парабола $y = x^{2} - 7x$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-7}{2 \\cdot 1} = 3{,}5$, $y_0 = 3{,}5^{2} - 7 \\cdot 3{,}5 = -12{,}25$.",
    "Вершина $(3{,}5;\\ -12{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.CE2631]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -12{,}25$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -12{,}25$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$-12{,}25 \\lt m \\lt 6{,}25$: 3 общие точки.",
    "$m = 6{,}25$: 2 общие точки (на $x \\lt 0$ — 1, на $x \\ge 0$ — 1).",
    "$m \\gt 6{,}25$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно две общие точки при $m = -12{,}25$ и $m = 6{,}25$."
   ]
  },
  {
   "id": "22.fipi.675547",
   "group": "abs_parab",
   "fipi": "675547",
   "text": "Постройте график функции $y = x^{2} + 14x - 3|x + 8| + 48$ и определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно три общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-0,25; m=0",
     "tex": "m = -0{,}25;\\ m = 0"
    }
   ],
   "answerTex": "$m = -0{,}25$; $m = 0$",
   "steps": [
    "Если $x \\ge -8$, то выражение под модулем неотрицательно: $|x + 8| = x + 8$. Тогда $y = x^{2} + 14x - 3(x + 8) + 48 = x^{2} + 11x + 24$.",
    "Если $x \\lt -8$, то выражение под модулем отрицательно: $|x + 8| = -x - 8$. Тогда $y = x^{2} + 14x - 3 \\cdot (-x - 8) + 48 = x^{2} + 17x + 72$.",
    "При $x \\lt -8$ график — парабола $y = x^{2} + 17x + 72$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{17}{2 \\cdot 1} = -8{,}5$, $y_0 = (-8{,}5)^{2} + 17 \\cdot (-8{,}5) + 72 = -0{,}25$.",
    "Вершина $(-8{,}5;\\ -0{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge -8$ график — парабола $y = x^{2} + 11x + 24$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{11}{2 \\cdot 1} = -5{,}5$, $y_0 = (-5{,}5)^{2} + 11 \\cdot (-5{,}5) + 24 = -6{,}25$.",
    "Вершина $(-5{,}5;\\ -6{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = -8$ функция определена: $y(-8) = 0$, точка $(-8;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.675547]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -6{,}25$: нет общих точек.",
    "$m = -6{,}25$: одна общая точка (на $x \\lt -8$ — 0, на $x \\ge -8$ — 1).",
    "$-6{,}25 \\lt m \\lt -0{,}25$: 2 общие точки (на $x \\lt -8$ — 0, на $x \\ge -8$ — 2).",
    "$m = -0{,}25$: 3 общие точки (на $x \\lt -8$ — 1, на $x \\ge -8$ — 2).",
    "$-0{,}25 \\lt m \\lt 0$: 4 общие точки (на $x \\lt -8$ — 2, на $x \\ge -8$ — 2).",
    "$m = 0$: 3 общие точки (на $x \\lt -8$ — 1, на $x \\ge -8$ — 2).",
    "$m \\gt 0$: 2 общие точки (на $x \\lt -8$ — 1, на $x \\ge -8$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно три общие точки при $m = -0{,}25$ и $m = 0$."
   ]
  },
  {
   "id": "22.fipi.F98AF0",
   "group": "abs_parab",
   "fipi": "F98AF0",
   "text": "Постройте график функции $y = 4|x - 3| - x^{2} + 8x - 15$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно три общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=0; m=1",
     "tex": "m = 0;\\ m = 1"
    }
   ],
   "answerTex": "$m = 0$; $m = 1$",
   "steps": [
    "Если $x \\ge 3$, то выражение под модулем неотрицательно: $|x - 3| = x - 3$. Тогда $y = 4(x - 3) - x^{2} + 8x - 15 = -x^{2} + 12x - 27$.",
    "Если $x \\lt 3$, то выражение под модулем отрицательно: $|x - 3| = -x + 3$. Тогда $y = 4 \\cdot (-x + 3) - x^{2} + 8x - 15 = -x^{2} + 4x - 3$.",
    "При $x \\lt 3$ график — парабола $y = -x^{2} + 4x - 3$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{4}{2 \\cdot (-1)} = 2$, $y_0 = -2^{2} + 4 \\cdot 2 - 3 = 1$.",
    "Вершина $(2;\\ 1)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 3$ график — парабола $y = -x^{2} + 12x - 27$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{12}{2 \\cdot (-1)} = 6$, $y_0 = -6^{2} + 12 \\cdot 6 - 27 = 9$.",
    "Вершина $(6;\\ 9)$ лежит на этом промежутке и входит в график.",
    "При $x = 3$ функция определена: $y(3) = 0$, точка $(3;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.F98AF0]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: 2 общие точки (на $x \\lt 3$ — 1, на $x \\ge 3$ — 1).",
    "$m = 0$: 3 общие точки (на $x \\lt 3$ — 1, на $x \\ge 3$ — 2).",
    "$0 \\lt m \\lt 1$: 4 общие точки (на $x \\lt 3$ — 2, на $x \\ge 3$ — 2).",
    "$m = 1$: 3 общие точки (на $x \\lt 3$ — 1, на $x \\ge 3$ — 2).",
    "$1 \\lt m \\lt 9$: 2 общие точки (на $x \\lt 3$ — 0, на $x \\ge 3$ — 2).",
    "$m = 9$: одна общая точка (на $x \\lt 3$ — 0, на $x \\ge 3$ — 1).",
    "$m \\gt 9$: нет общих точек.",
    "Прямая $y = m$ имеет с графиком ровно три общие точки при $m = 0$ и $m = 1$."
   ]
  },
  {
   "id": "22.fipi.A58BF6",
   "group": "abs_parab",
   "fipi": "A58BF6",
   "text": "Постройте график функции $y = 4|x + 6| - x^{2} - 11x - 30$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно три общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=0; m=2,25",
     "tex": "m = 0;\\ m = 2{,}25"
    }
   ],
   "answerTex": "$m = 0$; $m = 2{,}25$",
   "steps": [
    "Если $x \\ge -6$, то выражение под модулем неотрицательно: $|x + 6| = x + 6$. Тогда $y = 4(x + 6) - x^{2} - 11x - 30 = -x^{2} - 7x - 6$.",
    "Если $x \\lt -6$, то выражение под модулем отрицательно: $|x + 6| = -x - 6$. Тогда $y = 4 \\cdot (-x - 6) - x^{2} - 11x - 30 = -x^{2} - 15x - 54$.",
    "При $x \\lt -6$ график — парабола $y = -x^{2} - 15x - 54$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-15}{2 \\cdot (-1)} = -7{,}5$, $y_0 = -(-7{,}5)^{2} - 15 \\cdot (-7{,}5) - 54 = 2{,}25$.",
    "Вершина $(-7{,}5;\\ 2{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge -6$ график — парабола $y = -x^{2} - 7x - 6$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-7}{2 \\cdot (-1)} = -3{,}5$, $y_0 = -(-3{,}5)^{2} - 7 \\cdot (-3{,}5) - 6 = 6{,}25$.",
    "Вершина $(-3{,}5;\\ 6{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = -6$ функция определена: $y(-6) = 0$, точка $(-6;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.A58BF6]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: 2 общие точки (на $x \\lt -6$ — 1, на $x \\ge -6$ — 1).",
    "$m = 0$: 3 общие точки (на $x \\lt -6$ — 1, на $x \\ge -6$ — 2).",
    "$0 \\lt m \\lt 2{,}25$: 4 общие точки (на $x \\lt -6$ — 2, на $x \\ge -6$ — 2).",
    "$m = 2{,}25$: 3 общие точки (на $x \\lt -6$ — 1, на $x \\ge -6$ — 2).",
    "$2{,}25 \\lt m \\lt 6{,}25$: 2 общие точки (на $x \\lt -6$ — 0, на $x \\ge -6$ — 2).",
    "$m = 6{,}25$: одна общая точка (на $x \\lt -6$ — 0, на $x \\ge -6$ — 1).",
    "$m \\gt 6{,}25$: нет общих точек.",
    "Прямая $y = m$ имеет с графиком ровно три общие точки при $m = 0$ и $m = 2{,}25$."
   ]
  },
  {
   "id": "22.fipi.F708B3",
   "group": "abs_parab",
   "fipi": "F708B3",
   "text": "Постройте график функции $y = x^{2} - 9x - 2|x - 4| + 20$ и определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно три общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-0,25; m=0",
     "tex": "m = -0{,}25;\\ m = 0"
    }
   ],
   "answerTex": "$m = -0{,}25$; $m = 0$",
   "steps": [
    "Если $x \\ge 4$, то выражение под модулем неотрицательно: $|x - 4| = x - 4$. Тогда $y = x^{2} - 9x - 2(x - 4) + 20 = x^{2} - 11x + 28$.",
    "Если $x \\lt 4$, то выражение под модулем отрицательно: $|x - 4| = -x + 4$. Тогда $y = x^{2} - 9x - 2 \\cdot (-x + 4) + 20 = x^{2} - 7x + 12$.",
    "При $x \\lt 4$ график — парабола $y = x^{2} - 7x + 12$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-7}{2 \\cdot 1} = 3{,}5$, $y_0 = 3{,}5^{2} - 7 \\cdot 3{,}5 + 12 = -0{,}25$.",
    "Вершина $(3{,}5;\\ -0{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 4$ график — парабола $y = x^{2} - 11x + 28$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-11}{2 \\cdot 1} = 5{,}5$, $y_0 = 5{,}5^{2} - 11 \\cdot 5{,}5 + 28 = -2{,}25$.",
    "Вершина $(5{,}5;\\ -2{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = 4$ функция определена: $y(4) = 0$, точка $(4;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.F708B3]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -2{,}25$: нет общих точек.",
    "$m = -2{,}25$: одна общая точка (на $x \\lt 4$ — 0, на $x \\ge 4$ — 1).",
    "$-2{,}25 \\lt m \\lt -0{,}25$: 2 общие точки (на $x \\lt 4$ — 0, на $x \\ge 4$ — 2).",
    "$m = -0{,}25$: 3 общие точки (на $x \\lt 4$ — 1, на $x \\ge 4$ — 2).",
    "$-0{,}25 \\lt m \\lt 0$: 4 общие точки (на $x \\lt 4$ — 2, на $x \\ge 4$ — 2).",
    "$m = 0$: 3 общие точки (на $x \\lt 4$ — 1, на $x \\ge 4$ — 2).",
    "$m \\gt 0$: 2 общие точки (на $x \\lt 4$ — 1, на $x \\ge 4$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно три общие точки при $m = -0{,}25$ и $m = 0$."
   ]
  },
  {
   "id": "22.fipi.6E2FBC",
   "group": "abs_parab",
   "fipi": "6E2FBC",
   "text": "Постройте график функции $y = x^{2} - 5x - 5|x - 2| + 6$ и определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно три общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-4; m=0",
     "tex": "m = -4;\\ m = 0"
    }
   ],
   "answerTex": "$m = -4$; $m = 0$",
   "steps": [
    "Если $x \\ge 2$, то выражение под модулем неотрицательно: $|x - 2| = x - 2$. Тогда $y = x^{2} - 5x - 5(x - 2) + 6 = x^{2} - 10x + 16$.",
    "Если $x \\lt 2$, то выражение под модулем отрицательно: $|x - 2| = -x + 2$. Тогда $y = x^{2} - 5x - 5 \\cdot (-x + 2) + 6 = x^{2} - 4$.",
    "При $x \\lt 2$ график — парабола $y = x^{2} - 4$, ветви направлены вверх. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = -4$.",
    "Вершина $(0;\\ -4)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 2$ график — парабола $y = x^{2} - 10x + 16$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-10}{2 \\cdot 1} = 5$, $y_0 = 5^{2} - 10 \\cdot 5 + 16 = -9$.",
    "Вершина $(5;\\ -9)$ лежит на этом промежутке и входит в график.",
    "При $x = 2$ функция определена: $y(2) = 0$, точка $(2;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.6E2FBC]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -9$: нет общих точек.",
    "$m = -9$: одна общая точка (на $x \\lt 2$ — 0, на $x \\ge 2$ — 1).",
    "$-9 \\lt m \\lt -4$: 2 общие точки (на $x \\lt 2$ — 0, на $x \\ge 2$ — 2).",
    "$m = -4$: 3 общие точки (на $x \\lt 2$ — 1, на $x \\ge 2$ — 2).",
    "$-4 \\lt m \\lt 0$: 4 общие точки (на $x \\lt 2$ — 2, на $x \\ge 2$ — 2).",
    "$m = 0$: 3 общие точки (на $x \\lt 2$ — 1, на $x \\ge 2$ — 2).",
    "$m \\gt 0$: 2 общие точки (на $x \\lt 2$ — 1, на $x \\ge 2$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно три общие точки при $m = -4$ и $m = 0$."
   ]
  },
  {
   "id": "22.fipi.36C01E",
   "group": "abs_parab",
   "fipi": "36C01E",
   "text": "Постройте график функции $y = 3|x + 2| - x^{2} - 3x - 2$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно три общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=0; m=1",
     "tex": "m = 0;\\ m = 1"
    }
   ],
   "answerTex": "$m = 0$; $m = 1$",
   "steps": [
    "Если $x \\ge -2$, то выражение под модулем неотрицательно: $|x + 2| = x + 2$. Тогда $y = 3(x + 2) - x^{2} - 3x - 2 = -x^{2} + 4$.",
    "Если $x \\lt -2$, то выражение под модулем отрицательно: $|x + 2| = -x - 2$. Тогда $y = 3 \\cdot (-x - 2) - x^{2} - 3x - 2 = -x^{2} - 6x - 8$.",
    "При $x \\lt -2$ график — парабола $y = -x^{2} - 6x - 8$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-6}{2 \\cdot (-1)} = -3$, $y_0 = -(-3)^{2} - 6 \\cdot (-3) - 8 = 1$.",
    "Вершина $(-3;\\ 1)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge -2$ график — парабола $y = -x^{2} + 4$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 4$.",
    "Вершина $(0;\\ 4)$ лежит на этом промежутке и входит в график.",
    "При $x = -2$ функция определена: $y(-2) = 0$, точка $(-2;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.36C01E]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: 2 общие точки (на $x \\lt -2$ — 1, на $x \\ge -2$ — 1).",
    "$m = 0$: 3 общие точки (на $x \\lt -2$ — 1, на $x \\ge -2$ — 2).",
    "$0 \\lt m \\lt 1$: 4 общие точки (на $x \\lt -2$ — 2, на $x \\ge -2$ — 2).",
    "$m = 1$: 3 общие точки (на $x \\lt -2$ — 1, на $x \\ge -2$ — 2).",
    "$1 \\lt m \\lt 4$: 2 общие точки (на $x \\lt -2$ — 0, на $x \\ge -2$ — 2).",
    "$m = 4$: одна общая точка (на $x \\lt -2$ — 0, на $x \\ge -2$ — 1).",
    "$m \\gt 4$: нет общих точек.",
    "Прямая $y = m$ имеет с графиком ровно три общие точки при $m = 0$ и $m = 1$."
   ]
  },
  {
   "id": "22.fipi.B817D5",
   "group": "abs_parab",
   "fipi": "B817D5",
   "text": "Постройте график функции $y = 4|x + 2| - x^{2} - 3x - 2$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно три общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=0; m=2,25",
     "tex": "m = 0;\\ m = 2{,}25"
    }
   ],
   "answerTex": "$m = 0$; $m = 2{,}25$",
   "steps": [
    "Если $x \\ge -2$, то выражение под модулем неотрицательно: $|x + 2| = x + 2$. Тогда $y = 4(x + 2) - x^{2} - 3x - 2 = -x^{2} + x + 6$.",
    "Если $x \\lt -2$, то выражение под модулем отрицательно: $|x + 2| = -x - 2$. Тогда $y = 4 \\cdot (-x - 2) - x^{2} - 3x - 2 = -x^{2} - 7x - 10$.",
    "При $x \\lt -2$ график — парабола $y = -x^{2} - 7x - 10$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-7}{2 \\cdot (-1)} = -3{,}5$, $y_0 = -(-3{,}5)^{2} - 7 \\cdot (-3{,}5) - 10 = 2{,}25$.",
    "Вершина $(-3{,}5;\\ 2{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge -2$ график — парабола $y = -x^{2} + x + 6$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{1}{2 \\cdot (-1)} = 0{,}5$, $y_0 = -0{,}5^{2} + 0{,}5 + 6 = 6{,}25$.",
    "Вершина $(0{,}5;\\ 6{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = -2$ функция определена: $y(-2) = 0$, точка $(-2;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.B817D5]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: 2 общие точки (на $x \\lt -2$ — 1, на $x \\ge -2$ — 1).",
    "$m = 0$: 3 общие точки (на $x \\lt -2$ — 1, на $x \\ge -2$ — 2).",
    "$0 \\lt m \\lt 2{,}25$: 4 общие точки (на $x \\lt -2$ — 2, на $x \\ge -2$ — 2).",
    "$m = 2{,}25$: 3 общие точки (на $x \\lt -2$ — 1, на $x \\ge -2$ — 2).",
    "$2{,}25 \\lt m \\lt 6{,}25$: 2 общие точки (на $x \\lt -2$ — 0, на $x \\ge -2$ — 2).",
    "$m = 6{,}25$: одна общая точка (на $x \\lt -2$ — 0, на $x \\ge -2$ — 1).",
    "$m \\gt 6{,}25$: нет общих точек.",
    "Прямая $y = m$ имеет с графиком ровно три общие точки при $m = 0$ и $m = 2{,}25$."
   ]
  },
  {
   "id": "22.fipi.91BF55",
   "group": "abs_parab",
   "fipi": "91BF55",
   "text": "Постройте график функции $y = x^{2} - 7x - 5|x - 3| + 12$ и определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно три общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-4; m=0",
     "tex": "m = -4;\\ m = 0"
    }
   ],
   "answerTex": "$m = -4$; $m = 0$",
   "steps": [
    "Если $x \\ge 3$, то выражение под модулем неотрицательно: $|x - 3| = x - 3$. Тогда $y = x^{2} - 7x - 5(x - 3) + 12 = x^{2} - 12x + 27$.",
    "Если $x \\lt 3$, то выражение под модулем отрицательно: $|x - 3| = -x + 3$. Тогда $y = x^{2} - 7x - 5 \\cdot (-x + 3) + 12 = x^{2} - 2x - 3$.",
    "При $x \\lt 3$ график — парабола $y = x^{2} - 2x - 3$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-2}{2 \\cdot 1} = 1$, $y_0 = 1^{2} - 2 \\cdot 1 - 3 = -4$.",
    "Вершина $(1;\\ -4)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 3$ график — парабола $y = x^{2} - 12x + 27$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-12}{2 \\cdot 1} = 6$, $y_0 = 6^{2} - 12 \\cdot 6 + 27 = -9$.",
    "Вершина $(6;\\ -9)$ лежит на этом промежутке и входит в график.",
    "При $x = 3$ функция определена: $y(3) = 0$, точка $(3;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.91BF55]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -9$: нет общих точек.",
    "$m = -9$: одна общая точка (на $x \\lt 3$ — 0, на $x \\ge 3$ — 1).",
    "$-9 \\lt m \\lt -4$: 2 общие точки (на $x \\lt 3$ — 0, на $x \\ge 3$ — 2).",
    "$m = -4$: 3 общие точки (на $x \\lt 3$ — 1, на $x \\ge 3$ — 2).",
    "$-4 \\lt m \\lt 0$: 4 общие точки (на $x \\lt 3$ — 2, на $x \\ge 3$ — 2).",
    "$m = 0$: 3 общие точки (на $x \\lt 3$ — 1, на $x \\ge 3$ — 2).",
    "$m \\gt 0$: 2 общие точки (на $x \\lt 3$ — 1, на $x \\ge 3$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно три общие точки при $m = -4$ и $m = 0$."
   ]
  },
  {
   "id": "22.fipi.32C5AB",
   "group": "abs_parab",
   "fipi": "32C5AB",
   "text": "Постройте график функции $y = 2|x - 5| - x^{2} + 11x - 30$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно три общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=0; m=0,25",
     "tex": "m = 0;\\ m = 0{,}25"
    }
   ],
   "answerTex": "$m = 0$; $m = 0{,}25$",
   "steps": [
    "Если $x \\ge 5$, то выражение под модулем неотрицательно: $|x - 5| = x - 5$. Тогда $y = 2(x - 5) - x^{2} + 11x - 30 = -x^{2} + 13x - 40$.",
    "Если $x \\lt 5$, то выражение под модулем отрицательно: $|x - 5| = -x + 5$. Тогда $y = 2 \\cdot (-x + 5) - x^{2} + 11x - 30 = -x^{2} + 9x - 20$.",
    "При $x \\lt 5$ график — парабола $y = -x^{2} + 9x - 20$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{9}{2 \\cdot (-1)} = 4{,}5$, $y_0 = -4{,}5^{2} + 9 \\cdot 4{,}5 - 20 = 0{,}25$.",
    "Вершина $(4{,}5;\\ 0{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 5$ график — парабола $y = -x^{2} + 13x - 40$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{13}{2 \\cdot (-1)} = 6{,}5$, $y_0 = -6{,}5^{2} + 13 \\cdot 6{,}5 - 40 = 2{,}25$.",
    "Вершина $(6{,}5;\\ 2{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = 5$ функция определена: $y(5) = 0$, точка $(5;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.32C5AB]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: 2 общие точки (на $x \\lt 5$ — 1, на $x \\ge 5$ — 1).",
    "$m = 0$: 3 общие точки (на $x \\lt 5$ — 1, на $x \\ge 5$ — 2).",
    "$0 \\lt m \\lt 0{,}25$: 4 общие точки (на $x \\lt 5$ — 2, на $x \\ge 5$ — 2).",
    "$m = 0{,}25$: 3 общие точки (на $x \\lt 5$ — 1, на $x \\ge 5$ — 2).",
    "$0{,}25 \\lt m \\lt 2{,}25$: 2 общие точки (на $x \\lt 5$ — 0, на $x \\ge 5$ — 2).",
    "$m = 2{,}25$: одна общая точка (на $x \\lt 5$ — 0, на $x \\ge 5$ — 1).",
    "$m \\gt 2{,}25$: нет общих точек.",
    "Прямая $y = m$ имеет с графиком ровно три общие точки при $m = 0$ и $m = 0{,}25$."
   ]
  },
  {
   "id": "22.fipi.7D78E6",
   "group": "abs_parab",
   "fipi": "7D78E6",
   "text": "Постройте график функции $y = x^{2} + 13x - 3|x + 7| + 42$ и определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно три общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-1; m=0",
     "tex": "m = -1;\\ m = 0"
    }
   ],
   "answerTex": "$m = -1$; $m = 0$",
   "steps": [
    "Если $x \\ge -7$, то выражение под модулем неотрицательно: $|x + 7| = x + 7$. Тогда $y = x^{2} + 13x - 3(x + 7) + 42 = x^{2} + 10x + 21$.",
    "Если $x \\lt -7$, то выражение под модулем отрицательно: $|x + 7| = -x - 7$. Тогда $y = x^{2} + 13x - 3 \\cdot (-x - 7) + 42 = x^{2} + 16x + 63$.",
    "При $x \\lt -7$ график — парабола $y = x^{2} + 16x + 63$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{16}{2 \\cdot 1} = -8$, $y_0 = (-8)^{2} + 16 \\cdot (-8) + 63 = -1$.",
    "Вершина $(-8;\\ -1)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge -7$ график — парабола $y = x^{2} + 10x + 21$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{10}{2 \\cdot 1} = -5$, $y_0 = (-5)^{2} + 10 \\cdot (-5) + 21 = -4$.",
    "Вершина $(-5;\\ -4)$ лежит на этом промежутке и входит в график.",
    "При $x = -7$ функция определена: $y(-7) = 0$, точка $(-7;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.7D78E6]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -4$: нет общих точек.",
    "$m = -4$: одна общая точка (на $x \\lt -7$ — 0, на $x \\ge -7$ — 1).",
    "$-4 \\lt m \\lt -1$: 2 общие точки (на $x \\lt -7$ — 0, на $x \\ge -7$ — 2).",
    "$m = -1$: 3 общие точки (на $x \\lt -7$ — 1, на $x \\ge -7$ — 2).",
    "$-1 \\lt m \\lt 0$: 4 общие точки (на $x \\lt -7$ — 2, на $x \\ge -7$ — 2).",
    "$m = 0$: 3 общие точки (на $x \\lt -7$ — 1, на $x \\ge -7$ — 2).",
    "$m \\gt 0$: 2 общие точки (на $x \\lt -7$ — 1, на $x \\ge -7$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно три общие точки при $m = -1$ и $m = 0$."
   ]
  },
  {
   "id": "22.fipi.0B2341",
   "group": "abs_parab",
   "fipi": "0B2341",
   "text": "Постройте график функции $y = x^{2} + 3x - 4|x + 2| + 2$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно три общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-2,25; m=0",
     "tex": "m = -2{,}25;\\ m = 0"
    }
   ],
   "answerTex": "$m = -2{,}25$; $m = 0$",
   "steps": [
    "Если $x \\ge -2$, то выражение под модулем неотрицательно: $|x + 2| = x + 2$. Тогда $y = x^{2} + 3x - 4(x + 2) + 2 = x^{2} - x - 6$.",
    "Если $x \\lt -2$, то выражение под модулем отрицательно: $|x + 2| = -x - 2$. Тогда $y = x^{2} + 3x - 4 \\cdot (-x - 2) + 2 = x^{2} + 7x + 10$.",
    "При $x \\lt -2$ график — парабола $y = x^{2} + 7x + 10$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{7}{2 \\cdot 1} = -3{,}5$, $y_0 = (-3{,}5)^{2} + 7 \\cdot (-3{,}5) + 10 = -2{,}25$.",
    "Вершина $(-3{,}5;\\ -2{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge -2$ график — парабола $y = x^{2} - x - 6$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-1}{2 \\cdot 1} = 0{,}5$, $y_0 = 0{,}5^{2} - 0{,}5 - 6 = -6{,}25$.",
    "Вершина $(0{,}5;\\ -6{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = -2$ функция определена: $y(-2) = 0$, точка $(-2;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.0B2341]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -6{,}25$: нет общих точек.",
    "$m = -6{,}25$: одна общая точка (на $x \\lt -2$ — 0, на $x \\ge -2$ — 1).",
    "$-6{,}25 \\lt m \\lt -2{,}25$: 2 общие точки (на $x \\lt -2$ — 0, на $x \\ge -2$ — 2).",
    "$m = -2{,}25$: 3 общие точки (на $x \\lt -2$ — 1, на $x \\ge -2$ — 2).",
    "$-2{,}25 \\lt m \\lt 0$: 4 общие точки (на $x \\lt -2$ — 2, на $x \\ge -2$ — 2).",
    "$m = 0$: 3 общие точки (на $x \\lt -2$ — 1, на $x \\ge -2$ — 2).",
    "$m \\gt 0$: 2 общие точки (на $x \\lt -2$ — 1, на $x \\ge -2$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно три общие точки при $m = -2{,}25$ и $m = 0$."
   ]
  },
  {
   "id": "22.fipi.35020B",
   "group": "abs_parab",
   "fipi": "35020B",
   "text": "Постройте график функции $y = 5|x - 2| - x^{2} + 5x - 6$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно три общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=0; m=4",
     "tex": "m = 0;\\ m = 4"
    }
   ],
   "answerTex": "$m = 0$; $m = 4$",
   "steps": [
    "Если $x \\ge 2$, то выражение под модулем неотрицательно: $|x - 2| = x - 2$. Тогда $y = 5(x - 2) - x^{2} + 5x - 6 = -x^{2} + 10x - 16$.",
    "Если $x \\lt 2$, то выражение под модулем отрицательно: $|x - 2| = -x + 2$. Тогда $y = 5 \\cdot (-x + 2) - x^{2} + 5x - 6 = -x^{2} + 4$.",
    "При $x \\lt 2$ график — парабола $y = -x^{2} + 4$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 4$.",
    "Вершина $(0;\\ 4)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 2$ график — парабола $y = -x^{2} + 10x - 16$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{10}{2 \\cdot (-1)} = 5$, $y_0 = -5^{2} + 10 \\cdot 5 - 16 = 9$.",
    "Вершина $(5;\\ 9)$ лежит на этом промежутке и входит в график.",
    "При $x = 2$ функция определена: $y(2) = 0$, точка $(2;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.35020B]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: 2 общие точки (на $x \\lt 2$ — 1, на $x \\ge 2$ — 1).",
    "$m = 0$: 3 общие точки (на $x \\lt 2$ — 1, на $x \\ge 2$ — 2).",
    "$0 \\lt m \\lt 4$: 4 общие точки (на $x \\lt 2$ — 2, на $x \\ge 2$ — 2).",
    "$m = 4$: 3 общие точки (на $x \\lt 2$ — 1, на $x \\ge 2$ — 2).",
    "$4 \\lt m \\lt 9$: 2 общие точки (на $x \\lt 2$ — 0, на $x \\ge 2$ — 2).",
    "$m = 9$: одна общая точка (на $x \\lt 2$ — 0, на $x \\ge 2$ — 1).",
    "$m \\gt 9$: нет общих точек.",
    "Прямая $y = m$ имеет с графиком ровно три общие точки при $m = 0$ и $m = 4$."
   ]
  },
  {
   "id": "22.fipi.02F213",
   "group": "abs_parab",
   "fipi": "02F213",
   "text": "Постройте график функции $y = x^{2} + 3x - 3|x + 2| + 2$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно три общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-1; m=0",
     "tex": "m = -1;\\ m = 0"
    }
   ],
   "answerTex": "$m = -1$; $m = 0$",
   "steps": [
    "Если $x \\ge -2$, то выражение под модулем неотрицательно: $|x + 2| = x + 2$. Тогда $y = x^{2} + 3x - 3(x + 2) + 2 = x^{2} - 4$.",
    "Если $x \\lt -2$, то выражение под модулем отрицательно: $|x + 2| = -x - 2$. Тогда $y = x^{2} + 3x - 3 \\cdot (-x - 2) + 2 = x^{2} + 6x + 8$.",
    "При $x \\lt -2$ график — парабола $y = x^{2} + 6x + 8$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{6}{2 \\cdot 1} = -3$, $y_0 = (-3)^{2} + 6 \\cdot (-3) + 8 = -1$.",
    "Вершина $(-3;\\ -1)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge -2$ график — парабола $y = x^{2} - 4$, ветви направлены вверх. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = -4$.",
    "Вершина $(0;\\ -4)$ лежит на этом промежутке и входит в график.",
    "При $x = -2$ функция определена: $y(-2) = 0$, точка $(-2;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.02F213]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -4$: нет общих точек.",
    "$m = -4$: одна общая точка (на $x \\lt -2$ — 0, на $x \\ge -2$ — 1).",
    "$-4 \\lt m \\lt -1$: 2 общие точки (на $x \\lt -2$ — 0, на $x \\ge -2$ — 2).",
    "$m = -1$: 3 общие точки (на $x \\lt -2$ — 1, на $x \\ge -2$ — 2).",
    "$-1 \\lt m \\lt 0$: 4 общие точки (на $x \\lt -2$ — 2, на $x \\ge -2$ — 2).",
    "$m = 0$: 3 общие точки (на $x \\lt -2$ — 1, на $x \\ge -2$ — 2).",
    "$m \\gt 0$: 2 общие точки (на $x \\lt -2$ — 1, на $x \\ge -2$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно три общие точки при $m = -1$ и $m = 0$."
   ]
  },
  {
   "id": "22.fipi.6DF71A",
   "group": "abs_parab",
   "fipi": "6DF71A",
   "text": "Постройте график функции $y = 5|x - 3| - x^{2} + 7x - 12$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно три общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=0; m=4",
     "tex": "m = 0;\\ m = 4"
    }
   ],
   "answerTex": "$m = 0$; $m = 4$",
   "steps": [
    "Если $x \\ge 3$, то выражение под модулем неотрицательно: $|x - 3| = x - 3$. Тогда $y = 5(x - 3) - x^{2} + 7x - 12 = -x^{2} + 12x - 27$.",
    "Если $x \\lt 3$, то выражение под модулем отрицательно: $|x - 3| = -x + 3$. Тогда $y = 5 \\cdot (-x + 3) - x^{2} + 7x - 12 = -x^{2} + 2x + 3$.",
    "При $x \\lt 3$ график — парабола $y = -x^{2} + 2x + 3$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{2}{2 \\cdot (-1)} = 1$, $y_0 = -1^{2} + 2 \\cdot 1 + 3 = 4$.",
    "Вершина $(1;\\ 4)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 3$ график — парабола $y = -x^{2} + 12x - 27$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{12}{2 \\cdot (-1)} = 6$, $y_0 = -6^{2} + 12 \\cdot 6 - 27 = 9$.",
    "Вершина $(6;\\ 9)$ лежит на этом промежутке и входит в график.",
    "При $x = 3$ функция определена: $y(3) = 0$, точка $(3;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.6DF71A]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: 2 общие точки (на $x \\lt 3$ — 1, на $x \\ge 3$ — 1).",
    "$m = 0$: 3 общие точки (на $x \\lt 3$ — 1, на $x \\ge 3$ — 2).",
    "$0 \\lt m \\lt 4$: 4 общие точки (на $x \\lt 3$ — 2, на $x \\ge 3$ — 2).",
    "$m = 4$: 3 общие точки (на $x \\lt 3$ — 1, на $x \\ge 3$ — 2).",
    "$4 \\lt m \\lt 9$: 2 общие точки (на $x \\lt 3$ — 0, на $x \\ge 3$ — 2).",
    "$m = 9$: одна общая точка (на $x \\lt 3$ — 0, на $x \\ge 3$ — 1).",
    "$m \\gt 9$: нет общих точек.",
    "Прямая $y = m$ имеет с графиком ровно три общие точки при $m = 0$ и $m = 4$."
   ]
  },
  {
   "id": "22.fipi.8A552E",
   "group": "abs_parab",
   "fipi": "8A552E",
   "text": "Постройте график функции $y = 3|x + 8| - x^{2} - 14x - 48$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно три общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=0; m=0,25",
     "tex": "m = 0;\\ m = 0{,}25"
    }
   ],
   "answerTex": "$m = 0$; $m = 0{,}25$",
   "steps": [
    "Если $x \\ge -8$, то выражение под модулем неотрицательно: $|x + 8| = x + 8$. Тогда $y = 3(x + 8) - x^{2} - 14x - 48 = -x^{2} - 11x - 24$.",
    "Если $x \\lt -8$, то выражение под модулем отрицательно: $|x + 8| = -x - 8$. Тогда $y = 3 \\cdot (-x - 8) - x^{2} - 14x - 48 = -x^{2} - 17x - 72$.",
    "При $x \\lt -8$ график — парабола $y = -x^{2} - 17x - 72$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-17}{2 \\cdot (-1)} = -8{,}5$, $y_0 = -(-8{,}5)^{2} - 17 \\cdot (-8{,}5) - 72 = 0{,}25$.",
    "Вершина $(-8{,}5;\\ 0{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge -8$ график — парабола $y = -x^{2} - 11x - 24$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-11}{2 \\cdot (-1)} = -5{,}5$, $y_0 = -(-5{,}5)^{2} - 11 \\cdot (-5{,}5) - 24 = 6{,}25$.",
    "Вершина $(-5{,}5;\\ 6{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = -8$ функция определена: $y(-8) = 0$, точка $(-8;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.8A552E]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: 2 общие точки (на $x \\lt -8$ — 1, на $x \\ge -8$ — 1).",
    "$m = 0$: 3 общие точки (на $x \\lt -8$ — 1, на $x \\ge -8$ — 2).",
    "$0 \\lt m \\lt 0{,}25$: 4 общие точки (на $x \\lt -8$ — 2, на $x \\ge -8$ — 2).",
    "$m = 0{,}25$: 3 общие точки (на $x \\lt -8$ — 1, на $x \\ge -8$ — 2).",
    "$0{,}25 \\lt m \\lt 6{,}25$: 2 общие точки (на $x \\lt -8$ — 0, на $x \\ge -8$ — 2).",
    "$m = 6{,}25$: одна общая точка (на $x \\lt -8$ — 0, на $x \\ge -8$ — 1).",
    "$m \\gt 6{,}25$: нет общих точек.",
    "Прямая $y = m$ имеет с графиком ровно три общие точки при $m = 0$ и $m = 0{,}25$."
   ]
  },
  {
   "id": "22.fipi.34C6D0",
   "group": "abs_parab",
   "fipi": "34C6D0",
   "text": "Постройте график функции $y = 3|x + 7| - x^{2} - 13x - 42$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно три общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=0; m=1",
     "tex": "m = 0;\\ m = 1"
    }
   ],
   "answerTex": "$m = 0$; $m = 1$",
   "steps": [
    "Если $x \\ge -7$, то выражение под модулем неотрицательно: $|x + 7| = x + 7$. Тогда $y = 3(x + 7) - x^{2} - 13x - 42 = -x^{2} - 10x - 21$.",
    "Если $x \\lt -7$, то выражение под модулем отрицательно: $|x + 7| = -x - 7$. Тогда $y = 3 \\cdot (-x - 7) - x^{2} - 13x - 42 = -x^{2} - 16x - 63$.",
    "При $x \\lt -7$ график — парабола $y = -x^{2} - 16x - 63$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-16}{2 \\cdot (-1)} = -8$, $y_0 = -(-8)^{2} - 16 \\cdot (-8) - 63 = 1$.",
    "Вершина $(-8;\\ 1)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge -7$ график — парабола $y = -x^{2} - 10x - 21$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{-10}{2 \\cdot (-1)} = -5$, $y_0 = -(-5)^{2} - 10 \\cdot (-5) - 21 = 4$.",
    "Вершина $(-5;\\ 4)$ лежит на этом промежутке и входит в график.",
    "При $x = -7$ функция определена: $y(-7) = 0$, точка $(-7;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.34C6D0]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: 2 общие точки (на $x \\lt -7$ — 1, на $x \\ge -7$ — 1).",
    "$m = 0$: 3 общие точки (на $x \\lt -7$ — 1, на $x \\ge -7$ — 2).",
    "$0 \\lt m \\lt 1$: 4 общие точки (на $x \\lt -7$ — 2, на $x \\ge -7$ — 2).",
    "$m = 1$: 3 общие точки (на $x \\lt -7$ — 1, на $x \\ge -7$ — 2).",
    "$1 \\lt m \\lt 4$: 2 общие точки (на $x \\lt -7$ — 0, на $x \\ge -7$ — 2).",
    "$m = 4$: одна общая точка (на $x \\lt -7$ — 0, на $x \\ge -7$ — 1).",
    "$m \\gt 4$: нет общих точек.",
    "Прямая $y = m$ имеет с графиком ровно три общие точки при $m = 0$ и $m = 1$."
   ]
  },
  {
   "id": "22.fipi.1D555C",
   "group": "abs_parab",
   "fipi": "1D555C",
   "text": "Постройте график функции $y = x^{2} - 11x - 2|x - 5| + 30$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно три общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-0,25; m=0",
     "tex": "m = -0{,}25;\\ m = 0"
    }
   ],
   "answerTex": "$m = -0{,}25$; $m = 0$",
   "steps": [
    "Если $x \\ge 5$, то выражение под модулем неотрицательно: $|x - 5| = x - 5$. Тогда $y = x^{2} - 11x - 2(x - 5) + 30 = x^{2} - 13x + 40$.",
    "Если $x \\lt 5$, то выражение под модулем отрицательно: $|x - 5| = -x + 5$. Тогда $y = x^{2} - 11x - 2 \\cdot (-x + 5) + 30 = x^{2} - 9x + 20$.",
    "При $x \\lt 5$ график — парабола $y = x^{2} - 9x + 20$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-9}{2 \\cdot 1} = 4{,}5$, $y_0 = 4{,}5^{2} - 9 \\cdot 4{,}5 + 20 = -0{,}25$.",
    "Вершина $(4{,}5;\\ -0{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 5$ график — парабола $y = x^{2} - 13x + 40$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-13}{2 \\cdot 1} = 6{,}5$, $y_0 = 6{,}5^{2} - 13 \\cdot 6{,}5 + 40 = -2{,}25$.",
    "Вершина $(6{,}5;\\ -2{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = 5$ функция определена: $y(5) = 0$, точка $(5;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.1D555C]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -2{,}25$: нет общих точек.",
    "$m = -2{,}25$: одна общая точка (на $x \\lt 5$ — 0, на $x \\ge 5$ — 1).",
    "$-2{,}25 \\lt m \\lt -0{,}25$: 2 общие точки (на $x \\lt 5$ — 0, на $x \\ge 5$ — 2).",
    "$m = -0{,}25$: 3 общие точки (на $x \\lt 5$ — 1, на $x \\ge 5$ — 2).",
    "$-0{,}25 \\lt m \\lt 0$: 4 общие точки (на $x \\lt 5$ — 2, на $x \\ge 5$ — 2).",
    "$m = 0$: 3 общие точки (на $x \\lt 5$ — 1, на $x \\ge 5$ — 2).",
    "$m \\gt 0$: 2 общие точки (на $x \\lt 5$ — 1, на $x \\ge 5$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно три общие точки при $m = -0{,}25$ и $m = 0$."
   ]
  },
  {
   "id": "22.fipi.2F87A2",
   "group": "abs_parab",
   "fipi": "2F87A2",
   "text": "Постройте график функции $y = 2|x - 4| - x^{2} + 9x - 20$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно три общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=0; m=0,25",
     "tex": "m = 0;\\ m = 0{,}25"
    }
   ],
   "answerTex": "$m = 0$; $m = 0{,}25$",
   "steps": [
    "Если $x \\ge 4$, то выражение под модулем неотрицательно: $|x - 4| = x - 4$. Тогда $y = 2(x - 4) - x^{2} + 9x - 20 = -x^{2} + 11x - 28$.",
    "Если $x \\lt 4$, то выражение под модулем отрицательно: $|x - 4| = -x + 4$. Тогда $y = 2 \\cdot (-x + 4) - x^{2} + 9x - 20 = -x^{2} + 7x - 12$.",
    "При $x \\lt 4$ график — парабола $y = -x^{2} + 7x - 12$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{7}{2 \\cdot (-1)} = 3{,}5$, $y_0 = -3{,}5^{2} + 7 \\cdot 3{,}5 - 12 = 0{,}25$.",
    "Вершина $(3{,}5;\\ 0{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 4$ график — парабола $y = -x^{2} + 11x - 28$, ветви направлены вниз. Вершина: $x_0 = -\\dfrac{11}{2 \\cdot (-1)} = 5{,}5$, $y_0 = -5{,}5^{2} + 11 \\cdot 5{,}5 - 28 = 2{,}25$.",
    "Вершина $(5{,}5;\\ 2{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = 4$ функция определена: $y(4) = 0$, точка $(4;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.2F87A2]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: 2 общие точки (на $x \\lt 4$ — 1, на $x \\ge 4$ — 1).",
    "$m = 0$: 3 общие точки (на $x \\lt 4$ — 1, на $x \\ge 4$ — 2).",
    "$0 \\lt m \\lt 0{,}25$: 4 общие точки (на $x \\lt 4$ — 2, на $x \\ge 4$ — 2).",
    "$m = 0{,}25$: 3 общие точки (на $x \\lt 4$ — 1, на $x \\ge 4$ — 2).",
    "$0{,}25 \\lt m \\lt 2{,}25$: 2 общие точки (на $x \\lt 4$ — 0, на $x \\ge 4$ — 2).",
    "$m = 2{,}25$: одна общая точка (на $x \\lt 4$ — 0, на $x \\ge 4$ — 1).",
    "$m \\gt 2{,}25$: нет общих точек.",
    "Прямая $y = m$ имеет с графиком ровно три общие точки при $m = 0$ и $m = 0{,}25$."
   ]
  },
  {
   "id": "22.fipi.2CBB87",
   "group": "abs_parab",
   "fipi": "2CBB87",
   "text": "Постройте график функции $y = x^{2} - 8x - 4|x - 3| + 15$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно три общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-1; m=0",
     "tex": "m = -1;\\ m = 0"
    }
   ],
   "answerTex": "$m = -1$; $m = 0$",
   "steps": [
    "Если $x \\ge 3$, то выражение под модулем неотрицательно: $|x - 3| = x - 3$. Тогда $y = x^{2} - 8x - 4(x - 3) + 15 = x^{2} - 12x + 27$.",
    "Если $x \\lt 3$, то выражение под модулем отрицательно: $|x - 3| = -x + 3$. Тогда $y = x^{2} - 8x - 4 \\cdot (-x + 3) + 15 = x^{2} - 4x + 3$.",
    "При $x \\lt 3$ график — парабола $y = x^{2} - 4x + 3$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-4}{2 \\cdot 1} = 2$, $y_0 = 2^{2} - 4 \\cdot 2 + 3 = -1$.",
    "Вершина $(2;\\ -1)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge 3$ график — парабола $y = x^{2} - 12x + 27$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{-12}{2 \\cdot 1} = 6$, $y_0 = 6^{2} - 12 \\cdot 6 + 27 = -9$.",
    "Вершина $(6;\\ -9)$ лежит на этом промежутке и входит в график.",
    "При $x = 3$ функция определена: $y(3) = 0$, точка $(3;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.2CBB87]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -9$: нет общих точек.",
    "$m = -9$: одна общая точка (на $x \\lt 3$ — 0, на $x \\ge 3$ — 1).",
    "$-9 \\lt m \\lt -1$: 2 общие точки (на $x \\lt 3$ — 0, на $x \\ge 3$ — 2).",
    "$m = -1$: 3 общие точки (на $x \\lt 3$ — 1, на $x \\ge 3$ — 2).",
    "$-1 \\lt m \\lt 0$: 4 общие точки (на $x \\lt 3$ — 2, на $x \\ge 3$ — 2).",
    "$m = 0$: 3 общие точки (на $x \\lt 3$ — 1, на $x \\ge 3$ — 2).",
    "$m \\gt 0$: 2 общие точки (на $x \\lt 3$ — 1, на $x \\ge 3$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно три общие точки при $m = -1$ и $m = 0$."
   ]
  },
  {
   "id": "22.fipi.6B948F",
   "group": "abs_parab",
   "fipi": "6B948F",
   "text": "Постройте график функции $y = x^{2} + 11x - 4|x + 6| + 30$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно три общие точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-2,25; m=0",
     "tex": "m = -2{,}25;\\ m = 0"
    }
   ],
   "answerTex": "$m = -2{,}25$; $m = 0$",
   "steps": [
    "Если $x \\ge -6$, то выражение под модулем неотрицательно: $|x + 6| = x + 6$. Тогда $y = x^{2} + 11x - 4(x + 6) + 30 = x^{2} + 7x + 6$.",
    "Если $x \\lt -6$, то выражение под модулем отрицательно: $|x + 6| = -x - 6$. Тогда $y = x^{2} + 11x - 4 \\cdot (-x - 6) + 30 = x^{2} + 15x + 54$.",
    "При $x \\lt -6$ график — парабола $y = x^{2} + 15x + 54$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{15}{2 \\cdot 1} = -7{,}5$, $y_0 = (-7{,}5)^{2} + 15 \\cdot (-7{,}5) + 54 = -2{,}25$.",
    "Вершина $(-7{,}5;\\ -2{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x \\ge -6$ график — парабола $y = x^{2} + 7x + 6$, ветви направлены вверх. Вершина: $x_0 = -\\dfrac{7}{2 \\cdot 1} = -3{,}5$, $y_0 = (-3{,}5)^{2} + 7 \\cdot (-3{,}5) + 6 = -6{,}25$.",
    "Вершина $(-3{,}5;\\ -6{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = -6$ функция определена: $y(-6) = 0$, точка $(-6;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.6B948F]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -6{,}25$: нет общих точек.",
    "$m = -6{,}25$: одна общая точка (на $x \\lt -6$ — 0, на $x \\ge -6$ — 1).",
    "$-6{,}25 \\lt m \\lt -2{,}25$: 2 общие точки (на $x \\lt -6$ — 0, на $x \\ge -6$ — 2).",
    "$m = -2{,}25$: 3 общие точки (на $x \\lt -6$ — 1, на $x \\ge -6$ — 2).",
    "$-2{,}25 \\lt m \\lt 0$: 4 общие точки (на $x \\lt -6$ — 2, на $x \\ge -6$ — 2).",
    "$m = 0$: 3 общие точки (на $x \\lt -6$ — 1, на $x \\ge -6$ — 2).",
    "$m \\gt 0$: 2 общие точки (на $x \\lt -6$ — 1, на $x \\ge -6$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно три общие точки при $m = -2{,}25$ и $m = 0$."
   ]
  },
  {
   "id": "22.fipi.158C7B",
   "group": "hyper_abs",
   "fipi": "158C7B",
   "text": "Постройте график функции $y = \\dfrac{1}{2}(|\\dfrac{x}{4{,}5} - \\dfrac{4{,}5}{x}| + \\dfrac{x}{4{,}5} + \\dfrac{4{,}5}{x})$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-1; m=1",
     "tex": "m = -1;\\ m = 1"
    }
   ],
   "answerTex": "$m = -1$; $m = 1$",
   "steps": [
    "Обозначим $a = \\dfrac{x}{4{,}5}$, $b = \\dfrac{4{,}5}{x}$. Тогда $y = \\dfrac{1}{2}(|a - b| + a + b)$.",
    "Если $a \\ge b$, то $|a - b| = a - b$ и $y = \\dfrac{1}{2}(a - b + a + b) = a$.",
    "Если $a \\lt b$, то $|a - b| = b - a$ и $y = \\dfrac{1}{2}(b - a + a + b) = b$. Значит, $y$ — наибольшее из чисел $a$ и $b$.",
    "Сравним $a$ и $b$: $a - b = \\dfrac{x^2 - 20{,}25}{4{,}5x}$. Его знак: при $x \\gt 0$ — как у $x^2 - 20{,}25$, при $x \\lt 0$ — противоположный. Поэтому $a \\ge b$ при $x \\ge 4{,}5$ и при $-4{,}5 \\le x \\lt 0$.",
    "При $x \\lt -4{,}5$ график — гипербола $y = \\dfrac{9}{2 x}$.",
    "При $-4{,}5 \\le x \\lt 0$ график — прямая $y = \\dfrac{2}{9}x$: с ростом $x$ значения растут.",
    "При $0 \\lt x \\lt 4{,}5$ график — гипербола $y = \\dfrac{9}{2 x}$.",
    "При $x \\ge 4{,}5$ график — прямая $y = \\dfrac{2}{9}x$: с ростом $x$ значения растут.",
    "При $x = -4{,}5$ функция определена: $y(-4{,}5) = -1$, точка $(-4{,}5;\\ -1)$ входит в график (оба куска сходятся в ней).",
    "При $x = 0$ функция не определена: график подходит к значению $y = 0$, точка $(0;\\ 0)$ выколота; график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = 4{,}5$ функция определена: $y(4{,}5) = 1$, точка $(4{,}5;\\ 1)$ входит в график (оба куска сходятся в ней).",
    "При $x \\to -\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.158C7B]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -1$: нет общих точек.",
    "$m = -1$: одна общая точка (на $x \\lt -4{,}5$ — 0, на $-4{,}5 \\le x \\lt 0$ — 1, на $0 \\lt x \\lt 4{,}5$ — 0, на $x \\ge 4{,}5$ — 0).",
    "$-1 \\lt m \\lt 0$: 2 общие точки (на $x \\lt -4{,}5$ — 1, на $-4{,}5 \\le x \\lt 0$ — 1, на $0 \\lt x \\lt 4{,}5$ — 0, на $x \\ge 4{,}5$ — 0).",
    "$0 \\le m \\lt 1$: нет общих точек.",
    "$m = 1$: одна общая точка (на $x \\lt -4{,}5$ — 0, на $-4{,}5 \\le x \\lt 0$ — 0, на $0 \\lt x \\lt 4{,}5$ — 0, на $x \\ge 4{,}5$ — 1).",
    "$m \\gt 1$: 2 общие точки (на $x \\lt -4{,}5$ — 0, на $-4{,}5 \\le x \\lt 0$ — 0, на $0 \\lt x \\lt 4{,}5$ — 1, на $x \\ge 4{,}5$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно одну общую точку при $m = -1$ и $m = 1$."
   ]
  },
  {
   "id": "22.fipi.4773B7",
   "group": "hyper_abs",
   "fipi": "4773B7",
   "text": "Постройте график функции $y = \\dfrac{1}{2}(|\\dfrac{x}{2{,}5} - \\dfrac{2{,}5}{x}| + \\dfrac{x}{2{,}5} + \\dfrac{2{,}5}{x})$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-1; m=1",
     "tex": "m = -1;\\ m = 1"
    }
   ],
   "answerTex": "$m = -1$; $m = 1$",
   "steps": [
    "Обозначим $a = \\dfrac{x}{2{,}5}$, $b = \\dfrac{2{,}5}{x}$. Тогда $y = \\dfrac{1}{2}(|a - b| + a + b)$.",
    "Если $a \\ge b$, то $|a - b| = a - b$ и $y = \\dfrac{1}{2}(a - b + a + b) = a$.",
    "Если $a \\lt b$, то $|a - b| = b - a$ и $y = \\dfrac{1}{2}(b - a + a + b) = b$. Значит, $y$ — наибольшее из чисел $a$ и $b$.",
    "Сравним $a$ и $b$: $a - b = \\dfrac{x^2 - 6{,}25}{2{,}5x}$. Его знак: при $x \\gt 0$ — как у $x^2 - 6{,}25$, при $x \\lt 0$ — противоположный. Поэтому $a \\ge b$ при $x \\ge 2{,}5$ и при $-2{,}5 \\le x \\lt 0$.",
    "При $x \\lt -2{,}5$ график — гипербола $y = \\dfrac{5}{2 x}$.",
    "При $-2{,}5 \\le x \\lt 0$ график — прямая $y = 0{,}4x$: с ростом $x$ значения растут.",
    "При $0 \\lt x \\lt 2{,}5$ график — гипербола $y = \\dfrac{5}{2 x}$.",
    "При $x \\ge 2{,}5$ график — прямая $y = 0{,}4x$: с ростом $x$ значения растут.",
    "При $x = -2{,}5$ функция определена: $y(-2{,}5) = -1$, точка $(-2{,}5;\\ -1)$ входит в график (оба куска сходятся в ней).",
    "При $x = 0$ функция не определена: график подходит к значению $y = 0$, точка $(0;\\ 0)$ выколота; график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = 2{,}5$ функция определена: $y(2{,}5) = 1$, точка $(2{,}5;\\ 1)$ входит в график (оба куска сходятся в ней).",
    "При $x \\to -\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.4773B7]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -1$: нет общих точек.",
    "$m = -1$: одна общая точка (на $x \\lt -2{,}5$ — 0, на $-2{,}5 \\le x \\lt 0$ — 1, на $0 \\lt x \\lt 2{,}5$ — 0, на $x \\ge 2{,}5$ — 0).",
    "$-1 \\lt m \\lt 0$: 2 общие точки (на $x \\lt -2{,}5$ — 1, на $-2{,}5 \\le x \\lt 0$ — 1, на $0 \\lt x \\lt 2{,}5$ — 0, на $x \\ge 2{,}5$ — 0).",
    "$0 \\le m \\lt 1$: нет общих точек.",
    "$m = 1$: одна общая точка (на $x \\lt -2{,}5$ — 0, на $-2{,}5 \\le x \\lt 0$ — 0, на $0 \\lt x \\lt 2{,}5$ — 0, на $x \\ge 2{,}5$ — 1).",
    "$m \\gt 1$: 2 общие точки (на $x \\lt -2{,}5$ — 0, на $-2{,}5 \\le x \\lt 0$ — 0, на $0 \\lt x \\lt 2{,}5$ — 1, на $x \\ge 2{,}5$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно одну общую точку при $m = -1$ и $m = 1$."
   ]
  },
  {
   "id": "22.fipi.4FBE10",
   "group": "hyper_abs",
   "fipi": "4FBE10",
   "text": "Постройте график функции $y = \\dfrac{1}{2}(|\\dfrac{x}{3} - \\dfrac{3}{x}| + \\dfrac{x}{3} + \\dfrac{3}{x})$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-1; m=1",
     "tex": "m = -1;\\ m = 1"
    }
   ],
   "answerTex": "$m = -1$; $m = 1$",
   "steps": [
    "Обозначим $a = \\dfrac{x}{3}$, $b = \\dfrac{3}{x}$. Тогда $y = \\dfrac{1}{2}(|a - b| + a + b)$.",
    "Если $a \\ge b$, то $|a - b| = a - b$ и $y = \\dfrac{1}{2}(a - b + a + b) = a$.",
    "Если $a \\lt b$, то $|a - b| = b - a$ и $y = \\dfrac{1}{2}(b - a + a + b) = b$. Значит, $y$ — наибольшее из чисел $a$ и $b$.",
    "Сравним $a$ и $b$: $a - b = \\dfrac{x^2 - 9}{3x}$. Его знак: при $x \\gt 0$ — как у $x^2 - 9$, при $x \\lt 0$ — противоположный. Поэтому $a \\ge b$ при $x \\ge 3$ и при $-3 \\le x \\lt 0$.",
    "При $x \\lt -3$ график — гипербола $y = \\dfrac{3}{x}$.",
    "При $-3 \\le x \\lt 0$ график — прямая $y = \\dfrac{1}{3}x$: с ростом $x$ значения растут.",
    "При $0 \\lt x \\lt 3$ график — гипербола $y = \\dfrac{3}{x}$.",
    "При $x \\ge 3$ график — прямая $y = \\dfrac{1}{3}x$: с ростом $x$ значения растут.",
    "При $x = -3$ функция определена: $y(-3) = -1$, точка $(-3;\\ -1)$ входит в график (оба куска сходятся в ней).",
    "При $x = 0$ функция не определена: график подходит к значению $y = 0$, точка $(0;\\ 0)$ выколота; график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = 3$ функция определена: $y(3) = 1$, точка $(3;\\ 1)$ входит в график (оба куска сходятся в ней).",
    "При $x \\to -\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.4FBE10]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -1$: нет общих точек.",
    "$m = -1$: одна общая точка (на $x \\lt -3$ — 0, на $-3 \\le x \\lt 0$ — 1, на $0 \\lt x \\lt 3$ — 0, на $x \\ge 3$ — 0).",
    "$-1 \\lt m \\lt 0$: 2 общие точки (на $x \\lt -3$ — 1, на $-3 \\le x \\lt 0$ — 1, на $0 \\lt x \\lt 3$ — 0, на $x \\ge 3$ — 0).",
    "$0 \\le m \\lt 1$: нет общих точек.",
    "$m = 1$: одна общая точка (на $x \\lt -3$ — 0, на $-3 \\le x \\lt 0$ — 0, на $0 \\lt x \\lt 3$ — 0, на $x \\ge 3$ — 1).",
    "$m \\gt 1$: 2 общие точки (на $x \\lt -3$ — 0, на $-3 \\le x \\lt 0$ — 0, на $0 \\lt x \\lt 3$ — 1, на $x \\ge 3$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно одну общую точку при $m = -1$ и $m = 1$."
   ]
  },
  {
   "id": "22.fipi.D69F19",
   "group": "hyper_abs",
   "fipi": "D69F19",
   "text": "Постройте график функции $y = \\dfrac{1}{2}(|\\dfrac{x}{4} - \\dfrac{4}{x}| + \\dfrac{x}{4} + \\dfrac{4}{x})$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-1; m=1",
     "tex": "m = -1;\\ m = 1"
    }
   ],
   "answerTex": "$m = -1$; $m = 1$",
   "steps": [
    "Обозначим $a = \\dfrac{x}{4}$, $b = \\dfrac{4}{x}$. Тогда $y = \\dfrac{1}{2}(|a - b| + a + b)$.",
    "Если $a \\ge b$, то $|a - b| = a - b$ и $y = \\dfrac{1}{2}(a - b + a + b) = a$.",
    "Если $a \\lt b$, то $|a - b| = b - a$ и $y = \\dfrac{1}{2}(b - a + a + b) = b$. Значит, $y$ — наибольшее из чисел $a$ и $b$.",
    "Сравним $a$ и $b$: $a - b = \\dfrac{x^2 - 16}{4x}$. Его знак: при $x \\gt 0$ — как у $x^2 - 16$, при $x \\lt 0$ — противоположный. Поэтому $a \\ge b$ при $x \\ge 4$ и при $-4 \\le x \\lt 0$.",
    "При $x \\lt -4$ график — гипербола $y = \\dfrac{4}{x}$.",
    "При $-4 \\le x \\lt 0$ график — прямая $y = 0{,}25x$: с ростом $x$ значения растут.",
    "При $0 \\lt x \\lt 4$ график — гипербола $y = \\dfrac{4}{x}$.",
    "При $x \\ge 4$ график — прямая $y = 0{,}25x$: с ростом $x$ значения растут.",
    "При $x = -4$ функция определена: $y(-4) = -1$, точка $(-4;\\ -1)$ входит в график (оба куска сходятся в ней).",
    "При $x = 0$ функция не определена: график подходит к значению $y = 0$, точка $(0;\\ 0)$ выколота; график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = 4$ функция определена: $y(4) = 1$, точка $(4;\\ 1)$ входит в график (оба куска сходятся в ней).",
    "При $x \\to -\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.D69F19]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -1$: нет общих точек.",
    "$m = -1$: одна общая точка (на $x \\lt -4$ — 0, на $-4 \\le x \\lt 0$ — 1, на $0 \\lt x \\lt 4$ — 0, на $x \\ge 4$ — 0).",
    "$-1 \\lt m \\lt 0$: 2 общие точки (на $x \\lt -4$ — 1, на $-4 \\le x \\lt 0$ — 1, на $0 \\lt x \\lt 4$ — 0, на $x \\ge 4$ — 0).",
    "$0 \\le m \\lt 1$: нет общих точек.",
    "$m = 1$: одна общая точка (на $x \\lt -4$ — 0, на $-4 \\le x \\lt 0$ — 0, на $0 \\lt x \\lt 4$ — 0, на $x \\ge 4$ — 1).",
    "$m \\gt 1$: 2 общие точки (на $x \\lt -4$ — 0, на $-4 \\le x \\lt 0$ — 0, на $0 \\lt x \\lt 4$ — 1, на $x \\ge 4$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно одну общую точку при $m = -1$ и $m = 1$."
   ]
  },
  {
   "id": "22.fipi.C1F62D",
   "group": "hyper_abs",
   "fipi": "C1F62D",
   "text": "Постройте график функции $y = \\dfrac{1}{2}(|\\dfrac{x}{2} - \\dfrac{2}{x}| + \\dfrac{x}{2} + \\dfrac{2}{x})$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-1; m=1",
     "tex": "m = -1;\\ m = 1"
    }
   ],
   "answerTex": "$m = -1$; $m = 1$",
   "steps": [
    "Обозначим $a = \\dfrac{x}{2}$, $b = \\dfrac{2}{x}$. Тогда $y = \\dfrac{1}{2}(|a - b| + a + b)$.",
    "Если $a \\ge b$, то $|a - b| = a - b$ и $y = \\dfrac{1}{2}(a - b + a + b) = a$.",
    "Если $a \\lt b$, то $|a - b| = b - a$ и $y = \\dfrac{1}{2}(b - a + a + b) = b$. Значит, $y$ — наибольшее из чисел $a$ и $b$.",
    "Сравним $a$ и $b$: $a - b = \\dfrac{x^2 - 4}{2x}$. Его знак: при $x \\gt 0$ — как у $x^2 - 4$, при $x \\lt 0$ — противоположный. Поэтому $a \\ge b$ при $x \\ge 2$ и при $-2 \\le x \\lt 0$.",
    "При $x \\lt -2$ график — гипербола $y = \\dfrac{2}{x}$.",
    "При $-2 \\le x \\lt 0$ график — прямая $y = 0{,}5x$: с ростом $x$ значения растут.",
    "При $0 \\lt x \\lt 2$ график — гипербола $y = \\dfrac{2}{x}$.",
    "При $x \\ge 2$ график — прямая $y = 0{,}5x$: с ростом $x$ значения растут.",
    "При $x = -2$ функция определена: $y(-2) = -1$, точка $(-2;\\ -1)$ входит в график (оба куска сходятся в ней).",
    "При $x = 0$ функция не определена: график подходит к значению $y = 0$, точка $(0;\\ 0)$ выколота; график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = 2$ функция определена: $y(2) = 1$, точка $(2;\\ 1)$ входит в график (оба куска сходятся в ней).",
    "При $x \\to -\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.C1F62D]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -1$: нет общих точек.",
    "$m = -1$: одна общая точка (на $x \\lt -2$ — 0, на $-2 \\le x \\lt 0$ — 1, на $0 \\lt x \\lt 2$ — 0, на $x \\ge 2$ — 0).",
    "$-1 \\lt m \\lt 0$: 2 общие точки (на $x \\lt -2$ — 1, на $-2 \\le x \\lt 0$ — 1, на $0 \\lt x \\lt 2$ — 0, на $x \\ge 2$ — 0).",
    "$0 \\le m \\lt 1$: нет общих точек.",
    "$m = 1$: одна общая точка (на $x \\lt -2$ — 0, на $-2 \\le x \\lt 0$ — 0, на $0 \\lt x \\lt 2$ — 0, на $x \\ge 2$ — 1).",
    "$m \\gt 1$: 2 общие точки (на $x \\lt -2$ — 0, на $-2 \\le x \\lt 0$ — 0, на $0 \\lt x \\lt 2$ — 1, на $x \\ge 2$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно одну общую точку при $m = -1$ и $m = 1$."
   ]
  },
  {
   "id": "22.fipi.F92250",
   "group": "hyper_abs",
   "fipi": "F92250",
   "text": "Постройте график функции $y = \\dfrac{1}{2}(|\\dfrac{x}{3{,}5} - \\dfrac{3{,}5}{x}| + \\dfrac{x}{3{,}5} + \\dfrac{3{,}5}{x})$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-1; m=1",
     "tex": "m = -1;\\ m = 1"
    }
   ],
   "answerTex": "$m = -1$; $m = 1$",
   "steps": [
    "Обозначим $a = \\dfrac{x}{3{,}5}$, $b = \\dfrac{3{,}5}{x}$. Тогда $y = \\dfrac{1}{2}(|a - b| + a + b)$.",
    "Если $a \\ge b$, то $|a - b| = a - b$ и $y = \\dfrac{1}{2}(a - b + a + b) = a$.",
    "Если $a \\lt b$, то $|a - b| = b - a$ и $y = \\dfrac{1}{2}(b - a + a + b) = b$. Значит, $y$ — наибольшее из чисел $a$ и $b$.",
    "Сравним $a$ и $b$: $a - b = \\dfrac{x^2 - 12{,}25}{3{,}5x}$. Его знак: при $x \\gt 0$ — как у $x^2 - 12{,}25$, при $x \\lt 0$ — противоположный. Поэтому $a \\ge b$ при $x \\ge 3{,}5$ и при $-3{,}5 \\le x \\lt 0$.",
    "При $x \\lt -3{,}5$ график — гипербола $y = \\dfrac{7}{2 x}$.",
    "При $-3{,}5 \\le x \\lt 0$ график — прямая $y = \\dfrac{2}{7}x$: с ростом $x$ значения растут.",
    "При $0 \\lt x \\lt 3{,}5$ график — гипербола $y = \\dfrac{7}{2 x}$.",
    "При $x \\ge 3{,}5$ график — прямая $y = \\dfrac{2}{7}x$: с ростом $x$ значения растут.",
    "При $x = -3{,}5$ функция определена: $y(-3{,}5) = -1$, точка $(-3{,}5;\\ -1)$ входит в график (оба куска сходятся в ней).",
    "При $x = 0$ функция не определена: график подходит к значению $y = 0$, точка $(0;\\ 0)$ выколота; график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = 3{,}5$ функция определена: $y(3{,}5) = 1$, точка $(3{,}5;\\ 1)$ входит в график (оба куска сходятся в ней).",
    "При $x \\to -\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.F92250]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -1$: нет общих точек.",
    "$m = -1$: одна общая точка (на $x \\lt -3{,}5$ — 0, на $-3{,}5 \\le x \\lt 0$ — 1, на $0 \\lt x \\lt 3{,}5$ — 0, на $x \\ge 3{,}5$ — 0).",
    "$-1 \\lt m \\lt 0$: 2 общие точки (на $x \\lt -3{,}5$ — 1, на $-3{,}5 \\le x \\lt 0$ — 1, на $0 \\lt x \\lt 3{,}5$ — 0, на $x \\ge 3{,}5$ — 0).",
    "$0 \\le m \\lt 1$: нет общих точек.",
    "$m = 1$: одна общая точка (на $x \\lt -3{,}5$ — 0, на $-3{,}5 \\le x \\lt 0$ — 0, на $0 \\lt x \\lt 3{,}5$ — 0, на $x \\ge 3{,}5$ — 1).",
    "$m \\gt 1$: 2 общие точки (на $x \\lt -3{,}5$ — 0, на $-3{,}5 \\le x \\lt 0$ — 0, на $0 \\lt x \\lt 3{,}5$ — 1, на $x \\ge 3{,}5$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно одну общую точку при $m = -1$ и $m = 1$."
   ]
  },
  {
   "id": "22.fipi.644EC3",
   "group": "hyper_abs",
   "fipi": "644EC3",
   "text": "Постройте график функции $y = \\dfrac{1}{2}(|\\dfrac{x}{1{,}5} - \\dfrac{1{,}5}{x}| + \\dfrac{x}{1{,}5} + \\dfrac{1{,}5}{x})$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-1; m=1",
     "tex": "m = -1;\\ m = 1"
    }
   ],
   "answerTex": "$m = -1$; $m = 1$",
   "steps": [
    "Обозначим $a = \\dfrac{x}{1{,}5}$, $b = \\dfrac{1{,}5}{x}$. Тогда $y = \\dfrac{1}{2}(|a - b| + a + b)$.",
    "Если $a \\ge b$, то $|a - b| = a - b$ и $y = \\dfrac{1}{2}(a - b + a + b) = a$.",
    "Если $a \\lt b$, то $|a - b| = b - a$ и $y = \\dfrac{1}{2}(b - a + a + b) = b$. Значит, $y$ — наибольшее из чисел $a$ и $b$.",
    "Сравним $a$ и $b$: $a - b = \\dfrac{x^2 - 2{,}25}{1{,}5x}$. Его знак: при $x \\gt 0$ — как у $x^2 - 2{,}25$, при $x \\lt 0$ — противоположный. Поэтому $a \\ge b$ при $x \\ge 1{,}5$ и при $-1{,}5 \\le x \\lt 0$.",
    "При $x \\lt -1{,}5$ график — гипербола $y = \\dfrac{3}{2 x}$.",
    "При $-1{,}5 \\le x \\lt 0$ график — прямая $y = \\dfrac{2}{3}x$: с ростом $x$ значения растут.",
    "При $0 \\lt x \\lt 1{,}5$ график — гипербола $y = \\dfrac{3}{2 x}$.",
    "При $x \\ge 1{,}5$ график — прямая $y = \\dfrac{2}{3}x$: с ростом $x$ значения растут.",
    "При $x = -1{,}5$ функция определена: $y(-1{,}5) = -1$, точка $(-1{,}5;\\ -1)$ входит в график (оба куска сходятся в ней).",
    "При $x = 0$ функция не определена: график подходит к значению $y = 0$, точка $(0;\\ 0)$ выколота; график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = 1{,}5$ функция определена: $y(1{,}5) = 1$, точка $(1{,}5;\\ 1)$ входит в график (оба куска сходятся в ней).",
    "При $x \\to -\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.644EC3]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -1$: нет общих точек.",
    "$m = -1$: одна общая точка (на $x \\lt -1{,}5$ — 0, на $-1{,}5 \\le x \\lt 0$ — 1, на $0 \\lt x \\lt 1{,}5$ — 0, на $x \\ge 1{,}5$ — 0).",
    "$-1 \\lt m \\lt 0$: 2 общие точки (на $x \\lt -1{,}5$ — 1, на $-1{,}5 \\le x \\lt 0$ — 1, на $0 \\lt x \\lt 1{,}5$ — 0, на $x \\ge 1{,}5$ — 0).",
    "$0 \\le m \\lt 1$: нет общих точек.",
    "$m = 1$: одна общая точка (на $x \\lt -1{,}5$ — 0, на $-1{,}5 \\le x \\lt 0$ — 0, на $0 \\lt x \\lt 1{,}5$ — 0, на $x \\ge 1{,}5$ — 1).",
    "$m \\gt 1$: 2 общие точки (на $x \\lt -1{,}5$ — 0, на $-1{,}5 \\le x \\lt 0$ — 0, на $0 \\lt x \\lt 1{,}5$ — 1, на $x \\ge 1{,}5$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно одну общую точку при $m = -1$ и $m = 1$."
   ]
  },
  {
   "id": "22.fipi.3B00E8",
   "group": "hyper_abs",
   "fipi": "3B00E8",
   "text": "Постройте график функции $y = \\dfrac{1}{2}(|\\dfrac{x}{5{,}5} - \\dfrac{5{,}5}{x}| + \\dfrac{x}{5{,}5} + \\dfrac{5{,}5}{x})$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-1; m=1",
     "tex": "m = -1;\\ m = 1"
    }
   ],
   "answerTex": "$m = -1$; $m = 1$",
   "steps": [
    "Обозначим $a = \\dfrac{x}{5{,}5}$, $b = \\dfrac{5{,}5}{x}$. Тогда $y = \\dfrac{1}{2}(|a - b| + a + b)$.",
    "Если $a \\ge b$, то $|a - b| = a - b$ и $y = \\dfrac{1}{2}(a - b + a + b) = a$.",
    "Если $a \\lt b$, то $|a - b| = b - a$ и $y = \\dfrac{1}{2}(b - a + a + b) = b$. Значит, $y$ — наибольшее из чисел $a$ и $b$.",
    "Сравним $a$ и $b$: $a - b = \\dfrac{x^2 - 30{,}25}{5{,}5x}$. Его знак: при $x \\gt 0$ — как у $x^2 - 30{,}25$, при $x \\lt 0$ — противоположный. Поэтому $a \\ge b$ при $x \\ge 5{,}5$ и при $-5{,}5 \\le x \\lt 0$.",
    "При $x \\lt -5{,}5$ график — гипербола $y = \\dfrac{11}{2 x}$.",
    "При $-5{,}5 \\le x \\lt 0$ график — прямая $y = \\dfrac{2}{11}x$: с ростом $x$ значения растут.",
    "При $0 \\lt x \\lt 5{,}5$ график — гипербола $y = \\dfrac{11}{2 x}$.",
    "При $x \\ge 5{,}5$ график — прямая $y = \\dfrac{2}{11}x$: с ростом $x$ значения растут.",
    "При $x = -5{,}5$ функция определена: $y(-5{,}5) = -1$, точка $(-5{,}5;\\ -1)$ входит в график (оба куска сходятся в ней).",
    "При $x = 0$ функция не определена: график подходит к значению $y = 0$, точка $(0;\\ 0)$ выколота; график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = 5{,}5$ функция определена: $y(5{,}5) = 1$, точка $(5{,}5;\\ 1)$ входит в график (оба куска сходятся в ней).",
    "При $x \\to -\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.3B00E8]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -1$: нет общих точек.",
    "$m = -1$: одна общая точка (на $x \\lt -5{,}5$ — 0, на $-5{,}5 \\le x \\lt 0$ — 1, на $0 \\lt x \\lt 5{,}5$ — 0, на $x \\ge 5{,}5$ — 0).",
    "$-1 \\lt m \\lt 0$: 2 общие точки (на $x \\lt -5{,}5$ — 1, на $-5{,}5 \\le x \\lt 0$ — 1, на $0 \\lt x \\lt 5{,}5$ — 0, на $x \\ge 5{,}5$ — 0).",
    "$0 \\le m \\lt 1$: нет общих точек.",
    "$m = 1$: одна общая точка (на $x \\lt -5{,}5$ — 0, на $-5{,}5 \\le x \\lt 0$ — 0, на $0 \\lt x \\lt 5{,}5$ — 0, на $x \\ge 5{,}5$ — 1).",
    "$m \\gt 1$: 2 общие точки (на $x \\lt -5{,}5$ — 0, на $-5{,}5 \\le x \\lt 0$ — 0, на $0 \\lt x \\lt 5{,}5$ — 1, на $x \\ge 5{,}5$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно одну общую точку при $m = -1$ и $m = 1$."
   ]
  },
  {
   "id": "22.fipi.E0478E",
   "group": "hyper_abs",
   "fipi": "E0478E",
   "text": "Постройте график функции $y = \\dfrac{1}{2}(|\\dfrac{x}{6} - \\dfrac{6}{x}| + \\dfrac{x}{6} + \\dfrac{6}{x})$. Определите, при каких значениях $m$ прямая $y = m$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-1; m=1",
     "tex": "m = -1;\\ m = 1"
    }
   ],
   "answerTex": "$m = -1$; $m = 1$",
   "steps": [
    "Обозначим $a = \\dfrac{x}{6}$, $b = \\dfrac{6}{x}$. Тогда $y = \\dfrac{1}{2}(|a - b| + a + b)$.",
    "Если $a \\ge b$, то $|a - b| = a - b$ и $y = \\dfrac{1}{2}(a - b + a + b) = a$.",
    "Если $a \\lt b$, то $|a - b| = b - a$ и $y = \\dfrac{1}{2}(b - a + a + b) = b$. Значит, $y$ — наибольшее из чисел $a$ и $b$.",
    "Сравним $a$ и $b$: $a - b = \\dfrac{x^2 - 36}{6x}$. Его знак: при $x \\gt 0$ — как у $x^2 - 36$, при $x \\lt 0$ — противоположный. Поэтому $a \\ge b$ при $x \\ge 6$ и при $-6 \\le x \\lt 0$.",
    "При $x \\lt -6$ график — гипербола $y = \\dfrac{6}{x}$.",
    "При $-6 \\le x \\lt 0$ график — прямая $y = \\dfrac{1}{6}x$: с ростом $x$ значения растут.",
    "При $0 \\lt x \\lt 6$ график — гипербола $y = \\dfrac{6}{x}$.",
    "При $x \\ge 6$ график — прямая $y = \\dfrac{1}{6}x$: с ростом $x$ значения растут.",
    "При $x = -6$ функция определена: $y(-6) = -1$, точка $(-6;\\ -1)$ входит в график (оба куска сходятся в ней).",
    "При $x = 0$ функция не определена: график подходит к значению $y = 0$, точка $(0;\\ 0)$ выколота; график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = 6$ функция определена: $y(6) = 1$, точка $(6;\\ 1)$ входит в график (оба куска сходятся в ней).",
    "При $x \\to -\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.E0478E]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -1$: нет общих точек.",
    "$m = -1$: одна общая точка (на $x \\lt -6$ — 0, на $-6 \\le x \\lt 0$ — 1, на $0 \\lt x \\lt 6$ — 0, на $x \\ge 6$ — 0).",
    "$-1 \\lt m \\lt 0$: 2 общие точки (на $x \\lt -6$ — 1, на $-6 \\le x \\lt 0$ — 1, на $0 \\lt x \\lt 6$ — 0, на $x \\ge 6$ — 0).",
    "$0 \\le m \\lt 1$: нет общих точек.",
    "$m = 1$: одна общая точка (на $x \\lt -6$ — 0, на $-6 \\le x \\lt 0$ — 0, на $0 \\lt x \\lt 6$ — 0, на $x \\ge 6$ — 1).",
    "$m \\gt 1$: 2 общие точки (на $x \\lt -6$ — 0, на $-6 \\le x \\lt 0$ — 0, на $0 \\lt x \\lt 6$ — 1, на $x \\ge 6$ — 1).",
    "Прямая $y = m$ имеет с графиком ровно одну общую точку при $m = -1$ и $m = 1$."
   ]
  },
  {
   "id": "22.fipi.D35EB0",
   "group": "frac_abs",
   "fipi": "D35EB0",
   "text": "Постройте график функции $y = \\dfrac{(0{,}5x^{2} + x)⋅|x|}{x + 2}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком ни одной общей точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-2",
     "tex": "m = -2"
    }
   ],
   "answerTex": "$m = -2$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $0{,}5x^{3} + x^{2} = 0{,}5x^{2}(x + 2)$, знаменатель $x + 2$.",
    "Сократим дробь на $(x + 2)$ (это можно при $x \\ne -2$): $y = 0{,}5x^{2}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-0{,}5x^{3} - x^{2} = -0{,}5x^{2}(x + 2)$, знаменатель $x + 2$.",
    "Сократим дробь на $(x + 2)$ (это можно при $x \\ne -2$): $y = -0{,}5x^{2}$.",
    "При $x \\lt 0, x \\ne -2$ график — парабола $y = -0{,}5x^{2}$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ не лежит на этом промежутке: здесь парабола идёт только вверх или только вниз (монотонна), вершину не берём.",
    "При $x \\ge 0$ график — парабола $y = 0{,}5x^{2}$, ветви направлены вверх. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = -2$ функция не определена: график подходит к значению $y = -2$, точка $(-2;\\ -2)$ выколота.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.D35EB0]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -2$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -2$: нет общих точек.",
    "$m \\gt -2$: одна общая точка.",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = -2$."
   ]
  },
  {
   "id": "22.fipi.9600B6",
   "group": "frac_abs",
   "fipi": "9600B6",
   "text": "Постройте график функции $y = \\dfrac{(0{,}75x^{2} + 0{,}75x)⋅|x|}{x + 1}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком ни одной общей точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-0,75",
     "tex": "m = -0{,}75"
    }
   ],
   "answerTex": "$m = -0{,}75$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $0{,}75x^{3} + 0{,}75x^{2} = 0{,}75x^{2}(x + 1)$, знаменатель $x + 1$.",
    "Сократим дробь на $(x + 1)$ (это можно при $x \\ne -1$): $y = 0{,}75x^{2}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-0{,}75x^{3} - 0{,}75x^{2} = -0{,}75x^{2}(x + 1)$, знаменатель $x + 1$.",
    "Сократим дробь на $(x + 1)$ (это можно при $x \\ne -1$): $y = -0{,}75x^{2}$.",
    "При $x \\lt 0, x \\ne -1$ график — парабола $y = -0{,}75x^{2}$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ не лежит на этом промежутке: здесь парабола идёт только вверх или только вниз (монотонна), вершину не берём.",
    "При $x \\ge 0$ график — парабола $y = 0{,}75x^{2}$, ветви направлены вверх. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = -1$ функция не определена: график подходит к значению $y = -0{,}75$, точка $(-1;\\ -0{,}75)$ выколота.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.9600B6]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -0{,}75$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -0{,}75$: нет общих точек.",
    "$m \\gt -0{,}75$: одна общая точка.",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = -0{,}75$."
   ]
  },
  {
   "id": "22.fipi.43A519",
   "group": "frac_abs",
   "fipi": "43A519",
   "text": "Постройте график функции $y = \\dfrac{(0{,}25x^{2} + x)⋅|x|}{x + 4}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком ни одной общей точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-4",
     "tex": "m = -4"
    }
   ],
   "answerTex": "$m = -4$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $0{,}25x^{3} + x^{2} = 0{,}25x^{2}(x + 4)$, знаменатель $x + 4$.",
    "Сократим дробь на $(x + 4)$ (это можно при $x \\ne -4$): $y = 0{,}25x^{2}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-0{,}25x^{3} - x^{2} = -0{,}25x^{2}(x + 4)$, знаменатель $x + 4$.",
    "Сократим дробь на $(x + 4)$ (это можно при $x \\ne -4$): $y = -0{,}25x^{2}$.",
    "При $x \\lt 0, x \\ne -4$ график — парабола $y = -0{,}25x^{2}$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ не лежит на этом промежутке: здесь парабола идёт только вверх или только вниз (монотонна), вершину не берём.",
    "При $x \\ge 0$ график — парабола $y = 0{,}25x^{2}$, ветви направлены вверх. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = -4$ функция не определена: график подходит к значению $y = -4$, точка $(-4;\\ -4)$ выколота.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.43A519]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -4$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -4$: нет общих точек.",
    "$m \\gt -4$: одна общая точка.",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = -4$."
   ]
  },
  {
   "id": "22.fipi.32AB12",
   "group": "frac_abs",
   "fipi": "32AB12",
   "text": "Постройте график функции $y = \\dfrac{(x^{2} + x)⋅|x|}{x + 1}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком ни одной общей точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-1",
     "tex": "m = -1"
    }
   ],
   "answerTex": "$m = -1$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $x^{3} + x^{2} = x^{2}(x + 1)$, знаменатель $x + 1$.",
    "Сократим дробь на $(x + 1)$ (это можно при $x \\ne -1$): $y = x^{2}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-x^{3} - x^{2} = -x^{2}(x + 1)$, знаменатель $x + 1$.",
    "Сократим дробь на $(x + 1)$ (это можно при $x \\ne -1$): $y = -x^{2}$.",
    "При $x \\lt 0, x \\ne -1$ график — парабола $y = -x^{2}$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ не лежит на этом промежутке: здесь парабола идёт только вверх или только вниз (монотонна), вершину не берём.",
    "При $x \\ge 0$ график — парабола $y = x^{2}$, ветви направлены вверх. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = -1$ функция не определена: график подходит к значению $y = -1$, точка $(-1;\\ -1)$ выколота.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.32AB12]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -1$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -1$: нет общих точек.",
    "$m \\gt -1$: одна общая точка.",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = -1$."
   ]
  },
  {
   "id": "22.fipi.AD9AD9",
   "group": "frac_abs",
   "fipi": "AD9AD9",
   "text": "Постройте график функции $y = \\dfrac{(0{,}25x^{2} - 0{,}5x)⋅|x|}{x - 2}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком ни одной общей точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=1",
     "tex": "m = 1"
    }
   ],
   "answerTex": "$m = 1$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $0{,}25x^{3} - 0{,}5x^{2} = 0{,}25(x - 2)x^{2}$, знаменатель $x - 2$.",
    "Сократим дробь на $(x - 2)$ (это можно при $x \\ne 2$): $y = 0{,}25x^{2}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-0{,}25x^{3} + 0{,}5x^{2} = -0{,}25(x - 2)x^{2}$, знаменатель $x - 2$.",
    "Сократим дробь на $(x - 2)$ (это можно при $x \\ne 2$): $y = -0{,}25x^{2}$.",
    "При $x \\lt 0$ график — парабола $y = -0{,}25x^{2}$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ не лежит на этом промежутке: здесь парабола идёт только вверх или только вниз (монотонна), вершину не берём.",
    "При $x \\ge 0, x \\ne 2$ график — парабола $y = 0{,}25x^{2}$, ветви направлены вверх. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "При $x = 2$ функция не определена: график подходит к значению $y = 1$, точка $(2;\\ 1)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.AD9AD9]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 1$: одна общая точка.",
    "$m = 1$: нет общих точек.",
    "$m \\gt 1$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = 1$."
   ]
  },
  {
   "id": "22.fipi.880BD7",
   "group": "frac_abs",
   "fipi": "880BD7",
   "text": "Постройте график функции $y = \\dfrac{(0{,}75x^{2} - 2{,}25x)⋅|x|}{x - 3}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком ни одной общей точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=6,75",
     "tex": "m = 6{,}75"
    }
   ],
   "answerTex": "$m = 6{,}75$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $0{,}75x^{3} - 2{,}25x^{2} = 0{,}75(x - 3)x^{2}$, знаменатель $x - 3$.",
    "Сократим дробь на $(x - 3)$ (это можно при $x \\ne 3$): $y = 0{,}75x^{2}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-0{,}75x^{3} + 2{,}25x^{2} = -0{,}75(x - 3)x^{2}$, знаменатель $x - 3$.",
    "Сократим дробь на $(x - 3)$ (это можно при $x \\ne 3$): $y = -0{,}75x^{2}$.",
    "При $x \\lt 0$ график — парабола $y = -0{,}75x^{2}$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ не лежит на этом промежутке: здесь парабола идёт только вверх или только вниз (монотонна), вершину не берём.",
    "При $x \\ge 0, x \\ne 3$ график — парабола $y = 0{,}75x^{2}$, ветви направлены вверх. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "При $x = 3$ функция не определена: график подходит к значению $y = 6{,}75$, точка $(3;\\ 6{,}75)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.880BD7]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 6{,}75$: одна общая точка.",
    "$m = 6{,}75$: нет общих точек.",
    "$m \\gt 6{,}75$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = 6{,}75$."
   ]
  },
  {
   "id": "22.fipi.A2BECD",
   "group": "frac_abs",
   "fipi": "A2BECD",
   "text": "Постройте график функции $y = \\dfrac{(0{,}75x^{2} - 1{,}5x)⋅|x|}{x - 2}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком ни одной общей точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=3",
     "tex": "m = 3"
    }
   ],
   "answerTex": "$m = 3$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $0{,}75x^{3} - 1{,}5x^{2} = 0{,}75(x - 2)x^{2}$, знаменатель $x - 2$.",
    "Сократим дробь на $(x - 2)$ (это можно при $x \\ne 2$): $y = 0{,}75x^{2}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-0{,}75x^{3} + 1{,}5x^{2} = -0{,}75(x - 2)x^{2}$, знаменатель $x - 2$.",
    "Сократим дробь на $(x - 2)$ (это можно при $x \\ne 2$): $y = -0{,}75x^{2}$.",
    "При $x \\lt 0$ график — парабола $y = -0{,}75x^{2}$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ не лежит на этом промежутке: здесь парабола идёт только вверх или только вниз (монотонна), вершину не берём.",
    "При $x \\ge 0, x \\ne 2$ график — парабола $y = 0{,}75x^{2}$, ветви направлены вверх. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "При $x = 2$ функция не определена: график подходит к значению $y = 3$, точка $(2;\\ 3)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.A2BECD]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 3$: одна общая точка.",
    "$m = 3$: нет общих точек.",
    "$m \\gt 3$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = 3$."
   ]
  },
  {
   "id": "22.fipi.C7E39A",
   "group": "frac_abs",
   "fipi": "C7E39A",
   "text": "Постройте график функции $y = \\dfrac{(0{,}5x^{2} + 0{,}5x)⋅|x|}{x + 1}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком ни одной общей точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-0,5",
     "tex": "m = -0{,}5"
    }
   ],
   "answerTex": "$m = -0{,}5$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $0{,}5x^{3} + 0{,}5x^{2} = 0{,}5x^{2}(x + 1)$, знаменатель $x + 1$.",
    "Сократим дробь на $(x + 1)$ (это можно при $x \\ne -1$): $y = 0{,}5x^{2}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-0{,}5x^{3} - 0{,}5x^{2} = -0{,}5x^{2}(x + 1)$, знаменатель $x + 1$.",
    "Сократим дробь на $(x + 1)$ (это можно при $x \\ne -1$): $y = -0{,}5x^{2}$.",
    "При $x \\lt 0, x \\ne -1$ график — парабола $y = -0{,}5x^{2}$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ не лежит на этом промежутке: здесь парабола идёт только вверх или только вниз (монотонна), вершину не берём.",
    "При $x \\ge 0$ график — парабола $y = 0{,}5x^{2}$, ветви направлены вверх. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = -1$ функция не определена: график подходит к значению $y = -0{,}5$, точка $(-1;\\ -0{,}5)$ выколота.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.C7E39A]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -0{,}5$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -0{,}5$: нет общих точек.",
    "$m \\gt -0{,}5$: одна общая точка.",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = -0{,}5$."
   ]
  },
  {
   "id": "22.fipi.A8A167",
   "group": "frac_abs",
   "fipi": "A8A167",
   "text": "Постройте график функции $y = \\dfrac{(x^{2} - 3x)⋅|x|}{x - 3}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком ни одной общей точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=9",
     "tex": "m = 9"
    }
   ],
   "answerTex": "$m = 9$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $x^{3} - 3x^{2} = (x - 3)x^{2}$, знаменатель $x - 3$.",
    "Сократим дробь на $(x - 3)$ (это можно при $x \\ne 3$): $y = x^{2}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-x^{3} + 3x^{2} = -(x - 3)x^{2}$, знаменатель $x - 3$.",
    "Сократим дробь на $(x - 3)$ (это можно при $x \\ne 3$): $y = -x^{2}$.",
    "При $x \\lt 0$ график — парабола $y = -x^{2}$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ не лежит на этом промежутке: здесь парабола идёт только вверх или только вниз (монотонна), вершину не берём.",
    "При $x \\ge 0, x \\ne 3$ график — парабола $y = x^{2}$, ветви направлены вверх. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "При $x = 3$ функция не определена: график подходит к значению $y = 9$, точка $(3;\\ 9)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.A8A167]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 9$: одна общая точка.",
    "$m = 9$: нет общих точек.",
    "$m \\gt 9$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = 9$."
   ]
  },
  {
   "id": "22.fipi.C6653F",
   "group": "frac_abs",
   "fipi": "C6653F",
   "text": "Постройте график функции $y = \\dfrac{(0{,}5x^{2} - 2x)⋅|x|}{x - 4}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком ни одной общей точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=8",
     "tex": "m = 8"
    }
   ],
   "answerTex": "$m = 8$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $0{,}5x^{3} - 2x^{2} = 0{,}5(x - 4)x^{2}$, знаменатель $x - 4$.",
    "Сократим дробь на $(x - 4)$ (это можно при $x \\ne 4$): $y = 0{,}5x^{2}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-0{,}5x^{3} + 2x^{2} = -0{,}5(x - 4)x^{2}$, знаменатель $x - 4$.",
    "Сократим дробь на $(x - 4)$ (это можно при $x \\ne 4$): $y = -0{,}5x^{2}$.",
    "При $x \\lt 0$ график — парабола $y = -0{,}5x^{2}$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ не лежит на этом промежутке: здесь парабола идёт только вверх или только вниз (монотонна), вершину не берём.",
    "При $x \\ge 0, x \\ne 4$ график — парабола $y = 0{,}5x^{2}$, ветви направлены вверх. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "При $x = 4$ функция не определена: график подходит к значению $y = 8$, точка $(4;\\ 8)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.C6653F]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 8$: одна общая точка.",
    "$m = 8$: нет общих точек.",
    "$m \\gt 8$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = 8$."
   ]
  },
  {
   "id": "22.fipi.2A2D4E",
   "group": "frac_abs",
   "fipi": "2A2D4E",
   "text": "Постройте график функции $y = \\dfrac{(0{,}5x^{2} - 0{,}5x)⋅|x|}{x - 1}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком ни одной общей точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=0,5",
     "tex": "m = 0{,}5"
    }
   ],
   "answerTex": "$m = 0{,}5$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $0{,}5x^{3} - 0{,}5x^{2} = 0{,}5(x - 1)x^{2}$, знаменатель $x - 1$.",
    "Сократим дробь на $(x - 1)$ (это можно при $x \\ne 1$): $y = 0{,}5x^{2}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-0{,}5x^{3} + 0{,}5x^{2} = -0{,}5(x - 1)x^{2}$, знаменатель $x - 1$.",
    "Сократим дробь на $(x - 1)$ (это можно при $x \\ne 1$): $y = -0{,}5x^{2}$.",
    "При $x \\lt 0$ график — парабола $y = -0{,}5x^{2}$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ не лежит на этом промежутке: здесь парабола идёт только вверх или только вниз (монотонна), вершину не берём.",
    "При $x \\ge 0, x \\ne 1$ график — парабола $y = 0{,}5x^{2}$, ветви направлены вверх. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "При $x = 1$ функция не определена: график подходит к значению $y = 0{,}5$, точка $(1;\\ 0{,}5)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.2A2D4E]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0{,}5$: одна общая точка.",
    "$m = 0{,}5$: нет общих точек.",
    "$m \\gt 0{,}5$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = 0{,}5$."
   ]
  },
  {
   "id": "22.fipi.CB85F6",
   "group": "frac_abs",
   "fipi": "CB85F6",
   "text": "Постройте график функции $y = \\dfrac{(0{,}5x^{2} - x)⋅|x|}{x - 2}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком ни одной общей точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=2",
     "tex": "m = 2"
    }
   ],
   "answerTex": "$m = 2$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $0{,}5x^{3} - x^{2} = 0{,}5(x - 2)x^{2}$, знаменатель $x - 2$.",
    "Сократим дробь на $(x - 2)$ (это можно при $x \\ne 2$): $y = 0{,}5x^{2}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-0{,}5x^{3} + x^{2} = -0{,}5(x - 2)x^{2}$, знаменатель $x - 2$.",
    "Сократим дробь на $(x - 2)$ (это можно при $x \\ne 2$): $y = -0{,}5x^{2}$.",
    "При $x \\lt 0$ график — парабола $y = -0{,}5x^{2}$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ не лежит на этом промежутке: здесь парабола идёт только вверх или только вниз (монотонна), вершину не берём.",
    "При $x \\ge 0, x \\ne 2$ график — парабола $y = 0{,}5x^{2}$, ветви направлены вверх. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "При $x = 2$ функция не определена: график подходит к значению $y = 2$, точка $(2;\\ 2)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.CB85F6]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 2$: одна общая точка.",
    "$m = 2$: нет общих точек.",
    "$m \\gt 2$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = 2$."
   ]
  },
  {
   "id": "22.fipi.E993F3",
   "group": "frac_abs",
   "fipi": "E993F3",
   "text": "Постройте график функции $y = \\dfrac{(x^{2} - x)⋅|x|}{x - 1}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком ни одной общей точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=1",
     "tex": "m = 1"
    }
   ],
   "answerTex": "$m = 1$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $x^{3} - x^{2} = (x - 1)x^{2}$, знаменатель $x - 1$.",
    "Сократим дробь на $(x - 1)$ (это можно при $x \\ne 1$): $y = x^{2}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-x^{3} + x^{2} = -(x - 1)x^{2}$, знаменатель $x - 1$.",
    "Сократим дробь на $(x - 1)$ (это можно при $x \\ne 1$): $y = -x^{2}$.",
    "При $x \\lt 0$ график — парабола $y = -x^{2}$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ не лежит на этом промежутке: здесь парабола идёт только вверх или только вниз (монотонна), вершину не берём.",
    "При $x \\ge 0, x \\ne 1$ график — парабола $y = x^{2}$, ветви направлены вверх. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "При $x = 1$ функция не определена: график подходит к значению $y = 1$, точка $(1;\\ 1)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.E993F3]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 1$: одна общая точка.",
    "$m = 1$: нет общих точек.",
    "$m \\gt 1$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = 1$."
   ]
  },
  {
   "id": "22.fipi.625FF0",
   "group": "frac_abs",
   "fipi": "625FF0",
   "text": "Постройте график функции $y = \\dfrac{(0{,}5x^{2} + 2x)⋅|x|}{x + 4}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком ни одной общей точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-8",
     "tex": "m = -8"
    }
   ],
   "answerTex": "$m = -8$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $0{,}5x^{3} + 2x^{2} = 0{,}5x^{2}(x + 4)$, знаменатель $x + 4$.",
    "Сократим дробь на $(x + 4)$ (это можно при $x \\ne -4$): $y = 0{,}5x^{2}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-0{,}5x^{3} - 2x^{2} = -0{,}5x^{2}(x + 4)$, знаменатель $x + 4$.",
    "Сократим дробь на $(x + 4)$ (это можно при $x \\ne -4$): $y = -0{,}5x^{2}$.",
    "При $x \\lt 0, x \\ne -4$ график — парабола $y = -0{,}5x^{2}$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ не лежит на этом промежутке: здесь парабола идёт только вверх или только вниз (монотонна), вершину не берём.",
    "При $x \\ge 0$ график — парабола $y = 0{,}5x^{2}$, ветви направлены вверх. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = -4$ функция не определена: график подходит к значению $y = -8$, точка $(-4;\\ -8)$ выколота.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.625FF0]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -8$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -8$: нет общих точек.",
    "$m \\gt -8$: одна общая точка.",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = -8$."
   ]
  },
  {
   "id": "22.fipi.2C1121",
   "group": "frac_abs",
   "fipi": "2C1121",
   "text": "Постройте график функции $y = \\dfrac{(0{,}75x^{2} + 1{,}5x)⋅|x|}{x + 2}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком ни одной общей точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-3",
     "tex": "m = -3"
    }
   ],
   "answerTex": "$m = -3$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $0{,}75x^{3} + 1{,}5x^{2} = 0{,}75x^{2}(x + 2)$, знаменатель $x + 2$.",
    "Сократим дробь на $(x + 2)$ (это можно при $x \\ne -2$): $y = 0{,}75x^{2}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-0{,}75x^{3} - 1{,}5x^{2} = -0{,}75x^{2}(x + 2)$, знаменатель $x + 2$.",
    "Сократим дробь на $(x + 2)$ (это можно при $x \\ne -2$): $y = -0{,}75x^{2}$.",
    "При $x \\lt 0, x \\ne -2$ график — парабола $y = -0{,}75x^{2}$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ не лежит на этом промежутке: здесь парабола идёт только вверх или только вниз (монотонна), вершину не берём.",
    "При $x \\ge 0$ график — парабола $y = 0{,}75x^{2}$, ветви направлены вверх. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = -2$ функция не определена: график подходит к значению $y = -3$, точка $(-2;\\ -3)$ выколота.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.2C1121]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -3$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -3$: нет общих точек.",
    "$m \\gt -3$: одна общая точка.",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = -3$."
   ]
  },
  {
   "id": "22.fipi.38C1D6",
   "group": "frac_abs",
   "fipi": "38C1D6",
   "text": "Постройте график функции $y = \\dfrac{(0{,}25x^{2} - x)⋅|x|}{x - 4}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком ни одной общей точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=4",
     "tex": "m = 4"
    }
   ],
   "answerTex": "$m = 4$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $0{,}25x^{3} - x^{2} = 0{,}25(x - 4)x^{2}$, знаменатель $x - 4$.",
    "Сократим дробь на $(x - 4)$ (это можно при $x \\ne 4$): $y = 0{,}25x^{2}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-0{,}25x^{3} + x^{2} = -0{,}25(x - 4)x^{2}$, знаменатель $x - 4$.",
    "Сократим дробь на $(x - 4)$ (это можно при $x \\ne 4$): $y = -0{,}25x^{2}$.",
    "При $x \\lt 0$ график — парабола $y = -0{,}25x^{2}$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ не лежит на этом промежутке: здесь парабола идёт только вверх или только вниз (монотонна), вершину не берём.",
    "При $x \\ge 0, x \\ne 4$ график — парабола $y = 0{,}25x^{2}$, ветви направлены вверх. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "При $x = 4$ функция не определена: график подходит к значению $y = 4$, точка $(4;\\ 4)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.38C1D6]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 4$: одна общая точка.",
    "$m = 4$: нет общих точек.",
    "$m \\gt 4$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = 4$."
   ]
  },
  {
   "id": "22.fipi.59A6E0",
   "group": "frac_abs",
   "fipi": "59A6E0",
   "text": "Постройте график функции $y = \\dfrac{(0{,}75x^{2} + 2{,}25x)⋅|x|}{x + 3}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком ни одной общей точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-6,75",
     "tex": "m = -6{,}75"
    }
   ],
   "answerTex": "$m = -6{,}75$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $0{,}75x^{3} + 2{,}25x^{2} = 0{,}75x^{2}(x + 3)$, знаменатель $x + 3$.",
    "Сократим дробь на $(x + 3)$ (это можно при $x \\ne -3$): $y = 0{,}75x^{2}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-0{,}75x^{3} - 2{,}25x^{2} = -0{,}75x^{2}(x + 3)$, знаменатель $x + 3$.",
    "Сократим дробь на $(x + 3)$ (это можно при $x \\ne -3$): $y = -0{,}75x^{2}$.",
    "При $x \\lt 0, x \\ne -3$ график — парабола $y = -0{,}75x^{2}$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ не лежит на этом промежутке: здесь парабола идёт только вверх или только вниз (монотонна), вершину не берём.",
    "При $x \\ge 0$ график — парабола $y = 0{,}75x^{2}$, ветви направлены вверх. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = -3$ функция не определена: график подходит к значению $y = -6{,}75$, точка $(-3;\\ -6{,}75)$ выколота.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.59A6E0]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -6{,}75$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -6{,}75$: нет общих точек.",
    "$m \\gt -6{,}75$: одна общая точка.",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = -6{,}75$."
   ]
  },
  {
   "id": "22.fipi.C415E2",
   "group": "frac_abs",
   "fipi": "C415E2",
   "text": "Постройте график функции $y = \\dfrac{(x^{2} + 3x)⋅|x|}{x + 3}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком ни одной общей точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-9",
     "tex": "m = -9"
    }
   ],
   "answerTex": "$m = -9$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $x^{3} + 3x^{2} = x^{2}(x + 3)$, знаменатель $x + 3$.",
    "Сократим дробь на $(x + 3)$ (это можно при $x \\ne -3$): $y = x^{2}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-x^{3} - 3x^{2} = -x^{2}(x + 3)$, знаменатель $x + 3$.",
    "Сократим дробь на $(x + 3)$ (это можно при $x \\ne -3$): $y = -x^{2}$.",
    "При $x \\lt 0, x \\ne -3$ график — парабола $y = -x^{2}$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ не лежит на этом промежутке: здесь парабола идёт только вверх или только вниз (монотонна), вершину не берём.",
    "При $x \\ge 0$ график — парабола $y = x^{2}$, ветви направлены вверх. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = -3$ функция не определена: график подходит к значению $y = -9$, точка $(-3;\\ -9)$ выколота.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.C415E2]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -9$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -9$: нет общих точек.",
    "$m \\gt -9$: одна общая точка.",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = -9$."
   ]
  },
  {
   "id": "22.fipi.D22637",
   "group": "frac_abs",
   "fipi": "D22637",
   "text": "Постройте график функции $y = \\dfrac{(0{,}25x^{2} + 0{,}5x)⋅|x|}{x + 2}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком ни одной общей точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-1",
     "tex": "m = -1"
    }
   ],
   "answerTex": "$m = -1$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $0{,}25x^{3} + 0{,}5x^{2} = 0{,}25x^{2}(x + 2)$, знаменатель $x + 2$.",
    "Сократим дробь на $(x + 2)$ (это можно при $x \\ne -2$): $y = 0{,}25x^{2}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-0{,}25x^{3} - 0{,}5x^{2} = -0{,}25x^{2}(x + 2)$, знаменатель $x + 2$.",
    "Сократим дробь на $(x + 2)$ (это можно при $x \\ne -2$): $y = -0{,}25x^{2}$.",
    "При $x \\lt 0, x \\ne -2$ график — парабола $y = -0{,}25x^{2}$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ не лежит на этом промежутке: здесь парабола идёт только вверх или только вниз (монотонна), вершину не берём.",
    "При $x \\ge 0$ график — парабола $y = 0{,}25x^{2}$, ветви направлены вверх. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = -2$ функция не определена: график подходит к значению $y = -1$, точка $(-2;\\ -1)$ выколота.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.D22637]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -1$: одна общая точка (на $x \\lt 0$ — 1, на $x \\ge 0$ — 0).",
    "$m = -1$: нет общих точек.",
    "$m \\gt -1$: одна общая точка.",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = -1$."
   ]
  },
  {
   "id": "22.fipi.5A6286",
   "group": "frac_abs",
   "fipi": "5A6286",
   "text": "Постройте график функции $y = \\dfrac{(0{,}75x^{2} - 0{,}75x)⋅|x|}{x - 1}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком ни одной общей точки.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=0,75",
     "tex": "m = 0{,}75"
    }
   ],
   "answerTex": "$m = 0{,}75$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $0{,}75x^{3} - 0{,}75x^{2} = 0{,}75(x - 1)x^{2}$, знаменатель $x - 1$.",
    "Сократим дробь на $(x - 1)$ (это можно при $x \\ne 1$): $y = 0{,}75x^{2}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-0{,}75x^{3} + 0{,}75x^{2} = -0{,}75(x - 1)x^{2}$, знаменатель $x - 1$.",
    "Сократим дробь на $(x - 1)$ (это можно при $x \\ne 1$): $y = -0{,}75x^{2}$.",
    "При $x \\lt 0$ график — парабола $y = -0{,}75x^{2}$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ не лежит на этом промежутке: здесь парабола идёт только вверх или только вниз (монотонна), вершину не берём.",
    "При $x \\ge 0, x \\ne 1$ график — парабола $y = 0{,}75x^{2}$, ветви направлены вверх. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = 0$.",
    "Вершина $(0;\\ 0)$ лежит на этом промежутке и входит в график.",
    "При $x = 0$ функция определена: $y(0) = 0$, точка $(0;\\ 0)$ входит в график (оба куска сходятся в ней).",
    "При $x = 1$ функция не определена: график подходит к значению $y = 0{,}75$, точка $(1;\\ 0{,}75)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.5A6286]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0{,}75$: одна общая точка.",
    "$m = 0{,}75$: нет общих точек.",
    "$m \\gt 0{,}75$: одна общая точка (на $x \\lt 0$ — 0, на $x \\ge 0$ — 1).",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = 0{,}75$."
   ]
  },
  {
   "id": "22.fipi.632946",
   "group": "shift_hyp",
   "fipi": "632946",
   "text": "Постройте график функции $y = - 2 - \\dfrac{x + 4}{x^{2} + 4x}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком общих точек.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-2; m=-1,75",
     "tex": "m = -2;\\ m = -1{,}75"
    }
   ],
   "answerTex": "$m = -2$; $m = -1{,}75$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $-x - 4 = -(x + 4)$, знаменатель $x^{2} + 4x = x(x + 4)$.",
    "Сократим дробь на $(x + 4)$ (это можно при $x \\ne -4$): $y = -2 - \\dfrac{1}{x}$.",
    "При $x \\ne -4, x \\ne 0$ график — гипербола $y = -2 - \\dfrac{1}{x}$.",
    "При $x = -4$ функция не определена: график подходит к значению $y = -1{,}75$, точка $(-4;\\ -1{,}75)$ выколота.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = -2$, но не достигает её: на этой части графика значения $y = -2$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.632946]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -2$: одна общая точка.",
    "$m = -2$: нет общих точек.",
    "$-2 \\lt m \\lt -1{,}75$: одна общая точка.",
    "$m = -1{,}75$: нет общих точек.",
    "$m \\gt -1{,}75$: одна общая точка.",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = -2$ и $m = -1{,}75$."
   ]
  },
  {
   "id": "22.fipi.C69602",
   "group": "shift_hyp",
   "fipi": "C69602",
   "text": "Постройте график функции $y = 3 - \\dfrac{x + 2}{x^{2} + 2x}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком общих точек.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=3; m=3,5",
     "tex": "m = 3;\\ m = 3{,}5"
    }
   ],
   "answerTex": "$m = 3$; $m = 3{,}5$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $-x - 2 = -(x + 2)$, знаменатель $x^{2} + 2x = x(x + 2)$.",
    "Сократим дробь на $(x + 2)$ (это можно при $x \\ne -2$): $y = 3 - \\dfrac{1}{x}$.",
    "При $x \\ne -2, x \\ne 0$ график — гипербола $y = 3 - \\dfrac{1}{x}$.",
    "При $x = -2$ функция не определена: график подходит к значению $y = 3{,}5$, точка $(-2;\\ 3{,}5)$ выколота.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = 3$, но не достигает её: на этой части графика значения $y = 3$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.C69602]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 3$: одна общая точка.",
    "$m = 3$: нет общих точек.",
    "$3 \\lt m \\lt 3{,}5$: одна общая точка.",
    "$m = 3{,}5$: нет общих точек.",
    "$m \\gt 3{,}5$: одна общая точка.",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = 3$ и $m = 3{,}5$."
   ]
  },
  {
   "id": "22.fipi.68EB0C",
   "group": "shift_hyp",
   "fipi": "68EB0C",
   "text": "Постройте график функции $y = 5 - \\dfrac{x + 5}{x^{2} + 5x}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком общих точек.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=5; m=5,2",
     "tex": "m = 5;\\ m = 5{,}2"
    }
   ],
   "answerTex": "$m = 5$; $m = 5{,}2$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $-x - 5 = -(x + 5)$, знаменатель $x^{2} + 5x = x(x + 5)$.",
    "Сократим дробь на $(x + 5)$ (это можно при $x \\ne -5$): $y = 5 - \\dfrac{1}{x}$.",
    "При $x \\ne -5, x \\ne 0$ график — гипербола $y = 5 - \\dfrac{1}{x}$.",
    "При $x = -5$ функция не определена: график подходит к значению $y = 5{,}2$, точка $(-5;\\ 5{,}2)$ выколота.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = 5$, но не достигает её: на этой части графика значения $y = 5$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.68EB0C]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 5$: одна общая точка.",
    "$m = 5$: нет общих точек.",
    "$5 \\lt m \\lt 5{,}2$: одна общая точка.",
    "$m = 5{,}2$: нет общих точек.",
    "$m \\gt 5{,}2$: одна общая точка.",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = 5$ и $m = 5{,}2$."
   ]
  },
  {
   "id": "22.fipi.4CB11B",
   "group": "shift_hyp",
   "fipi": "4CB11B",
   "text": "Постройте график функции $y = - 4 - \\dfrac{x + 1}{x^{2} + x}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком общих точек.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-4; m=-3",
     "tex": "m = -4;\\ m = -3"
    }
   ],
   "answerTex": "$m = -4$; $m = -3$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $-x - 1 = -(x + 1)$, знаменатель $x^{2} + x = x(x + 1)$.",
    "Сократим дробь на $(x + 1)$ (это можно при $x \\ne -1$): $y = -4 - \\dfrac{1}{x}$.",
    "При $x \\ne -1, x \\ne 0$ график — гипербола $y = -4 - \\dfrac{1}{x}$.",
    "При $x = -1$ функция не определена: график подходит к значению $y = -3$, точка $(-1;\\ -3)$ выколота.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = -4$, но не достигает её: на этой части графика значения $y = -4$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.4CB11B]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -4$: одна общая точка.",
    "$m = -4$: нет общих точек.",
    "$-4 \\lt m \\lt -3$: одна общая точка.",
    "$m = -3$: нет общих точек.",
    "$m \\gt -3$: одна общая точка.",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = -4$ и $m = -3$."
   ]
  },
  {
   "id": "22.fipi.396E17",
   "group": "shift_hyp",
   "fipi": "396E17",
   "text": "Постройте график функции $y = - 1 - \\dfrac{x - 4}{x^{2} - 4x}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком общих точек.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-1,25; m=-1",
     "tex": "m = -1{,}25;\\ m = -1"
    }
   ],
   "answerTex": "$m = -1{,}25$; $m = -1$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $-x + 4 = -(x - 4)$, знаменатель $x^{2} - 4x = (x - 4)x$.",
    "Сократим дробь на $(x - 4)$ (это можно при $x \\ne 4$): $y = -1 - \\dfrac{1}{x}$.",
    "При $x \\ne 0, x \\ne 4$ график — гипербола $y = -1 - \\dfrac{1}{x}$.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = 4$ функция не определена: график подходит к значению $y = -1{,}25$, точка $(4;\\ -1{,}25)$ выколота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = -1$, но не достигает её: на этой части графика значения $y = -1$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.396E17]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -1{,}25$: одна общая точка.",
    "$m = -1{,}25$: нет общих точек.",
    "$-1{,}25 \\lt m \\lt -1$: одна общая точка.",
    "$m = -1$: нет общих точек.",
    "$m \\gt -1$: одна общая точка.",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = -1{,}25$ и $m = -1$."
   ]
  },
  {
   "id": "22.fipi.CC5028",
   "group": "shift_hyp",
   "fipi": "CC5028",
   "text": "Постройте график функции $y = 2 - \\dfrac{x - 5}{x^{2} - 5x}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком общих точек.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=1,8; m=2",
     "tex": "m = 1{,}8;\\ m = 2"
    }
   ],
   "answerTex": "$m = 1{,}8$; $m = 2$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $-x + 5 = -(x - 5)$, знаменатель $x^{2} - 5x = (x - 5)x$.",
    "Сократим дробь на $(x - 5)$ (это можно при $x \\ne 5$): $y = 2 - \\dfrac{1}{x}$.",
    "При $x \\ne 0, x \\ne 5$ график — гипербола $y = 2 - \\dfrac{1}{x}$.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = 5$ функция не определена: график подходит к значению $y = 1{,}8$, точка $(5;\\ 1{,}8)$ выколота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = 2$, но не достигает её: на этой части графика значения $y = 2$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.CC5028]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 1{,}8$: одна общая точка.",
    "$m = 1{,}8$: нет общих точек.",
    "$1{,}8 \\lt m \\lt 2$: одна общая точка.",
    "$m = 2$: нет общих точек.",
    "$m \\gt 2$: одна общая точка.",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = 1{,}8$ и $m = 2$."
   ]
  },
  {
   "id": "22.fipi.2029CA",
   "group": "shift_hyp",
   "fipi": "2029CA",
   "text": "Постройте график функции $y = 1 - \\dfrac{x + 5}{x^{2} + 5x}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком общих точек.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=1; m=1,2",
     "tex": "m = 1;\\ m = 1{,}2"
    }
   ],
   "answerTex": "$m = 1$; $m = 1{,}2$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $-x - 5 = -(x + 5)$, знаменатель $x^{2} + 5x = x(x + 5)$.",
    "Сократим дробь на $(x + 5)$ (это можно при $x \\ne -5$): $y = 1 - \\dfrac{1}{x}$.",
    "При $x \\ne -5, x \\ne 0$ график — гипербола $y = 1 - \\dfrac{1}{x}$.",
    "При $x = -5$ функция не определена: график подходит к значению $y = 1{,}2$, точка $(-5;\\ 1{,}2)$ выколота.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = 1$, но не достигает её: на этой части графика значения $y = 1$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.2029CA]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 1$: одна общая точка.",
    "$m = 1$: нет общих точек.",
    "$1 \\lt m \\lt 1{,}2$: одна общая точка.",
    "$m = 1{,}2$: нет общих точек.",
    "$m \\gt 1{,}2$: одна общая точка.",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = 1$ и $m = 1{,}2$."
   ]
  },
  {
   "id": "22.fipi.769468",
   "group": "shift_hyp",
   "fipi": "769468",
   "text": "Постройте график функции $y = - 5 - \\dfrac{x - 1}{x^{2} - x}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком общих точек.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-6; m=-5",
     "tex": "m = -6;\\ m = -5"
    }
   ],
   "answerTex": "$m = -6$; $m = -5$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $-x + 1 = -(x - 1)$, знаменатель $x^{2} - x = (x - 1)x$.",
    "Сократим дробь на $(x - 1)$ (это можно при $x \\ne 1$): $y = -5 - \\dfrac{1}{x}$.",
    "При $x \\ne 0, x \\ne 1$ график — гипербола $y = -5 - \\dfrac{1}{x}$.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = 1$ функция не определена: график подходит к значению $y = -6$, точка $(1;\\ -6)$ выколота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = -5$, но не достигает её: на этой части графика значения $y = -5$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.769468]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -6$: одна общая точка.",
    "$m = -6$: нет общих точек.",
    "$-6 \\lt m \\lt -5$: одна общая точка.",
    "$m = -5$: нет общих точек.",
    "$m \\gt -5$: одна общая точка.",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = -6$ и $m = -5$."
   ]
  },
  {
   "id": "22.fipi.C1266B",
   "group": "shift_hyp",
   "fipi": "C1266B",
   "text": "Постройте график функции $y = - 5 - \\dfrac{x - 2}{x^{2} - 2x}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком общих точек.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=-5,5; m=-5",
     "tex": "m = -5{,}5;\\ m = -5"
    }
   ],
   "answerTex": "$m = -5{,}5$; $m = -5$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $-x + 2 = -(x - 2)$, знаменатель $x^{2} - 2x = (x - 2)x$.",
    "Сократим дробь на $(x - 2)$ (это можно при $x \\ne 2$): $y = -5 - \\dfrac{1}{x}$.",
    "При $x \\ne 0, x \\ne 2$ график — гипербола $y = -5 - \\dfrac{1}{x}$.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = 2$ функция не определена: график подходит к значению $y = -5{,}5$, точка $(2;\\ -5{,}5)$ выколота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = -5$, но не достигает её: на этой части графика значения $y = -5$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.C1266B]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt -5{,}5$: одна общая точка.",
    "$m = -5{,}5$: нет общих точек.",
    "$-5{,}5 \\lt m \\lt -5$: одна общая точка.",
    "$m = -5$: нет общих точек.",
    "$m \\gt -5$: одна общая точка.",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = -5{,}5$ и $m = -5$."
   ]
  },
  {
   "id": "22.fipi.E13E3C",
   "group": "shift_hyp",
   "fipi": "E13E3C",
   "text": "Постройте график функции $y = 3 - \\dfrac{x + 5}{x^{2} + 5x}$. Определите, при каких значениях $m$ прямая $y = m$ не имеет с графиком общих точек.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "m=3; m=3,2",
     "tex": "m = 3;\\ m = 3{,}2"
    }
   ],
   "answerTex": "$m = 3$; $m = 3{,}2$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $-x - 5 = -(x + 5)$, знаменатель $x^{2} + 5x = x(x + 5)$.",
    "Сократим дробь на $(x + 5)$ (это можно при $x \\ne -5$): $y = 3 - \\dfrac{1}{x}$.",
    "При $x \\ne -5, x \\ne 0$ график — гипербола $y = 3 - \\dfrac{1}{x}$.",
    "При $x = -5$ функция не определена: график подходит к значению $y = 3{,}2$, точка $(-5;\\ 3{,}2)$ выколота.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = 3$, но не достигает её: на этой части графика значения $y = 3$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.E13E3C]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 3$: одна общая точка.",
    "$m = 3$: нет общих точек.",
    "$3 \\lt m \\lt 3{,}2$: одна общая точка.",
    "$m = 3{,}2$: нет общих точек.",
    "$m \\gt 3{,}2$: одна общая точка.",
    "Прямая $y = m$ не имеет с графиком ни одной общей точки при $m = 3$ и $m = 3{,}2$."
   ]
  },
  {
   "id": "22.fipi.152E49",
   "group": "k_frac",
   "fipi": "152E49",
   "text": "Постройте график функции $y = \\dfrac{(x^{2} + 6{,}25)(x - 1)}{1 - x}$. Определите, при каких значениях $k$ прямая $y = kx$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=-7,25; k=-5; k=5",
     "tex": "k = -7{,}25;\\ k = -5;\\ k = 5"
    }
   ],
   "answerTex": "$k = -7{,}25$; $k = -5$; $k = 5$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $x^{3} - x^{2} + 6{,}25x - 6{,}25 = (x - 1)(x^{2} + 6{,}25)$, знаменатель $-x + 1 = -(x - 1)$.",
    "Сократим дробь на $(x - 1)$ (это можно при $x \\ne 1$): $y = -x^{2} - 6{,}25$.",
    "При $x \\ne 1$ график — парабола $y = -x^{2} - 6{,}25$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = -6{,}25$.",
    "Вершина $(0;\\ -6{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = 1$ функция не определена: график подходит к значению $y = -7{,}25$, точка $(1;\\ -7{,}25)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.152E49]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\ne 0, x \\ne 1$: $h(x) = - x - \\dfrac{25}{4 x}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\lt -7{,}25$: 2 общие точки.",
    "$k = -7{,}25$: одна общая точка.",
    "$-7{,}25 \\lt k \\lt -5$: 2 общие точки.",
    "$k = -5$: одна общая точка.",
    "$-5 \\lt k \\lt 5$: нет общих точек.",
    "$k = 5$: одна общая точка.",
    "$k \\gt 5$: 2 общие точки.",
    "Прямая $y = kx$ имеет с графиком ровно одну общую точку при $k = -7{,}25$; $k = -5$; $k = 5$."
   ]
  },
  {
   "id": "22.fipi.DF7E4D",
   "group": "k_frac",
   "fipi": "DF7E4D",
   "text": "Постройте график функции $y = \\dfrac{(x^{2} + 1)(x - 2)}{2 - x}$. Определите, при каких значениях $k$ прямая $y = kx$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=-2,5; k=-2; k=2",
     "tex": "k = -2{,}5;\\ k = -2;\\ k = 2"
    }
   ],
   "answerTex": "$k = -2{,}5$; $k = -2$; $k = 2$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $x^{3} - 2x^{2} + x - 2 = (x - 2)(x^{2} + 1)$, знаменатель $-x + 2 = -(x - 2)$.",
    "Сократим дробь на $(x - 2)$ (это можно при $x \\ne 2$): $y = -x^{2} - 1$.",
    "При $x \\ne 2$ график — парабола $y = -x^{2} - 1$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = -1$.",
    "Вершина $(0;\\ -1)$ лежит на этом промежутке и входит в график.",
    "При $x = 2$ функция не определена: график подходит к значению $y = -5$, точка $(2;\\ -5)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.DF7E4D]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\ne 0, x \\ne 2$: $h(x) = - x - \\dfrac{1}{x}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\lt -2{,}5$: 2 общие точки.",
    "$k = -2{,}5$: одна общая точка.",
    "$-2{,}5 \\lt k \\lt -2$: 2 общие точки.",
    "$k = -2$: одна общая точка.",
    "$-2 \\lt k \\lt 2$: нет общих точек.",
    "$k = 2$: одна общая точка.",
    "$k \\gt 2$: 2 общие точки.",
    "Прямая $y = kx$ имеет с графиком ровно одну общую точку при $k = -2{,}5$; $k = -2$; $k = 2$."
   ]
  },
  {
   "id": "22.fipi.EB0FF0",
   "group": "k_frac",
   "fipi": "EB0FF0",
   "text": "Постройте график функции $y = \\dfrac{(x^{2} + 6{,}25)(x + 1)}{-1 - x}$. Определите, при каких значениях $k$ прямая $y = kx$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=-5; k=5; k=7,25",
     "tex": "k = -5;\\ k = 5;\\ k = 7{,}25"
    }
   ],
   "answerTex": "$k = -5$; $k = 5$; $k = 7{,}25$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $x^{3} + x^{2} + 6{,}25x + 6{,}25 = (x + 1)(x^{2} + 6{,}25)$, знаменатель $-x - 1 = -(x + 1)$.",
    "Сократим дробь на $(x + 1)$ (это можно при $x \\ne -1$): $y = -x^{2} - 6{,}25$.",
    "При $x \\ne -1$ график — парабола $y = -x^{2} - 6{,}25$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = -6{,}25$.",
    "Вершина $(0;\\ -6{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = -1$ функция не определена: график подходит к значению $y = -7{,}25$, точка $(-1;\\ -7{,}25)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.EB0FF0]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\ne -1, x \\ne 0$: $h(x) = - x - \\dfrac{25}{4 x}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\lt -5$: 2 общие точки.",
    "$k = -5$: одна общая точка.",
    "$-5 \\lt k \\lt 5$: нет общих точек.",
    "$k = 5$: одна общая точка.",
    "$5 \\lt k \\lt 7{,}25$: 2 общие точки.",
    "$k = 7{,}25$: одна общая точка.",
    "$k \\gt 7{,}25$: 2 общие точки.",
    "Прямая $y = kx$ имеет с графиком ровно одну общую точку при $k = -5$; $k = 5$; $k = 7{,}25$."
   ]
  },
  {
   "id": "22.fipi.6250F0",
   "group": "k_frac",
   "fipi": "6250F0",
   "text": "Постройте график функции $y = \\dfrac{(x^{2} + 4)(x + 1)}{-1 - x}$. Определите, при каких значениях $k$ прямая $y = kx$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=-4; k=4; k=5",
     "tex": "k = -4;\\ k = 4;\\ k = 5"
    }
   ],
   "answerTex": "$k = -4$; $k = 4$; $k = 5$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $x^{3} + x^{2} + 4x + 4 = (x + 1)(x^{2} + 4)$, знаменатель $-x - 1 = -(x + 1)$.",
    "Сократим дробь на $(x + 1)$ (это можно при $x \\ne -1$): $y = -x^{2} - 4$.",
    "При $x \\ne -1$ график — парабола $y = -x^{2} - 4$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = -4$.",
    "Вершина $(0;\\ -4)$ лежит на этом промежутке и входит в график.",
    "При $x = -1$ функция не определена: график подходит к значению $y = -5$, точка $(-1;\\ -5)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.6250F0]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\ne -1, x \\ne 0$: $h(x) = - x - \\dfrac{4}{x}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\lt -4$: 2 общие точки.",
    "$k = -4$: одна общая точка.",
    "$-4 \\lt k \\lt 4$: нет общих точек.",
    "$k = 4$: одна общая точка.",
    "$4 \\lt k \\lt 5$: 2 общие точки.",
    "$k = 5$: одна общая точка.",
    "$k \\gt 5$: 2 общие точки.",
    "Прямая $y = kx$ имеет с графиком ровно одну общую точку при $k = -4$; $k = 4$; $k = 5$."
   ]
  },
  {
   "id": "22.fipi.20CD08",
   "group": "k_frac",
   "fipi": "20CD08",
   "text": "Постройте график функции $y = \\dfrac{7x - 5}{7x^{2} - 5x}$. Определите, при каких значениях $k$ прямая $y = kx$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=1,96",
     "tex": "k = 1{,}96"
    }
   ],
   "answerTex": "$k = 1{,}96$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $7x - 5 = 7(x - \\dfrac{5}{7})$, знаменатель $7x^{2} - 5x = 7(x - \\dfrac{5}{7})x$.",
    "Сократим дробь на $(x - \\dfrac{5}{7})$ (это можно при $x \\ne \\dfrac{5}{7}$): $y = \\dfrac{1}{x}$.",
    "При $x \\ne 0, x \\ne \\dfrac{5}{7}$ график — гипербола $y = \\dfrac{1}{x}$.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = \\dfrac{5}{7}$ функция не определена: график подходит к значению $y = 1{,}4$, точка $(\\dfrac{5}{7};\\ 1{,}4)$ выколота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.20CD08]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\ne 0, x \\ne \\dfrac{5}{7}$: $h(x) = \\dfrac{1}{x^{2}}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\le 0$: нет общих точек.",
    "$0 \\lt k \\lt 1{,}96$: 2 общие точки.",
    "$k = 1{,}96$: одна общая точка.",
    "$k \\gt 1{,}96$: 2 общие точки.",
    "Прямая $y = kx$ имеет с графиком ровно одну общую точку при $k = 1{,}96$."
   ]
  },
  {
   "id": "22.fipi.929B17",
   "group": "k_frac",
   "fipi": "929B17",
   "text": "Постройте график функции $y = \\dfrac{(x^{2} + 0{,}25)(x - 1)}{1 - x}$. Определите, при каких значениях $k$ прямая $y = kx$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=-1,25; k=-1; k=1",
     "tex": "k = -1{,}25;\\ k = -1;\\ k = 1"
    }
   ],
   "answerTex": "$k = -1{,}25$; $k = -1$; $k = 1$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $x^{3} - x^{2} + 0{,}25x - 0{,}25 = (x - 1)(x^{2} + 0{,}25)$, знаменатель $-x + 1 = -(x - 1)$.",
    "Сократим дробь на $(x - 1)$ (это можно при $x \\ne 1$): $y = -x^{2} - 0{,}25$.",
    "При $x \\ne 1$ график — парабола $y = -x^{2} - 0{,}25$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = -0{,}25$.",
    "Вершина $(0;\\ -0{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = 1$ функция не определена: график подходит к значению $y = -1{,}25$, точка $(1;\\ -1{,}25)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.929B17]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\ne 0, x \\ne 1$: $h(x) = - x - \\dfrac{1}{4 x}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\lt -1{,}25$: 2 общие точки.",
    "$k = -1{,}25$: одна общая точка.",
    "$-1{,}25 \\lt k \\lt -1$: 2 общие точки.",
    "$k = -1$: одна общая точка.",
    "$-1 \\lt k \\lt 1$: нет общих точек.",
    "$k = 1$: одна общая точка.",
    "$k \\gt 1$: 2 общие точки.",
    "Прямая $y = kx$ имеет с графиком ровно одну общую точку при $k = -1{,}25$; $k = -1$; $k = 1$."
   ]
  },
  {
   "id": "22.fipi.70822B",
   "group": "k_frac",
   "fipi": "70822B",
   "text": "Постройте график функции $y = \\dfrac{x - 3}{x^{2} - 3x}$. Определите, при каких значениях $k$ прямая $y = kx$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=1/9",
     "tex": "k = \\dfrac{1}{9}"
    }
   ],
   "answerTex": "$k = \\dfrac{1}{9}$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $x - 3$, знаменатель $x^{2} - 3x = (x - 3)x$.",
    "Сократим дробь на $(x - 3)$ (это можно при $x \\ne 3$): $y = \\dfrac{1}{x}$.",
    "При $x \\ne 0, x \\ne 3$ график — гипербола $y = \\dfrac{1}{x}$.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = 3$ функция не определена: график подходит к значению $y = \\dfrac{1}{3}$, точка $(3;\\ \\dfrac{1}{3})$ выколота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.70822B]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\ne 0, x \\ne 3$: $h(x) = \\dfrac{1}{x^{2}}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\le 0$: нет общих точек.",
    "$0 \\lt k \\lt \\dfrac{1}{9}$: 2 общие точки.",
    "$k = \\dfrac{1}{9}$: одна общая точка.",
    "$k \\gt \\dfrac{1}{9}$: 2 общие точки.",
    "Прямая $y = kx$ имеет с графиком ровно одну общую точку при $k = \\dfrac{1}{9}$."
   ]
  },
  {
   "id": "22.fipi.DE232E",
   "group": "k_frac",
   "fipi": "DE232E",
   "text": "Постройте график функции $y = \\dfrac{7x - 10}{7x^{2} - 10x}$. Определите, при каких значениях $k$ прямая $y = kx$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=0,49",
     "tex": "k = 0{,}49"
    }
   ],
   "answerTex": "$k = 0{,}49$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $7x - 10 = 7(x - \\dfrac{10}{7})$, знаменатель $7x^{2} - 10x = 7(x - \\dfrac{10}{7})x$.",
    "Сократим дробь на $(x - \\dfrac{10}{7})$ (это можно при $x \\ne \\dfrac{10}{7}$): $y = \\dfrac{1}{x}$.",
    "При $x \\ne 0, x \\ne \\dfrac{10}{7}$ график — гипербола $y = \\dfrac{1}{x}$.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = \\dfrac{10}{7}$ функция не определена: график подходит к значению $y = 0{,}7$, точка $(\\dfrac{10}{7};\\ 0{,}7)$ выколота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.DE232E]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\ne 0, x \\ne \\dfrac{10}{7}$: $h(x) = \\dfrac{1}{x^{2}}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\le 0$: нет общих точек.",
    "$0 \\lt k \\lt 0{,}49$: 2 общие точки.",
    "$k = 0{,}49$: одна общая точка.",
    "$k \\gt 0{,}49$: 2 общие точки.",
    "Прямая $y = kx$ имеет с графиком ровно одну общую точку при $k = 0{,}49$."
   ]
  },
  {
   "id": "22.fipi.90DE2C",
   "group": "k_frac",
   "fipi": "90DE2C",
   "text": "Постройте график функции $y = \\dfrac{5x - 8}{5x^{2} - 8x}$. Определите, при каких значениях $k$ прямая $y = kx$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=0,390625",
     "tex": "k = 0{,}390625"
    }
   ],
   "answerTex": "$k = 0{,}390625$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $5x - 8 = 5(x - 1{,}6)$, знаменатель $5x^{2} - 8x = 5(x - 1{,}6)x$.",
    "Сократим дробь на $(x - 1{,}6)$ (это можно при $x \\ne 1{,}6$): $y = \\dfrac{1}{x}$.",
    "При $x \\ne 0, x \\ne 1{,}6$ график — гипербола $y = \\dfrac{1}{x}$.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = 1{,}6$ функция не определена: график подходит к значению $y = 0{,}625$, точка $(1{,}6;\\ 0{,}625)$ выколота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.90DE2C]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\ne 0, x \\ne 1{,}6$: $h(x) = \\dfrac{1}{x^{2}}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\le 0$: нет общих точек.",
    "$0 \\lt k \\lt 0{,}390625$: 2 общие точки.",
    "$k = 0{,}390625$: одна общая точка.",
    "$k \\gt 0{,}390625$: 2 общие точки.",
    "Прямая $y = kx$ имеет с графиком ровно одну общую точку при $k = 0{,}390625$."
   ]
  },
  {
   "id": "22.fipi.DA94D8",
   "group": "k_frac",
   "fipi": "DA94D8",
   "text": "Постройте график функции $y = \\dfrac{3x + 5}{3x^{2} + 5x}$. Определите, при каких значениях $k$ прямая $y = kx$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=0,36",
     "tex": "k = 0{,}36"
    }
   ],
   "answerTex": "$k = 0{,}36$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $3x + 5 = 3(x + \\dfrac{5}{3})$, знаменатель $3x^{2} + 5x = 3x(x + \\dfrac{5}{3})$.",
    "Сократим дробь на $(x + \\dfrac{5}{3})$ (это можно при $x \\ne -\\dfrac{5}{3}$): $y = \\dfrac{1}{x}$.",
    "При $x \\ne -\\dfrac{5}{3}, x \\ne 0$ график — гипербола $y = \\dfrac{1}{x}$.",
    "При $x = -\\dfrac{5}{3}$ функция не определена: график подходит к значению $y = -0{,}6$, точка $(-\\dfrac{5}{3};\\ -0{,}6)$ выколота.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.DA94D8]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\ne -\\dfrac{5}{3}, x \\ne 0$: $h(x) = \\dfrac{1}{x^{2}}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\le 0$: нет общих точек.",
    "$0 \\lt k \\lt 0{,}36$: 2 общие точки.",
    "$k = 0{,}36$: одна общая точка.",
    "$k \\gt 0{,}36$: 2 общие точки.",
    "Прямая $y = kx$ имеет с графиком ровно одну общую точку при $k = 0{,}36$."
   ]
  },
  {
   "id": "22.fipi.942ADF",
   "group": "k_frac",
   "fipi": "942ADF",
   "text": "Постройте график функции $y = \\dfrac{(x^{2} + 4)(x - 1)}{1 - x}$. Определите, при каких значениях $k$ прямая $y = kx$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=-5; k=-4; k=4",
     "tex": "k = -5;\\ k = -4;\\ k = 4"
    }
   ],
   "answerTex": "$k = -5$; $k = -4$; $k = 4$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $x^{3} - x^{2} + 4x - 4 = (x - 1)(x^{2} + 4)$, знаменатель $-x + 1 = -(x - 1)$.",
    "Сократим дробь на $(x - 1)$ (это можно при $x \\ne 1$): $y = -x^{2} - 4$.",
    "При $x \\ne 1$ график — парабола $y = -x^{2} - 4$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = -4$.",
    "Вершина $(0;\\ -4)$ лежит на этом промежутке и входит в график.",
    "При $x = 1$ функция не определена: график подходит к значению $y = -5$, точка $(1;\\ -5)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.942ADF]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\ne 0, x \\ne 1$: $h(x) = - x - \\dfrac{4}{x}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\lt -5$: 2 общие точки.",
    "$k = -5$: одна общая точка.",
    "$-5 \\lt k \\lt -4$: 2 общие точки.",
    "$k = -4$: одна общая точка.",
    "$-4 \\lt k \\lt 4$: нет общих точек.",
    "$k = 4$: одна общая точка.",
    "$k \\gt 4$: 2 общие точки.",
    "Прямая $y = kx$ имеет с графиком ровно одну общую точку при $k = -5$; $k = -4$; $k = 4$."
   ]
  },
  {
   "id": "22.fipi.8E25DC",
   "group": "k_frac",
   "fipi": "8E25DC",
   "text": "Постройте график функции $y = \\dfrac{2x + 5}{2x^{2} + 5x}$. Определите, при каких значениях $k$ прямая $y = kx$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=0,16",
     "tex": "k = 0{,}16"
    }
   ],
   "answerTex": "$k = 0{,}16$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $2x + 5 = 2(x + 2{,}5)$, знаменатель $2x^{2} + 5x = 2x(x + 2{,}5)$.",
    "Сократим дробь на $(x + 2{,}5)$ (это можно при $x \\ne -2{,}5$): $y = \\dfrac{1}{x}$.",
    "При $x \\ne -2{,}5, x \\ne 0$ график — гипербола $y = \\dfrac{1}{x}$.",
    "При $x = -2{,}5$ функция не определена: график подходит к значению $y = -0{,}4$, точка $(-2{,}5;\\ -0{,}4)$ выколота.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.8E25DC]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\ne -2{,}5, x \\ne 0$: $h(x) = \\dfrac{1}{x^{2}}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\le 0$: нет общих точек.",
    "$0 \\lt k \\lt 0{,}16$: 2 общие точки.",
    "$k = 0{,}16$: одна общая точка.",
    "$k \\gt 0{,}16$: 2 общие точки.",
    "Прямая $y = kx$ имеет с графиком ровно одну общую точку при $k = 0{,}16$."
   ]
  },
  {
   "id": "22.fipi.E4E1A2",
   "group": "k_frac",
   "fipi": "E4E1A2",
   "text": "Постройте график функции $y = \\dfrac{(x^{2} + 0{,}25)(x + 1)}{-1 - x}$. Определите, при каких значениях $k$ прямая $y = kx$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=-1; k=1; k=1,25",
     "tex": "k = -1;\\ k = 1;\\ k = 1{,}25"
    }
   ],
   "answerTex": "$k = -1$; $k = 1$; $k = 1{,}25$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $x^{3} + x^{2} + 0{,}25x + 0{,}25 = (x + 1)(x^{2} + 0{,}25)$, знаменатель $-x - 1 = -(x + 1)$.",
    "Сократим дробь на $(x + 1)$ (это можно при $x \\ne -1$): $y = -x^{2} - 0{,}25$.",
    "При $x \\ne -1$ график — парабола $y = -x^{2} - 0{,}25$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = -0{,}25$.",
    "Вершина $(0;\\ -0{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = -1$ функция не определена: график подходит к значению $y = -1{,}25$, точка $(-1;\\ -1{,}25)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.E4E1A2]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\ne -1, x \\ne 0$: $h(x) = - x - \\dfrac{1}{4 x}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\lt -1$: 2 общие точки.",
    "$k = -1$: одна общая точка.",
    "$-1 \\lt k \\lt 1$: нет общих точек.",
    "$k = 1$: одна общая точка.",
    "$1 \\lt k \\lt 1{,}25$: 2 общие точки.",
    "$k = 1{,}25$: одна общая точка.",
    "$k \\gt 1{,}25$: 2 общие точки.",
    "Прямая $y = kx$ имеет с графиком ровно одну общую точку при $k = -1$; $k = 1$; $k = 1{,}25$."
   ]
  },
  {
   "id": "22.fipi.2939C4",
   "group": "k_frac",
   "fipi": "2939C4",
   "text": "Постройте график функции $y = \\dfrac{4x - 5}{4x^{2} - 5x}$. Определите, при каких значениях $k$ прямая $y = kx$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=0,64",
     "tex": "k = 0{,}64"
    }
   ],
   "answerTex": "$k = 0{,}64$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $4x - 5 = 4(x - 1{,}25)$, знаменатель $4x^{2} - 5x = 4(x - 1{,}25)x$.",
    "Сократим дробь на $(x - 1{,}25)$ (это можно при $x \\ne 1{,}25$): $y = \\dfrac{1}{x}$.",
    "При $x \\ne 0, x \\ne 1{,}25$ график — гипербола $y = \\dfrac{1}{x}$.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = 1{,}25$ функция не определена: график подходит к значению $y = 0{,}8$, точка $(1{,}25;\\ 0{,}8)$ выколота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.2939C4]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\ne 0, x \\ne 1{,}25$: $h(x) = \\dfrac{1}{x^{2}}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\le 0$: нет общих точек.",
    "$0 \\lt k \\lt 0{,}64$: 2 общие точки.",
    "$k = 0{,}64$: одна общая точка.",
    "$k \\gt 0{,}64$: 2 общие точки.",
    "Прямая $y = kx$ имеет с графиком ровно одну общую точку при $k = 0{,}64$."
   ]
  },
  {
   "id": "22.fipi.DC01C3",
   "group": "k_frac",
   "fipi": "DC01C3",
   "text": "Постройте график функции $y = \\dfrac{6x + 7}{6x^{2} + 7x}$. Определите, при каких значениях $k$ прямая $y = kx$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=36/49",
     "tex": "k = \\dfrac{36}{49}"
    }
   ],
   "answerTex": "$k = \\dfrac{36}{49}$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $6x + 7 = 6(x + \\dfrac{7}{6})$, знаменатель $6x^{2} + 7x = 6x(x + \\dfrac{7}{6})$.",
    "Сократим дробь на $(x + \\dfrac{7}{6})$ (это можно при $x \\ne -\\dfrac{7}{6}$): $y = \\dfrac{1}{x}$.",
    "При $x \\ne -\\dfrac{7}{6}, x \\ne 0$ график — гипербола $y = \\dfrac{1}{x}$.",
    "При $x = -\\dfrac{7}{6}$ функция не определена: график подходит к значению $y = -\\dfrac{6}{7}$, точка $(-\\dfrac{7}{6};\\ -\\dfrac{6}{7})$ выколота.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.DC01C3]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\ne -\\dfrac{7}{6}, x \\ne 0$: $h(x) = \\dfrac{1}{x^{2}}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\le 0$: нет общих точек.",
    "$0 \\lt k \\lt \\dfrac{36}{49}$: 2 общие точки.",
    "$k = \\dfrac{36}{49}$: одна общая точка.",
    "$k \\gt \\dfrac{36}{49}$: 2 общие точки.",
    "Прямая $y = kx$ имеет с графиком ровно одну общую точку при $k = \\dfrac{36}{49}$."
   ]
  },
  {
   "id": "22.fipi.F8D6E6",
   "group": "k_frac",
   "fipi": "F8D6E6",
   "text": "Постройте график функции $y = \\dfrac{(x^{2} + 2{,}25)(x - 1)}{1 - x}$. Определите, при каких значениях $k$ прямая $y = kx$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=-3,25; k=-3; k=3",
     "tex": "k = -3{,}25;\\ k = -3;\\ k = 3"
    }
   ],
   "answerTex": "$k = -3{,}25$; $k = -3$; $k = 3$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $x^{3} - x^{2} + 2{,}25x - 2{,}25 = (x - 1)(x^{2} + 2{,}25)$, знаменатель $-x + 1 = -(x - 1)$.",
    "Сократим дробь на $(x - 1)$ (это можно при $x \\ne 1$): $y = -x^{2} - 2{,}25$.",
    "При $x \\ne 1$ график — парабола $y = -x^{2} - 2{,}25$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = -2{,}25$.",
    "Вершина $(0;\\ -2{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = 1$ функция не определена: график подходит к значению $y = -3{,}25$, точка $(1;\\ -3{,}25)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.F8D6E6]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\ne 0, x \\ne 1$: $h(x) = - x - \\dfrac{9}{4 x}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\lt -3{,}25$: 2 общие точки.",
    "$k = -3{,}25$: одна общая точка.",
    "$-3{,}25 \\lt k \\lt -3$: 2 общие точки.",
    "$k = -3$: одна общая точка.",
    "$-3 \\lt k \\lt 3$: нет общих точек.",
    "$k = 3$: одна общая точка.",
    "$k \\gt 3$: 2 общие точки.",
    "Прямая $y = kx$ имеет с графиком ровно одну общую точку при $k = -3{,}25$; $k = -3$; $k = 3$."
   ]
  },
  {
   "id": "22.fipi.B0AF6B",
   "group": "k_frac",
   "fipi": "B0AF6B",
   "text": "Постройте график функции $y = \\dfrac{(x^{2} + 2{,}25)(x + 1)}{-1 - x}$. Определите, при каких значениях $k$ прямая $y = kx$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=-3; k=3; k=3,25",
     "tex": "k = -3;\\ k = 3;\\ k = 3{,}25"
    }
   ],
   "answerTex": "$k = -3$; $k = 3$; $k = 3{,}25$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $x^{3} + x^{2} + 2{,}25x + 2{,}25 = (x + 1)(x^{2} + 2{,}25)$, знаменатель $-x - 1 = -(x + 1)$.",
    "Сократим дробь на $(x + 1)$ (это можно при $x \\ne -1$): $y = -x^{2} - 2{,}25$.",
    "При $x \\ne -1$ график — парабола $y = -x^{2} - 2{,}25$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = -2{,}25$.",
    "Вершина $(0;\\ -2{,}25)$ лежит на этом промежутке и входит в график.",
    "При $x = -1$ функция не определена: график подходит к значению $y = -3{,}25$, точка $(-1;\\ -3{,}25)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.B0AF6B]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\ne -1, x \\ne 0$: $h(x) = - x - \\dfrac{9}{4 x}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\lt -3$: 2 общие точки.",
    "$k = -3$: одна общая точка.",
    "$-3 \\lt k \\lt 3$: нет общих точек.",
    "$k = 3$: одна общая точка.",
    "$3 \\lt k \\lt 3{,}25$: 2 общие точки.",
    "$k = 3{,}25$: одна общая точка.",
    "$k \\gt 3{,}25$: 2 общие точки.",
    "Прямая $y = kx$ имеет с графиком ровно одну общую точку при $k = -3$; $k = 3$; $k = 3{,}25$."
   ]
  },
  {
   "id": "22.fipi.7FE635",
   "group": "k_frac",
   "fipi": "7FE635",
   "text": "Постройте график функции $y = \\dfrac{(x^{2} + 1)(x + 2)}{-2 - x}$. Определите, при каких значениях $k$ прямая $y = kx$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=-2; k=2; k=2,5",
     "tex": "k = -2;\\ k = 2;\\ k = 2{,}5"
    }
   ],
   "answerTex": "$k = -2$; $k = 2$; $k = 2{,}5$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $x^{3} + 2x^{2} + x + 2 = (x + 2)(x^{2} + 1)$, знаменатель $-x - 2 = -(x + 2)$.",
    "Сократим дробь на $(x + 2)$ (это можно при $x \\ne -2$): $y = -x^{2} - 1$.",
    "При $x \\ne -2$ график — парабола $y = -x^{2} - 1$, ветви направлены вниз. Слагаемого с $x$ нет, поэтому вершина на оси $Oy$: $x_0 = 0$, $y_0 = -1$.",
    "Вершина $(0;\\ -1)$ лежит на этом промежутке и входит в график.",
    "При $x = -2$ функция не определена: график подходит к значению $y = -5$, точка $(-2;\\ -5)$ выколота.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.7FE635]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\ne -2, x \\ne 0$: $h(x) = - x - \\dfrac{1}{x}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\lt -2$: 2 общие точки.",
    "$k = -2$: одна общая точка.",
    "$-2 \\lt k \\lt 2$: нет общих точек.",
    "$k = 2$: одна общая точка.",
    "$2 \\lt k \\lt 2{,}5$: 2 общие точки.",
    "$k = 2{,}5$: одна общая точка.",
    "$k \\gt 2{,}5$: 2 общие точки.",
    "Прямая $y = kx$ имеет с графиком ровно одну общую точку при $k = -2$; $k = 2$; $k = 2{,}5$."
   ]
  },
  {
   "id": "22.fipi.E34C3B",
   "group": "k_frac",
   "fipi": "E34C3B",
   "text": "Постройте график функции $y = \\dfrac{9x + 1}{9x^{2} + x}$. Определите, при каких значениях $k$ прямая $y = kx$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=81",
     "tex": "k = 81"
    }
   ],
   "answerTex": "$k = 81$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $9x + 1 = 9(x + \\dfrac{1}{9})$, знаменатель $9x^{2} + x = 9x(x + \\dfrac{1}{9})$.",
    "Сократим дробь на $(x + \\dfrac{1}{9})$ (это можно при $x \\ne -\\dfrac{1}{9}$): $y = \\dfrac{1}{x}$.",
    "При $x \\ne -\\dfrac{1}{9}, x \\ne 0$ график — гипербола $y = \\dfrac{1}{x}$.",
    "При $x = -\\dfrac{1}{9}$ функция не определена: график подходит к значению $y = -9$, точка $(-\\dfrac{1}{9};\\ -9)$ выколота.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.E34C3B]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\ne -\\dfrac{1}{9}, x \\ne 0$: $h(x) = \\dfrac{1}{x^{2}}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\le 0$: нет общих точек.",
    "$0 \\lt k \\lt 81$: 2 общие точки.",
    "$k = 81$: одна общая точка.",
    "$k \\gt 81$: 2 общие точки.",
    "Прямая $y = kx$ имеет с графиком ровно одну общую точку при $k = 81$."
   ]
  },
  {
   "id": "22.fipi.24E78D",
   "group": "k_frac",
   "fipi": "24E78D",
   "text": "Постройте график функции $y = \\dfrac{7x - 6}{7x^{2} - 6x}$. Определите, при каких значениях $k$ прямая $y = kx$ имеет с графиком ровно одну общую точку.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=49/36",
     "tex": "k = \\dfrac{49}{36}"
    }
   ],
   "answerTex": "$k = \\dfrac{49}{36}$",
   "steps": [
    "Разложим на множители числитель и знаменатель: числитель $7x - 6 = 7(x - \\dfrac{6}{7})$, знаменатель $7x^{2} - 6x = 7(x - \\dfrac{6}{7})x$.",
    "Сократим дробь на $(x - \\dfrac{6}{7})$ (это можно при $x \\ne \\dfrac{6}{7}$): $y = \\dfrac{1}{x}$.",
    "При $x \\ne 0, x \\ne \\dfrac{6}{7}$ график — гипербола $y = \\dfrac{1}{x}$.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = \\dfrac{6}{7}$ функция не определена: график подходит к значению $y = \\dfrac{7}{6}$, точка $(\\dfrac{6}{7};\\ \\dfrac{7}{6})$ выколота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.24E78D]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\ne 0, x \\ne \\dfrac{6}{7}$: $h(x) = \\dfrac{1}{x^{2}}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\le 0$: нет общих точек.",
    "$0 \\lt k \\lt \\dfrac{49}{36}$: 2 общие точки.",
    "$k = \\dfrac{49}{36}$: одна общая точка.",
    "$k \\gt \\dfrac{49}{36}$: 2 общие точки.",
    "Прямая $y = kx$ имеет с графиком ровно одну общую точку при $k = \\dfrac{49}{36}$."
   ]
  },
  {
   "id": "22.fipi.772C4F",
   "group": "k_abs_frac",
   "fipi": "772C4F",
   "text": "Постройте график функции $y = \\dfrac{2{,}5|x| - 1}{|x| - 2{,}5x^{2}}$. Определите, при каких значениях $k$ прямая $y = kx$ не имеет с графиком общих точек.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=-6,25; k=0; k=6,25",
     "tex": "k = -6{,}25;\\ k = 0;\\ k = 6{,}25"
    }
   ],
   "answerTex": "$k = -6{,}25$; $k = 0$; $k = 6{,}25$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $2{,}5x - 1 = 2{,}5(x - 0{,}4)$, знаменатель $-2{,}5x^{2} + x = -2{,}5(x - 0{,}4)x$.",
    "Сократим дробь на $(x - 0{,}4)$ (это можно при $x \\ne 0{,}4$): $y = - \\dfrac{1}{x}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-2{,}5x - 1 = -2{,}5(x + 0{,}4)$, знаменатель $-2{,}5x^{2} - x = -2{,}5x(x + 0{,}4)$.",
    "Сократим дробь на $(x + 0{,}4)$ (это можно при $x \\ne -0{,}4$): $y = \\dfrac{1}{x}$.",
    "При $x \\lt 0, x \\ne -0{,}4$ график — гипербола $y = \\dfrac{1}{x}$.",
    "При $x \\gt 0, x \\ne 0{,}4$ график — гипербола $y = - \\dfrac{1}{x}$.",
    "При $x = -0{,}4$ функция не определена: график подходит к значению $y = -2{,}5$, точка $(-0{,}4;\\ -2{,}5)$ выколота.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = 0{,}4$ функция не определена: график подходит к значению $y = -2{,}5$, точка $(0{,}4;\\ -2{,}5)$ выколота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.772C4F]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\lt 0, x \\ne -0{,}4$: $h(x) = \\dfrac{1}{x^{2}}$.",
    "при $x \\gt 0, x \\ne 0{,}4$: $h(x) = - \\dfrac{1}{x^{2}}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\lt -6{,}25$: одна общая точка (на $x \\lt 0$ — 0, на $x \\gt 0$ — 1).",
    "$k = -6{,}25$: нет общих точек.",
    "$-6{,}25 \\lt k \\lt 0$: одна общая точка (на $x \\lt 0$ — 0, на $x \\gt 0$ — 1).",
    "$k = 0$: нет общих точек.",
    "$0 \\lt k \\lt 6{,}25$: одна общая точка (на $x \\lt 0$ — 1, на $x \\gt 0$ — 0).",
    "$k = 6{,}25$: нет общих точек.",
    "$k \\gt 6{,}25$: одна общая точка (на $x \\lt 0$ — 1, на $x \\gt 0$ — 0).",
    "Прямая $y = kx$ не имеет с графиком ни одной общей точки при $k = -6{,}25$; $k = 0$; $k = 6{,}25$."
   ]
  },
  {
   "id": "22.fipi.AB4DF3",
   "group": "k_abs_frac",
   "fipi": "AB4DF3",
   "text": "Постройте график функции $y = \\dfrac{2|x| - 1}{|x| - 2x^{2}}$. Определите, при каких значениях $k$ прямая $y = kx$ не имеет с графиком общих точек.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=-4; k=0; k=4",
     "tex": "k = -4;\\ k = 0;\\ k = 4"
    }
   ],
   "answerTex": "$k = -4$; $k = 0$; $k = 4$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $2x - 1 = 2(x - 0{,}5)$, знаменатель $-2x^{2} + x = -2(x - 0{,}5)x$.",
    "Сократим дробь на $(x - 0{,}5)$ (это можно при $x \\ne 0{,}5$): $y = - \\dfrac{1}{x}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-2x - 1 = -2(x + 0{,}5)$, знаменатель $-2x^{2} - x = -2x(x + 0{,}5)$.",
    "Сократим дробь на $(x + 0{,}5)$ (это можно при $x \\ne -0{,}5$): $y = \\dfrac{1}{x}$.",
    "При $x \\lt 0, x \\ne -0{,}5$ график — гипербола $y = \\dfrac{1}{x}$.",
    "При $x \\gt 0, x \\ne 0{,}5$ график — гипербола $y = - \\dfrac{1}{x}$.",
    "При $x = -0{,}5$ функция не определена: график подходит к значению $y = -2$, точка $(-0{,}5;\\ -2)$ выколота.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = 0{,}5$ функция не определена: график подходит к значению $y = -2$, точка $(0{,}5;\\ -2)$ выколота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.AB4DF3]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\lt 0, x \\ne -0{,}5$: $h(x) = \\dfrac{1}{x^{2}}$.",
    "при $x \\gt 0, x \\ne 0{,}5$: $h(x) = - \\dfrac{1}{x^{2}}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\lt -4$: одна общая точка (на $x \\lt 0$ — 0, на $x \\gt 0$ — 1).",
    "$k = -4$: нет общих точек.",
    "$-4 \\lt k \\lt 0$: одна общая точка (на $x \\lt 0$ — 0, на $x \\gt 0$ — 1).",
    "$k = 0$: нет общих точек.",
    "$0 \\lt k \\lt 4$: одна общая точка (на $x \\lt 0$ — 1, на $x \\gt 0$ — 0).",
    "$k = 4$: нет общих точек.",
    "$k \\gt 4$: одна общая точка (на $x \\lt 0$ — 1, на $x \\gt 0$ — 0).",
    "Прямая $y = kx$ не имеет с графиком ни одной общей точки при $k = -4$; $k = 0$; $k = 4$."
   ]
  },
  {
   "id": "22.fipi.768602",
   "group": "k_abs_frac",
   "fipi": "768602",
   "text": "Постройте график функции $y = \\dfrac{|x| - 1}{|x| - x^{2}}$. Определите, при каких значениях $k$ прямая $y = kx$ не имеет с графиком общих точек.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=-1; k=0; k=1",
     "tex": "k = -1;\\ k = 0;\\ k = 1"
    }
   ],
   "answerTex": "$k = -1$; $k = 0$; $k = 1$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $x - 1$, знаменатель $-x^{2} + x = -(x - 1)x$.",
    "Сократим дробь на $(x - 1)$ (это можно при $x \\ne 1$): $y = - \\dfrac{1}{x}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-x - 1 = -(x + 1)$, знаменатель $-x^{2} - x = -x(x + 1)$.",
    "Сократим дробь на $(x + 1)$ (это можно при $x \\ne -1$): $y = \\dfrac{1}{x}$.",
    "При $x \\lt 0, x \\ne -1$ график — гипербола $y = \\dfrac{1}{x}$.",
    "При $x \\gt 0, x \\ne 1$ график — гипербола $y = - \\dfrac{1}{x}$.",
    "При $x = -1$ функция не определена: график подходит к значению $y = -1$, точка $(-1;\\ -1)$ выколота.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = 1$ функция не определена: график подходит к значению $y = -1$, точка $(1;\\ -1)$ выколота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.768602]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\lt 0, x \\ne -1$: $h(x) = \\dfrac{1}{x^{2}}$.",
    "при $x \\gt 0, x \\ne 1$: $h(x) = - \\dfrac{1}{x^{2}}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\lt -1$: одна общая точка (на $x \\lt 0$ — 0, на $x \\gt 0$ — 1).",
    "$k = -1$: нет общих точек.",
    "$-1 \\lt k \\lt 0$: одна общая точка (на $x \\lt 0$ — 0, на $x \\gt 0$ — 1).",
    "$k = 0$: нет общих точек.",
    "$0 \\lt k \\lt 1$: одна общая точка (на $x \\lt 0$ — 1, на $x \\gt 0$ — 0).",
    "$k = 1$: нет общих точек.",
    "$k \\gt 1$: одна общая точка (на $x \\lt 0$ — 1, на $x \\gt 0$ — 0).",
    "Прямая $y = kx$ не имеет с графиком ни одной общей точки при $k = -1$; $k = 0$; $k = 1$."
   ]
  },
  {
   "id": "22.fipi.B3D80F",
   "group": "k_abs_frac",
   "fipi": "B3D80F",
   "text": "Постройте график функции $y = \\dfrac{4|x| - 1}{|x| - 4x^{2}}$. Определите, при каких значениях $k$ прямая $y = kx$ не имеет с графиком общих точек.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=-16; k=0; k=16",
     "tex": "k = -16;\\ k = 0;\\ k = 16"
    }
   ],
   "answerTex": "$k = -16$; $k = 0$; $k = 16$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $4x - 1 = 4(x - 0{,}25)$, знаменатель $-4x^{2} + x = -4(x - 0{,}25)x$.",
    "Сократим дробь на $(x - 0{,}25)$ (это можно при $x \\ne 0{,}25$): $y = - \\dfrac{1}{x}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-4x - 1 = -4(x + 0{,}25)$, знаменатель $-4x^{2} - x = -4x(x + 0{,}25)$.",
    "Сократим дробь на $(x + 0{,}25)$ (это можно при $x \\ne -0{,}25$): $y = \\dfrac{1}{x}$.",
    "При $x \\lt 0, x \\ne -0{,}25$ график — гипербола $y = \\dfrac{1}{x}$.",
    "При $x \\gt 0, x \\ne 0{,}25$ график — гипербола $y = - \\dfrac{1}{x}$.",
    "При $x = -0{,}25$ функция не определена: график подходит к значению $y = -4$, точка $(-0{,}25;\\ -4)$ выколота.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = 0{,}25$ функция не определена: график подходит к значению $y = -4$, точка $(0{,}25;\\ -4)$ выколота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.B3D80F]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\lt 0, x \\ne -0{,}25$: $h(x) = \\dfrac{1}{x^{2}}$.",
    "при $x \\gt 0, x \\ne 0{,}25$: $h(x) = - \\dfrac{1}{x^{2}}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\lt -16$: одна общая точка (на $x \\lt 0$ — 0, на $x \\gt 0$ — 1).",
    "$k = -16$: нет общих точек.",
    "$-16 \\lt k \\lt 0$: одна общая точка (на $x \\lt 0$ — 0, на $x \\gt 0$ — 1).",
    "$k = 0$: нет общих точек.",
    "$0 \\lt k \\lt 16$: одна общая точка (на $x \\lt 0$ — 1, на $x \\gt 0$ — 0).",
    "$k = 16$: нет общих точек.",
    "$k \\gt 16$: одна общая точка (на $x \\lt 0$ — 1, на $x \\gt 0$ — 0).",
    "Прямая $y = kx$ не имеет с графиком ни одной общей точки при $k = -16$; $k = 0$; $k = 16$."
   ]
  },
  {
   "id": "22.fipi.7AC574",
   "group": "k_abs_frac",
   "fipi": "7AC574",
   "text": "Постройте график функции $y = \\dfrac{3|x| - 1}{|x| - 3x^{2}}$. Определите, при каких значениях $k$ прямая $y = kx$ не имеет с графиком общих точек.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=-9; k=0; k=9",
     "tex": "k = -9;\\ k = 0;\\ k = 9"
    }
   ],
   "answerTex": "$k = -9$; $k = 0$; $k = 9$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $3x - 1 = 3(x - \\dfrac{1}{3})$, знаменатель $-3x^{2} + x = -3(x - \\dfrac{1}{3})x$.",
    "Сократим дробь на $(x - \\dfrac{1}{3})$ (это можно при $x \\ne \\dfrac{1}{3}$): $y = - \\dfrac{1}{x}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-3x - 1 = -3(x + \\dfrac{1}{3})$, знаменатель $-3x^{2} - x = -3x(x + \\dfrac{1}{3})$.",
    "Сократим дробь на $(x + \\dfrac{1}{3})$ (это можно при $x \\ne -\\dfrac{1}{3}$): $y = \\dfrac{1}{x}$.",
    "При $x \\lt 0, x \\ne -\\dfrac{1}{3}$ график — гипербола $y = \\dfrac{1}{x}$.",
    "При $x \\gt 0, x \\ne \\dfrac{1}{3}$ график — гипербола $y = - \\dfrac{1}{x}$.",
    "При $x = -\\dfrac{1}{3}$ функция не определена: график подходит к значению $y = -3$, точка $(-\\dfrac{1}{3};\\ -3)$ выколота.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = \\dfrac{1}{3}$ функция не определена: график подходит к значению $y = -3$, точка $(\\dfrac{1}{3};\\ -3)$ выколота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.7AC574]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\lt 0, x \\ne -\\dfrac{1}{3}$: $h(x) = \\dfrac{1}{x^{2}}$.",
    "при $x \\gt 0, x \\ne \\dfrac{1}{3}$: $h(x) = - \\dfrac{1}{x^{2}}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\lt -9$: одна общая точка (на $x \\lt 0$ — 0, на $x \\gt 0$ — 1).",
    "$k = -9$: нет общих точек.",
    "$-9 \\lt k \\lt 0$: одна общая точка (на $x \\lt 0$ — 0, на $x \\gt 0$ — 1).",
    "$k = 0$: нет общих точек.",
    "$0 \\lt k \\lt 9$: одна общая точка (на $x \\lt 0$ — 1, на $x \\gt 0$ — 0).",
    "$k = 9$: нет общих точек.",
    "$k \\gt 9$: одна общая точка (на $x \\lt 0$ — 1, на $x \\gt 0$ — 0).",
    "Прямая $y = kx$ не имеет с графиком ни одной общей точки при $k = -9$; $k = 0$; $k = 9$."
   ]
  },
  {
   "id": "22.fipi.381A79",
   "group": "k_abs_frac",
   "fipi": "381A79",
   "text": "Постройте график функции $y = \\dfrac{4{,}5|x| - 1}{|x| - 4{,}5x^{2}}$. Определите, при каких значениях $k$ прямая $y = kx$ не имеет с графиком общих точек.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=-20,25; k=0; k=20,25",
     "tex": "k = -20{,}25;\\ k = 0;\\ k = 20{,}25"
    }
   ],
   "answerTex": "$k = -20{,}25$; $k = 0$; $k = 20{,}25$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $4{,}5x - 1 = 4{,}5(x - \\dfrac{2}{9})$, знаменатель $-4{,}5x^{2} + x = -4{,}5(x - \\dfrac{2}{9})x$.",
    "Сократим дробь на $(x - \\dfrac{2}{9})$ (это можно при $x \\ne \\dfrac{2}{9}$): $y = - \\dfrac{1}{x}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-4{,}5x - 1 = -4{,}5(x + \\dfrac{2}{9})$, знаменатель $-4{,}5x^{2} - x = -4{,}5x(x + \\dfrac{2}{9})$.",
    "Сократим дробь на $(x + \\dfrac{2}{9})$ (это можно при $x \\ne -\\dfrac{2}{9}$): $y = \\dfrac{1}{x}$.",
    "При $x \\lt 0, x \\ne -\\dfrac{2}{9}$ график — гипербола $y = \\dfrac{1}{x}$.",
    "При $x \\gt 0, x \\ne \\dfrac{2}{9}$ график — гипербола $y = - \\dfrac{1}{x}$.",
    "При $x = -\\dfrac{2}{9}$ функция не определена: график подходит к значению $y = -4{,}5$, точка $(-\\dfrac{2}{9};\\ -4{,}5)$ выколота.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = \\dfrac{2}{9}$ функция не определена: график подходит к значению $y = -4{,}5$, точка $(\\dfrac{2}{9};\\ -4{,}5)$ выколота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.381A79]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\lt 0, x \\ne -\\dfrac{2}{9}$: $h(x) = \\dfrac{1}{x^{2}}$.",
    "при $x \\gt 0, x \\ne \\dfrac{2}{9}$: $h(x) = - \\dfrac{1}{x^{2}}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\lt -20{,}25$: одна общая точка (на $x \\lt 0$ — 0, на $x \\gt 0$ — 1).",
    "$k = -20{,}25$: нет общих точек.",
    "$-20{,}25 \\lt k \\lt 0$: одна общая точка (на $x \\lt 0$ — 0, на $x \\gt 0$ — 1).",
    "$k = 0$: нет общих точек.",
    "$0 \\lt k \\lt 20{,}25$: одна общая точка (на $x \\lt 0$ — 1, на $x \\gt 0$ — 0).",
    "$k = 20{,}25$: нет общих точек.",
    "$k \\gt 20{,}25$: одна общая точка (на $x \\lt 0$ — 1, на $x \\gt 0$ — 0).",
    "Прямая $y = kx$ не имеет с графиком ни одной общей точки при $k = -20{,}25$; $k = 0$; $k = 20{,}25$."
   ]
  },
  {
   "id": "22.fipi.92985D",
   "group": "k_abs_frac",
   "fipi": "92985D",
   "text": "Постройте график функции $y = \\dfrac{3{,}5|x| - 1}{|x| - 3{,}5x^{2}}$. Определите, при каких значениях $k$ прямая $y = kx$ не имеет с графиком общих точек.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=-12,25; k=0; k=12,25",
     "tex": "k = -12{,}25;\\ k = 0;\\ k = 12{,}25"
    }
   ],
   "answerTex": "$k = -12{,}25$; $k = 0$; $k = 12{,}25$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $3{,}5x - 1 = 3{,}5(x - \\dfrac{2}{7})$, знаменатель $-3{,}5x^{2} + x = -3{,}5(x - \\dfrac{2}{7})x$.",
    "Сократим дробь на $(x - \\dfrac{2}{7})$ (это можно при $x \\ne \\dfrac{2}{7}$): $y = - \\dfrac{1}{x}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-3{,}5x - 1 = -3{,}5(x + \\dfrac{2}{7})$, знаменатель $-3{,}5x^{2} - x = -3{,}5x(x + \\dfrac{2}{7})$.",
    "Сократим дробь на $(x + \\dfrac{2}{7})$ (это можно при $x \\ne -\\dfrac{2}{7}$): $y = \\dfrac{1}{x}$.",
    "При $x \\lt 0, x \\ne -\\dfrac{2}{7}$ график — гипербола $y = \\dfrac{1}{x}$.",
    "При $x \\gt 0, x \\ne \\dfrac{2}{7}$ график — гипербола $y = - \\dfrac{1}{x}$.",
    "При $x = -\\dfrac{2}{7}$ функция не определена: график подходит к значению $y = -3{,}5$, точка $(-\\dfrac{2}{7};\\ -3{,}5)$ выколота.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = \\dfrac{2}{7}$ функция не определена: график подходит к значению $y = -3{,}5$, точка $(\\dfrac{2}{7};\\ -3{,}5)$ выколота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.92985D]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\lt 0, x \\ne -\\dfrac{2}{7}$: $h(x) = \\dfrac{1}{x^{2}}$.",
    "при $x \\gt 0, x \\ne \\dfrac{2}{7}$: $h(x) = - \\dfrac{1}{x^{2}}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\lt -12{,}25$: одна общая точка (на $x \\lt 0$ — 0, на $x \\gt 0$ — 1).",
    "$k = -12{,}25$: нет общих точек.",
    "$-12{,}25 \\lt k \\lt 0$: одна общая точка (на $x \\lt 0$ — 0, на $x \\gt 0$ — 1).",
    "$k = 0$: нет общих точек.",
    "$0 \\lt k \\lt 12{,}25$: одна общая точка (на $x \\lt 0$ — 1, на $x \\gt 0$ — 0).",
    "$k = 12{,}25$: нет общих точек.",
    "$k \\gt 12{,}25$: одна общая точка (на $x \\lt 0$ — 1, на $x \\gt 0$ — 0).",
    "Прямая $y = kx$ не имеет с графиком ни одной общей точки при $k = -12{,}25$; $k = 0$; $k = 12{,}25$."
   ]
  },
  {
   "id": "22.fipi.95BEE9",
   "group": "k_abs_frac",
   "fipi": "95BEE9",
   "text": "Постройте график функции $y = \\dfrac{1{,}5|x| - 1}{|x| - 1{,}5x^{2}}$. Определите, при каких значениях $k$ прямая $y = kx$ не имеет с графиком общих точек.",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "set",
     "value": "k=-2,25; k=0; k=2,25",
     "tex": "k = -2{,}25;\\ k = 0;\\ k = 2{,}25"
    }
   ],
   "answerTex": "$k = -2{,}25$; $k = 0$; $k = 2{,}25$",
   "steps": [
    "При $x \\gt 0$ ($|x| = x$): разложим на множители числитель и знаменатель: числитель $1{,}5x - 1 = 1{,}5(x - \\dfrac{2}{3})$, знаменатель $-1{,}5x^{2} + x = -1{,}5(x - \\dfrac{2}{3})x$.",
    "Сократим дробь на $(x - \\dfrac{2}{3})$ (это можно при $x \\ne \\dfrac{2}{3}$): $y = - \\dfrac{1}{x}$.",
    "При $x \\lt 0$ ($|x| = -x$): разложим на множители числитель и знаменатель: числитель $-1{,}5x - 1 = -1{,}5(x + \\dfrac{2}{3})$, знаменатель $-1{,}5x^{2} - x = -1{,}5x(x + \\dfrac{2}{3})$.",
    "Сократим дробь на $(x + \\dfrac{2}{3})$ (это можно при $x \\ne -\\dfrac{2}{3}$): $y = \\dfrac{1}{x}$.",
    "При $x \\lt 0, x \\ne -\\dfrac{2}{3}$ график — гипербола $y = \\dfrac{1}{x}$.",
    "При $x \\gt 0, x \\ne \\dfrac{2}{3}$ график — гипербола $y = - \\dfrac{1}{x}$.",
    "При $x = -\\dfrac{2}{3}$ функция не определена: график подходит к значению $y = -1{,}5$, точка $(-\\dfrac{2}{3};\\ -1{,}5)$ выколота.",
    "При $x = 0$ функция не определена: график уходит в бесконечность — прямая $x = 0$ вертикальная асимптота.",
    "При $x = \\dfrac{2}{3}$ функция не определена: график подходит к значению $y = -1{,}5$, точка $(\\dfrac{2}{3};\\ -1{,}5)$ выколота.",
    "При $x \\to \\pm\\infty$ график приближается к горизонтальной прямой $y = 0$, но не достигает её: на этой части графика значения $y = 0$ нет.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.95BEE9]]",
    "Прямая $y = kx$ проходит через начало координат. Точка $(x;\\ y)$ с $x \\ne 0$ лежит и на графике, и на прямой, если $k = \\dfrac{y}{x}$. Значит, число общих точек равно числу решений уравнения $k = h(x)$, где $h(x) = \\dfrac{f(x)}{x}$:",
    "при $x \\lt 0, x \\ne -\\dfrac{2}{3}$: $h(x) = \\dfrac{1}{x^{2}}$.",
    "при $x \\gt 0, x \\ne \\dfrac{2}{3}$: $h(x) = - \\dfrac{1}{x^{2}}$.",
    "При $x = 0$ функция не определена, поэтому в начале координат общей точки нет.",
    "Вращаем прямую $y = kx$ вокруг начала координат и считаем её общие точки с графиком:",
    "$k \\lt -2{,}25$: одна общая точка (на $x \\lt 0$ — 0, на $x \\gt 0$ — 1).",
    "$k = -2{,}25$: нет общих точек.",
    "$-2{,}25 \\lt k \\lt 0$: одна общая точка (на $x \\lt 0$ — 0, на $x \\gt 0$ — 1).",
    "$k = 0$: нет общих точек.",
    "$0 \\lt k \\lt 2{,}25$: одна общая точка (на $x \\lt 0$ — 1, на $x \\gt 0$ — 0).",
    "$k = 2{,}25$: нет общих точек.",
    "$k \\gt 2{,}25$: одна общая точка (на $x \\lt 0$ — 1, на $x \\gt 0$ — 0).",
    "Прямая $y = kx$ не имеет с графиком ни одной общей точки при $k = -2{,}25$; $k = 0$; $k = 2{,}25$."
   ]
  },
  {
   "id": "22.fipi.C0BD4C",
   "group": "abs_quad",
   "fipi": "C0BD4C",
   "text": "Постройте график функции $y = |x^{2} + 5x + 6|$. Какое наибольшее число общих точек может иметь график данной функции с прямой, параллельной оси абсцисс?",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "num",
     "value": "4",
     "tex": "4",
     "unit": ""
    }
   ],
   "answerTex": "$4$",
   "steps": [
    "Найдём нули подмодульного выражения: $x^{2} + 5x + 6 = 0$, $D = 5^2 - 4 \\cdot 1 \\cdot 6 = 1$, $x_1 = \\dfrac{-5 - 1}{2} = -3$, $x_2 = \\dfrac{-5 + 1}{2} = -2$.",
    "Вершина параболы $y = x^{2} + 5x + 6$: $x_0 = -\\dfrac{5}{2} = -2{,}5$, $y_0 = (-2{,}5)^{2} + 5 \\cdot (-2{,}5) + 6 = -0{,}25$. Ветви вверх, парабола ниже оси $Ox$ между нулями $-3$ и $-2$.",
    "Модуль не меняет значения там, где $x^{2} + 5x + 6 \\ge 0$ (при $x \\le -3$ и $x \\ge -2$), а на промежутке $[-3;\\ -2]$ меняет знак: $y = -(x^{2} + 5x + 6) = -x^{2} - 5x - 6$. Эта часть — парабола ветвями вниз: график прежней параболы отражён вверх относительно оси $Ox$, вершина стала $(-2{,}5;\\ 0{,}25)$.",
    "Получился график в форме буквы «W»: две ветви вверх по краям (от точек $(-3;\\ 0)$ и $(-2;\\ 0)$) и «горб» между ними высотой $0{,}25$.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.C0BD4C]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: нет общих точек.",
    "$m = 0$: 2 общие точки (на $x \\lt -3$ — 0, на $-3 \\le x \\lt -2$ — 1, на $x \\ge -2$ — 1).",
    "$0 \\lt m \\lt 0{,}25$: 4 общие точки (на $x \\lt -3$ — 1, на $-3 \\le x \\lt -2$ — 2, на $x \\ge -2$ — 1).",
    "$m = 0{,}25$: 3 общие точки (на $x \\lt -3$ — 1, на $-3 \\le x \\lt -2$ — 1, на $x \\ge -2$ — 1).",
    "$m \\gt 0{,}25$: 2 общие точки (на $x \\lt -3$ — 1, на $-3 \\le x \\lt -2$ — 0, на $x \\ge -2$ — 1).",
    "Наибольшее число общих точек равно $4$."
   ]
  },
  {
   "id": "22.fipi.B80D72",
   "group": "abs_quad",
   "fipi": "B80D72",
   "text": "Постройте график функции $y = |x^{2} - 4x + 3|$. Какое наибольшее число общих точек может иметь график данной функции с прямой, параллельной оси абсцисс?",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "num",
     "value": "4",
     "tex": "4",
     "unit": ""
    }
   ],
   "answerTex": "$4$",
   "steps": [
    "Найдём нули подмодульного выражения: $x^{2} - 4x + 3 = 0$, $D = (-4)^2 - 4 \\cdot 1 \\cdot 3 = 4$, $x_1 = \\dfrac{4 - 2}{2} = 1$, $x_2 = \\dfrac{4 + 2}{2} = 3$.",
    "Вершина параболы $y = x^{2} - 4x + 3$: $x_0 = -\\dfrac{-4}{2} = 2$, $y_0 = 2^{2} - 4 \\cdot 2 + 3 = -1$. Ветви вверх, парабола ниже оси $Ox$ между нулями $1$ и $3$.",
    "Модуль не меняет значения там, где $x^{2} - 4x + 3 \\ge 0$ (при $x \\le 1$ и $x \\ge 3$), а на промежутке $[1;\\ 3]$ меняет знак: $y = -(x^{2} - 4x + 3) = -x^{2} + 4x - 3$. Эта часть — парабола ветвями вниз: график прежней параболы отражён вверх относительно оси $Ox$, вершина стала $(2;\\ 1)$.",
    "Получился график в форме буквы «W»: две ветви вверх по краям (от точек $(1;\\ 0)$ и $(3;\\ 0)$) и «горб» между ними высотой $1$.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.B80D72]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: нет общих точек.",
    "$m = 0$: 2 общие точки (на $x \\lt 1$ — 0, на $1 \\le x \\lt 3$ — 1, на $x \\ge 3$ — 1).",
    "$0 \\lt m \\lt 1$: 4 общие точки (на $x \\lt 1$ — 1, на $1 \\le x \\lt 3$ — 2, на $x \\ge 3$ — 1).",
    "$m = 1$: 3 общие точки (на $x \\lt 1$ — 1, на $1 \\le x \\lt 3$ — 1, на $x \\ge 3$ — 1).",
    "$m \\gt 1$: 2 общие точки (на $x \\lt 1$ — 1, на $1 \\le x \\lt 3$ — 0, на $x \\ge 3$ — 1).",
    "Наибольшее число общих точек равно $4$."
   ]
  },
  {
   "id": "22.fipi.EF61B5",
   "group": "abs_quad",
   "fipi": "EF61B5",
   "text": "Постройте график функции $y = |x^{2} + 2x - 3|$. Какое наибольшее число общих точек может иметь график данной функции с прямой, параллельной оси абсцисс?",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "num",
     "value": "4",
     "tex": "4",
     "unit": ""
    }
   ],
   "answerTex": "$4$",
   "steps": [
    "Найдём нули подмодульного выражения: $x^{2} + 2x - 3 = 0$, $D = 2^2 - 4 \\cdot 1 \\cdot (-3) = 16$, $x_1 = \\dfrac{-2 - 4}{2} = -3$, $x_2 = \\dfrac{-2 + 4}{2} = 1$.",
    "Вершина параболы $y = x^{2} + 2x - 3$: $x_0 = -\\dfrac{2}{2} = -1$, $y_0 = (-1)^{2} + 2 \\cdot (-1) - 3 = -4$. Ветви вверх, парабола ниже оси $Ox$ между нулями $-3$ и $1$.",
    "Модуль не меняет значения там, где $x^{2} + 2x - 3 \\ge 0$ (при $x \\le -3$ и $x \\ge 1$), а на промежутке $[-3;\\ 1]$ меняет знак: $y = -(x^{2} + 2x - 3) = -x^{2} - 2x + 3$. Эта часть — парабола ветвями вниз: график прежней параболы отражён вверх относительно оси $Ox$, вершина стала $(-1;\\ 4)$.",
    "Получился график в форме буквы «W»: две ветви вверх по краям (от точек $(-3;\\ 0)$ и $(1;\\ 0)$) и «горб» между ними высотой $4$.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.EF61B5]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: нет общих точек.",
    "$m = 0$: 2 общие точки (на $x \\lt -3$ — 0, на $-3 \\le x \\lt 1$ — 1, на $x \\ge 1$ — 1).",
    "$0 \\lt m \\lt 4$: 4 общие точки (на $x \\lt -3$ — 1, на $-3 \\le x \\lt 1$ — 2, на $x \\ge 1$ — 1).",
    "$m = 4$: 3 общие точки (на $x \\lt -3$ — 1, на $-3 \\le x \\lt 1$ — 1, на $x \\ge 1$ — 1).",
    "$m \\gt 4$: 2 общие точки (на $x \\lt -3$ — 1, на $-3 \\le x \\lt 1$ — 0, на $x \\ge 1$ — 1).",
    "Наибольшее число общих точек равно $4$."
   ]
  },
  {
   "id": "22.fipi.B745DE",
   "group": "abs_quad",
   "fipi": "B745DE",
   "text": "Постройте график функции $y = |x^{2} + 5x + 4|$. Какое наибольшее число общих точек может иметь график данной функции с прямой, параллельной оси абсцисс?",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "num",
     "value": "4",
     "tex": "4",
     "unit": ""
    }
   ],
   "answerTex": "$4$",
   "steps": [
    "Найдём нули подмодульного выражения: $x^{2} + 5x + 4 = 0$, $D = 5^2 - 4 \\cdot 1 \\cdot 4 = 9$, $x_1 = \\dfrac{-5 - 3}{2} = -4$, $x_2 = \\dfrac{-5 + 3}{2} = -1$.",
    "Вершина параболы $y = x^{2} + 5x + 4$: $x_0 = -\\dfrac{5}{2} = -2{,}5$, $y_0 = (-2{,}5)^{2} + 5 \\cdot (-2{,}5) + 4 = -2{,}25$. Ветви вверх, парабола ниже оси $Ox$ между нулями $-4$ и $-1$.",
    "Модуль не меняет значения там, где $x^{2} + 5x + 4 \\ge 0$ (при $x \\le -4$ и $x \\ge -1$), а на промежутке $[-4;\\ -1]$ меняет знак: $y = -(x^{2} + 5x + 4) = -x^{2} - 5x - 4$. Эта часть — парабола ветвями вниз: график прежней параболы отражён вверх относительно оси $Ox$, вершина стала $(-2{,}5;\\ 2{,}25)$.",
    "Получился график в форме буквы «W»: две ветви вверх по краям (от точек $(-4;\\ 0)$ и $(-1;\\ 0)$) и «горб» между ними высотой $2{,}25$.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.B745DE]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: нет общих точек.",
    "$m = 0$: 2 общие точки (на $x \\lt -4$ — 0, на $-4 \\le x \\lt -1$ — 1, на $x \\ge -1$ — 1).",
    "$0 \\lt m \\lt 2{,}25$: 4 общие точки (на $x \\lt -4$ — 1, на $-4 \\le x \\lt -1$ — 2, на $x \\ge -1$ — 1).",
    "$m = 2{,}25$: 3 общие точки (на $x \\lt -4$ — 1, на $-4 \\le x \\lt -1$ — 1, на $x \\ge -1$ — 1).",
    "$m \\gt 2{,}25$: 2 общие точки (на $x \\lt -4$ — 1, на $-4 \\le x \\lt -1$ — 0, на $x \\ge -1$ — 1).",
    "Наибольшее число общих точек равно $4$."
   ]
  },
  {
   "id": "22.fipi.8D22D9",
   "group": "abs_quad",
   "fipi": "8D22D9",
   "text": "Постройте график функции $y = |x^{2} + x - 2|$. Какое наибольшее число общих точек может иметь график данной функции с прямой, параллельной оси абсцисс?",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "num",
     "value": "4",
     "tex": "4",
     "unit": ""
    }
   ],
   "answerTex": "$4$",
   "steps": [
    "Найдём нули подмодульного выражения: $x^{2} + x - 2 = 0$, $D = 1^2 - 4 \\cdot 1 \\cdot (-2) = 9$, $x_1 = \\dfrac{-1 - 3}{2} = -2$, $x_2 = \\dfrac{-1 + 3}{2} = 1$.",
    "Вершина параболы $y = x^{2} + x - 2$: $x_0 = -\\dfrac{1}{2} = -0{,}5$, $y_0 = (-0{,}5)^{2} + (-0{,}5) - 2 = -2{,}25$. Ветви вверх, парабола ниже оси $Ox$ между нулями $-2$ и $1$.",
    "Модуль не меняет значения там, где $x^{2} + x - 2 \\ge 0$ (при $x \\le -2$ и $x \\ge 1$), а на промежутке $[-2;\\ 1]$ меняет знак: $y = -(x^{2} + x - 2) = -x^{2} - x + 2$. Эта часть — парабола ветвями вниз: график прежней параболы отражён вверх относительно оси $Ox$, вершина стала $(-0{,}5;\\ 2{,}25)$.",
    "Получился график в форме буквы «W»: две ветви вверх по краям (от точек $(-2;\\ 0)$ и $(1;\\ 0)$) и «горб» между ними высотой $2{,}25$.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.8D22D9]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: нет общих точек.",
    "$m = 0$: 2 общие точки (на $x \\lt -2$ — 0, на $-2 \\le x \\lt 1$ — 1, на $x \\ge 1$ — 1).",
    "$0 \\lt m \\lt 2{,}25$: 4 общие точки (на $x \\lt -2$ — 1, на $-2 \\le x \\lt 1$ — 2, на $x \\ge 1$ — 1).",
    "$m = 2{,}25$: 3 общие точки (на $x \\lt -2$ — 1, на $-2 \\le x \\lt 1$ — 1, на $x \\ge 1$ — 1).",
    "$m \\gt 2{,}25$: 2 общие точки (на $x \\lt -2$ — 1, на $-2 \\le x \\lt 1$ — 0, на $x \\ge 1$ — 1).",
    "Наибольшее число общих точек равно $4$."
   ]
  },
  {
   "id": "22.fipi.B50355",
   "group": "abs_quad",
   "fipi": "B50355",
   "text": "Постройте график функции $y = |x^{2} - 9|$. Какое наибольшее число общих точек может иметь график данной функции с прямой, параллельной оси абсцисс?",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "num",
     "value": "4",
     "tex": "4",
     "unit": ""
    }
   ],
   "answerTex": "$4$",
   "steps": [
    "Найдём нули подмодульного выражения: $x^{2} - 9 = 0$, $x^2 = 9$, $x = \\pm 3$.",
    "Вершина параболы $y = x^{2} - 9$: $x_0 = -\\dfrac{0}{2} = 0$, $y_0 = 0^{2} - 9 = -9$. Ветви вверх, парабола ниже оси $Ox$ между нулями $-3$ и $3$.",
    "Модуль не меняет значения там, где $x^{2} - 9 \\ge 0$ (при $x \\le -3$ и $x \\ge 3$), а на промежутке $[-3;\\ 3]$ меняет знак: $y = -(x^{2} - 9) = -x^{2} + 9$. Эта часть — парабола ветвями вниз: график прежней параболы отражён вверх относительно оси $Ox$, вершина стала $(0;\\ 9)$.",
    "Получился график в форме буквы «W»: две ветви вверх по краям (от точек $(-3;\\ 0)$ и $(3;\\ 0)$) и «горб» между ними высотой $9$.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.B50355]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: нет общих точек.",
    "$m = 0$: 2 общие точки (на $x \\lt -3$ — 0, на $-3 \\le x \\lt 3$ — 1, на $x \\ge 3$ — 1).",
    "$0 \\lt m \\lt 9$: 4 общие точки (на $x \\lt -3$ — 1, на $-3 \\le x \\lt 3$ — 2, на $x \\ge 3$ — 1).",
    "$m = 9$: 3 общие точки (на $x \\lt -3$ — 1, на $-3 \\le x \\lt 3$ — 1, на $x \\ge 3$ — 1).",
    "$m \\gt 9$: 2 общие точки (на $x \\lt -3$ — 1, на $-3 \\le x \\lt 3$ — 0, на $x \\ge 3$ — 1).",
    "Наибольшее число общих точек равно $4$."
   ]
  },
  {
   "id": "22.fipi.2E135D",
   "group": "abs_quad",
   "fipi": "2E135D",
   "text": "Постройте график функции $y = |x^{2} - 6x + 5|$. Какое наибольшее число общих точек может иметь график данной функции с прямой, параллельной оси абсцисс?",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "num",
     "value": "4",
     "tex": "4",
     "unit": ""
    }
   ],
   "answerTex": "$4$",
   "steps": [
    "Найдём нули подмодульного выражения: $x^{2} - 6x + 5 = 0$, $D = (-6)^2 - 4 \\cdot 1 \\cdot 5 = 16$, $x_1 = \\dfrac{6 - 4}{2} = 1$, $x_2 = \\dfrac{6 + 4}{2} = 5$.",
    "Вершина параболы $y = x^{2} - 6x + 5$: $x_0 = -\\dfrac{-6}{2} = 3$, $y_0 = 3^{2} - 6 \\cdot 3 + 5 = -4$. Ветви вверх, парабола ниже оси $Ox$ между нулями $1$ и $5$.",
    "Модуль не меняет значения там, где $x^{2} - 6x + 5 \\ge 0$ (при $x \\le 1$ и $x \\ge 5$), а на промежутке $[1;\\ 5]$ меняет знак: $y = -(x^{2} - 6x + 5) = -x^{2} + 6x - 5$. Эта часть — парабола ветвями вниз: график прежней параболы отражён вверх относительно оси $Ox$, вершина стала $(3;\\ 4)$.",
    "Получился график в форме буквы «W»: две ветви вверх по краям (от точек $(1;\\ 0)$ и $(5;\\ 0)$) и «горб» между ними высотой $4$.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.2E135D]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: нет общих точек.",
    "$m = 0$: 2 общие точки (на $x \\lt 1$ — 0, на $1 \\le x \\lt 5$ — 1, на $x \\ge 5$ — 1).",
    "$0 \\lt m \\lt 4$: 4 общие точки (на $x \\lt 1$ — 1, на $1 \\le x \\lt 5$ — 2, на $x \\ge 5$ — 1).",
    "$m = 4$: 3 общие точки (на $x \\lt 1$ — 1, на $1 \\le x \\lt 5$ — 1, на $x \\ge 5$ — 1).",
    "$m \\gt 4$: 2 общие точки (на $x \\lt 1$ — 1, на $1 \\le x \\lt 5$ — 0, на $x \\ge 5$ — 1).",
    "Наибольшее число общих точек равно $4$."
   ]
  },
  {
   "id": "22.fipi.1A7E63",
   "group": "abs_quad",
   "fipi": "1A7E63",
   "text": "Постройте график функции $y = |x^{2} + 3x + 2|$. Какое наибольшее число общих точек может иметь график данной функции с прямой, параллельной оси абсцисс?",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "num",
     "value": "4",
     "tex": "4",
     "unit": ""
    }
   ],
   "answerTex": "$4$",
   "steps": [
    "Найдём нули подмодульного выражения: $x^{2} + 3x + 2 = 0$, $D = 3^2 - 4 \\cdot 1 \\cdot 2 = 1$, $x_1 = \\dfrac{-3 - 1}{2} = -2$, $x_2 = \\dfrac{-3 + 1}{2} = -1$.",
    "Вершина параболы $y = x^{2} + 3x + 2$: $x_0 = -\\dfrac{3}{2} = -1{,}5$, $y_0 = (-1{,}5)^{2} + 3 \\cdot (-1{,}5) + 2 = -0{,}25$. Ветви вверх, парабола ниже оси $Ox$ между нулями $-2$ и $-1$.",
    "Модуль не меняет значения там, где $x^{2} + 3x + 2 \\ge 0$ (при $x \\le -2$ и $x \\ge -1$), а на промежутке $[-2;\\ -1]$ меняет знак: $y = -(x^{2} + 3x + 2) = -x^{2} - 3x - 2$. Эта часть — парабола ветвями вниз: график прежней параболы отражён вверх относительно оси $Ox$, вершина стала $(-1{,}5;\\ 0{,}25)$.",
    "Получился график в форме буквы «W»: две ветви вверх по краям (от точек $(-2;\\ 0)$ и $(-1;\\ 0)$) и «горб» между ними высотой $0{,}25$.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.1A7E63]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: нет общих точек.",
    "$m = 0$: 2 общие точки (на $x \\lt -2$ — 0, на $-2 \\le x \\lt -1$ — 1, на $x \\ge -1$ — 1).",
    "$0 \\lt m \\lt 0{,}25$: 4 общие точки (на $x \\lt -2$ — 1, на $-2 \\le x \\lt -1$ — 2, на $x \\ge -1$ — 1).",
    "$m = 0{,}25$: 3 общие точки (на $x \\lt -2$ — 1, на $-2 \\le x \\lt -1$ — 1, на $x \\ge -1$ — 1).",
    "$m \\gt 0{,}25$: 2 общие точки (на $x \\lt -2$ — 1, на $-2 \\le x \\lt -1$ — 0, на $x \\ge -1$ — 1).",
    "Наибольшее число общих точек равно $4$."
   ]
  },
  {
   "id": "22.fipi.D28F33",
   "group": "abs_quad",
   "fipi": "D28F33",
   "text": "Постройте график функции $y = |x^{2} - x - 2|$. Какое наибольшее число общих точек может иметь график данной функции с прямой, параллельной оси абсцисс?",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "num",
     "value": "4",
     "tex": "4",
     "unit": ""
    }
   ],
   "answerTex": "$4$",
   "steps": [
    "Найдём нули подмодульного выражения: $x^{2} - x - 2 = 0$, $D = (-1)^2 - 4 \\cdot 1 \\cdot (-2) = 9$, $x_1 = \\dfrac{1 - 3}{2} = -1$, $x_2 = \\dfrac{1 + 3}{2} = 2$.",
    "Вершина параболы $y = x^{2} - x - 2$: $x_0 = -\\dfrac{-1}{2} = 0{,}5$, $y_0 = 0{,}5^{2} - 0{,}5 - 2 = -2{,}25$. Ветви вверх, парабола ниже оси $Ox$ между нулями $-1$ и $2$.",
    "Модуль не меняет значения там, где $x^{2} - x - 2 \\ge 0$ (при $x \\le -1$ и $x \\ge 2$), а на промежутке $[-1;\\ 2]$ меняет знак: $y = -(x^{2} - x - 2) = -x^{2} + x + 2$. Эта часть — парабола ветвями вниз: график прежней параболы отражён вверх относительно оси $Ox$, вершина стала $(0{,}5;\\ 2{,}25)$.",
    "Получился график в форме буквы «W»: две ветви вверх по краям (от точек $(-1;\\ 0)$ и $(2;\\ 0)$) и «горб» между ними высотой $2{,}25$.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.D28F33]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: нет общих точек.",
    "$m = 0$: 2 общие точки (на $x \\lt -1$ — 0, на $-1 \\le x \\lt 2$ — 1, на $x \\ge 2$ — 1).",
    "$0 \\lt m \\lt 2{,}25$: 4 общие точки (на $x \\lt -1$ — 1, на $-1 \\le x \\lt 2$ — 2, на $x \\ge 2$ — 1).",
    "$m = 2{,}25$: 3 общие точки (на $x \\lt -1$ — 1, на $-1 \\le x \\lt 2$ — 1, на $x \\ge 2$ — 1).",
    "$m \\gt 2{,}25$: 2 общие точки (на $x \\lt -1$ — 1, на $-1 \\le x \\lt 2$ — 0, на $x \\ge 2$ — 1).",
    "Наибольшее число общих точек равно $4$."
   ]
  },
  {
   "id": "22.fipi.778885",
   "group": "abs_quad",
   "fipi": "778885",
   "text": "Постройте график функции $y = |x^{2} + 4x - 5|$. Какое наибольшее число общих точек может иметь график данной функции с прямой, параллельной оси абсцисс?",
   "fields": [
    {
     "id": "ans",
     "label": "Ответ:",
     "type": "num",
     "value": "4",
     "tex": "4",
     "unit": ""
    }
   ],
   "answerTex": "$4$",
   "steps": [
    "Найдём нули подмодульного выражения: $x^{2} + 4x - 5 = 0$, $D = 4^2 - 4 \\cdot 1 \\cdot (-5) = 36$, $x_1 = \\dfrac{-4 - 6}{2} = -5$, $x_2 = \\dfrac{-4 + 6}{2} = 1$.",
    "Вершина параболы $y = x^{2} + 4x - 5$: $x_0 = -\\dfrac{4}{2} = -2$, $y_0 = (-2)^{2} + 4 \\cdot (-2) - 5 = -9$. Ветви вверх, парабола ниже оси $Ox$ между нулями $-5$ и $1$.",
    "Модуль не меняет значения там, где $x^{2} + 4x - 5 \\ge 0$ (при $x \\le -5$ и $x \\ge 1$), а на промежутке $[-5;\\ 1]$ меняет знак: $y = -(x^{2} + 4x - 5) = -x^{2} - 4x + 5$. Эта часть — парабола ветвями вниз: график прежней параболы отражён вверх относительно оси $Ox$, вершина стала $(-2;\\ 9)$.",
    "Получился график в форме буквы «W»: две ветви вверх по краям (от точек $(-5;\\ 0)$ и $(1;\\ 0)$) и «горб» между ними высотой $9$.",
    "Строим график по найденным частям и точкам (выколотые точки — пустые кружки). [[fig:22.fipi.778885]]",
    "Двигаем горизонтальную прямую $y = m$ снизу вверх и считаем её общие точки с графиком:",
    "$m \\lt 0$: нет общих точек.",
    "$m = 0$: 2 общие точки (на $x \\lt -5$ — 0, на $-5 \\le x \\lt 1$ — 1, на $x \\ge 1$ — 1).",
    "$0 \\lt m \\lt 9$: 4 общие точки (на $x \\lt -5$ — 1, на $-5 \\le x \\lt 1$ — 2, на $x \\ge 1$ — 1).",
    "$m = 9$: 3 общие точки (на $x \\lt -5$ — 1, на $-5 \\le x \\lt 1$ — 1, на $x \\ge 1$ — 1).",
    "$m \\gt 9$: 2 общие точки (на $x \\lt -5$ — 1, на $-5 \\le x \\lt 1$ — 0, на $x \\ge 1$ — 1).",
    "Наибольшее число общих точек равно $4$."
   ]
  }
 ]
};
