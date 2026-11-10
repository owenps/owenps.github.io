import { pageFragment, previewTarget, previewTemplate } from "./preview-content.js";

const view = document.querySelector("[data-word-reader]");
if (view) initializeWordReader(view);

function initializeWordReader(view) {
  const desktop = matchMedia("(min-width: 901px)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const panel = view.querySelector(".word-reader");
  const page = panel.querySelector(".word-reader-page");
  const closeButton = panel.querySelector("[data-reader-close]");
  const backButton = panel.querySelector("[data-reader-back]");
  const fullPage = panel.querySelector("[data-reader-full]");
  const index = view.querySelector(".rail-index");
  const background = [...view.children].filter((element) => element !== panel);
  const trail = [];
  let currentUrl;
  let opener;
  let animation;
  let closing = false;
  let readerHadFocus = false;

  function displayPage(nodes, url) {
    page.replaceChildren(...nodes);
    currentUrl = new URL(url);
    fullPage.href = currentUrl.href;
    backButton.hidden = !trail.length;
    const body = page.querySelector(".link-preview-body");
    body.tabIndex = 0;
    body.setAttribute("aria-labelledby", `${panel.id}-title`);
    return body;
  }

  function scrollToTarget(target) {
    const body = page.querySelector(".link-preview-body");
    body.scrollTop += target.getBoundingClientRect().top - body.getBoundingClientRect().top;
  }

  function close(restoreFocus = true, animate = true) {
    if (!opener) return;
    const canAnimate = animate && !reducedMotion.matches && desktop.matches
      && document.documentElement.dataset.focus !== "true";
    if (closing && canAnimate) return;
    const from = getComputedStyle(panel).transform;
    animation?.cancel();
    const returnTo = opener;
    const finish = () => {
      opener = null;
      closing = false;
      animation?.cancel();
      animation = null;
      panel.hidden = true;
      panel.inert = true;
      trail.length = 0;
      currentUrl = null;
      backButton.hidden = true;
      background.forEach((element) => { element.inert = false; });
      returnTo.setAttribute("aria-expanded", "false");
      if (restoreFocus && desktop.matches && document.documentElement.dataset.focus !== "true") {
        returnTo.focus({ preventScroll: true });
      }
    };
    if (!canAnimate) {
      finish();
      return;
    }
    closing = true;
    const exit = panel.animate([
      { transform: from },
      { transform: "translateX(100%)" },
    ], { duration: 240, easing: "ease-in", fill: "forwards" });
    animation = exit;
    const complete = () => {
      if (animation === exit) finish();
    };
    exit.finished.then(complete, complete);
  }

  for (const link of index.querySelectorAll(".index-link")) {
    const template = previewTemplate(link.href);
    if (!template?.hasAttribute("data-reader-article")) continue;
    link.setAttribute("aria-controls", panel.id);
    link.setAttribute("aria-expanded", "false");
    link.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey
        || event.shiftKey || event.altKey || !desktop.matches
        || document.documentElement.dataset.focus === "true") return;
      const url = new URL(link.href);
      if (url.search) return;
      const fragment = pageFragment(template, panel.id);
      const target = url.hash ? previewTarget(fragment, url.hash, panel.id) : null;
      if (url.hash && !target) return;
      event.preventDefault();
      displayPage([fragment], url);
      opener = link;
      link.setAttribute("aria-expanded", "true");
      background.forEach((element) => { element.inert = true; });
      panel.hidden = false;
      panel.inert = false;
      if (target) scrollToTarget(target);
      closeButton.focus({ preventScroll: true });
      if (!reducedMotion.matches) {
        animation = panel.animate([
          { transform: "translateX(100%)" },
          { transform: "translateX(0)" },
        ], { duration: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
      }
    });
  }

  backButton.addEventListener("click", () => {
    if (closing || !trail.length) return;
    const previous = trail.pop();
    const body = displayPage(previous.nodes, previous.url);
    body.scrollTop = previous.scrollTop;
    previous.link.focus({ preventScroll: true });
  });
  closeButton.addEventListener("click", () => close());
  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.key !== "Escape" || !opener) return;
    event.preventDefault();
    close(panel.contains(document.activeElement));
  });
  page.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || !opener || event.defaultPrevented || event.button !== 0 || event.metaKey
      || event.ctrlKey || event.altKey || event.shiftKey || link.hasAttribute("download")
      || (link.target && link.target !== "_self")) return;
    if (closing) {
      event.preventDefault();
      return;
    }
    const url = new URL(link.href);
    const template = previewTemplate(url);
    if (url.search || !template?.hasAttribute("data-reader-article")) return;
    if (template === previewTemplate(currentUrl)) {
      const target = url.hash ? previewTarget(page, url.hash, panel.id) : null;
      if (url.hash && !target) return;
      event.preventDefault();
      currentUrl = url;
      fullPage.href = url.href;
      if (target) scrollToTarget(target);
      else page.querySelector(".link-preview-body").scrollTop = 0;
      return;
    }
    const fragment = pageFragment(template, panel.id);
    const target = url.hash ? previewTarget(fragment, url.hash, panel.id) : null;
    if (url.hash && !target) return;
    event.preventDefault();
    trail.push({
      nodes: [...page.childNodes],
      url: new URL(currentUrl),
      scrollTop: page.querySelector(".link-preview-body").scrollTop,
      link,
    });
    const body = displayPage([fragment], url);
    if (target) scrollToTarget(target);
    body.focus({ preventScroll: true });
  });
  document.addEventListener("focusin", (event) => {
    readerHadFocus = panel.contains(event.target);
  });
  desktop.addEventListener("change", () => {
    const moveFocus = readerHadFocus;
    if (!desktop.matches) close(false);
    if (moveFocus && !desktop.matches) document.querySelector(".site-index-open:not([hidden])")?.focus({ preventScroll: true });
  });
  reducedMotion.addEventListener("change", () => animation?.cancel());
  new MutationObserver(() => {
    if (document.documentElement.dataset.focus !== "true") return;
    const moveFocus = readerHadFocus;
    close(false);
    if (moveFocus) view.closest(".site-rail").querySelector("[data-focus-toggle]")?.focus({ preventScroll: true });
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-focus"] });
  window.addEventListener("beforeprint", () => close(true, false));
}
