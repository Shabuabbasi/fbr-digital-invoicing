import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { Button } from "../../components/Button";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { companyApi } from "../../services/api/companyApi";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../services/api/http";
import type { Company } from "../../types/company";

export function CompanySettings() {
  const { show } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    province: "",
    phone: "",
    email: "",
    ntn: "",
    strn: "",
    businessType: "",
    invoicePrefix: "",
    fbrSaleType: "GOODS" as "GOODS" | "SERVICES",
  });

  useEffect(() => {
    companyApi
      .get()
      .then((c) => {
        setCompany(c);
        setForm({
          name: c.name,
          address: c.address,
          city: c.city,
          province: c.province,
          phone: c.phone,
          email: c.email,
          ntn: c.ntn,
          strn: c.strn,
          businessType: c.businessType,
          invoicePrefix: c.invoicePrefix,
          fbrSaleType: c.fbrConfig.saleType,
        });
      })
      .catch((err) => setError(extractErrorMessage(err)));
  }, []);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updated = await companyApi.update(form);
      setCompany(updated);
      show("Company settings saved", "success");
    } catch (err) {
      show(extractErrorMessage(err), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Company Settings" description="Your business profile used on invoices and FBR submissions" />
      {error && <ErrorState message={error} />}
      {!error && !company && <LoadingState />}
      {!error && company && (
        <Card className="max-w-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input id="name" label="Business Name" required value={form.name} onChange={(e) => update("name", e.target.value)} />
            <Input id="address" label="Address" value={form.address} onChange={(e) => update("address", e.target.value)} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input id="city" label="City" value={form.city} onChange={(e) => update("city", e.target.value)} />
              <Select id="province" label="Province" value={form.province} onChange={(e) => update("province", e.target.value)}>
                <option value="">-- Select Province --</option>
                <option value="Punjab">Punjab</option>
                <option value="Sindh">Sindh</option>
                <option value="KPK">Khyber Pakhtunkhwa (KPK)</option>
                <option value="Balochistan">Balochistan</option>
                <option value="Islamabad">Islamabad Capital Territory</option>
                <option value="AJK">Azad Jammu &amp; Kashmir (AJK)</option>
                <option value="GB">Gilgit-Baltistan (GB)</option>
                <option value="FATA">FATA</option>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input id="phone" label="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              <Input id="email" label="Email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input id="ntn" label="NTN" value={form.ntn} onChange={(e) => update("ntn", e.target.value)} />
              <Input id="strn" label="STRN" value={form.strn} onChange={(e) => update("strn", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input id="businessType" label="Business Type" value={form.businessType} onChange={(e) => update("businessType", e.target.value)} />
              <Input
                id="invoicePrefix"
                label="Invoice Prefix"
                required
                value={form.invoicePrefix}
                onChange={(e) => update("invoicePrefix", e.target.value)}
              />
            </div>
            <Select
              id="fbrSaleType"
              label="FBR Sale Type"
              value={form.fbrSaleType}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, fbrSaleType: e.target.value as "GOODS" | "SERVICES" }))
              }
            >
              <option value="GOODS">Goods (SN001 / SN002)</option>
              <option value="SERVICES">Services (SN019)</option>
            </Select>
            <p className="-mt-2 text-xs text-gray-500 dark:text-gray-400">
              Match this to the Business Nature/Sector you selected when registering on IRIS — it
              determines which FBR sandbox scenario your invoices are submitted under.
            </p>
            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
