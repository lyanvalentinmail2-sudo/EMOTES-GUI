/* ═══════════════════════════════════════════════════════════════════════
   SAIKI EMOTES — Roblox API client
   ─────────────────────────────────────────────────────────────────────
   Roblox's own endpoints (catalog.roblox.com, thumbnails.roblox.com,
   economy.roblox.com) do NOT send CORS headers, so a browser on another
   origin cannot read them directly. This client therefore talks to
   roproxy.com — a long-standing community mirror of the public Roblox
   web APIs that adds `Access-Control-Allow-Origin: *`.

   Endpoints used (all public, no authentication):
     • catalog.roblox.com/v1/search/items/details  — Marketplace search
       (Category=12 + Subcategory=39 == "Emotes" / Emote Animation, asset type 61)
     • thumbnails.roblox.com/v1/assets             — signed CDN thumbnail URLs
     • economy.roblox.com/v2/assets/{id}/details   — per-asset verification

   Every request is throttled per host (the catalog mirror allows ~12
   requests/min) and cached with a TTL. All failures resolve honestly:
   nothing is ever invented — callers receive errors/nulls they can show.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const HOSTS = {
    catalog: { base: "https://catalog.roproxy.com", minIntervalMs: 5600, queue: [] },
    thumbnails: { base: "https://thumbnails.roproxy.com", minIntervalMs: 420, queue: [] },
    economy: { base: "https://economy.roproxy.com", minIntervalMs: 350, queue: [] },
  };
  for (const h of Object.values(HOSTS)) h.lastSent = 0;

  const CACHE_PREFIX = "saiki:apicache:";
  const cache = (() => {
    try {
      // sessionStorage survives reloads in the tab but not forever → good for API replies
      return window.sessionStorage;
    } catch {
      const mem = new Map();
      return {
        getItem: (k) => (mem.has(k) ? mem.get(k) : null),
        setItem: (k, v) => mem.set(k, v),
        removeItem: (k) => mem.delete(k),
      };
    }
  })();

  const listeners = [];
  let lastStatus = { online: null, host: null, error: null };
  function reportStatus(partial) {
    lastStatus = Object.assign({}, lastStatus, partial);
    for (const fn of listeners) {
      try { fn(lastStatus); } catch (e) { /* listener errors are not ours */ }
    }
  }

  function cacheGet(key, ttlMs) {
    try {
      const raw = cache.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const { t, v } = JSON.parse(raw);
      if (Date.now() - t > ttlMs) return null;
      return v;
    } catch {
      return null;
    }
  }
  function cacheSet(key, value) {
    try {
      cache.setItem(CACHE_PREFIX + key, JSON.stringify({ t: Date.now(), v: value }));
    } catch {
      /* storage full / disabled — caching is best-effort */
    }
  }

  /* ── Per-host serial queue with minimum spacing (rate-limit friendly) ── */
  function enqueue(host, task) {
    return new Promise((resolve, reject) => {
      host.queue.push({ task, resolve, reject });
      if (host.queue.length === 1) drain(host);
    });
  }
  async function drain(host) {
    while (host.queue.length) {
      const wait = host.lastSent + host.minIntervalMs - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      const { task, resolve, reject } = host.queue.shift();
      host.lastSent = Date.now();
      try {
        resolve(await task());
      } catch (err) {
        reject(err);
      }
    }
  }

  async function fetchJSON(url, timeoutMs) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs || 12000);
    let res;
    try {
      res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) {
      const err = new Error("HTTP " + res.status);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  /* ── Normalization of catalog detail items → compact emote records ── */
  function normalizeCatalogItem(it) {
    return {
      id: it.id,
      name: String(it.name || "").trim(),
      creator: it.creatorName || "Unknown creator",
      creatorType: it.creatorType || "",
      creatorId: it.creatorTargetId ?? null,
      creatorVerified: !!it.creatorHasVerifiedBadge,
      // The official Roblox account (User id 1) publishes Roblox-made emotes,
      // which are NOT UGC — flagged so the UI can filter/tag them.
      official: it.creatorType === "User" && (it.creatorTargetId === 1 || it.creatorName === "Roblox"),
      price: typeof it.price === "number" ? it.price : null,
      free: it.priceStatus === "Free" || it.price === 0,
      favorites: it.favoriteCount || 0,
      created: String(it.itemCreatedUtc || "").slice(0, 10),
      description: String(it.description || "").trim().slice(0, 600),
    };
  }

  /* ═════════════ Public API ═════════════ */

  const RobloxAPI = {
    EMOTE_ASSET_TYPE: 61,
    onStatus(fn) { listeners.push(fn); },
    get status() { return lastStatus; },

    /**
     * Search the Roblox Marketplace emote category.
     * @param {object} opts
     *   keyword   – free text search across all Roblox emotes
     *   cursor    – pagination cursor from a previous call
     *   minPrice  – 1 excludes free items (Roblox's own catalog emotes are
     *               free, so this effectively yields UGC-only listings)
     *   sort      – e.g. "MostFavorited"
     *   limit     – page size (≤ 30)
     * @returns {Promise<{items:Array, nextCursor:string|null}>}
     */
    searchEmotes(opts) {
      const o = Object.assign({ keyword: "", cursor: "", minPrice: 0, sort: "", limit: 30 }, opts);
      const params = new URLSearchParams({
        Category: "12",
        Subcategory: "39",
        Limit: String(Math.min(o.limit, 30)),
      });
      if (o.keyword) params.set("Keyword", o.keyword);
      if (o.cursor) params.set("cursor", o.cursor);
      if (o.minPrice > 0) params.set("MinPrice", String(o.minPrice));
      if (o.sort) params.set("SortType", o.sort);

      const url = HOSTS.catalog.base + "/v1/search/items/details?" + params.toString();
      const key = "cat:" + url;
      const cached = cacheGet(key, 10 * 60 * 1000);
      if (cached) return Promise.resolve(cached);

      return enqueue(HOSTS.catalog, async () => {
        try {
          const json = await fetchJSON(url);
          const items = (json.data || [])
            .filter((it) => it.itemType === "Asset" && it.assetType === RobloxAPI.EMOTE_ASSET_TYPE)
            .map(normalizeCatalogItem);
          const out = { items, nextCursor: json.nextPageCursor || null };
          cacheSet(key, out);
          reportStatus({ online: true, host: "catalog", error: null });
          return out;
        } catch (err) {
          reportStatus({ online: false, host: "catalog", error: String(err.message || err) });
          throw err;
        }
      });
    },

    /**
     * Fetch signed CDN thumbnail URLs for asset ids (batched ≤ 100 per call).
     * @returns {Promise<Object.<number,string>>} map id → imageUrl
     */
    getThumbnails(ids, size) {
      const wanted = [...new Set(ids.map(Number))].filter((n) => Number.isFinite(n));
      const out = {};
      const missing = [];
      for (const id of wanted) {
        const c = cacheGet("thumb:" + id + ":" + size, 12 * 60 * 60 * 1000);
        if (c) out[id] = c;
        else missing.push(id);
      }
      if (!missing.length) return Promise.resolve(out);

      const batches = [];
      for (let i = 0; i < missing.length; i += 100) batches.push(missing.slice(i, i + 100));

      return enqueue(HOSTS.thumbnails, async () => {
        try {
          for (const batch of batches) {
            const url =
              HOSTS.thumbnails.base +
              "/v1/assets?assetIds=" + batch.join(",") +
              "&size=" + size + "x" + size + "&format=Png";
            const json = await fetchJSON(url, 15000);
            for (const rec of json.data || []) {
              if (rec.state === "Completed" && rec.imageUrl) {
                out[rec.targetId] = rec.imageUrl;
                cacheSet("thumb:" + rec.targetId + ":" + size, rec.imageUrl);
              }
            }
          }
          reportStatus({ online: true, host: "thumbnails", error: null });
          return out;
        } catch (err) {
          reportStatus({ online: false, host: "thumbnails", error: String(err.message || err) });
          throw err;
        }
      });
    },

    /**
     * Verify a single asset id against Roblox (used by "Add emote" and by the
     * modal's live check). Rejects with {notFound:true} for 404s.
     * @returns {Promise<object>} normalized asset details
     */
    getAssetDetails(id) {
      const key = "eco:" + id;
      const cached = cacheGet(key, 10 * 60 * 1000);
      if (cached) return Promise.resolve(cached);

      const url = HOSTS.economy.base + "/v2/assets/" + encodeURIComponent(id) + "/details";
      return enqueue(HOSTS.economy, async () => {
        let json;
        try {
          json = await fetchJSON(url);
        } catch (err) {
          if (err.status === 404) {
            const notFound = { notFound: true, id };
            cacheSet(key, notFound);
            return notFound;
          }
          reportStatus({ online: false, host: "economy", error: String(err.message || err) });
          throw err;
        }
        reportStatus({ online: true, host: "economy", error: null });
        const details = {
          id: json.AssetId != null ? json.AssetId : id,
          name: String(json.Name || "").trim(),
          assetTypeId: json.AssetTypeId,
          creator: (json.Creator && json.Creator.Name) || "Unknown creator",
          creatorType: (json.Creator && json.Creator.CreatorType) || "",
          creatorId: json.Creator ? json.Creator.CreatorTargetId ?? json.Creator.Id ?? null : null,
          official: !!(json.Creator && (json.Creator.CreatorTargetId === 1 || json.Creator.Name === "Roblox")),
          price: typeof json.PriceInRobux === "number" ? json.PriceInRobux : null,
          forSale: !!json.IsForSale,
          productType: json.ProductType || "",
          created: String(json.Created || "").slice(0, 10),
          updated: String(json.Updated || "").slice(0, 10),
          description: String(json.Description || "").trim().slice(0, 600),
        };
        cacheSet(key, details);
        return details;
      });
    },
  };

  window.RobloxAPI = RobloxAPI;
})();
