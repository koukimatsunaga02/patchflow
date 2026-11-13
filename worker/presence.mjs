async function handleRoomPresence(request,env,room,reply){
   let now=Date.now();
   if(request.method==='POST'||request.method==='DELETE'){
    let text=await request.text();if(text.length>2000)return reply({error:'参加情報が大きすぎます'},413);let body=JSON.parse(text);
    if(typeof body.clientId!=='string'||!/^[a-f0-9]{24,64}$/.test(body.clientId))return reply({error:'参加情報が不正です'},400);
    let key=room.id+':'+body.clientId;
    if(request.method==='DELETE'){await env.DB.prepare('DELETE FROM presence WHERE key = ?').bind(key).run();return reply({ok:true})}
    let cursor=body.cursor;if(cursor&&(!Number.isFinite(cursor.x)||!Number.isFinite(cursor.y)||cursor.x<0||cursor.y<0||cursor.x>20000||cursor.y>20000))return reply({error:'カーソル位置が不正です'},400);
    let selection=body.selection,types=['node','edge','group','port'];if(selection&&(!types.includes(selection.type)||typeof selection.id!=='string'||selection.id.length>100||selection.port&&typeof selection.port!=='string'||selection.port?.length>100))return reply({error:'選択情報が不正です'},400);
    let data={clientId:body.clientId,name:typeof body.name==='string'?body.name.trim().slice(0,24)||'ゲスト':'ゲスト',color:/^#[0-9a-f]{6}$/i.test(body.color)?body.color:'#e85d32',cursor:cursor?{x:cursor.x,y:cursor.y}:null,selection:selection?{type:selection.type,id:selection.id,...(selection.port?{port:selection.port}:{})}:null};
    await env.DB.prepare('INSERT INTO presence (key, room_id, client_id, data, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at').bind(key,room.id,body.clientId,JSON.stringify(data),now).run();
    await env.DB.prepare('DELETE FROM presence WHERE room_id = ? AND updated_at < ?').bind(room.id,now-24000).run();
   }else if(request.method!=='GET')return reply({error:'対応していない操作です'},405);
   let result=await env.DB.prepare('SELECT data FROM presence WHERE room_id = ? AND updated_at > ? ORDER BY updated_at DESC LIMIT 64').bind(room.id,now-16000).all();
   return reply({participants:result.results.map(p=>JSON.parse(p.data))});
  
}
