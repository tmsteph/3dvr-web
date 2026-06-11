import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('repair page routes primary calls to subscriptions instead of email', async () => {
  const html = await readFile(new URL('../repair/index.html', import.meta.url), 'utf8');

  assert.match(html, /<link rel="canonical" href="https:\/\/3dvr\.tech\/repair\/" \/>/);
  assert.match(html, /<a class="brand" href="\/" aria-label="3DVR home">/);
  assert.match(html, /<a href="\/">Home<\/a>/);
  assert.match(html, /<a href="\/">3dvr\.tech home<\/a>/);
  assert.match(html, /<a class="btn primary" href="\/subscribe\/">View plans<\/a>/);
  assert.match(html, /<a class="btn primary" href="\/subscribe\/">View subscriptions<\/a>/);
  assert.doesNotMatch(html, /mailto:/);
});
