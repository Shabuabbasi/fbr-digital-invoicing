import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { ProductForm } from "./ProductForm";
import { productApi } from "../../services/api/productApi";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../services/api/http";
import type { Product, ProductInput } from "../../types/product";

export function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    productApi
      .get(id)
      .then(setProduct)
      .catch((err) => setError(extractErrorMessage(err)));
  }, [id]);

  async function handleSubmit(input: ProductInput) {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await productApi.update(id, input);
      show("Product updated", "success");
      navigate("/products");
    } catch (err) {
      show(extractErrorMessage(err), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Edit Product" />
      {error && <ErrorState message={error} />}
      {!error && !product && <LoadingState />}
      {!error && product && <ProductForm initial={product} onSubmit={handleSubmit} isSubmitting={isSubmitting} />}
    </div>
  );
}
