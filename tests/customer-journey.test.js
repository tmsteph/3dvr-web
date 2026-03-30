import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

describe('3dvr-web customer journey copy', () => {
  it('keeps the homepage subscribe section tied to the portal handoff', async () => {
    const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
    assert.match(html, /Choose your path/);
    assert.match(html, /Pick a plan on 3dvr\.tech, create your portal account once, and continue inside portal\.3dvr\.tech\./);
    assert.match(html, /Find your passions, organize your life, and start with the Life starter inside the portal\./);
  });

  it('makes the main plans page explicit about continuing in the portal', async () => {
    const html = await readFile(new URL('../subscribe/index.html', import.meta.url), 'utf8');
    assert.match(html, /Start free with Life, support the mission at \$5, grow with \$20, or move into a \$50 builder lane and custom scoped work\./);
    assert.match(html, /Find your passions, organize your life, and start with Life inside the portal\./);
    assert.match(html, /Life starter for daily check-ins and weekly reflection/);
    assert.match(html, /No credit card required\. Create one portal account and start organizing what matters\./);
    assert.match(html, /Start Free in Portal/);
    assert.match(html, /Continue to Portal for \$5/);
    assert.match(html, /Continue to Portal for \$20/);
    assert.match(html, /Continue to Portal for \$50/);
    assert.match(html, /Open custom checkout in Portal/);
  });

  it('keeps the free plan detail page aligned with the portal onboarding flow', async () => {
    const html = await readFile(new URL('../subscribe/free-plan.html', import.meta.url), 'utf8');
    assert.match(html, /Find your passions, organize your life, and open Life inside the portal\./);
    assert.match(html, /The free plan starts with Life, the app for daily check-ins and weekly reflection\./);
    assert.match(html, /Start Free/);
    assert.match(html, /Open Life/);
    assert.match(html, /Clone a template, open Life, and personalize the way you track and organize your day\./);
  });

  it('keeps paid plan detail pages explicit about the portal billing handoff', async () => {
    const starterHtml = await readFile(new URL('../subscribe/family-friends.html', import.meta.url), 'utf8');
    const founderHtml = await readFile(new URL('../subscribe/founder-plan.html', import.meta.url), 'utf8');
    const builderHtml = await readFile(new URL('../subscribe/builder-plan.html', import.meta.url), 'utf8');
    assert.match(starterHtml, /Continue to Portal for \$5/);
    assert.match(founderHtml, /Continue to Portal for Founder/);
    assert.match(builderHtml, /Continue to Portal for Builder/);
  });
});
