import { validateEntry } from "./guestbook-entry.js";

function memoryGuestbook() {
  const entries = [];
  let nextId = 1;

  return {
    async list(before = null) {
      const page = entries.filter((entry) => before === null || entry.id < before).slice(0, 21);
      return {
        entries: page.slice(0, 20).map((entry) => ({ ...entry })),
        nextCursor: page.length > 20 ? page[19].id : null,
      };
    },
    async sign(input) {
      const value = validateEntry(input);
      const entry = { id: nextId++, ...value, created_at: new Date().toISOString() };
      entries.unshift(entry);
      return { entry: { ...entry } };
    },
  };
}

function httpGuestbook(endpoint) {
  async function request(url, options = {}) {
    const response = await fetch(url, { cache: "no-store", ...options });
    if (!response.headers.get("Content-Type")?.includes("application/json")) {
      throw new Error("The guestbook is unavailable. Please try again later.");
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
    return data;
  }

  return {
    list(before = null) {
      const url = new URL(endpoint);
      if (before !== null) url.searchParams.set("before", before);
      return request(url);
    },
    sign(input) {
      return request(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    },
  };
}

export function createGuestbookClient(endpoint) {
  const host = location.hostname.toLowerCase();
  const local = ["localhost", "127.0.0.1", "[::1]", "::1"].includes(host) || host.endsWith(".localhost");
  return local ? memoryGuestbook() : httpGuestbook(new URL(endpoint, location.href));
}
