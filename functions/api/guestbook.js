import { GuestbookInputError, validateEntry } from "../../static/js/guestbook-entry.js";

const MAX_BODY_BYTES = 16 * 1024;
const PAGE_SIZE = 20;
const ENTRY_FIELDS = "id, name, website, message, created_at, reply, replied_at";

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

async function readJson(request) {
  const contentType = request.headers.get("Content-Type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new RequestError(415, "Content-Type must be application/json.");
  }
  if (Number(request.headers.get("Content-Length")) > MAX_BODY_BYTES) {
    throw new RequestError(413, "Request body must not exceed 16 KiB.");
  }
  if (!request.body) {
    throw new RequestError(400, "Request body must contain valid JSON.");
  }

  const reader = request.body.getReader();
  const bytes = new Uint8Array(MAX_BODY_BYTES);
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        void reader.cancel().catch(() => {});
        throw new RequestError(413, "Request body must not exceed 16 KiB.");
      }
      bytes.set(value, length - value.byteLength);
    }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, length)));
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError(400, "Request body must contain valid JSON.");
  } finally {
    reader.releaseLock();
  }
}

export async function onRequest({ request, env }) {
  if (request.method !== "GET" && request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405, { Allow: "GET, POST" });
  }

  try {
    const url = new URL(request.url);
    let before = null;
    let input;
    if (request.method === "GET") {
      const cursors = url.searchParams.getAll("before");
      if (cursors.length) {
        const cursor = cursors[0];
        if (cursors.length !== 1 || !/^[0-9]+$/.test(cursor) || !Number.isSafeInteger(Number(cursor)) || Number(cursor) < 1) {
          throw new RequestError(400, "Before must be a positive safe integer.");
        }
        before = Number(cursor);
      }
    } else {
      const origin = request.headers.get("Origin");
      if (origin !== null && origin !== url.origin) {
        throw new RequestError(403, "Cross-origin submissions are not allowed.");
      }
      input = validateEntry(await readJson(request));
    }

    const db = env?.GUESTBOOK_DB;
    if (!db) throw new Error("GUESTBOOK_DB binding is missing.");

    if (request.method === "GET") {
      const statement = before === null
        ? db.prepare(`SELECT ${ENTRY_FIELDS} FROM guestbook ORDER BY id DESC LIMIT ?`).bind(PAGE_SIZE + 1)
        : db.prepare(`SELECT ${ENTRY_FIELDS} FROM guestbook WHERE id < ? ORDER BY id DESC LIMIT ?`).bind(before, PAGE_SIZE + 1);
      const { results } = await statement.all();
      const entries = results.slice(0, PAGE_SIZE);
      return json({
        entries,
        nextCursor: results.length > PAGE_SIZE ? entries[entries.length - 1].id : null,
      });
    }

    const entry = await db.prepare(
      `INSERT INTO guestbook (name, website, message) VALUES (?, ?, ?) RETURNING ${ENTRY_FIELDS}`,
    ).bind(input.name, input.website, input.message).first();
    if (!entry) throw new Error("Guestbook insert returned no entry.");
    return json({ entry }, 201);
  } catch (error) {
    if (error instanceof RequestError || error instanceof GuestbookInputError) {
      return json({ error: error.message }, error.status);
    }
    console.error("Guestbook request failed:", error);
    return json({ error: "Guestbook is temporarily unavailable. Please try again later." }, 503);
  }
}
