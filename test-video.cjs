const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('dist/app.js','utf8'),video=fs.readFileSync('dist/video-models.js','utf8');
const slices=[src.slice(0,src.indexOf('try{state=JSON.parse')),src.slice(src.indexOf('const node=id'),src.indexOf('function catalog')),src.slice(src.indexOf('function compatible'),src.indexOf('function connect(')),src.slice(src.indexOf('function validate('),src.indexOf("$('#file').onchange")),src.slice(src.indexOf('function cableType('),src.indexOf('function renderRouteEditor(')),src.slice(src.indexOf('function canvasSize('),src.indexOf('function syncCanvasSize('))];
const context=vm.createContext({assert,structuredClone,console,location:{search:'?mode=video'},URLSearchParams,document:{querySelector:()=>({offsetHeight:300})}});
vm.runInContext(video+'\n'+slices.join('\n')+'\n'+fs.readFileSync('dist/replacement.js','utf8')+`
function render(){}function toast(){}function remember(){history.push(JSON.stringify(state))}
assert.equal(isVideo,true);state=demo();assert.equal(validate(state),state);assert.equal(state.nodes.length,8);assert.equal(state.edges.length,7);
const p=(key,id)=>models[key].ports.find(p=>p.id===id);
assert.equal(models.v_atem_mini_extreme_iso_g2.ports.filter(p=>p.type==='HDMI'&&p.dir==='in').length,8);
assert.equal(models.v_atem_mini_extreme_iso_g2.ports.filter(p=>p.type==='HDMI'&&p.dir==='out').length,3);
assert.equal(models.v_atem_sdi_extreme_iso.ports.filter(p=>p.type==='SDI'&&p.dir==='out').length,4);
assert.equal(models.v_atem_4_m_e_constellation_4k_plus.ports.filter(p=>p.type==='SDI'&&p.dir==='in').length,80);
assert.equal(models.v_atem_4_m_e_constellation_4k_plus.ports.filter(p=>p.type==='SDI'&&p.dir==='out').length,52);
assert.equal(models.v_atem_1_m_e_constellation_hd.ports.filter(p=>p.type==='SDI'&&p.dir==='out').length,7);
assert.equal(compatible(p('v_a6400','hdmi'),p('v_atem_mini_pro','hdmiin1')),null);
assert.equal(cableType(p('v_a6400','hdmi'),p('v_atem_mini_pro','hdmiin1')),'HDMI_MICRO');
assert.match(compatible(p('v_z150','sdi'),p('v_atem_mini_pro','hdmiin1')),/変換器/);
assert.match(compatible(p('v_z150','hdmi'),p('v_stream_pc','uvc1')),/キャプチャー/);
assert.equal(models.v_v1hd.ports.some(p=>p.type==='UVC'),false);
assert.deepEqual(p('v_vr4hd','usb').formats,['1080p25','1080p29.97']);
assert.match(videoEdgeError(p('v_a6400','hdmi'),p('v_atem_mini_pro','hdmiin1'),{format:'2160p29.97'}),/対応/);
assert.equal(videoEdgeError(p('v_z150','hdmi'),p('v_micro_converter_hdmi_to_sdi_12g','hdmiin'),{format:'2160p29.97'}),null);
let bad=structuredClone(state);bad.edges[0].format='2160p29.97';assert.throws(()=>validate(bad),/接続/);
bad=structuredClone(state);bad.edges.push({...bad.edges[0],id:'duplicate'});assert.throws(()=>validate(bad),/二重/);
const swap=planReplacement(state,'switch','v_atem_mini_pro');assert.equal(swap.complete,false);assert.equal(state.nodes.find(n=>n.id==='switch').model,'v_atem_mini_extreme_iso_g2');
const good=planReplacement(state,'switch','v_atem_mini_extreme');assert.equal(good.complete,true);assert.equal(good.project.edges.length,7);assert.equal(validate(good.project).nodes.find(n=>n.id==='switch').x,760);
state.nodes.push({id:'sdi',model:'v_micro_converter_sdi_to_hdmi_3g',name:'SDI converter',group:'',x:1800,y:100});
rewire={edge:'ve0',end:'to'};const old=JSON.stringify(state);commitRewire('sdi','sdiin');assert.equal(JSON.stringify(state),old);commitRewire('switch','hdmiin5');assert.equal(state.edges[0].tp,'hdmiin5');assert.equal(state.edges[0].format,'1080p59.94');
state=demo();selectedEdge='ve4';insertDraft={target:'new:v_atem_mini_pro',stereo:false};applyInsert();assert.equal(state.edges.length,8);assert.equal(state.nodes.at(-1).group,'');assert.equal(validate(state),state);
state={version:1,title:'SDI conversion',nodes:[{id:'z',model:'v_z150',name:'Z150',x:40,y:40},{id:'c',model:'v_micro_converter_sdi_to_hdmi_3g',name:'converter',x:400,y:40},{id:'a',model:'v_atem_mini_pro',name:'ATEM',x:800,y:40}],edges:[{id:'s',from:'z',fp:'sdi',to:'c',tp:'sdiin',type:'SDI',length:20,format:'1080p59.94'},{id:'h',from:'c',fp:'hdmiout',to:'a',tp:'hdmiin1',type:'HDMI',length:3,format:'1080p59.94'}],groups:[]};
assert.equal(validate(state),state);assert.equal(videoGraphWarnings(state).length,0);state.edges[1].format='1080p25';assert.match(videoGraphWarnings(state)[0],/変更できません/);
assert.equal(validate(JSON.parse(JSON.stringify(state))).edges.length,2);
for(let [key,m] of Object.entries(videoModels)){assert.ok(m.ports.length);assert.equal(new Set(m.ports.map(p=>p.id)).size,m.ports.length,key);assert.ok(fsExists(m.img),key+' image');assert.ok(m.visible.every(id=>m.ports.some(p=>p.id===id)),key+' visible ports')}
`,contextWithFs(context));
function contextWithFs(c){c.fsExists=p=>fs.existsSync('dist/'+p);return c}
console.log('PASS: video port counts, HDMI/micro/SDI isolation, capture requirement, formats, duplicate rejection, replacement shortage, rewire rollback, insert, converter rates and saved JSON');
