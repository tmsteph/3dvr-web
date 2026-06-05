import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('vision page places the backpack before the car', async () => {
  const html = await readFile(new URL('../vision/index.html', import.meta.url), 'utf8');

  const backpackIndex = html.indexOf('id="backpack"');
  const tentIndex = html.indexOf('id="tent"');
  const carIndex = html.indexOf('id="car"');
  const yurtIndex = html.indexOf('id="yurt"');

  assert.match(html, /laptop, phone, e-bike, backpack, tent, car, and yurt/);
  assert.ok(backpackIndex !== -1, 'Backpack product card should exist');
  assert.ok(tentIndex !== -1, 'Tent product card should exist');
  assert.ok(carIndex !== -1, 'Car product card should exist');
  assert.ok(yurtIndex !== -1, 'Yurt product card should exist');
  assert.ok(backpackIndex < carIndex, 'Backpack should appear before Car');
  assert.ok(tentIndex < carIndex, 'Tent should appear before Car in the practical roadmap sequence');
  assert.ok(carIndex < yurtIndex, 'Car should still appear before Yurt');

  const backpackCreditIndex = html.indexOf('Backpack/Tent/Yurt');
  const carCreditIndex = html.indexOf('Car/Micro-EV');
  assert.ok(backpackCreditIndex !== -1, 'Backpack credits should exist');
  assert.ok(carCreditIndex !== -1, 'Car credits should exist');
  assert.ok(backpackCreditIndex < carCreditIndex, 'Backpack credits should appear before car credits');
});
