import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Table, type Column } from "../../components/Table";
import { Badge } from "../../components/Badge";
import { EmptyState } from "../../components/EmptyState";
import { BoxIconLine } from "../../icons";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { Pagination } from "../../components/Pagination";
import { ConfirmDialog } from "../../components/Modal";
import { productApi } from "../../services/api/productApi";
import { usePaginatedList } from "../../utils/usePaginatedList";
import { formatMoney } from "../../utils/money";
import { useAuth } from "../../context/AuthContext";
import { canAccess } from "../../utils/rbac";
import { useToast } from "../../context/ToastContext";
import type { Product } from "../../types/product";

export function ProductsList() {
  const { user } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deactivateTarget, setDeactivateTarget] = useState<Product | null>(null);

  const { data, isLoading, error, reload } = usePaginatedList(productApi.list, { search, page, limit: 20 });
  const canManage = user ? canAccess(user.role, "products.write") : false;

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    try {
      await productApi.deactivate(deactivateTarget._id);
      show("Product deactivated", "success");
      setDeactivateTarget(null);
      reload();
    } catch {
      show("Failed to deactivate product", "error");
    }
  }

  const columns: Column<Product>[] = [
    { header: "Name", cell: (p) => <span className="font-medium text-gray-800 dark:text-white/90">{p.name}</span> },
    { header: "SKU", cell: (p) => p.sku },
    { header: "Unit", cell: (p) => p.unit },
    { header: "Price", cell: (p) => formatMoney(p.salePriceMinor) },
    { header: "Tax Rate", cell: (p) => `${(p.taxRateBasisPoints / 100).toFixed(2)}%` },
    { header: "Status", cell: (p) => <Badge tone={p.isActive ? "green" : "gray"}>{p.isActive ? "Active" : "Inactive"}</Badge> },
    {
      header: "",
      cell: (p) =>
        canManage && (
          <div className="flex justify-end gap-3">
            <button onClick={() => navigate(`/products/${p._id}/edit`)} className="text-brand-600 hover:underline">
              Edit
            </button>
            {p.isActive && (
              <button onClick={() => setDeactivateTarget(p)} className="text-error-600 hover:underline dark:text-error-400">
                Deactivate
              </button>
            )}
          </div>
        ),
      className: "px-4 py-3 text-right",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage the products and services you sell"
        actions={canManage && <Button onClick={() => navigate("/products/new")}>New Product</Button>}
      />

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search by name or SKU..."
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
          icon={<BoxIconLine />}
          title="No products yet"
          description="Add your first product to start creating invoices."
          action={canManage && <Link to="/products/new"><Button>New Product</Button></Link>}
        />
      )}
      {!isLoading && !error && data && data.items.length > 0 && (
        <>
          <Table columns={columns} rows={data.items} rowKey={(p) => p._id} />
          <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} />
        </>
      )}

      <ConfirmDialog
        isOpen={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        title="Deactivate product"
        description={`"${deactivateTarget?.name}" will be hidden from new invoices but existing invoices are unaffected.`}
        confirmLabel="Deactivate"
      />
    </div>
  );
}
