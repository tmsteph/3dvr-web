'use strict';

(function initHomepageExperiment(window, document) {
  if (!window || !document) {
    return;
  }

  const VISITOR_ID_KEY = '3dvr-growth.visitor-id';
  const VARIANT_DAY_KEY = '3dvr-growth.homepage-hero.variant-day';
  const GUN_PEERS = window.__GUN_PEERS__ || [
    'wss://relay.3dvr.tech/gun',
    'wss://gun-relay-3dvr.fly.dev/gun',
  ];
  const EXPERIMENT_CONFIG_PATH = ['3dvr-portal', 'growth', 'experiments', 'homepage-hero', 'config'];
  const EXPERIMENT_EVENT_PATH = ['3dvr-portal', 'growth', 'experiments', 'homepage-hero', 'events'];
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
      eyebrow: 'Open-source business system. Real human support.',
      primary: 'Launch your business. Run it in one place.',
      body: 'Websites, CRM, contacts, calendar, notes, projects, payments, and direct support—all connected through 3DVR.',
    }),
    traction: Object.freeze({
      key: 'traction',
      eyebrow: 'Start small. Own your system.',
      primary: 'Get your business live without getting locked in.',
      body: 'Launch the site or offer first, then keep customers, projects, notes, calendar, and payments together in an open-source workspace.',
    }),
  });

  const refs = {
    hero: document.querySelector('.hero'),
    eyebrow: document.getElementById('heroEyebrow'),
    headlinePrimary: document.getElementById('heroHeadlinePrimary'),
    body: document.getElementById('heroBody'),
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

  function setText(selector, text, root = document) {
    const element = root.querySelector(selector);
    if (element) {
      element.textContent = text;
    }
    return element;
  }

  function setMeta(selector, content) {
    const meta = document.querySelector(selector);
    if (meta) {
      meta.setAttribute('content', content);
    }
  }

  function applyHomepagePositioning() {
    const title = '3DVR | Open-source business system + human support';
    const description = 'Run CRM, contacts, calendar, notes, projects, payments, and websites in one open-source business system. Start free and add direct human support when you need it.';

    document.title = title;
    setMeta('meta[name="description"]', description);
    setMeta('meta[name="keywords"]', '3dvr, open source CRM, small business software, contacts, calendar, notes, projects, payments, business operating system');
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);

    setText('nav a[href="#vision"]', 'Platform');
    setText('nav a[href="#testimonials"]', 'Customers');

    const navStart = document.querySelector('#mainNav a[href="subscribe/index.html"]');
    if (navStart) {
      navStart.textContent = 'Free Website';
      navStart.href = 'https://portal.3dvr.tech/free-page/';
    }

    const stickyCta = document.querySelector('[data-growth-cta="sticky-start-free"]');
    if (stickyCta) {
      stickyCta.textContent = 'Free Website';
      stickyCta.href = 'https://portal.3dvr.tech/free-page/';
      stickyCta.removeAttribute('data-portal-path');
      stickyCta.dataset.growthCta = 'free-website-sticky';
    }

    const primaryCta = document.querySelector('[data-growth-cta="start-project-primary"]');
    if (primaryCta) {
      primaryCta.textContent = 'Start free';
    }

    const challengeCta = document.querySelector('[data-growth-cta="see-plans"]');
    if (challengeCta) {
      challengeCta.textContent = '$1 challenge';
      challengeCta.href = 'https://portal.3dvr.tech/challenge/';
      challengeCta.dataset.growthCta = 'one-dollar-challenge';
    }

    const freeWebsiteCta = document.querySelector('[data-growth-cta="plan-free"]');
    if (freeWebsiteCta) {
      freeWebsiteCta.href = 'https://portal.3dvr.tech/free-page/';
      freeWebsiteCta.removeAttribute('data-portal-path');
      freeWebsiteCta.dataset.growthCta = 'free-website';
      setText('strong', 'Free website', freeWebsiteCta);
      setText('span', 'We build it for you', freeWebsiteCta);
    }

    setText('#planLaneTitle', 'Start free. Add support when you want it.');
    const planLabels = [
      ['[data-growth-cta="plan-starter"] span', 'Keep it moving'],
      ['[data-growth-cta="plan-20"] span', 'Launch with help'],
      ['[data-growth-cta="plan-50"] span', 'Run your business'],
      ['[data-growth-cta="plan-200"] span', 'Team operations'],
      ['[data-growth-cta="plan-custom"] span', 'Build something bigger'],
    ];
    planLabels.forEach(([selector, text]) => setText(selector, text));

    const visionCards = Array.from(document.querySelectorAll('#vision .vision-card'));
    if (visionCards.length >= 3) {
      setText('h3', 'Launch what customers see', visionCards[0]);
      setText('p', 'Websites, offers, landing pages, and simple apps that move from rough idea to live.', visionCards[0]);
      const firstItems = visionCards[0].querySelectorAll('li');
      if (firstItems[0]) firstItems[0].textContent = 'Clear scope, design, copy, setup, and launch help.';
      if (firstItems[1]) firstItems[1].textContent = 'A real path from “we should build this” to something customers can use.';

      setText('h3', 'Run the business behind it', visionCards[1]);
      setText('p', 'Keep the everyday work together instead of stitching together a pile of subscriptions.', visionCards[1]);
      const secondItems = visionCards[1].querySelectorAll('li');
      if (secondItems[0]) secondItems[0].textContent = 'CRM, contacts, calendar, notes, projects, and payments in one connected workspace.';
      if (secondItems[1]) secondItems[1].textContent = 'Open-source foundations so your business is not trapped inside one vendor.';
      const platformLink = visionCards[1].querySelector('.vision-action');
      if (platformLink) {
        platformLink.textContent = 'Open the platform';
        platformLink.href = 'https://portal.3dvr.tech/';
      }

      setText('h3', 'Get a human when you want one', visionCards[2]);
      setText('p', 'Use the software yourself, or bring us in for launches, fixes, systems, and ongoing support.', visionCards[2]);
      const thirdItems = visionCards[2].querySelectorAll('li');
      if (thirdItems[0]) thirdItems[0].textContent = 'Practical help without turning your business into a consulting project.';
      if (thirdItems[1]) thirdItems[1].textContent = 'Start free, add support when it is useful, and keep what you build.';
      const supportLinks = visionCards[2].querySelectorAll('.vision-action');
      if (supportLinks[0]) supportLinks[0].textContent = 'Get support';
      if (supportLinks[1]) supportLinks[1].textContent = 'Join builders';
    }

    setText('#testimonials h2', 'Built with real small businesses');

    const about = document.querySelector('#about');
    if (about) {
      setText('.about-kicker', 'Open source, practical by default', about);
      setText(
        '.about-lede',
        '3DVR is an open-source business operating system with optional human support. Start free, use what helps, and grow without rebuilding your workflow around another vendor.',
        about,
      );
      const paragraphs = about.querySelectorAll('.about-flow p');
      if (paragraphs[0]) {
        paragraphs[0].textContent = 'Start with the everyday pieces: customers, contacts, calendar, notes, projects, payments, websites, and the next thing you need to launch.';
      }
      if (paragraphs[1]) {
        paragraphs[1].textContent = 'The pieces are designed to connect, so a small business can grow into one calmer operating system instead of another stack of disconnected apps.';
      }
      if (paragraphs[2]) {
        paragraphs[2].textContent = 'The code, experiments, and direction stay open so builders can inspect them, improve them, self-host where practical, and help shape what comes next.';
      }
    }
  }

  function applyVariant(variantKey) {
    const variant = VARIANTS[variantKey] || VARIANTS.clarity;
    state.variantKey = variant.key;
    if (refs.hero) {
      refs.hero.dataset.homeHeroVariant = variant.key;
    }
    if (refs.eyebrow) refs.eyebrow.textContent = variant.eyebrow;
    if (refs.headlinePrimary) refs.headlinePrimary.textContent = variant.primary;
    if (refs.body) refs.body.textContent = variant.body;
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

  function bindInteractions(root) {
    refs.ctaLinks.forEach(link => {
      link.addEventListener('click', () => {
        logCtaClick(root, String(link.dataset.growthCta || 'unknown').trim());
      });
    });
  }

  function init() {
    const gun = getGun();
    const root = gun;
    state.visitorId = getVisitorId();

    applyHomepagePositioning();

    const start = normalizeConfig(DEFAULT_CONFIG);
    applyVariant(chooseVariant(start, state.visitorId));
    logView(root);
    bindInteractions(root);

    if (!gun) {
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
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})(window, document);
