const {boot,shared,assert,fs,root}=require('./test-av-ui.cjs');shared.clear();let app=boot('audio');
const run=app.run;
assert.equal(run('Object.keys(models).length'),98);
for(let c of ['ptzCamera','ptzController','splitter']){app.change('#categoryfilter',c);assert.equal(app.document.querySelectorAll('[data-add]').length,c==='splitter'?1:4)}
app.change('#categoryfilter','all');app.change('#brandfilter','Roland');assert.equal(app.document.querySelectorAll('[data-add]').length,6);
for(let [cam,ctl] of [['canon','canonctl'],['sony','sonyctl'],['pana','panactl'],['jvc','jvcctl']]){
 assert.equal(run(`compatible(models.${ctl}.ports[0],models.${cam}.ports[0])`),null);
 assert.equal(run(`cableType(models.${ctl}.ports[0],models.${cam}.ports[0])`),'PTZ_LAN');
 assert.equal(run(`mediaLayer(models.${ctl}.ports[0])`),'video');
 for(let other of ['canon','sony','pana','jvc'].filter(x=>x!==cam))assert.ok(run(`compatible(models.${ctl}.ports[0],models.${other}.ports[0])`));
}
assert.equal(run("models.pana.ports.some(p=>p.type==='HDMI')"),false);
assert.equal(run("models.pana.ports.find(p=>p.type==='SDI').formats.includes('1080p59.94')"),false);
assert.equal(run("models.sony.ports.filter(p=>p.type==='SDI').length"),4);
assert.equal(run("models.v8.ports.some(p=>p.type==='UVC')"),false);
assert.equal(run("models.v80.ports.filter(p=>p.type==='HDMI'&&p.dir==='out').length"),5);
assert.equal(run("models.vr120.ports.filter(p=>p.type==='COMBO').length"),6);
assert.equal(run("models.split.ports.filter(p=>p.dir==='out').length"),4);
run(`state={version:1,title:'PTZ rental',canvas:{width:4800,height:3200},groups:[],nodes:[{id:'ctl',model:'canonctl',name:'RC',x:30,y:30},{id:'cam',model:'canon',name:'Cam',x:400,y:30},{id:'switch',model:'vr120',name:'VR',x:800,y:30},{id:'split',model:'split',name:'Split',x:1300,y:30},{id:'display',model:Object.keys(models).find(k=>models[k].category==='display'&&models[k].ports.some(p=>p.type==='HDMI'&&p.dir==='in')),name:'Display',x:1700,y:30}],edges:[]};render()`);
// Pick a real monitor model without depending on its catalog key.
run("state.nodes.find(n=>n.id==='display').model=Object.keys(models).find(k=>models[k].category==='display'&&models[k].ports.some(p=>p.type==='HDMI'&&p.dir==='in'));render()");
run("connect('ctl','lan');connect('cam','lan')");app.flush();assert.equal(run('state.edges.length'),1);assert.equal(run('state.edges[0].type'),'PTZ_LAN');assert.equal(run('validate(state)===state'),true);
run("connect('cam','hdmi');connect('switch','hdmiin1')");app.flush();assert.equal(run('state.edges.length'),2);
run("connect('cam','sdi');connect('switch','sdiin1')");app.flush();assert.equal(run('state.edges.length'),3);assert.equal(run('validate(state)===state'),true);run("state.edges=state.edges.filter(e=>e.fp!=='sdi')");
run("connect('switch','hdmiout1');connect('split','in');connect('split','out1');let d=models[node('display').model].ports.find(p=>p.dir==='in'&&p.type==='HDMI');connect('display',d.id)");app.flush();assert.equal(run('state.edges.length'),4);assert.equal(run('validate(state)===state'),true);assert.equal(run('rentalGraphWarnings(state).length'),0);
run("state.edges.find(e=>e.from==='split').format='1080p50'");assert.match(run("rentalGraphWarnings(state).join(' ')"),/変更できません/);
run("state.edges=state.edges.filter(e=>e.to!=='split')");assert.match(run("rentalGraphWarnings(state).join(' ')"),/未接続/);
run("openCableGuide('PTZ_LAN')");assert.match(app.document.querySelector('#guidecontent').textContent,/RJ45/);assert.ok(app.document.querySelector('#guidecontent svg'));
run("setMediaLayer('video',false)");app.flush();assert.equal(app.document.querySelector('[data-id="ctl"]'),null);assert.equal(run('state.nodes.length'),5);
for(let key of ['split','v8','v80','v160','vr120','canon','canonctl','sony','sonyctl','pana','panactl','jvc','jvcctl'])assert.ok(fs.existsSync(root+'/'+run(`models.${key}.img`)),key);
console.log('PASS: 13 rental models; 4 PTZ protocols and video-layer isolation; physical port counts; 12 independent VR inputs; splitter missing input and format checks; RJ45 diagram; photos');
