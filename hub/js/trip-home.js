const P = window.TripPlan;
const $ = (id) => document.getElementById(id);
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const pounds = (value) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
function notify(message) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  $("toast-container").append(el);
  setTimeout(() => el.remove(), 4000);
}
function attempt(fn) {
  try {
    return fn();
  } catch (e) {
    notify(e.message);
    return false;
  }
}
function render() {
  const focused = document.activeElement?.id,
    s = P.get(),
    m = P.summary();
  const carStats = document.querySelector("[data-app=beachDay] .ac-stats");
  if (carStats)
    carStats.textContent =
      m.people.length + " friends · " + pounds(m.travel) + " estimated travel";
  $("trip-title").textContent = s.title;
  $("trip-subtitle").textContent = s.date
    ? `${new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date(s.date + "T12:00:00"))}. A little adventure with your favourite people.`
    : "Pick a date, round up your people, and make a little room for a good day.";
  $("trip-destination").textContent = s.destination || "Choose a destination";
  $("crew-caption").textContent =
    `${m.people.length} friends in the plan · ${m.going.length} confirmed`;
  $("crew-avatars").innerHTML = m.people
    .slice(0, 6)
    .map(
      (p) =>
        `<span class="mini-avatar" title="${esc(p.name)}">${esc(p.name.slice(0, 2).toUpperCase())}</span>`,
    )
    .join("");
  $("metric-crew").textContent = m.people.length;
  $("metric-crew-sub").textContent = m.going.length + " confirmed";
  $("metric-cars").textContent = m.cars.length + " cars";
  $("metric-cars-sub").textContent =
    m.emptySeats + " spare car seat" + (m.emptySeats === 1 ? "" : "s");
  $("metric-cost").textContent = pounds(m.travel);
  $("metric-packing").textContent = m.packingDone + "/" + s.packing.length;
  $("itinerary-list").innerHTML =
    s.itinerary
      .slice()
      .sort((a, b) => a.time.localeCompare(b.time))
      .map(
        (x) =>
          `<div class="timeline-row"><time class="timeline-time">${esc(x.time)}</time><div><strong>${esc(x.title)}</strong><p>${esc(x.detail)}</p></div><button class="row-remove" data-remove="itinerary" data-id="${esc(x.id)}" aria-label="Remove ${esc(x.title)}">×</button></div>`,
      )
      .join("") ||
    '<p class="empty-note">Make room for a good day. Add your first stop below.</p>';
  $("packing-progress").style.width =
    (s.packing.length ? (m.packingDone / s.packing.length) * 100 : 0) + "%";
  $("packing-count").textContent = m.packingDone + " of " + s.packing.length;
  $("packing-list").innerHTML = s.packing
    .map(
      (x) =>
        `<div class="pack-row ${x.done ? "done" : ""}"><input id="pack-${esc(x.id)}" type="checkbox" data-pack="${esc(x.id)}" ${x.done ? "checked" : ""}/><label for="pack-${esc(x.id)}">${esc(x.label)}</label><button type="button" class="row-remove" data-remove="packing" data-id="${esc(x.id)}" aria-label="Remove ${esc(x.label)}">×</button></div>`,
    )
    .join("");
  $("crew-list").innerHTML = m.people
    .map(
      (p) =>
        `<div class="crew-card"><div class="crew-person"><span class="crew-initial">${/^data:image\/(?:jpeg|png|webp|gif);base64,/.test(p.picture || "") ? `<img src="${esc(p.picture)}" alt="${esc(p.name)}"/>` : esc(p.name[0]?.toUpperCase() || "?")}</span><div><strong>${esc(p.name)}</strong><small>${esc(p.from || "Starting point not set")}</small></div></div><select id="rsvp-${esc(p.id)}" data-rsvp="${esc(p.id)}" aria-label="${esc(p.name)} attendance">${[
          ["planning", "Not confirmed"],
          ["going", "I'm coming"],
          ["maybe", "Maybe"],
          ["out", "Not this time"],
        ]
          .map(
            ([v, label]) =>
              `<option value="${v}" ${(s.rsvp[p.id] || "planning") === v ? "selected" : ""}>${label}</option>`,
          )
          .join("")}</select></div>`,
    )
    .join("");
  $("budget-limit").textContent = pounds(s.budget);
  $("budget-spent").textContent = pounds(m.spent);
  $("expenses-list").innerHTML =
    s.expenses
      .map(
        (e) =>
          `<div class="expense-row"><div>${esc(e.label)}<small>Paid by ${esc(e.paidBy || "the group")}</small></div><span class="amount">${pounds(e.amount)}</span><button class="row-remove" data-remove="expenses" data-id="${esc(e.id)}" aria-label="Remove ${esc(e.label)}">×</button></div>`,
      )
      .join("") ||
    '<p class="empty-note">Nothing recorded yet. Add group spending as you go.</p>';
  const count = m.going.length || m.people.length;
  $("split-note").textContent = m.spent
    ? `Equal share: ${pounds(m.spent / Math.max(1, count))} per ${m.going.length ? "confirmed friend" : "friend in the plan"}. Travel estimates are separate.`
    : "Group spending is separate from each person’s travel estimate.";
  const paid = $("expense-paid");
  const old = paid.value;
  paid.innerHTML =
    '<option value="">Who paid?</option>' +
    m.people
      .map((p) => `<option value="${esc(p.name)}">${esc(p.name)}</option>`)
      .join("");
  paid.value = old;
  if (document.activeElement !== $("trip-notes"))
    $("trip-notes").value = s.notes;
  if (focused) $(focused)?.focus({ preventScroll: true });
}
function downloadBackup() {
  const blob = new Blob([P.export()], { type: "application/json" }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = "big-backs-trip-backup.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  notify("Trip backup downloaded");
}
function activity(event, data = {}) {
  window.BigBacks?.activity.log("trip", event, data);
}
function openEdit() {
  const s = P.get();
  for (const key of [
    "title",
    "destination",
    "date",
    "meetingPoint",
    "departTime",
    "returnTime",
    "budget",
  ])
    $("edit-" + key).value = s[key];
  $("edit-dialog").showModal();
}
async function copy(text, done) {
  try {
    await navigator.clipboard.writeText(text);
    notify(done);
  } catch {
    $("share-fallback").value = text;
    $("share-fallback").hidden = false;
    $("share-fallback").focus();
    $("share-fallback").select();
    notify("Select and copy the text below");
  }
}
function boot() {
  render();
  P.onChange(render);
  $("edit-trip").addEventListener("click", openEdit);
  $("edit-trip-small").addEventListener("click", openEdit);
  $("edit-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const patch = {};
    for (const key of [
      "title",
      "destination",
      "date",
      "meetingPoint",
      "departTime",
      "returnTime",
    ])
      patch[key] = $("edit-" + key).value.trim();
    patch.budget = Number($("edit-budget").value);
    if (!patch.title || !patch.destination) return;
    attempt(() => {
      P.update(patch);
      activity("details", { destination: patch.destination });
      $("edit-dialog").close();
      notify("Trip details saved");
    });
  });
  $("share-trip").addEventListener("click", () => {
    $("share-fallback").hidden = true;
    $("share-dialog").showModal();
  });
  $("copy-link").addEventListener("click", () =>
    attempt(() =>
      copy(P.shareLink(), "Trip link copied. Friends can open their own copy."),
    ),
  );
  $("copy-brief").addEventListener("click", () =>
    copy(P.brief(), "Trip brief copied"),
  );
  $("download-backup").addEventListener("click", downloadBackup);
  $("download-backup-menu").addEventListener("click", downloadBackup);
  $("import-backup").addEventListener("click", () => $("backup-file").click());
  $("backup-file").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 12e6) {
      notify("Use a trip backup smaller than 12 MB");
      return;
    }
    try {
      const backup = JSON.parse(await file.text());
      const valid = P.validatePlan(backup.trip || backup);
      if (
        !confirm(
          `Load “${valid.title}”? Your current trip plan will be replaced. Export a backup first if needed.`,
        )
      )
        return;
      P.import(backup);
      notify("Trip plan loaded");
    } catch (e) {
      notify(e.message);
    } finally {
      e.target.value = "";
    }
  });
  $("itinerary-form").addEventListener("submit", (e) => {
    e.preventDefault();
    attempt(() => {
      P.add("itinerary", {
        time: $("stop-time").value,
        title: $("stop-title").value.trim(),
        detail: "",
      });
      e.target.reset();
      $("stop-time").value = "12:00";
      notify("Stop added");
    });
  });
  $("packing-form").addEventListener("submit", (e) => {
    e.preventDefault();
    attempt(() => {
      P.add("packing", { label: $("pack-label").value.trim(), done: false });
      e.target.reset();
    });
  });
  $("crew-form").addEventListener("submit", (e) => {
    e.preventDefault();
    attempt(() => {
      P.addPerson($("crew-name").value, $("crew-from").value);
      activity("friend", { name: $("crew-name").value });
      e.target.reset();
      notify("Friend added to the trip and transport planner");
    });
  });
  $("expense-form").addEventListener("submit", (e) => {
    e.preventDefault();
    attempt(() => {
      P.add("expenses", {
        label: $("expense-label").value.trim(),
        amount: Number($("expense-amount").value),
        paidBy: $("expense-paid").value,
      });
      activity("expense", { name: $("expense-label").value });
      e.target.reset();
      notify("Expense recorded");
    });
  });
  let notesTimer;
  $("trip-notes").addEventListener("input", () => {
    clearTimeout(notesTimer);
    notesTimer = setTimeout(
      () => attempt(() => P.update({ notes: $("trip-notes").value })),
      400,
    );
  });
  window.addEventListener("pagehide", () => {
    clearTimeout(notesTimer);
    if ($("trip-notes").value !== P.get().notes)
      attempt(() => P.update({ notes: $("trip-notes").value }));
  });
  document.addEventListener("change", (e) => {
    if (e.target.dataset.pack)
      attempt(() =>
        P.change("packing", e.target.dataset.pack, { done: e.target.checked }),
      );
    if (e.target.dataset.rsvp)
      attempt(() => P.rsvp(e.target.dataset.rsvp, e.target.value));
  });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-remove]");
    if (b) attempt(() => P.remove(b.dataset.remove, b.dataset.id));
    const close = e.target.closest("[data-close]");
    if (close) $(close.dataset.close).close();
  });
  const hash = new URLSearchParams(location.hash.slice(1));
  if (hash.has("plan")) {
    try {
      const encoded = hash.get("plan");
      if (encoded.length > 16000)
        throw new Error("Shared trip link is too large.");
      const binary = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
      const decoded = JSON.parse(
        new TextDecoder().decode(
          Uint8Array.from(binary, (c) => c.charCodeAt(0)),
        ),
      );
      const candidate = P.validatePlan(decoded);
      $("import-trip-title").textContent = candidate.title;
      $("import-trip-destination").textContent = candidate.destination;
      $("accept-shared").onclick = () =>
        attempt(() => {
          P.import(decoded);
          history.replaceState({}, "", location.pathname);
          $("shared-dialog").close();
          notify("Shared trip saved on this device");
        });
      $("shared-dialog").showModal();
    } catch (e) {
      notify("Could not read this trip link: " + e.message);
    }
  }
}
document.addEventListener("DOMContentLoaded", boot);
