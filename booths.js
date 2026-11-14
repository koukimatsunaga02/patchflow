'use strict';
let activeEquipmentDrag=null;
let boothResizeObserver=null;
function insideRect(x,y,r,margin=0){return x>=r.left-margin&&x<=r.left+r.width+margin&&y>=r.top-margin&&y<=r.top+r.height+margin}
function fitBoothRect(group,rects,canvas){
 if(!rects.length)return{x:group.x,y:group.y,w:group.w,h:group.h};
 let x=Math.max(typeof canvasLowerBound==='function'?canvasLowerBound():0,Math.min(group.x,...rects.map(r=>r.x-28))),y=Math.max(typeof canvasLowerBound==='function'?canvasLowerBound():0,Math.min(group.y,...rects.map(r=>r.y-82)));
 let right=Math.min(canvas.width,Math.max(group.x+group.w,...rects.map(r=>r.x+r.w+28))),bottom=Math.min(canvas.height,Math.max(group.y+group.h,...rects.map(r=>r.y+r.h+28)));
 return{x,y,w:right-x,h:bottom-y};
}
function findBoothDrop(groups,p){
 let rank=groups.map((g,i)=>({g,i,exact:insideRect(p.x,p.y,{left:g.x,top:g.y,width:g.w,height:g.h})})).filter(({g,exact})=>exact||insideRect(p.x,p.y,{left:g.x,top:g.y,width:g.w,height:g.h},30));
 rank.sort((a,b)=>Number(b.exact)-Number(a.exact)||a.g.w*a.g.h-b.g.w*b.g.h||b.i-a.i);return rank[0]?.g||null;
}
function equipmentRect(n){let el=$(`.node[data-id="${n.id}"]`);return{x:n.x,y:n.y,w:215,h:n.dragHeight||el?.offsetHeight||360}}
function boothMemberRects(group,except,visibleOnly=false){return state.nodes.filter(n=>n.group===group.id&&n.id!==except&&(!visibleOnly||typeof visibleNode!=='function'||visibleNode(n))).map(equipmentRect)}
function paintBooth(group,rect=group){let el=$(`.zone[data-group="${group.id}"]`);if(el)Object.assign(el.style,{left:rect.x+'px',top:rect.y+'px',width:rect.w+'px',height:rect.h+'px'})}
function fitAllBooths(){
 if(activeEquipmentDrag||typeof autoFitBooths!=='undefined'&&!autoFitBooths)return false;let changed=false;
 for(let g of state.groups){let r=fitBoothRect(g,boothMemberRects(g,null,true),canvasSize());if(['x','y','w','h'].some(k=>g[k]!==r[k])){Object.assign(g,r);changed=true}paintBooth(g)}
 return changed;
}
function watchBoothSizes(){if(boothResizeObserver){boothResizeObserver.disconnect();$$('.node').forEach(el=>boothResizeObserver.observe(el))}}
function canvasDropPoint(e){let r=$('#board').getBoundingClientRect();return{x:(e.clientX-r.left)/zoom,y:(e.clientY-r.top)/zoom}}
function clearEquipmentDrop(){
 document.body.classList.remove('equipment-dragging');$('#equipmenttrash')?.classList.remove('drop-ready');$('#equipmenttrash')?.removeAttribute('data-dragging');
 $('#equipmentdrophint').hidden=true;for(let g of state.groups){paintBooth(g);$(`.zone[data-group="${g.id}"]`)?.classList.remove('booth-drop-ready')}
}
function previewEquipmentDrop(n,e){
 let obscured=['library','inspector'].some(side=>document.body.classList.contains(side+'-open')&&insideRect(e.clientX,e.clientY,$('.'+side).getBoundingClientRect()));
 let trash=$('#equipmenttrash'),overTrash=!obscured&&insideRect(e.clientX,e.clientY,trash.getBoundingClientRect());
 let canvas=$('#canvaswrap').getBoundingClientRect(),inCanvas=!obscured&&insideRect(e.clientX,e.clientY,canvas);
 let target=!overTrash&&inCanvas?findBoothDrop(state.groups.filter(g=>$(`.zone[data-group="${g.id}"]`)),canvasDropPoint(e)):null;
 for(let g of state.groups){let el=$(`.zone[data-group="${g.id}"]`);el?.classList.toggle('booth-drop-ready',g.id===target?.id);paintBooth(g,g.id===target?.id?fitBoothRect(g,[...boothMemberRects(g,n.id),equipmentRect(n)],canvasSize()):g)}
 trash.classList.toggle('drop-ready',overTrash);trash.dataset.dragging='true';let hint=$('#equipmentdrophint');hint.hidden=false;hint.textContent=overTrash?'離すと機材と接続ケーブルを削除':target?'離すと「'+target.name+'」に追加':inCanvas?'離すとグループなしで配置':'キャンバスへドラッグ';
 return{trash:overTrash,inCanvas,group:target?.id||''};
}
function removeEquipment(id,record=true){
 let n=node(id);if(!n)return false;if(record)remember();let label=n.name;
 state.nodes=state.nodes.filter(x=>x.id!==id);state.edges=state.edges.filter(e=>e.from!==id&&e.to!==id);expandedNodes.delete(id);
 selected=state.nodes[0]?.id;selectedEdge=null;selectedGroup=null;pending=null;rewire=null;insertDraft=null;render();toast(label+' と接続ケーブルを削除しました（↶で戻せます）');return true;
}
function startEquipmentPointer(e,element,options){
 if(e.button!==0||e.ctrlKey||activeEquipmentDrag)return;
 let original=JSON.stringify(state),oldHistory=history.slice(),start={x:e.clientX,y:e.clientY};
 let n=options.id?node(options.id):null,grab=n?{x:canvasDropPoint(e).x-n.x,y:canvasDropPoint(e).y-n.y}:null,started=false,ghost=null,last=e;
 let controller={cancel:()=>finish(last,true)};activeEquipmentDrag=controller;
 try{element.setPointerCapture(e.pointerId)}catch{}
 function begin(){
  started=true;remember();document.body.classList.add('equipment-dragging');selectedEdge=null;selectedGroup=null;pending=null;rewire=null;insertDraft=null;
  if(!n){let m=models[options.model],visible=m.ports.filter(p=>m.visible.includes(p.id));let h=300+25*Math.max(visible.filter(p=>p.dir==='in').length,visible.filter(p=>p.dir==='out').length);
   let p=canvasDropPoint(last);n={id:'n'+Date.now()+Math.random().toString(36).slice(2,5),model:options.model,name:m.name+' · '+(state.nodes.filter(x=>x.model===options.model).length+1),group:'',x:p.x-107,y:p.y-30};
   ghost=document.createElement('div');ghost.className='equipment-drag-ghost';ghost.innerHTML=`<img src="${m.img}" alt=""><strong>${esc(m.name)}</strong><small>Boothへドロップして追加</small>`;document.body.append(ghost);n.dragHeight=h;
  }else{selected=n.id;element.closest('.node')?.classList.add('equipment-in-drag')}
  renderRouteEditor();renderGroups();
 }
 function move(ev){
  if(ev.pointerId!==e.pointerId)return;last=ev;
  if(!started&&Math.hypot(ev.clientX-start.x,ev.clientY-start.y)<6)return;
  ev.preventDefault();if(!started)begin();
  let p=canvasDropPoint(ev);n.x=p.x-(options.id?grab.x:107);n.y=p.y-(options.id?grab.y:30);
  let h=n.dragHeight||equipmentRect(n).h;n.x=Math.max(typeof canvasLowerBound==='function'?canvasLowerBound():10,Math.min(canvasSize().width-243,n.x));n.y=Math.max(typeof canvasLowerBound==='function'?canvasLowerBound():82,Math.min(canvasSize().height-h-28,n.y));
  if(options.id){let el=$(`.node[data-id="${n.id}"]`);el.style.left=n.x+'px';el.style.top=n.y+'px';wires()}else Object.assign(ghost.style,{left:ev.clientX+18+'px',top:ev.clientY+18+'px'});
  previewEquipmentDrop(n,ev);
 }
 function finish(ev,cancelled=false){
  if(!cancelled&&ev.pointerId!==e.pointerId)return;
  document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',cancel);document.removeEventListener('keydown',key,true);element.removeEventListener('lostpointercapture',cancel);
  let outcome=started&&!cancelled?previewEquipmentDrop(n,ev):null;activeEquipmentDrag=null;ghost?.remove();clearEquipmentDrop();
  try{if(element.hasPointerCapture?.(e.pointerId))element.releasePointerCapture(e.pointerId)}catch{}
  if(!started)return;
  // Suppress the click generated by a completed drag without blocking later clicks.
  element.dataset.skipClickUntil=String(Date.now()+300);
  if(cancelled||!outcome.inCanvas&&!outcome.trash||!options.id&&outcome.trash){state=JSON.parse(original);history=oldHistory;render();if(cancelled)toast('移動を中止しました');return}
  if(outcome.trash){removeEquipment(n.id,false);return}
  delete n.dragHeight;n.group=outcome.group;if(!options.id){if(typeof revealModel==='function')revealModel(n.model);state.nodes.push(n);}selected=n.id;render();
  let group=state.groups.find(g=>g.id===n.group);if(group){Object.assign(group,fitBoothRect(group,boothMemberRects(group),canvasSize()));paintBooth(group);save()}toast(group?'「'+group.name+'」に追加しました（↶で戻せます）':'グループなしで配置しました（↶で戻せます）');
 }
 function up(ev){finish(ev)}function cancel(ev){if(ev?.pointerId!==undefined&&ev.pointerId!==e.pointerId)return;finish(last,true)}
 function key(ev){if(ev.key==='Escape'||(ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='z'){ev.preventDefault();ev.stopImmediatePropagation();cancel()}else if(started&&['Enter','Delete','Backspace',' '].includes(ev.key)){ev.preventDefault();ev.stopImmediatePropagation()}}
 document.addEventListener('pointermove',move,{passive:false});document.addEventListener('pointerup',up);document.addEventListener('pointercancel',cancel);document.addEventListener('keydown',key,true);element.addEventListener('lostpointercapture',cancel);
}
function startLibraryEquipmentDrag(e,el){if(e.pointerType==='touch')return;startEquipmentPointer(e,el,{model:el.dataset.add})}
function initializeBoothDrops(){
 $('#equipmenttrash').onclick=()=>{if(node(selected)&&!selectedEdge&&!selectedGroup)removeEquipment(selected)};
 $('#equipmenttrash').onpointerdown=e=>e.stopPropagation();
 window.addEventListener('blur',()=>activeEquipmentDrag?.cancel());
 window.addEventListener('pagehide',()=>activeEquipmentDrag?.cancel(),{capture:true});
 if(typeof ResizeObserver==='function')boothResizeObserver=new ResizeObserver(()=>{if(fitAllBooths())save()});
}
