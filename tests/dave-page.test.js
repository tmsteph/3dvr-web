import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Dave page links attribution back to 3dvr.tech', async () => {
  const html = await readFile(new URL('../dave/index.html', import.meta.url), 'utf8');

  assert.match(html, /<link rel="canonical" href="https:\/\/dave\.3dvr\.tech\/" \/>/);
  assert.match(html, /<a href="https:\/\/3dvr\.tech\/">made by 3dvr\.tech<\/a>/);
});
