export interface Company {
  _id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  ntn: string;
  strn: string;
  businessType: string;
  invoicePrefix: string;
  fbrConfig: {
    environment: "SANDBOX" | "PRODUCTION";
    saleType: "GOODS" | "SERVICES" | "SERVICES_FED_ST";
    isConfigured: boolean;
  };
}

export type CompanyUpdateInput = Partial<
  Pick<
    Company,
    | "name"
    | "address"
    | "city"
    | "province"
    | "phone"
    | "email"
    | "ntn"
    | "strn"
    | "businessType"
    | "invoicePrefix"
  >
> & { fbrSaleType?: "GOODS" | "SERVICES" | "SERVICES_FED_ST" };

export interface FbrSettings {
  environment: "SANDBOX" | "PRODUCTION";
  saleType: "GOODS" | "SERVICES" | "SERVICES_FED_ST";
  isConfigured: boolean;
}
