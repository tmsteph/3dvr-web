(function () {
  const THREE_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  const FONT_LOADER_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/js/loaders/FontLoader.js';
  const COIN_FONT_URL = 'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json';

  const IDLE_QUARTER_SPIN_SPEED = (Math.PI * 2) / 18000;
  const IDLE_WOBBLE_X = 0.025;
  const IDLE_WOBBLE_Z = 0.012;
  const DRAG_SPIN_FACTOR = 0.018;
  const DRAG_VERTICAL_SPIN_FACTOR = 0.034;
  const MAX_SPIN_MOMENTUM = 0.014;
  const MAX_VERTICAL_SPIN_MOMENTUM = 0.032;
  const MIN_SPIN_MOMENTUM = 0.00008;
  const SPIN_MOMENTUM_DECAY = 0.992;
  const VERTICAL_SPIN_MOMENTUM_DECAY = 0.986;
  const ACTIVE_FRONT_FLIP_TARGET_RETURN = 0.018;
  const FRONT_FLIP_SETTLE_VELOCITY = 0.0012;
  const MANUAL_X_TARGET_RETURN = 0.14;
  const MANUAL_X_CURRENT_RETURN = 0.24;
  const MANUAL_TARGET_RETURN = 0.1;
  const MANUAL_CURRENT_RETURN = 0.18;
  const FULL_TURN = Math.PI * 2;

  const COMBO_WINDOW_MS = 2300;
  const COMBO_POWERUP_AT = 5;
  const MAGIC_LIFETIME_MS = 760;
  const MAX_MAGIC_PARTICLES = 30;

  const GOLD = {
    white: '#fffbd5',
    highlight: '#fff59b',
    light: '#ffe252',
    mid: '#ffc928',
    rich: '#f4ad08',
    deep: '#c87a00',
    shadow: '#7d4300'
  };

  const root = document.querySelector('[data-3dvr-token]');
  const canvas = document.querySelector('[data-3dvr-token-canvas]');
  if (!root || !canvas) return;

  const state = {
    dragging: false,
    pointerMoved: false,
    lastX: 0,
    lastY: 0,
    dragStartX: 0,
    dragStartY: 0,
    dragStartedAt: 0,
    targetX: 0,
    targetY: 0,
    targetZ: 0,
    currentX: 0,
    currentY: 0,
    currentZ: 0,
    restX: 0,
    restY: 0,
    restZ: 0,
    idleSpin: 0,
    spinVelocityX: 0,
    spinVelocityY: 0,
    lastTimestamp: 0,
    lastDragTimestamp: 0,
    renderer: null,
    fallbackContext: null,
    camera: null,
    scene: null,
    token: null,
    frame: 0,
    interactionsReady: false,
    comboCount: 0,
    lastMagicAt: 0,
    magicLayer: null,
    halo: null,
    glint: null,
    currentScale: 1,
    targetScale: 1
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function nearestFullTurn(value) {
    return Math.round(value / FULL_TURN) * FULL_TURN;
  }

  function settleFrontFlipAxis() {
    if (state.dragging || Math.abs(state.spinVelocityX) >= FRONT_FLIP_SETTLE_VELOCITY) return;
    if (Math.abs(state.spinVelocityX) < FRONT_FLIP_SETTLE_VELOCITY) {
      state.spinVelocityX = 0;
    }

    if (Math.abs(state.currentX) < FULL_TURN && Math.abs(state.targetX) < FULL_TURN) return;

    const turnOffset = nearestFullTurn(state.currentX);
    state.currentX -= turnOffset;
    state.targetX = nearestFullTurn(state.currentX);
  }

  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = THREE_CDN_URL;
      script.async = true;
      script.onload = () => resolve(window.THREE);
      script.onerror = () => reject(new Error('Unable to load Three.js.'));
      document.head.appendChild(script);
    });
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Unable to load ${src}.`));
      document.head.appendChild(script);
    });
  }

  async function loadCoinFont(THREE) {
    if (!THREE.FontLoader) await loadScript(FONT_LOADER_CDN_URL);
    return new Promise((resolve, reject) => {
      new THREE.FontLoader().load(COIN_FONT_URL, resolve, undefined, reject);
    });
  }

  function makeFaceTexture(THREE) {
    const textureCanvas = document.createElement('canvas');
    const size = 1024;
    const center = size / 2;
    const radius = size * 0.48;
    textureCanvas.width = size;
    textureCanvas.height = size;
    const context = textureCanvas.getContext('2d');

    const gradient = context.createRadialGradient(
      size * 0.29,
      size * 0.2,
      24,
      size * 0.5,
      size * 0.5,
      size * 0.69
    );
    gradient.addColorStop(0, GOLD.white);
    gradient.addColorStop(0.15, GOLD.highlight);
    gradient.addColorStop(0.4, GOLD.light);
    gradient.addColorStop(0.7, GOLD.mid);
    gradient.addColorStop(0.9, GOLD.rich);
    gradient.addColorStop(1, GOLD.deep);

    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    context.save();
    context.translate(center, center);

    // Fine sunburst engraving gives the face a minted, regal finish.
    for (let ray = 0; ray < 96; ray += 1) {
      const angle = (ray / 96) * FULL_TURN;
      context.beginPath();
      context.moveTo(
        Math.cos(angle) * radius * 0.44,
        Math.sin(angle) * radius * 0.44
      );
      context.lineTo(
        Math.cos(angle) * radius * 0.87,
        Math.sin(angle) * radius * 0.87
      );
      context.strokeStyle = ray % 2
        ? 'rgba(255,255,230,0.055)'
        : 'rgba(112,58,0,0.035)';
      context.lineWidth = 4;
      context.stroke();
    }

    const sweep = context.createLinearGradient(
      -radius * 0.8,
      -radius * 0.8,
      radius * 0.8,
      radius * 0.8
    );
    sweep.addColorStop(0.25, 'rgba(255,255,255,0)');
    sweep.addColorStop(0.43, 'rgba(255,255,230,0.12)');
    sweep.addColorStop(0.52, 'rgba(255,255,245,0.34)');
    sweep.addColorStop(0.61, 'rgba(255,255,230,0.08)');
    sweep.addColorStop(0.76, 'rgba(255,255,255,0)');
    context.fillStyle = sweep;
    context.beginPath();
    context.arc(0, 0, radius * 0.91, 0, FULL_TURN);
    context.fill();

    context.beginPath();
    context.arc(0, 0, radius * 0.9, 0, FULL_TURN);
    context.strokeStyle = 'rgba(255,252,206,0.95)';
    context.lineWidth = 26;
    context.stroke();

    context.beginPath();
    context.arc(0, 0, radius * 0.79, 0, FULL_TURN);
    context.strokeStyle = 'rgba(178,105,0,0.34)';
    context.lineWidth = 9;
    context.stroke();

    context.beginPath();
    context.arc(0, 0, radius * 0.72, 0, FULL_TURN);
    context.strokeStyle = 'rgba(255,239,133,0.46)';
    context.lineWidth = 6;
    context.stroke();

    context.restore();

    // The lettering is actual extruded geometry in makeCoinLettering; keep the face
    // texture clean so it cannot flatten the relief with a second printed copy.

    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  }

  function resizeRenderer() {
    const rect = root.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));

    if (state.fallbackContext && !state.renderer) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      return;
    }

    if (!state.renderer || !state.camera) return;
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    state.renderer.setSize(width, height, false);
    state.camera.aspect = width / height;
    state.camera.updateProjectionMatrix();
  }

  function makeCoinLettering(THREE, font) {
    const shapes = font.generateShapes('3dvr', 0.52);
    const geometry = new THREE.ExtrudeGeometry(shapes, {
      depth: 0.07,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSize: 0.018,
      bevelThickness: 0.018,
      curveSegments: 10,
      steps: 1
    });
    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox;
    geometry.translate(
      -(bounds.max.x + bounds.min.x) / 2,
      -(bounds.max.y + bounds.min.y) / 2,
      0
    );

    const faceMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xfff078,
      metalness: 0.96,
      roughness: 0.12,
      clearcoat: 0.55,
      clearcoatRoughness: 0.09
    });
    const edgeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd98900,
      metalness: 0.94,
      roughness: 0.17,
      clearcoat: 0.35,
      clearcoatRoughness: 0.12
    });

    const lettering = new THREE.Group();
    const front = new THREE.Mesh(geometry, [faceMaterial, edgeMaterial]);
    front.position.z = 0.055;
    lettering.add(front);

    const back = new THREE.Mesh(geometry.clone(), [faceMaterial, edgeMaterial]);
    back.rotation.y = Math.PI;
    back.position.z = -0.055;
    lettering.add(back);
    return lettering;
  }

  function makeToken(THREE, font) {
    const group = new THREE.Group();
    const faceTexture = makeFaceTexture(THREE);
    const backTexture = makeFaceTexture(THREE);

    const sideMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe5a10b,
      metalness: 0.96,
      roughness: 0.16,
      clearcoat: 0.4,
      clearcoatRoughness: 0.12
    });
    const frontMaterial = new THREE.MeshPhysicalMaterial({
      map: faceTexture,
      metalness: 0.88,
      roughness: 0.16,
      clearcoat: 0.6,
      clearcoatRoughness: 0.08
    });
    const backMaterial = new THREE.MeshPhysicalMaterial({
      map: backTexture,
      metalness: 0.9,
      roughness: 0.17,
      clearcoat: 0.6,
      clearcoatRoughness: 0.08
    });

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(1.45, 1.45, 0.11, 128, 1, false),
      [sideMaterial, frontMaterial, backMaterial]
    );
    body.rotation.x = Math.PI / 2;
    group.add(body);

    const rimMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffdb3d,
      metalness: 0.99,
      roughness: 0.09,
      clearcoat: 0.72,
      clearcoatRoughness: 0.06
    });
    const frontRim = new THREE.Mesh(
      new THREE.TorusGeometry(1.47, 0.046, 16, 128),
      rimMaterial
    );
    frontRim.position.z = 0.061;
    group.add(frontRim);

    const backRim = frontRim.clone();
    backRim.position.z = -0.061;
    group.add(backRim);

    // Two restrained outer beads add minted detail without bringing back the inner ring.
    const beadMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffc928,
      metalness: 0.97,
      roughness: 0.12,
      clearcoat: 0.45,
      clearcoatRoughness: 0.08
    });
    [1.18, 0.98].forEach((radius, index) => {
      const bead = new THREE.Mesh(
        new THREE.TorusGeometry(radius, index === 0 ? 0.014 : 0.01, 10, 128),
        beadMaterial
      );
      bead.position.z = 0.061 + index * 0.001;
      group.add(bead);

      const backBead = bead.clone();
      backBead.position.z = -0.061 - index * 0.001;
      group.add(backBead);
    });

    const studMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffe566,
      metalness: 0.98,
      roughness: 0.1,
      clearcoat: 0.6,
      clearcoatRoughness: 0.06
    });
    for (let index = 0; index < 12; index += 1) {
      const angle = (index / 12) * FULL_TURN;
      const stud = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 12, 10),
        studMaterial
      );
      stud.position.set(Math.cos(angle) * 1.31, Math.sin(angle) * 1.31, 0.072);
      group.add(stud);

      const backStud = stud.clone();
      backStud.position.z = -0.072;
      group.add(backStud);
    }

    group.add(makeCoinLettering(THREE, font));

    const ridges = new THREE.Group();
    const ridgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xd18600,
      metalness: 0.95,
      roughness: 0.2
    });
    for (let index = 0; index < 96; index += 1) {
      const angle = (index / 96) * Math.PI * 2;
      const ridge = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.18, 0.014),
        ridgeMaterial
      );
      ridge.position.set(Math.cos(angle) * 1.458, 0, Math.sin(angle) * 1.458);
      ridge.rotation.y = angle;
      ridges.add(ridge);
    }
    ridges.rotation.x = Math.PI / 2;
    group.add(ridges);

    return group;
  }

  function ensureMagicLayer() {
    if (state.magicLayer) return state.magicLayer;
    const layer = document.createElement('span');
    layer.setAttribute('aria-hidden', 'true');
    Object.assign(layer.style, {
      position: 'absolute',
      inset: '-22%',
      overflow: 'visible',
      pointerEvents: 'none',
      zIndex: '4'
    });
    root.style.position = 'relative';
    root.style.overflow = 'visible';
    root.appendChild(layer);
    state.magicLayer = layer;
    return layer;
  }

  function ensureHalo() {
    if (state.halo) return state.halo;
    const halo = document.createElement('span');
    halo.setAttribute('aria-hidden', 'true');
    Object.assign(halo.style, {
      position: 'absolute',
      inset: '8%',
      borderRadius: '50%',
      border: '2px solid rgba(255, 236, 124, 0.78)',
      boxShadow:
        '0 0 22px rgba(255, 199, 40, 0.35), inset 0 0 16px rgba(255, 246, 184, 0.25)',
      opacity: '0',
      transform: 'scale(0.82)',
      transition:
        'transform 430ms cubic-bezier(.16,1,.3,1), opacity 430ms ease-out',
      pointerEvents: 'none',
      zIndex: '1'
    });
    root.appendChild(halo);
    state.halo = halo;
    return halo;
  }

  function pulseHalo(strength = 1) {
    const halo = ensureHalo();
    halo.style.transition = 'none';
    halo.style.opacity = String(clamp(0.28 + strength * 0.18, 0, 0.88));
    halo.style.transform = `scale(${0.82 + strength * 0.06})`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        halo.style.transition =
          'transform 430ms cubic-bezier(.16,1,.3,1), opacity 430ms ease-out';
        halo.style.opacity = '0';
        halo.style.transform = `scale(${1.28 + strength * 0.08})`;
      });
    });
  }

  function spawnMagic(count = 7, intensity = 1, stars = false) {
    const layer = ensureMagicLayer();
    const rect = root.getBoundingClientRect();
    const size = Math.max(2, Math.min(rect.width, rect.height));
    const total = Math.min(count, MAX_MAGIC_PARTICLES);

    for (let index = 0; index < total; index += 1) {
      const particle = document.createElement('span');
      const angle = Math.random() * FULL_TURN;
      const distance = size * (0.22 + Math.random() * 0.4) * intensity;
      const dotSize = 2.5 + Math.random() * 4.5 * intensity;
      const lifetime = MAGIC_LIFETIME_MS + Math.random() * 220;
      const isStar = stars && index % 3 === 0;

      particle.textContent = isStar ? '✦' : '';
      Object.assign(particle.style, {
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: isStar ? 'auto' : `${dotSize}px`,
        height: isStar ? 'auto' : `${dotSize}px`,
        borderRadius: '999px',
        background: isStar ? 'transparent' : GOLD.light,
        color: GOLD.white,
        fontSize: `${9 + dotSize * 1.8}px`,
        lineHeight: '1',
        textShadow: '0 0 9px rgba(255, 211, 45, 0.95)',
        boxShadow: isStar
          ? 'none'
          : `0 0 ${10 + dotSize * 2}px rgba(255, 188, 20, 0.95)`,
        opacity: '0.98',
        transform: 'translate(-50%, -50%) scale(0.75) rotate(0deg)',
        transition:
          `transform ${lifetime}ms cubic-bezier(.16,1,.3,1), opacity ${lifetime}ms ease-out`
      });

      layer.appendChild(particle);
      requestAnimationFrame(() => {
        particle.style.transform =
          `translate(calc(-50% + ${Math.cos(angle) * distance}px), ` +
          `calc(-50% + ${Math.sin(angle) * distance}px)) ` +
          `scale(0.12) rotate(${120 + Math.random() * 260}deg)`;
        particle.style.opacity = '0';
      });
      setTimeout(() => particle.remove(), lifetime + 100);
    }
  }

  function emitCoinEvent(type, detail = {}) {
    const payload = {
      type,
      combo: state.comboCount,
      ...detail
    };
    root.dispatchEvent(
      new CustomEvent('3dvr:coin-interact', {
        bubbles: true,
        detail: payload
      })
    );
    window.dispatchEvent(
      new CustomEvent(`3dvr:coin-${type}`, {
        detail: payload
      })
    );
  }

  function getDirection(dx, dy) {
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return '';
    if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
    return dy >= 0 ? 'down' : 'up';
  }

  function stimulateTap() {
    const timestamp = performance.now();
    state.comboCount =
      timestamp - state.lastMagicAt < COMBO_WINDOW_MS
        ? Math.min(state.comboCount + 1, 8)
        : 1;
    state.lastMagicAt = timestamp;

    const comboBoost = 1 + Math.max(0, state.comboCount - 1) * 0.14;
    state.spinVelocityY = clamp(
      state.spinVelocityY + 0.0045 * comboBoost,
      -MAX_SPIN_MOMENTUM,
      MAX_SPIN_MOMENTUM
    );
    state.targetScale = 1.04 + Math.min(state.comboCount, 5) * 0.012;

    spawnMagic(5 + state.comboCount * 2, 0.7 + state.comboCount * 0.07, state.comboCount >= 3);
    pulseHalo(0.65 + state.comboCount * 0.12);
    emitCoinEvent('tap', { count: state.comboCount });

    if (state.comboCount === 3) {
      state.spinVelocityX = clamp(
        state.spinVelocityX - 0.008,
        -MAX_VERTICAL_SPIN_MOMENTUM,
        MAX_VERTICAL_SPIN_MOMENTUM
      );
      emitCoinEvent('combo', { milestone: 3 });
    }

    if (state.comboCount === COMBO_POWERUP_AT) {
      state.targetScale = 1.12;
      state.spinVelocityY = clamp(
        state.spinVelocityY + 0.009,
        -MAX_SPIN_MOMENTUM,
        MAX_SPIN_MOMENTUM
      );
      state.spinVelocityX = clamp(
        state.spinVelocityX - 0.012,
        -MAX_VERTICAL_SPIN_MOMENTUM,
        MAX_VERTICAL_SPIN_MOMENTUM
      );
      spawnMagic(28, 1.18, true);
      pulseHalo(1.65);
      root.dataset.coinPowerup = 'true';
      setTimeout(() => {
        root.dataset.coinPowerup = 'false';
      }, 900);
      emitCoinEvent('powerup', {
        milestone: COMBO_POWERUP_AT,
        charged: true
      });
    }
  }

  function updateIdleSpin(timestamp) {
    if (!state.lastTimestamp) {
      state.lastTimestamp = timestamp;
      return;
    }

    const elapsed = Math.min(timestamp - state.lastTimestamp, 64);
    state.lastTimestamp = timestamp;

    if (state.dragging) return;

    state.idleSpin += elapsed * (IDLE_QUARTER_SPIN_SPEED + state.spinVelocityY);
    if (state.spinVelocityY !== 0) {
      state.spinVelocityY *= Math.pow(SPIN_MOMENTUM_DECAY, elapsed / 16.67);
      if (Math.abs(state.spinVelocityY) < MIN_SPIN_MOMENTUM) {
        state.spinVelocityY = 0;
      }
    }

    if (state.spinVelocityX !== 0) {
      state.targetX += elapsed * state.spinVelocityX;
      state.spinVelocityX *= Math.pow(
        VERTICAL_SPIN_MOMENTUM_DECAY,
        elapsed / 16.67
      );
      if (Math.abs(state.spinVelocityX) < MIN_SPIN_MOMENTUM) {
        state.spinVelocityX = 0;
      }
    }
  }

  function getRenderRotation() {
    const wobbleX = Math.sin(state.idleSpin * 1.6) * IDLE_WOBBLE_X;
    const wobbleZ = Math.sin(state.idleSpin * 0.75) * IDLE_WOBBLE_Z;

    return {
      x: state.currentX + wobbleX,
      y: state.currentY + state.idleSpin,
      z: state.currentZ + wobbleZ,
      wobbleX,
      wobbleZ
    };
  }

  function animate(timestamp = 0) {
    state.frame = window.requestAnimationFrame(animate);
    updateIdleSpin(timestamp);

    if (!state.dragging) {
      settleFrontFlipAxis();
      const xTargetReturn =
        Math.abs(state.spinVelocityX) >= FRONT_FLIP_SETTLE_VELOCITY
          ? ACTIVE_FRONT_FLIP_TARGET_RETURN
          : MANUAL_X_TARGET_RETURN;
      state.targetX += (state.restX - state.targetX) * xTargetReturn;
      state.targetY += (state.restY - state.targetY) * MANUAL_TARGET_RETURN;
      state.targetZ += (state.restZ - state.targetZ) * MANUAL_TARGET_RETURN;
      state.targetScale += (1 - state.targetScale) * 0.08;
    }

    state.currentX +=
      (state.targetX - state.currentX) * MANUAL_X_CURRENT_RETURN;
    state.currentY +=
      (state.targetY - state.currentY) * MANUAL_CURRENT_RETURN;
    state.currentZ +=
      (state.targetZ - state.currentZ) * MANUAL_CURRENT_RETURN;
    state.currentScale += (state.targetScale - state.currentScale) * 0.16;

    if (
      state.comboCount &&
      performance.now() - state.lastMagicAt > COMBO_WINDOW_MS
    ) {
      state.comboCount = 0;
    }

    if (state.token && state.renderer && state.scene && state.camera) {
      const rotation = getRenderRotation();
      state.token.rotation.set(rotation.x, rotation.y, rotation.z);
      state.token.scale.setScalar(state.currentScale);
      state.renderer.render(state.scene, state.camera);
      return;
    }

    if (state.fallbackContext) drawFallbackToken();
  }

  function startDrag(event) {
    state.dragging = true;
    state.pointerMoved = false;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    state.dragStartX = event.clientX;
    state.dragStartY = event.clientY;
    state.dragStartedAt = event.timeStamp || performance.now();
    state.lastDragTimestamp = event.timeStamp || performance.now();
    state.spinVelocityX = 0;
    state.spinVelocityY = 0;
    root.setPointerCapture?.(event.pointerId);
  }

  function drag(event) {
    if (!state.dragging) return;

    const dx = event.clientX - state.lastX;
    const dy = event.clientY - state.lastY;
    const timestamp = event.timeStamp || performance.now();
    const elapsed = Math.max(
      16,
      Math.min(timestamp - state.lastDragTimestamp, 80)
    );
    const spinDelta = dx * DRAG_SPIN_FACTOR;
    const verticalIntent =
      Math.abs(dy) / Math.max(Math.abs(dx), Math.abs(dy), 1);
    const verticalSpinDelta =
      dy * DRAG_VERTICAL_SPIN_FACTOR * verticalIntent;

    if (Math.hypot(
      event.clientX - state.dragStartX,
      event.clientY - state.dragStartY
    ) > 5) {
      state.pointerMoved = true;
    }

    state.lastX = event.clientX;
    state.lastY = event.clientY;
    state.lastDragTimestamp = timestamp;
    state.idleSpin += spinDelta;
    state.targetX += verticalSpinDelta;
    state.spinVelocityX = clamp(
      state.spinVelocityX * 0.35 + (verticalSpinDelta / elapsed) * 0.65,
      -MAX_VERTICAL_SPIN_MOMENTUM,
      MAX_VERTICAL_SPIN_MOMENTUM
    );
    state.spinVelocityY = clamp(
      state.spinVelocityY * 0.35 + (spinDelta / elapsed) * 0.65,
      -MAX_SPIN_MOMENTUM,
      MAX_SPIN_MOMENTUM
    );
    state.targetY += spinDelta * 0.18;
    state.targetZ += (dx - dy) * 0.0015;
  }

  function endDrag(event = {}) {
    if (!state.dragging) return;
    state.dragging = false;
    root.releasePointerCapture?.(event.pointerId);

    const endX = Number(event.clientX ?? state.lastX);
    const endY = Number(event.clientY ?? state.lastY);
    const dx = endX - state.dragStartX;
    const dy = endY - state.dragStartY;
    const distance = Math.hypot(dx, dy);
    const duration =
      (event.timeStamp || performance.now()) - state.dragStartedAt;

    if (!state.pointerMoved && distance < 7 && duration <= 320) {
      stimulateTap();
      return;
    }

    if (distance >= 18) {
      const strength = clamp(distance / 140, 0.35, 1.4);
      spawnMagic(5 + Math.round(strength * 5), 0.7 + strength * 0.15, false);
      emitCoinEvent('spin', {
        direction: getDirection(dx, dy),
        distance: Math.round(distance),
        strength: Number(strength.toFixed(2))
      });
    }
  }

  function setupKeyboard() {
    root.addEventListener('keydown', event => {
      const step = 0.22;
      if (event.key === 'ArrowLeft') state.targetY -= step;
      else if (event.key === 'ArrowRight') state.targetY += step;
      else if (event.key === 'ArrowUp') state.targetX -= step;
      else if (event.key === 'ArrowDown') state.targetX += step;
      else if (event.key === 'Enter' || event.key === ' ') {
        stimulateTap();
      } else return;

      event.preventDefault();
    });

    root.addEventListener('keyup', () => {
      state.targetX = state.restX;
      state.targetY = state.restY;
      state.targetZ = state.restZ;
    });
  }

  function setupInteraction() {
    if (state.interactionsReady) return;
    state.interactionsReady = true;
    window.addEventListener('resize', resizeRenderer);
    root.addEventListener('pointerdown', startDrag);
    root.addEventListener('pointermove', drag);
    root.addEventListener('pointerup', endDrag);
    root.addEventListener('pointercancel', endDrag);
    root.addEventListener('lostpointercapture', endDrag);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    window.addEventListener('mouseup', () => {
      state.dragging = false;
    });
    setupKeyboard();
  }

  function drawFallbackToken() {
    const context = state.fallbackContext;
    if (!context) return;

    const width = canvas.width;
    const height = canvas.height;
    const size = Math.min(width, height);
    const centerX = width / 2;
    const centerY = height / 2;
    const rotation = getRenderRotation();
    const tiltX = Math.sin(rotation.x) * 0.22;
    const tiltY = Math.sin(rotation.y) * 0.28;
    const scaleX =
      Math.max(0.18, Math.abs(Math.cos(rotation.y)) * 0.82 + 0.18) *
      state.currentScale;
    const scaleY =
      Math.max(0.5, Math.cos(rotation.x) * 0.18 + 0.78) *
      state.currentScale;
    const radius = size * 0.34;

    context.clearRect(0, 0, width, height);
    context.save();
    context.translate(centerX, centerY);
    context.rotate(rotation.z);
    context.scale(scaleX, scaleY);

    const sideGradient = context.createLinearGradient(
      -radius,
      -radius,
      radius,
      radius
    );
    sideGradient.addColorStop(0, GOLD.highlight);
    sideGradient.addColorStop(0.5, GOLD.rich);
    sideGradient.addColorStop(1, GOLD.deep);

    context.save();
    context.translate(
      tiltY * radius * 0.8,
      tiltX * radius * 0.8 + radius * 0.08
    );
    context.beginPath();
    context.ellipse(0, 0, radius * 1.04, radius * 1.04, 0, 0, FULL_TURN);
    context.fillStyle = sideGradient;
    context.shadowColor = 'rgba(0, 0, 0, 0.4)';
    context.shadowBlur = size * 0.075;
    context.shadowOffsetY = size * 0.032;
    context.fill();
    context.restore();

    const faceGradient = context.createRadialGradient(
      -radius * 0.3,
      -radius * 0.38,
      radius * 0.04,
      0,
      0,
      radius * 1.12
    );
    faceGradient.addColorStop(0, GOLD.white);
    faceGradient.addColorStop(0.18, GOLD.highlight);
    faceGradient.addColorStop(0.48, GOLD.light);
    faceGradient.addColorStop(0.75, GOLD.mid);
    faceGradient.addColorStop(0.94, GOLD.rich);
    faceGradient.addColorStop(1, GOLD.deep);

    context.beginPath();
    context.ellipse(0, 0, radius, radius, 0, 0, FULL_TURN);
    context.fillStyle = faceGradient;
    context.fill();

    context.lineWidth = Math.max(8, size * 0.025);
    context.strokeStyle = GOLD.white;
    context.stroke();

    context.save();
    context.globalAlpha = 0.86;
    context.lineWidth = Math.max(1, size * 0.004);
    for (let ridge = 0; ridge < 96; ridge += 1) {
      const angle = (ridge / 96) * Math.PI * 2;
      const innerX = Math.cos(angle) * radius * 1.01;
      const innerY = Math.sin(angle) * radius * 1.01;
      const outerX = Math.cos(angle) * radius * 1.045;
      const outerY = Math.sin(angle) * radius * 1.045;
      context.beginPath();
      context.moveTo(innerX, innerY);
      context.lineTo(outerX, outerY);
      context.strokeStyle = ridge % 2 ? GOLD.highlight : GOLD.rich;
      context.stroke();
    }
    context.restore();

    // Approximate the raised face for browsers that cannot create WebGL.
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font =
      `900 ${Math.floor(size * 0.18)}px Poppins, Inter, Arial, sans-serif`;
    context.fillStyle = GOLD.deep;
    [[0, size * 0.024], [size * 0.012, size * 0.012], [size * 0.006, 0]]
      .forEach(([x, y]) => {
        context.fillText('3dvr', x, y);
      });
    context.fillStyle = GOLD.white;
    context.fillText('3dvr', -size * 0.008, -size * 0.008);
    context.fillStyle = GOLD.rich;
    context.fillText('3dvr', 0, 0);

    context.restore();
  }

  function markReady(mode) {
    root.dataset.tokenReady = 'true';
    root.dataset.coinFinish = 'regal-gold';
    window.__3dvrLogoToken = {
      ready: true,
      mode,
      getRotation: () => {
        const rotation = getRenderRotation();
        return {
          x: rotation.x,
          y: rotation.y,
          z: rotation.z,
          manualX: state.currentX,
          manualY: state.currentY,
          manualZ: state.currentZ,
          idleSpin: state.idleSpin,
          spinVelocityX: state.spinVelocityX,
          spinVelocityY: state.spinVelocityY,
          wobbleX: rotation.wobbleX,
          wobbleZ: rotation.wobbleZ,
          targetX: state.targetX,
          targetY: state.targetY,
          targetZ: state.targetZ,
          comboCount: state.comboCount
        };
      }
    };
  }

  function initFallback(error) {
    console.warn('3dvr.tech token canvas fallback active:', error);
    state.fallbackContext = canvas.getContext('2d');
    if (!state.fallbackContext) {
      root.dataset.tokenReady = 'false';
      window.__3dvrLogoToken = { ready: false };
      return;
    }

    resizeRenderer();
    setupInteraction();
    markReady('canvas-fallback');
    animate();
  }

  async function init() {
    try {
      const THREE = await loadThree();
      const font = await loadCoinFont(THREE);
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });

      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.22;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(0, 0, 5);

      const token = makeToken(THREE, font);
      token.rotation.x = -0.06;
      token.rotation.y = 0.1;
      scene.add(token);

      scene.add(new THREE.HemisphereLight(0xfff9dd, 0x5f3500, 1.0));

      const key = new THREE.DirectionalLight(0xffffff, 2.0);
      key.position.set(2.7, 3.2, 4.8);
      scene.add(key);

      const fill = new THREE.DirectionalLight(0xffc857, 0.82);
      fill.position.set(-3, -1.5, 2.4);
      scene.add(fill);

      const rim = new THREE.DirectionalLight(0xc8efff, 0.55);
      rim.position.set(-2.7, 3.1, -2.5);
      scene.add(rim);

      const sparkle = new THREE.PointLight(0xffdf70, 0.7, 8);
      sparkle.position.set(0.9, -2.1, 3.4);
      scene.add(sparkle);

      state.renderer = renderer;
      state.scene = scene;
      state.camera = camera;
      state.token = token;

      resizeRenderer();
      setupInteraction();
      markReady('webgl');
      animate();
    } catch (error) {
      initFallback(error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
