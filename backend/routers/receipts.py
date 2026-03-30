"""
receipts.py — Geração de recibos PDF (versão Cliente e versão Banco/Neutro).
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import hashlib as _hl
import io as _io

from deps import db, get_admin_user

router = APIRouter()


SECURITY_CLAUSE = (
    "The present service is considered fully rendered and executed upon provision of access credentials "
    "or consultation via telematic means (Voice Call/WhatsApp). Given the digital and immediate nature "
    "of the service, the client acknowledges that no right of withdrawal or refund exists after commencement "
    "of execution, in accordance with International Digital Services Standards (IDSS) and Global Digital Jurisdiction."
)

SERVICE_OBJECT = (
    "Provision of data analytics consulting services, financial market intelligence, "
    "and temporary licensing of a decision-support software platform."
)

_BANK_SERVICE_OBJECT = (
    "Serviços de consultoria em informática, licenciamento de software "
    "e suporte técnico remoto."
)

_BANK_SECURITY_CLAUSE = (
    "The present service is considered fully rendered and executed upon provision of access credentials "
    "or consultation via telematic means (Voice Call/WhatsApp). Given the digital and immediate nature "
    "of the service, the client acknowledges that no right of withdrawal or refund exists after commencement "
    "of execution, in accordance with International Digital Services Standards (IDSS) and Global Digital Jurisdiction."
)

_BANCO_ZERO_BRAND = True


# ── Modelos ────────────────────────────────────────────────────────────────────
class ReceiptRequest(BaseModel):
    client_name: str
    value: str
    date: Optional[str] = ""
    notes: Optional[str] = ""


class ReceiptProviderRequest(BaseModel):
    name: str
    nif: str
    address: str
    signature_name: Optional[str] = ""


# ── PDF Cliente (com marca EuroVault) ─────────────────────────────────────────
def _generate_receipt_pdf(provider: dict, client_name: str, value: str,
                           date_str: str, notes: str = "") -> bytes:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                    TableStyle, HRFlowable, KeepTogether)
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
    from reportlab.lib.utils import ImageReader
    from PIL import Image as PILImage

    NAVY   = colors.HexColor('#0A1628')
    GOLD   = colors.HexColor('#C9A84C')
    GOLD2  = colors.HexColor('#E8C96A')
    WHITE  = colors.white
    TEXT   = colors.HexColor('#0d1b2a')
    MUTED  = colors.HexColor('#5a6280')
    LIGHT  = colors.HexColor('#F0F4FF')
    BORDER = colors.HexColor('#E5E7EB')

    W, H = A4
    ref_data = f"{client_name}|{value}|{date_str}"
    ref_hash = _hl.sha256(ref_data.encode()).hexdigest()[:12].upper()

    buf = _io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm, topMargin=2.5*cm, bottomMargin=2*cm,
        title="receipt", creator="EuroVault Digital Solutions")

    styles = getSampleStyleSheet()
    def s(name, **kw):
        return ParagraphStyle(name, parent=styles['Normal'], **kw)

    s_title   = s('T', fontName='Helvetica-Bold', fontSize=16, alignment=TA_CENTER,
                   textColor=NAVY, spaceAfter=2)
    s_sub     = s('S', fontName='Helvetica', fontSize=9, alignment=TA_CENTER,
                   textColor=MUTED, spaceAfter=2)
    s_label   = s('L', fontName='Helvetica-Bold', fontSize=9, textColor=MUTED)
    s_value   = s('V', fontName='Helvetica', fontSize=9, textColor=TEXT)
    s_amount  = s('A', fontName='Helvetica-Bold', fontSize=14, alignment=TA_CENTER, textColor=NAVY)
    s_body    = s('B', fontName='Helvetica', fontSize=8.5, leading=13,
                   alignment=TA_JUSTIFY, textColor=TEXT, spaceAfter=3)
    s_footer  = s('F', fontName='Helvetica', fontSize=7.5, alignment=TA_CENTER, textColor=MUTED)

    def draw_page(canv, doc):
        canv.saveState()
        canv.setFillColor(NAVY)
        canv.rect(0, H - 2*cm, W, 2*cm, fill=1, stroke=0)
        canv.setFillColor(GOLD)
        canv.rect(0, H - 2*cm - 0.1*cm, W, 0.1*cm, fill=1, stroke=0)
        canv.setFillColor(WHITE)
        canv.setFont('Helvetica-Bold', 11)
        canv.drawString(2*cm, H - 1.3*cm, "EuroVault Digital Solutions")
        canv.setFillColor(GOLD2)
        canv.setFont('Helvetica', 7.5)
        canv.drawString(2*cm, H - 1.65*cm, "1-1 Chiyoda, Tokyo, 100-8111, Japan · IFSB Reg. No. JP-999888777")
        canv.setFillColor(GOLD2)
        canv.setFont('Helvetica-Bold', 8)
        canv.drawRightString(W - 2*cm, H - 1.3*cm, "RECIBO OFICIAL")
        canv.setFillColor(NAVY)
        canv.rect(0, 0, W, 1.2*cm, fill=1, stroke=0)
        canv.setFillColor(GOLD)
        canv.rect(0, 1.2*cm, W, 0.06*cm, fill=1, stroke=0)
        canv.setFillColor(GOLD2)
        canv.setFont('Helvetica', 7)
        canv.drawCentredString(W/2, 0.45*cm, f"REF: {ref_hash} · Documento oficial EuroVault Digital Solutions")
        canv.restoreState()

    story = []
    story.append(Spacer(1, 0.4*cm))
    story.append(Paragraph("RECIBO DE PAGAMENTO", s_title))
    story.append(Paragraph("PAYMENT RECEIPT", s_sub))
    story.append(HRFlowable(width="60%", thickness=1.5, color=GOLD, hAlign='CENTER', spaceAfter=6))
    story.append(Spacer(1, 0.2*cm))

    meta_rows = [
        [Paragraph("Data / Date:", s_label), Paragraph(date_str, s_value),
         Paragraph("Ref.ª:", s_label), Paragraph(ref_hash, s_value)],
    ]
    mt = Table(meta_rows, colWidths=[3*cm, 5*cm, 2*cm, 5*cm])
    mt.setStyle(TableStyle([
        ('TOPPADDING',(0,0),(-1,-1),3), ('BOTTOMPADDING',(0,0),(-1,-1),3),
    ]))
    story.append(mt)
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=6))
    story.append(Spacer(1, 0.2*cm))

    story.append(Paragraph("DADOS DA TRANSAÇÃO", s('SEC', fontName='Helvetica-Bold', fontSize=9,
        textColor=NAVY, spaceBefore=6, spaceAfter=4)))
    detail_rows = [
        [Paragraph("Prestador / Provider:", s_label), Paragraph(provider.get("name",""), s_value)],
        [Paragraph("NIF / Tax ID:", s_label), Paragraph(provider.get("nif",""), s_value)],
        [Paragraph("Morada / Address:", s_label), Paragraph(provider.get("address",""), s_value)],
        [Paragraph("Cliente / Client:", s_label), Paragraph(client_name, s_value)],
    ]
    dt = Table(detail_rows, colWidths=[4*cm, 11*cm])
    dt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT),
        ('TOPPADDING',(0,0),(-1,-1),5), ('BOTTOMPADDING',(0,0),(-1,-1),5),
        ('LEFTPADDING',(0,0),(-1,-1),8), ('RIGHTPADDING',(0,0),(-1,-1),8),
        ('LINEBELOW',(0,0),(-1,-2),0.3,BORDER),
        ('BOX',(0,0),(-1,-1),0.6,GOLD),
    ]))
    story.append(dt)
    story.append(Spacer(1, 0.5*cm))

    story.append(Paragraph(f"EUR {value}", s_amount))
    story.append(Paragraph("Valor Total / Total Amount", s_sub))
    story.append(Spacer(1, 0.4*cm))

    story.append(Paragraph("OBJETO DO SERVIÇO / SERVICE DESCRIPTION", s('SEC2', fontName='Helvetica-Bold',
        fontSize=9, textColor=NAVY, spaceBefore=6, spaceAfter=4)))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=4))
    story.append(Paragraph(SERVICE_OBJECT, s_body))
    story.append(Spacer(1, 0.3*cm))

    story.append(Paragraph("TERMOS E CONDIÇÕES / TERMS & CONDITIONS", s('SEC3', fontName='Helvetica-Bold',
        fontSize=9, textColor=NAVY, spaceBefore=6, spaceAfter=4)))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=4))
    story.append(Paragraph(SECURITY_CLAUSE, s_body))
    story.append(Spacer(1, 0.3*cm))

    if notes and notes.strip():
        story.append(Paragraph("NOTAS / NOTES", s('SEC4', fontName='Helvetica-Bold',
            fontSize=9, textColor=NAVY, spaceBefore=6, spaceAfter=4)))
        story.append(Paragraph(notes, s_body))

    story.append(Spacer(1, 0.5*cm))
    story.append(HRFlowable(width="100%", thickness=0.8, color=GOLD, spaceAfter=6))
    sig_name = provider.get("signature_name","") or provider.get("name","")
    story.append(Paragraph(
        f"Declaro ter recebido a quantia de <b>EUR {value}</b> a título dos serviços identificados.",
        s('DEC', fontName='Helvetica', fontSize=9, leading=14, alignment=TA_JUSTIFY, textColor=TEXT)
    ))
    story.append(Spacer(1, 1*cm))

    sig_rows = [
        [Paragraph("ASSINATURA DO PRESTADOR", s('SH', fontName='Helvetica-Bold', fontSize=8,
                    alignment=TA_CENTER, textColor=MUTED)),
         Paragraph("ASSINATURA DO CLIENTE", s('SH2', fontName='Helvetica-Bold', fontSize=8,
                    alignment=TA_CENTER, textColor=MUTED))],
        [Paragraph(f"\n\n\n_________________________\n{sig_name}\n{date_str}",
                   s('SG', fontName='Helvetica', fontSize=8.5, alignment=TA_CENTER, textColor=TEXT)),
         Paragraph(f"\n\n\n_________________________\n{client_name}",
                   s('SG2', fontName='Helvetica', fontSize=8.5, alignment=TA_CENTER, textColor=TEXT))],
    ]
    col_half = (W - doc.leftMargin - doc.rightMargin) / 2
    st = Table(sig_rows, colWidths=[col_half, col_half])
    st.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), LIGHT),
        ('BOX', (0,0), (-1,-1), 0.6, GOLD),
        ('LINEBEFORE', (1,0), (1,-1), 0.5, GOLD),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,0), 5), ('BOTTOMPADDING', (0,0), (-1,0), 5),
        ('TOPPADDING', (0,1), (-1,1), 4), ('BOTTOMPADDING', (0,1), (-1,1), 6),
    ]))
    story.append(st)
    story.append(Spacer(1, 0.4*cm))
    story.append(Paragraph(
        f"© {datetime.utcnow().year} EuroVault Digital Solutions · IFSB Reg. No. JP-999888777 · {date_str}",
        s_footer))

    doc.build(story, onFirstPage=draw_page, onLaterPages=draw_page)
    return buf.getvalue()


# ── PDF Banco/Neutro (zero marca) ──────────────────────────────────────────────
def _generate_receipt_bank_pdf(provider: dict, client_name: str, value: str,
                                date_str: str, notes: str = "") -> bytes:
    assert _BANCO_ZERO_BRAND, "ZERO BRAND flag must be active"
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib import colors as _bc
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT

    BK_BLACK  = _bc.HexColor('#000000')
    BK_DARK   = _bc.HexColor('#1a1a1a')
    BK_GRAY   = _bc.HexColor('#555555')
    BK_LGRAY  = _bc.HexColor('#888888')
    BK_WHITE  = _bc.white
    BK_BORDER = _bc.HexColor('#CCCCCC')
    BK_LBKG   = _bc.HexColor('#F5F5F5')

    W, H = A4
    buf = _io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
        leftMargin=2.5*cm, rightMargin=2.5*cm, topMargin=2.5*cm, bottomMargin=2.5*cm,
        title="prestacao_servicos", author="Prestador Independente",
        subject="Fatura de Prestacao de Servicos", creator="")

    styles = getSampleStyleSheet()
    def _s(name, **kw):
        return ParagraphStyle(name, parent=styles['Normal'], **kw)

    s_doc_title = _s('DT', fontName='Times-Bold', fontSize=14, alignment=TA_CENTER,
                      textColor=BK_BLACK, spaceAfter=6, spaceBefore=4)
    s_section   = _s('SEC', fontName='Times-Bold', fontSize=10, textColor=BK_BLACK,
                      spaceBefore=10, spaceAfter=3)
    s_label     = _s('LBL', fontName='Times-Bold', fontSize=9.5, textColor=BK_DARK)
    s_value     = _s('VAL', fontName='Times-Roman', fontSize=9.5, textColor=BK_DARK)
    s_body      = _s('BOD', fontName='Times-Roman', fontSize=9.5, leading=15,
                      alignment=TA_JUSTIFY, textColor=BK_DARK, spaceAfter=4)
    s_footer    = _s('FTR', fontName='Times-Roman', fontSize=8, alignment=TA_CENTER, textColor=BK_LGRAY)

    story = []
    story.append(Paragraph("FATURA / RECIBO DE PRESTAÇÃO DE SERVIÇOS", s_doc_title))
    story.append(HRFlowable(width="100%", thickness=1.5, color=BK_BLACK, spaceAfter=4, spaceBefore=2))

    header_rows = [
        [Paragraph("PRESTADOR DE SERVIÇOS INDEPENDENTE", _s('PH', fontName='Times-Bold',
                    fontSize=9, alignment=TA_CENTER, textColor=BK_DARK)), ""],
        [Paragraph("Nome:", s_label),  Paragraph(provider.get("name",""), s_value)],
        [Paragraph("NIF:",  s_label),  Paragraph(provider.get("nif",""), s_value)],
        [Paragraph("Morada:", s_label),Paragraph(provider.get("address",""), s_value)],
    ]
    ht = Table(header_rows, colWidths=[3.5*cm, W - doc.leftMargin - doc.rightMargin - 3.5*cm])
    ht.setStyle(TableStyle([
        ('SPAN', (0,0), (-1,0)),
        ('BACKGROUND', (0,0), (-1,0), BK_LBKG),
        ('TOPPADDING', (0,0), (-1,-1), 4), ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6), ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('BOX', (0,0), (-1,-1), 0.8, BK_BORDER),
        ('LINEBELOW', (0,0), (-1,0), 0.5, BK_BORDER),
        ('LINEBELOW', (0,1), (-1,-2), 0.3, BK_BORDER),
    ]))
    story.append(ht)
    story.append(Spacer(1, 0.5*cm))

    story.append(HRFlowable(width="100%", thickness=0.5, color=BK_BORDER, spaceAfter=4))
    meta_rows = [
        [Paragraph("Data:", s_label), Paragraph(date_str, s_value),
         Paragraph("Ref.ª:", s_label), Paragraph(
             _hl.sha256(f"{client_name}{value}{date_str}".encode()).hexdigest()[:10].upper(), s_value)],
    ]
    mt = Table(meta_rows, colWidths=[2.5*cm, 5*cm, 2.5*cm, 5*cm])
    mt.setStyle(TableStyle([('TOPPADDING',(0,0),(-1,-1),3), ('BOTTOMPADDING',(0,0),(-1,-1),3)]))
    story.append(mt)
    story.append(HRFlowable(width="100%", thickness=0.5, color=BK_BORDER, spaceAfter=6))
    story.append(Spacer(1, 0.2*cm))

    story.append(Paragraph("DADOS DO CLIENTE / CONTRATANTE", s_section))
    cli_rows = [
        [Paragraph("Nome:", s_label),  Paragraph(client_name, s_value)],
        [Paragraph("Valor:", s_label), Paragraph(f"EUR {value} (Euros)", _s('VBK', fontName='Times-Bold',
                                                   fontSize=10, textColor=BK_BLACK))],
    ]
    ct = Table(cli_rows, colWidths=[3.5*cm, W - doc.leftMargin - doc.rightMargin - 3.5*cm])
    ct.setStyle(TableStyle([
        ('TOPPADDING',(0,0),(-1,-1),4), ('BOTTOMPADDING',(0,0),(-1,-1),4),
        ('LEFTPADDING',(0,0),(-1,-1),6), ('RIGHTPADDING',(0,0),(-1,-1),6),
        ('BOX',(0,0),(-1,-1),0.8,BK_BORDER), ('LINEBELOW',(0,0),(-1,-2),0.3,BK_BORDER),
    ]))
    story.append(ct)
    story.append(Spacer(1, 0.5*cm))

    story.append(Paragraph("DESCRIÇÃO DO SERVIÇO PRESTADO", s_section))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BK_BORDER, spaceAfter=4))
    story.append(Paragraph(_BANK_SERVICE_OBJECT, s_body))
    story.append(Spacer(1, 0.3*cm))

    story.append(Paragraph("CONDIÇÕES DE EXECUÇÃO E DIREITO DE ARREPENDIMENTO", s_section))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BK_BORDER, spaceAfter=4))
    story.append(Paragraph(_BANK_SECURITY_CLAUSE, s_body))
    story.append(Spacer(1, 0.3*cm))

    if notes and notes.strip():
        story.append(Paragraph("NOTAS ADICIONAIS", s_section))
        story.append(HRFlowable(width="100%", thickness=0.5, color=BK_BORDER, spaceAfter=4))
        story.append(Paragraph(notes, s_body))
        story.append(Spacer(1, 0.3*cm))

    story.append(Spacer(1, 0.4*cm))
    story.append(HRFlowable(width="100%", thickness=0.8, color=BK_BLACK, spaceAfter=6))
    story.append(Paragraph(
        f"Declaro ter recebido a quantia de <b>EUR {value}</b> referente aos serviços acima identificados.",
        _s('DEC', fontName='Times-Roman', fontSize=9.5, leading=14, alignment=TA_JUSTIFY, textColor=BK_DARK)
    ))
    story.append(Spacer(1, 1.2*cm))

    sig_name = provider.get("signature_name","") or provider.get("name","")
    sig_rows = [
        [Paragraph("ASSINATURA DO PRESTADOR", _s('SH', fontName='Times-Bold', fontSize=8,
                    alignment=TA_CENTER, textColor=BK_DARK)),
         Paragraph("ASSINATURA DO CLIENTE / CONTRATANTE", _s('SH2', fontName='Times-Bold', fontSize=8,
                    alignment=TA_CENTER, textColor=BK_DARK))],
        [Paragraph(f"\n\n\n_________________________\n{sig_name}\n{date_str}",
                   _s('SG', fontName='Times-Roman', fontSize=9, alignment=TA_CENTER, textColor=BK_DARK)),
         Paragraph(f"\n\n\n_________________________\n{client_name}",
                   _s('SG2', fontName='Times-Roman', fontSize=9, alignment=TA_CENTER, textColor=BK_DARK))],
    ]
    col_half = (W - doc.leftMargin - doc.rightMargin) / 2
    st = Table(sig_rows, colWidths=[col_half, col_half])
    st.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BK_LBKG),
        ('BOX', (0,0), (-1,-1), 0.8, BK_BORDER),
        ('LINEBEFORE', (1,0), (1,-1), 0.5, BK_BORDER),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,0), 5), ('BOTTOMPADDING', (0,0), (-1,0), 5),
        ('TOPPADDING', (0,1), (-1,1), 4), ('BOTTOMPADDING', (0,1), (-1,1), 6),
    ]))
    story.append(st)
    story.append(Spacer(1, 0.6*cm))

    story.append(HRFlowable(width="100%", thickness=0.5, color=BK_BORDER, spaceAfter=4))
    story.append(Paragraph(
        f"Documento emitido por prestador independente · NIF: {provider.get('nif','')} · {date_str}",
        s_footer))

    doc.build(story)
    return buf.getvalue()


# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.get("/api/admin/receipt-provider")
async def get_receipt_provider(admin = Depends(get_admin_user)):
    p = await db.receipt_provider.find_one({}, {"_id": 0})
    if not p:
        return {"name": "", "nif": "", "address": "", "signature_name": ""}
    return p


@router.put("/api/admin/receipt-provider")
async def update_receipt_provider(req: ReceiptProviderRequest, admin = Depends(get_admin_user)):
    await db.receipt_provider.update_one({}, {"$set": req.dict()}, upsert=True)
    return {"success": True}


@router.post("/api/admin/generate-receipt")
async def generate_receipt(req: ReceiptRequest, admin = Depends(get_admin_user)):
    provider = await db.receipt_provider.find_one({}, {"_id": 0}) or {
        "name": "Prestador de Serviços", "nif": "000 000 000", "address": "Portugal", "signature_name": ""}
    date_str = req.date or datetime.utcnow().strftime("%d/%m/%Y")
    try:
        pdf_bytes = _generate_receipt_pdf(provider, req.client_name, req.value, date_str, req.notes or "")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar PDF: {str(e)}")
    safe_name = req.client_name.replace(" ", "_").replace("/", "")[:30]
    return Response(content=pdf_bytes, media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="recibo_{safe_name}_{req.value}eur.pdf"'})


@router.post("/api/admin/generate-receipt-bank")
async def generate_receipt_bank(req: ReceiptRequest, admin = Depends(get_admin_user)):
    provider = await db.receipt_provider.find_one({}, {"_id": 0}) or {
        "name": "Prestador de Serviços", "nif": "000 000 000", "address": "Portugal", "signature_name": ""}
    date_str = req.date or datetime.utcnow().strftime("%d/%m/%Y")
    try:
        pdf_bytes = _generate_receipt_bank_pdf(provider, req.client_name, req.value, date_str, req.notes or "")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar PDF: {str(e)}")
    return Response(content=pdf_bytes, media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="prestacao_servicos.pdf"'})


@router.post("/api/admin/clean-image")
async def clean_image_exif(file: UploadFile = File(...), admin = Depends(get_admin_user)):
    allowed = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Formato não suportado. Use JPG, PNG ou WebP.")
    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Ficheiro demasiado grande. Máximo 20MB.")
    try:
        from PIL import Image as PILImg
        img = PILImg.open(_io.BytesIO(content))
        mode = img.mode
        if mode in ('RGBA', 'LA', 'PA'):
            clean = PILImg.new(mode, img.size)
            clean.putdata(list(img.getdata()))
            fmt, ext, mime = "PNG", "png", "image/png"
        else:
            rgb = img.convert("RGB")
            clean = PILImg.new("RGB", rgb.size)
            clean.putdata(list(rgb.getdata()))
            fmt, ext, mime = "JPEG", "jpg", "image/jpeg"
        buf = _io.BytesIO()
        if fmt == "JPEG":
            clean.save(buf, format="JPEG", quality=95, optimize=True)
        else:
            clean.save(buf, format="PNG", optimize=True)
        clean_bytes = buf.getvalue()
        import hashlib as _hh
        rand_name = _hh.md5(clean_bytes + str(datetime.utcnow().timestamp()).encode()).hexdigest()[:14]
        return Response(content=clean_bytes, media_type=mime,
            headers={"Content-Disposition": f'attachment; filename="doc_{rand_name}.{ext}"'})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar imagem: {str(e)}")
