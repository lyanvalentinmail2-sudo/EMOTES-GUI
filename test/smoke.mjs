#!/usr/bin/env node
/**
 * SAIKI EMOTES — headless smoke test.
 * Boots js/app.js against a minimal DOM stub (no browser, no network) and
 * exercises the main code paths: render, pagination, search, favorites,
 * modal, copy-to-clipboard, settings rendering and offline fallback.
 *
 * Usage: node test/smoke.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/* ── minimal DOM stubs ─────────────────────────────────────────── */
const handlers = new Map(); // "sel:event" → [fn]
const elements = new Map();

function makeEl(id) {
  const el = {
    id,
    children: [],
    style: {},
    dataset: {},
    attrs: {},
    _classes: new Set(),
    classList: {
      add: (...c) => c.forEach((x) => el._classes.add(x)),
      remove: (...c) => c.forEach((x) => el._classes.delete(x)),
      toggle: (c, f) => {
        const on = f === undefined ? !el._classes.has(c) : !!f;
        if (on) el._classes.add(c);
        else el._classes.delete(c);
        return on;
      },
      contains: (c) => el._classes.has(c),
    },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return this.attrs[k]; },
    removeAttribute(k) { delete this.attrs[k]; },
    addEventListener(type, fn) {
      const key = id + ":" + type;
      if (!handlers.has(key)) handlers.set(key, []);
      handlers.get(key).push(fn);
    },
    setPointerCapture() {},
    querySelector: () => null,
    querySelectorAll: () => [],
    appendChild(child) { this.children.push(child); },
    focus() {},
    click() {},
    remove() {
      const i = el.parent && el.parent.children ? el.parent.children.indexOf(el) : -1;
      if (i >= 0) el.parent.children.splice(i, 1);
    },
    closest() { return null; },
    parentElement: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } },
    scrollTop: 0,
    offsetWidth: 1100,
    offsetHeight: 880,
    files: [],
  };
  Object.defineProperty(el, "firstChild", { get: () => el.children[0] });
  let _hidden = false, _innerHTML = "", _textContent = "", _value = "", _title = "", _href = "", _src = "";
  Object.defineProperty(el, "hidden", { get: () => _hidden, set: (v) => { _hidden = !!v; } });
  Object.defineProperty(el, "innerHTML", { get: () => _innerHTML, set: (v) => { _innerHTML = String(v); } });
  Object.defineProperty(el, "textContent", { get: () => _textContent, set: (v) => { _textContent = String(v); } });
  Object.defineProperty(el, "value", { get: () => _value, set: (v) => { _value = String(v); } });
  Object.defineProperty(el, "title", { get: () => _title, set: (v) => { _title = String(v); } });
  Object.defineProperty(el, "href", { get: () => _href, set: (v) => { _href = String(v); } });
  Object.defineProperty(el, "src", { get: () => _src, set: (v) => { _src = String(v); } });
  return el;
}

function getEl(sel) {
  const id = sel.replace(/^#/, "");
  if (!elements.has(id)) elements.set(id, makeEl(id));
  return elements.get(id);
}

const storage = () => {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
};

const listeners = { domcontentloaded: [] };
globalThis.document = {
  querySelector: (sel) => getEl(sel),
  createElement: () => makeEl("dyn-" + Math.random().toString(36).slice(2)),
  addEventListener: (t, fn) => { listeners[t.toLowerCase()] = listeners[t.toLowerCase()] || []; listeners[t.toLowerCase()].push(fn); },
  documentElement: makeEl("html"),
  body: makeEl("body"),
};
globalThis.window = {
  isSecureContext: true,
  innerWidth: 1400,
  innerHeight: 900,
  sessionStorage: storage(),
  SAIKI_EMOTES_DB: null,
  RobloxAPI: null,
};
globalThis.localStorage = storage();
globalThis.location = { reload() {} };
globalThis.confirm = () => true;
globalThis.fetch = () => Promise.reject(new Error("offline (smoke test)"));

/* ── load the three scripts in order (like index.html does) ────── */
(0, eval)(readFileSync(join(root, "data", "emotes.js"), "utf8"));
(0, eval)(readFileSync(join(root, "js", "roblox-api.js"), "utf8"));
(0, eval)(readFileSync(join(root, "js", "app.js"), "utf8"));

/* ── assertions ────────────────────────────────────────────────── */
let failed = 0;
function check(name, cond) {
  console.log((cond ? "  ✔ " : "  ✘ ") + name);
  if (!cond) failed++;
}

console.log("booting app…");
for (const fn of listeners.domcontentloaded) fn();

const grid = getEl("grid");
const pageInfo = getEl("pageInfo");
const sourceLabel = getEl("sourceLabel");
const toastHost = getEl("toastHost");
const btnCopyId = getEl("btnCopyId");
const modalAssetId = getEl("modalAssetId");
const modalName = getEl("modalName");
const modalOverlay = getEl("modalOverlay");

const cardCount = () => (grid.innerHTML.match(/<article class="card/g) || []).length;

check("bundled DB loaded (149 emotes)", window.SAIKI_EMOTES_DB.emotes.length === 149);
check("grid rendered 15 cards (5×3 page)", cardCount() === 15);
check("page info correct", /Page 1 of 10 · 149 emotes/.test(pageInfo.textContent));
check("favorite count shown", getEl("favCount").textContent === "0");

/* offline fallback: the live fetch was stubbed to fail */
await new Promise((r) => setTimeout(r, 50));
check("offline fallback status", /OFFLINE/.test(sourceLabel.textContent));

/* search (local, instant) */
const fire = (el, type, ev) => (handlers.get(el.id + ":" + type) || []).forEach((fn) => fn(ev));
fire(getEl("searchInput"), "input", { target: { value: "rat dance" } });
await new Promise((r) => setTimeout(r, 200)); // debounce
check("search filters locally (Rat Dance)", grid.innerHTML.includes("Rat Dance"));
check("search narrows page info", /1 emote\b|Page 1 of 1/.test(pageInfo.textContent));

fire(getEl("btnClearSearch"), "click", {});
check("clear search restores 15 cards", cardCount() === 15);

/* favorites via simulated card click */
const starClick = (id) =>
  fire(grid, "click", {
    target: { closest: (sel) => (sel === ".star-btn" ? { x: 1 } : sel === ".card" ? { dataset: { id: String(id) } } : null) },
  });
starClick(98603994713783); // Rat Dance
check("favorite added → count 1", getEl("favCount").textContent === "1");
check("favorite persisted to localStorage", (globalThis.localStorage.getItem("saiki:favorites") || "").includes("98603994713783"));

/* open modal via card click */
fire(grid, "click", {
  target: { closest: (sel) => (sel === ".star-btn" ? null : sel === ".card" ? { dataset: { id: "98603994713783" } } : null) },
});
await new Promise((r) => setTimeout(r, 30));
check("modal opens", modalOverlay.hidden === false);
check("modal shows real asset id", modalAssetId.textContent === "98603994713783");
check("modal shows real name", modalName.textContent === "Rat Dance");
check("roblox link uses real id", getEl("modalRobloxLink").href === "https://www.roblox.com/catalog/98603994713783/");

/* copy button with selection */
const copied = { text: null };
Object.defineProperty(globalThis, "navigator", {
  value: { clipboard: { writeText: async (t) => { copied.text = t; } } },
  configurable: true,
});
fire(btnCopyId, "click", {});
await new Promise((r) => setTimeout(r, 10));
check("COPY copies the real asset ID", copied.text === "98603994713783");

/* settings view renders */
fire(getEl("tabSettings"), "click", {});
await new Promise((r) => setTimeout(r, 10));
check("settings view renders", /ADD UGC EMOTE BY ASSET ID/.test(getEl("settingsView").innerHTML));
check("bundled DB info shown in settings", /149/.test(getEl("settingsView").innerHTML));

/* favorites tab */
fire(getEl("tabFavorites"), "click", {});
await new Promise((r) => setTimeout(r, 10));
check("favorites tab shows only favorites", cardCount() === 1 && grid.innerHTML.includes("Rat Dance"));

console.log(failed ? "\nFAILED: " + failed + " check(s)" : "\nAll smoke checks passed ✔");
process.exit(failed ? 1 : 0);
