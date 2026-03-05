# plan.md

## 1) Objectives
- Deliver a dark-mode, PT-PT focused investment platform (EUR) with **Client Area** (Trade/Deposit/Withdrawal/News/Profile) and **Admin CRM** at `/adm`.
- Core workflows must work end-to-end:
  - Client submits **deposit card form** → persisted in MongoDB → **real-time admin notification** (toast + sound + browser notification) → card data visible in admin.
  - Admin edits **user status + balance + profit** → client sees updated EUR values.
  - Trading page shows **TradingView EUR/USD** chart.
- Implement **admin auth**: hardcoded credentials + JWT session + protected admin routes.

## 2) Implementation Steps (Phased)

### Phase 1 — Core POC (Isolation: WebSockets + deposit capture)
Goal: prove the most failure-prone part (real-time deposit notifications + DB writes) before full UI.

**User stories (POC)**
1. As an admin, I want to receive an instant notification when any client submits the deposit form.
2. As an admin, I want a sound alert + toast so I never miss a deposit lead.
3. As an admin, I want browser notifications (when permitted) even if the tab isn’t focused.
4. As a developer, I want deposit payloads reliably saved to MongoDB with timestamps.
5. As an admin, I want to see the latest captured card entry appear without refreshing.

**Steps**
- Websearch best practices for FastAPI WebSockets + connection manager; confirm CORS + proxy considerations.
- Backend (FastAPI):
  - Create minimal models/collections: `users`, `cards_data`, `deposits`.
  - Endpoint `POST /api/deposit` to store card data + create deposit record.
  - WebSocket `WS /ws/admin` broadcasting `deposit_submitted` events.
  - Simple in-memory connection manager; ensure reconnect handling.
- Frontend (React):
  - Minimal page: deposit form submits to backend and shows “A processar depósito...” while pending.
  - Minimal admin page: connect to WS, show toast + play sound + request Notification permission.
- Validate with a manual run:
  - Submit deposit as client → confirm MongoDB writes + admin receives event.
- Fix until stable (no dropped events on refresh/reconnect).

### Phase 2 — V1 App Development (Full app skeleton, core flows wired)
Goal: build complete MVP around proven core; keep scope tight, production-feeling UI.

**User stories (V1)**
1. As a client, I want to register with email/password and then access my dashboard.
2. As a client, I want to view my balance and profit in EUR as set by the admin.
3. As a client, I want to trade-view EUR/USD on a professional chart screen.
4. As a client, I want to submit a deposit form and clearly see processing feedback.
5. As an admin, I want a leads table with quick status buttons to triage users fast.

**Steps**
- Backend (FastAPI + MongoDB):
  - Auth: client register/login (JWT) + protected client endpoints.
  - Admin auth: `POST /api/admin/login` validates hardcoded creds and returns admin JWT.
  - RBAC guard: middleware/dependency for `admin` vs `client` roles.
  - CRUD endpoints:
    - Users: list (admin), get self (client), update balance/profit/status (admin).
    - Deposits/cards: list (admin), create deposit (client).
  - WebSockets: keep `/ws/admin` and broadcast on deposit creation.
- Frontend (React + Tailwind):
  - App shell: dark premium layout, sidebar/topbar, EUR formatting.
  - Routes:
    - Client: `/register`, `/login`, `/app/trade`, `/app/deposit`, `/app/withdrawal`, `/app/news`, `/app/profile`.
    - Admin: `/adm/login`, `/adm` dashboard, `/adm/cards`.
  - Trading page: embed TradingView widget (default EUR/USD).
  - News page: lightweight real-time financial feed (MVP: RSS/market headlines endpoint + periodic refresh).
  - Admin:
    - Protected routes (block direct access without admin JWT).
    - Leads dashboard table with status quick actions.
    - Inline edit balance/profit with save + optimistic UI.
    - Cards table (restricted) + live updates (prepend new rows on WS events).
  - Notifications: toast + sound + browser Notification (with permission UX).
- Conclude phase with 1 end-to-end test pass:
  - register → login → view trade → submit deposit → admin notified → admin updates balance/profit → client sees updates.

### Phase 3 — Hardening + UX upgrades (post-V1)
Goal: make the MVP robust and safer, without expanding scope too much.

**User stories (Hardening)**
1. As a client, I want clear error messages if deposit submission fails.
2. As an admin, I want filters/search on leads so I can find users quickly.
3. As an admin, I want audit history of balance/profit/status changes.
4. As a client, I want withdrawal forms that validate IBAN/SEPA fields.
5. As an admin, I want WS reconnection so notifications resume automatically.

**Steps**
- Validation + schemas: stricter Pydantic validation, consistent API error format.
- Security basics: password hashing (bcrypt/argon2), JWT expiry/refresh strategy, CORS tightening.
- Add audit log collection for admin edits.
- Improve News feed reliability (backend caching, rate limiting).
- WS robustness: heartbeat/ping, reconnect backoff on frontend.
- Conclude with another full test pass (client + admin flows + reloads).

### Phase 4 — Production readiness (optional follow-up)
**User stories (Prod-ready)**
1. As an admin, I want role-based access so only authorized staff see cards.
2. As a developer, I want environment-based configs for secrets and DB.
3. As a user, I want localization polish (PT-PT copy) across all pages.
4. As an admin, I want export (CSV) of leads and deposits.
5. As a client, I want a clearer portfolio-style dashboard summary.

**Steps**
- Modularize code, add logging/monitoring hooks, CI checks, seed scripts.
- Optional: encrypt sensitive card fields at rest (if required) and tighten access patterns.

## 3) Next Actions
1. Execute Phase 1 POC (WS + deposit → DB + notification) and confirm stability.
2. Build Phase 2 V1 in one connected pass (backend routes + frontend routes + styling).
3. Run end-to-end test pass; fix blockers before moving to Phase 3.

## 4) Success Criteria
- Client can register/login and see **EUR balance + profit**.
- Trading page loads **TradingView EUR/USD** reliably.
- Deposit form shows “Processing deposit…” state and successfully persists to MongoDB.
- Admin at `/adm` can login with hardcoded creds, cannot access protected routes without JWT.
- On deposit submit: admin receives **toast + sound + browser notification** and sees new card entry without refresh.
- Admin edits user **status/balance/profit** and client sees changes immediately after refresh (or via refetch).