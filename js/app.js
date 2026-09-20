/* ═══════════════════════════════════════════════════════════════════════
   SAIKI EMOTES — ROBLOX EMOTE CATALOG (app logic)
   ─────────────────────────────────────────────────────────────────────
   A catalog of REAL Roblox UGC emotes.

   Data sources (both contain only real, verifiable catalog data):
   1. Bundled database  data/emotes.js — fetched from the public Roblox
      catalog API at build time (see meta block inside that file).
   2. Live Roblox catalog — via roproxy.com (CORS-enabled mirror) when the
      browser is online. Falls back to the bundled database automatically.

   Nothing is ever invented: when a value is unknown it is shown as
   unknown, and when an asset can't be verified it is marked as such.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ─────────────────────────── constants ─────────────────────────── */
  const PER_PAGE = 15; // 5 columns × 3 rows on desktop
  const LS = {
    favorites: "saiki:favorites",
    userEmotes: "saiki:userEmotes",
    settings: "saiki:settings",
    thumbStore: "saiki:thumbStore",
    liveCache: "saiki:liveCache",
  };
  const LIVE_TTL = 6 * 60 * 60 * 1000; // live catalog cache: 6 h
  const BROWSE_PAGES_MAX = 12; // background pages fetched from Roblox

  const $ = (sel) => document.querySelector(sel);
  const els = {
    window: $("#guiWindow"),
    header: $("#guiHeader"),
    btnTheme: $("#btnTheme"),
    btnLock: $("#btnLock"),
    searchInput: $("#searchInput"),
    searchSpinner: $("#searchSpinner"),
    btnClearSearch: $("#btnClearSearch"),
    sourceChip: $("#sourceChip"),
    sourceLabel: $("#sourceLabel"),
    contentArea: $("#contentArea"),
    grid: $("#grid"),
    emptyState: $("#emptyState"),
    settingsView: $("#settingsView"),
    paginationRow: $("#paginationRow"),
    pageInfo: $("#pageInfo"),
    pageNumbers: $("#pageNumbers"),
    btnPrevPage: $("#btnPrevPage"),
    btnNextPage: $("#btnNextPage"),
    tabEmotes: $("#tabEmotes"),
    tabFavorites: $("#tabFavorites"),
    tabSettings: $("#tabSettings"),
    btnCopyId: $("#btnCopyId"),
    favCount: $("#favCount"),
    modalOverlay: $("#modalOverlay"),
    modalThumb: $("#modalThumb"),
    modalThumbFallback: $("#modalThumbFallback"),
    modalName: $("#modalName"),
    modalMeta: $("#modalMeta"),
    modalStatus: $("#modalStatus"),
    modalDescription: $("#modalDescription"),
    modalAssetId: $("#modalAssetId"),
    modalFav: $("#modalFav"),
    modalCopyId: $("#modalCopyId"),
    modalCopyId2: $("#modalCopyId2"),
    modalCopyLua: $("#modalCopyLua"),
    modalRobloxLink: $("#modalRobloxLink"),
    modalClose: $("#modalClose"),
    toastHost: $("#toastHost"),
    importFile: $("#importFile"),
  };

  /* ─────────────────────────── state ─────────────────────────── */
  const state = {
    emotes: new Map(), // id → emote record
    favorites: new Set(),
    userEmotes: [], // array of records (persisted)
    settings: { theme: "light", locked: false, pos: null, liveMode: "auto", includeOfficial: false },
    tab: "emotes", // emotes | favorites | settings
    query: "",
    page: 1,
    selectedId: null,
    searchLive: null, // { query, ids:[] } when live search results are shown
    live: { status: "idle", online: null, pagesLoaded: 0, lastCheck: null, error: null, browsing: false },
    dbMeta: (window.SAIKI_EMOTES_DB && window.SAIKI_EMOTES_DB.meta) || null,
  };

  /* ─────────────────────────── persistence ─────────────────────────── */
  function lsGetJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
  function lsSetJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage may be full or disabled */
    }
  }
  const saveFavorites = () => lsSetJSON(LS.favorites, [...state.favorites]);
  const saveUserEmotes = () => lsSetJSON(LS.userEmotes, state.userEmotes);
  const saveSettings = () => lsSetJSON(LS.settings, state.settings);

  const thumbStore = lsGetJSON(LS.thumbStore, {}); // id → url (live-fetched, long-lived)
  const saveThumbStore = () => lsSetJSON(LS.thumbStore, thumbStore);

  /* ─────────────────────────── helpers ─────────────────────────── */
  const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-US") : "—");
  const priceLabel = (e) => (e.free || e.price === 0 ? "FREE" : e.price != null ? "R$" + e.price : "—");
  const catalogURL = (id) => "https://www.roblox.com/catalog/" + id + "/";

  function toast(message, type) {
    const el = document.createElement("div");
    el.className = "toast" + (type ? " " + type : "");
    el.textContent = message;
    els.toastHost.appendChild(el);
    while (els.toastHost.children.length > 3) els.toastHost.firstChild.remove();
    setTimeout(() => {
      el.classList.add("out");
      setTimeout(() => el.remove(), 300);
    }, 2600);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      throw new Error("no clipboard api");
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText = "position:fixed;opacity:0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        ta.remove();
        return ok;
      } catch {
        return false;
      }
    }
  }

  function luauSnippet(e) {
    return (
      "-- Play the UGC emote \"" + e.name + "\" inside an experience you control\n" +
      "-- (or one that allows loading this marketplace animation asset).\n" +
      "local Players = game:GetService(\"Players\")\n" +
      "local character = Players.LocalPlayer.Character\n" +
      "local humanoid = character and character:FindFirstChildOfClass(\"Humanoid\")\n" +
      "if humanoid then\n" +
      "    local animator = humanoid:FindFirstChildOfClass(\"Animator\")\n" +
      "    local animation = Instance.new(\"Animation\")\n" +
      "    animation.AnimationId = \"rbxassetid://" + e.id + "\"\n" +
      "    local track = animator:LoadAnimation(animation)\n" +
      "    track:Play()\n" +
      "end"
    );
  }

  /* ─────────────────────────── data layer ─────────────────────────── */
  function upsertEmote(rec, origin) {
    if (!rec || !Number.isFinite(Number(rec.id))) return;
    const id = Number(rec.id);
    const existing = state.emotes.get(id);
    if (existing) {
      // live data refreshes bundled/user records but never wipes their origin
      existing.name = rec.name || existing.name;
      existing.creator = rec.creator || existing.creator;
      existing.creatorType = rec.creatorType || existing.creatorType;
      existing.creatorId = rec.creatorId ?? existing.creatorId;
      existing.creatorVerified = !!rec.creatorVerified;
      existing.official = !!rec.official;
      if (rec.price != null) existing.price = rec.price;
      if (rec.free != null) existing.free = rec.free;
      if (rec.favorites) existing.favorites = rec.favorites;
      if (rec.created) existing.created = rec.created;
      if (rec.description) existing.description = rec.description;
      if (thumbStore[id]) existing.thumb = thumbStore[id];
      if (origin === "live") existing.seenLive = true;
      return;
    }
    state.emotes.set(id, {
      id,
      name: rec.name || "Unnamed emote",
      creator: rec.creator || "Unknown creator",
      creatorType: rec.creatorType || "",
      creatorId: rec.creatorId ?? null,
      creatorVerified: !!rec.creatorVerified,
      official: !!rec.official,
      price: rec.price != null ? rec.price : null,
      free: !!rec.free || rec.price === 0,
      favorites: rec.favorites || 0,
      created: rec.created || "",
      description: rec.description || "",
      thumb: thumbStore[id] || rec.thumb || null,
      origin,
      seenLive: origin === "live",
    });
  }

  function loadBundled() {
    const db = window.SAIKI_EMOTES_DB;
    if (!db || !Array.isArray(db.emotes)) return;
    for (const rec of db.emotes) upsertEmote(rec, "bundled");
    state.dbMeta = db.meta || null;
  }

  function loadUserEmotes() {
    state.userEmotes = lsGetJSON(LS.userEmotes, []);
    for (const rec of state.userEmotes) upsertEmote(rec, "user");
  }

  function saveLiveCache(items) {
    lsSetJSON(LS.liveCache, { t: Date.now(), items: items.slice(0, 500) });
  }

  async function fetchThumbsFor(ids, size) {
    try {
      const map = await window.RobloxAPI.getThumbnails(ids, size || 150);
      let changed = false;
      for (const [id, url] of Object.entries(map)) {
        thumbStore[id] = url;
        const e = state.emotes.get(Number(id));
        if (e) e.thumb = url;
        changed = true;
      }
      if (changed) {
        const keys = Object.keys(thumbStore);
        if (keys.length > 1200) for (const k of keys.slice(0, keys.length - 1200)) delete thumbStore[k];
        saveThumbStore();
      }
      return map;
    } catch {
      return {};
    }
  }

  /* ─────────────────────── live catalog loader ─────────────────────── */
  const liveLoader = {
    timer: null,
    stopped: false,

    start() {
      this.stop(); // never allow two browse chains at once
      this.stopped = false;
      // 1) instantly merge a recent live cache (max 6 h old)
      const cached = lsGetJSON(LS.liveCache, null);
      if (cached && Date.now() - cached.t < LIVE_TTL && Array.isArray(cached.items)) {
        for (const rec of cached.items) upsertEmote(rec, "live");
        state.live.pagesLoaded = cached.pages || 0;
      }
      setLiveStatus("connecting");
      // 2) refresh page 1 from Roblox, then browse more pages in background
      this.loadNext(null, 1).catch(() => {});
    },

    stop() {
      this.stopped = true;
      if (this.timer) clearTimeout(this.timer);
      this.timer = null;
    },

    async loadNext(cursor, pageNo) {
      if (this.stopped || state.settings.liveMode !== "auto") return;
      try {
        const res = await window.RobloxAPI.searchEmotes({ cursor, minPrice: 1, sort: "MostFavorited", limit: 30 });
        if (this.stopped) return;
        const fresh = [];
        for (const rec of res.items) {
          const isNew = !state.emotes.has(rec.id);
          upsertEmote(rec, "live");
          if (isNew) fresh.push(rec);
          state.emotes.get(rec.id).seenLive = true;
        }
        state.live.online = true;
        state.live.pagesLoaded = pageNo;
        state.live.lastCheck = Date.now();
        state.live.error = null;
        setLiveStatus("online");
        if (fresh.length) {
          fetchThumbsFor(fresh.map((r) => r.id), 150).then(() => {
            if (state.tab !== "settings") renderCurrentView({ soft: true });
          });
        }
        // persist a snapshot of the live-known records
        const liveItems = [...state.emotes.values()].filter((e) => e.seenLive).map((e) => ({ ...e }));
        saveLiveCache(liveItems);
        updatePageInfo();
        if (state.tab === "settings") renderSettings();

        if (res.nextCursor && pageNo < BROWSE_PAGES_MAX) {
          this.timer = setTimeout(() => this.loadNext(res.nextCursor, pageNo + 1).catch(() => {}), 7200);
        } else {
          state.live.browsing = false;
        }
      } catch (err) {
        state.live.online = false;
        state.live.error = String((err && err.message) || err);
        state.live.browsing = false;
        setLiveStatus("offline");
        if (state.tab === "settings") renderSettings();
      }
    },
  };

  function setLiveStatus(kind) {
    state.live.status = kind;
    els.sourceChip.classList.toggle("live", kind === "online");
    els.sourceChip.classList.toggle("offline", kind === "offline");
    if (state.settings.liveMode === "bundled") {
      els.sourceLabel.textContent = "BUNDLED DB";
      els.sourceChip.title = "Showing only the bundled database (live mode disabled in Settings)";
      return;
    }
    if (kind === "online") {
      els.sourceLabel.textContent = "LIVE · ROBLOX" + (state.live.pagesLoaded ? " +" + state.live.pagesLoaded * 30 : "");
      els.sourceChip.title = "Connected to the live Roblox catalog (community mirror roproxy.com). " + state.live.pagesLoaded + " page(s) loaded.";
    } else if (kind === "offline") {
      els.sourceLabel.textContent = "OFFLINE · BUNDLED";
      els.sourceChip.title = "Roblox catalog unreachable" + (state.live.error ? " — " + state.live.error : "") + ". Showing the bundled database.";
    } else {
      els.sourceLabel.textContent = "CONNECTING…";
      els.sourceChip.title = "Connecting to the live Roblox catalog…";
    }
  }

  /* ─────────────────────────── filtering ─────────────────────────── */
  function localMatch(e, q) {
    const n = q.toLowerCase();
    return (
      e.name.toLowerCase().includes(n) ||
      e.creator.toLowerCase().includes(n) ||
      String(e.id).includes(n)
    );
  }

  function visibleEmotes() {
    let list;
    if (state.tab === "favorites") {
      list = [...state.emotes.values()].filter((e) => state.favorites.has(e.id));
    } else {
      list = [...state.emotes.values()];
    }
    // UGC focus: hide Roblox-official items unless the user opted in
    // (items the user explicitly added by ID are always shown)
    if (!state.settings.includeOfficial) {
      list = list.filter((e) => !e.official || e.origin === "user");
    }
    const q = state.query.trim();
    const useLiveResults = q && state.tab === "emotes" && state.searchLive && state.searchLive.query === q;
    if (useLiveResults) {
      // live Roblox results first, then any local-only matches appended after
      const seen = new Set();
      const out = [];
      for (const id of state.searchLive.ids) {
        const e = state.emotes.get(id);
        if (e && (!e.official || state.settings.includeOfficial || e.origin === "user")) {
          out.push(e);
          seen.add(id);
        }
      }
      for (const e of list) if (localMatch(e, q) && !seen.has(e.id)) out.push(e);
      list = out;
    } else {
      if (q) list = list.filter((e) => localMatch(e, q));
      list.sort((a, b) => b.favorites - a.favorites);
    }
    return list;
  }

  /* ─────────────────────────── rendering ─────────────────────────── */
  const FALLBACK_SVG =
    '<svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true"><circle cx="12" cy="7" r="3.4" fill="currentColor" opacity=".45"/><path d="M8.6 12.4c2-2.2 5-2.2 6.8 0l2.6 3.4-2.6 1.6-1.7-2.1-.4 4.9-3.2 5-2.9-2.1 2.9-4.5-2.5-3z" fill="currentColor" opacity=".45"/></svg>';

  function cardHTML(e) {
    const fav = state.favorites.has(e.id);
    const originDot =
      e.origin === "user"
        ? '<span class="origin-dot user" title="Added by you (verified on Roblox)"></span>'
        : e.origin === "live"
          ? '<span class="origin-dot" title="Loaded live from the Roblox catalog"></span>'
          : "";
    // transparent 1×1 gif placeholder when no thumbnail URL is known
    const BLANK = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
    const img = e.thumb
      ? '<img src="' + e.thumb + '" loading="lazy" alt="" />'
      : '<img src="' + BLANK + '" alt="" class="failed" />';
    return (
      '<article class="card' + (state.selectedId === e.id ? " selected" : "") + '" data-id="' + e.id + '" tabindex="0" role="button" aria-label="' +
      escapeHTML(e.name) + " by " + escapeHTML(e.creator) + ' — asset ' + e.id + '" title="' +
      escapeHTML(e.name) + "  ·  by " + escapeHTML(e.creator) + "  ·  asset " + e.id + '">' +
      '<div class="thumb-wrap">' + img +
      '<div class="thumb-fallback">' + FALLBACK_SVG + "<span>Thumbnail unavailable</span></div>" +
      originDot +
      '<span class="price-chip' + (e.free || e.price === 0 ? " free" : "") + '">' + priceLabel(e) + "</span>" +
      '<button class="star-btn' + (fav ? " on" : "") + '" type="button" title="' +
      (fav ? "Remove from favorites" : "Add to favorites") + '" aria-label="Toggle favorite">' +
      '<svg viewBox="0 0 24 24" width="17" height="17"><path d="M12 2.6l2.8 5.9 6.5.9-4.7 4.5 1.2 6.4L12 17.2l-5.8 3.1 1.2-6.4L2.7 9.4l6.5-.9z"/></svg>' +
      "</button></div>" +
      '<div class="card-name">' + escapeHTML(e.name) + "</div>" +
      "</article>"
    );
  }

  function escapeHTML(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function renderGrid() {
    const list = visibleEmotes();
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    if (state.page > pages) state.page = pages;
    const start = (state.page - 1) * PER_PAGE;
    const slice = list.slice(start, start + PER_PAGE);

    els.grid.innerHTML = slice.map(cardHTML).join("");
    els.grid.hidden = false;
    els.settingsView.hidden = true;
    els.emptyState.hidden = slice.length > 0;

    if (!slice.length) {
      els.emptyState.innerHTML = emptyStateHTML();
    }
    renderPagination(list.length, pages);
    updatePageInfo();
  }

  function emptyStateHTML() {
    const q = state.query.trim();
    if (state.tab === "favorites") {
      return (
        '<div class="big-icon"><svg viewBox="0 0 24 24" width="54" height="54"><path d="M12 2.6l2.8 5.9 6.5.9-4.7 4.5 1.2 6.4L12 17.2l-5.8 3.1 1.2-6.4L2.7 9.4l6.5-.9z" fill="currentColor"/></svg></div>' +
        "<h3>No favorites yet</h3><p>Tap the ★ on any emote card and it will be saved here.</p>"
      );
    }
    if (q) {
      const offlineNote =
        state.settings.liveMode === "auto" && state.live.online === false
          ? "<p>Live Roblox search is unreachable right now — these are results from the bundled database.</p>"
          : "";
      return (
        '<div class="big-icon"><svg viewBox="0 0 24 24" width="54" height="54"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><line x1="15.4" y1="15.4" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>' +
        "<h3>No emotes found for \u201C" + escapeHTML(q) + "\u201D</h3>" + offlineNote +
        '<button class="btn small" data-action="clear-search" type="button">Clear search</button>'
      );
    }
    return "<h3>No emotes loaded</h3><p>The catalog is empty — check Settings → Data source.</p>";
  }

  function renderPagination(total, pages) {
    els.pageInfo.textContent =
      "Page " + state.page + " of " + pages + " · " + fmt(total) + " emote" + (total === 1 ? "" : "s");
    els.btnPrevPage.disabled = state.page <= 1;
    els.btnNextPage.disabled = state.page >= pages;

    const parts = [];
    const cur = state.page;
    const want = new Set([1, pages, cur - 1, cur, cur + 1]);
    const sorted = [...want].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
    let prev = 0;
    for (const n of sorted) {
      if (n - prev > 1) parts.push('<span class="page-ellipsis">…</span>');
      parts.push(
        '<button class="page-btn' + (n === cur ? " active" : "") + '" type="button" data-page="' + n + '" aria-label="Page ' + n + '">' + n + "</button>"
      );
      prev = n;
    }
    els.pageNumbers.innerHTML = parts.join("");
  }

  function updatePageInfo() {
    if (state.tab === "settings") {
      els.paginationRow.style.visibility = "hidden";
      return;
    }
    els.paginationRow.style.visibility = "visible";
  }

  function renderCurrentView(opts) {
    const o = opts || {};
    els.favCount.textContent = state.favorites.size;
    if (state.tab === "settings") {
      els.grid.hidden = true;
      els.emptyState.hidden = true;
      els.settingsView.hidden = false;
      renderSettings();
      updatePageInfo();
      return;
    }
    renderGrid();
    if (!o.soft) {
      // full re-render scrolls grid to top of page
      els.grid.scrollTop = 0;
    }
  }

  function refreshSelectionUI() {
    els.btnCopyId.classList.toggle("has-selection", state.selectedId != null);
    const sel = state.selectedId != null ? state.emotes.get(state.selectedId) : null;
    els.btnCopyId.title = sel
      ? "Copy asset ID of \u201C" + sel.name + "\u201D (" + sel.id + ")"
      : "Copy the asset ID of the selected emote";
    for (const card of els.grid.querySelectorAll(".card")) {
      card.classList.toggle("selected", Number(card.dataset.id) === state.selectedId);
    }
  }

  /* ─────────────────────────── modal ─────────────────────────── */
  let modalOpenId = null;

  function openModal(id) {
    const e = state.emotes.get(id);
    if (!e) return;
    modalOpenId = id;
    state.selectedId = id;
    refreshSelectionUI();

    els.modalName.textContent = e.name;
    els.modalAssetId.textContent = e.id;
    els.modalRobloxLink.href = catalogURL(e.id);
    els.modalDescription.textContent = e.description || "No description available for this emote.";
    els.modalFav.classList.toggle("on", state.favorites.has(e.id));
    els.modalFav.title = state.favorites.has(e.id) ? "Remove from favorites" : "Add to favorites";

    const chips = [];
    chips.push(
      '<span class="meta-chip">by ' + escapeHTML(e.creator) +
      (e.creatorVerified ? ' <svg viewBox="0 0 24 24" width="13" height="13" aria-label="Verified creator"><circle cx="12" cy="12" r="10" fill="#00a2ff"/><path d="M7.5 12.4l3 3 6-6.4" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' : "") +
      (e.creatorType ? " · " + escapeHTML(e.creatorType) : "") + "</span>"
    );
    chips.push('<span class="meta-chip' + (e.free || e.price === 0 ? " good" : "") + '">' + priceLabel(e) + "</span>");
    chips.push(
      '<span class="meta-chip muted"><svg viewBox="0 0 24 24" width="12" height="12"><path d="M12 2.6l2.8 5.9 6.5.9-4.7 4.5 1.2 6.4L12 17.2l-5.8 3.1 1.2-6.4L2.7 9.4l6.5-.9z" fill="currentColor"/></svg> ' + fmt(e.favorites) + " favorites</span>"
    );
    if (e.created) chips.push('<span class="meta-chip muted">Created ' + e.created + "</span>");
    if (e.official) chips.push('<span class="meta-chip warn">Roblox official (not UGC)</span>');
    const originChip =
      e.origin === "user"
        ? '<span class="meta-chip verified">Added by you · verified</span>'
        : e.origin === "live"
          ? '<span class="meta-chip verified">Live from Roblox catalog</span>'
          : '<span class="meta-chip">Bundled catalog DB</span>';
    chips.push(originChip);
    els.modalMeta.innerHTML = chips.join("");

    // status line + "check now"
    renderModalStatus(e, null);
    els.modalOverlay.hidden = false;
    document.body.style.overflow = "hidden";

    // thumbnail: reuse a previously fetched large one, else the stored one,
    // and try to upgrade to a large live version in the background
    setModalThumb(e.thumb420 || e.thumb);
    if (!e.thumb420) {
      window.RobloxAPI
        .getThumbnails([e.id], 420)
        .then((map) => {
          if (modalOpenId === e.id && map[e.id]) {
            setModalThumb(map[e.id]);
            e.thumb420 = map[e.id];
          }
        })
        .catch(() => {});
    }
    setTimeout(() => els.modalClose.focus(), 30);
  }

  function setModalThumb(url) {
    els.modalThumbFallback.parentElement.classList.remove("big-failed");
    els.modalThumb.classList.remove("failed");
    els.modalThumb.onerror = () => {
      els.modalThumb.classList.add("failed");
      els.modalThumbFallback.parentElement.classList.add("big-failed");
    };
    els.modalThumb.src = url || "";
    if (!url) {
      els.modalThumb.classList.add("failed");
      els.modalThumbFallback.parentElement.classList.add("big-failed");
    }
  }

  function renderModalStatus(e, check) {
    const base = [];
    if (e.origin === "bundled") {
      base.push(
        '<span>Indexed from the Roblox catalog API' +
        (state.dbMeta && state.dbMeta.generated ? " on " + escapeHTML(state.dbMeta.generated) : "") +
        ".</span>"
      );
    } else if (e.origin === "user") {
      base.push("<span>Verified on Roblox when added" + (e.addedAt ? " · " + escapeHTML(e.addedAt) : "") + ".</span>");
    } else {
      base.push("<span>Loaded live from the Roblox Marketplace.</span>");
    }
    let after = "";
    if (check === "loading") {
      after = '<span class="meta-chip muted">Checking on Roblox…</span>';
    } else if (check === "forsale") {
      after = '<span class="meta-chip good">Available on Roblox · For sale</span>';
    } else if (check === "offsale") {
      after = '<span class="meta-chip warn">On Roblox · currently not for sale</span>';
    } else if (check === "removed") {
      after = '<span class="meta-chip bad">Not found on Roblox — this emote was removed or the ID is invalid</span>';
    } else if (check === "unavailable") {
      after = '<span class="meta-chip warn">Could not verify right now (Roblox API unreachable)</span>';
    }
    els.modalStatus.innerHTML =
      base.join("") + after +
      '<button class="btn small" data-action="verify" type="button">Check on Roblox</button>';
  }

  async function verifyModalEmote() {
    const e = state.emotes.get(modalOpenId);
    if (!e) return;
    renderModalStatus(e, "loading");
    try {
      const d = await window.RobloxAPI.getAssetDetails(e.id);
      if (modalOpenId !== e.id) return;
      if (d.notFound) {
        renderModalStatus(e, "removed");
        return;
      }
      // refresh what we know from the authoritative answer
      if (d.price != null) e.price = d.price;
      if (d.name) e.name = d.name;
      if (d.creator) e.creator = d.creator;
      e.free = d.price === 0;
      renderModalStatus(e, d.forSale ? "forsale" : "offsale");
      els.modalName.textContent = e.name;
    } catch {
      if (modalOpenId !== e.id) return;
      renderModalStatus(e, "unavailable");
    }
  }

  function closeModal() {
    modalOpenId = null;
    els.modalOverlay.hidden = true;
    document.body.style.overflow = "";
  }

  /* ─────────────────────────── settings view ─────────────────────────── */
  function renderSettings() {
    const s = state.settings;
    const live = state.live;
    const db = state.dbMeta || {};
    const liveModeRow =
      '<div class="settings-row"><div class="info"><b>Live Roblox catalog</b>' +
      "<span>Fetch UGC emotes directly from the Roblox Marketplace (via the roproxy.com community mirror) and merge them with the bundled database. Falls back to the bundled database automatically.</span></div>" +
      '<div class="radio-pills">' +
      '<label><input type="radio" name="liveMode" value="auto"' + (s.liveMode === "auto" ? " checked" : "") + ' /> Auto (live + bundled)</label>' +
      '<label><input type="radio" name="liveMode" value="bundled"' + (s.liveMode === "bundled" ? " checked" : "") + ' /> Bundled only</label>' +
      "</div></div>";

    const liveStatusRow =
      '<div class="settings-row"><div class="info"><b>Status</b><span>' +
      (s.liveMode === "bundled"
        ? "Live mode disabled — showing the bundled database only."
        : live.online === true
          ? "Connected · " + live.pagesLoaded + " catalog page(s) loaded this session" +
            (live.lastCheck ? " · last OK check " + new Date(live.lastCheck).toLocaleTimeString() : "")
          : live.online === false
            ? "Roblox API unreachable from this browser" + (live.error ? " (" + escapeHTML(live.error) + ")" : "") + " — using the bundled database."
            : "Connecting…") +
      "</span></div>" +
      '<button class="btn small" data-action="refresh-live" type="button"' + (s.liveMode === "bundled" ? " disabled" : "") + ">Refresh now</button></div>";

    const officialRow =
      '<div class="settings-row"><div class="info"><b>Show official Roblox emotes</b>' +
      "<span>This catalog focuses on UGC emotes. Turn this on to also show emotes published by Roblox itself when browsing live results.</span></div>" +
      '<label class="switch"><input type="checkbox" id="setOfficial"' + (s.includeOfficial ? " checked" : "") + ' /><span class="track"></span></label></div>';

    const addUser =
      '<div class="add-form">' +
      '<input id="addEmoteId" type="text" inputmode="numeric" placeholder="Roblox emote asset ID (e.g. 3576968027)" />' +
      '<button class="btn solid" data-action="add-emote" type="button">Verify &amp; add</button>' +
      "</div>" +
      '<p class="form-msg" id="addMsg"></p>' +
      '<p class="settings-note">The ID is verified against Roblox before anything is added: only real emote-animation assets (type 61) are accepted, and their real name, creator, price and thumbnail are pulled from the catalog. Nothing is added if verification is unavailable.</p>';

    const userList = state.userEmotes.length
      ? state.userEmotes
          .map(
            (u) =>
              '<div class="user-emote-row">' +
              (u.thumb ? '<img src="' + u.thumb + '" alt="" />' : '<span style="width:34px;height:34px;border-radius:8px;background:var(--thumb-bg);display:inline-block"></span>') +
              '<span class="nm">' + escapeHTML(u.name) + '</span><span class="id">' + u.id + "</span>" +
              '<button class="icon-btn" data-action="remove-user" data-id="' + u.id + '" title="Remove from my catalog" aria-label="Remove">🗑</button>' +
              "</div>"
          )
          .join("")
      : '<p class="settings-note" style="margin-top:2px">No custom emotes added yet.</p>';

    const dbInfo =
      "<b>Bundled database</b><span>" +
      fmt(db.count) + " verified UGC emotes" +
      (db.generated ? " · generated " + escapeHTML(db.generated) : "") +
      (db.source ? " · source: " + escapeHTML(db.source) : "") +
      "</span>";

    els.settingsView.innerHTML =
      '<div class="settings-card"><h3>APPEARANCE</h3>' +
      '<div class="settings-row"><div class="info"><b>Theme</b><span>Light gray panel (default) or dark.</span></div>' +
      '<label class="switch"><input type="checkbox" id="setTheme"' + (s.theme === "dark" ? " checked" : "") + ' /><span class="track"></span></label></div>' +
      '<div class="settings-row"><div class="info"><b>Lock interface position</b><span>When unlocked, drag the window by its header.</span></div>' +
      '<label class="switch"><input type="checkbox" id="setLocked"' + (s.locked ? " checked" : "") + ' /><span class="track"></span></label></div>' +
      '<div class="settings-row"><div class="info"><b>Window position</b><span>Centered by default.</span></div>' +
      '<button class="btn small" data-action="reset-pos" type="button">Reset position</button></div>' +
      "</div>" +

      '<div class="settings-card"><h3>DATA SOURCE</h3>' + liveModeRow + liveStatusRow + officialRow +
      "</div>" +

      '<div class="settings-card"><h3>ADD UGC EMOTE BY ASSET ID</h3>' + addUser + userList + "</div>" +

      '<div class="settings-card"><h3>MY DATA</h3>' +
      '<div class="settings-row"><div class="info"><b>Favorites</b><span>' + state.favorites.size + " emote(s) saved in this browser.</span></div></div>" +
      '<div class="settings-row"><div class="info"><b>Export / import</b><span>Save your favorites, added emotes and settings as JSON.</span></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<button class="btn small" data-action="export" type="button">Export</button>' +
      '<button class="btn small" data-action="import" type="button">Import</button>' +
      '<button class="btn small danger" data-action="reset" type="button">Reset all</button>' +
      "</div></div></div>" +

      '<div class="settings-card"><h3>ABOUT THIS CATALOG</h3>' +
      '<div class="settings-row"><div class="info">' + dbInfo + "</div></div>" +
      '<p class="settings-note">All emote data (names, creators, prices, thumbnails and asset IDs) comes from the public Roblox Marketplace APIs. ' +
      "This is an unofficial fan catalog — items belong to their creators and to Roblox Corporation. Browse the emote category on " +
      '<a class="link" href="https://www.roblox.com/catalog?Category=12&Subcategory=39" target="_blank" rel="noopener noreferrer">roblox.com</a>.' +
      " Bundled thumbnail URLs are signed by Roblox and expire after ~180 days — run <code>scripts/update-db.mjs</code> or keep live mode on to refresh them.</p>" +
      "</div>";

    // wire up controls
    const themeCb = $("#setTheme");
    if (themeCb) themeCb.addEventListener("change", () => setTheme(themeCb.checked ? "dark" : "light"));
    const lockCb = $("#setLocked");
    if (lockCb) lockCb.addEventListener("change", () => setLocked(lockCb.checked));
    const officialCb = $("#setOfficial");
    if (officialCb) officialCb.addEventListener("change", () => { state.settings.includeOfficial = officialCb.checked; saveSettings(); renderCurrentView(); });
    for (const radio of els.settingsView.querySelectorAll('input[name="liveMode"]')) {
      radio.addEventListener("change", () => {
        state.settings.liveMode = radio.value;
        saveSettings();
        if (radio.value === "bundled") { liveLoader.stop(); setLiveStatus("bundled-only"); }
        else { liveLoader.start(); }
        renderSettings();
        renderCurrentView();
      });
    }
  }

  /* ─────────────────────────── add emote flow ─────────────────────────── */
  function setAddMsg(text, cls) {
    const el = $("#addMsg");
    if (!el) return;
    el.className = "form-msg show " + (cls || "");
    el.textContent = text;
  }

  async function addEmoteById(raw) {
    const idStr = String(raw || "").trim();
    const id = Number(idStr);
    if (!/^\d{1,20}$/.test(idStr) || !Number.isFinite(id)) {
      setAddMsg("Enter a numeric Roblox asset ID (digits only).", "err");
      return;
    }
    if (state.emotes.has(id)) {
      const known = state.emotes.get(id);
      setAddMsg("\u201C" + known.name + "\u201D is already in the catalog.", "ok");
      openModal(id);
      return;
    }
    setAddMsg("Verifying asset " + id + " on Roblox…", "");
    let d;
    try {
      d = await window.RobloxAPI.getAssetDetails(id);
    } catch {
      setAddMsg("Could not verify right now — the Roblox API is unreachable from this browser. Nothing was added (no unverified entries are created).", "err");
      return;
    }
    if (d.notFound) {
      setAddMsg("Roblox reports no asset with ID " + id + ". Nothing was added.", "err");
      return;
    }
    if (d.assetTypeId !== window.RobloxAPI.EMOTE_ASSET_TYPE) {
      setAddMsg("Asset " + id + " exists but it is not an emote animation (asset type " + d.assetTypeId + "). Only UGC emote assets (type 61) can be added.", "err");
      return;
    }
    const rec = {
      id,
      name: d.name,
      creator: d.creator,
      creatorType: d.creatorType,
      creatorId: d.creatorId,
      creatorVerified: false,
      official: d.official,
      price: d.price,
      free: d.price === 0,
      favorites: 0,
      created: d.created,
      description: d.description,
      thumb: null,
      origin: "user",
      addedAt: new Date().toISOString().slice(0, 10),
    };
    // real thumbnail, when the thumbnails service is reachable
    try {
      const map = await window.RobloxAPI.getThumbnails([id], 150);
      if (map[id]) {
        rec.thumb = map[id];
        thumbStore[id] = map[id];
        saveThumbStore();
      }
    } catch {
      /* thumbnail stays empty → shown honestly as unavailable */
    }
    state.userEmotes.push(rec);
    saveUserEmotes();
    upsertEmote(rec, "user");
    setAddMsg("Added \u201C" + rec.name + "\u201D by " + rec.creator + " — verified on Roblox just now.", "ok");
    renderSettings();
    if (state.tab !== "settings") renderCurrentView();
    toast("Emote added: " + rec.name, "success");
  }

  function removeUserEmote(id) {
    state.userEmotes = state.userEmotes.filter((u) => u.id !== id);
    saveUserEmotes();
    const e = state.emotes.get(id);
    if (e && e.origin === "user") state.emotes.delete(id);
    if (state.selectedId === id) state.selectedId = null;
    renderSettings();
    renderCurrentView({ soft: true });
    toast("Removed custom emote " + id);
  }

  /* ─────────────────────────── search ─────────────────────────── */
  let localDebounce = null;
  let liveDebounce = null;
  let liveSearchSeq = 0;

  function onSearchInput() {
    const q = els.searchInput.value;
    els.btnClearSearch.hidden = !q;
    state.query = q;
    state.page = 1;
    clearTimeout(localDebounce);
    localDebounce = setTimeout(() => renderCurrentView(), 130);

    // live search across ALL Roblox emotes (debounced, cached, rate-limited)
    clearTimeout(liveDebounce);
    const term = q.trim();
    if (term.length < 3 || state.settings.liveMode !== "auto") {
      els.searchSpinner.hidden = true;
      return;
    }
    els.searchSpinner.hidden = false;
    liveDebounce = setTimeout(() => runLiveSearch(term), 950);
  }

  async function runLiveSearch(term) {
    const seq = ++liveSearchSeq;
    try {
      const res = await window.RobloxAPI.searchEmotes({ keyword: term, limit: 30 });
      if (seq !== liveSearchSeq || state.query.trim() !== term || state.tab === "settings") return;
      const ids = [];
      for (const rec of res.items) {
        upsertEmote(rec, "live");
        ids.push(rec.id);
      }
      state.searchLive = { query: term, ids };
      fetchThumbsFor(ids, 150).then(() => renderCurrentView({ soft: true }));
      state.live.online = true;
      setLiveStatus("online");
      renderCurrentView({ soft: true });
    } catch {
      if (seq !== liveSearchSeq) return;
      state.searchLive = null;
      state.live.online = false;
      setLiveStatus("offline");
      renderCurrentView({ soft: true });
    } finally {
      if (seq === liveSearchSeq) els.searchSpinner.hidden = true;
    }
  }

  /* ─────────────────────────── theme / lock / drag ─────────────────────────── */
  function setTheme(theme) {
    state.settings.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    saveSettings();
    if (state.tab === "settings") renderSettings();
  }

  function setLocked(locked) {
    state.settings.locked = locked;
    els.btnLock.classList.toggle("on", locked);
    els.btnLock.setAttribute("aria-pressed", String(locked));
    els.btnLock.title = locked ? "Unlock interface position" : "Lock interface position";
    els.window.classList.toggle("draggable", !locked);
    saveSettings();
    if (state.tab === "settings") renderSettings();
  }

  function applyPos(pos) {
    if (!pos) {
      els.window.style.left = "";
      els.window.style.top = "";
      els.window.style.transform = "";
      return;
    }
    const w = els.window.offsetWidth || 1100;
    const h = els.window.offsetHeight || 780;
    const x = Math.min(Math.max(pos.x, 6), Math.max(6, window.innerWidth - w - 6));
    const y = Math.min(Math.max(pos.y, 6), Math.max(6, window.innerHeight - h - 6));
    els.window.style.transform = "none";
    els.window.style.left = x + "px";
    els.window.style.top = y + "px";
    state.settings.pos = { x, y };
  }

  function initDrag() {
    let dragging = null;
    els.header.addEventListener("pointerdown", (ev) => {
      if (state.settings.locked) return;
      if (ev.target.closest("button, input, a, .round-btn")) return;
      const rect = els.window.getBoundingClientRect();
      dragging = { dx: ev.clientX - rect.left, dy: ev.clientY - rect.top };
      els.header.setPointerCapture(ev.pointerId);
      document.body.classList.add("dragging");
      ev.preventDefault();
    });
    els.header.addEventListener("pointermove", (ev) => {
      if (!dragging) return;
      applyPos({ x: ev.clientX - dragging.dx, y: ev.clientY - dragging.dy });
    });
    const end = () => {
      if (!dragging) return;
      dragging = null;
      document.body.classList.remove("dragging");
      saveSettings();
    };
    els.header.addEventListener("pointerup", end);
    els.header.addEventListener("pointercancel", end);
    window.addEventListener("resize", () => applyPos(state.settings.pos));
  }

  /* ─────────────────────────── export / import / reset ─────────────────────────── */
  function exportData() {
    const payload = {
      app: "SAIKI EMOTES",
      version: 1,
      exportedAt: new Date().toISOString(),
      favorites: [...state.favorites],
      userEmotes: state.userEmotes,
      settings: state.settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "saiki-emotes-data.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast("Data exported", "success");
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!data || typeof data !== "object") throw new Error("bad file");
        if (Array.isArray(data.favorites)) {
          state.favorites = new Set(data.favorites.map(Number).filter(Number.isFinite));
          saveFavorites();
        }
        if (Array.isArray(data.userEmotes)) {
          state.userEmotes = data.userEmotes.filter((u) => u && Number.isFinite(Number(u.id)));
          saveUserEmotes();
          for (const u of state.userEmotes) upsertEmote(u, "user");
        }
        if (data.settings && typeof data.settings === "object") {
          state.settings = Object.assign(state.settings, data.settings);
          saveSettings();
          setTheme(state.settings.theme || "light");
          setLocked(!!state.settings.locked);
          applyPos(state.settings.pos);
        }
        renderCurrentView();
        toast("Data imported", "success");
      } catch {
        toast("Import failed — not a valid SAIKI EMOTES export file", "error");
      }
    };
    reader.readAsText(file);
  }

  function resetAll() {
    for (const key of Object.values(LS)) {
      try { localStorage.removeItem(key); } catch {}
    }
    location.reload();
  }

  /* ─────────────────────────── events ─────────────────────────── */
  function initEvents() {
    // tabs
    els.tabEmotes.addEventListener("click", () => switchTab("emotes"));
    els.tabFavorites.addEventListener("click", () => switchTab("favorites"));
    els.tabSettings.addEventListener("click", () => switchTab("settings"));
    els.btnCopyId.addEventListener("click", copySelected);

    // search
    els.searchInput.addEventListener("input", onSearchInput);
    els.searchInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        const term = els.searchInput.value.trim();
        if (term.length >= 3 && state.settings.liveMode === "auto") {
          clearTimeout(liveDebounce);
          runLiveSearch(term);
        }
      }
    });
    els.btnClearSearch.addEventListener("click", () => {
      els.searchInput.value = "";
      state.query = "";
      state.searchLive = null;
      els.btnClearSearch.hidden = true;
      state.page = 1;
      renderCurrentView();
      els.searchInput.focus();
    });
    els.sourceChip.addEventListener("click", () => switchTab("settings"));

    // pagination
    els.btnPrevPage.addEventListener("click", () => setPage(state.page - 1));
    els.btnNextPage.addEventListener("click", () => setPage(state.page + 1));
    els.pageNumbers.addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-page]");
      if (btn) setPage(Number(btn.dataset.page));
    });

    // grid (delegated)
    // images that fail to load (expired signed URL, removed asset…) fall
    // back to the "thumbnail unavailable" placeholder — data stays honest
    els.grid.addEventListener(
      "error",
      (ev) => {
        const img = ev.target;
        if (img && img.tagName === "IMG") img.classList.add("failed");
      },
      true
    );
    els.grid.addEventListener("click", (ev) => {
      const star = ev.target.closest(".star-btn");
      const card = ev.target.closest(".card");
      if (star && card) {
        toggleFavorite(Number(card.dataset.id));
        return;
      }
      if (card) openModal(Number(card.dataset.id));
    });
    els.grid.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        const card = ev.target.closest(".card");
        if (card) {
          ev.preventDefault();
          openModal(Number(card.dataset.id));
        }
      }
    });
    els.emptyState.addEventListener("click", (ev) => {
      if (ev.target.closest('[data-action="clear-search"]')) els.btnClearSearch.click();
    });

    // modal
    els.modalClose.addEventListener("click", closeModal);
    els.modalOverlay.addEventListener("click", (ev) => {
      if (ev.target === els.modalOverlay) closeModal();
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && !els.modalOverlay.hidden) closeModal();
    });
    els.modalFav.addEventListener("click", () => {
      if (modalOpenId != null) toggleFavorite(modalOpenId, true);
    });
    els.modalCopyId.addEventListener("click", copySelected);
    els.modalCopyId2.addEventListener("click", copySelected);
    els.modalCopyLua.addEventListener("click", async () => {
      const e = state.emotes.get(modalOpenId);
      if (!e) return;
      const ok = await copyText(luauSnippet(e));
      toast(ok ? "Luau usage copied to clipboard" : "Copy failed", ok ? "success" : "error");
    });
    els.modalStatus.addEventListener("click", (ev) => {
      if (ev.target.closest('[data-action="verify"]')) verifyModalEmote();
    });

    // header buttons
    els.btnTheme.addEventListener("click", () =>
      setTheme(state.settings.theme === "light" ? "dark" : "light")
    );
    els.btnLock.addEventListener("click", () => setLocked(!state.settings.locked));

    // settings (delegated)
    els.settingsView.addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-action]");
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === "refresh-live") {
        liveLoader.stop();
        liveLoader.start();
        toast("Refreshing from the Roblox catalog…");
        renderSettings();
      } else if (action === "add-emote") {
        addEmoteById((document.getElementById("addEmoteId") || {}).value);
      } else if (action === "remove-user") {
        removeUserEmote(Number(btn.dataset.id));
      } else if (action === "reset-pos") {
        state.settings.pos = null;
        saveSettings();
        applyPos(null);
        toast("Window re-centered");
      } else if (action === "export") {
        exportData();
      } else if (action === "import") {
        els.importFile.click();
      } else if (action === "reset") {
        if (confirm("Reset all SAIKI EMOTES data (favorites, added emotes, settings)?")) resetAll();
      }
    });
    els.settingsView.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && ev.target && ev.target.id === "addEmoteId") {
        addEmoteById(ev.target.value);
      }
    });
    els.importFile.addEventListener("change", () => {
      if (els.importFile.files && els.importFile.files[0]) importData(els.importFile.files[0]);
      els.importFile.value = "";
    });
  }

  function switchTab(tab) {
    state.tab = tab;
    els.tabEmotes.classList.toggle("active", tab === "emotes");
    els.tabFavorites.classList.toggle("active", tab === "favorites");
    els.tabSettings.classList.toggle("active", tab === "settings");
    state.page = 1;
    renderCurrentView();
  }

  function setPage(p) {
    const list = visibleEmotes();
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    state.page = Math.min(Math.max(1, p), pages);
    renderCurrentView();
  }

  function toggleFavorite(id, fromModal) {
    if (state.favorites.has(id)) {
      state.favorites.delete(id);
      toast("Removed from favorites");
    } else {
      state.favorites.add(id);
      const e = state.emotes.get(id);
      toast("★ Added to favorites" + (e ? " — " + e.name : ""), "success");
    }
    saveFavorites();
    // update UI in place
    const card = els.grid.querySelector('.card[data-id="' + id + '"]');
    if (card) {
      const star = card.querySelector(".star-btn");
      const on = state.favorites.has(id);
      star.classList.toggle("on", on);
      star.title = on ? "Remove from favorites" : "Add to favorites";
    }
    els.favCount.textContent = state.favorites.size;
    if (modalOpenId === id) {
      els.modalFav.classList.toggle("on", state.favorites.has(id));
    }
    if (state.tab === "favorites") renderCurrentView({ soft: true });
  }

  async function copySelected() {
    const id = state.selectedId != null ? state.selectedId : modalOpenId;
    if (id == null) {
      toast("No emote selected — click a card first", "error");
      return;
    }
    const e = state.emotes.get(id);
    const ok = await copyText(String(id));
    toast(
      ok ? "Copied asset ID " + id + (e ? " — " + e.name : "") : "Copy failed",
      ok ? "success" : "error"
    );
  }

  /* ─────────────────────────── boot ─────────────────────────── */
  function init() {
    // restore persisted state
    const savedSettings = lsGetJSON(LS.settings, null);
    if (savedSettings) state.settings = Object.assign(state.settings, savedSettings);
    state.favorites = new Set(lsGetJSON(LS.favorites, []).map(Number).filter(Number.isFinite));

    setTheme(state.settings.theme || "light");
    setLocked(!!state.settings.locked);
    if (state.settings.pos) applyPos(state.settings.pos);

    // data
    loadBundled();
    loadUserEmotes();
    initEvents();
    renderCurrentView();
    refreshSelectionUI();

    if (state.settings.liveMode === "auto") {
      liveLoader.start();
    } else {
      setLiveStatus("bundled-only");
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
