import fs from "fs/promises"
import { xdgData, xdgCache, xdgConfig, xdgState } from "xdg-basedir"
import path from "path"
import os from "os"
import { Filesystem } from "../util/filesystem"
import { Tenant } from "@/tenant"

const app = "opencode"

const data = path.join(xdgData!, app)
const cache = path.join(xdgCache!, app)
const config = path.join(xdgConfig!, app)
const state = path.join(xdgState!, app)

export namespace Global {
  export const Base = {
    home: process.env.OPENCODE_TEST_HOME || os.homedir(),
    data,
    bin: path.join(cache, "bin"),
    log: path.join(data, "log"),
    cache,
    config,
    state,
  }

  export const Path = {
    get home() {
      return Tenant.current()?.home ?? Base.home
    },
    get data() {
      return Tenant.current()?.data ?? Base.data
    },
    get bin() {
      return Tenant.current()?.bin ?? Base.bin
    },
    get log() {
      return Tenant.current()?.log ?? Base.log
    },
    get cache() {
      return Tenant.current()?.cache ?? Base.cache
    },
    get config() {
      return Tenant.current()?.config ?? Base.config
    },
    get state() {
      return Tenant.current()?.state ?? Base.state
    },
  }
}

await Promise.all([
  fs.mkdir(Global.Base.data, { recursive: true }),
  fs.mkdir(Global.Base.config, { recursive: true }),
  fs.mkdir(Global.Base.state, { recursive: true }),
  fs.mkdir(Global.Base.log, { recursive: true }),
  fs.mkdir(Global.Base.bin, { recursive: true }),
])

const CACHE_VERSION = "21"

const version = await Filesystem.readText(path.join(Global.Base.cache, "version")).catch(() => "0")

if (version !== CACHE_VERSION) {
  try {
    const contents = await fs.readdir(Global.Base.cache)
    await Promise.all(
      contents.map((item) =>
        fs.rm(path.join(Global.Base.cache, item), {
          recursive: true,
          force: true,
        }),
      ),
    )
  } catch (e) {}
  await Filesystem.write(path.join(Global.Base.cache, "version"), CACHE_VERSION)
}
