import { calculateInvoice } from "./invoice.calculator";

describe("calculateInvoice", () => {
  it("computes subtotal, tax, and total for a single line item", () => {
    const result = calculateInvoice([
      {
        productId: "p1",
        productName: "Widget",
        quantity: 2,
        unitPriceMinor: 150000, // Rs. 1,500.00
        discountMinor: 0,
        taxRateBasisPoints: 1800, // 18%
      },
    ]);

    expect(result.subtotalMinor).toBe(300000); // Rs. 3,000.00
    expect(result.taxMinor).toBe(54000); // 18% of 3,000
    expect(result.discountMinor).toBe(0);
    expect(result.totalMinor).toBe(354000);
    expect(result.items[0].lineTotalMinor).toBe(354000);
  });

  it("applies line-level discount before computing tax", () => {
    const result = calculateInvoice([
      {
        productId: "p1",
        productName: "Widget",
        quantity: 1,
        unitPriceMinor: 100000,
        discountMinor: 10000,
        taxRateBasisPoints: 1000, // 10%
      },
    ]);

    // (100000 - 10000) * 10% = 9000
    expect(result.taxMinor).toBe(9000);
    expect(result.totalMinor).toBe(90000 + 9000);
  });

  it("sums multiple line items correctly", () => {
    const result = calculateInvoice([
      { productId: "p1", productName: "A", quantity: 1, unitPriceMinor: 100000, discountMinor: 0, taxRateBasisPoints: 1800 },
      { productId: "p2", productName: "B", quantity: 3, unitPriceMinor: 50000, discountMinor: 5000, taxRateBasisPoints: 0 },
    ]);

    expect(result.subtotalMinor).toBe(100000 + 150000);
    expect(result.discountMinor).toBe(5000);
    // item1 tax: 100000*18% = 18000; item2 tax: (150000-5000)*0% = 0
    expect(result.taxMinor).toBe(18000);
    expect(result.totalMinor).toBe(100000 + 150000 - 5000 + 18000);
  });

  it("rounds half-up to the nearest paisa", () => {
    const result = calculateInvoice([
      {
        productId: "p1",
        productName: "Odd rate",
        quantity: 1,
        unitPriceMinor: 333,
        discountMinor: 0,
        taxRateBasisPoints: 1750, // 17.5% of 333 = 58.275 -> rounds to 58
      },
    ]);

    expect(result.taxMinor).toBe(58);
    expect(result.totalMinor).toBe(391);
  });

  it("never produces a negative discounted line amount", () => {
    const result = calculateInvoice([
      {
        productId: "p1",
        productName: "Overdiscounted",
        quantity: 1,
        unitPriceMinor: 1000,
        discountMinor: 5000, // discount exceeds line subtotal
        taxRateBasisPoints: 1000,
      },
    ]);

    expect(result.items[0].taxMinor).toBe(0);
    expect(result.items[0].lineTotalMinor).toBe(0);
  });

  it("handles zero tax rate", () => {
    const result = calculateInvoice([
      { productId: "p1", productName: "Zero tax", quantity: 5, unitPriceMinor: 20000, discountMinor: 0, taxRateBasisPoints: 0 },
    ]);

    expect(result.taxMinor).toBe(0);
    expect(result.totalMinor).toBe(100000);
  });

  it("returns zeros for an empty item list", () => {
    const result = calculateInvoice([]);
    expect(result).toEqual({ items: [], subtotalMinor: 0, discountMinor: 0, taxMinor: 0, totalMinor: 0 });
  });
});
