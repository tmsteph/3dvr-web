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
      label: 'Arrival deck',
      title: 'Set the first 10 seconds like a club entrance, not a flat landing page.',
      body: 'The frame makes the homepage feel spatial right away: headline in front, world behind it, and obvious paths to move deeper into the site without forcing a game-like interface.',
      points: [
        'Fast first read on every screen size.',
        'Motion depth without browser lockout.',
        'Tap targets stay clear even inside the 3D scene.',
      ],
    },
    arena: {
      label: 'Main arena',
      title: 'Give the hero zone enough depth that it feels like a venue, not a banner.',
      body: 'This is where match schedules, events, or a bold campaign headline could sit. The frame lets that centerpiece feel large without burying navigation.',
      points: [
        'Big focal point for hero campaigns.',
        'Clear CTA lane without flattening the scene.',
        'Scroll content still works as ordinary HTML below it.',
      ],
    },
    studio: {
      label: 'Motion studio',
      title: 'Treat classes, coaching, or creator content like a live room inside the site.',
      body: 'The studio zone shows how a service lane can still feel spatial. It can hold coaching drops, class cards, or interactive previews without leaving the frame metaphor.',
      points: [
        'Good fit for modular product cards.',
        'Can support swipe or tap focus on mobile.',
        'Keeps motion controlled instead of noisy.',
      ],
    },
    rooftop: {
      label: 'Rooftop lounge',
      title: 'Use the upper layer for membership, community, and post-visit mood.',
      body: 'This zone is less about raw action and more about aspiration: recovery, events, premium access, and atmosphere that sells the club identity.',
      points: [
        'Works for premium tiers or event drops.',
        'Lets the site end on mood instead of admin copy.',
        'Extends the club metaphor without blocking usability.',
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
