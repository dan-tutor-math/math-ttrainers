/* Шина — обычная картинка с необязательным полем tire3d. Старый движок,
   облако и экспорт сохраняют её через существующий путь изображений.
   Здесь только DOM-слой и жизненный цикл единственного WebGL-контекста. */
(function () {
  'use strict';
  const M = window.TireMath, records = new Map();
  let layer = null, active = null, syncFrame = 0, activating = false, generation = 0;
  let inserting = false, pending = null, note = null;
  const clone = o => JSON.parse(JSON.stringify(o));
  const signature = s => JSON.stringify(s);
  function writable(o) { return !window.__boardViewer && boardActive && !!B && !window.boardsStorageLocked() && mayTouch(o); }
  function send(rec, msg) { if (rec && rec.frame && rec.frame.contentWindow) rec.frame.contentWindow.postMessage({source:'mathh-tire3d-host',...msg},location.origin); }
  function ensureLayer() {
    if (layer) return layer;
    layer = document.createElement('div');layer.id = 'bdTireLayer';canvas.insertAdjacentElement('afterend',layer);
    // Сцена ученика прячет незнакомые слои доски через display:none!important.
    // Этот слой — содержимое урока, поэтому явно разрешаем его показ здесь.
    layer.style.setProperty('display','block','important');
    return layer;
  }
  function stateURL(s) {
    const a=s.tire,b=s.tire2||{width:195,profile:65,rim:15};
    const q=new URLSearchParams({embed:1,w:a.width,p:a.profile,r:a.rim,w2:b.width,p2:b.profile,r2:b.rim,scene:s.scene||'width',step:s.step||0,style:s.style||'real'});
    if(s.measure==='radius')q.set('measure','radius');if(s.allDimensions)q.set('all','1');return 'tire3d.html?'+q;
  }
  function objectOf(id){return B&&Array.isArray(B.objects)?B.objects.find(o=>o.id===id&&o.tire3d):null;}
  function persist(o) {
    if(!writable(o))return;
    saveDB();scheduleRedraw();
  }
  function closeLive(updateFlag=false) {
    const rec=active;active=null;generation++;
    if(!rec)return;
    // dispose вызывается синхронно до создания следующего кадра: браузер
    // не успевает накопить контексты даже при частом переключении моделей.
    if(rec.frame){try{const api=rec.frame.contentWindow.Tire3D;if(api)api.dispose();}catch(e){}rec.frame.remove();rec.frame=null;}
    rec.root.classList.remove('live');rec.root.querySelector('.bd-tire-close')?.remove();rec.ready=false;rec.sig='';
    if(updateFlag){const o=objectOf(rec.id);if(o&&writable(o)){o.tire3d.live=false;persist(o);}}
  }
  function activate(id, own=true) {
    if(activating||active&&active.id===id)return;
    const o=objectOf(id),rec=records.get(id);if(!o||!rec||document.hidden)return;
    activating=true;closeLive();const token=++generation;
    if(own&&writable(o)){
      for(const other of B.objects)if(other.tire3d&&writable(other))other.tire3d.live=other.id===id;
      persist(o);
    }
    active=rec;rec.sig=signature(o.tire3d.state);rec.root.classList.add('live');
    const frame=document.createElement('iframe');frame.className='bd-tire-frame';frame.title='3D-модель шины';frame.src=stateURL(o.tire3d.state);frame.setAttribute('allow','');rec.frame=frame;rec.root.prepend(frame);
    const close=document.createElement('button');close.className='bd-tire-close';close.textContent='Картинка · двигать';close.title='Остановить 3D, чтобы двигать и менять размер на доске';close.onclick=()=>closeLive(true);rec.root.append(close);
    activating=false;if(token!==generation)closeLive();sync();
  }
  function makeRecord(o) {
    const root=document.createElement('div');root.className='bd-tire-object';root.dataset.id=o.id;
    const wake=document.createElement('button');wake.className='bd-tire-wake';wake.textContent='Открыть 3D';wake.title='Вращать модель шины';wake.onclick=()=>activate(o.id);root.append(wake);ensureLayer().append(root);
    return {id:o.id,root,frame:null,sig:'',ready:false,lastUndoAt:0,lastSnapshot:''};
  }
  function sync() {
    syncFrame=0;
    if(!boardActive||!B||!Array.isArray(B.objects)||document.hidden){closeLive();records.forEach(r=>r.root.remove());records.clear();return;}
    const seen=new Set(),pad=40/cam.zoom,desired=[];
    for(let i=0;i<B.objects.length;i++){
      const o=B.objects[i];if(o.type!=='image'||!o.tire3d||!o.tire3d.state||!o.points?.[0])continue;
      const p=worldToScreen(o.points[0]),sw=o.w*cam.zoom,sh=o.h*cam.zoom;
      if(p.x+sw<0||p.y+sh<0||p.x>cssW||p.y>cssH)continue;
      if(B.kind==='deck'&&typeof deckCurRect==='function'){const fr=deckCurRect();if(fr&&(o.points[0].x+o.w<=fr.x||o.points[0].x>=fr.x+fr.w||o.points[0].y+o.h<=fr.y||o.points[0].y>=fr.y+fr.h))continue;}
      seen.add(o.id);let rec=records.get(o.id);if(!rec){rec=makeRecord(o);records.set(o.id,rec);}
      Object.assign(rec.root.style,{left:p.x+'px',top:p.y+'px',width:sw+'px',height:sh+'px',zIndex:String(i),transform:o.rot?`rotate(${o.rot}deg)`:''});
      // Как у полей заданий: DOM-слой не должен торчать поверх картинки,
      // которая нарисована выше него на холсте.
      let holes='';for(let j=i+1;j<B.objects.length;j++){const q=B.objects[j];if(q.type!=='image'||!q.points?.[0])continue;const qp=worldToScreen(q.points[0]),x=qp.x-p.x,y=qp.y-p.y,w=q.w*cam.zoom,h=q.h*cam.zoom;if(x<sw&&y<sh&&x+w>0&&y+h>0)holes+=`M${x} ${y}h${w}v${h}h${-w}Z`;}
      rec.root.style.clipPath=holes?`path(evenodd,'M0 0H${sw}V${sh}H0Z${holes}')`:'';
      if(rec.frame){rec.frame.style.width=Math.max(240,o.w)+'px';rec.frame.style.height=Math.max(220,o.h)+'px';rec.frame.style.transform=`scale(${sw/Math.max(240,o.w)},${sh/Math.max(220,o.h)})`;
        const sig=signature(o.tire3d.state);if(rec.ready&&rec.sig!==sig){rec.sig=sig;send(rec,{type:'apply',state:o.tire3d.state,animate:true});}
        send(rec,{type:'permissions',readOnly:!writable(o)});
      }
      if(o.tire3d.live)desired.push(o.id);
    }
    for(const[id,rec]of records)if(!seen.has(id)){if(active===rec)closeLive();rec.root.remove();records.delete(id);}
    if(active&&(!objectOf(active.id)||!objectOf(active.id).tire3d.live&&!writable(objectOf(active.id))))closeLive();
    if(!active&&desired.length&&!activating)activate(desired[desired.length-1],false);
    if(pending&&!inserting&&!window.__boardViewer&&mayDraw()){
      const item=pending;inserting=true;
      insert(item.state,item.png).then(()=>{pending=null;localStorage.removeItem('tire3d:pending');if(note){note.remove();note=null;}}).catch(()=>{if(note)note.textContent='Не удалось вставить модель. Откройте доску и повторите добавление.';}).finally(()=>{inserting=false;});
    }
  }
  function scheduleSync(){if(!syncFrame)syncFrame=requestAnimationFrame(sync);}
  const originalRedraw=window.scheduleRedraw;
  window.scheduleRedraw=function(){const result=originalRedraw.apply(this,arguments);scheduleSync();return result;};
  const originalBack=window.backToList;
  window.backToList=function(){closeLive();const result=originalBack.apply(this,arguments);scheduleSync();return result;};
  window.addEventListener('message',e=>{
    if(e.origin!==location.origin||!active||e.source!==active.frame?.contentWindow||!e.data||e.data.source!=='mathh-tire3d')return;
    const rec=active,o=objectOf(rec.id);if(!o)return;
    if(e.data.type==='ready'){
      rec.ready=true;send(rec,{type:'permissions',readOnly:!writable(o)});send(rec,{type:'apply',state:o.tire3d.state});return;
    }
    if(e.data.type!=='state'||!e.data.state||!writable(o))return;
    const s=e.data.state;
    if(!s.tire||!['width','side','rim','diam','run','compare'].includes(s.scene))return;
    const sig=signature(s),changed=sig!==signature(o.tire3d.state),png=e.data.png;
    if(changed){
      // Один жест — один шаг отмены, а не новый тяжёлый снимок на каждый
      // пакет камеры. Данные самой камеры по-прежнему приходят до 10 Гц.
      if(performance.now()-rec.lastUndoAt>700){pushUndo({ids:[o.id]});rec.lastUndoAt=performance.now();}
      o.tire3d.state=clone(s);rec.sig=sig;
    }
    if(png&&typeof png==='string'&&png.startsWith('data:image/png;base64,')&&png.length<5e6){const previous=o.src;o.src=png;rec.lastSnapshot=sig;if(previous!==png&&!DB.boards.some(b=>b.objects&&b.objects.some(x=>x.src===previous)))delete imgCache[previous];}
    if(changed||png)persist(o);
  });
  async function poster(s, png) {
    const cv=document.createElement('canvas');cv.width=960;cv.height=700;const c=cv.getContext('2d');c.fillStyle='#e4eaf2';c.fillRect(0,0,960,700);
    if(png){const img=new Image();img.src=png;await img.decode();const k=Math.min(920/img.width,540/img.height);c.drawImage(img,(960-img.width*k)/2,75+(540-img.height*k)/2,img.width*k,img.height*k);}
    else {const v=M.values(s.tire);c.fillStyle='#303742';c.beginPath();c.arc(480,320,210,0,Math.PI*2);c.fill();c.fillStyle='#aab2bd';c.beginPath();c.arc(480,320,210*v.d/v.D,0,Math.PI*2);c.fill();c.fillStyle='#7D5CDA';c.font='600 26px Onest,sans-serif';c.fillText('D = '+M.fmt(v.D)+' мм',720,330);}
    c.fillStyle='#202534';c.font='600 30px Onest,sans-serif';c.fillText('3D-модель шины · '+M.mark(s.tire),32,48);c.font='22px Onest,sans-serif';c.fillText('Открыть 3D — вращение, разрез и вычисления по шагам',32,662);return cv.toDataURL('image/png');
  }
  function defaultState(){let style='real';try{style=localStorage.getItem('tire3d:style')==='glass'?'glass':'real';}catch(e){}return{v:1,tire:{width:175,profile:70,rim:12},tire2:{width:195,profile:65,rim:15},scene:'width',step:0,style,cut:false,camera:null,measure:'diameter'};}
  async function insert(s=defaultState(),png=null){
    if(!B||!boardActive||!mayDraw()||window.__boardViewer||window.boardsStorageLocked())throw new Error('Доска недоступна для изменения');
    const image=await poster(s,png);let center=window.boardsViewCenter();
    // При открытии доски из ссылки её данные готовы раньше первого кадра.
    // Ждём измерения холста, чтобы вставка не потерялась в этой гонке.
    for(let i=0;!center&&i<12;i++){await new Promise(requestAnimationFrame);center=window.boardsViewCenter();}
    if(!center||!B||!boardActive)throw new Error('Дождитесь открытия доски');
    // Размер задаётся как у обычной картинки, поэтому рамка и ручки доски
    // работают без особых веток в геометрии и хранилище.
    const width=960,height=700;
    const o=await insertTaskImage(image,null,null,null,null,null,{x:center.x-width/2,y:center.y-height/2,w:width,h:height});
    o.locked=false;o.tire3d={v:1,state:clone(s),live:false};saveDB();scheduleRedraw();sync();return o.id;
  }
  const add=document.getElementById('bdAddTire3D');if(add)add.addEventListener('click',async()=>{add.disabled=true;try{const id=await insert();activate(id);showTrainersToast('3D-модель шины добавлена');}catch(e){showTrainersToast('Не удалось добавить модель');}finally{add.disabled=false;}});
  try{if(new URLSearchParams(location.search).get('tire3d')==='1'){const item=JSON.parse(localStorage.getItem('tire3d:pending'));if(item&&item.state&&Date.now()-item.at<24*60*60*1000){pending=item;note=document.createElement('div');note.className='bd-tire-import-note';note.textContent='Откройте доску — модель шины будет добавлена на неё.';document.body.append(note);}}}catch(e){}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)closeLive();else scheduleSync();});
  if(window.TrainerSession)window.TrainerSession.onEvent('bd_meta',m=>{if(m&&!m.bid){closeLive();scheduleSync();}});
  window.addEventListener('pagehide',()=>closeLive());
  window.BoardTire3D={insert,activate,close:()=>closeLive(true),sync:scheduleSync,activeId:()=>active&&active.id};
  if(window.boardsBootReady)window.boardsBootReady.then(scheduleSync);scheduleSync();
})();
