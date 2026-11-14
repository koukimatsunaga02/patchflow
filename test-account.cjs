const assert = require('node:assert/strict');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');
const { projectChanges } = require('./dist/collab-core.js');

(async () => {
  const db = new DatabaseSync(':memory:');
  for (const file of fs.readdirSync('drizzle').filter(file => file.endsWith('.sql')).sort()) {
    db.exec(fs.readFileSync('drizzle/' + file, 'utf8'));
  }
  const env = {
    // Fixed test fixture only. Production configuration must use a secret.
    PROJECT_TOKEN_KEY: '19'.repeat(32),
    DB: {
      prepare(sql) {
        return {
          bind(...args) {
            return {
              first: async () => {
                await Promise.resolve();
                return db.prepare(sql).get(...args) || null;
              },
              all: async () => ({ results: db.prepare(sql).all(...args) }),
              run: async () => {
                await Promise.resolve();
                return { meta: { changes: db.prepare(sql).run(...args).changes } };
              },
            };
          },
        };
      },
    },
  };
  const worker = (await import('./dist/server/index.js?account-test=' + Date.now())).default;
  const origin = 'https://patchflow-audio-matsunaga.matsunagakoki.chatgpt.site';
  const alice = { id: 'site-user-alice', email: 'alice@example.test', name: '松永 幸樹' };
  const bob = { id: 'site-user-bob', email: 'bob@example.test' };
  const fresh = title => ({
    version: 1, title, canvas: { width: 4800, height: 3200 }, groups: [],
    nodes: [
      { id: 'mix', model: 'mg166fx', name: 'MG16/6 FX', x: 100, y: 100 },
      { id: 'rec', model: 'generic_recorder', name: 'Recorder', x: 700, y: 100 },
    ],
    edges: [{
      id: 'serial', from: 'mix', fp: 'sttrsL', to: 'rec', tp: 'lineL', type: 'TRS', length: 8,
      segments: [{ id: 'base', length: 3, note: 'FOH' }, { id: 'ext', length: 5, note: 'Stage' }],
    }],
  });
  // These identity headers emulate the trusted Sites dispatch in a unit test only.
  function request(path, { method = 'GET', body, user, token, headers: extra = {}, requestEnv = env, omit = [] } = {}) {
    const headers = new Headers({ Origin: origin });
    if (user) {
      if (user.id !== undefined) headers.set('oai-authenticated-user-id', user.id);
      if (user.email !== undefined) headers.set('oai-authenticated-user-email', user.email);
      if (user.name) {
        headers.set('oai-authenticated-user-full-name', encodeURIComponent(user.name));
        headers.set('oai-authenticated-user-full-name-encoding', 'percent-encoded-utf-8');
      }
    }
    if (token) headers.set('Authorization', 'Bearer ' + token);
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      headers.set('Content-Type', 'application/json');
      headers.set('X-Patchflow-Request', 'account');
    }
    for (const [key, value] of Object.entries(extra)) headers.set(key, value);
    for (const key of omit) headers.delete(key);
    return worker.fetch(new Request(origin + path, {
      method, headers, ...(['GET', 'HEAD', 'OPTIONS'].includes(method) ? {} : { body: JSON.stringify(body || {}) }),
    }), requestEnv);
  }
  async function json(path, options) {
    const response = await request(path, options);
    const data = await response.json();
    return { response, data };
  }
  const row = id => db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
  const roomCount = () => db.prepare('SELECT COUNT(*) AS count FROM rooms').get().count;
  const ownerCall = (id, action = '', method = 'POST', body = {}, user = alice) =>
    request('/api/account/projects/' + id + (action ? '/' + action : ''), { method, body, user });

  // Native identity and URLs: no local password/session or bypass-token identity.
  let result = await json('/api/account');
  assert.equal(result.data.user, null);
  assert.equal(result.data.provider, 'chatgpt');
  assert.equal(result.data.signInUrl, '/signin-with-chatgpt?return_to=%2Faccount.html');
  assert.equal(result.data.signOutUrl, '/signout-with-chatgpt?return_to=%2Faccount.html');
  assert.match(result.response.headers.get('Cache-Control'), /no-store/);
  for (const user of [{ id: alice.id }, { email: alice.email }, { id: '', email: alice.email }]) {
    assert.equal((await json('/api/account', { user })).data.user, null);
    assert.equal((await request('/api/account/projects', { user })).status, 401);
  }
  result = await json('/api/account', { user: alice, omit: ['Origin'] });
  assert.deepEqual(result.data.user, { id: alice.id, email: alice.email, name: alice.name });
  result = await json('/api/account', {
    user: alice, headers: { 'oai-authenticated-user-full-name': '%E0%A4%A' },
  });
  assert.equal(result.data.user.name, alice.email);
  result = await json('/api/account', {
    user: alice, headers: { 'oai-authenticated-user-full-name': 'Unverified Name' },
    omit: ['oai-authenticated-user-full-name-encoding'],
  });
  assert.equal(result.data.user.name, alice.email);
  assert.equal((await request('/api/account/projects')).status, 401);
  assert.equal((await request('/api/account/projects', {
    headers: { 'OAI-Sites-Authorization': 'Bearer not-a-browser-identity' },
  })).status, 401);

  // Account APIs are first-party only and reject cookie-based CSRF even from the public app origin.
  for (const badOrigin of ['https://evil.example', 'https://koukimatsunaga02.github.io', 'null']) {
    assert.equal((await request('/api/account', { user: alice, headers: { Origin: badOrigin } })).status, 403);
    assert.equal((await request('/api/account/projects', {
      method: 'POST', user: alice, body: { title: 'Blocked' }, headers: { Origin: badOrigin },
    })).status, 403);
  }
  for (const omit of [['Origin'], ['X-Patchflow-Request'], ['Content-Type']]) {
    assert.equal((await request('/api/account/projects', {
      method: 'POST', user: alice, body: { title: 'Blocked' }, omit,
    })).status, 403);
  }
  assert.equal((await request('/api/account/projects', {
    method: 'POST', user: alice, body: { title: 'Blocked' }, headers: { 'Content-Type': 'text/plain' },
  })).status, 403);
  assert.equal(roomCount(), 0);

  // Private defaults, owner authorization and list isolation.
  result = await json('/api/account/projects', { method: 'POST', user: alice, body: { data: fresh('Alice live') } });
  assert.equal(result.response.status, 201);
  const project = result.data;
  assert.match(project.id, /^[a-f0-9]{32}$/);
  assert.equal(project.visibility, 'private');
  assert.equal(project.editorUrl, '/editor.html#cloud=' + project.id);
  assert.equal(project.token, undefined);
  assert.equal(row(project.id).owner_id, alice.id);
  assert.equal((await request('/api/projects/' + project.id)).status, 404);
  assert.equal((await ownerCall(project.id, '', 'GET', undefined, bob)).status, 404);
  for (const action of ['share', 'unshare', 'archive', 'restore', 'duplicate']) {
    assert.equal((await ownerCall(project.id, action, 'POST', { kind: 'view' }, bob)).status, 404);
  }
  assert.equal((await ownerCall(project.id, '', 'PATCH', { ops: [] }, bob)).status, 404);
  assert.equal((await json('/api/account/projects', { user: bob })).data.projects.length, 0);
  result = await json('/api/account/projects', { user: alice });
  assert.deepEqual(result.data.projects.map(p => p.id), [project.id]);
  assert.equal(result.data.projects[0].cableCount, 2);
  result = await json('/api/account/projects/' + project.id, { user: alice });
  assert.equal(result.data.data.edges[0].segments[1].note, 'Stage');
  assert.equal(result.data.token, undefined);
  assert.equal(result.data.token_cipher, undefined);

  // Sharing is explicit, and encrypted edit capability is stable across repeated retrieval.
  let edit = await json('/api/account/projects/' + project.id + '/share', {
    method: 'POST', user: alice, body: { kind: 'edit' },
  });
  assert.equal(edit.response.status, 200);
  const editToken = /#edit=[a-f0-9]{32}\.([a-f0-9]{64})$/.exec(edit.data.url)[1];
  assert.equal(row(project.id).visibility, 'link');
  assert.notEqual(row(project.id).edit_hash, editToken);
  assert.equal(row(project.id).edit_hash.length, 64);
  assert.ok(row(project.id).token_cipher && !row(project.id).token_cipher.includes(editToken));
  let secondEdit = await json('/api/account/projects/' + project.id + '/share', {
    method: 'POST', user: alice, body: { kind: 'edit' },
  });
  assert.equal(secondEdit.data.url, edit.data.url);
  let view = await json('/api/account/projects/' + project.id + '/share', {
    method: 'POST', user: alice, body: { kind: 'view' },
  });
  assert.equal(view.data.url, 'https://koukimatsunaga02.github.io/patchflow/view.html#project=' + project.id);
  assert.equal((await request('/api/projects/' + project.id)).status, 200);
  assert.equal((await request('/api/rooms/' + project.id, { token: editToken })).status, 200);

  // Authenticated owner presence interoperates with link editors without exposing the edit token.
  const peer = { clientId: 'a'.repeat(24), name: 'Alice', color: '#317fbd', cursor: { x: 120, y: 180 }, selection: { type: 'edge', id: 'serial' } };
  assert.equal((await ownerCall(project.id, 'presence', 'POST', peer)).status, 200);
  assert.equal((await ownerCall(project.id, 'presence', 'POST', peer, bob)).status, 404);
  result = await json('/api/rooms/' + project.id + '/presence', { token: editToken });
  assert.equal(result.data.participants[0].name, 'Alice');
  assert.equal(row(project.id).revision, 1);
  assert.equal((await request('/api/projects/' + project.id + '/presence')).status, 404);

  // Revocation rotates the capability, deletes presence and hides the public projection.
  const oldCipher = row(project.id).token_cipher;
  assert.equal((await ownerCall(project.id, 'unshare')).status, 200);
  assert.equal(row(project.id).visibility, 'private');
  assert.notEqual(row(project.id).token_cipher, oldCipher);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM presence WHERE room_id = ?').get(project.id).count, 0);
  assert.equal((await request('/api/projects/' + project.id)).status, 404);
  assert.equal((await request('/api/rooms/' + project.id, { token: editToken })).status, 404);
  assert.equal((await request('/api/rooms/' + project.id, { method: 'PATCH', token: editToken, body: { ops: [] } })).status, 404);
  assert.equal((await request('/api/rooms/' + project.id + '/presence', { method: 'POST', token: editToken, body: peer })).status, 404);
  assert.equal((await ownerCall(project.id, '', 'GET')).status, 200);
  assert.equal((await ownerCall(project.id, 'presence', 'POST', peer)).status, 200, 'private cloud owner retains presence');
  secondEdit = await json('/api/account/projects/' + project.id + '/share', {
    method: 'POST', user: alice, body: { kind: 'edit' },
  });
  const newToken = /\.([a-f0-9]{64})$/.exec(secondEdit.data.url)[1];
  assert.notEqual(newToken, editToken);
  assert.equal((await request('/api/rooms/' + project.id, { token: editToken })).status, 404);

  // Owner edits validate serial length metadata atomically; another account cannot rename them.
  const renamed = fresh('Renamed and extended');
  renamed.edges[0].segments[1].length = 7;
  renamed.edges[0].length = 10;
  assert.equal((await ownerCall(project.id, '', 'PATCH', { ops: projectChanges(project.data, renamed) })).status, 200);
  const beforeInvalid = row(project.id);
  const malformed = structuredClone(renamed);
  malformed.edges[0].length = 99;
  assert.equal((await ownerCall(project.id, '', 'PATCH', { ops: projectChanges(renamed, malformed) })).status, 400);
  assert.equal(row(project.id).revision, beforeInvalid.revision);
  assert.equal(row(project.id).data, beforeInvalid.data);
  assert.equal((await request('/api/account/projects', {
    method: 'POST', user: alice, body: { data: malformed },
  })).status, 400);

  // Duplicates are private even when the source has shared links; archive/restore is reversible.
  const duplicate = await (await ownerCall(project.id, 'duplicate')).json();
  assert.match(duplicate.id, /^[a-f0-9]{32}$/);
  assert.equal(duplicate.visibility, 'private');
  assert.equal(row(duplicate.id).owner_id, alice.id);
  assert.equal((await request('/api/projects/' + duplicate.id)).status, 404);
  assert.equal(duplicate.data.edges[0].segments[1].length, 7);
  assert.equal((await ownerCall(project.id, 'archive')).status, 200);
  assert.ok(row(project.id).archived_at);
  assert.equal((await ownerCall(project.id, '', 'GET')).status, 404);
  assert.equal((await request('/api/projects/' + project.id)).status, 404);
  assert.equal((await request('/api/rooms/' + project.id, { token: newToken })).status, 404);
  assert.equal((await json('/api/account/projects', { user: alice })).data.projects.some(p => p.id === project.id), false);
  assert.equal((await json('/api/account/projects?trash=1', { user: alice })).data.projects.some(p => p.id === project.id), true);
  assert.equal((await ownerCall(project.id, 'restore')).status, 200);
  assert.equal(row(project.id).archived_at, null);
  assert.equal((await ownerCall(project.id, '', 'GET')).status, 200);

  // A legacy edit link is not ownership proof. Only a private pending transfer can be claimed.
  const legacy = (await json('/api/rooms', { method: 'POST', body: { data: fresh('Legacy shared') } })).data;
  assert.equal((await request('/api/account/projects/claim', {
    method: 'POST', user: alice, body: { id: legacy.id, token: legacy.token },
  })).status, 409);
  assert.equal(row(legacy.id).owner_id, null);
  const pending = (await json('/api/rooms', { method: 'POST', body: { data: fresh('Pending private'), private: true } })).data;
  assert.equal((await request('/api/projects/' + pending.id)).status, 404);
  const claims = await Promise.all([alice, bob].map(user => request('/api/account/projects/claim', {
    method: 'POST', user, body: { id: pending.id, token: pending.token },
  })));
  assert.deepEqual(claims.map(r => r.status).sort(), [200, 409]);
  assert.ok([alice.id, bob.id].includes(row(pending.id).owner_id));
  const winningUser = row(pending.id).owner_id === alice.id ? alice : bob;
  const losingUser = winningUser === alice ? bob : alice;
  assert.equal((await request('/api/account/projects/claim', {
    method: 'POST', user: losingUser, body: { id: pending.id, token: pending.token },
  })).status, 409);
  assert.equal((await request('/api/account/projects/claim', {
    method: 'POST', user: winningUser, body: { id: pending.id, token: pending.token },
  })).status, 200);
  assert.equal((await request('/api/account/projects/' + pending.id, { user: losingUser })).status, 404);
  assert.equal((await request('/api/account/projects/' + pending.id, { user: winningUser })).status, 200);
  assert.equal((await request('/api/account/projects/claim', {
    method: 'POST', user: alice, body: { id: legacy.id, token: 'f'.repeat(64) },
  })).status, 404);

  // No production key => no partially created/claimed/revoked records.
  const missingKey = { ...env, PROJECT_TOKEN_KEY: undefined };
  let countBefore = roomCount();
  assert.equal((await request('/api/account/projects', {
    method: 'POST', user: alice, body: { title: 'Should not exist' }, requestEnv: missingKey,
  })).status, 503);
  assert.equal(roomCount(), countBefore);
  const unclaimed = (await json('/api/rooms', { method: 'POST', body: { data: fresh('No key transfer'), private: true } })).data;
  assert.equal((await request('/api/account/projects/claim', {
    method: 'POST', user: alice, body: { id: unclaimed.id, token: unclaimed.token }, requestEnv: missingKey,
  })).status, 503);
  assert.equal(row(unclaimed.id).owner_id, null);
  assert.equal(row(unclaimed.id).token_cipher, null);
  const beforeMissingSecret = row(duplicate.id);
  assert.equal((await request('/api/account/projects/' + duplicate.id + '/share', {
    method: 'POST', user: alice, body: { kind: 'edit' }, requestEnv: missingKey,
  })).status, 503);
  assert.equal((await request('/api/account/projects/' + duplicate.id + '/unshare', {
    method: 'POST', user: alice, requestEnv: missingKey,
  })).status, 503);
  assert.equal(row(duplicate.id).visibility, beforeMissingSecret.visibility);
  assert.equal(row(duplicate.id).edit_hash, beforeMissingSecret.edit_hash);
  assert.equal(row(duplicate.id).token_cipher, beforeMissingSecret.token_cipher);

  // A stale share request must not reopen public access after a newer revocation.
  let reachedShare;
  let releaseShare;
  const shareReached = new Promise(resolve => { reachedShare = resolve; });
  const shareRelease = new Promise(resolve => { releaseShare = resolve; });
  const delayedShareEnv = {
    ...env,
    DB: {
      prepare(sql) {
        const prepared = env.DB.prepare(sql);
        return {
          bind(...args) {
            const operation = prepared.bind(...args);
            if (!/^UPDATE rooms SET visibility = 'link'/.test(sql)) return operation;
            return {
              ...operation,
              run: async () => {
                reachedShare();
                await shareRelease;
                return operation.run();
              },
            };
          },
        };
      },
    },
  };
  const staleShare = request('/api/account/projects/' + duplicate.id + '/share', {
    method: 'POST', user: alice, body: { kind: 'edit' }, requestEnv: delayedShareEnv,
  });
  let gateTimeout;
  try {
    await Promise.race([
      shareReached,
      new Promise((_, reject) => {
        gateTimeout = setTimeout(() => reject(Error('Sharing UPDATE did not reach the regression-test gate')), 2000);
      }),
    ]);
  } finally {
    clearTimeout(gateTimeout);
  }
  assert.equal((await ownerCall(duplicate.id, 'unshare')).status, 200);
  releaseShare();
  assert.equal((await staleShare).status, 409, 'stale sharing cannot override revocation');
  assert.equal(row(duplicate.id).visibility, 'private');

  const genericAudio = {version:1,title:'Generic audio sources',canvas:{width:4800,height:3200},groups:[],nodes:[{id:'wireless',model:'generic_wireless_mic',name:'Wireless',x:100,y:100},{id:'cd',model:'generic_cd_deck',name:'CD',x:100,y:600},{id:'mixer',model:'mg10',name:'Mixer',x:600,y:100}],edges:[{id:'mic',from:'wireless',fp:'out',to:'mixer',tp:'in1',type:'XLR',length:3},{id:'cdl',from:'cd',fp:'lineL',to:'mixer',tp:'rca56L',type:'RCA',length:1.5},{id:'cdr',from:'cd',fp:'lineR',to:'mixer',tp:'rca56R',type:'RCA',length:1.5}]};
  const genericResult = await json('/api/account/projects', {method:'POST',user:alice,body:{data:genericAudio}});
  assert.equal(genericResult.response.status,201,'generic wireless and CD routes can be saved to the cloud');
  assert.equal(genericResult.data.data.edges.length,3);

  // Free canvas coordinates must survive authenticated cloud saves and public projections.
  const wide = fresh('Wide workspace');
  wide.canvas = { width: 100000, height: 100000 };
  wide.nodes[0].x = -1500; wide.nodes[0].y = -800;
  wide.nodes[1].x = 45000; wide.nodes[1].y = 30000;
  const wideResult = await json('/api/account/projects', { method: 'POST', user: alice, body: { data: wide } });
  assert.equal(wideResult.response.status, 201);
  assert.equal(wideResult.data.data.nodes[0].x, -1500);
  wide.nodes[0].x = -20001;
  assert.equal((await request('/api/account/projects', { method: 'POST', user: alice, body: { data: wide } })).status, 400);

  console.log('PASS: Sites identity/native SSO URLs, account CSRF and origin checks, private ownership/isolation, encrypted stable edit links, revocation/presence cleanup, validated autosave, private duplicates/trash/restore, atomic private-transfer claims and missing-secret rollback');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
