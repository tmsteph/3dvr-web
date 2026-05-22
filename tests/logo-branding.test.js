import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

describe('3dvr-web logo branding', () => {
  it('brands the SVG app logo as 3dvr.tech', async () => {
    const logo = await readFile(new URL('../assets/logo-3dvr.svg', import.meta.url), 'utf8');
    const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

    assert.match(logo, /3dvr\.tech logo/);
    assert.match(logo, />3dvr</);
    assert.match(logo, />\.tech</);
    assert.match(html, /class="site-brand"[^>]+aria-label="3dvr\.tech home"/);
    assert.match(html, /<span class="site-brand__name">3dvr<span>\.tech<\/span><\/span>/);
    assert.match(html, /<strong>3dvr<span>\.tech<\/span><\/strong>/);
    assert.match(html, /app-boot-enabled/);
    assert.match(html, /display-mode: standalone/);
    assert.match(html, /document\.referrer\.startsWith\('android-app:\/\/'\)/);
  });
});
