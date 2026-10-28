const card = document.getElementById("link-preview");
if (card) initializePreviews(card);

function initializePreviews(card) {
  const pageKey = (url) => url.pathname.replace(/\/+$/, "") || "/";
  const pages = new Map([...document.querySelectorAll("template[data-preview-page]")]
    .map((template) => [pageKey(new URL(template.dataset.previewPage, location.href)), template]));
  const canHover = matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let activeLink = null;
  let currentPage = null;
  let restoringFocus = false;
  let showTimer;
  let hideTimer;
  let visibilityAnimation;

  function clearTimers() {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
  }

  function setVisible(visible) {
    // Continue from the current frame when a reveal interrupts a dismissal.
    const style = getComputedStyle(card);
    const from = card.hidden
      ? { opacity: 0, transform: "translateY(4px)" }
      : { opacity: style.opacity, transform: style.transform };
    visibilityAnimation?.cancel();
    visibilityAnimation = null;
    card.hidden = false;
    card.inert = !visible;
    card.setAttribute("aria-hidden", String(!visible));
    if (reducedMotion.matches) {
      card.hidden = !visible;
      return;
    }

    const animation = card.animate([
      from,
      { opacity: visible ? 1 : 0, transform: `translateY(${visible ? 0 : 4}px)` },
    ], {
      duration: visible ? 180 : 120,
      easing: visible ? "ease-out" : "ease-in",
      fill: "both",
    });
    visibilityAnimation = animation;
    animation.finished.then(() => {
      if (visibilityAnimation !== animation) return;
      card.hidden = !visible;
      animation.cancel();
      visibilityAnimation = null;
    }).catch(() => {
      // Another reveal/dismissal superseded this animation.
    });
  }

  function closeLink(link) {
    link?.setAttribute("aria-expanded", "false");
    link?.removeAttribute("aria-details");
  }

  function hide() {
    clearTimers();
    if (!activeLink) return;
    const returnTo = card.contains(document.activeElement) ? activeLink : null;
    closeLink(activeLink);
    activeLink = null;
    if (returnTo) {
      restoringFocus = true;
      returnTo.focus({ preventScroll: true });
      restoringFocus = false;
    }
    setVisible(false);
  }

  function positionCard() {
    if (!activeLink || card.hidden) return;
    const anchor = activeLink.getBoundingClientRect();
    if (anchor.bottom < 0 || anchor.top > innerHeight) {
      hide();
      return;
    }
    const body = card.querySelector(".link-preview-body");
    const heading = card.querySelector(".link-preview-heading");
    const desiredHeight = heading.offsetHeight + Math.min(body.scrollHeight, parseFloat(getComputedStyle(body).maxHeight)) + 2;
    const below = Math.max(0, innerHeight - anchor.bottom - 26);
    const above = Math.max(0, anchor.top - 26);
    const placeBelow = below >= desiredHeight || below >= above;
    // Shrink the scroll area rather than covering the link in a short viewport.
    card.style.maxHeight = `${Math.min(440, placeBelow ? below : above)}px`;
    const { width, height } = card.getBoundingClientRect();
    card.style.left = `${Math.max(16, Math.min(anchor.left, innerWidth - width - 16))}px`;
    card.style.top = `${placeBelow ? anchor.bottom + 10 : anchor.top - height - 10}px`;
    body.tabIndex = body.scrollHeight > body.clientHeight ? 0 : -1;
  }

  function pageFragment(template) {
    const fragment = template.content.cloneNode(true);
    const content = fragment.querySelector(".link-preview-content");
    const destination = new URL(template.dataset.previewPage, location.href);
    // Trusted site content, without scripts or a second instance of live widgets.
    content.querySelectorAll("script, style, link, iframe, object, embed, form, noscript, [data-guestbook-form], [data-guestbook-messages]")
      .forEach((node) => node.remove());
    content.querySelectorAll("[data-copy]").forEach((node) => {
      node.replaceWith(document.createTextNode(node.dataset.copy));
    });
    content.querySelectorAll("button, input, textarea, select").forEach((node) => node.remove());
    const first = content.firstElementChild;
    if (first?.matches("h1, h2") && first.textContent.trim() === fragment.querySelector(".link-preview-heading h2").textContent.trim()) {
      first.remove();
    }
    while (content.lastElementChild?.matches("hr, br, p:empty")) content.lastElementChild.remove();

    const ids = new Map();
    content.querySelectorAll("[id]").forEach((node) => {
      const id = `${card.id}-content-${node.id}`;
      ids.set(node.id, id);
      node.id = id;
    });
    content.querySelectorAll("*").forEach((node) => {
      for (const attribute of [...node.attributes]) {
        if (attribute.name.startsWith("on") || attribute.name === "autofocus") node.removeAttribute(attribute.name);
      }
      for (const attribute of ["href", "src", "poster"]) {
        const value = node.getAttribute(attribute);
        if (!value) continue;
        if (attribute === "href" && value.startsWith("#") && ids.has(value.slice(1))) {
          node.setAttribute(attribute, `#${ids.get(value.slice(1))}`);
        } else {
          node.setAttribute(attribute, new URL(value, destination).href);
        }
      }
      for (const attribute of ["aria-labelledby", "aria-describedby", "aria-controls", "for", "headers"]) {
        const value = node.getAttribute(attribute);
        if (value) node.setAttribute(attribute, value.split(/\s+/).map((id) => ids.get(id) ?? id).join(" "));
      }
    });
    return fragment;
  }

  function show(link, key) {
    clearTimers();
    if (activeLink === link) return;
    closeLink(activeLink);
    activeLink = link;
    // Keep the current DOM and scroll position on re-entry to the same page.
    if (currentPage !== key) {
      card.replaceChildren(pageFragment(pages.get(key)));
      currentPage = key;
    }
    link.setAttribute("aria-expanded", "true");
    link.setAttribute("aria-details", card.id);
    setVisible(true);
    positionCard();
  }

  function scheduleHide() {
    clearTimers();
    if (activeLink?.matches(":focus-visible") || card.contains(document.activeElement)) return;
    hideTimer = setTimeout(hide, 180);
  }

  for (const link of document.querySelectorAll("main a[href]")) {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) continue;
    const url = new URL(href, location.href);
    const key = pageKey(url);
    if (url.origin !== location.origin || !pages.has(key) || key === pageKey(new URL(location.href))) continue;
    link.dataset.linkPreview = "";
    link.setAttribute("aria-controls", card.id);
    link.setAttribute("aria-expanded", "false");
    link.setAttribute("aria-keyshortcuts", "ArrowDown");
    link.addEventListener("pointerenter", (event) => {
      if (!canHover.matches || event.pointerType === "touch" || card.contains(document.activeElement)) return;
      clearTimers();
      showTimer = setTimeout(() => show(link, key), 250);
    });
    link.addEventListener("pointerleave", scheduleHide);
    link.addEventListener("focus", () => {
      if (!restoringFocus && link.matches(":focus-visible")) show(link, key);
    });
    link.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" && activeLink === link) {
        event.preventDefault();
        card.querySelector(".link-preview-body").focus({ preventScroll: true });
      }
    });
    link.addEventListener("blur", (event) => {
      if (activeLink === link && !card.contains(event.relatedTarget)) hide();
    });
    // Clicks and modifier keys retain native navigation, including the first tap.
  }

  card.addEventListener("pointerenter", () => clearTimers());
  card.addEventListener("pointerleave", scheduleHide);
  card.addEventListener("focusin", () => clearTimers());
  card.addEventListener("focusout", (event) => {
    if (!card.contains(event.relatedTarget) && event.relatedTarget !== activeLink) hide();
  });
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Tab" || !activeLink) return;
    const stops = [...card.querySelectorAll("a[href], summary, [tabindex]")]
      .filter((node) => node.tabIndex >= 0 && node.getClientRects().length);
    const body = card.querySelector(".link-preview-body");
    if (event.shiftKey && (event.target === body || event.target === stops[0])) {
      event.preventDefault();
      hide();
    } else if (!event.shiftKey && (event.target === stops.at(-1) || (!stops.length && event.target === body))) {
      // Restore the trigger before native Tab advances to its next sibling stop.
      hide();
    }
  });
  card.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#link-preview-content-"]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const target = document.getElementById(link.getAttribute("href").slice(1));
    if (!target) return;
    event.preventDefault();
    const body = card.querySelector(".link-preview-body");
    body.scrollTop += target.getBoundingClientRect().top - body.getBoundingClientRect().top;
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hide();
  });
  document.addEventListener("pointerdown", (event) => {
    if (!card.contains(event.target) && !event.target.closest("[data-link-preview]")) hide();
  });
  window.addEventListener("resize", positionCard);
  window.addEventListener("scroll", (event) => {
    if (card.contains(event.target)) return;
    if (activeLink?.matches(":focus-visible") || card.contains(document.activeElement)) positionCard();
    else hide();
  }, true);
  new ResizeObserver(positionCard).observe(card);
}
