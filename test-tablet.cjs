const {boot,shared,assert}=require('./test-av-ui.cjs');shared.clear();let a=boot('audio');
a.run(`window.HTMLElement.prototype.setPointerCapture=function(){};window.HTMLElement.prototype.hasPointerCapture=function(){return false};window.HTMLElement.prototype.releasePointerCapture=function(){};`);
a.ctx.PointerEvent=function(type,props){let e=new a.ctx.window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,props);return e};
a.run(`setZoom(1);$('#canvaswrap').scrollLeft=300;$('#canvaswrap').scrollTop=200`);a.flush();
const view=a.document.querySelector('#canvaswrap');view.getBoundingClientRect=()=>({left:0,top:0,width:1000,height:600});
const stateBefore=a.run('JSON.stringify({nodes:state.nodes,edges:state.edges,groups:state.groups})');
function event(type,id,x,y){let e=new a.ctx.window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerType:'touch',pointerId:id,button:0,clientX:x,clientY:y});return e}
view.dispatchEvent(event('pointerdown',1,200,200));view.dispatchEvent(event('pointerdown',2,400,200));
assert.ok(view.classList.contains('is-pinching'));
a.document.dispatchEvent(event('pointermove',2,600,200));a.flush();
assert.equal(a.run('zoom'),2);assert.equal(view.scrollLeft,800);assert.equal(view.scrollTop,600);
a.document.dispatchEvent(event('pointerup',2,600,200));assert.ok(view.classList.contains('is-pinching'));
a.document.dispatchEvent(event('pointerup',1,200,200));assert.equal(view.classList.contains('is-pinching'),false);
assert.equal(a.run('JSON.stringify({nodes:state.nodes,edges:state.edges,groups:state.groups})'),stateBefore);
// A second touch can safely cancel a Booth drag without leaving changed positions.
const beforeGroup=a.run('JSON.stringify(state)'),beforeHistory=a.run('history.length');
const handle=a.document.querySelector('.zonehandle');
a.ctx.groupPointer=event('pointerdown',7,300,300);a.ctx.groupHandle=handle;
a.run('startGroupDrag(groupPointer,state.groups[0].id,groupHandle)');handle.dispatchEvent(event('pointermove',7,360,340));assert.notEqual(a.run('JSON.stringify(state)'),beforeGroup);a.run('activeEquipmentDrag.cancel()');assert.equal(a.run('JSON.stringify(state)'),beforeGroup);assert.equal(a.run('history.length'),beforeHistory);
const upper=a.run("tabletPinchCamera({zoom:2,distance:10,worldX:100,worldY:100},[{x:0,y:0},{x:1000,y:0}],{left:0,top:0})");assert.equal(upper.zoom,2.5);assert.ok(upper.x>=0);
const lower=a.run("tabletPinchCamera({zoom:.2,distance:100,worldX:100,worldY:100},[{x:0,y:0},{x:1,y:0}],{left:0,top:0})");assert.equal(lower.zoom,.1);
console.log('PASS: two-touch pinch anchored zoom/pan, clamps, gesture-end cleanup and unchanged devices/cables/groups');
