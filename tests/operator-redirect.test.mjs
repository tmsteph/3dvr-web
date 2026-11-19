// Offline regression checks for the draft Operator redirect rules.
// Run: node --test tests/operator-redirect.test.mjs
// This does not replace an isolated deployment preview or live browser checks.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const operator = config.routes.filter(r => r.src.startsWith('^/operator'));
function resolve(path) {
  const route = operator.find(r => new RegExp(r.src).test(path));
  if (!route) return null;
  const pathname = path.replace(new RegExp(route.src), route.dest);
  return { status: route.status, pathname };
}
test('Operator entry redirects temporarily to OVH', () => {
  for (const path of ['/operator', '/operator/']) {
    assert.deepEqual(resolve(path), { status: 307, pathname: 'https://portal.3dvr.tech/operator/' });
  }
});
test('query strings remain attached to redirected entry URLs', () => {
  for (const query of ['?history=1', '?conversation=abc&source=forge']) {
    const { status, pathname } = resolve('/operator/');
    assert.equal(status, 307);
    assert.equal(new URL(pathname + query).search, query);
  }
});
test('nested paths are forwarded without rewriting to unrelated routes', () => {
  assert.deepEqual(resolve('/operator/example'), {
    status: 307, pathname: 'https://portal.3dvr.tech/operator/example'
  });
});
test('unrelated homepage and assets do not match Operator rules', () => {
  for (const path of ['/', '/install', '/service-worker.js', '/assets/main.js']) {
    assert.equal(resolve(path), null);
  }
});

// Opt-in HTTP acceptance check against an isolated preview, not the production marketing URL.
// OPERATOR_REDIRECT_PREVIEW_URL=https://<preview>.vercel.app node --test tests/operator-redirect.test.mjs
// This inspects actual response codes/Location headers, unlike the offline regex tests.
// It does NOT prove Vercel's generated build configuration, an authenticated browser flow, or rollback safety.
const previewUrl = process.env.OPERATOR_REDIRECT_PREVIEW_URL;
test('isolated preview preserves redirect locations and leaves public routes alone',
  { skip: !previewUrl }, async () => {
    const base = new URL(previewUrl);
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname);
    assert.ok(base.protocol === 'https:' && base.hostname.endsWith('.vercel.app') ||
      loopback && process.env.OPERATOR_REDIRECT_ALLOW_LOOPBACK === '1',
      'Only a .vercel.app preview (or explicitly enabled loopback test server) is allowed');
    const redirects = [
      ['/operator', 'https://portal.3dvr.tech/operator/'],
      ['/operator/?history=1', 'https://portal.3dvr.tech/operator/?history=1'],
      ['/operator?conversation=abc&source=forge', 'https://portal.3dvr.tech/operator/?conversation=abc&source=forge'],
      ['/operator/example?history=1', 'https://portal.3dvr.tech/operator/example?history=1'],
    ];
    for (const [path, destination] of redirects) {
      const response = await fetch(new URL(path, base), { redirect: 'manual', signal: AbortSignal.timeout(8000) });
      assert.equal(response.status, 307, path + ' status');
      assert.equal(response.headers.get('location'), destination, path + ' Location');
    }
    for (const [path, expectedStatus] of [['/', 200], ['/operatorx', 404]]) {
      const response = await fetch(new URL(path, base), { redirect: 'manual', signal: AbortSignal.timeout(8000) });
      assert.equal(response.status, expectedStatus, path + ' unaffected');
    }
  });
