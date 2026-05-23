import * as THREE from 'three';
import { EffectComposer }    from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }        from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass }   from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass }        from 'three/addons/postprocessing/OutputPass.js';

export function createScene() {
  // ── Renderer ──
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference:'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.getElementById('game').appendChild(renderer.domElement);

  // ── Scene ──
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x05050F, 160, 320);

  // ── Sky gradient ──
  const skyGeo = new THREE.SphereGeometry(400, 32, 16);
  skyGeo.scale(-1, 1, -1); // invert
  const skyCvs = document.createElement('canvas');
  skyCvs.width = 2; skyCvs.height = 512;
  const skyCtx = skyCvs.getContext('2d');
  const grad = skyCtx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.0,  '#04040E');
  grad.addColorStop(0.55, '#0D0820');
  grad.addColorStop(0.75, '#1A0A2E');
  grad.addColorStop(0.88, '#2D0B1F');
  grad.addColorStop(1.0,  '#1A0D05');
  skyCtx.fillStyle = grad;
  skyCtx.fillRect(0, 0, 2, 512);
  const skyTex = new THREE.CanvasTexture(skyCvs);
  skyTex.mapping = THREE.UVMapping;
  scene.add(new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide })));

  // ── Stars ──
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(3000);
  for (let i = 0; i < 3000; i += 3) {
    const θ = Math.random() * Math.PI * 2;
    const φ = Math.acos(2 * Math.random() - 1) * 0.6; // mostly above horizon
    const r = 380;
    starPos[i]   = r * Math.sin(φ) * Math.cos(θ);
    starPos[i+1] = r * Math.abs(Math.cos(φ)) + 20;
    starPos[i+2] = r * Math.sin(φ) * Math.sin(θ);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.8, sizeAttenuation: true })));

  // ── Lighting ──
  const hemi = new THREE.HemisphereLight(0x1A1040, 0x0A1A0A, 0.6);
  scene.add(hemi);

  const moonLight = new THREE.DirectionalLight(0x8899FF, 0.8);
  moonLight.position.set(60, 100, 40);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(2048, 2048);
  moonLight.shadow.camera.near = 1;
  moonLight.shadow.camera.far = 400;
  moonLight.shadow.camera.left = -120;
  moonLight.shadow.camera.right = 120;
  moonLight.shadow.camera.top = 120;
  moonLight.shadow.camera.bottom = -120;
  moonLight.shadow.bias = -0.001;
  scene.add(moonLight);

  // Warm ambient glow (street lights, city)
  const ambient = new THREE.AmbientLight(0x220A0A, 0.4);
  scene.add(ambient);

  // ── Camera ──
  const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 8, 90);

  // Chase camera state
  const camTarget = new THREE.Vector3();
  const camLook   = new THREE.Vector3();

  // ── Post-processing ──
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.75,  // strength
    0.4,   // radius
    0.52   // threshold — only bright emissive things glow
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ── Resize handler ──
  window.addEventListener('resize', () => {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    bloom.setSize(w, h);
  });

  // ── Chase camera update ──
  function updateCamera(carPos, carAngle, dt) {
    const DIST = 10, HEIGHT = 4.5, LOOK_AHEAD = 5;

    const behind = new THREE.Vector3(
      -Math.sin(carAngle) * DIST,
      HEIGHT,
      -Math.cos(carAngle) * DIST
    );
    camTarget.copy(carPos).add(behind);

    // Smooth lerp
    camera.position.lerp(camTarget, Math.min(1, 7 * dt));

    const ahead = new THREE.Vector3(
      Math.sin(carAngle) * LOOK_AHEAD,
      1.2,
      Math.cos(carAngle) * LOOK_AHEAD
    );
    camLook.copy(carPos).add(ahead);
    camera.lookAt(camLook);
  }

  return { renderer, scene, camera, composer, updateCamera };
}
