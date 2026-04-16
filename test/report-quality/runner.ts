/**
 * Report Quality Integration Runner
 *
 * Connects to a running OpenCode server, creates a session, sends a PDF
 * report prompt, waits for the HTML file to be generated, then runs all
 * validators and prints a color-coded report.
 *
 * Usage:
 *   bun run test/report-quality/runner.ts                         → default cédula 0950804518
 *   bun run test/report-quality/runner.ts 1234567890              → specific cédula
 *   bun run test/report-quality/runner.ts --html=reporte-xxx.html → validate existing HTML only
 *   bun run test/report-quality/runner.ts --server=http://...     → custom server URL
 *
 * Exit codes:
 *   0 — all validators passed
 *   1 — one or more validators failed
 *   2 — runner error (server unreachable, timeout, etc.)
 */

import { readdir, stat } from "fs/promises"
import { resolve, join, basename } from "path"
import { runAll } from "./validators"
import type { ValidationResult } from "./validators"

// ─── Config ─────────────────────────────────────────────────────────────────

const PROJECT_DIR = resolve(import.meta.dir, "../..")
const DEFAULT_SERVER = "http://localhost:4096"
// Same cédula and prompt wording used in real production sessions
const DEFAULT_CEDULA = "0950804518"
const POLL_INTERVAL_MS = 4_000
const TIMEOUT_MS = 6 * 60 * 1000 // 6 minutes

// ANSI colors (disabled when NO_COLOR is set)
const USE_COLOR = !process.env.NO_COLOR
const c = {
  green: (s: string) => USE_COLOR ? `\x1b[32m${s}\x1b[0m` : s,
  red:   (s: string) => USE_COLOR ? `\x1b[31m${s}\x1b[0m` : s,
  yellow:(s: string) => USE_COLOR ? `\x1b[33m${s}\x1b[0m` : s,
  gray:  (s: string) => USE_COLOR ? `\x1b[90m${s}\x1b[0m` : s,
  bold:  (s: string) => USE_COLOR ? `\x1b[1m${s}\x1b[0m` : s,
}

// ─── CLI arg parsing ─────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const htmlArg     = args.find((a) => a.startsWith("--html="))?.slice(7)
const serverArg   = args.find((a) => a.startsWith("--server="))?.slice(9) ?? DEFAULT_SERVER
const operEmail   = args.find((a) => a.startsWith("--operator-email="))?.slice(17) ?? ""
const cedulaArg   = args.find((a) => /^\d{10}$/.test(a)) ?? DEFAULT_CEDULA
const promptArg   = args.find((a) => a.startsWith("--prompt="))?.slice(9)

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  let htmlPath: string

  if (htmlArg) {
    htmlPath = resolve(PROJECT_DIR, htmlArg)
    console.log(c.bold(`\n📋 Validating HTML: ${basename(htmlPath)}\n`))
  } else {
    console.log(c.bold(`\n🚀 Integration test — cédula ${cedulaArg}`))
    console.log(c.gray(`   Server : ${serverArg}`))
    console.log(c.gray(`   Project: ${PROJECT_DIR}\n`))
    htmlPath = await generateReport(cedulaArg, serverArg, promptArg)
  }

  // Warn if the HTML was written to a subdirectory (should always be project root)
  const relPath = htmlPath.replace(PROJECT_DIR + "/", "")
  if (relPath.includes("/")) {
    console.log(c.yellow(`\n⚠  HTML file is in a subdirectory: ${relPath}`))
    console.log(c.yellow(`   Expected: project root only. Add rule to MASTER_PROMPT.md.\n`))
  }

  const html = await Bun.file(htmlPath).text()
  const results = runAll(html, { operatorEmail: operEmail || undefined })
  printReport(results, htmlPath)

  const failed = results.filter((r) => !r.pass)
  process.exit(failed.length > 0 ? 1 : 0)
}

// ─── Integration: create session → prompt → wait for HTML ───────────────────

async function generateReport(cedula: string, serverUrl: string, customPrompt?: string): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-opencode-directory": PROJECT_DIR,
  }

  // 1. Create session
  log("Creating session...")
  const sessionRes = await fetch(`${serverUrl}/session`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  })
  if (!sessionRes.ok) throw new Error(`POST /session failed: ${sessionRes.status} ${await sessionRes.text()}`)
  const session = (await sessionRes.json()) as { id: string }
  log(`Session created: ${c.gray(session.id)}`)

  // 2. Start timer
  const startTime = Date.now()

  // 3. Send prompt — same wording as a real user session so the test is representative
  const prompt = customPrompt ?? `necesito un reporte completo de la cedula ${cedula}`
  log(`Sending prompt: "${prompt}"`)
  const promptRes = await fetch(`${serverUrl}/session/${session.id}/prompt_async`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      parts: [{ type: "text", text: prompt }],
    }),
  })
  if (promptRes.status !== 204) {
    throw new Error(`POST /prompt_async failed: ${promptRes.status} ${await promptRes.text()}`)
  }
  log("Prompt accepted — waiting for agent to generate HTML...")

  // 4. Poll for new HTML file
  const htmlPath = await pollForHtml(startTime, session.id, serverUrl, headers)
  log(c.green(`HTML generated: ${basename(htmlPath)}`))
  return htmlPath
}

// ─── Completion detection ────────────────────────────────────────────────────
//
// Strategy A: watch filesystem for new .html files (simple, reliable)
// Strategy B: check session messages for tool-result parts from "Write" tool
//
// We use A as primary and B as early-exit signal.

async function pollForHtml(
  startTime: number,
  sessionId: string,
  serverUrl: string,
  headers: Record<string, string>,
): Promise<string> {
  const deadline = startTime + TIMEOUT_MS
  let dots = 0

  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS)
    process.stdout.write(".")
    dots++
    if (dots % 15 === 0) process.stdout.write("\n")

    // Check filesystem for new HTML files
    const newHtml = await findNewestHtmlFile(PROJECT_DIR, startTime)
    if (newHtml) {
      process.stdout.write("\n")
      return newHtml
    }

    // Check if session errored out
    try {
      const msgRes = await fetch(`${serverUrl}/session/${sessionId}/message`, { headers })
      if (msgRes.ok) {
        const msgs = (await msgRes.json()) as Array<{ info: { role: string }; parts: Array<{ type: string; state?: { status: string } }> }>
        const lastAssistant = [...msgs].reverse().find((m) => m.info.role === "assistant")
        if (lastAssistant) {
          const hasError = lastAssistant.parts.some((p) => p.state?.status === "error")
          if (hasError) {
            process.stdout.write("\n")
            throw new Error("Session ended with tool error — no HTML generated")
          }
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes("Session ended")) throw e
      // Ignore fetch errors during polling
    }
  }

  process.stdout.write("\n")
  throw new Error(`Timeout after ${TIMEOUT_MS / 1000}s — no HTML file appeared in ${PROJECT_DIR}`)
}

async function findNewestHtmlFile(dir: string, newerThan: number): Promise<string | null> {
  try {
    const entries = await readdir(dir)
    const candidates: Array<{ path: string; mtime: number }> = []
    for (const name of entries) {
      if (!name.endsWith(".html")) continue
      const full = join(dir, name)
      const s = await stat(full)
      if (s.mtimeMs > newerThan) candidates.push({ path: full, mtime: s.mtimeMs })
    }
    if (candidates.length === 0) return null
    candidates.sort((a, b) => b.mtime - a.mtime)
    return candidates[0].path
  } catch {
    return null
  }
}

// ─── Report printer ──────────────────────────────────────────────────────────

function printReport(results: ValidationResult[], htmlPath: string) {
  const passed = results.filter((r) => r.pass)
  const failed = results.filter((r) => !r.pass)
  const line = "─".repeat(64)

  console.log(`\n${line}`)
  console.log(c.bold(`Report Quality — ${basename(htmlPath)}`))
  console.log(line)

  for (const r of results) {
    const icon = r.pass ? c.green("✅") : c.red("❌")
    console.log(`${icon}  ${r.name}`)
    if (!r.pass && r.error) {
      console.log(c.yellow(`    ↳ ${r.error}`))
      for (const d of r.details ?? []) {
        console.log(c.gray(`      • ${d}`))
      }
    }
  }

  console.log(line)
  const summary = `${passed.length} / ${results.length} checks passed`
  if (failed.length === 0) {
    console.log(c.green(c.bold(`✨  ${summary} — All good!\n`)))
  } else {
    console.log(c.red(c.bold(`⚠   ${summary}`)))
    console.log(c.yellow(`\n    ${failed.length} issue(s) detected.`))
    console.log(c.gray(`    Fix the rules in MASTER_PROMPT.md or SKILL.md, then re-run.\n`))
  }
}

// ─── Utils ───────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`  ${c.gray("›")} ${msg}`)
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

// ─── Entry ───────────────────────────────────────────────────────────────────

main().catch((e: unknown) => {
  console.error(c.red(`\n❌ Runner error: ${e instanceof Error ? e.message : String(e)}\n`))
  process.exit(2)
})
