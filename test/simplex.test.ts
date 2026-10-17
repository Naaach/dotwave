import { describe, expect, it } from "vitest";
import { SimplexNoise3D } from "../src/simplex";

describe("SimplexNoise3D", () => {
  it("is deterministic for the same seed", () => {
    const a = new SimplexNoise3D(42);
    const b = new SimplexNoise3D(42);

    for (let i = 0; i < 200; i += 1) {
      const x = i * 0.37;
      const y = i * -0.21;
      expect(a.noise3D(x, y, i * 0.05)).toBe(b.noise3D(x, y, i * 0.05));
    }
  });

  it("produces a different field for a different seed", () => {
    const a = new SimplexNoise3D(1);
    const b = new SimplexNoise3D(2);

    let differences = 0;
    for (let i = 0; i < 200; i += 1) {
      if (a.noise3D(i * 0.11, i * 0.07, 0.5) !== b.noise3D(i * 0.11, i * 0.07, 0.5)) {
        differences += 1;
      }
    }

    expect(differences).toBeGreaterThan(190);
  });

  it("stays inside [-1, 1]", () => {
    const noise = new SimplexNoise3D(7);
    // Accumulate then assert once: `expect()` per sample would be 1.6M
    // assertions and time the suite out on its own.
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    let samples = 0;

    for (let x = -50; x < 50; x += 0.31) {
      for (let y = -50; y < 50; y += 0.53) {
        for (let z = -20; z < 20; z += 3.3) {
          const value = noise.noise3D(x, y, z);
          if (Number.isNaN(value)) throw new Error("noise returned NaN");
          if (value < min) min = value;
          if (value > max) max = value;
          samples += 1;
        }
      }
    }

    expect(samples).toBeGreaterThan(100_000);
    expect(min).toBeGreaterThanOrEqual(-1);
    expect(max).toBeLessThanOrEqual(1);
  });

  it("is continuous: nearby inputs give nearby values", () => {
    const noise = new SimplexNoise3D(1337);
    const step = 0.01;

    for (let i = 0; i < 300; i += 1) {
      const x = i * 0.13;
      const here = noise.noise3D(x, 4.2, 9.1);
      const next = noise.noise3D(x + step, 4.2, 9.1);
      expect(Math.abs(here - next)).toBeLessThan(0.2);
    }
  });

  it("reaches both extremes of the range", () => {
    const noise = new SimplexNoise3D(99);
    let min = 1;
    let max = -1;

    for (let x = -20; x < 20; x += 0.07) {
      for (let y = -20; y < 20; y += 0.09) {
        const value = noise.noise3D(x, y, 3);
        if (value < min) min = value;
        if (value > max) max = value;
      }
    }

    expect(min).toBeLessThan(-0.5);
    expect(max).toBeGreaterThan(0.5);
  });

  it("freezes when z does not move", () => {
    const noise = new SimplexNoise3D(5);
    expect(noise.noise3D(1.5, 2.5, 8)).toBe(noise.noise3D(1.5, 2.5, 8));
  });

  it("keeps a roughly even distribution around zero", () => {
    const noise = new SimplexNoise3D(2024);
    let sum = 0;
    let count = 0;

    for (let x = -10; x < 10; x += 0.11) {
      for (let y = -10; y < 10; y += 0.13) {
        sum += noise.noise3D(x, y, 1.5);
        count += 1;
      }
    }

    // A biased field would show up as dots piling up in one half of the screen.
    expect(Math.abs(sum / count)).toBeLessThan(0.05);
  });
});
