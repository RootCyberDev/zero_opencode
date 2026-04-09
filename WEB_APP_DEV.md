# Web App Local Dev

The real OpenCode web app is `packages/app`.

`packages/web` is the docs site.

The web app needs two processes in local development:

1. The OpenCode HTTP server on `http://localhost:4096`
2. The Vite frontend on `http://localhost:3000`

## Quick Start

Run both from the repo root with:

```bash
make web
```

Open:

```text
http://localhost:3000
```

## Embed Mode

For the minimified embeddable app:

1. Create local env file:

```bash
cp .env.embed.example .env.embed
```

2. Adjust the values in `.env.embed`

Important fields:

- `OPENCODE_EMBED=1`
- `KEYCLOAK_URL`
- `KEYCLOAK_REALM`
- `OPENCODE_EMBED_AZP`

3. Start embed mode:

```bash
make web-min-embed
```

Open:

```text
http://localhost:3001/?token=YOUR_KEYCLOAK_ACCESS_TOKEN
```

Notes:

- the backend auto-loads `.env.embed` in `make web-backend-embed` and `make web-min-embed`
- if `OPENCODE_EMBED_ISSUER` and `OPENCODE_EMBED_JWKS_URL` are not set, OpenCode derives them from `KEYCLOAK_URL` and `KEYCLOAK_REALM`
- this matches the same Keycloak env structure already used in Centauro

## Manual Start

Backend:

```bash
make web-backend
```

Frontend:

```bash
make web-app
```

## Why `ERR_CONNECTION_REFUSED` happens

If the browser shows requests failing against `localhost:4096`, the frontend is up but the OpenCode backend is not running.

The frontend points to `localhost:4096` in dev:

- `packages/app/src/entry.tsx`

The backend must be started with the headless `serve` command:

- `packages/opencode/src/cli/cmd/serve.ts`

The correct local invocation is:

```bash
bun run --cwd packages/opencode dev -- serve --port 4096
```

The server listens on `4096` by default when available:

- `packages/opencode/src/server/server.ts`
