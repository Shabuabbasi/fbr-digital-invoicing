import type { InvoiceDocument } from "../../models/Invoice";
import type { HydratedDocument } from "mongoose";
import type { FbrInvoicePayload } from "./fbr.types";

// Maps our Invoice to the real FBR Digital Invoicing payload — see docs/FBR-INTEGRATION.md
// and the official PRAL Technical Specification for DI API v1.12.
//
// A few fields aren't captured anywhere in our data model yet, so this makes documented MVP
// assumptions rather than inventing FBR behavior:
//   - saleType/scenarioId: which scenarios a business is even eligible for is determined by
//     the Business Nature/Sector chosen at IRIS registration (spec §9-10). This MVP supports
//     the two broad families every "default" registration falls into, selected via
//     company.fbrConfig.saleType:
//       GOODS    -> SN001 (registered buyer) / SN002 (unregistered buyer), "Goods at Standard
//                   Rate (default)". The buyer-registration split only applies here.
//       SERVICES -> SN019 ("Services rendered or provided"), saleType "Services". SN018 (the
//                   FED-in-ST-mode services variant) is not modeled by this MVP.
//     Sector-specific scenarios (steel, textile, telecom, cotton ginning, ...) aren't
//     supported yet. Only sent for SANDBOX — the API ignores/rejects it for PRODUCTION per
//     the spec.
//   - fixedNotifiedValueOrRetailPrice, salesTaxWithheldAtSource, extraTax, furtherTax,
//     fedPayable, sroScheduleNo, sroItemSerialNo: not tracked by this MVP, sent as 0/"".
function toDecimal(minorUnits: number): number {
  return Math.round(minorUnits) / 100;
}

function normalizeBuyerRegistrationNumber(value: string): string {
  return value.replace(/\D/g, "");
}

// FBR accepts only these exact province strings per the PRAL DI API reference:
// Punjab, Sindh, KPK, Balochistan, Islamabad, AJK, GB, FATA
// This map normalizes common aliases/typos that users or legacy data might have stored.
const PROVINCE_ALIAS_MAP: Record<string, string> = {
  "islamabad capital territory": "Islamabad",
  "ict": "Islamabad",
  "federal capital": "Islamabad",
  "khyber pakhtunkhwa": "KPK",
  "khyber-pakhtunkhwa": "KPK",
  "kp": "KPK",
  "nwfp": "KPK",
  "azad kashmir": "AJK",
  "azad jammu and kashmir": "AJK",
  "azad jammu & kashmir": "AJK",
  "gilgit baltistan": "GB",
  "gilgit-baltistan": "GB",
};

function normalizeFbrProvince(value: string): string {
  const trimmed = value.trim();
  return PROVINCE_ALIAS_MAP[trimmed.toLowerCase()] ?? trimmed;
}

function buyerRegistrationType(
  ntn: string,
  strn: string,
): "Registered" | "Unregistered" {
  return ntn || strn ? "Registered" : "Unregistered";
}

export function buildFbrPayload(
  invoice: HydratedDocument<InvoiceDocument>,
  environment: "SANDBOX" | "PRODUCTION",
  companySaleType: "GOODS" | "SERVICES" | "SERVICES_FED_ST" = "GOODS",
): FbrInvoicePayload {
  const regType = buyerRegistrationType(
    invoice.buyerSnapshot.ntn,
    invoice.buyerSnapshot.strn,
  );
  
  let scenarioId: string;
  let itemSaleType: string;
  
  if (companySaleType === "SERVICES") {
    scenarioId = "SN019";
    itemSaleType = "Services";
  } else if (companySaleType === "SERVICES_FED_ST") {
    scenarioId = "SN018";
    itemSaleType = "Services (FED in ST Mode)";
  } else {
    scenarioId = regType === "Registered" ? "SN001" : "SN002";
    itemSaleType = "Goods at Standard Rate (default)";
  }

  const buyerRegistrationNumber = normalizeBuyerRegistrationNumber(
    invoice.buyerSnapshot.ntn || invoice.buyerSnapshot.cnic,
  );

  return {
    invoiceType: "Sale Invoice",
    invoiceDate: invoice.invoiceDate.toISOString().slice(0, 10),
    sellerNTNCNIC: invoice.sellerSnapshot.ntn,
    sellerBusinessName: invoice.sellerSnapshot.name,
    sellerProvince: normalizeFbrProvince(invoice.sellerSnapshot.province),
    sellerAddress: invoice.sellerSnapshot.address,
    buyerNTNCNIC: buyerRegistrationNumber,
    buyerBusinessName: invoice.buyerSnapshot.name,
    buyerProvince: normalizeFbrProvince(invoice.buyerSnapshot.province),
    buyerAddress: invoice.buyerSnapshot.address,
    buyerRegistrationType: regType,
    invoiceRefNo: invoice.invoiceNumber ?? "",
    ...(environment === "SANDBOX" ? { scenarioId } : {}),
    items: invoice.items.map((item) => {
      const valueSalesExcludingST = toDecimal(
        item.unitPriceMinor * item.quantity - item.discountMinor,
      );
      return {
        hsCode: item.hsCode,
        productDescription: item.productName,
        rate: `${(item.taxRateBasisPoints / 100).toFixed(0)}%`,
        uoM: item.unit,
        quantity: item.quantity,
        totalValues: toDecimal(item.lineTotalMinor),
        valueSalesExcludingST,
        fixedNotifiedValueOrRetailPrice: 0,
        salesTaxApplicable: toDecimal(item.taxMinor),
        salesTaxWithheldAtSource: 0,
        extraTax: "",
        furtherTax: 0,
        sroScheduleNo: "",
        fedPayable: 0,
        discount: toDecimal(item.discountMinor),
        saleType: itemSaleType,
        sroItemSerialNo: "",
      };
    }),
  };
}
