'use strict';
function resizedGroupRect(g,edge,dx,dy,canvas,rects=[]){
 let left=g.x,top=g.y,right=g.x+g.w,bottom=g.y+g.h;
 let minMemberX=Math.min(canvas.width,...rects.map(r=>Math.max(typeof canvasLowerBound==='function'?canvasLowerBound():0,r.x-28))),minMemberY=Math.min(canvas.height,...rects.map(r=>Math.max(typeof canvasLowerBound==='function'?canvasLowerBound():0,r.y-82)));
 let maxMemberX=Math.max(typeof canvasLowerBound==='function'?canvasLowerBound():0,...rects.map(r=>Math.min(canvas.width,r.x+r.w+28))),maxMemberY=Math.max(typeof canvasLowerBound==='function'?canvasLowerBound():0,...rects.map(r=>Math.min(canvas.height,r.y+r.h+28)));
 if(edge.includes('w'))left=Math.max(typeof canvasLowerBound==='function'?canvasLowerBound():0,Math.min(g.x+dx,right-240,minMemberX));
 if(edge.includes('n'))top=Math.max(typeof canvasLowerBound==='function'?canvasLowerBound():0,Math.min(g.y+dy,bottom-180,minMemberY));
 if(edge.includes('e'))right=Math.min(canvas.width,Math.max(g.x+g.w+dx,left+240,maxMemberX));
 if(edge.includes('s'))bottom=Math.min(canvas.height,Math.max(g.y+g.h+dy,top+180,maxMemberY));
 return{x:left,y:top,w:right-left,h:bottom-top};
}
function groupResizeHandles(g){return ['n','ne','e','se','s','sw','w','nw'].map(edge=>`<button class="group-resize group-resize-${edge}" data-resize-group="${g.id}" data-resize-edge="${edge}" aria-label="${esc(g.name)}の${({n:'上',ne:'右上',e:'右',se:'右下',s:'下',sw:'左下',w:'左',nw:'左上'})[edge]}境界をリサイズ" title="ドラッグでサイズ変更" tabindex="-1"></button>`).join('')}
function bindGroupResizing(){
 $$('[data-resize-group]').forEach(handle=>{
  handle.onclick=e=>{e.preventDefault();e.stopPropagation()};handle.onpointerdown=e=>{
   if(e.button!==0||activeEquipmentDrag)return;e.preventDefault();e.stopPropagation();
   let g=state.groups.find(g=>g.id===handle.dataset.resizeGroup);if(!g)return;let original={x:g.x,y:g.y,w:g.w,h:g.h},start=canvasDropPoint(e),oldHistory=history.slice(),members=boothMemberRects(g),changed=false;
   let controller={cancel:()=>finish(true)};activeEquipmentDrag=controller;document.body.classList.add('group-resizing');try{handle.setPointerCapture(e.pointerId)}catch{}
   function move(ev){if(ev.pointerId!==e.pointerId)return;ev.preventDefault();let p=canvasDropPoint(ev),rect=resizedGroupRect(original,handle.dataset.resizeEdge,p.x-start.x,p.y-start.y,canvasSize(),members);if(!changed&&['x','y','w','h'].some(k=>rect[k]!==original[k])){remember();changed=true}Object.assign(g,rect);paintBooth(g)}
   function finish(cancelled){document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',cancel);document.removeEventListener('keydown',key,true);window.removeEventListener('blur',cancel);handle.removeEventListener('lostpointercapture',cancel);activeEquipmentDrag=null;document.body.classList.remove('group-resizing');if(cancelled){Object.assign(g,original);history=oldHistory}try{if(handle.hasPointerCapture?.(e.pointerId))handle.releasePointerCapture(e.pointerId)}catch{}render()}
   function up(ev){if(ev.pointerId===e.pointerId)finish(false)}function cancel(){finish(true)}function key(ev){if(ev.key==='Escape'){ev.preventDefault();ev.stopImmediatePropagation();cancel()}}
   document.addEventListener('pointermove',move,{passive:false});document.addEventListener('pointerup',up);document.addEventListener('pointercancel',cancel);document.addEventListener('keydown',key,true);window.addEventListener('blur',cancel);handle.addEventListener('lostpointercapture',cancel);
  };
 });
}
