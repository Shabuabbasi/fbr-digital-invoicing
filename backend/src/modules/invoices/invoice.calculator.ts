import { applyTaxRate, roundHalfUpToMinorUnit } from "../../utils/money";

// The backend is the sole source of truth for invoice totals — the frontend's numbers
// are never trusted (see docs/API.md "Invoices"). All amounts are integer minor units (paisa).

export interface CalculatedItemInput {
  productId: string;
  productName: string;
  hsCode?: string;
  unit?: string;
  quantity: number;
  unitPriceMinor: number;
  discountMinor: number;
  taxRateBasisPoints: number;
}

export interface CalculatedItem extends CalculatedItemInput {
  taxMinor: number;
  lineTotalMinor: number;
}

export interface CalculatedInvoice {
  items: CalculatedItem[];
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
}

export function calculateInvoice(items: CalculatedItemInput[]): CalculatedInvoice {
  const calculatedItems: CalculatedItem[] = items.map((item) => {
    const lineSubtotal = roundHalfUpToMinorUnit(item.quantity * item.unitPriceMinor);
    const lineAfterDiscount = Math.max(0, lineSubtotal - item.discountMinor);
    const taxMinor = applyTaxRate(lineAfterDiscount, item.taxRateBasisPoints);
    const lineTotalMinor = lineAfterDiscount + taxMinor;

    return { ...item, taxMinor, lineTotalMinor };
  });

  const subtotalMinor = calculatedItems.reduce(
    (sum, item) => sum + roundHalfUpToMinorUnit(item.quantity * item.unitPriceMinor),
    0,
  );
  const discountMinor = calculatedItems.reduce((sum, item) => sum + item.discountMinor, 0);
  const taxMinor = calculatedItems.reduce((sum, item) => sum + item.taxMinor, 0);
  const totalMinor = subtotalMinor - discountMinor + taxMinor;

  return { items: calculatedItems, subtotalMinor, discountMinor, taxMinor, totalMinor };
}
