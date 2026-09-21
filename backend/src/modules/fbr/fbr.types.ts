// Real FBR Digital Invoicing contract, from the official PRAL "Technical Specification for
// DI API" v1.12 (issued 7-Apr-2025, last updated 24-Jul-2025), downloaded from
// https://download1.fbr.gov.pk/Docs/20257301172130815TechnicalDocumentationforDIAPIV1.12.pdf
// See docs/FBR-INTEGRATION.md for the full field reference and what's still an MVP assumption
// (sale type, HS code sourcing, scenario selection).

export interface FbrInvoiceItemPayload {
  hsCode: string;
  productDescription: string;
  rate: string; // e.g. "18%"
  uoM: string;
  quantity: number;
  totalValues: number; // sales value including tax
  valueSalesExcludingST: number;
  fixedNotifiedValueOrRetailPrice: number;
  salesTaxApplicable: number;
  salesTaxWithheldAtSource: number;
  extraTax: number;
  furtherTax: number;
  sroScheduleNo: string;
  fedPayable: number;
  discount: number;
  saleType: string;
  sroItemSerialNo: string;
}

export interface FbrInvoicePayload {
  invoiceType: "Sale Invoice" | "Debit Note";
  invoiceDate: string; // "YYYY-MM-DD"
  sellerNTNCNIC: string;
  sellerBusinessName: string;
  sellerProvince: string;
  sellerAddress: string;
  buyerNTNCNIC: string;
  buyerBusinessName: string;
  buyerProvince: string;
  buyerAddress: string;
  buyerRegistrationType: "Registered" | "Unregistered";
  invoiceRefNo: string; // required only for debit notes
  scenarioId?: string; // required for sandbox only
  items: FbrInvoiceItemPayload[];
}

export interface FbrItemStatus {
  itemSNo: string;
  statusCode: string;
  status: string;
  invoiceNo: string | null;
  errorCode: string;
  error: string;
}

export interface FbrValidationResponse {
  statusCode: string; // "00" valid, "01" invalid
  status: string; // "Valid" | "Invalid"
  errorCode?: string;
  error: string;
  invoiceStatuses: FbrItemStatus[] | null;
}

export interface FbrPostInvoiceResponse {
  invoiceNumber?: string; // FBR-issued invoice number, present on success
  dated: string;
  validationResponse: FbrValidationResponse;
}

export interface FbrSubmitResult {
  httpStatus: number;
  fbrResponseStatus: string;
  fbrReferenceNumber: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}
