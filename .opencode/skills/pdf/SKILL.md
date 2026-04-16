---
name: pdf
description: Use this skill whenever the user wants to create, redesign, or export a PDF. In OpenZero, the canonical flow is HTML/CSS to A4 PDF through the single `pdf` tool.
license: Proprietary. LICENSE.txt has complete terms
---

# PDF Skill

## Canonical OpenZero Flow

In this project there is only one creation flow for premium PDFs:

1. Think editorially.
2. Compose a high-quality HTML document.
3. Add print-oriented CSS when needed.
4. Render the final file with the `pdf` tool.

Do not switch to ReportLab, Python PDF scripting, or alternative PDF generation paths. The PDF creation route in OpenZero is HTML/CSS to PDF.

## Tool Contract

Use the `pdf` tool with:

- `filename`
- `html`
- optional `css`

The tool will:

- render true A4 output
- preserve paged layout
- add page numbering through the base stylesheet
- return a real PDF file in the workspace

**Critical usage rule:** Pass the complete HTML document as the `html` parameter value — a string inline in the tool call. Do NOT use the `Write` tool, `Edit` tool, or any file operation to create an intermediate `.html` file before calling `pdf`. There is no intermediate file step. The workflow is: compose HTML → call `pdf` tool with that HTML as parameter → done.

## Design Rules

The HTML must be designed like a print document, not a responsive web page.

- Build for A4 from the start.
- Use semantic hierarchy:
  - header / hero
  - summary
  - facts
  - sections
  - tables
  - highlights
  - footer notes
- Prefer whitespace, rhythm, and restrained color over dense blocks.
- Use elegant, readable typography.
- Use subtle separators and soft surfaces instead of heavy borders.
- Keep tables clean and editorial, not spreadsheet-like.
- Avoid visual clutter.
- Avoid raw data dumps.
- Avoid a “generic office template” look.

## Editorial Blueprint

For executive PDFs, this is the default narrative order:

1. Eyebrow or label
2. Main title
3. Context subtitle
4. Executive summary
5. Key facts
6. Highlights / findings
7. Detailed sections
8. Tables only where they improve clarity
9. Closing note if useful

The document should feel like it was intentionally laid out by a human.

## A4 Layout Rules

- Respect A4 proportions at all times.
- The effective content area in this renderer is approximately:
  - width: `178mm`
  - height: `251mm`
- Do not design around infinite scroll assumptions.
- Avoid sections that visually collapse into tiny islands on the page.
- Avoid giant hero blocks that waste paper.
- Avoid leaving a heading stranded at the bottom of a page.
- Prefer balanced sections that fill pages naturally.
- Use `break-before`, `break-inside`, and table/header semantics when needed.
- When you need strong page control, structure the HTML with explicit `.sheet` wrappers.
- Treat each `.sheet` as one PDF page body.
- If a section should start on a new page, start a new `.sheet` or use `.page-break`.
- If a page should be visually full, use `.sheet sheet-fill`.
- If a page should be allowed to stay shorter, use `.sheet sheet-tight`.

## Visual Rules

- Use a restrained but variable palette.
- Do not lock yourself to one fixed set of colors.
- Choose colors using color harmony principles:
  - analogous
  - complementary
  - split-complementary
  - triadic, only when kept elegant and controlled
- Use one dominant tone, one support tone, and one restrained accent.
- Keep saturation controlled for executive documents.
- Prefer visual sophistication over “random colorful”.
- Ensure contrast is sufficient for readability in print.
- If the subject suggests a stronger or softer mood, adapt the palette intentionally.
- Use contrast to create hierarchy, not noise.
- Avoid thick black table borders.
- Avoid overusing bold text.
- Avoid default office-looking palettes and obvious template colors.
- Watermarks must be subtle.
- Footers must be quiet and professional.

## Visual Composition Prompt

When composing an executive PDF, think like an editorial designer, not like a data exporter.

The document may use any of these visual devices when they improve clarity:

- eyebrow labels
- section dividers
- chips
- badges
- metric pills
- callout cards
- highlight panels
- quote blocks
- fact grids
- two-column sections
- timeline rows
- comparison tables
- summary ribbons
- footer notes
- small CTA-like buttons used as decorative labels only

### Chips, Badges, and Small UI Elements

- Chips and badges should look editorial, not like a web app screenshot.
- Use them to classify status, categories, confidence, level, area, or business relevance.
- Keep them small, well-spaced, and visually restrained.
- Prefer rounded pills, soft fills, and concise text.
- Avoid loud colors or excessive contrast.
- Decorative button-like elements may be used as labels or emphasis blocks, but they should never dominate the page.

### Icons and Iconometry

- Icons are allowed when they clarify structure or add elegant visual signaling.
- Prefer inline SVG icons first.
- A local icon font may also be used if stored in project assets, never from a remote CDN.
- Icons should be small, aligned, and quiet.
- Use them in:
  - chips
  - badges
  - fact cards
  - callout headers
  - section labels
- Do not turn the PDF into a UI mockup full of icons.
- Iconography must support reading, not distract from it.

### Headers and Section Order

- Headings must create a strong reading path.
- The title, subtitle, and executive summary must feel intentionally grouped.
- Section headers must be clearly separated from body text.
- Use consistent vertical rhythm between sections.
- Do not let headers float awkwardly near page breaks.
- Keep the first page especially disciplined: title, context, summary, and immediate value.

### Paragraphs and Narrative Flow

- Use short to medium paragraphs.
- Prefer scannable blocks over dense walls of text.
- Vary paragraph length to create rhythm.
- Use bold sparingly and only for real emphasis.
- Narrative sections should interpret the facts, not merely repeat them.

### Tables

- Tables should be elegant and quiet.
- Use them only when tabular comparison improves clarity.
- Prefer subtle separators, soft row rhythm, and generous padding.
- Header rows should feel distinct but not heavy.
- Long values must wrap cleanly.
- Avoid spreadsheet aesthetics.
- **NEVER place a `<table>` inside a `.grid`, `.fact-grid`, `.metric-grid`, or any multi-column container.** Tables must live inside a `.table-wrap` which is a full-width block. Placing a table in a 2-column grid compresses it to half width — this is always wrong.
- Tables always use the full content-area width (178mm). Do not add `width` constraints on tables or `.table-wrap`.

### Facts, Cards, and Grids

- Key facts can be shown as:
  - cards
  - fact rows
  - metric chips
  - compact two-column grids
- Use cards when the data benefits from visual emphasis.
- Use fact rows when clarity and density matter more than drama.
- Use grid layouts only if they remain balanced on A4.

### Colorimetry

- The palette can vary per document.
- Pick colors intentionally based on mood, subject, and tone.
- Good palette logic includes:
  - one anchor color
  - one supporting neutral family
  - one accent color
  - soft surfaces and separator tones
- If the report should feel analytical, choose cooler controlled tones.
- If it should feel premium and human, warmer or richer tones may be used.
- If using stronger colors, keep the body content calmer so the page remains elegant.

### Layout Taste

- The result should feel like a premium briefing document.
- It may borrow the language of dashboards or product UI in a subtle way, but it must still read like a report.
- Use modern spacing, alignment, and compositional discipline.
- Every visual element must earn its place.
- Avoid clutter, repetition, and over-decoration.

## Report Narrative Structure

A professional executive report always follows a deliberate section order. Use this as the canonical structure:

### Page 1 — Cover and Executive Layer

1. **Eyebrow** — category or report type label
2. **H1** — full subject name or report title
3. **Subtitle** — context, period, or scope
4. **Executive summary block** — 2–4 sentences interpreting the overall conclusion, written in high-level corporate tone, not a data dump
5. **Chip row** — 3–5 classifiers: status, type, confidence, area. Always with SVG icons.
6. **Key facts grid** — 4–6 factual fields in a 2-column card layout

### Page 1 continuation or Page 2 — Signal Layer

7. **Highlights or findings** — 4–6 bullet points or a callout band: the most important interpretive findings
8. **Metrics** — fact-grid or metric-pills showing quantitative signals with icons in labels

### Page 2 or 3 — Detail Layer

9. **Detailed sections** (H2 each) — one per major topic area. Each section must have:
   - A topic heading (H2)
   - An optional H3 for sub-topics
   - A brief interpretive paragraph (2–4 sentences)
   - A visual element: table, chart, callout, or band
10. **Charts** — if numerical time-series or comparative data exists, render it as an SVG inline chart
11. **Comparison or summary table** — only if tabular comparison adds real clarity

### Last page — Closing Layer

12. **Conclusions or recommendations** (if applicable)
13. **Footer note** — data source, period covered, or editorial caveat

This order is not rigid, but skipping layers without reason produces thin documents. Each layer should feel complete before moving to the next.

## Typography and Heading Hierarchy

Apply these typographic rules consistently:

| Element | Style |
|---|---|
| Eyebrow | 9pt, uppercase, 0.18em tracking, accent color, bold |
| H1 | 22–26pt, serif font, primary color, line-height 1.1 |
| Subtitle | 10–11pt, muted color, normal weight |
| H2 | 12–14pt, primary color, bold, 9mm top margin |
| H3 | 10–11pt, primary color, semi-bold, 6mm top margin |
| Body | 10–10.5pt, normal weight, 1.5 line-height |
| Labels | 7.5–8pt, uppercase, 0.08em tracking, muted, bold |
| Captions | 8–8.5pt, muted, italic or normal |
| Footer notes | 8–8.5pt, muted |

Rules:
- Never place an H2 at the bottom of a page with no content following it — use `break-after: avoid-page`.
- Never place an H3 orphaned from its section body.
- Never let the H1 compete visually with an H2 — the size gap must be clear.
- Use the serif font (PdfSerif) for H1. Use the sans font (PdfSans) for all other headings and body.
- Never bold entire paragraphs. Bold is for single terms or short key phrases only.

## Charts and Data Visualization

When the data includes numerical, time-based, or comparative values, render an inline SVG chart. Do not skip this step if the data supports it.

### When to use charts

- Use a **bar chart** for comparisons across categories or periods.
- Use a **horizontal bar chart** when labels are long.
- Use a **line or area chart** for time series trends.
- Use a **donut chart** for single proportional splits (max 4–5 segments).
- Do NOT use pie charts for more than 5 segments — use a table instead.
- Do NOT use charts for data that is already well-expressed by a metrics grid.

### Chart design rules

- Charts must be inline SVG — no external images, no canvas, no script-based charting libraries.
- Always include: axis labels, value labels on bars or points, a baseline, and a title or caption.
- Chart colors must match the document palette — use `fill` values consistent with `--accent`, `--primary`, or their tints.
- Keep SVG charts at natural proportions: bar charts ~420×170 viewBox, line charts ~420×140, donuts ~200×200.
- Always set `style="width:100%;height:auto;"` on the SVG so it scales to the content area.
- Wrap each chart in a `<div class="chart-wrap">` for spacing.

### Chart math — MANDATORY proportional calculation

**The number of bars in the SVG MUST equal exactly the number of data points. Never more, never less.**

Before writing any SVG, compute the bar geometry from the real data:

```
GIVEN: values = [v1, v2, v3, ...vN]   ← your actual data
CONSTANTS:
  maxBarH  = 110   ← tallest bar height in viewBox units
  baseline = 145   ← y coordinate of the x-axis line
  maxValue = max(values)

FOR EACH value[i]:
  barHeight[i] = round( (value[i] / maxValue) * maxBarH )
  barY[i]      = baseline - barHeight[i]
  labelY[i]    = barY[i] - 4            ← value label above bar
  slotWidth    = floor(360 / N)         ← distribute bars evenly
  barWidth     = round(slotWidth * 0.6) ← bar is 60% of slot
  barX[i]      = 30 + i * slotWidth + round(slotWidth * 0.2)
  labelX[i]    = barX[i] + round(barWidth / 2)  ← centered
```

Example — values = [45, 120, 80, 200], N=4, maxValue=200:

| i | value | barHeight | barY | barX | labelX |
|---|-------|-----------|------|------|--------|
| 0 | 45    | 25        | 120  | 48   | 75     |
| 1 | 120   | 66        | 79   | 138  | 165    |
| 2 | 80    | 44        | 101  | 228  | 255    |
| 3 | 200   | 110       | 35   | 318  | 345    |

**Never copy the example SVG code verbatim** — always recompute every `x`, `y`, `height`, and label from real data using the formula above.

### Bar chart example

```html
<div class="chart-wrap" style="margin-top:5mm;">
  <svg viewBox="0 0 420 170" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
    <!-- Baseline -->
    <line x1="20" y1="145" x2="400" y2="145" stroke="#d9e2ec" stroke-width="1"/>
    <!-- Bars — adjust x, y, height per real data -->
    <rect x="40"  y="55"  width="55" height="90" rx="2" fill="#1d4ed8" opacity="0.85"/>
    <rect x="120" y="95"  width="55" height="50" rx="2" fill="#1d4ed8" opacity="0.65"/>
    <rect x="200" y="35"  width="55" height="110" rx="2" fill="#1d4ed8" opacity="0.85"/>
    <rect x="280" y="75"  width="55" height="70" rx="2" fill="#1d4ed8" opacity="0.65"/>
    <!-- Value labels -->
    <text x="67"  y="50"  text-anchor="middle" font-family="Liberation Sans,sans-serif" font-size="9" font-weight="700" fill="#1d4ed8">90</text>
    <text x="147" y="90"  text-anchor="middle" font-family="Liberation Sans,sans-serif" font-size="9" font-weight="700" fill="#1d4ed8">50</text>
    <text x="227" y="30"  text-anchor="middle" font-family="Liberation Sans,sans-serif" font-size="9" font-weight="700" fill="#1d4ed8">110</text>
    <text x="307" y="70"  text-anchor="middle" font-family="Liberation Sans,sans-serif" font-size="9" font-weight="700" fill="#1d4ed8">70</text>
    <!-- Category labels -->
    <text x="67"  y="160" text-anchor="middle" font-family="Liberation Sans,sans-serif" font-size="8.5" fill="#64748b">Ene</text>
    <text x="147" y="160" text-anchor="middle" font-family="Liberation Sans,sans-serif" font-size="8.5" fill="#64748b">Feb</text>
    <text x="227" y="160" text-anchor="middle" font-family="Liberation Sans,sans-serif" font-size="8.5" fill="#64748b">Mar</text>
    <text x="307" y="160" text-anchor="middle" font-family="Liberation Sans,sans-serif" font-size="8.5" fill="#64748b">Abr</text>
  </svg>
  <p style="font-size:8pt;color:#64748b;margin:2mm 0 0;">Fig. 1 — Valores por período</p>
</div>
```

### Horizontal bar chart example (for ranked lists or comparisons)

```html
<div class="chart-wrap" style="margin-top:5mm;">
  <svg viewBox="0 0 420 130" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
    <line x1="110" y1="10" x2="110" y2="120" stroke="#d9e2ec" stroke-width="1"/>
    <!-- Bars -->
    <rect x="112" y="12"  width="200" height="20" rx="2" fill="#1d4ed8" opacity="0.85"/>
    <rect x="112" y="42"  width="140" height="20" rx="2" fill="#1d4ed8" opacity="0.70"/>
    <rect x="112" y="72"  width="240" height="20" rx="2" fill="#1d4ed8" opacity="0.85"/>
    <rect x="112" y="102" width="90"  height="20" rx="2" fill="#1d4ed8" opacity="0.55"/>
    <!-- Labels left -->
    <text x="105" y="27"  text-anchor="end" font-family="Liberation Sans,sans-serif" font-size="8.5" fill="#475569">Categoría A</text>
    <text x="105" y="57"  text-anchor="end" font-family="Liberation Sans,sans-serif" font-size="8.5" fill="#475569">Categoría B</text>
    <text x="105" y="87"  text-anchor="end" font-family="Liberation Sans,sans-serif" font-size="8.5" fill="#475569">Categoría C</text>
    <text x="105" y="117" text-anchor="end" font-family="Liberation Sans,sans-serif" font-size="8.5" fill="#475569">Categoría D</text>
    <!-- Values right -->
    <text x="317" y="27"  font-family="Liberation Sans,sans-serif" font-size="8.5" font-weight="700" fill="#1d4ed8">200</text>
    <text x="257" y="57"  font-family="Liberation Sans,sans-serif" font-size="8.5" font-weight="700" fill="#1d4ed8">140</text>
    <text x="357" y="87"  font-family="Liberation Sans,sans-serif" font-size="8.5" font-weight="700" fill="#1d4ed8">240</text>
    <text x="207" y="117" font-family="Liberation Sans,sans-serif" font-size="8.5" font-weight="700" fill="#1d4ed8">90</text>
  </svg>
</div>
```

### Donut chart example (proportional split)

```html
<div class="chart-wrap" style="margin-top:5mm;display:flex;align-items:center;gap:8mm;">
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style="width:50mm;height:50mm;flex:0 0 auto;">
    <!-- Donut segments — computed as SVG arc paths. cx=60,cy=60,r=45,stroke-width=22 -->
    <!-- Segment 1: 60% = 216deg -->
    <circle cx="60" cy="60" r="45" fill="none" stroke="#1d4ed8" stroke-width="22"
      stroke-dasharray="169.6 113.1" stroke-dashoffset="0" transform="rotate(-90 60 60)" opacity="0.85"/>
    <!-- Segment 2: 25% = 90deg -->
    <circle cx="60" cy="60" r="45" fill="none" stroke="#1d4ed8" stroke-width="22"
      stroke-dasharray="70.7 211.9" stroke-dashoffset="-169.6" transform="rotate(-90 60 60)" opacity="0.45"/>
    <!-- Segment 3: 15% = 54deg -->
    <circle cx="60" cy="60" r="45" fill="none" stroke="#64748b" stroke-width="22"
      stroke-dasharray="42.4 240.3" stroke-dashoffset="-240.3" transform="rotate(-90 60 60)" opacity="0.55"/>
    <!-- Center label -->
    <text x="60" y="56" text-anchor="middle" font-family="Liberation Sans,sans-serif" font-size="14" font-weight="700" fill="#102a43">60%</text>
    <text x="60" y="68" text-anchor="middle" font-family="Liberation Sans,sans-serif" font-size="7.5" fill="#64748b">principal</text>
  </svg>
  <!-- Legend -->
  <div style="font-family:Liberation Sans,sans-serif;font-size:8.5pt;line-height:1.8;">
    <div><span style="display:inline-block;width:8px;height:8px;background:#1d4ed8;opacity:.85;border-radius:2px;margin-right:4px;"></span> Categoría A — 60%</div>
    <div><span style="display:inline-block;width:8px;height:8px;background:#1d4ed8;opacity:.45;border-radius:2px;margin-right:4px;"></span> Categoría B — 25%</div>
    <div><span style="display:inline-block;width:8px;height:8px;background:#64748b;opacity:.55;border-radius:2px;margin-right:4px;"></span> Categoría C — 15%</div>
  </div>
</div>
```

### Chart CSS to add

```css
.chart-wrap {
  margin-top: 5mm;
  break-inside: avoid-page;
}
```

## Content Rules

- The summary must interpret, not dump data.
- The most important conclusions must be easy to scan.
- Identity facts must be exact.
- Do not change, “normalize”, or invent names, surnames, dates, identifiers, or locations.
- If the source data is ambiguous, state the ambiguity instead of silently rewriting it.
- Prioritize the most important identity and business-relevant facts.
- Do not waste prime space on trivial or low-signal details.
- Long numeric identifiers should not dominate the first screen/page unless specifically required.
- Tables should be used to clarify facts, not to replace narrative reasoning.
- If a section is better expressed as bullets, use bullets.
- If a section is better expressed as cards or fact rows, use those.

## Tool Use Preflight

Before calling `pdf`, do this check:

1. Draft the HTML/CSS.
2. Remove any `<script>` tags.
3. Remove or replace any remote URLs.
4. Verify the document still reads cleanly as A4 print content.
5. Only then call the tool.

## File Name Rule

- Do not invent or announce the output filename before the tool responds.
- The only valid PDF filename is the exact filename returned by the `pdf` tool.
- If the tool fails, do not pretend a file exists.
- Retry only after fixing the HTML/CSS or filename input.

## HTML Starter

Use `skills/pdf/STARTER.html` as the baseline when helpful.

That starter is not a fixed template. It is a composition baseline:

- hero
- summary
- facts
- highlights
- editorial table

Adapt it to the case. Do not copy it mechanically.

### Page Authoring Model

For reliable page planning, prefer this mental model:

```html
<main class="doc">
  <section class="sheet">
    ... page 1 content ...
  </section>
  <section class="sheet">
    ... page 2 content ...
  </section>
</main>
```

This is the safest way to make the HTML correspond to real A4 pages.

## CSS Rules

- Keep CSS print-oriented.
- Prefer local styles in the document or the optional `css` field.
- Use local font files from the project whenever you need a custom family.
- Prefer `@font-face` with local `.woff2`, `.woff`, or `.ttf` files stored in `.opencode/assets/fonts/`.
- If you use fixed headers or fixed footers, reserve vertical space for them. They must never collide with content.
- Protect headings, summary blocks, cards, and tables from ugly page breaks.
- Do not use remote CSS or remote font URLs.
- Do not use script tags.
- Do not rely on browser-only interaction behavior.

## Fonts

For premium PDFs, custom fonts should be served from local assets, not Google Fonts.

Recommended font asset location:

- `.opencode/assets/fonts/`

Recommended approach:

```css
@font-face {
  font-family: "Brand Sans";
  src: url("./.opencode/assets/fonts/BrandSans-Variable.ttf") format("truetype");
  font-weight: 200 800;
  font-style: normal;
}
```

Then use the family normally in the document.

## Watermark

If a subtle account watermark is needed, embed:

- `${ACCOUNT_ID}`
or
- `${WATERMARK}`

inside the HTML or CSS. The tool will replace it.

## Page Density Rules

These rules prevent the most common layout failures:

- Each `.sheet` must contain enough content to visually fill most of an A4 page — typically 2–4 substantial sections.
- Do NOT create one `.sheet` per small section. A `.sheet` with a single heading and 3 bullet points leaves the rest of the page blank.
- If a section has very little content, combine it with the next section in the same `.sheet`.
- A well-filled A4 page should not have more than ~25mm of trailing white space.
- Do NOT use `.sheet-fill` on a sparse page — it only amplifies the blank space problem.

## Mandatory Structure — Page 1

The first page must always open with all of these, in this order:

1. `.eyebrow` — category label
2. `h1` — main title
3. `.subtitle` — context or period
4. `.summary` block — executive interpretation
5. `.chip-row` — at least 2 chips or badges with icons

Skipping any of these is a layout failure.

## Icon Rules

Icons are mandatory in:

- every `.chip`, `.badge`, `.metric-pill`, and `.action-tag`
- every `.callout` header when the content warrants it
- every `.label` inside a `.fact-grid` or `.metric-grid`

Always use inline SVG for icons — they are reliable in WeasyPrint.

**CRITICAL — icon sizing rule:** Always put `class="icon"` directly on the `<svg>` element, never on a wrapping `<span>`. If the SVG is inside a `<span>`, the span's `width`/`height` CSS cannot constrain the SVG, and WeasyPrint will render it at full container width — a giant icon that overlaps text.

```html
<!-- CORRECT — class="icon" on the SVG itself -->
<svg class="icon" viewBox="0 0 24 24" fill="currentColor">
  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
</svg>

<!-- WRONG — class="icon" on a wrapping span, SVG has no size constraint -->
<span class="icon">
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
  </svg>
</span>
```

Do NOT use letter placeholders (A, B, C, D) as icon stand-ins. Use real SVG paths.

## Anti-Patterns

Do not:

- use ReportLab
- write Python scripts for PDF creation
- create `generar_pdf.py`
- hardcode PDF output paths
- use remote assets
- use script tags
- dump raw tables without interpretation
- build ugly spreadsheet-style layouts
- overload the PDF with thick borders, excessive bold, or giant color slabs
- add `background`, `background-color`, or `background-image` to `.sheet`, `.doc`, `html`, or `body` — the renderer controls the page background; never override it
- create one `.sheet` per small section — always group sections so each sheet page feels visually dense
- generate chips, badges, metric pills, or callout elements without paired SVG icons
- omit the mandatory page-1 heading sequence: eyebrow → h1 → subtitle → summary → chip-row
- produce a simpler document than the STARTER — the starter is the minimum richness level, not a ceiling
- place a `<table>` inside a `.grid`, `.fact-grid`, `.metric-grid`, or any multi-column container — tables are always full-width standalone blocks inside `.table-wrap`
- copy chart SVG examples verbatim — always recompute every bar `x`, `y`, `height` and every label from real data using the proportional formula
- render more bars than data points, or fewer bars than data points — bar count must equal data point count exactly
- apply `break-inside: avoid-page` to `<section>` elements — large sections will be cut mid-content by WeasyPrint regardless; only apply this to small bounded components (cards, chips, callouts, table-wrap)
- use fixed pixel or mm widths on tables or `.table-wrap` — tables always fill 100% of the content area

## Completion Rule

Do not claim success until the file has been rendered by the `pdf` tool and exists in the workspace.
