# FBR Digital Invoicing Integration

## Status: implemented against the real, official FBR/PRAL spec — needs a sandbox token to go live

This module is built against **PRAL's "Technical Specification for DI API" v1.12** (issued 7-Apr-2025, last updated 24-Jul-2025), the official technical document for FBR's Digital Invoicing system, downloaded directly from FBR's own domain:
`https://download1.fbr.gov.pk/Docs/20257301172130815TechnicalDocumentationforDIAPIV1.12.pdf`
(a local copy is kept at `docs/reference/FBR-DI-API-Technical-Spec-v1.12.pdf` for convenience).

Every endpoint, field name, and response shape below comes from that document — nothing is invented. What's still missing is a **sandbox security token**, which is a per-business secret FBR issues through the IRIS portal and can't be looked up or guessed. Until `FBR_API_TOKEN` is set, `fbr.client.ts` throws `FbrNotConfiguredError` rather than faking a success response.

## How to get a sandbox token and finish going live

1. Register your business for Digital Invoicing on FBR's **IRIS portal** (`https://iris.fbr.gov.pk`), under your NTN.
2. Under IRIS → Digital Invoicing → **Sandbox Environment**, request a sandbox security token. It's a Bearer token, valid 5 years.
3. Put it in `backend/.env` as `FBR_API_TOKEN=<token>` (never commit this; `.env` is git-ignored).
4. In **Settings → Company**, make sure your business NTN and province are filled in — both are required by FBR before an invoice can be submitted (enforced by `fbr.validator.ts`).
5. On every **Product**, fill in the **HS Code** field — FBR requires one per line item, and there's no reliable generic default.
6. Create a customer with either an NTN/STRN (→ "Registered") or a CNIC (→ "Unregistered"), create + finalize an invoice, and hit **Submit to FBR**. In sandbox this hits FBR's real test endpoint and returns a real (test) FBR invoice number.
7. FBR requires clearing a set of **sandbox test scenarios** (see below) before they'll issue a production token — this is FBR's process, not something this app can skip.

## Real endpoints (sandbox vs production selected by `FBR_ENVIRONMENT`)

| Purpose                    | Sandbox                                                      | Production                                                |
| -------------------------- | ------------------------------------------------------------ | --------------------------------------------------------- |
| Post invoice               | `https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb`     | `https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata`     |
| Validate invoice (dry run) | `https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata_sb` | `https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata` |

Per FBR's docs, routing between sandbox and production is actually determined by _which token_ is used, not the URL — but we key off `FBR_ENVIRONMENT` too so the right URL is used from the start. `FBR_API_BASE_URL` in `.env` is optional — leave it blank and the app uses the table above automatically; only set it if FBR gives you a different gateway URL.

Auth: `Authorization: Bearer <token>` header on every request (`fbr.client.ts`).

Reference/lookup APIs FBR also expose (province codes, HS codes, UOM, tax rates, SRO schedules, document types) live under `https://gw.fbr.gov.pk/pdi/v1/...` — **not yet wired into this app**. Today, province/UOM/rate/HS code are free-text fields we pass straight through; if FBR rejects a value as not matching their reference list, the rejection message tells you exactly what's wrong. Calling these reference APIs to build proper dropdowns is a natural follow-up, not required for a first working submission.

## Module layout

```
backend/src/modules/fbr/
  fbr.controller.ts   # HTTP layer: POST /api/invoices/:id/submit-fbr, GET status
  fbr.service.ts      # orchestration: validate → buildPayload → submit → persist → update invoice
  fbr.client.ts       # real HTTP client — POSTs to the URLs above, Bearer auth, 401/5xx handling
  fbr.mapper.ts       # Invoice → real FBR payload (unit-tested, see fbr.mapper.test.ts)
  fbr.validator.ts    # pre-submission checks matching FBR's required fields
  fbr.types.ts        # TypeScript types matching FBR's real payload/response schema
  fbr.errors.ts       # typed error classes: FbrNotConfiguredError, FbrTimeoutError, FbrRejectedError
```

## Payload mapping (Invoice → FBR's `postinvoicedata` schema)

| Our field                                  | FBR field               | Notes                                                                 |
| ------------------------------------------ | ----------------------- | --------------------------------------------------------------------- |
| `invoiceDate`                              | `invoiceDate`           | `"YYYY-MM-DD"`                                                        |
| `sellerSnapshot.ntn`                       | `sellerNTNCNIC`         | Company NTN — required                                                |
| `sellerSnapshot.name`                      | `sellerBusinessName`    |                                                                       |
| `sellerSnapshot.province`                  | `sellerProvince`        | Company province — required                                           |
| `sellerSnapshot.address`                   | `sellerAddress`         |                                                                       |
| `buyerSnapshot.ntn` or `.cnic`             | `buyerNTNCNIC`          | NTN preferred, falls back to CNIC                                     |
| `buyerSnapshot.province`                   | `buyerProvince`         | Customer province — required                                          |
| — (derived)                                | `buyerRegistrationType` | `"Registered"` if the customer has an NTN/STRN, else `"Unregistered"` |
| `item.hsCode`                              | `hsCode`                | Set on the Product — required per line item                           |
| `item.productName`                         | `productDescription`    |                                                                       |
| `item.taxRateBasisPoints`                  | `rate`                  | `1800` → `"18%"`                                                      |
| `item.unit`                                | `uoM`                   | Passed through from Product.unit as-is                                |
| `(unitPriceMinor*qty - discountMinor)/100` | `valueSalesExcludingST` |                                                                       |
| `item.taxMinor/100`                        | `salesTaxApplicable`    |                                                                       |
| `item.lineTotalMinor/100`                  | `totalValues`           | Includes tax                                                          |

**Documented MVP assumptions** (not in FBR's docs — our own choices, since these fields aren't in our data model yet):

- `saleType` is hardcoded to `"Goods at Standard Rate (default)"`. Sector-specific sale types (steel, textile, telecom, ...) from FBR's scenario table aren't supported.
- `scenarioId` (sandbox-only field) is derived as `SN001` (registered buyer) / `SN002` (unregistered buyer) — the two scenarios every business type is eligible for per FBR's "Applicable Scenarios based on Business Activity" table. Sector-specific scenarios (SN003–SN028) aren't selectable yet.
- `fixedNotifiedValueOrRetailPrice`, `salesTaxWithheldAtSource`, `furtherTax`, `fedPayable`, `sroScheduleNo`, `sroItemSerialNo` are sent as `0`/`""`; `extraTax` is sent as `""` per the IRIS payload example — not tracked by this MVP.
- Only `invoiceType: "Sale Invoice"` is supported. Debit notes (which need `invoiceRefNo` pointing at the original invoice) aren't implemented — see spec §10's correction workflow, still future work.

## Response handling

FBR's success response looks like:

```json
{ "invoiceNumber": "7000007DI1747119701593", "dated": "...", "validationResponse": { "statusCode": "00", "status": "Valid", "invoiceStatuses": [...] } }
```

`fbr.client.ts` treats `validationResponse.statusCode === "00"` and `status === "Valid"` as success and stores `invoiceNumber` as `fbrReferenceNumber`. Anything else — including a 200 response with `statusCode: "01"` — is treated as a rejection, with FBR's own `error` message surfaced back to the user. HTTP `401` (bad/expired token) and `5xx` are mapped to distinct, retryable-vs-not error types.

## Idempotency / duplicate submission protection

- An invoice can only be submitted while `status` is `READY_FOR_SUBMISSION` or `FAILED` (for retry). The transition to `SUBMITTING` is an atomic `findOneAndUpdate` filtered on the current status — it acts as a lock, so a second concurrent submit request is rejected with `409 CONFLICT` / `FBR_SUBMISSION_IN_PROGRESS` before any FBR call is made.
- Each attempt generates our own `requestId` (UUID) stored on `FbrSubmission.requestId` (unique index), for correlation/debugging.
- Frontend retry clicks are disabled while `status=SUBMITTING`; the backend lock is the actual source of truth, not the frontend.

## Timeout, retry, error handling

- `fbr.client` calls use a configurable timeout (`FBR_API_TIMEOUT_MS`, default 15000ms), aborted via `AbortController`.
- On timeout or 5xx from FBR: mark `FAILED`, store the error, allow manual retry via `POST /api/invoices/:id/submit-fbr` again (new `FbrSubmission` attempt, `attemptNumber` incremented). No automatic silent retries that could double-submit.
- On a rejection from FBR (invalid payload, bad token, etc.): mark `FAILED`, surface FBR's own error message to the user so they can correct the invoice or product data.

## Sandbox test scenarios (FBR's own onboarding requirement)

Per §9–10 of the spec, FBR requires clearing a set of test scenarios (`SN001`–`SN028`) tied to your registered business activity/sector before issuing a production token. Every business type is eligible for at least `SN001` (standard-rate sale to a registered buyer) and `SN002` (standard-rate sale to an unregistered buyer) — which is exactly what this app currently sends. Sector-specific scenarios (steel, textile, telecom, petroleum, etc.) exist in FBR's spec but aren't wired into this app's sale-type logic yet.

## Configuration (environment variables, never hardcoded, never committed)

```env
FBR_API_BASE_URL=        # optional — leave blank to use FBR's known sandbox/production URL
FBR_API_TOKEN=            # required — sandbox token from IRIS, see "How to get a sandbox token" above
FBR_ENVIRONMENT=SANDBOX
FBR_API_TIMEOUT_MS=15000
```

`.env` is git-ignored; `.env.example` documents the keys. Credentials are never returned by any API response (`/api/company/fbr-settings` GET returns `isConfigured: boolean` only, not the token).

## Audit trail

Every submission attempt is recorded in `FbrSubmission` (see DATABASE.md) with request timestamp, correlation id, environment, the exact payload sent, HTTP status, FBR response status, reference number, error code/message, response timestamp — no credentials stored in this log.
