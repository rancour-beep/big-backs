import { APP_NAME, APP_VERSION, APP_CREATOR, LS } from './config.js';
import * as Auth from './SpotifyAuth.js';
import * as SP   from './SpotifyAPI.js';
import { renderQR } from './QRCode.js';

// ─── State ────────────────────────────────────────────────────────────────────
let me = null;
let currentJam = null;   // { id, name, uri, url, owner }
let tracksPollTimer = null;
let nowPlayingTimer = null;
let pendingAdd = new Set();   // track URIs queued (optimistic UI)

// ─── DOM helpers ──────────────────────────────────────────────────────────────
const $  = id => document.getElementById(id);
const show = id => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
};
const toast = (msg, type = 'info') => {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  $('toast-container').appendChild(t);
  setTimeout(() => t.remove(), 3500);
};

// ─── Init ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', boot);

async function boot() {
  $('app-version').textContent = `v${APP_VERSION} · by ${APP_CREATOR}`;

  if (!Auth.isConfigured()) {
    $('setup-warning').hidden = false;
    show('welcome');
    return;
  }

  // Handle OAuth redirect
  try {
    if (new URLSearchParams(location.search).get('code')) {
      show('connecting');
      await Auth.handleCallback();
    }
  } catch (e) {
    toast(e.message, 'error');
  }

  if (Auth.isLoggedIn()) {
    await loadUserAndShowHub();
  } else {
    show('welcome');
  }

  wireGlobalListeners();
}

function wireGlobalListeners() {
  $('btn-login').addEventListener('click', () => {
    Auth.login().catch(e => toast(e.message, 'error'));
  });
  $('btn-logout').addEventListener('click', () => {
    Auth.logout();
    location.reload();
  });
  $('btn-create-jam').addEventListener('click', createJam);
  $('btn-load-jam').addEventListener('click', loadJamFromInput);
  $('btn-leave-jam').addEventListener('click', leaveJam);
  $('btn-share-jam').addEventListener('click', shareJam);
  $('btn-spotify-open').addEventListener('click', () => {
    if (currentJam) window.open(currentJam.url, '_blank');
  });

  // Search box (debounced)
  let searchTO = null;
  $('search-input').addEventListener('input', e => {
    clearTimeout(searchTO);
    const q = e.target.value.trim();
    if (!q) { $('search-results').innerHTML = ''; return; }
    searchTO = setTimeout(() => doSearch(q), 280);
  });
}

// ─── User / hub ──────────────────────────────────────────────────────────────
async function loadUserAndShowHub() {
  try {
    me = await SP.me();
    localStorage.setItem(LS.USER, JSON.stringify({ id: me.id, name: me.display_name }));

    $('hub-user-name').textContent  = me.display_name || me.id;
    $('hub-user-id').textContent    = '@' + me.id;
    if (me.images?.[0]?.url) {
      $('hub-user-avatar').style.backgroundImage = `url("${me.images[0].url}")`;
      $('hub-user-avatar').classList.add('has-img');
    } else {
      $('hub-user-avatar').textContent = (me.display_name || me.id)[0].toUpperCase();
    }
    // Sync to BigBacks Hub if profile not yet set
    if (window.BigBacks && !window.BigBacks.profile.exists()) {
      window.BigBacks.profile.update({
        name:   me.display_name || me.id,
        avatar: me.images?.[0]?.url || '',
        color:  '#1DB954',
      });
    }
  } catch (e) {
    toast('Login expired — please reconnect', 'error');
    Auth.logout();
    show('welcome');
    return;
  }

  // Try to restore current jam from localStorage
  const saved = localStorage.getItem(LS.CURRENT_JAM);
  if (saved) {
    try { currentJam = JSON.parse(saved); } catch { currentJam = null; }
  }

  // Also support ?jam=PLAYLIST_ID in URL (someone shared a link)
  const sharedJam = new URLSearchParams(location.search).get('jam');
  if (sharedJam) {
    try {
      await joinJam(sharedJam);
      const u = new URL(location.href);
      u.search = ''; u.hash = '';
      window.history.replaceState({}, '', u.toString());
      return;
    } catch (e) {
      toast('Couldn\'t load shared jam: ' + e.message, 'error');
    }
  }

  if (currentJam) {
    enterJamScreen();
  } else {
    show('hub');
  }
}

// ─── Jam lifecycle ───────────────────────────────────────────────────────────
async function createJam() {
  const nameRaw = $('jam-name-input').value.trim();
  if (!nameRaw) { toast('Give the jam a name first ♡', 'error'); return; }
  $('btn-create-jam').disabled = true;
  $('btn-create-jam').textContent = 'Creating...';
  try {
    const playlist = await SP.createJamPlaylist(
      me.id,
      `🎵 ${nameRaw} (Big Backth Jam)`,
      `A collab Jam by the big backth — anyone can add tunes ♡`
    );
    currentJam = {
      id:     playlist.id,
      name:   playlist.name,
      uri:    playlist.uri,
      url:    playlist.external_urls?.spotify || `https://open.spotify.com/playlist/${playlist.id}`,
      owner:  me.id,
    };
    localStorage.setItem(LS.CURRENT_JAM, JSON.stringify(currentJam));
    addToRecent(currentJam);
    enterJamScreen();
    toast('Jam created ♡', 'success');
    window.BigBacks?.activity.log('jam', 'create_jam', { name: nameRaw });
    window.BigBacks?.stats.increment('jam', 'jamsHosted', 1);
  } catch (e) {
    toast('Failed: ' + e.message, 'error');
  } finally {
    $('btn-create-jam').disabled = false;
    $('btn-create-jam').textContent = '🎵 Create the Jam';
  }
}

async function loadJamFromInput() {
  const raw = $('jam-load-input').value.trim();
  if (!raw) return;
  // Accept: playlist URL, Spotify URI, bare ID, or share URL with ?jam=
  let id = raw;
  try {
    const u = new URL(raw);
    const sharedJam = u.searchParams.get('jam');
    if (sharedJam) id = sharedJam;
    else {
      const m = u.pathname.match(/playlist\/([A-Za-z0-9]+)/);
      if (m) id = m[1];
    }
  } catch {
    const m = raw.match(/playlist[:\/]([A-Za-z0-9]+)/);
    if (m) id = m[1];
  }
  try {
    await joinJam(id);
  } catch (e) {
    toast('Couldn\'t join: ' + e.message, 'error');
  }
}

async function joinJam(playlistId) {
  const p = await SP.getPlaylist(playlistId);
  currentJam = {
    id:     p.id,
    name:   p.name,
    uri:    p.uri,
    url:    p.external_urls?.spotify || `https://open.spotify.com/playlist/${p.id}`,
    owner:  p.owner?.id,
  };
  localStorage.setItem(LS.CURRENT_JAM, JSON.stringify(currentJam));
  addToRecent(currentJam);
  enterJamScreen();
  window.BigBacks?.activity.log('jam', 'join_jam', { name: p.name });
}

function leaveJam() {
  currentJam = null;
  localStorage.removeItem(LS.CURRENT_JAM);
  stopPolls();
  show('hub');
  renderRecentJams();
}

function enterJamScreen() {
  show('jam');
  $('jam-title').textContent = currentJam.name;
  $('jam-owner').textContent = currentJam.owner === me?.id ? 'You started this jam' : `Started by @${currentJam.owner}`;

  // Build share URL pointing back at THIS app + the jam ID
  const shareUrl = `${location.origin}${location.pathname}?jam=${currentJam.id}`;
  $('jam-share-url').value = shareUrl;

  // QR
  renderQR($('qr-canvas'), shareUrl, {
    moduleSize: 7,
    margin:     2,
    bg:         '#0a0a0f',
    fg:         '#1DB954',
  });

  startPolls();
}

function shareJam() {
  const shareUrl = $('jam-share-url').value;
  if (navigator.share) {
    navigator.share({ title: currentJam.name, text: 'Join the jam ♡', url: shareUrl })
      .catch(() => navigator.clipboard.writeText(shareUrl).then(() => toast('Link copied ♡', 'success')));
  } else {
    navigator.clipboard.writeText(shareUrl).then(() => toast('Link copied ♡', 'success'));
  }
}

// ─── Track list polling ──────────────────────────────────────────────────────
function startPolls() {
  stopPolls();
  refreshTracks();
  refreshNowPlaying();
  tracksPollTimer  = setInterval(refreshTracks,     5000);
  nowPlayingTimer  = setInterval(refreshNowPlaying, 10000);
}
function stopPolls() {
  if (tracksPollTimer) clearInterval(tracksPollTimer);
  if (nowPlayingTimer) clearInterval(nowPlayingTimer);
  tracksPollTimer = nowPlayingTimer = null;
}

async function refreshTracks() {
  if (!currentJam) return;
  try {
    const data = await SP.getPlaylistTracks(currentJam.id);
    renderTracks(data.items || []);
  } catch (e) {
    // Silent: keep showing last known tracks
  }
}

async function refreshNowPlaying() {
  try {
    const cur = await SP.currentlyPlaying();
    const el = $('now-playing');
    if (cur && cur.item) {
      const t = cur.item;
      const img = t.album?.images?.[2]?.url || t.album?.images?.[0]?.url || '';
      el.innerHTML = `
        ${img ? `<div class="np-art" style="background-image:url('${img}')"></div>` : ''}
        <div class="np-info">
          <div class="np-label">▶ NOW PLAYING</div>
          <div class="np-track">${esc(t.name)}</div>
          <div class="np-artist">${esc(t.artists.map(a=>a.name).join(', '))}</div>
        </div>`;
      el.classList.add('visible');
    } else {
      el.classList.remove('visible');
    }
  } catch {}
}

function renderTracks(items) {
  const list = $('jam-tracks');
  if (items.length === 0) {
    list.innerHTML = `<div class="empty-state">No tracks yet — be the firtht to add one ♡</div>`;
    return;
  }
  list.innerHTML = items.map(it => {
    if (!it.track) return '';
    const t = it.track;
    const img = t.album?.images?.[2]?.url || t.album?.images?.[0]?.url || '';
    const addedBy = it.added_by?.display_name || it.added_by?.id || 'someone';
    const dur = msToMin(t.duration_ms);
    const canRemove = currentJam.owner === me?.id || it.added_by?.id === me?.id;
    return `
      <div class="track-row" data-uri="${t.uri}">
        ${img ? `<div class="tr-art" style="background-image:url('${img}')"></div>` : '<div class="tr-art tr-art-fallback">♪</div>'}
        <div class="tr-info">
          <div class="tr-name">${esc(t.name)}</div>
          <div class="tr-artist">${esc(t.artists.map(a=>a.name).join(', '))}</div>
        </div>
        <div class="tr-meta">
          <div class="tr-dur">${dur}</div>
          <div class="tr-by">+ @${esc(addedBy)}</div>
        </div>
        ${canRemove ? `<button class="tr-remove" data-uri="${t.uri}" title="Remove">✕</button>` : ''}
      </div>
    `;
  }).filter(Boolean).join('');

  list.querySelectorAll('.tr-remove').forEach(btn => {
    btn.addEventListener('click', async () => {
      const uri = btn.dataset.uri;
      btn.disabled = true;
      try {
        await SP.removeTrack(currentJam.id, uri);
        await refreshTracks();
      } catch (e) {
        toast('Couldn\'t remove: ' + e.message, 'error');
        btn.disabled = false;
      }
    });
  });
}

// ─── Search ──────────────────────────────────────────────────────────────────
async function doSearch(q) {
  try {
    const data = await SP.searchTracks(q, 8);
    const items = data.tracks?.items || [];
    if (items.length === 0) {
      $('search-results').innerHTML = `<div class="empty-state-sm">No reathultth.</div>`;
      return;
    }
    $('search-results').innerHTML = items.map(t => {
      const img = t.album?.images?.[2]?.url || t.album?.images?.[0]?.url || '';
      const queued = pendingAdd.has(t.uri);
      return `
        <div class="sr-row">
          ${img ? `<div class="sr-art" style="background-image:url('${img}')"></div>` : '<div class="sr-art sr-art-fallback">♪</div>'}
          <div class="sr-info">
            <div class="sr-name">${esc(t.name)}</div>
            <div class="sr-artist">${esc(t.artists.map(a=>a.name).join(', '))}</div>
          </div>
          <button class="sr-add" data-uri="${t.uri}" ${queued?'disabled':''}>${queued?'✓':'+ ADD'}</button>
        </div>
      `;
    }).join('');
    $('search-results').querySelectorAll('.sr-add').forEach(btn => {
      btn.addEventListener('click', () => addTrack(btn.dataset.uri, btn));
    });
  } catch (e) {
    toast('Search failed: ' + e.message, 'error');
  }
}

async function addTrack(uri, btn) {
  pendingAdd.add(uri);
  btn.disabled = true;
  btn.textContent = '...';
  try {
    await SP.addTrack(currentJam.id, uri);
    btn.textContent = '✓';
    toast('Added ♡', 'success');
    setTimeout(() => refreshTracks(), 400);
    // Find the track name from the search results for activity feed
    const trackRow = btn.closest('.sr-row');
    const trackName = trackRow?.querySelector('.sr-name')?.textContent || 'a track';
    window.BigBacks?.activity.log('jam', 'add_track', { track: trackName });
    window.BigBacks?.stats.increment('jam', 'tracksAdded', 1);
  } catch (e) {
    pendingAdd.delete(uri);
    btn.disabled = false; btn.textContent = '+ ADD';
    toast('Couldn\'t add: ' + e.message, 'error');
  }
}

// ─── Recent jams ─────────────────────────────────────────────────────────────
function addToRecent(jam) {
  let recent = [];
  try { recent = JSON.parse(localStorage.getItem(LS.RECENT_JAMS) || '[]'); } catch {}
  recent = recent.filter(j => j.id !== jam.id);
  recent.unshift({ id: jam.id, name: jam.name, owner: jam.owner, addedAt: Date.now() });
  recent = recent.slice(0, 8);
  localStorage.setItem(LS.RECENT_JAMS, JSON.stringify(recent));
  renderRecentJams();
}

function renderRecentJams() {
  let recent = [];
  try { recent = JSON.parse(localStorage.getItem(LS.RECENT_JAMS) || '[]'); } catch {}
  const wrap = $('recent-jams');
  if (recent.length === 0) {
    wrap.innerHTML = '';
    return;
  }
  wrap.innerHTML = `
    <div class="recent-title">RECENT JAMTH</div>
    <div class="recent-list">
      ${recent.map(j => `
        <button class="recent-item" data-id="${j.id}">
          <div class="ri-name">${esc(j.name)}</div>
          <div class="ri-owner">by @${esc(j.owner || 'unknown')}</div>
        </button>
      `).join('')}
    </div>
  `;
  wrap.querySelectorAll('.recent-item').forEach(b => {
    b.addEventListener('click', () => joinJam(b.dataset.id).catch(e => toast(e.message, 'error')));
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
function msToMin(ms) {
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60), rem = s % 60;
  return `${m}:${String(rem).padStart(2,'0')}`;
}

// Render recent on hub when boot completes
const origLoadUserAndShowHub = loadUserAndShowHub;
// (renderRecentJams is called from enterJamScreen + leaveJam; also at hub init below)
new MutationObserver(() => {
  if ($('hub').classList.contains('active')) renderRecentJams();
}).observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
