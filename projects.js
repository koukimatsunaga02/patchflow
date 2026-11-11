'use strict';
class ProjectLibrary {
 constructor(storage,key='patchflow-project-library-v1'){this.storage=storage;this.key=key;this.value=null}
 clone(v){return JSON.parse(JSON.stringify(v))}
 latest(){let raw=this.storage.getItem(this.key);if(!raw)return this.clone(this.value);let v=JSON.parse(raw);if(v.version!==1||!Array.isArray(v.projects))throw Error('保存データを読み込めません');return v}
 uid(){return 'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,9)}
 commit(value){this.storage.setItem(this.key,JSON.stringify(value));this.value=value;return this.active()}
 initialize(legacy){let raw=this.storage.getItem(this.key);if(raw){let v=JSON.parse(raw);if(v.version!==1||!Array.isArray(v.projects)||!v.projects.length||!v.projects.some(p=>p.id===v.activeId))throw Error('プロジェクト一覧を読み込めません');this.value=v}else{let now=new Date().toISOString(),id=this.uid();this.commit({version:1,activeId:id,projects:[{id,createdAt:now,updatedAt:now,data:this.clone(legacy)}],trash:[]})}return this.active()}
 active(){return this.clone(this.value.projects.find(p=>p.id===this.value.activeId))}
 list(){return this.clone(this.value.projects)}
 trash(){return this.clone(this.value.trash||[])}
 save(data){let v=this.latest();v.activeId=this.value.activeId;let p=v.projects.find(p=>p.id===v.activeId);if(!p)throw Error('別のタブで削除されたプロジェクトです');p.data=this.clone(data);p.updatedAt=new Date().toISOString();return this.commit(v)}
 activate(id){let v=this.latest();if(!v.projects.some(p=>p.id===id))throw Error('プロジェクトが見つかりません');v.activeId=id;return this.commit(v)}
 create(data){let v=this.latest(),now=new Date().toISOString(),p={id:this.uid(),createdAt:now,updatedAt:now,data:this.clone(data)};v.projects.push(p);v.activeId=p.id;return this.commit(v)}
 duplicate(id){let p=this.value.projects.find(p=>p.id===id);if(!p)throw Error('プロジェクトが見つかりません');let data=this.clone(p.data);data.title+=' のコピー';return this.create(data)}
 rename(id,title){let v=this.latest(),p=v.projects.find(p=>p.id===id);if(!p)throw Error('プロジェクトが見つかりません');p.data.title=title;p.updatedAt=new Date().toISOString();return this.commit(v)}
 remove(id){let v=this.latest(),p=v.projects.find(p=>p.id===id);if(!p)return this.active();v.projects=v.projects.filter(p=>p.id!==id);v.trash??=[];v.trash.push({...p,deletedAt:new Date().toISOString()});if(!v.projects.length){let now=new Date().toISOString();v.projects.push({id:this.uid(),createdAt:now,updatedAt:now,data:{version:1,title:'新規プロジェクト',groups:[],nodes:[],edges:[],canvas:{width:4800,height:3200}}})}if(v.activeId===id)v.activeId=v.projects[0].id;return this.commit(v)}
 restore(id){let v=this.latest(),p=(v.trash||[]).find(p=>p.id===id);if(!p)throw Error('復元対象が見つかりません');v.trash=v.trash.filter(p=>p.id!==id);delete p.deletedAt;p.updatedAt=new Date().toISOString();v.projects.push(p);v.activeId=p.id;return this.commit(v)}
 merge(records,deleted=[]){let v=this.latest(),now=new Date().toISOString(),last=null;for(let data of records){last={id:this.uid(),createdAt:now,updatedAt:now,data:this.clone(data)};v.projects.push(last)}v.trash??=[];for(let data of deleted)v.trash.push({id:this.uid(),createdAt:now,updatedAt:now,deletedAt:now,data:this.clone(data)});if(last)v.activeId=last.id;return this.commit(v)}
 export(){return{kind:'patchflow-project-library',version:1,projects:this.list(),trash:this.trash()}}
}
