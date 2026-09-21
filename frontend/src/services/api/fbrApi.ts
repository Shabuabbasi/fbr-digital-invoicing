import { http } from "./http";
import type { ApiResponse, Paginated } from "../../types/api";
import type { FbrSubmission, InvoiceFbrStatus } from "../../types/fbr";

export const fbrApi = {
  async getInvoiceStatus(invoiceId: string): Promise<InvoiceFbrStatus> {
    const res = await http.get<ApiResponse<InvoiceFbrStatus>>(`/invoices/${invoiceId}/fbr-status`);
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async listSubmissions(params: { invoiceId?: string; page?: number; limit?: number } = {}): Promise<Paginated<FbrSubmission>> {
    const res = await http.get<ApiResponse<Paginated<FbrSubmission>>>("/fbr/submissions", { params });
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async listLogs(params: { page?: number; limit?: number } = {}): Promise<Paginated<FbrSubmission>> {
    const res = await http.get<ApiResponse<Paginated<FbrSubmission>>>("/fbr/logs", { params });
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },
};
