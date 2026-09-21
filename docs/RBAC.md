# RBAC — Intelgency Digital Invoicing

## Roles (MVP)

- **ADMIN** — full access
- **ACCOUNTANT** — operational access, no system/user/FBR-credential configuration

## Permission matrix

| Module / Action | ADMIN | ACCOUNTANT |
|---|---|---|
| Dashboard — view | ✅ | ✅ |
| Products — view | ✅ | ✅ |
| Products — create/edit/delete | ✅ | ❌ |
| Customers — view | ✅ | ✅ |
| Customers — create/edit | ✅ | ✅ |
| Customers — delete/deactivate | ✅ | ❌ |
| Invoices — view | ✅ | ✅ |
| Invoices — create/edit (while DRAFT) | ✅ | ✅ |
| Invoices — submit to FBR | ✅ | ✅ |
| Invoices — view FBR status | ✅ | ✅ |
| Invoices — print/download | ✅ | ✅ |
| Reports — sales/invoices/tax | ✅ | ✅ (view only) |
| Company settings | ✅ | ❌ |
| FBR configuration/credentials | ✅ | ❌ |
| Users — manage | ✅ | ❌ |
| Tax configuration | ✅ | ❌ |
| Audit logs | ✅ | ❌ |

Note: spec §3 doesn't explicitly grant ACCOUNTANT product create/edit — only "view products" is listed, so product mutation is ADMIN-only per the safest reading of the spec. This is documented here as an assumption.

## Enforcement

### Backend (source of truth)
- `middleware/auth.ts` — verifies JWT, attaches `req.user = { id, companyId, role }`.
- `middleware/rbac.ts` — `requireRole('ADMIN')` or `requireAnyRole('ADMIN','ACCOUNTANT')` guard applied per route.
- `middleware/tenant.ts` — every data-access helper filters by `req.user.companyId`; cross-tenant access always returns 404 (never 403, to avoid leaking existence).
- Every module's service layer re-checks role for sensitive actions even if the route guard already did, as defense in depth for anything security-critical (e.g. FBR credential writes, user role changes).

### Frontend (UX only, never trusted)
- `AuthContext` exposes `user.role`.
- `utils/rbac.ts` — `canAccess(role, action)` helper used to hide/disable nav items, buttons, and routes.
- Protected route wrapper redirects unauthorized users, but this is purely for UX — the backend is the actual gate.

## Audit logging for sensitive actions

Actions that must write to `AuditLog` (see DATABASE.md): user created/role changed/deactivated, company settings changed, FBR credentials changed, tax configuration changed, invoice submitted to FBR, invoice status changed by correction workflow.
