# Embed Multi-Tenant Progress

## Goal

Turn OpenCode into a single-service embeddable backend/frontend pair for iframe usage, with:

- Keycloak JWT auth
- multi-tenant isolation by external user id
- one fixed workspace root per tenant
- multiple chat sessions per tenant
- preconfigured MCP and model policy
- no project or server picking in the embedded frontend

## Chosen Direction

Use one backend service, not one process per user.

Use:

- `tenant_id = JWT.sub`
- one SQLite DB per tenant inside the same service
- one fixed workspace directory per tenant
- one embed bootstrap endpoint
- `packages/app-min` as the embedded frontend base

This is the simplest safe multi-tenant design without rewriting the whole storage layer to shared-table tenancy.

## Current Repo State

Implemented already:

- `packages/app-min` created as a copy of `packages/app`
- `packages/app-min` builds successfully
- `packages/app-min` passes typecheck
- `make web-min` starts:
  - backend on `127.0.0.1:4096`
  - frontend on `127.0.0.1:3001`
- initial UI cleanup done in `packages/app-min`
  - removed desktop-oriented settings tabs
  - removed debug bar
  - disabled titlebar-only theme side effect

## Important Runtime Notes

- frontend URL for minimified app: `http://localhost:3001`
- backend URL: `http://localhost:4096`
- opening `4096` directly in browser is incorrect for the minimified frontend

## Keycloak Reference Learned From Centauro

Reference project:

- `/home/metrofico/GolandProjects/centauro/shared/keycloak`

Important files:

- `keycloak_middleware.go`
- `keycloak_adapter.go`
- `keycloak_claims.go`
- `keycloak_config.go`

Observed validation pattern:

1. read `Authorization` header
2. require `Bearer <token>`
3. validate JWT locally using JWKS
4. optionally introspect token on a timed basis
5. place parsed user in request context

Most relevant details:

- local JWT validation via JWKS fetch in `keycloak_adapter.go`
- auth middleware in `keycloak_middleware.go`
- optional introspection caching in `keycloak_middleware.go`

## Recommended Auth Design Here

For this repo, replicate the same model in Node/Bun:

1. read bearer token from request
2. validate signature against Keycloak JWKS
3. validate:
   - issuer
   - expiration
   - intended audience and/or authorized party
4. derive tenant from:
   - `sub` as primary id
   - `preferred_username`, `email`, `name` as metadata only
5. attach tenant context to request

Expected tenant mapping:

- `tenant_id = claims.sub`

## Tenant Model

Per tenant:

- workspace root: `/data/tenants/<tenant_id>/workspace`
- db path: `/data/tenants/<tenant_id>/opencode.db`
- config path: `/data/tenants/<tenant_id>/config`
- state path: `/data/tenants/<tenant_id>/state`

This keeps one backend service while isolating user data physically.

## Backend Changes Planned

### 1. Tenant auth middleware

Add a backend middleware that:

- validates Keycloak JWT
- resolves `tenant_id`
- stores tenant info on request context

### 2. Tenant context

Introduce a tenant-scoped runtime context that resolves:

- tenant id
- workspace root
- db path
- config path
- policy flags

### 3. Embed bootstrap endpoint

Add something like:

- `POST /embed/bootstrap`

Behavior:

1. validate token
2. resolve tenant
3. create tenant storage if missing
4. ensure tenant root workspace exists
5. find last session
6. create initial session if missing
7. return iframe path or url

### 4. Root path enforcement

Backend must reject or ignore arbitrary project/directory changes.

Security rule:

- tenant can only operate inside its assigned root

### 5. Managed MCP/model policy

Use managed config and backend policy to:

- preload allowed MCPs
- set default local model
- deny arbitrary MCP additions from the embedded client

## Frontend Changes Planned

Base package:

- `packages/app-min`

Changes:

- add embed mode route bootstrapped from backend
- remove project picker
- remove server picker
- remove normal home flow
- load last or initial session directly
- later add:
  - MCP management entry point
  - session total token bar under chat

## Relevant Existing Repo References

Frontend project selection surfaces:

- `packages/app-min/src/pages/home.tsx`
- `packages/app-min/src/components/dialog-select-directory.tsx`

Frontend global project bootstrap:

- `packages/app-min/src/context/global-sync/bootstrap.ts`

Backend project listing:

- `packages/opencode/src/server/routes/project.ts`

Backend global state paths:

- `packages/opencode/src/global/index.ts`

Backend DB path resolution:

- `packages/opencode/src/storage/db.ts`

Backend config model:

- `packages/opencode/src/config/config.ts`

Flags already useful:

- `OPENCODE_DISABLE_PROJECT_CONFIG`
- `OPENCODE_CONFIG_DIR`
- `OPENCODE_CONFIG_CONTENT`
- `OPENCODE_PERMISSION`
- `OPENCODE_SERVER_PASSWORD`

## Immediate Next Steps

Completed now:

- added `Tenant` runtime context in `packages/opencode/src/tenant/index.ts`
- `Global.Path.*` now resolves per tenant when a tenant context exists
- `Database` now opens SQLite clients per resolved path instead of one singleton only
- added embed auth scaffold in `packages/opencode/src/server/embed.ts`
- added `POST /embed/bootstrap`
- `WorkspaceRouterMiddleware` now forces tenant workspace in embed mode
- added embed env flags in `packages/opencode/src/flag/flag.ts`

Still next:

1. run typecheck and fix integration issues
2. wire bearer auth into `packages/app-min`
3. add embed route handling in `packages/app-min`
4. remove project/server selection in embed mode
5. harden project/session listing surfaces for embed mode
6. add MCP policy/admin surface
7. add token usage totals under chat

## Open Decisions

These still need implementation choices in code:

- exact JWT library for Bun/Node runtime
- whether to validate `aud`, `azp`, or both
- exact embed URL shape
- exact persistence format for tenant metadata
- whether frontend gets raw iframe path or full URL from bootstrap

## Constraints To Remember

- hiding directory/project UI is not enough; backend enforcement is mandatory
- managed config alone is not enough to prevent all user overrides
- embedded mode must be backend-driven, not client-trusted
