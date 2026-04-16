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
  description: `Render a premium A4 PDF from HTML content.

## Two valid input modes — choose based on report size:

### Mode A — HTML file (recommended for comprehensive reports)
Write the complete HTML to a \`.html\` file first using the Write tool, then call this tool with \`html_file\` pointing to that path.
- Use this when the report is large (multiple pages, rich data).
- The HTML file is automatically deleted after the PDF is rendered.
- No size limits — write as much HTML as needed.

### Mode B — Inline HTML (for short or simple documents)
Pass the complete HTML string directly as the \`html\` parameter.
- Use only when the HTML is small enough to fit comfortably in a parameter value.

## Requirements (both modes)
- Design for A4 print, not browser viewport behavior.
- Use the PDF skill HTML starter as the structural baseline.
- Remote URLs, CDN links, and script tags are auto-stripped — use only local or inline assets.
- If you need a watermark, embed ${"${ACCOUNT_ID}"} or ${"${WATERMARK}"} anywhere in the HTML or CSS.

The filename returned by this tool is the only valid PDF path. Do not announce a filename before calling this tool.`,
  args: {
    filename: tool.schema.string().describe("Desired output filename. It will be sanitized and forced to end in .pdf"),
    html_file: tool.schema.string().optional().describe("Absolute path to a .html file to render. The file will be read and deleted after rendering. Use this for large or comprehensive reports."),
    html: tool.schema.string().optional().describe("Complete HTML markup for the PDF document. Use only for short/simple documents. For comprehensive reports prefer html_file."),
    css: tool.schema.string().optional().describe("Optional extra CSS layered on top of the base print CSS"),
  },
  async execute(args, ctx) {
    let rawHtml: string
    let htmlFilePath: string | undefined

    if (args.html_file) {
      htmlFilePath = args.html_file
      rawHtml = await fs.readFile(htmlFilePath, "utf-8")
    } else if (args.html) {
      rawHtml = args.html
    } else {
      throw new Error("Either html or html_file must be provided")
    }

    const html = stripRemoteAssets(stripScripts(rawHtml))
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
      path: out,
      filename: name,
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

    // Delete the source HTML file if it was provided via html_file
    if (htmlFilePath) {
      await fs.unlink(htmlFilePath).catch(() => {})
    }

    if (code !== 0) {
      const msg = stderr.trim() || stdout.trim() || "Unknown PDF render error"
      throw new Error(`pdf failed: ${msg}`)
    }

    return `PDF created at ${name}`
  },
})
