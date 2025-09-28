(function () {
  const COMMENTS_KEY_PREFIX = '3dvr.blog.comments.';

  function getStorageKey(slug) {
    return `${COMMENTS_KEY_PREFIX}${slug}`;
  }

  function loadComments(slug) {
    try {
      const raw = window.localStorage.getItem(getStorageKey(slug));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (error) {
      console.error('3DVR Blog: unable to load comments', error);
      return [];
    }
  }

  function saveComments(slug, comments) {
    try {
      window.localStorage.setItem(getStorageKey(slug), JSON.stringify(comments));
    } catch (error) {
      console.error('3DVR Blog: unable to save comments', error);
    }
  }

  function formatDate(isoString) {
    const dt = new Date(isoString);
    return dt.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function handleSubmit(event, slug, elements) {
    event.preventDefault();
    const session = window.PortalSession?.getSession?.();
    if (!session?.token) {
      elements.status.textContent = 'Please sign in via portal.3dvr.tech before commenting.';
      return;
    }

    const body = elements.textarea.value.trim();
    if (!body) {
      elements.status.textContent = 'Comment cannot be empty.';
      return;
    }

    const displayName = session.user?.name || session.user?.email || 'Creator';
    const comments = loadComments(slug);
    const newComment = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `comment-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      author: displayName,
      body,
      createdAt: new Date().toISOString()
    };

    comments.unshift(newComment);
    saveComments(slug, comments);
    renderComments(comments, elements.list);
    elements.textarea.value = '';
    elements.status.textContent = 'Comment posted locally. Your feedback helps shape the roadmap!';
  }

  function renderComments(comments, listEl) {
    listEl.innerHTML = '';
    if (!comments.length) {
      const empty = document.createElement('li');
      empty.className = 'comment-empty';
      empty.textContent = 'No comments yet. Start the conversation!';
      listEl.appendChild(empty);
      return;
    }

    comments.forEach((comment) => {
      const item = document.createElement('li');
      item.className = 'comment-item';

      const header = document.createElement('div');
      header.className = 'comment-header';
      header.innerHTML = `<strong>${comment.author}</strong><time datetime="${comment.createdAt}">${formatDate(comment.createdAt)}</time>`;

      const body = document.createElement('p');
      body.className = 'comment-body';
      body.textContent = comment.body;

      item.appendChild(header);
      item.appendChild(body);
      listEl.appendChild(item);
    });
  }

  function enhanceComments() {
    const containers = document.querySelectorAll('[data-comments]');
    if (!containers.length) return;

    containers.forEach((container) => {
      const slug = container.dataset.slug;
      if (!slug) return;

      const list = container.querySelector('[data-comment-list]');
      const form = container.querySelector('[data-portal-comment-form]');
      const textarea = form?.querySelector('textarea');
      const status = container.querySelector('[data-comment-status]');
      const hint = container.querySelector('[data-portal-comment-hint]');

      if (!list || !form || !textarea || !status) return;

      const comments = loadComments(slug);
      renderComments(comments, list);

      const elements = { list, textarea, status };

      form.addEventListener('submit', (event) => handleSubmit(event, slug, elements));

      if (window.PortalSession) {
        window.PortalSession.onChange((session) => {
          if (!hint) return;
          if (session?.token) {
            const displayName = session.user?.name || session.user?.email || 'Creator';
            hint.textContent = `Commenting as ${displayName}`;
          } else {
            hint.innerHTML = 'Sign in via <a href="https://portal.3dvr.tech">portal.3dvr.tech</a> to join the conversation.';
          }
        });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', enhanceComments, { once: true });
})();
