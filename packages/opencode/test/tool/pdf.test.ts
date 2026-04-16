import { describe, expect, test } from "bun:test"
import fs from "fs/promises"
import path from "path"
import PdfTool from "../../../../.opencode/tool/pdf.ts"
import { tmpdir } from "../fixture/fixture"

const ctx = (dir: string) => ({
  sessionID: "ses_test_pdf",
  messageID: "msg_test_pdf",
  callID: "",
  agent: "build",
  abort: AbortSignal.any([]),
  messages: [],
  directory: dir,
  worktree: dir,
  metadata: () => {},
  ask: async () => {},
})

async function fonts(dir: string) {
  const src = path.join(import.meta.dir, "../../../../.opencode/assets/fonts")
  const dst = path.join(dir, ".opencode/assets/fonts")
  await fs.mkdir(dst, { recursive: true })
  await Promise.all([
    fs.copyFile(path.join(src, "PdfSans-Variable.ttf"), path.join(dst, "PdfSans-Variable.ttf")),
    fs.copyFile(path.join(src, "PdfSerif-Variable.ttf"), path.join(dst, "PdfSerif-Variable.ttf")),
    fs.copyFile(path.join(src, "PdfIcons-Outlined.ttf"), path.join(dst, "PdfIcons-Outlined.ttf")),
  ])
}

async function html(dir: string, name: string, body: string) {
  const file = path.join(dir, name)
  await fs.writeFile(
    file,
    `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Test PDF</title>
    <style>
      @page { size: A4; margin: 24mm 16mm 22mm 16mm; }
      body { font-family: "PdfSans", sans-serif; margin: 0; }
      .doc { width: 172mm; margin: 0 auto; }
    </style>
  </head>
  <body>
    <main class="doc">${body}</main>
  </body>
</html>`,
  )
  return file
}

describe("tool.pdf", () => {
  test("renders a pdf from a local html file", async () => {
    await using tmp = await tmpdir()
    await fonts(tmp.path)
    const src = await html(
      tmp.path,
      "sample.html",
      "<h1>Prueba PDF</h1><p>Este es un HTML local convertido a PDF.</p>",
    )

    const result = await PdfTool.execute(
      {
        filename: "sample.pdf",
        html_file: src,
      },
      ctx(tmp.path),
    )

    const out = path.join(tmp.path, "sample.pdf")
    const data = await fs.readFile(out)

    expect(result).toContain("sample.pdf")
    expect(data.subarray(0, 5).toString("utf8")).toBe("%PDF-")
    expect(data.length).toBeGreaterThan(1000)
    await expect(fs.stat(src)).rejects.toThrow()
  })

  test("renders html with glyphs and svg chart", async () => {
    await using tmp = await tmpdir()
    await fonts(tmp.path)
    const src = await html(
      tmp.path,
      "glyph-chart.html",
      `
      <section style="padding:8mm;">
        <p><span class="glyph glyph-user"></span> Icono local</p>
        <svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
          <rect x="10" y="60" width="20" height="20" fill="#1d4ed8"></rect>
          <rect x="40" y="40" width="20" height="40" fill="#1d4ed8"></rect>
          <rect x="70" y="20" width="20" height="60" fill="#1d4ed8"></rect>
          <text x="20" y="86" font-size="8" text-anchor="middle">A</text>
          <text x="50" y="86" font-size="8" text-anchor="middle">B</text>
          <text x="80" y="86" font-size="8" text-anchor="middle">C</text>
        </svg>
      </section>`,
    )

    const result = await PdfTool.execute(
      {
        filename: "glyph-chart.pdf",
        html_file: src,
      },
      ctx(tmp.path),
    )

    const out = path.join(tmp.path, "glyph-chart.pdf")
    const data = await fs.readFile(out)

    expect(result).toContain("glyph-chart.pdf")
    expect(data.subarray(0, 5).toString("utf8")).toBe("%PDF-")
    expect(data.length).toBeGreaterThan(1000)
    await expect(fs.stat(src)).rejects.toThrow()
  })
})
