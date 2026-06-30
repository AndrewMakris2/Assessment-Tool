import io
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT

NAVY = HexColor("#1B2A4A")
GOLD = HexColor("#C9A84C")
DARK_GRAY = HexColor("#333333")
LIGHT_GRAY = HexColor("#F5F5F5")
WHITE = HexColor("#FFFFFF")
RED = HexColor("#DC2626")
ORANGE = HexColor("#EA580C")
YELLOW = HexColor("#CA8A04")
GREEN = HexColor("#16A34A")

RATING_COLORS = {
    "Critical": RED,
    "High": ORANGE,
    "Moderate": YELLOW,
    "Low": GREEN,
    "N/A": DARK_GRAY,
}


def _footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(DARK_GRAY)
    canvas.drawString(
        inch, 0.5 * inch,
        "Prepared by Andrew Makris | andrewmakris.dev"
    )
    canvas.drawRightString(
        letter[0] - inch, 0.5 * inch,
        f"Page {doc.page}"
    )
    canvas.restoreState()


def _build_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        "CoverTitle", parent=styles["Title"],
        fontSize=24, textColor=NAVY, spaceAfter=12, alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        "CoverSub", parent=styles["Normal"],
        fontSize=14, textColor=DARK_GRAY, alignment=TA_CENTER, spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        "SectionHead", parent=styles["Heading1"],
        fontSize=16, textColor=NAVY, spaceBefore=20, spaceAfter=10,
    ))
    styles.add(ParagraphStyle(
        "Body", parent=styles["Normal"],
        fontSize=10, textColor=DARK_GRAY, spaceAfter=8, leading=14,
    ))
    styles.add(ParagraphStyle(
        "BulletItem", parent=styles["Normal"],
        fontSize=10, textColor=DARK_GRAY, spaceAfter=4, leading=14,
        leftIndent=20, bulletIndent=10,
    ))
    styles.add(ParagraphStyle(
        "FlaggedItem", parent=styles["Normal"],
        fontSize=10, textColor=RED, spaceAfter=4, leading=14,
        leftIndent=20, bulletIndent=10,
    ))
    styles.add(ParagraphStyle(
        "NoteItem", parent=styles["Normal"],
        fontSize=9, textColor=HexColor("#555555"), spaceAfter=4, leading=12,
        leftIndent=20,
    ))
    styles.add(ParagraphStyle(
        "Confidential", parent=styles["Normal"],
        fontSize=8, textColor=DARK_GRAY, alignment=TA_CENTER,
    ))
    return styles


def _build_cover(elements, styles, intake):
    elements.append(Spacer(1, 2 * inch))
    elements.append(Paragraph("CYBERSECURITY RISK ASSESSMENT REPORT", styles["CoverTitle"]))
    elements.append(Spacer(1, 0.5 * inch))
    elements.append(Paragraph(intake["org_name"], styles["CoverSub"]))
    elements.append(Paragraph(f"Industry: {intake['industry']}", styles["CoverSub"]))
    elements.append(Paragraph(f"Assessment Date: {intake['assessment_date']}", styles["CoverSub"]))
    if intake.get("assessor_name"):
        elements.append(Paragraph(f"Assessor: {intake['assessor_name']}", styles["CoverSub"]))
    elements.append(Spacer(1, 2 * inch))
    elements.append(Paragraph(
        "CONFIDENTIAL — This document contains sensitive security assessment information. "
        "Distribution should be limited to authorized personnel only.",
        styles["Confidential"],
    ))
    elements.append(PageBreak())


def _build_score_section(elements, styles, scoring):
    rating = scoring["risk_rating"]
    color = RATING_COLORS.get(rating, DARK_GRAY)
    elements.append(Paragraph(
        f'Overall Risk Rating: <font color="{color}">{rating}</font> '
        f'({scoring["overall_score"]:.0%})',
        styles["SectionHead"],
    ))

    elements.append(Paragraph("Domain Scores", styles["SectionHead"]))
    table_data = [["Domain", "Score", "Risk Rating"]]
    for domain, data in scoring["domain_scores"].items():
        if data["excluded"]:
            table_data.append([domain, "N/A", "N/A"])
        else:
            table_data.append([domain, f"{data['score']:.0%}", data["rating"]])

    t = Table(table_data, colWidths=[3.5 * inch, 1.25 * inch, 1.25 * inch])
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.5, DARK_GRAY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]
    for i, row in enumerate(table_data[1:], start=1):
        rc = RATING_COLORS.get(row[2], DARK_GRAY)
        style_cmds.append(("TEXTCOLOR", (2, i), (2, i), rc))
    t.setStyle(TableStyle(style_cmds))
    elements.append(t)


def _build_flagged(elements, styles, scoring):
    if not scoring["flagged_findings"]:
        return
    elements.append(Spacer(1, 12))
    elements.append(Paragraph("Prioritized Findings", styles["SectionHead"]))

    sev_order = ["Critical", "High", "Medium", "Low"]
    groups = {}
    for f in scoring["flagged_findings"]:
        s = f.get("severity", "Medium")
        groups.setdefault(s, []).append(f)

    sev_labels = {
        "Critical": "Fix immediately",
        "High": "Fix this week",
        "Medium": "Fix this month",
        "Low": "Plan for next quarter",
    }

    for sev in sev_order:
        if sev not in groups:
            continue
        elements.append(Paragraph(
            f"<b>{sev}</b> — {sev_labels.get(sev, '')}",
            styles["Body"],
        ))
        for f in groups[sev]:
            effort = f.get("effort", "")
            effort_str = f" [{effort} effort]" if effort else ""
            elements.append(Paragraph(
                f'&bull; [{f["id"]}] {f["question"]}{effort_str}',
                styles["FlaggedItem"],
            ))
            fix = f.get("fix_hint", "")
            if fix:
                elements.append(Paragraph(fix, styles["NoteItem"]))


def _build_notes_section(elements, styles, notes):
    if not notes:
        return
    filled = {k: v for k, v in notes.items() if v.strip()}
    if not filled:
        return
    elements.append(Spacer(1, 12))
    elements.append(Paragraph("Assessor Notes", styles["SectionHead"]))
    for qid, note in filled.items():
        elements.append(Paragraph(
            f"<b>[{qid}]</b> {note}",
            styles["NoteItem"],
        ))


def generate_pdf(intake: dict, scoring: dict, report: dict, notes: dict = None) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=letter,
        leftMargin=inch, rightMargin=inch,
        topMargin=inch, bottomMargin=inch,
    )
    styles = _build_styles()
    elements = []

    _build_cover(elements, styles, intake)

    # Executive Summary
    elements.append(Paragraph("Executive Summary", styles["SectionHead"]))
    for para in report["executive_summary"].split("\n\n"):
        if para.strip():
            elements.append(Paragraph(para.strip(), styles["Body"]))

    elements.append(Spacer(1, 12))
    _build_score_section(elements, styles, scoring)
    _build_flagged(elements, styles, scoring)
    _build_notes_section(elements, styles, notes)

    # Key Findings
    elements.append(PageBreak())
    elements.append(Paragraph("Key Findings", styles["SectionHead"]))
    for finding in report["key_findings"]:
        elements.append(Paragraph(f"&bull; {finding}", styles["BulletItem"]))

    # Domain Analysis
    elements.append(Paragraph("Domain Analysis", styles["SectionHead"]))
    counter = [0]
    for domain, analysis in report["domain_analysis"].items():
        counter[0] += 1
        elements.append(Paragraph(domain, ParagraphStyle(
            f"DomainName_{counter[0]}", parent=styles["Heading2"],
            fontSize=12, textColor=NAVY, spaceBefore=12, spaceAfter=6,
        )))
        elements.append(Paragraph(analysis, styles["Body"]))

    # Remediation Roadmap
    elements.append(PageBreak())
    elements.append(Paragraph("Remediation Roadmap", styles["SectionHead"]))
    for phase, label in [
        ("short_term", "Short-Term (0-30 Days)"),
        ("mid_term", "Mid-Term (30-90 Days)"),
        ("long_term", "Long-Term (90+ Days)"),
    ]:
        elements.append(Paragraph(label, ParagraphStyle(
            f"Phase_{phase}", parent=styles["Heading3"],
            fontSize=11, textColor=GOLD, spaceBefore=10, spaceAfter=4,
        )))
        for item in report["remediation_roadmap"].get(phase, []):
            elements.append(Paragraph(f"&bull; {item}", styles["BulletItem"]))

    # Closing Statement
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("Closing Statement", styles["SectionHead"]))
    elements.append(Paragraph(report["closing_statement"], styles["Body"]))

    doc.build(elements, onFirstPage=_footer, onLaterPages=_footer)
    buf.seek(0)
    return buf.read()


def generate_fallback_pdf(intake: dict, scoring: dict, notes: dict = None) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=letter,
        leftMargin=inch, rightMargin=inch,
        topMargin=inch, bottomMargin=inch,
    )
    styles = _build_styles()
    elements = []

    _build_cover(elements, styles, intake)
    _build_score_section(elements, styles, scoring)
    _build_flagged(elements, styles, scoring)
    _build_notes_section(elements, styles, notes)

    elements.append(Spacer(1, 20))
    elements.append(Paragraph(
        "Note: This report contains scoring data only. AI-generated narrative analysis "
        "was not available at the time of export.",
        styles["Body"],
    ))

    doc.build(elements, onFirstPage=_footer, onLaterPages=_footer)
    buf.seek(0)
    return buf.read()
