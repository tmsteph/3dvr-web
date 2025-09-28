(function () {
  const sessionKey = 'portal.3dvr.tech::session';
  let sessionCache = null;
  const listeners = new Set();

  function parseSession(raw) {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      if (!parsed.user) parsed.user = {};
      return parsed;
    } catch (error) {
      console.warn('3DVR Blog: failed to parse stored session', error);
      return null;
    }
  }

  function loadSession() {
    if (sessionCache) return sessionCache;
    sessionCache = parseSession(window.localStorage.getItem(sessionKey));
    return sessionCache;
  }

  function persistSession(value) {
    sessionCache = value;
    if (!value) {
      window.localStorage.removeItem(sessionKey);
    } else {
      window.localStorage.setItem(sessionKey, JSON.stringify(value));
    }
    notify();
  }

  function notify() {
    listeners.forEach((callback) => {
      try {
        callback(sessionCache);
      } catch (error) {
        console.error('3DVR Blog: listener failed', error);
      }
    });
  }

  function getRedirectUrl(element) {
    const target = element?.dataset?.redirect || window.location.href;
    return encodeURIComponent(target);
  }

  function attachAuthControls(root = document) {
    const greetingEl = root.querySelector('[data-portal-greeting]');
    const signInEl = root.querySelector('[data-portal-signin]');
    const signOutBtn = root.querySelector('[data-portal-signout]');
    const createPostEl = root.querySelector('[data-portal-create]');
    const authRequired = root.querySelectorAll('[data-portal-requires-auth]');
    const commentForm = root.querySelector('[data-portal-comment-form]');
    const commentHint = root.querySelector('[data-portal-comment-hint]');

    function handleState(session) {
      const isSignedIn = Boolean(session?.token);
      const displayName = session?.user?.name || session?.user?.email || 'Creator';
      if (greetingEl) {
        greetingEl.textContent = isSignedIn ? `Hi, ${displayName}` : 'Welcome, guest';
        greetingEl.dataset.state = isSignedIn ? 'signed-in' : 'signed-out';
      }

      if (signInEl) {
        signInEl.hidden = isSignedIn;
        const redirect = encodeURIComponent(signInEl.dataset.redirect || window.location.href);
        signInEl.href = `https://portal.3dvr.tech/login?redirect=${redirect}`;
      }

      if (signOutBtn) {
        signOutBtn.hidden = !isSignedIn;
      }

      if (createPostEl) {
        createPostEl.hidden = !isSignedIn;
        if (isSignedIn) {
          const base = createPostEl.dataset.base || 'https://portal.3dvr.tech/studio/blog/create';
          const token = encodeURIComponent(session?.token || '');
          createPostEl.href = `${base}?session=${token}`;
        }
      }

      authRequired.forEach((element) => {
        element.toggleAttribute('data-disabled', !isSignedIn);
        if (!isSignedIn) {
          element.setAttribute('aria-disabled', 'true');
        } else {
          element.removeAttribute('aria-disabled');
        }
      });

      if (commentForm) {
        const submitButton = commentForm.querySelector('button[type="submit"]');
        if (isSignedIn) {
          commentForm.classList.remove('is-disabled');
          commentForm.removeAttribute('aria-disabled');
          if (submitButton) submitButton.disabled = false;
          if (commentHint) commentHint.textContent = `Commenting as ${displayName}`;
        } else {
          commentForm.classList.add('is-disabled');
          commentForm.setAttribute('aria-disabled', 'true');
          if (submitButton) submitButton.disabled = true;
          if (commentHint) commentHint.innerHTML = 'Sign in via <a href="https://portal.3dvr.tech">portal.3dvr.tech</a> to join the conversation.';
        }
      }
    }

    onChange(handleState);
    handleState(loadSession());

    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => {
        persistSession(null);
        window.location.href = `https://portal.3dvr.tech/logout?redirect=${getRedirectUrl(signOutBtn)}`;
      });
    }
  }

  function hydrateFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userParam = params.get('user');
    if (!token || !userParam) {
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userParam));
      persistSession({
        token,
        user,
        refreshedAt: Date.now()
      });
      params.delete('token');
      params.delete('user');
      const next = params.toString();
      const newUrl = `${window.location.origin}${window.location.pathname}${next ? `?${next}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    } catch (error) {
      console.error('3DVR Blog: unable to hydrate session from query params', error);
    }
  }

  function onChange(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }

  window.addEventListener('storage', (event) => {
    if (event.key === sessionKey) {
      sessionCache = parseSession(event.newValue);
      notify();
    }
  });

  function bootstrap() {
    hydrateFromQuery();
    attachAuthControls();
  }

  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });

  window.PortalSession = {
    getSession: () => loadSession(),
    setSession: (value) => persistSession(value),
    clearSession: () => persistSession(null),
    onChange,
    attachAuthControls,
    hydrateFromQuery,
    sessionKey
  };
})();
