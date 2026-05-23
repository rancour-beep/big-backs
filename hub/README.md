# 🏠 Big Backth Hub

**v0.1 · by Shad ♡**

The home of the Big Backs network. Single profile, single source of truth, links to every app.

## ✿ What it does

- **One profile, every app.** Set your name, upload your avatar, pick your accent colour — it persists across Beach Day, Races, Jam (same browser, same origin via localStorage).
- **App cards** for the whole crew with stats (e.g. "best lap: 1:23.4", "12 in the carpool", "3 jamth hosted").
- **Live activity feed** of everything the crew does across the three apps.
- **Hub-wide settings** to override deployment URLs (when your apps live on different paths).
- **First-run welcome flow** that prompts new visitors to set up a profile.

## 📁 Files

```
Big Backs Hub/
├── index.html
├── style.css
├── shared-profile.js   ← the shared API module
├── README.md
└── js/
    └── main.js
```

`shared-profile.js` is the magic glue. **Copy it into each of your other Big Backs apps** to wire them into the network.

## 🚀 Run / Deploy

```bash
python -m http.server 5500   # then open http://localhost:5500/
```

For GitHub Pages: drop into a repo, enable Pages, done. Use the **Settings** modal in the hub to point at where your other apps live (`../big-backs-races/`, `../big-backs-jam/`, etc).

## 🔌 Connecting the rest of the network

The Hub already works as a standalone profile + launcher. To make activity flow IN from the other apps:

### 1. Copy `shared-profile.js` into each app
Drop the file into the root of `big backs beach day/`, `Big Backs Races/`, and `Big Backs Jam/`.

### 2. Include it in each app's `index.html`
Add this line in `<head>`, BEFORE the app's own JavaScript:
```html
<script src="shared-profile.js"></script>
```

### 3. Add `BigBacks.activity.log(...)` calls inside each app
Drop these one-liners next to existing actions. For example, in **Beach Day** (`app.js`):
```js
// When a picture uploads:
BigBacks.activity.log('beachDay', 'upload', { name: person.name });

// When a new person is added:
BigBacks.activity.log('beachDay', 'add_person', { name });

// When the carpool is reset:
BigBacks.activity.log('beachDay', 'reset');

// When the chat sends a message:
BigBacks.activity.log('beachDay', 'message', {});
```

In **Races** (`main.js`):
```js
// When the race starts:
BigBacks.activity.log('races', 'race_start', { character: char.name });

// When a lap completes:
BigBacks.activity.log('races', 'race_finish', { lap, time: lapTime });

// When the garage saves:
BigBacks.activity.log('races', 'garage_save', { carType });
```

In **Jam** (`main.js`):
```js
// When you create a jam:
BigBacks.activity.log('jam', 'create_jam', { name: playlist.name });

// When you add a track:
BigBacks.activity.log('jam', 'add_track', { track: t.name });
```

### 4. Optional: push stats so the hub cards reflect them
```js
BigBacks.stats.update('beachDay', { peopleCount: 12, totalCost: 179 });
BigBacks.stats.update('races', { bestLap: 78.456, wins: 3 });
BigBacks.stats.update('jam', { jamsHosted: 2, tracksAdded: 47 });
```

That's it. The hub's feed auto-refreshes via the `storage` event whenever any tab in the network writes new data.

## 🛟 Privacy

- 100% client-side. Profile, activity, stats all live in `localStorage` only.
- The hub never talks to a server.
- Same-origin (e.g. `username.github.io/*`) → all sub-apps see the same storage. Cross-origin → each origin has its own profile.

## 📜 License

© 2026 Shad. All rights reserved. Free for the big backth ♡
