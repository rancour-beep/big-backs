// ─── Path resolution ───────────────────────────────────────────────────────
// Auto-detect deployment: kebab-case in production, original names locally.
const IS_DEPLOYED = location.hostname.endsWith('.github.io') ||
                    location.hostname.endsWith('.netlify.app') ||
                    location.hostname.endsWith('.vercel.app');

const DEFAULT_PATHS = IS_DEPLOYED
  ? {  // Production monorepo layout (recommended)
      beachDay: '../beach-day/',
      races:    '../races/',
      jam:      '../jam/',
    }
  : {  // Local dev (folder names with spaces)
      beachDay: '../big backs beach day/',
      races:    '../Big Backs Races/',
      jam:      '../Big Backs Jam/',
    };

// ─── App registry ──────────────────────────────────────────────────────────
const APPS = [
  {
    key:   'beachDay',
    name:  'BEACH DAY',
    icon:  '🏖',
    color: '#E5A8B3',
    color2:'#C8A4B5',
    desc:  'Carpool, costs, currencies, group chat',
    path:  DEFAULT_PATHS.beachDay,
    statLabel: (s) => `${s.peopleCount || 12} in the carpool · £${(s.totalCost || 179).toFixed(0)} total`,
  },
  {
    key:   'races',
    name:  'RACES',
    icon:  '🏁',
    color: '#FF4500',
    color2:'#FFD700',
    desc:  '3D arcade racer with garage & multiplayer',
    path:  DEFAULT_PATHS.races,
    statLabel: (s) => s.bestLap ? `Best lap: ${s.bestLap.toFixed(3)}s · ${s.wins||0} wins` : 'Hit the track — set a record',
  },
  {
    key:   'jam',
    name:  'JAM',
    icon:  '🎵',
    color: '#1DB954',
    color2:'#1ED760',
    desc:  'Collaborative Spotify playlist + QR code',
    path:  DEFAULT_PATHS.jam,
    statLabel: (s) => `${s.jamsHosted || 0} jamth hosted · ${s.tracksAdded || 0} trackth added`,
  },
];

const ACTIVITY_LABELS = {
  beachDay: {
    icon: '🏖',
    color: '#E5A8B3',
    events: {
      'upload':       (d) => `uploaded a picture for <b>${d.name || 'someone'}</b>`,
      'add_person':   (d) => `added <b>${d.name || 'a new perthon'}</b> to the carpool`,
      'add_car':      (d) => `added a new car: <b>${d.name || ''}</b>`,
      'reset':        ()  => `rethet the carpool to default`,
      'message':      (d) => `thent a chat metthage`,
      'create_room':  (d) => `thtarted a chat room`,
      'copy':         ()  => `copied the lineup to clipboard`,
    }
  },
  races: {
    icon: '🏁',
    color: '#FF4500',
    events: {
      'race_start':    (d) => `thtarted a race as <b>${d.character || 'someone'}</b>`,
      'race_finish':   (d) => `finithed lap ${d.lap||1} in <b>${d.time?.toFixed(3) || '?'}s</b>`,
      'garage_save':   (d) => `tuned their <b>${d.carType || 'car'}</b> in the garage`,
      'multiplayer':   (d) => `joined room <code>${d.roomId || ''}</code>`,
      'best_lap':      (d) => `🏆 new beth lap: <b>${d.time?.toFixed(3)||'?'}s</b>`,
    }
  },
  jam: {
    icon: '🎵',
    color: '#1DB954',
    events: {
      'create_jam':   (d) => `tcheated jam: <b>${d.name || 'untitled'}</b>`,
      'add_track':    (d) => `added <b>${d.track || 'a thong'}</b>`,
      'join_jam':     (d) => `joined a jam`,
      'leave_jam':    ()  => `left a jam`,
    }
  },
  hub: {
    icon: '🏠',
    color: '#9B7FFF',
    events: {
      'profile_set':  (d) => `thet their name to <b>${d.name || ''}</b>`,
      'avatar':       ()  => `updated their avatar`,
    }
  }
};

// ─── DOM helpers ───────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// ─── Boot ──────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', boot);

function boot() {
  renderApps();
  renderActivity();
  renderProfile();
  wireProfileModal();
  wireSettings();
  wireInstallPrompt();

  // Live cross-tab sync
  if (window.BigBacks) {
    BigBacks.onChange((key) => {
      if (key.includes('profile')) renderProfile();
      if (key.includes('activity')) renderActivity();
      if (key.includes('stats')) renderApps();
    });
  }

  // First-time visitor — open profile editor
  if (!BigBacks.profile.exists()) {
    setTimeout(() => openProfileModal(true), 600);
  }
}

// ─── App cards ─────────────────────────────────────────────────────────────
function renderApps() {
  const wrap = $('app-grid');
  const allStats = BigBacks.stats.all();
  wrap.innerHTML = APPS.map(app => {
    const stats = allStats[app.key] || {};
    const userPath = getUserPath(app.key, app.path);
    return `
      <a class="app-card" href="${userPath}" style="--c1:${app.color};--c2:${app.color2}" data-app="${app.key}">
        <div class="ac-bg"></div>
        <div class="ac-header">
          <span class="ac-icon">${app.icon}</span>
          <span class="ac-name">${app.name}</span>
        </div>
        <div class="ac-desc">${app.desc}</div>
        <div class="ac-stats">${app.statLabel(stats)}</div>
        <div class="ac-open">
          <span>OPEN</span>
          <span class="ac-arrow">→</span>
        </div>
      </a>
    `;
  }).join('');
}

// ─── Activity feed ─────────────────────────────────────────────────────────
function renderActivity() {
  const wrap = $('activity-list');
  const profile = BigBacks.profile.get();
  const events = BigBacks.activity.recent(20);

  if (events.length === 0) {
    wrap.innerHTML = `
      <div class="feed-empty">
        <div class="fe-icon">✨</div>
        <div class="fe-title">No activity yet</div>
        <div class="fe-sub">Open one of the apps above. As you do thingth, they'll show up here ♡</div>
        <div class="fe-tip">
          To wire up activity from the existing apps, copy <code>shared-profile.js</code> into each one and follow the README.
        </div>
      </div>
    `;
    return;
  }

  const me = profile?.name || 'You';
  wrap.innerHTML = events.map(ev => {
    const meta  = ACTIVITY_LABELS[ev.app] || ACTIVITY_LABELS.hub;
    const renderer = meta.events[ev.event];
    const text  = renderer ? renderer(ev.data || {}) : `did <b>${ev.event}</b>`;
    return `
      <div class="feed-row">
        <span class="fr-icon" style="background:${meta.color}20;color:${meta.color}">${meta.icon}</span>
        <div class="fr-body">
          <div class="fr-text"><b>${esc(me)}</b> ${text}</div>
          <div class="fr-time">${timeAgo(ev.ts)}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ─── Profile ──────────────────────────────────────────────────────────────
function renderProfile() {
  const p = BigBacks.profile.get();
  const chip = $('profile-chip');
  if (!p || !p.name) {
    chip.innerHTML = `
      <div class="pc-avatar pc-empty">?</div>
      <div class="pc-info">
        <div class="pc-name">Set up profile</div>
        <div class="pc-sub">Click to begin ♡</div>
      </div>
    `;
    return;
  }
  const avatarStyle = p.avatar
    ? `background-image:url('${p.avatar}');background-size:cover;background-position:center`
    : `background:${p.color || '#E5A8B3'}`;
  const initial = (p.name[0] || '?').toUpperCase();
  chip.innerHTML = `
    <div class="pc-avatar" style="${avatarStyle}">${p.avatar ? '' : initial}</div>
    <div class="pc-info">
      <div class="pc-name">${esc(p.name)}</div>
      <div class="pc-sub">tap to edit</div>
    </div>
  `;
}

function wireProfileModal() {
  $('profile-chip').addEventListener('click', () => openProfileModal(false));
  $('pm-close').addEventListener('click', closeProfileModal);
  $('pm-overlay').addEventListener('click', (e) => {
    if (e.target === $('pm-overlay')) closeProfileModal();
  });
  $('pm-save').addEventListener('click', saveProfile);
  $('pm-pic-btn').addEventListener('click', () => $('pm-pic-input').click());
  $('pm-pic-input').addEventListener('change', handlePicUpload);
  $('pm-color-input').addEventListener('input', (e) => {
    $('pm-pic-preview').style.background = e.target.value;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProfileModal();
  });
}

let pendingAvatar = '';

function openProfileModal(firstTime) {
  const p = BigBacks.profile.get() || {};
  $('pm-name-input').value  = p.name  || '';
  $('pm-color-input').value = p.color || '#E5A8B3';
  pendingAvatar = p.avatar || '';
  if (p.avatar) {
    $('pm-pic-preview').style.backgroundImage = `url('${p.avatar}')`;
    $('pm-pic-preview').textContent = '';
  } else {
    $('pm-pic-preview').style.background = p.color || '#E5A8B3';
    $('pm-pic-preview').style.backgroundImage = '';
    $('pm-pic-preview').textContent = (p.name?.[0] || '?').toUpperCase();
  }
  $('pm-title').textContent = firstTime ? 'WELCOME TO THE NETWORK' : 'EDIT YOUR PROFILE';
  $('pm-overlay').classList.add('open');
  setTimeout(() => $('pm-name-input').focus(), 200);
}

function closeProfileModal() {
  $('pm-overlay').classList.remove('open');
}

function saveProfile() {
  const name  = $('pm-name-input').value.trim();
  const color = $('pm-color-input').value;
  if (!name) { toast('Type a name firtht ♡', 'error'); return; }
  BigBacks.profile.update({ name, color, avatar: pendingAvatar });
  BigBacks.activity.log('hub', 'profile_set', { name });
  closeProfileModal();
  renderProfile();
  renderActivity();
  toast(`Welcome, ${name} ♡`, 'success');
}

async function handlePicUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    toast('Pleathe pick an image', 'error');
    return;
  }
  try {
    const dataUrl = await resizeImage(file, 256);
    pendingAvatar = dataUrl;
    $('pm-pic-preview').style.backgroundImage = `url('${dataUrl}')`;
    $('pm-pic-preview').style.backgroundSize = 'cover';
    $('pm-pic-preview').style.backgroundPosition = 'center';
    $('pm-pic-preview').textContent = '';
    BigBacks.activity.log('hub', 'avatar', {});
  } catch (err) {
    toast('Couldn\'t read that picture', 'error');
  }
}

function resizeImage(file, max = 256) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = max;
        const ctx = canvas.getContext('2d');
        const ratio = img.width / img.height;
        let sx, sy, sw, sh;
        if (ratio > 1) {
          sh = img.height; sw = img.height;
          sx = (img.width - sw) / 2; sy = 0;
        } else {
          sw = img.width; sh = img.width;
          sx = 0; sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, max, max);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => reject(new Error('decode'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('read'));
    reader.readAsDataURL(file);
  });
}

// ─── Settings ─────────────────────────────────────────────────────────────
function wireSettings() {
  $('btn-settings').addEventListener('click', () => $('settings-overlay').classList.add('open'));
  $('settings-overlay').addEventListener('click', (e) => {
    if (e.target === $('settings-overlay')) $('settings-overlay').classList.remove('open');
  });
  $('btn-settings-close').addEventListener('click', () => $('settings-overlay').classList.remove('open'));
  $('btn-clear-activity').addEventListener('click', () => {
    if (!confirm('Clear the activity feed?')) return;
    BigBacks.activity.clear();
    renderActivity();
  });
  $('btn-clear-profile').addEventListener('click', () => {
    if (!confirm('Reset profile? Your apps will forget who you are.')) return;
    BigBacks.profile.clear();
    renderProfile();
  });

  // Hard-reset all path overrides
  const resetPathsBtn = $('btn-reset-paths');
  if (resetPathsBtn) {
    resetPathsBtn.addEventListener('click', () => {
      localStorage.removeItem('bigbacks_paths_v1');
      // Also blank the inputs
      APPS.forEach(app => { const inp = $('path-' + app.key); if (inp) inp.value = ''; });
      renderApps();
      toast('Paths reset to defaults ♡', 'success');
    });
  }

  // Custom paths
  const stored = JSON.parse(localStorage.getItem('bigbacks_paths_v1') || '{}');
  APPS.forEach(app => {
    const inp = $('path-' + app.key);
    if (inp) inp.value = stored[app.key] || '';
  });
  $('btn-save-paths').addEventListener('click', () => {
    const paths = {};
    APPS.forEach(app => {
      const v = $('path-' + app.key).value.trim();
      if (v) paths[app.key] = v;
    });
    localStorage.setItem('bigbacks_paths_v1', JSON.stringify(paths));
    renderApps();
    toast('Paths saved ♡', 'success');
  });
}

// ─── PWA install prompt ──────────────────────────────────────────────────
let deferredPrompt = null;

function wireInstallPrompt() {
  const btn = $('btn-install');
  if (!btn) return;

  // Chrome / Edge / Android — defer the native prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    btn.hidden = false;
  });

  // iOS Safari has no beforeinstallprompt — show button anyway with instructions
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const inStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (isIOS && !inStandalone) {
    btn.hidden = false;
    btn.onclick = () => {
      toast('Tap the Share icon ⎙ in Safari, then "Add to Home Screen" ♡', 'info');
    };
  }

  btn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      btn.hidden = true;
      toast('Installed ♡ Look on your home screen!', 'success');
      BigBacks.activity.log('hub', 'profile_set', { name: 'app installed' });
    }
    deferredPrompt = null;
  });

  // Hide if already installed
  window.addEventListener('appinstalled', () => { btn.hidden = true; deferredPrompt = null; });
}

// Stricter path validation — only accept clean relative sibling paths
function isValidPath(p) {
  return typeof p === 'string' &&
    /^\.\.\/[a-z][a-z0-9-]*\/?$/i.test(p);
}

function getUserPath(key, defaultPath) {
  try {
    const paths  = JSON.parse(localStorage.getItem('bigbacks_paths_v1') || '{}');
    const stored = paths[key];
    // In production: aggressively reject anything that isn't a clean kebab-case
    // sibling path. Wipes stale local-dev paths, percent-encoded chars, localhost
    // URLs, anything weird.
    if (stored && IS_DEPLOYED && !isValidPath(stored)) {
      delete paths[key];
      localStorage.setItem('bigbacks_paths_v1', JSON.stringify(paths));
      console.warn('[BigBacks Hub] cleared stale path for', key, '→ was:', stored);
      return defaultPath;
    }
    if (stored && !isValidPath(stored)) {
      // In dev, just ignore but don't wipe
      return defaultPath;
    }
    return stored || defaultPath;
  } catch { return defaultPath; }
}

// Run once on boot: scrub localStorage paths in production
(function scrubPathsOnBoot() {
  if (!IS_DEPLOYED) return;
  try {
    const raw = localStorage.getItem('bigbacks_paths_v1');
    if (!raw) return;
    const paths = JSON.parse(raw);
    let changed = false;
    Object.keys(paths).forEach(k => {
      if (!isValidPath(paths[k])) { delete paths[k]; changed = true; }
    });
    if (changed) {
      localStorage.setItem('bigbacks_paths_v1', JSON.stringify(paths));
      console.warn('[BigBacks Hub] scrubbed stale path overrides on boot');
    }
  } catch {}
})();

// ─── Utils ────────────────────────────────────────────────────────────────
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5)    return 'just now';
  if (s < 60)   return s + 's ago';
  if (s < 3600) return Math.floor(s/60) + 'm ago';
  if (s < 86400)return Math.floor(s/3600) + 'h ago';
  return Math.floor(s/86400) + 'd ago';
}
function toast(msg, type='info') {
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.textContent = msg;
  $('toast-container').appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
