'use strict';
function registerPortableAudio(models,port,stereo){
 // Keep the existing uvc1/uvc2 ids so saved audio and video routes remain valid.
 for(let m of Object.values(models).filter(m=>m.category==='computer')){
  let formats=[...models.v_stream_pc.ports.find(p=>p.id==='uvc1').formats];
  for(let i of [1,2]){
   let id='uvc'+i,p=m.ports.find(p=>p.id===id);
   if(!p){p=port(id,'','in','UVC','uvc',{formats:[...formats]});m.ports.unshift(p)}
   p.accept=['uvc','usb_audio'];p.label='USB IN '+i+' · 音声 / 映像';if(!m.visible.includes(id))m.visible.unshift(id);
  }
  m.ports=[...['uvc1','uvc2'].map(id=>m.ports.find(p=>p.id===id)),...m.ports.filter(p=>!['uvc1','uvc2'].includes(p.id))];m.visible=[...new Set(['uvc1','uvc2',...m.visible])];
  m.generic=true;m.searchTerms=(m.searchTerms||'')+' PC パソコン USB 入力 音声 録音 オーディオインターフェース';
  m.note+=' USBホスト入力×2の汎用構成。インターフェース・USBマイクの音声とキャプチャー映像を受けられます。同じ物理USB端子は1接続のみ。PC本体のUSB端子形状・対応規格と実際の台数は実機で確認。';
 }
 models.pew50cdb={name:'PE-W50CDB',maker:'JVC',category:'portablePA',domain:'audio',desc:'仮選定 · ハンドマイク向けポータブルPA',img:'assets/pew50cdb.webp',source:'https://www32.jvckenwood.com/jvc/system/pro-dl/fls_dl/mn/B5A-1300-00.pdf',photoSource:'https://www32.jvckenwood.com/jvc/system/pro-dl/search/index.asp?Key=Search&mk=all&n1=PE-W50CDB',note:'ハンドマイク用ポータブルPAとして仮選定。本体はCD・USBメモリーMP3再生対応。ワイヤレス使用には別売のWT-U85またはWT-UD84と対応800MHz帯マイク（例：WM-P970）が必要で、本体にマイク・チューナーは標準付属しません。写真はオプション装着例。無線区間・周波数設定は現在の配線対象外。有線MIC入力は6.3mmバランスTRS×1。外部RCA L/R入力は内部でモノラル合成、RCA音声出力2端子は同じモノラル音声です。USB-Aはメモリー再生専用でPCのUSB音声入力には接続できません。アンプ内蔵。電源と内部設定は実機で確認。',ports:[port('mic','有線MIC · 6.3mm TRS','in','TRS','mic',{balancedMic:true}),...stereo('aux','外部入力 RCA','in','RCA'),port('out1','音声出力 1 · MONO RCA','out','RCA'),port('out2','音声出力 2 · MONO RCA','out','RCA'),port('usbmemory','USB-A MEMORY · MP3再生専用','io','USB','storage')],visible:['mic','auxL','auxR','out1','out2']};
 models.l1compact={name:'L1 Compact',maker:'Bose',category:'powered',domain:'audio',desc:'アンプ内蔵 ポータブルラインアレイ',img:'assets/l1compact.webp',source:'https://assets.boseprofessional.com/m/7278645094b2288c/original/tds_l1_compact_en.pdf',note:'CH1はXLRマイク専用、CH2は6.35mm TRS LINE/楽器・3.5mmステレオミニ・RCA L/R。CH2の音量は共通です。TRSライン出力×1とRCA録音出力×2。再生はモノラルで1台はL/R一組ではありません。ステレオ構成はL/R各1台必要です。外部アンプのスピーカー出力は接続不可。ToneMatchとゲインは実機で設定。',ports:[port('mic','CH1 MIC XLR','in','XLR','mic'),port('line','CH2 LINE · 6.35mm TRS','in','TRS'),port('mini','CH2 STEREO · 3.5mm','in','MINI','stereo_line'),...stereo('rca','CH2 RCA','in','RCA'),port('lineout','LINE OUT · TRS MONO','out','TRS'),port('rec1','REC OUT 1 · RCA','out','RCA'),port('rec2','REC OUT 2 · RCA','out','RCA')],visible:['mic','line','rcaL','rcaR','lineout']};
 models.bose802iii={name:'Panaray 802 Series III',maker:'Bose',category:'passive',domain:'audio',desc:'8Ω パッシブスピーカー / アンプ・専用EQ必須',img:'assets/bose802iii.webp',source:'https://device.report/m/612855121de0d95c6de76228ff51c7372cb8babba33afda0c30c7e55eef36da6',sourceLabel:'Bose作成 技術資料（保存版）',photoSource:'https://www.audiocity2u.com/Speaker/Bose/BOSE-802-Series-III.html',note:'初期の参考配線図に合わせたSeries III。Series IV / Vとは別機種。アンプ非内蔵、8Ω。Neutrik NL4×2は内部並列。対応するパワーアンプと802 III専用のアクティブEQ / プロセッサーが必要です。アプリは1アンプCH→1台の運用とし、2端子を別アンプで同時駆動したり、並列渡りで増設する配線は対象外。EQ・アンプ出力・リミッターは実機で確認。',requiresEQ:true,ports:[port('spk1','SPEAKER IN · NL4 1','in','SPEAKON','speaker'),port('spk2','SPEAKER IN · NL4 2（並列）','in','SPEAKON','speaker')],visible:['spk1','spk2']};
}
function portableAudioWarnings(project){return project.nodes.filter(n=>models[n.model].requiresEQ&&project.edges.some(e=>e.to===n.id)).map(n=>n.name+': 802 III用アクティブEQ / プロセッサーとアンプ設定を確認してください')}
