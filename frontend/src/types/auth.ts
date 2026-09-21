export type Role = "ADMIN" | "ACCOUNTANT";

export interface CompanySummary {
  id: string;
  name: string;
  invoicePrefix: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string;
  isActive: boolean;
  avatarUrl: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface MeResponse {
  user: User;
  company: CompanySummary;
}
