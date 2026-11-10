const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

if (!reducedMotion.matches && typeof Element.prototype.animate === "function") {
  const active = new Map();
  const rainbow = ["#c95662", "#d58a3a", "#c8ad40", "#43916c", "#498fa8", "#6267b0", "#a66aae"];

  function finish(row) {
    const state = active.get(row);
    if (!state) return;
    active.delete(row);
    state.animations.forEach((animation) => animation.cancel());
    state.overlay.remove();
    row.classList.remove("rainbow-reveal-row");
  }

  function finishAll() {
    for (const row of active.keys()) finish(row);
  }

  function reveal(root, selector = ".rail-index", rowSelector = ".index-link, .resource-link") {
    if (reducedMotion.matches) return;

    for (const [section, group] of [...root.querySelectorAll(selector)].entries()) {
      const bounds = group.getBoundingClientRect();
      const rows = [...group.querySelectorAll(rowSelector)].filter((row) => {
        const rect = row.getBoundingClientRect();
        return rect.width && rect.height && getComputedStyle(row).visibility === "visible"
          && rect.bottom > Math.max(bounds.top, 0)
          && rect.top < Math.min(bounds.bottom, innerHeight);
      });

      rows.forEach((row, index) => {
        if (active.has(row) || row.contains(document.activeElement)) return;
        const overlay = document.createElement("span");
        overlay.className = "rainbow-cascade";
        overlay.style.setProperty("--reveal-color", rainbow[index % rainbow.length]);
        overlay.setAttribute("aria-hidden", "true");
        row.append(overlay);
        row.classList.add("rainbow-reveal-row");

        const delay = Math.min(index, 8) * 100 + section * 120;
        const entrance = row.animate([
          { opacity: 0 },
          { opacity: 1 },
        ], { duration: 600, delay, easing: "ease-out", fill: "backwards" });
        const fade = overlay.animate([
          { opacity: 0.32 },
          { opacity: 0 },
        ], {
          duration: 1200,
          delay: delay + 200,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "both",
        });
        active.set(row, { overlay, animations: [entrance, fade] });
        const cleanup = () => {
          if (active.get(row)?.overlay === overlay) finish(row);
        };
        fade.finished.then(cleanup, cleanup);
      });
    }
  }

  reducedMotion.addEventListener("change", finishAll);
  window.addEventListener("beforeprint", finishAll);
  window.addEventListener("pagehide", finishAll);
  window.addEventListener("resize", finishAll);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) finishAll();
  });
  document.addEventListener("focusin", (event) => {
    const row = event.target.closest(".rainbow-reveal-row");
    if (row) finish(row);
  });

  const pane = document.querySelector(".reading-body");
  if (pane.classList.contains("home-content")) {
    reveal(document, ".site-rail .rail-index");
  } else {
    reveal(pane, ".resource-index, .project-list, .blog-posts",
      ".resource-link, .project-list > p, .blog-posts > li:has(a)");
  }

  const dialog = document.getElementById("site-index");
  if (dialog) {
    new MutationObserver(() => {
      if (dialog.open) reveal(dialog);
      else finishAll();
    }).observe(dialog, { attributes: true, attributeFilter: ["open"] });
  }
}
