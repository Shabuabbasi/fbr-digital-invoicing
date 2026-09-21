# Database Design (MongoDB / Mongoose) — Intelgency Digital Invoicing

## Money handling rule (applies to every collection below)

All monetary fields are stored as **integers in minor currency units (paisa)** — never as JS floats. A `unitPriceMinor: 150000` means Rs. 1,500.00. All arithmetic happens on integers on the backend; the frontend only formats for display. This avoids MongoDB `Decimal128` complexity while guaranteeing no floating-point drift. Tax rates are stored as basis points (e.g. `1800` = 18.00%) or fixed-point percentages with 2 decimal precision, applied via integer math with a single documented rounding rule (round-half-up to nearest paisa) in `backend/src/utils/money.ts`.

## Collections

### User
```
_id
companyId          (ref Company, indexed)
name
email              (unique, indexed)
passwordHash
role               enum: ADMIN | ACCOUNTANT
isActive           boolean
lastLoginAt
createdAt / updatedAt
```

### Company
```
_id
name
address, city, province
phone, email
ntn, strn
businessType
invoicePrefix         e.g. "INV"
invoiceNumberSeq       integer counter (incremented atomically for numbering)
fbrConfig: {
  environment          enum: SANDBOX | PRODUCTION
  isConfigured          boolean
  // actual token/credential fields stored encrypted or referenced via env/secret store,
  // NEVER returned in API responses — see FBR-INTEGRATION.md
}
createdAt / updatedAt
```
One Company per tenant for MVP; a User belongs to exactly one Company (multi-company-per-user is out of scope for MVP).

### Product
```
_id
companyId          (indexed)
name
sku                (indexed, unique per companyId)
description
unit               e.g. "pcs", "kg"
salePriceMinor
taxCategory        (ref TaxConfiguration, or embedded rate)
isActive
stockQty           optional
createdAt / updatedAt
```

### Customer
```
_id
companyId          (indexed)
name
businessName
ntn, strn, cnic     (optional, validated conditionally)
phone, email
address, city, province
customerType        enum: INDIVIDUAL | BUSINESS
isActive
createdAt / updatedAt
```

### Invoice
```
_id
companyId              (indexed)
invoiceNumber            (indexed, unique per companyId — generated from Company.invoicePrefix + seq)
invoiceDate              (indexed)
customerId               (ref Customer)
sellerSnapshot           { name, ntn, strn, address }   // captured at creation, immutable
buyerSnapshot            { name, ntn, strn, cnic, address }
items: [InvoiceItem]     // embedded, see below
subtotalMinor
discountMinor
taxMinor
totalMinor
status                   enum: DRAFT | READY_FOR_SUBMISSION | SUBMITTING | SUBMITTED | FAILED
fbrStatus                enum: NOT_SUBMITTED | PENDING | SUBMITTED | FAILED
fbrReferenceNumber        nullable
fbrLastSubmissionId       (ref FbrSubmission, nullable)
createdBy                 (ref User)
createdAt / updatedAt
```

### InvoiceItem (embedded subdocument array on Invoice)
```
productId          (ref Product)
productName          // snapshot at time of invoicing
quantity
unitPriceMinor
discountMinor
taxRate               // snapshot (basis points)
taxMinor
lineTotalMinor
```
Embedded rather than a separate collection: line items are always read/written together with their parent invoice and never queried independently — this is the correct Mongo modeling choice here, not an oversight.

### TaxConfiguration
```
_id
companyId          (indexed)
name                 e.g. "Standard Sales Tax"
rate                  basis points, e.g. 1800 = 18%
category               maps to FBR tax/rate code once known (see FBR-INTEGRATION.md)
isActive
```

### FbrSubmission
```
_id
invoiceId            (indexed, ref Invoice)
companyId            (indexed)
environment            SANDBOX | PRODUCTION
attemptNumber
requestId              // our own idempotency/correlation id, indexed unique
requestPayload          // sanitized, no credentials
requestedAt
httpStatus
fbrResponseStatus
fbrReferenceNumber
errorCode
errorMessage
respondedAt
createdAt
```
Never stores FBR credentials/tokens. One document per submission attempt (supports retry history).

### AuditLog
```
_id
companyId          (indexed)
userId               (ref User)
action                 e.g. "INVOICE_SUBMITTED_TO_FBR", "USER_ROLE_CHANGED"
targetType / targetId
metadata               // structured, no secrets
createdAt            (indexed)
```

## Indexes (minimum required)

- `User.email` unique
- `Invoice.{companyId, invoiceNumber}` unique compound
- `Invoice.{companyId, invoiceDate}` for report queries
- `Invoice.{companyId, fbrStatus}` for dashboard counts
- `Product.{companyId, sku}` unique compound
- `Customer.companyId`
- `FbrSubmission.{invoiceId}`
- `FbrSubmission.requestId` unique (idempotency)
- `AuditLog.{companyId, createdAt}`

## Multi-tenancy enforcement

Every query in every controller/service must be scoped: `Model.find({ companyId: req.user.companyId, ... })`. A shared `withTenant(req)` helper will be used everywhere to make this pattern impossible to skip accidentally, and code review/tests will specifically check cross-tenant access is rejected (see RBAC.md).

## Transactions

Mongo multi-document transactions (`session.withTransaction`) are used for:
1. Invoice creation — allocating `Company.invoiceNumberSeq` + inserting the `Invoice` document atomically.
2. FBR submission — locking the invoice (`status: SUBMITTING`) + creating the `FbrSubmission` record atomically, and later updating invoice status + submission result atomically.

This requires MongoDB running as a replica set (even single-node) — noted in deployment setup.
