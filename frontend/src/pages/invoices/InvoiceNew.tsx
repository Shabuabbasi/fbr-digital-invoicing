import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { InvoiceForm } from "./InvoiceForm";
import { invoiceApi } from "../../services/api/invoiceApi";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../services/api/http";
import type { InvoiceInput } from "../../types/invoice";

export function InvoiceNew() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(input: InvoiceInput) {
    setIsSubmitting(true);
    try {
      const invoice = await invoiceApi.create(input);
      show("Invoice created", "success");
      navigate(`/invoices/${invoice._id}`);
    } catch (err) {
      show(extractErrorMessage(err), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="New Invoice" />
      <InvoiceForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
