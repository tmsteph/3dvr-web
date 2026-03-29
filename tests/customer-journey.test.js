import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

describe('3dvr-web customer journey copy', () => {
  it('keeps the homepage subscribe section tied to the portal handoff', async () => {
    const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
    assert.match(html, /Choose your path/);
    assert.match(html, /Pick a plan on 3dvr\.tech, create your portal account once, and continue inside portal\.3dvr\.tech\./);
    assert.match(html, /Start free, find what matters to you, and organize your life with one portal account\./);
  });

  it('makes the main plans page explicit about continuing in the portal', async () => {
    const html = await readFile(new URL('../subscribe/index.html', import.meta.url), 'utf8');
    assert.match(html, /create one portal account/);
    assert.match(html, /Use the same portal account for free access, upgrades, invoices, and support\./);
    assert.match(html, /Find your passions, organize your life, and start with a free portal-backed space\./);
    assert.match(html, /No credit card required\. Create one portal account and start organizing what matters\./);
    assert.match(html, /Start Free in Portal/);
    assert.match(html, /Continue to Portal for \$5/);
    assert.match(html, /Continue to Portal for \$20/);
    assert.match(html, /Continue to Portal for \$50/);
    assert.match(html, /Open custom checkout in Portal/);
  });

  it('keeps the free plan detail page aligned with the portal onboarding flow', async () => {
    const html = await readFile(new URL('../subscribe/free-plan.html', import.meta.url), 'utf8');
    assert.match(html, /Choose Free on 3dvr\.tech, create your portal account once, and use it to find your passions and organize your life inside portal\.3dvr\.tech\./);
    assert.match(html, /Start Free in Portal/);
    assert.match(html, /find your passions, organize your life/);
    assert.match(html, /Organize your life/);
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
