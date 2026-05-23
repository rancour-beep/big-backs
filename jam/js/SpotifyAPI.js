// Spotify Web API wrapper — only the endpoints we need for collaborative Jams.
import { getAccessToken, refresh } from './SpotifyAuth.js';

const BASE = 'https://api.spotify.com/v1';

async function call(path, opts = {}) {
  const headers = {
    Authorization: `Bearer ${getAccessToken()}`,
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  };
  let res = await fetch(BASE + path, { ...opts, headers });

  // Auto-refresh on 401
  if (res.status === 401) {
    if (await refresh()) {
      headers.Authorization = `Bearer ${getAccessToken()}`;
      res = await fetch(BASE + path, { ...opts, headers });
    }
  }

  if (res.status === 204) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Spotify ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// ─── User ────────────────────────────────────────────────────────────────────
export function me() {
  return call('/me');
}

// ─── Playlists ───────────────────────────────────────────────────────────────
export async function createJamPlaylist(userId, name, description = '') {
  // Step 1: create the playlist (Spotify requires private+collaborative — public+collab is NOT allowed)
  const playlist = await call(`/users/${userId}/playlists`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      description,
      public: false,
      collaborative: false, // must create private first, then enable collab in step 2
    }),
  });
  // Step 2: flip to collaborative
  await call(`/playlists/${playlist.id}`, {
    method: 'PUT',
    body: JSON.stringify({ collaborative: true, public: false }),
  });
  return playlist;
}

export function getPlaylist(playlistId) {
  return call(`/playlists/${playlistId}`);
}

export function getPlaylistTracks(playlistId, limit = 100) {
  return call(`/playlists/${playlistId}/tracks?limit=${limit}&fields=items(added_at,added_by(id,display_name),track(id,uri,name,duration_ms,artists(name),album(name,images)))`);
}

export function addTrack(playlistId, trackUri) {
  return call(`/playlists/${playlistId}/tracks`, {
    method: 'POST',
    body: JSON.stringify({ uris: [trackUri] }),
  });
}

export function removeTrack(playlistId, trackUri) {
  return call(`/playlists/${playlistId}/tracks`, {
    method: 'DELETE',
    body: JSON.stringify({ tracks: [{ uri: trackUri }] }),
  });
}

// ─── Search ─────────────────────────────────────────────────────────────────
export function searchTracks(query, limit = 10) {
  const q = encodeURIComponent(query);
  return call(`/search?type=track&limit=${limit}&q=${q}`);
}

// ─── Playback ───────────────────────────────────────────────────────────────
export async function currentlyPlaying() {
  try {
    return await call('/me/player/currently-playing');
  } catch {
    return null;
  }
}

// ─── My playlists (for "recent jams") ────────────────────────────────────────
export function myPlaylists(limit = 50) {
  return call(`/me/playlists?limit=${limit}`);
}
