// Spotify OAuth 2.0 with PKCE — fully client-side, no backend needed.
import { CLIENT_ID, SCOPES, LS, getRedirectUri } from './config.js';

const AUTH_BASE  = 'https://accounts.spotify.com/authorize';
const TOKEN_URL  = 'https://accounts.spotify.com/api/token';

// ─── PKCE helpers ────────────────────────────────────────────────────────────
function randomString(len = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.~';
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => chars[b % chars.length]).join('');
}

async function sha256(str) {
  const data = new TextEncoder().encode(str);
  return new Uint8Array(await crypto.subtle.digest('SHA-256', data));
}

function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function codeChallengeFor(verifier) {
  return base64url(await sha256(verifier));
}

// ─── Public API ──────────────────────────────────────────────────────────────
export function isConfigured() {
  return CLIENT_ID && CLIENT_ID !== 'PASTE_YOUR_SPOTIFY_CLIENT_ID_HERE';
}

export function isLoggedIn() {
  const tok = localStorage.getItem(LS.TOKEN);
  const exp = +(localStorage.getItem(LS.EXPIRES) || 0);
  return tok && Date.now() < exp - 30_000;
}

export function getAccessToken() {
  return localStorage.getItem(LS.TOKEN) || '';
}

export async function login() {
  if (!isConfigured()) throw new Error('Set CLIENT_ID in js/config.js first.');
  const verifier  = randomString(64);
  const challenge = await codeChallengeFor(verifier);
  localStorage.setItem(LS.CODE_VERIFIER, verifier);

  const params = new URLSearchParams({
    client_id:             CLIENT_ID,
    response_type:         'code',
    redirect_uri:          getRedirectUri(),
    code_challenge_method: 'S256',
    code_challenge:        challenge,
    scope:                 SCOPES,
  });
  window.location.assign(`${AUTH_BASE}?${params}`);
}

export async function handleCallback() {
  const sp = new URLSearchParams(window.location.search);
  const code = sp.get('code');
  const err  = sp.get('error');
  if (err)  throw new Error('Spotify auth failed: ' + err);
  if (!code) return false;

  const verifier = localStorage.getItem(LS.CODE_VERIFIER);
  if (!verifier) throw new Error('Missing PKCE verifier — try logging in again.');

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     CLIENT_ID,
      grant_type:    'authorization_code',
      code,
      redirect_uri:  getRedirectUri(),
      code_verifier: verifier,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed (${res.status})`);

  const { access_token, refresh_token, expires_in } = await res.json();
  localStorage.setItem(LS.TOKEN, access_token);
  if (refresh_token) localStorage.setItem(LS.REFRESH, refresh_token);
  localStorage.setItem(LS.EXPIRES, Date.now() + expires_in * 1000);
  localStorage.removeItem(LS.CODE_VERIFIER);

  // Strip ?code= from URL so a refresh doesn't try to re-exchange
  const clean = new URL(window.location.href);
  clean.search = ''; clean.hash = '';
  window.history.replaceState({}, '', clean.toString());
  return true;
}

export async function refresh() {
  const refreshToken = localStorage.getItem(LS.REFRESH);
  if (!refreshToken) return false;
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
      client_id:     CLIENT_ID,
    }),
  });
  if (!res.ok) return false;
  const { access_token, refresh_token, expires_in } = await res.json();
  localStorage.setItem(LS.TOKEN, access_token);
  if (refresh_token) localStorage.setItem(LS.REFRESH, refresh_token);
  localStorage.setItem(LS.EXPIRES, Date.now() + expires_in * 1000);
  return true;
}

export function logout() {
  [LS.TOKEN, LS.REFRESH, LS.EXPIRES, LS.USER].forEach(k => localStorage.removeItem(k));
}
