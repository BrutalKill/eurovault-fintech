# EuroVault — 2-Minute Project Pitch (English)

---

## Opening (0:00 – 0:20)
"EuroVault is a full-stack, production-grade SaaS investment platform.
It combines a premium client-facing portal with a multi-level CRM backend,
featuring AI-powered lead scoring, automated contract generation,
real-time security monitoring, and complete internationalisation across
Portuguese, English, and Spanish."

---

## Architecture (0:20 – 0:40)
"The stack: React 18 on the frontend, FastAPI on the backend,
MongoDB as the database — all communicating over REST and WebSocket.

The architecture is clean and modular:
- Separate router files for admin, agent, client, and contracts
- Shared dependency injection for auth, database, and WebSocket management
- A stateless backend, ready to scale horizontally"

---

## Key Features Demo (0:40 – 1:20)

### Admin CRM
"In the admin panel, we have full lead management with:
- A Kanban pipeline — drag-and-drop leads through the sales funnel
- AI Lead Scoring — each lead gets a 0-to-100 score based on
  8 behavioral signals: deposits, activity, KYC status, orders
- Custom tags, follow-up calendar, bulk actions, and CSV export"

### Security
"The security system is real-time.
Clicking 'Run Security Stress Test' simulates 20 attack vectors —
SQL injections, path traversal, WordPress probes, database dumps —
all logged with IP addresses, User-Agents, and risk classifications.
The system uses middleware detection AND a frontend 404 reporter
that catches suspicious URLs at the browser level."

### Contracts & PDF
"The contract system generates professional PDFs
with company logo, watermark, SHA-256 certification, and the signer's IP.
Clients receive a unique link, sign digitally, and the document is
immediately available in the admin panel."

---

## AI Integration (1:20 – 1:40)
"The AI components:
- Lead scoring engine with 8 weighted behavioral signals
- Anomaly detection classifying intrusion attempts as Critical, High, Medium, or Low
- Smart push notifications that trigger on balance events
- Position-aware trading engine that prevents invalid sell orders

These aren't just UI features — the scoring algorithm runs server-side,
queries historical data per lead, and updates in real time."

---

## Internationalisation (1:40 – 1:50)
"The entire interface — client portal, admin CRM, agent CRM, legal pages —
supports Portuguese, English, and Spanish.
The system auto-detects the browser language on first visit,
persists the preference across sessions,
and covers over 500 translation keys, including financial and security terminology."

---

## Closing (1:50 – 2:00)
"EuroVault demonstrates what's possible with a modern, security-conscious,
AI-augmented SaaS architecture.
The codebase is clean, modular, and documented —
built to production standards and ready to scale."

---

*Total: ~2 minutes at normal speaking pace.*
*Tip: Keep the admin panel open on the Security tab during the pitch — the live logs create a strong visual impression.*
