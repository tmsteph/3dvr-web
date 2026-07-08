'use strict';

(function initServicesExperiment(window, document) {
  if (!window || !document) {
    return;
  }

  const VISITOR_ID_KEY = '3dvr-growth.visitor-id';
  const SERVICES_VARIANT_KEY = '3dvr-growth.services-lab.variant';
  const SERVICES_VIEW_DAY_KEY = '3dvr-growth.services-lab.view-day';
  const EVENT_PATH = ['3dvr-portal', 'growth', 'experiments', 'services-lab', 'events'];
  const GUN_PEERS = window.__GUN_PEERS__ || [
    'wss://relay.3dvr.tech/gun',
    'wss://gun-relay-3dvr.fly.dev/gun',
  ];
  const SOURCE = 'services-lab';

  const VARIANTS = Object.freeze({
    local: Object.freeze({
      key: 'local',
      eyebrow: 'For local service businesses',
      headline: 'Turn local attention into booked jobs.',
      body: '3dvr.tech builds practical websites for repair shops, wellness providers, local crews, and solo operators who need calls, quote requests, and trust faster.',
    }),
    launch: Object.freeze({
      key: 'launch',
      eyebrow: 'For creators and new offers',
      headline: 'Launch the offer before momentum fades.',
      body: 'Bring the idea, rough notes, or half-built page. 3dvr.tech helps shape the message, publish the site, and connect the next step so people can act.',
    }),
    systems: Object.freeze({
      key: 'systems',
      eyebrow: 'For messy business tech',
      headline: 'Stop losing leads in the handoff.',
      body: 'Clean up the simple but expensive gaps around your website: forms, booking, payments, subscriptions, follow-up, and the tech stack holding it together.',
    }),
  });

  const refs = {
    eyebrow: document.getElementById('serviceEyebrow'),
    headline: document.getElementById('serviceHeadline'),
    body: document.getElementById('serviceBody'),
    billingLinks: Array.from(document.querySelectorAll('[data-service-billing-link]')),
    trackedLinks: Array.from(document.querySelectorAll('[data-service-cta]')),
  };

  const state = {
    visitorId: '',
    variantKey: 'local',
  };

  function safeStorageGet(key) {
    try {
      return window.localStorage.getItem(key) || '';
    } catch (_error) {
      return '';
    }
  }

  function safeStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_error) {
      // Storage may be unavailable in private browsing. Continue in memory.
    }
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function getVisitorId() {
    const existing = safeStorageGet(VISITOR_ID_KEY);
    if (existing) {
      return existing;
    }
    const next = createId();
    safeStorageSet(VISITOR_ID_KEY, next);
    return next;
  }

  function hashString(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = ((hash << 5) - hash) + value.charCodeAt(index);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function normalizeVariant(value = '') {
    const normalized = String(value || '').trim().toLowerCase();
    return VARIANTS[normalized] ? normalized : '';
  }

  function variantFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return normalizeVariant(params.get('variant'));
  }

  function chooseVariant(visitorId) {
    const explicit = variantFromUrl();
    if (explicit) {
      safeStorageSet(SERVICES_VARIANT_KEY, explicit);
      return explicit;
    }

    const stored = normalizeVariant(safeStorageGet(SERVICES_VARIANT_KEY));
    if (stored) {
      return stored;
    }

    const keys = Object.keys(VARIANTS);
    const chosen = keys[hashString(visitorId) % keys.length] || 'local';
    safeStorageSet(SERVICES_VARIANT_KEY, chosen);
    return chosen;
  }

  function applyVariant(variantKey) {
    const variant = VARIANTS[variantKey] || VARIANTS.local;
    state.variantKey = variant.key;
    document.documentElement.dataset.servicesVariant = variant.key;

    if (refs.eyebrow) refs.eyebrow.textContent = variant.eyebrow;
    if (refs.headline) refs.headline.textContent = variant.headline;
    if (refs.body) refs.body.textContent = variant.body;
  }

  function addTrackingParams(url, cta) {
    const nextUrl = new URL(url, window.location.href);
    nextUrl.searchParams.set('source', SOURCE);
    nextUrl.searchParams.set('variant', state.variantKey);
    nextUrl.searchParams.set('cta', cta || 'unknown');
    nextUrl.searchParams.set('visitor', state.visitorId);
    return nextUrl.toString();
  }

  function decorateBillingLinks() {
    refs.billingLinks.forEach(link => {
      const cta = String(link.dataset.serviceCta || '').trim();
      link.href = addTrackingParams(link.href, cta);
    });
  }

  function getGun() {
    if (typeof window.Gun !== 'function') {
      return null;
    }
    try {
      return window.Gun({ peers: GUN_PEERS });
    } catch (error) {
      console.warn('Services experiment Gun init failed', error);
      return null;
    }
  }

  function getNode(root, path) {
    return path.reduce((node, key) => (node && typeof node.get === 'function' ? node.get(key) : null), root);
  }

  function writeEvent(root, payload) {
    const node = getNode(root, EVENT_PATH);
    if (!node || typeof node.get !== 'function') {
      return;
    }
    const id = String(payload.id || createId());
    node.get(id).put({
      ...payload,
      id,
    });
  }

  function logView(root) {
    const key = `${todayKey()}:${state.variantKey}`;
    if (safeStorageGet(SERVICES_VIEW_DAY_KEY) === key) {
      return;
    }
    safeStorageSet(SERVICES_VIEW_DAY_KEY, key);
    writeEvent(root, {
      visitorId: state.visitorId,
      page: SOURCE,
      eventType: 'view',
      variant: state.variantKey,
      timestamp: new Date().toISOString(),
      source: '3dvr-web',
    });
  }

  function logCtaClick(root, cta) {
    writeEvent(root, {
      visitorId: state.visitorId,
      page: SOURCE,
      eventType: 'cta-click',
      cta,
      variant: state.variantKey,
      timestamp: new Date().toISOString(),
      source: '3dvr-web',
    });
  }

  function bindInteractions(root) {
    refs.trackedLinks.forEach(link => {
      link.addEventListener('click', () => {
        logCtaClick(root, String(link.dataset.serviceCta || 'unknown').trim());
      });
    });
  }

  function init() {
    const gun = getGun();
    state.visitorId = getVisitorId();
    applyVariant(chooseVariant(state.visitorId));
    decorateBillingLinks();
    logView(gun);
    bindInteractions(gun);
  }

  window.__3DVR_SERVICES_EXPERIMENT__ = {
    variants: VARIANTS,
    eventPath: EVENT_PATH,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})(window, document);
