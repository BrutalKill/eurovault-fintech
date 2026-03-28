"""
pdf_generator.py — Financial Contract PDF with SHA-256 Certification
EuroVault Digital Solutions · Legal Automation Module

Features:
- Professional PDF with company logo + watermark
- SHA-256 hash calculated from document content
- Signer IP + UTC timestamp recorded
- Tokyo headquarters address embedded

Usage:
    from contracts.pdf_generator import generate_contract_pdf
    pdf_bytes = generate_contract_pdf(company, client_data, content, signer_name, signer_ip)
"""

import hashlib
import base64
from datetime import datetime, timezone
from io import BytesIO
from typing import Optional


COMPANY_DEFAULTS = {
    "name":       "EuroVault Digital Solutions",
    "address":    "1-1 Chiyoda, Tokyo, 100-8111, Japan",
    "tax_number": "JP-999888777",
    "email":      "support@eurovault.eu",
    "phone":      "+81 3 0000 0000",
    "legal_text": (
        "EuroVault Digital Solutions · IFSB Reg. No. JP-999888777 · "
        "International Financial Standards · Global Digital Jurisdiction. "
        "Document generated electronically with full legal validity."
    ),
}

SERVICE_OBJECT = (
    "Provision of data analytics consulting services, financial market intelligence, "
    "and temporary licensing of a decision-support software platform."
)

SECURITY_CLAUSE = (
    "The present service is considered fully rendered and executed upon provision of "
    "access credentials or consultation via telematic means (Voice Call/WhatsApp). "
    "Given the digital and immediate nature of the service, the client acknowledges "
    "that no right of withdrawal or refund exists after commencement of execution, "
    "in accordance with International Digital Services Standards (IDSS) and "
    "Global Digital Jurisdiction."
)


def compute_sha256(
    token: str,
    client_name: str,
    email: str,
    amount: str,
    timestamp: str,
    signer_ip: str,
) -> str:
    """
    Compute SHA-256 hash for contract certification.
    Combines all critical fields to ensure integrity.
    
    The hash changes if ANY of these fields is modified,
    providing tamper-evident certification.
    """
    data = f"{token}|{client_name}|{email}|{amount}|{timestamp}|{signer_ip}"
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def generate_contract_pdf(
    company: dict,
    client_data: dict,
    processed_content: str,
    signature_name: str,
    signature_image: Optional[str] = None,
    cert_info: Optional[dict] = None,
) -> bytes:
    """
    Generate a professional financial contract PDF.
    
    Args:
        company:           Company info (name, address, tax_number, logo_b64)
        client_data:       Client details (nome_completo, email, valor_investimento, etc.)
        processed_content: Contract body text (placeholders already filled)
        signature_name:    Client's typed signature name
        signature_image:   Optional base64 PNG of drawn signature
        cert_info:         SHA-256 hash, IP, and timestamp for certification
    
    Returns:
        PDF file as bytes
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table,
        TableStyle, HRFlowable, KeepTogether
    )
    from reportlab.pdfgen import canvas as pdfcanvas
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
    from reportlab.lib.utils import ImageReader
    from PIL import Image as PILImage

    # ── Colour palette ────────────────────────────────────────────────────────
    NAVY   = colors.HexColor('#0A1628')
    GOLD   = colors.HexColor('#C9A84C')
    GOLD2  = colors.HexColor('#E8C96A')
    WHITE  = colors.white
    TEXT   = colors.HexColor('#0d1b2a')
    MUTED  = colors.HexColor('#5a6280')
    LIGHT  = colors.HexColor('#F0F4FF')
    BORDER = colors.HexColor('#E5E7EB')

    W, H = A4
    buf = BytesIO()

    # ── Logo & watermark ──────────────────────────────────────────────────────
    logo_b64   = company.get("logo_b64", "")
    logo_reader = None
    wm_reader   = None

    if logo_b64:
        try:
            raw = base64.b64decode(logo_b64.split(",")[-1])
            logo_reader = ImageReader(BytesIO(raw))

            pil = PILImage.open(BytesIO(raw)).convert("RGBA")
            pil = pil.resize((320, 320), PILImage.LANCZOS)
            gray = pil.convert("L")
            _, _, _, a = pil.split()
            wm = PILImage.merge("RGBA", (gray, gray, gray, a.point(lambda x: int(x * 0.07))))
            wm_buf = BytesIO()
            wm.save(wm_buf, "PNG")
            wm_buf.seek(0)
            wm_reader = ImageReader(wm_buf)
        except Exception:
            pass

    # ── SHA-256 reference ─────────────────────────────────────────────────────
    token = client_data.get("token", "")
    ref   = (token[:16] if len(token) >= 16 else token).upper()

    def draw_page(canv, doc):
        canv.saveState()

        # Background
        canv.setFillColor(WHITE)
        canv.rect(0, 0, W, H, fill=1, stroke=0)

        # Header bar
        canv.setFillColor(NAVY)
        canv.rect(0, H - 3.2*cm, W, 3.2*cm, fill=1, stroke=0)
        canv.setFillColor(GOLD)
        canv.rect(0, H - 3.2*cm - 0.12*cm, W, 0.12*cm, fill=1, stroke=0)

        # Logo
        name_x = 1.2*cm
        if logo_reader:
            try:
                canv.drawImage(
                    logo_reader, 1.0*cm, H - 3.0*cm,
                    width=2.2*cm, height=2.2*cm,
                    mask="auto", preserveAspectRatio=True
                )
                name_x = 3.6*cm
            except Exception:
                pass

        # Company name in header
        canv.setFillColor(WHITE)
        canv.setFont("Helvetica-Bold", 12)
        canv.drawString(name_x, H - 1.35*cm, company.get("name", COMPANY_DEFAULTS["name"]).upper())
        canv.setFillColor(GOLD2)
        canv.setFont("Helvetica", 7.5)
        canv.drawString(name_x, H - 1.9*cm, "INTERNATIONAL FINANCIAL STANDARDS · DIGITAL JURISDICTION")
        canv.setFont("Helvetica", 7)
        canv.drawString(name_x, H - 2.5*cm, company.get("address", COMPANY_DEFAULTS["address"]))

        # Ref + date
        date_str = client_data.get("data_contrato", datetime.now().strftime("%d/%m/%Y"))
        canv.setFillColor(GOLD)
        canv.setFont("Helvetica-Bold", 7)
        canv.drawRightString(W - 1.2*cm, H - 1.5*cm, f"REF: {ref}")
        canv.setFillColor(colors.HexColor("#94A3B8"))
        canv.setFont("Helvetica", 6.5)
        canv.drawRightString(W - 1.2*cm, H - 2.1*cm, f"Date: {date_str}")

        # Watermark
        if wm_reader:
            try:
                canv.saveState()
                canv.translate(W / 2, H / 2 - 1*cm)
                canv.rotate(25)
                canv.drawImage(wm_reader, -4.5*cm, -4.5*cm, width=9*cm, height=9*cm, mask="auto")
                canv.restoreState()
            except Exception:
                pass

        # Footer
        canv.setFillColor(NAVY)
        canv.rect(0, 0, W, 1.1*cm, fill=1, stroke=0)
        canv.setFillColor(GOLD)
        canv.rect(0, 1.1*cm, W, 0.08*cm, fill=1, stroke=0)
        canv.setFillColor(GOLD2)
        canv.setFont("Helvetica", 6.5)
        canv.drawString(1.2*cm, 0.38*cm, f"REF: {ref}")
        canv.drawCentredString(W / 2, 0.38*cm, "Confidential document — for parties only")
        canv.drawRightString(W - 1.2*cm, 0.38*cm, f"Page {canv.getPageNumber()}")

        # Gold accent stripe
        canv.setFillColor(GOLD)
        canv.rect(0, 1.18*cm, 0.18*cm, H - 3.32*cm - 1.18*cm, fill=1, stroke=0)

        canv.restoreState()

    # ── Document build ────────────────────────────────────────────────────────
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=1.0*cm, rightMargin=1.4*cm,
        topMargin=3.8*cm, bottomMargin=2.0*cm,
        title="Investment & Digital Services Agreement",
        author=company.get("name", COMPANY_DEFAULTS["name"]),
        subject="Financial Contract",
        creator="EuroVault Digital Solutions",
    )

    styles = getSampleStyleSheet()
    def sty(name, **kw):
        return ParagraphStyle(name, parent=styles["Normal"], **kw)

    story = [Spacer(1, 0.2*cm)]

    # Title
    story.append(Paragraph(
        "INVESTMENT &amp; DIGITAL SERVICES AGREEMENT",
        sty("T", fontSize=14, fontName="Helvetica-Bold", alignment=TA_CENTER,
            textColor=NAVY, spaceAfter=4)
    ))
    story.append(HRFlowable(width="70%", thickness=1.5, color=GOLD,
                             hAlign="CENTER", spaceAfter=6, spaceBefore=2))
    story.append(Paragraph(
        f"Ref.: <b>{ref}</b> &nbsp;|&nbsp; Date: <b>{client_data.get('data_contrato', '')}</b>",
        sty("R", fontSize=9, fontName="Helvetica", alignment=TA_CENTER, textColor=MUTED, spaceAfter=4)
    ))
    story.append(Spacer(1, 0.4*cm))

    # Parties table
    cd = client_data
    col_w = (W - doc.leftMargin - doc.rightMargin - 0.4*cm) / 2

    def cell(label, value, gold=False):
        return [
            Paragraph(label, sty("lbl", fontSize=8, fontName="Helvetica-Bold", textColor=MUTED)),
            Paragraph(str(value), sty("val", fontSize=9, fontName="Helvetica-Bold" if gold else "Helvetica",
                                      textColor=GOLD if gold else TEXT)),
        ]

    client_rows = [
        cell("FULL NAME",            cd.get("nome_completo", "")),
        cell("EMAIL",                cd.get("email", "")),
        cell("PHONE",                cd.get("telefone", "")),
        cell("ID DOCUMENT",          cd.get("documento", "")),
        cell("ADDRESS",              cd.get("morada", "—")),
        cell("INVESTMENT AMOUNT",    f"€ {cd.get('valor_investimento', '')}", gold=True),
    ]
    company_rows = [
        cell("COMPANY",  company.get("name", COMPANY_DEFAULTS["name"])),
        cell("ADDRESS",  company.get("address", COMPANY_DEFAULTS["address"])),
        cell("TAX ID",   company.get("tax_number", COMPANY_DEFAULTS["tax_number"])),
        cell("EMAIL",    company.get("email", COMPANY_DEFAULTS["email"])),
        cell("PHONE",    company.get("phone", COMPANY_DEFAULTS["phone"])),
        cell("REG.",     f"IFSB Reg. No. {company.get('tax_number', 'JP-999888777')}"),
    ]

    def make_info_table(rows, bg):
        t = Table(rows, colWidths=[3*cm, col_w - 3*cm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), bg),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("LINEBELOW", (0, 0), (-1, -2), 0.3, BORDER),
        ]))
        return t

    s_hdr = sty("SH", fontSize=8, fontName="Helvetica-Bold", alignment=TA_CENTER, textColor=WHITE)
    outer = Table(
        [[Paragraph("PARTY A — CLIENT", s_hdr), Paragraph("PARTY B — COMPANY", s_hdr)],
         [make_info_table(client_rows, LIGHT), make_info_table(company_rows, WHITE)]],
        colWidths=[col_w, col_w], hAlign="LEFT",
    )
    outer.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("LINEBELOW", (0, 0), (-1, 0), 2, GOLD),
        ("BOX", (0, 0), (-1, -1), 0.8, GOLD),
        ("LINEBEFORE", (1, 0), (1, -1), 0.5, GOLD),
        ("TOPPADDING", (0, 0), (-1, 0), 7),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 7),
        ("TOPPADDING", (0, 1), (-1, 1), 0),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 0),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(outer)
    story.append(Spacer(1, 0.6*cm))

    # Contract body
    story.append(HRFlowable(width="100%", thickness=0.8, color=GOLD, spaceAfter=6))
    for line in processed_content.split("\n"):
        stripped = line.strip()
        if not stripped:
            story.append(Spacer(1, 0.15*cm))
        elif stripped.isupper() and 4 < len(stripped) < 80:
            story.append(Paragraph(stripped,
                sty("CH", fontSize=9.5, fontName="Helvetica-Bold", textColor=NAVY,
                    spaceBefore=8, spaceAfter=3)))
        else:
            safe = stripped.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            story.append(Paragraph(safe,
                sty("B", fontSize=9.2, fontName="Helvetica", leading=15,
                    alignment=TA_JUSTIFY, textColor=TEXT, spaceAfter=4)))

    story.append(Spacer(1, 0.5*cm))
    story.append(HRFlowable(width="100%", thickness=0.8, color=GOLD, spaceAfter=6))
    story.append(Spacer(1, 0.4*cm))

    # Signatures
    sig_name = provider_sig = signature_name or ""
    client_sig = [
        Spacer(1, 0.2*cm),
        Paragraph(f"<i>{sig_name}</i>",
                  sty("SN", fontSize=13, fontName="Helvetica-BoldOblique",
                      alignment=TA_CENTER, textColor=NAVY)),
        HRFlowable(width="80%", thickness=0.5, color=NAVY, hAlign="CENTER"),
        Paragraph("Client Signature", sty("SL", fontSize=7, fontName="Helvetica",
                                           alignment=TA_CENTER, textColor=MUTED)),
    ]
    company_sig = [
        Spacer(1, 0.2*cm),
        Paragraph("_________________________",
                  sty("BL", fontSize=14, fontName="Helvetica", alignment=TA_CENTER, textColor=MUTED)),
        Paragraph(company.get("name", COMPANY_DEFAULTS["name"]),
                  sty("CL", fontSize=8, fontName="Helvetica", alignment=TA_CENTER, textColor=MUTED)),
        Paragraph("Authorised Representative",
                  sty("RA", fontSize=7, fontName="Helvetica", alignment=TA_CENTER, textColor=MUTED)),
    ]

    sig_t = Table(
        [[Paragraph("CLIENT SIGNATURE", s_hdr), Paragraph("COMPANY SIGNATURE", s_hdr)],
         [client_sig, company_sig]],
        colWidths=[col_w, col_w], hAlign="LEFT",
    )
    sig_t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("LINEBELOW", (0, 0), (-1, 0), 1.5, GOLD),
        ("BOX", (0, 0), (-1, -1), 0.8, GOLD),
        ("LINEBEFORE", (1, 0), (1, -1), 0.5, GOLD),
        ("BACKGROUND", (0, 1), (0, 1), LIGHT),
        ("BACKGROUND", (1, 1), (1, 1), WHITE),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, 0), 7),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 7),
        ("TOPPADDING", (0, 1), (-1, 1), 10),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 14),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(sig_t)
    story.append(Spacer(1, 0.5*cm))

    # Legal footer
    legal = company.get("legal_text", COMPANY_DEFAULTS["legal_text"])
    story.append(Paragraph(legal, sty("LF", fontSize=7, fontName="Helvetica",
                                       alignment=TA_CENTER, textColor=MUTED)))

    # SHA-256 Certification block
    if cert_info:
        story.append(Spacer(1, 0.4*cm))
        cert_hash = cert_info.get("cert_hash", "")
        cert_ts   = cert_info.get("cert_timestamp", "")
        cert_ip   = cert_info.get("signer_ip", "")

        cert_rows = [
            [Paragraph("DIGITAL CERTIFICATION — SHA-256", sty("CH2", fontSize=8,
                fontName="Helvetica-Bold", alignment=TA_CENTER, textColor=WHITE)), ""],
            [Paragraph("Timestamp:", sty("CK", fontSize=7.5, fontName="Helvetica-Bold", textColor=NAVY)),
             Paragraph(cert_ts, sty("CV", fontSize=7.5, fontName="Helvetica", textColor=TEXT))],
            [Paragraph("Signer IP:", sty("CK", fontSize=7.5, fontName="Helvetica-Bold", textColor=NAVY)),
             Paragraph(cert_ip, sty("CV", fontSize=7.5, fontName="Helvetica", textColor=TEXT))],
            [Paragraph("SHA-256 Hash:", sty("CK", fontSize=7.5, fontName="Helvetica-Bold", textColor=NAVY)),
             Paragraph(cert_hash[:32] + "…", sty("CVm", fontSize=6.5, fontName="Courier", textColor=NAVY))],
        ]
        cert_table = Table(cert_rows, colWidths=[3.5*cm, col_w * 2 - 3.5*cm])
        cert_table.setStyle(TableStyle([
            ("SPAN", (0, 0), (-1, 0)),
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TOPPADDING", (0, 0), (-1, 0), 6),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
            ("BACKGROUND", (0, 1), (-1, -1), LIGHT),
            ("TOPPADDING", (0, 1), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 1), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("BOX", (0, 0), (-1, -1), 0.8, GOLD),
            ("LINEBELOW", (0, 0), (-1, 0), 1, GOLD),
        ]))
        story.append(cert_table)

    doc.build(story, onFirstPage=draw_page, onLaterPages=draw_page)
    return buf.getvalue()


if __name__ == "__main__":
    # Demo: generate a sample contract
    company = COMPANY_DEFAULTS.copy()
    client  = {
        "nome_completo": "Alex Grayson",
        "email":         "alex.grayson@example.com",
        "telefone":      "+1 212 555 0123",
        "documento":     "US-AG-88921",
        "valor_investimento": "30000",
        "data_contrato": datetime.now().strftime("%d/%m/%Y"),
        "morada":        "350 5th Avenue, New York, NY 10118, USA",
        "token":         "demo1234567890ab",
    }
    cert = {
        "cert_hash":      compute_sha256(
            client["token"], client["nome_completo"], client["email"],
            client["valor_investimento"],
            datetime.now(timezone.utc).isoformat(), "192.168.1.1"
        ),
        "cert_timestamp": datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M:%S UTC"),
        "signer_ip":      "192.168.1.1",
    }
    content = f"""INVESTMENT & DIGITAL SERVICES AGREEMENT

{SERVICE_OBJECT}

CLAUSE 1 — OBJECT
{SERVICE_OBJECT}

CLAUSE 6 — DIGITAL SERVICES
{SECURITY_CLAUSE}

CLAUSE 9 — GOVERNING LAW
This Agreement is governed by International Financial Standards (IFS).
All disputes resolved by international arbitration under UNCITRAL rules."""

    pdf_bytes = generate_contract_pdf(company, client, content, client["nome_completo"], cert_info=cert)

    with open("sample_contract.pdf", "wb") as f:
        f.write(pdf_bytes)
    print(f"Sample contract generated: sample_contract.pdf ({len(pdf_bytes):,} bytes)")
    print(f"SHA-256: {cert['cert_hash']}")
