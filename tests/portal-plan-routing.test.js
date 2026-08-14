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

test('direct checkout links clearly present the pay-first flow', async () => {
  const js = await readFile(new URL('../subscribe/portal-links.js', import.meta.url), 'utf8');

  assert.match(js, /DIRECT_PAY_LABELS/);
  assert.match(js, /Pay \$5 securely/);
  assert.match(js, /Pay \$20 securely/);
  assert.match(js, /Pay \$50 securely/);
  assert.match(js, /Pay \$200 securely/);
  assert.match(js, /No portal account required before payment/);
  assert.match(js, /removeAttribute\('target'\)/);
  assert.match(js, /function applyDirectPayPresentation/);
});
