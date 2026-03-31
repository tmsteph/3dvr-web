import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

describe('3dvr-web customer journey copy', () => {
  it('keeps the homepage focused on concrete first steps and the portal start path', async () => {
    const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
    assert.match(html, /Get organized, find support, start something real/);
    assert.match(html, /Get clear on your next move\./);
    assert.match(html, /Start with one clear step\./);
    assert.match(html, /Simple tools and real support to help you move forward\./);
    assert.match(html, /3dvr helps you get organized, stay accountable, and get help launching a project,/);
    assert.match(html, /Start Here/);
    assert.match(html, /Quick plan links/);
    assert.match(html, /Get started/);
    assert.match(html, /\$5/);
    assert.match(html, /\$20/);
    assert.match(html, /\$50/);
    assert.match(html, /Daily Direction/);
    assert.match(html, /Check in, sort your priorities, and choose one next step for tomorrow\./);
    assert.match(html, /Real Support/);
    assert.match(html, /Find accountability, encouragement, and people who can help you keep going\./);
    assert.match(html, /Launch Help/);
    assert.match(html, /Move into paid support when you are ready to turn an idea into real work\./);
    assert.doesNotMatch(html, /Use Life to log/);
    assert.doesNotMatch(html, /Join a Cell/);
    assert.doesNotMatch(html, /Life starter/);
    assert.match(html, /Pick a clear starting point/);
    assert.match(html, /Choose one of three lanes: a daily check-in, a small support group, or direct help launching a project or offer\./);
    assert.match(html, /Start with Life for a daily check-in, weekly reflection, and one clear next action\./);
    assert.match(html, /Explore paid plans/);
    assert.match(html, /Talk through scope/);
  });

  it('makes the main plans page explicit about continuing in the portal', async () => {
    const html = await readFile(new URL('../subscribe/index.html', import.meta.url), 'utf8');
    assert.match(html, /Start free to get organized, support the mission at \$5, grow with \$20, or move into a \$50 builder lane and custom scoped work\./);
    assert.match(html, /Get organized, sort out your next steps, and start using the portal without paying first\./);
    assert.match(html, /Choose by business type/);
    assert.match(html, /See professional-services fit/);
    assert.match(html, /See local-service fit/);
    assert.match(html, /See team fit/);
    assert.match(html, /Daily check-ins and weekly reflection/);
    assert.match(html, /No credit card required\. Create one portal account and start organizing what matters\./);
    assert.match(html, /Start Free in Portal/);
    assert.match(html, /Continue to Portal for \$5/);
    assert.match(html, /Continue to Portal for \$20/);
    assert.match(html, /Continue to Portal for \$50/);
    assert.match(html, /Open custom checkout in Portal/);
    assert.doesNotMatch(html, /Start free with Life/);
    assert.doesNotMatch(html, /Life starter/);
  });

  it('keeps the free plan detail page aligned with the portal onboarding flow', async () => {
    const html = await readFile(new URL('../subscribe/free-plan.html', import.meta.url), 'utf8');
    assert.match(html, /Get organized, sort out your next steps, and start inside the portal\./);
    assert.match(html, /The free plan gives you a simple place to check in daily, reflect each week, and build momentum before you pay for anything\./);
    assert.match(html, /Start Free/);
    assert.match(html, /Open start flow/);
    assert.match(html, /Open the portal start flow, choose your lane, and personalize the way you track and organize your day\./);
    assert.doesNotMatch(html, /open Life inside the portal/i);
    assert.doesNotMatch(html, /Life starter/);
  });

  it('keeps paid plan detail pages explicit about the portal billing handoff', async () => {
    const starterHtml = await readFile(new URL('../subscribe/family-friends.html', import.meta.url), 'utf8');
    const founderHtml = await readFile(new URL('../subscribe/founder-plan.html', import.meta.url), 'utf8');
    const builderHtml = await readFile(new URL('../subscribe/builder-plan.html', import.meta.url), 'utf8');
    assert.match(starterHtml, /Continue to Portal for \$5/);
    assert.match(founderHtml, /Continue to Portal for Founder/);
    assert.match(builderHtml, /Continue to Portal for Builder/);
  });

  it('ships segment pages for the three paid wedges', async () => {
    const professionalHtml = await readFile(new URL('../subscribe/professional-services.html', import.meta.url), 'utf8');
    const localHtml = await readFile(new URL('../subscribe/local-services.html', import.meta.url), 'utf8');
    const supportHtml = await readFile(new URL('../subscribe/support-teams.html', import.meta.url), 'utf8');

    assert.match(professionalHtml, /For Professional Services/);
    assert.match(professionalHtml, /Keep warm leads moving without building a giant sales stack\./);
    assert.match(professionalHtml, /Continue to Portal for Builder/);
    assert.match(localHtml, /For Local Services/);
    assert.match(localHtml, /Stop letting calls, quotes, and follow-up slip through the cracks\./);
    assert.match(localHtml, /Continue to Portal for Builder/);
    assert.match(supportHtml, /For Support Teams/);
    assert.match(supportHtml, /Give the team one calmer system for people, follow-up, and weekly action\./);
    assert.match(supportHtml, /Continue to Portal for Embedded/);
  });

  it('keeps the campaign page exposed for higher-intent buyers', async () => {
    const html = await readFile(new URL('../launch-your-site.html', import.meta.url), 'utf8');
    assert.match(html, /Launch your site without hiring a full agency\./);
    assert.match(html, /Talk through scope/);
    assert.match(html, /mailto:hello@3dvr\.tech\?subject=3DVR%20Website%20Scope/);
  });
});
