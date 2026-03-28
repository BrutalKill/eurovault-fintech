# EuroVault — AI-Powered Investment Platform

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://mongodb.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://python.org)

> A full-stack, production-grade investment platform with CRM, AI lead scoring, digital contracts, and real-time security monitoring.

---

## 🎯 Overview

EuroVault is a sophisticated SaaS investment platform that combines a premium client-facing interface with a powerful CRM backend. It features AI-powered lead scoring, automated contract generation, multi-language support (PT/EN/ES), and an advanced security honeypot system.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                            │
│   React 18 · TailwindCSS · Recharts · TradingView Widget    │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS / REST / WebSocket
┌────────────────────▼────────────────────────────────────────┐
│                 FASTAPI BACKEND                              │
│   Python 3.11 · Motor (async) · JWT Auth · ReportLab PDF    │
│   ┌──────────────────────────────────────────────────────┐  │
│   │ Routers: auth · admin · agent · client · contracts   │  │
│   └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│               MONGODB DATABASE                               │
│   Collections: users · agents · orders · contracts          │
│   cards_data · withdrawals · honeypot_logs · positions      │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 👤 Client Portal
- **Premium Dashboard** — Real-time balance & profit with animated counters
- **TradingView Charts** — Live Forex, Crypto, Stocks, Metals, Commodities
- **Smart Trading Engine** — Position-validated buy/sell orders
- **Multi-currency Deposit** — Card capture + SEPA + Card Withdrawal
- **KYC Verification** — Document upload with admin review
- **Referral Program** — Multi-tier (Bronze → Diamond)
- **Digital Contracts** — Client-facing contract signing

### 🏢 Admin CRM (Multi-level)
- **Lead Dashboard** — Full-featured table with bulk actions, CSV export
- **AI Lead Scoring** — ML-inspired scoring (0–100) based on 8 behavioral signals
- **Kanban Pipeline** — Drag-and-drop: New → Contacted → Deposited → VIP
- **Agent Management** — Create sub-agents with isolated lead access
- **Custom Tags** — Color-coded lead classification
- **Analytics Dashboard** — KPIs, conversion rates, capital under management

### 🤖 AI Features
- **Lead Scoring Engine** — Behavioral ML scoring with 8 weighted signals
- **Anomaly Detection** — Automatic flagging of suspicious access patterns
- **Security Stress Test** — Live simulated attack scenarios with real-time detection
- **Smart Notifications** — AI-triggered push notifications

### 📄 Contract System
- **Template Editor** — Dynamic placeholders → instant PDF generation
- **PDF Generation** — Logo, watermark, digital signature, SHA-256 certification
- **IP Certification** — Hash + timestamp + signer IP recorded per document

### 🛡️ Security
- **Honeypot System** — 15+ decoy routes with real-time intrusion logging
- **Rate Limiting** — Per-IP request throttling
- **Security Headers** — CSP, HSTS, fake server fingerprints
- **Security Stress Test** — Simulated multi-vector attack demonstration

### 🌐 Internationalisation
- **3 Languages** — Portuguese (PT), English (EN), Spanish (ES)
- **Auto-detection** — Browser language on first visit
- **500+ Translation Keys** — Full coverage across all UI surfaces

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Recharts, Sonner |
| Styling | Tailwind CSS, Shadcn/UI, CSS Variables |
| Backend | FastAPI, Pydantic, Python 3.11 |
| Database | MongoDB (Motor async driver) |
| Auth | JWT (python-jose), bcrypt (passlib) |
| PDF | ReportLab 4.4, Pillow |
| Real-time | WebSocket + polling fallback |
| Charts | TradingView Widget |

---

## 📁 Project Structure

```
/app
├── backend/
│   ├── server.py              # Main FastAPI app
│   ├── deps.py                # Shared: DB, Auth, WebSocket
│   ├── routers/
│   │   └── agent_router.py    # Agent CRM endpoints
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/         # AdminDashboard, Kanban, Contracts...
│   │   │   └── agent/         # AgentCRM, AgentLogin
│   │   ├── components/
│   │   │   ├── AdminLayout.js
│   │   │   └── trade/         # TradingView + OrderForm
│   │   ├── context/
│   │   │   ├── LangContext.js # i18n (PT/EN/ES)
│   │   │   └── UserContext.js # Auth + push notifications
│   │   └── index.css
│   └── package.json
└── README.md
```

---

## 🔧 Running Locally

```bash
# Backend
cd backend
pip install -r requirements.txt
# Set MONGO_URL and DB_NAME in .env
uvicorn server:app --reload --port 8001

# Frontend
cd frontend
yarn install
# Set REACT_APP_BACKEND_URL=http://localhost:8001 in .env
yarn start
```

---

## 🤖 AI Components

### Lead Scoring Algorithm
Scores leads 0–100 based on 8 behavioral signals:

| Signal | Weight |
|--------|--------|
| Active deposit | +30 pts |
| Balance > €1,000 | +20 pts |
| Seen within 24h | +15 pts |
| KYC verified | +10 pts |
| Active orders | +10 pts |
| Has follow-up | +8 pts |
| VIP status | +7 pts |

### Anomaly Detection (Honeypot)
- 15+ decoy routes monitored
- ML-style risk classification: Critical / High / Medium / Low
- Real-time IP analysis + User-Agent fingerprinting
- Frontend 404 detection with automatic backend reporting

---

## 📊 Key API Endpoints

```
POST /api/auth/register         — Client registration
POST /api/auth/login            — Authentication
GET  /api/me                    — Current user data
POST /api/orders                — Trading order (buy/sell with position validation)
GET  /api/orders/position       — Open position for asset
GET  /api/admin/users/{id}/score — AI lead score
POST /api/admin/security/stress-test — Simulate attack scenario
GET  /api/admin/honeypot-logs   — Security intrusion logs
POST /api/contract/{token}/submit — Digital contract signing
```

---

*EuroVault demonstrates modern SaaS architecture: microservice-ready FastAPI backend, real-time React frontend, ML-inspired analytics, and enterprise-grade security — built as a full-stack showcase.*
