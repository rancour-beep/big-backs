// ─────────────────────────────────────────────────────────────────────────────
//  FIREBASE CONFIG  —  fill this in to enable real multiplayer
//  Get it from: console.firebase.google.com → Your project
//               → Project Settings → Your apps → Web → Config snippet
// ─────────────────────────────────────────────────────────────────────────────
//
//  SETUP STEPS (5 minutes, free):
//  1. Go to https://console.firebase.google.com  →  Add project  →  any name
//  2. Build  →  Realtime Database  →  Create Database  →  Start in TEST MODE
//  3. Project Settings (⚙)  →  Your apps  →  Add app (</>)  →  copy config below
//  4. Uncomment the Firebase SDK lines in index.html
//  5. Paste your values and save — multiplayer is live!
//
// ─────────────────────────────────────────────────────────────────────────────

window.FIRE = {
  apiKey:            'PASTE_YOUR_API_KEY',
  authDomain:        'PASTE.firebaseapp.com',
  databaseURL:       'https://PASTE-default-rtdb.firebaseio.com',
  projectId:         'PASTE',
  storageBucket:     'PASTE.appspot.com',
  messagingSenderId: 'PASTE',
  appId:             'PASTE',
};

// Auto-initialise if Firebase SDK is loaded
try {
  if (typeof firebase !== 'undefined' && window.FIRE.apiKey !== 'PASTE_YOUR_API_KEY') {
    firebase.initializeApp(window.FIRE);
  }
} catch (e) {
  console.warn('[BigBacksRaces] Firebase init failed:', e.message);
}
