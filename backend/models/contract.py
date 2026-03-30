"""
models/contract.py — Digital contract and template schemas.
"""
from pydantic import BaseModel
from typing import Optional


class CompanySettingsRequest(BaseModel):
    name: str = "EuroVault Investments"
    address: str = ""
    tax_number: str = ""
    email: str = ""
    phone: str = ""
    legal_text: str = ""
    logo_b64: Optional[str] = ""


class ContractTemplateRequest(BaseModel):
    name: str
    content: str
    description: Optional[str] = ""


class GenerateContractRequest(BaseModel):
    template_id: str
    lead_id: Optional[str] = None
    preset_name: Optional[str] = ""
    preset_email: Optional[str] = ""


class ContractSubmitRequest(BaseModel):
    nome_completo: str
    email: str
    telefone: str
    documento: str
    valor_investimento: str
    data_contrato: str
    morada: Optional[str] = ""
    aceite_termos: bool
    signature_name: Optional[str] = ""
    signature_image: Optional[str] = ""  # base64 canvas drawing
