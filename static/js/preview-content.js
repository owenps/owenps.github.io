const pageKey = (href) => new URL(href, location.href).pathname.replace(/\/+$/, "") || "/";
const pages = new Map([...document.querySelectorAll("template[data-preview-page]")]
  .map((template) => [pageKey(template.dataset.previewPage), template]));
const contentId = (prefix, id) => `${prefix}-content-${id}`;

export function previewTemplate(href) {
  const url = new URL(href, location.href);
  return url.origin === location.origin ? pages.get(pageKey(url)) : undefined;
}

export function previewTarget(root, hash, prefix) {
  try {
    const id = contentId(prefix, decodeURIComponent(hash.slice(1)));
    return [...root.querySelectorAll("[id]")].find((element) => element.id === id);
  } catch {
    return undefined;
  }
}

export function pageFragment(template, prefix) {
  const fragment = template.content.cloneNode(true);
  const heading = fragment.querySelector(".link-preview-heading h2");
  const content = fragment.querySelector(".link-preview-content");
  const destination = new URL(template.dataset.previewPage, location.href);
  heading.id = `${prefix}-title`;

  // Trusted site content, without scripts or a second instance of live widgets.
  content.querySelectorAll("script, style, link, iframe, object, embed, form, noscript, [data-guestbook-form], [data-guestbook-messages]")
    .forEach((node) => node.remove());
  content.querySelectorAll("[data-copy]").forEach((node) => {
    node.replaceWith(document.createTextNode(node.dataset.copy));
  });
  content.querySelectorAll("button, input, textarea, select").forEach((node) => node.remove());
  const first = content.firstElementChild;
  if (first?.matches("h1, h2") && first.textContent.trim() === heading.textContent.trim()) first.remove();
  while (content.lastElementChild?.matches("hr, br, p:empty")) content.lastElementChild.remove();

  const ids = new Map();
  content.querySelectorAll("[id]").forEach((node) => {
    const id = contentId(prefix, node.id);
    ids.set(node.id, id);
    node.id = id;
  });
  content.querySelectorAll("*").forEach((node) => {
    for (const attribute of [...node.attributes]) {
      if (attribute.name.startsWith("on") || attribute.name === "autofocus") node.removeAttribute(attribute.name);
    }
    for (const attribute of ["href", "src", "poster"]) {
      const value = node.getAttribute(attribute);
      if (value) node.setAttribute(attribute, new URL(value, destination).href);
    }
    for (const attribute of ["aria-labelledby", "aria-describedby", "aria-controls", "for", "headers"]) {
      const value = node.getAttribute(attribute);
      if (value) node.setAttribute(attribute, value.split(/\s+/).map((id) => ids.get(id) ?? id).join(" "));
    }
  });
  return fragment;
}
