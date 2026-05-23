// ─── Firebase Multiplayer Adapter ────────────────────────────────────────────
// Works only when window.FIRE is populated (from firebase-config.js).
// Falls back silently to single-player if Firebase is unavailable.

import { buildCarMesh, applyCarCustomization } from './CarMesh.js';
import { CAR_CONFIGS } from './config.js';

// ── Is Firebase ready? ───────────────────────────────────────────────────────
export function firebaseReady() {
  return (
    typeof firebase !== 'undefined' &&
    typeof window.FIRE !== 'undefined' &&
    window.FIRE.apiKey &&
    window.FIRE.apiKey !== 'PASTE_YOUR_API_KEY'
  );
}

function db() { return firebase.database(); }

// ── Room management ──────────────────────────────────────────────────────────
export async function createRoom() {
  if (!firebaseReady()) throw new Error('Firebase not configured');
  const roomId = Math.random().toString(36).slice(2, 8).toUpperCase();
  await db().ref(`races/${roomId}`).set({
    state:        'lobby',
    createdAt:    firebase.database.ServerValue.TIMESTAMP,
    countdownEnd: 0,
  });
  return roomId;
}

export async function joinRoom(roomId) {
  if (!firebaseReady()) throw new Error('Firebase not configured');
  const snap = await db().ref(`races/${roomId}`).get();
  if (!snap.exists()) throw new Error('Room not found');
  return snap.val();
}

export async function roomExists(roomId) {
  if (!firebaseReady()) return false;
  const snap = await db().ref(`races/${roomId}`).get();
  return snap.exists();
}

// ── Player presence ──────────────────────────────────────────────────────────
export function registerPlayer(roomId, playerId, playerData) {
  const ref = db().ref(`races/${roomId}/players/${playerId}`);
  ref.set({ ...playerData, lastSeen: firebase.database.ServerValue.TIMESTAMP });
  // Auto-remove on disconnect
  ref.onDisconnect().remove();
}

export function updatePlayerPos(roomId, playerId, pos) {
  db().ref(`races/${roomId}/players/${playerId}`).update({
    x: +(pos.x.toFixed(2)),
    z: +(pos.z.toFixed(2)),
    angle: +(pos.angle.toFixed(3)),
    lap:   pos.lap,
    speed: +(pos.speed.toFixed(1)),
    lastSeen: firebase.database.ServerValue.TIMESTAMP,
  });
}

export function markFinished(roomId, playerId, finishTime) {
  db().ref(`races/${roomId}/players/${playerId}`).update({
    finished:   true,
    finishTime: finishTime,
  });
}

// ── Race state sync ───────────────────────────────────────────────────────────
export function startCountdown(roomId) {
  const countdownEnd = Date.now() + 4000; // 4 sec from now
  db().ref(`races/${roomId}`).update({ state:'countdown', countdownEnd });
}

export function watchRoomState(roomId, onChange) {
  return db().ref(`races/${roomId}/state`).on('value', snap => {
    onChange(snap.val());
  });
}

export function watchCountdownEnd(roomId, onChange) {
  return db().ref(`races/${roomId}/countdownEnd`).on('value', snap => {
    onChange(snap.val());
  });
}

export function watchPlayers(roomId, onChange) {
  return db().ref(`races/${roomId}/players`).on('value', snap => {
    onChange(snap.val() || {});
  });
}

export function offPlayers(roomId) {
  db().ref(`races/${roomId}/players`).off();
}

// ── Ghost car manager ─────────────────────────────────────────────────────────
export class GhostManager {
  constructor(scene, localPlayerId) {
    this.scene   = scene;
    this.localId = localPlayerId;
    this.ghosts  = {}; // playerId → { mesh, targetPos, targetAngle, ... }
  }

  update(playersData, dt) {
    const ids = new Set(Object.keys(playersData));

    // Add/update ghosts
    ids.forEach(id => {
      if (id === this.localId) return;
      const data = playersData[id];
      if (!data || data.finished) return;

      if (!this.ghosts[id]) {
        this._addGhost(id, data);
      }
      const g = this.ghosts[id];
      g.targetX     = data.x     || 0;
      g.targetZ     = data.z     || 0;
      g.targetAngle = data.angle || 0;
      g.lap         = data.lap   || 1;
      g.nameTag?.children[0] && (g.nameTag.children[0].element.textContent = `${data.name} L${g.lap}`);
    });

    // Lerp ghost positions each frame
    Object.entries(this.ghosts).forEach(([id, g]) => {
      if (!ids.has(id)) {
        this._removeGhost(id);
        return;
      }
      g.mesh.position.x = THREE.MathUtils.lerp(g.mesh.position.x, g.targetX, 8 * dt);
      g.mesh.position.z = THREE.MathUtils.lerp(g.mesh.position.z, g.targetZ, 8 * dt);
      // Angle lerp (shortest path)
      let da = g.targetAngle - g.mesh.rotation.y;
      while (da >  Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      g.mesh.rotation.y += da * 8 * dt;
    });
  }

  _addGhost(id, data) {
    const cfg  = CAR_CONFIGS[data.car || 'SPORTS'];
    const mesh = buildCarMesh(cfg, data.color || '#AAAAAA');
    applyCarCustomization(mesh, {
      paintColor: data.color || '#AAAAAA',
      rimColor:   data.rimColor || '#CCCCCC',
      neonColor:  data.neonColor || data.color || '#AAAAAA',
    });
    // Semi-transparent ghost effect
    mesh.traverse(obj => {
      if (obj.isMesh && obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(m => { m.transparent = true; m.opacity = 0.72; });
      }
    });
    mesh.position.set(data.x || 0, 0, data.z || 0);
    mesh.rotation.y = data.angle || 0;
    this.scene.add(mesh);
    this.ghosts[id] = { mesh, targetX: data.x||0, targetZ: data.z||0, targetAngle: data.angle||0, lap: 1 };
  }

  _removeGhost(id) {
    if (this.ghosts[id]) {
      this.scene.remove(this.ghosts[id].mesh);
      delete this.ghosts[id];
    }
  }

  dispose() {
    Object.keys(this.ghosts).forEach(id => this._removeGhost(id));
  }

  // Get sorted finish leaderboard
  static buildLeaderboard(playersData) {
    return Object.values(playersData)
      .filter(p => p.finished)
      .sort((a, b) => a.finishTime - b.finishTime);
  }
}
