(() => {
  const root = document.documentElement;
  const system = matchMedia("(prefers-color-scheme: dark)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const storageKey = "color-theme";
  const validTheme = (value) => value === "light" || value === "dark" ? value : null;
  let preference = null;
  let button;
  let transition;

  try {
    preference = validTheme(localStorage.getItem(storageKey));
  } catch (_) {
    // Private browsing/storage restrictions must not disable the toggle.
  }

  function applyTheme() {
    const dark = preference ? preference === "dark" : system.matches;
    root.dataset.theme = dark ? "dark" : "light";
    if (button) {
      button.setAttribute("aria-pressed", String(dark));
      button.title = dark ? "Switch to light mode" : "Switch to dark mode";
    }
  }

  // Loaded synchronously in the head to restore the choice before first paint.
  applyTheme();

  system.addEventListener("change", () => {
    if (!preference) applyTheme();
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== storageKey && event.key !== null) return;
    preference = validTheme(event.newValue);
    applyTheme();
  });

  document.addEventListener("DOMContentLoaded", () => {
    button = document.querySelector(".theme-toggle");
    if (!button) return;
    applyTheme();
    button.hidden = false;
    requestAnimationFrame(() => { button.dataset.ready = ""; });

    button.addEventListener("click", () => {
      preference = (preference || root.dataset.theme) === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(storageKey, preference);
      } catch (_) {}
      transition?.skipTransition();
      if (document.startViewTransition && !reducedMotion.matches) {
        transition = document.startViewTransition(applyTheme);
      } else {
        applyTheme();
      }
    });
  });
})();
