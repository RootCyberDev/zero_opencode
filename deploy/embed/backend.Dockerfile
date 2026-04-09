FROM oven/bun:1.3.11

WORKDIR /app

COPY package.json bun.lock ./
COPY packages/opencode/package.json packages/opencode/package.json
COPY packages/app-min/package.json packages/app-min/package.json
COPY packages/app/package.json packages/app/package.json
COPY packages/sdk/js/package.json packages/sdk/js/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/util/package.json packages/util/package.json
COPY packages/plugin/package.json packages/plugin/package.json
COPY packages/script/package.json packages/script/package.json

RUN bun install

COPY . .

ENV NODE_ENV=production
ENV OPENCODE_EMBED_ROOT=/data

EXPOSE 4096

CMD ["bun", "run", "--cwd", "packages/opencode", "src/index.ts", "serve", "--hostname", "0.0.0.0", "--port", "4096"]
