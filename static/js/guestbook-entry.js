// Shared by the D1 API and the in-memory localhost adapter.
export class GuestbookInputError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

export function validateEntry(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new GuestbookInputError("Request body must be a JSON object.");
  }
  if (body.name != null && typeof body.name !== "string") {
    throw new GuestbookInputError("Name must be a string.");
  }
  const name = (body.name ?? "").trim();
  if (!name || name.length > 80) {
    throw new GuestbookInputError("Name or alias is required and must not exceed 80 characters.");
  }
  if (typeof body.message !== "string") {
    throw new GuestbookInputError("Message must be a string.");
  }
  const message = body.message.trim();
  if (!message || message.length > 2000) {
    throw new GuestbookInputError("Message is required and must not exceed 2000 characters.");
  }
  if (name.includes("\0") || message.includes("\0")) {
    throw new GuestbookInputError("Names and messages cannot contain null characters.");
  }
  if (body.website != null && typeof body.website !== "string") {
    throw new GuestbookInputError("Website must be a string.");
  }
  let website = (body.website ?? "").trim();
  if (website) {
    if (website.length > 2048) {
      throw new GuestbookInputError("Website must not exceed 2048 characters.");
    }
    let url;
    try {
      url = new URL(website);
    } catch {
      throw new GuestbookInputError("Website must be an absolute HTTP or HTTPS URL.");
    }
    if (!/^https?:\/\//i.test(website) || !["http:", "https:"].includes(url.protocol) || url.username || url.password) {
      throw new GuestbookInputError("Website must be an absolute HTTP or HTTPS URL without credentials.");
    }
    website = url.href;
    if (website.length > 2048) {
      throw new GuestbookInputError("Normalized website must not exceed 2048 characters.");
    }
  }
  return { name, website: website || null, message };
}
