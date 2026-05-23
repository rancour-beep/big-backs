import * as THREE from 'three';
import { buildCarMesh, applyCarCustomization } from './CarMesh.js';
import { CAR_CONFIGS, CAR_TYPES, CHARACTERS }  from './config.js';

const GARAGE_KEY = 'bigbacks_garage_v1';

export function loadGarageSettings(charId) {
  try {
    const raw = localStorage.getItem(GARAGE_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw);
    return all[charId] || null;
  } catch { return null; }
}

function saveGarageSettings(charId, settings) {
  try {
    const raw = localStorage.getItem(GARAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[charId] = settings;
    localStorage.setItem(GARAGE_KEY, JSON.stringify(all));
  } catch {}
}

export class Garage {
  constructor(char, onBack) {
    this.char   = char;
    this.onBack = onBack;

    // Load saved settings or use character defaults
    const saved    = loadGarageSettings(char.id) || {};
    this.paintColor = saved.paintColor || char.hex;
    this.rimColor   = saved.rimColor   || '#CCCCCC';
    this.neonColor  = saved.neonColor  || char.hex;
    this.carType    = saved.carType    || char.car;

    this.renderer   = null;
    this.scene      = null;
    this.camera     = null;
    this.carMesh    = null;
    this.pedGlow    = null;
    this.rafId      = null;
    this.carAngle   = 0;
  }

  // ── Mount ─────────────────────────────────────────────────────────────────
  mount() {
    this._build3D();
    this._buildUI();
    this._rebuildCar();
    window.addEventListener('resize', this._onResize);
  }

  unmount() {
    window.removeEventListener('resize', this._onResize);
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.renderer) { this.renderer.dispose(); this.renderer = null; }
  }

  // ── 3D Preview ────────────────────────────────────────────────────────────
  _build3D() {
    const canvas = document.getElementById('garage-canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.renderer.shadowMap.enabled = true;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060610);
    this.scene.fog = new THREE.Fog(0x060610, 18, 35);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
    this.camera.position.set(0, 3.2, 9.5);
    this.camera.lookAt(0, 0.8, 0);

    // Lights
    this.scene.add(new THREE.AmbientLight(0x223366, 0.9));
    const key = new THREE.DirectionalLight(0xFFEEDD, 1.8);
    key.position.set(4, 8, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0x2244CC, 0.7);
    fill.position.set(-6, 2, -4);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xFF3300, 0.5);
    rim.position.set(0, -2, -8);
    this.scene.add(rim);

    // Floor
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(8, 64),
      new THREE.MeshStandardMaterial({ color:0x0A0A18, roughness:0.2, metalness:0.6 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Pedestal
    const pedMat = new THREE.MeshStandardMaterial({ color:0x111128, metalness:0.85, roughness:0.2 });
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.5, 0.25, 64), pedMat);
    ped.position.y = -0.12;
    ped.receiveShadow = true;
    this.scene.add(ped);

    // Glow ring (colour changes with neon)
    this.pedGlow = new THREE.Mesh(
      new THREE.TorusGeometry(3.35, 0.06, 8, 80),
      new THREE.MeshStandardMaterial({ color:this.neonColor, emissive:this.neonColor, emissiveIntensity:2.5 })
    );
    this.pedGlow.rotation.x = Math.PI / 2;
    this.pedGlow.position.y = 0.01;
    this.scene.add(this.pedGlow);

    // Point light under car (neon colour)
    this.neonLight = new THREE.PointLight(this.neonColor, 1.8, 5);
    this.neonLight.position.set(0, 0.4, 0);
    this.scene.add(this.neonLight);

    this._onResize();

    const tick = () => {
      this.rafId = requestAnimationFrame(tick);
      this.carAngle += 0.006;
      if (this.carMesh) this.carMesh.rotation.y = this.carAngle;
      this.renderer.render(this.scene, this.camera);
    };
    tick();
  }

  _rebuildCar() {
    if (this.carMesh) {
      this.scene.remove(this.carMesh);
      // Dispose all geometries and materials
      this.carMesh.traverse(obj => {
        if (obj.isMesh) {
          obj.geometry?.dispose();
          (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => m?.dispose());
        }
      });
    }
    const cfg    = CAR_CONFIGS[this.carType];
    this.carMesh = buildCarMesh(cfg, this.paintColor);
    this.carMesh.position.y = 0;
    this.carMesh.rotation.y = this.carAngle;
    this.scene.add(this.carMesh);
    applyCarCustomization(this.carMesh, {
      paintColor: this.paintColor,
      rimColor:   this.rimColor,
      neonColor:  this.neonColor,
    });
  }

  _applyColors() {
    applyCarCustomization(this.carMesh, {
      paintColor: this.paintColor,
      rimColor:   this.rimColor,
      neonColor:  this.neonColor,
    });
    if (this.pedGlow) {
      this.pedGlow.material.color.setStyle(this.neonColor);
      this.pedGlow.material.emissive.setStyle(this.neonColor);
    }
    if (this.neonLight) this.neonLight.color.setStyle(this.neonColor);
  }

  _onResize = () => {
    const canvas = document.getElementById('garage-canvas');
    if (!canvas || !this.renderer) return;
    const parent = canvas.parentElement;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    this.renderer.setSize(w, h, false);
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    if (this.camera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  };

  // ── Customisation UI ─────────────────────────────────────────────────────
  _buildUI() {
    const panel = document.getElementById('garage-ui');
    const char  = this.char;

    panel.innerHTML = `
      <div class="gu-header">
        <div class="gu-driver-name">${char.name}</div>
        <div class="gu-from">📍 ${char.from}</div>
      </div>

      <section class="gu-section">
        <div class="gu-sect-title">CAR TYPE</div>
        <div class="gu-car-types" id="gu-types"></div>
        <div class="gu-stats" id="gu-stats"></div>
      </section>

      <section class="gu-section">
        <div class="gu-sect-title">PAINT</div>
        <div class="gu-colour-row">
          <div class="gu-colour-preview" id="prev-paint" style="background:${this.paintColor}"></div>
          <input type="color" id="pick-paint" value="${this.paintColor}" class="gu-colour-input" />
          <div class="gu-colour-label">Body paint</div>
        </div>
      </section>

      <section class="gu-section">
        <div class="gu-sect-title">RIMS</div>
        <div class="gu-colour-row">
          <div class="gu-colour-preview" id="prev-rim" style="background:${this.rimColor}"></div>
          <input type="color" id="pick-rim" value="${this.rimColor}" class="gu-colour-input" />
          <div class="gu-colour-label">Wheel rims</div>
        </div>
        <div class="gu-rim-presets" id="gu-rim-presets"></div>
      </section>

      <section class="gu-section">
        <div class="gu-sect-title">NEON UNDERGLOW</div>
        <div class="gu-colour-row">
          <div class="gu-colour-preview" id="prev-neon" style="background:${this.neonColor}"></div>
          <input type="color" id="pick-neon" value="${this.neonColor}" class="gu-colour-input" />
          <div class="gu-colour-label">Neon glow</div>
        </div>
      </section>

      <div class="gu-actions">
        <button class="gu-btn gu-btn-save" id="gu-save">💾 SAVE</button>
        <button class="gu-btn gu-btn-reset" id="gu-reset">↺ RESET</button>
      </div>
    `;

    this._renderCarTypes();
    this._renderStats();
    this._renderRimPresets();
    this._wireInputs();
  }

  _renderCarTypes() {
    const wrap = document.getElementById('gu-types');
    wrap.innerHTML = Object.entries(CAR_TYPES).map(([key, t]) => `
      <button class="gu-type-btn ${this.carType === key ? 'active' : ''}" data-type="${key}">
        <span class="gtb-icon">${t.icon}</span>
        <span class="gtb-name">${t.name.split(' ')[0]}</span>
      </button>
    `).join('');
    wrap.querySelectorAll('.gu-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.carType = btn.dataset.type;
        wrap.querySelectorAll('.gu-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._rebuildCar();
        this._renderStats();
      });
    });
  }

  _renderStats() {
    const char = this.char;
    // Merge base stats with car-type modifiers
    const cfg = CAR_CONFIGS[this.carType];
    const stats = [
      { label:'SPEED',    val: Math.round((cfg.topSpeed / 55) * 10) },
      { label:'DRIFT',    val: Math.round((1 - cfg.normalGrip) * 14) },
      { label:'ACCEL',    val: Math.round((cfg.accel / 22) * 10) },
      { label:'HANDLING', val: Math.round((cfg.steerSpeed / 2.8) * 10) },
    ];
    const el = document.getElementById('gu-stats');
    if (!el) return;
    el.innerHTML = stats.map(s => `
      <div class="gu-stat-row">
        <div class="gu-stat-label">${s.label}</div>
        <div class="gu-stat-track"><div class="gu-stat-fill" style="width:${s.val*10}%;background:${this.paintColor}"></div></div>
        <div class="gu-stat-num">${s.val}</div>
      </div>
    `).join('');
  }

  _renderRimPresets() {
    const presets = ['#CCCCCC','#EEEEEE','#C8A800','#0066FF','#FF2200','#111111','#8B4513','#00CC88'];
    const wrap = document.getElementById('gu-rim-presets');
    if (!wrap) return;
    wrap.innerHTML = presets.map(c => `
      <button class="gu-rim-dot" style="background:${c};${this.rimColor===c?'outline:2px solid #fff;':''}" data-col="${c}"></button>
    `).join('');
    wrap.querySelectorAll('.gu-rim-dot').forEach(b => {
      b.addEventListener('click', () => {
        this.rimColor = b.dataset.col;
        document.getElementById('pick-rim').value = this.rimColor;
        document.getElementById('prev-rim').style.background = this.rimColor;
        this._applyColors();
      });
    });
  }

  _wireInputs() {
    const bind = (id, prevId, setter) => {
      const inp = document.getElementById(id);
      const prv = document.getElementById(prevId);
      if (!inp) return;
      inp.addEventListener('input', () => {
        setter(inp.value);
        if (prv) prv.style.background = inp.value;
        this._applyColors();
        this._renderStats();
      });
    };
    bind('pick-paint', 'prev-paint', v => { this.paintColor = v; });
    bind('pick-rim',   'prev-rim',   v => { this.rimColor   = v; });
    bind('pick-neon',  'prev-neon',  v => { this.neonColor  = v; });

    document.getElementById('gu-save')?.addEventListener('click', () => this._save());
    document.getElementById('gu-reset')?.addEventListener('click', () => this._reset());
  }

  _save() {
    const settings = {
      carType:    this.carType,
      paintColor: this.paintColor,
      rimColor:   this.rimColor,
      neonColor:  this.neonColor,
    };
    saveGarageSettings(this.char.id, settings);
    window.BigBacks?.activity.log('races', 'garage_save', { driver: this.char.name, carType: this.carType });
    // Flash save button
    const btn = document.getElementById('gu-save');
    if (btn) { btn.textContent = '✅ SAVED!'; setTimeout(() => { btn.textContent = '💾 SAVE'; }, 1500); }
  }

  _reset() {
    this.paintColor = this.char.hex;
    this.rimColor   = '#CCCCCC';
    this.neonColor  = this.char.hex;
    this.carType    = this.char.car;
    // Re-sync inputs
    document.getElementById('pick-paint').value = this.paintColor;
    document.getElementById('pick-rim').value   = this.rimColor;
    document.getElementById('pick-neon').value  = this.neonColor;
    document.getElementById('prev-paint').style.background = this.paintColor;
    document.getElementById('prev-rim').style.background   = this.rimColor;
    document.getElementById('prev-neon').style.background  = this.neonColor;
    this._rebuildCar();
    this._renderCarTypes();
    this._renderStats();
    this._renderRimPresets();
  }

  getSettings() {
    return { carType:this.carType, paintColor:this.paintColor, rimColor:this.rimColor, neonColor:this.neonColor };
  }
}
