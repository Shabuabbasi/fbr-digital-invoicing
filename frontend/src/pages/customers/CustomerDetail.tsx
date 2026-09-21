import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { CustomerForm } from "./CustomerForm";
import { customerApi } from "../../services/api/customerApi";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../services/api/http";
import type { Customer, CustomerInput } from "../../types/customer";

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { show } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    customerApi
      .get(id)
      .then(setCustomer)
      .catch((err) => setError(extractErrorMessage(err)));
  }, [id]);

  async function handleSubmit(input: CustomerInput) {
    if (!id) return;
    setIsSubmitting(true);
    try {
      const updated = await customerApi.update(id, input);
      setCustomer(updated);
      setIsEditing(false);
      show("Customer updated", "success");
    } catch (err) {
      show(extractErrorMessage(err), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={customer?.name ?? "Customer"}
        actions={
          customer &&
          !isEditing && (
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )
        }
      />
      {error && <ErrorState message={error} />}
      {!error && !customer && <LoadingState />}
      {!error && customer && (
        <CustomerForm
          key={isEditing ? "edit" : "view"}
          initial={customer}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          readOnly={!isEditing}
        />
      )}
    </div>
  );
}
