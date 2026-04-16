/// <reference path="../env.d.ts" />
import { tool } from "@opencode-ai/plugin"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

function mark(dir: string) {
  const parts = dir.split(path.sep).filter(Boolean)
  const idx = parts.lastIndexOf("data")
  if (idx >= 0 && parts[idx + 1]) return parts[idx + 1]
  return parts.at(-2) || parts.at(-1) || "account"
}

function slug(value: string) {
  const base = value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
  return base || `document-${Date.now().toString().slice(-6)}`
}

function file(value: string) {
  const input = value.trim()
  const parsed = path.parse(input)
  const stem = slug(parsed.name || input.replace(/\.pdf$/i, ""))
  if (parsed.ext.toLowerCase() === ".pdf") return `${stem}.pdf`
  return `${stem}.pdf`
}

function guard(value: string) {
  const lower = value.toLowerCase()
  if (/<script\b/.test(lower)) throw new Error("pdf blocks script tags")
  if (/https?:\/\//.test(lower)) throw new Error("pdf blocks remote asset URLs")
  if (/file:\/\//.test(lower)) throw new Error("pdf blocks file URLs")
}

export default tool({
  description: `Render a premium A4 PDF from handcrafted HTML and optional CSS.

Use this tool whenever the user wants a visually polished PDF.

Workflow:
- write complete print-oriented HTML
- optionally add CSS overrides
- the tool renders the document to a real A4 PDF

Requirements:
- design for A4 print, not browser viewport behavior
- prefer semantic HTML, elegant hierarchy, whitespace, and modern table design
- use the PDF skill HTML starter as the baseline when helpful
- keep assets local or inline; remote URLs and script tags are blocked
- if you need watermark text, embed ${"${ACCOUNT_ID}"} or ${"${WATERMARK}"} in HTML/CSS

The saved PDF path inside the workspace is the contract.`,
  args: {
    filename: tool.schema.string().describe("Desired output filename. It will be sanitized and forced to end in .pdf"),
    html: tool.schema.string().describe("Complete HTML markup for the PDF document"),
    css: tool.schema.string().optional().describe("Optional extra CSS layered on top of the base print CSS"),
  },
  async execute(args, ctx) {
    guard(args.html)
    if (args.css) guard(args.css)
    const name = file(args.filename)
    const out = path.join(ctx.directory, name)
    const input = path.join("/tmp", `opencode-pdf-${Date.now()}-${Math.random().toString(36).slice(2)}.json`)
    const script = fileURLToPath(new URL("./pdf.py", import.meta.url))
    const watermark = mark(ctx.directory)

    await Bun.write(
      input,
      JSON.stringify({
        output: out,
        base: ctx.directory,
        html: args.html.replaceAll("${ACCOUNT_ID}", watermark).replaceAll("${WATERMARK}", watermark),
        css: args.css?.replaceAll("${ACCOUNT_ID}", watermark).replaceAll("${WATERMARK}", watermark),
      }),
    )

    ctx.metadata({
      title: "Rendering PDF",
      metadata: { path: out, filename: name },
    })

    const run = Bun.spawn(["python3", script, input], {
      cwd: ctx.directory,
      stderr: "pipe",
      stdout: "pipe",
      env: {
        PYTHONNOUSERSITE: "1",
      },
    })

    const [code, stderr, stdout] = await Promise.all([
      run.exited,
      new Response(run.stderr).text(),
      new Response(run.stdout).text(),
    ])

    await fs.unlink(input).catch(() => {})

    if (code !== 0) {
      const msg = stderr.trim() || stdout.trim() || "Unknown PDF render error"
      throw new Error(`pdf failed: ${msg}`)
    }

    return `PDF created at ${name}`
  },
})
