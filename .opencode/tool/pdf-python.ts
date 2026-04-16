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
  const next = slug(value)
  if (next.endsWith(".pdf")) return next
  return `${next}.pdf`
}

export default tool({
  description: `Execute Python code to generate a PDF in the current workspace.

Use this tool when the user needs a custom, non-static PDF layout and you need freedom beyond a fixed template.

Security model:
- the Python code is validated before execution
- dangerous imports and dangerous builtins are blocked
- execution is meant specifically for PDF/report generation, not general system access

Your code should:
- use reportlab/pypdf/pdfplumber or safe standard-library helpers
- write the final PDF to the provided OUTPUT path
- avoid shell access, file deletion, networking, subprocesses, and system calls

Available globals inside the executed code:
- OUTPUT: absolute output path for the PDF
- WATERMARK: account watermark text
- ACCOUNT_ID: same watermark/account identifier

Code requirements:
- return a complete, syntactically valid Python script
- do not return markdown fences unless unavoidable; fences are stripped, but plain code is preferred
- always write the final PDF to OUTPUT
- prefer Platypus and Paragraph/Table based layout for premium documents
- use the composition pattern from the PDF skill starter at .opencode/skills/pdf/STARTER.py as the structural baseline, then adapt it to the prompt
- avoid unnecessary imports; safe imports include reportlab, pypdf, pdfplumber, math, time, datetime, textwrap, re, json, decimal, statistics, itertools, collections, typing, pathlib

Recommended starter shape:
\`\`\`python
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    leftMargin=0.7 * inch,
    rightMargin=0.7 * inch,
    topMargin=0.7 * inch,
    bottomMargin=0.7 * inch,
)
\`\`\`

Return value should not be relied on; the file written to OUTPUT is the contract.`,
  args: {
    filename: tool.schema.string().describe("Desired output filename. It will be sanitized and forced to end in .pdf"),
    code: tool.schema
      .string()
      .describe("Python code that generates a PDF and writes it to the provided OUTPUT path"),
  },
  async execute(args, ctx) {
    const name = file(args.filename)
    const out = path.join(ctx.directory, name)
    const input = path.join("/tmp", `opencode-pdfpy-${Date.now()}-${Math.random().toString(36).slice(2)}.json`)
    const script = fileURLToPath(new URL("./pdf-python-runner.py", import.meta.url))
    const watermark = mark(ctx.directory)

    await Bun.write(
      input,
      JSON.stringify({
        filename: name,
        code: args.code,
        output: out,
        watermark,
      }),
    )

    ctx.metadata({
      title: "Executing PDF Python",
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
      const msg = stderr.trim() || stdout.trim() || "Unknown PDF python execution error"
      throw new Error(`pdf_python failed: ${msg}`)
    }

    return `PDF created at ${name}`
  },
})
