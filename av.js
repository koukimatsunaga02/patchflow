'use strict';
function initializeUnifiedLibrary(storage,fallback,preferVideo=false){
 const key='patchflow-av-project-library-v1',library=new ProjectLibrary(storage,key);
 if(storage.getItem(key)){library.initialize(fallback);return library}
 let projects=[],trash=[],activeId=null;
 for(let [domain,oldKey] of [['audio','patchflow-project-library-v1'],['video','patchflow-video-project-library-v1']]){
  let raw=storage.getItem(oldKey);if(!raw){let legacy=storage.getItem(domain==='audio'?'patchflow-v1':'patchflow-video-v1');if(!legacy)continue;let data=JSON.parse(legacy);if(!Array.isArray(data.nodes))throw Error('以前の保存データを読み込めません');raw=JSON.stringify({version:1,activeId:'legacy',projects:[{id:'legacy',data}],trash:[]})}let old=JSON.parse(raw);
  if(old.version!==1||!Array.isArray(old.projects))throw Error('以前のプロジェクトを読み込めません');
  let copy=p=>({...p,id:domain+'_'+p.id,data:JSON.parse(JSON.stringify(p.data))});projects.push(...old.projects.map(copy));trash.push(...(old.trash||[]).map(copy));
  if(!activeId||(preferVideo&&domain==='video'))activeId=domain+'_'+old.activeId;
 }
 if(projects.length){if(!projects.some(p=>p.id===activeId))activeId=projects[0].id;library.commit({version:1,activeId,projects,trash})}else library.initialize(fallback);
 return library;
}
function unifiedDemo(){
 let a=audioDemo(),v=videoDemo(),offset=1850;for(let n of v.nodes)n.x+=offset;for(let g of v.groups)g.x+=offset;
 let groups=[...a.groups,...v.groups,{id:'bridge',name:'AUDIO → LIVE VIDEO',subtitle:'配信音声',x:1340,y:40,w:420,h:1050}];
 let nodes=[...a.nodes,...v.nodes,{id:'bridge_mix',group:'bridge',model:'mg10',name:'MG10XU · 配信ミックス',x:1430,y:135},{id:'vocal_mic',group:'bridge',model:'sm58',name:'SM58 · MC',x:1430,y:690}];
 let edges=[...a.edges,...v.edges,...[['m1','recL','bridge_mix','rca56L','RCA'],['m1','recR','bridge_mix','rca56R','RCA'],['bridge_mix','stL','switch','audio1','XLR'],['bridge_mix','stR','switch','audio2','XLR'],['vocal_mic','out','bridge_mix','in1','XLR']].map((e,i)=>({id:'av'+i,from:e[0],fp:e[1],to:e[2],tp:e[3],type:e[4],length:3}))];
 return{version:1,title:'Live Production — Audio + Video',domain:'av',canvas:{width:4800,height:3200},groups,nodes,edges,layers:{audio:true,video:true}};
}
function mediaLayer(port){return ['video','uvc','ptz_control'].includes(port.signal)?'video':'audio'}
function layers(){return state.layers||{audio:true,video:true}}
function visiblePort(p){return p.dir!=='io'&&(layers()[mediaLayer(p)]!==false||p.accept?.includes('usb_audio')&&layers().audio!==false)}
function visibleNode(n){if(!n)return false;let m=models[n.model];return m.ports.some(visiblePort)||!m.ports.some(p=>p.dir!=='io')&&layers().audio!==false}
function visibleEdge(e){let a=getport(e.from,e.fp),b=getport(e.to,e.tp);return a&&b&&visiblePort(a)&&visiblePort(b)&&visibleNode(node(e.from))&&visibleNode(node(e.to))}
function setMediaLayer(layer,visible){
 if(!['audio','video'].includes(layer))return;remember();state.layers={...layers(),[layer]:visible};pending=null;rewire=null;insertDraft=null;render();catalog();
}
function revealModel(key){state.layers={...layers(),[models[key].domain==='video'?'video':'audio']:true}}
function avCompatible(a,b){
 if(a.dir!=='out'||b.dir!=='in')return undefined;
 if(a.signal==='line'&&b.signal==='mic'&&!b.accept?.includes('line'))return 'LINE出力です。MIC/LINE対応入力、またはXLR→TRSでLINEフォーン入力を選んでください';
 if(a.signal==='ptz_control'||b.signal==='ptz_control')return a.signal===b.signal&&a.controlFamily===b.controlFamily?null:'PTZの制御方式が異なります。対応する操作盤とカメラのLAN端子を接続してください';
 if(a.signal==='line'&&b.signal==='line'&&b.acceptTS&&b.type==='TRS'&&a.type==='TS')return null;
 if(a.type==='MINI'||b.type==='MINI'){if(a.type!==b.type)return '3.5mmステレオ端子には対応するステレオケーブル・変換が必要です';return a.signal===b.signal||b.accept?.includes(a.signal)?null:'MIC / LINEの信号レベルが異なります。実機の入力切替を確認してください'}
 if(a.signal==='mic'&&b.signal==='mic'&&a.type==='XLR'&&b.type==='TRS'&&b.balancedMic)return null;
 if(a.signal==='usb_audio')return b.accept?.includes('usb_audio')||b.signal==='usb_audio'?null:'USB音声はPCのUSB IN（音声 / 映像）へ接続してください';
 if(a.signal==='line'&&b.signal==='line'&&a.type==='RCA'&&['TS','COMBO'].includes(b.type))return null;
 return undefined;
}
function avCableType(a,b){if(a.signal==='mic'&&b.signal==='mic'&&a.type==='XLR'&&b.type==='TRS'&&b.balancedMic)return 'XLR_MIC_TRS';if(a.signal==='ptz_control'&&b.signal==='ptz_control')return 'PTZ_LAN';if(a.type==='MINI'&&b.type==='MINI')return 'MINI';if(a.signal==='mic'&&b.signal==='mic'&&a.type==='XLR'&&b.type==='TRS'&&b.balancedMic)return null;
 if(a.signal==='line'&&b.acceptTS&&a.type==='TS'&&b.type==='TRS')return 'TS';if(a.signal==='usb_audio')return 'USB_AUDIO';if(a.signal==='line'&&b.signal==='line'&&a.type==='RCA'&&['TS','COMBO'].includes(b.type))return 'RCA_TS';return null}
function avProjectErrors(project){return (typeof audioSharedInputErrors==='function'?audioSharedInputErrors(project):[]).concat(project.nodes.filter(n=>models[n.model].exclusiveOutputs&&project.edges.filter(e=>e.from===n.id&&models[n.model].exclusiveOutputs.includes(e.fp)).length>1).map(n=>n.name+': USB接続中の3.5mm端子は監視用です。録音出力として同時使用できません'))}
function catalogAV(){
 let q=$('#search').value.toLowerCase(),entries=Object.entries(models).filter(([k,m])=>!m.legacy&&(filter==='all'||m.category===filter)&&(brandFilter==='all'||m.maker===brandFilter)&&(m.name+' '+m.maker+' '+(m.searchTerms||'')).toLowerCase().includes(q));let groups=new Map();
 for(let e of entries){let label=groupBy==='brand'?e[1].maker:categoryNames[e[1].category];if(!groups.has(label))groups.set(label,[]);groups.get(label).push(e)}
 $('#libcount').textContent=entries.length+' / '+Object.values(models).filter(m=>!m.legacy).length;$('#catalog').className='catalog-'+libraryView;
 for(let el of $$('[data-catalog-view]'))el.setAttribute('aria-pressed',String(el.dataset.catalogView===libraryView));
 if(libraryView==='table')$('#catalog').innerHTML='<table class="catalog-table"><thead><tr><th>機材</th><th>ブランド / 種類</th><th>入 / 出</th></tr></thead><tbody>'+[...groups].map(([label,es])=>`<tr class="catalog-section"><th colspan="3">${esc(label)} · ${es.length}</th></tr>`+es.map(([k,m])=>`<tr data-add="${k}" tabindex="0" title="クリックで追加・ドラッグで配置" aria-label="${esc(m.name)}を追加"><td><img src="${m.img}" alt=""><b>${esc(m.name)}</b></td><td>${esc(m.maker)}<small>${categoryNames[m.category]}</small></td><td>${m.ports.filter(p=>p.dir==='in').length} / ${m.ports.filter(p=>p.dir==='out').length}<span>＋</span></td></tr>`).join('')).join('')+'</tbody></table>';
 else $('#catalog').innerHTML=[...groups].map(([label,es])=>`<h3 class="catalog-group">${esc(label)}<span>${es.length}</span></h3>`+es.map(([k,m])=>`<article class="product" data-add="${k}" tabindex="0" role="button" aria-label="${esc(m.name)}を追加"><div class="productpic"><img src="${m.img}" alt="${esc(m.name)} ${m.generic?'汎用イラスト':'実機写真'}"><span class="add">＋</span></div><div class="maker">${esc(m.maker)}<span class="tag">${m.domain==='video'?'VIDEO / AV':'AUDIO'}</span></div><h3>${esc(m.name)}</h3><small>${m.ports.filter(p=>p.dir==='in').length} 入力 / ${m.ports.filter(p=>p.dir==='out').length} 出力</small></article>`).join('')).join('');
 if(!entries.length)$('#catalog').innerHTML='<p class="empty">該当する機材がありません。</p>';
 $$('[data-add]').forEach(el=>{el.onpointerdown=e=>startLibraryEquipmentDrag(e,el);el.onclick=()=>{if(Date.now()<Number(el.dataset.skipClickUntil||0))return;add(el.dataset.add)};el.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();add(el.dataset.add)}}});
}
function audioInfoHTML(n){
 let m=models[n.model];if(!m.audioInfo)return '';
 let analog=m.ports.filter(p=>['line','mic','stereo_line','stereo_mic'].includes(p.signal));let inputs=analog.filter(p=>p.dir==='in'),outputs=analog.filter(p=>p.dir==='out');
 return `<section class="audio-info"><h3>♫ スイッチャーの音声</h3><p>48 kHz · HDMI / SDI / USB映像に音声を重畳</p><div class="specrow"><span>音声入力（物理端子）</span><b>${inputs.length}</b></div><div class="specrow"><span>独立したLINE出力</span><b>${outputs.length}</b></div>${!outputs.length?'<p>独立したアナログLINE出力はありません。映像出力に音声を含めて送ります。</p>':''}${m.ports.filter(p=>p.embeddedAudio&&p.dir==='out').slice(0,5).map(p=>`<div class="specrow"><span>${esc(p.label)}</span><span>${p.embeddedAudio.channels} ch / 48 kHz</span></div>`).join('')}<p>MIC / LINE切替・ゲイン・AFV・ミックスは実機で設定してください。実際の音量・信号検出は行いません。</p></section>`;
}
function mergeProjectIntoCanvas(incoming){
 let src=validate(JSON.parse(JSON.stringify(incoming))),next=JSON.parse(JSON.stringify(state)),prefix='merge'+Date.now().toString(36)+Math.random().toString(36).slice(2,5)+'_',idMap=new Map(src.nodes.map(n=>[n.id,prefix+n.id])),groupMap=new Map((src.groups||[]).map(g=>[g.id,prefix+g.id]));
 let right=Math.max(0,...next.nodes.map(n=>n.x+215),...(next.groups||[]).map(g=>g.x+g.w)),minX=Math.min(0,...src.nodes.map(n=>n.x),...(src.groups||[]).map(g=>g.x)),dx=right+140-minX;
 next.nodes.push(...src.nodes.map(n=>({...n,id:idMap.get(n.id),group:groupMap.get(n.group)||'',x:n.x+dx})));next.groups.push(...(src.groups||[]).map(g=>({...g,id:groupMap.get(g.id),x:g.x+dx})));
 next.edges.push(...src.edges.map(e=>({...e,id:prefix+e.id,from:idMap.get(e.from),to:idMap.get(e.to)})));
 next.canvas={width:Math.max(next.canvas.width,...next.nodes.map(n=>n.x+260),...next.groups.map(g=>g.x+g.w+30)),height:Math.max(next.canvas.height,src.canvas?.height||3200)};next.layers={audio:true,video:true};validate(next);return next;
}
function initializeAVWorkspace(){
 document.body.classList.remove('video-mode');document.body.classList.add('av-mode');document.title='PATCHFLOW | 音響・映像 配線エディター';$('.version').textContent='v1.2 · STUDIO';
 for(let layer of ['audio','video'])$('[data-layer="'+layer+'"]').onclick=()=>setMediaLayer(layer,layers()[layer]===false);
 $('#sixpreset').textContent='6DJ構成';$('#videopreset').onclick=()=>{remember();state=videoDemo();selected='switch';selectedEdge=null;render();fitCanvas()};
 $('#emptycanvas h2').textContent='音も、映像も、ここからつなごう。';if($('.future'))$('.future').innerHTML='▧ <div>AUDIO + VIDEO<small>一つのキャンバスで、すべての経路を。</small></div>';
 $('#modelscope').textContent='音声と映像の端子を一つのキャンバスで接続。非表示の機材・配線も保存されます。';
 for(let view of ['grid','table'])$('[data-catalog-view="'+view+'"]').onclick=()=>{libraryView=view;try{localStorage.setItem('patchflow-catalog-view',view)}catch{}catalog()};
}
function syncAVControls(){
 for(let layer of ['audio','video']){let el=$('[data-layer="'+layer+'"]');if(el){el.setAttribute('aria-pressed',String(layers()[layer]!==false));el.classList.toggle('active',layers()[layer]!==false)}}
 if(selected&&!visibleNode(node(selected)))selected=null;
}
