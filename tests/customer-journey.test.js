import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

describe('3dvr-web customer journey copy', () => {
  it('keeps the homepage focused on concrete first steps and the portal start path', async () => {
    const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
    assert.match(html, /Websites\. Apps\. Direct support\./);
    assert.match(html, /I help small businesses actually launch\./);
    assert.match(html, /Not just plan\. Not just think about it\./);
    assert.match(html, /A clear place to land when you need a site, support, or a launch plan\./);
    assert.match(html, /Get a site, landing page, or simple business system with direct help from idea to launch\./);
    assert.match(html, /Start Free/);
    assert.match(html, /Start free/);
    assert.match(html, /subscribe\/free-plan\.html/);
    assert.match(html, /Ways to work together/);
    assert.match(html, /Built for/);
    assert.match(html, /Get organized/);
    assert.match(html, /\$20/);
    assert.match(html, /\$50/);
    assert.match(html, /Custom/);
    assert.match(html, /Best first page/);
    assert.match(html, /Professional services/);
    assert.match(html, /Local services/);
    assert.match(html, /Support teams/);
    assert.match(html, /What I do/);
    assert.match(html, /Build your website or app/);
    assert.match(html, /Help you figure out the offer/);
    assert.match(html, /Stay with you as it grows/);
    assert.doesNotMatch(html, /Use Life to log/);
    assert.doesNotMatch(html, /Join a Cell/);
    assert.doesNotMatch(html, /Life starter/);
    assert.match(html, /Simple ways to work together/);
    assert.match(html, /Start free if you need structure\. Start at \$20\/month if you want direct launch help\./);
    assert.match(html, /Get ongoing help shaping the idea, page, or offer and getting it launched\./);
    assert.match(html, /Best for growing businesses that need a site, follow-up, updates, and calmer operations\./);
    assert.doesNotMatch(html, /Websites\. Apps\. Real support\./);
    assert.doesNotMatch(html, /A real place to land when you need a site, support, or a launch plan\./);
    assert.doesNotMatch(html, /Best for real businesses that need a site, follow-up, updates, and calmer operations\./);
    assert.match(html, /Trusted by friends, family, and small businesses/);
    assert.match(html, /See plans and services/);
    assert.match(html, /See plans/);
    assert.match(html, /For service businesses/);
    assert.doesNotMatch(html, /Message me/i);
    assert.doesNotMatch(html, /mailto:3dvr\.tech@gmail\.com\?subject=3DVR%20Project%20Inquiry/);
    assert.doesNotMatch(html, /Plan your week\. Get support\. Launch work\./);
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
    assert.match(html, /Launch your website, offer, or project without getting stuck in tech\./);
    assert.match(html, /Message me/);
    assert.match(html, /A simple offer people can understand and say yes to\./);
    assert.match(html, /Start with direct help, move into Builder when the business is active/);
    assert.match(html, /Show up clearly fast\./);
    assert.match(html, /reads cleanly on mobile and gives visitors a clear next step\./);
    assert.match(html, /Builder/);
    assert.match(html, /Custom/);
    assert.match(html, /mailto:3dvr\.tech@gmail\.com\?subject=3DVR%20Project%20Inquiry/);
    assert.doesNotMatch(html, /Look credible fast\./);
    assert.doesNotMatch(html, /looks credible on mobile/);
    assert.doesNotMatch(html, /Talk through scope/);
    assert.doesNotMatch(html, /Why is there a \$5 plan/);
  });
});
