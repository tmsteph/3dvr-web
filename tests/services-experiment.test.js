import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('services lab page ships tracked audience variants and billing CTAs', async () => {
  const html = await readFile(new URL('../services-lab.html', import.meta.url), 'utf8');
  const js = await readFile(new URL('../growth/services-experiment.js', import.meta.url), 'utf8');

  assert.match(html, /id="serviceEyebrow"/);
  assert.match(html, /id="serviceHeadline"/);
  assert.match(html, /id="serviceBody"/);
  assert.match(html, /data-service-cta="hero-billing"/);
  assert.match(html, /data-service-cta="footer-billing"/);
  assert.match(html, /data-service-billing-link/);
  assert.match(html, /href="https:\/\/portal\.3dvr\.tech\/billing\/\?plan=custom&source=services-lab&variant=baseline&cta=hero-billing"/);
  assert.match(html, /src="https:\/\/cdn\.jsdelivr\.net\/npm\/gun\/gun\.js"/);
  assert.match(html, /src="growth\/services-experiment\.js"/);

  assert.match(js, /EVENT_PATH = \['3dvr-portal', 'growth', 'experiments', 'services-lab', 'events'\]/);
  assert.match(js, /local: Object\.freeze/);
  assert.match(js, /headline: 'Turn local attention into booked jobs\.'/);
  assert.match(js, /launch: Object\.freeze/);
  assert.match(js, /systems: Object\.freeze/);
  assert.match(js, /function variantFromUrl/);
  assert.match(js, /function decorateBillingLinks/);
  assert.match(js, /nextUrl\.searchParams\.set\('source', SOURCE\)/);
  assert.match(js, /nextUrl\.searchParams\.set\('variant', state\.variantKey\)/);
  assert.match(js, /nextUrl\.searchParams\.set\('cta', cta \|\| 'unknown'\)/);
  assert.match(js, /function logCtaClick/);
});
