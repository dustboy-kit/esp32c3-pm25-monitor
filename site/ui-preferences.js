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

  function mount() {
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
