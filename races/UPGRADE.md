# Summit Run

This browser racing update replaces the circular track with a 1.17 km circuit containing sweeping bends, linked corners and gentle elevation changes. Cars, opponents, collision boundaries, lap timing and the map share one road definition in `js/Route.js`.

Sound starts muted. M toggles sound; the volume control remembers your choice. The synth engine and tyre/NOS effects are softer and filtered. Beach Day's procedural music is disabled, with sound effects opt-in and quiet by default. There is no background music in Races. No motion blur, bloom or NOS screen flash is applied in the new renderer.

R recovers the player onto the nearest racing line. WASD or arrow keys drive; Shift/Space drifts; X boosts. Input resets when the window loses focus, avoiding stuck throttle or steering.

High graphics uses antialiasing, daylight HDR reflections, soft sun shadows, detailed asphalt with normal mapping, textured terrain and lightweight foliage. Smooth mode uses a lower render resolution and disables shadows. Changing quality reloads the app. Bundled textures total about 5.4 MB; see [asset credits](assets/CREDITS.md). The result remains a lightweight browser arcade game, with generated car and environment geometry; it does not match a native AAA racing engine.

## Check changes

At the repository root, run `npm install`, then `npm test`. The checks cover route closure, surface projection, collision limits, checkpoint order, AI completing three laps, quiet defaults, and saved audio settings. Serve the root with a local HTTP server to inspect rendering and controls.

Spotify/Firebase/JSONbin account configuration remains separate from this racing update. No service accounts, permissions or credentials are created by this change.
