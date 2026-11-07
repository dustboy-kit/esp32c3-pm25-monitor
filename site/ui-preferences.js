// Shared bits for every page of the site.
//
// daisyUI (theme "corporate", set on <html> in each page) owns the look; the
// previous dark theme toggle is gone. What remains:
//   - the Laris Labs footer at the end of every page (same bar as the flask
//     /post-all page, 00_mz_forwarder PR #533)
//   - the live build stamp inside that footer, read from version.json which
//     .github/workflows/pages.yaml writes on every deploy. A local checkout
//     has no version.json and shows the footer without the build line.
(() => {
  const thisScript = document.currentScript;

  function siteBase() {
    const script = thisScript || document.querySelector('script[src*="ui-preferences.js"]');
    return script && script.src ? new URL(".", script.src) : new URL("./", location.href);
  }

  function mountFooter() {
    if (document.getElementById("laris-footer")) return;
    const base = siteBase();
    const style = document.createElement("style");
    style.textContent =
      "#laris-footer{border:0;box-shadow:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;margin:48px auto 24px;padding:0 20px;color:#6b7280;font:13px/1.4 system-ui,-apple-system,'Segoe UI',sans-serif}" +
      "#laris-footer img{height:26px;width:auto;display:block;opacity:.9}" +
      "#laris-footer .copy{color:#6b7280}" +
      "#laris-footer .build-badge{color:#9ca3af;font:11px/1.4 ui-monospace,monospace;text-decoration:none}";
    document.head.appendChild(style);

    const footer = document.createElement("footer");
    footer.id = "laris-footer";
    const img = document.createElement("img");
    img.src = new URL("laris-logo.png", base).href;
    img.alt = "laris.co";
    const copy = document.createElement("div");
    copy.className = "copy";
    copy.innerHTML = "© 2026 Laris Labs Limited.<br>All rights reserved.";
    footer.appendChild(img);
    footer.appendChild(copy);
    (document.querySelector("main") || document.body).appendChild(footer);

    fetch(new URL("version.json", base), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((v) => {
        if (!v || !v.sha) return;
        const badge = document.createElement("a");
        badge.className = "build-badge";
        badge.href = "https://github.com/dustboy-kit/esp32c3-pm25-monitor/commit/" + v.sha;
        badge.target = "_blank";
        badge.rel = "noopener";
        badge.textContent = "build " + v.sha + " · " + v.date;
        footer.appendChild(badge);
      })
      .catch(() => {});
  }

  // Developer blocks (YAML, RPC console, build server, fallback AP, ...) are
  // marked data-dev and hidden for teachers and students. ?dev=1 shows them
  // and remembers it; ?dev=0 forgets.
  function revealDev() {
    const q = new URLSearchParams(location.search).get("dev");
    try {
      if (q === "1") localStorage.setItem("dbk-dev", "1");
      if (q === "0") localStorage.removeItem("dbk-dev");
    } catch {}
    let on = q === "1";
    try { on = on || localStorage.getItem("dbk-dev") === "1"; } catch {}
    if (on) document.querySelectorAll("[data-dev]").forEach((el) => { el.hidden = false; });
  }
  function mount() { revealDev(); mountFooter(); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();
