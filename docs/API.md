# API Design — Intelgency Digital Invoicing

## Conventions

- Base path: `/api`
- Auth: `Authorization: Bearer <JWT>` header, except `/api/auth/login`
- Success envelope:
```json
{ "success": true, "data": { }, "message": "optional" }
```
- Error envelope:
```json
{ "success": false, "message": "human readable", "code": "MACHINE_CODE" }
```
- Standard codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`, `FBR_SUBMISSION_ERROR`
- Pagination (list endpoints): query params `?page=1&limit=20&search=&sort=`, response `data: { items: [...], total, page, limit }`
- All list/detail endpoints are implicitly scoped to `req.user.companyId` server-side.

## Auth
```
POST   /api/auth/login              { email, password } → { token, user }
POST   /api/auth/logout
GET    /api/auth/me                 → current user + role + company summary
```

## Users (ADMIN only)
```
GET    /api/users
POST   /api/users
GET    /api/users/:id
PATCH  /api/users/:id               (role, isActive, name)
DELETE /api/users/:id               (soft: isActive=false)
```

## Company (ADMIN only for writes; all authenticated roles can GET)
```
GET    /api/company
PATCH  /api/company
GET    /api/company/fbr-settings
PATCH  /api/company/fbr-settings    (ADMIN only, credentials write-only — never echoed back)
```

## Products
```
GET    /api/products                ?search=&isActive=&page=&limit=
POST   /api/products                (ADMIN, ACCOUNTANT: view only per RBAC.md — create/edit restricted to ADMIN unless spec says otherwise)
GET    /api/products/:id
PATCH  /api/products/:id
DELETE /api/products/:id            (soft delete → isActive=false)
```

## Customers
```
GET    /api/customers               ?search=&isActive=&page=&limit=
POST   /api/customers
GET    /api/customers/:id
PATCH  /api/customers/:id
DELETE /api/customers/:id           (soft delete)
```

## Invoices
```
GET    /api/invoices                ?status=&fbrStatus=&customerId=&from=&to=&page=&limit=
POST   /api/invoices                → creates DRAFT, backend computes all totals
GET    /api/invoices/:id
PATCH  /api/invoices/:id            (only allowed while status=DRAFT)
POST   /api/invoices/:id/submit-fbr → transitions READY_FOR_SUBMISSION → SUBMITTING → SUBMITTED|FAILED
GET    /api/invoices/:id/fbr-status
GET    /api/invoices/:id/pdf        → generates printable PDF
```
Invoice totals are always recalculated server-side from `items` on create/update; any `subtotal/tax/total` sent by the client is ignored.

## Reports
```
GET    /api/reports/sales           ?range=today|week|month|custom&from=&to=
GET    /api/reports/invoices        ?from=&to=&status=&fbrStatus=
GET    /api/reports/tax             ?from=&to=
```

## FBR
```
GET    /api/fbr/submissions         ?invoiceId=&status=&page=&limit=
GET    /api/fbr/submissions/:id
GET    /api/fbr/logs                (ADMIN) integration/audit logs, no secrets
```

## Audit Logs (ADMIN only)
```
GET    /api/audit-logs              ?userId=&action=&from=&to=&page=&limit=
```

## HTTP status mapping

- 200/201 success
- 400 validation error
- 401 missing/invalid token
- 403 role or company-scope forbidden
- 404 not found (including "exists but not yours" — never leak existence across tenants)
- 409 conflict (e.g. duplicate FBR submission in progress)
- 429 rate limited (auth endpoints)
- 500 internal (no stack trace in response body in production)
