import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { ProductForm } from "./ProductForm";
import { productApi } from "../../services/api/productApi";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../services/api/http";
import type { ProductInput } from "../../types/product";

export function ProductNew() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(input: ProductInput) {
    setIsSubmitting(true);
    try {
      await productApi.create(input);
      show("Product created", "success");
      navigate("/products");
    } catch (err) {
      show(extractErrorMessage(err), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="New Product" />
      <ProductForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
