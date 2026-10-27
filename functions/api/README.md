# Guestbook setup

Run commands from the repository root. Cloudflare tooling requires Node.js 22+:

```sh
npm install
```

## Local development

The browser guestbook uses temporary in-memory data on localhost, including when
using `hugo server -D`. Reloading clears it; it never calls D1.

To exercise the actual API with a local D1 database:

```sh
npm run db:migrate:local
npm run dev
```

Call http://localhost:8788/api/guestbook directly; the browser UI still uses memory.
Local database state lives under `.wrangler/` and is not committed.

## Production

The database binding is already configured in `wrangler.jsonc`. Authenticate with
the Cloudflare account that owns it, then apply any pending migrations:

```sh
npx wrangler login
npm run db:migrate:remote
```

Ensure `name` in `wrangler.jsonc` matches your Cloudflare Pages project.

Redeploy the Pages project to activate the `GUESTBOOK_DB` binding and function.

Preview deployments inherit the database binding unless configured separately.
Use a separate D1 database under `env.preview` in `wrangler.jsonc` to keep preview
submissions out of the production guestbook.
