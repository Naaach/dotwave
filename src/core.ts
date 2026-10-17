import { buildColorRamp, parseColor } from "./color";
import { presets, type PresetName } from "./presets";
import { SimplexNoise3D } from "./simplex";
import type { CanvasPosition, DotShape, DotWaveInstance, DotWaveOptions } from "./types";

/** Opacity buckets. Dots are grouped per bucket so canvas state changes once per bucket. */
const ALPHA_STEPS = 24;

/** Floor for `spacing`, so a fat finger can't ask for a 10M dot grid. */
const MIN_SPACING = 4;

/** Above this many dots per frame the spacing is stretched instead of melting. */
const MAX_DOTS = 40_000;

/** Cap on time advanced per frame, so a background tab doesn't jump. */
const MAX_DELTA_MS = 100;

const POINTER_ALPHA_BOOST = 0.9;
const POINTER_SIZE_BOOST = 0.75;

const TAU = Math.PI * 2;

const SHAPES: readonly DotShape[] = ["dot", "ring", "square"];
const POSITIONS: readonly CanvasPosition[] = ["absolute", "fixed"];

const DEFAULTS: ResolvedOptions = {
  spacing: 22,
  dotRadius: 1.2,
  dotColor: "255, 255, 255",
  glowBlur: 5,
  noiseScale: 0.0025,
  speed: 0.0008,
  backgroundColor: "#121316",
  interactive: false,
  shape: "dot",
  sizeVariation: 0,
  gamma: 2.5,
  intensity: 0.7,
  seed: 1337,
  opacityThreshold: 0.03,
  pointerRadius: 180,
  pointerStrength: 0.9,
  pointerRepel: 10,
  autoPause: true,
  position: "absolute",
  zIndex: 0,
  angle: 0,
};

/** Every option after merging preset + input + defaults, clamped to usable ranges. */
type ResolvedOptions = Required<Omit<DotWaveOptions, "container" | "preset">>;

function number(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/**
 * Canvas silently ignores an invalid `fillStyle`, which shows up as the
 * background keeping the previous frame's colour. Catch it here instead.
 * Outside a browser there is nothing to validate against, so we let it pass.
 */
function isPaintable(value: string): boolean {
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function") return true;
  return CSS.supports("color", value);
}

function resolveContainer(target: DotWaveOptions["container"]): HTMLElement {
  if (typeof target === "string") {
    const found = document.querySelector<HTMLElement>(target);
    if (!found) {
      throw new Error(
        `[dotwave] container "${target}" matched no element. Check the selector or pass the element itself.`,
      );
    }
    return found;
  }
  return target ?? document.body;
}

function resolveOptions(input: DotWaveOptions, base: ResolvedOptions): ResolvedOptions {
  const merged: Record<string, unknown> = { ...base };

  if (input.preset !== undefined) {
    const preset = presets[input.preset as PresetName];
    if (!preset) {
      throw new Error(
        `[dotwave] Unknown preset "${input.preset}". Available: ${Object.keys(presets).join(", ")}.`,
      );
    }
    Object.assign(merged, preset);
  }

  // Skipping undefined keys keeps `{ dotRadius: maybeUndefined }` from wiping it.
  for (const [key, value] of Object.entries(input)) {
    if (key === "container" || key === "preset") continue;
    if (value !== undefined) merged[key] = value;
  }

  const d = DEFAULTS;

  const background =
    typeof merged.backgroundColor === "string" ? merged.backgroundColor : d.backgroundColor;
  if (!isPaintable(background)) {
    throw new Error(
      `[dotwave] backgroundColor "${background}" is not a colour the canvas can paint. Use "#121316", "rgb(...)" or "transparent".`,
    );
  }

  return {
    spacing: number(merged.spacing, d.spacing, MIN_SPACING, 400),
    dotRadius: number(merged.dotRadius, d.dotRadius, 0, 60),
    dotColor: typeof merged.dotColor === "string" ? merged.dotColor : d.dotColor,
    glowBlur: number(merged.glowBlur, d.glowBlur, 0, 80),
    noiseScale: number(merged.noiseScale, d.noiseScale, 0.00001, 1),
    speed: number(merged.speed, d.speed, 0, 0.05),
    backgroundColor: background,
    interactive: Boolean(merged.interactive),
    shape: oneOf(merged.shape, SHAPES, d.shape),
    sizeVariation: number(merged.sizeVariation, d.sizeVariation, 0, 1),
    gamma: number(merged.gamma, d.gamma, 0.1, 10),
    intensity: number(merged.intensity, d.intensity, 0, 1),
    seed: number(merged.seed, d.seed, 0, 4294967295),
    opacityThreshold: number(merged.opacityThreshold, d.opacityThreshold, 0, 1),
    pointerRadius: number(merged.pointerRadius, d.pointerRadius, 10, 2000),
    pointerStrength: number(merged.pointerStrength, d.pointerStrength, 0, 3),
    pointerRepel: number(merged.pointerRepel, d.pointerRepel, -80, 80),
    autoPause: merged.autoPause === undefined ? d.autoPause : Boolean(merged.autoPause),
    position: oneOf(merged.position, POSITIONS, d.position),
    zIndex: number(merged.zIndex, d.zIndex, -9999, 9999),
    angle: number(((number(merged.angle, d.angle, -360, 360) % 360) + 360) % 360, 0, 0, 360),
  };
}

class DotWaveBackground implements DotWaveInstance {
  private options: ResolvedOptions;
  private container: HTMLElement;
  private readonly canvasElement: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;

  private noise: SimplexNoise3D;
  private ramp: string[];

  /** Reused across frames so the render loop allocates nothing. */
  private readonly buckets: Float32Array[];
  private readonly counts = new Int32Array(ALPHA_STEPS);

  private width = 0;
  private height = 0;
  private elapsed = 0;
  private lastTimestamp = 0;

  private rotation = { radians: 0, cos: 1, sin: 0 };
  private grid = { startX: 0, startY: 0, spacing: 22, columns: 0, rows: 0 };

  private frameId = 0;
  private started = false;
  private isRunning = false;
  private isDestroyed = false;

  private resumeOnVisible = false;
  private warnedAboutDensity = false;

  private readonly cursor = { x: 0, y: 0, targetX: 0, targetY: 0, active: false };
  private resizeObserver: ResizeObserver | null = null;
  private listeningToPointer = false;

  constructor(options: DotWaveOptions = {}) {
    this.options = resolveOptions(options, { ...DEFAULTS });
    this.container = resolveContainer(options.container);
    this.noise = new SimplexNoise3D(this.options.seed);
    this.ramp = buildColorRamp(parseColor(this.options.dotColor), ALPHA_STEPS);
    this.buckets = Array.from({ length: ALPHA_STEPS }, () => new Float32Array(48));
    this.syncRotation();

    this.canvasElement = document.createElement("canvas");
    this.canvasElement.setAttribute("aria-hidden", "true");
    this.applyCanvasStyle();

    const context = this.canvasElement.getContext("2d");
    if (!context) {
      throw new Error("[dotwave] This browser did not provide a 2D canvas context.");
    }
    this.context = context;
  }

  get running(): boolean {
    return this.isRunning;
  }

  get canvas(): HTMLCanvasElement {
    return this.canvasElement;
  }

  init(): DotWaveInstance {
    if (this.isDestroyed) {
      throw new Error("[dotwave] This background was destroyed. Create a new one.");
    }
    if (this.started) return this;

    this.container.prepend(this.canvasElement);
    this.resize();
    this.attach();
    this.started = true;
    this.play();
    return this;
  }

  play(): void {
    if (this.isDestroyed || this.isRunning) return;
    this.isRunning = true;
    this.lastTimestamp = 0;
    this.frameId = requestAnimationFrame(this.handleFrame);
  }

  pause(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    cancelAnimationFrame(this.frameId);
    this.frameId = 0;
  }

  updateOptions(options: DotWaveOptions = {}): void {
    if (this.isDestroyed) {
      throw new Error("[dotwave] This background was destroyed. Create a new one.");
    }

    const previous = this.options;
    const next = resolveOptions(options, previous);
    this.options = next;

    if (next.dotColor !== previous.dotColor) {
      this.ramp = buildColorRamp(parseColor(next.dotColor), ALPHA_STEPS);
    }
    if (next.seed !== previous.seed) {
      this.noise = new SimplexNoise3D(next.seed);
    }
    if (next.angle !== previous.angle) {
      this.syncRotation();
    }
    if (next.interactive !== previous.interactive) {
      next.interactive ? this.listenPointer() : this.stopListeningPointer();
    }

    this.applyCanvasStyle();

    if (options.container !== undefined) {
      const container = resolveContainer(options.container);
      if (container !== this.container) {
        this.stopListeningPointer();
        this.container = container;
        this.container.prepend(this.canvasElement);
        this.listenPointer();
        this.resize();
      }
    }
  }

  destroy(): void {
    if (this.isDestroyed) return;
    this.pause();
    this.detach();
    this.canvasElement.remove();
    this.isDestroyed = true;
  }

  // ------------------------------------------------------------- internals

  private applyCanvasStyle(): void {
    const style = this.canvasElement.style;
    style.position = this.options.position;
    style.inset = "0";
    style.width = "100%";
    style.height = "100%";
    style.pointerEvents = "none";
    style.display = "block";
    style.zIndex = String(this.options.zIndex);
  }

  private attach(): void {
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.container);
    } else {
      window.addEventListener("resize", this.handleWindowResize);
    }

    document.addEventListener("visibilitychange", this.handleVisibility);
    this.listenPointer();
  }

  private detach(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    window.removeEventListener("resize", this.handleWindowResize);
    document.removeEventListener("visibilitychange", this.handleVisibility);
    this.stopListeningPointer();
  }

  private listenPointer(): void {
    if (this.listeningToPointer || !this.options.interactive) return;
    this.listeningToPointer = true;
    window.addEventListener("pointermove", this.handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", this.handlePointerMove, { passive: true });
    window.addEventListener("pointerout", this.handlePointerLeave, { passive: true });
    window.addEventListener("blur", this.handlePointerLeave);
  }

  private stopListeningPointer(): void {
    if (!this.listeningToPointer) return;
    this.listeningToPointer = false;
    window.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerdown", this.handlePointerMove);
    window.removeEventListener("pointerout", this.handlePointerLeave);
    window.removeEventListener("blur", this.handlePointerLeave);
  }

  private resize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === this.width && height === this.height) return;

    this.width = width;
    this.height = height;
    this.canvasElement.width = Math.max(1, width);
    this.canvasElement.height = Math.max(1, height);
    this.layoutGrid();
  }

  private syncRotation(): void {
    const radians = (this.options.angle * Math.PI) / 180;
    this.rotation = { radians, cos: Math.cos(radians), sin: Math.sin(radians) };
    this.layoutGrid();
  }

  /**
   * Works out which cells to walk this frame.
   *
   * With `angle: 0` that is just the canvas. With a rotated grid the corners of
   * the screen would fall outside the axes, so we iterate the rotated bounding
   * box and let the canvas transform do the rotation.
   */
  private layoutGrid(): void {
    const { width, height } = this;
    const { cos, sin } = this.rotation;

    const extentWidth = Math.abs(width * cos) + Math.abs(height * sin);
    const extentHeight = Math.abs(width * sin) + Math.abs(height * cos);

    const spacing = this.gridSpacing(extentWidth, extentHeight);
    const columns = Math.max(0, Math.ceil(extentWidth / spacing));
    const rows = Math.max(0, Math.ceil(extentHeight / spacing));

    this.grid = {
      spacing,
      columns,
      rows,
      // Anchored on the centre, so rotating keeps the dots around it in place.
      startX: width / 2 - ((columns - 1) * spacing) / 2,
      startY: height / 2 - ((rows - 1) * spacing) / 2,
    };
  }

  /** Spacing actually used, stretched to protect the frame budget. */
  private gridSpacing(extentWidth: number, extentHeight: number): number {
    const { spacing } = this.options;
    if (extentWidth === 0 || extentHeight === 0) return spacing;

    const dots = Math.ceil(extentWidth / spacing) * Math.ceil(extentHeight / spacing);
    if (dots <= MAX_DOTS) return spacing;

    if (!this.warnedAboutDensity) {
      this.warnedAboutDensity = true;
      console.warn(
        `[dotwave] spacing ${spacing}px means ${dots.toLocaleString()} dots per frame on this size; ` +
          `stretching it to keep 60fps. Use a larger spacing for a calmer background.`,
      );
    }

    return spacing * Math.sqrt(dots / MAX_DOTS);
  }

  private readonly handleFrame = (timestamp: number): void => {
    if (!this.isRunning || this.isDestroyed) return;

    const delta =
      this.lastTimestamp === 0 ? 16.7 : Math.min(timestamp - this.lastTimestamp, MAX_DELTA_MS);
    this.lastTimestamp = timestamp;
    this.elapsed += delta;

    this.render();
    this.frameId = requestAnimationFrame(this.handleFrame);
  };

  private readonly handleWindowResize = (): void => this.resize();

  private readonly handleVisibility = (): void => {
    if (!this.options.autoPause) return;

    if (document.hidden) {
      this.resumeOnVisible = this.isRunning;
      this.pause();
    } else if (this.resumeOnVisible) {
      this.resumeOnVisible = false;
      this.play();
    }
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    const rect = this.canvasElement.getBoundingClientRect();
    this.cursor.targetX = event.clientX - rect.left;
    this.cursor.targetY = event.clientY - rect.top;
    if (!this.cursor.active) {
      this.cursor.x = this.cursor.targetX;
      this.cursor.y = this.cursor.targetY;
      this.cursor.active = true;
    }
  };

  private readonly handlePointerLeave = (): void => {
    this.cursor.active = false;
  };

  private render(): void {
    const { context: ctx, width, height, options: o } = this;
    if (width === 0 || height === 0) return;
    if (this.grid.columns === 0 || this.grid.rows === 0) return;

    if (o.backgroundColor === "transparent") {
      ctx.clearRect(0, 0, width, height);
    } else {
      ctx.fillStyle = o.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    const { columns, rows, startX, startY, spacing } = this.grid;
    const cursor = this.localCursor();
    const noise = this.noise;
    const noiseZ = this.elapsed * o.speed;
    const scale = o.noiseScale;
    const counts = this.counts;
    counts.fill(0);

    const interactive = o.interactive && cursor.active;
    const cursorX = cursor.x;
    const cursorY = cursor.y;
    const pointerRadius = o.pointerRadius;
    const pointerRadiusSq = pointerRadius * pointerRadius;
    const pointerStrength = o.pointerStrength;
    const pointerRepel = o.pointerRepel;
    const variation = o.sizeVariation;
    const radiusBase = o.dotRadius;
    const threshold = o.opacityThreshold;
    const lastBucket = ALPHA_STEPS - 1;

    for (let row = 0; row < rows; row += 1) {
      const y = startY + row * spacing;

      for (let column = 0; column < columns; column += 1) {
        const x = startX + column * spacing;

        // Clamped: a negative reading would make `Math.pow` return NaN and take
        // the whole frame down with it.
        const n01 = clamp01((noise.noise3D(x * scale, y * scale, noiseZ) + 1) * 0.5);

        let alpha = Math.pow(n01, o.gamma) * o.intensity;
        let radius = radiusBase * (1 - variation + 2 * variation * n01);
        let dotX = x;
        let dotY = y;

        if (interactive) {
          const dx = x - cursorX;
          const dy = y - cursorY;
          const distanceSq = dx * dx + dy * dy;

          if (distanceSq < pointerRadiusSq) {
            const falloff = 1 - Math.sqrt(distanceSq) / pointerRadius;
            const influence = falloff * falloff * pointerStrength;

            alpha += influence * POINTER_ALPHA_BOOST;
            radius *= 1 + influence * POINTER_SIZE_BOOST;

            if (pointerRepel !== 0 && distanceSq > 0.01) {
              const distance = Math.sqrt(distanceSq);
              dotX += (dx / distance) * pointerRepel * falloff;
              dotY += (dy / distance) * pointerRepel * falloff;
            }
          }
        }

        if (alpha <= threshold) continue;

        const bucket = Math.min(
          lastBucket,
          Math.max(0, Math.round(Math.min(alpha, 1) * lastBucket)),
        );
        this.store(bucket, dotX, dotY, radius);
      }
    }

    this.paint();
  }

  /** Eases the cursor, then rotates it into the grid's own space. */
  private localCursor(): { x: number; y: number; active: boolean } {
    const cursor = this.cursor;
    if (!cursor.active) return cursor;

    cursor.x += (cursor.targetX - cursor.x) * 0.15;
    cursor.y += (cursor.targetY - cursor.y) * 0.15;

    const { radians, cos, sin } = this.rotation;
    if (radians === 0) return cursor;

    const dx = cursor.x - this.width / 2;
    const dy = cursor.y - this.height / 2;
    return {
      x: this.width / 2 + dx * cos + dy * sin,
      y: this.height / 2 - dx * sin + dy * cos,
      active: true,
    };
  }

  private store(bucket: number, x: number, y: number, radius: number): void {
    const count = this.counts[bucket] as number;
    let buffer = this.buckets[bucket] as Float32Array;

    if ((count + 1) * 3 > buffer.length) {
      const grown = new Float32Array(Math.max((count + 1) * 3, buffer.length * 2));
      grown.set(buffer);
      this.buckets[bucket] = buffer = grown;
    }

    buffer[count * 3] = x;
    buffer[count * 3 + 1] = y;
    buffer[count * 3 + 2] = radius;
    this.counts[bucket] = count + 1;
  }

  /** Adds one dot to the current path. */
  private trace(x: number, y: number, radius: number, shape: DotShape): void {
    const { context: ctx } = this;
    if (shape === "square") {
      ctx.rect(x - radius, y - radius, radius * 2, radius * 2);
      return;
    }
    // The moveTo is what keeps each dot its own subpath. Without it, consecutive
    // arcs are joined by a straight line: invisible when filling the whole path,
    // but a mess of diagonal streaks as soon as anything strokes it.
    ctx.moveTo(x + radius, y);
    ctx.arc(x, y, shape === "ring" ? Math.max(0.4, radius) : Math.max(0.05, radius), 0, TAU);
  }

  /** Rotates the canvas once, then paints one canvas state change per bucket. */
  private paint(): void {
    const { context: ctx, options: o } = this;
    const lastBucket = ALPHA_STEPS - 1;
    const shape = o.shape;
    const stroke = shape === "ring";
    const glow = o.glowBlur > 0;

    ctx.save();
    if (this.rotation.radians !== 0) {
      const halfWidth = this.width / 2;
      const halfHeight = this.height / 2;
      ctx.translate(halfWidth, halfHeight);
      ctx.rotate(this.rotation.radians);
      ctx.translate(-halfWidth, -halfHeight);
    }

    ctx.lineWidth = Math.max(0.4, o.dotRadius * 0.6);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    for (let bucket = 0; bucket < ALPHA_STEPS; bucket += 1) {
      const count = this.counts[bucket] as number;
      if (count === 0) continue;

      const color = this.ramp[bucket] as string;
      // Glow tracks the dot alpha, like the reference implementation.
      ctx.shadowColor = color;
      ctx.shadowBlur = glow ? o.glowBlur * (bucket / lastBucket) : 0;
      ctx.fillStyle = color;
      ctx.strokeStyle = color;

      const buffer = this.buckets[bucket] as Float32Array;

      if (glow) {
        // One dot per fill. A path holding every dot in the bucket would make
        // the browser rasterise one shadow for the whole grid: blurry, banded,
        // and slow. This is what the reference implementation does.
        for (let i = 0; i < count; i += 1) {
          ctx.beginPath();
          this.trace(
            buffer[i * 3] as number,
            buffer[i * 3 + 1] as number,
            buffer[i * 3 + 2] as number,
            shape,
          );
          if (stroke) ctx.stroke();
          else ctx.fill();
        }
      } else {
        // Without glow, one path per bucket is pixel identical and far cheaper.
        ctx.beginPath();
        for (let i = 0; i < count; i += 1) {
          this.trace(
            buffer[i * 3] as number,
            buffer[i * 3 + 1] as number,
            buffer[i * 3 + 2] as number,
            shape,
          );
        }
        if (stroke) ctx.stroke();
        else ctx.fill();
      }
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

/**
 * Creates and starts an animated dotted background.
 *
 * ```ts
 * const wave = createDotWave({ preset: "aurora", container: "#hero" });
 * wave.updateOptions({ angle: 30 });
 * wave.destroy();
 * ```
 */
export function createDotWave(options: DotWaveOptions = {}): DotWaveInstance {
  return new DotWaveBackground(options).init();
}
