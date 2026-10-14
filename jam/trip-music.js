const P = window.TripPlan,
  $ = (id) => document.getElementById(id);
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function render() {
  const s = P.get();
  $("song-wishlist").innerHTML =
    s.tracks
      .map(
        (t) =>
          `<div class="song-row"><span class="song-icon">♪</span><div><strong>${esc(t.title)}</strong><small>${esc(t.artist || "Artist not set")}${t.by ? " · suggested by " + esc(t.by) : ""}</small></div><a class="song-search" href="https://open.spotify.com/search/${encodeURIComponent(t.title + " " + t.artist)}" target="_blank" rel="noopener">Find ↗</a><button class="song-remove" data-song-remove="${esc(t.id)}" aria-label="Remove ${esc(t.title)}">×</button></div>`,
      )
      .join("") ||
    '<div class="song-empty">The first song sets the mood.<br/><small>Add a favourite for the road, the picnic, or the ride home.</small></div>';
  $("wishlist-count").textContent =
    s.tracks.length + " song" + (s.tracks.length === 1 ? "" : "s");
  $("trip-playlist-title").textContent = s.destination + " soundtrack";
}
function boot() {
  render();
  P.onChange(render);
  $("wishlist-form").addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      P.add("tracks", {
        title: $("wishlist-title").value.trim(),
        artist: $("wishlist-artist").value.trim(),
        by: window.BigBacks?.profile.get()?.name || "",
      });
      e.target.reset();
      $("wishlist-title").focus();
    } catch (e) {
      $("playlist-feedback").textContent = e.message;
    }
  });
  $("song-wishlist").addEventListener("click", (e) => {
    const b = e.target.closest("[data-song-remove]");
    if (b)
      try {
        P.remove("tracks", b.dataset.songRemove);
      } catch (e) {
        $("playlist-feedback").textContent = e.message;
      }
  });
  $("playlist-link-form").addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      const u = new URL($("playlist-link-input").value.trim());
      if (
        u.protocol !== "https:" ||
        u.hostname !== "open.spotify.com" ||
        !/^\/(?:intl-[a-z]+\/)?playlist\/[A-Za-z0-9]+\/?$/.test(u.pathname)
      )
        throw new Error(
          "Paste a Spotify playlist link, like https://open.spotify.com/playlist/…",
        );
      u.search = "";
      P.update({ playlistUrl: u.href });
      showPlaylistLink();
      $("playlist-feedback").textContent =
        "Playlist link saved. It opens Spotify; nothing plays automatically.";
    } catch (e) {
      $("playlist-feedback").textContent = e.message;
    }
  });
  showPlaylistLink();
  const configured = /^[a-f\d]{32}$/i.test(
    localStorage.getItem("bbj_client_id") || "",
  );
  if (!configured) $("btn-login").hidden = true;
}
function showPlaylistLink() {
  const href = P.get().playlistUrl,
    link = $("open-trip-playlist");
  if (href) {
    try {
      const u = new URL(href);
      if (u.protocol === "https:" && u.hostname === "open.spotify.com") {
        link.href = u.href;
        link.hidden = false;
        return;
      }
    } catch {}
  }
  link.hidden = true;
}
document.addEventListener("DOMContentLoaded", boot);
