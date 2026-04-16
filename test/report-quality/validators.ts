/**
 * HTML Report Quality Validators
 *
 * Each validator takes the raw HTML string and returns a ValidationResult.
 * They are pure functions — no network, no filesystem, no side effects.
 *
 * When a validator fails it tells you exactly what rule in MASTER_PROMPT.md
 * or SKILL.md needs to be reinforced, and it shows the specific offending text.
 */

export type ValidationResult = {
  /** Human-readable check name */
  name: string
  /** true = OK, false = problem found */
  pass: boolean
  /** One-line summary of what went wrong (null when pass=true) */
  error: string | null
  /** Optional detail lines for debugging */
  details?: string[]
}

// ─── Helper ────────────────────────────────────────────────────────────────

function styleBlocks(html: string): string {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((m) => m[1])
    .join("\n")
}

function svgBlocks(html: string): string[] {
  return html.match(/<svg[\s\S]*?<\/svg>/g) ?? []
}

// ─── Individual validators ──────────────────────────────────────────────────

/**
 * V1 — No Cloudflare __cf_email__ obfuscation.
 * The AI sometimes converts emails to Cloudflare-protected anchors which
 * hide the address entirely in the rendered PDF.
 */
export function checkNoCloudflareEmails(html: string): ValidationResult {
  const hits = (html.match(/__cf_email__|data-cfemail=/g) ?? []).length
  return {
    name: "Emails not Cloudflare-obfuscated",
    pass: hits === 0,
    error: hits > 0 ? `${hits} Cloudflare-obfuscated email anchor(s) found — address hidden from PDF reader` : null,
  }
}

/**
 * V2 — No <script> tags.
 * Scripts are silently ignored by WeasyPrint and indicate the AI
 * copied patterns from a web page (e.g. Cloudflare email-decode script).
 */
export function checkNoScriptTags(html: string): ValidationResult {
  const hits = [...html.matchAll(/<script[^>]*>/gi)]
  return {
    name: "No <script> tags",
    pass: hits.length === 0,
    error: hits.length > 0 ? `${hits.length} <script> tag(s) found — scripts are ignored by WeasyPrint` : null,
    details: hits.slice(0, 3).map((m) => m[0]),
  }
}

/**
 * V3 — Charts use <rect> bars, not <line> fake-bars.
 * The AI sometimes uses vertical <line> elements from a shared y1 baseline
 * to mimic bars. These are not real bar charts.
 */
export function checkNoSvgLineBars(html: string): ValidationResult {
  const offenders: string[] = []
  for (const svg of svgBlocks(html)) {
    // Collect y1 values from all <line> elements in this SVG
    const lines = [...svg.matchAll(/<line[^>]+y1="(\d+(?:\.\d+)?)"[^>]*>/g)]
    if (lines.length < 3) continue // too few lines to be a bar chart pattern
    // If 3+ lines share the same y1, they're probably bars from a common baseline
    const y1Counts: Record<string, number> = {}
    for (const m of lines) y1Counts[m[1]] = (y1Counts[m[1]] ?? 0) + 1
    const maxShared = Math.max(...Object.values(y1Counts))
    if (maxShared >= 3) {
      offenders.push(`SVG has ${maxShared} <line> elements sharing y1="${Object.keys(y1Counts).find((k) => y1Counts[k] === maxShared)}" — likely fake bars`)
    }
  }
  return {
    name: "Charts use <rect> bars, not <line> fake-bars",
    pass: offenders.length === 0,
    error: offenders.length > 0 ? `${offenders.length} chart(s) use <line> elements as bars instead of <rect>` : null,
    details: offenders,
  }
}

/**
 * V4 — SVG charts that appear to be data charts have <rect> bars.
 * Complements V3: checks the positive — if there are SVGs with value labels
 * ($ or %) but no <rect>, that's a missing chart or a fake-bar chart.
 */
export function checkChartHasRectBars(html: string): ValidationResult {
  const offenders: string[] = []
  for (const svg of svgBlocks(html)) {
    const hasRect = /<rect\b/i.test(svg)
    const manyLines = (svg.match(/<line\b/gi) ?? []).length >= 4
    // Data label heuristic: text containing $ values or percentages
    const hasDataLabels = /\$[\d,]+|[\d]+%/.test(svg)
    if (!hasRect && manyLines && hasDataLabels) {
      offenders.push("SVG with data labels and many <line> elements but zero <rect> — not a real bar chart")
    }
  }
  return {
    name: "Data SVGs contain <rect> bar elements",
    pass: offenders.length === 0,
    error: offenders.length > 0 ? `${offenders.length} data SVG(s) missing <rect> bars` : null,
    details: offenders,
  }
}

/**
 * V5 — Age is calculated correctly from birth date.
 * Extracts birth date and report date from the HTML, computes expected age,
 * then finds all age mentions and flags mismatches.
 */
export function checkAgeConsistency(html: string): ValidationResult {
  // --- Extract birth date ---
  const bdPatterns = [
    // Table cell after "Fecha de Nacimiento" heading
    /Fecha de Nacimiento[\s\S]{0,200}?(\d{2})\/(\d{2})\/(\d{4})/i,
    // Naked date in any context mentioning birth
    /nacimiento[^0-9]{0,30}(\d{2})[\/\-](\d{2})[\/\-](\d{4})/i,
  ]
  let birthDay = 0, birthMonth = 0, birthYear = 0
  for (const p of bdPatterns) {
    const m = html.match(p)
    if (m) {
      birthDay = parseInt(m[1])
      birthMonth = parseInt(m[2])
      birthYear = parseInt(m[3])
      break
    }
  }
  if (!birthYear) {
    return { name: "Age calculation consistent with birth date", pass: true, error: null, details: ["Birth date not found in HTML — skipped"] }
  }

  // --- Extract report date ---
  const MONTHS: Record<string, number> = {
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
    julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
  }
  let reportDay = new Date().getDate()
  let reportMonth = new Date().getMonth() + 1
  let reportYear = new Date().getFullYear()

  const rdSpanish = html.match(/Generado el\s+(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i)
  const rdSlash = html.match(/Fecha de Reporte[:\s]+(\d{2})\/(\d{2})\/(\d{4})/i)
  if (rdSpanish) {
    const monthNum = MONTHS[rdSpanish[2].toLowerCase()]
    if (monthNum) {
      reportDay = parseInt(rdSpanish[1])
      reportMonth = monthNum
      reportYear = parseInt(rdSpanish[3])
    }
  } else if (rdSlash) {
    reportDay = parseInt(rdSlash[1])
    reportMonth = parseInt(rdSlash[2])
    reportYear = parseInt(rdSlash[3])
  }

  // --- Calculate expected age ---
  let expected = reportYear - birthYear
  if (reportMonth < birthMonth || (reportMonth === birthMonth && reportDay < birthDay)) expected--

  // --- Find all "N años" mentions and flag mismatches ---
  // Exclude known non-age values (e.g. "9 años de experiencia")
  const experiencePattern = /(\d+)\s*años\s+de\s+(?:trayectoria|experiencia)/gi
  const experienceValues = new Set([...html.matchAll(experiencePattern)].map((m) => parseInt(m[1])))

  const allMentions = [...html.matchAll(/(\d+)\s*[Aa]ños/g)]
  const wrong: string[] = []
  for (const m of allMentions) {
    const val = parseInt(m[1])
    if (experienceValues.has(val)) continue // it's an experience count, not an age
    if (val < 15 || val > 100) continue     // not a plausible age
    if (val !== expected) wrong.push(`"${m[0]}" found (expected ${expected})`)
  }

  return {
    name: `Age consistent with birth date (expected ${expected} years)`,
    pass: wrong.length === 0,
    error: wrong.length > 0 ? `${wrong.length} age mention(s) don't match calculated age (${expected})` : null,
    details: wrong,
  }
}

/**
 * V6 — No salary-doubling language.
 * The AI sometimes says "$2,500 en cada una de las dos empresas"
 * implying the person earns double. Per data rules, multiple employer
 * records are a timeline — the most recent is the current salary.
 */
export function checkNoSalaryDoubling(html: string): ValidationResult {
  const patterns: RegExp[] = [
    /\$[\d,]+\s+(?:mensuales?\s+)?(?:en\s+)?cada\s+una/i,
    /cada\s+una.*?\$[\d,]+/i,
    /ambas\s+(?:empresas?\s+)?(?:con\s+)?salario.*?\$[\d,]+\s+cada/i,
    /\$[\d,]+.*?por\s+empresa/i,
    /salario\s+en\s+(?:las\s+)?dos\s+empresas.*?\$[\d,]+\s+c/i,
  ]
  const found: string[] = []
  for (const p of patterns) {
    const m = html.match(p)
    if (m) found.push(m[0].replace(/<[^>]+>/g, "").trim().substring(0, 120))
  }
  return {
    name: "No salary-doubling language (two-employer ≠ two salaries)",
    pass: found.length === 0,
    error: found.length > 0 ? `Language implying per-company double salary found` : null,
    details: found,
  }
}

/**
 * V7 — No fixed height on html, body, .doc (causes 1-page PDFs).
 */
export function checkNoFixedHeightOnRoot(html: string): ValidationResult {
  const css = styleBlocks(html)
  const found: string[] = []
  const rulePattern = /(?:^|\})\s*(html|body|\.doc)\s*\{([^}]+)\}/gm
  for (const m of css.matchAll(rulePattern)) {
    const selector = m[1]
    const block = m[2]
    // Extract the height value explicitly and allow only "auto" and "none"
    const hm = block.match(/\bheight\s*:\s*([^;!\n]+)/i)
    if (!hm) continue
    const value = hm[1].trim().replace(/\s*!important\s*$/, "").trim()
    if (value === "auto" || value === "none") continue
    found.push(`${selector} { height: ${value} }`)
  }
  return {
    name: "No fixed height on html/body/.doc (prevents 1-page PDFs)",
    pass: found.length === 0,
    error: found.length > 0 ? `Fixed height on root element(s) — WeasyPrint will clip all content to one page` : null,
    details: found,
  }
}

/**
 * V8 — No min-height on .sheet or .page (causes cumulative page drift).
 * A 2mm overflow per sheet accumulates to 28mm misalignment by page 14.
 */
export function checkNoMinHeightOnSheet(html: string): ValidationResult {
  const css = styleBlocks(html)
  const found: string[] = []
  const rulePattern = /(?:^|\})\s*(\.sheet|\.page)\s*\{([^}]+)\}/gm
  for (const m of css.matchAll(rulePattern)) {
    if (/\bmin-height\s*:/.test(m[2])) {
      found.push(`${m[1]} { ...min-height: ${m[2].match(/min-height\s*:\s*([^;]+)/)?.[1]?.trim()}... }`)
    }
  }
  return {
    name: "No min-height on .sheet/.page (prevents cumulative page drift from page 14)",
    pass: found.length === 0,
    error: found.length > 0 ? `min-height on .sheet/.page causes cumulative page misalignment` : null,
    details: found,
  }
}

/**
 * V9 — Last page div is not empty (no trailing blank pages).
 */
export function checkNoEmptyLastPage(html: string): ValidationResult {
  // Match page/sheet divs (greedy last one)
  const matches = [...html.matchAll(/<div[^>]+class="(?:page|sheet)[^"]*">([\s\S]*?)<\/div>/gi)]
  if (matches.length === 0) return { name: "No empty trailing page", pass: true, error: null }

  const lastContent = matches[matches.length - 1][1]
  const text = lastContent.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()

  return {
    name: "Last page has substantive content (no blank trailing page)",
    pass: text.length >= 30,
    error: text.length < 30 ? `Last page has only ${text.length} chars of text — likely an empty trailing page` : null,
    details: text.length < 30 ? [`Content: "${text.substring(0, 80)}"`] : undefined,
  }
}

/**
 * V10 — No suspicious Spanish character sequences.
 * The AI model sometimes generates incorrect accents like "Síñales" (wrong)
 * instead of "Señales" (correct). Vowel + ñ sequences like "íñ" or "áñ"
 * in the middle of a word are not valid in standard Spanish.
 */
export function checkSpanishOrthography(html: string): ValidationResult {
  // Strip tags to inspect only visible text
  const text = html.replace(/<[^>]+>/g, " ")
  // Accented vowel immediately before ñ mid-word is not standard Spanish
  // e.g. "Síñal" — the sequence "íñ" doesn't exist in any common word
  const badPattern = /[áéíóúÁÉÍÓÚ]ñ|[áéíóúÁÉÍÓÚ]Ñ/g
  const hits = [...text.matchAll(badPattern)]
  const details = hits.slice(0, 5).map((m) => {
    const pos = m.index ?? 0
    return `"${text.slice(Math.max(0, pos - 5), pos + 10).trim()}"`
  })
  return {
    name: "No invalid Spanish accent+ñ sequences (e.g. 'Síñ' → 'Señ')",
    pass: hits.length === 0,
    error: hits.length > 0 ? `${hits.length} invalid accented sequence(s) found — model generated incorrect Spanish characters` : null,
    details,
  }
}

// ─── Session-context email contamination check ─────────────────────────────

/**
 * V10 — No operator/session email injected as subject data.
 * The AI can inadvertently pick up the `userEmail` context variable
 * and embed the operator's own email in the subject's contact section.
 * Pass in the operator email to detect this.
 */
export function checkNoSessionEmailContamination(html: string, operatorEmail: string): ValidationResult {
  if (!operatorEmail) return { name: "No session-email contamination", pass: true, error: null }
  const hits = (html.match(new RegExp(operatorEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")) ?? []).length
  return {
    name: "No session operator email injected as subject data",
    pass: hits === 0,
    error: hits > 0 ? `Operator email "${operatorEmail}" appears ${hits} time(s) in the report — this is contaminated data` : null,
  }
}

// ─── Run all ────────────────────────────────────────────────────────────────

export interface RunOptions {
  /** Operator/session email to check for contamination (e.g. "user@example.com") */
  operatorEmail?: string
}

export function runAll(html: string, opts: RunOptions = {}): ValidationResult[] {
  return [
    checkNoCloudflareEmails(html),
    checkNoScriptTags(html),
    checkNoSvgLineBars(html),
    checkChartHasRectBars(html),
    checkAgeConsistency(html),
    checkNoSalaryDoubling(html),
    checkNoFixedHeightOnRoot(html),
    checkNoMinHeightOnSheet(html),
    checkNoEmptyLastPage(html),
    checkSpanishOrthography(html),
    ...(opts.operatorEmail ? [checkNoSessionEmailContamination(html, opts.operatorEmail)] : []),
  ]
}
