import { http } from "./http";
import type { ApiResponse, Paginated } from "../../types/api";
import type { Customer, CustomerInput } from "../../types/customer";

export interface CustomerListParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const customerApi = {
  async list(params: CustomerListParams = {}): Promise<Paginated<Customer>> {
    const res = await http.get<ApiResponse<Paginated<Customer>>>("/customers", { params });
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async get(id: string): Promise<Customer> {
    const res = await http.get<ApiResponse<Customer>>(`/customers/${id}`);
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async create(input: CustomerInput): Promise<Customer> {
    const res = await http.post<ApiResponse<Customer>>("/customers", input);
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async update(id: string, input: Partial<CustomerInput>): Promise<Customer> {
    const res = await http.patch<ApiResponse<Customer>>(`/customers/${id}`, input);
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async deactivate(id: string): Promise<Customer> {
    const res = await http.delete<ApiResponse<Customer>>(`/customers/${id}`);
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },
};
