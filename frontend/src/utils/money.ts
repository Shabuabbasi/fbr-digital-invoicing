// Backend is the source of truth for all calculations; this only formats
// integer minor-unit amounts (paisa) coming from the API for display.
export function formatMoney(minorUnits: number): string {
  const rupees = minorUnits / 100;
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 2,
  }).format(rupees);
}
