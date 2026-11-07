(() => {
  const root = document.documentElement;
  const themes = new Set(["plain", "starry"]);
  const params = new URLSearchParams(location.search);

  const readStoredTheme = () => {
    try {
      return localStorage.getItem("dbk-theme");
    } catch {
      return null;
    }
  };

  const writeStoredTheme = (theme) => {
    try {
      localStorage.setItem("dbk-theme", theme);
    } catch {
      // The selected theme still applies when storage is unavailable.
    }
  };

  const normalizeTheme = (value) => value === "minimal" ? "plain" : value;
  const requestedTheme = normalizeTheme(params.get("theme"));
  const storedTheme = normalizeTheme(readStoredTheme());
  let theme = themes.has(requestedTheme)
    ? requestedTheme
    : themes.has(storedTheme)
      ? storedTheme
      : "plain";

  const copy = {
    th: {
      plain: "ธีมเรียบง่าย",
      starry: "ธีมดวงดาว",
      switchToPlain: "เปลี่ยนเป็นธีมเรียบง่าย",
      switchToStarry: "เปลี่ยนเป็นธีมดวงดาว",
    },
    en: {
      plain: "Plain theme",
      starry: "Starry theme",
      switchToPlain: "Switch to plain theme",
      switchToStarry: "Switch to starry theme",
    },
  };

  function language() {
    return root.lang === "en" ? "en" : "th";
  }

  function syncControls() {
    const lang = language();
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const next = theme === "plain" ? "starry" : "plain";
      button.dataset.theme = theme;
      button.setAttribute("aria-label", copy[lang][`switchTo${next[0].toUpperCase()}${next.slice(1)}`]);
      button.setAttribute("title", copy[lang][theme]);
      button.setAttribute("aria-pressed", String(theme === "plain"));
      const icon = button.querySelector("[data-theme-icon]");
      if (icon) icon.textContent = theme === "plain" ? "◐" : "✦";
    });
  }

  function applyTheme(next, persist = true) {
    theme = themes.has(normalizeTheme(next)) ? normalizeTheme(next) : "plain";
    root.dataset.theme = theme;
    if (persist) writeStoredTheme(theme);
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = theme === "plain" ? "#090d15" : "#040818";
    syncControls();
    window.dispatchEvent(new CustomEvent("dbk-theme-change", { detail: { theme } }));
  }

  applyTheme(theme, false);

  // Build stamp: pages.yaml writes site/version.json on every deploy, so the
  // footer shows which commit is live. Missing file (local checkout) = no badge.
  function showVersion() {
    const script = versionBase || document.querySelector('script[src$="ui-preferences.js"]');
    const base = script && script.src ? new URL(".", script.src) : new URL("./", location.href);
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
        badge.style.cssText = "font:12px/1.4 ui-monospace,monospace;color:var(--muted,#888);text-decoration:none;opacity:.85";
        const footer = document.querySelector("footer");
        if (footer) {
          const span = document.createElement("span");
          span.style.cssText = "display:block;width:100%;margin-top:6px";
          span.appendChild(badge);
          footer.appendChild(span);
        } else {
          badge.style.cssText += ";position:fixed;right:10px;bottom:8px;z-index:9";
          document.body.appendChild(badge);
        }
      })
      .catch(() => {});
  }
  const versionBase = document.currentScript;

  function mount() {
    showVersion();
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.addEventListener("click", () => applyTheme(theme === "plain" ? "starry" : "plain"));
    });
    syncControls();
    new MutationObserver(syncControls).observe(root, { attributes: true, attributeFilter: ["lang"] });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }

  window.dbkTheme = { get: () => theme, set: applyTheme };
})();
