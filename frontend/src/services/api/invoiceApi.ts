import { http } from "./http";
import type { ApiResponse, Paginated } from "../../types/api";
import type { Invoice, InvoiceInput } from "../../types/invoice";

export interface InvoiceListParams {
  status?: string;
  fbrStatus?: string;
  customerId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export const invoiceApi = {
  async list(params: InvoiceListParams = {}): Promise<Paginated<Invoice>> {
    const res = await http.get<ApiResponse<Paginated<Invoice>>>("/invoices", { params });
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async get(id: string): Promise<Invoice> {
    const res = await http.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async create(input: InvoiceInput): Promise<Invoice> {
    const res = await http.post<ApiResponse<Invoice>>("/invoices", input);
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async update(id: string, input: InvoiceInput): Promise<Invoice> {
    const res = await http.patch<ApiResponse<Invoice>>(`/invoices/${id}`, input);
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async finalize(id: string): Promise<Invoice> {
    const res = await http.post<ApiResponse<Invoice>>(`/invoices/${id}/finalize`);
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async submitToFbr(id: string): Promise<Invoice> {
    const res = await http.post<ApiResponse<Invoice>>(`/invoices/${id}/submit-fbr`);
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async downloadPdf(id: string, invoiceNumber: string): Promise<void> {
    const res = await http.get(`/invoices/${id}/pdf`, { responseType: "blob" });
    const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${invoiceNumber}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  },
};
