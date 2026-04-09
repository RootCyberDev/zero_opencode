import fs from "fs/promises"
import os from "os"
import path from "path"
import { xdgData } from "xdg-basedir"
import { Context } from "@/util/context"

const app = "opencode"

export namespace Tenant {
  export type Info = {
    id: string
    root: string
    data: string
    config: string
    state: string
    cache: string
    log: string
    bin: string
    workspace: string
    home: string
  }

  const ctx = Context.create<Info>("tenant")

  function base() {
    return process.env.OPENCODE_EMBED_ROOT || path.join(xdgData!, app, "tenant")
  }

  function clean(id: string) {
    return id.replace(/[^a-zA-Z0-9._-]/g, "-")
  }

  function make(id: string): Info {
    const root = path.join(base(), clean(id))
    const data = path.join(root, "data")
    const cache = path.join(root, "cache")
    const config = path.join(root, "config")
    const state = path.join(root, "state")
    return {
      id,
      root,
      data,
      cache,
      config,
      state,
      log: path.join(data, "log"),
      bin: path.join(cache, "bin"),
      workspace: path.join(root, "workspace"),
      home: process.env.OPENCODE_TEST_HOME || os.homedir(),
    }
  }

  export async function init(id: string) {
    const info = make(id)
    await Promise.all([
      fs.mkdir(info.data, { recursive: true }),
      fs.mkdir(info.cache, { recursive: true }),
      fs.mkdir(info.config, { recursive: true }),
      fs.mkdir(info.state, { recursive: true }),
      fs.mkdir(info.log, { recursive: true }),
      fs.mkdir(info.bin, { recursive: true }),
      fs.mkdir(info.workspace, { recursive: true }),
    ])
    return info
  }

  export function use() {
    return ctx.use()
  }

  export function current() {
    try {
      return ctx.use()
    } catch {
      return
    }
  }

  export function provide<R>(value: Info, fn: () => R) {
    return ctx.provide(value, fn)
  }
}
