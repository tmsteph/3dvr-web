# 3dvr-web

html re-write

Welcome to 3dvr.tech

This is the Code Repository for our main 3dvr.tech website known as our home-page. 

If you want to view or edit the code for the 3dvr.tech website, you are in the right place. 


We recently re-designed to pure html, css, and java-scritpt. We were using React but found it a bit too complex and fragile for our needs. 

Check it out for yourself at https://3dvr.tech 

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

## Portal Billing Link Rules

`subscribe/portal-links.js` decides where billing links should go. The resolution order is:

1. `?portalOrigin=https://...`
2. `data-portal-origin` on `<html>` or `meta[name="3dvr:portal-origin"]`
3. `PREVIEW_PORTAL_ORIGIN_BY_WEB_HOST` for known web-preview to portal-preview pairings
4. Production fallback: `https://portal.3dvr.tech`

Operational rules:

- `main` web pages should point to `https://portal.3dvr.tech`.
- `staging` web pages should point to `https://portal-staging.3dvr.tech`.
- `feature/*` previews should point to the matching portal preview, either through `portalOrigin` or the preview host map.
- Never let preview billing links fall back to production when the target plan or billing route only exists in preview.
- If Stripe is in test mode, make sure the paired portal preview also uses Stripe test price ids instead of live `price_...` values.
