import { vi } from "vitest";

/**
 * jsdom has no canvas implementation, so we install a recording stub. Tests can
 * then assert on what the renderer actually asked the canvas to draw.
 */

export interface RecordedCall {
  method: string;
  args: unknown[];
}

const METHODS = [
  "save",
  "restore",
  "beginPath",
  "closePath",
  "arc",
  "rect",
  "fill",
  "stroke",
  "moveTo",
  "lineTo",
  "fillRect",
  "clearRect",
  "translate",
  "rotate",
  "scale",
] as const;

interface MockContext {
  [key: string]: unknown;
}

const calls: RecordedCall[] = [];

let currentContext: MockContext = createContext();

function createContext(): MockContext {
  const context: MockContext = {
    canvas: null,
    lineWidth: 1,
    shadowColor: "",
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  };

  // Property writes that matter for the render loop are recorded too. shadowBlur
  // stays here purely so a test can prove the library never touches it.
  const record = (name: string, initial: unknown): void => {
    let value = initial;
    Object.defineProperty(context, name, {
      get: () => value,
      set: (next: unknown) => {
        value = next;
        calls.push({ method: name, args: [next] });
      },
    });
  };

  record("shadowBlur", 0);
  record("globalCompositeOperation", "source-over");
  record("globalAlpha", 1);
  record("fillStyle", "");
  record("strokeStyle", "");

  for (const method of METHODS) {
    context[method] = (...args: unknown[]) => {
      calls.push({ method, args });
    };
  }

  return context;
}

HTMLCanvasElement.prototype.getContext = function getContext(
  this: HTMLCanvasElement,
  contextId: string,
) {
  if (contextId !== "2d") return null;
  currentContext = createContext();
  currentContext.canvas = this;
  return currentContext as unknown as CanvasRenderingContext2D;
} as typeof HTMLCanvasElement.prototype.getContext;

vi.stubGlobal("ResizeObserver", undefined);

/** Every canvas call recorded so far. */
export function recorded(): readonly RecordedCall[] {
  return calls;
}

export function lastContext(): MockContext {
  return currentContext;
}

export function resetRecording(): void {
  calls.length = 0;
}

/** Counts how many times a method was called. */
export function countOf(method: string): number {
  return calls.filter((call) => call.method === method).length;
}

/** Waits for `count` animation frames, so the render loop has run. */
export function frames(count = 2): Promise<void> {
  return new Promise((resolve) => {
    let left = count;
    const tick = (): void => {
      left -= 1;
      if (left <= 0) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/** A container with a size, because jsdom does not do layout. */
export function sizedContainer(width = 400, height = 300): HTMLElement {
  const element = document.createElement("div");
  Object.defineProperty(element, "clientWidth", { value: width, configurable: true });
  Object.defineProperty(element, "clientHeight", { value: height, configurable: true });
  document.body.append(element);
  return element;
}
