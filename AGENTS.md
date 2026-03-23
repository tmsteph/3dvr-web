# AGENTS Guidelines

## Mission
Keep the marketing site and billing entry points aligned with the portal environment they are supposed to target. Subscription links must be predictable across production, staging, and previews.

## Portable Personal Context
- This repo carries a mirrored copy of Thomas Stephens' markdown control plane in `ops/control-plane/home/`.
- On devices where the full `~/` control plane is missing or different, read the mirrored files there before making broad assumptions.
- Treat the mirrored files as portable context, but prefer the live `~/` files when both are present.

## Deployment Topology
- Keep `3dvr-web` and `3dvr-portal` on the same branch matrix:
  - `main` -> `https://3dvr.tech` and `https://portal.3dvr.tech`
  - `staging` -> `https://staging.3dvr.tech` and `https://portal-staging.3dvr.tech`
  - `feature/*` -> paired Vercel preview URLs
- Treat environments by billing mode:
  - `main`: live Stripe
  - `staging`: live Stripe behind Vercel auth for existing-subscriber verification
  - `feature/*`: Stripe test mode for signup, checkout, and switch-flow QA
- Never assume a Stripe test preview can validate a real live subscriber. Use `staging` or `main` for that.
- After a new `staging` deploy, refresh the custom staging domains from `3dvr-portal` with `npm run vercel:alias-staging`.
- Treat `401` from `https://staging.3dvr.tech` or `https://portal-staging.3dvr.tech` as expected when Vercel auth is enabled. Treat `404 DEPLOYMENT_NOT_FOUND` as broken staging routing.

## Portal Link Resolution
- Billing links are resolved in `subscribe/portal-links.js`.
- Keep the precedence order stable:
  - `?portalOrigin=...`
  - `data-portal-origin` or `meta[name="3dvr:portal-origin"]`
  - `PREVIEW_PORTAL_ORIGIN_BY_WEB_HOST`
  - production fallback `https://portal.3dvr.tech`
- When two previews need to work together, prefer an explicit `portalOrigin` pairing or update the preview host map.
- Do not let preview billing links silently fall back to production if the portal route or plan is only available in preview.

## UX Expectations
- Subscription CTAs must make it clear when the user is leaving the marketing site for portal billing.
- Preserve the resolved portal origin across internal subscribe/detail links so plan cards stay in the same environment.
- Avoid dead-end states where a preview page links into a production billing route that does not exist yet.

## Formatting
- Use two spaces for indentation in HTML, CSS, JavaScript, and JSON.
- Keep copy direct and operational. Prefer concrete environment names over vague "test" or "preview" language.

## Testing & Verification
- After changing any billing CTA or portal-origin logic, verify the main paid plan links at minimum.
- Test both a production-like path and a preview-paired path when touching `subscribe/portal-links.js`.
- If a link bug only reproduces on Vercel previews, verify the preview host map and any `portalOrigin` overrides before changing production defaults.
