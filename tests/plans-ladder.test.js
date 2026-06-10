import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

describe('3DVR plans ladder page', () => {
  it('ships a dedicated plans and project sprints route', async () => {
    const html = await readFile(new URL('../plans/index.html', import.meta.url), 'utf8');

    assert.match(html, /<link rel="canonical" href="https:\/\/3dvr\.tech\/plans\/" \/>/);
    assert.match(html, /<title>3DVR Plans and Project Sprints \| 3dvr\.tech<\/title>/);
    assert.match(html, /Build the future with 3DVR\./);
    assert.match(html, /Join 3DVR monthly, or hire us for a one-time sprint\./);
    assert.match(html, /Start with a \$300 Microsite/);
    assert.match(html, /Join as a \$5 Supporter/);
    assert.match(html, /Sell and deliver 3DVR plans and microsite services/);
    assert.match(html, /Find leads/);
    assert.match(html, /turn one-time work into recurring support/);
    assert.match(html, /<script defer src="\/_vercel\/insights\/script\.js"><\/script>/);
    assert.match(html, /src="\.\.\/subscribe\/portal-links\.js"/);
    assert.doesNotMatch(html, /hello@3dvr\.tech/);
  });

  it('maps monthly plan cards to existing portal billing lanes', async () => {
    const html = await readFile(new URL('../plans/index.html', import.meta.url), 'utf8');

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
    const html = await readFile(new URL('../plans/index.html', import.meta.url), 'utf8');

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

  it('links the new route from the homepage and sitemap', async () => {
    const homeHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
    const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');

    assert.match(homeHtml, /href="plans\/">Plans<\/a>/);
    assert.match(homeHtml, /href="plans\/">\s*See plans\s*<\/a>/);
    assert.match(homeHtml, /Open plans and project sprints/);
    assert.match(sitemap, /<loc>https:\/\/3dvr\.tech\/plans\/<\/loc>/);
  });
});
