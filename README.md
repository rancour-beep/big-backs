# Big Backs · Trip together

A friends-first trip planner, with a shared layout and navigation across:

- **The trip** — editable destination/date/meeting spot, attendance, itinerary, packing, notes, group spending and backup tools.
- **Getting there** — the existing carpool, seats, travel plans and approximate currency conversions.
- **Playlist** — a song wishlist and saved Spotify playlist link work without developer setup; the Spotify API connection remains optional.
- **Play together** — Summit Run, a 1.17 km mountain circuit using the trip's friends as drivers, with quiet defaults and free CC0 visual assets.

Existing carpool, profile, photos, garage choices and activity storage keys are retained. New planning data uses `bigbacks_trip_v1`. Navigation stays inside the project's deployment base, including a GitHub Pages subdirectory.

## Sharing and data

Data is stored in the current browser. Plan links carry a snapshot of trip details, notes, crew/transport, itinerary, a fresh packing checklist and the song wishlist. They exclude photos, attendance decisions, expense records and authentication tokens. The recipient previews the plan and chooses whether to replace their current plan with a separate copy. Edits are **not** live-synced across devices.

Downloadable backups restore the trip and transport plan, including local attendance, expenses and carpool photos. A file import validates the schema and replaces the local plan only after confirmation. It never restores Spotify tokens or chat API keys. Keep personal backups private.

Spotify Web API and Firebase multiplayer still require their respective service configurations. JSONbin online chat also requires service setup. Planning, song suggestions, carpool editing and solo/AI racing work without those services. No service account or database security settings are changed here.

## Local preview and checks

Serve the repository root, for example `python -m http.server 5500`, and open `http://127.0.0.1:5500/hub/`.

Run `npm install`, then `npm test`. The checks cover racing geometry/checkpoints/collisions/AI completion, audio preferences, trip/transport integration, budget arithmetic, packing, share links, backup restoration, input validation and storage errors. Desktop and mobile layouts are also verified in a browser.

The trip home shell is cached for use after an online visit. Linked Spotify services and CDN-based racing libraries still need connectivity. See [racing asset credits](races/assets/CREDITS.md) and [racing details](races/UPGRADE.md).
