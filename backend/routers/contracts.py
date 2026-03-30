"""
contracts.py — Contratos digitais, templates, assinaturas e geração de PDF.
"""
from fastapi import APIRouter, Depends, HTTPException, Request as FastAPIRequest
from fastapi.responses import Response
from datetime import datetime
from bson import ObjectId
import base64
import uuid

from core.database import db, serialize_doc
from core.security import get_admin_user, manager
from models.contract import (CompanySettingsRequest, ContractTemplateRequest,
                               GenerateContractRequest, ContractSubmitRequest)

router = APIRouter()

DEFAULT_CONTRACT_TEMPLATE = """CONTRATO DE INVESTIMENTO

Entre a empresa {{empresa_nome}}, com sede em {{empresa_morada}}, NIF {{empresa_nif}}, adiante designada por "Empresa",

e o(a) Sr.(a) {{nome_completo}}, portador(a) do documento {{documento}}, residente em {{morada}}, e-mail {{email}}, telefone {{telefone}}, adiante designado(a) por "Cliente",

é celebrado o presente Contrato de Investimento, nos termos e condições seguintes:

CLÁUSULA 1.ª — OBJETO DO CONTRATO
O presente contrato tem por objeto a prestação de serviços de investimento no montante de {{valor_investimento}} euros.

CLÁUSULA 2.ª — DURAÇÃO
O presente contrato entra em vigor na data da sua assinatura, {{data}}, e vigorará pelo prazo acordado entre as partes.

CLÁUSULA 3.ª — OBRIGAÇÕES DA EMPRESA
A Empresa compromete-se a gerir os fundos do Cliente de forma diligente, em conformidade com a legislação aplicável, e a fornecer relatórios periódicos sobre a evolução do investimento.

CLÁUSULA 4.ª — OBRIGAÇÕES DO CLIENTE
O Cliente compromete-se a fornecer informações verdadeiras e completas, e a cumprir com os requisitos de identificação exigidos pela lei.

CLÁUSULA 5.ª — RISCO
O Cliente reconhece que os investimentos envolvem riscos e que os resultados passados não garantem resultados futuros.

CLÁUSULA 6.ª — CONFIDENCIALIDADE
Ambas as partes comprometem-se a manter a confidencialidade de todas as informações trocadas no âmbito do presente contrato.

CLÁUSULA 7.ª — LEI APLICÁVEL
O presente contrato é regido pela International Financial Standards Board (IFSB).

Data: {{data}}

Assinatura do Cliente: {{assinatura_nome}}"""


# ── PDF Generator ─────────────────────────────────────────────────────────────
def generate_pdf_bytes(company: dict, contract_data: dict, processed_content: str,
                       signature_name: str, signature_image=None,
                       cert_info=None) -> bytes:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                    TableStyle, HRFlowable, KeepTogether)
    from reportlab.pdfgen import canvas as pdfcanvas
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
    from reportlab.lib.utils import ImageReader
    from io import BytesIO as BIO
    import base64 as b64
    from PIL import Image as PILImage

    NAVY    = colors.HexColor('#0A1628')
    NAVY2   = colors.HexColor('#1E3A5F')
    GOLD    = colors.HexColor('#C9A84C')
    GOLD2   = colors.HexColor('#E8C96A')
    WHITE   = colors.white
    TEXT    = colors.HexColor('#0d1b2a')
    MUTED   = colors.HexColor('#6B7280')
    LIGHT   = colors.HexColor('#F8F9FF')
    BORDER  = colors.HexColor('#E5E7EB')

    W, H = A4
    logo_b64_str = company.get("logo_b64", "")

    wm_reader = None
    logo_reader = None
    if logo_b64_str:
        try:
            raw = b64.b64decode(logo_b64_str.split(",")[-1])
            logo_reader = ImageReader(BIO(raw))
            pil_img = PILImage.open(BIO(raw)).convert("RGBA")
            pil_img = pil_img.resize((320, 320), PILImage.LANCZOS)
            r, g, b_ch, a = pil_img.split()
            gray = pil_img.convert("L")
            gray_rgba = PILImage.merge("RGBA", (gray, gray, gray, a.point(lambda x: int(x * 0.07))))
            wm_buf = BIO()
            gray_rgba.save(wm_buf, "PNG")
            wm_buf.seek(0)
            wm_reader = ImageReader(wm_buf)
        except Exception:
            pass

    def draw_background(canv, doc):
        canv.saveState()
        canv.setFillColor(WHITE)
        canv.rect(0, 0, W, H, fill=1, stroke=0)
        header_h = 2.8 * cm
        canv.setFillColor(NAVY)
        canv.rect(0, H - header_h, W, header_h, fill=1, stroke=0)
        canv.setFillColor(GOLD)
        canv.rect(0, H - header_h - 0.12*cm, W, 0.12*cm, fill=1, stroke=0)
        logo_x = 1.2*cm
        logo_y = H - header_h + 0.3*cm
        logo_size = 2.2*cm
        if logo_reader:
            try:
                canv.drawImage(logo_reader, logo_x, logo_y, width=logo_size, height=logo_size,
                               mask='auto', preserveAspectRatio=True)
            except Exception:
                pass
        name_x = logo_x + logo_size + 0.4*cm if logo_reader else 1.2*cm
        canv.setFillColor(WHITE)
        canv.setFont('Helvetica-Bold', 13)
        canv.drawString(name_x, H - 1.4*cm, company.get("name", "EuroVault Investments").upper())
        canv.setFont('Helvetica', 7.5)
        canv.setFillColor(GOLD2)
        address_line = " · ".join(filter(None, [
            company.get("address",""), company.get("tax_number",""), company.get("email","")
        ]))
        canv.drawString(name_x, H - 2.1*cm, address_line[:90])
        canv.setFont('Helvetica-Bold', 7)
        canv.setFillColor(GOLD)
        tag_w = 2.4*cm
        canv.roundRect(W - 1.2*cm - tag_w, H - 1.8*cm, tag_w, 0.6*cm, 0.1*cm, fill=1, stroke=0)
        canv.setFillColor(NAVY)
        canv.drawCentredString(W - 1.2*cm - tag_w/2, H - 1.48*cm, "CONFIDENCIAL")
        if wm_reader:
            try:
                wm_size = 9*cm
                canv.saveState()
                canv.translate(W/2, H/2 - 1*cm)
                canv.rotate(25)
                canv.drawImage(wm_reader, -wm_size/2, -wm_size/2, width=wm_size, height=wm_size, mask='auto')
                canv.restoreState()
            except Exception:
                pass
        else:
            canv.saveState()
            canv.translate(W/2, H/2)
            canv.rotate(30)
            canv.setFont('Helvetica-Bold', 48)
            canv.setFillColorRGB(0.05, 0.1, 0.18, alpha=0.05)
            try:
                canv.setFillAlpha(0.05)
            except Exception:
                pass
            canv.drawCentredString(0, 0, company.get("name","EUROVAULT").upper())
            canv.restoreState()
        footer_h = 1.0*cm
        canv.setFillColor(NAVY)
        canv.rect(0, 0, W, footer_h, fill=1, stroke=0)
        canv.setFillColor(GOLD)
        canv.rect(0, footer_h, W, 0.08*cm, fill=1, stroke=0)
        canv.setFont('Helvetica', 6.5)
        canv.setFillColor(GOLD2)
        ref = contract_data.get("token","")[:16].upper()
        canv.drawString(1.2*cm, 0.35*cm, f"REF: {ref}")
        canv.drawCentredString(W/2, 0.35*cm, f"Página {canv.getPageNumber()}")
        canv.drawRightString(W - 1.2*cm, 0.35*cm, "Documento Gerado Electronicamente")
        canv.setFillColor(GOLD)
        canv.rect(0, footer_h + 0.08*cm, 0.18*cm, H - header_h - footer_h - 0.2*cm, fill=1, stroke=0)
        canv.restoreState()

    styles = getSampleStyleSheet()
    def sty(name, **kw):
        return ParagraphStyle(name, parent=styles['Normal'], **kw)

    s_title    = sty('T', fontSize=18, fontName='Helvetica-Bold', alignment=TA_CENTER,
                     textColor=NAVY, spaceAfter=2, spaceBefore=4, letterSpacing=1.5)
    s_subtitle = sty('ST', fontSize=9, fontName='Helvetica', alignment=TA_CENTER,
                     textColor=MUTED, spaceAfter=4)
    s_ref      = sty('R', fontSize=8.5, fontName='Helvetica', alignment=TA_CENTER,
                     textColor=MUTED, spaceAfter=2)
    s_section_hdr = sty('SH', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER,
                         textColor=WHITE, spaceAfter=0)
    s_label    = sty('LB', fontSize=8, fontName='Helvetica-Bold', textColor=MUTED, spaceAfter=1)
    s_value    = sty('VL', fontSize=9, fontName='Helvetica', textColor=TEXT, spaceAfter=1)
    s_value_gold = sty('VG', fontSize=11, fontName='Helvetica-Bold', textColor=GOLD, spaceAfter=1)
    s_clause_hdr = sty('CH', fontSize=9.5, fontName='Helvetica-Bold', textColor=NAVY2,
                        spaceBefore=10, spaceAfter=3)
    s_body     = sty('BD', fontSize=9.2, fontName='Helvetica', leading=15,
                     alignment=TA_JUSTIFY, textColor=TEXT, spaceAfter=4)
    s_sign_name  = sty('SN', fontSize=13, fontName='Helvetica-BoldOblique',
                        alignment=TA_CENTER, textColor=NAVY)
    s_sign_label = sty('SL', fontSize=7.5, fontName='Helvetica', alignment=TA_CENTER, textColor=MUTED)
    s_legal    = sty('LE', fontSize=7, fontName='Helvetica', alignment=TA_CENTER, textColor=MUTED)

    doc = SimpleDocTemplate(buf := BIO(), pagesize=A4,
        leftMargin=1.0*cm, rightMargin=1.4*cm, topMargin=3.8*cm, bottomMargin=1.8*cm)

    story = []
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("CONTRATO DE INVESTIMENTO", s_title))
    story.append(Paragraph("INVESTMENT AGREEMENT", s_subtitle))
    story.append(HRFlowable(width="70%", thickness=1.5, color=GOLD, hAlign='CENTER', spaceAfter=4, spaceBefore=2))

    cd = contract_data
    date_str  = cd.get("data_contrato", datetime.utcnow().strftime('%d/%m/%Y'))
    ref_short = cd.get("token","")[:16].upper()
    story.append(Paragraph(f"Ref.:&nbsp;&nbsp;<b>{ref_short}</b>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;Data:&nbsp;&nbsp;<b>{date_str}</b>", s_ref))
    story.append(Spacer(1, 0.5*cm))

    def cell(label, value, gold=False):
        return [Paragraph(label, s_label), Paragraph(str(value), s_value_gold if gold else s_value)]

    client_rows = [
        cell("NOME COMPLETO", cd.get("nome_completo","")),
        cell("E-MAIL", cd.get("email","")),
        cell("TELEFONE", cd.get("telefone","")),
        cell("DOCUMENTO", cd.get("documento","")),
        cell("MORADA", cd.get("morada","—")),
        cell("VALOR DO INVESTIMENTO", f"€ {cd.get('valor_investimento','')}", gold=True),
    ]
    company_rows = [
        cell("EMPRESA", company.get("name","")),
        cell("MORADA", company.get("address","")),
        cell("NIF", company.get("tax_number","")),
        cell("E-MAIL", company.get("email","")),
        cell("TELEFONE", company.get("phone","")),
        cell("DATA DO CONTRATO", date_str),
    ]

    def make_info_table(rows, bg):
        t = Table(rows, colWidths=[3.0*cm, 7.5*cm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg),
            ('TOPPADDING',(0,0),(-1,-1), 5), ('BOTTOMPADDING',(0,0),(-1,-1), 5),
            ('LEFTPADDING',(0,0),(-1,-1), 8), ('RIGHTPADDING',(0,0),(-1,-1), 6),
            ('LINEBELOW',(0,0),(-1,-2), 0.3, BORDER),
        ]))
        return t

    col_gap = 0.4*cm
    client_col_w = (W - doc.leftMargin - doc.rightMargin - col_gap) / 2
    header_row = [Paragraph("DADOS DO CLIENTE", s_section_hdr), Paragraph("DADOS DA EMPRESA", s_section_hdr)]
    outer = Table(
        [header_row, [make_info_table(client_rows, LIGHT), make_info_table(company_rows, WHITE)]],
        colWidths=[client_col_w, client_col_w], hAlign='LEFT',
    )
    outer.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY), ('LINEBELOW', (0,0), (-1,0), 1.5, GOLD),
        ('BOX', (0,0), (-1,-1), 0.8, GOLD), ('LINEBEFORE', (1,0), (1,-1), 0.5, GOLD),
        ('TOPPADDING',(0,0),(-1,0), 8), ('BOTTOMPADDING',(0,0),(-1,0), 8),
        ('TOPPADDING',(0,1),(-1,1), 0), ('BOTTOMPADDING',(0,1),(-1,1), 0),
        ('LEFTPADDING',(0,0),(-1,0), 0), ('RIGHTPADDING',(0,0),(-1,0), 0),
        ('LEFTPADDING',(0,1),(-1,1), 0), ('RIGHTPADDING',(0,1),(-1,1), 0),
    ]))
    story.append(outer)
    story.append(Spacer(1, 0.7*cm))
    story.append(HRFlowable(width="100%", thickness=0.8, color=GOLD, spaceAfter=8, spaceBefore=0))

    for line in processed_content.split('\n'):
        stripped = line.strip()
        if not stripped:
            story.append(Spacer(1, 0.15*cm))
        elif stripped.isupper() and 4 < len(stripped) < 80 and not stripped.startswith('http'):
            story.append(Paragraph(stripped, s_clause_hdr))
        else:
            safe = stripped.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
            story.append(Paragraph(safe, s_body))

    story.append(Spacer(1, 0.6*cm))
    story.append(HRFlowable(width="100%", thickness=0.8, color=GOLD, spaceAfter=6))
    story.append(Spacer(1, 0.4*cm))

    client_sig_content = []
    if signature_image and signature_image.startswith("data:image"):
        try:
            from reportlab.platypus import Image as RLImage
            raw = b64.b64decode(signature_image.split(",")[-1])
            sig_img = RLImage(BIO(raw), width=4.5*cm, height=1.6*cm)
            sig_img.hAlign = 'CENTER'
            client_sig_content = [sig_img, Spacer(1, 0.1*cm), Paragraph(signature_name or "", s_sign_label)]
        except Exception:
            pass
    if not client_sig_content:
        client_sig_content = [
            Spacer(1, 0.3*cm),
            Paragraph(f"<i>{signature_name or 'Assinado digitalmente'}</i>", s_sign_name),
            Spacer(1, 0.1*cm),
            HRFlowable(width="80%", thickness=0.5, color=NAVY2, hAlign='CENTER'),
        ]

    company_sig_content = [
        Spacer(1, 0.3*cm),
        Paragraph("_________________________", sty('BL', fontSize=14, fontName='Helvetica',
                   alignment=TA_CENTER, textColor=MUTED)),
        Paragraph(company.get("name",""), s_sign_label),
        Paragraph("Representante Autorizado", sty('RA', fontSize=7, fontName='Helvetica',
                   alignment=TA_CENTER, textColor=MUTED)),
    ]

    sig_table = Table(
        [[Paragraph("ASSINATURA DO CLIENTE", s_section_hdr), Paragraph("ASSINATURA DA EMPRESA", s_section_hdr)],
         [client_sig_content, company_sig_content]],
        colWidths=[client_col_w, client_col_w], hAlign='LEFT',
    )
    sig_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY2), ('LINEBELOW', (0,0), (-1,0), 1.5, GOLD),
        ('BOX', (0,0), (-1,-1), 0.8, GOLD), ('LINEBEFORE', (1,0), (1,-1), 0.5, GOLD),
        ('BACKGROUND', (0,1), (0,1), LIGHT), ('BACKGROUND', (1,1), (1,1), WHITE),
        ('ALIGN',(0,0),(-1,-1),'CENTER'), ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('TOPPADDING',(0,0),(-1,0), 7), ('BOTTOMPADDING',(0,0),(-1,0), 7),
        ('TOPPADDING',(0,1),(-1,1), 10), ('BOTTOMPADDING',(0,1),(-1,1), 14),
        ('LEFTPADDING',(0,0),(-1,0), 0), ('RIGHTPADDING',(0,0),(-1,0), 0),
    ]))
    story.append(sig_table)
    story.append(Spacer(1, 0.5*cm))

    legal = company.get("legal_text","") or \
        "Documento gerado electronicamente. Este contrato tem plena validade legal."
    story.append(Paragraph(legal, s_legal))

    if cert_info:
        story.append(Spacer(1, 0.4*cm))
        cert_hash = cert_info.get("cert_hash","")
        cert_ts   = cert_info.get("cert_timestamp","")
        cert_ip   = cert_info.get("signer_ip","")
        cert_rows = [
            [Paragraph("CERTIFICAÇÃO DIGITAL", sty('CertH', fontSize=8, fontName='Helvetica-Bold',
                alignment=TA_CENTER, textColor=WHITE)), ""],
            [Paragraph("Timestamp:", sty('CK', fontSize=7.5, fontName='Helvetica-Bold', textColor=NAVY2)),
             Paragraph(cert_ts, sty('CV', fontSize=7.5, fontName='Helvetica', textColor=TEXT))],
            [Paragraph("IP do Signatário:", sty('CK', fontSize=7.5, fontName='Helvetica-Bold', textColor=NAVY2)),
             Paragraph(cert_ip, sty('CV', fontSize=7.5, fontName='Helvetica', textColor=TEXT))],
            [Paragraph("Hash SHA-256:", sty('CK', fontSize=7.5, fontName='Helvetica-Bold', textColor=NAVY2)),
             Paragraph(cert_hash[:32] + "...", sty('CVm', fontSize=6.5, fontName='Helvetica', textColor=NAVY2))],
        ]
        cert_table = Table(cert_rows, colWidths=[3.5*cm, client_col_w*2 - 3.5*cm])
        cert_table.setStyle(TableStyle([
            ('SPAN', (0,0), (-1,0)),
            ('BACKGROUND', (0,0), (-1,0), NAVY2),
            ('TOPPADDING', (0,0), (-1,0), 6), ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#F0F4FF')),
            ('TOPPADDING', (0,1), (-1,-1), 4), ('BOTTOMPADDING', (0,1), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 8), ('RIGHTPADDING', (0,0), (-1,-1), 8),
            ('BOX', (0,0), (-1,-1), 0.8, GOLD),
            ('LINEBELOW', (0,0), (-1,0), 1, GOLD),
            ('LINEBELOW', (0,1), (-1,-2), 0.3, BORDER),
        ]))
        story.append(cert_table)

    doc.build(story, onFirstPage=draw_background, onLaterPages=draw_background)
    return buf.getvalue()


# ── Company Settings ──────────────────────────────────────────────────────────
@router.get("/api/admin/company-settings")
async def get_company_settings(admin = Depends(get_admin_user)):
    s = await db.company_settings.find_one({}, {"_id": 0})
    if not s:
        return {"name":"EuroVault Digital Solutions","address":"1-1 Chiyoda, Tokyo, 100-8111, Japan",
                "tax_number":"JP-999888777","email":"suporte@eurovault.eu","phone":"+81 3 0000 0000",
                "legal_text":"EuroVault Digital Solutions · IFSB Reg. No. JP-999888777 · Document generated electronically.",
                "logo_b64":""}
    return s


@router.put("/api/admin/company-settings")
async def update_company_settings(req: CompanySettingsRequest, admin = Depends(get_admin_user)):
    await db.company_settings.update_one({}, {"$set": req.dict()}, upsert=True)
    return {"success": True}


# ── Contract Templates ────────────────────────────────────────────────────────
@router.get("/api/admin/contract-templates")
async def list_contract_templates(admin = Depends(get_admin_user)):
    templates = []
    async for t in db.contract_templates.find({}).sort("created_at", -1):
        templates.append(serialize_doc({"id": t["_id"], "name": t.get("name"),
            "description": t.get("description",""), "content": t.get("content",""),
            "created_at": t.get("created_at")}))
    return templates


@router.post("/api/admin/contract-templates")
async def create_contract_template(req: ContractTemplateRequest, admin = Depends(get_admin_user)):
    result = await db.contract_templates.insert_one({
        "name": req.name, "description": req.description,
        "content": req.content, "created_at": datetime.utcnow(),
    })
    return {"success": True, "id": str(result.inserted_id)}


@router.put("/api/admin/contract-templates/{template_id}")
async def update_contract_template(template_id: str, req: ContractTemplateRequest, admin = Depends(get_admin_user)):
    await db.contract_templates.update_one({"_id": ObjectId(template_id)},
        {"$set": {"name": req.name, "description": req.description,
                  "content": req.content, "updated_at": datetime.utcnow()}})
    return {"success": True}


@router.delete("/api/admin/contract-templates/{template_id}")
async def delete_contract_template(template_id: str, admin = Depends(get_admin_user)):
    await db.contract_templates.delete_one({"_id": ObjectId(template_id)})
    return {"success": True}


# ── Contracts ─────────────────────────────────────────────────────────────────
@router.get("/api/admin/contracts")
async def list_contracts(admin = Depends(get_admin_user)):
    contracts = []
    async for c in db.contracts.find({}).sort("created_at", -1):
        cd = c.get("client_data", {})
        contracts.append(serialize_doc({
            "id": c["_id"], "token": c.get("token"), "status": c.get("status","pending"),
            "client_name": cd.get("nome_completo","") or c.get("preset_name",""),
            "client_email": cd.get("email","") or c.get("preset_email",""),
            "valor": cd.get("valor_investimento",""),
            "template_name": c.get("template_name",""), "has_pdf": bool(c.get("pdf_b64")),
            "signer_ip": c.get("signer_ip",""), "cert_hash": c.get("cert_hash",""),
            "cert_timestamp": c.get("cert_timestamp",""),
            "created_at": c.get("created_at"), "submitted_at": c.get("submitted_at"),
        }))
    return contracts


@router.post("/api/admin/contracts/generate")
async def generate_contract_link(req: GenerateContractRequest, admin = Depends(get_admin_user)):
    template = await db.contract_templates.find_one({"_id": ObjectId(req.template_id)})
    if not template:
        raise HTTPException(status_code=404, detail="Template não encontrado")
    token = uuid.uuid4().hex[:20]
    preset_name  = req.preset_name or ""
    preset_email = req.preset_email or ""
    if req.lead_id:
        try:
            lead = await db.users.find_one({"_id": ObjectId(req.lead_id)})
            if lead:
                preset_name  = preset_name  or lead.get("full_name","")
                preset_email = preset_email or lead.get("email","")
        except Exception:
            pass
    result = await db.contracts.insert_one({
        "token": token, "template_id": str(template["_id"]),
        "template_name": template.get("name",""), "template_content": template.get("content",""),
        "status": "pending", "preset_name": preset_name, "preset_email": preset_email,
        "lead_id": req.lead_id, "client_data": {}, "created_at": datetime.utcnow(),
    })
    return {"success": True, "id": str(result.inserted_id), "token": token}


@router.delete("/api/admin/contracts/{contract_id}")
async def delete_contract(contract_id: str, admin = Depends(get_admin_user)):
    await db.contracts.delete_one({"_id": ObjectId(contract_id)})
    return {"success": True}


@router.get("/api/admin/contracts/{contract_id}/pdf")
async def download_contract_pdf(contract_id: str, admin = Depends(get_admin_user)):
    contract = await db.contracts.find_one({"_id": ObjectId(contract_id)})
    if not contract or not contract.get("pdf_b64"):
        raise HTTPException(status_code=404, detail="PDF não disponível ainda")
    pdf_bytes = base64.b64decode(contract["pdf_b64"])
    name = (contract.get("client_data",{}).get("nome_completo","") or
            contract.get("preset_name","contrato")).replace(" ","_")
    return Response(content=pdf_bytes, media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="contrato_{name}.pdf"'})


# ── Public Contract ────────────────────────────────────────────────────────────
@router.get("/api/contract/{token}")
async def get_public_contract(token: str):
    c = await db.contracts.find_one({"token": token})
    if not c:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    company = await db.company_settings.find_one({}, {"_id":0}) or {"name":"EuroVault Investments"}
    return {
        "token": token, "status": c.get("status","pending"),
        "template_name": c.get("template_name",""),
        "template_content": c.get("template_content",""),
        "preset_name": c.get("preset_name",""),
        "preset_email": c.get("preset_email",""),
        "company_name": company.get("name","EuroVault Investments"),
    }


@router.post("/api/contract/{token}/submit")
async def submit_public_contract(token: str, req: ContractSubmitRequest, request: FastAPIRequest = None):
    import hashlib as _hashlib
    c = await db.contracts.find_one({"token": token})
    if not c:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    if c.get("status") == "signed":
        raise HTTPException(status_code=400, detail="Este contrato já foi assinado")
    if not req.aceite_termos:
        raise HTTPException(status_code=400, detail="É necessário aceitar os termos")
    signer_ip = "unknown"
    signer_ua = ""
    if request:
        forwarded = request.headers.get("X-Forwarded-For","")
        signer_ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
        signer_ua = request.headers.get("User-Agent","")
    cert_timestamp = datetime.utcnow()
    cert_data = f"{token}|{req.nome_completo}|{req.email}|{req.valor_investimento}|{cert_timestamp.isoformat()}|{signer_ip}"
    cert_hash = _hashlib.sha256(cert_data.encode("utf-8")).hexdigest()
    company = await db.company_settings.find_one({}, {"_id":0}) or {"name":"EuroVault Investments"}
    content = c.get("template_content","")
    replacements = {
        "{{nome_completo}}": req.nome_completo, "{{email}}": req.email,
        "{{telefone}}": req.telefone, "{{documento}}": req.documento,
        "{{valor_investimento}}": req.valor_investimento, "{{data}}": req.data_contrato,
        "{{morada}}": req.morada or "", "{{assinatura_nome}}": req.signature_name or req.nome_completo,
        "{{empresa_nome}}": company.get("name",""), "{{empresa_morada}}": company.get("address",""),
        "{{empresa_nif}}": company.get("tax_number",""),
    }
    for k, v in replacements.items():
        content = content.replace(k, v)
    client_data = req.dict()
    cert_info = {
        "signer_ip": signer_ip, "cert_hash": cert_hash,
        "cert_timestamp": cert_timestamp.strftime("%d/%m/%Y %H:%M:%S UTC"),
    }
    try:
        pdf_bytes = generate_pdf_bytes(
            company, {**client_data, "token": token, "data_contrato": req.data_contrato},
            content, req.signature_name or req.nome_completo, req.signature_image, cert_info=cert_info)
        pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")
    except Exception:
        pdf_b64 = ""
    await db.contracts.update_one({"token": token}, {"$set": {
        "status": "signed", "client_data": client_data,
        "processed_content": content, "pdf_b64": pdf_b64,
        "submitted_at": cert_timestamp, "signer_ip": signer_ip, "signer_ua": signer_ua,
        "cert_hash": cert_hash, "cert_timestamp": cert_timestamp.isoformat(),
    }})
    try:
        await manager.broadcast({"type": "contract_signed",
            "client_name": req.nome_completo, "valor": req.valor_investimento,
            "timestamp": cert_timestamp.isoformat()})
    except Exception:
        pass
    return {"success": True}
