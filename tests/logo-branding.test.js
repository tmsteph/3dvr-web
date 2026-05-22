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
    assert.match(html, /data-3dvr-token/);
    assert.match(html, /data-3dvr-token-canvas/);
    assert.match(html, /Interactive 3dvr\.tech 3D token/);
    assert.match(html, /\.hero-logo-card > img/);
    assert.match(html, /\.hero-token\[data-token-ready="true"\] \.hero-token__fallback/);
    assert.match(html, /homepage-logo-token\.js/);
    assert.match(html, /app-boot-enabled/);
    assert.match(html, /display-mode: standalone/);
    assert.match(html, /document\.referrer\.startsWith\('android-app:\/\/'\)/);
  });

  it('ships a touch and mouse driven Three.js token for the homepage logo', async () => {
    const token = await readFile(new URL('../homepage-logo-token.js', import.meta.url), 'utf8');

    assert.match(token, /THREE_CDN_URL/);
    assert.match(token, /three\.js\/r128\/three\.min\.js/);
    assert.match(token, /FACE_TEXTURE_ROTATION/);
    assert.match(token, /IDLE_SPIN_SPEED = \(Math\.PI \* 2\) \/ 56000/);
    assert.match(token, /CylinderGeometry/);
    assert.match(token, /TorusGeometry/);
    assert.match(token, /CanvasTexture/);
    assert.match(token, /targetX: 0/);
    assert.match(token, /targetY: 0/);
    assert.match(token, /targetZ: 0/);
    assert.match(token, /idleSpin/);
    assert.match(token, /getRenderRotation/);
    assert.match(token, /pointerdown/);
    assert.match(token, /pointermove/);
    assert.match(token, /releasePointerCapture/);
    assert.match(token, /state\.restX - state\.targetX/);
    assert.match(token, /__3dvrLogoToken/);
  });
});
