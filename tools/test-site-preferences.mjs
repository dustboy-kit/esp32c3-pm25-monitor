import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pages = [
  ["site/index.html", "./theme.css", "./ui-preferences.js"],
  ["site/dashboard/index.html", "../theme.css", "../ui-preferences.js"],
  ["site/wifi/index.html", "../theme.css", "../ui-preferences.js"],
  ["site/wifi/recovery/index.html", "../../theme.css", "../../ui-preferences.js"],
  ["site/tools/esphome-canvas-simulator.html", "../theme.css", "../ui-preferences.js"],
];

for (const [path, themeHref, scriptSrc] of pages) {
  const source = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
  assert.match(source, /<html lang="th" data-theme="minimal">/, `${path} must default to Thai and minimal`);
  assert.match(source, new RegExp(`href=["']${themeHref.replaceAll(".", "\\.")}["']`), `${path} theme stylesheet`);
  assert.match(source, new RegExp(`src=["']${scriptSrc.replaceAll(".", "\\.")}["']`), `${path} preference script`);
  assert.equal((source.match(/data-theme-toggle/g) || []).length, 1, `${path} theme toggle`);
  assert.equal((source.match(/data-lang="th"/g) || []).length, 1, `${path} Thai toggle`);
  assert.equal((source.match(/data-lang="en"/g) || []).length, 1, `${path} English toggle`);
}

const preferences = await readFile(new URL("../site/ui-preferences.js", import.meta.url), "utf8");
assert.match(preferences, /new Set\(\["minimal", "starry"\]\)/);
assert.match(preferences, /: "minimal";/);
assert.match(preferences, /localStorage\.setItem\("dbk-theme", theme\)/);
assert.match(preferences, /root\.lang === "en" \? "en" : "th"/);

console.log(`site preferences: ${pages.length} pages default to Thai with shared minimal/starry theme controls`);
