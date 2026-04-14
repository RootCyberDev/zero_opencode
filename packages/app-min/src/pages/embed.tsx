import { Splash } from "@opencode-ai/ui/logo"
import { base64Encode } from "@opencode-ai/util/encode"
import { createEffect, createSignal, onMount, Show } from "solid-js"
import { useNavigate } from "@solidjs/router"
import { usePlatform } from "@/context/platform"
import { useServer } from "@/context/server"
import { embedPost, type EmbedBoot, setEmbedBoot, EMBED_READY_KEY } from "@/utils/embed"

const EMBED_READY_EVENT = "opencode-embed-ready"
let run:
  | {
      key: string
      promise: Promise<EmbedBoot>
    }
  | undefined

function setReady(value: boolean) {
  if (typeof sessionStorage === "undefined") return
  try {
    if (value) {
      sessionStorage.setItem(EMBED_READY_KEY, "1")
      if (typeof window === "object") window.dispatchEvent(new CustomEvent(EMBED_READY_EVENT))
      return
    }
    sessionStorage.removeItem(EMBED_READY_KEY)
    if (typeof window === "object") window.dispatchEvent(new CustomEvent(EMBED_READY_EVENT))
  } catch {
    return
  }
}

function text(error?: string) {
  if (!error) {
    return {
      title: "Abriendo sesion",
      detail: "Validando el acceso embebido.",
    }
  }

  if (/Missing embed token/i.test(error)) {
    return {
      title: "Sesion no valida",
      detail: "No se encontro un token de acceso para abrir esta sesion.",
    }
  }

  if (/Failed to fetch|401|403|invalid token|invalid token subject|invalid token audience|invalid token client|missing bearer token/i.test(error)) {
    return {
      title: "Sesion no valida",
      detail: "Tu sesion no es valida o ya expiro. Solicita un nuevo acceso.",
    }
  }

  return {
    title: "No se pudo abrir la sesion",
    detail: error,
  }
}

export default function EmbedPage() {
  const server = useServer()
  const platform = usePlatform()
  const nav = useNavigate()
  const [state, setState] = createSignal<{
    loading: boolean
    error?: string
    data?: EmbedBoot
  }>({
    loading: true,
  })

  onMount(() => {
    setReady(false)
    setEmbedBoot()
    const current = server.current
    const token = current?.http.token
    if (!current) {
      setState({ loading: false, error: "No server available" })
      return
    }
    if (!token) {
      setState({ loading: false, error: "Missing embed token" })
      return
    }

    const key = `${current.http.url}\n${token}`
    const promise =
      run?.key === key
        ? run.promise
        : ((run = {
            key,
            promise: (platform.fetch ?? fetch)(`${current.http.url}/embed/bootstrap`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }).then(async (res) => {
              if (!res.ok) {
                const body = await res.text().catch(() => "")
                throw new Error(body || `Embed bootstrap failed with ${res.status}`)
              }
              return (await res.json()) as EmbedBoot
            }),
          }).promise)

    void promise
      .then(async (res) => {
        setState({ loading: false, data: res })
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error)
        setState({ loading: false, error: message })
      })
  })

  createEffect(() => {
    const data = state().data
    if (!data) return
    setEmbedBoot(data)
    setReady(true)
    embedPost("openzero.ready", data)
    nav(`/${base64Encode(data.workspace)}/session/${data.session_id}`, { replace: true })
  })

  return (
    <div class="h-dvh w-screen flex flex-col items-center justify-center bg-background-base">
      <Show when={!state().loading} fallback={<Splash class="w-16 h-20 opacity-50 animate-pulse" />}>
        <div class="w-full max-w-md px-6">
          <div class="rounded-2xl border border-border-weak-base bg-surface-base p-6 text-center shadow-sm">
            <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-critical-muted">
              <div class="h-2.5 w-2.5 rounded-full bg-text-diff-delete-base" />
            </div>
            <h1 class="text-16-medium text-text-strong">{text(state().error).title}</h1>
            <p class="mt-2 text-14-regular text-text-weak">{text(state().error).detail}</p>
          </div>
        </div>
      </Show>
    </div>
  )
}
