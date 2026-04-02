import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

describe('frame club test route', () => {
  it('ships a framed 3d prototype page with device-safe messaging', async () => {
    const html = await readFile(new URL('../frame-club-test/index.html', import.meta.url), 'utf8');

    assert.match(html, /3DVR Frame Club Test/);
    assert.match(html, /Build a 3D website that still works on any device\./);
    assert.match(html, /KODE Sports Club/);
    assert.match(html, /CSS layers, SVG-like shapes, motion fallback, no WebGL requirement\./);
    assert.match(html, /data-zone="arrival"/);
    assert.match(html, /data-zone="arena"/);
    assert.match(html, /data-zone="studio"/);
    assert.match(html, /data-zone="rooftop"/);
    assert.match(html, /href="styles\.css"/);
    assert.match(html, /src="script\.js"/);
  });

  it('uses css perspective and scripted zone switching for the frame', async () => {
    const css = await readFile(new URL('../frame-club-test/styles.css', import.meta.url), 'utf8');
    const js = await readFile(new URL('../frame-club-test/script.js', import.meta.url), 'utf8');

    assert.match(css, /perspective:\s*1800px/);
    assert.match(css, /\.club-frame/);
    assert.match(css, /transform-style:\s*preserve-3d/);
    assert.match(js, /const zones = \{/);
    assert.match(js, /renderZone\('arrival'\)/);
    assert.match(js, /pointermove/);
  });
});
