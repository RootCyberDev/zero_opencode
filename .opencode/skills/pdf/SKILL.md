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
2. In OpenZero, prefer `pdf_python` for premium custom PDFs and `pdf_create` for simpler structured PDFs.
3. When using `pdf_python`, provide Python code directly to the tool. Do not create a separate `generar_pdf.py` or similar workspace script unless the user explicitly asks for a standalone script file.
4. When using `pdf_python`, write the final document to `OUTPUT`, not to a hardcoded path.
5. Verify that the expected `.pdf` file exists before claiming success.
6. If generation fails, inspect the error, fix the code or tool input, and retry once with a simpler valid script.
7. Use unique filenames and avoid overwriting an existing PDF unless the user explicitly asks.
8. For visually polished output, prefer `SimpleDocTemplate`, `Paragraph`, `Spacer`, `Table`, `TableStyle`, `HRFlowable`, and custom `ParagraphStyle` values instead of low-level one-off `canvas.drawString` output.
9. For modern executive layouts, use:
   - clear title/subtitle hierarchy
   - accent color
   - section blocks
   - whitespace and separators
   - concise, scannable paragraphs
10. Do not stop after writing the script. Execute it and confirm the file.

Recommended OpenCode workflow:

```text
1. For OpenZero premium PDFs, call pdf_python
2. Provide complete Python code that writes to OUTPUT
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

Instead, use ReportLab's XML markup tags in Paragraph objects:
```python
from reportlab.platypus import Paragraph
from reportlab.lib.styles import getSampleStyleSheet

styles = getSampleStyleSheet()

# Subscripts: use <sub> tag
chemical = Paragraph("H<sub>2</sub>O", styles['Normal'])

# Superscripts: use <super> tag
squared = Paragraph("x<super>2</super> + y<super>2</super>", styles['Normal'])
```

For canvas-drawn text (not Paragraph objects), manually adjust font the size and position rather than using Unicode subscripts/superscripts.

## Command-Line Tools

### pdftotext (poppler-utils)
```bash
# Extract text
pdftotext input.pdf output.txt

# Extract text preserving layout
pdftotext -layout input.pdf output.txt

# Extract specific pages
pdftotext -f 1 -l 5 input.pdf output.txt  # Pages 1-5
```

### qpdf
```bash
# Merge PDFs
qpdf --empty --pages file1.pdf file2.pdf -- merged.pdf

# Split pages
qpdf input.pdf --pages . 1-5 -- pages1-5.pdf
qpdf input.pdf --pages . 6-10 -- pages6-10.pdf

# Rotate pages
qpdf input.pdf output.pdf --rotate=+90:1  # Rotate page 1 by 90 degrees

# Remove password
qpdf --password=mypassword --decrypt encrypted.pdf decrypted.pdf
```

### pdftk (if available)
```bash
# Merge
pdftk file1.pdf file2.pdf cat output merged.pdf

# Split
pdftk input.pdf burst

# Rotate
pdftk input.pdf rotate 1east output rotated.pdf
```

## Common Tasks

### Extract Text from Scanned PDFs
```python
# Requires: pip install pytesseract pdf2image
import pytesseract
from pdf2image import convert_from_path

# Convert PDF to images
images = convert_from_path('scanned.pdf')

# OCR each page
text = ""
for i, image in enumerate(images):
    text += f"Page {i+1}:\n"
    text += pytesseract.image_to_string(image)
    text += "\n\n"

print(text)
```

### Add Watermark
```python
from pypdf import PdfReader, PdfWriter

# Create watermark (or load existing)
watermark = PdfReader("watermark.pdf").pages[0]

# Apply to all pages
reader = PdfReader("document.pdf")
writer = PdfWriter()

for page in reader.pages:
    page.merge_page(watermark)
    writer.add_page(page)

with open("watermarked.pdf", "wb") as output:
    writer.write(output)
```

### Extract Images
```bash
# Using pdfimages (poppler-utils)
pdfimages -j input.pdf output_prefix

# This extracts all images as output_prefix-000.jpg, output_prefix-001.jpg, etc.
```

### Password Protection
```python
from pypdf import PdfReader, PdfWriter

reader = PdfReader("input.pdf")
writer = PdfWriter()

for page in reader.pages:
    writer.add_page(page)

# Add password
writer.encrypt("userpassword", "ownerpassword")

with open("encrypted.pdf", "wb") as output:
    writer.write(output)
```

## Quick Reference

| Task | Best Tool | Command/Code |
|------|-----------|--------------|
| Merge PDFs | pypdf | `writer.add_page(page)` |
| Split PDFs | pypdf | One page per file |
| Extract text | pdfplumber | `page.extract_text()` |
| Extract tables | pdfplumber | `page.extract_tables()` |
| Create PDFs | reportlab | Canvas or Platypus |
| Command line merge | qpdf | `qpdf --empty --pages ...` |
| OCR scanned PDFs | pytesseract | Convert to image first |
| Fill PDF forms | pdf-lib or pypdf (see FORMS.md) | See FORMS.md |

## Next Steps

- For advanced pypdfium2 usage, see REFERENCE.md
- For JavaScript libraries (pdf-lib), see REFERENCE.md
- If you need to fill out a PDF form, follow the instructions in FORMS.md
- For troubleshooting guides, see REFERENCE.md

## OpenCode-Specific Reminder

If the user asks for a PDF document, do not just provide content. Generate the file, verify it exists, and return the exact filename or path.

## OpenZero Runtime Notes For `pdf_python`

When generating a premium custom PDF through the `pdf_python` tool in OpenZero:

1. Return a complete, syntactically valid Python script.
2. Prefer plain Python code, not markdown fences.
3. Always write the final PDF to `OUTPUT`.
4. Prefer ReportLab Platypus patterns over ad-hoc canvas text when document quality matters.
5. Start from a valid skeleton using:
   - `SimpleDocTemplate`
   - `Paragraph`
   - `Spacer`
   - `Table`
   - `TableStyle`
   - `HRFlowable`
   - `ParagraphStyle`
6. Keep imports minimal and safe. Safe imports include:
   - `reportlab`
   - `pypdf`
   - `pdfplumber`
   - `math`
   - `time`
   - `datetime`
   - `textwrap`
   - `re`
   - `json`
   - `decimal`
   - `statistics`
   - `itertools`
   - `collections`
   - `typing`
   - `pathlib`
7. Do not rely on shell access, subprocesses, filesystem deletion, network access, or arbitrary OS operations.
8. If a PDF generation attempt fails, fix the script and retry once with a simpler valid script. Do not enter a long trial-and-error loop.

Recommended minimal start:

```python
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    leftMargin=0.7 * inch,
    rightMargin=0.7 * inch,
    topMargin=0.7 * inch,
    bottomMargin=0.7 * inch,
)
```

## Implementation Workflow For Premium PDFs

When using `pdf_python`, do not improvise the architecture from scratch every time. Build the script in this order:

1. Imports
   - Import only what is necessary.
   - Prefer Platypus-based imports first.
2. Document setup
   - Create `SimpleDocTemplate(OUTPUT, pagesize=A4, ...)`.
   - Define safe margins first.
3. Style system
   - Create a small set of named `ParagraphStyle` values.
   - Reuse them consistently.
4. Reusable helpers
   - Add small helper functions for:
     - `rule(...)`
     - `para(...)`
     - `table(...)`
     - `facts(...)`
     - `footer(...)`
   - Keep helpers simple and deterministic.
5. Story assembly
   - Build a `story` list.
   - Append sections in order.
   - Prefer `KeepTogether` for heading + first body block.
6. Build
   - Call `doc.build(...)`.
   - Ensure the PDF is written to `OUTPUT`.

Do not jump straight into dozens of raw drawing calls. Start from a stable document skeleton first, then layer the editorial structure.

## Code Writing Rules For `pdf_python`

When writing Python for a premium PDF:

- Write complete code, not fragments.
- Keep the script syntactically simple.
- Prefer a few clear helper functions over one huge monolith.
- Use named styles only. Do not create anonymous style objects inline repeatedly.
- Keep section titles short enough to wrap cleanly.
- Wrap long cell content with `Paragraph`, not plain strings.
- Prefer subtle lines, spacing, and hierarchy over heavy filled blocks.
- Avoid giant bold paragraphs.
- Avoid outdated table grids with thick borders.
- Avoid visual noise like showing raw IDs as hero content.
- Do not use investigative or police-like wording in executive reports unless the user explicitly asks for that tone.
- Never leave visible markdown, LaTeX fragments, or placeholder syntax in the PDF.
- Never return a script that you know is incomplete or structurally broken.

## Starter Asset

For premium PDFs, use the starter architecture from `skills/pdf/STARTER.py` as the base composition pattern, then adapt the visual system and content to the specific prompt.

The purpose of the starter is not to freeze the design. It is to avoid low-quality code structure while preserving layout freedom.
