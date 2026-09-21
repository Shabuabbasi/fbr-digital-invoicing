import { http } from "./http";
import type { ApiResponse } from "../../types/api";
import type { Company, CompanyUpdateInput, FbrSettings } from "../../types/company";

export const companyApi = {
  async get(): Promise<Company> {
    const res = await http.get<ApiResponse<Company>>("/company");
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async update(input: CompanyUpdateInput): Promise<Company> {
    const res = await http.patch<ApiResponse<Company>>("/company", input);
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async getFbrSettings(): Promise<FbrSettings> {
    const res = await http.get<ApiResponse<FbrSettings>>("/company/fbr-settings");
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async updateFbrEnvironment(environment: "SANDBOX" | "PRODUCTION"): Promise<FbrSettings> {
    const res = await http.patch<ApiResponse<FbrSettings>>("/company/fbr-settings", { environment });
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },
};
