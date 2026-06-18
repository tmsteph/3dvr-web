import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

describe('3DVR auto-business design document', () => {
  it('ships a quieter internal design document route', async () => {
    const html = await readFile(new URL('../auto-business/index.html', import.meta.url), 'utf8');

    assert.match(html, /<link rel="canonical" href="https:\/\/3dvr\.tech\/auto-business\/" \/>/);
    assert.match(html, /<meta name="robots" content="noindex, nofollow" \/>/);
    assert.match(html, /<title>3DVR Auto-Business Design Notes \| 3dvr\.tech<\/title>/);
    assert.match(html, /3DVR auto-business\./);
    assert.match(html, /This is not the primary public pricing page\./);
    assert.match(html, /Internal offer design notes\./);
    assert.match(html, /Start with a \$300 Microsite/);
    assert.match(html, /Sell and deliver 3DVR plans and microsite services/);
    assert.match(html, /Find leads/);
    assert.match(html, /turn one-time work into recurring support/);
    assert.match(html, /<script defer src="\/_vercel\/insights\/script\.js"><\/script>/);
    assert.match(html, /src="\.\.\/subscribe\/portal-links\.js"/);
    assert.doesNotMatch(html, /hello@3dvr\.tech/);
  });

  it('maps monthly plan cards to existing portal billing lanes', async () => {
    const html = await readFile(new URL('../auto-business/index.html', import.meta.url), 'utf8');

    assert.match(html, /Free Explorer/);
    assert.match(html, /Supporter/);
    assert.match(html, /Creator/);
    assert.match(html, /Builder/);
    assert.match(html, /Partner/);
    assert.match(html, /data-portal-path="\/free-trial\.html"/);
    assert.match(html, /data-portal-path="\/billing\/\?plan=starter"/);
    assert.match(html, /data-portal-path="\/billing\/\?plan=pro"/);
    assert.match(html, /data-portal-path="\/billing\/\?plan=builder"/);
    assert.match(html, /data-portal-path="\/billing\/\?plan=embedded"/);
  });

  it('lists the one-time services and uses project-intake contact CTAs', async () => {
    const html = await readFile(new URL('../auto-business/index.html', import.meta.url), 'utf8');

    assert.match(html, /Quick Review/);
    assert.match(html, /\$50/);
    assert.match(html, /Direction Sprint/);
    assert.match(html, /\$100/);
    assert.match(html, /Starter Microsite/);
    assert.match(html, /\$300/);
    assert.match(html, /Microsite Sprint/);
    assert.match(html, /\$500/);
    assert.match(html, /Custom Build/);
    assert.match(html, /\$1,000\+/);
    assert.match(html, /mailto:3dvr\.tech@gmail\.com\?subject=Start%20a%20%24300%20Starter%20Microsite/);
    assert.match(html, /data-portal-path="\/billing\/\?plan=custom"/);
  });

  it('keeps the internal route off the public homepage and sitemap', async () => {
    const homeHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
    const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');

    assert.match(homeHtml, /href="#subscribe">Plans<\/a>/);
    assert.match(homeHtml, /href="#subscribe">\s*See plans\s*<\/a>/);
    assert.doesNotMatch(homeHtml, /Internal offer notes/);
    assert.doesNotMatch(homeHtml, /auto-business design document/);
    assert.doesNotMatch(homeHtml, /href="auto-business\/"/);
    assert.doesNotMatch(homeHtml, /href="auto-business\/">Plans<\/a>/);
    assert.doesNotMatch(homeHtml, /href="auto-business\/">\s*See plans\s*<\/a>/);
    assert.doesNotMatch(homeHtml, /Open plans and project sprints/);
    assert.doesNotMatch(sitemap, /<loc>https:\/\/3dvr\.tech\/plans\/<\/loc>/);
    assert.doesNotMatch(sitemap, /<loc>https:\/\/3dvr\.tech\/auto-business\/<\/loc>/);
  });
});
