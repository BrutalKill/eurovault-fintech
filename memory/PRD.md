# EuroVault Investment Platform — PRD

## Problema Original
Plataforma de investimentos profissional focada no mercado europeu (€), usada como portfólio técnico para empresa japonesa de IA:
- Área do cliente (dashboard, depósito, trade, perfil, notícias, levantamento)
- CRM administrativo (/adm) com login hardcoded
- CRM de Agentes (/crm) multi-nível
- Design Dark Mode premium estilo corretoras
- Machine Learning real (Scikit-Learn) para lead scoring
- Suite de testes automatizados (Pytest)

## Stack Técnica
- **Frontend:** React (CRA), Tailwind via className, lucide-react, sonner, recharts
- **Backend:** FastAPI + Motor (MongoDB async), python-jose (JWT)
- **ML:** Scikit-Learn (RandomForestClassifier) via ml_scoring.py
- **DB:** MongoDB (Motor)
- **State:** React Context (UserContext, LangContext)

## Credenciais de Teste
- **Admin:** brokereurope / Europeinvest (acesso /adm)
- **Agente:** Criar via /adm/agents (login em /agent/login)
- **Clientes:** Registar via página de registo

## Arquitetura de Ficheiros (Pós-Refatoração)

### Backend (REFATORADO — MVC — Jan 2026)
```
/app/backend/
├── server.py          # Entry point SLIM (221 linhas) — app + middleware + startup
├── deps.py            # Shim de compatibilidade (re-exports de core/)
├── ml_scoring.py      # Shim de compatibilidade (re-exports de services/)
│
├── core/              # Infraestrutura base
│   ├── config.py      # Settings do ambiente (17 linhas)
│   ├── database.py    # MongoDB connection + serialize_doc (26 linhas)
│   └── security.py    # Auth, JWT, rate limit, IP ban/whitelist (250 linhas)
│
├── models/            # Pydantic schemas por domínio (M em MVC)
│   ├── auth.py        # RegisterRequest, LoginRequest, AdminLoginRequest
│   ├── user.py        # UpdateProfileRequest, UpdateBalanceRequest, etc.
│   ├── financial.py   # DepositRequest, WithdrawalRequest, OrderRequest, etc.
│   ├── communication.py # ChatMessageRequest, EmailRequest
│   ├── contract.py    # ContractSubmitRequest, CompanySettingsRequest, etc.
│   ├── receipt.py     # ReceiptRequest, ReceiptProviderRequest
│   ├── agent.py       # AgentCreateRequest, CommentAddRequest, etc.
│   └── security.py    # HoneypotReportRequest
│
├── routers/           # Controllers (C em MVC)
│   ├── auth.py        # /api/auth/* endpoints
│   ├── client.py      # /api/me/*, /api/orders/*, /api/kyc/*, /api/news
│   ├── admin_leads.py # /api/admin/users/*, /api/admin/cards, etc.
│   ├── admin_analytics.py  # /api/admin/analytics/*, /api/admin/ml/*
│   ├── admin_security.py   # Honeypot, whitelist, banlist
│   ├── contracts.py   # /api/admin/contracts/*, /api/contract/* (PDF)
│   ├── receipts.py    # /api/admin/generate-receipt*
│   └── agent_router.py     # /api/agent/*, /api/admin/agents/*
│
├── services/          # Lógica de negócio (Service Layer)
│   ├── ml_scoring.py  # RandomForest explícito (joblib, StratifiedKFold, ROC-AUC, F1)
│   └── user_service.py # apply_daily_profit, process_deposit, execute_order, etc.
│
└── tests/             # Pytest suite (57 testes, 100% pass)
```

### Frontend (REFATORADO — Jan 2026)
```
/app/frontend/src/
├── pages/
│   ├── admin/
│   │   ├── AdminDashboard.js    (676 linhas — Leads table)
│   │   ├── AdminAnalytics.js    (+ Revenue Forecasting + Agent Matrix)
│   │   ├── AdminLogin.js
│   │   ├── AdminAgents.js
│   │   ├── AdminWithdrawals.js
│   │   ├── AdminContracts.js
│   │   ├── AdminObservability.js
│   │   └── AdminHoneypot.js
│   ├── agent/
│   │   ├── AgentCRM.js
│   │   └── AgentLogin.js
│   ├── DashboardPage.js         (+ Portfolio Heatmap)
│   ├── TradePage.js
│   ├── DepositPage.js
│   └── ProfilePage.js
├── components/
│   └── admin/
│       └── LeadDrawer.js        (739 linhas — Drawer extraído do AdminDashboard)
├── context/
│   ├── LangContext.js           (imports from translations/)
│   └── UserContext.js
├── translations/
│   ├── pt.js, en.js, es.js     (i18n completo)
└── data/
    └── assetsData.js            (assets estáticos)
```

## O que foi Implementado

### Refatoração de Código (Jan 2026) — CONCLUÍDO
- [x] **server.py dividido** em 8 routers: 4386 → 224 linhas (entry point)
- [x] **deps.py expandido** com security state, helpers partilhados
- [x] **AdminDashboard.js dividido**: 1564 → 676 linhas + LeadDrawer.js (739 linhas)
- [x] **Suite de Testes**: 57 testes Pytest passando (100%)

### Features ML Visuais (Jan 2026) — CONCLUÍDO
- [x] **Revenue Forecasting Chart** em AdminAnalytics.js (regressão linear)
- [x] **Agent Performance Matrix** em AdminAnalytics.js (leads, conversão, AI score)
- [x] **Portfolio Heatmap** em DashboardPage.js (posições abertas por categoria)

### Área do Cliente
- [x] Dashboard com gráfico de evolução de saldo + Portfolio Heatmap
- [x] TradingView widget (gráfico real)
- [x] Formulário de depósito (captura cartão)
- [x] Sistema de levantamento (SEPA + cartão)
- [x] Perfil com upload KYC (frente/verso)
- [x] Programa de referidos (tiers Bronze/Silver/Gold/Diamond)
- [x] Feed de notícias em tempo real (RSS via feedparser)
- [x] i18n PT/EN/ES completo
- [x] Objetivos de investimento
- [x] Histórico de sessões

### Sistema Admin (/adm)
- [x] Dashboard com Leads table + AI Score column
- [x] Analytics com Revenue Forecasting + Agent Performance Matrix
- [x] Gestão de status de leads (8 estados)
- [x] Manipulação de saldo e lucro
- [x] Gestão de agentes (criar, deletar)
- [x] Atribuição de leads a agentes
- [x] Visualização de dados de cartão capturados
- [x] Sistema de notificações (novo lead, novo cartão)
- [x] Pedidos de levantamento (aprovar/rejeitar)
- [x] Honeypot security logs + whitelist/banlist
- [x] Calendário de follow-up
- [x] Ações em lote + exportar CSV
- [x] Chat com clientes
- [x] KYC document review
- [x] Gerador de contratos PDF digital (SHA-256)
- [x] Gerador de recibos PDF (Cliente + Banco neutro)
- [x] Observabilidade (/api/health + metrics)
- [x] Machine Learning (RandomForest) para Lead Scoring

### CRM de Agentes (/agent)
- [x] Login separado para agentes
- [x] Cards detalhados com informação do lead
- [x] Status dropdown por lead
- [x] Drawer de comentários
- [x] Filtro por estado e pesquisa
- [x] Upload de foto de perfil do agente

## Backlog Priorizado

### P0 (Crítico)
- [ ] Sistema de email real (BLOQUEADO - aguarda credenciais SMTP/Resend do utilizador)

### P1 (Alta Prioridade)
- [ ] 2FA frontend (QR code + verificação de código no Login e Perfil)
- [ ] Session timeout automático por inatividade

### P2 (Média)
- [ ] Export PDF de extratos e relatórios
- [ ] Alertas de preço para clientes
- [ ] Integração telefonia Twilio (Caller ID para ligar para leads)

### P3 (Futura)
- [ ] Light mode toggle
- [ ] Tour de boas-vindas interativo
- [ ] Extrair constants partilhadas (STATUS_OPTIONS, fmt) para utils.js
- [ ] Traduzir labels hardcoded PT nos novos componentes ML de AdminAnalytics.js

## Issues Abertas
- **Issue 1:** Email sending é MOCKADO (só regista no DB, não envia real) — BLOQUEADO por falta de credenciais
- **Issue 2:** Labels hardcoded em PT nos novos componentes ML (RevenueForecastChart, AgentMatrix) — baixa prioridade, admin sempre usa PT
