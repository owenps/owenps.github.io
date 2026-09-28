document.addEventListener("DOMContentLoaded", () => {
  const dock = document.querySelector(".floating-nav");
  const header = document.querySelector(".header-nav");
  if (!dock || !header || !window.IntersectionObserver) return;

  const root = document.documentElement;
  const trigger = dock.querySelector(".floating-nav__trigger");
  const items = dock.querySelector(".floating-nav__items");
  const headerTheme = header.querySelector(".theme-toggle");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let floatingTheme;

  // Reuse the existing theme controller; no second preference or storage logic.
  if (headerTheme && !headerTheme.hidden) {
    floatingTheme = headerTheme.cloneNode(true);
    floatingTheme.classList.remove("glass-control");
    floatingTheme.classList.add("floating-nav__action");
    const maskID = "floating-theme-moon-mask";
    floatingTheme.querySelector("mask").id = maskID;
    floatingTheme.querySelector("[mask]").setAttribute("mask", `url(#${maskID})`);
    delete floatingTheme.dataset.ready;
    dock.querySelector(".floating-nav__theme").append(floatingTheme);
    const syncTheme = () => {
      floatingTheme.setAttribute("aria-pressed", headerTheme.getAttribute("aria-pressed"));
      floatingTheme.title = headerTheme.title;
    };
    floatingTheme.addEventListener("click", () => {
      headerTheme.click();
      syncTheme();
    });
    new MutationObserver(syncTheme).observe(headerTheme, {
      attributes: true,
      attributeFilter: ["aria-pressed", "title"],
    });
    syncTheme();
    requestAnimationFrame(() => { floatingTheme.dataset.ready = ""; });
  }

  function setExpanded(open, restoreFocus = false) {
    if (restoreFocus) trigger.focus({ preventScroll: true });
    dock.dataset.open = String(open);
    trigger.setAttribute("aria-expanded", String(open));
    trigger.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    items.inert = !open;
    items.setAttribute("aria-hidden", String(!open));
  }

  function updateVisibility(away) {
    if (!away) {
      // Never leave keyboard focus inside a control we are about to hide.
      const active = document.activeElement;
      if (dock.contains(active)) {
        const matchingLink = active?.matches("a")
          ? [...header.querySelectorAll("a")].find(link => link.href === active.href)
          : null;
        const target = active === floatingTheme ? headerTheme
          : matchingLink || header.querySelector("a[aria-current]") || header.querySelector("a");
        target?.focus({ preventScroll: true });
      }
      setExpanded(false);
      delete root.dataset.floatingNavVisible;
    } else {
      root.dataset.floatingNavVisible = "";
    }
    dock.dataset.visible = String(away);
    dock.inert = !away;
    dock.setAttribute("aria-hidden", String(!away));
  }

  trigger.addEventListener("click", () => {
    setExpanded(trigger.getAttribute("aria-expanded") !== "true");
    trigger.focus({ preventScroll: true });
  });

  dock.querySelector(".floating-nav__top").addEventListener("click", () => {
    setExpanded(false, true);
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "instant" : "smooth" });
  });

  document.addEventListener("pointerdown", event => {
    if (dock.dataset.open === "true" && !dock.contains(event.target)) {
      setExpanded(false, dock.contains(document.activeElement));
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !event.defaultPrevented && dock.dataset.open === "true") {
      setExpanded(false, dock.contains(document.activeElement));
      event.preventDefault();
    }
  });

  // Establish the hidden visual state before revealing a restored/scrolling page.
  // CSS handles reversible entrances/exits; inert removes hidden controls immediately.
  dock.hidden = false;
  dock.getBoundingClientRect();

  new IntersectionObserver(([entry]) => {
    updateVisibility(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
  }).observe(header);

  // Also handle restored scroll positions when returning through browser history.
  window.addEventListener("pageshow", () => {
    setExpanded(false, items.contains(document.activeElement));
    updateVisibility(header.getBoundingClientRect().bottom <= 0);
  });
  updateVisibility(header.getBoundingClientRect().bottom <= 0);
});
