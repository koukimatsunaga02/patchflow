const {boot,shared,assert}=require('./test-av-ui.cjs');shared.clear();let app=boot('audio'),run=app.run;
assert.equal(run('Object.keys(models).length'),96);
app.change('#categoryfilter','interface');assert.equal(app.document.querySelectorAll('[data-add]').length,2);app.change('#categoryfilter','all');app.change('#brandfilter','汎用');assert.equal(app.document.querySelectorAll('[data-add]').length,3);app.change('#brandfilter','all');
app.document.querySelector('#search').value='MG16/6FX';app.document.querySelector('#search').dispatchEvent(new app.document.defaultView.Event('input'));assert.equal(app.document.querySelectorAll('[data-add]').length,1);
assert.equal(run("models.mg166fx.ports.filter(p=>p.dir==='in'&&p.type==='XLR').length"),10);
assert.equal(run("models.mg166fx.ports.filter(p=>p.dir==='in').length"),34);
assert.equal(run("models.mg166fx.ports.filter(p=>p.dir==='out').length"),16);
assert.equal(run("models.mg166fx.ports.length"),59);
assert.equal(run("models.mg166fx.ports.some(p=>p.type.startsWith('USB'))"),false);
assert.equal(run("models.mg166fx.ports.filter(p=>p.id.startsWith('grp')).length"),4);
run(`state={version:1,title:'Capture',canvas:{width:4800,height:3200},groups:[],nodes:[{id:'mic',model:'generic_mic',name:'MIC',x:40,y:100},{id:'mix',model:'mg166fx',name:'MG16/6FX',x:400,y:100},{id:'usb',model:'generic_interface',name:'Interface',x:800,y:100},{id:'pc',model:'v_stream_pc',name:'PC',x:1200,y:100},{id:'dj',model:'flx4',name:'FLX4',x:40,y:600}],edges:[]};render()`);
run("connect('mic','out');connect('mix','mic1');connect('mix','recL');connect('usb','in1');connect('mix','recR');connect('usb','in2');connect('usb','usb');connect('pc','uvc1')");app.flush();assert.equal(run('state.edges.length'),4);assert.equal(run("state.edges.map(e=>e.type).join(',')"),'XLR,RCA_TS,RCA_TS,USB_AUDIO');assert.equal(run('validate(state)===state'),true);
// MIC and LINE are two physical connectors sharing one channel, not two inputs.
assert.match(run("connectionError('usb','lineoutL','mix','line1')"),/同時使用/);
run("state.edges.push({id:'shared',from:'usb',fp:'lineoutL',to:'mix',tp:'line1',type:'TRS',length:3})");assert.throws(()=>run('validate(state)'),/同時使用/);run("state.edges=state.edges.filter(e=>e.id!=='shared')");
// A stereo phone pair is valid, but its alternative XLR/RCA inputs are exclusive.
run("connect('dj','masterL');connect('mix','line13/14L');connect('dj','masterR');connect('mix','line13/14R')");assert.equal(run('state.edges.length'),6);assert.equal(run('validate(state)===state'),true);
run("state.edges=state.edges.filter(e=>e.from!=='dj');pending=null;connect('dj','masterL');connect('mix','rca13/14L')");assert.match(run("connectionError('dj','masterR','mix','line13/14R')"),/同時使用/);
run("state.edges=state.edges.filter(e=>e.from!=='dj');pending=null;connect('dj','masterL');connect('mix','line9/10L')");assert.match(run("connectionError('mic','out','mix','mic9/10')"),/同時使用/);run("state.edges=state.edges.filter(e=>e.from!=='dj')");
assert.ok(run("compatible(models.generic_mic.ports[0],models.generic_interface.ports.find(p=>p.id==='lineoutL'))"));
run("selected='usb';inspect()");assert.match(app.document.querySelector('.badge').textContent,/汎用/);assert.doesNotMatch(app.document.querySelector('.badge').textContent,/実機写真/);
run("save()");app=boot('audio');assert.equal(app.run('state.edges.length'),4);assert.equal(app.run('validate(state)===state'),true);
// Generic and model-specific microphones can be exchanged with the XLR cable kept.
let proposal=app.run("planReplacement(state,'mic','sm58')");
assert.equal(proposal.complete,true);assert.equal(proposal.project.edges.length,4);assert.equal(proposal.project.edges[0].type,'XLR');
console.log('PASS: 3 audio additions; catalog filters and aliases; MG physical ports; MIC/LINE and TS/RCA exclusivity; stereo pair; microphone → mixer REC → USB capture → PC; JSON reload; generic labeling');
