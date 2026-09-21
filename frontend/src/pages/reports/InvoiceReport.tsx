import { useEffect, useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { Table, type Column } from "../../components/Table";
import { EmptyState } from "../../components/EmptyState";
import { DocsIcon } from "../../icons";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { InvoiceStatusBadge, FbrStatusBadge } from "../invoices/InvoiceStatusBadges";
import { reportApi } from "../../services/api/reportApi";
import { extractErrorMessage } from "../../services/api/http";
import { formatMoney } from "../../utils/money";
import type { InvoiceReportRow } from "../../types/report";

export function InvoiceReport() {
  const [rows, setRows] = useState<InvoiceReportRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reportApi
      .getInvoices()
      .then((res) => setRows(res.items))
      .catch((err) => setError(extractErrorMessage(err)));
  }, []);

  const columns: Column<InvoiceReportRow>[] = [
    { header: "Invoice #", cell: (r) => r.invoiceNumber },
    { header: "Customer", cell: (r) => r.customerId?.name ?? "—" },
    { header: "Date", cell: (r) => new Date(r.invoiceDate).toLocaleDateString() },
    { header: "Total", cell: (r) => formatMoney(r.totalMinor) },
    { header: "Status", cell: (r) => <InvoiceStatusBadge status={r.status} /> },
    { header: "FBR Status", cell: (r) => <FbrStatusBadge status={r.fbrStatus} /> },
  ];

  return (
    <div>
      <PageHeader title="Invoice Report" description="All invoices with status and FBR outcome" />
      {!error && !rows && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!error && rows && rows.length === 0 && <EmptyState title="No invoices found" icon={<DocsIcon />} />}
      {!error && rows && rows.length > 0 && <Table columns={columns} rows={rows} rowKey={(r) => r._id} />}
    </div>
  );
}
