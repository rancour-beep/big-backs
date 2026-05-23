// ─── AI opponents ────────────────────────────────────────────────────────────
// Waypoint-following bots that drive around the oval — each bot inherits a
// "personality" from the character stats: top speed, drift tendency, NOS use.
import * as THREE from 'three';
import { CarController }                       from './CarController.js';
import { buildCarMesh, applyCarCustomization } from './CarMesh.js';
import { TRACK, CHARACTERS, CAR_CONFIGS }      from './config.js';
import { initialLapState, updateLapProgress }  from './Track.js';

const WORLD_X = new THREE.Vector3(1, 0, 0);

export class AIBot {
  constructor(scene, character, startOffset) {
    this.character = character;
    this.cfg       = CAR_CONFIGS[character.car];

    // ── Personality (derived from character stats with random jitter) ──
    this.aggression = 0.82 + character.stats.speed * 0.020 + Math.random() * 0.06;   // 0.85-1.05
    this.driftiness = character.stats.drift / 10;                                     // 0.4-1.0
    this.nosChance  = 0.002 + character.stats.speed * 0.0008;                         // per-frame trigger
    this.skill      = 0.88 + character.stats.handling * 0.012 + Math.random() * 0.04; // 0.9-1.05

    // Start position — staggered behind player on the start line
    const lateralOffset = (startOffset % 2 === 0 ? -1 : 1) * 1.6;
    const back           = 2.5 + (startOffset * 1.4);
    const startPos = new THREE.Vector3(lateralOffset, 0, TRACK.centerR + back);
    this.controller = new CarController(this.cfg, startPos, Math.PI / 2);
    this.controller.frozen = true;

    // Visual mesh
    this.mesh = buildCarMesh(this.cfg, character.hex);
    applyCarCustomization(this.mesh, {
      paintColor: character.hex,
      rimColor:   '#C8C8C8',
      neonColor:  character.hex,
    });
    this.mesh.position.copy(this.controller.position);
    this.mesh.rotation.y = this.controller.angle;
    scene.add(this.mesh);

    this.lapState   = initialLapState();
    this.finished   = false;
    this.finishTime = 0;
    this.input      = { throttle:false, brake:false, steerL:false, steerR:false, drift:false, nos:false };
  }

  start() { this.controller.frozen = false; }

  update(dt, raceTime) {
    if (this.finished || this.controller.frozen) return;

    this._computeInput();
    this.controller.input = this.input;
    this.controller.update(dt);

    // Sync mesh
    this.mesh.position.copy(this.controller.position);
    this.mesh.rotation.y = this.controller.angle;

    // Wheel spin (visual)
    if (this.mesh.wheels) {
      const spin = this.controller.wheelDelta / this.cfg.wheelR;
      this.mesh.wheels.forEach(w => w.rotateOnWorldAxis(WORLD_X, spin));
    }

    // Body roll while turning
    const steerMag = (this.input.steerL ? -1 : 0) + (this.input.steerR ? 1 : 0);
    const roll = steerMag * Math.min(1, this.controller.speed / 22) * 0.05;
    this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z || 0, -roll, 0.12);

    // Lap detection (each bot tracks its own laps)
    const lapDone = updateLapProgress(this.controller.position, this.lapState);
    if (lapDone && this.lapState.lap > TRACK.totalLaps) {
      this.finished   = true;
      this.finishTime = raceTime;
      this.controller.frozen = true;
    }
  }

  // ── AI brain ───────────────────────────────────────────────────────────────
  _computeInput() {
    const pos    = this.controller.position;
    const angle  = this.controller.angle;
    const speed  = this.controller.speed;
    const cfg    = this.cfg;

    // Look ahead along the oval centerline (clockwise = increasing atan2(x,z))
    const here   = Math.atan2(pos.x, pos.z);
    const lookM  = 16 + speed * 0.35;
    const aheadΔ = lookM / TRACK.centerR;
    const goal   = here + aheadΔ;

    // Racing line: cut slightly to inner radius on tight sections (cosmetic)
    const lineR  = TRACK.centerR - Math.sin(goal * 2) * 4;
    const tx     = Math.sin(goal) * lineR;
    const tz     = Math.cos(goal) * lineR;

    // Steer toward target point
    const dx     = tx - pos.x;
    const dz     = tz - pos.z;
    const aimθ   = Math.atan2(dx, dz);
    let diff     = aimθ - angle;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    const TURN_GATE = 0.035;
    this.input.steerL = diff < -TURN_GATE;
    this.input.steerR = diff >  TURN_GATE;

    // Throttle / brake based on turn severity + target speed
    const severity     = Math.abs(diff);
    const targetSpeed  = cfg.topSpeed * this.aggression;
    const wantBrake    = severity > 0.55 && speed > targetSpeed * 0.5;
    const wantThrottle = severity < 0.35 || speed < targetSpeed * 0.55;

    this.input.brake    = wantBrake;
    this.input.throttle = !wantBrake && wantThrottle;

    // Drift on big corners if the character drifts a lot
    this.input.drift = this.driftiness > 0.65 && severity > 0.28 && speed > 24;

    // NOS in straights when tank is full
    if (this.controller.nos > 55 && severity < 0.2 && Math.random() < this.nosChance) {
      this.input.nos = true;
    } else if (this.controller.nos < 8 || severity > 0.3) {
      this.input.nos = false;
    }

    // Skill imperfection — occasional wobble keeps it from feeling robotic
    if (this.skill < 0.95 && Math.random() < 0.012) {
      this.input.steerL = !this.input.steerL;
      this.input.steerR = !this.input.steerR;
    }
  }

  // Total race progress (used for live leaderboard position)
  progress() {
    const a = Math.atan2(this.controller.position.x, this.controller.position.z);
    const norm = ((a) + Math.PI * 2) % (Math.PI * 2);
    return (this.lapState.lap - 1) * (Math.PI * 2) + norm;
  }

  remove(scene) { scene.remove(this.mesh); }
}

// Spawn N bots from characters NOT matching the player's character.
export function spawnBots(scene, playerCharId, count = 3) {
  const pool = CHARACTERS.filter(c => c.id !== playerCharId);
  // Shuffle in place
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).map((c, i) => new AIBot(scene, c, i));
}

// Helper for the main loop: rank player + bots and return [{name, place, progress, finished}, ...]
export function computeRanking(player, playerLapState, raceTime, bots) {
  const all = [
    {
      name: 'YOU',
      progress: ((Math.atan2(player.position.x, player.position.z) + Math.PI * 2) % (Math.PI * 2))
                + (playerLapState.lap - 1) * Math.PI * 2,
      finished: false,
      finishTime: 0,
      isPlayer: true,
    },
    ...bots.map(b => ({
      name: b.character.name,
      progress: b.progress(),
      finished: b.finished,
      finishTime: b.finishTime,
      character: b.character,
      isPlayer: false,
    })),
  ];
  // Finished racers ranked first by finish time; ongoing ones by progress
  all.sort((a, b) => {
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.progress - a.progress;
  });
  all.forEach((r, i) => r.place = i + 1);
  return all;
}
