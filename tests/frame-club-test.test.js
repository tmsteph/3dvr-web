import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

describe('3dvr world prototype route', () => {
  it('ships a full-screen 3d homepage world with device-safe messaging', async () => {
    const html = await readFile(new URL('../frame-club-test/index.html', import.meta.url), 'utf8');

    assert.match(html, /3DVR 3D Homepage World/);
    assert.match(html, /Step into the 3DVR homepage as a full-screen world\./);
    assert.match(html, /frame-lab--fullscreen/);
    assert.match(html, /Open Portal/);
    assert.match(html, /Portal HUD glow/);
    assert.match(html, /Full-screen scene, CSS depth stack, motion fallback, no WebGL requirement\./);
    assert.match(html, /id="zoneMetrics"/);
    assert.match(html, /id="zoneDepthFill"/);
    assert.match(html, /scene-radar/);
    assert.match(html, /telemetry-panel/);
    assert.match(html, /world-topbar/);
    assert.match(html, /data-zone="arrival"/);
    assert.match(html, /data-zone="arena"/);
    assert.match(html, /data-zone="studio"/);
    assert.match(html, /data-zone="rooftop"/);
    assert.match(html, /href="styles\.css"/);
    assert.match(html, /src="script\.js"/);
    assert.doesNotMatch(html, /KODE/i);
    assert.doesNotMatch(html, /sports-club/i);
  });

  it('uses css perspective and scripted zone switching for the frame', async () => {
    const css = await readFile(new URL('../frame-club-test/styles.css', import.meta.url), 'utf8');
    const js = await readFile(new URL('../frame-club-test/script.js', import.meta.url), 'utf8');

    assert.match(css, /perspective:\s*1800px/);
    assert.match(css, /\.club-frame/);
    assert.match(css, /transform-style:\s*preserve-3d/);
    assert.match(css, /\.frame-lab--fullscreen/);
    assert.match(css, /\.world-topbar/);
    assert.match(css, /\.frame-hud__panel/);
    assert.match(css, /\.zone-detail__meter-fill/);
    assert.match(css, /\.scene-radar/);
    assert.match(js, /const zones = \{/);
    assert.match(js, /zoneMetrics/);
    assert.match(js, /zoneDepthFill/);
    assert.match(js, /metrics:/);
    assert.match(js, /depth:/);
    assert.match(js, /renderZone\('arrival'\)/);
    assert.match(js, /pointermove/);
  });
});
