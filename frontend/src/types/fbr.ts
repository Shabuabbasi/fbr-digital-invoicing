export interface FbrSubmission {
  _id: string;
  invoiceId: string;
  environment: "SANDBOX" | "PRODUCTION";
  attemptNumber: number;
  requestId: string;
  requestedAt: string;
  httpStatus: number | null;
  fbrResponseStatus: string | null;
  fbrReferenceNumber: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  respondedAt: string | null;
  createdAt: string;
}

export interface InvoiceFbrStatus {
  status: string;
  fbrStatus: string;
  fbrReferenceNumber: string | null;
  latestSubmission: FbrSubmission | null;
}
