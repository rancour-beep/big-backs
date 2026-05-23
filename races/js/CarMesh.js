import * as THREE from 'three';

export function buildCarMesh(cfg, hexColor) {
  const group = new THREE.Group();
  const color = new THREE.Color(hexColor);

  // ── Materials ──────────────────────────────────────────────────────────────
  const bodyMat = new THREE.MeshStandardMaterial({ color, metalness:0.9, roughness:0.15 });
  const glassMat = new THREE.MeshStandardMaterial({ color:0x88CCFF, metalness:0.1, roughness:0.05, transparent:true, opacity:0.5 });
  const tireMat  = new THREE.MeshStandardMaterial({ color:0x111111, metalness:0, roughness:0.95 });
  const rimMat   = new THREE.MeshStandardMaterial({ color:0xCCCCCC, metalness:0.9, roughness:0.1 });
  const darkMat  = new THREE.MeshStandardMaterial({ color:0x0D0D0D, metalness:0.3, roughness:0.7 });
  const headMat  = new THREE.MeshStandardMaterial({ color:0xFFFFEE, emissive:0xFFFFCC, emissiveIntensity:4 });
  const tailMat  = new THREE.MeshStandardMaterial({ color:0xFF0000, emissive:0xFF2200, emissiveIntensity:5 });
  const neonMat  = new THREE.MeshStandardMaterial({ color:hexColor, emissive:hexColor, emissiveIntensity:2.2, transparent:true, opacity:0.88 });

  const { bL, bW, bH, rL, rW, rH, wheelR, wheelW } = cfg;

  // ── Body parts (all using bodyMat — tracked for paint changes) ─────────────
  group.bodyMeshes = [];

  const add = (geo, mat, x=0, y=0, z=0, rx=0, ry=0, rz=0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = m.receiveShadow = true;
    group.add(m);
    return m;
  };

  const addBody = (geo, y=0, z=0, scale=[1,1,1]) => {
    const m = new THREE.Mesh(geo, bodyMat);
    m.position.set(0, y, z);
    m.scale.set(...scale);
    m.castShadow = m.receiveShadow = true;
    group.add(m);
    group.bodyMeshes.push(m);
    return m;
  };

  const bodyY  = wheelR + bH * 0.5;
  const cabinY = wheelR + bH + rH * 0.5;

  // Main body
  group.bodyMesh = addBody(new THREE.BoxGeometry(bW, bH, bL), bodyY);

  // Front bumper taper
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(bW * 0.9, bH * 0.6, 0.4), bodyMat);
  frontBumper.position.set(0, wheelR + bH * 0.3, bL * 0.5 + 0.18);
  frontBumper.castShadow = true;
  group.add(frontBumper);
  group.bodyMeshes.push(frontBumper);

  // Rear bumper
  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(bW * 0.88, bH * 0.6, 0.4), bodyMat);
  rearBumper.position.set(0, wheelR + bH * 0.3, -bL * 0.5 - 0.18);
  rearBumper.castShadow = true;
  group.add(rearBumper);
  group.bodyMeshes.push(rearBumper);

  // Cabin / roof
  addBody(new THREE.BoxGeometry(rW, rH, rL), cabinY, 0.04 * bL);

  // Side skirts
  [-1, 1].forEach(side => {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.12, bH * 0.4, bL * 0.9), bodyMat);
    skirt.position.set(side * (bW * 0.5 + 0.06), wheelR + bH * 0.2, 0);
    skirt.castShadow = true;
    group.add(skirt);
    group.bodyMeshes.push(skirt);
  });

  // ── Glass ──────────────────────────────────────────────────────────────────
  [
    { z: rL * 0.5,  tiltX: -0.18 },
    { z: -rL * 0.5, tiltX:  0.18 },
  ].forEach(({ z, tiltX }) => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(rW - 0.18, rH * 0.7, 0.06), glassMat);
    win.position.set(0, cabinY, z);
    win.rotation.x = tiltX;
    group.add(win);
  });

  // ── Headlights ─────────────────────────────────────────────────────────────
  group.headlightMeshes = [];
  [-bW*0.3, bW*0.3].forEach(x => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.1), headMat);
    hl.position.set(x, wheelR + bH * 0.72, bL * 0.5 + 0.08);
    group.add(hl);
    group.headlightMeshes.push(hl);
  });

  // ── Tail lights ────────────────────────────────────────────────────────────
  const tl = new THREE.Mesh(new THREE.BoxGeometry(bW * 0.78, 0.13, 0.08), tailMat);
  tl.position.set(0, wheelR + bH * 0.68, -bL * 0.5 - 0.06);
  group.add(tl);

  // ── Neon underglow ─────────────────────────────────────────────────────────
  group.neonMesh = new THREE.Mesh(new THREE.BoxGeometry(bW * 0.9, 0.05, bL * 0.85), neonMat);
  group.neonMesh.position.set(0, wheelR * 0.25, 0);
  group.add(group.neonMesh);

  // ── Spoiler ────────────────────────────────────────────────────────────────
  const spoilerH = bH * 0.65;
  const spWing = new THREE.Mesh(new THREE.BoxGeometry(bW * 0.88, 0.08, 0.44), darkMat);
  spWing.position.set(0, wheelR + bH + spoilerH, -bL * 0.46);
  const spL = new THREE.Mesh(new THREE.BoxGeometry(0.09, spoilerH, 0.22), darkMat);
  spL.position.set(-bW * 0.38, wheelR + bH + spoilerH * 0.5, -bL * 0.46);
  const spR = spL.clone(); spR.position.x = bW * 0.38;
  group.add(spWing, spL, spR);

  // ── Wheels ─────────────────────────────────────────────────────────────────
  // Bake horizontal orientation into geometry so rotation.x = spin, rotation.y = steer
  const tirGeo = new THREE.CylinderGeometry(wheelR, wheelR, wheelW, 22);
  tirGeo.rotateZ(Math.PI / 2);   // cylinder axis → world X
  const rimGeo = new THREE.CylinderGeometry(wheelR * 0.58, wheelR * 0.58, wheelW + 0.02, 12);
  rimGeo.rotateZ(Math.PI / 2);
  const hubGeo = new THREE.CylinderGeometry(wheelR * 0.2, wheelR * 0.2, wheelW + 0.06, 8);
  hubGeo.rotateZ(Math.PI / 2);
  const brakeGeo = new THREE.CylinderGeometry(wheelR * 0.35, wheelR * 0.35, wheelW * 0.6, 8);
  brakeGeo.rotateZ(Math.PI / 2);

  const WPs = [
    { x: bW * 0.54, z:  bL * 0.35 },  // FL
    { x:-bW * 0.54, z:  bL * 0.35 },  // FR
    { x: bW * 0.54, z: -bL * 0.35 },  // RL
    { x:-bW * 0.54, z: -bL * 0.35 },  // RR
  ];

  group.wheels    = [];
  group.rimMeshes = [];

  WPs.forEach(wp => {
    const wg = new THREE.Group();
    wg.position.set(wp.x, wheelR, wp.z);
    // NO rotation here — geometry is baked
    const tire  = new THREE.Mesh(tirGeo, tireMat);
    const rim   = new THREE.Mesh(rimGeo, rimMat);
    const hub   = new THREE.Mesh(hubGeo, darkMat);
    const brake = new THREE.Mesh(brakeGeo, new THREE.MeshStandardMaterial({ color:0x883300, metalness:0.6, roughness:0.5 }));
    tire.castShadow = rim.castShadow = true;
    wg.add(tire, rim, hub, brake);
    group.add(wg);
    group.wheels.push(wg);
    group.rimMeshes.push(rim);
  });

  // ── Exhaust tips ───────────────────────────────────────────────────────────
  [-0.3, 0.3].forEach(xOff => {
    const exh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.3, 7), darkMat);
    exh.rotation.x = Math.PI / 2;
    exh.position.set(xOff * bW, wheelR + 0.1, -bL * 0.52);
    group.add(exh);
  });

  return group;
}

// ── Smoke / exhaust particles ─────────────────────────────────────────────────
export function buildSmokeSystem(scene) {
  const COUNT  = 150;
  const geo    = new THREE.BufferGeometry();
  const pos    = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) pos[i*3] = 9999;
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  const mat = new THREE.PointsMaterial({ color:0xBBBBBB, size:1.4, transparent:true, opacity:0.4, sizeAttenuation:true, depthWrite:false });
  const pts = new THREE.Points(geo, mat);
  pts.renderOrder = 999;
  scene.add(pts);

  const particles = Array.from({ length:COUNT }, () =>
    ({ alive:false, x:0,y:0,z:0, vx:0,vy:0,vz:0, life:0, maxLife:0 })
  );
  let ptr = 0;

  return {
    emit(x, y, z) {
      const p = particles[ptr++ % COUNT];
      p.alive = true; p.x=x; p.y=y; p.z=z;
      p.vx=(Math.random()-0.5)*1.8; p.vy=0.6+Math.random()*1.2; p.vz=(Math.random()-0.5)*1.8;
      p.life=0; p.maxLife=0.7+Math.random()*0.8;
    },
    update(dt) {
      const arr = geo.attributes.position.array;
      particles.forEach((p, i) => {
        if (!p.alive) { arr[i*3]=9999; return; }
        p.life += dt;
        if (p.life >= p.maxLife) { p.alive=false; return; }
        p.x+=p.vx*dt; p.y+=p.vy*dt; p.z+=p.vz*dt; p.vy-=0.5*dt;
        arr[i*3]=p.x; arr[i*3+1]=p.y; arr[i*3+2]=p.z;
      });
      geo.attributes.position.needsUpdate = true;
    }
  };
}

// Apply colour / material changes live (used by Garage)
export function applyCarCustomization(carMesh, { paintColor, rimColor, neonColor }) {
  if (!carMesh) return;
  if (paintColor && carMesh.bodyMeshes) {
    const c = new THREE.Color(paintColor);
    carMesh.bodyMeshes.forEach(m => m.material.color.copy(c));
  }
  if (rimColor && carMesh.rimMeshes) {
    const c = new THREE.Color(rimColor);
    carMesh.rimMeshes.forEach(m => m.material.color.copy(c));
  }
  if (neonColor && carMesh.neonMesh) {
    const c = new THREE.Color(neonColor);
    carMesh.neonMesh.material.color.copy(c);
    carMesh.neonMesh.material.emissive.copy(c);
  }
}
