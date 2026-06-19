import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const serviceWorkerPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'service-worker.js'
);

async function loadServiceWorker({
  cacheMatch = async () => undefined,
  fetchImpl
} = {}) {
  const source = await readFile(serviceWorkerPath, 'utf8');
  const listeners = {};
  const cachePuts = [];
  const deletedCaches = [];

  const caches = {
    async match(request) {
      return cacheMatch(request, 'global');
    },
    async open(cacheName) {
      return {
        async addAll() {},
        async match(request) {
          return cacheMatch(request, cacheName);
        },
        async put(request, response) {
          cachePuts.push({ cacheName, request, response });
        }
      };
    },
    async keys() {
      return ['3dvr-cache-v1', '3dvr-runtime-v6', '3dvr-offline-v6'];
    },
    async delete(cacheName) {
      deletedCaches.push(cacheName);
      return true;
    }
  };

  const sandbox = {
    URL,
    Response,
    Headers,
    Promise,
    console,
    caches,
    fetch: fetchImpl || (async () => new Response('network', { status: 200 })),
    self: {
      location: { origin: 'https://www.3dvr.tech' },
      clients: { claim() {} },
      registration: {
        navigationPreload: { enable() {} }
      },
      skipWaiting() {},
      addEventListener(type, handler) {
        listeners[type] = handler;
      }
    }
  };

  vm.runInNewContext(source, sandbox, {
    filename: path.basename(serviceWorkerPath)
  });

  return { listeners, cachePuts, deletedCaches };
}

function createRequest(url, options = {}) {
  const headers = new Map();
  if (options.accept) {
    headers.set('accept', options.accept);
  }

  return {
    method: options.method || 'GET',
    mode: options.mode || 'same-origin',
    url,
    headers: {
      get(name) {
        return headers.get(String(name).toLowerCase()) || '';
      }
    }
  };
}

async function dispatchFetch(listeners, request) {
  let responsePromise;
  const waitUntilPromises = [];
  listeners.fetch({
    request,
    waitUntil(promise) {
      waitUntilPromises.push(promise);
    },
    respondWith(promise) {
      responsePromise = promise;
    }
  });

  assert.ok(responsePromise, 'fetch handler should call respondWith');
  const response = await responsePromise;
  await Promise.all(waitUntilPromises);
  return response;
}

test('service worker uses network-first for html navigations', async () => {
  let fetchCalls = 0;
  const { listeners, cachePuts } = await loadServiceWorker({
    cacheMatch: async (request, cacheName) => {
      if (cacheName === '3dvr-offline-v6' && request === '/index.html') {
        return new Response('offline-home', { status: 200 });
      }
      return new Response('cached-html', { status: 200 });
    },
    fetchImpl: async () => {
      fetchCalls += 1;
      return new Response('network-html', { status: 200 });
    }
  });

  const response = await dispatchFetch(
    listeners,
    createRequest('https://www.3dvr.tech/subscribe/index.html', {
      mode: 'navigate',
      accept: 'text/html'
    })
  );

  assert.equal(fetchCalls, 1);
  assert.equal(await response.text(), 'network-html');
  assert.equal(cachePuts.length, 1);
  assert.equal(cachePuts[0].cacheName, '3dvr-offline-v6');
});

test('service worker refreshes fresh same-origin assets in the background', async () => {
  let fetchCalls = 0;
  const { listeners } = await loadServiceWorker({
    cacheMatch: async (request, cacheName) => {
      if (cacheName === '3dvr-runtime-v6' && request?.url === 'https://www.3dvr.tech/subscribe/portal-links.js') {
        return new Response('cached-js', {
          status: 200,
          headers: { 'sw-cached-at': String(Date.now()) }
        });
      }
      return undefined;
    },
    fetchImpl: async () => {
      fetchCalls += 1;
      return new Response('network-js', { status: 200 });
    }
  });

  const response = await dispatchFetch(
    listeners,
    createRequest('https://www.3dvr.tech/subscribe/portal-links.js', {
      accept: 'text/javascript'
    })
  );

  assert.equal(fetchCalls, 1);
  assert.equal(await response.text(), 'cached-js');
});

test('service worker fetches stale same-origin assets before falling back to cache', async () => {
  let fetchCalls = 0;
  const { listeners } = await loadServiceWorker({
    cacheMatch: async (request, cacheName) => {
      if (cacheName === '3dvr-runtime-v6' && request?.url === 'https://www.3dvr.tech/dist/script.js') {
        return new Response('stale-js', {
          status: 200,
          headers: { 'sw-cached-at': String(Date.now() - 60 * 60 * 1000) }
        });
      }
      return undefined;
    },
    fetchImpl: async () => {
      fetchCalls += 1;
      return new Response('network-js', { status: 200 });
    }
  });

  const response = await dispatchFetch(
    listeners,
    createRequest('https://www.3dvr.tech/dist/script.js', {
      accept: 'text/javascript'
    })
  );

  assert.equal(fetchCalls, 1);
  assert.equal(await response.text(), 'network-js');
});
