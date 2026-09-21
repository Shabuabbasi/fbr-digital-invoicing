import type { Role } from "./auth";

export interface ManagedUser {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  avatarUrl: string;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
}
