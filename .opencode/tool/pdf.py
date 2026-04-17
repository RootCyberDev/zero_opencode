#!/usr/bin/env python3
import base64
import json
import os
import re
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
  --page-width: 170mm;
  --page-height: 251mm;
  --page-top-safety: 1.2mm;
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
  padding-left: 0.4mm;
  padding-right: 0.4mm;
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
  display: flow-root;
  width: var(--page-width);
  padding-top: var(--page-top-safety);
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

.sheet > :first-child,
.page > :first-child {
  margin-top: 0 !important;
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
TOOL_FONTS = Path(__file__).resolve().parents[1] / "assets/fonts"
ICONS = {
    "glyph-user": 0xE7FD,
    "glyph-users": 0xF233,
    "glyph-id-card": 0xEA67,
    "glyph-shield": 0xE9E0,
    "glyph-award": 0xE7AF,
    "glyph-map-pin": 0xE55E,
    "glyph-home": 0xE88A,
    "glyph-globe": 0xE80B,
    "glyph-briefcase": 0xE8F9,
    "glyph-building": 0xEA40,
    "glyph-dollar-sign": 0xEF63,
    "glyph-trending-up": 0xE8E5,
    "glyph-bar-chart": 0xE26B,
    "glyph-alert-triangle": 0xE002,
    "glyph-alert-circle": 0xE001,
    "glyph-check-circle": 0xE86C,
    "glyph-x-circle": 0xE14C,
    "glyph-scale": 0xEAF6,
    "glyph-graduation-cap": 0xE80C,
    "glyph-book-open": 0xEA19,
    "glyph-file-text": 0xE873,
    "glyph-folder": 0xE2C7,
    "glyph-phone": 0xE0B0,
    "glyph-mail": 0xE0BE,
    "glyph-wifi": 0xE63E,
    "glyph-calendar": 0xEBCC,
    "glyph-clock": 0xE192,
    "glyph-truck": 0xE558,
    "glyph-package": 0xE1A1,
    "glyph-activity": 0xF190,
    "glyph-heart": 0xE87D,
    "glyph-search": 0xE8B6,
    "glyph-info": 0xE88E,
    "glyph-star": 0xE838,
    "glyph-settings": 0xE8B8,
}


def fill_icons(html):
    pattern = re.compile(
        r'<(?P<tag>span|i)(?P<attrs>[^>]*?)class=(?P<quote>["\'])(?P<cls>[^"\']*)(?P=quote)(?P<tail>[^>]*)>\s*</(?P=tag)>',
        re.IGNORECASE,
    )

    def repl(match):
        cls = match.group("cls").split()
        icon = next((item for item in cls if item in ICONS), None)
        if not icon:
            return match.group(0)
        keep = [item for item in cls if item != icon]
        attrs = f'{match.group("attrs")}class={match.group("quote")}{" ".join(keep)}{match.group("quote")}{match.group("tail")}'
        return f'<{match.group("tag")}{attrs}>{chr(ICONS[icon])}</{match.group("tag")}>'

    return pattern.sub(repl, html)


def font_dir(root_path):
    local = root_path / ".opencode" / "assets" / "fonts"
    if all((TOOL_FONTS / name).exists() for name in ["PdfSans-Variable.ttf", "PdfSerif-Variable.ttf", "PdfIcons-Outlined.ttf"]):
        return TOOL_FONTS
    if all((local / name).exists() for name in ["PdfSans-Variable.ttf", "PdfSerif-Variable.ttf", "PdfIcons-Outlined.ttf"]):
        return local
    raise FileNotFoundError(f"PDF fonts not found in {TOOL_FONTS} or {local}")


def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: pdf.py <input.json>")

    with open(sys.argv[1], "r", encoding="utf-8") as handle:
        data = json.load(handle)

    html = data["html"]
    css = data.get("css") or ""
    output = data["output"]
    base = data["base"]
    html = fill_icons(html)
    root_path = Path(base).resolve()
    root = root_path.as_uri()
    font = font_dir(root_path)
    sans = base64.b64encode((font / "PdfSans-Variable.ttf").read_bytes()).decode()
    serif = base64.b64encode((font / "PdfSerif-Variable.ttf").read_bytes()).decode()
    icons = base64.b64encode((font / "PdfIcons-Outlined.ttf").read_bytes()).decode()
    faces = f"""
@font-face {{
  font-family: "PdfSans";
  src: url("data:font/ttf;base64,{sans}") format("truetype");
  font-weight: 400;
  font-style: normal;
}}

@font-face {{
  font-family: "PdfSerif";
  src: url("data:font/ttf;base64,{serif}") format("truetype");
  font-weight: 400;
  font-style: normal;
}}

@font-face {{
  font-family: "PdfIcons";
  src: url("data:font/ttf;base64,{icons}") format("truetype");
  font-weight: 400;
  font-style: normal;
}}
"""
    glyphs = """
.glyph {
  display: inline-block;
  max-width: none;
  overflow: visible;
  vertical-align: -0.125em;
  color: currentColor;
  font-family: "PdfIcons" !important;
  font-size: 1em;
  font-style: normal;
  font-weight: 400;
  line-height: 1;
  speak: none;
}

.glyph::before {
  display: inline-block;
  color: currentColor;
  font-family: "PdfIcons" !important;
  font-size: 1em;
  font-style: normal;
  font-weight: 400;
  line-height: 1;
  speak: none;
}

.glyph-user::before { content: "\\e7fd" !important; }
.glyph-users::before { content: "\\f233" !important; }
.glyph-id-card::before { content: "\\ea67" !important; }
.glyph-shield::before { content: "\\e9e0" !important; }
.glyph-award::before { content: "\\e7af" !important; }
.glyph-map-pin::before { content: "\\e55e" !important; }
.glyph-home::before { content: "\\e88a" !important; }
.glyph-globe::before { content: "\\e80b" !important; }
.glyph-briefcase::before { content: "\\e8f9" !important; }
.glyph-building::before { content: "\\ea40" !important; }
.glyph-dollar-sign::before { content: "\\ef63" !important; }
.glyph-trending-up::before { content: "\\e8e5" !important; }
.glyph-bar-chart::before { content: "\\e26b" !important; }
.glyph-alert-triangle::before { content: "\\e002" !important; }
.glyph-alert-circle::before { content: "\\e001" !important; }
.glyph-check-circle::before { content: "\\e86c" !important; }
.glyph-x-circle::before { content: "\\e14c" !important; }
.glyph-scale::before { content: "\\eaf6" !important; }
.glyph-graduation-cap::before { content: "\\e80c" !important; }
.glyph-book-open::before { content: "\\ea19" !important; }
.glyph-file-text::before { content: "\\e873" !important; }
.glyph-folder::before { content: "\\e2c7" !important; }
.glyph-phone::before { content: "\\e0b0" !important; }
.glyph-mail::before { content: "\\e0be" !important; }
.glyph-wifi::before { content: "\\e63e" !important; }
.glyph-calendar::before { content: "\\ebcc" !important; }
.glyph-clock::before { content: "\\e192" !important; }
.glyph-truck::before { content: "\\e558" !important; }
.glyph-package::before { content: "\\e1a1" !important; }
.glyph-activity::before { content: "\\f190" !important; }
.glyph-heart::before { content: "\\e87d" !important; }
.glyph-search::before { content: "\\e8b6" !important; }
.glyph-info::before { content: "\\e88e" !important; }
.glyph-star::before { content: "\\e838" !important; }
.glyph-settings::before { content: "\\e8b8" !important; }
"""
    block = f"<style>{faces}{glyphs}</style>"
    if "</head>" in html:
        html = html.replace("</head>", f"{block}</head>", 1)
    elif "<head>" in html:
        html = html.replace("<head>", f"<head>{block}", 1)
    else:
        html = f"{block}{html}"
    ui = UI_CSS.read_text(encoding="utf-8")

    os.makedirs(os.path.dirname(output), exist_ok=True)
    base_css = CSS(string=BASE_CSS, base_url=root)
    ui_css = CSS(string=ui, base_url=root) if UI_CSS.exists() else None
    extra_css = CSS(string=css, base_url=root) if css else None
    HTML(string=html, base_url=root, url_fetcher=safe_url_fetcher).write_pdf(
        output,
        stylesheets=[sheet for sheet in [base_css, ui_css, extra_css] if sheet],
    )

    if not os.path.exists(output):
        raise SystemExit("renderer executed but did not create OUTPUT")


if __name__ == "__main__":
    main()
