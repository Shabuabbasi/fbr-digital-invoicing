import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Table, type Column } from "../../components/Table";
import { Badge } from "../../components/Badge";
import { EmptyState } from "../../components/EmptyState";
import { GroupIcon } from "../../icons";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { Pagination } from "../../components/Pagination";
import { ConfirmDialog } from "../../components/Modal";
import { customerApi } from "../../services/api/customerApi";
import { usePaginatedList } from "../../utils/usePaginatedList";
import { useAuth } from "../../context/AuthContext";
import { canAccess } from "../../utils/rbac";
import { useToast } from "../../context/ToastContext";
import type { Customer } from "../../types/customer";

export function CustomersList() {
  const { user } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deactivateTarget, setDeactivateTarget] = useState<Customer | null>(null);

  const { data, isLoading, error, reload } = usePaginatedList(customerApi.list, { search, page, limit: 20 });
  const canDeactivate = user ? canAccess(user.role, "customers.delete") : false;

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    try {
      await customerApi.deactivate(deactivateTarget._id);
      show("Customer deactivated", "success");
      setDeactivateTarget(null);
      reload();
    } catch {
      show("Failed to deactivate customer", "error");
    }
  }

  const columns: Column<Customer>[] = [
    {
      header: "Name",
      cell: (c) => (
        <Link to={`/customers/${c._id}`} className="font-medium text-brand-700 hover:underline">
          {c.name}
        </Link>
      ),
    },
    { header: "Business", cell: (c) => c.businessName || "—" },
    { header: "Type", cell: (c) => c.customerType },
    { header: "Phone", cell: (c) => c.phone || "—" },
    { header: "Status", cell: (c) => <Badge tone={c.isActive ? "green" : "gray"}>{c.isActive ? "Active" : "Inactive"}</Badge> },
    {
      header: "",
      cell: (c) =>
        canDeactivate &&
        c.isActive && (
          <div className="flex justify-end">
            <button onClick={() => setDeactivateTarget(c)} className="text-error-600 hover:underline dark:text-error-400">
              Deactivate
            </button>
          </div>
        ),
      className: "px-4 py-3 text-right",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage the customers you invoice"
        actions={<Button onClick={() => navigate("/customers/new")}>New Customer</Button>}
      />

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search by name or business..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {isLoading && <LoadingState />}
      {!isLoading && error && <ErrorState message={error} />}
      {!isLoading && !error && data && data.items.length === 0 && (
        <EmptyState
          icon={<GroupIcon />}
          title="No customers yet"
          description="Add your first customer to start creating invoices."
          action={
            <Link to="/customers/new">
              <Button>New Customer</Button>
            </Link>
          }
        />
      )}
      {!isLoading && !error && data && data.items.length > 0 && (
        <>
          <Table columns={columns} rows={data.items} rowKey={(c) => c._id} />
          <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} />
        </>
      )}

      <ConfirmDialog
        isOpen={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        title="Deactivate customer"
        description={`"${deactivateTarget?.name}" will no longer be selectable on new invoices.`}
        confirmLabel="Deactivate"
      />
    </div>
  );
}
