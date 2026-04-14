import { checksum } from "@opencode-ai/util/encode"

const TOKEN_KEY = "opencode.embed.token"
export const EMBED_READY_KEY = "opencode.embed.ready"
const BOOT_KEY = "opencode.embed.boot"
const SOURCE = "openzero"
const PARENT = "openzero-parent"

export type EmbedBoot = {
  tenant_id: string
  session_id: string
  workspace: string
  path: string
}

export type EmbedEvent =
  | { source: typeof PARENT; type: "openzero.getSession"; requestId?: string }
  | { source: typeof PARENT; type: "openzero.prompt"; requestId?: string; text: string }
  | {
      source: typeof PARENT
      type: "openzero.action"
      requestId?: string
      action: "person_report_pdf"
      cedula: string
      autoDownload?: boolean
    }

export function embedToken() {
  if (typeof sessionStorage === "undefined") return
  return sessionStorage.getItem(TOKEN_KEY) ?? undefined
}

export function embed() {
  return !!embedToken()
}

export function embedStorage(key: string) {
  const token = embedToken()
  if (!token) return
  return `opencode.embed.${key}.${checksum(token) ?? "0"}.dat`
}

export function embedBoot() {
  if (typeof sessionStorage === "undefined") return
  const raw = sessionStorage.getItem(BOOT_KEY)
  if (!raw) return
  try {
    return JSON.parse(raw) as EmbedBoot
  } catch {
    return
  }
}

export function setEmbedBoot(value?: EmbedBoot) {
  if (typeof sessionStorage === "undefined") return
  if (!value) {
    sessionStorage.removeItem(BOOT_KEY)
    return
  }
  sessionStorage.setItem(BOOT_KEY, JSON.stringify(value))
}

function origin() {
  if (typeof document !== "object") return "*"
  if (!document.referrer) return "*"
  try {
    return new URL(document.referrer).origin
  } catch {
    return "*"
  }
}

export function embedPost(type: string, payload?: unknown) {
  if (typeof window !== "object") return
  if (window.parent === window) return
  window.parent.postMessage({ source: SOURCE, type, payload }, origin())
}

export function embedListen(callback: (event: EmbedEvent) => void) {
  if (typeof window !== "object") return () => {}
  const target = origin()
  const fn = (event: MessageEvent) => {
    if (target !== "*" && event.origin !== target) return
    if (!event.data || typeof event.data !== "object") return
    if ((event.data as { source?: string }).source !== PARENT) return
    callback(event.data as EmbedEvent)
  }
  window.addEventListener("message", fn)
  return () => window.removeEventListener("message", fn)
}
