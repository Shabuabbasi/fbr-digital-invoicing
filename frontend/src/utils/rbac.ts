import type { Role } from "../types/auth";

// UX-only gating — the backend is the actual authority (see docs/RBAC.md).
const ADMIN_ONLY_ACTIONS = new Set([
  "products.write",
  "customers.delete",
  "users.manage",
  "company.write",
  "fbr.configure",
  "tax.configure",
  "auditLogs.view",
]);

export function canAccess(role: Role, action: string): boolean {
  if (role === "ADMIN") return true;
  return !ADMIN_ONLY_ACTIONS.has(action);
}
