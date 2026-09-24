import { useState, type FormEvent } from "react";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import type { Product, ProductInput } from "../../types/product";

export function ProductForm({
  initial,
  onSubmit,
  isSubmitting,
}: {
  initial?: Product;
  onSubmit: (input: ProductInput) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "Pcs");
  const [priceRupees, setPriceRupees] = useState(initial ? (initial.salePriceMinor / 100).toString() : "");
  const [taxRatePercent, setTaxRatePercent] = useState(initial ? (initial.taxRateBasisPoints / 100).toString() : "0");
  const [hsCode, setHsCode] = useState(initial?.hsCode ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const priceMinor = Math.round(Number(priceRupees) * 100);
    const taxBasisPoints = Math.round(Number(taxRatePercent) * 100);

    if (!name.trim() || !sku.trim() || !unit.trim() || !Number.isFinite(priceMinor) || priceMinor < 0) {
      setError("Please fill in all required fields with valid values.");
      return;
    }

    await onSubmit({
      name: name.trim(),
      sku: sku.trim(),
      description: description.trim(),
      unit: unit.trim(),
      salePriceMinor: priceMinor,
      taxRateBasisPoints: taxBasisPoints,
      hsCode: hsCode.trim(),
    });
  }

  return (
    <Card className="max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input id="name" label="Product Name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input id="sku" label="SKU" required value={sku} onChange={(e) => setSku(e.target.value)} />
        </div>
        <Input id="description" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div>
          <Input
            id="hsCode"
            label="HS Code"
            placeholder="e.g. 0101.2100"
            value={hsCode}
            onChange={(e) => setHsCode(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Required before this product can be submitted to FBR — not required to save it.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select id="unit" label="Unit" required value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="">-- Select Unit --</option>
            <option value="Pcs">Pcs</option>
            <option value="Numbers, pieces, units">Numbers, pieces, units</option>
            <option value="KG">KG</option>
            <option value="Kilogram">Kilogram</option>
            <option value="Gram">Gram</option>
            <option value="Liter">Liter</option>
            <option value="Meter">Meter</option>
            <option value="Dozen">Dozen</option>
            <option value="Packs">Packs</option>
            <option value="Pair">Pair</option>
            <option value="Square Foot">Square Foot</option>
            <option value="Square Metre">Square Metre</option>
            <option value="Cubic Metre">Cubic Metre</option>
            <option value="Foot">Foot</option>
            <option value="MT">MT</option>
            <option value="Bag">Bag</option>
            <option value="SET">SET</option>
            <option value="NO">NO</option>
            <option value="40KG">40KG</option>
            <option value="SqY">SqY</option>
            <option value="Carat">Carat</option>
            <option value="Gallon">Gallon</option>
            <option value="Pound">Pound</option>
            <option value="Timber Logs">Timber Logs</option>
            <option value="Thousand Unit">Thousand Unit</option>
            <option value="Mega Watt">Mega Watt</option>
            <option value="KWH">KWH</option>
            <option value="1000 kWh">1000 kWh</option>
            <option value="MMBTU">MMBTU</option>
            <option value="Barrels">Barrels</option>
            <option value="Bill of lading">Bill of lading</option>
            <option value="Others">Others</option>
          </Select>
          <Input
            id="price"
            label="Sale Price (PKR)"
            type="number"
            step="0.01"
            min="0"
            required
            value={priceRupees}
            onChange={(e) => setPriceRupees(e.target.value)}
          />
          <Input
            id="taxRate"
            label="Tax Rate (%)"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={taxRatePercent}
            onChange={(e) => setTaxRatePercent(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-error-600 dark:text-error-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" isLoading={isSubmitting}>
            {initial ? "Save Changes" : "Create Product"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
