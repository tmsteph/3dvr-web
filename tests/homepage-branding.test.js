import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..');
const homepagePath = path.join(repoRoot, 'index.html');

test('homepage hero keeps the soul-trip framing grounded in practical offer language', () => {
  const html = readFileSync(homepagePath, 'utf8');

  assert.match(html, /This life is a big VR trip for the soul\./);
  assert.match(html, /people-first studio building tools, spaces, and digital presence for real people/i);
  assert.match(html, /In practice, that means websites, tools, support, and shared spaces/i);
  assert.match(html, /View membership plans/);
});
