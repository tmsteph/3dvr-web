import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const serviceWorkerPath = '/data/data/com.termux/files/home/3dvr-web-billing-center/service-worker.js';

async function loadServiceWorker({
  cacheMatch,
  fetchImpl
} = {}) {
  const source = await readFile(serviceWorkerPath, 'utf8');
  const listeners = {};
  const cachePuts = [];

  const caches = {
    async match(request) {
      if (typeof cacheMatch === 'function') {
        return cacheMatch(request);
      }
      return undefined;
    },
    async open() {
      return {
        async addAll() {},
        async put(request, response) {
          cachePuts.push({ request, response });
        }
      };
    },
    async keys() {
      return ['3dvr-cache-v1', '3dvr-cache-v2'];
    },
    async delete() {
      return true;
    }
  };

  const sandbox = {
    URL,
    Response,
    Promise,
    console,
    caches,
    fetch: fetchImpl || (async () => new Response('network', { status: 200 })),
    self: {
      location: { origin: 'https://www.3dvr.tech' },
      clients: { claim() {} },
      skipWaiting() {},
      addEventListener(type, handler) {
        listeners[type] = handler;
      }
    }
  };

  vm.runInNewContext(source, sandbox, {
    filename: path.basename(serviceWorkerPath)
  });

  return { listeners, cachePuts };
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
  listeners.fetch({
    request,
    respondWith(promise) {
      responsePromise = promise;
    }
  });

  assert.ok(responsePromise, 'fetch handler should call respondWith');
  return responsePromise;
}

test('service worker uses network-first for html navigations', async () => {
  let fetchCalls = 0;
  const { listeners, cachePuts } = await loadServiceWorker({
    cacheMatch: async (request) => {
      if (request === '/index.html') {
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
});

test('service worker keeps same-origin js assets cache-first', async () => {
  let fetchCalls = 0;
  const { listeners } = await loadServiceWorker({
    cacheMatch: async (request) => {
      if (request?.url === 'https://www.3dvr.tech/subscribe/portal-links.js') {
        return new Response('cached-js', { status: 200 });
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

  assert.equal(fetchCalls, 0);
  assert.equal(await response.text(), 'cached-js');
});
