import * as THREE from 'three';
import { TRACK } from './config.js';

export class CarController {
  constructor(carCfg, startPos, startAngle) {
    this.cfg = carCfg;

    // World state
    this.position = startPos.clone();
    this.angle    = startAngle; // Y-axis rotation, 0 = facing +Z
    this.velocity = new THREE.Vector3();

    // Derived
    this.speed       = 0;   // m/s (always positive, sign from vFwd)
    this.grip        = carCfg.normalGrip;
    this.nos         = carCfg.nosCapacity;
    this.isDrifting  = false;
    this.driftScore  = 0;   // accumulated drift angle for bonus
    this.gear        = 1;

    // Input — set by InputHandler or AI
    this.input = { throttle:false, brake:false, steerL:false, steerR:false, drift:false, nos:false };

    this.frozen = true; // set to false after countdown
  }

  update(dt) {
    if (this.frozen) return;
    const { cfg, input } = this;
    dt = Math.min(dt, 0.05); // clamp to avoid physics explosions

    // ── Local axes ──
    const fwd = new THREE.Vector3(Math.sin(this.angle), 0, Math.cos(this.angle));
    const right = new THREE.Vector3(Math.cos(this.angle), 0, -Math.sin(this.angle));

    // ── Project velocity onto local space ──
    let vFwd  = this.velocity.dot(fwd);
    let vSide = this.velocity.dot(right);

    // ── Throttle / brake ──
    const nosActive = input.nos && this.nos > 0;
    const topSpd = cfg.topSpeed * (nosActive ? 1.38 : 1);

    if (input.throttle) {
      vFwd += cfg.accel * dt;
    }
    if (input.brake) {
      if (vFwd > 0.5)       vFwd -= cfg.brake * dt;
      else if (vFwd > -cfg.reverseMax) vFwd -= (cfg.accel * 0.6) * dt; // reverse
    }
    if (!input.throttle && !input.brake) {
      vFwd *= (1 - cfg.drag * 60 * dt);
    }
    vFwd = Math.max(-cfg.reverseMax, Math.min(topSpd, vFwd));

    // ── Steering ──
    const steer = (input.steerL ? -1 : 0) + (input.steerR ? 1 : 0);
    const speedFactor = Math.min(1, Math.abs(vFwd) / 12);
    const turnDir = (vFwd >= 0 ? 1 : -1);
    this.angle += steer * cfg.steerSpeed * speedFactor * turnDir * dt;

    // ── Drift grip ──
    const wantDrift = input.drift && Math.abs(vFwd) > 8;
    if (wantDrift) this.grip = Math.max(cfg.driftGrip, this.grip - 4 * dt);
    else           this.grip = Math.min(cfg.normalGrip, this.grip + 5 * dt);

    this.isDrifting = this.grip < (cfg.normalGrip + cfg.driftGrip) / 2 && Math.abs(vSide) > 2;

    // ── Lateral friction (the KEY to drift feel) ──
    const lateralKill = this.grip * Math.min(1, 55 * dt);
    vSide *= (1 - lateralKill);

    // ── NOS ──
    if (nosActive) {
      vFwd = Math.min(topSpd, vFwd + cfg.nosBoost * dt);
      this.nos = Math.max(0, this.nos - 25 * dt);
    } else {
      this.nos = Math.min(cfg.nosCapacity, this.nos + 5 * dt);
    }

    // ── Reconstruct world velocity ──
    // Recalculate axes after turning
    const newFwd   = new THREE.Vector3(Math.sin(this.angle), 0, Math.cos(this.angle));
    const newRight = new THREE.Vector3(Math.cos(this.angle), 0, -Math.sin(this.angle));
    this.velocity = newFwd.clone().multiplyScalar(vFwd).add(newRight.clone().multiplyScalar(vSide));

    // ── Move ──
    this.position.addScaledVector(this.velocity, dt);

    // ── Wall collision ──
    this.resolveWalls();

    // ── Speed & gear ──
    this.speed = Math.abs(vFwd);
    this.gear  = Math.max(1, Math.min(6, Math.ceil(this.speed / (cfg.topSpeed / 6))));

    // ── Drift score ──
    if (this.isDrifting) this.driftScore += Math.abs(vSide) * dt;

    // ── Wheel spin delta for tyre rotation ──
    this.wheelDelta = vFwd * dt;
  }

  resolveWalls() {
    const { innerR, outerR } = TRACK;
    const carW = this.cfg.bW / 2 + 0.2;
    const dist = Math.sqrt(this.position.x ** 2 + this.position.z ** 2);
    const nx = this.position.x / dist;
    const nz = this.position.z / dist;

    if (dist > outerR - carW) {
      this.position.x = nx * (outerR - carW);
      this.position.z = nz * (outerR - carW);
      // Bounce / kill radial velocity
      const radialV = this.velocity.x * nx + this.velocity.z * nz;
      if (radialV > 0) {
        this.velocity.x -= radialV * nx * 1.4;
        this.velocity.z -= radialV * nz * 1.4;
      }
    }
    if (dist < innerR + carW) {
      this.position.x = nx * (innerR + carW);
      this.position.z = nz * (innerR + carW);
      const radialV = this.velocity.x * nx + this.velocity.z * nz;
      if (radialV < 0) {
        this.velocity.x -= radialV * nx * 1.4;
        this.velocity.z -= radialV * nz * 1.4;
      }
    }
  }

  speedMPH() { return this.speed * 2.237; }
}

// ── Keyboard input handler ────────────────────────────────────────────────────
export class InputHandler {
  constructor() {
    this.keys = {};
    window.addEventListener('keydown', e => { this.keys[e.code] = true; e.preventDefault && ['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code) && e.preventDefault(); });
    window.addEventListener('keyup',   e => { this.keys[e.code] = false; });

    // Touch buttons
    this._bindTouch('tc-left',  'steerL');
    this._bindTouch('tc-right', 'steerR');
    this._bindTouch('tc-gas',   'throttle');
    this._bindTouch('tc-brake', 'brake');
    this._bindTouch('tc-nos',   'nos');
    this._bindTouch('tc-drift', 'drift');
  }

  _bindTouch(id, action) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('touchstart', () => { this.keys['touch_' + action] = true; }, { passive:true });
    el.addEventListener('touchend',   () => { this.keys['touch_' + action] = false; });
  }

  getInput() {
    const k = this.keys;
    return {
      throttle: !!(k['ArrowUp']    || k['KeyW'] || k['touch_throttle']),
      brake:    !!(k['ArrowDown']  || k['KeyS'] || k['touch_brake']),
      steerL:   !!(k['ArrowLeft']  || k['KeyA'] || k['touch_steerL']),
      steerR:   !!(k['ArrowRight'] || k['KeyD'] || k['touch_steerR']),
      drift:    !!(k['ShiftLeft']  || k['ShiftRight'] || k['Space'] || k['touch_drift']),
      nos:      !!(k['KeyX'] || k['touch_nos']),
    };
  }
}
