import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('free plan copy points to Life inside the portal', async () => {
  const homeHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const plansHtml = await readFile(new URL('../subscribe/index.html', import.meta.url), 'utf8');
  const freeHtml = await readFile(new URL('../subscribe/free-plan.html', import.meta.url), 'utf8');

  assert.match(homeHtml, /Feel lost or stuck\? Start with Life inside the portal and get one clear next step\./);
  assert.match(plansHtml, /Find your passions, organize your life, and start with Life inside the portal\./);
  assert.match(plansHtml, /Life starter for daily check-ins and weekly reflection/);
  assert.match(plansHtml, /Start free with Life/);
  assert.match(freeHtml, /Find your passions, organize your life, and open Life inside the portal\./);
  assert.match(freeHtml, /The free plan starts with Life, the app for daily check-ins and weekly reflection\./);
  assert.match(freeHtml, /data-portal-path="\/life\/"/);
});
