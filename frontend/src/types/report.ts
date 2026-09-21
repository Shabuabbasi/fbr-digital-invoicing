import type { InvoiceStatus, FbrInvoiceStatus, InvoiceCustomerRef } from "./invoice";

export interface DashboardSummary {
  totalSalesMinor: number;
  totalInvoices: number;
  totalTaxMinor: number;
  fbrSubmitted: number;
  fbrPending: number;
  fbrFailed: number;
  recentInvoices: Array<{
    _id: string;
    invoiceNumber: string;
    invoiceDate: string;
    customerId: InvoiceCustomerRef;
    totalMinor: number;
    status: InvoiceStatus;
    fbrStatus: FbrInvoiceStatus;
  }>;
  salesOverview: Array<{ date: string; totalMinor: number }>;
}

export interface SalesReport {
  from: string;
  to: string;
  invoiceCount: number;
  grossSalesMinor: number;
  taxMinor: number;
  discountMinor: number;
  netSalesMinor: number;
}

export interface InvoiceReportRow {
  _id: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerId: InvoiceCustomerRef;
  totalMinor: number;
  status: InvoiceStatus;
  fbrStatus: FbrInvoiceStatus;
}

export interface TaxReportRow {
  date: string;
  taxableAmountMinor: number;
  taxMinor: number;
  invoiceCount: number;
}
