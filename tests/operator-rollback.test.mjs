// Nonproduction service rollback rehearsal for the draft 307 Operator redirect.
// Run: node --test tests/operator-rollback.test.mjs
// Simulates marketing and destination services on loopback only. This is not a
// Vercel deployment/alias rollback or a browser-cache acceptance test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';

const ENTRY = '/operator?history=1';

test('HTTP client recovers the original Operator entry after a temporary 307 is rolled back', async t => {
  let redirectEnabled = true;
  const requests = [];
  const server = createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    requests.push({ url: request.url, redirectEnabled });
    if (pathname === '/operator' || pathname === '/operator/') {
      if (redirectEnabled) {
        response.writeHead(307, { Location: '/mock-ovh/operator/' +
          new URL(request.url, 'http://localhost').search });
        response.end();
        return;
      }
      response.writeHead(200, { 'Content-Type': 'text/plain' });
      response.end('MARKETING_ROLLBACK_RESTORED');
      return;
    }
    if (pathname === '/mock-ovh/operator/') {
      response.writeHead(200, { 'Content-Type': 'text/plain' });
      response.end('OVH_OPERATOR_MOCK');
      return;
    }
    if (pathname === '/' || pathname === '/assets/app.js') {
      response.writeHead(200, { 'Content-Type': 'text/plain' });
      response.end('UNAFFECTED_MARKETING_ROUTE');
      return;
    }
    response.writeHead(404);
    response.end();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  const origin = `http://127.0.0.1:${server.address().port}`;

  const initial = await fetch(origin + ENTRY, { redirect: 'manual' });
  assert.equal(initial.status, 307);
  assert.equal(initial.headers.get('location'), '/mock-ovh/operator/?history=1');
  const followed = await fetch(origin + ENTRY);
  assert.equal(followed.status, 200);
  assert.equal(followed.url, origin + '/mock-ovh/operator/?history=1');
  assert.equal(await followed.text(), 'OVH_OPERATOR_MOCK');

  // Simulate restoring the prior marketing version with the redirect removed.
  redirectEnabled = false;
  const restored = await fetch(origin + ENTRY);
  assert.equal(restored.status, 200);
  assert.equal(restored.url, origin + ENTRY);
  assert.equal(await restored.text(), 'MARKETING_ROLLBACK_RESTORED');
  assert.ok(requests.some(r => r.url === ENTRY && r.redirectEnabled === false),
    'client must request marketing route after the rollback');
  for (const path of ['/', '/assets/app.js']) {
    const unaffected = await fetch(origin + path);
    assert.equal(unaffected.status, 200);
    assert.equal(await unaffected.text(), 'UNAFFECTED_MARKETING_ROUTE');
  }
});
