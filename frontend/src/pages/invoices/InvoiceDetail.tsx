import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { InvoiceForm } from "./InvoiceForm";
import { InvoiceStatusBadge, FbrStatusBadge } from "./InvoiceStatusBadges";
import { invoiceApi } from "../../services/api/invoiceApi";
import { fbrApi } from "../../services/api/fbrApi";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../services/api/http";
import { formatMoney } from "../../utils/money";
import type { Invoice, InvoiceInput } from "../../types/invoice";

export function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { show } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  function load() {
    if (!id) return;
    invoiceApi
      .get(id)
      .then(setInvoice)
      .catch((err) => setError(extractErrorMessage(err)));
  }

  useEffect(load, [id]);

  async function handleSave(input: InvoiceInput) {
    if (!id) return;
    setIsBusy(true);
    try {
      const updated = await invoiceApi.update(id, input);
      setInvoice(updated);
      setIsEditing(false);
      show("Invoice updated", "success");
    } catch (err) {
      show(extractErrorMessage(err), "error");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleFinalize() {
    if (!id) return;
    setIsBusy(true);
    try {
      const updated = await invoiceApi.finalize(id);
      setInvoice(updated);
      show("Invoice finalized — ready for submission", "success");
    } catch (err) {
      show(extractErrorMessage(err), "error");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSubmitToFbr() {
    if (!id) return;
    setIsBusy(true);
    try {
      const updated = await invoiceApi.submitToFbr(id);
      setInvoice(updated);
      show("Submitted to FBR", "success");
    } catch (err) {
      show(extractErrorMessage(err), "error");
      for (let attempt = 0; attempt < 12; attempt += 1) {
        try {
          const status = await fbrApi.getInvoiceStatus(id);
          if (status.status !== "SUBMITTING") {
            load();
            break;
          }
        } catch {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } finally {
      setIsBusy(false);
    }
  }

  if (error) return <ErrorState message={error} />;
  if (!invoice) return <LoadingState />;

  const customerName =
    typeof invoice.customerId === "object" ? invoice.customerId.name : "—";

  if (isEditing) {
    return (
      <div>
        <PageHeader title={`Edit ${invoice.invoiceNumber}`} />
        <InvoiceForm
          initial={invoice}
          onSubmit={handleSave}
          isSubmitting={isBusy}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={invoice.invoiceNumber}
        description={`${customerName} · ${new Date(invoice.invoiceDate).toLocaleDateString()}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() =>
                invoiceApi.downloadPdf(invoice._id, invoice.invoiceNumber)
              }
            >
              Download PDF
            </Button>
            <Link to={`/invoices/${invoice._id}/print`}>
              <Button variant="secondary">Print</Button>
            </Link>
            {invoice.status === "DRAFT" && (
              <>
                <Button variant="secondary" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
                <Button onClick={handleFinalize} isLoading={isBusy}>
                  Finalize
                </Button>
              </>
            )}
            {(invoice.status === "READY_FOR_SUBMISSION" ||
              invoice.status === "FAILED") && (
              <Button onClick={handleSubmitToFbr} isLoading={isBusy}>
                Submit to FBR
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-4 flex gap-2">
        <InvoiceStatusBadge status={invoice.status} />
        <FbrStatusBadge status={invoice.fbrStatus} />
        {invoice.fbrReferenceNumber && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            FBR Ref: {invoice.fbrReferenceNumber}
          </span>
        )}
      </div>

      <Card className="max-w-4xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-120 text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th className="py-2">Product</th>
                <th className="py-2">Qty</th>
                <th className="py-2">Unit Price</th>
                <th className="py-2">Discount</th>
                <th className="py-2">Tax</th>
                <th className="py-2 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-100 text-gray-700 dark:border-gray-800 dark:text-gray-300"
                >
                  <td className="py-2">{item.productName}</td>
                  <td className="py-2">{item.quantity}</td>
                  <td className="py-2">{formatMoney(item.unitPriceMinor)}</td>
                  <td className="py-2">{formatMoney(item.discountMinor)}</td>
                  <td className="py-2">{formatMoney(item.taxMinor)}</td>
                  <td className="py-2 text-right">
                    {formatMoney(item.lineTotalMinor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ml-auto mt-4 w-full max-w-xs text-sm text-gray-700 dark:text-gray-300">
          <div className="flex justify-between py-1">
            <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
            <span>{formatMoney(invoice.subtotalMinor)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500 dark:text-gray-400">Discount</span>
            <span>-{formatMoney(invoice.discountMinor)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500 dark:text-gray-400">Tax</span>
            <span>{formatMoney(invoice.taxMinor)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 py-2 font-semibold text-gray-800 dark:border-gray-800 dark:text-white/90">
            <span>Total</span>
            <span>{formatMoney(invoice.totalMinor)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
