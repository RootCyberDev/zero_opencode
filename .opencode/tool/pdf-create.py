#!/usr/bin/env python3
import json
import os
import sys

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import HRFlowable, KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ACCENTS = {
    "blue": "#1A73C8",
    "teal": "#0F766E",
    "emerald": "#047857",
    "slate": "#334155",
}


def text(value):
    return (value or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>")


def plain(value):
    return " ".join((value or "").replace("\r", "\n").split())


def rows(value):
    out = []
    for line in (value or "").splitlines():
        line = line.strip()
        if not line:
            continue
        if ":" not in line:
            continue
        left, right = line.split(":", 1)
        left = left.strip(" -\t")
        right = right.strip()
        if not left or not right:
            continue
        out.append((left, right))
    return out


def fit(value, limit):
    value = plain(value)
    if len(value) <= limit:
        return value
    return value[: max(0, limit - 1)].rstrip() + "…"


def title_size(value):
    size = len(plain(value))
    if size <= 70:
        return (23, 28)
    if size <= 110:
        return (20, 24)
    return (18, 22)


def wrap(value, style):
    return Paragraph(text(value), style)


def body_table(items, palette, head_style, cell_style):
    data = [["Campo", "Detalle"], *[[wrap(left, head_style), wrap(right, cell_style)] for left, right in items]]
    table = Table(
        data,
        colWidths=[1.55 * inch, 4.75 * inch],
        repeatRows=1,
        hAlign="LEFT",
        splitByRow=1,
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(palette)),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.8),
                ("LEADING", (0, 0), (-1, -1), 11),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#F8FBFF"), colors.white]),
                ("TEXTCOLOR", (0, 1), (-1, -1), colors.HexColor("#172033")),
                ("GRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#D6E4F5")),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#D6E4F5")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def chrome(canvas: Canvas, doc, palette, mark):
    page = canvas.getPageNumber()
    width, height = A4
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor(palette))
    canvas.setLineWidth(1)
    canvas.line(doc.leftMargin, height - 0.58 * inch, width - doc.rightMargin, height - 0.58 * inch)
    canvas.line(doc.leftMargin, 0.52 * inch, width - doc.rightMargin, 0.52 * inch)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#64748B"))
    canvas.drawString(doc.leftMargin, 0.30 * inch, "Resumen ejecutivo generado por IA")
    canvas.drawRightString(width - doc.rightMargin, 0.30 * inch, f"Pagina {page}")
    if mark:
        canvas.saveState()
        canvas.translate(width / 2, height / 2)
        canvas.rotate(45)
        canvas.setFillColor(colors.HexColor("#94A3B8"), alpha=0.10)
        canvas.setFont("Helvetica-Bold", 34)
        canvas.drawCentredString(0, 0, mark)
        canvas.restoreState()
    canvas.restoreState()


def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: pdf-create.py <input.json>")

    with open(sys.argv[1], "r", encoding="utf-8") as handle:
        data = json.load(handle)

    out = data["output"]
    os.makedirs(os.path.dirname(out), exist_ok=True)

    doc = SimpleDocTemplate(
        out,
        pagesize=A4,
        leftMargin=0.72 * inch,
        rightMargin=0.72 * inch,
        topMargin=0.9 * inch,
        bottomMargin=0.82 * inch,
    )

    palette = ACCENTS.get(data.get("accent", "blue"), ACCENTS["blue"])
    mark = plain(data.get("watermark"))
    styles = getSampleStyleSheet()
    story = []
    size, leading = title_size(data["title"])

    title = ParagraphStyle(
        "Title",
        parent=styles["Title"],
        fontName="Times-Bold",
        fontSize=size,
        leading=leading,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#0B1F3A"),
        spaceAfter=6,
    )
    subtitle = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=14,
        alignment=TA_CENTER,
        textColor=colors.HexColor(palette),
        spaceAfter=10,
    )
    meta = ParagraphStyle(
        "Meta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=10,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#64748B"),
        spaceAfter=14,
    )
    summary_label = ParagraphStyle(
        "SummaryLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=11,
        alignment=TA_LEFT,
        textColor=colors.HexColor(palette),
        spaceAfter=4,
    )
    summary = ParagraphStyle(
        "Summary",
        parent=styles["BodyText"],
        fontName="Times-Roman",
        fontSize=10.5,
        leading=15,
        alignment=TA_JUSTIFY,
        textColor=colors.HexColor("#172033"),
        borderPadding=12,
        borderRadius=6,
        borderWidth=1,
        borderColor=colors.HexColor("#D6E4F5"),
        backColor=colors.HexColor("#F7FAFD"),
        spaceAfter=16,
    )
    heading = ParagraphStyle(
        "Heading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11.2,
        leading=13.6,
        alignment=TA_LEFT,
        textColor=colors.white,
        backColor=colors.HexColor(palette),
        borderPadding=(6, 8, 6),
        spaceAfter=8,
        spaceBefore=10,
        wordWrap="LTR",
    )
    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Times-Roman",
        fontSize=10.1,
        leading=15.2,
        alignment=TA_JUSTIFY,
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=10,
        wordWrap="LTR",
    )
    note = ParagraphStyle(
        "Note",
        parent=styles["BodyText"],
        fontName="Helvetica-Oblique",
        fontSize=8.5,
        leading=11,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#64748B"),
        spaceAfter=10,
    )
    table_head = ParagraphStyle(
        "TableHead",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=8.6,
        leading=10.4,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#0F172A"),
        wordWrap="LTR",
    )
    table_body = ParagraphStyle(
        "TableBody",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.6,
        leading=10.8,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#172033"),
        wordWrap="LTR",
    )

    story.append(Paragraph(text(fit(data["title"], 220)), title))
    if data.get("subtitle"):
        story.append(Paragraph(text(fit(data["subtitle"], 220)), subtitle))
    story.append(Paragraph("Documento ejecutivo listo para lectura rapida, sintesis y decision.", meta))
    story.append(HRFlowable(width="100%", thickness=1.2, color=colors.HexColor(palette), spaceAfter=14))

    if data.get("summary"):
        story.append(Paragraph("Resumen Ejecutivo", summary_label))
        story.append(Paragraph(text(data["summary"]), summary))

    table_rows = [
        ("Documento", plain(data["title"])),
        ("Generado", "Resumen ejecutivo generado automaticamente"),
        ("Cuenta", mark or "N/D"),
        ("Secciones", str(len(data["sections"]))),
    ]
    story.append(body_table(table_rows, palette, table_head, table_body))
    story.append(Spacer(1, 12))

    for item in data["sections"]:
        block = [Paragraph(text(fit(item["heading"], 140)), heading)]
        parsed = rows(item["body"])
        if len(parsed) >= 3:
            block.append(body_table(parsed, palette, table_head, table_body))
            extra = [
                line.strip()
                for line in (item["body"] or "").splitlines()
                if line.strip() and ":" not in line
            ]
            if extra:
                block.append(Spacer(1, 8))
                block.append(Paragraph(text("\n".join(extra)), body))
        else:
            block.append(Paragraph(text(item["body"]), body))
        story.append(KeepTogether(block))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 10))
    story.append(
        Paragraph(
            "Este material prioriza lectura ejecutiva, contexto y trazabilidad de hallazgos; no sustituye validacion humana final.",
            note,
        )
    )

    doc.build(
        story,
        onFirstPage=lambda canvas, doc: chrome(canvas, doc, palette, mark),
        onLaterPages=lambda canvas, doc: chrome(canvas, doc, palette, mark),
    )


if __name__ == "__main__":
    main()
