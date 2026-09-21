import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { PageHeader } from "../../components/PageHeader";
import { Card, StatCard } from "../../components/Card";
import { Table, type Column } from "../../components/Table";
import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { InvoiceStatusBadge, FbrStatusBadge } from "../invoices/InvoiceStatusBadges";
import { reportApi } from "../../services/api/reportApi";
import { extractErrorMessage } from "../../services/api/http";
import { formatMoney } from "../../utils/money";
import { useTheme } from "../../context/ThemeContext";
import { DollarLineIcon, DocsIcon, CheckCircleIcon, TimeIcon, ErrorIcon, PieChartIcon } from "../../icons";
import type { DashboardSummary } from "../../types/report";

const FBR_COLORS = { submitted: "#12b76a", pending: "#f79009", failed: "#f04438" };

export function Dashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const gridStroke = theme === "dark" ? "#293145" : "#eee";
  const tickColor = theme === "dark" ? "#9ca3af" : "#374151";

  useEffect(() => {
    reportApi
      .getDashboard()
      .then(setData)
      .catch((err) => setError(extractErrorMessage(err)));
  }, []);

  const columns: Column<DashboardSummary["recentInvoices"][number]>[] = [
    {
      header: "Invoice #",
      cell: (inv) => (
        <Link to={`/invoices/${inv._id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-400">
          {inv.invoiceNumber}
        </Link>
      ),
    },
    { header: "Customer", cell: (inv) => inv.customerId?.name ?? "—" },
    { header: "Date", cell: (inv) => new Date(inv.invoiceDate).toLocaleDateString() },
    { header: "Total", cell: (inv) => formatMoney(inv.totalMinor) },
    { header: "FBR Status", cell: (inv) => <FbrStatusBadge status={inv.fbrStatus} /> },
    { header: "Status", cell: (inv) => <InvoiceStatusBadge status={inv.status} /> },
  ];

  const fbrTotal = data ? data.fbrSubmitted + data.fbrPending + data.fbrFailed : 0;
  const fbrPieData = data
    ? [
        { name: "Submitted", value: data.fbrSubmitted, color: FBR_COLORS.submitted },
        { name: "Pending", value: data.fbrPending, color: FBR_COLORS.pending },
        { name: "Failed", value: data.fbrFailed, color: FBR_COLORS.failed },
      ]
    : [];

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your invoicing activity" />

      {error && <ErrorState message={error} />}
      {!error && !data && <LoadingState />}

      {!error && data && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Total Sales" value={formatMoney(data.totalSalesMinor)} icon={<DollarLineIcon />} tone="brand" />
            <StatCard label="Total Invoices" value={data.totalInvoices} icon={<DocsIcon />} tone="brand" />
            <StatCard label="FBR Submitted" value={data.fbrSubmitted} icon={<CheckCircleIcon />} tone="success" />
            <StatCard label="FBR Pending" value={data.fbrPending} icon={<TimeIcon />} tone="warning" />
            <StatCard label="FBR Failed" value={data.fbrFailed} icon={<ErrorIcon />} tone="error" />
            <StatCard label="Total Tax" value={formatMoney(data.totalTaxMinor)} icon={<PieChartIcon />} tone="brand" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <p className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">Sales Overview (last 30 days)</p>
              {data.salesOverview.length === 0 ? (
                <EmptyState title="No sales data yet" />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={data.salesOverview.map((d) => ({ date: d.date, total: d.totalMinor / 100 }))}>
                    <defs>
                      <linearGradient id="salesLine" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#465fff" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#465fff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: tickColor }} />
                    <YAxis tick={{ fontSize: 11, fill: tickColor }} />
                    <Tooltip formatter={(value) => [`Rs. ${Number(value).toLocaleString()}`, "Sales"]} />
                    <Line type="monotone" dataKey="total" stroke="#465fff" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card>
              <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">FBR Status Overview</p>
              {fbrTotal === 0 ? (
                <EmptyState title="No submissions yet" />
              ) : (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={120} height={120}>
                    <PieChart>
                      <Pie data={fbrPieData} dataKey="value" innerRadius={38} outerRadius={56} paddingAngle={2} stroke="none">
                        {fbrPieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-1 flex-col gap-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: FBR_COLORS.submitted }} />
                        Submitted
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-white/90">{data.fbrSubmitted}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: FBR_COLORS.pending }} />
                        Pending
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-white/90">{data.fbrPending}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: FBR_COLORS.failed }} />
                        Failed
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-white/90">{data.fbrFailed}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Recent Invoices</p>
            {data.recentInvoices.length === 0 ? (
              <EmptyState
                title="No invoices yet"
                description="Create your first invoice to see recent activity here."
                action={
                  <Link to="/invoices/new">
                    <span className="text-brand-600 hover:underline dark:text-brand-400">Create Invoice</span>
                  </Link>
                }
              />
            ) : (
              <Table columns={columns} rows={data.recentInvoices} rowKey={(inv) => inv._id} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
