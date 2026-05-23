import * as THREE from 'three';
import { TRACK } from './config.js';

export function buildTrack(scene) {
  const { innerR, outerR, centerR } = TRACK;

  // ── Road surface ──
  const roadGeo = new THREE.RingGeometry(innerR, outerR, 128, 1);
  roadGeo.rotateX(-Math.PI / 2);
  const roadCanvas = makeRoadCanvas();
  const roadTex = new THREE.CanvasTexture(roadCanvas);
  roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping;
  const road = new THREE.Mesh(roadGeo, new THREE.MeshStandardMaterial({
    map: roadTex, roughness: 0.85, metalness: 0.0, color: 0xFFFFFF,
  }));
  road.receiveShadow = true;
  road.rotation.y = Math.PI / 128; // align texture seam
  scene.add(road);

  // ── Ground plane (grass) ──
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    new THREE.MeshStandardMaterial({ color: 0x0D2B0D, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  scene.add(ground);

  // ── Inner circle (infield) ──
  const infield = new THREE.Mesh(
    new THREE.CircleGeometry(innerR - 0.5, 128),
    new THREE.MeshStandardMaterial({ color: 0x0A1F0A, roughness: 1 })
  );
  infield.rotation.x = -Math.PI / 2;
  infield.position.y = 0.01;
  infield.receiveShadow = true;
  scene.add(infield);

  // ── Barriers (outer + inner) ──
  buildBarriers(scene, outerR + 0.3, 2.4, 0.5, 80);
  buildBarriers(scene, innerR - 0.3, 2.4, 0.5, 60);

  // ── Start/finish line ──
  buildStartLine(scene);

  // ── Lane markings (dashed white line at mid-radius) ──
  buildLaneMarkings(scene, centerR);

  // ── Environment (palm trees, city silhouette) ──
  buildEnvironment(scene);

  // ── Overhead lights ──
  buildLights(scene);

  // Return checkpoint data for lap detection
  return buildCheckpoints();
}

function makeRoadCanvas() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 64;
  const ctx = c.getContext('2d');
  // Dark asphalt
  ctx.fillStyle = '#1C1C1C';
  ctx.fillRect(0, 0, 512, 64);
  // Grain
  for (let i = 0; i < 4000; i++) {
    const v = Math.floor(Math.random() * 20 + 18);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 64, 1 + Math.random(), 1 + Math.random());
  }
  // Painted edge lines (white)
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillRect(0, 1, 512, 3);
  ctx.fillRect(0, 60, 512, 3);
  return c;
}

function buildBarriers(scene, radius, wallH, wallT, segments) {
  // Alternating red/white striped cylinder wall
  const barrierCanvas = document.createElement('canvas');
  barrierCanvas.width = 256; barrierCanvas.height = 64;
  const ctx = barrierCanvas.getContext('2d');
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#DD2222' : '#EEEEEE';
    ctx.fillRect(i * 16, 0, 16, 64);
  }
  const tex = new THREE.CanvasTexture(barrierCanvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.x = 24;

  const geo = new THREE.CylinderGeometry(radius, radius, wallH, segments, 1, true);
  const mat = new THREE.MeshStandardMaterial({
    map: tex, side: THREE.DoubleSide,
    roughness: 0.5, metalness: 0.1,
  });
  const wall = new THREE.Mesh(geo, mat);
  wall.position.y = wallH / 2;
  wall.receiveShadow = true;
  scene.add(wall);

  // Concrete base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.3, segments, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9 })
  );
  base.position.y = 0.15;
  scene.add(base);
}

function buildStartLine(scene) {
  const { outerR, innerR, centerR } = TRACK;
  const w = outerR - innerR;

  // Checkered pattern canvas
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  const s = 16;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? '#FFFFFF' : '#000000';
      ctx.fillRect(col * s, row * s, s, s);
    }
  }
  const tex = new THREE.CanvasTexture(c);

  const line = new THREE.Mesh(
    new THREE.PlaneGeometry(w, 4),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 })
  );
  line.rotation.x = -Math.PI / 2;
  line.rotation.z = Math.PI / 2;
  line.position.set(0, 0.03, centerR);
  scene.add(line);

  // Overhead gantry
  const gantryMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });
  const post = (x) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 10, 8), gantryMat);
    p.position.set(x, 5, centerR + 1);
    scene.add(p);
  };
  post(-TRACK.outerR + 1); post(TRACK.outerR - 1);

  const beam = new THREE.Mesh(new THREE.BoxGeometry((TRACK.outerR - TRACK.innerR) + 6, 0.4, 0.4), gantryMat);
  beam.position.set(0, 10, centerR + 1);
  scene.add(beam);

  // Neon start/finish sign on gantry
  const signMat = new THREE.MeshStandardMaterial({ color:0xFF4400, emissive:0xFF2200, emissiveIntensity:2 });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(14, 1.2, 0.2), signMat);
  sign.position.set(0, 9.2, centerR + 1);
  scene.add(sign);
}

function buildLaneMarkings(scene, radius) {
  // Dashed white lines at track center
  const dashCount = 64;
  for (let i = 0; i < dashCount; i++) {
    const angle = (i / dashCount) * Math.PI * 2;
    const dashL = 5; const gap = 3.5;
    const dash = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, dashL),
      new THREE.MeshStandardMaterial({ color: 0xEEEEEE, roughness: 0.6, emissive: 0x555555, emissiveIntensity: 0.3 })
    );
    dash.rotation.x = -Math.PI / 2;
    dash.rotation.z = angle + Math.PI / 2;
    dash.position.set(
      Math.sin(angle) * radius,
      0.04,
      Math.cos(angle) * radius
    );
    scene.add(dash);
  }
}

function buildEnvironment(scene) {
  // Palm trees around the outside
  const palmRadius = TRACK.outerR + 12;
  const palmCount = 36;
  for (let i = 0; i < palmCount; i++) {
    const angle = (i / palmCount) * Math.PI * 2;
    const r = palmRadius + (Math.random() - 0.5) * 20;
    const x = Math.sin(angle) * r;
    const z = Math.cos(angle) * r;
    addPalmTree(scene, x, z);
  }

  // City buildings in the far background
  const buildingCount = 30;
  for (let i = 0; i < buildingCount; i++) {
    const angle = (i / buildingCount) * Math.PI * 2;
    const r = 160 + Math.random() * 50;
    const h = 15 + Math.random() * 50;
    const w = 8 + Math.random() * 10;
    const bldg = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, w * (0.6 + Math.random() * 0.8)),
      new THREE.MeshStandardMaterial({
        color: 0x0A0A1A,
        emissive: new THREE.Color(0.02, 0.02, 0.08),
        emissiveIntensity: 1,
        roughness: 0.8,
      })
    );
    bldg.position.set(Math.sin(angle) * r, h / 2, Math.cos(angle) * r);
    scene.add(bldg);

    // Windows (emissive yellow dots)
    const winRows = Math.floor(h / 3);
    for (let wr = 0; wr < winRows; wr += 2) {
      if (Math.random() < 0.4) continue;
      const win = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.8, 0.3, 0.1),
        new THREE.MeshStandardMaterial({ emissive: 0xFFCC44, emissiveIntensity: 1.2, color: 0x000000 })
      );
      win.position.set(0, wr * 1.5 - h / 2 + 2, w / 2 + 0.1);
      bldg.add(win);
    }
  }
}

function addPalmTree(scene, x, z) {
  const group = new THREE.Group();
  // Trunk
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.3, 7 + Math.random() * 3, 7),
    new THREE.MeshStandardMaterial({ color: 0x5C3D1A, roughness: 0.95 })
  );
  trunk.position.y = 3.5;
  group.add(trunk);

  // Leaves
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1B6B1B, roughness: 0.7, side: THREE.DoubleSide });
  const leafCount = 7;
  for (let i = 0; i < leafCount; i++) {
    const a = (i / leafCount) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(2 + Math.random(), 4, 4), leafMat);
    leaf.position.set(Math.cos(a) * 1.8, 7.5, Math.sin(a) * 1.8);
    leaf.rotation.z = Math.PI / 4 + Math.random() * 0.3;
    leaf.rotation.y = -a;
    group.add(leaf);
  }
  group.position.set(x, 0, z);
  group.rotation.y = Math.random() * Math.PI * 2;
  scene.add(group);
}

function buildLights(scene) {
  // Street light poles around the track
  const count = 24;
  const poleR = TRACK.outerR - 4;
  const poleMatSteel = new THREE.MeshStandardMaterial({ color: 0x555566, metalness: 0.9, roughness: 0.2 });
  const glowMat = new THREE.MeshStandardMaterial({ color: 0xFFDD88, emissive: 0xFFAA22, emissiveIntensity: 3 });

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x = Math.sin(angle) * poleR;
    const z = Math.cos(angle) * poleR;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 9, 6), poleMatSteel);
    pole.position.set(x, 4.5, z);
    scene.add(pole);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 1.2), glowMat);
    head.position.set(x - Math.sin(angle) * 1.2, 9.2, z - Math.cos(angle) * 1.2);
    scene.add(head);

    // Actual point light (only add some to keep performance)
    if (i % 3 === 0) {
      const pl = new THREE.PointLight(0xFFCC66, 1.5, 35);
      pl.position.set(x - Math.sin(angle) * 1.2, 9, z - Math.cos(angle) * 1.2);
      scene.add(pl);
    }
  }
}

function buildCheckpoints() {
  // Four checkpoint angles around the oval (atan2(x, z) space)
  // Cars must pass Q1 → Q2 → Q3 before lap counts
  return [
    { angle: Math.PI / 2,       cleared: false }, // right
    { angle: Math.PI,           cleared: false }, // back
    { angle: Math.PI * 3 / 2,  cleared: false }, // left
  ];
}

export function updateLapProgress(carPos, lapState) {
  const { checkpoints } = lapState;
  // Current angle: 0 at front (+Z), increases clockwise
  const rawAngle = Math.atan2(carPos.x, carPos.z);
  // Map to [0, 2π] clockwise
  const angle = ((rawAngle) + Math.PI * 2) % (Math.PI * 2);

  // ── Checkpoint clearing ──
  const nextCP = checkpoints.findIndex(cp => !cp.cleared);
  if (nextCP !== -1) {
    const cp = checkpoints[nextCP];
    const diff = Math.abs(angle - cp.angle);
    if (diff < 0.4 || diff > Math.PI * 2 - 0.4) {
      cp.cleared = true;
    }
  }

  // ── Lap complete detection ──
  // Detect crossing angle 0 (front of oval) from the last sector
  const wasNear = lapState.wasNearFinish;
  const isNear = angle < 0.35 || angle > Math.PI * 2 - 0.35;
  lapState.wasNearFinish = isNear;

  const allCleared = checkpoints.every(cp => cp.cleared);
  if (isNear && !wasNear && allCleared && lapState.lapStarted) {
    checkpoints.forEach(cp => { cp.cleared = false; });
    lapState.lap++;
    return true; // lap completed
  }

  if (!lapState.lapStarted && !isNear) lapState.lapStarted = true;
  return false;
}

export function initialLapState() {
  return {
    lap: 1,
    wasNearFinish: true, // start at finish line
    lapStarted: false,
    checkpoints: [
      { angle: Math.PI / 2, cleared: false },
      { angle: Math.PI,     cleared: false },
      { angle: Math.PI * 3 / 2, cleared: false },
    ],
  };
}
