# Architecture — Intelgency Digital Invoicing

## 1. Repository inspection findings (as of 2026-09-08)

- `frontend/` contained the **TailAdmin Free HTML template** (vanilla HTML pages + Alpine.js + Tailwind v4 + Webpack, package name `tailadmin-free`, pulled directly from TailAdmin's own GitHub repo). No React, no router, no component framework, no API layer, no auth.
- `backend/` was empty — no framework scaffolded.
- No database, no `.env`, no CI config, no tests existed.

## 2. Decisions made with the user (recorded so future work doesn't re-litigate them)

| Decision | Choice | Why |
|---|---|---|
| Frontend framework | **React + Vite + TypeScript + Tailwind CSS**, hand-built components *inspired by* TailAdmin's layout patterns (sidebar, cards, tables, forms) | User explicitly rejected pulling in TailAdmin's own React template; wants a clean React app styled similarly, not a vendored template |
| Backend framework | **Node.js + Express + TypeScript** | Matches spec's REST API requirement, straightforward, testable |
| Database | **MongoDB + Mongoose** | User's explicit choice over the recommended Postgres/Prisma. Tradeoff: Mongo lacks native relational FK integrity — mitigated by (a) storing money as integers (minor units) or `Decimal128`, never floats, (b) using **multi-document ACID transactions** (`mongoose.startSession()`) for any write that touches more than one collection (invoice creation + stock/company counters, FBR submission + invoice status update), (c) application-level referential checks (verify `companyId` ownership on every read/write) since Mongo won't enforce FKs for us. |
| Auth | JWT (access token), bcrypt password hashing, RBAC via Express middleware | Per spec §4, §18 |
| Multi-tenancy | Every company-owned document carries `companyId`; all queries scoped by `req.user.companyId` in a shared middleware/helper, never by frontend filtering | Per spec §17 |

The old TailAdmin HTML template will be removed from `frontend/` (it's a vendored template, not our code) and replaced with a fresh Vite React app. Reusable brand assets (logo, images) may be copied over if useful.

## 3. High-level architecture

```
┌─────────────────────────┐        HTTPS/JSON        ┌──────────────────────────┐
│   frontend (React/Vite)  │ ───────────────────────▶ │  backend (Express/TS)    │
│  - pages, layouts        │ ◀─────────────────────── │  - REST API (/api/*)     │
│  - services/api/*        │      JWT bearer token      │  - RBAC middleware       │
│  - auth context           │                            │  - modules/*             │
└─────────────────────────┘                            └───────────┬──────────────┘
                                                                    │
                                                       ┌────────────┴─────────────┐
                                                       │       MongoDB             │
                                                       │  (Mongoose models,        │
                                                       │   transactions)           │
                                                       └────────────┬─────────────┘
                                                                    │
                                                       ┌────────────┴─────────────┐
                                                       │  modules/fbr/            │
                                                       │  fbr.client → FBR API     │
                                                       │  (isolated, see          │
                                                       │  FBR-INTEGRATION.md)      │
                                                       └───────────────────────────┘
```

## 4. Folder structure

```
frontend/src/
  app/                 # router, root layout, providers
  components/          # shared UI primitives (Button, Card, Table, Modal, Toast, EmptyState...)
  layouts/             # DashboardLayout (sidebar+header), AuthLayout
  pages/
    auth/
    dashboard/
    products/
    customers/
    invoices/
    reports/
    settings/
    profile/
  features/            # feature-scoped components/hooks (invoices/, products/, ...)
  services/api/        # centralized API layer (authApi, productApi, customerApi, invoiceApi, fbrApi, reportApi, http client with 401 handling)
  context/              # AuthContext (current user, role, token)
  utils/               # money formatting, date formatting, RBAC helpers (canAccess)
  types/

backend/src/
  config/              # env loader, db connection, constants
  middleware/          # auth (JWT verify), rbac (role guard), tenant (companyId scope), errorHandler, rateLimit
  modules/
    auth/
    users/
    company/
    products/
    customers/
    invoices/
    reports/
    fbr/
      fbr.service.ts
      fbr.controller.ts
      fbr.client.ts
      fbr.mapper.ts
      fbr.validator.ts
      fbr.types.ts
      fbr.errors.ts
    auditLogs/
  models/              # Mongoose schemas
  utils/               # money (integer/Decimal128 helpers), logger, asyncHandler
  tests/
```

## 5. Recommended API architecture

REST, versionless (`/api/...`), consistent envelope (`{success, data, message}` / `{success:false, message, code}`), JWT bearer auth, centralized error handler mapping known errors → HTTP status + code. See `API.md`.

## 6. Recommended FBR integration architecture

Isolated module (`backend/src/modules/fbr/`), invoice → validation → payload mapper → client → normalize response → persist `FbrSubmission` → update invoice status, with idempotency locking to prevent duplicate submissions. See `FBR-INTEGRATION.md` — **no FBR endpoint/payload/field details are invented**; those are marked as pending official documentation.

## 7. Implementation phases

See `DEVELOPMENT-PLAN.md` for the full phased plan.

## 8. Technical risks

1. **FBR API documentation not yet supplied** — the FBR module cannot be wired to a real endpoint until official technical docs (endpoints, auth, payload schema, tax/invoice type codes) are provided. Mitigation: build the module against a well-defined internal interface (`fbr.client`) so only that file changes once docs arrive; stub with clearly-marked "not yet integrated" state, never fake success responses.
2. **MongoDB financial integrity** — mitigated via integer/Decimal128 money storage + transactions, but requires discipline in every write path; will add backend tests specifically for this.
3. **Duplicate FBR submissions** from retries — mitigated with a submission lock/idempotency key stored on the invoice (`fbrSubmissionStatus: SUBMITTING` acts as a lock; only one submission allowed while in that state).
4. **Rounding/tax calculation correctness** — centralized single calculation utility on the backend, used by both invoice save and FBR payload mapping, unit-tested.

## 9. Estimated effort (solo/AI-assisted development, rough order of magnitude)

- Phase 0 (docs/plan): done (this pass)
- Phase 1 (auth, company, RBAC scaffold): 1–2 sessions
- Phase 2 (products, customers CRUD): 1–2 sessions
- Phase 3 (invoice creation + calculation engine): 2–3 sessions
- Phase 4 (FBR module skeleton + status tracking, pending real docs): 1–2 sessions
- Phase 5 (dashboard + reports): 1–2 sessions
- Phase 6 (PDF/print, polish, security hardening, tests): 1–2 sessions

Total: roughly 8–13 focused sessions to a working end-to-end MVP (excluding real FBR sandbox certification, which depends on FBR's own onboarding process).
