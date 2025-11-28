<script>
  // Feather icons
  if (window.feather) {
    feather.replace();
  }

  // Mobile menu
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener('click', () => {
      const isOpen = !mobileMenu.classList.contains('hidden');
      mobileMenu.classList.toggle('hidden', isOpen);
      mobileBtn.innerHTML = isOpen
        ? '<i data-feather="menu" class="w-5 h-5"></i>'
        : '<i data-feather="x" class="w-5 h-5"></i>';
      if (window.feather) feather.replace();
    });
  }

  // Menu tabs
  const menuTabs = document.querySelectorAll('.menu-tab');
  const panels = {
    starters: document.getElementById('menu-starters'),
    pasta: document.getElementById('menu-pasta'),
    mains: document.getElementById('menu-mains'),
    desserts: document.getElementById('menu-desserts'),
    drinks: document.getElementById('menu-drinks'),
  };

  function activateMenuTab(target) {
    menuTabs.forEach((t) => t.classList.remove('menu-active'));
    Object.keys(panels).forEach((key) => {
      if (panels[key]) panels[key].classList.remove('active');
    });
    const tab = document.querySelector(`.menu-tab[data-target="${target}"]`);
    if (tab) tab.classList.add('menu-active');
    if (panels[target]) panels[target].classList.add('active');
  }

  menuTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      activateMenuTab(target);
    });
  });

  // Lightbox tipo "food app": imagen + caption + botón demo
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImage');
  const lightboxClose = document.getElementById('lightboxClose');

  let demoCartCount = 0;
  let lightboxMeta; // contenedor de caption y botón

  function ensureLightboxMeta() {
    if (!lightbox || !lightboxImg) return;
    if (lightboxMeta) return;

    // Creamos la barra inferior con info del plato y CTA
    const wrapper = lightboxImg.parentElement;
    lightboxMeta = document.createElement('div');
    lightboxMeta.className =
      'mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-white/90';

    const textBox = document.createElement('div');
    textBox.id = 'lightboxCaption';
    textBox.className = 'space-y-1';

    const title = document.createElement('p');
    title.id = 'lightboxDishName';
    title.className = 'font-ui font-semibold';
    textBox.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.id = 'lightboxDishHint';
    subtitle.className = 'text-xs text-neutral-200/80';
    textBox.appendChild(subtitle);

    const ctaBox = document.createElement('div');
    ctaBox.className = 'flex items-center gap-3';

    const btn = document.createElement('button');
    btn.id = 'lightboxAddBtn';
    btn.className =
      'inline-flex items-center justify-center px-3 py-2 rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-xs font-ui uppercase tracking-[0.2em]';
    btn.textContent = 'Add to demo order';

    const count = document.createElement('span');
    count.id = 'demoCartBadge';
    count.className =
      'px-2 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-ui uppercase tracking-[0.18em]';

    ctaBox.appendChild(btn);
    ctaBox.appendChild(count);

    lightboxMeta.appendChild(textBox);
    lightboxMeta.appendChild(ctaBox);
    wrapper.appendChild(lightboxMeta);

    // Acción del botón de "carrito" (demo)
    btn.addEventListener('click', () => {
      demoCartCount++;
      updateCartBadge();
      showToast('Added to demo order.');
    });
  }

  function updateCartBadge() {
    const badge = document.getElementById('demoCartBadge');
    if (!badge) return;
    if (demoCartCount <= 0) {
      badge.textContent = 'Demo cart empty';
    } else if (demoCartCount === 1) {
      badge.textContent = '1 item in demo cart';
    } else {
      badge.textContent = `${demoCartCount} items in demo cart`;
    }
  }

  // Toast simple (arriba a la derecha)
  let toastTimeout;
  function showToast(message) {
    let toast = document.getElementById('demoToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'demoToast';
      toast.className =
        'fixed z-50 top-4 right-4 max-w-xs px-4 py-3 rounded-2xl bg-espresso text-cream text-xs font-ui shadow-xl border border-terracotta-500/40 opacity-0 transition-opacity';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.style.opacity = '0';
    }, 2200);
  }

  // Abrir lightbox al hacer click en una imagen de la galería
  document.querySelectorAll('#gallery img[data-full]').forEach((img) => {
    const btn = img.parentElement;
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (!lightbox || !lightboxImg) return;

      const fullSrc = img.dataset.full || img.src;
      const dishName = img.alt || 'Featured dish';

      lightboxImg.src = fullSrc;
      ensureLightboxMeta();

      const nameEl = document.getElementById('lightboxDishName');
      const hintEl = document.getElementById('lightboxDishHint');
      if (nameEl) nameEl.textContent = dishName;
      if (hintEl)
        hintEl.textContent =
          'Portfolio demo — imagine this connected to a real ordering system.';

      updateCartBadge();

      lightbox.classList.remove('hidden');
      lightbox.classList.add('flex');
      if (window.feather) feather.replace();
    });
  });

  // Cerrar lightbox
  if (lightboxClose && lightbox) {
    lightboxClose.addEventListener('click', () => {
      lightbox.classList.add('hidden');
      lightbox.classList.remove('flex');
    });

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        lightbox.classList.add('hidden');
        lightbox.classList.remove('flex');
      }
    });
  }

  // Estado "Open now" demo
  const statusEl = document.getElementById('open-status');
  if (statusEl) {
    const now = new Date();
    const hour = now.getHours();
    const isOpen = hour >= 17 && hour <= 23; // 5PM–11PM, demo only
    statusEl.textContent = isOpen
      ? 'We appear as “Open now” in this demo.'
      : 'We appear as “Closed” at this time in this demo.';
  }

  // Pequeña animación al hacer scroll (reveal sencillo)
  const revealEls = document.querySelectorAll(
    '.service-card, .timeline-item, .process-step, [data-animate]'
  );

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fadeInUp');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealEls.forEach((el) => observer.observe(el));
  } else {
    // Fallback muy simple
    revealEls.forEach((el) => el.classList.add('animate-fadeInUp'));
  }
</script>
