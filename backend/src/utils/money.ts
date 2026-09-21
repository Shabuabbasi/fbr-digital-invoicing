// All money is stored/calculated as integer minor units (paisa). Never use floats for currency math.
// See docs/DATABASE.md "Money handling rule". Full invoice calculation engine lands in Phase 3.

export function roundHalfUpToMinorUnit(value: number): number {
  return Math.round(value);
}

// rateBasisPoints: 1800 = 18.00%
export function applyTaxRate(amountMinor: number, rateBasisPoints: number): number {
  return roundHalfUpToMinorUnit((amountMinor * rateBasisPoints) / 10000);
}
