# owenps.com

Source for [owenps.com](https://owenps.com).

## Local development

Install [Hugo](https://gohugo.io/installation/), then run:

```sh
hugo server -D
```

Open http://localhost:1313.

## Deployment

Cloudflare Pages settings:

- Build root: repository root
- Build command: `hugo --minify`
- Output directory: `public`
- Environment variable (production and preview): `HUGO_VERSION=0.160.1`

For guestbook database setup, see [functions/api/README.md](functions/api/README.md).
