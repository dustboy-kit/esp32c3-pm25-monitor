import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// Every page: daisyUI "corporate" theme, Tailwind + daisyUI + Lucide from CDN,
// the shared ui-preferences.js (Laris footer + build stamp), no old theme toggle.
const pages = [
  ["site/index.html", "./ui-preferences.js", true],
  ["site/teacher/index.html", "../ui-preferences.js", false],
  ["site/dashboard/index.html", "../ui-preferences.js", true],
  ["site/wifi/index.html", "../ui-preferences.js", true],
  ["site/wifi/recovery/index.html", "../../ui-preferences.js", true],
  ["site/ble/index.html", "../ui-preferences.js", false],
  ["site/tools/esphome-canvas-simulator.html", "../ui-preferences.js", true],
  ["site/sitemap/index.html", "../ui-preferences.js", false],
];

for (const [path, scriptSrc, hasLangSwitch] of pages) {
  const source = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
  assert.match(source, /<html lang="th" data-theme="corporate">/, `${path} must default to Thai and daisyUI corporate`);
  assert.match(source, /daisyui@/, `${path} loads daisyUI`);
  assert.doesNotMatch(source, /cdn\.tailwindcss\.com/, `${path} must not load the Tailwind runtime (it stalls page load)`);
  assert.match(source, /lucide\.min\.js/, `${path} loads Lucide`);
  assert.match(source, new RegExp(`src=["']${scriptSrc.replaceAll(".", "\\.")}(\\?v=\\d+)?["']`), `${path} shared script`);
  assert.doesNotMatch(source, /theme\.css|data-theme-toggle|preference-bar/, `${path} has no old theme toggle`);
  assert.doesNotMatch(source, /font-style:\s*italic|font:\s*italic/, `${path} has no italics`);
  assert.doesNotMatch(source, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, `${path} has no emoji`);
  assert.match(source, /<title>[^<]*DustBoy Kit · Kit4Kids<\/title>/, `${path} title`);
  if (hasLangSwitch) {
    assert.equal((source.match(/data-lang="th"/g) || []).length, 1, `${path} Thai toggle`);
    assert.equal((source.match(/data-lang="en"/g) || []).length, 1, `${path} English toggle`);
  }
}

const shared = await readFile(new URL("../site/ui-preferences.js", import.meta.url), "utf8");
assert.match(shared, /laris-footer/);
assert.match(shared, /2026 Laris Labs Limited/);
assert.match(shared, /version\.json/);
assert.doesNotMatch(shared, /dbk-theme|starry/);

console.log(`site: ${pages.length} pages on daisyUI corporate + Lucide with the shared Laris footer`);
