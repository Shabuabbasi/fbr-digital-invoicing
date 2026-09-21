import { useEffect, useState } from "react";
import { Card } from "../../components/Card";
import { Select } from "../../components/Select";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { customerApi } from "../../services/api/customerApi";
import { productApi } from "../../services/api/productApi";
import { formatMoney } from "../../utils/money";
import type { Customer } from "../../types/customer";
import type { Product } from "../../types/product";
import type { Invoice, InvoiceInput, InvoiceItemInput } from "../../types/invoice";

interface LineItemRow {
  productId: string;
  quantity: string;
  discountRupees: string;
}

function emptyRow(): LineItemRow {
  return { productId: "", quantity: "1", discountRupees: "0" };
}

export function InvoiceForm({
  initial,
  onSubmit,
  isSubmitting,
}: {
  initial?: Invoice;
  onSubmit: (input: InvoiceInput) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState(
    typeof initial?.customerId === "object" ? initial.customerId._id : (initial?.customerId ?? ""),
  );
  const [rows, setRows] = useState<LineItemRow[]>(
    initial
      ? initial.items.map((item) => ({
          productId: item.productId,
          quantity: String(item.quantity),
          discountRupees: (item.discountMinor / 100).toString(),
        }))
      : [emptyRow()],
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    customerApi.list({ isActive: true, limit: 100 }).then((res) => setCustomers(res.items));
    productApi.list({ isActive: true, limit: 100 }).then((res) => setProducts(res.items));
  }, []);

  const productMap = new Map(products.map((p) => [p._id, p]));

  function updateRow(index: number, patch: Partial<LineItemRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  // Client-side estimate for UX responsiveness only — the backend recalculates
  // authoritatively from the Product record on save. See docs/API.md "Invoices".
  const estimate = rows.reduce(
    (acc, row) => {
      const product = productMap.get(row.productId);
      if (!product) return acc;
      const quantity = Number(row.quantity) || 0;
      const discountMinor = Math.round((Number(row.discountRupees) || 0) * 100);
      const lineSubtotal = Math.round(quantity * product.salePriceMinor);
      const afterDiscount = Math.max(0, lineSubtotal - discountMinor);
      const tax = Math.round((afterDiscount * product.taxRateBasisPoints) / 10000);
      return {
        subtotal: acc.subtotal + lineSubtotal,
        discount: acc.discount + discountMinor,
        tax: acc.tax + tax,
        total: acc.total + afterDiscount + tax,
      };
    },
    { subtotal: 0, discount: 0, tax: 0, total: 0 },
  );

  async function handleSubmit() {
    setError(null);

    if (!customerId) {
      setError("Please select a customer.");
      return;
    }
    const items: InvoiceItemInput[] = [];
    for (const row of rows) {
      if (!row.productId) continue;
      const quantity = Number(row.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        setError("Each line item needs a valid quantity.");
        return;
      }
      items.push({
        productId: row.productId,
        quantity,
        discountMinor: Math.round((Number(row.discountRupees) || 0) * 100),
      });
    }
    if (items.length === 0) {
      setError("Add at least one line item.");
      return;
    }

    await onSubmit({ customerId, items });
  }

  return (
    <Card className="max-w-4xl">
      <div className="flex flex-col gap-4">
        <Select id="customer" label="Customer" required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">Select a customer...</option>
          {customers.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name} {c.businessName ? `(${c.businessName})` : ""}
            </option>
          ))}
        </Select>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Line Items</p>
          <div className="flex flex-col gap-3">
            {rows.map((row, index) => {
              const product = productMap.get(row.productId);
              return (
                <div
                  key={index}
                  className="grid grid-cols-2 items-end gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-800 sm:grid-cols-12 sm:gap-2"
                >
                  <div className="col-span-2 sm:col-span-5">
                    <Select
                      label="Product"
                      value={row.productId}
                      onChange={(e) => updateRow(index, { productId: e.target.value })}
                    >
                      <option value="">Select a product...</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.sku}) — {formatMoney(p.salePriceMinor)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <Input
                      label="Qty"
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={row.quantity}
                      onChange={(e) => updateRow(index, { quantity: e.target.value })}
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <Input
                      label="Discount (PKR)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.discountRupees}
                      onChange={(e) => updateRow(index, { discountRupees: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2 text-sm text-gray-500 dark:text-gray-400 sm:col-span-2">
                    {product ? `Tax: ${(product.taxRateBasisPoints / 100).toFixed(2)}%` : ""}
                  </div>
                  <div className="col-span-2 flex justify-end sm:col-span-1">
                    <button type="button" onClick={() => removeRow(index)} className="text-error-600 hover:underline dark:text-error-400">
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <Button type="button" variant="secondary" className="mt-3" onClick={addRow}>
            Add Line Item
          </Button>
        </div>

        <div className="ml-auto w-full max-w-xs rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-white/5 dark:text-gray-300">
          <div className="flex justify-between py-1">
            <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
            <span>{formatMoney(estimate.subtotal)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500 dark:text-gray-400">Discount</span>
            <span>-{formatMoney(estimate.discount)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500 dark:text-gray-400">Tax</span>
            <span>{formatMoney(estimate.tax)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 py-2 font-semibold text-gray-800 dark:border-gray-700 dark:text-white/90">
            <span>Estimated Total</span>
            <span>{formatMoney(estimate.total)}</span>
          </div>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Final totals are calculated by the server on save.</p>
        </div>

        {error && <p className="text-sm text-error-600 dark:text-error-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            {initial ? "Save Changes" : "Create Invoice"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
