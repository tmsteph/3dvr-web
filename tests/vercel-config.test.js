import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('service worker header overrides generic js caching', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  const headers = Array.isArray(config.headers) ? config.headers : [];
  const genericAssetIndex = headers.findIndex((rule) =>
    rule.source === '/(.*).(js|css|json|png|jpg|jpeg|gif|svg|webp|woff|woff2)'
  );
  const serviceWorkerIndex = headers.findIndex((rule) => rule.source === '/service-worker.js');
  const serviceWorkerRule = headers[serviceWorkerIndex];
  const cacheControl = serviceWorkerRule?.headers?.find((header) => header.key === 'Cache-Control')?.value;

  assert.ok(genericAssetIndex > -1);
  assert.ok(serviceWorkerIndex > genericAssetIndex);
  assert.equal(cacheControl, 'no-store, max-age=0');
});
