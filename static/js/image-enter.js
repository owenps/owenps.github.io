(() => {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotion.matches || typeof Element.prototype.animate !== "function") return;

  const controller = new AbortController();
  const animations = new Set();
  const root = document.documentElement;
  root.dataset.imageEnter = "true";

  function revealAll() {
    delete root.dataset.imageEnter;
    animations.forEach((animation) => animation.cancel());
    controller.abort();
  }

  reducedMotion.addEventListener("change", revealAll, { signal: controller.signal });
  window.addEventListener("beforeprint", revealAll, { signal: controller.signal });
  window.addEventListener("pagehide", revealAll, { signal: controller.signal });

  document.addEventListener("DOMContentLoaded", () => {
    const pane = document.querySelector(".reading-body");
    if (!pane) {
      revealAll();
      return;
    }
    pane.addEventListener("focusin", revealAll, { signal: controller.signal });

    const images = [...pane.querySelectorAll("img:not(.site-link img)")];
    Promise.allSettled(images.map(async (image, index) => {
      try {
        if (typeof image.decode === "function") {
          await image.decode();
        } else if (!image.complete) {
          await new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          });
        }
      } catch {
        // Failed images must not stay hidden.
      }

      image.dataset.imageReady = "true";
      if (!root.hasAttribute("data-image-enter") || !image.naturalWidth) return;

      const animation = image.animate([
        { opacity: 0 },
        { opacity: getComputedStyle(image).opacity },
      ], {
        duration: 500,
        delay: Math.min(index, 2) * 80,
        easing: "ease",
        fill: "backwards",
      });
      animations.add(animation);
      try {
        await animation.finished;
      } catch {
        // Focus, printing, or reduced motion can reveal images immediately.
      } finally {
        animations.delete(animation);
      }
    })).then(revealAll);
  });
})();
