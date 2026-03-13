const DEFAULT_PORTAL_ORIGIN = 'https://portal.3dvr.tech';
const DEFAULT_PREVIEW_PORTAL_ORIGIN =
  'https://3dvr-portal-git-feature-stripe-billing-portal-tmstephs-projects.vercel.app';
const PREVIEW_PORTAL_ORIGIN_BY_WEB_HOST = {
  // These PRs currently use different branch slugs, so a simple host rename is not enough.
  '3dvr-web-git-feature-billing-center-links-tmstephs-projects.vercel.app':
    DEFAULT_PREVIEW_PORTAL_ORIGIN
};

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

function inferPreviewPortalOrigin(currentOrigin = window.location.origin) {
  const normalizedCurrent = normalizeOrigin(currentOrigin);
  if (!normalizedCurrent) {
    return '';
  }

  try {
    const currentUrl = new URL(normalizedCurrent);
    const host = String(currentUrl.hostname || '').trim().toLowerCase();
    if (!host.endsWith('.vercel.app')) {
      return '';
    }

    return normalizeOrigin(PREVIEW_PORTAL_ORIGIN_BY_WEB_HOST[host] || DEFAULT_PREVIEW_PORTAL_ORIGIN);
  } catch (error) {
    return '';
  }
}

function resolvePortalOrigin() {
  return (
    resolveQueryOverrideOrigin()
    || resolveDocumentOrigin()
    || inferPreviewPortalOrigin()
    || DEFAULT_PORTAL_ORIGIN
  );
}

function setPortalLinks(portalOrigin) {
  document.querySelectorAll('[data-portal-path]').forEach(link => {
    const path = String(link.dataset.portalPath || '').trim();
    if (!path) {
      return;
    }

    link.href = `${portalOrigin}${path.startsWith('/') ? path : `/${path}`}`;
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
