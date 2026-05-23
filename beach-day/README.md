# 🏖 Big Backth Beach Day

**Version 0.2** · Created and owned by **Shad** ♡

A cute little carpool manager for our beach day. Drag people between cars, track everyone's travel cost, and convert the total into 44 currencies. Made with ♡ for the big backth.

## ✿ Features

- **Drag-and-drop carpool seats** — move anyone between cars and the unassigned pool. Drop on an occupied seat to swap.
- **Touch drag** works on phones (ghost element follows your finger).
- **Picture upload popup** — click anyone's avatar circle to upload a photo. Anyone with the app can upload anyone's picture. Pictures are resized to 256×256 JPEG and saved locally.
- **Travel & Coth panel** — per-person row with where they're coming from, transport (🚗/🚆/🚌/🚶/🚲), cost in £, and arrival time.
- **44-currency converter** — totals shown in GBP, USD, EUR, NPR, PHP, BDT, HKD, MYR, INR up front; click "All currentheeth" for the full list (JPY, CNY, KRW, SGD, THB, IDR, VND, TWD, AUD, NZD, CAD, CHF, NOK, SEK, DKK, PLN, CZK, HUF, RON, TRY, AED, SAR, QAR, ILS, EGP, ZAR, NGN, KES, MXN, BRL, ARS, COP, CLP, PEN, PKR, LKR).
- **Timeline strip** — auto-shows who arrives first and last.
- **Per-person colour palette** — 10 muted pastels, right-click any chip to pick.
- **Double-click to rename** — names, car names, and the beach destination itself.
- **Settings drawer** — copy lineup, copy travel plan, reset to defaults.
- **Cozy ambient music + click sounds** — procedurally synthesised in the browser via Web Audio API. Sparse C-minor pentatonic notes with soft pad chords (Minecraft-vibe) and a full set of UI sounds (click, pickup, drop, swap, success, error, upload, reset). 100 % original, no audio files, no copyright concerns. Mute toggle in the header (🔊/🔇), volume slider in the settings drawer.
- **Group chat with pictures** — floating 💬 button in the corner opens a slide-in panel. Sign in temporarily with a name + photo, send messages, see who said what. See the [Chat section](#-chat) below for current limitations and how to enable real multi-device chat.
- **Lispified UI** — for the perthon with the lithp ♡

## 🌸 Initial lineup

- **MJ's Car** — MJ (driving from Stoke), Friend, Erika
- **Ringan's Car** — Ringan (driving from Coventry), Rhianon, Liane, Evi
- **Pool** — Shad, Ed, Birat, Ishant, Leila (maybe)

Defaults aim for ~£179 total. All editable.

## 🚀 Running locally

Pure HTML/CSS/JS — no build step, no dependencies. Open `index.html` in a browser, or:

```bash
python -m http.server 5500
# then visit http://localhost:5500
```

A local server isn't strictly required (no fetches), but is handy for testing on a phone over LAN.

## 🌐 Hosting on GitHub Pages

Push to GitHub, then in the repo:

1. **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / folder: `/ (root)`
4. Save

The site goes live at `https://<your-username>.github.io/<repo-name>/`. Updates publish automatically on push to `main`.

## 📁 File structure

```
.
├── index.html      # markup — header, sections, modal, drawer
├── style.css       # cute pastel theme, layout, animations
├── app.js          # state, drag/drop, currency, picture upload
├── .gitignore
└── README.md
```

Everything's vanilla — no framework, no bundler. All state lives in `localStorage` under the key `bigbacks_carpool_v2`.

## 🎀 Aesthetic

Soft cream-pink background `#FBF0F0`, dusty-rose accents `#C8A4B5`, lavender highlights `#C8B4D4`. Person chips use a muted 10-colour palette (rose, sage, lavender, powder blue, mint, peach, soft pink, periwinkle, coral, buttercream). Headings: Syne. Body: Manrope.

## 💬 Chat — real cross-device, zero setup

The chat has **two modes**, and you switch between them inside the chat panel itself. No Firebase, no accounts, no API keys.

### 🏠 Local mode (default on first visit)
- Messages live in `localStorage` on this device.
- Two tabs on the same browser sync live via `BroadcastChannel`.
- Sign-in is temporary (`sessionStorage`) — closing the tab signs you out, message history stays.
- Good for: solo testing, screen-sharing, demos.

### 🌐 Connected mode (real cross-device chat, ~30 seconds of setup)

**One-time setup (you, the owner):**
1. Open [jsonbin.io](https://jsonbin.io/login) → sign up with Google or email
2. Dashboard → **API Keys** → copy your **X-Master-Key**
3. In the app: click 💬 → click 🌐 → paste the key → **Thave key**
4. Click **🌐 Start a chat room** — an invite link is generated and copied to your clipboard
5. Share the link with everyone

**For friends joining:**
- Open the invite link → they're auto-joined and the key is auto-imported (both come in the URL)
- Click 💬, sign in with name + pic, start chatting

**How it works under the hood:**
- Backend: [JSONbin.io](https://jsonbin.io) free tier (100,000 requests/month — way more than a friend group will use)
- Each room is one JSON bin holding the message array
- The browser polls the bin every 4 seconds for new messages and writes on send
- Messages cached in `localStorage` too — works offline, syncs when you're back online
- The API key + room ID both live in the URL (`?room=...&key=...`) so the invite link is self-contained

**⚠ Limitations (honest):**
- **Polling**: ~4 second latency, not instant push.
- **Shared key**: everyone with the invite link has your API key and can read/write the room. Fine for friends — don't share with strangers.
- **Quota**: 100K req/month free. With 4-second polling, 10 people active for 8 hours/day = ~72K/month. Plenty.
- **Size**: ~500 most recent messages kept, oldest trimmed automatically.

**Why JSONbin and not [JSONblob](https://jsonblob.com)?** JSONblob's API is up but has broken CORS — browsers reject the response. JSONbin returns proper CORS headers and is rock-solid.

**Want true real-time push instead of polling?** Swap JSONbin for Firebase Realtime Database — replace `createRoom`, `joinRoomById`, `startPolling`, `pushRemote` in `app.js` with `firebase.database().ref(...)` calls. Same UI, instant messages.

## 🛟 Privacy

- No backend. No tracking. No accounts.
- All data — names, cars, pictures, costs — stays in your browser's `localStorage`.
- Currency conversion uses hard-coded approximate rates (not live). Update them in `app.js` → `RATES` when needed.

## 👤 Creator

**Shad** is the creator and owner of this project.

- 🏖 Project: Big Backth Beach Day
- 🏷 Version: 0.2
- © 2026 Shad — all rightth rethurved ♡

## 📜 License

© 2026 Shad. All rights reserved.

Free for the big backth to use, remix, and share among themselves ♡ No warranty.
