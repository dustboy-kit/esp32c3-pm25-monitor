// DustBoy Kit top navbar, shared by both sites:
//   https://dustboy-kit.github.io/esp32c3-pm25-monitor/  (dustboy-kit/esp32c3-pm25-monitor site/kit-nav.js)
//   https://dustboy-kit.github.io/case-library/          (dustboy-kit/case-library gallery/kit-nav.js)
// Keep the two copies identical. No dependencies; it inserts itself as the first element of <body>.
// Labels follow <html lang>: Thai for "th", English otherwise. The current page is highlighted.
(function () {
  if (document.getElementById("dbk-kit-nav")) return;
  var B = "https://dustboy-kit.github.io/";
  var FW = B + "esp32c3-pm25-monitor/";
  var th = (document.documentElement.lang || "").slice(0, 2) === "th";
  var items = [
    [FW, "แฟลชเฟิร์มแวร์", "Flash firmware"],
    [FW + "board/", "รู้จักบอร์ด", "The board"],
    [FW + "wifi/", "ตั้งค่า Wi-Fi", "Wi-Fi setup"],
    [FW + "tools/esphome-canvas-simulator.html", "ลายหน้าจอ", "Screen designs"],
    [FW + "ble/", "Bluetooth", "Bluetooth"],
    [FW + "teacher/", "สำหรับผู้สอน", "For teachers"],
    [B + "case-library/gallery/", "เคสพิมพ์ 3 มิติ", "3D-print cases"],
    [FW + "sitemap/", "ทุกหน้า", "All pages"]
  ];
  // Which item is the current page: the longest URL prefix that matches, but the firmware home
  // only counts on an exact match, and anywhere under case-library counts as "cases".
  var here = location.href.split(/[?#]/)[0].replace(/index\.html$/, "");
  var path = location.pathname;
  var active = -1, best = 0;
  items.forEach(function (it, i) {
    var u = it[0], p = u.replace(B, "/");
    var hit = u === FW ? (path === "/esp32c3-pm25-monitor/" || path === "/esp32c3-pm25-monitor/index.html")
      : i === 6 ? path.indexOf("/case-library/") === 0
      : path.indexOf(p) === 0;
    if (hit && p.length > best) { best = p.length; active = i; }
  });
  var css = "#dbk-kit-nav{position:sticky;top:0;z-index:2147483000;background:#1d2530;color:#e9eef2;font:500 14px/1.2 system-ui,-apple-system,'Segoe UI',sans-serif;box-shadow:0 1px 0 rgba(0,0,0,.25)}" +
    "#dbk-kit-nav .w{display:flex;align-items:center;gap:4px;max-width:1440px;margin:0 auto;padding:0 12px;height:44px;overflow-x:auto;scrollbar-width:none}" +
    "#dbk-kit-nav .w::-webkit-scrollbar{display:none}" +
    "#dbk-kit-nav a{color:#c9d3da;text-decoration:none;white-space:nowrap;padding:7px 10px;border-radius:6px}" +
    "#dbk-kit-nav a:hover{color:#fff;background:rgba(255,255,255,.08)}" +
    "#dbk-kit-nav a[aria-current=page]{color:#1d2530;background:#e9c21a;font-weight:650}" +
    "#dbk-kit-nav .b{color:#fff;font-weight:750;letter-spacing:-.01em;margin-right:6px;padding-left:2px}" +
    "#dbk-kit-nav .b span{color:#e9c21a}" +
    "#dbk-kit-nav .g{margin-left:auto;opacity:.75}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  var nav = document.createElement("nav");
  nav.id = "dbk-kit-nav"; nav.setAttribute("aria-label", th ? "เว็บ DustBoy Kit" : "DustBoy Kit sites");
  var w = document.createElement("div"); w.className = "w"; nav.appendChild(w);
  var brand = document.createElement("a"); brand.className = "b"; brand.href = FW;
  brand.innerHTML = "DustBoy <span>Kit</span>"; w.appendChild(brand);
  items.forEach(function (it, i) {
    var a = document.createElement("a"); a.href = it[0]; a.textContent = th ? it[1] : it[2];
    if (i === active) a.setAttribute("aria-current", "page");
    w.appendChild(a);
  });
  var gh = document.createElement("a"); gh.className = "g"; gh.textContent = "GitHub";
  gh.href = path.indexOf("/case-library/") === 0 ? "https://github.com/dustboy-kit/case-library" : "https://github.com/dustboy-kit/esp32c3-pm25-monitor";
  w.appendChild(gh);
  var put = function () { document.body.insertBefore(nav, document.body.firstChild); };
  if (document.body) put(); else document.addEventListener("DOMContentLoaded", put);
})();
