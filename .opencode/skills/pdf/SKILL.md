---
name: pdf
description: Use this skill whenever the user wants to create, modify, merge, inspect, or export PDF files. In OpenCode, prefer the dedicated `pdf_create` tool for generation. Only fall back to custom Python with reportlab when the tool is unavailable or the user explicitly wants low-level custom code.
---

# PDF Skill

## OpenCode Rules

- When the user asks for a PDF, create the actual file in the workspace.
- Prefer the `pdf_create` tool for generation.
- Pass structured content to `pdf_create` instead of generating raw HTML or long ad-hoc Python.
- Verify that the `.pdf` file exists before claiming success.
- If generation fails, inspect the error, correct the tool input once, and retry at most one more time.
- Do not get stuck in repeated script rewrites for style/parser issues.
- Use unique filenames and avoid overwriting an existing PDF unless explicitly requested.
- For polished output, shape the content for an executive layout:
  - concise summary
  - strong section headings
  - table-friendly facts as `Campo: Valor`
  - short readable paragraphs

## Preferred Workflow

```text
1. Call pdf_create with structured content
2. Confirm target.pdf exists
3. Return exact filename or path
```

## Fallback Workflow

Only if `pdf_create` is unavailable or the user explicitly asks for custom code:

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

- prefer `pdf_create`
- provide structure that can render well in the built-in template
- use compact executive prose, not long raw dumps
- use rows like `Campo: Valor` when tabular rendering is appropriate
- keep the document readable and scannable

## Preferred Tool Input Pattern

```text
filename: reporte-ejecutivo-cedula-123456.pdf
title: Perfil Ejecutivo
subtitle: Persona identificada por cedula 0999999999
summary: Sintesis ejecutiva corta y clara
sections:
- heading: Identificacion
  body: |
    Cedula: 0999999999
    Nombre: Nombre Apellido
    Estado: Activo
- heading: Hallazgos relevantes
  body: |
    Parrafo corto de contexto.
    Riesgo principal: Bajo
    Actividad relevante: ...
```

## Critical Reminder

Do not stop after drafting content. Execute the code and verify that the PDF file was actually generated.
