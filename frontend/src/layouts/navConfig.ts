import type { Role } from "../types/auth";

export interface NavItem {
  label: string;
  to: string;
  action?: string; // maps to utils/rbac.ts canAccess(); undefined = all authenticated roles
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  { items: [{ label: "Dashboard", to: "/dashboard" }] },
  {
    label: "Sales",
    items: [
      { label: "Invoices", to: "/invoices" },
      { label: "Customers", to: "/customers" },
    ],
  },
  { items: [{ label: "Products", to: "/products" }] },
  {
    label: "Reports",
    items: [
      { label: "Sales", to: "/reports/sales" },
      { label: "Invoices", to: "/reports/invoices" },
      { label: "Tax", to: "/reports/tax" },
    ],
  },
  {
    label: "FBR",
    items: [
      { label: "Submissions", to: "/fbr/submissions" },
      { label: "Integration Logs", to: "/fbr/logs", action: "auditLogs.view" },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Company", to: "/settings/company", action: "company.write" },
      { label: "FBR Configuration", to: "/settings/fbr", action: "fbr.configure" },
      { label: "Users", to: "/settings/users", action: "users.manage" },
    ],
  },
  { items: [{ label: "Profile", to: "/profile" }] },
];

export function filterNav(sections: NavSection[], role: Role, canAccess: (role: Role, action: string) => boolean): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.action || canAccess(role, item.action)),
    }))
    .filter((section) => section.items.length > 0);
}
