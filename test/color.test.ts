import { describe, expect, it } from "vitest";
import { buildColorRamp, parseColor } from "../src/color";

describe("parseColor", () => {
  it("reads the canonical 'r, g, b' format", () => {
    expect(parseColor("255, 255, 255")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor("12,34,56")).toEqual({ r: 12, g: 34, b: 56 });
  });

  it("reads rgb() and rgba()", () => {
    expect(parseColor("rgb(10, 20, 30)")).toEqual({ r: 10, g: 20, b: 30 });
    expect(parseColor("rgba(10 20 30 / 0.5)")).toEqual({ r: 10, g: 20, b: 30 });
  });

  it("reads short and long hex", () => {
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor("#0f0a06")).toEqual({ r: 15, g: 10, b: 6 });
  });

  it("clamps out of range channels", () => {
    expect(parseColor("300, -20, 128")).toEqual({ r: 255, g: 0, b: 128 });
  });

  it("throws a helpful error on garbage", () => {
    expect(() => parseColor("not a color")).toThrow(/dotwave/);
  });
});

describe("buildColorRamp", () => {
  it("spans alpha 0 to 1 in even steps", () => {
    const ramp = buildColorRamp({ r: 1, g: 2, b: 3 }, 24);

    expect(ramp).toHaveLength(24);
    expect(ramp[0]).toBe("rgba(1, 2, 3, 0)");
    expect(ramp[23]).toBe("rgba(1, 2, 3, 1)");
  });

  it("increases monotonically", () => {
    const ramp = buildColorRamp({ r: 0, g: 0, b: 0 }, 24);
    const alphas = ramp.map((entry) => Number(entry.match(/([\d.]+)\)$/)?.[1] ?? -1));

    for (let i = 1; i < alphas.length; i += 1) {
      expect(alphas[i]).toBeGreaterThan(alphas[i - 1] as number);
    }
  });
});
