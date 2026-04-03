'use strict';

(function init3dvrWorld() {
  const frame = document.getElementById('clubFrame');
  const zoneDetail = document.getElementById('zoneDetail');
  const zoneMetrics = document.getElementById('zoneMetrics');
  const zoneDepthValue = document.getElementById('zoneDepthValue');
  const zoneDepthFill = document.getElementById('zoneDepthFill');
  const worldMotion = document.getElementById('worldMotion');
  const motionToggle = document.getElementById('motionToggle');
  const motionState = document.getElementById('motionState');
  const zoneButtons = Array.from(document.querySelectorAll('button[data-zone]'));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prefersCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const canUsePointerTilt = !prefersReducedMotion && !prefersCoarsePointer;
  const canUseMotionTilt =
    !prefersReducedMotion &&
    prefersCoarsePointer &&
    typeof window.DeviceOrientationEvent !== 'undefined';
  const motionPermissionRequired =
    canUseMotionTilt &&
    typeof window.DeviceOrientationEvent.requestPermission === 'function';

  if (!frame || !zoneDetail || !zoneMetrics || !zoneDepthValue || !zoneDepthFill) {
    return;
  }

  const motion = {
    enabled: false,
    listening: false,
    baselineBeta: null,
    baselineGamma: null,
    currentTiltX: 0,
    currentTiltY: 0,
    currentFloatX: 0,
    currentFloatY: 0,
    targetTiltX: 0,
    targetTiltY: 0,
    targetFloatX: 0,
    targetFloatY: 0,
    sensorTiltX: 0,
    sensorTiltY: 0,
    sensorFloatX: 0,
    sensorFloatY: 0,
    interactionTiltX: 0,
    interactionTiltY: 0,
    interactionFloatX: 0,
    interactionFloatY: 0,
    rafId: 0,
  };

  const touch = {
    active: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
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

  const zoneOrder = Object.keys(zones);
  let activeZone = zoneOrder[0];

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function applyFrameMotion(tiltX, tiltY, floatX, floatY) {
    frame.style.setProperty('--tilt-x', tiltX);
    frame.style.setProperty('--tilt-y', tiltY);
    frame.style.setProperty('--float-x', floatX);
    frame.style.setProperty('--float-y', floatY);
  }

  function commitMotionFrame() {
    applyFrameMotion(
      motion.currentTiltX.toFixed(2),
      motion.currentTiltY.toFixed(2),
      `${motion.currentFloatX.toFixed(2)}px`,
      `${motion.currentFloatY.toFixed(2)}px`
    );
  }

  function queueMotionFrame() {
    if (motion.rafId) {
      return;
    }

    motion.rafId = window.requestAnimationFrame(renderMotionFrame);
  }

  function syncMotionTarget() {
    motion.targetTiltX = motion.sensorTiltX + motion.interactionTiltX;
    motion.targetTiltY = motion.sensorTiltY + motion.interactionTiltY;
    motion.targetFloatX = motion.sensorFloatX + motion.interactionFloatX;
    motion.targetFloatY = motion.sensorFloatY + motion.interactionFloatY;
    queueMotionFrame();
  }

  function renderMotionFrame() {
    motion.rafId = 0;

    const smoothing = motion.enabled ? 0.18 : 0.24;
    motion.currentTiltX += (motion.targetTiltX - motion.currentTiltX) * smoothing;
    motion.currentTiltY += (motion.targetTiltY - motion.currentTiltY) * smoothing;
    motion.currentFloatX += (motion.targetFloatX - motion.currentFloatX) * smoothing;
    motion.currentFloatY += (motion.targetFloatY - motion.currentFloatY) * smoothing;
    commitMotionFrame();

    const isSettled =
      Math.abs(motion.targetTiltX - motion.currentTiltX) < 0.04 &&
      Math.abs(motion.targetTiltY - motion.currentTiltY) < 0.04 &&
      Math.abs(motion.targetFloatX - motion.currentFloatX) < 0.25 &&
      Math.abs(motion.targetFloatY - motion.currentFloatY) < 0.25;

    if (isSettled) {
      motion.currentTiltX = motion.targetTiltX;
      motion.currentTiltY = motion.targetTiltY;
      motion.currentFloatX = motion.targetFloatX;
      motion.currentFloatY = motion.targetFloatY;
      commitMotionFrame();
      return;
    }

    queueMotionFrame();
  }

  function setSensorMotion(tiltX, tiltY, floatX, floatY) {
    motion.sensorTiltX = tiltX;
    motion.sensorTiltY = tiltY;
    motion.sensorFloatX = floatX;
    motion.sensorFloatY = floatY;
    syncMotionTarget();
  }

  function setInteractionMotion(tiltX, tiltY, floatX, floatY) {
    motion.interactionTiltX = tiltX;
    motion.interactionTiltY = tiltY;
    motion.interactionFloatX = floatX;
    motion.interactionFloatY = floatY;
    syncMotionTarget();
  }

  function clearSensorMotion() {
    setSensorMotion(0, 0, 0, 0);
  }

  function clearInteractionMotion() {
    setInteractionMotion(0, 0, 0, 0);
  }

  function resetFrameMotion(immediate = false) {
    motion.sensorTiltX = 0;
    motion.sensorTiltY = 0;
    motion.sensorFloatX = 0;
    motion.sensorFloatY = 0;
    motion.interactionTiltX = 0;
    motion.interactionTiltY = 0;
    motion.interactionFloatX = 0;
    motion.interactionFloatY = 0;
    motion.targetTiltX = 0;
    motion.targetTiltY = 0;
    motion.targetFloatX = 0;
    motion.targetFloatY = 0;

    if (immediate) {
      if (motion.rafId) {
        window.cancelAnimationFrame(motion.rafId);
        motion.rafId = 0;
      }

      motion.currentTiltX = 0;
      motion.currentTiltY = 0;
      motion.currentFloatX = 0;
      motion.currentFloatY = 0;
      applyFrameMotion('0', '0', '0px', '0px');
      return;
    }

    queueMotionFrame();
  }

  function updateMotionUi(mode) {
    if (!worldMotion || !motionToggle || !motionState) {
      return;
    }

    if (!canUseMotionTilt || !motionPermissionRequired) {
      worldMotion.hidden = true;
      motionState.textContent = 'Swipe to move through layers. Tilt your phone for depth.';
      return;
    }

    worldMotion.hidden = false;

    if (mode === 'active') {
      motionToggle.textContent = 'Recenter Tilt';
      motionState.textContent = 'Tilt on. Swipe left or right to move through layers.';
      return;
    }

    if (mode === 'blocked') {
      motionToggle.textContent = 'Try Tilt Again';
      motionState.textContent = 'Tilt permission was blocked. Try again if your browser allows it.';
      return;
    }

    if (mode === 'pending') {
      motionToggle.textContent = 'Waiting for Tilt';
      motionState.textContent = 'Approve tilt access, then move your phone to deepen the world.';
      return;
    }

    motionToggle.textContent = 'Enable Tilt';
    motionState.textContent = 'Enable tilt, or swipe left or right to move through layers.';
  }

  function renderZone(zoneKey) {
    const zone = zones[zoneKey];
    if (!zone) {
      return;
    }

    activeZone = zoneKey;
    frame.dataset.zone = zoneKey;
    zoneDetail.dataset.zone = zoneKey;
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

    zoneButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.zone === zoneKey);
    });
  }

  function stepZone(direction) {
    const currentIndex = zoneOrder.indexOf(activeZone);
    const nextIndex = clamp(currentIndex + direction, 0, zoneOrder.length - 1);
    renderZone(zoneOrder[nextIndex]);
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
      resetFrameMotion(true);
      return;
    }

    const rawBeta = clamp(event.beta - motion.baselineBeta, -18, 18);
    const rawGamma = clamp(event.gamma - motion.baselineGamma, -22, 22);
    const deltaBeta = Math.abs(rawBeta) < 0.9 ? 0 : rawBeta;
    const deltaGamma = Math.abs(rawGamma) < 0.9 ? 0 : rawGamma;
    const tiltX = deltaGamma / 4.4;
    const tiltY = deltaBeta / 5.3;
    const floatX = deltaGamma * 0.72;
    const floatY = deltaBeta * 0.62;

    setSensorMotion(tiltX, tiltY, floatX, floatY);
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
    resetFrameMotion(true);
    updateMotionUi('active');
  }

  async function handleMotionToggle() {
    if (!canUseMotionTilt) {
      return;
    }

    if (motion.enabled) {
      motion.baselineBeta = null;
      motion.baselineGamma = null;
      clearSensorMotion();
      updateMotionUi('active');
      return;
    }

    try {
      if (motionPermissionRequired) {
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

  function handleTouchStart(event) {
    if (!prefersCoarsePointer || event.touches.length !== 1) {
      return;
    }

    const touchPoint = event.touches[0];
    touch.active = true;
    touch.startX = touchPoint.clientX;
    touch.startY = touchPoint.clientY;
    touch.lastX = touchPoint.clientX;
    touch.lastY = touchPoint.clientY;
  }

  function handleTouchMove(event) {
    if (!touch.active || event.touches.length !== 1) {
      return;
    }

    const touchPoint = event.touches[0];
    touch.lastX = touchPoint.clientX;
    touch.lastY = touchPoint.clientY;

    const deltaX = touch.lastX - touch.startX;
    const deltaY = touch.lastY - touch.startY;
    const tiltX = clamp(deltaX / 30, -4.4, 4.4);
    const tiltY = clamp(deltaY / 54, -2.4, 2.4);
    const floatX = clamp(deltaX * 0.5, -22, 22);
    const floatY = clamp(deltaY * 0.28, -12, 12);

    setInteractionMotion(tiltX, tiltY, floatX, floatY);
  }

  function handleTouchEnd() {
    if (!touch.active) {
      return;
    }

    const deltaX = touch.lastX - touch.startX;
    const deltaY = touch.lastY - touch.startY;

    if (Math.abs(deltaX) > 54 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      stepZone(deltaX < 0 ? 1 : -1);
    }

    touch.active = false;
    clearInteractionMotion();
  }

  zoneButtons.forEach((button) => {
    button.addEventListener('click', () => {
      renderZone(button.dataset.zone);
    });
  });

  if (motionToggle) {
    motionToggle.addEventListener('click', () => {
      handleMotionToggle();
    });
  }

  if (canUseMotionTilt) {
    if (motionPermissionRequired) {
      updateMotionUi('ready');
    } else {
      enableMotionTilt();
    }

    window.addEventListener('orientationchange', () => {
      if (!motion.enabled) {
        return;
      }

      motion.baselineBeta = null;
      motion.baselineGamma = null;
      resetFrameMotion(true);
    });
  } else {
    updateMotionUi('unavailable');
  }

  if (prefersCoarsePointer) {
    frame.addEventListener('touchstart', handleTouchStart, { passive: true });
    frame.addEventListener('touchmove', handleTouchMove, { passive: true });
    frame.addEventListener('touchend', handleTouchEnd);
    frame.addEventListener('touchcancel', handleTouchEnd);
  }

  if (canUsePointerTilt) {
    frame.addEventListener('pointermove', (event) => {
      const rect = frame.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const tiltX = (x - 0.5) * 7;
      const tiltY = (y - 0.5) * 6;
      const floatX = (x - 0.5) * 20;
      const floatY = (y - 0.5) * 16;

      setInteractionMotion(tiltX, tiltY, floatX, floatY);
    });

    frame.addEventListener('pointerleave', () => {
      clearInteractionMotion();
    });
  }

  renderZone(activeZone);
})();
