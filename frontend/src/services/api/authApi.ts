import { http } from "./http";
import type { ApiResponse } from "../../types/api";
import type { LoginResponse, MeResponse, User } from "../../types/auth";

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await http.post<ApiResponse<LoginResponse>>("/auth/login", { email, password });
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async me(): Promise<MeResponse> {
    const res = await http.get<ApiResponse<MeResponse>>("/auth/me");
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async logout(): Promise<void> {
    await http.post("/auth/logout");
  },

  async updateAvatar(avatarUrl: string): Promise<User> {
    const res = await http.patch<ApiResponse<User>>("/auth/avatar", { avatarUrl });
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },
};
