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
    assert.match(html, /class="site-token-mark" aria-hidden="true"/);
    assert.match(html, /class="site-token-mark__main">3dvr<\/span>/);
    assert.match(html, /class="site-token-mark__suffix">\.tech<\/span>/);
    assert.match(html, /\.site-token-mark::before/);
    assert.match(html, /radial-gradient\(circle at 48% 50%, #1768f2 0, #0f766e 54%, #07131f 100%\)/);
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
    assert.match(token, /IDLE_QUARTER_SPIN_SPEED = \(Math\.PI \* 2\) \/ 18000/);
    assert.match(token, /IDLE_WOBBLE_X = 0\.025/);
    assert.match(token, /IDLE_WOBBLE_Z = 0\.012/);
    assert.match(token, /DRAG_SPIN_FACTOR = 0\.018/);
    assert.match(token, /DRAG_VERTICAL_SPIN_FACTOR = DRAG_SPIN_FACTOR/);
    assert.match(token, /MAX_SPIN_MOMENTUM = 0\.014/);
    assert.match(token, /MAX_VERTICAL_SPIN_MOMENTUM = 0\.0018/);
    assert.match(token, /SPIN_MOMENTUM_DECAY = 0\.992/);
    assert.match(token, /VERTICAL_SPIN_MOMENTUM_DECAY = 0\.9/);
    assert.match(token, /MANUAL_X_TARGET_RETURN = 0\.14/);
    assert.match(token, /MANUAL_X_CURRENT_RETURN = 0\.24/);
    assert.match(token, /MANUAL_TARGET_RETURN = 0\.1/);
    assert.match(token, /MANUAL_CURRENT_RETURN = 0\.18/);
    assert.match(token, /CylinderGeometry/);
    assert.match(token, /TorusGeometry/);
    assert.match(token, /CanvasTexture/);
    assert.match(token, /targetX: 0/);
    assert.match(token, /targetY: 0/);
    assert.match(token, /targetZ: 0/);
    assert.match(token, /idleSpin/);
    assert.match(token, /spinVelocityX/);
    assert.match(token, /spinVelocityY/);
    assert.match(token, /state\.idleSpin \+= elapsed \* \(IDLE_QUARTER_SPIN_SPEED \+ state\.spinVelocityY\)/);
    assert.match(token, /state\.targetX \+= elapsed \* state\.spinVelocityX/);
    assert.match(token, /const verticalIntent = Math\.abs\(dy\) \/ Math\.max\(Math\.abs\(dx\), Math\.abs\(dy\), 1\)/);
    assert.match(token, /const verticalSpinDelta = dy \* DRAG_VERTICAL_SPIN_FACTOR \* verticalIntent/);
    assert.match(token, /state\.targetX \+= verticalSpinDelta/);
    assert.doesNotMatch(token, /idleSpin = .*% \(Math\.PI \* 2\)/);
    assert.match(token, /getRenderRotation/);
    assert.match(token, /pointerdown/);
    assert.match(token, /pointermove/);
    assert.match(token, /releasePointerCapture/);
    assert.match(token, /state\.targetX \+= \(state\.restX - state\.targetX\) \* MANUAL_X_TARGET_RETURN/);
    assert.match(token, /__3dvrLogoToken/);
  });
});
