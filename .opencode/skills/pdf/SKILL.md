---
name: pdf
description: Use this skill whenever the user wants to do anything with PDF files. This includes reading or extracting text/tables from PDFs, combining or merging multiple PDFs into one, splitting PDFs apart, rotating pages, adding watermarks, creating new PDFs, filling PDF forms, encrypting/decrypting PDFs, extracting images, and OCR on scanned PDFs to make them searchable. If the user mentions a .pdf file or asks to produce one, use this skill.
license: Proprietary. LICENSE.txt has complete terms
---

# PDF Processing Guide

## Overview

This guide covers essential PDF processing operations using Python libraries and command-line tools. For advanced features, JavaScript libraries, and detailed examples, see REFERENCE.md. If you need to fill out a PDF form, read FORMS.md and follow its instructions.

## Quick Start

```python
from pypdf import PdfReader, PdfWriter

# Read a PDF
reader = PdfReader("document.pdf")
print(f"Pages: {len(reader.pages)}")

# Extract text
text = ""
for page in reader.pages:
text += page.extract_text()
```

## OpenCode Execution Rules

When the user wants to generate a PDF in OpenCode:

1. Prefer creating a real file in the workspace, not just describing the PDF.
2. Prefer Python with `reportlab` for PDF creation when the environment supports it.
3. Write the script to disk first, then execute it.
4. Verify that the expected `.pdf` file exists before claiming success.
5. If generation fails, inspect the error, fix the script, and retry.
6. Use unique filenames and avoid overwriting an existing PDF unless the user explicitly asks.
7. For visually polished output, prefer `SimpleDocTemplate`, `Paragraph`, `Spacer`, `Table`, `TableStyle`, `HRFlowable`, and custom `ParagraphStyle` values instead of low-level one-off `canvas.drawString` output.
8. For modern executive layouts, use:
   - clear title/subtitle hierarchy
   - accent color
   - section blocks
   - whitespace and separators
   - concise, scannable paragraphs
9. Do not stop after writing the script. Execute it and confirm the file.

Recommended OpenCode workflow:

```text
1. Write python script into workspace
2. Execute python3 script.py
3. Confirm target.pdf exists
4. Return exact path or filename
```

## Python Libraries

### pypdf - Basic Operations

#### Merge PDFs
```python
from pypdf import PdfWriter, PdfReader

writer = PdfWriter()
for pdf_file in ["doc1.pdf", "doc2.pdf", "doc3.pdf"]:
    reader = PdfReader(pdf_file)
    for page in reader.pages:
        writer.add_page(page)

with open("merged.pdf", "wb") as output:
    writer.write(output)
```

#### Split PDF
```python
reader = PdfReader("input.pdf")
for i, page in enumerate(reader.pages):
    writer = PdfWriter()
    writer.add_page(page)
    with open(f"page_{i+1}.pdf", "wb") as output:
        writer.write(output)
```

#### Extract Metadata
```python
reader = PdfReader("document.pdf")
meta = reader.metadata
print(f"Title: {meta.title}")
print(f"Author: {meta.author}")
print(f"Subject: {meta.subject}")
print(f"Creator: {meta.creator}")
```

#### Rotate Pages
```python
reader = PdfReader("input.pdf")
writer = PdfWriter()

page = reader.pages[0]
page.rotate(90)  # Rotate 90 degrees clockwise
writer.add_page(page)

with open("rotated.pdf", "wb") as output:
    writer.write(output)
```

### pdfplumber - Text and Table Extraction

#### Extract Text with Layout
```python
import pdfplumber

with pdfplumber.open("document.pdf") as pdf:
    for page in pdf.pages:
        text = page.extract_text()
        print(text)
```

#### Extract Tables
```python
with pdfplumber.open("document.pdf") as pdf:
    for i, page in enumerate(pdf.pages):
        tables = page.extract_tables()
        for j, table in enumerate(tables):
            print(f"Table {j+1} on page {i+1}:")
            for row in table:
                print(row)
```

#### Advanced Table Extraction
```python
import pandas as pd

with pdfplumber.open("document.pdf") as pdf:
    all_tables = []
    for page in pdf.pages:
        tables = page.extract_tables()
        for table in tables:
            if table:  # Check if table is not empty
                df = pd.DataFrame(table[1:], columns=table[0])
                all_tables.append(df)

# Combine all tables
if all_tables:
    combined_df = pd.concat(all_tables, ignore_index=True)
    combined_df.to_excel("extracted_tables.xlsx", index=False)
```

### reportlab - Create PDFs

#### Basic PDF Creation
```python
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

c = canvas.Canvas("hello.pdf", pagesize=letter)
width, height = letter

# Add text
c.drawString(100, height - 100, "Hello World!")
c.drawString(100, height - 120, "This is a PDF created with reportlab")

# Add a line
c.line(100, height - 140, 400, height - 140)

# Save
c.save()
```

#### Preferred Pattern For Modern PDFs
Use Platypus with custom styles instead of building the whole document with raw `canvas.drawString` calls whenever the user wants a polished or executive-looking PDF.

Recommended building blocks:

- `SimpleDocTemplate`
- `Paragraph`
- `Spacer`
- `Table`
- `TableStyle`
- `HRFlowable`
- `ParagraphStyle`

Preferred strategy:

```python
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

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
    Paragraph("Well-structured executive content goes here.", body_style),
]

doc.build(story)
```

This pattern is preferred over ad-hoc line-by-line text placement when document quality matters.

#### Create PDF with Multiple Pages
```python
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet

doc = SimpleDocTemplate("report.pdf", pagesize=letter)
styles = getSampleStyleSheet()
story = []

# Add content
title = Paragraph("Report Title", styles['Title'])
story.append(title)
story.append(Spacer(1, 12))

body = Paragraph("This is the body of the report. " * 20, styles['Normal'])
story.append(body)
story.append(PageBreak())

# Page 2
story.append(Paragraph("Page 2", styles['Heading1']))
story.append(Paragraph("Content for page 2", styles['Normal']))

# Build PDF
doc.build(story)
```

#### Subscripts and Superscripts

**IMPORTANT**: Never use Unicode subscript/superscript characters (₀₁₂₃₄₅₆₇₈₉, ⁰¹²³⁴⁵⁶⁷⁸⁹) in ReportLab PDFs. The built-in fonts do not include these glyphs, causing them to render as solid black boxes.
