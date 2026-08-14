const DEFAULT_PORTAL_ORIGIN = 'https://portal.3dvr.tech';
const DEFAULT_STAGING_PORTAL_ORIGIN = 'https://portal-staging.3dvr.tech';
const DEFAULT_PREVIEW_PORTAL_ORIGIN =
  'https://3dvr-portal-git-feature-stripe-billing-portal-tmstephs-projects.vercel.app';
const DEFAULT_STAGING_PREVIEW_PORTAL_ORIGIN =
  'https://3dvr-portal-git-staging-tmstephs-projects.vercel.app';
const PORTAL_ORIGIN_BY_WEB_HOST = {
  'staging.3dvr.tech': DEFAULT_STAGING_PORTAL_ORIGIN,
  '3dvr-web-git-staging-tmstephs-projects.vercel.app': DEFAULT_STAGING_PREVIEW_PORTAL_ORIGIN,
  // These PRs currently use different branch slugs, so a simple host rename is not enough.
  '3dvr-web-git-feature-billing-center-links-tmstephs-projects.vercel.app':
    DEFAULT_PREVIEW_PORTAL_ORIGIN
};
const DIRECT_PAY_PATHS = new Set([
  '/billing/?plan=starter',
  '/billing/?plan=pro',
  '/billing/?plan=builder',
  '/billing/?plan=embedded'
]);
const DIRECT_PAY_LABELS = new Map([
  ['/pay/?plan=starter', 'Pay $5 securely'],
  ['/pay/?plan=pro', 'Pay $20 securely'],
  ['/pay/?plan=builder', 'Pay $50 securely'],
  ['/pay/?plan=embedded', 'Pay $200 securely']
]);
const DIRECT_PAY_NOTICE = 'Secure Stripe checkout. No portal account required before payment.';

function trimTrailingSlash(value = '') {
  return String(value || '').trim().replace(/\/+$/, '');
}

function normalizeOrigin(value = '') {
  const candidate = String(value || '').trim();
  if (!candidate) {
    return '';
  }

  try {
    const url = new URL(candidate);
    const isHttps = url.protocol === 'https:';
    const isLocalHttp = url.protocol === 'http:'
      && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');

    if (!isHttps && !isLocalHttp) {
      return '';
    }

    return trimTrailingSlash(url.origin);
  } catch (error) {
    return '';
  }
}

function resolveQueryOverrideOrigin() {
  const params = new URLSearchParams(window.location.search);
  return normalizeOrigin(params.get('portalOrigin'));
}

function resolveDocumentOrigin() {
  const fromHtml = document.documentElement?.dataset?.portalOrigin || '';
  if (fromHtml) {
    return normalizeOrigin(fromHtml);
  }

  const meta = document.querySelector('meta[name="3dvr:portal-origin"]');
  return normalizeOrigin(meta?.content || '');
}

function inferPortalOrigin(currentOrigin = window.location.origin) {
  const normalizedCurrent = normalizeOrigin(currentOrigin);
  if (!normalizedCurrent) {
    return '';
  }

  try {
    const currentUrl = new URL(normalizedCurrent);
    const host = String(currentUrl.hostname || '').trim().toLowerCase();
    const mappedOrigin = normalizeOrigin(PORTAL_ORIGIN_BY_WEB_HOST[host] || '');
    if (mappedOrigin) {
      return mappedOrigin;
    }

    if (!host.endsWith('.vercel.app')) {
      return '';
    }

    return normalizeOrigin(DEFAULT_PREVIEW_PORTAL_ORIGIN);
  } catch (error) {
    return '';
  }
}

function resolvePortalOrigin() {
  return (
    resolveQueryOverrideOrigin()
    || resolveDocumentOrigin()
    || inferPortalOrigin()
    || DEFAULT_PORTAL_ORIGIN
  );
}

function resolvePortalPath(value = '') {
  const path = String(value || '').trim();
  if (DIRECT_PAY_PATHS.has(path)) {
    return path.replace('/billing/', '/pay/');
  }
  return path;
}

function applyDirectPayPresentation(link, path) {
  const label = DIRECT_PAY_LABELS.get(path);
  if (!label) {
    return;
  }

  link.textContent = label;
  link.removeAttribute('target');
  link.removeAttribute('rel');
  link.dataset.checkoutMode = 'direct';

  const notice = link.closest?.('.card')?.querySelector?.('.notice');
  if (notice) {
    notice.textContent = DIRECT_PAY_NOTICE;
  }
}

function setPortalLinks(portalOrigin) {
  document.querySelectorAll('[data-portal-path]').forEach(link => {
    const path = resolvePortalPath(link.dataset.portalPath || '');
    if (!path) {
      return;
    }

    link.href = `${portalOrigin}${path.startsWith('/') ? path : `/${path}`}`;
    applyDirectPayPresentation(link, path);
  });
}

function preservePortalOrigin(portalOrigin) {
  if (normalizeOrigin(portalOrigin) === normalizeOrigin(DEFAULT_PORTAL_ORIGIN)) {
    return;
  }

  document.querySelectorAll('[data-preserve-portal-origin]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) {
      return;
    }

    try {
      const nextUrl = new URL(href, window.location.href);
      if (nextUrl.origin !== window.location.origin) {
        return;
      }

      nextUrl.searchParams.set('portalOrigin', portalOrigin);
      link.href = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
    } catch (error) {
      // Ignore malformed hrefs and leave the authored fallback intact.
    }
  });
}

function initPortalLinks() {
  const portalOrigin = resolvePortalOrigin();
  setPortalLinks(portalOrigin);
  preservePortalOrigin(portalOrigin);
}

initPortalLinks();
