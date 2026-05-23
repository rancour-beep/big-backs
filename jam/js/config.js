// ─────────────────────────────────────────────────────────────────────────────
//  BIG BACKTH JAM — Configuration
// ─────────────────────────────────────────────────────────────────────────────
//
//  SETUP (~3 minutes, free):
//  1. Go to https://developer.spotify.com/dashboard  →  Log in with Spotify
//  2. Click "Create app"  →  Name: "Big Backs Jam"  →  any description
//  3. Redirect URIs: add BOTH of these (one for local testing, one for hosting):
//       http://localhost:5500/
//       https://YOUR-USERNAME.github.io/big-backs-jam/
//     (Replace YOUR-USERNAME with your GitHub username — exact match matters!)
//  4. "Which API/SDKs are you planning to use?"  →  tick Web API
//  5. Save  →  copy the Client ID from your app's settings
//  6. Paste it below, replacing the placeholder
//
// ─────────────────────────────────────────────────────────────────────────────

export const CLIENT_ID = 'PASTE_YOUR_SPOTIFY_CLIENT_ID_HERE';

// REDIRECT_URI is auto-detected from window.location so it works on both
// localhost and GitHub Pages without changing this file. Both URIs MUST be
// registered in your Spotify app settings.
export function getRedirectUri() {
  const u = new URL(window.location.href);
  u.search = '';
  u.hash = '';
  return u.toString();
}

export const SCOPES = [
  'playlist-modify-public',
  'playlist-modify-private',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-read-private',
  'user-read-email',
  'user-read-currently-playing',
  'user-read-playback-state',
].join(' ');

export const APP_NAME = 'Big Backth Jam';
export const APP_VERSION = '0.1';
export const APP_CREATOR = 'Shad';

// localStorage keys
export const LS = {
  TOKEN:        'bbj_token',
  REFRESH:      'bbj_refresh',
  EXPIRES:      'bbj_expires',
  USER:         'bbj_user',
  CURRENT_JAM:  'bbj_current_jam',
  RECENT_JAMS:  'bbj_recent_jams',
  CODE_VERIFIER:'bbj_code_verifier',
};
