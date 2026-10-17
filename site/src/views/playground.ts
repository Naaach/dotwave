import { createDotWave, presets, presetNames, type DotWaveInstance, type DotWaveOptions, type PresetName } from "dotwave";
import { mustQuery } from "../dom";
import type { View } from "../view";

const sliders = ["angle", "spacing", "dotRadius", "noiseScale", "speed", "gamma", "intensity", "sizeVariation"] as const;

/** "255, 255, 255" | "rgb(...)" | "#fff" | "#ffffff" -> "#rrggbb" */
function toHex(value: string): string {
  const text = value.trim();

  if (text.startsWith("#")) {
    const hex = text.slice(1);
    const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
    return "#" + full.slice(0, 6).toLowerCase();
  }

  const numbers = text.match(/\d+/g)?.slice(0, 3) ?? ["255", "255", "255"];
  return "#" + numbers.map((part) => Number(part).toString(16).padStart(2, "0")).join("");
}

function toChannels(hex: string): number[] {
  const full = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

/** "#6ee7b7" -> "110, 231, 183", the format dotColor accepts. */
const toRgbString = (hex: string) => toChannels(hex).join(", ");

/** "#6ee7b7" -> "rgb(110, 231, 183)": backgroundColor must be real CSS. */
const toCssColor = (hex: string) => `rgb(${toChannels(hex).join(", ")})`;

export const playgroundView: View = {
  name: "playground",
  title: "dotwave — animated dotted background",
  description:
    "Interactive playground for dotwave: an animated grid of dots driven by 3D Simplex noise. Tweak every option live.",

  mount(root) {
    const $ = <T extends Element>(selector: string) => mustQuery<T>(root, selector);
    const listeners = new AbortController();
    const { signal } = listeners;

    const presetSelect = $<HTMLSelectElement>("#preset");
    const shapeSelect = $<HTMLSelectElement>("#shape");
    const interactiveInput = $<HTMLInputElement>("#interactive");
    const dotColorInput = $<HTMLInputElement>("#dotColor");
    const backgroundInput = $<HTMLInputElement>("#backgroundColor");
    const toggleButton = $<HTMLButtonElement>("#toggle");
    const fpsLabel = $<HTMLElement>("#fps");

    let wave: DotWaveInstance = createDotWave({ container: $<HTMLElement>(".stage"), preset: "aurora", interactive: true });

    /** Reads a preset (or the live options) into the controls. */
    function sync(options: DotWaveOptions, presetName?: PresetName): void {
      for (const id of sliders) $<HTMLInputElement>(`#${id}`).value = String(options[id] ?? 0);
      shapeSelect.value = options.shape ?? "dot";
      interactiveInput.checked = Boolean(options.interactive);
      if (options.dotColor) dotColorInput.value = toHex(options.dotColor);
      if (options.backgroundColor) backgroundInput.value = toHex(options.backgroundColor);
      presetSelect.value = presetName ?? "custom";
      paint();
    }

    function paint(): void {
      for (const id of sliders) {
        const value = Number($<HTMLInputElement>(`#${id}`).value);
        $(`#${id}Value`).textContent =
          id === "angle"
            ? `${value}°`
            : id === "speed" || id === "noiseScale"
              ? value.toFixed(4)
              : String(value);
      }
    }

    function collect(): DotWaveOptions {
      const next: DotWaveOptions = {
        shape: shapeSelect.value as DotWaveOptions["shape"],
        interactive: interactiveInput.checked,
        dotColor: toRgbString(dotColorInput.value),
        backgroundColor: toCssColor(backgroundInput.value),
      };
      for (const id of sliders) next[id] = Number($<HTMLInputElement>(`#${id}`).value);
      return next;
    }

    /** Any manual change drops back to "custom" and is applied on the spot. */
    function applyCustom(): void {
      presetSelect.value = "custom";
      wave.updateOptions(collect());
    }

    for (const id of sliders) {
      $<HTMLInputElement>(`#${id}`).addEventListener(
        "input",
        () => {
          paint();
          applyCustom();
        },
        { signal },
      );
    }

    shapeSelect.addEventListener("change", applyCustom, { signal });
    interactiveInput.addEventListener("change", applyCustom, { signal });
    dotColorInput.addEventListener("input", applyCustom, { signal });
    backgroundInput.addEventListener("input", applyCustom, { signal });

    for (const name of presetNames) {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      presetSelect.append(option);
    }

    presetSelect.addEventListener(
      "change",
      () => {
        const name = presetSelect.value as PresetName;
        if (!presets[name]) return;
        wave.updateOptions({ preset: name });
        sync(presets[name], name);
      },
      { signal },
    );

    toggleButton.addEventListener(
      "click",
      () => {
        if (wave.running) {
          wave.pause();
          toggleButton.textContent = "Play";
        } else {
          wave.play();
          toggleButton.textContent = "Pause";
        }
      },
      { signal },
    );

    // Proves the point of destroy(): no listeners, no rAF, no canvas left behind.
    $<HTMLButtonElement>("#rebuild").addEventListener(
      "click",
      () => {
        wave.destroy();
        wave = createDotWave({ container: $<HTMLElement>(".stage"), ...collect() });
      },
      { signal },
    );

    let frames = 0;
    let last = performance.now();
    let frame = 0;

    function tick(now: number): void {
      frames += 1;
      if (now - last >= 500) {
        fpsLabel.textContent = `${Math.round((frames * 1000) / (now - last))} fps`;
        frames = 0;
        last = now;
      }
      frame = requestAnimationFrame(tick);
    }

    sync(presets.aurora, "aurora");
    frame = requestAnimationFrame(tick);

    return () => {
      listeners.abort();
      cancelAnimationFrame(frame);
      wave.destroy();
    };
  },
};
