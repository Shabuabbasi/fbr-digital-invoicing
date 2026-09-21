import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { Select } from "../../components/Select";
import { Table, type Column } from "../../components/Table";
import { EmptyState } from "../../components/EmptyState";
import { DocsIcon } from "../../icons";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { Pagination } from "../../components/Pagination";
import { invoiceApi } from "../../services/api/invoiceApi";
import { usePaginatedList } from "../../utils/usePaginatedList";
import { formatMoney } from "../../utils/money";
import { InvoiceStatusBadge, FbrStatusBadge } from "./InvoiceStatusBadges";
import type { Invoice } from "../../types/invoice";

export function InvoicesList() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = usePaginatedList(invoiceApi.list, {
    status: status || undefined,
    page,
    limit: 20,
  });

  const columns: Column<Invoice>[] = [
    {
      header: "Invoice #",
      cell: (inv) => (
        <Link to={`/invoices/${inv._id}`} className="font-medium text-brand-700 hover:underline">
          {inv.invoiceNumber}
        </Link>
      ),
    },
    {
      header: "Customer",
      cell: (inv) => (typeof inv.customerId === "object" ? inv.customerId.name : "—"),
    },
    { header: "Date", cell: (inv) => new Date(inv.invoiceDate).toLocaleDateString() },
    { header: "Total", cell: (inv) => formatMoney(inv.totalMinor) },
    { header: "FBR Status", cell: (inv) => <FbrStatusBadge status={inv.fbrStatus} /> },
    { header: "Status", cell: (inv) => <InvoiceStatusBadge status={inv.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Create and manage customer invoices"
        actions={<Button onClick={() => navigate("/invoices/new")}>New Invoice</Button>}
      />

      <div className="mb-4 max-w-xs">
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="READY_FOR_SUBMISSION">Ready for Submission</option>
          <option value="SUBMITTING">Submitting</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="FAILED">Failed</option>
        </Select>
      </div>

      {isLoading && <LoadingState />}
      {!isLoading && error && <ErrorState message={error} />}
      {!isLoading && !error && data && data.items.length === 0 && (
        <EmptyState
          icon={<DocsIcon />}
          title="No invoices yet"
          description="Create your first invoice to start billing customers."
          action={
            <Link to="/invoices/new">
              <Button>New Invoice</Button>
            </Link>
          }
        />
      )}
      {!isLoading && !error && data && data.items.length > 0 && (
        <>
          <Table columns={columns} rows={data.items} rowKey={(inv) => inv._id} />
          <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
