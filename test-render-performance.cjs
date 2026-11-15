// Count actual drawing/layout work instead of asserting implementation text.
const {boot,shared,assert}=require('./test-av-ui.cjs');
shared.clear();const app=boot('audio');app.flush();app.flush();
let boardReads=0,jackReads=0,origin=0;
const board=app.document.querySelector('#board');
board.getBoundingClientRect=()=>{boardReads++;return{left:origin,top:0,width:100000,height:100000}};
for(const jack of app.document.querySelectorAll('.jack'))jack.getBoundingClientRect=()=>{jackReads++;return{left:100,top:100,width:10,height:10}};
app.run('selectedEdge=state.edges[0].id;wires()');
const edges=app.run('state.edges.filter(visibleEdge).length');
assert.equal(boardReads,1,'all cable endpoints share one board layout measurement');
assert.equal(jackReads,edges*2,'selected endpoint handles reuse the cable endpoint measurements');
const hit=app.document.querySelector('.wirehit'),flow=app.document.querySelector('.wireflow'),path=hit.getAttribute('d');
app.run('wires()');
assert.equal(app.document.querySelector('.wirehit'),hit,'unchanged draw retains live cable hit targets');
assert.equal(app.document.querySelector('.wireflow'),flow,'unchanged draw preserves the running light animation');
origin=40;app.run('wires()');
assert.notEqual(app.document.querySelector('.wirehit').getAttribute('d'),path,'a new draw reads fresh geometry after movement');
app.run('var actualWireDraw=wires,drawCalls=0;wires=()=>{drawCalls++;actualWireDraw()}');
for(let i=0;i<20;i++)app.run('scheduleWires()');
assert.equal(app.run('drawCalls'),0,'pointer bursts defer cable layout until the next frame');app.flush();
assert.equal(app.run('drawCalls'),1,'twenty requests perform only one cable draw');
app.run('drawCalls=0');for(let i=0;i<12;i++)app.run(`setZoom(${1+i/100})`);app.flush();
assert.equal(app.run('drawCalls'),1,'zoom event bursts perform only one cable draw');
app.run('drawCalls=0;scheduleWires();wires()');app.flush();
assert.equal(app.run('drawCalls'),1,'a synchronous selection update consumes an already queued draw');
// Moving a node updates its position continuously while deferring expensive cable layout.
app.run('selectedEdge=null;drawCalls=0;setZoom(1)');app.flush();app.run('drawCalls=0');
const source=app.run('state.nodes[0].id'),handle=app.document.querySelector(`.node[data-id="${source}"] .nodehead`);
function pointer(type,x,y){let e=new app.ctx.window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{clientX:x,clientY:y,button:0,pointerId:31});return e}
app.ctx.dragStart=pointer('pointerdown',150,150);app.ctx.dragHandle=handle;app.ctx.dragId=source;
app.run('var dragBefore=JSON.stringify(state.nodes[0]);startEquipmentPointer(dragStart,dragHandle,{id:dragId})');
for(let i=1;i<=12;i++)app.document.dispatchEvent(pointer('pointermove',150+i*10,150+i*5));
assert.notEqual(app.run('JSON.stringify(state.nodes[0])'),app.run('dragBefore'),'drag position updates before paint');
assert.equal(app.run('drawCalls'),0);app.flush();assert.equal(app.run('drawCalls'),1,'one cable draw serves a burst of twelve drag events');
app.document.dispatchEvent(pointer('pointerup',270,210));app.flush();
assert.equal(app.run('activeEquipmentDrag'),null);assert.equal(app.run('validate(state)===state'),true);
console.log(`PASS: ${edges}-cable draw uses one board read, selected endpoint cache, preserved SVG animation/hit targets, fresh geometry and one draw per zoom/drag frame`);
