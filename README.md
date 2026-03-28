# 🏦 EuroVault — AI-Driven Fintech Infrastructure

<div align="center">

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**High-performance fintech ecosystem for global investors, built with AI orchestration and enterprise-grade security.**

[Live Demo](https://vault-invest.preview.emergentagent.com) · [API Docs](#api-reference) · [Security Report](#security)

</div>

---

## 🚀 Key Features

| Feature | Description |
|---------|-------------|
| **AI Lead Scoring** | Real-time 0–100 prioritization engine based on 8 behavioral signals |
| **Proactive Defense** | Integrated honeypot + stress-test simulation (20+ attack vectors) |
| **Legal Automation** | SHA-256 certified digital contracts with IP timestamping |
| **Multi-language CRM** | Full PT/EN/ES internationalisation across 500+ UI keys |
| **Position-Aware Trading** | Validates open positions before allowing sell orders |
| **Multi-level Access** | Admin CRM → Agent CRM → Client Portal (3 independent auth layers) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              CLIENT BROWSER (React 18)                       │
│   Dashboard · Trade · CRM · Kanban · Contracts · Security    │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS / REST / WebSocket
┌────────────────────▼────────────────────────────────────────┐
│         FASTAPI BACKEND (Python 3.11)                        │
│  ┌──────────┬──────────┬──────────┬──────────────────────┐  │
│  │   auth   │  admin   │  agent   │  contracts/security  │  │
│  └──────────┴──────────┴──────────┴──────────────────────┘  │
│  AI Scoring · Honeypot Middleware · Rate Limiting · JWT      │
└────────────────────┬────────────────────────────────────────┘
                     │ Motor (async)
┌────────────────────▼────────────────────────────────────────┐
│              MONGODB DATABASE                                │
│  users · agents · orders · contracts · honeypot_logs        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18** with React Router v6
- **Tailwind CSS** + Shadcn/UI components
- **Recharts** for analytics visualisation
- **TradingView Widget** for live market data
- **Sonner** for real-time toast notifications

### Backend
- **FastAPI** (Python 3.11) — async, high-performance
- **Motor** — async MongoDB driver
- **JWT** authentication (python-jose + bcrypt)
- **ReportLab 4.4** + **Pillow** — PDF generation with watermarks
- **Custom Honeypot Middleware** — intrusion detection

### Security
- **20+ decoy routes** (wp-admin, .env, phpmyadmin, etc.)
- **Frontend 404 reporter** — catches browser-level suspicious URLs
- **Stress-test engine** — simulates SQL injection, LFI, RCE, brute-force
- **SHA-256 contract certification** with signer IP + timestamp
- **Rate limiting** per IP with configurable thresholds

### Infrastructure
- **Docker Compose** — one command to run everything
- **Kubernetes-ready** — stateless backend, scales horizontally
- **Environment-based config** — no hardcoded secrets

---

## 📁 Project Structure

```
/
├── frontend/               # React 18 SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/      # AdminDashboard, Kanban, Honeypot, Analytics
│   │   │   ├── agent/      # AgentCRM, AgentLogin
│   │   │   └── client/     # Trade, Deposit, Profile, Referral
│   │   ├── components/
│   │   │   ├── trade/      # TradingView + Position-aware OrderForm
│   │   │   └── ui/         # Shadcn/UI components
│   │   ├── context/
│   │   │   ├── LangContext.js   # i18n PT/EN/ES (500+ keys)
│   │   │   └── UserContext.js   # Auth + push notifications
│   │   └── data/
│   │       └── assetsData.js   # Forex/Crypto/Stocks/Metals data
│   └── package.json
│
├── backend/                # FastAPI API
│   ├── server.py           # Main app (3700+ lines)
│   ├── deps.py             # Shared: DB, Auth, WebSocket
│   ├── routers/
│   │   └── agent_router.py
│   └── requirements.txt
│
├── security/               # Honeypot & Security Scripts
│   ├── honeypot_engine.py  # Standalone honeypot module
│   ├── stress_test.py      # 20-vector attack simulator
│   └── intrusion_log_schema.json
│
├── contracts/              # Contract Generation
│   ├── pdf_generator.py    # ReportLab PDF with SHA-256
│   ├── templates/
│   │   └── investment_agreement.txt
│   └── sha256_certifier.py
│
├── docs/
│   ├── API.md              # Full API reference
│   ├── SECURITY.md         # Security architecture
│   └── DEPLOYMENT.md       # Docker & Kubernetes guide
│
├── docker-compose.yml      # One-command deployment
├── .env.example            # Environment variables template
└── README.md
```

---

## 🤖 AI Lead Scoring Engine

Scores each lead from **0 to 100** based on 8 behavioral signals:

```python
async def compute_lead_score(user: dict) -> int:
    score = 0
    if user.get("balance", 0) > 0:      score += 30  # Made a deposit
    if user.get("balance", 0) > 5000:   score += 20  # High balance
    if user.get("status") == "VIP":     score += 15  # VIP status
    if seen_within_24h(user):           score += 15  # Recently active
    if user.get("kyc_status") == "approved": score += 10  # KYC verified
    score += min(order_count * 2, 8)              # Active trading
    score += min(len(user.get("tags", [])) * 2, 6) # Tagged leads
    if user.get("followup_date"):       score += 6   # Follow-up scheduled
    return min(score, 100)
```

**Classifications:** 🔥 Hot (80+) · ⚡ Warm (60-79) · 🌡 Lukewarm (40-59) · 🧊 Cold (<40)

---

## 🛡️ Security Architecture

### Honeypot System
```python
# 15+ decoy routes monitored in real-time
HONEYPOT_PATHS = [
    "/.env", "/wp-admin", "/phpmyadmin", "/backup.sql",
    "/.git/config", "/etc/passwd", "/shell.php", "/xmlrpc.php"
    # ... + automatic 404 detection via React frontend
]

# Risk classification
RISK_LEVELS = {
    "critical": ["IP PERMANENTLY BANNED"],  # .env, .git, passwd
    "high":     ["IP RATE LIMITED"],        # wp-admin, backup.sql
    "medium":   ["REQUEST BLOCKED"],        # config, xmlrpc
    "low":      ["LOGGED"],                 # server-status
}
```

### SHA-256 Contract Certification
```python
def certify_contract(token, name, email, amount, ip, timestamp):
    data = f"{token}|{name}|{email}|{amount}|{timestamp}|{ip}"
    return hashlib.sha256(data.encode("utf-8")).hexdigest()
```

---

## 📊 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Client registration |
| `POST` | `/api/auth/login` | Authentication → JWT |
| `POST` | `/api/orders` | Trading order (position-validated) |
| `GET`  | `/api/orders/position` | Open position for asset |
| `GET`  | `/api/admin/users` | All leads with AI scores |
| `GET`  | `/api/admin/users/{id}/score` | Individual AI score |
| `POST` | `/api/admin/contracts/generate` | Generate contract link |
| `POST` | `/api/admin/security/stress-test` | Run attack simulation |
| `GET`  | `/api/admin/honeypot-logs` | Real-time intrusion logs |
| `POST` | `/api/honeypot/report` | Frontend reports suspicious URL |
| `POST` | `/api/contract/{token}/submit` | Client signs contract |

---

## 🚀 Quick Start

### With Docker (Recommended)
```bash
git clone https://github.com/your-username/eurovault.git
cd eurovault
cp .env.example .env          # Edit with your values
docker-compose up --build
```

Access:
- **Client Portal:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/adm (user: `brokereurope` / pw: `Europeinvest`)
- **Agent CRM:** http://localhost:3000/crm

### Without Docker
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001

# Frontend
cd frontend
yarn install && yarn start
```

---

## 🌏 Company Information

**EuroVault Digital Solutions**
IFSB Reg. No. JP-999888777 · International Financial Standards
Headquarters: 1-1 Chiyoda, Tokyo, 100-8111, Japan

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

*EuroVault demonstrates production-grade SaaS architecture: AI-augmented analytics, enterprise security, legal automation, and real-time multi-language CRM — built for the global fintech market.*
