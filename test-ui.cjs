// DOM integration tests; layout is stubbed. Requires linkedom; not visual browser QA.
const {parseHTML}=require('linkedom'),fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=require('node:path').join(__dirname,'dist');
const shared=new Map();
function boot(mode){
const {window,document}=parseHTML(fs.readFileSync(root+'/editor.html','utf8'));let frames=[];
Object.defineProperty(document,'activeElement',{get:()=>document.body});
for(const axis of ['scrollLeft','scrollTop'])Object.defineProperty(window.HTMLElement.prototype,axis,{configurable:true,get(){return this['_'+axis]||0},set(v){this['_'+axis]=Math.max(0,Number(v)||0)}});
Object.defineProperty(window.HTMLElement.prototype,'offsetHeight',{configurable:true,get(){return this.id==='canvaswrap'?650:350}});
Object.defineProperty(window.HTMLElement.prototype,'clientWidth',{configurable:true,get(){return this.id==='canvaswrap'?1280:215}});
Object.defineProperty(window.HTMLElement.prototype,'clientHeight',{configurable:true,get(){return this.id==='canvaswrap'?650:350}});
Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){let o=this.querySelector('option[selected]')||this.querySelector('option');return o?(o.getAttribute('value')??o.textContent):''},set(v){for(const o of this.querySelectorAll('option'))o.toggleAttribute('selected',(o.getAttribute('value')??o.textContent)===v)}});
window.HTMLElement.prototype.getBoundingClientRect=function(){return{left:0,top:0,width:215,height:350}};
window.HTMLElement.prototype.showModal=function(){this.open=true;this.setAttribute('open','')};
window.HTMLElement.prototype.close=function(){this.open=false;this.removeAttribute('open');this.dispatchEvent(new window.Event('close'))};
const localStorage={getItem:k=>shared.get(k)||null,setItem:(k,v)=>shared.set(k,v),removeItem:k=>shared.delete(k)};
const ctx=vm.createContext({document,window,location:{search:mode==='video'?'?mode=video':'?mode=audio'},localStorage,console,URLSearchParams,structuredClone,requestAnimationFrame:cb=>{frames.push(cb)},setTimeout:()=>1,clearTimeout(){},Blob,URL,fetch:async()=>({json:async()=>JSON.parse(fs.readFileSync(root+'/presets/six-deck.json'))})});
for(const f of ['cable-segments.js','cable-editor.js','cables.js','projects.js','replacement.js','video-models.js','booths.js','app.js'])vm.runInContext(fs.readFileSync(root+'/'+f,'utf8'),ctx,{filename:f});
function flush(){let run=frames;frames=[];for(let f of run)f()}
flush();return {ctx,document,flush,run:c=>vm.runInContext(c,ctx),click:selector=>{let el=document.querySelector(selector);assert.ok(el,selector);el.click();flush()},change:(selector,value)=>{let el=document.querySelector(selector);assert.ok(el,selector);el.value=value;el.dispatchEvent(new window.Event('change'));flush()}};
}
let video=boot('video');assert.equal(video.document.querySelectorAll('.node').length,8);assert.equal(video.document.querySelectorAll('.wirehit').length,7);assert.ok(video.document.body.classList.contains('video-mode'));assert.equal(video.document.querySelectorAll('[data-add]').length,37);
video.click('[data-replace="switch"]');assert.ok(video.document.querySelector('#replacementdialog').open);video.change('#replacementmodel','v_atem_mini_pro');assert.equal(video.document.querySelector('#applyreplacement').disabled,true);video.change('#replacementmodel','v_atem_mini_extreme');assert.equal(video.document.querySelector('#applyreplacement').disabled,false);video.click('#applyreplacement');assert.equal(video.run("node('switch').model"),'v_atem_mini_extreme');video.click('#undo');assert.equal(video.run("node('switch').model"),'v_atem_mini_extreme_iso_g2');
video.click('[data-edge="ve0"]');assert.ok(video.document.querySelector('#routeeditor').textContent.includes('接続先を変更'));video.click('#inspectortoggle');assert.ok(video.document.querySelector('#videoformat'));video.change('#videoformat','1080p50');assert.equal(video.run('state.edges[0].format'),'1080p50');video.click('#routedelete');assert.equal(video.document.querySelectorAll('.wirehit').length,6);video.click('#undo');assert.equal(video.document.querySelectorAll('.wirehit').length,7);
video.click('#guidebutton');assert.ok(video.document.querySelector('#guidecontent').textContent.includes('HDMI'));assert.equal(video.document.querySelectorAll('[data-guide]').length,4);video.click('#closeguide');
video.click('#projectsbutton');assert.equal(video.document.querySelector('#newprojecttemplate option[value="six"]'),null);video.click('#closeprojects');video.change('#categoryfilter','camera');assert.equal(video.document.querySelectorAll('[data-add]').length,3);video.change('#categoryfilter','all');video.change('#brandfilter','Roland');assert.equal(video.document.querySelectorAll('[data-add]').length,2);
let videoTitle=video.run("state.title='映像テストプロジェクト';save();state.title");let audio=boot('audio');assert.equal(audio.document.querySelectorAll('.node').length,8);assert.equal(audio.document.querySelectorAll('.wirehit').length,9);assert.equal(audio.document.querySelectorAll('[data-add]').length,28);audio.run("state.title='音響テストプロジェクト';save()");video=boot('video');assert.equal(video.run('state.title'),videoTitle);audio=boot('audio');assert.equal(audio.run('state.title'),'音響テストプロジェクト');
console.log('PASS: full Audio/Video DOM initialization, 37 video models, replacement dialog + apply/undo, wire select/edit/delete/undo, format control, illustrated guide, mode-specific projects, category/brand filters, persistent mode isolation');

function pointer(app,type,x,y){let ev=new app.ctx.window.Event(type,{bubbles:true,cancelable:true});Object.assign(ev,{clientX:x,clientY:y,button:0,pointerId:9,pointerType:'mouse'});return ev}
function beginDrag(app,id,x,y){let el=app.document.querySelector(`.node[data-id="${id}"]`);el.querySelector('.nodehead').onpointerdown(pointer(app,'pointerdown',x,y));return el}
function sendPointer(app,type,x,y){app.document.dispatchEvent(pointer(app,type,x,y));app.flush()}
for(const mode of ['audio','video']){
 let app=boot(mode),id=mode==='video'?'cam1':'p1';
 app.run(`state=demo();state.nodes.forEach(n=>n.group='');state.groups=[{id:'target',name:'DROP BOOTH',x:400,y:200,w:300,h:230},{id:'other',name:'OTHER BOOTH',x:900,y:200,w:300,h:230}];render();setZoom(1)`);app.flush();
 app.document.querySelector('#canvaswrap').getBoundingClientRect=()=>({left:100,top:80,width:1280,height:650});app.document.querySelector('#board').getBoundingClientRect=()=>({left:100,top:80,width:4800,height:3200});
 app.document.querySelector('#equipmenttrash').getBoundingClientRect=()=>({left:1240,top:650,width:116,height:64});
 beginDrag(app,id,220,235);sendPointer(app,'pointermove',750,390);
 assert.equal(app.run(`node('${id}').group`),'');assert.equal(app.run("state.groups[0].w"),300);assert.ok(app.document.querySelector('.zone[data-group="target"]').classList.contains('booth-drop-ready'));assert.ok(parseFloat(app.document.querySelector('.zone[data-group="target"]').style.width)>300);
 sendPointer(app,'pointerup',750,390);assert.equal(app.run(`node('${id}').group`),'target');assert.ok(app.run('state.groups[0].w')>300);assert.ok(app.run(`state.groups[0].y+state.groups[0].h>=node('${id}').y+350`));assert.equal(app.run('validate(state)===state'),true);
 // One undo restores the position, membership, and original Booth frame together.
 app.click('#undo');assert.equal(app.run(`node('${id}').group`),'');assert.equal(app.run('state.groups[0].w'),300);
 beginDrag(app,id,220,235);sendPointer(app,'pointermove',750,390);sendPointer(app,'pointerup',750,390);
 let pose=app.run(`JSON.stringify(node('${id}'))`),depth=app.run('history.length');beginDrag(app,id,750,390);sendPointer(app,'pointermove',1180,390);assert.ok(app.document.querySelector('.zone[data-group="other"]').classList.contains('booth-drop-ready'));
 let escape=new app.ctx.window.Event('keydown',{bubbles:true,cancelable:true});escape.key='Escape';app.document.dispatchEvent(escape);app.flush();assert.equal(app.run(`JSON.stringify(node('${id}'))`),pose);assert.equal(app.run('history.length'),depth);assert.equal(app.document.querySelector('.booth-drop-ready'),null);
 // Transfer to another Booth, then drag out into empty canvas space.
 beginDrag(app,id,750,390);sendPointer(app,'pointermove',1180,390);sendPointer(app,'pointerup',1180,390);assert.equal(app.run(`node('${id}').group`),'other');
 beginDrag(app,id,1180,390);sendPointer(app,'pointermove',160,580);sendPointer(app,'pointerup',160,580);assert.equal(app.run(`node('${id}').group`),'');
 let before=app.run('JSON.stringify(state)'),count=app.run('state.nodes.length'),wires=app.run('state.edges.length');beginDrag(app,id,160,580);sendPointer(app,'pointermove',1298,682);assert.ok(app.document.querySelector('#equipmenttrash').classList.contains('drop-ready'));sendPointer(app,'pointerup',1298,682);assert.equal(app.run('state.nodes.length'),count-1);assert.ok(app.run('state.edges.length')<wires);assert.equal(app.run('validate(state)===state'),true);app.click('#undo');assert.equal(app.run('JSON.stringify(state)'),before);
 // Pointer cancel rolls back without leaving a history entry.
 beginDrag(app,id,160,580);sendPointer(app,'pointermove',750,390);sendPointer(app,'pointercancel',750,390);assert.equal(app.run('JSON.stringify(state)'),before);
 // The geometry works at non-100% zoom and chooses the smallest overlapping Booth.
 assert.equal(app.run("findBoothDrop([{id:'large',x:0,y:0,w:900,h:700},{id:'small',x:100,y:100,w:200,h:200}],{x:150,y:150}).id"),'small');
 assert.equal(app.run('JSON.stringify(fitBoothRect({x:50,y:50,w:200,h:200},[{x:4700,y:3090,w:215,h:350}],{width:4800,height:3200}))'),JSON.stringify({x:50,y:50,w:4750,h:3150}));
 app.run('zoom=.5');assert.equal(app.run('canvasDropPoint({clientX:350,clientY:280}).x'),500);app.run('zoom=1');
 // Library drag creates exactly one device, while a click still adds an ungrouped device.
 app.run("setDrawer('library',true)");app.document.querySelector('.library').getBoundingClientRect=()=>({left:0,top:0,width:280,height:900});
 let model=mode==='video'?'v_a6400':'cdjx',card=app.document.querySelector(`[data-add="${model}"]`),originalCount=app.run('state.nodes.length');card.onpointerdown(pointer(app,'pointerdown',150,180));sendPointer(app,'pointermove',750,390);assert.ok(app.document.querySelector('.equipment-drag-ghost'));sendPointer(app,'pointerup',750,390);assert.equal(app.run('state.nodes.length'),originalCount+1);assert.equal(app.run('state.nodes.at(-1).group'),'target');assert.equal(app.document.querySelector('.equipment-drag-ghost'),null);card.click();assert.equal(app.run('state.nodes.length'),originalCount+1);
 let saved=app.run('JSON.stringify(state)');card.onpointerdown(pointer(app,'pointerdown',150,180));sendPointer(app,'pointermove',170,200);sendPointer(app,'pointerup',170,200);assert.equal(app.run('JSON.stringify(state)'),saved);
 app.run('save()');let reloaded=boot(mode);assert.equal(reloaded.run('state.nodes.at(-1).group'),'target');assert.equal(reloaded.run('state.groups[0].w'),app.run('state.groups[0].w'));
}
console.log('PASS: Audio/Video pointer drags, Booth preview + auto-fit, membership transfer/detach, exact Undo, trash deletion with cable restore, Escape/cancel, zoom geometry, library drop/click suppression and persisted Booth sizing');
