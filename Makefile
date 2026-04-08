.PHONY: dev build install help backend web-backend web-app web

help:
	@echo "OpenCode Embed Commands:"
	@echo "  make install - Install dependencies"
	@echo "  make dev     - Start development server for the embed package"
	@echo "  make build   - Build the embed package for production"
	@echo "  make backend - Start the OpenCode web backend server"
	@echo "  make web-backend - Start the OpenCode web backend server"
	@echo "  make web-app - Start the OpenCode web frontend app"
	@echo "  make web     - Start backend and frontend for the real web app"

install:
	bun install

dev:
	bun --cwd packages/embed dev

build:
	bun turbo run build --filter=@opencode-ai/embed

backend:
	bun --cwd packages/opencode run dev -- serve

web-backend:
	bun --cwd packages/opencode run dev -- serve

web-app:
	bun run dev:web

web:
	@bash -lc 'set -euo pipefail; cd /home/metrofico/WebstormProjects/zero_opencode/packages/opencode; bun run dev -- serve & pid=$$!; trap "kill $$pid" EXIT INT TERM; cd /home/metrofico/WebstormProjects/zero_opencode; bun run dev:web'
