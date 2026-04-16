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
- Do not design around infinite scroll assumptions.
- Avoid sections that visually collapse into tiny islands on the page.
- Avoid giant hero blocks that waste paper.
- Avoid leaving a heading stranded at the bottom of a page.
- Prefer balanced sections that fill pages naturally.
- Use `break-before`, `break-inside`, and table/header semantics when needed.

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

## Content Rules

- The summary must interpret, not dump data.
- The most important conclusions must be easy to scan.
- Long numeric identifiers should not dominate the first screen/page unless specifically required.
- Tables should be used to clarify facts, not to replace narrative reasoning.
- If a section is better expressed as bullets, use bullets.
- If a section is better expressed as cards or fact rows, use those.

## HTML Starter

Use `skills/pdf/STARTER.html` as the baseline when helpful.

That starter is not a fixed template. It is a composition baseline:

- hero
- summary
- facts
- highlights
- editorial table

Adapt it to the case. Do not copy it mechanically.

## CSS Rules

- Keep CSS print-oriented.
- Prefer local styles in the document or the optional `css` field.
- Do not use remote CSS or remote font URLs.
- Do not use script tags.
- Do not rely on browser-only interaction behavior.

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
