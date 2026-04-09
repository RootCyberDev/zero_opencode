import { checksum } from "@opencode-ai/util/encode"

const TOKEN_KEY = "opencode.embed.token"

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
