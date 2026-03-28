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

This project was submitted as a technical portfolio demonstration for the global fintech and AI industries.

---

## Core Features

### Real-Time Trading Engine
Full trading interface integrated via **TradingView API** for live financial charts, real-time price feeds, and market news. The engine enforces position-aware logic — users cannot sell assets they haven't purchased, preventing invalid operations at the API level.

- Live Forex, Crypto, Stocks, Metals, and Commodities
- Position validation on every order (buy/sell)
- Leverage simulation with realistic P&L calculation
- WebSocket balance updates in real time

---

### Security Layer — Active Honeypot
A custom-built **intrusion detection system** that monitors 15+ sensitive decoy routes (such as `/.env`, `/wp-admin`, `/phpmyadmin`) and logs every malicious access attempt in real time.

- **Risk classification:** Critical / High / Medium / Low
- **Automated mitigation:** IP PERMANENTLY BANNED · IP RATE LIMITED · REQUEST BLOCKED
- **Frontend 404 reporter:** suspicious URLs detected in React and automatically reported to the backend
- **Stress-test engine:** simulates 20 real-world attack vectors (SQL Injection, LFI, Path Traversal, Brute Force, RCE) with live toast notifications per attack
- **Real-time dashboard** with pulsing alert on new Critical events

---

### Compliance Automation — SHA-256 Certified Contracts
End-to-end **legal document generation** with cryptographic certification. Every contract signed through the platform is tamper-proof.

- Dynamic contract templates with client data injection
- Professional PDF generation (company logo, watermark, signature)
- **SHA-256 hash** computed from: `token | name | email | amount | timestamp | signer IP`
- Signer IP + UTC timestamp permanently recorded per document
- Unique public signing URL sent to each client (`/contract/:token`)
- Admin panel downloads PDFs with full certification block

---

### Multilingual Support
Complete localisation for **English** and **Spanish**, with auto-detection of the browser language on first visit. The entire platform — client portal, admin CRM, agent CRM, legal pages — is fully translated.

- 500+ translation keys covering all UI surfaces
- Language persists across logout and server restarts
- Financial and legal terminology localised with domain precision
- Real flags via flagcdn.com for intuitive language switching

---

### AI Lead Scoring Engine
An 8-signal behavioral scoring model that assigns each lead a **priority score from 0 to 100** in real time.

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

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Tailwind CSS, Shadcn/UI |
| **Backend** | FastAPI (Python 3.11), async Motor driver |
| **Database** | MongoDB Atlas |
| **Auth** | JWT (python-jose) + bcrypt |
| **PDF** | ReportLab 4.4, Pillow |
| **Charts** | TradingView Widget API |
| **Real-time** | WebSocket + polling fallback |
| **Security** | Custom Honeypot Middleware + Rate Limiting |
| **Infra** | Docker Compose, Kubernetes-ready |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              REACT 18 FRONTEND                               │
│  Client Portal · Admin CRM · Agent CRM · Kanban · Security  │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS / REST / WebSocket
┌────────────────────▼────────────────────────────────────────┐
│              FASTAPI BACKEND                                 │
│  ┌────────┬─────────┬────────┬──────────────────────────┐   │
│  │  auth  │  admin  │ agent  │  contracts · security    │   │
│  └────────┴─────────┴────────┴──────────────────────────┘   │
│  AI Scoring · Honeypot · Rate Limiting · SHA-256 Cert        │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              MONGODB                                         │
│  users · agents · orders · contracts · honeypot_logs        │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Docker (Recommended)
```bash
git clone https://github.com/BrutalKill/eurovault-fintech.git
cd eurovault-fintech
cp .env.example .env        # Edit with your values
docker-compose up --build
```

### Manual
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
| Admin | `/adm/login` | Set in `.env` |
| Agent | `/crm/login` | Created via Admin panel |
| Client | `/register` | Self-registration |

---

## Repository Structure

```
eurovault-fintech/
├── frontend/          React 18 SPA (dashboard, trading, CRM)
├── backend/           FastAPI API (scoring, auth, contracts)
├── security/          Honeypot engine + stress-test scripts
├── contracts/         PDF generator + SHA-256 certifier
├── docs/              API reference, security notes
├── docker-compose.yml One-command deployment
├── .env.example       Environment variables template
└── README.md
```

---

## Security

All environment variables are loaded from `.env` — **no credentials are hardcoded**. The `.env` file is excluded from version control via `.gitignore`.

```bash
# Generate a secure SECRET_KEY:
python3 -c "import secrets; print(secrets.token_hex(32))"
```

See [`docs/API.md`](docs/API.md) for full endpoint documentation.

---

## About

**EuroVault Digital Solutions**
IFSB Reg. No. JP-999888777 · International Financial Standards
Headquarters: 1-1 Chiyoda, Tokyo, 100-8111, Japan

Built by a solo developer in Lviv, Ukraine 🇺🇦 — proving that geography is not a limitation for world-class engineering.

---

<div align="center">

*EuroVault is a technical portfolio project demonstrating full-stack AI-augmented fintech architecture.*

</div>
