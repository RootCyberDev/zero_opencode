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
  description: `Render an A4 PDF from an HTML file already written to disk.

## Standard flow (ALWAYS use this)

1. Write the complete HTML to a \`.html\` file using the Write tool.
2. Call this tool with \`html_file\` = the exact root filename of that file.
3. The tool reads the file, renders the PDF, and **deletes the HTML file automatically**.

**CRITICAL: do NOT regenerate or rewrite the HTML when calling this tool.**
**CRITICAL: do NOT pass the \`html\` inline parameter — use \`html_file\`.**
**CRITICAL: the PDF output is rendered from the file on disk, not from anything in context.**

The only thing this tool call needs is:
- \`filename\`: the desired PDF name
- \`html_file\`: the root HTML filename you already wrote

Nothing else. Do not produce HTML content here.

The filename returned by this tool is the only valid PDF path. Do not announce a filename before calling this tool.`,
  args: {
    filename: tool.schema.string().describe("Desired output filename. It will be sanitized and forced to end in .pdf"),
    html_file: tool.schema.string().describe("HTML filename already written to the project root. Absolute paths are tolerated, but the basename in the project root is preferred. The file is read, rendered to PDF, then deleted."),
    css: tool.schema.string().optional().describe("Optional extra CSS layered on top of the base print CSS"),
  },
  async execute(args, ctx) {
    const raw = args.html_file.trim()
    const root = path.join(ctx.directory, path.basename(raw))
    const htmlFilePath = path.isAbsolute(raw) ? raw : root
    const src = await fs
      .readFile(htmlFilePath, "utf-8")
      .then(() => htmlFilePath)
      .catch(async () => {
        if (root === htmlFilePath)
          throw new Error(
            `html source not found: ${htmlFilePath}. You must call the Write tool to save the HTML file to the project root BEFORE calling the pdf tool. Do not retry the pdf call — go back and write the HTML first, then call pdf once.`,
          )
        await fs.readFile(root, "utf-8")
        return root
      })
    const rawHtml = await fs.readFile(src, "utf-8")
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

    // Store the filename (relative to ctx.directory) — the /file/download endpoint
    // resolves paths relative to the project root, so an absolute path would 404.
    ctx.metadata({
      title: "Rendering PDF",
      metadata: { path: name, filename: name },
    })

    const run = Bun.spawn(["python3", script, input], {
      cwd: ctx.directory,
      stderr: "pipe",
      stdout: "pipe",
    })

    // 120-second hard timeout — if WeasyPrint hangs (e.g. on unreachable resources),
    // kill the process and surface a clear error instead of freezing the chat forever.
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => {
        run.kill()
        reject(new Error("PDF rendering timed out after 120 seconds. The HTML may reference unreachable resources."))
      }, 120_000),
    )

    const [code, stderr, stdout] = await Promise.race([
      Promise.all([
        run.exited,
        new Response(run.stderr).text(),
        new Response(run.stdout).text(),
      ]),
      timeout,
    ])

    await fs.unlink(input).catch(() => {})

    // Delete the source HTML file after rendering
    await fs.unlink(src).catch(() => {})

    if (code !== 0) {
      const msg = stderr.trim() || stdout.trim() || "Unknown PDF render error"
      throw new Error(`pdf failed: ${msg}`)
    }

    return `PDF created at ${name}`
  },
})
