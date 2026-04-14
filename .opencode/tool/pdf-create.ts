/// <reference path="../env.d.ts" />
import { tool } from "@opencode-ai/plugin"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const accent = tool.schema.enum(["blue", "teal", "emerald", "slate"]).default("blue")

const section = tool.schema.object({
  heading: tool.schema.string().describe("Section title"),
  body: tool.schema.string().describe("Section content in plain text or markdown-like text"),
})

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
- sections for the main body

Returns the saved PDF path inside the workspace.`,
  args: {
    filename: tool.schema
      .string()
      .describe("Desired output filename. It will be sanitized and forced to end in .pdf"),
    title: tool.schema.string().describe("Primary PDF title"),
    subtitle: tool.schema.string().optional().describe("Short subtitle shown below the title"),
    summary: tool.schema.string().optional().describe("Executive summary block near the top of the document"),
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
        accent: args.accent,
        sections: args.sections,
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
