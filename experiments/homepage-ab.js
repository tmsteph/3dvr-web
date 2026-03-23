(function () {
  const EXPERIMENT_KEY = '3dvr-homepage-copy';
  const PARAM_NAME = 'exp-homepage';
  const VARIANTS = {
    control: {
      headline: 'Build the future.',
      body:
        '3dvr.tech is a collaborative lab shaping respectful tools that return ownership, honor the planet, and help creators grow together.',
      note:
        'Build your presence, your income, and your community without giving up what makes the work human.'
    },
    soul: {
      headline: 'This life is a big VR trip for the soul.',
      body:
        '3dvr.tech is a people-first studio building tools, spaces, and digital presence for real people. We treat experience as immersive, embodied, and meaningful, then turn that into practical products, services, and community infrastructure.',
      note:
        'In practice, that means websites, tools, support, and shared spaces that help real people build presence, income, and community.'
    }
  };

  function readStoredVariant() {
    try {
      return localStorage.getItem(EXPERIMENT_KEY) || '';
    } catch (error) {
      return '';
    }
  }

  function writeStoredVariant(value) {
    try {
      if (value) {
        localStorage.setItem(EXPERIMENT_KEY, value);
      } else {
        localStorage.removeItem(EXPERIMENT_KEY);
      }
    } catch (error) {
      // Ignore storage failures in private or restricted environments.
    }
  }

  function resolveVariant() {
    const params = new URLSearchParams(window.location.search);
    const explicit = String(params.get(PARAM_NAME) || '').trim().toLowerCase();
    if (explicit && VARIANTS[explicit]) {
      writeStoredVariant(explicit);
      return explicit;
    }

    const stored = String(readStoredVariant() || '').trim().toLowerCase();
    if (stored && VARIANTS[stored]) {
      return stored;
    }

    return 'control';
  }

  function applyVariant(variantName) {
    const variant = VARIANTS[variantName] || VARIANTS.control;

    document.querySelectorAll('[data-homepage-copy]').forEach((node) => {
      const key = String(node.getAttribute('data-homepage-copy') || '').trim();
      if (!key || !variant[key]) {
        return;
      }
      node.textContent = variant[key];
    });

    document.body.dataset.homepageVariant = variantName;
    window.__3dvrExperiments = {
      ...(window.__3dvrExperiments || {}),
      homepageCopy: variantName
    };
  }

  function init() {
    if (!document.body || !document.querySelector('[data-homepage-copy="headline"]')) {
      return;
    }

    applyVariant(resolveVariant());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
