#!/usr/bin/env python3
import json
import os
import sys

from weasyprint import CSS, HTML


BASE_CSS = """
@page {
  size: A4;
  margin: 24mm 16mm 22mm 16mm;
  @bottom-right {
    content: counter(page) " / " counter(pages);
    font-family: "Liberation Sans", "DejaVu Sans", sans-serif;
    font-size: 9pt;
    color: #64748b;
  }
}

html {
  --page-width: 178mm;
  --page-height: 251mm;
  color: #0f172a;
  font-family: "Liberation Sans", "DejaVu Sans", sans-serif;
  font-size: 10.5pt;
  line-height: 1.55;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

body {
  margin: 0;
  background: white;
}

.doc {
  width: var(--page-width);
}

* {
  box-sizing: border-box;
  overflow-wrap: anywhere;
}

h1, h2, h3, h4, h5, h6 {
  break-after: avoid-page;
  break-inside: avoid-page;
  page-break-after: avoid;
  orphans: 3;
  widows: 3;
}

p, li, blockquote {
  orphans: 3;
  widows: 3;
}

section,
.hero,
.summary,
.band,
.grid,
.card,
.chip-row,
.badge-row,
.fact-grid,
.metric-grid,
.callout,
.timeline,
.timeline-row,
.table-wrap,
.footer-note {
  break-inside: avoid-page;
  page-break-inside: avoid;
}

table {
  width: 100%;
  border-collapse: collapse;
  page-break-inside: avoid;
  break-inside: avoid-page;
}

thead {
  display: table-header-group;
}

tr, td, th {
  page-break-inside: avoid;
  break-inside: avoid-page;
}

img, svg {
  max-width: 100%;
  break-inside: avoid-page;
}

.page-break {
  break-before: page;
}

.sheet {
  width: var(--page-width);
  min-height: var(--page-height);
  break-after: page;
  page-break-after: always;
}

.sheet:last-child {
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
    HTML(string=html, base_url=base).write_pdf(
        output,
        stylesheets=[CSS(string=BASE_CSS), CSS(string=css)] if css else [CSS(string=BASE_CSS)],
    )

    if not os.path.exists(output):
        raise SystemExit("renderer executed but did not create OUTPUT")


if __name__ == "__main__":
    main()
