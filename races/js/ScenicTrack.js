import * as THREE from "three";
import {
  routeFrame,
  routePoint,
  projectRoute,
  ROUTE,
  ROAD_WIDTH,
  SAMPLE_COUNT,
} from "./Route.js?v=20261014b";
const loader = new THREE.TextureLoader();
// Pine texture is an atlas: use only the isolated needle cluster in its upper left.
function pineCard() {
  const geometry = new THREE.PlaneGeometry(1, 1);
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++)
    uv.setXY(i, uv.getX(i) * 0.24, 0.55 + uv.getY(i) * 0.45);
  return geometry;
}
function ridgeGeometry(height, seed) {
  const geometry = new THREE.ConeGeometry(140, height, 28, 8);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      z = p.getZ(i),
      a = Math.atan2(z, x);
    const wobble =
      1 + 0.15 * Math.sin(a * 5 + seed) + 0.07 * Math.sin(a * 11 + seed * 2);
    p.setX(i, x * wobble);
    p.setZ(i, z * wobble);
    p.setY(
      i,
      p.getY(i) +
        (1 - Math.abs(p.getY(i)) / (height / 2)) * 10 * Math.sin(a * 4 + seed),
    );
  }
  geometry.computeVertexNormals();
  return geometry;
}
function texture(name, repeat = 1) {
  const t = loader.load(new URL("../assets/" + name, import.meta.url).href);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  if (name.includes("color")) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function strip(scene, left, right, material, lift = 0.02) {
  const vertices = [],
    uv = [],
    idx = [];
  let distance = 0;
  for (let i = 0; i <= SAMPLE_COUNT; i++) {
    const { p, normal } = routeFrame(i / SAMPLE_COUNT);
    if (i) distance += p.distanceTo(ROUTE[i - 1]);
    for (const side of [left, right]) {
      vertices.push(p.x + normal.x * side, p.y + lift, p.z + normal.z * side);
      uv.push((side - left) / 6, distance / 6);
    }
    if (i < SAMPLE_COUNT) {
      const j = i * 2;
      idx.push(j, j + 2, j + 1, j + 1, j + 2, j + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, material);
  m.receiveShadow = true;
  scene.add(m);
}
export function buildTrack(scene) {
  const asphalt = new THREE.MeshStandardMaterial({
    map: texture("asphalt-color.jpg"),
    normalMap: texture("asphalt-normal.jpg"),
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughness: 0.87,
    side: THREE.DoubleSide,
  });
  strip(scene, -9, 9, asphalt);
  const edge = new THREE.MeshStandardMaterial({
    color: 0xe8e5d9,
    roughness: 0.9,
    side: THREE.DoubleSide,
  });
  for (const s of [-1, 1]) {
    strip(scene, s * 8.5, s * 8.7, edge, 0.045);
    strip(
      scene,
      s * 9.1,
      s * 11.1,
      new THREE.MeshStandardMaterial({
        color: 0x958c73,
        roughness: 1,
        side: THREE.DoubleSide,
      }),
      -0.05,
    );
  }
  const red = new THREE.MeshStandardMaterial({
      color: 0xb94132,
      roughness: 0.82,
    }),
    white = new THREE.MeshStandardMaterial({
      color: 0xd8d6c6,
      roughness: 0.85,
    }),
    metal = new THREE.MeshStandardMaterial({
      color: 0x919a9d,
      metalness: 0.65,
      roughness: 0.44,
    }),
    dummy = new THREE.Object3D();
  for (const s of [-1, 1]) {
    const curb = new THREE.InstancedMesh(
        new THREE.BoxGeometry(0.85, 0.17, 4),
        red,
        180,
      ),
      curbWhite = new THREE.InstancedMesh(
        new THREE.BoxGeometry(0.85, 0.17, 4),
        white,
        180,
      ),
      rail = new THREE.InstancedMesh(
        new THREE.BoxGeometry(0.2, 0.65, 4.4),
        metal,
        180,
      ),
      posts = new THREE.InstancedMesh(
        new THREE.BoxGeometry(0.18, 1.3, 0.18),
        metal,
        180,
      );
    for (let i = 0; i < 180; i++) {
      let f = routeFrame(i / 180);
      dummy.position.copy(f.p).addScaledVector(f.normal, s * 11.6);
      dummy.position.y += 0.95;
      dummy.rotation.set(0, f.angle, 0);
      dummy.scale.set(
        1,
        1,
        routePoint((i + 1) / 180).distanceTo(f.p) / 4.4 + 0.1,
      );
      dummy.updateMatrix();
      rail.setMatrixAt(i, dummy.matrix);
      dummy.scale.set(1, 1, 1);
      dummy.position.y -= 0.3;
      dummy.updateMatrix();
      posts.setMatrixAt(i, dummy.matrix);
      for (let j = 0; j < 2; j++) {
        f = routeFrame((i * 2 + j) / 360);
        dummy.position.copy(f.p).addScaledVector(f.normal, s * 9.45);
        dummy.position.y += 0.08;
        dummy.rotation.y = f.angle;
        dummy.updateMatrix();
        (j ? curbWhite : curb).setMatrixAt(i, dummy.matrix);
      }
    }
    scene.add(curb, curbWhite, rail, posts);
  }
  buildTerrain(scene);
  const f = routeFrame(0),
    gantry = new THREE.Group();
  gantry.position.copy(f.p);
  gantry.rotation.y = f.angle;
  for (const x of [-11, 11]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.6, 7, 0.6), metal);
    post.position.set(x, 3.5, 0);
    gantry.add(post);
  }
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(23, 1.7, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x17232b, roughness: 0.5 }),
  );
  board.position.y = 7;
  gantry.add(board);
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 128;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#15212b";
  ctx.fillRect(0, 0, 1024, 128);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 60px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("SUMMIT RUN  /  BIG BACKS", 512, 86);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 1.5),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(c),
      side: THREE.DoubleSide,
    }),
  );
  label.position.set(0, 7, -0.26);
  label.rotation.y = Math.PI;
  gantry.add(label);
  scene.add(gantry);
  for (let i = 0; i < 18; i++) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.02, 1.4),
      i % 2 ? red : white,
    );
    m.position.copy(f.p).addScaledVector(f.normal, i - 8.5);
    m.position.y += 0.06;
    m.rotation.y = f.angle;
    scene.add(m);
  }
  for (const [t, text] of [
    [0.11, "150"],
    [0.13, "100"],
    [0.15, "50"],
    [0.39, "SLOW"],
    [0.62, "S BENDS"],
    [0.81, "SUMMIT"],
  ])
    sign(scene, t, text);
  return [];
}
function groundHeight(x, z) {
  const a = Math.atan2(x, z) / (Math.PI * 2),
    p = routePoint(a),
    r = Math.hypot(x, z),
    d = Math.abs(r - Math.hypot(p.x, p.z)),
    hills = Math.max(
      0,
      Math.sin(x * 0.011) * Math.cos(z * 0.009) * 35 + Math.sin(z * 0.017) * 14,
    );
  return p.y - 0.35 + Math.min(1, Math.max(0, (d - 20) / 75)) * hills;
}
function buildTerrain(scene) {
  const geo = new THREE.PlaneGeometry(1800, 1800, 120, 120);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position,
    colors = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i),
      z = pos.getZ(i),
      y = groundHeight(x, z);
    pos.setY(i, y);
    const color = new THREE.Color(y > 22 ? 0x9a9c8a : 0x718458);
    color.multiplyScalar(0.9 + 0.12 * Math.sin(x * 0.02) * Math.cos(z * 0.03));
    colors.push(color.r, color.g, color.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const terrain = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      map: texture("terrain-color.jpg", 20),
      vertexColors: true,
      roughness: 1,
    }),
  );
  terrain.receiveShadow = true;
  scene.add(terrain);
  const trunk = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.25, 0.5, 7, 6),
      new THREE.MeshStandardMaterial({
        map: texture("bark-color.jpg"),
        color: 0xbbbaa0,
        roughness: 1,
      }),
      280,
    ),
    trees = new THREE.InstancedMesh(
      pineCard(),
      new THREE.MeshStandardMaterial({
        map: texture("pine-color.jpg"),
        alphaMap: texture("pine-alpha.jpg"),
        alphaTest: 0.45,
        side: THREE.DoubleSide,
        roughness: 1,
        color: 0xbac5ab,
      }),
      280 * 15,
    ),
    rocks = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1, 1),
      new THREE.MeshStandardMaterial({
        map: texture("terrain-color.jpg"),
        color: 0xb6b6ac,
        roughness: 0.96,
      }),
      100,
    ),
    dummy = new THREE.Object3D();
  for (let i = 0; i < 280; i++) {
    const t = (i * 0.61803398875) % 1,
      f = routeFrame(t),
      offset = (i % 2 ? 1 : -1) * (18 + ((i * 37) % 115));
    dummy.position.copy(f.p).addScaledVector(f.normal, offset);
    const y = groundHeight(dummy.position.x, dummy.position.z);
    dummy.position.y = y + 3;
    const size = 0.7 + (i % 9) * 0.13;
    dummy.scale.set(size, size, size);
    dummy.rotation.set(0, i * 0.83, 0);
    dummy.updateMatrix();
    trunk.setMatrixAt(i, dummy.matrix);
    for (let tier = 0; tier < 5; tier++)
      for (let branch = 0; branch < 3; branch++) {
        const angle = i * 0.83 + (branch * Math.PI) / 3 + tier * 0.43,
          spread = (5 - tier * 0.75) * size;
        dummy.position.y = y + (4 + tier * 1.45) * size;
        dummy.rotation.set(0.12 * Math.sin(i + tier), angle, 0.1 * Math.cos(i));
        dummy.scale.set(spread, 3.4 * size, 1);
        dummy.updateMatrix();
        trees.setMatrixAt(i * 15 + tier * 3 + branch, dummy.matrix);
      }
  }
  for (let i = 0; i < 100; i++) {
    const f = routeFrame(i / 100);
    dummy.position
      .copy(f.p)
      .addScaledVector(f.normal, (i % 2 ? 1 : -1) * (17 + (i % 35)));
    dummy.position.y = groundHeight(dummy.position.x, dummy.position.z) + 1;
    dummy.scale.set(1.5 + (i % 4), 1 + (i % 3), 2 + (i % 5));
    dummy.rotation.set(i * 0.13, i * 0.47, 0);
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
  }
  trees.castShadow = trunk.castShadow = rocks.castShadow = true;
  scene.add(trunk, trees, rocks);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2,
      h = 100 + ((i * 19) % 100),
      m = new THREE.Mesh(
        ridgeGeometry(h, i),
        new THREE.MeshStandardMaterial({
          color: i % 2 ? 0x788478 : 0x909585,
          map: texture("terrain-color.jpg", 4),
          roughness: 1,
        }),
      );
    m.position.set(Math.sin(a) * 650, h / 2 - 15, Math.cos(a) * 650);
    m.rotation.y = i * 0.6;
    scene.add(m);
  }
}
function sign(scene, t, text) {
  const f = routeFrame(t),
    g = new THREE.Group();
  g.position.copy(f.p).addScaledVector(f.normal, 13);
  g.rotation.y = f.angle + Math.PI;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#eee9d8";
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = "#17232b";
  ctx.font = "bold 50px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(text, 128, 83);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 2),
    new THREE.MeshStandardMaterial({
      map: new THREE.CanvasTexture(c),
      side: THREE.DoubleSide,
    }),
  );
  m.position.y = 3;
  g.add(m);
  scene.add(g);
}
export function initialLapState() {
  return { lap: 1, checkpoints: [false, false, false], lastT: 0 };
}
export function updateLapProgress(pos, state) {
  const r = projectRoute(pos);
  if (r.distance > ROAD_WIDTH / 2 + 3) return false;
  const t = r.t,
    next = state.checkpoints.findIndex((v) => !v);
  if (next >= 0 && Math.abs(t - (next + 1) / 4) < 0.035)
    state.checkpoints[next] = true;
  const done =
    state.lastT > 0.94 && t < 0.06 && state.checkpoints.every(Boolean);
  state.lastT = t;
  if (done) {
    state.lap++;
    state.checkpoints = [false, false, false];
    return true;
  }
  return false;
}
