(() => {
  const mobile = window.matchMedia("(max-width: 900px)");
  let preference = false;

  try {
    preference = localStorage.getItem("focus-mode") === "true";
  } catch {
    // The toggle still works when browser storage is unavailable.
  }

  function applyFocus() {
    const active = preference && !mobile.matches;
    document.documentElement.dataset.focus = String(active);

    if (mobile.matches && document.activeElement?.matches("[data-focus-toggle]")) {
      document.querySelector(".site-home-link")?.focus({ preventScroll: true });
    }

    document.querySelectorAll(".site-rail > :not(footer)").forEach((region) => {
      region.inert = active;
    });
    document.querySelectorAll("[data-focus-toggle]").forEach((toggle) => {
      toggle.hidden = mobile.matches;
      toggle.setAttribute("aria-pressed", String(active));
      toggle.title = active ? "Show side indexes" : "Hide side indexes";
    });
  }

  // Restore the desktop preference before the page is painted.
  applyFocus();
  mobile.addEventListener("change", applyFocus);

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-focus-toggle]").forEach((toggle) => {
      toggle.addEventListener("click", () => {
        preference = !preference;
        applyFocus();
        try {
          localStorage.setItem("focus-mode", String(preference));
        } catch {
          // Retain the choice for this page even if it cannot be persisted.
        }
      });
    });
    applyFocus();
  });
})();
