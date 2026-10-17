import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDotWave } from "../src/core";
import type { DotWaveInstance, DotWaveOptions } from "../src/types";
import { countOf, frames, recorded, resetRecording, sizedContainer } from "./setup";

/**
 * Every background created here keeps animating until it is destroyed, and the
 * canvas mock is shared, so a leak from one test would show up as phantom
 * drawing in the next. Track them all and tear them down between tests.
 */
const running: DotWaveInstance[] = [];

function background(options: DotWaveOptions): DotWaveInstance {
  const instance = createDotWave(options);
  running.push(instance);
  return instance;
}

function pointerMove(clientX: number, clientY: number): void {
  const event = new Event("pointermove") as Event & { clientX: number; clientY: number };
  Object.defineProperty(event, "clientX", { value: clientX });
  Object.defineProperty(event, "clientY", { value: clientY });
  window.dispatchEvent(event);
}

function setHidden(hidden: boolean): void {
  Object.defineProperty(document, "hidden", { value: hidden, configurable: true });
  document.dispatchEvent(new Event("visibilitychange"));
}

beforeEach(() => {
  resetRecording();
  document.body.innerHTML = "";
});

afterEach(() => {
  for (const instance of running.splice(0)) instance.destroy();
});

describe("createDotWave", () => {
  it("mounts a canvas inside the container and starts the loop", () => {
    const container = sizedContainer();
    const dotwave = background({ container });

    expect(dotwave.running).toBe(true);
    expect(container.querySelector("canvas")).toBe(dotwave.canvas);
    expect(dotwave.canvas.getAttribute("aria-hidden")).toBe("true");
    expect(dotwave.canvas.style.pointerEvents).toBe("none");
  });

  it("accepts a CSS selector as container", () => {
    const container = sizedContainer();
    container.id = "hero";

    const dotwave = background({ container: "#hero" });
    expect(dotwave.canvas.parentElement).toBe(container);
  });

  it("throws when the container selector matches nothing", () => {
    expect(() => createDotWave({ container: "#missing" })).toThrow(/dotwave/);
  });

  it("throws for an unknown preset and lists the valid ones", () => {
    expect(() => createDotWave({ preset: "lava" })).toThrow(/aurora/);
  });

  it("throws for a colour the canvas cannot paint", () => {
    // Canvas ignores an invalid fillStyle, so the background would silently
    // keep the previous frame's colour.
    if (typeof CSS === "undefined" || typeof CSS.supports !== "function") return;

    expect(() => createDotWave({ backgroundColor: "rgb(71, 110)" })).toThrow(/backgroundColor/);
    expect(() => createDotWave({ dotColor: "not a colour" })).toThrow(/dotwave/);
  });

  it("sizes the canvas to the container", () => {
    const dotwave = background({ container: sizedContainer(640, 480) });
    expect(dotwave.canvas.width).toBe(640);
    expect(dotwave.canvas.height).toBe(480);
  });
});

describe("rendering", () => {
  it("paints the background", async () => {
    const dotwave = background({ container: sizedContainer(400, 300), spacing: 20 });
    await frames(3);
    dotwave.pause();

    expect(countOf("fillRect")).toBeGreaterThan(0);
    expect(countOf("arc")).toBeGreaterThan(0);
  });

  it("batches every dot of an alpha bucket into one path when there is no glow", async () => {
    const dotwave = background({
      container: sizedContainer(400, 300),
      spacing: 20,
      glowBlur: 0,
      opacityThreshold: 0,
    });
    await frames(3);
    dotwave.pause();

    const perFrame = (method: string) => countOf(method) / 3;
    // 300 cells, but only a handful of fills and paths.
    expect(perFrame("arc")).toBe(300);
    expect(perFrame("fill")).toBeLessThanOrEqual(24);
    expect(perFrame("beginPath")).toBeLessThanOrEqual(24);
  });

  it("draws one dot at a time when there is a glow, but still sets state per bucket", async () => {
    const dotwave = background({
      container: sizedContainer(400, 300),
      spacing: 20,
      glowBlur: 5,
      opacityThreshold: 0,
    });
    await frames(3);
    dotwave.pause();

    const perFrame = (method: string) => countOf(method) / 3;
    // A single path holding every dot would make the browser rasterise one
    // shadow for the whole grid: banded, blurry and slow.
    expect(perFrame("fill")).toBe(300);
    expect(perFrame("beginPath")).toBe(300);

    // The expensive part is the shadow state, and that still changes per bucket.
    expect(perFrame("shadowBlur")).toBeLessThanOrEqual(25);
  });

  it("keeps the glow in sync with the dot alpha", async () => {
    const maxBlurFor = async (intensity: number): Promise<number> => {
      const dotwave = background({
        container: sizedContainer(1200, 800),
        spacing: 40,
        glowBlur: 20,
        intensity,
        opacityThreshold: 0,
      });
      await frames(2);
      dotwave.pause();

      const blurs = recorded()
        .filter((call) => call.method === "shadowBlur")
        .map((call) => call.args[0] as number);

      // The last write of every frame resets the shadow.
      expect(blurs[blurs.length - 1]).toBe(0);
      expect(new Set(blurs).size).toBeGreaterThan(2);

      const peak = Math.max(...blurs);
      expect(peak).toBeLessThanOrEqual(20);
      return peak;
    };

    // Dots can never be brighter than `intensity`, so the glow has to follow:
    // a dimmer background means a weaker blur for the same noise field.
    const dim = await maxBlurFor(0.15);
    const bright = await maxBlurFor(1);

    expect(dim).toBeGreaterThan(0);
    expect(bright).toBeGreaterThan(dim);
  });

  it("draws every cell when the threshold is 0 and culls dim dots otherwise", async () => {
    const cells = 20 * 15;

    const generous = background({ container: sizedContainer(400, 300), spacing: 20, opacityThreshold: 0 });
    await frames(2);
    generous.pause();
    expect(countOf("arc")).toBe(cells * 2);

    resetRecording();

    const strict = background({ container: sizedContainer(400, 300), spacing: 20, opacityThreshold: 0.5 });
    await frames(2);
    strict.pause();
    expect(countOf("arc")).toBeLessThan(cells * 2);
  });

  it("uses the background color and can stay transparent", async () => {
    background({ container: sizedContainer(200, 200), backgroundColor: "#ff0000" });
    await frames(2);
    expect(countOf("fillRect")).toBeGreaterThan(0);

    resetRecording();

    background({ container: sizedContainer(200, 200), backgroundColor: "transparent" });
    await frames(2);
    expect(countOf("clearRect")).toBeGreaterThan(0);
  });

  it("supports square and ring shapes", async () => {
    const square = background({ container: sizedContainer(200, 200), shape: "square" });
    await frames(2);
    square.pause();
    expect(countOf("rect")).toBeGreaterThan(0);
    expect(countOf("arc")).toBe(0);

    resetRecording();

    const ring = background({ container: sizedContainer(200, 200), shape: "ring" });
    await frames(2);
    ring.pause();
    expect(countOf("stroke")).toBeGreaterThan(0);
    expect(countOf("fill")).toBe(0);
  });

  it("keeps every dot in its own subpath when a batch is stroked", async () => {
    const dotwave = background({
      container: sizedContainer(400, 300),
      spacing: 40,
      shape: "ring",
      glowBlur: 0,
      opacityThreshold: 0,
    });
    await frames(2);
    dotwave.pause();

    // Consecutive arcs without a moveTo get joined by a straight line, which
    // fill() hides and stroke() turns into a screen full of streaks.
    const arcs = countOf("arc");
    expect(arcs).toBeGreaterThan(0);
    expect(countOf("moveTo")).toBe(arcs);
  });

  it("changes geometry with sizeVariation", async () => {
    const flat = background({ container: sizedContainer(300, 300), opacityThreshold: 0, sizeVariation: 0 });
    await frames(2);
    flat.pause();
    const flatRadii = new Set(
      recorded()
        .filter((call) => call.method === "arc")
        .map((call) => call.args[2]),
    );
    expect(flatRadii.size).toBe(1);

    resetRecording();

    const varied = background({ container: sizedContainer(300, 300), opacityThreshold: 0, sizeVariation: 1 });
    await frames(2);
    varied.pause();
    const variedRadii = new Set(
      recorded()
        .filter((call) => call.method === "arc")
        .map((call) => call.args[2]),
    );
    expect(variedRadii.size).toBeGreaterThan(1);
  });

  it("keeps a frozen frame when speed is 0", async () => {
    const dotwave = background({ container: sizedContainer(200, 200), speed: 0 });
    await frames(2);
    dotwave.pause();

    const first = recorded()
      .filter((call) => call.method === "arc")
      .map((call) => call.args)
      .slice(0, 20);

    dotwave.play();
    resetRecording();
    await frames(2);
    dotwave.pause();

    const second = recorded()
      .filter((call) => call.method === "arc")
      .map((call) => call.args)
      .slice(0, 20);
    expect(second).toEqual(first);
  });

  it("ignores invalid numbers instead of hanging", async () => {
    const dotwave = background({
      container: sizedContainer(200, 200),
      spacing: Number.NaN,
      dotRadius: Number.POSITIVE_INFINITY,
      noiseScale: Number.NaN,
    });
    await frames(2);
    dotwave.pause();

    expect(countOf("arc")).toBeGreaterThan(0);
  });

  it("stretches the spacing and warns once when the grid would be too dense", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const dotwave = background({ container: sizedContainer(4000, 3000), spacing: 4 });
    await frames(3);
    dotwave.pause();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/spacing/);
    // 4000x3000 at 4px would be 750k dots; the guard keeps it well below that.
    expect(countOf("arc") / 3).toBeLessThan(40_000);
    warn.mockRestore();
  });
});

describe("pointer interaction", () => {
  it("lights up more dots around the cursor", async () => {
    const calm = background({ container: sizedContainer(400, 300), spacing: 20, opacityThreshold: 0.2 });
    await frames(3);
    calm.pause();
    const baseline = countOf("arc") / 3;

    resetRecording();

    const reactive = background({
      container: sizedContainer(400, 300),
      spacing: 20,
      interactive: true,
      opacityThreshold: 0.2,
    });
    pointerMove(200, 150);
    await frames(4);
    reactive.pause();

    expect(countOf("arc") / 4).toBeGreaterThan(baseline);
  });

  it("pushes dots away from the cursor", async () => {
    const dotwave = background({
      container: sizedContainer(400, 300),
      spacing: 40,
      interactive: true,
      pointerRepel: 20,
      opacityThreshold: 0,
    });
    pointerMove(200, 150);
    await frames(2);
    dotwave.pause();

    const positions = recorded()
      .filter((call) => call.method === "arc")
      .map((call) => [call.args[0] as number, call.args[1] as number] as const);

    // The grid anchor nearest the cursor is (200, 150); repulsion moves it.
    const nearest = positions
      .map(([x, y]) => ({ x, y, distance: Math.hypot(x - 200, y - 150) }))
      .sort((a, b) => a.distance - b.distance)[0];

    expect(nearest?.distance).toBeGreaterThan(0);
  });
});

describe("rotated grid", () => {
  it("does not touch the canvas transform when angle is 0", async () => {
    const dotwave = background({ container: sizedContainer(400, 300) });
    await frames(2);
    dotwave.pause();

    expect(countOf("rotate")).toBe(0);
    expect(countOf("arc")).toBeGreaterThan(0);
  });

  it("rotates the canvas around its centre", async () => {
    const dotwave = background({ container: sizedContainer(400, 300), angle: 30 });
    await frames(2);
    dotwave.pause();

    expect(countOf("rotate") / 2).toBe(1);
    expect(countOf("save")).toBeGreaterThan(0);
    expect(countOf("restore")).toBe(countOf("save"));

    const rotate = recorded().find((call) => call.method === "rotate");
    expect(rotate?.args[0]).toBeCloseTo(Math.PI / 6, 6);

    // Origin shifted to the centre, then back, so dots keep their own layout.
    const translations = recorded()
      .filter((call) => call.method === "translate")
      .map((call) => call.args);
    expect(translations[0]).toEqual([200, 150]);
    expect(translations[1]).toEqual([-200, -150]);
  });

  it("covers the corners a rotated grid would otherwise miss", async () => {
    const straight = background({ container: sizedContainer(400, 300), spacing: 40, opacityThreshold: 0 });
    await frames(2);
    straight.pause();
    const straightDots = countOf("arc") / 2;

    resetRecording();

    const tilted = background({ container: sizedContainer(400, 300), spacing: 40, opacityThreshold: 0, angle: 45 });
    await frames(2);
    tilted.pause();

    // At 45 degrees the bounding box grows by ~41%, and it has to, otherwise the
    // corners of the screen end up empty.
    expect(countOf("arc") / 2).toBeGreaterThan(straightDots);
  });

  it("keeps the grid centred and fully covered when the angle changes", async () => {
    const dotwave = background({ container: sizedContainer(400, 300), opacityThreshold: 0 });
    await frames(2);
    dotwave.pause();

    const cellsAt0 = countOf("arc") / 2;

    dotwave.updateOptions({ angle: 90 });
    dotwave.play();
    resetRecording();
    await frames(2);
    dotwave.pause();

    expect(countOf("rotate") / 2).toBe(1);

    const positions = recorded()
      .filter((call) => call.method === "arc")
      .map((call): [number, number] => [call.args[0] as number, call.args[1] as number]);

    // A 400x300 grid turned 90 degrees needs 300x400 of cells to keep covering
    // the screen, which is the same number of cells.
    expect(positions.length / 2).toBe(cellsAt0);

    // ...and it stays anchored on the centre of the canvas.
    const averageX = positions.reduce((total, [x]) => total + x, 0) / positions.length;
    const averageY = positions.reduce((total, [, y]) => total + y, 0) / positions.length;
    expect(averageX).toBeCloseTo(200, 0);
    expect(averageY).toBeCloseTo(150, 0);
  });
});

describe("lifecycle", () => {
  it("pauses and resumes on demand", async () => {
    const dotwave = background({ container: sizedContainer(200, 200) });
    await frames(2);

    dotwave.pause();
    expect(dotwave.running).toBe(false);

    resetRecording();
    await frames(3);
    expect(countOf("arc")).toBe(0);

    dotwave.play();
    expect(dotwave.running).toBe(true);
    await frames(3);
    expect(countOf("arc")).toBeGreaterThan(0);
  });

  it("pauses while the tab is hidden and resumes when it is visible", async () => {
    const dotwave = background({ container: sizedContainer(200, 200) });
    await frames(2);

    setHidden(true);
    expect(dotwave.running).toBe(false);

    setHidden(false);
    expect(dotwave.running).toBe(true);
  });

  it("stays paused on its own after a manual pause", async () => {
    const dotwave = background({ container: sizedContainer(200, 200) });
    dotwave.pause();

    setHidden(true);
    setHidden(false);

    expect(dotwave.running).toBe(false);
  });

  it("reparents and restyles on updateOptions", () => {
    const first = sizedContainer(200, 200);
    const second = sizedContainer(300, 400);
    const dotwave = background({ container: first, position: "absolute", zIndex: 0 });

    dotwave.updateOptions({ container: second, position: "fixed", zIndex: -1 });

    expect(dotwave.canvas.parentElement).toBe(second);
    expect(dotwave.canvas.style.position).toBe("fixed");
    expect(dotwave.canvas.style.zIndex).toBe("-1");
    expect(dotwave.canvas.width).toBe(300);
  });

  it("applies a preset on updateOptions", async () => {
    const dotwave = background({ container: sizedContainer(300, 300) });
    dotwave.updateOptions({ preset: "ember" });
    await frames(2);
    dotwave.pause();

    expect(countOf("rect")).toBeGreaterThan(0);
  });

  it("cleans up completely on destroy", async () => {
    const container = sizedContainer(200, 200);
    const dotwave = background({ container, interactive: true });

    dotwave.destroy();
    expect(container.querySelector("canvas")).toBeNull();
    expect(dotwave.running).toBe(false);

    // Idempotent, and no stray drawing after destroy.
    expect(() => dotwave.destroy()).not.toThrow();
    resetRecording();
    await frames(3);
    expect(countOf("arc")).toBe(0);

    expect(() => dotwave.updateOptions({ speed: 1 })).toThrow(/destroyed/);
    expect(() => dotwave.init()).toThrow(/destroyed/);
  });
});
