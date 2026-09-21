# Development Plan — Intelgency Digital Invoicing

Each phase ends with: lint passes, tests pass (where applicable), build succeeds, and the module is manually verified end-to-end (API via REST client, UI in browser) before moving on. No phase leaves broken code behind.

## Phase 0 — Planning (this pass)
- Inspect repo ✅
- Resolve frontend/backend stack decisions with user ✅
- Write ARCHITECTURE.md, DATABASE.md, API.md, FBR-INTEGRATION.md, RBAC.md, DEVELOPMENT-PLAN.md ✅
- **Wait for user approval before Phase 1**

## Phase 1 — Foundations
- Remove old TailAdmin HTML template from `frontend/`; scaffold Vite + React + TypeScript + Tailwind
- Scaffold `backend/` (Express + TypeScript, folder structure per ARCHITECTURE.md, MongoDB connection, env config, `.env.example`)
- Build shared UI primitives inspired by TailAdmin patterns: DashboardLayout (sidebar+header), Card, Table, Button, Modal, Toast, EmptyState, LoadingState, form inputs
- Backend: User, Company models; auth (login, JWT issue/verify, password hashing); RBAC middleware; tenant-scoping helper
- Frontend: login page, AuthContext, protected routes, centralized API client (axios instance with 401 handling)
- Checkpoint: login → land on empty dashboard shell, role correctly restricts nav

## Phase 2 — Company setup & Products & Customers
- Company settings page (ADMIN) + API
- Products CRUD (list/search/filter/pagination, create, edit, deactivate) — backend + frontend
- Customers CRUD (same shape) — backend + frontend
- Checkpoint: `npm test`, `npm run lint`, `npm run build` pass for both projects

## Phase 3 — Invoice engine (core module)
- Backend money/tax calculation utility (integer math, single rounding rule) + unit tests
- Invoice model, create/edit (DRAFT only), server-side total computation (frontend total is never trusted)
- Invoice list/detail UI, invoice builder UI (select customer, add line items, live preview of backend-computed totals via draft save or a calculation-preview endpoint)
- Invoice lifecycle states enforced (DRAFT → READY_FOR_SUBMISSION, edit lock after submission)
- Checkpoint: create an invoice end-to-end with correct totals, verified against hand-calculated expected values in tests

## Phase 4 — FBR integration skeleton
- Build `modules/fbr/*` per FBR-INTEGRATION.md against a placeholder client interface
- Submission lock / idempotency, `FbrSubmission` records, retry endpoint
- FBR status UI on invoice detail + dashboard FBR overview
- Explicitly surface "FBR integration not yet configured" state until real credentials/docs are supplied — never fake a success response
- Checkpoint: submit flow reaches `fbr.client` and fails gracefully with a clear, logged, non-crashing error in absence of real config; duplicate-submit attempts correctly rejected (tested)

## Phase 5 — Dashboard & Reports
- Dashboard cards + recent invoices + sales chart + FBR status overview, wired to real aggregation endpoints (no hardcoded numbers)
- Sales / Invoice / Tax reports with date-range filters
- Checkpoint: numbers match manually-verified data from seeded test invoices

## Phase 6 — PDF/print, security hardening, polish
- Printable invoice (PDF generation + `/invoices/:id/print` view), Intelgency branding
- Security pass: rate limiting on auth, secure headers (helmet), CORS config, input sanitization audit, ensure no secrets/stack traces leak in responses/logs
- Audit logs UI (ADMIN)
- Full regression pass of the Definition of Done workflow (spec §27)
- Final `npm test` / `npm run lint` / `npm run build` across both projects

## Out of scope for MVP (per spec §23)
CRM, payroll, accounting ledger, complex inventory, ecommerce, chat, notifications system, advanced analytics.

## Open dependency

Phase 4's real FBR connectivity is blocked on the official FBR Digital Invoicing technical documentation — see the checklist in `FBR-INTEGRATION.md`. All other phases can proceed independently.
