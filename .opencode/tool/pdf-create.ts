/// <reference path="../env.d.ts" />
import { tool } from "@opencode-ai/plugin"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const accent = tool.schema.enum(["blue", "teal", "emerald", "slate"]).default("blue")

const section = tool.schema.object({
  heading: tool.schema.string().describe("Section title"),
  body: tool.schema.string().describe("Section content in plain text or markdown-like text"),
  kind: tool.schema
    .enum(["auto", "text", "facts", "table", "highlights"])
    .optional()
    .describe("Preferred rendering mode for this section"),
  rows: tool.schema
    .array(tool.schema.tuple([tool.schema.string(), tool.schema.string()]))
    .optional()
    .describe("Explicit table rows as [label, value]"),
  items: tool.schema.array(tool.schema.string()).optional().describe("Bullet-like highlight items"),
})

const meta = tool.schema
  .array(tool.schema.tuple([tool.schema.string(), tool.schema.string()]))
  .optional()
  .describe("Top document facts shown in an executive facts panel")

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
  const next = slug(value)
  if (next.endsWith(".pdf")) return next
  return `${next}.pdf`
}

export default tool({
  description: `Create a styled PDF document in the current workspace.

Use this tool when the user explicitly wants a PDF output. Prefer this tool over writing ad-hoc PDF generation code.

The tool expects structured content instead of raw HTML. Keep the text concise and organized:
- title for the document heading
- optional subtitle for secondary context
- optional summary for the executive overview block
- optional meta facts for the top facts panel
- sections for the main body

Sections can be richer than plain text:
- kind="facts" with rows
- kind="table" with rows
- kind="highlights" with items
- kind="text" or kind omitted for narrative content

Returns the saved PDF path inside the workspace.`,
  args: {
    filename: tool.schema
      .string()
      .describe("Desired output filename. It will be sanitized and forced to end in .pdf"),
    title: tool.schema.string().describe("Primary PDF title"),
    subtitle: tool.schema.string().optional().describe("Short subtitle shown below the title"),
    summary: tool.schema.string().optional().describe("Executive summary block near the top of the document"),
    meta,
    accent,
    sections: tool.schema.array(section).min(1).describe("Ordered content sections to render in the PDF"),
  },
  async execute(args, ctx) {
    const name = file(args.filename)
    const out = path.join(ctx.directory, name)
    const input = path.join("/tmp", `opencode-pdf-${Date.now()}-${Math.random().toString(36).slice(2)}.json`)
    const script = fileURLToPath(new URL("./pdf-create.py", import.meta.url))

    await Bun.write(
      input,
      JSON.stringify({
        filename: name,
        title: args.title,
        subtitle: args.subtitle,
        summary: args.summary,
        meta: args.meta,
        accent: args.accent,
        sections: args.sections,
        watermark: mark(ctx.directory),
        output: out,
      }),
    )

    ctx.metadata({
      title: "Creating PDF",
      metadata: { path: out, filename: name },
    })

    const run = Bun.spawn(["python3", script, input], {
      cwd: ctx.directory,
      stderr: "pipe",
      stdout: "pipe",
    })

    const [code, stderr, stdout] = await Promise.all([
      run.exited,
      new Response(run.stderr).text(),
      new Response(run.stdout).text(),
    ])

    await fs.unlink(input).catch(() => {})

    if (code !== 0) {
      const msg = stderr.trim() || stdout.trim() || "Unknown PDF generation error"
      throw new Error(`pdf_create failed: ${msg}`)
    }

    return `PDF created at ${name}`
  },
})
