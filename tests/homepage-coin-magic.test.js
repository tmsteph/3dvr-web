import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('homepage coin uses regal gold materials and reusable interaction hooks', async () => {
  const token = await readFile(new URL('../homepage-logo-token.js', import.meta.url), 'utf8');

  assert.match(token, /coinFinish = 'regal-gold'/);
  assert.match(token, /#fffbd6/);
  assert.match(token, /#ffc928/);
  assert.match(token, /metalness: 0\.99/);
  assert.match(token, /roughness: 0\.08/);
  assert.match(token, /ACESFilmicToneMapping/);
  assert.match(token, /toneMappingExposure = 1\.28/);
  assert.match(token, /spawnSparks/);
  assert.match(token, /pulseHalo/);
  assert.match(token, /3dvr:coin-interact/);
  assert.match(token, /3dvr:coin-\$\{type\}/);
  assert.match(token, /emitCoinEvent\('powerup'/);
  assert.match(token, /emitCoinEvent\('world-ready'/);
  assert.match(token, /suggestedHref: '\/3dvr-world\/'/);
  assert.match(token, /emitCoinEvent\('direction'/);
});
