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
  const secretCalloutLink = document.querySelector('.scene-secret-callout__link');
  const secretCallout = document.querySelector('[data-secret-callout]');
  const worldMobileHint = document.querySelector('.world-mobile-hint');
  const prizePanel = document.querySelector('[data-prize-panel]');
  const gameLevelLabel = document.getElementById('worldGameLevel');
  const gameCoinsLabel = document.getElementById('worldGameCoins');
  const gameBoostLabel = document.getElementById('worldGameBoost');
  const gameStartButton = document.getElementById('worldGameStart');
  const gameResetButton = document.getElementById('worldGameReset');
  const gameControlButtons = Array.from(document.querySelectorAll('[data-game-control]'));
  const fallbackCanvas = document.getElementById('worldCanvasFallback');
  const threeCanvas = document.getElementById('worldThreeCanvas');
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
  const THREE_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  const WORLD_PRIZE_URL = '/3dvr-world/prize.html';

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
  let snapTransitionTimer = 0;
  let fallbackWorld = null;
  let threeWorld = null;
  let projectsWarping = false;

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

  const gameLevels = [
    {
      key: 'arrival',
      name: 'Courtyard',
      coins: [[0.22, 0.68], [0.34, 0.58], [0.48, 0.52], [0.62, 0.58], [0.76, 0.68]],
      hazards: [[0.44, 0.75], [0.58, 0.74]],
      portal: [0.84, 0.54],
    },
    {
      key: 'arena',
      name: 'Sky bridge',
      coins: [[0.18, 0.58], [0.3, 0.44], [0.46, 0.36], [0.62, 0.44], [0.78, 0.58]],
      hazards: [[0.4, 0.68], [0.64, 0.7], [0.54, 0.28]],
      portal: [0.82, 0.38],
    },
    {
      key: 'studio',
      name: 'Workshop',
      coins: [[0.2, 0.42], [0.32, 0.62], [0.5, 0.72], [0.66, 0.55], [0.8, 0.42]],
      hazards: [[0.28, 0.75], [0.56, 0.48], [0.72, 0.68]],
      portal: [0.86, 0.6],
    },
    {
      key: 'rooftop',
      name: 'Portal tower',
      coins: [[0.22, 0.72], [0.34, 0.52], [0.5, 0.34], [0.66, 0.52], [0.78, 0.72]],
      hazards: [[0.38, 0.76], [0.5, 0.58], [0.62, 0.76]],
      portal: [0.5, 0.25],
    },
    {
      key: 'secret',
      name: 'Attic',
      coins: [[0.24, 0.62], [0.38, 0.42], [0.5, 0.32], [0.62, 0.42], [0.76, 0.62]],
      hazards: [[0.35, 0.72], [0.5, 0.54], [0.65, 0.72]],
      portal: [0.5, 0.18],
    },
  ];

  const worldGame = {
    started: false,
    completed: false,
    levelIndex: 0,
    activeLevelKey: 'arrival',
    player: { x: 0.16, y: 0.72, vx: 0, vy: 0 },
    input: { left: false, right: false, up: false, down: false, boost: false },
    boost: 1,
    score: 0,
    levelStates: gameLevels.reduce((states, level) => {
      states[level.key] = {
        coins: level.coins.map(() => false),
        complete: false,
      };
      return states;
    }, {}),
  };

  function getGameLevel(zoneKey = worldGame.activeLevelKey) {
    return gameLevels.find((level) => level.key === zoneKey) || gameLevels[0];
  }

  function resetGamePlayer() {
    worldGame.player.x = 0.16;
    worldGame.player.y = 0.72;
    worldGame.player.vx = 0;
    worldGame.player.vy = 0;
  }

  function updateGameHud() {
    const level = getGameLevel();
    const state = worldGame.levelStates[level.key];
    const collected = state.coins.filter(Boolean).length;

    if (gameLevelLabel) {
      gameLevelLabel.textContent = `${worldGame.levelIndex + 1} ${level.name}`;
    }
    if (gameCoinsLabel) {
      gameCoinsLabel.textContent = `${collected}/${level.coins.length}`;
    }
    if (gameBoostLabel) {
      gameBoostLabel.textContent = `${Math.round(worldGame.boost * 100)}%`;
    }
    if (gameStartButton) {
      gameStartButton.textContent = worldGame.started ? 'Running' : 'Start run';
    }
  }

  function setGameLevel(zoneKey) {
    const nextIndex = gameLevels.findIndex((level) => level.key === zoneKey);

    if (nextIndex === -1) {
      return;
    }

    if (worldGame.activeLevelKey !== zoneKey) {
      worldGame.activeLevelKey = zoneKey;
      worldGame.levelIndex = nextIndex;
      resetGamePlayer();
    }

    updateGameHud();
  }

  function startGame() {
    worldGame.started = true;
    worldGame.completed = false;
    if (prizePanel) {
      prizePanel.hidden = true;
    }
    updateGameHud();
    if (fallbackWorld) {
      fallbackWorld.pulse(1);
    }
  }

  function resetActiveGameLevel() {
    const level = getGameLevel();
    worldGame.levelStates[level.key].coins = level.coins.map(() => false);
    worldGame.levelStates[level.key].complete = false;
    resetGamePlayer();
    worldGame.started = true;
    worldGame.completed = false;
    if (prizePanel) {
      prizePanel.hidden = true;
    }
    updateGameHud();
  }

  function setGameControl(control, isActive) {
    if (Object.prototype.hasOwnProperty.call(worldGame.input, control)) {
      worldGame.input[control] = isActive;
    }
  }

  function completeActiveGameLevel() {
    const level = getGameLevel();
    const state = worldGame.levelStates[level.key];

    if (state.complete) {
      return;
    }

    state.complete = true;
    visitedZones.add(level.key);
    updateGameHud();

    if (fallbackWorld) {
      fallbackWorld.pulse(1.35);
    }
    if (threeWorld) {
      threeWorld.pulse(1);
    }

    if (motionState) {
      motionState.textContent = `${level.name} cleared.`;
    }

    const nextLevel = gameLevels[worldGame.levelIndex + 1];

    if (nextLevel) {
      if (nextLevel.key === 'secret' && !secretStarCollected) {
        collectSecretStar();
      }
      window.setTimeout(() => {
        renderZone(nextLevel.key);
      }, nextLevel.key === 'secret' ? 420 : 360);
      return;
    }

    worldGame.completed = true;
    worldGame.started = false;
    if (prizePanel) {
      prizePanel.hidden = false;
    }
    if (motionState) {
      motionState.textContent = 'Run complete. Builder Pass unlocked.';
    }
  }

  function createCanvasFallbackWorld(canvas) {
    const context = canvas.getContext('2d');

    if (!context) {
      return null;
    }

    const palettes = {
      arrival: { sky: '#082033', glow: '#6ff7ff', trim: '#7dd3fc', ground: '#12384f', label: 'COURTYARD' },
      arena: { sky: '#0b1230', glow: '#8a84ff', trim: '#a78bfa', ground: '#24305f', label: 'SKY BRIDGE' },
      studio: { sky: '#082313', glow: '#d4ff63', trim: '#6ee7b7', ground: '#174329', label: 'WORKSHOP' },
      rooftop: { sky: '#24130f', glow: '#ff8a4c', trim: '#ffd36f', ground: '#4d2d24', label: 'PORTAL' },
      secret: { sky: '#12091e', glow: '#d4ff63', trim: '#a78bfa', ground: '#2a214f', label: 'ATTIC' },
    };
    const cameraOffsets = {
      arrival: { x: 0, y: 0, scale: 1 },
      arena: { x: -0.06, y: -0.02, scale: 1.04 },
      studio: { x: 0.06, y: 0.04, scale: 1.05 },
      rooftop: { x: 0, y: -0.08, scale: 0.96 },
      secret: { x: 0, y: 0.07, scale: 1.14 },
    };
    const state = {
      activeZone: 'arrival',
      starCollected: false,
      pulse: 0,
      width: 1,
      height: 1,
      dpr: 1,
      rafId: 0,
      lastTime: 0,
    };

    function resize() {
      const rect = canvas.getBoundingClientRect();
      state.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      state.width = Math.max(1, Math.floor(rect.width));
      state.height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(state.width * state.dpr);
      canvas.height = Math.floor(state.height * state.dpr);
      context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    }

    function drawPolygon(points, fill, stroke = null, lineWidth = 1) {
      context.beginPath();
      points.forEach(([x, y], index) => {
        if (index === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      });
      context.closePath();
      context.fillStyle = fill;
      context.fill();
      if (stroke) {
        context.strokeStyle = stroke;
        context.lineWidth = lineWidth;
        context.stroke();
      }
    }

    function drawCoin(x, y, radius, phase, palette) {
      const shine = context.createRadialGradient(x - radius * 0.35, y - radius * 0.35, 1, x, y, radius);
      shine.addColorStop(0, 'rgba(255,255,255,0.95)');
      shine.addColorStop(0.28, '#fff3a3');
      shine.addColorStop(0.72, '#f6b928');
      shine.addColorStop(1, '#9f6507');
      context.save();
      context.translate(x, y + Math.sin(phase) * radius * 0.18);
      context.scale(0.82 + Math.sin(phase * 0.8) * 0.08, 1);
      context.shadowColor = 'rgba(255, 207, 76, 0.62)';
      context.shadowBlur = radius * 1.2;
      context.fillStyle = shine;
      context.beginPath();
      context.arc(0, 0, radius, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
      context.strokeStyle = palette.trim;
      context.globalAlpha = 0.5;
      context.lineWidth = 2;
      context.stroke();
      context.restore();
    }

    function drawPortal(x, y, radius, phase, palette) {
      context.save();
      context.translate(x, y);
      context.rotate(phase * 0.18);
      context.strokeStyle = palette.glow;
      context.lineWidth = Math.max(4, radius * 0.08);
      context.shadowColor = palette.glow;
      context.shadowBlur = radius * 0.42;
      context.beginPath();
      context.ellipse(0, 0, radius * 0.72, radius, 0, 0, Math.PI * 2);
      context.stroke();
      context.globalAlpha = 0.18;
      context.fillStyle = palette.glow;
      context.fill();
      context.restore();
    }

    function drawHazard(x, y, radius, phase, palette) {
      context.save();
      context.translate(x, y);
      context.rotate(phase);
      context.shadowColor = 'rgba(255, 90, 122, 0.46)';
      context.shadowBlur = radius * 1.2;
      context.fillStyle = '#ff5a7a';
      drawPolygon(
        [[0, -radius], [radius * 0.34, -radius * 0.34], [radius, 0], [radius * 0.34, radius * 0.34], [0, radius], [-radius * 0.34, radius * 0.34], [-radius, 0], [-radius * 0.34, -radius * 0.34]],
        '#ff5a7a',
        palette.glow,
        1.5
      );
      context.restore();
    }

    function drawPlayer(x, y, radius, phase, palette, isBoosting) {
      context.save();
      context.translate(x, y);
      context.shadowColor = palette.glow;
      context.shadowBlur = radius * (isBoosting ? 1.8 : 0.9);
      context.fillStyle = 'rgba(243, 246, 251, 0.94)';
      context.beginPath();
      context.arc(0, -radius * 0.45, radius * 0.42, 0, Math.PI * 2);
      context.fill();
      context.fillRect(-radius * 0.32, -radius * 0.06, radius * 0.64, radius * 0.94);
      context.fillStyle = palette.glow;
      context.fillRect(-radius * 0.26, -radius * 0.52, radius * 0.52, radius * 0.12);
      context.globalAlpha = isBoosting ? 0.74 : 0.38;
      context.fillStyle = '#ffd36f';
      drawPolygon(
        [[-radius * 0.22, radius * 0.9], [0, radius * (1.42 + Math.sin(phase * 8) * 0.18)], [radius * 0.22, radius * 0.9]],
        '#ffd36f'
      );
      context.restore();
    }

    function updateGame(deltaSeconds) {
      if (!worldGame.started || worldGame.completed) {
        return;
      }

      const level = getGameLevel(state.activeZone);
      const levelState = worldGame.levelStates[level.key];
      const player = worldGame.player;
      const boostActive = worldGame.input.boost && worldGame.boost > 0.04;
      const acceleration = boostActive ? 1.42 : 0.92;
      let moveX = 0;
      let moveY = 0;

      if (worldGame.input.left) moveX -= 1;
      if (worldGame.input.right) moveX += 1;
      if (worldGame.input.up) moveY -= 1;
      if (worldGame.input.down) moveY += 1;

      if (moveX || moveY) {
        const length = Math.hypot(moveX, moveY) || 1;
        player.vx += (moveX / length) * acceleration * deltaSeconds;
        player.vy += (moveY / length) * acceleration * deltaSeconds;
      }

      player.vx *= 0.88;
      player.vy *= 0.88;
      player.x = clamp(player.x + player.vx, 0.08, 0.92);
      player.y = clamp(player.y + player.vy, 0.18, 0.84);
      worldGame.boost = clamp(worldGame.boost + (boostActive ? -0.42 : 0.2) * deltaSeconds, 0, 1);

      level.coins.forEach(([coinX, coinY], index) => {
        if (levelState.coins[index]) {
          return;
        }

        if (Math.hypot(player.x - coinX, player.y - coinY) < 0.055) {
          levelState.coins[index] = true;
          worldGame.score += 1;
          state.pulse = Math.max(state.pulse, 0.8);
          updateGameHud();
        }
      });

      level.hazards.forEach(([hazardX, hazardY]) => {
        if (Math.hypot(player.x - hazardX, player.y - hazardY) < 0.048) {
          player.x = 0.16;
          player.y = 0.72;
          player.vx = 0;
          player.vy = 0;
          state.pulse = Math.max(state.pulse, 0.55);
        }
      });

      const collected = levelState.coins.every(Boolean);
      const portalReached = Math.hypot(player.x - level.portal[0], player.y - level.portal[1]) < 0.08;

      if (collected && portalReached) {
        completeActiveGameLevel();
      }
    }

    function drawGameLayer(width, height, unit, phase, palette) {
      const level = getGameLevel(state.activeZone);
      const levelState = worldGame.levelStates[level.key];
      const playerRadius = Math.max(13, unit * 0.36);
      const toX = (value) => value * width;
      const toY = (value) => value * height;

      level.hazards.forEach(([x, y], index) => {
        drawHazard(toX(x), toY(y), Math.max(10, unit * 0.23), phase * 1.6 + index, palette);
      });

      level.coins.forEach(([x, y], index) => {
        if (!levelState.coins[index]) {
          drawCoin(toX(x), toY(y), Math.max(8, unit * 0.2), phase * 2.4 + index * 0.44, palette);
        }
      });

      const allCoinsCollected = levelState.coins.every(Boolean);
      context.globalAlpha = allCoinsCollected ? 1 : 0.34;
      drawPortal(toX(level.portal[0]), toY(level.portal[1]), Math.max(20, unit * 0.58), phase, palette);
      context.globalAlpha = 1;
      drawPlayer(
        toX(worldGame.player.x),
        toY(worldGame.player.y),
        playerRadius,
        phase,
        palette,
        worldGame.input.boost && worldGame.boost > 0.04
      );
    }

    function drawCastle(centerX, centerY, unit, phase, palette) {
      context.save();
      context.translate(centerX, centerY + Math.sin(phase) * unit * 0.04);
      context.shadowColor = 'rgba(0, 0, 0, 0.35)';
      context.shadowBlur = unit * 0.3;
      context.fillStyle = 'rgba(125, 211, 252, 0.18)';
      context.fillRect(-unit * 2.45, -unit * 0.15, unit * 4.9, unit * 1.6);
      context.fillStyle = 'rgba(198, 222, 255, 0.7)';
      context.fillRect(-unit * 1.55, -unit * 1.2, unit * 3.1, unit * 2.35);
      context.fillRect(-unit * 2.45, -unit * 1.75, unit * 0.68, unit * 2.9);
      context.fillRect(unit * 1.78, -unit * 1.75, unit * 0.68, unit * 2.9);
      drawPolygon(
        [[-unit * 1.95, -unit * 2.82], [-unit * 2.8, -unit * 1.75], [-unit * 1.1, -unit * 1.75]],
        palette.trim
      );
      drawPolygon(
        [[unit * 1.95, -unit * 2.82], [unit * 1.1, -unit * 1.75], [unit * 2.8, -unit * 1.75]],
        palette.trim
      );
      drawPolygon(
        [[0, -unit * 2.55], [-unit * 1.25, -unit * 1.2], [unit * 1.25, -unit * 1.2]],
        'rgba(255, 243, 163, 0.78)'
      );
      context.fillStyle = 'rgba(3, 10, 20, 0.72)';
      context.beginPath();
      context.arc(0, unit * 0.95, unit * 0.42, Math.PI, 0);
      context.lineTo(unit * 0.42, unit * 1.28);
      context.lineTo(-unit * 0.42, unit * 1.28);
      context.closePath();
      context.fill();
      context.restore();
    }

    function draw(now = 0) {
      const width = state.width;
      const height = state.height;
      const time = now * 0.001;
      const deltaSeconds = state.lastTime ? Math.min(0.05, (now - state.lastTime) * 0.001) : 0;
      const palette = palettes[state.activeZone] || palettes.arrival;
      const camera = cameraOffsets[state.activeZone] || cameraOffsets.arrival;
      const shortSide = Math.min(width, height);
      const unit = shortSide * 0.08 * camera.scale;
      const centerX = width * (0.5 + camera.x);
      const centerY = height * (0.52 + camera.y);
      const pulse = state.pulse;

      state.lastTime = now;
      updateGame(deltaSeconds);

      context.clearRect(0, 0, width, height);
      const sky = context.createRadialGradient(centerX, height * 0.18, 1, centerX, height * 0.38, Math.max(width, height) * 0.72);
      sky.addColorStop(0, `${palette.glow}38`);
      sky.addColorStop(0.42, palette.sky);
      sky.addColorStop(1, '#02070f');
      context.fillStyle = sky;
      context.fillRect(0, 0, width, height);

      context.save();
      context.translate(centerX, centerY);
      context.strokeStyle = `${palette.glow}44`;
      context.lineWidth = 1;
      for (let index = 0; index < 4; index += 1) {
        context.beginPath();
        context.ellipse(
          0,
          unit * 0.2,
          unit * (2.7 + index * 0.9 + pulse * 0.2),
          unit * (1.45 + index * 0.34),
          time * 0.08 + index * 0.7,
          0,
          Math.PI * 2
        );
        context.globalAlpha = 0.38 - index * 0.055;
        context.stroke();
      }
      context.restore();
      context.globalAlpha = 1;

      for (let index = 0; index < 36; index += 1) {
        const x = (Math.sin(index * 17.17) * 0.5 + 0.5) * width;
        const y = (Math.cos(index * 9.41) * 0.5 + 0.5) * height * 0.72;
        context.fillStyle = index % 5 === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(214,244,255,0.55)';
        context.fillRect(x, y, index % 5 === 0 ? 2 : 1, index % 5 === 0 ? 2 : 1);
      }

      drawCastle(centerX + unit * 1.25, centerY + unit * 0.62, unit, time * 1.2, palette);

      const coinCount = width < 520 ? 6 : 7;
      for (let index = 0; index < coinCount; index += 1) {
        const progress = coinCount === 1 ? 0 : index / (coinCount - 1);
        const x = centerX - unit * 3.2 + progress * unit * 4.9;
        const y = centerY + unit * 1.85 - Math.sin(progress * Math.PI) * unit * 0.72;
        drawCoin(x, y, Math.max(7, unit * 0.18), time * 2.4 + index * 0.55, palette);
      }

      if (state.starCollected || state.activeZone === 'secret' || state.activeZone === 'rooftop') {
        drawPortal(centerX + unit * 2.75, centerY + unit * 1.15, unit * 0.68, time, palette);
      }

      drawGameLayer(width, height, unit, time, palette);

      context.save();
      context.translate(centerX - unit * 0.5 + Math.sin(time) * unit * 0.12, centerY + unit * 1.12);
      context.fillStyle = 'rgba(243, 246, 251, 0.88)';
      context.beginPath();
      context.arc(0, -unit * 0.44, unit * 0.2, 0, Math.PI * 2);
      context.fill();
      context.fillRect(-unit * 0.18, -unit * 0.35, unit * 0.36, unit * 0.72);
      context.fillStyle = palette.glow;
      context.fillRect(-unit * 0.13, -unit * 0.47, unit * 0.26, unit * 0.05);
      context.restore();

      context.save();
      context.font = `${Math.max(48, shortSide * 0.13)}px Chakra Petch, sans-serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.letterSpacing = '0.18em';
      context.fillStyle = 'rgba(243, 246, 251, 0.78)';
      context.shadowColor = palette.glow;
      context.shadowBlur = unit * 0.18;
      context.fillText(palette.label, centerX, centerY + unit * 0.1);
      context.restore();

      state.pulse *= 0.92;
      state.rafId = window.requestAnimationFrame(draw);
    }

    function setZone(zoneKey) {
      state.activeZone = zoneKey;
      state.pulse = Math.max(state.pulse, 1);
    }

    function collectStar() {
      state.starCollected = true;
      state.pulse = 1.4;
    }

    function pulse(amount = 0.85) {
      state.pulse = Math.max(state.pulse, amount);
    }

    resize();
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(resize);
      observer.observe(canvas);
    } else {
      window.addEventListener('resize', resize);
    }
    state.rafId = window.requestAnimationFrame(draw);

    return {
      setZone,
      collectStar,
      pulse,
    };
  }

  function loadThreeLibrary() {
    if (globalThis.THREE) {
      return Promise.resolve(globalThis.THREE);
    }

    if (!threeCanvas) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      const existingLoader = document.querySelector('script[data-three-world-loader]');

      if (existingLoader) {
        existingLoader.addEventListener('load', () => resolve(globalThis.THREE || null), { once: true });
        existingLoader.addEventListener('error', () => resolve(null), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = THREE_CDN_URL;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.dataset.threeWorldLoader = 'true';
      script.addEventListener('load', () => resolve(globalThis.THREE || null), { once: true });
      script.addEventListener('error', () => resolve(null), { once: true });
      document.head.append(script);
    });
  }

  function createStarGeometry(THREE) {
    const shape = new THREE.Shape();
    const outerRadius = 0.92;
    const innerRadius = 0.42;

    for (let index = 0; index < 10; index += 1) {
      const radius = index % 2 === 0 ? outerRadius : innerRadius;
      const angle = -Math.PI / 2 + (index / 10) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      if (index === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }

    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.16,
      bevelEnabled: true,
      bevelSegments: 1,
      bevelSize: 0.035,
      bevelThickness: 0.035,
    });
    geometry.center();
    return geometry;
  }

  function createThreeWorld(THREE, canvas) {
    let renderer;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
      });
    } catch (error) {
      return null;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));

    if ('outputEncoding' in renderer && THREE.sRGBEncoding) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x06101f, 13, 46);

    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 120);
    const world = new THREE.Group();
    const platformGroup = new THREE.Group();
    const coinGroup = new THREE.Group();
    const portalGroup = new THREE.Group();
    const castleGroup = new THREE.Group();
    const atticGroup = new THREE.Group();
    const playerGroup = new THREE.Group();
    scene.add(world);
    world.add(platformGroup, castleGroup, coinGroup, portalGroup, atticGroup, playerGroup);

    const materials = {
      ground: new THREE.MeshStandardMaterial({
        color: 0x18385a,
        roughness: 0.72,
        metalness: 0.08,
      }),
      platform: new THREE.MeshStandardMaterial({
        color: 0x1d6a87,
        roughness: 0.62,
        metalness: 0.12,
      }),
      platformEdge: new THREE.MeshStandardMaterial({
        color: 0x6ff7ff,
        emissive: 0x0b8292,
        emissiveIntensity: 0.34,
        roughness: 0.48,
      }),
      castle: new THREE.MeshStandardMaterial({
        color: 0x78a4c4,
        roughness: 0.7,
        metalness: 0.04,
      }),
      roof: new THREE.MeshStandardMaterial({
        color: 0x8a84ff,
        emissive: 0x1f1a68,
        emissiveIntensity: 0.28,
        roughness: 0.52,
      }),
      gate: new THREE.MeshStandardMaterial({
        color: 0x07111f,
        emissive: 0x022b3d,
        emissiveIntensity: 0.24,
        roughness: 0.58,
      }),
      coin: new THREE.MeshStandardMaterial({
        color: 0xffd36f,
        emissive: 0xff9b22,
        emissiveIntensity: 0.46,
        roughness: 0.38,
        metalness: 0.38,
      }),
      star: new THREE.MeshStandardMaterial({
        color: 0xfff2a6,
        emissive: 0xffc247,
        emissiveIntensity: 0.72,
        roughness: 0.28,
        metalness: 0.22,
      }),
      portal: new THREE.MeshStandardMaterial({
        color: 0xd4ff63,
        emissive: 0x6ff7ff,
        emissiveIntensity: 0.84,
        roughness: 0.34,
        metalness: 0.18,
      }),
      avatar: new THREE.MeshStandardMaterial({
        color: 0xf3f6fb,
        emissive: 0x13495a,
        emissiveIntensity: 0.16,
        roughness: 0.54,
      }),
      shadow: new THREE.MeshBasicMaterial({
        color: 0x02070f,
        transparent: true,
        opacity: 0.34,
      }),
    };

    const palettes = {
      arrival: {
        fog: 0x061626,
        ground: 0x18385a,
        platform: 0x1d6a87,
        edge: 0x6ff7ff,
        roof: 0x8a84ff,
        portal: 0xd4ff63,
      },
      arena: {
        fog: 0x080b28,
        ground: 0x202b66,
        platform: 0x473b96,
        edge: 0x8a84ff,
        roof: 0x6ff7ff,
        portal: 0xffd36f,
      },
      studio: {
        fog: 0x071c10,
        ground: 0x173f28,
        platform: 0x237044,
        edge: 0xd4ff63,
        roof: 0x6ff7ff,
        portal: 0xd4ff63,
      },
      rooftop: {
        fog: 0x1f1211,
        ground: 0x4f2f24,
        platform: 0x8a4632,
        edge: 0xff8a4c,
        roof: 0xffd36f,
        portal: 0x6ff7ff,
      },
      secret: {
        fog: 0x12091e,
        ground: 0x231b46,
        platform: 0x4c377f,
        edge: 0xd4ff63,
        roof: 0xa78bfa,
        portal: 0xd4ff63,
      },
    };

    const cameraProfiles = {
      arrival: {
        position: new THREE.Vector3(0, 6.2, 18),
        lookAt: new THREE.Vector3(0, 1.55, -1.6),
        rotation: 0,
        portalScale: 0.88,
      },
      arena: {
        position: new THREE.Vector3(-8.2, 7.2, 17.6),
        lookAt: new THREE.Vector3(0.2, 1.75, -2.2),
        rotation: 0.24,
        portalScale: 1,
      },
      studio: {
        position: new THREE.Vector3(7.2, 4.9, 13.2),
        lookAt: new THREE.Vector3(1.1, 1.5, -1.5),
        rotation: -0.2,
        portalScale: 0.94,
      },
      rooftop: {
        position: new THREE.Vector3(0, 10.5, 14.4),
        lookAt: new THREE.Vector3(0, 2.5, -2.8),
        rotation: 0.08,
        portalScale: 1.12,
      },
      secret: {
        position: new THREE.Vector3(0.4, 3.7, 8.8),
        lookAt: new THREE.Vector3(0, 1.6, 3.2),
        rotation: 0,
        portalScale: 1.32,
      },
    };

    const state = {
      active: true,
      activeZone: 'arrival',
      pulse: 0,
      starCollected: false,
      targetCameraPosition: cameraProfiles.arrival.position.clone(),
      targetLookAt: cameraProfiles.arrival.lookAt.clone(),
      currentLookAt: cameraProfiles.arrival.lookAt.clone(),
      targetWorldRotation: 0,
      targetPortalScale: cameraProfiles.arrival.portalScale,
      rafId: 0,
    };

    const hemisphereLight = new THREE.HemisphereLight(0x9cecff, 0x101828, 1.4);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
    keyLight.position.set(7, 10, 8);
    const portalLight = new THREE.PointLight(0x6ff7ff, 2.8, 30);
    portalLight.position.set(0, 2.5, 5);
    const starLight = new THREE.PointLight(0xffd36f, 1.8, 18);
    starLight.position.set(4.6, 5.6, -1.2);
    scene.add(hemisphereLight, keyLight, portalLight, starLight);

    const ground = new THREE.Mesh(new THREE.CylinderGeometry(15.5, 18.5, 1, 40), materials.ground);
    ground.position.y = -0.72;
    ground.receiveShadow = true;
    platformGroup.add(ground);

    const grid = new THREE.GridHelper(36, 18, 0x6ff7ff, 0x24455f);
    grid.position.y = -0.14;
    grid.material.transparent = true;
    grid.material.opacity = 0.26;
    platformGroup.add(grid);

    const platformGeometry = new THREE.BoxGeometry(5.4, 0.48, 4.6);
    const bridgeGeometry = new THREE.BoxGeometry(3.2, 0.35, 6.2);
    const edgeGeometry = new THREE.BoxGeometry(5.7, 0.12, 4.9);
    const platformSpecs = [
      { x: -5.6, y: 0.15, z: 1.9, rotation: 0.22 },
      { x: 5.6, y: 0.7, z: 0.6, rotation: -0.18 },
      { x: 0, y: 1.18, z: 4.65, rotation: 0 },
      { x: 0, y: 2.12, z: -6.1, rotation: 0.06 },
    ];

    platformSpecs.forEach((spec, index) => {
      const platform = new THREE.Mesh(index === 1 ? bridgeGeometry : platformGeometry, materials.platform);
      platform.position.set(spec.x, spec.y, spec.z);
      platform.rotation.y = spec.rotation;
      platform.userData.baseY = spec.y;
      platformGroup.add(platform);

      const edge = new THREE.Mesh(edgeGeometry, materials.platformEdge);
      edge.position.copy(platform.position);
      edge.position.y += 0.31;
      edge.rotation.y = spec.rotation;
      edge.scale.set(index === 1 ? 0.62 : 1, 1, index === 1 ? 1.32 : 1);
      edge.userData.baseY = edge.position.y;
      platformGroup.add(edge);
    });

    const keep = new THREE.Mesh(new THREE.BoxGeometry(4.6, 3.6, 3.9), materials.castle);
    keep.position.set(0, 1.36, -3.2);
    castleGroup.add(keep);

    const gate = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.7, 0.18), materials.gate);
    gate.position.set(0, 0.72, -1.2);
    castleGroup.add(gate);

    const towerGeometry = new THREE.CylinderGeometry(0.98, 1.18, 4.8, 8);
    const roofGeometry = new THREE.ConeGeometry(1.25, 1.8, 8);
    [-3.35, 3.35].forEach((x) => {
      const tower = new THREE.Mesh(towerGeometry, materials.castle);
      tower.position.set(x, 1.82, -3.35);
      tower.rotation.y = Math.PI / 8;
      castleGroup.add(tower);

      const roof = new THREE.Mesh(roofGeometry, materials.roof);
      roof.position.set(x, 4.95, -3.35);
      roof.rotation.y = Math.PI / 8;
      castleGroup.add(roof);
    });

    const centerRoof = new THREE.Mesh(new THREE.ConeGeometry(2.3, 2.1, 4), materials.roof);
    centerRoof.position.set(0, 4.35, -3.2);
    centerRoof.rotation.y = Math.PI / 4;
    castleGroup.add(centerRoof);

    const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.4, 8), materials.platformEdge);
    flagPole.position.set(0, 5.9, -3.2);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.44, 0.035), materials.portal);
    flag.position.set(0.45, 6.14, -3.2);
    castleGroup.add(flagPole, flag);

    const portalRing = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.11, 14, 56), materials.portal);
    portalRing.position.set(0, 2.05, 4.96);
    portalGroup.add(portalRing);

    const portalCore = new THREE.Mesh(
      new THREE.CircleGeometry(1.38, 44),
      new THREE.MeshBasicMaterial({
        color: 0x6ff7ff,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
      })
    );
    portalCore.position.copy(portalRing.position);
    portalGroup.add(portalCore);

    const portalShadow = new THREE.Mesh(new THREE.CircleGeometry(2.3, 36), materials.shadow);
    portalShadow.position.set(0, -0.12, 4.9);
    portalShadow.rotation.x = -Math.PI / 2;
    portalGroup.add(portalShadow);

    const atticFloor = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.34, 3.2), materials.platform);
    atticFloor.position.set(0, 3.15, 3.4);
    const atticDoor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.1, 0.18), materials.gate);
    atticDoor.position.set(0, 4.25, 4.92);
    const atticGlow = new THREE.Mesh(
      new THREE.CircleGeometry(1.45, 36),
      new THREE.MeshBasicMaterial({
        color: 0xd4ff63,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
      })
    );
    atticGlow.position.set(0, 4.26, 4.82);
    atticGroup.add(atticFloor, atticDoor, atticGlow);
    atticGroup.visible = false;

    const coinGeometry = new THREE.TorusGeometry(0.28, 0.075, 8, 20);
    const coinPositions = [
      [-5.2, 1.4, 2.2],
      [-3.5, 1.9, 2.6],
      [-1.8, 2.35, 3.1],
      [0, 2.7, 3.65],
      [1.9, 2.35, 4.1],
      [3.7, 1.95, 4.55],
      [5.2, 1.55, 5.05],
    ];
    const coins = coinPositions.map(([x, y, z], index) => {
      const coin = new THREE.Mesh(coinGeometry, materials.coin);
      coin.position.set(x, y, z);
      coin.rotation.y = Math.PI / 2;
      coin.userData.baseY = y;
      coin.userData.phase = index * 0.52;
      coinGroup.add(coin);
      return coin;
    });

    const starMesh = new THREE.Mesh(createStarGeometry(THREE), materials.star);
    starMesh.position.set(4.35, 4.9, -0.6);
    starMesh.scale.setScalar(0.72);
    scene.add(starMesh);

    const starHalo = new THREE.Mesh(
      new THREE.TorusGeometry(0.92, 0.025, 8, 40),
      new THREE.MeshBasicMaterial({
        color: 0xfff2a6,
        transparent: true,
        opacity: 0.38,
      })
    );
    starHalo.position.copy(starMesh.position);
    scene.add(starHalo);

    const playerShadow = new THREE.Mesh(new THREE.CircleGeometry(0.76, 24), materials.shadow);
    playerShadow.rotation.x = -Math.PI / 2;
    playerShadow.position.y = -0.1;
    const playerBody = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.46, 0.88, 16), materials.avatar);
    playerBody.position.y = 0.86;
    const playerHead = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 12), materials.avatar);
    playerHead.position.y = 1.68;
    const playerVisor = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.16, 0.08),
      new THREE.MeshStandardMaterial({
        color: 0x6ff7ff,
        emissive: 0x6ff7ff,
        emissiveIntensity: 0.44,
        roughness: 0.32,
      })
    );
    playerVisor.position.set(0, 1.74, 0.34);
    playerGroup.add(playerShadow, playerBody, playerHead, playerVisor);
    playerGroup.position.set(-2.35, 0.05, 6.6);

    const starPositions = new Float32Array(260 * 3);
    for (let index = 0; index < 260; index += 1) {
      const seed = index + 1;
      starPositions[index * 3] = Math.sin(seed * 12.9898) * 20;
      starPositions[index * 3 + 1] = 5 + Math.abs(Math.cos(seed * 78.233) * 16);
      starPositions[index * 3 + 2] = -18 + Math.sin(seed * 37.719) * 16;
    }
    const starsGeometry = new THREE.BufferGeometry();
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(
      starsGeometry,
      new THREE.PointsMaterial({
        color: 0xdffbff,
        size: 0.07,
        transparent: true,
        opacity: 0.72,
      })
    );
    scene.add(stars);

    function applyPalette(zoneKey) {
      const palette = palettes[zoneKey] || palettes.arrival;
      scene.fog.color.setHex(palette.fog);
      materials.ground.color.setHex(palette.ground);
      materials.platform.color.setHex(palette.platform);
      materials.platformEdge.color.setHex(palette.edge);
      materials.platformEdge.emissive.setHex(palette.edge);
      materials.roof.color.setHex(palette.roof);
      materials.roof.emissive.setHex(palette.roof);
      materials.portal.color.setHex(palette.portal);
      materials.portal.emissive.setHex(palette.edge);
      portalLight.color.setHex(palette.edge);
      starLight.color.setHex(palette.portal);
      stars.material.color.setHex(zoneKey === 'secret' ? 0xe9d5ff : 0xdffbff);
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    function setZone(zoneKey, immediate = false) {
      const profile = cameraProfiles[zoneKey] || cameraProfiles.arrival;
      state.activeZone = zoneKey;
      state.targetCameraPosition.copy(profile.position);
      state.targetLookAt.copy(profile.lookAt);
      state.targetWorldRotation = profile.rotation;
      state.targetPortalScale = profile.portalScale;
      atticGroup.visible = zoneKey === 'secret';
      portalGroup.visible = zoneKey === 'secret' || zoneKey === 'rooftop' || state.starCollected;
      portalCore.material.opacity = zoneKey === 'secret' ? 0.38 : 0.2;
      applyPalette(zoneKey);

      if (immediate) {
        camera.position.copy(state.targetCameraPosition);
        state.currentLookAt.copy(state.targetLookAt);
        world.rotation.y = state.targetWorldRotation;
        camera.lookAt(state.currentLookAt);
      }

      state.pulse = Math.max(state.pulse, 0.55);
    }

    function collectStar() {
      state.starCollected = true;
      starMesh.visible = false;
      starHalo.visible = false;
      portalGroup.visible = true;
      state.pulse = 1.15;
    }

    function pulse(amount = 0.75) {
      state.pulse = Math.max(state.pulse, amount);
    }

    function animate(now = 0) {
      if (!state.active) {
        return;
      }

      const time = now * 0.001;
      const motionScale = prefersReducedMotion ? 0.25 : 1;
      const cameraLerp = prefersReducedMotion ? 0.16 : 0.055;
      const lookLerp = prefersReducedMotion ? 0.18 : 0.075;
      const pulseScale = 1 + state.pulse * 0.08;

      camera.position.lerp(state.targetCameraPosition, cameraLerp);
      state.currentLookAt.lerp(state.targetLookAt, lookLerp);
      camera.lookAt(state.currentLookAt);
      world.rotation.y += (state.targetWorldRotation - world.rotation.y) * 0.055;
      world.position.y = Math.sin(time * 1.15) * 0.08 * motionScale + state.pulse * 0.08;

      platformGroup.children.forEach((child, index) => {
        if (Number.isFinite(child.userData.baseY)) {
          child.position.y = child.userData.baseY + Math.sin(time * 1.1 + index * 0.72) * 0.045 * motionScale;
        }
      });

      coins.forEach((coin) => {
        coin.rotation.y = time * 2.9 + coin.userData.phase;
        coin.rotation.z = Math.sin(time * 1.2 + coin.userData.phase) * 0.18;
        coin.position.y = coin.userData.baseY + Math.sin(time * 2 + coin.userData.phase) * 0.18 * motionScale;
      });

      if (starMesh.visible) {
        starMesh.rotation.y = time * 1.8;
        starMesh.rotation.z = Math.sin(time * 1.6) * 0.22;
        starMesh.position.y = 4.9 + Math.sin(time * 2.2) * 0.24 * motionScale;
        starHalo.position.copy(starMesh.position);
        starHalo.rotation.z = time * 0.9;
        starHalo.scale.setScalar(1 + Math.sin(time * 2.1) * 0.08);
        starLight.position.copy(starMesh.position);
      }

      portalRing.rotation.z = time * 0.72;
      portalCore.rotation.z = -time * 0.5;
      portalGroup.scale.setScalar(state.targetPortalScale * pulseScale);
      portalLight.intensity = 2.6 + Math.sin(time * 2.4) * 0.35 + state.pulse * 1.2;

      playerGroup.position.x = -2.35 + Math.sin(time * 0.82) * 0.58 * motionScale;
      playerGroup.position.y = 0.05 + Math.sin(time * 1.65) * 0.08 * motionScale;
      playerGroup.rotation.y = Math.sin(time * 0.72) * 0.42;

      flag.rotation.y = Math.sin(time * 3.2) * 0.28;
      atticGlow.material.opacity = state.activeZone === 'secret' ? 0.3 + Math.sin(time * 2.5) * 0.08 : 0.2;
      state.pulse *= 0.93;

      renderer.render(scene, camera);
      state.rafId = window.requestAnimationFrame(animate);
    }

    resize();
    setZone('arrival', true);

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(resize);
      observer.observe(canvas);
    } else {
      window.addEventListener('resize', resize);
    }

    state.rafId = window.requestAnimationFrame(animate);

    return {
      setZone,
      collectStar,
      pulse,
    };
  }

  function bootThreeWorld() {
    if (!threeCanvas) {
      return;
    }

    frame.classList.add('world-three-loading');

    loadThreeLibrary()
      .then((THREE) => {
        if (!THREE) {
          frame.classList.remove('world-three-loading');
          frame.classList.add('world-three-unavailable');
          return;
        }

        threeWorld = createThreeWorld(THREE, threeCanvas);

        if (!threeWorld) {
          frame.classList.remove('world-three-loading');
          frame.classList.add('world-three-unavailable');
          return;
        }

        frame.classList.remove('world-three-loading', 'world-three-unavailable');
        frame.classList.add('world-three-active');
        threeWorld.setZone(activeZone, true);
      })
      .catch(() => {
        frame.classList.remove('world-three-loading');
        frame.classList.add('world-three-unavailable');
      });
  }

  function bootFallbackWorld() {
    if (!fallbackCanvas) {
      return;
    }

    fallbackWorld = createCanvasFallbackWorld(fallbackCanvas);

    if (!fallbackWorld) {
      return;
    }

    frame.classList.add('world-canvas-active');
    fallbackWorld.setZone(activeZone);
  }

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
    setGameLevel(zoneKey);
    frame.dataset.zone = zoneKey;
    zoneDetail.dataset.zone = zoneKey;
    zoneDetail.classList.toggle('is-secret', zoneKey === 'secret');
    motion.ambientEnabled = !prefersReducedMotion && zoneKey !== 'secret';
    updateCameraProfile(zone);
    if (fallbackWorld) {
      fallbackWorld.setZone(zoneKey);
    }
    if (threeWorld) {
      threeWorld.setZone(zoneKey);
    }
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
    if (worldMobileHint) {
      worldMobileHint.hidden = zoneKey === 'secret';
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
    if (snapTransitionTimer) {
      window.clearTimeout(snapTransitionTimer);
      snapTransitionTimer = 0;
    }

    frame.classList.remove('is-landing', 'is-warping');
    window.requestAnimationFrame(() => {
      frame.classList.add('is-landing', 'is-warping', 'is-snapping');
      if (fallbackWorld) {
        fallbackWorld.pulse(0.7);
      }
      if (threeWorld) {
        threeWorld.pulse(0.7);
      }
      warpTransitionTimer = window.setTimeout(() => {
        frame.classList.remove('is-landing', 'is-warping');
        warpTransitionTimer = 0;
      }, 340);
      snapTransitionTimer = window.setTimeout(() => {
        frame.classList.remove('is-snapping');
        snapTransitionTimer = 0;
      }, 180);
    });

    if (motionState) {
      motionState.textContent = `Entering ${zone.room}.`;
    }

    if (zoneKey === 'secret') {
      resetFrameMotion(true);
    } else {
      queueMotionFrame();
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
    if (fallbackWorld) {
      fallbackWorld.collectStar();
    }
    if (threeWorld) {
      threeWorld.collectStar();
    }

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

  function handleProjectsWarp(event) {
    const target = event.currentTarget;

    if (event.type === 'pointerdown' && event.button !== 0) {
      return;
    }

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();

    if (projectsWarping) {
      return;
    }

    projectsWarping = true;
    frame.classList.add('is-warping');
    if (fallbackWorld) {
      fallbackWorld.pulse(1.2);
    }
    if (threeWorld) {
      threeWorld.pulse(1.2);
    }
    if (motionState) {
      motionState.textContent = 'Warping to the Builder Pass.';
    }

    window.setTimeout(() => {
      window.location.href = target.href || WORLD_PRIZE_URL;
    }, event.type === 'pointerdown' ? 90 : 260);
  }

  if (secretPortalButton) {
    secretPortalButton.addEventListener('click', handleProjectsWarp);
  }

  if (secretCalloutLink) {
    secretCalloutLink.addEventListener('pointerdown', handleProjectsWarp);
    secretCalloutLink.addEventListener('click', handleProjectsWarp);
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

  if (gameStartButton) {
    gameStartButton.addEventListener('click', startGame);
  }

  if (gameResetButton) {
    gameResetButton.addEventListener('click', resetActiveGameLevel);
  }

  gameControlButtons.forEach((button) => {
    const control = button.dataset.gameControl;

    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      startGame();
      setGameControl(control, true);
      button.setPointerCapture?.(event.pointerId);
    });
    button.addEventListener('pointerup', () => setGameControl(control, false));
    button.addEventListener('pointercancel', () => setGameControl(control, false));
    button.addEventListener('lostpointercapture', () => setGameControl(control, false));
  });

  window.addEventListener('keydown', (event) => {
    const keyMap = {
      ArrowLeft: 'left',
      a: 'left',
      A: 'left',
      ArrowRight: 'right',
      d: 'right',
      D: 'right',
      ArrowUp: 'up',
      w: 'up',
      W: 'up',
      ArrowDown: 'down',
      s: 'down',
      S: 'down',
      ' ': 'boost',
      Shift: 'boost',
    };
    const control = keyMap[event.key];

    if (!control) {
      return;
    }

    event.preventDefault();
    startGame();
    setGameControl(control, true);
  });

  window.addEventListener('keyup', (event) => {
    const keyMap = {
      ArrowLeft: 'left',
      a: 'left',
      A: 'left',
      ArrowRight: 'right',
      d: 'right',
      D: 'right',
      ArrowUp: 'up',
      w: 'up',
      W: 'up',
      ArrowDown: 'down',
      s: 'down',
      S: 'down',
      ' ': 'boost',
      Shift: 'boost',
    };
    const control = keyMap[event.key];

    if (control) {
      setGameControl(control, false);
    }
  });

  window.__3dvrWorldGame = {
    start: startGame,
    resetLevel: resetActiveGameLevel,
    completeLevel: completeActiveGameLevel,
    state: worldGame,
  };

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

  bootFallbackWorld();
  bootThreeWorld();
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
