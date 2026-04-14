#!/usr/bin/env python3
import json
import os
import sys

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer


ACCENTS = {
    "blue": "#1A73C8",
    "teal": "#0F766E",
    "emerald": "#047857",
    "slate": "#334155",
}


def text(value):
    return (value or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>")


def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: pdf-create.py <input.json>")

    with open(sys.argv[1], "r", encoding="utf-8") as handle:
        data = json.load(handle)

    out = data["output"]
    os.makedirs(os.path.dirname(out), exist_ok=True)

    doc = SimpleDocTemplate(
        out,
        pagesize=letter,
        leftMargin=0.65 * inch,
        rightMargin=0.65 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
    )

    palette = ACCENTS.get(data.get("accent", "blue"), ACCENTS["blue"])
    styles = getSampleStyleSheet()
    story = []

    title = ParagraphStyle(
        "Title",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#0B1F3A"),
        spaceAfter=6,
    )
    subtitle = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=13,
        alignment=TA_CENTER,
        textColor=colors.HexColor(palette),
        spaceAfter=12,
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
        fontName="Helvetica",
        fontSize=10,
        leading=14,
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
        fontSize=11,
        leading=13,
        alignment=TA_LEFT,
        textColor=colors.white,
        backColor=colors.HexColor(palette),
        borderPadding=(6, 8, 6),
        spaceAfter=8,
        spaceBefore=10,
    )
    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        alignment=TA_JUSTIFY,
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=10,
    )

    story.append(Paragraph(text(data["title"]), title))
    if data.get("subtitle"):
      story.append(Paragraph(text(data["subtitle"]), subtitle))
    story.append(HRFlowable(width="100%", thickness=1.2, color=colors.HexColor(palette), spaceAfter=14))

    if data.get("summary"):
        story.append(Paragraph("Resumen Ejecutivo", summary_label))
        story.append(Paragraph(text(data["summary"]), summary))

    for item in data["sections"]:
        story.append(Paragraph(text(item["heading"]), heading))
        story.append(Paragraph(text(item["body"]), body))
        story.append(Spacer(1, 4))

    doc.build(story)


if __name__ == "__main__":
    main()
