import { rm } from "fs/promises"
import { Instance } from "../../src/project/instance"
import { Database } from "../../src/storage/db"

export async function resetDatabase() {
  await Instance.disposeAll().catch(() => undefined)
  Database.close()
  await rm(Database.path(), { force: true }).catch(() => undefined)
  await rm(`${Database.path()}-wal`, { force: true }).catch(() => undefined)
  await rm(`${Database.path()}-shm`, { force: true }).catch(() => undefined)
}
