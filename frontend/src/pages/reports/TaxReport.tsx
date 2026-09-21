import { useEffect, useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { Table, type Column } from "../../components/Table";
import { EmptyState } from "../../components/EmptyState";
import { PieChartIcon } from "../../icons";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { DateRangeFilter, type DateRangeValue } from "./DateRangeFilter";
import { reportApi } from "../../services/api/reportApi";
import { extractErrorMessage } from "../../services/api/http";
import { formatMoney } from "../../utils/money";
import type { TaxReportRow } from "../../types/report";

export function TaxReport() {
  const [filter, setFilter] = useState<DateRangeValue>({ range: "month", from: "", to: "" });
  const [rows, setRows] = useState<TaxReportRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    reportApi
      .getTax(filter.range === "custom" ? { range: "custom", from: filter.from, to: filter.to } : { range: filter.range })
      .then((res) => setRows(res.rows))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [filter]);

  const columns: Column<TaxReportRow>[] = [
    { header: "Date", cell: (r) => r.date },
    { header: "Invoices", cell: (r) => r.invoiceCount },
    { header: "Taxable Amount", cell: (r) => formatMoney(r.taxableAmountMinor) },
    { header: "Tax", cell: (r) => formatMoney(r.taxMinor) },
  ];

  return (
    <div>
      <PageHeader title="Tax Report" description="Taxable amount and tax collected by day" />
      <DateRangeFilter value={filter} onChange={setFilter} />

      {isLoading && <LoadingState />}
      {!isLoading && error && <ErrorState message={error} />}
      {!isLoading && !error && rows && rows.length === 0 && <EmptyState title="No tax data for this range" icon={<PieChartIcon />} />}
      {!isLoading && !error && rows && rows.length > 0 && <Table columns={columns} rows={rows} rowKey={(r) => r.date} />}
    </div>
  );
}
