const DEFAULT_PORTAL_ORIGIN = 'https://portal.3dvr.tech';

function trimTrailingSlash(value = '') {
  return String(value || '').trim().replace(/\/+$/, '');
}

function resolveOverrideOrigin() {
  const params = new URLSearchParams(window.location.search);
  const candidate = params.get('portalOrigin');
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

function setPortalLinks(portalOrigin) {
  document.querySelectorAll('[data-portal-path]').forEach(link => {
    const path = String(link.dataset.portalPath || '').trim();
    if (!path) {
      return;
    }

    link.href = `${portalOrigin}${path.startsWith('/') ? path : `/${path}`}`;
  });
}

function preservePortalOrigin(overrideOrigin) {
  if (!overrideOrigin) {
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

      nextUrl.searchParams.set('portalOrigin', overrideOrigin);
      link.href = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
    } catch (error) {
      // Ignore malformed hrefs and leave the authored fallback intact.
    }
  });
}

function initPortalLinks() {
  const overrideOrigin = resolveOverrideOrigin();
  const portalOrigin = overrideOrigin || DEFAULT_PORTAL_ORIGIN;
  setPortalLinks(portalOrigin);
  preservePortalOrigin(overrideOrigin);
}

initPortalLinks();
