(() => {
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  let preference = null;

  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") preference = saved;
  } catch {
    // The toggle still works when browser storage is unavailable.
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll("[data-theme-toggle]").forEach((toggle) => {
      toggle.setAttribute("aria-pressed", String(theme === "dark"));
      toggle.title = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
    });
  }

  function preferredTheme() {
    return preference ?? (systemTheme.matches ? "dark" : "light");
  }

  // This script runs in the head to apply the theme before the page is painted.
  applyTheme(preferredTheme());

  systemTheme.addEventListener("change", () => {
    if (preference === null) applyTheme(preferredTheme());
  });

  document.addEventListener("DOMContentLoaded", () => {
    const toggles = document.querySelectorAll("[data-theme-toggle]");
    if (!toggles.length) return;

    applyTheme(preferredTheme());
    toggles.forEach((toggle) => {
      toggle.hidden = false;
      toggle.addEventListener("click", () => {
        preference = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        applyTheme(preference);
        try {
          localStorage.setItem("theme", preference);
        } catch {
          // Retain the choice for this page even if it cannot be persisted.
        }
      });
    });
    import("./haptics.js").then(({ addHaptics }) => {
      toggles.forEach((toggle) => addHaptics(toggle));
    }).catch(() => {
      // Optional enhancement: theme switching still works if haptics can't load.
    });
  });
})();
