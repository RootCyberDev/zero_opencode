---
name: pdf
description: Use this skill whenever the user wants to create, modify, merge, inspect, or export PDF files. In OpenCode, prefer writing real Python code with reportlab for PDF generation, executing it, and verifying that the final .pdf file exists before claiming success.
---

# PDF Skill

## OpenCode Rules

- When the user asks for a PDF, create the actual file in the workspace.
- Prefer Python with `reportlab` for PDF generation.
- Write the script to disk, execute it, and verify the `.pdf` file exists.
- If generation fails, inspect the error, fix the script, and retry.
- Use unique filenames and avoid overwriting an existing PDF unless explicitly requested.
- For polished output, prefer `reportlab.platypus` components and custom styles over plain `canvas.drawString` output.

## Preferred Workflow

```text
1. Write python script into workspace
2. Execute python3 script.py
3. Confirm target.pdf exists
4. Return exact filename or path
```

## Preferred Libraries

- `reportlab` for creating PDFs
- `pypdf` for merging, splitting, rotating, or encrypting PDFs
- `pdfplumber` for text and table extraction

## Modern PDF Guidance

When the user wants a modern, executive, or visually polished PDF:

- use `SimpleDocTemplate`
- use `Paragraph`, `Spacer`, `HRFlowable`, `Table`, `TableStyle`
- define custom `ParagraphStyle` values
- use accent colors, strong title hierarchy, whitespace, and section blocks
- keep the document readable and scannable

## ReportLab Example Pattern

```python
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY

doc = SimpleDocTemplate(
    "output.pdf",
    pagesize=letter,
    leftMargin=0.65 * inch,
    rightMargin=0.65 * inch,
    topMargin=0.5 * inch,
    bottomMargin=0.5 * inch,
)

styles = getSampleStyleSheet()
title_style = ParagraphStyle(
    "Title",
    fontSize=24,
    fontName="Helvetica-Bold",
    textColor=colors.HexColor("#0B1F3A"),
    alignment=TA_CENTER,
)
body_style = ParagraphStyle(
    "Body",
    fontSize=10,
    leading=14,
    alignment=TA_JUSTIFY,
    textColor=colors.HexColor("#1E293B"),
)

story = [
    Paragraph("Executive Title", title_style),
    Spacer(1, 12),
    HRFlowable(width="100%", thickness=1.2, color=colors.HexColor("#1A73C8")),
    Spacer(1, 12),
    Paragraph("Structured content goes here.", body_style),
]

doc.build(story)
```

## Critical Reminder

Do not stop after drafting content. Execute the code and verify that the PDF file was actually generated.
