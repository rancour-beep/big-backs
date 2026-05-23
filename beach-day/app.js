'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  🏖 Big Backth Beach Day — v0.2
//  Created and owned by Shad ♡
//  © 2026 Shad — all rightth rethurved
// ─────────────────────────────────────────────────────────────────────────────

const APP_VERSION = '0.2';
const APP_CREATOR = 'Shad';

// ── Colours (cutesy muted palette) ───────────────────────────────────────────
const COLORS = [
  '#E5A8B3', // dusty rose
  '#B5C7A4', // sage
  '#C9B0DD', // lavender
  '#A8C0D6', // powder blue
  '#A8D5C0', // mint
  '#F0B89C', // peach
  '#E8B4D0', // soft pink
  '#B5B5DC', // periwinkle
  '#DC9A9A', // warm coral
  '#E8D49E'  // buttercream
];
const COLOR_BG = [
  '#FAEEEF', '#F2F5EE', '#F5EFF7', '#EEF3F8', '#EEF7F2',
  '#FCF1EA', '#FBEFF5', '#F1F1F8', '#FAEDED', '#FBF6E7'
];

// ── Currency rateth (GBP bathe — approximate ♡) ──────────────────────────────
const RATES = {
  GBP: { rate: 1,        symbol: '£',    name: 'British Pound' },
  USD: { rate: 1.27,     symbol: '$',    name: 'US Dollar' },
  EUR: { rate: 1.18,     symbol: '€',    name: 'Euro' },
  NPR: { rate: 170,      symbol: 'रू',   name: 'Nepalese Rupee' },
  PHP: { rate: 73,       symbol: '₱',    name: 'Philippine Peso' },
  BDT: { rate: 152,      symbol: '৳',    name: 'Bangladeshi Taka' },
  HKD: { rate: 9.9,      symbol: 'HK$',  name: 'Hong Kong Dollar' },
  MYR: { rate: 5.95,     symbol: 'RM',   name: 'Malaysian Ringgit' },
  INR: { rate: 106,      symbol: '₹',    name: 'Indian Rupee' },
  PKR: { rate: 354,      symbol: '₨',    name: 'Pakistani Rupee' },
  LKR: { rate: 385,      symbol: 'Rs',   name: 'Sri Lankan Rupee' },
  JPY: { rate: 162,      symbol: '¥',    name: 'Japanese Yen' },
  CNY: { rate: 9.05,     symbol: 'CN¥',  name: 'Chinese Yuan' },
  KRW: { rate: 1700,     symbol: '₩',    name: 'South Korean Won' },
  SGD: { rate: 1.69,     symbol: 'S$',   name: 'Singapore Dollar' },
  THB: { rate: 45,       symbol: '฿',    name: 'Thai Baht' },
  IDR: { rate: 20000,    symbol: 'Rp',   name: 'Indonesian Rupiah' },
  VND: { rate: 31000,    symbol: '₫',    name: 'Vietnamese Dong' },
  TWD: { rate: 40.5,     symbol: 'NT$',  name: 'Taiwan Dollar' },
  AUD: { rate: 1.93,     symbol: 'A$',   name: 'Australian Dollar' },
  NZD: { rate: 2.09,     symbol: 'NZ$',  name: 'New Zealand Dollar' },
  CAD: { rate: 1.72,     symbol: 'C$',   name: 'Canadian Dollar' },
  CHF: { rate: 1.13,     symbol: 'CHF',  name: 'Swiss Franc' },
  NOK: { rate: 13.3,     symbol: 'kr',   name: 'Norwegian Krone' },
  SEK: { rate: 13.6,     symbol: 'kr',   name: 'Swedish Krona' },
  DKK: { rate: 8.78,     symbol: 'kr',   name: 'Danish Krone' },
  PLN: { rate: 5.05,     symbol: 'zł',   name: 'Polish Zloty' },
  CZK: { rate: 29.5,     symbol: 'Kč',   name: 'Czech Koruna' },
  HUF: { rate: 460,      symbol: 'Ft',   name: 'Hungarian Forint' },
  RON: { rate: 5.82,     symbol: 'lei',  name: 'Romanian Leu' },
  TRY: { rate: 41,       symbol: '₺',    name: 'Turkish Lira' },
  AED: { rate: 4.66,     symbol: 'د.إ',  name: 'UAE Dirham' },
  SAR: { rate: 4.76,     symbol: '﷼',    name: 'Saudi Riyal' },
  QAR: { rate: 4.62,     symbol: 'ر.ق',  name: 'Qatari Riyal' },
  ILS: { rate: 4.69,     symbol: '₪',    name: 'Israeli Shekel' },
  EGP: { rate: 62,       symbol: 'E£',   name: 'Egyptian Pound' },
  ZAR: { rate: 23,       symbol: 'R',    name: 'South African Rand' },
  NGN: { rate: 1900,     symbol: '₦',    name: 'Nigerian Naira' },
  KES: { rate: 165,      symbol: 'KSh',  name: 'Kenyan Shilling' },
  MXN: { rate: 22,       symbol: 'MX$',  name: 'Mexican Peso' },
  BRL: { rate: 6.4,      symbol: 'R$',   name: 'Brazilian Real' },
  ARS: { rate: 1260,     symbol: 'AR$',  name: 'Argentine Peso' },
  COP: { rate: 5400,     symbol: 'COL$', name: 'Colombian Peso' },
  CLP: { rate: 1230,     symbol: 'CL$',  name: 'Chilean Peso' },
  PEN: { rate: 4.83,     symbol: 'S/.',  name: 'Peruvian Sol' }
};

const PRIMARY_CURRENCIES = ['USD', 'EUR', 'NPR', 'PHP', 'BDT', 'HKD', 'MYR', 'INR', 'JPY'];

// ── Sound Kit ────────────────────────────────────────────────────────────────
// Procedural cozy-game audio via Web Audio API.
// No files, no copyright, just synthesised pentatonic notes (Minecraft-vibe).
const AUDIO_MUTE_KEY = 'bigbacks_audio_muted';
const AUDIO_VOL_KEY  = 'bigbacks_audio_volume';

const SoundKit = (() => {
  let ctx = null, masterGain = null, musicGain = null, sfxGain = null;
  let melodyTimer = null, padTimer = null;
  let muted = localStorage.getItem(AUDIO_MUTE_KEY) === '1';
  let volume = parseFloat(localStorage.getItem(AUDIO_VOL_KEY) ?? '0.4');
  let initialized = false;

  function init() {
    if (initialized) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = muted ? 0 : volume;
      masterGain.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.6;
      // Soft lowpass for warmth
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2200;
      lp.Q.value = 0.5;
      musicGain.connect(lp);
      lp.connect(masterGain);
      sfxGain = ctx.createGain();
      sfxGain.gain.value = 1;
      sfxGain.connect(masterGain);
      initialized = true;
      if (!muted) startMusic();
    } catch (e) {
      console.warn('Audio init failed', e);
    }
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function setMuted(m) {
    muted = !!m;
    localStorage.setItem(AUDIO_MUTE_KEY, muted ? '1' : '0');
    if (!initialized) {
      if (!muted) init();
      return;
    }
    resume();
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(muted ? 0 : volume, ctx.currentTime + 0.12);
    if (muted) stopMusic(); else startMusic();
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(1, parseFloat(v) || 0));
    localStorage.setItem(AUDIO_VOL_KEY, String(volume));
    if (initialized && !muted) {
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.12);
    }
  }

  // ── Single-tone helper ──
  function tone(freq, dur, opts = {}) {
    if (!initialized || muted) return;
    resume();
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = opts.type || 'triangle';
    o.frequency.setValueAtTime(freq, now);
    if (opts.freqEnd) {
      o.frequency.exponentialRampToValueAtTime(opts.freqEnd, now + dur);
    }
    const peak = opts.gain ?? 0.16;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(peak, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g);
    g.connect(sfxGain);
    o.start(now);
    o.stop(now + dur + 0.02);
  }

  function seq(notes, gap = 0.07, opts = {}) {
    if (!initialized || muted) return;
    notes.forEach((n, i) => {
      const freq = typeof n === 'number' ? n : n.freq;
      const dur  = (typeof n === 'object' && n.dur) || opts.dur || 0.12;
      setTimeout(() => tone(freq, dur, opts), i * gap * 1000);
    });
  }

  // Short, friendly SFX palette
  const sfx = {
    click()   { tone(720, 0.05, { type:'triangle', gain:0.10 }); },
    pop()     { tone(900, 0.04, { type:'sine',     gain:0.10 }); },
    pickup()  { tone(440, 0.08, { type:'sine',     gain:0.14, freqEnd:660 }); },
    drop()    { tone(330, 0.13, { type:'sine',     gain:0.18, freqEnd:200 }); },
    swap()    { seq([{freq:520,dur:0.06},{freq:680,dur:0.06}], 0.05, { type:'triangle', gain:0.14 }); },
    success() { seq([523.25, 659.25, 783.99], 0.07, { type:'triangle', gain:0.16, dur:0.13 }); },
    error()   { seq([392, 261.63], 0.10, { type:'sawtooth', gain:0.10, dur:0.18 }); },
    open()    { tone(440, 0.16, { type:'sine', gain:0.13, freqEnd:740 }); },
    close()   { tone(660, 0.13, { type:'sine', gain:0.11, freqEnd:340 }); },
    upload()  { seq([523.25, 659.25, 783.99, 1046.5], 0.06, { type:'triangle', gain:0.14, dur:0.12 }); },
    remove()  { seq([523, 392, 311], 0.07, { type:'triangle', gain:0.13, dur:0.12 }); },
    reset()   { tone(880, 0.45, { type:'sine', gain:0.10, freqEnd:200 }); },
    coin()    { seq([988, 1319], 0.06, { type:'square', gain:0.07, dur:0.08 }); },
    rename()  { tone(660, 0.08, { type:'sine', gain:0.10 }); },
    toggle()  { tone(560, 0.07, { type:'triangle', gain:0.12 }); },
    notify()  { seq([880, 1175], 0.08, { type:'sine', gain:0.12, dur:0.10 }); },
    send()    { tone(700, 0.06, { type:'triangle', gain:0.10, freqEnd: 920 }); }
  };

  // ── Music engine ── C-minor pentatonic, sparse cozy notes
  const SCALE = [
    261.63, 311.13, 349.23, 392.00, 466.16,
    523.25, 622.25, 698.46, 783.99, 932.33
  ];
  const PAD_CHORDS = [
    [130.81, 196.00, 261.63], // Cm root area
    [155.56, 233.08, 311.13], // Eb area
    [174.61, 261.63, 349.23], // F area
    [196.00, 293.66, 392.00]  // G area
  ];
  let lastMelodyIdx = -1;

  function playMelodyNote() {
    if (!initialized || muted || !musicGain) return;
    let idx;
    do { idx = Math.floor(Math.random() * SCALE.length); }
    while (idx === lastMelodyIdx && SCALE.length > 1);
    lastMelodyIdx = idx;
    const freq = SCALE[idx];
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.07, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.9);
    o.connect(g);
    g.connect(musicGain);
    o.start(now);
    o.stop(now + 2.1);
  }

  function playPadChord() {
    if (!initialized || muted || !musicGain) return;
    const chord = PAD_CHORDS[Math.floor(Math.random() * PAD_CHORDS.length)];
    chord.forEach((freq, i) => {
      const now = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = i === 0 ? 'sine' : 'triangle';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.035, now + 1.8);
      g.gain.setValueAtTime(0.035, now + 4.5);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 8.5);
      o.connect(g);
      g.connect(musicGain);
      o.start(now);
      o.stop(now + 8.6);
    });
  }

  function startMusic() {
    if (!initialized || muted) return;
    stopMusic();
    const melodyLoop = () => {
      playMelodyNote();
      melodyTimer = setTimeout(melodyLoop, 1600 + Math.random() * 1600);
    };
    const padLoop = () => {
      playPadChord();
      padTimer = setTimeout(padLoop, 11000 + Math.random() * 5000);
    };
    melodyTimer = setTimeout(melodyLoop, 800);
    padTimer = setTimeout(padLoop, 2200);
  }

  function stopMusic() {
    if (melodyTimer) clearTimeout(melodyTimer);
    if (padTimer)    clearTimeout(padTimer);
    melodyTimer = null;
    padTimer = null;
  }

  return {
    init, resume, setMuted, setVolume,
    isMuted: () => muted,
    getVolume: () => volume,
    sfx
  };
})();

const LS_KEY = 'bigbacks_carpool_v2';
const LEGACY_KEY = 'bigbacks_carpool_v1';
const MAX_CARS = 20;
const MAX_PEOPLE = 50;
const TOUCH_THRESHOLD = 8;

const DEFAULT_STATE = {
  beachName: 'Brighton Beach',
  cars: [
    { id: 'c1', name: "MJ's Car",     capacity: 4, seats: ['p1', 'p2', 'p3', null] },
    { id: 'c2', name: "Ringan's Car", capacity: 4, seats: ['p4', 'p5', 'p6', 'p7'] }
  ],
  pool: ['p8', 'p9', 'p10', 'p11', 'p12'],
  people: {
    p1:  { id:'p1',  name:'MJ',            color:5, from:'Stoke',      transport:'drive', cost:30, arrival:'11:00', picture:'' },
    p2:  { id:'p2',  name:'Friend',        color:3, from:'Stoke',      transport:'drive', cost:5,  arrival:'11:00', picture:'' },
    p3:  { id:'p3',  name:'Erika',         color:6, from:'Stoke',      transport:'drive', cost:5,  arrival:'11:00', picture:'' },
    p4:  { id:'p4',  name:'Ringan',        color:7, from:'Coventry',   transport:'drive', cost:25, arrival:'11:30', picture:'' },
    p5:  { id:'p5',  name:'Rhianon',       color:4, from:'Coventry',   transport:'drive', cost:5,  arrival:'11:30', picture:'' },
    p6:  { id:'p6',  name:'Liane',         color:1, from:'Coventry',   transport:'drive', cost:5,  arrival:'11:30', picture:'' },
    p7:  { id:'p7',  name:'Evi',           color:9, from:'Coventry',   transport:'drive', cost:5,  arrival:'11:30', picture:'' },
    p8:  { id:'p8',  name:'Shad',          color:0, from:'Manchester', transport:'train', cost:22, arrival:'12:00', picture:'' },
    p9:  { id:'p9',  name:'Ed',            color:2, from:'Birmingham', transport:'train', cost:18, arrival:'12:15', picture:'' },
    p10: { id:'p10', name:'Birat',         color:8, from:'Sheffield',  transport:'bus',   cost:15, arrival:'13:00', picture:'' },
    p11: { id:'p11', name:'Ishant',        color:3, from:'Liverpool',  transport:'train', cost:24, arrival:'12:30', picture:'' },
    p12: { id:'p12', name:'Leila (maybe)', color:6, from:'Cardiff',    transport:'train', cost:20, arrival:'12:45', picture:'' }
  },
  nextId: 13
};

// ── State ────────────────────────────────────────────────────────────────────

let state;

function loadState() {
  try {
    let raw = localStorage.getItem(LS_KEY);
    if (!raw) raw = localStorage.getItem(LEGACY_KEY); // migrate from v1
    if (!raw) { state = deepClone(DEFAULT_STATE); return; }
    const parsed = JSON.parse(raw);
    if (!parsed.cars || !parsed.people || !Array.isArray(parsed.pool) || typeof parsed.nextId !== 'number') {
      throw new Error('corrupt');
    }
    // Migrate to add travel fieldth and picture
    Object.values(parsed.people).forEach(p => {
      if (p.from == null)      p.from = '';
      if (p.transport == null) p.transport = 'train';
      if (p.cost == null)      p.cost = 0;
      if (p.arrival == null)   p.arrival = '';
      if (p.picture == null)   p.picture = '';
    });
    if (!parsed.beachName) parsed.beachName = 'Brighton Beach';
    state = parsed;
  } catch {
    state = deepClone(DEFAULT_STATE);
    setTimeout(() => showToast('Thaved data wath unreadable — rethet to defaultth', 'warning'), 100);
  }
}

function saveState() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
      showToast('Thtorage full — try a thmaller picture or remove one', 'error');
    } else {
      showToast("Couldn't thave changeth", 'error');
    }
    return false;
  }
}

function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

// ── Drag state ────────────────────────────────────────────────────────────────

let drag = { personId: null, source: null, el: null };
let touchDrag = {};
let activeColorMenu = null;
let modalMode = 'form'; // 'form' or 'info'

// ── Helpers ───────────────────────────────────────────────────────────────────

function el(tag, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}

function formatCurrency(amount, code) {
  const r = RATES[code];
  const val = amount * r.rate;
  const decimals = val >= 100 ? 0 : 2;
  const formatted = val.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  return `${r.symbol}${formatted}`;
}

function totalCost() {
  return Object.values(state.people).reduce((s, p) => s + (parseFloat(p.cost) || 0), 0);
}

function orderedPeople() {
  const ids = [];
  state.cars.forEach(car => car.seats.forEach(pid => { if (pid) ids.push(pid); }));
  state.pool.forEach(pid => ids.push(pid));
  return ids;
}

function initialOf(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return '?';
  // First non-whitespace char, uppercase. Grapheme-safe-ish.
  const seg = Array.from(trimmed)[0];
  return seg.toUpperCase();
}

function buildAvatar(person, size, opts = {}) {
  const av = el('div', 'avatar' + (person.picture ? '' : ' avatar-fallback') + (opts.clickable ? ' avatar-clickable' : ''));
  av.style.setProperty('--avatar-size', size + 'px');
  if (person.picture) {
    av.style.backgroundImage = `url("${person.picture}")`;
    av.setAttribute('aria-label', `Picture of ${person.name}`);
  } else {
    av.style.background = COLORS[person.color];
    av.textContent = initialOf(person.name);
    av.style.fontSize = Math.round(size * 0.42) + 'px';
    av.setAttribute('aria-label', `${person.name} (no picture)`);
  }
  if (opts.clickable) av.title = 'Click to upload a picture';
  return av;
}

// Read an image File, draw it cover-cropped onto a 256×256 canvas, return JPEG data URL.
function resizeImageToDataURL(file, target = 256, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('no file'));
    if (!/^image\//i.test(file.type)) return reject(new Error('not an image'));

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode failed'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = target;
          canvas.height = target;
          const ctx = canvas.getContext('2d');
          // Cover-crop maths
          const srcRatio = img.width / img.height;
          let sx, sy, sw, sh;
          if (srcRatio > 1) {
            sh = img.height;
            sw = img.height;
            sx = (img.width - sw) / 2;
            sy = 0;
          } else {
            sw = img.width;
            sh = img.width;
            sx = 0;
            sy = (img.height - sh) / 2;
          }
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, target, target);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (e) {
          reject(e);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── Render ────────────────────────────────────────────────────────────────────

function render() {
  renderHeader();
  renderCars();
  renderPool();
  renderTravel();
  renderTotals();
}

function renderHeader() {
  const dest = document.getElementById('beach-name');
  if (!dest._editing) dest.textContent = state.beachName;
}

function renderCars() {
  const grid = document.getElementById('cars-grid');
  grid.innerHTML = '';
  state.cars.forEach(car => grid.appendChild(buildCarCard(car)));
}

function renderPool() {
  const zone = document.getElementById('pool-zone');
  zone.innerHTML = '';
  zone.classList.toggle('empty-hint', state.pool.length === 0);
  state.pool.forEach((pid, i) => zone.appendChild(buildPersonChip(pid, { type: 'pool', poolIndex: i })));
}

function renderTravel() {
  const list = document.getElementById('travel-list');
  list.innerHTML = '';
  orderedPeople().forEach(pid => list.appendChild(buildTravelRow(pid)));
}

function renderTotals() {
  const card = document.getElementById('totals-card');
  card.innerHTML = '';

  const total = totalCost();
  const count = Object.keys(state.people).length;
  const avg = count > 0 ? total / count : 0;

  const label = el('div', 'total-label');
  label.textContent = 'Total trip coth';

  const value = el('div', 'total-value');
  value.textContent = formatCurrency(total, 'GBP');

  const per = el('div', 'total-per');
  per.textContent = `Per perthon: ${formatCurrency(avg, 'GBP')} · ${count} ${count === 1 ? 'perthon' : 'perthonth'}`;

  card.append(label, value, per);

  // Primary currency conversionth
  const grid = el('div', 'currencies-grid');
  PRIMARY_CURRENCIES.forEach(code => {
    const pill = el('div', 'currency-pill');
    const c = el('div', 'currency-code');
    c.textContent = code;
    const v = el('div', 'currency-value');
    v.textContent = formatCurrency(total, code);
    pill.append(c, v);
    grid.appendChild(pill);
  });
  card.appendChild(grid);

  // Timeline strip
  const arrivals = orderedPeople()
    .map(id => ({ name: state.people[id].name, arrival: state.people[id].arrival }))
    .filter(p => p.arrival);
  if (arrivals.length) {
    arrivals.sort((a, b) => a.arrival.localeCompare(b.arrival));
    const earliest = arrivals[0];
    const latest = arrivals[arrivals.length - 1];
    const strip = el('div', 'timeline-strip');
    strip.innerHTML = `🕒 Firtht to arrive: <strong>${escapeHtml(earliest.name)}</strong> at <strong>${earliest.arrival}</strong> · Latht: <strong>${escapeHtml(latest.name)}</strong> at <strong>${latest.arrival}</strong>`;
    card.appendChild(strip);
  }

  const btn = el('button', 'show-all-btn');
  btn.textContent = `💱 All ${Object.keys(RATES).length} currentheeth`;
  btn.addEventListener('click', showAllCurrencies);
  card.appendChild(btn);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

// ── Car card ─────────────────────────────────────────────────────────────────

function buildCarCard(car) {
  const card = el('div', 'car-card');

  const header = el('div', 'car-header');
  const nameWrap = el('span', 'car-name');
  nameWrap.textContent = car.name;
  nameWrap.title = 'Double-click to rename';
  nameWrap.addEventListener('dblclick', () => startCarRename(car.id, nameWrap));

  const occupied = car.seats.filter(Boolean).length;
  const badge = el('span', 'car-capacity');
  badge.textContent = `${occupied}/${car.capacity}`;

  const removeBtn = el('button', 'btn-icon');
  removeBtn.innerHTML = '✕';
  removeBtn.title = 'Remove car';
  removeBtn.addEventListener('click', () => removeCarAction(car.id));

  header.append(nameWrap, badge, removeBtn);

  const list = el('div', 'seats-list');
  car.seats.forEach((pid, si) => list.appendChild(buildSeat(car.id, si, pid)));

  card.append(header, list);
  return card;
}

function buildSeat(carId, seatIndex, personId) {
  const target = { type: 'seat', carId, seatIndex };
  const seat = el('div', personId ? 'seat occupied' : 'seat empty');
  seat.dataset.dropTarget = JSON.stringify(target);

  seat.addEventListener('dragover', onDragOver);
  seat.addEventListener('drop', (e) => onDrop(e, target));
  seat.addEventListener('dragleave', onDragLeave);

  if (personId) {
    seat.appendChild(buildPersonChip(personId, { type: 'seat', carId, seatIndex }));
  } else {
    const hint = el('span');
    hint.textContent = 'empty theat';
    hint.style.pointerEvents = 'none';
    seat.appendChild(hint);
  }
  return seat;
}

function buildPersonChip(personId, source) {
  const person = state.people[personId];
  if (!person) return document.createDocumentFragment();

  const chip = el('div', 'person-chip');
  chip.draggable = true;
  chip.style.setProperty('--chip-color', COLORS[person.color]);
  chip.style.setProperty('--chip-bg', COLOR_BG[person.color]);

  const avatar = buildAvatar(person, 28, { clickable: true });
  // Click the avatar → open upload popup. Stop drag from starting on the avatar.
  avatar.addEventListener('click', (e) => { e.stopPropagation(); showUploadModal(personId); });
  avatar.addEventListener('mousedown', (e) => e.stopPropagation());
  avatar.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
  avatar.draggable = false;

  const nameEl = el('span', 'person-name');
  nameEl.textContent = person.name;
  nameEl.title = 'Double-click to rename · Right-click to change colour';

  const removeBtn = el('button', 'btn-icon');
  removeBtn.innerHTML = '✕';
  removeBtn.title = 'Remove perthon';

  chip.append(avatar, nameEl, removeBtn);

  chip.addEventListener('dragstart', (e) => onDragStart(e, personId, source));
  chip.addEventListener('dragend', onDragEnd);
  chip.addEventListener('touchstart', (e) => onTouchStart(e, personId, source, chip), { passive: true });

  nameEl.addEventListener('dblclick', (e) => { e.stopPropagation(); startPersonRename(personId, nameEl); });
  chip.addEventListener('contextmenu', (e) => showColorMenu(e, personId));
  removeBtn.addEventListener('click', (e) => { e.stopPropagation(); removePersonAction(personId); });

  return chip;
}

// ── Travel row ───────────────────────────────────────────────────────────────

function buildTravelRow(personId) {
  const p = state.people[personId];
  const row = el('div', 'travel-row');
  row.style.setProperty('--row-color', COLORS[p.color]);

  const tag = el('div', 'person-tag');
  const avatar = buildAvatar(p, 40, { clickable: true });
  avatar.addEventListener('click', () => showUploadModal(personId));
  const nameSpan = el('span', 'person-tag-name');
  nameSpan.textContent = p.name;
  tag.append(avatar, nameSpan);
  row.appendChild(tag);

  // From
  row.appendChild(makeField('From', p.from, 'text', 'e.g. Coventry', (v) => {
    state.people[personId].from = v;
    saveState();
  }));

  // Transport
  row.appendChild(makeSelect('By', p.transport, [
    { value: 'drive', label: '🚗 Drive' },
    { value: 'train', label: '🚆 Train' },
    { value: 'bus',   label: '🚌 Buth'  },
    { value: 'walk',  label: '🚶 Walk'  },
    { value: 'bike',  label: '🚲 Bike'  }
  ], (v) => {
    state.people[personId].transport = v;
    saveState();
  }));

  // Cost
  const costField = makeField('Coth (£)', p.cost, 'number', '0', (v) => {
    state.people[personId].cost = parseFloat(v) || 0;
    saveState();
    renderTotals();
  });
  costField.querySelector('input').min = '0';
  costField.querySelector('input').step = '0.01';
  row.appendChild(costField);

  // Arrival
  row.appendChild(makeField('Arrive', p.arrival, 'time', '', (v) => {
    state.people[personId].arrival = v;
    saveState();
    renderTotals();
  }));

  return row;
}

function makeField(label, value, type, placeholder, onChange) {
  const f = el('div', 'field');
  const l = el('div', 'field-label');
  l.textContent = label;
  const input = document.createElement('input');
  input.type = type;
  input.value = value ?? '';
  if (placeholder) input.placeholder = placeholder;
  input.addEventListener('input', (e) => onChange(e.target.value));
  input.addEventListener('change', (e) => onChange(e.target.value));
  f.append(l, input);
  return f;
}

function makeSelect(label, value, options, onChange) {
  const f = el('div', 'field');
  const l = el('div', 'field-label');
  l.textContent = label;
  const sel = document.createElement('select');
  options.forEach(opt => {
    const o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.label;
    if (opt.value === value) o.selected = true;
    sel.appendChild(o);
  });
  sel.addEventListener('change', (e) => onChange(e.target.value));
  f.append(l, sel);
  return f;
}

// ── HTML5 Drag & Drop ─────────────────────────────────────────────────────────

function onDragStart(e, personId, source) {
  drag.personId = personId;
  drag.source = source;
  drag.el = e.currentTarget;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', personId);
  setTimeout(() => drag.el && drag.el.classList.add('dragging'), 0);
  SoundKit.sfx.pickup();
}
function onDragEnd() {
  drag.el && drag.el.classList.remove('dragging');
  drag = { personId: null, source: null, el: null };
  document.querySelectorAll('.drag-over').forEach(n => n.classList.remove('drag-over'));
}
function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}
function onDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    e.currentTarget.classList.remove('drag-over');
  }
}
function onDrop(e, target) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  if (!drag.personId) return;
  executeDrop(drag.personId, drag.source, target);
}

function setupPoolDrop() {
  const zone = document.getElementById('pool-zone');
  zone.addEventListener('dragover', onDragOver);
  zone.addEventListener('dragleave', onDragLeave);
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    if (!drag.personId) return;
    executeDrop(drag.personId, drag.source, { type: 'pool' });
  });
}

function executeDrop(personId, source, target) {
  if (source.type === 'seat' && target.type === 'seat' &&
      source.carId === target.carId && source.seatIndex === target.seatIndex) return;
  if (source.type === 'pool' && target.type === 'pool') return;

  const s = deepClone(state);
  let displaced = null;

  if (target.type === 'seat') {
    const car = s.cars.find(c => c.id === target.carId);
    displaced = car.seats[target.seatIndex];
    car.seats[target.seatIndex] = personId;
  } else {
    if (!s.pool.includes(personId)) s.pool.push(personId);
  }

  if (source.type === 'seat') {
    const car = s.cars.find(c => c.id === source.carId);
    car.seats[source.seatIndex] = displaced;
  } else {
    s.pool = s.pool.filter(id => id !== personId);
    if (displaced) s.pool.push(displaced);
  }

  state = s;
  saveState();
  render();
  // Distinct sound: swap (someone was displaced) vs simple drop
  if (displaced) SoundKit.sfx.swap();
  else SoundKit.sfx.drop();
}

// ── Touch Drag ────────────────────────────────────────────────────────────────

document.addEventListener('touchmove', onTouchMove, { passive: false });
document.addEventListener('touchend', onTouchEnd);
document.addEventListener('touchcancel', onTouchEnd);

function onTouchStart(e, personId, source, chipEl) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT') return;
  touchDrag = {
    personId, source, chipEl,
    startX: e.touches[0].clientX,
    startY: e.touches[0].clientY,
    active: false, ghost: null, lastTarget: null,
    w: chipEl.offsetWidth, h: chipEl.offsetHeight
  };
}

function onTouchMove(e) {
  if (!touchDrag.personId) return;
  const touch = e.touches[0];
  const dx = touch.clientX - touchDrag.startX;
  const dy = touch.clientY - touchDrag.startY;

  if (!touchDrag.active) {
    if (Math.sqrt(dx*dx + dy*dy) < TOUCH_THRESHOLD) return;
    touchDrag.active = true;
    const ghost = touchDrag.chipEl.cloneNode(true);
    ghost.className = 'person-chip touch-ghost';
    ghost.style.cssText = touchDrag.chipEl.style.cssText;
    ghost.style.width = touchDrag.w + 'px';
    ghost.style.left = (touch.clientX - touchDrag.w / 2) + 'px';
    ghost.style.top  = (touch.clientY - touchDrag.h / 2) + 'px';
    document.body.appendChild(ghost);
    touchDrag.ghost = ghost;
    touchDrag.chipEl.classList.add('dragging');
  }

  e.preventDefault();
  const g = touchDrag.ghost;
  if (!g) return;
  g.style.left = (touch.clientX - touchDrag.w / 2) + 'px';
  g.style.top  = (touch.clientY - touchDrag.h / 2) + 'px';

  g.style.visibility = 'hidden';
  const under = document.elementFromPoint(touch.clientX, touch.clientY);
  g.style.visibility = '';

  const dropEl = under && under.closest('[data-drop-target]');
  if (touchDrag.lastTarget !== dropEl) {
    touchDrag.lastTarget && touchDrag.lastTarget.classList.remove('drag-over');
    dropEl && dropEl.classList.add('drag-over');
    touchDrag.lastTarget = dropEl;
  }
}

function onTouchEnd(e) {
  if (!touchDrag.personId) return;
  if (touchDrag.active) {
    const touch = e.changedTouches[0];
    const g = touchDrag.ghost;
    if (g) g.style.visibility = 'hidden';
    const under = document.elementFromPoint(touch.clientX, touch.clientY);
    if (g) g.style.visibility = '';

    const dropEl = under && under.closest('[data-drop-target]');
    if (dropEl) {
      try {
        const target = JSON.parse(dropEl.dataset.dropTarget);
        executeDrop(touchDrag.personId, touchDrag.source, target);
      } catch {}
    }
    touchDrag.lastTarget && touchDrag.lastTarget.classList.remove('drag-over');
    g && g.remove();
    touchDrag.chipEl && touchDrag.chipEl.classList.remove('dragging');
  }
  touchDrag = {};
}

// ── Inline Rename ─────────────────────────────────────────────────────────────

function startPersonRename(personId, nameEl) {
  const person = state.people[personId];
  const input = makeRenameInput(person.name);
  nameEl.replaceWith(input);
  input.focus(); input.select();

  let saved = false;
  function save() {
    if (saved) return;
    const val = input.value.trim();
    if (!val) { showToast('Name cannot be empty', 'error'); input.focus(); return; }
    const dup = Object.values(state.people).some(p => p.id !== personId && p.name === val);
    if (dup) showToast(`"${val}" already exitht`, 'warning');
    saved = true;
    state.people[personId].name = val;
    saveState(); render();
  }
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); save(); }
    if (e.key === 'Escape') { saved = true; render(); }
  });
  input.addEventListener('blur', save);
}

function startCarRename(carId, nameEl) {
  const car = state.cars.find(c => c.id === carId);
  const input = makeRenameInput(car.name);
  nameEl.replaceWith(input);
  input.focus(); input.select();

  let saved = false;
  function save() {
    if (saved) return;
    const val = input.value.trim();
    if (!val) { showToast('Car name cannot be empty', 'error'); input.focus(); return; }
    saved = true;
    car.name = val;
    saveState(); render();
  }
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); save(); }
    if (e.key === 'Escape') { saved = true; render(); }
  });
  input.addEventListener('blur', save);
}

function startBeachRename() {
  const dest = document.getElementById('beach-name');
  if (dest._editing) return;
  dest._editing = true;

  const input = makeRenameInput(state.beachName);
  input.style.minWidth = '120px';
  input.style.maxWidth = '240px';
  dest.textContent = '';
  dest.appendChild(input);
  input.focus(); input.select();

  let saved = false;
  function save() {
    if (saved) return;
    const val = input.value.trim();
    if (!val) { showToast('Beach name cannot be empty', 'error'); input.focus(); return; }
    saved = true;
    state.beachName = val;
    saveState();
    dest._editing = false;
    dest.textContent = val;
  }
  function cancel() {
    saved = true;
    dest._editing = false;
    dest.textContent = state.beachName;
  }
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); save(); }
    if (e.key === 'Escape') { cancel(); }
  });
  input.addEventListener('blur', save);
}

function makeRenameInput(value) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  input.className = 'rename-input';
  return input;
}

// ── Colour Menu ───────────────────────────────────────────────────────────────

function showColorMenu(e, personId) {
  e.preventDefault();
  closeColorMenu();
  SoundKit.sfx.pop();
  const menu = el('div', 'color-menu');
  const x = Math.min(e.clientX, window.innerWidth - 170);
  const y = Math.min(e.clientY, window.innerHeight - 80);
  menu.style.left = x + 'px';
  menu.style.top  = y + 'px';
  COLORS.forEach((color, i) => {
    const sw = el('button', 'color-swatch');
    sw.style.background = color;
    sw.title = `Colour ${i + 1}`;
    if (state.people[personId].color === i) sw.classList.add('selected');
    sw.addEventListener('click', () => {
      state.people[personId].color = i;
      saveState(); render();
      closeColorMenu();
      SoundKit.sfx.click();
    });
    menu.appendChild(sw);
  });
  document.getElementById('color-menu-host').appendChild(menu);
  activeColorMenu = menu;
  setTimeout(() => document.addEventListener('click', closeColorMenu, { once: true }), 0);
}
function closeColorMenu() {
  if (activeColorMenu) { activeColorMenu.remove(); activeColorMenu = null; }
}

// ── Add / Remove Car & Perthon ───────────────────────────────────────────────

function addCarAction() {
  if (state.cars.length >= MAX_CARS) { showToast(`Max ${MAX_CARS} carth`, 'error'); return; }
  showFormModal({
    title: 'Add a car',
    fields: [
      { name: 'name',     label: 'Car name',     type: 'text',   placeholder: "e.g. Priya's Car", value: '' },
      { name: 'capacity', label: 'Theath (2–8)', type: 'number', placeholder: '4',                value: '4', min: 2, max: 8 }
    ],
    confirmText: 'Add Car',
    onConfirm(vals) {
      const name = vals.name.trim();
      const cap  = parseInt(vals.capacity, 10);
      if (!name)                            { showToast('Car name ith required', 'error'); return; }
      if (isNaN(cap) || cap < 2 || cap > 8) { showToast('Theath mutht be 2–8', 'error');   return; }
      const id = 'c' + state.nextId++;
      state.cars.push({ id, name, capacity: cap, seats: Array(cap).fill(null) });
      saveState(); render(); hideModal();
      window.BigBacks?.activity.log('beachDay', 'add_car', { name });
    }
  });
}

function removeCarAction(carId) {
  const car = state.cars.find(c => c.id === carId);
  if (!confirm(`Remove "${car.name}"? People inthide will go to the unathigned pool.`)) return;
  state.pool.push(...car.seats.filter(Boolean));
  state.cars = state.cars.filter(c => c.id !== carId);
  saveState(); render();
  SoundKit.sfx.remove();
}

function addPersonAction() {
  const total = Object.keys(state.people).length;
  if (total >= MAX_PEOPLE) { showToast(`Max ${MAX_PEOPLE} perthonth`, 'error'); return; }
  showFormModal({
    title: 'Add a perthon',
    fields: [{ name: 'name', label: 'Name', type: 'text', placeholder: 'e.g. Alex', value: '' }],
    confirmText: 'Add Perthon',
    onConfirm(vals) {
      const name = vals.name.trim();
      if (!name) { showToast('Name ith required', 'error'); return; }
      const dup = Object.values(state.people).some(p => p.name === name);
      if (dup) showToast(`"${name}" already exitht`, 'warning');
      const id = 'p' + state.nextId++;
      const color = total % COLORS.length;
      state.people[id] = { id, name, color, from:'', transport:'train', cost:0, arrival:'', picture:'' };
      state.pool.push(id);
      saveState(); render(); hideModal();
      window.BigBacks?.activity.log('beachDay', 'add_person', { name });
      window.BigBacks?.stats.update('beachDay', { peopleCount: Object.keys(state.people).length, totalCost: totalCost() });
    }
  });
}

function removePersonAction(personId) {
  const person = state.people[personId];
  if (!confirm(`Remove "${person.name}"?`)) return;
  state.cars.forEach(car => { car.seats = car.seats.map(s => s === personId ? null : s); });
  state.pool = state.pool.filter(id => id !== personId);
  delete state.people[personId];
  saveState(); render();
  SoundKit.sfx.remove();
}

// ── Copy ──────────────────────────────────────────────────────────────────────

function copyLineup() {
  const lines = [`🏖 Big Backth Beach Day — going to ${state.beachName}`, ''];
  state.cars.forEach(car => {
    const occ = car.seats.filter(Boolean).length;
    lines.push(`${car.name} [${occ}/${car.capacity} theath]`);
    car.seats.forEach((pid, i) => {
      const name = pid ? (state.people[pid]?.name ?? '?') : '(empty)';
      lines.push(`  ${i + 1}. ${name}`);
    });
    lines.push('');
  });
  if (state.pool.length) {
    lines.push('Not in a car yet');
    state.pool.forEach(id => lines.push(`  • ${state.people[id]?.name ?? '?'}`));
  }
  copyText(lines.join('\n'), 'Lineup copied!');
}

function copyTravelPlan() {
  const total = totalCost();
  const lines = [
    `🏖 Big Backth Beach Day — Travel & Coth`,
    `📍 Detthtination: ${state.beachName}`,
    ''
  ];
  orderedPeople().forEach(pid => {
    const p = state.people[pid];
    const transport = ({ drive:'🚗 drive', train:'🚆 train', bus:'🚌 buth', walk:'🚶 walk', bike:'🚲 bike' }[p.transport]) || p.transport;
    const from = p.from || '(unthet)';
    const arrival = p.arrival || '?';
    const cost = formatCurrency(p.cost || 0, 'GBP');
    lines.push(`• ${p.name} — from ${from} by ${transport}, ${cost}, arrive ${arrival}`);
  });
  lines.push('');
  lines.push(`Total: ${formatCurrency(total, 'GBP')}`);
  PRIMARY_CURRENCIES.forEach(code => {
    lines.push(`  ${code}: ${formatCurrency(total, code)}`);
  });
  copyText(lines.join('\n'), 'Travel plan copied!');
}

function copyText(text, successMsg) {
  navigator.clipboard.writeText(text)
    .then(() => {
      SoundKit.sfx.coin();
      window.BigBacks?.activity.log('beachDay', 'copy', {});
      showToast(successMsg, 'success');
    })
    .catch(() => showToast('Copy failed', 'error'));
}

// ── Reset ─────────────────────────────────────────────────────────────────────

function resetToDefault() {
  if (!confirm('Rethet everything back to the original lineup?')) return;
  state = deepClone(DEFAULT_STATE);
  saveState(); render();
  SoundKit.sfx.reset();
  window.BigBacks?.activity.log('beachDay', 'reset', {});
  window.BigBacks?.stats.update('beachDay', { peopleCount: Object.keys(state.people).length, totalCost: totalCost() });
  showToast('Rethet to defaultth', 'info');
}

// ── Modal: form mode ─────────────────────────────────────────────────────────

function showFormModal({ title, fields, confirmText, onConfirm }) {
  modalMode = 'form';
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-confirm-btn').textContent = confirmText || 'Confirm';
  document.getElementById('modal-confirm-btn').style.display = '';
  document.getElementById('modal-cancel-btn').textContent = 'Canthel';
  document.getElementById('modal-body').innerHTML = '';

  const form = document.getElementById('modal-form');
  form.innerHTML = '';

  const inputMap = {};
  fields.forEach(f => {
    const wrap = el('div', 'modal-field');
    const label = document.createElement('label');
    label.textContent = f.label;
    const input = document.createElement('input');
    input.type = f.type || 'text';
    input.value = f.value ?? '';
    if (f.placeholder) input.placeholder = f.placeholder;
    if (f.min != null) input.min = f.min;
    if (f.max != null) input.max = f.max;
    inputMap[f.name] = input;
    label.appendChild(input);
    wrap.appendChild(label);
    form.appendChild(wrap);
  });

  form.onsubmit = (e) => {
    e.preventDefault();
    const vals = {};
    Object.entries(inputMap).forEach(([k, inp]) => { vals[k] = inp.value; });
    onConfirm(vals);
  };

  openModal();
  setTimeout(() => form.querySelector('input')?.focus(), 60);
}

// ── Modal: info mode (currencies) ────────────────────────────────────────────

function showAllCurrencies() {
  modalMode = 'info';
  document.getElementById('modal-title').textContent = 'All currentheeth ♡';
  document.getElementById('modal-confirm-btn').style.display = 'none';
  document.getElementById('modal-cancel-btn').textContent = 'Cloth';
  document.getElementById('modal-form').innerHTML = '';

  const total = totalCost();
  const body = document.getElementById('modal-body');
  body.innerHTML = '';

  const note = el('div', 'currencies-note');
  note.textContent = `Total ${formatCurrency(total, 'GBP')} converted at approximate rateth ♡`;
  body.appendChild(note);

  const grid = el('div', 'currencies-all-grid');
  Object.entries(RATES).forEach(([code, info]) => {
    const pill = el('div', 'currency-pill');
    const c = el('div', 'currency-code');
    c.textContent = code;
    const n = el('div', 'currency-name');
    n.textContent = info.name;
    const v = el('div', 'currency-value');
    v.textContent = formatCurrency(total, code);
    pill.append(c, n, v);
    grid.appendChild(pill);
  });
  body.appendChild(grid);

  openModal();
}

function openModal() {
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  SoundKit.sfx.open();
}

function hideModal() {
  const wasOpen = document.getElementById('modal-overlay').classList.contains('open');
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
  if (wasOpen) SoundKit.sfx.close();
  // reset
  document.getElementById('modal-confirm-btn').style.display = '';
  document.getElementById('modal-confirm-btn').disabled = false;
  document.getElementById('modal-confirm-btn').onclick = null;
  document.getElementById('modal-cancel-btn').textContent = 'Canthel';
  document.getElementById('modal-body').innerHTML = '';
  document.getElementById('modal-form').innerHTML = '';
  // Keep a permanent preventDefault so a stray submit (after onclick clears state) never reloads the page.
  document.getElementById('modal-form').onsubmit = (e) => e.preventDefault();
}

// ── Modal: upload mode (picture) ─────────────────────────────────────────────

function showUploadModal(personId) {
  modalMode = 'upload';
  const person = state.people[personId];
  if (!person) return;

  document.getElementById('modal-title').textContent = `Upload picture for ${person.name}`;
  document.getElementById('modal-form').innerHTML = '';
  document.getElementById('modal-form').onsubmit = (e) => e.preventDefault();

  const cancelBtn = document.getElementById('modal-cancel-btn');
  cancelBtn.textContent = 'Canthel';

  const confirmBtn = document.getElementById('modal-confirm-btn');
  confirmBtn.style.display = '';
  confirmBtn.textContent = 'Thave picture';
  confirmBtn.disabled = true;

  const body = document.getElementById('modal-body');
  body.innerHTML = '';

  let stagedDataURL = '';

  // Current preview (large circle showing current picture or initial)
  const previewWrap = el('div', 'upload-preview-wrap');
  const preview = el('div', 'upload-preview');
  if (person.picture) {
    preview.style.backgroundImage = `url("${person.picture}")`;
  } else {
    preview.classList.add('upload-preview-fallback');
    preview.style.background = COLORS[person.color];
    preview.textContent = initialOf(person.name);
  }
  const previewCaption = el('div', 'upload-preview-caption');
  previewCaption.textContent = person.picture ? 'Current picture' : 'No picture yet';
  previewWrap.append(preview, previewCaption);
  body.appendChild(previewWrap);

  // Hidden file input (with camera capture on mobile)
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.setAttribute('capture', 'environment'); // mobile: prefer rear camera
  fileInput.style.display = 'none';
  body.appendChild(fileInput);

  // Add a 📷 "Take photo" button alongside (visible only on touch devices)
  if (window.matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window) {
    const cameraInput = document.createElement('input');
    cameraInput.type = 'file';
    cameraInput.accept = 'image/*';
    cameraInput.setAttribute('capture', 'user'); // optional: front camera button
    cameraInput.style.display = 'none';
    body.appendChild(cameraInput);
  }

  // Dropzone
  const dropzone = el('div', 'upload-dropzone');
  dropzone.innerHTML = '<div class="dz-emoji">📷</div><div class="dz-text">Click or drop an image ♡</div><div class="dz-sub">Anyone can upload — pictureth are thaved on thith device</div>';
  body.appendChild(dropzone);

  // Helper: stage a file
  async function stageFile(file) {
    try {
      const dataURL = await resizeImageToDataURL(file);
      // Soft cap — warn if compressed result is still very large
      if (dataURL.length > 400000) {
        showToast('Picture too large — try a thmaller one', 'warning');
        return;
      }
      stagedDataURL = dataURL;
      preview.style.backgroundImage = `url("${dataURL}")`;
      preview.classList.remove('upload-preview-fallback');
      preview.textContent = '';
      previewCaption.textContent = 'New picture (not yet thaved)';
      confirmBtn.disabled = false;
    } catch (err) {
      if (err && err.message === 'not an image') {
        showToast('Pleathe chooth an image file', 'error');
      } else {
        showToast("Couldn't read that file", 'error');
      }
    }
  }

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
  dropzone.tabIndex = 0;

  fileInput.addEventListener('change', () => {
    const f = fileInput.files && fileInput.files[0];
    if (f) stageFile(f);
  });

  ['dragenter', 'dragover'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault(); e.stopPropagation();
      dropzone.classList.add('drag-over');
    });
  });
  ['dragleave', 'drop'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault(); e.stopPropagation();
      if (evt === 'dragleave' && dropzone.contains(e.relatedTarget)) return;
      dropzone.classList.remove('drag-over');
    });
  });
  dropzone.addEventListener('drop', (e) => {
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) stageFile(f);
  });

  // Remove picture link (only if one exists)
  if (person.picture) {
    const removeWrap = el('div', 'upload-remove-wrap');
    const removeLink = el('button', 'remove-picture-link');
    removeLink.type = 'button';
    removeLink.textContent = '✕ Remove picture';
    removeLink.addEventListener('click', () => {
      const previous = state.people[personId].picture;
      state.people[personId].picture = '';
      if (saveState()) {
        render();
        hideModal();
        SoundKit.sfx.remove();
        showToast('Picture removed', 'info');
      } else {
        state.people[personId].picture = previous;
      }
    });
    removeWrap.appendChild(removeLink);
    body.appendChild(removeWrap);
  }

  // Save handler
  confirmBtn.onclick = () => {
    if (!stagedDataURL) return;
    const previous = state.people[personId].picture;
    state.people[personId].picture = stagedDataURL;
    if (saveState()) {
      render();
      hideModal();
      SoundKit.sfx.upload();
      window.BigBacks?.activity.log('beachDay', 'upload', { name: person.name });
      showToast('Picture thaved ♡', 'success', { silent: true });
    } else {
      // saveState() already toasted the error
      state.people[personId].picture = previous;
    }
  };

  openModal();
}

// ── Settings drawer ───────────────────────────────────────────────────────────

function openSettings() {
  const wasOpen = document.getElementById('settings-drawer').classList.contains('open');
  document.getElementById('settings-overlay').classList.add('open');
  document.getElementById('settings-drawer').classList.add('open');
  document.body.style.overflow = 'hidden';
  if (!wasOpen) SoundKit.sfx.open();
}
function closeSettings() {
  const wasOpen = document.getElementById('settings-drawer').classList.contains('open');
  document.getElementById('settings-overlay').classList.remove('open');
  document.getElementById('settings-drawer').classList.remove('open');
  document.body.style.overflow = '';
  if (wasOpen) SoundKit.sfx.close();
}

// ── Toast ─────────────────────────────────────────────────────────────────────

const TOAST_SOUND = { success: 'success', error: 'error', warning: 'error', info: 'pop' };
function showToast(msg, type = 'info', opts = {}) {
  const t = el('div', `toast ${type}`);
  t.textContent = msg;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => t.remove(), 3200);
  if (!opts.silent) {
    const fn = SoundKit.sfx[TOAST_SOUND[type] || 'pop'];
    if (fn) fn();
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────────

function setup() {
  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.getElementById('settings-close-btn').addEventListener('click', closeSettings);
  document.getElementById('settings-overlay').addEventListener('click', closeSettings);

  document.getElementById('add-car-btn').addEventListener('click', addCarAction);
  document.getElementById('add-person-btn').addEventListener('click', addPersonAction);

  document.getElementById('copy-lineup-btn').addEventListener('click', () => { copyLineup(); closeSettings(); });
  document.getElementById('copy-travel-btn').addEventListener('click', () => { copyTravelPlan(); closeSettings(); });
  document.getElementById('reset-btn').addEventListener('click', () => {
    closeSettings();
    setTimeout(resetToDefault, 150);
  });

  document.getElementById('modal-cancel-btn').addEventListener('click', hideModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-overlay')) hideModal();
  });

  document.getElementById('beach-name').addEventListener('dblclick', startBeachRename);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeSettings(); hideModal(); closeColorMenu(); }
  });

  setupPoolDrop();
  setupAudio();
}

// ── Audio wiring ─────────────────────────────────────────────────────────────

function setupAudio() {
  const muteBtn = document.getElementById('mute-btn');
  const slider  = document.getElementById('volume-slider');
  const dvIcon  = document.getElementById('dv-icon');

  function syncMuteUI() {
    const m = SoundKit.isMuted();
    muteBtn.textContent = m ? '🔇' : '🔊';
    muteBtn.classList.toggle('muted', m);
    if (dvIcon) dvIcon.textContent = m ? '🔇' : (SoundKit.getVolume() > 0.5 ? '🔊' : '🔉');
  }

  muteBtn.addEventListener('click', () => {
    SoundKit.setMuted(!SoundKit.isMuted());
    SoundKit.sfx.toggle();
    syncMuteUI();
  });

  if (slider) {
    slider.value = String(SoundKit.getVolume());
    slider.addEventListener('input', () => {
      SoundKit.setVolume(parseFloat(slider.value));
      syncMuteUI();
    });
    slider.addEventListener('change', () => SoundKit.sfx.click());
  }

  syncMuteUI();

  // Browsers block AudioContext until a user gesture — kick it off on first click/tap/keypress.
  const firstGesture = () => {
    SoundKit.init();
    syncMuteUI();
    document.removeEventListener('click', firstGesture, true);
    document.removeEventListener('touchstart', firstGesture, true);
    document.removeEventListener('keydown', firstGesture, true);
  };
  document.addEventListener('click', firstGesture, true);
  document.addEventListener('touchstart', firstGesture, true);
  document.addEventListener('keydown', firstGesture, true);
}

// ── Chat ──────────────────────────────────────────────────────────────────────
// Three layers:
//  1. localStorage — message cache, persists across reloads
//  2. BroadcastChannel — live sync between tabs on the same device
//  3. JSONbin.io REST polling — REAL cross-device sync when a room + API key are set
//     (free key from jsonbin.io, 30-second signup, 100K reqs/month free tier)
// Sign-in is in sessionStorage so closing the tab signs you out (temporary).
//
// Why not JSONblob? CORS broken on POST responses — browsers reject the reply.
// Why not Firebase? Requires more setup. JSONbin = paste one key and done.

const CHAT_MSGS_KEY    = 'bigbacks_chat_messages';
const CHAT_SESSION_KEY = 'bigbacks_chat_session';
const CHAT_ROOM_KEY    = 'bigbacks_chat_room';
const CHAT_KEY_KEY     = 'bigbacks_chat_apikey';
const CHAT_CHANNEL     = 'bigbacks_chat_v1';
const CHAT_MAX         = 500;
const JSONBIN_API      = 'https://api.jsonbin.io/v3/b';
const CHAT_POLL_MS     = 4000;

const Chat = (() => {
  let me = null;        // { id, name, avatar, color }
  let messages = [];
  let bc = null;
  let unread = 0;
  let isOpen = false;
  let pendingAvatar = '';
  let roomId = '';
  let apiKey = '';
  let pollTimer = null;
  let pushQueue = Promise.resolve(); // serialize remote pushes
  let lastRemoteHash = '';

  function init() {
    loadMessages();
    loadSession();
    loadRoom();
    setupBroadcast();
    setupUI();
    syncSignInUI();
    renderMessages();
    if (roomId) startPolling(true);
    updateStatusLine();
  }

  // ── Room (cross-device via JSONblob) ──

  function loadRoom() {
    // URL takes priority — visiting a shared link auto-joins & auto-sets key
    let urlRoom = '', urlKey = '';
    try {
      const url = new URL(window.location.href);
      urlRoom = url.searchParams.get('room') || '';
      urlKey  = url.searchParams.get('key')  || '';
    } catch {}
    if (urlKey)  { apiKey = urlKey.trim();  localStorage.setItem(CHAT_KEY_KEY, apiKey); }
    else         { apiKey = localStorage.getItem(CHAT_KEY_KEY) || ''; }
    if (urlRoom) { roomId = urlRoom.trim(); localStorage.setItem(CHAT_ROOM_KEY, roomId); }
    else         { roomId = localStorage.getItem(CHAT_ROOM_KEY) || ''; }
  }

  function setApiKey(k) {
    apiKey = (k || '').trim();
    if (apiKey) localStorage.setItem(CHAT_KEY_KEY, apiKey);
    else        localStorage.removeItem(CHAT_KEY_KEY);
  }

  function setRoomInUrl(id) {
    try {
      const url = new URL(window.location.href);
      if (id)     url.searchParams.set('room', id);   else url.searchParams.delete('room');
      if (apiKey) url.searchParams.set('key', apiKey); else url.searchParams.delete('key');
      window.history.replaceState({}, '', url.toString());
    } catch {}
  }

  function roomUrl() {
    if (!roomId) return '';
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('room', roomId);
      if (apiKey) url.searchParams.set('key', apiKey);
      url.hash = '';
      return url.toString();
    } catch {
      const base = window.location.href.split('?')[0];
      return base + '?room=' + roomId + (apiKey ? '&key=' + apiKey : '');
    }
  }

  function binHeaders(extra) {
    return Object.assign(
      { 'X-Master-Key': apiKey, 'X-Bin-Meta': 'false' },
      extra || {}
    );
  }

  async function createRoom() {
    if (!apiKey) throw new Error('API key required — paste your JSONbin key first');
    const payload = { messages: [], created: Date.now(), v: 1 };
    const res = await fetch(JSONBIN_API, {
      method: 'POST',
      headers: binHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}${txt ? ' — ' + txt.slice(0, 80) : ''}`);
    }
    const body = await res.json();
    // JSONbin returns { record, metadata: { id, ... } } OR { metadata: { id } } depending on X-Bin-Meta
    let newId = (body && body.metadata && body.metadata.id) || (body && body.id) || '';
    if (!newId) throw new Error('no room ID returned');
    roomId = newId;
    localStorage.setItem(CHAT_ROOM_KEY, roomId);
    setRoomInUrl(roomId);
    startPolling(true);
    updateStatusLine();
    return roomId;
  }

  async function joinRoomById(input) {
    if (!apiKey) throw new Error('API key required — paste your JSONbin key first');
    let clean = String(input || '').trim();
    // Accept full URL or bare ID
    try {
      const u = new URL(clean);
      const r = u.searchParams.get('room');
      const k = u.searchParams.get('key');
      if (r) clean = r;
      if (k) setApiKey(k);
    } catch {}
    if (!clean) throw new Error('empty room ID');
    // Validate by fetching once
    const res = await fetch(`${JSONBIN_API}/${encodeURIComponent(clean)}/latest`, {
      headers: binHeaders()
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new Error('wrong API key');
      if (res.status === 404) throw new Error('room not found');
      throw new Error('HTTP ' + res.status);
    }
    roomId = clean;
    localStorage.setItem(CHAT_ROOM_KEY, roomId);
    setRoomInUrl(roomId);
    try {
      const body = await res.json();
      const msgs = body && body.record && Array.isArray(body.record.messages) ? body.record.messages : [];
      mergeRemote(msgs);
    } catch {}
    startPolling(true);
    updateStatusLine();
  }

  function leaveRoom() {
    roomId = '';
    localStorage.removeItem(CHAT_ROOM_KEY);
    setRoomInUrl('');
    stopPolling();
    updateStatusLine();
  }

  function mergeRemote(remoteMsgs) {
    if (!Array.isArray(remoteMsgs)) return false;
    const seen = new Set(messages.map(m => m.id));
    let added = 0;
    remoteMsgs.forEach(m => {
      if (m && m.id && !seen.has(m.id)) {
        messages.push(m);
        added++;
      }
    });
    if (added > 0) {
      messages.sort((a, b) => (a.ts || 0) - (b.ts || 0));
      messages = messages.slice(-CHAT_MAX);
      saveMessages();
    }
    return added;
  }

  function startPolling(immediate) {
    stopPolling();
    if (!roomId || !apiKey) return;
    const tick = async () => {
      try {
        const res = await fetch(`${JSONBIN_API}/${encodeURIComponent(roomId)}/latest`, {
          headers: binHeaders(),
          cache: 'no-store'
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const body = await res.json();
        const remote = (body && body.record && Array.isArray(body.record.messages)) ? body.record.messages : [];
        // Cheap change detector — hash of latest IDs
        const hash = remote.length + ':' + (remote[remote.length - 1] || {}).id;
        if (hash !== lastRemoteHash) {
          lastRemoteHash = hash;
          const before = messages.length;
          const added = mergeRemote(remote);
          if (added > 0) {
            renderMessages();
            const newOnes = messages.slice(-added);
            const fromOthers = newOnes.some(m => !me || m.userId !== me.id);
            if (fromOthers) {
              if (isOpen) SoundKit.sfx.notify();
              else { unread += newOnes.filter(m => !me || m.userId !== me.id).length; updateBadge(); SoundKit.sfx.notify(); }
            }
          }
        }
      } catch (err) {
        // Soft failure — keep polling, but mark status
        // Don't spam toasts on every failure
      }
    };
    if (immediate) tick();
    pollTimer = setInterval(tick, CHAT_POLL_MS);
  }

  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }

  async function pushRemote() {
    if (!roomId || !apiKey) return;
    // Serialize so concurrent sends don't race
    pushQueue = pushQueue.then(async () => {
      try {
        // Read-modify-write: fetch current, merge our local, write back
        const getRes = await fetch(`${JSONBIN_API}/${encodeURIComponent(roomId)}/latest`, {
          headers: binHeaders(),
          cache: 'no-store'
        });
        let current = [];
        if (getRes.ok) {
          const body = await getRes.json();
          current = (body && body.record && Array.isArray(body.record.messages)) ? body.record.messages : [];
        }
        const seen = new Set(current.map(m => m.id));
        messages.forEach(m => { if (!seen.has(m.id)) current.push(m); });
        current.sort((a, b) => (a.ts || 0) - (b.ts || 0));
        current = current.slice(-CHAT_MAX);
        const putRes = await fetch(`${JSONBIN_API}/${encodeURIComponent(roomId)}`, {
          method: 'PUT',
          headers: binHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ messages: current, updated: Date.now(), v: 1 })
        });
        if (!putRes.ok) throw new Error('HTTP ' + putRes.status);
        lastRemoteHash = current.length + ':' + (current[current.length - 1] || {}).id;
        mergeRemote(current);
        renderMessages();
      } catch (err) {
        // Silent failure — message stays local, polling will eventually surface remote ones
      }
    });
    return pushQueue;
  }

  function updateStatusLine() {
    const s = document.getElementById('chat-status');
    if (!s) return;
    if (roomId) {
      s.innerHTML = `🌐 <strong>connected</strong> · room <code>${escapeHtml(roomId.slice(0, 8))}</code>`;
    } else if (me) {
      s.textContent = `🏠 local mode · thigned in as ${me.name}`;
    } else {
      s.textContent = '🏠 local mode · thith device only';
    }
    const roomBtn = document.getElementById('chat-room-btn');
    if (roomBtn) {
      roomBtn.classList.toggle('connected', !!roomId);
      roomBtn.title = roomId ? 'Connected — manage room' : 'Start a chat room for everyone';
    }
  }

  function loadMessages() {
    try {
      const raw = localStorage.getItem(CHAT_MSGS_KEY);
      messages = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(messages)) messages = [];
    } catch { messages = []; }
  }

  function saveMessages() {
    try {
      const trimmed = messages.slice(-CHAT_MAX);
      messages = trimmed;
      localStorage.setItem(CHAT_MSGS_KEY, JSON.stringify(trimmed));
    } catch (err) {
      if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
        // Try halving and saving again
        messages = messages.slice(-Math.floor(CHAT_MAX / 2));
        try { localStorage.setItem(CHAT_MSGS_KEY, JSON.stringify(messages)); }
        catch {}
        showToast('Chat storage full — trimmed old metthageth', 'warning');
      }
    }
  }

  function loadSession() {
    try {
      const raw = sessionStorage.getItem(CHAT_SESSION_KEY);
      me = raw ? JSON.parse(raw) : null;
    } catch { me = null; }
  }

  function saveSession() {
    try {
      if (me) sessionStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(me));
      else sessionStorage.removeItem(CHAT_SESSION_KEY);
    } catch {}
  }

  function setupBroadcast() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel(CHAT_CHANNEL);
        bc.onmessage = (ev) => {
          if (!ev || !ev.data) return;
          if (ev.data.type === 'msg' || ev.data.type === 'clear') {
            loadMessages();
            renderMessages();
            if (ev.data.type === 'msg' && (!me || ev.data.userId !== me.id)) {
              if (isOpen) SoundKit.sfx.notify();
              else { unread++; updateBadge(); SoundKit.sfx.notify(); }
            }
          }
        };
      } catch {}
    }
    // Cross-tab storage events as a secondary signal (in case BC unavailable)
    window.addEventListener('storage', (e) => {
      if (e.key === CHAT_MSGS_KEY) {
        loadMessages();
        renderMessages();
      }
    });
  }

  function setupUI() {
    document.getElementById('chat-fab').addEventListener('click', open);
    document.getElementById('chat-close').addEventListener('click', closeChat);
    document.getElementById('chat-overlay').addEventListener('click', closeChat);
    document.getElementById('chat-clear').addEventListener('click', clearChat);
    document.getElementById('chat-room-btn').addEventListener('click', showRoomModal);

    const signinAvatarBtn = document.getElementById('signin-avatar');
    const signinFile = document.getElementById('signin-file');
    const signinName = document.getElementById('signin-name');
    const signinBtn  = document.getElementById('signin-btn');

    signinAvatarBtn.addEventListener('click', () => signinFile.click());
    signinFile.addEventListener('change', async () => {
      const f = signinFile.files && signinFile.files[0];
      if (!f) return;
      try {
        const dataURL = await resizeImageToDataURL(f);
        pendingAvatar = dataURL;
        signinAvatarBtn.style.backgroundImage = `url("${dataURL}")`;
        signinAvatarBtn.classList.add('has-image');
      } catch (err) {
        if (err && err.message === 'not an image') {
          showToast('Pleathe chooth an image file', 'error');
        } else {
          showToast("Couldn't read that file", 'error');
        }
      }
    });

    signinBtn.addEventListener('click', signIn);
    signinName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); signIn(); }
    });

    document.getElementById('chat-send').addEventListener('click', sendMessage);
    document.getElementById('chat-signout').addEventListener('click', signOut);
    const input = document.getElementById('chat-input');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });

    // Esc closes chat too
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closeChat();
    });
  }

  function signIn() {
    const name = document.getElementById('signin-name').value.trim();
    if (!name) { showToast('Type a name firtht', 'error'); return; }
    me = {
      id: 'u_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
      name,
      avatar: pendingAvatar || '',
      color: Math.floor(Math.random() * COLORS.length)
    };
    saveSession();
    syncSignInUI();
    updateStatusLine();
    SoundKit.sfx.success();
    document.getElementById('chat-input').focus();
  }

  function signOut() {
    if (!confirm('Thign out of chat? Your metthageth thtay viewable, you just thtop being thigned in.')) return;
    me = null;
    pendingAvatar = '';
    saveSession();
    syncSignInUI();
    updateStatusLine();
    SoundKit.sfx.close();
  }

  function clearChat() {
    const scope = roomId ? 'in thith room (for EVERYONE in it)' : 'on thith device';
    if (!confirm(`Clear ALL chat metthageth ${scope}? Thith cannot be undone.`)) return;
    messages = [];
    saveMessages();
    if (bc) try { bc.postMessage({ type: 'clear' }); } catch {}
    if (roomId && apiKey) {
      // Push empty list to remote so other devices clear too on next poll
      pushQueue = pushQueue.then(async () => {
        try {
          await fetch(`${JSONBIN_API}/${encodeURIComponent(roomId)}`, {
            method: 'PUT',
            headers: binHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ messages: [], cleared: Date.now(), v: 1 })
          });
          lastRemoteHash = '0:undefined';
        } catch {}
      });
    }
    renderMessages();
    SoundKit.sfx.reset();
    showToast('Chat cleared', 'info', { silent: true });
  }

  function sendMessage() {
    if (!me) return;
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    const msg = {
      id: 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      userId: me.id,
      name: me.name,
      avatar: me.avatar,
      color: me.color,
      text,
      ts: Date.now()
    };
    messages.push(msg);
    saveMessages();
    input.value = '';
    renderMessages();
    SoundKit.sfx.send();
    if (bc) try { bc.postMessage({ type: 'msg', userId: me.id }); } catch {}
    if (roomId) pushRemote(); // fire-and-forget; queued internally
    window.BigBacks?.activity.log('beachDay', 'message', { len: text.length });
    input.focus();
  }

  function showRoomModal() {
    modalMode = 'info';
    document.getElementById('modal-title').textContent = '🌐 Chat Room';
    document.getElementById('modal-confirm-btn').style.display = 'none';
    document.getElementById('modal-cancel-btn').textContent = 'Cloth';
    document.getElementById('modal-form').innerHTML = '';
    const body = document.getElementById('modal-body');
    body.innerHTML = '';

    // ── API key setup (always shown first if missing) ──
    if (!apiKey) {
      const setupStatus = el('div', 'room-status');
      setupStatus.innerHTML = '<strong>💬 Chat workth two wayth</strong>';
      body.appendChild(setupStatus);

      // Option 1: Just use local chat (zero setup)
      const localSection = el('div', 'room-section room-option-local');
      localSection.innerHTML = `
        <div class="ro-title">🏠 LOCAL CHAT <span class="ro-badge">no thetup</span></div>
        <div class="ro-desc">Works right now. Lives on thith device + thyncs between tabth. Your metthageth perthitht across reloadth.</div>
        <button type="button" class="btn btn-secondary btn-full ro-use-local">Use chat locally ♡</button>
      `;
      localSection.querySelector('.ro-use-local').addEventListener('click', () => {
        hideModal();
        showToast('Chat is ready — local mode ♡', 'success');
      });
      body.appendChild(localSection);

      const or = el('div', 'room-or');
      or.textContent = '— or —';
      body.appendChild(or);

      // Option 2: Cross-device (needs JSONbin key)
      const intro = el('div', 'room-section');
      intro.innerHTML = `
        <div class="ro-title">🌐 CROSS-DEVICE CHAT <span class="ro-badge ro-badge-pro">30 thec thetup</span></div>
        <p class="ro-desc">For friendth on other phoneth/devicheth. Needth a free JSONbin key (100k requestth/month).</p>
        <ol class="room-steps">
          <li>Open <a href="https://jsonbin.io/login" target="_blank" rel="noopener"><strong>jsonbin.io</strong></a> → thign up with Google or email</li>
          <li>From the dashboard, click <strong>API Keys</strong> → copy your <strong>X-Master-Key</strong></li>
          <li>Pathte it below ↓</li>
        </ol>
      `;
      body.appendChild(intro);

      const keySection = el('div', 'room-section');
      const wrap = el('div', 'room-url-wrap');
      const keyInput = document.createElement('input');
      keyInput.type = 'password';
      keyInput.placeholder = 'Pathte X-Master-Key';
      keyInput.autocomplete = 'off';
      const keyBtn = el('button', 'btn btn-primary btn-sm');
      keyBtn.type = 'button';
      keyBtn.textContent = 'Thave key';
      const doSave = () => {
        const k = keyInput.value.trim();
        if (!k) { showToast('Pathte the key firtht', 'error'); return; }
        setApiKey(k);
        hideModal();
        showToast('Key thaved ♡', 'success');
        setTimeout(() => showRoomModal(), 350);
      };
      keyInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doSave(); } });
      keyBtn.addEventListener('click', doSave);
      wrap.append(keyInput, keyBtn);
      keySection.appendChild(wrap);
      body.appendChild(keySection);

      const tip = el('div', 'room-tip');
      tip.innerHTML = '<strong>Privacy:</strong> the key is thaved on thith device only. If you share an invite link it includes the key tho friendth can write to the room. Don\'t share with thtrangerth ♡';
      body.appendChild(tip);

      openModal();
      return;
    }

    // ── Key is set — small status row + reset link ──
    const keyOk = el('div', 'room-status room-status-mini');
    keyOk.innerHTML = `<strong>🔑 API key configured</strong> <button type="button" class="room-reset-key">reset key</button>`;
    keyOk.querySelector('.room-reset-key').addEventListener('click', () => {
      if (!confirm('Reset your API key? You\'ll need to pathte it again.')) return;
      setApiKey('');
      leaveRoom();
      hideModal();
      setTimeout(() => showRoomModal(), 320);
    });
    body.appendChild(keyOk);

    if (roomId) {
      // Connected
      const status = el('div', 'room-status');
      status.innerHTML = `<strong>🌐 Connected ♡</strong><br><small>Room ID: <code>${escapeHtml(roomId)}</code></small>`;
      body.appendChild(status);

      const share = el('div', 'room-section');
      const shareLabel = el('p');
      shareLabel.innerHTML = 'Share thith link with the big backth ♡';
      share.appendChild(shareLabel);
      const wrap = el('div', 'room-url-wrap');
      const urlInput = document.createElement('input');
      urlInput.type = 'text';
      urlInput.readOnly = true;
      urlInput.value = roomUrl();
      urlInput.addEventListener('focus', () => urlInput.select());
      const copyBtn = el('button', 'btn btn-primary btn-sm');
      copyBtn.type = 'button';
      copyBtn.textContent = '📋 Copy';
      copyBtn.addEventListener('click', () => copyText(urlInput.value, 'Invite link copied!'));
      wrap.append(urlInput, copyBtn);
      share.appendChild(wrap);
      body.appendChild(share);

      const tip = el('div', 'room-tip');
      tip.textContent = 'Anyone with the link can join. Metthageth poll every 4 thecondth ♡';
      body.appendChild(tip);

      const leaveSection = el('div', 'room-section');
      const leaveBtn = el('button', 'btn btn-danger btn-full');
      leaveBtn.type = 'button';
      leaveBtn.textContent = 'Leave room';
      leaveBtn.addEventListener('click', () => {
        if (!confirm('Leave the chat room? You can rejoin with the link.')) return;
        leaveRoom();
        hideModal();
        showToast('Left the room — back to local mode', 'info');
      });
      leaveSection.appendChild(leaveBtn);
      body.appendChild(leaveSection);
    } else {
      // Not in a room
      const status = el('div', 'room-status');
      status.innerHTML = '<strong>🏠 Local mode</strong><br><small>Metthageth thtay on thith device only.</small>';
      body.appendChild(status);

      const create = el('div', 'room-section');
      const createP = el('p');
      createP.textContent = 'Thtart a chat room and everyone you share the link with can chat together in real-time ♡';
      create.appendChild(createP);
      const createBtn = el('button', 'btn btn-primary btn-full');
      createBtn.type = 'button';
      createBtn.textContent = '🌐 Start a chat room';
      createBtn.addEventListener('click', async () => {
        createBtn.disabled = true;
        createBtn.textContent = 'Creating room…';
        try {
          await createRoom();
          // Push any local messages so they survive the room creation
          if (messages.length > 0) await pushRemote();
          window.BigBacks?.activity.log('beachDay', 'create_room', { roomId });
          hideModal();
          showToast('Chat room created ♡', 'success');
          // Reopen modal to show the share link (small delay so close anim finishes)
          setTimeout(() => showRoomModal(), 380);
        } catch (err) {
          createBtn.disabled = false;
          createBtn.textContent = '🌐 Start a chat room';
          showToast('Couldn\'t start room: ' + (err.message || 'network error'), 'error');
        }
      });
      create.appendChild(createBtn);
      body.appendChild(create);

      const or = el('div', 'room-or');
      or.textContent = '— or join an exithting room —';
      body.appendChild(or);

      const join = el('div', 'room-section');
      const joinWrap = el('div', 'room-url-wrap');
      const joinInput = document.createElement('input');
      joinInput.type = 'text';
      joinInput.placeholder = 'Pathte room ID or invite link';
      const joinBtn = el('button', 'btn btn-secondary btn-sm');
      joinBtn.type = 'button';
      joinBtn.textContent = 'Join';
      const doJoin = async () => {
        let v = joinInput.value.trim();
        if (!v) { showToast('Pathte a room ID or link', 'error'); return; }
        // Extract room param if a URL was pasted
        try {
          const u = new URL(v);
          v = u.searchParams.get('room') || v;
        } catch {}
        joinBtn.disabled = true;
        joinBtn.textContent = 'Joining…';
        try {
          await joinRoomById(v);
          hideModal();
          showToast('Joined the room ♡', 'success');
          renderMessages();
        } catch (err) {
          joinBtn.disabled = false;
          joinBtn.textContent = 'Join';
          showToast('Couldn\'t join: ' + (err.message || 'invalid room'), 'error');
        }
      };
      joinInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doJoin(); } });
      joinBtn.addEventListener('click', doJoin);
      joinWrap.append(joinInput, joinBtn);
      join.appendChild(joinWrap);
      body.appendChild(join);

      const tip = el('div', 'room-tip');
      tip.innerHTML = '<strong>Heath up:</strong> rooms are public — anyone with the ID can read & write. Fine for friend groups, not for thecrets ♡';
      body.appendChild(tip);
    }

    openModal();
  }

  function open() {
    isOpen = true;
    unread = 0;
    updateBadge();
    document.getElementById('chat-panel').classList.add('open');
    document.getElementById('chat-overlay').classList.add('open');
    SoundKit.sfx.open();
    renderMessages();
    scrollToBottom(true);
    setTimeout(() => {
      if (!me) document.getElementById('signin-name').focus();
      else document.getElementById('chat-input').focus();
    }, 280);
  }

  function closeChat() {
    if (!isOpen) return;
    isOpen = false;
    document.getElementById('chat-panel').classList.remove('open');
    document.getElementById('chat-overlay').classList.remove('open');
    SoundKit.sfx.close();
  }

  function syncSignInUI() {
    const signin = document.getElementById('chat-signin');
    const main   = document.getElementById('chat-main');
    if (me) {
      signin.hidden = true;
      main.hidden = false;
      const av = document.getElementById('chat-me-avatar');
      if (me.avatar) {
        av.style.backgroundImage = `url("${me.avatar}")`;
        av.textContent = '';
        av.classList.add('has-image');
      } else {
        av.style.backgroundImage = '';
        av.style.background = COLORS[me.color || 0];
        av.textContent = initialOf(me.name);
        av.classList.remove('has-image');
      }
      av.title = `Thigned in as ${me.name}`;
      const status = document.getElementById('chat-status');
      if (status) status.textContent = `thigned in as ${me.name} ♡`;
    } else {
      signin.hidden = false;
      main.hidden = true;
      const av = document.getElementById('signin-avatar');
      av.style.backgroundImage = '';
      av.classList.remove('has-image');
      document.getElementById('signin-name').value = '';
      pendingAvatar = '';
      const status = document.getElementById('chat-status');
      if (status) status.textContent = 'tho cozy ♡';
    }
  }

  function renderMessages() {
    const list = document.getElementById('chat-messages');
    if (!list) return;
    list.innerHTML = '';

    if (messages.length === 0) {
      const empty = el('div', 'chat-empty');
      empty.textContent = me
        ? 'No metthageth yet — thay hi! ♡'
        : 'Thign in to thee and thend metthageth ♡';
      list.appendChild(empty);
      return;
    }

    let lastUserId = null;
    let lastDay = null;

    messages.forEach((msg, idx) => {
      const day = new Date(msg.ts).toDateString();
      if (day !== lastDay) {
        const sep = el('div', 'chat-day-sep');
        sep.textContent = formatDay(msg.ts);
        list.appendChild(sep);
        lastDay = day;
        lastUserId = null;
      }

      const isMine = me && msg.userId === me.id;
      const grouped = lastUserId === msg.userId;
      const row = el('div', 'chat-msg' + (isMine ? ' mine' : '') + (grouped ? ' grouped' : ''));

      if (!grouped) {
        const av = el('div', 'chat-avatar');
        if (msg.avatar) {
          av.style.backgroundImage = `url("${msg.avatar}")`;
        } else {
          av.textContent = initialOf(msg.name);
          av.style.background = COLORS[(msg.color != null ? msg.color : hashColor(msg.userId)) % COLORS.length];
        }
        row.appendChild(av);
      } else {
        row.appendChild(el('div', 'chat-avatar-spacer'));
      }

      const bubble = el('div', 'chat-bubble');
      if (!grouped) {
        const meta = el('div', 'chat-meta');
        const name = el('span', 'chat-name');
        name.textContent = msg.name;
        const time = el('span', 'chat-time');
        time.textContent = formatTime(msg.ts);
        meta.append(name, time);
        bubble.appendChild(meta);
      }
      const body = el('div', 'chat-body');
      body.textContent = msg.text;
      bubble.appendChild(body);
      row.appendChild(bubble);
      list.appendChild(row);
      lastUserId = msg.userId;
    });

    scrollToBottom();
  }

  function scrollToBottom(instant) {
    const list = document.getElementById('chat-messages');
    if (!list) return;
    const doIt = () => { list.scrollTop = list.scrollHeight; };
    if (instant) doIt();
    else requestAnimationFrame(doIt);
  }

  function updateBadge() {
    const badge = document.getElementById('chat-unread');
    if (!badge) return;
    if (unread > 0) {
      badge.textContent = unread > 99 ? '99+' : String(unread);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  function hashColor(s) {
    let h = 0;
    const str = String(s || '');
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  }

  function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDay(ts) {
    const d = new Date(ts);
    const now = new Date();
    const todayKey = now.toDateString();
    const yest = new Date(now.getTime() - 86400000).toDateString();
    const key = d.toDateString();
    if (key === todayKey) return 'Today';
    if (key === yest)     return 'Yethterday';
    return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  }

  return { init, open, close: closeChat };
})();

// ── Init ──────────────────────────────────────────────────────────────────────

loadState();
setup();
render();
Chat.init();

// Sync stats to BigBacks Hub network (if shared-profile.js is loaded)
window.BigBacks?.stats.update('beachDay', {
  peopleCount: Object.keys(state.people).length,
  totalCost:   totalCost(),
  carsCount:   state.cars.length,
});
