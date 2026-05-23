# 🎵 Big Backth Jam

**v0.1 · by Shad ♡**

A collaborative Spotify playlist maker with QR-code joining — perfect for the beach day. Everyone scans the code, everyone adds songs, everyone listens.

> ⚠ **Heads-up on Spotify Jam**: The "real-time listening session" Spotify Jam feature can only be *started* from inside the Spotify app itself (no public API). This app gets you 95% of the way there using **collaborative playlists** — anyone with the QR/link can add tracks instantly, and the host can press "Start Jam" inside Spotify on the playlist whenever they want synced playback for Premium friends.

## ✿ Features

- **Connect Spotify** (PKCE OAuth — secure, no backend, no client secret needed)
- **Create a collab playlist** in one click — anyone with the link can add tracks
- **Big QR code** rendered client-side — friends scan with their phone camera, lands them in the app pre-joined to your jam
- **In-app search** — find any track on Spotify and add it without leaving the page
- **Live track list** — refreshes every 5 seconds, shows who added what
- **Now Playing** indicator — if the host is playing, everyone sees the current track
- **Recent jams** sidebar — quick-rejoin any jam you've been in
- **Remove tracks** — playlist owner or the person who added a track can remove it
- **Mobile-friendly** — share button uses native share sheet on iOS/Android

## 🚀 Setup (3 minutes)

### 1. Get a free Spotify Developer account
1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) → log in with your Spotify account
2. Click **Create app**
3. Name: `Big Backs Jam` (or anything)
4. Description: anything
5. **Redirect URIs** — add BOTH of these (one for local testing, one for hosting):
   ```
   http://localhost:5500/
   https://YOUR-USERNAME.github.io/big-backs-jam/
   ```
   Replace `YOUR-USERNAME` with your GitHub username. **Exact match matters** — trailing slash and all.
6. **APIs/SDKs**: tick **Web API**
7. Save

### 2. Paste your Client ID
1. From your app's dashboard, copy the **Client ID** (the long hex string)
2. Open `js/config.js`
3. Replace `'PASTE_YOUR_SPOTIFY_CLIENT_ID_HERE'` with your Client ID

### 3. Run it
```bash
python -m http.server 5500
# Open http://localhost:5500/
```

### 4. Push to GitHub
Drop these 7 files into a new GitHub repo, enable Pages (Settings → Pages → main branch root) → live in ~30 seconds.

## 📁 Files

```
Big Backs Jam/
├── index.html
├── style.css
├── README.md
└── js/
    ├── main.js          ← entry point, screen routing
    ├── config.js        ← put your Spotify Client ID here
    ├── SpotifyAuth.js   ← PKCE OAuth flow
    ├── SpotifyAPI.js    ← API wrapper (playlists, search, playback)
    └── QRCode.js        ← dependency-free QR generator (canvas)
```

## 🎀 How a jam goes down

**You (the host):**
1. Open the app → Connect Spotify
2. Type a jam name → Create the Jam
3. Big QR code appears + a share link

**Your friends:**
1. Scan the QR (phone camera does this automatically)
2. The link opens this same app pre-joined to your jam
3. They Connect Spotify → search → add tunes
4. Their adds appear in everyone's list within 5 seconds

**Synced playback (optional):**
- Open the playlist in your actual Spotify app
- Tap the **Start a Jam** button inside Spotify
- Premium friends can join the *real* Jam for synced listening

## 🛟 Privacy

- All auth tokens stored in your browser's `localStorage` only
- No backend, no analytics, no tracking
- Spotify Client ID is public by design (PKCE flow has no client secret)
- The collaborative playlist itself is **private** (only people with the link can find it) but anyone with the link can add tracks

## 📜 License

© 2026 Shad. All rights reserved. Free for the big backth ♡
