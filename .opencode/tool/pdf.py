#!/usr/bin/env python3
import json
import os
import sys

from weasyprint import CSS, HTML


BASE_CSS = """
@page {
  size: A4;
  margin: 18mm 16mm 18mm 16mm;
  @bottom-right {
    content: counter(page) " / " counter(pages);
    font-family: "Liberation Sans", "DejaVu Sans", sans-serif;
    font-size: 9pt;
    color: #64748b;
  }
}

html {
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

* {
  box-sizing: border-box;
  overflow-wrap: anywhere;
}

table {
  width: 100%;
  border-collapse: collapse;
  page-break-inside: avoid;
}

thead {
  display: table-header-group;
}

tr, td, th {
  page-break-inside: avoid;
}

img, svg {
  max-width: 100%;
}

.page-break {
  break-before: page;
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
