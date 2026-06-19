const CACHE_NAME = '3dvr-runtime-v6';
const OFFLINE_CACHE_NAME = '3dvr-offline-v6';
const RUNTIME_MAX_AGE_MS = 10 * 60 * 1000;
const CACHE_TIMESTAMP_HEADER = 'sw-cached-at';
const OFFLINE_ASSETS = [
  '/',
  '/index.html',
  '/system.html',
  '/assets/logo-3dvr.svg',
  '/3DVR.png',
  '/3DVRfavicon.png'
];
const CACHEABLE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.css',
  '.js',
  '.json',
  '.webmanifest',
  '.woff',
  '.woff2'
];

function requestUrl(request) {
  try {
    return new URL(request.url);
  } catch (error) {
    return null;
  }
}

function isSameOrigin(request) {
  const url = requestUrl(request);
  return Boolean(url && url.origin === self.location.origin);
}

function isHtmlNavigationRequest(request) {
  const url = requestUrl(request);
  const accept = String(request?.headers?.get?.('accept') || '').toLowerCase();
  return Boolean(
    request?.mode === 'navigate'
    || accept.includes('text/html')
    || url?.pathname.endsWith('.html')
    || url?.pathname === '/'
  );
}

function isCacheableAssetRequest(request) {
  if (!isSameOrigin(request) || isHtmlNavigationRequest(request)) {
    return false;
  }

  const url = requestUrl(request);
  if (!url) {
    return false;
  }

  if (OFFLINE_ASSETS.includes(url.pathname)) {
    return true;
  }

  return CACHEABLE_EXTENSIONS.some(extension => url.pathname.endsWith(extension));
}

function cachedAt(response) {
  const timestamp = Number(response?.headers?.get?.(CACHE_TIMESTAMP_HEADER) || 0);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function isFreshCachedResponse(response) {
  const timestamp = cachedAt(response);
  return Boolean(timestamp && Date.now() - timestamp < RUNTIME_MAX_AGE_MS);
}

async function timestampedResponse(response) {
  const headers = new Headers(response.headers);
  headers.set(CACHE_TIMESTAMP_HEADER, String(Date.now()));

  return new Response(await response.clone().blob(), {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function cacheResponse(request, response, cacheName = CACHE_NAME) {
  if (!response || response.status !== 200 || !isSameOrigin(request)) {
    return response;
  }

  const cache = await caches.open(cacheName);
  await cache.put(request, await timestampedResponse(response));
  return response;
}

async function networkFirstNavigationResponse(request) {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    return await cacheResponse(request, response, OFFLINE_CACHE_NAME);
  } catch (error) {
    const cache = await caches.open(OFFLINE_CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    return cache.match('/index.html');
  }
}

function updateCachedAsset(request) {
  return fetch(request, { cache: 'no-store' })
    .then((response) => cacheResponse(request, response))
    .catch(() => undefined);
}

async function shortLivedAssetResponse(request, event) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached && isFreshCachedResponse(cached)) {
    event.waitUntil(updateCachedAsset(request));
    return cached;
  }

  try {
    const response = await fetch(request, { cache: 'no-store' });
    return await cacheResponse(request, response);
  } catch (error) {
    if (cached) {
      return cached;
    }

    const offlineCached = await caches.match(request);
    if (offlineCached) {
      return offlineCached;
    }

    throw error;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== OFFLINE_CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
      .then(() => self.registration?.navigationPreload?.enable?.())
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  if (isHtmlNavigationRequest(event.request)) {
    event.respondWith(networkFirstNavigationResponse(event.request));
    return;
  }

  if (isCacheableAssetRequest(event.request)) {
    event.respondWith(shortLivedAssetResponse(event.request, event));
  }
});
