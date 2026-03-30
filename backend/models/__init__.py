"""
models/__init__.py — Pydantic schema package.
Exports all request/response models grouped by domain.
"""
from models.auth         import RegisterRequest, LoginRequest, AdminLoginRequest
from models.user         import (UpdateProfileRequest, UpdateBalanceRequest,
                                  UpdateStatusRequest, UpdateDailyRateRequest,
                                  UpdateTagsRequest, AdminPasswordChangeRequest,
                                  LeadNotesRequest, NoteAddRequest,
                                  WithdrawalLimitRequest, FollowUpRequest)
from models.financial    import (DepositRequest, WithdrawalRequest, OrderRequest,
                                  WithdrawalReviewRequest, InvestmentGoalRequest,
                                  FavoritesRequest)
from models.communication import ChatMessageRequest, EmailRequest, GenericEmailRequest
from models.contract     import (CompanySettingsRequest, ContractTemplateRequest,
                                  GenerateContractRequest, ContractSubmitRequest)
from models.receipt      import ReceiptRequest, ReceiptProviderRequest
from models.agent        import (AgentCreateRequest, AgentLoginRequest,
                                  CommentAddRequest, LeadAssignRequest)
from models.security     import HoneypotReportRequest

__all__ = [
    "RegisterRequest", "LoginRequest", "AdminLoginRequest",
    "UpdateProfileRequest", "UpdateBalanceRequest", "UpdateStatusRequest",
    "UpdateDailyRateRequest", "UpdateTagsRequest", "AdminPasswordChangeRequest",
    "LeadNotesRequest", "NoteAddRequest", "WithdrawalLimitRequest", "FollowUpRequest",
    "DepositRequest", "WithdrawalRequest", "OrderRequest", "WithdrawalReviewRequest",
    "InvestmentGoalRequest", "FavoritesRequest",
    "ChatMessageRequest", "EmailRequest", "GenericEmailRequest",
    "CompanySettingsRequest", "ContractTemplateRequest",
    "GenerateContractRequest", "ContractSubmitRequest",
    "ReceiptRequest", "ReceiptProviderRequest",
    "AgentCreateRequest", "AgentLoginRequest", "CommentAddRequest", "LeadAssignRequest",
    "HoneypotReportRequest",
]
