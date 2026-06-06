# 3dvr.tech Site Critique

Reviewed live production pages on June 6, 2026:

- `https://3dvr.tech/`
- `https://3dvr.tech/subscribe/`
- `https://3dvr.tech/apps.html`
- `https://3dvr.tech/vision/`
- `https://3dvr.tech/sitemap.xml`

Note: local Chromium screenshot capture failed in the Debian proot because Chromium could not initialize GPU/headless
rendering. This critique is based on live HTML, page structure, metadata, network headers, and content hierarchy rather
than pixel-level visual review.

## Short Version

The site has a real offer now: `We help small businesses actually launch.` That is the strongest positioning on the
homepage.

The main problem is that the homepage immediately dilutes that offer with too many parallel stories:

- websites
- apps
- direct support
- portal
- browser
- OS
- open hardware
- nomad system
- subscriptions
- community
- long-term vision

The result feels alive and energetic, but not yet calm or commercially sharp.

## What Is Working

- The hero line is strong: `We help small businesses actually launch.`
- The current offer is more concrete than before: sites, landing pages, simple systems, and support.
- The portal gives the ecosystem a real destination.
- Testimonials and partner/client links add credibility.
- The Vision page is useful as a home for open hardware and nomad roadmap material.
- The pricing ladder has enough range for casual users, supporters, active businesses, and teams.

## Main Problems

### 1. The Homepage Is Doing Too Much

A small-business visitor probably wants to answer four questions quickly:

- Can you build my site?
- What does it cost?
- Can I trust you?
- How do I start?

Instead, they hit Portal, Browser, OS, TommyOS, Pocket Workstation, Nomad System, open hardware, subscriptions, and
support. Those are interesting, but they should be secondary to the commercial offer.

### 2. The Hero Has Too Many Decisions

The hero includes:

- primary CTA
- secondary CTA
- clarity feedback
- six plan chips

That is too much for the first viewport.

Recommended first viewport:

- one sentence offer
- `Start a project`
- `See plans` or `See examples`

Move plan chips lower on the page.

### 3. The Public Feedback Widget Weakens Confidence

`Does this explain the offer clearly?` is useful internally, but publicly it signals that the site itself may not be
sure. Remove it from the hero or hide it behind an internal/debug flag.

### 4. Pricing Positioning Is Inconsistent

The homepage, subscribe page, and About section describe the plans differently:

- Homepage shows Free, $5, $20, $50, $200.
- Subscribe page says `Launch in 3 Days` is the fast entry point and Builder is the default business lane.
- About says the ecosystem starts with `$20/month personal services`.

Recommended hierarchy:

- Free: get organized
- $50 Builder: default business help
- $200 Team/Enterprise: shared workflows
- Custom: one-time project or deposit
- $5 Family & Friends: de-emphasized or supporter-oriented

### 5. The Long-Term Vision Competes With The Current Business

Open hardware, nomad system, TommyOS, and portal/browser/OS are valuable. They should feel like `the lab` or `the
vision`, not the main thing a paying customer must understand before buying.

### 6. Trust Could Be Stronger

The testimonials are useful, but they would convert better with:

- project screenshots
- what 3dvr built
- timeline
- outcome
- link to live site
- one short case-study card above the fold

### 7. Some Pages Feel Older Than The Homepage

`/apps.html` is thin compared with the current homepage. If someone clicks `App Designs`, it feels like an older
brochure page.

Either strengthen those pages or route them into current Portal/services pages.

### 8. SEO And Maintenance Details Need Cleanup

The live homepage was last modified on June 5, 2026, but `sitemap.xml` still shows `2025-10-10` for many pages. The
footer still says `© 2025`.

Homepage title is also too generic:

- Current: `3dvr.tech`
- Better: `3dvr.tech | Websites, Apps, and Tech Support for Small Businesses`

## Highest-Leverage Fix

Do not redesign everything first. Fix the homepage narrative:

1. Hero: one sentence offer, two buttons.
2. What We Do: website/app, offer shaping, ongoing support.
3. Proof: examples/testimonials.
4. Plans: make Builder the recommended business lane.
5. Portal: explain it as the workspace customers enter after starting.
6. Vision/Lab: teaser linking to `/vision/`, not a full competing story.

## Suggested Homepage Positioning

Top-level frame:

> 3dvr.tech helps small businesses launch simple websites, offers, and operating systems with direct human support.

Deeper ecosystem frame:

> The portal and open hardware vision are where this grows next.

## Piece-By-Piece Work Plan

Use this order unless a current customer need overrides it:

1. Tighten the hero.
   Verify: first viewport has one offer, two clear CTAs, and no public uncertainty widget.

2. Clean up plan positioning.
   Verify: homepage, subscribe page, and About section all agree on which plan is the default business lane.

3. Move long-term vision below the commercial funnel.
   Verify: Portal/OS/open-hardware language supports the offer instead of competing with it.

4. Strengthen proof.
   Verify: at least one case-study-style card explains what was built, for whom, and the outcome.

5. Refresh thin service pages.
   Verify: `apps.html`, `websites.html`, `support.html`, and related pages feel consistent with the homepage.

6. Clean up metadata and maintenance details.
   Verify: sitemap dates, footer year, title, and descriptions match the current site.

