import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..');
const homepagePath = path.join(repoRoot, 'index.html');
const experimentPath = path.join(repoRoot, 'experiments', 'homepage-ab.js');

test('homepage includes experiment hooks for hero copy', () => {
  const html = readFileSync(homepagePath, 'utf8');

  assert.match(html, /<script defer src="\/experiments\/homepage-ab\.js"><\/script>/);
  assert.match(html, /data-homepage-copy="headline"/);
  assert.match(html, /data-homepage-copy="body"/);
  assert.match(html, /data-homepage-copy="note"/);
});

test('homepage experiment script ships control and soul variants', () => {
  const script = readFileSync(experimentPath, 'utf8');

  assert.match(script, /const EXPERIMENT_KEY = '3dvr-homepage-copy'/);
  assert.match(script, /control:/);
  assert.match(script, /soul:/);
  assert.match(script, /This life is a big VR trip for the soul\./);
  assert.match(script, /Build the future\./);
  assert.match(script, /exp-homepage/);
});
