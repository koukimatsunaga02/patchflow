const {boot,shared,assert,fs,vm,root}=require('./test-av-ui.cjs');
shared.clear();let a=boot('audio');
a.run(`state={version:1,title:'Near origin',canvas:{width:4800,height:3200},nodes:[{id:'a',model:'sm58',name:'Mic',x:10,y:20}],edges:[],groups:[]};render();fitCanvas()`);a.flush();
let v=a.document.querySelector('#canvaswrap');
let center=a.run(`({x:canvasPadding().x+(contentBounds().x+contentBounds().w/2)*zoom-$('#canvaswrap').scrollLeft,y:canvasPadding().y+(contentBounds().y+contentBounds().h/2)*zoom-$('#canvaswrap').scrollTop})`);
assert.ok(Math.abs(center.x-v.clientWidth/2)<1);assert.ok(Math.abs(center.y-v.clientHeight/2)<1,'fit centres content even at world origin');
let worldBefore=a.run(`({x:($('#canvaswrap').scrollLeft+300-canvasPadding().x)/zoom,y:($('#canvaswrap').scrollTop+200-canvasPadding().y)/zoom})`);
a.run('setZoom(1.5,{x:300,y:200})');a.flush();let worldAfter=a.run(`({x:($('#canvaswrap').scrollLeft+300-canvasPadding().x)/zoom,y:($('#canvaswrap').scrollTop+200-canvasPadding().y)/zoom})`);
assert.ok(Math.abs(worldBefore.x-worldAfter.x)<.001);assert.ok(Math.abs(worldBefore.y-worldAfter.y)<.001,'zoom retains its world anchor');
a.click('#librarytoggle');a.run('fitCanvas()');a.flush();assert.equal(a.document.querySelector('#librarytoggle').getAttribute('aria-pressed'),'true');a.click('#libraryclose');assert.equal(a.document.querySelector('#librarytoggle').getAttribute('aria-pressed'),'false');
a.ctx.MutationObserver=a.ctx.window.MutationObserver;vm.runInContext(fs.readFileSync(root+'/studio.js','utf8'),a.ctx);a.run('initializeStudio()');a.click('#commandbutton');assert.ok(a.document.querySelector('.command-dialog[open]'));let search=a.document.querySelector('input[aria-label="操作を検索"]');search.value='中央';search.dispatchEvent(new a.ctx.window.Event('input'));assert.equal(a.document.querySelectorAll('[data-command]').length,1);a.click('[data-command="0"]');assert.equal(a.document.querySelector('.command-dialog'),null);
// Local selection is not forced back to the first node after a render.
a.run('selected=null;render()');assert.equal(a.run('selected'),null);
a.run('state.camera=captureCamera()');let camera=a.run('structuredClone(state.camera)');Object.defineProperty(v,'clientWidth',{value:820,configurable:true});Object.defineProperty(v,'clientHeight',{value:1180,configurable:true});a.run('restoreCamera()');let restored=a.run('captureCamera()');assert.ok(Math.abs(restored.cx-camera.cx)<.001);assert.ok(Math.abs(restored.cy-camera.cy)<.001,'saved camera keeps its world centre across device sizes');
console.log('PASS: origin-centred fit, world-anchored zoom, explicit library close, searchable command palette, preserved deselection');
