export interface Product {
  _id: string;
  name: string;
  sku: string;
  description: string;
  unit: string;
  salePriceMinor: number;
  taxRateBasisPoints: number;
  hsCode: string;
  isActive: boolean;
  stockQty: number | null;
  createdAt: string;
}

export interface ProductInput {
  name: string;
  sku: string;
  description?: string;
  unit: string;
  salePriceMinor: number;
  taxRateBasisPoints: number;
  hsCode?: string;
  isActive?: boolean;
  stockQty?: number | null;
}
