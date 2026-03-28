# ── DOCUMENTATION ─────────────────────────────────────────────
# EuroVault Digital Solutions — API Reference
# ─────────────────────────────────────────────────────────────

## Authentication

All endpoints (except `/api/auth/*` and `/api/honeypot/report`) require:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Client Endpoints

### POST /api/auth/register
Register a new client account.
```json
{ "full_name": "Alex Grayson", "email": "alex@example.com",
  "password": "SecurePass123", "country": "Japan", "phone": "+81 3 0000 0000" }
```

### POST /api/auth/login
```json
{ "email": "alex@example.com", "password": "SecurePass123" }
```
Response: `{ "token": "eyJ...", "user": { "balance": 0, "profit": 0, ... } }`

### GET /api/me
Returns current user data including balance, profit, KYC status.

### POST /api/orders
Create a buy or sell trading order.
```json
{ "asset_label": "EUR/USD", "side": "comprar", "amount": 1000,
  "leverage": "1:10", "price": "1.0875" }
```
**Rules:** Sell orders are validated against open positions — cannot sell more than invested.

### GET /api/orders/position?asset_label=EUR/USD
Returns open position for a specific asset.

---

## Admin Endpoints

### GET /api/admin/users
Returns all leads with AI scores (0–100).

### GET /api/admin/users/{id}/score
```json
{ "score": 78, "label": "Warm Lead", "color": "#f97316" }
```

### PUT /api/admin/users/{id}/tags
```json
{ "tags": ["VIP", "High Priority"] }
```

### POST /api/admin/contracts/generate
```json
{ "template_id": "abc...", "preset_name": "Alex Grayson",
  "preset_email": "alex@example.com" }
```
Response: `{ "token": "unique_token", "success": true }`

### POST /api/admin/security/stress-test
Simulates 20 attack vectors. Returns:
```json
{ "attacks_simulated": 20, "summary": { "critical": 7, "high": 8, "medium": 4, "low": 1 } }
```

### GET /api/admin/honeypot-logs
Returns last 100 intrusion logs from MongoDB.

---

## Security Endpoints

### POST /api/honeypot/report
Frontend reports suspicious URLs (no auth required).
```json
{ "path": "/wp-admin", "method": "GET" }
```

### POST /api/contract/{token}/submit
Client submits signed contract.
```json
{ "nome_completo": "Alex Grayson", "email": "alex@example.com",
  "telefone": "+1 212 555 0123", "documento": "US-AG-88921",
  "valor_investimento": "30000", "data_contrato": "28/03/2026",
  "aceite_termos": true, "signature_name": "Alex Grayson" }
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400  | Bad request — see `detail` field |
| 401  | Unauthorized — invalid or expired JWT |
| 403  | Forbidden — insufficient permissions |
| 429  | Rate limited — too many requests |
