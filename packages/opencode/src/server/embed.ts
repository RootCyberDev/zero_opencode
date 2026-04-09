import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"
import { describeRoute, resolver } from "hono-openapi"
import { createRemoteJWKSet, jwtVerify } from "jose"
import z from "zod"
import { Flag } from "@/flag/flag"
import { InstanceBootstrap } from "@/project/bootstrap"
import { Instance } from "@/project/instance"
import { Session } from "@/session"
import { Tenant } from "@/tenant"
import { lazy } from "@/util/lazy"

const claims = z.object({
  sub: z.string().min(1),
  iss: z.string().optional(),
  azp: z.string().optional(),
  aud: z.union([z.string(), z.array(z.string())]).optional(),
  exp: z.number().optional(),
  preferred_username: z.string().optional(),
  email: z.string().optional(),
  name: z.string().optional(),
})

let set: ReturnType<typeof createRemoteJWKSet> | undefined
let url: string | undefined

function bearer(value?: string | null) {
  if (!value) return
  const match = /^Bearer\s+(.+)$/.exec(value)
  return match?.[1]
}

function fail(status: 401 | 403, message: string) {
  return new HTTPException(status, {
    message,
    res: Response.json({ message }, { status }),
  })
}

function trim(value?: string) {
  return value?.replace(/\/+$/, "")
}

function realmUrl() {
  const base = trim(process.env.KEYCLOAK_URL)
  const realm = process.env.KEYCLOAK_REALM
  if (!base || !realm) return
  return `${base}/realms/${realm}`
}

function keys() {
  const next = Flag.OPENCODE_EMBED_JWKS_URL || `${realmUrl()}/protocol/openid-connect/certs`
  if (!next) throw new Error("OPENCODE_EMBED_JWKS_URL is required when embed auth is enabled")
  if (!set || url !== next) {
    set = createRemoteJWKSet(new URL(next))
    url = next
  }
  return set
}

function list(value?: string | string[]) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

async function verify(token: string) {
  const result = await jwtVerify(token, keys(), {
    issuer: Flag.OPENCODE_EMBED_ISSUER || realmUrl() || undefined,
  })
  const data = claims.parse(result.payload)
  if (!data.sub) throw fail(401, "invalid token subject")
  const aud = Flag.OPENCODE_EMBED_AUDIENCE
  if (aud && !list(data.aud).includes(aud)) throw fail(403, "invalid token audience")
  const azp = Flag.OPENCODE_EMBED_AZP
  if (azp && data.azp !== azp) throw fail(403, "invalid token client")
  return data
}

export async function EmbedAuth(input: { method: string; path: string; header?: string | null }) {
  if (!Flag.OPENCODE_EMBED) return
  if (input.method === "OPTIONS") return
  if (input.path === "/global/health" || input.path === "/doc") return
  const token = bearer(input.header)
  if (!token) throw fail(401, "missing bearer token")
  const data = await verify(token)
  return await Tenant.init(data.sub)
}

export const EmbedRoutes = lazy(() =>
  new Hono().post(
    "/bootstrap",
    describeRoute({
      summary: "Bootstrap embed session",
      description: "Resolve the tenant and open the latest root session for the embedded frontend.",
      operationId: "embed.bootstrap",
      responses: {
        200: {
          description: "Embed bootstrap info",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  tenant_id: z.string(),
                  session_id: z.string(),
                  workspace: z.string(),
                  path: z.string(),
                }),
              ),
            },
          },
        },
      },
    }),
    async (c) => {
      const info = Tenant.use()
      const data = await Instance.provide({
        directory: info.workspace,
        init: InstanceBootstrap,
        async fn() {
          const rows = Array.from(
            Session.list({
              directory: info.workspace,
              roots: true,
              limit: 1,
            }),
          )
          const item = rows[0] ?? (await Session.create(undefined))
          return {
            tenant_id: info.id,
            session_id: item.id,
            workspace: info.workspace,
            path: `/embed/session/${item.id}`,
          }
        },
      })
      return c.json(data)
    },
  ),
)
