import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('feature flags default the world route off but allow an explicit opt-in', async () => {
  const js = await readFile(new URL('../feature-flags.js', import.meta.url), 'utf8');

  assert.match(js, /world:\s*false/);
  assert.match(js, /params\.get\(`feature_\$\{key\}`\)/);
  assert.match(js, /3dvr\.feature\./);
  assert.match(js, /window\.__3DVR_FEATURE_FLAGS__/);
  assert.match(js, /data-feature-flag/);
});
