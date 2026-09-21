import { applyTaxRate, roundHalfUpToMinorUnit } from "./money";

describe("money utils", () => {
  it("rounds half-up to the nearest minor unit", () => {
    expect(roundHalfUpToMinorUnit(10.4)).toBe(10);
    expect(roundHalfUpToMinorUnit(10.5)).toBe(11);
    expect(roundHalfUpToMinorUnit(10.49999)).toBe(10);
  });

  it("applies a basis-point tax rate correctly", () => {
    expect(applyTaxRate(100000, 1800)).toBe(18000); // 18%
    expect(applyTaxRate(100000, 0)).toBe(0);
    expect(applyTaxRate(100000, 10000)).toBe(100000); // 100%
  });

  it("rounds fractional tax amounts half-up", () => {
    expect(applyTaxRate(333, 1750)).toBe(58); // 58.275 -> 58
    expect(applyTaxRate(101, 500)).toBe(5); // 5.05 -> 5
  });
});
