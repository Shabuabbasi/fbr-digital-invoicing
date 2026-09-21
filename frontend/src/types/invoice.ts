export type InvoiceStatus = "DRAFT" | "READY_FOR_SUBMISSION" | "SUBMITTING" | "SUBMITTED" | "FAILED";
export type FbrInvoiceStatus = "NOT_SUBMITTED" | "PENDING" | "SUBMITTED" | "FAILED";

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceMinor: number;
  discountMinor: number;
  taxRateBasisPoints: number;
  taxMinor: number;
  lineTotalMinor: number;
}

export interface PartySnapshot {
  name: string;
  ntn: string;
  strn: string;
  cnic: string;
  address: string;
}

export interface InvoiceCustomerRef {
  _id: string;
  name: string;
  businessName: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerId: InvoiceCustomerRef | string;
  sellerSnapshot: PartySnapshot;
  buyerSnapshot: PartySnapshot;
  items: InvoiceItem[];
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  status: InvoiceStatus;
  fbrStatus: FbrInvoiceStatus;
  fbrReferenceNumber: string | null;
  createdAt: string;
}

export interface InvoiceItemInput {
  productId: string;
  quantity: number;
  discountMinor?: number;
}

export interface InvoiceInput {
  customerId: string;
  invoiceDate?: string;
  items: InvoiceItemInput[];
}
