#!/usr/bin/env node
/**
 * SAIKI EMOTES — live database updater.
 * ────────────────────────────────────
 * Re-fetches the most favorited UGC emotes from the public Roblox catalog
 * API (server-side, so no CORS concerns) and rebuilds:
 *   • raw/page<N>.json  — trimmed catalog snapshots
 *   • raw/thumbs.json   — signed thumbnail URLs (fresh 180-day signatures)
 *   • data/emotes.js    — the bundled database used by the GUI
 *
 * Usage:
 *   node scripts/update-db.mjs            # default: 5 pages (150 emotes)
 *   PAGES=10 node scripts/update-db.mjs   # more pages = more emotes
 *
 * Requires Node 18+ (global fetch). No API keys — these are public,
 * unauthenticated Roblox endpoints.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const PAGES = Math.max(1, Math.min(20, Number(process.env.PAGES || 5)));
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rawDir = join(root, "raw");
mkdirSync(rawDir, { recursive: true });

const CATALOG_URL = (cursor) => {
  const params = new URLSearchParams({
    Category: "12", // Avatar animations
    Subcategory: "39", // Emote animations (UGC emotes live here, asset type 61)
    Limit: "30",
    SortType: "MostFavorited",
    MinPrice: "1", // Roblox's own catalog emotes are free → this keeps results UGC-only
  });
  if (cursor) params.set("cursor", cursor);
  return "https://catalog.roblox.com/v1/search/items/details?" + params.toString();
};

const THUMBS_URL = (ids) =>
  "https://thumbnails.roblox.com/v1/assets?assetIds=" + ids.join(",") + "&size=150x150&format=Png";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("HTTP " + res.status + " for " + url.slice(0, 90) + "…");
  return res.json();
}

function trimItem(it) {
  return {
    id: it.id,
    name: it.name,
    cr: {
      n: it.creatorName,
      t: it.creatorType === "Group" ? "G" : "U",
      id: it.creatorTargetId,
      v: it.creatorHasVerifiedBadge ? 1 : 0,
    },
    p: it.price ?? null,
    f: it.favoriteCount || 0,
    c: (it.itemCreatedUtc || "").slice(0, 10),
    d: String(it.description || "")
      .replace(/\s*\n\s*/g, " ")
      .trim()
      .slice(0, 220),
  };
}

console.log("SAIKI EMOTES — updating bundled database from the Roblox catalog…");

// 1) walk catalog pages (most favorited paid emotes → UGC only)
let cursor = null;
const allItems = [];
for (let page = 1; page <= PAGES; page++) {
  process.stdout.write("  fetching catalog page " + page + "/" + PAGES + "… ");
  const json = await getJSON(CATALOG_URL(cursor));
  const items = (json.data || [])
    .filter((it) => it.itemType === "Asset" && it.assetType === 61)
    .map(trimItem);
  allItems.push(...items);
  writeFileSync(join(rawDir, "page" + page + ".json"), JSON.stringify(items, null, 1), "utf8");
  console.log(items.length + " emotes");
  cursor = json.nextPageCursor;
  if (!cursor) break;
  await sleep(1200); // be polite
}

if (!allItems.length) throw new Error("No items returned — aborting (keeping existing database).");

// 2) fetch signed thumbnail URLs in batches of 50
const thumbs = {};
const ids = allItems.map((it) => it.id);
for (let i = 0; i < ids.length; i += 50) {
  const batch = ids.slice(i, i + 50);
  process.stdout.write("  fetching thumbnails " + (i + 1) + "–" + Math.min(i + 50, ids.length) + "… ");
  const json = await getJSON(THUMBS_URL(batch));
  let n = 0;
  for (const rec of json.data || []) {
    if (rec.state === "Completed" && rec.imageUrl) {
      // keep only the signature hash — the URL is reconstructed deterministically
      const m = String(rec.imageUrl).match(/180DAY-([0-9a-f]{32})\//);
      if (m) {
        thumbs[rec.targetId] = m[1];
        n++;
      }
    }
  }
  console.log(n + " ok");
  await sleep(600);
}
writeFileSync(join(rawDir, "thumbs.json"), JSON.stringify(thumbs, null, 1), "utf8");

// 3) assemble data/emotes.js from the fresh snapshots
const build = spawnSync(process.execPath, [join(root, "scripts", "build-db.mjs")], {
  stdio: "inherit",
});
if (build.status !== 0) process.exit(build.status || 1);

console.log("Done. Commit the updated raw/ snapshots and data/emotes.js.");
