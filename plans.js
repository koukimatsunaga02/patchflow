'use strict';
const PatchflowPlans=Object.freeze({free:{name:'Free',monthly:0,annual:0},pro:{name:'Pro',monthly:980,annual:9800},team:{name:'Team',monthly:2980,annual:29800}});
function planQuote(plan,cycle,code=''){if(!PatchflowPlans[plan]||!['monthly','annual'].includes(cycle))throw Error('プランを選択してください');let base=PatchflowPlans[plan][cycle],normalized=code.trim().toUpperCase(),discount=0;if(normalized){if(normalized!=='LAUNCH20'||plan==='free')throw Error('このコードは見積もりに適用できません');discount=Math.floor(base*.2)}return{base,discount,total:base-discount,renewal:base,code:normalized,cycle,plan}}
if(typeof module!=='undefined')module.exports={PatchflowPlans,planQuote};
