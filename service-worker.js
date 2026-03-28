const CACHE_NAME = '3dvr-cache-v2';
const OFFLINE_ASSETS = [
  '/',
  '/index.html',
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

async function cacheResponse(request, response) {
  if (!response || response.status !== 200 || !isSameOrigin(request)) {
    return response;
  }

  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
  return response;
}

async function networkFirstResponse(request) {
  try {
    const response = await fetch(request);
    return await cacheResponse(request, response);
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    return caches.match('/index.html');
  }
}

async function cacheFirstResponse(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  return cacheResponse(request, response);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  if (isHtmlNavigationRequest(event.request)) {
    event.respondWith(networkFirstResponse(event.request));
    return;
  }

  if (isCacheableAssetRequest(event.request)) {
    event.respondWith(cacheFirstResponse(event.request));
  }
});
