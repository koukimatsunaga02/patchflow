const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Storage{constructor(){this.values=new Map();this.writes=0;this.bytes=0;this.fail=false}getItem(k){return this.values.get(k)||null}setItem(k,v){if(this.fail)throw Error('QuotaExceeded');this.values.set(k,v);this.writes++;this.bytes+=Buffer.byteLength(v)}}
const context=vm.createContext({}),Library=vm.runInContext(fs.readFileSync('dist/projects.js','utf8')+'\nProjectLibrary',context),storage=new Storage();
const data={version:1,title:'Show',nodes:Array.from({length:200},(_,i)=>({id:'n'+i,name:'Device '+i,x:i*240,y:80})),edges:[],groups:[]};
const a=new Library(storage);a.initialize(data);for(let i=0;i<14;i++)a.create({...data,title:'Show '+i});
let unchanged=a.active(),writes=storage.writes,bytes=storage.bytes;
for(let i=0;i<100;i++)a.save(unchanged.data);
assert.equal(storage.writes,writes,'unchanged saves must not write the project library');assert.equal(storage.bytes,bytes);assert.equal(a.active().updatedAt,unchanged.updatedAt);
const b=new Library(storage);b.initialize(data);const extra=b.create({...data,title:'Other tab'});a.save(unchanged.data);assert.ok(a.list().some(p=>p.id===extra.id),'unchanged local view must preserve another tab’s new project');
let edits=a.active().data;edits.nodes[0].name='Edited';a.save(edits);assert.equal(a.active().data.nodes[0].name,'Edited');edits.nodes[0].name='Outside mutation';assert.equal(a.active().data.nodes[0].name,'Edited');
const before=JSON.stringify(a.value),savedRaw=storage.getItem(a.key);storage.fail=true;assert.throws(()=>a.save(edits),/Quota/);assert.equal(JSON.stringify(a.value),before);assert.equal(storage.getItem(a.key),savedRaw);storage.fail=false;a.save(edits);assert.equal(a.active().data.nodes[0].name,'Outside mutation');
b.initialize(data);b.remove(a.value.activeId);assert.throws(()=>a.save(a.active().data),/別のタブで削除/);
console.log('PASS: 100 unchanged saves write 0 bytes; cross-tab updates, removed projects, isolated edits and quota rollback preserved');
