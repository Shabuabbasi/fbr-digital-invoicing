import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { CustomerForm } from "./CustomerForm";
import { customerApi } from "../../services/api/customerApi";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../services/api/http";
import type { CustomerInput } from "../../types/customer";

export function CustomerNew() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(input: CustomerInput) {
    setIsSubmitting(true);
    try {
      const customer = await customerApi.create(input);
      show("Customer created", "success");
      navigate(`/customers/${customer._id}`);
    } catch (err) {
      show(extractErrorMessage(err), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="New Customer" />
      <CustomerForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
