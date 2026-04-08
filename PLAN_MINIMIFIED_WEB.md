# Plan Minimified Web

## Goal

Create a simplified web app that stays visually and behaviorally close to the real OpenCode web product, but with fewer surfaces and less internal complexity.

The correct source base is `packages/app`.

`packages/web` is only the docs site and should not be used as the app base.

## Copy Base

Start by copying `packages/app` into a new package for the minimified web app.

Use the current web product files as the first source of truth:

- `packages/app/src/app.tsx`
- `packages/app/src/entry.tsx`
- `packages/app/src/pages/layout.tsx`
- `packages/app/src/pages/home.tsx`
- `packages/app/src/pages/session`
- `packages/app/src/components`
- `packages/app/src/context`
- `packages/app/src/hooks`
- `packages/app/src/utils`
- `packages/app/src/i18n`
- `packages/app/src/index.css`
- `packages/app/vite.config.ts`
- `packages/app/package.json`

## Keep First

These areas should remain initially so the minimified app still feels like the same OpenCode web:

- server connection boot and routing
- session list and session view
- prompt input and message timeline
- settings shell
- provider and model selection
- current visual language and shared UI primitives

## Remove Early

These are the first candidates to remove or defer after the copy:

- desktop-only branches and titlebar hooks
- nonessential settings tabs
- secondary status surfaces that duplicate the same controls
- advanced side panels that do not affect basic chat flow
- low-priority routes and onboarding extras
- anything only needed for docs, desktop, or test harnesses

## Architecture Notes

The minimified web should still talk to the same OpenCode HTTP backend used by the current app.

Relevant server wiring:

- `packages/app/src/entry.tsx`
- `packages/app/src/context/server.tsx`
- `packages/app/src/utils/server.ts`

## Initial Required Features

### 1. MCP management from the web app

Requirement:

The user must be able to configure or at least manage MCP servers from inside the web UI.

Current reusable pieces already exist:

- `packages/app/src/components/dialog-select-mcp.tsx`
- `packages/app/src/components/status-popover-body.tsx`
- `packages/app/src/context/global-sync/bootstrap.ts`

Plan:

- keep MCP status bootstrapping in the minimified app
- expose MCP management in an obvious place from the main web shell
- prefer a dedicated settings tab or a direct dialog entry point over hiding it behind status popovers only
- preserve connect and disconnect flows first
- evaluate auth and richer MCP configuration as a second pass if the backend already supports it

Definition of done:

- MCP list loads in the minimified app
- server status is visible
- connect and disconnect can be done from the UI without slash commands

### 2. Total session token usage below the chat

Requirement:

Show total token usage for the current session under the chat area.

Current reusable pieces already exist:

- `packages/app/src/components/session/session-context-metrics.ts`
- `packages/app/src/components/session-context-usage.tsx`
- `packages/app/src/pages/session/message-timeline.tsx`

Gap:

The current metrics helper returns the latest assistant context tokens and total session cost, but not a full session-wide token sum.

Plan:

- extend the metrics helper to compute session totals across assistant messages
- render a compact usage row under the chat timeline or composer area
- include at minimum total tokens
- if cheap to expose, also show input, output, reasoning, and total cost
- keep the current context usage indicator if it still fits the simplified layout

Definition of done:

- the active session shows a persistent token total below the chat
- the number updates as the session receives new assistant messages
- totals are derived from real message data, not duplicated client-only guesses

## Order

1. fork `packages/app` into the new minimified package
2. boot it with the same backend connection model
3. remove nonessential routes and surfaces without changing the visual language
4. add explicit MCP management entry point
5. add persistent total session token bar below chat
6. trim remaining complexity after those two product requirements are stable

## Non Goals For First Cut

- redesigning the product
- changing backend contracts
- replacing the current UI kit
- rebuilding from scratch instead of copying working app code
