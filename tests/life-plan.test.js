import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('free plan copy points to the portal start path in plain language', async () => {
  const homeHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const plansHtml = await readFile(new URL('../subscribe/index.html', import.meta.url), 'utf8');
  const freeHtml = await readFile(new URL('../subscribe/free-plan.html', import.meta.url), 'utf8');

  assert.match(homeHtml, /Choose one of three lanes: a daily check-in, a small support group, or direct help launching a project or offer\./);
  assert.match(plansHtml, /Get organized, sort out your next steps, and start using the portal without paying first\./);
  assert.match(plansHtml, /Daily check-ins and weekly reflection/);
  assert.match(plansHtml, /Start free to get organized/);
  assert.match(freeHtml, /Get organized, sort out your next steps, and start inside the portal\./);
  assert.match(freeHtml, /The free plan gives you a simple place to check in daily, reflect each week, and build momentum before you pay for anything\./);
  assert.match(freeHtml, /data-portal-path="\/start\/"/);
});
