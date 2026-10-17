import { describe, expect, it } from "vitest";
import { parseColor } from "../src/color";
import { presetNames, presets } from "../src/presets";
import type { DotWaveOptions } from "../src/types";

const all: Record<string, DotWaveOptions> = presets;

describe("presets", () => {
  it("exposes every preset name", () => {
    expect(presetNames).toEqual(Object.keys(presets));
    expect(presetNames.length).toBeGreaterThanOrEqual(5);
  });

  it("only contains option values the renderer accepts", () => {
    for (const [name, preset] of Object.entries(all)) {
      expect(preset.spacing, `${name}.spacing`).toBeGreaterThanOrEqual(4);
      expect(preset.dotRadius, `${name}.dotRadius`).toBeGreaterThan(0);
      expect(preset.noiseScale, `${name}.noiseScale`).toBeGreaterThan(0);
      expect(preset.intensity, `${name}.intensity`).toBeGreaterThan(0);
      expect(preset.intensity, `${name}.intensity`).toBeLessThanOrEqual(1);
      expect(preset.sizeVariation, `${name}.sizeVariation`).toBeGreaterThanOrEqual(0);
      expect(preset.sizeVariation, `${name}.sizeVariation`).toBeLessThanOrEqual(1);

      for (const value of Object.values(preset)) {
        if (typeof value === "number") {
          expect(Number.isFinite(value), `${name} has a non finite number`).toBe(true);
        }
      }
    }
  });

  it("uses colours the parser understands", () => {
    for (const [name, preset] of Object.entries(all)) {
      expect(() => parseColor(preset.dotColor as string), `${name}.dotColor`).not.toThrow();
      expect(() => parseColor(preset.backgroundColor as string), `${name}.backgroundColor`).not.toThrow();
    }
  });

  it("only uses supported shapes", () => {
    const shapes: DotWaveOptions["shape"][] = ["dot", "ring", "square"];
    for (const [name, preset] of Object.entries(all)) {
      expect(shapes, `${name}.shape`).toContain(preset.shape ?? "dot");
    }
  });

  it("gives each preset its own personality", () => {
    expect(presets.ember.shape).toBe("square");
    expect(presets.radar.shape).toBe("ring");
    expect(presets.nebula.spacing as number).toBeLessThan(presets.minimal.spacing as number);
    expect(presets.aurora.interactive).toBe(true);
  });
});
