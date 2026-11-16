const {boot,shared,assert,fs,vm,root}=require('./test-av-ui.cjs');
shared.clear();const a=boot('audio');a.run('setZoom(1)');a.flush();
a.document.querySelector('#board').getBoundingClientRect=()=>({left:0,top:0,width:100000,height:100000});
a.run('previewEquipmentDrop=()=>({inCanvas:true,trash:false,group:""})');
function ptr(type,x,y){const e=new a.ctx.window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:7,button:0,clientX:x,clientY:y});return e}
const id=a.run('state.nodes[0].id'),head=a.document.querySelector(`.node[data-id="${id}"] .nodehead`);a.ctx.h=head;a.ctx.down=ptr('pointerdown',100,100);a.ctx.id=id;
const old=a.run('({x:node(id).x,y:node(id).y})');a.run('startEquipmentPointer(down,h,{id})');a.document.dispatchEvent(ptr('pointerup',160,130));
assert.equal(a.run('activeEquipmentDrag'),null);assert.equal(a.run('node(id).x'),old.x+60);assert.equal(a.run('node(id).y'),old.y+30,'release coordinate is committed without a final move or hold');
a.run('startEquipmentPointer(down,h,{model:node(id).model})');const count=a.run('state.nodes.length');a.document.dispatchEvent(ptr('pointermove',120,120));a.document.dispatchEvent(ptr('pointerup',700,500));assert.equal(a.run('state.nodes.length'),count+1);assert.equal(a.run('state.nodes.at(-1).x'),593);assert.equal(a.run('state.nodes.at(-1).y'),470);assert.equal(a.document.querySelector('.equipment-drag-ghost'),null);
const timers=[],intervals=[];Object.assign(a.ctx,{setTimeout:(cb,ms)=>{timers.push({cb,ms});return timers.length},clearTimeout(){},setInterval:(cb,ms)=>{intervals.push({cb,ms});return intervals.length},sessionStorage:{getItem(){return null},setItem(){}},location:{hostname:'127.0.0.1',port:'4173',origin:'http://127.0.0.1:4173',hash:'',href:'http://127.0.0.1:4173/editor.html'},crypto:require('node:crypto').webcrypto});
for(const f of ['collab-core.js','collab.js','cloud.js','presence.js'])vm.runInContext(fs.readFileSync(root+'/'+f,'utf8'),a.ctx);
a.run('initializeCollaboration();initializeCloud();initializePresence()');assert.deepEqual(intervals.map(t=>t.ms),[100,100,100]);
a.run('collabSession={id:"test",base:sharedProject(state)};collaborationChanged()');assert.equal(timers.at(-1).ms,100);a.run('cloudSession={id:"test"};cloudChanged()');assert.equal(timers.at(-1).ms,100);
console.log('PASS: immediate pointerup placement, latest library drop coordinates, 100ms project/cloud/presence cadence');
