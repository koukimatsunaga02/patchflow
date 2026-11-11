const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class MemoryStorage{constructor(){this.data=new Map;this.fail=false}getItem(k){return this.data.get(k)||null}setItem(k,v){if(this.fail)throw Error('QuotaExceeded');this.data.set(k,v)}}
const storage=new MemoryStorage(),context=vm.createContext({storage,assert});
vm.runInContext(fs.readFileSync('dist/projects.js','utf8')+`
const legacy={version:1,title:'Existing show',nodes:[{id:'m',name:'Original'}],edges:[],groups:[]};
const lib=new ProjectLibrary(storage);const first=lib.initialize(legacy);assert.equal(lib.list().length,1);assert.equal(first.data.nodes[0].name,'Original');
legacy.nodes[0].name='Outside mutation';assert.equal(lib.active().data.nodes[0].name,'Original');
const fresh=lib.create({version:1,title:'Second show',nodes:[],edges:[],groups:[],camera:{zoom:1.5,x:900,y:600}});assert.equal(lib.list().length,2);
lib.activate(first.id);let edited=lib.active().data;edited.title='Updated first';edited.nodes[0].name='Changed';lib.save(edited);
lib.activate(fresh.id);assert.equal(lib.active().data.nodes.length,0);assert.equal(lib.active().data.camera.zoom,1.5);
const copy=lib.duplicate(first.id);copy.data.nodes[0].name='Copy only';lib.save(copy.data);lib.activate(first.id);assert.equal(lib.active().data.nodes[0].name,'Changed');
lib.rename(fresh.id,'Renamed second');assert.equal(lib.list().find(p=>p.id===fresh.id).data.title,'Renamed second');
lib.remove(first.id);assert.equal(lib.trash().length,1);lib.restore(first.id);assert.equal(lib.active().data.nodes[0].name,'Changed');assert.equal(lib.trash().length,0);
const before=JSON.stringify(lib.value);storage.fail=true;assert.throws(()=>lib.create(legacy),/Quota/);assert.equal(JSON.stringify(lib.value),before);storage.fail=false;
const reloaded=new ProjectLibrary(storage);reloaded.initialize({title:'Should not replace'});assert.equal(reloaded.active().data.title,'Updated first');assert.equal(reloaded.list().length,3);
for(const p of reloaded.list())reloaded.remove(p.id);assert.equal(reloaded.list().length,1);assert.equal(reloaded.trash().length,3);assert.equal(reloaded.active().data.nodes.length,0);

const archiveStorage=new storage.constructor(),archiveLib=new ProjectLibrary(archiveStorage);archiveLib.initialize(legacy);archiveLib.merge([{version:1,title:'Imported',nodes:[],edges:[],groups:[]}],[{version:1,title:'Deleted backup',nodes:[],edges:[],groups:[]}]);assert.equal(archiveLib.list().length,2);assert.equal(archiveLib.trash().length,1);archiveLib.restore(archiveLib.trash()[0].id);assert.equal(archiveLib.active().data.title,'Deleted backup');
const multiStorage=new storage.constructor(),tabA=new ProjectLibrary(multiStorage),tabB=new ProjectLibrary(multiStorage);tabA.initialize(legacy);tabB.initialize(legacy);const tabCreated=tabA.create({version:1,title:'Created in A',nodes:[],edges:[],groups:[]});const bData=tabB.active().data;bData.title='Edited in B';tabB.save(bData);assert.equal(tabB.list().length,2);assert.equal(tabB.list().find(p=>p.id===tabCreated.id).data.title,'Created in A');
`,context);
console.log('PASS: legacy migration, isolated projects, camera restore, copy isolation, rename, trash/restore, storage failure rollback and reload');
