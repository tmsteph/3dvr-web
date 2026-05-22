(function () {
  const THREE_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  const root = document.querySelector('[data-3dvr-token]');
  const canvas = document.querySelector('[data-3dvr-token-canvas]');

  if (!root || !canvas) return;

  const state = {
    dragging: false,
    lastX: 0,
    lastY: 0,
    targetX: -0.2,
    targetY: 0.38,
    targetZ: -0.08,
    currentX: -0.2,
    currentY: 0.38,
    currentZ: -0.08,
    restX: -0.2,
    restY: 0.38,
    restZ: -0.08,
    renderer: null,
    fallbackContext: null,
    camera: null,
    scene: null,
    token: null,
    frame: 0,
    interactionsReady: false,
    dragIdleTimer: 0
  };

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
    const gradient = context.createRadialGradient(size * 0.35, size * 0.25, 80, size * 0.5, size * 0.5, size * 0.58);
    gradient.addColorStop(0, '#45ffe3');
    gradient.addColorStop(0.46, '#1768f2');
    gradient.addColorStop(1, '#07131f');

    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    context.save();
    context.translate(size / 2, size / 2);
    context.rotate(Math.PI / 4);
    context.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    context.lineWidth = 28;
    for (let offset = -size; offset < size; offset += 150) {
      context.beginPath();
      context.moveTo(offset, -size);
      context.lineTo(offset, size);
      context.stroke();
    }
    context.restore();

    context.beginPath();
    context.arc(size / 2, size / 2, size * 0.41, 0, Math.PI * 2);
    context.strokeStyle = '#d8fff7';
    context.lineWidth = 28;
    context.stroke();

    context.beginPath();
    context.arc(size / 2, size / 2, size * 0.32, 0, Math.PI * 2);
    context.strokeStyle = 'rgba(254, 215, 170, 0.7)';
    context.lineWidth = 10;
    context.stroke();

    context.save();
    context.translate(size / 2, size / 2);
    if (mirrored) context.scale(-1, 1);
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#ffffff';
    context.shadowColor = 'rgba(0, 0, 0, 0.45)';
    context.shadowBlur = 24;
    context.font = '900 168px Poppins, Inter, Arial, sans-serif';
    context.fillText('3dvr', 0, -20);
    context.fillStyle = '#ccfbf1';
    context.font = '800 96px Poppins, Inter, Arial, sans-serif';
    context.fillText('.tech', 0, 122);
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
    const backTexture = makeFaceTexture(THREE, true);
    const sideMaterial = new THREE.MeshStandardMaterial({
      color: 0x13b8b8,
      metalness: 0.72,
      roughness: 0.24
    });
    const frontMaterial = new THREE.MeshStandardMaterial({
      map: faceTexture,
      metalness: 0.45,
      roughness: 0.2
    });
    const backMaterial = new THREE.MeshStandardMaterial({
      map: backTexture,
      metalness: 0.45,
      roughness: 0.24
    });

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(1.45, 1.45, 0.34, 128, 1, false),
      [sideMaterial, frontMaterial, backMaterial]
    );
    body.rotation.x = Math.PI / 2;
    group.add(body);

    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xfed7aa,
      metalness: 0.86,
      roughness: 0.18
    });
    const frontRim = new THREE.Mesh(new THREE.TorusGeometry(1.47, 0.035, 16, 128), rimMaterial);
    frontRim.position.z = 0.18;
    group.add(frontRim);

    const backRim = frontRim.clone();
    backRim.position.z = -0.18;
    group.add(backRim);

    return group;
  }

  function animate() {
    state.frame = window.requestAnimationFrame(animate);

    if (!state.dragging) {
      state.targetX += (state.restX - state.targetX) * 0.08;
      state.targetY += (state.restY - state.targetY) * 0.08;
      state.targetZ += (state.restZ - state.targetZ) * 0.08;
    }

    state.currentX += (state.targetX - state.currentX) * 0.16;
    state.currentY += (state.targetY - state.currentY) * 0.16;
    state.currentZ += (state.targetZ - state.currentZ) * 0.16;

    if (state.token && state.renderer && state.scene && state.camera) {
      state.token.rotation.set(state.currentX, state.currentY, state.currentZ);
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
    root.setPointerCapture?.(event.pointerId);
  }

  function drag(event) {
    if (!state.dragging) return;
    window.clearTimeout(state.dragIdleTimer);
    const dx = event.clientX - state.lastX;
    const dy = event.clientY - state.lastY;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    state.targetY += dx * 0.014;
    state.targetX += dy * 0.014;
    state.targetZ += (dx - dy) * 0.002;
    state.dragIdleTimer = window.setTimeout(() => {
      state.dragging = false;
    }, 140);
  }

  function endDrag(event) {
    state.dragging = false;
    window.clearTimeout(state.dragIdleTimer);
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
    const tiltX = Math.sin(state.currentX) * 0.22;
    const tiltY = Math.sin(state.currentY) * 0.28;
    const scaleX = Math.max(0.45, Math.cos(state.currentY) * 0.28 + 0.72);
    const scaleY = Math.max(0.5, Math.cos(state.currentX) * 0.18 + 0.78);
    const radius = size * 0.34;

    context.clearRect(0, 0, width, height);
    context.save();
    context.translate(centerX, centerY);
    context.rotate(state.currentZ);
    context.scale(scaleX, scaleY);

    const sideGradient = context.createLinearGradient(-radius, -radius, radius, radius);
    sideGradient.addColorStop(0, '#fed7aa');
    sideGradient.addColorStop(0.45, '#0f766e');
    sideGradient.addColorStop(1, '#0b1020');

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

    const faceGradient = context.createRadialGradient(-radius * 0.35, -radius * 0.45, radius * 0.05, 0, 0, radius);
    faceGradient.addColorStop(0, '#45ffe3');
    faceGradient.addColorStop(0.5, '#1768f2');
    faceGradient.addColorStop(1, '#07131f');
    context.beginPath();
    context.ellipse(0, 0, radius, radius, 0, 0, Math.PI * 2);
    context.fillStyle = faceGradient;
    context.fill();

    context.lineWidth = Math.max(8, size * 0.025);
    context.strokeStyle = '#d8fff7';
    context.stroke();

    context.lineWidth = Math.max(3, size * 0.009);
    context.strokeStyle = 'rgba(254, 215, 170, 0.78)';
    context.beginPath();
    context.ellipse(0, 0, radius * 0.79, radius * 0.79, 0, 0, Math.PI * 2);
    context.stroke();

    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.shadowColor = 'rgba(0, 0, 0, 0.42)';
    context.shadowBlur = size * 0.025;
    context.fillStyle = '#ffffff';
    context.font = `900 ${Math.floor(size * 0.13)}px Poppins, Inter, Arial, sans-serif`;
    context.fillText('3dvr', 0, -size * 0.018);
    context.fillStyle = '#ccfbf1';
    context.font = `800 ${Math.floor(size * 0.075)}px Poppins, Inter, Arial, sans-serif`;
    context.fillText('.tech', 0, size * 0.1);
    context.restore();
  }

  function markReady(mode) {
    root.dataset.tokenReady = 'true';
    window.__3dvrLogoToken = {
      ready: true,
      mode,
      getRotation: () => ({
        x: state.currentX,
        y: state.currentY,
        z: state.currentZ,
        targetX: state.targetX,
        targetY: state.targetY,
        targetZ: state.targetZ
      })
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
      scene.add(new THREE.AmbientLight(0xe2fff8, 0.72));

      const key = new THREE.DirectionalLight(0xffffff, 1.35);
      key.position.set(2.5, 2.8, 4.5);
      scene.add(key);

      const fill = new THREE.DirectionalLight(0x99f6e4, 0.65);
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
