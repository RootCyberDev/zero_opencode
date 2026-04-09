FROM oven/bun:1.3.11

WORKDIR /app

COPY package.json bun.lock ./
COPY patches patches
COPY packages/opencode/package.json packages/opencode/package.json
COPY packages/app-min/package.json packages/app-min/package.json
COPY packages/app/package.json packages/app/package.json
COPY packages/sdk/js/package.json packages/sdk/js/package.json
COPY packages/slack/package.json packages/slack/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/util/package.json packages/util/package.json
COPY packages/plugin/package.json packages/plugin/package.json
COPY packages/script/package.json packages/script/package.json
COPY packages/console/app/package.json packages/console/app/package.json
COPY packages/console/core/package.json packages/console/core/package.json
COPY packages/console/function/package.json packages/console/function/package.json
COPY packages/console/mail/package.json packages/console/mail/package.json
COPY packages/console/resource/package.json packages/console/resource/package.json

RUN bun install --ignore-scripts

COPY . .

ENV NODE_ENV=production
ENV OPENCODE_EMBED_ROOT=/data

EXPOSE 4096

CMD ["bun", "run", "--cwd", "packages/opencode", "src/index.ts", "serve", "--hostname", "0.0.0.0", "--port", "4096"]
