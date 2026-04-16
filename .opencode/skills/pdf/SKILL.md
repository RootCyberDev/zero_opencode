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

## Completion Rule

Do not claim success until the file has been rendered by the `pdf` tool and exists in the workspace.
