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

function stripRemoteAssets(value: string) {
  return (
    value
      // Remove CSS @import of remote URLs (Google Fonts, CDN stylesheets, etc.)
      .replace(/@import\s+url\s*\(\s*['"]?https?:\/\/[^'")\s]+['"]?\s*\)\s*;?/gi, "/* remote @import removed */")
      .replace(/@import\s+['"]https?:\/\/[^'"]+['"]\s*;?/gi, "/* remote @import removed */")
      // Remove <link> tags pointing to remote stylesheets or fonts
      .replace(/<link\b[^>]*\bhref\s*=\s*['"]https?:\/\/[^'"]+['"][^>]*\/?>/gi, "<!-- remote link removed -->")
      // Replace remote url() references in CSS properties with empty (keeps property, drops remote src)
      .replace(/url\s*\(\s*['"]?https?:\/\/[^'")\s]+['"]?\s*\)/gi, "url('')")
      // Remove src/href attributes pointing to remote URLs on img, source, etc.
      .replace(/(<(?:img|source|image)\b[^>]*)\bsrc\s*=\s*['"]https?:\/\/[^'"]+['"]/gi, "$1 src=\"\"")
      // Remove file:// references
      .replace(/url\s*\(\s*['"]?file:\/\/[^'")\s]+['"]?\s*\)/gi, "url('')")
  )
}

function stripScripts(value: string) {
  return value.replace(/<script\b[\s\S]*?<\/script>/gi, "")
}

export default tool({
  description: `Render a premium A4 PDF from HTML and optional CSS passed directly as parameters.

IMPORTANT: Pass the complete HTML string as the \`html\` parameter. Do NOT write an HTML file to disk first. The HTML lives only as a parameter value — this tool handles rendering internally.

Use this tool as the single and final step to produce the PDF. Do not use Write, Edit, or any file tool to create intermediate HTML files.

Requirements:
- compose the full HTML in-memory and pass it here as the \`html\` parameter
- design for A4 print, not browser viewport behavior
- use the PDF skill HTML starter as the structural baseline
- remote URLs, CDN links, and script tags are auto-stripped — use only local or inline assets
- if you need a watermark, embed ${"${ACCOUNT_ID}"} or ${"${WATERMARK}"} anywhere in the HTML or CSS

The filename returned by this tool is the only valid PDF path. Do not announce a filename before calling this tool.`,
  args: {
    filename: tool.schema.string().describe("Desired output filename. It will be sanitized and forced to end in .pdf"),
    html: tool.schema.string().describe("Complete HTML markup for the PDF document"),
    css: tool.schema.string().optional().describe("Optional extra CSS layered on top of the base print CSS"),
  },
  async execute(args, ctx) {
    const html = stripRemoteAssets(stripScripts(args.html))
    const css = args.css ? stripRemoteAssets(args.css) : undefined
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
        html: html.replaceAll("${ACCOUNT_ID}", watermark).replaceAll("${WATERMARK}", watermark),
        css: css?.replaceAll("${ACCOUNT_ID}", watermark).replaceAll("${WATERMARK}", watermark),
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
