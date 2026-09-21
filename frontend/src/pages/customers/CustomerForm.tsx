import { useState, type FormEvent } from "react";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import type { Customer, CustomerInput } from "../../types/customer";

export function CustomerForm({
  initial,
  onSubmit,
  isSubmitting,
  readOnly,
}: {
  initial?: Customer;
  onSubmit: (input: CustomerInput) => Promise<void>;
  isSubmitting: boolean;
  readOnly?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [businessName, setBusinessName] = useState(initial?.businessName ?? "");
  const [customerType, setCustomerType] = useState(initial?.customerType ?? "INDIVIDUAL");
  const [ntn, setNtn] = useState(initial?.ntn ?? "");
  const [strn, setStrn] = useState(initial?.strn ?? "");
  const [cnic, setCnic] = useState(initial?.cnic ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [province, setProvince] = useState(initial?.province ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Customer name is required.");
      return;
    }

    await onSubmit({
      name: name.trim(),
      businessName: businessName.trim(),
      customerType,
      ntn: ntn.trim(),
      strn: strn.trim(),
      cnic: cnic.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      province: province.trim(),
    });
  }

  return (
    <Card className="max-w-2xl">
      <fieldset disabled={readOnly} className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input id="name" label="Customer Name" required value={name} onChange={(e) => setName(e.target.value)} />
            <Input id="businessName" label="Business Name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </div>
          <Select
            id="customerType"
            label="Customer Type"
            value={customerType}
            onChange={(e) => setCustomerType(e.target.value as CustomerInput["customerType"])}
          >
            <option value="INDIVIDUAL">Individual</option>
            <option value="BUSINESS">Business</option>
          </Select>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input id="ntn" label="NTN" value={ntn} onChange={(e) => setNtn(e.target.value)} />
            <Input id="strn" label="STRN" value={strn} onChange={(e) => setStrn(e.target.value)} />
          </div>
          {customerType === "INDIVIDUAL" && (
            <Input id="cnic" label="CNIC" value={cnic} onChange={(e) => setCnic(e.target.value)} />
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input id="phone" label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Input id="address" label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input id="city" label="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <Input id="province" label="Province" value={province} onChange={(e) => setProvince(e.target.value)} />
          </div>
          {error && <p className="text-sm text-error-600 dark:text-error-400">{error}</p>}
          {!readOnly && (
            <div className="flex justify-end gap-2 pt-2">
              <Button type="submit" isLoading={isSubmitting}>
                {initial ? "Save Changes" : "Create Customer"}
              </Button>
            </div>
          )}
        </form>
      </fieldset>
    </Card>
  );
}
