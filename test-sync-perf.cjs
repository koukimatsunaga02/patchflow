// Actual Worker + SQLite and editor clients: unchanged polls must stay small and never lose queued edits.
const { boot, shared, assert, fs, vm, root } = require('./test-av-ui.cjs');
const { DatabaseSync } = require('node:sqlite');
(async () => {
 const db = new DatabaseSync(':memory:');
 for (const file of fs.readdirSync('drizzle').filter(f => f.endsWith('.sql')).sort()) db.exec(fs.readFileSync('drizzle/' + file, 'utf8'));
 const env = { PROJECT_TOKEN_KEY: '19'.repeat(32), DB: { prepare(sql) { return { bind(...args) { return {
  first: async () => db.prepare(sql).get(...args) || null,
  all: async () => ({ results: db.prepare(sql).all(...args) }),
  run: async () => ({ meta: { changes: db.prepare(sql).run(...args).changes } }),
 }; } }; } } };
 const worker = (await import('./dist/server/index.js?sync-perf=' + Date.now())).default;
 const origin = 'https://patchflow-audio-matsunaga.matsunagakoki.chatgpt.site';
 const user = { id: 'sync-perf-owner', email: 'sync-perf@example.test' };
 const app = boot('audio'); shared.clear();
 let typing = false; const realDocument = app.ctx.document;
 app.ctx.document = new Proxy(realDocument, { get(target, key) { if(key==='activeElement')return typing?{tagName:'INPUT'}:target.body;let value=target[key];return typeof value==='function'?value.bind(target):value; } });
 app.ctx.location = { origin, hostname: new URL(origin).hostname, port: '', search: '', href: origin + '/editor.html', hash: '' };
 app.ctx.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
 app.ctx.setInterval = () => 1;
 let requests = [], responseBytes = [], held = null, ignoreRevision = false;
 async function dispatch(path, options = {}, identity = null) {
  const url = new URL(path, origin), headers = new Headers(options.headers), method = options.method || 'GET';
  if (identity) { headers.set('oai-authenticated-user-id', identity.id); headers.set('oai-authenticated-user-email', identity.email); }
  if (method !== 'GET') { headers.set('Origin', origin); headers.set('Content-Type', 'application/json'); headers.set('X-Patchflow-Request', 'account'); }
  return worker.fetch(new Request(url, { method, headers, ...(options.body ? { body: options.body } : {}) }), env);
 }
 app.ctx.fetch = async (path, options = {}) => {
  const url = new URL(path, origin); requests.push({ url, method: options.method || 'GET' });
  if (ignoreRevision) url.searchParams.delete('revision');
  let response = await dispatch(url.href, options, url.pathname.startsWith('/api/account') ? user : null);
  responseBytes.push((await response.clone().text()).length);
  if (held && (options.method || 'GET') === 'GET') { const release = held; held = null; await release(); }
  return response;
 };
 for (const file of ['collab-core.js', 'collab.js', 'cloud.js']) vm.runInContext(fs.readFileSync(root + '/' + file, 'utf8'), app.ctx, { filename: file });
 await app.run('ensureProjectRoom()');
 const roomId = app.run('collabSession.id'), token = app.run('collabSession.token');
 const roomURL = '/api/rooms/' + roomId;
 const full = await dispatch(roomURL, { headers: { Authorization: 'Bearer ' + token } });
 const fullBytes = (await full.text()).length;
 for (let i = 0; i < 3; i++) await app.run('collaborationTick()');
 const smallBytes = responseBytes.at(-1);
 assert.ok(smallBytes < fullBytes / 20, `unchanged ${smallBytes} vs full ${fullBytes}`);
 assert.equal(requests.at(-1).url.searchParams.get('revision'), '1');
 // A local edit made after the GET starts stays in the client, then uploads on the next tick.
 let resume; const wait = new Promise(resolve => { resume = resolve; }); held = () => wait;
 const tick = app.run('collaborationTick()');
 await new Promise(resolve => setImmediate(resolve)); app.run("state.title='Queued during unchanged poll'"); resume(); await tick;
 assert.equal(app.run('state.title'), 'Queued during unchanged poll');
 await app.run('collaborationTick()');
 assert.equal(JSON.parse(db.prepare('SELECT data FROM rooms WHERE id=?').get(roomId).data).title, 'Queued during unchanged poll');
 // Changed remote state must arrive even if editing an input causes one merge to be deferred.
 db.prepare('UPDATE rooms SET revision=revision+1,data=json_set(data,\'$.title\',?) WHERE id=?').run('Remote while typing', roomId);
 typing = true;
 await app.run('collaborationTick()');
 assert.equal(app.run('collabSession.pollRevision'), null);
 typing = false;
 await app.run('collaborationTick()');
 assert.equal(requests.at(-1).url.searchParams.has('revision'), false);
 assert.equal(app.run('state.title'), 'Remote while typing');
 // Older servers that ignore the query continue returning full data and remain compatible.
 ignoreRevision = true; await app.run('collaborationTick()'); ignoreRevision = false;
 assert.equal(app.run('state.title'), 'Remote while typing');
 // Knowing a revision never bypasses edit-token validation or archive checks.
 assert.equal((await dispatch(roomURL + '?revision=3')).status, 401);
 assert.equal((await dispatch(roomURL + '?revision=3', { headers: { Authorization: 'Bearer ' + 'f'.repeat(64) } })).status, 404);
 db.prepare('UPDATE rooms SET archived_at=1 WHERE id=?').run(roomId);
 assert.equal((await dispatch(roomURL + '?revision=3', { headers: { Authorization: 'Bearer ' + token } })).status, 404);
 db.prepare('UPDATE rooms SET archived_at=NULL,edit_hash=? WHERE id=?').run('0'.repeat(64), roomId);
 assert.equal((await dispatch(roomURL + '?revision=3', { headers: { Authorization: 'Bearer ' + token } })).status, 404, 'revoked token cannot use unchanged path');
 // Owned cloud projects use the same fast path, including visibility changes without a revision change.
 const create = await dispatch('/api/account/projects', { method: 'POST', body: JSON.stringify({ data: app.run('sharedProject(state)') }) }, user);
 assert.equal(create.status, 201); const cloud = await create.json();
 app.ctx.cloudFixture = cloud;
 app.run('collabSession=null;cloudSession={id:cloudFixture.id,base:sharedProject(cloudFixture.data),revision:cloudFixture.revision,pollRevision:cloudFixture.revision,visibility:cloudFixture.visibility};state=cloudFixture.data');
 await app.run('cloudTick()'); assert.equal(requests.at(-1).url.searchParams.get('revision'), '1');
 assert.ok(responseBytes.at(-1) < fullBytes / 20);
 db.prepare("UPDATE rooms SET visibility='link' WHERE id=?").run(cloud.id);
 await app.run('cloudTick()'); assert.equal(app.run('cloudSession.visibility'), 'link');
 let resumeCloud; const cloudWait = new Promise(resolve => { resumeCloud = resolve; }); held = () => cloudWait;
 const cloudTick = app.run('cloudTick()');
 await new Promise(resolve => setImmediate(resolve)); app.run("state.title='Queued cloud edit'"); resumeCloud(); await cloudTick;
 assert.equal(app.run('state.title'), 'Queued cloud edit');
 await app.run('cloudTick()');
 assert.equal(JSON.parse(db.prepare('SELECT data FROM rooms WHERE id=?').get(cloud.id).data).title, 'Queued cloud edit');
 db.prepare('UPDATE rooms SET revision=revision+1,data=json_set(data,\'$.title\',?) WHERE id=?').run('Cloud remote while typing', cloud.id);
 typing = true; await app.run('cloudTick()'); assert.equal(app.run('cloudSession.pollRevision'), null);
 typing = false; await app.run('cloudTick()');
 assert.equal(requests.at(-1).url.searchParams.has('revision'), false);
 assert.equal(app.run('state.title'), 'Cloud remote while typing');
 const wrongOwner = { id: 'someone-else', email: 'other@example.test' };
 assert.equal((await dispatch('/api/account/projects/' + cloud.id + '?revision=1')).status, 401);
 assert.equal((await dispatch('/api/account/projects/' + cloud.id + '?revision=1', {}, wrongOwner)).status, 404);
 db.prepare('UPDATE rooms SET archived_at=1 WHERE id=?').run(cloud.id);
 assert.equal((await dispatch('/api/account/projects/' + cloud.id + '?revision=1', {}, user)).status, 404);
 console.log(`PASS: unchanged poll ${fullBytes} → ${smallBytes} bytes; local in-flight edits, deferred remote merge, older-server fallback, owner/token/archive checks and visibility updates`);
})().catch(error => { console.error(error); process.exitCode = 1; });
