'use strict';

(function init3dvrFeatureFlags() {
  const defaultFlags = {
    world: false,
  };

  const flags = { ...defaultFlags };
  const params = new URLSearchParams(window.location.search);

  function readStoredFlag(key) {
    try {
      return window.localStorage.getItem(`3dvr.feature.${key}`);
    } catch {
      return null;
    }
  }

  function parseBoolean(value) {
    if (value == null) return null;
    const normalized = String(value).trim().toLowerCase();
    if (['1', 'true', 'yes', 'on', 'enabled'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off', 'disabled'].includes(normalized)) return false;
    return null;
  }

  Object.keys(defaultFlags).forEach((key) => {
    const queryValue = parseBoolean(params.get(`feature_${key}`));
    const storedValue = parseBoolean(readStoredFlag(key));
    if (queryValue != null) {
      flags[key] = queryValue;
    } else if (storedValue != null) {
      flags[key] = storedValue;
    }
  });

  window.__3DVR_FEATURE_FLAGS__ = flags;
  document.documentElement.dataset.featureWorld = flags.world ? 'enabled' : 'disabled';

  function applyFlags() {
    document.querySelectorAll('[data-feature-flag]').forEach((element) => {
      const flagName = element.getAttribute('data-feature-flag');
      const enabled = Boolean(flags[flagName]);
      element.hidden = !enabled;
      element.setAttribute('aria-hidden', enabled ? 'false' : 'true');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyFlags, { once: true });
  } else {
    applyFlags();
  }
})();
