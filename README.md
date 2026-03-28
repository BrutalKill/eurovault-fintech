<div align="center">

# EuroVault — Next-Gen FinTech Infrastructure

**A production-grade fintech ecosystem built with AI orchestration and rapid prototyping.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)

---

*Engineered in Lviv, Ukraine 🇺🇦 · Running on 100% mobile hardware · Powered by AI Orchestration*

</div>

---

## The Story Behind EuroVault

EuroVault was engineered entirely in **Lviv, Ukraine**, running on 100% mobile hardware — no fixed office, no data center, no dependencies on physical infrastructure. Every line of code was written, tested, and deployed from a laptop and a mobile hotspot, demonstrating that **resilience and rapid prototyping are mindsets, not resources**.

The architecture leverages **AI orchestration** to automate lead scoring, detect security anomalies, and generate legally-certified documents — tasks that traditionally require entire teams. The result is a full-stack fintech ecosystem built solo, from scratch, under real-world constraints.

> *"The best proof of engineering skill is what you build when conditions are against you."*

This project was submitted as a technical portfolio demonstration for the global fintech and AI industries, targeting immediate relocation to **Japan** 🇯🇵.

---

## Core Features

### Real-Time Trading Engine
Full trading interface integrated via **TradingView API** for live financial charts, real-time price feeds, and financial news. The engine enforces position-aware logic — users cannot sell assets they haven't purchased, preventing invalid operations at the API level.

- Live Forex, Crypto, Stocks, Metals, and Commodities
- Position validation on every order (buy/sell) — enforced server-side
- Leverage simulation with realistic P&L calculation
- WebSocket balance updates pushed to the client in real time

---

### Security Layer — Active Honeypot
A custom-built **intrusion detection system** that monitors 15+ sensitive decoy routes (`/.env`, `/wp-admin`, `/phpmyadmin`, `/.git/config`, etc.) and logs every malicious access attempt with full context.

- **Risk classification:** Critical · High · Medium · Low
- **Automated mitigation:** `IP PERMANENTLY BANNED` · `IP RATE LIMITED` · `REQUEST BLOCKED` · `LOGGED`
- **Attack-type identification:** SQL Injection, LFI, Path Traversal, RCE, WordPress Brute Force, Git Repo Leak
- **Frontend 404 reporter:** suspicious URLs detected in React and silently reported to the backend
- **Stress-test engine:** simulates 20 real-world attack vectors with live sequential toast notifications per attack
- **Real-time dashboard** with pulsing red card when a new Critical event is detected

---

### AI Lead Scoring Engine
An 8-signal behavioral model that assigns each lead a **priority score from 0 to 100**, updated in real time. The algorithm runs server-side, queries historical data per lead, and is visible directly in the admin dashboard.

```
Score = deposit_made (30) + high_balance (20) + seen_24h (15)
      + kyc_verified (10) + active_orders (10) + follow_up (8)
      + vip_status (7)   + has_tags (6)
```

| Score | Classification |
|-------|---------------|
| 80–100 | 🔥 Hot Lead   |
| 60–79  | ⚡ Warm Lead  |
| 40–59  | 🌡 Lukewarm   |
| 0–39   | 🧊 Cold Lead  |

---

### Compliance Automation — SHA-256 Certified Contracts
End-to-end **legal document generation** with cryptographic certification. Every contract is tamper-proof by design.

- Dynamic contract templates with client data injection
- Professional PDF generation (company logo, watermark, digital signature)
- **SHA-256 hash** computed from: `token | name | email | amount | timestamp | signer_ip`
- Signer IP + UTC timestamp permanently recorded per document
- Unique public signing URL per client (`/contract/:token`)
- Admin panel downloads PDFs with full certification block embedded

---

### Multi-Level CRM
Three independent access layers, each with its own authentication and dashboard:

1. **Admin CRM** — full lead management, balance manipulation, agent creation, contract generation, analytics
2. **Agent CRM** — isolated view of assigned leads, comments, tags, status updates, drag-and-drop Kanban
3. **Client Portal** — premium dashboard, live trading, deposit/withdrawal, KYC upload, referral program

Key admin capabilities:
- **Kanban Pipeline** — drag leads across: New → Contacted → Interested → Deposited → VIP
- **Custom Tags** — color-coded labels (VIP, High Priority, Awaiting Docs, etc.)
- **Follow-up Calendar** — scheduled contact management with lead timeline
- **Bulk Actions** — change status, export CSV, delete multiple leads
- **AI Score column** — visible on every lead row in the dashboard

---

### Multilingual Support
Complete localisation for **English** and **Spanish**, with automatic browser language detection on first visit. Language persists across logout and server restarts.

- 500+ translation keys covering all UI surfaces
- Admin CRM, Agent CRM, Client Portal, Legal Pages — all fully translated
- Financial and legal terminology localised with domain precision (e.g. *Retiro*, *Tablero de Control*, *Gráficos en tiempo real*)
- Real flag images via flagcdn.com for intuitive language switching

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Tailwind CSS, Shadcn/UI, Recharts |
| **Backend** | FastAPI (Python 3.11), async Motor driver |
| **Database** | MongoDB Atlas |
| **Auth** | JWT (python-jose) + bcrypt |
| **PDF Generation** | ReportLab 4.4, Pillow |
| **Charts** | TradingView Widget API |
| **Real-time** | WebSocket + polling fallback |
| **Security** | Custom Honeypot Middleware + Rate Limiting |
| **Infra** | Docker Compose, Kubernetes-ready, stateless backend |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              REACT 18 FRONTEND                               │
│  Client Portal · Admin CRM · Agent CRM · Kanban · Security  │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS / REST / WebSocket
┌────────────────────▼────────────────────────────────────────┐
│              FASTAPI BACKEND (Python 3.11)                   │
│  ┌────────┬─────────┬────────┬──────────────────────────┐   │
│  │  auth  │  admin  │ agent  │  contracts · security    │   │
│  └────────┴─────────┴────────┴──────────────────────────┘   │
│  AI Scoring · Honeypot Middleware · Rate Limiting · JWT      │
└────────────────────┬────────────────────────────────────────┘
                     │ Motor (async)
┌────────────────────▼────────────────────────────────────────┐
│              MONGODB                                         │
│  users · agents · orders · contracts · honeypot_logs        │
└─────────────────────────────────────────────────────────────┘
```

---

## Repository Structure

```
eurovault-fintech/
├── frontend/          React 18 SPA (dashboard, trading, CRM)
├── backend/           FastAPI API (scoring, auth, contracts)
│   ├── server.py      Main app (~3700 lines)
│   ├── deps.py        Shared: DB, Auth, WebSocket manager
│   └── routers/       agent_router.py
├── security/
│   ├── honeypot_engine.py       Standalone 20-vector attack simulator
│   └── intrusion_log_schema.json
├── contracts/
│   ├── pdf_generator.py         ReportLab PDF with SHA-256
│   └── sha256_certifier.py      Integrity verification module
├── docs/
│   └── API.md                   Full endpoint reference
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Quick Start

### With Docker (Recommended)
```bash
git clone https://github.com/BrutalKill/eurovault-fintech.git
cd eurovault-fintech
cp .env.example .env        # Fill in your values
docker-compose up --build
```

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

### Default Access

| Role | URL | Credentials |
|------|-----|-------------|
| Admin | `/adm/login` | Set via `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `.env` |
| Agent | `/crm/login` | Created via Admin panel |
| Client | `/register` | Self-registration |

---

## Security & Environment

All credentials are loaded from `.env` — **no secrets are hardcoded**. The `.env` file is excluded from version control.

```bash
# .env.example — copy this and fill in your values
MONGO_URL=mongodb://localhost:27017
DB_NAME=eurovault
SECRET_KEY=your-secret-key-here
ADMIN_USERNAME=your-admin-user
ADMIN_PASSWORD=your-admin-password
REACT_APP_BACKEND_URL=http://localhost:8001
```

Generate a secure key:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Client registration |
| `POST` | `/api/auth/login` | Authentication → JWT |
| `POST` | `/api/orders` | Trading order (position-validated) |
| `GET`  | `/api/orders/position` | Open position for asset |
| `GET`  | `/api/admin/users` | All leads with AI scores |
| `GET`  | `/api/admin/users/{id}/score` | Individual AI score (0–100) |
| `POST` | `/api/admin/contracts/generate` | Generate signed contract link |
| `POST` | `/api/admin/security/stress-test` | Run 20-vector attack simulation |
| `GET`  | `/api/admin/honeypot-logs` | Real-time intrusion log |
| `POST` | `/api/honeypot/report` | Frontend reports suspicious URL |

Full reference: [`docs/API.md`](docs/API.md)

---

## About the Developer

Built solo in **Lviv, Ukraine 🇺🇦** on 100% mobile hardware.

No fixed office. No data center. A laptop, a hotspot, and a conviction that world-class engineering is a mindset — not a location.

EuroVault is the proof.

> *Ready for immediate relocation to Japan 🇯🇵 and the global fintech market.*

---

**EuroVault Digital Solutions**
IFSB Reg. No. JP-999888777 · International Financial Standards · 1-1 Chiyoda, Tokyo, 100-8111, Japan

---

<div align="center">

*EuroVault — built under pressure, designed for scale.*

</div>
