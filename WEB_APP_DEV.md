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
