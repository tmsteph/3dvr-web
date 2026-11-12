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
