/**
 * Unit tests for HTML validators.
 *
 * Run with: bun test test/report-quality/validators.test.ts
 *
 * These tests are purely local — no server, no MCP, no LLM.
 * They verify that each validator correctly detects the exact
 * patterns that the AI generates when it makes a mistake.
 */

import { describe, test, expect } from "bun:test"
import {
  checkNoCloudflareEmails,
  checkNoScriptTags,
  checkNoSvgLineBars,
  checkChartHasRectBars,
  checkAgeConsistency,
  checkNoSalaryDoubling,
  checkNoFixedHeightOnRoot,
  checkNoMinHeightOnSheet,
  checkNoEmptyLastPage,
  checkSpanishOrthography,
  checkNoSessionEmailContamination,
  runAll,
} from "./validators"

// ─── V1: Cloudflare email obfuscation ────────────────────────────────────────

describe("checkNoCloudflareEmails", () => {
  test("PASS — plain text email", () => {
    expect(checkNoCloudflareEmails("<p>user@example.com</p>").pass).toBe(true)
  })

  test("FAIL — __cf_email__ class found", () => {
    const html = `<a class="__cf_email__" data-cfemail="abc123">[email protected]</a>`
    const r = checkNoCloudflareEmails(html)
    expect(r.pass).toBe(false)
    expect(r.error).toContain("obfuscated")
  })

  test("FAIL — data-cfemail attribute found", () => {
    const html = `<a href="#" data-cfemail="9eecf1f1">...</a>`
    expect(checkNoCloudflareEmails(html).pass).toBe(false)
  })
})

// ─── V2: Script tags ─────────────────────────────────────────────────────────

describe("checkNoScriptTags", () => {
  test("PASS — no scripts", () => {
    expect(checkNoScriptTags("<p>Hello</p>").pass).toBe(true)
  })

  test("FAIL — Cloudflare email decode script", () => {
    const html = `<script data-cfasync="false" src="/cdn-cgi/scripts/email-decode.min.js"></script>`
    const r = checkNoScriptTags(html)
    expect(r.pass).toBe(false)
    expect(r.details?.[0]).toContain("<script")
  })

  test("FAIL — any script tag", () => {
    expect(checkNoScriptTags('<script>alert(1)</script>').pass).toBe(false)
  })
})

// ─── V3: SVG <line> fake bars ────────────────────────────────────────────────

describe("checkNoSvgLineBars", () => {
  test("PASS — SVG with <rect> bars", () => {
    const html = `
      <svg viewBox="0 0 400 170">
        <rect x="48" y="120" width="54" height="25" fill="#3b82f6"/>
        <rect x="138" y="108" width="54" height="37" fill="#3b82f6"/>
        <rect x="228" y="92" width="54" height="53" fill="#2563eb"/>
      </svg>`
    expect(checkNoSvgLineBars(html).pass).toBe(true)
  })

  test("PASS — SVG with grid lines only (fewer than 3 sharing y1)", () => {
    const html = `
      <svg viewBox="0 0 400 170">
        <line x1="0" y1="35" x2="400" y2="35" stroke="#e5e7eb"/>
        <line x1="0" y1="79" x2="400" y2="79" stroke="#e5e7eb"/>
        <rect x="48" y="120" width="54" height="25" fill="#3b82f6"/>
      </svg>`
    expect(checkNoSvgLineBars(html).pass).toBe(true)
  })

  test("FAIL — 4+ lines sharing same y1 baseline (fake bar pattern)", () => {
    // The AI generates vertical lines from a baseline to represent bars
    const html = `
      <svg viewBox="0 0 600 150">
        <line x1="50" y1="112.5" x2="50" y2="100" stroke="#3b82f6"/>
        <line x1="100" y1="112.5" x2="100" y2="96" stroke="#3b82f6"/>
        <line x1="150" y1="112.5" x2="150" y2="90" stroke="#3b82f6"/>
        <line x1="200" y1="112.5" x2="200" y2="80" stroke="#166534"/>
        <line x1="250" y1="112.5" x2="250" y2="70" stroke="#166534"/>
      </svg>`
    const r = checkNoSvgLineBars(html)
    expect(r.pass).toBe(false)
    expect(r.error).toContain("<line>")
  })
})

// ─── V4: Chart has <rect> bars ───────────────────────────────────────────────

describe("checkChartHasRectBars", () => {
  test("PASS — SVG has rect bars", () => {
    const html = `
      <svg viewBox="0 0 420 170">
        <rect x="48" y="35" width="54" height="110" fill="#1d4ed8"/>
        <text x="75" y="31">$2,500</text>
      </svg>`
    expect(checkChartHasRectBars(html).pass).toBe(true)
  })

  test("PASS — SVG with only grid/baseline lines and no data labels (not a chart)", () => {
    const html = `
      <svg>
        <line x1="0" y1="145" x2="400" y2="145"/>
        <line x1="0" y1="100" x2="400" y2="100"/>
      </svg>`
    expect(checkChartHasRectBars(html).pass).toBe(true)
  })

  test("FAIL — SVG with $ labels and many lines but no rects", () => {
    const html = `
      <svg viewBox="0 0 600 150">
        <line x1="50" y1="112" x2="50" y2="90" stroke="#3b82f6"/>
        <line x1="100" y1="112" x2="100" y2="85" stroke="#3b82f6"/>
        <line x1="150" y1="112" x2="150" y2="75" stroke="#3b82f6"/>
        <line x1="200" y1="112" x2="200" y2="60" stroke="#3b82f6"/>
        <text x="75" y="145">$567</text>
        <text x="125" y="145">$850</text>
        <text x="175" y="145">$1,200</text>
        <text x="225" y="145">$2,500</text>
      </svg>`
    const r = checkChartHasRectBars(html)
    expect(r.pass).toBe(false)
  })
})

// ─── V5: Age consistency ─────────────────────────────────────────────────────

describe("checkAgeConsistency", () => {
  test("PASS — no birth date in HTML (skipped)", () => {
    expect(checkAgeConsistency("<p>Sin datos</p>").pass).toBe(true)
  })

  test("PASS — all age mentions match calculated age", () => {
    // Born 23/04/2000, report 16/04/2026 → 25 years
    const html = `
      <tr><th>Fecha de Nacimiento</th><td>23/04/2000</td></tr>
      <tr><th>Edad</th><td>25 años</td></tr>
      <p>Con 25 años de edad</p>
      <div class="chip">25 Años</div>
      Generado el 16 de abril de 2026`
    expect(checkAgeConsistency(html).pass).toBe(true)
  })

  test("FAIL — chip says 34 but calculated age is 25", () => {
    const html = `
      <tr><th>Fecha de Nacimiento</th><td>23/04/2000</td></tr>
      <tr><th>Edad</th><td>26 años</td></tr>
      <div class="chip">34 Años</div>
      Generado el 16 de abril de 2026`
    const r = checkAgeConsistency(html)
    expect(r.pass).toBe(false)
    expect(r.details?.some((d) => d.includes("34"))).toBe(true)
    expect(r.details?.some((d) => d.includes("26"))).toBe(true)
  })

  test("FAIL — says 26 but birthday is still upcoming (should be 25)", () => {
    const html = `
      <tr><th>Fecha de Nacimiento</th><td>23/04/2000</td></tr>
      <p>Con 26 años de edad al momento de este reporte</p>
      Generado el 16 de abril de 2026`
    const r = checkAgeConsistency(html)
    expect(r.pass).toBe(false)
    expect(r.error).toContain("25")
  })

  test("PASS — 9 años de experiencia is not treated as an age", () => {
    const html = `
      <tr><th>Fecha de Nacimiento</th><td>23/04/2000</td></tr>
      <p>Con 25 años de edad. Tiene 9 años de experiencia laboral.</p>
      Generado el 16 de abril de 2026`
    expect(checkAgeConsistency(html).pass).toBe(true)
  })
})

// ─── V6: Salary doubling language ────────────────────────────────────────────

describe("checkNoSalaryDoubling", () => {
  test("PASS — salary stated once as current", () => {
    const html = `<p>Salario actual: $2,500 mensuales (registro IESS más reciente)</p>`
    expect(checkNoSalaryDoubling(html).pass).toBe(true)
  })

  test("FAIL — 'cada una' pattern", () => {
    const html = `<p>$2,500 mensuales en cada una de las dos empresas</p>`
    expect(checkNoSalaryDoubling(html).pass).toBe(false)
  })

  test("FAIL — 'cada una' before dollar amount", () => {
    const html = `<p>Cada una paga $2,500 al mes</p>`
    expect(checkNoSalaryDoubling(html).pass).toBe(false)
  })
})

// ─── V7: Fixed height on root elements ───────────────────────────────────────

describe("checkNoFixedHeightOnRoot", () => {
  test("PASS — height: auto on body", () => {
    const html = `<style>body { height: auto; margin: 0; }</style>`
    expect(checkNoFixedHeightOnRoot(html).pass).toBe(true)
  })

  test("FAIL — height: 297mm on body (1-page PDF cause)", () => {
    const html = `<style>body { height: 297mm; overflow: hidden; }</style>`
    const r = checkNoFixedHeightOnRoot(html)
    expect(r.pass).toBe(false)
    expect(r.error).toContain("clip")
  })

  test("FAIL — height: 100% on html", () => {
    const html = `<style>html { height: 100%; font-size: 10pt; }</style>`
    expect(checkNoFixedHeightOnRoot(html).pass).toBe(false)
  })
})

// ─── V8: min-height on .sheet/.page ──────────────────────────────────────────

describe("checkNoMinHeightOnSheet", () => {
  test("PASS — no min-height", () => {
    const html = `<style>.sheet { width: 178mm; break-after: page; }</style>`
    expect(checkNoMinHeightOnSheet(html).pass).toBe(true)
  })

  test("FAIL — min-height on .sheet", () => {
    const html = `<style>.sheet { min-height: 251mm; width: 178mm; }</style>`
    const r = checkNoMinHeightOnSheet(html)
    expect(r.pass).toBe(false)
    expect(r.error).toContain("misalignment")
  })

  test("FAIL — min-height on .page", () => {
    const html = `<style>.page { min-height: 297mm; padding: 16mm; }</style>`
    expect(checkNoMinHeightOnSheet(html).pass).toBe(false)
  })
})

// ─── V9: Empty last page ──────────────────────────────────────────────────────

describe("checkNoEmptyLastPage", () => {
  test("PASS — no page divs at all", () => {
    expect(checkNoEmptyLastPage("<article>Content</article>").pass).toBe(true)
  })

  test("PASS — last page has content", () => {
    const html = `
      <div class="page">Page 1 with lots of content about the person</div>
      <div class="page">Page 2 with conclusions and analysis section</div>`
    expect(checkNoEmptyLastPage(html).pass).toBe(true)
  })

  test("FAIL — last page only has the date footer (< 30 chars of text)", () => {
    const html = `
      <div class="page">Page 1 with lots of substantive content about the person</div>
      <div class="page">
        <div class="doc-footer">16/04/2026</div>
      </div>`
    const r = checkNoEmptyLastPage(html)
    expect(r.pass).toBe(false)
    expect(r.error).toContain("empty")
  })
})

// ─── V10: Spanish orthography ────────────────────────────────────────────────

describe("checkSpanishOrthography", () => {
  test("PASS — valid Spanish text", () => {
    expect(checkSpanishOrthography("<h2>Señales Clave</h2><p>Información del sujeto</p>").pass).toBe(true)
  })

  test("PASS — valid words with ñ: año, señor, ñoño", () => {
    expect(checkSpanishOrthography("<p>año señor mañana otoño</p>").pass).toBe(true)
  })

  test("FAIL — 'Síñales' contains íñ sequence", () => {
    const r = checkSpanishOrthography("<h2>Síñales Clave</h2>")
    expect(r.pass).toBe(false)
    expect(r.error).toContain("invalid")
  })

  test("FAIL — 'áñadir' contains áñ sequence", () => {
    expect(checkSpanishOrthography("<p>Hay que áñadir más datos</p>").pass).toBe(false)
  })
})

// ─── Session email contamination ────────────────────────────────────────────

describe("checkNoSessionEmailContamination", () => {
  test("PASS — operator email not in report", () => {
    const html = `<p>Correo: joy_12lino@hotmail.com</p>`
    expect(checkNoSessionEmailContamination(html, "operator@example.com").pass).toBe(true)
  })

  test("FAIL — operator email appears in report", () => {
    const html = `<p>Correo del sujeto: operator@example.com</p>`
    const r = checkNoSessionEmailContamination(html, "operator@example.com")
    expect(r.pass).toBe(false)
    expect(r.error).toContain("operator@example.com")
  })

  test("PASS — no operator email provided (check skipped)", () => {
    expect(checkNoSessionEmailContamination("<p>any content</p>", "").pass).toBe(true)
  })
})

// ─── runAll ───────────────────────────────────────────────────────────────────

describe("runAll", () => {
  test("returns one result per validator", () => {
    const results = runAll("<p>clean html</p>")
    // 10 validators when no operatorEmail
    expect(results.length).toBe(10)
  })

  test("includes session email check when operatorEmail provided", () => {
    const results = runAll("<p>clean</p>", { operatorEmail: "x@y.com" })
    expect(results.length).toBe(11)
  })

  test("all pass on clean minimal HTML", () => {
    const results = runAll("<html><body><p>Hello world</p></body></html>")
    const failed = results.filter((r) => !r.pass)
    expect(failed.length).toBe(0)
  })

  test("multiple failures detected simultaneously", () => {
    const badHtml = `
      <style>body { height: 297mm; } .sheet { min-height: 251mm; }</style>
      <script src="email-decode.js"></script>
      <a class="__cf_email__" data-cfemail="abc">[email protected]</a>
      <tr><th>Fecha de Nacimiento</th><td>23/04/2000</td></tr>
      <p>Con 34 años de edad</p>
      <p>$2,500 mensuales en cada una</p>
      Generado el 16 de abril de 2026`
    const results = runAll(badHtml)
    const failed = results.filter((r) => !r.pass)
    expect(failed.length).toBeGreaterThanOrEqual(5)
  })
})
