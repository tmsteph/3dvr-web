import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('build page presents the public offer and routes calls to subscriptions', async () => {
  const html = await readFile(new URL('../build/index.html', import.meta.url), 'utf8');

  assert.match(html, /<link rel="canonical" href="https:\/\/3dvr\.tech\/build\/" \/>/);
  assert.match(html, /<a class="brand" href="\/" aria-label="3DVR home">/);
  assert.match(html, /<a href="\/">Home<\/a>/);
  assert.match(html, /<a href="\/">3dvr\.tech home<\/a>/);
  assert.match(html, /Compare subscriptions/);
  assert.match(html, /View all subscriptions/);
  assert.match(html, /href="\/subscribe\/"/);
  assert.match(html, /href="\/subscribe\/free-plan\.html">Start free<\/a>/);
  assert.match(html, /href="\/subscribe\/family-friends\.html">See \$5 plan<\/a>/);
  assert.match(html, /href="\/subscribe\/founder-plan\.html">See \$20 plan<\/a>/);
  assert.match(html, /href="\/subscribe\/builder-plan\.html">See \$50 plan<\/a>/);
  assert.match(html, /href="\/subscribe\/support-teams\.html">See support plan<\/a>/);
  assert.doesNotMatch(html, /mailto:/);
  assert.doesNotMatch(html, /create_microsite|connect_payments|draft_outreach|ship_future/);
  assert.doesNotMatch(html, /local-first digital operating systems/);
});
