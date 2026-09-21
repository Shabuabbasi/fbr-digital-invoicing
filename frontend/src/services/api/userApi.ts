import { http } from "./http";
import type { ApiResponse, Paginated } from "../../types/api";
import type { CreateUserInput, ManagedUser } from "../../types/user";

export const userApi = {
  async list(params: { page?: number; limit?: number } = {}): Promise<Paginated<ManagedUser>> {
    const res = await http.get<ApiResponse<Paginated<ManagedUser>>>("/users", { params });
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async create(input: CreateUserInput): Promise<ManagedUser> {
    const res = await http.post<ApiResponse<ManagedUser>>("/users", input);
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async update(id: string, input: Partial<Pick<ManagedUser, "name" | "role" | "isActive">>): Promise<ManagedUser> {
    const res = await http.patch<ApiResponse<ManagedUser>>(`/users/${id}`, input);
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async deactivate(id: string): Promise<ManagedUser> {
    const res = await http.delete<ApiResponse<ManagedUser>>(`/users/${id}`);
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },
};
