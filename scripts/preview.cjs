// Local-only preview with an isolated SQLite database and the production Worker API.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{DatabaseSync}=require('node:sqlite');
(async()=>{
 const root=path.resolve(__dirname,'../dist'),db=new DatabaseSync(':memory:');
 for(let f of fs.readdirSync(path.join(__dirname,'../drizzle')).filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync(path.join(__dirname,'../drizzle',f),'utf8'));
 const env={DB:{prepare(sql){
  return {bind(...args){return {
   first:async()=>db.prepare(sql).get(...args)||null,
   all:async()=>({results:db.prepare(sql).all(...args)}),
   run:async()=>({meta:{changes:db.prepare(sql).run(...args).changes}})
  }}};
 }}};
 const worker=(await import('../dist/server/index.js')).default,mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'};
 http.createServer(async(req,res)=>{try{let url=new URL(req.url,'http://127.0.0.1:4173');if(url.pathname.startsWith('/api/')){let chunks=[];for await(let c of req)chunks.push(c);let result=await worker.fetch(new Request(url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})}),env);res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));return}let file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep)||file.includes('/server/')||file.includes('/.openai/')){res.writeHead(404);res.end();return}let body=await fs.promises.readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body)}catch{res.writeHead(404);res.end('Not found')}}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173/ (isolated collaboration database)'));
})().catch(e=>{console.error(e);process.exitCode=1});
