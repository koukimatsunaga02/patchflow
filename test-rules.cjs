const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('dist/app.js','utf8');
const pre=src.slice(0,src.indexOf('try{state=JSON.parse'));
const refs=src.slice(src.indexOf('const node=id'),src.indexOf('function catalog'));
const typeRule=src.slice(src.indexOf('function cableType('),src.indexOf('function candidateError('));
const rules=src.slice(src.indexOf('function compatible'),src.indexOf('function connect('));
const editing=src.slice(src.indexOf('function candidateError('),src.indexOf('function renderRouteEditor('));
const canvasRule=src.slice(src.indexOf('function canvasSize('),src.indexOf('function syncCanvasSize('));
const movement=src.slice(src.indexOf('function groupBounds('),src.indexOf('function startGroupDrag('));
const validate=src.slice(src.indexOf('function validate('),src.indexOf("$('#file').onchange"));
vm.runInContext(pre+refs+rules+validate+movement+typeRule+editing+canvasRule+`
state=demo();
assert.equal(models.v10.ports.filter(p=>p.id.startsWith('ch')&&p.type==='RCA').length,12);
assert.equal(models.v10.ports.filter(p=>p.type==='SPDIF').length,6);
for(let ch=1;ch<=6;ch++){for(let side of ['L','R'])assert.equal(compatible(models.cdjnxs2.ports.find(p=>p.id==='analog'+side),models.v10.ports.find(p=>p.id==='ch'+ch+side)),null)}
assert.equal(cableType(models.v10.ports.find(p=>p.id==='boothL'),models.g8010.ports[0]),'TRS_XLR');
assert.match(compatible(models.v10.ports.find(p=>p.id==='aes'),models.g8010.ports[0]),/信号形式/);

assert.equal(validate(state),state);
assert.match(compatible(models.djm.ports.find(p=>p.id==='masterL'),models.cbr.ports[0]),/アンプ/);
assert.match(compatible(models.px.ports.find(p=>p.id==='spkA'),models.dbr.ports[0]),/ライン入力/);
assert.equal(compatible(models.px.ports.find(p=>p.id==='spkA'),models.cbr.ports[0]),null);
assert.equal(compatible(models.djm.ports.find(p=>p.id==='masterR'),models.px.ports.find(p=>p.id==='inA')),null);
assert.equal(compatible(models.cdjx.ports.find(p=>p.id==='digital'),models.djm.ports.find(p=>p.id==='dig1')),null);
assert.match(compatible(models.cdjx.ports.find(p=>p.id==='digital'),models.djm.ports.find(p=>p.id==='ch3L')),/信号形式/);
assert.equal(connectionError('a1','spkA','s4','in2').includes('ライン入力'),true);
const duplicate=structuredClone(state);
duplicate.edges.push({id:'bad',from:'a1',fp:'tsA',to:'s2',tp:'phone',type:'SPK_TS',length:3});
assert.throws(()=>validate(duplicate),/並列|重複/);
const badGroup=structuredClone(state);badGroup.groups[0].x=NaN;assert.throws(()=>validate(badGroup),/ブース/);
const saved=JSON.parse(JSON.stringify(state));saved.nodes[0].group='dj';assert.equal(validate(saved).nodes[0].group,'dj');
assert.equal(models.cdj15.ports.some(p=>p.signal==='digital'),false);
assert.equal(models.mg06.ports.some(p=>['USB','RCA'].includes(p.type)),false);
assert.equal(models.az.ports.filter(p=>p.dir==='in').length,6);
assert.equal(models.dm3.ports.filter(p=>p.signal==='dante').length,2);
assert.equal(models.dm3s.ports.some(p=>p.signal==='dante'),false);
state.nodes.forEach(n=>n.group=n.id==='p1'||n.id==='p2'?'dj':'');
const oldX=state.nodes.find(n=>n.id==='p1').x,otherX=state.nodes.find(n=>n.id==='s1').x;
moveGroup('dj',20,0);assert.equal(state.nodes.find(n=>n.id==='p1').x,oldX+20);assert.equal(state.nodes.find(n=>n.id==='s1').x,otherX);


function render(){} function toast(){} function remember(){history.push(JSON.stringify(state))}
state=demo();selectedEdge='e4';insertDraft={target:'new:mg16',stereo:true};
assert.equal(state.edges.length,9);applyInsert();assert.equal(state.edges.length,11);
const inserted=state.nodes.find(n=>n.model==='mg16');assert.equal(inserted.group,'');
assert.equal(state.edges.filter(e=>e.to===inserted.id).length,2);
assert.equal(state.edges.find(e=>e.id==='e4').from,inserted.id);
assert.equal(validate(state),state);
state=demo();rewire={edge:'e4',end:'to'};const savedBefore=JSON.stringify(state);commitRewire('s2','spk');assert.equal(JSON.stringify(state),savedBefore);
commitRewire('s1','in2');assert.equal(state.edges.find(e=>e.id==='e4').tp,'in2');assert.equal(state.edges.length,9);
state.nodes.push({id:'g',model:'g8010',name:'Genelec',group:'',x:800,y:300});rewire={edge:'e7',end:'to'};commitRewire('g','in');assert.equal(state.edges.find(e=>e.id==='e7').type,'TRS_XLR');assert.equal(validate(state),state);

`,vm.createContext({assert,structuredClone,document:{querySelector:()=>({offsetHeight:300})}}));
console.log('PASS: amplifier chain, line/speaker isolation, digital isolation, channel duplication, group validation, JSON round-trip, atomic stereo mixer insertion and cable rewire rollback');
