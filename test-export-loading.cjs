const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{
 let active=0,peak=0,requests=[];
 class Reader{readAsDataURL(blob){setImmediate(()=>{this.result='data:image/png;base64,'+Buffer.from(blob).toString('base64');this.onload()})}}
 const context=vm.createContext({FileReader:Reader,fetch:async src=>{requests.push(src);active++;peak=Math.max(peak,active);await new Promise(resolve=>setImmediate(resolve));active--;return{ok:true,blob:async()=>src}},Map,Set,Promise});
 vm.runInContext(fs.readFileSync('dist/features.js','utf8'),context);
 const result=await vm.runInContext("exportImageData(['a','b','c','d','e','f','g','h','a','b'])",context);
 assert.equal(result.size,8);assert.equal(requests.length,8);assert.equal(peak,4,'load distinct photos concurrently with a four-request cap');assert.equal(result.get('a'),'data:image/png;base64,YQ==');
 context.fetch=async src=>({ok:src!=='bad',blob:async()=>src});await assert.rejects(vm.runInContext("exportImageData(['bad','a','b','c','d'])",context),/機材画像を取得/);
 context.FileReader=class {readAsDataURL(){setImmediate(()=>this.onerror())}};await assert.rejects(vm.runInContext("exportImageData(['a'])",context),/機材画像を読み込めません/);
 assert.equal((await vm.runInContext('exportImageData([])',context)).size,0);
 console.log('PASS: export photos deduplicate, load up to 4 concurrently, retain image bytes and reject request/decode failures');
})().catch(error=>{console.error(error);process.exitCode=1});
