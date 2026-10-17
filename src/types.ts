/**
 * Public types for dotwave. Every field is optional: `createDotWave()` merges
 * what you pass on top of the defaults, so you only declare what you change.
 */

/** Geometry used to paint each grid cell. */
export type DotShape = "dot" | "ring" | "square";

/** How the canvas is placed inside its container. */
export type CanvasPosition = "absolute" | "fixed";

export interface DotWaveOptions {
  /** Element that hosts the canvas, or a CSS selector. @default document.body */
  container?: HTMLElement | string;

  /** Distance between dots in px. Larger = fewer, calmer dots. @default 22 */
  spacing?: number;

  /** Base radius of a dot in px. @default 1.2 */
  dotRadius?: number;

  /** `"r, g, b"`, `"rgb(...)"`, `"#fff"` or `"#ffffff"`. @default "255, 255, 255" */
  dotColor?: string;

  /** Outer glow intensity (canvas `shadowBlur`) in px. @default 5 */
  glowBlur?: number;

  /** Spatial frequency of the noise. Lower = bigger, slower blobs. @default 0.0025 */
  noiseScale?: number;

  /** Noise units per millisecond. 0 = frozen frame. @default 0.0008 */
  speed?: number;

  /** Canvas background. Use `"transparent"` to see the page through. @default "#121316" */
  backgroundColor?: string;

  /** React to the pointer: dots brighten, grow and move around the cursor. @default false */
  interactive?: boolean;

  /** Rotates the whole dot grid, in degrees. @default 0 */
  angle?: number;

  /** Geometry of each dot. @default "dot" */
  shape?: DotShape;

  /** How much the noise also drives dot size. 0 = constant, 1 = 0x..2x radius. @default 0 */
  sizeVariation?: number;

  /** Contrast curve applied to the noise. Higher keeps only the peaks. @default 2.5 */
  gamma?: number;

  /** Maximum opacity of a dot. @default 0.7 */
  intensity?: number;

  /** Seed of the noise field. Same seed, same pattern. @default 1337 */
  seed?: number;

  /** Dots below this opacity are skipped. @default 0.03 */
  opacityThreshold?: number;

  /** Radius of the pointer influence area in px. @default 180 */
  pointerRadius?: number;

  /** How strongly the pointer affects dots. @default 0.9 */
  pointerStrength?: number;

  /** Pixels dots are pushed away from the cursor. Negative pulls them in. @default 10 */
  pointerRepel?: number;

  /** Pause while the tab is hidden, resume when it returns. @default true */
  autoPause?: boolean;

  /** CSS position of the canvas. @default "absolute" */
  position?: CanvasPosition;

  /** z-index of the canvas. Use `-1` to sit behind your content. @default 0 */
  zIndex?: number;

  /** Built-in style to start from. See `presets`. @example "aurora" */
  preset?: string;
}

/** Handle returned by `createDotWave()`. */
export interface DotWaveInstance {
  /** Starts the loop. Called for you by `createDotWave()`. */
  init(): DotWaveInstance;
  /** Stops the loop, keeping the current state. */
  pause(): void;
  /** Resumes the loop. */
  play(): void;
  /** Applies new options live, without re-creating the canvas. */
  updateOptions(options: DotWaveOptions): void;
  /** Removes listeners, cancels the loop and detaches the canvas. */
  destroy(): void;
  /** Whether the animation loop is currently running. */
  readonly running: boolean;
  /** The underlying canvas element. */
  readonly canvas: HTMLCanvasElement;
}
