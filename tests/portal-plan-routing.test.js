import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('plan routes use the expected destination mapping', async () => {
  const js = await readFile(new URL('../subscribe/portal-links.js', import.meta.url), 'utf8');

  assert.match(js, /DIRECT_PAY_PATHS/);
  assert.match(js, /billing\/\?plan=starter/);
  assert.match(js, /billing\/\?plan=pro/);
  assert.match(js, /billing\/\?plan=builder/);
  assert.match(js, /billing\/\?plan=embedded/);
  assert.match(js, /replace\('\/billing\/', '\/pay\/'\)/);
  assert.match(js, /function resolvePortalPath/);
});
