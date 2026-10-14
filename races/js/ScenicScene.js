import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
export function createScene() {
  const high = localStorage.getItem("bbr_quality") !== "low";
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, high ? 1.5 : 1));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = high;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.getElementById("game").appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa7c8db);
  scene.fog = new THREE.Fog(0xc4d0cd, 260, 1000);
  scene.add(new THREE.HemisphereLight(0xd4e7f2, 0x696d47, 2));
  const sun = new THREE.DirectionalLight(0xffedce, 3.3);
  sun.position.set(-180, 260, 100);
  sun.castShadow = high;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -260,
    right: 260,
    top: 260,
    bottom: -260,
    near: 1,
    far: 600,
  });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.06;
  scene.add(sun);
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  new RGBELoader().load(
    new URL("../assets/daylight.hdr", import.meta.url).href,
    (hdr) => {
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = pmrem.fromEquirectangular(hdr).texture;
      scene.environmentIntensity = 0.65;
      scene.background = hdr;
      scene.backgroundIntensity = 0.8;
      scene.backgroundBlurriness = 0.025;
      pmrem.dispose();
    },
    undefined,
    () => {
      pmrem.dispose();
    },
  );
  const camera = new THREE.PerspectiveCamera(
    62,
    innerWidth / innerHeight,
    0.15,
    1600,
  );
  camera.position.set(-10, 8, 160);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new OutputPass());
  addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
  });
  const target = new THREE.Vector3(),
    look = new THREE.Vector3();
  let placed = false;
  function updateCamera(pos, angle, dt) {
    target.set(
      pos.x - Math.sin(angle) * 11,
      pos.y + 4.1,
      pos.z - Math.cos(angle) * 11,
    );
    if (!placed) {
      camera.position.copy(target);
      placed = true;
    }
    camera.position.lerp(target, 1 - Math.exp(-6 * dt));
    look.set(
      pos.x + Math.sin(angle) * 10,
      pos.y + 1,
      pos.z + Math.cos(angle) * 10,
    );
    camera.lookAt(look);
  }
  return { renderer, scene, camera, composer, updateCamera };
}
