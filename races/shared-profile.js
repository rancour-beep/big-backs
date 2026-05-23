// ─────────────────────────────────────────────────────────────────────────────
//  BIG BACKTH SHARED PROFILE  —  v1
//  Drop this script into any Big Backs app to share the same profile + activity
//  feed across them all via localStorage. Same-origin (GitHub Pages user.github.io)
//  means all sub-apps see the same storage automatically.
//
//  Usage anywhere:
//    BigBacks.profile.get()                 → { name, avatar, color, ... }
//    BigBacks.profile.update({ name: 'Shad' })
//    BigBacks.activity.log('races', 'lap', { time: 78.4 })
//    BigBacks.activity.recent()             → newest 50 events
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  const PROFILE_KEY  = 'bigbacks_profile_v1';
  const ACTIVITY_KEY = 'bigbacks_activity_v1';
  const STATS_KEY    = 'bigbacks_stats_v1';
  const MAX_ACTIVITY = 50;

  const safeGet = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  };
  const safeSet = (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch { return false; }
  };

  const profile = {
    KEY: PROFILE_KEY,
    get() { return safeGet(PROFILE_KEY, null); },
    set(p) { return safeSet(PROFILE_KEY, p); },
    update(patch) {
      const cur = profile.get() || {};
      const next = { ...cur, ...patch, updatedAt: Date.now() };
      profile.set(next);
      return next;
    },
    clear() { localStorage.removeItem(PROFILE_KEY); },
    exists() { const p = profile.get(); return !!(p && p.name); },
  };

  const activity = {
    KEY: ACTIVITY_KEY,
    log(app, event, data = {}) {
      const list = safeGet(ACTIVITY_KEY, []);
      const entry = { app, event, data, ts: Date.now() };
      list.unshift(entry);
      safeSet(ACTIVITY_KEY, list.slice(0, MAX_ACTIVITY));
      return entry;
    },
    recent(n = MAX_ACTIVITY) {
      return safeGet(ACTIVITY_KEY, []).slice(0, n);
    },
    clear() { localStorage.removeItem(ACTIVITY_KEY); },
  };

  const stats = {
    KEY: STATS_KEY,
    get(app) {
      const all = safeGet(STATS_KEY, {});
      return all[app] || {};
    },
    update(app, patch) {
      const all = safeGet(STATS_KEY, {});
      all[app] = { ...(all[app] || {}), ...patch, updatedAt: Date.now() };
      safeSet(STATS_KEY, all);
      return all[app];
    },
    increment(app, field, by = 1) {
      const cur = stats.get(app);
      cur[field] = (cur[field] || 0) + by;
      stats.update(app, cur);
      return cur[field];
    },
    all() { return safeGet(STATS_KEY, {}); },
  };

  // Cross-tab sync — apps can listen and refresh when profile/activity changes
  function onChange(cb) {
    window.addEventListener('storage', (e) => {
      if ([PROFILE_KEY, ACTIVITY_KEY, STATS_KEY].includes(e.key)) cb(e.key);
    });
  }

  window.BigBacks = { profile, activity, stats, onChange };
})();
