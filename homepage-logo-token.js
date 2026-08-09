(function () {
  const THREE_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  const FACE_TEXTURE_ROTATION = -Math.PI / 2;
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
  const root = document.querySelector('[data-3dvr-token]');
  const canvas = document.querySelector('[data-3dvr-token-canvas]');

  if (!root || !canvas) return;

  const state = {
    dragging: false,
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
    renderer: null,
    fallbackContext: null,
    camera: null,
    scene: null,
    token: null,
    frame: 0,
    interactionsReady: false
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

  function makeFaceTexture(THREE, mirrored) {
    const textureCanvas = document.createElement('canvas');
    const size = 1024;
    textureCanvas.width = size;
    textureCanvas.height = size;
    const context = textureCanvas.getContext('2d');
    const gradient = context.createRadialGradient(size * 0.3, size * 0.22, 30, size * 0.5, size * 0.5, size * 0.64);
    gradient.addColorStop(0, '#fff1a8');
    gradient.addColorStop(0.24, '#f9d976');
    gradient.addColorStop(0.58, '#d99a2b');
    gradient.addColorStop(0.86, '#a96816');
    gradient.addColorStop(1, '#6f3f0b');

    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    context.save();
    context.translate(size / 2, size / 2);
    context.globalAlpha = 0.2;
    for (let ring = 1; ring <= 5; ring += 1) {
      context.beginPath();
      context.arc(0, 0, size * (0.21 + ring * 0.085), 0, Math.PI * 2);
      context.strokeStyle = ring % 2 ? '#fff1a8' : '#7c470d';
      context.lineWidth = 5;
      context.stroke();
    }
    context.globalAlpha = 1;
    context.restore();

    context.beginPath();
    context.arc(size / 2, size / 2, size * 0.41, 0, Math.PI * 2);
    context.strokeStyle = '#ffe9a3';
    context.lineWidth = 28;
    context.stroke();

    context.beginPath();
    context.arc(size / 2, size / 2, size * 0.32, 0, Math.PI * 2);
    context.strokeStyle = 'rgba(111, 63, 11, 0.62)';
    context.lineWidth = 10;
    context.stroke();

    context.save();
    context.translate(size / 2, size / 2);
    if (mirrored) context.scale(-1, 1);
    context.rotate(FACE_TEXTURE_ROTATION);
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '900 220px Poppins, Inter, Arial, sans-serif';
    // Three small passes make the mark read as raised minting instead of flat ink.
    context.shadowColor = 'rgba(0, 0, 0, 0.24)';
    context.shadowBlur = 12;
    context.fillStyle = '#6f3f0b';
    context.fillText('3dvr', 0, 8);
    context.shadowColor = 'transparent';
    context.fillStyle = '#fff1a8';
    context.fillText('3dvr', -3, -3);
    context.fillStyle = '#8a5010';
    context.fillText('3dvr', 0, 0);
    context.restore();

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

  function makeToken(THREE) {
    const group = new THREE.Group();
    const faceTexture = makeFaceTexture(THREE, false);
    const backTexture = makeFaceTexture(THREE, false);
    const sideMaterial = new THREE.MeshStandardMaterial({
      color: 0xb8791f,
      metalness: 0.92,
      roughness: 0.2
    });
    const frontMaterial = new THREE.MeshStandardMaterial({
      map: faceTexture,
      metalness: 0.76,
      roughness: 0.24
    });
    const backMaterial = new THREE.MeshStandardMaterial({
      map: backTexture,
      metalness: 0.78,
      roughness: 0.26
    });

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(1.45, 1.45, 0.24, 128, 1, false),
      [sideMaterial, frontMaterial, backMaterial]
    );
    body.rotation.x = Math.PI / 2;
    group.add(body);

    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd76a,
      metalness: 0.86,
      roughness: 0.18
    });
    const frontRim = new THREE.Mesh(new THREE.TorusGeometry(1.47, 0.028, 12, 128), rimMaterial);
    frontRim.position.z = 0.13;
    group.add(frontRim);

    const backRim = frontRim.clone();
    backRim.position.z = -0.13;
    group.add(backRim);

    const ridges = new THREE.Group();
    const ridgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x8f5b16,
      metalness: 0.9,
      roughness: 0.28
    });
    for (let index = 0; index < 64; index += 1) {
      const angle = (index / 64) * Math.PI * 2;
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.21, 0.012), ridgeMaterial);
      ridge.position.set(Math.cos(angle) * 1.458, 0, Math.sin(angle) * 1.458);
      ridge.rotation.y = angle;
      ridges.add(ridge);
    }
    ridges.rotation.x = Math.PI / 2;
    group.add(ridges);

    return group;
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
    const timestamp = event.timeStamp || performance.now();
    const elapsed = Math.max(16, Math.min(timestamp - state.lastDragTimestamp, 80));
    const spinDelta = dx * DRAG_SPIN_FACTOR;
    const verticalIntent = Math.abs(dy) / Math.max(Math.abs(dx), Math.abs(dy), 1);
    const verticalSpinDelta = dy * DRAG_VERTICAL_SPIN_FACTOR * verticalIntent;
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

  function endDrag(event) {
    state.dragging = false;
    root.releasePointerCapture?.(event.pointerId);
  }

  function setupKeyboard() {
    root.addEventListener('keydown', (event) => {
      const step = 0.22;
      if (event.key === 'ArrowLeft') state.targetY -= step;
      else if (event.key === 'ArrowRight') state.targetY += step;
      else if (event.key === 'ArrowUp') state.targetX -= step;
      else if (event.key === 'ArrowDown') state.targetX += step;
      else return;

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
    sideGradient.addColorStop(0, '#ffe9a3');
    sideGradient.addColorStop(0.45, '#b8791f');
    sideGradient.addColorStop(1, '#6f3f0b');

    context.save();
    context.translate(tiltY * radius * 0.8, tiltX * radius * 0.8 + radius * 0.08);
    context.beginPath();
    context.ellipse(0, 0, radius * 1.04, radius * 1.04, 0, 0, Math.PI * 2);
    context.fillStyle = sideGradient;
    context.shadowColor = 'rgba(0, 0, 0, 0.45)';
    context.shadowBlur = size * 0.08;
    context.shadowOffsetY = size * 0.035;
    context.fill();
    context.restore();

    const faceGradient = context.createRadialGradient(-radius * 0.3, -radius * 0.38, radius * 0.05, 0, 0, radius * 1.12);
    faceGradient.addColorStop(0, '#fff1a8');
    faceGradient.addColorStop(0.24, '#f9d976');
    faceGradient.addColorStop(0.58, '#d99a2b');
    faceGradient.addColorStop(0.86, '#a96816');
    faceGradient.addColorStop(1, '#6f3f0b');
    context.beginPath();
    context.ellipse(0, 0, radius, radius, 0, 0, Math.PI * 2);
    context.fillStyle = faceGradient;
    context.fill();

    context.save();
    context.globalAlpha = 0.2;
    for (let ring = 1; ring <= 5; ring += 1) {
      context.beginPath();
      context.ellipse(0, 0, radius * (0.28 + ring * 0.1), radius * (0.28 + ring * 0.1), 0, 0, Math.PI * 2);
      context.strokeStyle = ring % 2 ? '#fff1a8' : '#7c470d';
      context.lineWidth = Math.max(1, size * 0.004);
      context.stroke();
    }
    context.restore();

    context.lineWidth = Math.max(8, size * 0.025);
    context.strokeStyle = '#ffe9a3';
    context.stroke();

    context.lineWidth = Math.max(3, size * 0.009);
    context.strokeStyle = 'rgba(111, 63, 11, 0.62)';
    context.beginPath();
    context.ellipse(0, 0, radius * 0.79, radius * 0.79, 0, 0, Math.PI * 2);
    context.stroke();

    context.save();
    context.globalAlpha = 0.72;
    context.lineWidth = Math.max(1, size * 0.004);
    for (let ridge = 0; ridge < 64; ridge += 1) {
      const angle = (ridge / 64) * Math.PI * 2;
      const innerX = Math.cos(angle) * radius * 1.01;
      const innerY = Math.sin(angle) * radius * 1.01;
      const outerX = Math.cos(angle) * radius * 1.045;
      const outerY = Math.sin(angle) * radius * 1.045;
      context.beginPath();
      context.moveTo(innerX, innerY);
      context.lineTo(outerX, outerY);
      context.strokeStyle = ridge % 2 ? '#ffe9a3' : '#8f5b16';
      context.stroke();
    }
    context.restore();

    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = `900 ${Math.floor(size * 0.18)}px Poppins, Inter, Arial, sans-serif`;
    // Match the WebGL face: a lower bevel, a light catch, then the raised face.
    context.shadowColor = 'rgba(50, 27, 4, 0.28)';
    context.shadowBlur = size * 0.012;
    context.fillStyle = '#6f3f0b';
    context.fillText('3dvr', 0, size * 0.012);
    context.shadowColor = 'transparent';
    context.fillStyle = '#fff1a8';
    context.fillText('3dvr', -size * 0.006, -size * 0.006);
    context.fillStyle = '#8a5010';
    context.fillText('3dvr', 0, 0);
    context.restore();
  }

  function markReady(mode) {
    root.dataset.tokenReady = 'true';
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
          targetZ: state.targetZ
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
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(0, 0, 5);

      const token = makeToken(THREE);
      scene.add(token);
    scene.add(new THREE.AmbientLight(0xffedb0, 0.78));

      const key = new THREE.DirectionalLight(0xffffff, 1.35);
      key.position.set(2.5, 2.8, 4.5);
      scene.add(key);

    const fill = new THREE.DirectionalLight(0xffc857, 0.58);
      fill.position.set(-3, -1.5, 2);
      scene.add(fill);

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
