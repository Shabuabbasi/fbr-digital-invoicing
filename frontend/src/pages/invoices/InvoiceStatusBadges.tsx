import { Badge } from "../../components/Badge";
import type { FbrInvoiceStatus, InvoiceStatus } from "../../types/invoice";

const statusTone: Record<InvoiceStatus, "gray" | "green" | "yellow" | "red" | "blue"> = {
  DRAFT: "gray",
  READY_FOR_SUBMISSION: "blue",
  SUBMITTING: "yellow",
  SUBMITTED: "green",
  FAILED: "red",
};

const fbrStatusTone: Record<FbrInvoiceStatus, "gray" | "green" | "yellow" | "red" | "blue"> = {
  NOT_SUBMITTED: "gray",
  PENDING: "yellow",
  SUBMITTED: "green",
  FAILED: "red",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge tone={statusTone[status]}>{status.replace(/_/g, " ")}</Badge>;
}

export function FbrStatusBadge({ status }: { status: FbrInvoiceStatus }) {
  return <Badge tone={fbrStatusTone[status]}>{status.replace(/_/g, " ")}</Badge>;
}
