import { createGuestbookClient } from "./guestbook-client.js";
import { hideToast, showToast } from "./toast.js";

const guestbooks = new Map();

function sharedGuestbook(view) {
  const endpoint = new URL(view.dataset.endpoint, location.href).href;
  if (!guestbooks.has(endpoint)) {
    guestbooks.set(endpoint, {
      client: createGuestbookClient(endpoint),
      subscribers: new Set(),
    });
  }
  return guestbooks.get(endpoint);
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const formViews = document.querySelectorAll("[data-guestbook-form]");
formViews.forEach((view) => {
  const { client, subscribers } = sharedGuestbook(view);
  const form = view.querySelector("form");
  const fields = form.querySelector("fieldset");
  const name = form.elements.namedItem("name");
  const website = form.elements.namedItem("website");
  const message = form.elements.namedItem("message");
  const submit = form.querySelector('[type="submit"]');
  const status = view.querySelector(".guestbook-form-status");
  let signing = false;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (signing || !form.reportValidity()) return;
    const payload = { name: name.value, website: website.value, message: message.value };
    signing = true;
    fields.disabled = true;
    form.setAttribute("aria-busy", "true");
    const signingTimer = setTimeout(() => { submit.textContent = "Signing…"; }, 400);
    status.textContent = "";
    hideToast();
    try {
      const { entry } = await client.sign(payload);
      subscribers.forEach((receive) => receive(entry));
      form.reset();
      showToast(`Signed #${entry.id}`);
    } catch (error) {
      status.textContent = error instanceof TypeError
        ? "Your message couldn't be sent. Please try again."
        : error.message;
    } finally {
      clearTimeout(signingTimer);
      fields.disabled = false;
      form.removeAttribute("aria-busy");
      submit.textContent = "Sign";
      signing = false;
    }
  });

  fields.disabled = false;
});

document.querySelectorAll("[data-guestbook-messages]").forEach((view) => {
  const { client, subscribers } = sharedGuestbook(view);
  const status = view.querySelector(".guestbook-load-status");
  const entries = view.querySelector(".guestbook-entries");
  const older = view.querySelector(".guestbook-older");
  const retry = view.querySelector(".guestbook-retry");
  const rendered = new Set();
  const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  let cursor = null;
  let loaded = false;
  let loading = false;

  function renderEntry(entry) {
    if (rendered.has(entry.id)) return;
    const item = element("li", "guestbook-entry");
    item.dataset.entryId = entry.id;
    const header = element("header");
    const author = element("span", "guestbook-author");
    const authorName = entry.name || "Anonymous";

    // Only HTTP(S) links are clickable, even if an old database row is malformed.
    let authorURL;
    try {
      const url = new URL(entry.website);
      if (["http:", "https:"].includes(url.protocol) && !url.username && !url.password) authorURL = url.href;
    } catch {
      // A missing or invalid website leaves the author as plain text.
    }
    if (authorURL) {
      const link = element("a", "text-link external-link");
      link.href = authorURL;
      link.rel = "nofollow ugc";
      const arrow = element("span", "external-link-arrow", "↗");
      arrow.setAttribute("aria-hidden", "true");
      link.append(element("span", "link-text", authorName), arrow);
      author.append(link);
    } else {
      author.textContent = authorName;
    }

    const meta = element("span", "guestbook-meta");
    const date = element("time", "", dateFormat.format(new Date(entry.created_at)));
    date.dateTime = entry.created_at;
    meta.append(date, document.createTextNode(` / ${entry.id}`));
    header.append(author, meta);
    item.append(header, element("p", "guestbook-message", entry.message));
    const next = [...entries.children].find((existing) => Number(existing.dataset.entryId) < entry.id);
    entries.insertBefore(item, next || null);
    rendered.add(entry.id);
  }

  async function loadEntries() {
    if (loading) return;
    loading = true;
    older.disabled = true;
    retry.hidden = true;
    status.textContent = loaded ? "Loading older messages…" : "Loading messages…";
    try {
      const data = await client.list(cursor);
      data.entries.forEach((entry) => renderEntry(entry));
      cursor = data.nextCursor;
      loaded = true;
      older.hidden = cursor === null;
      status.textContent = entries.children.length ? "" : "No messages yet. Be the first to sign.";
    } catch {
      status.textContent = "Messages couldn't be loaded. Please try again.";
      retry.hidden = false;
    } finally {
      loading = false;
      older.disabled = false;
    }
  }

  subscribers.add((entry) => {
    renderEntry(entry);
    if (!loading) status.textContent = "";
  });
  older.addEventListener("click", loadEntries);
  retry.addEventListener("click", loadEntries);
  loadEntries();
});
