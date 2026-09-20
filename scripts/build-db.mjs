#!/usr/bin/env node
/**
 * SAIKI EMOTES — offline DB assembler.
 * Assembles data/emotes.js from the raw snapshots in raw/ (no network needed).
 *
 * Usage: node scripts/build-db.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rawDir = join(root, "raw");
const outFile = join(root, "data", "emotes.js");

const THUMB_URL = (hash, size = 150) =>
  `https://tr.rbxcdn.com/180DAY-${hash}/${size}/${size}/EmoteAnimation/Png/noFilter`;

// --- load raw pages -------------------------------------------------------
const pages = readdirSync(rawDir)
  .filter((f) => /^page\d+\.json$/.test(f))
  .sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]));

if (pages.length === 0) {
  console.error("No raw/page*.json snapshots found. Run scripts/update-db.mjs first.");
  process.exit(1);
}

const thumbs = JSON.parse(readFileSync(join(rawDir, "thumbs.json"), "utf8"));

const seen = new Set();
const emotes = [];
let skippedOfficial = 0;
let skippedNoThumb = 0;

for (const page of pages) {
  const items = JSON.parse(readFileSync(join(rawDir, page), "utf8"));
  for (const it of items) {
    if (seen.has(it.id)) continue;

    // Exclude items published by the official Roblox account (not UGC).
    if (it.cr && it.cr.t === "U" && it.cr.id === 1) {
      skippedOfficial++;
      continue;
    }
    // Every bundled emote must have a verified thumbnail URL.
    const hash = thumbs[String(it.id)];
    if (!hash) {
      skippedNoThumb++;
      continue;
    }
    seen.add(it.id);
    emotes.push({
      id: it.id,
      name: String(it.name).trim(),
      creator: it.cr.n,
      creatorType: it.cr.t === "G" ? "Group" : "User",
      creatorId: it.cr.id,
      creatorVerified: !!it.cr.v,
      price: it.p ?? null,
      favorites: it.f ?? 0,
      created: (it.c || "").slice(0, 10),
      description: it.d || "",
      thumb: THUMB_URL(hash),
    });
  }
}

// Most favorited first — matches the Roblox catalog sort used to collect them.
emotes.sort((a, b) => b.favorites - a.favorites);

const generated = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
const banner = `window.SAIKI_EMOTES_DB = ${JSON.stringify(
  {
    meta: {
      title: "SAIKI EMOTES — Roblox UGC Emote Catalog",
      source:
        "Roblox Marketplace / Avatar Shop — catalog.roblox.com/v1/search/items/details (Category=12, Subcategory=39 Emote Animations, MinPrice=1, SortType=MostFavorited)",
      thumbnailSource:
        "thumbnails.roblox.com/v1/assets — signed CDN URLs (valid ~180 days from fetch date)",
      filter: "UGC emotes only — items published by the official Roblox account are excluded",
      generated,
      count: emotes.length,
      pages: pages.length,
      license:
        "Item names, creators, prices and thumbnails belong to their creators and Roblox Corporation. This file is an index of public catalog data for identification purposes.",
    },
    emotes,
  },
  null,
  1
)};`;

writeFileSync(outFile, banner + "\n", "utf8");

const kb = (statSync(outFile).size / 1024).toFixed(1);
console.log(
  `✔ data/emotes.js written — ${emotes.length} UGC emotes from ${pages.length} catalog pages (${kb} KB)` +
    (skippedOfficial ? `, ${skippedOfficial} official Roblox item(s) excluded` : "") +
    (skippedNoThumb ? `, ${skippedNoThumb} item(s) skipped (no thumbnail)` : "")
);
