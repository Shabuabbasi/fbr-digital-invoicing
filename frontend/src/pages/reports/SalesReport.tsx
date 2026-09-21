import { useEffect, useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/Card";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { DateRangeFilter, type DateRangeValue } from "./DateRangeFilter";
import { reportApi } from "../../services/api/reportApi";
import { extractErrorMessage } from "../../services/api/http";
import { formatMoney } from "../../utils/money";
import { DocsIcon, DollarLineIcon, ArrowDownIcon, PieChartIcon, CheckCircleIcon } from "../../icons";
import type { SalesReport as SalesReportData } from "../../types/report";

export function SalesReport() {
  const [filter, setFilter] = useState<DateRangeValue>({ range: "month", from: "", to: "" });
  const [data, setData] = useState<SalesReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    reportApi
      .getSales(filter.range === "custom" ? { range: "custom", from: filter.from, to: filter.to } : { range: filter.range })
      .then(setData)
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [filter]);

  return (
    <div>
      <PageHeader title="Sales Report" description="Gross sales, tax, and discounts over time" />
      <DateRangeFilter value={filter} onChange={setFilter} />

      {isLoading && <LoadingState />}
      {!isLoading && error && <ErrorState message={error} />}
      {!isLoading && !error && data && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatCard label="Invoices" value={data.invoiceCount} icon={<DocsIcon />} tone="brand" />
          <StatCard label="Gross Sales" value={formatMoney(data.grossSalesMinor)} icon={<DollarLineIcon />} tone="brand" />
          <StatCard label="Discounts" value={formatMoney(data.discountMinor)} icon={<ArrowDownIcon />} tone="warning" />
          <StatCard label="Tax" value={formatMoney(data.taxMinor)} icon={<PieChartIcon />} tone="brand" />
          <StatCard label="Net Sales" value={formatMoney(data.netSalesMinor)} icon={<CheckCircleIcon />} tone="success" />
        </div>
      )}
    </div>
  );
}
