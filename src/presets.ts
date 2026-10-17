import type { DotWaveOptions } from "./types";

/**
 * Ready-made looks. Each one is just a partial `DotWaveOptions`, so you can start
 * from a preset and override only what you need:
 *
 * ```ts
 * createDotWave({ preset: "aurora", speed: 0.002 });
 * ```
 */
const presetDefinitions = {
  /** Slow mint/teal clouds, big soft blobs. The safe hero background. */
  aurora: {
    spacing: 26,
    dotRadius: 1.5,
    dotColor: "110, 231, 183",
    backgroundColor: "#07110f",
    noiseScale: 0.0016,
    speed: 0.0005,
    gamma: 2.2,
    intensity: 0.75,
    sizeVariation: 0.85,
    interactive: true,
    pointerRadius: 260,
    pointerStrength: 1,
    pointerRepel: 14,
  },

  /** Tiny crisp dots that slowly twinkle, like a dark night sky. */
  starfield: {
    spacing: 18,
    dotRadius: 1.1,
    dotColor: "226, 232, 255",
    backgroundColor: "#05060c",
    noiseScale: 0.0045,
    speed: 0.0011,
    gamma: 3.4,
    intensity: 0.9,
    sizeVariation: 0.55,
    shape: "dot",
  },

  /** Violet haze: wide blobs, very soft edges. */
  nebula: {
    spacing: 20,
    dotRadius: 1.8,
    dotColor: "167, 139, 250",
    backgroundColor: "#0b0718",
    noiseScale: 0.0012,
    speed: 0.0004,
    gamma: 1.9,
    intensity: 0.65,
    sizeVariation: 1,
    interactive: true,
    pointerRadius: 320,
    pointerStrength: 1.1,
    pointerRepel: 18,
  },

  /** Warm embers drifting upwards, square shaped and sharp. */
  ember: {
    spacing: 24,
    dotRadius: 1.4,
    dotColor: "251, 146, 60",
    backgroundColor: "#140a05",
    noiseScale: 0.0022,
    speed: 0.0014,
    gamma: 2.8,
    intensity: 0.85,
    sizeVariation: 0.7,
    shape: "square",
  },

  /** Technical look: hollow rings, tilted grid, no glow. */
  radar: {
    spacing: 30,
    dotRadius: 2.6,
    dotColor: "52, 211, 153",
    backgroundColor: "#04120c",
    noiseScale: 0.003,
    speed: 0.0009,
    gamma: 2.1,
    intensity: 0.8,
    sizeVariation: 0.9,
    shape: "ring",
    angle: 15,
    interactive: true,
    pointerRadius: 200,
    pointerStrength: 1.2,
    pointerRepel: 8,
  },

  /** Almost invisible: the subtlest option for readable content on top. */
  minimal: {
    spacing: 28,
    dotRadius: 1.1,
    dotColor: "148, 163, 184",
    backgroundColor: "#0b0b0d",
    noiseScale: 0.002,
    speed: 0.0006,
    gamma: 3,
    intensity: 0.45,
    sizeVariation: 0,
  },
} as const satisfies Record<string, DotWaveOptions>;

export type PresetName = keyof typeof presetDefinitions;

/**
 * Built-in styles. Keys are valid values for the `preset` option.
 *
 * ```ts
 * createDotWave({ preset: "nebula", speed: 0.002 });
 * ```
 */
export const presets: Record<PresetName, DotWaveOptions> = presetDefinitions;

/** Every preset name, in a stable order. */
export const presetNames = Object.keys(presets) as PresetName[];
