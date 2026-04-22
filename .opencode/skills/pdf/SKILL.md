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
- `html_file` as the exact HTML filename written in the project root, for example `reporte-0950804518-20260416-xxxx.html`
- optional `css`

The tool will:

- render true A4 output
- preserve paged layout
- add page numbering through the base stylesheet
- return a real PDF file in the workspace

**Critical usage rule:** Write the complete HTML document to a `.html` file in the project root first, then call `pdf` with the existing file path. Do NOT regenerate the HTML inline at conversion time. The workflow is: compose HTML → write file → call `pdf` on that file → done.

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
  - width: `171mm`
  - height: `251mm`
- Treat `171mm` as the hard safe width for any full-page block.
- Treat `251mm` as the hard safe height for the visible content stack on a page.
- Do not design around infinite scroll assumptions.
- Avoid sections that visually collapse into tiny islands on the page.
- Avoid giant hero blocks that waste paper.
- Avoid leaving a heading stranded at the bottom of a page.
- Prefer balanced sections that fill pages naturally.
- Use `break-before`, `break-inside`, and table/header semantics when needed.
- When you need strong page control, structure the HTML with explicit `.sheet` wrappers.
- A `.sheet` is a **page-break signal**, not a page-size container. It means "force a page break after this block". WeasyPrint controls the A4 dimensions via `@page`. A `.sheet` whose content is short ends with whitespace; a `.sheet` whose content overflows naturally spans two physical pages. Both are correct. Never set `min-height` or `height` on `.sheet` to "fill" a page.
- If a section should start on a new page, start a new `.sheet` or use `.page-break`.
- If unsure, keep the interior width narrower than `171mm` and let the renderer breathe. Margins are safer than edge-to-edge layouts.
- Assume the renderer adds a tiny top safety offset on each `.sheet` to stabilize page starts. Do not try to cancel it with negative margins.
- Never set `width`, `height`, or `min-height` on `html`, `body`, `.doc`, or `.sheet`.
- Never use full-bleed backgrounds on page wrappers. Keep background color and gradients inside cards, bands, or callouts only.

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

### Glyph Library

The renderer loads `.opencode/skills/pdf/pdf-ui.css` automatically. Use the glyph classes from that library instead of embedding long SVG paths for routine icons.
Those glyphs are backed by the local `PdfIcons` font with fixed codepoints, so the HTML stays compact while still rendering reliably in PDF.

- Use `<span class="glyph glyph-user"></span>` or `<i class="glyph glyph-user"></i>`.
- Use glyphs in chips, badges, metric pills, fact labels, callout headers, and section labels.
- Keep glyphs small and quiet. They support reading; they do not decorate the page by themselves.
- If no glyph fits a rare case, use a tiny inline SVG fallback, but prefer the glyph library first.
- Do not invent new icon names in the HTML. Use the closest class that already exists in the library.

Available glyph classes:

- `.glyph-user` → persona
- `.glyph-users` → group / contacts
- `.glyph-id-card` → identification
- `.glyph-shield` → legal status / protection
- `.glyph-award` → achievement / qualification
- `.glyph-map-pin` → residence / location
- `.glyph-home` → home / domicile
- `.glyph-globe` → country / national scope
- `.glyph-briefcase` → work / employment
- `.glyph-building` → company / institution
- `.glyph-dollar-sign` → salary / money
- `.glyph-trending-up` → progression / growth
- `.glyph-bar-chart` → statistics / chart
- `.glyph-alert-triangle` → warning / risk
- `.glyph-alert-circle` → note / observation
- `.glyph-check-circle` → confirmed / valid
- `.glyph-x-circle` → negative / inactive
- `.glyph-scale` → legal process
- `.glyph-graduation-cap` → education / university
- `.glyph-book-open` → study / knowledge
- `.glyph-file-text` → report / dossier
- `.glyph-folder` → archive / files
- `.glyph-phone` → phone / contact
- `.glyph-mail` → email / contact
- `.glyph-wifi` → online / digital presence
- `.glyph-calendar` → date / period
- `.glyph-clock` → time / duration
- `.glyph-truck` → vehicle / transport
- `.glyph-package` → assets / property
- `.glyph-activity` → activity / health
- `.glyph-heart` → wellness / status
- `.glyph-search` → OSINT / search
- `.glyph-info` → information / context
- `.glyph-star` → highlight / priority
- `.glyph-settings` → settings / configuration

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
- Tables always use the full content-area width (171mm). Do not add `width` constraints on tables or `.table-wrap`.

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
5. **Chip row** — 3–5 classifiers: status, type, confidence, area. Always with glyphs or tiny SVG fallback icons.
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
10. **Charts** — if numerical time-series or comparative data exists, render it with the built-in chart component library
11. **Comparison or summary table** — only if tabular comparison adds real clarity

### Last page — Closing Layer

12. **Conclusions or recommendations** (if applicable)
13. **Footer note** — the generation date only. Nothing else: no data source, no system name, no disclaimer, no "fuente de datos", no period covered, no editorial caveat. See the Footer Rules section below for the exact prohibitions.

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

When the data includes numerical, time-based, or comparative values, render a chart with the built-in `.chart` component library from `.opencode/skills/pdf/pdf-ui.css`. Do not invent one-off chart markup when the library fits.

### When to use charts

- Use `chart--bar` for comparisons across periods or categories.
- Use `chart--hbar` when labels are long.
- Use `chart--donut` for proportional splits with up to 4–5 segments.
- Do not use a chart when the same signal is already better expressed as a metric grid or small table.

### Bar chart

Use `chart--bar` when the category order matters. The library uses inline SVG bars; you provide a compact `svg` with one `rect` per data point and keep the math proportional.

**Math:** `barHeight = round((value / maxValue) * 110)px`

```html
<div class="chart chart--bar">
  <div class="chart__title">Evolución Salarial IESS (USD)</div>
  <svg class="chart__svg" viewBox="0 0 420 190" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Evolución Salarial IESS">
    <line x1="30" y1="18" x2="30" y2="150" stroke="#d9e2ec" stroke-width="1" />
    <line x1="30" y1="150" x2="400" y2="150" stroke="#d9e2ec" stroke-width="1" />
    <rect x="48" y="125" width="52" height="25" rx="3" fill="#1d4ed8" />
    <rect x="138" y="113" width="52" height="37" rx="3" fill="#1d4ed8" />
    <rect x="228" y="97" width="52" height="53" rx="3" fill="#1d4ed8" />
    <rect x="318" y="40" width="52" height="110" rx="3" fill="#1d4ed8" />
    <text x="74" y="118" text-anchor="middle" font-size="10" fill="#102a43" font-weight="700">$567</text>
    <text x="164" y="106" text-anchor="middle" font-size="10" fill="#102a43" font-weight="700">$850</text>
    <text x="254" y="90" text-anchor="middle" font-size="10" fill="#102a43" font-weight="700">$1,200</text>
    <text x="344" y="33" text-anchor="middle" font-size="10" fill="#102a43" font-weight="700">$2,500</text>
    <text x="74" y="168" text-anchor="middle" font-size="9" fill="#475569">2021</text>
    <text x="164" y="168" text-anchor="middle" font-size="9" fill="#475569">2022</text>
    <text x="254" y="168" text-anchor="middle" font-size="9" fill="#475569">2023</text>
    <text x="344" y="168" text-anchor="middle" font-size="9" fill="#475569">2024</text>
  </svg>
  <div class="chart__note">Fuente: registros de afiliación IESS — salario más reciente: $2,500</div>
</div>
```

Validation:

- The tallest bar must correspond to the largest value.
- The number of `<rect>` bar elements must equal the number of data points.
- If the data changes, recompute the `height` attribute for every `<rect>` bar using the formula above.

### Horizontal bar chart

Use `chart--hbar` when labels are long or when a ranked comparison reads better horizontally. Keep it as inline SVG so the bar lengths stay exact in PDF.

**Math (viewBox units, track width = 244):** `width = round((value / maxValue) * 244)`

```html
<div class="chart chart--hbar">
  <div class="chart__title">Distribución de Resultados OSINT</div>
  <svg class="chart__svg" viewBox="0 0 420 132" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Distribución de resultados OSINT">
    <text x="16" y="30" font-size="10" fill="#475569">Documentos PDF</text>
    <rect x="128" y="20" width="244" height="12" rx="6" fill="#f8fafc" stroke="#d9e2ec" />
    <rect x="128" y="20" width="57" height="12" rx="6" fill="#1d4ed8" />
    <text x="382" y="30" font-size="10" fill="#102a43" font-weight="700">6</text>

    <text x="16" y="64" font-size="10" fill="#475569">Redes Sociales</text>
    <rect x="128" y="54" width="244" height="12" rx="6" fill="#f8fafc" stroke="#d9e2ec" />
    <rect x="128" y="54" width="244" height="12" rx="6" fill="#1d4ed8" />
    <text x="382" y="64" font-size="10" fill="#102a43" font-weight="700">23</text>

    <text x="16" y="98" font-size="10" fill="#475569">Otros</text>
    <rect x="128" y="88" width="244" height="12" rx="6" fill="#f8fafc" stroke="#d9e2ec" />
    <rect x="128" y="88" width="159" height="12" rx="6" fill="#1d4ed8" />
    <text x="382" y="98" font-size="10" fill="#102a43" font-weight="700">15</text>
  </svg>
  <div class="chart__note">Fuente: búsqueda OSINT — 48 resultados totales</div>
</div>
```

**CRITICAL — SVG rect radius rule:** always use `rx="3"` to `rx="6"` for bar chart rects. **NEVER use `rx="999"` or any value greater than half the rect's height** — WeasyPrint renders those as warped ellipses instead of rounded rectangles. The safe range is `rx <= height / 2`. A 12px tall bar uses `rx="6"` at most.

Validation:

- The longer bar must always represent the larger value.
- Keep the ranking order visible and do not reorder the data unless the report explicitly asks for sorting.

### Donut chart

Use `chart--donut` for proportional splits. The library uses SVG circles, but the HTML only needs numeric variables and legend rows.

**Math:** `dash = 282.74 × percent / 100`, `offset = -(sum of previous dashes)`

```html
<div class="chart chart--donut">
  <svg class="chart__svg" width="50mm" height="50mm" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <g transform="rotate(-90 60 60)">
      <circle cx="60" cy="60" r="45" fill="none" stroke="#1d4ed8" stroke-width="22" stroke-dasharray="183.78 282.74" stroke-dashoffset="0" />
      <circle cx="60" cy="60" r="45" fill="none" stroke="#7c3aed" stroke-width="22" stroke-dasharray="56.55 282.74" stroke-dashoffset="-183.78" />
      <circle cx="60" cy="60" r="45" fill="none" stroke="#94a3b8" stroke-width="22" stroke-dasharray="42.41 282.74" stroke-dashoffset="-240.33" />
    </g>
    <text x="60" y="58" text-anchor="middle" font-size="16" font-weight="700" fill="#102a43">65%</text>
    <text x="60" y="70" text-anchor="middle" font-size="7" fill="#475569">Empleado</text>
  </svg>
  <div class="chart__legend">
    <div class="chart__legend-row"><span class="chart__swatch" style="background:#1d4ed8;"></span><strong>Empleado</strong> — 65%</div>
    <div class="chart__legend-row"><span class="chart__swatch" style="background:#7c3aed;"></span>Independiente — 20%</div>
    <div class="chart__legend-row"><span class="chart__swatch" style="background:#94a3b8;"></span>Sin actividad — 15%</div>
  </div>
</div>
```

**CRITICAL — SVG presentation attributes rule (WeasyPrint constraint):**
WeasyPrint does NOT apply external CSS (from `<style>` blocks or stylesheets) to SVG child elements like `<circle>`, `<rect>`, `<line>`, `<path>`, `<text>`. It only applies CSS to the outer `<svg>` element itself.

Inside every `<svg>`, set visual properties with **SVG presentation attributes** (or inline `style="..."` on the element) — never via a class that lives in an external stylesheet.

- Set `fill="none"`, `stroke="#1d4ed8"`, `stroke-width="22"`, `stroke-dasharray="183.78 282.74"` directly on each `<circle>`/`<rect>`.
- Wrap rotations in a `<g transform="rotate(-90 60 60)">` — never rely on `transform` from external CSS.
- Give every `<svg>` explicit `width` and `height` attributes (e.g. `width="50mm" height="50mm"` for donuts) so it does not expand to the full container width.
- Put `font-size` and `fill` as attributes on `<text>` elements, not as CSS classes.

Violating this rule produces a solid black filled circle (missing `fill="none"`), a ring at full circumference (missing `stroke-dasharray`), or a donut that fills the whole page width (missing `width=/height=`).

Validation:

- The sum of the segment percentages must be 100%.
- The sum of the `dash` values must equal the circle circumference.
- Use solid colors and avoid opacity when the chart must print clearly.

## Chart Pre-Write Checklist (MANDATORY)

Before writing any chart into the HTML, confirm every item in this list. If even one fails, the chart is invalid — rewrite it before emitting.

1. **Rect count equals data-point count.** If you have 4 salary entries, the SVG must contain exactly 4 `<rect>` bar elements — not 3, not 5. Counting axis lines does not count.
2. **The tallest bar corresponds to the largest value.** If $2,500 is the max, its `<rect>` must have the largest `height` (vertical bar) or `width` (horizontal bar) in the SVG.
3. **All `<rect>` bars are present.** A chart with only `<text>` labels and no `<rect>` elements is not a chart — it is a caption with dates. Never emit one.
4. **`rx` is small.** Every bar rect uses `rx="3"` to `rx="6"`. Never `rx="999"` — that renders as an ellipse in WeasyPrint.
5. **No `<line>` as a bar.** Bars are always `<rect>`. A vertical or horizontal `<line>` is an axis, not a bar.
6. **No CSS progress-bar fallback.** Never render a chart as `<div>` with a `width: 57%` fill. Always real SVG `<rect>`.
7. **No `conic-gradient` or `radial-gradient`.** WeasyPrint does not paint them. Use the donut template with `stroke-dasharray` math instead.
8. **Math is explicit.** Bar math: `height = round((value / max) * 110)`. Hbar width: `width = round((value / max) * 244)`. Donut dash: `dash = round(282.74 * percent / 100, 2)`.
9. **The viewBox is 420×190 for bars, 420×132 for hbars, 120×120 for donuts.** Stick to these so the chart prints crisply inside the A4 content column.
10. **Axis + baseline lines are drawn.** Bar charts include both a left axis and a bottom baseline. Hbars include a light grey track behind the fill.

If after the checklist you cannot produce a valid chart, **render a 2–3 row micro-table instead** and note the numeric data there. Never emit a broken chart.

## Common Visual Failures and Fixes

These are the failures that appear most often in generated reports. Recognize and fix them before the PDF tool call.

| Failure | Symptom in PDF | Fix |
|---|---|---|
| Bars missing in bar chart | Dates/labels float on a line with no bars | Re-emit the SVG with one `<rect>` per data point; recompute `height` with the formula |
| Bars look like elongated ovals | Hbar bars are curved, lens-shaped | Use `rx="6"` (never `rx="999"`) |
| Tallest bar wrong | A smaller number has a taller bar than a larger number | Sort values, find the max, divide each value by the max |
| Donut renders as a solid black disc | No segments visible, just a filled circle | Each `<circle>` needs `fill="none"` as an attribute (not via CSS class). External CSS does not reach SVG children in WeasyPrint |
| Donut fills the whole page width | Huge circle, legend squished into a narrow column | Add `width="50mm" height="50mm"` as attributes on the `<svg>`, not via CSS |
| Donut ring is fully filled | Blue ring at full circumference, no percent split | Each `<circle>` needs `stroke-dasharray="<dash> 282.74"` and `stroke-dashoffset="<offset>"` as inline SVG attributes; the segment `dash` values must sum to 282.74 |
| Last page is almost empty | Only the footer on its own page | The `.footer-note` must live inside the LAST content `.sheet`, not its own `.sheet`. Never wrap the footer in its own sheet |
| Page with one small section wastes whitespace | A full A4 page shows 3 lines then 200mm blank | Merge the small section into the previous `.sheet`. Never use one `.sheet` per micro-section |
| Icons render blank | Chip/badge text shows no icon | Use only the glyph classes listed in this document. Unknown glyph names render as empty |
| Table clamped to half-width | A wide table appears compressed on the left half | A `<table>` must never live inside a `.grid`, `.fact-grid`, or `.metric-grid`. Always wrap in `.table-wrap` as a full-width block |
| Content hugs left edge | Page visibly unbalanced, right margin twice the left | Wrap the entire document in `<main class="doc"> ... </main>` so the 171mm content column is auto-centered in the 178mm content area |

## Last-Page Rule (footer placement)

The `.footer-note` with the generation date must always be the last child of the last content `.sheet`. Never put it in its own `.sheet`. Never put it after `</section>` at document root.

- **WRONG** — this produces a blank final page with only the footer:
  ```html
  <section class="sheet"><h2>Conclusiones</h2><p>...</p></section>
  <section class="sheet"><div class="footer-note">Generado el ...</div></section>
  ```
- **CORRECT** — the footer closes the last sheet in-place:
  ```html
  <section class="sheet">
    <h2>Conclusiones</h2>
    <p>...</p>
    <div class="footer-note">Generado el ...</div>
  </section>
  ```

If the last section's content already fills the page, WeasyPrint will flow the footer onto the next page naturally — that is fine. What is not fine is forcing it into its own `.sheet`, which guarantees a blank page.

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

### Contact Data Formatting

Multiple values in the same field (emails, phones, addresses) must **never** be stacked with blank lines between them. Present them compactly:

- **1 value**: show inline as plain text in a fact row or card
- **2–3 values**: comma-separated on one line: `correo1@x.com, correo2@x.com`
- **4+ values**: use a tight `<ul>` with no margins, or a two-column micro-table — never a `<p>` per item with `margin-bottom`

```html
<!-- WRONG — empty lines between each email, wastes space -->
<p>correo1@example.com</p>
<p></p>
<p>correo2@example.com</p>

<!-- CORRECT — compact inline -->
<span>correo1@example.com, correo2@example.com</span>

<!-- CORRECT — compact list for 4+ items -->
<ul style=”margin:0;padding-left:12px;line-height:1.6;”>
  <li>correo1@example.com</li>
  <li>correo2@example.com</li>
</ul>
```

## Tool Use Preflight

Before calling `pdf`, do this check:

1. Draft the HTML/CSS.
2. Remove any `<script>` tags.
3. Remove or replace any remote URLs.
4. Verify the document still reads cleanly as A4 print content.
5. Only then call the tool.

## File Name Rule

- Do not narrate a filename rewrite or rename step to the user.
- If the HTML filename is wrong or missing, correct it in the HTML-writing step before conversion.
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

**CRITICAL — always use class `sheet` for page wrapper divs, not `page`.**
The renderer's BASE_CSS targets both `.sheet` and `.page`, but `.sheet` is the canonical name. Do not invent other class names for page wrappers (`.section`, `.slide`, `.block`, etc.) — only `.sheet` and `.page` receive the correct CSS overrides.

**CRITICAL — `.sheet` is a page-break signal, NOT a page-size container.**

- `.sheet` tells WeasyPrint: *"force a page break after this block"*
- `.sheet` does **NOT** have a fixed or minimum height — WeasyPrint controls the A4 dimensions via `@page`
- Never try to "fill" a sheet to exactly 251mm. If your content is 180mm, the page ends at 180mm with white space — that is correct PDF behavior
- If a sheet's content overflows 251mm, WeasyPrint will naturally create a second physical page for the overflow, which is also correct
- **Do NOT add `min-height`, `height`, or any fixed dimension to `.sheet`** — this causes cumulative page drift: a 2mm overflow per sheet becomes a 28mm misalignment by page 14

The renderer decides where A4 pages end. Your job is only to group content logically and mark section boundaries with `.sheet`.

**CRITICAL — page-start stability**

- The renderer adds a small top safety padding inside each `.sheet` and resets the first child's top margin.
- Do not rely on top-margin collapse for spacing at the top of a page.
- If a page must open with more visual air, add explicit padding inside the first block rather than top margins on the first child.

**CRITICAL — closing footer**

- The closing footer must be a dedicated `.footer-note` block, not loose text appended to the last paragraph.
- `.footer-note` should contain only the generation date, for example: `Generado el 16 de abril de 2026.`
- Always leave visual separation before `.footer-note` so it reads as a closing line, not as part of the last paragraph.

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
- Optional helper classes like `.sheet-fill` should only be used when they improve pagination rather than forcing visual density.

## Mandatory Structure — Page 1

The first page must always open with all of these, in this order:

1. `.eyebrow` — category label
2. `h1` — main title
3. `.subtitle` — context or period
4. `.summary` block — executive interpretation
5. `.chip-row` — at least 2 chips or badges with icons

Skipping any of these is a layout failure.

## Anti-Patterns

Do not:

- **declare `@page` rules of any kind** — the renderer owns page size, margins (24mm top, 16mm sides, 22mm bottom) and the automatic page-number slot. Do not emit `@page { size: A4 }`, `@page { margin: 0 }`, `@page { ... }` with ANY body, ever. Adding your own `@page` shifts the whole document to the left edge and breaks the balanced layout
- **set `margin`, `padding`, `width`, `max-width`, or `min-width` on `html` or `body`** — the renderer owns these too. Any `html, body { margin: 0; width: 100% }` block cancels the auto-centering and produces a left-skewed page with huge empty right margin
- write the HTML file to a subdirectory — always write to the project root (e.g. `reporte-cedula-date.html` not `reportes/reporte.html`)
- use `.page`, `.slide`, `.section`, or any class other than `.sheet` as page wrapper divs — only `.sheet` (or `.page` as fallback) receives the WeasyPrint layout overrides; other class names will have unconstrained height and min-height, causing 1-page PDFs or cumulative page drift
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
- set `height` (fixed) on `html`, `body`, `.doc`, or `.sheet` — **this is the #1 cause of 1-page PDFs**. `height: 297mm` on `body` clips all content to one page in WeasyPrint. Never set `height` or `max-height` on root elements
- set `min-height` on `.sheet` — **this causes cumulative page drift**. A 2mm content overflow per sheet = 28mm misalignment by page 14. `.sheet` must have no height constraints at all; WeasyPrint handles A4 sizing via `@page`
- set `overflow: hidden` on `html`, `body`, `.doc`, or `.sheet` — this discards content beyond the first page
- use `break-inside: avoid-page` or `break-inside: avoid` on `.sheet` — this prevents WeasyPrint from paginating the sheet and causes content loss. Only apply `break-inside: avoid-page` to small bounded components (cards, callouts, table-wrap, chips)
- create one `.sheet` per small section — always group sections so each sheet page feels visually dense
- generate chips, badges, metric pills, or callout elements without paired glyphs or SVG icons
- omit the mandatory page-1 heading sequence: eyebrow → h1 → subtitle → summary → chip-row
- treat the STARTER as a structural baseline only — do not copy its visual choices mechanically, and do not let it narrow the composition beyond the case at hand
- place a `<table>` inside a `.grid`, `.fact-grid`, `.metric-grid`, or any multi-column container — tables are always full-width standalone blocks inside `.table-wrap`
- use `conic-gradient` or `radial-gradient` for pie/donut charts — WeasyPrint does not support them; use the built-in `chart--donut` class instead
- use chart markup outside the built-in chart component library when the library already fits the data
- render a chart where a lower value has a taller bar than a higher value — that means the math is wrong; stop and recalculate
- omit data points from a chart — if salary history has 4 entries [$567, $850, $1,200, $2,500], the chart must have exactly 4 bars; omitting the most recent (highest) salary bar is a chart failure
- generate Cloudflare `__cf_email__` protection anchors in report HTML — emails must be plain text, never `<a class="__cf_email__" data-cfemail="...">...</a>`; that encoding renders the email invisible to the reader
- use session context variables (`userEmail`, logged-in operator email) as subject data — if an email you are about to write into the report matches the session's user email, it is contaminated; omit it and note it as unavailable
- calculate age from OSINT or LinkedIn self-reported data — age must be computed from the MCP birth date record using the formula: `age = report_year − birth_year`, minus 1 if the birthday is still ahead of the report date; a person born 23/04/2000 has age 25 on 16/04/2026, not 26 and not 34
- render a chart outside the built-in formulas or component variables when the report uses numerical, comparative, or time-series data
- place chart rows, bars, or legends inside a multi-column container that compresses the chart
- use fixed pixel or mm widths on tables or `.table-wrap` — tables always fill 100% of the content area
- nest `.section-content` inside another `.section-content` — this creates ugly box-in-box double borders; use flat structure
- stack metric-pills vertically as individual block elements — always group them in a flex row: `<div style="display:flex;flex-wrap:wrap;gap:4mm;">`
- add background color or gradient to the `.eyebrow` element — eyebrow is plain uppercase text with a color, no background fill
- add background color or gradient to `html`, `body`, `.doc`, or `.sheet` — the renderer controls the page background

## Page Numbering

- The renderer stamps `page / total` in the bottom-right corner of every page automatically via `@page { @bottom-right }`.
- **Do NOT add manual page numbers** (no counters inside `.sheet`, no "Página 1 de 8" labels, no footer page strips). They will overlap the renderer's numbering and look broken.
- The automatic numbering uses `PdfSans` at 9pt muted color. Do not attempt to restyle it from document CSS.

## Completion Rule

Do not claim success until the file has been rendered by the `pdf` tool and exists in the workspace.
