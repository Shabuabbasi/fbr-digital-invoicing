import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { invoiceApi } from "../../services/api/invoiceApi";
import { extractErrorMessage } from "../../services/api/http";
import { formatMoney } from "../../utils/money";
import type { Invoice } from "../../types/invoice";

export function InvoicePrint() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    invoiceApi
      .get(id)
      .then(setInvoice)
      .catch((err) => setError(extractErrorMessage(err)));
  }, [id]);

  if (error) return <ErrorState message={error} />;
  if (!invoice) return <LoadingState />;

  const customerName = typeof invoice.customerId === "object" ? invoice.customerId.name : "";

  return (
    <div className="mx-auto max-w-3xl bg-white p-6 text-gray-900 sm:p-10 print:p-0">
      <div className="mb-2 flex items-center justify-end gap-2 print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Print / Save as PDF
        </button>
      </div>

      <div className="mb-8 flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-start sm:justify-between print:flex-row">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              I
            </div>
            <p className="font-semibold text-gray-900">Intelgency IT Solutions</p>
          </div>
          <p className="text-sm text-gray-500">Intelgency Digital Invoicing</p>
        </div>
        <div className="sm:text-right print:text-right">
          <h1 className="text-lg font-semibold">Invoice {invoice.invoiceNumber}</h1>
          <p className="text-sm text-gray-500">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
          {invoice.fbrReferenceNumber && (
            <p className="mt-1 text-xs text-gray-500">FBR Ref: {invoice.fbrReferenceNumber}</p>
          )}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-8 text-sm sm:grid-cols-2 print:grid-cols-2">
        <div>
          <p className="mb-1 font-medium text-gray-500">Seller</p>
          <p className="font-medium text-gray-900">{invoice.sellerSnapshot.name}</p>
          {invoice.sellerSnapshot.ntn && <p>NTN: {invoice.sellerSnapshot.ntn}</p>}
          {invoice.sellerSnapshot.strn && <p>STRN: {invoice.sellerSnapshot.strn}</p>}
          {invoice.sellerSnapshot.address && <p>{invoice.sellerSnapshot.address}</p>}
        </div>
        <div>
          <p className="mb-1 font-medium text-gray-500">Bill To</p>
          <p className="font-medium text-gray-900">{invoice.buyerSnapshot.name || customerName}</p>
          {invoice.buyerSnapshot.ntn && <p>NTN: {invoice.buyerSnapshot.ntn}</p>}
          {invoice.buyerSnapshot.cnic && <p>CNIC: {invoice.buyerSnapshot.cnic}</p>}
          {invoice.buyerSnapshot.address && <p>{invoice.buyerSnapshot.address}</p>}
        </div>
      </div>

      <div className="mb-6 overflow-x-auto print:overflow-visible">
      <table className="w-full min-w-120 text-sm sm:min-w-0 print:min-w-0">
        <thead>
          <tr className="border-b border-gray-300 text-left text-gray-500">
            <th className="py-2">Item</th>
            <th className="py-2">Qty</th>
            <th className="py-2">Unit Price</th>
            <th className="py-2">Discount</th>
            <th className="py-2">Tax</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-2">{item.productName}</td>
              <td className="py-2">{item.quantity}</td>
              <td className="py-2">{formatMoney(item.unitPriceMinor)}</td>
              <td className="py-2">{formatMoney(item.discountMinor)}</td>
              <td className="py-2">{formatMoney(item.taxMinor)}</td>
              <td className="py-2 text-right">{formatMoney(item.lineTotalMinor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <div className="ml-auto w-full max-w-xs text-sm">
        <div className="flex justify-between py-1">
          <span className="text-gray-500">Subtotal</span>
          <span>{formatMoney(invoice.subtotalMinor)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-gray-500">Discount</span>
          <span>-{formatMoney(invoice.discountMinor)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-gray-500">Tax</span>
          <span>{formatMoney(invoice.taxMinor)}</span>
        </div>
        <div className="flex justify-between border-t border-gray-300 py-2 text-base font-semibold">
          <span>Total</span>
          <span>{formatMoney(invoice.totalMinor)}</span>
        </div>
      </div>

      <p className="mt-10 text-center text-xs text-gray-400">
        Generated by Intelgency Digital Invoicing — Intelgency IT Solutions
      </p>
    </div>
  );
}
