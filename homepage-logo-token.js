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
  const QUICK_TAP_MAX_MS = 280;
  const TAP_MOVE_LIMIT = 10;
  const MAGIC_COMBO_WINDOW_MS = 2300;
  const MAGIC_COMBO_MAX = 8;
  const WORLD_READY_COMBO = 7;
  const SPARK_LIFETIME_MS = 760;
  const SPARK_BURST_MAX = 30;
  const root = document.querySelector('[data-3dvr-token]');
  const canvas = document.querySelector('[data-3dvr-token-canvas]');

  const GOLD = {
    highlight: '#fffbd6',
    light: '#ffe969',
    mid: '#ffc928',
    rich: '#f4ad0b',
    deep: '#d88900',
    shadow: '#9a5900',
    edge: '#e6a20a',
    ink: '#7d4700'
  };

  if (!root || !canvas) return;

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  const state = {
    dragging: false,
    pointerMoved: false,
    dragStartedAt: 0,
    gestureDX: 0,
    gestureDY: 0,
    lastX: 0,
    lastY: 0,
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
    lastMagicAt: 0,
    comboCount: 0,
    magicLevel: 0,
    renderer: null,
    fallbackContext: null,
    camera: null,
    scene: null,
    token: null,
    frame: 0,
    interactionsReady: false,
    magicLayer: null,
    halo: null
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
    textureCanvas.width = size;
    textureCanvas.height = size;
    const context = textureCanvas.getContext('2d');
    const center = size / 2;
    const radius = size * 0.47;
    const gradient = context.createRadialGradient(
      size * 0.3,
      size * 0.22,
      24,
      center,
      center,
      size * 0.68
    );
    gradient.addColorStop(0, GOLD.highlight);
    gradient.addColorStop(0.18, GOLD.light);
    gradient.addColorStop(0.5, GOLD.mid);
    gradient.addColorStop(0.79, GOLD.rich);
    gradient.addColorStop(1, GOLD.shadow);

    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    // Fine radial minting lines catch light without making the face look busy.
    context.save();
    context.translate(center, center);
    for (let index = 0; index < 96; index += 1) {
      const angle = (index / 96) * FULL_TURN;
      const inner = radius * 0.43;
      const outer = radius * 0.86;
      context.beginPath();
      context.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      context.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      context.strokeStyle = index % 2
        ? 'rgba(255, 250, 210, 0.045)'
        : 'rgba(142, 77, 0, 0.03)';
      context.lineWidth = 4;
      context.stroke();
    }
    context.restore();

    context.beginPath();
    context.arc(center, center, size * 0.414, 0, FULL_TURN);
    context.strokeStyle = GOLD.highlight;
    context.lineWidth = 28;
    context.stroke();

    context.beginPath();
    context.arc(center, center, size * 0.363, 0, FULL_TURN);
    context.strokeStyle = 'rgba(126, 70, 0, 0.27)';
    context.lineWidth = 9;
    context.stroke();

    // A subtle upper-left glint keeps the coin reading as polished yellow gold.
    const glint = context.createLinearGradient(size * 0.15, size * 0.12, size * 0.72, size * 0.72);
    glint.addColorStop(0, 'rgba(255, 255, 242, 0.32)');
    glint.addColorStop(0.24, 'rgba(255, 255, 225, 0.08)');
    glint.addColorStop(0.5, 'rgba(255, 255, 225, 0)');
    context.fillStyle = glint;
    context.fillRect(0, 0, size, size);

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
      canvas.width = Math.floor(width * Math.min(window.devicePixelRatio || 1, 2));
      canvas.height = Math.floor(height * Math.min(window.devicePixelRatio || 1, 2));
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
      bevelSegments: 3,
      bevelSize: 0.014,
      bevelThickness: 0.014,
      curveSegments: 8,
      steps: 1
    });
    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox;
    geometry.translate(
      -(bounds.max.x + bounds.min.x) / 2,
      -(bounds.max.y + bounds.min.y) / 2,
      0
    );

    const faceMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff0a0,
      metalness: 0.96,
      roughness: 0.1
    });
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xd68a00,
      metalness: 0.94,
      roughness: 0.15
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
    const sideMaterial = new THREE.MeshStandardMaterial({
      color: 0xe6a20a,
      metalness: 0.98,
      roughness: 0.12
    });
    const frontMaterial = new THREE.MeshStandardMaterial({
      map: faceTexture,
      color: 0xffffff,
      metalness: 0.9,
      roughness: 0.13
    });
    const backMaterial = new THREE.MeshStandardMaterial({
      map: backTexture,
      color: 0xffffff,
      metalness: 0.9,
      roughness: 0.14
    });

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(1.45, 1.45, 0.11, 128, 1, false),
      [sideMaterial, frontMaterial, backMaterial]
    );
    body.rotation.x = Math.PI / 2;
    group.add(body);

    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xffde4a,
      metalness: 0.99,
      roughness: 0.08
    });
    const frontRim = new THREE.Mesh(new THREE.TorusGeometry(1.47, 0.04, 16, 128), rimMaterial);
    frontRim.position.z = 0.061;
    group.add(frontRim);

    const backRim = frontRim.clone();
    backRim.position.z = -0.061;
    group.add(backRim);

    // Two restrained outer beads add minted detail without bringing back the inner ring.
    const beadMaterial = new THREE.MeshStandardMaterial({
      color: 0xffca2d,
      metalness: 0.97,
      roughness: 0.11
    });
    [1.18, 0.98].forEach((radius, index) => {
      const bead = new THREE.Mesh(
        new THREE.TorusGeometry(radius, index === 0 ? 0.016 : 0.011, 12, 128),
        beadMaterial
      );
      bead.position.z = 0.061 + index * 0.001;
      group.add(bead);

      const backBead = bead.clone();
      backBead.position.z = -0.061 - index * 0.001;
      group.add(backBead);
    });

    group.add(makeCoinLettering(THREE, font));

    const ridges = new THREE.Group();
    const ridgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xd98d00,
      metalness: 0.96,
      roughness: 0.18
    });
    for (let index = 0; index < 96; index += 1) {
      const angle = (index / 96) * Math.PI * 2;
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.18, 0.014), ridgeMaterial);
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
      inset: '-18%',
      overflow: 'visible',
      pointerEvents: 'none',
      zIndex: '4'
    });
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
      inset: '11%',
      borderRadius: '50%',
      border: '2px solid rgba(255, 236, 126, 0.82)',
      boxShadow: '0 0 30px rgba(255, 198, 37, 0.4), inset 0 0 24px rgba(255, 249, 200, 0.26)',
      opacity: '0',
      transform: 'scale(0.82)',
      transition: 'transform 460ms cubic-bezier(.16,1,.3,1), opacity 460ms ease-out',
      pointerEvents: 'none',
      zIndex: '1'
    });
    root.appendChild(halo);
    state.halo = halo;
    return halo;
  }

  function pulseHalo(strength = 1) {
    if (reducedMotion) return;
    const halo = ensureHalo();
    halo.style.opacity = String(clamp(0.32 + strength * 0.14, 0, 0.84));
    halo.style.transform = `scale(${0.9 + strength * 0.08})`;
    window.setTimeout(() => {
      halo.style.opacity = '0';
      halo.style.transform = 'scale(1.52)';
    }, 28);
  }

  function spawnSparks(count = 7, intensity = 1, stars = false) {
    if (reducedMotion) return;
    const layer = ensureMagicLayer();
    const rect = root.getBoundingClientRect();
    const size = Math.max(2, Math.min(rect.width, rect.height));
    const burstCount = Math.min(count, SPARK_BURST_MAX);

    for (let index = 0; index < burstCount; index += 1) {
      const spark = document.createElement('span');
      const angle = Math.random() * FULL_TURN;
      const distance = size * (0.18 + Math.random() * 0.36) * intensity;
      const sparkSize = 2.5 + Math.random() * 4 * intensity;
      const lifetime = SPARK_LIFETIME_MS + Math.random() * 180;
      const isStar = stars && index % 3 === 0;
      spark.dataset.coinSpark = 'true';
      spark.textContent = isStar ? '✦' : '';
      Object.assign(spark.style, {
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: isStar ? 'auto' : `${sparkSize}px`,
        height: isStar ? 'auto' : `${sparkSize}px`,
        borderRadius: '999px',
        background: isStar ? 'transparent' : GOLD.light,
        color: GOLD.highlight,
        fontSize: `${8 + sparkSize * 2}px`,
        lineHeight: '1',
        textShadow: '0 0 10px rgba(255, 214, 65, 0.95)',
        boxShadow: isStar ? 'none' : `0 0 ${10 + sparkSize * 2}px rgba(255, 196, 34, 0.92)`,
        opacity: '0.98',
        transform: 'translate(-50%, -50%) scale(0.75) rotate(0deg)',
        transition: `transform ${lifetime}ms cubic-bezier(.16,1,.3,1), opacity ${lifetime}ms ease-out`
      });
      layer.appendChild(spark);
      window.requestAnimationFrame(() => {
        spark.style.transform = `translate(calc(-50% + ${Math.cos(angle) * distance}px), calc(-50% + ${Math.sin(angle) * distance}px)) scale(0.1) rotate(${120 + Math.random() * 260}deg)`;
        spark.style.opacity = '0';
      });
      window.setTimeout(() => spark.remove(), lifetime + 100);
    }
  }

  function emitCoinEvent(type, detail = {}) {
    const payload = {
      type,
      combo: state.comboCount,
      level: state.magicLevel,
      ...detail
    };
    root.dispatchEvent(new CustomEvent('3dvr:coin-interact', { bubbles: true, detail: payload }));
    window.dispatchEvent(new CustomEvent(`3dvr:coin-${type}`, { detail: payload }));
  }

  function registerTapMagic() {
    const timestamp = performance.now();
    state.comboCount = timestamp - state.lastMagicAt < MAGIC_COMBO_WINDOW_MS
      ? Math.min(state.comboCount + 1, MAGIC_COMBO_MAX)
      : 1;
    state.lastMagicAt = timestamp;
    state.magicLevel = state.comboCount >= WORLD_READY_COMBO ? 3 : state.comboCount >= 5 ? 2 : state.comboCount >= 3 ? 1 : 0;

    const comboBoost = 1 + Math.max(0, state.comboCount - 1) * 0.14;
    state.spinVelocityY = clamp(state.spinVelocityY + 0.0038 * comboBoost, -MAX_SPIN_MOMENTUM, MAX_SPIN_MOMENTUM);
    state.targetZ += 0.024 * comboBoost;
    spawnSparks(5 + state.comboCount * 2, 0.7 + state.comboCount * 0.05, state.comboCount >= 3);
    pulseHalo(0.7 + state.comboCount * 0.11);
    emitCoinEvent('tap', { count: state.comboCount });

    if (state.comboCount === 3) {
      state.spinVelocityX = clamp(state.spinVelocityX - 0.006, -MAX_VERTICAL_SPIN_MOMENTUM, MAX_VERTICAL_SPIN_MOMENTUM);
      emitCoinEvent('combo', { milestone: 3 });
    }

    if (state.comboCount === 5) {
      state.spinVelocityY = clamp(state.spinVelocityY + 0.007, -MAX_SPIN_MOMENTUM, MAX_SPIN_MOMENTUM);
      state.targetZ += 0.09;
      spawnSparks(24, 1.22, true);
      emitCoinEvent('powerup', { milestone: 5, charged: true });
    }

    if (state.comboCount === WORLD_READY_COMBO) {
      spawnSparks(30, 1.45, true);
      pulseHalo(2.2);
      emitCoinEvent('world-ready', {
        milestone: WORLD_READY_COMBO,
        suggestedHref: '/3dvr-world/'
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

    if (state.dragging) {
      return;
    }

    state.idleSpin += elapsed * (IDLE_QUARTER_SPIN_SPEED + state.spinVelocityY);
    if (state.spinVelocityY !== 0) {
      state.spinVelocityY *= Math.pow(SPIN_MOMENTUM_DECAY, elapsed / 16.67);
      if (Math.abs(state.spinVelocityY) < MIN_SPIN_MOMENTUM) {
        state.spinVelocityY = 0;
      }
    }

    if (state.spinVelocityX !== 0) {
      state.targetX += elapsed * state.spinVelocityX;
      state.spinVelocityX *= Math.pow(VERTICAL_SPIN_MOMENTUM_DECAY, elapsed / 16.67);
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
    }

    state.currentX += (state.targetX - state.currentX) * MANUAL_X_CURRENT_RETURN;
    state.currentY += (state.targetY - state.currentY) * MANUAL_CURRENT_RETURN;
    state.currentZ += (state.targetZ - state.currentZ) * MANUAL_CURRENT_RETURN;

    if (state.comboCount && performance.now() - state.lastMagicAt > MAGIC_COMBO_WINDOW_MS) {
      state.comboCount = 0;
      state.magicLevel = 0;
    }

    if (state.token && state.renderer && state.scene && state.camera) {
      const rotation = getRenderRotation();
      state.token.rotation.set(rotation.x, rotation.y, rotation.z);
      state.renderer.render(state.scene, state.camera);
      return;
    }

    if (state.fallbackContext) {
      drawFallbackToken();
    }
  }

  function startDrag(event) {
    state.dragging = true;
    state.pointerMoved = false;
    state.dragStartedAt = event.timeStamp || performance.now();
    state.gestureDX = 0;
    state.gestureDY = 0;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    state.lastDragTimestamp = event.timeStamp || performance.now();
    state.spinVelocityX = 0;
    state.spinVelocityY = 0;
    root.setPointerCapture?.(event.pointerId);
  }

  function drag(event) {
    if (!state.dragging) return;
    const dx = event.clientX - state.lastX;
    const dy = event.clientY - state.lastY;
    const distance = Math.hypot(dx, dy);
    const timestamp = event.timeStamp || performance.now();
    const elapsed = Math.max(16, Math.min(timestamp - state.lastDragTimestamp, 80));
    const spinDelta = dx * DRAG_SPIN_FACTOR;
    const verticalIntent = Math.abs(dy) / Math.max(Math.abs(dx), Math.abs(dy), 1);
    const verticalSpinDelta = dy * DRAG_VERTICAL_SPIN_FACTOR * verticalIntent;
    if (distance > 3) state.pointerMoved = true;
    state.gestureDX += dx;
    state.gestureDY += dy;
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

  function classifyDirection(dx, dy) {
    if (Math.hypot(dx, dy) < 30) return '';
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
    return dy > 0 ? 'down' : 'up';
  }

  function endDrag(event = {}) {
    if (!state.dragging) return;
    state.dragging = false;
    try { root.releasePointerCapture?.(event.pointerId); } catch {}

    const duration = (event.timeStamp || performance.now()) - state.dragStartedAt;
    const distance = Math.hypot(state.gestureDX, state.gestureDY);
    if (!state.pointerMoved && distance <= TAP_MOVE_LIMIT && duration <= QUICK_TAP_MAX_MS) {
      registerTapMagic();
      return;
    }

    if (distance >= 18) {
      const direction = classifyDirection(state.gestureDX, state.gestureDY);
      spawnSparks(Math.min(14, 5 + Math.round(distance / 24)), 0.82, false);
      pulseHalo(0.58);
      emitCoinEvent('spin', {
        distance: Math.round(distance),
        dx: Math.round(state.gestureDX),
        dy: Math.round(state.gestureDY),
        direction
      });
      if (direction) emitCoinEvent('direction', { direction });
    }
  }

  function setupKeyboard() {
    root.addEventListener('keydown', (event) => {
      const step = 0.22;
      if (event.key === 'ArrowLeft') state.targetY -= step;
      else if (event.key === 'ArrowRight') state.targetY += step;
      else if (event.key === 'ArrowUp') state.targetX -= step;
      else if (event.key === 'ArrowDown') state.targetX += step;
      else if (event.key === 'Enter') {
        registerTapMagic();
        event.preventDefault();
        return;
      } else return;

      const direction = event.key.replace('Arrow', '').toLowerCase();
      spawnSparks(4, 0.58, false);
      emitCoinEvent('direction', { direction, source: 'keyboard' });
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
    const scaleX = Math.max(0.18, Math.abs(Math.cos(rotation.y)) * 0.82 + 0.18);
    const scaleY = Math.max(0.5, Math.cos(rotation.x) * 0.18 + 0.78);
    const radius = size * 0.34;

    context.clearRect(0, 0, width, height);
    context.save();
    context.translate(centerX, centerY);
    context.rotate(rotation.z);
    context.scale(scaleX, scaleY);

    const sideGradient = context.createLinearGradient(-radius, -radius, radius, radius);
    sideGradient.addColorStop(0, GOLD.highlight);
    sideGradient.addColorStop(0.42, GOLD.mid);
    sideGradient.addColorStop(1, GOLD.deep);

    context.save();
    context.translate(tiltY * radius * 0.8, tiltX * radius * 0.8 + radius * 0.08);
    context.beginPath();
    context.ellipse(0, 0, radius * 1.04, radius * 1.04, 0, 0, Math.PI * 2);
    context.fillStyle = sideGradient;
    context.shadowColor = 'rgba(91, 54, 0, 0.38)';
    context.shadowBlur = size * 0.08;
    context.shadowOffsetY = size * 0.035;
    context.fill();
    context.restore();

    const faceGradient = context.createRadialGradient(-radius * 0.3, -radius * 0.38, radius * 0.05, 0, 0, radius * 1.12);
    faceGradient.addColorStop(0, GOLD.highlight);
    faceGradient.addColorStop(0.18, GOLD.light);
    faceGradient.addColorStop(0.5, GOLD.mid);
    faceGradient.addColorStop(0.82, GOLD.rich);
    faceGradient.addColorStop(1, GOLD.shadow);
    context.beginPath();
    context.ellipse(0, 0, radius, radius, 0, 0, Math.PI * 2);
    context.fillStyle = faceGradient;
    context.fill();

    context.lineWidth = Math.max(8, size * 0.025);
    context.strokeStyle = GOLD.highlight;
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
      context.strokeStyle = ridge % 2 ? GOLD.highlight : GOLD.edge;
      context.stroke();
    }
    context.restore();

    // Approximate the raised face for browsers that cannot create WebGL.
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = `900 ${Math.floor(size * 0.18)}px Poppins, Inter, Arial, sans-serif`;
    context.fillStyle = GOLD.ink;
    [[0, size * 0.024], [size * 0.012, size * 0.012], [size * 0.006, 0]].forEach(([x, y]) => {
      context.fillText('3dvr', x, y);
    });
    context.fillStyle = GOLD.highlight;
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
          comboCount: state.comboCount,
          magicLevel: state.magicLevel
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
      renderer.toneMappingExposure = 1.28;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(0, 0, 5);

      const token = makeToken(THREE, font);
      token.rotation.x = -0.045;
      token.rotation.y = 0.07;
      scene.add(token);
      scene.add(new THREE.HemisphereLight(0xfff8dc, 0x7c4700, 1.05));

      const key = new THREE.DirectionalLight(0xfffdf0, 2.2);
      key.position.set(2.8, 3.4, 4.8);
      scene.add(key);

      const fill = new THREE.DirectionalLight(0xffc13b, 0.92);
      fill.position.set(-3.2, -1.25, 2.3);
      scene.add(fill);

      const coolRim = new THREE.DirectionalLight(0xc8efff, 0.5);
      coolRim.position.set(-2.4, 3.1, -2.8);
      scene.add(coolRim);

      const sparkle = new THREE.PointLight(0xffe27d, 0.82, 9);
      sparkle.position.set(0.8, -2.2, 3.8);
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
