FROM oven/bun:1.3.11 AS build

WORKDIR /app

ARG VITE_OPENCODE_SERVER_URL=https://ozeroapi.centauro.host
ENV VITE_OPENCODE_SERVER_URL=${VITE_OPENCODE_SERVER_URL}

COPY package.json bun.lock ./
COPY packages/app-min/package.json packages/app-min/package.json
COPY packages/app/package.json packages/app/package.json
COPY packages/sdk/js/package.json packages/sdk/js/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/util/package.json packages/util/package.json
COPY packages/plugin/package.json packages/plugin/package.json
COPY packages/script/package.json packages/script/package.json
COPY packages/opencode/package.json packages/opencode/package.json

RUN bun install

COPY . .

RUN bun --cwd packages/app-min build

FROM caddy:2.8-alpine

COPY deploy/embed/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/packages/app-min/dist /srv

EXPOSE 8080
