#!/usr/bin/env python3
import json
import os
import sys
from pathlib import Path

from weasyprint import CSS, HTML
import weasyprint


def safe_url_fetcher(url):
    """Block all network requests so WeasyPrint never hangs on unreachable resources.
    Only file:// and data: URIs are allowed through."""
    if url.startswith("file://") or url.startswith("data:"):
        return weasyprint.default_url_fetcher(url)
    # Remote URL — block silently instead of fetching (prevents hanging)
    raise OSError(f"Remote URL blocked by pdf renderer: {url}")


BASE_CSS = """
@page {
  size: A4;
  margin: 24mm 16mm 22mm 16mm;
  @bottom-right {
    content: counter(page) " / " counter(pages);
    font-family: "PdfSans", "Liberation Sans", "DejaVu Sans", sans-serif;
    font-size: 9pt;
    color: #64748b;
  }
}

html {
  --page-width: 172mm;
  --page-height: 251mm;
  color: #0f172a;
  font-family: "PdfSans", "Liberation Sans", "DejaVu Sans", sans-serif;
  font-size: 10.5pt;
  line-height: 1.55;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  /* CRITICAL: never let AI-generated CSS lock the document to one page */
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
}

body {
  margin: 0;
  background: white !important;
  /* CRITICAL: fixed body height is the #1 cause of 1-page PDFs in WeasyPrint */
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
}

/* ── Width control ─────────────────────────────────────────────
   Hard-clamp everything to the A4 content area.
   Nothing may overflow to the right.
   CRITICAL: height must be auto — fixed height clips multi-page content. */
.doc {
  width: var(--page-width);
  max-width: var(--page-width);
  margin: 0 auto;
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
}

* {
  box-sizing: border-box;
  overflow-wrap: anywhere;
  word-break: break-word;
  hyphens: none;
  max-width: 100%;
}

/* Inline elements must not inherit max-width: 100% — it breaks flex/inline layout */
span, a, strong, em, b, i, code, small, sup, sub,
.icon, .glyph, .icon-font, .chip, .badge, .metric-pill, .action-tag {
  max-width: none;
}

/* Icon containers: make block-level so width/height CSS is respected,
   then force inner SVG to fill the container exactly.
   Without this, an SVG inside a <span class="icon"> has no constraints
   and WeasyPrint expands it to 100% container width. */
.icon {
  display: inline-block;
  flex-shrink: 0;
  overflow: hidden;
  width: 16px;
  height: 16px;
}
.icon > svg {
  display: block;
  width: 100%;
  height: 100%;
}
svg.icon {
  display: inline-block;
  flex-shrink: 0;
  overflow: hidden;
}

/* Defensive cap: SVGs used as inline icons that lack class="icon".
   Applies inside chips, badges, callouts, cards, and similar components.
   Does NOT apply inside .chart-wrap (where SVGs should be full-width). */
.chip svg:not(.icon),
.badge svg:not(.icon),
.metric-pill svg:not(.icon),
.action-tag svg:not(.icon),
.callout svg:not(.icon),
.callout-header svg:not(.icon),
.card svg:not(.icon),
.fact-grid svg:not(.icon),
.metric-grid svg:not(.icon),
.label svg:not(.icon),
.section-label svg:not(.icon),
.eyebrow svg:not(.icon) {
  width: 16px !important;
  height: 16px !important;
  flex-shrink: 0;
  display: inline-block;
}

/* Chips and badges must never break mid-word */
.chip, .badge, .metric-pill, .action-tag {
  white-space: nowrap;
  word-break: keep-all;
  overflow-wrap: normal;
  hyphens: none;
}

h1, h2, h3, h4, h5, h6 {
  break-after: avoid-page;
  break-inside: avoid-page;
  page-break-after: avoid;
  orphans: 3;
  widows: 3;
  max-width: none;
}

p, li, blockquote {
  orphans: 3;
  widows: 3;
}

/* ── Break rules ───────────────────────────────────────────────
   Do NOT apply break-inside to <section> — sections can be
   arbitrarily long. WeasyPrint will cut them mid-content if
   they don't fit, creating worse breaks than natural flow.
   Only apply to small, bounded components.                   */
.hero,
.summary,
.band,
.card,
.chip-row,
.badge-row,
.fact-grid,
.metric-grid,
.callout,
.timeline-row,
.table-wrap,
.footer-note,
.chart,
.chart-wrap {
  break-inside: avoid-page;
  page-break-inside: avoid;
}

/* Grids may contain many items — allow natural breaks between rows */
.grid {
  break-inside: auto;
}

/* ── Tables ────────────────────────────────────────────────────
   Tables always occupy the full content-area width.
   They must NEVER be placed inside .grid or multi-column containers. */
table {
  width: 100% !important;
  max-width: 100% !important;
  border-collapse: collapse;
  table-layout: auto;
  page-break-inside: auto;
  break-inside: auto;
}

thead {
  display: table-header-group;
}

tr {
  break-inside: avoid-page;
  page-break-inside: avoid;
}

td, th {
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* ── Media and charts ──────────────────────────────────────────*/
img, svg {
  max-width: 100%;
  height: auto;
  break-inside: avoid-page;
}

.chart-wrap svg {
  width: 100% !important;
  height: auto !important;
}

pre, code {
  white-space: pre-wrap;
  word-break: break-all;
  overflow-wrap: anywhere;
}

.page-break {
  break-before: page;
}

/* ── Page wrappers (.sheet and .page) ─────────────────────────────────────
   Both class names are used interchangeably by AI-generated HTML.
   Rules are identical: a page wrapper is ONLY a "force break after this"
   signal — it has NO size of its own. WeasyPrint + @page control A4 sizing.

   CRITICAL:
   - NO min-height  → prevents cumulative page drift (2mm overflow = 28mm by p14)
   - NO fixed height → prevents 1-page clip
   - break-inside: auto → lets WeasyPrint split content across real A4 pages
   All height overrides use !important to win over any AI-generated inline style. */
.sheet,
.page {
  width: var(--page-width);
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  overflow: visible !important;
  break-inside: auto !important;
  page-break-inside: auto !important;
  break-after: page;
  page-break-after: always;
  background: transparent;
}

.sheet:last-child,
.page:last-child {
  break-after: auto;
  page-break-after: auto;
}

.sheet-fill {
  min-height: var(--page-height);
}

.sheet-tight {
  min-height: auto;
}

.running-header,
.running-footer {
  position: fixed;
  left: 0;
  right: 0;
  color: #64748b;
}

.running-header {
  top: -16mm;
}

.running-footer {
  bottom: -14mm;
}
"""

UI_CSS = Path(__file__).resolve().parents[1] / "skills/pdf/pdf-ui.css"

if UI_CSS.exists():
    BASE_CSS = BASE_CSS + "\n" + UI_CSS.read_text(encoding="utf-8")


def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: pdf.py <input.json>")

    with open(sys.argv[1], "r", encoding="utf-8") as handle:
        data = json.load(handle)

    html = data["html"]
    css = data.get("css") or ""
    output = data["output"]
    base = data["base"]

    os.makedirs(os.path.dirname(output), exist_ok=True)
    base_css = CSS(string=BASE_CSS, base_url=base)
    extra_css = CSS(string=css, base_url=base) if css else None
    HTML(string=html, base_url=base, url_fetcher=safe_url_fetcher).write_pdf(
        output,
        stylesheets=[base_css, extra_css] if extra_css else [base_css],
    )

    if not os.path.exists(output):
        raise SystemExit("renderer executed but did not create OUTPUT")


if __name__ == "__main__":
    main()
