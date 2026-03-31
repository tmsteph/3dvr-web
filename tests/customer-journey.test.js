import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

describe('3dvr-web customer journey copy', () => {
  it('keeps the homepage focused on concrete first steps and the portal start path', async () => {
    const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
    assert.match(html, /Plan your week\. Get support\. Launch work\./);
    assert.match(html, /Get clear on your next move\./);
    assert.match(html, /Start with one clear step\./);
    assert.match(html, /One place to get organized and keep work moving\./);
    assert.match(html, /Use 3dvr to plan your next step, stay accountable, and get direct help launching a/);
    assert.match(html, /Start free/);
    assert.match(html, /Plans/);
    assert.match(html, /Best fit for paying buyers/);
    assert.match(html, /Get organized/);
    assert.match(html, /\$5/);
    assert.match(html, /\$20/);
    assert.match(html, /\$50/);
    assert.match(html, /Best first page/);
    assert.match(html, /Professional services/);
    assert.match(html, /Local services/);
    assert.match(html, /Support teams/);
    assert.match(html, /What 3dvr helps you do/);
    assert.match(html, /Get organized/);
    assert.match(html, /See what matters, keep simple notes, and stop losing the next step\./);
    assert.match(html, /Get support/);
    assert.match(html, /Stop figuring everything out alone when you need accountability or a second brain\./);
    assert.match(html, /Start earning/);
    assert.match(html, /Turn an idea into a page, offer, or service that people can actually buy\./);
    assert.doesNotMatch(html, /Use Life to log/);
    assert.doesNotMatch(html, /Join a Cell/);
    assert.doesNotMatch(html, /Life starter/);
    assert.match(html, /Choose your starting lane/);
    assert.match(html, /Start free for structure\. Move up when you want closer support or help launching work\./);
    assert.match(html, /Use the portal to plan your week, reflect, and keep one clear next step\./);
    assert.match(html, /See plans and services/);
    assert.match(html, /See plans/);
    assert.match(html, /For service businesses/);
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
    assert.match(html, /mailto:3dvr\.tech@gmail\.com\?subject=3DVR%20Website%20Scope/);
  });
});
