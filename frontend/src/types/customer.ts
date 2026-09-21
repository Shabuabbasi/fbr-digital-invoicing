export type CustomerType = "INDIVIDUAL" | "BUSINESS";

export interface Customer {
  _id: string;
  name: string;
  businessName: string;
  ntn: string;
  strn: string;
  cnic: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  province: string;
  customerType: CustomerType;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerInput {
  name: string;
  businessName?: string;
  ntn?: string;
  strn?: string;
  cnic?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  province?: string;
  customerType: CustomerType;
  isActive?: boolean;
}
