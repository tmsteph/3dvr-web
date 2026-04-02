'use strict';

(function initFrameClubTest() {
  const frame = document.getElementById('clubFrame');
  const zoneDetail = document.getElementById('zoneDetail');
  const statusPill = document.getElementById('statusPill');
  const buttons = Array.from(document.querySelectorAll('[data-zone-button], [data-zone]'));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!frame || !zoneDetail || !statusPill) {
    return;
  }

  const zones = {
    arrival: {
      label: 'Home layer',
      title: 'Make the homepage feel like an entrance into the 3DVR world, not a flat list of sections.',
      body: 'The frame makes the homepage feel spatial right away: headline in front, world behind it, and obvious paths into offers, experiments, and the portal without forcing a game-like interface.',
      points: [
        'Fast first read on every screen size.',
        'Motion depth without browser lockout.',
        'Clear paths into plans, experiments, and support.',
      ],
    },
    arena: {
      label: 'World layer',
      title: 'Let the middle layer carry atmosphere, featured work, and the sense of a bigger 3DVR world.',
      body: 'This is where featured work, scenes, community moments, or a bold campaign headline could sit. The frame lets that layer feel expansive without burying navigation.',
      points: [
        'Big focal point for world-building.',
        'Can spotlight featured projects or demos.',
        'Keeps the homepage from feeling flat.',
      ],
    },
    studio: {
      label: 'Studio layer',
      title: 'Show how 3DVR builds, tests, and ships inside the world itself.',
      body: 'The studio zone can hold build notes, prototype cards, tools, or work-in-progress demos without breaking the framed homepage metaphor.',
      points: [
        'Good fit for experiments and process.',
        'Can support swipe or tap focus on mobile.',
        'Keeps motion controlled instead of noisy.',
      ],
    },
    rooftop: {
      label: 'Portal layer',
      title: 'Use the upper layer for support, account entry, and the next step after the homepage.',
      body: 'This zone is less about spectacle and more about continuity: plans, portal access, support, and the systems people step into after the first visit.',
      points: [
        'Works for portal entry or paid lanes.',
        'Lets the world connect to real services.',
        'Ends on direction instead of filler copy.',
      ],
    },
  };

  function renderZone(zoneKey) {
    const zone = zones[zoneKey];
    if (!zone) {
      return;
    }

    frame.dataset.zone = zoneKey;
    statusPill.textContent = `Focus: ${zone.label}`;
    zoneDetail.querySelector('.zone-detail__eyebrow').textContent = zone.label;
    zoneDetail.querySelector('.zone-detail__title').textContent = zone.title;
    zoneDetail.querySelector('.zone-detail__body').textContent = zone.body;

    const list = zoneDetail.querySelector('.zone-detail__list');
    list.innerHTML = zone.points.map((point) => `<li>${point}</li>`).join('');

    buttons.forEach((button) => {
      const buttonZone = button.dataset.zoneButton || button.dataset.zone;
      button.classList.toggle('is-active', buttonZone === zoneKey);
    });
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      renderZone(button.dataset.zoneButton || button.dataset.zone);
    });
  });

  if (!prefersReducedMotion) {
    frame.addEventListener('pointermove', (event) => {
      const rect = frame.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const tiltX = ((x - 0.5) * 12).toFixed(2);
      const tiltY = ((y - 0.5) * 10).toFixed(2);
      const floatX = ((x - 0.5) * 36).toFixed(2);
      const floatY = ((y - 0.5) * 26).toFixed(2);

      frame.style.setProperty('--tilt-x', tiltX);
      frame.style.setProperty('--tilt-y', tiltY);
      frame.style.setProperty('--float-x', `${floatX}px`);
      frame.style.setProperty('--float-y', `${floatY}px`);
    });

    frame.addEventListener('pointerleave', () => {
      frame.style.setProperty('--tilt-x', '0');
      frame.style.setProperty('--tilt-y', '0');
      frame.style.setProperty('--float-x', '0px');
      frame.style.setProperty('--float-y', '0px');
    });
  }

  renderZone('arrival');
})();
