'use strict';

(function init3dvrWorld() {
  document.body.classList.add('world-ready');

  const frame = document.getElementById('clubFrame');
  const zoneDetail = document.getElementById('zoneDetail');
  const zoneMetrics = document.getElementById('zoneMetrics');
  const zoneDepthValue = document.getElementById('zoneDepthValue');
  const zoneDepthFill = document.getElementById('zoneDepthFill');
  const worldStars = document.getElementById('worldStars');
  const sceneCoreLabel = document.querySelector('.scene-core__label');
  const sceneMarquee = document.querySelector('.scene-marquee');
  const sceneStatusLeft = document.querySelector('.scene-status--left strong');
  const sceneStatusRight = document.querySelector('.scene-status--right strong');
  const telemetryPanels = Array.from(document.querySelectorAll('.telemetry-panel'));
  const secretStar = document.querySelector('[data-secret-star]');
  const secretWarpButton = document.querySelector('[data-warp-zone="secret"]');
  const secretPortalButton = document.querySelector('[data-secret-portal]');
  const secretCallout = document.querySelector('[data-secret-callout]');
  const worldMotion = document.getElementById('worldMotion');
  const motionToggle = document.getElementById('motionToggle');
  const motionState = document.getElementById('motionState');
  const zoneButtons = Array.from(document.querySelectorAll('button[data-zone]'));
  const warpButtons = Array.from(document.querySelectorAll('button[data-warp-zone]'));
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
    ambientEnabled: !prefersReducedMotion,
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
    ambientTiltX: 0,
    ambientTiltY: 0,
    ambientFloatX: 0,
    ambientFloatY: 0,
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
  let warpTransitionTimer = 0;

  const touch = {
    active: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
  };

  const zones = {
    arrival: {
      label: 'Castle courtyard',
      room: 'Courtyard',
      camera: 'wide',
      lift: '0px',
      marquee: ['COURTYARD', 'FRONT DOOR', 'OPEN SKY'],
      statusLeft: 'Courtyard active',
      statusRight: 'Bright landing',
      title: 'Make the homepage feel like a castle courtyard with a bright front door and paths into the world.',
      body: 'The frame should feel like a friendly entrance hub: headline in front, floating depth behind it, and obvious paths into offers, experiments, and the portal without turning into a hard game interface.',
      points: [
        'Fast first read on every screen size.',
        'Motion depth without browser lockout.',
        'Clear paths into plans, experiments, and support.',
      ],
      metrics: [
        { label: 'Signal', value: 'Front door' },
        { label: 'Surface', value: 'Hero + stars' },
        { label: 'Link', value: 'Start Free' },
      ],
      depth: 74,
    },
    arena: {
      label: 'Sky bridge',
      room: 'Sky bridge',
      camera: 'wide',
      lift: '-12px',
      marquee: ['SKY BRIDGE', 'OPEN AIR', 'WARP WALK'],
      statusLeft: 'Bridge active',
      statusRight: 'Wide view',
      title: 'Let the middle layer carry atmosphere, featured work, and a floating bridge of projects.',
      body: 'This is where featured work, scenes, community moments, or a bold campaign headline can sit. The frame lets that layer feel expansive without burying navigation.',
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
      label: 'Workshop wing',
      room: 'Workshop',
      camera: 'game',
      lift: '9px',
      marquee: ['WORKSHOP', 'BUILD LANE', 'TOOLS READY'],
      statusLeft: 'Workshop active',
      statusRight: 'Build lane',
      title: 'Show how 3DVR builds, tests, and ships inside the world itself.',
      body: 'The workshop wing can hold build notes, prototype cards, tools, or work-in-progress demos without breaking the framed world metaphor.',
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
      label: 'Portal tower',
      room: 'Portal tower',
      camera: 'high',
      lift: '-16px',
      marquee: ['PORTAL TOWER', 'UPWARD PATH', 'NEXT STEP'],
      statusLeft: 'Tower active',
      statusRight: 'Portal ready',
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
    secret: {
      label: 'Castle attic',
      room: 'Attic',
      camera: 'close',
      lift: '-4px',
      marquee: ['SECRET ATTIC', 'HIDDEN ROOM', 'EXTRA PATH'],
      statusLeft: 'Secret found',
      statusRight: 'Hidden door open',
      title: 'A hidden room opens above the hub after the secret star is collected.',
      body: 'This tucked-away attic is the small reward for exploring the whole castle. It should feel like a quiet Mario-style secret: playful, useful, and easy to discover once the world has already been read.',
      points: [
        'Hidden reward for exploring the hub.',
        'A quieter place for experiments and easter eggs.',
        'The castle gets one more layer without crowding the front door.',
      ],
      metrics: [
        { label: 'Signal', value: 'Secret found' },
        { label: 'Surface', value: 'Attic room' },
        { label: 'Link', value: 'Warp door unlocked' },
      ],
      depth: 95,
    },
  };

  const zoneOrder = Object.keys(zones);
  let activeZone = zoneOrder[0];
  const visitedZones = new Set([activeZone]);
  let secretStarCollected = false;

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
    motion.targetTiltX = motion.ambientTiltX + motion.sensorTiltX + motion.interactionTiltX;
    motion.targetTiltY = motion.ambientTiltY + motion.sensorTiltY + motion.interactionTiltY;
    motion.targetFloatX = motion.ambientFloatX + motion.sensorFloatX + motion.interactionFloatX;
    motion.targetFloatY = motion.ambientFloatY + motion.sensorFloatY + motion.interactionFloatY;
    queueMotionFrame();
  }

  function updateAmbientMotion(now) {
    if (!motion.ambientEnabled) {
      motion.ambientTiltX = 0;
      motion.ambientTiltY = 0;
      motion.ambientFloatX = 0;
      motion.ambientFloatY = 0;
      return;
    }

    const phase = now * 0.00082;
    const tiltScale = prefersCoarsePointer ? 2.4 : 1.25;
    const floatScale = prefersCoarsePointer ? 18 : 10;
    motion.ambientTiltX = Math.sin(phase) * tiltScale;
    motion.ambientTiltY = Math.cos(phase * 0.88) * (tiltScale * 0.68);
    motion.ambientFloatX = Math.sin(phase * 1.12) * floatScale;
    motion.ambientFloatY = Math.cos(phase * 0.94) * (floatScale * 0.72);
  }

  function renderMotionFrame(now) {
    motion.rafId = 0;
    updateAmbientMotion(now);
    motion.targetTiltX = motion.ambientTiltX + motion.sensorTiltX + motion.interactionTiltX;
    motion.targetTiltY = motion.ambientTiltY + motion.sensorTiltY + motion.interactionTiltY;
    motion.targetFloatX = motion.ambientFloatX + motion.sensorFloatX + motion.interactionFloatX;
    motion.targetFloatY = motion.ambientFloatY + motion.sensorFloatY + motion.interactionFloatY;

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

    if (isSettled && !motion.ambientEnabled) {
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

      if (motion.ambientEnabled) {
        updateAmbientMotion(window.performance.now());
        motion.targetTiltX = motion.ambientTiltX;
        motion.targetTiltY = motion.ambientTiltY;
        motion.targetFloatX = motion.ambientFloatX;
        motion.targetFloatY = motion.ambientFloatY;
        motion.currentTiltX = motion.targetTiltX;
        motion.currentTiltY = motion.targetTiltY;
        motion.currentFloatX = motion.targetFloatX;
        motion.currentFloatY = motion.targetFloatY;
        commitMotionFrame();
      } else {
        motion.currentTiltX = 0;
        motion.currentTiltY = 0;
        motion.currentFloatX = 0;
        motion.currentFloatY = 0;
        applyFrameMotion('0', '0', '0px', '0px');
      }

      if (motion.ambientEnabled) {
        queueMotionFrame();
      }
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
      motionState.textContent = 'Drag to look. Swipe to move. Motion is live, and tilt deepens it when available.';
      return;
    }

    worldMotion.hidden = false;

    if (mode === 'active') {
      motionToggle.textContent = 'Recenter Tilt';
      motionState.textContent = 'Tilt on. Drag to look or swipe left and right to move through layers.';
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
    motionState.textContent = 'Enable tilt, or drag and swipe to move through the world.';
  }

  function updateCameraProfile(zone) {
    frame.dataset.camera = zone.camera || 'game';
  }

  function renderZone(zoneKey) {
    const zone = zones[zoneKey];
    if (!zone) {
      return;
    }

    activeZone = zoneKey;
    visitedZones.add(zoneKey);
    frame.dataset.zone = zoneKey;
    zoneDetail.dataset.zone = zoneKey;
    updateCameraProfile(zone);
    frame.style.setProperty('--scene-lift', zone.lift);
    zoneDetail.querySelector('.zone-detail__eyebrow').textContent = zone.label;
    zoneDetail.querySelector('.zone-detail__title').textContent = zone.title;
    zoneDetail.querySelector('.zone-detail__body').textContent = zone.body;
    if (sceneCoreLabel) {
      sceneCoreLabel.textContent = zone.room;
    }
    if (sceneMarquee) {
      sceneMarquee.innerHTML = zone.marquee.map((item) => `<span>${item}</span>`).join('');
    }
    if (sceneStatusLeft) {
      sceneStatusLeft.textContent = zone.statusLeft;
    }
    if (sceneStatusRight) {
      sceneStatusRight.textContent = zone.statusRight;
    }

    const list = zoneDetail.querySelector('.zone-detail__list');
    list.innerHTML = zone.points.map((point) => `<li>${point}</li>`).join('');
    const secretNote = zoneDetail.querySelector('.zone-detail__secret');
    const secretLink = zoneDetail.querySelector('.zone-detail__secret-link');
    const secretPortal = zoneDetail.querySelector('.zone-detail__secret-portal');
    if (secretCallout) {
      secretCallout.hidden = zoneKey !== 'secret';
    }
    if (secretNote) {
      secretNote.hidden = zoneKey !== 'secret';
    }
    if (secretLink) {
      secretLink.hidden = zoneKey !== 'secret';
    }
    if (secretPortal) {
      secretPortal.hidden = zoneKey !== 'secret';
    }
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

    if (worldStars) {
      const starTotal = secretStarCollected ? 5 : 4;
      const starCount = visitedZones.size + (secretStarCollected ? 1 : 0);
      worldStars.textContent = `Stars ${Math.min(starCount, starTotal)}/${starTotal}`;
    }

    if (secretWarpButton) {
      secretWarpButton.hidden = !secretStarCollected;
      secretWarpButton.classList.toggle('is-active', zoneKey === 'secret');
    }

    telemetryPanels.forEach((panel, index) => {
      const panelTitle = panel.querySelector('strong');
      const panelBody = panel.querySelector('p');
      const panelLabel = panel.querySelector('.telemetry-panel__label');
      if (!panelTitle || !panelBody || !panelLabel) {
        return;
      }

      if (index === 0) {
        panelLabel.textContent = zoneKey === 'secret' ? 'Secret stars' : 'Power stars';
        panelTitle.textContent = zoneKey === 'arrival' ? 'Front door' : zone.room;
        panelBody.textContent = zone.body;
      } else {
        panelLabel.textContent = zoneKey === 'arena' ? 'Open sky' : zoneKey === 'studio' ? 'Build tools' : zoneKey === 'rooftop' ? 'Tower view' : 'Warp ready';
        panelTitle.textContent = zone.statusRight;
        panelBody.textContent = zone.points[0];
      }
    });

    zoneButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.zone === zoneKey);
    });

    warpButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.warpZone === zoneKey);
    });

    if (warpTransitionTimer) {
      window.clearTimeout(warpTransitionTimer);
      warpTransitionTimer = 0;
    }

    frame.classList.remove('is-landing', 'is-warping');
    window.requestAnimationFrame(() => {
      frame.classList.add('is-landing', 'is-warping');
      warpTransitionTimer = window.setTimeout(() => {
        frame.classList.remove('is-landing', 'is-warping');
        warpTransitionTimer = 0;
      }, 340);
    });

    if (motionState) {
      motionState.textContent = `Entering ${zone.room}.`;
    }
  }

  function stepZone(direction) {
    const currentIndex = zoneOrder.indexOf(activeZone);
    const nextIndex = clamp(currentIndex + direction, 0, zoneOrder.length - 1);
    renderZone(zoneOrder[nextIndex]);
  }

  function collectSecretStar() {
    if (secretStarCollected) {
      return;
    }

    secretStarCollected = true;

    if (secretStar) {
      secretStar.classList.add('is-collected');
      secretStar.setAttribute('aria-hidden', 'true');
      secretStar.disabled = true;
    }

    if (secretWarpButton) {
      secretWarpButton.hidden = false;
    }

    frame.classList.remove('is-secret-star');
    window.requestAnimationFrame(() => {
      frame.classList.add('is-secret-star');
      window.setTimeout(() => frame.classList.remove('is-secret-star'), 760);
    });

    if (worldStars) {
      worldStars.textContent = `Stars 5/5`;
    }

    if (motionState) {
      motionState.textContent = 'Secret star collected. The attic door is open now.';
    }

    if (zoneDetail) {
      const secretNote = zoneDetail.querySelector('.zone-detail__secret');
      if (secretNote) {
        secretNote.hidden = false;
      }

      const secretLink = zoneDetail.querySelector('.zone-detail__secret-link');
      if (secretLink) {
        secretLink.hidden = false;
      }

      const secretPortal = zoneDetail.querySelector('.zone-detail__secret-portal');
      if (secretPortal) {
        secretPortal.hidden = false;
      }
    }

    window.setTimeout(() => {
      renderZone('secret');
    }, 260);
  }

  if (secretPortalButton) {
    secretPortalButton.addEventListener('click', () => {
      frame.classList.add('is-warping');
      if (motionState) {
        motionState.textContent = 'Warping to the projects room.';
      }
      window.setTimeout(() => {
        window.location.href = '/pages/portfolio.html#projects';
      }, 260);
    });
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
    const deltaBeta = Math.abs(rawBeta) < 0.45 ? 0 : rawBeta;
    const deltaGamma = Math.abs(rawGamma) < 0.45 ? 0 : rawGamma;
    const tiltX = clamp(deltaGamma / 2.9, -7.2, 7.2);
    const tiltY = clamp(deltaBeta / 3.6, -5.1, 5.1);
    const floatX = deltaGamma * 1.24;
    const floatY = deltaBeta * 1.02;

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
    const tiltX = clamp(deltaX / 15, -7.6, 7.6);
    const tiltY = clamp(deltaY / 26, -5.2, 5.2);
    const floatX = clamp(deltaX * 1.05, -48, 48);
    const floatY = clamp(deltaY * 0.78, -30, 30);

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

  warpButtons.forEach((button) => {
    button.addEventListener('click', () => {
      renderZone(button.dataset.warpZone);
    });
  });

  if (secretStar) {
    secretStar.addEventListener('click', collectSecretStar);
  }

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
  if (motion.ambientEnabled) {
    updateAmbientMotion(window.performance.now());
    motion.targetTiltX = motion.ambientTiltX;
    motion.targetTiltY = motion.ambientTiltY;
    motion.targetFloatX = motion.ambientFloatX;
    motion.targetFloatY = motion.ambientFloatY;
    motion.currentTiltX = motion.targetTiltX;
    motion.currentTiltY = motion.targetTiltY;
    motion.currentFloatX = motion.targetFloatX;
    motion.currentFloatY = motion.targetFloatY;
    commitMotionFrame();
  }
  queueMotionFrame();
})();
