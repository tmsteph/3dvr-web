'use strict';

(function init3dvrWorld() {
  const frame = document.getElementById('clubFrame');
  const zoneDetail = document.getElementById('zoneDetail');
  const zoneMetrics = document.getElementById('zoneMetrics');
  const zoneDepthValue = document.getElementById('zoneDepthValue');
  const zoneDepthFill = document.getElementById('zoneDepthFill');
  const statusPill = document.getElementById('statusPill');
  const worldMotion = document.getElementById('worldMotion');
  const motionToggle = document.getElementById('motionToggle');
  const motionState = document.getElementById('motionState');
  const buttons = Array.from(document.querySelectorAll('button[data-zone-button], button[data-zone]'));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prefersCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const canUsePointerTilt = !prefersReducedMotion && !prefersCoarsePointer;
  const canUseMotionTilt =
    !prefersReducedMotion &&
    prefersCoarsePointer &&
    typeof window.DeviceOrientationEvent !== 'undefined';

  if (!frame || !zoneDetail || !zoneMetrics || !zoneDepthValue || !zoneDepthFill || !statusPill) {
    return;
  }

  const motion = {
    enabled: false,
    listening: false,
    baselineBeta: null,
    baselineGamma: null,
  };

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
      metrics: [
        { label: 'Signal', value: 'Front door' },
        { label: 'Surface', value: 'Hero + plans' },
        { label: 'Link', value: 'Start Free' },
      ],
      depth: 74,
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
      metrics: [
        { label: 'Signal', value: 'Brand world' },
        { label: 'Surface', value: 'Scenes + work' },
        { label: 'Link', value: 'Featured paths' },
      ],
      depth: 88,
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
      metrics: [
        { label: 'Signal', value: 'Build lane' },
        { label: 'Surface', value: 'Demos + tools' },
        { label: 'Link', value: 'Live experiments' },
      ],
      depth: 82,
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
      metrics: [
        { label: 'Signal', value: 'Continuity' },
        { label: 'Surface', value: 'Support + account' },
        { label: 'Link', value: 'Portal entry' },
      ],
      depth: 79,
    },
  };

  function renderZone(zoneKey) {
    const zone = zones[zoneKey];
    if (!zone) {
      return;
    }

    frame.dataset.zone = zoneKey;
    zoneDetail.dataset.zone = zoneKey;
    statusPill.textContent = `Focus: ${zone.label}`;
    zoneDetail.querySelector('.zone-detail__eyebrow').textContent = zone.label;
    zoneDetail.querySelector('.zone-detail__title').textContent = zone.title;
    zoneDetail.querySelector('.zone-detail__body').textContent = zone.body;

    const list = zoneDetail.querySelector('.zone-detail__list');
    list.innerHTML = zone.points.map((point) => `<li>${point}</li>`).join('');
    zoneMetrics.innerHTML = zone.metrics
      .map(
        (metric) => `
          <article class="zone-metric">
            <p class="zone-metric__label">${metric.label}</p>
            <strong class="zone-metric__value">${metric.value}</strong>
          </article>
        `
      )
      .join('');
    zoneDepthValue.textContent = `${zone.depth}%`;
    zoneDepthFill.style.width = `${zone.depth}%`;

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

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function applyFrameMotion(tiltX, tiltY, floatX, floatY) {
    frame.style.setProperty('--tilt-x', tiltX);
    frame.style.setProperty('--tilt-y', tiltY);
    frame.style.setProperty('--float-x', floatX);
    frame.style.setProperty('--float-y', floatY);
  }

  function resetFrameMotion() {
    applyFrameMotion('0', '0', '0px', '0px');
  }

  function updateMotionUi(mode) {
    if (!worldMotion || !motionToggle || !motionState) {
      return;
    }

    if (!canUseMotionTilt) {
      worldMotion.hidden = true;
      return;
    }

    worldMotion.hidden = false;

    if (mode === 'active') {
      motionToggle.textContent = 'Recenter Motion';
      motionState.textContent = 'Motion on. Tilt your phone to steer the world depth.';
      return;
    }

    if (mode === 'blocked') {
      motionToggle.textContent = 'Try Motion Again';
      motionState.textContent = 'Motion permission was blocked. Try again if your browser allows it.';
      return;
    }

    if (mode === 'pending') {
      motionToggle.textContent = 'Waiting for Motion';
      motionState.textContent = 'Approve motion access, then tilt your phone to move the world.';
      return;
    }

    motionToggle.textContent = 'Enable Motion';
    motionState.textContent = 'Tilt your phone to move the world depth.';
  }

  function handleDeviceOrientation(event) {
    if (!motion.enabled) {
      return;
    }

    if (!Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) {
      return;
    }

    if (motion.baselineBeta === null || motion.baselineGamma === null) {
      motion.baselineBeta = event.beta;
      motion.baselineGamma = event.gamma;
      resetFrameMotion();
      return;
    }

    const deltaBeta = clamp(event.beta - motion.baselineBeta, -18, 18);
    const deltaGamma = clamp(event.gamma - motion.baselineGamma, -24, 24);
    const tiltX = (deltaGamma / 2.4).toFixed(2);
    const tiltY = (deltaBeta / 3).toFixed(2);
    const floatX = `${(deltaGamma * 1.25).toFixed(2)}px`;
    const floatY = `${(deltaBeta * 1.1).toFixed(2)}px`;

    applyFrameMotion(tiltX, tiltY, floatX, floatY);
  }

  function enableMotionTilt() {
    if (!canUseMotionTilt) {
      return;
    }

    if (!motion.listening) {
      window.addEventListener('deviceorientation', handleDeviceOrientation);
      motion.listening = true;
    }

    motion.enabled = true;
    motion.baselineBeta = null;
    motion.baselineGamma = null;
    resetFrameMotion();
    updateMotionUi('active');
  }

  async function handleMotionToggle() {
    if (!canUseMotionTilt) {
      return;
    }

    if (motion.enabled) {
      motion.baselineBeta = null;
      motion.baselineGamma = null;
      resetFrameMotion();
      updateMotionUi('active');
      return;
    }

    try {
      if (typeof window.DeviceOrientationEvent.requestPermission === 'function') {
        updateMotionUi('pending');
        const permission = await window.DeviceOrientationEvent.requestPermission();

        if (permission !== 'granted') {
          updateMotionUi('blocked');
          return;
        }
      }

      enableMotionTilt();
    } catch (error) {
      updateMotionUi('blocked');
    }
  }

  if (motionToggle) {
    motionToggle.addEventListener('click', () => {
      handleMotionToggle();
    });
  }

  if (canUseMotionTilt) {
    updateMotionUi('ready');
    window.addEventListener('orientationchange', () => {
      if (!motion.enabled) {
        return;
      }

      motion.baselineBeta = null;
      motion.baselineGamma = null;
      resetFrameMotion();
    });
  } else {
    updateMotionUi('unavailable');
  }

  if (canUsePointerTilt) {
    frame.addEventListener('pointermove', (event) => {
      const rect = frame.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const tiltX = ((x - 0.5) * 12).toFixed(2);
      const tiltY = ((y - 0.5) * 10).toFixed(2);
      const floatX = ((x - 0.5) * 36).toFixed(2);
      const floatY = ((y - 0.5) * 26).toFixed(2);

      applyFrameMotion(tiltX, tiltY, `${floatX}px`, `${floatY}px`);
    });

    frame.addEventListener('pointerleave', () => {
      resetFrameMotion();
    });
  }

  renderZone('arrival');
})();
