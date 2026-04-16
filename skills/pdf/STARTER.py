from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY


doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    leftMargin=0.72 * inch,
    rightMargin=0.72 * inch,
    topMargin=0.72 * inch,
    bottomMargin=0.72 * inch,
)

styles = getSampleStyleSheet()

title = ParagraphStyle(
    "Title",
    parent=styles["Title"],
    fontName="Helvetica-Bold",
    fontSize=24,
    leading=28,
    alignment=TA_CENTER,
    textColor=colors.HexColor("#0F172A"),
    spaceAfter=10,
)

subtitle = ParagraphStyle(
    "Subtitle",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=11,
    leading=14,
    alignment=TA_CENTER,
    textColor=colors.HexColor("#475569"),
    spaceAfter=12,
)

heading = ParagraphStyle(
    "Heading",
    parent=styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=12,
    leading=15,
    alignment=TA_LEFT,
    textColor=colors.HexColor("#0F172A"),
    spaceBefore=10,
    spaceAfter=6,
)

body = ParagraphStyle(
    "Body",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=9.5,
    leading=14,
    alignment=TA_JUSTIFY,
    textColor=colors.HexColor("#1E293B"),
)

label = ParagraphStyle(
    "Label",
    parent=body,
    fontName="Helvetica-Bold",
    textColor=colors.HexColor("#0F172A"),
)


def para(text, style=body):
    return Paragraph(text, style)


def rule():
    return HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#CBD5E1"))


def facts(rows):
    data = [[para(k, label), para(v)] for k, v in rows]
    tbl = Table(data, colWidths=[1.75 * inch, 4.55 * inch], hAlign="LEFT")
    tbl.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LINEBELOW", (0, 0), (-1, -1), 0.35, colors.HexColor("#E2E8F0")),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return tbl


story = [
    para("Executive PDF Title", title),
    para("Subtitle or document context", subtitle),
    rule(),
    Spacer(1, 12),
    KeepTogether(
        [
            para("Executive Summary", heading),
            para("Write a concise and premium executive summary here."),
        ]
    ),
    Spacer(1, 8),
    para("Key Facts", heading),
    facts(
        [
            ("Field", "Value"),
            ("Field", "Value"),
        ]
    ),
]

doc.build(story)
