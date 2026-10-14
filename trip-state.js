(function () {
  "use strict";
  const KEY = "bigbacks_trip_v1",
    CARPOOL = "bigbacks_carpool_v2";
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const id = () =>
    crypto.randomUUID?.() ||
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const defaultPeople = [
    ["MJ", "Stoke", 15, "drive"],
    ["Friend", "Stoke", 3, "drive"],
    ["Erika", "Stoke", 3, "drive"],
    ["Ringan", "Coventry", 25, "drive"],
    ["Rhianon", "Coventry", 5, "drive"],
    ["Liane", "Coventry", 5, "drive"],
    ["Evi", "Coventry", 5, "drive"],
    ["Shad", "Manchester", 10, "train"],
    ["Ed", "Birmingham", 25, "train"],
    ["Birat", "Sheffield", 18, "train"],
    ["Ishant", "Liverpool", 5, "train"],
    ["Leila (maybe)", "Cardiff", 45, "train"],
  ];
  const defaultTransport = {
    beachName: "Formby",
    cars: [
      {
        id: "c1",
        name: "MJ's Car",
        capacity: 4,
        seats: ["p1", "p2", "p3", null],
      },
      {
        id: "c2",
        name: "Ringan's Car",
        capacity: 4,
        seats: ["p4", "p5", "p6", "p7"],
      },
    ],
    pool: ["p8", "p9", "p10", "p11", "p12"],
    people: Object.fromEntries(
      defaultPeople.map(([name, from, cost, transport], i) => [
        "p" + (i + 1),
        {
          id: "p" + (i + 1),
          name,
          from,
          cost,
          transport,
          color: [5, 3, 6, 7, 4, 1, 9, 0, 2, 8, 3, 6][i],
          arrival: [
            "10:30",
            "10:30",
            "10:30",
            "11:00",
            "11:00",
            "11:00",
            "11:00",
            "10:45",
            "11:30",
            "11:30",
            "10:15",
            "13:00",
          ][i],
          picture: "",
        },
      ]),
    ),
    nextId: 13,
  };
  const defaults = {
    version: 1,
    title: "A day out, together.",
    destination: "Formby",
    date: "",
    meetingPoint: "",
    departTime: "09:00",
    returnTime: "18:00",
    budget: 250,
    notes: "",
    rsvp: {},
    itinerary: [
      {
        id: "meet",
        time: "10:30",
        title: "Meet the crew",
        detail: "Choose a meeting spot before setting off.",
      },
      {
        id: "explore",
        time: "11:00",
        title: "Explore & unwind",
        detail:
          "A suggested slot for the beach, a walk, or anything the group fancies.",
      },
      {
        id: "lunch",
        time: "13:00",
        title: "Lunch together",
        detail: "Bring a picnic or pick somewhere as a group.",
      },
      {
        id: "home",
        time: "17:00",
        title: "One last photo, then home",
        detail: "Check everyone has a ride back.",
      },
    ],
    packing: [
      { id: "water", label: "Water & snacks", done: false },
      { id: "layers", label: "Layers & a waterproof", done: false },
      { id: "charge", label: "Phone charger / power bank", done: false },
      { id: "sun", label: "Sunscreen", done: false },
      { id: "tickets", label: "Tickets & travel details", done: false },
    ],
    expenses: [],
    tracks: [],
  };
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : clone(fallback);
    } catch {
      return clone(fallback);
    }
  }
  function get() {
    const candidate = read(KEY, defaults);
    const raw =
      candidate && typeof candidate === "object" && !Array.isArray(candidate)
        ? candidate
        : clone(defaults);
    let exists = false;
    try {
      exists = !!localStorage.getItem(KEY);
    } catch {}
    if (!exists) raw.destination = transport().beachName || "Formby";
    return {
      ...clone(defaults),
      ...raw,
      rsvp: raw.rsvp && typeof raw.rsvp === "object" ? raw.rsvp : {},
      itinerary: Array.isArray(raw.itinerary)
        ? raw.itinerary
        : clone(defaults.itinerary),
      packing: Array.isArray(raw.packing)
        ? raw.packing
        : clone(defaults.packing),
      expenses: Array.isArray(raw.expenses) ? raw.expenses : [],
      tracks: Array.isArray(raw.tracks) ? raw.tracks : [],
    };
  }
  function transport() {
    const t = read(CARPOOL, defaultTransport);
    return t && t.people && Array.isArray(t.cars) && Array.isArray(t.pool)
      ? t
      : clone(defaultTransport);
  }
  function write(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      throw new Error(
        "Could not save. Browser storage may be full; export a backup before adding more photos.",
      );
    }
    window.dispatchEvent(new CustomEvent("trip-plan-change", { detail: key }));
    return data;
  }
  function update(patch) {
    return write(KEY, { ...get(), ...patch, updatedAt: Date.now() });
  }
  function mutate(field, fn) {
    const s = get();
    s[field] = fn(s[field]);
    return update({ [field]: s[field] });
  }
  function summary() {
    const s = get(),
      t = transport(),
      people = Object.values(t.people),
      going = people.filter((p) => s.rsvp[p.id] === "going"),
      travel = people.reduce((n, p) => n + (Number(p.cost) || 0), 0),
      spent = s.expenses.reduce((n, e) => n + (Number(e.amount) || 0), 0),
      capacity = t.cars.reduce((n, c) => n + (Number(c.capacity) || 0), 0),
      seated = t.cars.reduce((n, c) => n + c.seats.filter(Boolean).length, 0);
    return {
      people,
      going,
      travel,
      spent,
      capacity,
      seated,
      emptySeats: Math.max(0, capacity - seated),
      cars: t.cars,
      packingDone: s.packing.filter((x) => x.done).length,
    };
  }
  function addPerson(name, from = "") {
    if (typeof name !== "string" || !name.trim())
      throw new Error("Enter a friend’s name.");
    const t = transport(),
      pid = "p" + t.nextId++;
    if (Object.keys(t.people).length >= 50)
      throw new Error("The trip supports up to 50 friends.");
    t.people[pid] = {
      id: pid,
      name: name.trim().slice(0, 40),
      from: from.trim().slice(0, 60),
      color: Object.keys(t.people).length % 10,
      transport: "train",
      cost: 0,
      arrival: "",
      picture: "",
    };
    t.pool.push(pid);
    write(CARPOOL, t);
    window.BigBacks?.stats.update("beachDay", {
      peopleCount: Object.keys(t.people).length,
      totalCost: Object.values(t.people).reduce(
        (n, p) => n + (Number(p.cost) || 0),
        0,
      ),
    });
    return pid;
  }
  function brief() {
    const s = get(),
      m = summary();
    return [
      "BIG BACKS · TRIP TOGETHER",
      s.title,
      `Destination: ${s.destination}`,
      `Date: ${s.date || "To be decided"}`,
      `Meet: ${s.meetingPoint || "To be decided"}`,
      `Set off: ${s.departTime} · Head back: ${s.returnTime}`,
      `Crew: ${m.people.length} planning · ${m.going.length} confirmed`,
      `Estimated travel: £${m.travel.toFixed(2)}`,
      `Group budget: £${Number(s.budget).toFixed(2)}`,
      "",
      "THE PLAN",
      ...s.itinerary
        .slice()
        .sort((a, b) => a.time.localeCompare(b.time))
        .map(
          (x) => `${x.time} · ${x.title}${x.detail ? " — " + x.detail : ""}`,
        ),
      "",
      "PACKING",
      ...s.packing.map((x) => `${x.done ? "✓" : "☐"} ${x.label}`),
      s.notes ? "\nNOTES\n" + s.notes : "",
    ]
      .filter((x) => x !== undefined)
      .join("\n");
  }
  function publicPlan() {
    const s = get();
    return {
      version: 1,
      title: s.title,
      destination: s.destination,
      date: s.date,
      meetingPoint: s.meetingPoint,
      departTime: s.departTime,
      returnTime: s.returnTime,
      budget: s.budget,
      notes: s.notes,
      itinerary: s.itinerary,
      packing: s.packing.map((x) => ({ ...x, done: false })),
      tracks: s.tracks,
      carpool: publicTransport(),
      playlistUrl: s.playlistUrl || "",
    };
  }
  function shareLink() {
    const url = new URL(
      "hub/",
      new URL(
        "./",
        document.currentScript?.src || window.TRIP_ROOT_URL || location.href,
      ),
    );
    const bytes = new TextEncoder().encode(JSON.stringify(publicPlan()));
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    url.hash =
      "plan=" +
      btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    if (url.href.length > 16000)
      throw new Error(
        "This plan is too long for a link. Download the backup instead.",
      );
    return url.href;
  }
  function publicTransport() {
    const t = transport();
    return {
      beachName: t.beachName,
      cars: t.cars.map((c) => ({
        id: c.id,
        name: c.name,
        capacity: c.capacity,
        seats: c.seats,
      })),
      pool: t.pool,
      nextId: t.nextId,
      people: Object.fromEntries(
        Object.entries(t.people).map(([key, p]) => [
          key,
          {
            id: key,
            name: p.name,
            from: p.from,
            transport: p.transport,
            cost: p.cost,
            arrival: p.arrival,
            color: p.color,
          },
        ]),
      ),
    };
  }
  function validateTransport(value) {
    if (
      !value ||
      typeof value !== "object" ||
      !value.people ||
      !Array.isArray(value.cars)
    )
      throw new Error("This backup has an invalid transport plan.");
    const text = (v, n) => (typeof v === "string" ? v.slice(0, n) : "");
    const people = Object.fromEntries(
      Object.entries(value.people)
        .slice(0, 50)
        .filter(
          ([key, p]) =>
            /^[a-zA-Z0-9_-]{1,80}$/.test(key) && p && typeof p === "object",
        )
        .map(([key, p]) => [
          key,
          {
            id: key,
            name: text(p.name, 40) || "Friend",
            from: text(p.from, 60),
            transport: ["drive", "train", "bus", "walk", "bike"].includes(
              p.transport,
            )
              ? p.transport
              : "train",
            cost: Math.min(1e6, Math.max(0, Number(p.cost) || 0)),
            arrival: /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(p.arrival)
              ? p.arrival
              : "",
            color: Math.max(0, Math.min(9, Math.floor(Number(p.color) || 0))),
            picture:
              typeof p.picture === "string" &&
              p.picture.length < 400000 &&
              /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(
                p.picture,
              )
                ? p.picture
                : "",
          },
        ]),
    );
    const occupied = new Set();
    const cars = value.cars
      .slice(0, 20)
      .filter((c) => c && typeof c === "object")
      .map((c, i) => {
        const capacity = Math.max(
          1,
          Math.min(12, Math.floor(Number(c.capacity) || 4)),
        );
        const seats = Array.from({ length: capacity }, (_, index) => {
          const key = c.seats?.[index];
          if (typeof key === "string" && people[key] && !occupied.has(key)) {
            occupied.add(key);
            return key;
          }
          return null;
        });
        return {
          id: text(c.id, 80) || "c" + (i + 1),
          name: text(c.name, 60) || "Car " + (i + 1),
          capacity,
          seats,
        };
      });
    const next =
      Math.max(
        1,
        ...Object.keys(people).map(
          (k) => Number(k.match(/^p(\d+)$/)?.[1]) || 0,
        ),
      ) + 1;
    return {
      beachName: text(value.beachName, 80) || "Formby",
      cars,
      people,
      pool: Object.keys(people).filter((key) => !occupied.has(key)),
      nextId: Math.max(next, Math.min(1e6, Number(value.nextId) || next)),
    };
  }
  function importPlan(value) {
    const trip = validatePlan(value.trip || value),
      carpool = value.carpool || value.trip?.carpool;
    if (!carpool) return write(KEY, trip);
    const clean = validateTransport(carpool),
      oldTrip = localStorage.getItem(KEY),
      oldCarpool = localStorage.getItem(CARPOOL);
    try {
      localStorage.setItem(CARPOOL, JSON.stringify(clean));
      localStorage.setItem(KEY, JSON.stringify(trip));
    } catch {
      try {
        oldTrip === null
          ? localStorage.removeItem(KEY)
          : localStorage.setItem(KEY, oldTrip);
        oldCarpool === null
          ? localStorage.removeItem(CARPOOL)
          : localStorage.setItem(CARPOOL, oldCarpool);
      } catch {}
      throw new Error(
        "Could not restore the backup. Browser storage may be full.",
      );
    }
    window.dispatchEvent(new CustomEvent("trip-plan-change", { detail: KEY }));
    return trip;
  }
  function addItem(field, item) {
    const limits = { itinerary: 60, packing: 100, expenses: 100, tracks: 100 };
    if (!(field in limits) || get()[field].length >= limits[field])
      throw new Error(
        "This list is full. Remove an item before adding another.",
      );
    const key =
      field === "packing" ? "label" : field === "expenses" ? "label" : "title";
    if (typeof item[key] !== "string" || !item[key].trim())
      throw new Error("Give this item a name first.");
    if (
      field === "expenses" &&
      (!Number.isFinite(item.amount) || item.amount <= 0 || item.amount > 1e6)
    )
      throw new Error("Enter a positive amount up to £1,000,000.");
    return mutate(field, (list) => [
      ...list,
      { id: id(), ...item, [key]: item[key].trim() },
    ]);
  }
  function validatePlan(value) {
    if (!value || typeof value !== "object" || value.version !== 1)
      throw new Error("This is not a supported trip plan.");
    const text = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");
    const time = (v) => (/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : "");
    const date = (v) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return "";
      const parsed = new Date(v + "T12:00:00Z");
      return Number.isFinite(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === v
        ? v
        : "";
    };
    const source = { ...defaults, ...value };
    return {
      ...clone(defaults),
      title: text(source.title, 90),
      destination: text(source.destination, 80),
      date: date(source.date),
      meetingPoint: text(source.meetingPoint, 150),
      departTime: time(source.departTime) || "09:00",
      returnTime: time(source.returnTime) || "18:00",
      budget: Math.min(1e7, Math.max(0, Number(source.budget) || 0)),
      notes: text(source.notes, 2500),
      itinerary: (Array.isArray(source.itinerary) ? source.itinerary : [])
        .slice(0, 60)
        .map((x) => ({
          id: id(),
          time: time(x.time) || "12:00",
          title: text(x.title, 100),
          detail: text(x.detail, 250),
        })),
      packing: (Array.isArray(source.packing) ? source.packing : [])
        .slice(0, 100)
        .map((x) => ({ id: id(), label: text(x.label, 120), done: !!x.done })),
      tracks: (Array.isArray(source.tracks) ? source.tracks : [])
        .slice(0, 100)
        .map((x) => ({
          id: id(),
          title: text(x.title, 150),
          artist: text(x.artist, 100),
          by: text(x.by, 60),
        })),
      expenses: (Array.isArray(source.expenses) ? source.expenses : [])
        .slice(0, 100)
        .map((x) => ({
          id: id(),
          label: text(x.label, 100),
          amount: Math.min(1e6, Math.max(0, Number(x.amount) || 0)),
          paidBy: text(x.paidBy, 60),
        })),
      rsvp: Object.fromEntries(
        Object.entries(source.rsvp || {}).filter(
          ([key, value]) =>
            /^p\d+$/.test(key) &&
            ["planning", "going", "maybe", "out"].includes(value),
        ),
      ),
      playlistUrl: (() => {
        try {
          const u = new URL(source.playlistUrl || "");
          return u.protocol === "https:" &&
            u.hostname === "open.spotify.com" &&
            /^\/(?:intl-[a-z]+\/)?playlist\/[A-Za-z0-9]+\/?$/.test(u.pathname)
            ? u.href
            : "";
        } catch {
          return "";
        }
      })(),
    };
  }
  window.TripPlan = {
    KEY,
    CARPOOL,
    get,
    transport,
    update,
    summary,
    brief,
    shareLink,
    validatePlan,
    addPerson,
    id,
    add: addItem,
    change: (field, itemId, patch) =>
      mutate(field, (list) =>
        list.map((x) => (x.id === itemId ? { ...x, ...patch } : x)),
      ),
    remove: (field, itemId) =>
      mutate(field, (list) => list.filter((x) => x.id !== itemId)),
    rsvp: (personId, status) =>
      update({ rsvp: { ...get().rsvp, [personId]: status } }),
    export: () =>
      JSON.stringify(
        {
          format: "bigbacks-trip-backup",
          version: 1,
          trip: get(),
          carpool: transport(),
        },
        null,
        2,
      ),
    import: importPlan,
    onChange: (cb) => {
      window.addEventListener("trip-plan-change", cb);
      window.addEventListener("storage", (e) => {
        if ([KEY, CARPOOL].includes(e.key)) cb();
      });
    },
  };
})();
