(function () {
  const own = document.currentScript.src;
  window.TRIP_ROOT_URL = new URL("./", own).href;
  const root = window.TRIP_ROOT_URL,
    paths = {
      home: "hub/",
      travel: "beach-day/",
      music: "jam/",
      play: "races/",
    };
  const page = location.pathname.includes("/beach-day/")
    ? "travel"
    : location.pathname.includes("/jam/")
      ? "music"
      : location.pathname.includes("/races/")
        ? "play"
        : "home";
  function boot() {
    document.body.dataset.tripPage = page;
    const nav = document.createElement("header");
    nav.className = "trip-navigation";
    nav.innerHTML = `<a class="trip-brand" href="${root}hub/"><span class="brand-mark">b.</span><span>big backs<small>good trips. great company.</small></span></a><nav aria-label="Trip navigation">${[
      ["home", "The trip"],
      ["travel", "Getting there"],
      ["music", "Playlist"],
      ["play", "Play together"],
    ]
      .map(
        ([key, label]) =>
          `<a href="${root + paths[key]}"${key === page ? ' aria-current="page"' : ""}>${label}</a>`,
      )
      .join(
        "",
      )}</nav><span class="save-indicator"><i></i> Saved on this device</span>`;
    document.body.prepend(nav);
    if (page === "travel") {
      const heading =
        document.querySelector(".hero-title") ||
        document.querySelector("header h1") ||
        document.querySelector("h1");
      if (heading) heading.textContent = "Getting there, together.";
      const destination = document.getElementById("beach-name");
      if (destination) destination.textContent = TripPlan.get().destination;
      const profile = window.BigBacks?.profile.get();
      const nameInput = document.getElementById("signin-name");
      if (profile?.name && nameInput && !nameInput.value)
        nameInput.value = profile.name;
    }
    if (page === "music") {
      const title = document.querySelector(".app-title");
      if (title) title.textContent = "The trip soundtrack.";
      const tag = document.querySelector(".app-tag");
      if (tag)
        tag.textContent =
          "Build a wishlist with friends. Connect Spotify when you are ready.";
    }
    const footer = document.createElement("footer");
    footer.className = "trip-global-footer";
    footer.innerHTML =
      "<span>big backs · trips worth getting together for.</span><span>Made by Shad · Sound stays off until you choose.</span>";
    if (page !== "play") document.body.append(footer);
  }
  document.addEventListener("DOMContentLoaded", boot);
})();
