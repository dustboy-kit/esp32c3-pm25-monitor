(() => {
  const root = document.documentElement;
  const themes = new Set(["minimal", "starry"]);
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

  const requestedTheme = params.get("theme");
  const storedTheme = readStoredTheme();
  let theme = themes.has(requestedTheme)
    ? requestedTheme
    : themes.has(storedTheme)
      ? storedTheme
      : "minimal";

  const copy = {
    th: {
      minimal: "ธีมเรียบง่าย",
      starry: "ธีมดวงดาว",
      switchToMinimal: "เปลี่ยนเป็นธีมเรียบง่าย",
      switchToStarry: "เปลี่ยนเป็นธีมดวงดาว",
    },
    en: {
      minimal: "Minimal theme",
      starry: "Starry theme",
      switchToMinimal: "Switch to minimal theme",
      switchToStarry: "Switch to starry theme",
    },
  };

  function language() {
    return root.lang === "en" ? "en" : "th";
  }

  function syncControls() {
    const lang = language();
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const next = theme === "minimal" ? "starry" : "minimal";
      button.dataset.theme = theme;
      button.setAttribute("aria-label", copy[lang][`switchTo${next[0].toUpperCase()}${next.slice(1)}`]);
      button.setAttribute("title", copy[lang][theme]);
      button.setAttribute("aria-pressed", String(theme === "minimal"));
      const icon = button.querySelector("[data-theme-icon]");
      if (icon) icon.textContent = theme === "minimal" ? "◐" : "✦";
    });
  }

  function applyTheme(next, persist = true) {
    theme = themes.has(next) ? next : "minimal";
    root.dataset.theme = theme;
    if (persist) writeStoredTheme(theme);
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = theme === "minimal" ? "#090d15" : "#040818";
    syncControls();
    window.dispatchEvent(new CustomEvent("dbk-theme-change", { detail: { theme } }));
  }

  applyTheme(theme, false);

  function mount() {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.addEventListener("click", () => applyTheme(theme === "minimal" ? "starry" : "minimal"));
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
