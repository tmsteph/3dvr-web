import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

describe('3dvr-web customer journey copy', () => {
  it('keeps the homepage focused on concrete first steps and the portal start path', async () => {
    const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
    assert.match(html, /Clarity, community, and launch support/);
    assert.match(html, /Get clear on your next move\./);
    assert.match(html, /Start with one clear step\./);
    assert.match(html, /Daily clarity, real support, and help launching something of your own\./);
    assert.match(html, /Start with Life for daily clarity, join Cell for real support, and get paid help/);
    assert.match(html, /Start Here/);
    assert.match(html, /Quick plan links/);
    assert.match(html, /\$5/);
    assert.match(html, /\$20/);
    assert.match(html, /\$50/);
    assert.match(html, /Pick a clear starting point/);
    assert.match(html, /Choose one of three lanes: a daily check-in, a small support group, or direct help launching a project or offer\./);
    assert.match(html, /Start with Life for a daily check-in, weekly reflection, and one clear next action\./);
    assert.match(html, /Explore paid plans/);
    assert.match(html, /Talk through scope/);
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

  it('keeps the campaign page exposed for higher-intent buyers', async () => {
    const html = await readFile(new URL('../launch-your-site.html', import.meta.url), 'utf8');
    assert.match(html, /Launch your site without hiring a full agency\./);
    assert.match(html, /Talk through scope/);
    assert.match(html, /mailto:hello@3dvr\.tech\?subject=3DVR%20Website%20Scope/);
  });
});
