'use strict';

(function initHomepageExperiment(window, document) {
  if (!window || !document) {
    return;
  }

  const VISITOR_ID_KEY = '3dvr-growth.visitor-id';
  const VARIANT_DAY_KEY = '3dvr-growth.homepage-hero.variant-day';
  const FEEDBACK_DAY_KEY = '3dvr-growth.homepage-hero.feedback-day';
  const GUN_PEERS = window.__GUN_PEERS__ || [
    'wss://relay.3dvr.tech/gun',
    'wss://gun-relay-3dvr.fly.dev/gun',
  ];
  const EXPERIMENT_CONFIG_PATH = ['3dvr-portal', 'growth', 'experiments', 'homepage-hero', 'config'];
  const EXPERIMENT_EVENT_PATH = ['3dvr-portal', 'growth', 'experiments', 'homepage-hero', 'events'];
  const FEEDBACK_EVENT_PATH = ['3dvr-portal', 'growth', 'feedback', 'homepage-hero'];
  const MIN_WEIGHT = 1;
  const DEFAULT_CONFIG = Object.freeze({
    autoMode: true,
    winner: '',
    clarityWeight: 50,
    tractionWeight: 50,
  });
  const VARIANTS = Object.freeze({
    clarity: Object.freeze({
      key: 'clarity',
      eyebrow: 'Websites. Apps. Direct support.',
      primary: 'We help small businesses actually launch.',
      secondary: 'Not just plan. Not just think about it.',
      body: 'Get a site, landing page, or simple business system with direct help from idea to launch.',
      feedbackPrompt: 'Does this explain the offer clearly?',
    }),
    traction: Object.freeze({
      key: 'traction',
      eyebrow: 'Launch faster. Start selling.',
      primary: 'Get your project live.',
      secondary: 'Keep moving with direct support.',
      body: '3dvr helps small businesses and creators launch pages, apps, and follow-up systems without getting stuck in tech.',
      feedbackPrompt: 'Does this version make you want to reach out?',
    }),
  });

  const refs = {
    hero: document.querySelector('.hero'),
    eyebrow: document.getElementById('heroEyebrow'),
    headlinePrimary: document.getElementById('heroHeadlinePrimary'),
    headlineSecondary: document.getElementById('heroHeadlineSecondary'),
    body: document.getElementById('heroBody'),
    feedbackPrompt: document.getElementById('heroFeedbackPrompt'),
    feedbackStatus: document.getElementById('heroFeedbackStatus'),
    feedbackButtons: Array.from(document.querySelectorAll('[data-growth-feedback]')),
    ctaLinks: Array.from(document.querySelectorAll('[data-growth-cta]')),
  };

  const state = {
    variantKey: 'clarity',
    config: { ...DEFAULT_CONFIG },
    visitorId: '',
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
      // Ignore storage failures and continue in memory only.
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

  function getGun() {
    if (typeof window.Gun !== 'function') {
      return null;
    }
    try {
      return window.Gun({ peers: GUN_PEERS });
    } catch (error) {
      console.warn('Homepage growth Gun init failed', error);
      return null;
    }
  }

  function getNode(root, path) {
    return path.reduce((node, key) => (node && typeof node.get === 'function' ? node.get(key) : null), root);
  }

  function normalizeConfig(data) {
    const autoMode = data && typeof data.autoMode === 'boolean' ? data.autoMode : DEFAULT_CONFIG.autoMode;
    const winner = String(data?.winner || '').trim();
    const clarityWeight = Math.max(MIN_WEIGHT, Number.parseInt(data?.clarityWeight, 10) || DEFAULT_CONFIG.clarityWeight);
    const tractionWeight = Math.max(MIN_WEIGHT, Number.parseInt(data?.tractionWeight, 10) || DEFAULT_CONFIG.tractionWeight);
    return {
      autoMode,
      winner: winner && VARIANTS[winner] ? winner : '',
      clarityWeight,
      tractionWeight,
    };
  }

  function chooseVariant(config, visitorId) {
    if (config.autoMode && config.winner && VARIANTS[config.winner]) {
      return config.winner;
    }

    const bucket = hashString(visitorId) % (config.clarityWeight + config.tractionWeight);
    return bucket < config.clarityWeight ? 'clarity' : 'traction';
  }

  function eventNode(root) {
    return getNode(root, EXPERIMENT_EVENT_PATH);
  }

  function feedbackNode(root) {
    return getNode(root, FEEDBACK_EVENT_PATH);
  }

  function applyVariant(variantKey) {
    const variant = VARIANTS[variantKey] || VARIANTS.clarity;
    state.variantKey = variant.key;
    if (refs.hero) {
      refs.hero.dataset.homeHeroVariant = variant.key;
    }
    if (refs.eyebrow) refs.eyebrow.textContent = variant.eyebrow;
    if (refs.headlinePrimary) refs.headlinePrimary.textContent = variant.primary;
    if (refs.headlineSecondary) refs.headlineSecondary.textContent = variant.secondary;
    if (refs.body) refs.body.textContent = variant.body;
    if (refs.feedbackPrompt) refs.feedbackPrompt.textContent = variant.feedbackPrompt;
  }

  function writeEvent(root, pathResolver, payload) {
    const node = pathResolver(root);
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
    if (safeStorageGet(VARIANT_DAY_KEY) === key) {
      return;
    }
    safeStorageSet(VARIANT_DAY_KEY, key);
    writeEvent(root, eventNode, {
      visitorId: state.visitorId,
      page: 'homepage',
      eventType: 'view',
      variant: state.variantKey,
      timestamp: new Date().toISOString(),
      source: '3dvr-web',
    });
  }

  function logCtaClick(root, cta) {
    writeEvent(root, eventNode, {
      visitorId: state.visitorId,
      page: 'homepage',
      eventType: 'cta-click',
      cta,
      variant: state.variantKey,
      timestamp: new Date().toISOString(),
      source: '3dvr-web',
    });
  }

  function submitFeedback(root, sentiment) {
    const day = todayKey();
    const previous = safeStorageGet(FEEDBACK_DAY_KEY);
    if (previous === `${day}:${sentiment}:${state.variantKey}`) {
      if (refs.feedbackStatus) {
        refs.feedbackStatus.textContent = 'Feedback already saved for today.';
      }
      return;
    }

    safeStorageSet(FEEDBACK_DAY_KEY, `${day}:${sentiment}:${state.variantKey}`);
    writeEvent(root, feedbackNode, {
      visitorId: state.visitorId,
      page: 'homepage',
      sentiment,
      variant: state.variantKey,
      prompt: refs.feedbackPrompt?.textContent || '',
      timestamp: new Date().toISOString(),
      source: '3dvr-web',
    });

    if (refs.feedbackStatus) {
      refs.feedbackStatus.textContent = sentiment === 'clear'
        ? 'Saved. This version felt clear.'
        : 'Saved. This version still felt vague.';
    }
  }

  function bindInteractions(root) {
    refs.ctaLinks.forEach(link => {
      link.addEventListener('click', () => {
        logCtaClick(root, String(link.dataset.growthCta || 'unknown').trim());
      });
    });

    refs.feedbackButtons.forEach(button => {
      button.addEventListener('click', () => {
        submitFeedback(root, String(button.dataset.growthFeedback || 'clear').trim());
      });
    });
  }

  function init() {
    const gun = getGun();
    const root = gun;
    state.visitorId = getVisitorId();

    const start = normalizeConfig(DEFAULT_CONFIG);
    applyVariant(chooseVariant(start, state.visitorId));
    logView(root);
    bindInteractions(root);

    if (!gun) {
      if (refs.feedbackStatus) {
        refs.feedbackStatus.textContent = 'Feedback works best when Gun is available.';
      }
      return;
    }

    const configRoot = getNode(root, EXPERIMENT_CONFIG_PATH);
    if (!configRoot || typeof configRoot.on !== 'function') {
      return;
    }

    configRoot.on(data => {
      state.config = normalizeConfig(data);
      applyVariant(chooseVariant(state.config, state.visitorId));
      logView(root);
      if (refs.feedbackStatus && state.config.autoMode && state.config.winner) {
        refs.feedbackStatus.textContent = `Live winner: ${state.config.winner}.`;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})(window, document);
