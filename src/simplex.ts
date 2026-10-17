/**
 * Seeded 3D Simplex noise (Gustavson / Perlin's simplex).
 *
 * Vendored on purpose: dotwave installs nothing. No dependencies, and a seed so
 * the same pattern can be reproduced in tests and across reloads.
 *
 * Simplex over classic Perlin because the 3D lattice has 4 corners per sample
 * instead of 8, which is cheaper for our workload: one call per dot, per frame,
 * thousands of times.
 */

/** 12 gradients pointing at the edge midpoints of a cube. */
const GRAD3 = new Int8Array([
  1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1,
  0, -1, -1, 0, -1, -1,
]);

/** Skew and unskew factors for a 3D simplex lattice. */
const F3 = 1 / 3;
const G3 = 1 / 6;

/** Scales the raw corner sum into roughly [-1, 1]. */
const SCALE = 32;

function grad(hash: number, x: number, y: number, z: number): number {
  const index = (hash % 12) * 3;
  return (
    (GRAD3[index] as number) * x + (GRAD3[index + 1] as number) * y + (GRAD3[index + 2] as number) * z
  );
}

/** Tiny, fast, seedable PRNG (mulberry32). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class SimplexNoise3D {
  /** Doubled permutation table, so index lookups never need a modulo. */
  private readonly perm = new Uint8Array(512);

  constructor(seed = 1337) {
    const random = mulberry32(seed);
    const table = new Uint8Array(256);
    for (let i = 0; i < 256; i += 1) table[i] = i;

    for (let i = 255; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      const swap = table[i] as number;
      table[i] = table[j] as number;
      table[j] = swap;
    }

    for (let i = 0; i < 512; i += 1) this.perm[i] = table[i & 255] as number;
  }

  /** Permutation lookup. Every index below is already masked to 0..511. */
  private p(index: number): number {
    return this.perm[index] as number;
  }

  /**
   * Samples the field at `(x, y, z)`. Returns roughly [-1, 1].
   *
   * dotwave feeds it `x * noiseScale`, `y * noiseScale` and `elapsed * speed`,
   * which is what turns a static field into waves that grow and fade.
   */
  noise3D(x: number, y: number, z: number): number {
    // Skew the input to find the simplex cell...
    const skew = (x + y + z) * F3;
    const i = Math.floor(x + skew);
    const j = Math.floor(y + skew);
    const k = Math.floor(z + skew);

    // ...and unskew it back to get its origin.
    const unskew = (i + j + k) * G3;
    const x0 = x - (i - unskew);
    const y0 = y - (j - unskew);
    const z0 = z - (k - unskew);

    // Rank the coordinates to walk the 4 corners of the tetrahedron.
    let i1: number, j1: number, k1: number, i2: number, j2: number, k2: number;

    if (x0 >= y0) {
      if (y0 >= z0) {
        i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
      } else if (x0 >= z0) {
        i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1;
      } else {
        i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1;
      }
    } else {
      if (y0 < z0) {
        i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1;
      } else if (x0 < z0) {
        i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1;
      } else {
        i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
      }
    }

    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3;
    const y2 = y0 - j2 + 2 * G3;
    const z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3;
    const y3 = y0 - 1 + 3 * G3;
    const z3 = z0 - 1 + 3 * G3;

    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;

    let sum = 0;

    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 > 0) {
      t0 *= t0;
      sum += t0 * t0 * grad(this.p(ii + this.p(jj + this.p(kk))), x0, y0, z0);
    }

    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 > 0) {
      t1 *= t1;
      sum += t1 * t1 * grad(this.p(ii + i1 + this.p(jj + j1 + this.p(kk + k1))), x1, y1, z1);
    }

    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 > 0) {
      t2 *= t2;
      sum += t2 * t2 * grad(this.p(ii + i2 + this.p(jj + j2 + this.p(kk + k2))), x2, y2, z2);
    }

    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 > 0) {
      t3 *= t3;
      sum += t3 * t3 * grad(this.p(ii + 1 + this.p(jj + 1 + this.p(kk + 1))), x3, y3, z3);
    }

    return SCALE * sum;
  }
}
