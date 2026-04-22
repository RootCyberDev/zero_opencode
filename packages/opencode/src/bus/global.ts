import { EventEmitter } from "events"

export const GlobalBus = new EventEmitter<{
  event: [
    {
      directory?: string
      payload: any
    },
  ]
}>()

// Each connected SSE client adds a listener. 10 is too low for multi-tenant
// deployments where many embedded clients subscribe concurrently.
GlobalBus.setMaxListeners(0)
