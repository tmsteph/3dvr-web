# 3dvr-web

**Core product surface:** this is the maintained repository for the public `3dvr.tech` commercial front door.

Welcome to 3dvr.tech.

This repository contains the main 3DVR website. If you want to view or edit the code for the current public homepage, you are in the right place.

The site intentionally uses a simple HTML/CSS/JavaScript stack. Earlier website repositories and React experiments are Legacy unless a README explicitly says otherwise.

## Ecosystem position

- **Core:** `3dvr-web`, `3dvr-portal`, 3DVR OS, 3DVR Calendar, and the current `tmsteph.com` path.
- **Labs:** experimental computing, browser, hardware, character, and research work that may later graduate into Core.
- **Legacy:** superseded 3DVR website/app repositories kept as historical source and redirected toward the current maintained path.

Public product work for the main 3DVR website belongs here rather than in older website repositories.

Check it out at https://3dvr.tech

## Deployment Topology

Keep `3dvr-web` and `3dvr-portal` on the same branch matrix so subscription links and billing routes stay consistent.

| Branch | Web domain | Portal domain | Billing mode |
| --- | --- | --- | --- |
| `main` | `https://3dvr.tech` | `https://portal.3dvr.tech` | Live Stripe |
| `staging` | `https://staging.3dvr.tech` | `https://portal-staging.3dvr.tech` | Live Stripe behind Vercel auth |
| `feature/*` | Vercel preview URL | Vercel preview URL | Stripe test mode |

- Use PR previews for test-mode signup, checkout, and plan-switch QA.
- Use `staging` to verify real existing subscribers before merging to production.
- Do not treat a Stripe test preview as evidence about live subscribers. Test mode cannot see live customers.
- After each new `staging` deploy, run `npm run vercel:alias-staging` from `3dvr-portal` so `https://staging.3dvr.tech` and `https://portal-staging.3dvr.tech` stay attached to the current staging previews.
- A healthy protected staging domain returns `401` from Vercel auth. `404 DEPLOYMENT_NOT_FOUND` means the staging alias is broken.

## Portal Billing Link Rules

`subscribe/portal-links.js` decides where billing links should go. The resolution order is:

1. `?portalOrigin=https://...`
2. `data-portal-origin` on `<html>` or `meta[name="3dvr:portal-origin"]`
3. Known host pairings in `subscribe/portal-links.js` for staging domains and preview-to-preview mappings
4. Production fallback: `https://portal.3dvr.tech`

Operational rules:

- `main` web pages should point to `https://portal.3dvr.tech`.
- `staging` web pages should point to `https://portal-staging.3dvr.tech`.
- `feature/*` previews should point to the matching portal preview, either through `portalOrigin` or the preview host map.
- Never let preview billing links fall back to production when the target plan or billing route only exists in preview.
- If Stripe is in test mode, make sure the paired portal preview also uses Stripe test price ids instead of live `price_...` values.

## Browser Testing

- `npm run test:e2e` runs Playwright in Debian `proot` so browser automation stays out of native Termux.
- `npm run playwright:install` installs the Firefox browser used by the current Playwright setup inside Debian.
- The current Playwright coverage checks the full-screen `3dvr-world/` route on desktop and mobile viewports.
- Playwright covers browser behavior only. Real WebXR or headset validation still needs an actual VR-capable browser or headset session.
- The `3dvr-world/` prototype now sits behind a quieter link in the homepage projects area instead of a hero CTA.
