(function() {
  if (!('serviceWorker' in navigator)) return;

  let deferredPrompt = null;
  const installButtons = new Set();

  const styleButton = (button) => {
    button.type = 'button';
    button.textContent = 'Install 3dvr';
    button.setAttribute('data-install-button', '');
    button.style.cssText = [
      'margin-top: 12px',
      'padding: 0.75rem 1.25rem',
      'border-radius: 10px',
      'border: 1px solid rgba(255,255,255,0.18)',
      'background: linear-gradient(135deg, #1db4ff, #0f8bdc)',
      'color: #fff',
      'font-weight: 700',
      'letter-spacing: 0.02em',
      'cursor: pointer',
      'box-shadow: 0 12px 30px rgba(0,0,0,0.18)',
      'transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.25s ease, filter 0.25s ease',
      'opacity: 0.7',
      'pointer-events: none',
      'filter: grayscale(0.25)'
    ].join(';');

    button.addEventListener('focus', () => button.style.boxShadow = '0 14px 32px rgba(0,0,0,0.22)');
    button.addEventListener('blur', () => button.style.boxShadow = '0 12px 30px rgba(0,0,0,0.18)');
    button.addEventListener('mouseover', () => {
      button.style.transform = 'translateY(-1px)';
      button.style.boxShadow = '0 16px 36px rgba(0,0,0,0.24)';
    });
    button.addEventListener('mouseout', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 12px 30px rgba(0,0,0,0.18)';
    });
  };

  const updateButtonState = () => {
    installButtons.forEach((button) => {
      const ready = Boolean(deferredPrompt);
      button.style.opacity = ready ? '1' : '0.7';
      button.style.pointerEvents = ready ? 'auto' : 'none';
      button.style.filter = ready ? 'none' : 'grayscale(0.25)';
      button.style.cursor = ready ? 'pointer' : 'not-allowed';
      button.disabled = !ready;
    });
  };

  const ensureButtonExists = () => {
    const footer = document.querySelector('footer');

    if (!footer) return;

    let button = footer.querySelector('[data-install-button]');

    if (!button) {
      button = document.createElement('button');
      styleButton(button);
      footer.appendChild(button);
    } else {
      styleButton(button);
    }

    if (!installButtons.has(button)) {
      installButtons.add(button);
      button.addEventListener('click', async (event) => {
        event.preventDefault();

        if (!deferredPrompt) {
          return;
        }

        deferredPrompt.prompt();

        const choice = await deferredPrompt.userChoice.catch(() => ({ outcome: 'dismissed' }));

        if (choice && choice.outcome === 'accepted') {
          button.textContent = 'Installing 3dvr…';
        }

        deferredPrompt = null;
        updateButtonState();
      });
    }

    updateButtonState();
  };

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    ensureButtonExists();
    updateButtonState();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installButtons.forEach((button) => {
      button.textContent = 'Installed ✓';
      button.disabled = true;
      button.style.opacity = '0.8';
    });
    updateButtonState();
  });

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-install-button]').forEach((button) => {
      styleButton(button);
      installButtons.add(button);
    });

    ensureButtonExists();
    updateButtonState();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
})();
