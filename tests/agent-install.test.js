import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('agent install entry points use the portal monorepo', async () => {
  const [script, page] = await Promise.all([
    readFile(new URL('../install-agent', import.meta.url), 'utf8'),
    readFile(new URL('../install-agent.html', import.meta.url), 'utf8'),
  ]);

  assert.match(script, /tmsteph\/3dvr-portal\/main\/apps\/agent\/install\.sh/);
  assert.doesNotMatch(script, /tmsteph\/3dvr-agent/);
  assert.match(page, /git clone https:\/\/github\.com\/tmsteph\/3dvr-portal\.git/);
  assert.match(page, /cd 3dvr-portal\/apps\/agent/);
  assert.match(page, /~\/\.3dvr\/portal/);
  assert.doesNotMatch(page, /github\.com\/tmsteph\/3dvr-agent/);
});
