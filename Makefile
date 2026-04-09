.PHONY: dev build install help backend web-backend web-app web web-min-app web-min web-min-embed web-backend-embed

help:
	@echo "OpenCode Embed Commands:"
	@echo "  make install - Install dependencies"
	@echo "  make dev     - Start development server for the embed package"
	@echo "  make build   - Build the embed package for production"
	@echo "  make backend - Start the OpenCode web backend server"
	@echo "  make web-backend - Start the OpenCode web backend server"
	@echo "  make web-app - Start the OpenCode web frontend app"
	@echo "  make web     - Start backend and frontend for the real web app"
	@echo "  make web-min-app - Start the minimified web frontend app"
	@echo "  make web-min - Start backend and frontend for the minimified web app"
	@echo "  make web-backend-embed - Start backend with .env.embed"
	@echo "  make web-min-embed - Start minimified web app with .env.embed"

install:
	bun install

dev:
	bun --cwd packages/embed dev

build:
	bun turbo run build --filter=@opencode-ai/embed

backend:
	bun run --cwd packages/opencode dev -- serve --port 4096

web-backend:
	bun run --cwd packages/opencode dev -- serve --port 4096

web-backend-embed:
	@bash -lc 'set -euo pipefail; cd /home/metrofico/WebstormProjects/zero_opencode; if [ -f .env.embed ]; then set -a; . ./.env.embed; set +a; fi; bun run --cwd packages/opencode dev -- serve --port 4096'

web-app:
	bun run dev:web

web:
	@bash -lc 'set -euo pipefail; cd /home/metrofico/WebstormProjects/zero_opencode; bun run --cwd packages/opencode dev -- serve --port 4096 & pid=$$!; trap "kill $$pid" EXIT INT TERM; bun run dev:web'

web-min-app:
	bun run dev:web:min

web-min:
	@bash -lc 'set -euo pipefail; cd /home/metrofico/WebstormProjects/zero_opencode; bun run --cwd packages/opencode dev -- serve --port 4096 & pid=$$!; trap "kill $$pid" EXIT INT TERM; bun run dev:web:min'

web-min-embed:
	@bash -lc 'set -euo pipefail; cd /home/metrofico/WebstormProjects/zero_opencode; if [ -f .env.embed ]; then set -a; . ./.env.embed; set +a; fi; bun run --cwd packages/opencode dev -- serve --port 4096 & pid=$$!; trap "kill $$pid" EXIT INT TERM; bun run dev:web:min'
