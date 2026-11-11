'use strict';
// Rental availability evidence: PANDA TIMES product widgets. Actual stock is not queried.
function registerRentalModels(models,port,stereo){
 const hd=['1080p59.94','1080p50','1080p29.97','1080p25','1080p23.98','1080p60','1080p30','1080p24'];
 const inter=['1080i59.94','1080i50','720p59.94','720p50'];
 const uhd=['2160p29.97','2160p25','2160p23.98','2160p30','2160p24'];
 const video=(id,label,dir,type,formats=hd,extra={})=>port(id,label,dir,type,'video',{formats:[...formats],embeddedAudio:{channels:2,sampleRate:48000},...extra});
 const bank=(prefix,label,dir,type,count,formats=hd)=>Array.from({length:count},(_,i)=>video(prefix+(i+1),label+' '+(i+1),dir,type,formats));
 const mic=(i)=>port('audio'+i,'AUDIO IN '+i+' MIC/LINE','in','COMBO','line',{accept:['line','mic']});
 const phones=(id='phones',label='PHONES 6.35mm')=>port(id,label,'out','HEADPHONE','headphone');
 const add=(key,name,maker,category,source,rental,ports,note,extra={})=>models[key]={name,maker,category,domain:'video',source,rental:'https://panda-times.com/archives/'+rental,img:'assets/rental_'+key+'.webp',ports,visible:ports.filter(p=>p.dir!=='io').slice(0,4).map(p=>p.id),photoSource:({split:'https://www.mlinc.co.jp/rental/0409/',jvc:'https://www.fujiya-camera.co.jp/shop/g/gC2120158107654/',jvcctl:'https://broadcasteurope.de/shop/1387-ptz-controllers/22904-jvc-rm-lp100e-ptz-camera-remote/'})[key]||source,desc:category==='ptzController'?'PTZカメラ操作盤':category==='ptzCamera'?'PTZリモートカメラ':category==='splitter'?'HDMI 1入力・4分配':'ライブ映像・音声スイッチャー',note:note+' PANDA掲載確認：2026-11-06。予約時の在庫・付属品はレンタルサイトで確認。電源・タリー・同期・シリアル制御は配線対象外。',...extra};
 let s=add('split','VSP-HD14BK','ELECOM','splitter','https://www.elecom.co.jp/products/VSP-HD14BK.html',41332,[video('in','HDMI IN','in','HDMI',[...hd,...inter,...uhd]),...bank('out','HDMI OUT','out','HDMI',4,[...hd,...inter,...uhd])],'HDMI Type A×1入力・4出力。4Kは30pまで。全出力は入力と同じ映像・音声を分配し、解像度は変換しません。EDID・HDCPは実機で確認。',{passthrough:true});s.visible=s.ports.map(p=>p.id);
 for(let [key,name,hi,si,ho,so,rental,combo] of [['v8','V-8HD',8,0,3,0,73591,0],['v80','V-80HD',4,4,3,2,43612,2],['v160','V-160HD',8,8,3,3,2114,2],['vr120','VR-120HD',6,6,3,3,43534,6]]){
  let ports=[...bank('hdmiin','HDMI IN','in','HDMI',hi,[...hd,...inter]),...bank('sdiin','SDI IN','in','SDI',si,[...hd,...inter]),...bank('hdmiout','HDMI OUT','out','HDMI',ho,hd),...bank('sdiout','SDI OUT','out','SDI',so,hd)];
  if(key==='v80'){
   for(let p of ports)if(['hdmiin3','hdmiin4'].includes(p.id))p.formats.push(...uhd,'2160p59.94','2160p60','2160p50');
   for(let i of [3,4])ports.push(video('thru'+i,'HDMI IN '+i+' THRU','out','HDMI',[...hd,...inter,...uhd,'2160p59.94','2160p60','2160p50'],{passthroughInput:'hdmiin'+i}));
  }
  if(key!=='v8')ports.push(port('usb','USB-C STREAM','out','UVC','uvc',{formats:[...hd],embeddedAudio:{channels:2,sampleRate:48000}}));
  ports.push(...Array.from({length:combo},(_,i)=>mic(i+1)),...stereo('rca','AUDIO IN RCA','in','RCA'));
  if(key==='vr120')ports.push(...stereo('rca2','AUDIO IN 9/10 RCA','in','RCA'),...stereo('main','AUDIO OUT 1 XLR','out','XLR'),...stereo('aux','AUDIO OUT 2 XLR','out','XLR'),...stereo('rcaout','AUDIO OUT 3 RCA','out','RCA'),phones(),phones('phonesmini','PHONES 3.5mm'));
  else if(key==='v8')ports.push(...stereo('rcaout','AUDIO OUT RCA','out','RCA'),phones('phones','PHONES 3.5mm'));
  else {ports.push(...stereo('main','AUDIO OUT XLR','out','XLR'),phones());if(key==='v160')ports.push(...stereo('rcaout','AUDIO OUT RCA','out','RCA'))}
  let note=key==='v8'?'USB A/Bはメモリー・制御専用。USB映像出力はありません。':key==='vr120'?'HDMI×6とSDI×6の計12系統入力。映像ソースのクロスポイント割当ては実機で設定。':key==='v80'?'HDMI IN 3/4は4K入力とTHRUに対応。PGM等の映像出力はHDです。THRUは同番号入力をそのまま出力。':'HDMI×8・SDI×8入力。USB-Cから配信PCへ映像・音声を出力。';
  let m=add(key,name,'Roland','switcher','https://proav.roland.com/global/products/'+name.toLowerCase()+'/',rental,ports,note+' アナログ音声は内部ミキサーで設定し、映像に重畳。対応フォーマットはHD/UHDの代表的な配信形式を収録。システム周波数・内部割当て・HDCPは実機で確認。',{audioInfo:{sampleRate:48000}});
  for(let p of m.ports)if(p.type==='SDI'&&p.dir==='out')p.embeddedAudio.channels=8;
  m.visible=[ports[0].id,...ports.filter(p=>p.dir==='out'&&p.signal==='video').slice(0,2).map(p=>p.id),...ports.filter(p=>p.signal==='line'&&p.dir==='in').slice(0,2).map(p=>p.id)];
 }
 const control=(family,dir)=>port('lan','LAN · '+family,dir,'PTZ_LAN','ptz_control',{controlFamily:family});
 let common='LANは制御用の1物理ポートとして表示。矢印は操作コマンドの方向です。複数カメラの制御には別途ネットワークスイッチが必要。IPアドレス・ファームウェアは実機で確認。IP映像・PoE給電は現在対象外。';
 const pairs=[['canon','canonctl','Canon','CR-N500','RC-IP100','Canon XC',2578,'https://canon.jp/biz/product/camera/pro-imaging/remotecam/lineup/crn500/spec','https://canon.jp/biz/product/camera/pro-imaging/remotecam/accessory/rcip100'],['sony','sonyctl','SONY','BRC-X1000','RM-IP500','VISCA over IP',70204,'https://www.sony.jp/brc/products/BRC-X1000/','https://www.sony.jp/brc/products/RM-IP500/'],['pana','panactl','Panasonic','AW-HE50SN','AW-RP50N','Panasonic AW-IP',48597,'https://pro-av.panasonic.net/manual/pdf/AW-HE50HNSN%283TR006787BAA%29_EJ.pdf','https://partner.connect.panasonic.com/jp-ja/products-services/lineup/AW-RP50N'],['jvc','jvcctl','JVC','KY-PZ400NB','RM-LP100','JVC IP',2578,'https://www.jvc.com/jp/pro/video/lineup/ky-pz400n/','https://www.jvc.com/jp/pro/video/lineup/rm-lp100/']];
 for(let [key,ctl,maker,name,ctln,family,rental,source,ctlsource] of pairs){
  let ports=[control(family,'in')],note='';
  if(key==='pana'){ports.push(video('sdi','HD/SD-SDI OUT','out','SDI',['1080i59.94','1080i50','720p59.94','720p50']));note='SDIモデル。HDMI端子なし。HDは1080i/720pで、1080pには対応しません。アナログ映像は対象外。'}
  else{
   ports.push(video('hdmi','HDMI OUT','out','HDMI',[...hd,...uhd]));
   if(key==='sony'){ports.push(...bank('sdi','SDI LINE OUT','out','SDI',2,hd),...bank('monitor','SDI MONITOR OUT','out','SDI',2,hd));note='HDMI×1、SDI LINE×2・MONITOR×2。SDIはHD単線モードのみモデル化。4Kデュアルリンク・RAWは対象外。HDMI/SDIの実機出力モードは確認してください。'}
   else ports.push(video('sdi','3G-SDI OUT','out','SDI',hd));
   if(key==='canon'){ports.push(...[1,2].map(i=>port('audio'+i,'XLR INPUT '+i,'in','XLR','line',{accept:['mic','line']})),port('mini','MIC 3.5mm','in','MINI','stereo_mic'));note='HDMI 4K30p、SDI HD60p。SDIとHDMIは同一の出力フォーマット。4K HDMI時にHD SDIを同時出力する構成は不可。'}
   if(key==='jvc'){ports.push(port('audio','LINE IN 3.5mm','in','MINI','stereo_line'),port('audioout','LINE OUT 3.5mm','out','MINI','stereo_line'));note='HDMI 4K30p、SDI HD60p。USB Type Aはメンテナンス用でUVC出力はありません。HDMI/SDIの有効出力・同時出力条件はSYSTEM SELECTと実機設定を確認。'}
  }
  if(['canon','sony'].includes(key))note+=' 写真は黒・白のカラーバリエーション。';
  let cam=add(key,name,maker,'ptzCamera',source,rental,ports,note+' 対応操作盤：'+ctln+'。'+common,{controlFamily:family,sameVideoFormat:key==='canon'});cam.visible=['lan',...ports.filter(p=>p.signal==='video').slice(0,2).map(p=>p.id)];
  add(ctl,ctln,maker,'ptzController',ctlsource,rental,[control(family,'out')],'対応カメラ：'+name+'。LAN×1。映像入力・映像出力ではありません。'+common,{controlFamily:family});
 }
}
function rentalGraphWarnings(project){
 let result=[];
 for(let n of project.nodes){let m=models[n.model],ins=project.edges.filter(e=>e.to===n.id),outs=project.edges.filter(e=>e.from===n.id);for(let out of outs){let p=m.ports.find(p=>p.id===out.fp);if(!m.passthrough&&!p.passthroughInput)continue;let input=ins.find(e=>e.tp===(p.passthroughInput||'in'));if(!input)result.push(n.name+': 分配・THRU元の入力が未接続');else if((input.format||defaultVideoFormat(getport(input.from,input.fp),getport(input.to,input.tp)))!==(out.format||defaultVideoFormat(getport(out.from,out.fp),getport(out.to,out.tp))))result.push(n.name+': 分配・THRUは映像フォーマットを変更できません')}
 if(m.sameVideoFormat){let formats=outs.filter(e=>m.ports.find(p=>p.id===e.fp)?.signal==='video').map(e=>e.format||defaultVideoFormat(getport(e.from,e.fp),getport(e.to,e.tp)));if(new Set(formats).size>1)result.push(n.name+': HDMI / SDIの出力フォーマットを同じにしてください')}
 }return [...new Set(result)];
}
