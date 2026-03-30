# 🏦 EuroVault: High-Speed FinTech Ecosystem
> **AI-Native Architecture | Built in 7 Nights via Mobile (Poco X6 Pro)**

[![Watch the Showcase](https://img.shields.io/badge/Watch-Technical_Video-red?style=for-the-badge&logo=youtube)](https://youtu.be/GwqMHd57Quo?si=ECP6pGWHjjQvklcq)
[![GitHub License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://github.com/BrutalKill/eurovault-fintech/blob/main/LICENSE)
[![API Docs](https://img.shields.io/badge/API-Swagger_UI-85EA2D?style=for-the-badge&logo=swagger)](https://vault-invest.preview.emergentagent.com/api/docs)
[![ReDoc](https://img.shields.io/badge/API-ReDoc-orange?style=for-the-badge&logo=readme)](https://vault-invest.preview.emergentagent.com/api/redoc)

## 📽️ Project Showcase (Video)
**Watch the system in action, including the Security Hub and Dashboard:**
👉 [Click here to watch the Technical Walkthrough](https://youtu.be/GwqMHd57Quo?si=ECP6pGWHjjQvklcq)

---

## 🚀 The Challenge: Speed & Resilience
This project is a **Proof of Concept (PoC)** showing how **AI Orchestration** can overcome hardware and situational constraints. 
- **Timeframe:** 7 Nights.
- **Hardware:** 100% developed on a **Mobile Device** (Poco X6 Pro).
- **Context:** Built in Lviv, Ukraine, amidst power outages and resource limitations.

---

## 🛡️ Key Modules & Cybersecurity
The EuroVault isn't just a UI; it's a secure financial infrastructure.

### 1. Active Security Hub (Honeypot)
We implemented a proactive defense system. Any unauthorized attempt to access sensitive routes triggers a **Honeypot trap**.
> **[GIF PLACEHOLDER: INSERT YOUR ATTACK SIMULATION GIF HERE]**
> *Visual evidence of the system detecting and logging a simulated SQL Injection / Directory Traversal attack.*

### 2. Operational Dashboard & Trading Logs
- Real-time balance updates.
- High-frequency trading log architecture.
- Secure API integration via **FastAPI**.

### 3. Compliance & Smart Contracts
- **SHA-256** verification for transaction integrity.
- Automated compliance logs for auditing.

---

## 💻 Tech Stack (AI-Accelerated)
- **Frontend:** React 18 (Functional Components & Hooks).
- **Backend:** FastAPI (Python) for high-performance async processing.
- **Security:** Custom Python Middleware for attack detection.
- **DevOps:** Docker-compose for rapid environment deployment.

---


## 📖 API Documentation (Swagger / OpenAPI 3.1)

The REST API is fully documented with **Swagger UI** and **ReDoc**:

| Interface | URL | Description |
|-----------|-----|-------------|
| **Swagger UI** | `/api/docs` | Interactive — test endpoints directly in browser |
| **ReDoc** | `/api/redoc` | Clean reference — great for sharing with clients |
| **OpenAPI JSON** | `/api/openapi.json` | Machine-readable schema (import to Postman / Insomnia) |

**123 endpoints** across 8 tag groups: `Authentication` · `Client` · `Admin · Leads` · `Admin · Analytics & ML` · `Admin · Security` · `Admin · Contracts` · `Admin · Receipts` · `Agent CRM`

---


## 🏗️ System Architecture

```mermaid
graph TD
    A[User / Attacker] -->|HTTP Request| B[Security Middleware]
    B -->|Check Patterns| C{Honeypot Trap?}
    C -->|Yes| D[Log & Block IP]
    C -->|No| E[FastAPI Controller]
    E -->|Analyze Behavior| F[ML Service - Random Forest]
    F -->|Return Score| G[Real-time Dashboard]
    D -->|Persist Ban & Log| H[(MongoDB Atlas)]
    E -->|Read / Write Data| H

    style A fill:#1a1a1a,stroke:#3A86FF,stroke-width:2px
    style B fill:#0d1a2a,stroke:#3A86FF,stroke-width:2px
    style C fill:#1a1500,stroke:#FFBE0B,stroke-width:2px
    style D fill:#1a0a0a,stroke:#ef4444,stroke-width:2px
    style G fill:#0a1a0d,stroke:#22c58b,stroke-width:2px
    style H fill:#1a1500,stroke:#FFBE0B,stroke-width:2px
```

> **Live request flow:** Every HTTP request passes through the Security Middleware before reaching any controller. Suspicious paths (`.env`, `wp-admin`, `.git/config`, etc.) are trapped, logged to MongoDB, and the attacker's IP is permanently banned.

---

## 🧠 Machine Learning — Lead Scoring Engine

The platform includes a **real Scikit-Learn model** (not mocked) that predicts lead conversion probability:

```
train_model.py  →  services/lead_scorer.joblib  →  services/ml_scoring.py  →  Admin CRM
```

| Component | Detail |
|-----------|--------|
| Algorithm | `RandomForestClassifier` (200 trees, depth 8) |
| Serialization | `joblib.dump` (sklearn-recommended, not pickle) |
| Validation | `StratifiedKFold` (5-fold) cross-validation |
| Metrics | ROC-AUC, F1, Precision, Recall, Confusion Matrix |
| Features | 10 engineered features: balance, recency, KYC status, CRM tags… |
| Fallback | Rule-based heuristic when model is unavailable |

**Train the model locally:**
```bash
cd backend
python train_model.py           # standard training
python train_model.py --verbose # show full classification report
python train_model.py --dry-run # validate data only
```

---

## 🛡️ Security Architecture

```
Request → Middleware (ban check) → Honeypot detection → Controller
                ↓
         Log to MongoDB ← IP banned permanently
```

Monitored patterns: `.env`, `wp-admin`, `phpmyadmin`, `.git/config`, `passwd`, `xmlrpc`, `shell.php`, `eval-stdin`

---

## 🧠 The AI-Native Methodology
I don't focus on manual syntax. I focus on **System Integrity and Logic**. 
As an **AI-Native Architect**, I use Artificial Intelligence to:
1. Design scalable database schemas.
2. Generate secure, production-ready code.
3. Bridge language barriers (Basic English) with 100% technical accuracy.

---

## 🇯🇵 Seeking Opportunities in Japan
I am ready for **immediate relocation** and require visa sponsorship. I bring a mindset of extreme efficiency and resilience.

**Contact me:**
- **LinkedIn:** [Igor Eduardo Alonso Rodrigues](https://www.linkedin.com/in/igor-eduardo-alonso-rodrigues-8700a73bb)
- **WhatsApp:** +55 21 97383-33921
- **GitHub:** [BrutalKill](https://github.com/BrutalKill)

---
*Created with resilience in Lviv, Ukraine.*
