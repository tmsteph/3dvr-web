import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..');
const subscribeIndexPath = path.join(repoRoot, 'subscribe', 'index.html');
const enterprisePlanPath = path.join(repoRoot, 'subscribe', 'enterprise-plan.html');

test('subscribe index includes both the $50 and $200 recurring plans', () => {
  const html = readFileSync(subscribeIndexPath, 'utf8');

  assert.match(html, /\$50 \/ month/);
  assert.match(html, /data-portal-path="\/billing\/\?plan=builder"/);
  assert.match(html, /\$200 \/ month/);
  assert.match(html, /data-portal-path="\/billing\/\?plan=enterprise"/);
  assert.match(html, /enterprise-plan\.html/);
});

test('enterprise plan detail page routes into portal billing', () => {
  const html = readFileSync(enterprisePlanPath, 'utf8');

  assert.match(html, /Enterprise Plan/);
  assert.match(html, /\$200 \/ month/);
  assert.match(html, /data-portal-path="\/billing\/\?plan=enterprise"/);
  assert.match(html, /Managed through the portal billing center/i);
});
