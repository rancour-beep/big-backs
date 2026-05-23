import * as THREE from 'three';
import { CAR_CONFIGS, TRACK, CHARACTERS }              from './config.js';
import { createScene }                                  from './SceneSetup.js';
import { buildTrack, updateLapProgress, initialLapState } from './Track.js';
import { buildCarMesh, buildSmokeSystem, applyCarCustomization } from './CarMesh.js';
import { CarController, InputHandler }                  from './CarController.js';
import { HUD }                                          from './HUD.js';
import { Lobby }                                        from './Lobby.js';
import { Garage, loadGarageSettings }                   from './Garage.js';
import { GameAudio }                                    from './Audio.js';
import { firebaseReady, createRoom, joinRoom, registerPlayer,
         updatePlayerPos, markFinished, watchPlayers, watchCountdownEnd,
         startCountdown, GhostManager }                 from './Firebase.js';
import { spawnBots, computeRanking }                    from './AIBot.js';

// ─── State ────────────────────────────────────────────────────────────────────
const S = { LOBBY:0, GARAGE:1, LOADING:2, COUNTDOWN:3, RACING:4, FINISHED:5 };
let state = S.LOBBY;

let sceneData, car, carMesh, smoke, audio, hud, lapState, input;
let ghosts = null;
let bots = [];
let myPlace = 1;
let raceTime = 0, lastTs = 0;
let cdVal = 3, cdTimer = 0, cdSynced = false;
let selectedChar = null, garageSettings = null;
let garage = null;
let roomId = null, myPlayerId = null, isHost = false;
let posUpdateTimer = 0;
const WORLD_X = new THREE.Vector3(1, 0, 0);

// ─── Multiplayer room from URL ─────────────────────────────────────────────
const urlRoom = new URLSearchParams(location.search).get('room');

// ─── Boot lobby ───────────────────────────────────────────────────────────
new Lobby(null, startLoading, (char) => {
  // Fires whenever a character card is clicked in the lobby
  selectedChar = char;
  const gBtn = document.getElementById('open-garage-btn');
  if (gBtn) { gBtn.disabled = false; gBtn.style.setProperty('--btn-color', char.hex); }
});
buildOnlineUI();

// ← LOBBY button (garage header) — goes back to lobby (saves garage settings)
document.getElementById('lobby-back-btn').addEventListener('click', closeGarage);
// 🏁 RACE! button (garage header) — save garage settings + start the race directly
document.getElementById('garage-back-btn').addEventListener('click', () => {
  if (!selectedChar) { closeGarage(); return; }
  if (garage) {
    garageSettings = garage.getSettings();
    garage.unmount();
    garage = null;
  }
  startLoading(selectedChar);
});
// ← LOBBY button (in-game) — exit the race back to the lobby
document.getElementById('exit-race-btn').addEventListener('click', exitRace);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && (state === S.COUNTDOWN || state === S.RACING || state === S.FINISHED)) {
    exitRace();
  }
});

function exitRace() {
  if (!confirm('Exit the race? You\'ll lose your progress.')) return;
  // Brute-force clean reload — guarantees no orphaned WebGL contexts, audio, or timers
  // (without resetting localStorage, so profile + garage + activity are preserved)
  location.reload();
}

// ─── Audio unlock ────────────────────────────────────────────────────────
['click','touchstart','keydown'].forEach(e =>
  document.addEventListener(e, () => audio?.ctx?.state === 'suspended' && audio.ctx.resume(), { once:true, passive:true })
);

// ─── Online lobby UI ─────────────────────────────────────────────────────
function buildOnlineUI() {
  const panel = document.getElementById('online-panel');
  if (!firebaseReady()) {
    panel.innerHTML = `<div class="op-info">Multiplayer: add Firebase config to enable ♡</div>`;
    return;
  }
  panel.innerHTML = `
    <button class="op-btn" id="op-create">🌐 Create Room</button>
    <div class="op-or">or</div>
    <div class="op-join-row">
      <input id="op-code" class="op-input" placeholder="ENTER CODE" maxlength="6" />
      <button class="op-btn" id="op-join">Join</button>
    </div>
    <div class="op-status" id="op-status"></div>
  `;
  document.getElementById('op-create').addEventListener('click', async () => {
    const id = await createRoom();
    roomId = id; isHost = true;
    const url = `${location.origin}${location.pathname}?room=${id}`;
    document.getElementById('op-status').innerHTML = `Room: <strong>${id}</strong> <button onclick="navigator.clipboard.writeText('${url}').then(()=>{})" class="op-copy-btn">📋 Copy Link</button>`;
  });
  document.getElementById('op-join').addEventListener('click', async () => {
    const code = document.getElementById('op-code').value.toUpperCase().trim();
    if (!code) return;
    try {
      await joinRoom(code);
      roomId = code; isHost = false;
      document.getElementById('op-status').textContent = `✓ Joined room ${code}`;
    } catch {
      document.getElementById('op-status').textContent = 'Room not found!';
    }
  });

  // Auto-join from URL
  if (urlRoom && firebaseReady()) {
    roomId = urlRoom; isHost = false;
    document.getElementById('op-status').textContent = `Auto-joined room ${urlRoom}`;
  }
}

// ─── Garage ───────────────────────────────────────────────────────────────
document.getElementById('open-garage-btn')?.addEventListener('click', () => {
  if (!selectedChar) return;
  openGarage();
});

function openGarage() {
  switchScreen('garage');
  state = S.GARAGE;
  garage = new Garage(selectedChar, () => {
    garageSettings = garage.getSettings();
    closeGarage();
  });
  garage.mount();
}

function closeGarage() {
  if (garage) {
    garageSettings = garage.getSettings();
    garage.unmount();
    garage = null;
  }
  switchScreen('lobby');
  state = S.LOBBY;
}

// ─── Race start ───────────────────────────────────────────────────────────
async function startLoading(char) {
  selectedChar = char;
  state = S.LOADING;
  switchScreen('loading');

  // Load garage settings
  garageSettings = loadGarageSettings(char.id) || {
    carType:    char.car,
    paintColor: char.hex,
    rimColor:   '#CCCCCC',
    neonColor:  char.hex,
  };

  const bar = document.getElementById('loading-bar');
  const txt = document.getElementById('loading-text');
  const step = async (pct, msg) => {
    bar.style.width = pct + '%'; txt.textContent = msg;
    await tick(60);
  };

  await step( 5, 'Revving the engine...');
  sceneData = createScene();

  await step(25, 'Laying tarmac...');
  buildTrack(sceneData.scene);

  await step(48, 'Detailing your ride...');
  const cfg  = CAR_CONFIGS[garageSettings.carType];
  carMesh    = buildCarMesh(cfg, garageSettings.paintColor);
  applyCarCustomization(carMesh, garageSettings);
  sceneData.scene.add(carMesh);

  await step(62, 'Fuelling up...');
  smoke = buildSmokeSystem(sceneData.scene);

  await step(75, 'Warming tyres...');
  const startPos = new THREE.Vector3(0, 0, TRACK.centerR);
  car  = new CarController(cfg, startPos, Math.PI / 2);
  lapState  = initialLapState();
  input     = new InputHandler();
  audio     = new GameAudio();
  audio.init();
  hud       = new HUD();

  await step(88, 'Connecting...');

  // Spawn AI bots ONLY in single-player (no Firebase room)
  bots = [];
  if (!roomId) {
    bots = spawnBots(sceneData.scene, char.id, 3);
  }

  // Multiplayer setup
  if (roomId && firebaseReady()) {
    myPlayerId = `p_${Math.random().toString(36).slice(2, 10)}`;
    const playerData = {
      name:       char.name,
      car:        garageSettings.carType,
      color:      garageSettings.paintColor,
      rimColor:   garageSettings.rimColor,
      neonColor:  garageSettings.neonColor,
      x:          startPos.x,
      z:          startPos.z,
      angle:      Math.PI / 2,
      lap:        1,
      speed:      0,
      finished:   false,
      finishTime: 0,
    };
    registerPlayer(roomId, myPlayerId, playerData);
    ghosts = new GhostManager(sceneData.scene, myPlayerId);

    // Watch other players
    watchPlayers(roomId, (data) => {
      if (ghosts && state >= S.RACING) ghosts.update(data, 0);
      updateOnlineLeaderboard(data);
    });

    // Host starts race; others sync countdown via Firebase
    if (isHost) {
      setTimeout(() => startCountdown(roomId), 500);
    } else {
      watchCountdownEnd(roomId, (endTs) => {
        if (endTs && !cdSynced) {
          cdSynced = true;
          const msLeft = endTs - Date.now();
          cdTimer = Math.max(0, msLeft / 1000);
        }
      });
    }
  }

  await step(100, 'LIGHTS ON... 🔴🔴🔴');
  await tick(700);

  carMesh.position.copy(car.position);
  carMesh.rotation.y = car.angle;

  switchScreen('game');
  hud.show();
  document.getElementById('exit-race-btn').style.display = 'block';
  maybeShowTouchControls();

  state    = S.COUNTDOWN;
  cdVal    = 3;
  cdTimer  = (!roomId || isHost) ? 1.1 : 99; // host drives countdown; client waits for Firebase
  hud.showCountdown('3');
  audio.countdown(3);

  window.BigBacks?.activity.log('races', 'race_start', { character: char.name, car: garageSettings.carType });
  if (roomId) window.BigBacks?.activity.log('races', 'multiplayer', { roomId });

  if (!lastTs) requestAnimationFrame(loop);
}

// ─── Game loop ────────────────────────────────────────────────────────────
function loop(ts) {
  requestAnimationFrame(loop);
  const dt = Math.min((ts - (lastTs || ts)) / 1000, 0.05);
  lastTs = ts;
  if (state === S.COUNTDOWN) { tickCountdown(dt); sceneData?.composer.render(); }
  else if (state === S.RACING)   { tickRace(dt);      sceneData?.composer.render(); }
  else if (state === S.FINISHED) { sceneData?.composer.render(); }
}

// ─── Countdown ────────────────────────────────────────────────────────────
function tickCountdown(dt) {
  // Orbit camera for cinematic look
  const t = Date.now() / 4200;
  const cx = Math.sin(t) * 12, cz = Math.cos(t) * 12;
  sceneData.camera.position.lerp(new THREE.Vector3(cx, 5, cz + car.position.z), 0.06);
  sceneData.camera.lookAt(car.position.x, car.position.y + 1, car.position.z);

  cdTimer -= dt;
  if (cdTimer > 0) return;

  cdVal--;
  if (cdVal < 0) {
    state = S.RACING; car.frozen = false; raceTime = 0;
    bots.forEach(b => b.start());     // release the AI hounds
    hud.showCountdown('');
  } else if (cdVal === 0) {
    hud.showCountdown('GO! 🏁'); audio.countdown(0); cdTimer = 0.85;
  } else {
    hud.showCountdown(String(cdVal)); audio.countdown(cdVal); cdTimer = 1.0;
  }
}

// ─── Race tick ────────────────────────────────────────────────────────────
function tickRace(dt) {
  raceTime += dt;
  car.input = input.getInput();
  car.update(dt);

  // Sync mesh
  carMesh.position.copy(car.position);
  carMesh.rotation.y = car.angle;

  // Wheel animation — baked geometry means rotation.x = world X spin
  if (carMesh.wheels) {
    const spinDelta = car.wheelDelta * (1 / car.cfg.wheelR);
    const steer     = (car.input.steerL ? -1 : 0) + (car.input.steerR ? 1 : 0);
    carMesh.wheels.forEach((w, i) => {
      w.rotateOnWorldAxis(WORLD_X, spinDelta);   // always world-X spin
      if (i < 2) {                                // front wheels: steer angle
        w.rotation.y = THREE.MathUtils.lerp(w.rotation.y, steer * 0.45, 0.18);
      }
    });
  }

  // Car body roll while drifting / cornering
  const steer = (car.input.steerL ? -1 : 0) + (car.input.steerR ? 1 : 0);
  const roll  = steer * Math.min(1, car.speed / 20) * 0.06;
  carMesh.rotation.z = THREE.MathUtils.lerp(carMesh.rotation.z || 0, -roll, 0.12);

  // Smoke
  const nosActive = car.input.nos && car.nos > 0;
  if (car.isDrifting || nosActive) {
    const bx = -Math.sin(car.angle) * 2.5;
    const bz = -Math.cos(car.angle) * 2.5;
    smoke.emit(car.position.x + bx + (Math.random()-0.5)*0.4,
               car.position.y + 0.2,
               car.position.z + bz + (Math.random()-0.5)*0.4);
  }
  smoke.update(dt);

  // NOS tint
  const nosEl = document.getElementById('nos-screen');
  if (nosEl) nosEl.style.opacity = nosActive ? '1' : '0';

  // Lap detection
  if (updateLapProgress(car.position, lapState) && lapState.lap > TRACK.totalLaps) {
    finishRace();
    return;
  }

  // Update AI bots
  bots.forEach(b => b.update(dt, raceTime));

  // Compute live race position
  if (bots.length > 0) {
    const ranking = computeRanking(car, lapState, raceTime, bots);
    const me = ranking.find(r => r.isPlayer);
    myPlace = me ? me.place : 1;
    renderBotLeaderboard(ranking);
  }

  // Ghost car interpolation
  if (ghosts) ghosts.update({}, dt); // positions updated by watchPlayers listener

  // Send position to Firebase (every ~80 ms)
  if (roomId && myPlayerId && firebaseReady()) {
    posUpdateTimer += dt;
    if (posUpdateTimer >= 0.08) {
      posUpdateTimer = 0;
      updatePlayerPos(roomId, myPlayerId, {
        x: car.position.x, z: car.position.z,
        angle: car.angle, lap: lapState.lap,
        speed: car.speed,
      });
    }
  }

  sceneData.updateCamera(car.position, car.angle, dt);

  hud.update({
    speedMPH: car.speedMPH(),
    gear:     car.gear,
    lap:      lapState.lap,
    totalLaps:TRACK.totalLaps,
    raceTime,
    nos:      car.nos,
    nosMax:   car.cfg.nosCapacity,
    isDrifting: car.isDrifting,
    position: car.position,
    carAngle: car.angle,
    place:    myPlace,
    totalRacers: bots.length + 1,
  });

  audio.update(car.speed, car.cfg.topSpeed, car.isDrifting, nosActive);
}

// ─── Finish ───────────────────────────────────────────────────────────────
function finishRace() {
  state = S.FINISHED; car.frozen = true;
  hud.showFinish(raceTime, myPlace);
  audio.finishFanfare();
  document.getElementById('nos-screen').style.opacity = '0';
  if (roomId && myPlayerId && firebaseReady()) {
    markFinished(roomId, myPlayerId, raceTime);
  }
  // BigBacks Hub network
  window.BigBacks?.activity.log('races', 'race_finish', { lap: TRACK.totalLaps, time: raceTime });
  const prevStats = window.BigBacks?.stats.get('races') || {};
  const isBest = !prevStats.bestLap || raceTime < prevStats.bestLap;
  if (isBest) window.BigBacks?.activity.log('races', 'best_lap', { time: raceTime });
  window.BigBacks?.stats.update('races', {
    bestLap: isBest ? raceTime : prevStats.bestLap,
    wins:    (prevStats.wins || 0) + 1,
    races:   (prevStats.races || 0) + 1,
  });
}

// ─── Bot leaderboard (single-player) ──────────────────────────────────────
function renderBotLeaderboard(ranking) {
  const board = document.getElementById('online-board');
  if (!board) return;
  board.innerHTML = ranking.map(r => {
    const color = r.isPlayer ? '#FFD700' : (r.character?.hex || '#fff');
    const label = r.finished
      ? '✓ ' + formatTime(r.finishTime)
      : r.isPlayer ? 'Lap ' + lapState.lap : 'Lap ' + (r.progress > 0 ? Math.floor(r.progress / (Math.PI * 2)) + 1 : 1);
    return `
      <div class="ob-row ${r.finished ? 'ob-done' : ''} ${r.isPlayer ? 'ob-me' : ''}">
        <span class="ob-pos">${r.place}</span>
        <span class="ob-name" style="color:${color}">${r.name}</span>
        <span class="ob-lap">${label}</span>
      </div>
    `;
  }).join('');
}

// ─── Online leaderboard ───────────────────────────────────────────────────
function updateOnlineLeaderboard(data) {
  const board = document.getElementById('online-board');
  if (!board) return;
  const players = Object.values(data).sort((a, b) => {
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    if (a.finished) return -1;
    if (b.finished) return 1;
    return (b.lap || 1) - (a.lap || 1);
  });
  board.innerHTML = players.map((p, i) => `
    <div class="ob-row ${p.finished ? 'ob-done' : ''}">
      <span class="ob-pos">${i + 1}</span>
      <span class="ob-name" style="color:${p.color||'#fff'}">${p.name}</span>
      <span class="ob-lap">${p.finished ? '✓ ' + formatTime(p.finishTime) : 'Lap ' + (p.lap||1)}</span>
    </div>
  `).join('');
}

function formatTime(s) {
  const m = Math.floor(s / 60), sec = (s % 60).toFixed(3);
  return `${m}:${sec.padStart(6, '0')}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function switchScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
const tick = ms => new Promise(r => setTimeout(r, ms));

function maybeShowTouchControls() {
  if (window.matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window) {
    document.getElementById('touch-controls').style.display = 'grid';
  }
}
