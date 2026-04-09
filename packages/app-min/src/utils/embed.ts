export function embed() {
  if (typeof sessionStorage === "undefined") return false
  return !!sessionStorage.getItem("opencode.embed.token")
}
