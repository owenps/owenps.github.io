CREATE TABLE guestbook (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80),
    website TEXT CHECK (website IS NULL OR length(website) BETWEEN 1 AND 2048),
    message TEXT NOT NULL CHECK (length(trim(message)) BETWEEN 1 AND 2000),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    -- Reserved for an owner reply; the public API does not write these fields.
    reply TEXT CHECK (reply IS NULL OR length(trim(reply)) BETWEEN 1 AND 2000),
    replied_at TEXT,
    CHECK (
        (reply IS NULL AND replied_at IS NULL)
        OR (reply IS NOT NULL AND replied_at IS NOT NULL)
    )
);
