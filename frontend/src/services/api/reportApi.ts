import { http } from "./http";
import type { ApiResponse } from "../../types/api";
import type { DashboardSummary, InvoiceReportRow, SalesReport, TaxReportRow } from "../../types/report";

export const reportApi = {
  async getDashboard(): Promise<DashboardSummary> {
    const res = await http.get<ApiResponse<DashboardSummary>>("/reports/dashboard");
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async getSales(params: { range?: string; from?: string; to?: string } = {}): Promise<SalesReport> {
    const res = await http.get<ApiResponse<SalesReport>>("/reports/sales", { params });
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async getInvoices(params: { from?: string; to?: string; status?: string; fbrStatus?: string } = {}): Promise<{ items: InvoiceReportRow[] }> {
    const res = await http.get<ApiResponse<{ items: InvoiceReportRow[] }>>("/reports/invoices", { params });
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async getTax(params: { range?: string; from?: string; to?: string } = {}): Promise<{ from: string; to: string; rows: TaxReportRow[] }> {
    const res = await http.get<ApiResponse<{ from: string; to: string; rows: TaxReportRow[] }>>("/reports/tax", { params });
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },
};
