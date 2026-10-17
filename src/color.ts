/**
 * Colour parsing plus the pre-baked alpha ramp.
 *
 * Why a ramp? The renderer never builds `rgba()` strings per dot. It builds 24
 * of them once and reuses them, which removes ~4k string allocations per frame
 * on a 1080p screen (a real GC problem at 60fps).
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const HEX_SHORT = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const HEX_LONG = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const NUMBERS = /-?\d*\.?\d+/g;

function channel(token: string | undefined, fallback = 255): number {
  const value = Number(token);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(255, Math.max(0, Math.round(value)));
}

function hexPair(value: string): number {
  return Number.parseInt(value, 16);
}

/**
 * Accepts the formats a designer would actually type:
 * `"255, 255, 255"`, `"rgb(255 255 255 / .5)"`, `"#fff"`, `"#ffffff"`.
 *
 * @throws if the value cannot be read as a colour.
 */
export function parseColor(input: string): Rgb {
  const value = input.trim();

  const short = HEX_SHORT.exec(value);
  if (short) {
    return {
      r: hexPair((short[1] as string) + (short[1] as string)),
      g: hexPair((short[2] as string) + (short[2] as string)),
      b: hexPair((short[3] as string) + (short[3] as string)),
    };
  }

  const long = HEX_LONG.exec(value);
  if (long) {
    return {
      r: hexPair(long[1] as string),
      g: hexPair(long[2] as string),
      b: hexPair(long[3] as string),
    };
  }

  const parts = value.match(NUMBERS);
  if (parts && parts.length >= 3) {
    return { r: channel(parts[0]), g: channel(parts[1]), b: channel(parts[2]) };
  }

  throw new Error(
    `[dotwave] Cannot read "${input}" as a colour. Use "255, 255, 255", "rgb(...)" or "#ffffff".`,
  );
}

/**
 * Pre-renders `steps` rgba strings with evenly spaced alphas from 0 to 1.
 * Index `i` always matches alpha `i / (steps - 1)`.
 */
export function buildColorRamp(rgb: Rgb, steps: number): string[] {
  const ramp: string[] = [];
  const last = Math.max(1, steps - 1);

  for (let i = 0; i < steps; i += 1) {
    const alpha = Math.round((i / last) * 1000) / 1000;
    ramp.push(`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`);
  }

  return ramp;
}
