import { http } from "./http";
import type { ApiResponse, Paginated } from "../../types/api";
import type { Product, ProductInput } from "../../types/product";

export interface ProductListParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const productApi = {
  async list(params: ProductListParams = {}): Promise<Paginated<Product>> {
    const res = await http.get<ApiResponse<Paginated<Product>>>("/products", { params });
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async get(id: string): Promise<Product> {
    const res = await http.get<ApiResponse<Product>>(`/products/${id}`);
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async create(input: ProductInput): Promise<Product> {
    const res = await http.post<ApiResponse<Product>>("/products", input);
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async update(id: string, input: Partial<ProductInput>): Promise<Product> {
    const res = await http.patch<ApiResponse<Product>>(`/products/${id}`, input);
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  async deactivate(id: string): Promise<Product> {
    const res = await http.delete<ApiResponse<Product>>(`/products/${id}`);
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },
};
