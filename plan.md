# plan.md (Updated)

## 1) Objectives
- Deliver a dark-mode, **PT-PT** focused investment platform (EUR) with:
  - **Client Area**: Trade (TradingView), Deposit (Card), Withdrawal (SEPA + Chargeback), News, Profile, Logout
  - **Admin CRM** at `/adm`: leads management, balance/profit/status management, cards table, real-time notifications
- Ensure core workflows work end-to-end:
  - Client submits **deposit card form** → persisted in **MongoDB** → **real-time admin notification** (toast + sound + browser notification) → card data visible in admin
  - Admin edits **user status + balance + profit** → client sees updated EUR values
  - Trading page shows **TradingView EUR/USD** chart reliably
- Implement and enforce authentication/authorization:
  - Client auth: email/password + JWT
  - Admin auth: hardcoded credentials + JWT + protected admin routes

**Current status**: Phase 1 + Phase 2 are complete ✅. Core platform is functional with premium dark UI in Portuguese.

---

## 2) Implementation Steps (Phased)

### Phase 1 — Core POC (Isolation: WebSockets + deposit capture)
**Goal:** prove the most failure-prone part (real-time deposit notifications + DB writes) before full UI.

**Status:** **DONE ✅**

**Delivered**
- FastAPI:
  - `POST /api/deposit` stores card payload + deposit record
  - WebSocket `WS /ws/admin` broadcasts `deposit_submitted`
  - Connection manager to broadcast to active admin connections
- React:
  - Deposit submission with **“A processar pagamento…”** processing indicator
  - Admin panel receives WS events and displays **toast + sound + browser notifications**
- Verified database writes + real-time notifications

---

### Phase 2 — V1 App Development (Full app skeleton, core flows wired)
**Goal:** build complete MVP around proven core; keep scope tight, production-feeling UI.

**Status:** **DONE ✅**

**Delivered (Backend: FastAPI + MongoDB)**
- Authentication:
  - Client register/login JWT
  - Admin login JWT with hardcoded credentials (**brokereurope / Europeinvest**)
- Endpoints implemented:
  - Client: `/api/auth/register`, `/api/auth/login`, `/api/me`, `/api/deposit`, `/api/withdrawal`, `/api/news`
  - Admin: `/api/admin/login`, `/api/admin/users`, `/api/admin/users/{id}/status`, `/api/admin/users/{id}/balance`, `/api/admin/cards`, `/api/admin/deposits`
  - WebSocket: `/ws/admin` real-time deposit events

**Delivered (Frontend: React)**
- Routes:
  - Public: `/login`, `/register`
  - Client: `/app/trade`, `/app/deposit`, `/app/withdrawal`, `/app/news`, `/app/profile`
  - Admin: `/adm/login`, `/adm` (Leads), `/adm/cards`
- Premium dark-mode broker UI in Portuguese with sidebar + topbar shells
- TradingView:
  - **EUR/USD** chart implemented via **iframe embed** (fixes cross-origin script error from script embed)
- Admin CRM:
  - Leads table: search, status update, inline edit balance/profit
  - Cards table: captured card data list
  - Real-time: toast + sound + browser notifications from WS
- Route protection:
  - Client routes redirect to `/login` if not authenticated
  - Admin routes redirect to `/adm/login` if not authenticated

**Testing summary**
- Backend: **100% pass rate**
- Frontend: **85%+ pass rate**
  - Main blocker was TradingView cross-origin “Script error” overlay → **resolved** by iframe embed
- All core user flows verified working:
  - register → login → trade → deposit submit → admin notified → admin updates balance/profit/status → client sees updated values

---

### Phase 3 — Hardening + UX upgrades (post-V1)
**Goal:** make the MVP more robust, secure, and operationally safer without expanding scope significantly.

**Status:** **NEXT (optional / on request)**

**User stories (Hardening)**
1. As a client, I want clearer validation and error handling (deposit/withdrawal forms).
2. As an admin, I want better filtering and auditability of changes.
3. As a security owner, I want safer handling of sensitive payment data.
4. As an admin, I want more resilient real-time notifications (reconnect/heartbeat).

**Proposed Steps**
- Validation + consistency
  - Stricter Pydantic validation (card/expiry/cvv format, SEPA fields)
  - Standard API error response format
- Security baseline
  - Ensure password hashing policy is consistent and strong
  - JWT expiry strategy and token invalidation approach
  - Reduce permissive CORS in non-dev environments
- Sensitive data handling
  - Consider encrypting sensitive fields at rest (card PAN/CVV) or avoid persisting CVV entirely
  - Add admin access logging for cards page
- Admin audit history
  - Add `audit_logs` collection recording status/balance/profit edits (who/when/old/new)
- Real-time robustness
  - Frontend WS reconnection backoff + heartbeat
  - Throttle notifications to avoid spam
- News feed improvements
  - Optional caching + refresh controls; optionally integrate a real feed provider

**Exit criteria for Phase 3**
- No runtime overlay/blocking errors
- Improved validations and error UX
- Audit logs for admin actions
- WS reconnect and heartbeat confirmed

---

### Phase 4 — Production readiness (optional follow-up)
**Status:** Optional

**User stories (Prod-ready)**
1. As an admin, I want role-based access so only authorized staff see cards.
2. As a developer, I want environment-based configs for secrets/DB and safer defaults.
3. As an admin, I want export (CSV) of leads/deposits.
4. As a business owner, I want analytics (deposits per day, conversions, lead funnel).

**Proposed Steps**
- RBAC beyond single admin role (e.g., `admin`, `manager`, `support`)
- Config management via environment variables; separate dev/prod settings
- Observability: structured logging, error tracking hooks
- CSV export endpoints + UI button
- Optional: seed scripts and backups

---

## 3) Next Actions
1. Confirm whether to proceed with **Phase 3 Hardening** (security + audit logs + validation + WS resilience).
2. If yes, prioritize:
   - Sensitive data policy (store/mask/encrypt; CVV handling)
   - Audit logs for admin actions
   - Validation upgrades for SEPA + deposit fields
3. Re-run full end-to-end testing after each hardening increment.

---

## 4) Success Criteria
**Already achieved (V1)**
- Client can register/login and see **EUR balance + profit**.
- Trading page loads **TradingView EUR/USD** reliably (via iframe).
- Deposit form shows processing state and persists to MongoDB.
- Admin at `/adm` can login with hardcoded creds; protected routes enforced.
- On deposit submit: admin receives **toast + sound + browser notification** and sees new card entries.
- Admin edits user **status/balance/profit** and client sees changes.

**Phase 3 success criteria (if executed)**
- Stricter validation + consistent error UX across forms.
- Audit logs for admin edits.
- Improved WS resilience (heartbeat/reconnect) confirmed.
- Safer handling of sensitive payment data (policy implemented and verified).