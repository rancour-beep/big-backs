# 🚀 Big Backth Network — Deployment Guide

You've built **4 apps**. Time to put them on the internet so the big backth can actually use them.

```
🏠 Hub          (landing + shared profile)
🏖 Beach Day    (carpool + cost + chat)
🏁 Races        (3D arcade racer)
🎵 Jam          (Spotify collab playlist + QR)
```

This guide covers everything in ~15 minutes.

---

## ⚡ TL;DR (for the impatient)

```bash
# 1. Run the prep script — creates a deployment-ready folder with kebab-case names
./prepare-deployment.sh         # macOS/Linux
# OR
.\prepare-deployment.ps1        # Windows PowerShell

# 2. Push the new folder to a GitHub repo
cd big-backs-network
git init && git add . && git commit -m "Big Backth Network v1"
git remote add origin https://github.com/YOUR-USERNAME/big-backs.git
git push -u origin main

# 3. On GitHub: Settings → Pages → main branch / root → Save
# Live in ~30 seconds at:
#   https://YOUR-USERNAME.github.io/big-backs/
```

That's it. Read on for the why, the special configs, and how to verify.

---

## 🎯 Why deploy at all?

Right now your apps live on your laptop. Cool. But:

| Feature | Works locally? | Works deployed? |
|---|---|---|
| Single-player carpool, races, hub | ✅ | ✅ |
| AI bot races | ✅ | ✅ |
| **Multi-device chat in Beach Day** | ❌ | ✅ |
| **Multiplayer races (Firebase)** | ❌ (CORS) | ✅ |
| **Spotify Jam (OAuth)** | ⚠ localhost only | ✅ |
| **PWA install on phones** | ❌ | ✅ |
| **QR code joining** | ❌ (localhost not accessible) | ✅ |
| **Shared profile across apps** | ⚠ same browser only | ✅ shared origin |

Until it's deployed, the network is half-built ♡

---

## 🏗 Two deployment approaches

### Option A — Monorepo (RECOMMENDED)
**One GitHub repo, all 4 apps in subdirectories.**

```
big-backs/                    ← one repo
├── index.html                ← redirects to /hub/
├── hub/
├── beach-day/
├── races/
└── jam/
```

Why it's better:
- One `git push` deploys everything
- All apps on **same origin** → shared profile + activity feed work automatically
- One URL to share: `username.github.io/big-backs/`
- Easier to update — fix a bug everywhere with one commit

### Option B — Multi-repo
Each app gets its own repo. Use this only if you want them to have **different URLs** that are still on the same `username.github.io` host. Profile sharing still works (same origin) but you have to maintain 4 repos.

Stick with **Option A**.

---

## 📋 Step-by-step (Monorepo)

### 1. Run the prep script
From `B:\Projects_Ai\` (or wherever this workspace lives):

```bash
# macOS/Linux:
./prepare-deployment.sh

# Windows PowerShell:
.\prepare-deployment.ps1
```

This creates `big-backs-network/` with:
- All 4 apps renamed to URL-safe kebab-case folders
- A root `index.html` that redirects to `/hub/`
- A `.gitignore` pre-configured
- A `deploy-check.html` for verifying everything works

### 2. Create a new GitHub repo
- Go to [github.com/new](https://github.com/new)
- Name: `big-backs` (or whatever — URL will use this name)
- Public (free Pages requires public)
- **Don't** initialize with README — we already have files
- Create

### 3. Push the deployment folder
```bash
cd big-backs-network
git init
git add .
git commit -m "Big Backth Network v1 ♡"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/big-backs.git
git push -u origin main
```

### 4. Enable GitHub Pages
- Repo → **Settings** → **Pages** (left sidebar)
- Source: **Deploy from a branch**
- Branch: `main` / Folder: `/ (root)` / Save
- Wait ~30 seconds → top of Pages page shows: *"Your site is live at https://YOUR-USERNAME.github.io/big-backs/"*

### 5. Visit your live site
- `https://YOUR-USERNAME.github.io/big-backs/` → redirects to Hub
- `https://YOUR-USERNAME.github.io/big-backs/hub/` → Hub directly
- `https://YOUR-USERNAME.github.io/big-backs/beach-day/`
- `https://YOUR-USERNAME.github.io/big-backs/races/`
- `https://YOUR-USERNAME.github.io/big-backs/jam/`

The Hub auto-detects deployment (it sees `.github.io`) and uses the kebab-case paths automatically — no Settings tweak needed.

---

## 🔧 Special configs

### Spotify Jam — register your deployed URL

Spotify OAuth requires your redirect URI to be **exactly** the URL you deploy at.

1. Open [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) → your Big Backs Jam app
2. **Edit settings** → Redirect URIs → **Add**:
   ```
   https://YOUR-USERNAME.github.io/big-backs/jam/
   ```
   (Keep `http://localhost:5500/` for local dev — both can coexist.)
3. **Save**
4. Edit `jam/js/config.js` to paste your Client ID if you haven't already

### Firebase Multiplayer Races — optional

If you want real multiplayer races (vs AI bots only):
1. Follow `races/firebase-config.js` instructions to create a Firebase project
2. Paste config into `firebase-config.js`
3. Uncomment the 3 `<script>` tags in `races/index.html`
4. Push update — multiplayer is live

No Firebase = AI bots only (still fun, but no real friends).

### JSONblob chat rooms — no setup needed
Beach Day's cross-device chat uses JSONblob.com — works the moment it's deployed. Zero config.

---

## ✅ Verify your deployment

Visit `https://YOUR-USERNAME.github.io/big-backs/deploy-check.html` — it tests every app, reports the shared profile status, and shows any wiring errors.

You can also walk through this checklist manually:

- [ ] Hub loads at the root URL
- [ ] Set up your profile (name + avatar)
- [ ] Hub → Beach Day card → opens Beach Day, profile picture appears in the header
- [ ] Upload a picture of MJ in Beach Day
- [ ] Return to Hub → activity feed shows *"You uploaded a picture for MJ — just now"*
- [ ] Beach Day chat: 🌐 → Start a chat room → URL has `?room=XXX` → opens on another device
- [ ] Races: pick a driver → start race → AI bots show up → 3rd place finish triggers fanfare
- [ ] Jam: Connect Spotify → create a jam → QR scans to playlist on phone
- [ ] Hub: ⬇ INSTALL button appears (Chrome) → installs as PWA on phone

If any of these fail, the deploy-check tool will tell you what's wrong.

---

## 🎀 Sharing with the crew

Once deployed, here's what to send the big backth:

> 🏖 **Big Backth Network is live ♡**
> 🌐 https://YOUR-USERNAME.github.io/big-backs/
>
> Add it to your home screen for the full app experience:
> - iPhone: open in Safari → Share → Add to Home Screen
> - Android: open in Chrome → ⋮ menu → Install app
>
> Made by Shad ♡

---

## 🛟 Troubleshooting

**Profile doesn't sync between apps** → check you're on the same origin (same `username.github.io`). If you deployed to separate repos, you're cross-path-same-origin which works. If you deployed to different domains, localStorage isolates them.

**Spotify Jam fails with "redirect URI mismatch"** → the URL in Spotify Dashboard must EXACTLY match what's in the browser address bar including trailing slash. Add both `https://.../jam/` and `https://.../jam` to be safe.

**Hub shows wrong paths to apps** → open Settings (⚙ icon) → paste the correct URLs → Save.

**PWA install button doesn't appear** → only Chrome/Edge/Samsung Internet support `beforeinstallprompt`. iOS Safari needs you to use the Share menu. The button does show on iOS with instructions.

**404 on app routes** → GitHub Pages takes a few minutes after first enabling. Refresh the Pages settings tab to see your URL appear.

---

## 📜 License

© 2026 Shad. All rights reserved. Free for the big backth ♡
