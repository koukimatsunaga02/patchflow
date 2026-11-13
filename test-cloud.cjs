// DOM + real Worker/SQLite regression tests. Layout and native Sites dispatch are test adapters.
const { boot, shared, assert, fs, vm, root } = require('./test-av-ui.cjs');
const { DatabaseSync } = require('node:sqlite');

(async () => {
  const db = new DatabaseSync(':memory:');
  for (const file of fs.readdirSync(__dirname + '/drizzle').filter(f => f.endsWith('.sql')).sort()) {
    db.exec(fs.readFileSync(__dirname + '/drizzle/' + file, 'utf8'));
  }
  const env = {
    PROJECT_TOKEN_KEY: '19'.repeat(32), // Fixed test fixture only.
    DB: { prepare(sql) { return { bind(...args) { return {
      first: async () => { await Promise.resolve(); return db.prepare(sql).get(...args) || null; },
      all: async () => ({ results: db.prepare(sql).all(...args) }),
      run: async () => { await Promise.resolve(); return { meta: { changes: db.prepare(sql).run(...args).changes } }; },
    }; } }; } },
  };
  const worker = (await import('./dist/server/index.js?cloud-test=' + Date.now())).default;
  const origin = 'https://patchflow-audio-matsunaga.matsunagakoki.chatgpt.site';
  const alice = { id: 'cloud-alice', email: 'alice@example.test' };
  const bob = { id: 'cloud-bob', email: 'bob@example.test' };
  const sessions = new Map();
  const storage = map => ({ getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)), removeItem: key => map.delete(key) });
  const fixture = title => ({
    version: 1, title, canvas: { width: 4800, height: 3200 }, groups: [],
    nodes: [
      { id: 'mix', model: 'mg166fx', name: 'MG16/6 FX', x: 100, y: 100 },
      { id: 'rec', model: 'generic_recorder', name: 'Recorder', x: 700, y: 100 },
    ],
    edges: [{ id: 'cable', from: 'mix', fp: 'sttrsL', to: 'rec', tp: 'lineL', type: 'TRS', length: 3 }],
  });
  async function dispatch(path, options = {}, user = alice) {
    const url = new URL(path, origin);
    const method = options.method || 'GET';
    const headers = new Headers(options.headers);
    if (user) {
      // Emulates platform-injected identity in this test only; application JS never sends these.
      headers.set('oai-authenticated-user-id', user.id);
      headers.set('oai-authenticated-user-email', user.email);
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) headers.set('Origin', origin);
    return worker.fetch(new Request(url, { method, headers, body: options.body }), env);
  }
  async function account(path, method = 'GET', body, user = alice) {
    const response = await dispatch('/api/account' + path, {
      method, headers: { 'Content-Type': 'application/json', 'X-Patchflow-Request': 'account' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }, user);
    assert.ok(response.ok, method + ' ' + path + ': ' + await response.clone().text());
    return response.json();
  }
  const readProject = id => account('/projects/' + id);
  const userCacheKey = user => 'patchflow-cloud-library:' + encodeURIComponent(user.id);
  const sessionKey = id => 'patchflow-cloud-session:' + id;
  const dataInDB = id => JSON.parse(db.prepare('SELECT data FROM rooms WHERE id = ?').get(id).data);
  const cache = user => JSON.parse(sessions.get(userCacheKey(user)));
  const noPrivateInGuest = (...terms) => {
    const text = [...shared.values()].join('\n');
    for (const term of terms) assert.ok(!text.includes(term), 'private data leaked to localStorage: ' + term);
    assert.ok(![...shared.keys()].some(k => k.startsWith('patchflow-cloud-')), 'private cache used localStorage');
  };
  async function idle(app) {
    // loadCloudProject starts a poll without awaiting it. Drain the actual async Worker work.
    for (let i = 0; i < 50; i++) {
      await new Promise(resolve => setImmediate(resolve));
      if (!app.run('cloudBusy')) return;
    }
    assert.fail('cloud poll did not settle');
  }
  function browser(user = alice) {
    const app = boot('audio');
    const controls = { user, offline: false, failTheme: false, calls: [] };
    app.ctx.location = {
      origin, hostname: new URL(origin).hostname, port: '', search: '?mode=audio', hash: '',
      href: origin + '/editor.html', assign(url) { this.href = url; }, replace(url) { this.href = url; },
    };
    app.ctx.sessionStorage = storage(sessions);
    app.ctx.setInterval = () => 1;
    app.ctx.setAppTheme = theme => { if (controls.failTheme) throw Error('test theme initialization failed'); };
    app.ctx.fetch = async (path, options = {}) => {
      const url = new URL(path, origin), method = options.method || 'GET';
      controls.calls.push({ path: url.pathname, method, options });
      if (controls.offline) throw Error('offline fixture');
      assert.equal(url.origin, origin, 'cloud fetch must stay on the account origin');
      assert.equal(options.credentials, 'same-origin');
      return dispatch(url.href, options, controls.user);
    };
    for (const file of ['collab-core.js', 'collab.js', 'cloud.js']) {
      vm.runInContext(fs.readFileSync(root + '/' + file, 'utf8'), app.ctx, { filename: file });
    }
    app.run('initializeCollaboration();initializeCloud()');
    return Object.assign(app, { controls });
  }
  async function open(app, id) {
    await app.run('loadCloudProject(' + JSON.stringify(id) + ')');
    await idle(app);
    app.flush();
  }

  shared.clear();
  let guest = boot('audio');
  guest.run("state.title='Guest rehearsal';save()");
  const project = await account('/projects', 'POST', { data: fixture('PRIVATE client show') });
  let app = browser();
  await idle(app);
  const guestSnapshot = JSON.stringify([...shared]);
  await open(app, project.id);
  assert.equal(app.run('state.title'), 'PRIVATE client show');
  assert.equal(app.run('cloudSession.id'), project.id);
  assert.equal(app.run('projectLibrary.storage===sessionStorage'), true);
  assert.equal(app.run('projectLibrary.key'), userCacheKey(alice));
  assert.equal(cache(alice).projects.length, 1, 'first cloud load must not create a duplicate record');
  assert.equal(app.document.querySelector('#projectpicker').disabled, true);
  assert.equal(JSON.stringify([...shared]), guestSnapshot, 'loading a private project changed guest storage');

  // Autosave uses the scoped session cache and the owner API, preserving private visibility.
  app.run("state.title='PRIVATE autosaved show';state.nodes[0].x=325;save()");
  assert.equal(cache(alice).projects[0].data.title, 'PRIVATE autosaved show');
  assert.equal(JSON.stringify([...shared]), guestSnapshot);
  await app.run('cloudTick()');
  assert.equal(dataInDB(project.id).title, 'PRIVATE autosaved show');
  assert.equal(dataInDB(project.id).nodes[0].x, 325);
  assert.equal((await readProject(project.id)).visibility, 'private');
  const patch = app.controls.calls.find(c => c.method === 'PATCH');
  assert.equal(patch.options.headers['X-Patchflow-Request'], 'account');
  assert.equal(patch.options.headers['Content-Type'], 'application/json');
  noPrivateInGuest('PRIVATE client show', 'PRIVATE autosaved show');

  // Offline drafts survive refresh, then merge with changes saved by another client.
  app.controls.offline = true;
  app.run("state.nodes[0].x=455;state.nodes[0].name='PRIVATE offline desk';save()");
  await app.run('cloudTick()');
  assert.equal(dataInDB(project.id).nodes[0].x, 325);
  assert.equal(cache(alice).projects[0].data.nodes[0].x, 455);
  await account('/projects/' + project.id, 'PATCH', { ops: [{ collection: 'nodes', id: 'rec', action: 'set', fields: { y: 590 }, unset: [] }] });
  // Reload with no network must retain the draft without exposing it in guest storage.
  let offlineReload = browser();
  offlineReload.controls.offline = true;
  await open(offlineReload, project.id);
  assert.equal(offlineReload.run('state.title'), 'Guest rehearsal');
  assert.equal(cache(alice).projects[0].data.nodes[0].x, 455);
  assert.equal(offlineReload.run('cloudSession'), null);
  // Once back online, server edits and the cached offline draft are both preserved.
  offlineReload.controls.offline = false;
  await open(offlineReload, project.id);
  app = offlineReload;
  assert.equal(app.run('state.nodes.find(n=>n.id==="mix").x'), 455);
  assert.equal(app.run('state.nodes.find(n=>n.id==="mix").name'), 'PRIVATE offline desk');
  assert.equal(app.run('state.nodes.find(n=>n.id==="rec").y'), 590);
  assert.equal(cache(alice).projects.length, 1, 'refresh must reuse the cached record');
  assert.equal(dataInDB(project.id).nodes[0].x, 455);
  assert.equal(dataInDB(project.id).nodes[1].y, 590);
  noPrivateInGuest('PRIVATE client show', 'PRIVATE autosaved show', 'PRIVATE offline desk');

  // A share action must not publish an old server revision after a failed flush.
  app.controls.offline = true;
  app.run("state.title='PRIVATE not uploaded';save()");
  const shareCount = () => app.controls.calls.filter(c => c.path.endsWith('/share')).length;
  const beforeShare = shareCount();
  await app.run("showCloudShare('view')");
  assert.equal(shareCount(), beforeShare, 'stale project was submitted for sharing');
  assert.equal(app.document.querySelectorAll('.share-dialog').length, 0);
  assert.match(app.document.querySelector('#toast').textContent, /保存できていません/);
  assert.equal(app.document.querySelector('#shareproject').disabled, false);
  assert.equal((await readProject(project.id)).visibility, 'private');
  app.controls.offline = false;
  await app.run("showCloudShare('view')");
  assert.equal(shareCount(), beforeShare + 1);
  assert.equal(dataInDB(project.id).title, 'PRIVATE not uploaded');
  assert.equal((await readProject(project.id)).visibility, 'link');
  assert.match(app.document.querySelector('.share-dialog textarea').value, new RegExp('#project=' + project.id + '$'));

  // A late UI failure after installing a cloud library must restore the guest library.
  const themed = fixture('PRIVATE theme failure');
  themed.presentation = { theme: 'light' };
  const failingProject = await account('/projects', 'POST', { data: themed });
  const failed = browser();
  failed.controls.failTheme = true;
  await open(failed, failingProject.id);
  assert.equal(failed.run('cloudSession'), null);
  assert.equal(failed.run('projectLibrary.storage===localStorage'), true);
  assert.equal(failed.run('state.title'), 'Guest rehearsal');
  failed.run('save()');
  assert.equal(failed.document.querySelector('#projectpicker').disabled, false);
  noPrivateInGuest('PRIVATE theme failure', 'PRIVATE offline desk', 'PRIVATE not uploaded');

  // Loss of identity clears this owner's private cache and restores guest editing.
  app.controls.user = null;
  await app.run('cloudTick()');
  assert.equal(app.run('cloudSession'), null);
  assert.equal(app.run('projectLibrary.storage===localStorage'), true);
  assert.equal(app.run('state.title'), 'Guest rehearsal');
  assert.equal(sessions.has(userCacheKey(alice)), false);
  assert.equal(sessions.has(sessionKey(project.id)), false);
  app.run("state.title='Guest after sign-out';save()");
  noPrivateInGuest('PRIVATE theme failure', 'PRIVATE offline desk', 'PRIVATE not uploaded');

  // A second owner cannot load an Alice project or reuse Alice's scoped cache.
  const bobProject = await account('/projects', 'POST', { data: fixture('BOB private show') }, bob);
  const other = browser(bob);
  await open(other, bobProject.id);
  assert.equal(other.run('projectLibrary.key'), userCacheKey(bob));
  assert.equal(cache(bob).projects.length, 1);
  assert.equal(other.run('state.title'), 'BOB private show');
  await open(other, project.id);
  assert.equal(other.run('cloudSession'), null);
  assert.equal(other.run('projectLibrary.storage===localStorage'), true);
  assert.equal(other.run('state.title'), 'Guest after sign-out');
  noPrivateInGuest('BOB private show', 'PRIVATE not uploaded');

  db.close();
  console.log('PASS: private cloud loading/autosave isolation, single cache record, offline draft refresh merge, stale-share prevention, failed-load guest recovery, auth-loss cache clearing and owner isolation');
})().catch(error => { console.error(error); process.exitCode = 1; });
