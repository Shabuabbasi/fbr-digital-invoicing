import { buildFbrPayload } from "./fbr.mapper";
import type { InvoiceDocument } from "../../models/Invoice";
import type { HydratedDocument } from "mongoose";

function makeInvoice(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    invoiceDate: new Date("2026-03-15T00:00:00.000Z"),
    sellerSnapshot: { name: "Acme Ltd", ntn: "1234567", strn: "", address: "Karachi", province: "Sindh" },
    buyerSnapshot: { name: "Buyer Co", ntn: "7654321", strn: "", cnic: "", address: "Lahore", province: "Punjab" },
    items: [
      {
        productId: "p1",
        productName: "Widget",
        hsCode: "0101.2100",
        unit: "Numbers, pieces, units",
        quantity: 2,
        unitPriceMinor: 150000,
        discountMinor: 0,
        taxRateBasisPoints: 1800,
        taxMinor: 54000,
        lineTotalMinor: 354000,
      },
    ],
    ...overrides,
  } as unknown as HydratedDocument<InvoiceDocument>;
}

describe("buildFbrPayload", () => {
  it("maps seller/buyer/item fields to FBR's real field names", () => {
    const payload = buildFbrPayload(makeInvoice(), "SANDBOX");

    expect(payload.invoiceType).toBe("Sale Invoice");
    expect(payload.invoiceDate).toBe("2026-03-15");
    expect(payload.sellerNTNCNIC).toBe("1234567");
    expect(payload.sellerBusinessName).toBe("Acme Ltd");
    expect(payload.sellerProvince).toBe("Sindh");
    expect(payload.buyerNTNCNIC).toBe("7654321");
    expect(payload.buyerProvince).toBe("Punjab");

    const item = payload.items[0];
    expect(item.hsCode).toBe("0101.2100");
    expect(item.uoM).toBe("Numbers, pieces, units");
    expect(item.rate).toBe("18%");
    expect(item.quantity).toBe(2);
    expect(item.valueSalesExcludingST).toBe(3000); // 300000 minor -> 3000.00 rupees
    expect(item.salesTaxApplicable).toBe(540); // 54000 minor -> 540.00 rupees
    expect(item.totalValues).toBe(3540); // 354000 minor -> 3540.00 rupees
  });

  it("marks a registered buyer (has NTN) and includes scenarioId SN001 in sandbox", () => {
    const payload = buildFbrPayload(makeInvoice(), "SANDBOX");
    expect(payload.buyerRegistrationType).toBe("Registered");
    expect(payload.scenarioId).toBe("SN001");
  });

  it("marks an unregistered buyer (no NTN/STRN) and uses scenarioId SN002", () => {
    const invoice = makeInvoice({
      buyerSnapshot: { name: "Walk-in", ntn: "", strn: "", cnic: "3520112345671", address: "Lahore", province: "Punjab" },
    });
    const payload = buildFbrPayload(invoice, "SANDBOX");
    expect(payload.buyerRegistrationType).toBe("Unregistered");
    expect(payload.buyerNTNCNIC).toBe("3520112345671"); // falls back to CNIC
    expect(payload.scenarioId).toBe("SN002");
  });

  it("omits scenarioId in production (sandbox-only field per FBR spec)", () => {
    const payload = buildFbrPayload(makeInvoice(), "PRODUCTION");
    expect(payload.scenarioId).toBeUndefined();
  });

  it("computes discount in rupees from discountMinor", () => {
    const invoice = makeInvoice({
      items: [
        {
          productId: "p1",
          productName: "Widget",
          hsCode: "0101.2100",
          unit: "Numbers, pieces, units",
          quantity: 1,
          unitPriceMinor: 100000,
          discountMinor: 10000,
          taxRateBasisPoints: 1000,
          taxMinor: 9000,
          lineTotalMinor: 99000,
        },
      ],
    });
    const payload = buildFbrPayload(invoice, "SANDBOX");
    expect(payload.items[0].discount).toBe(100); // 10000 minor -> 100.00 rupees
    expect(payload.items[0].valueSalesExcludingST).toBe(900); // (100000-10000)/100
  });

  it("uses scenarioId SN019 and saleType 'Services' for a SERVICES company regardless of buyer registration", () => {
    const registered = buildFbrPayload(makeInvoice(), "SANDBOX", "SERVICES");
    expect(registered.scenarioId).toBe("SN019");
    expect(registered.items[0].saleType).toBe("Services");

    const unregistered = buildFbrPayload(
      makeInvoice({
        buyerSnapshot: { name: "Walk-in", ntn: "", strn: "", cnic: "3520112345671", address: "Lahore", province: "Punjab" },
      }),
      "SANDBOX",
      "SERVICES",
    );
    expect(unregistered.scenarioId).toBe("SN019");
  });
});
