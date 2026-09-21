import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { Table, type Column } from "../../components/Table";
import { EmptyState } from "../../components/EmptyState";
import { PlugInIcon } from "../../icons";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { Pagination } from "../../components/Pagination";
import { Badge } from "../../components/Badge";
import { fbrApi } from "../../services/api/fbrApi";
import { usePaginatedList } from "../../utils/usePaginatedList";
import type { FbrSubmission } from "../../types/fbr";

export function FbrSubmissionsList({ title, description, useLogsEndpoint }: { title: string; description: string; useLogsEndpoint?: boolean }) {
  const [page, setPage] = useState(1);
  const fetcher = useLogsEndpoint ? fbrApi.listLogs : fbrApi.listSubmissions;
  const { data, isLoading, error } = usePaginatedList(fetcher, { page, limit: 20 });

  const columns: Column<FbrSubmission>[] = [
    {
      header: "Invoice",
      cell: (s) => (
        <Link to={`/invoices/${s.invoiceId}`} className="text-brand-700 hover:underline">
          View invoice
        </Link>
      ),
    },
    { header: "Attempt", cell: (s) => `#${s.attemptNumber}` },
    { header: "Environment", cell: (s) => s.environment },
    { header: "Requested At", cell: (s) => new Date(s.requestedAt).toLocaleString() },
    {
      header: "Result",
      cell: (s) =>
        s.errorCode ? (
          <Badge tone="red">{s.errorCode}</Badge>
        ) : s.fbrResponseStatus ? (
          <Badge tone="green">{s.fbrResponseStatus}</Badge>
        ) : (
          <Badge tone="gray">Pending</Badge>
        ),
    },
    { header: "FBR Reference", cell: (s) => s.fbrReferenceNumber ?? "—" },
    { header: "Message", cell: (s) => s.errorMessage ?? "—", className: "px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs truncate" },
  ];

  return (
    <div>
      <PageHeader title={title} description={description} />
      {isLoading && <LoadingState />}
      {!isLoading && error && <ErrorState message={error} />}
      {!isLoading && !error && data && data.items.length === 0 && (
        <EmptyState title="No FBR submissions yet" description="Submissions will appear here once invoices are sent to FBR." icon={<PlugInIcon />} />
      )}
      {!isLoading && !error && data && data.items.length > 0 && (
        <>
          <Table columns={columns} rows={data.items} rowKey={(s) => s._id} />
          <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
