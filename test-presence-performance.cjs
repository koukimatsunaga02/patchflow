const {boot,shared,assert,fs,vm,root}=require('./test-av-ui.cjs');
shared.clear();const app=boot('audio');app.flush();app.flush();app.run('setZoom(1)');app.flush();
app.ctx.crypto=require('node:crypto').webcrypto;app.ctx.collabSession=null;app.ctx.COLLAB_API='/api';app.ctx.setInterval=()=>1;
vm.runInContext(fs.readFileSync(root+'/presence.js','utf8'),app.ctx);app.run('initializePresence()');
let boardReads=0,frameReads=0;
app.document.querySelector('#board').getBoundingClientRect=()=>{boardReads++;return{left:0,top:0,width:100000,height:100000}};
app.document.querySelector('#canvasframe').getBoundingClientRect=()=>{frameReads++;return{left:0,top:0,width:1280,height:650}};
const view=app.document.querySelector('#canvaswrap');
function move(x,y){let e=new app.ctx.window.Event('pointermove',{bubbles:true});Object.assign(e,{clientX:x,clientY:y});view.dispatchEvent(e)}
for(let i=0;i<20;i++){move(100+i,150);view.dispatchEvent(new app.ctx.window.Event('scroll'));app.run('presenceSelectionChanged()')}
app.flush();assert.equal(boardReads,0,'local editing never measures board for unused collaboration cursors');assert.equal(frameReads,0);assert.equal(app.run('presenceTimer'),null,'local pointer movement does not schedule network presence');
app.run("collabSession={id:'room',token:'token'};presenceRoom='room';renderPresence()");
assert.equal(boardReads,0,'a session with no peers renders its roster without canvas geometry');assert.ok(app.document.querySelector('.self-avatar'));
app.run("presencePeers=[{clientId:'peer',name:'Remote',color:'#317fbd',cursor:{x:120,y:150},selection:{type:'node',id:state.nodes[0].id}}];renderPresence()");
assert.equal(boardReads,1);assert.equal(frameReads,1);assert.ok(app.document.querySelector('.peer-selection'));assert.ok(app.document.querySelector('.peer-cursor').style.transform.includes('120px,150px'));assert.ok(app.document.querySelector('[data-peer="peer"]'));
boardReads=0;frameReads=0;for(let i=0;i<15;i++)view.dispatchEvent(new app.ctx.window.Event('scroll'));assert.equal(boardReads,0);app.flush();assert.equal(boardReads,1,'a scroll burst paints peer overlays once per frame');assert.equal(frameReads,1);
move(160,180);assert.equal(app.run('presenceCursor.x'),160);assert.equal(app.run('presenceCursor.y'),180);assert.ok(app.run('presenceTimer')!==null,'active shared-session cursor updates are scheduled');
app.run("pending={node:state.nodes[0].id,port:models[state.nodes[0].model].ports[0].id};presenceSelectionChanged()");assert.equal(app.run('presenceSelection().type'),'port','in-session connection selection stays available');
app.run("pending=null;presencePeers[0].selection={type:'edge',id:state.edges[0].id};renderPresence()");assert.ok(app.document.querySelector('.peer-wire'),'peer wire highlight is visible');
boardReads=0;frameReads=0;app.run('collabSession=null;renderPresence()');assert.equal(boardReads,0);assert.equal(frameReads,0);assert.equal(app.document.querySelector('#participants').children.length,0);assert.equal(app.document.querySelector('#presence-layer').children.length,0);assert.equal(app.document.querySelector('.peer-wire'),null,'leaving clears stale wire highlights');
console.log('PASS: local and peer-free presence uses zero layout reads, scroll redraws coalesce, and shared cursors/selections/roster plus leave cleanup remain intact');
